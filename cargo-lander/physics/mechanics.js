// mechanics.js - Extracted physics logic

const CargoPhysicsMechanicsMixin = {
    applyWaterBounce(dt) {
        if (!this.waterBodies || this.waterBodies.length === 0) return;
        const lander = this.lander;
        if (!lander || lander.crashed) return;

        let inWater = false;
        for (const body of this.waterBodies) {
            if (!body.pts || body.pts.length < 3) continue;
            if (this.pointInPolygon(lander.x, lander.y, body.pts)) { inWater = true; break; }
        }

        if (inWater) {
            if (!lander._wasInWater && lander.vy > 1.2) {
                // Splashdown — reverse and damp vertical velocity like a trampoline
                lander.vy = -Math.min(lander.vy * 0.35, 6);
                lander.vx *= 0.85;

                for (let i = 0; i < 16; i++) {
                    const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.9;
                    const speed = 1.5 + Math.random() * 3.5;
                    this.particles.push({
                        x: lander.x + (Math.random() - 0.5) * 20,
                        y: lander.y + lander.height / 2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.0,
                        decay: 0.03 + Math.random() * 0.03,
                        color: 'rgba(186, 230, 253, 0.75)',
                        size: 2 + Math.random() * 3
                    });
                }
                if (window.CargoAudio) CargoAudio.playLoad();
            }

            // Buoyancy + drag while submerged
            lander.vy -= 0.045 * dt;
            lander.vx *= Math.pow(0.96, dt);
            lander.vy *= Math.pow(0.97, dt);
        }

        lander._wasInWater = inWater;
    },

    applyGravityWell(levelConfig, dt) {
        this.gravityWellTime = (this.gravityWellTime || 0) + dt * 0.008;
        this.gravityWells = [];

        // 1. Process backwards-compatible single gravity well
        if (levelConfig.gravityWell) {
            const well = levelConfig.gravityWell;
            const orbitR = well.orbitRadius || 180;
            const wx = well.x + Math.sin(this.gravityWellTime * 0.8) * orbitR;
            const wy = well.y + Math.cos(this.gravityWellTime * 0.8) * orbitR;
            const pulseMultiplier = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(this.gravityWellTime * Math.PI / 16.0));
            const currentStrength = well.strength * pulseMultiplier;
            this.gravityWells.push({ x: wx, y: wy, radius: well.radius, strength: currentStrength, maxStrength: well.strength, pulse: pulseMultiplier });
        }

        // 2. Process gravwell hazards
        if (levelConfig.hazards) {
            for (const h of levelConfig.hazards) {
                if (h.type === 'gravwell' && h.pts && h.pts.length >= 1) {
                    const radius = h.radius || 200;
                    const startForce = h.startForce || 1.5;
                    const endForce = h.endForce || startForce;
                    const speed = h.speed || 1.0;
                    
                    let wx = h.pts[0].x;
                    let wy = h.pts[0].y;
                    let currentStrength = startForce;

                    if (h.pts.length > 1) {
                        // Calculate total path length
                        let totalLen = 0;
                        const segments = [];
                        const isLoop = h.pts.length > 2;
                        const numSegs = isLoop ? h.pts.length : h.pts.length - 1;
                        
                        for (let i = 0; i < numSegs; i++) {
                            const p1 = h.pts[i], p2 = h.pts[(i + 1) % h.pts.length];
                            const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                            segments.push({ p1, p2, len: d });
                            totalLen += d;
                        }
                        
                        if (totalLen > 0) {
                            const duration = totalLen / (speed * 0.5); // relative speed
                            const t = (this.hazardTime || 0) / 1000.0; // seconds
                            let progressFraction = 0;
                            
                            if (isLoop) {
                                // Circular loop (modulo)
                                progressFraction = (t / (duration || 1)) % 1.0;
                            } else {
                                // Ping pong interpolation (for 2 points)
                                progressFraction = (t / (duration || 1)) % 2.0;
                                if (progressFraction > 1.0) progressFraction = 2.0 - progressFraction;
                            }

                            let targetDist = progressFraction * totalLen;
                            for (const seg of segments) {
                                if (targetDist <= seg.len) {
                                    const progress = targetDist / (seg.len || 1);
                                    wx = seg.p1.x + (seg.p2.x - seg.p1.x) * progress;
                                    wy = seg.p1.y + (seg.p2.y - seg.p1.y) * progress;
                                    break;
                                }
                                targetDist -= seg.len;
                            }
                            
                            // Interpolate strength for ping-pong, but for loops just use startForce?
                            // Or keep it simple: progressFraction smoothly goes 0->1.
                            if (isLoop) {
                                // For a loop, it might make sense to interpolate start to end and snap,
                                // or just use startForce. Let's smoothly transition 0->0.5->1
                                const loopPingPong = progressFraction < 0.5 ? progressFraction * 2.0 : (1.0 - progressFraction) * 2.0;
                                currentStrength = startForce + (endForce - startForce) * loopPingPong;
                            } else {
                                currentStrength = startForce + (endForce - startForce) * progressFraction;
                            }
                        }
                    }
                    this.gravityWells.push({ x: wx, y: wy, radius: radius, strength: currentStrength, maxStrength: Math.max(startForce, endForce), pulse: 1.0 });
                }
            }
        }

        // Expose first well for simple compatibility, renderer now checks this.gravityWells
        this.gravityWellPos = this.gravityWells.length > 0 ? this.gravityWells[0] : null;

        for (const gw of this.gravityWells) {
            const dx = gw.x - this.lander.x;
            const dy = gw.y - this.lander.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            // Influence radius is larger than visual radius so it gently pulls earlier
            const pullRadius = gw.radius * 1.5;
            
            if (dist < pullRadius) {
                let pullDist = dist;
                if (pullDist < 15) pullDist = 15;
                
                // Quadratic falloff: gentle at the edge, strong near the center
                const falloff = Math.max(0, 1 - (pullDist / pullRadius));
                const force = gw.strength * 3.5 * Math.pow(falloff, 2);
                
                this.lander.vx += (dx / (dist || 1)) * force * dt;
                this.lander.vy += (dy / (dist || 1)) * force * dt;
                
                // Smaller kill radius (was 0.15)
                if (dist < gw.radius * 0.08) {
                    // Small damage near center
                    this.lander.integrity -= 5 * dt;
                    if (this.lander.integrity <= 0 && !this.lander.crashed) {
                        this.triggerExplosion(true);
                    }
                }
            }
        }

        if (this.lander.swallowed) {
            this.lander.swallowScale = Math.max(0, this.lander.swallowScale - dt * 0.02);
            this.lander.angle += dt * 0.1;
            // Kill velocity so it doesn't bounce around or trigger screen shake
            this.lander.vx *= 0.8;
            this.lander.vy *= 0.8;
            
            // Pull it exactly to the center of the anomaly
            if (this.gravityWellPos) {
                this.lander.x += (this.gravityWellPos.x - this.lander.x) * 0.1 * dt;
                this.lander.y += (this.gravityWellPos.y - this.lander.y) * 0.1 * dt;
            }
        }
    }
};

Object.assign(CargoPhysics.prototype, CargoPhysicsMechanicsMixin);
