// Paper Plane Glider — the flight preview on the folding table. The test
// throw (TEST_THROW, flown in 3D) is drawn down a strip of the office: side
// on, with a lane seen from above underneath for any veer. While a fold is
// being dragged or placed, what that fold would do flies beside it in yellow,
// with the difference it makes; after a fold, the flight it replaced stays as
// a faint line, so every crease shows what it did to the plane.
import { ROOM3D, SAMPLE3D, samplePath, rotate } from './flight3d.js';

/** The throw every fold is judged by: firm and nearly flat. */
export const TEST_THROW = { angle: 5, speed: 7, yaw: 0, bank: 0 };

const HALF = ROOM3D.width / 2;

export class FlightPreview {
    constructor(canvas, readout) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.readout = readout;     // { dist, delta, note } elements
        this.now = null;            // the plane as folded
        this.before = null;         // the flight before the last fold
        this.pending = null;        // the fold being placed
        this.visible = false;
        this.t0 = performance.now();
        this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        new ResizeObserver(() => this.fit()).observe(canvas.parentElement);
        this.fit();
        const loop = (now) => {
            if (this.visible && !document.hidden) this.draw(now);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    fit() {
        const box = this.canvas.getBoundingClientRect();
        if (!box.width) return;
        this.dpr = Math.min(2, window.devicePixelRatio || 1);
        this.W = box.width;
        this.H = box.height;
        this.canvas.width = Math.floor(this.W * this.dpr);
        this.canvas.height = Math.floor(this.H * this.dpr);
    }

    /** The plane as it is folded now. */
    set(result) {
        this.now = result;
        if (!this.pending) this.t0 = performance.now();
        this.say();
    }

    /** Keeps the current flight as the one to compare the next fold with. */
    snapshot() { this.before = this.now; }

    /** What the fold being placed would fly like, or null. */
    setPending(result) {
        const was = !!this.pending;
        this.pending = result;
        if (!was && result) this.t0 = performance.now();
        this.say();
    }

    say() {
        const { dist, delta, note } = this.readout;
        const r = this.pending || this.now;
        if (!r) return;
        dist.textContent = r.distance.toFixed(1) + ' m';
        const ref = this.pending ? this.now : this.before;
        const d = ref ? r.distance - ref.distance : 0;
        delta.textContent = ref && Math.abs(d) >= 0.05 ? (d > 0 ? '+' : '−') + Math.abs(d).toFixed(1) + ' m' : '';
        delta.dataset.sign = d > 0 ? 'up' : 'down';
        delta.dataset.pending = String(!!this.pending);
        const words = [];
        if (this.pending) words.push('with this fold');
        if (r.stalls > 1) words.push('stalls');
        if (Math.abs(r.offset) >= 0.3) words.push(`veers ${Math.abs(r.offset).toFixed(1)} m ${r.offset > 0 ? 'right' : 'left'}`);
        note.textContent = words.join(' · ');
    }

    draw(now) {
        const { ctx, W, H, dpr } = this;
        if (!W || !this.now) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const pad = 8, lane = Math.min(22, H * 0.24), gap = 6;
        const sideH = H - lane - gap - 14;
        const X = (x) => pad + Math.max(0, x) / ROOM3D.length * (W - pad * 2);
        const Y = (y) => 3 + sideH - y / ROOM3D.ceiling * sideH;
        const laneTop = 3 + sideH + 14 + gap - 4;
        const Z = (z) => laneTop + (z + HALF) / (2 * HALF) * lane;

        // The room: floor and its metres, the ceiling, the lane from above.
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(X(0), Y(ROOM3D.ceiling) + 0.5);
        ctx.lineTo(X(ROOM3D.length), Y(ROOM3D.ceiling) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.fillRect(X(0), laneTop, X(ROOM3D.length) - X(0), lane);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.beginPath();
        ctx.moveTo(X(0), Y(0) + 0.5);
        ctx.lineTo(X(ROOM3D.length), Y(0) + 0.5);
        ctx.stroke();
        ctx.font = '600 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        for (let m = 0; m <= ROOM3D.length; m++) {
            const five = m % 5 === 0;
            ctx.fillStyle = five ? 'rgba(250, 204, 21, 0.7)' : 'rgba(148, 163, 184, 0.35)';
            ctx.fillRect(Math.round(X(m)), Y(0) + 1, 1, five ? 5 : 3);
            if (five && m > 0) ctx.fillText(m + ' m', X(m), Y(0) + 13);
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(X(0), Z(0));
        ctx.lineTo(X(ROOM3D.length), Z(0));
        ctx.stroke();
        ctx.setLineDash([]);

        const line = (r, colour, width, dash) => {
            ctx.strokeStyle = colour;
            ctx.lineWidth = width;
            ctx.setLineDash(dash || []);
            ctx.lineJoin = 'round';
            for (const [px, py] of [[0, 1], [0, 2]]) {
                ctx.beginPath();
                r.path.forEach((p, i) => {
                    const u = X(p[px]), v = py === 1 ? Y(p[1]) : Z(p[2]);
                    i ? ctx.lineTo(u, v) : ctx.moveTo(u, v);
                });
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.lineWidth = 1;
        };
        const end = (r, colour) => {
            const e = r.path[r.path.length - 1];
            ctx.fillStyle = colour;
            for (const [u, v] of [[X(e[0]), Y(e[1])], [X(e[0]), Z(e[2])]]) {
                ctx.beginPath();
                ctx.arc(u, v, 2.6, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        if (this.before && this.before !== this.now && !this.pending) line(this.before, 'rgba(148, 163, 184, 0.35)', 1.2, [2, 3]);
        line(this.now, this.pending ? 'rgba(241, 245, 249, 0.45)' : 'rgba(241, 245, 249, 0.9)', 1.6);
        end(this.now, this.pending ? 'rgba(241, 245, 249, 0.5)' : '#f1f5f9');
        if (this.pending) {
            line(this.pending, '#facc15', 2, [5, 3]);
            end(this.pending, '#facc15');
        }

        // A little plane flying it, over and over.
        const r = this.pending || this.now;
        const last = (r.path.length - 1) * SAMPLE3D;
        const t = this.reduceMotion.matches ? last : ((now - this.t0) / 1000 * 1.25) % (last + 0.9);
        const p = samplePath(r.path, Math.min(t, last));
        const n = rotate(p.q, [1, 0, 0]);
        this.glyph(X(p.x), Y(p.y), Math.atan2(n[1], Math.hypot(n[0], n[2])), this.pending ? '#fde047' : '#ffffff');
        this.glyph(X(p.x), Z(p.z), Math.atan2(-n[2], n[0]), this.pending ? '#fde047' : '#ffffff', 0.8);
    }

    /** A paper dart, nose along `angle` (screen up for positive). */
    glyph(x, y, angle, colour, k = 1) {
        const { ctx } = this;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-angle);
        ctx.scale(k, k);
        ctx.fillStyle = colour;
        ctx.strokeStyle = 'rgba(15, 20, 32, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-5, -3.6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-5, 3.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}
