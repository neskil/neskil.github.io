// CargoLander — game core: CargoGame class (state, constructor, init), the
// requestAnimationFrame loop, update(dt), mission lifecycle (startLevel /
// completeMission / failMission / respawn), camera, and grapple.
//
// The rest of CargoGame is mixed onto its prototype from sibling files:
//   game/input.js  — keyboard/mouse listeners + gamepad polling
//   game/menu.js   — menu screens, settings, upgrade shop, dev panel (DOM)
//   game/hud.js    — in-mission HUD, mission panel, notifications (DOM)
//   game/cargo.js  — cargo delivery, removal (removeCargoBox), payouts, FX
//   render.js + render/*.js — all Canvas2D drawing
// Load order (index.html): levels → audio → shaders → physics + physics/* →
// game.js → game/* → render.js + render/* (render.js instantiates window.game).

class CargoGame {
    static VERSION = '0.10.3';

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
            aerodynamics: 0,
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
        // Touch devices get a smaller vertical camera offset (see cameraVOffset
        // below) — the desktop offset pushes the lander noticeably off-center on
        // a short mobile-landscape viewport, where every pixel of vertical room
        // is already contested by the HUD panels above and the touch controls below.
        this.isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        // World-unit offset subtracted from the lander's Y to get the camera's
        // vertical focus point — shifts the framing up to show more air/sky above
        // the lander than below. Smaller on touch devices so the lander sits
        // closer to true screen-center instead of low in the frame.
        this.cameraVOffset = this.isTouchDevice ? 50 : 120;

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

        // Set correct visibility synchronously so there's no flash of touch
        // controls before the first RAF tick (was relying solely on a CSS
        // media-query default that ignored gameState/isTouchDevice).
        this.updateMobileControlsVisibility();

        // Show pilot portrait selector on first startup
        if (!this.career.portrait && !localStorage.getItem('cargoLanderHasSeenPortraitSelector')) {
            localStorage.setItem('cargoLanderHasSeenPortraitSelector', '1');
            setTimeout(() => {
                this.openPortraitSelector(true);
            }, 600);
        }

        // Start game loop
        requestAnimationFrame((t) => this.loop(t));
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


    // Quick console shortcut: game.startTestLevel()
    startTestLevel() { this.startLevel(levels.length - 1); }

    showConfirm(title, message, onConfirm) {
        document.getElementById('confirm-modal-title').textContent = title;
        document.getElementById('confirm-modal-desc').innerHTML = message;
        document.getElementById('confirm-modal').style.display = 'flex';
        
        const yesBtn = document.getElementById('confirm-modal-yes');
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        
        newYesBtn.onclick = () => {
            document.getElementById('confirm-modal').style.display = 'none';
            if (onConfirm) onConfirm();
        };
    }

    goToMenu() {
        if (this.gameState === 'playing' && !this.isPlaytest) {
            this.showConfirm("Exit Mission?", "If you exit now, your lander will be abandoned and you will forfeit your entire invested budget!", () => {
                this._executeGoToMenu();
            });
            return;
        }
        this._executeGoToMenu();
    }

