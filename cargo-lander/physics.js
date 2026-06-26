// CargoLander - Custom 2D Physics Engine
class CargoPhysics {
    constructor() {
        this.gravity = 0.15;
        this.wind = 0;
        this.terrainPoints = [];
        this.deliveryHubs = [];
        this.collectionPoint = null;
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

    initLevel(levelConfig, width, height, upgrades = {}) {
        this.levelWidth = 1600; // Huge horizontal space
        this.levelHeight = 900; // Huge vertical space
        this.gravity = levelConfig.gravity !== undefined ? levelConfig.gravity : 0.15;
        this.wind = levelConfig.wind !== undefined ? levelConfig.wind : 0;
        
        this.boxes = [];
        this.particles = [];
        this.monster = null; // The Out-Of-Bounds cosmic horror
        this.generateTerrain(levelConfig);
        this.spawnLander(levelConfig, upgrades);
    }

    generateTerrain(config) {
        const points = [];
        const w = this.levelWidth;
        const h = this.levelHeight;

        // Define Start Depot (Spawn Point)
        this.startDepot = {
            x: 80,
            y: h - 100,
            width: 80,
            height: 15
        };

        // Define Collection Point (Loading Pad)
        this.collectionPoint = {
            x: config.collectionX || 280,
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
            type: hub.type,
            name: hub.name || 'Terminal'
        }));

        // Generate heightmap nodes
        // Make sure we have flat areas at the pads
        const pads = [
            { left: this.startDepot.x - 20, right: this.startDepot.x + this.startDepot.width + 20, y: this.startDepot.y },
            { left: this.collectionPoint.x - 20, right: this.collectionPoint.x + this.collectionPoint.width + 20, y: this.collectionPoint.y }
        ];

        for (const hub of this.deliveryHubs) {
            pads.push({ left: hub.x - 20, right: hub.x + hub.width + 20, y: hub.y });
        }

