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
        this.BOX_SIZE = 28;
        this.BOX_RESTITUTION = 0.2;
        this.BOX_FRICTION = 0.4;
        this.LANDER_RESTITUTION = 0.15;
        this.LANDER_FRICTION = 0.6;
        this.SOLVER_ITERATIONS = 5; // Iterations for box-box stacking stability
    }

    initLevel(levelConfig, width, height, upgrades = {}) {
        this.levelWidth = 1600; // Huge horizontal space
        this.levelHeight = 1300; // Tall enough to fly well above terrain
        this.gravity = levelConfig.gravity !== undefined ? levelConfig.gravity : 0.15;
        this.wind = levelConfig.wind !== undefined ? levelConfig.wind : 0;
        
        this.boxes = [];
        this.particles = [];
        this.monster = null; // The Out-Of-Bounds cosmic horror
        this.ambientTraffic = [];
        this.trafficSpawnTimer = 0;
        this.generateTerrain(levelConfig);
        this.spawnLander(levelConfig, upgrades);
    }

    getRawTerrainHeight(x, terrainType, w, h) {
        if (terrainType === 'mountain') {
            const mid = w / 2;
            const dist = Math.abs(x - mid);
            const mountainH = Math.max(0, (w/2.5 - dist) * 1.5);
            return h - 60 - mountainH + Math.sin(x * 0.05) * 15;
        } else if (terrainType === 'caves' || terrainType === 'cave') {
            return h - 100 + Math.sin(x * 0.02) * 80 + Math.cos(x * 0.08) * 30;
        } else if (terrainType === 'canyon') {
            const mid = w / 2;
            const dist = Math.abs(x - mid);
            let canyonDepth = 0;
            if (dist < 150) {
                canyonDepth = (150 - dist) * 1.8;
            }
            return h - 100 + canyonDepth + Math.sin(x * 0.04) * 10;
        } else if (terrainType === 'worm-lair') {
            // X: 0 - 200: Plateau
            if (x < 200) return h - 400 + Math.sin(x * 0.05) * 10;
            // X: 200 - 450: Deep Pit for Cargo
            if (x >= 200 && x < 450) return h - 50 + Math.sin(x * 0.1) * 5;
            // X: 450 - 650: Lake Basin
            if (x >= 450 && x < 650) return h - 200 + Math.sin(x * 0.02) * 5;
            // X: 650 - 730: Central Plateau
            if (x >= 650 && x < 730) return h - 300 + Math.sin(x * 0.04) * 10;
            // X: 730 - 850: Sand Worm Pit
            if (x >= 730 && x < 850) return h - 100 + Math.cos(x * 0.05) * 15;
            // X: 850+: Slope to Drop-off
            return h - 350 + Math.sin(x * 0.03) * 15;
        } else if (terrainType === 'needle') {
            if (x >= 650 && x <= 750) {
                return h - 40; // bottom of pit
            } else {
                return h - 400; // plateau
            }
        } else {
            // Standard rolling hills
            let y = h - 100 + Math.sin(x * 0.01) * 40 + Math.cos(x * 0.03) * 15;
            if (terrainType === 'flat' && x >= 480 && x <= 720) {
                const center = 600;
                const radius = 120;
                const dist = Math.abs(x - center);
                const dip = (1 - dist / radius) * 48;
                if (dip > 0) y += dip;
            }
            return y;
        }
    }

    generateTerrain(config) {
        const points = [];
        const w = this.levelWidth;
        const h = this.levelHeight;

        const ps = config.padScale || 1.0;

        // Define Start Depot (Spawn Point) template
        this.startDepot = {
            x: 80,
            y: h - 100, // Updated dynamically
            width: Math.round(80 * ps),
            height: 15
        };

        // Define Collection Point (Loading Pad) template
        this.collectionPoint = {
            x: config.collectionX || 280,
            y: h - 100, // Updated dynamically
            width: Math.round(100 * ps),
            height: 15
        };

        // Define Delivery Hubs templates
        this.deliveryHubs = config.deliveryHubs.map(hub => ({
            x: hub.x,
            y: h - 100, // Updated dynamically
            width: Math.round((hub.width || 80) * ps),
            height: 15,
            color: hub.color,
            type: hub.type,
            name: hub.name || 'Terminal'
        }));

        // Dynamically compute y coordinates for all pads based on raw terrain height at their center
        const pads = [];
        
        // 1. Start Depot
        const startRawY = this.getRawTerrainHeight(this.startDepot.x + this.startDepot.width / 2, config.terrainType, w, h);
        this.startDepot.y = Math.max(100, Math.min(startRawY, h - 10));
        pads.push({ left: this.startDepot.x - 20, right: this.startDepot.x + this.startDepot.width + 20, y: this.startDepot.y });

        // 2. Collection Point
        const colRawY = this.getRawTerrainHeight(this.collectionPoint.x + this.collectionPoint.width / 2, config.terrainType, w, h);
        this.collectionPoint.y = Math.max(100, Math.min(colRawY, h - 10));
        pads.push({ left: this.collectionPoint.x - 20, right: this.collectionPoint.x + this.collectionPoint.width + 20, y: this.collectionPoint.y });

        // 3. Delivery Hubs
        for (const hub of this.deliveryHubs) {
            const hubRawY = this.getRawTerrainHeight(hub.x + hub.width / 2, config.terrainType, w, h);
            hub.y = Math.max(100, Math.min(hubRawY, h - 10));
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
                y = this.getRawTerrainHeight(x, config.terrainType, w, h);
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
            y: this.startDepot.y - 90,
            vx: 0,
            vy: 0,
            angle: 0,
            angularVelocity: 0,
            width: vehicleType === 'drone' ? 28 : 34,
            height: vehicleType === 'drone' ? 14 : 22,
            deckWidth: 56,
            deckOffset: 12, // Pixels above center
            basketHeight: 24, // Side wall height for the basket
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
            landed: false,
            currentPad: null
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
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        return {
            tx: dx / len,
            ty: dy / len,
            nx: dy / len,      // Normal X
            ny: -dx / len      // Normal Y (points UP)
        };
    }

    update(dt, levelConfig, inputState) {
        if (this.lander.crashed) {
            this.updateMonster(dt); // let the monster dive away & despawn
            this.updateParticles();
            return;
        }

        this.applyControls(dt, inputState);
        this.applyGravityAndWind(dt);
        this.integrateLander(dt);
        this._updateLegsDeployed();
        this.resolveLanderCollisions();
        this.applyGravityWell(levelConfig, dt);

        this.updateBoxes(dt);
        this.updateMonster(dt);
        this.updateAmbientTraffic(dt);
        this.updateParticles();
    }

    updateMonster(dt) {
        const lander = this.lander;

        // Once the lander is gone, the monster dives back into the depths and despawns.
        if (lander.crashed) {
            this.outOfBoundsTimer = 0;
            if (this.monster) {
                const m = this.monster;
                m.vy += 0.5 * dt;              // accelerate downward, retreating
                m.vx *= Math.pow(0.94, dt);
                m.x += m.vx * dt;
                m.y += m.vy * dt;

                if (!m.trail) m.trail = [];
                const lastTP = m.trail[0];
                if (!lastTP || Math.hypot(m.x - lastTP.x, m.y - lastTP.y) >= 2) {
                    m.trail.unshift({ x: m.x, y: m.y });
                    if (m.trail.length > 800) m.trail.pop();
                }

                // Fully gone once it has dived well below the level
                if (m.y > this.levelHeight + 400) this.monster = null;
            }
            return;
        }

        // Spawn logic: Trigger if lander strays out of bounds (including flying too high)
        if (lander.x < -500 || lander.x > this.levelWidth + 500 || lander.y < -600) {
            this.outOfBoundsTimer = (this.outOfBoundsTimer || 0) + dt;
        } else {
            this.outOfBoundsTimer = Math.max(0, (this.outOfBoundsTimer || 0) - dt * 2);
        }

        if (!this.monster && this.outOfBoundsTimer > 150) { // ~2.5 seconds at 60fps
            // Spawn monster from the deep below
            this.monster = {
                x: lander.x < -150 ? lander.x - 400 : lander.x + 400,
                y: this.levelHeight + 200,
                vx: 0,
                vy: -5,
                size: 130,
                roarTimer: 60,
                trail: [],
                speedIntegral: 0,
            };
            if (window.CargoAudio) CargoAudio.playCrash();
        }

        if (this.monster) {
            const m = this.monster;

            // AI Chase Logic: Accelerate toward lander
            const dx = lander.x - m.x;
            const dy = lander.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Integral accumulator: builds up when lander is escaping (moving away)
                const relVx = lander.vx - m.vx;
                const relVy = lander.vy - m.vy;
                const escapeDot = (relVx * dx + relVy * dy) / dist;
                m.speedIntegral = m.speedIntegral || 0;
                if (escapeDot > 0) {
                    m.speedIntegral = Math.min(1.2, m.speedIntegral + 0.003 * dt);
                } else {
                    m.speedIntegral = Math.max(0, m.speedIntegral - 0.001 * dt);
                }
                const speed = 0.25 + m.speedIntegral * 0.55;
                m.vx += (dx / dist) * speed * dt;
                m.vy += (dy / dist) * speed * dt;
            }

            // Dampen velocity
            m.vx *= Math.pow(0.98, dt);
            m.vy *= Math.pow(0.98, dt);
            
            m.x += m.vx * dt;
            m.y += m.vy * dt;

            // Record trail for body segments (distance-based, every 2px)
            if (!m.trail) m.trail = [];
            const lastTP = m.trail[0];
            if (!lastTP || Math.hypot(m.x - lastTP.x, m.y - lastTP.y) >= 2) {
                m.trail.unshift({ x: m.x, y: m.y });
                if (m.trail.length > 800) m.trail.pop();
            }

            // Lethal Contact — eat the lander. The crashed-state handler (above)
            // then makes the monster dive away and despawn on following frames.
            if (dist < m.size / 2 + lander.width / 2) {
                this.triggerExplosion();
                m.vy = Math.abs(m.vy) + 4; // kick it downward so the retreat reads clearly
                this.outOfBoundsTimer = 0;
            }
        }

        // --- Level 6: Sand Worm Logic ---
        if (this.currentLevelIndex === 5) {
            // Check Sand Worm trigger
            if (!this.sandWorm && !lander.crashed) {
                const wormPitCenter = 790;
                const distToPit = Math.abs(lander.x - wormPitCenter);
                if (distToPit < 500 && lander.y > this.levelHeight - 400) {
                    // Logarithmic drop-off for risk
                    const risk = Math.max(0, 1 - Math.log(Math.max(1, distToPit)) / Math.log(500));
                    const chance = risk * 0.005 * dt; // Random chance per frame
                    if (Math.random() < chance) {
                        this.sandWorm = {
                            x: wormPitCenter + (Math.random() - 0.5) * 40,
                            y: this.levelHeight + 150,
                            vx: (lander.x - wormPitCenter) * 0.035, // Slight predictive angle
                            vy: -22, // Fast upward lunge
                            state: 'lunging', // 'lunging' or 'retracting'
                            trail: []
                        };
                        if (window.CargoAudio) CargoAudio.playCrash(); // Use crash sound for roar
                    }
                }
            }

            // Update Sand Worm
            if (this.sandWorm) {
                const w = this.sandWorm;
                
                if (w.state === 'lunging') {
                    w.vy += 0.3 * dt; // Gravity pulling it back down
                    if (w.vy > 0) w.state = 'retracting';
                } else {
                    w.vy += 0.8 * dt; // Fall faster when retracting
                }
                
                w.x += w.vx * dt;
                w.y += w.vy * dt;
                
                // Record trail
                if (!w.trail) w.trail = [];
                const lastTP = w.trail[0];
                if (!lastTP || Math.hypot(w.x - lastTP.x, w.y - lastTP.y) >= 2) {
                    w.trail.unshift({ x: w.x, y: w.y });
                    if (w.trail.length > 500) w.trail.pop();
                }

                // Collision with lander (survivable, but damaging and knocks back)
                const dx = lander.x - w.x;
                const dy = lander.y - w.y;
                if (Math.hypot(dx, dy) < 70 && !lander.crashed) {
                    lander.vx += (dx / Math.hypot(dx, dy)) * 6;
                    lander.vy += -4; // Knock upwards
                    lander.integrity -= 30 * dt; // Damage over time while in contact
                    if (window.CargoAudio) CargoAudio.playCrash();
                    
                    // Add sparks
                    if (this.onCollision) {
                        for (let i = 0; i < 3; i++) {
                            this.onCollision(lander.x + (Math.random() - 0.5) * 20, lander.y + (Math.random() - 0.5) * 20, 2);
                        }
                    }
                }

                // Despawn if retracted deep enough
                if (w.y > this.levelHeight + 400 && w.state === 'retracting') {
                    this.sandWorm = null;
                }
            }
        }
    }


    applyControls(dt, inputState) {
        const lander = this.lander;
        if (lander.crashed) return;

        // Thrust: slow spool-up, instant cut-off (DEV_SPOOL overrides default)
        const spoolSpeed = (window.DEV_SPOOL ?? 0.06) * dt;
        const thrustInput = (inputState.up || inputState.mouseLeft) ? 1.0 : 0.0;
        if (thrustInput === 0) {
            lander.enginePower = 0; // Instant cut
        } else {
            lander.enginePower = Math.min(1, lander.enginePower + spoolSpeed);
        }

        let strafeInput = 0;
        if (inputState.left || inputState.q) strafeInput = -1.0;
        if (inputState.right || inputState.e || inputState.mouseRight) strafeInput = 1.0;
        if (strafeInput === 0) {
            lander.strafePower = 0; // Instant cut
        } else {
            lander.strafePower = Math.max(-1, Math.min(1, lander.strafePower + strafeInput * spoolSpeed));
        }

        const maxThrust = 0.55 * (lander.thrustMultiplier || 1.0);
        lander.thrusting = lander.enginePower > 0.1;

        if (lander.vehicleType === 'drone') {
            // DRONE KINEMATICS (Vertical specialist, rope mechanics)
            lander.angularVelocity *= Math.pow(0.8, dt);
            lander.angle -= lander.angle * Math.min(1, 0.1 * dt); // Self-stabilize

            if (inputState.left) {
                lander.vx -= 0.15 * dt;
                lander.angle = Math.max(-0.4, lander.angle - 0.08 * dt); // Visual tilt
                lander.landed = false;
            }
            if (inputState.right) {
                lander.vx += 0.15 * dt;
                lander.angle = Math.min(0.4, lander.angle + 0.08 * dt);
                lander.landed = false;
            }

            // Auto-hover counters most gravity
            if (!lander.landed) {
                lander.vy -= this.gravity * 0.95 * dt; // Slight downward drift
            }

            if (lander.thrusting && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.06 * (lander.fuelEfficiency || 1.0) * lander.enginePower * dt;
                lander.vy -= 0.15 * (lander.thrustMultiplier || 1.0) * lander.enginePower * dt; // Ascend (slower)
            }
            
            // Descent control (Task 5)
            if (inputState.down && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.03 * (lander.fuelEfficiency || 1.0) * dt;
                lander.vy += 0.25 * (lander.thrustMultiplier || 1.0) * dt; // Descend (faster)
            }

            // Rope mechanics
            if (inputState.e) {
                lander.ropeLength = Math.min(lander.ropeMax, lander.ropeLength + 3 * dt);
            }
            if (inputState.q) {
                lander.ropeLength = Math.max(lander.ropeMin, lander.ropeLength - 3 * dt);
            }
            
            // Track grapple hook — rope hangs OPPOSITE to tilt (swings back on acceleration)
            lander.grappleX = lander.x - Math.sin(lander.angle) * (lander.ropeLength + lander.height / 2);
            lander.grappleY = lander.y + Math.cos(lander.angle) * (lander.ropeLength + lander.height / 2);

        } else if (lander.vehicleType === 'basic') {
            // BASIC LANDER (Upright stabilization, arcade movement)
            lander.angle = 0;
            lander.angularVelocity = 0;
            
            if (lander.thrusting && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.10 * (lander.fuelEfficiency || 1.0) * (window.DEV_FUELBURN ?? 1) * lander.enginePower * dt;
                lander.vy -= maxThrust * lander.enginePower * dt;
            }
            if (Math.abs(lander.strafePower) > 0.1 && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.05 * (lander.fuelEfficiency || 1.0) * (window.DEV_FUELBURN ?? 1) * Math.abs(lander.strafePower) * dt;
                lander.vx += (maxThrust * 0.2) * (window.DEV_STRAFE ?? 1) * lander.strafePower * dt;
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
                lander.angularVelocity += diff * 0.05 * dt;
                lander.landed = false;
            }

            lander.angularVelocity *= Math.pow(0.85, dt); // Dampening
            lander.angle += lander.angularVelocity * dt;

            if (lander.thrusting && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.12 * (lander.fuelEfficiency || 1.0) * lander.enginePower * dt; 

                const ax = Math.sin(lander.angle) * maxThrust * lander.enginePower * dt;
                const ay = -Math.cos(lander.angle) * maxThrust * lander.enginePower * dt;

                lander.vx += ax;
                lander.vy += ay;
            }
            
            if (Math.abs(lander.strafePower) > 0.1 && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.05 * (lander.fuelEfficiency || 1.0) * Math.abs(lander.strafePower) * dt;
                // Strafe is perpendicular to facing angle
                const sx = Math.cos(lander.angle) * maxThrust * 0.4 * lander.strafePower * dt;
                const sy = Math.sin(lander.angle) * maxThrust * 0.4 * lander.strafePower * dt;
                lander.vx += sx;
                lander.vy += sy;
            }
        }
        
        lander.fuel = Math.max(0, lander.fuel);

        // Universal Exhaust particles (scaled by engine power)
        if (lander.thrusting && lander.fuel > 0 && Math.random() < lander.enginePower * dt) {
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
                decay: (0.04 + Math.random() * 0.03) * dt,
                color: `hsla(${20 + Math.random() * 30}, 100%, 60%, ${lander.enginePower})`,
                size: 4 + Math.random() * 6 * lander.enginePower
            });
        }
    }

    applyGravityAndWind(dt) {
        const lander = this.lander;
        if (lander.landed) return;

        // Apply gravity
        lander.vy += this.gravity * dt;

        // Apply wind (force proportional to lander area, simplified)
        lander.vx += this.wind * 0.02 * dt;

        // Minor random drifting for drone
        if (lander.vehicleType === 'drone') {
            lander.vx += (Math.random() - 0.5) * 0.02 * dt;
            lander.vy += (Math.random() - 0.5) * 0.01 * dt;
        }

        // Air resistance damping
        const _drag = window.DEV_DRAG ?? 0.995;
        lander.vx *= Math.pow(_drag, dt);
        lander.vy *= Math.pow(_drag, dt);
    }

    applyGravityWell(levelConfig, dt) {
        if (!levelConfig.gravityWell) return;
        const well = levelConfig.gravityWell;

        // Animate the well position so it drifts around its origin
        this.gravityWellTime = (this.gravityWellTime || 0) + dt * 0.008;
        const orbitR = well.orbitRadius || 180;
        const wx = well.x + Math.sin(this.gravityWellTime) * orbitR;
        const wy = well.y + Math.cos(this.gravityWellTime * 0.65) * orbitR * 0.55;

        // Expose current position so renderer can draw it
        this.gravityWellPos = { x: wx, y: wy, radius: well.radius, strength: well.strength };

        const dx = wx - this.lander.x;
        const dy = wy - this.lander.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 20 && dist < well.radius) {
            const force = (well.strength * 10) / (dist * 0.1);
            this.lander.vx += (dx / dist) * force * dt;
            this.lander.vy += (dy / dist) * force * dt;
        }
    }

    integrateLander(dt) {
        const lander = this.lander;
        lander.x += lander.vx * dt;
        lander.y += lander.vy * dt;

        if (lander.y < 10) { lander.y = 10; lander.vy = 0; }

        // Leg spring decay — only while on the ground; snap to 0 instantly when airborne
        if (lander.legCompress > 0) {
            if (lander.landed) {
                lander.legCompress = Math.max(0, lander.legCompress - 0.04 * dt);
            } else {
                lander.legCompress = 0;
            }
        }
    }

    _updateLegsDeployed() {
        const lander = this.lander;
        const DEPLOY_H = 110;  // horizontal radius from pad center
        const DEPLOY_V = 260;  // max height above pad to deploy

        const pads = [
            { cx: this.startDepot.x + this.startDepot.width / 2, y: this.startDepot.y, r: DEPLOY_H },
            { cx: this.collectionPoint.x + this.collectionPoint.width / 2, y: this.collectionPoint.y, r: DEPLOY_H },
            ...this.deliveryHubs.map(h => ({ cx: h.x + h.width / 2, y: h.y, r: DEPLOY_H }))
        ];

        lander.legsDeployed = false;
        for (const pad of pads) {
            if (Math.abs(lander.x - pad.cx) < pad.r && lander.y <= pad.y + 20 && lander.y >= pad.y - DEPLOY_V) {
                lander.legsDeployed = true;
                break;
            }
        }
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
            
            // Pad detection with generous x/y tolerance to prevent flickering
            const xTol = 30; // extra px on each side
            const yTol = 10;

            if (groundPt.x >= this.startDepot.x - xTol && groundPt.x <= this.startDepot.x + this.startDepot.width + xTol) {
                if (Math.abs(groundPt.y - this.startDepot.y) < yTol) {
                    onPad = true;
                    padType = 'start';
                }
            }
            if (!onPad && groundPt.x >= this.collectionPoint.x - xTol && groundPt.x <= this.collectionPoint.x + this.collectionPoint.width + xTol) {
                if (Math.abs(groundPt.y - this.collectionPoint.y) < yTol) {
                    onPad = true;
                    padType = 'collection';
                }
            }
            if (!onPad) {
                for (const hub of this.deliveryHubs) {
                    if (groundPt.x >= hub.x - xTol && groundPt.x <= hub.x + hub.width + xTol) {
                        if (Math.abs(groundPt.y - hub.y) < yTol) {
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
            
            // Spring legs deployed near a pad — much more forgiving thresholds
            const _baseLandSpd = window.DEV_LANDSPD ?? 2.0;
            const maxLandingSpeed = lander.legsDeployed ? _baseLandSpd * 2.25 : _baseLandSpd;
            const maxLandingAngle = lander.legsDeployed ? 18.0 : 8.0;

            if (onPad && speed <= maxLandingSpeed && angleDeg <= maxLandingAngle) {
                // Safe Landing — snap to pad on first contact only, then hold fixed
                if (!lander.landed) {
                    lander.y -= minPen;
                    lander.legCompress = Math.min(1, Math.max(0.4, speed * 0.5));
                }
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

                // Push out along slope normal to completely resolve vertical penetration
                const pushDist = minPen / Math.abs(slope.ny);
                lander.x += slope.nx * pushDist;
                lander.y += slope.ny * pushDist;

                // Reflect velocity with restitution
                const vn = lander.vx * slope.nx + lander.vy * slope.ny;
                if (vn < 0) {
                    lander.vx -= (1 + this.LANDER_RESTITUTION) * vn * slope.nx;
                    lander.vy -= (1 + this.LANDER_RESTITUTION) * vn * slope.ny;

                    // Apply friction
                    const vt = lander.vx * slope.tx + lander.vy * slope.ty;
                    lander.vx -= this.LANDER_FRICTION * vt * slope.tx;
                    lander.vy -= this.LANDER_FRICTION * vt * slope.ty;

                    // Spawn scraping dust/sparks when sliding
                    if (Math.abs(vt) > 0.8) {
                        if (Math.random() < 0.25) {
                            this.particles.push({
                                x: cWorld.x,
                                y: cWorld.y,
                                vx: -slope.tx * vt * 0.3 + (Math.random() - 0.5) * 1.5,
                                vy: -slope.ty * vt * 0.3 - Math.random() * 2,
                                life: 0.8,
                                decay: 0.04 + Math.random() * 0.04,
                                color: Math.random() > 0.4 ? '#f97316' : '#64748b', // sparks & dust
                                size: 1.5 + Math.random() * 2
                            });
                        }
                    }
                }

                // Apply hull damage.
                // Landing pads are forgiving (high threshold, low multiplier);
                // the jagged red terrain is unforgiving and bites hard.
                const damageThreshold = onPad ? (lander.legsDeployed ? 3.5 : 1.8) : 1.0;
                const surfaceMultiplier = onPad ? (lander.legsDeployed ? 1.5 : 3.5) : 16;

                if (impactVel > damageThreshold) {
                    const damage = Math.pow(impactVel - damageThreshold, 1.8) * surfaceMultiplier;
                    lander.integrity -= damage;

                    // Trigger sound in controller
                    if (window.CargoAudio) {
                        CargoAudio.playCollision(impactVel);
                    }

                    // Spark particles (more violent on raw terrain)
                    const sparkCount = onPad ? 6 : 16;
                    for (let i = 0; i < sparkCount; i++) {
                        this.particles.push({
                            x: cWorld.x,
                            y: cWorld.y,
                            vx: (Math.random() - 0.5) * 7,
                            vy: (Math.random() - 0.5) * 7 - 2,
                            life: 1.0,
                            decay: 0.04 + Math.random() * 0.04,
                            color: Math.random() > 0.45 ? '#fbbf24' : '#f97316', // Yellow and Orange sparks
                            size: 2.5 + Math.random() * 2.5
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
            box.vy += this.gravity * dt;
            
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
            
            box.x += box.vx * dt;
            box.y += box.vy * dt;
            
            // Magnetic Deck Physics
            if (this.lander && this.lander.vehicleType !== 'drone' && this.lander.magneticDeckActive && !this.lander.crashed) {
                const deckX = this.lander.x - Math.sin(this.lander.angle) * this.lander.deckOffset;
                const deckY = this.lander.y - Math.cos(this.lander.angle) * this.lander.deckOffset;
                
                const dx = deckX - box.x;
                const dy = deckY - box.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Pull range: 120 pixels
                if (dist > 0 && dist < 120) {
                    const pullFactor = (1 - dist / 120) * this.lander.magneticStrength * dt;
                    box.vx += (dx / dist) * pullFactor;
                    box.vy += (dy / dist) * pullFactor;
                }
            }
            
            // Wind
            box.vx += this.wind * 0.01 * dt;
            // Drag
            box.vx *= Math.pow(0.99, dt);
            box.vy *= Math.pow(0.99, dt);
        }

        // Solve collisions multiple times to ensure stability of stacked elements
        for (let iter = 0; iter < this.SOLVER_ITERATIONS; iter++) {
            this.resolveBoxTerrainCollisions();
            this.resolveBoxLanderDeckCollisions();
            this.resolveBoxBoxCollisions();
        }
        this.updateOnDeckStates();
    }

    updateOnDeckStates() {
        const lander = this.lander;
        if (!lander || lander.crashed) {
            for (const box of this.boxes) {
                box.onDeck = false;
            }
            return;
        }

        const cosA = Math.cos(lander.angle);
        const sinA = Math.sin(lander.angle);
        const dcx = lander.x - lander.deckOffset * sinA;
        const dcy = lander.y - lander.deckOffset * cosA;
        const tx = cosA;
        const ty = sinA;
        const nx = -sinA;
        const ny = -cosA;
        const halfW = lander.deckWidth / 2;
        const halfS = this.BOX_SIZE / 2;

        for (const box of this.boxes) {
            // Check if grabbed by drone
            if (lander.vehicleType === 'drone' && lander.grabbedBoxId === box.id) {
                box.onDeck = true;
                continue;
            }

            // Check if inside basic lander basket
            if (lander.vehicleType !== 'drone') {
                const rx = box.x - dcx;
                const ry = box.y - dcy;
                const projT = rx * tx + ry * ty;
                const projN = rx * nx + ry * ny;

                // Box center is within horizontal deck bounds and within a vertical zone above the deck floor
                if (Math.abs(projT) < halfW + 10 && projN >= -5 && projN < 100) {
                    box.onDeck = true;
                    continue;
                }
            }

            box.onDeck = false;
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

                // Push out along slope normal to resolve vertical penetration
                const pushDist = pen / Math.abs(slope.ny);
                box.x += slope.nx * pushDist;
                box.y += slope.ny * pushDist;

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

    updateAmbientTraffic(dt) {
        if (!this.ambientTraffic) this.ambientTraffic = [];

        // Spawn a new truck periodically (max 5 on screen)
        this.trafficSpawnTimer = (this.trafficSpawnTimer || 0) + dt;
        if (this.trafficSpawnTimer > 420 && this.ambientTraffic.length < 5) {
            this.trafficSpawnTimer = 0;
            const fromRight = Math.random() > 0.5;
            const minTerrainY = Math.min(...this.terrainPoints.map(p => p.y));
            const skyY = minTerrainY - 80 - Math.random() * 450;
            const model = Math.random() < 0.42 ? 'pickup' : 'freighter';
            const truckW = model === 'pickup' ? 55 + Math.random() * 50 : 80 + Math.random() * 120;
            const truckH = model === 'pickup' ? 20 + Math.random() * 10 : 16 + Math.random() * 18;
            const speed = 0.15 + Math.random() * 0.75;
            const palette = [
                { body: '#1e3a5f', accent: '#38bdf8', light: '#7dd3fc' },
                { body: '#2d1b4e', accent: '#a78bfa', light: '#c4b5fd' },
                { body: '#1a3a2a', accent: '#10b981', light: '#6ee7b7' },
                { body: '#3a2000', accent: '#f97316', light: '#fed7aa' },
                { body: '#3a1a1a', accent: '#ef4444', light: '#fca5a5' },
                { body: '#1a1a3a', accent: '#818cf8', light: '#c7d2fe' },
                { body: '#2a1a0a', accent: '#f59e0b', light: '#fde68a' },
            ];
            const col = palette[Math.floor(Math.random() * palette.length)];
            const willFlyOff = Math.random() < 0.3;
            const flyOffDelay = willFlyOff ? 300 + Math.random() * 600 : Infinity;
            this.ambientTraffic.push({
                x: fromRight ? this.levelWidth + truckW + 50 : -truckW - 50,
                y: Math.max(80, skyY),
                vy: 0,
                vx: fromRight ? -speed : speed,
                w: truckW,
                h: truckH,
                model,
                angle: 0,
                lightPhase: Math.random() * Math.PI * 2,
                bodyColor: col.body,
                accentColor: col.accent,
                lightColor: col.light,
                engineGlow: Math.random() > 0.4,
                hasCargoBox: model === 'pickup' && Math.random() < 0.45,
                flyOffTimer: flyOffDelay,
                flyingOff: false,
            });
        }

        for (let i = this.ambientTraffic.length - 1; i >= 0; i--) {
            const t = this.ambientTraffic[i];

            // Tick fly-off timer
            t.flyOffTimer -= dt;
            if (t.flyOffTimer <= 0 && !t.flyingOff) {
                t.flyingOff = true;
                // Tilt and accelerate away
                t.tiltTarget = (t.vx > 0 ? -1 : 1) * (0.4 + Math.random() * 0.6);
            }

            if (t.flyingOff) {
                t.angle += (t.tiltTarget - t.angle) * 0.04 * dt;
                t.vx *= 1 + 0.006 * dt;
                t.vy -= 0.08 * dt; // drift upward into space
            }

            t.x += t.vx * dt;
            t.y += t.vy * dt;
            t.lightPhase += 0.05 * dt;

            // Despawn once far off-screen or far above level
            if (t.x < -t.w - 400 || t.x > this.levelWidth + t.w + 400 || t.y < -600) {
                this.ambientTraffic.splice(i, 1);
                continue;
            }

            // Mild collision push
            if (this.lander && !this.lander.crashed) {
                const l = this.lander;
                const tx = t.x + t.w / 2;
                const overlapX = (t.w / 2 + l.width / 2) - Math.abs(l.x - tx);
                const overlapY = (t.h / 2 + l.height / 2) - Math.abs(l.y - t.y);
                if (overlapX > 0 && overlapY > 0) {
                    const impact = Math.abs(l.vx - t.vx) + Math.abs(l.vy);
                    l.integrity -= impact * 4;
                    l.vx += (l.x > tx ? 1 : -1) * 2;
                    l.vy -= 1.5;
                    if (l.integrity <= 0) this.triggerExplosion();
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