    _executeGoToMenu() {
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
        // Mission panel starts expanded each mission; clearing the event
        // fingerprint makes updateMissionPanel treat mission start as an
        // event (arming the small-viewport auto-collapse timer).
        this.missionPanelCollapsed = false;
        this.missionPanelPinned = false;
        this._missionEventFp = undefined;
        this._missionAutoCollapseAt = 0;
        const level = levels[idx];
        level.vehicle = vehicleType;

        // Deduct entry fee and risk the mission budget from global cash
        const entryFee = 50 + (idx * 50);
        this.globalCash -= (entryFee + (level.budget || 1000));
        localStorage.setItem('cargoLanderCash', this.globalCash);

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
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    const isDrone = this.physics.lander && this.physics.lander.vehicleType === 'drone';
                    if (isDrone) {
                        this.addMessage("TUTORIAL: Pick up cargo from the crane using grapple (Spacebar / Right Click)", "#34d399");
                    } else {
                        this.addMessage("TUTORIAL: Land on the Collection Pad to automatically load cargo", "#34d399");
                    }
                }
            }, 9000);
            setTimeout(() => { if (this.gameState === 'playing') this.addMessage("TUTORIAL: Deliver cargo to the glowing Delivery Hubs", "#34d399") }, 15000);
        }

        // Setup initial camera position
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const levelFitZoom = Math.min(cw / this.physics.levelWidth, ch / this.physics.levelHeight) * 0.95;
        const minZoom = Math.max(0.45, levelFitZoom);
        let desiredZoom = 1.1;
        desiredZoom = Math.max(minZoom, Math.min(1.8, desiredZoom));
        desiredZoom *= (this.zoomModifier || 1.0);

        this.camera.zoom = desiredZoom;
        this.camera.targetZoom = desiredZoom;
        this.camera.x = this.physics.lander.x;
        this.camera.y = this.physics.lander.y - this.cameraVOffset;
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
        if (this.gameState !== 'playing') return;
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

    // One frame of game logic. Each phase is a method below — the order here is
    // load-bearing (clock/overtime before the physics tick; camera after it;
    // auto-load before delivery checks; HUD/panel last).
    update(dt) {
        this.updateMobileControlsVisibility();
        if (this.updateWeather) this.updateWeather(dt);
        
        if (this.gameState === 'menu' && this.drawVehicleCanvases) {
            this.drawVehicleCanvases(dt);
        }

        const lander = this.physics.lander;
        if (!lander) return;

        this.updateFireworks(lander);           // HQ landing celebration
        this.updateDamageFeedback(lander, dt);  // damage flash + screen shake

        const inputState = this.bundleInput();  // keyboard + gamepad + joystick

        this.updateMissionClock(lander, dt);    // mission timer + overtime

        // Let physics know the actual on-screen half-extents so it can spawn the
        // monster genuinely off-screen instead of at a fixed world-space offset that
        // may still land inside the viewport at low zoom.
        this.physics.viewHalfW = (this.canvas.width / 2) / this.camera.zoom;
        this.physics.viewHalfH = (this.canvas.height / 2) / this.camera.zoom;

        this.physics.update(dt, levels[this.currentLevelIndex], inputState);

        this.updateRadarPing(dt);               // off-screen monster audio ping
        this.updateShieldRegen(lander, dt);     // shieldRegen upgrade tick
        this.updateRefuelPad(lander, dt);       // paid refueling on 'refuel' pads
        this.updateCamera(lander, dt);          // follow-cam / free-cam
        this.updateThrusterSound(lander);
        this.updateCraneAnimations(dt);         // delivery-hub crane + pallets
        this.updateAutoLoad(dt);                // cargo dispense at collection pad

        this.checkCargoDelivery();
        this.updateBoxFireState(dt);

        // Score decays slowly while flying (fuel/time consumption)
        if (!lander.landed && this.score > 30) {
            this.score -= 0.004 * dt;
        }

        this.handleCrash(lander);               // one-shot crash/game-over handling

        // Refill alert sound check. Runs AFTER handleCrash on purpose: the
        // crash handler silences the warning once, and this re-arms it while
        // fuel is empty mid-air — preserving long-standing behavior.
        if (lander.fuel <= 0 && !lander.landed) {
            if (!this.isMuted) CargoAudio.setWarning(true);
        }

        this.updateMessages(dt);                // legacy canvas-renderer messages
        this.updateMissionPanel();
        this.updateHUD();
    }

    // ── update() phases, in frame order ─────────────────────────────────────

    updateMobileControlsVisibility() {
        const mobileControls = this.uiElements?.mobileControls || document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = (this.isTouchDevice && this.gameState === 'playing') ? 'flex' : 'none';
        }
    }

    // HQ Landing Fireworks Celebration — fires while parked at HQ with all
    // cargo delivered.
    updateFireworks(lander) {
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
    }

    // Red vignette + screen shake driven by hull-integrity drops.
    updateDamageFeedback(lander, dt) {
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
    }

    // Merges keyboard, gamepad (gp_*) and touch-joystick (joy_*) keys into the
    // inputState object handed to physics.update().
    bundleInput() {
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
        return inputState;
    }

    // Mission timer countdown; at 0 starts the 15s overtime window (monster
    // forced out, reach HQ to auto-extract via completeMission()).
    updateMissionClock(lander, dt) {
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
                this.completeMission(true); // safe extraction
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
    }

    updateRadarPing(dt) {
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
    }

    updateShieldRegen(lander, dt) {
        // --- Shield & Hull Regeneration ---
        if (lander.shieldDelay > 0) {
            lander.shieldDelay -= dt;
        }

        const shieldLvl = this.upgrades?.['shieldRegen'] || 0;
        if (shieldLvl > 0 && !lander.crashed && lander.integrity > 0 && (!lander.shieldDelay || lander.shieldDelay <= 0)) {
            lander.integrity = Math.min(lander.maxIntegrity, lander.integrity + (dt / 60) * 1.5 * shieldLvl);
            // Shield charge recovers on its own too, a bit slower than a fresh hit
            // would need — it isn't meant to fully block every impact back-to-back.
            if (lander.maxShieldCharge > 0) {
                lander.shieldCharge = Math.min(lander.maxShieldCharge, (lander.shieldCharge || 0) + (dt / 60) * (lander.maxShieldCharge / 8));
            }
        }
        if (lander.shieldHitFlash > 0) lander.shieldHitFlash = Math.max(0, lander.shieldHitFlash - 0.04 * dt);
    }

    updateRefuelPad(lander, dt) {
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
    }

    updateCamera(lander, dt) {
        // --- Cinematic Camera Update ---
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const levelFitZoom = Math.min(cw / this.physics.levelWidth, ch / this.physics.levelHeight) * 0.95;
        const minZoom = Math.max(0.45, levelFitZoom); // Cap how far it can zoom out
        let desiredZoom = 1.1;
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

            if (!lander.swallowed) {
                let targetX = lander.x + (Math.max(-200, Math.min(200, lander.vx || 0)) * 15);
                let targetY = lander.y - this.cameraVOffset + (Math.max(-200, Math.min(200, lander.vy || 0)) * 15); // Shift camera up to show more air
                const viewH = this.canvas.height / this.camera.targetZoom;
                const maxCamY = this.physics.levelHeight - (viewH / 2) + this.cameraVOffset;
                targetY = Math.min(targetY, maxCamY);
                this.camera.x += (targetX - this.camera.x) * 0.08 * dt;
                this.camera.y += (targetY - this.camera.y) * 0.08 * dt;
            }
        }
    }

    updateThrusterSound(lander) {
        // Sound effect triggers for thrust
        if (!this.isMuted) {
            if (lander.thrusting && lander.fuel > 0 && !lander.crashed) {
                CargoAudio.setThruster(1.0);
            } else {
                CargoAudio.setThruster(0);
            }
        }
    }

    updateCraneAnimations(dt) {
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
    }

    // Cargo dispense sequence while parked on the collection pad: countdown,
    // spawn (type picked from allowedTypes), escalating delays, roof close.
    updateAutoLoad(dt) {
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
    }

    // One-shot crash handling (guarded by crashHandled): quest fail, career
    // stats, explosion burst, monster-devour hard fail vs. respawnable crash.
    handleCrash(lander) {
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
                if (!this.floatingTexts) this.floatingTexts = [];
                if (lander.eatenByMonster) {
                    this.missionBudget -= 400;
                    this.addMessage("Lander Consumed: -$400", "#ef4444");
                    this.floatingTexts.push({ text: "-$400", x: lander.x, y: lander.y - 30, life: 2.0, color: '#ef4444' });
                } else if (lander.busted) {
                    this.missionBudget -= 1000;
                    this.addMessage("BUSTED! Paid $1000 fine.", "#ef4444");
                    this.floatingTexts.push({ text: "-$1000", x: lander.x, y: lander.y - 30, life: 2.0, color: '#ef4444' });
                } else {
                    this.missionBudget -= 400;
                    this.addMessage("Lander Destroyed: -$400", "#ef4444");
                    this.floatingTexts.push({ text: "-$400", x: lander.x, y: lander.y - 30, life: 2.0, color: '#ef4444' });
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
    }

    updateMessages(dt) {
        // Update legacy messages array (used by canvas renderer fallback)
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const m = this.messages[i];
            m.life -= 0.0025 * dt;
            if (m.life <= 0) this.messages.splice(i, 1);
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
        if (!this.floatingTexts) this.floatingTexts = [];
        this.floatingTexts.push({ text: "-$100", x: lander.x, y: lander.y - 30, life: 1.5, color: '#ef4444' });
    }

    repairLander() {
        const lander = this.physics.lander;
        if (!lander || this.missionBudget < 200 || lander.integrity >= lander.maxIntegrity) return;
        this.missionBudget -= 200;
        lander.integrity = lander.maxIntegrity;
        if (window.CargoAudio) window.CargoAudio.playClick();
        this.addMessage("Integrity restored. -$200 Budget", "#10b981");
        if (!this.floatingTexts) this.floatingTexts = [];
        this.floatingTexts.push({ text: "-$200", x: lander.x, y: lander.y - 30, life: 1.5, color: '#ef4444' });
    }

    completeMission(force = false) {
        // Must be landed at HQ to extract
        const lander = this.physics.lander;
        if (!lander || !lander.landed || lander.currentPad !== 'start') {
            this.addMessage("Return to HQ pad to extract!", "#f59e0b");
            return;
        }

        const level = levels[this.currentLevelIndex];
        const allDelivered = this.deliveredCount >= (level.targetCargo || 0);
        
        let questBonus = 0;
        let timeBonus = 0;
        let questLines = '';
        
        if (!allDelivered) {
            if (!force) {
                this.showConfirm("Abort Mission?", "You haven't completed all deliveries. You will keep your remaining budget, but you will forfeit all time and objective bonuses.", () => {
                    this.completeMission(true);
                });
                return;
            }
        }

        this.gameState = 'level_complete';
        if (!this.isMuted && window.CargoAudio) CargoAudio.playSuccess();

        const centerOverlay = document.getElementById('center-extract-overlay');
        if (centerOverlay) centerOverlay.style.display = 'none';

        document.getElementById('hud-overlay').style.display = 'none';

        if (allDelivered) {
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
            if (level.quests) {
                for (const q of level.quests) {
                    if (q.reward && this.questState[q.id]?.completed) {
                        questBonus += q.reward;
                        questLines += `<p>${q.text}: <span style="color:#10b981;font-weight:600;">+$${q.reward}</span></p>`;
                    }
                }
            }
            timeBonus = Math.floor(this.missionTimer) * 10;
        } else {
            questLines = `<p style="color:#ef4444; font-style:italic;">Mission aborted. Bonuses forfeited.</p>`;
        }

        const totalPayout = this.missionBudget + timeBonus + questBonus;

        this.globalCash += totalPayout;
        localStorage.setItem('cargoLanderCash', this.globalCash);

        // Career + highscore tracking
        if (allDelivered) {
            this.career.missionsComplete++;
        }
        this.saveCareer();
        const prevBest = this.highscores[this.currentLevelIndex] || 0;
        if (totalPayout > prevBest) {
            this.highscores[this.currentLevelIndex] = totalPayout;
            this.saveHighscores();
        }

        document.getElementById('complete-screen').style.display = 'flex';
        const nextBtn = document.querySelector('#complete-screen .btn-primary');
        if (nextBtn) {
            nextBtn.textContent = this.isPlaytest ? "Back to Editor ➔" : (allDelivered ? "Next Mission ➔" : "Retry Mission ➔");
            // If aborted, retry mission starts the same level
            nextBtn.onclick = () => {
                if (allDelivered) {
                    this.nextLevel();
                } else {
                    this.startLevel(this.currentLevelIndex);
                }
            };
        }
        document.getElementById('lvl-complete-title').textContent = allDelivered ? "Extraction Successful!" : "Extraction / Aborted";
        document.getElementById('lvl-complete-title').style.color = allDelivered ? "var(--neon-green)" : "#f59e0b";
        document.getElementById('lvl-complete-details').innerHTML = `
            <p>Retained Budget: <span style="color: #10b981; font-weight:600;">$${this.missionBudget}</span></p>
            ${allDelivered ? `<p>Time Bonus: <span style="color: #38bdf8; font-weight:600;">+$${timeBonus}</span></p>` : ''}
            ${questLines}
            <hr style="border:1px solid rgba(255,255,255,0.1);">
            <p>Total Global Cash: <span style="color: #f59e0b; font-weight:600;">$${this.globalCash}</span></p>
        `;
    }

}
