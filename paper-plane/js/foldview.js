// Paper Plane Glider — the folding table. Draws the sheet, takes the drag
// that is a fold, previews where the flap will land, and animates the flap
// swinging over before handing the fold to the app to apply.
import { SHEET, planFold, facetAt, snapGrab, snapTarget, mirrorPoint, bounds } from './fold.js';

const FOLD_MS = 560;

export class FoldView {
    constructor(canvas, hooks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.hooks = hooks;           // { canFold(), mirror(), onFold(S, T), onMessage(text) }
        this.paper = null;
        this.cg = null;
        this.guide = null;            // { S, T, mirrored }
        this.drag = null;
        this.anim = null;
        this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.dpr = 1;
        new ResizeObserver(() => this.fit()).observe(canvas.parentElement);
        this.fit();
        canvas.addEventListener('pointerdown', (e) => this.down(e));
        canvas.addEventListener('pointermove', (e) => this.move(e));
        canvas.addEventListener('pointerup', (e) => this.up(e));
        canvas.addEventListener('pointercancel', () => { this.drag = null; this.draw(); });
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    fit() {
        const box = this.canvas.parentElement.getBoundingClientRect();
        this.dpr = Math.min(2, window.devicePixelRatio || 1);
        this.W = box.width;
        this.H = box.height;
        this.canvas.width = Math.floor(this.W * this.dpr);
        this.canvas.height = Math.floor(this.H * this.dpr);
        this.canvas.style.width = this.W + 'px';
        this.canvas.style.height = this.H + 'px';
        // The view holds the whole sheet whatever has been folded, so the
        // paper never jumps about between folds.
        // On a phone a bar with the next step sits at the bottom of the table;
        // keep the sheet clear of it.
        const bar = this.canvas.parentElement.querySelector('.stage-bar');
        const reserve = bar && bar.offsetParent ? bar.offsetHeight + 10 : 0;
        const pad = 26;
        this.scale = Math.min((this.W - pad * 2) / SHEET.w, (this.H - reserve - pad * 2) / SHEET.h);
        this.ox = this.W / 2;
        this.oy = (this.H - reserve - SHEET.h * this.scale) / 2;
        this.draw();
    }

    toPaper(e) {
        const r = this.canvas.getBoundingClientRect();
        return [(e.clientX - r.left - this.ox) / this.scale, (e.clientY - r.top - this.oy) / this.scale];
    }

    setPaper(paper, cg) { this.paper = paper; this.cg = cg; this.draw(); }
    setGuide(g) { this.guide = g; this.draw(); }

    /* ── Input ── */
    down(e) {
        if (!this.paper || this.anim || !this.hooks.canFold()) return;
        const p = this.toPaper(e);
        const mm = 1 / this.scale;
        if (!facetAt(this.paper, p[0], p[1], 14 * mm)) return;
        let S = snapGrab(this.paper, p, 18 * mm);
        // Close to the guide's start point: take it exactly.
        if (this.guide) {
            for (const g of this.guideStarts()) if (Math.hypot(g[0] - S[0], g[1] - S[1]) < 22 * mm) S = g;
        }
        this.canvas.setPointerCapture(e.pointerId);
        this.drag = { id: e.pointerId, S, T: S, snap: null };
        e.preventDefault();
    }

    guideStarts() {
        if (!this.guide) return [];
        return this.guide.mirrored ? [this.guide.S, mirrorPoint(this.guide.S)] : [this.guide.S];
    }

    move(e) {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        const mm = 1 / this.scale;
        const raw = this.toPaper(e);
        let snap = snapTarget(this.paper, raw, 14 * mm);
        if (this.guide) {
            const onRight = d.S[0] > 0.5;
            const gS = onRight && this.guide.mirrored ? mirrorPoint(this.guide.S) : this.guide.S;
            const gT = onRight && this.guide.mirrored ? mirrorPoint(this.guide.T) : this.guide.T;
            if (Math.hypot(gS[0] - d.S[0], gS[1] - d.S[1]) < 1 && Math.hypot(gT[0] - raw[0], gT[1] - raw[1]) < 26 * mm) {
                snap = { p: gT, kind: 'guide' };
            }
        }
        d.T = snap.p;
        d.snap = snap.kind;
        this.draw();
    }

    up(e) {
        const d = this.drag;
        this.drag = null;
        if (!d || Math.hypot(d.T[0] - d.S[0], d.T[1] - d.S[1]) < 3) { this.draw(); return; }
        this.play(d.S, d.T);
    }

    /** Animates a fold, then hands it to the app. Also used by "Show me" and
        the fold library, which say for themselves whether it is mirrored. */
    play(S, T, opts = {}) {
        const centre = Math.abs(S[0]) < 0.75 && Math.abs(T[0]) < 0.75;
        const mirrored = (opts.mirrored ?? this.hooks.mirror()) && !centre;
        const plans = [planFold(this.paper, S, T)];
        if (mirrored) plans.push(planFold(this.paper, mirrorPoint(S), mirrorPoint(T)));
        if (plans.some(p => !p)) {
            this.hooks.onMessage('That would not fold anything. Grab the paper nearer a corner or an edge.');
            this.draw();
            return;
        }
        const finish = () => { this.anim = null; this.hooks.onFold(S, T, mirrored); };
        if (this.reduceMotion.matches) { finish(); return; }
        this.anim = { plans, t0: performance.now(), finish };
    }

    loop(now) {
        if (this.anim) {
            const k = Math.min(1, (now - this.anim.t0) / FOLD_MS);
            this.anim.theta = Math.PI * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
            this.draw();
            if (k >= 1) this.anim.finish();
        } else if (this.guide && !this.drag) {
            this.draw(now);   // the guide arrow breathes
        }
        requestAnimationFrame(this.loop);
    }

    /* ── Drawing ── */
    draw(now = performance.now()) {
        const { ctx, dpr } = this;
        if (!this.W) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this.W, this.H);
        if (!this.paper) return;

        const moving = new Set();
        if (this.anim) for (const p of this.anim.plans) for (const m of p.moving) moving.add(m.f);

        // Shadow of the whole sheet on the table.
        const b = bounds(this.paper);
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.fillRect(this.ox + b.x0 * this.scale, this.oy + b.y0 * this.scale, (b.x1 - b.x0) * this.scale, (b.y1 - b.y0) * this.scale);
        ctx.restore();

        const facets = [...this.paper.facets].sort((a, b) => a.z - b.z);
        // Static paper, including the parts of moving facets that stay put.
        for (const f of facets) {
            if (!moving.has(f)) { this.facet(f.pts, f.face, f.m, null); continue; }
            for (const plan of this.anim.plans) {
                const piece = plan.pieces.find(p => p.f === f);
                if (piece && plan.moving.has(piece) && piece.pos) this.facet(piece.pos, f.face, f.m, null);
            }
        }
        // The flaps in the air, swinging over their creases.
        if (this.anim) {
            for (const plan of this.anim.plans) {
                const flaps = [...plan.moving].sort((a, b) => a.f.z - b.f.z);
                const M = flapMatrix(plan, this.anim.theta);
                // Their shadow, flat on the paper.
                const lift = Math.sin(this.anim.theta);
                for (const m of flaps) this.facet(m.neg, m.f.face, m.f.m, flapMatrix(plan, this.anim.theta, true), `rgba(15, 23, 42, ${0.14 * lift})`);
                const order = this.anim.theta > Math.PI / 2 ? [...flaps].reverse() : flaps;
                for (const m of order) this.facet(m.neg, this.anim.theta > Math.PI / 2 ? 1 - m.f.face : m.f.face, m.f.m, M);
            }
        }

        this.centreLine();
        if (this.cg && !this.anim) this.balanceMarker();
        if (this.guide && !this.drag && !this.anim) this.guideArrow(now);
        if (this.drag) this.preview();
    }

