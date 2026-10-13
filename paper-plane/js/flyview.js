// Paper Plane Glider — the flying room seen side-on, for browsers without
// WebGL (flyview3d.js is the real one). Drag back and let go to throw; the
// flight is the 3D one (flight3d.js), drawn from the side.
import { ROOM, DT } from './flight.js';
import { fly3d, sidePath, AIM_LIMITS } from './flight3d.js';
import { sideSprite } from './model.js';

const MAX_SPEED = 12;
const SAMPLE = DT * 6;
const HOME = -1.6;

export class FlyView {
    constructor(canvas, hooks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.hooks = hooks;   // { onAim(aim), onLanded(result), ghost() }
        this.plane = null;
        this.sprite = null;
        this.world = {};
        this.aim = { angle: 8, speed: 7, yaw: 0, bank: 0 };
        this.flight = null;
        this.last = null;
        this.camX = HOME;
        this.dragging = null;
        this.visible = false;
        this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        new ResizeObserver(() => this.fit()).observe(canvas.parentElement);
        this.fit();

        canvas.addEventListener('pointerdown', (e) => {
            if (this.flight) return;
            canvas.setPointerCapture(e.pointerId);
            this.dragging = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
        });
        canvas.addEventListener('pointermove', (e) => {
            const d = this.dragging;
            if (!d || d.id !== e.pointerId) return;
            const dx = d.x0 - e.clientX, dy = e.clientY - d.y0;
            if (Math.hypot(dx, dy) < 8) return;
            d.moved = true;
            const reach = Math.min(this.W, this.H) * 0.45;
            this.setAim({
                speed: Math.round(Math.min(MAX_SPEED, Math.max(2, Math.hypot(dx, dy) / reach * MAX_SPEED)) * 10) / 10,
                angle: Math.round(Math.max(-15, Math.min(60, Math.atan2(dy, Math.max(1, dx)) * 180 / Math.PI))),
            });
        });
        canvas.addEventListener('pointerup', () => {
            const d = this.dragging;
            this.dragging = null;
            if (d && d.moved) this.throwIt();
        });
        canvas.addEventListener('pointercancel', () => { this.dragging = null; });

        let lastNow = performance.now();
        const loop = (now) => {
            const dt = Math.min(0.05, (now - lastNow) / 1000);
            lastNow = now;
            if (this.visible) this.frame(now, dt);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
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
    }

    setPlane(plane, model) { this.plane = plane; this.sprite = sideSprite(model); }
    setWorld(world) { this.world = world || {}; this.last = null; this.camX = HOME; }
    setAim(aim) {
        const L = AIM_LIMITS, a = { ...this.aim, ...aim };
        const clamp = (v, [lo, hi], fallback) => Math.max(lo, Math.min(hi, Number.isFinite(+v) ? +v : fallback));
        this.aim = {
            angle: Math.round(clamp(a.angle, L.angle, 8)),
            speed: Math.round(clamp(a.speed, L.speed, 7) * 10) / 10,
            yaw: Math.round(clamp(a.yaw, L.yaw, 0)),
            bank: Math.round(clamp(a.bank, L.bank, 0)),
        };
        this.hooks.onAim(this.aim);
    }

    throwIt() {
        if (this.flight || !this.plane) return;
        this.flight = fly3d(this.plane, this.aim, this.world);
        this.flight.side = sidePath(this.flight.path);
        this.playT = 0;
        this.hooks.onThrow && this.hooks.onThrow();
    }

    scale() { return (this.H - 34) / (ROOM.ceiling + 0.25); }

    frame(now, dt) {
        const { ctx } = this;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        let px = 0, py = ROOM.release, pitch = this.aim.angle * Math.PI / 180, upto = 0;
        const f = this.flight;
        if (f) {
            this.playT += dt * (this.reduceMotion.matches ? 3 : 1);
            const idx = this.playT / SAMPLE;
            const i = Math.min(f.path.length - 1, Math.floor(idx));
            const j = Math.min(f.path.length - 1, i + 1);
            const t = idx - Math.floor(idx);
            const [x0, y0, p0] = f.side[i], [x1, y1, p1] = f.side[j];
            px = x0 + (x1 - x0) * t;
            py = y0 + (y1 - y0) * t;
            // Pitch can wrap through ±π when it tumbles; interpolate the short way.
            let dp = p1 - p0;
            if (dp > Math.PI) dp -= 2 * Math.PI;
            if (dp < -Math.PI) dp += 2 * Math.PI;
            pitch = p0 + dp * t;
            upto = i + 1;
            if (i >= f.path.length - 1) {
                this.flight = null;
                this.last = f;
                this.lastFinish = now;
                this.hooks.onLanded(f);
            }
        } else if (this.last) {
            const end = this.last.side[this.last.side.length - 1];
            px = end[0]; py = end[1]; pitch = end[2];
        }

        const s = this.scale();
        const viewW = this.W / s;
        const lingering = !f && this.last && now - (this.lastFinish || 0) < 2500;
        const want = f ? Math.max(HOME, px - viewW * 0.38) : lingering ? this.camX : HOME;
        this.camX += (want - this.camX) * Math.min(1, dt * (f ? 6 : 1.2));

        const v = this.room(this.camX);
        this.fans(v, now);
        this.pads(v);
        this.hoops(v, 'back');
        this.pillars(v);
        this.bin(v);
        const ghost = this.hooks.ghost();
        if (ghost) {
            this.path(v, ghost.path, Infinity, 'rgba(250, 204, 21, 0.3)');
            const end = ghost.path[ghost.path.length - 1];
            ctx.fillStyle = 'rgba(250,204,21,0.7)';
            ctx.font = '600 11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('best ' + ghost.distance.toFixed(1) + ' m', v.X(end[0]), v.floorY - 18);
            ctx.textAlign = 'left';
        }
        if (f) this.path(v, f.path, upto, 'rgba(226, 232, 240, 0.5)');
        else if (this.last) this.path(v, this.last.path, Infinity, 'rgba(226, 232, 240, 0.25)');
        this.thrower(v);
        if (!f) this.aimArrow(v);
        if (this.sprite) {
            // A real plane is 0.2–0.3 m long, which is small in a 20 m room;
            // draw it at twice size so its shape reads.
            const pxPerMm = v.s / 1000 * 2;
            this.sprite(ctx, v.X(px), v.Y(py) - (f || this.last ? 0 : 0), pitch, pxPerMm);
        }
        this.hoops(v, 'front');
    }

    room(cam) {
        const { ctx, W, H } = this;
        const s = this.scale();
        const floorY = H - 26;
        const X = (x) => (x - cam) * s;
        const Y = (y) => floorY - y * s;
        const x0 = cam - 1, x1 = cam + W / s + 1;
        const wall = ctx.createLinearGradient(0, Y(ROOM.ceiling), 0, floorY);
        wall.addColorStop(0, '#1d2433');
        wall.addColorStop(1, '#262f42');
        ctx.fillStyle = wall;
        ctx.fillRect(0, 0, W, floorY);

        for (let k = Math.floor(x0 / 6); k <= Math.ceil(x1 / 6); k++) {
            const wx = k * 6 + 1.5;
            const left = X(wx), right = X(wx + 2.4), top = Y(2.6), bottom = Y(0.95);
            ctx.save();
            ctx.beginPath();
            ctx.rect(left, top, right - left, bottom - top);
            ctx.clip();
            const sky = ctx.createLinearGradient(0, top, 0, bottom);
            sky.addColorStop(0, '#26355c');
            sky.addColorStop(1, '#c2766a');
            ctx.fillStyle = sky;
            ctx.fillRect(left, top, right - left, bottom - top);
            for (let b = 0; b < 9; b++) {
                const bx = left + ((b * 37 + k * 53) % 100) / 100 * (right - left) - cam * s * 0.15 % 40;
                const bh = (0.25 + ((b * 29 + k * 11) % 50) / 100) * (bottom - top);
                ctx.fillStyle = '#18213a';
                ctx.fillRect(bx, bottom - bh, (right - left) * 0.13, bh);
                ctx.fillStyle = 'rgba(255,214,140,0.5)';
                for (let w = 0; w < 4; w++) ctx.fillRect(bx + 3, bottom - bh + 4 + w * 8, 2, 2);
            }
            ctx.restore();
            ctx.strokeStyle = '#4b5568';
            ctx.lineWidth = 3;
            ctx.strokeRect(left, top, right - left, bottom - top);
            ctx.beginPath();
            ctx.moveTo((left + right) / 2, top);
            ctx.lineTo((left + right) / 2, bottom);
            ctx.stroke();
        }

        ctx.fillStyle = '#121826';
        ctx.fillRect(0, 0, W, Y(ROOM.ceiling));
        for (let k = Math.floor(x0 / 4); k <= Math.ceil(x1 / 4); k++) {
            const lx = X(k * 4 + 2);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(lx - 0.5 * s, Y(ROOM.ceiling), s, 4);
            const glow = ctx.createRadialGradient(lx, Y(ROOM.ceiling) + 4, 2, lx, Y(ROOM.ceiling) + 4, s * 1.4);
            glow.addColorStop(0, 'rgba(255,248,230,0.14)');
            glow.addColorStop(1, 'rgba(255,248,230,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(lx - s * 1.4, Y(ROOM.ceiling), s * 2.8, s * 1.4);
        }

        // Desks and plants as background scenery, kept clear of any desk the
        // mission wants you to land on.
        const pads = this.world.pads || [];
        for (let k = Math.floor(x0 / 5); k <= Math.ceil(x1 / 5); k++) {
            if (k < 1) continue;
            const dx = k * 5 + 0.6;
            if (pads.some(p => dx + 1.4 > p.x0 - 1 && dx < p.x1 + 1)) continue;
            this.desk(X, Y, s, dx, 1.4, '#3b3326');
            if (k % 2 === 0) {
                const px = X(dx + 2.6);
                ctx.fillStyle = '#7c4a2d';
                ctx.fillRect(px - 0.12 * s, Y(0.35), 0.24 * s, 0.35 * s);
                ctx.fillStyle = '#2f7a4c';
                for (let l = 0; l < 6; l++) {
                    ctx.beginPath();
                    ctx.ellipse(px + Math.cos(l) * 0.12 * s, Y(0.5 + (l % 3) * 0.12), 0.08 * s, 0.18 * s, (l - 2.5) * 0.4, 0, 6.283);
                    ctx.fill();
                }
            }
        }

        ctx.fillStyle = '#3a3f4f';
        ctx.fillRect(0, floorY, W, H - floorY);
        ctx.fillStyle = '#1f2330';
        ctx.fillRect(0, floorY - 6, W, 6);
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let m = Math.max(0, Math.floor(x0)); m <= Math.ceil(x1); m++) {
            const mx = X(m);
            ctx.fillStyle = m % 5 === 0 ? '#facc15' : 'rgba(250,204,21,0.45)';
            ctx.fillRect(mx - 1, floorY, 2, m % 5 === 0 ? 10 : 6);
            if (m % (s < 60 ? 5 : 1) === 0) {
                ctx.fillStyle = m % 5 === 0 ? '#fde68a' : '#94a3b8';
                ctx.fillText(m + ' m', mx, floorY + 11);
            }
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        return { X, Y, s, floorY };
    }

    desk(X, Y, s, x, w, top, glow) {
        const { ctx } = this;
        if (glow) {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
            ctx.fillRect(X(x) - 4, Y(0.74) - 10, w * s + 8, 14);
        }
        ctx.fillStyle = top;
        ctx.fillRect(X(x), Y(0.74), w * s, 0.05 * s);
        ctx.fillStyle = '#2b2620';
        ctx.fillRect(X(x) + 3, Y(0.7), 4, 0.7 * s);
        ctx.fillRect(X(x + w) - 7, Y(0.7), 4, 0.7 * s);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(X(x + w * 0.32), Y(1.1), 0.5 * s, 0.32 * s);
    }

    pads(v) {
        for (const p of this.world.pads || []) {
            if (p.scenery) continue;
            this.desk(v.X, v.Y, v.s, p.x0, p.x1 - p.x0, '#5b8a6a', true);
            this.tag(v.X((p.x0 + p.x1) / 2), v.Y(0.74) - 22, 'land here', '#6ee7b7');
        }
    }

    fans(v, now) {
        const { ctx } = this;
        for (const f of this.world.fans || []) {
            const x = v.X(f.x);
            ctx.fillStyle = '#475569';
            ctx.fillRect(x - 0.18 * v.s, v.Y(0.1), 0.36 * v.s, 0.1 * v.s);
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.ellipse(x, v.Y(0.14), 0.22 * v.s, 0.05 * v.s, 0, 0, 6.283);
            ctx.fill();
            ctx.strokeStyle = 'rgba(148, 197, 255, 0.35)';
            ctx.lineWidth = 1.5;
            const t = now / 1000;
            for (let k = 0; k < 7; k++) {
                const px = x + (k - 3) / 3 * (f.width / 2) * v.s * 0.8;
                const phase = ((t * f.up * 0.5 + k * 0.37) % 1);
                const y = v.Y(0.2 + phase * (f.height - 0.2));
                ctx.globalAlpha = 1 - phase;
                ctx.beginPath();
                ctx.moveTo(px, y);
                ctx.lineTo(px, y - 0.25 * v.s);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }

    hoops(v, half) {
        const { ctx } = this;
        const passed = this.last ? this.last.hoops : [];
        (this.world.hoops || []).forEach((h, i) => {
            const x = v.X(h.x), y = v.Y(h.y), r = h.r * v.s;
            const ok = passed[i];
            ctx.strokeStyle = ok ? '#34d399' : '#f472b6';
            ctx.lineWidth = 5;
            ctx.beginPath();
            // The ring seen nearly edge-on: back half first, front half over the plane.
            ctx.ellipse(x, y, r * 0.28, r, 0, half === 'back' ? Math.PI / 2 : -Math.PI / 2, half === 'back' ? Math.PI * 1.5 : Math.PI / 2);
            ctx.stroke();
            if (half === 'back') {
                ctx.strokeStyle = 'rgba(148,163,184,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + r);
                ctx.lineTo(x, v.floorY);
                ctx.stroke();
            }
        });
    }

    pillars(v) {
        const { ctx } = this;
        for (const p of this.world.pillars || []) {
            ctx.fillStyle = 'rgba(107, 114, 128, 0.85)';
            ctx.fillRect(v.X(p.x - p.r), v.Y(ROOM.ceiling), p.r * 2 * v.s, ROOM.ceiling * v.s);
        }
    }

    bin(v) {
        const b = this.world.bin;
        if (!b) return;
        const { ctx } = this;
        const x = v.X(b.x);
        const w = b.width * v.s, h = 0.36 * v.s;
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(x - w / 2, v.floorY - h);
        ctx.lineTo(x + w / 2, v.floorY - h);
        ctx.lineTo(x + w * 0.4, v.floorY);
        ctx.lineTo(x - w * 0.4, v.floorY);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - w / 2 - 2, v.floorY - h);
        ctx.lineTo(x + w / 2 + 2, v.floorY - h);
        ctx.stroke();
        this.tag(x, v.floorY - h - 22, '🗑️ ' + b.x.toFixed(1) + ' m', '#f9a8d4');
    }

    tag(x, y, text, colour) {
        const { ctx } = this;
        ctx.font = '700 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = colour;
        ctx.fillText(text, x, y + 12);
        ctx.textAlign = 'left';
    }

    thrower(v) {
        const { ctx } = this;
        const x = v.X(-0.35);
        const s = v.s;
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(x, v.Y(1.62), 0.11 * s, 0, 6.283);
        ctx.fill();
        ctx.fillRect(x - 0.11 * s, v.Y(1.48), 0.22 * s, 0.62 * s);
        ctx.fillRect(x - 0.09 * s, v.Y(0.86), 0.07 * s, 0.86 * s);
        ctx.fillRect(x + 0.02 * s, v.Y(0.86), 0.07 * s, 0.86 * s);
        const a = this.aim.angle * Math.PI / 180;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.06 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, v.Y(1.42));
        ctx.lineTo(v.X(0), v.Y(ROOM.release) - Math.sin(a) * 4);
        ctx.stroke();
        ctx.lineCap = 'butt';
    }

    aimArrow(v) {
        const { ctx } = this;
        const a = this.aim.angle * Math.PI / 180;
        const len = this.aim.speed / MAX_SPEED * 2.2;
        const x0 = v.X(0), y0 = v.Y(ROOM.release);
        const x1 = x0 + Math.cos(a) * len * v.s, y1 = y0 - Math.sin(a) * len * v.s;
        ctx.strokeStyle = this.dragging && this.dragging.moved ? '#facc15' : 'rgba(250,204,21,0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - Math.cos(a - 0.4) * 10, y1 + Math.sin(a - 0.4) * 10);
        ctx.lineTo(x1 - Math.cos(a + 0.4) * 10, y1 + Math.sin(a + 0.4) * 10);
        ctx.fill();
    }

    path(v, path, upto, style) {
        const { ctx } = this;
        if (!path || path.length < 2) return;
        ctx.strokeStyle = style;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const n = Math.min(path.length, upto);
        for (let k = 0; k < n; k++) {
            const [x, y] = path[k];
            k ? ctx.lineTo(v.X(x), v.Y(y)) : ctx.moveTo(v.X(x), v.Y(y));
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
}
