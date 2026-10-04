/**
 * cargo-packer/core/types.js
 * Pure data structures, specs, and orientation utilities.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  // Standard Container Specs (interior dimensions in meters, weights in kg)
  // Coordinates convention:
  // X = Width (side to side, across the container)
  // Y = Height (vertical from floor upwards)
  // Z = Length (longitudinal, 0 = back bulkhead, length = loading doors)
  const CONTAINERS = {
    iso20: {
      id: 'iso20',
      name: '20ft ISO Container',
      width: 2.352,
      height: 2.393,
      length: 5.898,
      volume: 2.352 * 2.393 * 5.898, // ~33.2 m³
      maxPayload: 28200,             // kg
      tareWeight: 2200               // kg
    },
    iso40: {
      id: 'iso40',
      name: '40ft ISO Container',
      width: 2.352,
      height: 2.393,
      length: 12.032,
      volume: 2.352 * 2.393 * 12.032, // ~67.7 m³
      maxPayload: 26700,              // kg
      tareWeight: 3800                // kg
    },
    pallet: {
      id: 'pallet',
      name: 'Standard EUR-Pallet',
      width: 0.80,
      height: 1.80,
      length: 1.20,
      volume: 0.80 * 1.80 * 1.20, // 1.728 m³
      maxPayload: 1500,           // kg
      tareWeight: 25              // kg
    }
  };

  /**
   * Generates all legal rotated bounding dimensions for a box.
   * @param {number} w Width
   * @param {number} h Height
   * @param {number} d Depth/Length
   * @param {string} allowedMode 'any' | 'this_side_up' | 'flat_only'
   * @returns {Array<{w: number, h: number, d: number, rotIndex: number}>}
   */
  function getOrientations(w, h, d, allowedMode = 'any') {
    let raw;
    if (allowedMode === 'this_side_up') {
      // Height stays vertical (Y = h)
      raw = [
        { w: w, h: h, d: d, rotIndex: 0 },
        { w: d, h: h, d: w, rotIndex: 1 }
      ];
    } else {
      // 6 potential spatial orientations
      raw = [
        { w: w, h: h, d: d, rotIndex: 0 },
        { w: w, h: d, d: h, rotIndex: 1 },
        { w: h, h: w, d: d, rotIndex: 2 },
        { w: h, h: d, d: w, rotIndex: 3 },
        { w: d, h: w, d: h, rotIndex: 4 },
        { w: d, h: h, d: w, rotIndex: 5 }
      ];

      if (allowedMode === 'flat_only') {
        // Only allow orientations where the lowest dimension is vertical
        const minDim = Math.min(w, h, d);
        raw = raw.filter(o => Math.abs(o.h - minDim) < 1e-4);
      }
    }

    // Deduplicate orientations (e.g. for cubes or identical dimensions)
    const unique = [];
    for (let i = 0; i < raw.length; i++) {
      const cand = raw[i];
      const exists = unique.some(u =>
        Math.abs(u.w - cand.w) < 1e-4 &&
        Math.abs(u.h - cand.h) < 1e-4 &&
        Math.abs(u.d - cand.d) < 1e-4
      );
      if (!exists) {
        unique.push(cand);
      }
    }

    return unique;
  }

  /**
   * Item constructor
   */
  function createItem(id, name, w, h, d, weight, opts = {}) {
    return {
      id: id,
      name: name,
      w: w,
      h: h,
      d: d,
      volume: +(w * h * d).toFixed(5),
      weight: weight,
      color: opts.color || '#38bdf8',
      category: opts.category || 'carton', // carton, crate, drum, parcel
      allowedOrientations: opts.allowedOrientations || 'any',
      fragile: !!opts.fragile,
      maxTopWeight: opts.maxTopWeight ?? Infinity
    };
  }

  exports.CONTAINERS = CONTAINERS;
  exports.getOrientations = getOrientations;
  exports.createItem = createItem;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
