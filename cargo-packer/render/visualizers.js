/**
 * cargo-packer/render/visualizers.js
 * Visual diagnostic overlays: glowing Extreme Points, Center of Gravity target,
 * plumb lines, and candidate ghost boxes.
 */
(function(exports) {
  'use strict';

  class Visualizers {
    constructor(sceneManager) {
      this.sceneManager = sceneManager;
      this.group = sceneManager.visualizerGroup;

      this.epPointsMesh = null;
      this.cogMarker = null;
      this.cogPlumbLine = null;
      this.ghostBox = null;

      this.setupCogMarker();
      this.setupGhostBox();
    }

    clear() {
      this.showSupport(null);
      if (this.epPointsMesh) {
        this.group.remove(this.epPointsMesh);
        this.epPointsMesh.geometry.dispose();
        this.epPointsMesh.material.dispose();
        this.epPointsMesh = null;
      }
      this.setGhost(null);
      this.hideCog();
    }

    /**
     * Renders active candidate Extreme Points as glowing anchor spheres.
     * @param {Array<{x: number, y: number, z: number}>} points
     * @param {Object} activePoint Currently selected EP {x, y, z}
     */
    renderExtremePoints(points, activePoint = null) {
      if (this.epPointsMesh) {
        this.group.remove(this.epPointsMesh);
        this.epPointsMesh.geometry.dispose();
        this.epPointsMesh.material.dispose();
        this.epPointsMesh = null;
      }

      if (!points || points.length === 0) return;

      const sphereGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const instMesh = new THREE.InstancedMesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color: '#38bdf8' }),
        points.length
      );

      const matrix = new THREE.Matrix4();
      const color = new THREE.Color();

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        matrix.setPosition(pt.x, pt.y, pt.z);
        instMesh.setMatrixAt(i, matrix);

        // Active point is bright amber/yellow, other candidates are cyan
        if (activePoint && Math.abs(pt.x - activePoint.x) < 1e-4 && Math.abs(pt.y - activePoint.y) < 1e-4 && Math.abs(pt.z - activePoint.z) < 1e-4) {
          color.set('#f59e0b');
        } else {
          color.set('#38bdf8');
        }
        instMesh.setColorAt(i, color);
      }

      instMesh.instanceMatrix.needsUpdate = true;
      if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;

      this.epPointsMesh = instMesh;
      this.group.add(this.epPointsMesh);
    }

    setupCogMarker() {
      const cogGroup = new THREE.Group();

      // Glowing sphere
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshStandardMaterial({
          color: '#10b981', // Emerald green
          emissive: '#059669',
          emissiveIntensity: 0.6,
          metalness: 0.2,
          roughness: 0.2
        })
      );
      cogGroup.add(sphere);

      // Orbital target ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.015, 8, 24),
        new THREE.MeshBasicMaterial({ color: '#34d399', wireframe: true })
      );
      ring.rotation.x = Math.PI / 2;
      cogGroup.add(ring);

      // Floor plumb-line (vertical projection)
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -1, 0)
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: '#10b981',
        dashSize: 0.1,
        gapSize: 0.05
      });
      const plumbLine = new THREE.Line(lineGeo, lineMat);
      plumbLine.computeLineDistances();
      cogGroup.add(plumbLine);

      // Floor target disk
      const disk = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.18, 24),
        new THREE.MeshBasicMaterial({
          color: '#10b981',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        })
      );
      disk.rotation.x = -Math.PI / 2;
      disk.position.y = 0;
      cogGroup.add(disk);

      cogGroup.visible = false;
      this.group.add(cogGroup);
      this.cogMarker = cogGroup;
      this.cogSphere = sphere;
      this.cogDisk = disk;
      this.cogPlumbLine = plumbLine;
    }

    updateCog(cogData, container) {
      if (!cogData || !this.cogMarker) return;

      this.cogMarker.visible = true;
      this.cogMarker.position.set(cogData.x, 0, cogData.z);
      this.cogSphere.position.set(0, cogData.y, 0);

      // Color code by balance status
      let colorHex = '#10b981'; // optimal
      if (cogData.status === 'acceptable') colorHex = '#f59e0b';
      if (cogData.status === 'hazard') colorHex = '#ef4444';

      this.cogSphere.material.color.set(colorHex);
      this.cogSphere.material.emissive.set(colorHex);
      this.cogDisk.material.color.set(colorHex);

      // Update plumbline length
      const points = [new THREE.Vector3(0, cogData.y, 0), new THREE.Vector3(0, 0, 0)];
      this.cogPlumbLine.geometry.setFromPoints(points);
      this.cogPlumbLine.computeLineDistances();
    }

    hideCog() {
      if (this.cogMarker) this.cogMarker.visible = false;
    }

    /**
     * Green patches on the top faces a box rests on: the overlap with each
     * box beneath it (or its whole footprint on the floor). Pass null to clear.
     * @param {Object|null} box Placed box {x, y, z, w, h, d}
     * @param {Array<Object>} below Boxes placed before it
     */
    showSupport(box, below = []) {
      if (this.supportGroup) {
        this.supportGroup.traverse(m => { if (m.geometry) m.geometry.dispose(); });
        this.group.remove(this.supportGroup);
        this.supportGroup = null;
      }
      if (!box) return;

      const g = new THREE.Group();
      // Lime with a white rim: reads against any carton colour underneath
      const mat = this.supportMat || (this.supportMat = new THREE.MeshBasicMaterial({
        color: '#a3e635', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false
      }));
      const rim = this.supportRim || (this.supportRim = new THREE.LineBasicMaterial({ color: '#ffffff' }));
      const patch = (x0, x1, z0, z1, y) => {
        const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
        const m = new THREE.Mesh(geo, mat);
        m.rotation.x = -Math.PI / 2;
        m.position.set((x0 + x1) / 2, y + 0.006, (z0 + z1) / 2);
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), rim));
        g.add(m);
      };

      if (box.y <= 1e-4) {
        patch(box.x, box.x + box.w, box.z, box.z + box.d, 0);
      } else {
        below.forEach(p => {
          if (Math.abs(p.y + p.h - box.y) > 1e-4) return;
          const x0 = Math.max(box.x, p.x), x1 = Math.min(box.x + box.w, p.x + p.w);
          const z0 = Math.max(box.z, p.z), z1 = Math.min(box.z + box.d, p.z + p.d);
          if (x1 - x0 > 1e-4 && z1 - z0 > 1e-4) patch(x0, x1, z0, z1, box.y);
        });
      }
      this.supportGroup = g;
      this.group.add(g);
    }

    setupGhostBox() {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: '#fbbf24',
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      this.ghostBox = new THREE.Mesh(geo, mat);
      this.ghostBox.visible = false;
      this.group.add(this.ghostBox);
    }

    setGhost(boxSpec) {
      if (!boxSpec) {
        this.ghostBox.visible = false;
        return;
      }
      this.ghostBox.scale.set(boxSpec.w, boxSpec.h, boxSpec.d);
      this.ghostBox.position.set(
        boxSpec.x + boxSpec.w / 2,
        boxSpec.y + boxSpec.h / 2,
        boxSpec.z + boxSpec.d / 2
      );
      this.ghostBox.visible = true;
    }
  }

  exports.Visualizers = Visualizers;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
