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
    
    // Config & State
    thrustPower: 0.003, // Tweakable via dev tools
    turnPower: 0.0005,
    fuel: 100,
    maxFuel: 100,
    score: 0,
    lastPickupTime: 0,
    hazards: [],
    
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

    start: async function() {
        try {
            const levelData = await LevelLoader.loadFromImage('levels/level_01.png');
            Physics.loadLevel(levelData);
            
            this.fuel = this.maxFuel;
            this.score = 0;
            this.lastPickupTime = performance.now();
            
            // Initialize hazards
            this.hazards = Physics.getState().pads
                .filter(p => p.type === 'hazard')
                .map(p => ({ x: p.x, y: p.y, state: 'idle', dangerLevel: 0, wormBody: null }));
            
            this.running = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop.bind(this));
        } catch (e) {
            console.error("Failed to load level:", e);
            alert("Could not load level_01.png! Make sure it exists.");
        }
    },

    processInput: function() {
        this.thrusters.main = false;
        this.thrusters.left = false;
        this.thrusters.right = false;
        
        if (this.fuel > 0) {
            if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                this.thrusters.main = true;
                const angle = Physics.lander.angle;
                const force = { x: Math.sin(angle), y: -Math.cos(angle) };
                Physics.applyThrust(this.thrustPower, force);
                this.fuel -= 0.1;
            }
            
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.thrusters.left = true;
                Physics.applyRotation(-this.turnPower);
                this.fuel -= 0.05;
            }
            
            if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.thrusters.right = true;
                Physics.applyRotation(this.turnPower);
                this.fuel -= 0.05;
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

    updateGameLogic: function(now) {
        const state = Physics.getState();
        
        // Check deliveries
        for (let i = state.boxes.length - 1; i >= 0; i--) {
            const box = state.boxes[i];
            for (const pad of state.pads) {
                if (pad.type.startsWith('hub')) {
                    // simple bounding box check
                    const dx = box.position.x - pad.x;
                    const dy = box.position.y - pad.y;
                    if (Math.abs(dx) < 30 && Math.abs(dy) < 20) {
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
        
        // Refuel at start pad if landed (simplified: near start pad)
        const startPad = state.pads.find(p => p.type === 'start');
        if (startPad && Physics.lander) {
            const dx = Physics.lander.position.x - startPad.x;
            const dy = Physics.lander.position.y - startPad.y;
            if (Math.abs(dx) < 50 && Math.abs(dy) < 40 && !this.thrusters.main) {
                this.fuel = Math.min(this.maxFuel, this.fuel + 0.5);
            }
        }

        // Update UI
        document.getElementById('fuelBar').style.width = Math.max(0, (this.fuel / this.maxFuel) * 100) + '%';
        
        // Change color based on fuel
        let color = '#4caf50';
        if(this.fuel < 30) color = '#f44336';
        else if (this.fuel < 60) color = '#ff9800';
        document.getElementById('fuelBar').style.backgroundColor = color;
        
        document.getElementById('timerDisplay').innerText = `Delivered: ${this.score}`;
    },

    loop: function(now) {
        if (!this.running) return;
        
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.processInput();
        Physics.step(dt);
        this.updateGameLogic(now);
        this.updateCamera();
        
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
        Render.drawHazards(this.ctx, this.hazards);
        
        Render.drawPads(this.ctx, state.pads);
        Render.drawTerrain(this.ctx, state.terrain);
        Render.drawBoxes(this.ctx, state.boxes);
        Render.drawLander(this.ctx, state.lander, this.thrusters);
        
        if (this.debugDraw) {
            Render.drawDebug(this.ctx, state);
        }
        
        this.ctx.restore();
    }
};

window.onload = () => Game.init();
