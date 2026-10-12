/**
 * cargo-packer/core/extremePoints.js
 * Extreme Point (EP) Heuristic for 3D Bin Packing.
 * Based on Crainic et al. and Wu et al. algorithms with projection and support validation.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  const EPS = 1e-4;

  /**
   * Checks if a 3D coordinate lies strictly inside any placed box.
   */
  function isPointInsideAnyBox(pt, placedList) {
    for (let i = 0; i < placedList.length; i++) {
      const b = placedList[i];
      if (
        pt.x >= b.x && pt.x < b.x + b.w - EPS &&
        pt.y >= b.y && pt.y < b.y + b.h - EPS &&
        pt.z >= b.z && pt.z < b.z + b.d - EPS
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sorts candidate Extreme Points.
   * Standard ordering: back-to-front (Z ascending), bottom-to-top (Y ascending), left-to-right (X ascending).
   */
  function sortExtremePoints(points) {
    return points.slice().sort((a, b) => {
      if (Math.abs(a.z - b.z) > EPS) return a.z - b.z;
      if (Math.abs(a.y - b.y) > EPS) return a.y - b.y;
      return a.x - b.x;
    });
  }

  /**
   * Generates new Extreme Points when a box is placed, applying projection.
   * @param {Object} placedBox Newly placed box {x, y, z, w, h, d}
   * @param {Array<Object>} currentEPs Current list of active EPs
   * @param {Array<Object>} placedList All placed boxes so far
   * @param {Object} container Container specs
   * @returns {Array<{x: number, y: number, z: number}>} Updated EPs
   */
  function updateExtremePoints(placedBox, currentEPs, placedList, container) {
    const b = placedBox;
    const candidates = [];

    // 1. Initial 3 orthogonal corner points from the new box
    candidates.push({ x: b.x + b.w, y: b.y, z: b.z });
    candidates.push({ x: b.x, y: b.y + b.h, z: b.z });
    candidates.push({ x: b.x, y: b.y, z: b.z + b.d });

    // 2. Projections onto surrounding box surfaces (Crainic / Wu projection step)
    for (let i = 0; i < placedList.length; i++) {
      const other = placedList[i];
      if (other === b) continue;

      // Projection along X
      if (other.x + other.w <= b.x + EPS && other.y + other.h > b.y && other.z + other.d > b.z) {
        candidates.push({ x: b.x + b.w, y: other.y + other.h, z: b.z });
        candidates.push({ x: b.x + b.w, y: b.y, z: other.z + other.d });
      }

      // Projection along Y
      if (other.y + other.h <= b.y + EPS && other.x + other.w > b.x && other.z + other.d > b.z) {
        candidates.push({ x: other.x + other.w, y: b.y + b.h, z: b.z });
        candidates.push({ x: b.x, y: b.y + b.h, z: other.z + other.d });
      }

      // Projection along Z
      if (other.z + other.d <= b.z + EPS && other.x + other.w > b.x && other.y + other.h > b.y) {
        candidates.push({ x: other.x + other.w, y: b.y, z: b.z + b.d });
        candidates.push({ x: b.x, y: other.y + other.h, z: b.z + b.d });
      }
    }

    // Merge existing EPs and new candidates
    const combined = currentEPs.concat(candidates);
    const valid = [];
    // Dedup index: rounded 1e-4 grid cell -> kept points. A point within EPS
    // of a kept one lies in the same or a neighbouring cell, so checking the
    // 27 cells around it is the same test as scanning the whole list.
    // Numeric keys (cells are offset to stay non-negative) spare the garbage
    // collector thousands of strings per placement.
    const cells = new Map();
    const cellKey = (x, y, z) => ((x + 4) * 40000 + (y + 4)) * 200000 + (z + 4);
    const toCell = v => Math.round(v * 1e4);

    // Floor-plan bucket grid of the placed boxes, so a point is only tested
    // against boxes whose footprint covers its cell. A box containing the
    // point always covers the point's cell, so the answer is unchanged.
    const GRID = 0.5;
    const nx = Math.ceil(container.width / GRID) + 1;
    const buckets = new Map();
    placedList.forEach(p => {
      for (let gx = Math.floor(p.x / GRID); gx <= Math.floor((p.x + p.w) / GRID); gx++) {
        for (let gz = Math.floor(p.z / GRID); gz <= Math.floor((p.z + p.d) / GRID); gz++) {
          const k = gz * nx + gx;
          if (!buckets.has(k)) buckets.set(k, []);
          buckets.get(k).push(p);
        }
      }
    });
    const insidePlaced = pt => {
      const near = buckets.get(Math.floor(pt.z / GRID) * nx + Math.floor(pt.x / GRID));
      return near ? isPointInsideAnyBox(pt, near) : false;
    };

    for (let i = 0; i < combined.length; i++) {
      const pt = combined[i];

      // Must be within container dimensions
      if (
        pt.x < -EPS || pt.x > container.width - EPS ||
        pt.y < -EPS || pt.y > container.height - EPS ||
        pt.z < -EPS || pt.z > container.length - EPS
      ) {
        continue;
      }

      // Must not be inside any placed box. A point that already passed this
      // against every box (in its stored, rounded form) only needs testing
      // against the box placed since.
      const known = i < currentEPs.length && pt.checked;
      if (known ? isPointInsideAnyBox(pt, [b]) : insidePlaced(pt)) {
        continue;
      }

      // Deduplicate. Points kept last time were already deduplicated against
      // each other and come first here, so only new candidates can collide
      // with something already kept.
      const cx = toCell(pt.x), cy = toCell(pt.y), cz = toCell(pt.z);
      let alreadyPresent = false;
      for (let dx = -1; dx <= 1 && !alreadyPresent && i >= currentEPs.length; dx++) {
        for (let dy = -1; dy <= 1 && !alreadyPresent; dy++) {
          for (let dz = -1; dz <= 1 && !alreadyPresent; dz++) {
            const bucket = cells.get(cellKey(cx + dx, cy + dy, cz + dz));
            if (bucket && bucket.some(v =>
              Math.abs(v.x - pt.x) < EPS &&
              Math.abs(v.y - pt.y) < EPS &&
              Math.abs(v.z - pt.z) < EPS)) {
              alreadyPresent = true;
            }
          }
        }
      }

      if (!alreadyPresent) {
        const kept = {
          x: +pt.x.toFixed(4),
          y: +pt.y.toFixed(4),
          z: +pt.z.toFixed(4)
        };
        // A kept existing point was just tested, as stored, against every
        // box; a new one was tested before rounding, so it gets one full
        // re-test next time, exactly as before.
        if (i < currentEPs.length) {
          Object.defineProperty(kept, 'checked', { value: true, enumerable: false });
        }
        valid.push(kept);
        const key = cellKey(toCell(kept.x), toCell(kept.y), toCell(kept.z));
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(kept);
      }
    }

    return sortExtremePoints(valid);
  }

  /**
   * Sorts manifest items before packing.
   */
  function sortItems(items, sortBy = 'volume_desc') {
    const list = items.slice();
    if (sortBy === 'volume_desc') {
      list.sort((a, b) => (b.w * b.h * b.d) - (a.w * a.h * a.d));
    } else if (sortBy === 'height_desc') {
      list.sort((a, b) => b.h - a.h);
    } else if (sortBy === 'weight_desc') {
      list.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    } else if (sortBy === 'base_area_desc') {
      list.sort((a, b) => (b.w * b.d) - (a.w * a.d));
    }
    return list;
  }

  /**
   * Executes the Extreme Point Packing Algorithm.
   * @param {Array<Object>} rawItems List of items to pack
   * @param {Object} container Container specification
   * @param {Object} options Packing options
   * @returns {Object} Full packing result and step-by-step history
   */
  function packExtremePoints(rawItems, container, options = {}) {
    const Collision = (typeof module !== 'undefined' && module.exports) ? require('./collision') : self.CargoPacker;
    const Types = (typeof module !== 'undefined' && module.exports) ? require('./types') : self.CargoPacker;
    const Metrics = (typeof module !== 'undefined' && module.exports) ? require('./metrics') : self.CargoPacker;

    const minSupportRatio = options.minSupportRatio !== undefined ? options.minSupportRatio : 0.60;
    const sortBy = options.sortBy || 'volume_desc';
    const items = sortItems(rawItems, sortBy);

    const placed = [];
    const unplaced = [];
    const steps = [];

    // Initialize with origin point (0, 0, 0)
    let extremePoints = [{ x: 0, y: 0, z: 0 }];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const orientations = Types.getOrientations(item.w, item.h, item.d, item.allowedOrientations || 'any');

      let bestScore = Infinity;
      let bestPlacement = null;
      let bestEPIndex = -1;

      // Evaluate all active Extreme Points
      for (let epIdx = 0; epIdx < extremePoints.length; epIdx++) {
        const ep = extremePoints[epIdx];

        // Evaluate all orientations for this item at this EP
        for (let oIdx = 0; oIdx < orientations.length; oIdx++) {
          const ori = orientations[oIdx];

          // Contact can never exceed the box's own surface, so this is the
          // best score the spot could reach; if it cannot beat the best so
          // far, skip the collision/support/contact work. Same result, far
          // fewer checks on big loads.
          const surface = 2 * (ori.w * ori.h + ori.w * ori.d + ori.h * ori.d);
          if ((ep.z * 1000) + (ep.y * 500) + (ep.x * 100) - (surface * 40) - 1e-6 >= bestScore) continue;

          const cand = {
            id: item.id || `box_${i}`,
            name: item.name || `Box ${i + 1}`,
            x: ep.x,
            y: ep.y,
            z: ep.z,
            w: ori.w,
            h: ori.h,
            d: ori.d,
            weight: item.weight || 15,
            color: item.color || '#38bdf8',
            category: item.category || 'carton',
            boxStyle: item.boxStyle,
            fragile: item.fragile || false,
            rotIndex: ori.rotIndex
          };

          // 1. Boundary check
          if (!Collision.insideContainer(cand, container)) continue;

          // 2. Collision check
          if (Collision.hasCollision(cand, placed)) continue;

          // 3. Support check
          const support = Collision.computeSupport(cand, placed);
          if (support.ratio < minSupportRatio) continue;

          cand.supportRatio = support.ratio;

          // 4. Contact area bonus
          const contact = Collision.computeContactArea(cand, placed, container);

          // 5. Multi-criteria scoring
          // Prioritize: lowest Z (back to front), lowest Y (floor to top), lowest X (left to right), maximize contact
          const score = (cand.z * 1000) + (cand.y * 500) + (cand.x * 100) - (contact * 40);

          if (score < bestScore) {
            bestScore = score;
            bestPlacement = cand;
            bestEPIndex = epIdx;
          }
        }
      }

      if (bestPlacement) {
        placed.push(bestPlacement);

        // Snapshot state for visualizer
        const epSnapshot = Types.snapshotPoints(extremePoints, bestPlacement);
        const epTotal = extremePoints.length;

        // Update EPs with new placement
        extremePoints = updateExtremePoints(bestPlacement, extremePoints, placed, container);

        steps.push({
          stepIndex: steps.length,
          box: Object.assign({}, bestPlacement),
          chosenEP: { x: bestPlacement.x, y: bestPlacement.y, z: bestPlacement.z },
          candidateEPs: epSnapshot,
          candidateCount: epTotal,
          remainingCount: items.length - placed.length
        });
      } else {
        unplaced.push(item);
      }
    }

    const metrics = Metrics.computeMetrics(placed, container);

    return {
      algorithm: 'Extreme Points (EP)',
      placed: placed,
      unplaced: unplaced,
      steps: steps,
      metrics: metrics,
      container: container
    };
  }

  exports.packExtremePoints = packExtremePoints;
  exports.updateExtremePoints = updateExtremePoints;
  exports.sortExtremePoints = sortExtremePoints;

})(typeof module !== 'undefined' && module.exports ? module.exports : (self.CargoPacker = self.CargoPacker || {}));
