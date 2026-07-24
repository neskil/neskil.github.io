// Canvas rendering — NETWORK layer: roads (incl. bridges/ferries), buildings
// and site models, node bodies, order bubbles, highlights, ghost/placement
// previews, and offscreen edge arrows. Shares SC._render (R) with render-core.
(function() {
    const R = SC._render;
    const { S, zoom, mix, shade, rgba, hexToRgb, makeRng, footRadii, diamondPath,
            roundRectPath, clampZoom, label, labelAt, emoji, ISO } = R;

    const SITE_OF = { wheat: 'farm', water: 'lake', ore: 'mine', coal: 'mine',
                      copper: 'mine', wool: 'pasture', rubber: 'grove', chips: 'fab' };
    const SITE_H = { farm: 12, lake: 9, mine: 20, pasture: 12, grove: 18, fab: 22 };
    let shadowSprite = null;
    let glowSprite = null;

    // Factory production pills (the floating "3/5" stock badges) get dense
    // once several factories are on screen at once while zoomed out — most
    // noticeable on a small mobile viewport. Auto-hide is opt-out via the
    // ☰ menu's "Factory labels" toggle (SC._ui.getHidePills). The threshold
    // is a fraction of the camera's current zoom range (0 = as far out as
    // this map/viewport currently allows, 1 = closest in) rather than a raw
    // zoom number, since minZoom/maxZoom themselves shift as the playing
    // field expands (see camera.js setViewport).
    function pillsVisible() {
        if (!SC._ui || !SC._ui.getHidePills()) return true;
        const cam = SC.camera.cam;
        const range = cam.maxZoom - cam.minZoom;
        const frac = range > 0 ? (zoom() - cam.minZoom) / range : 1;
        const isMobile = window.innerWidth <= 768;
        return frac >= (isMobile ? 0.35 : 0.12);
    }

    function strokeEdge(e, width, color, dash) { strokeEdgeRange(e, 0, 1, width, color, dash); }

    function strokeEdgeRange(e, t0, t1, width, color, dash) {
        if (t1 - t0 < 0.002) return;
        const ax = e.a.x + (e.b.x - e.a.x) * t0, ay = e.a.y + (e.b.y - e.a.y) * t0;
        const bx = e.a.x + (e.b.x - e.a.x) * t1, by = e.a.y + (e.b.y - e.a.y) * t1;
        const a = S(ax, ay), b = S(bx, by);
        R.ctx.beginPath();
        R.ctx.moveTo(a.x, a.y);
        R.ctx.lineTo(b.x, b.y);
        R.ctx.strokeStyle = color;
        R.ctx.lineWidth = width;
        R.ctx.lineCap = 'round';
        if (dash) R.ctx.setLineDash(dash); else R.ctx.setLineDash([]);
        R.ctx.stroke();
        R.ctx.setLineDash([]);
        R.ctx.lineCap = 'butt';
    }

    function drawRoadSegment(e, casing, surfaceW, t0, t1, z) {
        strokeEdgeRange(e, t0, t1, casing, 'rgba(8, 12, 20, 0.55)');
        const surf = e.level > 0 ? 'rgba(226, 232, 240, 0.85)' : 'rgba(140, 152, 170, 0.75)';
        strokeEdgeRange(e, t0, t1, surfaceW, surf);
        if (e.level > 0) strokeEdgeRange(e, t0, t1, Math.max(1, 1.6 * z), 'rgba(250, 204, 21, 0.6)', [11 * z, 11 * z]);
    }

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
            R.ctx.strokeStyle = 'rgba(60, 68, 82, 0.85)';
            R.ctx.lineWidth = Math.max(2, 3 * z);
            R.ctx.beginPath();
            R.ctx.moveTo(base.x, base.y - lift);
            R.ctx.lineTo(base.x, base.y + 2 * z);
            R.ctx.stroke();
            R.ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            R.ctx.beginPath();
            R.ctx.ellipse(base.x, base.y + 2 * z, 5 * z, 2 * z, 0, 0, Math.PI * 2);
            R.ctx.fill();
        }

        // Shadow the deck casts on the water below it
        R.ctx.strokeStyle = 'rgba(2, 6, 12, 0.35)';
        R.ctx.lineWidth = casing;
        R.ctx.lineCap = 'round';
        R.ctx.beginPath();
        R.ctx.moveTo(p0.x, p0.y + 3 * z);
        R.ctx.lineTo(p1.x, p1.y + 3 * z);
        R.ctx.stroke();

        // Deck: dark casing under a lighter concrete surface, both lifted
        strokeSpan(p0, p1, 0, -lift, casing, 'rgba(8, 12, 20, 0.6)');
        strokeSpan(p0, p1, 0, -lift, surfaceW, 'rgba(176, 190, 210, 0.92)');

        // Guard rails along both edges of the deck
        const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len, railOff = surfaceW / 2 + 1.5 * z;
        R.ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
        R.ctx.lineWidth = Math.max(1, 1.2 * z);
        for (const sign of [-1, 1]) {
            R.ctx.beginPath();
            R.ctx.moveTo(p0.x + nx * railOff * sign, p0.y - lift + ny * railOff * sign);
            R.ctx.lineTo(p1.x + nx * railOff * sign, p1.y - lift + ny * railOff * sign);
            R.ctx.stroke();
        }
        R.ctx.lineCap = 'butt';
    }

    function strokeSpan(p0, p1, dx, dy, width, color) {
        R.ctx.strokeStyle = color;
        R.ctx.lineWidth = width;
        R.ctx.lineCap = 'round';
        R.ctx.beginPath();
        R.ctx.moveTo(p0.x + dx, p0.y + dy);
        R.ctx.lineTo(p1.x + dx, p1.y + dy);
        R.ctx.stroke();
    }

    function drawFerryCrossing(e, surfaceW, crossing, z) {
        const wx0 = e.a.x + (e.b.x - e.a.x) * crossing.t0, wy0 = e.a.y + (e.b.y - e.a.y) * crossing.t0;
        const wx1 = e.a.x + (e.b.x - e.a.x) * crossing.t1, wy1 = e.a.y + (e.b.y - e.a.y) * crossing.t1;
        const p0 = S(wx0, wy0), p1 = S(wx1, wy1);
        R.ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
        R.ctx.lineWidth = surfaceW;
        R.ctx.lineCap = 'round';
        R.ctx.setLineDash([4 * z + 2, 10 * z]);
        R.ctx.beginPath();
        R.ctx.moveTo(p0.x, p0.y);
        R.ctx.lineTo(p1.x, p1.y);
        R.ctx.stroke();
        R.ctx.setLineDash([]);
        R.ctx.lineCap = 'butt';
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
                if (e.ferry) drawFerryCrossing(e, surfaceW, crossing, z);
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

    function drawRouteFlow() {
        const active = new Map(); // edge -> { dir: ±1 along a→b, item }
        for (const t of SC.state.trucks) {
            if (!t.path || t.pathIdx >= t.path.length - 1) continue;
            const a = t.path[t.pathIdx], b = t.path[t.pathIdx + 1];
            const e = SC.roads.findEdge(a, b);
            if (e && !active.has(e)) active.set(e, { dir: e.a === a ? 1 : -1, item: t.cargo[0] || null });
        }
        if (!active.size) return;
        const z = zoom();
        R.ctx.lineCap = 'round';
        for (const [e, info] of active) {
            const A = S(e.a.x, e.a.y), B = S(e.b.x, e.b.y);
            const col = info.item ? SC.colorOf(info.item) : '#8fd0ff';
            R.ctx.strokeStyle = rgba(col, 0.55);
            R.ctx.lineWidth = Math.max(1.6, 2.4 * z);
            R.ctx.setLineDash([2.2 * z, 13 * z]);
            R.ctx.lineDashOffset = -info.dir * ((R.seaTime * 46 * z) % 100000);
            R.ctx.beginPath(); R.ctx.moveTo(A.x, A.y); R.ctx.lineTo(B.x, B.y); R.ctx.stroke();
        }
        R.ctx.setLineDash([]);
        R.ctx.lineDashOffset = 0; // reset — else later dashed strokes (e.g. the
        R.ctx.lineCap = 'butt';   // pasture fence) inherit this animated offset
    }

    // Hoisted out of nodeSpec (called ~2×/node/frame) so these lookup sets
    // aren't reallocated on every call.
    const FACTORY_LOW = new Set(['bread', 'shoes', 'steel', 'wire']);
    const FACTORY_TALL = new Set(['circuit', 'car']);
    function nodeSpec(n) {
        if (n.kind === 'supplier') {
            const base = SC.colorOf(n.mat);
            const site = SITE_OF[n.mat] || 'fab';
            return { base, fw: site === 'fab' ? 20 : 24, site,
                     h: SITE_H[site] + (n.level || 0) * 3, icon: SC.emojiOf(n.mat) };
        }
        if (n.kind === 'factory') {
            let base = '#6b7a90', h = 32, stories = 3, stack = true;
            if (FACTORY_LOW.has(n.recipe)) {
                base = '#7c8b9f'; h = 24; stories = 2; stack = true;
            } else if (FACTORY_TALL.has(n.recipe)) {
                base = '#5c6b7e'; h = 42; stories = 4; stack = false;
            } else if (n.recipe === 'robot') {
                base = '#4b5563'; h = 52; stories = 5; stack = false;
            }
            return { base, fw: 22, h, icon: SC.emojiOf(n.recipe), roof: SC.colorOf(n.recipe), stories, stack, door: true };
        }
        if (n.kind === 'yard') {
            // A yard is a flat asphalt lot (drawYardSite), not an extruded
            // block — no roof icon, the parked trucks are the visual.
            return { base: '#3a3f4a', fw: 24, h: 0, flat: true };
        }
        if (n.kind === 'junction') {
            return { base: '#7d8898', fw: 15, h: 0 };
        }
        // city
        if (n.isHQ) return { base: '#0ea5e9', fw: 20, h: 46, stories: 6, door: true };
        return { base: '#10b981', fw: 18, h: 32, stories: 4, door: true };
    }

    function hash01(seed, i) {
        const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    function faceWindows(origin, corner, hpx, rows, seed) {
        const ex = corner.x - origin.x, ey = corner.y - origin.y;
        const cols = 2, du = 0.15, dv = 0.055;
        const P = (u, v) => ({ x: origin.x + ex * u, y: origin.y + ey * u - hpx * v });
        for (let r = 0; r < rows; r++) {
            const v = (r + 0.62) / (rows + 0.2);
            for (let c = 0; c < cols; c++) {
                const u = (c + 0.5) / cols;
                const lit = hash01(seed, r * 7 + c * 13);
                if (lit > 0.66) continue; // dark window: leave the wall as-is
                // Windows glow at night, all but dark by day.
                let a = 0.9 * (0.14 + 0.86 * R.nightLevel);
                const fl = hash01(seed, r * 5 + c * 3 + 1);
                if (fl > 0.82) a *= 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(R.seaTime * 3 + fl * 25));
                const p1 = P(u - du, v - dv), p2 = P(u + du, v - dv),
                      p3 = P(u + du, v + dv), p4 = P(u - du, v + dv);
                R.ctx.globalAlpha = a;
                R.ctx.fillStyle = hash01(seed, r + c) > 0.5 ? '#ffd98a' : '#ffe6ad';
                R.ctx.beginPath();
                R.ctx.moveTo(p1.x, p1.y); R.ctx.lineTo(p2.x, p2.y);
                R.ctx.lineTo(p3.x, p3.y); R.ctx.lineTo(p4.x, p4.y); R.ctx.closePath();
                R.ctx.fill();
            }
        }
        R.ctx.globalAlpha = 1;
    }

    function prism(gx, gy, fw, hpx, base, opts) {
        opts = opts || {};
        const { rx, ry } = footRadii(fw);
        const alpha = opts.alpha == null ? 1 : opts.alpha;
        R.ctx.globalAlpha = alpha;

        // ground corners
        const bTop = { x: gx, y: gy - ry }, bRight = { x: gx + rx, y: gy };
        const bBot = { x: gx, y: gy + ry }, bLeft = { x: gx - rx, y: gy };
        // top-face corners (raised)
        const tTop = { x: bTop.x, y: bTop.y - hpx }, tRight = { x: bRight.x, y: bRight.y - hpx };
        const tBot = { x: bBot.x, y: bBot.y - hpx }, tLeft = { x: bLeft.x, y: bLeft.y - hpx };

        const topC = shade(base, 0.2), rightC = shade(base, -0.08), leftC = shade(base, -0.3);

        // right (front-right) face
        R.ctx.beginPath();
        R.ctx.moveTo(bRight.x, bRight.y); R.ctx.lineTo(bBot.x, bBot.y);
        R.ctx.lineTo(tBot.x, tBot.y); R.ctx.lineTo(tRight.x, tRight.y); R.ctx.closePath();
        R.ctx.fillStyle = opts.ghost ? rgba(base, 0.1) : rightC;
        R.ctx.fill();
        // left (front-left) face
        R.ctx.beginPath();
        R.ctx.moveTo(bBot.x, bBot.y); R.ctx.lineTo(bLeft.x, bLeft.y);
        R.ctx.lineTo(tLeft.x, tLeft.y); R.ctx.lineTo(tBot.x, tBot.y); R.ctx.closePath();
        R.ctx.fillStyle = opts.ghost ? rgba(base, 0.16) : leftC;
        R.ctx.fill();
        // top face
        R.ctx.beginPath();
        R.ctx.moveTo(tTop.x, tTop.y); R.ctx.lineTo(tRight.x, tRight.y);
        R.ctx.lineTo(tBot.x, tBot.y); R.ctx.lineTo(tLeft.x, tLeft.y); R.ctx.closePath();
        R.ctx.fillStyle = opts.roof ? shade(opts.roof, 0.05) : (opts.ghost ? rgba(base, 0.28) : topC);
        R.ctx.fill();

        // crisp edges
        R.ctx.lineJoin = 'round';
        R.ctx.lineWidth = 1;
        R.ctx.strokeStyle = opts.outline || rgba(shade(base, 0.4), opts.ghost ? 0.7 : 0.5);
        if (opts.dashed) R.ctx.setLineDash([5, 4]); else R.ctx.setLineDash([]);
        // outline the silhouette + the top ridge
        R.ctx.beginPath();
        R.ctx.moveTo(bLeft.x, bLeft.y); R.ctx.lineTo(bBot.x, bBot.y); R.ctx.lineTo(bRight.x, bRight.y);
        R.ctx.lineTo(tRight.x, tRight.y); R.ctx.lineTo(tTop.x, tTop.y); R.ctx.lineTo(tLeft.x, tLeft.y); R.ctx.closePath();
        R.ctx.stroke();
        R.ctx.beginPath();
        R.ctx.moveTo(tBot.x, tBot.y); R.ctx.lineTo(tRight.x, tRight.y);
        R.ctx.moveTo(tBot.x, tBot.y); R.ctx.lineTo(tLeft.x, tLeft.y);
        R.ctx.moveTo(tBot.x, tBot.y); R.ctx.lineTo(tTop.x, tTop.y);
        R.ctx.stroke();
        R.ctx.setLineDash([]);

        // Story lines across the two front faces — cheap "this is a building
        // with floors" nuance. Each is a V at constant height following the
        // front silhouette (bRight→bBot→bLeft, raised by f·hpx).
        if (!opts.ghost && opts.stories > 1 && hpx > 10) {
            R.ctx.strokeStyle = rgba(shade(base, -0.45), 0.5);
            R.ctx.lineWidth = 1;
            for (let k = 1; k < opts.stories; k++) {
                const dy = hpx * k / opts.stories;
                R.ctx.beginPath();
                R.ctx.moveTo(bRight.x, bRight.y - dy);
                R.ctx.lineTo(bBot.x, bBot.y - dy);
                R.ctx.lineTo(bLeft.x, bLeft.y - dy);
                R.ctx.stroke();
            }
        }
        // Warm lit windows on the two front faces. Each face is spanned by
        // an origin (bBot) + a ground edge vector to the far corner + an
        // up vector (0,-hpx); a window at fraction (u,v) with half-size
        // (du,dv) maps to a parallelogram, so it sits correctly in iso.
        // Seeded per building so the lit/dark pattern is stable, with a few
        // flickering. Drawn every frame (buildings aren't in the bg cache).
        if (!opts.ghost && opts.windows && hpx > 16) {
            const rows = Math.max(2, opts.stories || 3);
            faceWindows(bBot, bRight, hpx, rows, opts.winSeed || 0);
            faceWindows(bBot, bLeft, hpx, rows, (opts.winSeed || 0) + 97);
        }
        // Doorway centered on the front (bottom) corner
        if (!opts.ghost && opts.door) {
            const dh = Math.min(hpx * 0.4, ry * 1.1);
            const dwx = rx * 0.16, dwy = ry * 0.16;
            R.ctx.beginPath();
            R.ctx.moveTo(bBot.x - dwx, bBot.y - dwy);
            R.ctx.lineTo(bBot.x + dwx, bBot.y - dwy);
            R.ctx.lineTo(bBot.x + dwx, bBot.y - dwy - dh);
            R.ctx.lineTo(bBot.x, bBot.y - dwy - dh - dwy * 0.6);
            R.ctx.lineTo(bBot.x - dwx, bBot.y - dwy - dh);
            R.ctx.closePath();
            R.ctx.fillStyle = rgba(shade(base, -0.6), 0.85);
            R.ctx.fill();
        }

        R.ctx.globalAlpha = 1;
        return { rx, ry, topCenter: { x: gx, y: gy - hpx }, bBot };
    }

    function ensureShadowSprite() {
        if (shadowSprite) return;
        shadowSprite = document.createElement('canvas');
        shadowSprite.width = shadowSprite.height = 128;
        const c = shadowSprite.getContext('2d');
        const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
        g.addColorStop(0, 'rgba(5, 7, 12, 0.5)');
        g.addColorStop(0.6, 'rgba(5, 7, 12, 0.24)');
        g.addColorStop(1, 'rgba(5, 7, 12, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
    }

    function drawShadow(gx, gy, fw, hpx) {
        ensureShadowSprite();
        const { rx, ry } = footRadii(fw);
        const len = rx * 1.05 + (hpx || 0) * R.shadowLen * 0.8; // reach along the light
        const wid = ry * 1.15;
        const ang = Math.atan2(R.shadowDY, R.shadowDX);
        R.ctx.save();
        R.ctx.globalAlpha = 0.32 + 0.22 * R.dayness; // firmer in daylight, soft at night
        R.ctx.translate(gx, gy + ry * 0.35);
        R.ctx.rotate(ang);
        // +x is now the shadow direction: span from just behind the base out to `len`
        R.ctx.drawImage(shadowSprite, -rx * 1.1, -wid, rx * 1.1 + len, wid * 2);
        R.ctx.restore();
        R.ctx.globalAlpha = 1;
    }

    function bloom(sx, sy, r, col, a) {
        if (a <= 0.01 || r <= 0) return;
        R.ctx.save();
        R.ctx.globalCompositeOperation = 'lighter';
        R.ctx.globalAlpha = a;
        const g = R.ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, col);
        g.addColorStop(0.4, rgba(col, 0.5));
        g.addColorStop(1, rgba(col, 0));
        R.ctx.fillStyle = g;
        R.ctx.beginPath(); R.ctx.arc(sx, sy, r, 0, Math.PI * 2); R.ctx.fill();
        R.ctx.restore();
    }

    function warmGlowSprite() {
        if (!glowSprite) {
            glowSprite = document.createElement('canvas');
            glowSprite.width = glowSprite.height = 128;
            const c = glowSprite.getContext('2d');
            const g = c.createRadialGradient(64, 64, 4, 64, 64, 62);
            g.addColorStop(0, 'rgba(255, 214, 140, 0.5)');
            g.addColorStop(0.5, 'rgba(255, 190, 110, 0.16)');
            g.addColorStop(1, 'rgba(255, 190, 110, 0)');
            c.fillStyle = g;
            c.fillRect(0, 0, 128, 128);
        }
        return glowSprite;
    }

    function drawSupplierSite(n, sp, g) {
        const z = zoom();
        const { rx, ry } = footRadii(sp.fw);
        const h = sp.h * z;
        const base = sp.base;

        if (sp.site === 'farm') {
            // Tilled field: soil in the plot, furrow rows along the iso axis,
            // a tiny barn on the back corner.
            R.ctx.save();
            diamondPath(g.x, g.y, rx * 0.92, ry * 0.92);
            R.ctx.clip();
            R.ctx.fillStyle = '#3a2e20';
            R.ctx.fillRect(g.x - rx, g.y - ry, rx * 2, ry * 2);
            R.ctx.strokeStyle = rgba(base, 0.6);
            R.ctx.lineWidth = Math.max(1.5, 2.2 * z);
            for (let k = -2; k <= 2; k++) {
                const ox = -0.5 * k * rx * 0.36, oy = 0.25 * k * rx * 0.36;
                R.ctx.beginPath();
                R.ctx.moveTo(g.x + ox - rx, g.y + oy - rx * 0.5);
                R.ctx.lineTo(g.x + ox + rx, g.y + oy + rx * 0.5);
                R.ctx.stroke();
            }
            R.ctx.restore();
            prism(g.x, g.y - ry * 0.62, 6, 9 * z, '#8a5a33');
        } else if (sp.site === 'lake') {
            // Pond with ripple rings + a pump hut piping out of it.
            const pg = R.ctx.createLinearGradient(0, g.y - ry, 0, g.y + ry);
            pg.addColorStop(0, '#1c4a6e');
            pg.addColorStop(1, '#0d2a44');
            R.ctx.beginPath();
            R.ctx.ellipse(g.x, g.y, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2);
            R.ctx.fillStyle = pg;
            R.ctx.fill();
            R.ctx.strokeStyle = 'rgba(6, 14, 24, 0.6)';
            R.ctx.lineWidth = 2;
            R.ctx.stroke();
            R.ctx.strokeStyle = 'rgba(150, 220, 255, 0.28)';
            R.ctx.lineWidth = 1.2;
            for (const rr of [0.35, 0.58]) {
                const ph = (R.seaTime * 0.5 + rr) % 1;
                R.ctx.globalAlpha = 0.6 * (1 - ph);
                R.ctx.beginPath();
                R.ctx.ellipse(g.x, g.y, rx * (0.2 + ph * rr), ry * (0.2 + ph * rr), 0, 0, Math.PI * 2);
                R.ctx.stroke();
            }
            R.ctx.globalAlpha = 1;
            R.ctx.strokeStyle = '#5a7d96';
            R.ctx.lineWidth = Math.max(2, 2.5 * z);
            R.ctx.beginPath();
            R.ctx.moveTo(g.x + rx * 0.55, g.y - 6 * z);
            R.ctx.lineTo(g.x + rx * 0.2, g.y);
            R.ctx.stroke();
            prism(g.x + rx * 0.62, g.y, 5.5, 8 * z, '#5a7d96');
        } else if (sp.site === 'mine') {
            // Rocky mound (tinted by the ore) with a dark adit + timber frame.
            const rockR = mix('#8a94a2', base, 0.4), rockL = shade(mix('#8a94a2', base, 0.4), -0.35);
            const apex = { x: g.x - rx * 0.1, y: g.y - h };
            R.ctx.beginPath();
            R.ctx.moveTo(apex.x, apex.y);
            R.ctx.lineTo(g.x + rx * 0.9, g.y);
            R.ctx.lineTo(g.x - rx * 0.15, g.y + ry * 0.28);
            R.ctx.closePath();
            R.ctx.fillStyle = rockR; R.ctx.fill();
            R.ctx.beginPath();
            R.ctx.moveTo(apex.x, apex.y);
            R.ctx.lineTo(g.x - rx * 0.9, g.y);
            R.ctx.lineTo(g.x - rx * 0.15, g.y + ry * 0.28);
            R.ctx.closePath();
            R.ctx.fillStyle = rockL; R.ctx.fill();
            // adit (entrance) with a timber lintel
            R.ctx.beginPath();
            R.ctx.ellipse(g.x - rx * 0.12, g.y + ry * 0.1, rx * 0.24, ry * 0.5, 0, Math.PI, 0);
            R.ctx.closePath();
            R.ctx.fillStyle = '#0a0d13'; R.ctx.fill();
            R.ctx.strokeStyle = '#6a4a2c';
            R.ctx.lineWidth = Math.max(1.5, 2 * z);
            R.ctx.beginPath();
            R.ctx.moveTo(g.x - rx * 0.38, g.y + ry * 0.12);
            R.ctx.lineTo(g.x - rx * 0.38, g.y - ry * 0.42);
            R.ctx.lineTo(g.x + rx * 0.14, g.y - ry * 0.42);
            R.ctx.lineTo(g.x + rx * 0.14, g.y + ry * 0.12);
            R.ctx.stroke();
            // spoil pebbles by the entrance
            R.ctx.fillStyle = rgba(base, 0.8);
            for (const [px, py] of [[0.35, 0.55], [0.52, 0.38], [0.42, 0.72]]) {
                R.ctx.beginPath();
                R.ctx.ellipse(g.x + rx * px - rx * 0.5, g.y + ry * py, 2.2 * z, 1.5 * z, 0, 0, Math.PI * 2);
                R.ctx.fill();
            }
        } else if (sp.site === 'pasture') {
            // Fenced grass plot with a small red barn. Sheep removed.
            diamondPath(g.x, g.y, rx * 0.9, ry * 0.9);
            R.ctx.fillStyle = 'rgba(58, 96, 64, 0.4)';
            R.ctx.fill();
            R.ctx.strokeStyle = 'rgba(201, 176, 138, 0.85)';
            R.ctx.lineWidth = Math.max(1.2, 1.5 * z);
            R.ctx.setLineDash([4 * z, 3 * z]);
            R.ctx.stroke();
            R.ctx.setLineDash([]);
            prism(g.x, g.y - ry * 0.55, 6.5, 9 * z, '#b91c1c');
        } else if (sp.site === 'grove') {
            // Rubber-tree grove: round canopies (unlike the wild pines).
            for (const [tx, ty, s] of [[-0.35, 0.05, 1], [0.05, -0.3, 0.9], [0.32, 0.28, 1.05]]) {
                const cx = g.x + rx * tx, cy = g.y + ry * ty;
                R.ctx.strokeStyle = '#4a3323';
                R.ctx.lineWidth = Math.max(1.5, 2 * z);
                R.ctx.beginPath();
                R.ctx.moveTo(cx, cy);
                R.ctx.lineTo(cx, cy - 9 * z * s);
                R.ctx.stroke();
                const cnp = mix('#3f7a4a', base, 0.25);
                R.ctx.fillStyle = cnp;
                R.ctx.beginPath();
                R.ctx.arc(cx, cy - 12 * z * s, 5.5 * z * s, 0, Math.PI * 2);
                R.ctx.fill();
                R.ctx.fillStyle = mix(cnp, '#a9e7b8', 0.4);
                R.ctx.beginPath();
                R.ctx.arc(cx - 1.5 * z * s, cy - 13.5 * z * s, 2.4 * z * s, 0, Math.PI * 2);
                R.ctx.fill();
            }
        } else { // 'fab' — electronics: compact plant with a blinking antenna
            const info = prism(g.x, g.y, sp.fw, h, base, { stories: 2, door: true, windows: true, winSeed: n.id * 13 + 1 });
            const tc = info.topCenter;
            R.ctx.strokeStyle = '#9fb4c8';
            R.ctx.lineWidth = Math.max(1, 1.4 * z);
            R.ctx.beginPath();
            R.ctx.moveTo(tc.x + info.rx * 0.45, tc.y - info.ry * 0.2);
            R.ctx.lineTo(tc.x + info.rx * 0.45, tc.y - info.ry * 0.2 - 9 * z);
            R.ctx.stroke();
            const bl = 0.4 + 0.6 * Math.max(0, Math.sin(R.seaTime * 5));
            const ax = tc.x + info.rx * 0.45, ay = tc.y - info.ry * 0.2 - 10 * z;
            bloom(ax, ay, 9 * z, '#7de3ff', bl * (0.4 + 0.5 * R.nightLevel));
            R.ctx.globalAlpha = bl;
            R.ctx.fillStyle = '#7de3ff';
            R.ctx.beginPath();
            R.ctx.arc(ax, ay, 1.6 * z, 0, Math.PI * 2);
            R.ctx.fill();
            R.ctx.globalAlpha = 1;
            return info;
        }
        return { rx, ry, topCenter: { x: g.x, y: g.y - h } };
    }

    function drawJunction(n, sp, g) {
        const z = zoom();
        const { rx, ry } = footRadii(sp.fw);

        R.ctx.beginPath();
        R.ctx.ellipse(g.x, g.y, rx, ry, 0, 0, Math.PI * 2);
        R.ctx.fillStyle = sp.base;
        R.ctx.fill();
        R.ctx.strokeStyle = 'rgba(8, 12, 20, 0.55)';
        R.ctx.lineWidth = Math.max(1.5, 2 * z);
        R.ctx.stroke();

        R.ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
        R.ctx.lineWidth = Math.max(1, 1.2 * z);
        R.ctx.setLineDash([3 * z, 3 * z]);
        R.ctx.beginPath();
        R.ctx.ellipse(g.x, g.y, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
        R.ctx.stroke();
        R.ctx.setLineDash([]);

        R.ctx.beginPath();
        R.ctx.ellipse(g.x, g.y, rx * 0.42, ry * 0.42, 0, 0, Math.PI * 2);
        R.ctx.fillStyle = '#3a5a3f';
        R.ctx.fill();
        R.ctx.strokeStyle = 'rgba(6, 14, 10, 0.5)';
        R.ctx.lineWidth = 1;
        R.ctx.stroke();

        // a little shrub planted in the island
        R.ctx.fillStyle = '#2f6b3f';
        R.ctx.beginPath();
        R.ctx.arc(g.x, g.y - 2.5 * z, 3 * z, 0, Math.PI * 2);
        R.ctx.fill();
        R.ctx.fillStyle = mix('#2f6b3f', '#a9e7b8', 0.35);
        R.ctx.beginPath();
        R.ctx.arc(g.x - z, g.y - 3.5 * z, 1.4 * z, 0, Math.PI * 2);
        R.ctx.fill();

        return { rx, ry, topCenter: { x: g.x, y: g.y - 6 * z } };
    }

    function groundRing(gx, gy, fw, color, width, scale) {
        const { rx, ry } = footRadii(fw);
        diamondPath(gx, gy, rx * (scale || 1), ry * (scale || 1));
        R.ctx.strokeStyle = color;
        R.ctx.lineWidth = width;
        R.ctx.stroke();
    }

    function drawNodeBody(n, now) {
        const sp = nodeSpec(n);
        const g = S(n.x, n.y);
        const iconSize = 16 * clampZoom();
        const forSale = n.kind === 'factory' && n.forSale;

        // Plot pad: a subtle paved apron the building sits on, so sites
        // read as intentional lots rather than blocks dropped on grass.
        // Feathered (radial fade to transparent) rather than a flat fill,
        // so its own edge doesn't add a second hard boundary on top of
        // whatever depth-sort seam a nearby truck might already be riding.
        const pad = footRadii(sp.fw + 9);
        R.ctx.save();
        diamondPath(g.x, g.y, pad.rx, pad.ry);
        R.ctx.clip();
        const padFade = R.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, Math.max(pad.rx, pad.ry));
        padFade.addColorStop(0, 'rgba(10, 16, 26, 0.32)');
        padFade.addColorStop(0.75, 'rgba(10, 16, 26, 0.18)');
        padFade.addColorStop(1, 'rgba(10, 16, 26, 0)');
        R.ctx.fillStyle = padFade;
        R.ctx.fillRect(g.x - pad.rx, g.y - pad.ry, pad.rx * 2, pad.ry * 2);
        R.ctx.restore();
        R.ctx.strokeStyle = rgba(sp.base, 0.2);
        R.ctx.lineWidth = 1;
        diamondPath(g.x, g.y, pad.rx, pad.ry);
        R.ctx.stroke();

        // Warm light-spill: lit buildings cast a soft pool of window-glow on
        // the ground around them (cached sprite, cheap additive-ish blit).
        const litKind = (n.kind === 'city') || (n.kind === 'factory' && !forSale) ||
                        (n.kind === 'supplier' && sp.site === 'fab');
        if (litKind && R.nightLevel > 0.08) {
            const gr = footRadii(sp.fw + 20);
            R.ctx.globalAlpha = 0.5 * R.nightLevel;
            R.ctx.drawImage(warmGlowSprite(), g.x - gr.rx, g.y - gr.ry, gr.rx * 2, gr.ry * 2);
            R.ctx.globalAlpha = 1;
        }

        // selection / focus pads on the ground (drawn under the building)
        if (n === SC.state.selectedNode) {
            groundRing(g.x, g.y, sp.fw + 6, 'rgba(56, 189, 248, 0.9)', 2.5);
        } else if (n === R.frameHoverNode) {
            // PC affordance: the building a click would hit right now
            groundRing(g.x, g.y, sp.fw + 6, 'rgba(226, 232, 240, 0.5)', 1.5);
        }
        if (n.unlockAt && now - n.unlockAt < 3) {
            const t = (now - n.unlockAt) / 3;
            groundRing(g.x, g.y, sp.fw, `rgba(56, 189, 248, ${0.7 * (1 - t)})`, 3, 1 + t * 2.2);
        }

        const info = n.kind === 'supplier' ? drawSupplierSite(n, sp, g) // themed scene: farm/lake/mine/…
            : n.kind === 'junction' ? drawJunction(n, sp, g) // roundabout, not a building
            : n.kind === 'yard' ? drawYardSite(n, sp, g) // asphalt lot with parked trucks
            : prism(g.x, g.y, sp.fw, sp.h * zoom(), sp.base, {
                  ghost: forSale, dashed: forSale, roof: forSale ? null : sp.roof,
                  alpha: forSale ? 0.9 : 1,
                  stories: forSale ? 0 : sp.stories, door: !forSale && sp.door,
                  windows: !forSale, winSeed: n.id * 13 + 1
              });
        const tc = info.topCenter;

        // Factory smokestack (back corner of the roof) + a puff of smoke while
        // it's actually crafting — a live "the plant is working" cue.
        if (n.kind === 'factory' && !forSale && sp.stack) {
            const z = zoom();
            const stx = tc.x - info.rx * 0.5, sty = tc.y - info.ry * 0.5;
            const sw = Math.max(2, 3 * z), sh = Math.max(6, 11 * z);
            R.ctx.fillStyle = shade(sp.base, -0.35);
            R.ctx.fillRect(stx - sw, sty - sh, sw * 2, sh);
            R.ctx.fillStyle = shade(sp.base, 0.05);
            R.ctx.fillRect(stx - sw, sty - sh, sw, sh);
            R.ctx.fillStyle = '#3a2f2a';
            R.ctx.fillRect(stx - sw, sty - sh - 2, sw * 2, 2);
            if (n.crafting) {
                for (let i = 0; i < 3; i++) {
                    const ph = (R.seaTime * 0.6 + i / 3) % 1;
                    const py = sty - sh - ph * 26 * z;
                    R.ctx.globalAlpha = 0.25 * (1 - ph);
                    R.ctx.fillStyle = '#cbd5e1';
                    R.ctx.beginPath();
                    R.ctx.arc(stx + Math.sin(ph * 6 + i) * 3 * z, py, (2 + ph * 5) * z, 0, Math.PI * 2);
                    R.ctx.fill();
                }
                R.ctx.globalAlpha = 1;
            }
        }

        // Crafting progress: a slim ring hugging the roof icon (with a faint
        // full-circle track), small enough not to clip the smokestack.
        if (n.kind === 'factory' && !forSale && n.crafting) {
            const frac = Math.min(1, n.crafting.t / SC.craftTime());
            const rr = iconSize * 0.85;
            const cy = tc.y - 4 * clampZoom(); // Center it with the emoji plate
            R.ctx.beginPath();
            R.ctx.arc(tc.x, cy, rr, 0, Math.PI * 2);
            R.ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
            R.ctx.lineWidth = 2.5;
            R.ctx.stroke();
            R.ctx.beginPath();
            R.ctx.arc(tc.x, cy, rr, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            R.ctx.strokeStyle = SC.colorOf(n.crafting.task.product);
            R.ctx.lineCap = 'round';
            R.ctx.stroke();
            R.ctx.lineCap = 'butt';
        }

        // Icon on the roof — suppliers and factories get a compact plate badge 
        // floating over the scene. HQ and DC have no icon. A junction skips this entirely.
        R.ctx.globalAlpha = forSale ? 0.6 : 1;
        if (n.kind === 'junction' || !sp.icon) {
            // no icon
        } else if (n.kind === 'supplier' || n.kind === 'factory') {
            emojiPlateAt(sp.icon, tc.x, tc.y - 4 * clampZoom(), 9 * clampZoom(), 13 * clampZoom());
        } else {
            emoji(sp.icon, tc.x, tc.y - iconSize * 0.15, iconSize);
        }
        R.ctx.globalAlpha = 1;

        // Production status pill. First group is the finished good:
        // "in stock / ordered" — how many units are crafted and sitting at
        // the factory waiting for a truck, over how many are still outstanding
        // (waiting + queued + currently crafting). If actively producing, a
        // second group shows each ingredient's stock (have / need) — "have"
        // being what's physically on-site, not counting units still in transit.
        if (n.kind === 'factory' && !forSale) {
            // Finished goods waiting at the factory: crafted output becomes a
            // pickup job here and stays on site until a truck actually loads
            // it — a truck merely en route to collect still has an empty cargo,
            // so its unit is physically still at the factory.
            let inStock = 0;
            if (SC.state.jobs) {
                for (const job of SC.state.jobs) if (job.pickup === n) inStock++;
            }
            if (SC.state.trucks) {
                for (const t of SC.state.trucks) {
                    if (t.jobs && (!t.cargo || t.cargo.length === 0)) {
                        for (const job of t.jobs) if (job.pickup === n) inStock++;
                    }
                }
            }
            const producing = (n.queue ? n.queue.length : 0) + (n.crafting ? 1 : 0);
            const ordered = inStock + producing;

            // Ingredient stock (have / need), only while there's a live queue.
            let queueNeeds = {}, queueHave = {};
            if (n.queue && n.queue.length > 0) {
                for (const t of n.queue) {
                    for (const m in t.needs) {
                        queueNeeds[m] = (queueNeeds[m] || 0) + t.needs[m];
                        queueHave[m] = (queueHave[m] || 0) + (t.have[m] || 0);
                    }
                }
                for (const m in n.inv) {
                    if (queueNeeds[m]) queueHave[m] = (queueHave[m] || 0) + n.inv[m];
                }
                // NOTE: material still en route (unassigned jobs or riding a
                // truck) is deliberately NOT counted here. "have / need" means
                // stock physically on-site — a unit only counts once a truck
                // has actually dropped it (task.have via receiveRaw, or loose
                // n.inv). Counting in-transit units made the pill read 1/1
                // (full, green) before anything had been delivered.
            }
            const needsKeys = Object.keys(queueNeeds);

            if ((ordered > 0 || inStock > 0) && pillsVisible()) {
                const z = clampZoom();
                const sy = tc.y - 28 * z;
                const interFont = `600 ${9 * z}px Inter, system-ui, sans-serif`;
                R.ctx.font = interFont;

                const fgText = `${inStock} / ${ordered}`;
                const fgW = R.ctx.measureText(fgText).width;

                let segments = [];
                // first group: pad + FG emoji + gap + "in stock / ordered" + pad
                let totalW = 5 * z + 11 * z + 3 * z + fgW + 5 * z;
                if (needsKeys.length > 0) totalW += 8 * z; // divider
                for (const m of needsKeys) {
                    const have = Math.min(queueHave[m], queueNeeds[m]);
                    const need = queueNeeds[m];
                    const text = `${have}/${need}`;
                    const w = 14 * z + R.ctx.measureText(text).width;
                    segments.push({ m, text, w, have, need });
                    totalW += w;
                }

                let cx = tc.x - totalW / 2;
                R.ctx.fillStyle = 'rgba(12, 18, 30, 0.85)';
                roundRectPath(cx, sy - 8 * z, totalW, 16 * z, 6 * z);
                R.ctx.fill();

                cx += 5 * z;
                emoji(SC.emojiOf(n.recipe), cx + 5.5 * z, sy, 11 * z);
                cx += 11 * z + 3 * z;
                R.ctx.font = interFont;
                R.ctx.textAlign = 'left';
                R.ctx.textBaseline = 'middle';
                // Amber when goods are ready & waiting; muted when just queued.
                R.ctx.fillStyle = inStock > 0 ? '#fbbf24' : '#cbd5e1';
                R.ctx.fillText(fgText, cx, sy);
                cx += fgW + 5 * z;

                if (needsKeys.length > 0) {
                    R.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    R.ctx.fillRect(cx, sy - 5 * z, 1, 10 * z);
                    cx += 4 * z;
                    for (const seg of segments) {
                        cx += 4 * z;
                        emoji(SC.emojiOf(seg.m), cx, sy, 9 * z);
                        cx += 5 * z;
                        R.ctx.font = interFont;
                        R.ctx.textAlign = 'left';
                        R.ctx.fillStyle = seg.have >= seg.need ? '#34d399' : '#f87171';
                        R.ctx.fillText(seg.text, cx, sy);
                        cx += R.ctx.measureText(seg.text).width + 5 * z;
                    }
                }
            }
        }

        // HQ landmark beacon: a short mast with a slow-blinking red light and
        // halo on top, so HQ reads as the tallest, most important structure.
        if (n.isHQ && !SC.state.orders.some(o => o.city === n)) {
            const z = clampZoom();
            const bx = tc.x, by = tc.y - iconSize - 6 * z;
            R.ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
            R.ctx.lineWidth = Math.max(1, 1.4 * z);
            R.ctx.beginPath();
            R.ctx.moveTo(bx, tc.y - iconSize * 0.2);
            R.ctx.lineTo(bx, by);
            R.ctx.stroke();
            const blink = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(R.seaTime * 3.2), 3);
            bloom(bx, by, 16 * z, '#f87171', blink * (0.35 + 0.4 * R.nightLevel));
            R.ctx.globalAlpha = blink * 0.5;
            R.ctx.fillStyle = '#f87171';
            R.ctx.beginPath(); R.ctx.arc(bx, by, 6 * z, 0, Math.PI * 2); R.ctx.fill();
            R.ctx.globalAlpha = blink;
            R.ctx.fillStyle = '#fca5a5';
            R.ctx.beginPath(); R.ctx.arc(bx, by, 2.2 * z, 0, Math.PI * 2); R.ctx.fill();
            R.ctx.globalAlpha = 1;
        }

        // Emissive bloom: lit buildings radiate a soft warm halo at night.
        if (litKind && R.nightLevel > 0.12) {
            const fr = footRadii(sp.fw);
            bloom(tc.x, tc.y + fr.ry * 0.5, fr.rx * 1.5, '#ffcf8a', 0.2 * R.nightLevel);
        }

        // --- per-kind badges/bars -------------------------------------------
        if (n.kind === 'supplier') {
            const cap = SC.supplierCap(n);
            const frac = Math.max(0, Math.min(1, (n.stock || 0) / cap));
            const bw = 34, bx = tc.x - bw / 2, by = tc.y - iconSize - 9;
            // dark backing plate so the bar doesn't float as a bare dash
            R.ctx.fillStyle = 'rgba(12, 18, 30, 0.75)';
            roundRectPath(bx - 3, by - 3, bw + 6, 10, 5); R.ctx.fill();
            R.ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
            roundRectPath(bx, by, bw, 4, 2); R.ctx.fill();
            R.ctx.fillStyle = frac < 0.25 ? '#f87171' : sp.base;
            roundRectPath(bx, by, bw * frac, 4, 2); R.ctx.fill();
            if (n.level > 0) labelAt('▲'.repeat(n.level), tc.x, by - 13, '#facc15', 10);
        } else if (n.kind === 'factory' && forSale) {
            labelAt(`$${SC.CONFIG.FACTORY_SITE_PRICE}`, tc.x, tc.y - iconSize - 6, '#94a3b8', 11);
        } else if (n.kind === 'yard') {
            labelAt('Yard', g.x, g.y + footRadii(sp.fw).ry + 12, '#c4b5fd', 11);
        } else if (n.kind === 'city') {
            // Idle trucks homed here park physically on an apron in front of
            // the building (drawn on top so they sit before the doors).
            drawYardParking(n, g, zoom(), false);
            labelAt(n.isHQ ? 'HQ' : 'DC', g.x, g.y + footRadii(sp.fw).ry + 12, n.isHQ ? '#38bdf8' : '#34d399', 11);
        }
    }

    function drawYardParking(node, g, z, full) {
        // Size the lot off the whole fleet homed here, not just who's currently
        // parked, so it doesn't blink away every time a truck heads out on a
        // job and keeps growing as the roster does.
        const homed = SC.state.trucks.filter(t => t.homeYard === node);
        if (!full && homed.length === 0) return; // no apron until this building has ever hosted a truck
        const parked = homed.filter(t => !t.path && t.jobs.length === 0);
        // iso ground basis in screen space (already includes zoom)
        const o = S(node.x, node.y);
        const ux = S(node.x + 1, node.y).x - o.x, uy = S(node.x + 1, node.y).y - o.y;
        const vx = S(node.x, node.y + 1).x - o.x, vy = S(node.x, node.y + 1).y - o.y;
        const ul = Math.hypot(ux, uy) || 1, vl = Math.hypot(vx, vy) || 1;
        const uhx = ux / ul, uhy = uy / ul, vhx = vx / vl, vhy = vy / vl;

        const cols = 2;
        const colGap = 11 * z, rowGap = 25 * z; // screen spacing between stalls
        const fleet = Math.min(homed.length, 6); // cap the lot size (stalls), not just the sprite count
        const rows = Math.max(full ? 2 : 1, Math.ceil(fleet / cols));

        // Apron centered on the grid. For a building we push the lot forward
        // (toward the camera, +v) so it sits in front of the doors, not under
        // the walls.
        const cx = g.x + (full ? 0 : (vhx * rowGap * 1.4));
        const cy = g.y + (full ? 0 : (vhy * rowGap * 1.4));
        // grid extents (in stall units, centered)
        const halfC = (cols - 1) / 2, halfR = (rows - 1) / 2;
        const stall = (c, r) => ({
            x: cx + uhx * (c - halfC) * colGap + vhx * (r - halfR) * rowGap,
            y: cy + uhy * (c - halfC) * colGap + vhy * (r - halfR) * rowGap
        });

        // asphalt pad: a filled iso quad covering the grid + margin
        const mC = colGap * 0.9, mR = rowGap * 0.75;
        const corners = [
            [-halfC * colGap - mC, -halfR * rowGap - mR],
            [ halfC * colGap + mC, -halfR * rowGap - mR],
            [ halfC * colGap + mC,  halfR * rowGap + mR],
            [-halfC * colGap - mC,  halfR * rowGap + mR]
        ].map(([a, b]) => ({ x: cx + uhx * a + vhx * b, y: cy + uhy * a + vhy * b }));
        R.ctx.beginPath();
        corners.forEach((p, i) => i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y));
        R.ctx.closePath();
        R.ctx.fillStyle = 'rgba(38, 42, 52, 0.92)';
        R.ctx.fill();
        R.ctx.strokeStyle = 'rgba(15, 18, 24, 0.9)';
        R.ctx.lineWidth = 1.5;
        R.ctx.stroke();

        // painted stall dividers (between columns, running along rows)
        R.ctx.strokeStyle = 'rgba(233, 213, 120, 0.55)';
        R.ctx.lineWidth = Math.max(1, 1.4 * z);
        for (let c = 0; c <= cols; c++) {
            const a = (c - halfC - 0.5) * colGap;
            const p1 = { x: cx + uhx * a + vhx * (-halfR * rowGap - mR * 0.5), y: cy + uhy * a + vhy * (-halfR * rowGap - mR * 0.5) };
            const p2 = { x: cx + uhx * a + vhx * ( halfR * rowGap + mR * 0.5), y: cy + uhy * a + vhy * ( halfR * rowGap + mR * 0.5) };
            R.ctx.beginPath(); R.ctx.moveTo(p1.x, p1.y); R.ctx.lineTo(p2.x, p2.y); R.ctx.stroke();
        }

        // Park nose-in along the bay depth (+v) so each truck's length runs
        // down its stall between the painted dividers. Fill the front row
        // (nearest the camera) first.
        const parkAng = Math.atan2(vhy, vhx);
        const shown = Math.min(parked.length, fleet); // trucks out on a job just leave their stall empty
        for (let i = 0; i < shown; i++) {
            const c = i % cols, r = rows - 1 - ((i / cols) | 0);
            const s = stall(c, r);
            R.drawTruckAt(s, parkAng, '#8b98ab', z * 0.82, false);
        }
    }

    function drawYardSite(n, sp, g) {
        const z = zoom();
        drawYardParking(n, g, z, true);
        const fr = footRadii(sp.fw);
        return { topCenter: { x: g.x, y: g.y - 6 * z }, rx: fr.rx, ry: fr.ry };
    }

    function emojiPlateAt(ch, sx, sy, r, size) {
        R.ctx.beginPath();
        R.ctx.arc(sx, sy, r, 0, Math.PI * 2);
        R.ctx.fillStyle = '#1e293b';
        R.ctx.fill();
        R.ctx.lineWidth = 1;
        R.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        R.ctx.stroke();
        emoji(ch, sx, sy, size);
    }

    function drawOrderBubbles() {
        const byCity = new Map();
        for (const o of SC.state.orders) {
            if (!byCity.has(o.city)) byCity.set(o.city, []);
            byCity.get(o.city).push(o);
        }
        const z = clampZoom();
        for (const [city, orders] of byCity) {
            const sp = nodeSpec(city);
            // Roof apex of the building: prism() is drawn at height sp.h*zoom(),
            // so the roof sits exactly that many screen pixels above the ground
            // point. Hug the bubble just above it (bounded by clampZoom) so it
            // reads as attached rather than floating on a long stalk — the old
            // code let a high zoom fling the bubble far above the (zoom-capped)
            // HQ beacon, and the beacon mast filled the gap as an ugly stem.
            const roof = { x: S(city.x, city.y).x, y: S(city.x, city.y).y - sp.h * zoom() };
            const r = 14 * z;
            orders.forEach((o, i) => {
                const bx = roof.x + (i - (orders.length - 1) / 2) * 34 * z;
                const by = roof.y - 26 * z;
                const frac = Math.max(0, o.deadline / o.deadlineTotal);
                const urgent = frac < 0.25;

                // speech-bubble tail: a short triangle from the bubble bottom
                // down to the roof apex, so the marker points at its building.
                R.ctx.beginPath();
                R.ctx.moveTo(bx - 5 * z, by + r - 2 * z);
                R.ctx.lineTo(bx + 5 * z, by + r - 2 * z);
                R.ctx.lineTo(bx, by + r + 9 * z);
                R.ctx.closePath();
                R.ctx.fillStyle = '#1e293b';
                R.ctx.fill();
                R.ctx.strokeStyle = urgent ? '#f87171' : 'rgba(148, 163, 184, 0.55)';
                R.ctx.lineWidth = 1;
                R.ctx.stroke();

                R.ctx.beginPath();
                R.ctx.arc(bx, by, r, 0, Math.PI * 2);
                R.ctx.fillStyle = '#1e293b';
                R.ctx.fill();
                R.ctx.strokeStyle = urgent ? '#f87171' : 'rgba(148, 163, 184, 0.55)';
                R.ctx.lineWidth = 1.5;
                R.ctx.stroke();

                R.ctx.beginPath();
                R.ctx.arc(bx, by, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
                R.ctx.strokeStyle = urgent ? '#f87171' : SC.colorOf(o.product);
                R.ctx.lineWidth = 3;
                R.ctx.lineCap = 'round';
                R.ctx.stroke();
                R.ctx.lineCap = 'butt';

                emoji(SC.emojiOf(o.product), bx, by, 17 * z);
                const left = o.qty - o.deliveredUnits;
                if (left > 1) labelAt(String(left), bx + r + 2, by - r + 2, '#f8fafc', 10);
                if (o.noRoute) labelAt('no route!', bx, by - r - 10, '#f87171', 10);
            });
        }
    }

    function drawGlowPaths(paths, color, alpha) {
        R.ctx.lineCap = 'round';
        for (const path of paths) {
            const legColor = path.good ? SC.colorOf(path.good) : color;
            R.ctx.beginPath();
            path.forEach((n, i) => {
                const p = S(n.x, n.y);
                i ? R.ctx.lineTo(p.x, p.y) : R.ctx.moveTo(p.x, p.y);
            });
            R.ctx.strokeStyle = legColor;
            R.ctx.globalAlpha = alpha;
            R.ctx.lineWidth = Math.max(5, 8 * zoom());
            R.ctx.shadowBlur = 12;
            R.ctx.shadowColor = legColor;
            R.ctx.stroke();
        }
        R.ctx.globalAlpha = 1;
        R.ctx.shadowBlur = 0;
        R.ctx.lineCap = 'butt';
    }

    function drawHighlight(now) {
        const h = SC.state.highlight;
        if (!h || now > h.until) return;
        const fade = Math.min(1, (h.until - now) / 0.5);
        drawGlowPaths(h.paths, h.color, 0.55 * fade);
        const c = S(h.city.x, h.city.y);
        const pulse = (22 + Math.sin(now * 6) * 4) * clampZoom();
        R.ctx.beginPath();
        R.ctx.ellipse(c.x, c.y, pulse, pulse * 0.55, 0, 0, Math.PI * 2);
        R.ctx.strokeStyle = h.color;
        R.ctx.globalAlpha = 0.8 * fade;
        R.ctx.lineWidth = 2.5;
        R.ctx.stroke();
        R.ctx.globalAlpha = 1;
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
        R.ctx.beginPath();
        R.ctx.moveTo(a.x, a.y);
        R.ctx.lineTo(b.x, b.y);
        R.ctx.strokeStyle = affordable ? 'rgba(52, 211, 153, 0.7)' : 'rgba(248, 113, 113, 0.7)';
        R.ctx.lineWidth = Math.max(3, 4 * zoom());
        R.ctx.lineCap = 'round';
        R.ctx.setLineDash([10, 8]);
        R.ctx.stroke();
        R.ctx.setLineDash([]);
        R.ctx.lineCap = 'butt';

        const mx = (sel.x + end.x) / 2, my = (sel.y + end.y) / 2;
        const crossingLabel = q.ferry ? ' (ferry)' : q.bridge ? ' (bridge)' : '';
        const mp = S(mx, my);
        labelAt(`$${q.cost}${crossingLabel}`, mp.x, mp.y - 14, affordable ? '#34d399' : '#f87171');
    }

    function drawPlacementGhost() {
        const pm = SC.state.placeMode;
        const hover = SC.input.getHover && SC.input.getHover();
        if (!pm || !hover) return;

        let valid = SC.canAfford(SC.placement.price(pm.kind));
        let x = hover.x, y = hover.y;
        if (pm.kind === 'intersection') {
            const crossing = SC.placement.canPlaceIntersectionAt(x, y);
            if (crossing) {
                x = crossing.x;
                y = crossing.y;
            } else {
                valid = false;
            }
        } else {
            valid = valid && SC.placement.canPlaceAt(x, y);
        }

        const cost = SC.placement.price(pm.kind);
        const base = valid ? '#34d399' : '#f87171';
        const g = S(x, y);
        const fw = 24;
        // footprint ghost pad
        const { rx, ry } = footRadii(fw);
        diamondPath(g.x, g.y, rx, ry);
        R.ctx.strokeStyle = rgba(base, 0.9);
        R.ctx.lineWidth = 2;
        R.ctx.setLineDash([6, 5]);
        R.ctx.stroke();
        R.ctx.setLineDash([]);
        let tc;
        if (pm.kind === 'junction' || pm.kind === 'intersection') {
            // Roundabout footprint, not a building — an outlined ring
            // instead of the usual prism-ghost.
            R.ctx.beginPath();
            R.ctx.ellipse(g.x, g.y, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
            R.ctx.strokeStyle = rgba(base, 0.9);
            R.ctx.lineWidth = 2;
            R.ctx.setLineDash([5, 4]);
            R.ctx.stroke();
            R.ctx.setLineDash([]);
            tc = { x: g.x, y: g.y - 10 * zoom() };
            if (pm.kind === 'intersection') {
                R.ctx.globalAlpha = 0.85;
                emoji('➕', g.x, g.y - 4 * zoom(), 14 * clampZoom());
                R.ctx.globalAlpha = 1;
            }
        } else {
            const ghostH = pm.kind === 'yard' ? 14 : 30;
            prism(g.x, g.y, fw, ghostH * zoom(), base,
                  { ghost: true, dashed: true, outline: rgba(base, 0.9) });
            tc = { x: g.x, y: g.y - ghostH * zoom() };
            R.ctx.globalAlpha = 0.85;
            emoji(pm.kind === 'yard' ? '🅿️' : SC.emojiOf(pm.good), tc.x, tc.y, 18 * clampZoom());
            R.ctx.globalAlpha = 1;
        }
        labelAt(`$${cost}${valid ? '' : ' — blocked'}`, tc.x, tc.y - 20, valid ? '#34d399' : '#f87171', 11);
    }

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

        R.ctx.save();
        R.ctx.translate(ex, ey);
        R.ctx.rotate(angle);
        R.ctx.beginPath();
        R.ctx.moveTo(14, 0);
        R.ctx.lineTo(-8, -8);
        R.ctx.lineTo(-8, 8);
        R.ctx.closePath();
        R.ctx.globalAlpha = alpha;
        R.ctx.fillStyle = color;
        R.ctx.fill();
        R.ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        R.ctx.lineWidth = 1.5;
        R.ctx.stroke();
        R.ctx.restore();

        R.ctx.globalAlpha = alpha;
        R.ctx.font = '15px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        R.ctx.textAlign = 'center';
        R.ctx.textBaseline = 'middle';
        R.ctx.fillText(icon, ex - Math.cos(angle) * 20, ey - Math.sin(angle) * 20);
        R.ctx.globalAlpha = 1;
    }

    function drawOffscreenArrows(now) {
        const pulse = 0.55 + 0.45 * Math.sin(R.seaTime * 4);
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

    Object.assign(R, { drawRoads, drawRouteFlow, nodeSpec, drawShadow, drawSupplierSite, drawJunction,
        drawNodeBody, drawYardParking, drawYardSite, emojiPlateAt, drawOrderBubbles,
        drawHighlight, drawInspectHighlight, drawGhostRoad, drawPlacementGhost, drawOffscreenArrows });
})();
