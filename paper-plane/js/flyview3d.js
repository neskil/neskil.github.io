// Paper Plane Glider — the office in 3D. The same job as flyview.js (aim,
// throw, play the flight back, say how it went) with the room built in
// three.js (vendor/three.min.js, loaded by app.js before this is made) and
// the flight from flight3d.js, so it can curve, veer and hit the walls.
//
// World and body axes as in flight3d.js. The plane is built from model.js's
// polygons (mm: X across, Y nose to tail, Z up), moved into body axes with
// its balance point near the origin: [(cgY - Y), (Z + keel * 0.35), X] / 1000.
// That swap flips handedness, so the paper is drawn double-sided.
//
// Colours are written as the sRGB hex they should look like and converted to
// linear (C(), below), because the renderer works in linear light and
// tone-maps (ACES) on the way out. Canvas textures are marked sRGB for the
// same reason. The page background is a clear colour, which three.js does
// not convert, so it stays as written.
import { ROOM3D, AIM_LIMITS, SAMPLE3D, fly3d, samplePath, launch3d, step3d, rotate } from './flight3d.js';
import { DT } from './flight.js';

const HOME = { x: 0, y: ROOM3D.release, z: 0 };
const CAMS = ['action', 'chase', 'side', 'top'];
const CAM_KEY = 'paperplane.camera';
/** How much bigger the plane is drawn than it is, by camera: a real one is
    25 cm long, which is a speck seen from the side of a 24 m room. */
const PLANE_SCALE = { action: 1.6, chase: 1.6, side: 3.2, top: 3.2 };
const BG = '#141a29';
/** Where the strip lights hang. */
const LAMPS = [];
for (let x = 2; x < ROOM3D.length; x += 4) for (const z of [-1.4, 1.4]) LAMPS.push([x, z]);

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

