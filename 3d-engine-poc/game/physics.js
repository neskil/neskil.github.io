/**
 * game/physics.js — Lightweight 3D rigid-body simulation for shipping containers.
 *
 * Implements impulse-based collision response, friction, gravity, OBB contact points,
 * and resting sleep states in pure ES6+ without external dependencies.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    /* ── Math helpers & scratch vectors ─────────────────────────────────── */

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vRel = new THREE.Vector3();
    const rA = new THREE.Vector3();
    const rB = new THREE.Vector3();
    const norm = new THREE.Vector3();
    const tang = new THREE.Vector3();
    const torqueA = new THREE.Vector3();
    const torqueB = new THREE.Vector3();
    const impulse = new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    const localPos = new THREE.Vector3();
    const invRotA = new THREE.Quaternion();
    const invRotB = new THREE.Quaternion();
    const matA = new THREE.Matrix3();

    function setInvInertiaWorld(invBody, q, outMat) {
        const x = q.x, y = q.y, z = q.z, w = q.w;
        const x2 = x * x, y2 = y * y, z2 = z * z;
        const xy = x * y, xz = x * z, yz = y * z;
        const wx = w * x, wy = w * y, wz = w * z;

        // Rotation matrix R from quaternion
        const r00 = 1 - 2 * (y2 + z2), r01 = 2 * (xy - wz), r02 = 2 * (xz + wy);
        const r10 = 2 * (xy + wz), r11 = 1 - 2 * (x2 + z2), r12 = 2 * (yz - wx);
        const r20 = 2 * (xz - wy), r21 = 2 * (yz + wx), r22 = 1 - 2 * (x2 + y2);

        // Compute R * diag(invBody) * R^T
        const ix = invBody.x, iy = invBody.y, iz = invBody.z;
        const m = outMat.elements;
        m[0] = r00 * ix * r00 + r01 * iy * r01 + r02 * iz * r02;
        m[1] = r10 * ix * r00 + r11 * iy * r01 + r12 * iz * r02;
        m[2] = r20 * ix * r00 + r21 * iy * r01 + r22 * iz * r02;
        m[3] = m[1];
        m[4] = r10 * ix * r10 + r11 * iy * r11 + r12 * iz * r12;
        m[5] = r20 * ix * r10 + r21 * iy * r11 + r22 * iz * r12;
        m[6] = m[2];
        m[7] = m[5];
        m[8] = r20 * ix * r20 + r21 * iy * r21 + r22 * iz * r22;
        return outMat;
    }

    function applyMatrix3(vec, m) {
        const x = vec.x, y = vec.y, z = vec.z;
        const e = m.elements;
        vec.x = e[0] * x + e[3] * y + e[6] * z;
        vec.y = e[1] * x + e[4] * y + e[7] * z;
        vec.z = e[2] * x + e[5] * y + e[8] * z;
        return vec;
    }

    /* ── Collision shape ───────────────────────────────────────────────── */

    /** Cell pitch of the yard lattice. Constants owns it; this is the fallback. */
    function cellSize() {
        const C = Cargo3D.Constants;
        return (C && C.GRID && C.GRID.CELL_X) || 3.05;
    }

    /**
     * The body's shape in body space, as a list of axis-aligned boxes.
     *
     * Ordinary cargo is one box. A masked piece — the L-corner and T-beam
     * machinery modules — is the union of its occupied cells, so the notch is
     * genuinely empty and a container dropped into it falls past to whatever is
     * underneath. Cells are merged along X into runs first, which keeps the
     * count down and, more importantly, keeps interior faces out of the contact
     * test: a run of three cells is one box with no seams inside it.
     *
     * Local axes match the mesh in render/containers.js — length along X,
     * width along Z.
     */
    function shapeParts(spec, length, height, width) {
        if (!spec.mask || !spec.cells) {
            return [{ x: 0, y: 0, z: 0, hx: length / 2, hy: height / 2, hz: width / 2 }];
        }

        const cell = cellSize();
        const hy = height / 2;
        // The mesh draws each cell at 94% of the pitch; the collider matches it,
        // or a piece would collide a hand's width before it looks like it should.
        const inset = cell * 0.94;

        // Cells grouped by row (constant z), each row sorted along x.
        const rows = {};
        spec.mask.forEach(function (pt) {
            (rows[pt[1]] = rows[pt[1]] || []).push(pt[0]);
        });

        const parts = [];
        Object.keys(rows).forEach(function (key) {
            const row = rows[key].slice().sort(function (a, b) { return a - b; });
            const z = Number(key);

            let start = row[0];
            let prev = row[0];
            for (let i = 1; i <= row.length; i++) {
                if (i < row.length && row[i] === prev + 1) { prev = row[i]; continue; }

                const span = prev - start + 1;
                parts.push({
                    x: ((start + prev) / 2 + 0.5 - spec.cells[0] / 2) * cell,
                    y: 0,
                    z: (z + 0.5 - spec.cells[1] / 2) * cell,
                    hx: ((span - 1) * cell + inset) / 2,
                    hy: hy,
                    hz: inset / 2
                });

                if (i < row.length) { start = row[i]; prev = row[i]; }
            }
        });

        return parts;
    }

    /* ── RigidBox Body ─────────────────────────────────────────────────── */

    function RigidBox(mesh, mass) {
        this.mesh = mesh;
        this.mass = mass || 12;
        this.invMass = this.mass > 0 ? 1 / this.mass : 0;

        const spec = mesh.userData.spec || { width: 2.44, height: 2.9, length: 6.06 };
        this.width = spec.width;
        this.height = spec.height;
        this.length = spec.length;

        /*
         * Diagonal inverse inertia for a solid cuboid the size of the bounding
         * box. A masked piece is lighter in its notch than that implies, but the
         * error is a fraction of a cell on a shape whose whole point is that it
         * balances awkwardly — and the alternative is a full inertia tensor for
         * a compound body, which this solver has no use for anywhere else.
         *
         * Axes: X is length, Y is height, Z is width, matching the mesh.
         */
        const w2 = this.width * this.width;
        const h2 = this.height * this.height;
        const l2 = this.length * this.length;
        this.invInertiaBody = new THREE.Vector3(
            12 * this.invMass / (h2 + w2),
            12 * this.invMass / (l2 + w2),
            12 * this.invMass / (l2 + h2)
        );

        this.parts = shapeParts(spec, this.length, this.height, this.width);

        this.position = mesh.position.clone();
        this.quaternion = mesh.quaternion.clone();
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();

        this.invInertiaWorld = new THREE.Matrix3();
        this.sleeping = false;
        this.idleTime = 0;
        /** Contacts found for this body in the current substep. */
        this.contacts = 0;

        this.samplePoints = this.generateSamplePoints();
        this.updateTransform();
    }

    RigidBox.prototype.generateSamplePoints = function () {
        const self = this;
        const pts = [];

        this.parts.forEach(function (part) {
            const hx = part.hx, hy = part.hy, hz = part.hz;
            const px = part.x, py = part.y, pz = part.z;
            const own = [];

            // 8 vertices
            for (let x = -1; x <= 1; x += 2) {
                for (let y = -1; y <= 1; y += 2) {
                    for (let z = -1; z <= 1; z += 2) {
                        own.push(new THREE.Vector3(px + x * hx, py + y * hy, pz + z * hz));
                    }
                }
            }
            // 12 edge midpoints for stability when stacking long boxes over gaps
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) own.push(new THREE.Vector3(px, py + y * hy, pz + z * hz));
                for (let x = -1; x <= 1; x += 2) own.push(new THREE.Vector3(px + x * hx, py + y * hy, pz));
            }
            for (let x = -1; x <= 1; x += 2) {
                for (let z = -1; z <= 1; z += 2) own.push(new THREE.Vector3(px + x * hx, py, pz + z * hz));
            }
            // Centers of bottom and top faces
            own.push(new THREE.Vector3(px, py - hy, pz), new THREE.Vector3(px, py + hy, pz));

            // A point buried inside a neighbouring part is interior to the piece,
            // and an interior point can only ever report a contact against a face
            // that is not on the outside of anything.
            own.forEach(function (pt) {
                if (!self.containsPoint(pt, part)) pts.push(pt);
            });
        });

        return pts;
    };

    /** True if `pt` (body space) is inside some part other than `skip`. */
    RigidBox.prototype.containsPoint = function (pt, skip) {
        const eps = 1e-4;
        for (let i = 0; i < this.parts.length; i++) {
            const p = this.parts[i];
            if (p === skip) continue;
            if (Math.abs(pt.x - p.x) < p.hx - eps &&
                Math.abs(pt.y - p.y) < p.hy - eps &&
                Math.abs(pt.z - p.z) < p.hz - eps) return true;
        }
        return false;
    };

    RigidBox.prototype.updateTransform = function () {
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
        setInvInertiaWorld(this.invInertiaBody, this.quaternion, this.invInertiaWorld);
    };

    RigidBox.prototype.wake = function () {
        this.sleeping = false;
        this.idleTime = 0;
    };

    /** Linear plus angular energy proxy, used for the sleep threshold. */
    RigidBox.prototype.speedSq = function () {
        return this.velocity.lengthSq() + this.angularVelocity.lengthSq();
    };

    /** Height of the body's highest corner above the ground plane. */
    RigidBox.prototype.topY = function () {
        let top = -Infinity;
        // Every sample point, not just the first eight: a masked piece has a set
        // of corners per part, and the tallest one is not always in the first.
        for (let i = 0; i < this.samplePoints.length; i++) {
            worldPos.copy(this.samplePoints[i]).applyQuaternion(this.quaternion).add(this.position);
            if (worldPos.y > top) top = worldPos.y;
        }
        return top;
    };


    /* ── Contact constraint ────────────────────────────────────────────── */

    /**
     * One point constraint between two bodies (or a body and the ground, when
     * `bB` is null). Impulses accumulate across solver iterations, which is what
     * lets a tall stack converge — a single pass can only push the top box down
     * onto the one below, never propagate the support all the way to the ground.
     */
    function Contact() {
        this.bA = null;
        this.bB = null;
        this.point = new THREE.Vector3();
        this.normal = new THREE.Vector3();
        this.t1 = new THREE.Vector3();
        this.t2 = new THREE.Vector3();
        this.rA = new THREE.Vector3();
        this.rB = new THREE.Vector3();
        this.depth = 0;
        this.massN = 0;
        this.massT1 = 0;
        this.massT2 = 0;
        this.bias = 0;
        this.Pn = 0;
        this.Pt1 = 0;
        this.Pt2 = 0;
    }

    /* ── PhysicsWorld ──────────────────────────────────────────────────── */

    function PhysicsWorld() {
        this.bodies = [];
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.groundY = 0;
        this.restitution = 0.15;
        this.friction = 0.65;

        /** Velocity iterations per step. Tall stacks need the relaxation. */
        this.iterations = 10;

        /**
         * Physics runs on a fixed step regardless of frame rate. Two towers
         * built the same way have to score the same on a slow machine as on a
         * fast one, and the overlap correction below divides by the step — at a
         * variable dt, one unusually short frame launches the whole stack.
         */
        this.fixedDt = 1 / 120;
        this.maxStepsPerFrame = 12;
        this.accumulator = 0;

        /** Allowed overlap, in metres. Solving to exactly zero causes jitter. */
        this.slop = 0.005;
        /** Fraction of the remaining overlap pushed out per step. */
        this.beta = 0.2;
        /** Ceiling on that correction, m/s — overlap is nudged out, never fired. */
        this.maxCorrection = 2;
        /** Below this closing speed a contact is treated as resting, not bouncing. */
        this.restitutionThreshold = 1.0;

        this.contacts = [];
        this._pool = [];
        this._contactCount = 0;
    }

    PhysicsWorld.prototype.add = function (body) {
        if (this.bodies.indexOf(body) === -1) {
            this.bodies.push(body);
        }
    };

    PhysicsWorld.prototype.remove = function (body) {
        const idx = this.bodies.indexOf(body);
        if (idx !== -1) this.bodies.splice(idx, 1);
    };

    PhysicsWorld.prototype.clear = function () {
        this.bodies = [];
        this.contacts.length = 0;
        this._contactCount = 0;
        this.accumulator = 0;
    };

    /**
     * Advance the world by a frame's worth of real time, in fixed steps.
     * A frame longer than the step budget is simulated in slow motion rather
     * than in one huge leap — a backlog is dropped, never fast-forwarded.
     */
    PhysicsWorld.prototype.update = function (delta) {
        if (!(delta > 0)) return;

        this.accumulator += Math.min(delta, 0.25);

        let steps = 0;
        while (this.accumulator >= this.fixedDt && steps < this.maxStepsPerFrame) {
            this.step(this.fixedDt);
            this.accumulator -= this.fixedDt;
            steps++;
        }
        if (steps >= this.maxStepsPerFrame) this.accumulator = 0;
    };

    PhysicsWorld.prototype.step = function (dt) {
        this.integrateVelocities(dt);
        this.collectContacts();
        this.prepareContacts(dt);

        for (let it = 0; it < this.iterations; it++) {
            this.solveContacts();
        }

        this.integratePositions(dt);
        this.updateSleep(dt);
    };

    PhysicsWorld.prototype.integrateVelocities = function (dt) {
        for (let i = 0; i < this.bodies.length; i++) {
            const b = this.bodies[i];
            if (b.sleeping || b.invMass === 0) continue;

            b.velocity.addScaledVector(this.gravity, dt);

            // Ambient damping — stands in for air resistance and the energy a
            // real container loses to its own structure.
            b.velocity.multiplyScalar(1 - 0.4 * dt);
            b.angularVelocity.multiplyScalar(1 - 0.8 * dt);
        }
    };

    PhysicsWorld.prototype.integratePositions = function (dt) {
        for (let i = 0; i < this.bodies.length; i++) {
            const b = this.bodies[i];
            if (b.sleeping || b.invMass === 0) continue;

            b.position.addScaledVector(b.velocity, dt);

            // Quaternion integration: dq = 0.5 * omega * q * dt
            const w = b.angularVelocity;
            const q = b.quaternion;
            const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
            const wx = w.x * dt * 0.5, wy = w.y * dt * 0.5, wz = w.z * dt * 0.5;

            q.x += wx * qw + wy * qz - wz * qy;
            q.y += wy * qw + wz * qx - wx * qz;
            q.z += wz * qw + wx * qy - wy * qx;
            q.w += -wx * qx - wy * qy - wz * qz;
            q.normalize();

            b.updateTransform();
        }
    };

    /* ── Broad and narrow phase ────────────────────────────────────────── */

    PhysicsWorld.prototype.nextContact = function () {
        let c = this._pool[this._contactCount];
        if (!c) {
            c = new Contact();
            this._pool[this._contactCount] = c;
        }
        this._contactCount++;
        this.contacts.push(c);
        return c;
    };

    PhysicsWorld.prototype.addContact = function (bA, bB, point, normal, depth) {
        const c = this.nextContact();
        c.bA = bA;
        c.bB = bB;
        c.point.copy(point);
        c.normal.copy(normal);
        c.depth = depth;
        c.Pn = 0;
        c.Pt1 = 0;
        c.Pt2 = 0;
        return c;
    };

    PhysicsWorld.prototype.collectContacts = function () {
        this.contacts.length = 0;
        this._contactCount = 0;

        const len = this.bodies.length;
        for (let i = 0; i < len; i++) this.bodies[i].contacts = 0;

        for (let i = 0; i < len; i++) {
            const bA = this.bodies[i];
            this.groundContacts(bA);

            for (let j = i + 1; j < len; j++) {
                this.pairContacts(bA, this.bodies[j]);
            }
        }
    };

    PhysicsWorld.prototype.groundContacts = function (body) {
        if (body.invMass === 0) return;

        const pts = body.samplePoints;
        for (let k = 0; k < pts.length; k++) {
            worldPos.copy(pts[k]).applyQuaternion(body.quaternion).add(body.position);
            if (worldPos.y > this.groundY) continue;

            // The ground never wakes anything — a box resting on it is exactly
            // the case sleep exists for.
            if (body.sleeping) {
                if (this.groundY - worldPos.y <= this.slop * 4) continue;
                body.wake();
            }

            norm.set(0, 1, 0);
            this.addContact(body, null, worldPos, norm, this.groundY - worldPos.y);
            body.contacts++;
        }
    };

    /** Sample points of `from` tested against the oriented shape of `into`. */
    PhysicsWorld.prototype.pointsInBox = function (from, into, flip) {
        const invRot = flip ? invRotA : invRotB;
        invRot.copy(into.quaternion).invert();

        const parts = into.parts;
        const pts = from.samplePoints;
        let found = 0;

        for (let k = 0; k < pts.length; k++) {
            worldPos.copy(pts[k]).applyQuaternion(from.quaternion).add(from.position);
            localPos.copy(worldPos).sub(into.position).applyQuaternion(invRot);

            // A point is inside at most one part — they never overlap.
            for (let s = 0; s < parts.length; s++) {
                const part = parts[s];
                const ax = Math.abs(localPos.x - part.x);
                const ay = Math.abs(localPos.y - part.y);
                const az = Math.abs(localPos.z - part.z);
                if (ax > part.hx || ay > part.hy || az > part.hz) continue;

                // Shallowest face wins — that is the axis the point came in through.
                const dx = part.hx - ax, dy = part.hy - ay, dz = part.hz - az;
                let depth;

                if (dy <= dx && dy <= dz) {
                    depth = dy;
                    norm.set(0, localPos.y > part.y ? 1 : -1, 0);
                } else if (dx <= dz) {
                    depth = dx;
                    norm.set(localPos.x > part.x ? 1 : -1, 0, 0);
                } else {
                    depth = dz;
                    norm.set(0, 0, localPos.z > part.z ? 1 : -1);
                }

                norm.applyQuaternion(into.quaternion);
                // Normal must always point from B toward A.
                if (flip) norm.negate();

                this.addContact(flip ? into : from, flip ? from : into, worldPos, norm, depth);
                found++;
                break;
            }
        }
        return found;
    };

    PhysicsWorld.prototype.pairContacts = function (bA, bB) {
        if (bA.sleeping && bB.sleeping) return;

        // Broadphase: bounding spheres.
        const distSq = bA.position.distanceToSquared(bB.position);
        const rBoundA = Math.sqrt(bA.width * bA.width + bA.height * bA.height + bA.length * bA.length) / 2;
        const rBoundB = Math.sqrt(bB.width * bB.width + bB.height * bB.height + bB.length * bB.length) / 2;
        const reach = rBoundA + rBoundB;
        if (distSq > reach * reach) return;

        const before = this.contacts.length;
        this.pointsInBox(bA, bB, false);
        this.pointsInBox(bB, bA, true);
        const found = this.contacts.length - before;
        if (!found) return;

        bA.contacts += found;
        bB.contacts += found;

        // A sleeping body only wakes for a partner that is actually moving —
        // otherwise a settled stack would wake itself every frame, forever.
        if (bA.sleeping && !bB.sleeping && bB.speedSq() > 0.02) bA.wake();
        if (bB.sleeping && !bA.sleeping && bA.speedSq() > 0.02) bB.wake();
    };

    /* ── Solver ────────────────────────────────────────────────────────── */

    /** Effective mass of the contact along `dir`, treating sleepers as static. */
    function effectiveMass(bA, bB, rA, rB, dir) {
        let sum = bA.sleeping ? 0 : bA.invMass;

        if (!bA.sleeping) {
            torqueA.copy(rA).cross(dir);
            applyMatrix3(torqueA, bA.invInertiaWorld);
            torqueA.cross(rA);
            sum += torqueA.dot(dir);
        }
        if (bB && !bB.sleeping) {
            sum += bB.invMass;
            torqueB.copy(rB).cross(dir);
            applyMatrix3(torqueB, bB.invInertiaWorld);
            torqueB.cross(rB);
            sum += torqueB.dot(dir);
        }
        return sum > 1e-9 ? 1 / sum : 0;
    }

    function applyImpulse(bA, bB, rA, rB, imp) {
        if (!bA.sleeping) {
            bA.velocity.addScaledVector(imp, bA.invMass);
            torqueA.copy(rA).cross(imp);
            applyMatrix3(torqueA, bA.invInertiaWorld);
            bA.angularVelocity.add(torqueA);
        }
        if (bB && !bB.sleeping) {
            bB.velocity.addScaledVector(imp, -bB.invMass);
            torqueB.copy(rB).cross(imp).multiplyScalar(-1);
            applyMatrix3(torqueB, bB.invInertiaWorld);
            bB.angularVelocity.add(torqueB);
        }
    }

    /** Relative velocity of the contact point, A relative to B, into `out`. */
    function relativeVelocity(c, out) {
        const bA = c.bA, bB = c.bB;
        out.copy(bA.velocity).add(vA.copy(bA.angularVelocity).cross(c.rA));
        if (bB) {
            vB.copy(bB.velocity).add(torqueB.copy(bB.angularVelocity).cross(c.rB));
            out.sub(vB);
        }
        return out;
    }

    PhysicsWorld.prototype.prepareContacts = function (dt) {
        for (let i = 0; i < this.contacts.length; i++) {
            const c = this.contacts[i];

            c.rA.copy(c.point).sub(c.bA.position);
            if (c.bB) c.rB.copy(c.point).sub(c.bB.position);

            // Two stable tangents perpendicular to the normal.
            const n = c.normal;
            if (Math.abs(n.y) < 0.9) c.t1.set(0, 1, 0).cross(n).normalize();
            else c.t1.set(1, 0, 0).cross(n).normalize();
            c.t2.copy(n).cross(c.t1).normalize();

            c.massN = effectiveMass(c.bA, c.bB, c.rA, c.rB, n);
            c.massT1 = effectiveMass(c.bA, c.bB, c.rA, c.rB, c.t1);
            c.massT2 = effectiveMass(c.bA, c.bB, c.rA, c.rB, c.t2);

            // Baumgarte: push out the overlap beyond the slop, gently. Clamped,
            // because this term divides by the step and deep overlap is exactly
            // the case where an unclamped correction would fire the stack apart.
            c.bias = (c.depth > this.slop)
                ? Math.min((this.beta / dt) * (c.depth - this.slop), this.maxCorrection)
                : 0;

            // Restitution only for genuine impacts — a resting box must not bounce.
            const vn = relativeVelocity(c, vRel).dot(n);
            if (vn < -this.restitutionThreshold) {
                c.bias -= this.restitution * vn;
            }
        }
    };

    PhysicsWorld.prototype.solveContacts = function () {
        for (let i = 0; i < this.contacts.length; i++) {
            const c = this.contacts[i];
            if (c.bA.sleeping && (!c.bB || c.bB.sleeping)) continue;

            /* Normal impulse, accumulated so the clamp applies to the total. */
            relativeVelocity(c, vRel);
            const vn = vRel.dot(c.normal);
            let dPn = c.massN * (-vn + c.bias);

            const Pn0 = c.Pn;
            c.Pn = Math.max(Pn0 + dPn, 0);
            dPn = c.Pn - Pn0;

            if (dPn !== 0) {
                impulse.copy(c.normal).multiplyScalar(dPn);
                applyImpulse(c.bA, c.bB, c.rA, c.rB, impulse);
            }

            /* Coulomb friction on both tangents, clamped to the friction cone. */
            const maxPt = this.friction * c.Pn;
            if (maxPt <= 0) continue;

            relativeVelocity(c, vRel);

            let dPt1 = c.massT1 * -vRel.dot(c.t1);
            let dPt2 = c.massT2 * -vRel.dot(c.t2);

            let newPt1 = c.Pt1 + dPt1;
            let newPt2 = c.Pt2 + dPt2;

            const mag = Math.sqrt(newPt1 * newPt1 + newPt2 * newPt2);
            if (mag > maxPt) {
                const scale = maxPt / mag;
                newPt1 *= scale;
                newPt2 *= scale;
            }

            dPt1 = newPt1 - c.Pt1;
            dPt2 = newPt2 - c.Pt2;
            c.Pt1 = newPt1;
            c.Pt2 = newPt2;

            if (dPt1 !== 0 || dPt2 !== 0) {
                impulse.copy(c.t1).multiplyScalar(dPt1).addScaledVector(c.t2, dPt2);
                applyImpulse(c.bA, c.bB, c.rA, c.rB, impulse);
            }
        }
    };

    /* ── Sleep ─────────────────────────────────────────────────────────── */

    PhysicsWorld.prototype.updateSleep = function (dt) {
        for (let i = 0; i < this.bodies.length; i++) {
            const b = this.bodies[i];
            if (b.sleeping || b.invMass === 0) continue;

            // Only something that is touching the world can settle; a box at the
            // top of its arc is momentarily slow but is not at rest.
            if (b.contacts > 0 && b.speedSq() < 0.02) {
                b.idleTime += dt;
                if (b.idleTime > 0.5) {
                    b.sleeping = true;
                    b.velocity.set(0, 0, 0);
                    b.angularVelocity.set(0, 0, 0);
                }
            } else {
                b.idleTime = 0;
            }
        }
    };

    Cargo3D.RigidBox = RigidBox;
    Cargo3D.PhysicsWorld = PhysicsWorld;
    Cargo3D.Contact = Contact;
})(window);
