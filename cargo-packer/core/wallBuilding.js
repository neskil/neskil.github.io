/**
 * cargo-packer/core/wallBuilding.js
 * Wall-Building (Layer-by-Layer, Back-to-Front) Heuristic for Container Loading.
 * Emulates industrial maritime stevedore packing: builds stable vertical transverse walls
 * across the container width before advancing along the length.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  const EPS = 1e-4;

  /**
   * Wall Building Packing Heuristic.
   * @param {Array<Object>} rawItems
   * @param {Object} container
   * @param {Object} options
   */
  function packWallBuilding(rawItems, container, options = {}) {
    const Collision = (typeof module !== 'undefined' && module.exports) ? require('./collision') : window.CargoPacker;
    const Types = (typeof module !== 'undefined' && module.exports) ? require('./types') : window.CargoPacker;
    const Metrics = (typeof module !== 'undefined' && module.exports) ? require('./metrics') : window.CargoPacker;

    const minSupportRatio = options.minSupportRatio !== undefined ? options.minSupportRatio : 0.60;
    // Sort items by depth/volume to establish coherent wall thicknesses
    const items = rawItems.slice().sort((a, b) => (b.w * b.h * b.d) - (a.w * a.h * a.d));

    const placed = [];
    const unplaced = [];
    const steps = [];

    const unassigned = items.slice();
    let currentZ = 0;

    while (unassigned.length > 0 && currentZ < container.length - 0.2) {
      // 1. Determine target wall depth based on the largest remaining prominent item
      let wallDepth = 0;
      for (let i = 0; i < unassigned.length; i++) {
        const it = unassigned[i];
        const oris = Types.getOrientations(it.w, it.h, it.d, it.allowedOrientations || 'any');
        for (let o = 0; o < oris.length; o++) {
          if (oris[o].d > wallDepth && currentZ + oris[o].d <= container.length + EPS) {
            wallDepth = oris[o].d;
          }
        }
        if (wallDepth > 0) break;
      }

      if (wallDepth <= 0) break; // Cannot fit any remaining item along length

      let wallPlacedCount = 0;
      let wallMaxZ = currentZ;

      // Pack the current wall slice in (X, Y) tiers
      let tierY = 0;

      while (tierY < container.height - 0.1) {
        let cursorX = 0;
        let tierHeight = 0;
        let tierPlacedCount = 0;

        for (let i = 0; i < unassigned.length; i++) {
          const item = unassigned[i];
          const orientations = Types.getOrientations(item.w, item.h, item.d, item.allowedOrientations || 'any');

          let bestFit = null;

          for (let oIdx = 0; oIdx < orientations.length; oIdx++) {
            const ori = orientations[oIdx];

            // Item depth should fit reasonably within wall depth (e.g. within 30% or exact)
            if (ori.d > wallDepth * 1.35 || currentZ + ori.d > container.length + EPS) continue;
            if (cursorX + ori.w > container.width + EPS) continue;
            if (tierY + ori.h > container.height + EPS) continue;

            const cand = {
              id: item.id || `box_${placed.length}`,
              name: item.name || `Box ${placed.length + 1}`,
              x: cursorX,
              y: tierY,
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

            const support = Collision.computeSupport(cand, placed);
            if (support.ratio < minSupportRatio) continue;

            cand.supportRatio = support.ratio;
            bestFit = cand;
            break;
          }

          if (bestFit) {
            placed.push(bestFit);
            unassigned.splice(i, 1);
            i--; // adjust index

            wallPlacedCount++;
            tierPlacedCount++;
            cursorX += bestFit.w;
            if (bestFit.h > tierHeight) tierHeight = bestFit.h;
            if (bestFit.z + bestFit.d > wallMaxZ) wallMaxZ = bestFit.z + bestFit.d;

            steps.push({
              stepIndex: steps.length,
              box: Object.assign({}, bestFit),
              chosenEP: { x: bestFit.x, y: bestFit.y, z: bestFit.z },
              candidateEPs: [{ x: cursorX, y: tierY, z: currentZ }],
              remainingCount: unassigned.length
            });

            if (cursorX >= container.width - 0.15) {
              break; // Row is full
            }
          }
        }

        if (tierPlacedCount === 0 || tierHeight <= 0) {
          break; // Cannot pack anything more on this wall
        }

        tierY += tierHeight;
      }

      if (wallPlacedCount === 0) {
        // Could not pack any items in this wall slice; break to avoid infinite loop
        break;
      }

      currentZ = Math.max(currentZ + wallDepth * 0.8, wallMaxZ);
    }

    // Remaining items that couldn't be packed
    for (let i = 0; i < unassigned.length; i++) {
      unplaced.push(unassigned[i]);
    }

    const metrics = Metrics.computeMetrics(placed, container);

    return {
      algorithm: 'Wall-Building (Layer by Layer)',
      placed: placed,
      unplaced: unplaced,
      steps: steps,
      metrics: metrics,
      container: container
    };
  }

  exports.packWallBuilding = packWallBuilding;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
