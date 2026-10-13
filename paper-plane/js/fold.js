// Paper Plane Glider — folding a sheet of paper, and measuring what you made.
// No DOM.
//
// The sheet is a stack of flat facets, each a polygon in millimetres with a
// layer number (z) and the affine map that took it there from the flat sheet
// (so the printed grid can be drawn folding with it). A fold is what your
// hands do: pick a point on the paper and put it somewhere else. The crease is
// the line half-way between the two, and everything on the picked side that
// is joined to what you picked turns over the crease and lands on top.
//
// "Joined" is the part that makes it paper rather than geometry. Two facets
// are joined if they share an edge — an old crease, or the line a facet was
// cut along. So grabbing a corner where three layers meet at a crease takes
// all three; grabbing the tip of a flap lying loose on top takes just the
// flap, the way your fingers would.
//
// The sheet is A4 portrait with the nose end at y = 0 and the centre line at
// x = 0, which is where the plane will be folded in half.

export const SHEET = { w: 210, h: 297, gsm: 80 };
export const SHEET_MASS = SHEET.w * SHEET.h * 1e-6 * SHEET.gsm / 1000;  // kg, ~5 g

const EPS = 1e-7;

export function newSheet() {
    const hw = SHEET.w / 2;
    return {
        facets: [{ id: 0, pts: [[-hw, 0], [hw, 0], [hw, SHEET.h], [-hw, SHEET.h]], z: 0, face: 0, m: [1, 0, 0, 1, 0, 0] }],
        nextId: 1,
        folds: [],
    };
}

/* ── Geometry helpers ── */
export function area(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        a += x1 * y2 - x2 * y1;
    }
    return a / 2;
}

export function centroid(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        const c = x1 * y2 - x2 * y1;
        a += c;
        cx += (x1 + x2) * c;
        cy += (y1 + y2) * c;
    }
    a /= 2;
    if (Math.abs(a) < EPS) return [pts[0][0], pts[0][1]];
    return [cx / (6 * a), cy / (6 * a)];
}

export function contains(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

function distToSegment(px, py, [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy;
    let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPolygon(pts, x, y) {
    if (contains(pts, x, y)) return 0;
    let d = Infinity;
    for (let i = 0; i < pts.length; i++) d = Math.min(d, distToSegment(x, y, pts[i], pts[(i + 1) % pts.length]));
    return d;
}

/** The part of a polygon where s(p) <= 0 (sign = -1) or >= 0 (sign = 1). */
function clip(pts, s, sign) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const sa = s(a) * sign, sb = s(b) * sign;
        if (sa >= 0) out.push(a);
        if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)) {
            const t = sa / (sa - sb);
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
    }
    return dedupe(out);
}

function dedupe(pts) {
    const out = [];
    for (const p of pts) {
        const q = out[out.length - 1];
        if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6) out.push(p);
    }
    if (out.length > 1) {
        const a = out[0], b = out[out.length - 1];
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) out.pop();
    }
    return out;
}

/** Do two segments lie along the same line and overlap by more than a sliver? */
function sharesEdge(a, b, c, d) {
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const L = Math.hypot(ux, uy);
    if (L < 0.3) return false;
    const off = (p) => Math.abs(ux * (p[1] - a[1]) - uy * (p[0] - a[0])) / L;
    if (off(c) > 0.25 || off(d) > 0.25) return false;
    const t = (p) => ((p[0] - a[0]) * ux + (p[1] - a[1]) * uy) / L;
    const lo = Math.max(0, Math.min(t(c), t(d))), hi = Math.min(L, Math.max(t(c), t(d)));
    return hi - lo > 0.5;
}

/** Joined along a real edge. Edges lying on the crease being made are where
    the pieces were just cut, not where the paper holds them together: two
    loose layers cut by the same fold line are still two loose layers. */
function joined(p, q, onCrease) {
    for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        if (onCrease(a) && onCrease(b)) continue;
        for (let j = 0; j < q.length; j++) {
            if (sharesEdge(a, b, q[j], q[(j + 1) % q.length])) return true;
        }
    }
    return false;
}

