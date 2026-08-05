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
    // Factory production pills (the "3/5" stock badges floating over
    // factories) get dense and cluttered once several are visible while
    // zoomed out — worst on a small mobile screen. Default on; a ☰-menu
    // toggle lets anyone who prefers always-on pills opt back in.
    let hidePills = localStorage.getItem('scTycoonHidePills') !== 'false';

    function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

    let toastClickHandler = null;
    function toast(text, kind, onClick) {
        const el = $('toast');
        el.textContent = text;
        el.className = 'show ' + (kind || 'info') + (onClick ? ' clickable' : '');
        toastClickHandler = onClick || null;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.className = ''; toastClickHandler = null; }, 3200);
    }
    // Wired once here (rather than ui-bind.js) since toastClickHandler is
    // private to this closure — bind() only sees the exported toast().
    function bindToastClick() {
        $('toast').addEventListener('click', () => {
            if (!toastClickHandler) return;
            const fn = toastClickHandler;
            toastClickHandler = null;
            $('toast').className = '';
            fn();
        });
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

    function setHidePills(on) {
        hidePills = on;
        localStorage.setItem('scTycoonHidePills', String(hidePills));
    }

    function updateDevPanel() {
        $('dev-fps').textContent = Math.round(fpsSmoothed);
        const btn = $('dev-congestion');
        btn.classList.toggle('active', SC.state.congestionEnabled);
        $('dev-congestion-state').textContent = SC.state.congestionEnabled ? 'On' : 'Off';
        $('dev-research').disabled = SC.research.activeCount() === 0;
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
        updateIntersectionBtn();
        updateJunctionBtn();
        updateLandBtn();

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
        updateAutoAccept();
        updateBuild();
    }

    // ── Promotions (Marketing Blitz): repeatable paid demand burst ──
    function updatePromo() {
        const btn = $('btn-promo');
        const select = $('promo-good-select');
        const isDone = SC.research.isDone('promotions');
        btn.classList.toggle('hidden', !isDone);
        if (select) select.classList.toggle('hidden', !isDone);
        if (btn.classList.contains('hidden')) return;

        if (select) {
            const products = SC.economy.craftableProducts();
            const currVal = select.value || 'all';
            let html = '<option value="all">🌐 All Products</option>';
            products.forEach(p => {
                html += `<option value="${p}">${SC.emojiOf(p)} ${SC.nameOf(p)}</option>`;
            });
            select.innerHTML = html;
            if (products.includes(currVal) || currVal === 'all') {
                select.value = currVal;
            }
            select.disabled = SC.economy.isPromoActive();
        }

        if (SC.economy.isPromoActive()) {
            btn.disabled = true;
            const target = SC.state.promoGood && SC.state.promoGood !== 'all' ? ` (${SC.emojiOf(SC.state.promoGood)})` : '';
            btn.querySelector('.price').textContent = `${Math.ceil(SC.economy.promoTimeLeft())}s left${target}`;
        } else {
            btn.disabled = !SC.canAfford(SC.CONFIG.PROMO_COST);
            btn.querySelector('.price').textContent = fmt(SC.CONFIG.PROMO_COST);
        }
    }

    // ── Standing Orders (auto-accept contracts): a Shop toggle, only
    // shown once researched — mirrors the dev-panel Congestion toggle. ──
    function updateAutoAccept() {
        const btn = $('btn-auto-accept');
        btn.classList.toggle('hidden', !SC.research.isDone('autoAcceptContracts'));
        if (btn.classList.contains('hidden')) return;
        btn.classList.toggle('active', SC.state.autoAcceptContracts);
        btn.querySelector('.price').textContent = SC.state.autoAcceptContracts ? 'On' : 'Off';
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

        const trucksAt = n => st.trucks.filter(t => t.homeYard === n).length;
        $('yard-picker-btn').textContent = `${yardLabel(st.activeYard)} — ${trucksAt(st.activeYard)} 🚚 ▾`;
        if (yardOverlayOpen()) updateYardOverlayList(); // keep truck counts live while open

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

    // Custom modal replacing the old native <select> — that picker's options
    // got rebuilt every ~0.4s while the shop panel was open (see updateYards
    // above), which made the native dropdown flicker/misbehave on mobile.
    function yardOverlayOpen() { return !$('yard-overlay').classList.contains('hidden'); }

    function updateYardOverlayList() {
        const st = SC.state;
        const yards = st.nodes.filter(SC.isYard);
        $('yard-overlay-list').innerHTML = yards.map(n => `
            <button class="menu-btn yard-overlay-btn${n === st.activeYard ? ' active' : ''}" data-yard="${n.id}">
                <span>${yardLabel(n)}</span><span>${st.trucks.filter(t => t.homeYard === n).length} 🚚</span>
            </button>`).join('');
    }

    function openYardOverlay() {
        updateYardOverlayList();
        $('yard-overlay').classList.remove('hidden');
    }

    function closeYardOverlay() {
        $('yard-overlay').classList.add('hidden');
    }

    // ── Buy land: the only way the map grows. Hidden until the Land
    // Surveying research is done, like the junction/promo buttons. The label
    // switches to the region tier when that's what the next purchase opens,
    // so the jump in price is explained before it's paid. ──
    function updateLandBtn() {
        const btn = $('btn-land');
        if (!btn) return;
        btn.classList.toggle('hidden', !SC.research.isDone('landSurvey'));
        if (btn.classList.contains('hidden')) return;
        const region = SC.map.nextLandKind() === 'region';
        btn.querySelector('.sname').textContent = region ? '🌐 Buy region' : '🗺️ Buy land';
        btn.title = region
            ? 'Opens a whole new region, linked by paved highway — the top tier of the land ladder'
            : 'Push the frontier out: new buildable land, plus a fresh supplier and a factory for sale';
        const price = SC.landPrice();
        btn.querySelector('.price').textContent = fmt(price);
        btn.disabled = !SC.canAfford(price);
    }

    // ── Intersections: the retrofit tool for roads that already cross
    // without meeting. New roads build their own interchanges now (see
    // SC.roads.build), so a crossing to retrofit only exists in a save from
    // before that rule — the button hides itself when the map has none, and
    // an active place-mode keeps it visible so it can be cancelled. ──
    function updateIntersectionBtn() {
        const st = SC.state;
        const btn = $('btn-intersection');
        if (!btn) return;
        const useful = SC.roads.hasCrossings() ||
            (st.placeMode && st.placeMode.kind === 'intersection');
        btn.classList.toggle('hidden', !SC.placement.isUnlocked('intersection') || !useful);
        if (btn.classList.contains('hidden')) return;
        const price = SC.CONFIG.PLACEMENT_INTERSECTION_PRICE;
        const active = st.placeMode && st.placeMode.kind === 'intersection';
        btn.classList.toggle('active', !!active);
        btn.querySelector('.price').textContent = active ? 'Tap map…' : fmt(price);
        btn.disabled = !active && !SC.canAfford(price);
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
        if (!status) return;
        if (SC.research.activeCount() > 0) {
            const qCount = SC.research.queueCount();
            status.textContent = `${SC.research.activeCount()}/${SC.research.maxSlots()} Active${qCount > 0 ? ` (${qCount} Q'd)` : ''}`;
        } else {
            const available = SC.RESEARCH_ORDER.filter(id => SC.research.isAvailable(id) && SC.research.labSatisfied(id)).length;
            status.textContent = available ? `${available} available` : 'Open tree';
        }
    }

    function researchNodeHTML(id, pos) {
        const t = SC.RESEARCH[id];
        const done = SC.research.isDone(id);
        const active = SC.research.isActive(id);
        const queued = SC.research.isQueued(id);
        const labMissing = !SC.research.labSatisfied(id); // only `needsLab` late-tier techs
        const queueable = SC.research.isQueueable(id);
        const locked = !done && !active && !queued && !SC.research.isAvailable(id) && !queueable;
        // Emoji get their own inline box (.rt-emoji): several Android emoji
        // fonts report an advance width narrower than the glyph they actually
        // draw, so a plain `${emoji} ${text}` renders with the text sitting on
        // top of the emoji. See the .rt-emoji rule in style.css.
        const em = e => `<span class="rt-emoji">${e}</span>`;
        let btn;
        if (done) {
            btn = `<div class="research-btn" style="background:rgba(52,211,153,0.15);cursor:default">${em('✓')}Researched</div>`;
        } else if (active) {
            const pct = Math.round(SC.research.progress(id) * 100);
            const left = Math.max(0, Math.round(t.time * (1 - SC.research.progress(id))));
            btn = `<div class="research-bar"><div style="width:${pct}%"></div></div>
                   <div class="research-desc" style="margin:0.3rem 0 0;text-align:center">${left}s left (${pct}%)</div>`;
        } else if (queued) {
            const qIdx = SC.research.queueList().indexOf(id) + 1;
            btn = `<button class="research-btn cancel-btn" data-cancel-research="${id}">Queued (#${qIdx}) — Cancel</button>`;
        } else if (labMissing) {
            btn = `<div class="research-btn" disabled style="cursor:default">${em('🔒')}Requires Research Lab</div>`;
        } else if (locked) {
            btn = `<div class="research-btn" disabled style="cursor:default">${em('🔒')}Locked</div>`;
        } else {
            const canStart = SC.research.canStart(id);
            const canQueue = SC.research.canQueue(id);
            const fullSlots = SC.research.activeCount() >= SC.research.maxSlots();
            if (!fullSlots) {
                const labelText = `Research — ${fmt(t.cost)} · ${t.time}s`;
                btn = `<button class="research-btn" data-research="${id}" ${!canStart ? 'disabled' : ''}>${labelText}</button>`;
            } else {
                const labelText = `Queue — ${fmt(t.cost)} · ${t.time}s`;
                btn = `<button class="research-btn queue-btn" data-research="${id}" ${!canQueue ? 'disabled' : ''}>${labelText}</button>`;
            }
        }
        return `<div class="rt-node research-row ${done ? 'done' : ''} ${queued ? 'queued' : ''} ${locked || labMissing ? 'locked' : ''}"
                     data-rt-id="${id}" style="left:${pos.x}px;top:${pos.y}px;width:${pos.w}px">
            <div class="research-top"><span class="research-name">${em(t.emoji)}${t.name}</span></div>
            <div class="research-desc">${t.desc}</div>
            ${btn}
        </div>`;
    }

    // ── Research tree layout ──────────────────────────────────────
    // Derived from SC.RESEARCH itself rather than a hand-written table:
    // a tech added to RESEARCH_ORDER lays out on its own. (The old
    // hardcoded col/row map silently dropped any tech missing from it,
    // which threw on `pos.x` and blanked the whole overlay.)
    //
    // Rows come from tier (longest prerequisite chain to a root), so a
    // tech never renders above one of its prerequisites. Columns come from
    // a tidy-forest pass: leaves take the next free slot and parents centre
    // over their children, so each branch owns a disjoint horizontal band.
    function researchLayout() {
        const ids = SC.RESEARCH_ORDER.filter(id => SC.RESEARCH[id]);

        const tier = {};
        function tierOf(id) {
            if (tier[id] !== undefined) return tier[id];
            tier[id] = 0; // cycle guard: a self/mutual dependency resolves to a root
            const reqs = (SC.RESEARCH[id].requires || []).filter(r => SC.RESEARCH[r]);
            return tier[id] = reqs.length ? 1 + Math.max(...reqs.map(tierOf)) : 0;
        }
        ids.forEach(tierOf);

        // Primary parent = the deepest prerequisite, so a tech hangs under
        // the branch it actually extends. Extra prerequisites still get an
        // edge drawn, they just don't drive placement.
        const parent = {}, children = {};
        ids.forEach(id => { children[id] = []; });
        for (const id of ids) {
            const reqs = (SC.RESEARCH[id].requires || []).filter(r => children[r]);
            if (!reqs.length) continue;
            let best = reqs[0];
            for (const r of reqs) if (tier[r] > tier[best]) best = r;
            parent[id] = best;
            children[best].push(id);
        }

        const col = {};
        let next = 0;
        function place(id) {
            const kids = children[id];
            if (!kids.length) { col[id] = next++; return; }
            kids.forEach(place);
            col[id] = (col[kids[0]] + col[kids[kids.length - 1]]) / 2;
        }
        // Root subtrees in RESEARCH_ORDER order, with a small gap between them.
        for (const id of ids) {
            if (parent[id] === undefined) { place(id); next += RT_ROOT_GAP; }
        }

        // Centring a parent over its children can collide with a neighbouring
        // branch's node on the same row — push right until every row has at
        // least one full column between nodes.
        const rows = {};
        for (const id of ids) (rows[tier[id]] = rows[tier[id]] || []).push(id);
        for (const r in rows) {
            rows[r].sort((a, b) => col[a] - col[b]);
            for (let i = 1; i < rows[r].length; i++) {
                const prev = col[rows[r][i - 1]];
                if (col[rows[r][i]] - prev < 1) col[rows[r][i]] = prev + 1;
            }
        }

        const minCol = Math.min(...ids.map(id => col[id]));
        const out = {};
        for (const id of ids) out[id] = { col: col[id] - minCol, row: tier[id] };
        return out;
    }

    // Card geometry. Row pitch has to clear the tallest card, and card height
    // is driven by the description text. Phones get their own, roomier set:
    // the tree is never auto-shrunk below 100% there (see autoScale below),
    // so the cards carry the bigger touch-legible type the `max-width: 768px`
    // block in style.css puts on `.rt-node`, and the pitch has to match.
    // rowH/nodeH here are only the opening estimate: updateResearchTree
    // measures the rendered cards and re-pitches the rows off the tallest one.
    const RT_PAD = 20;
    const RT_ROW_GAP = 34;   // air between a row's tallest card and the next row
    const RT_METRICS_DESKTOP = { colW: 178, rowH: 205, nodeW: 164, nodeH: 150 };
    const RT_METRICS_PHONE = { colW: 260, rowH: 220, nodeW: 236, nodeH: 165 };
    const RT_PHONE_MAX_W = 768;  // keep in sync with the mobile block in style.css
    const RT_ROOT_GAP = 0.35;   // extra columns between adjacent root subtrees
    // The tree is laid out at a fixed px size tuned for a phone-ish width, so on
    // a desktop card (up to 1380px) it used to sit small in a sea of empty card.
    // Above RT_GROW_MIN_W it now also scales *up* to fill the space — capped so
    // the nodes stay a sane reading size, and never past the visible height.
    const RT_MAX_SCALE = 1.45;
    const RT_GROW_MIN_W = 900;  // viewport width where growing kicks in (desktop)
    // How far the player may zoom either side of that with pinch / the ± buttons.
    const RT_ZOOM_MIN = 0.4, RT_ZOOM_MAX = 2.5;

    function rtMetrics() {
        return window.innerWidth <= RT_PHONE_MAX_W ? RT_METRICS_PHONE : RT_METRICS_DESKTOP;
    }

    // Unscaled size of the laid-out tree, the scale on screen, and the
    // player's own zoom (0 = "no opinion", follow the auto fit). rtRowMinX/
    // rtRowBottom are per-row geometry from the last updateResearchTree
    // pass — see setResearchTreeBoxHeight.
    let rtTreeW = 0, rtTreeH = 0, rtScale = 1, rtUserScale = 0;
    let rtRowMinX = [], rtRowBottom = [];

    function researchTreeOpen() { return !$('research-overlay').classList.contains('hidden'); }

    // What the tree picks for itself when the player hasn't zoomed.
    function autoResearchTreeScale(containerWidth) {
        // Never auto-shrink below 100%. Fitting the whole tree into a phone
        // width used to land at 0.62, putting the description text at ~7px —
        // that is what made the overlay unreadable on mobile. Narrower than
        // the tree, the wrap scrolls and drag/pinch takes over instead.
        if (containerWidth < rtTreeW || window.innerWidth < RT_GROW_MIN_W) return 1;
        // Room to spare on desktop: grow into it, bounded by the width, by
        // what's still visible below the card header, and by RT_MAX_SCALE.
        const wrap = $('research-tree-wrap');
        const availH = Math.max(240, window.innerHeight * 0.9 - wrap.getBoundingClientRect().top);
        return Math.max(1, Math.min(containerWidth / rtTreeW, availH / rtTreeH, RT_MAX_SCALE));
    }

    function applyResearchTreeScale(scale) {
        const wrap = $('research-tree-wrap');
        const nodesEl = $('research-tree-nodes');
        const svg = $('research-tree-edges');
        rtScale = scale;
        nodesEl.style.transform = scale === 1 ? '' : `scale(${scale})`;
        nodesEl.style.transformOrigin = 'top left';
        svg.style.transform = scale === 1 ? '' : `scale(${scale})`;
        svg.style.transformOrigin = 'top left';
        // Every node is absolutely positioned, so this box only ever drives the
        // wrap's scroll extent — sizing it to the *scaled* tree is what lets a
        // zoomed-in tree pan all the way out to its right/bottom edge.
        //
        // The wrap's OWN height is deliberately not touched here. It used to
        // track the scaled tree, which meant a pinch resized the scroll
        // viewport, and with it the card and its centred position in the
        // overlay: the window moved under the player's fingers while they were
        // trying to zoom what was inside it. The box is sized once per
        // open/rebuild instead — see setResearchTreeBoxHeight.
        nodesEl.style.width = (rtTreeW * scale) + 'px';
        nodesEl.style.height = (rtTreeH * scale) + 'px';
    }

    // The tree opens scrolled to (0, 0), so anything past `containerWidth`
    // needs a horizontal scroll first — a row whose only node sits under a
    // branch out there isn't reachable yet, and sizing the box to include it
    // just leaves dead air below whatever *is* in view. Returns the deepest
    // row that has a node starting within the given width.
    function visibleTreeHeight(containerWidth) {
        let maxRow = -1;
        for (let r = 0; r < rtRowMinX.length; r++) {
            if (rtRowMinX[r] !== undefined && rtRowMinX[r] < containerWidth) maxRow = r;
        }
        return maxRow < 0 ? rtTreeH : rtRowBottom[maxRow] + RT_PAD;
    }

    // The card hugs a short tree instead of always standing 90vh tall, so the
    // wrap does need a height — just one that comes from the auto fit and then
    // holds still, however far the player zooms afterwards. Two caps on top
    // of the raw tree height: the viewport (availH — a tree taller than the
    // screen still needs to fit on it) and, when the tree is wider than the
    // card so it opens needing a horizontal scroll (every phone open),
    // visibleTreeHeight — otherwise the box hugged the deepest row in the
    // *whole* forest, most of it off in columns the player hasn't scrolled
    // to yet, and the card stood far taller than the couple of rows actually
    // in view.
    function setResearchTreeBoxHeight(scale, containerWidth) {
        const wrap = $('research-tree-wrap');
        if (!wrap) return;
        const availH = Math.max(240, window.innerHeight * 0.9 - wrap.getBoundingClientRect().top);
        const visibleH = visibleTreeHeight(containerWidth) * scale;
        wrap.style.height = Math.min(visibleH, rtTreeH * scale, availH) + 'px';
    }

    function fitResearchTree() {
        const wrap = $('research-tree-wrap');
        if (!wrap || !rtTreeW || !rtTreeH) return;
        const containerWidth = wrap.clientWidth;
        if (containerWidth <= 0) return;
        const auto = autoResearchTreeScale(containerWidth);
        setResearchTreeBoxHeight(auto, containerWidth);
        applyResearchTreeScale(rtUserScale || auto);
    }

    // Zooming out has to reach the whole-tree overview however wide the tree
    // grows — on a phone that is well under RT_ZOOM_MIN — but a tree that
    // already fits shouldn't be shrinkable into nothing.
    function rtMinZoom() {
        const wrap = $('research-tree-wrap');
        if (!wrap || !rtTreeW || !wrap.clientWidth) return RT_ZOOM_MIN;
        return Math.min(RT_ZOOM_MIN, wrap.clientWidth / rtTreeW);
    }

    // Zoom about a point given in wrap-viewport coordinates (defaults to the
    // middle of what's on screen), keeping whatever sits under it put.
    function setResearchTreeZoom(scale, ax, ay) {
        const wrap = $('research-tree-wrap');
        if (!wrap || !rtTreeW) return;
        const next = Math.max(rtMinZoom(), Math.min(RT_ZOOM_MAX, scale));
        const prev = rtScale || 1;
        if (Math.abs(next - prev) < 0.001) return;
        if (ax === undefined) ax = wrap.clientWidth / 2;
        if (ay === undefined) ay = wrap.clientHeight / 2;
        const tx = (wrap.scrollLeft + ax) / prev;   // tree coords under the anchor
        const ty = (wrap.scrollTop + ay) / prev;
        rtUserScale = next;
        applyResearchTreeScale(next);
        wrap.scrollLeft = tx * next - ax;
        wrap.scrollTop = ty * next - ay;
    }

    function zoomResearchTreeBy(factor, ax, ay) {
        setResearchTreeZoom((rtScale || 1) * factor, ax, ay);
    }

    // The one place the tree is allowed under 100%: an overview the player
    // asked for explicitly and can pinch straight back out of.
    function fitResearchTreeToScreen() {
        const wrap = $('research-tree-wrap');
        if (!wrap || !rtTreeW || !rtTreeH) return;
        const avail = Math.max(240, window.innerHeight * 0.9 - wrap.getBoundingClientRect().top);
        setResearchTreeZoom(Math.min(wrap.clientWidth / rtTreeW, avail / rtTreeH), 0, 0);
        wrap.scrollLeft = 0;
        wrap.scrollTop = 0;
    }

    function researchTreeScale() { return rtScale; }

    // The tree is rebuilt from updateShop(), which the game loop calls every
    // 0.4s — and rebuilding means replacing #research-tree-nodes' innerHTML.
    // A press that straddles one of those ticks had its element deleted out
    // from under it, so the browser never generated a click at all: that is
    // why tapping a tech "sometimes" (in practice, often) did nothing. Two
    // guards: never rebuild while a pointer is held down inside the tree
    // (flush on release instead), and skip the write entirely when the markup
    // is byte-identical to what is already on screen.
    let rtHold = false, rtDirty = false, rtLastNodes = '', rtLastEdges = '', rtNodeH = {}, rtLastTops = '';
    function setResearchTreeHold(v) {
        rtHold = !!v;
        if (!rtHold && rtDirty) { rtDirty = false; updateResearchTree(); }
    }

    function updateResearchTree() {
        if (!researchTreeOpen()) return;
        if (rtHold) { rtDirty = true; return; }
        const positions = {};
        const layout = researchLayout();

        let maxCol = 0, maxRow = 0;
        for (const id in layout) {
            maxCol = Math.max(maxCol, layout[id].col);
            maxRow = Math.max(maxRow, layout[id].row);
        }

        const m = rtMetrics();
        const width = RT_PAD * 2 + (maxCol + 1) * m.colW;
        let height = RT_PAD * 2 + (maxRow + 1) * m.rowH;

        for (const id in layout) {
            positions[id] = {
                x: RT_PAD + layout[id].col * m.colW + (m.colW - m.nodeW) / 2,
                y: RT_PAD + layout[id].row * m.rowH,
                w: m.nodeW
            };
        }

        const ids = SC.RESEARCH_ORDER.filter(id => positions[id]);
        const nodesEl = $('research-tree-nodes');
        const nodesHTML = ids.map(id => researchNodeHTML(id, positions[id])).join('');
        const changed = nodesHTML !== rtLastNodes;
        if (changed) {
            rtLastNodes = nodesHTML;
            nodesEl.innerHTML = nodesHTML;
            // Cards grow with their description text, so m.nodeH is only an
            // opening estimate — measure the real ones (one reflow, and only
            // when the markup actually changed).
            rtNodeH = {};
            for (const el of nodesEl.children) {
                if (el.dataset.rtId) rtNodeH[el.dataset.rtId] = el.offsetHeight;
            }
        }

        // Second pass: with real card heights in hand, stack each row directly
        // under the tallest card of the row above it — a fixed pitch has to
        // clear the wordiest tech in the whole tree, which left every other row
        // swimming in dead space. Positions are pure JS; only `top` hits the DOM.
        // Also track each row's leftmost node (rowMinX) — a forest this wide
        // has rows whose only content sits under a branch several columns to
        // the right, and setResearchTreeBoxHeight uses this to size the box to
        // what's actually reachable at the default (unscrolled) position
        // instead of the deepest row anywhere in the tree.
        const rowH = [], rowMinX = [];
        for (const id in positions) {
            const r = layout[id].row;
            rowH[r] = Math.max(rowH[r] || 0, rtNodeH[id] || m.nodeH);
            rowMinX[r] = rowMinX[r] === undefined ? positions[id].x : Math.min(rowMinX[r], positions[id].x);
        }
        const rowTop = [];
        let y = RT_PAD;
        for (let r = 0; r <= maxRow; r++) {
            rowTop[r] = y;
            y += (rowH[r] || m.nodeH) + RT_ROW_GAP;
        }
        height = y - RT_ROW_GAP + RT_PAD;
        for (const id in positions) positions[id].y = rowTop[layout[id].row];
        rtRowMinX = rowMinX;
        rtRowBottom = rowTop.map((top, r) => top + (rowH[r] || m.nodeH));
        const tops = rowTop.join();
        if (changed || tops !== rtLastTops) {
            rtLastTops = tops;
            for (const el of nodesEl.children) {
                if (el.dataset.rtId) el.style.top = positions[el.dataset.rtId].y + 'px';
            }
        }
        rtTreeW = width;
        rtTreeH = height;

        const svg = $('research-tree-edges');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        let edges = '';
        for (const id of ids) {
            const to = positions[id];
            for (const req of SC.RESEARCH[id].requires) {
                const from = positions[req];
                if (!from) continue;
                const x1 = from.x + from.w / 2, y1 = from.y + (rtNodeH[req] || m.nodeH);
                const x2 = to.x + to.w / 2, y2 = to.y;
                const midY = (y1 + y2) / 2;
                edges += `<path d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}"
                    class="rt-edge ${SC.research.isDone(req) ? 'rt-edge-done' : ''}" />`;
            }
        }
        if (edges !== rtLastEdges) {
            rtLastEdges = edges;
            svg.innerHTML = edges;
        }
        // Re-fitting resets the transform and the wrap height, so only do it
        // when something actually redrew — otherwise every idle tick fights
        // whatever the player has scrolled or panned to.
        if (changed) fitResearchTree();
    }

    function openResearchTree() {
        $('research-overlay').classList.remove('hidden');
        setResearchTreeHold(false);
        rtUserScale = 0;   // each opening starts from the auto fit again
        const wrap = $('research-tree-wrap');
        if (wrap) { wrap.scrollLeft = 0; wrap.scrollTop = 0; }
        updateResearchTree();
        fitResearchTree(); // the wrap only has real dimensions once shown
    }

    function closeResearchTree() {
        $('research-overlay').classList.add('hidden');
    }

    function drawRecipeGraph() {
        const container = $('recipe-graph');
        if (!container) return;

        // Laid out from SC.GOODS rather than a hand-written table: column is
        // the good's chain depth, row is its order within that column. The
        // old fixed table silently dropped any good missing from it, so every
        // recipe added to config.js had to be mirrored here or vanish from
        // this graph. Rows are centred per column so the tree reads top-down.
        const NODE_W = 130, NODE_H = 32, COL_W = 185, ROW_H = 42, PAD = 15;
        const cols = [];
        for (const id of Object.keys(SC.GOODS)) {
            const d = SC.depthOf(id);
            (cols[d] = cols[d] || []).push(id);
        }
        const tallest = Math.max(...cols.map(c => c.length));
        const nodePositions = {};
        cols.forEach((ids, d) => {
            const top = PAD + (tallest - ids.length) * ROW_H / 2;
            ids.forEach((id, i) => {
                nodePositions[id] = { x: PAD + d * COL_W, y: top + i * ROW_H, w: NODE_W };
            });
        });
        const graphW = PAD * 2 + (cols.length - 1) * COL_W + NODE_W;
        const graphH = PAD * 2 + (tallest - 1) * ROW_H + NODE_H;
        container.style.width = graphW + 'px';
        container.style.height = graphH + 'px';
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

        svg.setAttribute('width', graphW);
        svg.setAttribute('height', graphH);
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
            return `<div class="stats-ach ${done ? 'unlocked' : 'locked'}" data-ach="${id}" title="${a.desc}">
                <span class="ach-emoji">${a.emoji}</span>${a.name}
            </div>`;
        }).join('');

        const c = SC.stats.career;
        if ($('stats-career')) {
            $('stats-career').innerHTML = `
                <div class="stats-row"><span>📦 Total Deliveries</span><b>${c.totalDeliveries}</b></div>
                <div class="stats-row"><span>💵 Total Money Earned</span><b>$${Math.round(c.totalMoneyEarned)}</b></div>
                <div class="stats-row"><span>🚚 Trucks Bought</span><b>${c.totalTrucksBought}</b></div>
                <div class="stats-row"><span>🛣️ Roads Built</span><b>${c.totalRoadsBuilt}</b></div>
                <div class="stats-row"><span>🌉 Bridges Built</span><b>${c.totalBridgesBuilt}</b></div>
                <div class="stats-row"><span>⛴️ Ferries Built</span><b>${c.totalFerriesBuilt}</b></div>
            `;
        }

        if ($('stats-highscores')) {
            const formatTime = s => {
                if (!s) return 'None';
                const m = Math.floor(s / 60);
                const sec = Math.floor(s % 60);
                return `${m}m ${sec}s`;
            };
            $('stats-highscores').innerHTML = `
                <div class="stats-row"><span>💰 Highest Cash</span><b>$${c.highScoreCash}</b></div>
                <div class="stats-row"><span>📦 Most Deliveries</span><b>${c.highScoreDeliveries}</b></div>
                <div class="stats-row"><span>🚀 Fastest $50,000</span><b>${formatTime(c.fastestTime50k)}</b></div>
            `;
        }
    }

    function openStatsOverlay() {
        SC.state.paused = true; // also reachable straight from the unlock toast, not just the paused ☰ menu
        $('stats-overlay').classList.remove('hidden');
        updateStatsOverlay();
    }

    function closeStatsOverlay() {
        $('stats-overlay').classList.add('hidden');
        SC.state.paused = false; // in case it was opened via the menu
    }

    // ── Achievement detail: tapping a badge in the Stats overlay explains it —
    // the grid is too cramped for description text, and hover-only `title`
    // tooltips don't work on touch. ──
    function openAchievementDetail(id) {
        const a = SC.ACHIEVEMENTS[id];
        const done = !!SC.state.achievements[id];
        $('ach-detail-emoji').textContent = a.emoji;
        $('ach-detail-name').textContent = a.name;
        $('ach-detail-desc').textContent = a.desc;
        $('ach-detail-status').textContent = done ? '✅ Unlocked' : '🔒 Locked';
        $('ach-detail-status').className = 'ach-detail-status ' + (done ? 'unlocked' : 'locked');
        $('ach-detail-overlay').classList.remove('hidden');
    }

    function closeAchievementDetail() {
        $('ach-detail-overlay').classList.add('hidden');
    }

    // ── River-crossing choice: input.js emits this instead of building
    // immediately whenever a tapped road would cross the river, so the
    // bridge-vs-ferry pick happens in context rather than a pre-set toggle ──
    let pendingCrossing = null;
    // The Bridge/Ferry/Cancel buttons appear right where the finishing tap
    // landed. On touch devices the browser fires a synthetic 'click' shortly
    // after the pointerup that opened this overlay, hit-testing the DOM as it
    // looks *now* — which can land it on whichever button is now sitting at
    // that same spot, "ghost-clicking" a choice the player never tapped.
    // Swallowing clicks for a brief window after opening means only a
    // deliberate second tap can pick bridge/ferry/cancel.
    const CROSSING_GHOST_CLICK_MS = 350;
    let crossingOpenedAt = 0;
    function openCrossingChoice(d) {
        pendingCrossing = d;
        const bridgeQuote = SC.roads.quote(d.a, d.b);
        const ferryQuote = SC.roads.quote(d.a, d.b, { ferry: true });
        if (!bridgeQuote || !ferryQuote) { pendingCrossing = null; return; }
        // Belt-and-braces: input.js already refuses a road the overlap rules
        // block, so the choice never reaches here for one.
        if (bridgeQuote.blocked) {
            toast(SC.roads.blockMessage(bridgeQuote), 'error');
            pendingCrossing = null;
            return;
        }
        $('crossing-bridge-cost').textContent = fmt(bridgeQuote.cost);
        $('crossing-ferry-cost').textContent = fmt(ferryQuote.cost);
        crossingOpenedAt = performance.now();
        $('crossing-overlay').classList.remove('hidden');
    }

    function closeCrossingChoice() {
        if (performance.now() - crossingOpenedAt < CROSSING_GHOST_CLICK_MS) return;
        pendingCrossing = null;
        $('crossing-overlay').classList.add('hidden');
    }

    function chooseCrossing(ferry) {
        if (!pendingCrossing || performance.now() - crossingOpenedAt < CROSSING_GHOST_CLICK_MS) return;
        const { a, b, shiftKey } = pendingCrossing;
        const res = SC.roads.build(a, b, { ferry });
        if (res.ok) {
            SC.sfx.play('build');
            SC.state.selectedNode = shiftKey ? b : null; // chain roads only when holding Shift
        } else if (res.reason === 'money') {
            SC.sfx.play('error');
            toast(`Credit limit reached — road costs $${res.cost} (limit −$${SC.CONFIG.CREDIT_LIMIT})`, 'error');
        } else if (res.message) {
            SC.sfx.play('error');
            toast(res.message, 'error');
        }
        pendingCrossing = null;
        $('crossing-overlay').classList.add('hidden');
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
            const specText = info.node.specializedRecipe
                ? `⚡ Specialized (${SC.emojiOf(info.node.specializedRecipe)} 1.5× speed)`
                : `Generalist (Flexible)`;
            const specAction = info.node.forSale ? '' : `<div class="itip-row" style="color:#f59e0b; cursor:pointer;" id="itip-spec-toggle" data-node-id="${info.node.id}"><span>${specText}</span><span style="text-decoration:underline; font-size:11px;">[Toggle]</span></div>`;
            return `<div class="itip-title">${SC.emojiOf(info.recipe)} ${info.building}${forSale}</div>
                    ${specAction}
                    <div class="itip-sub">Needs</div>${rows}`;
        }
        if (info.kind === 'supplier') {
            const rows = info.consumers.length ? info.consumers.map(c => `
                <div class="itip-row ${c.connected ? '' : 'itip-bad'}">
                    <span>${SC.emojiOf(c.factory.recipe)} ${SC.GOODS[c.factory.recipe].building}</span>
                    <span>${c.connected ? Math.round(c.dist) + 'u' : 'no route!'}</span>
                </div>`).join('') : '<div class="itip-row itip-bad">No factory needs this yet</div>';
            const n = info.node;
            // Yield is what the ground under this site is worth for this
            // material (biome band × the site's own roll). Colour-coded
            // rather than explained: good ground is worth upgrading, poor
            // ground is worth routing around.
            const y = SC.supplierYield(n), band = SC.biomeAt(n.x, n.y);
            const yCls = y >= 1.1 ? 'itip-good' : y <= 0.9 ? 'itip-bad' : '';
            return `<div class="itip-title">${SC.emojiOf(info.mat)} ${SC.nameOf(info.mat)} supplier${n.level ? ` <span class="itip-forsale">Lv${n.level + 1}</span>` : ''}</div>
                    <div class="itip-row"><span>Stock</span><span>${Math.floor(n.stock)}/${SC.supplierCap(n)}</span></div>
                    <div class="itip-row"><span>Rate</span><span>${SC.supplierRegen(n).toFixed(2)}/s</span></div>
                    <div class="itip-row ${yCls}"><span>${band.emoji} ${band.label}</span><span>${Math.round(y * 100)}% yield</span></div>
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
        if (!el) return;
        const node = (SC.state.mode === 'inspect' || SC.state.mode === 'heatmap') && SC.input.getInspectNode && SC.input.getInspectNode();
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
        const heatBtn = $('mode-heatmap');
        if (heatBtn) heatBtn.classList.toggle('active', mode === 'heatmap');

        const legend = $('heatmap-legend');
        if (legend) legend.classList.toggle('hidden', mode !== 'heatmap');

        SC.sfx.play('click');
        if (mode === 'upgrade') toast('Upgrade mode: tap a supplier or a road', 'info');
        if (mode === 'heatmap') toast('Heatmap mode: view road usage & bottleneck traffic', 'info');
    }

    let ordersTimer = 0, lastOrderCount = -1;
    function update(dt) {
        if (dt > 0) fpsSmoothed += (1 / dt - fpsSmoothed) * 0.1;
        updateHUD();
        updateInspectTooltip();
        if (SC.state.mode === 'heatmap') {
            const legend = $('heatmap-legend');
            if (legend && !legend.classList.contains('hidden')) {
                const totalTrips = SC.state.edges.reduce((sum, e) => sum + (e.trips || 0), 0);
                const jammed = SC.state.edges.filter(e => {
                    const activeTrucks = SC.vehicles ? SC.vehicles.truckCountOnEdge(e) : 0;
                    return activeTrucks > SC.CONFIG.CONGESTION_THRESHOLD;
                }).length;
                const summaryEl = $('heatmap-summary');
                if (summaryEl) {
                    summaryEl.textContent = `Total Network Trips: ${totalTrips}` + (jammed > 0 ? ` · ⚠️ ${jammed} Jammed` : ' · Flow Smooth');
                }
            }
        }
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
        // research.active is a LIST since concurrent research shipped — an
        // empty array is still truthy, so testing it directly read every idle
        // lab as "researching" and then threw on `.id` of undefined.
        const activeResearch = SC.research.activeList();
        const queuedCount = SC.research.queueCount();
        const research = activeResearch.length
            ? activeResearch
                  .map(a => `${SC.RESEARCH[a.id] ? SC.RESEARCH[a.id].name : a.id} (${Math.round(SC.research.progress(a.id) * 100)}%)`)
                  .join(', ') + (queuedCount ? ` +${queuedCount} queued` : '')
            : 'None';
        $('menu-stats').innerHTML = `
            <div class="stats-group">
                <div class="stats-group-label">OVERVIEW</div>
                <div><span>Difficulty</span><b>${SC.diff().emoji} ${SC.diff().label}</b></div>
                <div><span>Map seed</span><b class="menu-seed" id="menu-seed-value" title="Tap to copy">${st.seed || '—'} 📋</b></div>
                <div><span>Time played</span><b>${fmtDuration(st.time)}</b></div>
            </div>
            <div class="stats-group">
                <div class="stats-group-label">FINANCES</div>
                <div><span>Balance</span><b class="${st.money < 0 ? 'neg' : 'pos'}">${st.money < 0 ? '−' : ''}${fmt(Math.abs(st.money))}</b></div>
                <div><span>Credit limit</span><b>${fmt(SC.creditLimit())}</b></div>
                <div><span>Total earned</span><b>${fmt(st.earnedTotal)}</b></div>
                <div><span>Upkeep</span><b class="${SC.upkeepPerMin() > 0 ? 'neg' : ''}">${fmt(Math.round(SC.upkeepPerMin()))}/min</b></div>
                <div><span>Upkeep paid</span><b>${fmt(Math.round(st.upkeepPaid || 0))}</b></div>
                <div><span>Interest paid</span><b>${fmt(st.interestPaid)}</b></div>
            </div>
            <div class="stats-group">
                <div class="stats-group-label">LOGISTICS & TECH</div>
                <div><span>Orders filled / missed</span><b>${st.delivered} / ${st.missed}</b></div>
                <div><span>Trucks / yards</span><b>${st.trucks.length} / ${st.nodes.filter(SC.isYard).length}</b></div>
                <div><span>Researching</span><b>${research}</b></div>
            </div>`;
        const at = SC.save.getLastSavedAt();
        $('menu-save-status').textContent = at
            ? `Autosaves every ${SC.CONFIG.AUTOSAVE_INTERVAL}s · last saved ${fmtDuration((Date.now() - at) / 1000)} ago`
            : `Autosaves every ${SC.CONFIG.AUTOSAVE_INTERVAL}s · not saved yet this session`;
        $('menu-sound').textContent = SC.sfx.isMuted() ? '🔇 Sound: off' : '🔊 Sound: on';
        $('menu-music').textContent = SC.audio.musicEnabled() ? '🎵 Music: on' : '🎵 Music: off';
        $('menu-fullscreen').textContent = document.fullscreenElement ? '⛶ Exit full screen' : '⛶ Full screen';
        $('menu-dev').textContent = devMode ? '🛠 Dev tools: on' : '🛠 Dev tools: off';
        $('menu-pills').textContent = hidePills ? '🏷 Factory labels: auto-hide' : '🏷 Factory labels: always on';
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

    // Two-tap confirm on "New game". The armed flag and everything that reads
    // it stay together in here: ui-bind.js is a separate IIFE and can only see
    // what this file hands it through SC._ui, so a handler over there touching
    // `newGameArmed` directly is a ReferenceError, not a closure read.
    let newGameArmed = false;
    function isNewGameArmed() { return newGameArmed; }
    function armNewGame() {
        newGameArmed = true;
        $('menu-newgame').textContent = '⚠ Tap again — current game will be lost';
        setTimeout(resetNewGameArm, 4000);
    }
    function resetNewGameArm() {
        newGameArmed = false;
        $('menu-newgame').textContent = '🗑 New game';
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

    // ── UI Scale & Options / Toast History ──────────
    let uiScale = Math.max(0.75, Math.min(1.4,
        parseFloat(localStorage.getItem('scTycoonUiScale')) || 1));

    function setUiScale(scale) {
        uiScale = Math.max(0.75, Math.min(1.4, scale));
        localStorage.setItem('scTycoonUiScale', String(uiScale));
        document.documentElement.style.setProperty('--ui-scale', String(uiScale));
        updateOptionsModal();
    }
    function getUiScale() { return uiScale; }

    function openOptionsModal() {
        updateOptionsModal();
        $('options-overlay').classList.remove('hidden');
    }
    function closeOptionsModal() {
        $('options-overlay').classList.add('hidden');
    }

    function updateOptionsModal() {
        // Sound controls
        const sfxMuted = SC.sfx ? SC.sfx.isMuted() : false;
        const soundVol = SC.sfx ? Math.round(SC.sfx.getVolume() * 100) : 100;
        const soundBtn = $('opt-sound-toggle');
        if (soundBtn) {
            soundBtn.textContent = sfxMuted ? 'Off' : 'On';
            soundBtn.className = 'menu-btn toggle-btn ' + (sfxMuted ? 'off' : 'on');
        }
        if ($('opt-sound-vol')) $('opt-sound-vol').value = soundVol;
        if ($('opt-sound-vol-val')) $('opt-sound-vol-val').textContent = soundVol + '%';

        // Music controls
        const musicOn = SC.audio ? SC.audio.musicEnabled() : true;
        const musicVol = SC.audio ? Math.round(SC.audio.getMusicVolume() * 100) : 80;
        const musicBtn = $('opt-music-toggle');
        if (musicBtn) {
            musicBtn.textContent = musicOn ? 'On' : 'Off';
            musicBtn.className = 'menu-btn toggle-btn ' + (musicOn ? 'on' : 'off');
        }
        if ($('opt-music-vol')) $('opt-music-vol').value = musicVol;
        if ($('opt-music-vol-val')) $('opt-music-vol-val').textContent = musicVol + '%';

        // UI Scale
        if ($('opt-ui-scale-val')) $('opt-ui-scale-val').textContent = Math.round(uiScale * 100) + '%';
        const scaleBtns = $('opt-ui-scale-picker') ? $('opt-ui-scale-picker').children : [];
        for (const btn of scaleBtns) {
            const btnScale = parseFloat(btn.dataset.scale);
            btn.classList.toggle('active', Math.abs(btnScale - uiScale) < 0.04);
        }

        // Factory Pills toggle
        const pillsBtn = $('opt-pills-toggle');
        if (pillsBtn) {
            pillsBtn.textContent = hidePills ? 'Off' : 'On';
            pillsBtn.className = 'menu-btn toggle-btn ' + (hidePills ? 'off' : 'on');
        }

        // Auto accept contract toggle
        const autoAccept = SC.state ? SC.state.autoAcceptContracts : false;
        const autoBtn = $('opt-autoaccept-toggle');
        if (autoBtn) {
            autoBtn.textContent = autoAccept ? 'On' : 'Off';
            autoBtn.className = 'menu-btn toggle-btn ' + (autoAccept ? 'on' : 'off');
        }

        // Dev tools toggle
        const devBtn = $('opt-dev-toggle');
        if (devBtn) {
            devBtn.textContent = devMode ? 'On' : 'Off';
            devBtn.className = 'menu-btn toggle-btn ' + (devMode ? 'on' : 'off');
        }
    }

    function openToastHistoryModal() {
        renderToastHistory();
        $('toast-history-overlay').classList.remove('hidden');
    }
    function closeToastHistoryModal() {
        $('toast-history-overlay').classList.add('hidden');
    }
    function clearToastHistory() {
        toastHistory.length = 0;
        renderToastHistory();
    }
    function renderToastHistory() {
        const list = $('toast-history-list');
        if (!list) return;
        if (!toastHistory.length) {
            list.innerHTML = '<div class="toast-history-empty">No notifications recorded yet</div>';
            return;
        }
        list.innerHTML = toastHistory.map(item => {
            return `<div class="toast-history-item ${item.kind}">
                <div class="toast-item-header">
                    <span class="toast-item-badge ${item.kind}">${item.kind}</span>
                    <span class="toast-item-time">${item.timeStr}</span>
                </div>
                <div class="toast-item-text">${item.text}</div>
            </div>`;
        }).join('');
    }

    function init() {
        document.documentElement.style.setProperty('--ui-scale', String(uiScale));
        bindToastClick();
        SC._ui.bind();
        bindDifficultyPicker();
        drawRecipeGraph();
        $('menu-version').textContent = 'v' + SC.VERSION;
        updateOrders();
        updateShop();
        updateHUD();
        // A save restored mid-tutorial resumes on its persisted step, so the
        // banner has to be reinstated at boot, not only on the Start button.
        SC.tutorial.refresh();
        updateTutorial();
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
            $('dev-panel').classList.add('collapsed');
        }
        // The bottom-left Shop popover (#shop-panel) starts hidden on every
        // viewport now — it opens only when a launcher button is tapped.
        // Headless verification hook (see CLAUDE.md): open the menu on load
        if (new URLSearchParams(location.search).has('menu')) openMenu();
        // ...and/or the research tree overlay
        if (new URLSearchParams(location.search).has('techtree')) openResearchTree();
        // Dev-only tools panel: a lasting ☰-menu toggle (see setDevMode),
        // or ?dev=1 to force it on for this load too (and adopt it as the
        // persisted choice, so it keeps showing via the menu from now on).
        if (params.has('dev') || devMode) setDevMode(true);
        updateMenuInfo();
        window.addEventListener('resize', () => { if (researchTreeOpen()) fitResearchTree(); });
    }

    // Published for ui-bind.js (event wiring lives there to keep this file
    // smaller). getDevMode gives ui-bind live access to the devMode toggle.
    // getHidePills is also read directly by render-network.js each frame to
    // decide whether the factory production pills should auto-hide at low
    // zoom — the only cross-module read of a ☰-menu toggle from the render
    // layer, since drawing (not just event wiring) needs to react to it live.
    // ── Guided tutorial banner (js/tutorial.js decides the steps) ─────
    function updateTutorial() {
        const step = SC.tutorial.current();
        const el = $('tutorial-banner');
        el.classList.toggle('hidden', !step);
        if (!step) return;
        // Only touch the DOM when the step actually changes — this runs on
        // every event refresh, and rewriting innerHTML would restart the
        // banner's entrance animation each time.
        if (el.dataset.step === step.id) return;
        el.dataset.step = step.id;
        $('tutorial-progress').textContent =
            `Step ${SC.tutorial.stepIndex() + 1} of ${SC.tutorial.stepCount}`;
        $('tutorial-text').innerHTML = step.text;
    }

    SC.on('regionUnlocked', ev => {
        if (SC.sfx && SC.sfx.play) SC.sfx.play('unlock');
        toast(`🗺️ Region ${ev.region} unlocked! Paved highway connected.`, 'good');
        if (SC.camera && SC.camera.fitWorld) SC.camera.fitWorld();
    });

    SC._ui = {
        $, getDevMode: () => devMode, getHidePills: () => hidePills, getUiScale, setUiScale,
        openOptionsModal, closeOptionsModal, updateOptionsModal, openToastHistoryModal, closeToastHistoryModal, clearToastHistory, renderToastHistory, getToastHistory: () => toastHistory,
        fmt, fmtDuration, toast, setMode, setSpeed, setDevMode, setHidePills, openMenu, closeMenu, menuOpen, openResearchTree, closeResearchTree, setResearchTreeHold, zoomResearchTreeBy, setResearchTreeZoom, fitResearchTreeToScreen, researchTreeScale, openStatsOverlay, closeStatsOverlay, openAchievementDetail, closeAchievementDetail, chooseCrossing, closeCrossingChoice, openCrossingChoice, updateContractOffer, updateDevPanel, updateMenuInfo, updateOrders, updateShop, updateStatsOverlay, toggleFullscreen, resetNewGameArm, armNewGame, isNewGameArmed, focusOrder, yardLabel, openYardOverlay, closeYardOverlay, updateTutorial, inspectTooltipHTML
    };

    return { init, update, toast, openStatsOverlay, openOptionsModal, openToastHistoryModal };
})();
