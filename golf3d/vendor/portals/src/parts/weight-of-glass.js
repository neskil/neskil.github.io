// THE SPAN: hero set piece of "The Weight of Glass".
// One water-clear glass arch, 260 m span, crown of its back at y 95, standing in the plane z 0 with each foot fused into a
// clear abutment block (60 x 70 x 50 m, gently battered). The far block (+X) is pierced along Z by the oculus, an hourglass
// bore 30 m wide at its faces and 16 m at mid-depth, centre (152, 24, 0). Nine black ballast-walkers cross the back toward
// +X; forty glass drops swing on stalks under it; strings of seed bubbles hang inside. The only colour is photoelastic
// fringe: a nest of rings under every planted pad, bending bands between, a peacock eye at each springing, lobes round the bore.
//
// LOCAL SPACE is the brief's world space: origin at the centre of the Span at sea level (y 0), +Y up, arch along X, the
// camera enters from -Z heading +Z and climbs the +Z flank. Radius about 185 m (blocks reach x +-182), height 104 m.
//
// opts: palette (the brief's seven hex strings; [1..5] feed the fringe ramp, [0] the sheen, [6] the walkers),
//   detail 0.6..1 (below 0.8: one merged load per walker, 13 loop steps instead of 40; fewer bubbles),
//   glass 'clear' | 'smoke' | 'deep' (default: by seed), herd 'even' (no spacing jitter), drops (count),
//   lightDir (Vector3 toward the sky's bright patch; default 40 degrees up, behind and to port of +Z),
//   reflection true (adds the y-flipped copy for the sea; or call hero.makeReflection() and add the group yourself; it
//   shares every buffer and material and must draw before your sea plane: its renderOrders are 2 and 3),
//   preview true adds a pearl dome and a thin sea so the glass can be judged alone (off by default),
//   load 'nine' | 'clump' | 'giant' (the herd; the giant covers 2.5 times the ground per stride), refraction false,
//   focus [x, y, z, r, h] (viewer framing).
// Returned extras: setProgress(u) (see below), uniforms (shared by every material: uSunDir, uZen, uHor, uVeil, uGlint, uAbs,
//   uLine, uReach, uBendK, uBendW, uLoads, uLoadDir ...), herd (per walker: pos, s, w, pads[4] = [x, y, z, weight]), loads.
//
// PROGRESS: call hero.setProgress(u) with the path progress every frame. The herd then advances 125 m over the flight
//   (3 m/s at the brief's 41.5 s) and walker 0 plants a fore pad above anchors.underPass at u 0.40; at u 0.6 the crown lies
//   between two walkers, each about 20 m along the back. Never called: the herd walks on the clock at 3 m/s.
//
// ANCHORS (local): portalSeat { position (152, 24, 0), facing (0, 0, -1), radius 7 } is the throat of the oculus (the bore
//   is 8 m in radius there, so a 14 m portal fills it); flyThrough is the brief's A-G line as 23 points, about
//   716 m (entry low and near at (-104, 9, -186), under the near haunch at x -73 some 12 m below the glass, up beside the
//   +Z flank 11 m off the wall, over the crown at y 104, out over -Z, a right-hand turn of 52 m radius, straight into the
//   oculus); no drop hangs within 9.5 m of that lane;
//   entry, crown, oculus, underPass, springings[2], viewpoints { entry, underHaunch, flank, crown, eyeAndOculus, rim }.
//
// STYLE (photoelastic glass; match it for reeds, floats, far arches). No pigment and no shading: glass is drawn only as
//   changes to what is behind it, in three passes of one geometry, depthWrite off: A back faces, multiply (bottle green by
//   thickness, far-side arris lines); B front faces, multiply (fringe ramp, dark refraction line #3C4A48 along arrises and
//   where the surface curves away, lens joints every 20 m, cords, frost); C front faces, additive (Schlick sky sheen, the
//   glint of the bright patch at 1.6, chamfer glints). Multiplies draw before adds (renderOrder 10, 11, 12 / 20, 21).
//   Fringe order N is summed in a fixed loop over uLoads (point term 13 w cos / r under each pad, windowed to uReach so
//   most glass stays clear, plus a bending swell), evaluated 8 m inside the glass along the refracted view ray so bands
//   slide against the surface, looked up in a 256x1 sRGB ramp at N / 5.2, and faded to pearl #DCD6D2 where fwidth(N)
//   exceeds 0.25. Stop the walkers and every band stops. Walkers are unlit #15161B with a pearl rim; within about 60 m
//   they gain a sheen on keel and back, pale wear lines on plate edges and seams across the belly.
//   REFRACTION (pass B, no render target): the glass evaluates the world's analytic sky, veil and sea along the straight
//   sight line and along the bent one (in at the sagging front face, out at the far face, mirror on total internal
//   reflection) and multiplies by their ratio, 0.35 to 1.6: the horizon and the veil's edge step and bend inside the
//   bodies and the far arrises show twice. The world sets uVeilC, uPatch, uMistC, uMist, uVeilAmt, uSand, uDeep on
//   hero.uniforms (defaults: the pearl look); opts.refraction false turns it off. Sea mist is the same analytic layer
//   (MIST_GLSL) in every shader here.
// LIGHT: none needed (no scene lights are read). It wants a pale even sky behind it (0.74 to 0.80) and scene fog off or
//   very thin: multiply passes fade toward white and add passes toward nothing with fog and with the 1600 m veil.
// COST: 9k glass triangles drawn three times, 20k walkers, 22k drops, 1.2k bubbles: about 70k triangles and 7 draw calls
//   (about 110k and 10 with the reflection). Build about 60 ms. No lights, no render targets, one 256x1 texture.
import * as THREE from 'three';

const PALETTE = ['#CBC7C0', '#E9D58A', '#C2386A', '#2B2F86', '#2D9CC9', '#5DBF8F', '#15161B'];

// ---------- the Span's shape (local space = the brief's world space, sea at y 0) ----------
const HALF = 130, HALF_U = 104, CROWN = 95, CROWN_U = 77, ZH = 13, CH = 0.4;
const T_END = 1.03;                                   // stations run a little below the sea
const backPt = (t) => [HALF * t, CROWN * (1 - t * t)];
const underPt = (t) => [HALF_U * t, CROWN_U * (1 - t * t)];
const BLOCK = { cx: 152, hx: 30, hz: 35, top: 50, bot: -3, a: 1.4 };
const OC = { x: 152, y: 24, rFace: 15, rMid: 8 };     // the oculus bore, along Z
const srgb = (hex) => new THREE.Color(hex);           // -> linear

// ---------- the interference ramp (order N / 5.2 -> transmittance), 256x1 RGBA8 sRGB ----------
function makeRamp(pal) {
  const stops = [
    [0, '#FFFFFF'], [0.18, '#C4C7CC'], [0.40, '#FAF8F0'], [0.58, pal[1]], [0.78, '#DB8A3C'], [0.94, pal[2]],
    [1.03, pal[3]], [1.20, pal[4]], [1.40, pal[5]], [1.62, '#E2D667'], [1.84, '#E58CA8'], [2.02, '#7B58A8'],
    [2.25, '#62C3A0'], [2.6, '#E6DC9C'], [2.9, '#EBB3C4'], [3.3, '#B9E0CB'], [3.9, '#EFD0D8'], [4.5, '#D4E8DC'],
    [5.2, '#DCD6D2'],
  ].map(([n, h]) => { const c = new THREE.Color().setStyle(h, THREE.NoColorSpace); return [n, c.r, c.g, c.b]; });
  const data = new Uint8Array(256 * 4);
  for (let i = 0, k = 0; i < 256; i++) {
    const n = (i / 255) * 5.2;
    while (k < stops.length - 2 && n > stops[k + 1][0]) k++;
    const a = stops[k], b = stops[k + 1];
    let f = Math.min(1, Math.max(0, (n - a[0]) / (b[0] - a[0]))); f = f * f * (3 - 2 * f) * 0.6 + f * 0.4;
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(255 * (a[1 + c] + (b[1 + c] - a[1 + c]) * f));
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

// ---------- mesh emitter: position, normal, aE (metres to the four nearest arrises), aM (thickness, chamfer, kind, spare) ----
function makeEmitter() {
  const P = [], N = [], E = [], M = [], I = [];
  const V = (p, n, e, th, ch, kind, sp = 0) => {
    P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]);
    E.push(e[0] ?? 999, e[1] ?? 999, e[2] ?? 999, e[3] ?? 999); M.push(th, ch, kind, sp);
    return P.length / 3 - 1;
  };
  // quad a-b-c-d (any winding): wound so that its geometric normal agrees with the vertex normals
  const Q = (a, b, c, d) => {
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az;
    const vx = P[d * 3] - ax + P[c * 3] - P[b * 3], vy = P[d * 3 + 1] - ay + P[c * 3 + 1] - P[b * 3 + 1], vz = P[d * 3 + 2] - az + P[c * 3 + 2] - P[b * 3 + 2];
    const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
    const nx = N[a * 3] + N[c * 3], ny = N[a * 3 + 1] + N[c * 3 + 1], nz = N[a * 3 + 2] + N[c * 3 + 2];
    if (gx * nx + gy * ny + gz * nz >= 0) I.push(a, b, c, a, c, d); else I.push(a, c, b, a, d, c);
  };
  const build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 4));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(M, 4));
    g.setIndex(I);
    return g;
  };
  return { V, Q, build, P };
}
const nrm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };

// ---------- the Span: a chamfered section swept along the parabola ----------
function emitSpan(em, steps) {
  const rows = [];
  for (let i = 0; i <= steps; i++) {
    const t = -T_END + (2 * T_END * i) / steps, h = 1e-3;
    const b = backPt(t), u = underPt(t), b2 = backPt(t + h), u2 = underPt(t + h);
    const nb = nrm(-(b2[1] - b[1]), b2[0] - b[0], 0), nu = nrm(u2[1] - u[1], -(u2[0] - u[0]), 0);
    const dx = b[0] - u[0], dy = b[1] - u[1], th = Math.hypot(dx, dy), D = [dx / th, dy / th];
    const at = (d, z) => [u[0] + D[0] * d, u[1] + D[1] * d, z];
    const W = 2 * ZH - 2 * CH, Hh = th - 2 * CH, c = CH, row = [];
    // eight faces round the section: back, four chamfers, two flanks, underside (each with its own two verts)
    const face = (p0, p1, n, w, ch, thick) => row.push([em.V(p0, n, [0, w], thick, ch, 0), em.V(p1, n, [w, 0], thick, ch, 0)]);
    face(at(th, -ZH + c), at(th, ZH - c), nb, W, 0, th);
    face(at(th, ZH - c), at(th - c, ZH), nrm(nb[0], nb[1], 1), 0.57, 1, th);
    face(at(th - c, ZH), at(c, ZH), [0, 0, 1], Hh, 0, 2 * ZH);
    face(at(c, ZH), at(0, ZH - c), nrm(nu[0], nu[1], 1), 0.57, 1, th);
    face(at(0, ZH - c), at(0, -ZH + c), nu, W, 0, th);
    face(at(0, -ZH + c), at(c, -ZH), nrm(nu[0], nu[1], -1), 0.57, 1, th);
    face(at(c, -ZH), at(th - c, -ZH), [0, 0, -1], Hh, 0, 2 * ZH);
    face(at(th - c, -ZH), at(th, -ZH + c), nrm(nb[0], nb[1], -1), 0.57, 1, th);
    rows.push(row);
  }
  for (let i = 0; i < steps; i++) for (let f = 0; f < 8; f++) {
    const a = rows[i][f], b = rows[i + 1][f];
    em.Q(a[0], a[1], b[1], b[0]);
  }
}

