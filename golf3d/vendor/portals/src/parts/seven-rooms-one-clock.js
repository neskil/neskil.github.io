// SEVEN ROOMS AND ONE CLOCK: the hero set piece and the shared makers of the world.
// 1. makeBatch(): merges geometry into one buffer with the attributes the room shader reads.
// 2. ROOM_GLSL + roomUniforms() + roomMaterial(): the light of one room of the suite, worked out in the room's own
//    space. There is no lamp in any room: all light is the brazier fire behind the two stained windows (a beam with the
//    window's tracery in it, the soft glow of the glass, its mirror image in polished things), what spills through
//    the two doorways from the neighbours, and a little of the room's own colour as bounce. No three.js lights.
// 3. makeMasquers(): the masked dancers, in turning pairs, moved in the vertex shader; a stop value settles them.
// 4. buildHero(): the ebony clock (dial of marks and hands, pendulum behind glass, the strike as a ring of light and
//    dust shaken from the case, the open case door at its foot where the portal sits).
import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };

// surface kinds of the room shader
export const K = { PLAIN: 0, STONE: 1, FLOOR: 2, TAPESTRY: 3, VELVET: 4, GLASS: 5, VAULT: 6, CARPET: 7, WOOD: 8, FIRE: 9, GOLD: 10, DIAL: 11, FIRELIT: 12 };

// ---------------------------------------------------------------------------------------------- geometry batch
// position, normal, aCol (linear albedo), aSurf (kind, gloss, metal, sway). Non-indexed.
export function makeBatch(cap0 = 1 << 13) {
  let cap = cap0, n = 0;
  let P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), S = new Float32Array(cap * 4);
  const col = [1, 1, 1], surf = [0, 0.2, 0, 0];
  let colFn = null, X = null;
  const xv = new THREE.Vector3();
  const xp = (a) => { if (!X) return a; xv.set(a[0], a[1], a[2]).applyMatrix4(X); return [xv.x, xv.y, xv.z]; };
  const grow = (need) => {
    if (n + need <= cap) return;
    while (n + need > cap) cap *= 2;
    const g = (a, k) => { const b = new Float32Array(cap * k); b.set(a.subarray(0, n * k)); return b; };
    P = g(P, 3); N = g(N, 3); C = g(C, 3); S = g(S, 4);
  };
  const _c = [0, 0, 0];
  const put = (x, y, z, nx, ny, nz) => {
    const i = n * 3, j = n * 4;
    P[i] = x; P[i + 1] = y; P[i + 2] = z; N[i] = nx; N[i + 1] = ny; N[i + 2] = nz;
    if (colFn) { colFn(x, y, z, _c); C[i] = _c[0]; C[i + 1] = _c[1]; C[i + 2] = _c[2]; } else { C[i] = col[0]; C[i + 1] = col[1]; C[i + 2] = col[2]; }
    S[j] = surf[0]; S[j + 1] = surf[1]; S[j + 2] = surf[2]; S[j + 3] = surf[3];
    n++;
  };
  const v = new THREE.Vector3(), nv = new THREE.Vector3(), nm = new THREE.Matrix3(), mt = new THREE.Matrix4();
  const q = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const api = {
    col(c, k = 1) { col[0] = c[0] * k; col[1] = c[1] * k; col[2] = c[2] * k; return api; },
    surf(kind, gloss = 0.2, metal = 0, sway = 0) { surf[0] = kind; surf[1] = gloss; surf[2] = metal; surf[3] = sway; return api; },
    shade(fn) { colFn = fn; return api; },
    // one flat triangle / quad (a, b, c, d counter-clockwise seen from the lit side)
    // every later tri, quad, grid and geo goes through this matrix (null: none)
    tr(m) { X = m ? m.clone() : null; return api; },
    tri(a, b, c) {
      grow(3); a = xp(a); b = xp(b); c = xp(c);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      put(a[0], a[1], a[2], nx, ny, nz); put(b[0], b[1], b[2], nx, ny, nz); put(c[0], c[1], c[2], nx, ny, nz);
      return api;
    },
    quad(a, b, c, d) {
      const x0 = X; a = xp(a); b = xp(b); c = xp(c); d = xp(d); X = null;
      api.tri(a, b, c); api.tri(a, c, d); X = x0; return api;
    },
    // a smooth patch: fn(u, v, out) writes a point; normals from the patch itself. flip turns it to face the other way.
    grid(nu, nv_, fn, flip = false, swayFn = null) {
      const W = nu + 1, pts = new Float32Array(W * (nv_ + 1) * 3), nor = new Float32Array(W * (nv_ + 1) * 3), o = [0, 0, 0];
      for (let j = 0; j <= nv_; j++) for (let i = 0; i <= nu; i++) {
        fn(i / nu, j / nv_, o); const k = (j * W + i) * 3;
        if (X) { xv.set(o[0], o[1], o[2]).applyMatrix4(X); pts[k] = xv.x; pts[k + 1] = xv.y; pts[k + 2] = xv.z; } else { pts[k] = o[0]; pts[k + 1] = o[1]; pts[k + 2] = o[2]; }
      }
      for (let j = 0; j <= nv_; j++) for (let i = 0; i <= nu; i++) {
        const k = (j * W + i) * 3, i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nu), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nv_);
        const a = (j * W + i0) * 3, b = (j * W + i1) * 3, c = (j0 * W + i) * 3, d = (j1 * W + i) * 3;
        const ux = pts[b] - pts[a], uy = pts[b + 1] - pts[a + 1], uz = pts[b + 2] - pts[a + 2], wx = pts[d] - pts[c], wy = pts[d + 1] - pts[c + 1], wz = pts[d + 2] - pts[c + 2];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz);
        if (l < 1e-9) { nx = 0; ny = 1; nz = 0; } else { nx /= l; ny /= l; nz /= l; }
        if (flip) { nx = -nx; ny = -ny; nz = -nz; }
        nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
      }
      grow(nu * nv_ * 6);
      const sw0 = surf[3];
      const pv = (i, j) => { const k = (j * W + i) * 3; if (swayFn) surf[3] = swayFn(i / nu, j / nv_); put(pts[k], pts[k + 1], pts[k + 2], nor[k], nor[k + 1], nor[k + 2]); };
      for (let j = 0; j < nv_; j++) for (let i = 0; i < nu; i++) {
        if (flip) { pv(i, j); pv(i, j + 1); pv(i + 1, j + 1); pv(i, j); pv(i + 1, j + 1); pv(i + 1, j); }
        else { pv(i, j); pv(i + 1, j); pv(i + 1, j + 1); pv(i, j); pv(i + 1, j + 1); pv(i, j + 1); }
      }
      surf[3] = sw0;
      return api;
    },
    // a three.js geometry, placed with { p, r, s } or a matrix { m }; disposed after use. sway: fn(x, y, z local) -> weight
    geo(g0, o = {}) {
      const g = g0.index ? g0.toNonIndexed() : g0;
      if (o.m) mt.copy(o.m);
      else {
        const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s === undefined ? [1, 1, 1] : (typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s);
        mt.compose(ps.set(p[0], p[1], p[2]), q.setFromEuler(eu.set(r[0], r[1], r[2], o.order || 'XYZ')), sc.set(s[0], s[1], s[2]));
      }
      if (X) mt.premultiply(X);
      nm.getNormalMatrix(mt);
      const pos = g.attributes.position, nor = g.attributes.normal, sw0 = surf[3];
      grow(pos.count);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        if (o.sway) surf[3] = o.sway(v.x, v.y, v.z);
        if (o.warp) o.warp(v);
        v.applyMatrix4(mt);
        if (nor) nv.fromBufferAttribute(nor, i).applyMatrix3(nm); else nv.set(0, 1, 0);
        const l = nv.length(); if (l > 1e-9) nv.multiplyScalar(1 / l); else nv.set(0, 1, 0);
        put(v.x, v.y, v.z, nv.x, nv.y, nv.z);
      }
      surf[3] = sw0;
      if (g !== g0) g.dispose();
      g0.dispose();
      return api;
    },
    box(cx, cy, cz, sx, sy, sz, r) { return api.geo(new THREE.BoxGeometry(sx, sy, sz), { p: [cx, cy, cz], r }); },
    // upright (or tilted) round member from a to b
    rod(a, b, r0, r1 = r0, sides = 6) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz) || 1e-6;
      const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1, true);
      q.setFromUnitVectors(v.set(0, 1, 0), nv.set(dx / len, dy / len, dz / len));
      mt.compose(ps.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, sc.set(1, 1, 1));
      return api.geo(g, { m: mt.clone() });
    },
    // a moulding or rib: a round section swept along points (array of [x,y,z])
    tube(pts, r, sides = 5, closed = false) {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), closed, 'centripetal');
      return api.geo(new THREE.TubeGeometry(curve, Math.max(2, (pts.length - 1) * 2), r, sides, closed));
    },
    get count() { return n; },
    get triangles() { return n / 3; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, n * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, n * 3), 3));
      g.setAttribute('aCol', new THREE.BufferAttribute(C.slice(0, n * 3), 3));
      g.setAttribute('aSurf', new THREE.BufferAttribute(S.slice(0, n * 4), 4));
      return g;
    },
  };
  return api;
}

