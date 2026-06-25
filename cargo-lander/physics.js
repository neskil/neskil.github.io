// CargoLander - Custom 2D Physics Engine
class CargoPhysics {
    constructor() {
        this.gravity = 0.15;
        this.wind = 0;
        this.terrainPoints = [];
        this.deliveryHubs = [];
        this.sourcingDepot = null;
        this.lander = null;
        this.boxes = [];
        this.particles = [];
        this.canvasWidth = 1000;
        this.canvasHeight = 600;

        // Physics constants
        this.BOX_SIZE = 20;
        this.BOX_RESTITUTION = 0.2;
        this.BOX_FRICTION = 0.4;
        this.LANDER_RESTITUTION = 0.15;
        this.LANDER_FRICTION = 0.6;
        this.SOLVER_ITERATIONS = 5; // Iterations for box-box stacking stability
    }

    initLevel(levelConfig, width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.gravity = levelConfig.gravity !== undefined ? levelConfig.gravity : 0.15;
        this.wind = levelConfig.wind !== undefined ? levelConfig.wind : 0;
        
        this.boxes = [];
        this.particles = [];
        this.generateTerrain(levelConfig);
        this.spawnLander(levelConfig);
    }

    generateTerrain(config) {
        const points = [];
        const w = this.canvasWidth;
        const h = this.canvasHeight;

        // Define Sourcing Depot (Start Pad)
        this.sourcingDepot = {
            x: 80,
            y: h - 100,
            width: 100,
            height: 15
        };

        // Define Delivery Hubs
        this.deliveryHubs = config.deliveryHubs.map(hub => ({
            x: hub.x,
            y: h - 100,
            width: hub.width || 80,
            height: 15,
            color: hub.color, // 'red', 'blue', 'green'
            type: hub.type
        }));

        // Generate heightmap nodes
        // Make sure we have flat areas at the sourcing depot and delivery hubs
        const depotLeft = this.sourcingDepot.x - 20;
        const depotRight = this.sourcingDepot.x + this.sourcingDepot.width + 20;

        const hubPads = this.deliveryHubs.map(hub => ({
            left: hub.x - 20,
            right: hub.x + hub.width + 20,
            y: hub.y
        }));

        // Terrain resolution: point every 20 pixels
        const step = 20;
        for (let x = 0; x <= w; x += step) {
            let y = h - 60; // Default flat-ish height

            // Check if inside Sourcing Depot
            if (x >= depotLeft && x <= depotRight) {
                y = this.sourcingDepot.y;
            } else {
                // Check if inside any Delivery Hub
                let inHub = false;
                for (const pad of hubPads) {
                    if (x >= pad.left && x <= pad.right) {
                        y = pad.y;
                        inHub = true;
                        break;
                    }
                }

                if (!inHub) {
                    // Generate landscape geometry based on level config
                    if (config.terrainType === 'mountain') {
                        // High mountain in the middle
                        const mid = w / 2;
                        const dist = Math.abs(x - mid);
                        const mountainH = Math.max(0, (w/2.5 - dist) * 1.5);
                        y = h - 60 - mountainH + Math.sin(x * 0.05) * 15;
                    } else if (config.terrainType === 'caves') {
                        // Jagged sharp pillars
                        y = h - 100 + Math.sin(x * 0.02) * 80 + Math.cos(x * 0.08) * 30;
                    } else if (config.terrainType === 'canyon') {
                        // Deep trench in the middle
                        const mid = w / 2;
                        const dist = Math.abs(x - mid);
                        let canyonDepth = 0;
                        if (dist < 150) {
                            canyonDepth = (150 - dist) * 1.8;
                        }
                        y = h - 100 + canyonDepth + Math.sin(x * 0.04) * 10;
                    } else {
                        // Standard rolling hills
                        y = h - 100 + Math.sin(x * 0.01) * 40 + Math.cos(x * 0.03) * 15;
                    }
                }
            }

            // Clamping y within canvas bounds
            y = Math.max(100, Math.min(y, h - 10));
            points.push({ x, y });
        }

        this.terrainPoints = points;
    }