// ---------- abutment blocks: chamfered (soft-arris) boxes; the far one is pierced along Z by the oculus ----------
function emitBlock(em, sx, kind, bored) {
  const B = BLOCK, a = B.a, C = [sx * B.cx, (B.top + B.bot) / 2, 0], H = [B.hx, (B.top - B.bot) / 2, B.hz];
  const first = em.P.length / 3;
  const list = (h, n) => { const o = [-h, -(h - a)]; for (let i = 1; i < n; i++) o.push(-(h - a) + (2 * (h - a) * i) / n); o.push(h - a, h); return o; };
  const plain = (w, sg) => {
    const u = (w + 1) % 3, v = (w + 2) % 3, lu = list(H[u], 6), lv = list(H[v], 6), idx = [];
    for (const uu of lu) {
      const row = [];
      for (const vv of lv) {
        const p = [0, 0, 0], n = [0, 0, 0]; let drop = 0, ch = 0;
        p[u] = uu; p[v] = vv; n[w] = sg;
        if (Math.abs(uu) >= H[u] - 1e-6) { p[u] = Math.sign(uu) * (H[u] - a / 2); n[u] = Math.sign(uu); drop = a / 2; ch = 1; }
        if (Math.abs(vv) >= H[v] - 1e-6) { p[v] = Math.sign(vv) * (H[v] - a / 2); n[v] = Math.sign(vv); drop = a / 2; ch = 1; }
        p[w] = sg * (H[w] - drop);
        const e = [Math.max(0, H[u] - a - Math.abs(uu)), Math.max(0, H[v] - a - Math.abs(vv))];
        row.push(em.V([C[0] + p[0], C[1] + p[1], C[2] + p[2]], nrm(n[0], n[1], n[2]), e, 2 * H[w], ch, kind));
      }
      idx.push(row);
    }
    for (let i = 0; i + 1 < idx.length; i++) for (let j = 0; j + 1 < idx[i].length; j++) em.Q(idx[i][j], idx[i][j + 1], idx[i + 1][j + 1], idx[i + 1][j]);
  };
  plain(0, 1); plain(0, -1); plain(1, 1);
  if (!bored) { plain(2, 1); plain(2, -1); }
  else {
    const oy = OC.y - C[1], hx = H[0] - a, hy = H[1] - a, angs = [];
    for (let k = 0; k < 72; k++) angs.push((k / 72) * Math.PI * 2 - Math.PI);
    for (const cxs of [-1, 1]) for (const cys of [-1, 1]) angs.push(Math.atan2(cys * hy - oy, cxs * hx));
    angs.sort((p, q) => p - q);
    const K = angs.length;
    for (const sg of [1, -1]) {
      const rings = [];
      for (let k = 0; k < K; k++) {
        const ca = Math.cos(angs[k]), sa = Math.sin(angs[k]);
        const tx = ca > 1e-9 ? hx / ca : ca < -1e-9 ? -hx / ca : 1e9, ty = sa > 1e-9 ? (hy - oy) / sa : sa < -1e-9 ? (-hy - oy) / sa : 1e9;
        const tb = Math.min(tx, ty), bx = ca * tb, by = oy + sa * tb, col = [];
        for (let j = 0; j <= 4; j++) {
          const f = j / 4, r = OC.rFace + (tb - OC.rFace) * f;
          const x = j < 4 ? ca * r : bx, y = j < 4 ? oy + sa * r : by;
          col.push(em.V([C[0] + x, C[1] + y, sg * H[2]], [0, 0, sg], [Math.max(0, hx - Math.abs(x)), Math.max(0, hy - Math.abs(y)), r - OC.rFace], 2 * H[2], 0, kind));
        }
        const onU = Math.abs(bx) >= hx - 1e-4, onV = Math.abs(by) >= hy - 1e-4;   // the chamfer midline ring
        col.push(em.V([C[0] + bx + (onU ? Math.sign(bx) * a / 2 : 0), C[1] + by + (onV ? Math.sign(by) * a / 2 : 0), sg * (H[2] - a / 2)],
          nrm(onU ? Math.sign(bx) : 0, onV ? Math.sign(by) : 0, sg), [0, 0, 50], 2 * H[2], 1, kind));
        rings.push(col);
      }
      for (let k = 0; k < K; k++) for (let j = 0; j < 5; j++) { const A = rings[k], Bc = rings[(k + 1) % K]; em.Q(A[j], A[j + 1], Bc[j + 1], Bc[j]); }
    }
    const Mz = 14, bore = [];                                 // the bore: an hourglass of revolution about Z
    for (let k = 0; k < K; k++) {
      const ca = Math.cos(angs[k]), sa = Math.sin(angs[k]), col = [];
      for (let m = 0; m <= Mz; m++) {
        const z = H[2] * (1 - (2 * m) / Mz), zn = z / H[2], r = OC.rMid + (OC.rFace - OC.rMid) * zn * zn;
        const dr = (2 * (OC.rFace - OC.rMid) * zn) / H[2];
        col.push(em.V([C[0] + ca * r, OC.y + sa * r, z], nrm(-ca, -sa, dr), [(H[2] - Math.abs(z)) * 1.1], 22, 0, kind, 1));
      }
      bore.push(col);
    }
    for (let k = 0; k < K; k++) for (let m = 0; m < Mz; m++) { const A = bore[k], Bc = bore[(k + 1) % K]; em.Q(A[m], A[m + 1], Bc[m + 1], Bc[m]); }
  }
  // a gentle batter: the block narrows toward its top (the bore keeps its round section)
  const P = em.P;
  for (let i = first * 3; i < P.length; i += 3) {
    const yn = Math.min(1, Math.max(0, P[i + 1] / B.top));
    let wb = 1;
    if (bored) { const rho = Math.hypot(P[i] - OC.x, P[i + 1] - OC.y); const s = Math.min(1, Math.max(0, (rho - 16) / 13)); wb = s * s * (3 - 2 * s); }
    P[i] = C[0] + (P[i] - C[0]) * (1 - 0.09 * yn * wb);
    P[i + 2] *= 1 - 0.07 * yn;
  }
}

// sea mist (one of the world's looks, uMist 0..1): a layer 9 m deep on the water; how much of it a sight line crosses
const MIST_GLSL = /* glsl */`
float mistSeg(vec3 eye, vec3 P) {
  vec3 d = P - eye; float len = length(d), py = abs(P.y);
  float T = 9.0 + 0.034 * length(d.xz);                    // the top of the layer as seen from here: it stands taller with distance
  float y0 = min(eye.y, py), y1 = max(eye.y, py), dy = y1 - y0;
  float inside = max(min(y1, T) - min(y0, T), 0.0);
  float frac = dy > 0.01 ? clamp(inside / max(dy, 0.01), 0.0, 1.0) : 1.0 - step(T, y0);
  float band = 1.0 - smoothstep(0.55 * T, 1.05 * T, py);  // a clean top: what stands above the band is clear
  return (1.0 - exp(-max(len * frac - 35.0, 0.0) / 120.0)) * band;
}
`;

// ---------- glass shaders ----------
const GLASS_VERT = /* glsl */`
attribute vec4 aE; attribute vec4 aM;
varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying vec3 vWP; varying vec3 vWN; varying vec4 vE; varying vec4 vM;
#include <fog_pars_vertex>
void main() {
  vP = position; vN = normal; vE = aE; vM = aM;
  vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * normal;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// fringe order N at a point q inside the glass (object space). Every term is tied to a load, a support or the bore.
const FRINGE_GLSL = /* glsl */`
uniform vec4 uLoads[NL];      // xyz contact point, w weight
uniform vec4 uLoadDir[NL];    // xyz unit push direction, w = how much Z counts: 1 point load (pads), 0 line load along Z (the supports, last four)
uniform sampler2D uRamp;
uniform float uOcu;           // how hard the far haunch is leaning on the pierced abutment (0.5..1.5)
uniform vec2 uReach;         // metres a pad's nest / a support's eye reaches
uniform float uBendW, uBendK; // half-width (m) and gain of each walker's bending swell
// section coordinates of the Span at q: x = t (-1..1 along the arch), y = c (-1 underside .. 1 back)
vec2 spanTC(vec3 q) {
  float t0 = clamp(q.x / 117.0, -1.03, 1.03);
  float yb = 95.0 * (1.0 - t0 * t0), yu = 77.0 * (1.0 - t0 * t0);
  float f = clamp((q.y - yu) / max(yb - yu, 2.0), 0.0, 1.0);
  float t = clamp(q.x / mix(104.0, 130.0, f), -1.03, 1.03);
  yb = 95.0 * (1.0 - t * t); yu = 77.0 * (1.0 - t * t);
  f = clamp((q.y - yu) / max(yb - yu, 2.0), 0.0, 1.0);
  return vec2(t, f * 2.0 - 1.0);
}
float arcOf(float t) {         // metres along the arch midline from the crown
  float k = 1.4615, a = abs(t) * k;
  return sign(t) * 65.0 * (abs(t) * sqrt(1.0 + a * a) + log(a + sqrt(a * a + 1.0)) / k);
}
// sup: 1 where the body is seen through a face square to Z (or the bore wall), where the supports' and the bore's
// plane patterns read as eyes and lobes; 0 on faces that would only show them edge-on as stripes
float fringeOrder(vec3 q, float kind, float c, float sup) {
  float pt = 0.0, bend = 0.0, isSpan = 1.0 - step(0.5, kind);
  for (int i = 0; i < NL; i++) {
    vec4 L = uLoads[i]; vec4 D = uLoadDir[i];
    float pad = step(0.5, D.w), gate = 1.0;
    if (i >= NL - 4) gate = sup * ((i < NL - 2) ? isSpan : 1.0 - isSpan);     // foot reactions live in the Span, block reactions in the blocks
    vec3 v = q - L.xyz; v.z *= D.w;
    float r = max(length(v), 0.8);
    float reach = mix(uReach.y, uReach.x, pad);            // each load's bands end: most of the glass stays clear
    pt += gate * 13.0 * L.w * max(dot(v, D.xyz), 0.0) / (r * r) * (1.0 - smoothstep(0.45 * reach, reach, r));
    bend += pad * L.w * max(0.0, 1.0 - abs(q.x - L.x) / uBendW);
  }
  float n = pt + uBendK * abs(c + 0.25) * bend * isSpan;
  if (kind > 1.5) {            // the oculus: bands pinch into lobes round the bore
    vec2 d = q.xy - vec2(152.0, 24.0);
    float a = 15.0, d2 = max(dot(d, d), 1.0), rho2 = max(d2, 64.0);
    float c2 = (d.x * d.x - d.y * d.y) / d2;             // cos 2 phi: the bands pinch on the sides in line with the thrust
    n += sup * 1.7 * uOcu * (a * a / rho2) * (1.0 + 0.6 * c2) * (1.0 - smoothstep(1.1 * a, 1.9 * a, sqrt(rho2))) * mix(1.0, 0.44, clamp(vM.w, 0.0, 1.0));   // on the bore wall the lobes tighten toward the throat, like grain round a knot
    { vec2 wv = vP.xy - vec2(152.0, 24.0); float w2 = max(dot(wv, wv), 64.0), wr = sqrt(w2), s0 = min(0.6 + 0.1 * max(12.0 - wr, 0.0), 0.95); n += clamp(vM.w, 0.0, 1.0) * 0.52 * clamp((wr - 8.5) / 2.5, 0.0, 1.0) * smoothstep(s0, min(s0 + 0.25, 1.0), wv.y * wv.y / w2); }   // the block's own dead weight on the hole, read from the wall's own shape alone. It shows where the herd's load never reaches, at the crown and the invert: a still order of 0.52 (straw) within about 23 degrees of the plumb line through the axis, falling to nothing 39 degrees from it and at the hole's two sides; full from the mouth in to wall radius 11, then narrowing toward the plumb line and fading to nothing at radius 8.5, short of the throat. Under it the order above reaches 0.17 at the mouth and 0.38 at the lobe's edge, so the sum stays in straw and orange (0.89 at most) and never enters the indigo and blue
  }
  return n;
}
vec3 rampColor(float n, float fw) {
  vec3 col = texture2D(uRamp, vec2(clamp(n, 0.0, 5.2) / 5.2, 0.5)).rgb;
  return mix(col, vec3(0.716, 0.672, 0.638), smoothstep(0.25, 0.6, fw));   // #DCD6D2, linear
}
float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

