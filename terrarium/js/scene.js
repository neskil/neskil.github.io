// Pocket Weather Terrarium — the jar, in three dimensions (three.js r128,
// vendored, loaded as a global before this module).
//
// Two scenes share one canvas. The world inside the glass has its own sky, sun
// and moon and is lit by them; the jar itself, its cork and the wooden stand
// sit in the room and are lit by the room. The inner one is drawn first and
// the room second, without clearing depth in between, so the glass and the
// cork fall over the little world the way they would on a shelf.
//
// Units: the jar is 1 wide in radius and stands on y = 0; the meadow is at
// about y = 0.86 and the cork tops out at 3.34. Inside the jar, -z is "back"
// as the page first shows it, and the sun travels east (-x) to west (+x).

const THREE = window.THREE;
import { createVisitors } from './visitors.js';

/* ── Seeded scenery: the jar looks the same every visit ── */
function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), a | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** An sRGB 0..255 triple as a linear three.js colour, for lit materials. */
const lin = (c, k = 1) => new THREE.Color(c[0] / 255 * k, c[1] / 255 * k, c[2] / 255 * k).convertSRGBToLinear();
const setLin = (col, c, k = 1) => col.setRGB(c[0] / 255 * k, c[1] / 255 * k, c[2] / 255 * k).convertSRGBToLinear();
/** The same triple raw, for the hand-written shaders, which output sRGB. */
const raw = (v, c) => v.set(c[0] / 255, c[1] / 255, c[2] / 255);

/* ── The jar's outline, radius against height ── */
const PROFILE = (() => {
    const p = [[0, 0], [0.84, 0], [0.93, 0.02], [0.985, 0.08], [1, 0.18], [1, 2.4]];
    // Shoulder: a quadratic from the body into the neck.
    for (let k = 1; k <= 12; k++) {
        const s = k / 12;
        const x = (1 - s) * (1 - s) * 1 + 2 * (1 - s) * s * 1 + s * s * 0.62;
        const y = (1 - s) * (1 - s) * 2.4 + 2 * (1 - s) * s * 2.86 + s * s * 2.94;
        p.push([x, y]);
    }
    p.push([0.62, 3.08], [0.665, 3.1], [0.68, 3.14], [0.665, 3.18], [0.62, 3.19]);
    return p;
})();

/** Inner radius of the glass at a height, for keeping things inside it. */
function jarRadius(y) {
    for (let k = 1; k < PROFILE.length; k++) {
        const [x0, y0] = PROFILE[k - 1], [x1, y1] = PROFILE[k];
        if (y <= y1 && y1 > y0) return x0 + (x1 - x0) * ((y - y0) / (y1 - y0));
    }
    return 0.6;
}

/* ── The ground ── */
const POND = { x: -0.36, z: 0.3, r: 0.23 };
const CABIN = { x: 0.44, z: -0.3 };
const TREE = { x: 0.0, z: -0.06 };
const LANTERN = { x: 0.17, z: 0.15 };
const BASE = 0.86;            // the meadow's resting height
const WATER_Y = BASE - 0.025;

function groundH(x, z) {
    const r = Math.hypot(x, z);
    const th = Math.atan2(z, x);
    const rim = smooth(0.42, 0.96, r);
    const hills = rim * rim * (0.13 + 0.09 * Math.sin(2 * th + 0.3) + 0.05 * Math.sin(5 * th + 1.3));
    const pd = Math.hypot(x - POND.x, z - POND.z);
    const pond = Math.exp(-(pd * pd) / 0.028);
    const cd = Math.hypot(x - CABIN.x, z - CABIN.z);
    const flat = Math.exp(-(cd * cd) / 0.03);
    const roll = 0.022 * Math.sin(x * 5 + 1) * Math.cos(z * 4 - 0.5) * (1 - pond);
    return (BASE + roll + hills) * (1 - flat * 0.8) + (BASE + 0.01 + hills) * flat * 0.8 - 0.06 * pond;
}

/* ── Canvas textures ── */
function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
}

const softTex = () => canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
});

function speckled(w, h, base, specks, seed) {
    return canvasTex(w, h, (g) => {
        const R = rng(seed);
        g.fillStyle = base;
        g.fillRect(0, 0, w, h);
        for (const [colour, n, size] of specks) {
            g.fillStyle = colour;
            for (let k = 0; k < n; k++) g.fillRect(R() * w, R() * h, size * (0.5 + R()), size * (0.4 + R() * 0.6));
        }
    });
}

/* ── Soft round points: snow, stars, fireflies, splashes, condensation ── */
const POINT_VS = `
attribute float aSize; attribute float aAlpha; attribute float aPhase;
uniform float uScale; uniform float uTime; uniform float uTwinkle;
varying float vAlpha;
void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / -mv.z;
    vAlpha = aAlpha * (1.0 - uTwinkle + uTwinkle * (0.55 + 0.45 * sin(uTime * 1.7 + aPhase)));
}`;
const POINT_FS = `
uniform vec3 uColor; uniform float uOpacity; uniform float uHard;
varying float vAlpha;
void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = 1.0 - smoothstep(uHard, 1.0, d);
    if (a <= 0.0) discard;
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
}`;

