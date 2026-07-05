// CargoLander - Custom 2D Physics Engine
class CargoPhysics {
    constructor() {
        this.gravity = 0.035;
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
        this.currentLevelConfig = levelConfig; // Store for ceiling/terrain queries
        
        let maxX = 1600, maxY = 1300;
        if (levelConfig.terrainPolygons) {
            for (const poly of levelConfig.terrainPolygons) {
                for (const pt of poly) {
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y > maxY) maxY = pt.y;
                }
            }
        }
        if (levelConfig.outOfBounds && levelConfig.outOfBounds.surfaceY) {
            if (levelConfig.outOfBounds.surfaceY + 400 > maxY) {
                maxY = levelConfig.outOfBounds.surfaceY + 400;
            }
        }
        
        this.levelWidth = levelConfig.levelWidth || maxX;
        this.levelHeight = levelConfig.levelHeight || maxY;
        this.gravity = levelConfig.gravity !== undefined ? levelConfig.gravity : 0.035;
        this.wind = levelConfig.wind !== undefined ? levelConfig.wind : 0;
        this.currentWind = this.wind;
        
        this.boxes = [];
        this.particles = [];
        this.sandWorm = null;
        this.sandWormSpawned = false;
        this.monster = null; // The Out-Of-Bounds cosmic horror
        this.sandWorm = null;
        this.outOfBoundsTimer = 0;
        this.wasInFluid = false;
        this.ambientTraffic = [];
        this.trafficSpawnTimer = 0;
        this.gravityWellPos = null;
        this.gravityWellTime = 0;
        this.segments = levelConfig.segments ? levelConfig.segments.map(s => ({ ...s })) : [];
        this._buildMatterWorld();
        this.generateTerrain(levelConfig);
        this.spawnLander(levelConfig, upgrades);

        if (typeof levelConfig.setupPhysics === 'function') {
            levelConfig.setupPhysics(this);
        }
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
                    this.checkCargoDamage(damage / this.lander.maxIntegrity);
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
                
