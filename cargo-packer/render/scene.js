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

      // 5. Lighting
      this.setupLights();

      // 6. Floor grid
      this.setupFloor();

      // Groups for dynamic objects
      this.containerGroup = new THREE.Group();
      this.cargoGroup = new THREE.Group();
      this.visualizerGroup = new THREE.Group();

      this.scene.add(this.containerGroup);
      this.scene.add(this.cargoGroup);
      this.scene.add(this.visualizerGroup);

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

      // Architectural grid helper
      const grid = new THREE.GridHelper(40, 40, '#0284c7', 'rgba(255,255,255,0.07)');
      grid.position.y = -0.005;
      this.scene.add(grid);
    }

    setCameraPreset(preset, containerSpecs) {
      const len = containerSpecs ? containerSpecs.length : 5.9;
      const wid = containerSpecs ? containerSpecs.width : 2.35;
      const hgt = containerSpecs ? containerSpecs.height : 2.39;

      const target = new THREE.Vector3(wid / 2, hgt / 2, len / 2);

      if (this.controls) {
        this.controls.target.copy(target);
      }

      if (preset === 'isometric') {
        this.camera.position.set(-wid * 2.2, hgt * 3.2, -len * 0.4);
      } else if (preset === 'cutaway') {
        // Direct side view into the cutaway transparent wall
        this.camera.position.set(-wid * 3.0, hgt * 1.0, len * 0.5);
      } else if (preset === 'top') {
        this.camera.position.set(wid / 2, hgt * 4.5, len / 2 + 0.01);
      } else if (preset === 'rear') {
        // Looking straight into the loading doors
        this.camera.position.set(wid / 2, hgt * 0.9, len * 2.2);
      }

      if (this.controls) this.controls.update();
    }

    onResize() {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    }

    animate() {
      requestAnimationFrame(this.animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  exports.SceneManager = SceneManager;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