/** Composes a reflection across the line through P with unit normal n onto
    an affine map [a, b, c, d, e, f] (canvas order). */
function reflectMatrix(m, P, n) {
    const r00 = 1 - 2 * n[0] * n[0], r01 = -2 * n[0] * n[1], r11 = 1 - 2 * n[1] * n[1];
    const k = 2 * (P[0] * n[0] + P[1] * n[1]);
    const [a, b, c, d, e, f] = m;
    return [
        r00 * a + r01 * b, r01 * a + r11 * b,
        r00 * c + r01 * d, r01 * c + r11 * d,
        r00 * e + r01 * f + k * n[0], r01 * e + r11 * f + k * n[1],
    ];
}

export function bounds(paper) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of paper.facets) for (const [x, y] of f.pts) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return { x0, y0, x1, y1 };
}

/** The topmost facet under (x, y), or one within `tol` mm of it. */
export function facetAt(paper, x, y, tol = 2) {
    let best = null;
    for (const f of paper.facets) {
        if (distToPolygon(f.pts, x, y) <= tol && (!best || f.z > best.z)) best = f;
    }
    return best;
}

/* ── Folding ── */

/** Works out a fold without applying it: the crease, and the pieces that
    would move. Returns null if nothing sensible would happen. */
export function planFold(paper, S, T) {
    const dx = T[0] - S[0], dy = T[1] - S[1];
    const L = Math.hypot(dx, dy);
    if (L < 2) return null;
    const n = [dx / L, dy / L];
    const P = [(S[0] + T[0]) / 2, (S[1] + T[1]) / 2];
    const s = (p) => (p[0] - P[0]) * n[0] + (p[1] - P[1]) * n[1];

    const picked = facetAt(paper, S[0], S[1]);
    if (!picked) return null;

    const pieces = [];
    for (const f of paper.facets) {
        const neg = clip(f.pts, s, -1);
        const pos = clip(f.pts, s, 1);
        pieces.push({
            f,
            neg: neg.length >= 3 && Math.abs(area(neg)) > 0.3 ? neg : null,
            pos: pos.length >= 3 && Math.abs(area(pos)) > 0.3 ? pos : null,
        });
    }
    const onCrease = (p) => Math.abs(s(p)) < 0.05;
    const seed = pieces.find(p => p.f === picked);
    if (!seed || !seed.neg) return null;

    // Everything on the moving side joined to what was picked.
    const moving = new Set([seed]);
    const queue = [seed];
    const candidates = pieces.filter(p => p.neg);
    while (queue.length) {
        const cur = queue.pop();
        for (const other of candidates) {
            if (moving.has(other)) continue;
            if (joined(cur.neg, other.neg, onCrease)) { moving.add(other); queue.push(other); }
        }
    }
    return { S, T, P, n, s, pieces, moving };
}

/** Applies a fold. `under` folds the flap behind the paper instead of over
    it, which only changes which layers end up on top. */
export function fold(paper, S, T, under = false) {
    const plan = planFold(paper, S, T);
    if (!plan) return null;
    const { P, n, pieces, moving } = plan;
    let zMax = -Infinity, zMin = Infinity, mMax = -Infinity, mMin = Infinity;
    for (const f of paper.facets) { zMax = Math.max(zMax, f.z); zMin = Math.min(zMin, f.z); }
    for (const p of moving) { mMax = Math.max(mMax, p.f.z); mMin = Math.min(mMin, p.f.z); }

    let nextId = paper.nextId;
    const facets = [];
    for (const piece of pieces) {
        const f = piece.f;
        if (!moving.has(piece)) { facets.push(f); continue; }
        if (piece.pos) facets.push({ ...f, id: nextId++, pts: piece.pos });
        const reflected = piece.neg.map(([x, y]) => {
            const d = (x - P[0]) * n[0] + (y - P[1]) * n[1];
            return [x - 2 * d * n[0], y - 2 * d * n[1]];
        }).reverse();
        // Turned over, the flap's layers land in reverse order: the one that
        // was on top of the pile is now at the bottom of the flap.
        const z = under ? zMin - 1 - (f.z - mMin) : zMax + 1 + (mMax - f.z);
        facets.push({ id: nextId++, pts: reflected, z, face: 1 - f.face, m: reflectMatrix(f.m, P, n) });
    }
    // Renumber layers to small integers, keeping order — on copies, never on
    // facets the previous sheet still holds.
    const zs = [...new Set(facets.map(f => f.z))].sort((a, b) => a - b);
    const renumbered = facets.map(f => {
        const z = zs.indexOf(f.z);
        return z === f.z ? f : { ...f, z };
    });
    return { facets: renumbered, nextId, folds: [...paper.folds, { S, T, under }] };
}

