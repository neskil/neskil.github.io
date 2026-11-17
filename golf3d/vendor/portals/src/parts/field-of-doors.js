// THE GREAT DOOR: hero set piece of "field-of-doors".
//
// A panelled double door 400 m tall and 250 m wide in a carved stone frame (about 330 m wide, 500 m to the
// crown), standing on a low paved terrace. One leaf is closed (it has a wicket door, a ring pull and a glowing
// keyhole); the other stands ajar toward the viewer so that a 30 m slot opens between the two meeting edges.
// The whole doorway behind the open leaf is a window onto a blinding white-gold sky of clouds lit from below
// (ray-directed procedural sky, so it has true parallax). Light leaks under and around the closed leaf, pours
// out of the slot as fanned shafts, lies on the ground as a long river of light with low mist layers above
// it, and carries a slow outward wind of golden motes.
//
// LOCAL SPACE  origin at the base centre of the frame on the ground (y = 0), +Y up, front (the side the light
//              pours out of, the side the camera arrives from) toward +Z. The door plane is z = 0.
// SIZE         radius 260 (frame, terrace and the swung leaf), height ~500. The light river and shafts run on
//              to z = opts.riverLength (default 900) in front of the door.
// COST         about 41-50k triangles, 7 draw calls (frame, 2 leaves, doorway sky, shafts, river+mist, motes;
//              opts.pointLight adds a light, not a call). Build about 200-300 ms. No textures, no render targets.
// LIGHTING     Expects a dim violet dusk ambient (hemisphere) and at most a weak directional; the piece
//              lights itself: the door light is added in its own shaders (emissive, HDR 2-8, made for bloom
//              strength ~0.4-0.6, threshold ~0.9). It does not light the world's other objects unless
//              opts.pointLight is true (one warm PointLight in the slot). Fog: every material respects
//              scene.fog (the doorway sky and glows are only partly fogged so the door reads as a bright
//              vertical line from 1300 m).
//
// OPTS         palette      array of 7 hex strings (brief order: indigo, violet, apricot, pale gold, slate,
//                           near-black, white). Default = the brief's palette.
//              ajar         'right' | 'left': which leaf stands ajar (default: per seed).
//              crown        0 arched pediment | 1 triangular pediment | 2 stepped attic (default: per seed).
//              riverLength  metres of ground light / shafts in front of the door (default 900).
//              pointLight   true adds one PointLight in the slot (default false).
//              motes        number of golden motes (default 7000).
//              view         'approach' only reframes the _part viewer.
//
// PROGRESS     hero.setProgress(u), u = 0..1 along the world's path (default 1 = the brief's final state).
//              The ajar leaf eases from a ~17 m slot at u = 0 to the full 30 m slot by u ~ 0.85 and the door
//              light swells with it. hero.uniforms.uProgress holds the same value. Never tied to the clock.
//
// ANCHORS (all local space; x already mirrored when the left leaf is the ajar one)
//   portalSeat   { position, facing, width: 12, height: 24, floorY }: centre of the 12 x 24 m 'rect' portal,
//                standing on the sill in the middle of the 30 m slot, in the door plane, facing +Z.
//   flyThrough   ordered Vector3 list, far to near, ending at portalSeat.position: a straight, level-ending
//                approach down the river of light with >= 12 m clearance from the leaf edges and terrace.
//   beyond       a point 80 m past the portal on the same line (for path extrapolation).
//   gap          { center, width: 30, xMin, xMax, floorY, top }: the slot between the two leaf edges.
//   freeEdge     Vector3: foot of the ajar leaf's free edge at full opening (nearest solid to the camera line).
//   lightRiver   { origin, direction, length, halfWidth0, spread }: axis of the ground light; half width at
//                distance d is halfWidth0 + d * spread. Lean the small doors toward `origin`.
//   lightColor   THREE.Color (linear) of the door light, for matching decals and particles.
//   viewpoints   { far, reveal, threeQuarter, under }: good camera positions (Vector3) looking at `center`.
//   crown        Vector3: centre of the glowing oculus at the top of the frame.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#1a1440', '#5a3f8a', '#e88a6a', '#ffd9a0', '#3a3a4a', '#14141c', '#ffffff'];

// ---- fixed proportions (metres) ----
const HW = 125, DH = 400;            // half width and height of the door opening
const JW = 38, HZ = 17;              // jamb width, half depth of the frame
const Y0 = 2.4;                      // sill / terrace top
const LT = 9;                        // leaf thickness
const ENT = 48;                      // entablature height
const MAT = { STONE: 0, WOOD: 1, BRONZE: 2, GLOW: 3 };

// ---------------------------------------------------------------- geometry helpers
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3();

// Flat-shaded triangle soup builder.
function soup() {
  const pos = [], nor = [];
  const s = {
    pos, nor,
    // push a triangle; `want` (optional Vector3) is the direction its normal must agree with
    tri(a, b, c, want) {
      _n.subVectors(b, a).cross(_c.subVectors(c, a));
      const l = _n.length(); if (l < 1e-9) return;
      _n.multiplyScalar(1 / l);
      if (want && _n.dot(want) < 0) { const t = b; b = c; c = t; _n.negate(); }
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      for (let i = 0; i < 3; i++) nor.push(_n.x, _n.y, _n.z);
    },
    quad(a, b, c, d, want) { s.tri(a, b, c, want); s.tri(a, c, d, want); },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      return g;
    },
  };
  return s;
}

// Chamfered box centred on the origin. bevel b; optional taper (top scale in x and z).
function bevelBox(w, h, d, b = 0.6, taperX = 1, taperZ = taperX) {
  const hx = w / 2, hy = h / 2, hz = d / 2; b = Math.min(b, hx * 0.49, hy * 0.49, hz * 0.49);
  const s = soup();
  const P = (sx, sy, sz, k) => {
    const v = new THREE.Vector3(sx * (hx - (k === 0 ? 0 : b)), sy * (hy - (k === 1 ? 0 : b)), sz * (hz - (k === 2 ? 0 : b)));
    if (sy > 0) { v.x *= taperX; v.z *= taperZ; }
    return v;
  };
  const cen = (...vs) => { const m = new THREE.Vector3(); for (const v of vs) m.add(v); return m.multiplyScalar(1 / vs.length); };
  const S = [-1, 1];
  // faces
  for (let k = 0; k < 3; k++) for (const sg of S) {
    const c = []; for (const u of S) for (const v of S) {
      const sx = k === 0 ? sg : u, sy = k === 1 ? sg : (k === 0 ? u : v), sz = k === 2 ? sg : v;
      c.push(P(sx, sy, sz, k));
    }
    const want = new THREE.Vector3(k === 0 ? sg : 0, k === 1 ? sg : 0, k === 2 ? sg : 0);
    s.quad(c[0], c[1], c[3], c[2], want);
  }
  // edge chamfers
  for (let k = 0; k < 3; k++) { // edge runs along axis k
    const k1 = (k + 1) % 3, k2 = (k + 2) % 3;
    for (const s1 of S) for (const s2 of S) {
      const sg = (t) => { const o = [0, 0, 0]; o[k] = t; o[k1] = s1; o[k2] = s2; return o; };
      const a0 = sg(-1), a1 = sg(1);
      const p0 = P(a0[0], a0[1], a0[2], k1), p1 = P(a1[0], a1[1], a1[2], k1), q0 = P(a0[0], a0[1], a0[2], k2), q1 = P(a1[0], a1[1], a1[2], k2);
      s.quad(p0, p1, q1, q0, cen(p0, p1, q0, q1));
    }
  }
  // corners
  for (const sx of S) for (const sy of S) for (const sz of S) {
    const a = P(sx, sy, sz, 0), bb = P(sx, sy, sz, 1), c = P(sx, sy, sz, 2);
    s.tri(a, bb, c, cen(a, bb, c));
  }
  return s.geo();
}

// Sweep a 2D profile [(a,b),...] along a planar path. `B` is the plane normal (profile b axis); the profile a
// axis is B x tangent (mitred at corners). `inside` is a profile-space point inside the solid, used to orient
// the faces. closed: the path is a loop. caps: close the two ends of an open path.
function sweep(profile, path, B, inside, closed = false, caps = true) {
  const s = soup(), n = path.length, segN = [];
  const T = new THREE.Vector3();
  const cnt = closed ? n : n - 1;
  for (let i = 0; i < cnt; i++) { T.subVectors(path[(i + 1) % n], path[i]).normalize(); segN.push(new THREE.Vector3().crossVectors(B, T).normalize()); }
  const A = [];
  for (let i = 0; i < n; i++) {
    const n0 = segN[closed ? (i - 1 + cnt) % cnt : Math.max(0, i - 1)], n1 = segN[closed ? i % cnt : Math.min(cnt - 1, i)];
    const m = new THREE.Vector3().addVectors(n0, n1).normalize(); m.multiplyScalar(1 / Math.max(0.3, m.dot(n0))); A.push(m);
  }
  const pt = (i, j) => new THREE.Vector3().copy(path[i]).addScaledVector(A[i], profile[j][0]).addScaledVector(B, profile[j][1]);
  const want = new THREE.Vector3();
  for (let i = 0; i < cnt; i++) {
    const i1 = (i + 1) % n;
    for (let j = 0; j < profile.length - 1; j++) {
      const da = profile[j + 1][0] - profile[j][0], db = profile[j + 1][1] - profile[j][1];
      let na = db, nb = -da; const ma = (profile[j][0] + profile[j + 1][0]) / 2 - inside[0], mb = (profile[j][1] + profile[j + 1][1]) / 2 - inside[1];
      if (na * ma + nb * mb < 0) { na = -na; nb = -nb; }
      want.set(0, 0, 0).addScaledVector(segN[i], na).addScaledVector(B, nb);
      s.quad(pt(i, j), pt(i1, j), pt(i1, j + 1), pt(i, j + 1), want);
    }
  }
  if (!closed && caps) {
    for (const [i, sg] of [[0, -1], [n - 1, 1]]) {
      T.subVectors(path[i === 0 ? 1 : n - 1], path[i === 0 ? 0 : n - 2]).normalize().multiplyScalar(sg);
      const c = new THREE.Vector3().copy(path[i]).addScaledVector(A[i], inside[0]).addScaledVector(B, inside[1]);
      for (let j = 0; j < profile.length - 1; j++) s.tri(c, pt(i, j), pt(i, j + 1), T);
    }
  }
  return s.geo();
}

