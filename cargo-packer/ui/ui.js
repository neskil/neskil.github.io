/**
 * cargo-packer/ui/ui.js
 * Binds UI DOM elements, buttons, HUD metrics, algorithm showdown scoreboard, and radar.
 */
(function(exports) {
  'use strict';

  const QUALITY_TAGS = { good: 'Good', baseline: 'Baseline', bad: 'Bad' };

  class UIController {
    constructor(controller, sceneManager, containerRenderer, sound) {
      this.controller = controller;
      this.sceneManager = sceneManager;
      this.containerRenderer = containerRenderer;
      this.sound = sound;

      this.initDomReferences();
      this.buildAlgorithmControls();
      this.bindEvents();
    }

    initDomReferences() {
      // Metrics
      this.fillPercentEl = document.getElementById('metric-fill-pct');
      this.fillBarEl = document.getElementById('metric-fill-bar');
      this.volumeDetailEl = document.getElementById('metric-vol-detail');

      this.weightValueEl = document.getElementById('metric-weight-val');
      this.weightBarEl = document.getElementById('metric-weight-bar');
      this.weightDetailEl = document.getElementById('metric-weight-detail');

      // CoG Radar
      this.cogBlipEl = document.getElementById('cog-blip');
      this.cogStatusEl = document.getElementById('cog-status');
      this.cogLatEl = document.getElementById('cog-lat-offset');
      this.cogLongEl = document.getElementById('cog-long-offset');

      // Playback
      this.playBtn = document.getElementById('btn-play');
      this.playIcon = document.getElementById('icon-play');
      this.pauseIcon = document.getElementById('icon-pause');
      this.stepFwdBtn = document.getElementById('btn-step-fwd');
      this.stepBackBtn = document.getElementById('btn-step-back');
      this.resetBtn = document.getElementById('btn-reset');
      this.jumpEndBtn = document.getElementById('btn-jump-end');

      this.progressTextEl = document.getElementById('progress-text');
      this.progressFillEl = document.getElementById('progress-fill');

      // Showdown Scoreboard
      this.showdownCardEl = document.getElementById('showdown-card');
      this.showdownWinnerBadgeEl = document.getElementById('showdown-winner-badge');
      this.showdownListEl = document.getElementById('showdown-list');
      this.showdownInsightEl = document.getElementById('showdown-insight');
      // Drawer Controls (Mobile)
      this.leftDrawerEl = document.getElementById('left-drawer');
      this.rightHudEl = document.getElementById('right-hud');
      this.btnToggleLeft = document.getElementById('btn-toggle-left');
      this.btnToggleRight = document.getElementById('btn-toggle-right');
      this.btnCloseLeft = document.getElementById('btn-close-left');
      this.btnCloseRight = document.getElementById('btn-close-right');
      this.drawerBackdropEl = document.getElementById('drawer-backdrop');

      // Explainer
      this.algoTitleEl = document.getElementById('algo-title');
      this.algoDescEl = document.getElementById('algo-desc');

      // Side-by-side compare
      this.topBarEl = document.querySelector('header.top-bar');
      this.playbackBarEl = document.querySelector('nav.playback-bar');
      this.compareBtn = document.getElementById('btn-compare');
      this.showdownCompareBtn = document.getElementById('btn-showdown-compare');
      this.compareOverlayEl = document.getElementById('compare-overlay');
      this.compareDividerEl = document.getElementById('compare-divider');
      this.comparePaneEls = [...document.querySelectorAll('.compare-pane')];
      this.compareSelectEls = [...document.querySelectorAll('[data-pane-algo]')];
      this.compareStatsEls = [...document.querySelectorAll('[data-pane-stats]')];
      this.compareTrophyEls = [...document.querySelectorAll('[data-pane-trophy]')];
      this.activeCam = 'isometric';
      this.fullscreenBtn = document.getElementById('btn-fullscreen');

      // Cargo editor
      this.cargoRowsEl = document.getElementById('cargo-rows');
      this.cargoSummaryEl = document.getElementById('cargo-summary');
      this.cargoSig = null;
      this.cargoTimer = null;
    }

    /** Algorithm chips and compare-pane options, from the one registry. */
    buildAlgorithmControls() {
      const algos = window.CargoPacker.ALGORITHMS;
      const chips = document.getElementById('algo-chips');
      if (chips) {
        chips.innerHTML = algos.map(a => `
          <button type="button" class="chip-btn" data-algo="${a.id}">
            <strong>${a.name}<span class="quality-tag quality-${a.quality}">${QUALITY_TAGS[a.quality]}</span></strong>
            <span class="chip-desc">${a.blurb}</span>
          </button>`).join('');
      }
      this.compareSelectEls.forEach(sel => {
        sel.innerHTML = algos.map(a => `<option value="${a.id}">${a.shortName}</option>`).join('');
      });
    }

    bindEvents() {
      // 1. Playback Controls
      this.playBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.controller.togglePlay();
      });

      this.stepFwdBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.controller.stepForward(true);
      });

      this.stepBackBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.controller.stepBackward();
      });

      this.resetBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.controller.reset();
      });

      this.jumpEndBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.controller.jumpToEnd();
      });

      // 2. Speed Switcher
      document.querySelectorAll('[data-speed]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          document.querySelectorAll('[data-speed]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.controller.setSpeed(btn.dataset.speed);
        });
      });

      // 3. Scenario Selector
      document.querySelectorAll('[data-scenario]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          document.querySelectorAll('[data-scenario]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.controller.loadScenario(btn.dataset.scenario);
          this.syncContainerButtons(this.controller.selectedContainer);
          this.syncCamButtons('isometric');
          if (window.innerWidth <= 900) {
            setTimeout(() => this.closeAllDrawers(), 220);
          }
        });
      });

      // 4. Algorithm Selector
      document.querySelectorAll('[data-algo]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          this.selectAlgorithm(btn.dataset.algo);
        });
      });

      // 5. Container Selector
      document.querySelectorAll('[data-container]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          document.querySelectorAll('[data-container]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.controller.setContainer(btn.dataset.container);
          this.syncCamButtons('isometric');
          if (window.innerWidth <= 900) {
            setTimeout(() => this.closeAllDrawers(), 220);
          }
        });
      });

      // 6. Camera View Preset Switcher
      document.querySelectorAll('[data-cam]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          this.syncCamButtons(btn.dataset.cam);
          const spec = window.CargoPacker.CONTAINERS[this.controller.selectedContainer];
          this.sceneManager.setCameraPreset(btn.dataset.cam, spec);
        });
      });

      // 7. Cutaway / View Mode Switcher
      document.querySelectorAll('[data-viewmode]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          document.querySelectorAll('[data-viewmode]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.containerRenderer.setViewMode(btn.dataset.viewmode);
        });
      });

      // 8. Random Seed Reroll Button
      this.rerollSeedBtn = document.getElementById('btn-reroll-seed');
      if (this.rerollSeedBtn) {
        this.rerollSeedBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sound.playClick();
          this.controller.rerollRandom();
        });
      }

      // 9. Mobile Drawer Toggles & Close Buttons
      if (this.btnToggleLeft) {
        this.btnToggleLeft.addEventListener('click', () => {
          this.sound.playClick();
          this.toggleLeftDrawer();
        });
      }

      if (this.btnToggleRight) {
        this.btnToggleRight.addEventListener('click', () => {
          this.sound.playClick();
          this.toggleRightHud();
        });
      }

      if (this.btnCloseLeft) {
        this.btnCloseLeft.addEventListener('click', () => {
          this.sound.playClick();
          this.toggleLeftDrawer(false);
        });
      }

      if (this.btnCloseRight) {
        this.btnCloseRight.addEventListener('click', () => {
          this.sound.playClick();
          this.toggleRightHud(false);
        });
      }

      if (this.drawerBackdropEl) {
        this.drawerBackdropEl.addEventListener('click', () => {
          this.closeAllDrawers();
        });
      }

      // 10. Sound Mute Toggle
      const muteBtn = document.getElementById('btn-mute');
      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          const isMuted = this.sound.toggleMute();
          muteBtn.classList.toggle('active', isMuted);
          const iconMute = document.getElementById('icon-sound-mute');
          const iconOn = document.getElementById('icon-sound-on');
          if (iconMute && iconOn) {
            iconMute.style.display = isMuted ? 'block' : 'none';
            iconOn.style.display = isMuted ? 'none' : 'block';
          }
        });
      }

      // 11. Side-by-side compare
      if (this.compareBtn) {
        this.compareBtn.addEventListener('click', () => {
          this.sound.playClick();
          this.setCompare(!this.controller.compareMode);
        });
      }

      if (this.showdownCompareBtn) {
        this.showdownCompareBtn.addEventListener('click', () => {
          this.sound.playClick();
          const ranking = this.controller.comparison ? this.controller.comparison.ranking : [];
          if (ranking.length < 2) return;
          if (this.controller.selectedAlgorithm !== ranking[0].id) this.selectAlgorithm(ranking[0].id);
          this.setCompare(true, ranking[1].id);
          this.closeAllDrawers();
          this.controller.play();
        });
      }

      this.compareSelectEls.forEach((sel, i) => {
        sel.addEventListener('change', () => {
          this.sound.playClick();
          if (i === 0) this.selectAlgorithm(sel.value);
          else this.controller.setCompareAlgorithm(sel.value);
        });
      });

      window.addEventListener('resize', () => {
        if (this.controller.compareMode) this.layoutPanes();
      });

      // 12. Fullscreen: the browser's fullscreen plus the side panels tucked
      //     away, so the container gets the whole screen.
      const root = document.documentElement;
      const canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen);
      if (this.fullscreenBtn && canFullscreen) {
        this.fullscreenBtn.hidden = false;
        this.fullscreenBtn.addEventListener('click', () => {
          this.sound.playClick();
          this.toggleFullscreen();
        });
        const sync = () => this.setImmersive(!!(document.fullscreenElement || document.webkitFullscreenElement));
        document.addEventListener('fullscreenchange', sync);
        document.addEventListener('webkitfullscreenchange', sync);
      }

      // 13. Cargo editor. Edits update the numbers at once and repack after a
      //     short pause, so a run of + clicks costs one solve, not ten.
      if (this.cargoRowsEl) {
        this.cargoRowsEl.addEventListener('click', e => {
          const btn = e.target.closest('[data-cargo-step]');
          if (!btn) return;
          const input = this.cargoRowsEl.querySelector(`[data-cargo-input="${btn.dataset.key}"]`);
          input.value = Math.max(+input.min, Math.min(+input.max, (+input.value || 0) + (+btn.dataset.cargoStep)));
          this.sound.playClick();
          this.queueCargoCommit();
        });
        this.cargoRowsEl.addEventListener('change', e => {
          if (e.target.matches('[data-cargo-input]')) this.queueCargoCommit(0);
        });
      }
      document.querySelectorAll('[data-cargo-scale]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          const f = +btn.dataset.cargoScale;
          this.cargoRowsEl.querySelectorAll('[data-cargo-input]').forEach(input => {
            const old = +input.value || 0;
            const v = Math.round(old * f);
            // Halving never empties a type; doubling never brings one back
            input.value = old === 0 ? 0 : Math.max(1, Math.min(+input.max, v));
          });
          this.queueCargoCommit(0);
        });
      });
      const resetBtn = document.getElementById('btn-cargo-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.sound.playClick();
          this.runSolve(() => this.controller.resetCargo());
        });
      }

      // Controller state change callback
      this.controller.onStateChange = (state) => this.renderState(state);
    }

    toggleLeftDrawer(forceState) {
      if (!this.leftDrawerEl) return;
      const isOpen = forceState !== undefined ? forceState : !this.leftDrawerEl.classList.contains('open');
      this.leftDrawerEl.classList.toggle('open', isOpen);
      if (isOpen && this.rightHudEl) {
        this.rightHudEl.classList.remove('open');
        if (this.btnToggleRight) this.btnToggleRight.classList.remove('active');
      }
      if (this.btnToggleLeft) this.btnToggleLeft.classList.toggle('active', isOpen);
      this.updateBackdrop();
    }

    toggleRightHud(forceState) {
      if (!this.rightHudEl) return;
      const isOpen = forceState !== undefined ? forceState : !this.rightHudEl.classList.contains('open');
      this.rightHudEl.classList.toggle('open', isOpen);
      if (isOpen && this.leftDrawerEl) {
        this.leftDrawerEl.classList.remove('open');
        if (this.btnToggleLeft) this.btnToggleLeft.classList.remove('active');
      }
      if (this.btnToggleRight) this.btnToggleRight.classList.toggle('active', isOpen);
      this.updateBackdrop();
    }

    closeAllDrawers() {
      if (this.leftDrawerEl) this.leftDrawerEl.classList.remove('open');
      if (this.rightHudEl) this.rightHudEl.classList.remove('open');
      if (this.btnToggleLeft) this.btnToggleLeft.classList.remove('active');
      if (this.btnToggleRight) this.btnToggleRight.classList.remove('active');
      this.updateBackdrop();
    }

    updateBackdrop() {
      const anyOpen = (this.leftDrawerEl && this.leftDrawerEl.classList.contains('open')) ||
                      (this.rightHudEl && this.rightHudEl.classList.contains('open'));
      if (this.drawerBackdropEl) {
        this.drawerBackdropEl.classList.toggle('active', anyOpen);
      }
    }

    selectAlgorithm(algoId) {
      document.querySelectorAll('[data-algo]').forEach(b => {
        b.classList.toggle('active', b.dataset.algo === algoId);
      });
      this.controller.setAlgorithm(algoId);
      this.updateAlgoExplainer(algoId);
      if (window.innerWidth <= 900) {
        setTimeout(() => this.closeAllDrawers(), 220);
      }
    }

    updateAlgoExplainer(algoId) {
      const CP = window.CargoPacker;
      const info = CP.getAlgorithm(algoId) || CP.ALGORITHMS[0];
      if (this.algoTitleEl) this.algoTitleEl.textContent = info.name;
      if (this.algoDescEl) this.algoDescEl.textContent = info.explainer;
    }

    syncContainerButtons(activeContainerId) {
      document.querySelectorAll('[data-container]').forEach(b => {
        b.classList.toggle('active', b.dataset.container === activeContainerId);
      });
    }

    /** Repack after the user pauses editing; `delay` 0 for one-shot edits. */
    queueCargoCommit(delay = 350) {
      clearTimeout(this.cargoTimer);
      if (this.cargoSummaryEl) this.cargoSummaryEl.textContent = 'Repacking…';
      this.cargoTimer = setTimeout(() => {
        const cargo = this.controller.cargoCounts();
        this.cargoRowsEl.querySelectorAll('[data-cargo-input]').forEach(input => {
          const v = +input.value || 0;
          if (cargo.counts) cargo.counts[input.dataset.cargoInput] = v;
          else cargo.count = v;
        });
        this.runSolve(() => this.controller.setCargo(cargo));
      }, delay);
    }

    /** A solve blocks for up to a second on big loads: let "Repacking…" paint first. */
    runSolve(fn) {
      if (this.cargoSummaryEl) this.cargoSummaryEl.textContent = 'Repacking…';
      requestAnimationFrame(() => setTimeout(fn, 0));
    }

    /**
     * Rows for the current scenario's cargo: one per box type with a
     * stepper, or a single count for the random scenario. Rebuilt only when
     * the scenario or the counts change, not on every playback step.
     */
    renderCargoEditor(state) {
      const CP = window.CargoPacker;
      const preset = CP.PRESETS[state.selectedScenario];
      if (!preset || !this.cargoRowsEl) return;

      const sig = JSON.stringify([state.selectedScenario, state.cargo, state.randomSeed, state.itemCount]);
      if (sig === this.cargoSig) return;
      this.cargoSig = sig;

      const fmt = v => (+v.toFixed(2)).toString();
      const stepper = (key, value, max, label, step = 1) => `
        <div class="stepper">
          <button type="button" class="stepper-btn" data-cargo-step="-${step}" data-key="${key}" aria-label="Fewer ${label}">&minus;</button>
          <input type="number" inputmode="numeric" min="0" max="${max}" value="${value}" data-cargo-input="${key}" aria-label="${label}">
          <button type="button" class="stepper-btn" data-cargo-step="${step}" data-key="${key}" aria-label="More ${label}">+</button>
        </div>`;

      if (preset.isRandom) {
        this.cargoRowsEl.innerHTML = `
          <div class="cargo-row">
            <span class="cargo-swatch cargo-swatch-mixed"></span>
            <div class="cargo-info"><strong>Random items</strong><span>New sizes on every 🎲 roll</span></div>
            ${stepper('count', state.cargo.count, preset.maxCount, 'random items', 5)}
          </div>`;
      } else {
        this.cargoRowsEl.innerHTML = preset.types.map(t => {
          const color = t.opts.color || (t.opts.colors && t.opts.colors[0]) || '#94a3b8';
          return `
            <div class="cargo-row">
              <span class="cargo-swatch" style="background:${color}"></span>
              <div class="cargo-info">
                <strong>${t.name}</strong>
                <span>${fmt(t.w)}×${fmt(t.h)}×${fmt(t.d)} m · ${t.weight} kg</span>
              </div>
              ${stepper(t.key, state.cargo.counts[t.key], CP.MAX_PER_TYPE, t.name)}
            </div>`;
        }).join('');
      }

      // Summary of what is on the manifest (not what fits)
      const items = state.packResult ? state.packResult.placed.concat(state.packResult.unplaced) : [];
      const kg = items.reduce((a, b) => a + (b.weight || 0), 0);
      const m3 = items.reduce((a, b) => a + b.w * b.h * b.d, 0);
      const limit = preset.isRandom ? '' : ` · max ${CP.PackerController.MAX_ITEMS}`;
      if (this.cargoSummaryEl) {
        this.cargoSummaryEl.textContent = `${items.length} items · ${Math.round(kg).toLocaleString()} kg · ${m3.toFixed(1)} m³${limit}`;
      }

      // The scenario chip says how many items the load now has
      document.querySelectorAll('[data-scenario]').forEach(btn => {
        const p = CP.PRESETS[btn.dataset.scenario];
        const desc = btn.querySelector('.chip-desc');
        if (!p || !desc) return;
        const edit = this.controller.cargo[p.id];
        const n = btn.dataset.scenario === state.selectedScenario ? items.length
          : p.isRandom ? (edit && edit.count !== undefined ? edit.count : p.defaultCount)
          : p.types.reduce((a, t) => a + (edit && edit.counts && edit.counts[t.key] !== undefined ? edit.counts[t.key] : t.count), 0);
        desc.textContent = p.blurb(n);
      });
    }

    toggleFullscreen() {
      const doc = document;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
      } else {
        const root = doc.documentElement;
        const req = root.requestFullscreen || root.webkitRequestFullscreen;
        const p = req.call(root, { navigationUI: 'hide' });
        // Refused (no user gesture, iframe without permission): stay as we are
        if (p && p.catch) p.catch(() => this.setImmersive(false));
      }
    }

    setImmersive(on) {
      document.body.classList.toggle('immersive', on);
      this.closeAllDrawers();
      if (this.fullscreenBtn) {
        this.fullscreenBtn.classList.toggle('active', on);
        this.fullscreenBtn.setAttribute('aria-pressed', String(on));
        this.fullscreenBtn.title = on ? 'Exit fullscreen' : 'Fullscreen';
        document.getElementById('icon-fs-enter').style.display = on ? 'none' : 'block';
        document.getElementById('icon-fs-exit').style.display = on ? 'block' : 'none';
      }
      // Panels just appeared or vanished: refit the compare panes next frame
      requestAnimationFrame(() => {
        if (this.controller.compareMode) this.layoutPanes();
      });
    }

    /**
     * Turns side-by-side compare on or off.
     * @param {boolean} on
     * @param {string|null} algoId What the second view shows; defaults to the
     *   best-ranked algorithm that is not already in the first view.
     */
    setCompare(on, algoId = null) {
      const c = this.controller;
      if (on) {
        const CP = window.CargoPacker;
        let pick = CP.getAlgorithm(algoId) ? algoId : null;
        if (!pick) {
          const ranking = c.comparison ? c.comparison.ranking.map(r => r.id) : CP.ALGORITHMS.map(a => a.id);
          pick = ranking.find(id => id !== c.selectedAlgorithm);
        }
        c.compareAlgorithm = pick;
        c.setCompareMode(true);
        this.compareOverlayEl.hidden = false;
        this.layoutPanes();
      } else {
        c.setCompareMode(false);
        this.compareOverlayEl.hidden = true;
        this.sceneManager.setPanes(null);
      }
      // The view's shape changed, so reframe the current camera preset for it
      this.sceneManager.setCameraPreset(this.activeCam, window.CargoPacker.CONTAINERS[c.selectedContainer]);
    }

    /**
     * Fits the two panes into the space the panels leave free: side by side
     * when it is wide, one above the other when it is tall.
     */
    layoutPanes() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      let left = 0;
      let right = W;
      // Above the drawer breakpoint the side panels are always open, so the
      // panes go between them rather than underneath.
      if (W > 900) {
        const l = this.leftDrawerEl.getBoundingClientRect();
        const r = this.rightHudEl.getBoundingClientRect();
        if (l.width > 0) left = l.right;   // a hidden panel (fullscreen) measures 0
        if (r.width > 0) right = r.left;
      }
      const top = this.topBarEl ? this.topBarEl.getBoundingClientRect().bottom : 56;
      const bottom = this.playbackBarEl ? this.playbackBarEl.getBoundingClientRect().top : H - 84;

      const pad = 8;
      const gap = 6;
      const stage = { x: left + pad, y: top + pad, w: right - left - pad * 2, h: bottom - top - pad * 2 };
      const sideBySide = stage.w >= stage.h * 0.9;
      const panes = sideBySide
        ? [0, 1].map(i => ({ x: stage.x + i * (stage.w + gap) / 2, y: stage.y, w: (stage.w - gap) / 2, h: stage.h }))
        : [0, 1].map(i => ({ x: stage.x, y: stage.y + i * (stage.h + gap) / 2, w: stage.w, h: (stage.h - gap) / 2 }));
      panes.forEach(p => {
        p.x = Math.round(p.x); p.y = Math.round(p.y);
        p.w = Math.max(1, Math.round(p.w)); p.h = Math.max(1, Math.round(p.h));
      });

      this.sceneManager.setPanes(panes);

      this.comparePaneEls.forEach((el, i) => {
        const p = panes[i];
        Object.assign(el.style, { left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, height: `${p.h}px` });
      });
      const d = this.compareDividerEl.style;
      if (sideBySide) {
        Object.assign(d, { left: `${panes[1].x - gap / 2 - 1}px`, top: `${stage.y}px`, width: '2px', height: `${stage.h}px` });
      } else {
        Object.assign(d, { left: `${stage.x}px`, top: `${panes[1].y - gap / 2 - 1}px`, width: `${stage.w}px`, height: '2px' });
      }
    }

    renderComparePanes(state) {
      const compareOn = !!state.compareMode;
      if (this.compareBtn) {
        this.compareBtn.classList.toggle('active', compareOn);
        this.compareBtn.setAttribute('aria-pressed', String(compareOn));
      }
      if (!compareOn || !state.comparison) return;

      const winnerId = state.comparison.winner ? state.comparison.winner.id : null;
      const sides = [
        { id: state.selectedAlgorithm, result: state.packResult, metrics: state.liveMetrics },
        { id: state.compareAlgorithm, result: state.compareResult, metrics: state.compareLiveMetrics }
      ];
      sides.forEach((side, i) => {
        const summary = state.comparison.results[side.id];
        if (!summary || !side.result) return;
        if (this.compareSelectEls[i].value !== side.id) this.compareSelectEls[i].value = side.id;
        this.compareTrophyEls[i].hidden = side.id !== winnerId;

        const steps = side.result.steps.length;
        const loaded = Math.min(state.currentStep + 1, steps);
        const fill = side.metrics ? side.metrics.volumeUtilization : 0;
        let text = `${fill}% fill · ${loaded}/${summary.totalCount} boxes`;
        if (loaded >= steps) text += ` · ${summary.extentLabel}`;
        this.compareStatsEls[i].textContent = text;
      });
    }

    syncCamButtons(cam) {
      this.activeCam = cam;
      document.querySelectorAll('[data-cam]').forEach(b => {
        b.classList.toggle('active', b.dataset.cam === cam);
      });
    }

    renderState(state) {
      // 0. Selection chips follow the controller, so deep links (?scenario=,
      //    ?algo=) and showdown-row clicks highlight what is actually loaded.
      document.querySelectorAll('[data-scenario]').forEach(b => {
        b.classList.toggle('active', b.dataset.scenario === state.selectedScenario);
      });
      document.querySelectorAll('[data-algo]').forEach(b => {
        b.classList.toggle('active', b.dataset.algo === state.selectedAlgorithm);
      });
      this.syncContainerButtons(state.selectedContainer);
      this.updateAlgoExplainer(state.selectedAlgorithm);
      this.renderComparePanes(state);
      this.renderCargoEditor(state);

      // 1. Play/Pause button icons
      if (this.playIcon && this.pauseIcon) {
        this.playIcon.style.display = state.isPlaying ? 'none' : 'block';
        this.pauseIcon.style.display = state.isPlaying ? 'block' : 'none';
      }

      // 2. Progress bar & step text
      const current = Math.max(0, state.currentStep + 1);
      const total = state.totalSteps;
      const pct = total > 0 ? (current / total) * 100 : 0;

      if (this.progressTextEl) {
        this.progressTextEl.textContent = `Box ${current} of ${total}`;
      }
      if (this.progressFillEl) {
        this.progressFillEl.style.width = `${pct}%`;
      }

      // 3. Random scenario seed button visibility
      if (this.rerollSeedBtn) {
        if (state.selectedScenario === 'random') {
          this.rerollSeedBtn.style.display = 'inline-flex';
          this.rerollSeedBtn.textContent = `🎲 Roll (#${state.randomSeed || 'RND'})`;
        } else {
          this.rerollSeedBtn.style.display = 'none';
        }
      }

      // 4. Algorithm Showdown Scoreboard
      if (state.comparison && this.showdownListEl) {
        const comp = state.comparison;
        const medals = ['🥇', '🥈', '🥉'];
        const rankMark = i => medals[i] || `<span class="showdown-rank">${i + 1}</span>`;

        if (this.showdownWinnerBadgeEl && comp.winner) {
          this.showdownWinnerBadgeEl.textContent = `🏆 ${comp.winner.shortName}`;
          this.showdownWinnerBadgeEl.title = `${comp.winner.name}: ${comp.lead}`;
        }

        // Render ranking rows
        let html = '';
        for (let i = 0; i < comp.ranking.length; i++) {
          const r = comp.ranking[i];
          const isCurrent = r.id === state.selectedAlgorithm;
          const isWinner = i === 0;

          html += `
            <div class="showdown-row ${isCurrent ? 'active' : ''}" data-showdown-algo="${r.id}" title="Click to view ${r.name} packing in 3D">
              <div class="showdown-row-header">
                <span class="showdown-name">
                  <span class="showdown-medal">${rankMark(i)}</span>
                  <span>${r.shortName}</span>
                </span>
                <span class="showdown-val">${r.volumeUtilization}%</span>
              </div>
              <div class="showdown-sub">
                <span><span class="cog-dot cog-${r.cogStatus}" title="Centre of gravity: ${r.cogStatus}"></span>${r.placedCount}/${r.totalCount} loaded</span>
                <span>${r.extentLabel}</span>
              </div>
              <div class="showdown-bar-bg">
                <div class="showdown-bar-fill ${isWinner ? 'winner-bar' : ''}" style="width: ${r.volumeUtilization}%;"></div>
              </div>
            </div>
          `;
        }
        this.showdownListEl.innerHTML = html;

        // Bind click on rows to switch algorithm
        this.showdownListEl.querySelectorAll('[data-showdown-algo]').forEach(row => {
          row.addEventListener('click', () => {
            const algoId = row.dataset.showdownAlgo;
            this.sound.playClick();
            this.selectAlgorithm(algoId);
          });
        });

        // Showdown insight
        if (this.showdownInsightEl) {
          this.showdownInsightEl.textContent = comp.insight;
        }
      }

      // 5. Metrics HUD
      const m = state.liveMetrics;
      if (m) {
        if (this.fillPercentEl) this.fillPercentEl.textContent = `${m.volumeUtilization}%`;
        if (this.fillBarEl) this.fillBarEl.style.width = `${m.volumeUtilization}%`;
        if (this.volumeDetailEl) this.volumeDetailEl.textContent = `${m.cargoVolume} m³ / ${m.containerVolume} m³`;

        if (this.weightValueEl) this.weightValueEl.textContent = `${m.cargoWeight.toLocaleString()} kg`;
        if (this.weightBarEl) this.weightBarEl.style.width = `${Math.min(100, m.weightUtilization)}%`;
        if (this.weightDetailEl) this.weightDetailEl.textContent = `${m.weightUtilization}% of ${m.maxPayload.toLocaleString()} kg max`;

        // CoG Radar Position
        if (this.cogBlipEl && m.cog) {
          const cont = state.packResult.container;
          const leftPct = Math.max(5, Math.min(95, (m.cog.x / cont.width) * 100));
          const topPct = Math.max(5, Math.min(95, (m.cog.z / cont.length) * 100));

          this.cogBlipEl.style.left = `${leftPct}%`;
          this.cogBlipEl.style.top = `${topPct}%`;

          // Color by status
          if (m.cog.status === 'optimal') {
            this.cogBlipEl.style.background = '#10b981';
            this.cogStatusEl.className = 'status-badge status-optimal';
            this.cogStatusEl.textContent = 'Optimal Balance';
          } else if (m.cog.status === 'acceptable') {
            this.cogBlipEl.style.background = '#f59e0b';
            this.cogStatusEl.className = 'status-badge status-acceptable';
            this.cogStatusEl.textContent = 'Acceptable';
          } else {
            this.cogBlipEl.style.background = '#ef4444';
            this.cogStatusEl.className = 'status-badge status-hazard';
            this.cogStatusEl.textContent = 'Imbalance Hazard';
          }

          if (this.cogLatEl) this.cogLatEl.textContent = `Lateral: ${m.cog.latOffsetPercent > 0 ? '+' : ''}${m.cog.latOffsetPercent}%`;
          if (this.cogLongEl) this.cogLongEl.textContent = `Long.: ${m.cog.longOffsetPercent > 0 ? '+' : ''}${m.cog.longOffsetPercent}%`;
        }
      }
    }
  }

  exports.UIController = UIController;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