/** A small seeded random, so the room's speckle is the same every visit. */
function seeded(seed) {
    let h = seed >>> 0;
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

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
        this.thrownAt = -1e9;
        this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let cam = 'action';
        try { cam = localStorage.getItem(CAM_KEY) || 'action'; } catch (e) { /* no storage */ }
        this.cam = CAMS.includes(cam) ? cam : 'action';

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(BG);
        this.scene.fog = new THREE.Fog(this.C(BG), 14, 40);
        this.camera = new THREE.PerspectiveCamera(55, 1, 0.03, 90);
        this.camPos = new THREE.Vector3(-1.6, 2.1, 0);
        this.camLook = new THREE.Vector3(6, 1, 0);

        this.scene.add(new THREE.HemisphereLight(this.C('#dbe6ff'), this.C('#3b3326'), 0.75));
        // The strip lights, as one soft key from above that throws the
        // plane's shadow on the floor. Its shadow camera follows the plane.
        this.key = new THREE.DirectionalLight(this.C('#fff4e2'), 1.15);
        this.key.castShadow = true;
        this.key.shadow.mapSize.set(1024, 1024);
        const sc = this.key.shadow.camera;
        sc.left = -1.6; sc.right = 1.6; sc.top = 1.6; sc.bottom = -1.6; sc.near = 0.5; sc.far = 9;
        this.key.shadow.bias = -0.0015;
        this.key.shadow.radius = 3;
        this.scene.add(this.key, this.key.target);
        // Dusk through the windows on the left.
        const dusk = new THREE.DirectionalLight(this.C('#ffb38a'), 0.35);
        dusk.position.set(6, 2.5, -9);
        this.scene.add(dusk);

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

        this.wake = this.ribbon();
        this.lastTrail = this.line('#e2e8f0', 0.28);
        this.ghostTrail = this.line('#facc15', 0.45);
        this.aimLine = this.line('#7dd3fc', 0.9);
        this.marker = new THREE.Group();
        this.scene.add(this.marker);
        this.puffs = [];
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

    /** An sRGB colour as the renderer's linear one. */
    C(hex) { return new this.T.Color(hex).convertSRGBToLinear(); }

    /** A standard material with its colours given as they should look. */
    mat(o = {}) {
        const m = new this.T.MeshStandardMaterial({ roughness: 0.85, ...o, color: this.C(o.color || '#ffffff') });
        if (o.emissive) m.emissive = this.C(o.emissive);
        return m;
    }

    canvasTexture(c) {
        const t = new this.T.CanvasTexture(c);
        t.encoding = this.T.sRGBEncoding;
        t.anisotropy = 8;
        return t;
    }

    fit() {
        const box = this.canvas.parentElement.getBoundingClientRect();
        if (!box.width || !box.height) return;
        this.W = box.width;
        this.H = box.height;
        // Phones fill a lot of pixels for a small screen: 1.5 is plenty.
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        this.renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1));
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
        this.wake.visible = false;
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
        this.cam = CAMS.includes(name) ? name : 'action';
        try { localStorage.setItem(CAM_KEY, this.cam); } catch (e) { /* no storage */ }
        // Cut-away walls: whatever is between the camera and the room.
        this.rightWall.visible = this.cam !== 'side';
        this.ceiling.visible = this.cam !== 'top';
        this.snapCamera = true;
        this.shot = null;
        this.hooks.onCamera && this.hooks.onCamera(this.cam);
    }

    nextCamera() { this.setCamera(CAMS[(CAMS.indexOf(this.cam) + 1) % CAMS.length]); }

    throwIt() {
        if (this.flight || !this.plane) return;
        this.flight = fly3d(this.plane, this.aim, this.world);
        this.thrownAt = performance.now();
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
        this.shot = null;
        this.puffed = false;
        this.setWake(this.flight.path);
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

        const floor = new T.Mesh(new T.PlaneGeometry(len, Wd), new T.MeshStandardMaterial({ map: this.floorTexture(len, Wd, back), roughness: 0.95 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(mid, 0, 0);
        floor.receiveShadow = true;
        room.add(floor);

        const wallTex = this.wallTexture();
        const wallMat = new T.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
        const wall = (w, h, x, y, z, ry, parent = room) => {
            const m = new T.Mesh(new T.PlaneGeometry(w, h), wallMat);
            m.position.set(x, y, z);
            m.rotation.y = ry;
            parent.add(m);
            return m;
        };
        // Left wall, with windows onto the city at dusk.
        wall(len, H, mid, H / 2, -Wd / 2, 0);
        const winTex = this.windowTexture();
        const frameMat = this.mat({ color: '#525d72', roughness: 0.5, metalness: 0.3 });
        for (let x = 1.5; x < L - 1; x += 6) {
            const w = new T.Mesh(new T.PlaneGeometry(2.4, 1.6), new T.MeshBasicMaterial({ map: winTex }));
            w.position.set(x + 1.2, 1.8, -Wd / 2 + 0.012);
            room.add(w);
            const frame = new T.Mesh(new T.BoxGeometry(2.6, 1.8, 0.008), frameMat);
            frame.position.set(x + 1.2, 1.8, -Wd / 2 + 0.004);
            room.add(frame);
            const sill = new T.Mesh(new T.BoxGeometry(2.7, 0.04, 0.16), frameMat);
            sill.position.set(x + 1.2, 0.98, -Wd / 2 + 0.08);
            room.add(sill);
        }
        // Right wall: whiteboards, a door. Hidden when the camera looks in
        // from that side.
        this.rightWall = new T.Group();
        room.add(this.rightWall);
        wall(len, H, mid, H / 2, Wd / 2, Math.PI, this.rightWall);
        const boards = [this.boardTexture(0), this.boardTexture(1), this.boardTexture(2)];
        const frameLight = this.mat({ color: '#9aa4b5', roughness: 0.4, metalness: 0.5 });
        for (let x = 3, k = 0; x < L - 2; x += 7, k++) {
            const board = new T.Mesh(new T.PlaneGeometry(1.8, 0.9), new T.MeshStandardMaterial({ map: boards[k % 3], roughness: 0.35 }));
            board.position.set(x, 1.55, Wd / 2 - 0.012);
            board.rotation.y = Math.PI;
            const rim = new T.Mesh(new T.BoxGeometry(1.86, 0.96, 0.02), frameLight);
            rim.position.set(x, 1.55, Wd / 2 - 0.006);
            this.rightWall.add(rim, board);
        }
        const door = new T.Mesh(new T.BoxGeometry(0.95, 2.1, 0.04), this.mat({ color: '#6b4f36', roughness: 0.7 }));
        door.position.set(L - 2.4, 1.05, Wd / 2 - 0.02);
        this.rightWall.add(door);
        wall(Wd, H, L, H / 2, 0, -Math.PI / 2);
        wall(Wd, H, back, H / 2, 0, Math.PI / 2);
        const sign = this.label(`${L} m`, '#fde68a', 0.3);
        sign.position.set(L - 0.02, 2.4, 0);
        room.add(sign);
        // A poster behind the thrower, for the action camera's first shot.
        const poster = new T.Mesh(new T.PlaneGeometry(1.1, 1.5), new T.MeshStandardMaterial({ map: this.posterTexture(), roughness: 0.6 }));
        poster.position.set(back + 0.015, 1.65, -0.9);
        poster.rotation.y = Math.PI / 2;
        room.add(poster);
        // A clock on the far wall.
        const clock = new T.Mesh(new T.CircleGeometry(0.28, 40), new T.MeshBasicMaterial({ map: this.clockTexture() }));
        clock.position.set(L - 0.015, 2.55, 1.6);
        clock.rotation.y = -Math.PI / 2;
        room.add(clock);

        // Ceiling and its lights, each with a soft glow under it.
        this.ceiling = new T.Group();
        room.add(this.ceiling);
        const ceil = new T.Mesh(new T.PlaneGeometry(len, Wd), this.mat({ color: '#1b2232', roughness: 1 }));
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(mid, H, 0);
        this.ceiling.add(ceil);
        const lamp = new T.MeshBasicMaterial({ color: this.C('#fffaf0') });
        const glowTex = this.glowTexture();
        const glow = new T.MeshBasicMaterial({ map: glowTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: this.C('#ffe9c4'), opacity: 0.55 });
        for (const [x, z] of LAMPS) {
            const l = new T.Mesh(new T.PlaneGeometry(1.2, 0.3), lamp);
            l.rotation.x = Math.PI / 2;
            l.position.set(x, H - 0.01, z);
            const g = new T.Mesh(new T.PlaneGeometry(2.4, 1.1), glow);
            g.rotation.x = Math.PI / 2;
            g.position.set(x, H - 0.02, z);
            this.ceiling.add(l, g);
        }

        // The thrower: just enough of a person to throw from, with an arm
        // that follows through.
        const shirt = this.mat({ color: '#4f6d9a', roughness: 0.8 });
        const skin = this.mat({ color: '#d9a78a', roughness: 0.7 });
        const trousers = this.mat({ color: '#2b3245', roughness: 0.9 });
        const person = new T.Group();
        const torso = new T.Mesh(new T.CylinderGeometry(0.16, 0.13, 0.62, 16), shirt);
        torso.position.set(0, 1.17, 0);
        const head = new T.Mesh(new T.SphereGeometry(0.11, 20, 16), skin);
        head.position.set(0, 1.62, 0);
        const hair = new T.Mesh(new T.SphereGeometry(0.115, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.mat({ color: '#3b2a20' }));
        hair.position.set(-0.01, 1.64, 0);
        const legs = new T.Mesh(new T.BoxGeometry(0.17, 0.86, 0.27), trousers);
        legs.position.set(0, 0.43, 0);
        // The arm, from the shoulder to the hand at (0, release, 0).
        const shoulder = new T.Vector3(0.06, 1.4, 0.13);
        const hand = new T.Vector3(0.42, ROOM3D.release, 0.32);
        const dir = hand.clone().sub(shoulder);
        const len2 = dir.length();
        this.shoulder = new T.Group();
        this.shoulder.position.copy(shoulder);
        const arm = new T.Mesh(new T.CylinderGeometry(0.035, 0.04, len2, 10), shirt);
        arm.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
        arm.position.copy(dir.clone().multiplyScalar(0.5));
        const fist = new T.Mesh(new T.SphereGeometry(0.04, 12, 10), skin);
        fist.position.copy(dir);
        this.shoulder.add(arm, fist);
        person.add(torso, head, hair, legs, this.shoulder);
        person.position.set(-0.42, 0, -0.32);
        for (const m of [torso, head, legs, arm]) m.castShadow = true;
        room.add(person);
    }

    floorTexture(len, width, back) {
        const ppm = 64;
        const c = document.createElement('canvas');
        c.width = Math.round(len * ppm);
        c.height = Math.round(width * ppm);
        const g = c.getContext('2d');
        g.fillStyle = '#3a3f4e';
        g.fillRect(0, 0, c.width, c.height);
        const rnd = seeded(7);
        // Carpet tiles, each laid a little differently.
        const tile = ppm / 2;
        for (let i = 0; i < len * 2; i++) for (let j = 0; j < width * 2; j++) {
            const v = rnd();
            g.fillStyle = (i + j) % 2 ? `rgba(255,255,255,${0.012 + v * 0.02})` : `rgba(0,0,0,${0.03 + v * 0.03})`;
            g.fillRect(i * tile, j * tile, tile, tile);
        }
        // Fibre speckle.
        for (let k = 0; k < c.width * c.height / 40; k++) {
            g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
            g.fillRect(rnd() * c.width, rnd() * c.height, 1.5, 1.5);
        }
        const X = (x) => (x - back) * ppm;
        const Zc = (z) => (z + width / 2) * ppm;
        // Pools of light under the lamps, and dusk spilling in by the windows.
        g.globalCompositeOperation = 'lighter';
        for (const [x, z] of LAMPS) {
            const r = g.createRadialGradient(X(x), Zc(z), 0, X(x), Zc(z), ppm * 2.2);
            r.addColorStop(0, 'rgba(255, 236, 200, 0.12)');
            r.addColorStop(1, 'rgba(255, 236, 200, 0)');
            g.fillStyle = r;
            g.fillRect(X(x) - ppm * 2.3, Zc(z) - ppm * 2.3, ppm * 4.6, ppm * 4.6);
        }
        for (let x = 1.5; x < len + back - 1; x += 6) {
            const s = g.createLinearGradient(0, 0, 0, ppm * 1.6);
            s.addColorStop(0, 'rgba(255, 150, 110, 0.10)');
            s.addColorStop(1, 'rgba(255, 150, 110, 0)');
            g.fillStyle = s;
            g.beginPath();
            g.moveTo(X(x), 0); g.lineTo(X(x + 2.4), 0); g.lineTo(X(x + 3.0), ppm * 1.6); g.lineTo(X(x + 0.6), ppm * 1.6);
            g.fill();
        }
        g.globalCompositeOperation = 'source-over';
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
        return this.canvasTexture(c);
    }

    /** Painted plaster, lit from the ceiling, with a skirting board. */
    wallTexture() {
        const c = document.createElement('canvas');
        c.width = 16; c.height = 256;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, c.height);
        grad.addColorStop(0, '#46526b');
        grad.addColorStop(0.35, '#38425a');
        grad.addColorStop(1, '#2a3245');
        g.fillStyle = grad;
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#1c2230';
        g.fillRect(0, c.height - 9, c.width, 9);
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(0, c.height - 10, c.width, 1);
        const t = this.canvasTexture(c);
        t.anisotropy = 1;
        return t;
    }

    windowTexture() {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 340;
        const g = c.getContext('2d');
        const sky = g.createLinearGradient(0, 0, 0, c.height);
        sky.addColorStop(0, '#1d2a4f');
        sky.addColorStop(0.55, '#5b4a72');
        sky.addColorStop(0.85, '#e0866a');
        sky.addColorStop(1, '#f2b27a');
        g.fillStyle = sky;
        g.fillRect(0, 0, c.width, c.height);
        const rnd = seeded(3);
        g.fillStyle = 'rgba(255,255,255,0.7)';
        for (let k = 0; k < 40; k++) g.fillRect(rnd() * c.width, rnd() * c.height * 0.4, 1.4, 1.4);
        // Two rows of towers, the far one hazier.
        for (const [shade, lit, scale, base] of [['#3a3557', 'rgba(255,214,150,0.35)', 0.8, 0.92], ['#151b31', 'rgba(255,214,140,0.75)', 1, 1]]) {
            let x = -20;
            while (x < c.width) {
                const bw = 30 + rnd() * 50, bh = (0.28 + rnd() * 0.45) * c.height * scale;
                const top = c.height * base - bh;
                g.fillStyle = shade;
                g.fillRect(x, top, bw, c.height - top);
                g.fillStyle = lit;
                for (let wy = top + 8; wy < c.height - 6; wy += 12) for (let wx = x + 5; wx < x + bw - 6; wx += 10) if (rnd() < 0.45) g.fillRect(wx, wy, 5, 6);
                x += bw + 4 + rnd() * 10;
            }
        }
        g.strokeStyle = '#4b5568';
        g.lineWidth = 10;
        g.beginPath();
        g.moveTo(c.width / 2, 0);
        g.lineTo(c.width / 2, c.height);
        g.stroke();
        return this.canvasTexture(c);
    }

    /** Whiteboards with what an office would leave on them. */
    boardTexture(k) {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 256;
        const g = c.getContext('2d');
        g.fillStyle = '#eef1f5';
        g.fillRect(0, 0, c.width, c.height);
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.font = '600 26px "Comic Sans MS", "Marker Felt", cursive';
        if (k === 0) {
            g.fillStyle = '#1d4ed8';
            g.fillText('Q3 targets', 24, 44);
            g.strokeStyle = '#1d4ed8'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(40, 210); g.lineTo(140, 160); g.lineTo(220, 180); g.lineTo(330, 90); g.stroke();
            g.strokeStyle = '#dc2626';
            g.beginPath(); g.moveTo(300, 90); g.lineTo(330, 90); g.lineTo(325, 118); g.stroke();
            g.fillStyle = '#16a34a'; g.fillText('✓ fold more planes', 270, 210);
        } else if (k === 1) {
            g.strokeStyle = '#111827'; g.lineWidth = 3;
            // A paper dart, and the arrows of the forces on it.
            g.beginPath(); g.moveTo(120, 140); g.lineTo(330, 120); g.lineTo(150, 100); g.lineTo(175, 122); g.closePath(); g.stroke();
            g.strokeStyle = '#2563eb';
            g.beginPath(); g.moveTo(230, 118); g.lineTo(225, 40); g.moveTo(215, 55); g.lineTo(225, 40); g.lineTo(237, 54); g.stroke();
            g.strokeStyle = '#dc2626';
            g.beginPath(); g.moveTo(230, 125); g.lineTo(230, 215); g.moveTo(220, 200); g.lineTo(230, 215); g.lineTo(240, 200); g.stroke();
            g.fillStyle = '#2563eb'; g.fillText('lift', 245, 50);
            g.fillStyle = '#dc2626'; g.fillText('weight', 245, 215);
            g.fillStyle = '#111827'; g.fillText('L/D ≈ 5', 380, 130);
        } else {
            g.fillStyle = '#9333ea';
            g.fillText('NO PLANES IN', 30, 60);
            g.fillText('THE MEETING ROOM', 30, 100);
            g.strokeStyle = '#dc2626'; g.lineWidth = 4;
            g.beginPath(); g.moveTo(24, 74); g.lineTo(300, 74); g.stroke();
            g.fillStyle = '#ea580c'; g.fillText('…ok fine', 300, 170);
        }
        return this.canvasTexture(c);
    }

    posterTexture() {
        const c = document.createElement('canvas');
        c.width = 220; c.height = 300;
        const g = c.getContext('2d');
        const bg = g.createLinearGradient(0, 0, 0, c.height);
        bg.addColorStop(0, '#0e7490');
        bg.addColorStop(1, '#1e3a8a');
        g.fillStyle = bg;
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#fef9c3';
        g.beginPath(); g.moveTo(40, 170); g.lineTo(185, 95); g.lineTo(70, 128); g.lineTo(88, 150); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(254, 249, 195, 0.6)'; g.lineWidth = 3; g.setLineDash([8, 8]);
        g.beginPath(); g.moveTo(20, 230); g.quadraticCurveTo(30, 180, 40, 170); g.stroke();
        g.setLineDash([]);
        g.fillStyle = '#facc15';
        g.font = '800 30px Outfit, sans-serif';
        g.textAlign = 'center';
        g.fillText('OFFICE', 110, 48);
        g.fillText('OPEN', 110, 80);
        g.font = '600 15px Inter, sans-serif';
        g.fillStyle = '#e0f2fe';
        g.fillText('paper plane cup', 110, 262);
        g.fillText('fly far · fly true', 110, 284);
        return this.canvasTexture(c);
    }

    clockTexture() {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = '#f8fafc';
        g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
        g.lineWidth = 5; g.strokeStyle = '#1f2937'; g.stroke();
        g.fillStyle = '#1f2937';
        for (let h = 0; h < 12; h++) {
            const a = h / 12 * Math.PI * 2;
            g.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 2, 4, 4);
        }
        g.lineCap = 'round';
        g.lineWidth = 5;
        g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + 26, 64 - 15); g.stroke();
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(64, 64); g.lineTo(64 - 8, 64 - 42); g.stroke();
        return this.canvasTexture(c);
    }

    glowTexture() {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        r.addColorStop(0, 'rgba(255,255,255,1)');
        r.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = r;
        g.fillRect(0, 0, 64, 64);
        return this.canvasTexture(c);
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
        const tex = this.canvasTexture(c);
        const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
        s.renderOrder = 10;
        s.scale.set(height * w / 84, height, 1);
        return s;
    }

    /** Desks (the mission's and the office's), the bin, fans, hoops and
        pillars of the current world. */
    furnish() {
        const T = this.T, P = this.props;
        const woods = ['#6d5a42', '#5e4d39', '#7a6448'].map(c => this.mat({ color: c, roughness: 0.65 }));
        const green = this.mat({ color: '#5fae7c', roughness: 0.6, emissive: '#1f6b40', emissiveIntensity: 0.55 });
        const metal = this.mat({ color: '#3a3f4a', roughness: 0.4, metalness: 0.6 });
        const screen = this.mat({ color: '#0b1220', emissive: '#3b82c4', emissiveIntensity: 0.45, roughness: 0.3 });
        const bezel = this.mat({ color: '#111827', roughness: 0.4 });
        const pot = this.mat({ color: '#b5693f', roughness: 0.8 });
        const leaf = this.mat({ color: '#3f9a5c', roughness: 0.9 });
        const seat = this.mat({ color: '#334155', roughness: 0.9 });
        const solid = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
        (this.world.pads || []).forEach((p, i) => {
            const z0 = p.z0 ?? -0.8, z1 = p.z1 ?? 0.8, w = p.x1 - p.x0, d = z1 - z0;
            const top = solid(new T.Mesh(new T.BoxGeometry(w, 0.05, d), p.scenery ? woods[i % 3] : green));
            top.position.set((p.x0 + p.x1) / 2, p.y - 0.025, (z0 + z1) / 2);
            P.add(top);
            for (const [lx, lz] of [[p.x0 + 0.06, z0 + 0.06], [p.x1 - 0.06, z0 + 0.06], [p.x0 + 0.06, z1 - 0.06], [p.x1 - 0.06, z1 - 0.06]]) {
                const leg = new T.Mesh(new T.BoxGeometry(0.05, p.y - 0.05, 0.05), metal);
                leg.position.set(lx, (p.y - 0.05) / 2, lz);
                P.add(leg);
            }
            if (p.scenery) {
                // A monitor against the wall, a chair, a plant by every other desk.
                const wallSide = Math.sign(z0 + z1);
                const cx = (p.x0 + p.x1) / 2;
                const mon = new T.Mesh(new T.BoxGeometry(0.52, 0.34, 0.03), bezel);
                mon.position.set(cx, p.y + 0.25, wallSide * 2.86);
                const glass = new T.Mesh(new T.PlaneGeometry(0.48, 0.3), screen);
                glass.position.set(cx, p.y + 0.25, wallSide * 2.84);
                glass.rotation.y = wallSide > 0 ? Math.PI : 0;
                const stand = new T.Mesh(new T.BoxGeometry(0.05, 0.1, 0.05), metal);
                stand.position.set(cx, p.y + 0.05, wallSide * 2.87);
                P.add(mon, glass, stand);
                const chair = new T.Group();
                const cs = new T.Mesh(new T.BoxGeometry(0.44, 0.06, 0.42), seat);
                cs.position.y = 0.46;
                const cb = new T.Mesh(new T.BoxGeometry(0.44, 0.5, 0.06), seat);
                cb.position.set(0, 0.74, -wallSide * 0.2);
                const cp = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.42, 8), metal);
                cp.position.y = 0.22;
                const cf = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.03, 5), metal);
                cf.position.y = 0.03;
                chair.add(cs, cb, cp, cf);
                chair.position.set(cx + (i % 2 ? 0.2 : -0.15), 0, wallSide * 1.95);
                chair.rotation.y = (i % 3 - 1) * 0.35;
                P.add(chair);
                if (i % 2 === 0) {
                    const px = p.x1 + 0.8, pz = wallSide * 2.7;
                    const pt = new T.Mesh(new T.CylinderGeometry(0.14, 0.11, 0.34, 16), pot);
                    pt.position.set(px, 0.17, pz);
                    P.add(pt);
                    for (let l = 0; l < 9; l++) {
                        const lf = new T.Mesh(new T.ConeGeometry(0.06, 0.46, 6), leaf);
                        lf.position.set(px + Math.cos(l * 2.4) * 0.07, 0.56, pz + Math.sin(l * 2.4) * 0.07);
                        lf.rotation.set(Math.sin(l * 2.4) * 0.45, 0, Math.cos(l * 2.4) * 0.45);
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
            const bin = solid(new T.Mesh(new T.CylinderGeometry(r, r * 0.8, 0.36, 32, 1, true), this.mat({ color: '#475569', side: T.DoubleSide, roughness: 0.5, metalness: 0.3 })));
            bin.position.set(b.x, 0.18, b.z || 0);
            const rim = new T.Mesh(new T.TorusGeometry(r, 0.014, 8, 40), this.mat({ color: '#cbd5e1', metalness: 0.6, roughness: 0.3 }));
            rim.rotation.x = Math.PI / 2;
            rim.position.set(b.x, 0.36, b.z || 0);
            const target = new T.Mesh(new T.RingGeometry(r * 1.4, r * 1.55, 48), new T.MeshBasicMaterial({ color: this.C('#f9a8d4'), transparent: true, opacity: 0.5, depthWrite: false }));
            target.rotation.x = -Math.PI / 2;
            target.position.set(b.x, 0.005, b.z || 0);
            const tag = this.label('🗑️ ' + b.x.toFixed(1) + ' m', '#f9a8d4');
            tag.position.set(b.x, 0.95, b.z || 0);
            P.add(bin, rim, target, tag);
        }
        for (const f of this.world.fans || []) {
            const g = new T.Group();
            const base = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.12, 24), this.mat({ color: '#475569', metalness: 0.3, roughness: 0.5 }));
            base.position.y = 0.06;
            const blades = new T.Mesh(new T.CircleGeometry(0.19, 5), this.mat({ color: '#94a3b8', side: T.DoubleSide }));
            blades.rotation.x = -Math.PI / 2;
            blades.position.y = 0.125;
            g.add(base, blades);
            // The draft: streaks rising through the column.
            const n = 90;
            const pos = new Float32Array(n * 3);
            const seeds = [];
            for (let k = 0; k < n; k++) seeds.push([Math.random(), Math.random() * Math.PI * 2, Math.sqrt(Math.random())]);
            const geo = new T.BufferGeometry();
            geo.setAttribute('position', new T.BufferAttribute(pos, 3));
            const pts = new T.Points(geo, new T.PointsMaterial({ color: this.C('#93c5fd'), size: 0.04, transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending }));
            pts.frustumCulled = false;
            g.add(pts);
            g.position.set(f.x, 0, f.z || 0);
            P.add(g);
            this.fans.push({ f, blades, geo, seeds });
        }
        (this.world.hoops || []).forEach((h, i) => {
            const ring = new T.Mesh(new T.TorusGeometry(h.r, 0.028, 12, 64), this.mat({ color: '#f472b6', emissive: '#be185d', emissiveIntensity: 0.9, roughness: 0.4 }));
            ring.rotation.y = Math.PI / 2;
            ring.position.set(h.x, h.y, h.z || 0);
            const pole = solid(new T.Mesh(new T.CylinderGeometry(0.012, 0.012, h.y - h.r, 8), metal));
            pole.position.set(h.x, (h.y - h.r) / 2, h.z || 0);
            ring.userData.hoop = i;
            P.add(ring, pole);
        });
        for (const pl of this.world.pillars || []) {
            const col = solid(new T.Mesh(new T.CylinderGeometry(pl.r, pl.r, ROOM3D.ceiling, 32), this.mat({ color: '#8b919c', roughness: 0.95 })));
            col.position.set(pl.x, ROOM3D.ceiling / 2, pl.z || 0);
            P.add(col);
        }
    }

    /** Hoops light up green once a flight has been through them. */
    paintHoops(passed) {
        for (const o of this.props.children) {
            if (o.userData.hoop === undefined) continue;
            const ok = passed && passed[o.userData.hoop];
            o.material.color.copy(this.C(ok ? '#34d399' : '#f472b6'));
            o.material.emissive.copy(this.C(ok ? '#059669' : '#be185d'));
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
        const front = this.C('#f8fbff'), backc = this.C('#fffaf0'), keel = this.C('#e8edf5');
        for (const poly of model.polys) {
            const p = poly.pts.map(([X, Y, Z]) => [(cgY - Y) / 1000, (Z + lift) / 1000, X / 1000]);
            const c = poly.keel ? keel : poly.face === 0 ? front : backc;
            for (let i = 1; i < p.length - 1; i++) for (const v of [p[0], p[i], p[i + 1]]) { pos.push(...v); col.push(c.r, c.g, c.b); }
            for (let i = 0; i < p.length; i++) edges.push(...p[i], ...p[(i + 1) % p.length]);
        }
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
        geo.computeVertexNormals();
        const mesh = new T.Mesh(geo, new T.MeshStandardMaterial({
            vertexColors: true, side: T.DoubleSide, roughness: 0.78,
            // Paper glows a little in a dim room: light comes through it.
            emissive: this.C('#3a4152'), emissiveIntensity: 0.6,
            polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
        }));
        mesh.castShadow = true;
        const eg = new T.BufferGeometry();
        eg.setAttribute('position', new T.Float32BufferAttribute(edges, 3));
        const lines = new T.LineSegments(eg, new T.LineBasicMaterial({ color: this.C('#64748b'), transparent: true, opacity: 0.55 }));
        return [mesh, lines];
    }

    blob() {
        const T = this.T;
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
        grad.addColorStop(0, 'rgba(0,0,0,0.35)');
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
        const l = new T.Line(geo, new T.LineDashedMaterial({ color: this.C(colour), dashSize: 0.12, gapSize: 0.1, transparent: true, opacity, depthWrite: false }));
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

    /** The wake behind the plane: a ribbon as wide as the wings and turned
        with them, so it shows the plane rolling, fading out behind it. It is
        drawn additively, so fading is just darkening. */
    ribbon() {
        const T = this.T;
        const m = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({
            vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false,
        }));
        m.frustumCulled = false;
        m.visible = false;
        this.scene.add(m);
        return m;
    }

    setWake(path) {
        const T = this.T, n = path.length;
        const pos = new Float32Array(n * 6), col = new Float32Array(n * 6), idx = [];
        const half = 0.018 * PLANE_SCALE[this.cam];
        path.forEach((p, i) => {
            const w = rotate([p[3], p[4], p[5], p[6]], [0, 0, half]);
            pos.set([p[0] - w[0], p[1] - w[1], p[2] - w[2], p[0] + w[0], p[1] + w[1], p[2] + w[2]], i * 6);
            if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
        });
        const g = this.wake.geometry;
        g.dispose();
        this.wake.geometry = new T.BufferGeometry();
        this.wake.geometry.setAttribute('position', new T.BufferAttribute(pos, 3));
        this.wake.geometry.setAttribute('color', new T.BufferAttribute(col, 3));
        this.wake.geometry.setIndex(idx);
        this.wake.geometry.setDrawRange(0, 0);
        this.wake.visible = true;
    }

    /** Lights the wake up to sample `head`, fading with age. */
    fadeWake(head) {
        const g = this.wake.geometry, col = g.attributes.color.array;
        const n = col.length / 6, from = Math.max(0, head - 200);
        col.fill(0, 0, from * 6);
        for (let i = from; i < n; i++) {
            const age = (head - i) * SAMPLE3D;
            const a = i > head ? 0 : 0.2 * Math.exp(-age / 0.5);
            for (let k = 0; k < 2; k++) { col[i * 6 + k * 3] = 0.85 * a; col[i * 6 + k * 3 + 1] = 0.92 * a; col[i * 6 + k * 3 + 2] = a; }
        }
        g.attributes.color.needsUpdate = true;
        g.setDrawRange(0, Math.max(0, head) * 6);
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

    /** A puff of dust where it came down: a ring spreading on the floor. */
    puff(x, y, z) {
        const T = this.T;
        const ring = new T.Mesh(new T.RingGeometry(0.06, 0.1, 40), new T.MeshBasicMaterial({ color: this.C('#e2e8f0'), transparent: true, opacity: 0.7, depthWrite: false, side: T.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, y + 0.008, z);
        this.scene.add(ring);
        this.puffs.push({ ring, t: 0 });
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
            d.pull = Math.min(1, len / reach);
            const speed = AIM_LIMITS.speed[0] + d.pull * (AIM_LIMITS.speed[1] - AIM_LIMITS.speed[0]);
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
            // The action camera slows down for the landing.
            const slow = this.cam === 'action' && this.shot === 'landing' && this.rate === 1 ? 0.55 : 1;
            this.playT += dt * this.rate * slow * (this.reduceMotion.matches && this.rate === 1 ? 3 : 1);
            pose = samplePath(f.path, this.playT);
            const ahead = samplePath(f.path, this.playT + 0.15);
            heading = [ahead.x - pose.x, ahead.z - pose.z];
            this.fadeWake(Math.min(f.path.length - 1, Math.floor(this.playT / SAMPLE3D) + 1));
            if (!this.puffed && this.playT >= f.time) {
                this.puffed = true;
                const at = samplePath(f.path, f.time);
                this.puff(at.x, at.y, at.z);
            }
            if (pose.done) {
                this.flight = null;
                this.last = f;
                this.lastFinish = now;
                this.wake.visible = false;
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

        // The plane in flight, or where it came down, with a flutter on top:
        // paper is never quite still, and a stalled sheet shakes.
        this.flying.visible = !!pose;
        if (pose) {
            this.flying.position.set(pose.x, pose.y, pose.z);
            this.flying.quaternion.set(pose.q[1], pose.q[2], pose.q[3], pose.q[0]);
            if (f && !pose.done && !this.reduceMotion.matches) this.flutter(f, pose, now);
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
        // The key light's shadow follows the plane.
        this.key.position.set(at.x - 0.8, at.y + 5, at.z + 0.6);
        this.key.target.position.set(at.x, at.y, at.z);
        this.shadow.position.set(at.x, 0.004, at.z);
        const hgt = at.y;
        this.shadow.material.opacity = clamp(1 - hgt / 3.5, 0.1, 0.8);
        this.shadow.scale.setScalar(k * (1.2 + hgt * 0.4));

        // The arm follows through after a throw.
        const since = (now - this.thrownAt) / 1000;
        const swing = since < 0.25 ? smooth(since / 0.25) : since < 1.2 ? 1 : 1 - smooth((since - 1.2) / 0.5);
        this.shoulder.rotation.set(0, 0, -0.9 * swing);

        this.moveCamera(now, dt, home ? null : pose, heading);

        for (const fan of this.fans) {
            fan.blades.rotation.z += dt * 18;
            const a = fan.geo.attributes.position.array, r = fan.f.width / 2, top = fan.f.height;
            const t = now / 1000;
            fan.seeds.forEach(([ph, ang, rad], i) => {
                const u = (ph + t * fan.f.up * 0.35) % 1;
                a[i * 3] = Math.cos(ang + u * 2) * rad * r * 0.9;
                a[i * 3 + 1] = 0.2 + u * (top - 0.2);
                a[i * 3 + 2] = Math.sin(ang + u * 2) * rad * r * 0.9;
            });
            fan.geo.attributes.position.needsUpdate = true;
        }
        for (let i = this.puffs.length - 1; i >= 0; i--) {
            const p = this.puffs[i];
            p.t += dt;
            const u = p.t / 0.7;
            p.ring.scale.setScalar(1 + u * 5);
            p.ring.material.opacity = 0.7 * (1 - u);
            if (u >= 1) { this.scene.remove(p.ring); p.ring.geometry.dispose(); p.ring.material.dispose(); this.puffs.splice(i, 1); }
        }

        this.renderer.render(this.scene, this.camera);
    }

    /** A little roll and pitch on top of the flown attitude: a few hundredths
        of a radian in smooth air, much more while it is stalled. Only the
        picture shakes; the flight itself is what flight3d.js worked out. */
    flutter(f, pose, now) {
        const T = this.T;
        const ahead = samplePath(f.path, this.playT + SAMPLE3D);
        const v = [ahead.x - pose.x, ahead.y - pose.y, ahead.z - pose.z];
        const V = Math.hypot(...v) / SAMPLE3D;
        if (V < 0.3) return;
        const nose = rotate(pose.q, [1, 0, 0]);
        const along = (nose[0] * v[0] + nose[1] * v[1] + nose[2] * v[2]) / (V * SAMPLE3D);
        const off = Math.acos(clamp(along, -1, 1));
        const stalled = smooth((off - 0.3) / 0.3);
        const t = now / 1000;
        const amp = 0.012 + 0.002 * V + 0.14 * stalled;
        const roll = amp * (Math.sin(t * 37) * 0.6 + Math.sin(t * 23 + 1.3) * 0.4);
        const pitch = amp * 0.5 * Math.sin(t * 29 + 0.7);
        this.flying.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(roll, 0, pitch, 'XYZ')));
    }

    markLanding(f) {
        const T = this.T;
        this.clear(this.marker);
        const ring = new T.Mesh(new T.RingGeometry(0.16, 0.2, 40), new T.MeshBasicMaterial({ color: this.C('#facc15'), transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2;
        const e = f.path[f.path.length - 1];
        ring.position.set(e[0], e[1] + 0.006, e[2]);
        const side = Math.abs(f.offset) >= 0.05 ? ` · ${Math.abs(f.offset).toFixed(1)} m ${f.offset > 0 ? 'right' : 'left'}` : '';
        const tag = this.label(f.distance.toFixed(1) + ' m' + side, '#fef08a', 0.2);
        tag.position.set(e[0], e[1] + 0.32, e[2]);
        this.marker.add(ring, tag);
    }

    /** Which shot the action camera is on, `t` seconds into flight `f`:
        the launch, seen from ahead of the hand; tracking alongside; and,
        for the last moments, low on the floor where it is about to land. */
    actionShot(f, t) {
        const air = f.time;
        if (t < Math.min(0.65, air * 0.35)) return 'launch';
        if (air > 1.3 && t > air - 0.85 && t < air + 1.5) return 'landing';
        if (t >= air) return 'landing';
        return 'track';
    }

    moveCamera(now, dt, pose, heading) {
        const T = this.T;
        const W = ROOM3D.width / 2 - 0.15;
        let pos, look, up = new T.Vector3(0, 1, 0), fov = 55;
        const yaw = this.aim.yaw * Math.PI / 180;
        const at = pose || HOME;
        // Following: which way the plane is going along the floor.
        let hx = heading ? heading[0] : Math.cos(yaw), hz = heading ? heading[1] : Math.sin(yaw);
        const hl = Math.hypot(hx, hz);
        if (hl < 1e-4) { hx = this.lastHead ? this.lastHead[0] : 1; hz = this.lastHead ? this.lastHead[1] : 0; }
        else { hx /= hl; hz /= hl; }
        if (pose) this.lastHead = [hx, hz];
        let rate = pose ? 12 : 2.5;
        const flight = this.flight || (pose && this.last);
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
            this.shot = null;
        } else if (this.cam === 'action' && flight) {
            const t = this.flight ? this.playT : Infinity;
            const shot = this.actionShot(flight, t);
            if (shot !== this.shot) {
                this.shot = shot;
                this.snapCamera = true;
                this.shotPos = null;
                // Track on the side with more room.
                this.trackSide = at.z > 0.8 ? -1 : 1;
            }
            const ay = this.aim.yaw * Math.PI / 180;
            if (shot === 'launch') {
                // Low, ahead and to the right of the hand: it comes at us and
                // sails past.
                if (!this.shotPos) this.shotPos = new T.Vector3(3.4 * Math.cos(ay) - 1.3 * Math.sin(ay), 1.6, 3.4 * Math.sin(ay) + 1.3 * Math.cos(ay));
                pos = this.shotPos;
                look = new T.Vector3(at.x, at.y, at.z);
                fov = 40;
                rate = 30;
            } else if (shot === 'track') {
                // Alongside, swinging slowly from ahead of it to behind.
                const u = clamp((t - 0.6) / Math.max(0.8, flight.time - 1.4), 0, 1);
                const ang = (0.35 + 0.9 * u) * Math.PI / 2;
                const side = this.trackSide ?? 1;
                const sx = -hz * side, sz = hx * side;
                const dist = 1.15;
                pos = new T.Vector3(
                    at.x + (Math.cos(ang) * hx + Math.sin(ang) * sx) * dist,
                    clamp(at.y + 0.18, 0.25, ROOM3D.ceiling - 0.15),
                    at.z + (Math.cos(ang) * hz + Math.sin(ang) * sz) * dist);
                look = new T.Vector3(at.x + hx * 0.25, at.y, at.z + hz * 0.25);
                fov = 50;
                rate = 9;
            } else {
                // Down on the floor, a little beyond where it lands, looking
                // back at it coming in.
                if (!this.shotPos) {
                    const land = samplePath(flight.path, flight.time);
                    const e = flight.path[flight.path.length - 1];
                    const lx = e[0] - land.x, lz = e[2] - land.z, ll = Math.hypot(lx, lz);
                    const gx = ll > 0.2 ? lx / ll : hx, gz = ll > 0.2 ? lz / ll : hz;
                    this.shotPos = new T.Vector3(e[0] + gx * 1.3 - gz * 0.55, e[1] + 0.16, e[2] + gz * 1.3 + gx * 0.55);
                }
                pos = this.shotPos;
                look = new T.Vector3(at.x, at.y + 0.04, at.z);
                fov = 42;
                rate = 30;
            }
        } else {
            // Following: behind the plane along its track, a little above.
            // Once it is down, step back and look down at where it lies.
            const down = !this.flight;
            const back = down ? 2.6 : 1.05, rise = down ? 1.4 : 0.26;
            pos = new T.Vector3(at.x - hx * back, clamp(at.y + rise, 0.6, ROOM3D.ceiling - 0.1), clamp(at.z - hz * back, -W, W));
            look = down ? new T.Vector3(at.x, at.y, at.z) : new T.Vector3(at.x + hx * 1.5, at.y - 0.05, at.z + hz * 1.5);
        }
        // Inside the room, whatever the shot.
        pos = new T.Vector3(clamp(pos.x, -1.85, ROOM3D.length - 0.15), clamp(pos.y, 0.1, ROOM3D.ceiling - 0.08), clamp(pos.z, -W, W));
        const snap = this.snapCamera || this.reduceMotion.matches;
        this.snapCamera = false;
        const k = snap ? 1 : 1 - Math.exp(-dt * rate);
        this.camPos.lerp(pos, k);
        this.camLook.lerp(look, k);
        if (Math.abs(this.camera.fov - fov) > 0.01) {
            this.camera.fov = snap ? fov : this.camera.fov + (fov - this.camera.fov) * Math.min(1, dt * 4);
            this.camera.updateProjectionMatrix();
        }
        this.camera.up.copy(up);
        this.camera.position.copy(this.camPos);
        this.camera.lookAt(this.camLook);
    }
}
