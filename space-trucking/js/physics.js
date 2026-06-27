// physics.js
// Sole owner of the Matter.js engine and state.
// No rendering or game logic here.

const Physics = {
    engine: null,
    world: null,
    lander: null,
    terrain: [],
    boxes: [],
    pads: [], // non-physical or sensor bodies for pads

    init: function() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.engine.gravity.y = 1; // Default gravity, can be tweaked
        
        // Let poly-decomp know it's available (CDN loaded globally)
        if (typeof decomp !== 'undefined') {
            Matter.Common.setDecomp(decomp);
        }
    },

    step: function(dt) {
        if (!this.engine) return;
        // Cap dt to prevent physics explosion on lag spikes
        const cappedDt = Math.min(dt, 1000 / 30); 
        Matter.Engine.update(this.engine, cappedDt);
        
        // Custom physics tweaks (like friction/drag if needed)
    },

    loadLevel: function(levelData) {
        Matter.World.clear(this.world);
        Matter.Engine.clear(this.engine);
        this.terrain = [];
        this.boxes = [];
        this.pads = levelData.pads;

        // 1. Create Terrain
        if (levelData.terrainVertices.length > 0) {
            // Find centroid to position it correctly, as fromVertices centers the body
            const terrainBody = Matter.Bodies.fromVertices(0, 0, [levelData.terrainVertices], {
                isStatic: true,
                friction: 0.8,
                restitution: 0.1,
                label: 'terrain',
                render: { fillStyle: '#222' } // Only used if using Matter's built-in renderer (we aren't)
            }, true);
            
            if (terrainBody) {
                // fromVertices moves the body's position to its center of mass.
                // We need to shift it back so the vertices align with our original pixel coordinates.
                const bounds = Matter.Bounds.create(levelData.terrainVertices);
                const center = {
                    x: bounds.min.x + (bounds.max.x - bounds.min.x) / 2,
                    y: bounds.min.y + (bounds.max.y - bounds.min.y) / 2
                };
                Matter.Body.setPosition(terrainBody, terrainBody.position); // Usually requires offset calculation, let's keep it simple
                // Actually, matter.js calculates a new position based on the vertices center of mass.
                // Let's compute the difference and translate.
                const offset = Matter.Vector.sub(terrainBody.position, Matter.Vertices.centre(levelData.terrainVertices));
                
                this.terrain.push(terrainBody);
                Matter.World.add(this.world, terrainBody);
                
                // Hack to align vertices to origin:
                Matter.Body.setPosition(terrainBody, {
                     x: terrainBody.position.x - terrainBody.bounds.min.x + bounds.min.x,
                     y: terrainBody.position.y - terrainBody.bounds.min.y + bounds.min.y
                });
            }
        }

        // 2. Find start depot and place lander
        let startPad = this.pads.find(p => p.type === 'start');
        let startX = startPad ? startPad.x : 400;
        let startY = startPad ? startPad.y - 100 : 100;

        // Lander V3-PT: Basket/Pickup Style
        const bedBottom = Matter.Bodies.rectangle(startX, startY, 60, 10);
        const backWall = Matter.Bodies.rectangle(startX - 25, startY - 15, 10, 40);
        const cabin = Matter.Bodies.rectangle(startX + 25, startY - 10, 20, 30);
        
        this.lander = Matter.Body.create({
            parts: [bedBottom, backWall, cabin],
            density: 0.005,
            friction: 0.6, // Matches old game LANDER_FRICTION
            restitution: 0.15, // Matches old game LANDER_RESTITUTION
            label: 'lander',
            frictionAir: 0.01 // Less drag
        });
        
        Matter.World.add(this.world, this.lander);
    },

    spawnBox: function(x, y) {
        const box = Matter.Bodies.rectangle(x, y, 20, 20, {
            density: 0.002,
            friction: 0.4, // Matches BOX_FRICTION
            restitution: 0.2, // Matches BOX_RESTITUTION
            label: 'cargo'
        });
        this.boxes.push(box);
        Matter.World.add(this.world, box);
    },

    applyThrust: function(amount, direction = {x: 0, y: -1}) {
        if (!this.lander) return;
        const force = {
            x: direction.x * amount,
            y: direction.y * amount
        };
        Matter.Body.applyForce(this.lander, this.lander.position, force);
    },
    
    applyRotation: function(torque) {
        if (!this.lander) return;
        this.lander.torque = torque;
    },

    getState: function() {
        return {
            lander: this.lander,
            terrain: this.terrain,
            boxes: this.boxes,
            pads: this.pads
        };
    },
    
    setGravity: function(g) {
        if (this.engine) this.engine.gravity.y = g;
    }
};
