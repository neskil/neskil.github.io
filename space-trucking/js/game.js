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
    
    // Config
    thrustPower: 0.003, // Tweakable via dev tools
    turnPower: 0.0005,
    
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
        // Load test level or wait for an asset to load
        try {
            // For now, load a local default. We will create level_01.png next.
            const levelData = await LevelLoader.loadFromImage('levels/level_01.png');
            Physics.loadLevel(levelData);
            
            // Spawn a test box near start pad if collection pad doesn't exist yet
            Physics.spawnBox(Physics.lander.position.x + 100, Physics.lander.position.y - 100);
            
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
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.thrusters.main = true;
            const angle = Physics.lander.angle;
            const force = { x: Math.sin(angle), y: -Math.cos(angle) };
            Physics.applyThrust(this.thrustPower, force);
        }
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.thrusters.left = true;
            Physics.applyRotation(-this.turnPower);
        }
        
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.thrusters.right = true;
            Physics.applyRotation(this.turnPower);
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

    loop: function(now) {
        if (!this.running) return;
        
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.processInput();
        Physics.step(dt);
        this.updateCamera();
        
        this.render();
        
        requestAnimationFrame(this.loop.bind(this));
    },

    render: function() {
        // Clear screen
        this.ctx.fillStyle = '#e6d8c8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const state = Physics.getState();
        
        this.ctx.save();
        
        // Setup camera transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw world
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
