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
        $('hud-money').textContent = fmt(st.money);
        const idle = st.trucks.filter(t => !t.job && !t.path).length;
        $('hud-trucks').textContent = `${idle}/${st.trucks.length}`;
        $('hud-delivered').textContent = st.delivered;
        $('hud-missed').textContent = st.missed;
    }

    function updateShop() {
        const st = SC.state;
        const tb = $('btn-truck');
        tb.querySelector('.price').textContent = fmt(SC.truckPrice());
        tb.disabled = st.money < SC.truckPrice();

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
                btn.disabled = st.money < price;
            }
        }
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

    function restart() {
        SC.save.clear();
        location.reload();
    }

    let restartArmed = false;
    function bind() {
        $('orders-list').addEventListener('click', e => {
            const row = e.target.closest('[data-order]');
            if (!row) return;
            const order = SC.state.orders.find(o => o.id === +row.dataset.order);
            if (order) focusOrder(order);
        });

        $('btn-restart').addEventListener('click', () => {
            if (restartArmed) { restart(); return; }
            restartArmed = true;
            toast('Tap ↺ again to abandon this game and start over', 'error');
            setTimeout(() => { restartArmed = false; }, 3000);
        });

        $('btn-truck').addEventListener('click', () => {
            const res = SC.vehicles.buyTruck();
            if (res.ok) { SC.sfx.play('cash'); toast('New truck delivered to HQ', 'good'); }
            else { SC.sfx.play('error'); toast(`Not enough money — truck costs ${fmt(res.cost)}`, 'error'); }
            updateShop();
        });
        for (const key of Object.keys(SC.CONFIG.UPGRADES)) {
            $('btn-' + key).addEventListener('click', () => {
                const res = SC.economy.buyUpgrade(key);
                if (res.ok) { SC.sfx.play('cash'); toast(`${SC.CONFIG.UPGRADES[key].label} upgraded!`, 'good'); }
                else if (res.reason === 'money') { SC.sfx.play('error'); toast('Not enough money', 'error'); }
                updateShop();
            });
        }
        $('btn-mute').addEventListener('click', () => {
            $('btn-mute').textContent = SC.sfx.toggleMute() ? '🔇' : '🔊';
        });
        $('btn-mute').textContent = SC.sfx.isMuted() ? '🔇' : '🔊';

        $('orders-header').addEventListener('click', () =>
            $('orders-panel').classList.toggle('collapsed'));
        $('shop-header').addEventListener('click', () =>
            $('shop-panel').classList.toggle('collapsed'));

        $('help-start').addEventListener('click', () => {
            $('help-overlay').classList.add('hidden');
            localStorage.setItem('scTycoonHelpSeen', 'true');
            SC.state.gameStarted = true;
        });
        $('btn-help').addEventListener('click', () =>
            $('help-overlay').classList.remove('hidden'));

        // Game event feedback
        SC.on('toast', d => toast(d.text, d.kind));
        SC.on('orderComplete', o => { SC.sfx.play('cash'); toast(`Order filled: +${fmt(o.payout)}`, 'good'); });
        SC.on('orderExpired', () => { SC.sfx.play('expire'); toast('An order expired — customer walked away', 'error'); });
        SC.on('crafted', () => SC.sfx.play('craft'));
        SC.on('salvage', () => toast(`Late delivery salvaged for ${fmt(SC.CONFIG.SALVAGE_PAY)}`, 'info'));
        SC.on('unlock', n => {
            SC.sfx.play('unlock');
            const what = n.kind === 'city' ? 'A new city appeared'
                       : n.kind === 'supplier' ? `A ${SC.nameOf(n.mat).toLowerCase()} ${SC.emojiOf(n.mat)} supplier appeared`
                       : `A ${SC.GOODS[n.recipe].building.toLowerCase()} ${SC.emojiOf(n.recipe)} site is up for sale`;
            toast(`📍 ${what}!`, 'good');
        });
    }

    function init() {
        bind();
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
    }

    return { init, update, toast };
})();
