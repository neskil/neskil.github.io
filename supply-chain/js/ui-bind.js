// Event wiring for the UI (extracted from ui.js to keep that file editable).
// Runs at load after ui.js has published its internals on SC._ui; ui.js's
// init() calls SC._ui.bind() at startup. All the handlers here call ui.js
// helpers captured off SC._ui, so their bodies are unchanged from when this
// lived inside the ui.js closure.
(function () {
    const U = SC._ui;
    const { $, fmt, fmtDuration, toast, setMode, setSpeed, setDevMode, setHidePills, getUiScale, setUiScale, openOptionsModal, closeOptionsModal, updateOptionsModal, openToastHistoryModal, closeToastHistoryModal, clearToastHistory, renderToastHistory, openMenu, closeMenu, menuOpen, openResearchTree, closeResearchTree, openStatsOverlay, closeStatsOverlay, openAchievementDetail, closeAchievementDetail, chooseCrossing, closeCrossingChoice, openCrossingChoice, updateContractOffer, updateDevPanel, updateMenuInfo, updateOrders, updateShop, updateStatsOverlay, toggleFullscreen, resetNewGameArm, armNewGame, isNewGameArmed, focusOrder, yardLabel, openYardOverlay, closeYardOverlay, updateTutorial } = U;
    const getDevMode = U.getDevMode;
    const getHidePills = U.getHidePills;

    // Same guarded idiom ui.js uses for the Options / Notifications markup:
    // those panels are still landing, so their ids may not exist yet. A hard
    // throw here aborts SC._ui.bind() and therefore the rest of init() — that
    // is what blanked the difficulty picker and recipe graph on the start
    // screen. Skip an absent element instead of taking the whole UI down.
    const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };

    SC._ui.bind = function () {
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
            // Finish every in-flight project, not just "the" one — research
            // has been a list since concurrent slots shipped.
            const active = SC.research.activeList();
            if (!active.length) { toast('No active research (dev)', 'info'); return; }
            for (const a of active) {
                if (SC.RESEARCH[a.id]) a.t = SC.RESEARCH[a.id].time;
            }
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
        on('menu-options', 'click', () => {
            SC.sfx.play('click');
            openOptionsModal();
        });
        on('menu-notifications', 'click', () => {
            SC.sfx.play('click');
            openToastHistoryModal();
        });

        // Options modal handlers
        on('options-close', 'click', () => { SC.sfx.play('click'); closeOptionsModal(); });
        on('options-overlay', 'click', e => {
            if (e.target === $('options-overlay')) closeOptionsModal();
        });
        on('opt-sound-toggle', 'click', () => {
            SC.sfx.toggleMute();
            updateOptionsModal();
        });
        on('opt-sound-vol', 'input', e => {
            SC.sfx.setVolume(+e.target.value / 100);
            updateOptionsModal();
        });
        on('opt-music-toggle', 'click', () => {
            SC.audio.toggleMusic();
            SC.sfx.play('click');
            updateOptionsModal();
        });
        on('opt-music-vol', 'input', e => {
            SC.audio.setMusicVolume(+e.target.value / 100);
            updateOptionsModal();
        });
        on('opt-ui-scale-picker', 'click', e => {
            const btn = e.target.closest('[data-scale]');
            if (btn) {
                SC.sfx.play('click');
                setUiScale(+btn.dataset.scale);
            }
        });
        on('opt-pills-toggle', 'click', () => {
            setHidePills(!getHidePills());
            SC.sfx.play('click');
            updateOptionsModal();
        });
        on('opt-autoaccept-toggle', 'click', () => {
            SC.state.autoAcceptContracts = !SC.state.autoAcceptContracts;
            SC.sfx.play('click');
            updateOptionsModal();
        });
        on('opt-fullscreen-btn', 'click', () => {
            SC.sfx.play('click');
            toggleFullscreen();
        });
        on('opt-dev-toggle', 'click', () => {
            setDevMode(!getDevMode());
            SC.sfx.play('click');
            updateOptionsModal();
        });
        on('opt-view-history-btn', 'click', () => {
            SC.sfx.play('click');
            closeOptionsModal();
            openToastHistoryModal();
        });

        // Toast History modal handlers
        on('toast-history-close', 'click', () => { SC.sfx.play('click'); closeToastHistoryModal(); });
        on('toast-history-done', 'click', () => { SC.sfx.play('click'); closeToastHistoryModal(); });
        on('toast-history-overlay', 'click', e => {
            if (e.target === $('toast-history-overlay')) closeToastHistoryModal();
        });
        on('toast-history-clear', 'click', () => {
            SC.sfx.play('click');
            clearToastHistory();
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
        $('menu-achievements').addEventListener('click', () => {
            $('menu-overlay').classList.add('hidden'); // stay paused while reading
            SC.sfx.play('click');
            openStatsOverlay();
        });
        $('stats-close').addEventListener('click', () => { SC.sfx.play('click'); closeStatsOverlay(); });
        $('stats-overlay').addEventListener('click', e => {
            if (e.target === $('stats-overlay')) closeStatsOverlay(); // tap outside the card
        });
        $('stats-achievements').addEventListener('click', e => {
            const badge = e.target.closest('[data-ach]');
            if (!badge) return;
            SC.sfx.play('click');
            openAchievementDetail(badge.dataset.ach);
        });
        $('ach-detail-close').addEventListener('click', () => { SC.sfx.play('click'); closeAchievementDetail(); });
        $('ach-detail-overlay').addEventListener('click', e => {
            if (e.target === $('ach-detail-overlay')) closeAchievementDetail(); // tap outside the card
        });
        if ($('stats-reset-career')) {
            $('stats-reset-career').addEventListener('click', () => {
                if (confirm('Reset all career stats and high scores? This cannot be undone.')) {
                    SC.stats.resetCareer();
                    updateStatsOverlay();
                }
            });
        }
        $('menu-newgame').addEventListener('click', () => {
            if (isNewGameArmed()) {
                // Reloading fires pagehide/beforeunload, whose autosave flush
                // (main.js) would otherwise re-persist this still-in-memory
                // state right after clear() and undo the reset. ?new=1
                // routes through the new-game screen (difficulty picker).
                SC.state.gameStarted = false;
                SC.save.clear();
                location.href = location.pathname + '?new=1';
                return;
            }
            armNewGame();
        });

        $('btn-truck').addEventListener('click', () => {
            const res = SC.vehicles.buyTruck();
            if (res.ok) { SC.sfx.play('cash'); toast(`New truck stationed at ${yardLabel(SC.state.activeYard)}`, 'good'); }
            else { SC.sfx.play('error'); toast(`Credit limit reached — truck costs ${fmt(res.cost)}`, 'error'); }
            updateShop();
        });
        $('yard-picker-btn').addEventListener('click', () => { SC.sfx.play('click'); openYardOverlay(); });
        $('yard-overlay-cancel').addEventListener('click', () => { SC.sfx.play('click'); closeYardOverlay(); });
        $('yard-overlay').addEventListener('click', e => {
            if (e.target === $('yard-overlay')) { closeYardOverlay(); return; } // tap outside the card
            const btn = e.target.closest('[data-yard]');
            if (!btn) return;
            const node = SC.state.nodes.find(n => n.id === +btn.dataset.yard);
            if (node) SC.state.activeYard = node;
            SC.sfx.play('click');
            updateShop();
            closeYardOverlay();
        });
        $('btn-moveTruck').addEventListener('click', () => {
            const res = SC.vehicles.reassignTruck(SC.state.activeYard);
            if (res.ok) { SC.sfx.play('click'); toast(`Truck rebased to ${yardLabel(SC.state.activeYard)}`, 'good'); }
            else { SC.sfx.play('error'); toast('No idle truck available at another yard', 'error'); }
            updateShop();
        });
        if ($('btn-researchLab')) {
            $('btn-researchLab').addEventListener('click', () => {
                const st = SC.state;
                if (st.placeMode && st.placeMode.kind === 'researchLab') {
                    st.placeMode = null; // tapping again cancels
                } else {
                    st.selectedNode = null; // don't fight the road-building ghost
                    st.placeMode = { kind: 'researchLab', good: null };
                    SC.emit('toast', { text: `Tap the map to place a Research Lab — ${fmt(SC.CONFIG.PLACEMENT_RESEARCH_LAB_PRICE || 800)}`, kind: 'info' });
                }
                SC.sfx.play('click');
                updateShop();
            });
        }
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
        $('btn-intersection').addEventListener('click', () => {
            const st = SC.state;
            if (st.placeMode && st.placeMode.kind === 'intersection') {
                st.placeMode = null; // tapping again cancels
            } else {
                st.selectedNode = null; // don't fight the road-building ghost
                st.placeMode = { kind: 'intersection', good: null };
                SC.emit('toast', { text: `Tap crossing roads to place an intersection — ${fmt(SC.CONFIG.PLACEMENT_INTERSECTION_PRICE)}`, kind: 'info' });
            }
            SC.sfx.play('click');
            updateShop();
        });
        $('btn-land').addEventListener('click', () => {
            const res = SC.map.buyLand();
            if (res.ok) {
                SC.sfx.play('cash');
                // expandField's own 'fieldExpanded' toast covers the rest
                toast(res.kind === 'region'
                    ? `🌐 New region opened for ${fmt(res.price)}`
                    : `🗺️ Land surveyed and bought for ${fmt(res.price)}`, 'good');
            } else if (res.reason === 'money') {
                SC.sfx.play('error');
                toast(`Not enough money — land costs ${fmt(res.cost)}`, 'error');
            } else {
                SC.sfx.play('error');
                toast('Land Surveying research required', 'error');
            }
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
        $('btn-auto-accept').addEventListener('click', () => {
            SC.state.autoAcceptContracts = !SC.state.autoAcceptContracts;
            SC.sfx.play('click');
            toast(SC.state.autoAcceptContracts ? '🤝 Contracts will auto-accept' : 'Auto-accept off', 'info');
            updateShop();
        });
        $('btn-research-tree').addEventListener('click', () => { SC.sfx.play('click'); openResearchTree(); });
        $('research-tree-close').addEventListener('click', () => { SC.sfx.play('click'); closeResearchTree(); });
        $('research-overlay').addEventListener('click', e => {
            if (e.target === $('research-overlay')) closeResearchTree(); // tap outside the card
        });

        // Drag to pan for Research Tree view
        const wrap = $('research-tree-wrap');
        let isPointerDown = false;
        let isDragging = false;
        let startX = 0, startY = 0;
        let startScrollLeft = 0, startScrollTop = 0;
        let activePointerId = null;

        wrap.addEventListener('pointerdown', e => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            isPointerDown = true;
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            startScrollLeft = wrap.scrollLeft;
            startScrollTop = wrap.scrollTop;
            activePointerId = e.pointerId;
            wrap.setPointerCapture(e.pointerId);
        });

        wrap.addEventListener('pointermove', e => {
            if (!isPointerDown || e.pointerId !== activePointerId) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!isDragging && Math.hypot(dx, dy) > 5) {
                isDragging = true;
                wrap.classList.add('is-dragging');
            }
            if (isDragging) {
                wrap.scrollLeft = startScrollLeft - dx;
                wrap.scrollTop = startScrollTop - dy;
            }
        });

        function endDrag(e) {
            if (!isPointerDown || (e && e.pointerId !== activePointerId)) return;
            isPointerDown = false;
            if (activePointerId !== null) {
                try { wrap.releasePointerCapture(activePointerId); } catch (_) {}
                activePointerId = null;
            }
            if (isDragging) {
                wrap.classList.remove('is-dragging');
                setTimeout(() => { isDragging = false; }, 50);
            }
        }

        wrap.addEventListener('pointerup', endDrag);
        wrap.addEventListener('pointercancel', endDrag);

        $('research-tree-nodes').addEventListener('click', e => {
            if (isDragging) return;
            const cancelBtn = e.target.closest('[data-cancel-research]');
            if (cancelBtn) {
                const id = cancelBtn.dataset.cancelResearch;
                const name = SC.RESEARCH[id] ? SC.RESEARCH[id].name : id;
                const res = SC.research.cancelQueue(id);
                if (res.ok) {
                    SC.sfx.play('click');
                    toast(`Cancelled queue for ${name}`, 'info');
                }
                updateShop();
                return;
            }
            const btn = e.target.closest('[data-research]');
            if (!btn || btn.disabled) return;
            const id = btn.dataset.research;
            const wasQueued = SC.research.isQueued(id);
            const res = SC.research.start(id);
            if (res.ok) {
                SC.sfx.play('click');
                const name = SC.RESEARCH[id] ? SC.RESEARCH[id].name : id;
                if (SC.research.isQueued(id)) {
                    toast(`Queued ${name}`, 'info');
                } else {
                    toast(`Researching ${name}…`, 'info');
                }
            }
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
        // ── Bottom-left launcher buttons (Upgrade / Build / Research) ──
        // Each button opens the shared popover panel to its own section. Tapping
        // the button of the already-open section closes the panel again, so the
        // launcher row doubles as the show/hide toggle. Every button carries its
        // own click handler (no header/tab propagation dance), which is what made
        // the old Shop/Build tabs "do nothing" on some mobile browsers.
        const SHOP_SECTIONS = ['upgrade', 'build', 'research'];
        function showSection(sec) {
            SHOP_SECTIONS.forEach(s =>
                $('shop-sec-' + s).classList.toggle('hidden', s !== sec));
            document.querySelectorAll('.launcher-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.sec === sec));
            $('shop-panel').classList.remove('hidden');
        }
        function closeShopPanel() {
            $('shop-panel').classList.add('hidden');
            document.querySelectorAll('.launcher-btn').forEach(b => b.classList.remove('active'));
        }
        function toggleSection(sec) {
            SC.sfx.play('click');
            if (sec === 'research') { openResearchTree(); return; } // skip the shop-panel middle step
            const open = !$('shop-panel').classList.contains('hidden');
            const btn = document.querySelector('.launcher-btn[data-sec="' + sec + '"]');
            if (open && btn && btn.classList.contains('active')) closeShopPanel();
            else showSection(sec);
        }
        document.querySelectorAll('.launcher-btn').forEach(b =>
            b.addEventListener('click', e => { e.stopPropagation(); toggleSection(b.dataset.sec); }));

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
            // Fresh runs get the guided first-order walkthrough; a restored
            // save resumes whatever step it persisted, so don't restart it.
            if (fresh) SC.tutorial.start();
            updateTutorial();
            // One-time riverside-grace hint at the very start of a run.
            const graceLeft = SC.map.riverGraceRemaining();
            if (fresh && graceLeft > 0) {
                toast(`🌊 New sites stay on your side of the river for the first ${Math.round(graceLeft / 60)} min`, 'info');
            }
        });

        $('tutorial-skip').addEventListener('click', () => {
            SC.sfx.play('click');
            SC.tutorial.skip();
            updateTutorial();
        });

        // Game event feedback
        SC.on('toast', d => toast(d.text, d.kind));
        // The tutorial's steps are goals, not actions — re-check them whenever
        // something could have satisfied one. Cheaper and more robust than
        // polling: a step can also be completed by a road built for other
        // reasons, or by demolishing one (which can un-route the HQ step).
        ['roadBuilt', 'roadDemolished', 'orderComplete'].forEach(ev =>
            SC.on(ev, () => { SC.tutorial.refresh(); updateTutorial(); }));
        SC.on('tutorialDone', () => {
            updateTutorial();
            toast('🎓 Tutorial complete — the map grows as you deliver. Good luck!', 'good');
        });
        SC.on('orderComplete', o => {
            SC.sfx.play('cash');
            toast(o.contract ? `📜 Contract fulfilled! +${fmt(o.payout)}` : `Order filled: +${fmt(o.payout)}`, 'good');
        });
        SC.on('orderExpired', d => {
            SC.sfx.play('expire');
            const penalty = (typeof d === 'object' && d && d.penalty) ? d.penalty : 0;
            if (penalty > 0) {
                toast(`An order expired — fine ${fmt(penalty)}`, 'error');
            } else {
                toast('An order expired — customer walked away', 'error');
            }
        });
        SC.on('contractOffered', () => { SC.sfx.play('unlock'); toast('📜 New contract offer available!', 'info'); });
        SC.on('crossingChoice', openCrossingChoice);
        SC.on('contractFailed', d => { SC.sfx.play('expire'); toast(`📜 Contract failed — penalty ${fmt(d.penalty)}`, 'error'); });
        SC.on('crafted', () => SC.sfx.play('craft'));
        // Dispatch can assign a whole batch in one tick; sfx.js throttles this
        // one so a busy map gets a single puff, not a machine-gun of them.
        SC.on('truckDispatched', () => SC.sfx.play('depart'));
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
            SC.sfx.play('science');
            toast(`🔬 Research complete: ${SC.RESEARCH[id].name}!`, 'good');
        });
        SC.on('achievementUnlocked', id => {
            const a = SC.ACHIEVEMENTS[id];
            SC.sfx.play('unlock');
            toast(`${a.emoji} Achievement unlocked: ${a.name}! (tap to view)`, 'good', () => {
                $('menu-overlay').classList.add('hidden'); // in case it was open underneath
                openStatsOverlay();
            });
        });
        SC.on('debtWarning', d => {
            SC.sfx.play('warn');
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
                <div><span>Upkeep paid</span><b>${fmt(Math.round(st.upkeepPaid || 0))}</b></div>
                <div><span>Interest paid</span><b>${fmt(st.interestPaid)}</b></div>
                <div><span>Orders filled / missed</span><b>${st.delivered} / ${st.missed}</b></div>
                <div><span>Time survived</span><b>${fmtDuration(st.time)}</b></div>`;
            $('gameover-overlay').classList.remove('hidden');
        });

        document.addEventListener('click', e => {
            const specBtn = e.target.closest('#itip-spec-toggle');
            if (specBtn) {
                const nodeId = +specBtn.dataset.nodeId;
                const node = SC.state.nodes.find(n => n.id === nodeId);
                if (node && node.kind === 'factory') {
                    const newSpec = node.specializedRecipe ? null : node.recipe;
                    SC.factories.setSpecialization(node, newSpec);
                    SC.sfx.play('upgrade');
                    toast(newSpec ? `⚡ Specialized into ${SC.emojiOf(newSpec)} ${SC.nameOf(newSpec)} (1.5× speed)` : 'Reset to Generalist', 'info');
                    const tooltipEl = $('inspect-tooltip');
                    if (tooltipEl && !tooltipEl.classList.contains('hidden') && U.inspectTooltipHTML) {
                        tooltipEl.innerHTML = U.inspectTooltipHTML(SC.inspect.infoFor(node));
                    }
                }
            }
        });
    }
})();