// ---------------------------------------------------------------------------------------------- the light of a room
// Room space: x across (-hw..hw), y up, z from 0 (the wall we came in by) to -L (the wall we leave by).
// One window in the middle of each side wall, a brazier behind each.
export const ROOM_GLSL = /* glsl */`
uniform float uTime;
uniform vec3 uRoomCol;      // colour of the light the glass lets through
uniform vec3 uGlassCol;     // colour of the glass itself, seen against the fire
uniform vec4 uRoomDim;      // half width, length, wall height, crown height
uniform vec4 uWin;          // z of the window centre, sill height, half width, apex height
uniform vec4 uSrc;          // fire: metres behind the wall, height; glass style; beam gain
uniform float uSrcZ;        // how far up the room from the window the fire stands (slants the beams down the room)
uniform vec4 uFlick;        // level of the brazier on -x, on +x, of the neighbour behind door A, behind door B
uniform vec3 uDoorA;        // colour of the light of the neighbour behind the door at z = 0
uniform vec3 uDoorB;        // ... behind the door at z = -L
uniform vec4 uDoorPos;      // x of door A, x of door B, door half width, door apex height
uniform vec4 uAmb;          // bounce gain, soft window gain, haze density, haze gain
uniform vec4 uRing;         // the strike: centre x, centre z, radius, strength
uniform vec3 uRingCol;
uniform vec4 uLook;         // floor style, wall style, vault style, velvet room (0 | 1)
uniform vec4 uNicheA;       // a brazier seen through the open tracery of the passage we came in by: x, y, z, strength
uniform vec4 uNicheB;       // ... of the passage we leave by
uniform vec4 uPhase;        // seeded phases of this room's fires: brazier on -x, on +x, the corridor fire, spare
const vec3 RFIRE = vec3(1.0, 0.36, 0.07);

float rHash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float rNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(rHash(i), rHash(i + vec2(1., 0.)), f.x), mix(rHash(i + vec2(0., 1.)), rHash(i + vec2(1., 1.)), f.x), f.y); }

// The lancet: q.x across from its centre line, q.y above the sill; hw half width, H apex above the sill.
// Returns (light let through, with the tone of each quarry; 1 on glass and 0 on stone or lead; 1 inside the opening).
vec3 lancetGlass(vec2 q, float hw, float H, float style, float blur){
  float e = 0.05 + blur;
  float ys = H - 1.732 * hw;
  float ax = abs(q.x);
  float dArc = 2. * hw - length(vec2(ax + hw, max(q.y - ys, 0.)));
  float dOut = min(min(hw - ax, dArc), q.y);
  float shape = smoothstep(0., e, dOut);
  float bar = 0.06 * hw + 0.05;
  float border = smoothstep(bar, bar + e, dOut);
  float shw = 0.5 * hw, sx = abs(ax - shw), ysub = ys - 0.15 * hw;
  float dSub = 2. * shw - length(vec2(sx + shw, max(q.y - ysub, 0.)));
  float lights = smoothstep(bar * .5, bar * .5 + e, min(shw - sx, dSub));
  vec2 oc = q - vec2(0., ys + 0.75 * hw);
  float rl = 0.215 * hw, dOc = -1e3;
  dOc = max(dOc, rl - length(oc - vec2(rl, 0.) * 0.95));
  dOc = max(dOc, rl - length(oc + vec2(rl, 0.) * 0.95));
  dOc = max(dOc, rl - length(oc - vec2(0., rl) * 0.95));
  dOc = max(dOc, rl - length(oc + vec2(0., rl) * 0.95));
  float oculus = smoothstep(0.03, 0.03 + e, dOc);
  float glass = border * max(lights, oculus);
  // leaded quarries: diamonds, squares or roundels by style, each pane its own depth of the one colour
  float sc = 0.5 + 0.18 * fract(style * 0.37);
  vec2 d = fract(style * 0.5) < 0.5 ? vec2(q.x + q.y * 0.62, q.x - q.y * 0.62) : q;
  vec2 cell = floor(d / sc), f = fract(d / sc) - 0.5;
  float h = rHash(cell + style * 17.);
  float lw = 0.035;
  float lead = smoothstep(0.5 - lw - 0.6 * e / sc, 0.5 - lw, max(abs(f.x), abs(f.y)));
  float tone = 0.62 + 0.85 * h * h;
  float rnd = smoothstep(0.36, 0.3, length(f)) * step(1.5, style);
  tone *= mix(1., 1.45, rnd);
  float edgeBand = smoothstep(bar * 2.6, bar * 1.2, min(shw - sx, dSub)) * lights;    // a paler border round each light
  tone = mix(tone, 1.5, edgeBand * 0.7);
  float soft = clamp(blur * 1.6, 0., 1.);
  tone = mix(tone, 0.95, soft);
  return vec3(glass * tone * (1. - lead * (1. - soft)), glass, shape);
}

// what the brazier of side s (-1 | +1) throws on the point p: (light through the tracery, 1 / distance falloff)
vec2 roomBeam(vec3 p, float s){
  vec3 S = vec3(s * (uRoomDim.x + uSrc.x), uSrc.y, uWin.x + uSrcZ);
  vec3 d = p - S;
  float m = max(-s * d.x, 0.5);
  float t = min(uSrc.x / m, 1.);
  vec3 Hh = S + d * t;
  float dist = max(length(d), 1.);
  float blur = 0.03 + dist * (1. - t) * 0.012;
  vec3 g = lancetGlass(vec2(Hh.z - uWin.x, Hh.y - uWin.y), uWin.z, uWin.w - uWin.y, uSrc.z, blur);
  return vec2(g.x, clamp(22. / dist, 0., 1.3));
}

// the door of the end wall at z = zw, seen along the ray p + r * t: how much of its glow the ray meets
float roomDoor(vec3 p, vec3 r, float zw, float dx, float blur){
  float sgn = zw < -1. ? -1. : 1.;
  float rz = r.z * sgn;
  if (rz < 0.02) return 0.;
  float t = (zw - p.z) * sgn / rz;
  vec3 h = p + r * t;
  float hw = uDoorPos.z, ys = uDoorPos.w - 1.456 * hw, ax = abs(h.x - dx);
  float dArc = 1.56 * hw - length(vec2(ax + 0.56 * hw, max(h.y - ys, 0.)));
  float d = min(min(hw - ax, dArc), h.y + 0.5);
  return smoothstep(0., 0.3 + blur, d);
}

// the two windows as a polished surface sees them: r is the mirror direction at p
vec3 roomMirror(vec3 p, vec3 r, float rough){
  vec3 acc = vec3(0.);
  for (int i = 0; i < 2; i++) {
    float s = i == 0 ? -1. : 1.;
    float rx = r.x * s;
    if (rx > 0.02) {
      float t = (s * uRoomDim.x - p.x) * s / rx;
      vec3 h = p + r * t;
      vec3 g = lancetGlass(vec2(h.z - uWin.x, h.y - uWin.y), uWin.z, uWin.w - uWin.y, uSrc.z, 0.05 + rough * (0.4 + 0.05 * t));
      vec2 df = (vec2(h.z - uWin.x, h.y) - vec2(0., uSrc.y * 0.5)) / vec2(3.4, 6.5);
      float fire = exp(-dot(df, df));
      acc += uGlassCol * g.x * (1.3 + 3.2 * fire) * (s < 0. ? uFlick.x : uFlick.y);
    }
  }
  acc += uDoorA * uFlick.z * 0.55 * roomDoor(p, r, 0., uDoorPos.x, rough * 2.);
  acc += uDoorB * uFlick.w * 0.55 * roomDoor(p, r, -uRoomDim.y, uDoorPos.y, rough * 2.);
  return acc;
}

// All the light on a point of the room. n: unit normal, v: unit vector to the eye. Returns the diffuse light; spec gets
// the mirror light for a surface of this gloss (0 matt .. 1 mirror).
vec3 roomLight(vec3 p, vec3 n, vec3 v, float gloss, out vec3 spec, out vec3 beamLight){
  vec3 L = vec3(0.); beamLight = vec3(0.);
  for (int i = 0; i < 2; i++) {
    float s = i == 0 ? -1. : 1.;
    float fl = s < 0. ? uFlick.x : uFlick.y;
    vec2 b = roomBeam(p, s);
    vec3 S = vec3(s * (uRoomDim.x + uSrc.x), uSrc.y, uWin.x + uSrcZ);
    vec3 ld = normalize(S - p);
    float nl = max(dot(n, ld), 0.);
    vec3 direct = uRoomCol * (uSrc.w * b.x * b.y * fl);
    beamLight += direct;
    L += direct * nl;
    // the glass as a soft lamp
    vec3 wc = vec3(s * uRoomDim.x, mix(uWin.y, uWin.w, 0.45), uWin.x) - p;
    float wd = max(length(wc), 0.5); vec3 wl = wc / wd;
    float wrap = max(dot(n, wl) * 0.7 + 0.3, 0.);
    float cw = max(s * wl.x, 0.) * 0.8 + 0.2;
    L += uRoomCol * (uAmb.y * fl * wrap * cw * 150. / (150. + wd * wd));
  }
  // what comes through the two doors from the neighbours
  vec3 da = vec3(uDoorPos.x, 5., 1.) - p; float dal = max(length(da), 0.5);
  L += uDoorA * (uFlick.z * max(dot(n, da / dal) * 0.6 + 0.4, 0.) * max(da.z / dal, 0.) * 70. / (70. + dal * dal));
  vec3 db = vec3(uDoorPos.y, 5., -uRoomDim.y - 1.) - p; float dbl = max(length(db), 0.5);
  L += uDoorB * (uFlick.w * max(dot(n, db / dbl) * 0.6 + 0.4, 0.) * max(-db.z / dbl, 0.) * 70. / (70. + dbl * dbl));
  // the room's own colour come back from floor and walls
  float fa = 0.5 * (uFlick.x + uFlick.y);
  float low = 1. - 0.62 * smoothstep(0., uRoomDim.z * 1.25, p.y);                // the bounce is strongest near the lit floor
  float edge = min(uRoomDim.x - abs(p.x), min(-p.z, p.z + uRoomDim.y));
  float corner = 0.5 + 0.5 * smoothstep(-0.5, 3.2, edge + p.y * 0.8);               // dusk where floor and walls meet
  L += uRoomCol * (uAmb.x * fa * (0.62 + 0.38 * n.y) * low);
  L *= mix(corner, 1., 0.8 * uLook.w);
  // the bare fire of the braziers in the corridor, where a passage looks out on it
  vec3 na = uNicheA.xyz - p; float nal = max(length(na), 0.5);
  L += RFIRE * (uNicheA.w * uFlick.z * (max(dot(n, na / nal), 0.) * 0.75 + 0.25) * 30. / (30. + nal * nal));
  vec3 nb = uNicheB.xyz - p; float nbl = max(length(nb), 0.5);
  L += RFIRE * (uNicheB.w * uFlick.w * (max(dot(n, nb / nbl), 0.) * 0.75 + 0.25) * 30. / (30. + nbl * nbl));
  // the strike: a ring of light that runs out across the floor from the clock
  float rd = length(p.xz - uRing.xy);
  float band = (rd - uRing.z) / 3.2;
  L += uRingCol * (uRing.w * exp(-band * band) * exp(-max(p.y, 0.) * 0.09) * 46. / (46. + uRing.z));
  // the windows mirrored
  vec3 r = reflect(-v, n);
  float fres = 0.04 + 0.96 * pow(clamp(1. - dot(n, v), 0., 1.), 5.);
  spec = roomMirror(p, r, 1. - gloss) * mix(fres, 1., gloss * 0.35) * gloss;
  return L;
}

// the coloured air between the eye and the point
vec3 roomHaze(vec3 col, float dist){
  float k = 1. - exp(-dist * uAmb.z);
  float fa = 0.5 * (uFlick.x + uFlick.y);
  return mix(col, uRoomCol * (uAmb.w * fa), k);
}
`;

const FIRE = lin('#ff9a3c');
// Uniforms of one room. shared: { uTime } (one object for the whole world). o: the room's measures and colours.
export function roomUniforms(shared, o = {}) {
  const c = o.color || lin('#b00f1e'), g = o.glass || c;
  return {
    uTime: shared.uTime,
    uRoomCol: { value: new THREE.Vector3(c[0], c[1], c[2]) },
    uGlassCol: { value: new THREE.Vector3(g[0], g[1], g[2]) },
    uRoomDim: { value: new THREE.Vector4(o.hw ?? 13, o.L ?? 36, o.wallH ?? 13, o.crown ?? 22) },
    uWin: { value: new THREE.Vector4(o.winZ ?? -(o.L ?? 36) / 2, o.sill ?? 3, o.winHw ?? 2.8, o.winTop ?? 17) },
    uSrc: { value: new THREE.Vector4(o.srcBack ?? 9, o.srcY ?? 20, o.glassStyle ?? 0, o.beam ?? 3) },
    uSrcZ: { value: o.srcZ ?? 0 },
    uFlick: { value: new THREE.Vector4(1, 1, 1, 1) },
    uDoorA: { value: new THREE.Vector3(0, 0, 0) },
    uDoorB: { value: new THREE.Vector3(0, 0, 0) },
    uDoorPos: { value: new THREE.Vector4(o.doorAx ?? 0, o.doorBx ?? 0, o.doorHw ?? 4.7, o.doorTop ?? 12.5) },
    uAmb: { value: new THREE.Vector4(o.bounce ?? 0.2, o.soft ?? 1, o.haze ?? 0.004, o.hazeGain ?? 0.5) },
    uRing: { value: new THREE.Vector4(0, 0, 0, 0) },
    uRingCol: { value: new THREE.Vector3(1.6, 0.16, 0.12) },
    uLook: { value: new THREE.Vector4(o.floorStyle ?? 0, o.wallStyle ?? 0, o.vaultStyle ?? 0, o.velvet ?? 0) },
    uNicheA: { value: new THREE.Vector4(0, 0, 0, 0) },
    uNicheB: { value: new THREE.Vector4(0, 0, 0, 0) },
    uPhase: { value: new THREE.Vector4(o.phase ? o.phase[0] : 0, o.phase ? o.phase[1] : 0, o.phase ? o.phase[2] : 0, 0) },
  };
}
export { FIRE };

