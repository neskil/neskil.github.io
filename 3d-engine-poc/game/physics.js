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

    /* ── RigidBox Body ─────────────────────────────────────────────────── */

    function RigidBox(mesh, mass) {
        this.mesh = mesh;
        this.mass = mass || 12;
        this.invMass = this.mass > 0 ? 1 / this.mass : 0;

        const spec = mesh.userData.spec || { width: 2.44, height: 2.9, length: 6.06 };
        this.width = spec.width;
        this.height = spec.height;
        this.length = spec.length;

        // Diagonal inverse inertia for a solid rectangular cuboid
        const w2 = this.width * this.width;
        const h2 = this.height * this.height;
        const l2 = this.length * this.length;
        this.invInertiaBody = new THREE.Vector3(
            12 * this.invMass / (h2 + l2),
            12 * this.invMass / (w2 + l2),
            12 * this.invMass / (w2 + h2)
        );

        this.position = mesh.position.clone();
        this.quaternion = mesh.quaternion.clone();
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();

        this.invInertiaWorld = new THREE.Matrix3();
        this.sleeping = false;
        this.idleTime = 0;

        this.samplePoints = this.generateSamplePoints();
        this.updateTransform();
    }

    RigidBox.prototype.generateSamplePoints = function () {
        const hw = this.width / 2;
        const hh = this.height / 2;
        const hl = this.length / 2;
        const pts = [];

        // 8 vertices
        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    pts.push(new THREE.Vector3(x * hw, y * hh, z * hl));
                }
            }
        }
        // 12 edge midpoints for stability when stacking long boxes over gaps
        for (let y = -1; y <= 1; y += 2) {
            for (let z = -1; z <= 1; z += 2) pts.push(new THREE.Vector3(0, y * hh, z * hl));
            for (let x = -1; x <= 1; x += 2) pts.push(new THREE.Vector3(x * hw, y * hh, 0));
        }
        for (let x = -1; x <= 1; x += 2) {
            for (let z = -1; z <= 1; z += 2) pts.push(new THREE.Vector3(x * hw, 0, z * hl));
        }
        // Centers of bottom and top faces
        pts.push(new THREE.Vector3(0, -hh, 0), new THREE.Vector3(0, hh, 0));
        return pts;
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

    /* ── PhysicsWorld ──────────────────────────────────────────────────── */

    function PhysicsWorld() {
        this.bodies = [];
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.groundY = 0;
        this.restitution = 0.15;
        this.friction = 0.65;
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
    };

    PhysicsWorld.prototype.update = function (delta) {
        if (delta <= 0) return;
        const timeStep = Math.min(delta, 0.05);
        const subSteps = 5;
        const dt = timeStep / subSteps;

        for (let s = 0; s < subSteps; s++) {
            this.step(dt);
        }
    };

    PhysicsWorld.prototype.step = function (dt) {
        const len = this.bodies.length;

        // 1. Integrate forces and velocity
        for (let i = 0; i < len; i++) {
            const b = this.bodies[i];
            if (b.sleeping) continue;

            b.velocity.addScaledVector(this.gravity, dt);

            // Damping to simulate ambient air resistance and friction dissipation
            b.velocity.multiplyScalar(1 - 1.2 * dt);
            b.angularVelocity.multiplyScalar(1 - 2.0 * dt);

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

        // 2. Collisions and impulses
        for (let i = 0; i < len; i++) {
            const bA = this.bodies[i];
            this.resolveGround(bA, dt);

            for (let j = i + 1; j < len; j++) {
                const bB = this.bodies[j];
                if (bA.sleeping && bB.sleeping) continue;
                this.resolveBoxPair(bA, bB, dt);
            }
        }

        // 3. Update sleep states
        for (let i = 0; i < len; i++) {
            const b = this.bodies[i];
            if (b.sleeping) continue;

            const speedSq = b.velocity.lengthSq() + b.angularVelocity.lengthSq();
            if (speedSq < 0.003 && b.position.y - b.height / 2 >= -0.02) {
                b.idleTime += dt;
                if (b.idleTime > 0.35) {
                    b.sleeping = true;
                    b.velocity.set(0, 0, 0);
                    b.angularVelocity.set(0, 0, 0);
                }
            } else {
                b.idleTime = 0;
            }
        }
    };

    PhysicsWorld.prototype.resolveGround = function (body, dt) {
        if (body.invMass === 0) return;
        const pts = body.samplePoints;
        const numPts = pts.length;

        for (let k = 0; k < numPts; k++) {
            worldPos.copy(pts[k]).applyQuaternion(body.quaternion).add(body.position);

            if (worldPos.y <= this.groundY) {
                const depth = this.groundY - worldPos.y;
                norm.set(0, 1, 0);
                this.applyContactImpulse(body, null, worldPos, norm, depth, dt);
                if (body.sleeping) body.wake();
            }
        }
    };

    PhysicsWorld.prototype.resolveBoxPair = function (bA, bB, dt) {
        // Broadphase bounding sphere test
        const distSq = bA.position.distanceToSquared(bB.position);
        const rA_bound = (bA.width + bA.height + bA.length) / 2;
        const rB_bound = (bB.width + bB.height + bB.length) / 2;
        if (distSq > (rA_bound + rB_bound) * (rA_bound + rB_bound)) return;

        let contactOccured = false;

        // Test sample points of A inside OBB of B
        invRotB.copy(bB.quaternion).invert();
        const ptsA = bA.samplePoints;
        for (let k = 0; k < ptsA.length; k++) {
            worldPos.copy(ptsA[k]).applyQuaternion(bA.quaternion).add(bA.position);
            localPos.copy(worldPos).sub(bB.position).applyQuaternion(invRotB);

            if (Math.abs(localPos.x) <= bB.width / 2 &&
                Math.abs(localPos.y) <= bB.height / 2 &&
                Math.abs(localPos.z) <= bB.length / 2) {
                
                // Find shortest distance to B's face to establish contact normal and depth
                const dx = bB.width / 2 - Math.abs(localPos.x);
                const dy = bB.height / 2 - Math.abs(localPos.y);
                const dz = bB.length / 2 - Math.abs(localPos.z);
                let depth;

                if (dy <= dx && dy <= dz) {
                    depth = dy;
                    norm.set(0, localPos.y > 0 ? 1 : -1, 0);
                } else if (dx <= dy && dx <= dz) {
                    depth = dx;
                    norm.set(localPos.x > 0 ? 1 : -1, 0, 0);
                } else {
                    depth = dz;
                    norm.set(0, 0, localPos.z > 0 ? 1 : -1);
                }

                // Transform normal to world space pointing from B to A
                norm.applyQuaternion(bB.quaternion);
                this.applyContactImpulse(bA, bB, worldPos, norm, depth, dt);
                contactOccured = true;
            }
        }

        // Test sample points of B inside OBB of A
        invRotA.copy(bA.quaternion).invert();
        const ptsB = bB.samplePoints;
        for (let k = 0; k < ptsB.length; k++) {
            worldPos.copy(ptsB[k]).applyQuaternion(bB.quaternion).add(bB.position);
            localPos.copy(worldPos).sub(bA.position).applyQuaternion(invRotA);

            if (Math.abs(localPos.x) <= bA.width / 2 &&
                Math.abs(localPos.y) <= bA.height / 2 &&
                Math.abs(localPos.z) <= bA.length / 2) {

                const dx = bA.width / 2 - Math.abs(localPos.x);
                const dy = bA.height / 2 - Math.abs(localPos.y);
                const dz = bA.length / 2 - Math.abs(localPos.z);
                let depth;

                if (dy <= dx && dy <= dz) {
                    depth = dy;
                    norm.set(0, localPos.y > 0 ? -1 : 1, 0);
                } else if (dx <= dy && dx <= dz) {
                    depth = dx;
                    norm.set(localPos.x > 0 ? -1 : 1, 0, 0);
                } else {
                    depth = dz;
                    norm.set(0, 0, localPos.z > 0 ? -1 : 1);
                }

                // Transform normal to world space pointing from B to A
                norm.applyQuaternion(bA.quaternion);
                this.applyContactImpulse(bA, bB, worldPos, norm, depth, dt);
                contactOccured = true;
            }
        }

        if (contactOccured) {
            if (bA.sleeping) bA.wake();
            if (bB.sleeping) bB.wake();
        }
    };

    PhysicsWorld.prototype.applyContactImpulse = function (bA, bB, contactPoint, normal, depth, dt) {
        rA.copy(contactPoint).sub(bA.position);
        vA.copy(bA.velocity).add(torqueA.copy(bA.angularVelocity).cross(rA));

        if (bB) {
            rB.copy(contactPoint).sub(bB.position);
            vB.copy(bB.velocity).add(torqueB.copy(bB.angularVelocity).cross(rB));
        } else {
            vB.set(0, 0, 0);
        }

        vRel.copy(vA).sub(vB);
        const vn = vRel.dot(normal);

        // Do not resolve separating contacts unless penetrating
        if (vn > 0 && depth <= 0) return;

        // Compute normal effective mass
        torqueA.copy(rA).cross(normal);
        applyMatrix3(torqueA, bA.invInertiaWorld);
        torqueA.cross(rA);
        let effMassN = bA.invMass + torqueA.dot(normal);

        if (bB) {
            torqueB.copy(rB).cross(normal);
            applyMatrix3(torqueB, bB.invInertiaWorld);
            torqueB.cross(rB);
            effMassN += bB.invMass + torqueB.dot(normal);
        }

        if (effMassN <= 0.0001) return;

        // Baumgarte position correction to stop interpenetration without explosifying stacks
        const beta = 0.25;
        const vBias = (depth > 0.002) ? (beta / dt) * (depth - 0.002) : 0;

        let e = this.restitution;
        if (Math.abs(vn) < 0.5) e = 0; // Restitution threshold for smooth resting

        let jn = (-(1 + e) * vn + vBias) / effMassN;
        if (jn < 0) jn = 0;

        // Apply normal impulse
        impulse.copy(normal).multiplyScalar(jn);
        bA.velocity.addScaledVector(impulse, bA.invMass);
        torqueA.copy(rA).cross(impulse);
        applyMatrix3(torqueA, bA.invInertiaWorld);
        bA.angularVelocity.add(torqueA);

        if (bB) {
            bB.velocity.addScaledVector(impulse, -bB.invMass);
            torqueB.copy(rB).cross(impulse).multiplyScalar(-1);
            applyMatrix3(torqueB, bB.invInertiaWorld);
            bB.angularVelocity.add(torqueB);
        }

        // Friction impulse resolution
        if (bB) {
            rB.copy(contactPoint).sub(bB.position);
            vB.copy(bB.velocity).add(torqueB.copy(bB.angularVelocity).cross(rB));
        } else {
            vB.set(0, 0, 0);
        }
        rA.copy(contactPoint).sub(bA.position);
        vA.copy(bA.velocity).add(torqueA.copy(bA.angularVelocity).cross(rA));
        vRel.copy(vA).sub(vB);

        const vnPost = vRel.dot(normal);
        tang.copy(vRel).addScaledVector(normal, -vnPost);
        const vTangLen = tang.length();
        if (vTangLen < 0.0001) return;

        tang.divideScalar(vTangLen); // Unit friction tangent direction

        torqueA.copy(rA).cross(tang);
        applyMatrix3(torqueA, bA.invInertiaWorld);
        torqueA.cross(rA);
        let effMassT = bA.invMass + torqueA.dot(tang);

        if (bB) {
            torqueB.copy(rB).cross(tang);
            applyMatrix3(torqueB, bB.invInertiaWorld);
            torqueB.cross(rB);
            effMassT += bB.invMass + torqueB.dot(tang);
        }

        if (effMassT <= 0.0001) return;

        let jt = -vTangLen / effMassT;
        const maxJt = jn * this.friction;
        if (jt < -maxJt) jt = -maxJt;
        else if (jt > maxJt) jt = maxJt;

        impulse.copy(tang).multiplyScalar(jt);
        bA.velocity.addScaledVector(impulse, bA.invMass);
        torqueA.copy(rA).cross(impulse);
        applyMatrix3(torqueA, bA.invInertiaWorld);
        bA.angularVelocity.add(torqueA);

        if (bB) {
            bB.velocity.addScaledVector(impulse, -bB.invMass);
            torqueB.copy(rB).cross(impulse).multiplyScalar(-1);
            applyMatrix3(torqueB, bB.invInertiaWorld);
            bB.angularVelocity.add(torqueB);
        }
    };

    Cargo3D.RigidBox = RigidBox;
    Cargo3D.PhysicsWorld = PhysicsWorld;
})(window);
