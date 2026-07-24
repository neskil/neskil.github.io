// Canvas rendering — ACTORS layer: trucks, the "+$"/"−$" floaters, delivery
// bursts, and the loading/unloading crate transfers. Shares SC._render (R)
// with render-core; see render-core.js for the shared-context model.
(function() {
    const R = SC._render;
    const { S, zoom, mix, shade, rgba, hexToRgb, makeRng, footRadii, diamondPath,
            roundRectPath, clampZoom, label, labelAt, emoji, ISO } = R;

    let floaters = [];   // rising "+$x"/"−$x" texts, world-anchored
    let bursts = [];     // delivery coin/spark bursts
    const cargoLen = new Map();   // truck id -> last cargo length
    const cargoLast = new Map();  // truck id -> last non-empty item (for unload colour)

    function truckScreenAngle(t) {
        // world heading -> screen heading through the iso projection
        const dx = Math.cos(t.angle || 0), dy = Math.sin(t.angle || 0);
        return Math.atan2((dx + dy) * ISO.ky, (dx - dy) * ISO.kx);
    }

    function isoBoxSlab(g, ang, cx, dy, w, h, r, fill) {
        R.ctx.save();
        R.ctx.translate(g.x, g.y - dy);
        R.ctx.rotate(ang);
        R.ctx.scale(1, 0.6); // lie down into the iso ground plane
        roundRectPath(cx - w / 2, -h / 2, w, h, r);
        R.ctx.fillStyle = fill;
        R.ctx.fill();
        R.ctx.restore();
    }

    function drawTruckAt(g, ang, body, z, moving) {
        const L = 26 * z, W = 11 * z;         // footprint length / width
        const Ht = 9 * z, Hc = 6.5 * z;        // trailer / cab heights
        const trailerCx = -L * 0.16, trailerW = L * 0.68;
        const cabCx = L * 0.34, cabW = L * 0.32;
        const steps = 5;

        // ground shadow
        R.ctx.save();
        R.ctx.globalAlpha = 0.3;
        diamondPath(g.x, g.y + 2 * z, 15 * z, 8 * z);
        R.ctx.fillStyle = '#05070c';
        R.ctx.fill();
        R.ctx.restore();

        // wheels peeking out at the base
        R.ctx.save();
        R.ctx.translate(g.x, g.y); R.ctx.rotate(ang); R.ctx.scale(1, 0.6);
        R.ctx.fillStyle = '#12161d';
        for (const wx of [-L * 0.28, L * 0.2]) {
            for (const wy of [-W * 0.52, W * 0.52]) {
                R.ctx.beginPath(); R.ctx.ellipse(wx, wy, 3.2 * z, 2.4 * z, 0, 0, Math.PI * 2); R.ctx.fill();
            }
        }
        R.ctx.restore();

        // trailer (colored by cargo) and cab, each extruded dark→light
        for (let s = 0; s <= steps; s++) {
            isoBoxSlab(g, ang, trailerCx, Ht * s / steps, trailerW, W, 3 * z, shade(body, -0.34 + 0.5 * (s / steps)));
        }
        const cabBody = shade(body, -0.06);
        for (let s = 0; s <= steps; s++) {
            isoBoxSlab(g, ang, cabCx, Hc * s / steps, cabW, W * 0.9, 2.5 * z, shade(cabBody, -0.34 + 0.5 * (s / steps)));
        }
        // trailer roof outline
        R.ctx.save();
        R.ctx.translate(g.x, g.y - Ht); R.ctx.rotate(ang); R.ctx.scale(1, 0.6);
        roundRectPath(trailerCx - trailerW / 2, -W / 2, trailerW, W, 3 * z);
        R.ctx.strokeStyle = rgba(shade(body, 0.45), 0.55); R.ctx.lineWidth = 1; R.ctx.stroke();
        R.ctx.restore();
        // windshield glint on the cab front
        R.ctx.save();
        R.ctx.translate(g.x, g.y - Hc); R.ctx.rotate(ang); R.ctx.scale(1, 0.6);
        R.ctx.fillStyle = 'rgba(186, 214, 236, 0.55)';
        roundRectPath(cabCx + cabW * 0.06, -W * 0.32, cabW * 0.3, W * 0.64, 1.5 * z);
        R.ctx.fill();
        R.ctx.restore();

        // Headlights: only at dusk/night and only while moving. Just two soft
        // warm points with a small glow — no hard beam cone (that read as a
        // stray triangle in daylight); they fade in as the light drops.
        if (moving && R.nightLevel > 0.3) {
            R.ctx.save();
            R.ctx.translate(g.x, g.y - 2 * z); R.ctx.rotate(ang); R.ctx.scale(1, 0.6);
            const nose = cabCx + cabW / 2;
            for (const wy of [-W * 0.28, W * 0.28]) {
                const gr = R.ctx.createRadialGradient(nose, wy, 0, nose, wy, 7 * z);
                gr.addColorStop(0, `rgba(255, 240, 190, ${0.85 * R.nightLevel})`);
                gr.addColorStop(1, 'rgba(255, 236, 180, 0)');
                R.ctx.fillStyle = gr;
                R.ctx.beginPath(); R.ctx.arc(nose, wy, 7 * z, 0, Math.PI * 2); R.ctx.fill();
                R.ctx.fillStyle = `rgba(255, 245, 210, ${R.nightLevel})`;
                R.ctx.beginPath(); R.ctx.arc(nose, wy, 1.2 * z, 0, Math.PI * 2); R.ctx.fill();
            }
            R.ctx.restore();
        }
        return { Ht };
    }

    function drawTruckBody(t) {
        const g = S(t.x, t.y);
        // A truck is a physical object like a building or road, not a UI
        // overlay, so it scales with the real camera zoom (uncapped) rather
        // than clampZoom() — using the clamped value made trucks freeze at
        // a fixed size past 0.8-1.6x zoom while buildings kept scaling,
        // so the fleet visibly mismatched the world around it.
        const z = zoom();
        const item = t.cargo[0];
        const body = item ? SC.colorOf(item) : '#8b98ab';
        const ang = truckScreenAngle(t);
        const { Ht } = drawTruckAt(g, ang, body, z, !!t.path);
        if (item) {
            R.emojiPlateAt(SC.emojiOf(item), g.x, g.y - Ht - 8 * z, 9 * z, 13 * z);
            if (t.cargo.length > 1) labelAt('×' + t.cargo.length, g.x + 13 * z, g.y - Ht - 15 * z, '#f8fafc', 9);
        }
    }

    function addFloater(x, y, text, color) {
        floaters.push({ x, y, text, color, t: 0 });
    }

    function drawFloaters(dt) {
        for (let i = floaters.length - 1; i >= 0; i--) {
            const f = floaters[i];
            f.t += dt;
            if (f.t >= 1.6) { floaters.splice(i, 1); continue; }
            const p = S(f.x, f.y);
            const rise = f.t * 30;
            R.ctx.font = `700 14px Inter, system-ui, sans-serif`;
            R.ctx.textAlign = 'center';
            R.ctx.textBaseline = 'middle';
            R.ctx.globalAlpha = Math.min(1, 2 * (1.6 - f.t));
            R.ctx.fillStyle = 'rgba(8, 12, 20, 0.7)';
            R.ctx.fillText(f.text, p.x + 1, p.y - rise + 1);
            R.ctx.fillStyle = f.color;
            R.ctx.fillText(f.text, p.x, p.y - rise);
            R.ctx.globalAlpha = 1;
        }
    }

    function addBurst(wx, wy) {
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2, sp = 24 + Math.random() * 70;
            bursts.push({ t: 'p', x: wx, y: wy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 55,
                          life: 0, dur: 0.75 + Math.random() * 0.4,
                          c: Math.random() > 0.35 ? '#fde68a' : '#34d399' });
        }
        bursts.push({ t: 'ring', x: wx, y: wy, life: 0, dur: 0.6 });
    }

    function drawBursts(dt) {
        const z = clampZoom();
        for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i];
            b.life += dt;
            if (b.life >= b.dur) { bursts.splice(i, 1); continue; }
            const f = b.life / b.dur;
            if (b.t === 'ring') {
                const p = S(b.x, b.y);
                R.ctx.strokeStyle = `rgba(253, 230, 138, ${0.6 * (1 - f)})`;
                R.ctx.lineWidth = 2.5;
                R.ctx.beginPath();
                R.ctx.ellipse(p.x, p.y, (8 + f * 40) * z, (8 + f * 40) * z * 0.5, 0, 0, Math.PI * 2);
                R.ctx.stroke();
            } else {
                b.vy += 150 * dt; // gravity (falls back toward the ground)
                b.x += b.vx * dt; b.y += b.vy * dt;
                const p = S(b.x, b.y);
                R.ctx.globalAlpha = 1 - f;
                R.ctx.fillStyle = b.c;
                R.ctx.beginPath(); R.ctx.arc(p.x, p.y, 2.6 * z, 0, Math.PI * 2); R.ctx.fill();
            }
        }
        R.ctx.globalAlpha = 1;
    }

    function updateTransfers(dt) {
        for (const t of SC.state.trucks) {
            const prev = cargoLen.get(t.id) || 0, now = t.cargo.length;
            if (now > prev && t.cargo[0]) {
                R.transfers.push({ x: t.x, y: t.y, item: t.cargo[0], dir: 1, life: 0, dur: 0.55 });
            } else if (now < prev) {
                const item = cargoLast.get(t.id);
                if (item) R.transfers.push({ x: t.x, y: t.y, item, dir: -1, life: 0, dur: 0.55 });
            }
            cargoLen.set(t.id, now);
            if (t.cargo[0]) cargoLast.set(t.id, t.cargo[0]);
        }
        for (let i = R.transfers.length - 1; i >= 0; i--) {
            R.transfers[i].life += dt;
            if (R.transfers[i].life >= R.transfers[i].dur) R.transfers.splice(i, 1);
        }
    }

    function drawCrate(sx, sy, s, item, alpha) {
        const col = SC.colorOf(item);
        R.ctx.globalAlpha = alpha;
        roundRectPath(sx - s, sy - s * 0.85, s * 2, s * 1.7, s * 0.3);
        R.ctx.fillStyle = shade(col, -0.12); R.ctx.fill();
        R.ctx.strokeStyle = rgba(shade(col, 0.45), 0.7); R.ctx.lineWidth = 1; R.ctx.stroke();
        R.ctx.strokeStyle = rgba(shade(col, -0.45), 0.6);
        R.ctx.beginPath(); R.ctx.moveTo(sx - s, sy); R.ctx.lineTo(sx + s, sy); R.ctx.stroke();
        emoji(SC.emojiOf(item), sx, sy, s * 1.55);
        R.ctx.globalAlpha = 1;
    }

    function drawTransfer(tr) {
        const z = clampZoom();
        const f = tr.life / tr.dur;
        const p = S(tr.x, tr.y);
        // load: crate rises from the ground into the truck bed then fades;
        // unload: crate lowers from the bed to the ground.
        const lift = tr.dir > 0 ? -(6 + f * 16) * z : -(6 + (1 - f) * 16) * z;
        const alpha = tr.dir > 0 ? Math.min(1, (1 - f) * 1.6) : Math.min(1, (1 - f) * 1.4);
        drawCrate(p.x, p.y + lift, 6 * z, tr.item, alpha);
    }

    Object.assign(R, { drawTruckAt, drawTruckBody, addFloater, drawFloaters, addBurst, drawBursts,
        updateTransfers, drawTransfer });
})();