    /** One facet: polygon `pts` (current paper coords) with the printed sheet
        drawn through its affine map `m`. `M` is an extra affine (the flap in
        the air), `shade` paints a flat colour instead. */
    facet(pts, face, m, M, shade) {
        const { ctx, scale, ox, oy } = this;
        const tr = (x, y) => {
            if (M) { const nx = M[0] * x + M[2] * y + M[4]; const ny = M[1] * x + M[3] * y + M[5]; x = nx; y = ny; }
            return [ox + x * scale, oy + y * scale];
        };
        ctx.beginPath();
        pts.forEach(([x, y], i) => { const [sx, sy] = tr(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
        ctx.closePath();
        if (shade) { ctx.fillStyle = shade; ctx.fill(); return; }
        ctx.fillStyle = face === 0 ? '#f8fafc' : '#f4ecdc';
        ctx.fill();
        // Outline first: the path is not part of save/restore, so once the
        // grid below has been drawn this polygon is gone.
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // The printed side: a faint grid and the airline's name, drawn in the
        // flat sheet's coordinates so they fold with the paper.
        if (face === 0) {
            ctx.save();
            ctx.clip();
            let A = m;
            if (M) A = compose(M, m);
            ctx.transform(scale * A[0], scale * A[1], scale * A[2], scale * A[3], ox + scale * A[4], oy + scale * A[5]);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.16)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let x = -100; x <= 100; x += 10) { ctx.moveTo(x, 0); ctx.lineTo(x, SHEET.h); }
            for (let y = 10; y < SHEET.h; y += 10) { ctx.moveTo(-SHEET.w / 2, y); ctx.lineTo(SHEET.w / 2, y); }
            ctx.stroke();
            ctx.fillStyle = 'rgba(30, 64, 175, 0.35)';
            ctx.font = '700 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NESKIL AIR', 52, 280);
            ctx.fillText('NESKIL AIR', -52, 280);
            ctx.restore();
        }
    }

