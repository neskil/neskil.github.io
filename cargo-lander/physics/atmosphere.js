// atmosphere.js - Extracted physics logic

const CargoPhysicsAtmosphereMixin = {
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
            
            // Try to spawn above the lander's current view, but constrained by terrain.
            // On tall-terrain levels baseTargetY can go far negative, which used to
            // collapse every spawn onto the same Math.max(80, ...) floor — spread the
            // clamped case over a band instead of a single point.
            const skyFloor = 80;
            const baseTargetY = Math.min(landerY - 200, minTerrainY - 100);
            const pickSkyY = () => {
                const y = baseTargetY - Math.random() * 300;
                return y < skyFloor ? skyFloor + Math.random() * 320 : y;
            };
            let skyY = pickSkyY();
            // Avoid stacking multiple trucks on the same flight line — retry a few times
            // if the candidate Y is too close to an already-active truck.
            const minYGap = 70;
            let ySpawnAttempts = 0;
            while (ySpawnAttempts < 6 && this.ambientTraffic.some(o => Math.abs(o.y - skyY) < minYGap)) {
                skyY = pickSkyY();
                ySpawnAttempts++;
            }

            const rModel = Math.random();
            const model = rModel < 0.5 ? 'pickup' : (rModel < 0.90 ? 'freighter' : 'police');
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
                y: skyY,
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
                // Only some trucks bother reacting to a close lander; the rest fly their line.
                evasive: Math.random() < 0.6,
                evadeCooldown: 0,
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
                    this.applyDamage(l, impact * 4);
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
                } else if (!t.flyingOff && t.evasive) {
                    // Evasive maneuver if lander gets too close and is moving up or fast.
                    // Edge-triggered with a cooldown + dt-scaled nudge, so it's a small
                    // course correction rather than an unbounded per-frame velocity ramp.
                    t.evadeCooldown = Math.max(0, (t.evadeCooldown || 0) - dt);
                    const dist = Math.hypot(l.x - tx, l.y - t.y);
                    if (dist < 180 && (Math.abs(l.vy) > 8 || Math.abs(l.vx) > 10) && t.evadeCooldown <= 0) {
                        t.vy = Math.max(t.vy - 1.5 * dt, -6);
                        t.vx += (t.x > l.x ? 1.5 : -1.5) * dt;
                        t.evadeCooldown = 45; // ~0.75s at 60fps before it can react again
                        if (Math.random() < 0.2) {
                            t.bubbleText = "Hey, watch it!";
                            t.bubbleTimer = 90; // 1.5 seconds at 60fps
                        }
                    }
                }
            }
        }
    },

    updateMonster(levelConfig, dt) {
        const lander = this.lander;

        // Once the lander is gone, the monster dives back into the depths and despawns.
        if (lander.crashed) {
            if (this.monster) {
                const m = this.monster;
                m.retreatTimer = (m.retreatTimer || 0) + dt;
                // Brief pause on the kill before it dives — reads as a beat, not a jump-cut.
                const pauseFrames = 40; // ~0.65s at 60fps
                if (m.retreatTimer > pauseFrames) {
                    // Force an aggressive turn downwards so it doesn't float into the sky
                    if (m.vy < 15) m.vy += 1.4 * dt;
                    m.vy += 0.55 * dt;              // accelerate downward, retreating
                    m.vx *= Math.pow(0.90, dt);
                    m.x += m.vx * dt;
                    m.y += m.vy * dt;
                }

                if (!m.trail) m.trail = [];
                const lastTP = m.trail[0];
                if (!lastTP || Math.hypot(m.x - lastTP.x, m.y - lastTP.y) >= 2) {
                    m.trail.unshift({ x: m.x, y: m.y });
                    if (m.trail.length > 800) m.trail.pop();
                }

                const oob = levelConfig.outOfBounds;
                const despawnDepth = (oob && oob.monsterDepth) ? oob.monsterDepth + 400 : 1800;
                // Minimum time before it's allowed to leave, even if it reaches despawn
                // depth quickly — previously it could vanish almost instantly after the kill.
                const minRetreatTime = pauseFrames + 90; // ~1.5s of visible retreat
                if (m.retreatTimer > minRetreatTime && (m.y > despawnDepth || m.y > this.levelHeight + 400)) {
                    this.monster = null;
                }
            }
            
            if (this.sandWorm) {
                this.sandWorm.state = 'retracting';
            } else {
                return; // Only return early if no active sandworm
            }
        }

        // Check out of fuel and idle
        let vSq = 0;
        if (lander && lander.matterBody && lander.matterBody.velocity) {
            vSq = lander.matterBody.velocity.x ** 2 + lander.matterBody.velocity.y ** 2;
        }
        if (lander && lander.fuel <= 0 && vSq < 0.1 && !lander.crashed) {
            this.idleOutOfFuelTimer = (this.idleOutOfFuelTimer || 0) + dt;
        } else {
            this.idleOutOfFuelTimer = 0;
        }

        // Spawn logic: Trigger if lander sinks below monsterDepth OR stays out of bounds too long OR out of fuel
        const oob = levelConfig.outOfBounds;
        const tooDeep = oob && lander.y > oob.monsterDepth;
        if (tooDeep || this.outOfBoundsTimer > 250 || this.idleOutOfFuelTimer > 300) { // ~4s OOB, ~5s idle
            if (!this.monster) {
                // Spawn monster genuinely outside the current viewport (not just a fixed
                // world-space offset, which could still land on-screen at low zoom).
                const marginX = (this.viewHalfW || 450) + 150;
                const marginY = (this.viewHalfH || 350) + 150;
                let spawnX = lander.x;
                let spawnY = lander.y;
                if (tooDeep) {
                    spawnY = Math.max(oob.monsterDepth + 200, lander.y + marginY);
                } else {
                    spawnX = lander.x < -150 ? lander.x - marginX
                        : (lander.x > this.levelWidth + 150 ? lander.x + marginX
                        : lander.x + (Math.random() < 0.5 ? -1 : 1) * marginX);
                    spawnY = lander.y > this.levelHeight ? lander.y + marginY : lander.y - marginY;
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
                        this.applyDamage(lander, 8 * dt);
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
        if (this.hazards && this.hazards.length > 0) {
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
                const thickness = h.thickness || 14;

                // Check lander
                if (!lander.crashed) {
                    const distL = this.distToSegment(lander.x, lander.y, a.x, a.y, b.x, b.y);
                    if (distL <= thickness) {
                        const bx = b.x - a.x, by = b.y - a.y;
                        const blen = Math.hypot(bx, by) || 1;
                        let nx = -by / blen, ny = bx / blen;
                        const side = (lander.x - a.x) * nx + (lander.y - a.y) * ny;
                        if (side < 0) { nx = -nx; ny = -ny; }
                        lander.vx += nx * 2;
                        lander.vy += ny * 2;

                        this.applyDamage(lander, (h.damagePerSec || 40) * dt / 60);

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

                // Check cargo boxes
                if (this.boxes) {
                    for (let boxIdx = this.boxes.length - 1; boxIdx >= 0; boxIdx--) {
                        const box = this.boxes[boxIdx];
                        if (box.delivered || box.lost) continue;
                        
                        const distB = this.distToSegment(box.x, box.y, a.x, a.y, b.x, b.y);
                        if (distB <= thickness + 6) {
                            if (window.CargoAudio) CargoAudio.playCollision(2);
                            for (let i = 0; i < 8; i++) {
                                this.particles.push({
                                    x: box.x + (Math.random() - 0.5) * 20,
                                    y: box.y + (Math.random() - 0.5) * 20,
                                    vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5 - 2,
                                    life: 1.0, decay: 0.04 + Math.random() * 0.04,
                                    color: '#f472b6',
                                    size: 2 + Math.random() * 3,
                                });
                            }
                            box.lost = true;
                            box.lostReason = 'laser';
                        }
                    }
                }
            }
        }

        // Handle generic hazards — each is a polygon zone now (was a circle),
        // so membership is a point-in-polygon test rather than a radius check.
        if (this.hazards && this.hazards.length > 0) {
            const targets = [lander];
            if (this.boxes) targets.push(...this.boxes);
            
            for (const h of this.hazards) {
                if (h.type === 'laser' || h.type === 'sandworm' || h.type === 'pickup') continue;
                
                if (h.type === 'crusher') {
                    if (lander.crashed) continue;
                    const timeMs = this.hazardTime || 0;
                    const phaseOff = h.phase || 0;
                    const period = h.period || 3000;
                    const t = (Math.sin(((timeMs + phaseOff) / period) * Math.PI * 2) + 1) / 2;
                    const cx = h.x + (h.travelX || 0) * t;
                    const cy = h.y + (h.travelY || 0) * t;
                    
                    if (lander.x > cx && lander.x < cx + h.w && lander.y > cy && lander.y < cy + h.h) {
                        this.applyDamage(lander, 25 * dt);
                        const ky = (h.travelY || 0) < 0 ? -1 : 1;
                        lander.vy += ky * dt;
                        this.particles.push({ x: lander.x, y: lander.y, vx: (Math.random() - 0.5)*2, vy: (Math.random() - 0.5)*2, life: 1, color: '#ef4444', size: 3 });
                        if (lander.integrity <= 0) this.triggerExplosion();
                    }
                    continue;
                }

                if (!h.pts || h.pts.length < 3) continue;
                
                for (const target of targets) {
                    if (target === lander && lander.crashed) continue;
                    if (!this.pointInPolygon(target.x, target.y, h.pts)) continue;
                    
                    if (h.type === 'repulsor') {
                        // Apply constant wind force
                        target.vx += (h.travelX || 0) * dt;
                        target.vy += (h.travelY || 0) * dt;
                    } else if (h.type === 'bouncer') {
                        // Massive knockback from centroid
                        const c = this.polygonCentroid(h.pts);
                        const dx = target.x - c.x;
                        const dy = target.y - c.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        target.vx += (dx / dist) * 15;
                        target.vy += (dy / dist) * 15;
                        if (target === lander) {
                            this.applyDamage(lander, 5 * dt);
                            if (window.CargoAudio) CargoAudio.playCollision(2);
                        }
                    } else { // default 'zone'
                        if (target !== lander) continue; // default zone only affects lander
                        
                        const c = this.polygonCentroid(h.pts);
                        const dx = lander.x - c.x;
                        const dy = lander.y - c.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        lander.vx += (dx / dist) * 2;
                        lander.vy += (dy / dist) * 2;
                        this.applyDamage(lander, 25 * dt); // High damage

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
        }
    },

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
    },

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
};

Object.assign(CargoPhysics.prototype, CargoPhysicsAtmosphereMixin);
