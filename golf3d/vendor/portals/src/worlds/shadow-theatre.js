// THE LAMP-LIT CARAVAN: a cut-paper shadow theatre half a kilometre deep.
//
// Depth runs along -Z: the audience (and the opening shots) are at +Z, the backlit paper screen
// with its lamp-sun stands at z = -520, and fourteen flats of card stand between them. Everything
// is unlit: faces turned to the audience are ink silhouettes tinted paler and bluer per layer,
// faces turned to the lamp are warm cream card, cut edges carry a warm rim, and pierced
// openings are backed with glowing gels. Big flats are extruded height profiles (one mesh), lacy
// things and jointed puppets are instanced quads cut from one canvas atlas (one mesh), the palace
// is the hero part. The flight: the whole picture from the stalls, a lateral tracking shot past
// the procession, a slip between the first sheets, a left turn to face the lamp, then straight
// in through the palm arch, under the lead elephant, a tent door, a dune notch, the city gate and
// a street arch to the Filigree Palace, whose flats part to uncover the gate that holds the portal.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/shadow-theatre.js';

const TAU = Math.PI * 2;
const AX = 261;                       // x of the palace axis and of the lamp-sun
const SCREEN_Z = -520, LAMP_Y = 45;

// [cream, amber(rim), vermilion, magenta, teal, ink, gel accent]
const SHOWS = {
  evening: { pal: ['#FBE2A0', '#F2A541', '#D9512C', '#8E2A5A', '#1E4C6B', '#0A0608', '#6FE3D0'], core: 3.3, stars: 0.35, portal: '#ffe6a8',
    grade: { tint: '#fff3e0', shadowTint: '#12060c' }, title: 'The Lamp-Lit Caravan' },
  night: { pal: ['#E4F0EC', '#4F93BE', '#2C63A8', '#3A2A7C', '#141C4A', '#04050B', '#FFC46B'], core: 3.0, stars: 0.62, c1: '#6FB7D6', teal: '#2C4C92', portal: '#d8f0ff',
    grade: { tint: '#eaf4ff', shadowTint: '#05061a' }, title: 'The Lamp-Lit Caravan: Night Show' },
  dawn: { pal: ['#FFF0D2', '#F9B49A', '#EC6F8E', '#A05CA8', '#44609C', '#0C070E', '#7FE8C8'], core: 3.0, stars: 0.15, portal: '#fff0e0',
    grade: { tint: '#fff0ee', shadowTint: '#140816' }, title: 'The Lamp-Lit Caravan: Dawn Show' },
};

// ---------- shared GLSL ----------
const COMMON = /* glsl */`
uniform float uTime, uFlick, uGlow;
uniform vec3 uInk, uAmber, uTeal, uCream;
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fibre(vec2 w) { return vnoise(w * vec2(0.9, 5.0)) * 0.6 + vnoise(w * vec2(7.0, 1.3) + 9.0) * 0.4; }
vec3 inkFor(float lay, float fib) {
  vec3 tintTo = mix(uAmber * 0.55, uTeal * 1.25, smoothstep(0.5, 5.0, lay));
  return mix(uInk, tintTo, clamp(0.06 + 0.07 * lay, 0.0, 0.6)) * (0.8 + 0.4 * fib);
}
vec3 cardFor(vec2 w, float fib) {
  vec3 card = uCream * (0.5 + 0.16 * fib);
  vec2 pg = abs(fract(w / 2.5) - 0.5) * 2.5;
  card *= 1.0 - 0.1 * (1.0 - smoothstep(0.0, 0.09, min(pg.x, pg.y)));
  vec2 tc = floor(w / vec2(7.0, 5.0)); vec2 tp = fract(w / vec2(7.0, 5.0)) - 0.5;
  float tape = step(0.75, h21(tc)) * step(abs(tp.x + tp.y * 0.3), 0.16) * step(abs(tp.y), 0.07);
  card = mix(card, uCream * 0.82, tape);
  return card * (0.74 + 0.36 * smoothstep(-10.0, 120.0, w.y));
}`;

const LAMP_GLSL = /* glsl */`
uniform vec3 uC0, uC1, uC2, uC3, uC4; uniform float uCore;
vec3 lampCol(vec2 p) {
  float r = length(p * vec2(1.0, p.y > 0.0 ? 1.45 : 1.0));
  vec3 c = mix(uC0 * uCore, uC0 * 1.35, smoothstep(26.0, 46.0, r));
  c = mix(c, uC1 * 1.0, smoothstep(40.0, 150.0, r));
  c = mix(c, uC2 * 0.62, smoothstep(120.0, 330.0, r));
  c = mix(c, uC3 * 0.4, smoothstep(260.0, 520.0, r));
  c = mix(c, uC4 * 0.3, smoothstep(430.0, 800.0, r));
  return c;
}`;

// ---------- canvas atlas of cut-outs ----------
const poly = (g, pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); };
const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
const line = (g, x0, y0, x1, y1, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const cut = (g, fn) => { g.globalCompositeOperation = 'destination-out'; fn(); g.globalCompositeOperation = 'source-over'; };
const gelc = (g, c, fn) => { const f = g.fillStyle, s = g.strokeStyle; g.fillStyle = c; g.strokeStyle = c; fn(); g.fillStyle = f; g.strokeStyle = s; };
function star(g, x, y, r, n = 8, k = 0.5) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU, rr = i % 2 ? r * k : r; g.lineTo(x + Math.sin(a) * rr, y + Math.cos(a) * rr); }
  g.closePath(); g.fill();
}
// tapered limb hanging from the pivot (0,0) down to (0,-len), with a brass pin at the pivot
function limb(g, len, w0, w1, pin) {
  g.beginPath(); g.arc(0, 0, w0 / 2, 0, Math.PI); g.lineTo(-w1 / 2, -len); g.arc(0, -len, w1 / 2, Math.PI, TAU); g.closePath(); g.fill();
  if (pin) gelc(g, pin, () => ell(g, 0, 0, Math.min(0.17, w0 * 0.15), Math.min(0.17, w0 * 0.15)));
}
function onion(g, x, y, R, h) {      // onion dome sitting on (x, y), bulge radius R, height h, with a finial
  g.beginPath(); g.moveTo(x - R * 0.72, y);
  g.bezierCurveTo(x - R * 1.45, y + h * 0.3, x - R * 0.75, y + h * 0.72, x, y + h);
  g.bezierCurveTo(x + R * 0.75, y + h * 0.72, x + R * 1.45, y + h * 0.3, x + R * 0.72, y); g.closePath(); g.fill();
  line(g, x, y + h - 0.2, x, y + h + R * 0.7, Math.max(0.25, R * 0.07)); ell(g, x, y + h + R * 0.35, R * 0.13, R * 0.13);
}

function makeAtlas(rng, G, season) {
  const W = 4096, H = 2048, Q = 1.5, PAD = 12;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  const S = {}; let cx = PAD, cy = PAD, rowH = 0;
  const def = (name, x0, y0, x1, y1, ppm, draw) => {
    ppm *= Q; const w = Math.ceil((x1 - x0) * ppm), h = Math.ceil((y1 - y0) * ppm);
    if (cx + w + PAD > W) { cx = PAD; cy += rowH + PAD; rowH = 0; }
    rowH = Math.max(rowH, h);
    g.save(); g.beginPath(); g.rect(cx, cy, w, h); g.clip();
    g.translate(cx - x0 * ppm, cy + y1 * ppm); g.scale(ppm, -ppm);
    g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineCap = 'round'; g.lineJoin = 'round';
    draw(g); g.restore();
    S[name] = { uv: [cx / W, 1 - (cy + h) / H, w / W, h / H], b: [x0, y0, x1 - x0, y1 - y0] };
    cx += w + PAD;
  };
  const r = rng;

  // --- flora ---
  def('frond', -0.4, -3.4, 9.6, 1.9, 26, (g) => {
    const rib = (t) => [9 * t, 1.5 * Math.sin(Math.PI * t * 0.85) - 2.6 * t * t];
    g.lineWidth = 0.2; g.beginPath(); for (let i = 0; i <= 20; i++) { const p = rib(i / 20); g.lineTo(p[0], p[1]); } g.stroke();
    for (let i = 1; i <= 26; i++) {
      const t = i / 26, p = rib(t), l = 2.5 * Math.pow(Math.sin(Math.PI * (0.08 + 0.9 * t)), 0.6);
      poly(g, [[p[0] - 0.13, p[1]], [p[0] + 0.13, p[1]], [p[0] + 0.55 + 0.5 * t, p[1] - l]]);
      poly(g, [[p[0] - 0.12, p[1]], [p[0] + 0.12, p[1]], [p[0] + 0.5 + 0.4 * t, p[1] + l * 0.42]]);
    }
  });
  def('trunk', -0.9, 0, 0.9, 20, 20, (g) => {
    poly(g, [[-0.62, 0], [0.62, 0], [0.36, 20], [-0.36, 20]]);
    cut(g, () => { for (let y = 1.2; y < 19.4; y += 1.15) poly(g, [[-0.7, y], [0.12, y + 0.1], [0.12, y + 0.24], [-0.7, y + 0.3]]); });
    ell(g, 0, 19.6, 0.75, 0.6);
    gelc(g, G.a, () => { ell(g, -0.5, 18.6, 0.24, 0.3); ell(g, 0.45, 18.3, 0.24, 0.3); ell(g, 0, 18.0, 0.22, 0.28); });
  });
  def('reed', -2.9, 0, 2.9, 14, 22, (g) => {
    g.lineWidth = 0.2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(0.5, 6, 0, 11); g.stroke();
    for (let i = 0; i < 13; i++) {
      const a = -1.25 + (2.5 * i) / 12, l = 2.6 - 0.7 * Math.abs(a);
      line(g, 0, 11, Math.sin(a) * l, 11 + Math.cos(a) * l, 0.09); ell(g, Math.sin(a) * l, 11 + Math.cos(a) * l, 0.15, 0.15);
    }
    g.lineWidth = 0.16; g.beginPath(); g.moveTo(0.1, 0); g.quadraticCurveTo(1.0, 4, 2.6, 5.4); g.stroke();
  });
  def('cattail', -2.6, 0, 2.6, 12, 22, (g) => {
    line(g, 0, 0, 0.15, 10.6, 0.16); ell(g, 0.12, 9.2, 0.3, 1.2);
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(-0.22 * s, 0); g.quadraticCurveTo(0.5 * s, 6, 2.4 * s, 8.6); g.quadraticCurveTo(0.9 * s, 5.4, 0.22 * s, 0); g.fill(); }
    g.beginPath(); g.moveTo(-0.15, 0); g.quadraticCurveTo(-0.9, 5, -0.5, 11.4); g.quadraticCurveTo(-0.3, 5, 0.2, 0); g.fill();
  });
  def('tuft', -3, 0, 3, 6.4, 22, (g) => {
    for (let i = 0; i < 11; i++) { const a = -1 + i * 0.2 + r.range(-0.06, 0.06), l = r.range(3.4, 6); g.beginPath(); g.moveTo(-0.2 + i * 0.03, 0); g.quadraticCurveTo(Math.sin(a) * l * 0.3, l * 0.6, Math.sin(a) * l * 0.5, Math.cos(a * 0.5) * l); g.quadraticCurveTo(Math.sin(a) * l * 0.36, l * 0.5, 0.25 + i * 0.03, 0); g.fill(); }
  });
  def('cypress', -1.9, 0, 1.9, 16, 16, (g) => {
    g.beginPath(); g.moveTo(-0.3, 0); g.lineTo(-0.3, 1.6); g.bezierCurveTo(-2.3, 5, -1.1, 12, 0, 16); g.bezierCurveTo(1.1, 12, 2.3, 5, 0.3, 1.6); g.lineTo(0.3, 0); g.closePath(); g.fill();
    cut(g, () => { for (let i = 0; i < 9; i++) { const y = 3 + i * 1.25, s = i % 2 ? 1 : -1; poly(g, [[s * 0.25, y], [s * 1.1, y + 0.75], [s * 0.3, y + 0.32]]); } });
  });
  def('acacia', -9.5, 0, 9.5, 14.5, 15, (g) => {
    g.lineWidth = 0.55; for (const [x, y] of [[-4.6, 9.4], [3.6, 9.8], [0, 10.4], [-1.9, 10], [6.4, 9.6]]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(x * 0.15, 5, x, y); g.stroke(); }
    poly(g, [[-0.65, 0], [0.65, 0], [0.3, 5], [-0.3, 5]]);
    g.beginPath(); g.moveTo(-9, 9.6);
    g.bezierCurveTo(-8.4, 12.4, -3, 14, 0.5, 13.9); g.bezierCurveTo(4.6, 14, 9, 12.6, 9.1, 10.2);
    for (let i = 0; i < 9; i++) { const x = 9.1 - (i + 1) * 2.01; g.quadraticCurveTo(x + 1, 8.3 + (i % 2) * 0.5, x, 9.7 + (i % 3) * 0.2); }
    g.closePath(); g.fill();
    cut(g, () => {
      for (let i = 0; i < 150; i++) {
        const x = r.range(-8, 8), y = r.range(9.9, 13.2);
        if ((x * x) / 78 + ((y - 9.5) * (y - 9.5)) / 17 < 1) ell(g, x, y, r.range(0.14, 0.36), r.range(0.08, 0.16), r.range(-0.5, 0.5));
      }
    });
  });
  def('tree', -9.5, 0, 9.5, 19, 15, (g) => {
    const tips = [];
    const br = (x, y, a, l, w, d) => {
      const x2 = x + Math.sin(a) * l, y2 = y + Math.cos(a) * l; line(g, x, y, x2, y2, w);
      if (d <= 0 || l < 1.0) { tips.push([x2, y2]); return; }
      br(x2, y2, a - r.range(0.3, 0.6), l * r.range(0.68, 0.8), w * 0.68, d - 1);
      br(x2, y2, a + r.range(0.3, 0.6), l * r.range(0.68, 0.8), w * 0.68, d - 1);
      if (d > 2 && r.chance(0.5)) br(x2, y2, a + r.range(-0.15, 0.15), l * 0.7, w * 0.6, d - 2);
    };
    br(0, 0, 0.05, 5.4, 0.95, 5);
    if (season === 1) for (const t of tips) { ell(g, t[0], t[1], 0.4, 0.4); gelc(g, G.r, () => star(g, t[0], t[1], 0.3, 5, 0.45)); if (r.chance(0.6)) { const q = [t[0] + r.range(-0.9, 0.9), t[1] + r.range(-0.9, 0.5)]; ell(g, q[0], q[1], 0.3, 0.3); gelc(g, r.chance(0.3) ? G.c : G.r, () => ell(g, q[0], q[1], 0.17, 0.17)); } }
  });
  def('rose', -3.2, 0, 3.2, 5.2, 24, (g) => {
    g.lineWidth = 0.14;
    for (let i = 0; i < 9; i++) {
      const x = -2.4 + i * 0.6 + r.range(-0.15, 0.15), y = 1.5 + 2.6 * Math.sin(Math.PI * (i + 0.5) / 9) + r.range(-0.3, 0.3);
      g.beginPath(); g.moveTo(x * 0.25, 0); g.quadraticCurveTo(x * 0.5, y * 0.7, x, y); g.stroke();
      g.beginPath(); g.arc(x, y, 0.62, 0, TAU * 0.8); g.stroke(); ell(g, x - 0.5, y - 0.9, 0.34, 0.15, 0.6);
      gelc(g, G.r, () => ell(g, x, y, 0.38, 0.38));
    }
  });
  buildAtlasPuppets(def, r, G);
  buildAtlasBuilt(def, r, G);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  return { tex, S };
}

