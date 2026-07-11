// CargoLander — menu & meta-game DOM screens: mission grid (generateMissionUI),
// main-menu refresh, pilot career/rank, settings modal, vehicle select,
// procedural-mission config, upgrade shop, custom-level upload, dev panel.
// Mixed onto CargoGame.prototype — loaded after game.js and BEFORE render.js
// (render.js instantiates window.game). Same pattern as render/*.js.

Object.assign(CargoGame.prototype, {

    // Populate the pilot-license card, upgrade chips, highscore list & badges
    generateMissionUI() {
        const grid = document.getElementById('mission-grid');
        const devPanel = document.querySelector('#dev-panel .dev-row');
        if (!grid || !devPanel) return;
        
        // Fixed buttons (procedural, custom level) live in #extra-modes-grid
        // below the mission grid, so the grid can be rebuilt wholesale.
        grid.innerHTML = '';
        
        const devButtons = Array.from(devPanel.children).filter(btn => btn.tagName !== 'BUTTON');
        devPanel.innerHTML = '';

        const themes = [
            { color: '#10b981', prefix: '', suffix: '' }, // L1
            { color: '#10b981', prefix: '', suffix: '' }, // L2
            { color: '#10b981', prefix: '', suffix: '' }, // L3
            { color: '#10b981', prefix: '', suffix: '' }, // L4
            { color: 'var(--neon-blue)', badgeColor: '#38bdf8', prefix: '🔵 ', suffix: ' · Elite' }, // L5
            { color: '#f59e0b', prefix: '🏜️ ', suffix: ' · Boss' }, // L6
            { color: '#a855f7', prefix: '🌌 ', suffix: ' · Endurance' }, // L7
            { color: '#ec4899', prefix: '🛰️ ', suffix: ' · Finale' }, // L8
            { color: '#ef4444', prefix: '🔥 ', suffix: ' · Chaos' }, // L9
        ];

        levels.forEach((lv, i) => {
            if (lv.name.includes('TEST')) return;
            
            const theme = themes[i] || { color: '#10b981', prefix: '', suffix: '' };
            const badgeColor = theme.badgeColor || theme.color;
            
            const parts = lv.name.split(':');
            const numPart = parts[0] ? parts[0].trim().replace('L', 'Mission ') : `Mission ${i+1}`;
            const title = lv.missionTitle || (parts[1] ? parts[1].trim() : lv.name);
            
            // Main Menu Button
            const btn = document.createElement('button');
            btn.className = 'btn-level';
            btn.id = 'mission-btn-' + i;
            btn.onclick = () => this.showVehicleSelection(i);
            if (theme.color !== '#10b981') btn.style.borderColor = theme.color;
            
            btn.innerHTML = `
                <span class="num" style="color: ${theme.color};">${theme.prefix}${numPart}${theme.suffix}</span>
                ${title}
                <span id="hs-badge-${i}" style="font-size:0.65rem; color:${badgeColor}; font-weight:600; margin-top:2px;"></span>
            `;
            grid.appendChild(btn);
            
            // Dev Panel Button
            const devBtn = document.createElement('button');
            devBtn.onclick = () => this.startLevel(i);
            devBtn.style.cssText = 'background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#a5b4fc;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px;';
            devBtn.textContent = `L${i+1}`;
            devPanel.appendChild(devBtn);
        });
        
        devButtons.forEach(btn => devPanel.appendChild(btn));
    },

    refreshMenuUI() {
        this.refreshVehicleLicenseUI();
        
        // --- Economy Checks ---
        if (this.globalCash < -5000) {
            // Trigger Repo Man Game Over
            this.upgrades = {
                thrusterEfficiency: 0,
                boostMode: 0,
                magneticDeck: 0,
                aerodynamics: 0,
                hullPlating: 0,
                shieldRegen: 0
            };
            this.globalCash = 1000;
            localStorage.setItem('cargoLanderCash', this.globalCash);
            localStorage.setItem('cargoLanderUpgrades', JSON.stringify(this.upgrades));
            this.saveCareer(); // We don't reset scores, just save the fact that upgrades reset
            
            const repoModal = document.getElementById('repo-man-modal');
            if (repoModal) repoModal.style.display = 'flex';
        } else if (this.globalCash < 0 && !localStorage.getItem('cargoLanderHasSeenNegativeWarning')) {
            localStorage.setItem('cargoLanderHasSeenNegativeWarning', '1');
            const warnModal = document.getElementById('negative-cash-warning');
            if (warnModal) warnModal.style.display = 'flex';
        }
        
        // Drone tutorial prompt
        const dronePointer = document.getElementById('drone-tutorial-pointer');
        if (dronePointer) {
            if (this.career.missionsComplete >= 2 && !this.career.hasUsedDrone && this.currentVehicle !== 'drone') {
                dronePointer.style.display = 'block';
            } else {
                dronePointer.style.display = 'none';
            }
        }

        // Pilot name (don't clobber while the user is typing in it)
        const nameInput = document.getElementById('pilot-name-input');
        if (nameInput && document.activeElement !== nameInput) {
            nameInput.value = this.career.pilotName || '';
        }

        // Career stat cells
        this.setText('lc-cash', '$' + this.globalCash.toLocaleString());
        this.setText('lc-deliveries', this.career.totalDeliveries);
        this.setText('lc-missions', this.career.missionsComplete);
        this.setText('lc-crashes', this.career.crashes);
        this.updatePilotRank();

        // Installed upgrade chips
        const upgEl = document.getElementById('lc-upgrades');
        if (upgEl) {
            const owned = upgradeCatalog.filter(u => (this.upgrades[u.id] || 0) > 0);
            upgEl.innerHTML = owned.length
                ? owned.map(u => `<span class="upgrade-chip">${u.name} L${this.upgrades[u.id]}</span>`).join('')
                : '<span style="color:var(--text-secondary); font-size:0.75rem;">None installed yet</span>';
        }

        // Highscores list + per-mission badges
        const hsList = document.getElementById('hs-list');
        if (hsList) {
            hsList.innerHTML = levels.map((lv, i) => {
                if (lv.name === 'TEST: Sandbox') return '';
                const best = this.highscores[i];
                return `<div class="hs-row"><span>${lv.name}</span><span class="hs-val">${best ? '$' + best.toLocaleString() : '—'}</span></div>`;
            }).join('');
        }
        levels.forEach((lv, i) => {
            const badge = document.getElementById('hs-badge-' + i);
            const unlocked = this.isLevelUnlocked(i);
            const btn = document.getElementById('mission-btn-' + i);
            if (btn) {
                btn.classList.toggle('locked-mission', !unlocked);
                btn.disabled = !unlocked;
            }
            if (badge) {
                badge.textContent = !unlocked ? '🔒 Complete the previous mission to unlock'
                    : (this.highscores[i] ? 'Best: $' + this.highscores[i].toLocaleString() : '');
            }
        });
    },

    // Campaign missions unlock in order; the Dev Panel's direct level-jump buttons
    // (game.startLevel(i)) bypass this entirely, which is the intended dev escape hatch.
    // Procedural/custom levels (non-numeric idx) are always available.
    isLevelUnlocked(idx) {
        if (this.devUnlockAll) return true;
        if (typeof idx !== 'number') return true;
        if (idx <= 0) return true;
        return !!this.highscores[idx - 1];
    },

    setDevUnlockAll(checked) {
        this.devUnlockAll = checked;
        this.refreshMenuUI();
    },

    updatePilotRank() {
        // Score = upgrade progress (0-13 levels total) + per-level 5000+ bonus (0-5)
        const maxUpgrades = upgradeCatalog.reduce((s, u) => s + u.maxLevel, 0); // 13
        const ownedLevels = upgradeCatalog.reduce((s, u) => s + (this.upgrades[u.id] || 0), 0);
        const upgScore = ownedLevels / maxUpgrades; // 0..1

        const levelsMastered = levels.filter((_, i) => (this.highscores[i] || 0) >= 5000).length;
        const masterScore = levelsMastered / levels.length; // 0..1

        // Combined score 0..1, upgrades weighted slightly more
        const score = upgScore * 0.55 + masterScore * 0.45;

        let rank, tier;
        if (score >= 0.90) { rank = 'Logistics Legend'; tier = 'CLASS S'; }
        else if (score >= 0.70) { rank = 'Fleet Commander'; tier = 'CLASS A'; }
        else if (score >= 0.50) { rank = 'Senior Pilot'; tier = 'CLASS B'; }
        else if (score >= 0.30) { rank = 'Cargo Pilot'; tier = 'CLASS C'; }
        else if (score >= 0.12) { rank = 'Junior Hauler'; tier = 'CLASS D'; }
        else if (score >= 0.01) { rank = 'Cadet Hauler'; tier = 'CLASS E'; }
        else { rank = 'Rookie Hauler'; tier = 'CLASS F'; }

        this.setText('pilot-rank', rank);
        this.setText('pilot-tier', tier);
    },

    updatePilotName(value) {
        this.career.pilotName = value;
        this.saveCareer();
    },

    confirmResetCareer() {
        if (!confirm('Reset your entire career? This wipes cash, upgrades, deliveries, and high scores. This cannot be undone.')) {
            return;
        }
        this.globalCash = 1000;
        this.upgrades = {
            thrusterEfficiency: 0,
            boostMode: 0,
            magneticDeck: 0,
            aerodynamics: 0,
            hullPlating: 0,
            shieldRegen: 0
        };
        this.career = { pilotName: this.career.pilotName, totalDeliveries: 0, missionsComplete: 0, crashes: 0 };
        this.highscores = {};

        localStorage.setItem('cargoLanderCash', this.globalCash);
        localStorage.setItem('cargoLanderUpgrades', JSON.stringify(this.upgrades));
        this.saveCareer();
        this.saveHighscores();

        this.refreshMenuUI();
    },

    // ---- Audio settings modal ----
    openSettings() {
        const s = document.getElementById('settings-screen');
        if (!s) return;
        // Sync controls to the actual current audio state
        const muteCb = document.getElementById('setting-mute');
        if (muteCb) muteCb.checked = this.isMuted;

        const postFXCb = document.getElementById('setting-postfx');
        if (postFXCb) postFXCb.checked = this.postFXEnabled;

        const joystickCb = document.getElementById('setting-joystick');
        if (joystickCb) joystickCb.checked = this.touchJoystickEnabled;

        const mv = Math.round(CargoAudio.musicVolume * 100);
        const sv = Math.round(CargoAudio.sfxVolume * 100);
        const musicSlider = document.getElementById('setting-music-vol');
        const sfxSlider = document.getElementById('setting-sfx-vol');
        if (musicSlider) musicSlider.value = mv;
        if (sfxSlider) sfxSlider.value = sv;
        this.setText('music-vol-val', mv + '%');
        this.setText('sfx-vol-val', sv + '%');

        s.style.display = 'flex';
    },

    closeSettings() {
        const s = document.getElementById('settings-screen');
        if (s) s.style.display = 'none';
    },

    toggleMuteFromCheckbox(checked) {
        this.isMuted = checked;
        if (window.CargoAudio) CargoAudio.setMuted(checked);
    },

    setZoomModifier(value) {
        this.zoomModifier = value;
        const label = document.getElementById('zoom-value-label');
        if (label) label.textContent = value.toFixed(1) + 'x';
    },

    setPostFXEnabled(checked) {
        this.postFXEnabled = checked;
        localStorage.setItem('cargoLanderPostFX', checked ? '1' : '0');
    },

    setTouchJoystickEnabled(checked) {
        this.touchJoystickEnabled = checked;
        localStorage.setItem('cargoLanderTouchJoystick', checked ? '1' : '0');
        if (window.applyTouchControlMode) window.applyTouchControlMode(checked);
    },

    setMusicVolume(value) {
        const v = parseInt(value, 10);
        this.setText('music-vol-val', v + '%');
        if (window.CargoAudio) CargoAudio.setMusicVolume(v / 100);
    },

    setSFXVolume(value) {
        const v = parseInt(value, 10);
        this.setText('sfx-vol-val', v + '%');
        if (window.CargoAudio) CargoAudio.setSFXVolume(v / 100);
    },

    // Vehicle is now picked once on the main menu (like a pilot's license) instead
    // of on a per-mission screen — clicking a mission loads straight into it.
    showVehicleSelection(idx) {
        if (!this.isLevelUnlocked(idx)) return;
        this.selectedLevelIndex = idx;
        this.startLevel(idx, this.currentVehicle);
    },

    setSelectedVehicle(vehicleType) {
        this.currentVehicle = vehicleType;
        localStorage.setItem('cargoLanderVehicle', vehicleType);
        
        if (vehicleType === 'drone') {
            this.career.hasUsedDrone = true;
            this.saveCareer();
        }
        
        this.refreshVehicleLicenseUI();
        this.refreshMenuUI(); // Refresh menu so tutorial pointer can disappear
    },

    refreshVehicleLicenseUI() {
        const basicBtn = document.getElementById('vehicle-license-basic');
        const droneBtn = document.getElementById('vehicle-license-drone');
        if (basicBtn) basicBtn.classList.toggle('vehicle-selected', this.currentVehicle === 'basic');
        if (droneBtn) droneBtn.classList.toggle('vehicle-selected', this.currentVehicle === 'drone');
        
        this.drawVehicleCanvases();
    },

    drawVehicleCanvases() {
        if (!this.drawLander) return; // Wait until render script is loaded

        const renderModel = (canvasId, type) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2 + 10);
            
            // scale down slightly
            ctx.scale(0.8, 0.8);

            // Mock game context and physics lander
            const oldCtx = this.ctx;
            const oldLander = this.physics ? this.physics.lander : null;
            
            this.ctx = ctx;
            if (!this.physics) this.physics = {};
            this.physics.lander = {
                x: 0, y: 0, angle: 0,
                vehicleType: type,
                fuel: 1, maxFuel: 1,
                thrustMagnitude: 0,
                leftThrustRatio: 0,
                rightThrustRatio: 0,
                legCompress: 0,
                integrity: 100, maxIntegrity: 100,
                ropeLength: 0, ropeMax: 100,
                winchEngaged: false
            };
            
            // Need a valid upgrade object for drawLander
            if (!this.upgrades) this.upgrades = {};
            
            try {
                this.drawLander();
            } catch (e) {
                console.error("Failed to draw menu lander:", e);
            }
            
            this.ctx = oldCtx;
            this.physics.lander = oldLander;
            ctx.restore();
        };

        renderModel('canvas-vehicle-basic', 'basic');
        renderModel('canvas-vehicle-drone', 'drone');
        renderModel('canvas-vehicle-basic-large', 'basic');
        renderModel('canvas-vehicle-drone-large', 'drone');
    },

    startLevelWithVehicle(vehicleType) {
        document.getElementById('vehicle-screen').style.display = 'none';
        this.startLevel(this.selectedLevelIndex, vehicleType);
    },

    // ---- Procedural mission difficulty picker ----
    // Replaces 3 separate "Procedural Normal/Crazy/Insane" mission buttons with one
    // entry + a slider, since generateProceduralLevel() already takes a 1-3 craziness
    // tier — the 3 buttons were just three hardcoded calls into the same knob.
    openProceduralConfig() {
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('procedural-config-screen').style.display = 'flex';
        const slider = document.getElementById('proc-difficulty-slider');
        if (slider) slider.value = 1;
        this.updateProceduralConfigLabel(1);
    },

    updateProceduralConfigLabel(value) {
        const tier = parseInt(value, 10);
        const labels = { 1: 'Standard', 2: 'Crazy', 3: 'Insane' };
        const descs = {
            1: 'Standard length and hazard frequency — a good default run.',
            2: 'Longer terrain and more frequent hazards for an experienced pilot.',
            3: 'Maximum length, hazard density, and difficulty. Good luck.'
        };
        const colors = { 1: '#4ade80', 2: '#f59e0b', 3: '#f43f5e' };
        this.setText('proc-difficulty-label', labels[tier]);
        this.setText('proc-difficulty-desc', descs[tier]);
        const label = document.getElementById('proc-difficulty-label');
        if (label) label.style.color = colors[tier];
    },

    launchProceduralMission() {
        const tier = document.getElementById('proc-difficulty-slider')?.value || 1;
        document.getElementById('procedural-config-screen').style.display = 'none';
        this.showVehicleSelection('random' + tier);
    },

    openUpgradeShop() {
        document.getElementById('menu-screen').style.display = 'none';
        const completeScreen = document.getElementById('complete-screen');
        if (completeScreen) completeScreen.style.display = 'none';
        document.getElementById('upgrade-screen').style.display = 'flex';
        this.renderUpgradeShop();
    },

    renderUpgradeShop() {
        document.getElementById('shop-cash-display').textContent = this.globalCash;
        const grid = document.getElementById('upgrade-grid');
        grid.innerHTML = '';

        upgradeCatalog.forEach(upg => {
            const currentLvl = this.upgrades[upg.id] || 0;
            const cost = upg.basePrice * Math.pow(1.5, currentLvl);
            const isMax = currentLvl >= upg.maxLevel;
            const canAfford = this.globalCash >= cost;

            const btnHtml = isMax ?
                `<button class="btn-level" disabled style="opacity: 0.5; border-color: #64748b; cursor: not-allowed; padding: 8px 16px;">Maxed</button>` :
                `<button class="btn-primary" onclick="game.purchaseUpgrade('${upg.id}', ${cost})" ${!canAfford ? 'disabled style="opacity:0.5; cursor:not-allowed; padding: 8px 16px;"' : 'style="background: #10b981; padding: 8px 16px;"'}>Buy $${Math.floor(cost)}</button>`;

            grid.innerHTML += `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; text-align: left;">
                    <div>
                        <h3 style="margin: 0 0 5px 0; color: #f8fafc;">${upg.name} <span style="color: #38bdf8; font-size: 0.9em;">(Lvl ${currentLvl}/${upg.maxLevel})</span></h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${upg.desc}</p>
                    </div>
                    <div>
                        ${btnHtml}
                    </div>
                </div>
            `;
        });
    },

    purchaseUpgrade(id, cost) {
        if (this.globalCash >= cost) {
            this.globalCash -= Math.floor(cost);
            this.upgrades[id] = (this.upgrades[id] || 0) + 1;

            localStorage.setItem('cargoLanderCash', this.globalCash);
            localStorage.setItem('cargoLanderUpgrades', JSON.stringify(this.upgrades));

            this.renderUpgradeShop();
            if (!this.isMuted && window.CargoAudio) CargoAudio.playSuccess();
        }
    },

    loadCustomLevel(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            try {
                const oldRegisterLevel = window.registerLevel;
                let loadedCfg = null;
                window.registerLevel = (cfg) => {
                    loadedCfg = cfg;
                };

                eval(content);

                window.registerLevel = oldRegisterLevel;

                if (loadedCfg) {
                    levels.push(loadedCfg);
                    const customIdx = levels.length - 1;
                    this.isPlaytest = true;
                    this.showVehicleSelection(customIdx);
                } else {
                    alert("No valid CargoLander level configuration found in this file.");
                }
            } catch (err) {
                console.error("Failed to parse custom level:", err);
                alert("Failed to parse custom level. Please ensure it is a valid level file exported from the Level Editor.\n\nError: " + err.message);
            }
        };
        reader.readAsText(file);
    },

    toggleMute() {
        this.isMuted = CargoAudio.toggleMute();
        const btn = document.getElementById('mute-btn');
        if (btn) {
            btn.textContent = this.isMuted ? '🔇' : '🔊';
        }
    },

    toggleMuteQuick() {
        this.isMuted = CargoAudio.toggleMute();
        // Update main menu SVG button
        const menuBtn = document.getElementById('mute-toggle-btn');
        if (menuBtn) {
            const svg = menuBtn.querySelector('svg');
            if (svg) {
                svg.innerHTML = this.isMuted
                    ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
                    : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
            }
        }
        // Update in-game emoji button
        const ingameBtn = document.getElementById('mute-btn-top');
        if (ingameBtn) ingameBtn.textContent = this.isMuted ? '🔇' : '🔊';
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    },

    toggleDevPanel() {
        const panel = document.getElementById('dev-panel');
        if (!panel) return;
        const open = panel.style.display === 'none' || panel.style.display === '';
        panel.style.display = open ? 'block' : 'none';
        // Sync slider values to current physics state when opening
        if (open && this.physics) {
            const set = (id, val, dispId) => {
                const el = document.getElementById(id);
                if (el) { el.value = val; document.getElementById(dispId).textContent = +val; }
            };
            set('dev-gravity', this.physics.gravity ?? 0.12, 'dv-gravity');
            set('dev-thrust', this.physics.lander?.thrustMultiplier ?? 1, 'dv-thrust');
            set('dev-fuel', this.physics.lander?.maxFuel ?? 100, 'dv-fuel');
            const unlockCb = document.getElementById('dev-unlock-all');
            if (unlockCb) unlockCb.checked = !!this.devUnlockAll;
        }
    },

    _updateDevReadout(dt) {
        const el = this.uiElements?.devReadout || document.getElementById('dev-readout');
        const panel = this.uiElements?.devPanel || el?.closest('#dev-panel');
        if (!el || (panel && panel.style.display === 'none')) return;
        const l = this.physics?.lander;
        if (!l) { el.textContent = 'No lander'; return; }
        const spd = Math.sqrt(l.vx * l.vx + l.vy * l.vy);
        el.textContent =
            `pos   ${l.x.toFixed(1)}, ${l.y.toFixed(1)}\n` +
            `vel   ${l.vx.toFixed(2)}, ${l.vy.toFixed(2)}  spd:${spd.toFixed(2)}\n` +
            `angle ${(l.angle * 180 / Math.PI).toFixed(1)}°  ω:${(l.angularVelocity || 0).toFixed(3)}\n` +
            `fuel  ${(l.fuel || 0).toFixed(0)} / ${l.maxFuel || 100}\n` +
            `hull  ${(l.integrity || 0).toFixed(0)} / ${l.maxIntegrity || 100}\n` +
            `landed ${l.landed}  pad:${l.currentPad || '–'}\n` +
            `legs  deployed:${l.legsDeployed || false}  lc:${(l.legCompress || 0).toFixed(2)}\n` +
            `eng   ${(l.enginePower || 0).toFixed(2)}  thrust:${l.thrustMultiplier || 1}\n` +
            `grav  ${this.physics.gravity?.toFixed(3)}  dt:${dt.toFixed(2)}\n` +
            `drag  ${window.DEV_DRAG ?? 0.995}  spool:${window.DEV_SPOOL ?? 0.08}`;
    },

});
