// CargoLander - Custom 2D Physics Engine
class CargoPhysics {
    constructor() {
        this.gravity = 0.11;
        this.wind = 0;
        this.terrainPoints = [];
        this.deliveryHubs = [];
        this.collectionPoint = null;
        this.lander = null;
        this.boxes = [];
        this.particles = [];
        this.canvasWidth = 1000;
        this.canvasHeight = 600;

        // Engine / Global Defaults
        this.LANDER_THRUST = 0.08;
        this.LANDER_DRAG = 0.985;
        this.BOX_SIZE = 22;
        this.BOX_RESTITUTION = 0.2;
        this.BOX_FRICTION = 0.4;
        this.LANDER_RESTITUTION = 0.15;
        this.LANDER_FRICTION = 0.6;
        this.segments = []; // Arbitrary line-segment obstacles defined per level

        // Matter.js — handles box/terrain/segment/lander collision
        this.matterEngine = null;
        this.matterWorld = null;
        this.boxBodyMap = new Map(); // box.id → Matter.Body
        this.landerBody = null;      // lander rigid body
        // Force scale: converts game velocity-per-frame to Matter force units.
        // Derived from delta_v = (force/mass) * deltaTime² with fixed 16.666ms step.
        this.MATTER_FORCE_SCALE = 1 / (16.666 * 16.666);
    }

    initLevel(levelConfig, width, height, upgrades = {}) {
        this.levelWidth = 1600; // Huge horizontal space
        this.levelHeight = 1300; // Tall enough to fly well above terrain
        this.currentLevelConfig = levelConfig; // Store for ceiling/terrain queries
        this.gravity = levelConfig.gravity !== undefined ? levelConfig.gravity : 0.09;
        this.wind = levelConfig.wind !== undefined ? levelConfig.wind : 0;
        
        this.boxes = [];
        this.particles = [];
        this.monster = null; // The Out-Of-Bounds cosmic horror
        this.ambientTraffic = [];
        this.trafficSpawnTimer = 0;
        this.segments = levelConfig.segments ? levelConfig.segments.map(s => ({ ...s })) : [];
        this._buildMatterWorld();
        this.generateTerrain(levelConfig);
        this.spawnLander(levelConfig, upgrades);
    }

    // Old procedural terrain functions removed

    _buildMatterWorld() {
        // Recreate the Matter engine for this level
        if (this.matterEngine) {
            Matter.World.clear(this.matterWorld);
            Matter.Engine.clear(this.matterEngine);
        }
        this.matterEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
        this.matterWorld = this.matterEngine.world;
        this.boxBodyMap = new Map();

        // One damage event per engine step (deduplicate multiple terrain pairs)
        Matter.Events.on(this.matterEngine, 'collisionStart', (event) => {
            if (!this.lander || !this.landerBody || window.DEV_INVULNERABLE) return;
            let processed = false;
            for (const pair of event.pairs) {
                if (pair.bodyA !== this.landerBody && pair.bodyB !== this.landerBody) continue;
                if (processed) continue;
                processed = true;
                const lv = this.landerBody.velocity; // pre-impulse at collisionStart time
                const impactSpeed = Math.sqrt(lv.x * lv.x + lv.y * lv.y);
                if (impactSpeed < 1.0) continue;
                const onPad = this._getLanderPad() !== null;
                const damageThreshold = onPad ? (this.lander.legsDeployed ? 3.5 : 1.8) : 1.0;
                const surfaceMultiplier = onPad ? (this.lander.legsDeployed ? 1.5 : 3.5) : 16;
                if (impactSpeed > damageThreshold) {
                    const damage = Math.pow(impactSpeed - damageThreshold, 1.8) * surfaceMultiplier;
                    this.lander.integrity -= damage;
                    if (window.CargoAudio) CargoAudio.playCollision(impactSpeed);
                    const sup = pair.collision.supports?.[0] || { x: this.lander.x, y: this.lander.y };
                    const sparkCount = onPad ? 6 : 16;
                    for (let i = 0; i < sparkCount; i++) {
                        this.particles.push({
                            x: sup.x, y: sup.y,
                            vx: (Math.random() - 0.5) * 7,
                            vy: (Math.random() - 0.5) * 7 - 2,
                            life: 1.0, decay: 0.04 + Math.random() * 0.04,
                            color: Math.random() > 0.45 ? '#fbbf24' : '#f97316',
                            size: 2.5 + Math.random() * 2.5,
                        });
                    }
                    if (this.lander.integrity <= 0) this.lander.crashed = true;
                }
            }
        });
    }

