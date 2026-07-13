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
        this.debris = [];

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

    initLevel(levelConfig, width, height, upgrades = {}, portrait = null) {
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
        // Gust cycle: alternates calm → warning (meter flash, no extra force yet) →
        // gust (wind scaled up by gustMult) → repeat. Omit `windGust` for a level
        // with constant/no wind (falls back to the old gentle sinusoidal variance).
        this.windGust = levelConfig.windGust || null;
        this.windGustStart = Date.now();
        this.windWarning = false;
        
        this.boxes = [];
        this.particles = [];
        this.debris = [];
        this.sandWorm = null;
        this.sandWormSpawned = false;

        // Apply aerodynamic coating upgrade
        this.LANDER_DRAG = 0.985 + (upgrades.aerodynamics || 0) * 0.003;
        if (portrait && portrait.includes('driver4.jpg')) {
            // Bo: +5% Top Speed (achieved by reducing air resistance drag force by 5%)
            const dragForce = 1.0 - this.LANDER_DRAG;
            this.LANDER_DRAG = 1.0 - (dragForce * 0.95);
        }

        this.monster = null; // The Out-Of-Bounds cosmic horror
        this.outOfBoundsTimer = 0;
        this.wasInFluid = false;
        this.ambientTraffic = [];
        this.trafficSpawnTimer = 0;
        this.segments = levelConfig.segments ? levelConfig.segments.map(s => ({ ...s })) : [];
        this._buildMatterWorld();
        this.generateTerrain(levelConfig);
        this.spawnLander(levelConfig, upgrades, portrait);

        if (typeof levelConfig.setupPhysics === 'function') {
            levelConfig.setupPhysics(this);
        }

        // Pre-spawn 1 or 2 ambient traffic vehicles so the sky isn't empty on load
        if (this.currentLevelConfig && this.currentLevelConfig.name !== "Depot HQ" && (this.currentLevelConfig.ambientTrafficRate ?? 1) > 0) {
            const numToSpawn = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numToSpawn; i++) {
                this.trafficSpawnTimer = 500; // force a spawn trigger
                this.updateAmbientTraffic(16); // step simulation once (dt in ms)
                // Reposition the newly spawned vehicle directly into the viewport
                const t = this.ambientTraffic[this.ambientTraffic.length - 1];
                if (t && this.lander) {
                    t.x = this.lander.x + (Math.random() * 1000 - 500); // +/- 500px around lander
                }
            }
            this.trafficSpawnTimer = 0; // reset for normal gameplay
        }
    }

    // Old procedural terrain functions removed

    _buildMatterWorld() {
        // Recreate the Matter engine for this level
        if (!this.matterEngine) {
            this.matterEngine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
            
            // One damage event per engine step (deduplicate multiple terrain pairs)
            Matter.Events.on(this.matterEngine, 'collisionStart', (event) => {
                if (!this.lander || !this.landerBody || window.DEV_INVULNERABLE) return;
                let processed = false;
                for (const pair of event.pairs) {
                    if (pair.bodyA !== this.landerBody && pair.bodyB !== this.landerBody) continue;
                    if (processed) continue;
                    const other = pair.bodyA === this.landerBody ? pair.bodyB : pair.bodyA;
                    if (other.label === 'terrain_spikes') {
                        processed = true;
                        this.applyDamage(this.lander, this.lander.maxIntegrity);
                        this.triggerExplosion();
                        continue;
                    }
                    processed = true;
                    const lv = this.landerBody.velocity; // pre-impulse at collisionStart time
                    const impactSpeed = Math.sqrt(lv.x * lv.x + lv.y * lv.y);
                    if (impactSpeed < 1.0) continue;
                    const padType = this._getLanderPad();
                    const onPad = padType !== null;
                    const onCollectionPad = padType === 'collection';
                    const damageThreshold = onCollectionPad ? (this.lander.legsDeployed ? 2.2 : 1.8) : (onPad ? (this.lander.legsDeployed ? 3.5 : 1.8) : 1.0);
                    const surfaceMultiplier = onCollectionPad ? (this.lander.legsDeployed ? 3.5 : 3.5) : (onPad ? (this.lander.legsDeployed ? 1.5 : 3.5) : 16);
                    if (impactSpeed > damageThreshold) {
                        const damage = Math.pow(impactSpeed - damageThreshold, 1.8) * surfaceMultiplier;
                        const hullDamage = this.applyDamage(this.lander, damage);
                        // Shield soaking the hit also protects deck cargo from being flung off
                        if (!this.lander.shieldAbsorbedThisHit) this.checkCargoDamage(hullDamage / this.lander.maxIntegrity);
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
                        if (this.lander.integrity <= 0) {
                            this.triggerExplosion();
                        }
                    }
                }
            });
        } else {
            Matter.World.clear(this.matterEngine.world);
            Matter.Engine.clear(this.matterEngine);
        }
        this.matterWorld = this.matterEngine.world;
        this.boxBodyMap = new Map();
    }

    // Standard ray-casting point-in-polygon test. Used for zone membership
    // (hazards, water bodies) rather than the edge-collision terrain bodies.

    // Centralized damage entry point — routes every hit through the shield first.
    // While shieldCharge > 0 it mitigates 65% of the incoming damage (not a full
    // block) and drains by the full pre-mitigation amount; once depleted, damage
    // passes straight through to hull until the shield recharges. Also flags
    // `shieldAbsorbedThisHit` for one tick so game.js can skip cargo-drop-on-hit
    // logic while the shield is actively soaking a hit.

    // Water bodies were purely decorative (see README) — this gives them an actual
    // trampoline-like bounce: hitting the surface with some downward speed rebounds
    // you, and sitting inside the polygon applies gentle buoyancy + drag so the
    // lander settles into a bob instead of sinking straight through.

    // Shortest distance from point (px,py) to segment (ax,ay)-(bx,by).
    // Used by laser hazards to test the lander against the beam line.

    generateTerrain(config) {
        const w = this.levelWidth;
        const h = this.levelHeight;
        this.terrainPolygons = (config.terrainPolygons || []).map(poly => {
            if (Array.isArray(poly)) return poly;
            const pts = poly.pts || [];
            if (poly.shadowEnabled !== undefined) pts.shadowEnabled = poly.shadowEnabled;
            if (poly.shadowAngle !== undefined) pts.shadowAngle = poly.shadowAngle;
            if (poly.shadowLength !== undefined) pts.shadowLength = poly.shadowLength;
            return pts;
        });
        this.hazards = config.hazards || [];
        this.collectibles = config.collectibles ? config.collectibles.map(c => ({...c})) : [];
        this.waterBodies = config.waterBodies || [];

        // Topmost vertex across all terrain (including any floating/disconnected
        // pieces) — used by the background parallax hill layers so they never
        // draw above terrain that sits unusually high (e.g. a floating island),
        // which would otherwise show a jagged hill silhouette poking through gaps.
        this.terrainTopY = Infinity;
        for (const poly of this.terrainPolygons) {
            for (const p of poly) {
                if (p.y < this.terrainTopY) this.terrainTopY = p.y;
            }
        }
        if (!isFinite(this.terrainTopY)) this.terrainTopY = 0;
        
        const ps = config.padScale || 1.0;
        this.startDepot = { x: config.startX !== undefined ? config.startX : 80, y: config.startY !== undefined ? config.startY : undefined, width: Math.round(80 * ps), height: 15 };
        this.collectionPoint = { x: config.collectionX !== undefined ? config.collectionX : 280, y: config.collectionY !== undefined ? config.collectionY : undefined, width: Math.round(100 * ps), height: 15 };
        this.deliveryHubs = (config.deliveryHubs || []).map(hub => ({
            x: hub.x, y: hub.y !== undefined ? hub.y : undefined, width: Math.round((hub.width || 80) * ps), height: 15,
            color: hub.color, type: hub.type, name: hub.name || 'Terminal', style: hub.style
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
                if (p1.invisibleEdge) continue;
                
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
                        label: p1.edgeHazard === 'spikes' ? 'terrain_spikes' : 'terrain',
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

    // getTerrainHeight and getTerrainSlope removed in favor of Matter.js collisions and polygons

    // ── Segment collision helpers ──────────────────────────────────────────────

    // Returns { cx, cy, t } — closest point on segment (x1,y1)→(x2,y2) to (px,py)

    // Tests point (px,py) against all segments. Returns strongest hit { pen, nx, ny } or null.
    // skin = collision radius around the segment line

    // Resolve lander corners against all segments

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

        // Step custom kinematics for the lander unconditionally.
        // resolveSegmentCollisions is a discrete point-vs-segment test with a
        // small skin margin — at high speed a single big integration step can
        // move the lander clean past a terrain segment before the check ever
        // sees an overlap (tunneling straight through the ground/pad). Substep
        // the integrate+resolve pair so no single step covers more than the
        // collision skin width.
        const speed = Math.sqrt(this.lander.vx * this.lander.vx + this.lander.vy * this.lander.vy);
        const maxStepDist = 4; // < SKIN (5) used by resolveSegmentCollisions
        const substeps = Math.min(20, Math.max(1, Math.ceil((speed * dt) / maxStepDist)));
        const subDt = dt / substeps;
        for (let i = 0; i < substeps; i++) {
            this.integrateLander(subDt);
            this.resolveSegmentCollisions();
        }
        this.applyWaterBounce(dt);

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
        this.updatePolice(dt);
        this.updateAmbientTraffic(dt);
        this.updateDebris(dt);
        this.updateParticles();
    }

    // resolveLanderCollisions removed in favor of resolveSegmentCollisions handling all terrain polygons

    // Ceiling collision is now handled natively by Matter.js static bodies

}
