// Pointer handling: drag to pan, wheel / pinch to zoom, tap to select
// nodes and build roads. DOM layer — no game rules live here.
window.SC = window.SC || {};

SC.input = (function() {
    const TAP_SLOP = 8; // px of movement before a press becomes a drag

    let canvas = null;
    const pointers = new Map(); // pointerId -> {x, y, startX, startY, moved}
    let pinch = null;           // {dist, cx, cy}
    let hover = null;           // world pos of the mouse, for the ghost road
    let pendingDemolish = null; // edge tapped once, awaiting confirm tap
    let pendingBuy = null;      // for-sale factory tapped once

    function nodeAtScreen(sx, sy) {
        let best = null, bestD = 30; // px hit radius
        for (const n of SC.state.nodes) {
            if (!n.active) continue;
            const p = SC.camera.toScreen(n.x, n.y);
            const d = Math.hypot(p.x - sx, p.y - sy);
            if (d < bestD) { bestD = d; best = n; }
        }
        return best;
    }

    function edgeAtScreen(sx, sy) {
        const w = SC.camera.toWorld(sx, sy);
        const tol = 12 / SC.camera.cam.zoom;
        for (const e of SC.state.edges) {
            const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
            const len2 = dx * dx + dy * dy || 1;
            let t = ((w.x - e.a.x) * dx + (w.y - e.a.y) * dy) / len2;
            t = Math.max(0, Math.min(1, t));
            const d = Math.hypot(w.x - (e.a.x + dx * t), w.y - (e.a.y + dy * t));
            if (d < tol) return e;
        }
        return null;
    }

    function handleTap(sx, sy) {
        const node = nodeAtScreen(sx, sy);
        const st = SC.state;

        if (node) {
            pendingDemolish = null;
            if (st.selectedNode && st.selectedNode !== node) {
                const res = SC.roads.build(st.selectedNode, node);
                if (res.ok) {
                    SC.sfx.play('build');
                    st.selectedNode = node; // chain roads mini-metro style
                } else if (res.reason === 'money') {
                    SC.sfx.play('error');
                    SC.emit('toast', { text: `Not enough money — road costs $${res.cost}`, kind: 'error' });
                } else if (SC.roads.findEdge(st.selectedNode, node)) {
                    st.selectedNode = node; // road already there: just move selection
                    SC.sfx.play('click');
                }
                pendingBuy = null;
                return;
            }
            if (node === st.selectedNode) {
                st.selectedNode = null;
                pendingBuy = null;
                SC.sfx.play('click');
                return;
            }
            if (node.kind === 'factory' && node.forSale) {
                const building = SC.GOODS[node.recipe].building;
                if (pendingBuy === node) {
                    const res = SC.factories.buySite(node);
                    if (res.ok) {
                        SC.sfx.play('cash');
                        SC.emit('toast', { text: `${building} ${SC.emojiOf(node.recipe)} purchased!`, kind: 'good' });
                    } else {
                        SC.sfx.play('error');
                        SC.emit('toast', { text: `Not enough money — ${building.toLowerCase()} costs $${res.cost}`, kind: 'error' });
                    }
                    pendingBuy = null;
                } else {
                    pendingBuy = node;
                    st.selectedNode = node;
                    SC.sfx.play('click');
                    SC.emit('toast', { text: `Tap again to buy this ${building.toLowerCase()} ${SC.emojiOf(node.recipe)} for $${SC.CONFIG.FACTORY_SITE_PRICE}`, kind: 'info' });
                }
                return;
            }
            st.selectedNode = node;
            pendingBuy = null;
            SC.sfx.play('click');
            return;
        }

        const edge = edgeAtScreen(sx, sy);
        if (edge && !st.selectedNode) {
            if (pendingDemolish === edge) {
                if (SC.roads.demolish(edge)) {
                    SC.sfx.play('demolish');
                    SC.emit('toast', { text: `Road demolished, +$${Math.round(edge.cost * SC.CONFIG.ROAD_REFUND)} back`, kind: 'info' });
                } else {
                    SC.emit('toast', { text: 'A truck is using that road', kind: 'error' });
                }
                pendingDemolish = null;
            } else {
                pendingDemolish = edge;
                SC.sfx.play('click');
                SC.emit('toast', { text: `Tap the road again to demolish it (+$${Math.round(edge.cost * SC.CONFIG.ROAD_REFUND)} refund)`, kind: 'info' });
            }
            return;
        }

        st.selectedNode = null;
        pendingBuy = null;
        pendingDemolish = null;
    }

    function pinchState() {
        const pts = [...pointers.values()];
        return {
            dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
            cx: (pts[0].x + pts[1].x) / 2,
            cy: (pts[0].y + pts[1].y) / 2
        };
    }

    function attach(cv) {
        canvas = cv;
        canvas.style.touchAction = 'none';

        canvas.addEventListener('pointerdown', e => {
            canvas.setPointerCapture(e.pointerId);
            pointers.set(e.pointerId, {
                x: e.clientX, y: e.clientY,
                startX: e.clientX, startY: e.clientY, moved: false
            });
            if (pointers.size === 2) pinch = pinchState();
        });

        canvas.addEventListener('pointermove', e => {
            const p = pointers.get(e.pointerId);
            if (!p) {
                hover = SC.camera.toWorld(e.clientX, e.clientY);
                return;
            }
            const dx = e.clientX - p.x, dy = e.clientY - p.y;
            p.x = e.clientX; p.y = e.clientY;
            if (Math.hypot(p.x - p.startX, p.y - p.startY) > TAP_SLOP) p.moved = true;

            if (pointers.size === 2) {
                const now = pinchState();
                SC.camera.zoomAt(now.cx, now.cy, now.dist / pinch.dist);
                SC.camera.pan(now.cx - pinch.cx, now.cy - pinch.cy);
                pinch = now;
            } else if (pointers.size === 1 && p.moved) {
                SC.camera.pan(dx, dy);
            }
            hover = SC.camera.toWorld(e.clientX, e.clientY);
        });

        const release = e => {
            const p = pointers.get(e.pointerId);
            pointers.delete(e.pointerId);
            if (pointers.size < 2) pinch = null;
            if (p && !p.moved && e.type === 'pointerup' && pointers.size === 0) {
                handleTap(e.clientX, e.clientY);
            }
        };
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', release);

        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            SC.camera.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
        }, { passive: false });

        canvas.addEventListener('pointerleave', () => { hover = null; });
    }

    return {
        attach,
        getHover: () => hover,
        getPendingDemolish: () => pendingDemolish,
        _handleTap: handleTap
    };
})();