function buildAtlasPuppets(def, r, G) {
  // --- elephant (lead scale: 11 m of leg, body centre 13.2 m above the road) ---
  def('ebody', -9.6, -5, 8.6, 5.6, 22, (g) => {
    g.beginPath(); g.moveTo(-8.6, -1.5);
    g.bezierCurveTo(-9.4, 2.5, -7, 4.6, -3.5, 4.7); g.bezierCurveTo(0, 4.9, 3, 5.2, 5.5, 4.4);
    g.bezierCurveTo(7.6, 3.6, 8.2, 1.0, 7.8, -1.5); g.bezierCurveTo(7.4, -3.6, 4, -4.3, 0, -4.1);
    g.bezierCurveTo(-4, -3.9, -7.6, -4.2, -8.6, -1.5); g.closePath(); g.fill();
    for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) {
      const x = -3.3 + i * 0.9 + (j % 2) * 0.45, y = -1.3 + j * 0.95;
      gelc(g, (i + j) % 3 === 0 ? G.a : (i + j) % 3 === 1 ? G.t : G.r, () => star(g, x, y, 0.3, 4, 0.42));
    }
    cut(g, () => { for (let i = 0; i < 9; i++) poly(g, [[-3.6 + i * 0.85, -2.1], [-3.2 + i * 0.85, -2.75], [-2.8 + i * 0.85, -2.1]]); });
    gelc(g, G.a, () => { ell(g, 5.8, -2.2, 0.26, 0.26); ell(g, -6, -2.2, 0.26, 0.26); });
  });
  def('ehead', -2.2, -5.2, 6.4, 4.2, 22, (g) => {
    ell(g, 2.2, 0.6, 3.0, 3.1); ell(g, 2.6, 2.4, 1.9, 1.4);
    poly(g, [[3.6, -0.3], [5.4, -1.0], [5.0, -3.3], [3.1, -2.7]]);
    poly(g, [[2.6, -1.8], [3.6, -2.2], [5.0, -3.6], [6.1, -3.3], [5.2, -4.7], [3.4, -3.6]]);
    cut(g, () => { ell(g, 3.5, 0.9, 0.34, 0.2); });
    gelc(g, G.t, () => star(g, 2.4, 2.4, 0.55, 8, 0.5)); gelc(g, G.a, () => { ell(g, 0.5, 0, 0.26, 0.26); ell(g, 3.3, 2.0, 0.16, 0.16); ell(g, 1.5, 2.2, 0.16, 0.16); });
  });
  def('eear', -3.8, -5.8, 1.6, 1.0, 22, (g) => {
    g.beginPath(); g.moveTo(0.8, 0.4); g.bezierCurveTo(-1.5, 1.2, -3.6, 0, -3.3, -2.4); g.bezierCurveTo(-3.2, -4.4, -1.6, -5.6, -0.4, -5.2); g.bezierCurveTo(0.6, -4, 1.2, -2, 0.8, 0.4); g.fill();
    cut(g, () => { for (let i = 0; i < 7; i++) { const a = 2.4 + i * 0.36; ell(g, -1.1 + Math.cos(a) * 1.75, -2.5 - Math.sin(a) * 2.2 + 1.0, 0.2, 0.2); } });
    gelc(g, G.a, () => ell(g, 0, 0, 0.24, 0.24));
  });
  def('eseg', -1, -3.8, 1, 1, 22, (g) => { limb(g, 3.0, 1.5, 1.1, null); cut(g, () => { for (let i = 0; i < 3; i++) poly(g, [[-0.9, -0.8 - i * 0.8], [0.2, -0.9 - i * 0.8], [-0.9, -1.0 - i * 0.8]]); }); });
  def('eleg1', -1.9, -7, 1.9, 1.9, 22, (g) => limb(g, 5.4, 3.2, 2.5, G.a));
  def('eleg2', -1.9, -6, 2.1, 1.5, 22, (g) => {
    limb(g, 4.4, 2.4, 2.6, G.a); poly(g, [[-1.4, -4.2], [1.4, -4.2], [1.8, -5.7], [-1.5, -5.7]]);
    cut(g, () => { for (let i = 0; i < 3; i++) ell(g, 0.2 + i * 0.55, -5.55, 0.2, 0.26); });
  });
  def('etail', -0.8, -5.3, 0.8, 0.5, 22, (g) => { limb(g, 4, 0.42, 0.2, null); poly(g, [[-0.1, -3.8], [0.1, -3.8], [0.6, -5.2], [0, -4.8], [-0.6, -5.2]]); });
  def('howdah', -3.5, -0.4, 3.5, 6.6, 22, (g) => {
    poly(g, [[-3.2, 0], [3.2, 0], [2.8, 0.7], [-2.8, 0.7]]);
    line(g, -2.4, 0.7, -2.4, 3.2, 0.24); line(g, 2.4, 0.7, 2.4, 3.2, 0.24); line(g, 0, 3.2, 0, 2.7, 0.1);
    poly(g, [[-3, 3.2], [3, 3.2], [2.4, 3.8], [-2.4, 3.8]]); onion(g, 0, 3.8, 1.9, 1.9);
    ell(g, 0, 1.85, 0.9, 1.05); gelc(g, G.r, () => ell(g, 0, 1.85, 0.72, 0.88));
    gelc(g, G.t, () => { star(g, 0, 4.5, 0.45, 8, 0.5); for (let i = 0; i < 6; i++) ell(g, -2.5 + i, 3.5, 0.14, 0.14); });
    gelc(g, G.a, () => { for (let i = 0; i < 7; i++) ell(g, -2.4 + i * 0.8, 0.34, 0.13, 0.13); });
  });
  // --- gazelle, leopard, fish, birds ---
  def('gbody', -2.7, -1.2, 3.5, 3.8, 34, (g) => {
    ell(g, 0, 0, 2.0, 0.72, -0.06); poly(g, [[1.2, 0.3], [2.0, -0.2], [2.7, 1.8], [2.2, 2.05]]); ell(g, 2.7, 2.0, 0.62, 0.32, -0.3);
    poly(g, [[-1.9, 0.3], [-2.5, 0.8], [-1.8, 0.6]]); poly(g, [[2.2, 2.2], [1.9, 2.75], [2.45, 2.3]]);
    g.lineWidth = 0.09; for (const k of [0, 0.25]) { g.beginPath(); g.moveTo(2.45 + k, 2.25); g.quadraticCurveTo(2.0 + k, 3.1, 2.55 + k, 3.65); g.stroke(); }
    cut(g, () => ell(g, 2.85, 2.08, 0.07, 0.07)); gelc(g, G.a, () => { ell(g, -1.4, -0.25, 0.1, 0.1); ell(g, 1.3, -0.25, 0.1, 0.1); });
  });
  def('gleg', -0.35, -2.3, 0.35, 0.35, 34, (g) => { limb(g, 1.05, 0.36, 0.2, null); g.save(); g.translate(0, -1.0); g.rotate(-0.25); limb(g, 1.05, 0.2, 0.12, null); g.restore(); });
  def('lbody', -3.5, -1.3, 3.9, 1.9, 30, (g) => {
    ell(g, 0, 0, 2.7, 0.78); ell(g, 2.95, 0.55, 0.75, 0.6); poly(g, [[2.6, 1.0], [2.75, 1.55], [3.05, 1.1]]); poly(g, [[3.1, 1.05], [3.35, 1.5], [3.5, 0.95]]);
    cut(g, () => { for (let i = 0; i < 46; i++) { const x = r.range(-2.3, 2.3), y = r.range(-0.5, 0.5); if (x * x / 6 + y * y / 0.36 < 1) { g.beginPath(); g.arc(x, y, r.range(0.09, 0.15), 0, TAU * 0.8); g.lineWidth = 0.07; g.stroke(); } } ell(g, 3.2, 0.7, 0.08, 0.06); });
  });
  def('fish', -1.9, -1, 1.9, 1, 34, (g) => {
    ell(g, 0.2, 0, 1.25, 0.55); poly(g, [[-0.8, 0], [-1.75, 0.75], [-1.4, 0], [-1.75, -0.75]]); poly(g, [[0, 0.45], [0.5, 0.95], [0.7, 0.4]]);
    cut(g, () => { for (let j = 0; j < 3; j++) for (let i = 0; i < 5 - j; i++) ell(g, -0.5 + i * 0.3 + j * 0.1, 0.25 - j * 0.25, 0.09, 0.07); });
    gelc(g, G.t, () => ell(g, 1.0, 0.12, 0.11, 0.11));
  });
  def('wing', -0.15, -0.95, 2.7, 0.65, 34, (g) => { g.beginPath(); g.moveTo(0, 0.25); g.quadraticCurveTo(1.4, 0.62, 2.55, -0.75); g.quadraticCurveTo(1.3, -0.1, 0, -0.25); g.fill(); });
  def('bbody', -1.1, -0.45, 1.1, 0.45, 34, (g) => { ell(g, 0, 0, 0.3, 0.4); ell(g, 0, 0.32, 0.17, 0.17); poly(g, [[-0.12, -0.2], [-0.3, -0.45], [0, -0.3], [0.3, -0.45], [0.12, -0.2]]); });
  def('crane', -3.3, -0.7, 3.8, 0.8, 26, (g) => { ell(g, 0, 0, 1.3, 0.42); poly(g, [[1, 0.15], [3.1, 0.38], [3.7, 0.3], [3.1, 0.2], [1, -0.2]]); poly(g, [[-1, 0.1], [-3.2, -0.3], [-3.2, -0.42], [-1, -0.15]]); });
  def('rbody', -13.5, -5.2, 15, 6, 10, (g) => {
    ell(g, 0, 0, 8, 2.7); ell(g, 9.4, 1.7, 2.4, 1.8); poly(g, [[11.2, 2.4], [14.4, 1.2], [13.6, 0.1], [11.4, 0.6]]);
    for (let i = 0; i < 6; i++) { const a = -0.5 + i * 0.2; poly(g, [[-6.5, 0.6], [-6.5, -0.6], [-6.5 - Math.cos(a) * 6.8, Math.sin(a) * 6.8 - 0.5], [-6.5 - Math.cos(a) * 6.4, Math.sin(a) * 6.4 + 0.5]]); }
    for (const x of [1.5, 3.6]) { line(g, x, -2.2, x - 1.2, -4.2, 0.5); for (let i = 0; i < 3; i++) line(g, x - 1.2, -4.2, x - 2.2 + i * 0.8, -5, 0.2); }
    cut(g, () => { for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) ell(g, -4.5 + i * 1.1 + j * 0.5, 0.9 - j * 0.9, 0.34, 0.2, 0.4); });
    gelc(g, G.a, () => ell(g, 10.2, 2.1, 0.34, 0.34));
  });
  def('rwing', -1.6, -9, 23.5, 3, 10, (g) => {
    g.beginPath(); g.moveTo(-1, -1.4); g.quadraticCurveTo(8, 3.6, 22.5, 0.4); g.lineTo(21.5, -1.2); g.quadraticCurveTo(9, 0.6, 0, -2.4); g.closePath(); g.fill();
    for (let i = 0; i < 12; i++) {
      const t = i / 11, x = 1.5 + i * 1.75, y = 1.6 * Math.sin((x / 22) * Math.PI) - 1.3, L = 3.2 + 4.6 * t, a = -0.15 + 0.85 * t * t, dx = Math.sin(a), dy = -Math.cos(a);
      poly(g, [[x - 0.5, y], [x + 0.5, y], [x + 0.45 + dx * L * 0.75, y + dy * L * 0.75], [x + dx * L, y + dy * L], [x - 0.4 + dx * L * 0.7, y + dy * L * 0.7]]);
    }
  });
  def('hand', -8, -24, 74, 32, 3.2, (g) => {
    ell(g, 21, 4, 16, 11, 0.15); line(g, 2, -2, -4, -19, 13); line(g, 9, -4, -1, -15, 7.5);
    const F = [[0.52, 36], [0.24, 43], [-0.04, 41], [-0.32, 32]];
    F.forEach(([a, l], i) => line(g, 30 + i * 1.5, 10 - i * 5, 30 + Math.cos(a) * l, 10 - i * 5 + Math.sin(a) * l, 6.6 - i * 0.3));
  });
  def('head', -2.4, 0, 2.4, 5.4, 20, (g) => {
    g.beginPath(); g.moveTo(-2.3, 0); g.bezierCurveTo(-2.2, 1.9, -1, 2.1, -0.5, 2.3); g.lineTo(0.5, 2.3); g.bezierCurveTo(1, 2.1, 2.2, 1.9, 2.3, 0); g.closePath(); g.fill();
    ell(g, 0, 3.2, 0.95, 1.1); ell(g, 0, 4.2, 1.35, 0.85); ell(g, 0.5, 4.7, 0.7, 0.5);
  });
  def('carpet', -4.6, -2.3, 4.6, 4, 30, (g) => {
    g.beginPath(); for (let i = 0; i <= 32; i++) { const x = -4 + i * 0.25; g.lineTo(x, 0.24 * Math.sin(x * 1.6) + 0.17); } for (let i = 32; i >= 0; i--) { const x = -4 + i * 0.25; g.lineTo(x, 0.24 * Math.sin(x * 1.6) - 0.17); } g.fill();
    gelc(g, G.t, () => { for (let i = 0; i < 15; i++) { const x = -3.5 + i * 0.5; ell(g, x, 0.24 * Math.sin(x * 1.6), 0.11, 0.11); } });
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const y0 = 0.24 * Math.sin(s * 4 * 1.6); line(g, s * 4, y0, s * (4.25 + i * 0.1), y0 - 1.3 - i * 0.3, 0.07); ell(g, s * (4.25 + i * 0.1), y0 - 1.45 - i * 0.3, 0.15, 0.22); }
    ell(g, -0.3, 1.3, 0.8, 1.1); ell(g, -0.2, 2.75, 0.42, 0.46); ell(g, -0.2, 3.2, 0.62, 0.36); line(g, 0, 1.9, 1.3, 1.9, 0.22); line(g, 1.3, 1.9, 1.3, 1.5, 0.07);
    gelc(g, G.r, () => ell(g, 1.3, 1.15, 0.3, 0.38)); gelc(g, G.a, () => ell(g, -0.2, 3.25, 0.12, 0.12));
  });
}

