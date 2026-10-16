// render/decals.js — cosmetic props ("decals") placed by a level.
//
// Level config:
//   decals: [ { type, x, y?, s?, flip?, back?, color?, len?, x2?, y2?, n? } ]
//
//   type  — one of DECAL_TYPES below
//   x, y  — anchor in world px. GROUND props stand on the anchor (they grow
//           upward); HANGING props hang from it (they grow downward); SPAN
//           props run from (x, y) to (x2, y2). Leave y out on a ground prop
//           and it snaps to the terrain surface at x; set `snap: true` to snap
//           to the nearest floor at or below the given y instead (overhangs).
//   s     — scale (default 1)        flip  — mirror horizontally
//   back  — draw behind the terrain (half-buried props, wall fittings)
//   color — accent colour where the type has one (glow, flag, crystal…)
//   len   — length for vine / chain / kelp / cable-ish props
//   n     — count for clusters (mushroom, crystal, barrels, crates)
//
// Purely visual: no physics, no collision. Every prop is procedural Canvas2D
// (no images), seeded from its position so it looks the same every frame and
// every visit, and culled against the camera so a level can carry a lot of
// them. Animated ones (palms, kelp, vines, beacons, lighthouse, gears) read
// Date.now(), never Math.random, so nothing shimmers.
//
// The editor carries `decals` through its round trip verbatim (unknown
// top-level keys are preserved); tests.html validates every level's decals.

const DECAL_TYPES = {
    // ground
    palm: 'ground', cactus: 'ground', bush: 'ground', pine: 'ground', rock: 'ground',
    mushroom: 'ground', kelp: 'ground', coral: 'ground', stalagmite: 'ground',
    crystal: 'ground', bones: 'ground', skull: 'ground', hut: 'ground',
    lighthouse: 'ground', boat: 'ground', flag: 'ground', sign: 'ground',
    lamp: 'ground', barrels: 'ground', crates: 'ground', solar: 'ground',
    dish: 'ground', beacon: 'ground', furnace: 'ground', tank: 'ground',
    hoodoo: 'ground', gear: 'ground', arch: 'ground',
    // hanging
    stalactite: 'hang', vine: 'hang', chain: 'hang', hanglamp: 'hang', ladle: 'hang',
    // spanning
    bridge: 'span', pipe: 'span', cable: 'span', waterfall: 'span',
};

