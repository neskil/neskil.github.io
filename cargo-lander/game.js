// CargoLander - Game Core Loop & Renderer
// Level configs: level1.js – level6.js  (each calls registerLevel)
// Level registry + upgradeCatalog: levels.js
// Load order in index.html: level1–6 → levels → audio → shaders → physics → game

class CargoGame {
    static VERSION = '0.1.0';

    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.physics = new CargoPhysics();

        // Game State
        this.gameState = 'menu';
        this.currentLevelIndex = 0;
        this.isPlaytest = false;

        // Economy & Progression
        this.globalCash = parseInt(localStorage.getItem('cargoLanderCash')) || 1000;
        this.upgrades = JSON.parse(localStorage.getItem('cargoLanderUpgrades')) || {
            thrusterEfficiency: 0,
            boostMode: 0,
            magneticDeck: 0,
            winchExtender: 0,
            hullPlating: 0,
            shieldRegen: 0
        };
        this.missionBudget = 0;
        this.missionTimer = 0;

        // Persistent career stats (pilot license card + highscores)
        this.career = JSON.parse(localStorage.getItem('cargoLanderCareer')) || {
            pilotName: '',
            totalDeliveries: 0,
            missionsComplete: 0,
            crashes: 0
        };
        this.highscores = JSON.parse(localStorage.getItem('cargoLanderHighscores')) || {};

        // Vehicle license — picked once on the main menu instead of per-mission,
        // reused by Replay / Next Mission / Restart too.
        this.currentVehicle = localStorage.getItem('cargoLanderVehicle') || 'basic';

        this.score = 100; // Efficiency rating %
        this.deliveredCount = 0;
        this.deliveredTypes = {};
        this.questState = {};   // { questId: { completed, failed } }
        this.hadCrash = false;
        this.cargoLostCount = 0;
        this.stars = [];
        this.messages = []; // On-screen notifications

        // Dynamic Camera
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.introTimer = 0;

        // Settings
        const savedMute = localStorage.getItem('cargoLanderMuted');
        this.isMuted = savedMute ? savedMute === 'true' : false;
        this.uiScale = parseFloat(localStorage.getItem('cargo_lander_ui_scale')) || 1.0;
        this.uiCollapsed = false;

        // Keys State
        this.keys = {
            w: false,
            a: false,
            d: false,
            space: false,
            ArrowUp: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        this.lastTime = 0;

        this.damageFlash = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.uiElements = {
            mobileControls: document.getElementById('mobile-controls'),
            healthFill: document.getElementById('health-fill'),
            hudCargo: document.getElementById('hud-cargo'),
            hudBudget: document.getElementById('hud-budget'),
            hudTime: document.getElementById('hud-time'),
            btnExtract: document.getElementById('btn-extract'),
            fuelFill: document.getElementById('fuel-fill'),
            lowFuelWarning: document.getElementById('low-fuel-warning'),
            devPanel: document.getElementById('dev-panel'),
            devReadout: document.getElementById('dev-readout')
        };

        this.resizeCanvas();
        this.generateStars();
        this.setupEventListeners();

        // Initialize UI display values
        this.setUIScale(this.uiScale);
        this.generateMissionUI();
        this.updateHUD();
        this.refreshMenuUI();

        // Initialize WebGL Shaders overlay
        if (typeof ShaderOverlay !== 'undefined') {
            this.shaders = new ShaderOverlay('webglCanvas');
            this.shaders.resize(this.canvas.width, this.canvas.height);
        }

        // Sync mute button to initial state
        const muteBtn = document.getElementById('mute-toggle-btn');
        if (muteBtn) muteBtn.textContent = this.isMuted ? '🔇' : '🔊';

        // Start game loop
        requestAnimationFrame((t) => this.loop(t));
    }

    toggleUI() {
        this.uiCollapsed = !this.uiCollapsed;
        
        const vitals = document.getElementById('vitals-panel');
        const extract = document.getElementById('btn-extract');
        const rightPanel = document.getElementById('hud-right-panel');
        const rightButtons = rightPanel ? rightPanel.querySelectorAll('.hud-group .utility-btn:not(#hide-ui-btn)') : [];
        
        if (this.uiCollapsed) {
            if (vitals) vitals.style.display = 'none';
            if (extract) extract.style.display = 'none';
            rightButtons.forEach(btn => btn.style.display = 'none');
            
            const dropdown = document.getElementById('options-dropdown');
            if (dropdown) dropdown.style.display = 'none';
            
            const eyeBtn = document.getElementById('hide-ui-btn');
            if (eyeBtn) {
                eyeBtn.style.opacity = '0.5';
                eyeBtn.title = "Show UI";
            }
        } else {
            if (vitals) vitals.style.display = 'flex';
            if (extract && !extract.classList.contains('hidden')) extract.style.display = 'block';
            rightButtons.forEach(btn => btn.style.display = 'inline-flex');
            
            const eyeBtn = document.getElementById('hide-ui-btn');
            if (eyeBtn) {
                eyeBtn.style.opacity = '1';
                eyeBtn.title = "Hide UI";
            }
        }
    }

    setUIScale(val) {
        this.uiScale = parseFloat(val);
        
        const valText = document.getElementById('ui-scale-val');
        if (valText) valText.textContent = Math.round(this.uiScale * 100) + '%';
        
        const slider = document.getElementById('ui-scale-slider');
        if (slider) slider.value = this.uiScale;
        
        const vitals = document.getElementById('vitals-panel');
        const extract = document.getElementById('btn-extract');
        const rightPanel = document.getElementById('hud-right-panel');
        
        if (vitals) {
            vitals.style.transform = `scale(${this.uiScale})`;
            vitals.style.transformOrigin = 'top center';
        }
        if (extract) {
            extract.style.transform = `scale(${this.uiScale})`;
            extract.style.transformOrigin = 'top left';
        }
        if (rightPanel) {
            rightPanel.style.transform = `scale(${this.uiScale})`;
            rightPanel.style.transformOrigin = 'top right';
        }
        
        localStorage.setItem('cargo_lander_ui_scale', this.uiScale);
    }

    resizeCanvas() {
        const targetW = window.innerWidth;
        const targetH = window.innerHeight;
        this.canvas.width = targetW;
        this.canvas.height = targetH;
        if (this.shaders) {
            this.shaders.resize(targetW, targetH);
        }
    }