/* ── The sky, painted on the inside of the glass ── */
const SKY_VS = `
varying vec3 vPos;
void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FS = `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uGlow;
uniform float uSunGlow; uniform float uFlash; uniform float uNight;
varying vec3 vPos;
float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
void main() {
    float t = smoothstep(0.85, 2.85, vPos.y);
    vec3 c = mix(uHorizon, uTop, pow(t, 0.8));
    vec3 d = normalize(vPos - vec3(0.0, 1.0, 0.0));
    // Sky brightening round the sun: a broad wash plus a tight bright aureole.
    float cosA = max(dot(d, uSunDir), 0.0);
    c += uGlow * (pow(cosA, 5.0) * 0.7 + pow(cosA, 60.0) * 1.1) * uSunGlow;
    // The Milky Way on clear nights: a tilted band of mottled light with a
    // dark dust lane down the middle of it.
    if (uNight > 0.01) {
        float off = dot(d, normalize(vec3(0.55, 0.3, 0.78)));
        float band = exp(-off * off / 0.035);
        float n = noise(d * 9.0) * 0.55 + noise(d * 23.0) * 0.3 + noise(d * 61.0) * 0.15;
        float lane = exp(-pow(off + 0.04 * (noise(d * 7.0) - 0.5), 2.0) / 0.003);
        c += vec3(0.62, 0.66, 0.85) * band * smoothstep(0.35, 0.85, n) * (1.0 - 0.7 * lane) * 0.3 * uNight * t;
    }
    c = mix(c, vec3(0.86, 0.9, 1.0), uFlash * 0.45);
    gl_FragColor = vec4(c, 1.0);
}`;

/* ── Glass: a Fresnel rim, two long window reflections, a hot spot on the
   shoulder. Worked out in view space, so the reflections stay put while the
   jar turns under them, as a real one's would. ── */
const GLASS_VS = `
varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv;
void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vY = position.y;
    vUv = uv;
    gl_Position = projectionMatrix * mv;
}`;
const GLASS_FS = `
uniform float uFront; uniform float uDamp; uniform sampler2D uSmudge;
varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv;
void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    float facing = abs(dot(n, v));
    float fres = pow(1.0 - facing, 2.6);
    vec3 r = reflect(-v, n);
    float body = smoothstep(0.2, 0.5, vY) * (1.0 - smoothstep(2.25, 2.55, vY));
    // The room, reflected: a big softbox up to the left, a narrow window to
    // the right, a ceiling brighter than the floor.
    float box = smoothstep(0.17, 0.07, abs(r.x + 0.42)) * smoothstep(-0.15, 0.2, r.y) * smoothstep(0.98, 0.75, r.y);
    float win = smoothstep(0.07, 0.025, abs(r.x - 0.6)) * smoothstep(-0.05, 0.3, r.y);
    float room = 0.05 * smoothstep(-0.4, 0.7, r.y);
    vec3 l = normalize(vec3(-0.45, 0.75, 0.55));
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 80.0);
    float base = 1.0 - smoothstep(0.0, 0.1, vY);
    // Fingerprints and dust, only where the light catches them.
    float smudge = texture2D(uSmudge, vUv * vec2(4.0, 1.6)).r;
    float hl = uFront * ((box * 0.26 + win * 0.16) * body * (0.75 + 0.6 * smudge) + spec * 0.95);
    // Thick glass goes greener at the edges, with a hint of blue in the rim.
    vec3 tint = mix(vec3(0.72, 0.9, 0.86), vec3(0.55, 0.82, 0.78), fres);
    vec3 col = mix(tint, vec3(1.0), clamp(hl * 3.0 + fres * 0.25, 0.0, 1.0));
    col += vec3(-0.04, 0.0, 0.06) * smoothstep(0.55, 0.95, 1.0 - facing);
    float a = 0.022 + fres * (0.45 + 0.15 * uFront) + hl + room * uFront + base * 0.16
            + uDamp * 0.05 * uFront + smudge * 0.03 * uFront * (0.3 + box + fres);
    gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
}`;

export function createJar(canvas, { onTap, reduceMotion }) {
    // Phones and small machines get the same jar with less work per frame:
    // a coarser shadow map, fewer grass blades, a pond reflection refreshed
    // less often, and a lower pixel ratio.
    const lite = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
    const inner = new THREE.Scene();
    const room = new THREE.Scene();
    // Everything turns together when the jar is turned on its stand.
    const world = new THREE.Group();
    const shell = new THREE.Group();
    inner.add(world);
    room.add(shell);

    const R = rng(20261011);
    const R2 = rng(5150);
    const soft = softTex();
    const pointMats = [];
    function points(n, { color, size, hard = 0.3, twinkle = 0, additive = false }) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n).fill(size), 1));
        g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
        g.setAttribute('aPhase', new THREE.BufferAttribute(Float32Array.from({ length: n }, () => R() * 6.28), 1));
        const m = new THREE.ShaderMaterial({
            vertexShader: POINT_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
            uniforms: { uColor: { value: new THREE.Vector3(...color) }, uOpacity: { value: 1 }, uHard: { value: hard }, uScale: { value: 600 }, uTime: { value: 0 }, uTwinkle: { value: twinkle } },
        });
        pointMats.push(m);
        const p = new THREE.Points(g, m);
        p.frustumCulled = false;
        world.add(p);
        return p;
    }

    /* ── The room, as a reflection map for anything shiny ── */
    const envTex = (() => {
        const env = new THREE.Scene();
        env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
            side: THREE.BackSide,
            vertexShader: 'varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader: 'varying vec3 vP; void main() { float y = normalize(vP).y; vec3 c = mix(vec3(0.05, 0.04, 0.035), vec3(0.32, 0.34, 0.38), smoothstep(-0.3, 0.6, y)); gl_FragColor = vec4(c, 1.0); }',
        })));
        const panel = (w, h, x, y, z, k) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k * 0.97, k * 0.92), side: THREE.DoubleSide }));
            m.position.set(x, y, z);
            m.lookAt(0, 0, 0);
            env.add(m);
        };
        panel(5, 4, -5, 5, 4, 6);     // the softbox
        panel(1.2, 5, 7, 2, -2, 2.5); // a window
        // A plain mipmapped cube rather than PMREM, whose float targets come
        // out black on some GPUs; rough surfaces just read a blurrier mip.
        const rt = new THREE.WebGLCubeRenderTarget(256, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
        rt.texture.encoding = THREE.sRGBEncoding;
        const cam = new THREE.CubeCamera(0.1, 50, rt);
        env.add(cam);
        renderer.autoClear = true;
        cam.update(renderer, env);
        renderer.autoClear = false;
        return rt.texture;
    })();
    room.environment = envTex;

    /* ── Sky dome ── */
    const skyUniforms = {
        uTop: { value: new THREE.Vector3() }, uHorizon: { value: new THREE.Vector3() },
        uSunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() }, uGlow: { value: new THREE.Vector3(1, 0.8, 0.5) },
        uSunGlow: { value: 0 }, uFlash: { value: 0 }, uNight: { value: 0 },
    };
    const domePts = PROFILE.filter(([, y]) => y >= 0.75 && y <= 2.97).map(([x, y]) => new THREE.Vector2(x * 0.975, y));
    domePts.unshift(new THREE.Vector2(0.975, 0.75));
    domePts.push(new THREE.Vector2(0.6, 2.98), new THREE.Vector2(0, 2.98));
    const dome = new THREE.Mesh(new THREE.LatheGeometry(domePts, 72),
        new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, uniforms: skyUniforms, side: THREE.BackSide }));
    world.add(dome);

    // Stars sit just inside the dome, above the hills.
    const stars = points(90, { color: [1, 1, 1], size: 0.022, hard: 0.2, twinkle: 1 });
    {
        const pos = stars.geometry.attributes.position, size = stars.geometry.attributes.aSize;
        for (let k = 0; k < 90; k++) {
            const y = 1.3 + Math.pow(R(), 0.8) * 1.45;
            const a = R() * 6.283, r = jarRadius(y) * 0.93;
            pos.setXYZ(k, Math.sin(a) * r, y, Math.cos(a) * r);
            size.setX(k, 0.012 + R() * 0.024);
        }
    }

    // Now and then on a clear night, a shooting star: a bright head and a
    // fading trail of soft points, gone in under a second.
    const TRAIL = 14;
    const meteor = points(TRAIL, { color: [1, 0.96, 0.88], size: 0.03, hard: 0.1, additive: true });
    meteor.visible = false;
    meteor.geometry.attributes.aSize.array.forEach((_, k, a) => { a[k] = 0.034 * (1 - k / TRAIL * 0.75); });
    const shooting = { f: -1, next: 5 + R2() * 8, from: new THREE.Vector3(), dir: new THREE.Vector3() };

    /* ── Sun and moon ── */
    // The sun in layers, all additive and drawn past tone mapping so it can
    // actually be bright: a white-hot disc with a warm limb, a tight corona,
    // a wide glow that fills the sky round it, and faint rays that turn
    // slowly. Each is depth-tested, so the tree and hills still cover it.
    const add = (map, size) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        s.scale.set(size, size, 1);
        world.add(s);
        return s;
    };
    const radial = (stops) => canvasTex(128, 128, (g, w) => {
        const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        for (const [at, c] of stops) r.addColorStop(at, c);
        g.fillStyle = r; g.fillRect(0, 0, w, w);
    });
    const sunGlow = add(radial([[0, 'rgba(255,255,255,0.5)'], [0.25, 'rgba(255,255,255,0.18)'], [0.6, 'rgba(255,255,255,0.05)'], [1, 'rgba(255,255,255,0)']]), 1.5);
    const sunRays = add(canvasTex(256, 256, (g, w) => {
        const Rr = rng(97);
        g.translate(w / 2, w / 2);
        for (let k = 0; k < 28; k++) {
            const a = k / 28 * 6.283 + (Rr() - 0.5) * 0.2, len = w * (0.14 + Rr() * 0.3), wid = 0.6 + Rr() * 1.4;
            const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
            gr.addColorStop(0, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.strokeStyle = gr; g.lineWidth = wid; g.lineCap = 'round';
            g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
        }
    }), 0.95);
    const sunHalo = add(radial([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,255,255,0.75)'], [0.45, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]), 0.46);
    const sunCore = add(radial([[0, 'rgba(255,255,255,1)'], [0.42, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.85)'], [0.56, 'rgba(255,255,255,0.25)'], [0.7, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), 0.2);
    const sunLimb = new THREE.Color();

    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = moonCanvas.height = 128;
    const moonTex = new THREE.CanvasTexture(moonCanvas);
    moonTex.encoding = THREE.sRGBEncoding;
    let moonDrawn = -1;
    function drawMoon(phase) {
        const g = moonCanvas.getContext('2d');
        g.clearRect(0, 0, 128, 128);
        g.save();
        g.fillStyle = '#e8ecf5';
        g.beginPath(); g.arc(64, 64, 52, 0, 6.283); g.fill();
        g.fillStyle = 'rgba(180,186,200,0.5)';
        for (const [x, y, r] of [[48, 50, 9], [76, 76, 12], [80, 44, 6], [52, 84, 5]]) { g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
        // The shadow is a second disc slid across: none at full, all at new.
        const lit = 1 - Math.abs(phase - 0.5) * 2;
        const dir = phase < 0.5 ? -1 : 1;
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = 'rgba(14,18,40,0.9)';
        g.beginPath(); g.arc(64 + dir * 104 * lit, 64, 53, 0, 6.283); g.fill();
        g.restore();
        moonTex.needsUpdate = true;
        moonDrawn = phase;
    }
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, toneMapped: false }));
    moon.scale.set(0.17, 0.17, 1);
    const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0xc8d4ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    moonGlow.scale.set(0.6, 0.6, 1);
    world.add(moonGlow, moon);

    /* ── Sunbeams, low in the sky: screen-aligned, so turned by hand to point
       from the sun down at the meadow ── */
    const shaftTex = canvasTex(64, 256, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'destination-in';
        const side = g.createLinearGradient(0, 0, w, 0);
        side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(0.5, 'rgba(0,0,0,1)'); side.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = side; g.fillRect(0, 0, w, h);
    });
    const shafts = [[-0.1, 0.14, 1], [0.06, 0.09, 0.8], [0.17, 0.12, 0.6]].map(([off, width, k]) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        s.userData = { off, width, k };
        world.add(s);
        return s;
    });
    const shaftA = new THREE.Vector3(), shaftB = new THREE.Vector3(), shaftDir = new THREE.Vector3();

    /* ── Light inside the jar ── */
    const hemi = new THREE.HemisphereLight(0xffffff, 0x2a3a1c, 0.6);
    const ambient = new THREE.AmbientLight(0x8090c0, 0.12);
    const flashLight = new THREE.AmbientLight(0xdde6ff, 0);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.setScalar(lite ? 1024 : 2048);
    Object.assign(sunLight.shadow.camera, { left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 0.1, far: 7 });
    sunLight.shadow.bias = -0.0006;
    sunLight.shadow.normalBias = 0.015;
    sunLight.target.position.set(0, BASE + 0.1, 0);
    world.add(hemi, ambient, flashLight, sunLight, sunLight.target);

    /* ── Ground: a polar grid so the rim can rise into hills ── */
    const NR = 30, NS = 96;
    const grass = [74, 140, 70], dry = [118, 136, 66], mud = [70, 78, 46], soilTop = [74, 50, 34];
    function buildGround() {
        const pos = [], col = [], idx = [];
        const push = (x, y, z, c) => { pos.push(x, y, z); const l = lin(c); col.push(l.r, l.g, l.b); };
        const N = rng(7);
        const tone = (x, z, y) => {
            const pd = Math.hypot(x - POND.x, z - POND.z);
            let c = grass.map((v, i) => v + (dry[i] - v) * clamp01((y - BASE - 0.06) * 4));
            const n = N() * 0.12 - 0.06;
            c = c.map(v => v * (1 + n));
            const wet = smooth(POND.r + 0.1, POND.r - 0.02, pd);
            return c.map((v, i) => v + (mud[i] - v) * wet);
        };
        const y0 = groundH(0, 0);
        push(0, y0, 0, tone(0, 0, y0));
        for (let i = 1; i <= NR; i++) {
            const r = 0.965 * Math.pow(i / NR, 0.85);
            for (let j = 0; j < NS; j++) {
                const a = j / NS * 6.2832;
                const x = Math.cos(a) * r, z = Math.sin(a) * r, y = groundH(x, z);
                push(x, y, z, tone(x, z, y));
            }
        }
        const ring = (i, j) => 1 + (i - 1) * NS + (j % NS);
        for (let j = 0; j < NS; j++) idx.push(0, ring(1, j + 1), ring(1, j));
        for (let i = 1; i < NR; i++) {
            for (let j = 0; j < NS; j++) {
                const a = ring(i, j), b = ring(i, j + 1), c = ring(i + 1, j), d = ring(i + 1, j + 1);
                idx.push(a, b, d, a, d, c);
            }
        }
        const top = new THREE.BufferGeometry();
        top.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        top.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        top.setAttribute('uv', new THREE.Float32BufferAttribute(pos.flatMap((v, i) => i % 3 === 1 ? [] : [v * 2.4]), 2));
        top.setIndex(idx);
        top.computeVertexNormals();

        // The cut face of the turf, seen through the glass.
        const sp = [], si = [];
        for (let j = 0; j <= NS; j++) {
            const a = j / NS * 6.2832, r = 0.965;
            const x = Math.cos(a) * r, z = Math.sin(a) * r;
            sp.push(x, groundH(x, z), z, x, BASE - 0.08, z);
        }
        for (let j = 0; j < NS; j++) { const k = j * 2; si.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
        const skirt = new THREE.BufferGeometry();
        skirt.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
        skirt.setIndex(si);
        skirt.computeVertexNormals();
        return { top, skirt };
    }
    const groundGeo = buildGround();
    // Turf seen up close: short blades and bare patches, multiplied over the
    // vertex colours and doubling as a bump map.
    const turf = canvasTex(256, 256, (g, w) => {
        const Rt = rng(31);
        g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w, w);
        for (let k = 0; k < 2600; k++) {
            const x = Rt() * w, y = Rt() * w, l = 3 + Rt() * 7, a = -1.57 + (Rt() - 0.5) * 0.9;
            const v = Math.round(150 + Rt() * 105);
            g.strokeStyle = `rgb(${v},${v},${v})`;
            g.lineWidth = 0.6 + Rt();
            g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
        }
        for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(70,60,50,${0.1 + Rt() * 0.2})`; g.beginPath(); g.arc(Rt() * w, Rt() * w, 1 + Rt() * 4, 0, 6.283); g.fill(); }
    });
    turf.wrapS = turf.wrapT = THREE.RepeatWrapping;
    turf.anisotropy = 4;
    const ground = new THREE.Mesh(groundGeo.top, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: turf, bumpMap: turf, bumpScale: 0.004 }));
    ground.receiveShadow = true;
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f7ff, roughness: 0.85, transparent: true, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const snowGround = new THREE.Mesh(groundGeo.top, snowMat);
    snowGround.receiveShadow = true;
    const soilTex = speckled(512, 64, '#4a3222', [['#5e4230', 260, 3], ['#2e1f16', 200, 2], ['#7a5a3e', 60, 2]], 3);
    soilTex.wrapS = THREE.RepeatWrapping; soilTex.repeat.set(3, 1);
    const skirt = new THREE.Mesh(groundGeo.skirt, new THREE.MeshStandardMaterial({ map: soilTex, color: lin(soilTop, 1.6), roughness: 1, side: THREE.DoubleSide }));
    world.add(ground, snowGround);
    shell.add(skirt);

    /* ── Strata under the meadow ── */
    const layer = (y0, y1, tex, color) => {
        tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(4, 1);
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.966, 0.966, y1 - y0, 72, 1, true), new THREE.MeshStandardMaterial({ map: tex, color, roughness: 1 }));
        m.position.y = (y0 + y1) / 2;
        shell.add(m);
    };
    layer(0.47, BASE - 0.075, speckled(512, 96, '#46301f', [['#5a3e2a', 500, 3], ['#2a1c13', 300, 2], ['#8a6a48', 40, 2]], 11), 0xffffff);
    layer(0.31, 0.47, speckled(512, 48, '#26211f', [['#121010', 260, 5], ['#3a3330', 160, 3]], 12), 0xffffff);
    const gravelPts = [[0, 0.03], [0.82, 0.03], [0.92, 0.06], [0.962, 0.14], [0.966, 0.31]].map(([x, y]) => new THREE.Vector2(x, y));
    const gravel = new THREE.Mesh(new THREE.LatheGeometry(gravelPts, 72), new THREE.MeshStandardMaterial({ color: lin([118, 110, 98]), roughness: 1, side: THREE.DoubleSide }));
    shell.add(gravel);
    {
        const n = 170;
        const peb = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), n);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
        for (let k = 0; k < n; k++) {
            const y = 0.07 + R() * 0.22, a = R() * 6.283, r = Math.min(0.95, jarRadius(y) - 0.04);
            p.set(Math.sin(a) * r, y, Math.cos(a) * r);
            e.set(R() * 3, R() * 3, R() * 3);
            q.setFromEuler(e);
            const sz = 0.025 + R() * 0.035;
            s.set(sz, sz * 0.75, sz);
            m.compose(p, q, s);
            peb.setMatrixAt(k, m);
            peb.setColorAt(k, lin(R() < 0.5 ? [158, 150, 136] : [104, 98, 92]));
        }
        shell.add(peb);
    }

    /* ── Pond ── */
    const ripples = (() => {
        const N = 128, c = document.createElement('canvas');
        c.width = c.height = N;
        const g = c.getContext('2d'), img = g.createImageData(N, N);
        const h = (x, y) => Math.sin(x * 0.29 + Math.sin(y * 0.11) * 2) * 0.5 + Math.sin(y * 0.23 + x * 0.07) * 0.4 + Math.sin((x + y) * 0.41) * 0.2 + Math.sin((x - y) * 0.17 + 1) * 0.3;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
            const l = Math.hypot(dx, dy, 1), k = (y * N + x) * 4;
            img.data[k] = (-dx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (-dy / l * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    })();
    const pondRT = new THREE.WebGLCubeRenderTarget(128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    pondRT.texture.encoding = THREE.sRGBEncoding;
    const pondCam = new THREE.CubeCamera(0.01, 8, pondRT);
    inner.add(pondCam);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x223038, roughness: 0.03, metalness: 0.25, envMap: pondRT.texture, envMapIntensity: 1.6, normalMap: ripples, normalScale: new THREE.Vector2(0.1, 0.1) });
    const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 40), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(POND.x, WATER_Y, POND.z);
    water.receiveShadow = true;
    world.add(water);

    /* ── Grass, flowers and stones ── */
    const onMeadow = (x, z) => Math.hypot(x, z) < 0.92 && Math.hypot(x - POND.x, z - POND.z) > POND.r + 0.03 && Math.hypot(x - CABIN.x, z - CABIN.z) > 0.19 && Math.hypot(x - TREE.x, z - TREE.z) > 0.05;
    function scatter(geo, mat, n, place) {
        const inst = new THREE.InstancedMesh(geo, mat, n);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
        for (let k = 0; k < n; k++) {
            let x, z;
            do { x = R() * 1.9 - 0.95; z = R() * 1.9 - 0.95; } while (!onMeadow(x, z));
            const c = place(p, e, s, x, z);
            q.setFromEuler(e);
            m.compose(p, q, s);
            inst.setMatrixAt(k, m);
            inst.setColorAt(k, c);
        }
        inst.castShadow = true;
        inst.receiveShadow = true;
        world.add(inst);
        return inst;
    }
    const BLADE = 0.07;
    const tuftGeo = new THREE.ConeGeometry(0.0065, BLADE, 3);
    tuftGeo.translate(0, BLADE / 2, 0);
    const grassUniforms = { uTime: { value: 0 }, uWind: { value: 0.01 } };
    const tuftMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
    // Blades bend from the root, each on its own phase, and darken towards the soil.
    tuftMat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = grassUniforms.uTime;
        sh.uniforms.uWind = grassUniforms.uWind;
        sh.vertexShader = 'uniform float uTime; uniform float uWind; varying float vBlade;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
            vBlade = position.y / ${BLADE};
            float ph = instanceMatrix[3].x * 23.0 + instanceMatrix[3].z * 17.0;
            float bend = vBlade * vBlade;
            transformed.x += (sin(uTime * 2.1 + ph) + 0.6) * uWind * bend;
            transformed.z += cos(uTime * 1.6 + ph * 1.3) * uWind * 0.5 * bend;`);
        sh.fragmentShader = 'varying float vBlade;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
            diffuseColor.rgb *= mix(0.4, 1.2, vBlade);`);
    };
    const tufts = (() => {
        const n = 1800;
        const inst = new THREE.InstancedMesh(tuftGeo, tuftMat, n);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
        let cx = 0, cz = 0;
        for (let k = 0; k < n; k++) {
            if (k % 9 === 0) { do { cx = R2() * 1.9 - 0.95; cz = R2() * 1.9 - 0.95; } while (!onMeadow(cx, cz)); }
            let x, z, tries = 0;
            do { x = cx + (R2() - 0.5) * 0.06; z = cz + (R2() - 0.5) * 0.06; } while (!onMeadow(x, z) && ++tries < 8);
            p.set(x, groundH(x, z) - 0.003, z);
            e.set((R2() - 0.5) * 0.7, R2() * 6.28, (R2() - 0.5) * 0.7);
            q.setFromEuler(e);
            const h = 0.45 + R2() * 0.9;
            sc.set(1, h, 1);
            m.compose(p, q, sc);
            inst.setMatrixAt(k, m);
            inst.setColorAt(k, lin([62 + R2() * 50, 122 + R2() * 56, 46 + R2() * 30]));
        }
        inst.count = lite ? 1100 : n;
        inst.castShadow = true;
        inst.receiveShadow = true;
        world.add(inst);
        return inst;
    })();
    // The old flowers drew from the shared seeded stream; draw the same
    // numbers here so the tree and everything after it keep their shape.
    for (let k = 0; k < 60; k++) { let x, z; do { x = R() * 1.9 - 0.95; z = R() * 1.9 - 0.95; } while (!onMeadow(x, z)); R(); }

    /* ── Plants that sway: flowers in small clumps, reeds by the pond ──
       Each is one merged geometry whose vertices carry the part they belong
       to (0 stem, 1 head, 2 accent), so one instanced draw colours a stem
       green, a head by its instance colour and a centre yellow, and bends the
       lot from the root in the same wind as the grass. */
    function mergeParts(parts) {
        const pos = [], nor = [], part = [];
        for (const [g, k] of parts) {
            const n = g.index ? g.toNonIndexed() : g;
            n.computeVertexNormals();
            pos.push(...n.attributes.position.array);
            nor.push(...n.attributes.normal.array);
            for (let i = 0; i < n.attributes.position.count; i++) part.push(k);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
        return geo;
    }
    function plantMat(height, stem, accent) {
        const m = new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide });
        const sc = lin(stem), ac = lin(accent), v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
        m.onBeforeCompile = (sh) => {
            sh.uniforms.uTime = grassUniforms.uTime;
            sh.uniforms.uWind = grassUniforms.uWind;
            sh.vertexShader = 'uniform float uTime; uniform float uWind; attribute float aPart; varying float vPart; varying float vUp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
                vPart = aPart;
                vUp = clamp(position.y / ${height.toFixed(4)}, 0.0, 1.2);
                float ph = instanceMatrix[3].x * 23.0 + instanceMatrix[3].z * 17.0;
                float bend = vUp * vUp * ${(height / BLADE).toFixed(3)};
                transformed.x += (sin(uTime * 1.7 + ph) + 0.6) * uWind * bend;
                transformed.z += cos(uTime * 1.3 + ph * 1.3) * uWind * 0.5 * bend;`);
            sh.fragmentShader = 'varying float vPart; varying float vUp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
                if (vPart < 0.5) diffuseColor.rgb = ${v3(sc)} * mix(0.5, 1.1, clamp(vUp, 0.0, 1.0));
                else if (vPart > 1.5) diffuseColor.rgb = ${v3(ac)};`);
        };
        m.customProgramCacheKey = () => `plant${height}${stem}${accent}`;
        return m;
    }
    function plant(geo, mat, spots) {
        const inst = new THREE.InstancedMesh(geo, mat, spots.length);
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
        spots.forEach(({ x, z, size, lean, colour }, k) => {
            p.set(x, groundH(x, z) - 0.004, z);
            e.set(lean[0], lean[1], lean[2]);
            q.setFromEuler(e);
            s.setScalar(size);
            m.compose(p, q, s);
            inst.setMatrixAt(k, m);
            inst.setColorAt(k, lin(colour));
        });
        inst.castShadow = true;
        inst.receiveShadow = true;
        world.add(inst);
        return inst;
    }
    const RP = rng(808);
    const FLOWER_H = 0.065;
    const flowerGeo = (() => {
        // Five rounded petals, cupped a little, on a thread of a stem.
        const pos = [], petals = 5, seg = 40, rad = 0.016;
        const at = (i) => {
            const a = i / seg * 6.2832, r = rad * (0.3 + 0.7 * Math.pow(Math.abs(Math.cos(a * petals / 2)), 0.7));
            return [Math.cos(a) * r, (r / rad) * 0.0018, Math.sin(a) * r];
        };
        for (let i = 0; i < seg; i++) pos.push(0, 0, 0, ...at(i + 1), ...at(i));
        const head = new THREE.BufferGeometry();
        head.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        head.rotateX(0.35);
        head.translate(0, FLOWER_H, 0);
        const eye = new THREE.SphereGeometry(0.0048, 6, 4);
        eye.scale(1, 0.6, 1);
        eye.rotateX(0.35);
        eye.translate(0, FLOWER_H + 0.0012, 0);
        const stem = new THREE.CylinderGeometry(0.0013, 0.0018, FLOWER_H, 4);
        stem.translate(0, FLOWER_H / 2, 0);
        const leaf = new THREE.PlaneGeometry(0.004, 0.012);
        leaf.translate(0.0025, 0.006, 0);
        leaf.rotateZ(-0.6);
        leaf.translate(0, FLOWER_H * 0.3, 0);
        return mergeParts([[stem, 0], [leaf, 0], [head, 1], [eye, 2]]);
    })();
    const flowerSpots = [];
    {
        // Mostly daisies, some buttercups, the odd harebell-lilac, in clumps.
        const PALETTE = [[[246, 243, 234], 0.6], [[240, 204, 96], 0.25], [[196, 182, 228], 0.15]];
        const pick = () => { let r = RP(); for (const [c, w] of PALETTE) if ((r -= w) <= 0) return c; return PALETTE[0][0]; };
        for (let c = 0; c < 11; c++) {
            let cx, cz;
            do { cx = RP() * 1.7 - 0.85; cz = RP() * 1.7 - 0.85; } while (!onMeadow(cx, cz));
            const colour = pick();
            const n = 2 + Math.floor(RP() * 4);
            for (let k = 0; k < n; k++) {
                const x = cx + (RP() - 0.5) * 0.08, z = cz + (RP() - 0.5) * 0.08;
                if (!onMeadow(x, z)) continue;
                flowerSpots.push({ x, z, size: 0.75 + RP() * 0.5, lean: [(RP() - 0.5) * 0.3, RP() * 6.28, (RP() - 0.5) * 0.3], colour: RP() < 0.85 ? colour : pick() });
            }
        }
    }
    // Shuffled, so that drawing fewer of them out of season thins every clump
    // a little rather than emptying some.
    for (let k = flowerSpots.length - 1; k > 0; k--) { const j = Math.floor(RP() * (k + 1)); [flowerSpots[k], flowerSpots[j]] = [flowerSpots[j], flowerSpots[k]]; }
    const flowers = plant(flowerGeo, plantMat(FLOWER_H, [74, 124, 56], [236, 186, 52]), flowerSpots);

    // Reeds and a few bulrushes on the far side of the pond, a pad or two on the water.
    const REED_H = 0.15;
    const reedGeo = (() => {
        const blade = new THREE.ConeGeometry(0.0045, REED_H, 3);
        blade.translate(0, REED_H / 2, 0);
        return mergeParts([[blade, 0]]);
    })();
    const rushGeo = (() => {
        const stalk = new THREE.CylinderGeometry(0.0018, 0.0026, REED_H, 4);
        stalk.translate(0, REED_H / 2, 0);
        const head = new THREE.CylinderGeometry(0.0065, 0.0065, 0.03, 8);
        head.translate(0, REED_H * 0.8, 0);
        return mergeParts([[stalk, 0], [head, 1]]);
    })();
    const reedSpots = [], rushSpots = [];
    for (let k = 0; k < 40; k++) {
        const a = Math.PI * (0.3 + RP() * 0.8), d = POND.r + RP() * 0.05;
        const x = POND.x + Math.cos(a) * d, z = POND.z - Math.sin(a) * d;
        const spot = { x, z, size: 0.55 + RP() * 0.6, lean: [(RP() - 0.5) * 0.35, RP() * 6.28, (RP() - 0.5) * 0.35], colour: [104, 72, 44] };
        (k % 5 === 0 ? rushSpots : reedSpots).push(spot);
    }
    const reedMat = plantMat(REED_H, [96, 128, 62], [0, 0, 0]);
    const reeds = plant(reedGeo, reedMat, reedSpots);
    const rushes = plant(rushGeo, reedMat, rushSpots);
    const padMat = new THREE.MeshStandardMaterial({ color: lin([70, 116, 58]), roughness: 0.55, side: THREE.DoubleSide });
    const pads = [[0.07, -0.05, 0.034, 0.4], [0.11, 0.05, 0.026, 2.2], [-0.02, 0.1, 0.03, 4.1]].map(([dx, dz, r, rot]) => {
        const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 18, 0.25, 6.2832 - 0.5), padMat);
        pad.rotation.set(-Math.PI / 2, 0, rot);
        pad.position.set(POND.x + dx, WATER_Y + 0.0025, POND.z + dz);
        pad.receiveShadow = true;
        world.add(pad);
        return pad;
    });
    {
        const bloom = new THREE.Mesh(flowerGeo, new THREE.MeshStandardMaterial({ color: lin([248, 214, 226]), roughness: 0.6, side: THREE.DoubleSide }));
        bloom.position.set(0, 0, -FLOWER_H * 1.6 + 0.004);
        bloom.scale.setScalar(1.6);
        bloom.rotation.x = Math.PI / 2;
        pads[0].add(bloom);
    }

    const stoneMat = new THREE.MeshStandardMaterial({ color: lin([128, 124, 116]), roughness: 0.95, flatShading: true });
    for (const [x, z, s] of [[-0.62, 0.12, 0.05], [-0.14, 0.42, 0.035], [-0.58, 0.46, 0.03], [0.7, 0.2, 0.06], [0.3, 0.06, 0.028], [0.36, -0.08, 0.026], [0.27, 0.2, 0.03]]) {
        const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), stoneMat);
        st.position.set(x, groundH(x, z) + s * 0.25, z);
        st.scale.y = 0.6;
        st.rotation.set(R(), R() * 3, R());
        st.castShadow = st.receiveShadow = true;
        world.add(st);
    }

    /* ── The tree ── */
    const barkTex = canvasTex(64, 256, (g, w, h) => {
        const Rb = rng(41);
        g.fillStyle = '#a8a098'; g.fillRect(0, 0, w, h);
        for (let k = 0; k < 70; k++) {
            const x = Rb() * w, v = Math.round(90 + Rb() * 140);
            g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1 + Rb() * 2.5;
            g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (Rb() - 0.5) * 10, h / 3, x + (Rb() - 0.5) * 10, h * 2 / 3, x + (Rb() - 0.5) * 6, h); g.stroke();
        }
    });
    barkTex.wrapS = barkTex.wrapT = THREE.RepeatWrapping;
    const bark = new THREE.MeshStandardMaterial({ color: lin([110, 78, 56]), roughness: 0.95, map: barkTex, bumpMap: barkTex, bumpScale: 0.003 });
    // Foliage as cards: a few dozen small quads per twig, each carrying a
    // drawing of a handful of leaves, cut out with alphaTest. Snow settles on
    // the cards that face the sky.
    const leafTex = canvasTex(256, 256, (g, w) => {
        const Rl = rng(53);
        for (let k = 0; k < 16; k++) {
            const x = 30 + Rl() * 196, y = 30 + Rl() * 196, a = Rl() * 6.283, L = 34 + Rl() * 26, W = L * 0.42;
            const v = Math.round(170 + Rl() * 85);
            g.save(); g.translate(x, y); g.rotate(a);
            g.fillStyle = `rgb(${v},${v},${v})`;
            g.beginPath(); g.moveTo(-L / 2, 0); g.quadraticCurveTo(0, -W, L / 2, 0); g.quadraticCurveTo(0, W, -L / 2, 0); g.fill();
            g.strokeStyle = `rgba(90,90,90,0.5)`; g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(-L / 2, 0); g.lineTo(L / 2, 0); g.stroke();
            g.restore();
        }
    });
    const leafSnow = { value: 0 };
    const cardMats = [0.82, 1, 1.15].map(() => {
        const m = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7, color: 0x4a9a50 });
        m.onBeforeCompile = (sh) => {
            sh.uniforms.uSnow = leafSnow;
            sh.vertexShader = 'varying float vSky;\n' + sh.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
                vSky = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz).y;`);
            sh.fragmentShader = 'uniform float uSnow; varying float vSky;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
                diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 1.0), uSnow * smoothstep(0.1, 0.6, vSky));`);
        };
        return m;
    });
    const cardDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.5 });
    function leafCards(n, spread) {
        const pos = [], uv = [], nor = [], idx = [];
        const q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Vector3(), v = new THREE.Vector3(), nn = new THREE.Vector3();
        for (let k = 0; k < n; k++) {
            c.set((R2() - 0.5), (R2() - 0.35), (R2() - 0.5)).normalize().multiplyScalar(spread * Math.cbrt(R2()));
            e.set(R2() * 6.28, R2() * 6.28, R2() * 6.28);
            q.setFromEuler(e);
            const s = 0.055 + R2() * 0.04, b = pos.length / 3;
            for (const [x, y, u, w] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) {
                v.set(x * s, y * s, 0).applyQuaternion(q).add(c);
                pos.push(v.x, v.y, v.z);
                uv.push(u, w);
                // Normals point out of the crown, so it shades as a mass.
                nn.copy(c).normalize().lerp(new THREE.Vector3(0, 0, 1).applyQuaternion(q), 0.3).normalize();
                nor.push(nn.x, nn.y, nn.z);
            }
            idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        return geo;
    }
    const cards = [];
    const branches = [];
    const treeRoot = new THREE.Group();
    treeRoot.position.set(TREE.x, groundH(TREE.x, TREE.z) - 0.01, TREE.z);
    world.add(treeRoot);
    (function grow(parent, len, rad, depth) {
        const g = new THREE.Group();
        parent.add(g);
        const limb = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.68, rad, len, 7), bark);
        limb.position.y = len / 2;
        limb.castShadow = limb.receiveShadow = true;
        g.add(limb);
        branches.push({ g, depth, z: 0, x: 0 });
        const tip = new THREE.Group();
        tip.position.y = len;
        g.add(tip);
        if (depth <= 1) {
            // Three solid blobs used to sit under the cards here and showed
            // through as balls; they are gone, but they drew from the seeded
            // stream, so draw the same numbers to keep every branch where it was.
            for (let k = 0; k < 21; k++) R();
            const crown = new THREE.Mesh(leafCards(40, 0.1), cardMats[cards.length % 3]);
            crown.position.y = 0.04;
            crown.castShadow = true;
            crown.receiveShadow = true;
            crown.customDepthMaterial = cardDepth;
            tip.add(crown);
            cards.push(crown);
            return g;
        }
        const n = depth === 4 ? 3 : 2;
        const spin = R() * 6.283;
        for (let k = 0; k < n; k++) {
            const hold = new THREE.Group();
            hold.rotation.y = spin + k * 6.283 / n;
            tip.add(hold);
            const child = grow(hold, len * (0.72 + R() * 0.06), rad * 0.66, depth - 1);
            child.rotation.z = 0.42 + R() * 0.18;
            branches[branches.findIndex(b => b.g === child)].z = child.rotation.z;
        }
        return g;
    })(treeRoot, 0.3, 0.035, 5);

    /* ── The cabin ── */
    const cabin = new THREE.Group();
    cabin.position.set(CABIN.x, groundH(CABIN.x, CABIN.z) - 0.005, CABIN.z);
    cabin.rotation.y = -0.55;
    world.add(cabin);
    const logTex = canvasTex(128, 64, (g, w, h) => {
        g.fillStyle = '#8c4e34'; g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(40,18,10,0.45)'; g.fillRect(0, y, w, 1.5); g.fillStyle = 'rgba(255,220,180,0.08)'; g.fillRect(0, y + 2, w, 2); }
    });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.2), new THREE.MeshStandardMaterial({ map: logTex, roughness: 0.95 }));
    walls.position.y = 0.08;
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-0.18, 0); roofShape.lineTo(0, 0.13); roofShape.lineTo(0.18, 0); roofShape.lineTo(-0.18, 0);
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 0.26, bevelEnabled: false });
    roofGeo.translate(0, 0, -0.13);
    roofGeo.rotateY(Math.PI / 2);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: lin([84, 46, 38]), roughness: 0.9 }));
    roof.position.y = 0.155;
    roof.scale.set(1, 1, 1);
    const roofSnowMat = new THREE.MeshStandardMaterial({ color: 0xf6f8ff, roughness: 0.8, transparent: true, opacity: 0 });
    const roofSnow = new THREE.Mesh(roofGeo, roofSnowMat);
    roofSnow.position.y = 0.162;
    roofSnow.scale.set(1.03, 1.0, 1.03);
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: lin([110, 74, 62]), roughness: 1 }));
    chimney.position.set(0.07, 0.25, -0.05);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x334055, emissive: 0xffb84f, emissiveIntensity: 0, roughness: 0.4 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.045), windowMat);
    win.position.set(-0.07, 0.095, 0.1005);
    const win2 = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.045), windowMat);
    win2.position.set(0.1405, 0.095, 0);
    win2.rotation.y = Math.PI / 2;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.006), new THREE.MeshStandardMaterial({ color: lin([58, 32, 26]), roughness: 1 }));
    door.position.set(0.06, 0.045, 0.1);
    for (const m of [walls, roof, chimney, door]) { m.castShadow = true; m.receiveShadow = true; }
    const lamp = new THREE.PointLight(0xffb45a, 0, 0.9, 2);
    lamp.position.set(-0.05, 0.1, 0.16);
    const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0xffb860, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
    lampGlow.scale.set(0.32, 0.32, 1);
    lampGlow.position.set(-0.07, 0.095, 0.12);
    cabin.add(walls, roof, roofSnow, chimney, win, win2, door, lamp, lampGlow);
    // A path of stepping stones from the door down to the meadow.
    for (let k = 0; k < 5; k++) {
        const px = CABIN.x - 0.05 - k * 0.07, pz = CABIN.z + 0.17 + k * 0.065;
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.012, 9), stoneMat);
        st.position.set(px + (k % 2) * 0.012, groundH(px, pz) + 0.002, pz);
        st.receiveShadow = true;
        world.add(st);
    }
    // Firewood stacked against the gable wall, ends out.
    {
        const bark = new THREE.MeshStandardMaterial({ color: lin([92, 64, 44]), roughness: 1 });
        const end = new THREE.MeshStandardMaterial({ color: lin([214, 176, 128]), roughness: 0.9 });
        const logGeo = new THREE.CylinderGeometry(0.0095, 0.0095, 0.13, 7);
        logGeo.rotateX(Math.PI / 2);
        const rows = [4, 3, 2], logs = [];
        rows.forEach((n, row) => { for (let k = 0; k < n; k++) logs.push([0.152 + (k + row * 0.5) * 0.019, 0.0095 + row * 0.0165]); });
        const pile = new THREE.InstancedMesh(logGeo, [bark, end, end], logs.length);
        const m = new THREE.Matrix4();
        logs.forEach(([x, y], k) => { m.makeRotationZ(k * 1.7); m.setPosition(x, y, -0.01 + (k % 3 - 1) * 0.004); pile.setMatrixAt(k, m); });
        pile.castShadow = pile.receiveShadow = true;
        cabin.add(pile);
    }
    // A lantern on a post where the path meets the meadow, lit at dusk.
    const lantern = new THREE.Group();
    lantern.position.set(LANTERN.x, groundH(LANTERN.x, LANTERN.z) - 0.005, LANTERN.z);
    world.add(lantern);
    const postMat = new THREE.MeshStandardMaterial({ color: lin([62, 44, 34]), roughness: 1 });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.14, 0.008), postMat);
    post.position.y = 0.07;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.005), postMat);
    arm.position.set(0.012, 0.137, 0);
    const lanternGlass = new THREE.MeshStandardMaterial({ color: 0x3a3428, emissive: 0xffb44f, emissiveIntensity: 0, roughness: 0.3 });
    const lanternBox = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.02, 0.014), lanternGlass);
    lanternBox.position.set(0.022, 0.12, 0);
    const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.009, 4), postMat);
    lanternCap.position.set(0.022, 0.1345, 0);
    lanternCap.rotation.y = Math.PI / 4;
    for (const m of [post, arm, lanternCap]) { m.castShadow = true; m.receiveShadow = true; }
    const lanternLight = new THREE.PointLight(0xffb45a, 0, 0.45, 2);
    lanternLight.position.set(0.022, 0.11, 0);
    const lanternGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0xffbe6a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
    lanternGlow.scale.set(0.12, 0.12, 1);
    lanternGlow.position.set(0.022, 0.12, 0);
    lantern.add(post, arm, lanternBox, lanternCap, lanternLight, lanternGlow);

    const smoke = Array.from({ length: 6 }, () => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0xc8ccd6, transparent: true, depthWrite: false, opacity: 0 }));
        world.add(s);
        return s;
    });
    const chimneyTop = new THREE.Vector3();

    /* ── Mushrooms ── */
    const stemMat = new THREE.MeshStandardMaterial({ color: lin([236, 226, 210]), roughness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: lin([214, 52, 46]), roughness: 0.5 });
    const dotMat = new THREE.MeshStandardMaterial({ color: 0xfaf4ea, roughness: 0.6 });
    for (const [x, z, s] of [[-0.74, 0.3, 1], [-0.68, 0.4, 0.7], [0.66, 0.38, 0.85], [0.18, 0.62, 0.6]]) {
        const g = new THREE.Group();
        g.position.set(x, groundH(x, z), z);
        g.scale.setScalar(s);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.015, 0.06, 8), stemMat);
        stem.position.y = 0.03;
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 8, 0, 6.283, 0, Math.PI / 2), capMat);
        cap.position.y = 0.055;
        cap.scale.y = 0.75;
        g.add(stem, cap);
        for (const [a, b] of [[0.6, 0.6], [2.4, 0.9], [4.2, 0.5], [5.4, 1.1]]) {
            const d = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), dotMat);
            d.position.set(Math.cos(a) * 0.042 * Math.sin(b), 0.055 + 0.032 * Math.cos(b), Math.sin(a) * 0.042 * Math.sin(b));
            g.add(d);
        }
        for (const m of [stem, cap]) { m.castShadow = true; m.receiveShadow = true; }
        world.add(g);
    }

    /* ── Clouds that circle the jar on the wind ──
       What you see is a cluster of soft billboards, shaded darker underneath;
       what casts the shadow on the meadow is a set of spheres that never draw
       to the screen. */
    const puffGeo = new THREE.IcosahedronGeometry(1, 2);
    const cloudRim = { value: new THREE.Color(0, 0, 0) };
    const cloudTex = canvasTex(128, 128, (g, w) => {
        const Rc = rng(61);
        for (let k = 0; k < 14; k++) {
            const a = Rc() * 6.283, d = Rc() * 26, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * 0.8, r = 22 + Rc() * 20;
            const gr = g.createRadialGradient(x, y, 0, x, y, r);
            gr.addColorStop(0, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gr; g.fillRect(0, 0, w, w);
        }
        // Break up the edge so it reads as vapour, not a disc.
        const img = g.getImageData(0, 0, w, w);
        for (let k = 3; k < img.data.length; k += 4) img.data[k] *= 0.75 + Rc() * 0.25;
        g.putImageData(img, 0, 0);
    });
    const shadowOnly = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    // Many small, flat-bottomed clouds spaced round the jar, rather than a
    // few big ones that pile up into a single ball in front of the tree.
    const NCLOUDS = 11;
    const clouds = Array.from({ length: NCLOUDS }, (_, i) => {
        const mats = [0.72, 0.88, 1].map(() => new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.96 }));
        const g = new THREE.Group();
        const n = 4 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) {
            const p = new THREE.Mesh(puffGeo, shadowOnly);
            const r = 0.07 + R() * 0.06;
            p.scale.set(r, r * 0.65, r);
            p.position.set((R() - 0.5) * 0.36, (R() - 0.3) * 0.04 + (r - 0.07) * 0.5, (R() - 0.5) * 0.16);
            p.castShadow = true;
            g.add(p);
            for (let j = 0; j < 3; j++) {
                const lift = j - 1;
                const sp = new THREE.Sprite(mats[j]);
                sp.position.set(p.position.x + (R2() - 0.5) * r * 0.6, p.position.y + lift * r * 0.32, p.position.z + (R2() - 0.5) * r * 0.4);
                const sz = r * (2.4 - Math.abs(lift) * 0.5) * (0.9 + R2() * 0.3);
                sp.scale.set(sz, sz * 0.62, 1);
                g.add(sp);
            }
        }
        world.add(g);
        return { g, mats, a: i / NCLOUDS * 6.283 + R() * 0.4, r: 0.3 + R() * 0.45, y: 1.98 + R() * 0.42, speed: 0.6 + R() * 0.3, size: 0.6 + R() * 0.45, scale: 0, rank: (i * 7) % NCLOUDS };
    });

    /* ── Rain, splashes, snow, fireflies, fog, condensation ── */
    const NDROPS = 260;
    const drops = Array.from({ length: NDROPS }, () => spawnDrop({}, true));
    function spawnDrop(d, anywhere) {
        let x, z;
        do { x = R() * 1.8 - 0.9; z = R() * 1.8 - 0.9; } while (Math.hypot(x, z) > 0.9);
        d.x = x; d.z = z; d.v = 0.8 + R() * 0.5;
        d.y = anywhere ? BASE + R() * 1.6 : 2.45 + R() * 0.2;
        d.floor = groundH(x, z);
        d.pond = Math.hypot(x - POND.x, z - POND.z) < POND.r * 0.88;
        if (d.pond) d.floor = WATER_Y;
        return d;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NDROPS * 6), 3));
    const rainMat = new THREE.LineBasicMaterial({ color: lin([190, 210, 240]), transparent: true, opacity: 0.5, depthWrite: false });
    const rain = new THREE.LineSegments(rainGeo, rainMat);
    rain.frustumCulled = false;
    world.add(rain);

    const ringGeo = new THREE.RingGeometry(0.8, 1, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const rings = Array.from({ length: 16 }, () => {
        const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x4a5a6a, transparent: true, opacity: 0, depthWrite: false }));
        m.visible = false;
        m.userData.life = 0;
        world.add(m);
        return m;
    });
    let ringNext = 0;
    const NSPLASH = 70;
    const splashes = points(NSPLASH, { color: [0.85, 0.9, 1], size: 0.03, hard: 0.1 });
    const splashLife = new Float32Array(NSPLASH);
    let splashNext = 0;

    const NFLAKES = 200;
    const snow = points(NFLAKES, { color: [0.98, 0.99, 1], size: 0.03, hard: 0.35 });
    const flakes = Array.from({ length: NFLAKES }, () => ({ x: R() * 1.8 - 0.9, z: R() * 1.8 - 0.9, y: BASE + R() * 1.6, v: 0.6 + R() * 0.6, p: R() * 6.28 }));
    snow.geometry.attributes.aSize.array.forEach((_, k, a) => { a[k] = 0.018 + R() * 0.022; });

    const NFLIES = 14;
    const fireflies = points(NFLIES, { color: [0.9, 1, 0.55], size: 0.05, hard: 0.0, additive: true });
    const flies = Array.from({ length: NFLIES }, () => { let x, z; do { x = R() * 1.4 - 0.7; z = R() * 1.4 - 0.7; } while (!onMeadow(x, z)); return { x, z, y: groundH(x, z) + 0.06 + R() * 0.2, p: R() * 6.28, q: R() * 6.28 }; });

    const fogBanks = Array.from({ length: 7 }, (_, k) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0xd2d7e1, transparent: true, depthWrite: false, opacity: 0 }));
        s.scale.set(1.5, 0.55, 1);
        world.add(s);
        return { s, a: k / 7 * 6.283, r: 0.35 + (k % 3) * 0.17, y: BASE + 0.1 + (k % 4) * 0.13 };
    });

    const NDEW = 90;
    const dew = points(NDEW, { color: [0.92, 0.96, 1], size: 0.03, hard: 0.55 });
    {
        const pos = dew.geometry.attributes.position, size = dew.geometry.attributes.aSize;
        for (let k = 0; k < NDEW; k++) {
            const y = BASE - 0.05 + R() * 1.7, a = R() * 6.283, r = jarRadius(y) * 0.985;
            pos.setXYZ(k, Math.sin(a) * r, y, Math.cos(a) * r);
            size.setX(k, 0.012 + R() * 0.03);
        }
    }
    const dewRun = Float32Array.from({ length: NDEW }, () => R2() < 0.45 ? 0.03 + R2() * 0.12 : 0);

    /* ── Lightning ── */
    const boltGeo = new THREE.BufferGeometry();
    boltGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    const bolt = new THREE.Line(boltGeo, new THREE.LineBasicMaterial({ color: 0xf2f6ff, transparent: true, toneMapped: false }));
    bolt.visible = false;
    bolt.frustumCulled = false;
    world.add(bolt);
    const storm = { flash: 0, next: 4 };
    function strike() {
        const a = R() * 6.283, r = 0.3 + R() * 0.4;
        let x = Math.cos(a) * 0.25, z = Math.sin(a) * 0.25, y = 2.3;
        const tx = Math.cos(a) * r, tz = Math.sin(a) * r, ty = groundH(tx, tz);
        const pos = boltGeo.attributes.position;
        let k = 0;
        for (; k < 24; k++) {
            const f = k / 23;
            pos.setXYZ(k, x + (tx - x) * f + (k && k < 23 ? (Math.random() - 0.5) * 0.08 : 0), y + (ty - y) * f, z + (tz - z) * f + (k && k < 23 ? (Math.random() - 0.5) * 0.08 : 0));
        }
        pos.needsUpdate = true;
    }

    /* ── Leaves that come down: steadily in autumn, a few on a tap any time ── */
    const crownSpots = [];
    world.updateMatrixWorld(true);
    for (const c of cards) { const v = new THREE.Vector3(); c.getWorldPosition(v); world.worldToLocal(v); crownSpots.push(v); }
    const NFALL = 18;
    const oneLeaf = canvasTex(64, 64, (g, w) => {
        g.translate(w / 2, w / 2); g.rotate(0.7);
        g.fillStyle = '#ffffff';
        g.beginPath(); g.moveTo(-30, 0); g.quadraticCurveTo(0, -17, 30, 0); g.quadraticCurveTo(0, 17, -30, 0); g.fill();
        g.strokeStyle = 'rgba(110,110,110,0.6)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.stroke();
    });
    const fallMat = new THREE.MeshStandardMaterial({ map: oneLeaf, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 });
    const fallGeo = new THREE.PlaneGeometry(0.034, 0.034);
    const falling = new THREE.InstancedMesh(fallGeo, fallMat, NFALL);
    falling.frustumCulled = false;
    falling.castShadow = true;
    const fallers = Array.from({ length: NFALL }, (_, k) => {
        falling.setColorAt(k, new THREE.Color().setScalar(0.75 + R2() * 0.5));
        return { on: false, x: 0, y: 0, z: 0, floor: 0, rest: 0, p: R2() * 6.28, spin: 1 + R2() * 2 };
    });
    let fallDue = 0;
    world.add(falling);
    const fallM = new THREE.Matrix4(), fallQ = new THREE.Quaternion(), fallE = new THREE.Euler(), fallP = new THREE.Vector3(), fallS = new THREE.Vector3();
    function dropLeaf() {
        const f = fallers.find(l => !l.on);
        if (!f) return;
        const c = crownSpots[Math.floor(R2() * crownSpots.length)];
        f.on = true; f.rest = 0;
        f.x = c.x + (R2() - 0.5) * 0.12; f.y = c.y - 0.04; f.z = c.z + (R2() - 0.5) * 0.12;
        f.floor = groundH(f.x, f.z) + 0.004;
    }

    /* ── Birds, wheeling high on fine days ── */
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x25272e, side: THREE.DoubleSide, transparent: true });
    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.009, 0, 0, -0.009, 0.042, 0.003, -0.006], 3));
    const birds = Array.from({ length: 3 }, (_, k) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 6, 4), birdMat);
        body.scale.set(1.2, 1, 3);
        const left = new THREE.Mesh(wingGeo, birdMat), right = new THREE.Mesh(wingGeo, birdMat);
        right.scale.x = -1;
        g.add(body, left, right);
        g.visible = false;
        world.add(g);
        return { g, left, right, a: k * 0.5 + R2() * 0.3, r: 0.42 + k * 0.08, y: 1.8 + R2() * 0.14, p: R2() * 6.28 };
    });
    let birdsShown = 0;

    /* ── A rainbow, when it rains with the sun out ──
       Always on the far side of the jar from whoever is looking, as a real
       one stands opposite the sun from you; the hills hide its feet. */
    const RB_IN = 0.64, RB_OUT = 0.76;
    const rainbow = new THREE.Mesh(new THREE.RingGeometry(RB_IN, RB_OUT, 64, 1, 0, Math.PI), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uOpacity; varying vec2 vP;
            void main() {
                float t = (length(vP) - ${RB_IN.toFixed(3)}) / ${(RB_OUT - RB_IN).toFixed(3)};
                vec3 c = clamp(vec3(abs(t * 6.0 - 3.0) - 1.0, 2.0 - abs(t * 6.0 - 2.0), 2.0 - abs(t * 6.0 - 4.0)), 0.0, 1.0);
                float edge = smoothstep(0.0, 0.25, t) * smoothstep(1.0, 0.75, t);
                float feet = smoothstep(0.0, 0.35, vP.y / ${RB_OUT.toFixed(3)});
                gl_FragColor = vec4(c * edge * feet * uOpacity, 1.0);
            }`,
    }));
    rainbow.visible = false;
    world.add(rainbow);
    let rainbowA = 0;
    const eye = new THREE.Vector3();

    /* ── Mist over the pond on cool, still mornings ── */
    const mist = new THREE.Group();
    world.add(mist);
    const wisps = Array.from({ length: 7 }, (_, k) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, transparent: true, depthWrite: false, opacity: 0 }));
        mist.add(s);
        return { s, a: k / 7 * 6.283, r: POND.r * (0.2 + (k % 3) * 0.3), y: WATER_Y + 0.02 + (k % 3) * 0.014, sp: 0.04 + R2() * 0.05, w: 0.3 + R2() * 0.14 };
    });

    /* ── The sheep, the worm, and the occasional saucer ── */
    const visitors = createVisitors({
        world, shell, groundH, envMap: envTex, rand: R2,
        onMeadow: (x, z) => onMeadow(x, z) && Math.hypot(x - TREE.x, z - TREE.z) > 0.09 && Math.hypot(x - LANTERN.x, z - LANTERN.z) > 0.05,
        pond: { x: POND.x, z: POND.z, r: POND.r, y: WATER_Y, avoid: pads.map(p => [p.position.x, p.position.z, p.geometry.parameters.radius]) },
    });
    if (/[?&]debug\b/.test(location.search)) window.__terrarium = visitors;
    let pondTick = 0;
    let summonAt = -1;

    /* ── The room: glass, cork, tag, stand ── */
    room.add(new THREE.HemisphereLight(0xd6e2f0, 0x20160e, 0.55));
    const roomSun = new THREE.DirectionalLight(0xfff0dc, 0.85);
    roomSun.position.set(-3, 5, 4);
    room.add(roomSun);

    const glassPts = PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
    const glassGeo = new THREE.LatheGeometry(glassPts, 96);
    const smudgeTex = canvasTex(256, 256, (g, w) => {
        const Rs = rng(77);
        g.fillStyle = '#000'; g.fillRect(0, 0, w, w);
        for (let k = 0; k < 26; k++) {
            const x = Rs() * w, y = Rs() * w, r = 8 + Rs() * 30;
            const gr = g.createRadialGradient(x, y, 0, x, y, r);
            gr.addColorStop(0, `rgba(255,255,255,${0.15 + Rs() * 0.25})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        // A thumbprint or two.
        for (let p = 0; p < 2; p++) {
            const x = 40 + Rs() * 170, y = 40 + Rs() * 170;
            g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.2;
            for (let r = 3; r < 16; r += 2.2) { g.beginPath(); g.ellipse(x, y, r, r * 1.35, 0.4, 0.3, 5.6); g.stroke(); }
        }
    });
    smudgeTex.encoding = THREE.LinearEncoding;
    smudgeTex.wrapS = smudgeTex.wrapT = THREE.RepeatWrapping;
    const glassUniforms = (front) => ({ uFront: { value: front }, uDamp: { value: 0 }, uSmudge: { value: smudgeTex } });
    const glassBack = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({ vertexShader: GLASS_VS, fragmentShader: GLASS_FS, uniforms: glassUniforms(0), transparent: true, depthWrite: false, side: THREE.BackSide }));
    const glassFront = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({ vertexShader: GLASS_VS, fragmentShader: GLASS_FS, uniforms: glassUniforms(1), transparent: true, depthWrite: false, side: THREE.FrontSide }));
    glassBack.renderOrder = 1;
    glassFront.renderOrder = 3;
    shell.add(glassBack, glassFront);

    const corkTex = speckled(256, 128, '#b8885a', [['#8a5e36', 700, 2.2], ['#d8ae7a', 400, 2], ['#5a3a1e', 160, 1.6]], 5);
    corkTex.wrapS = THREE.RepeatWrapping; corkTex.repeat.set(3, 1);
    const corkMat = new THREE.MeshStandardMaterial({ map: corkTex, roughness: 0.95 });
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.585, 0.36, 48), corkMat);
    cork.position.y = 3.16;
    const corkTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.63, 0.03, 48), corkMat);
    corkTop.position.y = 3.355;
    const twineMat = new THREE.MeshStandardMaterial({ color: 0xe4d6b8, roughness: 1 });
    const twine = new THREE.Mesh(new THREE.TorusGeometry(0.632, 0.012, 6, 64), twineMat);
    twine.rotation.x = Math.PI / 2;
    twine.position.y = 3.24;
    shell.add(cork, corkTop, twine);

    // A paper tag on a string, with the place on it.
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 320; tagCanvas.height = 112;
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.encoding = THREE.sRGBEncoding;
    tagTex.anisotropy = 4;
    let tagName = '…';
    function drawTag() {
        const g = tagCanvas.getContext('2d');
        g.clearRect(0, 0, 320, 112);
        g.fillStyle = '#efe6d2';
        g.beginPath(); g.roundRect ? g.roundRect(4, 4, 312, 104, 16) : g.rect(4, 4, 312, 104); g.fill();
        g.strokeStyle = 'rgba(120,96,64,0.35)'; g.lineWidth = 3;
        g.beginPath(); g.arc(34, 56, 11, 0, 6.283); g.stroke();
        g.fillStyle = '#4a3a2a';
        g.font = '600 46px Outfit, sans-serif';
        g.textBaseline = 'middle';
        const name = tagName.length > 11 ? tagName.slice(0, 10) + '…' : tagName;
        g.fillText(name, 60, 58, 245);
        tagTex.needsUpdate = true;
    }
    drawTag();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTag);
    const TAG_A = 0.75;
    const tagPivot = new THREE.Group();
    tagPivot.position.set(Math.sin(TAG_A) * 1.0, 2.98, Math.cos(TAG_A) * 1.0);
    tagPivot.rotation.y = TAG_A;
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.217), new THREE.MeshStandardMaterial({ map: tagTex, transparent: true, roughness: 0.9, side: THREE.DoubleSide }));
    tag.position.set(0.24, -0.08, 0.02);
    tag.rotation.z = -0.22;
    tagPivot.add(tag);
    const stringPts = [new THREE.Vector3(Math.sin(TAG_A - 0.18) * 0.64, 3.24, Math.cos(TAG_A - 0.18) * 0.64), new THREE.Vector3(Math.sin(TAG_A) * 0.86, 3.12, Math.cos(TAG_A) * 0.86), tagPivot.position.clone()];
    const string = new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(...stringPts).getPoints(16)), new THREE.LineBasicMaterial({ color: 0xd8ccb0 }));
    shell.add(tagPivot, string);

    // The wooden stand the jar turns on.
    const grainSide = canvasTex(512, 64, (g, w, h) => {
        const Rg = rng(9);
        g.fillStyle = '#6a4a30'; g.fillRect(0, 0, w, h);
        for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${Rg() < 0.5 ? '40,24,12' : '150,110,70'},${0.15 + Rg() * 0.2})`; g.fillRect(0, Rg() * h, w, 1 + Rg() * 2); }
    });
    grainSide.wrapS = THREE.RepeatWrapping; grainSide.repeat.set(4, 1);
    const grainTop = canvasTex(512, 512, (g, w) => {
        const Rg = rng(10);
        g.fillStyle = '#74533a'; g.fillRect(0, 0, w, w);
        for (let r = 8; r < w / 2; r += 6 + Rg() * 10) {
            g.strokeStyle = `rgba(${Rg() < 0.6 ? '50,30,16' : '160,120,80'},${0.12 + Rg() * 0.18})`;
            g.lineWidth = 1 + Rg() * 2.5;
            g.beginPath(); g.ellipse(w / 2 + (Rg() - 0.5) * 6, w / 2, r * 1.04, r, 0, 0, 6.283); g.stroke();
        }
    });
    const woodSide = new THREE.MeshStandardMaterial({ map: grainSide, roughness: 0.42, envMapIntensity: 0.8 });
    const woodTop = new THREE.MeshStandardMaterial({ map: grainTop, roughness: 0.35, envMapIntensity: 0.9 });
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.3, 0.2, 72), [woodSide, woodTop, woodSide]);
    stand.position.y = -0.1;
    shell.add(stand);
    const shadowTex = canvasTex(256, 256, (g, w) => {
        const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        r.addColorStop(0, 'rgba(0,0,0,0.6)'); r.addColorStop(0.7, 'rgba(0,0,0,0.35)'); r.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = r; g.fillRect(0, 0, w, w);
    });
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.003;
    // The jar's own light, spilling onto the wood: dusk-pink at dusk, lamp-gold at night.
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: soft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    spill.rotation.x = -Math.PI / 2;
    spill.position.y = 0.004;
    shell.add(contact, spill);
    const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }));
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.y = -0.205;
    room.add(floorShadow);

    /* ── Turning the jar ── */
    const view = { turn: 0, spin: 0, tilt: 13, idle: 0, zoom: 1 };
    // The jar swings round into place as the page opens, while the camera
    // settles from a little higher; then the slow idle turn carries on.
    const INTRO = { from: -1.25, tilt: 24, len: 3.4 };
    let intro = reduceMotion() || /[?&]intro=0\b/.test(location.search) ? null : 0;
    if (intro !== null) { view.turn = INTRO.from; view.tilt = INTRO.tilt; }
    const press = { id: null, x: 0, y: 0, moved: 0, mouse: false };
    // Two fingers pinch the camera in and out; so does a trackpad pinch,
    // which browsers report as a wheel event with ctrlKey set.
    const ZOOM = { min: 0.42, max: 1.5 };
    const touches = new Map();
    const pinch = { on: false, dist: 1, from: 1 };
    const spread = () => {
        const [a, b] = [...touches.values()];
        return Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    };
    const zoomTo = (z) => { view.zoom = Math.max(ZOOM.min, Math.min(ZOOM.max, z)); };
    canvas.addEventListener('pointerdown', (e) => {
        intro = null;
        if (e.pointerType === 'touch') {
            touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (touches.size === 2) {
                // A second finger turns the turn into a pinch, and the press stops being a tap.
                pinch.on = true; pinch.dist = spread(); pinch.from = view.zoom;
                press.moved = Infinity;
                view.spin = 0;
                return;
            }
            if (touches.size > 2) return;
        }
        press.id = e.pointerId; press.x = e.clientX; press.y = e.clientY; press.moved = 0; press.mouse = e.pointerType === 'mouse';
        view.spin = 0;
        view.idle = 0;
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        canvas.classList.add('turning');
    });
    canvas.addEventListener('pointermove', (e) => {
        const finger = touches.get(e.pointerId);
        if (finger) { finger.x = e.clientX; finger.y = e.clientY; }
        if (pinch.on) {
            if (touches.size >= 2) zoomTo(pinch.from * pinch.dist / spread());
            view.idle = 0;
            return;
        }
        if (press.id !== e.pointerId) return;
        const dx = e.clientX - press.x, dy = e.clientY - press.y;
        press.x = e.clientX; press.y = e.clientY;
        press.moved += Math.abs(dx) + Math.abs(dy);
        const k = 4.4 / Math.max(200, canvas.clientWidth);
        view.turn += dx * k;
        view.spin = dx * k * 60;
        if (press.mouse) view.tilt = Math.max(2, Math.min(34, view.tilt + dy * 0.15));
    });
    const taps = [];
    const release = (e) => {
        touches.delete(e.pointerId);
        if (pinch.on && touches.size < 2) {
            // Lifting one finger of a pinch ends it; the other one doesn't start turning.
            pinch.on = false;
            if (press.id !== null && press.id !== e.pointerId) {
                const rest = touches.get(press.id);
                if (rest) { press.x = rest.x; press.y = rest.y; }
            }
        }
        if (press.id !== e.pointerId) return;
        press.id = null;
        canvas.classList.remove('turning');
        if (press.moved < 6) {
            view.spin = 0;
            onTap();
            const now = performance.now();
            taps.push(now);
            while (taps.length && now - taps[0] > 2500) taps.shift();
            if (taps.length >= 5) { taps.length = 0; visitors.summon(); }
        }
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    // The canvas lets vertical drags scroll the page; with two fingers down
    // the gesture is ours, so keep the browser from scrolling or zooming it.
    canvas.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    canvas.addEventListener('gesturestart', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => {
        if (!e.ctrlKey) return; // a plain wheel still scrolls the page
        e.preventDefault();
        intro = null;
        view.idle = 0;
        zoomTo(view.zoom * Math.exp(e.deltaY * 0.01));
    }, { passive: false });

    /* ── Sizing ── */
    let fitDist = 10;
    function resize() {
        const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
        const dpr = Math.min(lite ? 1.5 : 2, window.devicePixelRatio || 1);
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const tan = Math.tan(camera.fov * Math.PI / 360);
        fitDist = Math.max(2.14 / tan, 1.5 / (tan * camera.aspect)) * 1.02;
        const scale = h * dpr / (2 * tan);
        for (const m of pointMats) m.uniforms.uScale.value = scale;
    }

    /* ── Per frame ── */
    const tmp = new THREE.Vector3();
    const SKY_CENTRE = new THREE.Vector3(0, 1.0, 0);
    const glowCol = new THREE.Color();
    function render(f) {
        const { w, sun, snowCover, gust, t, dt } = f;
        const season = f.season || { blossom: 0, bloom: 1 };
        const day = sun.colours.daylight, night = 1 - day;
        const still = reduceMotion();

        // Camera and turn.
        if (intro !== null) {
            intro = Math.min(INTRO.len, intro + dt);
            const e = 1 - Math.pow(1 - intro / INTRO.len, 3);
            view.turn = INTRO.from * (1 - e);
            view.tilt = INTRO.tilt + (13 - INTRO.tilt) * e;
            if (intro >= INTRO.len) { intro = null; view.idle = 6; }
        } else if (press.id === null) {
            view.turn += view.spin * dt;
            view.spin *= Math.pow(0.04, dt);
            view.idle += dt;
            if (view.idle > 6 && !still) view.turn += 0.035 * dt * Math.min(1, (view.idle - 6) / 3);
        }
        world.rotation.y = shell.rotation.y = view.turn;
        const tilt = view.tilt * Math.PI / 180;
        const dist = fitDist * view.zoom;
        camera.position.set(0, 1.42 + Math.sin(tilt) * dist, Math.cos(tilt) * dist);
        camera.lookAt(0, 1.42, 0);

        // Sky.
        raw(skyUniforms.uTop.value, sun.colours.top);
        raw(skyUniforms.uHorizon.value, sun.colours.horizon);
        for (const m of pointMats) m.uniforms.uTime.value = t;

        // Sun along an arc east to west at its true height; moon opposite.
        const cloudHide = 1 - Math.min(0.92, w.cloud * 0.9 + w.fog * 0.5);
        const phi = Math.max(-1.25, Math.min(1.25, sun.az)) * 1.2;
        const sy = Math.min(2.65, BASE + 0.16 + Math.max(-12, sun.el) / 60 * 1.6);
        const sr = Math.min(0.84, jarRadius(sy) * 0.85);
        const sunPos = tmp.set(Math.sin(phi) * sr, sy, -Math.cos(phi) * sr);
        for (const s of [sunCore, sunHalo, sunGlow, sunRays]) s.position.copy(sunPos);
        const warm = clamp01(1 - sun.el / 14);
        const core = [255, Math.round(240 - 70 * warm), Math.round(200 - 140 * warm)];
        const sunVis = sun.el > -4 ? clamp01((sun.el + 4) / 4) : 0;
        // The disc stays near white, warming only towards the horizon; the
        // glow round it carries the colour of the hour.
        setLin(sunLimb, core);
        sunCore.material.color.setRGB(1, 1, 1).lerp(sunLimb, 0.25 + 0.6 * warm).multiplyScalar(1.4);
        sunHalo.material.color.copy(sunLimb).multiplyScalar(1.1);
        sunGlow.material.color.copy(sunLimb);
        sunRays.material.color.copy(sunLimb);
        // A low sun looks bigger and softer; behind cloud only a smudge of it shows.
        const big = 1 + 0.25 * warm;
        sunCore.scale.set(0.2 * big, 0.2 * big, 1);
        sunCore.material.opacity = sunVis * (0.92 * cloudHide + 0.08);
        sunHalo.material.opacity = sunVis * (0.75 * cloudHide + 0.1);
        sunGlow.material.opacity = sunVis * (0.55 * cloudHide + 0.15 * w.cloud) * (1 - 0.5 * w.fog);
        sunRays.material.opacity = sunVis * 0.22 * cloudHide * cloudHide * (1 - w.fog);
        sunRays.material.rotation = t * 0.015;
        sunRays.scale.setScalar(0.95 + 0.04 * Math.sin(t * 0.7));
        skyUniforms.uSunDir.value.copy(sunPos).sub(SKY_CENTRE).normalize();
        const low = sun.el > 0 && sun.el < 22 ? Math.min(1, sun.el / 3) * Math.min(1, (22 - sun.el) / 10) : 0;
        const beam = low * sunVis * cloudHide * (1 - w.fog) * (1 - w.rain) * (0.45 + 0.55 * Math.min(1, w.cloud * 2.5));
        shaftDir.set(0, BASE + 0.1, 0).sub(sunPos);
        const reach = Math.min(0.95, shaftDir.length());
        shaftDir.normalize();
        for (const s of shafts) {
            const { off, width, k } = s.userData;
            s.visible = beam > 0.02;
            if (!s.visible) continue;
            s.position.copy(sunPos).addScaledVector(shaftDir, reach * 0.5);
            s.position.x += off * 0.3;
            // Point the sprite along the beam as it appears on screen.
            shaftA.copy(sunPos); world.localToWorld(shaftA); shaftA.project(camera);
            shaftB.copy(sunPos).addScaledVector(shaftDir, reach); world.localToWorld(shaftB); shaftB.project(camera);
            s.material.rotation = Math.atan2((shaftB.y - shaftA.y), (shaftB.x - shaftA.x) * camera.aspect) + Math.PI / 2 + off * 0.5;
            s.scale.set(width, reach, 1);
            setLin(s.material.color, core);
            s.material.opacity = beam * 0.3 * k;
        }
        raw(skyUniforms.uGlow.value, core);
        skyUniforms.uSunGlow.value = sunVis * (0.12 + 0.88 * cloudHide) * (0.2 + 0.3 * warm);

        const mphi = -Math.max(-1.25, Math.min(1.25, sun.az)) * 1.05;
        const my = 2.3 - Math.abs(sun.az) * 0.35;
        const mr = jarRadius(my) * 0.82;
        moon.position.set(Math.sin(mphi) * mr, my, -Math.cos(mphi) * mr);
        moonGlow.position.copy(moon.position);
        if (Math.abs(sun.phase - moonDrawn) > 0.004) drawMoon(sun.phase);
        const moonA = night > 0.25 ? Math.min(1, (night - 0.25) * 2) * (1 - Math.min(0.85, w.cloud * 0.8)) : 0;
        moon.material.opacity = moonA;
        moonGlow.material.opacity = moonA * 0.35;
        moon.visible = moonGlow.visible = moonA > 0.01;

        const starA = night * (1 - Math.min(1, w.cloud * 1.1)) * (1 - w.fog);
        stars.material.uniforms.uOpacity.value = starA;
        stars.visible = starA > 0.02;
        skyUniforms.uNight.value = starA;

        // Light inside: the sun by day, the moon by night, the sky all round.
        const lit = 1 - Math.min(0.8, w.cloud * 0.7 + w.fog * 0.3);
        const moonlit = 1 - Math.abs(sun.phase - 0.5) * 2;
        if (sun.el > -3) {
            sunLight.position.copy(sunPos).sub(sunLight.target.position).normalize().multiplyScalar(3).add(sunLight.target.position);
            setLin(sunLight.color, core);
            sunLight.intensity = clamp01((sun.el + 3) / 10) * 1.7 * lit;
        } else {
            sunLight.position.copy(moon.position).sub(sunLight.target.position).normalize().multiplyScalar(3).add(sunLight.target.position);
            sunLight.color.setRGB(0.6, 0.7, 1);
            sunLight.intensity = 0.25 * moonlit * moonA;
        }
        sunLight.castShadow = sunLight.intensity > 0.05;
        setLin(hemi.color, sun.colours.top.map((v, i) => Math.max(v, [60, 70, 110][i])));
        setLin(hemi.groundColor, [60, 70, 40]);
        hemi.intensity = 0.35 + 0.75 * day;
        ambient.intensity = 0.18 + 0.1 * night;

        // Lightning.
        if (w.storm && !still) {
            storm.next -= dt;
            if (storm.next <= 0) { storm.flash = 1; storm.next = 3 + Math.random() * 6; strike(); }
        } else storm.flash = 0;
        bolt.visible = storm.flash > 0.6;
        bolt.material.opacity = storm.flash;
        flashLight.intensity = storm.flash * 1.6;
        skyUniforms.uFlash.value = storm.flash;
        storm.flash = Math.max(0, storm.flash - dt * 2.6);

        // Snow lying: ground, roof, branches; the pond freezes once it is deep and cold.
        snowMat.opacity = Math.min(0.96, snowCover * 1.15);
        snowGround.visible = snowCover > 0.01;
        roofSnowMat.opacity = Math.min(1, snowCover * 1.4);
        roofSnow.visible = snowCover > 0.02;
        leafSnow.value = Math.min(0.9, snowCover * 1.1);
        const frozen = snowCover > 0.6 && (w.temp ?? 5) < 0;
        if (frozen) {
            waterMat.color.setRGB(0.72, 0.8, 0.88);
            waterMat.roughness = 0.5;
        } else {
            const h = sun.colours.horizon, tp = sun.colours.top;
            setLin(waterMat.color, [0, 1, 2].map(i => 30 + (h[i] * 0.5 + tp[i] * 0.5) * 0.25));
            waterMat.roughness = 0.03 + w.rain * 0.12;
        }
        waterMat.emissive.copy(waterMat.color).multiplyScalar(frozen ? 0.1 : 0.15);
        flowers.visible = snowCover < 0.3 && (w.temp ?? 12) > 4;
        flowers.count = Math.max(1, Math.round(flowerSpots.length * season.bloom));
        // Grass pales under the snow and is buried once it lies deep.
        tuftMat.emissive.setScalar(Math.min(0.5, snowCover * 0.6));
        tufts.visible = snowCover < 0.75;

        // The tree: autumnal below ten degrees, thinner in the snow, bending in the wind.
        const temp = w.temp ?? 12;
        const cold = temp < 10 ? Math.min(1, (10 - temp) / 12) : 0;
        // In spring two of every three sprays of leaves go over to blossom,
        // pink among the green.
        const bl = season.blossom * (1 - cold);
        const foliage = [70 + 150 * cold, 150 - 40 * cold, 80 - 40 * cold];
        const pink = (amount) => foliage.map((v, j) => v + ([255, 168, 198][j] - v) * bl * amount);
        [0.82, 1, 1.15].forEach((k, i) => {
            setLin(cardMats[i].color, pink([0.9, 0.2, 0.9][i]), k);
            // Leaves let light through: a little glow of their own when the sun is up.
            cardMats[i].emissive.copy(cardMats[i].color).multiplyScalar(0.12 + 0.2 * day);
        });
        const keep = 1 - Math.min(0.8, snowCover);
        cards.forEach((c, i) => { c.visible = (i * 37 % 100) / 100 <= keep; });
        const sway = (Math.sin(t * (1.2 + w.wind * 0.12)) * 0.5 + 0.5) * (0.01 + w.wind * 0.012) + gust * 0.12;
        for (const b of branches) b.g.rotation.z = b.z + sway * (6 - b.depth) * 0.22;
        treeRoot.rotation.z = -sway * 0.35;

        // Clouds.
        const shown = Math.ceil(clouds.length * Math.min(1, w.cloud + 0.15));
        // Rain clouds go grey and heavy-bottomed; fair-weather ones stay white.
        const wet = Math.min(1, w.rain * 1.3 + w.snow * 0.4);
        const cbase = w.storm ? [40 + 40 * day, 42 + 42 * day, 52 + 44 * day] : [44 + (200 - 85 * wet) * day, 48 + (196 - 82 * wet) * day, 66 + (186 - 66 * wet) * day];
        const shade = [0.72 - 0.24 * wet, 0.88 - 0.12 * wet, 1];
        for (const c of clouds) {
            const want = w.cloud >= 0.05 && c.rank < shown ? c.size * (0.6 + w.cloud * 0.75) : 0;
            c.scale += (want - c.scale) * Math.min(1, dt * 1.5);
            c.g.visible = c.scale > 0.02;
            if (!c.g.visible) continue;
            c.a += (0.6 + w.wind * 0.9 + gust * 4) * c.speed * dt * 0.06 * (still ? 0.2 : 1);
            const y = c.y - (w.cloud > 0.8 ? 0.12 : 0);
            const r = Math.max(0, Math.min(c.r, jarRadius(y) - 0.3 * c.scale - 0.12));
            c.g.position.set(Math.cos(c.a) * r, y, Math.sin(c.a) * r);
            c.g.rotation.y = -c.a + Math.PI / 2;
            c.g.scale.setScalar(c.scale);
            // Shaded underneath, lit along the top, warm when the sun is low.
            shade.forEach((k, j) => {
                setLin(c.mats[j].color, cbase.map(v => Math.min(255, v + 10)), k);
                if (j === 2) c.mats[j].color.add(cloudRim.value);
            });
        }

        // Cabin lamp and chimney smoke.
        const lampOn = clamp01((0.55 - day) * 3 + w.cloud * 0.2);
        windowMat.emissiveIntensity = lampOn > 0.05 ? 0.4 + lampOn * 1.6 : 0;
        lamp.intensity = lampOn * 0.9;
        lampGlow.material.opacity = lampOn * 0.55;
        const flicker = 0.92 + 0.08 * Math.sin(t * 9.3) * Math.sin(t * 5.1);
        lanternGlass.emissiveIntensity = lampOn > 0.05 ? (0.5 + lampOn * 2) * flicker : 0;
        lanternLight.intensity = lampOn * 0.7 * flicker;
        lanternGlow.material.opacity = lampOn * 0.6 * flicker;
        chimneyTop.set(0.07, 0.32, -0.05);
        cabin.localToWorld(chimneyTop);
        world.worldToLocal(chimneyTop);
        smoke.forEach((s, k) => {
            const on = temp < 12;
            s.visible = on;
            if (!on) return;
            const ph = (t * 0.22 + k / smoke.length) % 1;
            s.position.set(chimneyTop.x + ph * (0.05 + w.wind * 0.03), chimneyTop.y + ph * 0.35, chimneyTop.z);
            const sz = 0.05 + ph * 0.14;
            s.scale.set(sz, sz, 1);
            s.material.opacity = 0.4 * (1 - ph) * Math.min(1, ph * 6);
            setLin(s.material.color, [200, 205, 215], 0.35 + 0.65 * day);
        });

        // Rain.
        const nRain = Math.round(NDROPS * w.rain);
        rain.visible = nRain > 0;
        if (nRain > 0) {
            const slant = (w.wind * 0.9 + gust * 8) * 0.03;
            const pos = rainGeo.attributes.position.array;
            const life = splashes.geometry.attributes.aAlpha.array, spos = splashes.geometry.attributes.position;
            for (let k = 0; k < nRain; k++) {
                const d = drops[k];
                d.y -= 3.2 * d.v * dt;
                d.x += slant * 1.2 * dt;
                if (d.y < d.floor || Math.hypot(d.x, d.z) > 0.93) {
                    if (k % 3 === 0 && d.y < d.floor + 0.05) {
                        const s = splashNext++ % NSPLASH;
                        spos.setXYZ(s, d.x, d.floor + 0.012, d.z);
                        splashLife[s] = 1;
                    }
                    if (d.pond && !frozen && Math.hypot(d.x - POND.x, d.z - POND.z) < POND.r * 0.92) {
                        const ring = rings[ringNext++ % rings.length];
                        ring.position.set(d.x, WATER_Y + 0.002, d.z);
                        ring.userData.life = 1;
                    }
                    spawnDrop(d, false);
                }
                const len = 0.075 * d.v;
                pos.set([d.x, d.y, d.z, d.x - slant * len * 3, d.y + len, d.z], k * 6);
            }
            rainGeo.attributes.position.needsUpdate = true;
            rainGeo.setDrawRange(0, nRain * 2);
            rainMat.opacity = 0.35 + 0.25 * day;
            spos.needsUpdate = true;
        }
        {
            const life = splashes.geometry.attributes.aAlpha.array, size = splashes.geometry.attributes.aSize.array;
            let any = false;
            for (let k = 0; k < NSPLASH; k++) {
                splashLife[k] = Math.max(0, splashLife[k] - dt * 3);
                life[k] = splashLife[k] * 0.7;
                size[k] = 0.012 + (1 - splashLife[k]) * 0.03;
                if (splashLife[k] > 0) any = true;
            }
            splashes.visible = any;
            splashes.geometry.attributes.aAlpha.needsUpdate = true;
            splashes.geometry.attributes.aSize.needsUpdate = true;
        }

        for (const r of rings) {
            const l = r.userData.life = Math.max(0, r.userData.life - dt * 1.4);
            r.visible = l > 0;
            if (!r.visible) continue;
            r.scale.setScalar(0.004 + (1 - l) * 0.05);
            r.material.opacity = l * 0.55;
        }

        // Snow.
        const nSnow = Math.round(NFLAKES * w.snow);
        snow.visible = nSnow > 0;
        if (nSnow > 0) {
            const pos = snow.geometry.attributes.position;
            for (let k = 0; k < nSnow; k++) {
                const fl = flakes[k];
                fl.y -= 0.32 * fl.v * dt;
                fl.x += (Math.sin(t * 1.3 + fl.p) * 0.08 + w.wind * 0.03 + gust * 0.5) * dt;
                fl.z += Math.cos(t * 1.1 + fl.p) * 0.05 * dt;
                const r = Math.hypot(fl.x, fl.z);
                if (fl.y < groundH(fl.x, fl.z) || r > 0.93) {
                    do { fl.x = R() * 1.8 - 0.9; fl.z = R() * 1.8 - 0.9; } while (Math.hypot(fl.x, fl.z) > 0.9);
                    fl.y = 2.5;
                }
                pos.setXYZ(k, fl.x, fl.y, fl.z);
            }
            pos.needsUpdate = true;
            snow.geometry.setDrawRange(0, nSnow);
        }

        // Fireflies on warm, dry nights.
        const fliesOn = night >= 0.6 && w.rain <= 0 && w.snow <= 0 && temp >= 10;
        fireflies.visible = fliesOn;
        if (fliesOn) {
            const pos = fireflies.geometry.attributes.position, al = fireflies.geometry.attributes.aAlpha;
            flies.forEach((fl, k) => {
                pos.setXYZ(k, fl.x + Math.sin(t * 0.6 + fl.p) * 0.08, fl.y + Math.sin(t * 0.8 + fl.q) * 0.04, fl.z + Math.cos(t * 0.45 + fl.q) * 0.08);
                al.setX(k, (Math.sin(t * 2.4 + fl.p * 3) * 0.5 + 0.5) * Math.min(1, (night - 0.6) * 2.5));
            });
            pos.needsUpdate = true;
            al.needsUpdate = true;
        }

        // Fog: banks drifting low round the jar, and the air thickening with distance.
        for (const b of fogBanks) {
            b.s.visible = w.fog > 0.01;
            if (!b.s.visible) continue;
            b.a += dt * 0.05;
            b.s.position.set(Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r);
            b.s.material.opacity = 0.55 * w.fog;
            setLin(b.s.material.color, [210, 215, 225], 0.4 + 0.6 * day);
        }
        if (w.fog > 0.01) {
            if (!inner.fog) inner.fog = new THREE.Fog(0xffffff, 1, 2);
            const hz = sun.colours.horizon;
            setLin(inner.fog.color, [0, 1, 2].map(i => hz[i] * 0.5 + 105), 0.4 + 0.6 * day);
            inner.fog.near = dist - 1.1;
            inner.fog.far = inner.fog.near + 2.2 / Math.max(0.05, w.fog);
        } else inner.fog = null;

        // The glass fogs up a little when it is wet out.
        const damp = Math.min(1, w.rain * 0.8 + w.fog);
        dew.visible = damp > 0.05;
        dew.material.uniforms.uOpacity.value = 0.3 * damp;
        glassFront.material.uniforms.uDamp.value = damp;

        // The stand catches the jar's light.
        glowCol.setRGB(...sun.colours.horizon.map(v => v / 255)).multiplyScalar(0.12 + 0.18 * day);
        glowCol.r += lampOn * 0.16; glowCol.g += lampOn * 0.1; glowCol.b += lampOn * 0.03;
        spill.material.color.copy(glowCol);
        spill.material.opacity = 1;

        // Tag swings a little.
        tagPivot.rotation.z = Math.sin(t * 0.9) * 0.04 + gust * 0.12 * Math.sin(t * 6);

        // Grass in the wind, ripples on the pond, rain stirring it.
        grassUniforms.uTime.value = t;
        grassUniforms.uWind.value = (0.004 + w.wind * 0.0025 + gust * 0.03) * (1 - Math.min(0.8, snowCover));
        ripples.offset.set(t * 0.012 * (1 + w.wind * 0.2), t * 0.008);
        waterMat.normalScale.setScalar(frozen ? 0.02 : 0.06 + w.rain * 0.35 + w.wind * 0.012);

        // Silver linings when the sun is behind a cloud.
        cloudRim.value.setRGB(core[0] / 255, core[1] / 255, core[2] / 255).convertSRGBToLinear().multiplyScalar(sunVis * cloudHide * 0.25 * warm);

        // Raindrops on the glass run down it, then start again near the top.
        if (w.rain > 0 && dew.visible) {
            const pos = dew.geometry.attributes.position;
            for (let k = 0; k < NDEW; k++) {
                if (!dewRun[k]) continue;
                let y = pos.getY(k) - dewRun[k] * dt * (0.4 + w.rain) * (Math.sin(t * 3 + k) > 0.6 ? 2.5 : 0.6);
                if (y < BASE - 0.05) y = BASE + 1.4 + R2() * 0.25;
                const x = pos.getX(k), z = pos.getZ(k), r = jarRadius(y) * 0.985 / Math.hypot(x, z);
                pos.setXYZ(k, x * r, y, z * r);
            }
            pos.needsUpdate = true;
        }

        // A shooting star now and then while the stars are out.
        if (shooting.f < 0 && starA > 0.5 && !still) {
            shooting.next -= dt;
            if (shooting.next <= 0) {
                shooting.f = 0;
                shooting.next = 7 + R2() * 14;
                const a = R2() * 6.283, y = 2.25 + R2() * 0.35, r = jarRadius(y) * 0.65;
                shooting.from.set(Math.cos(a) * r, y, Math.sin(a) * r);
                // Across the sky and a little down, along the dome rather than out through it.
                const side = R2() < 0.5 ? 1 : -1;
                shooting.dir.set(-Math.sin(a) * side - Math.cos(a) * 0.4, -0.35, Math.cos(a) * side - Math.sin(a) * 0.4).normalize();
            }
        }
        meteor.visible = shooting.f >= 0;
        if (meteor.visible) {
            shooting.f += dt / 0.8;
            const pos = meteor.geometry.attributes.position, al = meteor.geometry.attributes.aAlpha;
            const head = Math.min(1, shooting.f) * 0.6, fade = Math.sin(Math.PI * Math.min(1, shooting.f));
            for (let k = 0; k < TRAIL; k++) {
                const d = Math.max(0, head - k * 0.018);
                pos.setXYZ(k, shooting.from.x + shooting.dir.x * d, shooting.from.y + shooting.dir.y * d, shooting.from.z + shooting.dir.z * d);
                al.setX(k, fade * (1 - k / TRAIL) * (head - k * 0.018 > 0 ? 1 : 0));
            }
            pos.needsUpdate = true;
            al.needsUpdate = true;
            meteor.material.uniforms.uOpacity.value = starA;
            if (shooting.f >= 1) shooting.f = -1;
        }

        // Mist lifting off the pond after a cool, still night, gone as the sun climbs.
        const mistA = sun.az < 0.15 ? clamp01((sun.el + 5) / 4) * clamp01((13 - sun.el) / 7) * clamp01((20 - temp) / 6) * clamp01(1 - w.wind / 12) * (1 - Math.min(1, w.rain * 3)) * (frozen ? 0 : 1) : 0;
        mist.visible = mistA > 0.01;
        if (mist.visible) {
            for (const m of wisps) {
                m.a += dt * m.sp * (still ? 0.2 : 1);
                m.s.position.set(POND.x + Math.cos(m.a) * m.r, m.y + 0.006 * Math.sin(t * 0.4 + m.a), POND.z + Math.sin(m.a) * m.r * 0.8);
                m.s.scale.set(m.w, m.w * 0.32, 1);
                m.s.material.opacity = mistA * 0.8;
                setLin(m.s.material.color, [0, 1, 2].map(i => 205 + sun.colours.horizon[i] * 0.2), 0.8 + 0.2 * day);
            }
        }

        // Leaves coming down: a steady fall in autumn, a flurry when the jar is tapped.
        if (!still && snowCover < 0.5) {
            fallDue += dt * (cold > 0.25 ? 0.6 + cold * 1.6 + w.wind * 0.1 : 0) + dt * bl * (0.8 + w.wind * 0.15) + (gust > 0.9 ? dt * 25 : 0);
            while (fallDue >= 1) { fallDue -= 1; dropLeaf(); }
        }
        {
            let any = false;
            fallers.forEach((f, k) => {
                if (!f.on) { fallM.makeScale(0, 0, 0); falling.setMatrixAt(k, fallM); return; }
                any = true;
                let flat = 0, fade = 1;
                if (f.y > f.floor) {
                    // A sideways flutter as it falls, carried with the wind.
                    f.y -= (0.1 + 0.04 * Math.sin(t * 3 + f.p)) * dt;
                    f.x += (Math.sin(t * 2.1 + f.p) * 0.06 + w.wind * 0.004 + gust * 0.15) * dt;
                    f.z += Math.cos(t * 1.7 + f.p) * 0.04 * dt;
                    if (Math.hypot(f.x, f.z) > 0.9) { const s = 0.9 / Math.hypot(f.x, f.z); f.x *= s; f.z *= s; }
                    f.floor = groundH(f.x, f.z) + 0.004;
                    if (f.y <= f.floor) f.y = f.floor;
                } else {
                    flat = 1;
                    f.rest += dt;
                    fade = clamp01(1 - (f.rest - 4) / 2);
                    if (fade <= 0) f.on = false;
                }
                fallE.set(flat ? -Math.PI / 2 : Math.sin(t * f.spin + f.p) * 1.1, f.p, flat ? 0 : Math.cos(t * f.spin * 0.8 + f.p) * 0.9);
                fallQ.setFromEuler(fallE);
                fallP.set(f.x, f.y, f.z);
                fallS.setScalar(fade);
                fallM.compose(fallP, fallQ, fallS);
                falling.setMatrixAt(k, fallM);
            });
            falling.visible = any;
            falling.instanceMatrix.needsUpdate = true;
            setLin(fallMat.color, bl > 0.2 ? [250, 214, 226] : [70 + 150 * cold, 150 - 40 * cold, 80 - 40 * cold]);
        }

        // Birds on fine days.
        const birdWant = day > 0.6 && w.rain <= 0 && w.snow <= 0 && !w.storm && w.fog < 0.3 ? 1 : 0;
        birdsShown += (birdWant - birdsShown) * Math.min(1, dt * 0.5);
        birdMat.opacity = birdsShown;
        for (const b of birds) {
            b.g.visible = birdsShown > 0.02;
            if (!b.g.visible) continue;
            b.a += dt * (still ? 0.03 : 0.22) * (0.5 / b.r);
            const yy = b.y + Math.sin(t * 0.5 + b.p) * 0.03;
            b.g.position.set(Math.cos(b.a) * b.r, yy, Math.sin(b.a) * b.r);
            b.g.rotation.set(0, -b.a, 0.25);
            // Flap for a while, then glide.
            const flap = still || Math.sin(t * 0.7 + b.p) > 0.3 ? 0.15 : Math.sin(t * 14 + b.p) * 0.7;
            b.left.rotation.z = flap; b.right.rotation.z = -flap;
        }

        // The rainbow.
        const bowWant = w.rain > 0 && !w.storm && sun.el > 3 ? clamp01((sun.el - 3) / 6) * (1 - clamp01((w.cloud - 0.6) / 0.4) * 0.55) * (1 - w.fog) : 0;
        rainbowA += (bowWant - rainbowA) * Math.min(1, dt * 0.4);
        rainbow.visible = rainbowA > 0.01;
        if (rainbow.visible) {
            eye.copy(camera.position);
            world.worldToLocal(eye);
            const ang = Math.atan2(eye.x, eye.z);
            rainbow.position.set(-Math.sin(ang) * 0.5, BASE - 0.06, -Math.cos(ang) * 0.5);
            rainbow.rotation.set(0, ang, 0);
            rainbow.material.uniforms.uOpacity.value = rainbowA * 0.45;
        }

        // The pond's plants: pads hide under ice, reeds pale in the snow.
        for (const pad of pads) { pad.visible = !frozen; pad.position.y = WATER_Y + 0.0025 + Math.sin(t * 0.8 + pad.rotation.z) * 0.0008; }
        reedMat.emissive.setScalar(Math.min(0.35, snowCover * 0.4));

        if (summonAt >= 0 && t >= summonAt) { summonAt = -1; visitors.summon(); }
        visitors.update(dt, t, { snow: snowCover, still, day, w, frozen });

        // The pond's reflection, refreshed every few frames.
        if (water.visible && pondTick-- <= 0) {
            pondTick = lite ? 14 : 5;
            water.getWorldPosition(pondCam.position);
            pondCam.position.y += 0.03;
            water.visible = false;
            // Anything bobbing on the water sits right against the cube camera
            // and would fill half its view; leave it out of the reflection.
            const ducksShown = visitors.ducks.visible, mistShown = mist.visible;
            visitors.ducks.visible = mist.visible = false;
            // The cube camera relies on autoClear, which the two-scene draw turns off.
            renderer.shadowMap.autoUpdate = false;
            renderer.autoClear = true;
            // Point sizes are tuned for the main camera; the cube's faces are
            // 128px at 90°, so shrink them for this pass or every star is a blob.
            const mainScale = pointMats[0].uniforms.uScale.value;
            for (const m of pointMats) m.uniforms.uScale.value = 64;
            pondCam.update(renderer, inner);
            for (const m of pointMats) m.uniforms.uScale.value = mainScale;
            renderer.autoClear = false;
            renderer.shadowMap.autoUpdate = true;
            water.visible = true;
            visitors.ducks.visible = ducksShown;
            mist.visible = mistShown;
        }

        renderer.clear();
        renderer.render(inner, camera);
        renderer.render(room, camera);
        if (!canvas.classList.contains('ready')) canvas.classList.add('ready');
    }

    resize();
    return {
        render,
        resize,
        setTag(name) { if (name !== tagName) { tagName = name; drawTag(); } },
        /** Calls the visitor, after a delay in seconds (for ?ufo and screenshots). */
        ufo(delay = 0) { summonAt = delay; },
    };
}
