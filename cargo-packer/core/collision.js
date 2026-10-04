/**
 * cargo-packer/core/collision.js
 * Geometric collision, containment, and physical support primitives.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  const EPS = 1e-4;

  /**
   * Tests whether two 3D axis-aligned bounding boxes overlap.
   * Touching faces/edges (within EPS) do NOT count as collision.
   * @param {{x: number, y: number, z: number, w: number, h: number, d: number}} b1
   * @param {{x: number, y: number, z: number, w: number, h: number, d: number}} b2
   * @returns {boolean}
   */
  function intersectAABB(b1, b2, eps = EPS) {
    if (b1.x + b1.w - eps <= b2.x || b1.x >= b2.x + b2.w - eps) return false;
    if (b1.y + b1.h - eps <= b2.y || b1.y >= b2.y + b2.h - eps) return false;
    if (b1.z + b1.d - eps <= b2.z || b1.z >= b2.z + b2.d - eps) return false;
    return true;
  }

  /**
   * Tests whether a box fits completely within container boundaries.
   * @param {{x: number, y: number, z: number, w: number, h: number, d: number}} box
   * @param {{width: number, height: number, length: number}} container
   * @returns {boolean}
   */
  function insideContainer(box, container, eps = EPS) {
    return (
      box.x >= -eps &&
      box.y >= -eps &&
      box.z >= -eps &&
      box.x + box.w <= container.width + eps &&
      box.y + box.h <= container.height + eps &&
      box.z + box.d <= container.length + eps
    );
  }

  /**
   * Checks whether candidate placement collides with any already-placed boxes.
   * @param {Object} candidate
   * @param {Array<Object>} placedList
   * @returns {boolean}
   */
  function hasCollision(candidate, placedList, eps = EPS) {
    for (let i = 0; i < placedList.length; i++) {
      if (intersectAABB(candidate, placedList[i], eps)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Computes the support ratio of a candidate box.
   * If on the floor (y <= eps), support is 1.0 (100%).
   * Otherwise, calculates fraction of bottom surface area resting on top of other boxes.
   * @param {Object} candidate
   * @param {Array<Object>} placedList
   * @returns {{ratio: number, supportedArea: number, baseArea: number, floorContact: boolean}}
   */
  function computeSupport(candidate, placedList, eps = EPS) {
    const baseArea = candidate.w * candidate.d;
    if (baseArea <= 0) {
      return { ratio: 0, supportedArea: 0, baseArea: 0, floorContact: false };
    }

    // Direct floor contact
    if (candidate.y <= eps) {
      return { ratio: 1.0, supportedArea: baseArea, baseArea: baseArea, floorContact: true };
    }

    let supportedArea = 0;
    const candBottom = candidate.y;

    for (let i = 0; i < placedList.length; i++) {
      const p = placedList[i];
      const pTop = p.y + p.h;

      // Check if placed box's top face matches candidate bottom face
      if (Math.abs(pTop - candBottom) <= eps) {
        // Compute overlap rectangle on X-Z plane
        const xOverlap = Math.max(0, Math.min(candidate.x + candidate.w, p.x + p.w) - Math.max(candidate.x, p.x));
        const zOverlap = Math.max(0, Math.min(candidate.z + candidate.d, p.z + p.d) - Math.max(candidate.z, p.z));

        supportedArea += xOverlap * zOverlap;
      }
    }

    const ratio = Math.min(1.0, supportedArea / baseArea);
    return {
      ratio: ratio,
      supportedArea: supportedArea,
      baseArea: baseArea,
      floorContact: false
    };
  }

  /**
   * Calculates total contact area between candidate and all adjacent surfaces
   * (container walls, floor, and adjacent box faces). Useful for packing compactness.
   * @param {Object} candidate
   * @param {Array<Object>} placedList
   * @param {Object} container
   * @returns {number} square meters of contact
   */
  function computeContactArea(candidate, placedList, container, eps = EPS) {
    let contact = 0;

    // Contact with container floor and walls
    if (candidate.y <= eps) contact += candidate.w * candidate.d; // floor
    if (candidate.x <= eps) contact += candidate.h * candidate.d; // left wall
    if (Math.abs(candidate.x + candidate.w - container.width) <= eps) contact += candidate.h * candidate.d; // right wall
    if (candidate.z <= eps) contact += candidate.w * candidate.h; // back wall
    if (Math.abs(candidate.z + candidate.d - container.length) <= eps) contact += candidate.w * candidate.h; // front door

    // Contact with placed boxes
    for (let i = 0; i < placedList.length; i++) {
      const p = placedList[i];

      // Top/bottom contact
      if (Math.abs(candidate.y - (p.y + p.h)) <= eps || Math.abs((candidate.y + candidate.h) - p.y) <= eps) {
        const ox = Math.max(0, Math.min(candidate.x + candidate.w, p.x + p.w) - Math.max(candidate.x, p.x));
        const oz = Math.max(0, Math.min(candidate.z + candidate.d, p.z + p.d) - Math.max(candidate.z, p.z));
        contact += ox * oz;
      }
      // Left/right contact (X face)
      if (Math.abs(candidate.x - (p.x + p.w)) <= eps || Math.abs((candidate.x + candidate.w) - p.x) <= eps) {
        const oy = Math.max(0, Math.min(candidate.y + candidate.h, p.y + p.h) - Math.max(candidate.y, p.y));
        const oz = Math.max(0, Math.min(candidate.z + candidate.d, p.z + p.d) - Math.max(candidate.z, p.z));
        contact += oy * oz;
      }
      // Front/back contact (Z face)
      if (Math.abs(candidate.z - (p.z + p.d)) <= eps || Math.abs((candidate.z + candidate.d) - p.z) <= eps) {
        const ox = Math.max(0, Math.min(candidate.x + candidate.w, p.x + p.w) - Math.max(candidate.x, p.x));
        const oy = Math.max(0, Math.min(candidate.y + candidate.h, p.y + p.h) - Math.max(candidate.y, p.y));
        contact += ox * oy;
      }
    }

    return contact;
  }

  exports.intersectAABB = intersectAABB;
  exports.insideContainer = insideContainer;
  exports.hasCollision = hasCollision;
  exports.computeSupport = computeSupport;
  exports.computeContactArea = computeContactArea;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
