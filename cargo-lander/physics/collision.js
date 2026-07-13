// collision.js - Extracted physics logic

const CargoPhysicsCollisionMixin = {
    getPolygonSurfaceY(targetX) {
        let maxSurfaceY = 0; // The lowest physical surface (largest Y on screen) that we find
        for (const poly of this.terrainPolygons) {
            for (let i = 0; i < poly.length; i++) {
                const p1 = poly[i];
                const p2 = poly[(i + 1) % poly.length];
                
                if (p1.invisibleEdge) continue;

                // Only consider upward-facing floor segments (p1.x < p2.x) to avoid catching ceilings and vertical walls
                if (p1.x < p2.x && p1.x <= targetX && p2.x >= targetX) {
                    const ratio = (targetX - p1.x) / (p2.x - p1.x);
                    const y = p1.y + ratio * (p2.y - p1.y);
                    if (maxSurfaceY === 0 || y > maxSurfaceY) {
                        maxSurfaceY = y;
                    }
                }
            }
        }
        return maxSurfaceY || this.levelHeight * 0.7;
    },

    pointInPolygon(px, py, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
        }
        return inside;
    },

    polygonCentroid(pts) {
        let cx = 0, cy = 0;
        for (const p of pts) { cx += p.x; cy += p.y; }
        return { x: cx / pts.length, y: cy / pts.length };
    },

    distToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        const cx = ax + t * dx, cy = ay + t * dy;
        return Math.hypot(px - cx, py - cy);
    },

    _closestPointOnSeg(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { cx: x1, cy: y1, t: 0 };
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
        return { cx: x1 + t * dx, cy: y1 + t * dy, t };
    },

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
    },

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

            const damage = Math.max(0, Math.pow(Math.max(0, speed - (lander.safeImpactSpeed || 1.2)), 1.8) * 12);
            if (damage > 0) {
                this.applyDamage(lander, damage);
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
};

Object.assign(CargoPhysics.prototype, CargoPhysicsCollisionMixin);