export const mirrorPoint = ([x, y]) => [-x, y];

/** A fold and its mirror image across the centre line, the way a paper
    plane is folded. A fold straight across the centre is done once. Returns
    { paper } or { error }. */
export function foldMirrored(paper, S, T, under = false) {
    const onCentre = Math.abs(S[0]) < 0.75 && Math.abs(T[0]) < 0.75;
    if (onCentre) {
        const p = fold(paper, [0, S[1]], [0, T[1]], under);
        return p ? { paper: p } : { error: 'nothing' };
    }
    // The crease must not cross the centre line inside the paper, or the two
    // halves would fold into each other.
    const dx = T[0] - S[0], dy = T[1] - S[1];
    const L = Math.hypot(dx, dy);
    const n = [dx / L, dy / L], P = [(S[0] + T[0]) / 2, (S[1] + T[1]) / 2];
    const b = bounds(paper);
    if (Math.abs(n[1]) > 1e-9) {
        const y0 = (P[0] * n[0] + P[1] * n[1]) / n[1];
        if (y0 > b.y0 + 0.75 && y0 < b.y1 - 0.75) return { error: 'crosses' };
    } else if (Math.abs(P[0]) < 0.75) return { error: 'crosses' };
    const once = fold(paper, S, T, under);
    if (!once) return { error: 'nothing' };
    const twice = fold(once, mirrorPoint(S), mirrorPoint(T), under);
    if (!twice) return { error: 'nothing' };
    // One user action, one entry in the history.
    twice.folds = [...paper.folds, { S, T, under, mirrored: true }];
    return { paper: twice };
}

/* ── Snapping ──
   Where a dragged point wants to land: the centre line, a corner, a crease
   end, or anywhere on an existing edge — the places you would line paper up
   against. Returns the snapped point and what it snapped to. */
export function snapTarget(paper, T, tol) {
    let best = null;
    const consider = (p, kind, d) => { if (d <= tol && (!best || d < best.d - 0.01)) best = { p, kind, d }; };
    for (const f of paper.facets) {
        for (const v of f.pts) consider(v, 'corner', Math.hypot(v[0] - T[0], v[1] - T[1]));
    }
    if (!best) {
        consider([0, T[1]], 'centre', Math.abs(T[0]));
        for (const f of paper.facets) {
            for (let i = 0; i < f.pts.length; i++) {
                const a = f.pts[i], b = f.pts[(i + 1) % f.pts.length];
                const dx = b[0] - a[0], dy = b[1] - a[1];
                const L2 = dx * dx + dy * dy;
                if (L2 < 1) continue;
                const t = Math.max(0, Math.min(1, ((T[0] - a[0]) * dx + (T[1] - a[1]) * dy) / L2));
                const p = [a[0] + t * dx, a[1] + t * dy];
                consider(p, 'edge', Math.hypot(p[0] - T[0], p[1] - T[1]) * 1.5);
            }
        }
    }
    return best ? { p: best.p, kind: best.kind } : { p: T, kind: null };
}

/** Where a press on the paper grabs: the nearest corner of any facet near
    the top of the pile, else the point itself. */