function buildAtlasBuilt(def, r, G) {
  const win = (g, x, y, w, h, c) => gelc(g, c, () => { g.fillRect(x - w, y, w * 2, h); ell(g, x, y + h, w, w); });
  def('galleon', -34, -9, 34.5, 31, 11, (g) => {
    g.beginPath(); g.moveTo(-31, 7); g.lineTo(-27, 7); g.lineTo(-25, 2); g.lineTo(14, 2); g.lineTo(20, 4); g.lineTo(33.5, 7.6); g.lineTo(22, 1);
    g.bezierCurveTo(12, -7, -18, -8, -27, -3); g.lineTo(-31, 1); g.closePath(); g.fill();
    gelc(g, G.a, () => { for (let i = 0; i < 12; i++) ell(g, -21 + i * 3.2, -1.4, 0.6, 0.6); });
    gelc(g, G.r, () => { g.fillRect(-30, 3, 1.2, 2.4); g.fillRect(-28.2, 3, 1.2, 2.4); });
    cut(g, () => { for (let i = 0; i < 26; i++) star(g, -23 + i * 1.4, 0.75, 0.42, 4, 0.4); });
    [[-14, 28], [2, 30], [16, 24]].forEach(([m, h], k) => {
      line(g, m, 2, m, h, 0.6); line(g, m, h, 33, 7.6, 0.14); line(g, m, h, -31, 7, 0.14);
      const sail = (y0, y1, w) => {
        g.beginPath(); g.moveTo(m - w, y0); g.lineTo(m + w, y0); g.quadraticCurveTo(m + w + 3.2, (y0 + y1) / 2, m + w - 0.5, y1); g.lineTo(m - w + 0.5, y1); g.quadraticCurveTo(m - w + 2.4, (y0 + y1) / 2, m - w, y0); g.fill();
        cut(g, () => { for (let y = y0 + 1.4; y < y1 - 0.6; y += 1.5) for (let x = m - w + 2.6; x < m + w; x += 2.2) g.fillRect(x, y, 1.5, 0.16); });
        gelc(g, k === 1 ? G.t : G.a, () => star(g, m + 1.2, (y0 + y1) / 2, 1.3, 8, 0.5));
      };
      sail(5.5, h - 12, 5.8); sail(h - 10.5, h - 2.5, 4.4);
      poly(g, [[m, h + 0.4], [m - 4.5, h - 0.4], [m, h - 1.2]]);
    });
    line(g, -31, 7, -31.6, 10.4, 0.2); gelc(g, G.r, () => ell(g, -31.7, 9.4, 0.9, 1.1));
    gelc(g, G.a, () => ell(g, 31, 7.6, 0.5, 0.5));
  });
  def('oar', -1.7, -15.2, 1.7, 0.7, 14, (g) => {
    line(g, 0, 0, 0, -9, 0.32); ell(g, 0, -11.6, 1.35, 3.4);
    cut(g, () => { for (let i = 0; i < 9; i++) for (const s of [-1, 1]) poly(g, [[s * 0.14, -9.2 - i * 0.6], [s * 1.25, -8.6 - i * 0.6], [s * 1.25, -8.45 - i * 0.6], [s * 0.14, -9.05 - i * 0.6]]); });
    gelc(g, G.a, () => ell(g, 0, 0, 0.2, 0.2));
  });
  def('barge', -17.2, -1.5, 17.4, 11, 16, (g) => {
    g.beginPath(); g.moveTo(-16.5, 4.2); g.quadraticCurveTo(-15, -1, -8, -1); g.lineTo(9, -1); g.quadraticCurveTo(15, -0.8, 16.8, 5.5); g.quadraticCurveTo(13.5, 1.6, 9, 1.4); g.lineTo(-9, 1.4); g.quadraticCurveTo(-13, 1.6, -16.5, 4.2); g.fill();
    for (const x of [-5, 0, 5]) line(g, x, 1.4, x, 5.5, 0.26);
    poly(g, [[-6.5, 5.5], [6.5, 5.5], [5, 6.6], [-5, 6.6]]); onion(g, 0, 6.6, 1.8, 2.1);
    ell(g, -2.5, 2.6, 0.8, 1.2); ell(g, -2.5, 4.1, 0.45, 0.48); ell(g, -9, 2.4, 0.7, 1.1); ell(g, -9, 3.8, 0.42, 0.45); line(g, 2.5, 5.5, 2.5, 4.6, 0.08);
    gelc(g, G.r, () => ell(g, 2.5, 3.8, 0.6, 0.78)); gelc(g, G.a, () => { ell(g, 15.9, 6.2, 0.5, 0.6); for (let i = 0; i < 12; i++) star(g, -8.2 + i * 1.5, 0.2, 0.34, 4, 0.42); });
    gelc(g, G.t, () => { for (let i = 0; i < 12; i++) ell(g, -5.5 + i, 5.85, 0.15, 0.15); });
  });
  def('tent', -6.6, 0, 6.6, 10.6, 20, (g) => {
    g.beginPath(); g.moveTo(-5.5, 0); g.lineTo(-4.6, 3.6); g.quadraticCurveTo(-2, 4.6, 0, 8.8); g.quadraticCurveTo(2, 4.6, 4.6, 3.6); g.lineTo(5.5, 0); g.closePath(); g.fill();
    line(g, 0, 8.6, 0, 10.2, 0.16); poly(g, [[0, 10.3], [1.7, 9.85], [0, 9.4]]); line(g, -4.6, 3.6, -6.4, 0, 0.09); line(g, 4.6, 3.6, 6.4, 0, 0.09);
    win(g, 0, 0, 1.15, 2.1, G.r); gelc(g, G.a, () => { for (let i = 0; i < 9; i++) ell(g, -4 + i, 3.1, 0.15, 0.15); });
    gelc(g, G.t, () => star(g, 0, 5.6, 0.5, 8, 0.5));
  });
  def('tower1', -6.6, 0, 6.6, 42.5, 9, (g) => {
    poly(g, [[-3.6, 0], [3.6, 0], [3.3, 27], [-3.3, 27]]); poly(g, [[-4.4, 27], [4.4, 27], [4.4, 28.4], [-4.4, 28.4]]); g.fillRect(-3, 28.4, 6, 2.6); onion(g, 0, 31, 4.6, 7.5);
    for (let j = 0; j < 7; j++) for (let i = -1; i <= 1; i++) if (r.chance(0.75)) win(g, i * 1.8, 4 + j * 3.2, 0.45, 1.0, r.chance(0.6) ? G.a : G.t);
    gelc(g, G.t, () => { star(g, 0, 34.5, 1.1, 8, 0.5); for (let i = -2; i <= 2; i++) ell(g, i * 1.5, 27.7, 0.26, 0.26); });
  });
  def('tower2', -3, 0, 3, 56, 9, (g) => {
    poly(g, [[-1.3, 0], [1.3, 0], [1.0, 42], [-1.0, 42]]); for (const y of [29, 41.4]) poly(g, [[-1.2, y - 1], [-2.3, y], [-2.3, y + 1], [2.3, y + 1], [2.3, y], [1.2, y - 1]]);
    poly(g, [[-1.3, 43], [1.3, 43], [0, 52]]); line(g, 0, 51, 0, 55, 0.3); ell(g, 0, 53.4, 0.55, 0.55);
    for (let y = 7; y < 40; y += 4.6) win(g, 0, y, 0.34, 1.0, y > 30 ? G.r : G.a);
  });
  def('tower3', -15, 0, 15, 39, 9, (g) => {
    g.fillRect(-13, 0, 26, 16); for (let i = 0; i < 9; i++) g.fillRect(-13 + i * 3, 16, 1.8, 1.3);
    g.fillRect(-9, 16, 18, 4); onion(g, 0, 20, 10.5, 13); onion(g, -11, 17, 2.4, 4); onion(g, 11, 17, 2.4, 4);
    for (let i = 0; i < 9; i++) win(g, -11 + i * 2.75, 4, 0.75, 3.4, i % 2 ? G.t : G.a);
    gelc(g, G.a, () => { for (let i = 0; i < 10; i++) star(g, -11.2 + i * 2.5, 12.6, 0.62, 8, 0.5); });
    gelc(g, G.t, () => { for (let j = 0; j < 4; j++) for (let i = -3 + j; i <= 3 - j; i++) star(g, i * 2.5 + (j % 2) * 0, 23 + j * 2.3, 0.6, 4, 0.4); });
    for (let i = 0; i < 7; i++) win(g, -7.5 + i * 2.5, 17, 0.4, 1.5, G.r);
  });
  def('moon', -15, -15, 15, 15, 6, (g) => { gelc(g, G.c, () => ell(g, 0, 0, 14, 14)); cut(g, () => ell(g, 5.5, 3, 12.6, 12.6)); });
  def('rod', -0.5, 0, 0.5, 1, 24, (g) => g.fillRect(-0.5, 0, 1, 1));
  for (const [n, c] of [['lanternA', G.a], ['lanternR', G.r], ['lanternT', G.t]]) def(n, -1, -3.5, 1, 0.3, 22, (g) => {
    line(g, 0, 0, 0, -1, 0.08); poly(g, [[-0.5, -1], [0.5, -1], [0.3, -0.7], [-0.3, -0.7]]); ell(g, 0, -1.95, 0.8, 1.02);
    gelc(g, c, () => ell(g, 0, -1.95, 0.66, 0.9)); line(g, 0, -1.05, 0, -2.85, 0.06); line(g, 0, -2.95, 0, -3.4, 0.1);
  });
}

