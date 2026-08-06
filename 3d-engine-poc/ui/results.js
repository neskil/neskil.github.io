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

        const sprawl = result.scoreMode === 'sprawl';
        const overPar = Math.round((result.ratio - 1) * 100);
        const shortfall = Math.round((1 - result.ratio) * 100);

        if (sprawl) {
            el('result-sub').textContent = shortfall <= 0
                ? 'Filled the bay completely.'
                : shortfall + '% short of the bay — ' + volume(-result.overPar) + ' left unclaimed.';
        } else {
            el('result-sub').textContent = overPar <= 0
                ? 'A perfect pack. Nothing wasted.'
                : overPar + '% over par — ' + volume(result.overPar) + ' of air in the envelope.';
        }

        el('result-envelope').textContent = volume(result.envelope);
        el('result-par').textContent = volume(result.par);
        el('result-par-label').textContent = sprawl ? 'Bay volume' : 'Par';
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
            const hit = sprawl ? result.envelope >= target : result.envelope <= target;
            return '<li class="' + (hit ? 'hit' : 'miss') + '">' +
                '<span>' + MEDAL_ICON[key] + ' ' + MEDAL_NAME[key] + '</span>' +
                '<strong>' + (sprawl ? '≥ ' : '≤ ') + volume(target) + '</strong></li>';
        }).join('');

        const bestEl = el('result-best');
        if (saved && saved.improved) {
            bestEl.textContent = saved.previousBest
                ? 'New best — ' + volume(Math.abs(result.envelope - saved.previousBest)) +
                  (sprawl ? ' bigger than before.' : ' tighter than before.')
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

    /* ── tower challenge scorecard ─────────────────────────────────────── */

    function metres(v) { return (Math.round(v * 10) / 10).toFixed(1) + ' m'; }

    /**
     * The physics tower's end-of-run card. There is no par and no medal here —
     * the only measure is how high it stood before it came down.
     */
    function TowerResultUI(app) {
        this.app = app;
        this.panel = el('tower-overlay');
        this.bind();
    }

    TowerResultUI.prototype.bind = function () {
        const self = this;

        el('btn-tower-retry').addEventListener('click', function () {
            self.hide();
            if (self.app.modeName === 'physics') self.app.mode.restartRun();
        });

        el('btn-tower-free').addEventListener('click', function () {
            self.hide();
            if (self.app.modeName === 'physics') self.app.mode.setChallenge('freeplay');
        });

        el('btn-tower-menu').addEventListener('click', function () {
            self.hide();
            self.app.goToMenu();
        });
    };

    /**
     * @param {{height:number, units:number, reason:string, best:number,
     *          previousBest:number, improved:boolean, runs:number}} result
     */
    TowerResultUI.prototype.show = function (result) {
        el('tower-icon').textContent = result.improved ? '🏆' : '🏗️';
        el('tower-verdict').textContent = result.improved
            ? 'A new record — ' + metres(result.height)
            : 'The tower came down';
        el('tower-verdict').className = 'result-verdict ' +
            (result.improved ? 'medal-gold' : 'medal-none');

        el('tower-sub').textContent = result.height > 0
            ? result.reason + ' It stood at ' + metres(result.height) + '.'
            : result.reason + ' Nothing had settled yet.';

        el('tower-height').textContent = metres(result.height);
        el('tower-best').textContent = metres(result.best);
        el('tower-units').textContent = result.units;
        el('tower-runs').textContent = result.runs;

        const record = el('tower-record');
        if (result.improved && result.previousBest > 0) {
            record.textContent = metres(result.height - result.previousBest) + ' higher than your old best.';
            record.className = 'result-best improved';
        } else if (result.improved) {
            record.textContent = 'Your first tower on the board.';
            record.className = 'result-best improved';
        } else if (result.best > 0) {
            record.textContent = 'Your best still stands at ' + metres(result.best) + '.';
            record.className = 'result-best';
        } else {
            record.textContent = '';
            record.className = 'result-best';
        }

        this.panel.classList.remove('hidden');
    };

    TowerResultUI.prototype.hide = function () {
        this.panel.classList.add('hidden');
    };

    Cargo3D.ResultsUI = ResultsUI;
    Cargo3D.TowerResultUI = TowerResultUI;
})(window);