    centreLine() {
        const { ctx, scale, ox, oy } = this;
        const b = bounds(this.paper);
        ctx.save();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.beginPath();
        ctx.moveTo(ox, oy + b.y0 * scale);
        ctx.lineTo(ox, oy + b.y1 * scale);
        ctx.stroke();
        ctx.restore();
    }

    balanceMarker() {
        const { ctx, scale, ox, oy } = this;
        const y = oy + this.cg[1] * scale;
        ctx.save();
        ctx.fillStyle = '#f97316';
        ctx.strokeStyle = '#0f1420';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = '#fdba74';
        ctx.fillText('balance point', ox + 10, y + 4);
        ctx.restore();
    }

    guideArrow(now) {
        const g = this.guide;
        const pulse = 0.55 + 0.45 * Math.sin(now / 260);
        const pairs = g.mirrored ? [[g.S, g.T], [mirrorPoint(g.S), mirrorPoint(g.T)]] : [[g.S, g.T]];
        for (const [S, T] of pairs) this.arrow(S, T, `rgba(250, 204, 21, ${0.5 + 0.4 * pulse})`, true, pulse);
    }

    preview() {
        const d = this.drag;
        const mirrored = this.hooks.mirror() && !(Math.abs(d.S[0]) < 0.75 && Math.abs(d.T[0]) < 0.75);
        const pairs = [[d.S, d.T]];
        if (mirrored) pairs.push([mirrorPoint(d.S), mirrorPoint(d.T)]);
        const crosses = mirrored && crossesCentre(this.paper, d.S, d.T);
        for (const [S, T] of pairs) {
            const plan = planFold(this.paper, S, T);
            if (plan && !crosses) {
                // Where the flap lands: a ghost of it, already turned over.
                for (const m of plan.moving) {
                    const M = flapMatrix(plan, Math.PI);
                    this.facet(m.neg, 1 - m.f.face, m.f.m, M, 'rgba(250, 204, 21, 0.22)');
                    this.ghostOutline(m.neg, M);
                }
                this.crease(plan);
            }
            this.arrow(S, T, crosses ? '#f87171' : '#facc15', false, 1);
        }
        if (d.snap && d.snap !== 'corner') this.label(d.T, d.snap === 'centre' ? 'centre line' : d.snap === 'guide' ? '✓' : 'edge');
        if (crosses) this.label(d.T, 'crosses the middle', '#fca5a5');
    }