        // Terrain resolution: point every 20 pixels
        const step = 20;
        for (let x = 0; x <= w; x += step) {
            let y = h - 60; // Default flat-ish height

            let inPad = false;
            for (const pad of pads) {
                if (x >= pad.left && x <= pad.right) {
                    y = pad.y;
                    inPad = true;
                    break;
                }
            }

            if (!inPad) {
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
                    } else if (config.terrainType === 'needle') {
                        // A flat terrain with a very narrow, deep pit for the delivery hub
                        // The pit is essentially a 40px wide shaft going down
                        const mid = w / 2;
                        const dist = Math.abs(x - mid);
                        if (x >= 650 && x <= 750) {
                            y = h - 40; // bottom of pit (where delivery hub will flatten it out)
                        } else {
                            y = h - 400; // high plateau
                        }
                    } else {
                        // Standard rolling hills
                        y = h - 100 + Math.sin(x * 0.01) * 40 + Math.cos(x * 0.03) * 15;
                    }
                }
            // Clamping y within canvas bounds
            y = Math.max(100, Math.min(y, h - 10));
            points.push({ x, y });
        }

        this.terrainPoints = points;
    }

    spawnLander(config, upgrades = {}) {
        const vehicleType = config.vehicle || 'lander';
        
        const ropeMax = 150 + (upgrades.winchExtender || 0) * 50;
        const maxIntegrity = 100 + (upgrades.hullPlating || 0) * 20;

        // Position lander centered on Start Depot pad
        this.lander = {
            vehicleType: vehicleType,
            x: this.startDepot.x + this.startDepot.width / 2,
            y: this.startDepot.y - 16,
            vx: 0,
            vy: 0,
            angle: 0,
            angularVelocity: 0,
            width: vehicleType === 'drone' ? 32 : 48,
            height: vehicleType === 'drone' ? 16 : 32,
            deckWidth: 80, // Larger basket size
            deckOffset: 12, // Pixels above center
            basketHeight: 25, // Side wall height for the basket
            fuel: 100,
            maxFuel: 100,
            integrity: maxIntegrity,
            maxIntegrity: maxIntegrity,
            thrustMultiplier: 1.0 + (upgrades.boostMode || 0) * 0.2,
            fuelEfficiency: 1.0 - (upgrades.thrusterEfficiency || 0) * 0.15,
            enginePower: 0, // Used for thrust interpolation
            strafePower: 0,
            magneticDeckActive: upgrades.magneticDeck > 0,
            magneticStrength: upgrades.magneticDeck > 0 ? (upgrades.magneticDeck * 0.2) : 0,
            thrusting: false,
            rotatingLeft: false,
            rotatingRight: false,
            extendingRope: false,
            retractingRope: false,
            ropeLength: 60,
            ropeMin: 20,
            ropeMax: ropeMax,
            grabbedBoxId: null,
            crashed: false,
            landed: true,
            currentPad: 'start'
        };
    }

    spawnCargo(type) {
        const emojis = {
            'red': ['🧨', '🧲', '🛢️', '🩸'],
            'blue': ['❄️', '🐟', '🧊', '💉'],
            'green': ['🍏', '🌿', '🔋', '🥑'],
            'normal': ['🍎', '🍌', '🔨', '🔧', '📦', '🧸']
        };
        const typeList = emojis[type] || emojis['normal'];
        const randomEmoji = typeList[Math.floor(Math.random() * typeList.length)];

        // Drop box gently from just above the collection point
        const newBox = {
            id: Math.random().toString(36).substr(2, 9),
            x: this.collectionPoint.x + this.collectionPoint.width / 2 + (Math.random() - 0.5) * 10,
            y: this.collectionPoint.y - 60,
            vx: 0,
            vy: 0,
            type: type, // 'red', 'blue', 'green'
            size: this.BOX_SIZE,
            mass: 1.0,
            onDeck: false,
            emoji: randomEmoji
        };
        this.boxes.push(newBox);
    }

    getTerrainHeight(x) {
        if (x < 0) {
            const anchorY = this.terrainPoints[0].y;
            // Generate rising procedural mountains to the left
            return anchorY + Math.sin(x * 0.02) * 50 - (1 - Math.cos(x * 0.005)) * 150;
        }
        if (x > this.levelWidth) {
            const anchorY = this.terrainPoints[this.terrainPoints.length - 1].y;
            const dx = x - this.levelWidth;
            // Generate rising procedural mountains to the right
            return anchorY + Math.sin(dx * 0.02) * 50 - (1 - Math.cos(dx * 0.005)) * 150;
        }

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
            nx: dy / len,      // Normal X
            ny: -dx / len      // Normal Y (points UP)
        };
    }

    update(dt, levelConfig, inputState) {
        if (this.lander.crashed) {
            this.updateParticles();
            return;
        }

        this.applyControls(dt, inputState);
        this.applyGravityAndWind(dt);
        this.integrateLander(dt);
        this.resolveLanderCollisions();
        this.applyGravityWell(levelConfig);

        this.updateBoxes(dt);
        this.updateMonster(dt);
        this.updateParticles();
    }

    updateMonster(dt) {
        const lander = this.lander;
        if (lander.crashed) return;

        // Spawn logic: Trigger if lander strays 150px out of bounds
        if (!this.monster && (lander.x < -150 || lander.x > this.levelWidth + 150)) {
            // Spawn monster from the deep below
            this.monster = {
                x: lander.x < -150 ? lander.x - 400 : lander.x + 400,
                y: this.levelHeight + 200,
                vx: 0,
                vy: -5,
                size: 80,
                roarTimer: 60
            };
            if (window.CargoAudio) CargoAudio.playCrash(); // Use crash as a temporary roar
        }

        if (this.monster) {
            const m = this.monster;
            
            // AI Chase Logic: Accelerate toward lander
            const dx = lander.x - m.x;
            const dy = lander.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const speed = 0.25; // Scary fast acceleration
                m.vx += (dx / dist) * speed;
                m.vy += (dy / dist) * speed;
            }
            
            // Dampen velocity to prevent infinite acceleration (max speed limit)
            m.vx *= 0.98;
            m.vy *= 0.98;
            
            m.x += m.vx;
            m.y += m.vy;

            // Lethal Contact!
            if (dist < m.size / 2 + lander.width / 2) {
                this.triggerExplosion();
            }
        }
    }

    applyControls(dt, inputState) {
        const lander = this.lander;
        if (lander.crashed) return;

        // Thrust Spooling Interpolation (0 to 1)
        const spoolSpeed = 0.05;
        const thrustInput = (inputState.up || inputState.mouseLeft) ? 1.0 : 0.0;
        lander.enginePower += (thrustInput - lander.enginePower) * spoolSpeed;

        let strafeInput = 0;
        if (inputState.left || inputState.q) strafeInput = -1.0;
        if (inputState.right || inputState.e || inputState.mouseRight) strafeInput = 1.0;
        lander.strafePower += (strafeInput - lander.strafePower) * spoolSpeed;

        const maxThrust = 0.55 * (lander.thrustMultiplier || 1.0);
        lander.thrusting = lander.enginePower > 0.1;

        if (lander.vehicleType === 'drone') {
            // DRONE KINEMATICS (Vertical specialist, rope mechanics)
            lander.angularVelocity *= 0.8;
            lander.angle -= lander.angle * 0.1; // Self-stabilize

            if (inputState.left) {
                lander.vx -= 0.15;
                lander.angle = Math.max(-0.4, lander.angle - 0.08); // Visual tilt
                lander.landed = false;
            }
            if (inputState.right) {
                lander.vx += 0.15;
                lander.angle = Math.min(0.4, lander.angle + 0.08);
                lander.landed = false;
            }

            // Auto-hover counters most gravity
            if (!lander.landed) {
                lander.vy -= this.gravity * 0.95; // Slight downward drift
            }

            if (lander.thrusting && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.06 * (lander.fuelEfficiency || 1.0) * lander.enginePower;
                lander.vy -= 0.3 * (lander.thrustMultiplier || 1.0) * lander.enginePower; // Ascend
            }

            // Rope mechanics
            if (inputState.e) {
                lander.ropeLength = Math.min(lander.ropeMax, lander.ropeLength + 3);
            }
            if (inputState.q) {
                lander.ropeLength = Math.max(lander.ropeMin, lander.ropeLength - 3);
            }
            
            // Track grapple hook position in world space
            lander.grappleX = lander.x - Math.sin(lander.angle) * (lander.height/2) + Math.sin(lander.angle) * lander.ropeLength;
            lander.grappleY = lander.y + Math.cos(lander.angle) * (lander.height/2) + Math.cos(lander.angle) * lander.ropeLength;

        } else if (lander.vehicleType === 'basic') {
            // BASIC LANDER (Upright stabilization, arcade movement)
            lander.angle = 0;
            lander.angularVelocity = 0;
            
            if (lander.thrusting && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.10 * (lander.fuelEfficiency || 1.0) * lander.enginePower;
                lander.vy -= maxThrust * lander.enginePower;
            }
            if (Math.abs(lander.strafePower) > 0.1 && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.05 * (lander.fuelEfficiency || 1.0) * Math.abs(lander.strafePower);
                lander.vx += (maxThrust * 0.6) * lander.strafePower;
            }

        } else {
            // ADVANCED LANDER (Mouse aim steering, high skill ceiling)
            if (inputState.mouseX !== undefined && inputState.mouseY !== undefined) {
                // Angle 0 is straight UP (y is negative)
                let targetAngle = Math.atan2(inputState.mouseX - lander.x, -(inputState.mouseY - lander.y));
                
                // Calculate shortest rotational distance
                let diff = targetAngle - lander.angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                
                // Apply torque towards cursor
                lander.angularVelocity += diff * 0.05;
                lander.landed = false;
            }

            lander.angularVelocity *= 0.85; // Dampening
            lander.angle += lander.angularVelocity;

            if (lander.thrusting && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.12 * (lander.fuelEfficiency || 1.0) * lander.enginePower; 

                const ax = Math.sin(lander.angle) * maxThrust * lander.enginePower;
                const ay = -Math.cos(lander.angle) * maxThrust * lander.enginePower;

                lander.vx += ax;
                lander.vy += ay;
            }
            
            if (Math.abs(lander.strafePower) > 0.1 && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.05 * (lander.fuelEfficiency || 1.0) * Math.abs(lander.strafePower);
                // Strafe is perpendicular to facing angle
                const sx = Math.cos(lander.angle) * maxThrust * 0.4 * lander.strafePower;
                const sy = Math.sin(lander.angle) * maxThrust * 0.4 * lander.strafePower;
                lander.vx += sx;
                lander.vy += sy;
            }
        }
        
        // Universal Exhaust particles (scaled by engine power)
        if (lander.thrusting && lander.fuel > 0 && Math.random() < lander.enginePower) {
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
                color: `hsla(${20 + Math.random() * 30}, 100%, 60%, ${lander.enginePower})`,
                size: 4 + Math.random() * 6 * lander.enginePower
            });
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
            
            // Check if landed at start depot or collection point
            if (groundPt.x >= this.startDepot.x && groundPt.x <= this.startDepot.x + this.startDepot.width) {
                if (Math.abs(groundPt.y - this.startDepot.y) < 5) {
                    onPad = true;
                    padType = 'start';
                }
            } else if (groundPt.x >= this.collectionPoint.x && groundPt.x <= this.collectionPoint.x + this.collectionPoint.width) {
                if (Math.abs(groundPt.y - this.collectionPoint.y) < 5) {
                    onPad = true;
                    padType = 'collection';
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
                
                // Slowly repair small damage when parked at start depot
                if (padType === 'start' && lander.integrity < lander.maxIntegrity) {
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
            box.vy += this.gravity;
            
            // Grapple physics (Distance Constraint)
            if (this.lander && this.lander.vehicleType === 'drone' && this.lander.grabbedBoxId === box.id) {
                // Attach point is the bottom center of the drone
                const attachX = this.lander.x - Math.sin(this.lander.angle) * (this.lander.height/2);
                const attachY = this.lander.y + Math.cos(this.lander.angle) * (this.lander.height/2);
                const dx = box.x - attachX;
                const dy = box.y - attachY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > this.lander.ropeLength) {
                    const diff = dist - this.lander.ropeLength;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // Pull box
                    box.x -= nx * diff;
                    box.y -= ny * diff;
                    
                    // Transfer velocity to emulate pendulum swinging
                    const rvx = box.vx - this.lander.vx;
                    const rvy = box.vy - this.lander.vy;
                    const rvn = rvx * nx + rvy * ny;
                    if (rvn > 0) {
                        box.vx -= rvn * nx;
                        box.vy -= rvn * ny;
                    }
                }
            }
            
            box.x += box.vx;
            box.y += box.vy;
            
            // Magnetic Deck Physics
            if (this.lander && this.lander.vehicleType === 'lander' && this.lander.magneticDeckActive && !this.lander.crashed) {
                const deckX = this.lander.x - Math.sin(this.lander.angle) * this.lander.deckOffset;
                const deckY = this.lander.y - Math.cos(this.lander.angle) * this.lander.deckOffset;
                
                const dx = deckX - box.x;
                const dy = deckY - box.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Pull range: 120 pixels
                if (dist > 0 && dist < 120) {
                    const pullFactor = (1 - dist / 120) * this.lander.magneticStrength;
                    box.vx += (dx / dist) * pullFactor;
                    box.vy += (dy / dist) * pullFactor;
                }
            }
            
            // Wind
            box.vx += this.wind * 0.01;
            // Drag
            box.vx *= 0.99;
            box.vy *= 0.99;
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
                // Deck Floor Collision!
                const pen = halfS - projN;
                if (pen > 0) {
                    box.x += nx * pen;
                    box.y += ny * pen;

                    const lvx = lander.vx;
                    const lvy = lander.vy;
                    const rvx = box.vx - lvx;
                    const rvy = box.vy - lvy;

                    const rvn = rvx * nx + rvy * ny;
                    if (rvn < 0) {
                        const imp = -(1 + this.BOX_RESTITUTION) * rvn;
                        box.vx += imp * nx;
                        box.vy += imp * ny;

                        const rvt = rvx * tx + rvy * ty;
                        const fImp = -this.BOX_FRICTION * rvt;
                        box.vx += fImp * tx;
                        box.vy += fImp * ty;
                    }
                }
            }

            // Left Wall Collision
            // The left wall goes from x = -halfW, up to y = basketHeight
            if (projT > -halfW - halfS && projT < -halfW + halfS && projN > -halfS && projN < lander.basketHeight) {
                const pen = (halfS) - Math.abs(projT + halfW);
                if (pen > 0) {
                    // Push out along tangent (positive x relative to lander)
                    box.x += tx * pen;
                    box.y += ty * pen;
                    
                    const rvx = box.vx - lander.vx;
                    const rvy = box.vy - lander.vy;
                    const rvt = rvx * tx + rvy * ty;
                    
                    if (rvt < 0) {
                        const imp = -(1 + this.BOX_RESTITUTION) * rvt;
                        box.vx += imp * tx;
                        box.vy += imp * ty;
                    }
                }
            }

            // Right Wall Collision
            // The right wall goes from x = halfW, up to y = basketHeight
            if (projT > halfW - halfS && projT < halfW + halfS && projN > -halfS && projN < lander.basketHeight) {
                const pen = (halfS) - Math.abs(projT - halfW);
                if (pen > 0) {
                    // Push out along negative tangent
                    box.x -= tx * pen;
                    box.y -= ty * pen;
                    
                    const rvx = box.vx - lander.vx;
                    const rvy = box.vy - lander.vy;
                    const rvt = rvx * tx + rvy * ty;
                    
                    if (rvt > 0) {
                        const imp = -(1 + this.BOX_RESTITUTION) * rvt;
                        box.vx += imp * tx;
                        box.vy += imp * ty;
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
