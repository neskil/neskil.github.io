// Pocket Black Hole: the page. The physics it draws is js/geodesic.js; the
// fragment shader below integrates the same force law once per pixel.

import * as G from './geodesic.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outCol;

uniform vec2 uRes;
uniform vec3 uCam;
uniform mat3 uBasis;      // columns: right, up, forward
uniform float uTime;
uniform float uLens, uDisc, uDoppler, uGrid;
uniform vec2 uShift;

const float RIN = 3.0;
const float ROUT = 13.0;
const int STEPS = 260;

float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}
float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
                   mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
                   mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * noise3(p); p = p * 2.03 + 7.1; a *= 0.5; }
    return s;
}

vec3 starLayer(vec3 d, float scale, float density) {
    vec3 q = d * scale, id = floor(q), f = fract(q) - 0.5;
    float h = hash13(id);
    if (h < 1.0 - density) return vec3(0.0);
    vec3 off = (vec3(hash13(id + 1.7), hash13(id + 2.9), hash13(id + 4.3)) - 0.5) * 0.6;
    float dd = length(f - off);
    float b = smoothstep(0.16, 0.0, dd) * (0.3 + 0.7 * (h - (1.0 - density)) / density);
    vec3 tint = mix(vec3(1.0, 0.82, 0.62), vec3(0.68, 0.8, 1.0), hash13(id + 9.1));
    return tint * b * b * 2.4;
}

vec3 sky(vec3 d) {
    if (uGrid > 0.5) {
        float lon = atan(d.z, d.x), lat = asin(clamp(d.y, -1.0, 1.0));
        float stepA = 0.2617994;   // 15 degrees
        float gl1 = abs(fract(lon / stepA + 0.5) - 0.5) * stepA * max(cos(lat), 0.05);
        float gl2 = abs(fract(lat / stepA + 0.5) - 0.5) * stepA;
        float line = 1.0 - smoothstep(0.0015, 0.0045, min(gl1, gl2));
        // Four quadrants by longitude, shaded by hemisphere, so a flipped or
        // doubled image of the sky can be told apart at a glance.
        vec3 base = d.x > 0.0 ? (d.z > 0.0 ? vec3(0.85, 0.25, 0.2) : vec3(0.95, 0.75, 0.2))
                              : (d.z > 0.0 ? vec3(0.2, 0.55, 0.9) : vec3(0.25, 0.75, 0.45));
        base *= d.y > 0.0 ? 0.55 : 0.28;
        return mix(base, vec3(0.95), line);
    }
    vec3 col = starLayer(d, 48.0, 0.05) + starLayer(d, 110.0, 0.05) * 0.7 + starLayer(d, 230.0, 0.07) * 0.45;
    // A band of unresolved stars and dust, tilted against the disc.
    vec3 n = normalize(vec3(0.35, 0.8, 0.5));
    float band = exp(-pow(dot(d, n) * 3.2, 2.0));
    float dust = fbm(d * 3.5 + 2.0);
    float lanes = smoothstep(0.35, 0.7, fbm(d * 7.0 - 4.0));
    col += band * (0.05 + 0.3 * dust * dust) * mix(vec3(0.55, 0.62, 0.9), vec3(1.0, 0.8, 0.6), dust) * (1.0 - 0.7 * lanes);
    return col;
}

vec3 blackbody(float T) {
    T = clamp(T, 1000.0, 40000.0) / 100.0;
    float r = T <= 66.0 ? 1.0 : clamp(1.292936 * pow(T - 60.0, -0.1332047), 0.0, 1.0);
    float g = T <= 66.0 ? clamp(0.39008158 * log(T) - 0.63184144, 0.0, 1.0)
                        : clamp(1.129891 * pow(T - 60.0, -0.0755148), 0.0, 1.0);
    float b = T >= 66.0 ? 1.0 : (T <= 19.0 ? 0.0 : clamp(0.54320679 * log(T - 10.0) - 1.19625409, 0.0, 1.0));
    return vec3(r, g, b);
}

