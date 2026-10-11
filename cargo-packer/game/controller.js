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
      const entry = this.comparison && this.comparison.results[this.compareAlgorithm];
      this.compareResult = entry ? entry.result : null;
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

    setAlgorithm(algoId) {
      this.pause();
      this.selectedAlgorithm = algoId;
      this.solve();
    }

    rerollRandom() {
      const CP = window.CargoPacker;
      const nextSeed = Math.floor(Math.random() * 89999 + 10000);
      CP.setRandomSeed(nextSeed);
      this.solve();
    }

    solve() {
      const CP = window.CargoPacker;
      const preset = CP.PRESETS[this.selectedScenario];
      const items = preset.getItems();
      const containerSpec = CP.CONTAINERS[this.selectedContainer];

      const startTime = performance.now();
      let result;

      // Run live comparison across all 3 algorithms for head-to-head benchmarking
      this.comparison = CP.compareAlgorithms(items, containerSpec, { minSupportRatio: this.minSupportRatio });

      if (this.comparison && this.comparison.results[this.selectedAlgorithm]) {
        result = this.comparison.results[this.selectedAlgorithm].result;
      } else if (this.selectedAlgorithm === 'wallBuilding') {
        result = CP.packWallBuilding(items, containerSpec, { minSupportRatio: this.minSupportRatio });
      } else if (this.selectedAlgorithm === 'firstFit') {
        result = CP.packFirstFit(items, containerSpec);
      } else {
        result = CP.packExtremePoints(items, containerSpec, { minSupportRatio: this.minSupportRatio });
      }

      result.computeTimeMs = Math.round(performance.now() - startTime);
      this.packResult = result;
      this.pickCompareResult();

      this.reset();
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
