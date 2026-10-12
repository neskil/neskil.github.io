/**
 * cargo-packer/render/scene.js
 * Three.js scene setup: renderer, camera, lighting, floor grid, and orbit controls.
 */
(function(exports) {
  'use strict';

  class SceneManager {
    constructor(canvasContainer) {
      this.container = canvasContainer;
      this.width = canvasContainer.clientWidth || window.innerWidth;
      this.height = canvasContainer.clientHeight || window.innerHeight;

      // 1. Renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.container.appendChild(this.renderer.domElement);

      // 2. Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#0b1120'); // deep dark slate

      // Subtle fog for depth
      this.scene.fog = new THREE.FogExp2('#0b1120', 0.025);

      // 3. Camera
      this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
      this.setCameraPreset('isometric');

      // 4. Controls
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't flip below ground
      this.controls.minDistance = 2.0;
      this.controls.maxDistance = 35.0;
      this.controls.target.set(1.17, 1.2, 3.0); // Center of 20ft container
      this.flight = null;
      this.controls.addEventListener('start', () => { this.flight = null; });

      // 5. Lighting
      this.setupLights();

      // 6. Floor grid
      this.setupFloor();

      // Groups for dynamic objects
      this.containerGroup = new THREE.Group();
      this.cargoGroup = new THREE.Group();
      this.visualizerGroup = new THREE.Group();
      // Second load for side-by-side compare; only drawn in split view
      this.cargoGroupB = new THREE.Group();
      this.cargoGroupB.visible = false;

      this.scene.add(this.containerGroup);
      this.scene.add(this.cargoGroup);
      this.scene.add(this.cargoGroupB);
      this.scene.add(this.visualizerGroup);

      // Split view: null, or two {x, y, w, h} panes in CSS px from the top-left
      // of the canvas. Both panes share one camera, so orbiting one turns both.
      this.panes = null;
      this.frame = null;

      // Resize listener
      window.addEventListener('resize', () => this.onResize());

      // Render loop
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    setupLights() {
      // Soft ambient fill light
      const ambientLight = new THREE.AmbientLight('#94a3b8', 0.55);
      this.scene.add(ambientLight);

      // Hemisphere light (sky blue to ground dark slate)
      const hemiLight = new THREE.HemisphereLight('#38bdf8', '#0f172a', 0.45);
      hemiLight.position.set(0, 20, 0);
      this.scene.add(hemiLight);

      // Key directional light with soft shadows
      const dirLight = new THREE.DirectionalLight('#ffffff', 0.95);
      dirLight.position.set(12, 18, 10);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 40;
      const d = 12;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      this.scene.add(dirLight);

      // Soft blue rim light
      const rimLight = new THREE.DirectionalLight('#0284c7', 0.4);
      rimLight.position.set(-10, 8, -10);
      this.scene.add(rimLight);
    }

    setupFloor() {
      // Shadow catcher plane
      const shadowPlaneGeo = new THREE.PlaneGeometry(50, 50);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.01;
      shadowPlane.receiveShadow = true;
      this.scene.add(shadowPlane);

      // The ground itself (concrete, bay markings, props) is the yard's: render/yard.js
    }

    /**
     * Where a camera preset puts the camera, without moving it.
     * @returns {{position: THREE.Vector3, target: THREE.Vector3}}
     */
    presetPose(preset, containerSpecs) {
      const len = containerSpecs ? containerSpecs.length : 5.9;
      const wid = containerSpecs ? containerSpecs.width : 2.35;
      const hgt = containerSpecs ? containerSpecs.height : 2.39;

      const target = new THREE.Vector3(wid / 2, hgt / 2, len / 2);
      const position = new THREE.Vector3();

      if (preset === 'cutaway') {
        // Direct side view into the cutaway transparent wall
        position.set(-wid * 3.0, hgt * 1.0, len * 0.5);
      } else if (preset === 'top') {
        position.set(wid / 2, hgt * 4.5, len / 2 + 0.01);
      } else if (preset === 'rear') {
        // Looking straight into the loading doors
        position.set(wid / 2, hgt * 0.9, len * 2.2);
      } else {
        // 'isometric': from the open corner (glass side wall + loading doors),
        // looking into the far one where the back bulkhead, the solid side
        // wall and the floor meet; loading starts there, so the stack grows
        // towards you.
        const reach = Math.max(len, wid * 2.5);
        position.set(-reach * 0.68, hgt * 2.4, len / 2 + reach * 0.84);
      }

      position.sub(target).multiplyScalar(this.pullBack()).add(target);
      return { position: position, target: target };
    }

    /**
     * Presets are framed for a landscape viewport; on a narrow one the
     * horizontal field of view shrinks, so the camera backs off to match.
     */
    pullBack() {
      const aspect = this.viewAspect();
      return aspect < 1.15 ? Math.min(2.0, 1.15 / aspect) : 1;
    }

    setCameraPreset(preset, containerSpecs) {
      const pose = this.presetPose(preset, containerSpecs);
      this.flight = null;
      this.camera.position.copy(pose.position);
      if (this.controls) {
        this.controls.target.copy(pose.target);
        this.controls.update();
      }
    }

    /**
     * Glides the camera to a pose (the guided tours use this). Grabbing the
     * view mid-flight cancels it, so the user is never fought for control.
     */
    flyTo(pose, durationMs = 1200) {
      this.flight = {
        fromPos: this.camera.position.clone(),
        fromTarget: this.controls.target.clone(),
        toPos: pose.position.clone(),
        toTarget: pose.target.clone(),
        start: performance.now(),
        duration: durationMs
      };
    }

    stepFlight(now) {
      const f = this.flight;
      if (!f) return;
      const t = Math.min(1, (now - f.start) / f.duration);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in-out cubic
      this.camera.position.lerpVectors(f.fromPos, f.toPos, e);
      this.controls.target.lerpVectors(f.fromTarget, f.toTarget, e);
      if (t >= 1) this.flight = null;
    }

    /** Aspect ratio of what one view shows: a pane in split view, else the canvas. */
    viewAspect() {
      if (this.frame) return this.frame.w / this.frame.h;
      const p = this.panes && this.panes[0];
      return p ? p.w / p.h : this.width / this.height;
    }

    /**
     * Frames the camera's shot inside part of the canvas: what the camera
     * looks at lands in the centre of `rect` (CSS px from the canvas top-left)
     * instead of the centre of the screen, and the rest of the canvas shows
     * the scene around it. The guided tour uses this so the box it talks about
     * is not under its own text panel. Pass null for the whole canvas.
     * @param {{x:number,y:number,w:number,h:number}|null} rect
     */
    setFrame(rect) {
      this.frame = rect && rect.w > 0 && rect.h > 0 ? rect : null;
      this.applyProjection();
    }

    applyProjection() {
      const f = this.frame;
      if (f) {
        // The camera's full view becomes an f.w × f.h image placed at (f.x,
        // f.y); the canvas renders a window of it that spills past its edges.
        this.camera.setViewOffset(f.w, f.h, -f.x, -f.y, this.width, this.height);
      } else {
        this.camera.clearViewOffset();
      }
      this.camera.aspect = this.viewAspect();
      this.camera.updateProjectionMatrix();
    }

    /**
     * Switches between one view and two side-by-side panes.
     * @param {Array<{x:number,y:number,w:number,h:number}>|null} panes
     */
    setPanes(panes) {
      this.panes = panes && panes.length === 2 ? panes : null;
      if (this.panes) this.frame = null; // split view frames its own panes
      this.cargoGroupB.visible = false;
      this.cargoGroup.visible = true;
      this.visualizerGroup.visible = true;
      this.applyProjection();
    }

    onResize() {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || window.innerHeight;
      this.applyProjection();
      this.renderer.setSize(this.width, this.height);
    }

    animate(now) {
      requestAnimationFrame(this.animate);
      if (this.flight) this.stepFlight(now || performance.now());
      this.controls.update();

      if (!this.panes) {
        this.renderer.render(this.scene, this.camera);
        return;
      }

      // Same scene, same camera, drawn twice: once per load.
      const r = this.renderer;
      r.setScissorTest(false);
      r.clear();
      r.setScissorTest(true);
      this.visualizerGroup.visible = false;
      for (let i = 0; i < 2; i++) {
        const p = this.panes[i];
        const y = this.height - p.y - p.h; // WebGL counts from the bottom
        this.cargoGroup.visible = i === 0;
        this.cargoGroupB.visible = i === 1;
        r.setViewport(p.x, y, p.w, p.h);
        r.setScissor(p.x, y, p.w, p.h);
        r.render(this.scene, this.camera);
      }
      r.setScissorTest(false);
      r.setViewport(0, 0, this.width, this.height);
    }
  }

  exports.SceneManager = SceneManager;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