    getPolygonSurfaceY(targetX) {
        let maxSurfaceY = 0; // The lowest physical surface (largest Y on screen) that we find
        for (const poly of this.terrainPolygons) {
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i];
                const p2 = poly[(i + 1) % poly.length];
                if ((p1.x <= targetX && p2.x >= targetX) || (p2.x <= targetX && p1.x >= targetX)) {
                    if (p1.x === p2.x) continue;
                    const ratio = (targetX - p1.x) / (p2.x - p1.x);
                    const y = p1.y + ratio * (p2.y - p1.y);
                    if (maxSurfaceY === 0 || y < maxSurfaceY) {
                        maxSurfaceY = y;
                    }
                }
            }
        }
        return maxSurfaceY || this.levelHeight * 0.7;
    }

    generateTerrain(config) {
        const w = this.levelWidth;
        const h = this.levelHeight;
        this.terrainPolygons = config.terrainPolygons || [];
        
        const ps = config.padScale || 1.0;
        this.startDepot = { x: 80, y: h - 100, width: Math.round(80 * ps), height: 15 };
        this.collectionPoint = { x: config.collectionX || 280, y: h - 100, width: Math.round(100 * ps), height: 15 };
        this.deliveryHubs = config.deliveryHubs.map(hub => ({
            x: hub.x, y: h - 100, width: Math.round((hub.width || 80) * ps), height: 15,
            color: hub.color, type: hub.type, name: hub.name || 'Terminal'
        }));

        this.startDepot.y = this.getPolygonSurfaceY(this.startDepot.x + this.startDepot.width / 2);
        this.collectionPoint.y = this.getPolygonSurfaceY(this.collectionPoint.x + this.collectionPoint.width / 2);
        for (const hub of this.deliveryHubs) {
            hub.y = this.getPolygonSurfaceY(hub.x + hub.width / 2);
        }

        for (const poly of this.terrainPolygons) {
            const THICKNESS = 40;
            for (let i = 0; i < poly.length - 1; i++) {
                const p1 = poly[i], p2 = poly[i+1];
                const cx = (p1.x + p2.x) / 2;
                const cy = (p1.y + p2.y) / 2;
                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len < 1) continue;
                
                const angle = Math.atan2(dy, dx);
                const normX = -Math.sin(angle);
                const normY = Math.cos(angle);
                const body = Matter.Bodies.rectangle(
                    cx + normX * THICKNESS / 2,
                    cy + normY * THICKNESS / 2,
                    len + 4, THICKNESS, {
                        isStatic: true,
                        angle: angle,
                        friction: this.LANDER_FRICTION,
                        restitution: this.BOX_RESTITUTION,
                        label: 'terrain',
                        collisionFilter: { category: 0x0002, mask: 0x0001 | 0x0008 },
                    }
                );
                Matter.Composite.add(this.matterWorld, body);

                // Add to segments so the custom lander kinematic loop collides with it
                this.segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            }
        }

        [
            Matter.Bodies.rectangle(w / 2, h + 200, w + 4000, 120, { isStatic: true, label: 'wall' }),
            Matter.Bodies.rectangle(-4000, h / 2, 120, h * 4, { isStatic: true, label: 'wall' }),
            Matter.Bodies.rectangle(w + 4000, h / 2, 120, h * 4, { isStatic: true, label: 'wall' }),
        ].forEach(b => {
            b.collisionFilter = { category: 0x0002, mask: 0x0001 | 0x0008 };
            Matter.Composite.add(this.matterWorld, b);
        });

        for (const seg of this.segments) {
            const cx = (seg.x1 + seg.x2) / 2;
            const cy = (seg.y1 + seg.y2) / 2;
            const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const body = Matter.Bodies.rectangle(cx, cy, len, 10, {
                isStatic: true,
                angle: angle,
                friction: this.BOX_FRICTION,
                restitution: this.BOX_RESTITUTION,
                label: 'segment',
                collisionFilter: { category: 0x0004, mask: 0x0001 | 0x0008 },
            });
            Matter.Composite.add(this.matterWorld, body);
        }
    }

    spawnLander(config, upgrades = {}) {
        const vehicleType = config.vehicle || 'lander';
        
        const ropeMax = config.ropeLength || 120;
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
            ropeLength: ropeMax,
            grabbedBoxId: null,
            crashed: false,
            landed: false,
            currentPad: null
        };
        this._spawnLanderBody();
    }

    _spawnLanderBody() {
        if (!this.matterWorld) return;
        if (this.landerBody) {
            Matter.Composite.remove(this.matterWorld, this.landerBody);
            this.landerBody = null;
        }
        const l = this.lander;
        this.landerBody = Matter.Bodies.rectangle(l.x, l.y, l.width, l.height, {
            isStatic: false,
            frictionAir: 0,
            friction: this.LANDER_FRICTION,
            restitution: this.LANDER_RESTITUTION,
            label: 'lander',
            collisionFilter: { category: 0x0008, mask: 0x0002 | 0x0004 },
        });
        Matter.Body.setMass(this.landerBody, Infinity);
        Matter.Body.setInertia(this.landerBody, Infinity);
        Matter.Composite.add(this.matterWorld, this.landerBody);

    }

    _getLanderPad() {
        const l = this.lander;
        if (!l) return null;
        const xTol = 30;
        if (l.x >= this.startDepot.x - xTol && l.x <= this.startDepot.x + this.startDepot.width + xTol) return 'start';
        if (l.x >= this.collectionPoint.x - xTol && l.x <= this.collectionPoint.x + this.collectionPoint.width + xTol) return 'collection';
        for (const hub of this.deliveryHubs) {
            if (l.x >= hub.x - xTol && l.x <= hub.x + hub.width + xTol) return hub.type;
        }
        return null;
    }

    _detectLanding() {
        const lander = this.lander;
        if (lander.crashed) return;

        const hw = lander.width / 2;
        const hh = lander.height / 2;
        const bottom = lander.y + hh;

        // Check bottom edge against terrain polygons
        const gyL = this.getPolygonSurfaceY(lander.x - hw);
        const gyR = this.getPolygonSurfaceY(lander.x + hw);
        const groundY = Math.min(gyL, gyR);
        const distToGround = groundY - bottom;

        const speed = Math.sqrt(lander.vx * lander.vx + lander.vy * lander.vy);
        const angleDeg = Math.abs(lander.angle * 180 / Math.PI);
        const _baseLandSpd = window.DEV_LANDSPD ?? 2.0;
        const maxLandingSpeed = lander.legsDeployed ? _baseLandSpd * 2.25 : _baseLandSpd;
        const maxLandingAngle = lander.legsDeployed ? 18.0 : 8.0;

        const padType = this._getLanderPad();
        const nearGround = distToGround > -8 && distToGround < 6;

        if (nearGround && padType !== null && speed <= maxLandingSpeed && angleDeg <= maxLandingAngle) {
            if (!lander.landed) {
                lander.legCompress = Math.min(1, Math.max(0.4, speed * 0.5));
            }
            lander.vx = 0;
            lander.vy = 0;
            lander.angle = 0;
            lander.landed = true;
            lander.currentPad = padType;
            if (padType === 'start' && lander.integrity < lander.maxIntegrity) {
                lander.integrity = Math.min(lander.maxIntegrity, lander.integrity + 0.1);
                lander.fuel = Math.min(lander.maxFuel, lander.fuel + 0.3);
            }
            // Leg spring decay while parked
            lander.legCompress = Math.max(0, lander.legCompress - 0.04);
        } else {
            lander.landed = false;
            lander.currentPad = null;
            lander.legCompress = nearGround ? Math.max(0, lander.legCompress - 0.04) : 0;
        }
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

        // Spawn from hatch at top of the warehouse building
        const _wbX = this.collectionPoint.x - 18;
        const _wbW = this.collectionPoint.width + 36;
        const _hatchX = _wbX + _wbW * 0.42;
        const newBox = {
            id: Math.random().toString(36).substr(2, 9),
            x: _hatchX + (Math.random() - 0.5) * 8,
            y: this.collectionPoint.y - 88,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.5,
            type: type, // 'red', 'blue', 'green'
            size: this.BOX_SIZE,
            mass: 1.0,
            onDeck: false,
            emoji: randomEmoji
        };
        this.boxes.push(newBox);

        // Create Matter.js rigid body for this box
        if (this.matterWorld) {
            const body = Matter.Bodies.rectangle(newBox.x, newBox.y, newBox.size, newBox.size, {
                friction: this.BOX_FRICTION,
                restitution: this.BOX_RESTITUTION,
                frictionAir: 0.01, // matches box.vx *= 0.99 per-frame drag
                label: 'box',
                collisionFilter: { category: 0x0001, mask: 0x0001 | 0x0002 | 0x0004 },
            });
            Matter.Composite.add(this.matterWorld, body);
            this.boxBodyMap.set(newBox.id, body);
        }
    }

    // getTerrainHeight and getTerrainSlope removed in favor of Matter.js collisions and polygons

    // ── Segment collision helpers ──────────────────────────────────────────────

    // Returns { cx, cy, t } — closest point on segment (x1,y1)→(x2,y2) to (px,py)
    _closestPointOnSeg(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { cx: x1, cy: y1, t: 0 };
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
        return { cx: x1 + t * dx, cy: y1 + t * dy, t };
    }

    // Tests point (px,py) against all segments. Returns strongest hit { pen, nx, ny } or null.
    // skin = collision radius around the segment line
    _testPointVsSegments(px, py, skin) {
        let best = null;
        for (const seg of this.segments) {
            const { cx, cy } = this._closestPointOnSeg(px, py, seg.x1, seg.y1, seg.x2, seg.y2);
            const dx = px - cx, dy = py - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < skin) {
                const pen = skin - dist;
                // Normal points from segment surface toward the body point
                const nx = dist > 0.001 ? dx / dist : 0;
                const ny = dist > 0.001 ? dy / dist : -1;
                if (!best || pen > best.pen) best = { pen, nx, ny, cx, cy };
            }
        }
        return best;
    }

    // Resolve lander corners against all segments
    resolveSegmentCollisions() {
        const lander = this.lander;
        if (lander.crashed || this.segments.length === 0) return;

        const hw = lander.width / 2;
        const hh = lander.height / 2;
        const SKIN = 5;

        const localPts = [
            { x: -hw, y:  hh },
            { x:  hw, y:  hh },
            { x: -hw, y: -hh },
            { x:  hw, y: -hh },
        ];

        let maxPen = 0, hit = null;
        for (const pt of localPts) {
            const wx = lander.x + pt.x * Math.cos(lander.angle) - pt.y * Math.sin(lander.angle);
            const wy = lander.y + pt.x * Math.sin(lander.angle) + pt.y * Math.cos(lander.angle);
            const h = this._testPointVsSegments(wx, wy, SKIN);
            if (h && h.pen > maxPen) { maxPen = h.pen; hit = h; }
        }

        if (!hit) return;

        // Push center out along normal
        lander.x += hit.nx * hit.pen;
        lander.y += hit.ny * hit.pen;

        // Reflect velocity
        const vn = lander.vx * hit.nx + lander.vy * hit.ny;
        if (vn < 0) {
            lander.vx -= (1 + this.LANDER_RESTITUTION) * vn * hit.nx;
            lander.vy -= (1 + this.LANDER_RESTITUTION) * vn * hit.ny;
            // Friction on tangential component
            const tx = -hit.ny, ty = hit.nx;
            const vt = lander.vx * tx + lander.vy * ty;
            lander.vx -= this.LANDER_FRICTION * vt * tx;
            lander.vy -= this.LANDER_FRICTION * vt * ty;

            const speed = Math.sqrt(lander.vx * lander.vx + lander.vy * lander.vy);
            if (speed > 1.5 && window.CargoAudio) CargoAudio.playCollision(speed);

            const damage = Math.max(0, Math.pow(Math.max(0, speed - 1.2), 1.8) * 12);
            if (damage > 0) {
                lander.integrity -= damage;
                // Sparks
                for (let i = 0; i < 10; i++) {
                    this.particles.push({
                        x: hit.cx, y: hit.cy,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6 - 1,
                        life: 0.9, decay: 0.05 + Math.random() * 0.04,
                        color: Math.random() > 0.45 ? '#fbbf24' : '#f97316',
                        size: 2 + Math.random() * 2,
                    });
                }
                if (lander.integrity <= 0) this.triggerExplosion();
            }
        }
        lander.landed = false;
    }

    update(dt, levelConfig, inputState) {
        // Cap dt so slow render frames don't cause physics to explode
        dt = Math.min(dt, 1.5);

        if (!this.lander.crashed) {
            this.applyControls(dt, inputState);
            this._updateLegsDeployed();
        }
        
        this.applyGravityAndWind(dt);
        this.applyGravityWell(levelConfig, dt);

        // Step custom kinematics for the lander unconditionally
        this.integrateLander(dt);
        this.resolveSegmentCollisions();

        if (this.landerBody) {
            // Sync kinematic state FORWARD to Matter.js so it can push dynamic boxes.
            // landerBody is now permanently isStatic=true (kinematic).
            Matter.Body.setPosition(this.landerBody, { x: this.lander.x, y: this.lander.y });
            Matter.Body.setVelocity(this.landerBody, { x: this.lander.vx, y: this.lander.vy });
            Matter.Body.setAngle(this.landerBody, 0);
            Matter.Body.setAngularVelocity(this.landerBody, 0);
        }

        this.updateBoxes(dt); // steps Matter engine → lander + boxes collide with terrain

        this._detectLanding();
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

        // Spawn logic: Trigger if lander strays out of bounds (including flying too high or falling too low)
        if (lander.x < -500 || lander.x > this.levelWidth + 500 || lander.y < -600 || lander.y > this.levelHeight + 200) {
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

        // --- Sand Worm Logic (worm-lair terrain only) ---
        if (this.currentLevelConfig?.terrainType === 'worm-lair') {
            // Worm pit is at x≈1075, floor at levelHeight-60 ≈ 1240.
            // The danger zone is centered above the pit where the player actually flies.
            const WORM_PIT_CX   = 1075;
            const WORM_ZONE_CX  = 1075;
            const WORM_ZONE_CY  = 1100; // above the pit floor, where player crosses
            const WORM_ZONE_R   = 300;

            if (!this.sandWorm && !lander.crashed) {
                const distToZone = Math.hypot(lander.x - WORM_ZONE_CX, lander.y - WORM_ZONE_CY);
                if (distToZone < WORM_ZONE_R) {
                    // Logarithmic risk: very low at the edge, spiking near center
                    const norm = distToZone / WORM_ZONE_R; // 0 = center, 1 = edge
                    const risk = Math.pow(1 - norm, 2.5);   // 0 at edge, 1 at center
                    if (Math.random() < risk * 0.004 * dt) {
                        // Emerge from just below the worm pit floor, aimed at lander
                        const spawnX = WORM_PIT_CX + (Math.random() - 0.5) * 60;
                        const spawnY = this.levelHeight - 55; // just below pit surface
                        const angle  = Math.atan2(lander.y - spawnY, lander.x - spawnX);
                        const speed  = 26;
                        this.sandWorm = {
                            x: spawnX, y: spawnY,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            state: 'lunging',
                            trail: [],
                            lungeTargetX: lander.x,
                            lungeTargetY: lander.y,
                        };
                        if (window.CargoAudio) CargoAudio.playCrash();
                    }
                }
            }

            if (this.sandWorm) {
                const w = this.sandWorm;

                if (w.state === 'lunging') {
                    w.vy += 0.3 * dt;
                    if (w.vy > 0) w.state = 'retracting';
                } else {
                    w.vy += 0.8 * dt;
                }

                w.x += w.vx * dt;
                w.y += w.vy * dt;

                const lastTP = w.trail[0];
                if (!lastTP || Math.hypot(w.x - lastTP.x, w.y - lastTP.y) >= 2) {
                    w.trail.unshift({ x: w.x, y: w.y });
                    if (w.trail.length > 500) w.trail.pop();
                }

                // Survivable hit: knock back and deal moderate damage
                const dx = lander.x - w.x;
                const dy = lander.y - w.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 70 && !lander.crashed) {
                    const nx = dx / dist, ny = dy / dist;
                    lander.vx += nx * 5;
                    lander.vy += ny * 5 - 2; // push away + extra upward
                    lander.integrity -= 6 * dt; // survivable — ~1 second kills at full HP
                    if (window.CargoAudio) CargoAudio.playCrash();
                    for (let i = 0; i < 4; i++) {
                        this.particles.push({
                            x: lander.x + (Math.random() - 0.5) * 24,
                            y: lander.y + (Math.random() - 0.5) * 24,
                            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5 - 1,
                            life: 0.9, decay: 0.05 + Math.random() * 0.04,
                            color: Math.random() > 0.4 ? '#f97316' : '#854d0e',
                            size: 2 + Math.random() * 2,
                        });
                    }
                    if (lander.integrity <= 0) this.triggerExplosion();
                }

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
            if (inputState.down && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.05 * (lander.fuelEfficiency || 1.0) * (window.DEV_FUELBURN ?? 1) * dt;
                lander.vy += maxThrust * 0.5 * dt;
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
            if (inputState.down && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.06 * (lander.fuelEfficiency || 1.0) * dt;
                const ax = Math.sin(lander.angle) * maxThrust * 0.5 * dt;
                const ay = -Math.cos(lander.angle) * maxThrust * 0.5 * dt;
                lander.vx -= ax;
                lander.vy -= ay;
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

        // Apply air resistance (drag)
        const drag = Math.pow(this.LANDER_DRAG, dt);
        lander.vx *= drag;
        lander.vy *= drag;

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

    // resolveLanderCollisions removed in favor of resolveSegmentCollisions handling all terrain polygons

    // Ceiling collision is now handled natively by Matter.js static bodies

    triggerExplosion() {
        if (window.DEV_INVULNERABLE) {
            if (this.lander) {
                this.lander.integrity = 100;
                // Add a small bounce if hitting the ground or ceiling
                if (this.lander.vy > 1) this.lander.vy = -this.lander.vy * 0.5;
            }
            return;
        }
        if (this.lander && this.lander.crashed) return; // Prevent multiple triggers
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
        const FS = this.MATTER_FORCE_SCALE; // converts vel/frame to Matter force

        for (const box of this.boxes) {
            const body = this.boxBodyMap.get(box.id);
            if (!body) continue;

            // Drone grapple: distance constraint (lander is not a Matter body)
            if (lander && lander.vehicleType === 'drone' && lander.grabbedBoxId === box.id) {
                const attachX = lander.x - Math.sin(lander.angle) * (lander.height / 2);
                const attachY = lander.y + Math.cos(lander.angle) * (lander.height / 2);
                const dx = body.position.x - attachX;
                const dy = body.position.y - attachY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > lander.ropeLength) {
                    const diff = dist - lander.ropeLength;
                    const nx = dx / dist, ny = dy / dist;
                    Matter.Body.setPosition(body, { x: body.position.x - nx * diff, y: body.position.y - ny * diff });
                    const vel = body.velocity;
                    const rvn = (vel.x - lander.vx) * nx + (vel.y - lander.vy) * ny;
                    if (rvn > 0) Matter.Body.setVelocity(body, { x: vel.x - rvn * nx, y: vel.y - rvn * ny });
                }
                // Apply gravity so rope swings naturally
                Matter.Body.applyForce(body, body.position, { x: 0, y: this.gravity * body.mass * FS });
                continue;
            }

            if (box.onDeck) continue; // Kinematic — positioned by deck resolver below

            // Gravity + wind as Matter forces (scale matches vel-per-frame game units)
            Matter.Body.applyForce(body, body.position, {
                x: this.wind * 0.01 * body.mass * FS,
                y: this.gravity * body.mass * FS,
            });

            // Gravity well
            if (this.gravityWellPos) {
                const gw = this.gravityWellPos;
                const dx = gw.x - body.position.x;
                const dy = gw.y - body.position.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > 20 && d < gw.radius) {
                    const fMag = (gw.strength * 10) / (d * 0.1) * FS * dt;
                    Matter.Body.applyForce(body, body.position, { x: (dx / d) * fMag * body.mass, y: (dy / d) * fMag * body.mass });
                }
            }

            // Magnetic deck pull
            if (lander && lander.vehicleType !== 'drone' && lander.magneticDeckActive && !lander.crashed) {
                const deckX = lander.x - Math.sin(lander.angle) * lander.deckOffset;
                const deckY = lander.y - Math.cos(lander.angle) * lander.deckOffset;
                const dx = deckX - body.position.x;
                const dy = deckY - body.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0 && dist < 120) {
                    const fMag = (1 - dist / 120) * lander.magneticStrength * FS * dt;
                    Matter.Body.applyForce(body, body.position, { x: (dx / dist) * fMag * body.mass, y: (dy / dist) * fMag * body.mass });
                }
            }
        }

        // Step the Matter.js engine at a fixed 60 fps timestep for stability
        Matter.Engine.update(this.matterEngine, 16.666);

        // Sync non-deck box game state from Matter bodies
        for (const box of this.boxes) {
            const body = this.boxBodyMap.get(box.id);
            if (!body) continue;
            box.x = body.position.x;
            box.y = body.position.y;
            box.vx = body.velocity.x;
            box.vy = body.velocity.y;
        }

        // Lander basket containment (lander is kinematic, not in the Matter world)
        this.resolveBoxLanderDeckCollisions();
        this.updateOnDeckStates();

        // Sync on-deck Matter bodies to follow the lander kinematically
        for (const box of this.boxes) {
            if (!box.onDeck) continue;
            const body = this.boxBodyMap.get(box.id);
            if (!body) continue;
            Matter.Body.setPosition(body, { x: box.x, y: box.y });
            Matter.Body.setVelocity(body, { x: box.vx, y: box.vy });
            Matter.Body.setAngularVelocity(body, 0);
        }
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
        // Cap total particles to avoid unbounded growth
        if (this.particles.length > 300) this.particles.length = 300;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.size = Math.max(0.5, p.size * 0.98);

            if (p.life <= 0) {
                // O(1) swap-and-pop instead of O(n) splice
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
            }
        }
    }
}