    ghostOutline(pts, M) {
        const { ctx, scale, ox, oy } = this;
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(30, 64, 175, 0.7)';
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
            const X = M[0] * x + M[2] * y + M[4], Y = M[1] * x + M[3] * y + M[5];
            i ? ctx.lineTo(ox + X * scale, oy + Y * scale) : ctx.moveTo(ox + X * scale, oy + Y * scale);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    crease(plan) {
        const { ctx, scale, ox, oy } = this;
        // The crease across the moving pieces only.
        const dir = [-plan.n[1], plan.n[0]];
        let lo = Infinity, hi = -Infinity;
        for (const m of plan.moving) for (const p of m.neg) {
            if (Math.abs(plan.s(p)) < 0.6) {
                const t = (p[0] - plan.P[0]) * dir[0] + (p[1] - plan.P[1]) * dir[1];
                lo = Math.min(lo, t); hi = Math.max(hi, t);
            }
        }
        if (!(hi > lo)) return;
        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(ox + (plan.P[0] + dir[0] * lo) * scale, oy + (plan.P[1] + dir[1] * lo) * scale);
        ctx.lineTo(ox + (plan.P[0] + dir[0] * hi) * scale, oy + (plan.P[1] + dir[1] * hi) * scale);
        ctx.stroke();
        ctx.restore();
    }

    arrow(S, T, colour, dashed, pulse) {
        const { ctx, scale, ox, oy } = this;
        const a = [ox + S[0] * scale, oy + S[1] * scale], b = [ox + T[0] * scale, oy + T[1] * scale];
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const L = Math.hypot(dx, dy) || 1;
        // Bowed, like the arrows in folding diagrams.
        const c = [mx - dy / L * L * 0.22, my + dx / L * L * 0.22];
        const bend = c[0] < mx === (S[0] < 0) ? c : [mx + dy / L * L * 0.22, my - dx / L * L * 0.22];
        ctx.save();
        ctx.strokeStyle = colour;
        ctx.fillStyle = colour;
        ctx.lineWidth = 2.5;
        if (dashed) ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo(bend[0], bend[1], b[0], b[1]);
        ctx.stroke();
        ctx.setLineDash([]);
        const ang = Math.atan2(b[1] - bend[1], b[0] - bend[0]);
        ctx.beginPath();
        ctx.moveTo(b[0], b[1]);
        ctx.lineTo(b[0] - 11 * Math.cos(ang - 0.45), b[1] - 11 * Math.sin(ang - 0.45));
        ctx.lineTo(b[0] - 11 * Math.cos(ang + 0.45), b[1] - 11 * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(a[0], a[1], 5 + 3 * pulse, 0, Math.PI * 2);
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.restore();
    }

    label([x, y], text, colour = '#fde68a') {
        const { ctx, scale, ox, oy } = this;
        ctx.save();
        ctx.font = '600 12px Inter, sans-serif';
        const w = ctx.measureText(text).width + 12;
        const sx = ox + x * scale + 12, sy = oy + y * scale - 26;
        ctx.fillStyle = 'rgba(15, 20, 32, 0.85)';
        ctx.beginPath();
        ctx.roundRect(sx, sy, w, 20, 6);
        ctx.fill();
        ctx.fillStyle = colour;
        ctx.fillText(text, sx + 6, sy + 14);
        ctx.restore();
    }
}

/** The affine map that takes a moving piece to where it is at angle theta of
    the fold: its distance from the crease shrinks by cos(theta) and it rises
    by sin(theta), drawn as a nudge up and to the left. `flat` leaves out the
    rise — the flap's shadow. At theta = pi it is the reflection. */
function flapMatrix(plan, theta, flat = false) {
    const { n, P } = plan;
    const lean = flat ? [0, 0] : [-0.32, -0.55];
    const k = 1 - Math.cos(theta), h = Math.sin(theta);
    // q = p + s(p) * v, with s(p) = n·p - n·P
    const v = [-k * n[0] - h * lean[0], -k * n[1] - h * lean[1]];
    const nP = n[0] * P[0] + n[1] * P[1];
    return [1 + v[0] * n[0], v[1] * n[0], v[0] * n[1], 1 + v[1] * n[1], -nP * v[0], -nP * v[1]];
}

function compose(A, B) {
    return [
        A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
        A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
        A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
    ];
}

function crossesCentre(paper, S, T) {
    const dx = T[0] - S[0], dy = T[1] - S[1];
    const L = Math.hypot(dx, dy) || 1;
    const n = [dx / L, dy / L], P = [(S[0] + T[0]) / 2, (S[1] + T[1]) / 2];
    const b = bounds(paper);
    if (Math.abs(n[1]) > 1e-9) {
        const y0 = (P[0] * n[0] + P[1] * n[1]) / n[1];
        return y0 > b.y0 + 0.75 && y0 < b.y1 - 0.75;
    }
    return Math.abs(P[0]) < 0.75;
}