    spawnLander(config) {
        // Position lander centered above Sourcing Depot
        this.lander = {
            x: this.sourcingDepot.x + this.sourcingDepot.width / 2,
            y: this.sourcingDepot.y - 40,
            vx: 0,
            vy: 0,
            angle: 0,
            angularVelocity: 0,
            width: 48,
            height: 32,
            deckWidth: 40, // Cargo platform size
            deckOffset: 12, // Pixels above center
            fuel: 100,
            maxFuel: 100,
            integrity: 100,
            maxIntegrity: 100,
            thrusting: false,
            rotatingLeft: false,
            rotatingRight: false,
            crashed: false,
            landed: true,
            currentPad: 'sourcing'
        };
    }

    spawnCargo(type) {
        // Drop box from dispenser above Sourcing Depot
        const newBox = {
            id: Math.random().toString(36).substr(2, 9),
            x: this.sourcingDepot.x + this.sourcingDepot.width / 2 + (Math.random() - 0.5) * 10,
            y: this.sourcingDepot.y - 180,
            vx: 0,
            vy: 2,
            type: type, // 'red', 'blue', 'green'
            size: this.BOX_SIZE,
            mass: 1.0,
            onDeck: false
        };
        this.boxes.push(newBox);
    }

    getTerrainHeight(x) {
        if (x < 0) x = 0;
        if (x > this.canvasWidth) x = this.canvasWidth;

        // Find containing segment
        let leftPt = this.terrainPoints[0];
        let rightPt = this.terrainPoints[this.terrainPoints.length - 1];

        for (let i = 0; i < this.terrainPoints.length - 1; i++) {
            if (x >= this.terrainPoints[i].x && x <= this.terrainPoints[i+1].x) {
                leftPt = this.terrainPoints[i];
                rightPt = this.terrainPoints[i+1];
                break;
            }
        }

        const ratio = (x - leftPt.x) / (rightPt.x - leftPt.x || 1);
        return leftPt.y + ratio * (rightPt.y - leftPt.y);
    }

    getTerrainSlope(x) {
        const delta = 5;
        const y1 = this.getTerrainHeight(x - delta);
        const y2 = this.getTerrainHeight(x + delta);
        
        const dx = delta * 2;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        return {
            tx: dx / len,
            ty: dy / len,
            nx: -dy / len,
            ny: dx / len
        };
    }

    update(dt, levelConfig) {
        if (this.lander.crashed) {
            this.updateParticles();
            return;
        }

        this.applyControls(dt);
        this.applyGravityAndWind(dt);
        this.integrateLander(dt);
        this.resolveLanderCollisions();
        this.applyGravityWell(levelConfig);

        this.updateBoxes(dt);
        this.updateParticles();
    }

    applyControls(dt) {
        const lander = this.lander;
        if (lander.crashed) return;

        // Rotation
        const torque = 0.004;
        if (lander.rotatingLeft) {
            lander.angularVelocity -= torque;
            lander.landed = false;
        }
        if (lander.rotatingRight) {
            lander.angularVelocity += torque;
            lander.landed = false;
        }

        // Apply angular damping
        lander.angularVelocity *= 0.96;
        lander.angle += lander.angularVelocity;

        // Thrust
        const thrustForce = 0.32;
        lander.thrusting = false;
        
        if (lander.thrustingActive && lander.fuel > 0) {
            lander.thrusting = true;
            lander.landed = false;
            lander.fuel -= 0.12; // Consume fuel

            // Add forces in lander up direction (-sin(angle), -cos(angle))
            const ax = Math.sin(lander.angle) * thrustForce;
            const ay = -Math.cos(lander.angle) * thrustForce;

            lander.vx += ax;
            lander.vy += ay;

            // Spawn exhaust particles
            if (Math.random() < 0.7) {
                const ex = lander.x + Math.sin(lander.angle) * 15 + (Math.random() - 0.5) * 6;
                const ey = lander.y + Math.cos(lander.angle) * 15 + (Math.random() - 0.5) * 6;
                const evx = lander.vx + Math.sin(lander.angle) * 4 + (Math.random() - 0.5) * 2;
                const evy = lander.vy + Math.cos(lander.angle) * 4 + (Math.random() - 0.5) * 2;
                
                this.particles.push({
                    x: ex,
                    y: ey,
                    vx: evx,
                    vy: evy,
                    life: 1.0,
                    decay: 0.04 + Math.random() * 0.03,
                    color: `hsla(${20 + Math.random() * 30}, 100%, 60%, 0.8)`,
                    size: 4 + Math.random() * 4
                });
            }
        }
    }

