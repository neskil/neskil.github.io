(function (window) {
    'use strict';

    // The game itself. One object, one set of verbs, no DOM and no THREE —
    // the renderer and the HUD are both just subscribers to the events below.
    //
    // Modes:
    //   'mission' — a fixed queue, rules, a par and a medal.
    //   'sandbox' — the original POC: pick any piece, place it anywhere legal,
    //               remove anything not buried, watch the metrics move.
    const CY = window.CY = window.CY || {};

    const state = {
        mode: 'sandbox',
        missionId: null,
        mission: null,
        rules: Object.assign({}, CY.RULES),
        yard: Object.assign({}, CY.YARD),
        grid: null,
        queue: [],
        index: 0,
        abandoned: [],
        history: [],
        cursor: { x: 0, z: 0, rot: 0 },
        sandboxPiece: 'c20',
        status: 'idle',      // 'playing' | 'complete'
        result: null
    };

    CY.state = state;

    // ── Lifecycle ───────────────────────────────────────────────────────

    function reset(yard, rules) {
        state.yard = Object.assign({}, yard || CY.YARD);
        state.rules = Object.assign({}, CY.RULES, rules || {});
        state.grid = CY.grid.create(state.yard.w, state.yard.d, state.yard.h);
        state.queue = [];
        state.index = 0;
        state.abandoned = [];
        state.history = [];
        state.cursor = { x: 0, z: 0, rot: 0 };
        state.status = 'playing';
        state.result = null;
    }

    function startSandbox(yard) {
        state.mode = 'sandbox';
        state.missionId = null;
        state.mission = null;
        reset(yard || CY.YARD, { maxTier: (yard || CY.YARD).h, minSupport: 0.34 });
        CY.emit('game:start', { mode: 'sandbox' });
        publish();
    }

    function startMission(id) {
        const m = CY.missions.get(id);
        if (!m) return false;
        state.mode = 'mission';
        state.missionId = id;
        state.mission = m;
        reset(m.yard, CY.missions.rulesFor(m));
        state.queue = CY.missions.buildQueue(m);
        state.par = CY.missions.parFor(m);
        centreCursor();
        CY.emit('game:start', { mode: 'mission', mission: m });
        publish();
        return true;
    }

    // ── Current piece ───────────────────────────────────────────────────

    function currentEntry() {
        if (state.mode === 'sandbox') return { id: state.sandboxPiece, tag: null };
        if (state.status !== 'playing') return null;
        return state.queue[state.index] || null;
    }

    function currentDef() {
        const e = currentEntry();
        return e ? CY.piece(e.id) : null;
    }

    function upcoming() {
        if (state.mode !== 'mission') return [];
        return state.queue.slice(state.index + 1, state.index + 1 + (state.rules.preview || 0));
    }

    function setSandboxPiece(id) {
        if (!CY.piece(id)) return;
        state.sandboxPiece = id;
        state.cursor.rot = 0;
        publish();
    }

    // ── Cursor ──────────────────────────────────────────────────────────

    function rotatedCells() {
        const def = currentDef();
        if (!def) return null;
        return CY.grid.rotate(def.cells, state.cursor.rot);
    }

    function clampCursor() {
        const cells = rotatedCells();
        if (!cells) return;
        const s = CY.grid.span(cells);
        state.cursor.x = Math.max(0, Math.min(state.yard.w - s.x, state.cursor.x));
        state.cursor.z = Math.max(0, Math.min(state.yard.d - s.z, state.cursor.z));
    }

    function centreCursor() {
        const cells = rotatedCells();
        if (!cells) return;
        const s = CY.grid.span(cells);
        state.cursor.x = Math.floor((state.yard.w - s.x) / 2);
        state.cursor.z = Math.floor((state.yard.d - s.z) / 2);
        clampCursor();
    }

    function setCursor(x, z) {
        state.cursor.x = x;
        state.cursor.z = z;
        clampCursor();
        CY.emit('game:cursor', preview());
    }

    function nudge(dx, dz) {
        setCursor(state.cursor.x + dx, state.cursor.z + dz);
    }

    function rotate(dir) {
        const def = currentDef();
        if (!def) return;
        const rots = CY.grid.orientations(def.cells);
        if (rots.length < 2) {
            CY.emit('game:message', { text: 'That one is symmetric — rotating changes nothing.', tone: 'info' });
            return;
        }
        state.cursor.rot = (state.cursor.rot + (dir || 1) + 4) % 4;
        // Skip orientations that are duplicates of one we already have.
        let guard = 0;
        while (rots.indexOf(state.cursor.rot) === -1 && guard++ < 4) {
            state.cursor.rot = (state.cursor.rot + (dir || 1) + 4) % 4;
        }
        clampCursor();
        CY.emit('game:cursor', preview());
    }

    // ── Placement ───────────────────────────────────────────────────────

    // The single source of truth for "can this go here, and if not, why not".
    // The ghost mesh, the click handler and the reach stacker all ask this.
    function preview() {
        const entry = currentEntry();
        const def = currentDef();
        if (!def || state.status !== 'playing') {
            return { valid: false, reason: 'No piece', cells: null };
        }
        const cells = rotatedCells();
        const s = CY.grid.span(cells);
        clampCursor();
        const x = state.cursor.x, z = state.cursor.z;
        const y = CY.grid.dropY(state.grid, cells, x, z);

        const out = {
            entry: entry, def: def, cells: cells, span: s,
            x: x, y: y, z: z, rot: state.cursor.rot,
            valid: false, reason: ''
        };

        if (y < 0) { out.reason = 'The column is full'; return out; }
        if (y + s.y > state.rules.maxTier) {
            out.reason = 'Above tier ' + state.rules.maxTier;
            return out;
        }
        const support = CY.grid.supportRatio(state.grid, cells, x, y, z);
        out.support = support;
        if (support < state.rules.minSupport) {
            out.reason = 'Only ' + Math.round(support * 100) + '% supported (need ' +
                Math.round(state.rules.minSupport * 100) + '%)';
            return out;
        }
        if (CY.grid.crushesNoTop(state.grid, cells, x, y, z)) {
            out.reason = 'Nothing may rest on a tank frame';
            return out;
        }
        out.valid = true;
        return out;
    }

    function place() {
        const p = preview();
        if (!p.valid) {
            CY.emit('game:message', { text: p.reason || 'Cannot place there', tone: 'bad' });
            return null;
        }
        const placed = CY.grid.place(state.grid, p.entry.id, p.cells, p.x, p.y, p.z, p.entry.tag);
        placed.rot = p.rot;
        state.history.push({ kind: 'place', id: placed.id, index: state.index });
        if (state.mode === 'mission') state.index++;
        CY.emit('game:placed', { entry: placed, preview: p });
        advance();
        publish();
        return placed;
    }

    // Called after every placement: skip anything with nowhere legal to go,
    // and end the mission when the queue runs dry.
    function advance() {
        if (state.mode !== 'mission') return;
        let guard = 0;
        while (state.index < state.queue.length && guard++ < 64) {
            const def = CY.piece(state.queue[state.index].id);
            if (!def) { state.index++; continue; }
            if (CY.grid.hasLegalMove(state.grid, def.cells, state.rules)) break;
            state.abandoned.push(state.queue[state.index].id);
            CY.emit('game:message', {
                text: (def.short || def.label) + ' had nowhere legal to go — abandoned.',
                tone: 'bad'
            });
            state.index++;
        }
        if (state.index >= state.queue.length) finish();
        else centreCursor();
    }

    function undo() {
        if (!state.rules.allowUndo) return false;
        const last = state.history.pop();
        if (!last) return false;
        if (last.kind === 'place') {
            CY.grid.remove(state.grid, last.id);
            if (state.mode === 'mission') state.index = last.index;
            state.status = 'playing';
            state.result = null;
            CY.emit('game:removed', { id: last.id });
        }
        publish();
        return true;
    }

    // Sandbox only: lift a box back out of the yard, provided nothing is
    // resting on it. The reach stacker uses this too.
    function removePiece(id) {
        const carried = CY.grid.supportedBy(state.grid, id);
        if (carried.length > 0) {
            CY.emit('game:message', { text: 'Something is stacked on that one.', tone: 'bad' });
            return null;
        }
        const entry = CY.grid.remove(state.grid, id);
        if (entry) {
            CY.emit('game:removed', { id: id });
            publish();
        }
        return entry;
    }

    function clear() {
        const ids = state.grid.pieces.map(function (p) { return p.id; });
        ids.forEach(function (id) {
            CY.grid.remove(state.grid, id);
            CY.emit('game:removed', { id: id });
        });
        state.history = [];
        publish();
    }

    // ── Finishing ───────────────────────────────────────────────────────

    function finish() {
        const result = CY.score.evaluate(state.grid, {
            rules: state.rules,
            abandoned: state.abandoned
        });
        if (state.mode === 'mission') {
            const par = state.par || CY.missions.parFor(state.mission);
            result.par = par;
            result.stars = CY.score.rate(result.score, par);
            result.mission = state.mission;
            const progress = CY.save.record(state.missionId, result.stars, result.score);
            result.progress = progress;
            const nxt = CY.missions.next(state.missionId);
            result.next = (nxt && result.stars > 0) ? nxt.id : null;
        }
        state.status = 'complete';
        state.result = result;
        CY.emit('game:complete', result);
        return result;
    }

    // Live metrics for the HUD, recomputed whenever the yard changes. Cheap:
    // the whole yard is at most a few hundred cells.
    function publish() {
        const metrics = CY.score.evaluate(state.grid, { rules: state.rules });
        if (state.mode === 'mission') {
            metrics.par = state.par || null;
            metrics.remaining = Math.max(0, state.queue.length - state.index);
        }
        CY.emit('game:metrics', metrics);
        CY.emit('game:queue', {
            current: currentEntry(),
            upcoming: upcoming(),
            index: state.index,
            total: state.queue.length
        });
        CY.emit('game:cursor', preview());
        return metrics;
    }

    CY.game = {
        state: state,
        startSandbox: startSandbox,
        startMission: startMission,
        currentEntry: currentEntry,
        currentDef: currentDef,
        upcoming: upcoming,
        setSandboxPiece: setSandboxPiece,
        rotatedCells: rotatedCells,
        setCursor: setCursor,
        nudge: nudge,
        centreCursor: centreCursor,
        rotate: rotate,
        preview: preview,
        place: place,
        undo: undo,
        removePiece: removePiece,
        clear: clear,
        finish: finish,
        publish: publish
    };

})(window);
