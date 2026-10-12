// Paper Plane Glider — the shaping turntable: the folded plane in 3D, slowly
// turning, with the balance and lift points marked. Drag to turn it yourself.
import { drawModel } from './model.js';

export class ShapeView {
    constructor(canvas, opts = {}) {
        this.labels = opts.labels !== false;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.model = null;
        this.markers = null;
        this.yaw = -0.7;
        this.tilt = 0.55;
        this.spin = true;
        this.visible = false;
        this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        new ResizeObserver(() => this.fit()).observe(canvas.parentElement);
        this.fit();
        let drag = null;
        canvas.addEventListener('pointerdown', (e) => {
            canvas.setPointerCapture(e.pointerId);
            drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, tilt: this.tilt };
            this.spin = false;
        });
        canvas.addEventListener('pointermove', (e) => {
            if (!drag) return;
            this.yaw = drag.yaw + (e.clientX - drag.x) * 0.01;
            this.tilt = Math.max(-0.2, Math.min(1.35, drag.tilt + (e.clientY - drag.y) * 0.008));
        });
        const end = () => { drag = null; };
        canvas.addEventListener('pointerup', end);
        canvas.addEventListener('pointercancel', end);
        let last = performance.now();
        const loop = (now) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (this.visible) {
                if (this.spin && !this.reduceMotion.matches) this.yaw += dt * 0.35;
                this.draw();
            }
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

    setModel(model, markers) {
        this.model = model;
        this.markers = markers;
    }

    draw() {
        const { ctx } = this;
        if (!this.W) return;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, this.W, this.H);
        if (!this.model) return;
        const m = this.model;
        const len = Math.max(120, m.tail - m.nose);
        const scale = Math.min(this.W, this.H) / (len * 1.35);
        // A soft floor shadow, then the plane.
        const g = ctx.createRadialGradient(this.W / 2, this.H * 0.72, 10, this.W / 2, this.H * 0.72, this.W * 0.35);
        g.addColorStop(0, 'rgba(0,0,0,0.35)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, this.H * 0.5, this.W, this.H * 0.5);
        drawModel(ctx, m, {
            yaw: this.yaw, tilt: this.tilt, scale,
            cx: this.W / 2, cy: this.H * 0.5,
            distance: len * 3.2,
            centre: [0, (m.nose + m.tail) / 2, -m.keel / 3],
        }, { markers: this.markers, labels: this.labels });
    }
}