    generateStars() {
        // Three parallax depths of stars + nebulae
        this.bgLayers = [
            { objects: [], parallax: 0.018 }, // Deep — barely moves
            { objects: [], parallax: 0.055 }, // Mid
            { objects: [], parallax: 0.13 }, // Near
        ];

        // Deep: many tiny dim stars
        for (let i = 0; i < 260; i++) {
            this.bgLayers[0].objects.push({
                x: Math.random() * 5000,
                y: Math.random() * 1800 - 500,
                size: Math.random() * 0.75 + 0.15,
                alpha: 0.25 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                speed: 0.006 + Math.random() * 0.012,
                r: 210, g: 220, b: 230,
            });
        }
        // Mid: moderate stars with color tints
        for (let i = 0; i < 90; i++) {
            const hue = [
                [230, 230, 255], [255, 230, 210], [210, 240, 255],
                [255, 255, 220], [240, 210, 255]
            ][i % 5];
            this.bgLayers[1].objects.push({
                x: Math.random() * 5000,
                y: Math.random() * 1800 - 500,
                size: 0.5 + Math.random() * 1.3,
                alpha: 0.35 + Math.random() * 0.55,
                phase: Math.random() * Math.PI * 2,
                speed: 0.008 + Math.random() * 0.018,
                r: hue[0], g: hue[1], b: hue[2],
            });
        }
        // Near: bright stars with soft halos
        for (let i = 0; i < 30; i++) {
            this.bgLayers[2].objects.push({
                x: Math.random() * 5000,
                y: Math.random() * 1800 - 500,
                size: 1.4 + Math.random() * 2.2,
                alpha: 0.6 + Math.random() * 0.4,
                phase: Math.random() * Math.PI * 2,
                speed: 0.004 + Math.random() * 0.01,
                r: 235, g: 240, b: 250,
                halo: true,
            });
        }

        // Nebulae — large color clouds
        const nebulaColors = [
            [59, 130, 246], [139, 92, 246], [236, 72, 153],
            [16, 185, 129], [245, 158, 11],
        ];
        this.bgNebulae = [];
        for (let i = 0; i < 6; i++) {
            const col = nebulaColors[i % nebulaColors.length];
            this.bgNebulae.push({
                x: 300 + Math.random() * 4400,
                y: -300 + Math.random() * 1000,
                r: 220 + Math.random() * 450,
                alpha: 0.025 + Math.random() * 0.035,
                parallax: 0.025 + Math.random() * 0.025,
                col,
            });
        }
    }

