(function(window) {
    'use strict';

    let scene, camera, renderer, orbitControls;
    let sunLight, ambientLight, hemisphereLight, groundGrid;
    let sceneControls;

    function init() {
        const container = document.getElementById('canvas-container');

        // 1. Create 3D Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

        // 2. Camera Setup
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(16, 12, 20);

        // 3. WebGL Renderer with Shadows & Tone Mapping
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);

        // 4. Orbit Controls
        orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        orbitControls.maxPolarAngle = Math.PI / 2 - 0.02;
        orbitControls.target.set(0, 2, 0);
        orbitControls.update();

        // 5. Lighting Setup
        ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        hemisphereLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.5);
        scene.add(hemisphereLight);

        sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
        sunLight.position.set(20, 30, 15);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        const shadowD = 25;
        sunLight.shadow.camera.left = -shadowD;
        sunLight.shadow.camera.right = shadowD;
        sunLight.shadow.camera.top = shadowD;
        sunLight.shadow.camera.bottom = -shadowD;
        scene.add(sunLight);

        // 6. Ground Terminal Base & Grid
        createGroundTerminal();

        // 7. Initialize Controls & UI Integration
        sceneControls = new window.Cargo3D.SceneControls(
            scene,
            camera,
            renderer,
            orbitControls,
            function() {},
            function() {},
            function() {}
        );

        window.Cargo3D.setupUI(sceneControls, setLightingPreset);

        // 8. Spawn Starter Containers for immediate visual impression
        spawnInitialDemoYard();

        // 9. Window Resize Handling
        window.addEventListener('resize', onWindowResize);

        // 10. Start Animation Loop
        animate();
    }

    function createGroundTerminal() {
        const groundGeo = new THREE.PlaneGeometry(80, 80);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.8,
            metalness: 0.2
        });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        groundGrid = new THREE.GridHelper(80, 32, 0x38bdf8, 0x334155);
        groundGrid.position.y = 0.01;
        scene.add(groundGrid);

        const poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 18, 16);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });

        [[-25, -25], [25, -25], [-25, 25], [25, 25]].forEach(function(coords) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(coords[0], 9, coords[1]);
            pole.castShadow = true;
            scene.add(pole);
        });
    }

    function setLightingPreset(mode) {
        if (mode === 'dusk') {
            scene.background.setHex(0x1e1b4b);
            scene.fog.color.setHex(0x1e1b4b);
            sunLight.position.set(-30, 10, -20);
            sunLight.color.setHex(0xf97316);
            sunLight.intensity = 1.2;
            ambientLight.color.setHex(0xc084fc);
            ambientLight.intensity = 0.4;
        } else if (mode === 'night') {
            scene.background.setHex(0x050b14);
            scene.fog.color.setHex(0x050b14);
            sunLight.position.set(10, 25, 10);
            sunLight.color.setHex(0x38bdf8);
            sunLight.intensity = 0.8;
            ambientLight.color.setHex(0x6366f1);
            ambientLight.intensity = 0.3;
        } else {
            scene.background.setHex(0x0f172a);
            scene.fog.color.setHex(0x0f172a);
            sunLight.position.set(20, 30, 15);
            sunLight.color.setHex(0xfffbeb);
            sunLight.intensity = 1.4;
            ambientLight.color.setHex(0xffffff);
            ambientLight.intensity = 0.6;
        }
    }

    function spawnInitialDemoYard() {
        sceneControls.setSpawnConfig('40ft', 'maersk');
        sceneControls.spawnContainer(-5, 1.45, -2.5);

        sceneControls.setSpawnConfig('40ft', 'hapag');
        sceneControls.spawnContainer(-5, 4.34, -2.5);

        sceneControls.setSpawnConfig('20ft', 'evergreen');
        sceneControls.spawnContainer(2.5, 1.3, 2.5);

        sceneControls.setSpawnConfig('20ft', 'msc');
        sceneControls.spawnContainer(2.5, 1.3, -2.5);

        sceneControls.setSpawnConfig('pallet', 'wood');
        sceneControls.spawnContainer(7.5, 0.075, 0);

        sceneControls.setSpawnConfig('20ft', 'maersk');
        sceneControls.deselectObject();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        orbitControls.update();
        renderer.render(scene, camera);
    }

    document.addEventListener('DOMContentLoaded', init);
})(window);