// ---------------------------------------------------------------------------------------------- the room material
// One program for every still thing in the suite and for the clock. Positions are taken into the room's space with
// uRoomInv (the inverse of the room group's world matrix), so moving parts (hands, pendulum, door leaf) need nothing more.
const ROOM_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aSurf;
uniform float uTime; uniform mat4 uRoomInv;
varying vec3 vP, vP0, vN, vN0, vCol, vV; varying vec4 vSurf; varying float vDist;
void main(){
  vec3 p = position; vP0 = p; vN0 = normal;
  float sw = aSurf.w;
  if (sw > 0.) {
    float ph = p.x * 0.31 + p.z * 0.27;
    p += normal * sw * (0.6 * sin(uTime * 0.9 + ph + p.y * 0.35) + 0.4 * sin(uTime * 1.7 + ph * 2.3 - p.y * 0.5));
  }
  vec4 wp = modelMatrix * vec4(p, 1.);
  mat3 ri = mat3(uRoomInv);
  vP = (uRoomInv * wp).xyz;
  vN = ri * (mat3(modelMatrix) * normal);
  vV = ri * (cameraPosition - wp.xyz);
  vCol = aCol; vSurf = aSurf;
  vec4 mv = viewMatrix * wp; vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const ROOM_FRAG = /* glsl */`
varying vec3 vP, vP0, vN, vN0, vCol, vV; varying vec4 vSurf; varying float vDist;
uniform vec4 uDial;        // dial centre x, y (mesh space), radius, hand glow
const vec3 FIRECOL = vec3(1.0, 0.33, 0.045);
${ROOM_GLSL}
float carve(vec2 f){ return sin(f.x * 3. + 1.6 * sin(f.y * 2.1)) * sin(f.y * 3. + 1.6 * sin(f.x * 1.9)); }
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float kind = floor(vSurf.x + 0.5), gloss = vSurf.y, gold = vSurf.z;
  vec3 alb = vCol, emis = vec3(0.);
  vec3 p = vP, p0 = vP0, a0 = abs(vN0);
  vec2 uv; vec3 T, B;
  if (a0.y > 0.7) { uv = p0.xz; T = vec3(1., 0., 0.); B = vec3(0., 0., 1.); }
  else if (a0.x > a0.z) { uv = p0.zy; T = vec3(0., 0., 1.); B = vec3(0., 1., 0.); }
  else { uv = p0.xy; T = vec3(1., 0., 0.); B = vec3(0., 1., 0.); }
  float sheen = 0.;
  float fa = 0.5 * (uFlick.x + uFlick.y);
  if (kind == 1.) {                                   // dressed stone
    vec2 b = uv / vec2(2.4, 1.2); b.x += 0.5 * floor(b.y); vec2 fb = fract(b);
    float joint = smoothstep(0., .035, fb.x) * smoothstep(1., .965, fb.x) * smoothstep(0., .07, fb.y) * smoothstep(1., .93, fb.y);
    alb *= (0.86 + 0.2 * rHash(floor(b))) * mix(0.72, 1., joint) * (0.88 + 0.24 * rNoise(uv * 2.3));
  } else if (kind == 2.) {                            // polished floor: chequer, lozenge or star inlay
    float st = uLook.x;
    vec2 f = uv / 2.6;
    if (st > 0.5 && st < 1.5) f = vec2(f.x + f.y, f.x - f.y) * 0.7071;
    vec2 c = floor(f), ff = fract(f) - 0.5;
    float chk = mod(c.x + c.y, 2.);
    float inlay = st > 1.5 ? smoothstep(0.34, 0.31, abs(ff.x) + abs(ff.y)) : 0.;
    float seam = smoothstep(0.5, 0.485, max(abs(ff.x), abs(ff.y)));
    float veins = rNoise(uv * 1.1 + c * 7.3) * 0.6 + rNoise(uv * 4.3) * 0.4;
    alb *= mix(0.2, 1., mix(chk, 1. - chk, inlay)) * (0.75 + 0.4 * veins) * mix(0.5, 1., seam);
    float star = st > 2.5 ? smoothstep(0.1, 0.08, length(ff)) : 0.;
    gold = max(gold, star);
    alb = mix(alb, vec3(1., 0.62, 0.2), star);
  } else if (kind == 3.) {                            // tapestry: a diaper in gold thread, the pattern of this room
    float ws = uLook.y, motif = 0., shade = 1.;
    if (ws < 0.5) {                                   // lozenges
      vec2 f = uv / 1.25; vec2 ff = fract(f) - .5; vec2 c = floor(f);
      float lz = abs(ff.x) + abs(ff.y);
      motif = smoothstep(0.44, 0.41, lz) * smoothstep(0.26, 0.29, lz) + smoothstep(0.13, 0.1, length(ff));
      shade = mix(1., 0.5, smoothstep(0.26, 0.2, lz) * mod(c.x + c.y, 2.));
    } else if (ws < 1.5) {                            // roundels, each with a quatrefoil
      vec2 f = uv / 1.5; f.x += 0.5 * floor(f.y); vec2 ff = fract(f) - .5;
      float r = length(ff); vec2 q = abs(ff); if (q.y > q.x) q = q.yx;
      motif = smoothstep(0.05, 0.03, abs(r - 0.38)) + smoothstep(0.075, 0.055, length(q - vec2(0.17, 0.))) + smoothstep(0.05, 0.035, r);
      shade = mix(1., 0.55, smoothstep(0.36, 0.33, r));
    } else if (ws < 2.5) {                            // an ogee net with a sprig in every mesh
      vec2 f = uv / vec2(1.5, 2.4);
      float w = 0.24 * sin(f.y * 6.2832);
      float l1 = abs(fract(f.x + w) - 0.5), l2 = abs(fract(f.x - w) - 0.5);
      vec2 g = vec2(fract(f.x * 2. + 0.5) - 0.5, fract(f.y * 2.) - 0.5) * vec2(0.75, 1.2);
      float lz = abs(g.x) * 1.5 + abs(g.y);
      motif = smoothstep(0.06, 0.035, min(l1, l2)) + smoothstep(0.3, 0.27, lz) * smoothstep(0.17, 0.2, lz) + smoothstep(0.09, 0.07, length(g));
      shade = mix(1., 0.6, smoothstep(0.17, 0.14, lz));
    } else {                                          // chevron bands
      vec2 f = uv / vec2(1.3, 1.7);
      float zz = abs(fract(f.x) - 0.5);
      float fy = f.y + zz * 0.9, band = abs(fract(fy) - 0.5);
      vec2 g = vec2(fract(f.x + 0.5) - 0.5, fract(fy + 0.5) - 0.5);
      motif = smoothstep(0.1, 0.07, band) * smoothstep(0.02, 0.04, band) + smoothstep(0.1, 0.08, length(g * vec2(1., 1.3)));
      shade = mix(0.6, 1., step(0.5, fract(fy * 0.5)));
    }
    motif = clamp(motif, 0., 1.);
    float weave = 0.82 + 0.18 * sin(uv.x * 46.) * sin(uv.y * 46.);
    alb *= weave * (0.7 + 0.3 * rNoise(uv * 0.7 + 3.)) * shade;
    gold = max(gold, motif * 0.85);
    alb = mix(alb, vec3(1., 0.62, 0.2), motif * 0.85);
    sheen = 0.15;
  } else if (kind == 4.) {                            // velvet in heavy folds
    float along = a0.y > 0.7 ? p0.x : uv.x;
    float ph = along * 2.1 + 1.1 * sin(along * 0.63 + 1.7) + 0.5 * sin(uv.y * 0.21 + along * 0.3);
    float fold = cos(ph);
    vec3 tn = a0.y > 0.7 ? vec3(1., 0., 0.) : normalize(cross(vec3(0., 1., 0.), n) + vec3(1e-4, 0., 0.));
    n = normalize(n + tn * fold * 0.85);
    alb *= mix(0.5 + 0.5 * sin(ph), 0.72 + 0.28 * sin(ph), uLook.w);
    sheen = 1.;
  } else if (kind == 6.) {                            // vault web: plaster, a painted net, and the glints the dance throws up
    vec2 m = p0.xz * 0.3; float tt = uTime * 0.22;
    float sp = rNoise(m + vec2(tt, -tt * 0.7)) * rNoise(m * 1.9 - vec2(tt * 0.6, tt));
    float glint = smoothstep(0.3, 0.62, sp);
    alb *= 0.8 + 0.25 * rNoise(p0.xz * 0.8);
    vec2 st2 = p0.xz / 3.2; vec2 fs = fract(st2) - .5;
    float star = uLook.z > 0.5 ? smoothstep(0.075, 0.05, length(fs)) * step(0.55, rHash(floor(st2))) : 0.;
    gold = max(gold, star); alb = mix(alb, vec3(1., 0.62, 0.2), star);
    emis += (uRoomCol * 0.5 + FIRECOL * 0.06) * glint * fa * (1. - uLook.w);
  } else if (kind == 7.) {                            // carpet: medallions, a small flower between them, a lighter thread round each
    vec2 f = uv / 3.4; vec2 ff = fract(f) - .5;
    float lz = abs(ff.x) + abs(ff.y);
    float medal = smoothstep(0.4, 0.37, lz) * smoothstep(0.24, 0.27, lz) + smoothstep(0.12, 0.09, lz);
    vec2 g2 = fract(f + 0.5) - .5;
    float flower = smoothstep(0.11, 0.08, length(g2));
    float thread = smoothstep(0.03, 0.012, abs(lz - 0.455));
    alb *= (0.8 + 0.2 * rNoise(uv * 9.)) * mix(1., 0.28, clamp(medal + flower, 0., 1.)) * mix(1., 2.1, thread);
    sheen = 0.35;
  } else if (kind == 8.) {                            // polished carved wood
    vec2 f = uv * 2.3; float e = 0.05;
    float h0 = carve(f) + 0.5 * carve(f * 2.7 + 3.), hx = carve(f + vec2(e, 0.)) + 0.5 * carve((f + vec2(e, 0.)) * 2.7 + 3.), hy = carve(f + vec2(0., e)) + 0.5 * carve((f + vec2(0., e)) * 2.7 + 3.);
    n = normalize(n - (T * (hx - h0) + B * (hy - h0)) * (0.05 / e));
    alb *= 0.8 + 0.15 * h0;
  } else if (kind == 9.) {                            // fire and coals
    float fl = 0.7 + 0.6 * rNoise(vec2(uTime * 5. + uPhase.z, p0.y * 2. + p0.x));
    emis += alb * fl * 3.2; alb = vec3(0.);
  } else if (kind == 12.) {                           // stone lit by a bare brazier (the corridor): the light is in the vertex colour
    vec2 bb = uv / vec2(2.4, 1.2); bb.x += 0.5 * floor(bb.y); vec2 fb = fract(bb);
    float joint = smoothstep(0., .035, fb.x) * smoothstep(1., .965, fb.x) * smoothstep(0., .07, fb.y) * smoothstep(1., .93, fb.y);
    emis += alb * mix(0.6, 1., joint) * (0.8 + 0.4 * rNoise(vec2(uTime * 3.3 + uPhase.z, 7.3)) + 0.15 * rNoise(vec2(uTime * 9.1 + uPhase.z * 1.7, 2.1)));
    alb = vec3(0.);
  } else if (kind == 10.) {                           // gold: chased
    vec2 f = uv * 5.; float e = 0.1;
    float h0 = carve(f), hx = carve(f + vec2(e, 0.)), hy = carve(f + vec2(0., e));
    n = normalize(n - (T * (hx - h0) + B * (hy - h0)) * (0.03 / e));
    gold = 1.;
  } else if (kind == 11.) {                           // the dial: marks and rings, no numerals
    vec2 d = (p0.xy - uDial.xy) / max(uDial.z, 1e-3);
    float r = length(d), a = atan(d.y, d.x + 1e-6);
    float h12 = abs(fract(a / 6.2832 * 12.) - .5), m60 = abs(fract(a / 6.2832 * 60.) - .5);
    float hour = smoothstep(0.1, 0.07, h12 * 2. / max(r, 0.2)) * smoothstep(0.66, 0.68, r) * smoothstep(0.92, 0.9, r);
    float minute = smoothstep(0.2, 0.14, m60) * smoothstep(0.83, 0.845, r) * smoothstep(0.92, 0.905, r);
    float rings = smoothstep(0.012, 0.004, abs(r - 0.94)) + smoothstep(0.008, 0.003, abs(r - 0.62)) + smoothstep(0.008, 0.003, abs(r - 0.3));
    float rose = smoothstep(0.02, 0., abs(r - 0.21 - 0.07 * cos(a * 8.))) * step(r, 0.3);
    float ink = clamp(hour + minute + rings + rose, 0., 1.);
    alb = mix(alb * (0.86 + 0.14 * rNoise(d * 9.)), vec3(0.015), ink);
    emis += alb * uRoomCol * uDial.w;
  }
  vec3 col;
  if (kind == 5.) {                                   // the stained window, the fire behind it
    float s = p.x < 0. ? -1. : 1.;
    vec2 q = vec2(p.z - uWin.x, p.y - uWin.y);
    vec3 g = lancetGlass(q, uWin.z, uWin.w - uWin.y, uSrc.z, 0.);
    vec3 vd = -v;
    float kb = 1.6 / max(abs(vd.x), 0.45);
    vec2 qb = vec2(p.z, p.y) + vd.zy * kb - vec2(uWin.x, uSrc.y * 0.46);
    float fl = s < 0. ? uFlick.x : uFlick.y;
    float lick = rNoise(vec2(qb.x * 0.7 + s * 3., qb.y * 0.45 - uTime * 2.6 - (s < 0. ? uPhase.x : uPhase.y)));
    vec2 df = qb / vec2(3.6 + 1.4 * lick, 6.4 + 2.8 * lick);
    float fire = exp(-dot(df, df)) * (0.75 + 0.5 * lick);
    float fall = 0.55 + 0.45 * exp(-max(q.y - uSrc.y * 0.46 + uWin.y, 0.) * 0.09);
    // the brazier itself, dark against its own fire: a bowl on three legs
    vec2 tb = qb + vec2(0., 2.6);
    float bowl = smoothstep(0.14, 0., length(tb / vec2(2.3, 0.9)) - 1.) * step(tb.y, 0.2);
    float ly = clamp(-tb.y - 0.6, 0., 9.);
    float legs = (smoothstep(0.3, 0.12, abs(abs(tb.x) - 0.5 - 0.3 * ly)) + smoothstep(0.3, 0.12, abs(tb.x))) * step(0.6, -tb.y) * step(-tb.y, 9.6);
    float sil = clamp(bowl + legs, 0., 1.);
    float deep = 1. - 0.6 * uLook.w;                                        // the scarlet panes stay a deep colour
    col = uGlassCol * g.x * fl * (2.1 * fall + 5.5 * fire) * deep + FIRECOL * g.x * fire * fire * fl * 1.1 * (1. - uLook.w);
    col *= mix(1., 0.1, sil);
    vec3 stone = vec3(0.06) * uRoomCol * fa * 0.6;
    col = mix(stone, col, g.y);
  } else {
    vec3 spec, beamL;
    vec3 L = roomLight(p, n, v, gloss, spec, beamL);
    float lm = max(max(L.r, L.g), L.b) * 0.55 + dot(L, vec3(0.3, 0.5, 0.2)) * 0.45;
    if (kind == 2.) { L = mix(L, vec3(1., 0.93, 0.84) * lm, 0.42); spec *= 0.5; }      // the floor takes a whiter key than the walls, so that the dance reads against it
    float gk = 1. - 0.55 * uLook.w;
    vec3 Lw = mix(L, (vec3(1., 0.74, 0.4) * lm * 1.25 * gk + L * 0.3) * (0.45 + 0.55 * pow(clamp(dot(n, v), 0., 1.), 0.6)), gold);
    float sm = max(max(spec.r, spec.g), spec.b);
    vec3 sp = mix(spec, vec3(1., 0.72, 0.36) * sm * 1.6 * gk + spec * 0.4, gold);
    col = alb * Lw + sp + emis;
    float rim = pow(clamp(1. - dot(n, v), 0., 1.), 2.5);
    col += (L + beamL * 0.35) * rim * sheen * (0.25 + 0.5 * uLook.w) * (0.25 + alb * 3.);
  }
  col = roomHaze(col, vDist);
  gl_FragColor = vec4(col, 1.);
}`;

export function roomMaterial(uniforms, o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uRoomInv: { value: o.roomInv || new THREE.Matrix4() }, uDial: { value: o.dial || new THREE.Vector4(0, 0, 1, 0) } },
    vertexShader: ROOM_VERT, fragmentShader: ROOM_FRAG, side: o.side ?? THREE.DoubleSide,
  });
  return m;
}

