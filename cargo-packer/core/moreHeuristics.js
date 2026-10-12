/**
 * cargo-packer/core/moreHeuristics.js
 * Four more loaders, from a published classic down to the deliberately bad:
 *
 *   - Deepest-Bottom-Left (Karabulut & İnceoğlu, 2004): every box goes to the
 *     deepest, then lowest, then left-most spot it fits. Good.
 *   - Next-Fit: takes the manifest in the order it arrives and never looks back
 *     at a row or layer it has left. Shows what sorting buys you.
 *   - Floor Only: one layer, no stacking, no turning boxes. Bad.
 *   - Random Drop: random order, random spot, lowered until it lands. Terrible,
 *     but still physical: boxes rest on something and never overlap.
 *
 * All four obey the same rules as the others (inside the container, no
 * overlap, ≥ minSupportRatio of the base supported) and are deterministic.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  const EPS = 1e-4;

  function lib() {
    if (typeof module !== 'undefined' && module.exports) {
      return Object.assign({}, require('./types'), require('./collision'), require('./metrics'));
    }
    return window.CargoPacker;
  }

  /** A placed box: the item's identity plus where and how it went in. */
  function place(item, ori, x, y, z, index) {
    return {
      id: item.id || `box_${index}`,
      name: item.name || `Box ${index + 1}`,
      x: x, y: y, z: z,
      w: ori.w, h: ori.h, d: ori.d,
      weight: item.weight || 15,
      color: item.color || '#38bdf8',
      category: item.category || 'carton',
      boxStyle: item.boxStyle,
      fragile: item.fragile || false,
      rotIndex: ori.rotIndex
    };
  }

  /** Inside, not overlapping, and supported well enough to stay put. */
  function admissible(CP, cand, placed, container, minSupport) {
    if (!CP.insideContainer(cand, container)) return false;
    if (CP.hasCollision(cand, placed)) return false;
    const support = CP.computeSupport(cand, placed);
    if (support.ratio < minSupport) return false;
    cand.supportRatio = support.ratio;
    return true;
  }

  function finish(CP, name, placed, unplaced, steps, container) {
    return {
      algorithm: name,
      placed: placed,
      unplaced: unplaced,
      steps: steps,
      metrics: CP.computeMetrics(placed, container),
      container: container
    };
  }

  function step(steps, box, candidates, remaining) {
    steps.push({
      stepIndex: steps.length,
      box: Object.assign({}, box),
      chosenEP: { x: box.x, y: box.y, z: box.z },
      candidateEPs: candidates,
      remainingCount: remaining
    });
  }

  // ── Deepest-Bottom-Left ────────────────────────────────────────────────

  /**
   * Candidate corners are the origin plus three corners of every placed box;
   * each box takes the admissible (corner, orientation) with the smallest
   * (z, y, x). Unlike Extreme Points there is no projection and no contact
   * score: the rule is purely "as deep, then as low, then as far left".
   */
  function packDeepestBottomLeft(rawItems, container, options = {}) {
    const CP = lib();
    const minSupport = options.minSupportRatio !== undefined ? options.minSupportRatio : 0.60;
    const items = rawItems.slice().sort((a, b) => (b.w * b.h * b.d) - (a.w * a.h * a.d));

    const placed = [];
    const unplaced = [];
    const steps = [];
    let corners = [{ x: 0, y: 0, z: 0 }];

    items.forEach((item, i) => {
      const oris = CP.getOrientations(item.w, item.h, item.d, item.allowedOrientations || 'any');
      let best = null;
      for (const c of corners) {
        // Corners are kept sorted by (z, y, x): once one beats every later
        // corner on depth, nothing after it can win.
        if (best && c.z > best.z + EPS) break;
        for (const ori of oris) {
          const cand = place(item, ori, c.x, c.y, c.z, i);
          if (!admissible(CP, cand, placed, container, minSupport)) continue;
          if (!best ||
              cand.z < best.z - EPS ||
              (Math.abs(cand.z - best.z) <= EPS && (cand.y < best.y - EPS ||
                (Math.abs(cand.y - best.y) <= EPS && cand.x < best.x - EPS)))) {
            best = cand;
          }
        }
      }

      if (!best) {
        unplaced.push(item);
        return;
      }

      const snapshot = corners.map(c => ({ x: c.x, y: c.y, z: c.z }));
      placed.push(best);
      corners = corners.concat([
        { x: best.x + best.w, y: best.y, z: best.z },
        { x: best.x, y: best.y + best.h, z: best.z },
        { x: best.x, y: best.y, z: best.z + best.d }
      ]).filter(c =>
        c.x < container.width - EPS && c.y < container.height - EPS && c.z < container.length - EPS &&
        !placed.some(p =>
          c.x >= p.x - EPS && c.x < p.x + p.w - EPS &&
          c.y >= p.y - EPS && c.y < p.y + p.h - EPS &&
          c.z >= p.z - EPS && c.z < p.z + p.d - EPS)
      );
      // Deduplicate and keep in (z, y, x) order
      const seen = new Set();
      corners = corners.filter(c => {
        const k = `${c.x.toFixed(4)},${c.y.toFixed(4)},${c.z.toFixed(4)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).sort((a, b) => (a.z - b.z) || (a.y - b.y) || (a.x - b.x));

      step(steps, best, snapshot, items.length - placed.length);
    });

    return finish(CP, 'Deepest-Bottom-Left', placed, unplaced, steps, container);
  }

  // ── Next-Fit ───────────────────────────────────────────────────────────

  /**
   * Shelf loading in arrival order with no going back: a box goes next to the
   * last one if it fits, else it starts a new row, else a new layer. A row or
   * layer once left is closed for good, and a box that fits nowhere from the
   * current position is left behind. No sorting, so a small box early on can
   * set a row depth that wastes everything behind it.
   */
  function packNextFit(rawItems, container, options = {}) {
    const CP = lib();
    const minSupport = options.minSupportRatio !== undefined ? options.minSupportRatio : 0.60;
    const items = rawItems.slice(); // deliberately unsorted

    const placed = [];
    const unplaced = [];
    const steps = [];

    let cursorX = 0;
    let rowZ = 0;
    let rowDepth = 0;
    let layerY = 0;
    let layerTop = 0;

    // The first orientation that fits at the cursor of the current row
    const tryHere = (item, i) => {
      const oris = CP.getOrientations(item.w, item.h, item.d, item.allowedOrientations || 'any');
      for (const ori of oris) {
        if (cursorX + ori.w > container.width + EPS || rowZ + ori.d > container.length + EPS) continue;
        const y = CP.restingHeight(cursorX, rowZ, ori.w, ori.d, placed);
        if (y > layerY + EPS) continue; // would sit above this layer
        const cand = place(item, ori, cursorX, y, rowZ, i);
        if (admissible(CP, cand, placed, container, minSupport)) return cand;
      }
      return null;
    };

    items.forEach((item, i) => {
      let box = tryHere(item, i);
      if (!box && rowDepth > 0) {
        // New row in this layer
        rowZ += rowDepth; cursorX = 0; rowDepth = 0;
        box = tryHere(item, i);
      }
      if (!box && layerTop > layerY + EPS) {
        // New layer
        layerY = layerTop; rowZ = 0; cursorX = 0; rowDepth = 0;
        box = tryHere(item, i);
      }
      if (!box) {
        unplaced.push(item);
        return;
      }
      placed.push(box);
      cursorX += box.w;
      rowDepth = Math.max(rowDepth, box.d);
      layerTop = Math.max(layerTop, box.y + box.h);
      step(steps, box, [{ x: cursorX, y: layerY, z: rowZ }], items.length - placed.length - unplaced.length);
    });

    return finish(CP, 'Next-Fit (Unsorted)', placed, unplaced, steps, container);
  }

  // ── Floor Only ─────────────────────────────────────────────────────────

  /**
   * Every box on the floor, the way it is listed (no turning), bottom-left on
   * the floor plan: candidate spots are the floor corners beside and in front
   * of placed boxes, taking the deepest then left-most. Nothing is stacked, so
   * once the floor is covered the rest stays on the dock.
   */
  function packFloorOnly(rawItems, container, options = {}) {
    const CP = lib();
    const items = rawItems.slice().sort((a, b) => (b.w * b.d) - (a.w * a.d));

    const placed = [];
    const unplaced = [];
    const steps = [];
    let spots = [{ x: 0, y: 0, z: 0 }];

    items.forEach((item, i) => {
      // As listed: rotIndex 0 is the item's own w × h × d
      const ori = { w: item.w, h: item.h, d: item.d, rotIndex: 0 };
      let best = null;
      for (const s of spots) {
        const cand = place(item, ori, s.x, 0, s.z, i);
        if (!admissible(CP, cand, placed, container, 1)) continue;
        if (!best || cand.z < best.z - EPS || (Math.abs(cand.z - best.z) <= EPS && cand.x < best.x)) best = cand;
      }
      if (!best) {
        unplaced.push(item);
        return;
      }
      const snapshot = spots.map(s => ({ x: s.x, y: 0, z: s.z }));
      placed.push(best);
      spots = spots.concat([
        { x: best.x + best.w, y: 0, z: best.z },
        { x: best.x, y: 0, z: best.z + best.d }
      ]).filter(s => s.x < container.width - EPS && s.z < container.length - EPS &&
        !placed.some(p => s.x >= p.x - EPS && s.x < p.x + p.w - EPS && s.z >= p.z - EPS && s.z < p.z + p.d - EPS));
      step(steps, best, snapshot, items.length - placed.length - unplaced.length);
    });

    return finish(CP, 'Floor Only (No Stacking)', placed, unplaced, steps, container);
  }

  // ── Random Drop ────────────────────────────────────────────────────────

  /** Small seeded PRNG (mulberry32), so a run is the same every time. */
  function prng(seed) {
    let a = seed >>> 0;
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Shuffled order; each box tries up to `attempts` random spots and turns,
   * is lowered onto whatever is below, and stays at the first spot where it
   * fits and is supported. Gaps everywhere, and plenty left behind.
   */
  function packRandomDrop(rawItems, container, options = {}) {
    const CP = lib();
    const minSupport = options.minSupportRatio !== undefined ? options.minSupportRatio : 0.60;
    const attempts = options.attempts || 40;
    const rand = prng(options.seed !== undefined ? options.seed : 0xC0FFEE + rawItems.length);

    const items = rawItems.slice();
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    const placed = [];
    const unplaced = [];
    const steps = [];
    const grid = 0.05; // drop spots snap to 5 cm

    items.forEach((item, i) => {
      const oris = CP.getOrientations(item.w, item.h, item.d, item.allowedOrientations || 'any');
      let box = null;
      const tried = [];
      for (let a = 0; a < attempts && !box; a++) {
        const ori = oris[Math.floor(rand() * oris.length)];
        const x = Math.floor(rand() * Math.max(0, container.width - ori.w) / grid) * grid;
        const z = Math.floor(rand() * Math.max(0, container.length - ori.d) / grid) * grid;
        const y = CP.restingHeight(x, z, ori.w, ori.d, placed);
        tried.push({ x: x, y: y, z: z });
        const cand = place(item, ori, x, y, z, i);
        if (admissible(CP, cand, placed, container, minSupport)) box = cand;
      }
      if (!box) {
        unplaced.push(item);
        return;
      }
      placed.push(box);
      step(steps, box, tried.slice(-12), items.length - placed.length - unplaced.length);
    });

    return finish(CP, 'Random Drop', placed, unplaced, steps, container);
  }

  exports.packDeepestBottomLeft = packDeepestBottomLeft;
  exports.packNextFit = packNextFit;
  exports.packFloorOnly = packFloorOnly;
  exports.packRandomDrop = packRandomDrop;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