                // Only consider upward-facing floor segments (p1.x <= p2.x) to avoid catching ceilings
                if (p1.x <= targetX && p2.x > targetX) {
                    const ratio = (targetX - p1.x) / (p2.x - p1.x);
                    const y = p1.y + ratio * (p2.y - p1.y);
                    if (maxSurfaceY === 0 || y > maxSurfaceY) {
                        maxSurfaceY = y;
                    }
                }
            }
        }
        return maxSurfaceY || this.levelHeight * 0.7;
    }

    // Standard ray-casting point-in-polygon test. Used for zone membership
    // (hazards, water bodies) rather than the edge-collision terrain bodies.
    pointInPolygon(px, py, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
        }
        return inside;
    }

    polygonCentroid(pts) {
        let cx = 0, cy = 0;
        for (const p of pts) { cx += p.x; cy += p.y; }
        return { x: cx / pts.length, y: cy / pts.length };
    }

    // Shortest distance from point (px,py) to segment (ax,ay)-(bx,by).
    // Used by laser hazards to test the lander against the beam line.
    distToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        const cx = ax + t * dx, cy = ay + t * dy;
        return Math.hypot(px - cx, py - cy);
    }

    generateTerrain(config) {
        const w = this.levelWidth;
        const h = this.levelHeight;
        this.terrainPolygons = config.terrainPolygons || [];
        this.hazards = config.hazards || [];
        this.collectibles = config.collectibles ? config.collectibles.map(c => ({...c})) : [];
        this.waterBodies = config.waterBodies || [];
        
        const ps = config.padScale || 1.0;
        this.startDepot = { x: config.startX !== undefined ? config.startX : 80, y: config.startY !== undefined ? config.startY : undefined, width: Math.round(80 * ps), height: 15 };
        this.collectionPoint = { x: config.collectionX !== undefined ? config.collectionX : 280, y: config.collectionY !== undefined ? config.collectionY : undefined, width: Math.round(100 * ps), height: 15 };
        this.deliveryHubs = (config.deliveryHubs || []).map(hub => ({
            x: hub.x, y: hub.y !== undefined ? hub.y : undefined, width: Math.round((hub.width || 80) * ps), height: 15,
            color: hub.color, type: hub.type, name: hub.name || 'Terminal'
        }));

        if (this.startDepot.y === undefined) {
            this.startDepot.y = this.getPolygonSurfaceY(this.startDepot.x + this.startDepot.width / 2);
        }
        if (this.collectionPoint.y === undefined) {
            this.collectionPoint.y = this.getPolygonSurfaceY(this.collectionPoint.x + this.collectionPoint.width / 2);
        }
        for (const hub of this.deliveryHubs) {
            if (hub.y === undefined) {
                hub.y = this.getPolygonSurfaceY(hub.x + hub.width / 2);
            }
        }

        for (const rawPoly of this.terrainPolygons) {
            let area = 0;
            for (let i = 0; i < rawPoly.length; i++) {
                const p1 = rawPoly[i];
                const p2 = rawPoly[(i + 1) % rawPoly.length];
                area += (p2.x - p1.x) * (p2.y + p1.y);
            }
            
            // If area > 0, it's counter-clockwise. Reverse it to ensure normals point inwards!
            const poly = area > 0 ? [...rawPoly].reverse() : rawPoly;
            
            const THICKNESS = 40;
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
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
                friction: seg.sticky ? 1.0 : this.BOX_FRICTION,
                restitution: seg.bouncy ? 1.5 : this.BOX_RESTITUTION,
                label: seg.bouncy ? 'bouncy_segment' : (seg.sticky ? 'sticky_segment' : 'segment'),
                collisionFilter: { category: 0x0004, mask: 0x0001 | 0x0008 },
            });
            seg.matterBody = body;
            Matter.Composite.add(this.matterWorld, body);
        }
    }

    createSourcingDepot(x, y, count, allowedVehicles) {
        this.collectionPoint = {
            x: x - 50,
            y: y,
            width: 100,
            height: 15
        };
    }

    createDeliveryHub(x, y, count, type, name, active) {
        if (!this.deliveryHubs) this.deliveryHubs = [];
        this.deliveryHubs.push({
            x: x - 50,
            y: y,
            width: 100,
            height: 15,
            color: '#6366f1',
            type: type || 'normal',
            name: name || 'Cauldron Hub'
        });
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
            fuel: 120,
            maxFuel: 120,
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
            }
            if (padType === 'refuel' || padType === 'hq') {
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

    checkCargoDamage(damagePercent) {
        if (!this.lander || this.lander.vehicleType === 'drone') return; // Drone uses grapple, not deck
        
        const deckBoxes = this.boxes.filter(b => b.onDeck && !b.vacuumed);
        if (deckBoxes.length === 0) return;

        // Fling chance scales from 30% at 5% damage to 100% at 90% damage
        const chance = 0.3 + Math.max(0, (damagePercent - 0.05) / 0.85) * 0.7;
        if (damagePercent < 0.05 || Math.random() > Math.min(1.0, chance)) return;

        let numToFling = 1;
        if (damagePercent >= 0.90 && deckBoxes.length > 1) {
            numToFling = Math.random() < 0.5 ? deckBoxes.length : 1;
        }

        // Shuffle deckBoxes
        deckBoxes.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < numToFling; i++) {
            const box = deckBoxes[i];
            box.onDeck = false; // Detach
            box.flingImmunity = 60; // 1 second immunity to re-attachment
            
            const body = this.boxBodyMap.get(box.id);
            if (body) {
                const speed = 0.5 + damagePercent * 1.5; 
                const outX = (Math.random() - 0.5) * 2;
                Matter.Body.setVelocity(body, { 
                    x: this.landerBody.velocity.x + outX * 10 * speed, 
                    y: this.landerBody.velocity.y - (5 + Math.random() * 5) * speed 
                });
                Matter.Body.setAngularVelocity(body, (Math.random() - 0.5));
                
                // Add some sparks
                for(let j=0; j<8; j++) {
                    this.particles.push({
                        x: box.x, y: box.y,
                        vx: (Math.random() - 0.5)*5, vy: (Math.random() - 0.5)*5,
                life: 1, decay: 0.04, color: '#facc15', size: 3 + Math.random()*2
                    });
                }
            }
        }
    }

    getRandomCargoEmoji(type) {
        const emojis = {
            'red': ['📦', '💊', '🩸', '🛑'],
            'blue': ['❄️', '🧊', '💎', '🥶'],
            'green': ['🌿', '🥝', '🔋', '🧪'],
            'tethered': ['🔗', '⚓', '⛓️'],
            'normal': ['📦', '🔩', '🧱', '🛠️', '🔋', '🔌']
        };
        const typeList = emojis[type] || emojis['normal'];
        return typeList[Math.floor(Math.random() * typeList.length)];
    }

    getCargoColor(type) {
        const colors = {
            'red': '#ef4444',
            'blue': '#3b82f6',
            'green': '#10b981',
            'tethered': '#6366f1',
            'normal': '#f59e0b'
        };
        return colors[type] || '#f59e0b';
    }

    spawnCargo(type, targetX, forcedEmoji, targetY) {
        const randomEmoji = forcedEmoji || this.getRandomCargoEmoji(type);

        // Determine spawn location based on lander type and position
        const _wbX = this.collectionPoint.x - 18;
        const _wbW = this.collectionPoint.width + 36;
        const _hatchX = _wbX + _wbW * 0.42;
        
        let spawnX = _hatchX + (Math.random() - 0.5) * 8;
        let spawnY = targetY !== undefined ? targetY : this.collectionPoint.y - 88;
        
        if (targetX !== undefined) {
            spawnX = targetX;
        } else if (this.lander && this.lander.landed && this.lander.currentPad === 'collection') {
            if (this.lander.vehicleType === 'drone') {
                spawnX = this.lander.x + 30 + (Math.random() * 10); // Spawns to the right of the drone
                spawnY = this.lander.y - 10;
            } else {
                spawnX = this.lander.x + (Math.random() - 0.5) * 5; // Spawns exactly over the basic lander
                spawnY = this.lander.y - 60;
            }
        }

        const newBox = {
            id: Math.random().toString(36).substr(2, 9),
            x: spawnX,
            y: spawnY,
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
                if (!best || pen > best.pen) best = { pen, nx, ny, cx, cy, seg };
            }
        }
        return best;
    }

    // Resolve lander corners against all segments
    resolveSegmentCollisions() {
        const lander = this.lander;
        if (this.segments.length === 0) return;

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
            if (hit.seg && hit.seg.fragile && Math.abs(vn) > 4.0) {
                // Shatter glass
                if (hit.seg.matterBody) {
                    Matter.Composite.remove(this.matterWorld, hit.seg.matterBody);
                }
                this.segments = this.segments.filter(s => s !== hit.seg);
                if (window.CargoAudio && !this.isMuted) CargoAudio.playCrash();
                // Burst through, but lose some speed
                lander.vx *= 0.8;
                lander.vy *= 0.8;
                return;
            }

            let restitution = this.LANDER_RESTITUTION;
            let friction = this.LANDER_FRICTION;
            
            if (hit.seg && hit.seg.bouncy) {
                restitution += 1.0; // Extra bounce
            }
            if (hit.seg && hit.seg.sticky) {
                restitution = 0; // No bounce
                friction += 0.8; // High friction
            }
            
            lander.vx -= (1 + restitution) * vn * hit.nx;
            lander.vy -= (1 + restitution) * vn * hit.ny;
            // Friction on tangential component
            const tx = -hit.ny, ty = hit.nx;
            let vt = lander.vx * tx + lander.vy * ty;
            if (hit.seg && hit.seg.conveyorSpeed) {
                vt -= hit.seg.conveyorSpeed;
            }
            lander.vx -= friction * vt * tx;
            lander.vy -= friction * vt * ty;

            if (lander.crashed) {
                // Tumble based on tangential speed and some randomness
                lander.angularVelocity = (lander.angularVelocity || 0) + vt * 0.02 + (Math.random() - 0.5) * 0.05;
            }

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
        this.currentLevelConfig = levelConfig;

        // Calculate heavy cargo mass multiplier
        this.lander.massMultiplier = 1.0;
        if (levelConfig.heavyCargo) {
            let cargoCount = 0;
            for (const box of this.boxes) {
                if (box.onDeck || box.id === this.lander.grabbedBoxId) {
                    cargoCount++;
                }
            }
            this.lander.massMultiplier += cargoCount * 0.15; // 15% heavier per box (was 45%)
        }

        if (!this.lander.crashed) {
            this.applyControls(dt, inputState);
            this._updateLegsDeployed();
        }
        
        this.applyGravityAndWind(levelConfig, dt);
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
        this.updateMonster(levelConfig, dt);
        this.updateAmbientTraffic(dt);
        this.updateParticles();
    }

    updateMonster(levelConfig, dt) {
        const lander = this.lander;

        // Once the lander is gone, the monster dives back into the depths and despawns.
        if (lander.crashed) {
            if (this.monster) {
                const m = this.monster;
                // Force an aggressive turn downwards so it doesn't float into the sky
                if (m.vy < 15) m.vy += 2.0 * dt; 
                m.vy += 0.8 * dt;              // accelerate downward, retreating quickly
                m.vx *= Math.pow(0.90, dt);
                m.x += m.vx * dt;
                m.y += m.vy * dt;

                if (!m.trail) m.trail = [];
                const lastTP = m.trail[0];
                if (!lastTP || Math.hypot(m.x - lastTP.x, m.y - lastTP.y) >= 2) {
                    m.trail.unshift({ x: m.x, y: m.y });
                    if (m.trail.length > 800) m.trail.pop();
                }

                const oob = levelConfig.outOfBounds;
                const despawnDepth = (oob && oob.monsterDepth) ? oob.monsterDepth + 400 : 1800;
                if (m.y > despawnDepth || m.y > this.levelHeight + 400) {
                    this.monster = null;
                }
            }
            
            if (this.sandWorm) {
                this.sandWorm.state = 'retracting';
            } else {
                return; // Only return early if no active sandworm
            }
        }

        // Spawn logic: Trigger if lander sinks below monsterDepth OR stays out of bounds too long
        const oob = levelConfig.outOfBounds;
        const tooDeep = oob && lander.y > oob.monsterDepth;
        if (tooDeep || this.outOfBoundsTimer > 250) { // ~4 seconds out of bounds
            if (!this.monster) {
                // Spawn monster
                let spawnX = lander.x;
                let spawnY = lander.y;
                if (tooDeep) {
                    spawnY = oob.monsterDepth + 400;
                } else {
                    spawnX = lander.x < -150 ? lander.x - 400 : (lander.x > this.levelWidth + 150 ? lander.x + 400 : lander.x);
                    spawnY = lander.y > this.levelHeight ? lander.y + 200 : lander.y - 400;
                }
                this.monster = {
                    x: spawnX,
                    y: spawnY,
                    vx: 0,
                    vy: tooDeep ? -5 : 0,
                    size: 130,
                    roarTimer: 60,
                    trail: [],
                    speedIntegral: 0,
                    chaseTimer: 0,
                };
                if (window.CargoAudio) CargoAudio.playCrash();
            }
        }

        if (this.monster) {
            const m = this.monster;

            // AI Chase Logic: Accelerate toward lander
            const dx = lander.x - m.x;
            const dy = lander.y - m.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                m.chaseTimer += dt;
                
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
                
                // Startup modifier: takes ~4 seconds to reach full speed (300 frames)
                const startupModifier = Math.min(1, m.chaseTimer / 300);
                const speed = (0.35 + m.speedIntegral * 0.55) * startupModifier;
                
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
            //  Spawn check 
            if (!this.sandWorm && !lander.crashed && this.hazards) {
                let inWormZone = false;
                let riskMultiplier = 1;

                // Support legacy currentLevelConfig values if hazard not used
                const legacyCX = this.currentLevelConfig.wormPitCX;
                if (legacyCX !== undefined) {
                    const legacyCY = this.currentLevelConfig.wormPitCY ?? 580;
                    const legacyR = this.currentLevelConfig.wormZoneR ?? 300;
                    const distToZone = Math.hypot(lander.x - legacyCX, lander.y - legacyCY);
                    if (distToZone < legacyR) {
                        inWormZone = true;
                        const norm = distToZone / legacyR;
                        riskMultiplier = Math.pow(1 - norm, 1.8);
                    }
                }

                // Check hazard polygons for sandworm zones
                for (const h of this.hazards) {
                    if (h.type === 'sandworm' && h.pts) {
                        if (this.pointInPolygon(lander.x, lander.y, h.pts)) {
                            inWormZone = true;
                            riskMultiplier = h.spawnRate || 1.0;
                            break;
                        }
                    }
                }

                if (inWormZone) {
                    if (Math.random() < riskMultiplier * 0.007 * dt) {
                        // Spawn near the lander's X so it's always a threat
                        const spawnX = lander.x + (Math.random() - 0.5) * 160;
                        const surfY  = this.getPolygonSurfaceY(spawnX);
                        const spawnY = surfY !== null ? surfY + 20 : lander.y + 100;

                        // Aim toward lander's current position
                        const dxL = lander.x - spawnX;
                        const dyL = lander.y - spawnY;
                        const distL = Math.max(1, Math.hypot(dxL, dyL));
                        const speed = 38; // fast lunge
                        this.sandWorm = {
                            x: spawnX, y: spawnY,
                            vx: (dxL / distL) * speed,
                            vy: (dyL / distL) * speed,
                            state: 'lunging',
                            lungeTimer: 0,   // how long it's been lunging
                            trail: [],
                            length: 35,
                            spawnY: spawnY,  // remember surface Y for retract target
                            spawnX: spawnX,
                        };
                        if (window.CargoAudio) CargoAudio.playCrash();
                    }
                }
            }

            // ── Roof Sandworm ──────────────────────────────────────────────────────
            if (!this.sandWorm && !lander.crashed) {
                if (lander.y < -600) {
                    if (Math.random() < 0.025 * dt) {
                        const spawnX = lander.x + (Math.random() - 0.5) * 100;
                        const spawnY = lander.y - 300;
                        const dxL = lander.x - spawnX;
                        const dyL = lander.y - spawnY;
                        const distL = Math.max(1, Math.hypot(dxL, dyL));
                        const speed = 38;
                        this.sandWorm = {
                            x: spawnX, y: spawnY,
                            vx: (dxL / distL) * speed,
                            vy: (dyL / distL) * speed,
                            state: 'lunging',
                            lungeTimer: 0,
                            trail: [],
                            length: 40,
                            isRoofWorm: true,
                            spawnY: spawnY,
                            spawnX: spawnX,
                        };
                        if (window.CargoAudio) CargoAudio.playCrash();
                    }
                }
            }

            // ── Update active worm ─────────────────────────────────────────────────
            if (this.sandWorm) {
                const w = this.sandWorm;
                w.lungeTimer = (w.lungeTimer || 0) + dt;

                if (w.state === 'lunging') {
                    // Lunge phase: track toward lander for first 1.2 seconds, then coast
                    if (w.lungeTimer < 1.2) {
                        const dxL = lander.x - w.x;
                        const dyL = lander.y - w.y;
                        const distL = Math.max(1, Math.hypot(dxL, dyL));
                        // Steer gradually toward lander
                        const steer = 2.5;
                        w.vx += (dxL / distL) * steer * dt;
                        w.vy += (dyL / distL) * steer * dt;
                        // Cap speed
                        const spd = Math.hypot(w.vx, w.vy);
                        if (spd > 50) { w.vx = (w.vx / spd) * 50; w.vy = (w.vy / spd) * 50; }
                    } else {
                        // After 1.2s, start decelerating and then retract
                        w.vx *= Math.pow(0.88, dt);
                        w.vy *= Math.pow(0.88, dt);
                        const spd = Math.hypot(w.vx, w.vy);
                        if (spd < 4) {
                            w.state = 'retracting';
                        }
                    }
                } else {
                    // Retract: move back toward spawn point steadily
                    const dxS = w.spawnX - w.x;
                    const dyS = w.spawnY - w.y;
                    const distS = Math.max(1, Math.hypot(dxS, dyS));
                    const retractSpeed = 12;
                    w.vx = (dxS / distS) * retractSpeed;
                    w.vy = (dyS / distS) * retractSpeed;
                    // Despawn when close to spawn
                    if (distS < 30) {
                        this.sandWorm = null;
                    }
                }

                if (this.sandWorm) {
                    w.x += w.vx * dt;
                    w.y += w.vy * dt;

                    // Build trail
                    const lastTP = w.trail[0];
                    if (!lastTP || Math.hypot(w.x - lastTP.x, w.y - lastTP.y) >= 2) {
                        w.trail.unshift({ x: w.x, y: w.y });
                        if (w.trail.length > 600) w.trail.pop();
                    }

                    // ── Hit detection ──────────────────────────────────────────────
                    const dx = lander.x - w.x;
                    const dy = lander.y - w.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 80 && !lander.crashed) {
                        lander.integrity -= 8 * dt;
                        if (window.CargoAudio) CargoAudio.playCrash();
                        for (let i = 0; i < 6; i++) {
                            this.particles.push({
                                x: lander.x + (Math.random() - 0.5) * 30,
                                y: lander.y + (Math.random() - 0.5) * 30,
                                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2,
                                life: 0.9, decay: 0.04 + Math.random() * 0.04,
                                color: Math.random() > 0.4 ? '#f97316' : '#854d0e',
                                size: 2 + Math.random() * 3,
                            });
                        }
                        if (lander.integrity <= 0) this.triggerExplosion();
                    }
                }
            }
        }

        this.hazardTime = (this.hazardTime || 0) + dt * 16.666;

        // Handle laser hazards — a sweeping/pulsing beam between two points on a
        // telegraphed on/off duty cycle (charge flash → active beam → cooldown).
        // Distinct from zone hazards below: line-segment distance check, not
        // point-in-polygon, and damage only applies while the beam is "active".
        if (this.hazards && this.hazards.length > 0 && !lander.crashed) {
            for (const h of this.hazards) {
                if (h.type !== 'laser') continue;
                if (!h.pts || h.pts.length < 2) continue;

                const onMs = h.onMs ?? 1400;
                const offMs = h.offMs ?? 1600;
                const warnMs = h.warnMs ?? 500;
                const period = onMs + offMs;
                const t = ((this.hazardTime + (h.phaseOffset || 0)) % period + period) % period;
                // Active window is the tail end of the "off" phase (charge-up) +
                // the full "on" phase, so the beam fires right after the flash.
                const charging = t >= offMs - warnMs && t < offMs;
                const active = t >= offMs;
                h.laserState = { charging, active }; // exposed for renderer

                if (!active) continue;

                const a = h.pts[0], b = h.pts[1];
                const dist = this.distToSegment(lander.x, lander.y, a.x, a.y, b.x, b.y);
                const thickness = h.thickness || 14;
                if (dist > thickness) continue;

                // Knockback perpendicular to the beam, pushed toward whichever
                // side of the line the lander is currently on.
                const bx = b.x - a.x, by = b.y - a.y;
                const blen = Math.hypot(bx, by) || 1;
                let nx = -by / blen, ny = bx / blen;
                const side = (lander.x - a.x) * nx + (lander.y - a.y) * ny;
                if (side < 0) { nx = -nx; ny = -ny; }
                lander.vx += nx * 2;
                lander.vy += ny * 2;

                lander.integrity -= (h.damagePerSec || 40) * dt / 60;

                if (window.CargoAudio) CargoAudio.playCollision(1);
                for (let i = 0; i < 2; i++) {
                    this.particles.push({
                        x: lander.x + (Math.random() - 0.5) * 14,
                        y: lander.y + (Math.random() - 0.5) * 14,
                        vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3 - 1,
                        life: 0.5, decay: 0.06 + Math.random() * 0.05,
                        color: '#f472b6',
                        size: 2 + Math.random() * 2,
                    });
                }
                if (lander.integrity <= 0) this.triggerExplosion();
            }
        }

        // Handle generic hazards — each is a polygon zone now (was a circle),
        // so membership is a point-in-polygon test rather than a radius check.
        if (this.hazards && this.hazards.length > 0 && !lander.crashed) {
            for (const h of this.hazards) {
                if (h.type === 'laser') continue;
                
                if (h.type === 'crusher') {
                    const timeMs = this.hazardTime || 0;
                    const phaseOff = h.phase || 0;
                    const period = h.period || 3000;
                    const t = (Math.sin(((timeMs + phaseOff) / period) * Math.PI * 2) + 1) / 2;
                    const cx = h.x + (h.travelX || 0) * t;
                    const cy = h.y + (h.travelY || 0) * t;
                    
                    if (lander.x > cx && lander.x < cx + h.w && lander.y > cy && lander.y < cy + h.h) {
                        lander.integrity -= 25 * dt;
                        const ky = (h.travelY || 0) < 0 ? -1 : 1;
                        lander.vy += ky * dt;
                        this.particles.push({ x: lander.x, y: lander.y, vx: (Math.random() - 0.5)*2, vy: (Math.random() - 0.5)*2, life: 1, color: '#ef4444', size: 3 });
                        if (lander.integrity <= 0) this.triggerExplosion();
                    }
                    continue;
                }

                if (!h.pts || h.pts.length < 3) continue;
                if (!this.pointInPolygon(lander.x, lander.y, h.pts)) continue;

                // Knockback pushes away from the polygon's centroid (stand-in for
                // the old "away from circle center" direction).
                const c = this.polygonCentroid(h.pts);
                const dx = lander.x - c.x;
                const dy = lander.y - c.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                lander.vx += (dx / dist) * 2;
                lander.vy += (dy / dist) * 2;
                lander.integrity -= 25 * dt; // High damage

                if (window.CargoAudio) CargoAudio.playCollision(2);
                for (let i = 0; i < 3; i++) {
                    this.particles.push({
                        x: lander.x + (Math.random() - 0.5) * 20,
                        y: lander.y + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                        life: 0.6, decay: 0.05 + Math.random() * 0.05,
                        color: '#ef4444',
                        size: 2 + Math.random() * 3,
                    });
                }
                if (lander.integrity <= 0) this.triggerExplosion();
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

        // Slightly lower max thrust so the ship feels heavier and accelerates smoother
        const maxThrust = 0.45 * (lander.thrustMultiplier || 1.0);
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
                
                // Apply torque towards cursor (lower multiplier for less twitchy rotation)
                lander.angularVelocity += diff * 0.025 * dt;
                lander.landed = false;
            }

            // Stronger dampening so it doesn't overshoot as much
            lander.angularVelocity *= Math.pow(0.75, dt);
            lander.angle += lander.angularVelocity * dt;

            if (lander.thrusting && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.12 * (lander.fuelEfficiency || 1.0) * lander.enginePower * dt; 

                // Thrust acceleration is reduced if lander is heavy
                const thrustAccel = maxThrust / lander.massMultiplier;

                const ax = Math.sin(lander.angle) * thrustAccel * lander.enginePower * dt;
                const ay = -Math.cos(lander.angle) * thrustAccel * lander.enginePower * dt;

                lander.vx += ax;
                lander.vy += ay;
            }
            if (inputState.down && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.06 * (lander.fuelEfficiency || 1.0) * dt;
                const thrustAccel = maxThrust / lander.massMultiplier;
                const ax = Math.sin(lander.angle) * thrustAccel * 0.5 * dt;
                const ay = -Math.cos(lander.angle) * thrustAccel * 0.5 * dt;
                lander.vx -= ax;
                lander.vy -= ay;
            }
            
            if (Math.abs(lander.strafePower) > 0.1 && lander.fuel > 0) {
                lander.landed = false;
                lander.fuel -= 0.05 * (lander.fuelEfficiency || 1.0) * Math.abs(lander.strafePower) * dt;
                // Strafe is perpendicular to facing angle
                const thrustAccel = maxThrust / lander.massMultiplier;
                const sx = Math.cos(lander.angle) * thrustAccel * 0.4 * lander.strafePower * dt;
                const sy = Math.sin(lander.angle) * thrustAccel * 0.4 * lander.strafePower * dt;
                lander.vx += sx;
                lander.vy += sy;
            }
        }
        lander.fuel = Math.max(0, lander.fuel);

        // Track grapple hook — rope hangs OPPOSITE to tilt (swings back on acceleration)
        lander.grappleX = lander.x - Math.sin(lander.angle) * (lander.ropeLength + lander.height / 2);
        lander.grappleY = lander.y + Math.cos(lander.angle) * (lander.ropeLength + lander.height / 2);

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

    applyGravityAndWind(levelConfig, dt) {
        const lander = this.lander;
        if (lander.landed) return;

        // Apply base gravity (scales with heavy cargo)
        lander.vy += (this.gravity * lander.massMultiplier) * dt;

        // Apply air resistance (drag)
        const drag = Math.pow(this.LANDER_DRAG, dt);
        lander.vx *= drag;
        lander.vy *= drag;

        // Dynamic wind (force proportional to lander area, simplified)
        if (this.wind !== 0) {
            const now = Date.now();
            // Complex wave for unpredictable gusts, varying between roughly 0.4x and 1.6x of base wind
            const dynamicWind = this.wind * (1.0 + Math.sin(now * 0.002) * 0.4 + Math.sin(now * 0.005) * 0.2);
            lander.vx += dynamicWind * 0.02 * dt;
            this.currentWind = dynamicWind;
        } else {
            this.currentWind = 0;
        }

        // Minor random drifting for drone
        if (lander.vehicleType === 'drone') {
            lander.vx += (Math.random() - 0.5) * 0.02 * dt;
            lander.vy += (Math.random() - 0.5) * 0.01 * dt;
        }

        // Air resistance damping
        const _drag = window.DEV_DRAG ?? 0.995;
        lander.vx *= Math.pow(_drag, dt);
        lander.vy *= Math.pow(_drag, dt);

        // Out-of-bounds Fluid dynamics (submersion)
        const oob = levelConfig.outOfBounds;
        if (oob && oob.type !== 'void' && lander.y > oob.surfaceY) {
            lander.vy += oob.buoyancy * dt;
            lander.vx *= Math.pow(oob.drag, dt);
            lander.vy *= Math.pow(oob.drag, dt);
            
            // Splash effect on entering fluid
            if (!this.wasInFluid) {
                this.wasInFluid = true;
                if (window.CargoAudio) CargoAudio.playCollision(2.0); // Splash sound
                for (let i = 0; i < 30; i++) {
                    this.particles.push({
                        x: lander.x + (Math.random() - 0.5) * 40,
                        y: oob.surfaceY,
                        vx: (Math.random() - 0.5) * 12,
                        vy: -2 - Math.random() * 8,
                        life: 1.0,
                        maxLife: 0.8 + Math.random() * 0.5,
                        color: oob.type === 'sand' ? '#b45309' : '#0ea5e9',
                        size: 3 + Math.random() * 4
                    });
                }
            }
        } else {
            this.wasInFluid = false;
        }

        // Track how far out we are for the vignette warning (1000px ~ 1 screen)
        const VIGNETTE_MARGIN = 1000;
        const surfaceY = this.getPolygonSurfaceY ? this.getPolygonSurfaceY(lander.x) : 99999;
        
        if (lander.x < -VIGNETTE_MARGIN || lander.x > this.levelWidth + VIGNETTE_MARGIN || lander.y < -500 || lander.y > surfaceY + 80) {
            this.outOfBoundsTimer = (this.outOfBoundsTimer || 0) + dt;
        } else {
            this.outOfBoundsTimer = Math.max(0, (this.outOfBoundsTimer || 0) - dt * 2);
        }

        // Out-of-bounds Lateral push-back (Proportional, starting at 3 screens ~ 3000px)
        const EDGE_MARGIN = 3000;
        if (lander.x < -EDGE_MARGIN) {
            const excess = (-EDGE_MARGIN) - lander.x;
            lander.vx += (excess * 0.0001) * dt; 
        } else if (lander.x > this.levelWidth + EDGE_MARGIN) {
            const excess = lander.x - (this.levelWidth + EDGE_MARGIN);
            lander.vx -= (excess * 0.0001) * dt;
        }
        if (lander.y < -EDGE_MARGIN) {
            const excess = (-EDGE_MARGIN) - lander.y;
            lander.vy += (excess * 0.0001) * dt;
        }
    }

    applyGravityWell(levelConfig, dt) {
        if (!levelConfig.gravityWell) return;
        const well = levelConfig.gravityWell;

        // Animate the well position so it drifts around its origin
        this.gravityWellTime = (this.gravityWellTime || 0) + dt * 0.008;
        const orbitR = well.orbitRadius || 180;
        const wx = well.x + Math.sin(this.gravityWellTime * 0.8) * orbitR;
        const wy = well.y + Math.cos(this.gravityWellTime * 0.8) * orbitR;

        // Expose current position so renderer can draw it
        // Implement a 4-second pulse cycle for the gravity well strength
        const pulseMultiplier = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(this.gravityWellTime * Math.PI / 16.0));
        const currentStrength = well.strength * pulseMultiplier;
        this.gravityWellPos = { x: wx, y: wy, radius: well.radius, strength: currentStrength, maxStrength: well.strength, pulse: pulseMultiplier };

        const dx = wx - this.lander.x;
        const dy = wy - this.lander.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < well.radius) {
            // Deadzone at the very center to allow escape
            let pullDist = dist;
            if (pullDist < 15) pullDist = 15; // Cap minimum distance so force drops off near center
            
            // Linear pull that is strongest near center, zero at edge.
            const force = currentStrength * 2.5 * Math.max(0, 1 - (pullDist / well.radius));
            this.lander.vx += (dx / (dist || 1)) * force * dt;
            this.lander.vy += (dy / (dist || 1)) * force * dt;
        }
    }

    integrateLander(dt) {
        // Spawn wind particles if there's wind
        if (Math.abs(this.currentWind) > 0.05 && Math.random() < Math.abs(this.currentWind) * 0.3 * dt) {
            // Spawn around the lander to ensure they are visible
            const spawnX = this.lander.x + (this.currentWind > 0 ? -1200 : 1200) + (Math.random() - 0.5) * 400;
            const spawnY = this.lander.y + (Math.random() - 0.5) * 1200;
            this.particles.push({
                x: spawnX,
                y: spawnY,
                vx: this.currentWind * (12 + Math.random() * 8),
                vy: (Math.random() - 0.5) * 1,
                life: 1.0,
                decay: (0.002 + Math.random() * 0.002) * dt,
                color: 'rgba(255, 255, 255, 0.15)',
                size: 2 + Math.random() * 3
            });
        }

        const lander = this.lander;
        lander.x += lander.vx * dt;
        lander.y += lander.vy * dt;
        
        if (lander.crashed) {
            lander.angle += (lander.angularVelocity || 0) * dt;
            if (lander.angularVelocity) lander.angularVelocity *= Math.pow(0.98, dt);
        }

        // Repulsor fields
        if (this.segments) {
            for (const seg of this.segments) {
                if (seg.repulsor) {
                    const { cx, cy } = this._closestPointOnSeg(lander.x, lander.y, seg.x1, seg.y1, seg.x2, seg.y2);
                    const dx = lander.x - cx, dy = lander.y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150 && dist > 1) {
                        const force = 100 / (dist * dist);
                        lander.vx += (dx / dist) * force * dt;
                        lander.vy += (dy / dist) * force * dt;
                    }
                }
            }
        }

        // Keep lander loosely within extended bounds
        if (lander.x < -4000) { lander.x = -4000; lander.vx *= -0.5; }

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

            // Grapple constraint logic (drone or basic lander tethered cargo)
            if (lander && lander.grabbedBoxId === box.id) {
                // If it's a drone, the winch is at the bottom. For a basic lander, the winch is at the bottom too.
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
                x: this.currentWind * 0.01 * body.mass * FS,
                y: this.gravity * body.mass * FS,
            });

            // Gravity well
            if (this.gravityWellPos) {
                const gw = this.gravityWellPos;
                const dx = gw.x - body.position.x;
                const dy = gw.y - body.position.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < gw.radius) {
                    let pullD = d;
                    if (pullD < 15) pullD = 15;
                    const fMag = gw.strength * 2.5 * Math.max(0, 1 - (pullD / gw.radius)) * FS * dt;
                    Matter.Body.applyForce(body, body.position, { x: (dx / (d || 1)) * fMag * body.mass, y: (dy / (d || 1)) * fMag * body.mass });
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

            // Vacuum Chute Logic
            for (const hub of this.deliveryHubs) {
                if (hub.type === 'chute') {
                    // If box is above the chute opening
                    if (box.x >= hub.x && box.x <= hub.x + hub.width && box.y > hub.y - 60 && box.y < hub.y + 60) {
                        if (!box.vacuumed) {
                            box.vacuumed = true;
                            box.onDeck = false;
                            if (lander.grabbedBoxId === box.id) {
                                lander.grabbedBoxId = null; // force drop
                            }
                            body.isSensor = true; // disable collision with ground so it falls in
                        }
                    }
                    if (box.vacuumed) {
                        const targetX = hub.x + hub.width / 2;
                        const dx = targetX - box.x;
                        // pull towards center of chute and downwards
                        Matter.Body.applyForce(body, body.position, { 
                            x: dx * 0.00005 * body.mass * dt, 
                            y: 0.001 * body.mass * dt 
                        });
                        // damp velocity so it doesn't shoot out sideways
                        Matter.Body.setVelocity(body, {
                            x: body.velocity.x * 0.9,
                            y: body.velocity.y * 0.95
                        });
                    }
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

        if (lander.vehicleType === 'drone') {
            for (const box of this.boxes) {
                box.onDeck = (lander.grabbedBoxId === box.id);
            }
            return;
        }

        // Basic lander: once a box lands on the deck it's magnetically
        // clamped there — it rigidly tracks the deck's position/rotation
        // every frame instead of relying on friction, so normal tilting and
        // maneuvering can no longer shake it loose. Only a crash (handled
        // above) or delivery/vacuum removal detaches it.
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
        const minGap = halfS * 1.9;
        const slotMin = -halfW + halfS * 0.3;
        const slotMax = halfW - halfS * 0.3;

        const attached = this.boxes.filter(b => b.onDeck);

        for (const box of this.boxes) {
            if (box.onDeck) {
                box.deckT = Math.max(slotMin, Math.min(slotMax, box.deckT || 0));
                box.deckN = halfS;
                box.x = dcx + tx * box.deckT + nx * box.deckN;
                box.y = dcy + ty * box.deckT + ny * box.deckN;
                box.vx = lander.vx;
                box.vy = lander.vy;
                continue;
            }

            if (box.flingImmunity && box.flingImmunity > 0) {
                box.flingImmunity--;
                if (box.flingImmunity > 0) continue;
            }

            const rx = box.x - dcx;
            const ry = box.y - dcy;
            const projT = rx * tx + ry * ty;
            const projN = rx * nx + ry * ny;

            // Box center is within horizontal deck bounds and touching the deck surface
            if (Math.abs(projT) < halfW + halfS * 0.5 && projN > -halfS && projN < halfS + 6) {
                // Just landed — snap into a free slot along the deck so it
                // doesn't overlap a box that's already attached.
                let slotT = Math.max(slotMin, Math.min(slotMax, projT));
                for (const other of attached) {
                    const otherT = other.deckT || 0;
                    if (Math.abs(otherT - slotT) < minGap) {
                        slotT = Math.max(slotMin, Math.min(slotMax, otherT + (slotT >= otherT ? minGap : -minGap)));
                    }
                }
                box.onDeck = true;
                box.deckT = slotT;
                box.deckN = halfS;
                box.x = dcx + tx * box.deckT + nx * box.deckN;
                box.y = dcy + ty * box.deckT + ny * box.deckN;
                box.vx = lander.vx;
                box.vy = lander.vy;
                attached.push(box);
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
            // Boxes already magnetically clamped to the deck are positioned
            // rigidly by updateOnDeckStates() — skip them here entirely so
            // stale collision response can't fight that attachment.
            if (box.onDeck) continue;

            // Rel position
            const rx = box.x - dcx;
            const ry = box.y - dcy;

            // Project onto tangent and normal
            const projT = rx * tx + ry * ty;
            const projN = rx * nx + ry * ny;

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
                        const imp = -(1 + 0.3) * rvt; // Bounce off the wall
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
                        const imp = -(1 + 0.3) * rvt; // Bounce off the wall
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
            
            // Spawn height relative to lander, but above terrain
            const allYs = this.segments.flatMap(s => [s.y1, s.y2]);
            const minTerrainY = allYs.length > 0 ? Math.min(...allYs) : 400;
            const landerY = this.lander ? this.lander.y : minTerrainY;
            
            // Try to spawn above the lander's current view, but constrained by terrain
            const baseTargetY = Math.min(landerY - 200, minTerrainY - 100);
            const skyY = baseTargetY - Math.random() * 300;
            
            const rModel = Math.random();
            const model = rModel < 0.4 ? 'pickup' : (rModel < 0.75 ? 'freighter' : 'police');
            const truckW = model === 'pickup' ? 55 + Math.random() * 50 : (model === 'police' ? 65 : 80 + Math.random() * 120);
            const truckH = model === 'pickup' ? 20 + Math.random() * 10 : (model === 'police' ? 22 : 16 + Math.random() * 18);
            const speed = (model === 'police' ? 2.5 + Math.random() : 0.5 + Math.random() * 1.5); // Police are faster
            
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
            
            // Spawn just off screen relative to lander
            const spawnXOffset = 800 + truckW; 
            
            this.ambientTraffic.push({
                x: this.lander ? this.lander.x + (fromRight ? spawnXOffset : -spawnXOffset) : (fromRight ? this.levelWidth + truckW : -truckW),
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

            // Despawn once far off-screen relative to lander
            const landerX = this.lander ? this.lander.x : this.levelWidth / 2;
            if (t.x < landerX - 1600 || t.x > landerX + 1600 || t.y < -600) {
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
                    
                    if (impact > 10 && t.hasCargoBox) {
                        t.hasCargoBox = false;
                        const types = this.currentLevelConfig?.allowedTypes || ['medical', 'food'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        this.spawnCargo(type, t.x, null, t.y);
                    }
                    if (!t.flyingOff) {
                        t.flyingOff = true;
                        t.tiltTarget = (t.vx > 0 ? -1 : 1) * (0.4 + Math.random() * 0.6);
                    }
                    
                    if (l.integrity <= 0) this.triggerExplosion();
                } else if (!t.flyingOff) {
                    // Evasive maneuver if lander gets too close and is moving up or fast
                    const dist = Math.hypot(l.x - tx, l.y - t.y);
                    if (dist < 180 && (Math.abs(l.vy) > 8 || Math.abs(l.vx) > 10)) {
                        // slight course correction
                        t.vy -= 4;
                        t.vx += (t.x > l.x ? 3 : -3);
                        if (Math.random() < 0.2) {
                            t.bubbleText = "Hey, watch it!";
                            t.bubbleTimer = 90; // 1.5 seconds at 60fps
                        }
                    }
                }
            }
        }
    }

    updateParticles() {
        // Check collectible rings
        if (this.collectibles && this.collectibles.length > 0 && !this.lander.crashed) {
            for (let i = this.collectibles.length - 1; i >= 0; i--) {
                const c = this.collectibles[i];
                if (c.type === 'ring') {
                    const r = c.radius || 40;
                    const dx = this.lander.x - c.x;
                    const dy = this.lander.y - c.y;
                    if (dx * dx + dy * dy < r * r) {
                        // Collected!
                        if (c.resource === 'fuel') {
                            this.lander.fuel = Math.min(100, this.lander.fuel + (c.amount || 25));
                            if (window.game) window.game.floatingTexts.push({ text: `+FUEL`, x: c.x, y: c.y, life: 1.5, color: '#60a5fa' });
                        } else if (c.resource === 'cash') {
                            this.cash = (this.cash || 0) + (c.amount || 100);
                            if (window.game) window.game.floatingTexts.push({ text: `+$${c.amount||100}`, x: c.x, y: c.y, life: 1.5, color: '#10b981' });
                        }
                        this.collectibles.splice(i, 1);
                    }
                }
            }
        }
        
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
