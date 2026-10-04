/**
 * cargo-packer/core/firstFit.js
 * First-Fit Decreasing (FFD) Shelf / Slab Heuristic for 3D Bin Packing.
 * Baseline greedy approach creating horizontal floor tiers (shelves).
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  const EPS = 1e-4;

  /**
   * First-Fit Shelf / Slab Packing.
   * @param {Array<Object>} rawItems
   * @param {Object} container
   * @param {Object} options
   */
  function packFirstFit(rawItems, container, options = {}) {
    const Collision = (typeof module !== 'undefined' && module.exports) ? require('./collision') : window.CargoPacker;
    const Types = (typeof module !== 'undefined' && module.exports) ? require('./types') : window.CargoPacker;
    const Metrics = (typeof module !== 'undefined' && module.exports) ? require('./metrics') : window.CargoPacker;

    // Sort items by height descending (characteristic of shelf packing)
    const items = rawItems.slice().sort((a, b) => b.h - a.h || (b.w * b.d) - (a.w * a.d));

    const placed = [];
    const unplaced = [];
    const steps = [];

    const unassigned = items.slice();
    let currentY = 0;

    while (unassigned.length > 0 && currentY < container.height - 0.1) {
      let shelfHeight = 0;
      let shelfPlacedCount = 0;

      // Pack rows on the current shelf along Z and X
      let currentZ = 0;

      while (currentZ < container.length - 0.1 && unassigned.length > 0) {
        let rowDepth = 0;
        let cursorX = 0;
        let rowPlacedCount = 0;

        for (let i = 0; i < unassigned.length; i++) {
          const item = unassigned[i];
          const orientations = Types.getOrientations(item.w, item.h, item.d, item.allowedOrientations || 'any');

          let bestFit = null;

          for (let oIdx = 0; oIdx < orientations.length; oIdx++) {
            const ori = orientations[oIdx];

            if (currentY + ori.h > container.height + EPS) continue;
            if (cursorX + ori.w > container.width + EPS) continue;
            if (currentZ + ori.d > container.length + EPS) continue;

            const cand = {
              id: item.id || `box_${placed.length}`,
              name: item.name || `Box ${placed.length + 1}`,
              x: cursorX,
              y: currentY,
              z: currentZ,
              w: ori.w,
              h: ori.h,
              d: ori.d,
              weight: item.weight || 15,
              color: item.color || '#38bdf8',
              category: item.category || 'carton',
              fragile: item.fragile || false,
              rotIndex: ori.rotIndex
            };

            if (Collision.hasCollision(cand, placed)) continue;

            bestFit = cand;
            break;
          }

          if (bestFit) {
            bestFit.supportRatio = currentY <= EPS ? 1.0 : Collision.computeSupport(bestFit, placed).ratio;
            placed.push(bestFit);
            unassigned.splice(i, 1);
            i--;

            shelfPlacedCount++;
            rowPlacedCount++;
            cursorX += bestFit.w;
            if (bestFit.h > shelfHeight) shelfHeight = bestFit.h;
            if (bestFit.d > rowDepth) rowDepth = bestFit.d;

            steps.push({
              stepIndex: steps.length,
              box: Object.assign({}, bestFit),
              chosenEP: { x: bestFit.x, y: bestFit.y, z: bestFit.z },
              candidateEPs: [{ x: cursorX, y: currentY, z: currentZ }],
              remainingCount: unassigned.length
            });

            if (cursorX >= container.width - 0.15) {
              break; // Row in X is filled
            }
          }
        }

        if (rowPlacedCount === 0 || rowDepth <= 0) {
          break;
        }

        currentZ += rowDepth;
      }

      if (shelfPlacedCount === 0 || shelfHeight <= 0) {
        break; // Cannot pack anything on this shelf
      }

      currentY += shelfHeight;
    }

    for (let i = 0; i < unassigned.length; i++) {
      unplaced.push(unassigned[i]);
    }

    const metrics = Metrics.computeMetrics(placed, container);

    return {
      algorithm: 'First-Fit Decreasing (Shelf / Slab)',
      placed: placed,
      unplaced: unplaced,
      steps: steps,
      metrics: metrics,
      container: container
    };
  }

  exports.packFirstFit = packFirstFit;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
