// Canvas rendering — isometric ("2.5D") view.
//
// Game logic stays in flat world (x, y); this module projects that ground
// plane to the screen through SC.camera and draws everything in screen
// pixels: the land, river and roads are projected polygons/ribbons lying on
// the iso plane, while buildings are extruded diamond prisms and trucks /
// labels / order bubbles are upright billboards anchored to a projected
// ground point. Buildings + trucks are depth-sorted (back-to-front by world
// x+y) so nearer things correctly overlap farther ones.
window.SC = window.SC || {};

SC.render = (function() {
    let canvas = null, ctx = null, dpr = 1;
    let seaTime = 0;
    let floaters = []; // rising "+$x"/"−$x" texts, world-anchored
    let frameHoverNode = null; // node under the pointer, refreshed once per frame

    const ISO = SC.camera.ISO;

    function addFloater(x, y, text, color) {
        floaters.push({ x, y, text, color, t: 0 });
    }

    function attach(cv) {
        canvas = cv;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        SC.on('orderComplete', o => addFloater(o.city.x, o.city.y - 24, `+$${o.payout}`, '#34d399'));
        SC.on('roadBuilt', e => addFloater((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2, `−$${e.cost}`, '#f87171'));
        SC.on('roadDemolished', d => addFloater((d.edge.a.x + d.edge.b.x) / 2, (d.edge.a.y + d.edge.b.y) / 2, `+$${d.refund}`, '#34d399'));
        SC.on('sitePurchased', d => addFloater(d.node.x, d.node.y - 24, `−$${d.price}`, '#f87171'));
        SC.on('truckBought', d => addFloater(d.truck.x, d.truck.y - 24, `−$${d.price}`, '#f87171'));
        SC.on('sitePlaced', d => addFloater(d.node.x, d.node.y - 24, `−$${d.cost}`, '#f87171'));
    }

    function resize() {
        // Cap at 2: 3x-dpr phones quadruple the fill cost for no visible
        // gain on a moving map, and that fill cost is what makes panning
        // stutter on mobile.
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        SC.camera.setViewport(window.innerWidth, window.innerHeight);
    }

    // --- color helpers ------------------------------------------------------
    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }
    // amt in [-1, 1]: negative darkens toward black, positive lightens toward white
    function shade(hex, amt) {
        const c = hexToRgb(hex);
        const mix = amt < 0 ? 0 : 255;
        const t = Math.abs(amt);
        const r = Math.round(c.r + (mix - c.r) * t);
        const g = Math.round(c.g + (mix - c.g) * t);
        const b = Math.round(c.b + (mix - c.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }
    function rgba(hex, a) {
        const c = hexToRgb(hex);
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    }

    function zoom() { return SC.camera.cam.zoom; }
    function S(wx, wy) { return SC.camera.toScreen(wx, wy); }

    // lerp between two hex colors, t in [0,1]
    function mix(a, b, t) {
        const ca = hexToRgb(a), cb = hexToRgb(b);
        return `rgb(${Math.round(ca.r + (cb.r - ca.r) * t)}, ${Math.round(ca.g + (cb.g - ca.g) * t)}, ${Math.round(ca.b + (cb.b - ca.b) * t)})`;
    }

    // Tiny deterministic PRNG (mulberry32) so scenery (mountains, trees,
    // terrain patches) is stable frame-to-frame instead of flickering.
    function makeRng(seed) {
        let a = seed >>> 0;
        return function() {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // --- primitive paths (screen space) ------------------------------------
    // Iso ground footprint: a world square of half-size `fw` projects to a
    // 2:1 diamond. These are its screen half-extents at the current zoom.
    function footRadii(fw) {
        return { rx: 2 * ISO.kx * fw * zoom(), ry: 2 * ISO.ky * fw * zoom() };
    }
    function diamondPath(cx, cy, rx, ry) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - ry);
        ctx.lineTo(cx + rx, cy);
        ctx.lineTo(cx, cy + ry);
        ctx.lineTo(cx - rx, cy);
        ctx.closePath();
    }
    function roundRectPath(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // --- backdrop: sky + mountains -----------------------------------------
    let stars = null;
    function drawSky() {
        const w = canvas.width / dpr, h = canvas.height / dpr;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#141d30');
        g.addColorStop(0.55, '#0f1626');
        g.addColorStop(1, '#0a0f1a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // Star field: screen-space (a fixed skybox behind the panning world),
        // seeded so it's stable, denser toward the top, gentle twinkle.
        if (!stars) {
            const rng = makeRng(0xa11);
            stars = [];
            for (let i = 0; i < 90; i++) {
                stars.push({ u: rng(), v: rng() * rng() * 0.6, r: 0.5 + rng() * 1.1, ph: rng() * Math.PI * 2 });
            }
        }
        ctx.fillStyle = '#dbe6f4';
        for (const s of stars) {
            ctx.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(seaTime * 0.8 + s.ph));
            ctx.beginPath();
            ctx.arc(s.u * w, s.v * h, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    let mountains = null;
    function ensureMountains() {
        if (mountains) return mountains;
        const C = SC.CONFIG, rng = makeRng(0x5c1);
        const arr = [];
        const M = 130; // how far the range sits outside the play area
        // Ranges hug the two "far" edges of the diamond (low world x+y): the
        // top edge (y just above the map) and the left edge (x just left).
        const nN = 30;
        for (let i = 0; i <= nN; i++) {
            const x = -M + (C.WORLD_W + 2 * M) * (i / nN) + (rng() - 0.5) * 90;
            const y = -M - rng() * 140;
            arr.push({ x, y, size: 150 + rng() * 170, snow: rng() > 0.45 });
        }
        const nW = 20;
        for (let i = 0; i <= nW; i++) {
            const y = -M + (C.WORLD_H * 0.78 + M) * (i / nW) + (rng() - 0.5) * 90;
            const x = -M - rng() * 140;
            arr.push({ x, y, size: 150 + rng() * 170, snow: rng() > 0.45 });
        }
        arr.sort((a, b) => (a.x + a.y) - (b.x + b.y)); // back-to-front
        mountains = arr;
        return arr;
    }

    function drawMountains() {
        const list = ensureMountains();
        const z = zoom();
        // Culling window: the viewport normally, or the oversized offscreen
        // layer bounds while pre-rendering the background (see renderBg).
        const vb = viewBounds || { x0: -40, x1: canvas.width / dpr + 40,
                                   y0: -40, y1: canvas.height / dpr + 40 };
        const minD = list[0].x + list[0].y, maxD = list[list.length - 1].x + list[list.length - 1].y;
        for (const m of list) {
            const s = S(m.x, m.y);
            const h = m.size * z, hw = m.size * 0.95 * z;
            if (s.x + hw < vb.x0 || s.x - hw > vb.x1) continue; // cull off-layer
            if (s.y - h > vb.y1 || s.y < vb.y0) continue;
            // atmospheric haze: farther peaks fade bluer/lighter
            const t = Math.min(1, Math.max(0, ((m.x + m.y) - minD) / (maxD - minD + 1)));
            const rightC = mix('#6d84a6', '#3a4d70', t);
            const leftC = mix('#495d80', '#26324c', t);
            const apex = { x: s.x, y: s.y - h };
            // right (sunlit) face
            ctx.beginPath();
            ctx.moveTo(apex.x, apex.y); ctx.lineTo(s.x + hw, s.y); ctx.lineTo(s.x, s.y); ctx.closePath();
            ctx.fillStyle = rightC; ctx.fill();
            // left (shaded) face
            ctx.beginPath();
            ctx.moveTo(apex.x, apex.y); ctx.lineTo(s.x - hw, s.y); ctx.lineTo(s.x, s.y); ctx.closePath();
            ctx.fillStyle = leftC; ctx.fill();
            // snow cap
            if (m.snow) {
                const cap = h * 0.32;
                ctx.beginPath();
                ctx.moveTo(apex.x, apex.y);
                ctx.lineTo(apex.x + hw * 0.32, apex.y + cap);
                ctx.lineTo(apex.x + hw * 0.14, apex.y + cap * 0.62);
                ctx.lineTo(apex.x, apex.y + cap * 0.9);
                ctx.lineTo(apex.x - hw * 0.13, apex.y + cap * 0.6);
                ctx.lineTo(apex.x - hw * 0.30, apex.y + cap * 0.92);
                ctx.closePath();
                ctx.fillStyle = mix('#f2f6fb', '#c2d0e2', t);
                ctx.fill();
            }
        }
    }

    // --- ground: terrain patches + scenery ---------------------------------
    let decor = null, decorKey = null;
    function inRiver(x, y, margin) {
        const r = SC.state.river;
        if (!r) return false;
        let best = 0, bd = Infinity;
        for (let i = 0; i < r.spine.length; i++) {
            const d = Math.abs(r.spine[i].y - y);
            if (d < bd) { bd = d; best = i; }
        }
        return Math.abs(x - r.spine[best].x) < r.halfWidths[best] + margin;
    }
    function ensureDecor() {
        const r = SC.state.river;
        const key = r ? r.spine.length + ':' + Math.round(r.spine[0].x) + ':' + Math.round(r.halfWidths[0]) : 'none';
        if (decor && decorKey === key) return decor;
        const C = SC.CONFIG, rng = makeRng(0x2357);
        const patches = [];
        const tints = ['#233650', '#2b3a3a', '#1d2b40', '#2a3446', '#243d3a'];
        for (let i = 0; i < 18; i++) {
            patches.push({
                x: rng() * C.WORLD_W, y: rng() * C.WORLD_H,
                rx: 220 + rng() * 320, ry: 140 + rng() * 200,
                tint: tints[(rng() * tints.length) | 0], a: 0.18 + rng() * 0.16
            });
        }
        const trees = [];
        let tries = 0;
        while (trees.length < 54 && tries < 600) {
            tries++;
            const x = 70 + rng() * (C.WORLD_W - 140), y = 70 + rng() * (C.WORLD_H - 140);
            if (inRiver(x, y, 55)) continue;
            trees.push({ x, y, s: 0.75 + rng() * 0.7, rock: rng() > 0.78, tone: rng() });
        }
        decor = { patches, trees };
        decorKey = key;
        return decor;
    }

    function drawDecor() {
        const d = ensureDecor();
        const C = SC.CONFIG, z = zoom();
        // soft terrain patches, clipped to the land
        ctx.save();
        const corners = [S(0, 0), S(C.WORLD_W, 0), S(C.WORLD_W, C.WORLD_H), S(0, C.WORLD_H)];
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.clip();
        for (const p of d.patches) {
            const s = S(p.x, p.y);
            ctx.globalAlpha = p.a;
            ctx.fillStyle = p.tint;
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, p.rx * z, p.ry * z * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // trees & rocks — skip any that would sit under a building
        for (const t of d.trees) {
            let nearNode = false;
            for (const n of SC.state.nodes) {
                if (n.active && Math.abs(n.x - t.x) < 95 && Math.abs(n.y - t.y) < 95) { nearNode = true; break; }
            }
            if (nearNode) continue;
            const s = S(t.x, t.y), sc = t.s * z;
            // little ground shadow
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = '#05070c';
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, 9 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            if (t.rock) {
                ctx.fillStyle = mix('#4b5563', '#334155', t.tone);
                ctx.beginPath();
                ctx.ellipse(s.x, s.y - 3 * sc, 7 * sc, 5 * sc, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // trunk
                ctx.fillStyle = '#3a2a1e';
                ctx.fillRect(s.x - 1.4 * sc, s.y - 8 * sc, 2.8 * sc, 8 * sc);
                // two-tier pine
                const green = mix('#2f6b3f', '#245a37', t.tone);
                ctx.fillStyle = green;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y - 30 * sc);
                ctx.lineTo(s.x + 9 * sc, s.y - 12 * sc);
                ctx.lineTo(s.x - 9 * sc, s.y - 12 * sc);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(s.x, s.y - 22 * sc);
                ctx.lineTo(s.x + 11 * sc, s.y - 6 * sc);
                ctx.lineTo(s.x - 11 * sc, s.y - 6 * sc);
                ctx.closePath(); ctx.fill();
                // sun highlight
                ctx.fillStyle = mix(green, '#6ee7a0', 0.35);
                ctx.beginPath();
                ctx.moveTo(s.x, s.y - 22 * sc);
                ctx.lineTo(s.x + 4 * sc, s.y - 8 * sc);
                ctx.lineTo(s.x - 1 * sc, s.y - 8 * sc);
                ctx.closePath(); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // --- ground & water -----------------------------------------------------
    // Everything static in world space: land plateau, iso grid, terrain
    // patches, trees/rocks and the coastline. Drawn only when the cached
    // background layer re-renders (see renderBg), never per frame.
    function drawLandStatic() {
        const C = SC.CONFIG;
        const corners = [S(0, 0), S(C.WORLD_W, 0), S(C.WORLD_W, C.WORLD_H), S(0, C.WORLD_H)];
        // drop the land a touch onto the backdrop with a soft dark rim
        ctx.save();
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.fillStyle = '#1c2b3f';
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        const ys = corners.map(p => p.y);
        const grad = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
        grad.addColorStop(0, '#2b3c52');
        grad.addColorStop(0.5, '#223247');
        grad.addColorStop(1, '#182437');
        ctx.fillStyle = grad;
        ctx.fill();

        // Iso grid: faint lines of constant world-x and world-y, clipped to
        // the land, to give the ground a sense of scale and perspective.
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.055)';
        ctx.lineWidth = 1;
        const step = 220;
        for (let x = 0; x <= C.WORLD_W + 1; x += step) {
            const a = S(x, 0), b = S(x, C.WORLD_H);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (let y = 0; y <= C.WORLD_H + 1; y += step) {
            const a = S(0, y), b = S(C.WORLD_W, y);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.restore();

        drawDecor();

        // Coastline: a lit top-left rim, darker on the lower-right
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.strokeStyle = 'rgba(180, 200, 224, 0.16)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // --- cached background layer ---------------------------------------------
    // Mountains + land + grid + patches + trees are all static in world
    // space but were re-path'd every frame — enough work to stutter panning
    // on phones. They render once into an oversized offscreen canvas and
    // each frame is just one drawImage: panning translates the blit, small
    // zoom deltas scale it, and a full re-render only happens when the
    // camera leaves the painted margin, zoom drifts >25% from the render
    // zoom, the viewport resizes, or the scenery itself changes (new game,
    // or a site activating reclaims the trees under it).
    const BG_MARGIN = 320; // css px painted beyond each viewport edge
    let bg = null;         // { cv, camX, camY, zoom, w, h, key }
    let viewBounds = null; // widened mountain-culling window during renderBg

    function bgKey() {
        const r = SC.state.river;
        const active = SC.state.nodes ? SC.state.nodes.filter(n => n.active).length : 0;
        return (r ? Math.round(r.spine[0].x) : 0) + ':' + active + ':' +
               canvas.width + 'x' + canvas.height;
    }

    function renderBg() {
        const cam = SC.camera.cam;
        const wCss = canvas.width / dpr + BG_MARGIN * 2;
        const hCss = canvas.height / dpr + BG_MARGIN * 2;
        if (!bg || bg.cv.width !== Math.round(wCss * dpr) || bg.cv.height !== Math.round(hCss * dpr)) {
            bg = { cv: document.createElement('canvas') };
            bg.cv.width = Math.round(wCss * dpr);
            bg.cv.height = Math.round(hCss * dpr);
        }
        const bctx = bg.cv.getContext('2d');
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bctx.clearRect(0, 0, wCss, hCss);
        bctx.translate(BG_MARGIN, BG_MARGIN);
        // The drawing helpers all render through the module-level `ctx` at
        // the live camera; swapping it in + the translate above paints the
        // same scene shifted into the margin.
        const old = ctx;
        ctx = bctx;
        viewBounds = { x0: -BG_MARGIN - 40, x1: canvas.width / dpr + BG_MARGIN + 40,
                       y0: -BG_MARGIN - 40, y1: canvas.height / dpr + BG_MARGIN + 40 };
        drawMountains();
        drawLandStatic();
        ctx = old;
        viewBounds = null;
        bg.camX = cam.x; bg.camY = cam.y; bg.zoom = cam.zoom;
        bg.w = wCss; bg.h = hCss; bg.key = bgKey();
    }

    function drawBg() {
        const cam = SC.camera.cam;
        let scale = 1, x0 = 0, y0 = 0;
        const place = () => {
            scale = cam.zoom / bg.zoom;
            x0 = (bg.camX - cam.x) * cam.zoom - BG_MARGIN * scale;
            y0 = (bg.camY - cam.y) * cam.zoom - BG_MARGIN * scale;
        };
        let need = !bg || bg.key !== bgKey() || Math.abs(cam.zoom / bg.zoom - 1) > 0.25;
        if (!need) {
            place(); // still covering the viewport after the pan/zoom?
            need = x0 > 0 || y0 > 0 ||
                   x0 + bg.w * scale < canvas.width / dpr ||
                   y0 + bg.h * scale < canvas.height / dpr;
        }
        if (need) { renderBg(); place(); }
        ctx.drawImage(bg.cv, x0, y0, bg.w * scale, bg.h * scale);
    }

    function drawWorld(dt) {
        const C = SC.CONFIG;
        seaTime += dt;
        drawBg();     // mountains + land + grid + decor (cached)
        drawRiver();  // live: animated ripples

        // Distance fog: the far edge of the land dissolves into the sky.
        // Iso depth (world x+y) maps linearly to screen y, so a vertical
        // gradient between two constant-depth lines is a true depth fade —
        // from the far corner (depth 0) to ~35% of max depth.
        const corners = [S(0, 0), S(C.WORLD_W, 0), S(C.WORLD_W, C.WORLD_H), S(0, C.WORLD_H)];
        const farY = corners[0].y;
        const midD = 0.175 * (C.WORLD_W + C.WORLD_H); // x=y point at 35% depth
        const nearY = S(midD, midD).y;
        if (nearY > farY) {
            ctx.save();
            ctx.beginPath();
            corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
            ctx.closePath();
            ctx.clip();
            const fog = ctx.createLinearGradient(0, farY, 0, nearY);
            fog.addColorStop(0, 'rgba(20, 29, 48, 0.85)');
            fog.addColorStop(0.5, 'rgba(20, 29, 48, 0.35)');
            fog.addColorStop(1, 'rgba(20, 29, 48, 0)');
            ctx.fillStyle = fog;
            ctx.fillRect(0, farY, canvas.width / dpr, nearY - farY);
            ctx.restore();
        }
    }

    function drawRiver() {
        const r = SC.state.river;
        const left = [], right = [];
        for (let i = 0; i < r.spine.length; i++) {
            left.push(S(r.spine[i].x - r.halfWidths[i], r.spine[i].y));
            right.push(S(r.spine[i].x + r.halfWidths[i], r.spine[i].y));
        }
        // Water body
        ctx.beginPath();
        left.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        const ys = [...left, ...right].map(p => p.y);
        const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
        g.addColorStop(0, '#123047');
        g.addColorStop(1, '#0b1c2c');
        ctx.fillStyle = g;
        ctx.fill();
        // subtle bank shadow
        ctx.strokeStyle = 'rgba(2, 6, 12, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated ripples across the flow
        ctx.strokeStyle = 'rgba(96, 200, 240, 0.10)';
        ctx.lineWidth = 1.4;
        for (let w = 0; w < 4; w++) {
            ctx.beginPath();
            for (let i = 0; i < r.spine.length; i++) {
                const t = i / (r.spine.length - 1);
                const frac = (w + 1) / 5;
                const wx = r.spine[i].x - r.halfWidths[i] + 2 * r.halfWidths[i] * frac
                         + Math.sin(seaTime * 2 + t * 8 + w) * 6;
                const p = S(wx, r.spine[i].y);
                i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
            }
            ctx.stroke();
        }
    }

    // --- roads --------------------------------------------------------------
    function strokeEdge(e, width, color, dash) { strokeEdgeRange(e, 0, 1, width, color, dash); }

    // Like strokeEdge but only over a [t0,t1] fraction of the edge — used to
    // draw a bridge/ferry's approach roads without the water crossing itself.
    function strokeEdgeRange(e, t0, t1, width, color, dash) {
        if (t1 - t0 < 0.002) return;
        const ax = e.a.x + (e.b.x - e.a.x) * t0, ay = e.a.y + (e.b.y - e.a.y) * t0;
        const bx = e.a.x + (e.b.x - e.a.x) * t1, by = e.a.y + (e.b.y - e.a.y) * t1;
        const a = S(ax, ay), b = S(bx, by);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'butt';
    }

    // Casing + surface (+ highway centerline) for a plain road, over just
    // [t0,t1] of the edge — used both for a whole ordinary road and for the
    // land approaches on either side of a bridge/ferry's water crossing.
    function drawRoadSegment(e, casing, surfaceW, t0, t1, z) {
        strokeEdgeRange(e, t0, t1, casing, 'rgba(8, 12, 20, 0.55)');
        const surf = e.level > 0 ? 'rgba(226, 232, 240, 0.85)' : 'rgba(140, 152, 170, 0.75)';
        strokeEdgeRange(e, t0, t1, surfaceW, surf);
        if (e.level > 0) strokeEdgeRange(e, t0, t1, Math.max(1, 1.6 * z), 'rgba(250, 204, 21, 0.6)', [11 * z, 11 * z]);
    }

    // An actual bridge — deck lifted above the water on piers — spanning
    // just the [t0,t1] water stretch of the edge, so the road on either
    // bank still reads as ordinary road right up to the water's edge.
    function drawBridgeCrossing(e, casing, surfaceW, crossing, z) {
        const wx0 = e.a.x + (e.b.x - e.a.x) * crossing.t0, wy0 = e.a.y + (e.b.y - e.a.y) * crossing.t0;
        const wx1 = e.a.x + (e.b.x - e.a.x) * crossing.t1, wy1 = e.a.y + (e.b.y - e.a.y) * crossing.t1;
        const p0 = S(wx0, wy0), p1 = S(wx1, wy1);
        const lift = 10 * z; // how far the deck floats above the water, in screen px

        // Piers: evenly spaced footings so the deck reads as supported,
        // each with a little ripple where it meets the water.
        const waterLen = Math.hypot(wx1 - wx0, wy1 - wy0);
        const pierCount = Math.max(1, Math.round(waterLen / 90));
        for (let i = 0; i <= pierCount; i++) {
            const t = i / pierCount;
            const base = S(wx0 + (wx1 - wx0) * t, wy0 + (wy1 - wy0) * t);
            ctx.strokeStyle = 'rgba(60, 68, 82, 0.85)';
            ctx.lineWidth = Math.max(2, 3 * z);
            ctx.beginPath();
            ctx.moveTo(base.x, base.y - lift);
            ctx.lineTo(base.x, base.y + 2 * z);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.beginPath();
            ctx.ellipse(base.x, base.y + 2 * z, 5 * z, 2 * z, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shadow the deck casts on the water below it
        ctx.strokeStyle = 'rgba(2, 6, 12, 0.35)';
        ctx.lineWidth = casing;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y + 3 * z);
        ctx.lineTo(p1.x, p1.y + 3 * z);
        ctx.stroke();

        // Deck: dark casing under a lighter concrete surface, both lifted
        strokeSpan(p0, p1, 0, -lift, casing, 'rgba(8, 12, 20, 0.6)');
        strokeSpan(p0, p1, 0, -lift, surfaceW, 'rgba(176, 190, 210, 0.92)');

        // Guard rails along both edges of the deck
        const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len, railOff = surfaceW / 2 + 1.5 * z;
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
        ctx.lineWidth = Math.max(1, 1.2 * z);
        for (const sign of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(p0.x + nx * railOff * sign, p0.y - lift + ny * railOff * sign);
            ctx.lineTo(p1.x + nx * railOff * sign, p1.y - lift + ny * railOff * sign);
            ctx.stroke();
        }
        ctx.lineCap = 'butt';
    }

    function strokeSpan(p0, p1, dx, dy, width, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x + dx, p0.y + dy);
        ctx.lineTo(p1.x + dx, p1.y + dy);
        ctx.stroke();
    }

    // Ferry lane + shuttling boat, confined to just the water stretch —
    // the road on either bank reads as ordinary road up to the water's edge.
    function drawFerryCrossing(e, surfaceW, crossing, z, armed) {
        const wx0 = e.a.x + (e.b.x - e.a.x) * crossing.t0, wy0 = e.a.y + (e.b.y - e.a.y) * crossing.t0;
        const wx1 = e.a.x + (e.b.x - e.a.x) * crossing.t1, wy1 = e.a.y + (e.b.y - e.a.y) * crossing.t1;
        const p0 = S(wx0, wy0), p1 = S(wx1, wy1);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
        ctx.lineWidth = surfaceW;
        ctx.lineCap = 'round';
        ctx.setLineDash([4 * z + 2, 10 * z]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'butt';

        if (!armed) {
            const t = (Math.sin(seaTime * 0.6) + 1) / 2;
            const p = S(wx0 + (wx1 - wx0) * t, wy0 + (wy1 - wy0) * t);
            emoji('⛴', p.x, p.y, 18 * clampZoom());
        }
    }

    function drawRoads() {
        const z = zoom();
        const pending = SC.input.getPendingDemolish && SC.input.getPendingDemolish();
        const pendingUp = SC.input.getPendingUpgrade && SC.input.getPendingUpgrade();
        for (const e of SC.state.edges) {
            const armed = e === pending || e === pendingUp;
            const casing = Math.max(5, (e.level > 0 ? 9 : 7) * z);
            const surfaceW = Math.max(2.5, (e.level > 0 ? 6 : 4) * z);
            const crossing = (e.bridge || e.ferry)
                ? SC.map.riverCrossing(e.a.x, e.a.y, e.b.x, e.b.y) : null;

            if (crossing) {
                drawRoadSegment(e, casing, surfaceW, 0, crossing.t0, z);
                drawRoadSegment(e, casing, surfaceW, crossing.t1, 1, z);
                if (e.ferry) drawFerryCrossing(e, surfaceW, crossing, z, armed);
                else drawBridgeCrossing(e, casing, surfaceW, crossing, z);
            } else {
                drawRoadSegment(e, casing, surfaceW, 0, 1, z);
            }

            if (armed) {
                strokeEdge(e, casing + 2, e === pending ? 'rgba(248, 113, 113, 0.9)' : 'rgba(250, 204, 21, 0.9)');
            }

            // Congestion heat
            if (SC.state.congestionEnabled && !armed) {
                const excess = SC.vehicles.truckCountOnEdge(e) - SC.CONFIG.CONGESTION_THRESHOLD;
                if (excess > 0) {
                    const heat = Math.min(1, excess / 3);
                    strokeEdge(e, casing + heat * 4, `rgba(248, 113, 113, ${0.25 + heat * 0.5})`);
                }
            }
        }
    }

    // --- text / emoji billboards -------------------------------------------
    function clampZoom() { return Math.min(1.6, Math.max(0.8, zoom())); }

    // Screen-space text on a rounded plate at a screen position.
    function labelAt(text, sx, sy, color, size) {
        const fs = size || 12;
        ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const w = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(12, 18, 30, 0.82)';
        roundRectPath(sx - w / 2 - 6, sy - fs / 2 - 3, w + 12, fs + 6, 6);
        ctx.fill();
        ctx.fillStyle = color || '#f8fafc';
        ctx.fillText(text, sx, sy);
    }
    // world-anchored variant
    function label(text, wx, wy, color, size) {
        const p = S(wx, wy);
        labelAt(text, p.x, p.y, color, size);
    }

    function emoji(ch, sx, sy, size) {
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, sx, sy + size * 0.06);
    }

    // --- building prisms ----------------------------------------------------
    // spec: how each node kind is extruded and colored.
    // Which themed site model a raw material gets (see drawSupplierSite):
    // the resource dictates the look — a farm for wheat, a lake + pump for
    // water, a mine mouth for ores, a fenced pasture for wool, a rubber
    // grove, a little fab for electronics.
    const SITE_OF = { wheat: 'farm', water: 'lake', ore: 'mine', coal: 'mine',
                      copper: 'mine', wool: 'pasture', rubber: 'grove', chips: 'fab' };
    const SITE_H = { farm: 12, lake: 9, mine: 20, pasture: 12, grove: 18, fab: 22 };

    function nodeSpec(n) {
        if (n.kind === 'supplier') {
            const base = SC.colorOf(n.mat);
            const site = SITE_OF[n.mat] || 'fab';
            return { base, fw: site === 'fab' ? 20 : 24, site,
                     h: SITE_H[site] + (n.level || 0) * 3, icon: SC.emojiOf(n.mat) };
        }
        if (n.kind === 'factory') {
            return { base: '#6b7a90', fw: 22, h: 32, icon: SC.emojiOf(n.recipe), roof: SC.colorOf(n.recipe), stories: 3, stack: true, door: true };
        }
        if (n.kind === 'yard') {
            return { base: '#8b5cf6', fw: 21, h: 10, icon: '🅿️', flat: true };
        }
        // city
        if (n.isHQ) return { base: '#0ea5e9', fw: 20, h: 46, icon: '⭐', stories: 6, door: true };
        return { base: '#10b981', fw: 18, h: 32, icon: '🏢', stories: 4, door: true };
    }

    // Screen point a tap/hover should hit-test against for a node — the
    // roof icon, raised above the flat ground point by the building's
    // iso-projected height (up to 54px at zoom 1 for HQ), same as
    // drawNodeBody's `tc`. Exported so input.js's node picking and the
    // inspect tooltip line up with what's actually drawn, instead of
    // hit-testing the ground point a building's tall icon visually sits
    // well above (which made tapping a node — especially HQ — miss).
    function nodeIconAnchor(n) {
        const sp = nodeSpec(n);
        const g = S(n.x, n.y);
        return { x: g.x, y: g.y - sp.h * zoom() };
    }

    // Extruded diamond prism rising `hpx` px from ground point (gx, gy).
    function prism(gx, gy, fw, hpx, base, opts) {
        opts = opts || {};
        const { rx, ry } = footRadii(fw);
        const alpha = opts.alpha == null ? 1 : opts.alpha;
        ctx.globalAlpha = alpha;

        // ground corners
        const bTop = { x: gx, y: gy - ry }, bRight = { x: gx + rx, y: gy };
        const bBot = { x: gx, y: gy + ry }, bLeft = { x: gx - rx, y: gy };
        // top-face corners (raised)
        const tTop = { x: bTop.x, y: bTop.y - hpx }, tRight = { x: bRight.x, y: bRight.y - hpx };
        const tBot = { x: bBot.x, y: bBot.y - hpx }, tLeft = { x: bLeft.x, y: bLeft.y - hpx };

        const topC = shade(base, 0.2), rightC = shade(base, -0.08), leftC = shade(base, -0.3);

        // right (front-right) face
        ctx.beginPath();
        ctx.moveTo(bRight.x, bRight.y); ctx.lineTo(bBot.x, bBot.y);
        ctx.lineTo(tBot.x, tBot.y); ctx.lineTo(tRight.x, tRight.y); ctx.closePath();
        ctx.fillStyle = opts.ghost ? rgba(base, 0.1) : rightC;
        ctx.fill();
        // left (front-left) face
        ctx.beginPath();
        ctx.moveTo(bBot.x, bBot.y); ctx.lineTo(bLeft.x, bLeft.y);
        ctx.lineTo(tLeft.x, tLeft.y); ctx.lineTo(tBot.x, tBot.y); ctx.closePath();
        ctx.fillStyle = opts.ghost ? rgba(base, 0.16) : leftC;
        ctx.fill();
        // top face
        ctx.beginPath();
        ctx.moveTo(tTop.x, tTop.y); ctx.lineTo(tRight.x, tRight.y);
        ctx.lineTo(tBot.x, tBot.y); ctx.lineTo(tLeft.x, tLeft.y); ctx.closePath();
        ctx.fillStyle = opts.roof ? shade(opts.roof, 0.05) : (opts.ghost ? rgba(base, 0.28) : topC);
        ctx.fill();

        // crisp edges
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1;
        ctx.strokeStyle = opts.outline || rgba(shade(base, 0.4), opts.ghost ? 0.7 : 0.5);
        if (opts.dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
        // outline the silhouette + the top ridge
        ctx.beginPath();
        ctx.moveTo(bLeft.x, bLeft.y); ctx.lineTo(bBot.x, bBot.y); ctx.lineTo(bRight.x, bRight.y);
        ctx.lineTo(tRight.x, tRight.y); ctx.lineTo(tTop.x, tTop.y); ctx.lineTo(tLeft.x, tLeft.y); ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tBot.x, tBot.y); ctx.lineTo(tRight.x, tRight.y);
        ctx.moveTo(tBot.x, tBot.y); ctx.lineTo(tLeft.x, tLeft.y);
        ctx.moveTo(tBot.x, tBot.y); ctx.lineTo(tTop.x, tTop.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Story lines across the two front faces — cheap "this is a building
        // with floors" nuance. Each is a V at constant height following the
        // front silhouette (bRight→bBot→bLeft, raised by f·hpx).
        if (!opts.ghost && opts.stories > 1 && hpx > 10) {
            ctx.strokeStyle = rgba(shade(base, -0.45), 0.5);
            ctx.lineWidth = 1;
            for (let k = 1; k < opts.stories; k++) {
                const dy = hpx * k / opts.stories;
                ctx.beginPath();
                ctx.moveTo(bRight.x, bRight.y - dy);
                ctx.lineTo(bBot.x, bBot.y - dy);
                ctx.lineTo(bLeft.x, bLeft.y - dy);
                ctx.stroke();
            }
        }
        // Doorway centered on the front (bottom) corner
        if (!opts.ghost && opts.door) {
            const dh = Math.min(hpx * 0.4, ry * 1.1);
            const dwx = rx * 0.16, dwy = ry * 0.16;
            ctx.beginPath();
            ctx.moveTo(bBot.x - dwx, bBot.y - dwy);
            ctx.lineTo(bBot.x + dwx, bBot.y - dwy);
            ctx.lineTo(bBot.x + dwx, bBot.y - dwy - dh);
            ctx.lineTo(bBot.x, bBot.y - dwy - dh - dwy * 0.6);
            ctx.lineTo(bBot.x - dwx, bBot.y - dwy - dh);
            ctx.closePath();
            ctx.fillStyle = rgba(shade(base, -0.6), 0.85);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        return { rx, ry, topCenter: { x: gx, y: gy - hpx }, bBot };
    }

    // Soft drop shadow via a pre-rendered radial sprite: ctx.filter blur
    // (the old approach) forces a slow path on mobile GPUs and was a big
    // part of panning jank — a scaled drawImage costs next to nothing.
    let shadowSprite = null;
    function drawShadow(gx, gy, fw) {
        if (!shadowSprite) {
            shadowSprite = document.createElement('canvas');
            shadowSprite.width = shadowSprite.height = 128;
            const c = shadowSprite.getContext('2d');
            const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
            g.addColorStop(0, 'rgba(5, 7, 12, 0.42)');
            g.addColorStop(0.65, 'rgba(5, 7, 12, 0.22)');
            g.addColorStop(1, 'rgba(5, 7, 12, 0)');
            c.fillStyle = g;
            c.fillRect(0, 0, 128, 128);
        }
        const { rx, ry } = footRadii(fw);
        // destination rect is wider than tall, giving the iso squash
        ctx.drawImage(shadowSprite,
                      gx + rx * 0.28 - rx * 1.25, gy + ry * 0.5 - ry * 1.25,
                      rx * 2.5, ry * 2.5);
    }

    // --- themed supplier sites ------------------------------------------------
    // Each raw material renders as a little scene instead of a generic box.
    // Same footprint/anchor contract as prism(): returns { rx, ry, topCenter }
    // where topCenter (ground point raised by spec height) is what the icon
    // badge, stock bar and input.js's hit capsule all key off.
    function drawSupplierSite(n, sp, g) {
        const z = zoom();
        const { rx, ry } = footRadii(sp.fw);
        const h = sp.h * z;
        const base = sp.base;

        if (sp.site === 'farm') {
            // Tilled field: soil in the plot, furrow rows along the iso axis,
            // a tiny barn on the back corner.
            ctx.save();
            diamondPath(g.x, g.y, rx * 0.92, ry * 0.92);
            ctx.clip();
            ctx.fillStyle = '#3a2e20';
            ctx.fillRect(g.x - rx, g.y - ry, rx * 2, ry * 2);
            ctx.strokeStyle = rgba(base, 0.6);
            ctx.lineWidth = Math.max(1.5, 2.2 * z);
            for (let k = -2; k <= 2; k++) {
                const ox = -0.5 * k * rx * 0.36, oy = 0.25 * k * rx * 0.36;
                ctx.beginPath();
                ctx.moveTo(g.x + ox - rx, g.y + oy - rx * 0.5);
                ctx.lineTo(g.x + ox + rx, g.y + oy + rx * 0.5);
                ctx.stroke();
            }
            ctx.restore();
            prism(g.x, g.y - ry * 0.62, 6, 9 * z, '#8a5a33');
        } else if (sp.site === 'lake') {
            // Pond with ripple rings + a pump hut piping out of it.
            const pg = ctx.createLinearGradient(0, g.y - ry, 0, g.y + ry);
            pg.addColorStop(0, '#1c4a6e');
            pg.addColorStop(1, '#0d2a44');
            ctx.beginPath();
            ctx.ellipse(g.x, g.y, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = pg;
            ctx.fill();
            ctx.strokeStyle = 'rgba(6, 14, 24, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(150, 220, 255, 0.28)';
            ctx.lineWidth = 1.2;
            for (const rr of [0.35, 0.58]) {
                const ph = (seaTime * 0.5 + rr) % 1;
                ctx.globalAlpha = 0.6 * (1 - ph);
                ctx.beginPath();
                ctx.ellipse(g.x, g.y, rx * (0.2 + ph * rr), ry * (0.2 + ph * rr), 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#5a7d96';
            ctx.lineWidth = Math.max(2, 2.5 * z);
            ctx.beginPath();
            ctx.moveTo(g.x + rx * 0.55, g.y - 6 * z);
            ctx.lineTo(g.x + rx * 0.2, g.y);
            ctx.stroke();
            prism(g.x + rx * 0.62, g.y, 5.5, 8 * z, '#5a7d96');
        } else if (sp.site === 'mine') {
            // Rocky mound (tinted by the ore) with a dark adit + timber frame.
            const rockR = mix('#8a94a2', base, 0.4), rockL = shade(mix('#8a94a2', base, 0.4), -0.35);
            const apex = { x: g.x - rx * 0.1, y: g.y - h };
            ctx.beginPath();
            ctx.moveTo(apex.x, apex.y);
            ctx.lineTo(g.x + rx * 0.9, g.y);
            ctx.lineTo(g.x - rx * 0.15, g.y + ry * 0.28);
            ctx.closePath();
            ctx.fillStyle = rockR; ctx.fill();
            ctx.beginPath();
            ctx.moveTo(apex.x, apex.y);
            ctx.lineTo(g.x - rx * 0.9, g.y);
            ctx.lineTo(g.x - rx * 0.15, g.y + ry * 0.28);
            ctx.closePath();
            ctx.fillStyle = rockL; ctx.fill();
            // adit (entrance) with a timber lintel
            ctx.beginPath();
            ctx.ellipse(g.x - rx * 0.12, g.y + ry * 0.1, rx * 0.24, ry * 0.5, 0, Math.PI, 0);
            ctx.closePath();
            ctx.fillStyle = '#0a0d13'; ctx.fill();
            ctx.strokeStyle = '#6a4a2c';
            ctx.lineWidth = Math.max(1.5, 2 * z);
            ctx.beginPath();
            ctx.moveTo(g.x - rx * 0.38, g.y + ry * 0.12);
            ctx.lineTo(g.x - rx * 0.38, g.y - ry * 0.42);
            ctx.lineTo(g.x + rx * 0.14, g.y - ry * 0.42);
            ctx.lineTo(g.x + rx * 0.14, g.y + ry * 0.12);
            ctx.stroke();
            // spoil pebbles by the entrance
            ctx.fillStyle = rgba(base, 0.8);
            for (const [px, py] of [[0.35, 0.55], [0.52, 0.38], [0.42, 0.72]]) {
                ctx.beginPath();
                ctx.ellipse(g.x + rx * px - rx * 0.5, g.y + ry * py, 2.2 * z, 1.5 * z, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (sp.site === 'pasture') {
            // Fenced grass plot with a couple of sheep.
            diamondPath(g.x, g.y, rx * 0.9, ry * 0.9);
            ctx.fillStyle = 'rgba(58, 96, 64, 0.4)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(201, 176, 138, 0.85)';
            ctx.lineWidth = Math.max(1.2, 1.5 * z);
            ctx.setLineDash([4 * z, 3 * z]);
            ctx.stroke();
            ctx.setLineDash([]);
            for (const [sx, sy, flip] of [[-0.32, -0.02, 1], [0.18, 0.28, -1]]) {
                const cx = g.x + rx * sx, cy = g.y + ry * sy;
                ctx.fillStyle = '#e8e4da';
                ctx.beginPath();
                ctx.ellipse(cx, cy, 5 * z, 3.2 * z, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#3b3630';
                ctx.beginPath();
                ctx.arc(cx + flip * 4.5 * z, cy - 1.2 * z, 1.6 * z, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (sp.site === 'grove') {
            // Rubber-tree grove: round canopies (unlike the wild pines).
            for (const [tx, ty, s] of [[-0.35, 0.05, 1], [0.05, -0.3, 0.9], [0.32, 0.28, 1.05]]) {
                const cx = g.x + rx * tx, cy = g.y + ry * ty;
                ctx.strokeStyle = '#4a3323';
                ctx.lineWidth = Math.max(1.5, 2 * z);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx, cy - 9 * z * s);
                ctx.stroke();
                const cnp = mix('#3f7a4a', base, 0.25);
                ctx.fillStyle = cnp;
                ctx.beginPath();
                ctx.arc(cx, cy - 12 * z * s, 5.5 * z * s, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = mix(cnp, '#a9e7b8', 0.4);
                ctx.beginPath();
                ctx.arc(cx - 1.5 * z * s, cy - 13.5 * z * s, 2.4 * z * s, 0, Math.PI * 2);
                ctx.fill();
            }
        } else { // 'fab' — electronics: compact plant with a blinking antenna
            const info = prism(g.x, g.y, sp.fw, h, base, { stories: 2, door: true });
            const tc = info.topCenter;
            ctx.strokeStyle = '#9fb4c8';
            ctx.lineWidth = Math.max(1, 1.4 * z);
            ctx.beginPath();
            ctx.moveTo(tc.x + info.rx * 0.45, tc.y - info.ry * 0.2);
            ctx.lineTo(tc.x + info.rx * 0.45, tc.y - info.ry * 0.2 - 9 * z);
            ctx.stroke();
            ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(seaTime * 5));
            ctx.fillStyle = '#7de3ff';
            ctx.beginPath();
            ctx.arc(tc.x + info.rx * 0.45, tc.y - info.ry * 0.2 - 10 * z, 1.6 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            return info;
        }
        return { rx, ry, topCenter: { x: g.x, y: g.y - h } };
    }

    // Iso ring/pad on the ground (selection, unlock pulse, inspect focus).
    function groundRing(gx, gy, fw, color, width, scale) {
        const { rx, ry } = footRadii(fw);
        diamondPath(gx, gy, rx * (scale || 1), ry * (scale || 1));
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    function drawNodeBody(n, now) {
        const sp = nodeSpec(n);
        const g = S(n.x, n.y);
        const iconSize = 16 * clampZoom();
        const forSale = n.kind === 'factory' && n.forSale;

        // Plot pad: a subtle paved apron the building sits on, so sites
        // read as intentional lots rather than blocks dropped on grass.
        const pad = footRadii(sp.fw + 9);
        diamondPath(g.x, g.y, pad.rx, pad.ry);
        ctx.fillStyle = 'rgba(10, 16, 26, 0.35)';
        ctx.fill();
        ctx.strokeStyle = rgba(sp.base, 0.28);
        ctx.lineWidth = 1;
        ctx.stroke();

        // selection / focus pads on the ground (drawn under the building)
        if (n === SC.state.selectedNode) {
            groundRing(g.x, g.y, sp.fw + 6, 'rgba(56, 189, 248, 0.9)', 2.5);
        } else if (n === frameHoverNode) {
            // PC affordance: the building a click would hit right now
            groundRing(g.x, g.y, sp.fw + 6, 'rgba(226, 232, 240, 0.5)', 1.5);
        }
        if (n.unlockAt && now - n.unlockAt < 3) {
            const t = (now - n.unlockAt) / 3;
            groundRing(g.x, g.y, sp.fw, `rgba(56, 189, 248, ${0.7 * (1 - t)})`, 3, 1 + t * 2.2);
        }

        const info = n.kind === 'supplier'
            ? drawSupplierSite(n, sp, g) // themed scene: farm/lake/mine/…
            : prism(g.x, g.y, sp.fw, sp.h * zoom(), sp.base, {
                  ghost: forSale, dashed: forSale, roof: forSale ? null : sp.roof,
                  alpha: forSale ? 0.9 : 1,
                  stories: forSale ? 0 : sp.stories, door: !forSale && sp.door
              });
        const tc = info.topCenter;

        // Factory smokestack (back corner of the roof) + a puff of smoke while
        // it's actually crafting — a live "the plant is working" cue.
        if (n.kind === 'factory' && !forSale && sp.stack) {
            const z = zoom();
            const stx = tc.x - info.rx * 0.5, sty = tc.y - info.ry * 0.5;
            const sw = Math.max(2, 3 * z), sh = Math.max(6, 11 * z);
            ctx.fillStyle = shade(sp.base, -0.35);
            ctx.fillRect(stx - sw, sty - sh, sw * 2, sh);
            ctx.fillStyle = shade(sp.base, 0.05);
            ctx.fillRect(stx - sw, sty - sh, sw, sh);
            ctx.fillStyle = '#3a2f2a';
            ctx.fillRect(stx - sw, sty - sh - 2, sw * 2, 2);
            if (n.crafting) {
                for (let i = 0; i < 3; i++) {
                    const ph = (seaTime * 0.6 + i / 3) % 1;
                    const py = sty - sh - ph * 26 * z;
                    ctx.globalAlpha = 0.25 * (1 - ph);
                    ctx.fillStyle = '#cbd5e1';
                    ctx.beginPath();
                    ctx.arc(stx + Math.sin(ph * 6 + i) * 3 * z, py, (2 + ph * 5) * z, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
        }

        // Crafting progress: a slim ring hugging the roof icon (with a faint
        // full-circle track), small enough not to clip the smokestack.
        if (n.kind === 'factory' && !forSale && n.crafting) {
            const frac = Math.min(1, n.crafting.t / SC.craftTime());
            const rr = iconSize * 0.85;
            ctx.beginPath();
            ctx.arc(tc.x, tc.y, rr, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(tc.x, tc.y, rr, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            ctx.strokeStyle = SC.colorOf(n.crafting.task.product);
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.lineCap = 'butt';
        }

        // Icon on the roof — suppliers get a compact plate badge floating
        // over the scene (the themed site is the body, the badge is the
        // at-a-glance material identity); buildings keep the bare glyph.
        ctx.globalAlpha = forSale ? 0.6 : 1;
        if (n.kind === 'supplier') {
            emojiPlateAt(sp.icon, tc.x, tc.y - 4 * clampZoom(), 9 * clampZoom(), 13 * clampZoom());
        } else {
            emoji(sp.icon, tc.x, tc.y - iconSize * 0.15, iconSize);
        }
        ctx.globalAlpha = 1;

        // --- per-kind badges/bars -------------------------------------------
        if (n.kind === 'supplier') {
            const cap = SC.supplierCap(n);
            const frac = Math.max(0, Math.min(1, (n.stock || 0) / cap));
            const bw = 34, bx = tc.x - bw / 2, by = tc.y - iconSize - 9;
            // dark backing plate so the bar doesn't float as a bare dash
            ctx.fillStyle = 'rgba(12, 18, 30, 0.75)';
            roundRectPath(bx - 3, by - 3, bw + 6, 10, 5); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
            roundRectPath(bx, by, bw, 4, 2); ctx.fill();
            ctx.fillStyle = frac < 0.25 ? '#f87171' : sp.base;
            roundRectPath(bx, by, bw * frac, 4, 2); ctx.fill();
            if (n.level > 0) labelAt('▲'.repeat(n.level), tc.x, by - 13, '#facc15', 10);
        } else if (n.kind === 'factory' && forSale) {
            labelAt(`$${SC.CONFIG.FACTORY_SITE_PRICE}`, tc.x, tc.y - iconSize - 6, '#94a3b8', 11);
        } else if (n.kind === 'factory' && n.queue.length > 0) {
            labelAt(String(n.queue.length + (n.crafting ? 1 : 0)), tc.x + info.rx + 8, tc.y - iconSize * 0.5, '#cbd5e1', 11);
        } else if (n.kind === 'yard') {
            const parked = SC.state.trucks.filter(t => t.homeYard === n).length;
            labelAt(`${parked} 🚚`, g.x, g.y + footRadii(sp.fw).ry + 12, '#c4b5fd', 11);
        } else if (n.kind === 'city') {
            labelAt(n.isHQ ? 'HQ' : 'DC', g.x, g.y + footRadii(sp.fw).ry + 12, n.isHQ ? '#38bdf8' : '#34d399', 11);
            if (n.isHQ) {
                const parked = SC.state.trucks.filter(t => t.homeYard === n).length;
                labelAt(`${parked} 🚚`, g.x, g.y + footRadii(sp.fw).ry + 28, '#7dd3fc', 10);
            }
        }
    }

    // --- trucks -------------------------------------------------------------
    function truckScreenAngle(t) {
        // world heading -> screen heading through the iso projection
        const dx = Math.cos(t.angle || 0), dy = Math.sin(t.angle || 0);
        return Math.atan2((dx + dy) * ISO.ky, (dx - dy) * ISO.kx);
    }

    // Extrude a heading-aligned rounded box: a rect of size w×h centered at
    // local offset cx (along the heading), raised `dy` into the iso plane.
    function isoBoxSlab(g, ang, cx, dy, w, h, r, fill) {
        ctx.save();
        ctx.translate(g.x, g.y - dy);
        ctx.rotate(ang);
        ctx.scale(1, 0.6); // lie down into the iso ground plane
        roundRectPath(cx - w / 2, -h / 2, w, h, r);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
    }

    function drawTruckBody(t) {
        const g = S(t.x, t.y);
        const z = clampZoom();
        const item = t.cargo[0];
        const body = item ? SC.colorOf(item) : '#8b98ab';
        const ang = truckScreenAngle(t);
        const L = 26 * z, W = 11 * z;         // footprint length / width
        const Ht = 9 * z, Hc = 6.5 * z;        // trailer / cab heights
        const trailerCx = -L * 0.16, trailerW = L * 0.68;
        const cabCx = L * 0.34, cabW = L * 0.32;
        const steps = 5;

        // ground shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        diamondPath(g.x, g.y + 2 * z, 15 * z, 8 * z);
        ctx.fillStyle = '#05070c';
        ctx.fill();
        ctx.restore();

        // wheels peeking out at the base
        ctx.save();
        ctx.translate(g.x, g.y); ctx.rotate(ang); ctx.scale(1, 0.6);
        ctx.fillStyle = '#12161d';
        for (const wx of [-L * 0.28, L * 0.2]) {
            for (const wy of [-W * 0.52, W * 0.52]) {
                ctx.beginPath(); ctx.ellipse(wx, wy, 3.2 * z, 2.4 * z, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();

        // trailer (colored by cargo) and cab, each extruded dark→light
        for (let s = 0; s <= steps; s++) {
            isoBoxSlab(g, ang, trailerCx, Ht * s / steps, trailerW, W, 3 * z, shade(body, -0.34 + 0.5 * (s / steps)));
        }
        const cabBody = shade(body, -0.06);
        for (let s = 0; s <= steps; s++) {
            isoBoxSlab(g, ang, cabCx, Hc * s / steps, cabW, W * 0.9, 2.5 * z, shade(cabBody, -0.34 + 0.5 * (s / steps)));
        }
        // trailer roof outline
        ctx.save();
        ctx.translate(g.x, g.y - Ht); ctx.rotate(ang); ctx.scale(1, 0.6);
        roundRectPath(trailerCx - trailerW / 2, -W / 2, trailerW, W, 3 * z);
        ctx.strokeStyle = rgba(shade(body, 0.45), 0.55); ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
        // windshield glint on the cab front
        ctx.save();
        ctx.translate(g.x, g.y - Hc); ctx.rotate(ang); ctx.scale(1, 0.6);
        ctx.fillStyle = 'rgba(186, 214, 236, 0.55)';
        roundRectPath(cabCx + cabW * 0.06, -W * 0.32, cabW * 0.3, W * 0.64, 1.5 * z);
        ctx.fill();
        ctx.restore();

        // headlights while driving: two warm dots + a faint beam cone on the
        // ground ahead — sells the night-time palette and motion at a glance
        if (t.path) {
            ctx.save();
            ctx.translate(g.x, g.y - 2 * z); ctx.rotate(ang); ctx.scale(1, 0.6);
            const nose = cabCx + cabW / 2;
            ctx.fillStyle = 'rgba(255, 224, 150, 0.28)';
            ctx.beginPath();
            ctx.moveTo(nose, -W * 0.3); ctx.lineTo(nose + 16 * z, -W * 0.75);
            ctx.lineTo(nose + 16 * z, W * 0.75); ctx.lineTo(nose, W * 0.3);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255, 236, 180, 0.95)';
            for (const wy of [-W * 0.3, W * 0.3]) {
                ctx.beginPath(); ctx.arc(nose, wy, 1.3 * z, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }

        if (item) {
            emojiPlateAt(SC.emojiOf(item), g.x, g.y - Ht - 8 * z, 9 * z, 13 * z);
            if (t.cargo.length > 1) labelAt('×' + t.cargo.length, g.x + 13 * z, g.y - Ht - 15 * z, '#f8fafc', 9);
        }
    }

    function emojiPlateAt(ch, sx, sy, r, size) {
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();
        emoji(ch, sx, sy, size);
    }

    // --- order bubbles (billboards, always on top) --------------------------
    function drawOrderBubbles() {
        const byCity = new Map();
        for (const o of SC.state.orders) {
            if (!byCity.has(o.city)) byCity.set(o.city, []);
            byCity.get(o.city).push(o);
        }
        const z = clampZoom();
        for (const [city, orders] of byCity) {
            const sp = nodeSpec(city);
            const anchor = { x: S(city.x, city.y).x, y: S(city.x, city.y).y - sp.h * zoom() };
            orders.forEach((o, i) => {
                const bx = anchor.x + (i - (orders.length - 1) / 2) * 40 * z;
                const by = anchor.y - 34 * z;
                const r = 15 * z;
                const frac = Math.max(0, o.deadline / o.deadlineTotal);
                const urgent = frac < 0.25;

                // pointer down to the roof
                ctx.beginPath();
                ctx.moveTo(bx, by + r);
                ctx.lineTo(bx - 4 * z, by + r - 2 * z);
                ctx.lineTo(bx + 4 * z, by + r - 2 * z);
                ctx.closePath();
                ctx.fillStyle = '#1e293b';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(bx, by, r, 0, Math.PI * 2);
                ctx.fillStyle = '#1e293b';
                ctx.fill();
                ctx.strokeStyle = urgent ? '#f87171' : 'rgba(148, 163, 184, 0.55)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(bx, by, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
                ctx.strokeStyle = urgent ? '#f87171' : SC.colorOf(o.product);
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.lineCap = 'butt';

                emoji(SC.emojiOf(o.product), bx, by, 17 * z);
                const left = o.qty - o.deliveredUnits;
                if (left > 1) labelAt(String(left), bx + r + 2, by - r + 2, '#f8fafc', 10);
                if (o.noRoute) labelAt('no route!', bx, by - r - 10, '#f87171', 10);
            });
        }
    }

    // --- glow overlays on roads (order / inspect highlight) -----------------
    // Each path may carry a `.good` property (see inspect.collectRoutePaths):
    // that leg is tinted by the cargo hauled on it — e.g. a bread order
    // glows gold on the wheat leg, blue on the water leg and orange on the
    // final bread leg — so a route reads as its chain steps. `color` is the
    // fallback for legs without a good.
    function drawGlowPaths(paths, color, alpha) {
        ctx.lineCap = 'round';
        for (const path of paths) {
            const legColor = path.good ? SC.colorOf(path.good) : color;
            ctx.beginPath();
            path.forEach((n, i) => {
                const p = S(n.x, n.y);
                i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
            });
            ctx.strokeStyle = legColor;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.max(5, 8 * zoom());
            ctx.shadowBlur = 12;
            ctx.shadowColor = legColor;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.lineCap = 'butt';
    }

    function drawHighlight(now) {
        const h = SC.state.highlight;
        if (!h || now > h.until) return;
        const fade = Math.min(1, (h.until - now) / 0.5);
        drawGlowPaths(h.paths, h.color, 0.55 * fade);
        const c = S(h.city.x, h.city.y);
        const pulse = (22 + Math.sin(now * 6) * 4) * clampZoom();
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, pulse, pulse * 0.55, 0, 0, Math.PI * 2);
        ctx.strokeStyle = h.color;
        ctx.globalAlpha = 0.8 * fade;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    function drawInspectHighlight(now) {
        if (SC.state.mode !== 'inspect') return;
        const node = SC.input.getInspectNode && SC.input.getInspectNode();
        const info = SC.inspect.infoFor(node);
        if (!info) return;
        const paths = SC.inspect.highlightPathsFor(info);
        const color = info.kind === 'supplier' ? SC.colorOf(info.mat) : '#38bdf8';
        const pulse = 1 + Math.sin(now * 6) * 0.15;
        drawGlowPaths(paths, color, 0.6 * pulse);
        const sp = nodeSpec(node);
        const g = S(node.x, node.y);
        groundRing(g.x, g.y, sp.fw + 8, color, 2.5);
    }

    // --- ghosts (road drag, manual placement) -------------------------------
    function drawGhostRoad() {
        const sel = SC.state.selectedNode;
        const hover = SC.input.getHover && SC.input.getHover();
        if (!sel || !hover) return;
        // Snap to whatever node a tap right now would actually hit (same
        // capsule hit-test as input.handleTap), so the preview never
        // disagrees with the click.
        let target = SC.input.getHoverNode && SC.input.getHoverNode();
        if (target === sel) target = null;
        const end = target ? { x: target.x, y: target.y } : hover;
        // Shows the bridge cost when crossing the river — the actual
        // bridge-vs-ferry choice happens in a modal once the road is tapped.
        const q = target ? SC.roads.quote(sel, target) : (() => {
            const len = Math.hypot(sel.x - end.x, sel.y - end.y);
            const bridge = SC.map.segmentCrossesRiver(sel.x, sel.y, end.x, end.y);
            const mult = bridge ? SC.CONFIG.BRIDGE_MULT : 1;
            return { len, bridge, ferry: false, cost: Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT * mult) };
        })();
        if (!q) return;

        const affordable = SC.canAfford(q.cost);
        const a = S(sel.x, sel.y), b = S(end.x, end.y);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = affordable ? 'rgba(52, 211, 153, 0.7)' : 'rgba(248, 113, 113, 0.7)';
        ctx.lineWidth = Math.max(3, 4 * zoom());
        ctx.lineCap = 'round';
        ctx.setLineDash([10, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'butt';

        const mx = (sel.x + end.x) / 2, my = (sel.y + end.y) / 2;
        const crossingLabel = q.ferry ? ' (ferry)' : q.bridge ? ' (bridge)' : '';
        const mp = S(mx, my);
        labelAt(`$${q.cost}${crossingLabel}`, mp.x, mp.y - 14, affordable ? '#34d399' : '#f87171');
    }

    function drawPlacementGhost() {
        const pm = SC.state.placeMode;
        const hover = SC.input.getHover && SC.input.getHover();
        if (!pm || !hover) return;
        const valid = SC.canAfford(SC.placement.price(pm.kind)) && SC.placement.canPlaceAt(hover.x, hover.y);
        const cost = SC.placement.price(pm.kind);
        const base = valid ? '#34d399' : '#f87171';
        const g = S(hover.x, hover.y);
        const fw = 24;
        // footprint ghost pad
        const { rx, ry } = footRadii(fw);
        diamondPath(g.x, g.y, rx, ry);
        ctx.strokeStyle = rgba(base, 0.9);
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        prism(g.x, g.y, fw, (pm.kind === 'yard' ? 14 : 30) * zoom(), base,
              { ghost: true, dashed: true, outline: rgba(base, 0.9) });
        const tc = { x: g.x, y: g.y - (pm.kind === 'yard' ? 14 : 30) * zoom() };
        ctx.globalAlpha = 0.85;
        emoji(pm.kind === 'yard' ? '🅿️' : SC.emojiOf(pm.good), tc.x, tc.y, 18 * clampZoom());
        ctx.globalAlpha = 1;
        labelAt(`$${cost}${valid ? '' : ' — blocked'}`, tc.x, tc.y - 20, valid ? '#34d399' : '#f87171', 11);
    }

    // --- floaters (rising $ texts) -----------------------------------------
    function drawFloaters(dt) {
        for (let i = floaters.length - 1; i >= 0; i--) {
            const f = floaters[i];
            f.t += dt;
            if (f.t >= 1.6) { floaters.splice(i, 1); continue; }
            const p = S(f.x, f.y);
            const rise = f.t * 30;
            ctx.font = `700 14px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = Math.min(1, 2 * (1.6 - f.t));
            ctx.fillStyle = 'rgba(8, 12, 20, 0.7)';
            ctx.fillText(f.text, p.x + 1, p.y - rise + 1);
            ctx.fillStyle = f.color;
            ctx.fillText(f.text, p.x, p.y - rise);
            ctx.globalAlpha = 1;
        }
    }

    // --- off-screen arrows (screen space) ----------------------------------
    function nodeIndicatorColor(n) {
        if (n.kind === 'supplier') return SC.colorOf(n.mat);
        if (n.kind === 'factory') return SC.colorOf(n.recipe);
        return n.isHQ ? '#38bdf8' : '#34d399';
    }

    function drawOffscreenArrow(wx, wy, color, icon, alpha) {
        const w = window.innerWidth, h = window.innerHeight;
        const cx = w / 2, cy = h / 2;
        const margin = 34;
        const halfW = w / 2 - margin, halfH = h / 2 - margin;

        const p = SC.camera.toScreen(wx, wy);
        if (p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h) return;

        const dx = p.x - cx, dy = p.y - cy;
        const scale = Math.min(halfW / Math.abs(dx || 1e-6), halfH / Math.abs(dy || 1e-6));
        const ex = cx + dx * scale, ey = cy + dy * scale;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        ctx.globalAlpha = alpha;
        ctx.font = '15px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, ex - Math.cos(angle) * 20, ey - Math.sin(angle) * 20);
        ctx.globalAlpha = 1;
    }

    function drawOffscreenArrows(now) {
        const pulse = 0.55 + 0.45 * Math.sin(seaTime * 4);
        for (const n of SC.state.nodes) {
            if (!n.active || n.edges.length > 0) continue;
            const icon = n.kind === 'supplier' ? SC.emojiOf(n.mat)
                       : n.kind === 'factory' ? SC.emojiOf(n.recipe)
                       : (n.isHQ ? '⭐' : '🏢');
            drawOffscreenArrow(n.x, n.y, nodeIndicatorColor(n), icon, pulse);
        }
        const h = SC.state.highlight;
        if (h && now <= h.until) {
            const fade = Math.min(1, (h.until - now) / 0.5);
            const icon = h.city.isHQ ? '⭐' : '🏢';
            drawOffscreenArrow(h.city.x, h.city.y, h.color, icon, pulse * fade);
        }
    }

    // --- frame --------------------------------------------------------------
    function frame(dt, now) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        frameHoverNode = (SC.state.mode === 'build' && !SC.state.placeMode &&
                          SC.input.getHoverNode) ? SC.input.getHoverNode() : null;

        drawSky();
        drawWorld(dt); // mountains ride inside the cached bg layer
        drawRoads();
        drawHighlight(now);
        drawInspectHighlight(now);
        drawGhostRoad();
        drawPlacementGhost();

        // Depth-sorted buildings + trucks (back-to-front by world x+y).
        const ents = [];
        for (const n of SC.state.nodes) if (n.active) ents.push({ kind: 'node', ref: n, depth: n.x + n.y });
        for (const t of SC.state.trucks) if (t.cargo !== undefined) ents.push({ kind: 'truck', ref: t, depth: t.x + t.y });
        ents.sort((a, b) => a.depth - b.depth);

        // shadows first so no building casts onto another's face
        for (const e of ents) {
            if (e.kind === 'node') drawShadow(S(e.ref.x, e.ref.y).x, S(e.ref.x, e.ref.y).y, nodeSpec(e.ref).fw);
        }
        for (const e of ents) {
            if (e.kind === 'node') drawNodeBody(e.ref, now);
            else drawTruckBody(e.ref);
        }

        drawOrderBubbles();
        drawFloaters(dt);
        drawOffscreenArrows(now);
    }

    return { attach, frame, resize, nodeIconAnchor };
})();