float streaks(vec3 c, float r, float t) {
    float th = sqrt(0.5 / (r * r * r)) * t;       // Keplerian: inner gas laps outer
    float cs = cos(th), sn = sin(th);
    vec2 q = vec2(c.x * cs - c.z * sn, c.x * sn + c.z * cs) / r;
    return fbm(vec3(q * 2.6, r * 0.75)) * 0.7 + noise3(vec3(q * 7.0, r * 2.4)) * 0.3;
}

// Colour and opacity of the disc where a ray crosses it. dir is the ray's
// direction of travel (we trace backwards, so light leaves along -dir).
vec4 disc(vec3 c, vec3 dir) {
    float r = length(c);
    float x = (r - RIN) / (ROUT - RIN);
    float flux = pow(RIN / r, 3.0) * (1.0 - sqrt(RIN / r)) / 0.0567;   // thin-disc profile, peak 1
    float g = 1.0;
    if (uDoppler > 0.5) {
        vec3 tang = normalize(vec3(-c.z, 0.0, c.x));
        float beta = sqrt(0.5 / (r - 1.0));
        float gam = 1.0 / sqrt(1.0 - beta * beta);
        g = sqrt(1.0 - 1.0 / r) / (gam * (1.0 - beta * dot(tang, -dir)));
    }
    // The winding would shear any texture to mush, so two copies half a
    // period apart cross-fade, each restarting while the other is in full view.
    const float P = 36.0;
    float t1 = mod(uTime, P), t2 = mod(uTime + 0.5 * P, P);
    float w = 1.0 - abs(1.0 - 2.0 * t1 / P);
    float n = mix(streaks(c, r, t2 + 50.0), streaks(c, r, t1), w);
    n = smoothstep(0.2, 0.8, n);
    float T = 4300.0 * pow(max(flux, 1e-4), 0.25) * g;
    float I = pow(flux, 0.7) * g * g * g * g;
    float dens = (0.45 + 0.55 * n) * smoothstep(0.0, 0.05, x) * smoothstep(1.0, 0.55, x);
    return vec4(blackbody(T) * I * (0.3 + 1.0 * n) * 1.5, clamp(dens * 1.25, 0.0, 0.96));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    uv *= max(1.0, 0.8 * uRes.y / uRes.x);        // an upright phone: keep the whole disc in frame
    uv += uShift;
    vec3 p = uCam;
    vec3 v = normalize(uBasis * vec3(uv * 0.95, 1.0));
    vec3 hv = cross(p, v);
    float h2 = dot(hv, hv) * uLens;
    float rEsc = max(length(uCam) * 1.05, ROUT + 3.0);

    vec3 col = vec3(0.0);
    float trans = 1.0;
    bool escaped = false;
    for (int i = 0; i < STEPS; i++) {
        float r2 = dot(p, p), r = sqrt(r2);
        if (r < 1.0) break;
        if (r > rEsc && dot(p, v) > 0.0) { escaped = true; break; }
        float dt = max(0.025, 0.065 * r);
        vec3 a = -1.5 * h2 * p / (r2 * r2 * r);
        vec3 pn = p + v * dt + 0.5 * a * dt * dt;
        float n2 = dot(pn, pn);
        vec3 an = -1.5 * h2 * pn / (n2 * n2 * sqrt(n2));
        vec3 vn = v + 0.5 * (a + an) * dt;
        if (uDisc > 0.5 && p.y * pn.y < 0.0) {
            float f = p.y / (p.y - pn.y);
            vec3 c = mix(p, pn, f);
            float rc = length(c);
            if (rc > RIN && rc < ROUT) {
                vec4 d = disc(c, normalize(mix(v, vn, f)));
                col += trans * d.rgb * d.a;
                trans *= 1.0 - d.a;
            }
        }
        p = pn; v = vn;
        if (trans < 0.01) break;
    }
    if (escaped) col += trans * sky(normalize(v));

    // Roll off the highlights on brightness, not per channel, so the hot
    // side of the disc stays orange-white instead of clipping to paper.
    float lum = max(dot(col, vec3(0.3, 0.55, 0.15)), 1e-4);
    float mapped = 1.0 - exp(-lum * 1.1);
    col = col * (mapped / lum);
    col = mix(col, vec3(mapped), smoothstep(0.75, 1.0, mapped) * 0.6);
    col = pow(col, vec3(1.0 / 2.2));
    col += (hash13(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;   // dither the gradients
    outCol = vec4(col, 1.0);
}`;

// ── State ──
const view = { az: 0.6, el: 0.14, dist: 26, time: 0 };
const opts = { lens: true, disc: true, doppler: true, grid: false, spin: true };
let scale = 0.7, frameMs = 16, needsDraw = true, lockScale = false;

// ── WebGL plumbing ──
let prog, uni = {};
function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
}
function initGL() {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uCam', 'uBasis', 'uTime', 'uLens', 'uDisc', 'uDoppler', 'uGrid', 'uShift']) uni[n] = gl.getUniformLocation(prog, n);
}

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr * scale));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}

function camera() {
    const ce = Math.cos(view.el), se = Math.sin(view.el);
    const pos = [view.dist * ce * Math.cos(view.az), view.dist * se, view.dist * ce * Math.sin(view.az)];
    const fwd = pos.map(c => -c / view.dist);
    let right = [fwd[2], 0, -fwd[0]];            // forward × world-up, up to sign
    const rl = Math.hypot(right[0], right[2]) || 1;
    right = [-right[0] / rl, 0, -right[2] / rl];
    const up = [
        right[1] * fwd[2] - right[2] * fwd[1],
        right[2] * fwd[0] - right[0] * fwd[2],
        right[0] * fwd[1] - right[1] * fwd[0],
    ];
    // Tilt the horizon a few degrees: a dead-level disc looks like a diagram.
    const roll = 0.12, cr = Math.cos(roll), sr = Math.sin(roll);
    const r2 = right.map((c, i) => c * cr + up[i] * sr);
    const u2 = up.map((c, i) => c * cr - right[i] * sr);
    return { pos, basis: [...r2, ...u2, ...fwd] };
}

function draw() {
    resize();
    const cam = camera();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uni.uRes, canvas.width, canvas.height);
    gl.uniform3fv(uni.uCam, cam.pos);
    gl.uniformMatrix3fv(uni.uBasis, false, cam.basis);
    gl.uniform1f(uni.uTime, view.time);
    gl.uniform1f(uni.uLens, opts.lens ? 1 : 0);
    gl.uniform1f(uni.uDisc, opts.disc ? 1 : 0);
    gl.uniform1f(uni.uDoppler, opts.doppler ? 1 : 0);
    gl.uniform1f(uni.uGrid, opts.grid ? 1 : 0);
    // The panel covers the right of a wide screen and the bottom of a phone:
    // centre the hole in what is left.
    const bare = document.body.classList.contains('bare'), wide = innerWidth > 760;
    gl.uniform2f(uni.uShift, wide && !bare ? 0.1 * Math.min(innerWidth, 1400) / innerHeight : 0, !wide && !bare ? -0.42 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// The shader costs the same per pixel whatever the machine, so the pixel
// count is what gives: hold about 40 fps by trading resolution.
let last = 0, slowFor = 0, fastFor = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    const moving = !reduced && (opts.disc || opts.spin);
    if (!moving && !needsDraw) return;
    needsDraw = false;
    if (!reduced) {
        view.time += dt * 5;
        if (opts.spin && !drag) view.az += dt * 0.035;
    }
    draw();
    frameMs += (dt * 1000 - frameMs) * 0.1;
    if (frameMs > 30) { slowFor++; fastFor = 0; } else if (frameMs < 19) { fastFor++; slowFor = 0; } else { slowFor = fastFor = 0; }
    if (lockScale) return;
    if (slowFor > 12 && scale > 0.3) { scale = Math.max(0.3, scale * 0.82); slowFor = 0; }
    if (fastFor > 90 && scale < 1) { scale = Math.min(1, scale * 1.12); fastFor = 0; }
}

// ── Orbiting ──
let drag = null;
const pointers = new Map();
canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    drag = { x: e.clientX, y: e.clientY, pinch: 0 };
    canvas.classList.add('dragging');
    $('hint').style.opacity = 0;
});
canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (drag.pinch) zoom(drag.pinch / d);
        drag.pinch = d;
        return;
    }
    view.az -= (e.clientX - drag.x) * 0.006;
    view.el = Math.max(-1.45, Math.min(1.45, view.el + (e.clientY - drag.y) * 0.005));
    drag.x = e.clientX; drag.y = e.clientY;
    needsDraw = true; readouts();
});
const release = (e) => {
    pointers.delete(e.pointerId);
    if (!pointers.size) { drag = null; canvas.classList.remove('dragging'); } else if (drag) {
        const [p] = [...pointers.values()];
        drag = { x: p[0], y: p[1], pinch: 0 };
    }
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0012)); $('hint').style.opacity = 0; }, { passive: false });
function zoom(f) {
    view.dist = Math.max(4.5, Math.min(70, view.dist * f));
    needsDraw = true; readouts();
}
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = { ArrowLeft: [0.08, 0], ArrowRight: [-0.08, 0], ArrowUp: [0, 0.06], ArrowDown: [0, -0.06] }[e.key];
    if (k) { view.az += k[0]; view.el = Math.max(-1.45, Math.min(1.45, view.el + k[1])); needsDraw = true; e.preventDefault(); }
    if (e.key === '+' || e.key === '=') zoom(0.9);
    if (e.key === '-') zoom(1.1);
});

// ── Panel ──
for (const [id, key] of [['t-lens', 'lens'], ['t-disc', 'disc'], ['t-doppler', 'doppler'], ['t-grid', 'grid'], ['t-spin', 'spin']]) {
    $(id).addEventListener('change', (e) => { opts[key] = e.target.checked; needsDraw = true; });
}
$('btn-bare').addEventListener('click', (e) => {
    const on = document.body.classList.toggle('bare');
    e.currentTarget.setAttribute('aria-pressed', !on);
    needsDraw = true;
});
$('btn-rays').addEventListener('click', (e) => {
    const on = document.body.classList.toggle('show-rays');
    e.currentTarget.setAttribute('aria-pressed', on);
    if (on) drawRays();
});

const PRESETS = [
    ['The Sun, if it were one', 1],
    ['Cygnus X-1', 21.2],
    ['Sagittarius A*', 4.3e6],
    ['M87*', 6.5e9],
    ['TON 618', 4e10],
];
const massInput = $('mass');
function massName(m) {
    if (m < 1e3) return +m.toPrecision(3) + '';
    if (m < 1e6) return +(m / 1e3).toPrecision(3) + ' thousand';
    if (m < 1e9) return +(m / 1e6).toPrecision(3) + ' million';
    return +(m / 1e9).toPrecision(3) + ' billion';
}
function readouts() {
    const suns = Math.pow(10, +massInput.value);
    const rs = G.rsKm(suns);
    $('mass-label').innerHTML = massName(suns) + ' <small>times the Sun</small>';
    $('o-horizon').textContent = G.fmtLength(2 * rs);
    $('o-shadow').textContent = G.fmtLength(G.shadowDiameter() * rs);
    $('o-lap').textContent = G.fmtTime(G.orbitPeriod(G.R_ISCO) * G.rsSeconds(suns));
    const hk = G.hawkingKelvin(suns);
    $('o-hawking').textContent = hk.toExponential(1).replace('e', ' × 10^').replace('^-', '⁻').replace(/\d+$/, d => [...d].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')) + ' K';
    $('o-dist').textContent = G.fmtLength(view.dist * rs);
    $('o-clock').textContent = (G.clockRate(view.dist) * 100).toFixed(1) + '%';
    for (const b of $('presets').children) b.setAttribute('aria-pressed', Math.abs(Math.log10(+b.dataset.m) - +massInput.value) < 0.006);
}
for (const [name, m] of PRESETS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = name; b.dataset.m = m;
    b.addEventListener('click', () => { massInput.value = Math.log10(m); readouts(); });
    $('presets').appendChild(b);
}
massInput.addEventListener('input', readouts);

// ── Light paths, from above ──
const rc = $('rays'), rx = rc.getContext('2d');
let aimB = 3.4;
const FAN = [];
for (let b = -9; b <= 9.01; b += 0.75) FAN.push(G.trace(b, { start: 16, step: 0.03 }));
const VIEW_W = 30;                                // world units across the canvas
const toPx = (x, y) => [rc.width / 2 + x * rc.width / VIEW_W, rc.height / 2 - y * rc.width / VIEW_W];
function path(points) {
    rx.beginPath();
    points.forEach((p, i) => { const q = toPx(p[0], p[1]); i ? rx.lineTo(q[0], q[1]) : rx.moveTo(q[0], q[1]); });
    rx.stroke();
}
function ring(r, style, dash, fill) {
    const [cx, cy] = toPx(0, 0);
    rx.beginPath(); rx.arc(cx, cy, r * rc.width / VIEW_W, 0, 7);
    rx.setLineDash(dash || []);
    if (fill) { rx.fillStyle = fill; rx.fill(); }
    if (style) { rx.strokeStyle = style; rx.lineWidth = 1.5; rx.stroke(); }
    rx.setLineDash([]);
}
function drawRays() {
    rx.clearRect(0, 0, rc.width, rc.height);
    rx.lineWidth = 1.2; rx.lineJoin = 'round';
    for (const t of FAN) { rx.strokeStyle = t.captured ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.26)'; path(t.points); }
    ring(G.R_ISCO, 'rgba(148,163,184,0.35)', [2, 5]);
    ring(G.R_PHOTON, '#64748b', [5, 4]);
    ring(G.R_HORIZON, 'rgba(255,255,255,0.25)', null, '#000');
    const t = G.trace(aimB, { start: 16, step: 0.01 });
    rx.lineWidth = 3; rx.strokeStyle = t.captured ? '#f87171' : '#fbbf24';
    rx.shadowColor = rx.strokeStyle; rx.shadowBlur = 10;
    path(t.points);
    rx.shadowBlur = 0;
    const [hx, hy] = toPx(-VIEW_W / 2 + 0.9, aimB);
    rx.fillStyle = rx.strokeStyle; rx.beginPath(); rx.arc(hx, hy, 7, 0, 7); rx.fill();

    const off = Math.abs(aimB).toFixed(2);
    const deg = t.deflection * 180 / Math.PI;
    let say;
    if (t.captured) {
        say = `Aimed <b>${off}</b> radii off centre: <b class="caught">caught</b>${deg > 200 ? ', after circling the hole' : ''}. Anything inside <b>2.60</b> is, which is why the shadow is 2.6 times the hole.`;
    } else if (deg > 360) {
        say = `Aimed <b>${off}</b> radii off centre: it loops <b class="free">${(deg / 360).toFixed(1)} times</b> round the photon sphere and gets away.`;
    } else {
        say = `Aimed <b>${off}</b> radii off centre: <b class="free">escapes</b>, bent by <b>${deg.toFixed(deg < 10 ? 1 : 0)}°</b>${deg > 170 && deg < 190 ? ', straight back where it came from' : ''}.`;
    }
    $('ray-say').innerHTML = say;
}
function aim(e) {
    const r = rc.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height * rc.height;
    aimB = Math.max(-9, Math.min(9, (rc.height / 2 - y) * VIEW_W / rc.width));
    // Make the critical aim findable: within a hair of it, land on the knife edge.
    for (const s of [1, -1]) if (Math.abs(aimB - s * G.B_CRIT) < 0.06) aimB = s * (G.B_CRIT + 0.004);
    drawRays();
}
rc.addEventListener('pointerdown', (e) => { rc.setPointerCapture(e.pointerId); aim(e); });
rc.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') aim(e); });

// ── Go ──
if (!gl) {
    $('nogl').style.display = 'grid';
} else {
    try {
        initGL();
        const q = new URLSearchParams(location.search);
        if (q.has('still')) { opts.spin = false; $('t-spin').checked = false; }
        if (q.has('az')) view.az = +q.get('az');
        if (q.has('el')) view.el = +q.get('el');
        if (q.has('dist')) view.dist = +q.get('dist');
        if (q.has('scale')) { scale = +q.get('scale'); lockScale = true; }
        requestAnimationFrame(frame);
    } catch (err) {
        console.error(err);
        $('nogl').style.display = 'grid';
        $('nogl').textContent = 'The shader did not compile on this device: ' + err.message;
    }
}
readouts();
drawRays();
window.addEventListener('resize', () => { needsDraw = true; });