Object.assign(CargoGame.prototype, {

// Resolve anchors once per level (snap to terrain, seed per-prop randomness).
prepareDecals(level) {
    this.decals = [];
    const ph = this.physics;
    for (const d of (level && level.decals) || []) {
        if (!DECAL_TYPES[d.type]) continue;
        const kind = DECAL_TYPES[d.type];
        let y = d.y;
        if (kind === 'ground' && (y === undefined || d.snap)) {
            y = ph.getPolygonSurfaceY(d.x, d.snap ? d.y : undefined);
        }
        const seed = Math.abs(Math.sin(d.x * 12.9898 + (y || 0) * 78.233) * 43758.5453) % 1;
        this.decals.push({ ...d, y, kind, s: d.s || 1, seed });
    }
},

drawDecals(back) {
    if (!this.decals || !this.decals.length) return;
    const ctx = this.ctx;
    const zoom = this.camera.zoom;
    const halfW = this.viewW / 2 / zoom + 260, halfH = this.viewH / 2 / zoom + 260;
    const cx = this.camera.x, cy = this.camera.y;
    const t = Date.now() / 1000;
    for (const d of this.decals) {
        if (!!d.back !== !!back) continue;
        const reach = 220 * d.s;
        const x2 = d.kind === 'span' ? d.x2 : d.x, y2 = d.kind === 'span' ? d.y2 : d.y;
        if (Math.max(d.x, x2) < cx - halfW - reach || Math.min(d.x, x2) > cx + halfW + reach) continue;
        if (Math.max(d.y, y2) < cy - halfH - reach || Math.min(d.y, y2) > cy + halfH + reach) continue;
        const fn = this['_decal_' + d.type];
        if (!fn) continue;
        ctx.save();
        if (d.kind === 'span') {
            fn.call(this, ctx, d, t);
        } else {
            ctx.translate(d.x, d.y);
            ctx.scale(d.flip ? -d.s : d.s, d.s);
            fn.call(this, ctx, d, t);
        }
        ctx.restore();
    }
},

// Soft radial glow (cheap: one gradient, additive-looking alpha).
_decalGlow(ctx, x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
},
_hexRgb(hex, fallback) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return fallback;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
},

// ── Ground: nature ──────────────────────────────────────────────────────────
_decal_palm(ctx, d, t) {
    const sway = Math.sin(t * 1.3 + d.seed * 6) * 0.06;
    const h = 120 + d.seed * 40, lean = 26 + d.seed * 20;
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -h * 0.55, lean, -h); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) {   // trunk rings
        const u = i / 8, px = lean * u * u, py = -h * u;
        ctx.beginPath(); ctx.moveTo(px - 4, py); ctx.lineTo(px + 4, py + 2); ctx.stroke();
    }
    ctx.save(); ctx.translate(lean, -h); ctx.rotate(sway);
    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 6; i++) {
        const a = -Math.PI * 0.95 + i * (Math.PI * 1.1 / 5) + Math.sin(t * 2 + i) * 0.05;
        const L = 62 + (i % 2) * 12;
        const ex = Math.cos(a) * L, ey = Math.sin(a) * L * 0.55 + 22;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(ex * 0.5, ey - 30, ex, ey);
        ctx.quadraticCurveTo(ex * 0.5, ey - 18, 0, 6);
        ctx.fill();
    }
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.arc(-4, 6, 5, 0, 7); ctx.arc(5, 7, 5, 0, 7); ctx.fill();
    ctx.restore();
},
_decal_cactus(ctx, d) {
    const h = 70 + d.seed * 50;
    ctx.strokeStyle = '#3f7d3a'; ctx.lineCap = 'round';
    ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h); ctx.stroke();
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(0, -h * 0.45); ctx.lineTo(-20, -h * 0.45); ctx.lineTo(-20, -h * 0.75); ctx.stroke();
    if (d.seed > 0.35) { ctx.beginPath(); ctx.moveTo(0, -h * 0.6); ctx.lineTo(18, -h * 0.6); ctx.lineTo(18, -h * 0.85); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(-2, -h + 4); ctx.stroke();
    if (d.seed > 0.6) { ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(0, -h - 6, 5, 0, 7); ctx.fill(); }
},
_decal_bush(ctx, d) {
    ctx.fillStyle = d.color || '#1f5f2e';
    for (let i = 0; i < 4; i++) {
        const r = 12 + ((d.seed * 7 + i) % 1) * 8;
        ctx.beginPath(); ctx.arc(-18 + i * 12, -r * 0.7, r, 0, 7); ctx.fill();
    }
},
_decal_pine(ctx, d) {
    const h = 90 + d.seed * 50;
    ctx.fillStyle = '#4a3220'; ctx.fillRect(-4, -14, 8, 14);
    ctx.fillStyle = d.color || '#14532d';
    for (let i = 0; i < 3; i++) {
        const w = 34 - i * 8, y0 = -14 - i * h * 0.26;
        ctx.beginPath(); ctx.moveTo(-w, y0); ctx.lineTo(0, y0 - h * 0.45); ctx.lineTo(w, y0); ctx.closePath(); ctx.fill();
    }
},
_decal_rock(ctx, d) {
    const r = 18 + d.seed * 22, n = 7;
    ctx.fillStyle = d.color || '#3b3b40';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
        const a = Math.PI + (i / n) * Math.PI;
        const rr = r * (0.8 + ((d.seed * 13 + i * 0.37) % 1) * 0.35);
        const px = Math.cos(a) * rr * 1.3, py = Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.5); ctx.lineTo(-r * 0.1, -r * 0.9); ctx.stroke();
},
_decal_mushroom(ctx, d, t) {
    const rgb = this._hexRgb(d.color, '45,212,191');
    const n = d.n || 3;
    for (let i = 0; i < n; i++) {
        const k = (d.seed * 17 + i * 0.61) % 1;
        const x = (i - (n - 1) / 2) * 16 + (k - 0.5) * 8, h = 18 + k * 26, r = 9 + k * 9;
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.7 + d.seed * 9);
        ctx.strokeStyle = 'rgba(226,232,240,0.75)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 3, -h * 0.5, x, -h); ctx.stroke();
        this._decalGlow(ctx, x, -h, r * 2.4, rgb, 0.18 + pulse * 0.17);
        ctx.fillStyle = `rgba(${rgb},0.95)`;
        ctx.beginPath(); ctx.ellipse(x, -h, r, r * 0.6, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(x - r * 0.35, -h - r * 0.25, 1.8, 0, 7); ctx.arc(x + r * 0.3, -h - r * 0.35, 1.4, 0, 7); ctx.fill();
    }
},
_decal_kelp(ctx, d, t) {
    const L = d.len || 110, strands = d.n || 3;
    ctx.lineCap = 'round';
    for (let k = 0; k < strands; k++) {
        const ox = (k - (strands - 1) / 2) * 10;
        ctx.strokeStyle = k % 2 ? 'rgba(22,101,52,0.85)' : 'rgba(34,139,34,0.8)';
        ctx.lineWidth = 5 - k * 0.8;
        ctx.beginPath(); ctx.moveTo(ox, 0);
        const segs = 8;
        for (let i = 1; i <= segs; i++) {
            const u = i / segs;
            ctx.lineTo(ox + Math.sin(t * 1.2 + u * 4 + k + d.seed * 6) * 10 * u, -L * u * (0.8 + k * 0.1));
        }
        ctx.stroke();
    }
},
_decal_coral(ctx, d) {
    const rgb = this._hexRgb(d.color, '251,113,133');
    ctx.strokeStyle = `rgb(${rgb})`; ctx.lineCap = 'round';
    const branch = (x, y, a, L, depth) => {
        const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
        ctx.lineWidth = Math.max(1.5, depth * 2.2);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        if (depth > 0) { branch(ex, ey, a - 0.45, L * 0.72, depth - 1); branch(ex, ey, a + 0.4, L * 0.7, depth - 1); }
        else { ctx.fillStyle = `rgb(${rgb})`; ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, 7); ctx.fill(); }
    };
    branch(0, 0, -Math.PI / 2 + (d.seed - 0.5) * 0.3, 22, 3);
},
_decal_stalagmite(ctx, d) {
    const h = 40 + d.seed * 50, w = 12 + d.seed * 8;
    ctx.fillStyle = d.color || '#1e293b';
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.3, -h * 0.6); ctx.lineTo(0, -h); ctx.lineTo(w * 0.4, -h * 0.55); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 0.2); ctx.lineTo(-w * 0.1, -h * 0.8); ctx.stroke();
},
_decal_crystal(ctx, d, t) {
    const rgb = this._hexRgb(d.color, '103,232,249');
    const n = d.n || 4;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.1 + d.seed * 8);
    this._decalGlow(ctx, 0, -18, 46, rgb, 0.10 + pulse * 0.08);
    for (let i = 0; i < n; i++) {
        const k = (d.seed * 11 + i * 0.43) % 1;
        const a = (i - (n - 1) / 2) * 0.32 + (k - 0.5) * 0.2, L = 26 + k * 34, w = 6 + k * 4;
        ctx.save(); ctx.rotate(a);
        ctx.fillStyle = `rgba(${rgb},0.55)`;
        ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w, -L * 0.75); ctx.lineTo(0, -L); ctx.lineTo(w, -L * 0.75); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.moveTo(-w * 0.3, -2); ctx.lineTo(-w * 0.3, -L * 0.7); ctx.lineTo(0, -L * 0.92); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
},
_decal_hoodoo(ctx, d) {
    // A desert rock spire: stacked, eroded drums with a cap stone.
    const h = 110 + d.seed * 80;
    ctx.fillStyle = d.color || '#9a3412';
    const drums = 4;
    for (let i = 0; i < drums; i++) {
        const y0 = -i * h / drums, y1 = -(i + 1) * h / drums;
        const w0 = 22 - i * 2 + ((d.seed * 9 + i * 0.3) % 1) * 6, w1 = w0 - 6;
        ctx.beginPath(); ctx.moveTo(-w0, y0); ctx.quadraticCurveTo(-w1, (y0 + y1) / 2, -w0 + 2, y1);
        ctx.lineTo(w0 - 2, y1); ctx.quadraticCurveTo(w1, (y0 + y1) / 2, w0, y0); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath(); ctx.ellipse(0, -h - 6, 30, 11, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2;
    for (let i = 1; i < drums; i++) { ctx.beginPath(); ctx.moveTo(-16, -i * h / drums); ctx.lineTo(16, -i * h / drums); ctx.stroke(); }
},
_decal_arch(ctx, d) {
    // A natural sandstone arch standing ACROSS the view (so it is scenery you
    // fly under, not geometry): draw it with `back: true`. w/h in world px.
    const w = d.w || 440, h = d.h || 380, leg = w * 0.16, span = h * 0.24;
    const col = d.color || '#9a3412';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.bezierCurveTo(-w / 2 - 6, -h * 0.5, -w / 2 + 10, -h * 0.9, -w * 0.3, -h);
    ctx.quadraticCurveTo(0, -h - 18, w * 0.3, -h);
    ctx.bezierCurveTo(w / 2 - 10, -h * 0.9, w / 2 + 6, -h * 0.5, w / 2, 0);
    ctx.lineTo(w / 2 - leg, 0);
    ctx.bezierCurveTo(w / 2 - leg, -h * 0.55, w / 2 - leg * 1.2, -(h - span) * 0.95, 0, -(h - span));
    ctx.bezierCurveTo(-w / 2 + leg * 1.2, -(h - span) * 0.95, -w / 2 + leg, -h * 0.55, -w / 2 + leg, 0);
    ctx.closePath(); ctx.fill();
    // strata and a sunlit rim
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
        const y = -h * i / 5;
        ctx.beginPath(); ctx.moveTo(-w / 2 + 4, y); ctx.lineTo(-w / 2 + leg - 4, y); ctx.moveTo(w / 2 - leg + 4, y); ctx.lineTo(w / 2 - 4, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(253,186,116,0.45)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-w * 0.3, -h); ctx.quadraticCurveTo(0, -h - 18, w * 0.3, -h); ctx.stroke();
},
_decal_bones(ctx, d) {
    // Half-buried ribcage: arcs off a spine.
    ctx.strokeStyle = '#e7e5e4'; ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-50, -6); ctx.quadraticCurveTo(0, -16, 50, -4); ctx.stroke();
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 6; i++) {
        const x = -40 + i * 16, hgt = 34 - Math.abs(i - 2.5) * 6;
        ctx.beginPath(); ctx.moveTo(x, -10); ctx.quadraticCurveTo(x + 10, -10 - hgt, x + 4, -10 - hgt * 1.4); ctx.stroke();
    }
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath(); ctx.ellipse(62, -8, 13, 9, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#1c1917'; ctx.beginPath(); ctx.arc(64, -10, 2.5, 0, 7); ctx.fill();
},
_decal_skull(ctx, d) {
    // Horned cattle skull.
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-12, -22); ctx.quadraticCurveTo(0, -30, 12, -22); ctx.lineTo(10, -4); ctx.quadraticCurveTo(0, 2, -10, -4); ctx.fill();
    ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -22); ctx.quadraticCurveTo(-28, -24, -30, -36); ctx.moveTo(11, -22); ctx.quadraticCurveTo(28, -24, 30, -36); ctx.stroke();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.arc(-5, -17, 3, 0, 7); ctx.arc(5, -17, 3, 0, 7); ctx.fill();
},

