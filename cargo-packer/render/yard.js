/**
 * cargo-packer/render/yard.js
 * The loading yard around the container: concrete apron with painted bay
 * markings, a forklift bringing in a pallet, empty pallets, cones, bollards,
 * a floodlight and stacks of other containers in the background.
 *
 * Everything here is scenery. It is placed outside the sightlines the camera
 * presets look through (the glass side wall, the open doors) and rebuilt only
 * when the container footprint changes.
 */
(function(exports) {
  'use strict';

  class YardRenderer {
    constructor(sceneManager) {
      this.sceneManager = sceneManager;
      this.group = new THREE.Group();
      sceneManager.scene.add(this.group);
      this.specId = null;

      const std = (color, roughness = 0.7, metalness = 0.1, extra = {}) =>
        new THREE.MeshStandardMaterial(Object.assign({ color, roughness, metalness }, extra));

      // Shared across rebuilds; the textures behind them are cached too
      this.mat = {
        yellow: std('#eab308', 0.45, 0.25),
        darkSteel: std('#1f2937', 0.5, 0.6),
        steel: std('#94a3b8', 0.35, 0.85),
        rubber: std('#111827', 0.9, 0),
        seat: std('#0f172a', 0.8, 0.1),
        wood: std('#a16207', 0.9, 0.02),
        woodDark: std('#854d0e', 0.9, 0.02),
        cone: std('#f97316', 0.55, 0.05),
        white: std('#f1f5f9', 0.5, 0.05),
        black: std('#0b0f17', 0.8, 0.1),
        pole: std('#334155', 0.5, 0.6),
        lamp: std('#fef3c7', 0.4, 0, { emissive: '#fde68a', emissiveIntensity: 1.6 }),
        beacon: std('#f97316', 0.3, 0, { emissive: '#f97316', emissiveIntensity: 1.2 })
      };
    }

    clear() {
      while (this.group.children.length > 0) {
        const root = this.group.children[0];
        root.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          // Shared materials stay; per-build ones (ground, markings, boxes) go
          if (obj.material && obj.userData.ownMaterial) {
            [].concat(obj.material).forEach(m => m.dispose());
          }
        });
        this.group.remove(root);
      }
    }

    /**
     * @param {{id: string, width: number, height: number, length: number}} spec
     */
    build(spec) {
      this.clear();
      this.specId = spec.id;
      const W = spec.width;
      const L = spec.length;
      const isPallet = spec.id === 'pallet';

      this.addGround();
      this.addMarkings(W, L, isPallet);

      // Forklift crossing behind the bulkhead with the next pallet: seen over
      // the back wall in the default view, behind the container from the
      // doors, so it never stands between a camera preset and the cargo.
      const fork = this.makeForklift();
      // Far enough back that the camera sees over the wall down to its wheels
      fork.position.set(W * 0.5 + 1.2, 0, -4.6);
      fork.rotation.y = -Math.PI / 2 + 0.22; // forks towards +X
      this.group.add(fork);

      // Empty pallets waiting by the back corner
      const stack = this.makePalletStack(6);
      // The pallet view sits close, so there the stack goes behind, not beside
      if (isPallet) stack.position.set(W + 2.3, 0, L * 0.5);
      else stack.position.set(-1.7, 0, Math.min(1.2, L * 0.3));
      stack.rotation.y = 0.12;
      this.group.add(stack);

      // Cones and bollards at the door apron
      [[-0.8, L + 0.9], [-1.15, L + 1.75], [-1.0, L + 2.6]].forEach(([x, z]) => {
        const cone = this.makeCone();
        cone.position.set(x, 0, z);
        this.group.add(cone);
      });
      if (!isPallet) {
        [[-0.55, L + 0.35], [W + 0.55, L + 0.35]].forEach(([x, z]) => {
          const b = this.makeBollard();
          b.position.set(x, 0, z);
          this.group.add(b);
        });
      }

      // Floodlight behind the far corner
      const light = this.makeFloodlight();
      light.position.set(W + 2.4, 0, -1.6);
      light.rotation.y = -Math.PI * 0.75;
      this.group.add(light);

      this.addContainerStacks(W, L);
    }

    addGround() {
      const Textures = window.CargoPacker;
      const tex = Textures.createConcreteTexture ? Textures.createConcreteTexture() : null;
      const size = 90;
      if (tex) tex.repeat.set(size / 4, size / 4);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({ map: tex, color: '#ffffff', roughness: 0.95, metalness: 0 })
      );
      ground.userData.ownMaterial = true;
      ground.rotation.x = -Math.PI / 2;
      // Under the shadow catcher (-0.01), which supplies the shadows
      ground.position.set(0, -0.014, 0);
      this.group.add(ground);
    }

    addMarkings(W, L, isPallet) {
      const Textures = window.CargoPacker;
      if (!Textures.createBayMarkingsTexture) return;
      const margin = isPallet ? 0.25 : 0.45;
      const apron = isPallet ? 1.0 : 2.4;
      const bay = Textures.createBayMarkingsTexture(W, L, margin, apron);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(bay.width, bay.length),
        new THREE.MeshStandardMaterial({ map: bay.texture, transparent: true, depthWrite: false, roughness: 0.8 })
      );
      plane.userData.ownMaterial = true;
      plane.rotation.x = -Math.PI / 2;
      // Canvas top (back bulkhead) maps to -Z
      plane.position.set(W / 2, -0.012, -margin + bay.length / 2);
      this.group.add(plane);
    }

    box(w, h, d, mat, x, y, z, shadow = true) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = shadow;
      m.receiveShadow = true;
      return m;
    }

    cyl(rTop, rBottom, h, mat, x, y, z, segments = 16) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      return m;
    }

    /** A EUR-pallet, 1.2 m along Z × 0.8 m, origin at the centre of its base. */
    makePallet() {
      const g = new THREE.Group();
      const M = this.mat;
      [-0.35, 0, 0.35].forEach(x => {
        g.add(this.box(0.1, 0.022, 1.2, M.woodDark, x, 0.011, 0, false));
        [-0.53, 0, 0.53].forEach(z => g.add(this.box(0.1, 0.078, 0.14, M.woodDark, x, 0.061, z, false)));
      });
      [-0.53, -0.27, 0, 0.27, 0.53].forEach(z => g.add(this.box(0.8, 0.022, 0.12, M.wood, 0, 0.111, z)));
      return g;
    }

    makePalletStack(count) {
      const g = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const p = this.makePallet();
        p.position.y = i * 0.122;
        p.rotation.y = ((i * 37) % 7 - 3) * 0.012; // a slightly untidy stack
        g.add(p);
      }
      return g;
    }

    /** Pallet with two layers of shrink-wrapped cartons. */
    makeLoadedPallet() {
      const g = this.makePallet();
      const Textures = window.CargoPacker;
      const tex = Textures.createCartonTexture ? Textures.createCartonTexture('#c29b62', 'OUTBOUND', 'standard', 'yard') : null;
      const mat = new THREE.MeshStandardMaterial({ color: '#c29b62', map: tex, roughness: 0.75 });
      const wrap = new THREE.MeshStandardMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.16, roughness: 0.2, depthWrite: false });
      for (let layer = 0; layer < 2; layer++) {
        for (let ix = 0; ix < 2; ix++) {
          for (let iz = 0; iz < 3; iz++) {
            const c = this.box(0.38, 0.3, 0.38, mat, -0.2 + ix * 0.4, 0.122 + 0.15 + layer * 0.3, -0.4 + iz * 0.4);
            c.userData.ownMaterial = true;
            g.add(c);
          }
        }
      }
      const film = this.box(0.82, 0.62, 1.22, wrap, 0, 0.122 + 0.3, 0, false);
      film.userData.ownMaterial = true;
      g.add(film);
      return g;
    }

    /**
     * Counterbalance forklift, origin on the ground under the front axle,
     * forks pointing along -Z.
     */
    makeForklift() {
      const g = new THREE.Group();
      const M = this.mat;

      // Body and counterweight
      g.add(this.box(1.08, 0.55, 1.75, M.yellow, 0, 0.5, 0.78));
      g.add(this.box(1.1, 0.75, 0.42, M.darkSteel, 0, 0.62, 1.62));
      g.add(this.box(1.12, 0.06, 1.0, M.darkSteel, 0, 0.8, 0.95)); // floor plate

      // Wheels
      const wheel = (r, w, x, z) => {
        const m = this.cyl(r, r, w, M.rubber, x, r, z, 18);
        m.rotation.z = Math.PI / 2;
        const hub = this.cyl(r * 0.45, r * 0.45, w + 0.02, M.yellow, x, r, z, 12);
        hub.rotation.z = Math.PI / 2;
        g.add(m, hub);
      };
      wheel(0.3, 0.26, -0.5, 0);
      wheel(0.3, 0.26, 0.5, 0);
      wheel(0.25, 0.22, -0.48, 1.38);
      wheel(0.25, 0.22, 0.48, 1.38);

      // Seat, steering
      g.add(this.box(0.5, 0.12, 0.46, M.seat, 0, 0.9, 1.08));
      g.add(this.box(0.5, 0.5, 0.1, M.seat, 0, 1.18, 1.32));
      const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 20), M.black);
      wheelRing.position.set(0, 1.2, 0.5);
      wheelRing.rotation.x = -Math.PI / 3;
      g.add(wheelRing);
      g.add(this.box(0.06, 0.45, 0.06, M.black, 0, 1.0, 0.42));

      // Overhead guard
      [[-0.5, 0.28], [0.5, 0.28], [-0.5, 1.45], [0.5, 1.45]].forEach(([x, z]) => {
        g.add(this.box(0.07, 1.45, 0.07, M.darkSteel, x, 1.5, z));
      });
      g.add(this.box(1.08, 0.06, 1.25, M.darkSteel, 0, 2.24, 0.86));
      for (let i = 0; i < 5; i++) g.add(this.box(1.0, 0.04, 0.05, M.yellow, 0, 2.29, 0.38 + i * 0.24));
      g.add(this.cyl(0.07, 0.07, 0.1, M.beacon, 0, 2.37, 1.3, 12));

      // Mast, carriage, forks (raised a little, carrying a load)
      const lift = 0.18;
      [-0.33, 0.33].forEach(x => g.add(this.box(0.1, 2.35, 0.13, M.darkSteel, x, 1.18, -0.24)));
      g.add(this.box(0.76, 0.08, 0.13, M.darkSteel, 0, 2.33, -0.24));
      g.add(this.box(0.9, 0.5, 0.06, M.darkSteel, 0, lift + 0.3, -0.34));
      [-0.26, 0.26].forEach(x => {
        g.add(this.box(0.12, 0.05, 1.12, M.steel, x, lift + 0.025, -0.93));
        g.add(this.box(0.12, 0.55, 0.05, M.steel, x, lift + 0.3, -0.38));
      });

      const load = this.makeLoadedPallet();
      load.position.set(0, lift + 0.05, -0.98);
      g.add(load);
      return g;
    }

    makeCone() {
      const g = new THREE.Group();
      const M = this.mat;
      g.add(this.box(0.36, 0.03, 0.36, M.black, 0, 0.015, 0));
      g.add(this.cyl(0.035, 0.15, 0.56, M.cone, 0, 0.31, 0, 16));
      g.add(this.cyl(0.085, 0.105, 0.09, M.white, 0, 0.36, 0, 16));
      return g;
    }

    makeBollard() {
      const g = new THREE.Group();
      const M = this.mat;
      g.add(this.cyl(0.1, 0.1, 0.95, M.yellow, 0, 0.475, 0, 18));
      [0.62, 0.8].forEach(y => g.add(this.cyl(0.103, 0.103, 0.07, M.black, 0, y, 0, 18)));
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.yellow);
      cap.position.y = 0.95;
      g.add(cap);
      return g;
    }

    /** Pole with a lamp head; the head faces local -Z. */
    makeFloodlight() {
      const g = new THREE.Group();
      const M = this.mat;
      g.add(this.cyl(0.07, 0.11, 7.2, M.pole, 0, 3.6, 0, 12));
      g.add(this.box(0.08, 0.08, 1.1, M.pole, 0, 7.15, -0.5));
      g.add(this.box(0.7, 0.16, 0.42, M.darkSteel, 0, 7.05, -1.05));
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34), M.lamp);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, 6.96, -1.05);
      g.add(lens);
      g.add(this.box(0.4, 0.3, 0.4, M.darkSteel, 0, 0.15, 0)); // footing
      return g;
    }

    /** A plain shipping container block for the background stacks. */
    makeContainerBlock(lengthM, color) {
      const Textures = window.CargoPacker;
      const tex = Textures.createCorrugatedTexture ? Textures.createCorrugatedTexture(color) : null;
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.65, metalness: 0.3 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.59, lengthM), mat);
      m.userData.ownMaterial = true;
      m.castShadow = true;
      m.receiveShadow = true;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(m.geometry),
        new THREE.LineBasicMaterial({ color: '#0b1120', transparent: true, opacity: 0.6 })
      );
      edges.userData.ownMaterial = true;
      m.add(edges);
      return m;
    }

    /**
     * Rows of other containers past the solid side and behind the bulkhead,
     * one to three high, in the muted colours of a real terminal.
     */
    addContainerStacks(W, L) {
      const H = 2.59;
      // Dark, weathered paint so the rows sit back behind the subject
      const colors = ['#5c2a12', '#0f3d3a', '#2b3542', '#163d24', '#4a2412', '#1b2a55', '#3a1d52'];
      let c = 0;
      const next = () => colors[(c++ * 3) % colors.length];

      // Side row: alternating 40 ft and 20 ft stacks, parallel to the container
      const sideX = W + 7.5;
      const heights = [2, 1, 3, 2];
      let z = -2.5;
      heights.forEach((tiers, i) => {
        const len = i % 2 === 0 ? 12.19 : 6.06;
        for (let t = 0; t < tiers; t++) {
          const b = this.makeContainerBlock(len, next());
          b.position.set(sideX + (t % 2) * 0.05, H / 2 + t * H, z + len / 2);
          this.group.add(b);
        }
        z += len + 0.4;
        if (z > L + 14) return;
      });

      // Second side row, further out and taller, for depth
      for (let i = 0; i < 3; i++) {
        const tiers = [3, 2, 3][i];
        for (let t = 0; t < tiers; t++) {
          const b = this.makeContainerBlock(12.19, next());
          b.position.set(sideX + 3.0, H / 2 + t * H, -2 + i * 12.6 + 6.1);
          this.group.add(b);
        }
      }

      // Back row, end-on, across the bulkhead side
      for (let i = 0; i < 5; i++) {
        const tiers = [1, 2, 2, 1, 3][i];
        for (let t = 0; t < tiers; t++) {
          const b = this.makeContainerBlock(6.06, next());
          b.rotation.y = Math.PI / 2;
          b.position.set(-8 + i * 2.6, H / 2 + t * H, -11);
          this.group.add(b);
        }
      }
    }
  }

  exports.YardRenderer = YardRenderer;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
