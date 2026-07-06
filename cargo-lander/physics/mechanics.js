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
};

Object.assign(CargoPhysics.prototype, CargoPhysicsMechanicsMixin);