// ── Ground: built ───────────────────────────────────────────────────────────
_decal_hut(ctx, d) {
    ctx.strokeStyle = '#5b3a1e'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-22, -22); ctx.moveTo(22, 0); ctx.lineTo(22, -22); ctx.stroke();
    ctx.fillStyle = '#92633a'; ctx.fillRect(-28, -48, 56, 26);
    ctx.fillStyle = '#1c1917'; ctx.fillRect(-6, -44, 12, 22);
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath(); ctx.moveTo(-40, -46); ctx.lineTo(0, -74); ctx.lineTo(40, -46); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
    for (let i = -30; i <= 30; i += 10) { ctx.beginPath(); ctx.moveTo(i, -48); ctx.lineTo(i * 0.4, -66); ctx.stroke(); }
},
_decal_lighthouse(ctx, d, t) {
    const h = 150;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-11, -h); ctx.lineTo(11, -h); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dc2626';
    for (let i = 0; i < 3; i++) {
        const y0 = -h * (0.12 + i * 0.3), y1 = y0 - h * 0.13;
        const w0 = 18 - (7 * -y0 / h), w1 = 18 - (7 * -y1 / h);
        ctx.beginPath(); ctx.moveTo(-w0, y0); ctx.lineTo(-w1, y1); ctx.lineTo(w1, y1); ctx.lineTo(w0, y0); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-15, -h - 4, 30, 5);
    ctx.fillStyle = '#fde68a'; ctx.fillRect(-8, -h - 20, 16, 16);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.moveTo(-12, -h - 20); ctx.lineTo(0, -h - 32); ctx.lineTo(12, -h - 20); ctx.closePath(); ctx.fill();
    // Sweeping beam
    const a = t * 1.2;
    const dir = Math.cos(a);
    if (Math.abs(dir) > 0.15) {
        ctx.save(); ctx.translate(0, -h - 12);
        const L = 260 * Math.abs(dir), side = Math.sign(dir);
        const g = ctx.createLinearGradient(0, 0, side * L, 0);
        g.addColorStop(0, 'rgba(254,240,138,0.45)'); g.addColorStop(1, 'rgba(254,240,138,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(side * L, -28); ctx.lineTo(side * L, 24); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    this._decalGlow(ctx, 0, -h - 12, 26, '254,240,138', 0.5);
},
_decal_boat(ctx, d) {
    ctx.save(); ctx.rotate(-0.12);
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath(); ctx.moveTo(-40, -18); ctx.lineTo(40, -18); ctx.quadraticCurveTo(34, 0, 20, 2); ctx.lineTo(-26, 2); ctx.quadraticCurveTo(-38, -4, -40, -18); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(-40, -21, 80, 4);
    ctx.strokeStyle = '#57534e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-4, -64); ctx.stroke();
    ctx.fillStyle = 'rgba(241,245,249,0.85)';
    ctx.beginPath(); ctx.moveTo(-2, -62); ctx.lineTo(26, -26); ctx.lineTo(-2, -26); ctx.closePath(); ctx.fill();
    ctx.restore();
},
_decal_flag(ctx, d, t) {
    const rgb = this._hexRgb(d.color, '239,68,68');
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.stroke();
    ctx.fillStyle = `rgb(${rgb})`;
    ctx.beginPath(); ctx.moveTo(0, -80);
    for (let i = 0; i <= 6; i++) ctx.lineTo(i * 7, -80 + Math.sin(t * 5 + i * 0.9) * 3 * (i / 6));
    for (let i = 6; i >= 0; i--) ctx.lineTo(i * 7, -58 + Math.sin(t * 5 + i * 0.9) * 3 * (i / 6));
    ctx.closePath(); ctx.fill();
},
_decal_sign(ctx, d) {
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40); ctx.stroke();
    ctx.fillStyle = d.color || '#facc15';
    ctx.beginPath(); ctx.moveTo(0, -66); ctx.lineTo(16, -38); ctx.lineTo(-16, -38); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1c1917'; ctx.fillRect(-1.5, -58, 3, 11); ctx.fillRect(-1.5, -44, 3, 3);
},
_decal_lamp(ctx, d, t) {
    const rgb = this._hexRgb(d.color, '253,224,71');
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -70); ctx.lineTo(12, -76); ctx.stroke();
    const flick = 0.85 + 0.15 * Math.sin(t * 13 + d.seed * 30);
    this._decalGlow(ctx, 12, -72, 40, rgb, 0.35 * flick);
    ctx.fillStyle = `rgb(${rgb})`; ctx.beginPath(); ctx.arc(12, -72, 4, 0, 7); ctx.fill();
},
_decal_barrels(ctx, d) {
    const n = d.n || 3;
    const draw = (x, y) => {
        ctx.fillStyle = d.color || '#b45309'; ctx.fillRect(x - 10, y - 26, 20, 26);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 10, y - 20, 20, 3); ctx.fillRect(x - 10, y - 8, 20, 3);
        ctx.fillStyle = '#facc15'; ctx.fillRect(x - 4, y - 16, 8, 4);
    };
    for (let i = 0; i < Math.min(n, 3); i++) draw((i - 1) * 22, 0);
    if (n > 3) draw(-11, -26);
    if (n > 4) draw(11, -26);
},
_decal_crates(ctx, d) {
    const n = d.n || 3;
    const draw = (x, y, w) => {
        ctx.fillStyle = '#a16207'; ctx.fillRect(x - w / 2, y - w, w, w);
        ctx.strokeStyle = '#713f12'; ctx.lineWidth = 2;
        ctx.strokeRect(x - w / 2 + 1, y - w + 1, w - 2, w - 2);
        ctx.beginPath(); ctx.moveTo(x - w / 2, y - w); ctx.lineTo(x + w / 2, y); ctx.stroke();
    };
    draw(-15, 0, 28); if (n > 1) draw(15, 0, 26); if (n > 2) draw(0, -27, 24);
},
_decal_solar(ctx, d) {
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
    ctx.save(); ctx.translate(0, -30); ctx.rotate(-0.35);
    ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-36, -8, 72, 16);
    ctx.strokeStyle = 'rgba(147,197,253,0.6)'; ctx.lineWidth = 1;
    for (let i = -36; i <= 36; i += 12) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i, 8); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(36, 0); ctx.stroke();
    ctx.restore();
},
_decal_dish(ctx, d, t) {
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, -30); ctx.lineTo(10, 0); ctx.stroke();
    ctx.save(); ctx.translate(0, -34); ctx.rotate(-0.6 + Math.sin(t * 0.3 + d.seed * 5) * 0.25);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 12, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, -27, 3, 0, 7); ctx.fill();
    ctx.restore();
},
_decal_beacon(ctx, d, t) {
    const rgb = this._hexRgb(d.color, '239,68,68');
    ctx.fillStyle = '#334155'; ctx.fillRect(-3, -22, 6, 22);
    const on = Math.sin(t * 4 + d.seed * 20) > 0.3;
    if (on) this._decalGlow(ctx, 0, -26, 22, rgb, 0.7);
    ctx.fillStyle = on ? `rgb(${rgb})` : 'rgba(80,80,80,1)';
    ctx.beginPath(); ctx.arc(0, -26, 4, 0, 7); ctx.fill();
},
_decal_furnace(ctx, d, t) {
    ctx.fillStyle = '#292524'; ctx.fillRect(-34, -60, 68, 60);
    ctx.fillStyle = '#44403c'; ctx.fillRect(14, -120, 14, 62);
    ctx.fillStyle = '#1c1917'; ctx.fillRect(-20, -38, 40, 32);
    const flick = 0.75 + 0.25 * Math.sin(t * 9 + d.seed * 10);
    const g = ctx.createLinearGradient(0, -38, 0, -6);
    g.addColorStop(0, `rgba(251,146,60,${0.6 * flick})`); g.addColorStop(1, `rgba(254,240,138,${0.95 * flick})`);
    ctx.fillStyle = g; ctx.fillRect(-18, -34, 36, 28);
    this._decalGlow(ctx, 0, -20, 70, '249,115,22', 0.22 * flick);
    ctx.fillStyle = 'rgba(120,113,108,0.35)';
    for (let i = 0; i < 3; i++) {   // smoke puffs
        const u = ((t * 0.4 + i / 3 + d.seed) % 1);
        ctx.beginPath(); ctx.arc(21 + Math.sin(u * 6) * 6, -124 - u * 70, 8 + u * 14, 0, 7); ctx.fill();
    }
},
_decal_tank(ctx, d) {
    ctx.fillStyle = d.color || '#475569';
    ctx.fillRect(-26, -70, 52, 70);
    ctx.beginPath(); ctx.ellipse(0, -70, 26, 9, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    for (let y = -58; y < 0; y += 14) { ctx.beginPath(); ctx.moveTo(-26, y); ctx.lineTo(26, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(250,204,21,0.8)'; ctx.fillRect(-26, -40, 52, 5);
},
_decal_gear(ctx, d, t) {
    // Anchor is the gear's centre (place it on a wall or with `back`).
    const R = 34, teeth = 12, a0 = t * (d.flip ? -0.6 : 0.6) + d.seed * 3;
    ctx.fillStyle = d.color || '#57534e';
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
        const a = a0 + (i / (teeth * 2)) * Math.PI * 2, r = i % 2 ? R : R + 8;
        const a2 = a + Math.PI / (teeth * 2);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c1917'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * (R - 6), Math.sin(a) * (R - 6)); ctx.stroke(); }
},

// A radial cluster of crystal shards — used by spike hazards with
// look:'crystal'. Points every way, so it reads as "sharp" from any side.
_drawCrystalBurst(ctx, x, y, r, color, t, seedX) {
    const rgb = this._hexRgb(color, '103,232,249');
    const seed = Math.abs(Math.sin(seedX * 12.9898) * 43758.5453) % 1;
    ctx.save(); ctx.translate(x, y);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + seed * 9);
    this._decalGlow(ctx, 0, 0, r * 1.9, rgb, 0.12 + 0.1 * pulse);
    const n = 7;
    for (let i = 0; i < n; i++) {
        const k = (seed * 7 + i * 0.37) % 1;
        const a = (i / n) * Math.PI * 2 + seed * 3;
        const L = r * (0.85 + k * 0.45), w = r * (0.22 + k * 0.1);
        ctx.save(); ctx.rotate(a);
        ctx.fillStyle = `rgba(${rgb},0.6)`;
        ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.8, -L * 0.75); ctx.lineTo(0, -L); ctx.lineTo(w * 0.8, -L * 0.75); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.moveTo(-w * 0.25, -2); ctx.lineTo(-w * 0.25, -L * 0.7); ctx.lineTo(0, -L * 0.92); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    ctx.fillStyle = `rgba(${rgb},0.9)`; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, 7); ctx.fill();
    ctx.restore();
},

// ── Hanging (anchor = attachment point, grows downward) ─────────────────────
_decal_stalactite(ctx, d) {
    const h = d.len || (40 + d.seed * 60), w = 10 + d.seed * 10;
    ctx.fillStyle = d.color || '#1e293b';
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.2, h * 0.65); ctx.lineTo(0, h); ctx.lineTo(w * 0.35, h * 0.5); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(186,230,253,0.55)'; ctx.beginPath(); ctx.arc(0, h + 3, 2, 0, 7); ctx.fill();   // drip
},
_decal_vine(ctx, d, t) {
    const L = d.len || 90;
    const sway = (u) => Math.sin(t * 0.9 + d.seed * 7 + u * 3) * 8 * u;
    ctx.strokeStyle = '#166534'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let i = 1; i <= 10; i++) { const u = i / 10; ctx.lineTo(sway(u), L * u); }
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    for (let i = 1; i < 10; i += 1.5) {
        const u = i / 10, x = sway(u), y = L * u, side = (i | 0) % 2 ? 1 : -1;
        ctx.beginPath(); ctx.ellipse(x + side * 5, y, 5, 2.5, side * 0.6, 0, 7); ctx.fill();
    }
    if (d.color) {   // glowing berry at the tip
        const rgb = this._hexRgb(d.color, '45,212,191');
        this._decalGlow(ctx, sway(1), L + 4, 16, rgb, 0.5);
        ctx.fillStyle = `rgb(${rgb})`; ctx.beginPath(); ctx.arc(sway(1), L + 4, 3, 0, 7); ctx.fill();
    }
},
_decal_chain(ctx, d, t) {
    const L = d.len || 120, sway = Math.sin(t * 0.8 + d.seed * 6) * 0.03;
    ctx.save(); ctx.rotate(sway);
    ctx.strokeStyle = d.color || '#78716c'; ctx.lineWidth = 2.5;
    for (let y = 0; y < L; y += 12) {
        ctx.beginPath();
        if ((y / 12) % 2) ctx.ellipse(0, y + 6, 2, 6, 0, 0, 7); else ctx.ellipse(0, y + 6, 4.5, 6, 0, 0, 7);
        ctx.stroke();
    }
    if (d.hook !== false) {
        ctx.lineWidth = 4; ctx.strokeStyle = '#a8a29e';
        ctx.beginPath(); ctx.moveTo(0, L); ctx.lineTo(0, L + 10); ctx.arc(-7, L + 10, 7, 0, Math.PI * 0.9); ctx.stroke();
    }
    ctx.restore();
},
_decal_ladle(ctx, d, t) {
    // Foundry ladle: twin hanger chains from the crane rail and a tilted
    // bucket with a molten rim. Pair it with an incinerator pour below.
    const L = d.len || 90;
    ctx.strokeStyle = '#57534e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, L); ctx.moveTo(0, 0); ctx.lineTo(18, L); ctx.stroke();
    ctx.save(); ctx.translate(0, L); ctx.rotate(d.flip ? -0.12 : 0.12);
    ctx.fillStyle = '#292524';
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(18, 46); ctx.lineTo(-18, 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#44403c'; ctx.fillRect(-28, -4, 56, 8);
    const flick = 0.8 + 0.2 * Math.sin(t * 7 + d.seed * 10);
    ctx.fillStyle = `rgba(251,146,60,${0.9 * flick})`; ctx.fillRect(-24, -2, 48, 4);
    this._decalGlow(ctx, 0, 0, 50, '249,115,22', 0.25 * flick);
    ctx.restore();
},
_decal_hanglamp(ctx, d, t) {
    const L = d.len || 60;
    const rgb = this._hexRgb(d.color, '253,224,71');
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, L); ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(-10, L + 8); ctx.lineTo(-4, L); ctx.lineTo(4, L); ctx.lineTo(10, L + 8); ctx.closePath(); ctx.fill();
    const flick = 0.85 + 0.15 * Math.sin(t * 11 + d.seed * 40);
    this._decalGlow(ctx, 0, L + 10, 46, rgb, 0.3 * flick);
    ctx.fillStyle = `rgb(${rgb})`; ctx.beginPath(); ctx.arc(0, L + 10, 3.5, 0, 7); ctx.fill();
},

