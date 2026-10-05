/**
 * cargo-packer/ui/ui.js
 * Binds UI DOM elements, buttons, HUD metrics, algorithm showdown scoreboard, and radar.
 */
(function(exports) {
  'use strict';

  const ALGO_DESCRIPTIONS = {
    extremePoints: {
      name: 'Extreme Points (EP) Heuristic',
      desc: 'Generates candidate 3D corner coordinates after every placement, projects them against existing surfaces, and picks the tightest fit minimizing wasted space.'
    },
    wallBuilding: {
      name: 'Wall-Building (Back-to-Front)',
      desc: 'Builds vertical transverse slices (walls) across the container width before advancing along the length. Ideal for maritime cargo securing and physical stability.'
    },
    firstFit: {
      name: 'First-Fit Decreasing (Shelf/Slab)',
      desc: 'Sorts cargo by height and constructs horizontal floor shelves. Fast and intuitive baseline, but demonstrates the classic headspace air-void problem.'
    }
  };

  class UIController {
    constructor(controller, sceneManager, containerRenderer, sound) {
      this.controller = controller;
      this.sceneManager = sceneManager;
      this.containerRenderer = containerRenderer;
      this.sound = sound;

      this.initDomReferences();
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
          if (window.innerWidth <= 900) {
            setTimeout(() => this.closeAllDrawers(), 220);
          }
        });
      });

      // 6. Camera View Preset Switcher
      document.querySelectorAll('[data-cam]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          document.querySelectorAll('[data-cam]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
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
      const info = ALGO_DESCRIPTIONS[algoId] || ALGO_DESCRIPTIONS.extremePoints;
      if (this.algoTitleEl) this.algoTitleEl.textContent = info.name;
      if (this.algoDescEl) this.algoDescEl.textContent = info.desc;
    }

    syncContainerButtons(activeContainerId) {
      document.querySelectorAll('[data-container]').forEach(b => {
        b.classList.toggle('active', b.dataset.container === activeContainerId);
      });
    }

    renderState(state) {
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

        if (this.showdownWinnerBadgeEl && comp.winner) {
          const diff = comp.ranking.length > 1
            ? (comp.ranking[0].volumeUtilization - comp.ranking[1].volumeUtilization).toFixed(1)
            : '0.0';
          this.showdownWinnerBadgeEl.textContent = `🏆 ${comp.winner.shortName} (+${diff}%)`;
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
                  <span class="showdown-medal">${medals[i] || '•'}</span>
                  <span>${r.shortName}</span>
                </span>
                <span class="showdown-val">${r.volumeUtilization}% <span style="font-size:0.68rem; font-weight:normal; color:var(--text-secondary);">(${r.placedCount} pkd)</span></span>
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