// ---------------------------------------------------------------------------------------------- the masquers
// A pair is one instance: the lady at x = -PD facing +x, her partner at +PD facing her, hands joined on the +z side.
// Built at twice life size (the suite is built at that scale). aSurf = (slot, who + 2 * head, gloss, flare weight):
// slot 0 fixed colour, 1 the figure's own colour, 2 the pair's second colour, 3 gold, 4 lantern, 5 mask, 6 feather.
const PD = 0.66;
export const HEADS = ['plume', 'horns', 'beak', 'lantern', 'sunrays', 'hennin', 'tricorn', 'jester', 'antlers', 'crescent', 'turban'];
const WHITE = [1, 1, 1], DARK = [0.03, 0.03, 0.035], PALE = [0.9, 0.86, 0.78], GOLDC = [1, 0.72, 0.34];
const lathe = (b, prof, seg, zs = 1, sway = null, a0 = 0, a1 = TAU) => {
  const m = prof.length - 1;
  b.grid(seg, m, (u, v, o) => {
    const f = v * m, i = Math.min(m - 1, Math.floor(f)), t = f - i, r = lerp(prof[i][0], prof[i + 1][0], t), y = lerp(prof[i][1], prof[i + 1][1], t), a = lerp(a0, a1, u);
    o[0] = Math.sin(a) * r; o[1] = y; o[2] = Math.cos(a) * r * zs;
  }, true, sway);
};

function headInto(b, who, kind, hy, rng, maskCol) {
  const S = (slot, gloss = 0.2, flare = 0) => b.surf(slot, who + 2, gloss, flare);
  // the head is a hood; the mask covers the whole face
  S(6, 0.15); b.col([0.8, 0.8, 0.8]); b.geo(new THREE.SphereGeometry(1, 9, 7), { p: [0, hy, -0.02], s: [0.25, 0.3, 0.27] });
  S(5, 0.75); b.col(maskCol); b.geo(new THREE.SphereGeometry(1, 9, 7, 0, Math.PI), { p: [0, hy - 0.01, 0.05], s: [0.245, 0.31, 0.25] });
  S(0, 0.05); b.col([0.004, 0.004, 0.006]);
  for (const sx of [-1, 1]) b.geo(new THREE.SphereGeometry(1, 6, 4), { p: [sx * 0.1, hy + 0.05, 0.265], s: [0.06, 0.035, 0.03], r: [0, sx * 0.25, sx * 0.2] });
  const feather = (base, dir, len, wid, bend) => {
    const side = [dir[1] * 0 - dir[2] * 1, 0, dir[0] * 1];
    const sl = Math.hypot(side[0], side[2]) || 1; side[0] /= sl; side[2] /= sl;
    b.grid(1, 4, (u, v, o) => {
      const w = wid * (0.35 + 1.3 * v * (1 - v) * 2) * (u - 0.5) * 2, c = bend * v * v * len;
      o[0] = base[0] + dir[0] * len * v + side[0] * w + bend * 0; o[1] = base[1] + dir[1] * len * v - c * 0.35; o[2] = base[2] + dir[2] * len * v + side[2] * w - c;
    }, false, (u, v) => 0.15 + 0.75 * v);
  };
  if (kind === 'plume') {
    S(6, 0.1); b.col(WHITE);
    const nf = 5;
    for (let i = 0; i < nf; i++) { const a = (i / (nf - 1) - 0.5) * 1.7; feather([Math.sin(a) * 0.1, hy + 0.24, -0.08], [Math.sin(a) * 0.55, 0.83, -0.12], rng.range(1.0, 1.5), 0.2, 0.3); }
    S(3, 0.8); b.col(GOLDC); b.geo(new THREE.SphereGeometry(0.09, 6, 4), { p: [0, hy + 0.27, 0.1] });
  } else if (kind === 'horns') {
    S(3, 0.8); b.col(GOLDC);
    for (const sx of [-1, 1]) {
      const pts = [[sx * 0.18, hy + 0.18, 0], [sx * 0.5, hy + 0.5, 0], [sx * 0.62, hy + 0.95, 0.05], [sx * 0.42, hy + 1.32, 0.12]];
      const rr = [0.1, 0.075, 0.045, 0.012];
      for (let i = 0; i < 3; i++) b.rod(pts[i], pts[i + 1], rr[i], rr[i + 1], 5);
    }
  } else if (kind === 'beak') {
    S(5, 0.7); b.col(maskCol); b.geo(new THREE.ConeGeometry(0.13, 0.8, 6), { p: [0, hy - 0.07, 0.58], r: [Math.PI / 2 + 0.22, 0, 0] });
    S(6, 0.1); b.col(WHITE);
    for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.5; feather([Math.sin(a) * 0.1, hy + 0.25, 0.02], [Math.sin(a) * 0.4, 0.75, -0.5], 0.8, 0.14, 0.2); }
  } else if (kind === 'lantern') {
    S(3, 0.8); b.col(GOLDC);
    const arc = []; for (let i = 0; i <= 6; i++) { const a = (i / 6 - 0.5) * Math.PI; arc.push([Math.sin(a) * 0.55, hy + 0.2 + Math.cos(a) * 0.75, -0.05]); }
    b.tube(arc, 0.035, 4);
    for (const a of [-0.9, 0, 0.9]) {
      const x = Math.sin(a) * 0.55, y = hy + 0.2 + Math.cos(a) * 0.75;
      S(3, 0.8); b.col(GOLDC); b.rod([x, y, -0.05], [x, y + 0.2, -0.05], 0.02, 0.02, 4);
      b.geo(new THREE.ConeGeometry(0.13, 0.12, 5), { p: [x, y + 0.5, -0.05] });
      S(4, 0.2); b.col(WHITE); b.geo(new THREE.CylinderGeometry(0.11, 0.09, 0.28, 6), { p: [x, y + 0.33, -0.05] });
    }
  } else if (kind === 'sunrays') {
    S(3, 0.8); b.col(GOLDC);
    for (let i = 0; i < 11; i++) {
      const a = (i / 10 - 0.5) * 3.6, l = i % 2 ? 0.7 : 1.05, w = 0.07, c = Math.cos(a), s = Math.sin(a);
      b.tri([s * 0.3 - c * w, hy + c * 0.3 + s * w, -0.14], [s * 0.3 + c * w, hy + c * 0.3 - s * w, -0.14], [s * l, hy + c * l, -0.2]);
    }
    b.geo(new THREE.TorusGeometry(0.31, 0.04, 4, 12), { p: [0, hy, -0.14] });
  } else if (kind === 'hennin') {
    S(2, 0.3); b.col(WHITE); b.geo(new THREE.ConeGeometry(0.24, 1.35, 7), { p: [0, hy + 0.72, -0.3], r: [-0.42, 0, 0] });
    S(6, 0.1); b.col(PALE);
    b.grid(2, 4, (u, v, o) => { o[0] = (u - 0.5) * (0.2 + 0.5 * v); o[1] = hy + 1.33 - v * 1.7; o[2] = -0.58 - v * 0.75 - 0.2 * Math.sin(v * 3); }, false, (u, v) => 0.2 + 0.8 * v);
  } else if (kind === 'tricorn') {
    S(0, 0.3); b.col([0.05, 0.05, 0.06]); b.geo(new THREE.CylinderGeometry(0.62, 0.5, 0.17, 3), { p: [0, hy + 0.27, 0], r: [0, Math.PI, 0] });
    b.geo(new THREE.CylinderGeometry(0.22, 0.27, 0.22, 7), { p: [0, hy + 0.4, 0] });
    S(3, 0.8); b.col(GOLDC); b.geo(new THREE.TorusGeometry(0.5, 0.03, 4, 3), { p: [0, hy + 0.36, 0], r: [Math.PI / 2, 0, Math.PI / 2] });
    S(6, 0.1); b.col(WHITE); feather([0.2, hy + 0.4, -0.05], [0.45, 0.7, -0.4], 1.1, 0.2, 0.35);
  } else if (kind === 'jester') {
    for (const sx of [-1, 1]) {
      S(sx < 0 ? 1 : 2, 0.25); b.col(WHITE);
      const pts = [[sx * 0.1, hy + 0.2, 0], [sx * 0.5, hy + 0.55, 0], [sx * 0.85, hy + 0.4, 0.05], [sx * 0.98, hy + 0.05, 0.08]];
      const rr = [0.2, 0.14, 0.08, 0.03];
      for (let i = 0; i < 3; i++) b.rod(pts[i], pts[i + 1], rr[i], rr[i + 1], 6);
      S(3, 0.9); b.col(GOLDC); b.geo(new THREE.SphereGeometry(0.085, 6, 4), { p: [sx * 0.99, hy - 0.02, 0.08] });
    }
  } else if (kind === 'antlers') {
    S(3, 0.7); b.col(GOLDC);
    for (const sx of [-1, 1]) {
      const a = [sx * 0.15, hy + 0.22, -0.03], m = [sx * 0.45, hy + 0.75, -0.08], t = [sx * 0.7, hy + 1.35, 0];
      b.rod(a, m, 0.06, 0.045, 5); b.rod(m, t, 0.045, 0.012, 5);
      b.rod(m, [sx * 0.75, hy + 0.85, 0.12], 0.035, 0.01, 4); b.rod([sx * 0.56, hy + 1.02, -0.04], [sx * 0.42, hy + 1.3, 0.1], 0.03, 0.01, 4);
      b.rod([sx * 0.3, hy + 0.5, -0.06], [sx * 0.34, hy + 0.72, 0.2], 0.03, 0.01, 4);
    }
  } else if (kind === 'crescent') {
    S(3, 0.9); b.col([0.9, 0.9, 0.95]);
    b.geo(new THREE.TorusGeometry(0.62, 0.075, 5, 14, Math.PI * 1.25), { p: [0, hy + 0.55, -0.16], r: [0, 0, -Math.PI * 0.125 + Math.PI], s: [1, 1, 0.5] });
  } else {                                                           // turban with a jewel and an aigrette
    S(2, 0.3); b.col(WHITE); b.geo(new THREE.SphereGeometry(1, 9, 6), { p: [0, hy + 0.22, -0.03], s: [0.4, 0.27, 0.4] });
    S(4, 0.3); b.col(WHITE); b.geo(new THREE.SphereGeometry(0.07, 6, 4), { p: [0, hy + 0.26, 0.38] });
    S(6, 0.1); b.col(WHITE); feather([0, hy + 0.3, 0.33], [0, 0.95, -0.2], 0.95, 0.13, 0.25);
  }
}

