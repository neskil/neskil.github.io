// game.js
// Orchestrates physics, rendering, input, and game state.

const Game = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    camera: { x: 0, y: 0, scale: 0.5 },
    
    keys: {},
    thrusters: { main: false, left: false, right: false },
    
    debugDraw: false,
    running: false,
    
    // Config & State
    thrustPower: 0.003, // Tweakable via dev tools
    turnPower: 0.0005,
    fuel: 100,
    maxFuel: 100,
    health: 100,
    maxHealth: 100,
    score: 0,
    lastPickupTime: 0,
    hazards: [],
    assets: {},

    init: function() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();
        
        // Input binding
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        // Start screen
        window.addEventListener('keydown', e => {
            if (e.code === 'KeyB') {
                this.debugDraw = !this.debugDraw;
            }
            if (e.code === 'Space' && !this.running) {
                document.getElementById('startScreen').classList.add('hidden');
                this.start();
            }
        });
        
        Physics.init();
    },

    onResize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    loadAssets: async function() {
        const loadImg = (url) => new Promise((res) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = () => { console.warn('Asset not found:', url); res(null); };
            img.src = url;
        });

        this.assets.lander = await loadImg('assets/sprites/lander.png');
        this.assets.cargo = await loadImg('assets/sprites/cargo.png');
        this.assets.sandworm = await loadImg('assets/sprites/sandworm.png');
    },

    start: async function() {
        try {
            await this.loadAssets();
            const levelData = await LevelLoader.loadFromImage('levels/level_02.png');
            Physics.loadLevel(levelData);
            
            this.fuel = this.maxFuel;
            this.health = this.maxHealth;
            this.score = 0;
            this.lastPickupTime = performance.now();
            
            // Initialize hazards
            this.hazards = Physics.getState().pads
                .filter(p => p.type === 'hazard')
                .map(p => ({ x: p.x, y: p.y, state: 'idle', dangerLevel: 0, wormBody: null }));
            
            // Matter.js collision listener for crash damage
            Matter.Events.off(Physics.engine, 'collisionStart'); // clear previous
            Matter.Events.on(Physics.engine, 'collisionStart', (event) => {
                if (!this.running) return;
                event.pairs.forEach((pair) => {
                    let bodyA = pair.bodyA;
                    let bodyB = pair.bodyB;
                    
                    let isLanderA = bodyA.label === 'lander' || (bodyA.parent && bodyA.parent.label === 'lander');
                    let isLanderB = bodyB.label === 'lander' || (bodyB.parent && bodyB.parent.label === 'lander');
                    let isTerrainA = bodyA.label === 'terrain';
                    let isTerrainB = bodyB.label === 'terrain';
                    
                    if ((isLanderA && isTerrainB) || (isLanderB && isTerrainA)) {
                        let speed = Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y);
                        if (speed > 2.5) { // Crash threshold speed
                            let damage = (speed - 2.5) * 20;
                            this.health = Math.max(0, this.health - damage);
                            
                            // Spawn impact sparks
                            const lander = Physics.lander;
                            for (let i = 0; i < 15; i++) {
                                Particles.spawn(
                                    lander.position.x, lander.position.y,
                                    (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6,
                                    '#ff3300', 3 + Math.random() * 3, 20 + Math.random() * 20
                                );
                            }
                            
                            if (this.health <= 0) {
                                this.explodeLander();
                            }
                        }
                    }
                });
            });
            
            this.running = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop.bind(this));
        } catch (e) {
            console.error("Failed to load level:", e);
            alert("Could not load level_02.png! Make sure it exists.");
        }
    },

    explodeLander: function() {
        const lander = Physics.lander;
        if (!lander) return;
        
        for (let i = 0; i < 80; i++) {
            Particles.spawn(
                lander.position.x + (Math.random() - 0.5) * 40,
                lander.position.y + (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                Math.random() > 0.4 ? '#ff6600' : '#555555',
                5 + Math.random() * 8,
                40 + Math.random() * 40
            );
        }
        
        this.running = false;
        setTimeout(() => {
            this.start();
        }, 1500);
    },

    processInput: function() {
        this.thrusters.main = false;
        this.thrusters.left = false;
        this.thrusters.right = false;
        
        if (this.fuel > 0 && Physics.lander) {
            const angle = Physics.lander.angle;
            const pos = Physics.lander.position;

            if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                this.thrusters.main = true;
                const force = { x: Math.sin(angle), y: -Math.cos(angle) };
                Physics.applyThrust(this.thrustPower, force);
                this.fuel -= 0.1;

                // Spawn main thruster exhaust particles
                const ox = -Math.sin(angle) * 30;
                const oy = Math.cos(angle) * 30;
                Particles.spawn(
                    pos.x + ox + (Math.random() - 0.5) * 10,
                    pos.y + oy + (Math.random() - 0.5) * 10,
                    -Math.sin(angle) * 4 + (Math.random() - 0.5) * 2,
                    Math.cos(angle) * 4 + (Math.random() - 0.5) * 2,
                    Math.random() > 0.4 ? '#ff9900' : '#ffcc00',
                    3 + Math.random() * 3,
                    15 + Math.random() * 15
                );
            }
            
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.thrusters.left = true;
                Physics.applyRotation(-this.turnPower);
                this.fuel -= 0.05;

                // Fire right thruster to rotate left
                const rx = Math.cos(angle) * 35;
                const ry = Math.sin(angle) * 35;
                Particles.spawn(
                    pos.x + rx, pos.y + ry,
                    Math.cos(angle) * 3 + (Math.random() - 0.5) * 1,
                    Math.sin(angle) * 3 + (Math.random() - 0.5) * 1,
                    '#00ffff', 1 + Math.random() * 2, 10 + Math.random() * 10
                );
            }
            
            if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.thrusters.right = true;
                Physics.applyRotation(this.turnPower);
                this.fuel -= 0.05;

                // Fire left thruster to rotate right
                const lx = -Math.cos(angle) * 35;
                const ly = -Math.sin(angle) * 35;
                Particles.spawn(
                    pos.x + lx, pos.y + ly,
                    -Math.cos(angle) * 3 + (Math.random() - 0.5) * 1,
                    -Math.sin(angle) * 3 + (Math.random() - 0.5) * 1,
                    '#00ffff', 1 + Math.random() * 2, 10 + Math.random() * 10
                );
            }
        }
    },

    updateCamera: function() {
        if (!Physics.lander) return;
        
        // Smooth follow camera
        const targetX = Physics.lander.position.x;
        const targetY = Physics.lander.position.y;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    },

    updateGameLogic: function(dt, now) {
        const state = Physics.getState();
        
        // Check deliveries
        for (let i = state.boxes.length - 1; i >= 0; i--) {
            const box = state.boxes[i];
            for (const pad of state.pads) {
                if (pad.type.startsWith('hub')) {
                    // Spawn success burst particles
                    const dx = box.position.x - pad.x;
                    const dy = box.position.y - pad.y;
                    if (Math.abs(dx) < 30 && Math.abs(dy) < 20) {
                        for (let p = 0; p < 25; p++) {
                            Particles.spawn(
                                box.position.x, box.position.y,
                                (Math.random() - 0.5) * 5, -Math.random() * 5,
                                '#4caf50', 3 + Math.random() * 2, 30 + Math.random() * 20
                            );
                        }
                        Matter.World.remove(Physics.world, box);
                        state.boxes.splice(i, 1);
                        this.score++;
                        break;
                    }
                }
            }
        }
        
        // Check pickups
        if (now - this.lastPickupTime > 3000) {
            const pad = state.pads.find(p => p.type === 'start' || p.type === 'collection');
            if (pad && state.boxes.length < 3) { // keep some pressure by always having boxes
                 Physics.spawnBox(pad.x, pad.y - 50);
                 this.lastPickupTime = now;
            }
        }

        // Cargo burning logic
        for (let i = state.boxes.length - 1; i >= 0; i--) {
            const box = state.boxes[i];
            const isTouchingTerrain = Matter.Query.collides(box, state.terrain).length > 0;
            
            if (isTouchingTerrain) {
                box.burnTime = (box.burnTime || 0) + dt;
                
                // Spawn warning fire/smoke sparks
                if (Math.random() < 0.3) {
                    Particles.spawn(
                        box.position.x + (Math.random() - 0.5) * 20,
                        box.position.y + (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 1.5,
                        -Math.random() * 2 - 1,
                        Math.random() > 0.4 ? '#ff3300' : '#ff9900',
                        3 + Math.random() * 3,
                        15 + Math.random() * 15,
                        false
                    );
                }
                
                if (box.burnTime > 5000) { // 5 seconds fuse
                    // Explode box
                    for (let p = 0; p < 35; p++) {
                        Particles.spawn(
                            box.position.x, box.position.y,
                            (Math.random() - 0.5) * 7,
                            -Math.random() * 7,
                            '#ff3300',
                            4 + Math.random() * 4,
                            30 + Math.random() * 30
                        );
                    }
                    Matter.World.remove(Physics.world, box);
                    state.boxes.splice(i, 1);
                }
            } else {
                box.burnTime = 0;
            }
        }
        
        // Sandworm Proximity Hazard
        for (const hazard of this.hazards) {
            if (!Physics.lander) continue;
            const dist = Math.hypot(Physics.lander.position.x - hazard.x, Physics.lander.position.y - hazard.y);
            const DANGER_RADIUS = 300;
            
            if (hazard.state === 'idle') {
                if (dist < DANGER_RADIUS) {
                    hazard.dangerLevel += 0.005; // Fills up while inside
                    if (hazard.dangerLevel > 1) {
                        hazard.state = 'lunging';
                        hazard.lungeProgress = 0;
                        hazard.wormBody = Matter.Bodies.rectangle(hazard.x, hazard.y, 80, 400, {
                            isStatic: true,
                            label: 'sandworm'
                        });
                        Matter.World.add(Physics.world, hazard.wormBody);
                    }
                } else {
                    hazard.dangerLevel = Math.max(0, hazard.dangerLevel - 0.01);
                }
            } else if (hazard.state === 'lunging') {
                hazard.lungeProgress += 0.03; // Attack speed
                // Animate lunge upward
                const height = Math.sin(hazard.lungeProgress * Math.PI) * 200; 
                Matter.Body.setPosition(hazard.wormBody, { x: hazard.x, y: hazard.y - height + 200 }); // +200 is half height offset
                
                if (hazard.lungeProgress > 1) {
                    hazard.state = 'cooldown';
                    hazard.cooldownTime = now;
                    Matter.World.remove(Physics.world, hazard.wormBody);
                    hazard.wormBody = null;
                }
            } else if (hazard.state === 'cooldown') {
                if (now - hazard.cooldownTime > 3000) {
                    hazard.state = 'idle';
                    hazard.dangerLevel = 0;
                }
            }
        }
        
        // Refuel & heal at start pad when landed and thrusters off
        const startPad = state.pads.find(p => p.type === 'start');
        if (startPad && Physics.lander) {
            const dx = Physics.lander.position.x - startPad.x;
            const dy = Physics.lander.position.y - startPad.y;
            if (Math.abs(dx) < 50 && Math.abs(dy) < 40 && !this.thrusters.main) {
                this.fuel   = Math.min(this.maxFuel,   this.fuel   + 0.5);
                this.health = Math.min(this.maxHealth, this.health + 0.2);
            }
        }

        // --- UI Updates ---
        // Fuel bar
        const fuelPct = Math.max(0, (this.fuel / this.maxFuel) * 100);
        document.getElementById('fuelBar').style.width = fuelPct + '%';
        let fuelColor = '#4caf50';
        if (this.fuel < 30) fuelColor = '#f44336';
        else if (this.fuel < 60) fuelColor = '#ff9800';
        document.getElementById('fuelBar').style.backgroundColor = fuelColor;
        
        // Health bar
        const hpPct = Math.max(0, (this.health / this.maxHealth) * 100);
        document.getElementById('healthBar').style.width = hpPct + '%';
        let hpColor = '#e53935';
        if (this.health > 60) hpColor = '#c62828';
        else if (this.health <= 30) hpColor = '#b71c1c';
        document.getElementById('healthBar').style.backgroundColor = hpColor;
        
        document.getElementById('timerDisplay').innerText = `📦 ${this.score}`;
    },

    loop: function(now) {
        if (!this.running) return;
        
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.processInput();
        Physics.step(dt);
        this.updateGameLogic(dt, now);
        this.updateCamera();
        
        Particles.update();
        
        this.render();
        
        requestAnimationFrame(this.loop.bind(this));
    },

    render: function() {
        this.ctx.fillStyle = '#e6d8c8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const state = Physics.getState();
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw hazards
        Render.drawHazards(this.ctx, this.hazards, this.assets);
        
        Render.drawPads(this.ctx, state.pads);
        Render.drawTerrain(this.ctx, state.terrain);
        Render.drawBoxes(this.ctx, state.boxes, this.assets);
        Render.drawLander(this.ctx, state.lander, this.thrusters, this.assets);
        Render.drawParticles(this.ctx, Particles.pool);
        
        if (this.debugDraw) {
            Render.drawDebug(this.ctx, state);
        }
        
        this.ctx.restore();
    }
};

window.onload = () => Game.init();
