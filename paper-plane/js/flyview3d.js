// Paper Plane Glider — the office in 3D. The same job as flyview.js (aim,
// throw, play the flight back, say how it went) with the room built in
// three.js (vendor/three.min.js, loaded by app.js before this is made) and
// the flight from flight3d.js, so it can curve, veer and hit the walls.
//
// World and body axes as in flight3d.js. The plane is built from model.js's
// polygons (mm: X across, Y nose to tail, Z up), moved into body axes with
// its balance point near the origin: [(cgY - Y), (Z + keel * 0.35), X] / 1000.
// That swap flips handedness, so the paper is drawn double-sided.
import { ROOM3D, AIM_LIMITS, SAMPLE3D, fly3d, samplePath, launch3d, step3d } from './flight3d.js';
import { DT } from './flight.js';

const HOME = { x: 0, y: ROOM3D.release, z: 0 };
const CAMS = ['chase', 'side', 'top'];
const CAM_KEY = 'paperplane.cam';
/** How much bigger the plane is drawn than it is, by camera: a real one is
    25 cm long, which is a speck seen from the side of a 24 m room. */
const PLANE_SCALE = { chase: 1.6, side: 3.2, top: 3.2 };

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export class FlyView3D {
    constructor(canvas, hooks) {
        const THREE = window.THREE;
        this.T = THREE;
        this.canvas = canvas;
        this.hooks = hooks;   // { onAim(aim), onThrow(), onLanded(result), ghost(), onCamera(name) }
        this.plane = null;
        this.world = {};
        this.aim = { angle: 8, speed: 7, yaw: 0, bank: 0 };
        this.flight = null;
        this.last = null;
        this.visible = false;
        this.rate = 1;
        this.touchedAt = 0;
        this.lastFinish = 0;
        this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let cam = 'chase';
        try { cam = localStorage.getItem(CAM_KEY) || 'chase'; } catch (e) { /* no storage */ }
        this.cam = CAMS.includes(cam) ? cam : 'chase';

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#121826');
        this.scene.fog = new THREE.Fog('#121826', 16, 42);
        this.camera = new THREE.PerspectiveCamera(55, 1, 0.03, 90);
        this.camPos = new THREE.Vector3(-1.6, 2.1, 0);
        this.camLook = new THREE.Vector3(6, 1, 0);

        this.scene.add(new THREE.HemisphereLight('#e6eeff', '#2a2f3d', 0.85));
        const sun = new THREE.DirectionalLight('#fff3df', 0.55);
        sun.position.set(4, 8, -3);
        this.scene.add(sun);
        this.scene.add(new THREE.AmbientLight('#ffffff', 0.12));

        this.buildRoom();
        this.props = new THREE.Group();
        this.scene.add(this.props);
        this.fans = [];

        // The plane twice over: the one in flight (or where it came down),
        // and the next one, in the hand.
        this.flying = new THREE.Group();
        this.ready = new THREE.Group();
        this.scene.add(this.flying, this.ready);
        this.shadow = this.blob();
        this.scene.add(this.shadow);

        this.trail = this.line('#e2e8f0', 0.75);
        this.lastTrail = this.line('#e2e8f0', 0.3);
        this.ghostTrail = this.line('#facc15', 0.4);
        this.aimLine = this.line('#7dd3fc', 0.9);
        this.marker = new THREE.Group();
        this.scene.add(this.marker);
        this.ghostTag = null;

        new ResizeObserver(() => this.fit()).observe(canvas.parentElement);
        this.fit();
        this.bindPointer();
        this.setCamera(this.cam);

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
        if (!box.width || !box.height) return;
        this.W = box.width;
        this.H = box.height;
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        this.renderer.setSize(this.W, this.H, false);
        this.canvas.style.width = this.W + 'px';
        this.canvas.style.height = this.H + 'px';
        this.camera.aspect = this.W / this.H;
        this.camera.updateProjectionMatrix();
    }

    /* ── What the page tells it ── */

    setPlane(plane, model) {
        this.plane = plane;
        this.model = model;
        for (const g of [this.flying, this.ready]) {
            for (const c of [...g.children]) { g.remove(c); c.geometry.dispose(); }
            if (model) g.add(...this.planeMeshes(model, plane));
        }
        this.aimDirty = true;
    }

    setWorld(world) {
        this.world = world || {};
        this.last = null;
        this.flight = null;
        this.clear(this.props);
        this.clear(this.marker);
        this.fans = [];
        this.furnish();
        this.drawLine(this.trail, null);
        this.drawLine(this.lastTrail, null);
        this.aimDirty = true;
        this.ghostKey = null;
    }

    setAim(aim) {
        const L = AIM_LIMITS;
        const a = { ...this.aim, ...aim };
        this.aim = {
            angle: Math.round(clamp(+a.angle || 0, ...L.angle)),
            speed: Math.round(clamp(+a.speed || 7, ...L.speed) * 10) / 10,
            yaw: Math.round(clamp(+a.yaw || 0, ...L.yaw)),
            bank: Math.round(clamp(+a.bank || 0, ...L.bank)),
        };
        this.aimDirty = true;
        this.touchedAt = performance.now();
        this.hooks.onAim(this.aim);
    }

    setCamera(name) {
        this.cam = CAMS.includes(name) ? name : 'chase';
        try { localStorage.setItem(CAM_KEY, this.cam); } catch (e) { /* no storage */ }
        // Cut-away walls: whatever is between the camera and the room.
        this.rightWall.visible = this.cam !== 'side';
        this.ceiling.visible = this.cam !== 'top';
        this.snapCamera = true;
        this.hooks.onCamera && this.hooks.onCamera(this.cam);
    }

    nextCamera() { this.setCamera(CAMS[(CAMS.indexOf(this.cam) + 1) % CAMS.length]); }

    throwIt() {
        if (this.flight || !this.plane) return;
        this.flight = fly3d(this.plane, this.aim, this.world);
        this.startPlayback(1);
        this.hooks.onThrow && this.hooks.onThrow();
    }

    /** The last flight again, slowly. */
    replay() {
        if (this.flight || !this.last) return;
        this.flight = this.last;
        this.last = null;
        this.replaying = true;
        this.startPlayback(0.35);
    }

    startPlayback(rate) {
        this.playT = 0;
        this.rate = rate;
        this.drawLine(this.trail, this.flight.path);
        this.trail.geometry.setDrawRange(0, 1);
        this.drawLine(this.lastTrail, null);
        this.clear(this.marker);
        this.paintHoops(null);
    }

    /* ── Building the room ── */

    buildRoom() {
        const T = this.T;
        const L = ROOM3D.length, Wd = ROOM3D.width, H = ROOM3D.ceiling, back = -2;
        const len = L - back, mid = (L + back) / 2;
        const room = new T.Group();
        this.scene.add(room);

        const floor = new T.Mesh(new T.PlaneGeometry(len, Wd), new T.MeshStandardMaterial({ map: this.floorTexture(len, Wd, back), roughness: 1 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(mid, 0, 0);
        room.add(floor);

        const wallMat = new T.MeshStandardMaterial({ color: '#2a3347', roughness: 1 });
        const wall = (w, h, x, y, z, ry) => {
            const m = new T.Mesh(new T.PlaneGeometry(w, h), wallMat);
            m.position.set(x, y, z);
            m.rotation.y = ry;
            room.add(m);
            return m;
        };
        // Left wall, with windows onto the city at dusk.
        wall(len, H, mid, H / 2, -Wd / 2, 0);
        const winTex = this.windowTexture();
        for (let x = 1.5; x < L - 1; x += 6) {
            const w = new T.Mesh(new T.PlaneGeometry(2.4, 1.6), new T.MeshBasicMaterial({ map: winTex }));
            w.position.set(x + 1.2, 1.8, -Wd / 2 + 0.01);
            room.add(w);
            const frame = new T.Mesh(new T.PlaneGeometry(2.56, 1.76), new T.MeshStandardMaterial({ color: '#4b5568' }));
            frame.position.set(x + 1.2, 1.8, -Wd / 2 + 0.005);
            room.add(frame);
        }
        // Right wall: whiteboards, a door. Hidden when the camera looks in
        // from that side.
        this.rightWall = new T.Group();
        room.add(this.rightWall);
        const right = new T.Mesh(new T.PlaneGeometry(len, H), wallMat);
        right.position.set(mid, H / 2, Wd / 2);
        right.rotation.y = Math.PI;
        this.rightWall.add(right);
        for (let x = 3; x < L - 2; x += 7) {
            const board = new T.Mesh(new T.PlaneGeometry(1.8, 0.9), new T.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.6 }));
            board.position.set(x, 1.55, Wd / 2 - 0.01);
            board.rotation.y = Math.PI;
            this.rightWall.add(board);
        }
        wall(Wd, H, L, H / 2, 0, -Math.PI / 2);
        wall(Wd, H, back, H / 2, 0, Math.PI / 2);
        const sign = this.label(`${L} m`, '#fde68a', 0.3);
        sign.position.set(L - 0.02, 2.4, 0);
        room.add(sign);

        // Ceiling and its lights.
        this.ceiling = new T.Group();
        room.add(this.ceiling);
        const ceil = new T.Mesh(new T.PlaneGeometry(len, Wd), new T.MeshStandardMaterial({ color: '#151b28' }));
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(mid, H, 0);
        this.ceiling.add(ceil);
        const lamp = new T.MeshBasicMaterial({ color: '#f1f5f9' });
        for (let x = 2; x < L; x += 4) for (const z of [-1.4, 1.4]) {
            const l = new T.Mesh(new T.PlaneGeometry(1.2, 0.3), lamp);
            l.rotation.x = Math.PI / 2;
            l.position.set(x, H - 0.01, z);
            this.ceiling.add(l);
        }

        // The thrower: just enough of a person to throw from.
        const body = new T.MeshStandardMaterial({ color: '#64748b', roughness: 0.8 });
        const person = new T.Group();
        const torso = new T.Mesh(new T.CylinderGeometry(0.15, 0.13, 0.62, 12), body);
        torso.position.set(0, 1.17, 0);
        const head = new T.Mesh(new T.SphereGeometry(0.11, 16, 12), body);
        head.position.set(0, 1.62, 0);
        const legs = new T.Mesh(new T.BoxGeometry(0.16, 0.86, 0.26), body);
        legs.position.set(0, 0.43, 0);
        // Reaching forward and across to the hand, at (0, release, 0).
        const arm = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.5, 8), body);
        arm.position.set(0.24, 1.5, 0.18);
        arm.rotation.set(0.6, 0, -Math.PI / 2.6);
        person.add(torso, head, legs, arm);
        person.position.set(-0.42, 0, -0.32);
        room.add(person);
    }

    floorTexture(len, width, back) {
        const T = this.T;
        const ppm = 64;
        const c = document.createElement('canvas');
        c.width = Math.round(len * ppm);
        c.height = Math.round(width * ppm);
        const g = c.getContext('2d');
        g.fillStyle = '#373c4b';
        g.fillRect(0, 0, c.width, c.height);
        // Carpet tiles.
        for (let i = 0; i < len * 2; i++) for (let j = 0; j < width * 2; j++) {
            g.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.03)';
            g.fillRect(i * ppm / 2, j * ppm / 2, ppm / 2, ppm / 2);
        }
        const X = (x) => (x - back) * ppm;
        const mid = c.height / 2;
        for (let m = 0; m <= len + back; m++) {
            const five = m % 5 === 0;
            g.fillStyle = five ? '#facc15' : 'rgba(250,204,21,0.5)';
            if (five && m > 0) g.fillRect(X(m) - 1.5, 0, 3, c.height);
            g.fillRect(X(m) - 1.5, mid - (five ? 18 : 9), 3, five ? 36 : 18);
            g.fillRect(X(m) - 1.5, 0, 3, 12);
            g.fillRect(X(m) - 1.5, c.height - 12, 3, 12);
            if (five && m > 0) {
                // Upright to someone standing at the hand, looking down the room.
                g.save();
                g.translate(X(m) - 10, mid + 40);
                g.rotate(Math.PI / 2);
                g.font = '700 30px Outfit, sans-serif';
                g.fillStyle = '#fde68a';
                g.textAlign = 'left';
                g.fillText(m + ' m', 0, 0);
                g.restore();
            }
        }
        const tex = new T.CanvasTexture(c);
        tex.anisotropy = 8;
        return tex;
    }

    windowTexture() {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 170;
        const g = c.getContext('2d');
        const sky = g.createLinearGradient(0, 0, 0, c.height);
        sky.addColorStop(0, '#26355c');
        sky.addColorStop(1, '#c2766a');
        g.fillStyle = sky;
        g.fillRect(0, 0, c.width, c.height);
        for (let b = 0; b < 11; b++) {
            const bx = (b * 37 % 100) / 100 * c.width - 10, bh = (0.25 + (b * 29 % 50) / 100) * c.height, bw = 30;
            g.fillStyle = '#18213a';
            g.fillRect(bx, c.height - bh, bw, bh);
            g.fillStyle = 'rgba(255,214,140,0.6)';
            for (let w = 0; w < 6; w++) g.fillRect(bx + 5 + (w % 2) * 12, c.height - bh + 6 + Math.floor(w / 2) * 12, 4, 4);
        }
        g.strokeStyle = '#4b5568';
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(c.width / 2, 0);
        g.lineTo(c.width / 2, c.height);
        g.stroke();
        return new this.T.CanvasTexture(c);
    }

    /** A text label that always faces the camera. */
    label(text, colour, height = 0.22) {
        const T = this.T;
        const c = document.createElement('canvas');
        const g = c.getContext('2d');
        const font = '700 56px Outfit, sans-serif';
        g.font = font;
        const w = Math.ceil(g.measureText(text).width) + 36;
        c.width = w; c.height = 84;
        g.font = font;
        g.fillStyle = 'rgba(15,20,32,0.78)';
        const r = 22;
        g.beginPath();
        g.moveTo(r, 0); g.lineTo(w - r, 0); g.quadraticCurveTo(w, 0, w, r); g.lineTo(w, 84 - r); g.quadraticCurveTo(w, 84, w - r, 84);
        g.lineTo(r, 84); g.quadraticCurveTo(0, 84, 0, 84 - r); g.lineTo(0, r); g.quadraticCurveTo(0, 0, r, 0);
        g.fill();
        g.fillStyle = colour;
        g.textBaseline = 'middle';
        g.fillText(text, 18, 44);
        const tex = new T.CanvasTexture(c);
        const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
        s.renderOrder = 10;
        s.scale.set(height * w / 84, height, 1);
        return s;
    }

    /** Desks (the mission's and the office's), the bin, fans, hoops and
        pillars of the current world. */
    furnish() {
        const T = this.T, P = this.props;
        const wood = new T.MeshStandardMaterial({ color: '#4a3f30', roughness: 0.8 });
        const green = new T.MeshStandardMaterial({ color: '#5b8a6a', roughness: 0.7, emissive: '#1f5136', emissiveIntensity: 0.6 });
        const metal = new T.MeshStandardMaterial({ color: '#2b2620' });
        const screen = new T.MeshStandardMaterial({ color: '#0f172a', emissive: '#1e293b' });
        const pot = new T.MeshStandardMaterial({ color: '#7c4a2d' });
        const leaf = new T.MeshStandardMaterial({ color: '#2f7a4c', roughness: 0.9 });
        (this.world.pads || []).forEach((p, i) => {
            const z0 = p.z0 ?? -0.8, z1 = p.z1 ?? 0.8, w = p.x1 - p.x0, d = z1 - z0;
            const top = new T.Mesh(new T.BoxGeometry(w, 0.05, d), p.scenery ? wood : green);
            top.position.set((p.x0 + p.x1) / 2, p.y - 0.025, (z0 + z1) / 2);
            P.add(top);
            for (const [lx, lz] of [[p.x0 + 0.06, z0 + 0.06], [p.x1 - 0.06, z0 + 0.06], [p.x0 + 0.06, z1 - 0.06], [p.x1 - 0.06, z1 - 0.06]]) {
                const leg = new T.Mesh(new T.BoxGeometry(0.05, p.y - 0.05, 0.05), metal);
                leg.position.set(lx, (p.y - 0.05) / 2, lz);
                P.add(leg);
            }
            if (p.scenery) {
                // A monitor against the wall, a plant beside every other desk.
                const wallSide = Math.sign(z0 + z1);
                const mon = new T.Mesh(new T.BoxGeometry(0.5, 0.32, 0.04), screen);
                mon.position.set((p.x0 + p.x1) / 2, p.y + 0.22, wallSide * 2.85);
                P.add(mon);
                if (i % 2 === 0) {
                    const px = p.x1 + 0.8, pz = wallSide * 2.7;
                    const pt = new T.Mesh(new T.CylinderGeometry(0.14, 0.11, 0.34, 12), pot);
                    pt.position.set(px, 0.17, pz);
                    P.add(pt);
                    for (let l = 0; l < 6; l++) {
                        const lf = new T.Mesh(new T.ConeGeometry(0.07, 0.42, 6), leaf);
                        lf.position.set(px + Math.cos(l) * 0.08, 0.55, pz + Math.sin(l) * 0.08);
                        lf.rotation.set(Math.sin(l) * 0.4, 0, Math.cos(l) * 0.4);
                        P.add(lf);
                    }
                }
            } else {
                const tag = this.label('land here', '#6ee7b7');
                tag.position.set((p.x0 + p.x1) / 2, p.y + 0.35, (z0 + z1) / 2);
                P.add(tag);
            }
        });
        const b = this.world.bin;
        if (b) {
            const r = b.width / 2;
            const bin = new T.Mesh(new T.CylinderGeometry(r, r * 0.8, 0.36, 24, 1, true), new T.MeshStandardMaterial({ color: '#334155', side: T.DoubleSide }));
            bin.position.set(b.x, 0.18, b.z || 0);
            const rim = new T.Mesh(new T.TorusGeometry(r, 0.012, 6, 32), new T.MeshStandardMaterial({ color: '#94a3b8' }));
            rim.rotation.x = Math.PI / 2;
            rim.position.set(b.x, 0.36, b.z || 0);
            const tag = this.label('🗑️ ' + b.x.toFixed(1) + ' m', '#f9a8d4');
            tag.position.set(b.x, 0.95, b.z || 0);
            P.add(bin, rim, tag);
        }
        for (const f of this.world.fans || []) {
            const g = new T.Group();
            const base = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.12, 20), new T.MeshStandardMaterial({ color: '#475569' }));
            base.position.y = 0.06;
            const blades = new T.Mesh(new T.CircleGeometry(0.19, 5), new T.MeshStandardMaterial({ color: '#94a3b8', side: T.DoubleSide }));
            blades.rotation.x = -Math.PI / 2;
            blades.position.y = 0.125;
            g.add(base, blades);
            // The draft: streaks rising through the column.
            const n = 70;
            const pos = new Float32Array(n * 3);
            const seeds = [];
            for (let k = 0; k < n; k++) seeds.push([Math.random(), Math.random() * Math.PI * 2, Math.sqrt(Math.random())]);
            const geo = new T.BufferGeometry();
            geo.setAttribute('position', new T.BufferAttribute(pos, 3));
            const pts = new T.Points(geo, new T.PointsMaterial({ color: '#93c5fd', size: 0.035, transparent: true, opacity: 0.55, depthWrite: false }));
            g.add(pts);
            g.position.set(f.x, 0, f.z || 0);
            P.add(g);
            this.fans.push({ f, blades, geo, seeds });
        }
        (this.world.hoops || []).forEach((h, i) => {
            const ring = new T.Mesh(new T.TorusGeometry(h.r, 0.025, 10, 48), new T.MeshStandardMaterial({ color: '#f472b6', emissive: '#831843', emissiveIntensity: 0.5 }));
            ring.rotation.y = Math.PI / 2;
            ring.position.set(h.x, h.y, h.z || 0);
            const pole = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, h.y - h.r, 6), new T.MeshStandardMaterial({ color: '#94a3b8' }));
            pole.position.set(h.x, (h.y - h.r) / 2, h.z || 0);
            ring.userData.hoop = i;
            P.add(ring, pole);
        });
        for (const pl of this.world.pillars || []) {
            const col = new T.Mesh(new T.CylinderGeometry(pl.r, pl.r, ROOM3D.ceiling, 24), new T.MeshStandardMaterial({ color: '#6b7280', roughness: 0.9 }));
            col.position.set(pl.x, ROOM3D.ceiling / 2, pl.z || 0);
            P.add(col);
        }
    }

    /** Hoops light up green once a flight has been through them. */
    paintHoops(passed) {
        for (const o of this.props.children) {
            if (o.userData.hoop === undefined) continue;
            const ok = passed && passed[o.userData.hoop];
            o.material.color.set(ok ? '#34d399' : '#f472b6');
            o.material.emissive.set(ok ? '#065f46' : '#831843');
        }
    }

    clear(group) {
        for (const c of [...group.children]) {
            group.remove(c);
            c.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    if (o.material.map) o.material.map.dispose();
                    o.material.dispose();
                }
            });
        }
    }

    /* ── The plane ── */

    planeMeshes(model, plane) {
        const T = this.T;
        const cgY = plane.info.cgY, lift = model.keel * 0.35;
        const pos = [], col = [], edges = [];
        const shade = (face) => (face === 0 ? [0.86, 0.9, 0.97] : [0.98, 0.97, 0.94]);
        for (const poly of model.polys) {
            const p = poly.pts.map(([X, Y, Z]) => [(cgY - Y) / 1000, (Z + lift) / 1000, X / 1000]);
            const c = shade(poly.face);
            for (let i = 1; i < p.length - 1; i++) for (const v of [p[0], p[i], p[i + 1]]) { pos.push(...v); col.push(...c); }
            for (let i = 0; i < p.length; i++) edges.push(...p[i], ...p[(i + 1) % p.length]);
        }
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
        geo.computeVertexNormals();
        const mesh = new T.Mesh(geo, new T.MeshStandardMaterial({
            vertexColors: true, side: T.DoubleSide, roughness: 0.85,
            polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
        }));
        const eg = new T.BufferGeometry();
        eg.setAttribute('position', new T.Float32BufferAttribute(edges, 3));
        const lines = new T.LineSegments(eg, new T.LineBasicMaterial({ color: '#475569', transparent: true, opacity: 0.7 }));
        return [mesh, lines];
    }

    blob() {
        const T = this.T;
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
        grad.addColorStop(0, 'rgba(0,0,0,0.55)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        const m = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
        m.rotation.x = -Math.PI / 2;
        return m;
    }

    line(colour, opacity) {
        const T = this.T;
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.BufferAttribute(new Float32Array(3 * 2), 3));
        const l = new T.Line(geo, new T.LineDashedMaterial({ color: colour, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity, depthWrite: false }));
        l.frustumCulled = false;
        l.visible = false;
        this.scene.add(l);
        return l;
    }

    drawLine(l, pts) {
        if (!pts || pts.length < 2) { l.visible = false; return; }
        const T = this.T;
        const arr = new Float32Array(pts.length * 3);
        pts.forEach((p, i) => { arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2]; });
        l.geometry.dispose();
        l.geometry = new T.BufferGeometry();
        l.geometry.setAttribute('position', new T.BufferAttribute(arr, 3));
        l.computeLineDistances();
        l.visible = true;
    }

    /** Where the plane is aimed: its first half-second, flown for real. */
    updateAim() {
        this.aimDirty = false;
        if (!this.plane) { this.aimLine.visible = false; return; }
        const s = launch3d(this.plane, this.aim);
        const pts = [[s.x, s.y, s.z]];
        for (let k = 1; k <= 120 && !s.sliding; k++) {
            step3d(s, this.plane, DT, this.world);
            if (k % 6 === 0) pts.push([s.x, s.y, s.z]);
        }
        this.drawLine(this.aimLine, pts);
    }

    /* ── Aiming by hand ── */

    bindPointer() {
        const c = this.canvas;
        c.addEventListener('pointerdown', (e) => {
            if (this.flight) return;
            c.setPointerCapture(e.pointerId);
            this.dragging = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
            this.touchedAt = performance.now();
        });
        c.addEventListener('pointermove', (e) => {
            const d = this.dragging;
            if (!d || d.id !== e.pointerId) return;
            // Pulled back like a catapult: the throw goes the other way.
            const ax = d.x0 - e.clientX, ay = d.y0 - e.clientY;
            const len = Math.hypot(ax, ay);
            if (len < 8) return;
            d.moved = true;
            const reach = Math.min(this.W, this.H) * 0.45;
            const speed = AIM_LIMITS.speed[0] + Math.min(1, len / reach) * (AIM_LIMITS.speed[1] - AIM_LIMITS.speed[0]);
            const deg = 180 / Math.PI;
            if (this.cam === 'side') {
                // Seen from the side, as in 2D: back and down for up and far.
                this.setAim({ speed, angle: Math.atan2(-ay, Math.max(1, ax)) * deg });
            } else if (this.cam === 'top') {
                // From above, the room runs left to right and the thrower's
                // right is down the screen: pull back and up to aim right.
                this.setAim({ speed, yaw: Math.atan2(ay, Math.max(1, ax)) * deg * 0.6 });
            } else {
                // From behind: pull down to throw, sideways to aim.
                this.setAim({ speed, yaw: Math.atan2(ax, Math.max(1, -ay)) * deg * 0.5 });
            }
        });
        c.addEventListener('pointerup', () => {
            const d = this.dragging;
            this.dragging = null;
            if (d && d.moved) this.throwIt();
        });
        c.addEventListener('pointercancel', () => { this.dragging = null; });
    }

    /* ── Every frame ── */

    frame(now, dt) {
        const T = this.T;
        if (this.aimDirty) this.updateAim();
        const ghost = this.hooks.ghost();
        const gk = ghost ? ghost.distance + ':' + ghost.path.length + ':' + (this.last ? this.last.distance : '') : null;
        if (gk !== this.ghostKey) {
            this.ghostKey = gk;
            this.drawLine(this.ghostTrail, ghost && ghost.path);
            if (this.ghostTag) { this.scene.remove(this.ghostTag); this.ghostTag.material.map.dispose(); this.ghostTag = null; }
            const e = ghost && ghost.path[ghost.path.length - 1];
            const sameSpot = e && this.last && Math.abs(this.last.distance - ghost.distance) < 0.6;
            if (ghost && !sameSpot) {
                this.ghostTag = this.label('best ' + ghost.distance.toFixed(1) + ' m', '#facc15', 0.16);
                this.ghostTag.position.set(e[0], 0.3, e[2]);
                this.scene.add(this.ghostTag);
            }
        }

        let pose = null, heading = null;
        const f = this.flight;
        if (f) {
            this.playT += dt * this.rate * (this.reduceMotion.matches && this.rate === 1 ? 3 : 1);
            pose = samplePath(f.path, this.playT);
            const ahead = samplePath(f.path, this.playT + 0.15);
            heading = [ahead.x - pose.x, ahead.z - pose.z];
            this.trail.geometry.setDrawRange(0, Math.min(f.path.length, Math.floor(this.playT / SAMPLE3D) + 1));
            if (pose.done) {
                this.flight = null;
                this.last = f;
                this.lastFinish = now;
                this.drawLine(this.trail, null);
                this.drawLine(this.lastTrail, f.path);
                this.markLanding(f);
                this.paintHoops(f.hoops);
                if (this.replaying) this.replaying = false;
                else this.hooks.onLanded(f);
            }
        } else if (this.last) {
            const e = this.last.path[this.last.path.length - 1];
            pose = { x: e[0], y: e[1], z: e[2], q: [e[3], e[4], e[5], e[6]] };
        }

        // The plane in flight, or where it came down.
        this.flying.visible = !!pose;
        if (pose) {
            this.flying.position.set(pose.x, pose.y, pose.z);
            this.flying.quaternion.set(pose.q[1], pose.q[2], pose.q[3], pose.q[0]);
        }
        // The next one waits in the hand once the camera is back home.
        const home = !f && (!this.last || now - this.lastFinish > 2600 || this.touchedAt > this.lastFinish);
        this.ready.visible = home && !!this.plane;
        if (this.plane) {
            const q = launch3d(this.plane, this.aim).q;
            this.ready.position.set(HOME.x, HOME.y, HOME.z);
            this.ready.quaternion.set(q[1], q[2], q[3], q[0]);
        }
        this.aimLine.visible = home && this.aimLine.geometry.attributes.position.count > 1;
        const k = PLANE_SCALE[this.cam];
        this.flying.scale.setScalar(k);
        this.ready.scale.setScalar(k);

        const at = pose && !home ? pose : HOME;
        this.shadow.position.set(at.x, 0.004, at.z);
        const hgt = at.y;
        this.shadow.material.opacity = clamp(1 - hgt / 3.5, 0.15, 1);
        this.shadow.scale.setScalar(k * (1 + hgt * 0.25));

        this.moveCamera(now, dt, home ? null : pose, heading);

        for (const fan of this.fans) {
            fan.blades.rotation.z += dt * 18;
            const a = fan.geo.attributes.position.array, r = fan.f.width / 2, top = fan.f.height;
            const t = now / 1000;
            fan.seeds.forEach(([ph, ang, rad], i) => {
                const u = (ph + t * fan.f.up * 0.35) % 1;
                a[i * 3] = Math.cos(ang) * rad * r * 0.9;
                a[i * 3 + 1] = 0.2 + u * (top - 0.2);
                a[i * 3 + 2] = Math.sin(ang) * rad * r * 0.9;
            });
            fan.geo.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    markLanding(f) {
        const T = this.T;
        this.clear(this.marker);
        const ring = new T.Mesh(new T.RingGeometry(0.16, 0.2, 32), new T.MeshBasicMaterial({ color: '#facc15', transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2;
        const e = f.path[f.path.length - 1];
        ring.position.set(e[0], e[1] + 0.006, e[2]);
        const side = Math.abs(f.offset) >= 0.05 ? ` · ${Math.abs(f.offset).toFixed(1)} m ${f.offset > 0 ? 'right' : 'left'}` : '';
        const tag = this.label(f.distance.toFixed(1) + ' m' + side, '#fef08a', 0.2);
        tag.position.set(e[0], e[1] + 0.32, e[2]);
        this.marker.add(ring, tag);
    }

    moveCamera(now, dt, pose, heading) {
        const T = this.T;
        const W = ROOM3D.width / 2 - 0.15;
        let pos, look, up = new T.Vector3(0, 1, 0), fov = 55;
        const yaw = this.aim.yaw * Math.PI / 180;
        const at = pose || HOME;
        if (this.cam === 'side') {
            const x = clamp(at.x + 1.2, 3, ROOM3D.length - 3);
            pos = new T.Vector3(x, 1.6, 6.2);
            look = new T.Vector3(x, 1.45, 0);
            fov = 40;
        } else if (this.cam === 'top') {
            const x = clamp(at.x + 2, 4.5, ROOM3D.length - 5);
            pos = new T.Vector3(x, 13, 0.001);
            look = new T.Vector3(x, 0, 0);
            up = new T.Vector3(0, 0, -1);
            fov = 40;
        } else if (!pose) {
            // At the hand, behind the thrower, looking where the throw will go.
            const dx = Math.cos(yaw), dz = Math.sin(yaw);
            pos = new T.Vector3(HOME.x - dx * 1.5, 2.0, HOME.z - dz * 1.5 + 0.4);
            look = new T.Vector3(HOME.x + dx * 7, 0.9, HOME.z + dz * 7);
        } else {
            // Following: behind the plane along its track, a little above.
            let hx = heading ? heading[0] : 1, hz = heading ? heading[1] : 0;
            const L = Math.hypot(hx, hz);
            if (L < 1e-4) { hx = this.lastHead ? this.lastHead[0] : 1; hz = this.lastHead ? this.lastHead[1] : 0; }
            else { hx /= L; hz /= L; }
            this.lastHead = [hx, hz];
            // Once it is down, step back and look down at where it lies.
            const down = !this.flight;
            const back = down ? 2.6 : 1.05, rise = down ? 1.4 : 0.26;
            pos = new T.Vector3(at.x - hx * back, clamp(at.y + rise, 0.6, ROOM3D.ceiling - 0.1), clamp(at.z - hz * back, -W, W));
            look = down ? new T.Vector3(at.x, at.y, at.z) : new T.Vector3(at.x + hx * 1.5, at.y - 0.05, at.z + hz * 1.5);
        }
        const snap = this.snapCamera || this.reduceMotion.matches;
        this.snapCamera = false;
        const k = snap ? 1 : 1 - Math.exp(-dt * (pose ? 12 : 2.5));
        this.camPos.lerp(pos, k);
        this.camLook.lerp(look, k);
        if (this.camera.fov !== fov) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
        this.camera.up.copy(up);
        this.camera.position.copy(this.camPos);
        this.camera.lookAt(this.camLook);
    }
}
