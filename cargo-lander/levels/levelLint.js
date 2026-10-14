// levelLint.js — static design checks for a registerLevel({...}) config.
//
// DOM-free and engine-free (pure geometry over the config), so the same rules
// run in two places:
//   - level-editor.html — the Level Check panel, live as you edit, with a
//     marker on the canvas at each finding;
//   - tests.html — every shipped level must come back with no errors.
//
// Every rule here is a bug that actually shipped (see HISTORY.md, 2026-10-14):
// L8's crusher stood inside a pad, L8's gravity well flung landers off two
// pads, four quick-finish bonuses disagreed with their own text, and three
// new maps were accidentally single-trip missions.
//
// lintLevel(cfg) → [{ severity: 'error' | 'warn' | 'info', rule, msg, x?, y? }]
// (x, y) is a world position to focus when the finding is clicked.

(function () {
  'use strict';

  const LANDER_THRUST = 0.08;   // physics.js — what a well's pull is compared against
  const DEPOT_LOAD = 3;         // game.js updateAutoLoad(): crates per depot visit (basic lander)

  // ── Geometry (mirrors physics/collision.js) ────────────────────────────────
  const ptsOf = poly => (Array.isArray(poly) ? poly : (poly && poly.pts) || []);

  function windingSum(pts) {
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      sum += (b.x - a.x) * (b.y + a.y);
    }
    return sum;
  }

  // Upward-facing floor edges of every polygon, in canonical orientation
  // (same rule as getPolygonSurfaceY: after winding normalisation, an edge
  // running left-to-right is a floor).
  function floorEdges(polys) {
    const out = [];
    for (const poly of polys) {
      const pts = ptsOf(poly);
      const flip = windingSum(pts) > 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if (a.invisibleEdge) continue;
        const p1 = flip ? b : a, p2 = flip ? a : b;
        if (p1.x < p2.x) out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
    }
    return out;
  }
  function allEdges(polys) {
    const out = [];
    for (const poly of polys) {
      const pts = ptsOf(poly);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }
    return out;
  }
  const yOn = (e, x) => e.y1 + (x - e.x1) / (e.x2 - e.x1) * (e.y2 - e.y1);

  // The engine's pad snap: the deepest floor at x (no refY).
  function deepestFloor(floors, x) {
    let best = null;
    for (const e of floors) if (e.x1 <= x && e.x2 >= x) { const y = yOn(e, x); if (best === null || y > best) best = y; }
    return best;
  }
  // Nearest floor at or below refY - 20 (getPolygonSurfaceY's refY rule).
  function floorBelow(floors, x, refY) {
    let best = null;
    for (const e of floors) if (e.x1 <= x && e.x2 >= x) { const y = yOn(e, x); if (y >= refY - 20 && (best === null || y < best)) best = y; }
    return best;
  }
  // Headroom above the floor at (x, floorY): distance to the closest terrain
  // edge overhead. Edges within 8px of the floor are the floor itself (or the
  // polygon's own surface when a pad sits a few px into it), not a ceiling.
  function headroom(edges, x, floorY) {
    let best = Infinity;
    for (const e of edges) {
      const lo = Math.min(e.x1, e.x2), hi = Math.max(e.x1, e.x2);
      if (x <= lo || x >= hi) continue;
      const ey = yOn(e.x1 < e.x2 ? e : { x1: e.x2, y1: e.y2, x2: e.x1, y2: e.y1 }, x);
      if (ey < floorY - 8) best = Math.min(best, floorY - ey);
    }
    return best;
  }
  function insideAny(polys, x, y) {
    for (const poly of polys) {
      const pts = ptsOf(poly);
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i], b = pts[j];
        if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c;
      }
      if (c) return true;
    }
    return false;
  }
  function distToSeg(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2));
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }

  // Pads exactly as physics.js initLevel() builds them.
  function padsOf(cfg, floors) {
    const ps = cfg.padScale || 1;
    const pads = [
      { name: 'HQ', kind: 'start', x: cfg.startX ?? 80, y: cfg.startY, width: cfg.startDepotWidth || Math.round(80 * ps) },
      { name: 'Cargo depot', kind: 'collection', x: cfg.collectionX ?? 280, y: cfg.collectionY, width: cfg.collectionWidth || Math.round(100 * ps) },
      ...(cfg.deliveryHubs || []).map(h => ({ name: h.name || 'Terminal', kind: h.type, x: h.x, y: h.y, width: Math.round((h.width || 80) * ps) })),
    ];
    for (const p of pads) {
      p.snapped = p.y == null;
      if (p.snapped) p.y = deepestFloor(floors, p.x + p.width / 2);
    }
    return pads;
  }

  // Quick-finish text vs. timeGoal (time LEFT on the clock). Same parse as the
  // tests.html check this generalises.
  function quickClaim(text) {
    const t = String(text || '').replace('½', '.5');
    let m;
    if ((m = t.match(/under ([\d.]+)\s*s\b/i))) return { elapsed: +m[1] };
    if ((m = t.match(/under ([\d.]+)\s*min/i))) return { elapsed: +m[1] * 60 };
    if ((m = t.match(/([\d.]+)\+?\s*min(?:ute)?s? remaining/i))) return { left: +m[1] * 60 };
    return null;
  }

  function lintLevel(cfg) {
    const F = [];
    const add = (severity, rule, msg, x, y) => F.push({ severity, rule, msg, x, y });
    const polys = cfg.terrainPolygons || [];
    const floors = floorEdges(polys);
    const edges = allEdges(polys);
    const pads = padsOf(cfg, floors);
    // No polygons: the engine lays a flat floor itself (levelTest), so there
    // is nothing for the pad checks to measure against.
    const hasTerrain = floors.length > 0;

    // ── Pads ────────────────────────────────────────────────────────────────
    for (const p of hasTerrain ? pads : []) {
      const cx = p.x + p.width / 2;
      if (p.y == null) { add('error', 'pad-no-ground', `${p.name} has no terrain under it`, cx, 0); continue; }
      const xs = [p.x + 4, cx, p.x + p.width - 4];
      const ground = xs.map(x => floorBelow(floors, x, p.y));
      if (ground[1] === null || ground[1] - p.y > 30) {
        add('error', 'pad-floating', `${p.name} floats ${ground[1] === null ? 'over nothing' : Math.round(ground[1] - p.y) + 'px above the ground'} — set its y or move it`, cx, p.y);
        continue;
      }
      if (insideAny(polys, cx, p.y - 22)) {
        add('error', 'pad-buried', `${p.name} is buried in terrain${p.snapped ? ' (it snapped to the lowest floor at its x — set an explicit y)' : ''}`, cx, p.y);
        continue;
      }
      // An end with no floor within 30px below the deck is over a drop.
      const supported = ground.map(g => g !== null && g - p.y <= 30);
      const known = ground.filter((g, i) => supported[i]);
      const uneven = Math.max(...known) - Math.min(...known);
      if (supported.includes(false)) add('warn', 'pad-overhang', `${p.name} hangs off the edge of its ledge`, cx, p.y);
      else if (uneven > 14) add('warn', 'pad-uneven', `${p.name} sits on a slope (${Math.round(uneven)}px rise across the pad)`, cx, p.y);
      const room = Math.min(...xs.map((x, i) => supported[i] ? headroom(edges, x, ground[i]) : Infinity));
      if (room < 90) add('warn', 'pad-low-ceiling', `${p.name} has only ${Math.round(room)}px of headroom`, cx, p.y - room / 2);
    }
    for (let i = 0; i < pads.length; i++) for (let j = i + 1; j < pads.length; j++) {
      const a = pads[i], b = pads[j];
      if (a.y == null || b.y == null) continue;
      if (a.x < b.x + b.width && b.x < a.x + a.width && Math.abs(a.y - b.y) < 40) {
        add('error', 'pad-overlap', `${a.name} and ${b.name} overlap`, (Math.max(a.x, b.x) + Math.min(a.x + a.width, b.x + b.width)) / 2, a.y);
      }
    }

    // ── Hazards vs. pads ────────────────────────────────────────────────────
    for (const [hi, h] of (cfg.hazards || []).entries()) {
      const label = `${h.type || 'zone'} hazard #${hi + 1}`;
      const pts = h.pts || [];
      if ((h.type === 'crusher' || h.type === 'laser') && pts.length >= 2) {
        const reach = (h.type === 'crusher' ? (h.thickness || 40) / 2 : (h.thickness || 14)) + 20;
        for (const p of pads) {
          if (p.y == null) continue;
          // Sample the space a landed lander occupies, just above the deck.
          for (let x = p.x; x <= p.x + p.width; x += 8) {
            if (distToSeg(x, p.y - 18, pts[0], pts[1]) < reach) {
              add('error', 'hazard-on-pad', `${label} sweeps through ${p.name} — a landed lander gets hit`, x, p.y - 18);
              break;
            }
          }
        }
        if (h.type === 'crusher') {
          for (const [ei, e] of [pts[0], pts[1]].entries()) {
            // A jaw at rest sits on its endpoint and kills on contact, so the
            // endpoints belong buried in a floor/ceiling, not in open air.
            const nearRock = insideAny(polys, e.x, e.y) || edges.some(s => distToSeg(e.x, e.y, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }) < 12);
            if (!nearRock) add('warn', 'crusher-floating-jaw', `${label}: jaw ${ei + 1} rests in open air — anchor its endpoint in terrain`, e.x, e.y);
          }
        }
      }
      if (h.type === 'gravwell' && pts.length) {
        const radius = h.radius || 200, pull = radius * 1.5;
        const force = Math.max(h.startForce || 1.5, h.endForce ?? h.startForce ?? 1.5);
        // Densify the path the well travels (looped if >2 points).
        const path = [];
        const segs = pts.length > 2 ? pts.length : pts.length - 1;
        for (let i = 0; i < Math.max(segs, 1); i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length] || a;
          for (let t = 0; t <= 1; t += 0.1) path.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        }
        for (const p of pads) {
          if (p.y == null) continue;
          const px = p.x + p.width / 2, py = p.y - 16;
          const d = Math.min(...path.map(q => Math.hypot(q.x - px, q.y - py)));
          if (d >= pull) continue;
          const peak = force * 3.5 * Math.pow(1 - Math.max(d, 15) / pull, 2);   // physics/mechanics.js
          if (peak > LANDER_THRUST * 1.5) {
            add('error', 'well-on-pad', `${label} pulls ${(peak / LANDER_THRUST).toFixed(1)}× full thrust at ${p.name} — a landed lander gets dragged off`, px, py);
          }
        }
      }
    }

    // ── Pickups ─────────────────────────────────────────────────────────────
    for (const c of cfg.collectibles || []) {
      if (insideAny(polys, c.x, c.y)) add('warn', 'pickup-buried', `${c.type} pickup at (${c.x}, ${c.y}) is inside terrain`, c.x, c.y);
    }

    // ── Mission ─────────────────────────────────────────────────────────────
    const hubTypes = new Set((cfg.deliveryHubs || []).map(h => h.type));
    // setupPhysics() can add hubs in code (L9 does), which a static check
    // can't see — skip the hub-coverage rule for those levels.
    for (const t of typeof cfg.setupPhysics === 'function' ? [] : cfg.allowedTypes || []) {
      if (!hubTypes.has(t) && !hubTypes.has('chute')) {
        const depot = pads[1];
        add('error', 'cargo-no-hub', `"${t}" cargo spawns but no hub (or chute) accepts it`, depot.x + depot.width / 2, depot.y ?? 0);
      }
    }
    if ((cfg.targetCargo || 0) <= DEPOT_LOAD && (cfg.allowedTypes || []).length) {
      add('info', 'single-trip', `targetCargo ${cfg.targetCargo}: the depot loads ${DEPOT_LOAD} crates per visit, so one trip can finish the mission`);
    }
    const quick = (cfg.quests || []).find(q => q.id === 'quick');
    if (quick && quick.timeGoal !== undefined && cfg.timeLimit) {
      const c = quickClaim(quick.text);
      const realElapsed = cfg.timeLimit - quick.timeGoal;
      if (!c) add('warn', 'quick-text', `Quick bonus "${quick.text}" doesn't say a time the checker can read`);
      else if (c.elapsed !== undefined && c.elapsed !== realElapsed) add('error', 'quick-mismatch', `Quick bonus says "${quick.text}" but really requires finishing within ${realElapsed}s (timeGoal is time LEFT: ${quick.timeGoal}s of ${cfg.timeLimit}s)`);
      else if (c.left !== undefined && c.left !== quick.timeGoal) add('error', 'quick-mismatch', `Quick bonus says "${quick.text}" but timeGoal leaves ${quick.timeGoal}s`);
      if (quick.timeGoal <= 0 || quick.timeGoal >= cfg.timeLimit) add('error', 'quick-impossible', `Quick bonus timeGoal ${quick.timeGoal}s must be between 0 and the ${cfg.timeLimit}s limit`);
    }
    const order = { error: 0, warn: 1, info: 2 };
    return F.sort((a, b) => order[a.severity] - order[b.severity]);
  }

  const api = { lintLevel };
  if (typeof window !== 'undefined') window.LevelLint = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