    applyGravityAndWind(dt) {
        const lander = this.lander;
        if (lander.landed) return;

        // Apply gravity
        lander.vy += this.gravity;

        // Apply wind (force proportional to lander area, simplified)
        lander.vx += this.wind * 0.02;

        // Air resistance damping
        lander.vx *= 0.995;
        lander.vy *= 0.995;
    }

    applyGravityWell(levelConfig) {
        if (!levelConfig.gravityWell) return;
        const well = levelConfig.gravityWell;
        const dx = well.x - this.lander.x;
        const dy = well.y - this.lander.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 20 && dist < well.radius) {
            // Force inverse proportional to distance
            const force = (well.strength * 10) / (dist * 0.1);
            this.lander.vx += (dx / dist) * force;
            this.lander.vy += (dy / dist) * force;
        }
    }

    integrateLander(dt) {
        const lander = this.lander;
        lander.x += lander.vx;
        lander.y += lander.vy;

        // Wrap around screen edges vertically/horizontally
        if (lander.x < 10) { lander.x = 10; lander.vx = 0; }
        if (lander.x > this.canvasWidth - 10) { lander.x = this.canvasWidth - 10; lander.vx = 0; }
        if (lander.y < 10) { lander.y = 10; lander.vy = 0; }
    }

    resolveLanderCollisions() {
        const lander = this.lander;
        if (lander.crashed) return;

        // Check 4 landing gear/corner points of the lander
        const hw = lander.width / 2;
        const hh = lander.height / 2;

        // Local points
        const corners = [
            { x: -hw, y: hh },  // Bottom Left
            { x: hw, y: hh },   // Bottom Right
            { x: -hw, y: -hh }, // Top Left
            { x: hw, y: -hh }   // Top Right
        ];

        let minPen = 0;
        let groundPt = null;
        let cWorld = null;

        for (const pt of corners) {
            // Rotate and translate to world space
            const wx = lander.x + pt.x * Math.cos(lander.angle) - pt.y * Math.sin(lander.angle);
            const wy = lander.y + pt.x * Math.sin(lander.angle) + pt.y * Math.cos(lander.angle);

            const gy = this.getTerrainHeight(wx);
            const pen = wy - gy;
            if (pen > minPen) {
                minPen = pen;
                groundPt = { x: wx, y: gy };
                cWorld = { x: wx, y: wy };
            }
        }

        if (minPen > 0) {
            // Handle collision
            const slope = this.getTerrainSlope(groundPt.x);
            
            // Determine if landing on a horizontal landing pad
            let onPad = false;
            let padType = null;
            
            // Check if landed at sourcing depot
            if (groundPt.x >= this.sourcingDepot.x && groundPt.x <= this.sourcingDepot.x + this.sourcingDepot.width) {
                if (Math.abs(groundPt.y - this.sourcingDepot.y) < 5) {
                    onPad = true;
                    padType = 'sourcing';
                }
            } else {
                // Check delivery hubs
                for (const hub of this.deliveryHubs) {
                    if (groundPt.x >= hub.x && groundPt.x <= hub.x + hub.width) {
                        if (Math.abs(groundPt.y - hub.y) < 5) {
                            onPad = true;
                            padType = hub.type;
                            break;
                        }
                    }
                }
            }

            // Normal speed and angle check for landing
            const speed = Math.sqrt(lander.vx * lander.vx + lander.vy * lander.vy);
            const angleDeg = Math.abs(lander.angle * 180 / Math.PI);
            
            const maxLandingSpeed = 2.0;
            const maxLandingAngle = 8.0; // degrees

            if (onPad && speed <= maxLandingSpeed && angleDeg <= maxLandingAngle) {
                // Safe Landing!
                lander.y -= minPen;
                lander.vy = 0;
                lander.vx = 0;
                lander.angularVelocity = 0;
                lander.angle = 0;
                lander.landed = true;
                lander.currentPad = padType;
                
                // Slowly repair small damage when parked at sourcing depot
                if (padType === 'sourcing' && lander.integrity < lander.maxIntegrity) {
                    lander.integrity = Math.min(lander.maxIntegrity, lander.integrity + 0.1);
                    // Slow fuel refill
                    lander.fuel = Math.min(lander.maxFuel, lander.fuel + 0.3);
                }
            } else {
                // Crash or Hard Hit
                const impactVel = speed;
                lander.landed = false;

                // Push out along slope normal
                lander.x += slope.nx * minPen;
                lander.y += slope.ny * minPen;

                // Reflect velocity with restitution
                const vn = lander.vx * slope.nx + lander.vy * slope.ny;
                if (vn < 0) {
                    lander.vx -= (1 + this.LANDER_RESTITUTION) * vn * slope.nx;
                    lander.vy -= (1 + this.LANDER_RESTITUTION) * vn * slope.ny;

                    // Apply friction
                    const vt = lander.vx * slope.tx + lander.vy * slope.ty;
                    lander.vx -= this.LANDER_FRICTION * vt * slope.tx;
                    lander.vy -= this.LANDER_FRICTION * vt * slope.ty;
                }

                // Apply hull damage
                if (impactVel > 1.2) {
                    const damage = Math.pow(impactVel - 1.2, 1.8) * 12;
                    lander.integrity -= damage;
                    
                    // Trigger sound in controller
                    if (window.CargoAudio) {
                        CargoAudio.playCollision(impactVel);
                    }

                    // Spark particles
                    for (let i = 0; i < 8; i++) {
                        this.particles.push({
                            x: cWorld.x,
                            y: cWorld.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6 - 2,
                            life: 1.0,
                            decay: 0.05 + Math.random() * 0.05,
                            color: '#e2e8f0',
                            size: 2 + Math.random() * 2
                        });
                    }

                    if (lander.integrity <= 0) {
                        this.triggerExplosion();
                    }
                }
            }
        } else {
            // Lander is in mid-air
            lander.landed = false;
            lander.currentPad = null;
        }
    }

    triggerExplosion() {
        const lander = this.lander;
        lander.crashed = true;
        lander.integrity = 0;
        lander.thrusting = false;

        if (window.CargoAudio) {
            CargoAudio.playCrash();
        }

        // Spawn tons of fire & smoke particles
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 6;
            this.particles.push({
                x: lander.x + (Math.random() - 0.5) * 15,
                y: lander.y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                color: Math.random() < 0.6 ? `hsla(${15 + Math.random() * 25}, 100%, 55%, 0.9)` : '#475569',
                size: 8 + Math.random() * 12
            });
        }
    }

    updateBoxes(dt) {
        const lander = this.lander;

        // Apply physical movements to all boxes in world space
        for (const box of this.boxes) {
            // Gravity
            box.vy += this.gravity;
            // Wind
            box.vx += this.wind * 0.01;
            // Drag
            box.vx *= 0.99;
            box.vy *= 0.99;

            // Integrate
            box.x += box.vx;
            box.y += box.vy;
        }

        // Solve collisions multiple times to ensure stability of stacked elements
        for (let iter = 0; iter < this.SOLVER_ITERATIONS; iter++) {
            this.resolveBoxTerrainCollisions();
            this.resolveBoxLanderDeckCollisions();
            this.resolveBoxBoxCollisions();
        }
    }

    resolveBoxTerrainCollisions() {
        const S = this.BOX_SIZE;
        const halfS = S / 2;

        for (const box of this.boxes) {
            const gy = this.getTerrainHeight(box.x);
            
            // Simple point check: if bottom of box goes under terrain
            if (box.y + halfS > gy) {
                const pen = (box.y + halfS) - gy;
                const slope = this.getTerrainSlope(box.x);

                // Push out along slope normal
                box.x += slope.nx * pen;
                box.y += slope.ny * pen;

                // Decompose and reflect velocity
                const vn = box.vx * slope.nx + box.vy * slope.ny;
                if (vn < 0) {
                    box.vx -= (1 + this.BOX_RESTITUTION) * vn * slope.nx;
                    box.vy -= (1 + this.BOX_RESTITUTION) * vn * slope.ny;

                    // Apply friction
                    const vt = box.vx * slope.tx + box.vy * slope.ty;
                    box.vx -= this.BOX_FRICTION * vt * slope.tx;
                    box.vy -= this.BOX_FRICTION * vt * slope.ty;
                }
            }
        }
    }

    resolveBoxLanderDeckCollisions() {
        const lander = this.lander;
        if (lander.crashed) return;

        const S = this.BOX_SIZE;
        const halfS = S / 2;

        // Deck coordinate calculation in world coordinates
        // Lander orientation vectors
        const cosA = Math.cos(lander.angle);
        const sinA = Math.sin(lander.angle);

        // Deck center position
        const dcx = lander.x - lander.deckOffset * sinA;
        const dcy = lander.y - lander.deckOffset * cosA;

        // Tangent and normal vectors of the deck
        // Tangent points along the deck width
        const tx = cosA;
        const ty = sinA;
        // Normal points outwards (up relative to lander)
        const nx = -sinA;
        const ny = -cosA;

        const halfW = lander.deckWidth / 2;

        for (const box of this.boxes) {
            // Rel position
            const rx = box.x - dcx;
            const ry = box.y - dcy;

            // Project onto tangent and normal
            const projT = rx * tx + ry * ty;
            const projN = rx * nx + ry * ny;

            // Collision check: box overlaps with deck segment horizontally & vertically
            if (Math.abs(projT) < halfW + halfS && projN > -halfS && projN < halfS + 5) {
                // We have a collision!
                // Penetration depth from above
                const pen = halfS - projN;
                if (pen > 0) {
                    // Push out along lander deck normal
                    box.x += nx * pen;
                    box.y += ny * pen;

                    // Lander linear velocity at deck (ignoring rotation factor for simplicity,
                    // but we can add linear transfer)
                    const lvx = lander.vx;
                    const lvy = lander.vy;

                    // Rel velocity
                    const rvx = box.vx - lvx;
                    const rvy = box.vy - lvy;

                    // Normal relative velocity
                    const rvn = rvx * nx + rvy * ny;
                    if (rvn < 0) {
                        // Apply restitution impulse
                        const imp = -(1 + this.BOX_RESTITUTION) * rvn;
                        box.vx += imp * nx;
                        box.vy += imp * ny;

                        // Apply friction along deck tangent
                        const rvt = rvx * tx + rvy * ty;
                        const fImp = -this.BOX_FRICTION * rvt;
                        box.vx += fImp * tx;
                        box.vy += fImp * ty;
                    }
                }
            }
        }
    }

    resolveBoxBoxCollisions() {
        const S = this.BOX_SIZE;
        const len = this.boxes.length;
        
        for (let i = 0; i < len; i++) {
            const b1 = this.boxes[i];
            for (let j = i + 1; j < len; j++) {
                const b2 = this.boxes[j];

                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                
                const overlapX = S - Math.abs(dx);
                const overlapY = S - Math.abs(dy);

                if (overlapX > 0 && overlapY > 0) {
                    // Box-box overlap detected!
                    // Resolve along axis of minimum penetration
                    if (overlapX < overlapY) {
                        // Resolve on X
                        const dir = dx > 0 ? 1 : -1;
                        const push = overlapX / 2;
                        
                        b1.x -= dir * push;
                        b2.x += dir * push;

                        // Swap/distribute velocities on X
                        const rvx = b2.vx - b1.vx;
                        if (rvx * dir < 0) {
                            const imp = -(1 + this.BOX_RESTITUTION) * rvx / 2;
                            b1.vx -= imp;
                            b2.vx += imp;

                            // Apply friction on Y
                            const rvy = b2.vy - b1.vy;
                            const fImp = this.BOX_FRICTION * rvy / 2;
                            b1.vy += fImp;
                            b2.vy -= fImp;
                        }
                    } else {
                        // Resolve on Y
                        const dir = dy > 0 ? 1 : -1;
                        const push = overlapY / 2;

                        b1.y -= dir * push;
                        b2.y += dir * push;

                        // Swap/distribute velocities on Y
                        const rvy = b2.vy - b1.vy;
                        if (rvy * dir < 0) {
                            const imp = -(1 + this.BOX_RESTITUTION) * rvy / 2;
                            b1.vy -= imp;
                            b2.vy += imp;

                            // Apply friction on X
                            const rvx = b2.vx - b1.vx;
                            const fImp = this.BOX_FRICTION * rvx / 2;
                            b1.vx += fImp;
                            b2.vx -= fImp;
                        }
                    }
                }
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.size = Math.max(0.5, p.size * 0.98);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}
