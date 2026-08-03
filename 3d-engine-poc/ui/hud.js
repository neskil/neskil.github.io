/**
 * ui/hud.js — in-play readouts.
 *
 * Two HUDs share one file because they share one vocabulary: the mission HUD
 * (queue, envelope, medal track, rule feedback) and the sandbox HUD (yard
 * statistics and the unit inspector).
 *
 * All DOM here; no game state is stored beyond what the last update passed in.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;

    const MEDAL_ICON = { gold: '🥇', silver: '🥈', bronze: '🥉' };

    function volume(v) {
        return Math.round(v).toLocaleString() + ' m³';
    }

    function el(id) {
        return document.getElementById(id);
    }

    /** Badge markup for a unit's traits and departure day. */
    function unitBadges(unit) {
        let html = '';
        (unit.traits || []).forEach(function (t) {
            const trait = C.TRAITS[t];
            if (trait) html += '<span class="trait trait-' + t + '" title="' + trait.note + '">' + trait.badge + '</span>';
        });
        if (unit.departure) {
            html += '<span class="trait trait-day" title="Departs ' + C.DEPARTURE_DAYS[unit.departure] + '">' +
                    C.DEPARTURE_DAYS[unit.departure] + '</span>';
        }
        return html;
    }

    function unitChip(unit, className) {
        const type = C.CARGO_TYPES[unit.type] || C.CARGO_TYPES['20ft'];
        const carrier = C.CARRIERS[unit.carrier] || C.CARRIERS.maersk;
        const swatch = '#' + carrier.color.toString(16).padStart(6, '0');
        const cells = type.cells[0] * type.cells[1];

        return '<div class="unit-chip ' + (className || '') + '">' +
            '<span class="chip-swatch" style="background:' + swatch + '"></span>' +
            '<span class="chip-body">' +
                '<span class="chip-title">' + type.label + '</span>' +
                '<span class="chip-meta">' + cells + ' slot' + (cells === 1 ? '' : 's') +
                    ' · ' + unit.massT.toFixed(1) + ' t</span>' +
            '</span>' +
            '<span class="chip-badges">' + unitBadges(unit) + '</span>' +
        '</div>';
    }

    /* ── mission HUD ───────────────────────────────────────────────────── */

    function MissionHUD() {
        this.root = el('mission-hud');
        this.queue = el('queue-bar');
        this.controls = el('mission-controls');
        this.flash = el('reason-flash');
        this._flashTimer = null;
    }

    MissionHUD.prototype.show = function (mission, units) {
        const rules = Cargo3D.Rules.describeRules(mission.rules);
        const summary = Cargo3D.Manifest.summarise(units);

        el('hud-mission-name').textContent = mission.name;
        el('hud-mission-tagline').textContent = mission.tagline || '';

        el('hud-bay').textContent = mission.bay.cols + ' × ' + mission.bay.rows +
            ' slots · ' + mission.bay.tiers + ' tiers';

        el('hud-rules').innerHTML = rules.map(function (r) {
            return '<li><strong>' + r.label + '</strong><span>' + r.text + '</span></li>';
        }).join('') || '<li><span>No special regulations.</span></li>';

        const types = Object.keys(summary.byType).map(function (key) {
            const type = C.CARGO_TYPES[key];
            return '<span class="mix-pill">' + summary.byType[key] + '× ' + (type ? type.short : key) + '</span>';
        }).join('');
        el('hud-mix').innerHTML = types;

        this.root.classList.remove('hidden');
        this.queue.classList.remove('hidden');
        this.controls.classList.remove('hidden');
    };

    MissionHUD.prototype.hide = function () {
        this.root.classList.add('hidden');
        this.queue.classList.add('hidden');
        this.controls.classList.add('hidden');
        this.clearFlash();
    };

    MissionHUD.prototype.update = function (s) {
        el('hud-placed').textContent = s.placed + ' / ' + s.total;
        el('hud-envelope').textContent = volume(s.envelope);
        el('hud-par').textContent = volume(s.par);

        // Mid-mission the envelope is naturally under par, so "over par" would
        // read as praise for an unfinished yard. Only judge once it is done.
        const pctOfPar = Math.round(s.ratio * 100);
        const overPar = pctOfPar - 100;
        const overEl = el('hud-overpar');
        const done = s.placed >= s.total && s.total > 0;

        if (s.placed === 0) {
            overEl.textContent = '—';
            overEl.className = 'metric-val';
        } else if (!done) {
            overEl.textContent = pctOfPar + '% of par so far';
            overEl.className = 'metric-val';
        } else {
            overEl.textContent = overPar <= 0 ? 'at par' : '+' + overPar + '% over par';
            overEl.className = 'metric-val ' + (overPar <= 10 ? 'status-good' : overPar <= 30 ? 'status-warn' : 'status-bad');
        }

        // Medal track: how far the current envelope sits along gold→bronze.
        const track = el('medal-track');
        const worst = s.thresholds.bronze * 1.25;
        const pct = Math.min(100, Math.max(0, (s.envelope / worst) * 100));
        track.style.setProperty('--fill', pct + '%');
        track.style.setProperty('--gold', (s.thresholds.gold / worst * 100) + '%');
        track.style.setProperty('--silver', (s.thresholds.silver / worst * 100) + '%');
        track.style.setProperty('--bronze', (s.thresholds.bronze / worst * 100) + '%');

        const medalEl = el('hud-medal');
        if (s.placed === 0) {
            medalEl.textContent = '—';
            medalEl.className = 'medal-pill';
        } else if (s.projectedMedal) {
            // The envelope only ever grows, so "still inside" is an honest read.
            medalEl.textContent = MEDAL_ICON[s.projectedMedal] + (done ? ' ' + s.projectedMedal : ' still inside ' + s.projectedMedal);
            medalEl.className = 'medal-pill medal-' + s.projectedMedal;
        } else {
            medalEl.textContent = 'past every medal threshold';
            medalEl.className = 'medal-pill medal-none';
        }

        el('hud-efficiency').textContent = Math.round(s.measure.slotEfficiency * 100) + '%';
        el('hud-footprint').textContent = s.measure.spanX + ' × ' + s.measure.spanZ +
            ' × ' + s.measure.spanTiers;

        // Queue.
        let html = '';
        if (s.current) {
            html += '<div class="queue-slot queue-now">' +
                    '<span class="queue-label">Now landing</span>' +
                    unitChip(s.current, 'chip-lg') + '</div>';
        } else {
            html += '<div class="queue-slot queue-now"><span class="queue-label">Manifest cleared</span></div>';
        }

        if (s.upcoming.length) {
            html += '<div class="queue-slot queue-next"><span class="queue-label">Next</span>' +
                    s.upcoming.map(function (u) { return unitChip(u, 'chip-sm'); }).join('') + '</div>';
        }
        this.queue.innerHTML = html;

        // Cursor feedback.
        const cursor = el('hud-cursor');
        if (!s.hover) {
            cursor.textContent = s.current ? 'Point at the bay to place.' : '';
            cursor.className = 'cursor-note';
        } else if (s.hover.ok) {
            cursor.textContent = 'Tier ' + (s.hover.tier + 1) + ' · slot ' +
                (s.hover.x + 1) + ',' + (s.hover.z + 1) +
                (s.hover.support ? ' · ' + Math.round(s.hover.support.ratio * 100) + '% supported' : '');
            cursor.className = 'cursor-note ok';
        } else {
            cursor.textContent = s.hover.reason;
            cursor.className = 'cursor-note bad';
        }

        const rotateBtn = el('btn-rotate');
        if (rotateBtn) rotateBtn.disabled = !s.canRotate;

        const stuckEl = el('hud-stuck');
        stuckEl.classList.toggle('hidden', !(s.stuck && s.current));
    };

    MissionHUD.prototype.flashReason = function (text) {
        this.flash.textContent = text;
        this.flash.classList.add('visible');
        clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(this.clearFlash.bind(this), 2200);
    };

    MissionHUD.prototype.clearFlash = function () {
        this.flash.classList.remove('visible');
    };

    /* ── sandbox HUD ───────────────────────────────────────────────────── */

    function SandboxHUD() {
        this.root = el('sandbox-hud');
        this.toolbar = el('sandbox-toolbar');
        this.inspector = el('inspector-panel');
    }

    SandboxHUD.prototype.show = function () {
        this.root.classList.remove('hidden');
        this.toolbar.classList.remove('hidden');
    };

    SandboxHUD.prototype.hide = function () {
        this.root.classList.add('hidden');
        this.toolbar.classList.add('hidden');
        this.hideInspector();
    };

    SandboxHUD.prototype.update = function (m) {
        el('sb-count').textContent = m.count;
        el('sb-teu').textContent = m.teu + ' TEU';
        el('sb-volume').textContent = m.volume.toLocaleString() + ' m³';
        el('sb-mass').textContent = m.mass + ' t';
        el('sb-height').textContent = m.height + ' m';
        el('sb-train').textContent = m.trainLeft + ' left';
    };

    SandboxHUD.prototype.showInspector = function (mesh) {
        const data = mesh.userData;
        const spec = data.spec;

        el('insp-carrier').textContent = data.carrierName || 'Unbranded';
        el('insp-type').textContent = spec.label;
        el('insp-dim').textContent = spec.length + ' × ' + spec.width + ' × ' + spec.height + ' m';
        el('insp-pos').textContent = 'X ' + mesh.position.x.toFixed(1) +
            ' · Y ' + mesh.position.y.toFixed(1) + ' · Z ' + mesh.position.z.toFixed(1);
        el('insp-tier').textContent = 'Tier ' + (Math.floor(mesh.position.y / C.GRID.TIER_H) + 1);
        el('insp-volume').textContent = spec.volume + ' m³ · ' + spec.teu + ' TEU';

        this.inspector.classList.remove('hidden');
    };

    SandboxHUD.prototype.hideInspector = function () {
        this.inspector.classList.add('hidden');
    };

    Cargo3D.MissionHUD = MissionHUD;
    Cargo3D.SandboxHUD = SandboxHUD;
    Cargo3D.hudFormat = { volume: volume, unitChip: unitChip, unitBadges: unitBadges, MEDAL_ICON: MEDAL_ICON };
})(window);
