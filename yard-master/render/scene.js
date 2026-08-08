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

    /* The apron is the painted yard; the hinterland is the flat world it sits
       in, out to where the fog has swallowed everything anyway. Without it the
       apron's edge is a hard line with sky on the far side. */
    const HINTERLAND_SIZE = 900;

    /* Comfortably outside the skyline ring (~460 m) and inside the camera's far
       plane, so the dome never clips the port and never gets clipped itself. */
    const SKY_RADIUS = 700;

    /**
     * What to render at: the container's own box, which is pinned to the page
     * shell in tokens.css.
     *
     * Deliberately not `window.innerWidth/innerHeight`. On a phone those track
     * the visual viewport while the layout is the taller one behind the browser
     * chrome, so a canvas sized from the window ends up taller than the element
     * holding it — which is overflow, which is something for a stray swipe to
     * scroll. Measuring the container instead means the two can never disagree.
     */
    function viewportSize(containerEl) {
        const rect = containerEl.getBoundingClientRect();
        return {
            w: Math.max(1, Math.round(rect.width || window.innerWidth)),
            h: Math.max(1, Math.round(rect.height || window.innerHeight))
        };
    }

    function SceneView(containerEl) {
        this.container = containerEl;
        this.clock = new THREE.Clock();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.FogExp2(0x0f172a, 0.010);

        const size = viewportSize(containerEl);

        /* Near is 0.5, not 0.1: the controls never let the camera closer than
           8 m to its target, so the extra tenth buys nothing and costs depth
           precision — which the far plane now needs, with a sky dome and a port
           on the horizon to keep in front of. */
        this.camera = new THREE.PerspectiveCamera(45, size.w / size.h, 0.5, 1400);
        this.camera.position.set(18, 15, 24);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(size.w, size.h);
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

        this.buildSky();
        this.buildLights();
        this.buildApron();
        this.skyline = Cargo3D.Skyline ? new Cargo3D.Skyline(this) : null;

        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        const self = this;
        this.onResize = function () { self.resize(); };
        window.addEventListener('resize', this.onResize);
        window.addEventListener('orientationchange', this.onResize);

        /* Chrome on Android does not fire `resize` when the URL bar slides away
           — only the visual viewport changes — and the shell is sized in `dvh`,
           so it does change height. Without this the canvas keeps the old size
           and leaves a band of stale pixels along one edge. */
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', this.onResize);
        }
    }

    /**
     * The dome the sky is painted on.
     *
     * `scene.background` cannot do this job: in this three.js it only accepts a
     * colour or a cube map, and a screen-space image does not turn with the
     * camera. A big inverted sphere does, costs one draw call, and lets the
     * horizon sit at a fixed height that the skyline can stand against.
     *
     * It is deliberately outside the fog. At 300 m an exponential fog would
     * swallow the sky whole and hand back a flat wall of fog colour, so the
     * blend between dome and fogged middle distance is painted into the texture
     * instead — see `paintSky()`.
     */
    SceneView.prototype.buildSky = function () {
        const geo = new THREE.SphereGeometry(SKY_RADIUS, 32, 20);
        // Untextured until Weather picks a preset — a bare MeshBasicMaterial is
        // white, and one frame of a white sky is one frame too many.
        this.skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x0f172a, side: THREE.BackSide, fog: false, depthWrite: false
        });
        this.sky = new THREE.Mesh(geo, this.skyMaterial);
        this.sky.renderOrder = -2;
        this.scene.add(this.sky);
    };

    /**
     * Hang a painted sky on the dome. Weather owns which one.
     * @param {THREE.Texture} texture equirectangular, from `Textures.sky()`
     */
    SceneView.prototype.setSky = function (texture) {
        if (!this.skyMaterial) return;
        this.skyMaterial.map = texture || null;
        // The tint is the placeholder, not part of the look: leaving it on
        // would multiply straight through the painted sky.
        this.skyMaterial.color.setHex(texture ? 0xffffff : 0x0f172a);
        this.skyMaterial.needsUpdate = true;
    };

    /**
     * (Re)build the apron's slot grid.
     *
     * GridHelper bakes its colours into a vertex-colour attribute, so a
     * repaint is a rebuild — tinting `material.color` only multiplies whatever
     * was baked in, which turns every terminal's grid into a darker version of
     * the first one's.
     */
    SceneView.prototype.setApronGrid = function (major, minor) {
        if (this.grid) {
            const wasVisible = this.grid.visible;
            this.scene.remove(this.grid);
            this.grid.geometry.dispose();
            this.grid.material.dispose();
            this.grid = new THREE.GridHelper(APRON_SIZE, 40, major, minor);
            this.grid.visible = wasVisible;
        } else {
            this.grid = new THREE.GridHelper(APRON_SIZE, 40, major, minor);
        }
        this.grid.position.y = 0.008;
        this.scene.add(this.grid);
    };

    /**
     * Repaint the ground for a terminal.
     *
     * The weather owns the light and the sky; a terminal owns the paint. They
     * are set independently and in either order, which is why this only ever
     * touches colours the weather never looks at.
     *
     * @param {object} palette an entry from `Constants.TERMINALS`
     */
    SceneView.prototype.setTerminal = function (palette) {
        const p = palette || Cargo3D.Constants.terminal();
        this.terminal = p;
        if (this.groundMat) this.groundMat.color.setHex(p.apron);
        if (this.hinterlandMat) this.hinterlandMat.color.setHex(p.ground);
        this.setApronGrid(p.slab, p.ground);
    };

    SceneView.prototype.setSkylineTint = function (hex) {
        if (this.skyline) this.skyline.setTint(hex);
    };

    SceneView.prototype.setSkylineVisible = function (visible) {
        if (this.skyline) this.skyline.setVisible(visible);
    };

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
        if (Cargo3D.Textures) {
            // One tile every 8 m of tarmac. Weather still drives the wet look by
            // setting `roughness`, so the map keeps its values close to 1.
            Cargo3D.Textures.applySkin(this.groundMat, Cargo3D.Textures.asphalt(),
                APRON_SIZE / 8, APRON_SIZE / 8, 0.9);
            this.groundMat.roughness = 0.8;
        }
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(APRON_SIZE, APRON_SIZE), this.groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.ground = ground;

        /* The hinterland. Darker and coarser than the apron, no shadows, and
           fogged like everything else — so it hands the eye off to the haze
           rather than ending in a cut edge with sky underneath it. */
        this.hinterlandMat = new THREE.MeshStandardMaterial({
            color: 0x16202f, roughness: 0.92, metalness: 0.1
        });
        if (Cargo3D.Textures) {
            Cargo3D.Textures.applySkin(this.hinterlandMat, Cargo3D.Textures.asphalt(),
                HINTERLAND_SIZE / 26, HINTERLAND_SIZE / 26, 0.4);
            this.hinterlandMat.roughness = 0.92;
        }
        const hinterland = new THREE.Mesh(
            new THREE.PlaneGeometry(HINTERLAND_SIZE, HINTERLAND_SIZE), this.hinterlandMat);
        hinterland.rotation.x = -Math.PI / 2;
        hinterland.position.y = -0.08;
        this.scene.add(hinterland);
        this.hinterland = hinterland;

        this.setApronGrid(0x334155, 0x1f2c40);

        // Floodlight masts around the apron, doubling as scale reference. They
        // are grouped so bay-framed modes can hide them — at mission camera
        // distances they read as clutter across the sky.
        this.masts = new THREE.Group();

        const poleGeo = new THREE.CylinderGeometry(0.3, 0.4, 20, 12);
        // Galvanised, not chrome: with an environment map in the scene a
        // metalness of 0.7 turned these into four glowing white sticks across
        // the skyline.
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.35, roughness: 0.62 });
        const headGeo = new THREE.BoxGeometry(2.4, 0.4, 1.2);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.35, roughness: 0.55 });
        if (Cargo3D.Textures) {
            Cargo3D.Textures.applySkin(poleMat, Cargo3D.Textures.boltedPlate(), 1, 6, 0.5);
            poleMat.roughness = 0.62;
            Cargo3D.Textures.applySkin(headMat, Cargo3D.Textures.boltedPlate(), 1, 1, 0.5);
            headMat.roughness = 0.55;
        }

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
        const size = viewportSize(this.container);
        this.camera.aspect = size.w / size.h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(size.w, size.h);
    };

    SceneView.prototype.addShake = function (intensity) {
        this.shakeAmount = Math.min((this.shakeAmount || 0) + (intensity || 0.25), 0.7);
    };

    SceneView.prototype.render = function () {
        this.controls.update();

        if (this.shakeAmount > 0.005) {
            const ox = (Math.random() - 0.5) * this.shakeAmount;
            const oy = (Math.random() - 0.5) * this.shakeAmount * 0.7;
            this.camera.position.x += ox;
            this.camera.position.y += oy;
            this.renderer.render(this.scene, this.camera);
            this.camera.position.x -= ox;
            this.camera.position.y -= oy;
            this.shakeAmount *= 0.82;
        } else {
            this.shakeAmount = 0;
            this.renderer.render(this.scene, this.camera);
        }
    };

    SceneView.prototype.add = function (obj) { this.scene.add(obj); };
    SceneView.prototype.remove = function (obj) { this.scene.remove(obj); };

    Cargo3D.SceneView = SceneView;
    Cargo3D.APRON_SIZE = APRON_SIZE;
})(window);
