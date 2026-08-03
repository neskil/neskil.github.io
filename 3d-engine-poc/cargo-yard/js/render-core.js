(function (window) {
    'use strict';

    // Scene, camera, renderer, lights, the animation loop — and the shared
    // context object every other render-* module reads. Nothing here knows
    // what a container is.
    const CY = window.CY = window.CY || {};

    const R = CY._render = {
        scene: null, camera: null, renderer: null, orbit: null,
        sun: null, ambient: null, hemi: null,
        groundMat: null, clock: null,
        cameraMode: 'orbit',
        updaters: []
    };

    function init(container) {
        R.clock = new THREE.Clock();

        R.scene = new THREE.Scene();
        R.scene.background = new THREE.Color(0x0f172a);
        R.scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

        R.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        R.camera.position.set(16, 14, 22);

        R.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        R.renderer.setSize(window.innerWidth, window.innerHeight);
        R.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        R.renderer.shadowMap.enabled = true;
        R.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        R.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        R.renderer.toneMappingExposure = 1.0;
        container.appendChild(R.renderer.domElement);

        R.orbit = new THREE.OrbitControls(R.camera, R.renderer.domElement);
        R.orbit.enableDamping = true;
        R.orbit.dampingFactor = 0.05;
        R.orbit.maxPolarAngle = Math.PI / 2 - 0.02;
        R.orbit.target.set(0, 2, 0);
        R.orbit.update();

        R.ambient = new THREE.AmbientLight(0xffffff, 0.6);
        R.scene.add(R.ambient);

        R.hemi = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.5);
        R.scene.add(R.hemi);

        R.sun = new THREE.DirectionalLight(0xfffbeb, 1.4);
        R.sun.position.set(20, 30, 15);
        R.sun.castShadow = true;
        R.sun.shadow.mapSize.width = 2048;
        R.sun.shadow.mapSize.height = 2048;
        R.sun.shadow.camera.near = 0.5;
        R.sun.shadow.camera.far = 120;
        const d = 34;
        R.sun.shadow.camera.left = -d;
        R.sun.shadow.camera.right = d;
        R.sun.shadow.camera.top = d;
        R.sun.shadow.camera.bottom = -d;
        R.scene.add(R.sun);

        window.addEventListener('resize', onResize);
        return R;
    }

    function onResize() {
        if (!R.camera || !R.renderer) return;
        R.camera.aspect = window.innerWidth / window.innerHeight;
        R.camera.updateProjectionMatrix();
        R.renderer.setSize(window.innerWidth, window.innerHeight);
        R.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    // Anything that needs a tick registers here rather than main.js growing a
    // hard-coded list.
    function onFrame(fn) { R.updaters.push(fn); }

    // Camera framing follows the pad, so a 4×4 mission is not viewed from the
    // distance a 12×6 one needs.
    function frameYard(yard) {
        const size = CY.yardSizeMetres(yard);
        const reach = Math.max(size.x, size.z);
        R.frame = {
            reach: reach,
            centreY: size.y * 0.30,
            orbit: [reach * 0.70, reach * 0.78, reach * 1.02],
            iso: [reach * 1.05, reach * 1.05, reach * 1.05],
            crane: [0, reach * 1.5, 0.1]
        };
        setCameraMode(R.cameraMode);
    }

    function setCameraMode(mode, vehicle) {
        R.cameraMode = mode;
        const f = R.frame || { reach: 30, centreY: 3, orbit: [22, 18, 28], iso: [26, 26, 26], crane: [0, 45, 0.1] };
        if (mode === 'iso') {
            R.camera.position.set(f.iso[0], f.iso[1], f.iso[2]);
            R.orbit.target.set(0, 0, 0);
        } else if (mode === 'crane') {
            R.camera.position.set(f.crane[0], f.crane[1], f.crane[2]);
            R.orbit.target.set(0, 0, 0);
        } else if (mode === 'vehicle' && vehicle) {
            followVehicle(vehicle);
        } else if (mode === 'gantry' && vehicle) {
            followCrane(vehicle);
        } else {
            R.cameraMode = (mode === 'vehicle' || mode === 'gantry') ? 'orbit' : mode;
            R.camera.position.set(f.orbit[0], f.orbit[1], f.orbit[2]);
            R.orbit.target.set(0, f.centreY, 0);
        }
        R.orbit.update();
    }

    function followVehicle(vehicle) {
        const p = vehicle.group.position;
        R.camera.position.set(
            p.x - 13 * Math.cos(vehicle.angle),
            p.y + 8,
            p.z + 13 * Math.sin(vehicle.angle)
        );
        R.orbit.target.set(p.x, p.y + 2, p.z);
    }

    // Over the operator's shoulder on the bridge, looking down the hoist.
    function followCrane(crane) {
        const p = crane.spreaderPosition();
        R.camera.position.set(p.x - 14, p.y + 16, crane.zPos + 16);
        R.orbit.target.set(p.x, Math.max(2, p.y - 2), crane.zPos);
    }

    function start() {
        function loop() {
            window.requestAnimationFrame(loop);
            const delta = Math.min(0.1, R.clock.getDelta()); // a tab-switch must not teleport anything
            for (let i = 0; i < R.updaters.length; i++) R.updaters[i](delta);
            R.orbit.update();
            R.renderer.render(R.scene, R.camera);
        }
        loop();
    }

    // Three.js does not free GPU memory when a mesh leaves the graph — the old
    // POC leaked a geometry and a material set for every container it deleted.
    function disposeObject(obj) {
        obj.traverse(function (child) {
            if (!child.isMesh) return;
            // Geometry is cached and shared between instances; materials are
            // per-instance (the heatmap recolours them), so those we own.
            if (child.geometry && !child.userData.sharedGeometry) child.geometry.dispose();
            if (child.userData.sharedMaterial) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(function (m) {
                if (!m) return;
                // Only the per-instance texture clones are ours to free; the
                // cached originals are shared by every piece of that type.
                if (m.map && m.userData && m.userData.disposeMap) m.map.dispose();
                if (m.dispose) m.dispose();
            });
        });
    }

    CY.render = {
        ctx: R,
        init: init,
        onFrame: onFrame,
        frameYard: frameYard,
        setCameraMode: setCameraMode,
        followVehicle: followVehicle,
        followCrane: followCrane,
        start: start,
        disposeObject: disposeObject,
        onResize: onResize
    };

})(window);
