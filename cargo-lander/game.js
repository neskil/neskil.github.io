// CargoLander - Game Core Loop & Renderer
const levels = [
    {
        name: "L1: Local Distribution",
        missionTitle: "Local Distribution Contract",
        description: "Transport standard packages to the Delivery Pad. Fly carefully — tilt too much and cargo will slide off!",
        gravity: 0.15,
        wind: 0,
        terrainType: "flat",
        targetCargo: 2,
        budget: 1000,
        timeLimit: 180,
        allowedTypes: ["normal"],
        deliveryHubs: [
            { x: 750, color: "#38bdf8", type: "normal", name: "Hub Alpha" }
        ],
        hint: "Tip: Land slowly (< 2.0 m/s) and return to HQ to extract.",
        palette: {
            skyTop: '#04071a', skyMid: '#0a1628', skyBot: '#1a2d1a',
            terrainFill: '#0b1a0e', rockEdge: '#22c55e', rockGlow: 'rgba(34,197,94,',
            fog: 'rgba(34,197,94,0.04)',
        },
        quests: [
            { id: 'primary',       text: 'Deliver 2 cargo to Hub Alpha',   type: 'primary' },
            { id: 'no_crash',      text: 'Zero crashes',                   type: 'bonus', reward: 300 },
            { id: 'quick',         text: 'Finish with 1+ min remaining',   type: 'bonus', reward: 200, timeGoal: 60 },
        ]
    },
    {
        name: "L2: Cross-Dock Sorting",
        missionTitle: "Cross-Dock Sorting Contract",
        description: "Sort the cargo. Normal packages → Main Processing. Fragile (red) → Fragile Handling. Don't drop fragile cargo!",
        gravity: 0.15,
        wind: 0,
        terrainType: "canyon",
        targetCargo: 2,
        budget: 1200,
        timeLimit: 240,
        allowedTypes: ["normal", "red"],
        deliveryHubs: [
            { x: 500, color: "#38bdf8", type: "normal", name: "Main Processing" },
            { x: 800, color: "#ef4444", type: "red", name: "Fragile Handling" }
        ],
        hint: "Sort correctly and return to HQ to extract.",
        palette: {
            skyTop: '#04071a', skyMid: '#0d1a2e', skyBot: '#1a1a0e',
            terrainFill: '#0b0f14', rockEdge: '#f59e0b', rockGlow: 'rgba(245,158,11,',
            fog: 'rgba(245,158,11,0.04)',
        },
        quests: [
            { id: 'primary',         text: 'Sort & deliver 2 cargo',       type: 'primary' },
            { id: 'no_cargo_lost',   text: 'No cargo lost',                type: 'bonus', reward: 250 },
            { id: 'no_crash',        text: 'Zero crashes',                  type: 'bonus', reward: 300 },
        ]
    },
    {
        name: "L3: Gale-Force Winds",
        missionTitle: "High-Altitude Wind Contract",
        description: "Strong crosswinds push your lander and cargo. Compensate by thrusting into the wind.",
        gravity: 0.15,
        wind: 0.08,
        terrainType: "mountain",
        targetCargo: 2,
        budget: 1500,
        timeLimit: 200,
        allowedTypes: ["normal"],
        deliveryHubs: [
            { x: 650, color: "#38bdf8", type: "normal", name: "Peak Station" }
        ],
        hint: "Tilt into the wind. Return to HQ to extract.",
        palette: {
            skyTop: '#050818', skyMid: '#0e1530', skyBot: '#1a1228',
            terrainFill: '#0b0f19', rockEdge: '#a78bfa', rockGlow: 'rgba(167,139,250,',
            fog: 'rgba(167,139,250,0.05)',
        },
        quests: [
            { id: 'primary',    text: 'Deliver 2 cargo to Peak Station', type: 'primary' },
            { id: 'no_crash',   text: 'Zero crashes',                    type: 'bonus', reward: 400 },
            { id: 'quick',      text: 'Finish with 30+ sec remaining',   type: 'bonus', reward: 200, timeGoal: 30 },
        ]
    },
    {
        name: "L4: Gravity Anomaly",
        missionTitle: "Anomaly Zone Delivery",
        description: "A gravitational vortex is pulling you in. Counter the force and sort red/blue cargo to their correct hubs.",
        gravity: 0.15,
        wind: 0,
        terrainType: "cave",
        targetCargo: 2,
        budget: 2000,
        timeLimit: 180,
        allowedTypes: ["red", "blue"],
        deliveryHubs: [
            { x: 750, color: "#ef4444", type: "red", name: "Sector 4" },
            { x: 900, color: "#3b82f6", type: "blue", name: "Deep Storage" }
        ],
        gravityWell: { x: 500, y: 400, strength: 0.8, radius: 200, orbitRadius: 200 },
        hint: "Avoid the vortex! Return to HQ to extract.",
        palette: {
            skyTop: '#0a0510', skyMid: '#150828', skyBot: '#250c10',
            terrainFill: '#100806', rockEdge: '#ef4444', rockGlow: 'rgba(239,68,68,',
            fog: 'rgba(239,68,68,0.06)',
        },
        quests: [
            { id: 'primary',         text: 'Deliver red & blue cargo',    type: 'primary' },
            { id: 'no_cargo_lost',   text: 'No cargo sucked in',          type: 'bonus', reward: 350 },
            { id: 'no_crash',        text: 'Zero crashes',                type: 'bonus', reward: 300 },
        ]
    },
    {
        name: "L5: The Needle's Eye",
        missionTitle: "Needle's Eye Precision Drop",
        description: "The hub is at the bottom of a shaft too narrow for your drone. Hover, extend your rope (E/Q), and lower cargo in!",
        gravity: 0.10,
        wind: 0,
        terrainType: "needle",
        targetCargo: 2,
        budget: 1800,
        timeLimit: 300,
        allowedTypes: ["normal"],
        collectionX: 180,
        deliveryHubs: [
            { x: 700, width: 25, color: "#38bdf8", type: "normal", name: "The Pit" }
        ],
        hint: "E/Q to extend/retract rope. SPACE drops cargo. Return to HQ to extract.",
        palette: {
            skyTop: '#080508', skyMid: '#100a18', skyBot: '#1a0808',
            terrainFill: '#0d0508', rockEdge: '#dc2626', rockGlow: 'rgba(220,38,38,',
            fog: 'rgba(220,38,38,0.08)',
        },
        quests: [
            { id: 'primary',         text: 'Lower 2 cargo into The Pit',  type: 'primary' },
            { id: 'no_cargo_lost',   text: 'No cargo lost',               type: 'bonus', reward: 400 },
            { id: 'quick',           text: 'Finish with 2+ min remaining',type: 'bonus', reward: 200, timeGoal: 120 },
        ]
    }
];

const upgradeCatalog = [
    { id: 'thrusterEfficiency', name: 'Thruster Efficiency', desc: 'Reduces fuel consumption by 15% per level.', maxLevel: 3, basePrice: 500 },
    { id: 'boostMode', name: 'Engine Boost', desc: 'Increases main thruster power by 20% per level.', maxLevel: 3, basePrice: 800 },
    { id: 'magneticDeck', name: 'Magnetic Deck', desc: 'Automatically pulls nearby cargo into the basket.', maxLevel: 2, basePrice: 1200 },
    { id: 'winchExtender', name: 'Winch Extender', desc: 'Increases maximum drone rope length by 50m.', maxLevel: 2, basePrice: 600 },
    { id: 'hullPlating', name: 'Hull Plating', desc: 'Increases lander max integrity and impact resistance.', maxLevel: 3, basePrice: 400 }
];