// Rectangular loop in the XZ plane ordered so that sweep()'s a axis points outward (B = +Y).
const ringXZ = (hx, hz, y, cx = 0, cz = 0) => [new THREE.Vector3(cx + hx, y, cz + hz), new THREE.Vector3(cx - hx, y, cz + hz), new THREE.Vector3(cx - hx, y, cz - hz), new THREE.Vector3(cx + hx, y, cz - hz)];
// Rectangular loop in the XY plane, a axis outward for B = +Z.
const ringXY = (hx, hy, cx, cy, z) => [new THREE.Vector3(cx - hx, cy - hy, z), new THREE.Vector3(cx - hx, cy + hy, z), new THREE.Vector3(cx + hx, cy + hy, z), new THREE.Vector3(cx + hx, cy - hy, z)];
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1), BACK = new THREE.Vector3(0, 0, -1);

// Collects geometry into one merged mesh with vertex colour and a material id per vertex.
function makeBin() {
  const list = [];
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3(), _e = new THREE.Euler();
  return {
    list,
    // o: { x,y,z, rx,ry,rz, s | sx,sy,sz, shade, grad } ; grad darkens the bottom of the part (fake occlusion)
    add(geo, color, mat, o = {}) {
      let g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (g.getAttribute('uv')) g.deleteAttribute('uv');
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      _e.set(o.rx || 0, o.ry || 0, o.rz || 0); _q.setFromEuler(_e);
      _s.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1); _p.set(o.x || 0, o.y || 0, o.z || 0);
      g.applyMatrix4(_m.compose(_p, _q, _s));
      const n = g.getAttribute('position').count, col = new Float32Array(n * 3), mt = new Float32Array(n);
      const sh = o.shade ?? 1, P = g.getAttribute('position');
      let y0 = Infinity, y1 = -Infinity;
      if (o.grad) for (let i = 0; i < n; i++) { const y = P.getY(i); if (y < y0) y0 = y; if (y > y1) y1 = y; }
      for (let i = 0; i < n; i++) {
        let k = sh; if (o.grad) k *= 1 - o.grad * (1 - (P.getY(i) - y0) / Math.max(1e-3, y1 - y0));
        col[i * 3] = color.r * k; col[i * 3 + 1] = color.g * k; col[i * 3 + 2] = color.b * k; mt[i] = mat;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setAttribute('aMat', new THREE.BufferAttribute(mt, 1));
      list.push(g);
    },
    build() {
      const g = mergeGeometries(list, false); for (const x of list) x.dispose(); list.length = 0;
      // degenerate triangles carry zero / NaN normals; a single NaN pixel blacks out the whole bloom chain
      const N = g.getAttribute('normal').array;
      for (let i = 0; i < N.length; i += 3) { const l = N[i] * N[i] + N[i + 1] * N[i + 1] + N[i + 2] * N[i + 2]; if (!(l > 1e-8)) { N[i] = 0; N[i + 1] = 1; N[i + 2] = 0; } }
      return g;
    },
  };
}

// ---------------------------------------------------------------- shaders
const GLSL_NOISE = /* glsl */`
float gdHash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float gdNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gdHash(i), gdHash(i + vec2(1., 0.)), f.x), mix(gdHash(i + vec2(0., 1.)), gdHash(i + vec2(1., 1.)), f.x), f.y); }
float gdFbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * gdNoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`;
// fog factor for additive / self-lit shaders (they fade out instead of turning fog-coloured)
const GLSL_FOGF = /* glsl */`
float gdFog(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.;
  #endif
}
`;