// THE TIDAL FLAT, shared by the world's sea and by the glass's refracted view of it: long sand bars and channels that
// sweep in roughly parallel curves (axis 0.8, 0.6), a regular beat of bars broken up by two stretched noises.
// seaBars: 0 on the crest of a bar (sand barely awash) .. 1 in the bed of a channel.
export const SEA_BARS_GLSL = /* glsl */`
float sbH(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float sbN(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(sbH(i), sbH(i + vec2(1.0, 0.0)), f.x), mix(sbH(i + vec2(0.0, 1.0)), sbH(i + vec2(1.0, 1.0)), f.x), f.y);
}
float seaBars(vec2 p) {
  vec2 a = vec2(0.80 * p.x + 0.60 * p.y, -0.60 * p.x + 0.80 * p.y);
  float c = a.y + 30.0 * sin(a.x * 0.0105 + 1.3) + 22.0 * sin(a.x * 0.0041 + a.y * 0.0031) + 56.0 * (sbN(a * 0.0037 + 5.0) - 0.5);
  float big = sbN(vec2(a.x * 0.0052, c * 0.017) + 3.0), mid = sbN(vec2(a.x * 0.014, c * 0.045) + 9.0);
  float tri = abs(fract((c + 108.0) / 78.0) - 0.5) * 2.0;        // 1 down the middle of a channel, 0 on a crest; a bar every 78 m
  return clamp(0.5 + 0.62 * (tri - 0.5) + 0.62 * (big - 0.5) + 0.30 * (mid - 0.5), 0.0, 1.0);   // the noises pinch bars out and braid the channels
}
`;

// THE RAIN BAND, shared by the world's sky dome and by the glass's bent view of it: a low dark deck of cloud standing
// all round the horizon (tallest ahead, +Z) with a flat base, curtains of rain hanging from the base to the sea, leaning
// a little down the wind, and gaps of light between the curtains. Azimuth only ever enters as the unit vector h, so
// nothing is stretched or seamed anywhere round the horizon. Returns x: how much of the band's tone covers the sky here,
// y: 1 in the deck, 0 in a curtain below it.
export const VEIL_GLSL = /* glsl */`
float rbH(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float rbN(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(rbH(i), rbH(i + vec2(1.0, 0.0)), f.x), mix(rbH(i + vec2(0.0, 1.0)), rbH(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec2 rainBand(vec3 d, float time) {
  float y = abs(d.y);
  vec2 h = d.xz / max(length(d.xz), 1e-3);
  float ba = 0.5 + 0.5 * smoothstep(-0.25, 0.75, h.y);
  float n1 = rbN(h * 2.6 + 11.7), n2 = rbN(h * 6.0 + 4.0);
  float base = (0.050 + 0.036 * n1) * ba, top = (0.160 + 0.070 * n2 + 0.025 * n1) * ba;
  float under = 1.0 - smoothstep(base - 0.003, base + 0.009, y);
  float deck = (1.0 - under) * (1.0 - smoothstep(top * 0.74, top, y));
  float sl = (base - y) * 2.4, cs = cos(sl), sn = sin(sl);
  vec2 hr = vec2(h.x * cs - h.y * sn, h.x * sn + h.y * cs);
  float cur = smoothstep(0.39, 0.47, 0.62 * rbN(hr * 5.0 + vec2(time * 0.006, 2.0)) + 0.38 * rbN(hr * 13.0 + 7.0));     // rain along most of the band, gaps of light between
  float fib = 0.84 + 0.16 * rbN(hr * 44.0 + vec2(3.0, y * 22.0 + time * 0.55));      // fibres of rain sliding down the curtain
  float shaft = cur * under * (0.84 + 0.16 * smoothstep(0.0, max(base, 1e-3), y)) * fib;   // a curtain thins toward the sea
  return vec2(max(deck, shaft), deck);
}
`;

// REFRACTION without a render target. The world's sky, rain veil and sea are analytic, so the glass evaluates them
// along the straight sight line and along the bent one (in at the front face, out at the far face, total internal
// reflection where the far face is met too obliquely) and passes the ratio (multiply pass) and the gain (additive pass).
// Faces sag a little like any cast block (a weak lens), so the horizon and the veil's edge step at every silhouette.
const REFR_GLSL = /* glsl */`
uniform vec3 uVeilC, uPatch, uMistC, uSand, uDeep; uniform float uVeilAmt, uRefr;
uniform mat4 modelMatrix;
${SEA_BARS_GLSL}
${VEIL_GLSL}
vec3 envSky(vec3 d) {
  float y = abs(d.y);
  vec3 c = mix(uHor, uZen, smoothstep(0.0, 0.6, y));
  float s = max(dot(vec3(d.x, y, d.z), uSunDir), 0.0); c += uPatch * s * s * s;
  vec2 rb = rainBand(d, uTime);
  c = mix(c, uVeilC * mix(0.98, 0.88, rb.y), 0.94 * rb.x * uVeilAmt);
  c = mix(c, uMistC, 0.4 * (1.0 - uMist) * (1.0 - smoothstep(0.002, 0.013, y)));       // the thin pale line of haze on the horizon
  return mix(c, uMistC, uMist * (1.0 - smoothstep(0.034, 0.078, y)));
}
vec3 envAt(vec3 o, vec3 d) {
  if (d.y > -1e-3 || o.y < 0.05) return envSky(d);
  float up = clamp(-d.y, 0.0, 1.0), t = min(o.y / max(up, 1e-3), 4000.0);
  vec2 p = o.xz + d.xz * t;
  float fwE = t * uPix / max(up, 0.02);
  float dnE = seaBars(p), lodE = 1.0 - smoothstep(10.0, 36.0, fwE);
  float deep = mix(0.5, smoothstep(0.465, 0.515, dnE), lodE);
  vec3 col = mix(mix(uSand, uDeep * 1.45 + vec3(0.0, 0.012, 0.010), 0.06 + 0.80 * deep), uDeep * 0.92, 0.75 * mix(0.3, smoothstep(0.53, 0.82, dnE), lodE));
  float farS = 1.0 - exp(-t / 1300.0);
  col = mix(col, mix(uDeep, uHor, 0.2) * 0.62, farS);
  float a = mix(mix(0.36, 0.60, deep), 0.94, smoothstep(0.03, 0.45, up)); a = mix(a, 0.86, farS);
  float mi = 0.92 * uMist * (1.0 - exp(-max(min(t, 9.0 / max(up, 0.002)) - 35.0, 0.0) / 120.0));
  col = mix(col, uMistC, mi); a = mix(a, 1.0, mi);
  return mix(envSky(vec3(d.x, -d.y, d.z)), col, a);
}
// the sag of a cast face: a vector that grows from the middle of the body toward its arrises
vec3 sagAt(vec3 p, float kind) {
  if (kind < 0.5) { vec2 tc = spanTC(p); return tc.y * normalize(vec3(0.0112 * p.x, 1.0, 0.0)) + vec3(0.0, 0.0, p.z / 13.0); }
  return (p - vec3(kind < 1.5 ? -152.0 : 152.0, 23.5, 0.0)) / vec3(30.0, 26.5, 35.0);
}
vec3 sagNormal(vec3 n, vec3 p, float kind) {
  vec3 g = sagAt(p, kind); g -= n * dot(g, n);
  return normalize(n + 0.11 * g + 0.012 * sin(p.yzx * vec3(0.23, 0.31, 0.19) + p.zxy * 0.13));
}
// where the bent ray leaves the body, the outward normal there and the metres to the nearest far arris
float gConf = 1.0;      // how well the exit point is known (the Span's section walk may not close at glancing rays)
void glassExit(vec3 p0, vec3 rd, float kind, out vec3 pe, out vec3 ne, out float e2) {
  if (kind < 0.5) {                                   // the Span: walk its section from the inside
    float L = 0.0, th = 20.0; vec2 tc = vec2(0.0);
    for (int i = 0; i < 7; i++) {
      vec3 q = p0 + rd * L; tc = spanTC(q); th = 18.0 + 8.0 * tc.x * tc.x;
      L += max(min((1.0 - abs(tc.y)) * 0.4 * th, 13.0 - abs(q.z)), 0.3);
    }
    pe = p0 + rd * L; tc = spanTC(pe); th = 18.0 + 8.0 * tc.x * tc.x;
    float dz = 13.0 - abs(pe.z), dc = (1.0 - abs(tc.y)) * 0.5 * th;
    gConf = 1.0 - smoothstep(0.6, 3.0, min(dz, dc));
    if (dz < dc) { ne = vec3(0.0, 0.0, pe.z < 0.0 ? -1.0 : 1.0); e2 = dc; }
    else { ne = normalize(vec3((tc.y > 0.0 ? 0.01124 : 0.01424) * pe.x, 1.0, 0.0)) * (tc.y > 0.0 ? 1.0 : -1.0); e2 = dz; }
  } else {                                            // a block: a battered box (the bore of the far one is ignored: its wall keeps its own quiet look)
    vec3 C = vec3(kind < 1.5 ? -152.0 : 152.0, 23.5, 0.0), o = p0 - C;
    float yn = clamp(p0.y / 50.0, 0.0, 1.0);
    vec3 H = vec3(30.0 * (1.0 - 0.09 * yn), 26.5, 35.0 * (1.0 - 0.07 * yn));
    vec3 sg = vec3(rd.x < 0.0 ? -1.0 : 1.0, rd.y < 0.0 ? -1.0 : 1.0, rd.z < 0.0 ? -1.0 : 1.0);
    vec3 tf = max((H - o * sg) / max(abs(rd), vec3(1e-4)), vec3(0.0));
    float tE = min(tf.x, min(tf.y, tf.z));
    ne = tf.x <= tE ? vec3(sg.x, 0.0, 0.0) : (tf.y <= tE ? vec3(0.0, sg.y, 0.0) : vec3(0.0, 0.0, sg.z));
    pe = p0 + rd * tE;
    vec3 m = H - abs(pe - C) + abs(ne) * 999.0; e2 = min(m.x, min(m.y, m.z));
  }
}
// e0: the scene along the straight sight line; e1: along the bent one; e2: metres to a far arris; len: metres of glass crossed
void refractEnv(vec3 P, vec3 V, vec3 n, float kind, out vec3 e0, out vec3 e1, out float e2, out float len) {
  vec3 rd = refract(-V, sagNormal(n, P, kind), 0.6667);
  rd = normalize(rd + vec3(0.0, 1e-5, 0.0));
  vec3 pe, ne; glassExit(P, rd, kind, pe, ne, e2);
  ne = sagNormal(ne, pe, kind);
  vec3 ro = refract(rd, -ne, 1.5);
  if (dot(ro, ro) < 0.25) ro = reflect(rd, ne);       // total internal reflection: the far face is a mirror
  mat3 M = mat3(modelMatrix);
  len = distance(P, pe);
  e0 = envAt((modelMatrix * vec4(P, 1.0)).xyz, normalize(M * (-V)));
  e1 = envAt((modelMatrix * vec4(pe, 1.0)).xyz, normalize(M * ro + vec3(0.0, 1e-5, 0.0)));
}
`;

