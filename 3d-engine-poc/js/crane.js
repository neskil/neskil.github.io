(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    /**
     * Rail-Mounted Static Port Gantry Crane (RMG).
     * Spans across the freight railroad tracks (X = -32) to the transfer container sorting yard (X = -12).
     */
    function PortCrane(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        
        // Gantry Rail Position (along Z axis parallel to tracks)
        this.zPos = -5; // Aligned with first train flatcar initially
        this.zSpeed = 0;
        this.maxSpeed = 0.15;
        this.friction = 0.92;
        
        // Overhead Trolley Position (along X axis on the bridge span)
        this.trolleyX = -32; // Directly over rail track initially
        this.minX = -34;
        this.maxX = -13;
        
        // Winch Hoist Height (along Y axis)
        this.hoistY = 12.0;
        this.minY = 1.5;
        this.maxY = 14.0;
        
        // Carried Load State
        this.carriedContainer = null;

        // Active Control State (when player selects Crane Drive Mode)
        this.isActive = false;
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            hoistUp: false,
            hoistDown: false
        };

        this.buildGantryStructure();
        this.buildTrolleyAndHoist();
        this.buildAlignmentLaser();
        this.scene.add(this.group);
        this.initKeyListeners();
    }

    PortCrane.prototype.buildGantryStructure = function() {
        // Structural steel coloring (Deep Industrial Blue & Safety Yellow accents)
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.5 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

        // Left & Right Support Leg Frames (X = -35 and X = -12)
        const legGeo = new THREE.BoxGeometry(1.2, 16, 2.4);
        
        const leftLeg = new THREE.Mesh(legGeo, steelMat);
        leftLeg.position.set(-35, 8, 0);
        leftLeg.castShadow = true;
        this.group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, steelMat);
        rightLeg.position.set(-12, 8, 0);
        rightLeg.castShadow = true;
        this.group.add(rightLeg);

        // Heavy Bottom Wheel Bogies on Rails
        const bogieGeo = new THREE.BoxGeometry(2.0, 1.0, 4.0);
        [[-35, 0.5, 0], [-12, 0.5, 0]].forEach(([x, y, z]) => {
            const bogie = new THREE.Mesh(bogieGeo, darkMat);
            bogie.position.set(x, y, z);
            bogie.castShadow = true;
            this.group.add(bogie);
        });

        // Overhead Bridge Beams spanning across the gap
        const beamGeo = new THREE.BoxGeometry(25, 1.8, 2.6);
        const bridgeBeam = new THREE.Mesh(beamGeo, steelMat);
        bridgeBeam.position.set(-23.5, 16.5, 0);
        bridgeBeam.castShadow = true;
        this.group.add(bridgeBeam);

        // Top Crane Operator Cabin with Windows on Bridge
        const cabinGeo = new THREE.BoxGeometry(2.2, 2.0, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(-20, 15.2, 1.5);
        this.group.add(cabin);

        // Safety warning stripes across bottom of beam
        const stripeGeo = new THREE.BoxGeometry(24.5, 0.2, 2.7);
        const stripeMesh = new THREE.Mesh(stripeGeo, accentMat);
        stripeMesh.position.set(-23.5, 15.5, 0);
        this.group.add(stripeMesh);

        this.group.position.z = this.zPos;
    };

    PortCrane.prototype.buildTrolleyAndHoist = function() {
        // Trolley that glides back and forth along X on top of bridge
        this.trolleyGroup = new THREE.Group();
        this.trolleyGroup.position.set(this.trolleyX, 16.2, 0);

        const trolleyGeo = new THREE.BoxGeometry(2.4, 1.0, 3.2);
        const trolleyMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.6 });
        const trolleyMesh = new THREE.Mesh(trolleyGeo, trolleyMat);
        trolleyMesh.castShadow = true;
        this.trolleyGroup.add(trolleyMesh);

        // Hoist Cable Strings
        this.cables = [];
        const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
        const cableMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

        const cableOffsets = [
            [-1.0, 1.0], [1.0, 1.0], [-1.0, -1.0], [1.0, -1.0]
        ];
        cableOffsets.forEach(([ox, oz]) => {
            const cable = new THREE.Mesh(cableGeo, cableMat);
            this.trolleyGroup.add(cable);
            this.cables.push({ mesh: cable, ox: ox, oz: oz });
        });

        // Spreader Twist-Lock Frame at bottom of cables
        this.spreaderGroup = new THREE.Group();
        const spreaderGeo = new THREE.BoxGeometry(2.4, 0.4, 6.0); // Accommodates up to 20ft/40ft containers
        const spreaderMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
        const spreaderMesh = new THREE.Mesh(spreaderGeo, spreaderMat);
        spreaderMesh.castShadow = true;
        this.spreaderGroup.add(spreaderMesh);

        // Corner twistlocks indicators (Safety Yellow)
        const lockGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        const lockMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5 });
        [[-1.1, -0.1, -2.8], [1.1, -0.1, -2.8], [-1.1, -0.1, 2.8], [1.1, -0.1, 2.8]].forEach(([x,y,z]) => {
            const lock = new THREE.Mesh(lockGeo, lockMat);
            lock.position.set(x,y,z);
            this.spreaderGroup.add(lock);
        });

        this.trolleyGroup.add(this.spreaderGroup);
        this.group.add(this.trolleyGroup);

        this.updateHoistVisuals();
    };

    PortCrane.prototype.buildAlignmentLaser = function() {
        // Vertical targeting laser beam from spreader down to ground
        const laserGeo = new THREE.CylinderGeometry(0.06, 0.15, 15, 12);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.35
        });
        this.laserBeam = new THREE.Mesh(laserGeo, laserMat);
        this.spreaderGroup.add(this.laserBeam);
    };

    PortCrane.prototype.updateHoistVisuals = function() {
        const dropDepth = 16.2 - this.hoistY;
        this.spreaderGroup.position.set(0, -dropDepth, 0);

        // Adjust vertical length of steel winch suspension cables
        this.cables.forEach(c => {
            c.mesh.scale.y = dropDepth;
            c.mesh.position.set(c.ox, -dropDepth / 2, c.oz);
        });

        // Keep alignment laser pointing down to ground level exactly
        if (this.laserBeam) {
            const groundDist = this.hoistY;
            this.laserBeam.scale.y = groundDist / 15.0;
            this.laserBeam.position.set(0, -groundDist / 2, 0);
        }
    };

    PortCrane.prototype.initKeyListeners = function() {
        const self = this;
        window.addEventListener('keydown', function(e) {
            if (!self.isActive) return;
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') self.keys.forward = true;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') self.keys.backward = true;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') self.keys.left = true;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') self.keys.right = true;
            if (e.key === 'q' || e.key === 'Q' || e.key === 'Control') self.keys.hoistDown = true;
            if (e.key === 'e' || e.key === 'E' || e.key === 'Shift') self.keys.hoistUp = true;
        });

        window.addEventListener('keyup', function(e) {
            if (!self.isActive) return;
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') self.keys.forward = false;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') self.keys.backward = false;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') self.keys.left = false;
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') self.keys.right = false;
            if (e.key === 'q' || e.key === 'Q' || e.key === 'Control') self.keys.hoistDown = false;
            if (e.key === 'e' || e.key === 'E' || e.key === 'Shift') self.keys.hoistUp = false;
        });
    };

    PortCrane.prototype.update = function(placedObjects) {
        if (!this.isActive) return;

        // 1. Move whole Gantry frame along rail track (Z Axis)
        if (this.keys.forward) {
            this.zSpeed = Math.max(-this.maxSpeed, this.zSpeed - 0.015);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playEngineSound();
        } else if (this.keys.backward) {
            this.zSpeed = Math.min(this.maxSpeed, this.zSpeed + 0.015);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playEngineSound();
        } else {
            this.zSpeed *= this.friction;
        }
        this.zPos += this.zSpeed;
        this.zPos = Math.max(-35, Math.min(35, this.zPos));
        this.group.position.z = this.zPos;

        // 2. Slide Trolley horizontally along bridge span (X Axis)
        if (this.keys.left) {
            this.trolleyX = Math.max(this.minX, this.trolleyX - 0.12);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playHydraulicSound();
        }
        if (this.keys.right) {
            this.trolleyX = Math.min(this.maxX, this.trolleyX + 0.12);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playHydraulicSound();
        }
        this.trolleyGroup.position.x = this.trolleyX;

        // 3. Lower / Raise Hoist Spreader (Y Axis)
        if (this.keys.hoistDown) {
            this.hoistY = Math.max(this.minY, this.hoistY - 0.12);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playHydraulicSound();
        }
        if (this.keys.hoistUp) {
            this.hoistY = Math.min(this.maxY, this.hoistY + 0.12);
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playHydraulicSound();
        }
        this.updateHoistVisuals();

        // 4. Update carried cargo position directly under spreader twistlock
        if (this.carriedContainer) {
            const spreaderWorldPos = new THREE.Vector3();
            this.spreaderGroup.getWorldPosition(spreaderWorldPos);
            
            const spec = this.carriedContainer.userData.spec;
            const yOffset = spec ? spec.height / 2 : 1.3;
            this.carriedContainer.position.set(spreaderWorldPos.x, spreaderWorldPos.y - yOffset - 0.2, spreaderWorldPos.z);
            this.carriedContainer.rotation.set(0, 0, 0); // Keep perfectly squared underneath gantry
        }
    };

    PortCrane.prototype.togglePickupContainer = function(placedObjects, trainContainers) {
        if (!this.isActive) return 'none';

        const spreaderWorldPos = new THREE.Vector3();
        this.spreaderGroup.getWorldPosition(spreaderWorldPos);

        if (this.carriedContainer) {
            // Drop container down at current coordinates
            const spec = this.carriedContainer.userData.spec;
            const halfH = spec ? spec.height / 2 : 1.3;

            // Check if stacking on top of another existing yard container
            let targetY = halfH;
            placedObjects.forEach(obj => {
                if (obj === this.carriedContainer) return;
                const dx = Math.abs(obj.position.x - spreaderWorldPos.x);
                const dz = Math.abs(obj.position.z - spreaderWorldPos.z);
                if (dx < 1.8 && dz < 4.0) {
                    const objSpec = obj.userData.spec;
                    const objTop = obj.position.y + (objSpec ? objSpec.height / 2 : 1.3);
                    if (objTop + halfH > targetY) {
                        targetY = objTop + halfH;
                    }
                }
            });

            this.carriedContainer.position.set(
                Math.round(spreaderWorldPos.x / 2.5) * 2.5,
                targetY,
                Math.round(spreaderWorldPos.z / 2.5) * 2.5
            );

            // Add back to general yard placedObjects array if not there
            if (placedObjects.indexOf(this.carriedContainer) === -1) {
                placedObjects.push(this.carriedContainer);
            }

            this.carriedContainer = null;
            if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
            return 'dropped';
        } else {
            // Attempt to engage twistlock onto nearest container (in yard OR on train flatcars!)
            let closest = null;
            let minDist = 4.0;

            const allCandidates = placedObjects.concat(trainContainers || []);
            allCandidates.forEach(obj => {
                const dist = obj.position.distanceTo(spreaderWorldPos);
                if (dist < minDist) {
                    minDist = dist;
                    closest = obj;
                }
            });

            if (closest) {
                // If it was on a train flatcar or in yard, detach from parent/array to become crane cargo
                if (trainContainers && trainContainers.indexOf(closest) > -1) {
                    const idx = trainContainers.indexOf(closest);
                    trainContainers.splice(idx, 1);
                    // Move from train flatcar group to world scene
                    const worldP = new THREE.Vector3();
                    closest.getWorldPosition(worldP);
                    if (closest.parent) closest.parent.remove(closest);
                    this.scene.add(closest);
                    closest.position.copy(worldP);
                }

                this.carriedContainer = closest;
                if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
                return 'picked';
            }
        }
        return 'none';
    };

    window.Cargo3D.PortCrane = PortCrane;
})(window);