// ---------- instanced cut-outs (lace, flora, puppets): one mesh, static range then a per-frame range ----------
function makeSprites(atlas, U, max) {
  const geo = new THREE.InstancedBufferGeometry();
  const pos = [], idx = [];
  for (let s = 0; s < 2; s++) { const z = s ? -0.1 : 0.1, o = s * 4; pos.push(0, 0, z, 1, 0, z, 1, 1, z, 0, 1, z); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const attrs = ['iA', 'iB', 'iC', 'iD', 'iE'].map((n) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, a); return a; });
  const [A, B, C, D, E] = attrs.map((a) => a.array);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uAtlas: { value: atlas.tex } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${COMMON}
      attribute vec4 iA, iB, iC, iD, iE;
      varying vec2 vUv; varying vec3 vW; varying float vLay;
      void main() {
        vec2 l = (iD.xy + position.xy * iD.zw) * iB.xy;
        vUv = iC.xy + position.xy * iC.zw;
        float a = iA.w + iB.w * sin(uTime * iE.x + iE.y) + iB.w * 0.4 * sin(uTime * iE.x * 2.3 + iE.y * 1.7);
        float c = cos(a), s = sin(a);
        vec3 w = vec3(iA.x + c * l.x - s * l.y, iA.y + s * l.x + c * l.y, iA.z + position.z);
        vW = w; vLay = iB.z;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${COMMON}
      uniform sampler2D uAtlas;
      varying vec2 vUv; varying vec3 vW; varying float vLay;
      void main() {
        vec4 t = texture2D(uAtlas, vUv);
        if (t.a < 0.5) discard;
        float soft = texture2D(uAtlas, vUv, 1.3).a;
        float rim = smoothstep(0.9, 0.55, soft);
        float fib = fibre(vW.xy);
        float gel = smoothstep(0.05, 0.22, max(t.r, max(t.g, t.b)));
        float tw = 0.9 + 0.2 * sin(uTime * 1.7 + vW.x * 0.07 + vLay * 2.0);
        vec3 col;
        if (cameraPosition.z > vW.z) { col = inkFor(vLay, fib) + uAmber * rim * 0.24; col = mix(col, t.rgb * uGlow * tw, gel); }
        else { col = cardFor(vW.xy, fib) * (1.0 - 0.3 * rim); col = mix(col, t.rgb * (0.8 + 0.5 * tw), gel); }
        gl_FragColor = vec4(col * uFlick, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'cut-outs';
  const sp = { mesh, n: 0, nStatic: 0, S: atlas.S };
  sp.put = (name, x, y, z, rot = 0, sx = 1, sy = sx, lay = 0, swA = 0, swF = 0, swP = 0) => {
    if (sp.n >= max) return; const s = atlas.S[name], o = sp.n * 4;
    A[o] = x; A[o + 1] = y; A[o + 2] = z; A[o + 3] = rot;
    B[o] = sx; B[o + 1] = sy; B[o + 2] = lay; B[o + 3] = swA;
    C[o] = s.uv[0]; C[o + 1] = s.uv[1]; C[o + 2] = s.uv[2]; C[o + 3] = s.uv[3];
    D[o] = s.b[0]; D[o + 1] = s.b[1]; D[o + 2] = s.b[2]; D[o + 3] = s.b[3];
    E[o] = swF; E[o + 1] = swP; E[o + 2] = 0; E[o + 3] = 0;
    sp.n++;
  };
  sp.freeze = () => { sp.nStatic = sp.n; geo.instanceCount = sp.n; for (const a of attrs) a.needsUpdate = true; };
  sp.begin = () => { sp.n = sp.nStatic; };
  sp.end = () => {
    geo.instanceCount = sp.n; const cnt = (sp.n - sp.nStatic) * 4;
    if (cnt > 0) for (const a of attrs) { a.clearUpdateRanges(); a.addUpdateRange(sp.nStatic * 4, cnt); a.needsUpdate = true; }
  };
  return sp;
}

// ---------- big flats: height profiles extruded 0.3 m, all in one mesh ----------
function makeFlatWriter() { return { pos: [], aT: [], aB: [], aH: [], aS: [], idx: [], n: 0 }; }
// o: { z, x0, x1, dx, h(x), lay, style, hole: [cx, halfWidth, cy, R] | null, slide: [amp, freq, phase] | null }
function addFlat(W, o) {
  const n = Math.ceil((o.x1 - o.x0) / o.dx), hole = o.hole || [0, 0, 0, 0], sl = o.slide || [0, 0, 0];
  const zf = o.z + 0.15, zb = o.z - 0.15, y0 = -0.4;
  const v = (x, y, z, d, below, side) => {
    W.pos.push(x, y, z); W.aT.push(d, o.lay, o.style || 0, side); W.aB.push(below);
    W.aH.push(hole[0], hole[1], hole[2], hole[3]); W.aS.push(sl[0], sl[1], sl[2]);
    return W.n++;
  };
  let hl = Math.max(0.3, o.h(o.x0));
  for (let i = 0; i < n; i++) {
    const xa = o.x0 + i * o.dx, xb = xa + o.dx, hr = Math.max(0.3, o.h(xb));
    const f = 1 / Math.sqrt(1 + ((hr - hl) / o.dx) ** 2), hm = Math.min(hl, hr);
    for (const z of [zf, zb]) {
      const a = v(xa, y0, z, (hl - y0) * f, hm - y0, 0), b = v(xb, y0, z, (hr - y0) * f, hm - y0, 0);
      const c = v(xb, hr, z, 0, hm - hr, 0), d = v(xa, hl, z, 0, hm - hl, 0);
      W.idx.push(a, b, c, a, c, d);
    }
    const e0 = v(xa, hl, zf, 0, 0, 2), e1 = v(xb, hr, zf, 0, 0, 2), e2 = v(xb, hr, zb, 0, 0, 2), e3 = v(xa, hl, zb, 0, 0, 2);
    W.idx.push(e0, e1, e2, e0, e2, e3);
    hl = hr;
  }
}
async function makeFlats(W, U, ctx) {   // hands back between the copies of the long arrays
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(W.pos, 3));
  await ctx.yield();
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(W.aT, 4));
  await ctx.yield();
  geo.setAttribute('aB', new THREE.Float32BufferAttribute(W.aB, 1));
  geo.setAttribute('aH', new THREE.Float32BufferAttribute(W.aH, 4));
  await ctx.yield();
  geo.setAttribute('aS', new THREE.Float32BufferAttribute(W.aS, 3));
  await ctx.yield();
  geo.setIndex(W.idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${COMMON}
      attribute vec4 aT, aH; attribute float aB; attribute vec3 aS;
      varying vec4 vT, vH; varying float vB; varying vec3 vW; varying vec2 vP;
      void main() {
        vec3 w = position; vP = w.xy;
        w.x += aS.x * sin(uTime * aS.y + aS.z);
        w.y += aS.x * 0.06 * sin(uTime * aS.y * 2.0 + aS.z + w.x * 0.05);
        vT = aT; vH = aH; vB = aB; vW = w;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${COMMON}
      uniform vec3 uGel[4];
      varying vec4 vT, vH; varying float vB; varying vec3 vW; varying vec2 vP;
      void main() {
        float fib = fibre(vP);
        float dh = 1e3;
        if (vH.w > 0.0) {
          vec2 p = vW.xy - vec2(vH.x, vH.z);
          dh = min(length(p) - vH.w, max(abs(p.x) - vH.y, p.y));
          if (dh < 0.0) discard;
        }
        float px = clamp(fwidth(vP.x) + fwidth(vP.y), 0.0, 0.8);
        float d = max(vT.x, vB), rimW = max(0.2, px * 1.15);
        float rim = 1.0 - smoothstep(rimW * 0.6, rimW, d);
        float hrim = 1.0 - smoothstep(rimW * 0.8, rimW * 1.8, dh);
        float lay = vT.y, style = vT.z;
        // pierced windows
        float win = 0.0; vec3 gel = uGel[0];
        float course = 0.0;
        if (style > 0.5 && style < 2.5) {                 // masonry courses, faintly rim-lit (antialiased, fading with distance)
          float row = floor(vP.y / 2.5);
          float cy = abs(fract(vP.y / 2.5) - 0.5) * 2.5, cx = abs(fract(vP.x / 5.0 + 0.5 * mod(row, 2.0)) - 0.5) * 5.0;
          float lw = 0.05 + px * 0.6;
          course = max(smoothstep(1.25 - lw, 1.25 - lw * 0.4, cy), smoothstep(2.5 - lw, 2.5 - lw * 0.4, cx) * 0.7) * min(1.0, 0.22 / max(px, 1e-3));
          course *= 0.6 + 0.4 * h21(vec2(floor(vP.x / 5.0 + 0.5 * mod(row, 2.0)), row));
        }
        if (style > 0.5 && style < 1.5) {                 // the city wall: a frieze of stars, an arcade of small windows, lattice high in the towers
          vec2 c = vec2(floor(vP.x / 4.0), 0.0); vec2 p = vec2((fract(vP.x / 4.0) - 0.5) * 4.0, vP.y - 13.6);
          float sd = min(max(abs(p.x), abs(p.y)) - 0.62, (abs(p.x) + abs(p.y)) * 0.7071 - 0.62);
          float k = h21(c + 3.0); gel = k < 0.5 ? uGel[0] : k < 0.8 ? uGel[2] : uGel[1];
          // arcade at y 6-10: arabesque windows in threes between plain piers
          float ai = floor(vP.x / 2.6); vec2 q = vec2((fract(vP.x / 2.6) - 0.5) * 2.6, vP.y - 6.2);
          float ad = min(max(abs(q.x) - 0.52, abs(q.y - 1.1) - 1.1), length(vec2(q.x, (q.y - 2.2) * 0.62)) - 0.52);
          ad = min(ad, length(q - vec2(0.0, 3.9)) - 0.17);
          if (mod(ai, 4.0) > 2.5) ad = 1e3;
          if (ad < sd) { sd = ad; float ka = h21(vec2(ai, 11.0)); gel = ka < 0.55 ? uGel[2] : ka < 0.85 ? uGel[0] : uGel[1]; }
          // lattice of diamonds and pin-pricks at y 22.5-28 (only the towers reach that high)
          vec2 li = floor(vec2(vP.x, vP.y - 22.4) / 1.9); vec2 lp = (fract(vec2(vP.x, vP.y - 22.4) / 1.9) - 0.5) * 1.9;
          float ld = mod(li.x + li.y, 2.0) < 0.5 ? (abs(lp.x) + abs(lp.y) * 0.7) - 0.52 : length(lp) - 0.2;
          if (li.y < 0.0 || li.y > 2.5) ld = 1e3;
          if (ld < sd) { sd = ld; gel = mod(li.x + li.y, 2.0) < 0.5 ? uGel[0] : uGel[2]; }
          win = (1.0 - smoothstep(0.0, px + 0.02, sd)) * step(3.5, dh) * step(1.6, d);
        } else if (style > 1.5 && style < 2.5) {          // lit windows of the city
          vec2 c = floor(vP / vec2(3.0, 4.4)); vec2 p = (fract(vP / vec2(3.0, 4.4)) - 0.5) * vec2(3.0, 4.4);
          float k = h21(c);
          float sd = min(max(abs(p.x) - 0.42, abs(p.y + 0.2) - 0.7), length(p - vec2(0.0, 0.5)) - 0.42);
          win = (1.0 - smoothstep(0.0, px + 0.02, sd)) * step(0.45, k) * step(2.6, d) * step(3.0, dh) * step(2.0, vP.y);
          gel = k < 0.72 ? uGel[2] : k < 0.9 ? uGel[0] : uGel[1];
        }
        else if (style > 4.5) {                           // glints slit into the river strips
          vec2 c = floor(vP / vec2(2.6, 1.0)); vec2 p = (fract(vP / vec2(2.6, 1.0)) - 0.5) * vec2(2.6, 1.0);
          p.x += (h21(c + 2.0) - 0.5) * 1.2; float k = h21(c);
          float sd = max(abs(p.x) - 0.15 - 0.35 * h21(c + 7.0), abs(p.y) - max(0.05, px * 0.45));
          float on = 0.5 + 0.5 * sin(uTime * (1.0 + 2.5 * k) + k * 50.0);
          win = (1.0 - smoothstep(0.0, px * 0.5 + 0.02, sd)) * step(0.72, k) * step(0.5, d) * on;
          gel = mix(uCream, uGel[0], step(0.9, k));
        } else if (style > 3.5) {                           // the balcony rail: a row of dim house lights
          vec2 p = vec2((fract(vP.x / 3.2) - 0.5) * 3.2, vP.y - 3.6);
          float sd = min(max(abs(p.x), abs(p.y)) - 0.4, (abs(p.x) + abs(p.y)) * 0.7071 - 0.4);
          win = (1.0 - smoothstep(0.0, px + 0.02, sd)) * 0.55;
          gel = h21(vec2(floor(vP.x / 3.2), 5.0)) < 0.7 ? uGel[2] : uGel[0];
        }
        float tw = 0.85 + 0.3 * sin(uTime * (0.6 + 2.0 * h21(floor(vP / 3.0))) + vP.x);
        vec3 col;
        if (vT.w > 1.5) col = uCream * (0.85 + 0.35 * fib);
        else if (cameraPosition.z > vW.z) {
          vec3 hc = style > 2.5 ? uGel[1] * 1.6 : uAmber;
          col = inkFor(lay, fib) + uAmber * 0.5 * rim + hc * hrim * 0.9;
          col += mix(uAmber, uTeal * 1.6, 0.5) * course * 0.085 * step(3.0, dh);
          col = mix(col, gel * uGlow * tw, win);
        } else {
          col = cardFor(vP, fib);
          vec2 g = abs(fract(vP / vec2(15.0, 11.0)) - 0.5) * vec2(15.0, 11.0);
          float batten = 1.0 - smoothstep(0.26, 0.34 + px, min(g.x, g.y));
          col = mix(col, mix(uAmber, uCream, 0.35) * 0.36 * (0.7 + 0.6 * vnoise(vP * vec2(1.0, 14.0))), batten * 0.6);
          col *= 1.0 - 0.25 * rim; col += uCream * 0.5 * hrim;
          col = mix(col, gel * (0.8 + 0.5 * tw), win);
        }
        gl_FragColor = vec4(col * uFlick, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'flats';
  return mesh;
}

// ---------- the screen, the stage floor, the tissue sheets, the dust ----------
function makeBackdrop(U) {
  const geo = new THREE.PlaneGeometry(7600, 1500); geo.translate(AX, 670, SCREEN_Z);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, depthWrite: false,
    vertexShader: /* glsl */`varying vec3 vW; void main() { vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      ${COMMON}
      ${LAMP_GLSL}
      uniform float uStars, uStarY;
      varying vec3 vW;
      void main() {
        vec2 p = vW.xy - vec2(${AX.toFixed(1)}, ${LAMP_Y.toFixed(1)});
        vec3 c = lampCol(p);
        c *= 0.86 + 0.26 * fibre(vW.xy * 0.22);
        c *= 0.95 + 0.1 * vnoise(vW.xy * vec2(0.015, 0.5));
        float edge = uStarY + 14.0 * sin(vW.x * 0.011 + uTime * 0.05) + 6.0 * sin(vW.x * 0.037);
        float top = smoothstep(edge, edge + 3.0, vW.y);
        vec2 sp = vec2(vW.x + uTime * 2.6, vW.y) / 8.0; vec2 cell = floor(sp); vec2 f = fract(sp) - 0.5;
        float hs = h21(cell); vec2 off = vec2(h21(cell + 3.1), h21(cell + 7.7)) - 0.5;
        float st = step(1.0 - uStars * 0.5, hs) * (1.0 - smoothstep(0.05, 0.1 + 0.07 * h21(cell + 1.3), length(f - off * 0.6)));
        c *= 1.0 - 0.3 * top;
        c += uC0 * st * top * 3.2 * (0.7 + 0.3 * sin(uTime * 2.0 + hs * 40.0));
        gl_FragColor = vec4(c * uFlick, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -2; m.name = 'screen';
  return m;
}
function makeFloor(U, slots) {
  const geo = new THREE.PlaneGeometry(7600, 900); geo.rotateX(-Math.PI / 2); geo.translate(AX, 0, SCREEN_Z + 449);
  const sl = new Array(14).fill(9999); slots.forEach((z, i) => { if (i < 14) sl[i] = z; });
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uSlots: { value: sl } },
    vertexShader: /* glsl */`varying vec3 vW; void main() { vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      ${COMMON}
      ${LAMP_GLSL}
      uniform float uSlots[14];
      varying vec3 vW;
      void main() {
        vec3 d = vW - cameraPosition; float dist = max(length(d), 1e-3); vec3 V = d / dist;
        vec2 fp = fwidth(vW.xz);                              // band-limit every streak term: no moire far away
        float grain = mix(0.5, vnoise(vW.xz * vec2(0.12, 2.2)), 1.0 - smoothstep(0.3, 1.0, fp.y * 2.2));
        float streak = mix(0.5, vnoise(vW.xz * vec2(0.9, 0.05)), 1.0 - smoothstep(0.3, 1.0, fp.x * 0.9));
        float broad = mix(0.5, vnoise(vW.xz * vec2(0.5, 0.06)), 1.0 - smoothstep(0.3, 1.0, fp.x * 0.5));
        vec3 lac = mix(uC1, uC0, 0.22);                       // lacquer takes the colour of the lamp's glow
        vec3 col = uInk * (0.4 + 0.6 * grain) + uAmber * 0.003 + lac * (0.012 + 0.03 * grain * streak);
        float gz = 1.0 - min(abs(V.y), 1.0);
        if (V.z < -0.02) {
          float t = (${SCREEN_Z.toFixed(1)} - vW.z) / V.z;
          vec2 hit = vec2(vW.x + V.x * t, -V.y * t);
          hit.x += (grain - 0.5) * 16.0 + (broad - 0.5) * 30.0;
          float fr = 0.05 + 0.6 * gz * gz * gz * gz * gz; fr *= 0.55 + 0.45 * streak;
          vec3 Lr = lampCol(hit - vec2(${AX.toFixed(1)}, ${LAMP_Y.toFixed(1)}));
          col += mix(Lr, lac * dot(Lr, vec3(0.3, 0.5, 0.2)) * 1.5, 0.65) * fr * 0.45;
          // a broad sheen along the palace axis: the lamp lying on the lacquer
          float ax = (vW.x - ${AX.toFixed(1)}) / 25.0;
          col += lac * exp(-ax * ax) * smoothstep(1.5, 12.0, dist) * (0.4 + 0.6 * gz * gz) * (0.72 + 0.56 * streak) * 0.25;
        }
        float fw = fwidth(vW.z) + 0.02, slot = 0.0, brass = 0.0;
        for (int i = 0; i < 14; i++) {
          float dz = abs(vW.z - uSlots[i]);
          slot = max(slot, 1.0 - smoothstep(0.22, 0.22 + fw, dz));
          brass = max(brass, (1.0 - smoothstep(0.5, 0.5 + fw, dz)) * min(1.0, 0.5 / fw));
        }
        float nearK = 1.0 - smoothstep(45.0, 80.0, dist);     // brass slot lines only near the camera
        col = mix(col, uAmber * (0.25 + 0.5 * mix(0.5, vnoise(vW.xz * vec2(0.7, 20.0)), nearK)) + col, brass * (1.0 - slot) * nearK);
        slot *= nearK;
        col = mix(col, uInk * 0.3, slot);
        gl_FragColor = vec4(col * uFlick, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.name = 'stage-floor';
  return m;
}
function makeTissues(U, zs, weather) {
  const pos = [], idx = [], k = [];
  zs.forEach((z, i) => { const o = i * 4; pos.push(AX - 1100, -1, z, AX + 1100, -1, z, AX + 1100, 1100, z, AX - 1100, 1100, z); k.push(i, i, i, i); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aK', new THREE.Float32BufferAttribute(k, 1)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uWeather: { value: weather } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aK; varying vec3 vW; varying float vK; void main() { vW = position; vK = aK; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      ${COMMON}
      uniform vec3 uC0, uC1; uniform float uWeather;
      varying vec3 vW; varying float vK;
      void main() {
        float fib = fibre(vW.xy * 0.4);
        vec3 col = mix(uC1, uC0, 0.35) * 0.42; float a = 0.05 + 0.07 * fib + 0.03 * vnoise(vW.xy * 0.02);
        if (uWeather > 0.5 && uWeather < 1.5) {            // rain: slanted slits in a sliding tissue
          vec2 q = vec2(vW.x + vW.y * 0.32 + vK * 13.0, vW.y); float cx = floor(q.x / 5.0);
          float w = max(0.035, fwidth(q.x) / 5.0 * 0.9);
          float yy = fract(q.y / 42.0 + uTime * (0.55 + 0.35 * h11(cx + vK * 31.0)) + h11(cx * 1.7));
          float s = (1.0 - smoothstep(w * 0.5, w, abs(fract(q.x / 5.0) - 0.5))) * step(yy, 0.22) * step(0.62, h11(cx * 3.3 + vK));
          s *= min(1.0, 0.035 / w * 2.0);
          s *= smoothstep(30.0, 110.0, distance(vW, cameraPosition));        // never a fat slit in the lens
          s *= 0.3 + 0.7 * smoothstep(8.0, 26.0, abs(vW.x - ${AX.toFixed(1)}) + 0.25 * vW.y);
          col = mix(col, uC0 * 0.9, s); a = mix(a, 0.5, s);
        } else if (uWeather > 1.5 && vK > 0.5 && vK < 2.5) {           // sandstorm: a stippled sheet scrolling across
          vec2 q = vec2(vW.x - uTime * (26.0 + vK * 9.0), vW.y + 5.0 * sin(vW.x * 0.02 + uTime * 0.4));
          vec2 c = floor(q / 1.7); vec2 f = fract(q / 1.7) - 0.5;
          float band = smoothstep(0.35, 0.75, vnoise(q * vec2(0.008, 0.02)) + 0.25 * vnoise(q * 0.05)) * (1.0 - smoothstep(60.0, 190.0, vW.y));
          float dot_ = (1.0 - smoothstep(0.16, 0.3, length(f - (vec2(h21(c), h21(c + 5.0)) - 0.5) * 0.5))) * step(1.0 - band, h21(c + 9.0));
          col = mix(col, inkFor(1.0 + vK * 3.0, fib) + uAmber * 0.1, dot_); a = mix(a + band * 0.08, 0.85, dot_);
        }
        gl_FragColor = vec4(col * uFlick, a);
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 3; m.name = 'tissues';
  return m;
}
function makeMotes(rng, U, count) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos[i * 3] = AX + rng.range(-420, 300); pos[i * 3 + 1] = rng.range(1, 80) * rng.range(0.3, 1); pos[i * 3 + 2] = rng.range(-410, 70); seed[i] = rng(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uPx: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime, uPx; attribute float aSeed; varying float vA;
      void main() {
        vec3 p = position + vec3(sin(uTime * 0.31 + aSeed * 40.0) * 4.0, sin(uTime * 0.23 + aSeed * 17.0) * 2.5, cos(uTime * 0.27 + aSeed * 29.0) * 4.0);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float s = uPx * (26.0 + 30.0 * aSeed) / max(-mv.z, 1.0);
        vA = (0.35 + 0.65 * abs(sin(uTime * (0.4 + aSeed) + aSeed * 60.0))) * min(1.0, s) * smoothstep(1.5, 6.0, -mv.z);
        gl_PointSize = clamp(s, 1.0, 5.0 * uPx);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uC0; uniform float uFlick; varying float vA;
      void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uC0 * 1.3 * uFlick, vA * (1.0 - smoothstep(0.2, 0.5, d))); }`,
  });
  const m = new THREE.Points(geo, mat); m.frustumCulled = false; m.renderOrder = 4; m.name = 'motes';
  return m;
}

// leg tables: [hip x, sign or phase, dz] x 4
const G_LEG = [-1.35, -1, -0.25, 1.3, 1, -0.25, -1.45, -1, 0.25, 1.2, 1, 0.25];
const L_LEG = [-1.9, 0, -0.25, 1.9, 1.6, -0.25, -2.1, 3.1, 0.25, 1.7, 4.7, 0.25];

const GELS = {
  evening: { t: '#6FE3D0', r: '#F0628E', a: '#FFB648', e: '#4FD68A', c: '#FFF0C0' },
  night: { t: '#FFC46B', r: '#FF7A8A', a: '#FFD27A', e: '#7FE0D0', c: '#EAF4FF' },
  dawn: { t: '#7FE8C8', r: '#FF86A8', a: '#FFD08A', e: '#8FE0A0', c: '#FFF4DC' },
};

export default {
  id: 'shadow-theatre',
  name: 'The Lamp-Lit Caravan',
  category: 'bizarre',
  weirdness: 0.65,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx, { clamp, smoothstep, lerp } = ctx.core;
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

    // ----- the show: hour, weather, season, cast -----
    const pickShow = rng.pick(['evening', 'evening', 'night', 'dawn']), pickDay = rng.pick(['evening', 'dawn']);
    const hour = vary.hour || 'any';
    const showId = hour === 'night' ? 'night' : hour === 'dawn' ? 'dawn' : hour === 'golden' ? 'evening' : hour === 'day' ? pickDay : pickShow;
    const show = SHOWS[showId], G = GELS[showId];
    const weather = rng.pick([0, 0, 1, 2]);                       // clear, rain tissue, sandstorm sheet
    const season = rng.pick([0, 0, 1, 2]);                        // date palms, blossom, bare branches
    const skyCast = rng.pick(['galleon', 'galleon', 'roc', 'cranes']);
    const barges = rng.chance(0.25);                              // river-barge procession in place of the elephants
    const rare = !!vary.rare;                                     // the shadow of two hands makes a dove
    const pal = show.pal.map((h) => new THREE.Color(h));
    const sx0 = rng.range(0, 100);

    const scene = new THREE.Scene();
    scene.background = pal[5].clone().multiplyScalar(0.6);

    const U = {
      uTime: { value: 0 }, uFlick: { value: 1 }, uGlow: { value: 2.0 },
      uInk: { value: pal[5] }, uAmber: { value: pal[1] }, uTeal: { value: show.teal ? new THREE.Color(show.teal) : pal[4] }, uCream: { value: pal[0] },
      uC0: { value: pal[0] }, uC1: { value: show.c1 ? new THREE.Color(show.c1) : pal[1] }, uC2: { value: pal[2] }, uC3: { value: pal[3] }, uC4: { value: pal[4] },
      uCore: { value: show.core }, uStars: { value: show.stars }, uStarY: { value: showId === 'night' ? 105 : 185 },
      uGel: { value: [G.t, G.r, G.a, G.e].map((h) => new THREE.Color(h)) },
    };

    // ----- the flight -----
    const path = makePath([
      [-112, 13, 215], [-94, 18, 162], [-62, 22, 110], [-10, 23, 83], [50, 23, 80], [112, 23, 78], [160, 22, 62],
      [199, 20, 18], [222, 18.5, -5], [236, 17.5, -7], [253.7, 16.5, -14.3], [AX, 15.5, -32], [AX, 14, -48],
      [AX, 5.6, -75], [AX, 6.8, -110], [AX, 9, -150], [AX, 9.5, -195], [AX, 9.5, -240], [AX, 9.5, -300], [AX, 9.5, -370],
    ]);
    const L = path.length, _p = V3(), _q = V3(), _t = V3();
    const findU = (pred, from = 0) => { for (let i = Math.round(from * 2000); i <= 2000; i++) { path.pointAt(i / 2000, _p); if (pred(_p)) return i / 2000; } return 1; };
    const uLat = findU((p) => p.x > -10), uSwing0 = findU((p) => p.x > 150), uSwing1 = findU((p) => p.x > 222);
    const uRiver = findU((p) => p.z < -15, uSwing1), uBelly = findU((p) => p.z < -75, uSwing1);
    const PIC = V3(0.13, 0.03, -1).normalize(), PIC2 = V3(0.42, 0.02, -1).normalize();
    const gazeAt = (time, u) => {
      path.pointAt(u, _p); path.posAtDist(u * L + 30, _q); _t.subVectors(_q, _p).normalize();
      const k = 1 - smoothstep(uSwing0, uSwing1, u), lead = smoothstep(uLat, uSwing0, u);
      _t.z -= 0.75 * (1 - smoothstep(uRiver - 0.03, uRiver + 0.04, u));          // while slipping in, look across the sheets toward the lamp
      _t.y += 0.15 * smoothstep(uRiver - 0.01, uRiver + 0.05, u) * (1 - smoothstep(0.86, 0.93, u));   // lift the eyes off the floor: to the elephant, then the palace
      _t.normalize();
      _q.copy(PIC).lerp(PIC2, lead * 0.8); _q.y += 0.25 * (1 - smoothstep(0.03, uLat, u));
      _t.lerp(_q, k).normalize();
      return _q.copy(_p).addScaledVector(_t, 200);
    };
    await ctx.yield();

    // ----- the atlas and the hero -----
    const atlas = makeAtlas(rng.fork('atlas'), G, season);
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: show.teal ? show.pal.map((h, i) => (i === 4 ? show.teal : h)) : show.pal, autoDemo: false, progress: 0, layerBase: 6, glow: 1.55 });
    hero.object.position.set(AX, 0, -330);
    scene.add(hero.object);
    await ctx.yield();

    // ----- height profiles of the big flats (kept as functions: creatures walk on them) -----
    const dAx = (x) => Math.abs(x - AX);
    const tri = (x) => Math.abs((((x % 1) + 1) % 1) - 0.5) * 2;
    const dune40 = (x) => (3.6 + 2.6 * noise.fbm2(x / 45, 4.4 + sx0, 3)) * (0.35 + 0.65 * smoothstep(8, 40, dAx(x)));
    const ROAD_Y = 1.2;
    const comb = (base, amp, k, ph) => (x) => base + amp * Math.pow(Math.abs(Math.sin((x * Math.PI) / k + ph)), 0.7);
    const FW = makeFlatWriter();
    addFlat(FW, { z: 135, x0: -620, x1: 600, dx: 1, lay: 0, style: 4, h: (x) => 6.3 + (((x % 8) + 8) % 8 < 1 ? 0.9 : 0) });
    await ctx.yield();
    addFlat(FW, { z: 0, x0: -600, x1: 960, dx: 2, lay: 0, h: (x) => 1.0 + 0.5 * noise.fbm2(x / 20, 1.1 + sx0, 2) });
    await ctx.yield();
    // (a loop, not forEach, so that it can hand back after each flat)
    for (const [i, [z, base, f, ph, lay]] of [[-13, 3.2, 0.5, 0.0, 2.5], [-15, 4.0, 0.42, 2.4, 3.2], [-17, 4.8, 0.6, 4.4, 4.0]].entries()) {
      addFlat(FW, { z, x0: -600, x1: 960, dx: 1.2, lay, style: 5, h: comb(base, 1.5, 7 + i, i * 1.3), slide: [5.5, f, ph] });
      await ctx.yield();
    }
    addFlat(FW, { z: -40, x0: -600, x1: 960, dx: 1.5, lay: 2, h: dune40 });
    await ctx.yield();
    if (barges) for (const [i, [z, base, f, ph]] of [[-73, 1.0, 0.45, 0.5], [-75, 1.6, 0.38, 3.0], [-77, 2.2, 0.52, 5.0]].entries()) {
      addFlat(FW, { z, x0: -600, x1: 960, dx: 0.9, lay: 3 + i * 0.2, style: 5, h: comb(base, 1.1, 6 + i, i * 2.1), slide: [4.5, f, ph] });
      await ctx.yield();
    }
    else addFlat(FW, { z: -75, x0: -600, x1: 960, dx: 3, lay: 3, h: (x) => ROAD_Y + 0.14 * noise.n2(x / 6, 7.7) });
    addFlat(FW, { z: -110, x0: -600, x1: 960, dx: 1, lay: 4, style: 3, hole: [AX, 5.6, 7.2, 5.6],
      h: (x) => { const a = dAx(x), g = 2.2 + 1.6 * noise.fbm2(x / 50, 9.1 + sx0, 3); return a < 14 ? Math.max(g, 5.5 + 12.5 * Math.pow(1 - a / 14, 1.5)) : g; } });
    await ctx.yield();
    const dune150 = (x) => (15 + 8 * noise.fbm2(x / 90, 1.7 + sx0, 3) + 2.5 * noise.fbm2(x / 22, 5.1, 2)) * smoothstep(5, 30, dAx(x));
    addFlat(FW, { z: -150, x0: -640, x1: 1040, dx: 2, lay: 5, h: dune150 });
    await ctx.yield();
    addFlat(FW, { z: -195, x0: -600, x1: 920, dx: 1, lay: 6, style: 1, hole: [AX, 8.4, 10.5, 9.4],
      h: (x) => { const a = dAx(x), tx = Math.abs(((((x - AX + 30) % 60) + 60) % 60) - 30); const c = ((x % 4) + 4) % 4 < 2 ? 1.6 : 0; return (a < 16 ? 31 : tx < 5 ? 29 : 17) + c; } });
    await ctx.yield();
    addFlat(FW, { z: -240, x0: -580, x1: 900, dx: 1, lay: 7, style: 2, hole: [AX, 7.4, 10, 8.4],
      h: (x) => { const a = dAx(x), c = ((x % 3) + 3) % 3 < 1.5 ? 1.2 : 0; return (a < 14 ? 24 : 13 + 4.5 * Math.floor(3 * clamp(0.5 + 0.7 * noise.fbm2(Math.floor(x / 9) * 0.37, 2.2 + sx0, 2), 0, 0.99))) + c; } });
    await ctx.yield();
    addFlat(FW, { z: -430, x0: -760, x1: 1300, dx: 2.5, lay: 13,
      h: (x) => (50 + 95 * noise.ridged2(x / 260 + sx0, 3.3, 4) + 12 * tri(x / 17 + noise.n2(x / 60, 2)) + 5 * tri(x / 5.3)) * lerp(0.4, 1, smoothstep(30, 320, dAx(x))) });
    await ctx.yield();
    scene.add(makeBackdrop(U));
    scene.add(makeFloor(U, [0, -13, -15, -17, -40, -73, -75, -77, -110, -150, -195, -240, -430]));
    scene.add(await makeFlats(FW, U, ctx));
    await ctx.yield();
    scene.add(makeTissues(U, [-92, -130, -270, -400], weather));
    const motes = makeMotes(rng.fork('motes'), U, Math.round(2600 * detail));
    scene.add(motes);
    await ctx.yield();

    // ----- static cut-outs: flora, tents, towers, lanterns -----
    const sp = makeSprites(atlas, U, 2600);
    scene.add(sp.mesh);
    const fr = rng.fork('flora');
    const palm = (x, yb, z, H, lay, lean = 0, thin = 1) => {
      sp.put('trunk', x, yb, z, lean, (H / 22) * thin, H / 20, lay);
      const cx = x - Math.sin(lean) * H, cy = yb + Math.cos(lean) * H, n = 9;
      for (let k = 0; k < n; k++) {
        const a = -0.55 + (k / (n - 1)) * (Math.PI + 1.1) + fr.range(-0.1, 0.1), s = (H / 30) * fr.range(1.0, 1.4), m = a > Math.PI / 2;
        sp.put('frond', cx, cy, z + 0.03 * (k % 3) - 0.03, m ? a - Math.PI : a, m ? -s : s, s, lay, 0.07, fr.range(0.6, 1.0), fr.range(0, TAU));
      }
    };
    const tree = (x, yb, z, H, lay) => {
      if (season === 0) palm(x, yb, z, H, lay, fr.range(-0.08, 0.08));
      else sp.put('tree', x, yb, z, fr.range(-0.04, 0.04), (H / 19) * fr.sign(), H / 19, lay, 0.012, fr.range(0.5, 0.8), fr.range(0, TAU));
    };
    // z 0: reeds, papyrus and tall trees that whip past the lateral shot, with a gap where the carpet slips through
    for (let x = -520; x < 820; x += fr.range(1.6, 3.6) / dens) {
      const near = path.nearestXZ(x, 0).dist, clump = noise.fbm2(x / 38, 12.3 + sx0, 2);
      if (near < 11) { if (fr.chance(0.5)) sp.put('tuft', x, 0.8, 0.3, 0, 0.45, 0.45, 0, 0.08, 1.3, fr.range(0, TAU)); continue; }
      if (clump < -0.28 && fr.chance(0.8)) { if (fr.chance(0.4)) sp.put('tuft', x, 0.8, 0.3, 0, fr.range(0.5, 0.9) * fr.sign(), fr.range(0.5, 0.9), 0, 0.07, 1.2, fr.range(0, TAU)); continue; }
      const s = fr.range(0.5, 0.82) * (1 + 0.25 * clump), k = fr();
      sp.put(k < 0.45 ? 'reed' : k < 0.8 ? 'cattail' : 'tuft', x, 0.7, fr.range(-0.5, 0.5), fr.range(-0.07, 0.07), s * fr.sign(), k < 0.8 ? s : s * 1.5, 0, fr.range(0.04, 0.085), fr.range(0.7, 1.3), x * 0.11 + fr.range(0, 1.5));
    }
    for (let x = -300 + fr.range(0, 40); x < 800; x += fr.range(55, 95) / dens) if (path.nearestXZ(x, 0).dist > 16) tree(x, 0.8, -0.4, fr.range(27, 38), 0.3);
    // z -40: the palm arch over the axis, a few trees on the near dunes
    // (both stand far out and lean a long way in, so the trunks stay at the edges of the frame while the elephant is the subject)
    palm(AX - 46, 1, -40.4, 52, 2, -0.7, 0.62); palm(AX + 42, 1, -40.4, 52, 2, 0.66, 0.62);
    for (let x = -330 + fr.range(0, 60); x < 840; x += fr.range(60, 120) / dens) if (dAx(x) > 34) { tree(x, dune40(x) - 0.5, -40.4, fr.range(18, 27), 2); sp.put('tuft', x + 5, dune40(x + 5) - 0.4, -39.7, 0, 0.7, 0.7, 2, 0.06, 1, x); }
    // z -110: oasis trees, acacias and tents round the great pavilion
    for (let x = -540 + fr.range(0, 30); x < 880; x += fr.range(26, 52) / dens) {
      if (dAx(x) < 24) continue; const k = fr();
      if (k < 0.3) sp.put('tent', x, 1.6, -109.6, 0, fr.range(1.5, 2.2) * fr.sign(), fr.range(1.5, 2.1), 4);
      else if (k < 0.55) sp.put('acacia', x, 1.5, -110.4, 0, fr.range(1.3, 1.9) * fr.sign(), fr.range(1.3, 1.8), 4, 0.008, 0.6, x);
      else tree(x, 1.5, -110.4, fr.range(20, 32), 4);
    }
    // z -150: cypress spears and acacias on the far dunes
    for (let x = -600; x < 980; x += fr.range(7, 30) / dens) {
      if (dAx(x) < 30) continue; const y = dune150(x) - 0.6;
      if (fr.chance(0.85)) sp.put('cypress', x, y, -150.4, 0, fr.range(0.8, 1.3), fr.range(0.8, 1.5), 5, 0.012, fr.range(0.5, 0.9), x); else sp.put('acacia', x, y, -150.4, 0, 1.2, 1.2, 5, 0.006, 0.6, x);
    }
    // z -241: the domed city standing behind its wall
    for (let x = -540 + fr.range(0, 20); x < 870; x += fr.range(15, 30)) {
      if (dAx(x) < 21) continue; const k = fr();
      const name = k < 0.4 ? 'tower1' : k < 0.72 ? 'tower2' : 'tower3', s = fr.range(0.95, 1.35);
      if (name === 'tower3') { if (dAx(x) < 34) continue; x += 12; }
      sp.put(name, x, 0, name === 'tower2' ? -243 : -241.2, 0, s, s * fr.range(0.9, 1.15), name === 'tower2' ? 7.6 : 7.3);
    }
    // the rose garden before the palace
    for (let x = AX - 96; x < AX + 96; x += fr.range(6, 11)) if (dAx(x) > 13) sp.put('rose', x, 0, -277 + fr.range(-2, 2), 0, fr.range(1.1, 1.7) * fr.sign(), fr.range(1.0, 1.5), 8, 0.02, 0.9, x);
    // lanterns hung on threads from the flies (many more for the night show)
    const nLan = Math.round((showId === 'night' ? 80 : 18) * dens);
    for (let i = 0; i < nLan; i++) {
      const x = AX + fr.range(-1, 1) * fr.range(60, 380), z = -fr.pick([22, 58, 97, 128, 172, 215, 262]), y = fr.range(24, 82), s = fr.range(1.1, 2.0);
      if (dAx(x) < 12 || path.distanceTo(x, y, z) < 14) continue;
      sp.put('rod', x, y, z - 0.25, 0, 0.14, 340 - y, 3);
      sp.put(fr.pick(['lanternA', 'lanternA', 'lanternR', 'lanternT']), x, y, z, 0, s, s, 2 + (-z / 40), 0.1, fr.range(0.5, 0.9), fr.range(0, TAU));
    }
    // the audience: a row of turbaned heads along the bottom of the opening picture
    for (let x = -400; x < 230; x += fr.range(4.6, 6.6)) { const s = fr.range(0.8, 1.15); if (path.nearestXZ(x, 136).dist > 6.5) sp.put('head', x, 5.9, 135.7 + fr.range(0, 1.5), 0, s * fr.sign(), s, 0, 0.02, fr.range(0.3, 0.7), fr.range(0, TAU)); }
    sp.freeze();
    await ctx.yield();

    // ----- the rare event: the shadow of two hands makes a dove that flutters once across the lamp -----
    const dove = [];
    if (rare) for (const side of [1, -1]) {
      const s = atlas.S.hand, geo = new THREE.PlaneGeometry(1, 1); geo.translate(0.5, 0.5, 0);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uAtlas: { value: atlas.tex }, uInk: U.uInk, uFlick: U.uFlick, uRect: { value: new THREE.Vector4(...s.uv) }, uB: { value: new THREE.Vector4(...s.b) }, uPose: { value: new THREE.Vector4(0, -500, 0, side) }, uA: { value: 0 } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`uniform vec4 uRect, uB, uPose; varying vec2 vUv;
          void main() { vUv = uRect.xy + position.xy * uRect.zw; vec2 l = (uB.xy + position.xy * uB.zw) * vec2(uPose.w, 1.0); float c = cos(uPose.z), s = sin(uPose.z);
            gl_Position = projectionMatrix * viewMatrix * vec4(uPose.x + c * l.x - s * l.y, uPose.y + s * l.x + c * l.y, ${(SCREEN_Z + 6).toFixed(1)}, 1.0); }`,
        fragmentShader: /* glsl */`uniform sampler2D uAtlas; uniform vec3 uInk; uniform float uA, uFlick; varying vec2 vUv;
          void main() { float a = texture2D(uAtlas, vUv, 3.0).a; gl_FragColor = vec4(uInk * 2.5 * uFlick, smoothstep(0.15, 0.75, a) * 0.8 * uA); }`,
      });
      const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -1; scene.add(m); dove.push(mat.uniforms);
    }

    // ----- the cast: jointed puppets rebuilt every frame into the dynamic range -----
    const pr = rng.fork('cast');
    const duration = 50, WALK = 6 * duration;                    // elephants walk 6 m/s, keyed to u
    const E_S = [0.95, 0.62, 0.68, 0.56, 0.36], E_OFF = [0, -24, -41, -57, -67.5];
    const E_Z = -75, E_LAY = 3.4;
    // one elephant's frame (centre, scale, rod wobble), shared by the joint helpers below: no per-frame allocation
    let eX = 0, eY = 0, eS = 1, eW = 0, eC = 1, eSn = 0, eP = 0;
    const jx = (ox, oy) => eX + (ox * eC - oy * eSn) * eS, jy = (ox, oy) => eY + (ox * eSn + oy * eC) * eS;
    const eLeg = (hx, off, dz) => {
      const a = 0.36 * Math.sin(eP + off) + eW, lift = Math.max(0, Math.cos(eP + off)), hX = jx(hx, -2.2), hY = jy(hx, -2.2);
      sp.put('eleg1', hX, hY, E_Z + dz, a, eS, eS, E_LAY);
      sp.put('eleg2', hX + 5.4 * eS * Math.sin(a), hY - 5.4 * eS * Math.cos(a), E_Z + dz + 0.02, a - 0.55 * lift, eS, eS, E_LAY);
    };
    function elephant(x, s, time, i) {
      const z = E_Z, lay = E_LAY;
      eP = x / (1.5 * s); eW = 0.012 * Math.sin(time * 0.8 + i * 2.1) + 0.006 * Math.sin(time * 2.3 + i);
      eX = x; eY = ROAD_Y + 13.2 * s + 0.14 * s * Math.sin(eP * 2); eS = s; eC = Math.cos(eW); eSn = Math.sin(eW);
      const cx = eX, cy = eY, wob = eW, ph = eP;
      eLeg(-6, 0, -0.3); eLeg(5.8, Math.PI * 0.5, -0.3);
      sp.put('etail', jx(-8.5, 1.2), jy(-8.5, 1.2), z - 0.1, -0.25 + 0.3 * Math.sin(ph + 1), s, s, lay);
      sp.put('rod', cx - 3.2 * s, -0.4, z - 0.5, wob, 0.3, cy - 1.5 * s, 1); sp.put('rod', cx + 3.6 * s, -0.4, z - 0.5, -wob, 0.3, cy - 1.5 * s, 1);
      sp.put('ebody', cx, cy, z, wob, s, s, lay);
      if (i === 0) sp.put('howdah', jx(-0.5, 4.5), jy(-0.5, 4.5), z + 0.05, wob * 2.5 + 0.02 * Math.sin(ph * 2 + 1), s, s, lay);
      eLeg(-6, Math.PI, 0.3); eLeg(5.8, Math.PI * 1.5, 0.3);
      const nx = jx(6.6, 1.4), ny = jy(6.6, 1.4), ha = 0.07 * Math.sin(ph * 2 + 0.6) + wob, hc = Math.cos(ha), hs = Math.sin(ha);
      sp.put('ehead', nx, ny, z + 0.5, ha, s, s, lay);
      const a1 = (i === 4 ? 1.25 : 0.15) + 0.22 * Math.sin(time * 0.9 + i);
      const p1x = nx + (4.3 * hc + 2.4 * hs) * s, p1y = ny + (4.3 * hs - 2.4 * hc) * s;
      sp.put('eseg', p1x, p1y, z + 0.4, a1, s, s, lay);
      const a2 = a1 + 0.3 + 0.3 * Math.sin(time * 0.9 + i - 0.9), p2x = p1x + 3 * s * Math.sin(a1), p2y = p1y - 3 * s * Math.cos(a1);
      sp.put('eseg', p2x, p2y, z + 0.42, a2, s * 0.85, s * 0.85, lay);
      const a3 = a2 + 0.5 + 0.4 * Math.sin(time * 0.9 + i - 1.8);
      sp.put('eseg', p2x + 2.55 * s * Math.sin(a2), p2y - 2.55 * s * Math.cos(a2), z + 0.44, a3, s * 0.7, s * 0.7, lay);
      sp.put('eear', nx + (1.3 * hc - 2.3 * hs) * s, ny + (1.3 * hs + 2.3 * hc) * s, z + 0.7, 0.1 + 0.3 * Math.sin(time * 1.6 + i * 1.3), s, s, lay);
    }
    function barge(x, s, time, i) {
      const y = 3.2 + 0.5 * Math.sin(time * 0.9 + i * 1.7), rot = 0.03 * Math.sin(time * 0.7 + i);
      for (let k = 0; k < 7; k++) sp.put('oar', x - 9 * s + k * 2.6 * s, y + 0.6 * s, -75.9, 0.25 + 0.5 * Math.sin(time * 2.1 - k * 0.6 + i), 0.42 * s, 0.42 * s, 3.2);
      sp.put('barge', x, y, -75.6, rot, s, s, 3.2);
    }
    const nGaz = Math.round(5 * dens), gOff = pr.range(0, 470), lOff = pr.range(0, 470);
    function gazelle(time, i) {
      const x = -250 + ((time * 11 + i * 21 + gOff + 7 * Math.sin(i * 5.1)) % 470), s = 2.4 - 0.15 * (i % 3), p = time * 2.3 + i * 1.7;
      const hop = Math.max(0, Math.sin(p)), y = dune40(x) + 4.6 * s / 2.4 + hop * 5.5, br = 0.32 * Math.cos(p) * (hop > 0 ? 1 : 0.2), la = 0.95 * Math.cos(p);
      const c = Math.cos(br), sn = Math.sin(br), k = la * (hop > 0 ? 1 : 0.35);
      for (let j = 0; j < 4; j++) {
        const hx = G_LEG[j * 3] * s, sg = G_LEG[j * 3 + 1], dz = G_LEG[j * 3 + 2], oy = -0.3 * s;
        sp.put('gleg', x + hx * c - oy * sn, y + hx * sn + oy * c, -40.6 + dz, sg * k + br + (dz > 0 ? 0.15 : -0.1), s, s, 2);
      }
      sp.put('gbody', x, y, -40.6, br, s, s, 2);
    }
    function leopard(time) {
      const x = -250 + ((time * 4 + lOff) % 470), s = 2.6, ph = time * 2.2, y = dune40(x) + 3.5;
      for (let j = 0; j < 4; j++) sp.put('gleg', x + L_LEG[j * 3] * s, y - 0.2 * s, -41 + L_LEG[j * 3 + 2], 0.4 * Math.sin(ph + L_LEG[j * 3 + 1]), s * 2, s * 0.72, 2);
      sp.put('etail', x - 2.5 * s, y + 0.2 * s, -41, -1.25 + 0.25 * Math.sin(time * 1.3), 0.9, 1.0, 2);
      sp.put('lbody', x, y + 0.1 * Math.sin(ph * 2), -41, 0.02 * Math.sin(ph), s, s, 2);
    }
    const fishes = []; for (let i = 0; i < Math.round(7 * dens); i++) { let x; do { x = AX + pr.range(-380, 260); } while (x > AX - 30 && x < AX + 14); fishes.push({ x, per: pr.range(4, 8), ph: pr(), dir: pr.sign(), z: pr.pick([-14, -16]), s: pr.range(1.6, 2.6) }); }
    function fish(f, p, x0, span, base, hgt) {
      const vy = hgt * Math.PI * Math.cos(Math.PI * p);
      sp.put('fish', x0 + f.dir * (p - 0.5) * span, base + hgt * Math.sin(Math.PI * p), f.z, f.dir * Math.atan2(vy, span), f.dir * f.s, f.s, 1.3);
    }
    const discC = [AX + (pr.chance(0.5) ? 100 : -105), 122], nBirds = Math.round(22 * dens);
    function birds(time) {
      sp.put('rod', discC[0], 0, -242.4, 0, 0.45, discC[1], 5);
      for (let i = 0; i < nBirds; i++) {
        const ang = time * 0.17 + (i / nBirds) * TAU, rad = i % 3 === 0 ? 19 : 31 + 3 * Math.sin(i * 2.7), s = 2.8 + (i % 4) * 0.3;
        const x = discC[0] + Math.cos(ang) * rad, y = discC[1] + Math.sin(ang) * rad, f = 0.55 * Math.sin(time * 6 + i * 1.3);
        sp.put('wing', x, y, -242, ang - 0.15 + f, s, s, 8); sp.put('wing', x, y, -242, ang + Math.PI + 0.15 - f, s, -s, 8); sp.put('bbody', x, y, -241.9, ang, s, s, 8);
      }
    }
    const SKY_Z = -455, skyY = pr.range(112, 126);
    function skyShip(u, time) {
      const back = u >= uSwing1, dir = back ? 1 : -1;
      const x = back ? lerp(AX - 170, AX + 230, (u - uSwing1) / (1 - uSwing1)) : lerp(AX + 340, AX - 170, clamp(u / uSwing1, 0, 1));
      const y = skyY + 5 * Math.sin(time * 0.5), rot = 0.03 * Math.sin(time * 0.6);
      if (skyCast === 'galleon') {
        for (const far of [1, 0]) for (let i = 0; i < 12; i++) sp.put('oar', x + dir * (-21 + i * 3.2), y - 1.4, SKY_Z + (far ? -0.4 : 0.3), dir * (0.3 + 0.55 * Math.sin(time * 2.4 - i * 0.55 + far * 1.1)), far ? 0.9 : 1, far ? 0.9 : 1, 12.5);
        sp.put('rod', x - 14, 0, SKY_Z - 0.6, 0, 0.5, y - 5, 9); sp.put('rod', x + 14, 0, SKY_Z - 0.6, 0, 0.5, y - 5, 9);
        sp.put('galleon', x, y, SKY_Z, dir * rot, dir, 1, 12.5);
      } else if (skyCast === 'roc') {
        const s = 2.3, th = Math.PI + 1.05 * Math.sin(time * 1.5), th2 = Math.PI + 1.05 * Math.sin(time * 1.5 - 0.5);
        sp.put('rod', x, 0, SKY_Z - 0.6, 0, 0.5, y - 4, 9);
        sp.put('rwing', x + dir * 2 * s, y + 1.5 * s, SKY_Z - 0.3, dir * th2, dir * s * 0.92, -s * 0.92, 12.5);
        sp.put('rbody', x, y, SKY_Z, dir * rot, dir * s, s, 12.5);
        sp.put('rwing', x + dir * 2 * s, y + 1.5 * s, SKY_Z + 0.3, dir * th, dir * s, -s, 12.5);
      } else {
        for (let k = 0; k < 9; k++) {
          const row = Math.ceil(k / 2), up = k % 2 ? 1 : -1, cx = x - dir * row * 15, cy = y + up * row * 6 + 1.5 * Math.sin(time * 1.1 + k), s = 3.4;
          const th = Math.PI * 0.5 + 0.35 + 0.75 * Math.sin(time * 2.6 + k * 0.8);
          sp.put('wing', cx, cy, SKY_Z - 0.3, dir * (th + 0.3), dir * s * 2.1, s * 2.1, 12.5); sp.put('crane', cx, cy, SKY_Z, 0, dir * s, s, 12.5); sp.put('wing', cx, cy, SKY_Z + 0.3, dir * th, dir * s * 2.3, s * 2.3, 12.5);
        }
      }
    }
    const carpets = []; for (let i = 0; i < Math.round(6 * dens); i++) carpets.push({ z: -pr.pick([58, 97, 128, 172, 215, 262]), y: pr.range(36, 78), v: pr.range(5, 10) * pr.sign(), x0: pr.range(0, 1040), s: pr.range(1.3, 2.1), ph: pr.range(0, TAU) });
    const moonX = AX + pr.sign() * pr.range(190, 320), moonS = showId === 'night' ? 2.3 : 1.05, moonY = showId === 'night' ? 210 : 232;

    // The lens. The engine sets the world's field of view (58 degrees) every frame before update(); the lateral pass
    // narrows it to a long 32 degree lens so the layers read as one flat picture, and it opens again as the carpet
    // slips between the sheets. It is 1 at u = 0 (also the value while this world is seen through a portal) and at the exit.
    const LONG = Math.tan((32 * Math.PI) / 360) / Math.tan((58 * Math.PI) / 360);
    const lensAt = (u) => lerp(1, LONG, smoothstep(0.004, uLat * 0.75, u) * (1 - smoothstep(uSwing0 - 0.02, uSwing1 + 0.015, u)));
    const size = new THREE.Vector2(800, 450);
    const flick = (t) => 1 + 0.06 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1.0) + 0.02 * Math.sin(t * 11.3);
    function update(dt, time, camera, u) {
      U.uTime.value = time; U.uFlick.value = flick(time);
      if (ctx.renderer?.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); motes.material.uniforms.uPx.value = Math.max(0.5, size.y / 450); }
      if (camera && camera.isPerspectiveCamera) {
        const k = lensAt(u);
        if (Math.abs(k - 1) > 1e-3) { camera.fov = (2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * k) * 180) / Math.PI; camera.updateProjectionMatrix(); }
      }
      hero.update(dt, time, camera);
      path.pointAt(u, _p); hero.setProgress(clamp((-_p.z - 85) / 125, 0, 1));   // the palace parts as we pass under the elephant, so the gate and portal close the avenue
      sp.begin();
      const lead = (barges ? AX - 50 : AX) - WALK * (uBelly - u) + 7 * (1 - smoothstep(uBelly - 0.12, uBelly, u));
      for (let i = 4; i >= 0; i--) { if (barges) barge(lead + E_OFF[i] * 2.3, i === 0 ? 2.2 : 1.3 + 0.1 * i, time, i); else elephant(lead + E_OFF[i], E_S[i], time, i); }
      for (let i = 0; i < nGaz; i++) gazelle(time, i);
      leopard(time);
      for (const f of fishes) { const t = (time / f.per + f.ph) % 1; if (t < 0.3) fish(f, t / 0.3, f.x, 12, 3.5, 9); }
      const pf = (u - (uRiver - 0.035)) / 0.06; if (pf > 0 && pf < 1) fish({ dir: 1, z: -16, s: 2.4 }, pf, AX - 6, 34, 6, 17.5);
      birds(time);
      skyShip(u, time);
      for (const c of carpets) {
        const x = AX - 520 + ((((c.x0 + c.v * time) % 1040) + 1040) % 1040), y = c.y + 2.5 * Math.sin(time * 0.7 + c.ph), d = Math.sign(c.v);
        if (dAx(x) > 9) sp.put('rod', x, 0, c.z - 0.35, 0, 0.25, y - 0.2, 2);
        sp.put('carpet', x, y, c.z, d * (0.05 * Math.sin(time * 1.3 + c.ph) + 0.04), d * c.s, c.s, 2 + -c.z / 40);
      }
      const mx = moonX - time * 1.2;
      sp.put('rod', mx - 4 * moonS, moonY + 9 * moonS, SCREEN_Z + 14.6, 0, 0.5, 420, 9);
      sp.put('moon', mx, moonY, SCREEN_Z + 15, 0.25 + 0.03 * Math.sin(time * 0.4), moonS, moonS, 13);
      sp.end();
      if (rare) {
        const q = clamp((u - 0.06) / 0.34, 0, 1), f = Math.sin(q * TAU * 5), a = smoothstep(0, 0.08, q) * (1 - smoothstep(0.92, 1, q));
        for (const d of dove) { const sd = d.uPose.value.w; d.uPose.value.set(AX + lerp(300, -260, q), 105 + 30 * Math.sin(q * Math.PI) + 6 * f, sd * (0.4 + 0.5 * f), sd); d.uA.value = a; }
      }
    }
    update(0, 0, null, 0);
    await ctx.yield();

    return {
      scene, path, duration,
      pace: (u) => 1 - 0.24 * smoothstep(uLat - 0.06, uLat + 0.03, u) * (1 - smoothstep(uSwing0 - 0.02, uSwing1, u)),   // linger on the flat picture
      title: show.title,
      ride: 'magic-carpet',
      style: 'none',                                   // its own cut-paper look: no lens on top
      camera: { fov: 58, near: 0.4, far: 4600, lookAhead: 30, sway: 0.6, bank: 0.15 },
      pois: [{ at: gazeAt, from: 0, to: 1, weight: 1, fade: 0.01 }],
      portal: { shape: 'circle', radius: 6.6, color: show.portal, glow: 1.1, revealDistance: 320 },
      post: {
        exposure: 1.0,
        bloom: { strength: 0.44, radius: 0.7, threshold: 1.0 },
        grade: { saturation: 1.1, contrast: 1.06, tint: show.grade.tint, shadowTint: show.grade.shadowTint, vignette: 0.4, grain: 0.045, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
