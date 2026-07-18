// HUD, panels, toasts, help overlay. DOM layer only.
window.SC = window.SC || {};

SC.ui = (function() {
    const $ = id => document.getElementById(id);
    let toastTimer = null;
    let fpsSmoothed = 60; // dev-panel FPS readout, see update(dt)
    // Dev tools panel: persisted like Sound (SC.sfx's scTycoonMuted flag)
    // so it's a lasting ☰-menu choice, not something to retype ?dev=1 for
    // every visit. The query param still works too (e.g. a fresh browser).
    let devMode = localStorage.getItem('scTycoonDevMode') === 'true';

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
        updateDevPanel();
    }

    // ── Dev-only tools (☰ menu or ?dev=1): quick tuning/testing aids, not
    // part of normal gameplay. Congestion is otherwise fixed by difficulty
    // for the whole run — this lets the developer flip it live to compare;
    // the rest are one-off actions for testing without grinding. ──
    function setDevMode(on) {
        devMode = on;
        localStorage.setItem('scTycoonDevMode', String(devMode));
        $('dev-panel').classList.toggle('hidden', !devMode);
        if (devMode) updateDevPanel();
    }

    function updateDevPanel() {
        $('dev-fps').textContent = Math.round(fpsSmoothed);
        const btn = $('dev-congestion');
        btn.classList.toggle('active', SC.state.congestionEnabled);
        $('dev-congestion-state').textContent = SC.state.congestionEnabled ? 'On' : 'Off';
        $('dev-research').disabled = !SC.state.research.active;
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
        updateJunctionBtn();

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

    // ── Junctions: a plain routing waypoint (roads fork/merge/reroute
    // through a point that isn't a supplier/factory/city), unlocked by the
    // cheap, early 'junctions' research — button hidden until then. ──
    function updateJunctionBtn() {
        const st = SC.state;
        const btn = $('btn-junction');
        // Gated behind the (cheap, early) 'junctions' research — hidden until
        // unlocked, same as the promo button waits on Marketing Blitz.
        btn.classList.toggle('hidden', !SC.placement.isUnlocked('junction'));
        if (btn.classList.contains('hidden')) return;
        const price = SC.CONFIG.PLACEMENT_JUNCTION_PRICE;
        const active = st.placeMode && st.placeMode.kind === 'junction';
        btn.classList.toggle('active', !!active);
        btn.querySelector('.price').textContent = active ? 'Tap map…' : fmt(price);
        btn.disabled = !active && !SC.canAfford(price);
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

    const RT_COL_W = 200, RT_ROW_H = 180, RT_NODE_W = 180, RT_NODE_H = 130, RT_PAD = 20;

    function researchTreeOpen() { return !$('research-overlay').classList.contains('hidden'); }

    function updateResearchTree() {
        if (!researchTreeOpen()) return;
        const byTier = researchTiers();
        const tierKeys = Object.keys(byTier).map(Number).sort((a, b) => a - b);
        const positions = {};
        let maxCols = 1;
        tierKeys.forEach(tier => {
            maxCols = Math.max(maxCols, byTier[tier].length);
        });

        const width = RT_PAD * 2 + maxCols * RT_COL_W;
        const height = RT_PAD * 2 + tierKeys.length * RT_ROW_H;

        tierKeys.forEach(tier => {
            const nodes = byTier[tier];
            const tierWidth = nodes.length * RT_COL_W;
            const startX = RT_PAD + (maxCols * RT_COL_W - tierWidth) / 2;
            nodes.forEach((id, col) => {
                positions[id] = { 
                    x: startX + col * RT_COL_W + (RT_COL_W - RT_NODE_W) / 2, 
                    y: RT_PAD + tier * RT_ROW_H, 
                    w: RT_NODE_W 
                };
            });
        });

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
                const x1 = from.x + from.w / 2, y1 = from.y + RT_NODE_H;
                const x2 = to.x + to.w / 2, y2 = to.y;
                const midY = (y1 + y2) / 2;
                edges += `<path d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}"
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

    function drawRecipeGraph() {
        const container = $('recipe-graph');
        if (!container) return;

        const nodePositions = {
            // Column 0: Raw Materials
            wheat:   { x: 15,  y: 15,  w: 130 },
            water:   { x: 15,  y: 65,  w: 130 },
            wool:    { x: 15,  y: 115, w: 130 },
            rubber:  { x: 15,  y: 165, w: 130 },
            copper:  { x: 15,  y: 215, w: 130 },
            ore:     { x: 15,  y: 265, w: 130 },
            coal:    { x: 15,  y: 315, w: 130 },
            chips:   { x: 15,  y: 365, w: 130 },

            // Column 1: Tier 1 Crafting
            bread:   { x: 200, y: 40,  w: 130 },
            shoes:   { x: 200, y: 140, w: 130 },
            wire:    { x: 200, y: 190, w: 130 },
            steel:   { x: 200, y: 290, w: 130 },

            // Column 2: Tier 2 Crafting
            circuit: { x: 385, y: 215, w: 130 },
            car:     { x: 385, y: 340, w: 130 },

            // Column 3: Tier 3 Crafting
            robot:   { x: 570, y: 275, w: 130 }
        };

        const NODE_H = 32;
        const nodesEl = $('recipe-graph-nodes');
        const svg = $('recipe-graph-edges');
        if (!nodesEl || !svg) return;

        let nodesHTML = '';
        for (const [id, pos] of Object.entries(nodePositions)) {
            const g = SC.GOODS[id];
            if (!g) continue;
            const color = g.color || '#94a3b8';
            nodesHTML += `<div class="rg-node" style="left:${pos.x}px;top:${pos.y}px;width:${pos.w}px;height:${NODE_H}px;border-color:${color};--glow-color:${color}44">
                <span class="rg-node-content">${g.emoji} ${g.name}</span>
            </div>`;
        }
        nodesEl.innerHTML = nodesHTML;

        svg.setAttribute('width', 715);
        svg.setAttribute('height', 415);
        let edges = '';
        for (const [id, pos] of Object.entries(nodePositions)) {
            const g = SC.GOODS[id];
            if (!g || g.raw || !g.inputs) continue;

            const to = pos;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;

            for (const input of g.inputs) {
                const from = nodePositions[input];
                if (!from) continue;

                const x1 = from.x + from.w;
                const y1 = from.y + NODE_H / 2;
                const midX = (x1 + x2) / 2;
                const color = SC.GOODS[input].color || '#94a3b8';

                edges += `<path d="M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}"
                    class="rg-edge" style="stroke:${color}" />`;
            }
        }
        svg.innerHTML = edges;
    }

    // ── Stats & Achievements: a read-only summary opened from the ☰
    // menu — deliveries by product, a money-over-time sparkline, the
    // busiest road by trip count, and milestone badges. ──
    function updateStatsOverlay() {
        const st = SC.state;

        const entries = Object.keys(st.deliveredByProduct)
            .filter(k => st.deliveredByProduct[k] > 0)
            .sort((a, b) => st.deliveredByProduct[b] - st.deliveredByProduct[a]);
        $('stats-deliveries').innerHTML = entries.length
            ? entries.map(k => `<div class="stats-row"><span>${SC.emojiOf(k)} ${SC.nameOf(k)}</span><b>${st.deliveredByProduct[k]}</b></div>`).join('')
            : '<div class="stats-empty">No deliveries yet</div>';

        const hist = st.moneyHistory;
        const svg = $('stats-sparkline');
        if (hist.length < 2) {
            svg.innerHTML = '<text x="100" y="28" text-anchor="middle" fill="rgba(148,163,184,0.7)" font-size="8">Still gathering data…</text>';
        } else {
            const min = Math.min(...hist, 0), max = Math.max(...hist, 1);
            const range = max - min || 1;
            const pts = hist.map((v, i) => {
                const x = (i / (hist.length - 1)) * 198 + 1;
                const y = 48 - ((v - min) / range) * 46;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
            const lineColor = hist[hist.length - 1] >= hist[0] ? '#34d399' : '#f87171';
            svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="${lineColor}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />`;
        }

        const busiest = SC.stats.busiestRoad();
        $('stats-busiest').innerHTML = busiest
            ? `<div class="stats-row"><span>🚚 ${Math.round(busiest.len)}u road</span><b>${busiest.trips} trip${busiest.trips === 1 ? '' : 's'}</b></div>`
            : '<div class="stats-empty">No traffic recorded yet</div>';

        $('stats-ach-count').textContent =
            `${SC.ACHIEVEMENT_ORDER.filter(id => st.achievements[id]).length}/${SC.ACHIEVEMENT_ORDER.length}`;
        $('stats-achievements').innerHTML = SC.ACHIEVEMENT_ORDER.map(id => {
            const a = SC.ACHIEVEMENTS[id];
            const done = !!st.achievements[id];
            return `<div class="stats-ach ${done ? 'unlocked' : 'locked'}" title="${a.desc}">
                <span class="ach-emoji">${a.emoji}</span>${a.name}
            </div>`;
        }).join('');
    }

    function openStatsOverlay() {
        $('stats-overlay').classList.remove('hidden');
        updateStatsOverlay();
    }

    function closeStatsOverlay() {
        $('stats-overlay').classList.add('hidden');
        SC.state.paused = false; // in case it was opened via the menu
    }

    // ── River-crossing choice: input.js emits this instead of building
    // immediately whenever a tapped road would cross the river, so the
    // bridge-vs-ferry pick happens in context rather than a pre-set toggle ──
    let pendingCrossing = null;
    function openCrossingChoice(d) {
        pendingCrossing = d;
        const bridgeQuote = SC.roads.quote(d.a, d.b);
        const ferryQuote = SC.roads.quote(d.a, d.b, { ferry: true });
        if (!bridgeQuote || !ferryQuote) { pendingCrossing = null; return; }
        $('crossing-bridge-cost').textContent = fmt(bridgeQuote.cost);
        $('crossing-ferry-cost').textContent = fmt(ferryQuote.cost);
        $('crossing-overlay').classList.remove('hidden');
    }

    function closeCrossingChoice() {
        pendingCrossing = null;
        $('crossing-overlay').classList.add('hidden');
    }

    function chooseCrossing(ferry) {
        if (!pendingCrossing) return;
        const { a, b } = pendingCrossing;
        const res = SC.roads.build(a, b, { ferry });
        if (res.ok) {
            SC.sfx.play('build');
            SC.state.selectedNode = b; // chain roads mini-metro style
        } else if (res.reason === 'money') {
            SC.sfx.play('error');
            toast(`Credit limit reached — road costs $${res.cost} (limit −$${SC.CONFIG.CREDIT_LIMIT})`, 'error');
        }
        closeCrossingChoice();
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
        return `<div class="order ${frac < 0.25 ? 'urgent' : ''} ${o.contract ? 'contract' : ''}" data-order="${o.id}">
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

    // ── Contract offer: Accept/Decline card, non-blocking ──
    function updateContractOffer() {
        const offer = SC.state.contractOffer;
        const card = $('contract-offer');
        card.classList.toggle('hidden', !offer);
        if (!offer) return;
        const g = SC.GOODS[offer.product];
        const dest = offer.city.isHQ ? 'HQ' : 'a customer DC';
        const penalty = Math.round(offer.payout * SC.CONFIG.CONTRACT_PENALTY_MULT);
        $('contract-terms').innerHTML = `
            <div class="contract-title">${g.emoji} ${offer.qty}× ${g.name} for ${dest}</div>
            <div class="contract-detail">Deadline: ${fmtDuration(offer.deadline)} · Payout: <b>${fmt(offer.payout)}</b></div>
            <div class="contract-penalty">⚠ Miss it and pay up to ${fmt(penalty)} in penalties</div>`;
        $('contract-timer').style.width = `${Math.max(0, offer.timeLeft / SC.CONFIG.CONTRACT_OFFER_EXPIRE) * 100}%`;
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
        if (info.kind === 'junction') {
            return `<div class="itip-title">🔀 Junction</div>
                    <div class="itip-row">Routing only — no supply or demand</div>`;
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
        const p = SC.render.nodeIconAnchor(node);
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
        if (dt > 0) fpsSmoothed += (1 / dt - fpsSmoothed) * 0.1;
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
            updateContractOffer(); // keeps the offer's countdown bar ticking
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
        if (order.route) SC.inspect.collectRoutePaths(order.route, order.city, paths, order.product);
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
        $('menu-dev').textContent = devMode ? '🛠 Dev tools: on' : '🛠 Dev tools: off';
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

        $('contract-accept').addEventListener('click', () => {
            const res = SC.economy.acceptContract();
            if (res.ok) {
                SC.sfx.play('cash');
                toast(`📜 Contract accepted: ${res.order.qty}× ${SC.nameOf(res.order.product)}`, 'good');
            }
            updateContractOffer();
            updateOrders();
        });
        $('contract-decline').addEventListener('click', () => {
            SC.economy.declineContract();
            SC.sfx.play('click');
            updateContractOffer();
        });

        $('crossing-bridge').addEventListener('click', () => chooseCrossing(false));
        $('crossing-ferry').addEventListener('click', () => chooseCrossing(true));
        $('crossing-cancel').addEventListener('click', () => { SC.sfx.play('click'); closeCrossingChoice(); });

        $('dev-header').addEventListener('click', () =>
            $('dev-panel').classList.toggle('collapsed'));
        $('dev-congestion').addEventListener('click', () => {
            SC.state.congestionEnabled = !SC.state.congestionEnabled;
            SC.sfx.play('click');
            updateDevPanel();
        });
        $('dev-money').addEventListener('click', () => {
            SC.state.money += 10000;
            SC.sfx.play('cash');
            toast('💰 +$10,000 (dev)', 'good');
            updateShop();
        });
        $('dev-contract').addEventListener('click', () => {
            const offer = SC.economy.rollContractOffer();
            SC.sfx.play('click');
            if (!offer) toast('Contract already offered/active (dev)', 'info');
        });
        $('dev-research').addEventListener('click', () => {
            const a = SC.state.research.active;
            if (!a) { toast('No active research (dev)', 'info'); return; }
            a.t = SC.RESEARCH[a.id].time;
            SC.research.tick(0);
            SC.sfx.play('unlock');
            updateShop();
            updateDevPanel();
        });
        $('dev-customer').addEventListener('click', () => {
            SC.state.nextCustomerIn = 0;
            SC.economy.tick(0);
            SC.sfx.play('click');
        });

        $('mode-build').addEventListener('click', () => setMode('build'));
        $('mode-upgrade').addEventListener('click', () => setMode('upgrade'));
        $('mode-inspect').addEventListener('click', () => setMode('inspect'));

        // Whole bar opens the menu, not just the ☰ icon — money/trucks are
        // read-only display, so there's no reason tapping them should miss.
        $('top-left').addEventListener('click', () => { SC.sfx.play('click'); openMenu(); });
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
        $('menu-dev').addEventListener('click', () => {
            setDevMode(!devMode);
            SC.sfx.play('click');
            updateMenuInfo();
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
        $('menu-stats').addEventListener('click', () => {
            $('menu-overlay').classList.add('hidden'); // stay paused while reading
            SC.sfx.play('click');
            openStatsOverlay();
        });
        $('stats-close').addEventListener('click', () => { SC.sfx.play('click'); closeStatsOverlay(); });
        $('stats-overlay').addEventListener('click', e => {
            if (e.target === $('stats-overlay')) closeStatsOverlay(); // tap outside the card
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
        $('btn-junction').addEventListener('click', () => {
            const st = SC.state;
            if (st.placeMode && st.placeMode.kind === 'junction') {
                st.placeMode = null; // tapping again cancels
            } else {
                st.selectedNode = null; // don't fight the road-building ghost
                st.placeMode = { kind: 'junction', good: null };
                SC.emit('toast', { text: `Tap the map to place a junction — ${fmt(SC.CONFIG.PLACEMENT_JUNCTION_PRICE)}`, kind: 'info' });
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
            const fresh = !SC.state.gameStarted; // help opened mid-game shouldn't re-hint
            SC.state.gameStarted = true;
            SC.state.paused = false; // in case help was opened via the menu
            // One-time riverside-grace hint at the very start of a run.
            const graceLeft = SC.map.riverGraceRemaining();
            if (fresh && graceLeft > 0) {
                toast(`🌊 New sites stay on your side of the river for the first ${Math.round(graceLeft / 60)} min`, 'info');
            }
        });

        // Game event feedback
        SC.on('toast', d => toast(d.text, d.kind));
        SC.on('orderComplete', o => {
            SC.sfx.play('cash');
            toast(o.contract ? `📜 Contract fulfilled! +${fmt(o.payout)}` : `Order filled: +${fmt(o.payout)}`, 'good');
        });
        SC.on('orderExpired', () => { SC.sfx.play('expire'); toast('An order expired — customer walked away', 'error'); });
        SC.on('contractOffered', () => { SC.sfx.play('unlock'); toast('📜 New contract offer available!', 'info'); });
        SC.on('crossingChoice', openCrossingChoice);
        SC.on('contractFailed', d => { SC.sfx.play('expire'); toast(`📜 Contract failed — penalty ${fmt(d.penalty)}`, 'error'); });
        SC.on('crafted', () => SC.sfx.play('craft'));
        SC.on('salvage', () => toast(`Late delivery salvaged for ${fmt(SC.CONFIG.SALVAGE_PAY)}`, 'info'));
        SC.on('unlock', n => {
            SC.sfx.play('unlock');
            const what = n.kind === 'city' ? 'A new customer DC 🏢 is now placing orders'
                       : n.kind === 'supplier' ? `A ${SC.nameOf(n.mat).toLowerCase()} ${SC.emojiOf(n.mat)} supplier appeared`
                       : `A ${SC.GOODS[n.recipe].building.toLowerCase()} ${SC.emojiOf(n.recipe)} site is up for sale`;
            // Flag crossings so the player knows a bridge/ferry is coming.
            const across = SC.map.sideOf(n.x, n.y) !== SC.map.startSide();
            toast(`📍 ${what}${across ? ' — across the river 🌉' : ''}!`, 'good');
        });
        SC.on('researchComplete', id => {
            SC.sfx.play('unlock');
            toast(`🔬 Research complete: ${SC.RESEARCH[id].name}!`, 'good');
        });
        SC.on('achievementUnlocked', id => {
            const a = SC.ACHIEVEMENTS[id];
            SC.sfx.play('unlock');
            toast(`${a.emoji} Achievement unlocked: ${a.name}!`, 'good');
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
            const g = p.riverGraceMin || 0;
            const grace = g > 0
                ? `🌊 Riverside grace: <b>${g} min</b> — new sites stay your side of the river`
                : `🌊 <b>No riverside grace</b> — sites can land across the river from the start`;
            return `<button class="diff-btn ${k === d ? 'active' : ''}" data-diff="${k}">
                <span class="diff-name">${p.emoji} ${p.label}</span>
                <span class="diff-desc">${p.desc}</span>
                <span class="diff-grace">${grace}</span>
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
        drawRecipeGraph();
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
            $('dev-panel').classList.add('collapsed');
        }
        // Headless verification hook (see CLAUDE.md): open the menu on load
        if (new URLSearchParams(location.search).has('menu')) openMenu();
        // ...and/or the research tree overlay
        if (new URLSearchParams(location.search).has('techtree')) openResearchTree();
        // Dev-only tools panel: a lasting ☰-menu toggle (see setDevMode),
        // or ?dev=1 to force it on for this load too (and adopt it as the
        // persisted choice, so it keeps showing via the menu from now on).
        if (params.has('dev') || devMode) setDevMode(true);
        updateMenuInfo();
    }

    return { init, update, toast, openStatsOverlay };
})();
