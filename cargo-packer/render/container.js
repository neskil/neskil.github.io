/**
 * cargo-packer/render/container.js
 * 3D procedural representation of ISO Shipping Containers (20ft / 40ft) and EUR-Pallet.
 * Supports cutaway, wireframe, and solid inspection modes.
 */
(function(exports) {
  'use strict';

  class ContainerRenderer {
    constructor(sceneManager) {
      this.sceneManager = sceneManager;
      this.group = sceneManager.containerGroup;
      this.viewMode = 'cutaway'; // 'cutaway' | 'wireframe' | 'solid'
      this.currentSpec = null;
    }

    /**
     * Builds and adds the container model to the scene.
     * @param {Object} containerSpec {id, width, height, length}
     * @param {string} mode 'cutaway' | 'wireframe' | 'solid'
     */
    build(containerSpec, mode = 'cutaway') {
      this.currentSpec = containerSpec;
      this.viewMode = mode;
      this.clear();

      if (containerSpec.id === 'pallet') {
        this.buildPallet(containerSpec);
      } else {
        this.buildIsoContainer(containerSpec);
      }
    }

    clear() {
      while (this.group.children.length > 0) {
        const obj = this.group.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
        this.group.remove(obj);
      }
    }

    setViewMode(mode) {
      if (this.currentSpec) {
        this.build(this.currentSpec, mode);
      }
    }

    buildIsoContainer(spec) {
      const W = spec.width;
      const H = spec.height;
      const L = spec.length;

      const Textures = window.CargoPacker;
      const corrTex = Textures && Textures.createCorrugatedTexture ? Textures.createCorrugatedTexture('#1e3a8a') : null;
      if (corrTex) {
        corrTex.repeat.set(L * 0.8, H * 0.8);
      }

      // 1. Structural Corner Castings & Steel Frame
      const steelMat = new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.85,
        roughness: 0.35
      });

      const frameBeamMat = new THREE.MeshStandardMaterial({
        color: '#0f172a',
        metalness: 0.7,
        roughness: 0.4
      });

      // Corner casting size (standard ~0.15m cuboid)
      const ccSize = 0.14;
      const ccGeo = new THREE.BoxGeometry(ccSize, ccSize, ccSize);

      const cornerCoords = [
        [0, 0, 0], [W, 0, 0], [0, H, 0], [W, H, 0],
        [0, 0, L], [W, 0, L], [0, H, L], [W, H, L]
      ];

      cornerCoords.forEach(([cx, cy, cz]) => {
        const cc = new THREE.Mesh(ccGeo, steelMat);
        cc.position.set(cx, cy, cz);
        cc.castShadow = true;
        this.group.add(cc);
      });

      // 4 Vertical corner posts
      const postGeo = new THREE.BoxGeometry(0.08, H, 0.08);
      [[0, 0], [W, 0], [0, L], [W, L]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeo, frameBeamMat);
        post.position.set(px, H / 2, pz);
        post.castShadow = true;
        this.group.add(post);
      });

      // 4 Bottom rails & 4 top rails
      const bottomXGeo = new THREE.BoxGeometry(W, 0.08, 0.08);
      const topXGeo = new THREE.BoxGeometry(W, 0.08, 0.08);
      const railZGeo = new THREE.BoxGeometry(0.08, 0.08, L);

      // Bottom X rails (back & front)
      const b1 = new THREE.Mesh(bottomXGeo, frameBeamMat);
      b1.position.set(W / 2, 0, 0);
      const b2 = new THREE.Mesh(bottomXGeo, frameBeamMat);
      b2.position.set(W / 2, 0, L);
      this.group.add(b1, b2);

      // Top X rails
      const t1 = new THREE.Mesh(topXGeo, frameBeamMat);
      t1.position.set(W / 2, H, 0);
      const t2 = new THREE.Mesh(topXGeo, frameBeamMat);
      t2.position.set(W / 2, H, L);
      this.group.add(t1, t2);

      // Longitudinal Z rails (left bottom, right bottom, left top, right top)
      const rBL = new THREE.Mesh(railZGeo, frameBeamMat);
      rBL.position.set(0, 0, L / 2);
      const rBR = new THREE.Mesh(railZGeo, frameBeamMat);
      rBR.position.set(W, 0, L / 2);
      const rTL = new THREE.Mesh(railZGeo, frameBeamMat);
      rTL.position.set(0, H, L / 2);
      const rTR = new THREE.Mesh(railZGeo, frameBeamMat);
      rTR.position.set(W, H, L / 2);
      this.group.add(rBL, rBR, rTL, rTR);

      // 2. Floor Plane (Tough marine plywood / steel)
      const floorGeo = new THREE.PlaneGeometry(W, L);
      const floorMat = new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.85,
        metalness: 0.15
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(W / 2, 0, L / 2);
      floor.receiveShadow = true;
      this.group.add(floor);

      // 3. Back Bulkhead Wall (Z = 0)
      const backWallGeo = new THREE.PlaneGeometry(W, H);
      const backWallMat = new THREE.MeshStandardMaterial({
        color: '#1e3a8a',
        map: corrTex,
        roughness: 0.6,
        metalness: 0.3,
        side: THREE.DoubleSide
      });
      const backWall = new THREE.Mesh(backWallGeo, backWallMat);
      backWall.position.set(W / 2, H / 2, 0);
      backWall.receiveShadow = true;
      this.group.add(backWall);

      // 4. Right Solid Wall (X = W)
      const rightWallGeo = new THREE.PlaneGeometry(L, H);
      const rightWallMat = new THREE.MeshStandardMaterial({
        color: '#1e3a8a',
        map: corrTex,
        roughness: 0.6,
        metalness: 0.3,
        side: THREE.DoubleSide
      });
      const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.position.set(W, H / 2, L / 2);
      rightWall.receiveShadow = true;
      this.group.add(rightWall);

      // 5. Left Wall (X = 0) and Roof (Y = H) - Governed by viewMode
      if (this.viewMode === 'cutaway') {
        // Translucent Glass / Acrylic with Wireframe Accents
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: '#38bdf8',
          transparent: true,
          opacity: 0.08,
          roughness: 0.1,
          metalness: 0.1,
          transmission: 0.85,
          ior: 1.4,
          side: THREE.DoubleSide,
          depthWrite: false
        });

        // Left glass wall
        const leftGlass = new THREE.Mesh(rightWallGeo, glassMat);
        leftGlass.rotation.y = Math.PI / 2;
        leftGlass.position.set(0, H / 2, L / 2);
        this.group.add(leftGlass);

        // Roof glass
        const roofGlass = new THREE.Mesh(floorGeo, glassMat);
        roofGlass.rotation.x = Math.PI / 2;
        roofGlass.position.set(W / 2, H, L / 2);
        this.group.add(roofGlass);

        // Faint wireframe grid overlay for orientation
        const leftWireMat = new THREE.MeshBasicMaterial({
          color: '#0284c7',
          wireframe: true,
          transparent: true,
          opacity: 0.15
        });
        const leftWire = new THREE.Mesh(new THREE.PlaneGeometry(L, H, Math.round(L), Math.round(H)), leftWireMat);
        leftWire.rotation.y = Math.PI / 2;
        leftWire.position.set(0, H / 2, L / 2);
        this.group.add(leftWire);

      } else if (this.viewMode === 'solid') {
        // Solid opaque container
        const leftSolid = new THREE.Mesh(rightWallGeo, rightWallMat);
        leftSolid.rotation.y = Math.PI / 2;
        leftSolid.position.set(0, H / 2, L / 2);
        this.group.add(leftSolid);

        const roofSolid = new THREE.Mesh(floorGeo, rightWallMat);
        roofSolid.rotation.x = Math.PI / 2;
        roofSolid.position.set(W / 2, H, L / 2);
        this.group.add(roofSolid);
      }
      // 'wireframe' leaves left and top open with only the steel beams visible
    }

    buildPallet(spec) {
      const W = spec.width;  // 0.80m
      const L = spec.length; // 1.20m
      const H = 0.144;       // Pallet base thickness

      const woodMat = new THREE.MeshStandardMaterial({
        color: '#b45309',
        roughness: 0.9,
        metalness: 0.05
      });

      // 3 longitudinal bottom stringers
      const stringerGeo = new THREE.BoxGeometry(0.10, 0.022, L);
      [0.05, W / 2, W - 0.05].forEach(sx => {
        const str = new THREE.Mesh(stringerGeo, woodMat);
        str.position.set(sx, 0.011, L / 2);
        str.receiveShadow = true;
        this.group.add(str);
      });

      // 9 wooden blocks
      const blockGeo = new THREE.BoxGeometry(0.10, 0.078, 0.14);
      [0.05, W / 2, W - 0.05].forEach(bx => {
        [0.07, L / 2, L - 0.07].forEach(bz => {
          const blk = new THREE.Mesh(blockGeo, woodMat);
          blk.position.set(bx, 0.022 + 0.039, bz);
          blk.receiveShadow = true;
          this.group.add(blk);
        });
      });

      // 5 top deck boards
      const boardGeo = new THREE.BoxGeometry(W, 0.022, 0.14);
      const boardZ = [0.07, 0.35, L / 2, 0.85, L - 0.07];
      boardZ.forEach(bz => {
        const bd = new THREE.Mesh(boardGeo, woodMat);
        bd.position.set(W / 2, 0.10 + 0.011, bz);
        bd.receiveShadow = true;
        this.group.add(bd);
      });

      // Envelope wireframe boundary cage up to max height
      const envCageGeo = new THREE.BoxGeometry(W, spec.height, L);
      const wireMat = new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        wireframe: true,
        transparent: true,
        opacity: 0.2
      });
      const envCage = new THREE.Mesh(envCageGeo, wireMat);
      envCage.position.set(W / 2, spec.height / 2, L / 2);
      this.group.add(envCage);
    }
  }

  exports.ContainerRenderer = ContainerRenderer;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
