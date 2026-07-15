// Pointer handling: drag to pan, wheel / pinch to zoom, tap to select
// nodes and build roads. DOM layer — no game rules live here.
window.SC = window.SC || {};

SC.input = (function() {
    const TAP_SLOP = 8;     // px of movement before a press becomes a drag
    const HOLD_MS = 350;    // touch hold duration before Inspect mode shows info

    let canvas = null;
    const pointers = new Map(); // pointerId -> {x, y, startX, startY, moved}
    let pinch = null;           // {dist, cx, cy}
    let hover = null;           // world pos of the mouse, for the ghost road
    let pendingDemolish = null; // edge tapped once, awaiting confirm tap
    let pendingBuy = null;      // for-sale factory tapped once
    let inspectNode = null;     // Inspect mode: node currently hovered/held
    let holdTimer = null;       // Inspect mode (touch): pending long-press

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

    // Manual site placement (research-unlocked): every tap while active
    // tries to place there; success or an unaffordable attempt exits the
    // mode, an out-of-bounds/too-close spot lets the player retry.
    function handlePlacementTap(sx, sy) {
        const st = SC.state;
        const w = SC.camera.toWorld(sx, sy);
        const res = SC.placement.place(st.placeMode.kind, st.placeMode.good, w.x, w.y);
        if (res.ok) {
            SC.sfx.play('build');
            SC.emit('toast', { text: `${SC.nameOf(st.placeMode.good)} ${st.placeMode.kind} placed for $${SC.placement.price(st.placeMode.kind)}`, kind: 'good' });
            st.placeMode = null;
        } else if (res.reason === 'invalid') {
            SC.sfx.play('error');
            SC.emit('toast', { text: 'Too close to the river or another site — try elsewhere', kind: 'error' });
        } else if (res.reason === 'money') {
            SC.sfx.play('error');
            SC.emit('toast', { text: `Credit limit reached — costs $${res.cost}`, kind: 'error' });
            st.placeMode = null;
        }
    }

    function handleTap(sx, sy) {
        const st = SC.state;
        if (st.mode === 'inspect') return; // Inspect mode: hover/hold only, no building
        if (st.placeMode) { handlePlacementTap(sx, sy); return; }

        const node = nodeAtScreen(sx, sy);

        if (node) {
            pendingDemolish = null;
            if (st.selectedNode && st.selectedNode !== node) {
                const res = SC.roads.build(st.selectedNode, node);
                if (res.ok) {
                    SC.sfx.play('build');
                    st.selectedNode = node; // chain roads mini-metro style
                } else if (res.reason === 'money') {
                    SC.sfx.play('error');
                    SC.emit('toast', { text: `Credit limit reached — road costs $${res.cost} (limit −$${SC.CONFIG.CREDIT_LIMIT})`, kind: 'error' });
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
                        SC.emit('toast', { text: `Credit limit reached — ${building.toLowerCase()} costs $${res.cost}`, kind: 'error' });
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

    function clearHoldTimer() {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    }

    // Called when Inspect mode's build-mode leftovers (selection, pending
    // demolish/buy) need clearing, e.g. right after a mode switch.
    function reset() {
        pendingDemolish = null;
        pendingBuy = null;
        inspectNode = null;
        clearHoldTimer();
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

            // Inspect mode (touch): a still finger for HOLD_MS "peeks" the
            // node's info tooltip, same primitive as a long-press elsewhere.
            // Mouse doesn't need this — pointermove hover covers it live.
            if (SC.state.mode === 'inspect' && e.pointerType !== 'mouse') {
                clearHoldTimer();
                const id = e.pointerId;
                holdTimer = setTimeout(() => {
                    const p = pointers.get(id);
                    if (p && !p.moved) inspectNode = nodeAtScreen(p.x, p.y);
                }, HOLD_MS);
            }
        });

        canvas.addEventListener('pointermove', e => {
            const p = pointers.get(e.pointerId);
            if (!p) {
                hover = SC.camera.toWorld(e.clientX, e.clientY);
                if (SC.state.mode === 'inspect') inspectNode = nodeAtScreen(e.clientX, e.clientY);
                return;
            }
            const dx = e.clientX - p.x, dy = e.clientY - p.y;
            p.x = e.clientX; p.y = e.clientY;
            if (Math.hypot(p.x - p.startX, p.y - p.startY) > TAP_SLOP) {
                p.moved = true;
                clearHoldTimer(); // moving cancels a pending hold — this is a pan
                if (SC.state.mode === 'inspect') inspectNode = null;
            }

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
            clearHoldTimer();
            if (SC.state.mode === 'inspect' && e.pointerType !== 'mouse') inspectNode = null;
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

        canvas.addEventListener('pointerleave', () => { hover = null; inspectNode = null; });
    }

    return {
        attach,
        reset,
        getInspectNode: () => inspectNode,
        getHover: () => hover,
        getPendingDemolish: () => pendingDemolish,
        _handleTap: handleTap,
        // Headless verification hook: force a hover point without a real
        // pointermove, so placement/road ghost previews can be screenshotted.
        _setDebugHover: (x, y) => { hover = { x, y }; }
    };
})();