// ── Spanning (x,y) → (x2,y2) ────────────────────────────────────────────────
_decal_bridge(ctx, d, t) {
    const dx = d.x2 - d.x, dy = d.y2 - d.y, L = Math.hypot(dx, dy);
    const sag = d.sag ?? Math.min(60, L * 0.12);
    const pt = (u) => ({ x: d.x + dx * u, y: d.y + dy * u + Math.sin(u * Math.PI) * sag + Math.sin(t * 1.5 + u * 5) * 1.5 * Math.sin(u * Math.PI) });
    ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const p = pt(i / 20); i ? ctx.lineTo(p.x, p.y - 22) : ctx.moveTo(p.x, p.y - 22); }
    ctx.stroke();
    ctx.fillStyle = '#854d0e';
    const planks = Math.max(4, Math.round(L / 14));
    for (let i = 0; i <= planks; i++) {
        const p = pt(i / planks);
        ctx.fillRect(p.x - 5, p.y - 2, 10, 5);
        if (i % 2 === 0) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 22); ctx.stroke(); }
    }
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(d.x - 3, d.y - 30, 6, 32); ctx.fillRect(d.x2 - 3, d.y2 - 30, 6, 32);
},
_decal_pipe(ctx, d) {
    const dx = d.x2 - d.x, dy = d.y2 - d.y, L = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const r = (d.s || 1) * 9;
    ctx.translate(d.x, d.y); ctx.rotate(a);
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#78716c'); g.addColorStop(0.4, '#a8a29e'); g.addColorStop(1, '#44403c');
    ctx.fillStyle = d.color || g; ctx.fillRect(0, -r, L, r * 2);
    ctx.fillStyle = '#57534e';
    for (let x = 0; x <= L; x += 90) ctx.fillRect(Math.min(x, L - 6), -r - 3, 6, r * 2 + 6);
},
_decal_waterfall(ctx, d, t) {
    // A falling ribbon from (x,y) to (x2,y2) — usually straight down — with
    // scrolling streaks and a mist puff where it lands.
    const w = (d.w || 26) * (d.s || 1);
    const top = Math.min(d.y, d.y2), bot = Math.max(d.y, d.y2), x = d.x;
    const rgb = this._hexRgb(d.color, '125,211,252');
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, `rgba(${rgb},0.25)`); g.addColorStop(1, `rgba(${rgb},0.55)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, top, w, bot - top);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
    const span = bot - top;
    for (let i = 0; i < 7; i++) {
        const lx = x - w / 2 + 3 + (i / 6) * (w - 6);
        const off = ((t * 260 + i * 53) % 60);
        ctx.beginPath();
        for (let y = top + off - 60; y < bot; y += 60) {
            const y0 = Math.max(top, y), y1 = Math.min(bot, y + 26);
            if (y1 > y0) { ctx.moveTo(lx, y0); ctx.lineTo(lx, y1); }
        }
        ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
        const u = (t * 0.8 + i / 4) % 1;
        ctx.fillStyle = `rgba(226,242,255,${0.3 * (1 - u)})`;
        ctx.beginPath(); ctx.arc(x + (i - 1.5) * w * 0.5, bot - u * 26, w * 0.35 + u * w * 0.5, 0, 7); ctx.fill();
    }
},
_decal_cable(ctx, d, t) {
    const dx = d.x2 - d.x, dy = d.y2 - d.y;
    const sag = d.sag ?? 40;
    ctx.strokeStyle = d.color || '#1f2937'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(d.x, d.y);
    ctx.quadraticCurveTo(d.x + dx / 2, d.y + dy / 2 + sag * 2 + Math.sin(t + d.seed * 6) * 3, d.x2, d.y2);
    ctx.stroke();
},

});

if (typeof window !== 'undefined') window.DECAL_TYPES = DECAL_TYPES;
