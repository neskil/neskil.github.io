// Rainmaker: the page. The island and the rain are js/sim.js; this draws them
// with a small WebGL 2 renderer of its own (one grid, one sheet of sea, some rain).

import * as S from './sim.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
const query = new URLSearchParams(location.search);

const N = 256;
const YS = N * 0.2;                 // one unit of height, in cells
const METRES = 2500;                // and in metres, for the readouts (a cell is about 50 m)
const SEA_Y = S.SEA * YS;

let island = S.makeIsland(N, query.has('seed') ? +query.get('seed') : 1 + Math.floor(Math.random() * 9999));
let rate = 1, tool = 'look', before = false;
const cam = { az: 0.7, el: 0.62, dist: N * 1.25 };
let hand = null;                    // where the pointer meets the island, while a tool is down

// ── Shaders ──
const COMMON = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uH, uBase, uFlow;
uniform mat4 uVP;
uniform vec3 uEye;
uniform float uN, uYS, uSea, uBefore, uTime, uFlowScale, uRiver;
const vec3 SUN = vec3(0.54, 0.6, 0.59);
const vec3 HAZE = vec3(0.62, 0.72, 0.84);
float height(ivec2 c) {
    c = clamp(c, ivec2(0), ivec2(int(uN) - 1));
    return mix(texelFetch(uH, c, 0).r, texelFetch(uBase, c, 0).r, uBefore);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
vec3 haze(vec3 col, vec3 pos) {
    float d = length(pos - uEye);
    return mix(col, HAZE, 1.0 - exp(-d * d / (uN * uN * 30.0)));
}
`;

const LAND_VS = COMMON + `
in vec2 aCell;
out vec3 vPos, vNor;
out float vH, vFlow, vDelta;
void main() {
    ivec2 c = ivec2(aCell);
    float h = height(c);
    float hx = height(c + ivec2(1, 0)) - height(c - ivec2(1, 0));
    float hz = height(c + ivec2(0, 1)) - height(c - ivec2(0, 1));
    vNor = normalize(vec3(-hx * uYS, 2.0, -hz * uYS));
    vPos = vec3(aCell.x - uN * 0.5, h * uYS, aCell.y - uN * 0.5);
    vH = h;
    vFlow = texelFetch(uFlow, c, 0).r * (1.0 - uBefore);
    vDelta = (h - texelFetch(uBase, c, 0).r) * (1.0 - uBefore);
    gl_Position = uVP * vec4(vPos, 1.0);
}`;

const LAND_FS = COMMON + `
in vec3 vPos, vNor;
in float vH, vFlow, vDelta;
out vec4 outCol;
void main() {
    vec3 n = normalize(vNor);
    float up = vH - uSea, steep = 1.0 - n.y;
    float grain = noise(vPos.xz * 0.9), patch_ = noise(vPos.xz * 0.11 + 5.0);
    vec3 sand = vec3(0.78, 0.71, 0.52), grass = vec3(0.36, 0.5, 0.22), wood = vec3(0.16, 0.31, 0.15);
    vec3 rock = mix(vec3(0.4, 0.37, 0.34), vec3(0.52, 0.48, 0.43), grain), snow = vec3(0.94, 0.96, 0.99);
    vec3 col = mix(sand, grass, smoothstep(0.006, 0.03, up));
    col = mix(col, wood, smoothstep(0.05, 0.2, up) * smoothstep(0.25, 0.7, patch_ + grain * 0.3));
    col = mix(col, rock, smoothstep(0.1, 0.26, steep + (up - 0.3) * 0.25));
    col = mix(col, snow, smoothstep(0.58, 0.68, up + grain * 0.04) * smoothstep(0.4, 0.15, steep));
    // What the rain has done: bare rock where it cut, pale silt where it left some.
    col = mix(col, rock * 0.9, smoothstep(0.012, 0.06, -vDelta) * 0.6);
    col = mix(col, vec3(0.56, 0.6, 0.36), smoothstep(0.002, 0.02, vDelta) * 0.45);
    // Running water. The scale is logarithmic: a trunk river carries thousands of rills.
    float f = log2(1.0 + vFlow * uFlowScale);
    col *= 1.0 - 0.22 * smoothstep(0.5, 2.5, f);
    float river = smoothstep(uRiver, uRiver + 1.2, f) * step(0.0, up);
    col = mix(col, vec3(0.2, 0.52, 0.78), river * 0.92);

    float lit = max(dot(n, normalize(SUN)), 0.0);
    col *= vec3(0.34, 0.4, 0.5) * (0.6 + 0.4 * n.y) + vec3(1.05, 0.98, 0.86) * lit;
    col += river * pow(max(dot(reflect(-normalize(SUN), n), normalize(uEye - vPos)), 0.0), 24.0) * 0.5;
    if (up < 0.0) {
        float depth = -up;
        col = mix(col * vec3(0.55, 0.85, 0.9), vec3(0.04, 0.2, 0.36), smoothstep(0.0, 0.09, depth));
    }
    outCol = vec4(pow(haze(col, vPos), vec3(1.0 / 2.2)), 1.0);
}`;

const SEA_VS = COMMON + `
in vec2 aPos;
out vec3 vPos;
void main() {
    vPos = vec3(aPos.x * uN * 12.0, uSea * uYS, aPos.y * uN * 12.0);
    gl_Position = uVP * vec4(vPos, 1.0);
}`;

const SEA_FS = COMMON + `
in vec3 vPos;
out vec4 outCol;
float bed(vec2 p) {
    vec2 q = p + uN * 0.5;
    if (q.x < 0.0 || q.y < 0.0 || q.x > uN - 1.0 || q.y > uN - 1.0) return 0.0;
    ivec2 c = ivec2(floor(q)); vec2 f = fract(q);
    return mix(mix(height(c), height(c + ivec2(1, 0)), f.x), mix(height(c + ivec2(0, 1)), height(c + ivec2(1, 1)), f.x), f.y);
}
void main() {
    float depth = uSea - bed(vPos.xz);
    if (depth < 0.0) discard;
    vec2 w = vPos.xz * 0.35;
    float ripple = noise(w + uTime * vec2(0.5, 0.3)) + noise(w * 2.3 - uTime * vec2(0.4, 0.6)) * 0.5;
    vec3 n = normalize(vec3((ripple - 0.75) * 0.25, 1.0, (noise(w * 1.7 + 9.0 + uTime * 0.4) - 0.5) * 0.25));
    vec3 view = normalize(uEye - vPos);
    vec3 col = mix(vec3(0.16, 0.6, 0.66), vec3(0.03, 0.2, 0.4), smoothstep(0.0, 0.07, depth));
    float fres = pow(1.0 - max(dot(view, n), 0.0), 3.0);
    col = mix(col, HAZE, fres * 0.55);
    col += pow(max(dot(reflect(-normalize(SUN), n), view), 0.0), 60.0) * 0.8;
    // A line of surf where the water runs out, breathing with the swell.
    float surf = smoothstep(0.012 + 0.006 * sin(uTime * 1.3 + ripple * 5.0), 0.0, depth);
    col = mix(col, vec3(0.95), surf * 0.75);
    float alpha = mix(0.5, 1.0, smoothstep(0.0, 0.07, depth));
    outCol = vec4(pow(haze(col, vPos), vec3(1.0 / 2.2)), max(alpha, surf));
}`;

const SKY_VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main() { vUv = aPos; gl_Position = vec4(aPos, 0.999, 1.0); }`;
const SKY_FS = `#version 300 es
precision highp float; in vec2 vUv; out vec4 outCol;
void main() {
    vec3 col = mix(vec3(0.62, 0.72, 0.84), vec3(0.2, 0.38, 0.66), smoothstep(-0.2, 1.0, vUv.y));
    outCol = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

// Rain: a few hundred streaks falling inside a cylinder (the whole island, or the cloudburst).
const RAIN_VS = COMMON + `
in vec4 aDrop;                       // xz in a unit disc, phase, 0 = head / 1 = tail
uniform vec3 uCloud;                 // centre x, z and radius, in world units
out float vFade;
void main() {
    float fall = fract(aDrop.z + uTime * (0.9 + 0.3 * fract(aDrop.z * 7.0)));
    float y = uYS * 1.25 * (1.0 - fall) + aDrop.w * 5.0;
    vec3 p = vec3(uCloud.x + aDrop.x * uCloud.z, y + uYS * 0.1, uCloud.y + aDrop.y * uCloud.z);
    vFade = smoothstep(0.0, 0.1, fall) * (1.0 - aDrop.w * 0.7);
    gl_Position = uVP * vec4(p, 1.0);
}`;
const RAIN_FS = `#version 300 es
precision highp float; in float vFade; uniform float uAlpha; out vec4 outCol;
void main() { outCol = vec4(0.9, 0.95, 1.0, vFade * uAlpha); }`;

// ── GL setup ──
function program(vs, fs) {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const uniforms = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
        const name = gl.getActiveUniform(p, i).name;
        uniforms[name] = gl.getUniformLocation(p, name);
    }
    return { p, u: uniforms };
}
function mesh(prog, name, size, data, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog.p, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    if (indices) { gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW); }
    gl.bindVertexArray(null);
    return vao;
}
function floatTexture(unit) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST);
    for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
    return t;
}
function upload(unit, data) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, N, N, 0, gl.RED, gl.FLOAT, data);
}

let land, sea, sky, drops, vaoLand, vaoSea, vaoSky, vaoRain, indexCount;
const STREAKS = 500;
function initGL() {
    land = program(LAND_VS, LAND_FS); sea = program(SEA_VS, SEA_FS); sky = program(SKY_VS, SKY_FS); drops = program(RAIN_VS, RAIN_FS);
    const cells = new Float32Array(N * N * 2);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { cells[(j * N + i) * 2] = i; cells[(j * N + i) * 2 + 1] = j; }
    const idx = new Uint32Array((N - 1) * (N - 1) * 6);
    let k = 0;
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
        const a = j * N + i;
        idx[k++] = a; idx[k++] = a + N; idx[k++] = a + 1; idx[k++] = a + 1; idx[k++] = a + N; idx[k++] = a + N + 1;
    }
    indexCount = idx.length;
    vaoLand = mesh(land, 'aCell', 2, cells, idx);
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    vaoSea = mesh(sea, 'aPos', 2, quad);
    vaoSky = mesh(sky, 'aPos', 2, quad);
    const streaks = new Float32Array(STREAKS * 8);
    for (let i = 0; i < STREAKS; i++) {
        const a = Math.random() * 6.2832, r = Math.sqrt(Math.random()), ph = Math.random();
        for (let e = 0; e < 2; e++) streaks.set([Math.cos(a) * r, Math.sin(a) * r, ph, e], i * 8 + e * 4);
    }
    vaoRain = mesh(drops, 'aDrop', 4, streaks);
    floatTexture(0); floatTexture(1); floatTexture(2);
    upload(1, island.base);
}

// ── Camera ──
function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
function multiply(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
}
const FOV = 0.7;
function view() {
    const aspect = canvas.width / canvas.height;
    // An upright phone sees a narrow slice: stand further back, and aim low so
    // the island sits above the panel that covers the bottom of the screen.
    const dist = cam.dist * Math.max(1, 1.15 / aspect);
    const ce = Math.cos(cam.el);
    let target = [0, YS * 0.18, 0];
    let eye = [target[0] + dist * ce * Math.cos(cam.az), target[1] + dist * Math.sin(cam.el), target[2] + dist * ce * Math.sin(cam.az)];
    const f = unit(sub(target, eye)), r = unit(cross(f, [0, 1, 0])), u = cross(r, f);
    if (aspect < 0.8 && !document.body.classList.contains('bare')) eye = eye.map((v, i) => v - u[i] * dist * 0.17);
    const look = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -dot(r, eye), -dot(u, eye), dot(f, eye), 1];
    return { eye, f, r, u, aspect, vp: multiply(perspective(FOV, aspect, 2, N * 40), look) };
}
// The ray through a point of the canvas, in the simulation's own coordinates
// (x and z in cells from the map's corner).
function rayAt(e) {
    const rect = canvas.getBoundingClientRect(), v = view();
    const nx = ((e.clientX - rect.left) / rect.width * 2 - 1) * Math.tan(FOV / 2) * v.aspect;
    const ny = (1 - (e.clientY - rect.top) / rect.height * 2) * Math.tan(FOV / 2);
    const dir = unit([v.f[0] + v.r[0] * nx + v.u[0] * ny, v.f[1] + v.r[1] * nx + v.u[1] * ny, v.f[2] + v.r[2] * nx + v.u[2] * ny]);
    return S.pick(island, [v.eye[0] + N / 2, v.eye[1], v.eye[2] + N / 2], dir, YS);
}

// ── Drawing ──
function shared(prog, v, time) {
    gl.useProgram(prog.p);
    const u = prog.u;
    gl.uniformMatrix4fv(u.uVP, false, v.vp);
    gl.uniform3fv(u.uEye, v.eye);
    gl.uniform1i(u.uH, 0); gl.uniform1i(u.uBase, 1); gl.uniform1i(u.uFlow, 2);
    gl.uniform1f(u.uN, N); gl.uniform1f(u.uYS, YS); gl.uniform1f(u.uSea, S.SEA);
    gl.uniform1f(u.uBefore, before ? 1 : 0); gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uFlowScale, flowScale);
    gl.uniform1f(u.uRiver, +(query.get('river') || 2.7));
}
let flowScale = 1;
function draw(time) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    upload(0, island.h); upload(2, island.flow);
    const v = view();
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
    gl.useProgram(sky.p); gl.bindVertexArray(vaoSky); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    shared(land, v, time); gl.bindVertexArray(vaoLand); gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    shared(sea, v, time); gl.bindVertexArray(vaoSea); gl.drawArrays(gl.TRIANGLES, 0, 6);
    const bursting = hand && tool === 'cloud';
    if (!before && (rate > 0 || bursting)) {
        gl.depthMask(false);
        shared(drops, v, time); gl.bindVertexArray(vaoRain);
        if (rate > 0) {
            gl.uniform3f(drops.u.uCloud, 0, 0, N * 0.47); gl.uniform1f(drops.u.uAlpha, rate > 1 ? 0.5 : 0.28);
            gl.drawArrays(gl.LINES, 0, (rate > 1 ? STREAKS : STREAKS / 2) * 2);
        }
        if (bursting) {
            gl.uniform3f(drops.u.uCloud, hand.x - N / 2, hand.y - N / 2, CLOUD_R); gl.uniform1f(drops.u.uAlpha, 0.85);
            gl.drawArrays(gl.LINES, 0, 240);
        }
        gl.depthMask(true);
    }
    gl.bindVertexArray(null);
}

// ── The loop ──
const CLOUD_R = 13, BURST = 90;     // a cloudburst: this many extra drops a frame, in a circle this wide
const PER_FRAME = 220;              // raindrops per frame at "Rain"
let last = 0, shown = 0, spent = 0;
function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const t0 = performance.now();
    if (!before) {
        // The budget is drops, but never more than half a frame of time: a slow phone rains more gently.
        const want = Math.round(PER_FRAME * rate * dt * 60);
        for (let done = 0; done < want && performance.now() - t0 < 9; done += 40) S.rain(island, 40);
        if (hand && tool === 'cloud') S.rain(island, BURST, { x: hand.x, y: hand.y, r: CLOUD_R });
        if (hand && (tool === 'raise' || tool === 'lower')) S.sculpt(island, hand.x, hand.y, 16, (tool === 'raise' ? 0.25 : -0.25) * dt);
        S.dry(island, Math.pow(0.975, dt * 60));
    }
    // Flow is in drops-per-cell at whatever the weather is; scale it so the same river reads the same in drizzle or monsoon.
    const pour = PER_FRAME * Math.max(rate, 0.25) + (hand && tool === 'cloud' ? BURST : 0);
    flowScale += (60 / pour - flowScale) * 0.1;
    draw(now / 1000);
    if (now - shown > 400) { shown = now; readouts(); }
    spent = performance.now() - t0;
}

function readouts() {
    const m = S.measure(island);
    $('o-drops').textContent = island.drops < 1e6 ? Math.round(island.drops / 1000) + ' thousand' : (island.drops / 1e6).toFixed(2) + ' million';
    $('o-moved').textContent = (m.movedShare * 100).toFixed(m.movedShare < 0.1 ? 1 : 0) + '%';
    $('o-cut').textContent = Math.round(m.deepestCut * METRES / 5) * 5 + ' m';
    $('o-fill').textContent = Math.round(m.tallestFill * METRES / 5) * 5 + ' m';
    const share = S.riverShare(island, 0.02);
    $('o-river').textContent = share ? Math.round(share * 100) + '% of the water' : '–';
}

// ── Hands on ──
const pointers = new Map();
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    $('hint').style.opacity = 0;
    if (tool !== 'look' && pointers.size === 1) { hand = rayAt(e); return; }
    hand = null;
    drag = { x: e.clientX, y: e.clientY, pinch: 0 };
});
canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
        const [a, b] = [...pointers.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (drag && drag.pinch) zoom(drag.pinch / d);
        drag = { x: e.clientX, y: e.clientY, pinch: d }; hand = null;
        return;
    }
    if (tool !== 'look') { hand = rayAt(e); return; }
    if (!drag) return;
    cam.az += (e.clientX - drag.x) * 0.006;
    cam.el = Math.max(0.12, Math.min(1.45, cam.el + (e.clientY - drag.y) * 0.005));
    drag.x = e.clientX; drag.y = e.clientY;
});
const release = (e) => { pointers.delete(e.pointerId); hand = null; if (!pointers.size) drag = null; };
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
function zoom(f) { cam.dist = Math.max(N * 0.35, Math.min(N * 2.6, cam.dist * f)); }
window.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [0.08, 0], ArrowRight: [-0.08, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
    if (k) { cam.az += k[0]; cam.el = Math.max(0.12, Math.min(1.45, cam.el + k[1])); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') zoom(0.9);
    if (e.key === '-') zoom(1.1);
});

function press(group, attr, value) {
    for (const b of $(group).querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset[attr] === String(value));
}
$('weather').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { rate = +b.dataset.rate; press('weather', 'rate', rate); } });
const HINTS = {
    look: 'Drag to turn · scroll to zoom',
    cloud: 'Hold on the island to pour rain there',
    raise: 'Hold on the island to push up a hill',
    lower: 'Hold on the island to dig',
};
$('tools').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    tool = b.dataset.tool; press('tools', 'tool', tool);
    canvas.classList.toggle('tooling', tool !== 'look');
    $('hint').textContent = HINTS[tool]; $('hint').style.opacity = 1;
});
$('btn-before').addEventListener('click', (e) => {
    before = !before;
    e.currentTarget.setAttribute('aria-pressed', before);
    e.currentTarget.textContent = before ? 'Showing it before' : 'Show it before';
});
$('btn-undo').addEventListener('click', () => { island.h.set(island.base); island.flow.fill(0); island.drops = 0; readouts(); });
$('btn-new').addEventListener('click', () => {
    island = S.makeIsland(N, 1 + Math.floor(Math.random() * 99999));
    upload(1, island.base); readouts();
});
$('btn-bare').addEventListener('click', (e) => {
    const on = document.body.classList.toggle('bare');
    e.currentTarget.setAttribute('aria-pressed', on);
    e.currentTarget.textContent = on ? 'Show panel' : 'Hide panel';
});

// ── Go ──
if (!gl) {
    $('nogl').style.display = 'grid';
} else {
    try {
        initGL();
        // Start already weathered, for screenshots: the same rain, frame by frame, with nothing drawn.
        for (let left = +query.get('soak') || 0; left > 0; left -= PER_FRAME) { S.rain(island, PER_FRAME); S.dry(island, 0.975); }
        if (query.has('rate')) { rate = +query.get('rate'); press('weather', 'rate', rate); }
        if (query.has('az')) cam.az = +query.get('az');
        if (query.has('el')) cam.el = +query.get('el');
        if (query.has('dist')) cam.dist = N * +query.get('dist');
        readouts();
        requestAnimationFrame(frame);
    } catch (err) {
        console.error(err);
        $('nogl').style.display = 'grid';
        $('nogl').textContent = 'The shaders did not compile on this device: ' + err.message;
    }
}
