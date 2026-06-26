// CargoLander - Game Core Loop & Renderer
const levels = [
    {
        name: "L1: Local Distribution",
        description: "Transport 3 standard packages to the Delivery Pad. Fly carefully - tilt too much and cargo will slide off!",
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
        hint: "Tip: Land slowly (< 2.0 m/s) and keep your lander level (< 8 degrees) to land safely."
    },
    {
        name: "L2: Cross-Dock Sorting",
        description: "Sort the cargo. Normal (white) packages go to the central Hub. Fragile (red) go to the far Hub. Don't drop fragile cargo from high up!",
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
        hint: "Fragile (Red) cargo breaks if dropped too hard!"
    },
    {
        name: "L3: Gale-Force Winds",
        description: "High altitude delivery. Strong crosswinds will push your lander and cargo. Compensate by thrusting into the wind.",
        gravity: 0.15,
        wind: 0.08, // Constant rightward wind
        terrainType: "mountain",
        targetCargo: 2,
        budget: 1500,
        timeLimit: 200,
        allowedTypes: ["normal"],
        deliveryHubs: [
            { x: 650, color: "#38bdf8", type: "normal", name: "Peak Station" }
        ],
        hint: "Tilt into the wind to maintain position."
    },
    {
        name: "L4: Gravity Anomaly",
        description: "Warning: Unstable spacetime detected. A gravitational vortex is pulling you in. Counter the force and deliver safely.",
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
        gravityWell: { x: 500, y: 400, strength: 0.8, radius: 200 },
        hint: "Fly around the vortex's event horizon!"
    },
    {
        name: "L5: The Needle's Eye",
        description: "The delivery hub is at the bottom of a shaft too narrow for your drone. Hover, extend your rope (E/Q), and drop the cargo in!",
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
        hint: "Hover over the pit. Use E to extend rope, Q to retract. SPACE drops cargo!"
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
        
        this.score = 100; // Efficiency rating %
        this.deliveredCount = 0;
        this.deliveredTypes = {}; 
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
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * 1000,
                y: Math.random() * 400,
                size: Math.random() * 1.5 + 0.5,
                twinkleSpeed: 0.02 + Math.random() * 0.05,
                phase: Math.random() * Math.PI
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
        const failScreen = document.getElementById('fail-screen');
        if (failScreen) failScreen.style.display = 'none';
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        const respawnScreen = document.getElementById('respawn-screen');
        if (respawnScreen) respawnScreen.classList.add('hidden');
        const upgradeScreen = document.getElementById('upgrade-screen');
        if (upgradeScreen) upgradeScreen.style.display = 'none';
        const vehicleScreen = document.getElementById('vehicle-screen');
        if (vehicleScreen) vehicleScreen.style.display = 'none';
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

    startLevel(idx, vehicleType = 'basic') {
        this.currentLevelIndex = idx;
        this.crashHandled = false;
        const level = levels[idx];
        level.vehicle = vehicleType; // Inject selected vehicle
        
        this.missionBudget = level.budget || 1000;
        this.missionTimer = level.timeLimit || 180;
        
        this.physics.initLevel(level, this.canvas.width, this.canvas.height, this.upgrades);
        this.deliveredCount = 0;
        this.deliveredTypes = {};
        this.score = 100; // Reset level efficiency
        this.messages = [];
        
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
        const failScreen = document.getElementById('fail-screen');
        if (failScreen) failScreen.style.display = 'none';
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        const respawnScreen = document.getElementById('respawn-screen');
        if (respawnScreen) respawnScreen.classList.add('hidden');
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

    addMessage(text, color = '#f8fafc') {
        this.messages.push({
            text: text,
            color: color,
            life: 1.0, // fades out
            y: 120
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
        
        // Can only dispense if parked at the collection point
        if (this.physics.lander.landed && this.physics.lander.currentPad === 'collection') {
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

        // Toggle extraction button
        const btnExtract = document.getElementById('btn-extract');
        if (btnExtract) {
            if (this.deliveredCount >= level.targetCargo) {
                btnExtract.classList.remove('hidden');
            } else {
                btnExtract.classList.add('hidden');
            }
        }
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 16.666; // Normalized to 60fps
        this.lastTime = timestamp;

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
            if (lander.thrustingActive && lander.fuel > 0 && !lander.crashed) {
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

        // We check if the lander has landed safely on a delivery pad
        if (lander.landed && lander.currentPad && lander.currentPad !== 'sourcing') {
            const padType = lander.currentPad; // Matches the target color type, e.g. 'red', 'blue', 'green', 'normal'
            const hub = hubs.find(h => h.type === padType);
            
            // Search cargo boxes that are lying on the deck (close to the deck coordinates)
            const S = this.physics.BOX_SIZE;
            
            // Let's sweep boxes that are within the horizontal bounds of the hub's landing zone
            for (let i = boxes.length - 1; i >= 0; i--) {
                const box = boxes[i];
                const dx = box.x - hub.x;
                
                // If box is near the hub center (and close to the hub platform height)
                if (box.x >= hub.x - 30 && box.x <= hub.x + hub.width + 30 && box.y > hub.y - 60) {
                    // Check if cargo matches the hub's requirement
                    if (box.type === padType) {
                        // Sucked into the delivery intake (spark animations)
                        this.spawnDeliveryParticles(box.x, box.y, hub.color);
                        boxes.splice(i, 1);

                        this.deliveredCount++;
                        // Economy Loop: Deliveries grant cash instantly!
                        const deliveryReward = 200;
                        this.globalCash += deliveryReward;
                        localStorage.setItem('cargoLanderCash', this.globalCash);
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
        this.gameState = 'level_complete';
        if (!this.isMuted && window.CargoAudio) CargoAudio.playSuccess();
        
        document.getElementById('hud-overlay').style.display = 'none';
        
        const timeBonus = Math.floor(this.missionTimer) * 10;
        const totalPayout = this.missionBudget + timeBonus;
        
        this.globalCash += totalPayout;
        localStorage.setItem('cargoLanderCash', this.globalCash);
        
        document.getElementById('complete-screen').style.display = 'flex';
        document.getElementById('lvl-complete-title').textContent = "Extraction Successful!";
        document.getElementById('lvl-complete-details').innerHTML = `
            <p>Base Contract Payout: <span style="color: #10b981; font-weight:600;">$${this.missionBudget}</span></p>
            <p>Time Bonus: <span style="color: #38bdf8; font-weight:600;">+$${timeBonus}</span></p>
            <hr style="border:1px solid rgba(255,255,255,0.1);">
            <p>Total Global Cash: <span style="color: #f59e0b; font-weight:600;">$${this.globalCash}</span></p>
        `;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Draw Space Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.6, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. Draw Twinkling Stars
        for (const star of this.stars) {
            star.phase += star.twinkleSpeed;
            const alpha = 0.3 + Math.abs(Math.sin(star.phase)) * 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x % w, star.y % h, star.size, 0, Math.PI * 2);
            ctx.fill();
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

        // 7. Draw Boxes
        this.drawBoxes();

        // 8. Draw Lander
        this.drawLander();

        ctx.restore();

        // 9. WebGL Render for Particles and Monster
        if (this.shaders) {
            this.shaders.render(this.physics, this.camera);
        } else {
            // Fallback
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x, -this.camera.y);
            this.drawMonster();
            this.drawParticles();
            ctx.restore();
        }

        // 10. Draw UI Notifications directly on canvas
        this.drawNotifications();

        // 11. Draw Wind Indicator & Minimap
        if (this.gameState === 'playing') {
            this.drawWindIndicator();
            this.drawMinimap();
            
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
                
                // Warning text
                if (threatLevel > 0.3) {
                    ctx.fillStyle = `rgba(239, 68, 68, ${threatLevel * (0.5 + Math.sin(Date.now() / 100) * 0.5)})`;
                    ctx.font = 'bold 24px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText("WARNING: LEAVING SAFE ZONE", w/2, h/2 - 100);
                }
            }
        }
    }

    drawMinimap() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        
        // Minimap size and position
        const mmWidth = 240;
        const mmHeight = Math.max(120, mmWidth * (this.physics.levelHeight / this.physics.levelWidth));
        const mmX = cw - mmWidth - 20;
        const mmY = 20;
        
        // Premium Radar Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 10);
        } else {
            ctx.rect(mmX, mmY, mmWidth, mmHeight);
        }
        ctx.fill();
        ctx.stroke();

        // Subtle Grid Lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i = 1; i < 4; i++) {
            ctx.moveTo(mmX + (mmWidth/4)*i, mmY);
            ctx.lineTo(mmX + (mmWidth/4)*i, mmY + mmHeight);
            ctx.moveTo(mmX, mmY + (mmHeight/4)*i);
            ctx.lineTo(mmX + mmWidth, mmY + (mmHeight/4)*i);
        }
        ctx.stroke();
        
        // Scale factor
        const scaleX = mmWidth / this.physics.levelWidth;
        const scaleY = mmHeight / this.physics.levelHeight;
        
        ctx.save();
        ctx.translate(mmX, mmY);
        ctx.scale(scaleX, scaleY);
        
        // Draw Terrain Silhouette
        if (this.physics.terrainPoints.length > 0) {
            ctx.fillStyle = 'rgba(51, 65, 85, 0.6)';
            ctx.beginPath();
            ctx.moveTo(0, this.physics.levelHeight);
            for (const pt of this.physics.terrainPoints) {
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.lineTo(this.physics.levelWidth, this.physics.levelHeight);
            ctx.closePath();
            ctx.fill();
        }

        // Draw pads
        ctx.fillStyle = '#94a3b8';
        if (this.physics.startDepot) {
            const d = this.physics.startDepot;
            ctx.fillRect(d.x, d.y, d.width, Math.max(10, d.height)); // Ensures it's visible
        }
        if (this.physics.collectionPoint) {
            const cp = this.physics.collectionPoint;
            ctx.fillStyle = '#fbbf24'; // Yellow
            ctx.fillRect(cp.x, cp.y, cp.width, Math.max(10, cp.height));
        }
        for (const hub of this.physics.deliveryHubs) {
            ctx.fillStyle = hub.color || '#38bdf8';
            ctx.fillRect(hub.x, hub.y, hub.width, 20); // slightly thicker on radar
        }
        
        // Draw Boxes
        for (const box of this.physics.boxes) {
            ctx.fillStyle = box.color || '#fff';
            ctx.fillRect(box.x - 20, box.y - 20, 40, 40); // 40px in world space is nice on radar
        }
        
        // Draw Monster Blip
        if (this.physics.monster) {
            const m = this.physics.monster;
            ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(Date.now()/50)*0.5})`; // Fast strobe
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size, 0, Math.PI*2);
            ctx.fill();
        }

        // Draw Lander
        if (this.physics.lander) {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(this.physics.lander.x, this.physics.lander.y, 35, 0, Math.PI*2);
            ctx.fill();
            
            // Draw Viewport Rect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2 / scaleX; 
            const viewW = cw / this.camera.zoom;
            const viewH = this.canvas.height / this.camera.zoom;
            const viewX = this.camera.x - viewW / 2;
            const viewY = this.camera.y - viewH / 2;
            ctx.strokeRect(viewX, viewY, viewW, viewH);
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
                vehicleType: e.type === 'advanced' ? 'lander' : e.type, thrusting: true, 
                width: e.type === 'drone' ? 32 : 48, 
                height: e.type === 'drone' ? 16 : 32,
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
        const t = Date.now() / 1000; // seconds

        // Track age for entrance animation
        m.age = (m.age || 0) + 0.016;
        const entrance = Math.min(1, m.age / 1.5); // 1.5 s fade-in scale

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.scale(entrance, entrance);

        const R = m.size / 2; // core radius

        // ─── 1. Outer void glow (massive, soft) ───────────────────────────
        const outerGlow = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 3.5);
        outerGlow.addColorStop(0,   `hsla(270, 80%, 20%, ${0.55 + Math.sin(t * 1.3) * 0.1})`);
        outerGlow.addColorStop(0.35, `hsla(300, 70%, 12%, ${0.35 + Math.sin(t * 0.7) * 0.08})`);
        outerGlow.addColorStop(0.7,  'hsla(0, 80%, 10%, 0.15)');
        outerGlow.addColorStop(1,    'hsla(0, 0%, 0%, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // ─── 2. Writhing tentacles (12, layered glow) ────────────────────
        const tentacleCount = 12;
        for (let layer = 0; layer < 2; layer++) {
            const isGlow = layer === 0;
            ctx.lineWidth = isGlow ? 10 : 3;
            ctx.lineCap = 'round';

            for (let i = 0; i < tentacleCount; i++) {
                const baseAngle = (i / tentacleCount) * Math.PI * 2;
                const wobble  = Math.sin(t * 2.1 + i * 1.3) * 0.45;
                const angle   = baseAngle + wobble;
                const lenMod  = 1 + Math.sin(t * 1.7 + i * 0.9) * 0.35;
                const len     = R * (2.2 + i % 3 * 0.4) * lenMod;

                // Control points for cubic bezier
                const cpAngle1 = angle - 0.5 + Math.sin(t + i) * 0.3;
                const cpAngle2 = angle + 0.4 + Math.cos(t * 1.4 + i) * 0.3;
                const cp1x = Math.cos(cpAngle1) * len * 0.4;
                const cp1y = Math.sin(cpAngle1) * len * 0.4;
                const cp2x = Math.cos(cpAngle2) * len * 0.75;
                const cp2y = Math.sin(cpAngle2) * len * 0.75;
                const ex = Math.cos(angle) * len;
                const ey = Math.sin(angle) * len;

                // Color shifts from purple core to blood-red tips
                const hue  = 270 + (i / tentacleCount) * 90 + Math.sin(t + i) * 20;
                const lite = isGlow ? 30 : 55;
                const alp  = isGlow ? 0.18 : 0.85;
                ctx.strokeStyle = `hsla(${hue}, 90%, ${lite}%, ${alp})`;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
                ctx.stroke();

                // Crackling arc tips — small bright branch near the end
                if (!isGlow && Math.sin(t * 7 + i * 2.7) > 0.6) {
                    const sparkLen = R * 0.4;
                    const sparkAngle = angle + (Math.random() - 0.5) * 1.2;
                    ctx.strokeStyle = `hsla(${hue + 60}, 100%, 80%, 0.9)`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex + Math.cos(sparkAngle) * sparkLen, ey + Math.sin(sparkAngle) * sparkLen);
                    ctx.stroke();
                }
            }
        }

        // ─── 3. Pulsing nebula body ───────────────────────────────────────
        const pulse  = 1 + Math.sin(t * 3.5) * 0.07;
        const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * pulse);
        bodyGrad.addColorStop(0,   '#000010');
        bodyGrad.addColorStop(0.3, `hsla(280, 90%, 18%, 1)`);
        bodyGrad.addColorStop(0.65, `hsla(310, 80%, 14%, 1)`);
        bodyGrad.addColorStop(0.85, `hsla(0,   80%, 15%, 1)`);
        bodyGrad.addColorStop(1,   '#1a0010');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        // Slightly warped blob shape using sin offsets
        ctx.save();
        ctx.scale(1 + Math.sin(t * 2.3) * 0.04, 1 + Math.cos(t * 1.9) * 0.04);
        ctx.arc(0, 0, R * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ─── 4. Inner swirling vortex rings ──────────────────────────────
        for (let ring = 0; ring < 3; ring++) {
            const ringR = R * (0.25 + ring * 0.22);
            const ringAlpha = 0.6 - ring * 0.15;
            const ringHue   = 270 + ring * 30 + Math.sin(t * 2 + ring) * 20;
            ctx.strokeStyle = `hsla(${ringHue}, 90%, 55%, ${ringAlpha})`;
            ctx.lineWidth = 2 - ring * 0.4;
            ctx.beginPath();
            ctx.save();
            ctx.rotate(t * (1.5 + ring * 0.6) * (ring % 2 === 0 ? 1 : -1));
            // Elliptical ring for depth illusion
            ctx.scale(1, 0.35 + ring * 0.1);
            ctx.arc(0, 0, ringR, 0, Math.PI * 2);
            ctx.restore();
            ctx.stroke();
        }

        // ─── 5. Eye cluster ──────────────────────────────────────────────
        // Direction the monster is facing
        const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const faceAngle = speed > 0.1 ? Math.atan2(m.vy, m.vx) : 0;

        const eyePositions = [
            { ox: -0.28, oy: -0.18, r: 0.22 }, // left eye
            { ox:  0.3,  oy: -0.12, r: 0.28 }, // right eye (bigger)
            { ox:  0.05, oy:  0.25, r: 0.16 }, // lower center (third eye)
        ];

        for (const ep of eyePositions) {
            const ex = ep.ox * R;
            const ey = ep.oy * R;
            const er = ep.r  * R;

            // Sclera — pure void black
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(ex, ey, er, 0, Math.PI * 2);
            ctx.fill();

            // Iris gradient — molten amber/orange
            const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, er);
            irisGrad.addColorStop(0,   '#ff8c00');
            irisGrad.addColorStop(0.4, '#b91c1c');
            irisGrad.addColorStop(0.8, '#450a0a');
            irisGrad.addColorStop(1,   '#000');
            ctx.fillStyle = irisGrad;
            ctx.beginPath();
            ctx.arc(ex, ey, er * 0.85, 0, Math.PI * 2);
            ctx.fill();

            // Pupil — tracks movement direction
            const pupilX = ex + Math.cos(faceAngle) * er * 0.3;
            const pupilY = ey + Math.sin(faceAngle) * er * 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(pupilX, pupilY, er * 0.38, 0, Math.PI * 2);
            ctx.fill();

            // Glint
            ctx.fillStyle = `rgba(255,220,120,${0.7 + Math.sin(t * 4 + ep.r * 10) * 0.3})`;
            ctx.beginPath();
            ctx.arc(ex - er * 0.25, ey - er * 0.25, er * 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Eye glow ring
            ctx.strokeStyle = `hsla(30, 100%, 60%, ${0.4 + Math.sin(t * 5 + ep.ox * 10) * 0.3})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ex, ey, er * 1.1, 0, Math.PI * 2);
            ctx.stroke();
        }

        // ─── 6. Orbiting debris fragments ────────────────────────────────
        const debrisCount = 6;
        for (let i = 0; i < debrisCount; i++) {
            const debrisAngle = t * (1.2 + i * 0.15) + (i / debrisCount) * Math.PI * 2;
            const debrisR  = R * (1.35 + Math.sin(t * 2 + i * 1.4) * 0.2);
            const debrisX  = Math.cos(debrisAngle) * debrisR;
            const debrisY  = Math.sin(debrisAngle) * debrisR;
            const debrisSz = 3 + (i % 3) * 2;
            const debrisHue = 0 + Math.sin(t + i) * 30;
            ctx.fillStyle = `hsla(${debrisHue}, 90%, 55%, 0.8)`;
            ctx.beginPath();
            ctx.save();
            ctx.translate(debrisX, debrisY);
            ctx.rotate(debrisAngle * 2);
            ctx.fillRect(-debrisSz / 2, -debrisSz / 2, debrisSz, debrisSz);
            ctx.restore();
        }

        ctx.restore();
    }



    drawTerrain() {
        const ctx = this.ctx;
        if (this.physics.terrainPoints.length === 0) return;

        // Determine visible X range based on camera
        const zoom = this.camera.zoom;
        const w = this.canvas.width;
        const startX = Math.floor((this.camera.x - (w / 2 / zoom) - 100) / 20) * 20;
        const endX = this.camera.x + (w / 2 / zoom) + 100;
        
        // Main fill
        ctx.fillStyle = '#0b0f19';
        ctx.beginPath();
        ctx.moveTo(startX, this.physics.levelHeight + 1000);
        
        for (let x = startX; x <= endX; x += 20) {
            ctx.lineTo(x, this.physics.getTerrainHeight(x));
        }
        
        ctx.lineTo(endX, this.physics.levelHeight + 1000);
        ctx.closePath();
        ctx.fill();

        // Glowing hazard border line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += 20) {
            if (x === startX) ctx.moveTo(x, this.physics.getTerrainHeight(x));
            else ctx.lineTo(x, this.physics.getTerrainHeight(x));
        }
        ctx.stroke();

        // Ground texture lines
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 1;
        for (let x = startX; x <= endX; x += 60) {
            const y = this.physics.getTerrainHeight(x);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 10, y + 20 + (Math.abs(x) % 40));
            ctx.stroke();
        }
    }

    drawSourcingDepot() {
        const ctx = this.ctx;
        const start = this.physics.startDepot;
        const collection = this.physics.collectionPoint;

        // Draw Start Depot
        if (start) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(start.x, start.y, start.width, start.height);
            ctx.fillStyle = '#94a3b8'; // Neutral gray for start
            ctx.fillRect(start.x, start.y, start.width, 3);
            
            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("HQ", start.x + start.width / 2, start.y + 11);
        }

        // Draw Collection Point
        if (collection) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(collection.x, collection.y, collection.width, collection.height);
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

            // Holographic dispenser prompt when landed on it
            const lander = this.physics.lander;
            if (lander && lander.landed && lander.currentPad === 'collection') {
                ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
                ctx.font = '600 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("PRESS [SPACE] TO DISPENSE CARGO", collection.x + collection.width / 2, collection.y - 45);
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

            // Hub base
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(hub.x, hub.y, hub.width, hub.height);

            // Glowing boundary lines
            ctx.fillStyle = hub.color;
            ctx.fillRect(hub.x, hub.y, hub.width, 3);

            // Draw hub logo text
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 10px sans-serif';
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

            // Draw cardboard box background
            ctx.fillStyle = '#b45309';
            ctx.fillRect(-halfS, -halfS, S, S);

            // Draw darker brown border
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.strokeRect(-halfS, -halfS, S, S);

            // Draw packing tape across the middle
            ctx.fillStyle = 'rgba(253, 230, 138, 0.7)';
            ctx.fillRect(-halfS, -2, S, 4);

            // Outline the whole box in its type-color glow
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-halfS - 1, -halfS - 1, S + 2, S + 2);

            // Draw random content emoji inside cargo
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
            // Drone Rope (drawn in world space before translation)
            if (lander.ropeLength > 0) {
                ctx.strokeStyle = '#94a3b8'; // Rope color
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(lander.x, lander.y);
                ctx.lineTo(lander.grappleX || lander.x, lander.grappleY || lander.y + lander.ropeLength);
                ctx.stroke();

                // Grapple hook claw
                ctx.fillStyle = lander.grabbedBoxId ? '#ef4444' : '#e2e8f0';
                ctx.beginPath();
                ctx.arc(lander.grappleX || lander.x, lander.grappleY || lander.y + lander.ropeLength, 4, 0, Math.PI * 2);
                ctx.fill();
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
            // Draw Cargo Deck (Basket)
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3;
            const deckY = -lander.deckOffset;
            const hw = lander.deckWidth / 2;
            const bh = lander.basketHeight;

            ctx.beginPath();
            // Left wall top to left wall bottom
            ctx.moveTo(-hw, deckY - bh);
            ctx.lineTo(-hw, deckY);
            // Floor
            ctx.lineTo(hw, deckY);
            // Right wall bottom to right wall top
            ctx.lineTo(hw, deckY - bh);
            ctx.stroke();

            // Neon deck glow
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-hw + 1, deckY);
            ctx.lineTo(hw - 1, deckY);
            ctx.stroke();

            // Lander Pod Body
            const radGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, w/2);
            radGrad.addColorStop(0, '#1e293b');
            radGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = radGrad;
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(0, 4, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(0, -2, 6, Math.PI, 0);
            ctx.fill();

            // Draw Landing Legs
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(-10, 8);
            ctx.lineTo(-20, 16);
            ctx.lineTo(-24, 16);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, 8);
            ctx.lineTo(20, 16);
            ctx.lineTo(24, 16);
            ctx.stroke();

            // Bottom Thruster bell
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(-6, 12);
            ctx.lineTo(6, 12);
            ctx.lineTo(10, 20);
            ctx.lineTo(-10, 20);
            ctx.fill();
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
        
        for (let i = 0; i < this.messages.length; i++) {
            const m = this.messages[i];
            ctx.fillStyle = m.color;
            ctx.globalAlpha = m.life;
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText(m.text, this.canvas.width / 2, m.y - (i * 24));
        }
        ctx.globalAlpha = 1.0;
    }

    drawWindIndicator() {
        const ctx = this.ctx;
        const wind = this.physics.wind;
        if (Math.abs(wind) < 0.05) return;

        // Position at top center
        const cx = this.canvas.width / 2;
        const cy = 40;

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

// Global game singleton
const game = new CargoGame();
