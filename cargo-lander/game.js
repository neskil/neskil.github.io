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

        // Last-selected vehicle, reused by Replay / Next Mission / Restart
        this.currentVehicle = 'basic';

        this.score = 100; // Efficiency rating %
        this.deliveredCount = 0;
        this.deliveredTypes = {};
        this.questState = {};   // { questId: { completed, failed } }
        this.hadCrash = false;
        this.cargoLostCount = 0;
        this.cargoSpawnCooldown = 0;
        this.stars = [];
        this.messages = []; // On-screen notifications

        // Dynamic Camera
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.introTimer = 0;

        // Settings
        const savedMute = localStorage.getItem('cargoLanderMuted');
        this.isMuted = savedMute ? savedMute === 'true' : false;
        this.useSprites = false;

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
        this.loadSprites();
    }

    loadSprites() {
        this.sprites = {
            landerBasic: null,
            landerDrone: null,
            boxStandard: null,
            boxRed: null,
            boxBlue: null,
            boxGreen: null
        };

        const spriteFiles = {
            landerBasic: 'assets/lander_basic.png',
            landerDrone: 'assets/lander_drone.png',
            boxStandard: 'assets/box_standard.png',
            boxRed: 'assets/box_red.png',
            boxBlue: 'assets/box_blue.png',
            boxGreen: 'assets/box_green.png'
        };

        let loadedCount = 0;
        const totalSprites = Object.keys(spriteFiles).length;

        for (const [key, src] of Object.entries(spriteFiles)) {
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                tempCtx.drawImage(img, 0, 0);

                try {
                    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                    const data = imgData.data;
                    const w = tempCanvas.width;
                    const h = tempCanvas.height;

                    // Scan to find the bounding box of non-black pixels
                    let minX = w, maxX = 0, minY = h, maxY = 0;
                    let hasPixels = false;
                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            const idx = (y * w + x) * 4;
                            const r = data[idx];
                            const g = data[idx + 1];
                            const b = data[idx + 2];
                            if (r >= 10 || g >= 10 || b >= 10) {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                                hasPixels = true;
                            }
                        }
                    }

                    if (!hasPixels) {
                        minX = 0; maxX = w - 1; minY = 0; maxY = h - 1;
                    }

                    const cropW = maxX - minX + 1;
                    const cropH = maxY - minY + 1;

                    const offscreen = document.createElement('canvas');
                    offscreen.width = cropW;
                    offscreen.height = cropH;
                    const oCtx = offscreen.getContext('2d');

                    // Copy cropped area and perform chroma-keying
                    const cropData = tempCtx.getImageData(minX, minY, cropW, cropH);
                    const cData = cropData.data;
                    for (let i = 0; i < cData.length; i += 4) {
                        const r = cData[i];
                        const g = cData[i + 1];
                        const b = cData[i + 2];
                        if (r < 10 && g < 10 && b < 10) {
                            cData[i + 3] = 0; // Set transparency
                        }
                    }
                    oCtx.putImageData(cropData, 0, 0);
                    this.sprites[key] = offscreen;
                } catch (e) {
                    console.warn(`Chroma keying & cropping failed for ${key} (likely CORS on file://). Using raw image.`, e);
                    this.sprites[key] = img;
                }

                loadedCount++;
            };
            img.onerror = (e) => {
                console.error(`Failed to load sprite: ${src}`, e);
            };
            img.src = src;
        }
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
                    this.toggleGrapple();
                }
            }
            if (e.key.toLowerCase() === 'r' && this.physics.lander && this.physics.lander.crashed) {
                this.respawnLander();
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
        this.gameState = 'menu';
        document.getElementById('menu-screen').style.display = 'flex';
        document.getElementById('hud-overlay').style.display = 'none';
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
    refreshMenuUI() {
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
                const best = this.highscores[i];
                return `<div class="hs-row"><span>${lv.name}</span><span class="hs-val">${best ? '$' + best.toLocaleString() : '—'}</span></div>`;
            }).join('');
        }
        levels.forEach((lv, i) => {
            const badge = document.getElementById('hs-badge-' + i);
            if (badge) badge.textContent = this.highscores[i] ? 'Best: $' + this.highscores[i].toLocaleString() : '';
        });
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

        const spriteCb = document.getElementById('setting-use-sprites');
        if (spriteCb) spriteCb.checked = this.useSprites;

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

    toggleSpritesFromCheckbox(checked) {
        this.useSprites = checked;
        localStorage.setItem('cargoLanderUseSprites', checked ? 'true' : 'false');
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

    showVehicleSelection(idx) {
        this.selectedLevelIndex = idx;
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('vehicle-screen').style.display = 'flex';
    }

    startLevelWithVehicle(vehicleType) {
        document.getElementById('vehicle-screen').style.display = 'none';
        this.startLevel(this.selectedLevelIndex, vehicleType);
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
        const level = levels[idx];
        level.vehicle = vehicleType;

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

        // Setup Cinematic Camera Intro
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const minZoom = Math.min(cw / this.physics.levelWidth, ch / this.physics.levelHeight) * 0.95; // Slightly padded
        const introZoom = minZoom * 1.8;

        this.camera.zoom = introZoom;
        this.camera.targetZoom = introZoom;
        this.introTimer = 2.0;
        this.camera.x = this.physics.levelWidth / 2;
        this.camera.y = 0;

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
            } else {
                // If we didn't grab anything, try to dispense cargo if we're near the collection point
                this.triggerCargoDispense();
            }
        }
    }

    triggerCargoDispense() {
        if (!this.physics.lander) return;

        // Drone loading logic (can dispense while hovering near collection point)
        if (this.physics.lander.vehicleType === 'drone') {
            const cp = this.physics.collectionPoint;
            if (this.physics.lander.landed || (Math.abs(this.physics.lander.x - (cp.x + cp.width / 2)) < 60)) {
                const levelConfig = levels[this.currentLevelIndex];
                const types = levelConfig.allowedTypes || ['normal'];
                const t = types[Math.floor(Math.random() * types.length)];
                this.physics.spawnCargo(t);
                if (!this.isMuted) CargoAudio.playLoad();
            }
            return;
        }

        // Allow dispense when lander is near/on the collection point pad
        const cp = this.physics.collectionPoint;
        const l = this.physics.lander;
        const cpCenterX = cp.x + cp.width / 2;
        const nearCollection = Math.abs(l.x - cpCenterX) < cp.width / 2 + 28
            && l.y >= cp.y - 60 && l.y <= cp.y + 12;
        if (nearCollection) {
            const levelConfig = levels[this.currentLevelIndex];

            // Randomly select one of the allowed types for this level
            const types = levelConfig.allowedTypes || ['normal'];
            const t = types[Math.floor(Math.random() * types.length)];

            // Limit cargo count on screen to prevent extreme physics lag or overflow
            if (this.physics.boxes.length >= 6) {
                this.addMessage("Cargo deck maximum reached!", "#ef4444");
                return;
            }

            this.physics.spawnCargo(t);
            this.cargoSpawnCooldown = 30; // Cooldown frames

            if (!this.isMuted) {
                CargoAudio.playLoad();
            }
            this.addMessage("Cargo Dispensed: " + t.toUpperCase(), "#f8fafc");
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

            if (!allDelivered) {
                btnExtract.classList.add('hidden');
                if(centerOverlay) centerOverlay.style.display = 'none';
            } else if (atHQ) {
                btnExtract.classList.remove('hidden');
                btnExtract.textContent = '✓ EXTRACT NOW';
                btnExtract.style.background = '#10b981';
                btnExtract.style.opacity = '1';
                btnExtract.style.cursor = 'pointer';
                
                if(centerOverlay) {
                    centerOverlay.style.display = 'flex';
                    centerOverlay.style.borderColor = '#10b981';
                    if(centerTitle) {
                        centerTitle.textContent = 'Mission Complete';
                        centerTitle.style.color = '#10b981';
                    }
                    if(centerDesc) centerDesc.textContent = 'You have successfully returned to HQ.';
                    if(centerBtn) centerBtn.style.display = 'block';
                }
            } else {
                btnExtract.classList.remove('hidden');
                btnExtract.textContent = 'Return to HQ';
                btnExtract.style.background = '#334155';
                btnExtract.style.opacity = '0.7';
                btnExtract.style.cursor = 'default';

                if (centerOverlay && isLandedAnywhere) {
                    centerOverlay.style.display = 'flex';
                    centerOverlay.style.borderColor = '#38bdf8';
                    if(centerTitle) {
                        centerTitle.textContent = 'All Cargo Delivered!';
                        centerTitle.style.color = '#38bdf8';
                    }
                    if(centerDesc) centerDesc.textContent = 'Return to HQ to extract and finish the mission (or continue flying, but watch your fuel!)';
                    if(centerBtn) centerBtn.style.display = 'none';
                } else if (centerOverlay) {
                    centerOverlay.style.display = 'none';
                }
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

        const level = levels[this.currentLevelIndex];

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

        // --- Shield Regeneration ---
        const shieldLvl = this.career?.upgrades?.['shieldRegen'] || 0;
        if (shieldLvl > 0 && !lander.crashed && lander.integrity > 0) {
            lander.integrity = Math.min(lander.maxIntegrity, lander.integrity + (dt / 60) * 1.5 * shieldLvl);
        }

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
        } else if (this.introTimer > 0) {
            this.introTimer -= dt / 60;
            const progress = Math.max(0, Math.min(1, (2.0 - this.introTimer) / 2.0));
            const s = progress * progress * (3 - 2 * progress);
            const introZoom = minZoom * 1.8;
            this.camera.zoom = introZoom + s * (desiredZoom - introZoom);
            this.camera.x = (this.physics.levelWidth / 2) + s * (lander.x - (this.physics.levelWidth / 2));
            this.camera.y = 0 + s * (lander.y - 0);
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

        // Cooldowns
        if (this.cargoSpawnCooldown > 0) this.cargoSpawnCooldown--;

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

                // 0.75 progress corresponds to countdown reaching 0.25 of max (i.e. <= 60)
                if (_seq.countdown <= _seq.countdownMax * 0.25 && !_seq.boxDropped) {
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
                        _seq.countdownMax = 240;
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

        // Check if any cargo fell into the abyss
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
        setTimeout(() => this.failMission("Self Destruct Initiated."), 1500);
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

        // Fireworks celebration
        const l = this.physics.lander;
        if (this.physics && this.physics.particles && l) {
            for (let burst = 0; burst < 3; burst++) {
                setTimeout(() => {
                    const bx = l.x + (Math.random() - 0.5) * 300;
                    const by = l.y - 100 - Math.random() * 200;
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
        document.getElementById('lvl-complete-title').textContent = "Extraction Successful!";
        document.getElementById('lvl-complete-details').innerHTML = `
            <p>Base Contract Payout: <span style="color: #10b981; font-weight:600;">$${this.missionBudget}</span></p>
            <p>Time Bonus: <span style="color: #38bdf8; font-weight:600;">+$${timeBonus}</span></p>
            ${questLines}
            <hr style="border:1px solid rgba(255,255,255,0.1);">
            <p>Total Global Cash: <span style="color: #f59e0b; font-weight:600;">$${this.globalCash}</span></p>
        `;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Draw Space Background Gradient (level-themed)
        const lvPal = (levels[this.currentLevelIndex] || {}).palette;
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, lvPal ? lvPal.skyTop : '#090d16');
        grad.addColorStop(0.5, lvPal ? lvPal.skyMid : '#0f172a');
        grad.addColorStop(1, lvPal ? lvPal.skyBot : '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. Parallax background layers
        if (this.bgLayers) {
            const camX = this.gameState === 'playing' ? this.camera.x : 0;
            const camY = this.gameState === 'playing' ? this.camera.y : 0;

            // Nebulae (drawn first, behind stars)
            for (const neb of this.bgNebulae) {
                const sx = neb.x - camX * neb.parallax;
                const sy = neb.y - camY * neb.parallax;
                if (sx < -neb.r - 100 || sx > w + neb.r + 100) continue;
                const ng = ctx.createRadialGradient(sx, sy, 0, sx, sy, neb.r);
                const [r, g, b] = neb.col;
                ng.addColorStop(0, `rgba(${r},${g},${b},${neb.alpha})`);
                ng.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = ng;
                ctx.fillRect(sx - neb.r, sy - neb.r, neb.r * 2, neb.r * 2);
            }

            // Star layers
            for (const layer of this.bgLayers) {
                for (const star of layer.objects) {
                    star.phase += star.speed;
                    const pulse = 0.4 + Math.abs(Math.sin(star.phase)) * 0.6;
                    const sx = star.x - camX * layer.parallax;
                    const sy = star.y - camY * layer.parallax;
                    if (sx < -4 || sx > w + 4 || sy < -4 || sy > h + 4) continue;
                    const a = star.alpha * pulse;
                    ctx.fillStyle = `rgba(${star.r},${star.g},${star.b},${a})`;
                    // Bright stars get a soft halo first
                    if (star.halo) {
                        const hg = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 3.5);
                        hg.addColorStop(0, `rgba(${star.r},${star.g},${star.b},${a * 0.35})`);
                        hg.addColorStop(1, `rgba(${star.r},${star.g},${star.b},0)`);
                        ctx.fillStyle = hg;
                        ctx.beginPath();
                        ctx.arc(sx, sy, star.size * 3.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = `rgba(${star.r},${star.g},${star.b},${a})`;
                    }
                    ctx.beginPath();
                    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Top HUD breathing room — dark-to-transparent band so game elements sit below the HTML HUD
        if (this.gameState !== 'menu') {
            const topGrad = ctx.createLinearGradient(0, 0, 0, 88);
            topGrad.addColorStop(0, 'rgba(5, 8, 18, 0.65)');
            topGrad.addColorStop(1, 'rgba(5, 8, 18, 0)');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, w, 88);
        }

        // --- Menu Specific Background Rendering ---
        // Update floating texts
        if (this.floatingTexts) {
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.life -= 16.6 * 0.001; // changed from 0.01 to match 60fps correctly
                ft.y -= 16.6 * 0.05; // slower float
                if (ft.life <= 0) this.floatingTexts.splice(i, 1);
            }
        }

        if (this.gameState === 'menu') {
            this.drawMenuBackgroundEntity();
            return; // Don't draw the level geometry
        }

        this.drawParallax();

        // Apply Camera Transform for Level rendering
        ctx.save();

        // Move to screen center, scale, then move by camera offset
        ctx.translate(w / 2 + (this.screenShake?.x || 0), h / 2 + (this.screenShake?.y || 0));
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // 3. Draw Gravity Well Anomaly
        const level = levels[this.currentLevelIndex];
        if (level && level.gravityWell && this.gameState === 'playing') {
            if (!this.shaderOverlay || !this.shaderOverlay.gl) {
                this.drawGravityWell(this.physics.gravityWellPos || level.gravityWell, level.gravityWell);
            }
        }

        // 4. Draw Delivery Hub Zones (Hologram beacons)
        this.drawDeliveryHubs();

        // 5. Draw Terrain Landscape
        this.drawUnderground();
        this.drawGroundParallax();

        const levelConfig = levels[this.currentLevelIndex];
        if (levelConfig?.outOfBounds) {
            this.drawFluidBounds();
        }

        this.drawWaterBodies();

        // 5.5 Draw weather behind the solid terrain
        if (this.drawWeather) {
            ctx.restore(); // Undo the camera transform to avoid double-transform, since drawWeather applies it again
            this.drawWeather();
            ctx.save();
            ctx.translate(w / 2 + (this.screenShake?.x || 0), h / 2 + (this.screenShake?.y || 0));
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x, -this.camera.y);
        }

        this.drawTerrain();
        this.drawSegments();
        this.drawHazards();
        this.drawCollectibles();
        this.drawRadarPingZone();

        // 6. Draw Cargo Sourcing Depot Building
        this.drawSourcingDepot();
        this.drawNextObjectiveArrow();

        // 6b. Draw world buildings
        this.drawBuildings();

        // 6c. Draw ambient space truck traffic
        this.drawAmbientTraffic();

        // 7. Draw Boxes
        this.drawBoxes();

        // 8. Draw Lander
        this.drawLander();

        if (this.physics.lander && this.physics.lander.vehicleType !== 'drone') {
            const drone = this.physics.boxes.find(b => b.type === 'drone');
            if (drone && !drone.grabbedByDrone) {
                const dx = this.physics.lander.x - drone.x;
                const dy = this.physics.lander.y - drone.y;
                if (Math.sqrt(dx*dx + dy*dy) < 150) {
                    ctx.save();
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#fde047';
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                    ctx.fillText('PRESS SPACE TO DEPLOY DRONE', drone.x, drone.y - 30);
                    ctx.restore();
                }
            }
        } else if (this.physics.lander && this.physics.lander.vehicleType === 'drone' && !this.physics.lander.grabbedBoxId) {
            // Give the drone a hint to attach if it's near an ungrabbed, unvacuumed box on the ground
            const lndr = this.physics.lander;
            const attachableBox = this.physics.boxes.find(b => {
                if (b.type === 'drone' || b.vacuumed || b.onDeck) return false;
                const dx = lndr.x - b.x;
                const dy = lndr.y - b.y;
                return Math.sqrt(dx*dx + dy*dy) < 60;
            });
            if (attachableBox) {
                ctx.save();
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fde047';
                ctx.shadowColor = '#000';
                ctx.shadowBlur = 4;
                ctx.fillText('PRESS SPACE TO ATTACH', lndr.x, lndr.y - 30);
                ctx.restore();
            }
        }

        // 8.5 Draw Floating Texts
        if (this.floatingTexts) {
            for (const ft of this.floatingTexts) {
                ctx.save();
                ctx.font = 'bold 24px Outfit';
                ctx.textAlign = 'center';
                ctx.fillStyle = `rgba(16, 185, 129, ${ft.life / 1.5})`;
                ctx.strokeStyle = `rgba(0, 0, 0, ${ft.life / 1.5})`;
                ctx.lineWidth = 3;
                ctx.strokeText(ft.text, ft.x, ft.y);
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            }
        }

        ctx.restore();

        // 9. WebGL Render for Particles
        if (this.shaders) {
            this.shaders.render(this.physics, this.camera);
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'screen'; // Use screen blending like CSS mix-blend-mode
            ctx.drawImage(this.shaders.canvas, 0, 0);
            ctx.restore();
        }

        // 9b. Draw the detailed Canvas2D monster (and particles when WebGL is unavailable)
        ctx.save();
        ctx.translate(w / 2 + (this.screenShake?.x || 0), h / 2 + (this.screenShake?.y || 0));
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
        this.drawMonster();
        this.drawSandWorm();
        if (!this.shaders) this.drawParticles();
        ctx.restore();

        // 10. Draw UI Notifications directly on canvas
        this.drawNotifications();

        // 11. Draw Wind Indicator, Minimap, Quest Panel
        if (this.gameState === 'playing') {
            this.drawWindIndicator();
            this.drawMinimap();
            this.drawQuestPanel();

            // 12. Draw Lateral Mist
            const levelConfig = levels[this.currentLevelIndex];
            if (levelConfig?.outOfBounds) {
                this.drawMistEdges();
            }

            // 12b. Draw Monster Threat Vignette
            if (this.physics.outOfBoundsTimer && this.physics.outOfBoundsTimer > 0) {
                const threatLevel = Math.min(1.0, this.physics.outOfBoundsTimer / 120);

                // Draw a more subtle pulsing red vignette
                ctx.save();
                const vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, Math.max(w, h));
                vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
                vignetteGrad.addColorStop(0.5, `rgba(150, 0, 0, ${threatLevel * 0.1})`);
                vignetteGrad.addColorStop(1, `rgba(200, 0, 0, ${threatLevel * 0.6})`);

                ctx.fillStyle = vignetteGrad;
                ctx.fillRect(0, 0, w, h);

                // Warning text
                if (threatLevel > 0.3) {
                    const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
                    ctx.font = `bold ${Math.round(20 + threatLevel * 6)}px sans-serif`;
                    ctx.textAlign = 'center';

                    // Add stroke for readability
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = `rgba(0, 0, 0, ${threatLevel})`;
                    ctx.strokeText("⚠ WARNING: LEAVING SAFE ZONE", w / 2, h * 0.25);

                    ctx.fillStyle = `rgba(255, 60, 60, ${threatLevel * 0.5 + pulse * 0.5})`;
                    ctx.fillText("⚠ WARNING: LEAVING SAFE ZONE", w / 2, h * 0.25);
                }
                ctx.restore();
            }
        }

        // 13. Off-screen monster radar indicator
        if (this.physics.monster && this.physics.lander && this.gameState === 'playing') {
            const m = this.physics.monster;
            const zoom = this.camera.zoom;
            const screenMX = (m.x - this.camera.x) * zoom + w / 2;
            const screenMY = (m.y - this.camera.y) * zoom + h / 2;
            const offLeft = screenMX < 0, offRight = screenMX > w;
            const offTop = screenMY < 0, offBottom = screenMY > h;
            if (offLeft || offRight || offTop || offBottom) {
                const margin = 28;
                const clampedX = Math.max(margin, Math.min(w - margin, screenMX));
                const clampedY = Math.max(margin, Math.min(h - margin, screenMY));
                const angle = Math.atan2(screenMY - h / 2, screenMX - w / 2);
                const edgeX = w / 2 + Math.cos(angle) * (Math.min(w, h) / 2 - margin);
                const edgeY = h / 2 + Math.sin(angle) * (Math.min(w, h) / 2 - margin);
                const pulse = 0.6 + Math.abs(Math.sin(Date.now() / 200)) * 0.4;

                ctx.save();
                ctx.translate(Math.max(margin, Math.min(w - margin, edgeX)),
                    Math.max(margin, Math.min(h - margin, edgeY)));
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillStyle = `rgba(239,68,68,${pulse})`;
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(8, 6);
                ctx.lineTo(-8, 6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.font = 'bold 10px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = `rgba(239,68,68,${pulse * 0.9})`;
                const labelX = Math.max(margin, Math.min(w - margin, edgeX));
                const labelY = Math.max(margin, Math.min(h - margin, edgeY));
                const dist = Math.round(Math.hypot(m.x - this.physics.lander.x, m.y - this.physics.lander.y));
                ctx.fillText(`${dist}m`, labelX, labelY + 20);
                ctx.restore();
            }
        }

        // 13b. Damage flash overlay — strong red vignette + bold text
        if (this.damageFlash > 0) {
            // Solid edge flash
            const flashGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, h * 0.9);
            flashGrad.addColorStop(0, 'rgba(0,0,0,0)');
            flashGrad.addColorStop(0.5, `rgba(220,10,0,${this.damageFlash * 0.5})`);
            flashGrad.addColorStop(1, `rgba(255,0,0,${this.damageFlash * 0.92})`);
            ctx.fillStyle = flashGrad;
            ctx.fillRect(0, 0, w, h);
            // Full-width top + bottom bars
            ctx.fillStyle = `rgba(255,0,0,${this.damageFlash * 0.55})`;
            ctx.fillRect(0, 0, w, 6);
            ctx.fillRect(0, h - 6, w, 6);
            if (this.damageFlash > 0.2) {
                ctx.save();
                ctx.textAlign = 'center';
                // Shadow
                ctx.font = 'bold 24px sans-serif';
                ctx.fillStyle = `rgba(0,0,0,${this.damageFlash * 0.8})`;
                ctx.fillText('⚠ HULL DAMAGE', w / 2 + 2, h / 2 - 58);
                // Text
                ctx.fillStyle = `rgba(255,80,80,${Math.min(1, this.damageFlash * 1.5)})`;
                ctx.fillText('⚠ HULL DAMAGE', w / 2, h / 2 - 60);
                ctx.restore();
            }
        }

        // 14. Version + FPS counter (bottom-left corner)
        ctx.save();
        ctx.font = '600 11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.fillText(`v${CargoGame.VERSION}`, 14, h - 14);
        if (this.displayFps !== undefined) {
            ctx.fillStyle = this.displayFps >= 50 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(251, 191, 36, 0.75)';
            ctx.fillText(`${this.displayFps} FPS`, 14 + 48, h - 14);
        }
        ctx.restore();
    }

    drawMinimap() {
        if (this.uiCollapsed) return;
        const ctx = this.ctx;
        const cw = this.canvas.width;

        const isMobile = cw < 768;
        const isTiny = cw < 500;

        // Find objective bounds to cap minimap
        let objMinX = Infinity;
        let objMaxX = -Infinity;
        let objMinY = Infinity;
        let objMaxY = -Infinity;
        const addObj = (obj) => {
            if (!obj) return;
            if (obj.x < objMinX) objMinX = obj.x;
            if (obj.x + (obj.width || 0) > objMaxX) objMaxX = obj.x + (obj.width || 0);
            if (obj.y < objMinY) objMinY = obj.y;
            if (obj.y + (obj.height || 0) > objMaxY) objMaxY = obj.y + (obj.height || 0);
        };
        addObj(this.physics.startDepot);
        addObj(this.physics.collectionPoint);
        if (this.physics.deliveryHubs) {
            for (const hub of this.physics.deliveryHubs) addObj(hub);
        }

        if (objMinX === Infinity) {
            objMinX = 0; objMaxX = this.physics.levelWidth;
            objMinY = 0; objMaxY = this.physics.levelHeight;
        } else {
            objMinX -= 400; objMaxX += 400; // padding
            objMinY -= 300; objMaxY += 300;
        }

        const mapWorldWidth = Math.max(1000, objMaxX - objMinX);
        const mapWorldHeight = Math.max(600, objMaxY - objMinY);

        // Minimap: top-right corner, fixed landscape UI dimensions
        const mmWidth = isTiny ? 160 : (isMobile ? 200 : 260);
        const mmHeight = isTiny ? 100 : (isMobile ? 130 : 160);
        const mmX = cw - mmWidth - (isMobile ? 6 : 20);
        const mmY = isMobile ? 52 : 64; // clears the HUD bar (top:8px + ~44px height)

        // ── Background ────────────────────────────────────────────────────
        ctx.save();

        // Draw rounded rect background + border
        ctx.fillStyle = 'rgba(10, 16, 32, 0.96)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 12);
        else ctx.rect(mmX, mmY, mmWidth, mmHeight);
        ctx.fill();
        ctx.stroke();

        // ── Clip everything to the minimap box ────────────────────────────
        // This prevents the lander dot / viewport rect from ever leaking outside
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 12);
        else ctx.rect(mmX, mmY, mmWidth, mmHeight);
        ctx.clip();

        // Subtle grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
            ctx.moveTo(mmX + (mmWidth / 4) * i, mmY);
            ctx.lineTo(mmX + (mmWidth / 4) * i, mmY + mmHeight);
            ctx.moveTo(mmX, mmY + (mmHeight / 4) * i);
            ctx.lineTo(mmX + mmWidth, mmY + (mmHeight / 4) * i);
        }
        ctx.stroke();

        // ── World → minimap transform ──────────────────────────────────────
        const scale = Math.min(mmWidth / mapWorldWidth, mmHeight / mapWorldHeight);

        // Center the scaled world in the minimap box
        const contentW = mapWorldWidth * scale;
        const contentH = mapWorldHeight * scale;
        const offsetX = (mmWidth - contentW) / 2;
        const offsetY = (mmHeight - contentH) / 2;

        ctx.translate(mmX + offsetX, mmY + offsetY);
        ctx.scale(scale, scale);
        ctx.translate(-objMinX, -objMinY);

        // ── Terrain silhouette ─────────────────────────────────────────────
        if (this.physics.terrainPolygons && this.physics.terrainPolygons.length > 0) {
            ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
            for (const poly of this.physics.terrainPolygons) {
                if (!poly || poly.length < 3) continue;
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) {
                    ctx.lineTo(poly[i].x, poly[i].y);
                }
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── Pads / hubs ────────────────────────────────────────────────────
        // Min size in world units so they're visible on the minimap
        const minW = 4 / scale;
        const minH = 4 / scale;

        if (this.physics.startDepot) {
            const d = this.physics.startDepot;
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(d.x, d.y - minH, Math.max(d.width, minW), minH * 2);
        }
        if (this.physics.collectionPoint) {
            const cp = this.physics.collectionPoint;
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(cp.x, cp.y - minH, Math.max(cp.width, minW), minH * 2);
        }
        if (this.physics.deliveryHubs) {
            for (const hub of this.physics.deliveryHubs) {
                ctx.fillStyle = hub.color || '#38bdf8';
                ctx.fillRect(hub.x, hub.y - minH, Math.max(hub.width, minW), minH * 2);
            }
        }

        // ── Cargo boxes ────────────────────────────────────────────────────
        const boxR = 6 / scale; // world-space radius
        if (this.physics.boxes) {
            for (const box of this.physics.boxes) {
                ctx.fillStyle = box.color || '#fff';
                ctx.beginPath();
                ctx.arc(box.x, box.y, boxR, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ── Monster blip ───────────────────────────────────────────────────
        if (this.physics.monster) {
            const m = this.physics.monster;
            const mR = 22 / scale;
            ctx.fillStyle = `rgba(239,68,68,${0.6 + Math.sin(Date.now() / 80) * 0.4})`;
            ctx.beginPath();
            ctx.arc(m.x, m.y, mR, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Camera viewport rect ───────────────────────────────────────────
        const viewW = cw / this.camera.zoom;
        const viewH = this.canvas.height / this.camera.zoom;
        const viewX = this.camera.x - viewW / 2;
        const viewY = this.camera.y - viewH / 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1 / scale;
        ctx.strokeRect(viewX, viewY, viewW, viewH);

        // ── Lander dot ─────────────────────────────────────────────────────
        if (this.physics.lander) {
            const l = this.physics.lander;
            const dotR = 5 / scale;

            // Clamp strictly to the minimap's coordinate bounds
            const clampedX = Math.max(objMinX, Math.min(objMaxX, l.x));
            const clampedY = Math.max(objMinY, Math.min(objMaxY, l.y));

            ctx.fillStyle = l.crashed ? '#ef4444' : '#10b981';
            ctx.beginPath();
            ctx.arc(clampedX, clampedY, dotR, 0, Math.PI * 2);
            ctx.fill();

            // Small heading tick
            if (!l.crashed) {
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 2.5 / scale;
                ctx.beginPath();
                ctx.moveTo(clampedX, clampedY);
                ctx.lineTo(
                    clampedX + Math.sin(l.angle) * dotR * 2.2,
                    clampedY - Math.cos(l.angle) * dotR * 2.2
                );
                ctx.stroke();
            }
        }

        ctx.restore();

        // ── Label ──────────────────────────────────────────────────────────
        ctx.save();
        ctx.font = '600 9px Outfit, sans-serif';
        ctx.letterSpacing = '0.1em';
        ctx.fillStyle = 'rgba(56,189,248,0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('RADAR', mmX + 8, mmY + 13);
        ctx.restore();
    }

    drawQuestPanel() {
        if (this.uiCollapsed) return;
        const ctx = this.ctx;
        const level = levels[this.currentLevelIndex];
        if (!level || !level.quests) return;

        const cw = this.canvas.width;
        const isMobile = cw < 768;
        const isTiny = cw < 500;

        // Calculate layout dynamically to fix spacing
        const px = isMobile ? 8 : 16;
        const py = isMobile ? 52 : 64;
        const panelW = isTiny ? 160 : (isMobile ? 200 : 260);
        const lineH = isTiny ? 18 : (isMobile ? 20 : 24);
        const statLineH = isTiny ? 14 : 18;
        
        // 16(top) + 16(Mission) + 16(Title) + 12(Divider) + quests + 8(Divider) + stats + 16(bottom)
        const panelH = 16 + 16 + 16 + 12 + (level.quests.length * lineH) + 8 + (statLineH * 3) + 16;

        ctx.save();

        // Panel background
        ctx.fillStyle = 'rgba(8, 12, 26, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px, py, panelW, panelH, 10);
        else ctx.rect(px, py, panelW, panelH);
        ctx.fill();
        ctx.stroke();

        let curY = py + 16;

        // Mission label
        ctx.font = isTiny ? '600 9px Outfit, sans-serif' : '600 11px Outfit, sans-serif';
        ctx.letterSpacing = '0.12em';
        ctx.fillStyle = 'rgba(56,189,248,0.75)';
        ctx.textAlign = 'left';
        ctx.fillText('MISSION', px + (isTiny ? 8 : 12), curY);
        curY += 16;

        // Mission name
        ctx.font = isTiny ? '700 11px Outfit, sans-serif' : '700 13px Outfit, sans-serif';
        ctx.letterSpacing = '0';
        ctx.fillStyle = 'rgba(248,250,252,0.95)';
        ctx.fillText(level.missionTitle || level.name, px + (isTiny ? 8 : 12), curY, panelW - (isTiny ? 16 : 24));
        curY += 12;

        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + (isTiny ? 6 : 10), curY - 4);
        ctx.lineTo(px + panelW - (isTiny ? 6 : 10), curY - 4);
        ctx.stroke();
        curY += 12;

        // Quest items
        for (let i = 0; i < level.quests.length; i++) {
            const q = level.quests[i];
            const state = this.questState[q.id];
            const isPrimary = q.type === 'primary';

            let icon, iconColor;
            if (q.id === 'primary' && this.deliveredCount >= level.targetCargo) {
                icon = '✓'; iconColor = '#10b981';
            } else if (state?.completed) {
                icon = '✓'; iconColor = '#10b981';
            } else if (state?.failed) {
                icon = '✗'; iconColor = '#ef4444';
            } else {
                icon = isPrimary ? '◆' : '◇'; iconColor = isPrimary ? '#38bdf8' : '#94a3b8';
            }

            ctx.font = isTiny ? '700 11px monospace' : '700 13px monospace';
            ctx.fillStyle = iconColor;
            ctx.fillText(icon, px + (isTiny ? 8 : 12), curY);

            ctx.font = isPrimary ? (isTiny ? '600 10px Outfit, sans-serif' : '600 12px Outfit, sans-serif') : (isTiny ? '400 10px Outfit, sans-serif' : '400 12px Outfit, sans-serif');
            ctx.fillStyle = state?.failed ? 'rgba(239,68,68,0.75)' :
                (state?.completed ? 'rgba(16,185,129,0.9)' :
                    (isPrimary ? 'rgba(248,250,252,0.92)' : 'rgba(148,163,184,0.85)'));
            ctx.fillText(q.text + (q.reward ? `  +$${q.reward}` : ''), px + (isTiny ? 22 : 28), curY, panelW - (isTiny ? 30 : 40));
            
            curY += lineH;
        }

        // --- Mission Stats Divider ---
        curY += 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(px + (isTiny ? 6 : 10), curY - 10);
        ctx.lineTo(px + panelW - (isTiny ? 6 : 10), curY - 10);
        ctx.stroke();

        ctx.font = isTiny ? '600 10px Outfit, sans-serif' : '600 12px Outfit, sans-serif';
        
        // Cargo
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`Cargo: ${this.deliveredCount}/${level.targetCargo}`, px + (isTiny ? 8 : 12), curY);
        curY += statLineH;

        // Budget
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Budget: $${Math.floor(this.missionBudget)}`, px + (isTiny ? 8 : 12), curY);
        curY += statLineH;

        // Time
        if (this.overtimeActive) {
            const ot = Math.ceil(this.overtimeTimer);
            ctx.fillStyle = (Math.floor(Date.now() / 300) % 2 === 0) ? '#ef4444' : '#fbbf24';
            ctx.font = isTiny ? '700 11px monospace' : '700 13px monospace';
            ctx.fillText(`Time: ! ${ot}s`, px + (isTiny ? 8 : 12), statY);
        } else {
            const totalS = Math.floor(this.missionTimer || 0);
            const m = Math.floor(totalS / 60);
            const s = totalS % 60;
            const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            ctx.fillStyle = totalS < 20 ? '#ef4444' : '#f59e0b';
            ctx.font = isTiny ? '700 11px monospace' : '700 13px monospace';
            ctx.fillText(`Time: ${timeStr}`, px + (isTiny ? 8 : 12), statY);
        }

        ctx.restore();
    }

    updateWeather(dt) {
        if (!this.weather || this.weather === 'none' || this.weather === 'fog') return;
        if (!this.weatherParticles) this.weatherParticles = [];
        
        // Spawn particles
        if (Math.random() < 0.8) {
            this.weatherParticles.push({
                x: this.camera.x + (Math.random() - 0.5) * (this.canvas.width / this.camera.zoom) * 1.5,
                y: this.camera.y - (this.canvas.height / this.camera.zoom) * 0.6,
                vx: this.weather === 'snow' ? (Math.random() - 0.5) * 2 : (this.weather === 'rain' ? Math.random() * 1.5 + 0.5 : (Math.random() - 0.5) * 3),
                vy: this.weather === 'snow' ? Math.random() * 2 + 1 : (this.weather === 'rain' ? Math.random() * 8 + 8 : Math.random() * 2 + 1),
                size: this.weather === 'snow' ? Math.random() * 3 + 1 : (this.weather === 'rain' ? Math.random() * 1.5 + 0.5 : Math.random() * 4 + 2),
                type: this.weather
            });
        }
        
        for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
            const p = this.weatherParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.type === 'snow' || p.type === 'ash') {
                p.x += Math.sin(Date.now() * 0.002 + p.y) * 0.5 * dt;
            }
            if (p.y > this.camera.y + (this.canvas.height / this.camera.zoom) * 0.6) {
                this.weatherParticles.splice(i, 1);
            }
        }
    }

    drawWeather() {
        if (!this.weather || this.weather === 'none' || this.weather === 'fog' || !this.weatherParticles) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.canvas.width / 2 + (this.screenShake?.x || 0), this.canvas.height / 2 + (this.screenShake?.y || 0));
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        if (this.weather === 'snow') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        } else if (this.weather === 'rain') {
            ctx.fillStyle = 'rgba(150, 200, 255, 0.4)';
        } else if (this.weather === 'ash') {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
        } else if (this.weather === 'bubbles') {
            ctx.strokeStyle = 'rgba(200, 255, 255, 0.5)';
            ctx.lineWidth = 1;
        }

        ctx.beginPath();
        for (const p of this.weatherParticles) {
            if (p.type === 'bubbles') {
                ctx.moveTo(p.x + p.size, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else if (p.type === 'rain') {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
            } else {
                ctx.moveTo(p.x + p.size, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }
        }
        
        if (this.weather === 'rain') {
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (this.weather === 'bubbles') {
            ctx.stroke();
        } else {
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawMenuBackgroundEntity() {
        if (!this.menuEntities) {
            this.menuEntities = [
                { x: -100, y: this.canvas.height / 3, vx: 3, type: 'lander', scale: 1.0, offset: 0 },
                { x: this.canvas.width + 200, y: this.canvas.height / 5, vx: -1.5, type: 'drone', scale: 0.6, offset: 1000 },
                { x: -400, y: this.canvas.height / 1.5, vx: 4, type: 'advanced', scale: 1.2, offset: 2000 }
            ];
        }

        const ctx = this.ctx;

        // Draw some glowing nebulas for the menu
        const time = Date.now() * 0.0005;
        const grad1 = ctx.createRadialGradient(this.canvas.width * 0.2, this.canvas.height * 0.3, 0, this.canvas.width * 0.2, this.canvas.height * 0.3, 400);
        grad1.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
        grad1.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const grad2 = ctx.createRadialGradient(this.canvas.width * 0.8, this.canvas.height * 0.7, 0, this.canvas.width * 0.8, this.canvas.height * 0.7, 500);
        grad2.addColorStop(0, 'rgba(236, 72, 153, 0.1)');
        grad2.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rare menu monster drive-by (only after 20s on menu, then every 45-90s)
        if (!this.menuOpenTime) this.menuOpenTime = Date.now();
        if (!this.menuMonster) this.menuMonster = null;
        if (!this.nextMenuMonsterTime) this.nextMenuMonsterTime = Date.now() + 20000 + Math.random() * 30000;

        const now2 = Date.now();
        if (!this.menuMonster && now2 > this.nextMenuMonsterTime) {
            const fromLeft = Math.random() > 0.5;
            this.menuMonster = {
                x: fromLeft ? -120 : this.canvas.width + 120,
                y: this.canvas.height * (0.3 + Math.random() * 0.5),
                vx: fromLeft ? 1.8 : -1.8,
                size: 60 + Math.random() * 40,
                t: 0,
            };
        }

        if (this.menuMonster) {
            const mm = this.menuMonster;
            mm.x += mm.vx;
            mm.t += 0.04;

            // Draw simplified monster silhouette
            const t3 = Date.now() / 1000;
            ctx.save();
            ctx.globalAlpha = Math.min(1, Math.min(mm.t * 2, (1 - (Math.abs(mm.x - this.canvas.width / 2) / (this.canvas.width / 2 + 100))) * 3 + 0.1));

            // Body glow
            const mg = ctx.createRadialGradient(mm.x, mm.y, 0, mm.x, mm.y, mm.size);
            mg.addColorStop(0, 'rgba(180,0,0,0.4)');
            mg.addColorStop(0.5, 'rgba(100,0,0,0.2)');
            mg.addColorStop(1, 'rgba(60,0,0,0)');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.ellipse(mm.x, mm.y, mm.size * 1.2, mm.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Monster eyes
            for (const ex of [-mm.size * 0.2, mm.size * 0.2]) {
                const eyePulse = 0.7 + Math.sin(t3 * 4 + ex) * 0.3;
                ctx.fillStyle = `rgba(255,50,0,${eyePulse})`;
                ctx.beginPath();
                ctx.ellipse(mm.x + ex, mm.y - mm.size * 0.15, mm.size * 0.08, mm.size * 0.12, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Tentacles
            for (let ti = 0; ti < 5; ti++) {
                const ta = (ti / 4 - 0.5) * Math.PI * 0.9;
                const tx = mm.x + Math.sin(ta) * mm.size * 0.7;
                const ty = mm.y + mm.size * 0.4 + Math.cos(t3 * 2 + ti) * 12;
                ctx.strokeStyle = `rgba(120,0,0,0.6)`;
                ctx.lineWidth = 3 + (4 - ti) * 0.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(mm.x, mm.y + mm.size * 0.2);
                ctx.quadraticCurveTo(
                    mm.x + Math.sin(ta * 0.5) * mm.size * 0.4, mm.y + mm.size * 0.6 + Math.sin(t3 + ti) * 20,
                    tx, ty + 30
                );
                ctx.stroke();
                ctx.lineCap = 'butt';
            }

            ctx.restore();

            // Remove when off screen
            if ((mm.vx > 0 && mm.x > this.canvas.width + 150) || (mm.vx < 0 && mm.x < -150)) {
                this.menuMonster = null;
                this.nextMenuMonsterTime = Date.now() + 45000 + Math.random() * 45000;
            }
        }

        for (const e of this.menuEntities) {
            e.x += e.vx;
            e.y += Math.sin((Date.now() + e.offset) / 500) * (1.5 * e.scale);

            if (e.vx > 0 && e.x > this.canvas.width + 200) {
                e.x = -200;
                e.y = this.canvas.height * 0.1 + Math.random() * (this.canvas.height * 0.8);
                e.type = ['lander', 'drone', 'advanced'][Math.floor(Math.random() * 3)];
                e.vx = 2 + Math.random() * 3;
                e.scale = 0.6 + Math.random() * 0.8;
            } else if (e.vx < 0 && e.x < -200) {
                e.x = this.canvas.width + 200;
                e.y = this.canvas.height * 0.1 + Math.random() * (this.canvas.height * 0.8);
                e.type = ['lander', 'drone', 'advanced'][Math.floor(Math.random() * 3)];
                e.vx = -(2 + Math.random() * 3);
                e.scale = 0.6 + Math.random() * 0.8;
            }

            ctx.save();
            // Scale and draw
            ctx.translate(e.x, e.y);
            ctx.scale(e.scale, e.scale);
            ctx.translate(-e.x, -e.y);

            // Mock lander for the draw method
            const tempLander = this.physics.lander;
            this.physics.lander = {
                x: e.x, y: e.y, angle: e.vx > 0 ? 0.2 : -0.2,
                vehicleType: e.type === 'advanced' ? 'basic' : e.type,
                thrusting: true, fuel: 100, strafePower: 0,
                width: e.type === 'drone' ? 32 : 40,
                height: e.type === 'drone' ? 16 : 28,
                deckWidth: 42, deckOffset: 12, basketHeight: 20,
                magneticDeckActive: false
            };

            this.drawLander();

            // If advanced, maybe draw some extra glowing bits
            if (e.type === 'advanced') {
                ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
                ctx.beginPath();
                ctx.arc(e.x, e.y - 10, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            this.physics.lander = tempLander; // Restore

            ctx.restore();
        }
    }

    drawGravityWell(well, baseConfig) {
        const ctx = this.ctx;
        const time = Date.now() * 0.0015;

        // ── Minimap exclusion zone ────────────────────────────────────────────
        // The minimap lives in screen-space top-right; convert well world position to
        // screen coords so we can check proximity. (The camera transform is active here,
        // so we just draw — but we need to know where the well projects on screen to
        // decide whether to skip painting at all. Instead we simply clip the minimap
        // area out so the gradient never bleeds into the HUD.)
        // NOTE: ctx.save() + clip below is in WORLD SPACE so we skip that approach.
        // Instead we rely on the minimap being drawn AFTER this, which already has its
        // own clip region — so we do nothing extra here.

        // ── Base spatial glow ─────────────────────────────────────────────────
        const grad = ctx.createRadialGradient(well.x, well.y, 15, well.x, well.y, 160);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.15, 'rgba(30, 0, 80, 0.9)');
        grad.addColorStop(0.4, 'rgba(76, 29, 149, 0.55)');
        grad.addColorStop(0.75, 'rgba(139, 92, 246, 0.15)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 160, 0, Math.PI * 2);
        ctx.fill();

        // ── Animated accretion rings ──────────────────────────────────────────
        // Three concentric rings that cycle inward toward the event horizon,
        // creating the impression of matter spiralling in.
        const RINGS = 4;
        for (let i = 0; i < RINGS; i++) {
            // Each ring starts large and shrinks towards 0 over its period
            const period = 2.8 + i * 0.7;  // seconds per cycle
            const phase = (time / period + i / RINGS) % 1; // 0..1, offset per ring
            const radius = 90 * (1 - phase);           // shrinks from 90 → 0
            const alpha = phase < 0.15 ? phase / 0.15  // fade in
                        : phase > 0.75 ? (1 - phase) / 0.25  // fade out near center
                        : 1;
            const hue = 260 + i * 15;
            ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${alpha * 0.55})`;
            ctx.lineWidth = 2.5 - i * 0.4;
            ctx.beginPath();
            ctx.arc(well.x, well.y, Math.max(0.5, radius), 0, Math.PI * 2);
            ctx.stroke();
        }

        // ── Event Horizon (pure black center) ────────────────────────────────
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(well.x, well.y, 18, 0, Math.PI * 2);
        ctx.fill();

        // ── Photon ring (bright outline around the event horizon) ─────────────
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 18.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawMonster() {
        if (!this.physics.monster) return;
        const m = this.physics.monster;
        const ctx = this.ctx;
        const t = Date.now() / 1000;

        const trail = m.trail;
        if (!trail || trail.length < 4) return;

        // ── Helper: sample world position + forward angle along trail ──
        function trailSample(dist) {
            let walked = 0;
            for (let i = 1; i < trail.length; i++) {
                const dx = trail[i].x - trail[i - 1].x;
                const dy = trail[i].y - trail[i - 1].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (walked + d >= dist) {
                    const f = d < 0.001 ? 0 : (dist - walked) / d;
                    return { x: trail[i - 1].x + dx * f, y: trail[i - 1].y + dy * f, angle: Math.atan2(dy, dx) };
                }
                walked += d;
            }
            const p = trail[trail.length - 1];
            return { x: p.x, y: p.y, angle: 0 };
        }

        // Bigger segments — ~40% larger than before
        const SEGS = [
            { d: 0, r: 50 }, // HEAD
            { d: 60, r: 43 },
            { d: 112, r: 38 },
            { d: 156, r: 34 },
            { d: 194, r: 30 },
            { d: 228, r: 26 },
            { d: 258, r: 22 },
            { d: 285, r: 18 },
            { d: 308, r: 13 },
            { d: 326, r: 10 },
            { d: 339, r: 7 },
        ];

        const positions = SEGS.map(s => ({ r: s.r, ...trailSample(s.d) }));
        const head = positions[0];

        const lander = this.physics.lander;
        const hdx = lander ? lander.x - m.x : m.vx;
        const hdy = lander ? lander.y - m.y : m.vy;
        const targetHeadAngle = Math.atan2(hdy, hdx);

        // Smoothly interpolate the head angle (shortest path)
        if (m.currentHeadAngle === undefined) {
            m.currentHeadAngle = targetHeadAngle;
        } else {
            let diff = targetHeadAngle - m.currentHeadAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            // Lerp factor: 0.08 for smooth, natural rotation
            m.currentHeadAngle += diff * 0.08;
        }

        const headAngle = m.currentHeadAngle;
        // "Up" from the head's facing direction (perpendicular)
        const upAngle = headAngle - Math.PI / 2;

        const glowPulse = 0.55 + Math.abs(Math.sin(t * 1.8)) * 0.45;

        // ══ PASS 0: DEEP GLOW (drawn behind everything) ════════════════════
        ctx.save();
        // Overall body aura
        const auraGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, head.r * 4.5);
        auraGrad.addColorStop(0, `rgba(200, 20, 20, ${0.22 * glowPulse})`);
        auraGrad.addColorStop(0.5, `rgba(180, 10, 10, ${0.10 * glowPulse})`);
        auraGrad.addColorStop(1, 'rgba(140, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, head.r * 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ══ PASS 1: LEGS — randomised per segment, organic scuttle ══════════
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Per-segment deterministic "DNA" so legs keep their character frame-to-frame
        const legDNA = [
            { sides: [-1, 1], count: 1, spread: 0.45, len: 1.6, thick: 3.8 },
            { sides: [-1, 1], count: 2, spread: 0.55, len: 1.3, thick: 3.2 },
            { sides: [-1], count: 1, spread: 0.38, len: 2.0, thick: 2.8 },
            { sides: [-1, 1], count: 1, spread: 0.60, len: 1.1, thick: 3.5 },
            { sides: [1], count: 2, spread: 0.42, len: 1.8, thick: 2.5 },
            { sides: [-1, 1], count: 1, spread: 0.50, len: 1.4, thick: 3.0 },
            { sides: [-1, 1], count: 1, spread: 0.35, len: 2.2, thick: 2.2 },
            { sides: [1], count: 1, spread: 0.48, len: 1.2, thick: 2.8 },
        ];
        for (let i = 1; i <= 8; i++) {
            const seg = positions[i];
            if (!seg) continue;
            const dna = legDNA[i - 1] || legDNA[0];
            const basePhase = t * (1.8 + i * 0.3) + i * 1.7;
            const spasm = Math.sin(t * 6.5 + i * 2.8) > 0.88 ? 2.2 : 1.0;

            for (const side of dna.sides) {
                for (let li = 0; li < dna.count; li++) {
                    const legPhase = basePhase + li * 1.1;
                    const spreadAngle = dna.spread + li * 0.18;
                    const rootX = seg.x + Math.cos(seg.angle + side * Math.PI * spreadAngle) * seg.r * 0.8;
                    const rootY = seg.y + Math.sin(seg.angle + side * Math.PI * spreadAngle) * seg.r * 0.8;

                    const reach = seg.r * dna.len;
                    const j1X = rootX + side * reach * 0.45 + Math.sin(legPhase * 0.8) * 8 * spasm;
                    const j1Y = rootY + reach * 0.35 + Math.cos(legPhase) * 6 * spasm;
                    const j2X = j1X + side * reach * 0.38 + Math.sin(legPhase * 1.3 + 0.9) * 10 * spasm;
                    const j2Y = j1Y + reach * 0.45 + Math.cos(legPhase * 0.9 + 1.2) * 7 * spasm;
                    const footX = j2X + side * reach * 0.22 + Math.sin(legPhase * 1.7) * 8 * spasm;
                    const footY = j2Y + reach * 0.25 + Math.cos(legPhase * 1.1) * 5;

                    ctx.strokeStyle = 'rgba(0,0,0,0.88)';
                    ctx.lineWidth = dna.thick;
                    ctx.beginPath();
                    ctx.moveTo(rootX, rootY);
                    ctx.bezierCurveTo(j1X, j1Y, j2X, j2Y, footX, footY);
                    ctx.stroke();

                    ctx.strokeStyle = `rgba(140,15,15,0.55)`;
                    ctx.lineWidth = dna.thick * 0.45;
                    ctx.stroke();

                    // Claw — 2 tines of random length
                    const clawLen = 6 + (i % 3) * 3;
                    for (const cs of [-1, 1]) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                        ctx.lineWidth = 1.4;
                        ctx.beginPath();
                        ctx.moveTo(footX, footY);
                        ctx.lineTo(footX + side * clawLen * 0.6 + cs * 4, footY + clawLen);
                        ctx.stroke();
                    }
                }
            }
        }
        ctx.restore();

        // ══ PASS 3: SEGMENT CIRCLES — dark void body, glowing crimson rim ═══
        ctx.save();
        for (let i = positions.length - 1; i >= 0; i--) {
            const seg = positions[i];
            const isHead = i === 0;

            // Outer ember glow — brightest just outside the rim, dark at center
            const rimGlow = ctx.createRadialGradient(seg.x, seg.y, seg.r * 0.7, seg.x, seg.y, seg.r * 2.6);
            rimGlow.addColorStop(0, `rgba(160, 10, 10, ${0.35 * glowPulse})`);
            rimGlow.addColorStop(0.45, `rgba(200, 20, 20, ${0.18 * glowPulse})`);
            rimGlow.addColorStop(1, 'rgba(80, 0, 0, 0)');
            ctx.fillStyle = rimGlow;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.r * 2.6, 0, Math.PI * 2);
            ctx.fill();

            // Body — void center fading to hot crimson rim (inverted shading = no plastic-ball look)
            const bGrad = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, seg.r);
            bGrad.addColorStop(0, '#060000');
            bGrad.addColorStop(0.45, '#1a0303');
            bGrad.addColorStop(0.72, '#540808');
            bGrad.addColorStop(0.88, '#8b1010');
            bGrad.addColorStop(1, '#c21414');
            ctx.fillStyle = bGrad;
            ctx.strokeStyle = `rgba(220, 20, 20, ${0.55 + glowPulse * 0.25})`;
            ctx.lineWidth = isHead ? 2.5 : 1.8;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Veins/cracks — thin glowing lines on surface (skip tail segments)
            if (i < 7 && seg.r > 14) {
                const crackPhase = i * 2.4 + t * 0.4;
                ctx.strokeStyle = `rgba(255, 40, 0, ${0.18 + Math.abs(Math.sin(crackPhase)) * 0.14})`;
                ctx.lineWidth = 0.8;
                for (let c = 0; c < 2; c++) {
                    const ca = crackPhase + c * Math.PI;
                    ctx.beginPath();
                    ctx.moveTo(seg.x + Math.cos(ca) * seg.r * 0.25, seg.y + Math.sin(ca) * seg.r * 0.25);
                    ctx.bezierCurveTo(
                        seg.x + Math.cos(ca + 0.5) * seg.r * 0.55, seg.y + Math.sin(ca + 0.5) * seg.r * 0.55,
                        seg.x + Math.cos(ca + 0.9) * seg.r * 0.7, seg.y + Math.sin(ca + 0.9) * seg.r * 0.7,
                        seg.x + Math.cos(ca + 1.2) * seg.r * 0.82, seg.y + Math.sin(ca + 1.2) * seg.r * 0.82
                    );
                    ctx.stroke();
                }
            }

            if (isHead) {
                // ── MOUTH — massive oval taking up most of the face ────────
                const mCx = seg.x + Math.cos(headAngle) * seg.r * 0.52;
                const mCy = seg.y + Math.sin(headAngle) * seg.r * 0.52;
                const mW = seg.r * 0.72, mH = seg.r * 0.48;

                ctx.save();
                ctx.translate(mCx, mCy);
                ctx.rotate(headAngle);

                // Mouth void
                const mouthGrad = ctx.createRadialGradient(0, 0, 0, 0, mH * 0.3, mW);
                mouthGrad.addColorStop(0, '#1a0000');
                mouthGrad.addColorStop(0.6, '#0a0000');
                mouthGrad.addColorStop(1, '#050000');
                ctx.fillStyle = mouthGrad;
                ctx.strokeStyle = 'rgba(0,0,0,0.95)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, mW, mH, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Inner throat glow (pulsing red from depth)
                const throatPulse = 0.3 + Math.abs(Math.sin(t * 2.1)) * 0.35;
                const throatGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, mW * 0.7);
                throatGrad.addColorStop(0, `rgba(255,30,0,${throatPulse})`);
                throatGrad.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = throatGrad;
                ctx.beginPath();
                ctx.ellipse(0, 2, mW * 0.7, mH * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();

                // Teeth — top row (sharp triangles, bone-yellowed not cartoon-white)
                const toothCount = 7;
                for (let ti = 0; ti < toothCount; ti++) {
                    const tx = -mW * 0.88 + (ti / (toothCount - 1)) * mW * 1.76;
                    const tGrad = ctx.createLinearGradient(tx, -mH * 0.85, tx, -mH * 0.15);
                    tGrad.addColorStop(0, 'rgba(200, 185, 140, 0.9)');
                    tGrad.addColorStop(1, 'rgba(120, 80, 60, 0.85)');
                    ctx.fillStyle = tGrad;
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(tx - mW * 0.07, -mH * 0.85);
                    ctx.lineTo(tx, -mH * 0.12);
                    ctx.lineTo(tx + mW * 0.07, -mH * 0.85);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                // Bottom row (offset half a tooth)
                for (let ti = 0; ti < toothCount - 1; ti++) {
                    const tx = -mW * 0.76 + (ti / (toothCount - 2)) * mW * 1.52;
                    const tGrad2 = ctx.createLinearGradient(tx, mH * 0.85, tx, mH * 0.18);
                    tGrad2.addColorStop(0, 'rgba(190, 175, 130, 0.88)');
                    tGrad2.addColorStop(1, 'rgba(110, 70, 50, 0.82)');
                    ctx.fillStyle = tGrad2;
                    ctx.beginPath();
                    ctx.moveTo(tx - mW * 0.065, mH * 0.85);
                    ctx.lineTo(tx, mH * 0.15);
                    ctx.lineTo(tx + mW * 0.065, mH * 0.85);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();

                // ── ARMS — two large forward-reaching clawed appendages ──────
                for (const side of [-1, 1]) {
                    const armPhase = t * 1.2 + side * 1.4;
                    const baseAng = headAngle + side * 1.1;
                    const rootX = seg.x + Math.cos(baseAng) * seg.r * 0.75;
                    const rootY = seg.y + Math.sin(baseAng) * seg.r * 0.75;

                    const elbow1X = rootX + Math.cos(headAngle + side * 0.5) * seg.r * 1.0 + Math.sin(armPhase) * 12;
                    const elbow1Y = rootY + Math.sin(headAngle + side * 0.5) * seg.r * 1.0 + Math.cos(armPhase) * 10;
                    const elbow2X = elbow1X + Math.cos(headAngle + side * 0.2) * seg.r * 0.9 + Math.sin(armPhase * 1.3 + 0.7) * 10;
                    const elbow2Y = elbow1Y + Math.sin(headAngle + side * 0.2) * seg.r * 0.9 + Math.cos(armPhase * 1.3 + 0.7) * 8;
                    const tipX = elbow2X + Math.cos(headAngle) * seg.r * 0.55;
                    const tipY = elbow2Y + Math.sin(headAngle) * seg.r * 0.55;

                    // Arm shadow
                    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
                    ctx.lineWidth = 7;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(rootX, rootY);
                    ctx.bezierCurveTo(elbow1X, elbow1Y, elbow2X, elbow2Y, tipX, tipY);
                    ctx.stroke();
                    // Arm flesh
                    ctx.strokeStyle = `rgba(160,10,10,0.85)`;
                    ctx.lineWidth = 4.5;
                    ctx.stroke();
                    // Arm highlight
                    ctx.strokeStyle = `rgba(220,30,20,0.4)`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Claw — three tines at tip
                    const clawLen = seg.r * 0.48;
                    for (let ci = -1; ci <= 1; ci++) {
                        const clawAng = headAngle + ci * 0.45;
                        ctx.strokeStyle = 'rgba(0,0,0,0.88)';
                        ctx.lineWidth = 3.2;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(tipX, tipY);
                        ctx.lineTo(tipX + Math.cos(clawAng) * clawLen, tipY + Math.sin(clawAng) * clawLen);
                        ctx.stroke();
                        ctx.strokeStyle = 'rgba(180,15,15,0.75)';
                        ctx.lineWidth = 1.8;
                        ctx.stroke();
                    }
                }
                ctx.lineCap = 'butt';
            }
        }
        ctx.restore();
    }

    // Generic radar-ping zone — driven entirely by level config.
    // Any level can opt in by adding a `radarPingZone` object:
    //   radarPingZone: { cx, cy, r, color, period }
    // where color is an RGB string like '210,100,15'.
    drawCollectibles() {
        if (!this.physics.collectibles || this.physics.collectibles.length === 0) return;
        const ctx = this.ctx;
        ctx.save();
        for (const c of this.physics.collectibles) {
            if (c.type === 'ring') {
                ctx.strokeStyle = '#fbbf24'; // amber-400
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.radius || 20, 0, Math.PI * 2);
                ctx.stroke();
                // inner glow
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
                ctx.lineWidth = 8;
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawRadarPingZone() {
        if (this.uiCollapsed) return;
        const cfg = this.physics.currentLevelConfig;
        const zone = cfg?.radarPingZone;
        if (!zone) return;

        const ctx = this.ctx;
        const { cx, cy } = zone;
        const maxR = zone.r ?? 300;
        const color = zone.color ?? '210,100,15';
        const period = zone.period ?? 3800;
        const now = Date.now();

        // ── Soft ambient glow — no hard edge ─────────────────────────────────
        const glowAlpha = 0.06 + 0.04 * Math.sin(now * 0.0009);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.1);
        grad.addColorStop(0, `rgba(${color}, ${glowAlpha * 2.2})`);
        grad.addColorStop(0.5, `rgba(${color}, ${glowAlpha})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // ── Expanding ping rings — fade to nothing before reaching maxR ───────
        const NUM_PINGS = 3;
        for (let i = 0; i < NUM_PINGS; i++) {
            const offset = (i / NUM_PINGS) * period;
            const t = ((now + offset) % period) / period; // 0→1
            const ringR = t * maxR;
            const alpha = Math.pow(1 - t, 1.6) * 0.30;
            ctx.strokeStyle = `rgba(${color}, ${alpha})`;
            ctx.lineWidth = 1.5 + (1 - t) * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // ── Tremor dots — subtle ground-plane orbit ───────────────────────────
        ctx.save();
        for (let i = 0; i < 5; i++) {
            const angle = (now * 0.0004 + i * 1.257) % (Math.PI * 2);
            const drift = maxR * 0.22 + maxR * 0.14 * Math.abs(Math.sin(now * 0.0007 + i));
            const px = cx + Math.cos(angle) * drift;
            const py = cy + Math.sin(angle) * drift * 0.35;
            const dotAlpha = 0.15 + 0.10 * Math.sin(now * 0.002 + i * 2);
            ctx.fillStyle = `rgba(${color}, ${dotAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.8 + Math.abs(Math.sin(now * 0.003 + i)), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSandWorm() {
        if (!this.physics.sandWorm) return;
        const m = this.physics.sandWorm;
        const ctx = this.ctx;
        const t = Date.now() / 1000;

        const trail = m.trail;
        if (!trail || trail.length < 4) return;

        // ── Helper: sample world position + forward angle along trail ──
        function trailSample(dist) {
            let walked = 0;
            for (let i = 1; i < trail.length; i++) {
                const dx = trail[i].x - trail[i - 1].x;
                const dy = trail[i].y - trail[i - 1].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (walked + d >= dist) {
                    const f = d < 0.001 ? 0 : (dist - walked) / d;
                    return { x: trail[i - 1].x + dx * f, y: trail[i - 1].y + dy * f, angle: Math.atan2(dy, dx) };
                }
                walked += d;
            }
            const p = trail[trail.length - 1];
            return { x: p.x, y: p.y, angle: 0 };
        }

        // Segments — large, chunky, Dune-style
        const SEGS = [
            { d: 0,   r: 48 }, // HEAD — big open maw
            { d: 62,  r: 42 },
            { d: 118, r: 37 },
            { d: 168, r: 32 },
            { d: 212, r: 27 },
            { d: 250, r: 22 },
            { d: 282, r: 18 },
            { d: 308, r: 14 },
            { d: 328, r: 10 },
            { d: 344, r:  7 },
        ];

        const positions = SEGS.map(s => ({ r: s.r, ...trailSample(s.d) }));
        const head = positions[0];

        const lander = this.physics.lander;
        const hdx = lander ? lander.x - m.x : m.vx;
        const hdy = lander ? lander.y - m.y : m.vy;
        const targetHeadAngle = Math.atan2(hdy, hdx);

        if (m.currentHeadAngle === undefined) {
            m.currentHeadAngle = targetHeadAngle;
        } else {
            let diff = targetHeadAngle - m.currentHeadAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            m.currentHeadAngle += diff * 0.15;
        }

        const headAngle = m.currentHeadAngle;
        const glowPulse = 0.55 + Math.abs(Math.sin(t * 1.8)) * 0.45;

        // ══ PASS 0: DEEP GLOW AURA ══════════════════════════════════════════
        ctx.save();
        const auraGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, head.r * 5.5);
        auraGrad.addColorStop(0, `rgba(200, 100, 20, ${0.28 * glowPulse})`);
        auraGrad.addColorStop(0.5, `rgba(160, 70, 5, ${0.12 * glowPulse})`);
        auraGrad.addColorStop(1, 'rgba(120, 50, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, head.r * 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ══ PASS 1: BODY LATERAL APPENDAGES ═════════════════════════════════════
        ctx.save();
        for (let i = 1; i < positions.length; i++) {
            const seg = positions[i];
            if (!seg) continue;
            for (const side of [-1, 1]) {
                const spineAngle = seg.angle + side * Math.PI * 0.5;
                // Base circle
                const rootX = seg.x + Math.cos(spineAngle) * seg.r * 0.9;
                const rootY = seg.y + Math.sin(spineAngle) * seg.r * 0.9;
                
                ctx.fillStyle = 'rgba(120,40,10,0.9)';
                ctx.beginPath();
                ctx.arc(rootX, rootY, seg.r * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Inner bright circle
                const innerX = rootX + Math.cos(spineAngle) * seg.r * 0.15;
                const innerY = rootY + Math.sin(spineAngle) * seg.r * 0.15;
                ctx.fillStyle = `rgba(220,130,30,${0.7 + glowPulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(innerX, innerY, seg.r * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // ══ PASS 2: BODY SEGMENTS (back to front) ═══════════════════════════
        ctx.save();
        for (let i = positions.length - 1; i >= 0; i--) {
            const seg = positions[i];
            const isHead = i === 0;

            const bGrad = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, seg.r);
            bGrad.addColorStop(0,    '#1a0d00');
            bGrad.addColorStop(0.45, '#331a00');
            bGrad.addColorStop(0.72, '#5c2a00');
            bGrad.addColorStop(0.88, '#8f4300');
            bGrad.addColorStop(1,    '#c05800');
            ctx.fillStyle = bGrad;
            ctx.strokeStyle = `rgba(220, 120, 20, ${0.5 + glowPulse * 0.3})`;
            ctx.lineWidth = isHead ? 3 : 2;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Segment crease lines (give a ringed, segmented feel)
            if (!isHead && i % 2 === 0) {
                const perpAngle = seg.angle + Math.PI / 2;
                ctx.strokeStyle = 'rgba(0,0,0,0.35)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, seg.r * 0.92, perpAngle - 0.8, perpAngle + 0.8);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, seg.r * 0.92, perpAngle + Math.PI - 0.8, perpAngle + Math.PI + 0.8);
                ctx.stroke();
            }

            if (isHead) {
                // ══ DUNE-STYLE CIRCULAR MAW ══════════════════════════════════
                ctx.save();
                ctx.translate(seg.x, seg.y);
                ctx.rotate(headAngle);

                const R = seg.r;  // radius of the head circle

                // ── 1. OUTER LIP RING (segmented chitin plates) ──────────────
                const lipPlates = 20;
                for (let li = 0; li < lipPlates; li++) {
                    const a0 = (li / lipPlates) * Math.PI * 2;
                    const a1 = ((li + 0.82) / lipPlates) * Math.PI * 2;
                    const openFrac = 0.92; // how open the maw is (slightly contracted at back)

                    const lipR = R * 0.98;
                    const innerR = R * 0.78;

                    // Alternate dark / mid tone for chitin plate texture
                    const plateLuma = li % 2 === 0 ? 0.55 : 0.40;
                    ctx.fillStyle = `rgba(${Math.round(160*plateLuma)},${Math.round(75*plateLuma)},${Math.round(15*plateLuma)},0.95)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
                    ctx.lineWidth = 1.2;

                    ctx.beginPath();
                    ctx.arc(0, 0, lipR, a0, a1);
                    ctx.arc(0, 0, innerR, a1, a0, true);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 2. THROAT VOID ────────────────────────────────────────────
                const throatGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.78);
                throatGrad.addColorStop(0,   '#000000');
                throatGrad.addColorStop(0.45, '#0a0200');
                throatGrad.addColorStop(0.85, '#1a0500');
                throatGrad.addColorStop(1,   '#2a0a00');
                ctx.fillStyle = throatGrad;
                ctx.beginPath();
                ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2);
                ctx.fill();

                // ── 3. PULSING PHARYNX GLOW ───────────────────────────────────
                const throatPulse = 0.25 + Math.abs(Math.sin(t * 2.4)) * 0.45;
                const pharynxGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.52);
                pharynxGrad.addColorStop(0,   `rgba(255,140,20,${throatPulse * 0.95})`);
                pharynxGrad.addColorStop(0.55, `rgba(220,60,0,${throatPulse * 0.6})`);
                pharynxGrad.addColorStop(1,   'rgba(160,20,0,0)');
                ctx.fillStyle = pharynxGrad;
                ctx.beginPath();
                ctx.arc(0, 0, R * 0.52, 0, Math.PI * 2);
                ctx.fill();

                // ── 4. OUTER RING OF TEETH (large, curved, radial) ────────────
                // Pointed inward toward throat — Dune worm mandibles fan outward
                const outerTeethCount = 18;
                for (let ti = 0; ti < outerTeethCount; ti++) {
                    const angle = (ti / outerTeethCount) * Math.PI * 2;
                    const toothLen   = R * 0.40;
                    const toothWidth = R * 0.085;

                    // Root on the inner edge of the lip ring
                    const rootR  = R * 0.76;
                    const rootX  = Math.cos(angle) * rootR;
                    const rootY  = Math.sin(angle) * rootR;

                    // Tip points toward center (inward)
                    const tipR  = R * 0.36;
                    const tipX  = Math.cos(angle) * tipR;
                    const tipY  = Math.sin(angle) * tipR;

                    // Perpendicular for tooth width
                    const perpX = -Math.sin(angle) * toothWidth;
                    const perpY =  Math.cos(angle) * toothWidth;

                    // Curved tooth: bezier curving slightly to the side (gives the rotational feel)
                    const curl  = 0.25; // how much the tooth curves (rotational direction)
                    const cpR   = R * 0.56;
                    const cpAngle = angle + curl;
                    const cpX   = Math.cos(cpAngle) * cpR;
                    const cpY   = Math.sin(cpAngle) * cpR;

                    ctx.fillStyle = `rgba(215, 200, 150, 0.95)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = 0.8;

                    ctx.beginPath();
                    ctx.moveTo(rootX + perpX, rootY + perpY);
                    ctx.quadraticCurveTo(cpX + perpX * 0.4, cpY + perpY * 0.4, tipX, tipY);
                    ctx.quadraticCurveTo(cpX - perpX * 0.4, cpY - perpY * 0.4, rootX - perpX, rootY - perpY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 5. INNER RING OF SMALLER TEETH (second row) ──────────────
                const innerTeethCount = 14;
                for (let ti = 0; ti < innerTeethCount; ti++) {
                    const angle = ((ti + 0.5) / innerTeethCount) * Math.PI * 2;
                    const toothLen   = R * 0.22;
                    const toothWidth = R * 0.055;

                    const rootR = R * 0.50;
                    const rootX = Math.cos(angle) * rootR;
                    const rootY = Math.sin(angle) * rootR;

                    const tipR  = R * 0.28;
                    const tipX  = Math.cos(angle) * tipR;
                    const tipY  = Math.sin(angle) * tipR;

                    const perpX = -Math.sin(angle) * toothWidth;
                    const perpY =  Math.cos(angle) * toothWidth;

                    const curl  = 0.3;
                    const cpR   = R * 0.39;
                    const cpAngle = angle + curl;
                    const cpX   = Math.cos(cpAngle) * cpR;
                    const cpY   = Math.sin(cpAngle) * cpR;

                    ctx.fillStyle = `rgba(200, 180, 130, 0.9)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
                    ctx.lineWidth = 0.6;

                    ctx.beginPath();
                    ctx.moveTo(rootX + perpX, rootY + perpY);
                    ctx.quadraticCurveTo(cpX + perpX * 0.3, cpY + perpY * 0.3, tipX, tipY);
                    ctx.quadraticCurveTo(cpX - perpX * 0.3, cpY - perpY * 0.3, rootX - perpX, rootY - perpY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 6. INNERMOST TOOTH RING (tiny, near the pharynx) ─────────
                const coreTeethCount = 9;
                for (let ti = 0; ti < coreTeethCount; ti++) {
                    const angle = (ti / coreTeethCount) * Math.PI * 2;
                    const toothWidth = R * 0.035;

                    const rootR = R * 0.30;
                    const rootX = Math.cos(angle) * rootR;
                    const rootY = Math.sin(angle) * rootR;

                    const tipR  = R * 0.14;
                    const tipX  = Math.cos(angle) * tipR;
                    const tipY  = Math.sin(angle) * tipR;

                    const perpX = -Math.sin(angle) * toothWidth;
                    const perpY =  Math.cos(angle) * toothWidth;

                    ctx.fillStyle = `rgba(240, 220, 160, 0.85)`;
                    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
                    ctx.lineWidth = 0.5;

                    ctx.beginPath();
                    ctx.moveTo(rootX + perpX, rootY + perpY);
                    ctx.lineTo(tipX, tipY);
                    ctx.lineTo(rootX - perpX, rootY - perpY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // ── 7. INNER EYE / CORE SPOT ──────────────────────────────────
                const eyePulse = 0.6 + Math.sin(t * 3.5) * 0.4;
                ctx.fillStyle = `rgba(255, 80, 0, ${eyePulse * 0.85})`;
                ctx.beginPath();
                ctx.arc(0, 0, R * 0.08, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore(); // end head transform
            }
        }
        ctx.restore();
    }

    // Horizontal x-ranges of the flat landing pads (start depot, collection, hubs)
    getPadRanges() {
        const p = this.physics;
        const ranges = [];
        if (p.startDepot) ranges.push({ left: p.startDepot.x, right: p.startDepot.x + p.startDepot.width });
        if (p.collectionPoint) ranges.push({ left: p.collectionPoint.x, right: p.collectionPoint.x + p.collectionPoint.width });
        for (const hub of p.deliveryHubs) ranges.push({ left: hub.x, right: hub.x + hub.width });
        return ranges;
    }

    drawParallax() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const lvPal = (levels[this.currentLevelIndex] || {}).palette;
        const skyBot = lvPal ? lvPal.skyBot : '#0f172a';

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        const [sr, sg, sb] = hexToRgb(skyBot.length === 7 ? skyBot : '#0f172a');

        const layers = [
            { factor: 0.12, freq: 0.0018, freq2: 0.0031, seed: 1.7, seed2: 4.2, yMin: 0.15, yMax: 0.55, alpha: 0.55, darken: 0.45 },
            { factor: 0.28, freq: 0.0027, freq2: 0.0049, seed: 7.3, seed2: 2.9, yMin: 0.25, yMax: 0.60, alpha: 0.50, darken: 0.60 },
            { factor: 0.45, freq: 0.0042, freq2: 0.0071, seed: 3.1, seed2: 8.6, yMin: 0.35, yMax: 0.62, alpha: 0.45, darken: 0.75 },
        ];

        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const zoom = this.camera ? this.camera.zoom : 1;

        // Draw parallax background layers
        for (const layer of layers) {
            const dr = Math.round(sr * layer.darken);
            const dg = Math.round(sg * layer.darken);
            const db = Math.round(sb * layer.darken);

            ctx.beginPath();
            ctx.moveTo(0, h);

            for (let sx = 0; sx <= w + 4; sx += 4) {
                // Convert screen X to world X, apply parallax factor
                const worldX = camX * layer.factor + (sx - w / 2) / zoom;

                const n1 = Math.sin(worldX * layer.freq + layer.seed);
                const n2 = Math.sin(worldX * layer.freq2 + layer.seed2);
                const n3 = Math.sin(worldX * layer.freq * 2.3 + layer.seed + 1.1);
                const t = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 0.5 + 0.5;

                // Base Y for this layer in world coordinates
                const levelH = this.physics.levelHeight || 2000;
                const baseYWorld = levelH * layer.yMin;
                const amplitudeWorld = levelH * (layer.yMax - layer.yMin);
                const layerYWorld = baseYWorld + t * amplitudeWorld;

                // Apply vertical parallax based on camera Y
                const parallaxYWorld = layerYWorld - (camY - levelH / 2) * (layer.factor * 0.3);

                // Convert back to screen space for drawing
                const screenY = h / 2 + (parallaxYWorld - camY) * zoom;

                ctx.lineTo(sx, screenY);
            }

            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fillStyle = `rgba(${dr},${dg},${db},${layer.alpha})`;
            ctx.fill();
        }
    }

    drawSegments() {
        const segs = this.physics.segments;
        if (!segs || segs.length === 0) return;

        const ctx = this.ctx;
        const lv = levels[this.currentLevelIndex] || {};
        const pal = lv.palette || {};
        const now = performance.now();

        ctx.save();

        for (const seg of segs) {
            let color = seg.color || pal.rockEdge || '#f97316';
            let glow = pal.rockGlow || 'rgba(249,115,22,';
            
            if (seg.bouncy) {
                color = '#22d3ee'; // cyan
                glow = 'rgba(34,211,238,';
            } else if (seg.sticky) {
                color = '#d946ef'; // fuchsia
                glow = 'rgba(217,70,239,';
            } else if (seg.fragile) {
                color = '#bae6fd'; // light blue/glass
                glow = 'rgba(186,230,253,';
            } else if (seg.conveyorSpeed) {
                color = '#fde047'; // yellow
                glow = 'rgba(253,224,71,';
            } else if (seg.repulsor) {
                color = '#4ade80'; // bright green
                glow = 'rgba(74,222,128,';
            }

            const pulse = 0.7 + 0.3 * Math.sin(now * 0.002 + (seg.x1 + seg.y1) * 0.01);

            // Glow halo
            ctx.strokeStyle = glow + (0.18 * pulse) + ')';
            ctx.lineWidth = seg.sticky ? 20 : 14;
            ctx.lineCap = 'round';
            if (seg.bouncy) {
                ctx.setLineDash([15, 10]);
            } else if (seg.fragile) {
                ctx.setLineDash([5, 5]);
            } else if (seg.conveyorSpeed) {
                ctx.lineDashOffset = -now * 0.05 * Math.sign(seg.conveyorSpeed);
                ctx.setLineDash([10, 10]);
            } else if (seg.repulsor) {
                ctx.lineDashOffset = now * 0.02;
                ctx.setLineDash([2, 8]);
            } else {
                ctx.setLineDash([]);
            }
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            // Core line
            ctx.strokeStyle = color;
            ctx.lineWidth = seg.sticky ? 5 : 3;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
            
            ctx.lineDashOffset = 0;
            ctx.setLineDash([]); // Reset line dash

            // Bright highlight edge
            ctx.strokeStyle = seg.bouncy ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            // End-cap dots
            for (const [ex, ey] of [[seg.x1, seg.y1], [seg.x2, seg.y2]]) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(ex, ey, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.lineCap = 'butt';
        ctx.restore();
    }

    drawFluidBounds() {
        const levelConfig = levels[this.currentLevelIndex];
        const oob = levelConfig?.outOfBounds;
        if (!oob || oob.type === 'void' || !oob.surfaceY) return;

        const ctx = this.ctx;
        const now = Date.now();
        const viewW = this.canvas.width / this.camera.zoom;
        const startX = this.camera.x - viewW / 2 - 100;
        const endX = this.camera.x + viewW / 2 + 100;
        const depth = Math.max(oob.surfaceY + 2000, this.physics.levelHeight + 1000); // go very deep

        ctx.save();
        ctx.fillStyle = oob.color || 'rgba(14, 165, 233, 0.4)';

        if (oob.type === 'sand') {
            ctx.beginPath();
            ctx.moveTo(startX, oob.surfaceY + 20);
            for (let x = startX; x <= endX; x += 40) {
                const duneY = Math.sin(x * 0.005) * 40 + Math.sin(x * 0.015) * 15;
                ctx.lineTo(x, oob.surfaceY + duneY);
            }
            ctx.lineTo(endX, depth);
            ctx.lineTo(startX, depth);
            ctx.fill();
        } else {
            // Draw animated waves
            ctx.beginPath();
            ctx.moveTo(startX, oob.surfaceY);
            for (let x = startX; x <= endX; x += 40) {
                const waveY = Math.sin(now / 800 + x * 0.02) * 10 + Math.sin(now / 500 + x * 0.05) * 5;
                ctx.lineTo(x, oob.surfaceY + waveY);
            }
            ctx.lineTo(endX, depth);
            ctx.lineTo(startX, depth);
            ctx.fill();

            // Shimmer layer
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(startX, oob.surfaceY);
            for (let x = startX; x <= endX; x += 40) {
                const waveY = Math.sin(now / 800 + x * 0.02) * 10 + Math.sin(now / 500 + x * 0.05) * 5;
                ctx.lineTo(x, oob.surfaceY + waveY + 5);
            }
            for (let x = endX; x >= startX; x -= 40) {
                const waveY = Math.sin(now / 800 + x * 0.02) * 10 + Math.sin(now / 500 + x * 0.05) * 5;
                ctx.lineTo(x, oob.surfaceY + waveY + 15);
            }
            ctx.fill();
        }

        ctx.restore();
    }

    drawMistEdges() {
        const levelConfig = levels[this.currentLevelIndex];
        const oob = levelConfig?.outOfBounds;
        if (!oob || !oob.mistColor) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const zoom = this.camera.zoom;
        const camX = this.camera.x;

        // World coordinates of screen edges
        const leftWorld = camX - (w / 2) / zoom;
        const rightWorld = camX + (w / 2) / zoom;

        const EDGE_FADE_DIST = 400; // Distance over which mist goes from 0 to full

        ctx.save();

        // Left Edge Mist
        if (leftWorld < 0) {
            const mistIntensity = Math.min(1.0, (-leftWorld) / EDGE_FADE_DIST);
            if (mistIntensity > 0) {
                const mistW = (-leftWorld) * zoom;
                const grad = ctx.createLinearGradient(0, 0, mistW, 0);
                grad.addColorStop(0, oob.mistColor);
                grad.addColorStop(1, 'transparent');

                ctx.globalAlpha = mistIntensity;
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, mistW, h);
            }
        }

        // Right Edge Mist
        const levelW = this.physics.levelWidth;
        if (rightWorld > levelW) {
            const mistIntensity = Math.min(1.0, (rightWorld - levelW) / EDGE_FADE_DIST);
            if (mistIntensity > 0) {
                const mistW = (rightWorld - levelW) * zoom;
                const startX = w - mistW;
                const grad = ctx.createLinearGradient(startX, 0, w, 0);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(1, oob.mistColor);

                ctx.globalAlpha = mistIntensity;
                ctx.fillStyle = grad;
                ctx.fillRect(startX, 0, mistW, h);
            }
        }

        ctx.restore();
    }

    drawWaterBodies() {
        // Water bodies are hand-authored polygons (edited in terrain-editor.html
        // the same way as terrainPolygons), not an {x,width} rect anymore — the
        // shape itself defines the basin, so there's no terrain-sampling here.
        const waterBodies = this.physics.waterBodies;
        if (!waterBodies || waterBodies.length === 0) return;

        const ctx = this.ctx;
        const now = Date.now();

        for (const body of waterBodies) {
            const pts = body.pts;
            if (!pts || pts.length < 3) continue;

            let lx = Infinity, rx = -Infinity, ly = Infinity, maxY = -Infinity;
            for (const p of pts) {
                lx = Math.min(lx, p.x); rx = Math.max(rx, p.x);
                ly = Math.min(ly, p.y); maxY = Math.max(maxY, p.y);
            }
            const lw = rx - lx;
            const ld = Math.max(8, maxY - ly); // Depth of the basin, from the authored shape

            ctx.save();

            // Water body — filled with depth gradient, clipped to the authored polygon
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();

            const depthGrad = ctx.createLinearGradient(lx, ly, lx, ly + ld);
            depthGrad.addColorStop(0, 'rgba(14,45,90,0.82)');
            depthGrad.addColorStop(0.5, 'rgba(8,25,60,0.90)');
            depthGrad.addColorStop(1, 'rgba(2,6,20,0.96)');
            ctx.fillStyle = depthGrad;
            ctx.fill();

            // Clip all inner content (fish, waves, ripples) to the water polygon
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.clip();

            // Shimmer layer near surface
            ctx.fillStyle = 'rgba(56,130,220,0.12)';
            ctx.fillRect(lx, ly, lw, 14);

            // Deeper gradient shift
            ctx.fillStyle = 'rgba(14,45,90,0.4)';
            ctx.fillRect(lx, ly + 14, lw, ld - 14);

            // Animated surface ripples
            ctx.strokeStyle = 'rgba(100,180,255,0.30)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            for (let wx = 0; wx <= lw; wx += 5) {
                const wy = Math.sin(now / 900 + (lx + wx) * 0.048) * 1.8;
                if (wx === 0) ctx.moveTo(lx + wx, ly + 4 + wy);
                else ctx.lineTo(lx + wx, ly + 4 + wy);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let wx = 0; wx <= lw; wx += 5) {
                const wy = Math.sin(now / 650 + (lx + wx) * 0.065 + 1.2) * 1.3;
                if (wx === 0) ctx.moveTo(lx + wx, ly + 9 + wy);
                else ctx.lineTo(lx + wx, ly + 9 + wy);
            }
            ctx.stroke();

            // Decorative wave lines (animated) — capped at 3 regardless of basin
            // depth, so deep basins don't get a busy stack of lines.
            ctx.strokeStyle = 'rgba(56,130,220,0.4)';
            ctx.lineWidth = 1.5;
            const waveLineCount = 3;
            const waveSpacing = Math.max(10, (ld - 14) / waveLineCount);
            for (let li = 0; li < waveLineCount; li++) {
                const wy = ly + 6 + li * waveSpacing;
                if (wy >= ly + ld - 6) break;
                ctx.beginPath();
                for (let wx = lx; wx < lx + lw; wx += 20) {
                    const waveOffset = Math.sin((wx + now * 0.05) * 0.03 + wy) * 3;
                    if (wx === lx) ctx.moveTo(wx, wy + waveOffset);
                    else ctx.lineTo(wx, wy + waveOffset);
                }
                ctx.stroke();
            }

            // Fish (clipped to water + terrain automatically) — smaller than before
            const fish = [
                { phase: 0.0, depth: 0.30, size: 1.0 },
                { phase: 2.1, depth: 0.52, size: 0.85 },
                { phase: 4.3, depth: 0.68, size: 1.1 },
                { phase: 1.5, depth: 0.40, size: 0.9 },
            ];
            for (const f of fish) {
                const ft = now / 1200 + f.phase;
                const fx = Math.min(Math.max(lx + lw / 2 + Math.sin(ft) * (lw * 0.36), lx + 12), lx + lw - 12);
                const fy = ly + ld * f.depth;
                const dir = Math.cos(ft) >= 0 ? 1 : -1;
                const bw = 9 * f.size, bh = 4 * f.size;
                ctx.fillStyle = 'rgba(60,180,110,0.88)';
                ctx.beginPath();
                ctx.ellipse(fx, fy, bw / 2, bh / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                const tail = fx - dir * (bw / 2);
                ctx.beginPath();
                ctx.moveTo(tail, fy);
                ctx.lineTo(tail - dir * bh * 0.9, fy - bh * 0.75);
                ctx.lineTo(tail - dir * bh * 0.9, fy + bh * 0.75);
                ctx.closePath();
                ctx.fill();
            }

            // Splash particles
            for (const p of this.physics.particles) {
                if (p.x >= lx && p.x <= lx + lw && p.y >= ly && p.y <= ly + ld) {
                    ctx.fillStyle = 'rgba(186,230,253,0.8)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Render sunk boxes
            for (const box of this.physics.boxes) {
                if (box.x >= lx && box.x <= lx + lw && box.y >= ly) {
                    ctx.fillStyle = 'rgba(15,23,42,0.85)'; // Dark silhouette
                    ctx.fillRect(box.x - box.width / 2, box.y - box.height / 2, box.width, box.height);
                    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(box.x - box.width / 2, box.y - box.height / 2, box.width, box.height);

                    // Box sinking bubbles
                    if (box.vy > 0.5 && Math.random() < 0.3) {
                        this.physics.particles.push({
                            x: box.x + (Math.random() - 0.5) * box.width,
                            y: box.y - box.height / 2,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -1 - Math.random(),
                            life: 1.0, decay: 0.02, size: 1.5, color: 'rgba(186,230,253,0.6)'
                        });
                    }
                }
            }

            ctx.restore();

            // Water surface edge line — soft blue-white
            ctx.strokeStyle = 'rgba(120,200,255,0.55)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let wx = 0; wx <= lw; wx += 6) {
                const wy = Math.sin(now / 900 + (lx + wx) * 0.048) * 1.5;
                if (wx === 0) ctx.moveTo(lx + wx, ly + wy);
                else ctx.lineTo(lx + wx, ly + wy);
            }
            ctx.stroke();

            // Fishing boat — bobs on the water surface
            if (body.hasBoat) {
                const bx = lx + lw * 0.6 + Math.sin(now / 2000) * 7;
                const by = ly - 1;
                // Hull
                ctx.fillStyle = '#4a3728';
                ctx.strokeStyle = '#6b5240';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(bx - 18, by);
                ctx.lineTo(bx + 18, by);
                ctx.lineTo(bx + 14, by + 10);
                ctx.lineTo(bx - 14, by + 10);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                // Deck stripe
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(bx - 18, by + 1, 36, 2.5);
                // Mast + pole
                ctx.strokeStyle = '#7a6050';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bx - 5, by); ctx.lineTo(bx - 5, by - 22);
                ctx.moveTo(bx - 5, by - 22); ctx.lineTo(bx - 5 + 14, by - 22);
                ctx.stroke();
                // Fishing line
                ctx.strokeStyle = 'rgba(180,180,180,0.65)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(bx + 9, by - 22);
                ctx.lineTo(bx + 9 + 6, by + 8 + Math.sin(now / 2000) * 3);
                ctx.stroke();
                // Float
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(bx + 15, by + 8 + Math.sin(now / 2000) * 3, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawHazards() {
        // Hazards are hand-authored polygons now (was a {x,y,radius} circle) — see
        // physics.js's pointInPolygon-based hazard check.
        if (!this.physics.hazards || this.physics.hazards.length === 0) return;
        const ctx = this.ctx;
        const now = performance.now();

        ctx.save();
        for (const haz of this.physics.hazards) {
            if (haz.type === 'laser') {
                const pts = haz.pts;
                if (!pts || pts.length < 2) continue;
                const [a, b] = pts;
                const state = haz.laserState || {};

                // Emitter anchors
                ctx.fillStyle = '#7e22ce';
                ctx.beginPath(); ctx.arc(a.x, a.y, 6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();

                if (state.active) {
                    // Firing: bright pulsing core beam + wide glow
                    ctx.strokeStyle = `rgba(244, 114, 182, ${0.25 + Math.sin(now / 60) * 0.1})`;
                    ctx.lineWidth = (haz.thickness || 14) * 2;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

                    ctx.strokeStyle = '#fdf4ff';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                } else if (state.charging) {
                    // Telegraph: fast-flashing thin line before the beam fires
                    const flash = Math.sin(now / 40) > 0;
                    ctx.strokeStyle = flash ? 'rgba(244, 114, 182, 0.8)' : 'rgba(244, 114, 182, 0.15)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 6]);
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    // Idle: faint dashed guide line
                    ctx.strokeStyle = 'rgba(126, 34, 206, 0.25)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 10]);
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    ctx.setLineDash([]);
                }
                continue;
            }
            
            if (haz.type === 'crusher') {
                const timeMs = this.physics.hazardTime || 0;
                const phaseOff = haz.phase || 0;
                const period = haz.period || 3000;
                const t = (Math.sin(((timeMs + phaseOff) / period) * Math.PI * 2) + 1) / 2;
                const cx = haz.x + (haz.travelX || 0) * t;
                const cy = haz.y + (haz.travelY || 0) * t;
                
                ctx.save();
                ctx.translate(cx, cy);
                
                // Draw metallic block
                ctx.fillStyle = '#4b5563';
                ctx.fillRect(0, 0, haz.w, haz.h);
                
                // Draw hazard stripes
                ctx.fillStyle = '#ef4444';
                const stripeWidth = 20;
                ctx.beginPath();
                ctx.rect(0, 0, haz.w, haz.h);
                ctx.clip();
                
                for(let x = -haz.h; x < haz.w + haz.h; x += stripeWidth * 2) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + stripeWidth, 0);
                    ctx.lineTo(x - haz.h + stripeWidth, haz.h);
                    ctx.lineTo(x - haz.h, haz.h);
                    ctx.fill();
                }
                
                // Draw outline
                ctx.strokeStyle = '#f87171';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, haz.w, haz.h);
                
                ctx.restore();
                
                // Draw travel path indicator (faint line)
                ctx.save();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.beginPath();
                ctx.moveTo(haz.x + haz.w/2, haz.y + haz.h/2);
                ctx.lineTo(haz.x + haz.w/2 + (haz.travelX||0), haz.y + haz.h/2 + (haz.travelY||0));
                ctx.stroke();
                ctx.restore();
                
                continue;
            }

            const pts = haz.pts;
            if (!pts || pts.length < 3) continue;
            const c = this.physics.polygonCentroid(pts);
            // Average vertex-to-centroid distance stands in for the old "radius",
            // sizing the pulsing core/spikes to roughly match the polygon's extent.
            const r = pts.reduce((s, p) => s + Math.hypot(p.x - c.x, p.y - c.y), 0) / pts.length;

            // Hazard zone outline — the actual polygon boundary used for the physics check
            ctx.beginPath();
            pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + Math.sin(now / 200) * 0.05})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(now / 100) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner pulsing core at the centroid
            ctx.beginPath();
            ctx.arc(c.x, c.y, r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#fca5a5';
            ctx.fill();

            // Rotating spikes around the centroid
            ctx.translate(c.x, c.y);
            ctx.rotate(now / 800);
            ctx.fillStyle = '#ef4444';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(-4, -r * 0.2);
                ctx.lineTo(4, -r * 0.2);
                ctx.lineTo(0, -r - 5);
                ctx.closePath();
                ctx.fill();
                ctx.rotate(Math.PI / 2);
            }
            ctx.rotate(-now / 800);
            ctx.translate(-c.x, -c.y);
        }
        ctx.restore();
    }

    drawGroundParallax() {
        const ctx = this.ctx;
        if (!this.physics.terrainPolygons || this.physics.terrainPolygons.length === 0) return;
        const lv = levels[this.currentLevelIndex] || {};
        const pal = lv.palette || { terrainFill: '#0b0f19' };

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        const [tr, tg, tb] = hexToRgb(pal.terrainFill);

        const layers = [
            { shift: 60, alpha: 0.55, darken: 0.45 },
            { shift: 28, alpha: 0.40, darken: 0.65 },
        ];
        for (const layer of layers) {
            ctx.fillStyle = `rgba(${Math.floor(tr * layer.darken)},${Math.floor(tg * layer.darken)},${Math.floor(tb * layer.darken)},${layer.alpha})`;
            for (const poly of this.physics.terrainPolygons) {
                if (!poly || poly.length < 3) continue;

                let area = 0;
                for (let i = 0; i < poly.length; i++) {
                    const p1 = poly[i];
                    const p2 = poly[(i + 1) % poly.length];
                    area += (p2.x - p1.x) * (p2.y + p1.y);
                }
                const isCeiling = area > 0;
                const dir = isCeiling ? -1 : 1;

                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y + layer.shift * dir);
                for (let i = 1; i < poly.length; i++) {
                    ctx.lineTo(poly[i].x, poly[i].y + layer.shift * dir);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    drawTerrain() {
        const ctx = this.ctx;
        if (!this.physics.terrainPolygons || this.physics.terrainPolygons.length === 0) return;

        // Level colour palette (fallback to classic red if not defined)
        const lv = levels[this.currentLevelIndex] || {};
        const pal = lv.palette || {
            terrainFill: '#0b0f19', rockEdge: '#ef4444', rockGlow: 'rgba(239,68,68,',
        };

        // Determine visible X range based on camera
        const zoom = (this.camera.zoom > 0 && isFinite(this.camera.zoom)) ? this.camera.zoom : 1;
        const w = this.canvas.width;
        let startX = Math.floor((this.camera.x - (w / 2 / zoom) - 100) / 20) * 20;
        let endX = this.camera.x + (w / 2 / zoom) + 100;
        if (!isFinite(startX) || !isFinite(endX) || endX - startX > 20000) return;

        // Clamp grass/shadow drawing to actual terrain boundaries
        let minTerrainX = Infinity;
        let maxTerrainX = -Infinity;
        for (const poly of this.physics.terrainPolygons) {
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i];
                const p2 = poly[(i + 1) % poly.length];
                if (p1.x < p2.x) { // floor segment
                    if (p1.x < minTerrainX) minTerrainX = p1.x;
                    if (p2.x > maxTerrainX) maxTerrainX = p2.x;
                }
            }
        }
        startX = Math.max(minTerrainX, startX);
        endX = Math.min(maxTerrainX, endX);

        // Fill all terrain polygons
        ctx.fillStyle = pal.terrainFill;
        for (const poly of this.physics.terrainPolygons) {
            if (!poly || poly.length < 3) continue;
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i++) {
                ctx.lineTo(poly[i].x, poly[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }

        // Draw crisp edges
        ctx.strokeStyle = pal.rockEdge + (pal.rockEdge.length === 7 ? 'aa' : '');
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (const poly of this.physics.terrainPolygons) {
            if (!poly || poly.length < 3) continue;
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i++) {
                ctx.lineTo(poly[i].x, poly[i].y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        const padRanges = this.getPadRanges();
        const isOverPad = (x) => padRanges.some(p => x >= p.left - 6 && x <= p.right + 6);
        const getH = (x) => this.physics.getPolygonSurfaceY(x);
        const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        const [tr, tg, tb] = hexToRgb(pal.terrainFill);
        const shadowColor = `rgba(${Math.floor(tr * 0.5)},${Math.floor(tg * 0.5)},${Math.floor(tb * 0.5)},0.7)`;

        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.moveTo(startX, getH(startX) + 5);
        for (let x = startX; x <= endX; x += 8) {
            ctx.lineTo(x, getH(x) + 5);
        }
        for (let x = endX; x >= startX; x -= 8) {
            ctx.lineTo(x, getH(x));
        }
        ctx.closePath();
        ctx.fill();

        if (this.currentLevelIndex === 0) {
            // ── L1: Grass tufts — snap to world-space grid so they never shift ──
            ctx.strokeStyle = '#86efac';
            ctx.lineWidth = 1.3;
            ctx.lineCap = 'round';
            const grassStep = 10;
            const grassStart = Math.floor(startX / grassStep) * grassStep;
            for (let x = grassStart; x <= endX; x += grassStep) {
                if (isOverPad(x)) continue;
                const h0 = hash(x);
                if (h0 < 0.15) continue; // sparse — skip some spots
                const baseY = getH(x);
                const height = 3 + hash(x + 5) * 5;
                // Add procedural wind sway to the lean
                const sway = Math.sin(Date.now() * 0.002 + x * 0.02) * 2;
                const lean = (hash(x + 13) - 0.5) * 4 + sway;
                // Main blade
                ctx.beginPath();
                ctx.moveTo(x, baseY);
                ctx.lineTo(x + lean, baseY - height);
                ctx.stroke();
                // Side blade
                if (h0 > 0.5) {
                    ctx.strokeStyle = '#4ade80';
                    ctx.beginPath();
                    ctx.moveTo(x, baseY - 1);
                    ctx.lineTo(x + lean - 3, baseY - height * 0.75);
                    ctx.stroke();
                    ctx.strokeStyle = '#86efac';
                }
            }
            ctx.lineCap = 'butt';
        } else {
            // ── Other levels: rock edge noise ──────────────────────────────
            ctx.strokeStyle = pal.rockEdge + '99';
            ctx.lineWidth = 1.2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            let nStarted = false;
            for (let x = startX; x <= endX; x += 4) {
                const baseY = getH(x);
                const noise = isOverPad(x) ? 0 : (hash(x) - 0.5) * 3.5;
                if (!nStarted) { ctx.moveTo(x, baseY + noise); nStarted = true; }
                else ctx.lineTo(x, baseY + noise);
            }
            ctx.stroke();
        }

        // ── Level 6: Lake Rendering ─────────────────────────────────────────
        if (this.currentLevelIndex === 5) {
            const lakeX1 = 560, lakeX2 = 880;
            const lakeY = this.physics.levelHeight - 90; // matches terrain flat basin
            if (startX < lakeX2 && endX > lakeX1) {
                ctx.fillStyle = 'rgba(29, 78, 216, 0.55)';
                ctx.beginPath();
                ctx.moveTo(Math.max(startX, lakeX1), lakeY);
                for (let x = Math.max(startX, lakeX1); x <= Math.min(endX, lakeX2); x += 10) {
                    const wave = Math.sin(Date.now() * 0.002 + x * 0.03) * 3;
                    ctx.lineTo(x, lakeY + wave);
                }
                ctx.lineTo(Math.min(endX, lakeX2), this.physics.levelHeight);
                ctx.lineTo(Math.max(startX, lakeX1), this.physics.levelHeight);
                ctx.fill();

                ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let x = Math.max(startX, lakeX1); x <= Math.min(endX, lakeX2); x += 10) {
                    const wave = Math.sin(Date.now() * 0.002 + x * 0.03) * 3;
                    if (x === Math.max(startX, lakeX1)) ctx.moveTo(x, lakeY + wave);
                    else ctx.lineTo(x, lakeY + wave);
                }
                ctx.stroke();
            }
        }

        // Cave ceilings are now drawn as part of terrainPolygons
    }

    drawUnderground() {
        const ctx = this.ctx;
        const lv = levels[this.currentLevelIndex] || {};
        const zoom = (this.camera.zoom > 0 && isFinite(this.camera.zoom)) ? this.camera.zoom : 1;
        const w = this.canvas.width;
        const startX = Math.floor((this.camera.x - (w / 2 / zoom) - 200) / 20) * 20;
        const endX = this.camera.x + (w / 2 / zoom) + 200;
        if (!isFinite(startX) || !isFinite(endX) || endX - startX > 20000) return;
        const lh = this.physics.levelHeight;
        const t = Date.now() / 1000;

        if (this.currentLevelIndex === 3) {
            // L4 Volcanic: hidden underground data center, visible through cave gaps
            const racks = [
                { x: 320, label: 'SRV-01' }, { x: 420, label: 'DB-03' },
                { x: 520, label: 'SRV-07' }, { x: 620, label: 'CACHE' },
                { x: 720, label: 'NET-02' },
            ];
            for (const rack of racks) {
                if (rack.x < startX - 30 || rack.x > endX + 30) continue;
                const ry = this.physics.getPolygonSurfaceY(rack.x) + 60; // 60px underground
                const blink = Math.sin(t * 3.7 + rack.x * 0.1) > 0.7;
                // Server rack silhouette
                ctx.fillStyle = 'rgba(20,10,30,0.9)';
                ctx.fillRect(rack.x - 10, ry - 28, 20, 28);
                ctx.strokeStyle = 'rgba(168,85,247,0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(rack.x - 10, ry - 28, 20, 28);
                // Blinking status lights
                for (let li = 0; li < 5; li++) {
                    const lbOn = Math.sin(t * (4 + li * 1.3) + rack.x * 0.2) > 0.5;
                    ctx.fillStyle = lbOn ? `rgba(${li % 2 === 0 ? '0,255,128' : '255,60,60'},0.9)` : 'rgba(20,40,20,0.5)';
                    ctx.beginPath();
                    ctx.arc(rack.x - 7 + li * 3.5, ry - 8, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = `rgba(168,85,247,${0.3 + (blink ? 0.4 : 0)})`;
                ctx.font = '5px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(rack.label, rack.x, ry - 32);
            }
            // Connecting cables between racks
            ctx.strokeStyle = 'rgba(168,85,247,0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            for (let i = 0; i < racks.length - 1; i++) {
                const ay = this.physics.getPolygonSurfaceY(racks[i].x) + 50;
                const by = this.physics.getPolygonSurfaceY(racks[i + 1].x) + 50;
                ctx.beginPath();
                ctx.moveTo(racks[i].x, ay);
                ctx.lineTo(racks[i + 1].x, by);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        if (this.currentLevelIndex === 4) {
            // L5 Crystal cave: glowing crystal formations underground
            const hash = (x) => { let h = x * 127 + 9301; h ^= h >> 16; h *= 0x45d9f3b; return ((h & 0xffff) / 0xffff); };
            for (let cx = Math.floor(startX / 40) * 40; cx < endX; cx += 40) {
                const terrY = this.physics.getPolygonSurfaceY(cx);
                const depth = 30 + hash(cx) * 50;
                const cy = terrY + depth;
                const ch = 15 + hash(cx + 1) * 25;
                const pulse = 0.4 + Math.sin(t * 1.5 + cx * 0.05) * 0.3;
                ctx.fillStyle = `rgba(168,85,247,${pulse * 0.6})`;
                ctx.beginPath();
                ctx.moveTo(cx - 4, cy);
                ctx.lineTo(cx, cy - ch);
                ctx.lineTo(cx + 4, cy);
                ctx.closePath();
                ctx.fill();
                // Glow
                const cg = ctx.createRadialGradient(cx, cy - ch * 0.5, 0, cx, cy - ch * 0.5, ch);
                cg.addColorStop(0, `rgba(168,85,247,${pulse * 0.3})`);
                cg.addColorStop(1, 'rgba(168,85,247,0)');
                ctx.fillStyle = cg;
                ctx.beginPath();
                ctx.arc(cx, cy - ch * 0.5, ch, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawNextObjectiveArrow() {
        const ctx = this.ctx;
        const level = levels[this.currentLevelIndex];
        if (!level || this.gameState !== 'playing') return;
        const allDelivered = this.deliveredCount >= (level.targetCargo || 2);
        if (allDelivered) return;

        const cargoOnDeck = this.physics.boxes.filter(b => b.onDeck);
        const t = Date.now();
        const bounce = Math.sin(t / 400) * 8;

        const drawArrow = (wx, padY, label) => {
            const ax = wx;
            const ay = padY - 50 + bounce;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillStyle = 'rgba(255,230,0,0.95)';
            ctx.shadowColor = 'rgba(255,200,0,0.7)';
            ctx.shadowBlur = 8;
            ctx.fillText('▼', ax, ay);
            ctx.shadowBlur = 0;
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(label, ax, ay + 16);
            ctx.restore();
        };

        if (cargoOnDeck.length === 0) {
            const collection = this.physics.collectionPoint;
            if (collection) {
                drawArrow(collection.x + collection.width / 2, collection.y - 80, 'PICK UP');
            }
        } else {
            const box = cargoOnDeck[0];
            const hub = this.physics.deliveryHubs.find(h => h.type === box.type);
            if (hub) {
                drawArrow(hub.x + hub.width / 2, hub.y - 80, 'DELIVER HERE');
            }
        }
    }

    drawSourcingDepot() {
        const ctx = this.ctx;
        const start = this.physics.startDepot;
        const collection = this.physics.collectionPoint;
        const level = levels[this.currentLevelIndex];
        const allDelivered = level && this.deliveredCount >= level.targetCargo;

        // Draw landing-zone deployment circles around all pads
        const DEPLOY_R = 110;
        const lander = this.physics.lander;
        const _drawDeployCircle = (cx, padY, color) => { };

        if (start) _drawDeployCircle(start.x + start.width / 2, start.y, '#60a5fa');
        if (collection) _drawDeployCircle(collection.x + collection.width / 2, collection.y, '#34d399');
        for (const hub of this.physics.deliveryHubs) {
            _drawDeployCircle(hub.x + hub.width / 2, hub.y, hub.color || '#f59e0b');
        }

        // Draw Start Depot (HQ)
        if (start) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(start.x, start.y, start.width, start.height);

            // Warning stripes on pad surface
            ctx.save();
            ctx.beginPath();
            ctx.rect(start.x, start.y, start.width, start.height);
            ctx.clip();
            const stripeW = 14;
            ctx.fillStyle = 'rgba(100, 120, 160, 0.25)';
            for (let sx = start.x - start.height; sx < start.x + start.width + start.height; sx += stripeW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, start.y + start.height);
                ctx.lineTo(sx + start.height, start.y);
                ctx.lineTo(sx + start.height + stripeW, start.y);
                ctx.lineTo(sx + stripeW, start.y + start.height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Top accent bar — pulses green when extraction ready
            if (allDelivered) {
                const pulse = 0.6 + Math.abs(Math.sin(Date.now() * 0.005)) * 0.4;
                ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
            } else {
                ctx.fillStyle = '#94a3b8';
            }
            ctx.fillRect(start.x, start.y, start.width, 3);

            // Label
            ctx.fillStyle = allDelivered ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.5)';
            ctx.font = '600 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('HQ', start.x + start.width / 2, start.y + 11);

            // "EXTRACT HERE" beacon when all cargo delivered
            if (allDelivered) {
                const bpulse = 0.7 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.3;
                ctx.save();
                ctx.fillStyle = `rgba(16, 185, 129, ${bpulse})`;
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('▼ EXTRACT HERE ▼', start.x + start.width / 2, start.y - 28);

                // Pulsing ring
                const ringT = (Date.now() % 1800) / 1800;
                const ringR = start.width * (0.5 + ringT * 2.5);
                ctx.strokeStyle = '#10b981';
                ctx.globalAlpha = Math.max(0, (1 - ringT) * 0.6);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(start.x + start.width / 2, start.y + 2, ringR, ringR * 0.28, 0, Math.PI, 0);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Draw Collection Point — Space Warehouse with overhead crane
        if (collection) {
            const cx = collection.x, cy = collection.y;
            const cw = collection.width, ch = collection.height;
            const cpCx = cx + cw / 2;
            const now = Date.now();
            const cpulse = 0.4 + Math.abs(Math.sin(now * 0.003)) * 0.4;
            const _col = collection;

            // ── Warehouse building behind pad ─────────────────────────────
            const wbX = cx - 18, wbW = cw + 36, wbH = 80, wbY = cy - wbH;

            const bldGrad = ctx.createLinearGradient(wbX, wbY, wbX + wbW, wbY);
            bldGrad.addColorStop(0, '#0f1e2e');
            bldGrad.addColorStop(0.5, '#152434');
            bldGrad.addColorStop(1, '#0c1a28');
            ctx.fillStyle = bldGrad;
            ctx.strokeStyle = '#1e3a5f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(wbX, wbY, wbW, wbH, [4, 4, 0, 0]);
            else ctx.rect(wbX, wbY, wbW, wbH);
            ctx.fill(); ctx.stroke();

            // Corrugated panels — vertical ribs
            ctx.strokeStyle = 'rgba(30,58,94,0.8)';
            ctx.lineWidth = 1;
            for (let rx = wbX + 12; rx < wbX + wbW - 4; rx += 12) {
                ctx.beginPath();
                ctx.moveTo(rx, wbY + 4); ctx.lineTo(rx, wbY + wbH - 2);
                ctx.stroke();
            }

            // Loading dock doors
            const doorW = wbW * 0.32, doorH = wbH * 0.52;
            for (const dOff of [0.18, 0.57]) {
                const dx = wbX + wbW * dOff, dy = wbY + wbH - doorH;
                ctx.fillStyle = '#060e18';
                ctx.strokeStyle = '#1e3a5f';
                ctx.lineWidth = 1.2;
                ctx.fillRect(dx, dy, doorW, doorH);
                ctx.strokeRect(dx, dy, doorW, doorH);
                ctx.strokeStyle = `rgba(56,189,248,${cpulse * 0.6})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(dx + 2, dy + 2, doorW - 4, doorH - 4);
                ctx.fillStyle = `rgba(251,191,36,${cpulse * 0.7})`;
                ctx.fillRect(dx + 2, dy - 4, doorW - 4, 3);
            }

            // Warning strobe lights on building corners
            const strobeOn = (now % 1200) < 600;
            ctx.fillStyle = strobeOn ? 'rgba(251,191,36,0.95)' : 'rgba(80,60,10,0.6)';
            for (const bx2 of [wbX + 5, wbX + wbW - 5]) {
                ctx.beginPath(); ctx.arc(bx2, wbY + 8, 3.5, 0, Math.PI * 2); ctx.fill();
            }

            // Building label
            ctx.fillStyle = 'rgba(148,163,184,0.7)';
            ctx.font = '600 8px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CARGO TERMINAL', cpCx, wbY + 14);

            // ── Overhead crane ────────────────────────────────────────────
            const craneBaseX = cx + cw * 0.72;
            const craneTopY = wbY - 2;
            const craneArmEnd = cx - 10;
            const hatchX = wbX + wbW * 0.42;
            const hatchHalfW = 22;

            // Load-sequence progress: 0 at start of the current countdown wait,
            // 1 once it finishes and the crane completes a delivery cycle.
            const _seqActive = _col.loadSeq && _col.loadSeq.phase === 'countdown';
            const _st = _seqActive ? 1 - _col.loadSeq.countdown / _col.loadSeq.countdownMax : 0;
            const _roofOpen = _col.loadSeq ? _col.loadSeq.roofOpen : 0;
            const _hatchGap = hatchHalfW * 2 * _roofOpen;

            ctx.fillStyle = '#1e3a5f';
            if (_hatchGap > 2) {
                ctx.fillRect(wbX, wbY, hatchX - hatchHalfW - wbX, 4);
                ctx.fillRect(hatchX + hatchHalfW, wbY, (wbX + wbW) - (hatchX + hatchHalfW), 4);
                const _hg = ctx.createLinearGradient(hatchX - hatchHalfW, wbY, hatchX + hatchHalfW, wbY);
                _hg.addColorStop(0, 'rgba(56,189,248,0)');
                _hg.addColorStop(0.5, 'rgba(56,189,248,0.35)');
                _hg.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.fillStyle = _hg;
                ctx.fillRect(hatchX - hatchHalfW, wbY, _hatchGap, 10);
            } else {
                ctx.fillRect(wbX, wbY, wbW, 4);
            }
            ctx.fillStyle = '#38bdf8';
            if (_hatchGap > 2) {
                ctx.fillRect(wbX, wbY, hatchX - hatchHalfW - wbX, 2);
                ctx.fillRect(hatchX + hatchHalfW, wbY, (wbX + wbW) - (hatchX + hatchHalfW), 2);
            } else {
                ctx.fillRect(wbX, wbY, wbW, 2);
            }

            // Vertical mast + horizontal arm
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(craneBaseX, cy); ctx.lineTo(craneBaseX, craneTopY - 20);
            ctx.stroke();
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(craneBaseX, craneTopY - 20); ctx.lineTo(craneArmEnd, craneTopY - 20);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(craneBaseX - 20, craneTopY - 20);
            ctx.lineTo(craneBaseX, cy - 20);
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Trolley + cable + phantom box, driven by the load-sequence progress
            const _cableTop = craneTopY - 18;
            const _intoWarehouse = wbH * 0.38;
            const _shortLen = 18;
            const _toDeck = (cy - _cableTop) + 22;
            let _trolleyX, _cableLen, _showBox = false, _boxX = 0, _boxY = 0;
            const _lerp = (a, b, f) => a + (b - a) * Math.max(0, Math.min(1, f));

            if (_seqActive) {
                const _lx = Math.max(craneArmEnd, Math.min(craneBaseX, _col.loadSeq.lx));

                if (_st < 0.20) {
                    _trolleyX = hatchX;
                    _cableLen = _shortLen;
                } else if (_st < 0.40) {
                    _trolleyX = hatchX;
                    _cableLen = _lerp(_shortLen, _intoWarehouse, (_st - 0.20) / 0.20);
                    const _bf = (_st - 0.20) / 0.20;
                    _showBox = true;
                    _boxX = hatchX;
                    _boxY = _lerp(wbY + wbH * 0.5, wbY + 2, _bf);
                } else if (_st < 0.55) {
                    _trolleyX = hatchX;
                    _cableLen = _lerp(_intoWarehouse, _shortLen, (_st - 0.40) / 0.15);
                    _showBox = true;
                    _boxX = hatchX;
                    _boxY = _cableTop + _cableLen + 8;
                } else if (_st < 0.70) {
                    _trolleyX = _lerp(hatchX, _lx, (_st - 0.55) / 0.15);
                    _cableLen = _shortLen;
                    _showBox = true;
                    _boxX = _trolleyX;
                    _boxY = _cableTop + _cableLen + 8;
                } else if (_st < 0.85) {
                    _trolleyX = _lx;
                    _cableLen = _lerp(_shortLen, _toDeck, (_st - 0.70) / 0.15);
                    _showBox = _st < 0.75;
                    _boxX = _lx;
                    _boxY = _cableTop + _cableLen + 8;
                } else {
                    _trolleyX = _lerp(_lx, hatchX, (_st - 0.85) / 0.15);
                    _cableLen = _lerp(_shortLen, _shortLen * 0.5, (_st - 0.85) / 0.15);
                }
            } else {
                _trolleyX = craneArmEnd + (craneBaseX - craneArmEnd) * (0.3 + Math.sin(now * 0.0006) * 0.25);
                _cableLen = 30 + Math.abs(Math.sin(now * 0.0008)) * 20;
            }

            ctx.fillStyle = _seqActive ? '#38bdf8' : '#475569';
            ctx.fillRect(_trolleyX - 6, craneTopY - 26, 12, 8);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(_trolleyX - 6, craneTopY - 26, 12, 8);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(_trolleyX, _cableTop); ctx.lineTo(_trolleyX, _cableTop + _cableLen);
            ctx.stroke();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(_trolleyX, _cableTop + _cableLen + 4, 4, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();

            if (_showBox) {
                const bType = _col.loadSeq?.targetType || 'normal';
                const emoji = _col.loadSeq?.targetEmoji || '📦';
                this.drawSingleBox(_boxX, _boxY, bType, emoji);
            }

            // ── Landing pad surface ───────────────────────────────────────
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(cx, cy, cw, ch);

            ctx.save();
            ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();
            const csW = 13;
            ctx.fillStyle = 'rgba(251,191,36,0.2)';
            for (let sx = cx - ch; sx < cx + cw + ch; sx += csW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, cy + ch); ctx.lineTo(sx + ch, cy);
                ctx.lineTo(sx + ch + csW, cy); ctx.lineTo(sx + csW, cy + ch);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();

            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(cx, cy, cw, 3);

            const cGlow = ctx.createLinearGradient(cx, 0, cx + cw, 0);
            cGlow.addColorStop(0, `rgba(56,189,248,0)`);
            cGlow.addColorStop(0.5, `rgba(56,189,248,${cpulse * 0.55})`);
            cGlow.addColorStop(1, `rgba(56,189,248,0)`);
            ctx.strokeStyle = cGlow;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx, cy, cw, ch);

            ctx.fillStyle = 'rgba(56,189,248,0.9)';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CARGO', cpCx, cy + 12);

            if (_seqActive) {
                const _pp = 0.7 + Math.abs(Math.sin(now * 0.008)) * 0.3;
                ctx.fillStyle = `rgba(56,189,248,${_pp})`;
                ctx.font = '600 11px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`LOADING ${_col.loadSeq.spawned} / 3`, cpCx, wbY - 12);
            }
        }
    }

    drawDeliveryHubs() {
        const ctx = this.ctx;
        const hubs = this.physics.deliveryHubs;
        const now = Date.now();

        for (const hub of hubs) {
            const hasMatchingCargo = this.physics.boxes.some(b => b.onDeck && b.type === hub.type);
            const hcx = hub.x + hub.width / 2;

            if (hub.type === 'chute') {
                // ── Vacuum Chute Structure ────────────────────────────────
                const hw = hub.width;
                const hh = 40; // funnel depth

                // Outer Funnel Base
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.moveTo(hub.x - 20, hub.y);
                ctx.lineTo(hub.x + hw + 20, hub.y);
                ctx.lineTo(hub.x + hw, hub.y + hh);
                ctx.lineTo(hub.x, hub.y + hh);
                ctx.closePath();
                ctx.fill();

                // Hazard Stripes on Rim
                ctx.save();
                ctx.beginPath();
                ctx.rect(hub.x - 20, hub.y, hw + 40, 8);
                ctx.clip();
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(hub.x - 20, hub.y, hw + 40, 8);
                ctx.fillStyle = '#0f172a';
                for (let sx = hub.x - 30; sx < hub.x + hw + 40; sx += 20) {
                    ctx.beginPath();
                    ctx.moveTo(sx, hub.y + 8);
                    ctx.lineTo(sx + 8, hub.y);
                    ctx.lineTo(sx + 18, hub.y);
                    ctx.lineTo(sx + 10, hub.y + 8);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();

                // Inner dark hole
                ctx.fillStyle = '#020617';
                ctx.beginPath();
                ctx.moveTo(hub.x - 10, hub.y + 8);
                ctx.lineTo(hub.x + hw + 10, hub.y + 8);
                ctx.lineTo(hub.x + hw - 4, hub.y + hh - 4);
                ctx.lineTo(hub.x + 4, hub.y + hh - 4);
                ctx.closePath();
                ctx.fill();

                // Tractor Beam Cone
                const beamAlpha = 0.15 + Math.sin(now * 0.005) * 0.05;
                const bGrad = ctx.createLinearGradient(0, hub.y - 80, 0, hub.y);
                bGrad.addColorStop(0, 'transparent');
                bGrad.addColorStop(1, `rgba(16, 185, 129, ${beamAlpha})`);
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.moveTo(hub.x - 30, hub.y - 80);
                ctx.lineTo(hub.x + hw + 30, hub.y - 80);
                ctx.lineTo(hub.x + hw - 4, hub.y);
                ctx.lineTo(hub.x + 4, hub.y);
                ctx.closePath();
                ctx.fill();

                // Suction Particle Effects
                for (let i = 0; i < 6; i++) {
                    const phase = (now * 0.001 + i * 0.3) % 1.0;
                    const py = hub.y - 60 * (1 - phase);
                    const px = hcx + (Math.sin(now * 0.002 + i) * hw * 0.4 * phase);
                    ctx.fillStyle = `rgba(16, 185, 129, ${0.8 * phase})`;
                    ctx.beginPath(); ctx.arc(px, py, 2 + phase * 2, 0, Math.PI * 2); ctx.fill();
                }
                continue;
            }

            // ── Overhead crane on hub ─────────────────────────────────────
            // Crane height is now anchored off the pad directly (no warehouse
            // facade) — the pad stays a clear, readable landing surface.
            const craneTopY = hub.y - 66;
            const craneX = hcx + hub.width * 0.28;
            const craneArmLeft = hub.x - 6;

            // Pallet stack — delivered boxes visibly pile up here instead of
            // vanishing; this is the crane's actual drop-off target.
            const palletX = craneArmLeft - 16;
            const palletCount = hub.palletCount || 0;
            ctx.fillStyle = '#78350f';
            ctx.fillRect(palletX - 12, hub.y - 4, 24, 4);
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1;
            ctx.strokeRect(palletX - 12, hub.y - 4, 24, 4);
            const palletCrateS = this.physics.BOX_SIZE * 0.6;
            for (let pi = 0; pi < Math.min(palletCount, 5); pi++) {
                const row = Math.floor(pi / 2), col = pi % 2;
                const pcx = palletX - 7 + col * 14, pcy = hub.y - 4 - row * (palletCrateS + 2) - palletCrateS / 2;
                ctx.fillStyle = hub.color + '33';
                ctx.fillRect(pcx - palletCrateS / 2, pcy - palletCrateS / 2, palletCrateS, palletCrateS);
                ctx.strokeStyle = hub.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(pcx - palletCrateS / 2, pcy - palletCrateS / 2, palletCrateS, palletCrateS);
            }

            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(craneX, hub.y); ctx.lineTo(craneX, craneTopY - 16);
            ctx.stroke();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(craneX - 1, hub.y); ctx.lineTo(craneX - 1, craneTopY - 16);
            ctx.stroke();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(craneX, craneTopY - 16); ctx.lineTo(craneArmLeft, craneTopY - 16);
            ctx.stroke();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(craneX - 16, craneTopY - 16); ctx.lineTo(craneX, hub.y - 16);
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Animated trolley + cable — actually carries the delivered box
            // from its pickup spot over to the pallet stack.
            const _hubAnim = hub.craneAnim;
            const idleX = craneArmLeft + (craneX - craneArmLeft) * (0.25 + Math.sin(now * 0.0005) * 0.22);
            const restLen = 22;
            let trolleyX, cableLen, carryingBox = false;
            if (_hubAnim) {
                const t = _hubAnim.timer;
                const pickX = Math.max(craneArmLeft, Math.min(craneX, _hubAnim.lx));
                const pickLen = Math.max(restLen, _hubAnim.ly - (craneTopY - 15));
                if (t < 0.28) { // slide trolley over the pickup point
                    trolleyX = idleX + (pickX - idleX) * (t / 0.28);
                    cableLen = restLen;
                } else if (t < 0.5) { // lower cable to grab the box
                    trolleyX = pickX;
                    cableLen = restLen + (pickLen - restLen) * ((t - 0.28) / 0.22);
                } else if (t < 0.65) { // hoist it back up
                    trolleyX = pickX;
                    cableLen = pickLen + (restLen - pickLen) * ((t - 0.5) / 0.15);
                    carryingBox = true;
                } else { // swing over to the pallet and set it down
                    const r = (t - 0.65) / 0.35;
                    trolleyX = pickX + (palletX - pickX) * r;
                    cableLen = restLen;
                    carryingBox = true;
                }
            } else {
                trolleyX = idleX;
                cableLen = restLen + Math.abs(Math.sin(now * 0.0007)) * 16;
            }
            ctx.fillStyle = '#475569';
            ctx.fillRect(trolleyX - 5, craneTopY - 22, 10, 7);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(trolleyX, craneTopY - 15); ctx.lineTo(trolleyX, craneTopY - 15 + cableLen);
            ctx.stroke();
            // Hook
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(trolleyX, craneTopY - 15 + cableLen + 4, 3.5, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();

            // Draw the box while it's actually attached to the hook
            if (carryingBox) {
                this.drawSingleBox(trolleyX, craneTopY - 15 + cableLen + 4 + this.physics.BOX_SIZE / 2 + 2, _hubAnim.boxType);
            }

            // Glow column beacon — soft tapered light shaft, not a flat box
            const pulse = 0.12 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.1;
            const beaconCx = hub.x + hub.width / 2;
            const beaconGrad = ctx.createLinearGradient(0, hub.y - 200, 0, hub.y);
            beaconGrad.addColorStop(0, 'rgba(0,0,0,0)');
            beaconGrad.addColorStop(1, hub.color);
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = beaconGrad;
            ctx.beginPath();
            ctx.moveTo(beaconCx - 3, hub.y - 200);
            ctx.lineTo(beaconCx + 3, hub.y - 200);
            ctx.lineTo(beaconCx + hub.width * 0.4, hub.y);
            ctx.lineTo(beaconCx - hub.width * 0.4, hub.y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Expanding pulse ring at landing surface
            const rpT = (Date.now() % 2800) / 2800;
            const rpR = hub.width * (0.5 + rpT * 2.8);
            ctx.strokeStyle = hub.color;
            ctx.globalAlpha = Math.max(0, (1 - rpT) * 0.55);
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.ellipse(hub.x + hub.width / 2, hub.y + 2, rpR, rpR * 0.28, 0, Math.PI, 0);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Hub base — solid slab so the pad reads as flat ground, not terrain
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(hub.x - 4, hub.y, hub.width + 8, hub.height);

            // Hazard chevron stripes — same bold "safe to land here" language
            // used on the start depot / collection pad, tinted with the hub's color
            ctx.save();
            ctx.beginPath();
            ctx.rect(hub.x - 4, hub.y, hub.width + 8, hub.height);
            ctx.clip();
            const hsW = 12;
            ctx.fillStyle = hub.color + '40';
            for (let sx = hub.x - hub.height - 4; sx < hub.x + hub.width + hub.height + 4; sx += hsW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, hub.y + hub.height);
                ctx.lineTo(sx + hub.height, hub.y);
                ctx.lineTo(sx + hub.height + hsW, hub.y);
                ctx.lineTo(sx + hsW, hub.y + hub.height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Bright flat top surface — the actual contact line a pilot reads as "clear to land"
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(hub.x - 4, hub.y); ctx.lineTo(hub.x + hub.width + 4, hub.y);
            ctx.stroke();

            if (hasMatchingCargo) {
                const bpulse = 0.5 + Math.abs(Math.sin(Date.now() * 0.006)) * 0.5;
                ctx.strokeStyle = hub.color;
                ctx.globalAlpha = bpulse;
                ctx.lineWidth = 2;
                ctx.strokeRect(hub.x, hub.y, hub.width, hub.height);
                ctx.globalAlpha = 1.0;
            }

            // Glowing boundary line
            ctx.fillStyle = hub.color;
            ctx.fillRect(hub.x, hub.y, hub.width, 3);

            // Hub name label (inside pad)
            ctx.fillStyle = '#f8fafc';
            ctx.font = '600 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(hub.name.toUpperCase(), hub.x + hub.width / 2, hub.y + 11);

            // Hub type label (below pad)
            ctx.fillStyle = hub.color;
            ctx.font = '500 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(hub.type ? hub.type.toUpperCase() : '', hub.x + hub.width / 2, hub.y + hub.height + 11);
        }
    }

    drawBoxes() {
        for (const box of this.physics.boxes) {
            this.drawSingleBox(box.x, box.y, box.type, box.emoji, box);
        }
    }

    drawSingleBox(x, y, type, emoji, box) {
        const ctx = this.ctx;
        const S = this.physics.BOX_SIZE;
        const halfS = S / 2;

        // Only colour-code when the level has multiple cargo types
        const allowedTypes = this.physics.currentLevelConfig?.allowedTypes;
        const multiType = allowedTypes && allowedTypes.length > 1;

        let fillColor = '#334155';
        let borderColor = '#64748b';
        if (multiType) {
            if (type === 'normal') { fillColor = '#0369a1'; borderColor = '#38bdf8'; }
            else if (type === 'red') { fillColor = '#991b1b'; borderColor = '#f87171'; }
            else if (type === 'blue') { fillColor = '#1e3a8a'; borderColor = '#60a5fa'; }
            else if (type === 'green') { fillColor = '#14532d'; borderColor = '#4ade80'; }
        }

        const iconText = emoji || (type === 'red' ? '⚠️' : type === 'blue' ? '❄️' : type === 'green' ? '♻️' : '📦');

        ctx.save();
        ctx.translate(x, y);

        const grad = ctx.createLinearGradient(0, -halfS, 0, halfS);
        grad.addColorStop(0, fillColor);
        grad.addColorStop(1, fillColor);
        ctx.fillStyle = grad;
        ctx.fillRect(-halfS, -halfS, S, S);

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-halfS, -halfS, S, 4);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-halfS + 0.75, -halfS + 0.75, S - 1.5, S - 1.5);

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.font = `${Math.round(S * 0.75)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(iconText, 0, 1.5);
        ctx.shadowBlur = 0;

        ctx.restore();

        // Fire overlay when burning
        if (box && (box.fireTimer || 0) > 30) {
            this._drawBoxFire(ctx, x, y, halfS, Math.min(1, (box.fireTimer - 30) / 90));
        }
    }

    _drawBoxFire(ctx, x, y, halfS, intensity) {
        const now = Date.now();
        ctx.save();
        ctx.translate(x, y - halfS);
        for (let f = 0; f < 4; f++) {
            const fx = (f / 3 - 0.5) * halfS * 1.4 + Math.sin(now * 0.009 + f * 1.7) * halfS * 0.4;
            const fh = halfS * 2.2 * intensity * (0.6 + Math.sin(now * 0.012 + f * 2.3) * 0.4);
            const fg = ctx.createLinearGradient(fx, 0, fx, -fh);
            fg.addColorStop(0, `rgba(239,68,68,${intensity * 0.95})`);
            fg.addColorStop(0.4, `rgba(251,146,60,${intensity * 0.75})`);
            fg.addColorStop(1, 'rgba(253,224,71,0)');
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.moveTo(fx - halfS * 0.45, 0);
            ctx.quadraticCurveTo(fx - halfS * 0.1, -fh * 0.5, fx, -fh);
            ctx.quadraticCurveTo(fx + halfS * 0.1, -fh * 0.5, fx + halfS * 0.45, 0);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }

    drawLander() {
        const ctx = this.ctx;

        const lander = this.physics.lander;
        if (!lander) return;

        if (lander.vehicleType === 'drone' || lander.grabbedBoxId) {
            if (lander.ropeLength > 0) {
                const rx0 = lander.x;
                const ry0 = lander.y + (lander.vehicleType === 'drone' ? 10 : lander.height / 2);
                let rx1, ry1;
                if (lander.grabbedBoxId) {
                    const grabbedBox = this.physics.boxes.find(b => b.id === lander.grabbedBoxId);
                    rx1 = grabbedBox ? grabbedBox.x : (lander.grappleX ?? lander.x);
                    ry1 = grabbedBox ? grabbedBox.y : (lander.grappleY ?? lander.y + lander.ropeLength);
                } else {
                    rx1 = lander.grappleX ?? lander.x;
                    ry1 = lander.grappleY ?? lander.y + lander.ropeLength;
                }

                // Build chain link positions along a catenary curve
                const numLinks = Math.max(4, Math.floor(lander.ropeLength / 14));
                const sag = Math.min(lander.ropeLength * 0.18, 30);
                const links = [];
                for (let i = 0; i <= numLinks; i++) {
                    const t = i / numLinks;
                    const parabola = 4 * sag * t * (1 - t);
                    const x = rx0 + (rx1 - rx0) * t;
                    const y = ry0 + (ry1 - ry0) * t + parabola;
                    links.push({ x, y });
                }

                // Draw chain links
                const linkColor = lander.grabbedBoxId ? '#f97316' : '#94a3b8';
                const linkColorDark = lander.grabbedBoxId ? '#c2410c' : '#475569';
                for (let i = 0; i < links.length - 1; i++) {
                    const a = links[i], b = links[i + 1];
                    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = -dy / len * 2.5, ny = dx / len * 2.5; // normal offset

                    // Oval link shape (two half-arcs)
                    ctx.strokeStyle = linkColorDark;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.ellipse(mx, my, len / 2 + 1, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.strokeStyle = linkColor;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.ellipse(mx, my, len / 2, 2, Math.atan2(dy, dx), 0, Math.PI * 2);
                    ctx.stroke();

                    // Highlight on top half of each link
                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.ellipse(mx - nx * 0.5, my - ny * 0.5, len / 2, 1.2, Math.atan2(dy, dx), Math.PI, Math.PI * 2);
                    ctx.stroke();
                }

                // Hook/magnet end
                const tip = links[links.length - 1];
                const hooked = !!lander.grabbedBoxId;
                const hGlow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, hooked ? 12 : 7);
                hGlow.addColorStop(0, hooked ? 'rgba(249,115,22,0.85)' : 'rgba(148,163,184,0.65)');
                hGlow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = hGlow;
                ctx.beginPath();
                ctx.arc(tip.x, tip.y, hooked ? 12 : 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = hooked ? '#f97316' : '#cbd5e1';
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Attachment point at drone body
                ctx.fillStyle = 'rgba(100,116,139,0.9)';
                ctx.beginPath();
                ctx.arc(rx0, ry0, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.translate(lander.x, lander.y);
        ctx.rotate(lander.angle);

        // ── Landing legs drawn BEFORE bounce so they stay at ground level ──
        // Only show spring compression while grounded — never during flight/takeoff
        const lc0 = lander.landed ? (lander.legCompress || 0) : 0;
        if (lander.vehicleType !== 'drone') {
            const hw0 = (lander.deckWidth || 66) / 2;
            // Foot stays at hh=14 (terrain level when landed). Spread pulls in as compressed.
            // When legs are deployed (near pad), extend them slightly wider/lower for visual readiness
            const legDeploy = (!lander.landed && lander.legsDeployed) ? 1 : 0;
            const footY0 = lander.landed ? 14 : (14 + legDeploy * 4);
            const legSpread0 = hw0 + 12 + legDeploy * 5;

            // Draw gold-plated struts with black outlines (matching the sprite style)
            // Left Leg:
            // Main strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-hw0 + 2, 10);
            ctx.lineTo(-legSpread0, footY0);
            ctx.stroke();

            // Main strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-hw0 + 2, 10);
            ctx.lineTo(-legSpread0, footY0);
            ctx.stroke();

            // Secondary strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-hw0 + 4, 4);
            ctx.lineTo(-legSpread0, footY0 - 1);
            ctx.stroke();

            // Secondary strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-hw0 + 4, 4);
            ctx.lineTo(-legSpread0, footY0 - 1);
            ctx.stroke();

            // Left foot dish (dark grey circle/oval with black outline)
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(-legSpread0, footY0, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Right Leg:
            // Main strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(hw0 - 2, 10);
            ctx.lineTo(legSpread0, footY0);
            ctx.stroke();

            // Main strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(hw0 - 2, 10);
            ctx.lineTo(legSpread0, footY0);
            ctx.stroke();

            // Secondary strut black outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(hw0 - 4, 4);
            ctx.lineTo(legSpread0, footY0 - 1);
            ctx.stroke();

            // Secondary strut gold inner
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(hw0 - 4, 4);
            ctx.lineTo(legSpread0, footY0 - 1);
            ctx.stroke();

            // Right foot dish (dark grey circle/oval with black outline)
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(legSpread0, footY0, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.lineCap = 'butt';

            // Navigation/Blinking lights centered on the feet
            const navPulse0 = 0.6 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.4;
            // Left light (red port light)
            ctx.fillStyle = `rgba(239,68,68,${navPulse0})`;
            ctx.beginPath(); ctx.arc(-legSpread0, footY0 - 2, 1.8, 0, Math.PI * 2); ctx.fill();
            // Right light (green starboard light)
            ctx.fillStyle = `rgba(16,185,129,${navPulse0})`;
            ctx.beginPath(); ctx.arc(legSpread0, footY0 - 2, 1.8, 0, Math.PI * 2); ctx.fill();
        }

        // Body movement on landing — legs stay planted, ship body compresses down
        const bounceY = (lander.vehicleType !== 'drone' && lander.landed) ? (lander.legCompress || 0) * 5 : 0;
        ctx.translate(0, bounceY);

        const maxIntegrity = lander.maxIntegrity || 100;
        const healthPct = Math.max(0, Math.min(1, (lander.integrity ?? maxIntegrity) / maxIntegrity));
        const damaged = healthPct < 0.85;
        const heavy = healthPct < 0.4;
        const critical = healthPct < 0.2;

        const w = lander.width;
        const h = lander.height;

        if (lander.vehicleType === 'drone') {
            const spin = Date.now() / 16;
            const thrust = lander.thrusting && lander.fuel > 0;

            // Rotor wash glow (4 corners)
            if (thrust) {
                for (const [px, py] of [[-21, -10], [21, -10], [-21, 10], [21, 10]]) {
                    const wg = ctx.createRadialGradient(px, py + 5, 0, px, py + 5, 11);
                    wg.addColorStop(0, 'rgba(120,200,255,0.22)');
                    wg.addColorStop(1, 'rgba(120,200,255,0)');
                    ctx.fillStyle = wg;
                    ctx.beginPath(); ctx.arc(px, py + 5, 11, 0, Math.PI * 2); ctx.fill();
                }
            }

            let sprite = (this.useSprites && this.sprites) ? this.sprites.landerDrone : null;
            if (sprite) {
                // Draw drone sprite body
                ctx.drawImage(sprite, -26.5, -15.5, 53, 31);

                // Draw spinning blades on top of the sprite's motor pods
                for (let i = 0; i < 4; i++) {
                    const [px, py] = [[-21, -10], [21, -10], [21, 10], [-21, 10]][i];
                    const a = spin + (i % 2 === 0 ? 0 : Math.PI / 2);
                    ctx.strokeStyle = thrust ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = 'round';
                    for (let b = 0; b < 2; b++) {
                        const ba = a + b * Math.PI;
                        ctx.beginPath();
                        ctx.moveTo(px + Math.cos(ba) * 9, py + Math.sin(ba) * 2.5);
                        ctx.lineTo(px + Math.cos(ba + Math.PI) * 9, py + Math.sin(ba + Math.PI) * 2.5);
                        ctx.stroke();
                    }
                    ctx.lineCap = 'butt';
                }
            } else {
                // X-frame arms
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
                    ctx.beginPath();
                    ctx.moveTo(dx * 4, dy * 4);
                    ctx.lineTo(dx * 19, dy * 9);
                    ctx.stroke();
                }
                ctx.lineCap = 'butt';

                // Central hex body
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = critical ? '#ef4444' : heavy ? '#f59e0b' : '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
                    i === 0 ? ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9)
                        : ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();

                // Sensor eye
                ctx.fillStyle = critical ? '#ef4444' : '#38bdf8';
                ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath(); ctx.arc(-1, -1, 1.2, 0, Math.PI * 2); ctx.fill();

                // Motor pods + spinning blades
                for (let i = 0; i < 4; i++) {
                    const [px, py] = [[-21, -10], [21, -10], [21, 10], [-21, 10]][i];
                    // Pod housing
                    ctx.fillStyle = '#253548';
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2);
                    ctx.fill(); ctx.stroke();
                    // Counter-rotating pairs (0,2 vs 1,3)
                    const a = spin + (i % 2 === 0 ? 0 : Math.PI / 2);
                    ctx.strokeStyle = thrust ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1.5;
                    ctx.lineCap = 'round';
                    for (let b = 0; b < 2; b++) {
                        const ba = a + b * Math.PI;
                        ctx.beginPath();
                        ctx.moveTo(px + Math.cos(ba) * 9, py + Math.sin(ba) * 2.5);
                        ctx.lineTo(px + Math.cos(ba + Math.PI) * 9, py + Math.sin(ba + Math.PI) * 2.5);
                        ctx.stroke();
                    }
                    ctx.lineCap = 'butt';
                }
            }

            // Nav lights (red left, green right)
            ctx.fillStyle = (Date.now() % 1400 < 700) ? '#ef4444' : 'rgba(80,20,20,0.5)';
            ctx.beginPath(); ctx.arc(-21, -10, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = (Date.now() % 1400 < 700) ? '#22c55e' : 'rgba(10,50,20,0.5)';
            ctx.beginPath(); ctx.arc(21, -10, 2, 0, Math.PI * 2); ctx.fill();

            // Landing legs
            const dlc = lander.landed ? (lander.legCompress || 0) : 0;
            for (const side of [-1, 1]) {
                const lx = side * 17;
                const ly = 13 - dlc * 4;
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(lx, 7); ctx.lineTo(lx, ly); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(lx - side * 3, 5); ctx.lineTo(lx + side * 5, ly); ctx.stroke();
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(lx - side * 6, ly); ctx.lineTo(lx + side * 6, ly); ctx.stroke();
                ctx.lineCap = 'butt';
            }

        } else {
            // ─── SPACE TRUCK DESIGN ───────────────────────────────────────
            const deckY = -lander.deckOffset;
            const hw = lander.deckWidth / 2;
            const bh = lander.basketHeight;

            // ── Main thruster flame (bottom) ──────────────────────────────
            if (lander.thrusting && lander.fuel > 0) {
                const ep = lander.enginePower || 1;
                const fl = (18 + Math.random() * 26) * ep;
                const fGrad = ctx.createLinearGradient(0, 16, 0, 16 + fl);

                // Color shifts bluer at high power (boost upgrade)
                if (ep > 1.2) {
                    fGrad.addColorStop(0, 'rgba(125, 211, 252, 0.98)'); // Light blue core
                    fGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.75)'); // Mid blue
                } else {
                    fGrad.addColorStop(0, 'rgba(251, 191, 36, 0.98)'); // Yellow core
                    fGrad.addColorStop(0.35, 'rgba(239, 100, 20, 0.75)'); // Orange
                }
                fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Red tail fading out

                ctx.fillStyle = fGrad;
                const fw = (3.5 + Math.random() * 2.5) * Math.max(0.4, ep);
                // Left nozzle flame
                ctx.beginPath();
                ctx.moveTo(-9 - fw, 16);
                ctx.bezierCurveTo(-9 - fw * 0.3, 16 + fl * 0.5, (Math.random() - 0.5) * 4 - 9, 16 + fl * 0.88, -9, 16 + fl);
                ctx.bezierCurveTo((Math.random() - 0.5) * 4 - 9, 16 + fl * 0.88, -9 + fw * 0.3, 16 + fl * 0.5, -9 + fw, 16);
                ctx.closePath();
                ctx.fill();
                // Right nozzle flame
                ctx.beginPath();
                ctx.moveTo(9 - fw, 16);
                ctx.bezierCurveTo(9 - fw * 0.3, 16 + fl * 0.5, (Math.random() - 0.5) * 4 + 9, 16 + fl * 0.88, 9, 16 + fl);
                ctx.bezierCurveTo((Math.random() - 0.5) * 4 + 9, 16 + fl * 0.88, 9 + fw * 0.3, 16 + fl * 0.5, 9 + fw, 16);
                ctx.closePath();
                ctx.fill();
                // Shared bloom
                const bloomBaseColor = ep > 1.2 ? 'rgba(56, 189, 248, ' : 'rgba(251, 191, 36, ';
                const bGrad = ctx.createRadialGradient(0, 20, 0, 0, 24, 26 * ep);
                bGrad.addColorStop(0, `${bloomBaseColor}${0.3 * ep})`);
                bGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.ellipse(0, 22, 20 * ep, 26 * ep, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Side thruster flames ───────────────────────────────────────
            const strafe = lander.strafePower || 0;
            if (Math.abs(strafe) > 0.08) {
                const sl = 10 + Math.abs(strafe) * 22 + Math.random() * 8;
                const flameX = strafe < 0 ? hw + 2 : -hw - 2;
                const flameDir = strafe < 0 ? 1 : -1;
                const sGrad = ctx.createLinearGradient(flameX, 0, flameX + flameDir * sl, 0);
                sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.92)');
                sGrad.addColorStop(0.45, 'rgba(99, 102, 241, 0.65)');
                sGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
                ctx.fillStyle = sGrad;
                const fw2 = 3.5 + Math.random() * 2.5;
                ctx.beginPath();
                ctx.moveTo(flameX, -fw2);
                ctx.bezierCurveTo(
                    flameX + flameDir * sl * 0.45, -fw2 * 0.3,
                    flameX + flameDir * sl * 0.82 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3,
                    flameX + flameDir * sl, 0
                );
                ctx.bezierCurveTo(
                    flameX + flameDir * sl * 0.82 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3,
                    flameX + flameDir * sl * 0.45, fw2 * 0.3,
                    flameX, fw2
                );
                ctx.closePath();
                ctx.fill();
                // Heat glow
                const sbGrad = ctx.createRadialGradient(flameX, 0, 0, flameX, 0, sl * 0.5);
                sbGrad.addColorStop(0, 'rgba(56,189,248,0.25)');
                sbGrad.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.fillStyle = sbGrad;
                ctx.beginPath();
                ctx.arc(flameX, 0, sl * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            let sprite = (this.useSprites && this.sprites) ? this.sprites.landerBasic : null;
            if (sprite) {
                // Draw space truck sprite body
                ctx.drawImage(sprite, -28, -19, 56, 35);
            } else {
                const firing = lander.thrusting && lander.fuel > 0;

                // Check if we are currently holding a box
                const holdingBox = this.physics.boxes.some(b => b.onDeck);
                const clampColor = holdingBox ? '#10b981' : '#38bdf8';
                const clampGlow = holdingBox ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.1)';

                // ── Magnetic Base Plate ─────────────────────────────────────────
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(-hw, deckY - 3, hw * 2, 4, 2);
                ctx.fill();
                ctx.stroke();

                // ── Magnetic Glow Field ─────────────────────────────────────────
                if (holdingBox || (Date.now() % 2000 < 1000)) { // Pulse when empty
                    const mGrad = ctx.createLinearGradient(0, deckY, 0, deckY - bh);
                    mGrad.addColorStop(0, clampGlow);
                    mGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = mGrad;
                    ctx.fillRect(-hw + 2, deckY - bh, hw * 2 - 4, bh);
                }

                // ── Locking Clamps (Left & Right) ───────────────────────────────
                const clampOffset = holdingBox ? 4 : 10; // Wide cage so the box can physically rattle around inside!

                // Left Clamp
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = clampColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-hw - 2, deckY);
                ctx.lineTo(-hw - 2, deckY - bh * 0.7);
                ctx.lineTo(-hw + clampOffset, deckY - bh * 0.7);
                ctx.lineTo(-hw + clampOffset, deckY - bh * 0.5);
                ctx.lineTo(-hw, deckY - bh * 0.5);
                ctx.lineTo(-hw, deckY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Right Clamp
                ctx.beginPath();
                ctx.moveTo(hw + 2, deckY);
                ctx.lineTo(hw + 2, deckY - bh * 0.7);
                ctx.lineTo(hw - clampOffset, deckY - bh * 0.7);
                ctx.lineTo(hw - clampOffset, deckY - bh * 0.5);
                ctx.lineTo(hw, deckY - bh * 0.5);
                ctx.lineTo(hw, deckY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Clamp Status Lights
                ctx.fillStyle = clampColor;
                ctx.beginPath(); ctx.arc(-hw - 1, deckY - bh * 0.6, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(hw + 1, deckY - bh * 0.6, 1.5, 0, Math.PI * 2); ctx.fill();

                // ── Main body ─────────────────────────────────────────────────
                const bodyW = hw - 6;
                const bodyGrad = ctx.createLinearGradient(0, -4, 0, 14);
                bodyGrad.addColorStop(0, '#1e293b');
                bodyGrad.addColorStop(1, '#0f172a');

                ctx.fillStyle = bodyGrad;
                ctx.strokeStyle = critical ? '#ef4444' : heavy ? '#f59e0b' : '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(-bodyW, -4, bodyW * 2, 18, 4);
                ctx.fill();
                ctx.stroke();

                // Detailed paneling
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-bodyW + 4, 5); ctx.lineTo(bodyW - 4, 5);
                ctx.moveTo(-bodyW + 4, 9); ctx.lineTo(bodyW - 4, 9);
                ctx.stroke();

                // ── Cockpit dome ──────────────────────────────────────────────
                const cabW = bodyW * 0.75;
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = critical ? '#ef4444' : heavy ? '#f59e0b' : '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-cabW, -4);
                ctx.lineTo(-cabW * 0.7, -13);
                ctx.lineTo(cabW * 0.7, -13);
                ctx.lineTo(cabW, -4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Window 
                const winGrad = ctx.createLinearGradient(0, -18, 0, -4);
                winGrad.addColorStop(0, '#0ea5e9');
                winGrad.addColorStop(1, '#0369a1');
                ctx.fillStyle = winGrad;
                ctx.beginPath();
                ctx.moveTo(-cabW * 0.5, -6);
                ctx.lineTo(-cabW * 0.45, -10);
                ctx.lineTo(cabW * 0.45, -10);
                ctx.lineTo(cabW * 0.5, -6);
                ctx.closePath();
                ctx.fill();

                // Window glint
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.moveTo(-cabW * 0.4, -7);
                ctx.lineTo(-cabW * 0.35, -9);
                ctx.lineTo(-cabW * 0.1, -9);
                ctx.lineTo(-cabW * 0.15, -7);
                ctx.closePath();
                ctx.fill();

                // ── Nozzles ──────────────────────────────────────────────────
                for (const nx of [-9, 9]) {
                    ctx.fillStyle = '#0f172a';
                    ctx.strokeStyle = firing ? 'rgba(251,191,36,0.9)' : '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(nx - 4, 12); ctx.lineTo(nx + 4, 12);
                    ctx.lineTo(nx + 5, 17); ctx.lineTo(nx - 5, 17);
                    ctx.closePath();
                    ctx.fill(); ctx.stroke();
                }

                // ── Side RCS ports ────────────────────────────────────────────
                for (const side of [-1, 1]) {
                    ctx.fillStyle = '#0f172a';
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.rect(side * (hw - 1), 0, side * 5, 6);
                    ctx.fill(); ctx.stroke();
                }
            }
        }

        // === Hull Damage Visual Overlays ===
        if (damaged) {
            const dmg = 1 - healthPct;
            const hw2 = (lander.vehicleType === 'drone') ? 22 : (lander.deckWidth / 2 || 33);
            const hh2 = (lander.vehicleType === 'drone') ? 8 : 14;

            // Brown/rust tint overlay
            ctx.fillStyle = `rgba(120,50,10,${dmg * 0.35})`;
            ctx.beginPath();
            if (lander.vehicleType === 'drone') {
                ctx.ellipse(0, 0, hw2, hh2, 0, 0, Math.PI * 2);
            } else {
                ctx.rect(-hw2, -hh2, hw2 * 2, hh2 * 2);
            }
            ctx.fill();

            // Crack lines (deterministic, based on damage level)
            if (dmg > 0.2) {
                ctx.strokeStyle = `rgba(60,20,0,${Math.min(1, dmg * 1.2)})`;
                ctx.lineWidth = 0.8;
                const cracks = [
                    [[-hw2 * 0.3, -hh2 * 0.5], [-hw2 * 0.1, hh2 * 0.2], [hw2 * 0.2, hh2 * 0.6]],
                    [[hw2 * 0.4, -hh2 * 0.3], [hw2 * 0.1, 0], [hw2 * 0.5, hh2 * 0.5]],
                    [[-hw2 * 0.6, hh2 * 0.1], [-hw2 * 0.2, hh2 * 0.4]],
                ];
                for (const crack of cracks) {
                    ctx.beginPath();
                    ctx.moveTo(crack[0][0], crack[0][1]);
                    for (let ci = 1; ci < crack.length; ci++) ctx.lineTo(crack[ci][0], crack[ci][1]);
                    ctx.stroke();
                }
            }

            // Smoke wisps at heavy damage
            if (heavy) {
                const smokeT = Date.now() / 800;
                for (let si = 0; si < 3; si++) {
                    const sx = (si - 1) * hw2 * 0.4;
                    const sy = -hh2 - 4 - ((smokeT * 12 + si * 7) % 18);
                    const sa = Math.max(0, 0.5 - ((smokeT * 12 + si * 7) % 18) / 36) * dmg;
                    ctx.fillStyle = `rgba(80,60,40,${sa})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 4 + si * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Critical: blinking red warning light
            if (critical) {
                const warningBlink = Math.sin(Date.now() * 0.012) > 0;
                if (warningBlink) {
                    ctx.fillStyle = 'rgba(255,50,50,0.9)';
                    const wlx = lander.vehicleType === 'drone' ? 0 : -hw2 * 0.6;
                    ctx.beginPath();
                    ctx.arc(wlx, -hh2 - 6, 3, 0, Math.PI * 2);
                    ctx.fill();
                    // Warning light glow
                    const wg = ctx.createRadialGradient(wlx, -hh2 - 6, 0, wlx, -hh2 - 6, 10);
                    wg.addColorStop(0, 'rgba(255,50,50,0.5)');
                    wg.addColorStop(1, 'rgba(255,50,50,0)');
                    ctx.fillStyle = wg;
                    ctx.beginPath();
                    ctx.arc(wlx, -hh2 - 6, 10, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        // Shield Bubble
        const shieldLvl = this.career?.upgrades?.['shieldRegen'] || 0;
        if (shieldLvl > 0 && !lander.crashed && lander.integrity > 0) {
            const shieldRatio = lander.integrity / lander.maxIntegrity;
            if (shieldRatio > 0.2) {
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(lander.width, lander.height) * 0.85, 0, Math.PI * 2);
                const alpha = 0.15 + 0.1 * shieldLvl + (Math.sin(Date.now() * 0.005) * 0.05);
                ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(186, 230, 253, ${alpha + 0.2})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        if (lander.crashed) {
            // Dark charred overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(lander.width, lander.height) * 0.5 + 4, 0, Math.PI * 2);
            ctx.fill();

            // Flickering fire
            const now = Date.now();
            for (let i = -1; i <= 1; i++) {
                const fx = i * 12 + Math.sin(now * 0.01 + i) * 4;
                const fy = 5 - Math.abs(Math.cos(now * 0.02 + i)) * 15;
                ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + Math.sin(now * 0.015 + i) * 0.3})`;
                ctx.beginPath(); ctx.arc(fx, fy, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = `rgba(251, 191, 36, ${0.6 + Math.cos(now * 0.012 + i) * 0.3})`;
                ctx.beginPath(); ctx.arc(fx, fy + 4, 5, 0, Math.PI * 2); ctx.fill();
            }
        }

        ctx.restore();
    }
    drawParticles() {
        const particles = this.physics.particles;
        if (!particles.length) return;
        const ctx = this.ctx;
        // Batch by color to minimise fillStyle state changes
        const byColor = {};
        for (const p of particles) {
            (byColor[p.color] || (byColor[p.color] = [])).push(p);
        }
        for (const color in byColor) {
            ctx.fillStyle = color;
            for (const p of byColor[color]) {
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
    }

    drawNotifications() {
        const ctx = this.ctx;
        ctx.textAlign = 'center';
        
        // Use a much larger, more readable font
        const fontSize = this.canvas.width < 500 ? 16 : 22;
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;

        for (let i = 0; i < this.messages.length; i++) {
            const m = this.messages[i];
            const spacing = fontSize + 16;
            const y = m.y - (i * spacing);
            const tw = ctx.measureText(m.text).width;

            // Backdrop pill
            ctx.globalAlpha = m.life * 0.72;
            ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
            const pw = tw + 36, ph = fontSize + 12;
            const px = this.canvas.width / 2 - pw / 2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(px, y - fontSize + 2, pw, ph, 14);
            else ctx.rect(px, y - fontSize + 2, pw, ph);
            ctx.fill();

            // Text
            ctx.globalAlpha = m.life;
            ctx.fillStyle = m.color;
            ctx.fillText(m.text, this.canvas.width / 2, y);
        }
        ctx.globalAlpha = 1.0;
    }

    drawBuildings() {
        if (!this.buildings || this.buildings.length === 0) return;
        const ctx = this.ctx;

        for (const b of this.buildings) {
            ctx.save();
            ctx.translate(b.x, b.y);

            if (b.type === 'antenna') {
                // Antenna tower: tall mast with cross-arms and blinking beacon
                const mh = b.h;
                // Mast
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -mh);
                ctx.stroke();
                // Cross-arms at intervals
                for (let ay = mh * 0.3; ay < mh; ay += mh * 0.22) {
                    const aw = (mh - ay) * 0.55;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(-aw, -mh + ay);
                    ctx.lineTo(aw, -mh + ay);
                    ctx.stroke();
                    // Guy wires
                    ctx.strokeStyle = 'rgba(71,85,105,0.5)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(-aw, -mh + ay);
                    ctx.lineTo(0, 0);
                    ctx.moveTo(aw, -mh + ay);
                    ctx.lineTo(0, 0);
                    ctx.stroke();
                    ctx.strokeStyle = '#334155';
                }
                // Blinking beacon at top
                const blink = Math.sin(Date.now() * 0.004 + b.phase) > 0.2;
                if (blink) {
                    const bg = ctx.createRadialGradient(0, -mh, 0, 0, -mh, 8);
                    bg.addColorStop(0, 'rgba(239,68,68,0.9)');
                    bg.addColorStop(1, 'rgba(239,68,68,0)');
                    ctx.fillStyle = bg;
                    ctx.beginPath();
                    ctx.arc(0, -mh, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(0, -mh, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (b.type === 'silo') {
                // Industrial storage silo (cylindrical tower)
                const sw = b.w, sh = b.h;
                // Body
                const siloGrad = ctx.createLinearGradient(-sw / 2, 0, sw / 2, 0);
                siloGrad.addColorStop(0, '#1e293b');
                siloGrad.addColorStop(0.4, '#334155');
                siloGrad.addColorStop(1, '#1e293b');
                ctx.fillStyle = siloGrad;
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-sw / 2, -sh, sw, sh);
                ctx.fill();
                ctx.stroke();
                // Dome cap
                ctx.beginPath();
                ctx.ellipse(0, -sh, sw / 2, sw * 0.22, 0, Math.PI, 0);
                ctx.fillStyle = '#334155';
                ctx.fill();
                ctx.stroke();
                // Horizontal band stripes
                ctx.strokeStyle = 'rgba(56,189,248,0.2)';
                ctx.lineWidth = 1;
                for (let bh2 = sh * 0.2; bh2 < sh; bh2 += sh * 0.22) {
                    ctx.beginPath();
                    ctx.moveTo(-sw / 2, -bh2);
                    ctx.lineTo(sw / 2, -bh2);
                    ctx.stroke();
                }
                // Warning lights at corners
                const wl = Math.sin(Date.now() * 0.003 + b.phase + 1) > 0;
                if (wl) {
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(-sw / 2, -sh, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(sw / 2, -sh, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (b.type === 'refinery') {
                // Industrial refinery cluster: multiple vertical pipes + platform
                const rw = b.w;
                // Base platform
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 2;
                ctx.fillRect(-rw / 2, -8, rw, 8);
                ctx.strokeRect(-rw / 2, -8, rw, 8);
                // Three pipes of varying height
                const pipes = [
                    { ox: -rw * 0.32, pw: 8, ph: b.h * 0.9 },
                    { ox: 0, pw: 11, ph: b.h },
                    { ox: rw * 0.3, pw: 7, ph: b.h * 0.65 },
                ];
                for (const p of pipes) {
                    const pg = ctx.createLinearGradient(p.ox - p.pw / 2, 0, p.ox + p.pw / 2, 0);
                    pg.addColorStop(0, '#0f172a');
                    pg.addColorStop(0.5, '#334155');
                    pg.addColorStop(1, '#0f172a');
                    ctx.fillStyle = pg;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1;
                    ctx.fillRect(p.ox - p.pw / 2, -8 - p.ph, p.pw, p.ph);
                    ctx.strokeRect(p.ox - p.pw / 2, -8 - p.ph, p.pw, p.ph);
                    // Pipe cap
                    ctx.fillStyle = '#334155';
                    ctx.beginPath();
                    ctx.ellipse(p.ox, -8 - p.ph, p.pw / 2 + 1, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Steam vent (random flicker)
                    if (Math.sin(Date.now() * 0.005 + p.ox + b.phase) > 0.5) {
                        ctx.strokeStyle = 'rgba(148,163,184,0.35)';
                        ctx.lineWidth = p.pw * 0.6;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(p.ox, -8 - p.ph - 2);
                        ctx.lineTo(p.ox + (Math.random() - 0.5) * 6, -8 - p.ph - 14 - Math.random() * 8);
                        ctx.stroke();
                        ctx.lineCap = 'butt';
                    }
                }
                // Connecting walkway
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-rw * 0.32, -8 - b.h * 0.4);
                ctx.lineTo(rw * 0.3, -8 - b.h * 0.4);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    drawAmbientTraffic() {
        const traffic = this.physics.ambientTraffic;
        if (!traffic || traffic.length === 0) return;
        const ctx = this.ctx;

        for (const t of traffic) {
            const cx = t.x + t.w / 2;
            const cy = t.y;
            const tw = t.w, th = t.h;
            const movingLeft = t.vx < 0;

            ctx.save();
            ctx.translate(cx, cy);
            if (t.angle) ctx.rotate(t.angle);
            if (movingLeft) ctx.scale(-1, 1);

            if (t.model === 'pickup') {
                this._drawPickupTruck(ctx, t, tw, th);
            } else if (t.model === 'police') {
                this._drawPoliceCruiser(ctx, t, tw, th);
            } else {
                this._drawFreighterTruck(ctx, t, tw, th);
            }
            ctx.restore();
            
            // Draw speech bubble if active
            if (t.bubbleTimer > 0) {
                t.bubbleTimer--;
                ctx.save();
                ctx.font = 'bold 10px Outfit, sans-serif';
                ctx.textAlign = 'center';
                const padding = 6;
                const textWidth = ctx.measureText(t.bubbleText).width;
                const bw = textWidth + padding * 2;
                const bh = 18;
                const bx = cx;
                const by = cy - th / 2 - 20;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(bx - bw / 2, by - bh, bw, bh, 4);
                else ctx.rect(bx - bw / 2, by - bh, bw, bh);
                
                // Bubble tail
                ctx.moveTo(bx - 4, by);
                ctx.lineTo(bx + 4, by);
                ctx.lineTo(bx, by + 6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#0f172a';
                ctx.fillText(t.bubbleText, bx, by - bh / 2 + 3);
                ctx.restore();
            }
        }
    }

    _drawPoliceCruiser(ctx, t, tw, th) {
        // Police cruiser - sleek profile
        const h = th;
        const w = tw;

        // Main body (dark/white theme)
        ctx.fillStyle = '#0f172a'; // dark navy
        ctx.beginPath();
        ctx.moveTo(-w/2, 0);
        ctx.lineTo(-w*0.4, -h*0.3);
        ctx.lineTo(w*0.2, -h*0.3);
        ctx.lineTo(w*0.4, 0);
        ctx.lineTo(w/2, h/2);
        ctx.lineTo(-w/2, h/2);
        ctx.closePath();
        ctx.fill();

        // White door panel
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-w*0.2, 0);
        ctx.lineTo(w*0.2, 0);
        ctx.lineTo(w*0.25, h*0.4);
        ctx.lineTo(-w*0.25, h*0.4);
        ctx.closePath();
        ctx.fill();
        
        // Police text (tiny)
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('POLICE', 0, h*0.3);

        // Cockpit canopy
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)'; // glass
        ctx.beginPath();
        ctx.moveTo(-w*0.1, -h*0.3);
        ctx.lineTo(w*0.1, -h*0.3);
        ctx.lineTo(w*0.3, 0);
        ctx.lineTo(-w*0.3, 0);
        ctx.closePath();
        ctx.fill();

        // Flashing sirens!
        const time = Date.now() / 150; // fast flash
        const flashPhase = time % 2;
        const redFlash = flashPhase < 1;
        const blueFlash = !redFlash;

        // Lightbar
        ctx.fillStyle = redFlash ? '#ef4444' : '#1e3a8a';
        ctx.fillRect(-w*0.05, -h*0.4, w*0.05, h*0.1);
        ctx.fillStyle = blueFlash ? '#3b82f6' : '#7f1d1d';
        ctx.fillRect(0, -h*0.4, w*0.05, h*0.1);

        // Siren glow
        if (redFlash) {
            const glow = ctx.createRadialGradient(-w*0.025, -h*0.35, 0, -w*0.025, -h*0.35, 25);
            glow.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(-w*0.025, -h*0.35, 25, 0, Math.PI*2); ctx.fill();
        } else {
            const glow = ctx.createRadialGradient(w*0.025, -h*0.35, 0, w*0.025, -h*0.35, 25);
            glow.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(w*0.025, -h*0.35, 25, 0, Math.PI*2); ctx.fill();
        }

        // Engine thrust (rear)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-w/2 - 6, h*0.1, 6, h*0.3);
        
        const fl = 10 + Math.abs(Math.sin(t.lightPhase * 5)) * 10;
        const eg = ctx.createLinearGradient(-w/2 - 6, 0, -w/2 - 6 - fl, 0);
        eg.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.moveTo(-w/2 - 6, h*0.1);
        ctx.lineTo(-w/2 - 6 - fl, h*0.25);
        ctx.lineTo(-w/2 - 6, h*0.4);
        ctx.fill();
    }

    _drawFreighterTruck(ctx, t, tw, th) {
        // Engine glow trail
        if (t.engineGlow) {
            const eg = ctx.createRadialGradient(-tw / 2 - 10, 0, 0, -tw / 2 - 10, 0, 40);
            eg.addColorStop(0, t.accentColor + '59');
            eg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = eg;
            ctx.beginPath();
            ctx.arc(-tw / 2 - 10, 0, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hull
        const hullGrad = ctx.createLinearGradient(0, -th / 2, 0, th / 2);
        hullGrad.addColorStop(0, t.bodyColor);
        hullGrad.addColorStop(0.5, shadeColor(t.bodyColor, 20));
        hullGrad.addColorStop(1, shadeColor(t.bodyColor, -20));
        ctx.fillStyle = hullGrad;
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-tw / 2, -th / 2, tw, th, 4);
        else ctx.rect(-tw / 2, -th / 2, tw, th);
        ctx.fill();
        ctx.stroke();

        // Nose cone
        ctx.fillStyle = shadeColor(t.bodyColor, 15);
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tw / 2, -th / 2);
        ctx.lineTo(tw / 2 + th * 0.7, 0);
        ctx.lineTo(tw / 2, th / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engine pods (rear)
        for (const ey of [-th * 0.3, th * 0.3]) {
            ctx.fillStyle = shadeColor(t.bodyColor, -15);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.fillRect(-tw / 2 - 12, ey - th * 0.18, 12, th * 0.36);
            ctx.strokeRect(-tw / 2 - 12, ey - th * 0.18, 12, th * 0.36);
            const fl = 6 + Math.abs(Math.sin(t.lightPhase * 3)) * 8;
            const eg2 = ctx.createLinearGradient(-tw / 2 - 12, 0, -tw / 2 - 12 - fl, 0);
            eg2.addColorStop(0, `rgba(56,189,248,0.8)`);
            eg2.addColorStop(1, 'rgba(56,189,248,0)');
            ctx.fillStyle = eg2;
            ctx.beginPath();
            ctx.moveTo(-tw / 2 - 12, ey - th * 0.12);
            ctx.lineTo(-tw / 2 - 12 - fl, ey);
            ctx.lineTo(-tw / 2 - 12, ey + th * 0.12);
            ctx.closePath();
            ctx.fill();
        }

        // Window strip
        ctx.fillStyle = 'rgba(147,197,253,0.3)';
        ctx.strokeStyle = 'rgba(147,197,253,0.5)';
        ctx.lineWidth = 0.8;
        ctx.fillRect(-tw * 0.1, -th * 0.3, tw * 0.45, th * 0.6);
        ctx.strokeRect(-tw * 0.1, -th * 0.3, tw * 0.45, th * 0.6);

        // Running lights
        const blinkA = Math.sin(t.lightPhase) > 0;
        const blinkB = Math.sin(t.lightPhase + Math.PI) > 0;
        ctx.fillStyle = blinkA ? t.lightColor : 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(tw / 2 + th * 0.5, -th * 0.22, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = blinkB ? '#ef4444' : 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(-tw / 2 - 8, th * 0.1, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    _drawPickupTruck(ctx, t, tw, th) {
        // Space pickup — think F-150 silhouette in space:
        // front = right (nose + cab), rear = left (flat bed with optional cargo)
        const cabW = tw * 0.45;
        const bedW = tw * 0.52;
        const cabH = th * 1.05;   // cab taller than bed
        const bedH = th * 0.68;
        const cabX = tw / 2 - cabW; // cab starts here (right side)
        const bedX = -tw / 2;       // bed starts at left

        // Anti-grav pod glow (instead of wheels — two pods underneath)
        for (const px of [-tw * 0.28, tw * 0.28]) {
            const podGrad = ctx.createRadialGradient(px, th / 2 + 4, 0, px, th / 2 + 4, 10);
            podGrad.addColorStop(0, t.accentColor + 'aa');
            podGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = podGrad;
            ctx.beginPath(); ctx.ellipse(px, th / 2 + 4, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Pod ring
            ctx.strokeStyle = t.accentColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.ellipse(px, th / 2 + 2, 8, 3, 0, 0, Math.PI * 2); ctx.stroke();
        }

        // Flat bed (rear/left)
        const bedGrad = ctx.createLinearGradient(0, -bedH / 2, 0, bedH / 2);
        bedGrad.addColorStop(0, shadeColor(t.bodyColor, 10));
        bedGrad.addColorStop(1, shadeColor(t.bodyColor, -25));
        ctx.fillStyle = bedGrad;
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1;
        if (ctx.roundRect) ctx.roundRect(bedX, -bedH / 2, bedW, bedH, [2, 0, 0, 2]);
        else ctx.rect(bedX, -bedH / 2, bedW, bedH);
        ctx.fill(); ctx.stroke();

        // Bed floor ribs
        ctx.strokeStyle = 'rgba(100,116,139,0.5)';
        ctx.lineWidth = 0.8;
        for (let ri = 1; ri <= 3; ri++) {
            const rx = bedX + (bedW / 4) * ri;
            ctx.beginPath();
            ctx.moveTo(rx, -bedH / 2 + 2); ctx.lineTo(rx, bedH / 2 - 2);
            ctx.stroke();
        }

        // Bed walls (raised sides)
        ctx.fillStyle = shadeColor(t.bodyColor, 15);
        ctx.fillRect(bedX, -bedH / 2 - 3, bedW, 3);
        ctx.fillRect(bedX, bedH / 2, bedW, 3);

        // Optional cargo box on bed
        if (t.hasCargoBox) {
            const bw = bedW * 0.55, bh = bedH * 0.85;
            const bx = bedX + bedW * 0.1;
            const by = -bedH / 2 - bh;
            ctx.fillStyle = shadeColor(t.bodyColor, -10);
            ctx.strokeStyle = t.accentColor;
            ctx.lineWidth = 1;
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeRect(bx, by, bw, bh);
            // Cargo straps
            ctx.strokeStyle = 'rgba(251,191,36,0.7)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.3, by); ctx.lineTo(bx + bw * 0.3, by + bh);
            ctx.moveTo(bx + bw * 0.65, by); ctx.lineTo(bx + bw * 0.65, by + bh);
            ctx.stroke();
        }

        // Cab (front/right) — taller, with visor window
        const cabGrad = ctx.createLinearGradient(cabX, -cabH / 2, cabX + cabW, cabH / 2);
        cabGrad.addColorStop(0, shadeColor(t.bodyColor, 25));
        cabGrad.addColorStop(1, shadeColor(t.bodyColor, 5));
        ctx.fillStyle = cabGrad;
        ctx.strokeStyle = t.accentColor;
        ctx.lineWidth = 1.2;
        if (ctx.roundRect) ctx.roundRect(cabX, -cabH / 2, cabW, cabH, [2, 4, 4, 2]);
        else ctx.rect(cabX, -cabH / 2, cabW, cabH);
        ctx.fill(); ctx.stroke();

        // Windscreen
        ctx.fillStyle = 'rgba(147,197,253,0.4)';
        ctx.strokeStyle = 'rgba(147,197,253,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cabX + cabW * 0.08, -cabH * 0.42);
        ctx.lineTo(cabX + cabW * 0.18, -cabH * 0.48);
        ctx.lineTo(cabX + cabW * 0.82, -cabH * 0.48);
        ctx.lineTo(cabX + cabW * 0.88, -cabH * 0.42);
        ctx.lineTo(cabX + cabW * 0.88, cabH * 0.1);
        ctx.lineTo(cabX + cabW * 0.08, cabH * 0.1);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Headlights (front of cab)
        const blink = Math.sin(t.lightPhase) > 0;
        ctx.fillStyle = blink ? '#fde68a' : 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.arc(tw / 2, -cabH * 0.28, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tw / 2, cabH * 0.28, 3, 0, Math.PI * 2); ctx.fill();
        // Headlight glow
        if (blink) {
            const hlg = ctx.createRadialGradient(tw / 2 + 4, 0, 0, tw / 2 + 4, 0, 18);
            hlg.addColorStop(0, 'rgba(253,230,138,0.5)');
            hlg.addColorStop(1, 'rgba(253,230,138,0)');
            ctx.fillStyle = hlg;
            ctx.beginPath(); ctx.ellipse(tw / 2 + 4, 0, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
        }

        // Exhaust (rear)
        const fl = 5 + Math.abs(Math.sin(t.lightPhase * 2)) * 10;
        const exGrad = ctx.createLinearGradient(-tw / 2, 0, -tw / 2 - fl, 0);
        exGrad.addColorStop(0, 'rgba(56,189,248,0.85)');
        exGrad.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = exGrad;
        ctx.beginPath();
        ctx.moveTo(-tw / 2, -bedH * 0.25);
        ctx.lineTo(-tw / 2 - fl, 0);
        ctx.lineTo(-tw / 2, bedH * 0.25);
        ctx.closePath();
        ctx.fill();

        // Tail light
        ctx.fillStyle = 'rgba(239,68,68,0.9)';
        ctx.beginPath(); ctx.arc(-tw / 2 + 2, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    drawWindIndicator() {
        const ctx = this.ctx;
        const wind = this.physics.wind;
        if (Math.abs(wind) < 0.05) return;

        // Position at top center, just below HUD bar (top:8px + ~44px height + 8px gap)
        const cx = this.canvas.width / 2;
        const cy = 80;

        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '600 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`WIND: ${wind < 0 ? 'LEFT' : 'RIGHT'} (${Math.abs(wind * 10).toFixed(1)} m/s)`, cx, cy - 10);

        // Draw wind arrow
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        const arrowLen = Math.abs(wind) * 45;
        const dir = wind < 0 ? -1 : 1;

        ctx.moveTo(cx - (arrowLen / 2) * dir, cy);
        ctx.lineTo(cx + (arrowLen / 2) * dir, cy);
        // Arrowhead
        ctx.lineTo(cx + (arrowLen / 2 - 6) * dir, cy - 4);
        ctx.moveTo(cx + (arrowLen / 2) * dir, cy);
        ctx.lineTo(cx + (arrowLen / 2 - 6) * dir, cy + 4);

        ctx.stroke();
    }
}

// ── Utility: lighten (+) or darken (-) a hex color by amount 0-100 ──────────
function shadeColor(hex, amount) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Global game singleton — must be on window so inline HTML handlers can access it
window.game = new CargoGame();
