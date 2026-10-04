/**
 * cargo-packer/render/boxes.js
 * 3D Cargo Box Mesh Generator and Animation Controller.
 */
(function(exports) {
  'use strict';

  class BoxRenderer {
    constructor(sceneManager) {
      this.sceneManager = sceneManager;
      this.group = sceneManager.cargoGroup;
      this.meshMap = new Map(); // id -> mesh
      this.highlightMesh = null;

      // Selection indicator helper
      const selGeo = new THREE.BoxGeometry(1, 1, 1);
      const selMat = new THREE.MeshBasicMaterial({
        color: '#fbbf24', // Amber
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });
      this.selectionBox = new THREE.Mesh(selGeo, selMat);
      this.selectionBox.visible = false;
      this.sceneManager.scene.add(this.selectionBox);
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
      this.meshMap.clear();
      this.selectionBox.visible = false;
    }

    /**
     * Creates and adds a box mesh to the scene with optional drop-in animation.
     * @param {Object} boxData Placed box info {id, x, y, z, w, h, d, color, category, name}
     * @param {boolean} animate Whether to animate falling into place
     */
    addBox(boxData, animate = true) {
      const Textures = window.CargoPacker;
      let mat;

      if (boxData.category === 'crate') {
        const crateTex = Textures && Textures.createCrateTexture ? Textures.createCrateTexture() : null;
        mat = new THREE.MeshStandardMaterial({
          map: crateTex,
          roughness: 0.85,
          metalness: 0.1
        });
      } else if (boxData.category === 'drum') {
        mat = new THREE.MeshStandardMaterial({
          color: boxData.color || '#64748b',
          roughness: 0.35,
          metalness: 0.75
        });
      } else {
        // Standard carton
        const cartonTex = Textures && Textures.createCartonTexture ? Textures.createCartonTexture(boxData.color, boxData.name) : null;
        mat = new THREE.MeshStandardMaterial({
          color: boxData.color,
          map: cartonTex,
          roughness: 0.7,
          metalness: 0.1
        });
      }

      let geo;
      if (boxData.category === 'drum') {
        // Cylinder for chemical drums
        const radius = Math.min(boxData.w, boxData.d) / 2;
        geo = new THREE.CylinderGeometry(radius, radius, boxData.h, 24);
      } else {
        // Box geometry
        geo = new THREE.BoxGeometry(boxData.w, boxData.h, boxData.d);
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = boxData;

      const targetX = boxData.x + boxData.w / 2;
      const targetY = boxData.y + boxData.h / 2;
      const targetZ = boxData.z + boxData.d / 2;

      if (animate) {
        // Drop in from slightly above
        const dropHeight = targetY + Math.min(1.5, boxData.h * 1.5 + 0.3);
        mesh.position.set(targetX, dropHeight, targetZ);

        // Smooth tween
        const startY = dropHeight;
        const startTime = performance.now();
        const duration = 240; // ms

        const updateAnim = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(1.0, elapsed / duration);
          // Ease out bounce
          const ease = 1 - Math.pow(1 - progress, 3);
          mesh.position.y = startY + (targetY - startY) * ease;

          if (progress < 1.0) {
            requestAnimationFrame(updateAnim);
          } else {
            mesh.position.y = targetY;
          }
        };
        requestAnimationFrame(updateAnim);
      } else {
        mesh.position.set(targetX, targetY, targetZ);
      }

      // Add subtle dark edge wireframe to delineate packed boxes
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 'rgba(0, 0, 0, 0.3)',
        linewidth: 1
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.add(edges);

      this.group.add(mesh);
      this.meshMap.set(boxData.id, mesh);
      return mesh;
    }

    /**
     * Removes a box mesh (for undo/stepping back).
     */
    removeBox(boxId) {
      const mesh = this.meshMap.get(boxId);
      if (mesh) {
        this.group.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
        this.meshMap.delete(boxId);
      }
    }

    /**
     * Highlights an individual box with an outer selection outline.
     */
    selectBox(boxData) {
      if (!boxData) {
        this.selectionBox.visible = false;
        return;
      }
      this.selectionBox.scale.set(boxData.w + 0.02, boxData.h + 0.02, boxData.d + 0.02);
      this.selectionBox.position.set(
        boxData.x + boxData.w / 2,
        boxData.y + boxData.h / 2,
        boxData.z + boxData.d / 2
      );
      this.selectionBox.visible = true;
    }
  }

  exports.BoxRenderer = BoxRenderer;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
