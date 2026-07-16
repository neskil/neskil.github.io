// HUD, panels, toasts, help overlay. DOM layer only.
window.SC = window.SC || {};

SC.ui = (function() {
    const $ = id => document.getElementById(id);
    let toastTimer = null;

    function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

    function toast(text, kind) {
        const el = $('toast');
        el.textContent = text;
        el.className = 'show ' + (kind || 'info');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.className = ''; }, 3200);
    }

    function updateHUD() {
        const st = SC.state;
        const inDebt = st.money < 0;
        $('hud-money').textContent = (inDebt ? '−' : '') + fmt(Math.abs(st.money));
        $('hud-money-label').textContent = st.defaultIn !== null
            ? `⚠ DEFAULT IN ${Math.max(0, Math.ceil(st.defaultIn))}s`
            : inDebt ? `Debt (${Math.round(SC.diff().interestPerMin * 100)}%/min)` : 'Money';
        $('hud-money-item').classList.toggle('debt', inDebt);
        const idle = st.trucks.filter(t => !t.jobs.length && !t.path).length;
        $('hud-trucks').textContent = `${idle}/${st.trucks.length}`;
        for (const btn of $('speed-toggle').children) {
            btn.classList.toggle('active', +btn.dataset.speed === st.speed);
        }
    }

    function setSpeed(n) {
        SC.state.speed = n;
        SC.sfx.play('click');
    }

    function updateShop() {
        const st = SC.state;
        const tb = $('btn-truck');
        tb.querySelector('.price').textContent = fmt(SC.truckPrice());
        tb.disabled = !SC.canAfford(SC.truckPrice());
        updateYards();

        for (const key of Object.keys(SC.CONFIG.UPGRADES)) {
            const btn = $('btn-' + key);
            const price = SC.upgradePrice(key);
            const lvl = st.upgrades[key];
            btn.querySelector('.lvl').textContent = '●'.repeat(lvl) + '○'.repeat(SC.upgradeMax(key) - lvl);
            if (price === null) {
                btn.querySelector('.price').textContent = 'MAX';
                btn.disabled = true;
            } else {
                btn.querySelector('.price').textContent = fmt(price);
                btn.disabled = !SC.canAfford(price);
            }
        }
        updateResearchShortcut();
        updateResearchTree();
        updatePromo();
        updateBuild();
    }

    // ── Promotions (Marketing Blitz): repeatable paid demand burst ──
    function updatePromo() {
        const btn = $('btn-promo');
        btn.classList.toggle('hidden', !SC.research.isDone('promotions'));
        if (btn.classList.contains('hidden')) return;
        if (SC.economy.isPromoActive()) {
            btn.disabled = true;
            btn.querySelector('.price').textContent = `${Math.ceil(SC.economy.promoTimeLeft())}s left`;
        } else {
            btn.disabled = !SC.canAfford(SC.CONFIG.PROMO_COST);
            btn.querySelector('.price').textContent = fmt(SC.CONFIG.PROMO_COST);
        }
    }

    // ── Truck yards: HQ is always one; more can be built (not research-
    // gated). New trucks station at whichever yard is picked below.
    function yardLabel(n) {
        return n.isHQ ? 'HQ' : `Yard #${n.id}`;
    }

    function updateYards() {
        const st = SC.state;
        const yards = st.nodes.filter(SC.isYard);
        if (!st.activeYard || !yards.includes(st.activeYard)) st.activeYard = yards[0];

        const sel = $('yard-select');
        sel.innerHTML = yards.map(n =>
            `<option value="${n.id}">${yardLabel(n)} — ${st.trucks.filter(t => t.homeYard === n).length} 🚚</option>`
        ).join('');
        sel.value = String(st.activeYard.id);

        const btn = $('btn-yard');
        const price = SC.yardPrice();
        const active = st.placeMode && st.placeMode.kind === 'yard';
        btn.classList.toggle('active', !!active);
        btn.querySelector('.price').textContent = active ? 'Tap map…' : fmt(price);
        btn.disabled = !active && !SC.canAfford(price);

        // Move-truck: needs an idle truck homed somewhere else
        $('btn-moveTruck').disabled = !st.trucks.some(t =>
            !t.jobs.length && t.homeYard !== st.activeYard && (!t.path || t.phase === 'returning'));
    }

    // ── Research & Build (Shop panel sections) ──────
    // The Shop panel keeps a one-line shortcut (bottom-left, always visible);
    // the full branching tech tree lives in its own overlay (#research-overlay)
    // so it has room to lay out prerequisite branches instead of a flat list.
    function updateResearchShortcut() {
        const st = SC.state;
        const status = $('research-shortcut-status');
        if (st.research.active) {
            const id = st.research.active.id;
            status.textContent = `${SC.RESEARCH[id].emoji} ${Math.round(SC.research.progress(id) * 100)}%`;
        } else {
            const available = SC.RESEARCH_ORDER.filter(SC.research.isAvailable).length;
            status.textContent = available ? `${available} available` : 'Open tree';
        }
    }

    function researchNodeHTML(id, pos) {
        const t = SC.RESEARCH[id];
        const done = SC.research.isDone(id);
        const active = SC.state.research.active && SC.state.research.active.id === id;
        const locked = !done && !active && !SC.research.isAvailable(id);
        let btn;
        if (done) {
            btn = '<div class="research-btn" style="background:rgba(52,211,153,0.15);cursor:default">✓ Researched</div>';
        } else if (active) {
            const pct = Math.round(SC.research.progress(id) * 100);
            const left = Math.max(0, Math.round(t.time * (1 - SC.research.progress(id))));
            btn = `<div class="research-bar"><div style="width:${pct}%"></div></div>
                   <div class="research-desc" style="margin:0.3rem 0 0;text-align:center">${left}s left</div>`;
        } else if (locked) {
            btn = '<div class="research-btn" disabled style="cursor:default">🔒 Locked</div>';
        } else {
            btn = `<button class="research-btn" data-research="${id}" ${SC.state.research.active || !SC.canAfford(t.cost) ? 'disabled' : ''}>Research — ${fmt(t.cost)} · ${t.time}s</button>`;
        }
        return `<div class="rt-node research-row ${done ? 'done' : ''} ${locked ? 'locked' : ''}"
                     style="left:${pos.x}px;top:${pos.y}px;width:${pos.w}px">
            <div class="research-top"><span class="research-name">${t.emoji} ${t.name}</span></div>
            <div class="research-desc">${t.desc}</div>
            ${btn}
        </div>`;
    }

    // Tier = longest prerequisite chain to a root (0 = no requires), so the
    // tree reads left-to-right in dependency order regardless of RESEARCH_ORDER.
    function researchTiers() {
        const cache = {};
        function tierOf(id) {
            if (cache[id] !== undefined) return cache[id];
            const reqs = SC.RESEARCH[id].requires;
            return cache[id] = reqs.length ? 1 + Math.max(...reqs.map(tierOf)) : 0;
        }
        const byTier = {};
        for (const id of SC.RESEARCH_ORDER) (byTier[tierOf(id)] = byTier[tierOf(id)] || []).push(id);
        return byTier;
    }

    const RT_COL_W = 210, RT_ROW_H = 132, RT_NODE_W = 176, RT_NODE_H_HALF = 46, RT_PAD = 20;

    function researchTreeOpen() { return !$('research-overlay').classList.contains('hidden'); }

    function updateResearchTree() {
        if (!researchTreeOpen()) return;
        const byTier = researchTiers();
        const tierKeys = Object.keys(byTier).map(Number).sort((a, b) => a - b);
        const positions = {};
        let maxRows = 1;
        tierKeys.forEach(tier => {
            byTier[tier].forEach((id, row) => {
                positions[id] = { x: RT_PAD + tier * RT_COL_W, y: RT_PAD + row * RT_ROW_H, w: RT_NODE_W };
            });
            maxRows = Math.max(maxRows, byTier[tier].length);
        });
        const width = RT_PAD * 2 + tierKeys.length * RT_COL_W;
        const height = RT_PAD * 2 + maxRows * RT_ROW_H;

        const nodesEl = $('research-tree-nodes');
        nodesEl.style.width = width + 'px';
        nodesEl.style.height = height + 'px';
        nodesEl.innerHTML = SC.RESEARCH_ORDER.map(id => researchNodeHTML(id, positions[id])).join('');

        const svg = $('research-tree-edges');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        let edges = '';
        for (const id of SC.RESEARCH_ORDER) {
            const to = positions[id];
            for (const req of SC.RESEARCH[id].requires) {
                const from = positions[req];
                if (!from) continue;
                const x1 = from.x + from.w, y1 = from.y + RT_NODE_H_HALF;
                const x2 = to.x, y2 = to.y + RT_NODE_H_HALF;
                const midX = (x1 + x2) / 2;
                edges += `<path d="M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}"
                    class="rt-edge ${SC.research.isDone(req) ? 'rt-edge-done' : ''}" />`;
            }
        }
        svg.innerHTML = edges;
    }

    function openResearchTree() {
        $('research-overlay').classList.remove('hidden');
        updateResearchTree();
    }

    function closeResearchTree() {
        $('research-overlay').classList.add('hidden');
    }

    function buildRow(kind, good) {
        const g = SC.GOODS[good];
        const price = SC.placement.price(kind);
        const active = SC.state.placeMode && SC.state.placeMode.kind === kind && SC.state.placeMode.good === good;
        const label = kind === 'supplier' ? `Place ${g.name.toLowerCase()} supplier` : `Place ${g.building.toLowerCase()}`;
        return `<button class="shop-btn build-btn ${active ? 'active' : ''}" data-kind="${kind}" data-good="${good}" ${!active && !SC.canAfford(price) ? 'disabled' : ''}>
            <span class="sname">${g.emoji} ${label}</span>
            <span class="price">${active ? 'Tap map…' : fmt(price)}</span>
        </button>`;
    }

    function updateBuild() {
        const unlocked = SC.research.isDone('manualPlacement');
        $('build-title').classList.toggle('hidden', !unlocked);
        if (!unlocked) { $('build-list').innerHTML = ''; return; }
        const rawGoods = Object.keys(SC.GOODS).filter(k => SC.GOODS[k].raw);
        const craftedGoods = Object.keys(SC.GOODS).filter(k => !SC.GOODS[k].raw);
        $('build-list').innerHTML =
            rawGoods.map(g => buildRow('supplier', g)).join('') +
            craftedGoods.map(g => buildRow('factory', g)).join('');
    }

    function orderRow(o) {
        const p = SC.GOODS[o.product];
        const frac = Math.max(0, o.deadline / o.deadlineTotal);
        const left = o.qty - o.deliveredUnits;
        return `<div class="order ${frac < 0.25 ? 'urgent' : ''}" data-order="${o.id}">
            <span class="chip">${p.emoji}</span>
            <span class="oname">${left}× ${p.name}</span>
            <span class="opay">${fmt(o.payout)}</span>
            ${o.noRoute ? '<span class="oroute">no route!</span>' : ''}
            <div class="obar"><div style="width:${frac * 100}%;background:${frac < 0.25 ? '#f87171' : p.color}"></div></div>
        </div>`;
    }

    function updateOrders() {
        const list = $('orders-list');
        list.innerHTML = SC.state.orders.length
            ? SC.state.orders.map(orderRow).join('')
            : '<div class="orders-empty">No open orders — they arrive on their own.</div>';
        $('orders-count').textContent = SC.state.orders.length;
    }

    // ── Inspect mode: hover/hold tooltip ────────
    function inspectTooltipHTML(info) {
        if (info.kind === 'factory') {
            const rows = info.inputs.map(inp => `
                <div class="itip-row ${inp.connected ? '' : 'itip-bad'}">
                    <span>${SC.emojiOf(inp.good)} ${SC.nameOf(inp.good)}</span>
                    <span>${inp.connected ? Math.round(inp.dist) + 'u' : 'no route!'}</span>
                </div>`).join('');
            const forSale = info.node.forSale
                ? ` <span class="itip-forsale">(for sale $${SC.CONFIG.FACTORY_SITE_PRICE})</span>` : '';
            return `<div class="itip-title">${SC.emojiOf(info.recipe)} ${info.building}${forSale}</div>
                    <div class="itip-sub">Needs</div>${rows}`;
        }
        if (info.kind === 'supplier') {
            const rows = info.consumers.length ? info.consumers.map(c => `
                <div class="itip-row ${c.connected ? '' : 'itip-bad'}">
                    <span>${SC.emojiOf(c.factory.recipe)} ${SC.GOODS[c.factory.recipe].building}</span>
                    <span>${c.connected ? Math.round(c.dist) + 'u' : 'no route!'}</span>
                </div>`).join('') : '<div class="itip-row itip-bad">No factory needs this yet</div>';
            const n = info.node;
            return `<div class="itip-title">${SC.emojiOf(info.mat)} ${SC.nameOf(info.mat)} supplier${n.level ? ` <span class="itip-forsale">Lv${n.level + 1}</span>` : ''}</div>
                    <div class="itip-row"><span>Stock</span><span>${Math.floor(n.stock)}/${SC.supplierCap(n)}</span></div>
                    <div class="itip-sub">Used by</div>${rows}`;
        }
        const rows = info.orders.length ? info.orders.map(o => {
            const left = o.qty - o.deliveredUnits;
            return `<div class="itip-row ${o.noRoute ? 'itip-bad' : ''}">
                <span>${left}× ${SC.emojiOf(o.product)} ${SC.nameOf(o.product)}</span>
                <span>${o.noRoute ? 'no route!' : 'routed'}</span>
            </div>`;
        }).join('') : '<div class="itip-row">No open orders right now</div>';
        return `<div class="itip-title">${info.node.isHQ ? '⭐ HQ' : '🏢 Customer DC'}</div>
                <div class="itip-sub">Open orders</div>${rows}`;
    }

    function updateInspectTooltip() {
        const el = $('inspect-tooltip');
        const node = SC.state.mode === 'inspect' && SC.input.getInspectNode && SC.input.getInspectNode();
        const info = node && SC.inspect.infoFor(node);
        if (!info) { el.classList.remove('show'); return; }
        el.innerHTML = inspectTooltipHTML(info);
        const p = SC.camera.toScreen(node.x, node.y);
        el.style.left = p.x + 'px';
        el.style.top = (p.y - 34) + 'px';
        el.classList.add('show');
    }

    function setMode(mode) {
        if (SC.state.mode === mode) return;
        SC.state.mode = mode;
        SC.state.selectedNode = null;
        SC.state.placeMode = null; // don't leave manual placement armed while inspecting
        SC.input.reset();
        $('mode-build').classList.toggle('active', mode === 'build');
        $('mode-upgrade').classList.toggle('active', mode === 'upgrade');
        $('mode-inspect').classList.toggle('active', mode === 'inspect');
        SC.sfx.play('click');
        if (mode === 'upgrade') toast('Upgrade mode: tap a supplier or a road', 'info');
    }

    let ordersTimer = 0, lastOrderCount = -1;
    function update(dt) {
        updateHUD();
        updateInspectTooltip();
        ordersTimer += dt;
        if (SC.state.orders.length !== lastOrderCount) {
            lastOrderCount = SC.state.orders.length;
            ordersTimer = 1;
        }
        if (ordersTimer > 0.4) {
            ordersTimer = 0;
            updateOrders();
            updateShop();
            if (menuOpen()) updateMenuInfo(); // keep "last saved Xs ago" ticking
        }
    }

    // Tap an order row: light up the planned route (city↔factory↔suppliers)
    // and pulse the ordering city, without moving or zooming the camera —
    // if the city is off-screen, render.js draws a pointing arrow at the
    // viewport edge instead (same language as the "unconnected site"
    // off-screen arrows). Unplanned orders just pulse the city so
    // "no route!" is locatable. Path-collection logic (walking the sourcing
    // pick tree) lives in inspect.js and is shared with the Inspect-mode
    // hover highlight.
    function focusOrder(order) {
        const paths = [];
        if (order.route) SC.inspect.collectRoutePaths(order.route, order.city, paths);
        SC.state.highlight = {
            paths,
            color: SC.GOODS[order.product].color,
            city: order.city,
            until: SC.state.time + 3
        };
        SC.sfx.play('click');
    }

    // ── Menu (☰): pauses the sim while open ─────────
    function fmtDuration(s) {
        const m = Math.floor(s / 60);
        return m > 0 ? `${m}m ${Math.floor(s % 60)}s` : `${Math.floor(s)}s`;
    }

    function updateMenuInfo() {
        const st = SC.state;
        const research = st.research.active
            ? `${SC.RESEARCH[st.research.active.id].name} (${Math.round(SC.research.progress(st.research.active.id) * 100)}%)`
            : 'None';
        $('menu-stats').innerHTML = `
            <div><span>Difficulty</span><b>${SC.diff().emoji} ${SC.diff().label}</b></div>
            <div><span>Map seed</span><b class="menu-seed" id="menu-seed-value" title="Tap to copy">${st.seed || '—'}</b></div>
            <div><span>Balance</span><b class="${st.money < 0 ? 'neg' : 'pos'}">${st.money < 0 ? '−' : ''}${fmt(Math.abs(st.money))}</b></div>
            <div><span>Credit limit</span><b>${fmt(SC.creditLimit())}</b></div>
            <div><span>Total earned</span><b>${fmt(st.earnedTotal)}</b></div>
            <div><span>Interest paid</span><b>${fmt(st.interestPaid)}</b></div>
            <div><span>Orders filled / missed</span><b>${st.delivered} / ${st.missed}</b></div>
            <div><span>Trucks / yards</span><b>${st.trucks.length} / ${st.nodes.filter(SC.isYard).length}</b></div>
            <div><span>Researching</span><b>${research}</b></div>
            <div><span>Time played</span><b>${fmtDuration(st.time)}</b></div>`;
        const at = SC.save.getLastSavedAt();
        $('menu-save-status').textContent = at
            ? `Autosaves every ${SC.CONFIG.AUTOSAVE_INTERVAL}s · last saved ${fmtDuration((Date.now() - at) / 1000)} ago`
            : `Autosaves every ${SC.CONFIG.AUTOSAVE_INTERVAL}s · not saved yet this session`;
        $('menu-sound').textContent = SC.sfx.isMuted() ? '🔇 Sound: off' : '🔊 Sound: on';
        $('menu-fullscreen').textContent = document.fullscreenElement ? '⛶ Exit full screen' : '⛶ Full screen';
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.();
        }
    }

    function menuOpen() { return !$('menu-overlay').classList.contains('hidden'); }

    function openMenu() {
        SC.state.paused = true;
        SC.state.placeMode = null; // don't leave placement armed while paused
        updateMenuInfo();
        $('menu-overlay').classList.remove('hidden');
    }

    function closeMenu() {
        $('menu-overlay').classList.add('hidden');
        resetNewGameArm();
        SC.state.paused = false;
    }

    let newGameArmed = false;
    function resetNewGameArm() {
        newGameArmed = false;
        $('menu-newgame').textContent = '🗑 New game';
    }

    function bind() {
        $('speed-toggle').addEventListener('click', e => {
            const btn = e.target.closest('[data-speed]');
            if (btn) setSpeed(+btn.dataset.speed);
        });

        $('orders-list').addEventListener('click', e => {
            const row = e.target.closest('[data-order]');
            if (!row) return;
            const order = SC.state.orders.find(o => o.id === +row.dataset.order);
            if (order) focusOrder(order);
        });

        $('mode-build').addEventListener('click', () => setMode('build'));
        $('mode-upgrade').addEventListener('click', () => setMode('upgrade'));
        $('mode-inspect').addEventListener('click', () => setMode('inspect'));

        $('btn-menu').addEventListener('click', () => { SC.sfx.play('click'); openMenu(); });
        $('menu-resume').addEventListener('click', () => { SC.sfx.play('click'); closeMenu(); });
        $('menu-overlay').addEventListener('click', e => {
            if (e.target === $('menu-overlay')) closeMenu(); // tap outside the card
        });
        $('menu-stats').addEventListener('click', e => {
            if (!e.target.closest('#menu-seed-value') || !SC.state.seed) return;
            const shareUrl = `${location.origin}${location.pathname}?seed=${encodeURIComponent(SC.state.seed)}`;
            (navigator.clipboard?.writeText(shareUrl) || Promise.reject())
                .then(() => toast(`Seed link copied: ${SC.state.seed}`, 'good'))
                .catch(() => toast(`Seed: ${SC.state.seed} (copy failed — no clipboard access)`, 'info'));
        });
        $('menu-save').addEventListener('click', () => {
            SC.save.store();
            SC.sfx.play('click');
            updateMenuInfo();
            toast('Game saved', 'good');
        });
        $('menu-sound').addEventListener('click', () => {
            SC.sfx.toggleMute();
            updateMenuInfo();
        });
        $('menu-fullscreen').addEventListener('click', () => {
            SC.sfx.play('click');
            toggleFullscreen();
        });
        document.addEventListener('fullscreenchange', () => {
            if (menuOpen()) updateMenuInfo();
        });
        $('menu-help').addEventListener('click', () => {
            $('menu-overlay').classList.add('hidden'); // stay paused while reading
            resetNewGameArm();
            $('difficulty-section').classList.add('hidden'); // mid-run: mode is locked in
            $('help-overlay').classList.remove('hidden');
        });
        $('menu-newgame').addEventListener('click', () => {
            if (newGameArmed) {
                // Reloading fires pagehide/beforeunload, whose autosave flush
                // (main.js) would otherwise re-persist this still-in-memory
                // state right after clear() and undo the reset. ?new=1
                // routes through the new-game screen (difficulty picker).
                SC.state.gameStarted = false;
                SC.save.clear();
                location.href = location.pathname + '?new=1';
                return;
            }
            newGameArmed = true;
            $('menu-newgame').textContent = '⚠ Tap again — current game will be lost';
            setTimeout(resetNewGameArm, 4000);
        });

        $('btn-truck').addEventListener('click', () => {
            const res = SC.vehicles.buyTruck();
            if (res.ok) { SC.sfx.play('cash'); toast(`New truck stationed at ${yardLabel(SC.state.activeYard)}`, 'good'); }
            else { SC.sfx.play('error'); toast(`Credit limit reached — truck costs ${fmt(res.cost)}`, 'error'); }
            updateShop();
        });
        $('yard-select').addEventListener('change', e => {
            const node = SC.state.nodes.find(n => n.id === +e.target.value);
            if (node) SC.state.activeYard = node;
        });
        $('btn-moveTruck').addEventListener('click', () => {
            const res = SC.vehicles.reassignTruck(SC.state.activeYard);
            if (res.ok) { SC.sfx.play('click'); toast(`Truck rebased to ${yardLabel(SC.state.activeYard)}`, 'good'); }
            else { SC.sfx.play('error'); toast('No idle truck available at another yard', 'error'); }
            updateShop();
        });
        $('btn-yard').addEventListener('click', () => {
            const st = SC.state;
            if (st.placeMode && st.placeMode.kind === 'yard') {
                st.placeMode = null; // tapping again cancels
            } else {
                st.selectedNode = null; // don't fight the road-building ghost
                st.placeMode = { kind: 'yard', good: null };
                SC.emit('toast', { text: `Tap the map to place a truck yard — ${fmt(SC.yardPrice())}`, kind: 'info' });
            }
            SC.sfx.play('click');
            updateShop();
        });
        for (const key of Object.keys(SC.CONFIG.UPGRADES)) {
            $('btn-' + key).addEventListener('click', () => {
                const res = SC.economy.buyUpgrade(key);
                if (res.ok) { SC.sfx.play('cash'); toast(`${SC.CONFIG.UPGRADES[key].label} upgraded!`, 'good'); }
                else if (res.reason === 'money') { SC.sfx.play('error'); toast('Credit limit reached', 'error'); }
                updateShop();
            });
        }

        $('btn-promo').addEventListener('click', () => {
            const res = SC.economy.startPromotion();
            if (res.ok) { SC.sfx.play('cash'); toast(`📣 Promotion running — ${SC.CONFIG.PROMO_DURATION}s of extra orders!`, 'good'); }
            else if (res.reason === 'money') { SC.sfx.play('error'); toast(`Credit limit reached — promotion costs ${fmt(res.cost)}`, 'error'); }
            updateShop();
        });
        $('btn-research-tree').addEventListener('click', () => { SC.sfx.play('click'); openResearchTree(); });
        $('research-tree-close').addEventListener('click', () => { SC.sfx.play('click'); closeResearchTree(); });
        $('research-overlay').addEventListener('click', e => {
            if (e.target === $('research-overlay')) closeResearchTree(); // tap outside the card
        });
        $('research-tree-nodes').addEventListener('click', e => {
            const btn = e.target.closest('[data-research]');
            if (!btn || btn.disabled) return;
            const res = SC.research.start(btn.dataset.research);
            if (res.ok) { SC.sfx.play('click'); toast(`Researching ${SC.RESEARCH[btn.dataset.research].name}…`, 'info'); }
            updateShop();
        });

        $('build-list').addEventListener('click', e => {
            const btn = e.target.closest('[data-kind]');
            if (!btn) return;
            const { kind, good } = btn.dataset;
            const st = SC.state;
            if (st.placeMode && st.placeMode.kind === kind && st.placeMode.good === good) {
                st.placeMode = null; // tapping the active button cancels
            } else {
                st.selectedNode = null; // don't fight the road-building ghost
                st.placeMode = { kind, good };
                SC.emit('toast', { text: `Tap the map to place — ${fmt(SC.placement.price(kind))}`, kind: 'info' });
            }
            SC.sfx.play('click');
            updateShop();
        });
        $('orders-header').addEventListener('click', () =>
            $('orders-panel').classList.toggle('collapsed'));
        $('shop-header').addEventListener('click', () =>
            $('shop-panel').classList.toggle('collapsed'));

        $('gameover-restart').addEventListener('click', () => {
            SC.save.clear();
            location.href = location.pathname + '?new=1'; // fresh run, difficulty picker shown
        });

        $('help-start').addEventListener('click', () => {
            $('help-overlay').classList.add('hidden');
            localStorage.setItem('scTycoonHelpSeen', 'true');
            SC.state.gameStarted = true;
            SC.state.paused = false; // in case help was opened via the menu
        });

        // Game event feedback
        SC.on('toast', d => toast(d.text, d.kind));
        SC.on('orderComplete', o => { SC.sfx.play('cash'); toast(`Order filled: +${fmt(o.payout)}`, 'good'); });
        SC.on('orderExpired', () => { SC.sfx.play('expire'); toast('An order expired — customer walked away', 'error'); });
        SC.on('crafted', () => SC.sfx.play('craft'));
        SC.on('salvage', () => toast(`Late delivery salvaged for ${fmt(SC.CONFIG.SALVAGE_PAY)}`, 'info'));
        SC.on('unlock', n => {
            SC.sfx.play('unlock');
            const what = n.kind === 'city' ? 'A new customer DC 🏢 is now placing orders'
                       : n.kind === 'supplier' ? `A ${SC.nameOf(n.mat).toLowerCase()} ${SC.emojiOf(n.mat)} supplier appeared`
                       : `A ${SC.GOODS[n.recipe].building.toLowerCase()} ${SC.emojiOf(n.recipe)} site is up for sale`;
            toast(`📍 ${what}!`, 'good');
        });
        SC.on('researchComplete', id => {
            SC.sfx.play('unlock');
            toast(`🔬 Research complete: ${SC.RESEARCH[id].name}!`, 'good');
        });
        SC.on('debtWarning', d => {
            SC.sfx.play('error');
            toast(`🏦 Debt past your credit limit — recover within ${Math.round(d.grace)}s or the bank forecloses!`, 'error');
        });
        SC.on('debtRecovered', () => toast('Debt back within the credit limit — default averted', 'good'));
        SC.on('gameOver', d => {
            SC.sfx.play('expire');
            SC.save.clear(); // a defaulted company doesn't get resurrected on reload
            const st = SC.state;
            $('gameover-stats').innerHTML = `
                <div><span>Final debt</span><b class="neg">−${fmt(Math.abs(d.debt))}</b></div>
                <div><span>Total earned</span><b>${fmt(st.earnedTotal)}</b></div>
                <div><span>Interest paid</span><b>${fmt(st.interestPaid)}</b></div>
                <div><span>Orders filled / missed</span><b>${st.delivered} / ${st.missed}</b></div>
                <div><span>Time survived</span><b>${fmtDuration(st.time)}</b></div>`;
            $('gameover-overlay').classList.remove('hidden');
        });
    }

    // ── Difficulty picker (new-game screen only) ─────
    function updateDifficultyPicker() {
        const d = SC.state.difficulty;
        $('difficulty-picker').innerHTML = SC.DIFFICULTY_ORDER.map(k => {
            const p = SC.DIFFICULTIES[k];
            return `<button class="diff-btn ${k === d ? 'active' : ''}" data-diff="${k}">
                <span class="diff-name">${p.emoji} ${p.label}</span>
                <span class="diff-desc">${p.desc}</span>
            </button>`;
        }).join('');
    }

    function bindDifficultyPicker() {
        $('difficulty-picker').addEventListener('click', e => {
            const btn = e.target.closest('[data-diff]');
            if (!btn || SC.state.gameStarted) return;
            const k = btn.dataset.diff;
            localStorage.setItem('scTycoonDifficulty', k); // future new games default here
            // The world is still untouched pre-start, so the preset can
            // apply in place: swap the mode and its starting money.
            SC.state.difficulty = k;
            SC.state.money = SC.DIFFICULTIES[k].startMoney;
            SC.sfx.play('click');
            updateDifficultyPicker();
            updateHUD();
        });
    }

    function init() {
        bind();
        bindDifficultyPicker();
        $('menu-version').textContent = 'v' + SC.VERSION;
        updateOrders();
        updateShop();
        updateHUD();
        const params = new URLSearchParams(location.search);
        // ?new=1 (menu "New game" / post-foreclosure restart) always routes
        // through the new-game screen so the difficulty can be picked.
        const forceNewScreen = params.has('new') && !params.has('nohelp') && !params.has('probe');
        if (!forceNewScreen &&
            (SC.state.gameStarted || // restored from autosave in main.js
             localStorage.getItem('scTycoonHelpSeen') === 'true' ||
             params.has('nohelp') || params.has('probe'))) {
            $('help-overlay').classList.add('hidden');
            SC.state.gameStarted = true;
        }
        // The picker only makes sense before a world has been played on —
        // opening Help mid-game (via the menu) hides it.
        $('difficulty-section').classList.toggle('hidden', SC.state.gameStarted);
        updateDifficultyPicker();
        if (window.innerWidth <= 768) {
            $('orders-panel').classList.add('collapsed');
            $('shop-panel').classList.add('collapsed');
        }
        // Headless verification hook (see CLAUDE.md): open the menu on load
        if (new URLSearchParams(location.search).has('menu')) openMenu();
        // ...and/or the research tree overlay
        if (new URLSearchParams(location.search).has('techtree')) openResearchTree();
    }

    return { init, update, toast };
})();
