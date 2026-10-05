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

      this.reset();
      this.notifyUI();
    }

    reset() {
      this.pause();
      this.boxRenderer.clear();
      this.visualizers.clear();
      this.currentStep = -1;
      this.notifyUI();
    }

    play() {
      if (this.isPlaying) return;
      if (!this.packResult || this.packResult.steps.length === 0) return;

      if (this.currentStep >= this.packResult.steps.length - 1) {
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
      if (nextStep < this.packResult.steps.length) {
        this.stepForward(true);

        if (this.speedMs === 0) {
          // Instant mode
          while (this.currentStep < this.packResult.steps.length - 1) {
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

    stepForward(animate = true) {
      if (!this.packResult || this.currentStep >= this.packResult.steps.length - 1) return;

      this.currentStep++;
      const step = this.packResult.steps[this.currentStep];

      // Add box to scene
      this.boxRenderer.addBox(step.box, animate);
      this.sound.playThud(step.box.weight);

      // Render updated visualizers
      if (step.candidateEPs) {
        this.visualizers.renderExtremePoints(step.candidateEPs, step.chosenEP);
      }

      // Live Center of Gravity calculation up to current step
      const currentPlaced = this.packResult.steps.slice(0, this.currentStep + 1).map(s => s.box);
      const metrics = window.CargoPacker.computeMetrics(currentPlaced, this.packResult.container);
      this.visualizers.updateCog(metrics.cog, this.packResult.container);

      this.notifyUI(metrics);
    }

    stepBackward() {
      if (this.currentStep < 0) return;
      this.pause();

      const step = this.packResult.steps[this.currentStep];
      this.boxRenderer.removeBox(step.box.id);
      this.sound.playClick();

      this.currentStep--;

      if (this.currentStep >= 0) {
        const prevStep = this.packResult.steps[this.currentStep];
        this.visualizers.renderExtremePoints(prevStep.candidateEPs, prevStep.chosenEP);

        const currentPlaced = this.packResult.steps.slice(0, this.currentStep + 1).map(s => s.box);
        const metrics = window.CargoPacker.computeMetrics(currentPlaced, this.packResult.container);
        this.visualizers.updateCog(metrics.cog, this.packResult.container);
        this.notifyUI(metrics);
      } else {
        this.visualizers.clear();
        this.notifyUI();
      }
    }

    jumpToEnd() {
      this.pause();
      while (this.currentStep < this.packResult.steps.length - 1) {
        this.currentStep++;
        const step = this.packResult.steps[this.currentStep];
        this.boxRenderer.addBox(step.box, false);
      }
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
          totalSteps: this.packResult ? this.packResult.steps.length : 0,
          packResult: this.packResult,
          liveMetrics: liveMetrics || (this.packResult ? this.packResult.metrics : null),
          comparison: this.comparison,
          selectedScenario: this.selectedScenario,
          selectedAlgorithm: this.selectedAlgorithm,
          randomSeed: window.CargoPacker.getRandomSeed ? window.CargoPacker.getRandomSeed() : null
        });
      }
    }
  }

  exports.PackerController = PackerController;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
