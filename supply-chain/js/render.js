// Canvas rendering. Reads state + camera, draws in world coordinates.
window.SC = window.SC || {};

SC.render = (function() {
    let canvas = null, ctx = null, dpr = 1;
    let seaTime = 0;
    let floaters = []; // rising "+$x"/"−$x" texts, world-anchored

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
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        SC.camera.setViewport(window.innerWidth, window.innerHeight);
    }

    function riverPolygon() {
        const r = SC.state.river;
        const left = [], right = [];
        for (let i = 0; i < r.spine.length; i++) {
            left.push({ x: r.spine[i].x - r.halfWidths[i], y: r.spine[i].y });
            right.push({ x: r.spine[i].x + r.halfWidths[i], y: r.spine[i].y });
        }
        return { left, right };
    }

    function drawWorld(dt) {
        const C = SC.CONFIG;
        seaTime += dt;

        // Land
        ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
        roundRect(-40, -40, C.WORLD_W + 80, C.WORLD_H + 80, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 2 / SC.camera.cam.zoom;
        ctx.stroke();

        // River
        const { left, right } = riverPolygon();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        left.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1.5;
        for (let w = 0; w < 4; w++) {
            ctx.beginPath();
            for (let i = 0; i < left.length; i++) {
                const t = i / (left.length - 1);
                const x = left[i].x + (right[i].x - left[i].x) * ((w + 1) / 5)
                        + Math.sin(seaTime * 2 + t * 8 + w) * 6;
                i ? ctx.lineTo(x, left[i].y) : ctx.moveTo(x, left[i].y);
            }
            ctx.stroke();
        }
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function drawRoads() {
        const pending = SC.input.getPendingDemolish && SC.input.getPendingDemolish();
        for (const e of SC.state.edges) {
            ctx.beginPath();
            ctx.moveTo(e.a.x, e.a.y);
            ctx.lineTo(e.b.x, e.b.y);
            if (e === pending) {
                ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
                ctx.lineWidth = 6;
            } else {
                ctx.strokeStyle = e.bridge ? 'rgba(125, 170, 210, 0.55)' : 'rgba(148, 163, 184, 0.45)';
                ctx.lineWidth = 4;
            }
            ctx.setLineDash(e.bridge ? [14, 8] : []);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    function drawGhostRoad() {
        const sel = SC.state.selectedNode;
        const hover = SC.input.getHover && SC.input.getHover();
        if (!sel || !hover) return;
        let target = null;
        for (const n of SC.state.nodes) {
            if (n.active && n !== sel && Math.hypot(n.x - hover.x, n.y - hover.y) < 40) target = n;
        }
        const end = target ? { x: target.x, y: target.y } : hover;
        const q = target ? SC.roads.quote(sel, target) : (() => {
            const len = Math.hypot(sel.x - end.x, sel.y - end.y);
            const bridge = SC.map.segmentCrossesRiver(sel.x, sel.y, end.x, end.y);
            return { len, bridge, cost: Math.round(len * SC.CONFIG.ROAD_COST_PER_UNIT * (bridge ? SC.CONFIG.BRIDGE_MULT : 1)) };
        })();
        if (!q) return;

        const affordable = SC.state.money >= q.cost;
        ctx.beginPath();
        ctx.moveTo(sel.x, sel.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = affordable ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        const mx = (sel.x + end.x) / 2, my = (sel.y + end.y) / 2;
        label(`$${q.cost}${q.bridge ? ' (bridge)' : ''}`, mx, my - 14,
              affordable ? '#34d399' : '#f87171');
    }

    // Screen-constant-size text at a world position
    function label(text, wx, wy, color, size) {
        const z = SC.camera.cam.zoom;
        ctx.font = `600 ${(size || 13) / z}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const w = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        roundRect(wx - w / 2 - 6 / z, wy - 10 / z, w + 12 / z, 20 / z, 6 / z);
        ctx.fill();
        ctx.fillStyle = color || '#f8fafc';
        ctx.fillText(text, wx, wy);
    }

    // Emoji drawn in world units so it zooms with the map
    function emoji(ch, wx, wy, size) {
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, wx, wy + size * 0.06);
    }

    function hexPath(x, y, r) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3 - Math.PI / 6;
            i ? ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a))
              : ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
        }
        ctx.closePath();
    }

    function drawNodes(now) {
        const z = SC.camera.cam.zoom;
        for (const n of SC.state.nodes) {
            if (!n.active) continue;
            const R = 16;

            // Unlock pulse
            if (n.unlockAt && now - n.unlockAt < 3) {
                const t = (now - n.unlockAt) / 3;
                ctx.beginPath();
                ctx.arc(n.x, n.y, R + 8 + t * 40, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 * (1 - t)})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            if (n === SC.state.selectedNode) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, R + 9, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }

            ctx.lineWidth = 2;
            if (n.kind === 'supplier') {
                hexPath(n.x, n.y, R + 2);
                ctx.fillStyle = SC.colorOf(n.mat) + '33';
                ctx.fill();
                ctx.strokeStyle = SC.colorOf(n.mat);
                ctx.stroke();
                emoji(SC.emojiOf(n.mat), n.x, n.y, 17);
            } else if (n.kind === 'factory') {
                ctx.beginPath();
                ctx.rect(n.x - R, n.y - R, R * 2, R * 2);
                if (n.forSale) {
                    ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
                    ctx.fill();
                    ctx.setLineDash([6, 5]);
                    ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 0.45;
                    emoji(SC.emojiOf(n.recipe), n.x, n.y, 17);
                    ctx.globalAlpha = 1;
                    label(`$${SC.CONFIG.FACTORY_SITE_PRICE}`, n.x, n.y - R - 14, '#94a3b8', 11);
                } else {
                    ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
                    ctx.stroke();
                    emoji(SC.emojiOf(n.recipe), n.x, n.y, 17);
                    // Crafting progress ring
                    if (n.crafting) {
                        const frac = Math.min(1, n.crafting.t / SC.craftTime());
                        ctx.beginPath();
                        ctx.arc(n.x, n.y, R + 6, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
                        ctx.strokeStyle = SC.colorOf(n.crafting.task.product);
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }
                    if (n.queue.length > 0) {
                        label(String(n.queue.length + (n.crafting ? 1 : 0)), n.x + R + 10 / z, n.y - R, '#94a3b8', 11);
                    }
                }
            } else { // city
                ctx.beginPath();
                ctx.arc(n.x, n.y, R, 0, Math.PI * 2);
                ctx.fillStyle = n.isHQ ? 'rgba(56, 189, 248, 0.25)' : 'rgba(148, 163, 184, 0.2)';
                ctx.fill();
                ctx.strokeStyle = n.isHQ ? 'rgba(56, 189, 248, 0.9)' : 'rgba(226, 232, 240, 0.85)';
                ctx.stroke();
                if (n.isHQ) label('HQ', n.x, n.y + R + 14, '#38bdf8', 11);
            }
        }
    }

    function drawOrderBubbles() {
        const byCity = new Map();
        for (const o of SC.state.orders) {
            if (!byCity.has(o.city)) byCity.set(o.city, []);
            byCity.get(o.city).push(o);
        }
        const z = SC.camera.cam.zoom;
        for (const [city, orders] of byCity) {
            orders.forEach((o, i) => {
                const bx = city.x + (i - (orders.length - 1) / 2) * (36 / Math.max(z, 0.6));
                const by = city.y - 38;
                const r = 14;
                const frac = Math.max(0, o.deadline / o.deadlineTotal);
                const urgent = frac < 0.25;

                ctx.beginPath();
                ctx.arc(bx, by, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.fill();
                ctx.strokeStyle = urgent ? '#f87171' : 'rgba(148, 163, 184, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Deadline arc
                ctx.beginPath();
                ctx.arc(bx, by, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
                ctx.strokeStyle = urgent ? '#f87171' : SC.colorOf(o.product);
                ctx.lineWidth = 3;
                ctx.stroke();

                // Ordered product + remaining qty
                emoji(SC.emojiOf(o.product), bx, by, 15);
                const left = o.qty - o.deliveredUnits;
                if (left > 1) label(String(left), bx + r + 2, by - r + 2, '#f8fafc', 10);
                if (o.noRoute) label('no route!', bx, by - r - 12, '#f87171', 10);
            });
        }
    }

    // Glowing overlay on the roads serving a tapped order (see ui.js)
    function drawHighlight(now) {
        const h = SC.state.highlight;
        if (!h || now > h.until) return;
        const fade = Math.min(1, (h.until - now) / 0.5);
        ctx.lineCap = 'round';
        for (const path of h.paths) {
            ctx.beginPath();
            path.forEach((n, i) => i ? ctx.lineTo(n.x, n.y) : ctx.moveTo(n.x, n.y));
            ctx.strokeStyle = h.color;
            ctx.globalAlpha = 0.55 * fade;
            ctx.lineWidth = 8;
            ctx.shadowBlur = 12;
            ctx.shadowColor = h.color;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.lineCap = 'butt';
        // Pulse the ordering city
        const pulse = 22 + Math.sin(now * 6) * 4;
        ctx.beginPath();
        ctx.arc(h.city.x, h.city.y, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = h.color;
        ctx.globalAlpha = 0.8 * fade;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    function drawFloaters(dt) {
        const z = SC.camera.cam.zoom;
        for (let i = floaters.length - 1; i >= 0; i--) {
            const f = floaters[i];
            f.t += dt;
            if (f.t >= 1.6) { floaters.splice(i, 1); continue; }
            const rise = f.t * 28 / Math.max(z, 0.5);
            ctx.font = `700 ${15 / z}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = Math.min(1, 2 * (1.6 - f.t));
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.fillText(f.text, f.x + 1 / z, f.y - rise + 1 / z);
            ctx.fillStyle = f.color;
            ctx.fillText(f.text, f.x, f.y - rise);
            ctx.globalAlpha = 1;
        }
    }

    function drawTrucks() {
        for (const t of SC.state.trucks) {
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.path ? (t.angle || 0) : 0);
            const body = t.cargo ? SC.colorOf(t.cargo) : '#94a3b8';
            ctx.fillStyle = body;
            ctx.shadowBlur = t.cargo ? 6 : 0;
            ctx.shadowColor = body;
            // cab + two trailer segments, echoing the original ambient sim
            ctx.fillRect(6, -3.5, 6, 7);
            ctx.fillRect(-3, -4, 7, 8);
            ctx.fillRect(-12, -4, 7, 8);
            ctx.restore();
            if (t.cargo) {
                ctx.shadowBlur = 0;
                emoji(SC.emojiOf(t.cargo), t.x, t.y - 13, 13);
            }
        }
    }

    function frame(dt, now) {
        const cam = SC.camera.cam;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.setTransform(dpr * cam.zoom, 0, 0, dpr * cam.zoom,
                         -cam.x * cam.zoom * dpr, -cam.y * cam.zoom * dpr);
        drawWorld(dt);
        drawRoads();
        drawHighlight(now);
        drawGhostRoad();
        drawOrderBubbles();
        drawNodes(now);
        drawTrucks();
        drawFloaters(dt);
    }

    return { attach, frame, resize };
})();
