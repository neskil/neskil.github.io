// CargoLander - Game Core Loop & Renderer
const levels = [
    {
        name: "L1: Local Distribution",
        description: "Transport 3 standard packages to the Delivery Pad. Fly carefully - tilt too much and cargo will slide off!",
        gravity: 0.15,
        wind: 0,
        terrainType: "flat",
        targetCargo: 3,
        allowedTypes: ["normal"],
        deliveryHubs: [
            { x: 750, color: "#38bdf8", type: "normal", name: "Hub Alpha" }
        ],
        hint: "Tip: Land slowly (< 2.0 m/s) and keep your lander level (< 8 degrees) to land safely."
    },
    {
        name: "L4: Gravity Anomaly",
        description: "Warning: Unstable spacetime detected. A gravitational vortex is pulling you in. Counter the force and deliver safely.",
        gravity: 0.15,
        wind: 0,
        terrainType: "cave",
        targetCargo: 3,
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
        vehicle: "drone",
        gravity: 0.10,
        wind: 0,
        terrainType: "needle",
        targetCargo: 1,
        allowedTypes: ["normal"],
        collectionX: 180,
        deliveryHubs: [
            { x: 700, width: 25, color: "#38bdf8", type: "normal", name: "The Pit" }
        ],
        hint: "Hover over the pit. Use E to extend rope, Q to retract. SPACE drops cargo!"
    }
];

class CargoGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.physics = new CargoPhysics();
        
        // Game State
        this.gameState = 'menu'; // 'menu', 'playing', 'level_complete', 'game_over', 'victory'
        this.currentLevelIndex = 0;
        this.score = 100; // Efficiency rating %
        this.cash = 0;
        this.deliveredCount = 0;
        this.deliveredTypes = {}; // Tracks delivered cargo by type
        this.cargoSpawnCooldown = 0;
        this.stars = [];
        this.messages = []; // On-screen notifications
        
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

        // Start game loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() {
        // Fix coordinates to standard 1000x600 layout
        this.canvas.width = 1000;
        this.canvas.height = 600;
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

    startLevel(idx) {
        this.cash = 0;
        this.currentLevelIndex = idx;
        this.crashHandled = false;
        const level = levels[idx];
        
        this.physics.initLevel(level, this.canvas.width, this.canvas.height);
        this.deliveredCount = 0;
        this.deliveredTypes = {};
        this.score = 100; // Reset level efficiency
        this.messages = [];
        
        this.gameState = 'playing';
        this.addMessage("Level Started: " + level.name, "#6366f1");
        
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

    respawnLander() {
        if (this.cash >= 200) {
            this.cash -= 200;
        } else {
            this.cash = 0;
        }
        
        this.crashHandled = false;
        
        const respawnScreen = document.getElementById('respawn-screen');
        if (respawnScreen) respawnScreen.classList.add('hidden');
        
        const levelConfig = levels[this.currentLevelIndex];
        this.physics.spawnLander(levelConfig);
    }

    triggerCargoDispense() {
        if (!this.physics.lander) return;
        
        // Drone loading logic
        if (this.physics.lander.vehicleType === 'drone') {
            if (this.physics.lander.landed && this.physics.lander.currentPad === 'collection') {
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

        // Cash & Efficiency Text
        const efficiencyEl = document.getElementById('hud-efficiency');
        if (efficiencyEl) efficiencyEl.textContent = `Efficiency: ${Math.round(this.score)}%`;

        const cashEl = document.getElementById('hud-cash');
        if (cashEl) cashEl.textContent = `Cash: $${this.cash}`;

        const cargoEl = document.getElementById('hud-cargo');
        if (cargoEl) cargoEl.textContent = `Cargo: ${this.deliveredCount}/${level.targetCargo}`;
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
        const level = levels[this.currentLevelIndex];

        const keys = this.keys;

        // Apply inputs to physics lander
        lander.thrustingActive = keys['w'] || keys['arrowup'];
        lander.rotatingLeft = keys['a'] || keys['arrowleft'];
        lander.rotatingRight = keys['d'] || keys['arrowright'];
        lander.extendingRope = keys['e'];
        lander.retractingRope = keys['q'];

        this.physics.update(dt, levels[this.currentLevelIndex]);

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
                    if (respawnScreen) respawnScreen.classList.remove('hidden');
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
                        this.cash += 200;
                        this.score = Math.min(100, this.score + 8); // boost efficiency
                        
                        if (!this.isMuted) CargoAudio.playUnload();
                        this.addMessage(`Package Delivered! +$200`, "#10b981");

                        // Check Level Completion
                        if (this.deliveredCount >= level.targetCargo) {
                            this.triggerLevelComplete();
                        }
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
            if (box.y > terrainY + 50 || box.y > 620) {
                // Spawn smoke particles
                this.spawnDeliveryParticles(box.x, terrainY, "#475569");
                boxes.splice(i, 1);
                
                // Penalize score and cash
                this.score = Math.max(10, this.score - 10);
                this.cash = Math.max(0, this.cash - 50);
                this.addMessage("Cargo Damaged & Lost! -$50", "#ef4444");
            }
        }
    }

    spawnDeliveryParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.physics.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 1,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.03,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    triggerLevelComplete() {
        this.gameState = 'level_complete';
        if (!this.isMuted) CargoAudio.playSuccess();
        
        document.getElementById('complete-screen').style.display = 'flex';
        document.getElementById('hud-overlay').style.display = 'none';
        
        // Calculate efficiency rating
        const scorePercent = Math.round(this.score);
        document.getElementById('lvl-complete-title').textContent = "LEVEL COMPLETED!";
        document.getElementById('lvl-complete-details').innerHTML = `
            <p>Sourcing efficiency: <span style="color: #10b981; font-weight:600;">${scorePercent}%</span></p>
            <p>Cash bonus earned: <span style="color: #38bdf8; font-weight:600;">+$${scorePercent * 5}</span></p>
        `;
        
        this.cash += scorePercent * 5;
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
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }

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

        // 9. Draw Particles
        this.drawParticles();

        // 10. Draw UI Notifications directly on canvas
        this.drawNotifications();

        // 11. Draw Wind Indicator
        if (this.gameState === 'playing') {
            this.drawWindIndicator();
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

    drawTerrain() {
        const ctx = this.ctx;
        const pts = this.physics.terrainPoints;
        if (pts.length === 0) return;

        // Main fill
        ctx.fillStyle = '#0b0f19';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, this.canvas.height);
        
        for (const pt of pts) {
            ctx.lineTo(pt.x, pt.y);
        }
        
        ctx.lineTo(pts[pts.length - 1].x, this.canvas.height);
        ctx.closePath();
        ctx.fill();

        // Glowing hazard border line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Ground texture lines
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < pts.length; i += 4) {
            if (i >= pts.length) break;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[i].x, this.canvas.height);
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
