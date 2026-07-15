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
        $('hud-money-label').textContent = inDebt
            ? `Debt (${Math.round(SC.CONFIG.DEBT_INTEREST_PER_MIN * 100)}%/min)` : 'Money';
        $('hud-money-item').classList.toggle('debt', inDebt);
        const idle = st.trucks.filter(t => !t.jobs.length && !t.path).length;
        $('hud-trucks').textContent = `${idle}/${st.trucks.length}`;
        $('hud-delivered').textContent = st.delivered;
        $('hud-missed').textContent = st.missed;
    }

    function updateShop() {
        const st = SC.state;
        const tb = $('btn-truck');
        tb.querySelector('.price').textContent = fmt(SC.truckPrice());
        tb.disabled = !SC.canAfford(SC.truckPrice());

        for (const key of Object.keys(SC.CONFIG.UPGRADES)) {
            const btn = $('btn-' + key);
            const price = SC.upgradePrice(key);
            const lvl = st.upgrades[key];
            btn.querySelector('.lvl').textContent = '●'.repeat(lvl) + '○'.repeat(SC.CONFIG.UPGRADES[key].max - lvl);
            if (price === null) {
                btn.querySelector('.price').textContent = 'MAX';
                btn.disabled = true;
            } else {
                btn.querySelector('.price').textContent = fmt(price);
                btn.disabled = !SC.canAfford(price);
            }
        }
        updateResearch();
        updateBuild();
    }

    // ── Research & Build (Shop panel sections) ──────
    function researchRow(id) {
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
            const reqNames = t.requires.map(r => SC.RESEARCH[r].name).join(', ');
            btn = `<div class="research-btn" disabled style="cursor:default">🔒 Requires ${reqNames}</div>`;
        } else {
            btn = `<button class="research-btn" data-research="${id}" ${SC.state.research.active || !SC.canAfford(t.cost) ? 'disabled' : ''}>Research — ${fmt(t.cost)} · ${t.time}s</button>`;
        }
        return `<div class="research-row ${done ? 'done' : ''} ${locked ? 'locked' : ''}">
            <div class="research-top"><span class="research-name">${t.emoji} ${t.name}</span></div>
            <div class="research-desc">${t.desc}</div>
            ${btn}
        </div>`;
    }

    function updateResearch() {
        $('research-list').innerHTML = SC.RESEARCH_ORDER.map(researchRow).join('');
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

    let ordersTimer = 0, lastOrderCount = -1;
    function update(dt) {
        updateHUD();
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

    // Tap an order row: fly the camera to its city and light up the
    // planned route (city↔factory↔suppliers). Unplanned orders just pulse
    // the city so "no route!" is locatable.
    // Walk the planned sourcing tree (suppliers -> smelter -> factory -> city)
    // collecting every road leg for the highlight overlay.
    function collectRoutePaths(pick, dest, paths) {
        const leg = SC.roads.findPath(pick.node, dest);
        if (leg) paths.push(leg.path);
        if (pick.srcs) {
            for (const m of Object.keys(pick.srcs)) {
                collectRoutePaths(pick.srcs[m], pick.node, paths);
            }
        }
    }

    function focusOrder(order) {
        const zoom = Math.max(SC.camera.cam.zoom, 0.85);
        SC.camera.focus(order.city.x, order.city.y, zoom);
        const paths = [];
        if (order.route) collectRoutePaths(order.route, order.city, paths);
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
            <div><span>Balance</span><b class="${st.money < 0 ? 'neg' : 'pos'}">${st.money < 0 ? '−' : ''}${fmt(Math.abs(st.money))}</b></div>
            <div><span>Credit limit</span><b>${fmt(SC.creditLimit())}</b></div>
            <div><span>Total earned</span><b>${fmt(st.earnedTotal)}</b></div>
            <div><span>Interest paid</span><b>${fmt(st.interestPaid)}</b></div>
            <div><span>Orders filled / missed</span><b>${st.delivered} / ${st.missed}</b></div>
            <div><span>Trucks</span><b>${st.trucks.length}</b></div>
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
        $('orders-list').addEventListener('click', e => {
            const row = e.target.closest('[data-order]');
            if (!row) return;
            const order = SC.state.orders.find(o => o.id === +row.dataset.order);
            if (order) focusOrder(order);
        });

        $('btn-menu').addEventListener('click', () => { SC.sfx.play('click'); openMenu(); });
        $('menu-resume').addEventListener('click', () => { SC.sfx.play('click'); closeMenu(); });
        $('menu-overlay').addEventListener('click', e => {
            if (e.target === $('menu-overlay')) closeMenu(); // tap outside the card
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
            $('help-overlay').classList.remove('hidden');
        });
        $('menu-newgame').addEventListener('click', () => {
            if (newGameArmed) {
                SC.save.clear();
                location.reload();
                return;
            }
            newGameArmed = true;
            $('menu-newgame').textContent = '⚠ Tap again — current game will be lost';
            setTimeout(resetNewGameArm, 4000);
        });

        $('btn-truck').addEventListener('click', () => {
            const res = SC.vehicles.buyTruck();
            if (res.ok) { SC.sfx.play('cash'); toast('New truck delivered to HQ', 'good'); }
            else { SC.sfx.play('error'); toast(`Credit limit reached — truck costs ${fmt(res.cost)}`, 'error'); }
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

        $('research-list').addEventListener('click', e => {
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
    }

    function init() {
        bind();
        $('menu-version').textContent = 'v' + SC.VERSION;
        updateOrders();
        updateShop();
        updateHUD();
        if (SC.state.gameStarted || // restored from autosave in main.js
            localStorage.getItem('scTycoonHelpSeen') === 'true' ||
            new URLSearchParams(location.search).has('nohelp') ||
            new URLSearchParams(location.search).has('probe')) {
            $('help-overlay').classList.add('hidden');
            SC.state.gameStarted = true;
        }
        if (window.innerWidth <= 768) {
            $('orders-panel').classList.add('collapsed');
            $('shop-panel').classList.add('collapsed');
        }
        // Headless verification hook (see CLAUDE.md): open the menu on load
        if (new URLSearchParams(location.search).has('menu')) openMenu();
    }

    return { init, update, toast };
})();