const GLASS_FRAG = /* glsl */`
uniform float uTime, uPix, uVeil, uGlint, uMist, uGraze, uArr; uniform vec3 uAbs;
uniform vec3 uSunDir, uZen, uHor, uLine;
varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying vec3 vWP; varying vec3 vWN; varying vec4 vE; varying vec4 vM;
#include <fog_pars_fragment>
${FRINGE_GLSL}
${MIST_GLSL}
#ifdef REFR
${REFR_GLSL}
#else
uniform vec3 uSand;
#endif
void main() {
  vec3 Vv = vCam - vP; float dist = max(length(Vv), 1e-3); vec3 V = Vv / dist;
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0));
  #if PASS == 0
    n = -n;
  #endif
  float ndv = abs(dot(n, V)), px = dist * uPix;
  float e = min(min(vE.x, vE.y), min(vE.z, vE.w));
  float lw = max(0.16, 1.7 * px);
  float arris = (1.0 - smoothstep(lw * 0.4, lw, e)) * (1.0 - clamp(vM.y, 0.0, 1.0)) * clamp(0.16 / (1.7 * px), 0.3, 1.0);
  float sil = smoothstep(0.06, 0.22, ndv);
  vec2 ts = spanTC(vP);
  float isSpan = 1.0 - step(0.5, vM.z);
  // frost: the tide band at the waterline and two lanes worn along the Span's back
  float nz = vnoise(vP.xz * 0.9 + vP.y * 0.7) * 0.6 + vnoise(vP.xz * 3.7 + vP.y * 2.9) * 0.4;
  float tide = (1.0 - smoothstep(0.9, 2.6, vP.y + nz * 1.5)) * (0.75 + 0.25 * nz);
  float lane = (1.0 - smoothstep(0.9, 1.7, abs(abs(vP.z) - 3.6))) * isSpan * step(0.985, ts.y) * step(0.2, vN.y);
  lane *= 0.45 + 0.55 * vnoise(vec2(arcOf(ts.x) * 0.55, vP.z * 1.3));
  float fogF = 0.0;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  float veil = 1.0 - (1.0 - fogF) * exp(-dist / uVeil) * (1.0 - 0.92 * uMist * mistSeg(cameraPosition, vWP));
  #if PASS == 0
    // back faces, multiply: bottle green by thickness, and the far-side arrises seen through the body
    vec3 col = exp(-min(vM.x, 34.0) * uAbs);
    float inBore = (1.0 - smoothstep(31.0, 41.0, abs(vCam.z))) * (1.0 - step(16.0, abs(vCam.x - 152.0))) * step(1.5, vM.z);
    col *= mix(vec3(1.0), uLine, arris * 0.5 * (1.0 - 0.7 * inBore));
    col *= mix(uLine, vec3(1.0), mix(mix(0.85, 0.955, inBore), 0.45, vM.w) + mix(mix(0.15, 0.045, inBore), 0.55, vM.w) * sil);
        gl_FragColor = vec4(mix(col, vec3(1.0), veil), 1.0);
  #elif PASS == 1
    // front faces, multiply: fringe colour inside the glass, refraction line, joints, cords
    vec3 rd = refract(-V, n, 0.66);
    vec3 q = vP + rd * min(vM.x * 0.5, 8.0) * smoothstep(0.0, uArr, e);
    // the supports' plane patterns show only through faces square to Z, and die away toward that face's arrises and
    // at glancing angles, so no band ever stops at a straight edge
    float eF = smoothstep(0.3, 3.5, min(vE.x, vE.y));
    float wall = clamp(vM.w, 0.0, 1.0) * (1.0 - smoothstep(45.0, 110.0, dist)) * (0.34 + 0.66 * (1.0 - smoothstep(3.0, 24.0, abs(q.z))));   // the bore wall carries its bands for a lens near or inside the bore; they gather toward the throat
    float sup = max(smoothstep(0.3, 0.8, abs(n.z)) * eF * smoothstep(0.15, 0.5, ndv), wall);
    float N = fringeOrder(q, vM.z, spanTC(q).y, sup);
    // looked along at a glancing angle the worn back mirrors the sky: the nests close up round the pads
    float graze = uGraze * isSpan * step(0.2, vN.y) * step(0.9, ts.y);
    N *= 1.0 - graze * (1.0 - smoothstep(0.12, 0.55, ndv));
    vec3 col = rampColor(N, fwidth(N));
    col = mix(col, vec3(1.0), graze * (1.0 - smoothstep(0.3, 0.9, ndv)));     // and what colour is left pales: never an oil slick over the whole back
    #ifdef REFR
      vec3 e0, e1; float e2, glen; refractEnv(vP, V, n, vM.z, e0, e1, e2, glen);
      // toward the Span's feet the section walk no longer closes (it stepped into hard chevrons there): the bend eases off
      float footK = 1.0 - isSpan * smoothstep(0.58, 0.8, abs(ts.x));
      float exitK = gConf * smoothstep(0.0, 4.5, e2) * mix(1.0, smoothstep(0.08, 0.4, ndv), isSpan);     // no hard step where the exit face changes or the walk has not closed
      col *= mix(vec3(1.0), clamp(e1 / max(e0, vec3(0.02)), 0.42, 1.6), uRefr * footK * exitK * (1.0 - clamp(vM.w, 0.0, 1.0)));   // a factor, above 1 where the bent ray finds a brighter scene (the target is HDR): a walker behind the glass stays black
      float l2 = max(0.2, 1.7 * px);                                       // the far arrises again, where the bent ray meets them
      col *= mix(vec3(1.0), uLine, (1.0 - smoothstep(l2 * 0.4, l2, e2)) * 0.45 * footK * clamp(0.2 / (1.7 * px), 0.3, 1.0));
      col *= 1.0 - 0.10 * smoothstep(8.0, 70.0, glen);                     // a little darker through the thick middle
    #endif
    float jd = abs(fract(arcOf(ts.x) / 20.0) - 0.5) * 20.0, jw = max(0.05, 1.2 * px);
    col *= mix(vec3(1.0), uLine, (1.0 - smoothstep(jw * 0.4, jw, jd)) * isSpan * 0.4 * clamp(0.05 / (1.2 * px), 0.2, 1.0));
    vec3 q2 = vP + rd * min(vM.x * 0.5, 13.0);
    float g2 = q2.x * 0.19 + q2.z * 0.13 + 1.7 * sin(q2.y * 0.045 + q2.z * 0.11);
    float cord = (1.0 - smoothstep(0.0, 0.03 + px * 0.35, abs(fract(g2) - 0.5))) * step(0.5, hash21(vec2(floor(g2), 3.0)));
    col *= 1.0 - 0.09 * cord;
    col *= mix(uLine, vec3(1.0), mix(0.78 + 0.22 * sil, sil, vM.w));   // the full dark refraction line only where the surface curves away
    // the bore wall is turned in rings 3.5 m apart, each a thick lens seen at a glancing angle: a dark refraction line
    // on its outer side, shading away from it, and the throat a darker ring round the portal
    float wl = clamp(vM.w, 0.0, 1.0) * (1.0 - smoothstep(70.0, 150.0, dist));
    float fzr = fract(abs(vP.z) / 3.5), dzr = min(fzr, 1.0 - fzr) * 3.5, rw = max(0.09, 1.5 * px);
    col *= mix(vec3(1.0), uLine, wl * (1.0 - smoothstep(rw * 0.4, rw, dzr)) * 0.85 * clamp(0.09 / (1.5 * px), 0.4, 1.0));
    col *= 1.0 - wl * (0.20 * (1.0 - smoothstep(0.0, 0.55, fzr)) + 0.26 * (1.0 - smoothstep(1.0, 17.0, abs(vP.z))));
    col *= mix(vec3(1.0), uLine, arris * 0.85);
    col = mix(col, vec3(0.80, 0.81, 0.80), 0.5 * lane + 0.4 * tide);   // frost greys whatever shows through it
    gl_FragColor = vec4(mix(col, vec3(1.0), veil), 1.0);
  #else
    // front faces, additive: sky sheen, the glint of the bright patch, chamfer glints, frost
    vec3 wn = normalize(vWN + 0.02 * sin(vWP.yzx * vec3(0.37, 0.53, 0.29) + vWP.zxy * 0.21) + vec3(0.0, 1e-5, 0.0));
    vec3 wV = normalize(cameraPosition - vWP + vec3(0.0, 1e-4, 0.0));
    vec3 R = reflect(-wV, wn);
    float fz = 1.0 - clamp(abs(dot(wn, wV)), 0.0, 1.0), f2 = fz * fz;
    float F = min(0.04 + 0.96 * f2 * f2 * fz, 0.45) * smoothstep(0.0, 0.2, 1.0 - fz);
    float wlC = clamp(vM.w, 0.0, 1.0) * (1.0 - smoothstep(70.0, 150.0, dist)), fzC = fract(abs(vP.z) / 3.5), shC = smoothstep(0.45, 1.0, fzC);
    F = mix(F, 0.04 + 0.30 * f2 * fz + 0.15 * shC * shC, wlC);        // the bore wall: a grazing mirror, brightest on the inner side of each ring
    vec3 sky = mix(uHor, uZen, smoothstep(0.0, 0.6, abs(R.y)));
    sky = mix(sky, uSand * 0.9, 0.85 * (1.0 - smoothstep(-0.2, 0.02, R.y)));    // a face that mirrors downward mirrors the sea, which is darker: undersides seen from below keep their depth
    float sd = max(dot(vec3(R.x, abs(R.y), R.z), uSunDir), 0.0);
    float s2 = sd * sd, s4 = s2 * s2, s8 = s4 * s4;
    vec3 col = F * sky * (0.8 + 0.5 * s4);
    float ch = clamp(vM.y, 0.0, 1.0);
    // ARRIS GLINTS: a rounded arris always holds one normal that mirrors the bright patch, so every arris that turns
    // toward the patch carries a fine white line (never under ~1.7 px, the only pixels that bloom), brightest where the
    // half vector lies in the arris's own section plane: it slides along the arch as the lens moves.
    float isBlk = step(0.5, vM.z), onCh = step(0.01, ch);
    float dA = mix(e + mix(0.28, 0.7, isBlk), mix(max(0.285 - e, 0.0), (1.0 - ch) * 0.7, isBlk), onCh);       // metres to the middle of the nearest arris
    float gw = 1.25 * px;                                                             // 2-3 px wide however close or far the arris is
    float fineK = clamp(7.0 * px, 0.0, 1.0);                                           // 0 close to (a chamfer many pixels wide), 1 far off
    float lineM = 1.0 - smoothstep(gw * 0.45, gw, dA), lineK = mix(lineM, 1.0, fineK);
    vec3 wn0 = normalize(vWN + vec3(0.0, 1e-5, 0.0));
    vec3 dpx = dFdx(vWP), dpy = dFdy(vWP); float ex = dFdx(e), ey = dFdy(e);
    vec3 cb = cross(dpy, wn0), ca = cross(wn0, dpx); float det = dot(dpx, cb);
    vec3 ge = (ex * cb + ey * ca) / (abs(det) > 1e-9 ? det : 1e-9);                  // which way the arris lies, in the face
    float gl2 = dot(ge, ge);
    vec3 tOut = (gl2 > 0.04 && gl2 < 25.0) ? -ge * inversesqrt(max(gl2, 1e-4)) * (1.0 - onCh) : vec3(0.0);
    vec3 aN = normalize(wn0 + tOut);
    vec3 Hh = normalize(uSunDir + wV + vec3(0.0, 1e-4, 0.0));
    float hn = dot(Hh, wn0), ht = dot(Hh, tOut);
    float inPl = clamp(mix(sqrt(hn * hn + ht * ht) * smoothstep(-0.1, 0.15, hn) * smoothstep(-0.1, 0.15, ht), max(dot(Hh, aN), 0.0), onCh), 0.0, 1.0);
    float sp2 = inPl * inPl, sp8 = sp2 * sp2 * sp2 * sp2, sp32 = sp8 * sp8 * sp8 * sp8;
    float lit = smoothstep(0.20, 0.75, dot(aN, uSunDir));
    col += uGlint * 0.5 * pow(sd, 420.0) * vec3(1.0, 0.98, 0.94) * clamp(ch * lineK + 1.5 * lane, 0.0, 1.0);   // the bright patch glints only as thin lines: on chamfers and along the worn lanes, never as a disc on a flat face
    col += ch * ch * (0.05 + 0.55 * s8 * lineK) * vec3(1.0, 0.99, 0.96);
    float farH = 1.0 - 0.7 * (1.0 - isBlk) * smoothstep(80.0, 112.0, vWP.x);      // the far haunch beside the oculus keeps its dark arris line; its white glint is quieter, so it reads as glass, not as a bar across the approach
    col += lineM * (0.95 * lit + 1.3 * sp32) * farH * (uGlint / 1.6) * (1.0 - clamp(vM.w, 0.0, 1.0)) * vec3(1.0, 0.99, 0.96);
    col += (0.06 * tide + lane * (0.05 + 0.22 * s8)) * uHor;
    gl_FragColor = vec4(col * (1.0 - veil), 1.0);
  #endif
}`;

