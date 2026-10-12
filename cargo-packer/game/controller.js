/**
 * cargo-packer/game/controller.js
 * Central playback and simulation state machine.
 */
(function(exports) {
  'use strict';

  class PackerController {
    constructor(sceneManager, containerRenderer, boxRenderer, visualizers, sound) {
      this.sceneManager = sceneManager;
      this.containerRenderer = containerRenderer;
      this.boxRenderer = boxRenderer;
      this.visualizers = visualizers;
      this.sound = sound;

      this.selectedScenario = 'fmcg';
      this.selectedContainer = 'iso20';
      this.selectedAlgorithm = 'extremePoints';
      this.minSupportRatio = 0.60;

      // Playback speed in ms per box
      this.speedMs = 180;
      this.isPlaying = false;
      this.playTimer = null;

      this.currentStep = -1;
      this.packResult = null;
      this.onStateChange = null; // Callback for UI updates

      // Cargo edits, per scenario: { counts: { typeKey: n } } for the fixed
      // manifests, { count: n } for the random one. Absent = the defaults.
      this.cargo = {};

      // Side-by-side compare: a second algorithm packed into its own group,
      // stepped in lockstep with the main one.
      this.compareMode = false;
      this.compareAlgorithm = 'wallBuilding';
      this.compareResult = null;
      this.boxRendererB = null;
    }

    /** Steps in the longer of the two loads, so playback runs until both finish. */
    totalSteps() {
      if (!this.packResult) return 0;
      const a = this.packResult.steps.length;
      return this.compareMode && this.compareResult ? Math.max(a, this.compareResult.steps.length) : a;
    }

    setCompareMode(on) {
      this.compareMode = !!on && !!this.boxRendererB;
      this.pickCompareResult();
      this.redraw();
    }

    setCompareAlgorithm(algoId) {
      this.compareAlgorithm = algoId;
      this.pickCompareResult();
      this.redraw();
    }

    pickCompareResult() {
      this.compareResult = (this.runs && this.runs[this.compareAlgorithm]) || null;
    }

    /**
     * Shows the load as it stands after step `index` (-1 = empty). With
     * `dropLast`, the boxes before it appear at once and the last one drops
     * in with its sound, so a tour chapter lands with a little motion.
     */
    goToStep(index, dropLast = false) {
      const last = Math.min(index, this.totalSteps() - 1);
      this.currentStep = dropLast ? last - 1 : last;
      this.redraw();
      if (dropLast && last >= 0) this.stepForward(true);
    }

    /** Rebuilds both loads at the current step, without animation or sound. */
    redraw() {
      this.pause();
      const target = Math.min(this.currentStep, this.totalSteps() - 1);
      this.boxRenderer.clear();
      if (this.boxRendererB) this.boxRendererB.clear();
      this.visualizers.clear();
      this.currentStep = -1;
      while (this.currentStep < target) this.stepForward(false, true);
      const shown = this.currentStep >= 0 ? this.packResult.steps[Math.min(this.currentStep, this.packResult.steps.length - 1)] : null;
      if (shown && shown.candidateEPs) this.visualizers.renderExtremePoints(shown.candidateEPs, shown.chosenEP);
      this.notifyUI(this.liveMetrics());
    }

    init() {
      this.loadScenario(this.selectedScenario);
    }

    loadScenario(scenarioId) {
      const CP = window.CargoPacker;
      const preset = CP.PRESETS[scenarioId];
      if (!preset) return;

      this.pause();
      this.selectedScenario = scenarioId;
      this.selectedContainer = preset.containerId;

      const containerSpec = CP.CONTAINERS[this.selectedContainer];
      this.containerRenderer.build(containerSpec);
      this.sceneManager.setCameraPreset('isometric', containerSpec);

      this.solve();
    }

    setContainer(containerId) {
      const CP = window.CargoPacker;
      const spec = CP.CONTAINERS[containerId];
      if (!spec) return;

      this.pause();
      this.selectedContainer = containerId;
      this.containerRenderer.build(spec);
      this.sceneManager.setCameraPreset('isometric', spec);

      this.solve();
    }

    /**
     * Every solve packs with every algorithm, so switching is instant once
     * that one has finished; until then the scene waits for its result.
     */
    setAlgorithm(algoId) {
      this.pause();
      this.selectedAlgorithm = algoId;
      if (!this.runs || (!this.runs[algoId] && !this.solving)) {
        this.solve();
        return;
      }
      this.packResult = this.runs[algoId] || null;
      this.reset();
    }

    rerollRandom() {
      const CP = window.CargoPacker;
      const nextSeed = Math.floor(Math.random() * 89999 + 10000);
      CP.setRandomSeed(nextSeed);
      this.solve();
    }

    // ── Cargo editor ────────────────────────────────────────────────────

    /** Current count per type (fixed scenarios) or the item count (random). */
    cargoCounts() {
      const preset = window.CargoPacker.PRESETS[this.selectedScenario];
      const edit = this.cargo[this.selectedScenario];
      if (preset.isRandom) return { count: edit && edit.count !== undefined ? edit.count : preset.defaultCount };
      const counts = {};
      preset.types.forEach(t => {
        counts[t.key] = edit && edit.counts && edit.counts[t.key] !== undefined ? edit.counts[t.key] : t.count;
      });
      return { counts: counts };
    }

    /**
     * Replaces the cargo for the current scenario and repacks. Any whole
     * number goes: packing runs in a background worker, so a big load takes
     * longer but never freezes the page.
     */
    setCargo(cargo) {
      const CP = window.CargoPacker;
      const preset = CP.PRESETS[this.selectedScenario];
      const whole = v => Math.max(0, Math.round(+v || 0));
      let next;
      if (preset.isRandom) {
        next = { count: Math.max(1, whole(cargo.count)) };
      } else {
        const counts = {};
        preset.types.forEach(t => { counts[t.key] = whole(cargo.counts[t.key]); });
        next = { counts: counts };
      }
      // A field losing focus fires "change" again with the same numbers:
      // repacking then would reset whatever is playing.
      if (JSON.stringify(next) === JSON.stringify(this.cargoCounts())) return;
      this.cargo[this.selectedScenario] = next;
      this.solve();
    }

    resetCargo() {
      delete this.cargo[this.selectedScenario];
      this.solve();
    }

    // ── Solving ─────────────────────────────────────────────────────────

    /**
     * Packs the current cargo with every algorithm. The work runs in a
     * background worker (core/solveWorker.js) and results arrive one by one:
     * the algorithm on screen first, then the compare pane's, then the quick
     * ones, the slow ones last. A newer solve cancels an older one. Where
     * workers are unavailable (a page opened from file://) the same sequence
     * runs on the page, yielding between algorithms.
     */
    solve() {
      const CP = window.CargoPacker;
      const preset = CP.PRESETS[this.selectedScenario];
      const container = CP.CONTAINERS[this.selectedContainer];
      const items = preset.getItems(this.cargo[this.selectedScenario]);

      this.items = items;
      this.runs = {};
      this.packResult = null;
      this.compareResult = null;
      this.comparison = CP.rankAlgorithms({}, items.length, container);
      this.reset();

      const first = [this.selectedAlgorithm].concat(this.compareMode ? [this.compareAlgorithm] : []);
      const rest = CP.ALGORITHMS.filter(a => !first.includes(a.id));
      const order = first.concat(rest.filter(a => !a.slow).map(a => a.id), rest.filter(a => a.slow).map(a => a.id));

      const job = {
        id: (this.solveId = (this.solveId || 0) + 1),
        items: items,
        container: container,
        options: { minSupportRatio: this.minSupportRatio },
        order: order
      };
      this.solving = { id: job.id, done: 0, total: order.length, current: order[0] };
      this.solved = new Promise(resolve => { this.resolveSolved = resolve; });
      this.dispatch(job);
      this.notifyUI();
      return this.solved;
    }

    /** Resolves once the current solve has every algorithm's result. */
    whenSolved() {
      return this.solving ? this.solved : Promise.resolve();
    }

    dispatch(job) {
      this.job = job;
      if (this.worker === undefined) this.worker = this.makeWorker();
      if (this.worker && this.workerBusy) {
        // Still packing an older load: drop it rather than wait for it
        this.worker.terminate();
        this.worker = this.makeWorker();
      }
      if (this.worker) {
        this.workerBusy = true;
        this.worker.postMessage(job);
      } else {
        this.solveOnPage(job);
      }
    }

    makeWorker() {
      if (typeof Worker === 'undefined') return null;
      try {
        const w = new Worker('core/solveWorker.js');
        w.onmessage = e => this.onSolveMessage(e.data);
        w.onerror = e => {
          // Could not load or crashed: pack on the page from now on
          if (e && e.preventDefault) e.preventDefault();
          w.terminate();
          this.worker = null;
          this.workerBusy = false;
          if (this.job && this.solving && this.solving.id === this.job.id) this.solveOnPage(this.job);
        };
        return w;
      } catch (err) {
        return null; // e.g. file:// pages may not start workers
      }
    }

    solveOnPage(job) {
      const CP = window.CargoPacker;
      const next = k => {
        if (job.id !== this.solveId) return; // superseded
        if (k >= job.order.length) {
          this.onSolveMessage({ id: job.id, type: 'done' });
          return;
        }
        const t0 = performance.now();
        const result = CP.getAlgorithm(job.order[k]).run(job.items, job.container, job.options);
        this.onSolveMessage({ id: job.id, type: 'result', algoId: job.order[k], result: result, ms: Math.round(performance.now() - t0) });
        setTimeout(() => next(k + 1), 0); // let the page paint between algorithms
      };
      setTimeout(() => next(0), 0);
    }

    onSolveMessage(msg) {
      if (!this.solving || msg.id !== this.solveId) return; // an older solve
      const CP = window.CargoPacker;

      if (msg.type === 'done') {
        this.workerBusy = false;
        this.solving = null;
        this.notifyUI();
        this.resolveSolved();
        return;
      }

      msg.result.computeTimeMs = msg.ms;
      this.runs[msg.algoId] = msg.result;
      this.solving.done++;
      this.solving.current = this.job.order[this.solving.done] || null;
      this.comparison = CP.rankAlgorithms(this.runs, this.items.length, this.job.container);

      if (msg.algoId === this.selectedAlgorithm) {
        this.packResult = msg.result;
        this.pickCompareResult();
        this.reset();
      } else if (msg.algoId === this.compareAlgorithm) {
        this.pickCompareResult();
        if (this.compareMode && this.packResult) this.redraw();
      }
      this.notifyUI();
    }

    reset() {
      this.pause();
      this.boxRenderer.clear();
      if (this.boxRendererB) this.boxRendererB.clear();
      this.visualizers.clear();
      this.currentStep = -1;
      this.notifyUI();
    }

    play() {
      if (this.isPlaying) return;
      if (!this.packResult || this.totalSteps() === 0) return;

      if (this.currentStep >= this.totalSteps() - 1) {
        // If at the end, restart from beginning
        this.reset();
      }

      this.isPlaying = true;
      this.runPlayLoop();
      this.notifyUI();
    }

    pause() {
      this.isPlaying = false;
      if (this.playTimer) {
        clearTimeout(this.playTimer);
        this.playTimer = null;
      }
      this.notifyUI();
    }

    togglePlay() {
      if (this.isPlaying) this.pause();
      else this.play();
    }

    runPlayLoop() {
      if (!this.isPlaying) return;

      const nextStep = this.currentStep + 1;
      if (nextStep < this.totalSteps()) {
        this.stepForward(true);

        if (this.speedMs === 0) {
          // Instant mode
          while (this.currentStep < this.totalSteps() - 1) {
            this.stepForward(false);
          }
          this.pause();
          this.sound.playChime();
        } else {
          this.playTimer = setTimeout(() => this.runPlayLoop(), this.speedMs);
        }
      } else {
        this.pause();
        this.sound.playChime();
      }
    }

    /**
     * Live metrics for the main load up to the current step. In compare mode
     * the shorter load runs out first, so its index is clamped.
     */
    liveMetrics(result = this.packResult) {
      if (!result) return null;
      if (this.currentStep < 0) return window.CargoPacker.computeMetrics([], result.container);
      const upTo = Math.min(this.currentStep, result.steps.length - 1);
      const placed = result.steps.slice(0, upTo + 1).map(s => s.box);
      return window.CargoPacker.computeMetrics(placed, result.container);
    }

    stepForward(animate = true, silent = false) {
      if (!this.packResult || this.currentStep >= this.totalSteps() - 1) return;

      this.currentStep++;
      const step = this.packResult.steps[this.currentStep];
      const stepB = this.compareMode && this.compareResult ? this.compareResult.steps[this.currentStep] : null;

      if (step) {
        this.boxRenderer.addBox(step.box, animate);
        // Bulk (silent) steps skip this: only the step that ends up on screen
        // needs its anchor points, and rebuilding them per box is wasted work.
        if (step.candidateEPs && !silent) {
          this.visualizers.renderExtremePoints(step.candidateEPs, step.chosenEP);
        }
      }
      if (stepB) this.boxRendererB.addBox(stepB.box, animate);
      if (!silent) {
        const thud = step || stepB;
        if (thud) this.sound.playThud(thud.box.weight);
      }

      // Live Center of Gravity calculation up to current step
      const metrics = this.liveMetrics();
      this.visualizers.updateCog(metrics.cog, this.packResult.container);

      if (!silent) this.notifyUI(metrics);
    }

    stepBackward() {
      if (this.currentStep < 0) return;
      this.pause();

      const step = this.packResult.steps[this.currentStep];
      if (step) this.boxRenderer.removeBox(step.box.id);
      const stepB = this.compareMode && this.compareResult ? this.compareResult.steps[this.currentStep] : null;
      if (stepB) this.boxRendererB.removeBox(stepB.box.id);
      this.sound.playClick();

      this.currentStep--;

      if (this.currentStep >= 0) {
        const prevStep = this.packResult.steps[Math.min(this.currentStep, this.packResult.steps.length - 1)];
        if (prevStep) this.visualizers.renderExtremePoints(prevStep.candidateEPs, prevStep.chosenEP);

        const metrics = this.liveMetrics();
        this.visualizers.updateCog(metrics.cog, this.packResult.container);
        this.notifyUI(metrics);
      } else {
        this.visualizers.clear();
        this.notifyUI();
      }
    }

    jumpToEnd() {
      if (!this.packResult) return; // still packing
      this.pause();
      while (this.currentStep < this.totalSteps() - 1) {
        this.stepForward(false, true);
      }
      this.visualizers.renderExtremePoints(null);
      this.visualizers.updateCog(this.packResult.metrics.cog, this.packResult.container);
      this.notifyUI();
      this.sound.playChime();
    }

    setSpeed(speedVal) {
      if (speedVal === 'slow') this.speedMs = 450;
      else if (speedVal === 'normal') this.speedMs = 180;
      else if (speedVal === 'fast') this.speedMs = 45;
      else if (speedVal === 'instant') this.speedMs = 0;
    }

    notifyUI(liveMetrics = null) {
      if (this.onStateChange) {
        this.onStateChange({
          isPlaying: this.isPlaying,
          currentStep: this.currentStep,
          totalSteps: this.totalSteps(),
          packResult: this.packResult,
          liveMetrics: liveMetrics || this.liveMetrics(),
          comparison: this.comparison,
          selectedScenario: this.selectedScenario,
          selectedAlgorithm: this.selectedAlgorithm,
          selectedContainer: this.selectedContainer,
          cargo: this.cargoCounts(),
          items: this.items || [],
          itemCount: this.items ? this.items.length : 0,
          solving: this.solving,
          compareMode: this.compareMode,
          compareAlgorithm: this.compareAlgorithm,
          compareResult: this.compareResult,
          compareLiveMetrics: this.compareMode ? this.liveMetrics(this.compareResult) : null,
          randomSeed: window.CargoPacker.getRandomSeed ? window.CargoPacker.getRandomSeed() : null
        });
      }
    }
  }

  exports.PackerController = PackerController;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
