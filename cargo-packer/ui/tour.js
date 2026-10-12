/**
 * cargo-packer/ui/tour.js
 * Runs the guided tours in ui/tourContent.js: an article panel whose chapters
 * stage the 3D view (scenario, algorithm, packing step, camera flight and
 * highlights).
 */
(function(exports) {
  'use strict';

  class GuidedTour {
    /**
     * @param {{controller, ui, sceneManager, visualizers, boxRenderer}} deps
     */
    constructor(deps) {
      Object.assign(this, deps);
      this.algoId = null;
      this.index = 0;

      this.panel = document.getElementById('tour-panel');
      this.kickerEl = document.getElementById('tour-kicker');
      this.titleEl = document.getElementById('tour-title');
      this.bodyEl = document.getElementById('tour-body');
      this.dotsEl = document.getElementById('tour-dots');
      this.prevBtn = document.getElementById('tour-prev');
      this.nextBtn = document.getElementById('tour-next');

      this.prevBtn.addEventListener('click', () => this.go(this.index - 1));
      this.nextBtn.addEventListener('click', () => {
        if (this.index >= this.chapters().length - 1) this.close();
        else this.go(this.index + 1);
      });
      document.getElementById('tour-close').addEventListener('click', () => this.close());
      this.dotsEl.addEventListener('click', e => {
        const dot = e.target.closest('[data-chapter]');
        if (dot) this.go(+dot.dataset.chapter);
      });
      document.addEventListener('keydown', e => {
        if (!this.algoId || e.target.closest('input, select, textarea')) return;
        if (e.key === 'ArrowRight') this.nextBtn.click();
        else if (e.key === 'ArrowLeft' && this.index > 0) this.go(this.index - 1);
        else if (e.key === 'Escape') this.close();
      });

      // Keep the shot in the part of the screen the tour leaves free
      window.addEventListener('resize', () => {
        if (this.algoId) requestAnimationFrame(() => this.reframe());
      });

      const startBtn = document.getElementById('btn-tour');
      if (startBtn) {
        startBtn.addEventListener('click', () => this.start(this.controller.selectedAlgorithm));
      }
    }

    chapters() {
      const tour = window.CargoPacker.TOURS[this.algoId];
      return tour ? tour.chapters : [];
    }

    start(algoId) {
      const CP = window.CargoPacker;
      const tour = CP.TOURS[algoId];
      if (!tour) return;
      this.algoId = algoId;

      // A tour is told in a single view of its own scenario
      this.ui.closeAllDrawers();
      if (this.controller.compareMode) this.ui.setCompare(false);
      if (this.controller.selectedScenario !== tour.scenario) {
        this.controller.loadScenario(tour.scenario);
        this.ui.syncCamButtons('isometric');
      }
      if (this.controller.selectedAlgorithm !== algoId) this.controller.setAlgorithm(algoId);

      document.body.classList.add('touring');
      this.panel.hidden = false;
      this.kickerEl.textContent = `How it works · ${CP.getAlgorithm(algoId).name}`;

      // The text quotes ranks and counts, so wait for every algorithm
      if (this.controller.solving) {
        this.titleEl.textContent = 'Packing the load…';
        this.bodyEl.textContent = 'The algorithms run in the background; the tour starts as soon as they finish.';
        this.dotsEl.innerHTML = '';
      }
      this.reframe();
      this.controller.whenSolved().then(() => {
        if (this.algoId === algoId) this.go(0);
      });
    }

    close() {
      this.algoId = null;
      document.body.classList.remove('touring');
      this.panel.hidden = true;
      this.sceneManager.setFrame(null);
      this.visualizers.showSupport(null);
      this.visualizers.setGhost(null);
      this.boxRenderer.selectBox(null);
    }

    /** Resolves a chapter's step to an index into the current load's steps. */
    resolveStep(step) {
      const steps = this.controller.packResult ? this.controller.packResult.steps : [];
      const last = steps.length - 1;
      if (step === 'end') return last;
      if (step === 'firstStacked') {
        const i = steps.findIndex(s => s.box.y > 1e-4);
        return i >= 0 ? i : Math.max(0, Math.round(last / 2));
      }
      if (step === 'partlySupported') {
        // The stacked box with the least under it: the clearest picture of the 60 % rule
        let best = -1;
        steps.forEach((s, i) => {
          if (s.box.y > 1e-4 && (best < 0 || (s.box.supportRatio || 1) < (steps[best].box.supportRatio || 1))) best = i;
        });
        return best >= 0 ? best : Math.max(0, Math.round(last / 2));
      }
      if (step === 'firstNewWall') {
        const z0 = steps.length ? steps[0].box.z + steps[0].box.d : 0;
        const i = steps.findIndex(s => s.box.z >= z0 - 1e-4);
        return i >= 0 ? i : last;
      }
      if (typeof step === 'string' && step.endsWith('%')) {
        return Math.max(0, Math.min(last, Math.round(last * parseFloat(step) / 100)));
      }
      return Math.min(step, last);
    }

    go(index) {
      const chapters = this.chapters();
      if (!chapters.length || !this.controller.packResult) return;
      this.index = Math.max(0, Math.min(chapters.length - 1, index));
      const ch = chapters[this.index];
      const show = new Set(ch.show || []);

      // 1. Stage the load at the chapter's step; the last box drops in
      const stepIdx = this.resolveStep(ch.step);
      this.controller.goToStep(stepIdx, stepIdx >= 0);
      const result = this.controller.packResult;
      const step = stepIdx >= 0 ? result.steps[stepIdx] : null;
      const box = step ? step.box : null;

      // 2. Highlights
      if (!show.has('eps')) this.visualizers.renderExtremePoints(null);
      if (!show.has('cog')) this.visualizers.hideCog();
      this.boxRenderer.selectBox(box && show.has('select') ? box : null);
      if (box && show.has('support')) {
        // Show the box as an outline so the patches it stands on are visible
        const mesh = this.boxRenderer.meshMap.get(box.id);
        if (mesh) mesh.visible = false;
        this.visualizers.setGhost(box);
        this.visualizers.showSupport(box, result.steps.slice(0, stepIdx).map(s => s.box));
      } else {
        this.visualizers.showSupport(null);
        this.visualizers.setGhost(null);
      }

      // 3. Text
      this.titleEl.textContent = ch.title;
      this.bodyEl.innerHTML = this.fill(ch.body, step, box) +
        (ch.note ? `<p class="tour-note">${this.fill(ch.note, step, box)}</p>` : '');
      this.dotsEl.innerHTML = chapters.map((c, i) =>
        `<button type="button" class="tour-dot${i === this.index ? ' active' : ''}" data-chapter="${i}" aria-label="Chapter ${i + 1}: ${c.title}"></button>`
      ).join('');
      this.prevBtn.disabled = this.index === 0;
      this.nextBtn.textContent = this.index === chapters.length - 1 ? 'Finish' : 'Next →';
      this.bodyEl.scrollTop = 0;

      // 4. Camera, framed in the space the panel leaves free (the panel's
      //    height changes with the chapter's text, so measure it each time)
      this.reframe();
      this.sceneManager.flyTo(this.pose(ch.camera, box));
    }

    /**
     * The part of the screen nothing covers: below the top bar, above the dock
     * and, on a phone, above the tour sheet; beside the tour panel and the
     * metrics panel on a desktop. The camera's shot is centred there.
     */
    freeRect() {
      const W = window.innerWidth, H = window.innerHeight, pad = 8;
      const top = document.querySelector('header.top-bar');
      const dock = document.querySelector('nav.playback-bar');
      let x0 = pad, x1 = W - pad;
      let y0 = (top ? top.getBoundingClientRect().bottom : 56) + pad;
      let y1 = (dock ? dock.getBoundingClientRect().top : H - 84) - pad;

      const pr = this.panel.getBoundingClientRect();
      if (pr.width > W * 0.6) y1 = Math.min(y1, pr.top - pad); // bottom sheet
      else x0 = Math.max(x0, pr.right + pad);                    // side panel

      const hud = document.getElementById('right-hud');
      if (hud && W > 900) {
        const hr = hud.getBoundingClientRect();
        if (hr.width > 0) x1 = Math.min(x1, hr.left - pad);
      }
      if (x1 - x0 < 120 || y1 - y0 < 120) return null; // too cramped: use the whole screen
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    reframe() {
      this.sceneManager.setFrame(this.freeRect());
    }

    /** Camera pose for a chapter, relative to the container and the focus box. */
    pose(name, box) {
      const sm = this.sceneManager;
      const spec = window.CargoPacker.CONTAINERS[this.controller.selectedContainer];
      const presets = { overview: 'isometric', top: 'top', side: 'cutaway', doors: 'rear' };
      if (presets[name]) return sm.presetPose(presets[name], spec);

      // 'corner' and 'focus' close in along the overview's line of sight, so
      // the move reads as a zoom rather than a jump to a new angle. 'above'
      // looks steeply down on the box, for the support patches under it.
      const overview = sm.presetPose('isometric', spec);
      const dir = overview.position.clone().sub(overview.target).normalize();
      if (name === 'above') dir.set(dir.x * 0.35, 1, dir.z * 0.35).normalize();
      let target;
      let dist;
      if ((name === 'focus' || name === 'above') && box) {
        target = new THREE.Vector3(box.x + box.w / 2, box.y + box.h / 2, box.z + box.d / 2);
        dist = Math.min(7, 3 + Math.max(box.w, box.h, box.d) * 2.2) * (name === 'above' ? 0.8 : 1);
      } else {
        // The loading corner: floor, bulkhead and side wall
        target = new THREE.Vector3(Math.min(1.0, spec.width * 0.45), 0.5, Math.min(1.2, spec.length * 0.3));
        dist = spec.length < 2 ? 3.2 : 4.6;
      }
      return {
        target: target,
        position: target.clone().add(dir.multiplyScalar(dist * sm.pullBack()))
      };
    }

    /** Fills {placeholders} from the live load. */
    fill(text, step, box) {
      const CP = window.CargoPacker;
      const c = this.controller;
      const r = c.packResult;
      const comp = c.comparison;
      const mine = comp && comp.results[this.algoId];
      const values = {
        total: r.placed.length + r.unplaced.length,
        placed: r.placed.length,
        unplaced: r.unplaced.length,
        fill: r.metrics.volumeUtilization,
        extent: mine ? mine.extentLabel.replace(' used', ' of floor') : '',
        box: box ? box.name : 'box',
        epCount: step ? (step.candidateCount !== undefined ? step.candidateCount : (step.candidateEPs || []).length) : 0,
        support: box ? Math.round((box.supportRatio !== undefined ? box.supportRatio : 1) * 100) : 0,
        depth: box ? box.d.toFixed(2) : '',
        rank: comp ? comp.ranking.findIndex(x => x.id === this.algoId) + 1 : '?',
        algoCount: CP.ALGORITHMS.length,
        winner: comp ? comp.winner.shortName : ''
      };
      return text.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
    }
  }

  exports.GuidedTour = GuidedTour;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