// one figure, standing at the origin and facing +z; b.tr() has the pair transform
function ladyInto(b, f, rng) {
  const S = (slot, gloss = 0.2, flare = 0) => b.surf(slot, 0, gloss, flare);
  const hem = f.wide ? 1.42 : 1.22;
  S(1, 0.25); b.col(WHITE);
  lathe(b, [[0.3, 1.95], [0.5, 1.78], [0.82, 1.3], [hem * 0.86, 0.72], [hem * 0.97, 0.26], [hem, 0.04]], 16, 1, (u, v) => Math.pow(v, 1.3));
  S(2, 0.3); b.col(WHITE);                                           // overskirt, open in front
  lathe(b, [[0.32, 1.98], [0.56, 1.8], [0.9, 1.34], [hem * 0.93, 0.95]], 12, 1, (u, v) => 0.7 * v, 0.5, TAU - 0.5);
  S(1, 0.3); b.col(WHITE);
  lathe(b, [[0.3, 1.93], [0.4, 2.28], [0.43, 2.48], [0.33, 2.68], [0.12, 2.78]], 8, 0.78);
  S(3, 0.8); b.col(GOLDC); b.geo(new THREE.TorusGeometry(0.31, 0.04, 4, 10), { p: [0, 1.96, 0], r: [Math.PI / 2, 0, 0] });
  S(2, 0.3); b.col(WHITE);
  for (const sx of [-1, 1]) b.geo(new THREE.SphereGeometry(0.27, 7, 5), { p: [sx * 0.43, 2.56, 0], s: [1, 0.9, 0.9] });
  S(0, 0.2); b.col(PALE);
  b.rod([-0.45, 2.52, 0], [-0.66, 2.12, 0.3], 0.1, 0.085, 5); b.rod([-0.66, 2.12, 0.3], [-0.7, 2.3, 0.66], 0.085, 0.07, 5);
  b.rod([0.45, 2.52, 0], [0.62, 2.5, 0.5], 0.1, 0.085, 5); b.rod([0.62, 2.5, 0.5], [0.4, 2.82, 1.02], 0.085, 0.07, 5);
  b.rod([0, 2.72, 0], [0, 2.86, 0], 0.1, 0.09, 5);
  if (f.ruff) { b.surf(0, 2, 0.2, 0); b.col(PALE); b.grid(12, 1, (u, v, o) => { const a = u * TAU, r = 0.16 + 0.34 * v; o[0] = Math.sin(a) * r; o[1] = 2.8 + 0.05 * Math.sin(a * 6) * v; o[2] = Math.cos(a) * r; }, true); }
  headInto(b, 0, f.head, 3.04, rng, f.mask || PALE);
}
function gentInto(b, f, rng) {
  const S = (slot, gloss = 0.2, flare = 0) => b.surf(slot, 1, gloss, flare);
  S(2, 0.25); b.col(WHITE);
  for (const sx of [-1, 1]) {
    b.rod([sx * 0.18, 1.74, 0], [sx * 0.22, 0.95, 0.07], 0.19, 0.14, 5); b.rod([sx * 0.22, 0.95, 0.07], [sx * 0.21, 0.14, 0], 0.14, 0.1, 5);
  }
  S(0, 0.4); b.col([0.03, 0.03, 0.035]);
  for (const sx of [-1, 1]) b.box(sx * 0.21, 0.1, 0.1, 0.22, 0.2, 0.52);
  S(2, 0.25); b.col(WHITE); b.geo(new THREE.SphereGeometry(1, 8, 5), { p: [0, 1.74, 0], s: [0.44, 0.36, 0.36] });
  S(1, 0.3); b.col(WHITE);
  lathe(b, [[0.34, 1.86], [0.45, 2.3], [0.52, 2.72], [0.4, 2.94], [0.13, 3.04]], 8, 0.72);
  S(3, 0.8); b.col(GOLDC); b.geo(new THREE.TorusGeometry(0.36, 0.045, 4, 10), { p: [0, 1.9, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.75, 1] });
  S(1, 0.3); b.col(WHITE);
  b.rod([0.5, 2.8, 0], [0.72, 2.3, 0.3], 0.13, 0.1, 5); b.rod([0.72, 2.3, 0.3], [0.7, 2.3, 0.66], 0.1, 0.08, 5);
  b.rod([-0.5, 2.8, 0], [-0.72, 2.5, 0.5], 0.13, 0.1, 5); b.rod([-0.72, 2.5, 0.5], [-0.32, 2.36, 1.3], 0.1, 0.08, 5);
  b.rod([0, 2.98, 0], [0, 3.14, 0], 0.11, 0.1, 5);
  // the cloak: from the shoulders, round the back, to the calves
  S(2, 0.2); b.col(WHITE);
  const cl = f.long ? 0.35 : 0.75;
  b.grid(9, 5, (u, v, o) => { const a = Math.PI + (u - 0.5) * 3.9, r = 0.52 + 0.72 * Math.pow(v, 0.8) + 0.05 * Math.sin(u * 22) * v; o[0] = Math.sin(a) * r; o[1] = 2.96 - v * (2.96 - cl); o[2] = Math.cos(a) * r * 0.9; }, false, (u, v) => v * v);
  if (f.ruff) { b.surf(0, 3, 0.2, 0); b.col(PALE); b.grid(12, 1, (u, v, o) => { const a = u * TAU, r = 0.18 + 0.36 * v; o[0] = Math.sin(a) * r; o[1] = 3.08 + 0.05 * Math.sin(a * 6) * v; o[2] = Math.cos(a) * r; }, true); }
  headInto(b, 1, f.head, 3.34, rng, f.mask || PALE);
}
// fashion: { lady: { head, wide, ruff, mask }, gent: { head, long, ruff, mask } }
// pairParts builds the pair in pieces (a generator: step it with next(), the geometry is the value it ends with)
export function* pairParts(fashion, rng) {
  const b = makeBatch(4096), m = new THREE.Matrix4();
  b.tr(m.makeRotationY(Math.PI / 2).setPosition(-PD, 0, 0)); ladyInto(b, fashion.lady, rng);
  yield;
  b.tr(m.makeRotationY(-Math.PI / 2).setPosition(PD, 0, 0)); gentInto(b, fashion.gent, rng);
  b.tr(null);
  yield;
  return b.build();
}
export function pairGeometry(fashion, rng) {
  const parts = pairParts(fashion, rng); let r = parts.next();
  while (!r.done) r = parts.next();
  return r.value;
}

