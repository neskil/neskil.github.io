(function (window) {
    'use strict';

    // Everything that writes to the DOM. It only ever reads from events and
    // from CY.state — it never mutates the game. ui-bind.js does the reverse:
    // it turns clicks into CY.game calls.
    const CY = window.CY = window.CY || {};

    const el = {};
    let toastTimer = null;

    function grab() {
        [
            'metric-score', 'metric-span', 'metric-fill', 'metric-cargo', 'metric-units',
            'metric-mass', 'metric-penalty', 'metric-penalty-row', 'penalty-list',
            'par-track', 'par-fill', 'par-legend',
            'par-mark-gold', 'par-mark-silver', 'par-mark-bronze',
            'mission-card', 'mission-name', 'mission-brief', 'mission-rules',
            'inspector-panel', 'insp-carrier', 'insp-type', 'insp-cells', 'insp-tier', 'insp-status',
            'queue-panel', 'queue-current', 'queue-next', 'queue-next-label', 'queue-count',
            'spawn-group', 'palette-section', 'mode-badge', 'instruction-banner', 'toast',
            'overlay-missions', 'mission-list', 'overlay-result', 'result-title', 'result-stars',
            'result-score', 'result-table', 'btn-next-mission', 'overlay-help',
            'version-label', 'btn-undo'
        ].forEach(function (id) { el[id] = document.getElementById(id); });
    }

    function fmt(n, digits) {
        return Number(n).toLocaleString(undefined, {
            minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0
        });
    }

    // ── Piece thumbnails ────────────────────────────────────────────────
    // A top-down plan of the polycube, tier by tier. It is the only way to
    // read an S-bundle from an L-bundle at a glance.
    function thumbnail(pieceId, rot) {
        const def = CY.piece(pieceId);
        if (!def) return '';
        const cells = CY.grid.rotate(def.cells, rot || 0);
        const s = CY.grid.span(cells);
        const unit = 11, gap = 1.5;
        const w = s.x * unit, h = s.z * unit;
        const colour = '#' + (CY.CARRIERS[def.carrier] || CY.CARRIERS.maersk).color.toString(16).padStart(6, '0');

        // Draw the ground tier solid and anything above it as an inset square,
        // so a tower reads as "two high" rather than as a single cell.
        const byXZ = Object.create(null);
        cells.forEach(function (c) {
            const k = c[0] + ',' + c[2];
            byXZ[k] = Math.max(byXZ[k] || 0, c[1]);
        });

        let svg = '<svg class="thumb" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">';
        Object.keys(byXZ).forEach(function (k) {
            const parts = k.split(',');
            const x = Number(parts[0]) * unit, z = Number(parts[1]) * unit;
            svg += '<rect x="' + (x + gap) + '" y="' + (z + gap) + '" width="' + (unit - gap * 2) +
                   '" height="' + (unit - gap * 2) + '" rx="1.5" fill="' + colour + '" />';
            if (byXZ[k] > 0) {
                svg += '<rect x="' + (x + unit * 0.32) + '" y="' + (z + unit * 0.32) + '" width="' + (unit * 0.36) +
                       '" height="' + (unit * 0.36) + '" rx="1" fill="#0f172a" opacity="0.55" />';
            }
        });
        svg += '</svg>';
        return svg;
    }

    // ── Live metrics ────────────────────────────────────────────────────

    function renderMetrics(m) {
        el['metric-score'].textContent = fmt(m.score);
        el['metric-span'].textContent = m.empty ? '—' : m.spanX + ' × ' + m.spanZ + ' × ' + m.spanY;
        el['metric-fill'].textContent = m.empty ? '—' : Math.round(m.fill * 100) + '%';
        el['metric-cargo'].textContent = fmt(m.cargoVolume) + ' m³';
        el['metric-units'].textContent = m.pieces + ' / ' + fmt(m.teu, 2).replace(/\.00$/, '') + ' TEU';
        el['metric-mass'].textContent = fmt(m.mass, 1) + ' t';

        const hasPenalty = m.penaltyVolume > 0;
        el['metric-penalty-row'].hidden = !hasPenalty;
        el['metric-penalty'].textContent = '+' + fmt(m.penaltyVolume) + ' m³';
        el['penalty-list'].innerHTML = m.penalties.map(function (p) {
            return '<li>⚠ ' + p.text + ' <em>+' + fmt(p.cost) + ' m³</em></li>';
        }).join('');

        renderPar(m);
    }

    // The par track shows where you stand against the three medals. It is a
    // live target, not a post-mortem — that is the whole tension of a run.
    function renderPar(m) {
        const par = m.par;
        const show = !!par && CY.state.mode === 'mission';
        el['par-track'].hidden = !show;
        el['par-legend'].hidden = !show;
        if (!show) return;

        const scale = par.bronze * 1.35;
        const pct = function (v) { return Math.max(0, Math.min(100, (v / scale) * 100)); };
        el['par-fill'].style.width = pct(m.score) + '%';
        el['par-fill'].className = 'par-fill ' + medalClass(m.score, par);
        el['par-mark-gold'].style.left = pct(par.gold) + '%';
        el['par-mark-silver'].style.left = pct(par.silver) + '%';
        el['par-mark-bronze'].style.left = pct(par.bronze) + '%';
        el['par-legend'].innerHTML =
            '<span class="lg gold">🥇 ' + fmt(par.gold) + '</span>' +
            '<span class="lg silver">🥈 ' + fmt(par.silver) + '</span>' +
            '<span class="lg bronze">🥉 ' + fmt(par.bronze) + '</span>';
    }

    function medalClass(score, par) {
        if (score <= par.gold) return 'gold';
        if (score <= par.silver) return 'silver';
        if (score <= par.bronze) return 'bronze';
        return 'over';
    }

    // ── Queue ───────────────────────────────────────────────────────────

    function renderQueue(q) {
        const mission = CY.state.mode === 'mission';
        el['queue-next-label'].hidden = !mission;
        el['queue-count'].textContent = mission ? (q.index + 1) + ' / ' + q.total : '';

        if (!q.current) {
            el['queue-current'].innerHTML = '<div class="queue-empty">Yard closed</div>';
            el['queue-next'].innerHTML = '';
            return;
        }
        const def = CY.piece(q.current.id);
        el['queue-current'].innerHTML =
            '<div class="queue-item current">' +
                thumbnail(q.current.id, CY.state.cursor.rot) +
                '<div class="queue-meta">' +
                    '<strong>' + def.label + '</strong>' +
                    '<span>' + def.cells.length + ' cells · ' + fmt(def.volume, 1) + ' m³ · ' + fmt(def.mass, 1) + ' t</span>' +
                    flags(def, q.current.tag) +
                '</div>' +
            '</div>';

        el['queue-next'].innerHTML = mission ? q.upcoming.map(function (e) {
            const d = CY.piece(e.id);
            return '<div class="queue-item small" title="' + d.label + '">' +
                   thumbnail(e.id, 0) +
                   '<span>' + (d.short || d.label) + (e.tag === 'priority' ? ' 🚩' : '') + '</span></div>';
        }).join('') : '';
    }

    function flags(def, tag) {
        const out = [];
        if (tag === 'priority') out.push('<span class="flag prio">🚩 departs first</span>');
        if (def.power) out.push('<span class="flag cold">❄ needs a plug</span>');
        if (def.noTop) out.push('<span class="flag notop">⛔ carries nothing</span>');
        return out.length ? '<div class="flags">' + out.join('') + '</div>' : '';
    }

    // ── Cursor feedback ─────────────────────────────────────────────────

    function renderCursor(p) {
        const banner = el['instruction-banner'];
        if (!p || !p.cells) {
            banner.className = 'instruction-banner';
            banner.innerHTML = CY.state.status === 'complete'
                ? '✅ Queue cleared — see the report.'
                : '💡 Point at the pad and click to drop · <strong>R</strong> rotate · <strong>Z</strong> undo';
            return;
        }
        if (p.valid) {
            banner.className = 'instruction-banner ok';
            banner.innerHTML = '✅ Lands at cell <strong>' + p.x + ', ' + p.z + '</strong> on tier <strong>' +
                (p.y + 1) + '</strong>' +
                (p.support !== undefined ? ' · ' + Math.round(p.support * 100) + '% supported' : '');
        } else {
            banner.className = 'instruction-banner bad';
            banner.innerHTML = '⛔ ' + p.reason;
        }
    }

    function renderHover(entry) {
        const panel = el['inspector-panel'];
        if (!entry) { panel.classList.add('hidden'); return; }
        const def = CY.piece(entry.pieceId);
        const carrier = CY.CARRIERS[def.carrier] || CY.CARRIERS.maersk;
        el['insp-carrier'].textContent = carrier.name;
        el['insp-type'].textContent = def.label;
        el['insp-cells'].textContent = entry.cells.length + ' (' +
            entry.origin.x + ', ' + entry.origin.z + ')';
        el['insp-tier'].textContent = 'Tier ' + (entry.origin.y + 1);

        const notes = [];
        if (CY.grid.isBuried(CY.state.grid, entry.id)) notes.push('buried');
        if (def.power && !CY.grid.hasSideAccess(CY.state.grid, entry.id)) notes.push('no plug');
        if (entry.tag === 'priority') notes.push('priority');
        el['insp-status'].textContent = notes.length ? notes.join(', ') : 'clear';
        panel.classList.remove('hidden');
    }

    // ── Mission chrome ──────────────────────────────────────────────────

    function renderMode() {
        const mission = CY.state.mode === 'mission';
        el['mode-badge'].textContent = mission ? CY.state.mission.name : 'Sandbox';
        el['mission-card'].classList.toggle('hidden', !mission);
        el['palette-section'].classList.toggle('hidden', mission);
        el['btn-undo'].hidden = !CY.state.rules.allowUndo;

        if (!mission) return;
        const m = CY.state.mission;
        el['mission-name'].textContent = m.name;
        el['mission-brief'].textContent = m.brief;
        const r = CY.state.rules;
        const chips = [
            'Pad ' + CY.state.yard.w + '×' + CY.state.yard.d,
            'Max tier ' + r.maxTier,
            Math.round(r.minSupport * 100) + '% support',
            r.preview + ' shown ahead'
        ];
        el['mission-rules'].innerHTML = chips.map(function (c) {
            return '<span class="chip">' + c + '</span>';
        }).join('') + '<span class="chip teaches">' + m.teaches + '</span>';
    }

    function renderPalette() {
        const ids = Object.keys(CY.PIECES);
        el['spawn-group'].innerHTML = ids.map(function (id) {
            const d = CY.PIECES[id];
            const c = CY.CARRIERS[d.carrier] || CY.CARRIERS.maersk;
            return '<button class="palette-btn" data-piece="' + id + '" title="' + d.label + '">' +
                   '<span class="color-dot" style="background:#' + c.color.toString(16).padStart(6, '0') + '"></span>' +
                   '<span>' + (d.short || d.label) + '</span></button>';
        }).join('');
        syncPalette();
    }

    function syncPalette() {
        const current = CY.state.sandboxPiece;
        el['spawn-group'].querySelectorAll('.palette-btn').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-piece') === current);
        });
    }

    // ── Mission select ──────────────────────────────────────────────────

    function renderMissionList() {
        const progress = CY.save.load();
        let html = '';
        CY.missions.chapters().forEach(function (ch) {
            const inChapter = CY.missions.list().filter(function (m) { return m.chapter === ch.id; });
            html += '<section class="chapter"><h3>' + ch.name + ' <em>' + ch.blurb + '</em></h3><div class="mission-grid">';
            inChapter.forEach(function (m) {
                const rec = progress.missions[m.id];
                const unlocked = CY.missions.isUnlocked(m.id, progress);
                const stars = rec ? rec.stars : 0;
                html += '<button class="mission-tile' + (unlocked ? '' : ' locked') + '" data-mission="' + m.id + '"' +
                        (unlocked ? '' : ' disabled') + '>' +
                        '<span class="mt-name">' + (unlocked ? m.name : '🔒 ' + m.name) + '</span>' +
                        '<span class="mt-stars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>' +
                        '<span class="mt-best">' + (rec && isFinite(rec.best) ? 'best ' + fmt(rec.best) + ' m³' : '—') + '</span>' +
                        '</button>';
            });
            html += '</div></section>';
        });
        el['mission-list'].innerHTML = html;
    }

    // ── Result ──────────────────────────────────────────────────────────

    function renderResult(r) {
        if (CY.state.mode !== 'mission') return;
        el['result-title'].textContent = r.stars > 0 ? 'Yard cleared' : 'Yard cleared — no medal';
        el['result-stars'].innerHTML = [0, 1, 2].map(function (i) {
            return '<span class="star' + (i < r.stars ? ' on' : '') + '">★</span>';
        }).join('');
        el['result-score'].textContent = fmt(r.score);

        const rows = [
            ['Bounding box', r.spanX + ' × ' + r.spanZ + ' × ' + r.spanY + ' cells', fmt(r.stackVolume) + ' m³'],
            ['Penalties', r.penalties.length ? r.penalties.length + ' issue(s)' : 'none', '+' + fmt(r.penaltyVolume) + ' m³'],
            ['Packing', Math.round(r.fill * 100) + '% of the box is cargo', ''],
            ['Perfect pack', 'the floor for this queue', fmt(r.par.floor) + ' m³'],
            ['Gold / Silver / Bronze', '', fmt(r.par.gold) + ' / ' + fmt(r.par.silver) + ' / ' + fmt(r.par.bronze)]
        ];
        el['result-table'].innerHTML = rows.map(function (row) {
            return '<tr><th>' + row[0] + '</th><td>' + row[1] + '</td><td class="num">' + row[2] + '</td></tr>';
        }).join('') + r.penalties.map(function (p) {
            return '<tr class="pen"><th>⚠</th><td>' + p.text + '</td><td class="num">+' + fmt(p.cost) + ' m³</td></tr>';
        }).join('');

        el['btn-next-mission'].classList.toggle('hidden', !r.next);
        el['btn-next-mission'].setAttribute('data-mission', r.next || '');
        show('overlay-result');
    }

    // ── Overlays & toast ────────────────────────────────────────────────

    function show(id) { el[id].classList.remove('hidden'); }
    function hide(id) { el[id].classList.add('hidden'); }
    function hideAll() { ['overlay-missions', 'overlay-result', 'overlay-help'].forEach(hide); }

    function toast(msg) {
        const t = el.toast;
        t.textContent = msg.text;
        t.className = 'toast ' + (msg.tone || 'info');
        t.hidden = false;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () { t.hidden = true; }, 2600);
    }

    // ── Wiring ──────────────────────────────────────────────────────────

    function init() {
        grab();
        el['version-label'].textContent = CY.VERSION;
        renderPalette();

        CY.on('game:metrics', renderMetrics);
        CY.on('game:queue', renderQueue);
        CY.on('game:cursor', renderCursor);
        CY.on('game:message', toast);
        CY.on('ui:hover', renderHover);
        CY.on('game:start', function () {
            hideAll();
            renderMode();
            syncPalette();
        });
        CY.on('game:complete', function (r) {
            CY.audio.fanfare(r.stars);
            renderResult(r);
        });
    }

    CY.ui = {
        init: init,
        el: el,
        show: show,
        hide: hide,
        hideAll: hideAll,
        renderMissionList: renderMissionList,
        renderMode: renderMode,
        syncPalette: syncPalette,
        toast: toast,
        thumbnail: thumbnail
    };

})(window);
