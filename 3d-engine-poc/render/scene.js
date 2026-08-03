/**
 * render/scene.js — renderer, camera, lights, terminal apron.
 *
 * Owns everything that is true of the scene regardless of what mode is running.
 * Modes add and remove their own objects; this stays put.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    const APRON_SIZE = 120;

    function SceneView(containerEl) {
        this.container = containerEl;
        this.clock = new THREE.Clock();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.FogExp2(0x0f172a, 0.010);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 600);
        this.camera.position.set(18, 15, 24);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        containerEl.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 120;
        this.controls.target.set(0, 3, 0);
        this.controls.update();

        this.buildLights();
        this.buildApron();

        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        const self = this;
        this.onResize = function () { self.resize(); };
        window.addEventListener('resize', this.onResize);
    }

    SceneView.prototype.buildLights = function () {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);

        this.hemisphereLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.5);
        this.scene.add(this.hemisphereLight);

        this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
        this.sunLight.position.set(24, 34, 18);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 140;
        const d = 40;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);
    };

    SceneView.prototype.buildApron = function () {
        this.groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.2 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(APRON_SIZE, APRON_SIZE), this.groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.ground = ground;

        this.grid = new THREE.GridHelper(APRON_SIZE, 40, 0x334155, 0x1f2c40);
        this.grid.position.y = 0.008;
        this.scene.add(this.grid);

        // Floodlight masts around the apron, doubling as scale reference. They
        // are grouped so bay-framed modes can hide them — at mission camera
        // distances they read as clutter across the sky.
        this.masts = new THREE.Group();

        const poleGeo = new THREE.CylinderGeometry(0.3, 0.4, 20, 12);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.35 });
        const headGeo = new THREE.BoxGeometry(2.4, 0.4, 1.2);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 });

        [[-34, -34], [34, -34], [-34, 34], [34, 34]].forEach(function (at) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(at[0], 10, at[1]);
            pole.castShadow = true;
            this.masts.add(pole);

            const head = new THREE.Mesh(headGeo, headMat);
            head.position.set(at[0], 20.2, at[1]);
            head.lookAt(0, 0, 0);
            this.masts.add(head);
        }, this);

        this.scene.add(this.masts);
    };

    SceneView.prototype.setMastsVisible = function (visible) {
        if (this.masts) this.masts.visible = visible;
    };

    /** Screen coordinates → the point on the y=0 apron under the cursor. */
    SceneView.prototype.pointerToGround = function (event, target) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        return this.raycaster.ray.intersectPlane(this.groundPlane, target || new THREE.Vector3());
    };

    /** Screen coordinates → the first hit among `objects`. */
    SceneView.prototype.pointerToObjects = function (event, objects) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        return this.raycaster.intersectObjects(objects, false);
    };

    SceneView.prototype.resize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    SceneView.prototype.render = function () {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    };

    SceneView.prototype.add = function (obj) { this.scene.add(obj); };
    SceneView.prototype.remove = function (obj) { this.scene.remove(obj); };

    Cargo3D.SceneView = SceneView;
    Cargo3D.APRON_SIZE = APRON_SIZE;
})(window);
