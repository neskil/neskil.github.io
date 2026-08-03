(function (window) {
    'use strict';

    // The occupancy lattice. Everything the game knows about *where things are*
    // lives in here, in integer cells — the renderer only ever reads it.
    //
    // This module is the answer to the POC's original sin: it snapped every box
    // to a 2.5 m grid regardless of the box being 6 or 12 m long, so containers
    // interpenetrated and "stacking" was a y-offset guess. A cell is either
    // taken or it isn't.
    const CY = window.CY = window.CY || {};

    function create(w, d, h) {
        const g = {
            w: w, d: d, h: h,
            cells: new Int32Array(w * d * h).fill(-1), // -1 = empty, else piece id
            pieces: [],      // { id, pieceId, rot, origin:{x,y,z}, cells:[[x,y,z] world] }
            byId: Object.create(null),
            nextId: 1
        };
        return g;
    }

    function index(g, x, y, z) {
        return (y * g.d + z) * g.w + x;
    }

    function inBounds(g, x, y, z) {
        return x >= 0 && x < g.w && y >= 0 && y < g.h && z >= 0 && z < g.d;
    }

    function at(g, x, y, z) {
        if (!inBounds(g, x, y, z)) return -2; // out of yard
        return g.cells[index(g, x, y, z)];
    }

    // ── Shape maths ─────────────────────────────────────────────────────

    function normalise(cells) {
        let mx = Infinity, my = Infinity, mz = Infinity;
        cells.forEach(function (c) {
            if (c[0] < mx) mx = c[0];
            if (c[1] < my) my = c[1];
            if (c[2] < mz) mz = c[2];
        });
        return cells.map(function (c) { return [c[0] - mx, c[1] - my, c[2] - mz]; });
    }

    // Rotation is 90° steps about Y only. Containers do not get stood on end,
    // and restricting it to four orientations keeps the ghost preview and the
    // solver-ish "is there anywhere legal left" check cheap.
    function rotate(cells, rot) {
        let out = cells.map(function (c) { return c.slice(); });
        const times = ((rot % 4) + 4) % 4;
        for (let r = 0; r < times; r++) {
            out = out.map(function (c) { return [c[2], c[1], -c[0]]; });
        }
        return normalise(out);
    }

    function span(cells) {
        let maxX = 0, maxY = 0, maxZ = 0;
        cells.forEach(function (c) {
            if (c[0] > maxX) maxX = c[0];
            if (c[1] > maxY) maxY = c[1];
            if (c[2] > maxZ) maxZ = c[2];
        });
        return { x: maxX + 1, y: maxY + 1, z: maxZ + 1 };
    }

    // Distinct orientations — a 2×1 line has 2, not 4. Used by the queue to
    // decide whether the rotate button does anything, and by hasLegalMove.
    function orientations(cells) {
        const seen = Object.create(null);
        const out = [];
        for (let r = 0; r < 4; r++) {
            const c = rotate(cells, r);
            const key = c.map(function (v) { return v.join(','); }).sort().join('|');
            if (!seen[key]) { seen[key] = true; out.push(r); }
        }
        return out;
    }

    function worldCells(cells, ox, oy, oz) {
        return cells.map(function (c) { return [c[0] + ox, c[1] + oy, c[2] + oz]; });
    }

    // ── Queries ─────────────────────────────────────────────────────────

    function fits(g, cells, ox, oy, oz) {
        for (let i = 0; i < cells.length; i++) {
            const x = cells[i][0] + ox, y = cells[i][1] + oy, z = cells[i][2] + oz;
            if (!inBounds(g, x, y, z)) return false;
            if (g.cells[index(g, x, y, z)] !== -1) return false;
        }
        return true;
    }

    // The cells of the piece that have nothing of their own directly beneath
    // them — its actual footprint on whatever it lands on.
    function underside(cells) {
        const own = Object.create(null);
        cells.forEach(function (c) { own[c.join(',')] = true; });
        return cells.filter(function (c) {
            return !own[[c[0], c[1] - 1, c[2]].join(',')];
        });
    }

    // 0..1 — how much of the underside is actually carried. Ground counts as
    // full support; open air does not.
    function supportRatio(g, cells, ox, oy, oz) {
        const base = underside(cells);
        if (base.length === 0) return 1;
        let carried = 0;
        base.forEach(function (c) {
            const x = c[0] + ox, y = c[1] + oy, z = c[2] + oz;
            if (y === 0) { carried++; return; }
            if (at(g, x, y - 1, z) >= 0) carried++;
        });
        return carried / base.length;
    }

    // Gravity: the lowest tier the piece can rest at over this footprint.
    // Returns -1 if the column is full.
    function dropY(g, cells, ox, oz) {
        const s = span(cells);
        let best = -1;
        for (let y = 0; y <= g.h - s.y; y++) {
            if (!fits(g, cells, ox, y, oz)) continue;
            if (y === 0 || supportRatio(g, cells, ox, y, oz) > 0) { best = y; break; }
        }
        if (best === -1) {
            // Nothing to rest on below, but it may still fit floating high up —
            // that is not a legal drop, so report the highest free slot as -1.
            return -1;
        }
        return best;
    }

    // Would anything of this piece sit on top of a piece flagged noTop?
    function crushesNoTop(g, cells, ox, oy, oz) {
        const own = Object.create(null);
        cells.forEach(function (c) { own[[c[0] + ox, c[1] + oy, c[2] + oz].join(',')] = true; });
        for (let i = 0; i < cells.length; i++) {
            const x = cells[i][0] + ox, y = cells[i][1] + oy, z = cells[i][2] + oz;
            if (own[[x, y - 1, z].join(',')]) continue;
            const below = at(g, x, y - 1, z);
            if (below >= 0) {
                const p = g.byId[below];
                const def = p && CY.piece(p.pieceId);
                if (def && def.noTop) return true;
            }
        }
        return false;
    }

    // ── Mutation ────────────────────────────────────────────────────────

    function place(g, pieceId, cells, ox, oy, oz, tag) {
        const id = g.nextId++;
        const wc = worldCells(cells, ox, oy, oz);
        wc.forEach(function (c) { g.cells[index(g, c[0], c[1], c[2])] = id; });
        const entry = {
            id: id,
            pieceId: pieceId,
            rot: 0,
            tag: tag || null,
            origin: { x: ox, y: oy, z: oz },
            local: cells,
            cells: wc
        };
        g.pieces.push(entry);
        g.byId[id] = entry;
        return entry;
    }

    function remove(g, id) {
        const entry = g.byId[id];
        if (!entry) return null;
        entry.cells.forEach(function (c) {
            if (g.cells[index(g, c[0], c[1], c[2])] === id) {
                g.cells[index(g, c[0], c[1], c[2])] = -1;
            }
        });
        const i = g.pieces.indexOf(entry);
        if (i > -1) g.pieces.splice(i, 1);
        delete g.byId[id];
        return entry;
    }

    // Anything resting (even partly) on this piece. Used to refuse pulling a
    // box out from under a stack, in sandbox and by the reach stacker.
    function supportedBy(g, id) {
        const entry = g.byId[id];
        if (!entry) return [];
        const own = Object.create(null);
        entry.cells.forEach(function (c) { own[c.join(',')] = true; });
        const out = Object.create(null);
        entry.cells.forEach(function (c) {
            const above = at(g, c[0], c[1] + 1, c[2]);
            if (above >= 0 && !own[[c[0], c[1] + 1, c[2]].join(',')]) out[above] = true;
        });
        return Object.keys(out).map(Number);
    }

    function isBuried(g, id) {
        return supportedBy(g, id).length > 0;
    }

    // A reefer needs its plug reachable: at least one cell with open air (or
    // the yard edge) directly to its side.
    function hasSideAccess(g, id) {
        const entry = g.byId[id];
        if (!entry) return false;
        const own = Object.create(null);
        entry.cells.forEach(function (c) { own[c.join(',')] = true; });
        const dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
        for (let i = 0; i < entry.cells.length; i++) {
            const c = entry.cells[i];
            for (let dI = 0; dI < dirs.length; dI++) {
                const dd = dirs[dI];
                const key = [c[0] + dd[0], c[1], c[2] + dd[2]].join(',');
                if (own[key]) continue;
                const v = at(g, c[0] + dd[0], c[1], c[2] + dd[2]);
                if (v === -2 || v === -1) return true; // yard edge or open air
            }
        }
        return false;
    }

    // ── Aggregates ──────────────────────────────────────────────────────

    function extents(g) {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
        let count = 0;
        g.pieces.forEach(function (p) {
            p.cells.forEach(function (c) {
                count++;
                if (c[0] < minX) minX = c[0];
                if (c[0] > maxX) maxX = c[0];
                if (c[2] < minZ) minZ = c[2];
                if (c[2] > maxZ) maxZ = c[2];
                if (c[1] > maxY) maxY = c[1];
            });
        });
        if (count === 0) return { empty: true, count: 0, spanX: 0, spanY: 0, spanZ: 0 };
        return {
            empty: false, count: count,
            minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ, maxY: maxY,
            spanX: maxX - minX + 1,
            spanZ: maxZ - minZ + 1,
            // Height is always measured from the ground: a tower is not allowed
            // to score as if it floated.
            spanY: maxY + 1
        };
    }

    // Is there anywhere at all this shape could legally go? Drives the
    // "abandon piece" fail check rather than letting the player get stuck.
    function hasLegalMove(g, cells, rules) {
        rules = rules || CY.RULES;
        const rots = orientations(cells);
        for (let r = 0; r < rots.length; r++) {
            const rc = rotate(cells, rots[r]);
            const s = span(rc);
            for (let x = 0; x <= g.w - s.x; x++) {
                for (let z = 0; z <= g.d - s.z; z++) {
                    const y = dropY(g, rc, x, z);
                    if (y < 0) continue;
                    if (y + s.y > rules.maxTier) continue;
                    if (supportRatio(g, rc, x, y, z) < rules.minSupport) continue;
                    if (crushesNoTop(g, rc, x, y, z)) continue;
                    return true;
                }
            }
        }
        return false;
    }

    CY.grid = {
        create: create,
        inBounds: inBounds,
        at: at,
        normalise: normalise,
        rotate: rotate,
        span: span,
        orientations: orientations,
        worldCells: worldCells,
        fits: fits,
        underside: underside,
        supportRatio: supportRatio,
        dropY: dropY,
        crushesNoTop: crushesNoTop,
        place: place,
        remove: remove,
        supportedBy: supportedBy,
        isBuried: isBuried,
        hasSideAccess: hasSideAccess,
        extents: extents,
        hasLegalMove: hasLegalMove
    };

})(window);
