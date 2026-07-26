// Pointer handling: drag to pan, wheel / pinch to zoom, tap to select
// nodes and build roads. DOM layer — no game rules live here.
window.SC = window.SC || {};

SC.input = (function() {
    const TAP_SLOP = 8;        // px of movement before a mouse press becomes a drag
    const TOUCH_TAP_SLOP = 20; // fingers wobble more than a mouse click; too tight
                                // and a background tap-to-cancel misreads as a pan,
                                // leaving road building armed for the next real tap

    let canvas = null;
    const pointers = new Map(); // pointerId -> {x, y, startX, startY, moved, pointerType}
    let pinch = null;           // {dist, cx, cy}
    let hover = null;           // world pos of the mouse, for the ghost road
    let hoverScreen = null;     // same position in screen px, for node picking
    let pendingDemolish = null; // edge tapped once, awaiting confirm tap
    let pendingBuy = null;      // for-sale factory tapped once
    let pendingUpgrade = null;  // Upgrade mode: node/edge tapped once, awaiting confirm
    let inspectNode = null;     // Inspect mode: node currently hovered (mouse) or tapped (touch)

    function nodeAtScreen(sx, sy) {
        let best = null, bestD = 32; // px hit radius around the building body
        for (const n of SC.state.nodes) {
            if (!n.active) continue;
            // Hit-test the whole extruded building, not a single point: the
            // iso view draws each node as a prism from its ground anchor up
            // to the roof (where the icon sits), so measure distance to that
            // vertical segment. Testing only the roof (or only the ground)
            // made clicks on the other end of a tall building miss — the
            // capsule accepts anywhere on the body, plus bestD px of slack.
            const g = SC.camera.toScreen(n.x, n.y);
            const r = SC.render.nodeIconAnchor(n); // roof: same x, smaller y
            const t = Math.max(0, Math.min(1, (sy - g.y) / ((r.y - g.y) || -1e-6)));
            const d = Math.hypot(g.x - sx, (g.y + (r.y - g.y) * t) - sy);
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

    // Manual site placement: every tap while active tries to place there;
    // success or an unaffordable attempt exits the mode, an out-of-bounds/
    // too-close spot lets the player retry. Suppliers/factories need the
    // 'manualPlacement' research; truck yards and junctions don't (base
    // mechanics).
    function handlePlacementTap(sx, sy) {
        const st = SC.state;
        const w = SC.camera.toWorld(sx, sy);
        const res = SC.placement.place(st.placeMode.kind, st.placeMode.good, w.x, w.y);
        if (res.ok) {
            SC.sfx.play('build');
            const what = st.placeMode.kind === 'yard' ? 'Truck yard'
                       : st.placeMode.kind === 'junction' ? 'Junction'
                       : `${SC.nameOf(st.placeMode.good)} ${st.placeMode.kind}`;
            SC.emit('toast', { text: `${what} placed for $${SC.placement.price(st.placeMode.kind)}`, kind: 'good' });
            if (st.placeMode.kind === 'yard') st.activeYard = res.node; // new yard becomes the default for future truck buys
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

    // Upgrade mode (⬆): tap a supplier to level up its stock/regen, or a
    // road to pave it into a highway (needs 'pavedRoads' research). Same
    // two-tap confirm pattern as demolish/site-buy.
    function handleUpgradeTap(sx, sy) {
        const node = nodeAtScreen(sx, sy);
        const target = (node && node.kind === 'supplier') ? node : (node ? null : edgeAtScreen(sx, sy));
        if (!target) {
            if (node) SC.emit('toast', { text: 'Only suppliers and roads can be upgraded', kind: 'info' });
            pendingUpgrade = null;
            return;
        }
        const isNode = !!target.kind;

        if (pendingUpgrade !== target) { // first tap: quote it
            let text;
            if (isNode) {
                const price = SC.supplierUpgradePrice(target);
                text = price === null
                    ? `${SC.emojiOf(target.mat)} supplier is already max level`
                    : `Tap again to upgrade this ${SC.nameOf(target.mat).toLowerCase()} supplier to Lv${(target.level || 0) + 2} — $${price} (more stock, faster regen)`;
                pendingUpgrade = price === null ? null : target;
            } else {
                const q = SC.roads.upgradeQuote(target);
                text = target.level > 0 ? 'Already a highway'
                     : !SC.research.isDone('pavedRoads') ? 'Requires Asphalt Paving research 🛣️'
                     : `Tap again to pave this road into a highway — $${q.cost} (trucks +60% here)`;
                pendingUpgrade = (target.level === 0 && SC.research.isDone('pavedRoads')) ? target : null;
            }
            SC.sfx.play('click');
            SC.emit('toast', { text, kind: 'info' });
            return;
        }

        pendingUpgrade = null; // second tap: do it
        const res = isNode ? SC.economy.upgradeSupplier(target) : SC.roads.upgrade(target);
        if (res.ok) {
            SC.sfx.play('build');
            SC.emit('toast', {
                text: isNode ? `${SC.emojiOf(target.mat)} supplier upgraded to Lv${target.level + 1}!`
                             : 'Road paved into a highway! 🛣️',
                kind: 'good'
            });
        } else if (res.reason === 'money') {
            SC.sfx.play('error');
            SC.emit('toast', { text: `Credit limit reached — costs $${res.cost}`, kind: 'error' });
        }
    }

    function handleTap(sx, sy, shiftKey) {
        const st = SC.state;
        if (st.mode === 'inspect') { // tap a node to show/hide its info (mouse also gets live hover)
            const node = nodeAtScreen(sx, sy);
            inspectNode = (node && node === inspectNode) ? null : node;
            if (node) SC.sfx.play('click');
            return;
        }
        if (st.mode === 'upgrade') { handleUpgradeTap(sx, sy); return; }
        if (st.placeMode) { handlePlacementTap(sx, sy); return; }

        const node = nodeAtScreen(sx, sy);

        if (node) {
            pendingDemolish = null;
            if (st.selectedNode && st.selectedNode !== node) {
                // Overlap rules first: a road that runs over a site or
                // crosses another road illegally never gets as far as the
                // bridge-vs-ferry question (see SC.roads.checkSegment).
                const q = SC.roads.quote(st.selectedNode, node);
                if (q && q.blocked) {
                    SC.sfx.play('error');
                    SC.emit('toast', { text: SC.roads.blockMessage(q), kind: 'error' });
                    pendingBuy = null;
                    return;
                }
                if (!SC.roads.findEdge(st.selectedNode, node) &&
                    SC.map.segmentCrossesRiver(st.selectedNode.x, st.selectedNode.y, node.x, node.y)) {
                    SC.emit('crossingChoice', { a: st.selectedNode, b: node, shiftKey });
                    pendingBuy = null;
                    return;
                }
                const res = SC.roads.build(st.selectedNode, node);
                if (res.ok) {
                    SC.sfx.play('build');
                    st.selectedNode = shiftKey ? node : null; // chain roads only when holding Shift
                } else if (res.reason === 'money') {
                    SC.sfx.play('error');
                    SC.emit('toast', { text: `Credit limit reached — road costs $${res.cost} (limit −$${SC.CONFIG.CREDIT_LIMIT})`, kind: 'error' });
                } else if (SC.roads.findEdge(st.selectedNode, node)) {
                    st.selectedNode = shiftKey ? node : null; // road already there: move selection or deselect
                    SC.sfx.play('click');
                }
                pendingBuy = null;
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
            if (node === st.selectedNode) {
                st.selectedNode = null;
                pendingBuy = null;
                SC.sfx.play('click');
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

    // Called when Inspect mode's build-mode leftovers (selection, pending
    // demolish/buy) need clearing, e.g. right after a mode switch.
    function reset() {
        pendingDemolish = null;
        pendingBuy = null;
        pendingUpgrade = null;
        inspectNode = null;
    }

    function attach(cv) {
        canvas = cv;
        canvas.style.touchAction = 'none';

        canvas.addEventListener('pointerdown', e => {
            canvas.setPointerCapture(e.pointerId);
            pointers.set(e.pointerId, {
                x: e.clientX, y: e.clientY,
                startX: e.clientX, startY: e.clientY, moved: false,
                pointerType: e.pointerType
            });
            if (pointers.size === 2) pinch = pinchState();
        });

        canvas.addEventListener('pointermove', e => {
            const p = pointers.get(e.pointerId);
            if (!p) {
                hover = SC.camera.toWorld(e.clientX, e.clientY);
                hoverScreen = { x: e.clientX, y: e.clientY };
                const over = nodeAtScreen(e.clientX, e.clientY);
                if (SC.state.mode === 'inspect') inspectNode = over;
                // PC affordance: show which building a click would hit
                canvas.style.cursor = over ? 'pointer' : '';
                return;
            }
            const dx = e.clientX - p.x, dy = e.clientY - p.y;
            p.x = e.clientX; p.y = e.clientY;
            const slop = p.pointerType === 'mouse' ? TAP_SLOP : TOUCH_TAP_SLOP;
            if (Math.hypot(p.x - p.startX, p.y - p.startY) > slop) {
                p.moved = true; // this is a pan, not a tap — drop any shown inspect info
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
            hoverScreen = { x: e.clientX, y: e.clientY };
        });

        const release = e => {
            const p = pointers.get(e.pointerId);
            pointers.delete(e.pointerId);
            if (pointers.size < 2) pinch = null;
            if (p && !p.moved && e.type === 'pointerup' && pointers.size === 0) {
                handleTap(e.clientX, e.clientY, e.shiftKey);
            }
        };
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', release);

        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            SC.camera.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
        }, { passive: false });

        canvas.addEventListener('pointerleave', () => { hover = null; hoverScreen = null; inspectNode = null; });
    }

    // The node a tap at the current pointer position would hit — the ghost
    // road's snap target and the render-side hover ring both use this, so
    // what's previewed is exactly what a click selects.
    function getHoverNode() {
        if (hoverScreen) return nodeAtScreen(hoverScreen.x, hoverScreen.y);
        if (hover) { // debug hover is world-coords only; project it
            const p = SC.camera.toScreen(hover.x, hover.y);
            return nodeAtScreen(p.x, p.y);
        }
        return null;
    }

    return {
        attach,
        reset,
        getInspectNode: () => inspectNode,
        getHover: () => hover,
        getHoverNode,
        getPendingDemolish: () => pendingDemolish,
        getPendingUpgrade: () => pendingUpgrade,
        _handleTap: handleTap,
        // Headless verification hook: force a hover point without a real
        // pointermove, so placement/road ghost previews can be screenshotted.
        _setDebugHover: (x, y) => { hover = { x, y }; }
    };
})();