const MASQ_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aSurf;
attribute vec4 iHome;      // x, z of the pair's place in the room, radius of its round, size
attribute vec4 iAnim;      // start angle, turn rate (rad per second of the dance, signed), rate of the round, seed
attribute vec3 iColA; attribute vec3 iColB; attribute vec3 iColC;
uniform float uDance, uStop, uWild, uTime; uniform vec2 uDoorAt;   // uDance: seconds of dance, given by the world from the metres flown
varying vec3 vP, vP0, vN, vCol, vV, vColP, vColC; varying vec4 vSurf; varying float vDist, vSeed, vWho;
vec2 rotY(vec2 q, float a){ float c = cos(a), s = sin(a); return vec2(q.x * c + q.y * s, -q.x * s + q.y * c); }
void main(){
  float who = mod(aSurf.y, 2.), head = step(1.5, aSurf.y), fw = aSurf.w;
  float go = 1. - uStop;
  float sgn = who < 0.5 ? -1. : 1., fx = sgn * ${PD.toFixed(2)};
  float th = iAnim.x + iAnim.y * uDance;
  float sd = fract(iAnim.w * 7.31 + who * 0.37);
  // on the clock, and only while they dance: each figure sways and bobs a little in its own time, each pair rocks on its place
  float ck = uTime * (1.1 + 0.6 * sd) + iAnim.w * 40. + who * 2.1;
  float rock = 0.13 * sin(uTime * 0.8 + iAnim.w * 23.) * go;
  vec3 p = position, n = normal;
  vP0 = p;
  p.y *= mix(0.88, 1.2, sd * sd);                                  // unsuited limbs: every figure its own stretch
  float bob = (0.1 * sin(2. * th + 1.3) + 0.06 * sin(ck * 1.6)) * go * uWild;
  vec2 r = p.xz - vec2(fx, 0.); float rl = max(length(r), 1e-3);
  r += r / rl * fw * go * (0.2 + 0.12 * sin(2. * th + sd * 6.) + 0.07 * sin(ck * 1.3)) * uWild;        // skirts and cloaks fly out
  float trail = (-sign(iAnim.y) * fw * 0.5 + 0.14 * sin(ck)) * go;   // and trail the turn; the figure's own sway
  r = rotY(r, trail); n.xz = rotY(n.xz, trail);
  r.x += sgn * fw * 0.24 * go;
  float oa = iAnim.x * 3.7 + iAnim.z * uDance;
  vec2 c = iHome.xy + iHome.z * vec2(cos(oa), 0.7 * sin(oa));
  vec2 td = uDoorAt - c;
  float aT = atan(-td.y, td.x + 1e-4), aF = th + rock + (who < 0.5 ? 0. : 3.14159);
  float dl = clamp(mod(aT - aF + 3.14159, 6.28318) - 3.14159, -1.25, 1.25) * uStop * head;   // masks turn to the last doorway
  r = rotY(r, dl); n.xz = rotY(n.xz, dl);
  r.x += sgn * 0.003 * p.y * p.y * go * uWild;                     // leaning out of the turn
  p.xz = r + vec2(fx, 0.);
  p.y += bob * (1. - 0.6 * fw);
  p.xz = rotY(p.xz, th + rock); n.xz = rotY(n.xz, th + rock);
  p *= iHome.w; p.xz += c;
  vP = p; vN = n; vCol = aCol; vSurf = aSurf; vSeed = iAnim.w; vWho = who;
  vColP = who < 0.5 ? iColA : iColB; vColC = iColC;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vV = (cameraPosition - wp.xyz) * mat3(modelMatrix);
  vec4 mv = viewMatrix * wp; vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const MASQ_FRAG = /* glsl */`
varying vec3 vP, vP0, vN, vCol, vV, vColP, vColC; varying vec4 vSurf; varying float vDist, vSeed, vWho;
const vec3 FIRECOL = vec3(1.0, 0.33, 0.045);
${ROOM_GLSL}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float slot = floor(vSurf.x + 0.5), gloss = vSurf.z, gold = 0.;
  vec3 alb = vCol, emis = vec3(0.);
  float fx = vWho < 0.5 ? -${PD.toFixed(2)} : ${PD.toFixed(2)};
  vec2 rr = vP0.xz - vec2(fx, 0.);
  vec2 uv = vec2(atan(rr.y, rr.x + 1e-4) * 2.2, vP0.y * 1.5);
  float sequin = 0.;
  if (slot == 1.) {
    float kindP = fract(vSeed * 3.17 + vWho * 0.41);
    float pat = 1.;
    if (kindP < 0.3) { vec2 d = vec2(uv.x + uv.y, uv.x - uv.y) * 0.9; pat = mod(floor(d.x) + floor(d.y), 2.); }      // harlequin
    else if (kindP < 0.55) pat = step(0.5, fract(uv.x * 1.6));                                                    // stripes
    else if (kindP < 0.75) pat = step(0.5, fract(uv.y * 1.3 + 0.2 * sin(uv.x * 4.)));                              // flounces
    alb *= vColP * mix(0.4, 1., pat);
    sequin = kindP > 0.2 ? 1. : 0.5;
  } else if (slot == 2.) { alb *= vColC; sequin = 0.5; }
  else if (slot == 3.) { gold = 1.; }
  else if (slot == 4.) { emis = (uGlassCol * 2.2 + vec3(0.12)) * (0.85 + 0.15 * sin(uTime * 9. + vSeed * 40.)); alb = vec3(0.); }
  else if (slot == 6.) { alb *= mix(vColP, vec3(1.), 0.45); }
  vec3 spec, beamL;
  vec3 L = roomLight(vP, n, v, gloss, spec, beamL);
  float lm = max(max(L.r, L.g), L.b) * 0.55 + dot(L, vec3(0.3, 0.5, 0.2)) * 0.45;
  // the figures take a whiter, warmer key than the walls (and never burn out in a beam), so masks and gowns stand clear of the room
  float knee = 2.4 / (2.4 + max(lm - 1., 0.));
  L = mix(L, vec3(1., 0.9, 0.76) * lm, 0.55) * knee; lm *= knee;
  vec3 Lw = mix(L, (vec3(1., 0.74, 0.4) * lm * 1.25 + L * 0.3) * (0.45 + 0.55 * pow(clamp(dot(n, v), 0., 1.), 0.6)), gold);
  float sm = max(max(spec.r, spec.g), spec.b);
  vec3 sp = mix(spec, vec3(1., 0.72, 0.36) * sm * 1.6 + spec * 0.4, gold);
  vec3 col = alb * Lw + sp + emis;
  if (sequin > 0.) {                                                // sequins: each a little mirror for the windows
    vec2 cell = floor(uv * 11.); float h = rHash(cell + vSeed * 31.);
    vec3 jn = normalize(n + (vec3(h, rHash(cell + 1.7), rHash(cell + 5.1)) - 0.5) * 1.1);
    col += roomMirror(vP, reflect(-v, jn), 0.08) * step(0.5, h) * 0.9 * sequin;
  }
  float rim = pow(clamp(1. - dot(n, v), 0., 1.), 3.);
  col += (L * 0.5 + vec3(1., 0.84, 0.62) * lm * 0.5) * rim * 0.55 * (0.35 + alb);
  col = roomHaze(col, vDist);
  gl_FragColor = vec4(col, 1.);
}`;
const BLOB_VERT = /* glsl */`
attribute vec4 iHome; attribute vec4 iAnim;
uniform float uDance; varying vec2 vQ; varying vec3 vP;
void main(){
  float oa = iAnim.x * 3.7 + iAnim.z * uDance;
  vec2 c = iHome.xy + iHome.z * vec2(cos(oa), 0.7 * sin(oa));
  vQ = position.xz;
  vec3 p = vec3(position.x * 2.3 * iHome.w + c.x, 0.035, position.z * 2.3 * iHome.w + c.y);
  vP = p;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
}`;
const BLOB_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vP;
void main(){ float d = dot(vQ, vQ); float a = 0.62 * exp(-d * 3.2) * smoothstep(1., 0.6, d); gl_FragColor = vec4(0., 0., 0., a); }`;

// The dancers of one room. o: { uniforms (the room's), pairs: [{ x, z, r, size, turn, round, phase, seed, a, b, c, fashion: 0 | 1 }],
// fashions: [f0, f1], geometries (optional: pairGeometry of each fashion, built by the caller in steps of its own), rng, wild, doorAt: [x, z] in room space }. Returns { object, uniforms: { uDance, uStop }, triangles }.
export function makeMasquers(o) {
  const group = new THREE.Group();
  const U = { ...o.uniforms, uDance: { value: 0 }, uStop: { value: 0 }, uWild: { value: o.wild ?? 1 }, uDoorAt: { value: new THREE.Vector2(o.doorAt[0], o.doorAt[1]) } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: MASQ_VERT, fragmentShader: MASQ_FRAG, side: THREE.DoubleSide });
  let triangles = 0;
  const inst = (list) => {
    const n = list.length, H = new Float32Array(n * 4), A = new Float32Array(n * 4), CA = new Float32Array(n * 3), CB = new Float32Array(n * 3), CC = new Float32Array(n * 3);
    list.forEach((p, i) => {
      H.set([p.x, p.z, p.r, p.size], i * 4); A.set([p.phase, p.turn, p.round, p.seed], i * 4);
      CA.set(p.a, i * 3); CB.set(p.b, i * 3); CC.set(p.c, i * 3);
    });
    return { n, H: new THREE.InstancedBufferAttribute(H, 4), A: new THREE.InstancedBufferAttribute(A, 4), CA: new THREE.InstancedBufferAttribute(CA, 3), CB: new THREE.InstancedBufferAttribute(CB, 3), CC: new THREE.InstancedBufferAttribute(CC, 3) };
  };
  for (let k = 0; k < o.fashions.length; k++) {
    const list = o.pairs.filter((p) => p.fashion === k); if (!list.length) continue;
    const src = o.geometries ? o.geometries[k] : pairGeometry(o.fashions[k], o.rng), g = new THREE.InstancedBufferGeometry(), I = inst(list);
    for (const name of ['position', 'normal', 'aCol', 'aSurf']) g.setAttribute(name, src.attributes[name]);
    g.setAttribute('iHome', I.H); g.setAttribute('iAnim', I.A); g.setAttribute('iColA', I.CA); g.setAttribute('iColB', I.CB); g.setAttribute('iColC', I.CC);
    g.instanceCount = I.n;
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; group.add(mesh);
    triangles += src.attributes.position.count / 3 * I.n;
  }
  if (o.pairs.length) {                                              // a soft dark under every pair
    const g = new THREE.InstancedBufferGeometry(), I = inst(o.pairs);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0, -1]), 3));
    g.setAttribute('iHome', I.H); g.setAttribute('iAnim', I.A); g.instanceCount = I.n;
    const bm = new THREE.ShaderMaterial({ uniforms: { uDance: U.uDance }, vertexShader: BLOB_VERT, fragmentShader: BLOB_FRAG, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(g, bm); mesh.frustumCulled = false; mesh.renderOrder = 1; group.add(mesh);
  }
  return { object: group, uniforms: U, material: mat, triangles, count: o.pairs.length };
}

// ---------------------------------------------------------------------------------------------- walls with arched openings
// height of an arch of half width hw at du from its centre line; k = 1 round, 2 equilateral pointed
export function archTop(du, hw, ys, k) { const R = k * hw, x = Math.abs(du) + (k - 1) * hw; return ys + Math.sqrt(Math.max(R * R - x * x, 0)); }
// outline of an opening { c, hw, y0, ys, k } as [u, y] points, from the foot of one jamb over the arch to the other
export function archOutline(h, n = 16) {
  const pts = [[h.c - h.hw, h.y0]];
  for (let i = 0; i <= n; i++) { const du = -h.hw + 2 * h.hw * i / n; pts.push([h.c + du, archTop(du, h.hw, h.ys, h.k)]); }
  pts.push([h.c + h.hw, h.y0]);
  return pts;
}
// A wall built of upright strips: o.at(u, y) -> [x, y, z]; from u0 to u1; bottom (number); top(u); holes [{ c, hw, y0, ys, k }]
export function archWall(b, o) {
  const us = new Set(), add = (u) => { if (u > o.u0 - 1e-6 && u < o.u1 + 1e-6) us.add(Math.round(u * 1000) / 1000); };
  const nS = Math.max(1, Math.round((o.u1 - o.u0) / (o.step || 2)));
  for (let i = 0; i <= nS; i++) add(o.u0 + (o.u1 - o.u0) * i / nS);
  for (const h of o.holes || []) for (let i = -8; i <= 8; i++) add(h.c + h.hw * i / 8);
  const U = [...us].sort((a, c) => a - c);
  const spans = (u, um) => {
    const out = []; let y = o.bottom || 0; const yt = o.top(u);
    for (const h of o.holes || []) if (Math.abs(um - h.c) < h.hw) {
      if (h.y0 > y + 1e-4) out.push([y, h.y0]); else out.push(null);
      y = Math.min(archTop(u - h.c, h.hw, h.ys, h.k), yt);
    }
    out.push([y, yt]);
    return out;
  };
  for (let i = 0; i < U.length - 1; i++) {
    const ua = U[i], ub = U[i + 1], um = (ua + ub) / 2, A = spans(ua, um), B = spans(ub, um);
    for (let k = 0; k < A.length; k++) {
      if (!A[k] || !B[k]) continue;
      if (A[k][1] - A[k][0] < 1e-3 && B[k][1] - B[k][0] < 1e-3) continue;
      const p0 = o.at(ua, A[k][0]), p1 = o.at(ub, B[k][0]), p2 = o.at(ub, B[k][1]), p3 = o.at(ua, A[k][1]);
      if (o.flip) b.quad(p1, p0, p3, p2); else b.quad(p0, p1, p2, p3);
    }
  }
}
// the inside faces of an opening, from depth d0 to d1: o.at3(u, y, d) -> [x, y, z]
export function archReveal(b, o, h, d0, d1, n = 16) {
  const pts = archOutline(h, n);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], c = pts[i + 1];
    b.quad(o.at3(a[0], a[1], d0), o.at3(c[0], c[1], d0), o.at3(c[0], c[1], d1), o.at3(a[0], a[1], d1));
  }
}

// ---------------------------------------------------------------------------------------------- the ebony clock
// Local space: origin at the middle of its foot, front towards +z. 49 m to the finial.
export const CLOCK = { H: 49, baseHw: 7, baseD: 8.6, doorHw: 4.25, doorSill: 0.5, doorTop: 12.1, dialY: 34.2, dialR: 4.9, pivotY: 32.6, pendL: 13.6, period: 2.6 };
const EBONY = [0.05, 0.043, 0.046], BRASS = [1, 0.72, 0.34], DIALC = [0.86, 0.82, 0.72];

function* clockCase(b, rng) {
  const C = CLOCK, zf = C.baseD / 2;
  const ebony = () => b.col(EBONY).surf(K.WOOD, 0.85, 0, 0), gold = () => b.col(BRASS).surf(K.GOLD, 0.8, 1, 0);
  const shell = (hw, hd, y0, y1) => {                                // sides and back of a storey
    b.quad([hw, y0, hd], [hw, y0, -hd], [hw, y1, -hd], [hw, y1, hd]);
    b.quad([-hw, y0, -hd], [-hw, y0, hd], [-hw, y1, hd], [-hw, y1, -hd]);
    b.quad([hw, y0, -hd], [-hw, y0, -hd], [-hw, y1, -hd], [hw, y1, -hd]);
  };
  const cornice = (y, hw, hd, h, out) => {                           // three steps out, a gold bead, dentils
    ebony();
    for (let i = 0; i < 3; i++) { const o = out * (i + 1) / 3; b.box(0, y + h * (i + 0.5) / 3, 0, (hw + o) * 2, h / 3, (hd + o) * 2); }
    gold(); b.box(0, y + h * 0.36, 0, (hw + out * 0.36) * 2 + 0.16, 0.14, (hd + out * 0.36) * 2 + 0.16);
    const nd = Math.round(hw * 2 / 0.9);
    for (let i = 0; i < nd; i++) { const x = (i + 0.5) / nd * 2 * hw - hw; b.box(x, y - 0.22, hd + 0.12, 0.42, 0.42, 0.3); }
  };
  const column = (x, z, y0, y1, r) => {                              // a twisted colonnette with gold foot and head
    ebony();
    b.geo(new THREE.CylinderGeometry(r, r * 1.08, y1 - y0, 7, 6, true), { p: [x, (y0 + y1) / 2, z], warp: (v) => { const a = v.y * 0.5, c = Math.cos(a), s = Math.sin(a), px = v.x * c - v.z * s, pz = v.x * s + v.z * c; v.x = px * (1 + 0.14 * Math.cos(Math.atan2(pz, px) * 3)); v.z = pz * (1 + 0.14 * Math.sin(Math.atan2(pz, px) * 3)); } });
    gold();
    b.geo(new THREE.CylinderGeometry(r * 1.25, r * 1.55, r * 1.4, 8), { p: [x, y0 + r * 0.7, z] });
    b.geo(new THREE.CylinderGeometry(r * 1.7, r * 1.15, r * 1.6, 8), { p: [x, y1 - r * 0.8, z] });
    b.geo(new THREE.SphereGeometry(r * 1.2, 7, 5), { p: [x, y1 - r * 1.9, z], s: [1, 0.5, 1] });
  };
  const panel = (at, u0, v0, u1, v1, inset = 0.22) => {              // a sunk carved panel with a gold fillet
    const m = 0.3;
    ebony();
    b.quad(at(u0, v0, 0), at(u1, v0, 0), at(u1 - m, v0 + m, -inset), at(u0 + m, v0 + m, -inset));
    b.quad(at(u1, v0, 0), at(u1, v1, 0), at(u1 - m, v1 - m, -inset), at(u1 - m, v0 + m, -inset));
    b.quad(at(u1, v1, 0), at(u0, v1, 0), at(u0 + m, v1 - m, -inset), at(u1 - m, v1 - m, -inset));
    b.quad(at(u0, v1, 0), at(u0, v0, 0), at(u0 + m, v0 + m, -inset), at(u0 + m, v1 - m, -inset));
    b.quad(at(u0 + m, v0 + m, -inset), at(u1 - m, v0 + m, -inset), at(u1 - m, v1 - m, -inset), at(u0 + m, v1 - m, -inset));
    gold();
    for (const [a, c] of [[[u0, v0], [u1, v0]], [[u1, v0], [u1, v1]], [[u1, v1], [u0, v1]], [[u0, v1], [u0, v0]]]) b.rod(at(a[0], a[1], 0.03), at(c[0], c[1], 0.03), 0.06, 0.06, 4);
  };
  // ---- plinth and base, with the open case door
  ebony();
  b.box(0, 0.25, 0, 16.4, 0.5, 11.4); b.box(0, 0.75, 0, 15.4, 0.5, 10.4);
  shell(C.baseHw, zf, 1, 13.5);
  const door = { c: 0, hw: C.doorHw, y0: C.doorSill, ys: C.doorTop - C.doorHw, k: 1 };
  archWall(b, { at: (u, y) => [u, y, zf], u0: -C.baseHw, u1: C.baseHw, bottom: 1, top: () => 13.5, holes: [door], step: 1.4 });
  archReveal(b, { at3: (u, y, d) => [u, y, zf - d] }, door, 0, 1.1, 20);
  yield;
  // inside the case: walls, floor and roof of dark wood, the weights on their chains
  b.col(EBONY, 1.6).surf(K.WOOD, 0.6, 0, 0);
  b.quad([-C.doorHw - 0.6, C.doorSill, zf - 1.1], [-C.doorHw - 0.6, C.doorSill, -zf], [-C.doorHw - 0.6, 13, -zf], [-C.doorHw - 0.6, 13, zf - 1.1]);
  b.quad([C.doorHw + 0.6, C.doorSill, -zf], [C.doorHw + 0.6, C.doorSill, zf - 1.1], [C.doorHw + 0.6, 13, zf - 1.1], [C.doorHw + 0.6, 13, -zf]);
  b.quad([-C.doorHw - 0.6, 13, zf - 1.1], [-C.doorHw - 0.6, 13, -zf], [C.doorHw + 0.6, 13, -zf], [C.doorHw + 0.6, 13, zf - 1.1]);
  b.quad([-C.doorHw - 0.6, C.doorSill, -zf], [-C.doorHw - 0.6, C.doorSill, zf], [C.doorHw + 0.6, C.doorSill, zf], [C.doorHw + 0.6, C.doorSill, -zf]);
  b.quad([-C.doorHw - 0.6, C.doorSill, zf - 1.1], [-C.doorHw - 0.6, 13, zf - 1.1], [-C.doorHw, 13, zf - 1.1], [-C.doorHw, C.doorSill, zf - 1.1]);
  b.quad([C.doorHw, C.doorSill, zf - 1.1], [C.doorHw, 13, zf - 1.1], [C.doorHw + 0.6, 13, zf - 1.1], [C.doorHw + 0.6, C.doorSill, zf - 1.1]);
  gold();
  b.tube(archOutline(door, 18).map((q) => [q[0] * 1.045, q[1] + (q[1] > door.ys ? 0.2 : 0), zf + 0.08]), 0.16, 5);
  b.tube(archOutline(door, 18).map((q) => [q[0] * 1.16, q[1] + (q[1] > door.ys ? 0.72 : 0), zf + 0.06]), 0.09, 4);
  for (const sx of [-1, 1]) {
    yield;
    for (let k = 0; k < 2; k++) {
      const x = sx * (C.doorHw + 0.15 - k * 0.5), z = 1.6 - k * 2.3, yw = k ? 4.2 : 7.6;
      for (let y = 12.9; y > yw + 1.3; y -= 0.5) b.geo(new THREE.TorusGeometry(0.16, 0.045, 4, 6), { p: [x, y, z], r: [0, (Math.round(y * 2) % 2) * Math.PI / 2, 0] });
      b.geo(new THREE.CylinderGeometry(0.42, 0.42, 2.4, 9), { p: [x, yw, z] });
      b.geo(new THREE.SphereGeometry(0.42, 9, 5), { p: [x, yw - 1.2, z], s: [1, 0.6, 1] });
      b.geo(new THREE.ConeGeometry(0.42, 0.5, 9), { p: [x, yw + 1.45, z] });
    }
    // carved panels on the front of the base either side of the door, and on its flanks
    panel((u, v, d) => [sx * (C.doorHw + 0.95) + u * sx, v, zf + d], 0, 1.8, 1.55, 12.6, 0.16);
    panel((u, v, d) => [sx * (C.baseHw + d), v, u * sx], -3.6, 2.2, 3.6, 12.4);
    column(sx * (C.baseHw + 0.25), zf + 0.25, 1, 13.5, 0.5);
  }
  cornice(13.5, C.baseHw, zf, 1, 0.9);
  yield;
  // ---- the trunk: the pendulum behind its glass
  const thw = 5.25, thd = 3.5, ty0 = 14.5, ty1 = 27;
  ebony(); shell(thw, thd, ty0, ty1);
  const glass = { c: 0, hw: 3.5, y0: 15.6, ys: 26.2 - archTop(0, 3.5, 0, 1.4), k: 1.4 };
  archWall(b, { at: (u, y) => [u, y, thd], u0: -thw, u1: thw, bottom: ty0, top: () => ty1, holes: [glass], step: 1.2 });
  archReveal(b, { at3: (u, y, d) => [u, y, thd - d] }, glass, 0, 0.5, 16);
  b.quad([-thw, ty0, thd], [thw, ty0, thd], [thw, ty0, -thd], [-thw, ty0, -thd]);
  gold(); b.tube(archOutline(glass, 16).map((q) => [q[0] * 1.03, q[1] + (q[1] > glass.ys ? 0.12 : 0), thd + 0.06]), 0.13, 5);
  b.col([0.3, 0.02, 0.03]).surf(K.VELVET, 0.1, 0, 0);                  // the lining behind the pendulum
  b.quad([-thw + 0.2, ty0, -0.6], [thw - 0.2, ty0, -0.6], [thw - 0.2, ty1, -0.6], [-thw + 0.2, ty1, -0.6]);
  for (const sx of [-1, 1]) {
    panel((u, v, d) => [sx * (thw + d), v, u * sx], -2.6, ty0 + 0.8, 2.6, ty1 - 0.8);
    panel((u, v, d) => [sx * 3.72 + (sx > 0 ? u : -u), v, thd + d], 0, ty0 + 0.6, 1.3, ty1 - 0.6, 0.12);
    column(sx * (thw + 0.2), thd + 0.2, ty0, ty1, 0.38);
    gold();                                                           // two brass weights seen through the glass
    const yw = sx < 0 ? 21.5 : 18.2;
    b.rod([sx * 2.75, ty1, 0.2], [sx * 2.75, yw + 1.4, 0.2], 0.05, 0.05, 4);
    b.geo(new THREE.CylinderGeometry(0.5, 0.5, 2.8, 10), { p: [sx * 2.75, yw, 0.2] });
  }
  cornice(27, thw, thd, 1, 1.6);
  yield;
  // ---- the hood: the dial
  const hhw = 7, hhd = 4.3, hy0 = 28, hy1 = 40;
  ebony(); shell(hhw, hhd, hy0, hy1);
  b.quad([-hhw, hy0, hhd], [hhw, hy0, hhd], [hhw, hy1, hhd], [-hhw, hy1, hhd]);
  b.col(DIALC).surf(K.DIAL, 0.35, 0, 0);
  b.geo(new THREE.CircleGeometry(C.dialR, 48), { p: [0, C.dialY, hhd + 0.12] });
  gold();
  b.geo(new THREE.TorusGeometry(C.dialR + 0.22, 0.3, 6, 40), { p: [0, C.dialY, hhd + 0.15] });
  b.geo(new THREE.TorusGeometry(C.dialR + 0.85, 0.1, 4, 40), { p: [0, C.dialY, hhd + 0.05] });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {               // pierced spandrels: a quatrefoil in each corner
    const cx = sx * 5.35, cy = C.dialY + sy * 4.75;
    for (let k = 0; k < 4; k++) b.geo(new THREE.TorusGeometry(0.42, 0.09, 4, 10), { p: [cx + Math.cos(k * Math.PI / 2) * 0.42, cy + Math.sin(k * Math.PI / 2) * 0.42, hhd + 0.08] });
    b.geo(new THREE.SphereGeometry(0.2, 6, 4), { p: [cx, cy, hhd + 0.12] });
  }
  for (const sx of [-1, 1]) {
    column(sx * (hhw + 0.25), hhd + 0.35, hy0, hy1, 0.46);
    panel((u, v, d) => [sx * (hhw + d), v, u * sx], -3.2, hy0 + 1, 3.2, hy1 - 1);
  }
  cornice(hy1, hhw, hhd, 1.2, 1.1);
  yield;
  // ---- the pediment: a steep gable with crockets, pinnacles at the corners, a finial
  const py = hy1 + 1.2, pg = 5.6;
  ebony();
  b.tri([-hhw - 0.6, py, hhd + 0.5], [hhw + 0.6, py, hhd + 0.5], [0, py + pg, hhd + 0.5]);
  b.quad([hhw + 0.6, py, hhd + 0.5], [hhw + 0.6, py, -hhd], [0, py + pg, -hhd], [0, py + pg, hhd + 0.5]);
  b.quad([-hhw - 0.6, py, -hhd], [-hhw - 0.6, py, hhd + 0.5], [0, py + pg, hhd + 0.5], [0, py + pg, -hhd]);
  gold();
  b.geo(new THREE.TorusGeometry(1.25, 0.14, 4, 16), { p: [0, py + 2.1, hhd + 0.56] });
  for (let k = 0; k < 4; k++) b.geo(new THREE.TorusGeometry(0.5, 0.09, 4, 10), { p: [Math.cos(k * Math.PI / 2) * 0.5, py + 2.1 + Math.sin(k * Math.PI / 2) * 0.5, hhd + 0.58] });
  for (const sx of [-1, 1]) {
    b.rod([sx * (hhw + 0.6), py, hhd + 0.56], [0, py + pg, hhd + 0.56], 0.14, 0.14, 4);
    for (let i = 1; i < 7; i++) { const t = i / 7; b.geo(new THREE.SphereGeometry(0.24, 5, 4), { p: [sx * (hhw + 0.6) * (1 - t), py + pg * t + 0.22, hhd + 0.56], s: [1, 1.5, 1] }); }
    for (const z of [hhd + 0.3, -hhd + 0.3]) {
      ebony(); b.geo(new THREE.CylinderGeometry(0.42, 0.5, 2.6, 4), { p: [sx * (hhw + 0.5), py + 1.3, z], r: [0, Math.PI / 4, 0] });
      b.geo(new THREE.ConeGeometry(0.62, 3.4, 4), { p: [sx * (hhw + 0.5), py + 4.3, z], r: [0, Math.PI / 4, 0] });
      gold(); b.geo(new THREE.SphereGeometry(0.26, 6, 4), { p: [sx * (hhw + 0.5), py + 6.15, z] });
    }
  }
  b.geo(new THREE.SphereGeometry(0.55, 8, 6), { p: [0, py + pg + 0.6, hhd + 0.2] });
  b.geo(new THREE.ConeGeometry(0.3, 1.8, 6), { p: [0, py + pg + 1.9, hhd + 0.2] });
  return { glass, thd, hhd };
}

const GLASS_FRAG = /* glsl */`
varying vec3 vP, vP0, vN, vN0, vCol, vV; varying vec4 vSurf; varying float vDist;
${ROOM_GLSL}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float fres = 0.05 + 0.95 * pow(clamp(1. - dot(n, v), 0., 1.), 4.);
  float streak = smoothstep(0.35, 0.5, rNoise(vec2((vP0.x + vP0.y * 0.55) * 0.5, 3.))) * 0.035;
  vec3 col = roomMirror(vP, reflect(-v, n), 0.03) * fres * 0.9 + uRoomCol * streak * (0.5 * (uFlick.x + uFlick.y));
  gl_FragColor = vec4(col, 1.);
}`;
const DUST_VERT = /* glsl */`
attribute vec4 iSeed;      // where on the case (x, y, z) and its own number
uniform float uStroke, uGain, uTime; uniform mat4 uRoomInv;
varying vec2 vQ; varying float vA;
void main(){
  float g = fract(uStroke - iSeed.w * 0.55);
  float h1 = fract(iSeed.w * 17.3), h2 = fract(iSeed.w * 41.7);
  vec3 c = iSeed.xyz;
  c.y -= 2. * g + 11. * g * g * (0.5 + h1);
  c.x += (h1 - 0.5) * 3. * g + 0.5 * sin(uTime * 0.9 + h2 * 20.) * g;
  c.z += 0.6 + 3.5 * g * h2 + 0.5 * cos(uTime * 0.7 + h1 * 20.) * g;
  vA = uGain * smoothstep(0., 0.06, g) * (1. - g) * (1. - g) * (0.4 + 0.6 * h2);
  vQ = position.xy;
  vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.);
  mv.xy += position.xy * (0.09 + 0.12 * h1);
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FRAG = /* glsl */`
uniform vec3 uDustCol; varying vec2 vQ; varying float vA;
void main(){ float d = dot(vQ, vQ); gl_FragColor = vec4(uDustCol * vA * exp(-d * 3.) * smoothstep(1., 0.7, d), 1.); }`;

