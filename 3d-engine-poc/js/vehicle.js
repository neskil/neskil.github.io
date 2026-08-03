(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    function ReachStacker(scene) {
        this.scene = scene;
        this.group = new THREE.Group();

        // Driving Kinematics
        this.position = new THREE.Vector3(10, 0, 10);
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 0.25;
        this.acceleration = 0.015;
        this.friction = 0.94;
        this.steeringAngle = 0;

        // Boom & Spreader State
        this.boomAngle = 0.3; // radians
        this.boomLength = 5.0; // meters
        this.carriedContainer = null;

        // Input Keys State
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            boomUp: false,
            boomDown: false
        };
        this.isActive = true; // Enabled by default unless driving port crane

        this.buildVehicleMesh();
        this.scene.add(this.group);
        this.initKeyListeners();
    }

    ReachStacker.prototype.buildVehicleMesh = function() {
        // Main Chassis Body (Yellow/Black Heavy Machinery Paint)
        const bodyGeo = new THREE.BoxGeometry(3.5, 1.4, 2.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.5 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 1.0;
        bodyMesh.castShadow = true;
        this.group.add(bodyMesh);

        // Counterweight Rear Block
        const weightGeo = new THREE.BoxGeometry(1.2, 1.6, 2.2);
        const weightMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.7 });
        const weightMesh = new THREE.Mesh(weightGeo, weightMat);
        weightMesh.position.set(-1.8, 1.1, 0);
        weightMesh.castShadow = true;
        this.group.add(weightMesh);

        // Driver Glass Cabin
        const cabGeo = new THREE.BoxGeometry(1.2, 1.2, 1.1);
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 });
        const cabMesh = new THREE.Mesh(cabGeo, cabMat);
        cabMesh.position.set(-0.2, 2.3, 0.45);
        this.group.add(cabMesh);

        // 4 Heavy Rubber Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16);
        wheelGeo.rotateX(Math.PI / 2); // Align cylinder axle directly along local Z axis
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

        this.wheels = [];
        const wheelOffsets = [
            [1.2, 0.65, 1.2], [1.2, 0.65, -1.2],
            [-1.2, 0.65, 1.2], [-1.2, 0.65, -1.2]
        ];

        wheelOffsets.forEach(([x, y, z]) => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(x, y, z);
            wheel.castShadow = true;
            this.group.add(wheel);
            this.wheels.push(wheel);
        });

        // Telescopic Boom Arm Pivot Group
        this.boomPivot = new THREE.Group();
        this.boomPivot.position.set(-1.2, 2.2, 0);

        const mainBoomGeo = new THREE.BoxGeometry(5.2, 0.5, 0.6);
        const boomMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.6 });
        const mainBoomMesh = new THREE.Mesh(mainBoomGeo, boomMat);
        mainBoomMesh.position.set(2.6, 0, 0);
        mainBoomMesh.castShadow = true;
        this.boomPivot.add(mainBoomMesh);

        // Top Spreader Attachment Frame
        this.spreader = new THREE.Group();
        this.spreader.position.set(5.2, -0.2, 0);

        const frameGeo = new THREE.BoxGeometry(0.4, 0.3, 2.4);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.castShadow = true;
        this.spreader.add(frameMesh);

        this.boomPivot.add(this.spreader);
        this.group.add(this.boomPivot);

        this.group.position.copy(this.position);
    };

    ReachStacker.prototype.initKeyListeners = function() {
        const self = this;
        window.addEventListener('keydown', function(e) {
            if (!self.isActive) return;
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') self.keys.forward = true;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') self.keys.backward = true;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') self.keys.left = true;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') self.keys.right = true;
            if (e.key === 'q' || e.key === 'Q') self.keys.boomUp = true;
            if (e.key === 'e' || e.key === 'E') self.keys.boomDown = true;
        });

        window.addEventListener('keyup', function(e) {
            if (!self.isActive) return;
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') self.keys.forward = false;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') self.keys.backward = false;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') self.keys.left = false;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') self.keys.right = false;
            if (e.key === 'q' || e.key === 'Q') self.keys.boomUp = false;
            if (e.key === 'e' || e.key === 'E') self.keys.boomDown = false;
        });
    };

    ReachStacker.prototype.update = function(placedObjects) {
        if (!this.isActive) {
            this.speed *= this.friction;
            return;
        }
        // Accelerate / Reverse
        if (this.keys.forward) {
            this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playEngineSound();
        } else if (this.keys.backward) {
            this.speed = Math.max(-this.maxSpeed * 0.5, this.speed - this.acceleration);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playEngineSound();
        } else {
            this.speed *= this.friction;
        }

        // Steer Angle
        if (this.keys.left) {
            this.angle += 0.03 * (this.speed >= 0 ? 1 : -1);
        }
        if (this.keys.right) {
            this.angle -= 0.03 * (this.speed >= 0 ? 1 : -1);
        }

        // Boom Angle Tilt
        if (this.keys.boomUp) {
            this.boomAngle = Math.min(0.65, this.boomAngle + 0.015);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playHydraulicSound();
        }
        if (this.keys.boomDown) {
            this.boomAngle = Math.max(0.05, this.boomAngle - 0.015);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playHydraulicSound();
        }

        this.boomPivot.rotation.z = this.boomAngle;

        // Move Vehicle Position
        this.position.x += Math.cos(this.angle) * this.speed;
        this.position.z -= Math.sin(this.angle) * this.speed;

        // Boundary Clamp
        this.position.x = Math.max(-35, Math.min(35, this.position.x));
        this.position.z = Math.max(-35, Math.min(35, this.position.z));

        this.group.position.copy(this.position);
        this.group.rotation.y = this.angle;

        // Rotate wheels when driving
        const wheelRot = this.speed * 2;
        this.wheels.forEach(function(w) { w.rotation.z -= wheelRot; });

        // Update carried container position if picked up
        if (this.carriedContainer) {
            const spreaderWorldPos = new THREE.Vector3();
            this.spreader.getWorldPosition(spreaderWorldPos);
            this.carriedContainer.position.set(spreaderWorldPos.x, spreaderWorldPos.y - 1.3, spreaderWorldPos.z);
            this.carriedContainer.rotation.y = this.angle;
        }
    };

    ReachStacker.prototype.togglePickupContainer = function(placedObjects) {
        if (this.carriedContainer) {
            // Drop container onto ground
            const spreaderWorldPos = new THREE.Vector3();
            this.spreader.getWorldPosition(spreaderWorldPos);

            const spec = this.carriedContainer.userData.spec;
            const dropY = Math.max(spec ? spec.height / 2 : 1.3, spreaderWorldPos.y - 1.3);

            this.carriedContainer.position.set(
                Math.round(spreaderWorldPos.x / 2.5) * 2.5,
                dropY,
                Math.round(spreaderWorldPos.z / 2.5) * 2.5
            );

            this.carriedContainer = null;
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
            return 'dropped';
        } else {
            // Find closest container under spreader frame
            const spreaderWorldPos = new THREE.Vector3();
            this.spreader.getWorldPosition(spreaderWorldPos);

            let closest = null;
            let minDist = 3.5;

            placedObjects.forEach(function(obj) {
                const dist = obj.position.distanceTo(spreaderWorldPos);
                if (dist < minDist) {
                    minDist = dist;
                    closest = obj;
                }
            });

            if (closest) {
                this.carriedContainer = closest;
                if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
                return 'picked';
            }
        }
        return 'none';
    };

    window.Cargo3D.ReachStacker = ReachStacker;
})(window);
