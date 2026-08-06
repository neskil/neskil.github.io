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

    function shapeGridSVG(typeId) {
        const type = C.CARGO_TYPES[typeId];
        if (!type) return '';
        const cellsX = type.cells[0];
        const cellsZ = type.cells[1];
        const pts = C.footprint(typeId, 0);
        const set = {};
        pts.forEach(function (p) { set[p[0] + ',' + p[1]] = true; });

        let rects = '';
        for (let x = 0; x < cellsX; x++) {
            for (let z = 0; z < cellsZ; z++) {
                if (set[x + ',' + z]) {
                    rects += '<rect x="' + (x * 7 + 1) + '" y="' + (z * 7 + 1) + '" width="5.5" height="5.5" rx="1" fill="currentColor"/>';
                }
            }
        }
        const width = cellsX * 7 + 1;
        const height = cellsZ * 7 + 1;
        return '<svg class="shape-icon" viewBox="0 0 ' + width + ' ' + height + '" style="width:' + Math.max(14, cellsX * 9) + 'px;height:' + Math.max(14, cellsZ * 9) + 'px;margin-right:6px;vertical-align:middle;color:rgba(255,255,255,0.85);display:inline-block;">' + rects + '</svg>';
    }

    function unitChip(unit, className) {
        const type = C.CARGO_TYPES[unit.type] || C.CARGO_TYPES['20ft'];
        const carrier = C.CARRIERS[unit.carrier] || C.CARRIERS.maersk;
        const swatch = '#' + carrier.color.toString(16).padStart(6, '0');
        const cells = C.cellCount(unit.type);

        return '<div class="unit-chip ' + (className || '') + '">' +
            '<span class="chip-swatch" style="background:' + swatch + '"></span>' +
            '<span class="chip-body">' +
                '<span class="chip-title">' + shapeGridSVG(unit.type) + type.label + '</span>' +
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

        /* The phone layout (see the `max-width: 820px` block in hud.css) folds
           both readouts into one sheet and puts a one-line summary of it under
           the top bar. Above the breakpoint the strip is not rendered and the
           sheet wrapper generates no box, so all of this is inert. */
        this.sheet = el('mission-sheet');
        this.strip = el('mission-strip');
        this.sheetOpen = false;

        const self = this;
        if (this.strip) {
            this.strip.addEventListener('click', function () { self.toggleSheet(); });
        }

        /*
         * An open sheet covers the yard, so anything outside it dismisses it.
         *
         * A tap on the canvas dismisses and stops there — dropping a container
         * on the sliver of yard you could still see is never what that tap
         * meant. Both event families have to be swallowed: the placement
         * controller arms itself on `pointerdown` and again on `touchstart`, so
         * blocking one leaves the other to commit on release.
         */
        function dismiss(e) {
            if (!self.sheetOpen) return;
            if (self.sheet && self.sheet.contains(e.target)) return;
            if (self.strip && self.strip.contains(e.target)) return;
            self.setSheetOpen(false);
            if (e.target && e.target.tagName === 'CANVAS') {
                e.preventDefault();
                e.stopPropagation();
            }
        }

        document.addEventListener('pointerdown', dismiss, true);
        document.addEventListener('touchstart', dismiss, { capture: true, passive: false });
    }

    MissionHUD.prototype.setSheetOpen = function (open) {
        this.sheetOpen = !!open;
        if (this.sheet) this.sheet.classList.toggle('open', this.sheetOpen);
        if (this.strip) this.strip.setAttribute('aria-expanded', this.sheetOpen ? 'true' : 'false');
    };

    MissionHUD.prototype.toggleSheet = function () {
        this.setSheetOpen(!this.sheetOpen);
    };

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
        if (this.strip) this.strip.classList.remove('hidden');
    };

    MissionHUD.prototype.hide = function () {
        this.root.classList.add('hidden');
        this.queue.classList.add('hidden');
        this.controls.classList.add('hidden');
        if (this.strip) this.strip.classList.add('hidden');
        this.setSheetOpen(false);
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
        const stuck = !!(s.stuck && s.current);
        stuckEl.classList.toggle('hidden', !stuck);

        this.updateStrip(s, pctOfPar, stuck);
    };

    /**
     * The phone strip. Four readings, in the order a placement needs them: what
     * is landing, how far through the manifest, where the envelope sits against
     * par, and which medal that still leaves. Everything else — the bay, the
     * regulations, the rest of the queue — is one tap away in the sheet.
     */
    MissionHUD.prototype.updateStrip = function (s, pctOfPar, stuck) {
        if (!this.strip) return;

        const now = el('strip-now');
        if (s.current) {
            const type = C.CARGO_TYPES[s.current.type] || C.CARGO_TYPES['20ft'];
            const carrier = C.CARRIERS[s.current.carrier] || C.CARRIERS.maersk;
            now.innerHTML = '<span class="chip-swatch" style="background:#' +
                carrier.color.toString(16).padStart(6, '0') + '"></span>' +
                shapeGridSVG(s.current.type) + type.label;
        } else {
            now.textContent = 'Manifest cleared';
        }

        el('strip-placed').textContent = s.placed + ' / ' + s.total;
        el('strip-par').textContent = s.placed ? pctOfPar + '% par' : '—';

        // No medal at all is the one state worth a warning glyph — the strip has
        // no room to say "past every threshold", and the sheet already does.
        el('strip-medal').textContent = !s.placed ? ''
            : (MEDAL_ICON[s.projectedMedal] || '⚠');

        this.strip.classList.toggle('stuck', stuck);
    };

    MissionHUD.prototype.flashReason = function (text) {
        this.flashMessage(text, false);
    };

    /** Same banner, green, for contract payouts. */
    MissionHUD.prototype.flashSuccess = function (text) {
        this.flashMessage(text, true);
    };

    MissionHUD.prototype.flashMessage = function (text, good) {
        this.flash.textContent = text;
        this.flash.classList.toggle('good', !!good);
        this.flash.classList.add('visible');
        clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(this.clearFlash.bind(this), 2400);
    };

    MissionHUD.prototype.clearFlash = function () {
        this.flash.classList.remove('visible');
    };

    /* ── sandbox HUD ───────────────────────────────────────────────────── */

    function SandboxHUD() {
        this.root = el('sandbox-hud');
        this.toolbar = el('sandbox-toolbar');
        this.inspector = el('inspector-panel');
        this.contracts = el('contracts-card');
    }

    SandboxHUD.prototype.show = function () {
        this.root.classList.remove('hidden');
        this.toolbar.classList.remove('hidden');
    };

    SandboxHUD.prototype.hide = function () {
        this.root.classList.add('hidden');
        this.toolbar.classList.add('hidden');
        this.contracts.classList.add('hidden');
        this.hideInspector();
    };

    /** The optional job board: capital, reputation, active order, upgrades. */
    SandboxHUD.prototype.updateContracts = function (s) {
        this.contracts.classList.toggle('hidden', !s.running);
        if (!s.running) return;

        el('ct-money').textContent = '$' + s.money.toLocaleString();
        el('ct-rating').textContent = s.ratingLabel + ' (' + s.rating + '%)';
        el('ct-delivered').textContent = s.delivered;

        const contract = s.contract;
        if (contract) {
            el('ct-title').textContent = contract.title;
            el('ct-desc').textContent = contract.desc;
            el('ct-payout').textContent = 'Reward $' + contract.payout.toLocaleString();

            const left = Math.ceil(contract.timeRemaining);
            const timer = el('ct-timer');
            timer.textContent = '⏳ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
            timer.classList.toggle('urgent', left <= 30);

            el('ct-progress').style.width = (contract.timeRemaining / contract.duration * 100) + '%';
        }

        // This runs every frame. Rebuilding the buttons each tick would detach
        // whatever the player is mid-click on, so only redraw when the state
        // they encode actually changes.
        const upgrades = Cargo3D.Contracts.UPGRADES;
        const keys = Object.keys(upgrades);
        const signature = keys.map(function (key) {
            return (s.upgrades[key] ? 'o' : '') + (s.money >= upgrades[key].cost ? 'a' : '');
        }).join('|');

        if (signature === this._upgradeSignature) return;
        this._upgradeSignature = signature;

        el('ct-upgrades').innerHTML = keys.map(function (key) {
            const u = upgrades[key];
            const owned = s.upgrades[key];
            const afford = s.money >= u.cost;
            return '<button class="upgrade-btn' + (owned ? ' owned' : '') + '" data-upgrade="' + key + '"' +
                (owned || !afford ? ' disabled' : '') + ' title="' + u.note + '">' +
                '<span class="up-label">' + u.label + '</span>' +
                '<span class="up-cost">' + (owned ? 'owned' : '$' + u.cost.toLocaleString()) + '</span>' +
                '</button>';
        }).join('');
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

    /* ── physics HUD ───────────────────────────────────────────────────── */

    function PhysicsHUD() {
        this.root = el('physics-hud');
        this.toolbar = el('physics-toolbar');
    }

    PhysicsHUD.prototype.show = function () {
        if (this.root) this.root.classList.remove('hidden');
        if (this.toolbar) this.toolbar.classList.remove('hidden');
    };

    PhysicsHUD.prototype.hide = function () {
        if (this.root) this.root.classList.add('hidden');
        if (this.toolbar) this.toolbar.classList.add('hidden');
    };

    const RUN_STATUS = {
        idle:     { text: 'Drop the first container', cls: '' },
        settling: { text: 'Settling…',                cls: 'settling' },
        stable:   { text: '✓ Standing',               cls: 'stable' },
        over:     { text: '✗ Collapsed',              cls: 'collapsed' }
    };

    PhysicsHUD.prototype.update = function (m) {
        // Where the next container will land. The console can hold a position
        // the pointer no longer agrees with, so the readout says when it does.
        const coords = el('phys-coords');
        if (coords) {
            const aim = m.aim;
            coords.textContent = aim
                ? 'X ' + aim.x.toFixed(1) + '   Y ' + aim.y.toFixed(1) + '   Z ' + aim.z.toFixed(1)
                : 'Point at the yard';
            coords.classList.toggle('locked', !!(aim && aim.locked));
        }

        if (el('ph-count')) el('ph-count').textContent = m.count;
        if (el('ph-mass')) el('ph-mass').textContent = m.mass + ' t';
        if (el('ph-height')) el('ph-height').textContent = m.height.toFixed(1) + ' m';

        const tower = m.challenge === 'tower';
        const towerRows = el('ph-tower-rows');
        if (towerRows) towerRows.classList.toggle('hidden', !tower);

        const tagline = el('ph-tagline');
        if (tagline) {
            tagline.textContent = tower
                ? 'Stack as high as you can. Height counts once the tower stands still — one collapse ends the run.'
                : 'No grid holding anything up. Containers have mass, friction and a centre of gravity; bad balance tips.';
        }

        if (!tower) return;

        if (el('ph-run-height')) el('ph-run-height').textContent = m.runHeight.toFixed(1) + ' m';
        if (el('ph-best')) el('ph-best').textContent = m.best > 0 ? m.best.toFixed(1) + ' m' : '—';

        const status = RUN_STATUS[m.status] || RUN_STATUS.idle;
        const statusEl = el('ph-status');
        if (statusEl) {
            statusEl.textContent = status.text;
            statusEl.className = 'metric-val run-status ' + status.cls;
        }
    };

    Cargo3D.MissionHUD = MissionHUD;
    Cargo3D.SandboxHUD = SandboxHUD;
    Cargo3D.PhysicsHUD = PhysicsHUD;
    Cargo3D.hudFormat = { volume: volume, unitChip: unitChip, unitBadges: unitBadges, MEDAL_ICON: MEDAL_ICON };
})(window);