export function snapGrab(paper, S, tol) {
    let best = null;
    for (const f of paper.facets) {
        for (const v of f.pts) {
            const d = Math.hypot(v[0] - S[0], v[1] - S[1]);
            if (d <= tol && (!best || d < best.d - 0.5 || (Math.abs(d - best.d) <= 0.5 && f.z > best.z))) best = { p: v, d, z: f.z };
        }
    }
    return best ? best.p : S;
}

/* ── Measuring what was made ──
   Rasterised at 2 mm: how many layers of paper lie over each point. From
   that come the planform (where there is paper at all), and from the facets
   themselves the exact centre of gravity. */
export const CELL = 2;

export function analyze(paper) {
    const b = bounds(paper);
    // Cell centres on even millimetres, symmetric about the centre line: the
    // sheet's edges (±105) fall between them, never on one, where the
    // inside test would count the left edge and not the right and every
    // plane would lean left.
    const x0 = Math.floor((b.x0 + 1) / CELL) * CELL - 1, y0 = Math.floor(b.y0 / CELL) * CELL;
    const nx = Math.ceil((b.x1 - x0) / CELL), ny = Math.ceil((b.y1 - y0) / CELL);
    const layers = new Uint8Array(nx * ny);
    let A = 0, cx = 0, cy = 0;
    for (const f of paper.facets) {
        const a = Math.abs(area(f.pts));
        const [fx, fy] = centroid(f.pts);
        A += a; cx += a * fx; cy += a * fy;
        let fx0 = Infinity, fy0 = Infinity, fx1 = -Infinity, fy1 = -Infinity;
        for (const [x, y] of f.pts) { fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); fy0 = Math.min(fy0, y); fy1 = Math.max(fy1, y); }
        const i0 = Math.max(0, Math.floor((fx0 - x0) / CELL)), i1 = Math.min(nx - 1, Math.floor((fx1 - x0) / CELL));
        const j0 = Math.max(0, Math.floor((fy0 - y0) / CELL)), j1 = Math.min(ny - 1, Math.floor((fy1 - y0) / CELL));
        for (let j = j0; j <= j1; j++) {
            const y = y0 + (j + 0.5) * CELL;
            for (let i = i0; i <= i1; i++) {
                if (contains(f.pts, x0 + (i + 0.5) * CELL, y)) layers[j * nx + i]++;
            }
        }
    }
    return { x0, y0, nx, ny, layers, cg: [cx / A, cy / A], area: A, bounds: b, folds: paper.folds.length };
}

/** The plane you get by folding this sheet in half along the centre and
    each wing down at `keel` mm from it: wing area and span, the mean chord,
    where the lift acts (the wing's aerodynamic centre: each strip's quarter
    chord, weighted by chord), and how lopsided it is. Lengths in mm. */
export function wingStats(an, keel) {
    const { x0, y0, nx, ny, layers } = an;
    let S = 0, acSum = 0, cSum = 0, c2Sum = 0, xr = -Infinity, xl = Infinity;
    let keelArea = 0, asym = 0, covered = 0;
    let yMin = Infinity, yMax = -Infinity;
    const te = new Map();   // column -> trailing edge y, for the elevator
    for (let i = 0; i < nx; i++) {
        const x = x0 + (i + 0.5) * CELL;
        let count = 0, le = Infinity, last = -Infinity;
        for (let j = 0; j < ny; j++) {
            if (!layers[j * nx + i]) continue;
            const y = y0 + (j + 0.5) * CELL;
            count++;
            covered++;
            if (y < le) le = y;
            if (y > last) last = y;
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
            // Lopsidedness: paper here with none at the mirror image.
            const mi = Math.round((-x - x0) / CELL - 0.5);
            if (mi < 0 || mi >= nx || !layers[j * nx + mi]) asym++;
        }
        if (!count) continue;
        const chord = count * CELL;
        if (Math.abs(x) <= keel) { keelArea += chord * CELL; continue; }
        S += chord * CELL;
        acSum += chord * (le + 0.25 * chord);
        cSum += chord;
        c2Sum += chord * chord;
        te.set(i, last + CELL / 2);
        if (x > 0) xr = Math.max(xr, x + CELL / 2); else xl = Math.min(xl, x - CELL / 2);
    }
    const right = xr > keel ? xr - keel : 0, left = xl < -keel ? -xl - keel : 0;
    const span = right + left;
    return {
        area: S,
        span,
        halfSpan: Math.max(right, left),
        aspect: S > 0 ? span * span / S : 0,
        mac: cSum > 0 ? c2Sum / cSum : 0,
        yAc: cSum > 0 ? acSum / cSum : (yMin + yMax) / 2,
        keelArea,
        nose: yMin - CELL / 2,
        tail: yMax + CELL / 2,
        asymmetry: covered ? asym / covered : 0,
        te,
    };
}

