/**
 * ui/results.js — the end-of-mission scorecard.
 *
 * Shows the envelope against par, where it landed on the medal track, and
 * whether it beat the player's previous best. Offers a retry, the next mission,
 * or the mission list.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const MEDAL_ICON = { gold: '🥇', silver: '🥈', bronze: '🥉' };
    const MEDAL_NAME = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

    function el(id) { return document.getElementById(id); }

    function volume(v) { return Math.round(v).toLocaleString() + ' m³'; }

    function ResultsUI(app) {
        this.app = app;
        this.panel = el('results-overlay');
        this.nextMission = null;
        this.bind();
    }

    ResultsUI.prototype.bind = function () {
        const self = this;

        el('btn-result-retry').addEventListener('click', function () {
            self.hide();
            if (self.app.modeName === 'mission') self.app.mode.restart();
        });

        el('btn-result-next').addEventListener('click', function () {
            if (!self.nextMission) return;
            self.hide();
            self.app.startMission(self.nextMission);
        });

        el('btn-result-select').addEventListener('click', function () {
            self.hide();
            self.app.setMode('attract');
            self.app.ui.menu.openSelect();
        });
    };

    /**
     * @param {object} result from Scoring.buildResult
     * @param {object} saved from Storage.recordResult
     * @param {object|null} nextMission
     */
    ResultsUI.prototype.show = function (result, saved, nextMission) {
        this.nextMission = nextMission;

        const medal = result.medal;
        el('result-medal').textContent = medal ? MEDAL_ICON[medal] : '📦';
        el('result-verdict').textContent = medal
            ? MEDAL_NAME[medal] + ' — ' + result.missionName
            : 'Shift complete — ' + result.missionName;
        el('result-verdict').className = 'result-verdict ' + (medal ? 'medal-' + medal : 'medal-none');

        const overPar = Math.round((result.ratio - 1) * 100);
        el('result-sub').textContent = overPar <= 0
            ? 'A perfect pack. Nothing wasted.'
            : overPar + '% over par — ' + volume(result.overPar) + ' of air in the envelope.';

        el('result-envelope').textContent = volume(result.envelope);
        el('result-par').textContent = volume(result.par);
        el('result-span').textContent = result.measure.spanX + ' × ' + result.measure.spanZ +
            ' × ' + result.measure.spanTiers + ' slots';
        el('result-efficiency').textContent = Math.round(result.measure.slotEfficiency * 100) + '%';
        el('result-cargo').textContent = Math.round(result.measure.cargoVolume).toLocaleString() + ' m³ · ' +
            result.measure.teu.toFixed(1) + ' TEU';
        el('result-mass').textContent = result.measure.massT.toFixed(1) + ' t';
        el('result-moves').textContent = result.stats.moves + ' placements · ' + result.stats.undos + ' undos';
        el('result-time').textContent = Math.round(result.stats.elapsedMs / 1000) + ' s';

        // Medal thresholds, so a near miss is legible.
        el('result-thresholds').innerHTML = ['gold', 'silver', 'bronze'].map(function (key) {
            const target = result.thresholds[key];
            const hit = result.envelope <= target;
            return '<li class="' + (hit ? 'hit' : 'miss') + '">' +
                '<span>' + MEDAL_ICON[key] + ' ' + MEDAL_NAME[key] + '</span>' +
                '<strong>≤ ' + volume(target) + '</strong></li>';
        }).join('');

        const bestEl = el('result-best');
        if (saved && saved.improved) {
            bestEl.textContent = saved.previousBest
                ? 'New best — ' + volume(saved.previousBest - result.envelope) + ' tighter than before.'
                : 'New best result.';
            bestEl.className = 'result-best improved';
        } else if (saved && saved.record && saved.record.best) {
            bestEl.textContent = 'Your best on this bay is ' + volume(saved.record.best) + '.';
            bestEl.className = 'result-best';
        } else {
            bestEl.textContent = '';
            bestEl.className = 'result-best';
        }

        const nextBtn = el('btn-result-next');
        nextBtn.classList.toggle('hidden', !nextMission);
        if (nextMission) nextBtn.textContent = 'Next: ' + nextMission.name + ' →';

        this.panel.classList.remove('hidden');
    };

    ResultsUI.prototype.hide = function () {
        this.panel.classList.add('hidden');
    };

    Cargo3D.ResultsUI = ResultsUI;
})(window);