function makeGlassMaterials(U, nLoads) {
  const mk = (pass, refr) => {
    const m = new THREE.ShaderMaterial({
      uniforms: U, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, fog: true,
      defines: refr ? { NL: nLoads, PASS: pass, REFR: 1 } : { NL: nLoads, PASS: pass }, side: pass === 0 ? THREE.BackSide : THREE.FrontSide,
      transparent: true, depthWrite: false, depthTest: true,
    });
    if (pass < 2) { m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.DstColorFactor; m.blendDst = THREE.ZeroFactor; }
    else m.blending = THREE.AdditiveBlending;
    return m;
  };
  return [mk(0), mk(1, true), mk(2, false), mk(1, false)];   // the last: the plain multiply pass for the mirror image in the sea
}

// ---------- ballast-walker: seven overlapping plates, keel ridge, skirt of rods, four trunk legs with pads ----------
export const STRIDE = 9.0, HIPS = [[4.6, 3.3, 0.0], [4.6, -3.3, 0.5], [-4.6, 3.3, 0.58], [-4.6, -3.3, 0.08]];   // x, z, phase
function makeWalkerGeometry(rng) {
  const P = [], A = [], I = [];
  const v = (x, y, z, a0, a1, a2, a3) => { P.push(x, y, z); A.push(a0, a1, a2, a3); return P.length / 3 - 1; };
  const grid = (nu, nv, fn) => {       // fn(u, v) -> vertex index; quads between
    const g = [];
    for (let i = 0; i <= nu; i++) { const r = []; for (let j = 0; j <= nv; j++) r.push(fn(i / nu, j / nv, i, j)); g.push(r); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) I.push(g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j], g[i + 1][j + 1], g[i][j + 1]);
  };
  const prof = (x) => Math.sqrt(Math.max(0, 1 - (x / 8.3) * (x / 8.3)));
  const wAt = (x) => 5 * Math.pow(prof(x), 0.55), hAt = (x) => 3.4 + 5.6 * Math.pow(prof(x), 0.7), YB = 3.4;
  const lump = [0, 1, 2, 3, 4, 5, 6].map(() => rng.range(-0.12, 0.12));
  const FR = [0, 0.3, 0.62, 0.9, 1.0];
  for (let i = 0; i < 7; i++) {         // plates, front (+x) to rear, each lapping over the next
    grid(4, 14, (u, ph, iu) => {
      const fr = FR[iu], x = Math.max(-8.25, Math.min(8.25, 8.25 - (16.5 / 7) * (i + fr * 1.22)));
      const sc = 0.97 + 0.075 * fr + lump[i] * 0.25, ang = (ph * 2 - 1) * Math.PI * 0.5;
      const w = wAt(x) * sc, h = YB + (hAt(x) - YB) * sc;
      const ridge = 0.42 * Math.exp(-(ang / 0.13) * (ang / 0.13)) * prof(x);
      const y = YB - 0.25 * fr + (h - YB) * Math.pow(Math.max(0, Math.cos(ang)), 0.72) + ridge;
      return v(x, y, w * Math.sin(ang) * (1 + 0.05 * Math.cos(2 * ang)), i * 0.9, 1, 0, iu === 4 ? 1 : iu === 3 ? 0.55 : 0);
    });
  }
  grid(10, 4, (u, ph) => {              // belly
    const x = -8.2 + 16.4 * u, z = (ph * 2 - 1) * wAt(x) * 0.97;
    return v(x, YB - 0.9 * prof(x) * (1 - (ph * 2 - 1) * (ph * 2 - 1)), z, 0, 1, 0, 0);
  });
  for (let k = 0; k < 46; k++) {        // skirt rods hanging from the rim
    const side = k % 2 ? 1 : -1, x = -7.7 + 15.4 * ((k >> 1) + rng.range(0.1, 0.9)) / 23, len = rng.range(0.9, 1.7), r = rng.range(0.07, 0.11);
    const z = side * wAt(x) * 0.985, ph = rng.range(0, 6.28), base = [], tip = [];
    for (let s = 0; s < 3; s++) {
      const a = (s / 3) * Math.PI * 2;
      base.push(v(x + Math.cos(a) * r, YB + 0.05, z + Math.sin(a) * r, ph, 0, 2, 0.15));
      tip.push(v(x + Math.cos(a) * r * 0.45, YB - len, z + Math.sin(a) * r * 0.45, ph, 1, 2, 0.5));
    }
    for (let s = 0; s < 3; s++) { const t = (s + 1) % 3; I.push(base[s], tip[s], tip[t], base[s], tip[t], base[t]); }
    I.push(tip[0], tip[2], tip[1]);
  }
  for (const [hx, hz, ph] of HIPS) {    // trunk legs: h (aA.y) is 0 at the pad and 1 at the hip
    const lean = rng.range(-0.15, 0.15);
    grid(9, 10, (u, a) => {
      const ang = a * Math.PI * 2, y = 0.5 + u * 4.3;
      const r = (0.72 + 0.38 * u * u + 0.07 * Math.sin(u * 22 + lean * 9)) * (u > 0.999 ? 0.6 : 1);
      return v(hx + Math.cos(ang) * r, y, hz + Math.sin(ang) * r * 1.08, ph, Math.pow(u, 0.8), 1, 0.08 * Math.max(0, Math.sin(u * 22 + lean * 9)));
    });
    const padR = [0.0, 0.85, 1.12, 1.16, 0.8], padY = [0.0, 0.0, 0.14, 0.42, 0.62];
    grid(4, 10, (u, a, iu) => {         // the pad, 2.2 m across, bevelled
      const ang = a * Math.PI * 2, r = padR[iu] * (1 + 0.05 * Math.cos(ang * 3 + lean * 20));
      return v(hx + Math.cos(ang) * r, padY[iu], hz + Math.sin(ang) * r, ph, 0, 1, iu === 2 ? 0.75 : iu === 3 ? 0.3 : 0);
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
// the gait, shared by the vertex shader and the load solver: p in 0..1 -> [fore-aft offset, lift, weight]
export function gait(p) {
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  if (p < 0.62) return [(0.31 - p) * STRIDE, 0, sm(0, 0.12, p) * (1 - sm(0.5, 0.62, p))];
  const q = (p - 0.62) / 0.38;
  return [STRIDE * 0.31 * (-1 + 2 * sm(0, 1, q)), Math.sin(Math.PI * q) * 1.5, 0];
}

const WALKER_VERT = /* glsl */`
attribute vec4 aA;            // x: phase (leg phase / plate index / rod phase), y: flex, z: 0 body 1 leg 2 skirt rod, w: wear
attribute vec2 aI;            // per walker: gait phase offset, spare
uniform float uTravel, uTime;
varying vec3 vWN; varying vec3 vWP; varying float vWear; varying float vTop; varying vec3 vL; varying float vSc;
#include <fog_pars_vertex>
void main() {
  vec3 p = position; vL = vec3(position.x, aA.z, position.z);
  float cyc = uTravel / ${STRIDE.toFixed(1)} + aI.x;
  float bob = 0.11 * sin(12.5664 * cyc);
  if (aA.z < 0.5) {                       // plates slide on one another with the stride
    p.y += bob + 0.04 * sin(6.2832 * cyc + aA.x * 1.7);
    p.x += 0.09 * sin(12.5664 * cyc + aA.x * 2.0);
  } else if (aA.z < 1.5) {                // legs: planted while p < 0.62, then lift and swing forward
    float pp = fract(cyc + aA.x), k = 1.0 - aA.y, off = 0.0, lift = 0.0;
    if (pp < 0.62) off = (0.31 - pp) * ${STRIDE.toFixed(1)};
    else { float q = (pp - 0.62) / 0.38; float s = q * q * (3.0 - 2.0 * q); off = ${(STRIDE * 0.31).toFixed(3)} * (2.0 * s - 1.0); lift = sin(3.14159 * q) * 1.5; }
    p.x += off * k * sqrt(max(k, 0.0)); p.y += lift * k + bob * aA.y;
  } else {                                // skirt rods sway
    p.y += bob;
    p.x += aA.y * (0.2 * sin(uTime * 1.9 + aA.x) - 0.22 * sin(12.5664 * cyc + aA.x * 0.3));
    p.z += aA.y * 0.14 * sin(uTime * 1.3 + aA.x * 2.0);
  }
  mat4 m = modelMatrix * instanceMatrix;
  vec4 wp = m * vec4(p, 1.0);
  vWP = wp.xyz; vWN = mat3(m) * normal; vWear = aA.w; vTop = normal.y; vSc = length(m[0].xyz);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WALKER_FRAG = /* glsl */`
uniform vec3 uDark, uHor; uniform float uVeil, uMist, uPix;
varying vec3 vWN; varying vec3 vWP; varying float vWear; varying float vTop; varying vec3 vL; varying float vSc;
#include <fog_pars_fragment>
${MIST_GLSL}
void main() {
  vec3 n = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  vec3 Vv = cameraPosition - vWP; float dist = max(length(Vv), 1e-3);
  float top = max(vTop, 0.0), under = max(-vTop, 0.0);
  float ndv = clamp(abs(dot(n, Vv / dist)), 0.0, 1.0), rim = (1.0 - ndv) * (1.0 - 0.9 * under);   // no rim light on the belly: from below a walker stays black
  // far off a walker is a pure black silhouette; within about 60 m it becomes armour: sheen, wear lines, seams
  float near = 1.0 - smoothstep(55.0, 200.0, dist);
  float body = 1.0 - step(0.5, vL.y), leg = step(0.5, vL.y) * (1.0 - step(1.5, vL.y)), rod = step(1.5, vL.y);
  vec3 col = uDark + uHor * (0.07 * rim * rim * rim + 0.03 * top * top * (0.6 + 0.4 * rim));   // satin black, pearl sheen on the back
  float keel = exp(-vL.z * vL.z * 1.6) * top * body;                         // the ridge along the spine
  float sheen = 0.050 * top * top * top * (0.5 + 0.5 * rim) + 0.050 * keel + 0.035 * rim * rim * (0.4 + 0.6 * top);
  sheen += leg * 0.045 * rim * rim + rod * 0.05 * (0.3 + 0.7 * rim);          // trunk legs and skirt rods part from the body
  sheen += body * under * 0.006;                                             // the belly takes a little light back from the glass under it
  col += uHor * near * sheen;
  // pale wear along every plate edge (thin: the cube of the baked ramp), and the plate seams across the belly
  float w3 = clamp(vWear, 0.0, 1.0); w3 = w3 * w3 * mix(1.0, w3, body);
  float pl = fract((8.25 - vL.x) / 2.357), sd = min(pl, 1.0 - pl) * 2.357, sw = max(0.045, 0.6 * uPix * dist);
  float seam = (1.0 - smoothstep(sw * 0.4, sw, sd)) * 0.2;
  // the giant: its seven plates part along a pearl sheen line at each plate edge, and the keel is a fine bright ridge
  float big = smoothstep(1.5, 2.2, vSc), swG = max(0.07, 0.9 * uPix * dist / max(vSc, 0.5));
  float edgeG = (1.0 - smoothstep(swG * 0.4, swG, sd)) + 0.3 * (1.0 - smoothstep(0.0, 0.35, pl));     // the line, and the lit lap of the plate behind it
  float keelG = 1.0 - smoothstep(swG * 0.5, swG * 1.6, abs(vL.z));
  col += uHor * big * body * (1.0 - under) * (0.5 + 0.5 * near) * (0.13 * edgeG * (0.35 + 0.65 * rim + 0.4 * top) + 0.14 * keelG * smoothstep(0.1, 0.5, top));
  w3 *= 1.0 - 0.9 * under;                                                   // the belly is plain satin black: no wear lines, only the faint transverse plate seams
  w3 = max(w3, body * step(0.6, under) * seam * near);
  col = mix(col, uHor * (0.17 + 0.16 * near), w3 * 0.85);
  col = mix(col, uHor, 1.0 - exp(-dist / (uVeil * 1.8)) * (1.0 - 0.92 * uMist * mistSeg(cameraPosition, vWP)));   // the only darks hold their black longer than the glass holds its lines
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------- small glass things (drops on stalks, limpets): the same style without the load loop ----------
const SMALL_VERT = /* glsl */`
attribute vec3 aD;            // x: t along the stalk (0 root .. 1 drop), y: 0 stalk 1 drop, z: c across (-1..1)
attribute vec4 aI0;           // anchor xyz, stalk length
attribute vec4 aI1;           // omega, phase, amplitude (rad), swing-plane angle
uniform float uTime, uPix;
varying vec3 vWN; varying vec3 vWP; varying vec3 vK;   // vK: fringe order, part, t
#include <fog_pars_vertex>
void main() {
  float len = aI0.w, sw = sin(uTime * aI1.x + aI1.y), tS = min(aD.x, 1.0), th = aI1.z * sw * mix(0.55, 1.0, tS);
  vec3 anchorW = (modelMatrix * vec4(aI0.xyz, 1.0)).xyz;
  float widen = max(1.0, 1.6 * uPix * distance(cameraPosition, anchorW) / 0.06);       // stalks never thinner than ~1.5 px
  vec3 p = aD.y < 0.5 ? vec3(position.x * widen, position.y * len, position.z * widen) : position - vec3(0.0, len, 0.0);
  vec3 nn = normal;
  float ca = cos(aI1.w), sa = sin(aI1.w), c = cos(th), s = sin(th);
  vec2 h = vec2(dot(p.xz, vec2(ca, sa)), dot(p.xz, vec2(-sa, ca)));                    // swing in the vertical plane at angle aI1.w
  vec2 r = vec2(h.x * c - p.y * s, h.x * s + p.y * c);
  p = vec3(r.x * ca - h.y * sa, r.y, r.x * sa + h.y * ca);
  vec2 hn = vec2(dot(nn.xz, vec2(ca, sa)), dot(nn.xz, vec2(-sa, ca)));
  vec2 rn = vec2(hn.x * c - nn.y * s, hn.x * s + nn.y * c);
  nn = vec3(rn.x * ca - hn.y * sa, rn.y, rn.x * sa + hn.y * ca);
  vec4 wp = modelMatrix * vec4(aI0.xyz + p, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * nn;
  float t = tS, root = (1.0 - t) * (1.0 - t), tip = t * t * t * t;
  root *= root;
  float blush = min((root + 0.9 * tip) * (0.25 + 0.75 * abs(sw)) * (0.6 + 0.4 * abs(aD.z)) * clamp(aI1.z / 0.16, 0.6, 1.2), 0.95);   // never past first-order pink
  vK = vec3(blush * (1.0 - aD.y), aD.y, aD.x);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SMALL_FRAG = /* glsl */`
uniform sampler2D uRamp; uniform vec3 uSunDir, uZen, uHor, uLine; uniform float uVeil, uGlint;
varying vec3 vWN; varying vec3 vWP; varying vec3 vK;
#include <fog_pars_fragment>
void main() {
  vec3 n = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  vec3 Vv = cameraPosition - vWP; float dist = max(length(Vv), 1e-3); vec3 V = Vv / dist;
  float ndv = abs(dot(n, V)), fogF = 0.0;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  float veil = 1.0 - (1.0 - fogF) * exp(-dist / uVeil);
  #if PASS == 1
    vec3 col = texture2D(uRamp, vec2(clamp(vK.x, 0.0, 5.2) / 5.2, 0.5)).rgb;
    col *= mix(uLine, vec3(1.0), smoothstep(0.06, 0.42, ndv) * 0.8 + 0.2 * (1.0 - vK.y));
    // a teardrop is a lens: the sea, darker, stands in its upper half and the sky in its lower, round a bright core
    float sD = clamp(vK.z - 1.0, 0.0, 1.0);
    col *= mix(vec3(1.0), vec3(0.86, 0.95, 0.90) * mix(0.80, 1.10, smoothstep(0.30, 0.62, sD)) * (0.92 + 0.14 * ndv * ndv), vK.y);
    gl_FragColor = vec4(mix(col, vec3(1.0), veil), 1.0);
  #else
    vec3 R = reflect(-V, n);
    float fz = 1.0 - ndv, F = min(0.04 + 0.96 * fz * fz * fz, 0.5);
    float sd = max(dot(vec3(R.x, abs(R.y), R.z), uSunDir), 0.0);
    vec3 col = F * mix(uHor, uZen, smoothstep(0.0, 0.6, abs(R.y))) * 0.7;
    col += uGlint * pow(sd, 90.0) * vec3(1.0, 0.98, 0.94) * (0.25 + 0.75 * vK.y);
    gl_FragColor = vec4(col * (1.0 - veil), 1.0);
  #endif
}`;

function makeDropGeometry() {
  const P = [], D = [], I = [];
  const ring = (y, r, t, part, n) => { const s = P.length / 3; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; P.push(Math.cos(a) * r, y, Math.sin(a) * r); D.push(t, part, Math.cos(a)); } return s; };
  const skin = (a, b, n) => { for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; I.push(a + k, a + k2, b + k2, a + k, b + k2, b + k); } };
  // stalk with a flared root (unit length, scaled per instance), then the teardrop, 1.6 m long
  const st = [[0, 0.11], [0.012, 0.095], [0.035, 0.085], [0.08, 0.075], [0.2, 0.062], [0.45, 0.056], [0.7, 0.05], [0.9, 0.046], [1.0, 0.05]];
  let prev = -1;
  for (const [t, r] of st) { const s = ring(-t, r, t, 0, 8); if (prev >= 0) skin(prev, s, 8); prev = s; }
  prev = -1;
  for (let j = 0; j <= 13; j++) {
    const s = j / 13, r = Math.max(0.03, 0.47 * Math.pow(Math.sin(Math.PI * Math.pow(s, 1.75)), 0.85)) * (j === 13 ? 0.02 : 1);
    const k = ring(-1.6 * s, r, 1 + s, 1, 14); if (prev >= 0) skin(prev, k, 14); prev = k;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}

// ---------- seed bubbles: instanced billboards inside the glass; one pass darkens the rim and adds the highlight ----------
const BUBBLE_VERT = /* glsl */`
attribute vec4 aB;            // centre xyz, radius
uniform float uPix;
varying vec2 vUv; varying float vFade; varying float vDist;
#include <fog_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(aB.xyz, 1.0);
  float d = max(-mvPosition.z, 0.1), minR = 1.1 * uPix * d, r = max(aB.w, minR);
  vFade = clamp(aB.w / max(minR, 1e-4), 0.0, 1.0); vFade *= vFade; vUv = position.xy; vDist = d;
  mvPosition.xy += position.xy * r;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BUBBLE_FRAG = /* glsl */`
uniform float uVeil; uniform vec3 uHor;
varying vec2 vUv; varying float vFade; varying float vDist;
#include <fog_pars_fragment>
void main() {
  float r = length(vUv);
  if (r > 1.0) discard;
  float fogF = 0.0;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  float k = vFade * (1.0 - fogF) * exp(-vDist / uVeil);
  float rim = smoothstep(0.5, 0.92, r) * (1.0 - smoothstep(0.92, 1.0, r));
  vec2 a = vUv - vec2(-0.36, 0.42), b = vUv - vec2(0.3, -0.38);
  float hi = exp(-dot(a, a) * 28.0) * 1.3 + exp(-dot(b, b) * 16.0) * 0.22;
  gl_FragColor = vec4(uHor * hi * k, 1.0 - 0.6 * rim * k);     // out = rgb + dst * a
}`;
function makeBubbles(rng, count, U) {
  const B = new Float32Array(count * 4);
  let n = 0;
  while (n < count) {
    let p; const inBlock = rng.chance(0.28);
    if (inBlock) {
      const sx = rng.sign(), x = sx * BLOCK.cx + rng.range(-25, 25), y = rng.range(3, 43), z = rng.range(-29, 29);
      if (sx > 0 && Math.hypot(x - OC.x, y - OC.y) < 18) continue;
      p = [x, y, z];
    } else {
      const t = rng.range(-0.96, 0.96), f = rng.range(0.12, 0.85), b = backPt(t), u = underPt(t);
      p = [u[0] + (b[0] - u[0]) * f, u[1] + (b[1] - u[1]) * f, rng.range(-11, 11)];
      if (p[1] < 1) continue;
    }
    const len = rng.int(3, 11), dx = rng.range(-0.25, 0.25), dz = rng.range(-0.25, 0.25); let r = rng.range(0.1, 0.34);
    for (let k = 0; k < len && n < count; k++, n++) {
      const roof = inBlock ? BLOCK.top - 3 : CROWN * (1 - (p[0] / HALF) * (p[0] / HALF)) - 1.5;   // strings stop short of the surface
      if (p[1] > roof - r) { if (k === 0) n--; break; }
      B.set([p[0], p[1], p[2], r], n * 4);
      p = [p[0] + dx * r * 5 + rng.range(-0.1, 0.1), p[1] + r * rng.range(2.6, 4.2), p[2] + dz * r * 5 + rng.range(-0.1, 0.1)];
      r = Math.max(0.045, r * rng.range(0.7, 0.95));
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = count;
  const m = new THREE.ShaderMaterial({
    uniforms: U, vertexShader: BUBBLE_VERT, fragmentShader: BUBBLE_FRAG, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.SrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}

// arc length along the Span's back from the crown (metres), and its inverse
const KARC = (2 * CROWN) / HALF;
const arcOfT = (t) => { const a = Math.abs(t) * KARC; return Math.sign(t) * (HALF / 2) * (Math.abs(t) * Math.sqrt(1 + a * a) + Math.asinh(a) / KARC); };
const ARC_HALF = arcOfT(1);
function tOfArc(s) {
  let t = Math.max(-1.1, Math.min(1.1, s / ARC_HALF));
  for (let i = 0; i < 6; i++) t -= (arcOfT(t) - s) / (HALF * Math.sqrt(1 + KARC * KARC * t * t));
  return t;
}
const backFrame = (t) => { const l = Math.hypot(HALF, 2 * CROWN * t); return { x: HALF * t, y: CROWN * (1 - t * t), tx: HALF / l, ty: (-2 * CROWN * t) / l }; };
const noBlendAlpha = (m) => { m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; return m; };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('weight-of-glass-hero');
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  const preview = !!opts.preview;                       // the pearl dome and thin sea for judging the piece alone (opt-in: no page reads here)
  const detail = Math.max(0.6, Math.min(1, opts.detail ?? (ctx.quality?.detail ?? 1)));
  const fine = detail >= 0.8, NW = 9, NL = fine ? NW * 4 + 4 : NW + 4;
  const object = new THREE.Group(); object.name = 'weight-of-glass:span';

  // per-seed variety: glass character, herd spacing and sizes, where the bright patch stands
  const glassKind = opts.glass ?? rng.pick(['clear', 'clear', 'clear', 'smoke', 'deep']);
  const tint = glassKind === 'deep' ? 0.85 : rng.range(0.42, 0.58);
  const absorb = glassKind === 'smoke' ? new THREE.Vector3(0.0075, 0.007, 0.0065) : new THREE.Vector3(0.012, 0.004, 0.009).multiplyScalar(tint);
  const sunAz = rng.range(-0.25, 0.25), sunDir = opts.lightDir ? new THREE.Vector3().copy(opts.lightDir).normalize()
    : new THREE.Vector3(Math.sin(0.62 + sunAz) * 0.766, 0.643, -Math.cos(0.62 + sunAz) * 0.766).normalize();
  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uLoads: { value: Array.from({ length: NL }, () => new THREE.Vector4(0, -50, 0, 0)) },
    uLoadDir: { value: Array.from({ length: NL }, () => new THREE.Vector4(0, -1, 0, 1)) },
    uOcu: { value: 1 }, uArr: { value: opts.load === 'giant' ? 6 : 2 }, uBendW: { value: 22 }, uBendK: { value: 0.26 }, uReach: { value: new THREE.Vector2(22, 32) },
    uTime: { value: 0 }, uTravel: { value: 0 }, uMist: { value: 0 }, uGraze: { value: 0.35 }, uPix: { value: 0.0012 }, uVeil: { value: 1600 }, uGlint: { value: 1.6 }, uAbs: { value: absorb },
    uSunDir: { value: sunDir }, uZen: { value: srgb('#BDBCBD') }, uHor: { value: srgb(pal[0]) },
    // the scene the glass bends (the world overwrites these with its seeded sky and sea): veil, bright patch, mist, sand, channels
    uVeilC: { value: srgb('#9E9EB0') }, uPatch: { value: new THREE.Vector3(0.020, 0.019, 0.016) }, uMistC: { value: srgb('#D2D1CE') }, uVeilAmt: { value: 1 },
    uSand: { value: srgb('#958F86') }, uDeep: { value: srgb('#6C7F84') }, uRefr: { value: opts.refraction === false ? 0 : 1 },
    uLine: { value: glassKind === 'smoke' ? srgb('#34383C') : srgb('#3C4A48') }, uDark: { value: srgb(pal[6]) },
  }]);
  U.uRamp = { value: makeRamp(pal) };

  // --- glass bodies: one geometry, three passes
  const em = makeEmitter();
  emitSpan(em, 256);
  await ctx.yield?.();
  emitBlock(em, -1, 1, false); emitBlock(em, 1, 2, true);
  const glassGeo = em.build();
  glassGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 45, 0), 200);
  const glassMats = makeGlassMaterials(U, NL).map(noBlendAlpha);
  const glass = glassMats.slice(0, 3).map((m, i) => { const me = new THREE.Mesh(glassGeo, m); me.renderOrder = [10, 11, 20][i]; object.add(me); return me; });
  await ctx.yield?.();

  // --- the herd
  const walkerGeo = makeWalkerGeometry(rng.fork('walker'));
  const gaitPh = new Float32Array(NW * 2);
  walkerGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(gaitPh, 2));
  const walkerMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: WALKER_VERT, fragmentShader: WALKER_FRAG, fog: true, side: THREE.DoubleSide });
  const walkers = new THREE.InstancedMesh(walkerGeo, walkerMat, NW);
  walkers.frustumCulled = false; walkers.instanceMatrix.setUsage(THREE.DynamicDrawUsage); object.add(walkers);
  const loadKind = opts.load ?? 'nine';                 // 'nine' | 'clump' (five, tight: their nests fuse) | 'giant' (one, 40 m long)
  const SPACING = 40, LOOP = NW * SPACING, herd = [];
  const jitter = opts.herd === 'even' ? 0 : rng.range(0, 5);
  for (let i = 0; i < NW; i++) {
    herd.push({ off: i * SPACING + (i ? rng.range(-jitter, jitter) : 0), sc: i ? rng.range(0.9, 1.1) : 1, ph: rng.range(0, 1), s: 0, w: 0, pos: new THREE.Vector3(), pads: [] });
    gaitPh[i * 2] = herd[i].ph;
    if (loadKind === 'clump') { herd[i].off = i * 24.5 + (i ? rng.range(-1, 1) : 0); herd[i].gone = i > 4; }
    // the giant is walker 1. Its stride is 2.5 times as long, so it covers 2.5 times the ground (gain): it is on the near
    // haunch at the entry, ahead and above through the flank climb, and stands 50 m down the far side at progress 0.6
    if (loadKind === 'giant') { herd[i].gone = i !== 1; herd[i].sc = 2.5; if (i === 1) { herd[i].off = 37.3; herd[i].gain = 2.5; } }
    for (let l = 0; l < 4; l++) herd[i].pads.push([0, 0, 0, 0]);
  }
  // walker 0 is the one over the lens (arc -87 m, x about -78) at progress 0.40, with its fore pad just landing
  const TRAVEL = 125, S_LENS = -87.3, T0 = S_LENS - 0.4 * TRAVEL + LOOP;
  herd[0].ph = gaitPh[0] = 0.035 - ((T0 + (opts.padBeat ?? 0.4) * TRAVEL) / STRIDE) % 1 + 1;      // opts.padBeat: the progress at which that pad lands (the world's rare visit walks the herd a little faster)

  // --- drops under the Span
  const dropGeo0 = makeDropGeometry(), nDrops = opts.drops ?? rng.int(36, 44);
  const dropGeo = new THREE.InstancedBufferGeometry().copy(dropGeo0); dropGeo.instanceCount = nDrops;
  const i0 = new Float32Array(nDrops * 4), i1 = new Float32Array(nDrops * 4), dropAnchors = [];
  for (let k = 0, guard = 0; k < nDrops && guard < 2000; guard++) {
    const t = rng.range(-0.74, 0.74), u = underPt(t), z = rng.range(-10.5, 10.5), len = rng.range(6, 14);
    const lane = -73 + 0.23 * z;                              // keep the camera's lane under the near haunch open
    if (Math.abs(u[0] - lane) < 9.5 || u[1] - len < 5) continue;
    if (dropAnchors.some((d) => Math.hypot(d[0] - u[0], d[1] - z) < 5)) continue;
    dropAnchors.push([u[0], z]);
    i0.set([u[0], u[1] + 0.15, z, len], k * 4);
    i1.set([Math.sqrt(9.8 / len) * rng.range(0.9, 1.1), rng.range(0, 6.28), rng.range(0.12, 0.26), rng.range(0, 6.28)], k * 4);
    k++;
  }
  [[-62, -2, 13, 0.15, 0.4], [-60, 7.5, 12, 0.13, 2.1], [-58, 2.5, 13, 0.14, 4.0]].forEach(([x, z, len, amp, ph], k) => {
    if (k >= nDrops) return;
    i0.set([x, CROWN_U * (1 - (x / HALF_U) * (x / HALF_U)) + 0.15, z, len], k * 4); i1.set([Math.sqrt(9.8 / len), ph, amp, 1.2 + k], k * 4);
  });
  dropGeo.setAttribute('aI0', new THREE.InstancedBufferAttribute(i0, 4));
  dropGeo.setAttribute('aI1', new THREE.InstancedBufferAttribute(i1, 4));
  const dropMats = [1, 2].map((pass) => {
    const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SMALL_VERT, fragmentShader: SMALL_FRAG, fog: true, defines: { PASS: pass }, transparent: true, depthWrite: false });
    if (pass === 1) { m.blending = THREE.CustomBlending; m.blendSrc = THREE.DstColorFactor; m.blendDst = THREE.ZeroFactor; noBlendAlpha(m); } else m.blending = THREE.AdditiveBlending;
    return m;
  });
  const drops = dropMats.map((m, i) => { const me = new THREE.Mesh(dropGeo, m); me.frustumCulled = false; me.renderOrder = i ? 21 : 12; object.add(me); return me; });
  const bubbles = makeBubbles(rng.fork('bubbles'), Math.round(600 * detail), U); noBlendAlpha(bubbles.material); bubbles.renderOrder = 15; object.add(bubbles);
  await ctx.yield?.();

  // --- mirror image for the sea (lines and fringes, walkers, drops): y-flipped, sharing every buffer and material
  const makeReflection = () => {
    const g = new THREE.Group(); g.scale.y = -1; g.name = 'weight-of-glass:reflection';
    const a = new THREE.Mesh(glassGeo, glassMats[3]); a.renderOrder = 2;
    const w = new THREE.InstancedMesh(walkerGeo, walkerMat, NW); w.instanceMatrix = walkers.instanceMatrix; w.frustumCulled = false;
    const d = new THREE.Mesh(dropGeo, dropMats[0]); d.frustumCulled = false; d.renderOrder = 3;
    g.add(a, w, d);
    return g;
  };
  let reflection = null;
  if (opts.reflection ?? preview) { reflection = makeReflection(); object.add(reflection); }

  // --- the loads: where every pad stands, how hard, and which way it pushes
  let progress = -1, pool = 0, poolIdx = -1, poolDx = 0, poolDy = -1, holdIdx = -1, holdBack = 0; const poolAt = new THREE.Vector4();
  const M4 = new THREE.Matrix4(), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(0, 0, 1), v2 = new THREE.Vector2();
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const setLoad = (k, x, y, z, w, dx, dy, dz, point) => { U.uLoads.value[k].set(x, y, z, w); U.uLoadDir.value[k].set(dx, dy, dz, point); };
  // scratch for solve(): nothing is allocated per frame
  const FR = { x: 0, y: 0, tx: 1, ty: 0 }, GT = [0, 0, 0];
  const frameAt = (sArc) => { const t = tOfArc(sArc), l = Math.hypot(HALF, 2 * CROWN * t); FR.x = HALF * t; FR.y = CROWN * (1 - t * t); FR.tx = HALF / l; FR.ty = (-2 * CROWN * t) / l; return FR; };
  const gaitInto = (p) => {           // the same gait as gait(), into GT: fore-aft offset, lift, weight
    if (p < 0.62) { GT[0] = (0.31 - p) * STRIDE; GT[1] = 0; GT[2] = sm(0, 0.12, p) * (1 - sm(0.5, 0.62, p)); }
    else { const q = (p - 0.62) / 0.38; GT[0] = STRIDE * 0.31 * (-1 + 2 * sm(0, 1, q)); GT[1] = Math.sin(Math.PI * q) * 1.5; GT[2] = 0; }
  };
  function solve(time) {
    const adv = progress >= 0 ? progress * TRAVEL : time * 3.0, travel = (T0 + adv) % LOOP;
    U.uTravel.value = travel;
    let k = 0, near = 0, far = 0, farHaunch = 0;
    for (let i = 0; i < NW; i++) {
      const h = herd[i];
      const back = i === holdIdx ? holdBack : 0;          // the settled walker stays where it sat while the herd walks on
      let s = (S_LENS + (h.gain ?? 1) * (adv - 0.4 * TRAVEL) + h.off - back) % LOOP; if (s < -LOOP / 2) s += LOOP; if (s >= LOOP / 2) s -= LOOP;
      const vis = h.gone ? 0 : 1 - sm(ARC_HALF - 11 * h.sc, ARC_HALF - 1, Math.abs(s)), sc = h.sc * Math.max(vis, 1e-3);
      const f = frameAt(s), fx = f.x, fy = f.y, ftx = f.tx, fty = f.ty;
      const settle = i === poolIdx ? pool : 0;           // the rare event: this one stops and sinks onto its skirt
      bx.set(ftx, fty, 0); by.set(-fty, ftx, 0);
      M4.makeBasis(bx, by, bz).scale(bx.set(sc, sc * (1 - 0.16 * settle), sc)).setPosition(fx, fy, 0);
      walkers.setMatrixAt(i, M4);
      h.s = s; h.pos.set(fx, fy, 0); h.w = vis;
      const cyc = travel / STRIDE + h.ph - back / STRIDE; let sumW = 0;
      if (i === holdIdx && gaitPh[i * 2] !== h.ph - back / STRIDE) { gaitPh[i * 2] = h.ph - back / STRIDE; walkerGeo.attributes.aI.needsUpdate = true; }
      for (let l = 0; l < 4; l++) {
        gaitInto((((cyc + HIPS[l][2]) % 1) + 1) % 1);
        const pf = frameAt(s + sc * (HIPS[l][0] + GT[0]));
        const sway = 1 + 0.2 * Math.sin(time * 1.6 + i * 2.4 + l * 1.7);        // a standing weight is never still: each leg takes more, then less
        const wt = 0.62 * GT[2] * vis * Math.min(h.sc * h.sc, loadKind === 'giant' ? 2.5 : 3.7) * sway; sumW += wt;
        const pd = h.pads[l]; pd[0] = pf.x; pd[1] = pf.y; pd[2] = sc * HIPS[l][1]; pd[3] = wt;
        if (fine) setLoad(k++, pf.x, pf.y, sc * HIPS[l][1], wt, pf.ty, -pf.tx, 0, 1);
      }
      if (!fine) setLoad(k++, fx, fy, 0, sumW * 0.6, fty, -ftx, 0, 1);
      if (i === poolIdx) { poolAt.set(fx, fy, 0, 0); poolDx = fty; poolDy = -ftx; }
      if (fx < 0) near += sumW; else far += sumW;
      farHaunch += sumW * sm(20, 90, fx);
    }
    walkers.instanceMatrix.needsUpdate = true;
    if (pool > 0) {                                       // every nest slides to the settled walker and fuses into one eye
      const e = pool * pool * (3 - 2 * pool), L = U.uLoads.value; let sumAll = 0;
      for (let j = 0; j < k; j++) {
        const spread = fine ? ((j % 4) - 1.5) * 1.6 : 0;
        L[j].x += (poolAt.x + spread - L[j].x) * e; L[j].y += (poolAt.y - L[j].y) * e; L[j].z *= 1 - 0.7 * e;
        sumAll += L[j].w;
        const Dj = U.uLoadDir.value[j], ddx = Dj.x + (poolDx - Dj.x) * e, ddy = Dj.y + (poolDy - Dj.y) * e, dl = Math.hypot(ddx, ddy) || 1;
        Dj.x = ddx / dl; Dj.y = ddy / dl;                  // and they all push the way the settled walker pushes: one eye, not a fan
      }
      const scl = 1 + ((1.3 * (1 + 0.13 * Math.sin(time * 2.1) + 0.05 * Math.sin(time * 3.4 + 1.0))) / Math.max(sumAll, 0.5) - 1) * e;
      for (let j = 0; j < k; j++) L[j].w *= scl;
      U.uReach.value.x = 22 + 34 * e; U.uGraze.value = 0.35 * (1 - e);
    } else U.uGraze.value = 0.35, U.uReach.value.x = loadKind === 'giant' ? 50 : loadKind === 'clump' ? 25 : 22;
    // support reactions (line loads along Z): up each foot along the arch axis, and out into each abutment block
    const wn = 0.75 + 0.045 * near, wf = 0.75 + 0.045 * far;
    setLoad(k++, -118, -3, 0, wn, 0.5625, 0.8268, 0, 0); setLoad(k++, 118, -3, 0, wf, -0.5625, 0.8268, 0, 0);
    setLoad(k++, -123, 4, 0, wn * 1.25, -0.94, 0.34, 0, 0); setLoad(k++, 123, 4, 0, wf * 1.25, 0.94, 0.34, 0, 0);
    U.uOcu.value = 0.7 + 0.22 * farHaunch;
  }

  // --- anchors (local space; see the header)
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // The line of flight (fix round 3): the entry is near and low (the Span fills the first view), the under-pass is 12 m
  // under the underside and the climb comes level with the flank early (glass fills the frame all the way up), over the
  // crown between two walkers, out over the -Z sea and down to 22 m, one long right-hand turn among the blade-trees and
  // 100 m straight into the oculus.
  const fly = [V3(-104, 9, -186), V3(-91, 11, -136), V3(-85.5, 15.5, -88), V3(-82.5, 21, -40), V3(-76, 24, -13), V3(-70, 30, 13), V3(-64, 44, 22), V3(-51, 62, 24), V3(-34, 78, 24), V3(-17, 98, 22), V3(-4.2, 104, 9), V3(4.2, 104, -9), V3(22.9, 80, -50.5), V3(41.5, 56, -92), V3(60.2, 36, -133.4), V3(82.2, 26, -148.9), V3(109, 22, -151.2), V3(133.4, 21.5, -139.8), V3(148.9, 23, -117.8), V3(152, 24, -100), V3(152, 24, -66), V3(152, 24, -33), V3(152, 24, 0)];
  const anchors = {
    portalSeat: { position: V3(OC.x, OC.y, 0), facing: V3(0, 0, -1), radius: 7 },
    flyThrough: fly,
    entry: V3(-104, 9, -186), crown: V3(0, CROWN, 0), oculus: V3(OC.x, OC.y, 0), underPass: V3(-73, 26, 0),
    springings: [V3(-118, 0, 0), V3(118, 0, 0)],
    viewpoints: { entry: V3(-104, 9, -186), underHaunch: V3(-73, 26, 0), flank: V3(-40, 72, 24), crown: V3(0, 104, 0), eyeAndOculus: V3(137, 30, -106), rim: V3(152, 24, -30) },
  };

  // --- preview only (the set-piece viewer, or opts.preview): the brief's pearl dome and a thin opal sea, so the
  //     glass can be judged in its own light. The world supplies the real sky and sea and never gets these.
  let dome = null;
  if (preview) {
    dome = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: { uSunDir: U.uSunDir, uZen: U.uZen, uHor: U.uHor, uVeilC: { value: srgb('#A9A9B6') } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uSunDir, uZen, uHor, uVeilC; varying vec3 vD;
        void main(){ vec3 d = normalize(vD); float y = abs(d.y);
          vec3 c = mix(uHor, uZen, smoothstep(0.0, 0.6, y));
          float s = max(dot(vec3(d.x, y, d.z), uSunDir), 0.0); c += vec3(0.018, 0.017, 0.015) * s * s * s;
          float az = smoothstep(-0.25, 0.75, d.z / max(length(d.xz), 1e-3));
          c = mix(c, uVeilC, 0.92 * az * (1.0 - smoothstep(0.02, 0.21, y)));
          gl_FragColor = vec4(c, 1.0); }`,
    }));
    dome.renderOrder = -0.5; dome.frustumCulled = false; object.add(dome);
    const sea = new THREE.Mesh(new THREE.CircleGeometry(2500, 48), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, uniforms: { uTime: U.uTime, uHor: U.uHor },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float uTime; uniform vec3 uHor; varying vec3 vW;
        void main(){ vec3 V = cameraPosition - vW; float d = max(length(V), 1e-3); float up = clamp(abs(V.y) / d, 0.0, 1.0);
          float rip = sin(vW.x * 0.9 + 1.7 * sin(vW.z * 0.23) + uTime * 0.25) * sin(vW.z * 1.1 + 1.3 * sin(vW.x * 0.19)) * exp(-d / 160.0);
          vec3 sand = uHor * (0.60 + 0.045 * rip);
          float a = mix(0.16, 0.86, smoothstep(0.03, 0.55, up));
          gl_FragColor = vec4(sand, a); }`,
    }));
    sea.rotation.x = -Math.PI / 2; sea.renderOrder = 5; object.add(sea);
  }

  solve(0);
  // viewer only: ?focus=x,y,z,r,h orbits a detail instead of the whole Span
  const foc = Array.isArray(opts.focus) ? opts.focus : [];      // optional [x, y, z, radius, height]: orbit a detail instead of the whole Span
  const hasFoc = foc.length === 5 && foc.every(Number.isFinite);
  return {
    object, radius: hasFoc ? foc[3] : 185, height: hasFoc ? foc[4] : CROWN + 9, center: hasFoc ? new THREE.Vector3(foc[0], foc[1], foc[2]) : new THREE.Vector3(0, 46, 0), anchors,
    ground: !preview, groundY: 0,
    uniforms: U, herd, loads: U.uLoads.value, makeReflection, reflection,
    // u = the world's path progress 0..1: the herd advances 125 m over the flight and walker 0 plants a fore pad
    // above anchors.underPass at u 0.40. Without it the herd walks on the clock at 3 m/s.
    setProgress(u) { progress = Math.min(1.2, Math.max(0, u)); },
    // the rare event: walker `index` settles (amount 0..1) and all the nests pool under it into one eye about 60 m across
    setPool(amount, index = 1, back = 0) { pool = Math.min(1, Math.max(0, amount)); poolIdx = pool > 0 ? index : -1; holdIdx = index; holdBack = back; },   // back: metres the settled walker is held behind its place in the herd
    walkerGeometry: walkerGeo, walkerMaterial: walkerMat, loadKind,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera && camera.isPerspectiveCamera) {
        const h = ctx.renderer?.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(v2).y : 1080;
        U.uPix.value = (2 * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(h, 200);
      }
      if (dome && camera) dome.position.setFromMatrixPosition(camera.matrixWorld).sub(object.position);
      solve(time);
    },
    dispose() { U.uRamp.value.dispose(); },
  };
}