// opts: { shared: { uTime }, uniforms (room uniforms of the black room), roomInv (world -> room space), palette }
export async function buildHero(ctx, opts = {}) {
  const rng = opts.rng || ctx.rng.fork('clock'), C = CLOCK;
  const shared = opts.shared || { uTime: { value: 0 } };
  const alone = !opts.uniforms;
  const sc = lin('#b00f1e');
  const U = opts.uniforms || roomUniforms(shared, {
    color: [sc[0] * 2.3, sc[1] * 2.3 + 0.012, sc[2] * 2.3 + 0.01], glass: [sc[0] * 2.3, sc[1] * 2.3 + 0.01, sc[2] * 2.3 + 0.012], hw: 23, L: 92, wallH: 34, crown: 54,
    winZ: -52, sill: 4, winHw: 4.2, winTop: 31, srcBack: 10, srcY: 30, srcZ: 20, beam: 9, bounce: 0.5, soft: 2.2, haze: 0.0016, hazeGain: 0.2, velvet: 1, glassStyle: 3,
  });
  const roomInv = opts.roomInv || new THREE.Matrix4().makeTranslation(0, 0, -86.7);
  const dial = new THREE.Vector4(0, C.dialY, C.dialR, 0);
  const mat = roomMaterial(U, { roomInv, dial });
  const object = new THREE.Group();
  const b = makeBatch(1 << 15);
  const casing = clockCase(b, rng);                                    // storey by storey, the page breathing between them
  let piece = casing.next();
  while (!piece.done) { await ctx.yield(); piece = casing.next(); }
  const info = piece.value;
  await ctx.yield();
  const body = new THREE.Mesh(b.build(), mat); body.frustumCulled = false; object.add(body);
  await ctx.yield();

  // hands: an open spade for the hours, a long lance for the minutes; black, edged with gilt
  const hand = (len, wide, spade) => {
    const hb = makeBatch(512);
    hb.col([0.012, 0.012, 0.014]).surf(K.WOOD, 0.8, 0, 0);
    hb.quad([-wide, 0, 0], [wide, 0, 0], [wide * 0.45, len * 0.7, 0], [-wide * 0.45, len * 0.7, 0]);
    hb.quad([-wide * 0.6, -len * 0.22, 0], [wide * 0.6, -len * 0.22, 0], [wide, 0, 0], [-wide, 0, 0]);
    if (spade) {
      hb.geo(new THREE.RingGeometry(wide * 1.5, wide * 2.6, 12), { p: [0, len * 0.72 + wide * 2.2, 0] });
      hb.tri([-wide * 1.3, len * 0.72 + wide * 4.3, 0], [wide * 1.3, len * 0.72 + wide * 4.3, 0], [0, len, 0]);
    } else hb.tri([-wide * 0.45, len * 0.7, 0], [wide * 0.45, len * 0.7, 0], [0, len, 0]);
    hb.geo(new THREE.CircleGeometry(wide * 2.4, 10), { p: [0, -len * 0.22, 0] });
    hb.col(BRASS).surf(K.GOLD, 0.85, 1, 0);
    hb.geo(new THREE.CylinderGeometry(wide * 1.5, wide * 1.5, 0.25, 10), { r: [Math.PI / 2, 0, 0], p: [0, 0, 0.1] });
    hb.rod([0, 0.2, 0.03], [0, len * 0.68, 0.03], wide * 0.16, wide * 0.1, 4);
    const m = new THREE.Mesh(hb.build(), mat); m.frustumCulled = false;
    return m;
  };
  const hourHand = hand(C.dialR * 0.62, 0.34, true), minuteHand = hand(C.dialR * 0.9, 0.24, false);
  hourHand.position.set(0, C.dialY, info.hhd + 0.3); minuteHand.position.set(0, C.dialY, info.hhd + 0.48);
  object.add(hourHand, minuteHand);

  // the pendulum: a brass rod and a great lens of a bob, engraved in rings
  const pb = makeBatch(2048);
  pb.col(BRASS).surf(K.GOLD, 0.9, 1, 0);
  pb.box(0, -C.pendL / 2, 0, 0.3, C.pendL, 0.14);
  pb.geo(new THREE.SphereGeometry(1, 20, 10), { p: [0, -C.pendL, 0], s: [2.35, 2.35, 0.42] });
  for (const r of [0.8, 1.45, 2.05]) pb.geo(new THREE.TorusGeometry(r, 0.07, 4, 24), { p: [0, -C.pendL, 0.36 - r * 0.1] });
  pb.geo(new THREE.CylinderGeometry(0.26, 0.26, 0.9, 8), { p: [0, -C.pendL - 2.7, 0] });
  const pendulum = new THREE.Mesh(pb.build(), mat); pendulum.frustumCulled = false;
  pendulum.position.set(0, C.pivotY, 1.25); object.add(pendulum);

  // the case door, swung wide on its hinges
  const db = makeBatch(2048), dw = C.doorHw * 2, dh = { c: dw / 2, hw: C.doorHw, y0: 0, ys: C.doorTop - C.doorHw - C.doorSill, k: 1 };
  db.col(EBONY).surf(K.WOOD, 0.85, 0, 0);
  for (const z of [0, -0.4]) archWall(db, { at: (u, y) => [-u, y, z], u0: 0, u1: dw, bottom: 0, top: (u) => archTop(u - dh.c, dh.hw, dh.ys, 1), step: 0.6, flip: z < 0 });
  archReveal(db, { at3: (u, y, d) => [-u, y, -d] }, dh, 0, 0.4, 18);
  db.col(BRASS).surf(K.GOLD, 0.8, 1, 0);
  db.tube(archOutline({ ...dh, hw: dh.hw * 0.8, ys: dh.ys, y0: 0.9 }, 14).map((q) => [-q[0], q[1] * 0.93 + 0.2, 0.04]), 0.09, 4);
  db.tube(archOutline({ ...dh, hw: dh.hw * 0.8, ys: dh.ys, y0: 0.9 }, 14).map((q) => [-q[0], q[1] * 0.93 + 0.2, -0.44]), 0.09, 4);
  for (const y of [2, 6, 9.5]) { db.box(-0.5, y, 0.04, 1.6, 0.22, 0.08); db.box(-0.5, y, -0.44, 1.6, 0.22, 0.08); }
  db.geo(new THREE.TorusGeometry(0.42, 0.08, 5, 12), { p: [-dw + 1, 5.6, 0.1] });
  const leaf = new THREE.Mesh(db.build(), mat); leaf.frustumCulled = false;
  leaf.position.set(C.doorHw + 0.1, C.doorSill, C.baseD / 2 + 0.25); leaf.rotation.y = -1.92; object.add(leaf);

  // glass before the pendulum: it shows the scarlet windows of the room
  const gb = makeBatch(512);
  archWall(gb, { at: (u, y) => [u, y, info.thd - 0.3], u0: -info.glass.hw, u1: info.glass.hw, bottom: info.glass.y0, top: (u) => archTop(u, info.glass.hw, info.glass.ys, info.glass.k), step: 1 });
  const glassMat = new THREE.ShaderMaterial({ uniforms: { ...U, uRoomInv: { value: roomInv } }, vertexShader: ROOM_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pane = new THREE.Mesh(gb.build(), glassMat); pane.frustumCulled = false; pane.renderOrder = 2; object.add(pane);
  await ctx.yield();

  // dust shaken from every cornice at each stroke
  const nDust = Math.round(520 * (ctx.quality ? ctx.quality.detail : 1)), seeds = new Float32Array(nDust * 4);
  for (let i = 0; i < nDust; i++) {
    const lvl = rng.pick([[13.6, 7.9, 5.2], [27.2, 6.8, 5.1], [40.3, 8.1, 5.4], [44, 5, 5.0], [41.4, 8.1, 5.4]]);
    seeds.set([rng.range(-lvl[1], lvl[1]), lvl[0] + rng.range(-0.4, 0.6), lvl[2] - rng.range(0, 1.2), rng()], i * 4);
  }
  const dg = new THREE.InstancedBufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  dg.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 4)); dg.instanceCount = nDust;
  const DU = { uStroke: { value: 0 }, uGain: { value: 0 }, uTime: shared.uTime, uRoomInv: { value: roomInv }, uDustCol: { value: new THREE.Vector3(1.5, 0.3, 0.2) } };
  const dust = new THREE.Mesh(dg, new THREE.ShaderMaterial({ uniforms: DU, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  dust.frustumCulled = false; dust.renderOrder = 3; object.add(dust);

  // The strike. The film says when the clock is striking and how far through its stroke it is (setStrike(level, phase), both
  // 0..1: in the world the phase comes from the metres flown, never from the world clock). Shown alone, with no film, the
  // strokes come on the clock, one every C.period seconds from a seeded start. Each stroke: a ring of light across the
  // floor, a glow on the dial, dust.
  const phase0 = rng.range(0, C.period);
  const st = { level: alone ? 1 : 0, u: alone ? 0.7 : 0, f: 0, pulse: 0, given: -1 };
  const strokeX = (time) => (time + phase0) / C.period;               // the stroke clock: stroke n begins where this is n
  const strokeAt = (time) => { const x = strokeX(time); return x - Math.floor(x); };
  const uHour = opts.uStrike ?? 0.6;                                   // where the film has the hands reach the hour
  const frontZ = new THREE.Vector3();
  const api = {
    object, radius: 12, height: C.H, center: new THREE.Vector3(0, 23, 0), ground: true, groundY: 0,
    anchors: { portal: new THREE.Vector3(0, C.doorSill + 5.8, -0.8), portalWidth: 8.1, portalHeight: 11.3, dial: new THREE.Vector3(0, C.dialY, info.hhd), gaze: new THREE.Vector3(0, 20, 0) },
    uniforms: U, state: st, strokeAt, strokeX, strokeNo: (time) => Math.floor(strokeX(time)),
    setStrike(level, phase = -1) { st.level = level; st.given = phase; },
    setU(u) { st.u = u; },
    update(dt, time, camera) {
      if (alone) shared.uTime.value = time;
      const f = st.given >= 0 ? Math.min(st.given, 1) : strokeAt(time), lv = st.level;
      st.f = f; st.pulse = lv * Math.exp(-f * 4.5) * sstep(0, 0.035, f);
      // hands: eight minutes to the hour when the flight begins, on the hour as the strike begins, creeping after
      const m = st.u < uHour ? -8 * (1 - st.u / uHour) : (st.u - uHour) * 3;
      minuteHand.rotation.z = -m / 60 * TAU + 0.004 * Math.sin(time * TAU) * (1 - lv);
      hourHand.rotation.z = -m / 720 * TAU;
      pendulum.rotation.z = 0.165 * Math.sin(time * TAU / (C.period * 2) + phase0);
      leaf.rotation.y = -1.92 + 0.012 * st.pulse * Math.sin(time * 31);
      dial.w = 0.12 + 0.9 * st.pulse;
      // the ring starts at the foot of the clock, in the room's own space
      frontZ.set(0, 0, C.baseD / 2).applyMatrix4(object.matrixWorld).applyMatrix4(roomInv);
      U.uRing.value.set(frontZ.x, frontZ.z, 2 + f * 96, lv * 2.4 * (1 - f) * (1 - f) * sstep(0, 0.04, f));
      DU.uStroke.value = f; DU.uGain.value = lv;
      if (alone) { const fl = 0.86 + 0.14 * Math.sin(time * 7.3) * Math.sin(time * 3.1); U.uFlick.value.set(fl, 0.9 + 0.1 * Math.sin(time * 5.7 + 2), 0, 0); }
    },
    dispose() {},
  };
  return api;
}
