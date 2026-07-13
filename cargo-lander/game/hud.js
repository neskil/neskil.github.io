// CargoLander — in-mission HUD & on-screen UI chrome (DOM):
// HUD bars/panels (updateHUD), mission quest panel (updateMissionPanel),
// notification chips (addMessage), HUD collapse (toggleUI), UI scale.
// Mixed onto CargoGame.prototype — loaded after game.js and BEFORE render.js
// (render.js instantiates window.game). Same pattern as render/*.js.

Object.assign(CargoGame.prototype, {

    toggleUI() {
        this.uiCollapsed = !this.uiCollapsed;
        
        const vitals = document.getElementById('vitals-panel');
        const leftPanel = document.getElementById('hud-left-panel');
        const radarContainer = document.getElementById('radar-container');
        const hudToolbar = document.getElementById('hud-toolbar');
        const optionsBtn = document.getElementById('hud-options-btn');
        
        if (this.uiCollapsed) {
            if (vitals) vitals.style.display = 'none';
            if (leftPanel) leftPanel.style.display = 'none';
            if (radarContainer) radarContainer.style.display = 'none';
            if (hudToolbar) hudToolbar.style.display = 'none';
            if (optionsBtn) optionsBtn.style.display = 'none';
            
            const dropdown = document.getElementById('options-dropdown');
            if (dropdown) dropdown.style.display = 'none';
            
            const eyeBtn = document.getElementById('hide-ui-btn');
            if (eyeBtn) {
                eyeBtn.style.opacity = '0.5';
                eyeBtn.textContent = '👁 Show UI';
                eyeBtn.title = 'Show UI';
            }
        } else {
            if (vitals) vitals.style.display = 'grid';
            if (leftPanel) leftPanel.style.display = 'flex';
            if (radarContainer) radarContainer.style.display = 'block';
            if (hudToolbar) hudToolbar.style.display = 'flex';
            if (optionsBtn) optionsBtn.style.display = 'inline-flex';
            
            const eyeBtn = document.getElementById('hide-ui-btn');
            if (eyeBtn) {
                eyeBtn.style.opacity = '1';
                eyeBtn.textContent = '👁 Hide UI';
                eyeBtn.title = 'Hide UI';
            }
        }
    },

    // Picks a sensible first-run UI Scale from viewport size instead of always
    // defaulting to 100%. Mobile landscape (short height) is the tightest case —
    // the HUD panels stack vertically down the left/right edges, so a short
    // window runs out of vertical room fastest.
    computeDefaultUIScale() {
        const w = window.innerWidth, h = window.innerHeight;
        const shortestSide = Math.min(w, h);
        if (h <= 420) return 0.72;             // short mobile-landscape window
        if (shortestSide <= 480) return 0.8;   // phone-sized, either orientation
        if (shortestSide <= 820) return 0.9;   // small tablet
        return 1.0;
    },

    setUIScale(val) {
        this.uiScale = parseFloat(val);
        
        const valText = document.getElementById('ui-scale-val');
        if (valText) valText.textContent = Math.round(this.uiScale * 100) + '%';
        
        const slider = document.getElementById('ui-scale-slider');
        if (slider) slider.value = this.uiScale;
        
        const vitals = document.getElementById('vitals-panel');
        const leftPanel = document.getElementById('hud-left-panel');
        const rightPanel = document.getElementById('hud-right-panel');
        
        if (vitals) {
            vitals.style.transform = `scale(${this.uiScale})`;
            vitals.style.transformOrigin = 'top center';
        }
        if (leftPanel) {
            leftPanel.style.transform = `scale(${this.uiScale})`;
            leftPanel.style.transformOrigin = 'top left';
        }
        if (rightPanel) {
            rightPanel.style.transform = `scale(${this.uiScale})`;
            rightPanel.style.transformOrigin = 'top right';
        }
        
        localStorage.setItem('cargo_lander_ui_scale', this.uiScale);
    },

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    addMessage(text, color = '#f8fafc') {
        const container = this.uiElements?.notificationsContainer || document.getElementById('notifications-container');
        if (!container) return;

        const isTutorial = text.startsWith('TUTORIAL:');
        const label = isTutorial ? text.replace('TUTORIAL: ', '') : text;

        const el = document.createElement('div');
        el.style.cssText = `font: 600 12px Outfit,sans-serif; color: ${color}; background: rgba(6,20,16,0.85); border: 1px solid ${color}66; border-radius: 8px; padding: 6px 12px; white-space: nowrap; opacity: 1; transition: opacity 0.5s; text-shadow: 0 1px 2px rgba(0,0,0,0.8);`;
        el.textContent = isTutorial ? '💡 ' + label : label;
        container.appendChild(el);

        const duration = isTutorial ? 8000 : 4000;
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        }, duration);

        while (container.children.length > 5) {
            container.firstChild.remove();
        }
    },

    updateHUD() {
        const centerOverlay = document.getElementById('center-extract-overlay');
        if (this.gameState !== 'playing') {
            if (centerOverlay) centerOverlay.style.display = 'none';
            return;
        }

        const lander = this.physics.lander;
        const level = levels[this.currentLevelIndex];

        if (!lander) return;

        // Set Fuel Gauge
        const fuelPercent = Math.max(0, (lander.fuel / lander.maxFuel) * 100);
        const fuelFill = this.uiElements?.fuelFill || document.getElementById('fuel-fill');
        const lowFuelWarn = this.uiElements?.lowFuelWarning || document.getElementById('low-fuel-warning');
        if (fuelFill) {
            fuelFill.style.width = `${fuelPercent}%`;
            // Change color if critical
            if (fuelPercent < 25) {
                fuelFill.style.background = '#ef4444';
                if (lowFuelWarn) {
                    lowFuelWarn.classList.remove('hidden');
                    // Blink effect
                    lowFuelWarn.style.opacity = (Math.floor(Date.now() / 250) % 2 === 0) ? '1' : '0.3';
                }
                if (!this.isMuted) CargoAudio.setWarning(true);
            } else {
                fuelFill.style.background = '#38bdf8';
                if (lowFuelWarn) lowFuelWarn.classList.add('hidden');
                if (!this.isMuted) CargoAudio.setWarning(false);
            }
        }

        // Set Hull Health Gauge
        const healthPercent = Math.max(0, (lander.integrity / lander.maxIntegrity) * 100);
        const healthFill = this.uiElements?.healthFill || document.getElementById('health-fill');
        if (healthFill) {
            healthFill.style.width = `${healthPercent}%`;
            if (healthPercent < 30) {
                healthFill.style.background = '#ef4444';
            } else {
                healthFill.style.background = '#10b981';
            }
        }

        // Shield charge gauge — the row only appears once the Shield
        // Generator upgrade is owned. Fill tracks lander.shieldCharge and
        // flashes bright for the moments a hit is being absorbed
        // (shieldHitFlash, set by applyDamage in physics/entities.js).
        const shieldRow = document.getElementById('shield-row');
        if (shieldRow) {
            const hasShield = (this.upgrades?.shieldRegen || 0) > 0;
            if (hasShield) {
                shieldRow.classList.remove('hidden');
                const shieldFill = document.getElementById('shield-fill');
                if (shieldFill) {
                    const max = lander.maxShieldCharge || 0;
                    const pct = max > 0 ? Math.max(0, Math.min(100, ((lander.shieldCharge || 0) / max) * 100)) : 0;
                    shieldFill.style.width = `${pct}%`;
                    let bg = 'linear-gradient(90deg, #38bdf8, #818cf8)';
                    if (lander.shieldHitFlash > 0) {
                        bg = '#e0f2fe';
                    }
                    
                    if (lander.shieldDelay > 0) {
                        const blink = Math.floor(Date.now() / 150) % 2 === 0;
                        shieldFill.style.opacity = blink ? '0.3' : '0.8';
                    } else {
                        shieldFill.style.opacity = '1';
                    }
                    
                    shieldFill.style.background = bg;
                }
            } else {
                shieldRow.classList.add('hidden');
            }
        }

        // Update Cargo & Budget stats
        const cargoEl = this.uiElements?.hudCargo || document.getElementById('hud-cargo');
        if (cargoEl) {
            cargoEl.textContent = `Cargo: ${this.deliveredCount}/${level.targetCargo}`;
        }
        const budgetEl = this.uiElements?.hudBudget || document.getElementById('hud-budget');
        if (budgetEl) {
            budgetEl.textContent = `Deposit: $${this.missionBudget}`;
        }
        const timeEl = this.uiElements?.hudTime || document.getElementById('hud-time');
        if (timeEl) {
            if (this.overtimeActive) {
                const ot = Math.ceil(this.overtimeTimer);
                timeEl.textContent = `⚠ ${ot}s`;
                timeEl.style.color = (Math.floor(Date.now() / 300) % 2 === 0) ? '#ef4444' : '#fbbf24';
            } else {
                const mins = Math.floor(this.missionTimer / 60);
                const secs = Math.floor(this.missionTimer % 60);
                timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                timeEl.style.color = this.missionTimer < 20 ? '#ef4444' : '#f59e0b';
            }
        }

        // Toggle extraction button — must be at HQ to activate
        const btnExtract = this.uiElements?.btnExtract || document.getElementById('btn-extract');
        const centerOverlay = document.getElementById('center-extract-overlay');
        const centerBtn = document.getElementById('center-extract-btn');
        const centerDesc = document.getElementById('center-extract-desc');
        const centerTitle = document.getElementById('center-extract-title');
        
        if (btnExtract) {
            const allDelivered = this.deliveredCount >= level.targetCargo;
            const atHQ = lander && lander.landed && lander.currentPad === 'start';
            const isLandedAnywhere = lander && lander.landed;

            const svcContainer = document.getElementById('hq-services-container');

            if (atHQ) {
                if (centerOverlay) {
                    centerOverlay.style.display = 'flex';
                    if (svcContainer) svcContainer.style.display = 'flex';
                    
                    if (allDelivered) {
                        centerOverlay.style.borderColor = '#10b981';
                        if (centerTitle) {
                            centerTitle.textContent = 'Mission Complete';
                            centerTitle.style.color = '#10b981';
                        }
                        if (centerDesc) centerDesc.textContent = 'All cargo delivered safely.';
                        if (centerBtn) {
                            centerBtn.style.display = 'block';
                            centerBtn.textContent = '[SPACE] TO EXTRACT';
                            centerBtn.style.background = '#10b981';
                            centerBtn.style.borderColor = '#059669';
                            centerBtn.style.boxShadow = '0 0 20px rgba(16,185,129,0.7)';
                        }
                        
                        btnExtract.classList.remove('hidden');
                        btnExtract.textContent = '✓ EXTRACT NOW';
                        btnExtract.style.background = '#10b981';
                        btnExtract.style.opacity = '1';
                        btnExtract.style.cursor = 'pointer';
                    } else {
                        const justStarted = !this.overtimeActive && (this.missionTimeLimit - this.missionTimer) < 10;
                        centerOverlay.style.borderColor = '#38bdf8';
                        if (centerTitle) {
                            centerTitle.textContent = 'HQ Services';
                            centerTitle.style.color = '#38bdf8';
                        }
                        if (centerDesc) centerDesc.textContent = 'Landed at HQ.';
                        if (centerBtn) {
                            centerBtn.style.display = justStarted ? 'none' : 'block';
                            if (!justStarted) {
                                centerBtn.textContent = 'ABORT & EXTRACT';
                                centerBtn.style.background = '#ef4444';
                                centerBtn.style.borderColor = '#b91c1c';
                                centerBtn.style.boxShadow = 'none';
                            }
                        }
                        
                        if (justStarted) {
                            btnExtract.classList.add('hidden');
                        } else {
                            btnExtract.classList.remove('hidden');
                            btnExtract.textContent = 'ABORT & EXTRACT';
                            btnExtract.style.background = '#ef4444';
                            btnExtract.style.opacity = '1';
                            btnExtract.style.cursor = 'pointer';
                        }
                    }
                    
                    const btnRefuel = document.getElementById('btn-hq-refuel');
                    const btnRepair = document.getElementById('btn-hq-repair');
                    if (btnRefuel) {
                        const needsFuel = lander.fuel < lander.maxFuel;
                        const canAfford = this.missionBudget >= 100;
                        btnRefuel.disabled = !needsFuel || !canAfford;
                        btnRefuel.style.opacity = btnRefuel.disabled ? '0.5' : '1';
                        btnRefuel.style.cursor = btnRefuel.disabled ? 'not-allowed' : 'pointer';
                    }
                    if (btnRepair) {
                        const hasKit = (this.upgrades?.repairKit || 0) > 0;
                        const cap = this.getRepairCap(lander);
                        const needsRepair = hasKit && lander.integrity < cap;
                        const repairCost = this.getRepairCost(lander);
                        const canAfford = this.missionBudget >= repairCost;
                        btnRepair.disabled = !needsRepair || !canAfford;
                        btnRepair.style.opacity = btnRepair.disabled ? '0.5' : '1';
                        btnRepair.style.cursor = btnRepair.disabled ? 'not-allowed' : 'pointer';
                        btnRepair.textContent = !hasKit ? '🔒 Repair (needs Repair Kit)' : (needsRepair ? `🔧 Repair ($${repairCost})` : '🔧 Repair');
                    }
                }
            } else if (allDelivered) {
                btnExtract.classList.remove('hidden');
                btnExtract.textContent = 'Return to HQ';
                btnExtract.style.background = '#334155';
                btnExtract.style.opacity = '0.7';
                btnExtract.style.cursor = 'default';

                if (centerOverlay && isLandedAnywhere) {
                    centerOverlay.style.display = 'flex';
                    if (svcContainer) svcContainer.style.display = 'none';
                    centerOverlay.style.borderColor = '#38bdf8';
                    if (centerTitle) {
                        centerTitle.textContent = 'All Cargo Delivered!';
                        centerTitle.style.color = '#38bdf8';
                    }
                    if (centerDesc) centerDesc.textContent = 'Return to HQ to extract and finish the mission.';
                    if (centerBtn) centerBtn.style.display = 'none';
                } else if (centerOverlay) {
                    centerOverlay.style.display = 'none';
                }
            } else {
                btnExtract.classList.add('hidden');
                if (centerOverlay) centerOverlay.style.display = 'none';
            }
        }
    },

    // Phone-sized viewport check — matches the "Compact HUD" CSS media query
    // in index.html (@media (max-height: 500px), (max-width: 480px)) so the
    // JS auto-collapse and the CSS compaction always trigger together.
    // Deliberately size-based, not touch detection, so it's exercisable by
    // resizing a desktop browser.
    isSmallViewport() {
        return window.innerHeight <= 500 || window.innerWidth <= 480;
    },

    // Tap the mission panel to toggle between the full card and a slim chip
    // (time · budget · cargo). Manually opening it pins it open (no
    // auto-collapse); manually closing it unpins, so the next mission event
    // pops it open again. Wired via onclick on #mission-panel in index.html.
    toggleMissionPanel() {
        this.missionPanelCollapsed = !this.missionPanelCollapsed;
        this.missionPanelPinned = !this.missionPanelCollapsed;
        this._missionAutoCollapseAt = 0;
        const panel = document.getElementById('mission-panel');
        if (panel) delete panel.dataset.fp; // force rebuild this frame
    },

    updateMissionPanel() {
        const level = levels[this.currentLevelIndex];
        if (!level) return;

        const panel = document.getElementById('mission-panel');
        if (!panel) return;

        // Destruct button visibility (runs regardless of collapse state)
        const btnDestruct = this.uiElements?.btnDestruct || document.getElementById('btn-destruct');
        if (btnDestruct) {
            if (this.gameState === 'playing') btnDestruct.classList.remove('hidden');
            else btnDestruct.classList.add('hidden');
        }

        // ── Time & budget values ──────────────────────────────────────────
        let timeStr, timeColor;
        if (this.overtimeActive) {
            const ot = Math.ceil(this.overtimeTimer);
            timeStr = `⚠ ${ot}s`;
            timeColor = (Math.floor(Date.now() / 300) % 2 === 0) ? '#ef4444' : '#fbbf24';
        } else {
            const mins = Math.floor(this.missionTimer / 60);
            const secs = Math.floor(this.missionTimer % 60);
            timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            timeColor = this.missionTimer < 20 ? '#ef4444' : '#f59e0b';
        }
        const budgetStr = `$${Math.floor(this.missionBudget).toLocaleString()}`;

        // ── Cargo icons (only rebuild on change) ─────────────────────────
        const target = level.targetCargo || 0;
        const delivered = this.deliveredCount;
        let cargoIconsHTML = '';
        for (let i = 0; i < target; i++) {
            const done = i < delivered;
            cargoIconsHTML += `<span style="font-size:16px;transition:opacity .4s,filter .4s;opacity:${done?'1':'0.18'};filter:${done?'none':'grayscale(1)'};display:inline-block;">📦</span>`;
        }

        // ── Bonus quests (non-primary) ────────────────────────────────────
        const bonusQuests = (level.quests || []).filter(q => q.type !== 'primary');
        let bonusHTML = '';
        if (bonusQuests.length) {
            bonusHTML = `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07);">
                <div style="font-size:9px;letter-spacing:.1em;color:rgba(148,163,184,0.7);text-transform:uppercase;margin-bottom:4px;">Bonus</div>`;
            for (const q of bonusQuests) {
                const state = this.questState[q.id];
                let icon = '◇', iconColor = '#94a3b8', textColor = 'rgba(148,163,184,0.75)';
                if (state?.completed) { icon = '✓'; iconColor = '#10b981'; textColor = 'rgba(16,185,129,0.85)'; }
                else if (state?.failed) { icon = '✗'; iconColor = '#ef4444'; textColor = 'rgba(239,68,68,0.75)'; }
                bonusHTML += `<div style="display:flex;gap:5px;align-items:flex-start;font-size:11px;margin-bottom:2px;">
                    <span style="color:${iconColor};flex-shrink:0;">${icon}</span>
                    <span style="color:${textColor};">${q.text}${q.reward ? `<span style="color:#10b981;"> +$${q.reward}</span>` : ''}</span>
                </div>`;
            }
            bonusHTML += `</div>`;
        }

        // ── Primary quest label ───────────────────────────────────────────
        const allDelivered = delivered >= target;
        const primaryColor = allDelivered ? '#10b981' : '#f8fafc';
        const primaryLabel = allDelivered ? '✓ All cargo delivered!' : (level.quests?.find(q=>q.type==='primary')?.text || `Deliver ${target} cargo`);

        // ── Auto expand/collapse (other-games-style mission card) ─────────
        // The panel pops open on mission events (a delivery, a bonus quest
        // resolving, overtime starting) and — on phone-sized viewports only —
        // auto-shrinks to the chip a few seconds later. _missionEventFp is
        // reset in startLevel() so mission start counts as an event.
        const bonusFp = (level.quests || []).map(q => {
            const s = this.questState[q.id];
            return s?.completed ? 'c' : s?.failed ? 'f' : '-';
        }).join('');
        const eventFp = `${delivered}|${target}|${this.overtimeActive}|${bonusFp}`;
        if (this._missionEventFp !== eventFp) {
            this._missionEventFp = eventFp;
            if (!this.missionPanelPinned) {
                this.missionPanelCollapsed = false;
                this._missionAutoCollapseAt = this.isSmallViewport() ? Date.now() + 5000 : 0;
            }
        }
        if (this._missionAutoCollapseAt && Date.now() >= this._missionAutoCollapseAt) {
            this._missionAutoCollapseAt = 0;
            if (!this.missionPanelPinned) this.missionPanelCollapsed = true;
        }

        // ── Collapsed: slim tappable chip (no level name, just live stats) ─
        if (this.missionPanelCollapsed) {
            const fp = `C|${timeStr}|${budgetStr}|${delivered}|${target}|${timeColor}`;
            if (panel.dataset.fp === fp) return;
            panel.dataset.fp = fp;
            panel.style.minWidth = '0';
            panel.style.cursor = 'pointer';
            panel.innerHTML = `
                <div style="display:flex;align-items:center;gap:9px;white-space:nowrap;">
                    <span style="font-size:10px;color:rgba(148,163,184,0.8);">▸</span>
                    <span style="font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;color:${timeColor};">${timeStr}</span>
                    <span style="font-size:14px;font-weight:700;color:#10b981;">${budgetStr}</span>
                    <span style="font-size:13px;font-weight:700;color:${primaryColor};">📦 ${delivered}/${target}</span>
                </div>`;
            return;
        }

        // ── Full panel HTML ───────────────────────────────────────────────
        // Use dataset fingerprint to avoid full rebuilds on every frame
        const fp = `${timeStr}|${budgetStr}|${delivered}|${target}|${timeColor}`;
        if (panel.dataset.fp === fp) return; // nothing changed visually
        panel.dataset.fp = fp;
        panel.style.minWidth = this.isSmallViewport() ? '200px' : '240px';
        panel.style.cursor = 'pointer';

        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-size:9px;letter-spacing:.12em;color:rgba(56,189,248,0.7);text-transform:uppercase;">Mission</span>
                <span style="font-size:10px;color:rgba(148,163,184,0.6);">▾</span>
            </div>
            <div style="font-weight:700;font-size:14px;color:rgba(248,250,252,0.95);margin-bottom:6px;line-height:1.2;">${level.missionTitle || level.name || ''}</div>

            <!-- Key stats: time + budget side-by-side -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px;">
                <div style="background:rgba(0,0,0,0.25);border-radius:6px;padding:4px 7px;">
                    <div style="font-size:9px;color:rgba(148,163,184,0.7);letter-spacing:.08em;text-transform:uppercase;">Time</div>
                    <div id="mission-stat-time" style="font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;color:${timeColor};line-height:1.1;">${timeStr}</div>
                </div>
                <div style="background:rgba(0,0,0,0.25);border-radius:6px;padding:4px 7px;">
                    <div style="font-size:9px;color:rgba(148,163,184,0.7);letter-spacing:.08em;text-transform:uppercase;">Deposit</div>
                    <div id="mission-stat-budget" style="font-size:17px;font-weight:700;color:#10b981;line-height:1.1;">${budgetStr}</div>
                </div>
            </div>

            <!-- Primary objective: cargo delivery icons -->
            <div style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.15);border-radius:6px;padding:5px 7px;">
                <div style="font-size:9px;color:rgba(148,163,184,0.7);letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;">Cargo</div>
                <div style="display:flex;gap:2px;flex-wrap:wrap;align-items:center;">
                    ${cargoIconsHTML}
                    <span style="margin-left:4px;font-size:12px;font-weight:700;color:${primaryColor};">${delivered}/${target}</span>
                </div>
                <div style="font-size:11px;color:${primaryColor};margin-top:2px;opacity:0.85;">${primaryLabel}</div>
            </div>

            ${bonusHTML}`;
    },

});
