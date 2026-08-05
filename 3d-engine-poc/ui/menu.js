/**
 * ui/menu.js — main menu, mission select, how-to and pause.
 *
 * Mission cards are generated from missions/campaign.js and core/storage.js, so
 * adding a mission to the campaign array is all it takes to get a card.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;
    const Storage = Cargo3D.Storage;
    const Campaign = Cargo3D.Campaign;
    const Scoring = Cargo3D.Scoring;
    const MEDAL_ICON = { gold: '🥇', silver: '🥈', bronze: '🥉' };

    function el(id) { return document.getElementById(id); }

    function MenuUI(app) {
        this.app = app;
        this.panels = {
            main: el('menu-overlay'),
            select: el('select-overlay'),
            howto: el('howto-overlay'),
            pause: el('pause-overlay')
        };
        this.bind();
    }

    MenuUI.prototype.bind = function () {
        const self = this;
        const app = this.app;

        el('btn-campaign').addEventListener('click', function () { self.openSelect(); });
        el('btn-sandbox').addEventListener('click', function () { app.startSandbox(); });
        if (el('btn-physics')) el('btn-physics').addEventListener('click', function () { app.startPhysics('freeplay'); });
        if (el('btn-tower')) el('btn-tower').addEventListener('click', function () { app.startPhysics('tower'); });
        el('btn-howto').addEventListener('click', function () { self.open('howto'); });
        el('btn-howto-close').addEventListener('click', function () { self.closeTop(); });
        el('btn-select-close').addEventListener('click', function () { self.openMain(); });

        el('btn-resume').addEventListener('click', function () { self.close('pause'); });
        el('btn-restart').addEventListener('click', function () {
            self.close('pause');
            if (app.modeName === 'mission') app.mode.restart();
        });
        el('btn-to-select').addEventListener('click', function () {
            self.close('pause');
            app.setMode('attract');
            self.openSelect();
        });
        el('btn-to-menu').addEventListener('click', function () {
            self.close('pause');
            app.goToMenu();
        });

        el('btn-reset-progress').addEventListener('click', function () {
            if (!window.confirm('Erase every medal and best result?')) return;
            Storage.resetProgress();
            self.renderSelect();
            self.renderProgress();
        });

        // Backdrop clicks close the pause and how-to panels only; the main menu
        // and mission select always need an explicit choice.
        ['pause', 'howto'].forEach(function (key) {
            self.panels[key].addEventListener('click', function (e) {
                if (e.target === self.panels[key]) self.close(key);
            });
        });
    };

    MenuUI.prototype.open = function (key) {
        this.panels[key].classList.remove('hidden');
    };

    MenuUI.prototype.close = function (key) {
        this.panels[key].classList.add('hidden');
    };

    MenuUI.prototype.closeAll = function () {
        const self = this;
        Object.keys(this.panels).forEach(function (k) { self.close(k); });
    };

    MenuUI.prototype.closeTop = function () {
        this.close('howto');
    };

    MenuUI.prototype.openMain = function () {
        this.closeAll();
        this.renderProgress();
        this.open('main');
    };

    MenuUI.prototype.openSelect = function () {
        this.closeAll();
        this.renderSelect();
        this.open('select');
    };

    MenuUI.prototype.openPause = function () {
        if (this.app.modeName !== 'mission' && this.app.modeName !== 'sandbox' && this.app.modeName !== 'physics') return;
        el('btn-restart').classList.toggle('hidden', this.app.modeName !== 'mission');
        el('btn-to-select').classList.toggle('hidden', this.app.modeName !== 'mission');
        this.open('pause');
    };

    MenuUI.prototype.renderProgress = function () {
        const s = Storage.summary(Campaign.MISSIONS);
        // One pill: four of them wrapped onto a second row on a phone, and they
        // are one fact — how far through the campaign you are.
        el('menu-progress').innerHTML =
            '<span class="prog-pill">' +
                '<span class="prog-part">' + s.completed + ' / ' + s.total + ' missions</span>' +
                '<span class="prog-part">🥇 ' + s.gold + '</span>' +
                '<span class="prog-part">🥈 ' + s.silver + '</span>' +
                '<span class="prog-part">🥉 ' + s.bronze + '</span>' +
            '</span>';
    };

    MenuUI.prototype.renderSelect = function () {
        const self = this;
        const grid = el('mission-grid');
        const summary = Storage.summary(Campaign.MISSIONS);

        el('select-summary').innerHTML =
            '<span class="prog-pill">' + summary.medals + ' medals</span>' +
            '<span class="prog-pill">🥇 ' + summary.gold + '</span>' +
            '<span class="prog-pill">🥈 ' + summary.silver + '</span>' +
            '<span class="prog-pill">🥉 ' + summary.bronze + '</span>';

        grid.innerHTML = '';

        Campaign.MISSIONS.forEach(function (mission, i) {
            const unlocked = Storage.isUnlocked(Campaign.MISSIONS, mission.id);
            const record = Storage.missionRecord(mission.id);
            const units = Cargo3D.Manifest.build(mission);
            const par = Scoring.parFor(units);

            const card = document.createElement('button');
            card.className = 'mission-card' + (unlocked ? '' : ' locked');
            card.disabled = !unlocked;

            const rules = (mission.rules || []).filter(function (r) { return r.indexOf('support') !== 0; });
            const ruleChips = rules.map(function (spec) {
                const parsed = Cargo3D.Rules.parseRule(spec);
                return parsed ? '<span class="rule-chip">' + parsed.rule.label + '</span>' : '';
            }).join('');

            const best = record && record.best
                ? '<span class="best-val">' + Math.round(record.best).toLocaleString() + ' m³</span>' +
                  '<span class="best-par">par ' + Math.round(par).toLocaleString() + '</span>'
                : '<span class="best-par">par ' + Math.round(par).toLocaleString() + ' m³</span>';

            card.innerHTML =
                '<span class="mission-index">' + String(i + 1).padStart(2, '0') + '</span>' +
                '<span class="mission-medal">' + (record && record.medal ? MEDAL_ICON[record.medal] : (unlocked ? '' : '🔒')) + '</span>' +
                '<span class="mission-name">' + mission.name + '</span>' +
                '<span class="mission-tagline">' + (mission.tagline || '') + '</span>' +
                '<span class="mission-meta">' + mission.bay.cols + '×' + mission.bay.rows + '×' + mission.bay.tiers +
                    ' · ' + units.length + ' units</span>' +
                '<span class="mission-rules">' + ruleChips + '</span>' +
                '<span class="mission-best">' + best + '</span>';

            card.addEventListener('click', function () {
                if (!unlocked) return;
                self.app.startMission(mission);
            });

            grid.appendChild(card);
        });
    };

    /** Populated once — the cargo catalogue and rule list in the how-to panel. */
    MenuUI.prototype.renderHowTo = function () {
        const catalogue = Object.keys(C.CARGO_TYPES).filter(function (k) {
            return C.CARGO_TYPES[k].gridPiece;
        }).map(function (k) {
            const t = C.CARGO_TYPES[k];
            return '<li><strong>' + t.label + '</strong><span>' + t.cells[0] + ' × ' + t.cells[1] +
                ' slots · ' + t.length + ' m' + (t.noTopLoad ? ' · no top loading' : '') + '</span></li>';
        }).join('');
        el('howto-catalogue').innerHTML = catalogue;

        const rules = Object.keys(Cargo3D.Rules.RULES).map(function (id) {
            const rule = Cargo3D.Rules.RULES[id];
            return '<li><strong>' + rule.label + '</strong><span>' +
                rule.describe(rule.defaultParam) + '</span></li>';
        }).join('');
        el('howto-rules').innerHTML = rules;
    };

    Cargo3D.MenuUI = MenuUI;
})(window);
