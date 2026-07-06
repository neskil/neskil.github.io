// entities.js - Extracted physics logic

const CargoPhysicsEntitiesMixin = {
    createSourcingDepot(x, y, count, allowedVehicles) {
        this.collectionPoint = {
            x: x - 50,
            y: y,
            width: 100,
            height: 15
        };
    },

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
    },

    spawnLander(config, upgrades = {}) {
        // A fresh spawn (level start or respawn-after-death) should never carry over an
        // active monster/out-of-bounds threat from the previous life — otherwise dying
        // out of bounds and respawning with R just gets the new lander eaten immediately.
        this.monster = null;
        this.outOfBoundsTimer = 0;
        if (this.sandWorm) this.sandWorm = null;

        const vehicleType = config.vehicle || 'lander';
        
        // Winch Extender upgrade was purchasable but never applied anywhere — wire it in.
        const ropeMax = (config.ropeLength || 120) + (upgrades.winchExtender || 0) * 50;
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
            currentPad: null,
            // Shield: a depletable charge that mitigates (not blocks) damage while it
            // lasts, then damage passes through fully to hull until it recharges.
            shieldLevel: upgrades.shieldRegen || 0,
            maxShieldCharge: (upgrades.shieldRegen || 0) * 50,
            shieldCharge: (upgrades.shieldRegen || 0) * 50,
            shieldHitFlash: 0
        };
        this._spawnLanderBody();
    },

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

    },

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
    },

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
    },

    applyDamage(lander, amount) {
        if (!lander || amount <= 0) return 0;
        lander.shieldAbsorbedThisHit = false;

        if (lander.shieldCharge > 0) {
            const mitigation = 0.65;
            const absorbed = Math.min(lander.shieldCharge, amount * mitigation);
            lander.shieldCharge -= absorbed;
            amount -= absorbed;
            lander.shieldHitFlash = 1.0;
            lander.shieldAbsorbedThisHit = true;
        }

        lander.integrity -= amount;
        return amount;
    },

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
    },

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
    },

    getCargoColor(type) {
        const colors = {
            'red': '#ef4444',
            'blue': '#3b82f6',
            'green': '#10b981',
            'tethered': '#6366f1',
            'normal': '#f59e0b'
        };
        return colors[type] || '#f59e0b';
    },

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
            emoji: randomEmoji,
            age: 0
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
    },

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

        } else {
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
    },

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
    },

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
    },

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

        // ── Flash core: a couple of huge, near-white particles that decay almost
        // instantly — reads as a bright pop at the moment of impact. Bigger and a
        // touch slower than the first pass so it actually registers before fading.
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: lander.x, y: lander.y,
                vx: 0, vy: 0,
                life: 1.0,
                decay: 0.05 + Math.random() * 0.025,
                color: 'rgba(255, 244, 214, 0.95)',
                size: 45 + Math.random() * 30
            });
        }

        // ── Fireball: hot core burst — larger and slower-decaying than the first
        // pass, and thrown out at lower speed so it fills more space instead of
        // shooting past the frame.
        for (let i = 0; i < 55; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.3 + Math.random() * 5.5;
            this.particles.push({
                x: lander.x + (Math.random() - 0.5) * 15,
                y: lander.y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                life: 1.0,
                decay: 0.009 + Math.random() * 0.016,
                color: Math.random() < 0.7 ? `hsla(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 20}%, 0.9)` : '#facc15',
                size: 10 + Math.random() * 16
            });
        }

        // ── Debris: dark chunks flung out ballistically, faster/further than fire ──
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 7;
            this.particles.push({
                x: lander.x, y: lander.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.5,
                life: 1.0,
                decay: 0.006 + Math.random() * 0.009,
                color: Math.random() < 0.5 ? '#1e293b' : '#475569',
                size: 4 + Math.random() * 6
            });
        }

        // ── Smoke: slow-rising, long-lived, low-alpha — lingers well after the
        // fire and debris have faded, instead of the blast just vanishing. Larger
        // puffs than the first pass for a bigger-reading cloud.
        for (let i = 0; i < 32; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.25 + Math.random() * 1.3;
            this.particles.push({
                x: lander.x + (Math.random() - 0.5) * 20,
                y: lander.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5 - Math.random() * 0.5,
                life: 1.0,
                decay: 0.0022 + Math.random() * 0.004,
                color: `rgba(${60 + Math.random() * 30}, ${60 + Math.random() * 30}, ${65 + Math.random() * 30}, 0.5)`,
                size: 20 + Math.random() * 26
            });
        }

        if (window.game && window.game.screenShake) {
            window.game.screenShake.intensity = Math.max(window.game.screenShake.intensity, 18);
        }
    },

    updateBoxes(dt) {
        const lander = this.lander;
        const FS = this.MATTER_FORCE_SCALE; // converts vel/frame to Matter force

        for (const box of this.boxes) {
            box.age = (box.age || 0) + dt; // frame-units at 60fps — 3600 == 60s

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
    },

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
    },

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
};

Object.assign(CargoPhysics.prototype, CargoPhysicsEntitiesMixin);
