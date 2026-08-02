// atmosphere.js - Extracted physics logic

const CargoPhysicsAtmosphereMixin = {
    updateAmbientTraffic(dt) {
        if (!this.ambientTraffic) this.ambientTraffic = [];

        // ambientTrafficRate (level config, default 1) scales both max
        // concurrent traffic and spawn frequency — 0 opts a level out of
        // ambient traffic entirely instead of just tuning it down.
        const trafficRate = this.currentLevelConfig?.ambientTrafficRate ?? 1;
        if (trafficRate <= 0) return;
        const maxTraffic = Math.max(1, Math.round(5 * trafficRate));
        const spawnIntervalMs = Math.max(60, 420 / trafficRate);

        // Spawn a new truck periodically (max maxTraffic on screen)
        this.trafficSpawnTimer = (this.trafficSpawnTimer || 0) + dt;
        if (this.trafficSpawnTimer > spawnIntervalMs && this.ambientTraffic.length < maxTraffic) {
            this.trafficSpawnTimer = 0;
            const fromRight = Math.random() > 0.5;
            
            // Spawn height relative to lander, but above terrain
            const allYs = this.segments.flatMap(s => [s.y1, s.y2]);
            const minTerrainY = allYs.length > 0 ? Math.min(...allYs) : 400;
            const landerY = this.lander ? this.lander.y : minTerrainY;
            
            // Check for level config overrides
            const confMinY = this.currentLevelConfig?.ambientTrafficMinY;
            const confMaxY = this.currentLevelConfig?.ambientTrafficMaxY;
            
            // Try to spawn above the lander's current view, but constrained by terrain.
            // On tall-terrain levels baseTargetY can go far negative, which used to
            // collapse every spawn onto the same Math.max(80, ...) floor — spread the
            // clamped case over a band instead of a single point.
            const skyFloor = 80;
            const baseTargetY = Math.min(landerY - 200, minTerrainY - 100);
            const pickSkyY = () => {
                if (confMinY != null && confMaxY != null) {
                    return confMinY + Math.random() * (confMaxY - confMinY);
                } else if (confMinY != null) {
                    const maxB = Math.max(confMinY + 300, Math.min(landerY - 200, minTerrainY - 100));
                    return confMinY + Math.random() * (maxB - confMinY);
                } else if (confMaxY != null) {
                    const minB = Math.min(confMaxY - 300, 80);
                    return minB + Math.random() * (confMaxY - minB);
                }
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
            const speedMult = this.currentLevelConfig?.ambientTrafficSpeed ?? 1;
            const speed = (model === 'police' ? 2.5 + Math.random() : 0.5 + Math.random() * 1.5) * speedMult; // Police are faster
            
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
            // flyOffDelay is in frames (60fps). Needs to be large enough to let them cross the screen.
            const flyOffDelay = willFlyOff ? 1500 + Math.random() * 2000 : Infinity;
            
            // Spawn safely off screen relative to lander, even on ultrawide monitors
            const spawnXOffset = 2000 + truckW; 
            
            this.ambientTraffic.push({
                x: this.lander ? this.lander.x + (fromRight ? spawnXOffset : -spawnXOffset) : (fromRight ? this.levelWidth + truckW : -truckW),
                y: skyY,
                baseY: skyY,
                vy: 0,
                vx: (fromRight ? -speed : speed) * 0.2, // Spawns slower and accelerates
                baseVx: fromRight ? -speed : speed,
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
            } else {
                // 1. Terrain & Obstacle Avoidance (Lookahead pathfinding)
                let obstacleHeight = 1000; // default low ground
                const lookAheadRange = 500;
                const minX = Math.min(t.x, t.x + (t.vx > 0 ? lookAheadRange : -lookAheadRange));
                const maxX = Math.max(t.x, t.x + (t.vx > 0 ? lookAheadRange : -lookAheadRange));
                
                // Scan terrain segments ahead
                if (this.segments) {
                    this.segments.forEach(s => {
                        const sMinX = Math.min(s.x1, s.x2);
                        const sMaxX = Math.max(s.x1, s.x2);
                        if (sMaxX >= minX && sMinX <= maxX) {
                            obstacleHeight = Math.min(obstacleHeight, s.y1, s.y2);
                        }
                    });
                }
                
                // Scan static physics bodies (buildings, pads)
                if (this.engine && this.engine.world) {
                    this.engine.world.bodies.forEach(b => {
                        if (b.isStatic && b.bounds) {
                            if (b.bounds.max.x >= minX && b.bounds.min.x <= maxX) {
                                obstacleHeight = Math.min(obstacleHeight, b.bounds.min.y);
                            }
                        }
                    });
                }
                
                // Keep a safe distance above the highest obstacle ahead
                const safeAlt = obstacleHeight - 140; 
                const targetY = Math.min(t.baseY, safeAlt); // Target either cruise alt or obstacle clearance
                
                // Smooth proportional control for altitude (eliminates bouncing/oscillation)
                const diffY = targetY - t.y;
                const desiredVy = Math.max(-3, Math.min(3, diffY * 0.05)); // Cap climb/descent speed
                
                t.vy += (desiredVy - t.vy) * 0.04 * dt;

                // 2. Player Avoidance (Slow down if lander is in front)
                let playerInWay = false;
                if (this.lander && !this.lander.crashed) {
                    const lx = this.lander.x;
                    const ly = this.lander.y;
                    const distX = lx - t.x;
                    // Significantly reduced distance (150px instead of 400px) so they are a risk
                    const inFront = (t.baseVx > 0 && distX > 0 && distX < 150) || (t.baseVx < 0 && distX < 0 && distX > -150);
                    const sameAlt = Math.abs(ly - t.y) < 60;
                    if (inFront && sameAlt) {
                        playerInWay = true;
                    }
                }

                if (playerInWay) {
                    // Brake slowly
                    t.vx *= Math.pow(0.9, dt);
                    if (Math.random() < 0.01 && t.bubbleTimer <= 0) {
                        t.bubbleText = "Honk!";
                        t.bubbleTimer = 60;
                    }
                } else {
                    // Accelerate back to cruise speed (predictable horizontal motion)
                    t.vx += (t.baseVx - t.vx) * 0.02 * dt;
                }
                
                // Subtle pitch adjustment based on vertical movement
                t.angle = (t.vy * 0.03) * (t.vx > 0 ? 1 : -1);
            }

            t.x += t.vx * dt;
            t.y += t.vy * dt;
            t.lightPhase += 0.05 * dt;

            // Despawn once far off-screen relative to lander
            const landerX = this.lander ? this.lander.x : this.levelWidth / 2;
            if (t.x < landerX - 2500 || t.x > landerX + 2500 || t.y < -600) {
                this.ambientTraffic.splice(i, 1);
                continue;
            }

            // Mild collision push (keep but remove the chaotic evasive maneuver)
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
                }
            }
        }
    },

    // Per-strike sandworm tuning, stashed on the worm at spawn so the update
    // loop never has to re-find the hazard it came from (the roof worm has no
    // hazard at all). Every default reproduces the original hardcoded strike,
    // so a sandworm hazard that sets none of these behaves exactly as before.
    //
    //   trackFrames  — frames of active homing before the arc goes ballistic.
    //                  Note this counts FRAMES, not seconds (dt is 1.0 per
    //                  60fps frame everywhere in this engine).
    //   steer        — homing acceleration per frame during that window
    //   maxSpeed     — speed cap while homing
    //   decay        — per-frame speed multiplier once tracking ends. Sets how
    //                  far the strike carries: reach ≈ lungeSpeed / (1 - decay).
    //   retractSpeed — how fast it withdraws to its burrow afterwards
    //   hitRadius    — contact radius against the lander, world px
    //   damage       — hull points per frame while inside hitRadius
    _sandWormTuning(h) {
        return {
            trackFrames:  h?.trackFrames  ?? 1.2,
            steer:        h?.steer        ?? 2.5,
            maxSpeed:     h?.maxSpeed     ?? 50,
            decay:        h?.decay        ?? 0.88,
            retractSpeed: h?.retractSpeed ?? 12,
            hitRadius:    h?.hitRadius    ?? 80,
            damage:       h?.damage       ?? 8,
        };
    },

    // ── Altitude fog band ─────────────────────────────────────────────────────
    // A soft ceiling made of weather instead of geometry: density ramps from 0
    // at fogBandBottomY to 1 at fogBandTopY (and stays 1 above it), and at full
    // density the grit costs `fogBandDamage` hull points per second. The curve
    // lives here rather than in the renderer so the visible band and the damage
    // can never drift apart — render/fog.js reads this same function.
    fogDensityAt(y) {
        const cfg = this.currentLevelConfig;
        if (!cfg) return 0;
        const topY = cfg.fogBandTopY;
        const botY = cfg.fogBandBottomY;
        if (topY == null || botY == null || botY <= topY) return 0;
        const t = Math.max(0, Math.min(1, (botY - y) / (botY - topY)));
        return t * t * (3 - 2 * t); // smoothstep
    },

    updateAltitudeFog(dt) {
        const lander = this.lander;
        if (!lander) { this.fogDensity = 0; return; }

        const density = lander.crashed ? 0 : this.fogDensityAt(lander.y);
        this.fogDensity = density;

        const dps = this.currentLevelConfig?.fogBandDamage || 0;
        if (lander.crashed || dps <= 0 || density <= 0.01) return;

        // dps is per second; dt is in 60fps frames.
        this.applyDamage(lander, (dps * density * dt) / 60);

        // Grit sparking off the hull — the abrasion is a slow drain, so it needs
        // a visible cause or it just reads as a bug.
        if (Math.random() < 0.09 * density * dt) {
            this.particles.push({
                x: lander.x + (Math.random() - 0.5) * 34,
                y: lander.y + (Math.random() - 0.5) * 22,
                vx: (Math.random() - 0.5) * 4 - 2,
                vy: (Math.random() - 0.5) * 3,
                life: 0.7, decay: 0.05 + Math.random() * 0.05,
                color: Math.random() > 0.5 ? '#fcd34d' : '#d97706',
                size: 1.5 + Math.random() * 2,
            });
        }

        if (lander.integrity <= 0) this.triggerExplosion();
    },

    updatePolice(dt) {
        const lander = this.lander;

        if (lander.crashed) {
            if (this.police) {
                // Fly away
                this.police.vy -= 1 * dt; 
                this.police.y += this.police.vy * dt;
                if (this.police.y < lander.y - 1500) this.police = null;
            }
            return;
        }

        const tooHigh = lander.y < -400;
        
        if (tooHigh) {
            this.policeTimer = (this.policeTimer || 0) + dt;
        } else {
            this.policeTimer = 0;
            if (this.police) {
                // Leave if lander is safe
                this.police.vy -= 0.5 * dt;
                this.police.y += this.police.vy * dt;
                if (this.police.y < lander.y - 1500) this.police = null;
                return;
            }
        }

        if (this.policeTimer > 250) {
            if (!this.police) {
                this.police = {
                    x: lander.x,
                    y: lander.y - 1000,
                    vx: 0,
                    vy: 10,
                    size: 80,
                    sirenPhase: 0,
                };
            }
        }

        if (this.police) {
            const p = this.police;
            const dx = lander.x - p.x;
            const dy = lander.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Chase logic
            const force = 0.12;
            p.vx += (dx / dist) * force * dt;
            p.vy += (dy / dist) * force * dt;

            // Speed limit damping
            p.vx *= Math.pow(0.97, dt);
            p.vy *= Math.pow(0.97, dt);

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.sirenPhase += dt * 0.2;

            if (dist < p.size / 2 + lander.width / 2) {
                lander.crashed = true;
                lander.busted = true;
                p.vx = lander.vx;
                p.vy = lander.vy;
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

                const wbBottom = levelConfig.worldBounds?.bottomY;
                const despawnDepth = wbBottom != null ? wbBottom + 400 : 1800;
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

        // Check if deployed parachute and idle on non-pad terrain
        let vSq = 0;
        if (lander && lander.matterBody && lander.matterBody.velocity) {
            vSq = lander.matterBody.velocity.x ** 2 + lander.matterBody.velocity.y ** 2;
        }
        if (lander && lander.chuteDeployed && !lander.landed && vSq < 0.1 && !lander.crashed) {
            this.idleChuteTimer = (this.idleChuteTimer || 0) + dt;
        } else {
            this.idleChuteTimer = 0;
        }

        // Spawn logic: Trigger if lander sinks below the bottom world boundary
        // (worldBounds.bottomY with the 'monster' action — the old
        // outOfBounds.monsterDepth) OR stays out of bounds too long OR stranded with chute
        const wb = levelConfig.worldBounds || {};
        const tooDeep = wb.bottomY != null && (wb.bottomAction || 'monster') === 'monster'
            && lander.y > wb.bottomY;
        if (tooDeep || this.outOfBoundsTimer > 250 || this.idleChuteTimer > 600) { // ~4s OOB, ~10s stranded
            if (!this.monster) {
                // Spawn monster genuinely outside the current viewport (not just a fixed
                // world-space offset, which could still land on-screen at low zoom).
                const marginX = (this.viewHalfW || 450) + 150;
                const marginY = (this.viewHalfH || 350) + 150;
                let spawnX = lander.x;
                let spawnY = lander.y;
                if (tooDeep) {
                    spawnY = Math.max(wb.bottomY + 200, lander.y + marginY);
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
                lander.eatenByMonster = true; // game.js's crash handler reads this to
                                                // force a hard mission failure instead
                                                // of the normal respawnable-crash flow —
                                                // being devoured reads as final, not a
                                                // fender-bender you press R to shrug off.
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

                // Check hazard polygons for sandworm zones — the worm danger
                // area is placed as a `sandworm`-type hazard polygon (see the
                // level editor's Hazard tab).
                let hasSandwormHazard = false;
                let zoneHazard = null;
                for (const h of this.hazards) {
                    if (h.type === 'sandworm' && h.pts && h.pts.length > 0) {
                        hasSandwormHazard = true;
                        let cx = 0, cy = 0;
                        for (let p of h.pts) { cx += p.x; cy += p.y; }
                        cx /= h.pts.length; cy /= h.pts.length;

                        const reach = h.reach || 300;
                        const dist = Math.hypot(lander.x - cx, lander.y - cy);
                        if (dist <= reach) {
                            inWormZone = true;
                            zoneHazard = h;
                            let baseRate = h.spawnRate || 1.0;
                            let proxScale = h.proximityScale || 0;
                            // As distance goes from reach -> 0, factor goes from 0 -> 1
                            let proximityFactor = 1 - (dist / reach);
                            riskMultiplier = baseRate * (1 + (proximityFactor * proxScale));
                            break;
                        }
                    }
                }
                
                // Play radar ping if there is a sandworm hazard in the level.
                // It helps build tension and tells the player a sandworm is lurking.
                if (hasSandwormHazard) {
                    this.wormRadarTimer = (this.wormRadarTimer || 0) + dt;
                    const pingPeriod = inWormZone ? 60 : 220; // Faster ping when inside the danger zone
                    if (this.wormRadarTimer >= pingPeriod) {
                        this.wormRadarTimer = 0;
                        if (window.CargoAudio && CargoAudio.playRadarPing) {
                            CargoAudio.playRadarPing();
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
                        const speed = zoneHazard?.lungeSpeed ?? 38; // fast lunge
                        this.sandWorm = {
                            x: spawnX, y: spawnY,
                            vx: (dxL / distL) * speed,
                            vy: (dyL / distL) * speed,
                            state: 'lunging',
                            lungeTimer: 0,   // how long it's been lunging
                            trail: [],
                            length: zoneHazard?.wormLength ?? 35,
                            spawnY: spawnY,  // remember surface Y for retract target
                            spawnX: spawnX,
                            ...this._sandWormTuning(zoneHazard),
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
                            ...this._sandWormTuning(null),
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
                    // Tracking phase: steer toward the lander for `trackFrames`
                    // frames, then coast ballistically. Short window = the strike
                    // is dodgeable by moving and only really punishes hovering;
                    // `decay` sets how far past the surface the arc carries.
                    if (w.lungeTimer < w.trackFrames) {
                        const dxL = lander.x - w.x;
                        const dyL = lander.y - w.y;
                        const distL = Math.max(1, Math.hypot(dxL, dyL));
                        // Steer gradually toward lander
                        w.vx += (dxL / distL) * w.steer * dt;
                        w.vy += (dyL / distL) * w.steer * dt;
                        // Cap speed
                        const spd = Math.hypot(w.vx, w.vy);
                        if (spd > w.maxSpeed) { w.vx = (w.vx / spd) * w.maxSpeed; w.vy = (w.vy / spd) * w.maxSpeed; }
                    } else {
                        // Tracking over — decelerate, then retract
                        w.vx *= Math.pow(w.decay, dt);
                        w.vy *= Math.pow(w.decay, dt);
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
                    const retractSpeed = w.retractSpeed;
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
                    if (dist < w.hitRadius && !lander.crashed) {
                        this.applyDamage(lander, w.damage * dt);
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

        // Handle incinerator zones — a polygon area (unlike the laser's line
        // segment) that pulses on the same charge → active duty-cycle pattern.
        // While active it damages the lander AND destroys any cargo box caught
        // inside (sets box.lost so game.js's removeCargoBox() cleans it up),
        // unlike the generic 'zone' hazard below which never touches cargo.
        // Pure damage/burn — no knockback — so it reads distinctly from the
        // 'repulsor' wind hazard below, which is knockback-only and never
        // damages. Keeping the two effects (push vs. burn) on separate hazard
        // types avoids them feeling like the same mechanic reskinned.
        if (this.hazards && this.hazards.length > 0) {
            for (const h of this.hazards) {
                if (h.type !== 'incinerator') continue;
                if (!h.pts || h.pts.length < 3) continue;

                const onMs = h.onMs ?? 1600;
                const offMs = h.offMs ?? 1800;
                const warnMs = h.warnMs ?? 600;
                const period = onMs + offMs;
                const t = ((this.hazardTime + (h.phaseOffset || 0)) % period + period) % period;
                const charging = t >= offMs - warnMs && t < offMs;
                const active = t >= offMs;
                h.zoneState = { charging, active }; // exposed for renderer

                if (!active) continue;

                if (!lander.crashed && this.pointInPolygon(lander.x, lander.y, h.pts)) {
                    this.applyDamage(lander, (h.damagePerSec || 30) * dt / 60);

                    if (window.CargoAudio) CargoAudio.playCollision(1);
                    for (let i = 0; i < 2; i++) {
                        this.particles.push({
                            x: lander.x + (Math.random() - 0.5) * 14,
                            y: lander.y + (Math.random() - 0.5) * 14,
                            vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3 - 1,
                            life: 0.5, decay: 0.05 + Math.random() * 0.05,
                            color: Math.random() > 0.5 ? '#fb923c' : '#f87171',
                            size: 2 + Math.random() * 2,
                        });
                    }
                    if (lander.integrity <= 0) this.triggerExplosion();
                }

                if (this.boxes) {
                    for (const box of this.boxes) {
                        if (box.delivered || box.lost) continue;
                        if (!this.pointInPolygon(box.x, box.y, h.pts)) continue;

                        if (window.CargoAudio) CargoAudio.playCollision(2);
                        for (let i = 0; i < 10; i++) {
                            this.particles.push({
                                x: box.x + (Math.random() - 0.5) * 20,
                                y: box.y + (Math.random() - 0.5) * 20,
                                vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 5 - 1,
                                life: 1.0, decay: 0.03 + Math.random() * 0.04,
                                color: Math.random() > 0.4 ? '#f97316' : '#fde047',
                                size: 2 + Math.random() * 3,
                            });
                        }
                        box.lost = true;
                        box.lostReason = 'incinerator';
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
                if (h.type === 'laser' || h.type === 'incinerator' || h.type === 'sandworm' || h.type === 'pickup' || h.type === 'gravwell') continue;
                
                if (h.type === 'crusher') {
                    if (!h.pts || h.pts.length < 2) continue;
                    const p1 = h.pts[0];
                    const p2 = h.pts[1];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 1) continue;
                    
                    const ux = dx / dist;
                    const uy = dy / dist;
                    
                    const waitU = h.waitUnloadedMs || 1000;
                    const crushT = h.crushMs || 200;
                    const waitL = h.waitLoadedMs || 500;
                    const retractT = h.retractMs || 1500;
                    const cycle = waitU + crushT + waitL + retractT;
                    
                    const timeMs = (this.hazardTime || 0) + (h.phaseOffset || 0);
                    const t = timeMs % cycle;
                    
                    let progress = 0;
                    if (t < waitU) progress = 0;
                    else if (t < waitU + crushT) progress = (t - waitU) / crushT;
                    else if (t < waitU + crushT + waitL) progress = 1.0;
                    else progress = 1.0 - (t - waitU - crushT - waitL) / retractT;
                    
                    // Ease the movement for a mechanical feel (sine ease-in-out)
                    progress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                    
                    const thickness = h.thickness || 40;
                    
                    // Store state for rendering
                    h.zoneState = { progress, ux, uy, dist };

                    for (const target of targets) {
                        if (target === lander && lander.crashed) continue;
                        
                        // Project target onto local axes
                        const tx = target.x - p1.x;
                        const ty = target.y - p1.y;
                        const px = tx * ux + ty * uy; // distance along A-B
                        const py = tx * (-uy) + ty * ux; // distance perpendicular
                        
                        const hitRadius = (target === lander) ? 10 : 8; // approximate collision radii
                        
                        // Check if in the danger corridor
                        if (Math.abs(py) <= thickness / 2 + hitRadius) {
                            // Check if hit by Crusher 1 or Crusher 2
                            const c1Edge = (dist / 2) * progress;
                            const c2Edge = dist - (dist / 2) * progress;
                            
                            if (px < c1Edge + hitRadius || px > c2Edge - hitRadius) {
                                // Instakill crush
                                if (target === lander) {
                                    this.applyDamage(lander, 100);
                                    lander.vx = 0;
                                    lander.vy = 0;
                                    for (let i=0; i<5; i++) {
                                        this.particles.push({ x: lander.x, y: lander.y, vx: (Math.random() - 0.5)*5, vy: (Math.random() - 0.5)*5, life: 1, color: '#ef4444', size: 4 });
                                    }
                                    if (lander.integrity <= 0) this.triggerExplosion();
                                } else {
                                    target.lost = true;
                                    target.lostReason = 'crusher';
                                }
                            }
                        }
                    }
                    continue;
                }

                if (h.type === 'spike') {
                    if (!h.pts || h.pts.length < 1) continue;
                    const p = h.pts[0];
                    const radius = h.radius || 25;

                    for (const target of targets) {
                        if (target === lander && lander.crashed) continue;
                        const hitRadius = (target === lander) ? 10 : 8;
                        if (Math.hypot(target.x - p.x, target.y - p.y) > radius + hitRadius) continue;

                        if (target !== lander) {
                            target.lost = true;
                            target.lostReason = 'spike';
                            continue;
                        }

                        this.applyDamage(lander, (h.damagePerSec || 60) * dt / 60);
                        if (window.CargoAudio) CargoAudio.playCollision(2);
                        for (let i = 0; i < 2; i++) {
                            this.particles.push({
                                x: lander.x + (Math.random() - 0.5) * 14,
                                y: lander.y + (Math.random() - 0.5) * 14,
                                vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                                life: 0.5, decay: 0.06 + Math.random() * 0.05,
                                color: '#ef4444',
                                size: 2 + Math.random() * 2,
                            });
                        }
                        if (lander.integrity <= 0) this.triggerExplosion();
                    }
                    continue;
                }

                if (!h.pts || h.pts.length < 3) continue;

                for (const target of targets) {
                    if (target === lander && lander.crashed) continue;
                    if (!this.pointInPolygon(target.x, target.y, h.pts)) continue;
                    
                    if (h.type === 'repulsor') {
                        // Wind: pure knockback, never damages. Optionally
                        // duty-cycled (gustMs/calmMs set) into a temporary gust
                        // that telegraphs a moment before it blows, instead of
                        // the original always-on wind tunnel — set only on the
                        // lander target since the on/off state is a single
                        // shared clock, computed once per hazard below.
                        if (h.gustMs || h.calmMs) {
                            if (target === lander) {
                                const gustMs = h.gustMs ?? 1200;
                                const calmMs = h.calmMs ?? 1400;
                                const warnMs = h.warnMs ?? 400;
                                const period = gustMs + calmMs;
                                const t = ((this.hazardTime + (h.phaseOffset || 0)) % period + period) % period;
                                const charging = t >= calmMs - warnMs && t < calmMs;
                                const active = t >= calmMs;
                                h.zoneState = { charging, active };
                            }
                            if (!h.zoneState?.active) continue;
                        }
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

        // Parachute-on-empty-fuel: if fuel runs out mid-air, auto-deploy a
        // chute after a ~1s delay (60 frames at the project's dt=~1-per-
        // 60fps-frame convention) rather than instantly, so a brief fuel dip
        // right before touchdown doesn't trigger it. Once deployed it caps
        // fall speed low enough to usually survive impact but not
        // guaranteed — "might survive if you're lucky", not a safety net.
        // Cancels itself the instant fuel is regained (can only happen by
        // landing/refueling, which also lands the ship, so in practice this
        // only ever resets via respawnLander()/spawnLander() building a
        // fresh lander object).
        if (lander.fuel <= 0) {
            lander.chuteTimer = (lander.chuteTimer || 0) + dt;
            if (lander.chuteTimer > 30 && !lander.chuteDeployed) {
                lander.chuteDeployed = true;
                if (window.CargoAudio) CargoAudio.playLoad?.();
            }
        } else {
            lander.chuteTimer = 0;
            lander.chuteDeployed = false;
        }

        // Apply base gravity (scales with heavy cargo)
        lander.vy += (this.gravity * lander.massMultiplier) * dt;

        // Apply air resistance (drag)
        const drag = Math.pow(this.LANDER_DRAG, dt);
        lander.vx *= drag;
        lander.vy *= drag;

        if (lander.chuteDeployed) {
            const chuteDrag = Math.pow(0.90, dt);
            lander.vx *= chuteDrag;
            const chuteTerminalVy = 2.2; // ~12 damage on touchdown at this speed — risky, not fatal
            if (lander.vy > chuteTerminalVy) {
                lander.vy = chuteTerminalVy + (lander.vy - chuteTerminalVy) * Math.pow(0.82, dt);
            }
        }

        // Dynamic wind (force proportional to lander area, simplified)
        if (this.wind !== 0) {
            const now = Date.now();
            let windMult = 1.0;
            this.windWarning = false;
            if (this.windGust) {
                const g = this.windGust;
                const calm = g.calm ?? 6;
                const warn = g.warn ?? 2;
                const gust = g.gust ?? 6;
                const cycle = calm + warn + gust;
                const t = ((now - this.windGustStart) / 1000) % cycle;
                if (t < calm) {
                    windMult = 0.35; // light lull between gusts
                } else if (t < calm + warn) {
                    windMult = 0.35;
                    this.windWarning = true; // meter flashes; gust incoming
                } else {
                    // Ramp in/out of the gust smoothly rather than snapping.
                    const gt = t - calm - warn;
                    const ramp = Math.min(1, Math.min(gt, gust - gt) / 1.0 + 0.15);
                    windMult = 0.35 + (g.gustMult ?? 3) * ramp;
                }
            }
            // Layered sine texture — every level breathes a bit even with no gust cycle
            // configured, unless windVarianceEnabled is explicitly false (three
            // unrelated frequencies so it doesn't read as a single obvious
            // oscillation). Phase is seeded per level load (windGustStart) so two
            // levels with the same wind value don't drift in lockstep. The three
            // terms' base amplitudes (0.15/0.08/0.05, summing to a ±0.28 default
            // swing) are scaled together by windVarianceAmount; windVarianceSpeed
            // scales how fast the wander cycles.
            let variance = 1.0;
            if (this.windVarianceEnabled) {
                const seed = this.windGustStart % 6283; // ~2*pi*1000, arbitrary decorrelation
                const spd = this.windVarianceSpeed ?? 1.0;
                const ampScale = (this.windVarianceAmount ?? 0.25) / 0.28;
                variance += Math.sin(now * 0.0013 * spd + seed * 0.001) * 0.15 * ampScale
                          + Math.sin(now * 0.0031 * spd + seed * 0.002) * 0.08 * ampScale
                          + Math.sin(now * 0.0007 * spd + seed * 0.003) * 0.05 * ampScale;
            }
            const dynamicWind = this.wind * windMult * variance;
            lander.vx += dynamicWind * 0.02 * dt;
            this.currentWind = dynamicWind;
        } else {
            this.currentWind = 0;
            this.windWarning = false;
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

        // World Boundaries — per-edge thresholds + actions from worldBounds
        const wb = this.currentLevelConfig?.worldBounds || {};
        const ceilingY = wb.ceilingY !== undefined && wb.ceilingY !== null ? wb.ceilingY : -3000;
        const leftMargin = wb.leftMargin !== undefined && wb.leftMargin !== null ? wb.leftMargin : 3000;
        const rightMargin = wb.rightMargin !== undefined && wb.rightMargin !== null ? wb.rightMargin : 3000;
        const bottomY = wb.bottomY !== undefined && wb.bottomY !== null ? wb.bottomY : null;
        const ceilingAction = wb.ceilingAction || 'pushback';
        const lateralAction = wb.lateralAction || 'pushback';
        const bottomAction = wb.bottomAction || 'monster';

        // Track how far out we are for the vignette warning (1000px ~ 1 screen).
        // When a worldBounds edge with a hard action (anything but pushback) is
        // configured tighter than the old fixed margins, the warning starts at
        // that edge instead — the vignette and the actual consequence agree on
        // where "out" begins. Pushback edges are soft nudges, so lingering at
        // them must NOT build the timer (it would summon the worm after ~4s).
        const VIGNETTE_MARGIN = 1000;
        const warnLeftMargin = lateralAction !== 'pushback' ? Math.min(VIGNETTE_MARGIN, leftMargin) : VIGNETTE_MARGIN;
        const warnRightMargin = lateralAction !== 'pushback' ? Math.min(VIGNETTE_MARGIN, rightMargin) : VIGNETTE_MARGIN;
        const warnCeilingY = ceilingAction !== 'pushback' ? Math.max(-500, ceilingY) : -500;
        const surfaceY = this.getPolygonSurfaceY ? this.getPolygonSurfaceY(lander.x) : 99999;

        if (lander.x < -warnLeftMargin || lander.x > this.levelWidth + warnRightMargin || lander.y < warnCeilingY || lander.y > surfaceY + 80) {
            this.outOfBoundsTimer = (this.outOfBoundsTimer || 0) + dt;
        } else {
            this.outOfBoundsTimer = Math.max(0, (this.outOfBoundsTimer || 0) - dt * 2);
        }

        const applyAction = (action, edge) => {
            if (lander.crashed) return;
            if (action === 'pushback') {
                if (edge === 'ceiling') {
                    const excess = ceilingY - lander.y;
                    lander.vy += (excess * 0.0001) * dt;
                } else if (edge === 'bottom') {
                    const excess = lander.y - bottomY;
                    lander.vy -= (excess * 0.0001) * dt;
                } else if (edge === 'lateral') {
                    if (lander.x < -leftMargin) {
                        const excess = (-leftMargin) - lander.x;
                        lander.vx += (excess * 0.0001) * dt;
                    } else if (lander.x > this.levelWidth + rightMargin) {
                        const excess = lander.x - (this.levelWidth + rightMargin);
                        lander.vx -= (excess * 0.0001) * dt;
                    }
                }
            } else if (action === 'destroy') {
                this.triggerExplosion();
            } else if (action === 'police') {
                this.triggerExplosion();
                lander.policeDestroyed = true;
            } else if (action === 'monster') {
                this.outOfBoundsTimer = 999;
            } else if (action === 'lose_cargo') {
                if (lander.cargo && lander.cargo.length > 0) {
                    lander.cargo.forEach(c => { c.lost = true; c.timer = 0; });
                    lander.cargo = [];
                    lander.cargoLostToBoundary = true;
                    if (window.CargoAudio) CargoAudio.playCollision(2);
                }
            }
        };

        if (lander.y < ceilingY) applyAction(ceilingAction, 'ceiling');
        if (lander.x < -leftMargin || lander.x > this.levelWidth + rightMargin) applyAction(lateralAction, 'lateral');
        // Bottom's 'monster' case is handled directly in updateMonster() (the
        // classic rise-from-the-depths spawn) — dispatching it here too would
        // just redundantly max the OOB timer.
        if (bottomY != null && bottomAction !== 'monster' && lander.y > bottomY) applyAction(bottomAction, 'bottom');
    },

    updateParticles() {
        // Check mid-air flythrough pickups against the shared COLLECTIBLE_TYPES
        // registry (levels/collectibleTypes.js) — adding a new pickup type only
        // requires an entry there, not a new branch here.
        if (this.collectibles && this.collectibles.length > 0 && !this.lander.crashed) {
            for (let i = this.collectibles.length - 1; i >= 0; i--) {
                const c = this.collectibles[i];
                const def = window.COLLECTIBLE_TYPES && window.COLLECTIBLE_TYPES[c.type];
                if (!def) continue;
                const r = c.pickupRadius || def.pickupRadius || c.radius || def.radius || 24;
                const dx = this.lander.x - c.x;
                const dy = this.lander.y - c.y;
                if (dx * dx + dy * dy < r * r) {
                    const amount = c[def.amountField] != null ? c[def.amountField] : def.defaultAmount;
                    if (def.resource === 'fuel') {
                        this.lander.fuel = Math.min(100, this.lander.fuel + amount);
                    } else if (def.resource === 'cash') {
                        this.cash = (this.cash || 0) + amount;
                    }
                    const msg = def.message ? def.message(amount) : `+${amount}`;
                    if (window.game) window.game.addMessage(msg, def.messageColor);
                    if (window.game) window.game.floatingTexts.push({ text: msg, x: c.x, y: c.y, life: 1.5, color: def.messageColor });
                    this.collectibles.splice(i, 1);
                }
            }
        }
        
        // Cap total particles to avoid unbounded growth
        if (this.particles.length > 300) this.particles.length = 300;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Apply air resistance/drag to make them trail behind
            if (p.type === 'smoke' || p.type === 'spark') {
                const drag = p.type === 'smoke' ? 0.90 : 0.96;
                p.vx *= drag;
                p.vy *= drag;
            }

            p.x += p.vx;
            p.y += p.vy;
            if (p.gy) p.vy += p.gy; // support gravity for some particles
            p.life -= p.decay;
            
            if (p.type === 'ring') {
                p.size *= 1.08;
            } else if (p.type === 'smoke') {
                p.size *= 1.015;
            } else {
                p.size = Math.max(0.5, p.size * 0.98);
            }

            // Terrain collision for thruster exhaust particles only.
            // _testPointVsSegments is O(segments) and thruster particles are few,
            // so the total cost is negligible (<1% of frame budget).
            if (p.thruster && this.segments.length > 0 && !p._settled) {
                const skin = Math.max(2, p.size);
                const hit = this._testPointVsSegments(p.x, p.y, skin);
                if (hit) {
                    // Push particle out of surface
                    p.x += hit.nx * hit.pen;
                    p.y += hit.ny * hit.pen;
                    // Reflect velocity off normal with damping (more damping for smoke)
                    const dot = p.vx * hit.nx + p.vy * hit.ny;
                    const restitution = p.type === 'smoke' ? 0.05 : 0.25;
                    p.vx = (p.vx - 2 * dot * hit.nx) * restitution;
                    p.vy = (p.vy - 2 * dot * hit.ny) * restitution;
                    // Apply surface friction to tangential velocity
                    p.vx *= 0.4;
                    p.vy *= 0.4;
                    // Rapidly fade out after impact for a short splatter/scorch effect
                    p.decay = Math.max(p.decay, p.type === 'smoke' ? 0.08 : 0.12);
                    p._settled = true; // only resolve once to avoid tunnelling loops
                }
            }

            if (p.life <= 0) {
                // O(1) swap-and-pop instead of O(n) splice
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
            }
        }


        if (this.explosions) {
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const ex = this.explosions[i];
                ex.timer -= 0.016;
                ex.radius += (ex.maxRadius - ex.radius) * 0.1;
                if (ex.timer <= 0) {
                    this.explosions[i] = this.explosions[this.explosions.length - 1];
                    this.explosions.pop();
                }
            }
        }
    }
};

Object.assign(CargoPhysics.prototype, CargoPhysicsAtmosphereMixin);
