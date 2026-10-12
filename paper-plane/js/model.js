// Paper Plane Glider — the folded sheet as a 3D plane, and drawing it.
//
// The flat folded sheet is folded in half along the centre line and each
// wing down at the keel line; tips can be turned up into winglets and the
// trailing edge bent for the elevator. Every facet is cut along those lines
// first, so each piece maps into 3D as a flat polygon (the elevator bend is
// the one place a piece is tilted rather than folded, which is how bent paper
// looks anyway).

import { wingStats } from './fold.js';

const D2R = Math.PI / 180;
const DIHEDRAL = 4 * D2R;
const WINGLET = 75 * D2R;
const WINGLET_MM = 15;
const ELEVATOR_MM = 18;
const ELEVATOR_MAX = 18 * D2R;

function cut(pts, coord, at) {
    const s = (p) => p[coord] - at;
    const side = (sign) => {
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
        return out.length >= 3 ? [out] : [];
    };
    return [...side(-1), ...side(1)];
}

/** The plane in millimetres: X across (right wing positive), Y along (nose
    at the small end), Z up. Returns polygons with their facet's face and
    layer, plus the balance and lift points for markers. */
export function buildModel(paper, an, trim) {
    const keel = trim.keel;
    const ws = wingStats(an, keel);
    const tipLine = trim.winglets ? keel + Math.max(10, ws.halfSpan - WINGLET_MM) : Infinity;
    const bendY = ws.tail - ELEVATOR_MM;
    const elev = Math.max(-1, Math.min(1, trim.elevator || 0)) * ELEVATOR_MAX;

    const polys = [];
    for (const f of paper.facets) {
        let pieces = [f.pts];
        for (const x of [0, keel, -keel]) pieces = pieces.flatMap(p => cut(p, 0, x));
        if (Number.isFinite(tipLine)) for (const x of [tipLine, -tipLine]) pieces = pieces.flatMap(p => cut(p, 0, x));
        pieces = pieces.flatMap(p => cut(p, 1, bendY));
        for (const p of pieces) {
            const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
            const cy = p.reduce((s, q) => s + q[1], 0) / p.length;
            const side = cx < 0 ? -1 : 1;
            const inKeel = Math.abs(cx) < keel;
            const layer = f.z * 0.18;
            const pts3 = p.map(([x, y]) => {
                const a = Math.abs(x);
                let X, Z;
                if (inKeel) {
                    // Both halves of the keel hang below the wings, back to back.
                    X = side * (0.4 + layer);
                    Z = -(keel - Math.min(a, keel));
                } else {
                    const out = Math.max(0, a - keel);
                    const flat = Math.min(out, tipLine - keel);
                    const up = Math.max(0, a - tipLine);
                    X = side * (flat * Math.cos(DIHEDRAL) + up * Math.cos(WINGLET));
                    Z = flat * Math.sin(DIHEDRAL) + up * Math.sin(WINGLET) + layer;
                    if (cy > bendY && y > bendY) Z += (y - bendY) * Math.tan(elev);
                }
                return [X, y, Z];
            });
            polys.push({ pts: pts3, face: f.face, z: f.z, keel: inKeel });
        }
    }
    return { polys, ws, keel, nose: ws.nose, tail: ws.tail };
}

/* ── Drawing ── */

/** Rotates by yaw (about Z) then pitch (about the X axis of the view) and
    projects with a gentle perspective. */
function projector(view) {
    const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    const cp = Math.cos(view.tilt), sp = Math.sin(view.tilt);
    const [ox, oy, oz] = view.centre;
    return ([x, y, z]) => {
        x -= ox; y -= oy; z -= oz;
        // yaw about vertical
        const x1 = x * cy - y * sy, y1 = x * sy + y * cy;
        // tilt towards the viewer
        const y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
        const d = view.distance;
        const k = d / (d + y2);
        return [view.cx + x1 * k * view.scale, view.cy - z2 * k * view.scale, y2];
    };
}

function normalOf(pts) {
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < pts.length; i++) {
        const [x1, y1, z1] = pts[i], [x2, y2, z2] = pts[(i + 1) % pts.length];
        nx += (y1 - y2) * (z1 + z2);
        ny += (z1 - z2) * (x1 + x2);
        nz += (x1 - x2) * (y1 + y2);
    }
    const L = Math.hypot(nx, ny, nz) || 1;
    return [nx / L, ny / L, nz / L];
}

const LIGHT = (() => { const v = [-0.35, -0.45, 0.82]; const L = Math.hypot(...v); return v.map(c => c / L); })();

/** Paints the model. `view`: { yaw, tilt, scale, cx, cy, distance, centre }. */
export function drawModel(ctx, model, view, opts = {}) {
    const P = projector(view);
    const faces = model.polys.map(poly => {
        const q = poly.pts.map(P);
        const depth = q.reduce((s, p) => s + p[2], 0) / q.length;
        const n = normalOf(poly.pts);
        const lit = Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        return { q, depth, lit, poly };
    });
    // Far first. Ties go to the lower layer, so folded flaps paint on top.
    faces.sort((a, b) => b.depth - a.depth || a.poly.z - b.poly.z);
    ctx.lineJoin = 'round';
    for (const f of faces) {
        const base = f.poly.face === 0 ? [236, 242, 250] : [250, 248, 243];
        const k = 0.62 + 0.38 * f.lit;
        ctx.fillStyle = `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
        ctx.lineWidth = opts.thin ? 0.6 : 0.9;
        ctx.beginPath();
        f.q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    if (opts.markers) {
        const dot = (p, colour, label) => {
            const [x, y] = P(p);
            ctx.fillStyle = colour;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f1420';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            if (label && opts.labels !== false) {
                ctx.font = '600 11px Inter, sans-serif';
                ctx.fillStyle = colour;
                ctx.fillText(label, x + 8, y + 4);
            }
        };
        dot([0, opts.markers.cg, -model.keel * 0.35], '#f97316', 'balance');
        dot([0, opts.markers.ac, 2], '#38bdf8', 'lift');
    }
}

/** The plane seen exactly from the side, nose to the right, for the flight
    view: returns a function that draws it at a screen point and pitch. */
export function sideSprite(model) {
    const mid = (model.nose + model.tail) / 2;
    // Seen from the right wing's side: Y becomes horizontal (nose right),
    // Z vertical. Painted keel first, then wings, so the wing edge reads.
    const shapes = model.polys
        .filter(p => p.pts.some(q => q[0] >= -0.01))
        .sort((a, b) => (a.keel === b.keel ? a.z - b.z : a.keel ? -1 : 1))
        .map(p => ({ pts: p.pts.map(([x, y, z]) => [mid - y, z]), keel: p.keel }));
    return (ctx, x, y, pitch, pxPerMm, alpha = 1) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.rotate(-pitch);
        ctx.scale(pxPerMm, -pxPerMm);
        ctx.lineJoin = 'round';
        for (const s of shapes) {
            ctx.fillStyle = s.keel ? '#e2e8f0' : '#f8fafc';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1 / pxPerMm;
            ctx.beginPath();
            s.pts.forEach(([u, v], i) => (i ? ctx.lineTo(u, v) : ctx.moveTo(u, v)));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    };
}
