/**
 * cargo-packer/render/textures.js
 * Procedural canvas-generated textures for cargo boxes, crates, drums, and container walls.
 * Zero external asset dependencies.
 */
(function(exports) {
  'use strict';

  const textureCache = new Map();

  /**
   * Generates a realistic cardboard carton texture with packing tape and shipping label.
   */
  function createCartonTexture(baseColor = '#d97706', label = 'FRAGILE') {
    const key = `carton_${baseColor}_${label}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base cardboard color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Subtle cardboard noise / fiber grain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctx.fillRect(rx, ry, Math.random() * 3 + 1, 1);
    }

    // Edge bevel shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, size - 6, size - 6);

    // Brown packing tape strip across top center
    ctx.fillStyle = 'rgba(180, 130, 80, 0.75)';
    ctx.fillRect(size * 0.40, 0, size * 0.20, size);
    ctx.strokeStyle = 'rgba(140, 95, 50, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(size * 0.40, 0, size * 0.20, size);

    // Shipping barcode label decal
    const lw = 140;
    const lh = 90;
    const lx = size * 0.60;
    const ly = size * 0.60;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, lw, lh);

    // Barcode stripes
    ctx.fillStyle = '#1e293b';
    let bx = lx + 12;
    const by = ly + 14;
    const bh = 34;
    while (bx < lx + lw - 14) {
      const barW = Math.random() > 0.5 ? 4 : 2;
      ctx.fillRect(bx, by, barW, bh);
      bx += barW + (Math.random() > 0.4 ? 3 : 2);
    }

    // Label text
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText(label, lx + 12, ly + 64);
    ctx.font = '8px monospace';
    ctx.fillText('ISO-9001 / PRIORITY', lx + 12, ly + 78);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Generates a wooden shipping crate texture with slats and stencils.
   */
  function createCrateTexture() {
    const key = 'crate_wood';
    if (textureCache.has(key)) return textureCache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Wood base
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, size, size);

    // Horizontal wood planks / slats
    const slatH = size / 5;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#92400e' : '#b45309';
      ctx.fillRect(0, i * slatH, size, slatH);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, i * slatH, size, slatH);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(69, 26, 3, 0.15)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 6; g++) {
        ctx.beginPath();
        const gy = i * slatH + 8 + g * 14;
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(size * 0.3, gy + 4, size * 0.7, gy - 4, size, gy);
        ctx.stroke();
      }

      // Corner bolt / nail marks
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(14, i * slatH + 14, 4, 0, Math.PI * 2);
      ctx.arc(size - 14, i * slatH + 14, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stenciled Umbrella Fragile Symbol
    ctx.fillStyle = 'rgba(28, 25, 23, 0.75)';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☂ FRAGILE', size / 2, size / 2 + 10);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('HEAVY LOAD · ↑ THIS SIDE UP', size / 2, size / 2 + 40);

    const tex = new THREE.CanvasTexture(canvas);
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Generates corrugated metal texture for container walls.
   */
  function createCorrugatedTexture(colorHex = '#1e3a8a') {
    const key = `corrugated_${colorHex}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, size, size);

    // Vertical corrugation ribs
    const ribW = 32;
    for (let x = 0; x < size; x += ribW) {
      // Highlight side of rib
      const grad = ctx.createLinearGradient(x, 0, x + ribW, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, ribW, size);
    }

    // Rust / weathered grunge streaks
    ctx.fillStyle = 'rgba(180, 83, 9, 0.08)';
    for (let i = 0; i < 20; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctx.fillRect(rx, ry, Math.random() * 8 + 2, Math.random() * 60 + 20);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    textureCache.set(key, tex);
    return tex;
  }

  exports.createCartonTexture = createCartonTexture;
  exports.createCrateTexture = createCrateTexture;
  exports.createCorrugatedTexture = createCorrugatedTexture;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