/* ── Folds as steps ──────────────────────────────────────────────────────
   A design is a list of steps, and most steps are not coordinates but
   intentions — "the top corners to the centre", "the nose down 105 mm" —
   worked out against whatever the paper looks like when their turn comes.
   That is what lets steps be reordered, tuned and dropped: the same step
   finds its corner on a fresh sheet or on one already folded twice.

     corner  the top outer corners folded in to the centre line. `reach` 1
             creases through the nose point (the classic dart fold); less
             lands the corner higher up the centre line, so the corners meet
             before the nose (the Nakamura).
     nose    the nose point folded straight down the centre line by `d` mm.
     tip     the lowest loose point on the centre line folded back up `d` mm
             — the lock that holds a folded-down nose in place.
     free    anything else: pick up S, put it on T.
   Any step can be `under` (folded behind instead of over). */

export const STEP_KINDS = {
    corner: { label: 'Corners to the centre', param: 'reach', min: 0.5, max: 1, step: 0.01, def: 1 },
    nose: { label: 'Nose down', param: 'd', min: 20, max: 260, step: 1, def: 105 },
    tip: { label: 'Tip back up (lock)', param: 'd', min: 10, max: 90, step: 1, def: 45 },
    free: { label: 'Free fold' },
};

/** The topmost point of paper on the centre line: the nose. */
export function nosePoint(paper) {
    let best = Infinity;
    for (const f of paper.facets) {
        const pts = f.pts;
        for (let i = 0; i < pts.length; i++) {
            const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
            if (Math.abs(x1) < 0.05) best = Math.min(best, y1);
            if ((x1 < 0) !== (x2 < 0) && Math.abs(x2 - x1) > 1e-9) {
                const t = -x1 / (x2 - x1);
                best = Math.min(best, y1 + (y2 - y1) * t);
            }
        }
    }
    return [0, best];
}

/** The outer corner nearest the nose on the left: the leftmost point of the
    front of the sheet, the highest of those if there are several. Only the
    front 60% counts — the tail corners are wings, not something you fold to
    the centre — so on a sheet with its front corners already folded away
    there is none, and a corner step there is skipped. */
export function topCorner(paper) {
    const b = bounds(paper);
    const front = b.y0 + (b.y1 - b.y0) * 0.6;
    let best = null;
    for (const f of paper.facets) for (const v of f.pts) {
        if (v[0] > -0.5 || v[1] > front) continue;
        if (!best || v[0] < best[0] - 0.5 || (Math.abs(v[0] - best[0]) <= 0.5 && v[1] < best[1])) best = v;
    }
    return best;
}

/** The lowest point on the centre line that belongs to a folded layer
    (not the bottom sheet): the tip of a nose folded down. */
export function lowTip(paper) {
    let zMin = Infinity;
    for (const f of paper.facets) zMin = Math.min(zMin, f.z);
    let best = null;
    for (const f of paper.facets) {
        if (f.z === zMin) continue;
        for (const v of f.pts) if (Math.abs(v[0]) < 0.05 && (!best || v[1] > best[1])) best = v;
    }
    return best;
}

/** Where a step's fold goes on this paper: { S, T, mirrored, under }, or
    null if it has nothing to fold here. */
