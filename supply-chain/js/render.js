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
        dpr = window.devicePixelRatio || 1;
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

    // --- ground & water -----------------------------------------------------
    function drawWorld(dt) {
        const C = SC.CONFIG;
        seaTime += dt;

        // Land: the whole world projected to a big diamond, with a soft
        // vertical gradient so the far edge reads as "further away".
        const corners = [S(0, 0), S(C.WORLD_W, 0), S(C.WORLD_W, C.WORLD_H), S(0, C.WORLD_H)];
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        const ys = corners.map(p => p.y);
        const grad = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
        grad.addColorStop(0, '#25324a');
        grad.addColorStop(1, '#18212f');
        ctx.fillStyle = grad;
        ctx.fill();

        // Iso grid: faint lines of constant world-x and world-y, clipped to
        // the land, to give the ground a sense of scale and perspective.
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
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

        // Coastline
        ctx.beginPath();
        corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();

        drawRiver();
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
    function strokeEdge(e, width, color, dash) {
        const a = S(e.a.x, e.a.y), b = S(e.b.x, e.b.y);
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

    function drawRoads() {
        const z = zoom();
        const pending = SC.input.getPendingDemolish && SC.input.getPendingDemolish();
        const pendingUp = SC.input.getPendingUpgrade && SC.input.getPendingUpgrade();
        for (const e of SC.state.edges) {
            const armed = e === pending || e === pendingUp;
            const casing = Math.max(5, (e.level > 0 ? 9 : 7) * z);
            const surfaceW = Math.max(2.5, (e.level > 0 ? 6 : 4) * z);

            if (e.ferry) {
                strokeEdge(e, surfaceW, 'rgba(45, 212, 191, 0.6)', [4 * z + 2, 10 * z]);
            } else {
                // Dark casing under a lighter driving surface — reads as a
                // raised road bed sitting on the ground.
                strokeEdge(e, casing, 'rgba(8, 12, 20, 0.55)', e.bridge ? [16 * z, 9 * z] : null);
                const surf = e.bridge ? 'rgba(150, 180, 214, 0.8)'
                                      : e.level > 0 ? 'rgba(226, 232, 240, 0.85)'
                                      : 'rgba(140, 152, 170, 0.75)';
                strokeEdge(e, surfaceW, surf, e.bridge ? [16 * z, 9 * z] : null);
                if (e.level > 0) strokeEdge(e, Math.max(1, 1.6 * z), 'rgba(250, 204, 21, 0.6)', [11 * z, 11 * z]);
            }

            if (armed) {
                strokeEdge(e, casing + 2, e === pending ? 'rgba(248, 113, 113, 0.9)' : 'rgba(250, 204, 21, 0.9)');
            }

            // Ferry boat shuttling across
            if (e.ferry && !armed) {
                const t = (Math.sin(seaTime * 0.6) + 1) / 2;
                const p = S(e.a.x + (e.b.x - e.a.x) * t, e.a.y + (e.b.y - e.a.y) * t);
                emoji('⛴', p.x, p.y, 18 * clampZoom());
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
    function nodeSpec(n) {
        if (n.kind === 'supplier') {
            const base = SC.colorOf(n.mat);
            return { base, fw: 24, h: 26 + (n.level || 0) * 4, icon: SC.emojiOf(n.mat) };
        }
        if (n.kind === 'factory') {
            return { base: '#6b7a90', fw: 27, h: 40, icon: SC.emojiOf(n.recipe), roof: SC.colorOf(n.recipe) };
        }
        if (n.kind === 'yard') {
            return { base: '#8b5cf6', fw: 24, h: 14, icon: '🅿️', flat: true };
        }
        // city
        if (n.isHQ) return { base: '#0ea5e9', fw: 26, h: 54, icon: '⭐' };
        return { base: '#10b981', fw: 24, h: 40, icon: '🏢' };
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

        ctx.globalAlpha = 1;
        return { rx, ry, topCenter: { x: gx, y: gy - hpx } };
    }

    function drawShadow(gx, gy, fw) {
        const { rx, ry } = footRadii(fw);
        ctx.save();
        ctx.globalAlpha = 0.32;
        diamondPath(gx + rx * 0.28, gy + ry * 0.5, rx * 1.05, ry * 1.05);
        ctx.fillStyle = '#05070c';
        ctx.filter = 'blur(3px)';
        ctx.fill();
        ctx.restore();
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
        const iconSize = 18 * clampZoom();
        const forSale = n.kind === 'factory' && n.forSale;

        // selection / focus pads on the ground (drawn under the building)
        if (n === SC.state.selectedNode) {
            groundRing(g.x, g.y, sp.fw + 6, 'rgba(56, 189, 248, 0.9)', 2.5);
        }
        if (n.unlockAt && now - n.unlockAt < 3) {
            const t = (now - n.unlockAt) / 3;
            groundRing(g.x, g.y, sp.fw, `rgba(56, 189, 248, ${0.7 * (1 - t)})`, 3, 1 + t * 2.2);
        }

        const info = prism(g.x, g.y, sp.fw, sp.h * zoom(), sp.base, {
            ghost: forSale, dashed: forSale, roof: forSale ? null : sp.roof,
            alpha: forSale ? 0.9 : 1
        });
        const tc = info.topCenter;

        // Crafting progress ring floating over a working factory's roof
        if (n.kind === 'factory' && !forSale && n.crafting) {
            const frac = Math.min(1, n.crafting.t / SC.craftTime());
            ctx.beginPath();
            ctx.arc(tc.x, tc.y, info.rx * 0.9, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            ctx.strokeStyle = SC.colorOf(n.crafting.task.product);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.lineCap = 'butt';
        }

        // Icon on the roof
        ctx.globalAlpha = forSale ? 0.6 : 1;
        emoji(sp.icon, tc.x, tc.y - iconSize * 0.15, iconSize);
        ctx.globalAlpha = 1;

        // --- per-kind badges/bars -------------------------------------------
        if (n.kind === 'supplier') {
            const cap = SC.supplierCap(n);
            const frac = Math.max(0, Math.min(1, (n.stock || 0) / cap));
            const bw = 34, bx = tc.x - bw / 2, by = tc.y - iconSize - 8;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            roundRectPath(bx, by, bw, 4, 2); ctx.fill();
            ctx.fillStyle = frac < 0.25 ? '#f87171' : sp.base;
            roundRectPath(bx, by, bw * frac, 4, 2); ctx.fill();
            if (n.level > 0) labelAt('▲'.repeat(n.level), tc.x, by - 9, '#facc15', 10);
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

    // Draw a squashed, heading-aligned rounded slab at height `dy` above the
    // truck's ground point — stacking several of these extrudes a little van.
    function truckSlab(g, ang, z, dy, w, h, fill) {
        ctx.save();
        ctx.translate(g.x, g.y - dy);
        ctx.rotate(ang);
        ctx.scale(1, 0.6); // lie down into the iso ground plane
        roundRectPath(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.35);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
    }

    function drawTruckBody(t) {
        const g = S(t.x, t.y);
        const z = clampZoom();
        const item = t.cargo[0];
        const body = item ? SC.colorOf(item) : '#9aa7b8';
        const ang = truckScreenAngle(t);
        const w = 22 * z, hh = 12 * z, height = 8 * z;

        // ground shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        diamondPath(g.x, g.y + 2 * z, 13 * z, 7 * z);
        ctx.fillStyle = '#05070c';
        ctx.fill();
        ctx.restore();

        // cheap vertical extrusion: dark at the base, lightest on the roof
        const steps = 5;
        for (let s = 0; s <= steps; s++) {
            const dy = height * s / steps;
            truckSlab(g, ang, z, dy, w, hh, shade(body, -0.32 + 0.52 * (s / steps)));
        }
        // outline the roof
        ctx.save();
        ctx.translate(g.x, g.y - height);
        ctx.rotate(ang);
        ctx.scale(1, 0.6);
        roundRectPath(-w / 2, -hh / 2, w, hh, Math.min(w, hh) * 0.35);
        ctx.strokeStyle = rgba(shade(body, 0.4), 0.6);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        if (item) {
            emojiPlateAt(SC.emojiOf(item), g.x, g.y - height - 8 * z, 9 * z, 13 * z);
            if (t.cargo.length > 1) labelAt('×' + t.cargo.length, g.x + 13 * z, g.y - height - 15 * z, '#f8fafc', 9);
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
    function drawGlowPaths(paths, color, alpha) {
        ctx.lineCap = 'round';
        for (const path of paths) {
            ctx.beginPath();
            path.forEach((n, i) => {
                const p = S(n.x, n.y);
                i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
            });
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.max(5, 8 * zoom());
            ctx.shadowBlur = 12;
            ctx.shadowColor = color;
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
        let target = null;
        for (const n of SC.state.nodes) {
            if (n.active && n !== sel && Math.hypot(n.x - hover.x, n.y - hover.y) < 40) target = n;
        }
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

        drawWorld(dt);
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

    return { attach, frame, resize };
})();