class CargoGame {
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
            hullPlating: 0
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
        this.isMuted = true;

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
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
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

        // Start game loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.shaders) {
            this.shaders.resize(this.canvas.width, this.canvas.height);
        }
    }

    generateStars() {
        // Three parallax depths of stars + nebulae
        this.bgLayers = [
            { objects: [], parallax: 0.018 }, // Deep — barely moves
            { objects: [], parallax: 0.055 }, // Mid
            { objects: [], parallax: 0.13  }, // Near
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
                if (this.physics.lander && this.physics.lander.vehicleType === 'drone') {
                    this.toggleGrapple();
                } else {
                    this.triggerCargoDispense();
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

    goToMenu() {
        this.gameState = 'menu';
        document.getElementById('menu-screen').style.display = 'flex';
        document.getElementById('hud-overlay').style.display = 'none';
        
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
        if (score >= 0.90)      { rank = 'Logistics Legend'; tier = 'CLASS S'; }
        else if (score >= 0.70) { rank = 'Fleet Commander';  tier = 'CLASS A'; }
        else if (score >= 0.50) { rank = 'Senior Pilot';     tier = 'CLASS B'; }
        else if (score >= 0.30) { rank = 'Cargo Pilot';      tier = 'CLASS C'; }
        else if (score >= 0.12) { rank = 'Junior Hauler';    tier = 'CLASS D'; }
        else if (score >= 0.01) { rank = 'Cadet Hauler';     tier = 'CLASS E'; }
        else                    { rank = 'Rookie Hauler';    tier = 'CLASS F'; }

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
            hullPlating: 0
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
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
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
        this.currentLevelIndex = idx;
        this.currentVehicle = vehicleType; // Remember for Replay / Next Mission / Restart
        this.crashHandled = false;
        const level = levels[idx];
        level.vehicle = vehicleType; // Inject selected vehicle
        
        this.missionBudget = level.budget || 1000;
        this.missionTimer = level.timeLimit || 180;
        
        this.physics.initLevel(level, this.canvas.width, this.canvas.height, this.upgrades);
        this.deliveredCount = 0;
        this.deliveredTypes = {};
        this.questState = {};
        this.hadCrash = false;
        this.cargoLostCount = 0;
        this.score = 100; // Reset level efficiency
        this.messages = [];

        // Generate world buildings on terrain surface
        this.buildings = [];
        const bTypes = ['antenna', 'silo', 'refinery'];
        const bSpacing = 180 + Math.random() * 80;
        const bCount = 7 + Math.floor(Math.random() * 4);
        const padZones = [
            { x: this.physics.startDepot.x, w: this.physics.startDepot.width + 60 },
            { x: this.physics.collectionPoint.x, w: this.physics.collectionPoint.width + 60 },
        ];
        for (const hub of this.physics.deliveryHubs) {
            padZones.push({ x: hub.x - 30, w: hub.width + 60 });
        }
        let bx = 120;
        while (this.buildings.length < bCount && bx < this.physics.levelWidth - 120) {
            bx += bSpacing + (Math.random() - 0.5) * 80;
            // Skip over pad zones
            const blocked = padZones.some(z => bx > z.x - 20 && bx < z.x + z.w + 20);
            if (blocked) continue;
            const terrainY = this.physics.getTerrainHeight(bx);
            const btype = bTypes[Math.floor(Math.random() * bTypes.length)];
            this.buildings.push({
                type: btype,
                x: bx,
                y: terrainY,
                w: btype === 'silo' ? 22 + Math.random() * 16 : btype === 'refinery' ? 45 + Math.random() * 20 : 6,
                h: 60 + Math.random() * 100,
                phase: Math.random() * Math.PI * 2,
            });
        }
        
        this.gameState = 'playing';
        this.addMessage("Level Started: " + level.name, "#6366f1");
        
        // Setup Cinematic Camera Intro
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const minZoom = Math.min(cw / this.physics.levelWidth, ch / this.physics.levelHeight) * 0.95; // Slightly padded
        
        this.camera.zoom = minZoom;
        this.camera.targetZoom = minZoom;
        this.introTimer = 2.0; 
        this.camera.x = this.physics.levelWidth / 2;
        this.camera.y = this.physics.levelHeight / 2;
        
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
        if (this.currentLevelIndex + 1 < levels.length) {
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
        if (!lander || lander.vehicleType !== 'drone') return;

        if (lander.grabbedBoxId) {
            // Release cargo
            lander.grabbedBoxId = null;
            if (window.CargoAudio && !this.isMuted) CargoAudio.playLoad();
        } else {
            // Try to grab cargo
            let closestBox = null;
            let minDist = 40; // Grab radius

            for (const box of this.physics.boxes) {
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
            if (this.physics.lander.landed || (Math.abs(this.physics.lander.x - (cp.x + cp.width/2)) < 60)) {
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
        const fuelFill = document.getElementById('fuel-fill');
        if (fuelFill) {
            fuelFill.style.width = `${fuelPercent}%`;
            // Change color if critical
            if (fuelPercent < 25) {
                fuelFill.style.background = '#ef4444';
                if (!this.isMuted) CargoAudio.setWarning(true);
            } else {
                fuelFill.style.background = '#38bdf8';
                if (!this.isMuted) CargoAudio.setWarning(false);
            }
        }

        // Set Hull Health Gauge
        const healthPercent = Math.max(0, (lander.integrity / lander.maxIntegrity) * 100);
        const healthFill = document.getElementById('health-fill');
        if (healthFill) {
            healthFill.style.width = `${healthPercent}%`;
            if (healthPercent < 30) {
                healthFill.style.background = '#ef4444';
            } else {
                healthFill.style.background = '#10b981';
            }
        }

        // Update Cargo & Budget stats
        const cargoEl = document.getElementById('hud-cargo');
        if (cargoEl) {
            cargoEl.textContent = `Cargo: ${this.deliveredCount}/${level.targetCargo}`;
        }
        const budgetEl = document.getElementById('hud-budget');
        if (budgetEl) {
            budgetEl.textContent = `Budget: $${this.missionBudget}`;
        }
        const timeEl = document.getElementById('hud-time');
        if (timeEl) {
            const mins = Math.floor(this.missionTimer / 60);
            const secs = Math.floor(this.missionTimer % 60);
            timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        // Toggle extraction button — must be at HQ to activate
        const btnExtract = document.getElementById('btn-extract');
        if (btnExtract) {
            const allDelivered = this.deliveredCount >= level.targetCargo;
            const atHQ = lander && lander.landed && lander.currentPad === 'start';
            if (!allDelivered) {
                btnExtract.classList.add('hidden');
            } else if (atHQ) {
                btnExtract.classList.remove('hidden');
                btnExtract.textContent = '✓ EXTRACT NOW';
                btnExtract.style.background = '#10b981';
                btnExtract.style.opacity = '1';
                btnExtract.style.cursor = 'pointer';
            } else {
                btnExtract.classList.remove('hidden');
                btnExtract.textContent = 'Return to HQ';
                btnExtract.style.background = '#334155';
                btnExtract.style.opacity = '0.7';
                btnExtract.style.cursor = 'default';
            }
        }
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 16.666; // Normalized to 60fps
        this.lastTime = timestamp;

        // FPS tracking (sampled every 600 ms)
        this.fpsFrames = (this.fpsFrames || 0) + 1;
        if (!this.fpsSampleTs) this.fpsSampleTs = timestamp;
        if (timestamp - this.fpsSampleTs >= 600) {
            this.displayFps = Math.round(this.fpsFrames * 1000 / (timestamp - this.fpsSampleTs));
            this.fpsFrames = 0;
            this.fpsSampleTs = timestamp;
        }

        if (this.gameState === 'playing') {
            this.update(dt);
        }

        this.draw();
        
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        const lander = this.physics.lander;
        if (!lander) return;

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
                this.failMission("Time's Up! Contract expired.");
            }
        }

        this.physics.update(dt, levels[this.currentLevelIndex], inputState);

        // --- Cinematic Camera Update ---
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const minZoom = Math.min(cw / this.physics.levelWidth, ch / this.physics.levelHeight) * 0.95;
        let desiredZoom = 1.3;
        if (lander.vehicleType === 'drone') {
            desiredZoom -= (lander.ropeLength * 0.003);
        }
        desiredZoom = Math.max(minZoom, Math.min(1.8, desiredZoom));

        if (this.introTimer > 0) {
            this.introTimer -= dt / 60; 
            const progress = Math.max(0, Math.min(1, (2.0 - this.introTimer) / 2.0));
            // Spline curve: smoothstep ease-in-out
            const s = progress * progress * (3 - 2 * progress);
            
            // Interpolate directly via spline
            this.camera.zoom = minZoom + s * (desiredZoom - minZoom);
            this.camera.x = (this.physics.levelWidth / 2) + s * (lander.x - (this.physics.levelWidth / 2));
            this.camera.y = (this.physics.levelHeight / 2) + s * (lander.y - (this.physics.levelHeight / 2));
        } else {
            this.camera.targetZoom = desiredZoom;
            // Smoothly interpolate zoom (frame-rate independent using dt)
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.05 * dt;

            // Track target (look slightly ahead of velocity)
            let targetX = lander.x + (lander.vx * 15);
            let targetY = lander.y + (lander.vy * 15);
            
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

        // Check cargo positions for unloading and delivery
        this.checkCargoDelivery();

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
            }, 1000);
        }

        // Refill alert sound check
        if (lander.fuel <= 0 && !lander.landed) {
            if (!this.isMuted) CargoAudio.setWarning(true);
        }

        // Update notifications
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const m = this.messages[i];
            m.life -= 0.015 * dt;
            if (m.life <= 0) {
                this.messages.splice(i, 1);
            }
        }

        this.updateHUD();
    }

    checkCargoDelivery() {
        const lander = this.physics.lander;
        const level = levels[this.currentLevelIndex];
        const hubs = this.physics.deliveryHubs;
        const boxes = this.physics.boxes;

        // We check if the lander has landed safely on a delivery pad.
        // Only delivery hubs count here — the 'start' and 'collection' pads aren't hubs.
        const padType = lander.currentPad; // e.g. 'red', 'blue', 'green', 'normal'
        const hub = hubs.find(h => h.type === padType);
        if (lander.landed && hub) {

            // Search cargo boxes that are lying on the deck (close to the deck coordinates)
            const S = this.physics.BOX_SIZE;
            
            // Let's sweep boxes that are within the horizontal bounds of the hub's landing zone
            for (let i = boxes.length - 1; i >= 0; i--) {
                const box = boxes[i];

                // If box is near the hub center (and close to the hub platform height)
                if (box.x >= hub.x - 30 && box.x <= hub.x + hub.width + 30 && box.y > hub.y - 60) {
                    // Check if cargo matches the hub's requirement
                    if (box.type === padType) {
                        // Sucked into the delivery intake (spark animations)
                        this.spawnDeliveryParticles(box.x, box.y, hub.color);
                        boxes.splice(i, 1);

                        this.deliveredCount++;
                        this.career.totalDeliveries++;
                        this.saveCareer();
                        // Economy Loop: Deliveries grant cash instantly!
                        const deliveryReward = 200;
                        this.globalCash += deliveryReward;
                        localStorage.setItem('cargoLanderCash', this.globalCash);
                        if (window.CargoAudio && !this.isMuted) CargoAudio.playUnload();
                        this.addMessage(`+ $${deliveryReward} Delivered!`, "#10b981");
                    } else {
                        // Warning: Incorrect Cargo type
                        this.addMessage(`Warning: Hub rejects ${box.type.toUpperCase()} package!`, "#ef4444");
                    }
                }
            }
        }

        // Check if any cargo fell into the abyss
        for (let i = boxes.length - 1; i >= 0; i--) {
            const box = boxes[i];
            const terrainY = this.physics.getTerrainHeight(box.x);

            // If box fell below the terrain height by a buffer, or off screen bottom
            if (box.y > terrainY + 50 || box.y > this.physics.levelHeight) {
                // Spawn smoke particles
                this.spawnDeliveryParticles(box.x, terrainY, "#475569");
                boxes.splice(i, 1);
                
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

    completeMission() {
        // Must be landed at HQ to extract
        const lander = this.physics.lander;
        if (!lander || !lander.landed || lander.currentPad !== 'start') {
            this.addMessage("Return to HQ pad to extract!", "#f59e0b");
            return;
        }

        this.gameState = 'level_complete';
        if (!this.isMuted && window.CargoAudio) CargoAudio.playSuccess();

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
        grad.addColorStop(0,   lvPal ? lvPal.skyTop : '#090d16');
        grad.addColorStop(0.5, lvPal ? lvPal.skyMid : '#0f172a');
        grad.addColorStop(1,   lvPal ? lvPal.skyBot : '#1e1b4b');
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
        if (this.gameState === 'menu') {
            this.drawMenuBackgroundEntity();
            return; // Don't draw the level geometry
        }

        // Apply Camera Transform for Level rendering
        ctx.save();
        
        // Move to screen center, scale, then move by camera offset
        ctx.translate(w / 2, h / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        // 3. Draw Gravity Well Anomaly
        const level = levels[this.currentLevelIndex];
        if (level && level.gravityWell && this.gameState === 'playing') {
            this.drawGravityWell(level.gravityWell);
        }

        // 4. Draw Delivery Hub Zones (Hologram beacons)
        this.drawDeliveryHubs();

        // 5. Draw Terrain Landscape
        this.drawTerrain();

        // 6. Draw Cargo Sourcing Depot Building
        this.drawSourcingDepot();

        // 6b. Draw world buildings
        this.drawBuildings();

        // 6c. Draw ambient space truck traffic
        this.drawAmbientTraffic();

        // 7. Draw Boxes
        this.drawBoxes();

        // 8. Draw Lander
        this.drawLander();

        ctx.restore();

        // 9. WebGL Render for Particles (the monster shader is intentionally skipped —
        //    the detailed hand-drawn monster is rendered in Canvas2D below)
        if (this.shaders) {
            this.shaders.render(this.physics, this.camera);
        }

        // 9b. Draw the detailed Canvas2D monster (and particles when WebGL is unavailable)
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
        this.drawMonster();
        if (!this.shaders) this.drawParticles();
        ctx.restore();

        // 10. Draw UI Notifications directly on canvas
        this.drawNotifications();

        // 11. Draw Wind Indicator, Minimap, Quest Panel
        if (this.gameState === 'playing') {
            this.drawWindIndicator();
            this.drawMinimap();
            this.drawQuestPanel();
            
            // 12. Draw Monster Threat Vignette
            if (this.physics.outOfBoundsTimer && this.physics.outOfBoundsTimer > 0) {
                const threatLevel = Math.min(1.0, this.physics.outOfBoundsTimer / 120);
                
                // Draw pulsing red/black vignette
                const vignetteGrad = ctx.createRadialGradient(w/2, h/2, h/3, w/2, h/2, h/1.2);
                vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
                vignetteGrad.addColorStop(0.7, `rgba(60, 0, 0, ${threatLevel * 0.4})`);
                vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${threatLevel * 0.9})`);
                
                ctx.fillStyle = vignetteGrad;
                ctx.fillRect(0, 0, w, h);
                
                // Warning text at 25% from top
                if (threatLevel > 0.3) {
                    const pulse = 0.5 + Math.sin(Date.now() / 100) * 0.5;
                    ctx.fillStyle = `rgba(239, 68, 68, ${threatLevel * pulse})`;
                    ctx.font = `bold ${Math.round(18 + threatLevel * 8)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText("⚠ WARNING: LEAVING SAFE ZONE", w / 2, h * 0.25);
                }
            }
        }

        // 13. FPS counter (bottom-left corner)
        if (this.displayFps !== undefined) {
            ctx.save();
            ctx.font = '600 11px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = this.displayFps >= 50 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(251, 191, 36, 0.75)';
            ctx.fillText(`${this.displayFps} FPS`, 14, h - 14);
            ctx.restore();
        }
    }

    drawMinimap() {
        const ctx = this.ctx;
        const cw = this.canvas.width;

        // Minimap: top-right corner, below the HUD bars
        const mmWidth  = 340;
        const mmHeight = 200;
        const mmX = cw - mmWidth - 20;
        const mmY = 92; // clears the fuel/shield bar row

        // ── Background ────────────────────────────────────────────────────
        ctx.save();

        // Draw rounded rect background + border
        ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 8);
        else ctx.rect(mmX, mmY, mmWidth, mmHeight);
        ctx.fill();
        ctx.stroke();

        // ── Clip everything to the minimap box ────────────────────────────
        // This prevents the lander dot / viewport rect from ever leaking outside
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 8);
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
        const scaleX = mmWidth  / this.physics.levelWidth;
        const scaleY = mmHeight / this.physics.levelHeight;

        ctx.translate(mmX, mmY);
        ctx.scale(scaleX, scaleY);

        // ── Terrain silhouette ─────────────────────────────────────────────
        if (this.physics.terrainPoints && this.physics.terrainPoints.length > 0) {
            ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
            ctx.beginPath();
            ctx.moveTo(0, this.physics.levelHeight);
            for (const pt of this.physics.terrainPoints) {
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.lineTo(this.physics.levelWidth, this.physics.levelHeight);
            ctx.closePath();
            ctx.fill();
        }

        // ── Pads / hubs ────────────────────────────────────────────────────
        // Min size in world units so they're visible on the minimap
        const minW = 6 / scaleX;
        const minH = 6 / scaleY;

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
        for (const hub of this.physics.deliveryHubs) {
            ctx.fillStyle = hub.color || '#38bdf8';
            ctx.fillRect(hub.x, hub.y - minH, Math.max(hub.width, minW), minH * 2);
        }

        // ── Cargo boxes ────────────────────────────────────────────────────
        const boxR = 12 / Math.max(scaleX, scaleY); // world-space radius
        for (const box of this.physics.boxes) {
            ctx.fillStyle = box.color || '#fff';
            ctx.beginPath();
            ctx.arc(box.x, box.y, boxR, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Monster blip ───────────────────────────────────────────────────
        if (this.physics.monster) {
            const m = this.physics.monster;
            const mR = 22 / Math.max(scaleX, scaleY);
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
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1 / Math.max(scaleX, scaleY);
        ctx.strokeRect(viewX, viewY, viewW, viewH);

        // ── Lander dot (clamped to be always inside minimap) ───────────────
        if (this.physics.lander) {
            const l = this.physics.lander;
            // Clamp world position to level bounds so dot stays inside minimap
            const clampedX = Math.max(0, Math.min(this.physics.levelWidth,  l.x));
            const clampedY = Math.max(0, Math.min(this.physics.levelHeight, l.y));

            const dotR = 8 / Math.max(scaleX, scaleY);
            ctx.fillStyle = l.crashed ? '#ef4444' : '#10b981';
            ctx.beginPath();
            ctx.arc(clampedX, clampedY, dotR, 0, Math.PI * 2);
            ctx.fill();

            // Small heading tick
            if (!l.crashed) {
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 4 / Math.max(scaleX, scaleY);
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
        const ctx = this.ctx;
        const level = levels[this.currentLevelIndex];
        if (!level || !level.quests) return;

        const px = 16, py = 92;
        const panelW = 260, lineH = 24;
        const panelH = 16 + 22 + 6 + level.quests.length * lineH + 12;

        ctx.save();

        // Panel background — slightly more opaque for readability
        ctx.fillStyle = 'rgba(8, 12, 26, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px, py, panelW, panelH, 10);
        else ctx.rect(px, py, panelW, panelH);
        ctx.fill();
        ctx.stroke();

        // Mission label
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.letterSpacing = '0.12em';
        ctx.fillStyle = 'rgba(56,189,248,0.75)';
        ctx.textAlign = 'left';
        ctx.fillText('MISSION', px + 12, py + 15);

        // Mission name
        ctx.font = '700 13px Outfit, sans-serif';
        ctx.letterSpacing = '0';
        ctx.fillStyle = 'rgba(248,250,252,0.95)';
        ctx.fillText(level.missionTitle || level.name, px + 12, py + 33, panelW - 24);

        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 41);
        ctx.lineTo(px + panelW - 10, py + 41);
        ctx.stroke();

        // Quest items
        for (let i = 0; i < level.quests.length; i++) {
            const q = level.quests[i];
            const qy = py + 41 + 8 + i * lineH + 13;
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

            ctx.font = '700 13px monospace';
            ctx.fillStyle = iconColor;
            ctx.fillText(icon, px + 12, qy);

            ctx.font = isPrimary ? '600 12px Outfit, sans-serif' : '400 12px Outfit, sans-serif';
            ctx.fillStyle = state?.failed ? 'rgba(239,68,68,0.75)' :
                            (state?.completed ? 'rgba(16,185,129,0.9)' :
                            (isPrimary ? 'rgba(248,250,252,0.92)' : 'rgba(148,163,184,0.85)'));
            ctx.fillText(q.text + (q.reward ? `  +$${q.reward}` : ''), px + 28, qy, panelW - 40);
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
                width: e.type === 'drone' ? 32 : 48,
                height: e.type === 'drone' ? 16 : 32,
                deckWidth: 50, deckOffset: 12, basketHeight: 20,
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

    drawGravityWell(well) {
        const ctx = this.ctx;
        const time = Date.now() * 0.003;
        
        // Draw circular ripples
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw swirling core
        const grad = ctx.createRadialGradient(well.x, well.y, 5, well.x, well.y, 80);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        grad.addColorStop(0.3, 'rgba(76, 29, 149, 0.6)');
        grad.addColorStop(0.7, 'rgba(139, 92, 246, 0.15)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(well.x, well.y, 80, 0, Math.PI * 2);
        ctx.fill();

        // Swirling dust lines
        ctx.save();
        ctx.translate(well.x, well.y);
        ctx.rotate(-time * 0.4);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            ctx.rotate(Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.arc(0, 0, 30 + i * 15, 0, Math.PI, false);
            ctx.stroke();
        }
        ctx.restore();
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
                const dx = trail[i].x - trail[i-1].x;
                const dy = trail[i].y - trail[i-1].y;
                const d = Math.sqrt(dx*dx + dy*dy);
                if (walked + d >= dist) {
                    const f = d < 0.001 ? 0 : (dist - walked) / d;
                    return { x: trail[i-1].x + dx * f, y: trail[i-1].y + dy * f, angle: Math.atan2(dy, dx) };
                }
                walked += d;
            }
            const p = trail[trail.length - 1];
            return { x: p.x, y: p.y, angle: 0 };
        }

        // Bigger segments — ~40% larger than before
        const SEGS = [
            { d: 0,   r: 50 }, // HEAD
            { d: 60,  r: 43 },
            { d: 112, r: 38 },
            { d: 156, r: 34 },
            { d: 194, r: 30 },
            { d: 228, r: 26 },
            { d: 258, r: 22 },
            { d: 285, r: 18 },
            { d: 308, r: 13 },
            { d: 326, r: 10 },
            { d: 339, r: 7  },
        ];

        const positions = SEGS.map(s => ({ r: s.r, ...trailSample(s.d) }));
        const head = positions[0];

        const lander = this.physics.lander;
        const hdx = lander ? lander.x - m.x : m.vx;
        const hdy = lander ? lander.y - m.y : m.vy;
        const headAngle = Math.atan2(hdy, hdx);
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
            { sides: [-1,1], count: 1, spread: 0.45, len: 1.6, thick: 3.8 },
            { sides: [-1,1], count: 2, spread: 0.55, len: 1.3, thick: 3.2 },
            { sides: [-1],   count: 1, spread: 0.38, len: 2.0, thick: 2.8 },
            { sides: [-1,1], count: 1, spread: 0.60, len: 1.1, thick: 3.5 },
            { sides: [1],    count: 2, spread: 0.42, len: 1.8, thick: 2.5 },
            { sides: [-1,1], count: 1, spread: 0.50, len: 1.4, thick: 3.0 },
            { sides: [-1,1], count: 1, spread: 0.35, len: 2.2, thick: 2.2 },
            { sides: [1],    count: 1, spread: 0.48, len: 1.2, thick: 2.8 },
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
                        seg.x + Math.cos(ca + 0.9) * seg.r * 0.7,  seg.y + Math.sin(ca + 0.9) * seg.r * 0.7,
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

    drawTerrain() {
        const ctx = this.ctx;
        if (this.physics.terrainPoints.length === 0) return;

        // Level colour palette (fallback to classic red if not defined)
        const lv = levels[this.currentLevelIndex] || {};
        const pal = lv.palette || {
            terrainFill: '#0b0f19', rockEdge: '#ef4444', rockGlow: 'rgba(239,68,68,',
        };

        // Determine visible X range based on camera
        const zoom = this.camera.zoom;
        const w = this.canvas.width;
        const startX = Math.floor((this.camera.x - (w / 2 / zoom) - 100) / 20) * 20;
        const endX = this.camera.x + (w / 2 / zoom) + 100;

        // Main fill
        ctx.fillStyle = pal.terrainFill;
        ctx.beginPath();
        ctx.moveTo(startX, this.physics.levelHeight + 1000);

        for (let x = startX; x <= endX; x += 20) {
            ctx.lineTo(x, this.physics.getTerrainHeight(x));
        }

        ctx.lineTo(endX, this.physics.levelHeight + 1000);
        ctx.closePath();
        ctx.fill();

        // Single crisp terrain edge — no bloom (reduces flickering + visual noise)
        ctx.strokeStyle = pal.rockEdge + (pal.rockEdge.length === 7 ? 'aa' : '');
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = startX; x <= endX; x += 8) {
            const y = this.physics.getTerrainHeight(x);
            if (x === startX) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Really jagged rocks along the raw terrain (skipped over flat landing pads).
        const padRanges = this.getPadRanges();
        const isOverPad = (x) => padRanges.some(p => x >= p.left - 6 && x <= p.right + 6);
        const getH = (x) => this.physics.getTerrainHeight(x);
        // Deterministic pseudo-random so rocks are stable frame-to-frame
        const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

        ctx.fillStyle = pal.terrainFill;
        ctx.strokeStyle = pal.rockEdge;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'miter';

        let rx = startX;
        while (rx <= endX) {
            if (isOverPad(rx)) { rx += 10; continue; }

            const r1 = hash(rx), r2 = hash(rx * 1.7 + 3), r3 = hash(rx * 0.31 + 9);
            const baseW = 6 + r2 * 14;            // varied footprint
            const peakH = 5 + r1 * 22;            // some tiny, some tall
            const lean = (r3 - 0.5) * baseW * 1.1; // asymmetric, leaning peaks

            const xL = rx;
            const xR = rx + baseW;
            const yL = getH(xL);
            const yR = getH(xR);
            const apexX = rx + baseW * 0.5 + lean;
            const apexY = Math.min(yL, yR) - peakH;

            // Occasional notched (double) peak for extra jaggedness
            ctx.beginPath();
            ctx.moveTo(xL, yL);
            if (r2 > 0.62) {
                const midX = rx + baseW * 0.5;
                const midY = Math.min(yL, yR) - peakH * 0.35;
                ctx.lineTo(rx + baseW * 0.3 + lean * 0.5, apexY);
                ctx.lineTo(midX, midY);
                ctx.lineTo(rx + baseW * 0.72 + lean * 0.3, apexY - peakH * 0.15);
            } else {
                ctx.lineTo(apexX, apexY);
            }
            ctx.lineTo(xR, yR);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            rx += baseW * (0.45 + r1 * 0.5);      // irregular, overlapping spacing
        }

        // Subtle surface grain lines
        ctx.strokeStyle = `${pal.rockGlow}0.12)`;
        ctx.lineWidth = 0.8;
        for (let x = startX; x <= endX; x += 50) {
            const y = this.physics.getTerrainHeight(x);
            ctx.beginPath();
            ctx.moveTo(x, y + 2);
            ctx.lineTo(x - 8, y + 18 + (Math.abs(x) % 30));
            ctx.stroke();
        }
    }

    drawSourcingDepot() {
        const ctx = this.ctx;
        const start = this.physics.startDepot;
        const collection = this.physics.collectionPoint;
        const level = levels[this.currentLevelIndex];
        const allDelivered = level && this.deliveredCount >= level.targetCargo;

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

        // Draw Collection Point
        if (collection) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(collection.x, collection.y, collection.width, collection.height);

            // Warning stripes (yellow tint)
            ctx.save();
            ctx.beginPath();
            ctx.rect(collection.x, collection.y, collection.width, collection.height);
            ctx.clip();
            const csW = 14;
            ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
            for (let sx = collection.x - collection.height; sx < collection.x + collection.width + collection.height; sx += csW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, collection.y + collection.height);
                ctx.lineTo(sx + collection.height, collection.y);
                ctx.lineTo(sx + collection.height + csW, collection.y);
                ctx.lineTo(sx + csW, collection.y + collection.height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            ctx.fillStyle = '#fbbf24'; // Yellow for collection
            ctx.fillRect(collection.x, collection.y, collection.width, 3);

            // Dispenser crane
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(collection.x + collection.width / 2, collection.y - 60);
            ctx.lineTo(collection.x + collection.width / 2, collection.y - 120);
            ctx.lineTo(collection.x + collection.width / 2 - 25, collection.y - 120);
            ctx.stroke();

            // Dispenser box container
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.fillRect(collection.x + collection.width / 2 - 20, collection.y - 140, 40, 30);
            ctx.strokeRect(collection.x + collection.width / 2 - 20, collection.y - 140, 40, 30);

            // Dispenser prompt — visible whenever lander is in the loading zone
            const lander = this.physics.lander;
            if (lander) {
                const cpCx = collection.x + collection.width / 2;
                const nearPad = Math.abs(lander.x - cpCx) < collection.width / 2 + 28
                              && lander.y >= collection.y - 60 && lander.y <= collection.y + 12;
                if (nearPad) {
                    // Zone indicator: soft glow under the pad
                    const zGrad = ctx.createRadialGradient(cpCx, collection.y, 0, cpCx, collection.y, collection.width * 0.75);
                    zGrad.addColorStop(0, 'rgba(251,191,36,0.18)');
                    zGrad.addColorStop(1, 'rgba(251,191,36,0)');
                    ctx.fillStyle = zGrad;
                    ctx.beginPath();
                    ctx.ellipse(cpCx, collection.y + 4, collection.width * 0.75, 16, 0, 0, Math.PI * 2);
                    ctx.fill();

                    const pulse = 0.7 + Math.abs(Math.sin(Date.now() * 0.006)) * 0.3;
                    ctx.fillStyle = `rgba(251, 191, 36, ${pulse})`;
                    ctx.font = '600 13px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText("[ SPACE ] DISPENSE CARGO", cpCx, collection.y - 45);
                }
            }
        }
    }

    drawDeliveryHubs() {
        const ctx = this.ctx;
        const hubs = this.physics.deliveryHubs;
        
        for (const hub of hubs) {
            // Glow column beacon
            const pulse = 0.15 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.15;
            ctx.fillStyle = hub.color;
            ctx.globalAlpha = pulse;
            ctx.fillRect(hub.x - 5, hub.y - 200, hub.width + 10, 200);
            ctx.globalAlpha = 1.0;

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

            // Hub base
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(hub.x, hub.y, hub.width, hub.height);

            // Hub stripe texture
            ctx.save();
            ctx.beginPath();
            ctx.rect(hub.x, hub.y, hub.width, hub.height);
            ctx.clip();
            const hsW = 12;
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            for (let sx = hub.x - hub.height; sx < hub.x + hub.width + hub.height; sx += hsW * 2) {
                ctx.beginPath();
                ctx.moveTo(sx, hub.y + hub.height);
                ctx.lineTo(sx + hub.height, hub.y);
                ctx.lineTo(sx + hub.height + hsW, hub.y);
                ctx.lineTo(sx + hsW, hub.y + hub.height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Glowing boundary line
            ctx.fillStyle = hub.color;
            ctx.fillRect(hub.x, hub.y, hub.width, 3);

            // Hub name label
            ctx.fillStyle = '#f8fafc';
            ctx.font = '600 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(hub.name.toUpperCase(), hub.x + hub.width / 2, hub.y + 11);
        }
    }

    drawBoxes() {
        const ctx = this.ctx;
        const S = this.physics.BOX_SIZE;
        const halfS = S / 2;

        for (const box of this.physics.boxes) {
            ctx.save();
            ctx.translate(box.x, box.y);

            // Set color based on cargo sorting type
            let color = '#38bdf8'; // Blue (normal)
            let iconText = box.emoji || '📦';
            
            if (box.type === 'red') {
                color = '#ef4444'; // Red (hazmat)
            } else if (box.type === 'blue') {
                color = '#3b82f6'; // Cold Chain
            } else if (box.type === 'green') {
                color = '#10b981'; // Eco/Green
            }

            // Box gradient fill (lighter top-left, darker bottom-right)
            const boxGrad = ctx.createLinearGradient(-halfS, -halfS, halfS, halfS);
            boxGrad.addColorStop(0, '#c2620a');
            boxGrad.addColorStop(0.5, '#b45309');
            boxGrad.addColorStop(1, '#7c3209');
            ctx.fillStyle = boxGrad;
            ctx.fillRect(-halfS, -halfS, S, S);

            // Inner bevel highlight (top + left edge)
            ctx.strokeStyle = 'rgba(255,200,100,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-halfS + 1, halfS - 1);
            ctx.lineTo(-halfS + 1, -halfS + 1);
            ctx.lineTo(halfS - 1, -halfS + 1);
            ctx.stroke();

            // Outer border
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.strokeRect(-halfS, -halfS, S, S);

            // Packing tape across the middle
            ctx.fillStyle = 'rgba(253, 230, 138, 0.65)';
            ctx.fillRect(-halfS, -2, S, 4);
            // Tape cross piece
            ctx.fillRect(-2, -halfS, 4, S);

            // Type-color glow outline
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-halfS - 1, -halfS - 1, S + 2, S + 2);

            // Emoji
            ctx.fillStyle = '#ffffff';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconText, 0, 1);

            ctx.restore();
        }
    }

    drawLander() {
        const ctx = this.ctx;
        const lander = this.physics.lander;
        if (!lander || lander.crashed) return;

        if (lander.vehicleType === 'drone') {
            // Drone Rope with catenary sag
            if (lander.ropeLength > 0) {
                const rx0 = lander.x;
                const ry0 = lander.y + 8; // attach point below drone body
                const rx1 = lander.grappleX ?? lander.x;
                const ry1 = lander.grappleY ?? lander.y + lander.ropeLength;

                // Sag mid-point: pull midpoint down by a fraction of rope length
                const sag = Math.min(lander.ropeLength * 0.12, 18);
                const midX = (rx0 + rx1) / 2;
                const midY = (ry0 + ry1) / 2 + sag;

                // Shadow rope (depth)
                ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(rx0 + 1, ry0 + 1);
                ctx.quadraticCurveTo(midX + 1, midY + 1, rx1 + 1, ry1 + 1);
                ctx.stroke();

                // Main rope
                ctx.strokeStyle = lander.grabbedBoxId ? '#f97316' : '#94a3b8';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(rx0, ry0);
                ctx.quadraticCurveTo(midX, midY, rx1, ry1);
                ctx.stroke();

                // Thin highlight along rope
                ctx.strokeStyle = 'rgba(203,213,225,0.35)';
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(rx0, ry0);
                ctx.quadraticCurveTo(midX, midY, rx1, ry1);
                ctx.stroke();

                // Hook/magnet end
                const hooked = !!lander.grabbedBoxId;
                const hGlow = ctx.createRadialGradient(rx1, ry1, 0, rx1, ry1, hooked ? 10 : 6);
                hGlow.addColorStop(0, hooked ? 'rgba(249,115,22,0.8)' : 'rgba(148,163,184,0.6)');
                hGlow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = hGlow;
                ctx.beginPath();
                ctx.arc(rx1, ry1, hooked ? 10 : 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = hooked ? '#f97316' : '#cbd5e1';
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(rx1, ry1, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.save();
        ctx.translate(lander.x, lander.y);
        ctx.rotate(lander.angle);

        const w = lander.width;
        const h = lander.height;

        if (lander.vehicleType === 'drone') {
            // Draw Drone
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-16, -6, 32, 12);
            
            // Rotors
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-22, -8, 8, 4); // Left motor
            ctx.fillRect(14, -8, 8, 4); // Right motor
            
            // Spinning blades
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const spin = Date.now() / 20;
            ctx.moveTo(-18 - Math.sin(spin)*8, -10);
            ctx.lineTo(-18 + Math.sin(spin)*8, -10);
            ctx.moveTo(18 - Math.sin(spin)*8, -10);
            ctx.lineTo(18 + Math.sin(spin)*8, -10);
            ctx.stroke();
            
            // Center eye
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // ─── SPACE TRUCK DESIGN ───────────────────────────────────────
            const deckY = -lander.deckOffset;
            const hw = lander.deckWidth / 2;
            const bh = lander.basketHeight;

            // ── Main thruster flame (bottom) ──────────────────────────────
            if (lander.thrusting && lander.fuel > 0) {
                const fl = 18 + Math.random() * 26;
                const fGrad = ctx.createLinearGradient(0, 20, 0, 20 + fl);
                fGrad.addColorStop(0, 'rgba(251, 191, 36, 0.98)');
                fGrad.addColorStop(0.35, 'rgba(239, 100, 20, 0.75)');
                fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = fGrad;
                // Left nozzle flame
                const fw = 3.5 + Math.random() * 2.5;
                ctx.beginPath();
                ctx.moveTo(-8 - fw, 20);
                ctx.bezierCurveTo(-8 - fw * 0.3, 20 + fl * 0.5, (Math.random()-0.5)*4 - 8, 20 + fl * 0.88, -8, 20 + fl);
                ctx.bezierCurveTo((Math.random()-0.5)*4 - 8, 20 + fl * 0.88, -8 + fw * 0.3, 20 + fl * 0.5, -8 + fw, 20);
                ctx.closePath();
                ctx.fill();
                // Right nozzle flame
                ctx.beginPath();
                ctx.moveTo(8 - fw, 20);
                ctx.bezierCurveTo(8 - fw * 0.3, 20 + fl * 0.5, (Math.random()-0.5)*4 + 8, 20 + fl * 0.88, 8, 20 + fl);
                ctx.bezierCurveTo((Math.random()-0.5)*4 + 8, 20 + fl * 0.88, 8 + fw * 0.3, 20 + fl * 0.5, 8 + fw, 20);
                ctx.closePath();
                ctx.fill();
                // Shared bloom
                const bGrad = ctx.createRadialGradient(0, 24, 0, 0, 28, 28);
                bGrad.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
                bGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.ellipse(0, 28, 22, 28, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Side thruster flames ───────────────────────────────────────
            const strafe = lander.strafePower || 0;
            if (Math.abs(strafe) > 0.08) {
                const sl = 10 + Math.abs(strafe) * 22 + Math.random() * 8;
                // Flame shoots from the OPPOSITE side of direction of travel
                const flameX = strafe < 0 ? hw + 2 : -hw - 2;
                const flameDir = strafe < 0 ? 1 : -1;
                // Gradient from nozzle outward (must reference flameX)
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
                    flameX + flameDir * sl * 0.82 + (Math.random()-0.5)*4, (Math.random()-0.5)*3,
                    flameX + flameDir * sl, 0
                );
                ctx.bezierCurveTo(
                    flameX + flameDir * sl * 0.82 + (Math.random()-0.5)*4, (Math.random()-0.5)*3,
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

            // ── Cargo Deck (flat-bed style) ────────────────────────────────
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-hw, deckY - bh);
            ctx.lineTo(-hw, deckY);
            ctx.lineTo(hw, deckY);
            ctx.lineTo(hw, deckY - bh);
            ctx.stroke();

            // Deck floor plate
            const deckGrad = ctx.createLinearGradient(-hw, deckY - 3, hw, deckY);
            deckGrad.addColorStop(0, 'rgba(56,189,248,0.7)');
            deckGrad.addColorStop(1, 'rgba(56,189,248,0.3)');
            ctx.strokeStyle = deckGrad;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-hw + 2, deckY);
            ctx.lineTo(hw - 2, deckY);
            ctx.stroke();

            // ── Engine block (boxy industrial bottom) ──────────────────────
            // Main chassis rectangle
            const chassisGrad = ctx.createLinearGradient(-hw, -6, hw, 20);
            chassisGrad.addColorStop(0, '#1e3a5f');
            chassisGrad.addColorStop(0.5, '#162840');
            chassisGrad.addColorStop(1, '#0c1825');
            ctx.fillStyle = chassisGrad;
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(-hw + 2, -5, (hw - 2) * 2, 25, 3)
                          : ctx.rect(-hw + 2, -5, (hw - 2) * 2, 25);
            ctx.fill();
            ctx.stroke();

            // Panel lines / detail strips
            ctx.strokeStyle = 'rgba(56,189,248,0.3)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-hw + 5, 2);
            ctx.lineTo(hw - 5, 2);
            ctx.moveTo(-hw + 5, 10);
            ctx.lineTo(hw - 5, 10);
            ctx.stroke();

            // ── Cab / cockpit (top section) ─────────────────────────────────
            const cabW = hw * 0.65, cabH = 14;
            const cabGrad = ctx.createLinearGradient(-cabW, -5 - cabH, cabW, -5);
            cabGrad.addColorStop(0, '#1e3a5f');
            cabGrad.addColorStop(1, '#0f2035');
            ctx.fillStyle = cabGrad;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            // Slightly tapered cab
            ctx.moveTo(-cabW, -5);
            ctx.lineTo(-cabW * 0.8, -5 - cabH);
            ctx.lineTo(cabW * 0.8, -5 - cabH);
            ctx.lineTo(cabW, -5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cab window (wide visor)
            ctx.fillStyle = 'rgba(147,197,253,0.45)';
            ctx.strokeStyle = 'rgba(147,197,253,0.7)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-cabW * 0.62, -5 - 3);
            ctx.lineTo(-cabW * 0.48, -5 - cabH + 3);
            ctx.lineTo(cabW * 0.48, -5 - cabH + 3);
            ctx.lineTo(cabW * 0.62, -5 - 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Window glint
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath();
            ctx.moveTo(-cabW * 0.55, -5 - 4);
            ctx.lineTo(-cabW * 0.38, -5 - cabH + 5);
            ctx.lineTo(-cabW * 0.12, -5 - cabH + 5);
            ctx.lineTo(-cabW * 0.28, -5 - 4);
            ctx.closePath();
            ctx.fill();

            // ── Dual thruster nozzles ──────────────────────────────────────
            for (const nx of [-8, 8]) {
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(nx - 4, 19);
                ctx.lineTo(nx + 4, 19);
                ctx.lineTo(nx + 6, 27);
                ctx.lineTo(nx - 6, 27);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Nozzle ring
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(nx, 27, 6, 2.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // ── Landing legs — spring-compressed on touchdown ──────────────
            const lc = lander.legCompress || 0; // 0 = relaxed, 1 = fully compressed
            // legSink: how much the foot drops down (visually), springs back
            const legSink = lc * 6; // max 6px compression
            const legSpreadX = hw + 10 - lc * 5; // legs pull inward when compressed
            const footY = 24 - legSink;

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;
            // Left leg
            ctx.beginPath();
            ctx.moveTo(-hw + 4, 8);
            ctx.lineTo(-legSpreadX, footY);
            ctx.lineTo(-legSpreadX - 6, footY);
            ctx.stroke();
            // Left cross brace
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-hw + 1, 15);
            ctx.lineTo(-legSpreadX, footY - 2);
            ctx.stroke();
            // Right leg
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(hw - 4, 8);
            ctx.lineTo(legSpreadX, footY);
            ctx.lineTo(legSpreadX + 6, footY);
            ctx.stroke();
            // Right cross brace
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(hw - 1, 15);
            ctx.lineTo(legSpreadX, footY - 2);
            ctx.stroke();

            // ── Navigation lights ─────────────────────────────────────────
            const navPulse = 0.6 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.4;
            ctx.fillStyle = `rgba(239, 68, 68, ${navPulse})`;
            ctx.beginPath();
            ctx.arc(-legSpreadX - 6, footY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(16, 185, 129, ${navPulse})`;
            ctx.beginPath();
            ctx.arc(legSpreadX + 6, footY, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // ── Side thruster nozzles (visible even when idle) ────────────
            for (const side of [-1, 1]) {
                const snx = side * (hw + 1);
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(snx, -2);
                ctx.lineTo(snx + side * 6, 0);
                ctx.lineTo(snx + side * 6, 4);
                ctx.lineTo(snx, 6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawParticles() {
        const ctx = this.ctx;
        for (const p of this.physics.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    drawNotifications() {
        const ctx = this.ctx;
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px sans-serif';

        for (let i = 0; i < this.messages.length; i++) {
            const m = this.messages[i];
            const y = m.y - (i * 28);
            const tw = ctx.measureText(m.text).width;

            // Backdrop pill
            ctx.globalAlpha = m.life * 0.72;
            ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
            const pw = tw + 26, ph = 22;
            const px = this.canvas.width / 2 - pw / 2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(px, y - ph + 5, pw, ph, 11);
            else ctx.rect(px, y - ph + 5, pw, ph);
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
                const siloGrad = ctx.createLinearGradient(-sw/2, 0, sw/2, 0);
                siloGrad.addColorStop(0, '#1e293b');
                siloGrad.addColorStop(0.4, '#334155');
                siloGrad.addColorStop(1, '#1e293b');
                ctx.fillStyle = siloGrad;
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-sw/2, -sh, sw, sh);
                ctx.fill();
                ctx.stroke();
                // Dome cap
                ctx.beginPath();
                ctx.ellipse(0, -sh, sw/2, sw * 0.22, 0, Math.PI, 0);
                ctx.fillStyle = '#334155';
                ctx.fill();
                ctx.stroke();
                // Horizontal band stripes
                ctx.strokeStyle = 'rgba(56,189,248,0.2)';
                ctx.lineWidth = 1;
                for (let bh2 = sh * 0.2; bh2 < sh; bh2 += sh * 0.22) {
                    ctx.beginPath();
                    ctx.moveTo(-sw/2, -bh2);
                    ctx.lineTo(sw/2, -bh2);
                    ctx.stroke();
                }
                // Warning lights at corners
                const wl = Math.sin(Date.now() * 0.003 + b.phase + 1) > 0;
                if (wl) {
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(-sw/2, -sh, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(sw/2, -sh, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (b.type === 'refinery') {
                // Industrial refinery cluster: multiple vertical pipes + platform
                const rw = b.w;
                // Base platform
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 2;
                ctx.fillRect(-rw/2, -8, rw, 8);
                ctx.strokeRect(-rw/2, -8, rw, 8);
                // Three pipes of varying height
                const pipes = [
                    { ox: -rw * 0.32, pw: 8, ph: b.h * 0.9 },
                    { ox:  0,         pw: 11, ph: b.h },
                    { ox:  rw * 0.3,  pw: 7, ph: b.h * 0.65 },
                ];
                for (const p of pipes) {
                    const pg = ctx.createLinearGradient(p.ox - p.pw/2, 0, p.ox + p.pw/2, 0);
                    pg.addColorStop(0, '#0f172a');
                    pg.addColorStop(0.5, '#334155');
                    pg.addColorStop(1, '#0f172a');
                    ctx.fillStyle = pg;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1;
                    ctx.fillRect(p.ox - p.pw/2, -8 - p.ph, p.pw, p.ph);
                    ctx.strokeRect(p.ox - p.pw/2, -8 - p.ph, p.pw, p.ph);
                    // Pipe cap
                    ctx.fillStyle = '#334155';
                    ctx.beginPath();
                    ctx.ellipse(p.ox, -8 - p.ph, p.pw/2 + 1, 3, 0, 0, Math.PI * 2);
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

            // Engine glow trail
            if (t.engineGlow) {
                const eg = ctx.createRadialGradient(-tw/2 - 10, 0, 0, -tw/2 - 10, 0, 40);
                eg.addColorStop(0, t.accentColor + '59'); // 35% opacity hex
                eg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = eg;
                ctx.beginPath();
                ctx.arc(-tw/2 - 10, 0, 40, 0, Math.PI * 2);
                ctx.fill();
            }

            // Hull — elongated rectangular body
            const hullGrad = ctx.createLinearGradient(0, -th/2, 0, th/2);
            hullGrad.addColorStop(0, t.bodyColor);
            hullGrad.addColorStop(0.5, shadeColor(t.bodyColor, 20));
            hullGrad.addColorStop(1, shadeColor(t.bodyColor, -20));
            ctx.fillStyle = hullGrad;
            ctx.strokeStyle = t.accentColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-tw/2, -th/2, tw, th, 4);
            else ctx.rect(-tw/2, -th/2, tw, th);
            ctx.fill();
            ctx.stroke();

            // Nose cone (front = right)
            ctx.fillStyle = shadeColor(t.bodyColor, 15);
            ctx.strokeStyle = t.accentColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tw/2, -th/2);
            ctx.lineTo(tw/2 + th * 0.7, 0);
            ctx.lineTo(tw/2, th/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Engine pods (rear = left)
            for (const ey of [-th * 0.3, th * 0.3]) {
                ctx.fillStyle = shadeColor(t.bodyColor, -15);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1;
                ctx.fillRect(-tw/2 - 12, ey - th * 0.18, 12, th * 0.36);
                ctx.strokeRect(-tw/2 - 12, ey - th * 0.18, 12, th * 0.36);
                // Engine nozzle glow
                const fl = 6 + Math.abs(Math.sin(t.lightPhase * 3)) * 8;
                const eg2 = ctx.createLinearGradient(-tw/2 - 12, 0, -tw/2 - 12 - fl, 0);
                eg2.addColorStop(0, `rgba(56,189,248,0.8)`);
                eg2.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.fillStyle = eg2;
                ctx.beginPath();
                ctx.moveTo(-tw/2 - 12, ey - th * 0.12);
                ctx.lineTo(-tw/2 - 12 - fl, ey);
                ctx.lineTo(-tw/2 - 12, ey + th * 0.12);
                ctx.closePath();
                ctx.fill();
            }

            // Window strip
            ctx.fillStyle = 'rgba(147,197,253,0.3)';
            ctx.strokeStyle = 'rgba(147,197,253,0.5)';
            ctx.lineWidth = 0.8;
            const winStart = -tw * 0.1;
            const winLen = tw * 0.45;
            ctx.fillRect(winStart, -th * 0.3, winLen, th * 0.6);
            ctx.strokeRect(winStart, -th * 0.3, winLen, th * 0.6);

            // Running lights — blink at own phase
            const blinkA = Math.sin(t.lightPhase) > 0;
            const blinkB = Math.sin(t.lightPhase + Math.PI) > 0;
            ctx.fillStyle = blinkA ? t.lightColor : 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.arc(tw/2 + th * 0.5, -th * 0.22, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = blinkB ? '#ef4444' : 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.arc(-tw/2 - 8, th * 0.1, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    drawWindIndicator() {
        const ctx = this.ctx;
        const wind = this.physics.wind;
        if (Math.abs(wind) < 0.05) return;

        // Position at top center, below HUD bar
        const cx = this.canvas.width / 2;
        const cy = 65;

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
        
        ctx.moveTo(cx - (arrowLen/2) * dir, cy);
        ctx.lineTo(cx + (arrowLen/2) * dir, cy);
        // Arrowhead
        ctx.lineTo(cx + (arrowLen/2 - 6) * dir, cy - 4);
        ctx.moveTo(cx + (arrowLen/2) * dir, cy);
        ctx.lineTo(cx + (arrowLen/2 - 6) * dir, cy + 4);
        
        ctx.stroke();
    }
}

// ── Utility: lighten (+) or darken (-) a hex color by amount 0-100 ──────────
function shadeColor(hex, amount) {
    const n = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// Global game singleton
const game = new CargoGame();