export function resolveStep(paper, step) {
    const under = !!step.under;
    if (step.kind === 'free') return { S: step.S, T: step.T, mirrored: step.mirrored !== false, under };
    if (step.kind === 'corner') {
        const S = topCorner(paper);
        if (!S) return null;
        const A = nosePoint(paper);
        const r = Math.max(0.3, Math.min(1.2, step.reach ?? 1));
        const T = [0, A[1] + Math.hypot(S[0] - A[0], S[1] - A[1]) * r];
        return { S, T, mirrored: true, under };
    }
    if (step.kind === 'nose') {
        const A = nosePoint(paper);
        if (!Number.isFinite(A[1])) return null;
        return { S: A, T: [0, A[1] + (step.d ?? 105)], mirrored: false, under };
    }
    if (step.kind === 'tip') {
        const P = lowTip(paper);
        if (!P) return null;
        return { S: P, T: [0, P[1] - (step.d ?? 45)], mirrored: false, under };
    }
    return null;
}

/** One step on a paper: the folded paper, or null if it would not fold. */
export function applyStep(paper, step) {
    const r = resolveStep(paper, step);
    if (!r) return null;
    if (r.mirrored && !(Math.abs(r.S[0]) < 0.75 && Math.abs(r.T[0]) < 0.75)) {
        const m = foldMirrored(paper, r.S, r.T, r.under);
        return m.paper || null;
    }
    return fold(paper, r.S, r.T, r.under);
}

/** Folds a whole design from a fresh sheet. A step that has nothing to fold
    where it now sits in the order is skipped, not fatal, and reported. */
export function build(steps) {
    let paper = newSheet();
    const ok = [];
    for (const st of steps) {
        const next = applyStep(paper, st);
        ok.push(!!next);
        if (next) paper = next;
    }
    return { paper, ok };
}

/** What a dragged fold was, if it was one of the named ones: the top corner
    put on the centre line is a corner step, the nose put lower on the centre
    line is a nose step, and so on. Anything else is a free fold. */
export function recognise(paper, S, T, mirrored, under) {
    const close = (a, b, t = 3) => a && b && Math.hypot(a[0] - b[0], a[1] - b[1]) < t;
    const onCentre = Math.abs(T[0]) < 0.75;
    const C = topCorner(paper), A = nosePoint(paper), L = lowTip(paper);
    const Sl = S[0] > 0.5 ? mirrorPoint(S) : S;
    if (mirrored && onCentre && close(Sl, C)) {
        const reach = (T[1] - A[1]) / Math.hypot(C[0] - A[0], C[1] - A[1]);
        if (reach >= 0.3 && reach <= 1.2) return { kind: 'corner', reach: Math.round(reach * 100) / 100, under };
    }
    if (onCentre && Math.abs(S[0]) < 0.75 && close(S, A) && T[1] > S[1]) return { kind: 'nose', d: Math.round(T[1] - S[1]), under };
    if (onCentre && Math.abs(S[0]) < 0.75 && close(S, L) && T[1] < S[1]) return { kind: 'tip', d: Math.round(S[1] - T[1]), under };
    return { kind: 'free', S: [round2(S[0]), round2(S[1])], T: [round2(T[0]), round2(T[1])], mirrored, under };
}

const round2 = (v) => Math.round(v * 2) / 2;

export function describeStep(step) {
    const u = step.under ? ', behind' : '';
    if (step.kind === 'corner') return (step.reach ?? 1) >= 0.99 ? `Corners to the centre${u}` : `Corners to the centre, meeting ${Math.round((1 - step.reach) * 100)}% short${u}`;
    if (step.kind === 'nose') return `Nose ${step.under ? 'under' : 'down'} ${step.d} mm`;
    if (step.kind === 'tip') return `Tip back up ${step.d} mm`;
    return `Free fold${step.mirrored === false ? ', one side' : ''}${u}`;
}

