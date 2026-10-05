/**
 * cargo-packer/render/textures.js
 * Procedural canvas-generated textures for cargo boxes, crates, drums, and container walls.
 * Produces uniquely distinct, highly detailed industrial logistics visuals.
 * Zero external asset dependencies.
 */
(function(exports) {
  'use strict';

  const textureCache = new Map();

  /**
   * Generates a realistic cardboard carton texture with packing tape, barcodes, and style variations.
   */
  function createCartonTexture(baseColor = '#c29b62', label = 'CARGO', style = 'standard', boxId = '') {
    const key = `carton_${baseColor}_${label}_${style}_${boxId}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 1. Base cardboard background
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // 2. Cardboard paper fiber grain / noise
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let i = 0; i < 3500; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctx.fillRect(rx, ry, Math.random() * 3 + 1, 1);
    }

    // 3. Subtle edge shadow / bevel
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, size - 6, size - 6);

    if (style === 'fragile') {
      // Vivid red/white warning tape diagonally or across top
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 40, size, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ FRAGILE — HANDLE WITH CARE ⚠', size / 2, 76);

      // Glass crack / wineglass icon in center
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(size / 2, 220, 28, 0, Math.PI);
      ctx.moveTo(size / 2, 248);
      ctx.lineTo(size / 2, 290);
      ctx.moveTo(size / 2 - 20, 290);
      ctx.lineTo(size / 2 + 20, 290);
      ctx.stroke();

    } else if (style === 'heavy') {
      // Twin black polypropylene strapping bands
      ctx.fillStyle = '#18181b';
      ctx.fillRect(size * 0.22, 0, 24, size);
      ctx.fillRect(size * 0.72, 0, 24, size);

      // Strapping buckle highlights
      ctx.fillStyle = '#71717a';
      ctx.fillRect(size * 0.22 - 2, size * 0.5 - 10, 28, 20);
      ctx.fillRect(size * 0.72 - 2, size * 0.5 - 10, 28, 20);

      // Heavy Load Warning Placard
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(size * 0.34, size * 0.38, size * 0.32, 70);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HEAVY LOAD', size / 2, size * 0.44);
      ctx.font = '11px monospace';
      ctx.fillText('DO NOT DROP', size / 2, size * 0.48);

    } else if (style === 'ecommerce') {
      // Clean modern e-commerce packing tape with printed logo/arrows
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(size * 0.40, 0, size * 0.20, size);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(size * 0.40, 0, size * 0.20, size);

      // Priority Express banner
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(size * 0.41, 30, size * 0.18, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXPRESS AIR', size / 2, 48);

    } else {
      // Standard brown packing tape down the center
      ctx.fillStyle = 'rgba(180, 130, 80, 0.85)';
      ctx.fillRect(size * 0.40, 0, size * 0.20, size);
      ctx.strokeStyle = 'rgba(130, 85, 40, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(size * 0.40, 0, size * 0.20, size);
    }

    // Shipping barcode label decal
    const lw = 150;
    const lh = 100;
    const lx = size * 0.58;
    const ly = size * 0.62;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, lw, lh);

    // Barcode stripes
    ctx.fillStyle = '#0f172a';
    let bx = lx + 12;
    const by = ly + 14;
    const bh = 36;
    while (bx < lx + lw - 14) {
      const barW = Math.random() > 0.5 ? 4 : 2;
      ctx.fillRect(bx, by, barW, bh);
      bx += barW + (Math.random() > 0.4 ? 3 : 2);
    }

    // Label text & tracking number
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText(label.slice(0, 16), lx + 10, ly + 68);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`TRK-${boxId || Math.floor(Math.random() * 89999 + 10000)}`, lx + 10, ly + 84);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Generates a wooden shipping crate texture with slats, bolts, and stencils.
   */
  function createCrateTexture(style = 'wood_slat') {
    const key = `crate_${style}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Wood base
    ctx.fillStyle = style === 'reinforced' ? '#78350f' : '#b45309';
    ctx.fillRect(0, 0, size, size);

    // Horizontal wood planks / slats
    const slatH = size / 5;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? (style === 'reinforced' ? '#622b07' : '#92400e') : (style === 'reinforced' ? '#78350f' : '#b45309');
      ctx.fillRect(0, i * slatH, size, slatH);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, i * slatH, size, slatH);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(69, 26, 3, 0.2)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 5; g++) {
        ctx.beginPath();
        const gy = i * slatH + 8 + g * 15;
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

    if (style === 'reinforced') {
      // Steel diagonal bracing cross
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.lineTo(size - 10, size - 10);
      ctx.moveTo(size - 10, 10);
      ctx.lineTo(10, size - 10);
      ctx.stroke();

      // Corner metal brackets
      ctx.fillStyle = '#334155';
      const bSize = 60;
      ctx.fillRect(0, 0, bSize, 20);
      ctx.fillRect(0, 0, 20, bSize);
      ctx.fillRect(size - bSize, 0, bSize, 20);
      ctx.fillRect(size - 20, 0, 20, bSize);
      ctx.fillRect(0, size - 20, bSize, 20);
      ctx.fillRect(0, size - bSize, 20, bSize);
      ctx.fillRect(size - bSize, size - 20, bSize, 20);
      ctx.fillRect(size - 20, size - bSize, 20, bSize);
    }

    // Industrial stencils
    ctx.fillStyle = 'rgba(28, 25, 23, 0.85)';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PROJECT CARGO', size / 2, size / 2 - 8);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('↑ THIS SIDE UP ↑', size / 2, size / 2 + 26);
    ctx.font = '14px monospace';
    ctx.fillText('IPPC ISPM-15 COMPLIANT', size / 2, size / 2 + 54);

    const tex = new THREE.CanvasTexture(canvas);
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Generates a realistic industrial steel chemical drum texture with chimes and hazmat placards.
   */
  function createDrumTexture(colorHex = '#475569') {
    const key = `drum_${colorHex}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Drum base metal color
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, size, size);

    // Vertical metal specular highlights
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Raised horizontal reinforcement rolling chimes (ribs)
    const ringY1 = size * 0.35;
    const ringY2 = size * 0.65;
    [ringY1, ringY2].forEach(y => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, y - 8, size, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(0, y - 4, size, 6);
    });

    // Hazmat warning diamond placard
    const dx = size * 0.5;
    const dy = size * 0.5;
    const dRadius = 45;

    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#dc2626'; // Flammable liquid red
    ctx.fillRect(-dRadius, -dRadius, dRadius * 2, dRadius * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(-dRadius + 3, -dRadius + 3, (dRadius - 3) * 2, (dRadius - 3) * 2);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3', dx, dy + 28);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FLAMMABLE', dx, dy - 6);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
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
      const grad = ctx.createLinearGradient(x, 0, x + ribW, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, ribW, size);
    }

    // Weathering streaks
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
  exports.createDrumTexture = createDrumTexture;
  exports.createCorrugatedTexture = createCorrugatedTexture;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
