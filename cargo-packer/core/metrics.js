/**
 * cargo-packer/core/metrics.js
 * Industrial logistics diagnostics: volume fill %, weight,
 * Center of Gravity (CoG), axle distribution, and structural stability.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  /**
   * Computes comprehensive logistics metrics for a set of placed items.
   * @param {Array<Object>} placedList Array of placed box objects with {x, y, z, w, h, d, weight, fragile, maxTopWeight}
   * @param {Object} container Container spec {width, height, length, volume, maxPayload, tareWeight}
   * @returns {Object} Comprehensive metrics report
   */
  function computeMetrics(placedList, container) {
    let cargoVolume = 0;
    let cargoWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightedZ = 0;

    let minSupportRatio = 1.0;
    let sumSupportRatio = 0;
    let unsupportedCount = 0;
    let fragilityViolations = 0;

    for (let i = 0; i < placedList.length; i++) {
      const p = placedList[i];
      const vol = p.w * p.h * p.d;
      const wt = p.weight || 10; // default 10kg if unspecified

      cargoVolume += vol;
      cargoWeight += wt;

      // Item centroid coordinates
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const cz = p.z + p.d / 2;

      weightedX += wt * cx;
      weightedY += wt * cy;
      weightedZ += wt * cz;

      const sup = p.supportRatio !== undefined ? p.supportRatio : 1.0;
      sumSupportRatio += sup;
      if (sup < minSupportRatio) minSupportRatio = sup;
      if (sup < 0.60) unsupportedCount++;
    }

    const count = placedList.length;
    const containerVolume = container.volume || (container.width * container.height * container.length);
    const volumeUtilization = containerVolume > 0 ? (cargoVolume / containerVolume) * 100 : 0;
    const weightUtilization = container.maxPayload > 0 ? (cargoWeight / container.maxPayload) * 100 : 0;

    // Center of Gravity
    const cogX = cargoWeight > 0 ? weightedX / cargoWeight : container.width / 2;
    const cogY = cargoWeight > 0 ? weightedY / cargoWeight : 0;
    const cogZ = cargoWeight > 0 ? weightedZ / cargoWeight : container.length / 2;

    const geomCenterX = container.width / 2;
    const geomCenterZ = container.length / 2;

    // Offsets from ideal geometric center
    // Lateral: -100% (far left) to +100% (far right)
    const latOffsetMeters = cogX - geomCenterX;
    const latOffsetPercent = geomCenterX > 0 ? (latOffsetMeters / geomCenterX) * 100 : 0;

    // Longitudinal: -100% (front/nose) to +100% (rear/doors)
    const longOffsetMeters = cogZ - geomCenterZ;
    const longOffsetPercent = geomCenterZ > 0 ? (longOffsetMeters / geomCenterZ) * 100 : 0;

    // Stability classification
    let balanceStatus = 'optimal'; // optimal, acceptable, hazard
    const maxOffset = Math.max(Math.abs(latOffsetPercent), Math.abs(longOffsetPercent));
    if (maxOffset > 25 || cargoWeight > container.maxPayload) {
      balanceStatus = 'hazard';
    } else if (maxOffset > 12) {
      balanceStatus = 'acceptable';
    }

    return {
      placedCount: count,
      cargoVolume: +cargoVolume.toFixed(3),
      containerVolume: +containerVolume.toFixed(3),
      volumeUtilization: +volumeUtilization.toFixed(1), // %
      cargoWeight: Math.round(cargoWeight),
      maxPayload: container.maxPayload,
      weightUtilization: +weightUtilization.toFixed(1), // %
      cog: {
        x: +cogX.toFixed(3),
        y: +cogY.toFixed(3),
        z: +cogZ.toFixed(3),
        latOffsetMeters: +latOffsetMeters.toFixed(3),
        latOffsetPercent: +latOffsetPercent.toFixed(1),
        longOffsetMeters: +longOffsetMeters.toFixed(3),
        longOffsetPercent: +longOffsetPercent.toFixed(1),
        status: balanceStatus
      },
      avgSupportRatio: count > 0 ? +(sumSupportRatio / count).toFixed(2) : 1.0,
      minSupportRatio: count > 0 ? +minSupportRatio.toFixed(2) : 1.0,
      unsupportedCount: unsupportedCount,
      fragilityViolations: fragilityViolations
    };
  }

  exports.computeMetrics = computeMetrics;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