export function sameStep(a, b) {
    if (a.kind !== b.kind || !!a.under !== !!b.under) return false;
    if (a.kind === 'corner') return Math.abs((a.reach ?? 1) - (b.reach ?? 1)) < 0.04;
    if (a.kind === 'nose' || a.kind === 'tip') return Math.abs(a.d - b.d) < 8;
    const c = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 4;
    return c(a.S, b.S) && c(a.T, b.T);
}

/* ── Designs ──
   Each step is a fold as (S, T): pick up S, put it on T, mirrored unless the
   fold runs straight across. They are written against an A4 sheet and are
   what the guide shows and "Show me" does. */
export const DESIGNS = [
    {
        id: 'dart', name: 'Classic Dart', keel: 30,
        blurb: 'The one everyone knows: sharp, quick and straight. Corners in twice.',
        steps: [
            { kind: 'corner', reach: 1, say: 'Fold the top corners down to the centre line.' },
            { kind: 'corner', reach: 1, say: 'Fold the new slanted edges in to the centre line too.' },
        ],
    },
    {
        id: 'glider', name: 'Wide Glider', keel: 22,
        blurb: 'A blunt nose and broad wings. Slow, floaty, forgiving.',
        steps: [
            { kind: 'corner', reach: 1, say: 'Fold the top corners down to the centre line.' },
            { kind: 'nose', d: 210, say: 'Fold the whole top triangle down, so the top edge is flat.' },
            { kind: 'corner', reach: 1, say: 'Fold the new top corners in to the centre line.' },
        ],
    },
    {
        id: 'nakamura', name: 'Nakamura Lock', keel: 24,
        blurb: 'A classic distance plane: a heavy, locked nose and a long glide.',
        steps: [
            { kind: 'corner', reach: 1, say: 'Fold the top corners down to the centre line.' },
            { kind: 'nose', d: 230, say: 'Fold the point down, past the bottom of the triangle.' },
            { kind: 'corner', reach: 0.67, say: 'Fold the corners in so they meet a little above the point, leaving its tip showing.' },
            { kind: 'tip', d: 50, say: 'Fold the little tip up over the corners. That is the lock.' },
        ],
    },
];

/* ── Sharing a plane in a link ──
   c<reach>, n<d>, t<d> for the named steps, f<sx>,<sy>,<tx>,<ty> for free
   ones; a trailing u folds behind, a trailing s is one-sided. */
export function encodeSteps(steps) {
    return steps.map(st => {
        let out;
        if (st.kind === 'corner') out = 'c' + (st.reach ?? 1);
        else if (st.kind === 'nose') out = 'n' + st.d;
        else if (st.kind === 'tip') out = 't' + st.d;
        else out = 'f' + [st.S[0], st.S[1], st.T[0], st.T[1]].map(round2).join(',') + (st.mirrored === false ? 's' : '');
        return out + (st.under ? 'u' : '');
    }).join(';');
}

export function decodeSteps(code) {
    if (typeof code !== 'string' || !code) return [];
    const out = [];
    for (const part of code.split(';').slice(0, 30)) {
        let m;
        if ((m = /^c([\d.]+)(u?)$/.exec(part))) out.push({ kind: 'corner', reach: Number(m[1]), under: !!m[2] });
        else if ((m = /^n(\d+)(u?)$/.exec(part))) out.push({ kind: 'nose', d: Number(m[1]), under: !!m[2] });
        else if ((m = /^t(\d+)(u?)$/.exec(part))) out.push({ kind: 'tip', d: Number(m[1]), under: !!m[2] });
        else if ((m = /^f(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(s?)(u?)$/.exec(part))) {
            const v = m.slice(1, 5).map(Number);
            if (!v.every(x => Number.isFinite(x) && Math.abs(x) < 1000)) return null;
            out.push({ kind: 'free', S: [v[0], v[1]], T: [v[2], v[3]], mirrored: m[5] !== 's', under: !!m[6] });
        } else return null;
        const st = out[out.length - 1];
        const k = STEP_KINDS[st.kind];
        if (k.param && !(st[k.param] >= k.min && st[k.param] <= k.max)) return null;
    }
    return out;
}