    setupEventListeners() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseLeft = false;
        this.mouseRight = false;

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.camera) return;
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left - this.canvas.width / 2;
            const screenY = e.clientY - rect.top - this.canvas.height / 2;
            this.mouseX = (screenX / this.camera.zoom) + this.camera.x;
            this.mouseY = (screenY / this.camera.zoom) + this.camera.y;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouseLeft = true;
            if (e.button === 2) this.mouseRight = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseLeft = false;
            if (e.button === 2) this.mouseRight = false;
        });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        window.addEventListener('keydown', (e) => {
            // Don't hijack typing when a text field (e.g. the callsign input) is focused
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
                return;
            }
            this.keys[e.key.toLowerCase()] = true;
            // Prevent default scrolling for game keys
            if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            if (e.key === ' ') {
                if (this.physics.lander) {
                    const level = levels[this.currentLevelIndex];
                    const allDelivered = level && this.deliveredCount >= level.targetCargo;
                    const atHQ = this.physics.lander.landed && this.physics.lander.currentPad === 'start';
                    if (this.gameState === 'playing' && allDelivered && atHQ) {
                        this.completeMission();
                    } else {
                        this.toggleGrapple();
                    }
                }
            }
            if (e.key.toLowerCase() === 'r' && this.physics.lander && this.physics.lander.crashed) {
                this.respawnLander();
            }
            if (e.key.toLowerCase() === 'h') {
                this.toggleUI();
            }
        });

        // Key up
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mobile touch controls (will bind HTML button events to keys in UI file)
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // Quick console shortcut: game.startTestLevel()
    startTestLevel() { this.startLevel(levels.length - 1); }

    goToMenu() {
        if (this.isPlaytest) {
            window.location.href = 'level-editor.html';
            return;
        }
        this.gameState = 'menu';
        document.getElementById('menu-screen').style.display = 'flex';
        document.getElementById('hud-overlay').style.display = 'none';
        
        const centerExtract = document.getElementById('center-extract-overlay');
        if (centerExtract) centerExtract.style.display = 'none';

        document.getElementById('nav-header').style.display = 'flex';

        const completeScreen = document.getElementById('complete-screen');
        if (completeScreen) completeScreen.style.display = 'none';
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        const respawnScreen = document.getElementById('respawn-screen');
        if (respawnScreen) respawnScreen.classList.add('hidden');
        const upgradeScreen = document.getElementById('upgrade-screen');
        if (upgradeScreen) upgradeScreen.style.display = 'none';
        const vehicleScreen = document.getElementById('vehicle-screen');
        if (vehicleScreen) vehicleScreen.style.display = 'none';
        const procConfigScreen = document.getElementById('procedural-config-screen');
        if (procConfigScreen) procConfigScreen.style.display = 'none';
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) victoryScreen.style.display = 'none';
        const settingsScreen = document.getElementById('settings-screen');
        if (settingsScreen) settingsScreen.style.display = 'none';

        this.menuOpenTime = Date.now();
        this.menuMonster = null;
        this.nextMenuMonsterTime = Date.now() + 20000 + Math.random() * 30000;

        this.refreshMenuUI();
    }

    // ---- Persistent career helpers ----
    saveCareer() {
        localStorage.setItem('cargoLanderCareer', JSON.stringify(this.career));
    }

    saveHighscores() {
        localStorage.setItem('cargoLanderHighscores', JSON.stringify(this.highscores));
    }

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // Populate the pilot-license card, upgrade chips, highscore list & badges
    generateMissionUI() {
        const grid = document.getElementById('mission-grid');
        const devPanel = document.querySelector('#dev-panel .dev-row');
        if (!grid || !devPanel) return;
        
        // Keep fixed buttons (procedural, custom level)
        const fixedButtons = Array.from(grid.children).filter(btn => !btn.id || !btn.id.startsWith('mission-btn-'));
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
        
        fixedButtons.forEach(btn => grid.appendChild(btn));
        devButtons.forEach(btn => devPanel.appendChild(btn));
    }

    refreshMenuUI() {
        this.refreshVehicleLicenseUI();

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
    }

    // Campaign missions unlock in order; the Dev Panel's direct level-jump buttons
    // (game.startLevel(i)) bypass this entirely, which is the intended dev escape hatch.
    // Procedural/custom levels (non-numeric idx) are always available.
    isLevelUnlocked(idx) {
        if (this.devUnlockAll) return true;
        if (typeof idx !== 'number') return true;
        if (idx <= 0) return true;
        return !!this.highscores[idx - 1];
    }

    setDevUnlockAll(checked) {
        this.devUnlockAll = checked;
        this.refreshMenuUI();
    }

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
    }

    updatePilotName(value) {
        this.career.pilotName = value;
        this.saveCareer();
    }

    confirmResetCareer() {
        if (!confirm('Reset your entire career? This wipes cash, upgrades, deliveries, and high scores. This cannot be undone.')) {
            return;
        }
        this.globalCash = 1000;
        this.upgrades = {
            thrusterEfficiency: 0,
            boostMode: 0,
            magneticDeck: 0,
            winchExtender: 0,
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
    }

    // ---- Audio settings modal ----
    openSettings() {
        const s = document.getElementById('settings-screen');
        if (!s) return;
        // Sync controls to the actual current audio state
        const muteCb = document.getElementById('setting-mute');
        if (muteCb) muteCb.checked = this.isMuted;

        const mv = Math.round(CargoAudio.musicVolume * 100);
        const sv = Math.round(CargoAudio.sfxVolume * 100);
        const musicSlider = document.getElementById('setting-music-vol');
        const sfxSlider = document.getElementById('setting-sfx-vol');
        if (musicSlider) musicSlider.value = mv;
        if (sfxSlider) sfxSlider.value = sv;
        this.setText('music-vol-val', mv + '%');
        this.setText('sfx-vol-val', sv + '%');

        s.style.display = 'flex';
    }

    closeSettings() {
        const s = document.getElementById('settings-screen');
        if (s) s.style.display = 'none';
    }

    toggleMuteFromCheckbox(checked) {
        this.isMuted = checked;
        if (window.CargoAudio) CargoAudio.setMuted(checked);
    }

    setZoomModifier(value) {
        this.zoomModifier = value;
        const label = document.getElementById('zoom-value-label');
        if (label) label.textContent = value.toFixed(1) + 'x';
    }

    setMusicVolume(value) {
        const v = parseInt(value, 10);
        this.setText('music-vol-val', v + '%');
        if (window.CargoAudio) CargoAudio.setMusicVolume(v / 100);
    }

    setSFXVolume(value) {
        const v = parseInt(value, 10);
        this.setText('sfx-vol-val', v + '%');
        if (window.CargoAudio) CargoAudio.setSFXVolume(v / 100);
    }

    // Vehicle is now picked once on the main menu (like a pilot's license) instead
    // of on a per-mission screen — clicking a mission loads straight into it.
    showVehicleSelection(idx) {
        if (!this.isLevelUnlocked(idx)) return;
        this.selectedLevelIndex = idx;
        this.startLevel(idx, this.currentVehicle);
    }

    setSelectedVehicle(vehicleType) {
        this.currentVehicle = vehicleType;
        localStorage.setItem('cargoLanderVehicle', vehicleType);
        this.refreshVehicleLicenseUI();
    }

    refreshVehicleLicenseUI() {
        const basicBtn = document.getElementById('vehicle-license-basic');
        const droneBtn = document.getElementById('vehicle-license-drone');
        if (basicBtn) basicBtn.classList.toggle('vehicle-selected', this.currentVehicle === 'basic');
        if (droneBtn) droneBtn.classList.toggle('vehicle-selected', this.currentVehicle === 'drone');
    }

    startLevelWithVehicle(vehicleType) {
        document.getElementById('vehicle-screen').style.display = 'none';
        this.startLevel(this.selectedLevelIndex, vehicleType);
    }

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
    }

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
    }

    launchProceduralMission() {
        const tier = document.getElementById('proc-difficulty-slider')?.value || 1;
        document.getElementById('procedural-config-screen').style.display = 'none';
        this.showVehicleSelection('random' + tier);
    }

    openUpgradeShop() {
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('upgrade-screen').style.display = 'flex';
        this.renderUpgradeShop();
    }

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
    }

    purchaseUpgrade(id, cost) {
        if (this.globalCash >= cost) {
            this.globalCash -= Math.floor(cost);
            this.upgrades[id] = (this.upgrades[id] || 0) + 1;

            localStorage.setItem('cargoLanderCash', this.globalCash);
            localStorage.setItem('cargoLanderUpgrades', JSON.stringify(this.upgrades));

            this.renderUpgradeShop();
            if (!this.isMuted && window.CargoAudio) CargoAudio.playSuccess();
        }
    }

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
    }

    startLevel(idx, vehicleType = this.currentVehicle || 'basic') {
        let craziness = 1;
        if (typeof idx === 'string' && idx.startsWith('random')) {
            craziness = parseInt(idx.replace('random', '')) || 1;
            const procLvl = typeof generateProceduralLevel === 'function' ? generateProceduralLevel(craziness) : null;
            if (procLvl) {
                idx = levels.length;
                levels.push(procLvl);
            } else {
                console.error("Procedural generator not found, falling back to L1");
                idx = 0;
            }
        }
        
        this.currentLevelIndex = idx;
        this.currentVehicle = vehicleType;
        this.crashHandled = false;
        this._fireworksTriggered = false;
        const level = levels[idx];
        level.vehicle = vehicleType;

        // Update exit buttons text if playtesting
        const exitButtons = [
            { el: document.querySelector('#game-over-screen .btn-secondary'), def: "Exit to Menu" },
            { el: document.querySelector('#respawn-screen .btn-secondary'), def: "Exit to Menu" },
            { el: document.querySelector('#victory-screen .btn-secondary'), def: "Main Menu" },
            { el: document.querySelector('#options-dropdown button[onclick*="goToMenu"]'), def: "🏠 Exit Level" }
        ];
        exitButtons.forEach(item => {
            if (item.el) {
                item.el.innerHTML = this.isPlaytest ? "📝 Back to Editor" : item.def;
            }
        });

        this.missionBudget = level.budget || 1000;
        this.missionTimer = level.timeLimit || 180;
        this.overtimeActive = false;
        this.overtimeTimer = 0;

        this.physics.initLevel(level, this.canvas.width, this.canvas.height, this.upgrades);
        this.deliveredCount = 0;
        this.deliveredTypes = {};
        this.questState = {};
        this.hadCrash = false;
        this.cargoLostCount = 0;
        this.score = 100; // Reset level efficiency
        this.messages = [];

        let starts = parseInt(localStorage.getItem('cargoLanderStarts')) || 0;
        starts++;
        localStorage.setItem('cargoLanderStarts', starts);
        if (starts % 3 === 0 && this.isMuted) {
            setTimeout(() => {
                this.addMessage("💡 Unmute to hear the music & sound effects!", "#38bdf8");
        const muteBtn = document.getElementById('mute-toggle-btn');
                if (muteBtn) {
                    muteBtn.style.animation = 'shakeBtn 0.4s ease-in-out 4';
                    setTimeout(() => muteBtn.style.animation = '', 1600);
                }
            }, 1500);
        }

        // Generate world buildings on terrain surface
        this.buildings = [];
        if (level.buildings) {
            this.buildings = [...level.buildings];
            // Resolve Y coords
            for (const b of this.buildings) {
                b.y = this.physics.getPolygonSurfaceY(b.x);
                if (!b.w) b.w = b.type === 'silo' ? 22 + Math.random() * 16 : b.type === 'refinery' ? 45 + Math.random() * 20 : 6;
                if (!b.h) b.h = 60 + Math.random() * 100;
                if (b.phase === undefined) b.phase = Math.random() * Math.PI * 2;
            }
        }

        this.gameState = 'playing';
        this.addMessage("Level Started: " + (level?.name || "Unknown"), "#6366f1");
        
        if (this.currentLevelIndex === 0) {
            setTimeout(() => { if (this.gameState === 'playing') this.addMessage("TUTORIAL: Use Arrow Keys or WASD to fly", "#34d399") }, 3000);
            setTimeout(() => { if (this.gameState === 'playing') this.addMessage("TUTORIAL: Pick up cargo from the crane (Spacebar / Click)", "#34d399") }, 9000);
            setTimeout(() => { if (this.gameState === 'playing') this.addMessage("TUTORIAL: Deliver cargo to the glowing Delivery Hubs", "#34d399") }, 15000);
        }

        // Setup initial camera position
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const levelFitZoom = Math.min(cw / this.physics.levelWidth, ch / this.physics.levelHeight) * 0.95;
        const minZoom = Math.max(0.45, levelFitZoom);
        let desiredZoom = 1.3;
        if (this.physics.lander.vehicleType === 'drone') {
            desiredZoom -= (this.physics.lander.ropeLength * 0.003);
        }
        desiredZoom = Math.max(minZoom, Math.min(1.8, desiredZoom));
        desiredZoom *= (this.zoomModifier || 1.0);

        this.camera.zoom = desiredZoom;
        this.camera.targetZoom = desiredZoom;
        this.camera.x = this.physics.lander.x;
        this.camera.y = this.physics.lander.y - 120;
        this.introTimer = 0;

        let weatherType = level?.weather;
        if (!weatherType) {
            if (level?.name?.includes('Grass')) weatherType = 'rain';
            else if (level?.name?.includes('Ice') || level?.name?.includes('Glacial')) weatherType = 'snow';
            else if (level?.name?.includes('Volcanic') || level?.name?.includes('Lava')) weatherType = 'ash';
            else if (level?.name?.includes('Crystal')) weatherType = 'bubbles';
            else if (level?.name?.includes('Desert')) weatherType = 'heatwave';
        }
        this.weather = weatherType;
        this.weatherParticles = [];

        // Hide menus, show HUD
        document.getElementById('menu-screen').style.display = 'none';
        const completeScreen = document.getElementById('complete-screen');
        if (completeScreen) completeScreen.style.display = 'none';
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        const respawnScreen = document.getElementById('respawn-screen');
        if (respawnScreen) respawnScreen.classList.add('hidden');
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) victoryScreen.style.display = 'none';
        document.getElementById('hud-overlay').style.display = 'flex';
        document.getElementById('nav-header').style.display = 'none';
        document.getElementById('level-hint').textContent = level.hint || '';

        // Reset inputs
        this.keys = {};

        this.updateHUD();
    }

    restartLevel() {
        if (this.gameState === 'playing' || this.gameState === 'game_over' || this.gameState === 'level_complete') {
            this.startLevel(this.currentLevelIndex);
        }
    }

    nextLevel() {
        if (this.isPlaytest) {
            window.location.href = 'level-editor.html';
            return;
        }
        if (levels[this.currentLevelIndex] && levels[this.currentLevelIndex].name.includes('Mission ♾️')) {
            this.startLevel('random');
        } else if (this.currentLevelIndex + 1 < levels.length) {
            this.startLevel(this.currentLevelIndex + 1);
        } else {
            // Victory! All levels complete
            this.gameState = 'victory';
            document.getElementById('victory-screen').style.display = 'flex';
            document.getElementById('hud-overlay').style.display = 'none';
            if (!this.isMuted) CargoAudio.playSuccess();
        }
    }

    toggleMute() {
        this.isMuted = CargoAudio.toggleMute();
        const btn = document.getElementById('mute-btn');
        if (btn) {
            btn.textContent = this.isMuted ? '🔇' : '🔊';
        }
    }

    toggleMuteQuick() {
        this.isMuted = CargoAudio.toggleMute();
        const btn = document.getElementById('mute-toggle-btn');
        if (btn) btn.textContent = this.isMuted ? '🔇' : '🔊';
    }

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
    }

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
    }

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
    }

    addMessage(text, color = '#f8fafc') {
        this.messages.push({
            text: text,
            color: color,
            life: 1.0,
            y: 175
        });
        if (this.messages.length > 4) {
            this.messages.shift();
        }
    }

    failMission(reason) {
        this.gameState = 'game_over';
        document.getElementById('hud-overlay').style.display = 'none';
        
        const centerExtract = document.getElementById('center-extract-overlay');
        if (centerExtract) centerExtract.style.display = 'none';
        const failScreen = document.getElementById('game-over-screen');
        if (failScreen) {
            failScreen.classList.remove('hidden');
            const reasonEl = document.getElementById('fail-reason');
            if (reasonEl) reasonEl.textContent = reason;
        }

        const respawnScreen = document.getElementById('respawn-screen');
        if (respawnScreen) respawnScreen.classList.add('hidden');
    }

    respawnLander() {
        this.crashHandled = false;

        const respawnScreen = document.getElementById('respawn-screen');
        if (respawnScreen) respawnScreen.classList.add('hidden');

        const levelConfig = levels[this.currentLevelIndex];
        this.physics.spawnLander(levelConfig, this.upgrades);
    }

    toggleGrapple() {
        const lander = this.physics.lander;
        if (!lander) return;

        if (lander.grabbedBoxId) {
            // Release cargo
            lander.grabbedBoxId = null;
            if (window.CargoAudio && !this.isMuted) CargoAudio.playLoad();
        } else {
            // Try to grab cargo
            let closestBox = null;
            let minDist = 65; // Grab radius

            for (const box of this.physics.boxes) {
                // If it's not a drone, only allow grappling specific tetherable cargo
                if (lander.vehicleType !== 'drone' && box.type !== 'tethered') continue;

                const dist = Math.sqrt(Math.pow(box.x - lander.grappleX, 2) + Math.pow(box.y - lander.grappleY, 2));
                if (dist < minDist) {
                    minDist = dist;
                    closestBox = box;
                }
            }

            if (closestBox) {
                lander.grabbedBoxId = closestBox.id;
                if (window.CargoAudio && !this.isMuted) CargoAudio.playLoad();
            }
            // Cargo no longer dispenses from a Space press — it spawns via the
            // crane loadSeq while landed on the collection pad, so Space stays
            // purely a grapple grab/release action.
        }
    }

    updateHUD() {
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

        // Update Cargo & Budget stats
        const cargoEl = this.uiElements?.hudCargo || document.getElementById('hud-cargo');
        if (cargoEl) {
            cargoEl.textContent = `Cargo: ${this.deliveredCount}/${level.targetCargo}`;
        }
        const budgetEl = this.uiElements?.hudBudget || document.getElementById('hud-budget');
        if (budgetEl) {
            budgetEl.textContent = `Budget: $${this.missionBudget}`;
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
                        if (centerBtn) centerBtn.style.display = 'block';
                        
                        btnExtract.classList.remove('hidden');
                        btnExtract.textContent = '✓ EXTRACT NOW';
                        btnExtract.style.background = '#10b981';
                        btnExtract.style.opacity = '1';
                        btnExtract.style.cursor = 'pointer';
                    } else {
                        centerOverlay.style.borderColor = '#38bdf8';
                        if (centerTitle) {
                            centerTitle.textContent = 'HQ Services';
                            centerTitle.style.color = '#38bdf8';
                        }
                        if (centerDesc) centerDesc.textContent = 'Refuel and repair before taking off.';
                        if (centerBtn) centerBtn.style.display = 'none';
                        
                        btnExtract.classList.add('hidden');
                    }
                    
                    const btnRefuel = document.getElementById('btn-hq-refuel');
                    const btnRepair = document.getElementById('btn-hq-repair');
                    if (btnRefuel) {
                        const needsFuel = lander.fuel < lander.maxFuel;
                        const canAfford = this.globalCash >= 100;
                        btnRefuel.disabled = !needsFuel || !canAfford;
                        btnRefuel.style.opacity = btnRefuel.disabled ? '0.5' : '1';
                        btnRefuel.style.cursor = btnRefuel.disabled ? 'not-allowed' : 'pointer';
                    }
                    if (btnRepair) {
                        const needsRepair = lander.integrity < lander.maxIntegrity;
                        const canAfford = this.globalCash >= 200;
                        btnRepair.disabled = !needsRepair || !canAfford;
                        btnRepair.style.opacity = btnRepair.disabled ? '0.5' : '1';
                        btnRepair.style.cursor = btnRepair.disabled ? 'not-allowed' : 'pointer';
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
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        let deltaTime = timestamp - this.lastTime;
        // Cap deltaTime to avoid spiral of death on tab sleep
        if (deltaTime > 250) deltaTime = 250;
        this.lastTime = timestamp;

        this.physicsAccumulator = (this.physicsAccumulator || 0) + deltaTime;
        const FIXED_TIME_STEP = 16.666; // 60fps target

        // FPS tracking (sampled every 600 ms)
        this.fpsFrames = (this.fpsFrames || 0) + 1;
        if (!this.fpsSampleTs) this.fpsSampleTs = timestamp;
        if (timestamp - this.fpsSampleTs >= 600) {
            this.displayFps = Math.round(this.fpsFrames * 1000 / (timestamp - this.fpsSampleTs));
            this.fpsFrames = 0;
            this.fpsSampleTs = timestamp;
        }

        // Step physics and logic at a fixed 60Hz rate
        while (this.physicsAccumulator >= FIXED_TIME_STEP) {
            this.update(1.0); // dt is always 1.0 since we step exactly 1/60th of a second
            this.physicsAccumulator -= FIXED_TIME_STEP;
        }

        this._updateDevReadout(1.0);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Toggle mobile controls visibility dynamically
        const mobileControls = this.uiElements?.mobileControls || document.getElementById('mobile-controls');
        if (mobileControls) {
            const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            mobileControls.style.display = (isTouch && this.gameState === 'playing') ? 'flex' : 'none';
        }

        if (this.updateWeather) this.updateWeather(dt);

        const lander = this.physics.lander;
        if (!lander) return;
        
        // HQ Landing Fireworks Celebration
        const level = levels[this.currentLevelIndex];
        const allDelivered = this.deliveredCount >= (level ? (level.targetCargo || 2) : 2);
        const atHQ = lander && lander.landed && lander.currentPad === 'start';
        if (atHQ && allDelivered && !this._fireworksTriggered && this.gameState === 'playing') {
            this._fireworksTriggered = true;
            if (this.physics && this.physics.particles) {
                for (let burst = 0; burst < 3; burst++) {
                    setTimeout(() => {
                        if (this.gameState !== 'playing' && this.gameState !== 'level_complete') return;
                        const bx = lander.x + (Math.random() - 0.5) * 300;
                        const by = lander.y - 100 - Math.random() * 200;
                        for (let i = 0; i < 60; i++) {
                            this.physics.particles.push({
                                x: bx,
                                y: by,
                                vx: (Math.random() - 0.5) * 12,
                                vy: (Math.random() - 0.5) * 12,
                                life: 1.0 + Math.random() * 1.5,
                                decay: 0.01 + Math.random() * 0.02,
                                color: `hsla(${Math.random() * 360}, 100%, 60%, 1)`,
                                size: 2 + Math.random() * 4
                            });
                        }
                        if (!this.isMuted && window.CargoAudio && window.CargoAudio.playCollision) {
                            CargoAudio.playCollision(2); // quiet pop
                        }
                    }, burst * 500);
                }
            }
        }

        const prevIntegrity = this._lastIntegrity ?? lander.integrity;
        this._lastIntegrity = lander.integrity;
        if (lander.integrity < prevIntegrity - 1) {
            const dmg = prevIntegrity - lander.integrity;
            this.damageFlash = Math.min(1, dmg / 20);
            this.screenShake.intensity = Math.min(12, dmg * 0.8);
        }
        this.damageFlash = Math.max(0, this.damageFlash - 0.04 * dt);
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= Math.pow(0.75, dt);
            if (this.screenShake.intensity < 0.5) this.screenShake.intensity = 0;
        }

        const keys = this.keys;

        // Bundle inputs
        const inputState = {
            up: keys['w'] || keys['arrowup'],
            down: keys['s'] || keys['arrowdown'],
            left: keys['a'] || keys['arrowleft'],
            right: keys['d'] || keys['arrowright'],
            q: keys['q'],
            e: keys['e'],
            mouseX: this.mouseX,
            mouseY: this.mouseY,
            mouseLeft: this.mouseLeft,
            mouseRight: this.mouseRight
        };

        // --- Mission Clock Update ---
        if (this.missionTimer > 0 && this.gameState === 'playing' && !lander.crashed) {
            this.missionTimer -= (dt / 60);
            if (this.missionTimer <= 0) {
                this.missionTimer = 0;
                // Don't end immediately — trigger overtime: monster warning + 15s to reach HQ
                if (!this.overtimeActive) {
                    this.overtimeActive = true;
                    this.overtimeTimer = 15;
                    this.physics.outOfBoundsTimer = 999; // force monster spawn immediately
                    this.addMessage('⚠ TIME UP — GET BACK TO HQ! 15s', '#ef4444');
                    if (window.CargoAudio) CargoAudio.playWarning?.();
                }
            }
        }

        // --- Overtime countdown ---
        if (this.overtimeActive && this.gameState === 'playing' && !lander.crashed) {
            this.overtimeTimer -= (dt / 60);
            // Check if player made it back to HQ
            if (lander.currentPad === 'start') {
                this.overtimeActive = false;
                this.physics.outOfBoundsTimer = 0;
                this.completeMission(); // safe extraction
            } else if (this.overtimeTimer <= 0) {
                // Out of time — monster attacks instantly
                this.overtimeActive = false;
                this.physics.outOfBoundsTimer = 999;
                this.addMessage('CONTRACT FAILED — EXTRACTED BY FORCE', '#ef4444');
                // Cash penalty if not already crashing
                this.globalCash = Math.max(0, this.globalCash - 500);
                localStorage.setItem('cargoLanderCash', this.globalCash);
            }
        }

        // Let physics know the actual on-screen half-extents so it can spawn the
        // monster genuinely off-screen instead of at a fixed world-space offset that
        // may still land inside the viewport at low zoom.
        this.physics.viewHalfW = (this.canvas.width / 2) / this.camera.zoom;
        this.physics.viewHalfH = (this.canvas.height / 2) / this.camera.zoom;

        this.physics.update(dt, levels[this.currentLevelIndex], inputState);

        // --- Off-screen monster radar ping ---
        if (this.physics.monster && this.gameState === 'playing') {
            this.radarPingTimer = (this.radarPingTimer || 0) + dt;
            if (this.radarPingTimer >= 90) {
                this.radarPingTimer = 0;
                CargoAudio.playRadarPing?.();
            }
        } else {
            this.radarPingTimer = 0;
        }

        // --- Shield & Hull Regeneration ---
        const shieldLvl = this.upgrades?.['shieldRegen'] || 0;
        if (shieldLvl > 0 && !lander.crashed && lander.integrity > 0) {
            lander.integrity = Math.min(lander.maxIntegrity, lander.integrity + (dt / 60) * 1.5 * shieldLvl);
            // Shield charge recovers on its own too, a bit slower than a fresh hit
            // would need — it isn't meant to fully block every impact back-to-back.
            if (lander.maxShieldCharge > 0) {
                lander.shieldCharge = Math.min(lander.maxShieldCharge, (lander.shieldCharge || 0) + (dt / 60) * (lander.maxShieldCharge / 8));
            }
        }
        if (lander.shieldHitFlash > 0) lander.shieldHitFlash = Math.max(0, lander.shieldHitFlash - 0.04 * dt);

        // --- Refueling Station Logic ---
        if (lander.landed && lander.currentPad === 'refuel' && this.gameState === 'playing') {
            if (lander.fuel < lander.maxFuel && this.missionBudget > 0) {
                // Costs $50 per second for 15 units of fuel per second
                const refuelAmount = (15.0 / 60.0) * dt;
                const refuelCost = (50.0 / 60.0) * dt;

                if (this.missionBudget >= refuelCost) {
                    lander.fuel = Math.min(lander.maxFuel, lander.fuel + refuelAmount);
                    this.missionBudget -= refuelCost;

                    // Throttle the audio & UI message so it doesn't spam
                    this.refuelTimer = (this.refuelTimer || 0) + dt;
                    if (this.refuelTimer > 30) {
                        this.refuelTimer = 0;
                        if (Math.random() < 0.3) this.addMessage(`Refueling... -$${Math.floor(refuelCost * 30)}`, "#34d399");
                    }
                } else {
                    this.addMessage("Out of budget! Cannot refuel.", "#ef4444");
                }
            }
        }

        // --- Cinematic Camera Update ---
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const levelFitZoom = Math.min(cw / this.physics.levelWidth, ch / this.physics.levelHeight) * 0.95;
        const minZoom = Math.max(0.45, levelFitZoom); // Cap how far it can zoom out
        let desiredZoom = 1.3;
        if (lander.vehicleType === 'drone') {
            desiredZoom -= (lander.ropeLength * 0.003);
        }
        desiredZoom = Math.max(minZoom, Math.min(1.8, desiredZoom));
        
        // Apply user zoom modifier
        desiredZoom *= (this.zoomModifier || 1.0);

        if (this.freeCam) {
            // Free camera: WASD/arrows pan, Q/E zoom
            const spd = (500 / this.camera.zoom) * (dt / 60);
            if (this.keys['ArrowLeft'] || this.keys['ArrowLeft']) this.camera.x -= spd;
            if (this.keys['ArrowRight']) this.camera.x += spd;
            if (this.keys['ArrowUp']) this.camera.y -= spd;
            if (this.keys['ArrowDown']) this.camera.y += spd;
            if (this.keys['q']) this.camera.zoom = Math.min(2.5, this.camera.zoom + 0.02 * dt);
            if (this.keys['e']) this.camera.zoom = Math.max(0.15, this.camera.zoom - 0.02 * dt);
        } else {
            this.camera.targetZoom = desiredZoom;
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.05 * dt;

            let targetX = lander.x + (Math.max(-200, Math.min(200, lander.vx || 0)) * 15);
            let targetY = lander.y - 120 + (Math.max(-200, Math.min(200, lander.vy || 0)) * 15); // Shift camera up to show more air
            const viewH = this.canvas.height / this.camera.targetZoom;
            const maxCamY = this.physics.levelHeight - (viewH / 2) + 120;
            targetY = Math.min(targetY, maxCamY);
            this.camera.x += (targetX - this.camera.x) * 0.08 * dt;
            this.camera.y += (targetY - this.camera.y) * 0.08 * dt;
        }
        // -------------------------------

        // Sound effect triggers for thrust
        if (!this.isMuted) {
            if (lander.thrusting && lander.fuel > 0 && !lander.crashed) {
                CargoAudio.setThruster(1.0);
            } else {
                CargoAudio.setThruster(0);
            }
        }

        // Delivery hub crane animations
        for (const h of this.physics.deliveryHubs) {
            if (h.craneAnim) {
                h.craneAnim.timer += dt / 120;
                if (h.craneAnim.timer >= 1) {
                    h.palletCount = (h.palletCount || 0) + 1;
                    h.craneAnim = null;
                }
            }
        }

        // Auto-load sequence at collection point
        const _col = this.physics.collectionPoint;
        const _lndr = this.physics.lander;
        // First arrival: start countdown, decide target type
        if (_lndr && _lndr.landed && _lndr.currentPad === 'collection' && !_col.loadSeq) {
            if (this.physics.boxes.length < 3) {
                const _lc = levels[this.currentLevelIndex];
                const _types = _lc ? (_lc.allowedTypes || ['normal']) : ['normal'];
                const _t = _types[Math.floor(Math.random() * _types.length)];
                _col.loadSeq = { 
                    phase: 'countdown', 
                    countdown: 80, 
                    countdownMax: 80, 
                    spawned: 0, 
                    roofOpen: 1, 
                    lx: _lndr.vehicleType === 'drone' ? _lndr.x + 35 : _lndr.x, 
                    targetType: _t, 
                    targetEmoji: this.physics.getRandomCargoEmoji(_t),
                    boxDropped: false 
                };
            }
        }
        if (_col.loadSeq) {
            const _seq = _col.loadSeq;
            const _stillHere = _lndr && _lndr.landed && _lndr.currentPad === 'collection';
            if (!_stillHere && _seq.phase === 'countdown') _seq.phase = 'closing';

            if (_seq.phase === 'countdown') {
                _seq.countdown -= dt;

                // Animation takes exactly 80 ticks. 0.75 progress corresponds to countdown reaching 20 (0.25 of 80)
                if (_seq.countdown <= 20 && !_seq.boxDropped) {
                    this.physics.spawnCargo(_seq.targetType, _seq.lx, _seq.targetEmoji);
                    if (window.CargoAudio && !this.isMuted) CargoAudio.playLoad();
                    _seq.boxDropped = true;
                    _seq.spawned++;
                }

                if (_seq.countdown <= 0) {
                    if (this.physics.boxes.length < 3 && _seq.spawned < 3) {
                        const _lc = levels[this.currentLevelIndex];
                        const _types = _lc ? (_lc.allowedTypes || ['normal']) : ['normal'];
                        _seq.targetType = _types[Math.floor(Math.random() * _types.length)];
                        _seq.targetEmoji = this.physics.getRandomCargoEmoji(_seq.targetType);
                        _seq.countdownMax = 160;
                        _seq.countdown = _seq.countdownMax;
                        _seq.boxDropped = false;
                        
                        // Set offset for next box
                        if (_lndr.vehicleType === 'drone') {
                            if (_seq.spawned === 1) _seq.lx = _lndr.x - 35;
                            else if (_seq.spawned === 2) _seq.lx = _lndr.x + 65;
                        } else {
                            if (_seq.spawned === 1) _seq.lx = _lndr.x - 22;
                            else if (_seq.spawned === 2) _seq.lx = _lndr.x + 22;
                        }
                    } else {
                        _seq.phase = 'closing';
                    }
                }
            }

            if (_seq.phase === 'closing') {
                _seq.roofOpen = Math.max(0, _seq.roofOpen - dt / 25);
                if (_seq.roofOpen <= 0) _col.loadSeq = null;
            }
        }

        // Check cargo positions for unloading and delivery
        this.checkCargoDelivery();
        this.updateBoxFireState(dt);

        // Update score decay slightly for fuel/time consumption
        if (!lander.landed && this.score > 30) {
            this.score -= 0.004 * dt; // slow drop over time
        }

        // Handle game over if crashed
        if (lander.crashed && !this.crashHandled) {
            this.crashHandled = true;
            if (!this.isMuted) CargoAudio.setWarning(false);

            this.hadCrash = true;
            if (this.questState['no_crash'] === undefined) {
                this.questState['no_crash'] = { failed: true };
            }

            this.career.crashes++;
            this.saveCareer();

            this.missionBudget -= 400;
            this.addMessage("Lander Destroyed: -$400", "#ef4444");
            this.addMessage("Press 'R' to deploy replacement", "#fca5a5");

            if (this.missionBudget < 0) {
                this.failMission("Bankrupt! Budget exceeded.");
            }

            // Generate explosion particles
            for (let i = 0; i < 50; i++) {
                this.physics.particles.push({
                    x: lander.x,
                    y: lander.y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1.0,
                    decay: 0.01 + Math.random() * 0.03,
                    color: `hsla(${10 + Math.random() * 40}, 100%, 50%, 0.9)`,
                    size: 3 + Math.random() * 8
                });
            }
            if (!this.isMuted && window.CargoAudio) CargoAudio.playCollision(10);

            // Show respawn screen after short delay, keep game state playing for physics
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    const respawnScreen = document.getElementById('respawn-screen');
                    if (respawnScreen && this.physics.lander && this.physics.lander.crashed) {
                        respawnScreen.classList.remove('hidden');
                    }
                }
            }, 4000);
        }

        // Refill alert sound check
        if (lander.fuel <= 0 && !lander.landed) {
            if (!this.isMuted) CargoAudio.setWarning(true);
        }

        // Update notifications
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const m = this.messages[i];
            m.life -= 0.0025 * dt; // Lasts ~400 frames instead of 200
            if (m.life <= 0) {
                this.messages.splice(i, 1);
            }
        }

        this.updateHUD();
    }

    checkCargoDelivery() {
        const lander = this.physics.lander;
        const hubs = this.physics.deliveryHubs;
        const boxes = this.physics.boxes;
        
        let totalReward = 0;
        let lastDeliveryX = 0;
        let lastDeliveryY = 0;

        // Check for deliveries on all pads (either landed by lander or dropped manually)
        for (const hub of hubs) {
            for (let i = boxes.length - 1; i >= 0; i--) {
                const box = boxes[i];
                
                // Vacuum chute logic
                if (hub.type === 'chute') {
                    if (box.x >= hub.x && box.x <= hub.x + hub.width && box.y > hub.y + 20) {
                        totalReward += this.processSuccessfulDelivery(box, i, hub);
                        lastDeliveryX = hub.x + hub.width / 2;
                        lastDeliveryY = hub.y - 20;
                    }
                    continue;
                }

                // Normal pad delivery
                if (box.x >= hub.x - 30 && box.x <= hub.x + hub.width + 30 && box.y > hub.y - 60) {
                    // Two ways to deliver: 
                    // 1) Lander is landed on the hub, and box is near it.
                    // 2) Box is just resting on the hub by itself.
                    const landerIsHere = lander.landed && lander.currentPad === hub.type;
                    const boxIsResting = (!box.onDeck && lander.grabbedBoxId !== box.id && box.y > hub.y - 40 && Math.abs(box.vx || 0) < 1.0 && Math.abs(box.vy || 0) < 1.0);
                    
                    if (landerIsHere || boxIsResting) {
                        if (box.type === hub.type) {
                            totalReward += this.processSuccessfulDelivery(box, i, hub);
                            lastDeliveryX = box.x;
                            lastDeliveryY = box.y;
                        } else if (!box._rejectWarned) {
                            box._rejectWarned = true;
                            this.addMessage(`Warning: Hub rejects ${box.type.toUpperCase()} package!`, "#ef4444");
                        }
                    }
                }
            }
        }
        
        if (totalReward > 0) {
            if (!this.floatingTexts) this.floatingTexts = [];
            const ox = (Math.random() - 0.5) * 40;
            const oy = (Math.random() - 0.5) * 20;
            this.floatingTexts.push({ text: `+$${totalReward}`, x: lastDeliveryX + ox, y: lastDeliveryY - 40 + oy, life: 1.5, color: '#10b981' });
        }

        // Check if any cargo fell into the abyss, or has gone stale from neglect
        for (let i = boxes.length - 1; i >= 0; i--) {
            const box = boxes[i];
            const terrainY = this.physics.getPolygonSurfaceY(box.x);

            // If box fell below the terrain height by a buffer, or off screen bottom
            if (box.y > terrainY + 50 || box.y > this.physics.levelHeight) {
                // Spawn smoke particles
                this.spawnDeliveryParticles(box.x, terrainY, "#475569");
                this.removeCargoBox(box, i);

                // Penalize Mission Budget
                this.missionBudget -= 100;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo Lost! -$100 Budget", "#ef4444");

                if (this.missionBudget < 0) {
                    this.failMission("Bankrupt! Too much cargo lost.");
                }
                continue;
            }

            // Cargo left sitting unclaimed for ~1 minute goes unstable and blows up —
            // discourages hoarding boxes on the deck or leaving them scattered forever.
            const isHeld = box.onDeck || (lander && lander.grabbedBoxId === box.id);
            if (!isHeld && (box.age || 0) > 3600) {
                for (let p = 0; p < 24; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1 + Math.random() * 4;
                    this.physics.particles.push({
                        x: box.x, y: box.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 1,
                        life: 1.0,
                        decay: 0.02 + Math.random() * 0.03,
                        color: Math.random() < 0.6 ? `hsla(${15 + Math.random() * 25}, 100%, 55%, 0.9)` : '#475569',
                        size: 5 + Math.random() * 7
                    });
                }
                if (window.CargoAudio && !this.isMuted) CargoAudio.playCrash();
                this.removeCargoBox(box, i);

                this.missionBudget -= 100;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo went stale and exploded! -$100 Budget", "#f97316");

                if (this.missionBudget < 0) {
                    this.failMission("Bankrupt! Too much cargo lost.");
                }
            }
        }
    }

    // Removes a box from the simulation: detaches it from the lander if held,
    // drops its Matter body (otherwise it lingers in the world and keeps
    // colliding/simulating invisibly), and splices it out of physics.boxes.
    removeCargoBox(box, index) {
        const lander = this.physics.lander;
        if (lander && lander.grabbedBoxId === box.id) {
            lander.grabbedBoxId = null;
        }
        const body = this.physics.boxBodyMap?.get(box.id);
        if (body) {
            Matter.Composite.remove(this.physics.matterWorld, body);
            this.physics.boxBodyMap.delete(box.id);
        }
        this.physics.boxes.splice(index, 1);
    }

    processSuccessfulDelivery(box, index, hub) {
        this.spawnDeliveryParticles(box.x, box.y, hub.color);
        this.removeCargoBox(box, index);
        hub.craneAnim = { timer: 0, lx: box.x, ly: box.y, boxType: box.type };

        this.deliveredCount++;
        this.career.totalDeliveries++;
        this.saveCareer();
        const deliveryReward = 120;
        this.globalCash += deliveryReward;
        localStorage.setItem('cargoLanderCash', this.globalCash);
        if (window.CargoAudio && !this.isMuted) CargoAudio.playUnload();
        
        return deliveryReward;
    }

    updateBoxFireState(dt) {
        const boxes = this.physics.boxes;
        if (!boxes.length) return;
        const cp = this.physics.collectionPoint;
        const sd = this.physics.startDepot;

        for (let i = boxes.length - 1; i >= 0; i--) {
            const box = boxes[i];
            if (box.onDeck) { box.fireTimer = 0; continue; }

            // Safe pads: collection point, start depot, delivery hubs
            const onSafe =
                (cp && box.x >= cp.x - 20 && box.x <= cp.x + cp.width + 20 && Math.abs(box.y - cp.y) < 50) ||
                (sd && box.x >= sd.x - 20 && box.x <= sd.x + sd.width + 20 && Math.abs(box.y - sd.y) < 50) ||
                this.physics.deliveryHubs.some(h => box.x >= h.x - 20 && box.x <= h.x + h.width + 20 && box.y > h.y - 50);

            if (onSafe) { box.fireTimer = 0; continue; }

            // Box is loose on terrain — accumulate fire timer when mostly settled
            const speed = Math.sqrt(box.vx * box.vx + box.vy * box.vy);
            if (speed < 2) {
                box.fireTimer = (box.fireTimer || 0) + dt;
            } else {
                box.fireTimer = Math.max(0, (box.fireTimer || 0) - dt);
            }

            // Explode after ~3 seconds of burning (180 frames at 60fps)
            if (box.fireTimer > 180) {
                // Explosion particles
                for (let p = 0; p < 30; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 8;
                    this.physics.particles.push({
                        x: box.x, y: box.y,
                        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 2,
                        life: 0.9 + Math.random() * 0.1,
                        decay: 0.025 + Math.random() * 0.02,
                        size: 2 + Math.random() * 4,
                        color: ['#f97316', '#ef4444', '#fbbf24', '#94a3b8'][Math.floor(Math.random() * 4)],
                    });
                }
                if (window.CargoAudio && !this.isMuted) CargoAudio.playCollision();
                this.addMessage('Cargo destroyed! -$150', '#ef4444');
                this.missionBudget -= 150;
                this.removeCargoBox(box, i);
            }
        }
    }

    spawnDeliveryParticles(x, y, color) {
        const isSuccess = color !== "#475569";
        const count = isSuccess ? 45 : 15;

        for (let i = 0; i < count; i++) {
            const pColor = isSuccess
                ? (Math.random() > 0.4 ? color : ['#f43f5e', '#10b981', '#38bdf8', '#fbbf24', '#a855f7'][Math.floor(Math.random() * 5)])
                : color;

            this.physics.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * (isSuccess ? 8 : 4),
                vy: isSuccess ? (-Math.random() * 6 - 2) : (-Math.random() * 4 - 1),
                life: 1.0,
                decay: isSuccess ? (0.015 + Math.random() * 0.025) : (0.03 + Math.random() * 0.03),
                color: pColor,
                size: isSuccess ? (3 + Math.random() * 5) : (2 + Math.random() * 4)
            });
        }
    }

    createExplosion(x, y) {
        for (let i = 0; i < 40; i++) {
            this.physics.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1.0,
                maxLife: 0.5 + Math.random(),
                color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b',
                size: 2 + Math.random() * 8
            });
        }
    }

    selfDestruct() {
        if (this.gameState !== 'playing' || !this.physics.lander || this.physics.lander.crashed) return;
        this.physics.lander.integrity = 0;
        this.physics.lander.crashed = true;
        if (window.CargoAudio) window.CargoAudio.playCollision(10);
        this.physics.triggerExplosion();
    }

    refuelLander() {
        const lander = this.physics.lander;
        if (!lander || this.globalCash < 100 || lander.fuel >= lander.maxFuel) return;
        this.globalCash -= 100;
        lander.fuel = lander.maxFuel;
        this.saveCareer();
        if (window.CargoAudio) window.CargoAudio.playClick();
        this.addMessage("Vehicle refueled.", "#10b981");
    }

    repairLander() {
        const lander = this.physics.lander;
        if (!lander || this.globalCash < 200 || lander.integrity >= lander.maxIntegrity) return;
        this.globalCash -= 200;
        lander.integrity = lander.maxIntegrity;
        this.saveCareer();
        if (window.CargoAudio) window.CargoAudio.playClick();
        this.addMessage("Integrity restored.", "#10b981");
    }

    completeMission() {
        // Must be landed at HQ to extract
        const lander = this.physics.lander;
        if (!lander || !lander.landed || lander.currentPad !== 'start') {
            this.addMessage("Return to HQ pad to extract!", "#f59e0b");
            return;
        }

        this.gameState = 'level_complete';
        if (!this.isMuted && window.CargoAudio) CargoAudio.playSuccess();
        
        const centerOverlay = document.getElementById('center-extract-overlay');
        if (centerOverlay) centerOverlay.style.display = 'none';

        document.getElementById('hud-overlay').style.display = 'none';

        const level = levels[this.currentLevelIndex];

        // Evaluate time-gated bonus quests now
        if (level.quests) {
            for (const q of level.quests) {
                if (q.id === 'quick' && q.timeGoal !== undefined) {
                    if (this.missionTimer > q.timeGoal && !this.questState['quick']?.failed) {
                        this.questState['quick'] = { completed: true };
                    }
                }
                if (q.id === 'no_crash' && !this.questState['no_crash']?.failed) {
                    this.questState['no_crash'] = { completed: true };
                }
                if (q.id === 'no_cargo_lost' && !this.questState['no_cargo_lost']?.failed) {
                    this.questState['no_cargo_lost'] = { completed: true };
                }
            }
        }

        // Tally quest bonuses
        let questBonus = 0;
        let questLines = '';
        if (level.quests) {
            for (const q of level.quests) {
                if (q.reward && this.questState[q.id]?.completed) {
                    questBonus += q.reward;
                    questLines += `<p>${q.text}: <span style="color:#10b981;font-weight:600;">+$${q.reward}</span></p>`;
                }
            }
        }

        const timeBonus = Math.floor(this.missionTimer) * 10;
        const totalPayout = this.missionBudget + timeBonus + questBonus;

        this.globalCash += totalPayout;
        localStorage.setItem('cargoLanderCash', this.globalCash);

        // Career + highscore tracking
        this.career.missionsComplete++;
        this.saveCareer();
        const prevBest = this.highscores[this.currentLevelIndex] || 0;
        if (totalPayout > prevBest) {
            this.highscores[this.currentLevelIndex] = totalPayout;
            this.saveHighscores();
        }

        document.getElementById('complete-screen').style.display = 'flex';
        const nextBtn = document.querySelector('#complete-screen .btn-primary');
        if (nextBtn) {
            nextBtn.textContent = this.isPlaytest ? "Back to Editor ➔" : "Next Mission ➔";
        }
        document.getElementById('lvl-complete-title').textContent = "Extraction Successful!";
        document.getElementById('lvl-complete-details').innerHTML = `
            <p>Base Contract Payout: <span style="color: #10b981; font-weight:600;">$${this.missionBudget}</span></p>
            <p>Time Bonus: <span style="color: #38bdf8; font-weight:600;">+$${timeBonus}</span></p>
            ${questLines}
            <hr style="border:1px solid rgba(255,255,255,0.1);">
            <p>Total Global Cash: <span style="color: #f59e0b; font-weight:600;">$${this.globalCash}</span></p>
        `;
    }

}
