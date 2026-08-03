(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    function SceneControls(scene, camera, renderer, orbitControls, updateHUDCallback, showInspectorCallback, hideInspectorCallback) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.orbitControls = orbitControls;
        this.updateHUDCallback = updateHUDCallback;
        this.showInspectorCallback = showInspectorCallback;
        this.hideInspectorCallback = hideInspectorCallback;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.placedObjects = [];
        this.selectedObject = null;
        this.cameraMode = 'orbit';

        // Current Spawn Configuration
        this.selectedType = '20ft';
        this.selectedCarrier = 'maersk';

        // Hover & Selection Highlight Mesh Box
        this.selectionBox = new THREE.BoxHelper(undefined, 0x38bdf8);
        this.selectionBox.visible = false;
        this.scene.add(this.selectionBox);

        // Ground Raycast Plane at Y = 0
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // Reach Stacker Vehicle Instance
        this.vehicle = new window.Cargo3D.ReachStacker(this.scene);
        
        // Static Rail-Mounted Port Gantry Crane
        this.crane = new window.Cargo3D.PortCrane(this.scene);
        this.terminal = null; // Attached during main init

        this.initEventListeners();
    }

    SceneControls.prototype.setSpawnConfig = function(type, carrier) {
        this.selectedType = type;
        this.selectedCarrier = carrier;
    };

    SceneControls.prototype.initEventListeners = function() {
        const container = this.renderer.domElement;
        const self = this;
        
        container.addEventListener('pointerdown', function(e) { self.onPointerDown(e); });

        // Spacebar to trigger reach stacker or port crane pickup / drop
        window.addEventListener('keydown', function(e) {
            if (e.code === 'Space') {
                let action = 'none';
                if (self.crane && self.crane.isActive) {
                    action = self.crane.togglePickupContainer(self.placedObjects, self.terminal ? self.terminal.trainContainers : []);
                } else if (self.vehicle) {
                    action = self.vehicle.togglePickupContainer(self.placedObjects);
                }
                if (action !== 'none') {
                    self.updateHUDCallback(self.placedObjects);
                }
            }
        });
    };

    SceneControls.prototype.update = function(delta) {
        if (this.crane) {
            this.crane.update(this.placedObjects);
            if (this.cameraMode === 'port_crane') {
                const trPos = this.crane.trolleyGroup.position;
                this.camera.position.set(trPos.x, 26, this.crane.zPos + 14);
                this.orbitControls.target.set(trPos.x, this.crane.hoistY - 2, this.crane.zPos);
            }
        }
        if (this.vehicle) {
            this.vehicle.update(this.placedObjects);

            // Follow vehicle with camera if in vehicle camera mode
            if (this.cameraMode === 'vehicle') {
                const vehPos = this.vehicle.group.position;
                this.camera.position.set(vehPos.x - 12 * Math.cos(this.vehicle.angle), vehPos.y + 7, vehPos.z + 12 * Math.sin(this.vehicle.angle));
                this.orbitControls.target.set(vehPos.x, vehPos.y + 2, vehPos.z);
            }
        }
    };

    SceneControls.prototype.onPointerDown = function(event) {
        if (event.target.tagName !== 'CANVAS') return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const selectableMeshes = [];
        this.placedObjects.forEach(group => {
            group.traverse(child => {
                if (child.isMesh && !child.userData.isInterior) {
                    child.userData.parentGroup = group;
                    selectableMeshes.push(child);
                }
            });
        });

        const intersects = this.raycaster.intersectObjects(selectableMeshes);

        if (intersects.length > 0) {
            const hitGroup = intersects[0].object.userData.parentGroup;
            this.selectObject(hitGroup);
        } else {
            const ray = this.raycaster.ray;
            const targetPos = new THREE.Vector3();
            if (ray.intersectPlane(this.groundPlane, targetPos)) {
                if (this.selectedObject) {
                    this.deselectObject();
                    return;
                }

                const spec = window.Cargo3D.Containers.CONTAINER_SPECS[this.selectedType] || window.Cargo3D.Containers.CONTAINER_SPECS['20ft'];
                const gridX = Math.round(targetPos.x / 2.5) * 2.5;
                const gridZ = Math.round(targetPos.z / 2.5) * 2.5;

                let baseHeight = spec.height / 2;
                this.placedObjects.forEach(obj => {
                    const dx = Math.abs(obj.position.x - gridX);
                    const dz = Math.abs(obj.position.z - gridZ);
                    if (dx < 1.5 && dz < 1.5) {
                        const topY = obj.position.y + (obj.userData.spec ? obj.userData.spec.height / 2 : 1.3);
                        if (topY + spec.height / 2 > baseHeight) {
                            baseHeight = topY + spec.height / 2;
                        }
                    }
                });

                this.spawnContainer(gridX, baseHeight, gridZ);
            }
        }
    };

    SceneControls.prototype.spawnContainer = function(x, y, z) {
        const containerGroup = window.Cargo3D.Containers.createContainerMesh(this.selectedType, this.selectedCarrier);
        containerGroup.position.set(x, y, z);
        this.scene.add(containerGroup);

        this.placedObjects.push(containerGroup);
        this.updateHUDCallback(this.placedObjects);

        if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
        this.selectObject(containerGroup);
    };

    SceneControls.prototype.selectObject = function(group) {
        this.selectedObject = group;
        this.selectionBox.setFromObject(group);
        this.selectionBox.visible = true;

        this.showInspectorCallback(group);
    };

    SceneControls.prototype.deselectObject = function() {
        this.selectedObject = null;
        this.selectionBox.visible = false;
        this.hideInspectorCallback();
    };

    SceneControls.prototype.rotateSelectedUnit = function() {
        if (!this.selectedObject) return;
        this.selectedObject.rotation.y += Math.PI / 2;
        this.selectionBox.setFromObject(this.selectedObject);
        this.showInspectorCallback(this.selectedObject);
        if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
    };

    SceneControls.prototype.deleteSelectedUnit = function() {
        if (!this.selectedObject) return;

        this.scene.remove(this.selectedObject);
        const index = this.placedObjects.indexOf(this.selectedObject);
        if (index > -1) {
            this.placedObjects.splice(index, 1);
        }

        this.deselectObject();
        this.updateHUDCallback(this.placedObjects);
    };

    SceneControls.prototype.clearYard = function() {
        this.placedObjects.forEach(obj => this.scene.remove(obj));
        this.placedObjects = [];
        this.deselectObject();
        this.updateHUDCallback(this.placedObjects);
    };

    SceneControls.prototype.setCameraMode = function(mode) {
        this.cameraMode = mode;
        if (this.crane) this.crane.isActive = (mode === 'port_crane');
        if (this.vehicle) this.vehicle.isActive = (mode !== 'port_crane');
        if (!this.orbitControls) return;

        if (mode === 'iso') {
            this.camera.position.set(25, 25, 25);
            this.orbitControls.target.set(0, 0, 0);
        } else if (mode === 'crane') {
            this.camera.position.set(0, 35, 0.1);
            this.orbitControls.target.set(0, 0, 0);
        } else if (mode === 'port_crane') {
            const trPos = this.crane.trolleyGroup.position;
            this.camera.position.set(trPos.x, 26, this.crane.zPos + 14);
            this.orbitControls.target.set(trPos.x, this.crane.hoistY - 2, this.crane.zPos);
        } else if (mode === 'vehicle') {
            const vehPos = this.vehicle.group.position;
            this.camera.position.set(vehPos.x - 12, vehPos.y + 7, vehPos.z + 12);
            this.orbitControls.target.set(vehPos.x, vehPos.y + 2, vehPos.z);
        } else {
            this.camera.position.set(16, 12, 20);
            this.orbitControls.target.set(0, 2, 0);
        }

        this.orbitControls.update();
    };

    window.Cargo3D.SceneControls = SceneControls;
})(window);