// Stone / wood / bronze / glow in one lit material (MeshStandardMaterial + procedural detail + door light).
function makeSolidMaterial(U) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aMat; uniform mat4 uHeroInv;
        varying float vMat; varying vec3 vHP; varying vec3 vHN; varying vec3 vOP; varying vec3 vON;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vMat = aMat; vOP = position; vON = normal;
        mat4 gdM = uHeroInv * modelMatrix; vHP = (gdM * vec4(position, 1.)).xyz; vHN = mat3(gdM) * normal; vHN = dot(vHN, vHN) > 1e-12 ? normalize(vHN) : vec3(0., 1., 0.);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vMat; varying vec3 vHP; varying vec3 vHN; varying vec3 vOP; varying vec3 vON;
        uniform vec3 uLight; uniform vec3 uSkyTop; uniform vec3 uSkyHor; uniform vec3 uWarm;
        uniform float uOpen; uniform float uTime; uniform float uFreeX; uniform float uLeafTan; uniform float uGapX; uniform float uSeed;
        ${GLSL_NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float gdRough = .9, gdMetal = 0., gdH = 0.;
        vec3 gdAN = abs(vON);
        vec2 gdUV = gdAN.z > .55 ? vOP.xy : (gdAN.x > .55 ? vOP.zy : vOP.xz);
        float gdPix = length(fwidth(gdUV)) + 1e-4;
        if (vMat < .5) {            // ---- stone: ashlar courses, block tint, weather streaks
          bool flat_ = gdAN.y > .55;
          float ch = flat_ ? 3.2 : 2.4, bl = flat_ ? 4.4 : 5.6;
          // flagstones: courses of uneven height, every course its own length of flag, so the paving never reads as a grid
          float gy = flat_ ? gdUV.y + 1.5 * sin(gdUV.y * .11 + uSeed) + .9 * sin(gdUV.y * .31 + 2.) : gdUV.y;
          float row = floor(gy / ch);
          if (flat_) bl *= .55 + 1.1 * gdHash(vec2(row, uSeed + 5.));
          float uu = gdUV.x / bl + .5 * mod(row, 2.) + .37 * gdHash(vec2(row, uSeed));
          vec2 cell = vec2(floor(uu), row);
          vec2 f = vec2(fract(uu) * bl, fract(gy / ch) * ch);
          float d = min(min(f.x, bl - f.x), min(f.y, ch - f.y));
          if (flat_) d -= .16 * gdNoise(gdUV * 1.1) * (1. - smoothstep(.12, .5, gdPix));        // worn, chipped edges
          float vis = 1. - smoothstep(.12, .7, gdPix), visT = 1. - smoothstep(1., 3.6, gdPix);
          float mortar = (1. - smoothstep(.05, .14 + gdPix, d)) * vis;
          float bd = abs(fract(gdUV.y / (ch * 4.) + .5) - .5) * ch * 4.;
          float band = flat_ ? 0. : (1. - smoothstep(.1, .45 + gdPix, bd)) * (1. - smoothstep(1.2, 5., gdPix));
          float tint = gdHash(cell + uSeed);
          float big = gdFbm(gdUV * .012 + uSeed);
          float streak = gdFbm(vec2(gdUV.x * .09, gdUV.y * .008) + 3.7);
          float grit = gdNoise(gdUV * 5.) * vis;
          vec3 c = diffuseColor.rgb * (.76 + .42 * tint * visT + .1 * (1. - visT));
          c = mix(c, c * vec3(.74, .7, .95), smoothstep(.35, .8, big));          // violet lichen blooms
          c = mix(c, c * vec3(1.18, 1.05, .9), smoothstep(.55, .85, streak) * .6);  // pale warm runs
          c *= .9 + .2 * grit;
          c *= 1. - .3 * smoothstep(.45, .75, gdFbm(vec2(gdUV.x * .16 + 11., gdUV.y * .012)));   // dark rain stains
          c *= 1. - .5 * mortar; c *= 1. - .22 * band;
          if (!flat_) c *= .62 + .38 * smoothstep(0., 60., vHP.y);                // damp base
          else {
            float t2 = gdHash(cell + uSeed + 9.);                                  // each flag its own tone; a few dark replacements
            c *= mix(vec3(1.1, 1., .9), vec3(.86, .93, 1.12), t2) * (1. - .3 * step(.9, tint) * visT) * (.8 + .4 * gdFbm(gdUV * .05 + 3.));
            float rx = abs(vHP.x - 15.);                                           // a paler runner of stone leads to the slot, edged in dark
            float run = (1. - smoothstep(8.6, 8.9, rx)) * step(vHP.y, 3.) * step(-2., vHP.z);
            c = mix(c, c * vec3(1.32, 1.22, 1.08), run * .7); c *= 1. - .55 * (1. - smoothstep(.0, .45, abs(rx - 9.6))) * step(vHP.y, 3.) * step(-2., vHP.z);
            // scrape arc of the swinging leaf
            float r = length(vHP.xz - vec2(${HW.toFixed(1)}, 0.));
            float arc = (1. - smoothstep(.6, 2.4, abs(r - ${(HW - 1.5).toFixed(1)}))) * step(0., vHP.z) * step(vHP.x, 124.) * step(vHP.y, 3.);
            c *= 1. - .4 * arc;
          }
          diffuseColor.rgb = c; gdRough = .86 + .12 * tint; gdH = -mortar * .5 + grit * .12;
        } else if (vMat < 1.5) {    // ---- wood: tall planks with grain
          float pw = 2.3, px = gdUV.x / pw, pid = floor(px);
          float e = abs(fract(px) - .5) * pw;
          float vis = 1. - smoothstep(.1, .55, gdPix), visT = 1. - smoothstep(.5, 2., gdPix);
          float groove = smoothstep(pw * .5 - .1 - gdPix, pw * .5 - .01, e) * vis * .6;
          float jy = (gdUV.y + gdHash(vec2(pid, 7.)) * 60.) / 29.;                 // butt joints break every plank into boards of their own tone
          float joint = (1. - smoothstep(.05, .14 + gdPix, (.5 - abs(fract(jy) - .5)) * 29.)) * vis;
          pid += 17. * floor(jy); groove = max(groove, joint * .7);
          float knot = smoothstep(.8, .93, gdNoise(vec2(gdUV.x * .9 + pid, gdUV.y * .22))) * vis;
          float grain = mix(gdFbm(gdUV * vec2(.11, .02) + 5.), gdFbm(vec2(gdUV.x * 5. + pid * 7.3, gdUV.y * .16 + pid * 3.1)), .25 + .45 * visT);
          float fine = gdNoise(vec2(gdUV.x * 30., gdUV.y * 1.1)) * vis;
          vec3 c = diffuseColor.rgb * (.82 + .32 * gdHash(vec2(pid, uSeed + 3.)) * visT + .16 * (1. - visT));
          c *= (.78 + .36 * grain + .12 * fine) * (1. - .4 * knot);
          c *= .88 + .24 * gdNoise(vec2(gdUV.x * .35, gdUV.y * 2.6)) * vis;         // saw marks across the grain
          c = mix(c, c * vec3(1.25, .95, .8), smoothstep(.6, .9, grain) * .35);
          c *= 1. - .6 * groove;
          c *= .7 + .3 * smoothstep(0., 45., vHP.y);
          diffuseColor.rgb = c; gdRough = .62 + .25 * grain; gdH = -groove * .45 + fine * .05;
        } else if (vMat < 2.5) {    // ---- bronze: patina in the hollows, polish on the highs
          float pat = gdFbm(vOP.xy * .11 + vOP.z * .3 + uSeed);
          vec3 c = diffuseColor.rgb * (.75 + .5 * gdNoise(vOP.xy * .9 + vOP.yz * .7));
          c = mix(c, vec3(.1, .26, .25), smoothstep(.52, .78, pat) * .55);
          float visB = 1. - smoothstep(.12, .7, gdPix);
          vec2 pg = gdUV / vec2(4.2, 2.1), pf = abs(fract(pg) - .5);
          float seam = smoothstep(.47, .492, max(pf.x, pf.y)) * visB * step(.9, gdAN.z);
          float rivet = (1. - smoothstep(.03, .05, length((pf - .43) * vec2(2., 1.)))) * visB * step(.9, gdAN.z);
          c *= 1. - .5 * seam; c += vec3(.12, .09, .04) * rivet;
          float lzA = abs(fract((gdUV.x + gdUV.y) / 7.) - .5), lzB = abs(fract((gdUV.x - gdUV.y) / 7.) - .5);
          float lat = smoothstep(.43, .47, max(lzA, lzB)) * (1. - smoothstep(.5, 2.2, gdPix)) * step(.9, gdAN.z);   // chased lozenges on the plates
          c *= 1. - .42 * lat; c *= .8 + .35 * smoothstep(.15, .4, min(lzA, lzB)) * (1. - smoothstep(.5, 2.2, gdPix));
          c *= .88 + .24 * gdNoise(gdUV * 2.3);
          diffuseColor.rgb = c; gdRough = .34 + .4 * pat; gdMetal = .55; gdH = -seam * .2 + rivet * .25;
        } else {                    // ---- glow parts: black body, all emissive
          diffuseColor.rgb = vec3(0.); gdRough = 1.;
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = gdRough;`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = gdMetal;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec3 q0 = dFdx(-vViewPosition), q1 = dFdy(-vViewPosition);
          float hx = dFdx(gdH), hy = dFdy(gdH);
          vec3 r1 = cross(q1, normal), r2 = cross(normal, q0);
          float det = dot(q0, r1);
          vec3 g = sign(det) * (hx * r1 + hy * r2);
          vec3 gdNn = abs(det) * normal - g * 1.6; if (dot(gdNn, gdNn) > 1e-16) normal = normalize(gdNn);   // sliver triangles have no usable derivatives
        }`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        { float gdS = gl_FragColor.r + gl_FragColor.g + gl_FragColor.b; if (!(gdS >= 0. && gdS < 1e6)) gl_FragColor = vec4(0., 0., 0., 1.); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 hn = normalize(vHN); vec3 p = vHP;
          float inY = 1. - smoothstep(${(Y0 + DH - 2).toFixed(1)}, ${(Y0 + DH + 2).toFixed(1)}, p.y);
          // direct beam: everything between the door plane and the ajar leaf, plus the free slot
          float slot = 1. - smoothstep(uFreeX - 1., uFreeX + 2. + .04 * max(p.z, 0.), p.x);
          float wedge = step(p.z, (${HW.toFixed(1)} - p.x) * uLeafTan + 7.) * step(p.x, ${(HW + 1).toFixed(1)});
          float inb = smoothstep(-1., 1.5, p.z) * smoothstep(-.5, 1.5, p.x) * max(slot, wedge) * inY;
          float e1 = inb * max(dot(hn, normalize(vec3(0., .2, -1.))), 0.) * 4.6;
          // scattered glare from the slot (a vertical line source)
          vec3 v = vec3(uGapX - p.x, 0., 14. - p.z); float d = length(v);
          float wrap = dot(hn, v / max(d, .001)) * .5 + .5;
          float e2 = wrap * wrap * 1.5 / (1. + d * d / 2600.) * inY;
          e2 += wrap * .3 / (1. + d * d / 40000.) * (1. - smoothstep(${(Y0 + DH).toFixed(1)}, ${(Y0 + DH + 90).toFixed(1)}, p.y));
          if (hn.y > .7) { float gdFl = gdFbm(vec2(p.x * .1, p.z * .055 - uTime * .45)); e1 *= .45 + 1.3 * gdFl; e2 *= .6 + .9 * gdFl; }   // the light runs over the paving like water
          vec3 alb = diffuseColor.rgb + vec3(.02);
          totalEmissiveRadiance += alb * uLight * (e1 + e2) * uOpen;
          if (vMat > 1.5 && vMat < 2.5) {     // fake sky reflection so bronze is never black
            vec3 rd = inverseTransformDirection(reflect(-normalize(vViewPosition), normal), viewMatrix);
            vec3 env = mix(uSkyHor, uSkyTop, smoothstep(-.1, .7, rd.y)) * (.35 + .65 * smoothstep(-.4, .1, rd.y));
            totalEmissiveRadiance += alb * env * .9;
          }
          if (vMat > 2.5) {
            float fl = .85 + .15 * sin(uTime * 1.3 + p.x * .05 + p.y * .02);
            totalEmissiveRadiance += vColor.rgb * fl * (.35 + .65 * uOpen);
          }
        }`);
  };
  m.customProgramCacheKey = () => 'great-door-solid';
  return m;
}

// The doorway: a window onto a sky of clouds lit from below. Ray-directed, so it parallaxes like a real space.
function makeSkyMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uHeroInv: U.uHeroInv, uLight: U.uLight, uWarm: U.uWarm, uCool: U.uSkyTop, uOpen: U.uOpen, uTime: U.uTime, uSeed: U.uSeed, uPocket: U.uPocket },
    vertexShader: /* glsl */`
      uniform mat4 uHeroInv; varying vec3 vHP; varying vec3 vCam;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.);
        vHP = (uHeroInv * wp).xyz; vCam = (uHeroInv * vec4(cameraPosition, 1.)).xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLight, uWarm, uCool; uniform float uOpen, uTime, uSeed, uPocket; varying vec3 vHP; varying vec3 vCam;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_FOGF}
      void main(){
        vec3 d = normalize(vHP - vCam); d.z = -abs(d.z);
        float el = d.y / max(length(d.xz), 1e-3);                 // tan of elevation
        float az = d.x / max(-d.z, .05);
        // gradient: blinding at the horizon, apricot, then a clear rose-violet high up
        vec3 hor = uLight * 6.5, mid = mix(uWarm, uLight, .2) * .85, top = mix(uWarm, uCool, .72) * .36;
        float ae = abs(el);
        vec3 col = mix(hor, mid, smoothstep(0., .11, ae));
        col = mix(col, top, smoothstep(.12, .85, ae));
        float t = uTime * .014;
        if (el > 0.) {
          // cloud ceiling seen from underneath: bright bellies near the light, dusky cores
          vec2 uv = vec2(az, 1.) / (el + .11) * .42 + vec2(uSeed, t);
          float c = gdFbm(uv * vec2(.8, 1.7));
          float m = smoothstep(.42, .7, c) * smoothstep(.02, .2, el);
          vec3 belly = mix(uLight * 3.2, mix(uWarm, uLight, .35) * 1.3, smoothstep(.03, .5, el));
          vec3 core = mix(uWarm * .42, uCool * .22, smoothstep(.06, .6, el));
          col = mix(col, mix(belly, core, smoothstep(.62, .86, c)), m * .92);
          // second, higher wisp layer
          float c2 = gdFbm(vec2(az, 1.) / (el + .3) * 1.4 + vec2(3.1 + uSeed, -t * 2.));
          col += uLight * .8 * smoothstep(.55, .8, c2) * smoothstep(.15, .5, el) * (1. - m);
        } else {
          // cloud sea below the horizon, lit along its crests
          vec2 uv = vec2(az, 1.) / (-el + .09) * .5 + vec2(uSeed * 1.7, -t);
          float c = gdFbm(uv * vec2(.7, 2.1));
          vec3 sea = mix(uLight * 4.5, mix(uWarm, uLight, .4) * 1.2, smoothstep(.0, .3, -el));
          vec3 hollow = mix(uWarm * .7, uCool * .25, smoothstep(.03, .4, -el));
          col = mix(hollow, sea, smoothstep(.35, .7, c));
          col *= .8 + .45 * gdNoise(uv * vec2(2.2, 5.) + vec2(0., uTime * .22));     // light running along the crests
        }
        float mu = max(dot(d, normalize(vec3(0., .03, -1.))), 0.);
        col += uLight * (pow(mu, 80.) * 4. + pow(mu, 12.) * .3);
        col *= .35 + .65 * uOpen;
        col *= 1. - .45 * gdFog();
        // on the final approach the glare stands back from the last door, so it and its portal read as a dark shape in the light
        float pk = (1. - smoothstep(12., 27., abs(vHP.x - 15.))) * (1. - smoothstep(${(Y0 + 30).toFixed(1)}, ${(Y0 + 58).toFixed(1)}, vHP.y));
        col *= 1. - .74 * pk * uPocket;
        gl_FragColor = vec4(col, 1.);
        if (!(col.r + col.g + col.b >= 0.)) gl_FragColor = vec4(0., 0., 0., 1.);
      }`,
  });
}

// Light shafts: thin vertical sheets fanning out of the slot (additive, fade when seen edge-on).
function makeRayMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLight: U.uLight, uOpen: U.uOpen, uTime: U.uTime, uVeil: U.uVeil, uPocket: U.uPocket },
    vertexShader: /* glsl */`
      attribute vec3 aUvs; varying vec3 vUvs; varying float vFace;
      #include <fog_pars_vertex>
      void main(){
        vUvs = aUvs;
        vec4 wp = modelMatrix * vec4(position, 1.);
        vec3 wn = normalize(mat3(modelMatrix) * normal);
        vec3 gdTo = cameraPosition - wp.xyz; vFace = abs(dot(wn, gdTo / max(length(gdTo), 1e-4)));
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLight; uniform float uOpen, uTime, uVeil, uPocket; varying vec3 vUvs; varying float vFace;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_FOGF}
      void main(){
        float u = vUvs.x, v = vUvs.y, s = vUvs.z;
        float along = exp(-u * 3.4) * (1. - smoothstep(.7, 1., u)) * smoothstep(0., .03, u);
        float vert = (.22 + .78 * exp(-v * 5.)) * (1. - smoothstep(.72, 1., v)) * smoothstep(0., .015, v);
        float n1 = gdNoise(vec2(v * 34. + s * 31., u * .9 - uTime * .012 + s * 9.));
        float n2 = gdNoise(vec2(v * 9. + s * 5., u * .5 + uTime * .005));
        float streak = .06 + smoothstep(.2, .75, n1 * (.4 + n2)) * 1.25;
        streak *= .78 + .22 * sin(uTime * .7 + s * 40. + v * 9.);                                  // a slow shimmer, shaft by shaft
        streak *= 1. - .7 * uPocket * (1. - smoothstep(.07, .16, v)) * (1. - smoothstep(.03, .16, u));
        float a = along * vert * streak * smoothstep(.02, .3, vFace) * mix(1., .28, smoothstep(.3, .9, vFace));
        vec3 col = uLight * vec3(1., .84, .62) * a * .21 * uOpen * uVeil * (1. - gdFog());
        gl_FragColor = vec4(col, 1.);
        if (!(col.r + col.g + col.b >= 0.)) gl_FragColor = vec4(0., 0., 0., 1.);
      }`,
  });
}

// River of light on the ground plus low mist layers that catch the beam (one additive mesh).
function makeRiverMaterial(U, L) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uHeroInv: U.uHeroInv, uLight: U.uLight, uOpen: U.uOpen, uTime: U.uTime,
      uFreeX: U.uFreeX, uLeafTan: U.uLeafTan, uGapX: U.uGapX, uLen: { value: L }, uVeil: U.uVeil },
    vertexShader: /* glsl */`
      attribute float aLayer; uniform mat4 uHeroInv; varying vec3 vP; varying float vLayer; varying float vCamY;
      #include <fog_pars_vertex>
      void main(){
        vP = position; vLayer = aLayer;
        vCamY = (uHeroInv * vec4(cameraPosition, 1.)).y;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLight; uniform float uOpen, uTime, uFreeX, uLeafTan, uGapX, uLen, uVeil;
      varying vec3 vP; varying float vLayer; varying float vCamY;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_FOGF}
      void main(){
        float z = vP.z, x = vP.x - uGapX, zz = max(z, 0.);
        float halfW = uFreeX * .5 + zz * .034, pen = 3. + zz * .07 + vLayer * .25;
        float band = 1. - smoothstep(halfW - pen * .4, halfW + pen, abs(x));
        // the lit triangle of floor between the door plane and the ajar leaf
        float wedge = step(0., vP.x) * step(z, (${HW.toFixed(1)} - vP.x) * uLeafTan) * step(vP.x, ${HW.toFixed(1)});
        float lit = max(band, wedge) * smoothstep(-1., 2., z);
        float along = exp(-zz / (uLen * .42)) * (1. - smoothstep(uLen * .7, uLen, zz));
        float a;
        if (vLayer < .5) {
          // ground: long soft streaks and puddle glints; a thin spill under the closed leaf
          float st = gdNoise(vec2(vP.x * .22, z * .012)) * .5 + gdNoise(vec2(vP.x * .05 + 9., z * .004)) * .5;
          float pud = smoothstep(.55, .8, gdFbm(vP.xz * .035 + 4.));
          st = smoothstep(.3, .75, gdNoise(vec2(vP.x * .13, z * .009 - uTime * .035)) * .6 + st * .4);     // the river runs in long bright threads
          a = lit * along * (.2 + 1.25 * st + 1.3 * pud) * (.5 + .5 * smoothstep(20., 200., z));
          a *= .4 + 1.2 * gdFbm(vec2(vP.x * .05 + 3., z * .03 - uTime * .6));        // the light flows outward like a river
          float spill = step(vP.x, 0.) * step(-${HW.toFixed(1)}, vP.x) * exp(-zz / 9.) * smoothstep(-.5, 5., z) * (.6 + .4 * gdNoise(vec2(vP.x * .3, 1.)));
          a += spill * 1.1;
          a += exp(-abs(x) / (halfW * 3. + 20.)) * along * .1 * smoothstep(-1., 30., z) * (1. - smoothstep(95., 150., abs(x)));   // bounce beside the river
        } else {
          // mist sheet: drifting density, fades out as the camera crosses its height
          vec2 q = vP.xz * .012 + vec2(vLayer * 3.3, -uTime * .012);
          float dens = smoothstep(.42, .8, gdFbm(q));
          float cross_ = smoothstep(1.5, 9., abs(vCamY - vP.y));
          a = lit * along * dens * cross_ * .16 * exp(-vLayer * .014);
        }
        vec3 col = uLight * (vLayer < .5 ? vec3(1., .74, .42) : vec3(1., .84, .6)) * a * uOpen * (vLayer < .5 ? .45 + .55 * uVeil : uVeil) * (1. - gdFog());
        gl_FragColor = vec4(col, 1.);
        if (!(col.r + col.g + col.b >= 0.)) gl_FragColor = vec4(0., 0., 0., 1.);
      }`,
  });
}

// Golden motes drifting out of the slot (all motion in the vertex shader).
function makeMoteMaterial(U, L) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLight: U.uLight, uOpen: U.uOpen, uTime: U.uTime, uGapX: U.uGapX, uFreeX: U.uFreeX, uViewH: U.uViewH, uLen: { value: Math.min(L, 700) } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime, uGapX, uFreeX, uViewH, uLen; varying float vA; varying float vTw;
      #include <fog_pars_vertex>
      void main(){
        float life = fract(aSeed.x + uTime * (.006 + .01 * aSeed.y));
        float z = -6. + life * uLen;
        float sp = uFreeX * .42 + z * (.03 + .12 * aSeed.w);
        float ph = aSeed.x * 61.;
        vec3 p;
        p.x = uGapX + (aSeed.z * 2. - 1.) * sp + sin(uTime * .17 + ph + z * .013) * (4. + z * .02);
        p.y = ${Y0.toFixed(1)} + 2. + pow(aSeed.w, 1.7) * 385. * (1. - .35 * life) + life * 60. * (aSeed.y - .35) + sin(uTime * .11 + ph * 1.7) * 6.;
        p.z = z + cos(uTime * .13 + ph) * 5.;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        float size = .45 + 1.5 * aSeed.y * aSeed.y;
        float px = size * projectionMatrix[1][1] * uViewH * .5 / max(-mvPosition.z, 1.);
        float cl = clamp(px, 1.3, 7.);
        gl_PointSize = cl;
        vTw = .55 + .45 * sin(uTime * (1.2 + 2. * aSeed.z) + ph * 3.);
        vA = smoothstep(0., .06, life) * (1. - smoothstep(.55, 1., life)) * min(1., (px * px) / (cl * cl) + .12) * (.3 + .7 * smoothstep(8., 70., -mvPosition.z)) * smoothstep(3., 10., -mvPosition.z);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLight; uniform float uOpen; varying float vA; varying float vTw;
      #include <fog_pars_fragment>
      ${GLSL_FOGF}
      void main(){
        vec2 c = gl_PointCoord - .5; float r = dot(c, c) * 4.;
        float a = (1. - smoothstep(.0, 1., r)); a *= a;
        gl_FragColor = vec4(uLight * vec3(1., .72, .36) * 3.4 * a * vA * vTw * uOpen * (1. - gdFog()), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the stone frame
// three-sided loop around a jamb (open toward the doorway) with sweep()'s a axis pointing outward
function jambPath(sg, xin, xout, hz, y) {
  const p = sg > 0
    ? [[xin, -hz], [xout, -hz], [xout, hz], [xin, hz]]
    : [[-xin, hz], [-xout, hz], [-xout, -hz], [-xin, -hz]];
  return p.map(([x, z]) => new THREE.Vector3(x, y, z));
}

async function buildFrame(bin, rng, C, crown, yieldFn) {      // yieldFn (ctx.yield) hands the page back between the parts; it takes no draw
  const S = MAT.STONE, yTop = Y0 + DH, yEnt = yTop + ENT;
  const anchors = { crown: new THREE.Vector3() };
  const plH = 34, colR = 4.4;
  for (const sg of [-1, 1]) {
    const xc = sg * (HW + JW / 2);
    // shaft, plinth, plinth mouldings, string courses
    bin.add(bevelBox(JW, DH, HZ * 2, 1.2), C.stone, S, { x: xc, y: Y0 + DH / 2 });
    bin.add(bevelBox(JW + 12, plH, HZ * 2 + 12, 2.2), C.stoneDk, S, { x: sg * (HW + (JW + 12) / 2), y: Y0 + plH / 2 });
    bin.add(sweep([[0, 0], [3.2, 0], [3.2, 2.2], [1.6, 3.6], [1.6, 5.2], [0, 6.4]], jambPath(sg, HW, HW + JW + 12, HZ + 6, Y0 + plH), UP, [-1, 3], false, true), C.stoneLt, S);
    bin.add(sweep([[0, 0], [8.5, 0], [8.5, 3], [7, 4.6], [0, 4.6]], jambPath(sg, HW, HW + JW, HZ, Y0 + plH + 6.4), UP, [-1, 2], false, true), C.stone, S);
    const nBand = 3 + (rng() < 0.5 ? 1 : 0);
    for (let k = 1; k <= nBand; k++) {
      const y = Y0 + plH + (DH - plH - 30) * (k / (nBand + 1));
      bin.add(sweep([[0, 0], [1.8, 0.7], [1.8, 2.6], [0, 3.4]], jambPath(sg, HW, HW + JW, HZ, y), UP, [-1, 1.5], false, true), C.stoneLt, S);
    }
    for (const fz of [-1, 1]) {
      await yieldFn?.();
      // pilaster with ribs, base and stepped capital
      const px = sg * (HW + 27.5), pz = fz * (HZ + 1.4), pH = DH - plH - 11 - 26, py = Y0 + plH + 11 + pH / 2;
      bin.add(bevelBox(20, pH, 3.2, 0.7), C.stoneLt, S, { x: px, y: py, z: pz, grad: 0.12 });
      for (const rx of [-5.4, 0, 5.4]) bin.add(bevelBox(2.4, pH - 16, 1.4, 0.5), C.stone, S, { x: px + rx, y: py, z: pz + fz * 1.9 });
      bin.add(bevelBox(23, 5, 5.5, 1.2), C.stoneLt, S, { x: px, y: Y0 + plH + 13.5, z: pz + fz * 0.6 });
      let cy = Y0 + plH + 11 + pH;
      for (const [w, h, d] of [[22, 3, 4.6], [25, 6, 6.6], [29, 5, 9], [33, 4.5, 11.5], [36, 7.5, 13]]) {
        bin.add(bevelBox(w, h, d, 0.8), C.stoneLt, S, { x: px, y: cy + h / 2, z: fz * (HZ + d / 2 - 1.2) }); cy += h;
      }
      await yieldFn?.();
      // slim colonnette on the outer corner
      const prof = [];
      const cH = DH - plH - 30;
      for (let i = 0; i <= 8; i++) { const t = i / 8; prof.push(new THREE.Vector2(colR * (1 - 0.16 * t * t) * (1 + 0.05 * Math.sin(t * Math.PI)), t * cH)); }
      const cx = sg * (HW + JW + 0.8), cz = fz * (HZ + 0.8), cy0 = Y0 + plH + 11;
      bin.add(new THREE.LatheGeometry(prof, 12), C.stoneLt, S, { x: cx, y: cy0, z: cz, grad: 0.1 });
      for (const [yy, rr] of [[0, 1.5], [3.2, 1.1], [cH * 0.5, 0.9], [cH - 2, 1.2]]) bin.add(new THREE.TorusGeometry(colR * (yy > cH * 0.4 ? 0.9 : 1) + 0.6, rr, 6, 14), C.stone, S, { x: cx, y: cy0 + yy, z: cz, rx: Math.PI / 2 });
      bin.add(bevelBox(11, 6, 11, 1), C.stone, S, { x: cx, y: cy0 - 3, z: cz });
      bin.add(bevelBox(11.5, 7, 11.5, 1.4, 1, 1), C.stoneLt, S, { x: cx - sg * 0.6, y: cy0 + cH + 3.5, z: cz - fz * 0.6 });
    }
    await yieldFn?.();
    // human-scale cues: slit windows lit from inside, climbing the pilasters and the outer flank
    const win = new THREE.PlaneGeometry(0.8, 2.0);
    const wcol = () => C.lamp.clone().multiplyScalar(rng.range(0.5, 1.5));
    for (let fl = 0; fl < 46; fl++) {
      const wy = Y0 + plH + 22 + fl * 7.2;
      for (const fz of [-1, 1]) for (const ox of [-8.3, -2.7, 2.7, 8.3]) {
        if (rng() > (fz > 0 ? 0.26 : 0.14)) continue;
        bin.add(win, wcol(), MAT.GLOW, { x: sg * (HW + 27.5) + ox, y: wy + rng.range(-0.3, 0.3), z: fz * (HZ + 3.05), ry: fz > 0 ? 0 : Math.PI });
      }
      for (let k = 0; k < 6; k++) {
        if (rng() > 0.2) continue;
        bin.add(win, wcol(), MAT.GLOW, { x: sg * (HW + JW + 0.06), y: wy, z: -HZ + 4 + k * ((HZ * 2 - 8) / 5), ry: sg * Math.PI / 2 });
      }
    }
    win.dispose();
    // a door-sized door at the foot of each plinth, front and back, with its lamp
    for (const fz of [-1, 1]) {
      const dx = sg * (HW + 14 + rng.range(-3, 12)), dz = fz * (HZ + 6);
      bin.add(bevelBox(3.4, 5.2, 0.8, 0.2), C.stoneLt, S, { x: dx, y: Y0 + 2.6, z: dz + fz * 0.2 });
      bin.add(bevelBox(2.2, 4.2, 0.5, 0.1), C.woodFrieze, MAT.WOOD, { x: dx, y: Y0 + 2.1, z: dz + fz * 0.6 });
      bin.add(bevelBox(2.3, 0.14, 0.3, 0.02), C.glow, MAT.GLOW, { x: dx, y: Y0 + 0.08, z: dz + fz * 0.8 });
      bin.add(bevelBox(0.12, 4.1, 0.3, 0.02), C.glow, MAT.GLOW, { x: dx + 1.12, y: Y0 + 2.1, z: dz + fz * 0.8 });
      bin.add(new THREE.SphereGeometry(0.42, 6, 5), C.lampHi, MAT.GLOW, { x: dx, y: Y0 + 6.4, z: dz + fz * 1.3 });
    }
    await yieldFn?.();
  }
  // stepped architrave lining the opening, front and back
  const arch = [[0, -7], [0, 4.6], [5, 4.6], [5, 3.3], [10.5, 3.3], [10.5, 2.1], [15.2, 2.1], [16.4, 0]];
  const uF = [[-HW, Y0], [-HW, yTop], [HW, yTop], [HW, Y0]].map(([x, y]) => new THREE.Vector3(x, y, HZ));
  const uB = [[HW, Y0], [HW, yTop], [-HW, yTop], [-HW, Y0]].map(([x, y]) => new THREE.Vector3(x, y, -HZ));
  bin.add(sweep(arch, uF, FWD, [8, -3], false, true), C.stoneLt, S);
  bin.add(sweep(arch, uB, BACK, [8, -3], false, true), C.stoneLt, S);

  // entablature: block, frieze of little doors, keystone with keyhole, dentils, cornice
  const eHX = HW + JW + 4, eHZ = HZ + 2;
  bin.add(bevelBox(eHX * 2, ENT, eHZ * 2, 1.2), C.stone, S, { y: yTop + ENT / 2 });
  bin.add(sweep([[0, 0], [2.2, 0], [2.2, 1.6], [0, 2.4]], ringXZ(eHX, eHZ, yTop + 17), UP, [-1, 1], true), C.stoneLt, S);
  const nPl = 2 * rng.int(4, 6) + 1, span = 2 * (HW + 12), fy = yTop + 27.5;
  for (const fz of [-1, 1]) {
    for (let i = 0; i < nPl; i++) {
      if (i % 4 === 0) await yieldFn?.();
      const x = -span / 2 + span * (i / (nPl - 1)); if (i === (nPl - 1) / 2) continue;
      const z = fz * (eHZ + 0.5), arched = (i % 2 === 0);
      bin.add(bevelBox(10.5, 16, 2.2, 0.7), C.stoneLt, S, { x, y: fy, z });
      bin.add(bevelBox(7.6, 13, 1.2, 0.4), C.woodFrieze, MAT.WOOD, { x, y: fy - 0.6, z: z + fz * 1.2 });
      if (arched) bin.add(new THREE.CylinderGeometry(3.8, 3.8, 1.2, 12, 1, false, 0, Math.PI), C.woodFrieze, MAT.WOOD, { x, y: fy + 5.6, z: z + fz * 1.2, rx: Math.PI / 2, ry: Math.PI / 2 });
      if (rng() < 0.45) bin.add(bevelBox(0.7, 12.4, 0.6, 0.1), C.glow, MAT.GLOW, { x: x + (rng() < 0.5 ? -3.3 : 3.3), y: fy - 0.6, z: z + fz * 1.9 });
      else bin.add(new THREE.SphereGeometry(0.6, 6, 4), C.bronze, MAT.BRONZE, { x: x + 2.4, y: fy - 1.5, z: z + fz * 1.9 });
    }
    bin.add(bevelBox(20, 34, 9, 1.4, 1.3, 1), C.stoneLt, S, { y: yTop + 19, z: fz * (eHZ + 2.5) });
    bin.add(bevelBox(12.5, 19, 1.6, 0.6), C.bronze, MAT.BRONZE, { y: yTop + 20, z: fz * (eHZ + 7.4) });
    bin.add(new THREE.CylinderGeometry(3.1, 3.1, 0.8, 18), C.glow, MAT.GLOW, { y: yTop + 23.5, z: fz * (eHZ + 8.4), rx: Math.PI / 2 });
    bin.add(bevelBox(3.6, 9, 0.8, 0.1, 0.42, 1), C.glow, MAT.GLOW, { y: yTop + 17.2, z: fz * (eHZ + 8.4) });
  }
  await yieldFn?.();
  const dy = yTop + ENT - 15.5;
  for (let x = -eHX + 3; x <= eHX - 3 + 0.01; x += 8.05) { await yieldFn?.(); for (const fz of [-1, 1]) bin.add(bevelBox(4.6, 5.4, 5, 0.5), C.stoneLt, S, { x, y: dy, z: fz * (eHZ + 2) }); }
  for (let z = -eHZ + 5; z <= eHZ - 5 + 0.01; z += 8) for (const sx of [-1, 1]) bin.add(bevelBox(5, 5.4, 4.6, 0.5), C.stoneLt, S, { x: sx * (eHX + 2), y: dy, z });
  bin.add(sweep([[0, 0], [5.5, 0.6], [5.5, 2.6], [9.5, 4.2], [9.5, 6.2], [13.5, 8], [13.5, 11.2], [11.5, 12.6], [0, 12.6]], ringXZ(eHX, eHZ, yTop + ENT - 12.6), UP, [-2, 6], true), C.stoneLt, S);
  await yieldFn?.();

  // crown
  const cHX = eHX + 6, cD = eHZ * 2 - 6;
  const rake = [[-11, 0], [-11, 2.2], [-6, 2.2], [-6, 4], [2.2, 4], [2.2, 0]];
  let ocY = yEnt + 30, ocZ = cD / 2, ocR = 17, apexY = yEnt + 60;
  if (crown < 2) {
    const sh = new THREE.Shape();
    const pathPts = [];
    if (crown === 0) {
      const rx = cHX - 8, ry = rng.range(56, 70); apexY = yEnt + 6 + ry; ocY = yEnt + 6 + ry * 0.45;
      sh.moveTo(-rx, 0); for (let i = 0; i <= 40; i++) { const a = Math.PI * (1 - i / 40); const x = Math.cos(a) * rx, y = Math.sin(a) * ry; sh.lineTo(x, y); pathPts.push(new THREE.Vector3(x, yEnt + 6 + y, 0)); }
      sh.lineTo(-rx, 0);
    } else {
      const rx = cHX - 2, ry = rng.range(66, 84); apexY = yEnt + 6 + ry; ocY = yEnt + 6 + ry * 0.36; ocR = 15;
      sh.moveTo(-rx, 0); sh.lineTo(0, ry); sh.lineTo(rx, 0); sh.lineTo(-rx, 0);
      pathPts.push(new THREE.Vector3(-rx, yEnt + 6, 0), new THREE.Vector3(0, yEnt + 6 + ry, 0), new THREE.Vector3(rx, yEnt + 6, 0));
    }
    const hole = new THREE.Path(); hole.absarc(0, ocY - yEnt - 6, ocR, 0, Math.PI * 2, true); sh.holes.push(hole);
    const ex = new THREE.ExtrudeGeometry(sh, { depth: cD - 3, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.2, bevelSegments: 1, curveSegments: 28 });
    ex.translate(0, 0, -(cD - 3) / 2);
    bin.add(ex, C.stone, S, { y: yEnt + 6 });
    await yieldFn?.();
    bin.add(bevelBox(cHX * 2, 6, cD + 3, 1), C.stoneLt, S, { y: yEnt + 3 });
    bin.add(sweep(rake, pathPts.map((p) => p.clone().setZ(cD / 2)), FWD, [-3, 1], false, true), C.stoneLt, S);
    bin.add(sweep(rake, pathPts.map((p) => p.clone().setZ(-cD / 2)).reverse(), BACK, [-3, 1], false, true), C.stoneLt, S);
  } else {
    let y = yEnt; const tiers = [[cHX * 2 - 20, 20], [cHX * 2 - 110, 44], [cHX * 2 - 200, 16], [70, 14]];
    for (let i = 0; i < tiers.length; i++) {
      const [w, h] = tiers[i]; bin.add(bevelBox(w, h, cD - i * 4, 1.6), i % 2 ? C.stone : C.stoneLt, S, { y: y + h / 2 });
      bin.add(sweep([[0, 0], [3, 0.8], [3, 2.6], [0, 3.6]], ringXZ(w / 2, (cD - i * 4) / 2, y + h - 3.6), UP, [-1, 2], true), C.stoneLt, S);
      if (i === 1) { ocY = y + h / 2; ocZ = (cD - 4) / 2; }
      y += h;
    }
    apexY = y; ocR = 15;
  }
  await yieldFn?.();
  // the oculus: a round door, slightly open, with the light behind it
  for (const fz of [-1, 1]) {
    await yieldFn?.();
    bin.add(new THREE.TorusGeometry(ocR + 1.2, 2.8, 8, 30), C.stoneLt, S, { y: ocY, z: fz * ocZ, sz: 1.4 });
    bin.add(new THREE.TorusGeometry(ocR - 0.8, 0.9, 6, 30), C.bronze, MAT.BRONZE, { y: ocY, z: fz * (ocZ + 2.6) });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + Math.PI / 12; bin.add(bevelBox(3.2, 5.2, 3, 0.6), C.stone, S, { x: Math.cos(a) * (ocR + 5.4), y: ocY + Math.sin(a) * (ocR + 5.4), z: fz * (ocZ + 0.6), rz: a - Math.PI / 2 }); }
    bin.add(new THREE.CircleGeometry(ocR - 0.5, 30), C.glowHi, MAT.GLOW, { y: ocY, z: fz * (crown < 2 ? 1.5 : ocZ + 0.4), ry: fz > 0 ? 0 : Math.PI });
    const od = new THREE.CylinderGeometry(ocR - 1, ocR - 1, 1.6, 30);
    bin.add(od, C.wood, MAT.WOOD, { x: ocR * 0.55, y: ocY, z: fz * (crown < 2 ? 5.5 : ocZ + 3.2), rx: Math.PI / 2, ry: 0, rz: fz * 0.5 });
    bin.add(new THREE.TorusGeometry(2.6, 0.5, 5, 12), C.bronze, MAT.BRONZE, { x: ocR * 0.55 - 6, y: ocY, z: fz * (crown < 2 ? 6.9 : ocZ + 4.6) });
  }
  await yieldFn?.();
  anchors.crown.set(0, ocY, 0);
  // finials
  const fin = (x, y, s) => {
    bin.add(bevelBox(12, 8, 12, 1.2), C.stoneLt, S, { x, y: y + 4 * s, s });
    bin.add(bevelBox(8, 34, 8, 0.8, 0.18), C.stone, S, { x, y: y + 25 * s, s });
    bin.add(new THREE.SphereGeometry(2.6, 8, 6), C.bronze, MAT.BRONZE, { x, y: y + 44.5 * s, s });
  };
  fin(-(eHX - 2), crown === 2 ? yEnt + 20 : yEnt + 6, 1); fin(eHX - 2, crown === 2 ? yEnt + 20 : yEnt + 6, 1);
  if (crown !== 0) fin(0, apexY, crown === 1 ? 0.8 : 1.1); else { bin.add(bevelBox(16, 10, 14, 1.4), C.stoneLt, S, { y: apexY + 4 }); bin.add(new THREE.SphereGeometry(6, 10, 8), C.bronze, MAT.BRONZE, { y: apexY + 14 }); }
  anchors.top = apexY + (crown === 0 ? 20 : 45);

  await yieldFn?.();
  // paved terrace with three shallow steps; sill between the jambs
  for (let k = 0; k < 3; k++) {
    const top = Y0 - k * 0.8, w = 2 * (HW + JW + 30) + k * 9, d = 176 + k * 9;
    bin.add(bevelBox(w, top + 1.5, d, 0.2), k === 0 ? C.pave : C.stoneDk, S, { y: (top - 1.5) / 2, z: 26 });
  }
  return anchors;
}

// ---------------------------------------------------------------- the door leaves
// shallow raised-and-fielded panel centred on the origin, rising along +Z
function fielded(w, h, rise, slope) {
  const s = soup(), hx = w / 2, hy = h / 2, ix = hx - slope, iy = hy - slope;
  const o = [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const t = [[-ix, -iy], [ix, -iy], [ix, iy], [-ix, iy]].map(([x, y]) => new THREE.Vector3(x, y, rise));
  s.quad(t[0], t[1], t[2], t[3], FWD);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; const want = new THREE.Vector3().addVectors(o[i], o[j]).setZ(Math.abs(hx)); s.quad(o[i], o[j], t[j], t[i], want); }
  return s.geo();
}

function makeLeafLayout(rng) {
  const LW = HW - 0.6, yb = Y0 + 1, yt = Y0 + DH - 0.8;
  const cols = rng.pick([1, 2, 2, 2, 3]), nRows = rng.int(4, 6);
  const sw = 11, mw = 8, botRail = 27, topRail = 14, rail = 9;
  const wts = []; for (let i = 0; i < nRows; i++) { const t = i / (nRows - 1); wts.push(0.75 + 1.5 * Math.sin(Math.PI * Math.pow(t, 0.8)) + rng.range(-0.15, 0.15)); }
  wts[nRows - 1] *= 0.7;
  const total = wts.reduce((a, b) => a + b, 0), avail = (yt - yb) - botRail - topRail - rail * (nRows - 1);
  const rows = []; let y = yb + botRail;
  for (let i = 0; i < nRows; i++) { const h = avail * wts[i] / total; rows.push([y, y + h]); y += h + rail; }
  const colsX = [], cw = (LW - 2 * sw - mw * (cols - 1)) / cols;
  for (let c = 0; c < cols; c++) colsX.push([sw + c * (cw + mw), sw + c * (cw + mw) + cw]);
  return { LW, yb, yt, cols, rows, colsX, sw, mw, botRail, topRail, rail, nHinge: rng.int(3, 5), ringY: Y0 + rng.range(150, 172), rosette: rng() < 0.7, studPitch: rng.range(10.5, 14) };
}

async function buildLeaf(bin, rng, C, L, closed, yieldFn) {      // yieldFn as in buildFrame
  const W = MAT.WOOD, BR = MAT.BRONZE, { LW, yb, yt, sw } = L, LH = yt - yb, yc = (yb + yt) / 2;
  const zc = 2.8;                       // half thickness of the core slab
  bin.add(bevelBox(LW, LH, zc * 2, 0.5), C.woodDk, W, { x: LW / 2, y: yc });
  bin.add(bevelBox(2.4, LH + 0.4, LT + 1.2, 0.5), C.bronze, BR, { x: LW - 0.9, y: yc });          // astragal on the meeting edge
  const ni = (g) => { const o = g.toNonIndexed(); o.deleteAttribute('uv'); g.dispose(); return o; };
  const stud = ni(new THREE.ConeGeometry(1.5, 1.3, 4)), boss = ni(new THREE.ConeGeometry(3.4, 1.8, 8)), knob = ni(new THREE.SphereGeometry(1, 6, 4));
  for (const fz of [-1, 1]) {
    const rxF = fz * Math.PI / 2, zf = fz * (zc + 0.85), zs = fz * (zc + 1.7);     // rail centre plane, rail surface
    const B = fz > 0 ? FWD : BACK;
    // stiles, muntins, rails
    bin.add(bevelBox(sw, LH, 1.7, 0.45), C.wood, W, { x: sw / 2, y: yc, z: zf });
    bin.add(bevelBox(sw, LH, 1.7, 0.45), C.wood, W, { x: LW - sw / 2 - 1.6, y: yc, z: zf });
    for (let c = 1; c < L.cols; c++) bin.add(bevelBox(L.mw, LH - L.botRail - L.topRail + 1, 1.7, 0.45), C.wood, W, { x: L.colsX[c][0] - L.mw / 2, y: (yb + L.botRail + yt - L.topRail) / 2, z: zf });
    const rw = LW - 2 * sw - 1.2, rx0 = sw + rw / 2 - 0.4;
    bin.add(bevelBox(rw, L.botRail, 1.7, 0.45), C.wood, W, { x: rx0, y: yb + L.botRail / 2, z: zf });
    bin.add(bevelBox(rw, L.topRail, 1.7, 0.45), C.wood, W, { x: rx0, y: yt - L.topRail / 2, z: zf });
    for (let r = 0; r < L.rows.length - 1; r++) bin.add(bevelBox(rw, L.rail, 1.7, 0.45), C.wood, W, { x: rx0, y: L.rows[r][1] + L.rail / 2, z: zf });
    // panels: bolection moulding, fielded centre, nested plaque, rosette
    const prof = [[0, 0], [0, 2.3], [-1.7, 2.3], [-2.8, 1.2], [-4.4, 0.8], [-4.4, 0]];
    for (const [py0, py1] of L.rows) for (const [px0, px1] of L.colsX) {
      await yieldFn?.();
      const cx = (px0 + px1) / 2, cy = (py0 + py1) / 2, pw = px1 - px0, ph = py1 - py0;
      let ring = ringXY(pw / 2, ph / 2, cx, cy, fz * zc); if (fz < 0) ring = ring.reverse();
      bin.add(sweep(prof, ring, B, [-2, 0.4], true), C.woodLt, W);
      const fw = pw - 14, fh = ph - 14;
      if (fw > 6 && fh > 6) {
        bin.add(fielded(fw, fh, 1.5, Math.min(5, fw * 0.2, fh * 0.2)), C.wood, W, { x: cx, y: cy, z: fz * zc, ry: fz > 0 ? 0 : Math.PI });
        if (fh > 46 && fw > 24) {
          const iw = fw - 16, ih = fh - 16;
          let r2 = ringXY(iw / 2, ih / 2, cx, cy, fz * (zc + 1.5)); if (fz < 0) r2 = r2.reverse();
          bin.add(sweep([[0, 0], [0, 0.9], [-1.4, 0.9], [-2.2, 0]], r2, B, [-1, 0.2], true), C.woodLt, W);
          if (L.rosette) {
            bin.add(boss, C.bronze, BR, { x: cx, y: cy, z: fz * (zc + 2.3), rx: rxF, s: Math.min(1.6, iw / 18) });
            for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; bin.add(knob, C.bronze, BR, { x: cx + Math.cos(a) * 7, y: cy + Math.sin(a) * 7, z: fz * (zc + 1.7), s: 0.9 }); }
          }
        } else if (fw > 12) bin.add(boss, C.bronze, BR, { x: cx, y: cy, z: fz * (zc + 2.2), rx: rxF, s: 0.8 });
      }
    }
    await yieldFn?.();
    // studs along stiles and rails
    const nS = Math.floor(LH / L.studPitch);
    for (let i = 0; i < nS; i++) {
      const y = yb + (i + 0.5) * (LH / nS);
      bin.add(stud, C.bronze, BR, { x: sw / 2, y, z: zs + fz * 0.6, rx: rxF });
      bin.add(stud, C.bronze, BR, { x: LW - sw / 2 - 1.8, y, z: zs + fz * 0.6, rx: rxF });
    }
    const nR = Math.floor(rw / L.studPitch);
    const railYs = [yt - L.topRail / 2, ...L.rows.slice(0, -1).map((r) => r[1] + L.rail / 2)];
    for (const y of railYs) for (let i = 0; i < nR; i++) bin.add(stud, C.bronze, BR, { x: sw + (i + 0.5) * (rw / nR), y, z: zs + fz * 0.6, rx: rxF, s: 0.8 });
    // kick plate
    bin.add(bevelBox(LW - 5, 17, 0.9, 0.3), C.bronze, BR, { x: LW / 2 - 0.6, y: yb + 10.5, z: zs + fz * 0.4 });
    for (let i = 0; i < 14; i++) for (const yy of [3.6, 17.4]) bin.add(stud, C.bronze, BR, { x: 6 + i * ((LW - 13) / 13), y: yb + yy, z: zs + fz * 1.2, rx: rxF, s: 0.7 });
    // strap hinges: tapering strap, spearhead, two curls, knuckle on the pin
    for (let h = 0; h < L.nHinge; h++) {
      await yieldFn?.();
      const y = yb + LH * ((h + 0.5) / L.nHinge) + (h === 0 ? 14 : 0), len = LW * 0.6;
      bin.add(bevelBox(7, len, 1, 0.3, 0.4, 1), C.bronze, BR, { x: len / 2, y, z: zs + fz * 0.5, rz: -Math.PI / 2 });
      bin.add(bevelBox(9, 13, 1, 0.3, 0.06, 1), C.bronze, BR, { x: len + 5.5, y, z: zs + fz * 0.5, rz: -Math.PI / 2 });
      for (const sy of [-1, 1]) bin.add(new THREE.TorusGeometry(3.4, 0.9, 5, 12), C.bronze, BR, { x: len - 2.5, y: y + sy * 6.2, z: zs + fz * 0.6 });
      for (let i = 0; i < 5; i++) bin.add(stud, C.bronzeHi, BR, { x: 6 + i * (len - 12) / 4, y, z: zs + fz * 1.3, rx: rxF, s: 0.75 });
      if (fz > 0) {
        bin.add(new THREE.CylinderGeometry(6.2, 6.2, 20, 12), C.bronze, BR, { x: 0.6, y, z: 0 });
        for (const sy of [-1, 1]) bin.add(new THREE.SphereGeometry(6.6, 10, 5), C.bronze, BR, { x: 0.6, y: y + sy * 10.5, z: 0, sy: 0.5 });
      }
    }
    await yieldFn?.();
    // ring pull and keyhole
    const hx = LW - 19, hy = L.ringY;
    bin.add(bevelBox(13, 30, 1.2, 0.5), C.bronze, BR, { x: hx, y: hy, z: zs + fz * 0.6 });
    bin.add(new THREE.CylinderGeometry(4.6, 5.4, 2.6, 12), C.bronze, BR, { x: hx, y: hy + 7, z: zs + fz * 2.2, rx: rxF });
    bin.add(new THREE.SphereGeometry(3.3, 10, 6), C.bronzeHi, BR, { x: hx, y: hy + 7, z: zs + fz * 3.6 });
    bin.add(new THREE.TorusGeometry(10, 1.5, 8, 26), C.bronzeHi, BR, { x: hx, y: hy - 2.6, z: zs + fz * 4.4, rx: fz * 0.12 });
    bin.add(bevelBox(8.5, 17, 1, 0.4), C.bronze, BR, { x: hx, y: hy - 44, z: zs + fz * 0.5 });
    bin.add(new THREE.CylinderGeometry(1.9, 1.9, 0.5, 14), C.glow, MAT.GLOW, { x: hx, y: hy - 41.5, z: zs + fz * 1.15, rx: Math.PI / 2 });
    bin.add(bevelBox(2.4, 6.5, 0.5, 0.05, 0.4, 1), C.glow, MAT.GLOW, { x: hx, y: hy - 45.6, z: zs + fz * 1.15 });
    // doors within the door: a 64 m wicket holding a 16 m wicket holding a door-sized door, each lit from behind
    if (closed) {
      let wx = LW - 36, wyb = yb + 1.4, ww = 34, wh = 64, wz = zs + 1.6 * fz, th = 3.2;
      for (let lvl = 0; lvl < 3; lvl++) {
        const k = ww / 34, zF = wz + fz * th;               // front surface of this doorlet
        let wr = ringXY(ww / 2, wh / 2, wx, wyb + wh / 2, wz); if (fz < 0) wr = wr.reverse();
        bin.add(sweep([[0, 0], [0, th + 1.2 * k], [3.4 * k, th + 1.2 * k], [4.6 * k, 0]], wr, B, [1.5 * k, 0.3 * k], true), C.woodLt, W);
        bin.add(bevelBox(ww, wh, th, 0.3 * k), lvl === 1 ? C.wood : C.woodLt, W, { x: wx, y: wyb + wh / 2, z: wz + fz * th / 2 });
        for (const [py, ph] of [[0.74, 0.4], [0.3, 0.34]]) for (const pxo of [-0.24, 0.24]) {
          if (lvl === 0 && py < 0.5 && pxo > 0) continue;                               // room for the next door
          bin.add(fielded(ww * 0.38, wh * ph, 0.9 * k, 2.2 * k), C.woodDk, W, { x: wx + pxo * ww, y: wyb + wh * py, z: zF, ry: fz > 0 ? 0 : Math.PI });
        }
        bin.add(new THREE.TorusGeometry(1.5 * k, 0.3 * k, 5, 12), C.bronzeHi, BR, { x: wx + ww * 0.4, y: wyb + wh * 0.52, z: zF + fz * 0.5 * k });
        bin.add(bevelBox(0.5 * k + 0.08, wh, 0.5 * k, 0.03), C.glow, MAT.GLOW, { x: wx + ww / 2 + 0.3 * k, y: wyb + wh / 2, z: zF - fz * 0.2 * k });
        bin.add(bevelBox(ww, 0.5 * k + 0.08, 0.5 * k, 0.03), C.glow, MAT.GLOW, { x: wx, y: wyb - 0.3 * k, z: zF - fz * 0.2 * k });
        // next level sits in the lower meeting-edge corner of this one
        const nw = ww / 4, nh = wh / 4;
        wx = wx + ww * 0.24; wyb = wyb + 0.9 * k; wz = zF; th = Math.max(0.25, th * 0.3); ww = nw; wh = nh;
      }
      bin.add(new THREE.SphereGeometry(0.3, 6, 5), C.lampHi, MAT.GLOW, { x: wx - ww * 2.2, y: wyb + wh * 4.6, z: wz + fz * 0.5 });
    }
    await yieldFn?.();
  }
  if (closed) {   // light leaking under, over and beside the closed leaf
    bin.add(bevelBox(LW + 0.6, 1.0, LT - 3, 0.1), C.glow, MAT.GLOW, { x: LW / 2, y: yb - 0.5 });
    bin.add(bevelBox(LW + 0.6, 0.8, LT - 3, 0.1), C.glowLo, MAT.GLOW, { x: LW / 2, y: yt + 0.4 });
    bin.add(bevelBox(0.7, LH, LT - 3, 0.1), C.glowLo, MAT.GLOW, { x: -0.1, y: yc });
  }
  stud.dispose(); boss.dispose(); knob.dispose();
}

// ---------------------------------------------------------------- light effects geometry
function buildRays(rng, freeX, L) {
  const pos = [], nor = [], uvs = [], idx = [], N = 18;
  for (let i = 0; i < N; i++) {
    const ox = lerp(1.5, freeX - 1.5, (i + rng()) / N), z0 = 4;
    const maxA = Math.min(0.17, Math.atan((freeX - 1 - ox) / 84)), a = lerp(-0.17, maxA, Math.pow(rng(), 0.8));
    const len = L * rng.range(0.5, 0.95), dx = Math.sin(a), dz = Math.cos(a), h0 = DH - 4, h1 = DH * rng.range(0.8, 1.1), s = rng();
    const b = pos.length / 3;
    pos.push(ox, Y0, z0, ox + dx * len, 0.3, z0 + dz * len, ox + dx * len, h1, z0 + dz * len, ox, Y0 + h0, z0);
    for (let k = 0; k < 4; k++) nor.push(dz, 0, -dx);
    uvs.push(0, 0, s, 1, 0, s, 1, 1, s, 0, 1, s);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aUvs', new THREE.Float32BufferAttribute(uvs, 3));
  g.setIndex(idx);
  return g;
}

function buildRiver(gapX, L) {
  const pos = [], lay = [], idx = [], x0 = gapX - 150, x1 = gapX + 150;
  const quad = (za, ya, zb, yb, layer) => {
    const b = pos.length / 3;
    pos.push(x0, ya, za, x1, ya, za, x1, yb, zb, x0, yb, zb); lay.push(layer, layer, layer, layer);
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  };
  quad(0, Y0 + 0.12, 114, Y0 + 0.12, 0); quad(114, Y0 + 0.12, 124, 0.25, 0); quad(124, 0.25, L, 0.25, 0);
  for (const y of [8, 15, 25, 39, 58, 82]) quad(0, y, L, y, y);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aLayer', new THREE.Float32BufferAttribute(lay, 1));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('great-door') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [indigo, violet, apricot, gold, slate, , white] = pal;
  const mul = (c, k) => c.clone().multiplyScalar(k);

  // ---- per-seed choices
  const mirror = opts.ajar ? opts.ajar === 'left' : rng() < 0.4;
  const crown = opts.crown ?? rng.int(0, 2);
  const L = opts.riverLength ?? 900;
  const stone = slate.clone().lerp(white, 0.3).lerp(violet, 0.08).lerp(apricot, rng.range(0, 0.07));
  let woodBase = mul(indigo.clone().lerp(violet, rng.range(0.5, 0.9)), 1.15);
  if (rng() < 0.35) woodBase.lerp(apricot, 0.14);
  const light = gold.clone().lerp(white, 0.35);
  const C = {
    stone, stoneLt: mul(stone, 1.2), stoneDk: mul(stone, 0.72), pave: mul(stone.clone().lerp(gold, 0.08), 0.95),
    wood: woodBase, woodDk: mul(woodBase, 0.62), woodLt: mul(woodBase.clone().lerp(gold, 0.06), 1.35), woodFrieze: mul(woodBase, 0.8),
    bronze: mul(gold.clone().lerp(apricot, 0.18), 0.55), bronzeHi: mul(gold, 0.8),
    glow: mul(light, 3.6), glowLo: mul(light, 2.2), glowHi: mul(light, 5), lamp: mul(gold.clone().lerp(apricot, 0.35), 3.2), lampHi: mul(gold.clone().lerp(apricot, 0.2), 6),
  };
  const layout = makeLeafLayout(rng);
  const LW = layout.LW, GAP1 = 30, GAP0 = 17;
  const th1 = Math.acos((HW - GAP1) / LW), th0 = Math.acos((HW - GAP0) / LW);

  const U = {
    uHeroInv: { value: new THREE.Matrix4() }, uLight: { value: light }, uWarm: { value: apricot.clone() },
    uSkyTop: { value: violet.clone().lerp(white, 0.15) }, uSkyHor: { value: mul(apricot, 0.7) },
    uOpen: { value: 1 }, uTime: { value: 0 }, uFreeX: { value: GAP1 }, uLeafTan: { value: Math.tan(th1) }, uGapX: { value: GAP1 / 2 },
    uSeed: { value: rng.range(0, 50) }, uViewH: { value: 720 }, uProgress: { value: 1 }, uVeil: { value: 1 }, uPocket: { value: 0 },
  };

  const object = new THREE.Group(); object.name = 'great-door';
  const inner = new THREE.Group(); inner.scale.x = mirror ? -1 : 1; object.add(inner);
  const solid = makeSolidMaterial(U);

  // ---- frame
  const frameBin = makeBin();
  const fa = await buildFrame(frameBin, rng.fork('frame'), C, crown, ctx.yield);
  await ctx.yield?.();
  const frame = new THREE.Mesh(frameBin.build(), solid); frame.name = 'frame'; inner.add(frame);
  await ctx.yield?.();

  // ---- leaves (hinge-local geometry on pivots)
  const pivC = new THREE.Group(); pivC.position.set(-HW, 0, 0); inner.add(pivC);
  const pivA = new THREE.Group(); pivA.position.set(HW, 0, 0); inner.add(pivA);
  const binC = makeBin(); await buildLeaf(binC, rng.fork('leafC'), C, layout, true, ctx.yield);
  const leafC = new THREE.Mesh(binC.build(), solid); leafC.name = 'leaf-closed'; pivC.add(leafC);
  await ctx.yield?.();
  const binA = makeBin(); await buildLeaf(binA, rng.fork('leafA'), C, layout, false, ctx.yield);
  const leafA = new THREE.Mesh(binA.build(), solid); leafA.name = 'leaf-ajar'; pivA.add(leafA);
  await ctx.yield?.();

  // ---- the doorway sky
  const skyGeo = new THREE.PlaneGeometry(HW + 0.6, DH); skyGeo.translate((HW - 0.6) / 2, Y0 + DH / 2, 0);
  const sky = new THREE.Mesh(skyGeo, makeSkyMaterial(U)); sky.name = 'doorway-sky'; inner.add(sky);

  // ---- shafts, river + mist, motes
  const river = new THREE.Mesh(buildRiver(GAP1 / 2, L), makeRiverMaterial(U, L)); river.renderOrder = 2; river.name = 'light-river'; inner.add(river);
  const rays = new THREE.Mesh(buildRays(rng.fork('rays'), GAP1, L), makeRayMaterial(U)); rays.renderOrder = 3; rays.name = 'shafts'; inner.add(rays);
  const nM = opts.motes ?? 7000, mr = rng.fork('motes');
  const mSeed = new Float32Array(nM * 4); for (let i = 0; i < mSeed.length; i++) mSeed[i] = mr();
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nM * 3), 3));
  mGeo.setAttribute('aSeed', new THREE.BufferAttribute(mSeed, 4));
  const motes = new THREE.Points(mGeo, makeMoteMaterial(U, L)); motes.frustumCulled = false; motes.renderOrder = 4; motes.name = 'motes'; inner.add(motes);

  let lamp = null;
  if (opts.pointLight) { lamp = new THREE.PointLight(light, 6e4, 1400, 2); lamp.position.set(GAP1 / 2, 70, 30); inner.add(lamp); }

  // ---- progress: the leaf eases open and the light swells as the camera comes down the river of light
  let progress = 1, theta = th1;
  const applyProgress = () => {
    const o = smoothstep(0, 0.85, progress);
    theta = lerp(th0, th1, o);
    U.uOpen.value = lerp(0.72, 1, o); U.uProgress.value = progress;
    if (lamp) lamp.intensity = 6e4 * U.uOpen.value;
  };
  const setLeaf = (th) => {
    pivA.rotation.y = Math.PI + th;
    const fx = HW - LW * Math.cos(th);
    U.uFreeX.value = fx; U.uGapX.value = fx / 2; U.uLeafTan.value = Math.tan(th);
  };
  applyProgress(); setLeaf(theta);

  // ---- anchors
  const sx = mirror ? -1 : 1, V = (x, y, z) => new THREE.Vector3(sx * x, y, z);
  const gx = GAP1 / 2, py = Y0 + 12;
  const height = fa.top;
  const center = V(gx, 165, 20);
  const anchors = {
    portalSeat: { position: V(gx, py, 0), facing: new THREE.Vector3(0, 0, 1), width: 12, height: 24, floorY: Y0 },
    flyThrough: [V(gx, 64, L), V(gx, 42, L * 0.7), V(gx, 24, L * 0.44), V(gx, py + 2, 230), V(gx, py, 100), V(gx, py, 0)],
    beyond: V(gx, py, -80),
    gap: { center: V(gx, Y0 + DH / 2, 0), width: GAP1, xMin: Math.min(0, sx * GAP1), xMax: Math.max(0, sx * GAP1), floorY: Y0, top: Y0 + DH },
    freeEdge: V(GAP1, Y0, LW * Math.sin(th1)),
    lightRiver: { origin: V(gx, 0, 0), direction: new THREE.Vector3(0, 0, 1), length: L, halfWidth0: GAP1 / 2, spread: 0.034 },
    lightColor: light.clone(),
    viewpoints: { far: V(gx, 14, 1250), reveal: V(-170, 60, 760), threeQuarter: V(-330, 120, 470), under: V(-45, 10, 150) },
    crown: fa.crown.clone(),
  };

  const _size = new THREE.Vector2();
  const hero = {
    object, radius: 260, height, center, anchors, uniforms: U, mirrored: mirror,
    setProgress(u) { progress = clamp(u, 0, 1); applyProgress(); },
    update(dt, time, camera) {
      U.uTime.value = time;
      inner.updateWorldMatrix(true, false);
      U.uHeroInv.value.copy(inner.matrixWorld).invert();
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) U.uViewH.value = ctx.renderer.getDrawingBufferSize(_size).y;
      setLeaf(theta + 0.0035 * Math.sin(time * 0.13) * U.uOpen.value);   // the great leaf breathes a little
    },
    dispose() {},
    ground: true, groundY: 0,
  };
  // viewer aid: opts.view = 'approach' reframes src/worlds/_part.js low on the river of light
  if (opts.view === 'approach') { hero.radius = 150; hero.height = 70; hero.center = V(gx, 60, 0); }
  hero.update(0, 0, null);
  return hero;
}
