// CargoLander - Game Core Loop & Renderer
// Level configs: level1.js – level6.js  (each calls registerLevel)
// Level registry + upgradeCatalog: levels.js
// Load order in index.html: level1–6 → levels → audio → shaders → physics → game

class CargoGame {
    static VERSION = '0.6.8';

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
        this.isMuted = false; // Always start unmuted
        // Default UI Scale is 100% on desktop, but the HUD panels are absolutely
        // positioned at a fixed base size (only font/padding shrink via @media
        // rules) — on a phone or short mobile-landscape window, 100% overlaps or
        // runs off-screen well before anyone finds the manual slider in Settings
        // to fix it. Only applies the smaller default on first run; once a value
        // is saved, the manual slider always wins.
        this.uiScale = parseFloat(localStorage.getItem('cargo_lander_ui_scale')) || this.computeDefaultUIScale();
        this.uiCollapsed = false;
        // GPU post-processing overlay (heat haze / water shimmer / gravity lensing) —
        // on by default, but it's an extra full-screen WebGL pass every frame on top
        // of the existing particle/glow overlay, so let low-end hardware disable it.
        this.postFXEnabled = localStorage.getItem('cargoLanderPostFX') !== '0';
        // Experimental virtual joystick, replacing the left/thrust mobile buttons —
        // off by default; the D-pad-style buttons stay the default touch scheme.
        this.touchJoystickEnabled = localStorage.getItem('cargoLanderTouchJoystick') === '1';
        this._rotateTipDismissed = false;

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
            btnDestruct: document.getElementById('btn-destruct'),
            fuelFill: document.getElementById('fuel-fill'),
            lowFuelWarning: document.getElementById('low-fuel-warning'),
            devPanel: document.getElementById('dev-panel'),
            devReadout: document.getElementById('dev-readout'),
            missionTitle: document.getElementById('mission-title'),
            missionQuests: document.getElementById('mission-quests'),
            missionStatCargo: document.getElementById('mission-stat-cargo'),
            missionStatBudget: document.getElementById('mission-stat-budget'),
            missionStatTime: document.getElementById('mission-stat-time'),
            radarCanvas: document.getElementById('radar-canvas'),
            notificationsContainer: document.getElementById('notifications-container'),
            tutorialContainer: document.getElementById('tutorial-container')
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
                eyeBtn.textContent = '👁 Show HUD';
                eyeBtn.title = 'Show UI';
            }
        } else {
            if (vitals) vitals.style.display = 'flex';
            if (leftPanel) leftPanel.style.display = 'flex';
            if (radarContainer) radarContainer.style.display = 'block';
            if (hudToolbar) hudToolbar.style.display = 'flex';
            if (optionsBtn) optionsBtn.style.display = 'inline-flex';
            
            const eyeBtn = document.getElementById('hide-ui-btn');
            if (eyeBtn) {
                eyeBtn.style.opacity = '1';
                eyeBtn.textContent = '👁 Hide HUD';
                eyeBtn.title = 'Hide UI';
            }
        }
    }

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
    }

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
    }

    resizeCanvas() {
        const targetW = window.innerWidth;
        const targetH = window.innerHeight;
        this.canvas.width = targetW;
        this.canvas.height = targetH;
        if (this.shaders) {
            this.shaders.resize(targetW, targetH);
        }
        this.checkOrientationPrompt();
    }

    // Shows a dismissable "rotate to landscape" tip while a mission is active on a
    // narrow/portrait viewport (phone or small tablet). Aspect-ratio-based rather
    // than touch-capability-based — touch detection is unreliable (hybrid laptops
    // report touch support; tablets on a stand are portrait-fine), and this also
    // means the check is exercisable from a resized desktop browser, not just a
    // real device. Re-armed each time a mission starts (see startLevel()) so it
    // isn't permanently silenced after one dismissal, but never shows more than
    // once per mission attempt.
    checkOrientationPrompt() {
        const tip = document.getElementById('rotate-tip');
        if (!tip) return;
        if (this._rotateTipDismissed) { tip.style.display = 'none'; return; }

        const isPortrait = window.innerHeight > window.innerWidth;
        const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) <= 820;
        const inMission = this.gameState === 'playing';

        tip.style.display = (isPortrait && isSmallScreen && inMission) ? 'flex' : 'none';
    }

    dismissRotateTip() {
        this._rotateTipDismissed = true;
        const tip = document.getElementById('rotate-tip');
        if (tip) tip.style.display = 'none';
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
            if (e.button === 0) {
                // Left click - Shoot firework
                if (this.gameState === 'playing' && this.physics && this.physics.lander && !this.physics.lander.crashed) {
                    this.shootPlayerFirework(this.physics.lander.x, this.physics.lander.y, this.mouseX, this.mouseY);
                }
            } else if (e.button === 2) {
                // Right click - Grapple (Drone action)
                if (this.physics && this.physics.lander && this.physics.lander.vehicleType === 'drone') {
                    if (this.physics.handleAction) this.physics.handleAction();
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            // Nothing needed for now
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
        // orientationchange fires slightly before resize on some mobile browsers —
        // listen to both so the rotate tip reacts as soon as possible.
        window.addEventListener('orientationchange', () => this.checkOrientationPrompt());

        // Gamepad (Xbox/standard-layout controller) support — see pollGamepad().
        window.addEventListener('gamepadconnected', (e) => {
            this.addMessage(`🎮 Controller connected: ${e.gamepad.id}`, '#34d399');
        });
        window.addEventListener('gamepaddisconnected', () => {
            this.addMessage('🎮 Controller disconnected', '#f8fafc');
        });
    }

    // Polled once per frame from update() — the Gamepad API has no button-press
    // events, only a live snapshot read via navigator.getGamepads(). Merges
    // directly into this.keys (same booleans the keyboard path sets) so the rest
    // of applyControls()/inputState needs no gamepad-specific branching, and
    // gamepad + keyboard can be used interchangeably frame to frame.
    pollGamepad() {
        const pads = navigator.getGamepads ? navigator.getGamepads() : null;
        if (!pads) return;
        let pad = null;
        for (const p of pads) { if (p) { pad = p; break; } }
        if (!pad) return;

        const DEAD_ZONE = 0.2;
        const stickX = pad.axes[0] || 0;
        const stickUp = -(pad.axes[1] || 0); // axes[1] is +1 down, we want +1 = up
        const rightTrigger = pad.buttons[7] ? pad.buttons[7].value : 0; // analog thrust
        const aBtn = pad.buttons[0] && pad.buttons[0].pressed;
        const bBtn = pad.buttons[1] && pad.buttons[1].pressed;

        this.keys['gp_left'] = stickX < -DEAD_ZONE;
        this.keys['gp_right'] = stickX > DEAD_ZONE;
        // Right trigger is the primary thrust input (analog on most pads); left
        // stick pushed up is the alternate for pads without analog triggers.
        this.keys['gp_up'] = rightTrigger > 0.1 || stickUp > DEAD_ZONE;

        // Edge-trigger A/B (fire once per press, not every frame held) so they
        // behave like the SPACE-key dispatch rather than a held-down key.
        if (aBtn && !this._gpAPrev) {
            const lander = this.physics.lander;
            if (lander) {
                const level = levels[this.currentLevelIndex];
                const allDelivered = level && this.deliveredCount >= level.targetCargo;
                const atHQ = lander.landed && lander.currentPad === 'start';
                if (this.gameState === 'playing' && allDelivered && atHQ) {
                    this.completeMission();
                } else {
                    this.toggleGrapple();
                }
            }
        }
        if (bBtn && !this._gpBPrev) {
            const lander = this.physics.lander;
            if (lander && lander.grabbedBoxId) {
                lander.grabbedBoxId = null;
                if (window.CargoAudio && !this.isMuted) CargoAudio.playLoad();
            }
        }
        this._gpAPrev = aBtn;
        this._gpBPrev = bBtn;
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
        const rotateTip = document.getElementById('rotate-tip');
        if (rotateTip) rotateTip.style.display = 'none';

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
    }

    refreshMenuUI() {
        this.refreshVehicleLicenseUI();
        
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

    setPostFXEnabled(checked) {
        this.postFXEnabled = checked;
        localStorage.setItem('cargoLanderPostFX', checked ? '1' : '0');
    }

    setTouchJoystickEnabled(checked) {
        this.touchJoystickEnabled = checked;
        localStorage.setItem('cargoLanderTouchJoystick', checked ? '1' : '0');
        if (window.applyTouchControlMode) window.applyTouchControlMode(checked);
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
        
        if (vehicleType === 'drone') {
            this.career.hasUsedDrone = true;
            this.saveCareer();
        }
        
        this.refreshVehicleLicenseUI();
        this.refreshMenuUI(); // Refresh menu so tutorial pointer can disappear
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
        const completeScreen = document.getElementById('complete-screen');
        if (completeScreen) completeScreen.style.display = 'none';
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
        this._rotateTipDismissed = false;
        this.checkOrientationPrompt();
        
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
        // Keep legacy messages array for canvas renderers that may still read it
        this.messages.push({ text, color, life: 1.0, y: 175 });
        if (this.messages.length > 4) this.messages.shift();

        // Also create a real DOM notification element
        const isTutorial = text.startsWith('TUTORIAL:');
        const label = isTutorial ? text.replace('TUTORIAL: ', '') : text;
        const container = isTutorial
            ? (this.uiElements?.tutorialContainer || document.getElementById('tutorial-container'))
            : (this.uiElements?.notificationsContainer || document.getElementById('notifications-container'));

        if (!container) return;

        const el = document.createElement('div');
        el.style.cssText = isTutorial
            ? `font: 600 11px Outfit,sans-serif; color: ${color}; background: rgba(6,20,16,0.85); border: 1px solid rgba(52,211,153,0.4); border-radius: 8px; padding: 5px 10px; white-space: nowrap; opacity: 1; transition: opacity 0.5s;`
            : `font: bold 16px Outfit,sans-serif; color: ${color}; background: rgba(5,8,18,0.82); border-radius: 14px; padding: 8px 20px; white-space: nowrap; opacity: 1; transition: opacity 0.5s; text-align: center;`;
        el.textContent = isTutorial ? '💡 ' + label : label;
        container.appendChild(el);

        // Fade out and remove after 5 seconds
        const duration = isTutorial ? 8000 : 5000;
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        }, duration);

        // Clamp to max 4 notifications in container
        while (container.children.length > 4) {
            container.firstChild.remove();
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
                        const canAfford = this.missionBudget >= 100;
                        btnRefuel.disabled = !needsFuel || !canAfford;
                        btnRefuel.style.opacity = btnRefuel.disabled ? '0.5' : '1';
                        btnRefuel.style.cursor = btnRefuel.disabled ? 'not-allowed' : 'pointer';
                    }
                    if (btnRepair) {
                        const needsRepair = lander.integrity < lander.maxIntegrity;
                        const canAfford = this.missionBudget >= 200;
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

    updateMissionPanel() {
        const level = levels[this.currentLevelIndex];
        if (!level) return;

        const panel = document.getElementById('mission-panel');
        if (!panel) return;

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

        // ── Full panel HTML ───────────────────────────────────────────────
        // Use dataset fingerprint to avoid full rebuilds on every frame
        const fp = `${timeStr}|${budgetStr}|${delivered}|${target}|${timeColor}`;
        if (panel.dataset.fp === fp) return; // nothing changed visually
        panel.dataset.fp = fp;

        panel.innerHTML = `
            <div style="font-size:9px;letter-spacing:.12em;color:rgba(56,189,248,0.7);text-transform:uppercase;margin-bottom:2px;">Mission</div>
            <div style="font-weight:700;font-size:14px;color:rgba(248,250,252,0.95);margin-bottom:6px;line-height:1.2;">${level.missionTitle || level.name || ''}</div>

            <!-- Key stats: time + budget side-by-side -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px;">
                <div style="background:rgba(0,0,0,0.25);border-radius:6px;padding:4px 7px;">
                    <div style="font-size:9px;color:rgba(148,163,184,0.7);letter-spacing:.08em;text-transform:uppercase;">Time</div>
                    <div id="mission-stat-time" style="font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;color:${timeColor};line-height:1.1;">${timeStr}</div>
                </div>
                <div style="background:rgba(0,0,0,0.25);border-radius:6px;padding:4px 7px;">
                    <div style="font-size:9px;color:rgba(148,163,184,0.7);letter-spacing:.08em;text-transform:uppercase;">Budget</div>
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

        // Destruct button visibility
        const btnDestruct = this.uiElements?.btnDestruct || document.getElementById('btn-destruct');
        if (btnDestruct) {
            if (this.gameState === 'playing') btnDestruct.classList.remove('hidden');
            else btnDestruct.classList.add('hidden');
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

    shootPlayerFirework(startX, startY, targetX, targetY) {
        if (!this.physics || !this.physics.particles) return;
        
        // Calculate direction and speed
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 12; // rocket speed
        const rocketVx = (dx / dist) * speed;
        const rocketVy = (dy / dist) * speed;
        
        const flyTimeMs = (dist / speed) * 16.66; // approx frames
        
        const rocket = {
            x: startX, y: startY,
            vx: rocketVx, vy: rocketVy,
            life: 2.0, decay: 0.01,
            color: '#ffffff', size: 6
        };
        this.physics.particles.push(rocket);
        
        const exhaustInterval = setInterval(() => {
            if (rocket.life > 0 && this.gameState === 'playing') {
                this.physics.particles.push({
                    x: rocket.x, y: rocket.y,
                    vx: rocket.vx * 0.1 + (Math.random() - 0.5) * 2,
                    vy: rocket.vy * 0.1 + Math.random() * 2,
                    life: 0.6, decay: 0.04,
                    color: '#f97316', size: 3
                });
            } else {
                clearInterval(exhaustInterval);
            }
        }, 30);
        
        if (!this.isMuted && window.CargoAudio && window.CargoAudio.playCollision) {
            CargoAudio.playCollision(2);
        }
        
        setTimeout(() => {
            if (this.gameState !== 'playing' && this.gameState !== 'level_complete') return;
            rocket.life = 0;
            
            const bx = startX + rocketVx * (flyTimeMs / 16);
            const by = startY + rocketVy * (flyTimeMs / 16);
            
            const baseHue = Math.random() * 360;
            for (let i = 0; i < 40; i++) {
                this.physics.particles.push({
                    x: bx, y: by,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    gy: 0.05,
                    life: 1.0 + Math.random() * 1.5,
                    decay: 0.01 + Math.random() * 0.02,
                    color: `hsla(${baseHue}, 100%, 60%, 1)`,
                    size: 2 + Math.random() * 4
                });
            }
            if (!this.isMuted && window.CargoAudio && window.CargoAudio.playCollision) {
                CargoAudio.playCollision(2);
            }
        }, Math.min(flyTimeMs, 2000)); // cap flight time
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
        if (atHQ && allDelivered && this.gameState === 'playing') {
            if (!this._fireworksStartTime) this._fireworksStartTime = Date.now();
            const elapsed = Date.now() - this._fireworksStartTime;
            const intense = elapsed < 2000;
            
            if (!this._currentFireworkDelay) this._currentFireworkDelay = 0;
            
            if (!this._lastFireworkTime || Date.now() - this._lastFireworkTime > this._currentFireworkDelay) {
                this._currentFireworkDelay = (intense ? 200 : 700) + Math.random() * (intense ? 300 : 1200);
                this._lastFireworkTime = Date.now();
                if (this.physics && this.physics.particles) {
                    const hqPad = this.physics.pads ? this.physics.pads.find(p => p.type === 'start') : null;
                    const startX = hqPad ? hqPad.x + (Math.random() - 0.5) * hqPad.width : lander.x + (Math.random() - 0.5) * 300;
                    const startY = hqPad ? hqPad.y : lander.y + 10;
                    
                    // Gaussian-like spread favoring the center
                    const spread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
                    const rocketVx = spread * 4.5;
                    const rocketVy = -5 - Math.random() * 4; // ascent
                    const flyTimeMs = 400 + Math.random() * 300;
                    
                    // Launch rocket (bright white/yellow core)
                    const rocket = {
                        x: startX, y: startY,
                        vx: rocketVx, vy: rocketVy,
                        life: 2.0, decay: 0.01, // high life so alpha is 1.0 (fully bright)
                        color: '#ffffff', size: 6
                    };
                    this.physics.particles.push(rocket);
                    
                    // Rocket exhaust trail
                    const exhaustInterval = setInterval(() => {
                        if (rocket.life > 0 && this.gameState === 'playing') {
                            this.physics.particles.push({
                                x: rocket.x, y: rocket.y + 2,
                                vx: rocket.vx * 0.1 + (Math.random() - 0.5) * 2,
                                vy: rocket.vy * 0.1 + Math.random() * 2,
                                life: 0.6, decay: 0.04,
                                color: '#f97316', size: 3
                            });
                        } else {
                            clearInterval(exhaustInterval);
                        }
                    }, 30);
                    
                    if (!this.isMuted && window.CargoAudio && window.CargoAudio.playCollision) {
                        CargoAudio.playCollision(2); // launch pop
                    }
                    
                    setTimeout(() => {
                        if (this.gameState !== 'playing' && this.gameState !== 'level_complete') return;
                        
                        rocket.life = 0; // kill the rocket particle
                        
                        const bx = startX + rocketVx * (flyTimeMs / 16);
                        const by = startY + rocketVy * (flyTimeMs / 16);
                        
                        const variant = Math.floor(Math.random() * 3);
                        const baseHue = Math.random() * 360;
                        
                        for (let i = 0; i < 60; i++) {
                            let vx, vy, color, gy = 0;
                            
                            if (variant === 0) { // Circle
                                const angle = (i / 60) * Math.PI * 2;
                                const speed = 6 + Math.random() * 2;
                                vx = Math.cos(angle) * speed;
                                vy = Math.sin(angle) * speed;
                                gy = 0.03;
                                color = `hsla(${baseHue}, 100%, 60%, 1)`;
                            } else if (variant === 1) { // Weeping Willow (gravity)
                                vx = (Math.random() - 0.5) * 8;
                                vy = (Math.random() - 0.5) * 8 - 4; // slight upward bias initially
                                gy = 0.12; // strong gravity pulls it down
                                color = `hsla(${baseHue}, 100%, 60%, 1)`;
                            } else { // Multi-color standard burst
                                vx = (Math.random() - 0.5) * 12;
                                vy = (Math.random() - 0.5) * 12;
                                gy = 0.05; // slight gravity
                                color = `hsla(${Math.random() * 360}, 100%, 60%, 1)`;
                            }
                            
                            this.physics.particles.push({
                                x: bx, y: by,
                                vx: vx, vy: vy, gy: gy,
                                life: 1.5 + Math.random() * 2.0,
                                decay: 0.008 + Math.random() * 0.015,
                                color: color,
                                size: 2 + Math.random() * 5
                            });
                        }
                        if (!this.isMuted && window.CargoAudio && window.CargoAudio.playCollision) {
                            CargoAudio.playCollision(2); // burst pop
                        }
                    }, flyTimeMs);
                }
            }
        } else {
            this._lastFireworkTime = 0;
            this._fireworksStartTime = 0;
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

        this.pollGamepad();
        const keys = this.keys;

        // Bundle inputs
        const inputState = {
            up: keys['w'] || keys['arrowup'] || keys['gp_up'] || keys['joy_up'],
            down: keys['s'] || keys['arrowdown'],
            left: keys['a'] || keys['arrowleft'] || keys['gp_left'] || keys['joy_left'],
            right: keys['d'] || keys['arrowright'] || keys['gp_right'] || keys['joy_right'],
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

            if (lander.eatenByMonster && this.missionTimer <= 0) {
                // Devoured reads as final, not a fender-bender you press R to
                // shrug off — straight to a hard mission failure instead of
                // the usual respawnable-crash flow below. No budget deduction
                // (there's no mission left to spend it on) and no respawn
                // screen. See physics/atmosphere.js's monster contact check
                // for where lander.eatenByMonster gets set.
                this.addMessage("CONSUMED BY THE ANOMALY", "#ef4444");
                this.failMission("Consumed by the anomaly.");
            } else {
                if (lander.eatenByMonster) {
                    this.missionBudget -= 400;
                    this.addMessage("Lander Consumed: -$400", "#ef4444");
                } else if (lander.busted) {
                    this.missionBudget -= 1000;
                    this.addMessage("BUSTED! Paid $1000 fine.", "#ef4444");
                } else {
                    this.missionBudget -= 400;
                    this.addMessage("Lander Destroyed: -$400", "#ef4444");
                }
                this.addMessage("Press 'R' to deploy replacement", "#fca5a5");

                if (this.missionBudget < 0) {
                    this.failMission("Bankrupt! Budget exceeded.");
                }

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
        }

        // Refill alert sound check
        if (lander.fuel <= 0 && !lander.landed) {
            if (!this.isMuted) CargoAudio.setWarning(true);
        }

        // Update legacy messages array (used by canvas renderer fallback)
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const m = this.messages[i];
            m.life -= 0.0025 * dt;
            if (m.life <= 0) this.messages.splice(i, 1);
        }

        // Update mission panel HTML
        this.updateMissionPanel();

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

            // Physics flags boxes destroyed by lasers (box.lost) but can't remove
            // them itself — finish the removal here so the Matter body and any
            // grapple state are cleaned up through removeCargoBox().
            if (box.lost) {
                this.removeCargoBox(box, i);

                this.missionBudget -= 200;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo vaporized by laser! -$200 Budget", "#ef4444");

                if (this.missionBudget < 0) {
                    this.failMission("Bankrupt! Too much cargo lost.");
                }
                continue;
            }

            const terrainY = this.physics.getPolygonSurfaceY(box.x);

            // If box fell below the terrain height by a buffer, or off screen bottom
            if (box.y > terrainY + 50 || box.y > this.physics.levelHeight) {
                // Spawn smoke particles
                this.spawnDeliveryParticles(box.x, terrainY, "#475569");
                this.removeCargoBox(box, i);

                // Penalize Mission Budget
                this.missionBudget -= 200;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo Lost! -$200 Budget", "#ef4444");

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

                this.missionBudget -= 200;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo went stale and exploded! -$200 Budget", "#f97316");

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
        
        const deliveryReward = 300;
        this.missionBudget += deliveryReward; // Add directly to mission ledger
        this.addMessage(`Delivery Complete! +$${deliveryReward}`, "#10b981");

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
        if (!lander || this.missionBudget < 100 || lander.fuel >= lander.maxFuel) return;
        this.missionBudget -= 100;
        lander.fuel = lander.maxFuel;
        if (window.CargoAudio) window.CargoAudio.playClick();
        this.addMessage("Vehicle refueled. -$100 Budget", "#10b981");
    }

    repairLander() {
        const lander = this.physics.lander;
        if (!lander || this.missionBudget < 200 || lander.integrity >= lander.maxIntegrity) return;
        this.missionBudget -= 200;
        lander.integrity = lander.maxIntegrity;
        if (window.CargoAudio) window.CargoAudio.playClick();
        this.addMessage("Integrity restored. -$200 Budget", "#10b981");
    }

    completeMission() {
        // Must be landed at HQ to extract
        const lander = this.physics.lander;
        if (!lander || !lander.landed || lander.currentPad !== 'start') {
            this.addMessage("Return to HQ pad to extract!", "#f59e0b");
            return;
        }

        // The manual Extract button/spacebar are already gated on this in the
        // UI (hidden/no-op until allDelivered), but the overtime countdown's
        // "made it back to HQ" auto-extraction (update(), grep
        // "safe extraction") calls completeMission() unconditionally — so
        // without this check here, running out the mission clock and limping
        // back to HQ with 0 cargo delivered still paid out a full success
        // reward. This is the single authoritative gate all callers rely on.
        const level = levels[this.currentLevelIndex];
        const allDelivered = this.deliveredCount >= (level.targetCargo || 0);
        if (!allDelivered) {
            this.failMission("Extracted without completing deliveries.");
            return;
        }

        this.gameState = 'level_complete';
        if (!this.isMuted && window.CargoAudio) CargoAudio.playSuccess();

        const centerOverlay = document.getElementById('center-extract-overlay');
        if (centerOverlay) centerOverlay.style.display = 'none';

        document.getElementById('hud-overlay').style.display = 'none';

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
