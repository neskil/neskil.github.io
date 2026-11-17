// The Line Along the River of Stars: the hero set piece and the makers the world shares with it.
//
// The hero is the train: a small tank engine (headlamp, brass dome, coupled wheels with rods, no smoke) and four short
// four-wheeled carriages with rows of open windows. Inside each carriage a row of yellow lamps, blue velvet benches
// and walls with big brass buttons are real geometry, lit warm, so they can be looked into as the train passes.
// Every solid thing in the world (train, track, poles, station, observatory) is drawn with one lit shader: the river
// is the key light, a cool white-blue from one side, the sky a violet fill from above.
//
// Exports: buildHero (the train on a length of track with a few signposts, for the set-piece viewer and the world),
// makeG (geometry builder), litMaterial, makeSignposts (glowing surveyors' pyramids), makeCross (the cross of light
// and the cross of many colours), CROSS_GLSL (the same outline for the river's mirror image), lin / mulc / mixc.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';

export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mulc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- geometry builder: position, normal, colour + gloss, emissive, animation
// aCol = rgb albedo, a gloss. aEm = rgb emissive (linear HDR), a flag (1 = a door: scaled by uDoor). aAnim = kind, pivot y, pivot z, 1 / radius
// (kind 1 turns about the x axis through the pivot, kind 2 is carried round by a crank pin whose rest offset is the pivot, kind 3 only slides).
export function makeG() {
  const P = [], N = [], C = [], E = [], A = [];
  let col = [1, 1, 1, 0], em = [0, 0, 0, 0], an = [0, 0, 0, 0], ox = 0, oy = 0, oz = 0;
  const vert = (p, n) => { P.push(p[0] + ox, p[1] + oy, p[2] + oz); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2], col[3]); E.push(em[0], em[1], em[2], em[3]); A.push(an[0], an[1] + (an[0] === 1 ? oy : 0), an[2] + (an[0] === 1 ? oz : 0), an[3]); };
  const g = {
    get count() { return P.length / 3; },
    col(c, gloss = 0, k = 1) { col = [c[0] * k, c[1] * k, c[2] * k, gloss]; return g; },
    em(c, k = 1, flag = 0) { em = c ? [c[0] * k, c[1] * k, c[2] * k, flag] : [0, 0, 0, 0]; return g; },
    anim(kind = 0, py = 0, pz = 0, inv = 0) { an = [kind, py, pz, inv]; return g; },
    off(x = 0, y = 0, z = 0) { ox = x; oy = y; oz = z; return g; },
    tri(a, b, c, n) {
      if (!n) { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; n = [nx / l, ny / l, nz / l]; }
      vert(a, n); vert(b, n); vert(c, n); return g;
    },
    quad(a, b, c, d, n) { g.tri(a, b, c, n); g.tri(a, c, d, n); return g; },
    // smooth quad with a normal per corner
    quadN(a, b, c, d, na, nb, nc, nd) { vert(a, na); vert(b, nb); vert(c, nc); vert(a, na); vert(c, nc); vert(d, nd); return g; },
    // box by centre and size; skip: letters of faces to leave out (x X y Y z Z = -x +x -y +y -z +z)
    box(cx, cy, cz, sx, sy, sz, skip = '') {
      const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
      if (!skip.includes('X')) g.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
      if (!skip.includes('x')) g.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
      if (!skip.includes('Y')) g.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
      if (!skip.includes('y')) g.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
      if (!skip.includes('Z')) g.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
      if (!skip.includes('z')) g.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
      return g;
    },
    // frustum of revolution about an axis ('x' | 'y' | 'z') from a to b along it, radius ra to rb, centred on (u, v) in the other two axes
    cyl(axis, a, b, u, v, ra, rb, seg = 12, capA = false, capB = false) {
      const P3 = (t, cu, cv) => (axis === 'x' ? [t, cu, cv] : axis === 'y' ? [cu, t, cv] : [cu, cv, t]);   // (u, v) = (y, z) | (x, z) | (x, y)
      const sl = (ra - rb) / Math.max(Math.abs(b - a), 1e-6) * Math.sign(b - a);
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const nrm = (c, s) => { const n = P3(sl, c, s), l = Math.hypot(n[0], n[1], n[2]); return [n[0] / l, n[1] / l, n[2] / l]; };
        g.quadN(P3(a, u + c0 * ra, v + s0 * ra), P3(a, u + c1 * ra, v + s1 * ra), P3(b, u + c1 * rb, v + s1 * rb), P3(b, u + c0 * rb, v + s0 * rb), nrm(c0, s0), nrm(c1, s1), nrm(c1, s1), nrm(c0, s0));
        if (capA && ra > 0) g.tri(P3(a, u, v), P3(a, u + c1 * ra, v + s1 * ra), P3(a, u + c0 * ra, v + s0 * ra), P3(-Math.sign(b - a), 0, 0));
        if (capB && rb > 0) g.tri(P3(b, u, v), P3(b, u + c0 * rb, v + s0 * rb), P3(b, u + c1 * rb, v + s1 * rb), P3(Math.sign(b - a), 0, 0));
      }
      return g;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 4)); geo.setAttribute('aEm', new THREE.Float32BufferAttribute(E, 4)); geo.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
      geo.computeBoundingSphere();
      return geo;
    },
  };
  return g;
}

// ---------------------------------------------------------------- the lit shader every solid thing shares
// shared: { uTime, uKeyDir, uKeyCol, uSkyCol, uGndCol, uFogCol, uFogDen, uClip } as uniform objects ({ value }); makeShared() gives defaults.
export function makeShared(o = {}) {
  return {
    uTime: { value: 0 },
    uKeyDir: { value: (o.keyDir || new THREE.Vector3(-0.9, 0.3, 0.2)).clone().normalize() },
    uKeyCol: { value: new THREE.Color().setRGB(...(o.keyCol || [0.62, 0.72, 1.0])) },
    uSkyCol: { value: new THREE.Color().setRGB(...(o.skyCol || [0.2, 0.17, 0.42])) },
    uGndCol: { value: new THREE.Color().setRGB(...(o.gndCol || [0.1, 0.11, 0.2])) },
    uFogCol: { value: new THREE.Color().setRGB(...(o.fogCol || [0.05, 0.04, 0.14])) },
    uFogDen: { value: o.fogDen ?? 0.0011 },
    uClip: { value: new THREE.Vector4(0, 0, -1, 1e9) },
  };
}
const LIT_VERT = /* glsl */`
attribute vec4 aCol; attribute vec4 aEm; attribute vec4 aAnim;
uniform float uSpin;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec4 vE;
void main(){
  vec3 p = position; vec3 n = normal;
  #ifdef SPIN
  if (aAnim.x > 0.5) {
    float a = uSpin * aAnim.w, c = cos(a), s = sin(a);
    if (aAnim.x < 1.5) { vec2 q = p.yz - aAnim.yz; p.yz = aAnim.yz + vec2(c * q.x - s * q.y, s * q.x + c * q.y); n.yz = vec2(c * n.y - s * n.z, s * n.y + c * n.z); }
    else { vec2 q = aAnim.yz; vec2 d = vec2(c * q.x - s * q.y, s * q.x + c * q.y) - q; if (aAnim.x > 2.5) d.x = 0.; p.yz += d; }
  }
  #endif
  #ifdef USE_INSTANCING
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.); vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  #else
  vec4 w = modelMatrix * vec4(p, 1.); vN = normalize(mat3(modelMatrix) * n);
  #endif
  vW = w.xyz; vC = aCol; vE = aEm;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const LIT_FRAG = /* glsl */`
uniform vec3 uKeyDir, uKeyCol, uSkyCol, uGndCol, uFogCol; uniform float uFogDen, uDoor, uLamp; uniform vec4 uClip;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec4 vE;
void main(){
  if (dot(vW, uClip.xyz) > uClip.w) discard;
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  float kd = clamp(dot(n, uKeyDir) * .62 + .38, 0., 1.); kd *= kd;
  vec3 amb = mix(uGndCol, uSkyCol, n.y * .5 + .5);
  vec3 col = vC.rgb * (amb + uKeyCol * kd * 1.25);
  #ifdef WORLD_LIGHT
  col += vC.rgb * localLight(vW) * (.55 + .45 * n.y);
  #endif
  vec3 h = normalize(uKeyDir + v);
  float sp = pow(clamp(dot(n, h), 0., 1.), 48.), fr = pow(1. - clamp(dot(n, v), 0., 1.), 3.);
  col += vC.a * (uKeyCol * sp * .5 + mix(vC.rgb, vec3(1.), .3) * uSkyCol * fr * 1.4);
  col += vE.rgb * (vE.a > .5 ? uDoor : uLamp);
  float d = length(cameraPosition - vW), f = 1. - exp(-d * d * uFogDen * uFogDen);
  gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0., 1.)), 1.);
}`;
// o.light = { glsl, uniforms }: GLSL that defines vec3 localLight(vec3 worldPos), the coloured lights of the place (lamps, fire, spheres)
export function litMaterial(shared, o = {}) {
  const defines = {}; if (o.spin) defines.SPIN = 1; if (o.light) defines.WORLD_LIGHT = 1;
  const m = new THREE.ShaderMaterial({
    uniforms: { ...(o.light ? o.light.uniforms : {}), ...shared, uSpin: o.spin || { value: 0 }, uDoor: o.door || { value: 1 }, uLamp: o.lamp || { value: 1 } },
    vertexShader: LIT_VERT, fragmentShader: (o.light ? o.light.glsl : '') + LIT_FRAG, side: THREE.DoubleSide, defines,
  });
  return m;
}

// ---------------------------------------------------------------- the train: colours
const TC = {
  green: lin('#3f7260'), greenDark: lin('#274a3e'), black: lin('#23242e'), iron: lin('#3c3f4e'), brass: lin('#d8a548'), red: lin('#a8342a'),
  maroon: lin('#8e3b3a'), maroonDark: lin('#5e2528'), cream: lin('#e2d3ae'), roof: lin('#565c78'), wood: lin('#6e4b30'), seat: lin('#2c4fb8'),
  lamp: [1.0, 0.78, 0.36], warm: [1.0, 0.72, 0.34],
};

// spoked wheel on the x axis: centre (x, r, z), turning with the distance travelled
function wheel(g, x, r, z, o = {}) {
  const w = o.w ?? 0.13, x0 = x - w / 2, x1 = x + w / 2, inv = 1 / r, out = Math.sign(x) || 1;
  g.anim(1, r, z, inv);
  g.col(TC.iron, 0.6).em(null).cyl('x', x0, x1, r, z, r, r, 16);                                   // tyre
  g.col(TC.iron, 0.5).cyl('x', x0 - 0.02 * out, x0 - 0.02 * out + 0.04, r, z, r + 0.05, r + 0.05, 16);   // flange (inner side, a touch wider)
  const xf = x + out * w * 0.3, sp = o.spokes ?? 8, rc = o.col || TC.red;
  for (let i = 0; i < 16; i++) {                                                               // rim ring facing outward
    const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU, ri = r * 0.8;
    g.col(TC.black, 0.3).quad([xf, r + Math.cos(a0) * ri, z + Math.sin(a0) * ri], [xf, r + Math.cos(a1) * ri, z + Math.sin(a1) * ri], [xf, r + Math.cos(a1) * r, z + Math.sin(a1) * r], [xf, r + Math.cos(a0) * r, z + Math.sin(a0) * r], [out, 0, 0]);
  }
  for (let i = 0; i < sp; i++) {                                                               // spokes
    const a = i / sp * TAU, c = Math.cos(a), s = Math.sin(a), t = 0.045, ri = r * 0.82;
    g.col(rc, 0.35).quad([xf, r - s * t, z + c * t], [xf, r + s * t, z - c * t], [xf, r + c * ri + s * t * 0.6, z + s * ri - c * t * 0.6], [xf, r + c * ri - s * t * 0.6, z + s * ri + c * t * 0.6], [out, 0, 0]);
  }
  g.col(TC.brass, 1).cyl('x', xf - 0.02 * out, xf + 0.07 * out, r, z, r * 0.2, r * 0.16, 8, false, true);    // hub
  if (o.weight) {                                                                              // balance weight: makes the turning plain to see
    for (let i = 0; i < 4; i++) { const a0 = 2.2 + i * 0.4, a1 = a0 + 0.4, ri = r * 0.45, ro = r * 0.8, xx = xf + 0.01 * out;
      g.col(TC.iron, 0.4).quad([xx, r + Math.cos(a0) * ri, z + Math.sin(a0) * ri], [xx, r + Math.cos(a1) * ri, z + Math.sin(a1) * ri], [xx, r + Math.cos(a1) * ro, z + Math.sin(a1) * ro], [xx, r + Math.cos(a0) * ro, z + Math.sin(a0) * ro], [out, 0, 0]); }
  }
  g.anim(0);
}

// warm lamp light on an inside surface, written as emissive so that the inside of a carriage glows whatever the night does outside
const lamplit = (c, k = 1) => [c[0] * k * 1.25, c[1] * k * 1.0, c[2] * k * 0.72];

// ---------------------------------------------------------------- a carriage: origin on the rail top at its centre, length along z
export const CAR = { L: 10.4, pitch: 11.2, hw: 1.3, sill: 1.95, head: 2.95, eave: 3.2 };
function carriageGeometry() {
  const g = makeG(), L = CAR.L, hl = L / 2, hw = CAR.hw, yF = 0.95, yS = CAR.sill, yT = CAR.head, yE = CAR.eave, xi = hw - 0.07;
  // running gear
  g.col(TC.black, 0.2).box(0, 0.79, 0, 2.2, 0.32, L - 0.3);
  for (const z of [-3.0, 3.0]) {
    for (const sx of [-1, 1]) { wheel(g, sx * 0.72, 0.48, z, { spokes: 8, col: TC.maroon }); g.col(TC.black, 0.3).box(sx * 0.99, 0.6, z, 0.14, 0.44, 0.62).box(sx * 0.99, 0.84, z, 0.1, 0.06, 1.7); }
    g.col(TC.iron, 0.4).cyl('x', -0.72, 0.72, 0.48, z, 0.06, 0.06, 6);
  }
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) { g.col(TC.iron, 0.6).cyl('z', sz * hl, sz * (hl + 0.32), sx * 0.82, 1.02, 0.07, 0.07, 6); g.cyl('z', sz * (hl + 0.32), sz * (hl + 0.38), sx * 0.82, 1.02, 0.17, 0.17, 10, true, true); }
    g.col(TC.black, 0.3).box(0, 0.98, sz * (hl + 0.2), 0.12, 0.12, 0.5);
  }
  for (const sx of [-1, 1]) g.col(TC.wood, 0.1).box(sx * 1.47, 0.66, 0, 0.3, 0.05, L - 1.2);
  // side walls: a rectangle of wall has an outside face and a lamplit inside face
  const wallIn = lamplit(TC.cream, 0.95);
  const rect = (sx, z0, z1, y0, y1, c, gloss = 0.25, door = false) => {
    g.col(c, gloss).em(door ? mulc(TC.warm, 3.4) : null, 1, door ? 1 : 0).quad([sx * hw, y0, z0], [sx * hw, y0, z1], [sx * hw, y1, z1], [sx * hw, y1, z0], [sx, 0, 0]);
    g.col(mulc(TC.cream, 0.5), 0).em(door ? mulc(TC.wood, 1.3) : wallIn).quad([sx * xi, y0, z0], [sx * xi, y0, z1], [sx * xi, y1, z1], [sx * xi, y1, z0], [-sx, 0, 0]);
  };
  const reveal = (sx, z0, z1, y0, y1) => {                      // the thickness of the wall round an opening
    g.col(TC.wood, 0.2).em(lamplit(TC.wood, 0.7));
    g.quad([sx * hw, y0, z0], [sx * xi, y0, z0], [sx * xi, y0, z1], [sx * hw, y0, z1], [0, 1, 0]).quad([sx * hw, y1, z0], [sx * xi, y1, z0], [sx * xi, y1, z1], [sx * hw, y1, z1], [0, -1, 0]);
    g.quad([sx * hw, y0, z0], [sx * xi, y0, z0], [sx * xi, y1, z0], [sx * hw, y1, z0], [0, 0, 1]).quad([sx * hw, y0, z1], [sx * xi, y0, z1], [sx * xi, y1, z1], [sx * hw, y1, z1], [0, 0, -1]);
  };
  const button = (sx, y, z, r = 0.075) => {                     // a big brass button on the inside wall
    g.col(TC.brass, 1).em(mulc(TC.brass, 1.9));
    for (let i = 0; i < 6; i++) { const a0 = i / 6 * TAU, a1 = (i + 1) / 6 * TAU, x = sx * (xi - 0.03);
      g.tri([x - sx * 0.02, y, z], [x, y + Math.cos(a0) * r, z + Math.sin(a0) * r], [x, y + Math.cos(a1) * r, z + Math.sin(a1) * r], [-sx, 0, 0]); }
  };
  const wins = []; for (let i = 0; i < 6; i++) wins.push(-3.0 + i * 1.2);
  for (const sx of [-1, 1]) {
    rect(sx, -3.85, 3.85, yF, yS, TC.maroon, 0.45); rect(sx, -hl, hl, yT, yE, TC.maroonDark, 0.3);
    rect(sx, -3.85, -3.475, yS, yT, TC.maroonDark); rect(sx, 3.475, 3.85, yS, yT, TC.maroonDark);
    for (let i = 0; i < 5; i++) { const z0 = wins[i] + 0.475, z1 = wins[i + 1] - 0.475; rect(sx, z0, z1, yS, yT, TC.maroonDark); for (const y of [2.18, 2.46, 2.74]) button(sx, y, (z0 + z1) / 2); }
    for (const zc of wins) { reveal(sx, zc - 0.475, zc + 0.475, yS, yT); for (const dz of [-0.3, 0, 0.3]) button(sx, 1.72, zc + dz, 0.06); }
    for (const sz of [-1, 1]) {
      const za = sz * 3.85, zb = sz * 4.75, z0 = Math.min(za, zb), z1 = Math.max(za, zb), zc = sz * 4.3;
      rect(sx, z0, z1, yF, 2.1, TC.wood, 0.4, true); rect(sx, z0, zc - 0.25, 2.1, 2.85, TC.wood, 0.4, true); rect(sx, zc + 0.25, z1, 2.1, 2.85, TC.wood, 0.4, true); rect(sx, z0, z1, 2.85, yT, TC.wood, 0.4, true);
      rect(sx, Math.min(zb, sz * hl), Math.max(zb, sz * hl), yF, yT, TC.maroon, 0.45);
      for (const z of [z0 - 0.06, z1 + 0.06]) g.col(TC.brass, 1).em(null).box(sx * (hw + 0.05), 2.15, z, 0.035, 1.1, 0.035);
    }
    g.col(TC.brass, 1).em(null).box(sx * (hw + 0.015), yS - 0.02, 0, 0.03, 0.06, L).col(TC.cream, 0.3).box(sx * (hw + 0.012), yT + 0.03, 0, 0.025, 0.05, L);
    // coachwork: a lined panel under every window, a frame round every window, a batten at every pillar, boxes under the floor
    const xo = sx * (hw + 0.008), gold = mulc(TC.brass, 0.22);
    const line = (z0, z1, y0, y1, c, gl, em) => g.col(c, gl).em(em).quad([xo, y0, z0], [xo, y0, z1], [xo, y1, z1], [xo, y1, z0], [sx, 0, 0]);
    for (const zc of wins) {
      const a = zc - 0.5, b = zc + 0.5, y0 = yF + 0.12, y1 = yS - 0.18;
      line(a, b, y0, y0 + 0.022, TC.brass, 1, gold); line(a, b, y1 - 0.022, y1, TC.brass, 1, gold); line(a, a + 0.022, y0, y1, TC.brass, 1, gold); line(b - 0.022, b, y0, y1, TC.brass, 1, gold);
      line(zc - 0.52, zc - 0.475, yS, yT, TC.cream, 0.4, null); line(zc + 0.475, zc + 0.52, yS, yT, TC.cream, 0.4, null); line(zc - 0.52, zc + 0.52, yT, yT + 0.045, TC.cream, 0.4, null); line(zc - 0.52, zc + 0.52, yS - 0.012, yS + 0.032, TC.cream, 0.4, null);
    }
    for (let i = 0; i <= 6; i++) g.col(TC.maroonDark, 0.5).em(null).box(sx * (hw + 0.012), (yF + yS) / 2, -3.6 + i * 1.2, 0.024, yS - yF, 0.07);
    g.col(TC.black, 0.3).em(null).box(sx * 0.9, 0.54, 0, 0.46, 0.34, 1.7).col(TC.iron, 0.5).box(sx * 1.05, 0.72, 0, 0.03, 0.03, 4.6);
  }
  // ends, floor, ceiling
  for (const sz of [-1, 1]) {
    g.col(TC.maroonDark, 0.3).em(null).quad([-hw, yF, sz * hl], [hw, yF, sz * hl], [hw, yE, sz * hl], [-hw, yE, sz * hl], [0, 0, sz]);
    g.col(mulc(TC.cream, 0.5), 0).em(wallIn).quad([-xi, yF, sz * (hl - 0.07)], [xi, yF, sz * (hl - 0.07)], [xi, yE, sz * (hl - 0.07)], [-xi, yE, sz * (hl - 0.07)], [0, 0, -sz]);
    g.col(TC.wood, 0.3).em(lamplit(TC.wood, 0.8)).box(0, 1.95, sz * (hl - 0.09), 0.8, 1.9, 0.03);
    g.col(TC.black, 0.2).em(mulc(TC.warm, 1.5)).quad([-0.26, 2.1, sz * (hl + 0.012)], [0.26, 2.1, sz * (hl + 0.012)], [0.26, 2.8, sz * (hl + 0.012)], [-0.26, 2.8, sz * (hl + 0.012)], [0, 0, sz]);
    g.col(TC.wood, 0.3).em(null).box(0, 2.45, sz * (hl + 0.02), 0.62, 0.8, 0.02, 'zZ');
  }
  g.col(mulc(TC.wood, 0.5), 0).em(lamplit(TC.wood, 0.55)).quad([-xi, yF + 0.01, -hl], [xi, yF + 0.01, -hl], [xi, yF + 0.01, hl], [-xi, yF + 0.01, hl], [0, 1, 0]);
  g.col(mulc(TC.cream, 0.5), 0).em(lamplit(TC.cream, 1.1)).quad([-xi, yE - 0.02, -hl], [xi, yE - 0.02, -hl], [xi, yE - 0.02, hl], [-xi, yE - 0.02, hl], [0, -1, 0]);
  // blue velvet benches back to back at every pillar, an aisle down the middle
  const seatLit = lamplit(TC.seat, 1.15), seatTop = lamplit(TC.seat, 1.5);
  for (let i = 0; i <= 6; i++) {
    const zc = -3.6 + i * 1.2;
    for (const sx of [-1, 1]) {
      const xc = sx * 0.8;
      g.col(mulc(TC.seat, 0.4), 0.1).em(seatLit).box(xc, 1.72, zc, 0.84, 1.5, 0.13, 'y');
      g.col(mulc(TC.seat, 0.4), 0.1).em(seatTop).box(xc, 2.49, zc, 0.86, 0.06, 0.17, 'y');
      for (const dz of [-1, 1]) { if ((i === 0 && dz < 0) || (i === 6 && dz > 0)) continue; g.col(mulc(TC.seat, 0.4), 0.1).em(seatTop).box(xc, 1.4, zc + dz * 0.3, 0.84, 0.12, 0.46, 'y'); }
      for (const bx of [-0.2, 0.2]) for (const by of [1.85, 2.2]) for (const dz of [-1, 1]) {
        g.col(TC.brass, 1).em(mulc(TC.brass, 1.6)).quad([xc + bx - 0.04, by - 0.04, zc + dz * 0.07], [xc + bx + 0.04, by - 0.04, zc + dz * 0.07], [xc + bx + 0.04, by + 0.04, zc + dz * 0.07], [xc + bx - 0.04, by + 0.04, zc + dz * 0.07], [0, 0, dz]);
      }
    }
  }
  // the row of yellow lamps
  for (let i = 0; i < 7; i++) {
    const z = -3.6 + i * 1.2;
    g.col(TC.brass, 1).em(mulc(TC.brass, 1.2)).cyl('y', yE - 0.02, yE - 0.1, 0, z, 0.1, 0.035, 8);
    g.col(TC.lamp, 0).em(mulc(TC.lamp, 5.2)).cyl('y', yE - 0.1, yE - 0.2, 0, z, 0.05, 0.125, 8).cyl('y', yE - 0.2, yE - 0.31, 0, z, 0.125, 0.03, 8, false, true);
  }
  // roof: an arc with torpedo ventilators
  g.em(null);
  const NR = 10, rw = hw + 0.12, prof = (j) => { const x = -rw + j * (2 * rw / NR); return [x, yE + 0.5 * Math.pow(Math.max(Math.cos(Math.PI / 2 * x / rw), 0), 0.72)]; };
  const pn = (j) => { const a = prof(Math.max(j - 0.5, 0)), b = prof(Math.min(j + 0.5, NR)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l, 0]; };
  for (let j = 0; j < NR; j++) {
    const a = prof(j), b = prof(j + 1), z0 = -hl - 0.14, z1 = hl + 0.14;
    g.col(TC.roof, 0.55).quadN([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1], pn(j), pn(j + 1), pn(j + 1), pn(j));
    for (const sz of [-1, 1]) g.col(TC.maroonDark, 0.2).tri([0, yE, sz * hl], [a[0], a[1], sz * hl], [b[0], b[1], sz * hl], [0, 0, sz]);
  }
  for (const z of [-3.0, 0, 3.0]) g.col(TC.iron, 0.6).cyl('y', yE + 0.46, yE + 0.6, 0, z, 0.1, 0.1, 6).cyl('y', yE + 0.6, yE + 0.68, 0, z, 0.19, 0.1, 8, true, true);
  return g.build();
}

// ---------------------------------------------------------------- the engine: a plain tank engine, front toward +z, no smoke
export const LOCO = { L: 8.6, lamp: [0, 3.02, 4.42], axles: [-1.6, 0.2, 2.0] };
function locoGeometry() {
  const g = makeG(), R = 0.62, yB = 2.05, rB = 0.78;
  g.col(TC.black, 0.25).box(0, 0.86, 0, 2.0, 0.4, 8.3);
  for (const sz of [-1, 1]) {
    g.col(TC.red, 0.4).box(0, 0.98, sz * 4.24, 2.6, 0.46, 0.14);
    for (const sx of [-1, 1]) { g.col(TC.iron, 0.6).cyl('z', sz * 4.3, sz * 4.62, sx * 0.82, 1.02, 0.07, 0.07, 6).cyl('z', sz * 4.62, sz * 4.68, sx * 0.82, 1.02, 0.17, 0.17, 10, true, true); }
  }
  // wheels, coupling rods and crossheads
  for (const sx of [-1, 1]) {
    for (const z of LOCO.axles) wheel(g, sx * 0.72, R, z, { spokes: 10, col: TC.red, weight: true, w: 0.15 });
    const pin = [-0.27, 0], xr = sx * 0.95;                              // crank pin rest offset (y, z) from each axle centre
    g.anim(2, pin[0], pin[1], 1 / R).col(TC.iron, 1).em([0.1, 0.12, 0.18]);
    g.box(xr, R + pin[0], 0.2, 0.06, 0.13, 3.9);
    for (const z of LOCO.axles) g.col(TC.brass, 1).cyl('x', xr - 0.07 * sx, xr + 0.07 * sx, R + pin[0], z, 0.09, 0.09, 8, true, true);
    g.anim(3, pin[0], pin[1], 1 / R).col(TC.iron, 1).box(sx * 1.0, 0.74, 2.62, 0.1, 0.2, 0.3).cyl('z', 2.6, 3.4, sx * 1.0, 0.74, 0.035, 0.035, 6);
    g.anim(0).em(null).col(TC.black, 0.5).cyl('z', 2.95, 3.75, sx * 1.0, 0.74, 0.3, 0.3, 12, true, true);
    g.col(TC.brass, 1).cyl('z', 3.75, 3.8, sx * 1.0, 0.74, 0.31, 0.2, 12, false, true);
    g.col(TC.black, 0.2).box(sx * 1.0, 1.14, 0.2, 0.36, 0.05, 6.4);        // running plate
  }
  for (const z of LOCO.axles) g.col(TC.iron, 0.4).cyl('x', -0.72, 0.72, R, z, 0.07, 0.07, 6);
  // boiler, smokebox, chimney, dome
  g.col(TC.green, 0.65).cyl('z', -0.9, 3.25, 0, yB, rB, rB, 20);
  for (const z of [-0.2, 0.9, 2.0, 3.1]) g.col(TC.brass, 1).cyl('z', z, z + 0.07, 0, yB, rB + 0.012, rB + 0.012, 20);
  g.col(TC.black, 0.5).cyl('z', 3.25, 4.02, 0, yB, rB + 0.07, rB + 0.07, 20, false, true);
  g.col(TC.brass, 1).cyl('z', 4.02, 4.06, 0, yB, 0.56, 0.5, 16, false, true).col(TC.iron, 0.8).box(0, yB, 4.09, 0.05, 0.5, 0.04);
  g.col(TC.black, 0.5).cyl('y', yB + 0.7, yB + 1.5, 0, 3.62, 0.25, 0.2, 12).cyl('y', yB + 1.5, yB + 1.62, 0, 3.62, 0.2, 0.3, 12);
  g.col(TC.brass, 1).cyl('y', yB + 1.62, yB + 1.68, 0, 3.62, 0.3, 0.27, 12, false, true).col(TC.black, 0).cyl('y', yB + 1.685, yB + 1.69, 0, 3.62, 0.2, 0.2, 10, false, true);
  g.col(TC.brass, 1).cyl('y', yB + 0.7, yB + 1.12, 0, 1.25, 0.36, 0.34, 14).cyl('y', yB + 1.12, yB + 1.3, 0, 1.25, 0.34, 0.12, 14, false, true);
  g.col(TC.brass, 1).cyl('y', yB + 0.74, yB + 1.05, 0, -0.35, 0.09, 0.07, 8, false, true);
  for (const sx of [-1, 1]) g.col(TC.brass, 1).cyl('z', -0.9, 3.9, sx * 0.86, 2.55, 0.022, 0.022, 5);
  // side tanks, cab, bunker
  for (const sx of [-1, 1]) {
    g.col(TC.green, 0.6).box(sx * 0.93, 1.76, 0.85, 0.66, 1.2, 3.5);
    const x = sx * 1.265;
    for (const [y, z, sy, sz] of [[1.3, 0.85, 0.03, 3.2], [2.22, 0.85, 0.03, 3.2], [1.76, -0.75, 0.95, 0.03], [1.76, 2.45, 0.95, 0.03]]) g.col(TC.brass, 1).box(x, y, z, 0.012, sy, sz);
    // rows of rivets round the tank
    const rivet = (y, z) => { const r = 0.024, xr = sx * 1.268; g.col(TC.brass, 1).em(mulc(TC.brass, 0.3)).quad([xr, y - r, z], [xr, y, z + r], [xr, y + r, z], [xr, y, z - r], [sx, 0, 0]); };
    for (let k = 0; k <= 16; k++) { rivet(1.22, -0.83 + k * 0.21); rivet(2.3, -0.83 + k * 0.21); }
    for (let k = 1; k < 6; k++) { rivet(1.22 + k * 0.18, -0.83); rivet(1.22 + k * 0.18, 2.53); }
    g.em(null);
    // cab side with a window
    const cx = sx * 1.25, wall = (z0, z1, y0, y1) => {
      g.col(TC.green, 0.6).em(null).quad([cx, y0, z0], [cx, y0, z1], [cx, y1, z1], [cx, y1, z0], [sx, 0, 0]);
      g.col(mulc(TC.cream, 0.4), 0).em([0.9, 0.42, 0.16]).quad([cx - sx * 0.05, y0, z0], [cx - sx * 0.05, y0, z1], [cx - sx * 0.05, y1, z1], [cx - sx * 0.05, y1, z0], [-sx, 0, 0]);
    };
    wall(-2.7, -0.9, 1.16, 2.1); wall(-2.7, -2.35, 2.1, 2.85); wall(-1.3, -0.9, 2.1, 2.85); wall(-2.7, -0.9, 2.85, 3.08);
    g.col(TC.brass, 1).em(null).box(cx + sx * 0.02, 2.1, -1.825, 0.03, 0.05, 1.1).box(sx * 1.29, 1.9, -2.72, 0.035, 1.3, 0.035);
    g.col(TC.green, 0.6).box(sx * 0.93, 1.72, -3.4, 0.66, 1.12, 1.45);
  }
  g.col(TC.green, 0.6).em(null).box(0, 1.72, -3.4, 1.2, 1.12, 1.45, 'xX').col(TC.black, 0).box(0, 2.32, -3.4, 2.3, 0.1, 1.3);
  // spectacle plate with two round windows, the back of the cab, the glow of the fire inside
  g.col(TC.green, 0.6).em(null).quad([-1.25, 2.35, -0.9], [1.25, 2.35, -0.9], [1.25, 3.08, -0.9], [-1.25, 3.08, -0.9], [0, 0, 1]);
  for (const sx of [-1, 1]) g.col(TC.brass, 1).cyl('z', -0.9, -0.87, sx * 0.72, 2.72, 0.24, 0.24, 12).col(TC.black, 0).em([1.5, 0.75, 0.3]).cyl('z', -0.875, -0.87, sx * 0.72, 2.72, 0.2, 0.2, 12, false, true).em(null);
  g.col(mulc(TC.cream, 0.4), 0).em([1.0, 0.45, 0.16]).quad([-1.2, 1.16, -0.95], [1.2, 1.16, -0.95], [1.2, 3.08, -0.95], [-1.2, 3.08, -0.95], [0, 0, -1]);
  g.col(TC.black, 0).em([2.6, 0.9, 0.2]).box(0, 1.55, -1.0, 0.5, 0.36, 0.06).em([0.5, 0.22, 0.08]).col(mulc(TC.wood, 0.5), 0).quad([-1.2, 1.17, -2.7], [1.2, 1.17, -2.7], [1.2, 1.17, -0.95], [-1.2, 1.17, -0.95], [0, 1, 0]);
  g.col(TC.green, 0.6).em(null).quad([-1.25, 1.16, -2.7], [1.25, 1.16, -2.7], [1.25, 2.1, -2.7], [-1.25, 2.1, -2.7], [0, 0, -1]);
  const NR = 8, rw = 1.42, prof = (j) => { const x = -rw + j * (2 * rw / NR); return [x, 3.08 + 0.3 * Math.pow(Math.max(Math.cos(Math.PI / 2 * x / rw), 0), 0.8)]; };
  for (let j = 0; j < NR; j++) { const a = prof(j), b = prof(j + 1); g.col(TC.black, 0.5).quad([a[0], a[1], -2.95], [b[0], b[1], -2.95], [b[0], b[1], -0.7], [a[0], a[1], -0.7]); }
  // the headlamp: a brass drum on the smokebox front with a burning lens
  g.col(TC.brass, 1).em(null).cyl('z', 4.06, 4.4, 0, 3.02, 0.21, 0.24, 12, true).box(0, 2.84, 4.2, 0.1, 0.2, 0.1);
  g.col(TC.lamp, 0).em([7, 6.2, 4.4]).cyl('z', 4.4, 4.42, 0, 3.02, 0.2, 0.2, 12, false, true);
  return g.build();
}

// ---------------------------------------------------------------- track: ballast bed, sleepers and two rails along frame(s) -> { x, y, z, tx, tz }
// (y = rail top, t = unit tangent in the xz plane). o: { s0, s1, bed: depth of the ballast bed below the rail top, or 0 for a bare deck }
export function trackGeometry(frame, o) {
  const g = makeG(), s0 = o.s0, s1 = o.s1, bed = o.bed ?? 1.1, gauge = 0.72, stepR = o.step ?? 3;
  const at = (f, lat, dy) => [f.x - f.tz * lat, f.y + dy, f.z + f.tx * lat];
  let prev = frame(s0);
  for (let s = s0; s < s1 - 1e-3; s += stepR) {
    const f = frame(Math.min(s + stepR, s1));
    if (bed > 0) {
      const sec = [[-3.3, -bed], [-1.75, -0.24], [1.75, -0.24], [3.3, -bed]];
      for (let k = 0; k < 3; k++) g.col(o.ballast || [0.2, 0.2, 0.3], 0.15).em(null).quad(at(prev, sec[k][0], sec[k][1]), at(prev, sec[k + 1][0], sec[k + 1][1]), at(f, sec[k + 1][0], sec[k + 1][1]), at(f, sec[k][0], sec[k][1]));
    }
    for (const sx of [-1, 1]) {
      const xi = sx * (gauge - 0.035), xo = sx * (gauge + 0.035);
      g.col([0.42, 0.46, 0.6], 1).em(o.railGlow || [0.16, 0.2, 0.34]).quad(at(prev, xi, 0), at(prev, xo, 0), at(f, xo, 0), at(f, xi, 0), [0, 1, 0]);
      g.col([0.16, 0.15, 0.2], 0.4).em(null).quad(at(prev, xi, 0), at(f, xi, 0), at(f, xi, -0.14), at(prev, xi, -0.14)).quad(at(prev, xo, 0), at(f, xo, 0), at(f, xo, -0.14), at(prev, xo, -0.14));
    }
    prev = f;
  }
  for (let s = s0 + 0.36; s < s1; s += 0.72) {                    // sleepers
    const f = frame(s), a = 1.25, b = 0.12, y0 = -0.24, y1 = -0.13;
    const c = (lat, al, y) => [f.x - f.tz * lat + f.tx * al, f.y + y, f.z + f.tx * lat + f.tz * al];
    g.col(o.sleeper || [0.2, 0.14, 0.12], 0.1).em(null).quad(c(-a, -b, y1), c(a, -b, y1), c(a, b, y1), c(-a, b, y1), [0, 1, 0]);
    g.quad(c(-a, -b, y0), c(a, -b, y0), c(a, -b, y1), c(-a, -b, y1)).quad(c(-a, b, y0), c(a, b, y0), c(a, b, y1), c(-a, b, y1));
  }
  return g.build();
}

// ---------------------------------------------------------------- the train: engine + four carriages, lamps, headlamp beam, star dust
// place(frame, sFront, dist): frame(s) -> { x, y, z, tx, tz } is the track; every vehicle is set on it by its two axle points.
export function buildTrain(ctx, shared, o = {}) {
  const spin = { value: 0 }, door = { value: 0 }, lamp = { value: 1 }, speed = { value: 0 };
  const mat = litMaterial(shared, { spin, door, lamp, light: o.light });
  const root = new THREE.Group();
  const locoG = o.locoG || locoGeometry(), carG = o.carG || carriageGeometry(), nCars = o.cars ?? 4;
  const vehicles = [], LL = LOCO.L + 0.76, CL = CAR.L + 0.76;
  const loco = new THREE.Mesh(locoG, mat); loco.frustumCulled = false; root.add(loco); vehicles.push({ mesh: loco, off: LL / 2, wb: 1.8 });
  for (let i = 0; i < nCars; i++) { const m = new THREE.Mesh(carG, mat); m.frustumCulled = false; root.add(m); vehicles.push({ mesh: m, off: LL + 0.04 + CL / 2 + i * CAR.pitch, wb: 3.0 }); }
  const length = LL + 0.04 + nCars * CAR.pitch;
  // headlamp beam: a soft cone of light ahead of the engine
  const beamGeo = new THREE.CylinderGeometry(0.25, 5.5, 46, 20, 1, true); beamGeo.translate(0, -23, 0); beamGeo.rotateX(-Math.PI / 2);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color().setRGB(1.0, 0.86, 0.6) }, uAmt: { value: 0.16 }, uClip: shared.uClip },
    vertexShader: /* glsl */`varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uAmt; uniform vec4 uClip; varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ if (dot(vW, uClip.xyz) > uClip.w) discard; float t = clamp(vP.z / 46., 0., 1.); float ndv = abs(dot(normalize(vN), normalize(vV)));
        float a = ndv * ndv * (1. - t) * (1. - t) * smoothstep(0., .04, t) * uAmt; gl_FragColor = vec4(uCol * a, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.set(LOCO.lamp[0], LOCO.lamp[1], LOCO.lamp[2]); beam.rotation.x = 0.045; beam.frustumCulled = false; beam.renderOrder = 3; loco.add(beam);
  // lamps: 0 headlamp, 1-2 tail lamps (red), 3 the guard's lamp swinging on the last carriage, then one soft pool per carriage side
  const nG = 4 + nCars * 2, gCols = [[1.0, 0.9, 0.66], [1.0, 0.16, 0.1], [1.0, 0.16, 0.1], [1.0, 0.8, 0.42]], gSizes = [3.4, 1.0, 1.0, 1.5];
  for (let i = 0; i < nCars * 2; i++) { gCols.push([0.4, 0.27, 0.12]); gSizes.push(5.5); }
  const glows = fx.makeGlows({ time: shared.uTime, positions: new Float32Array(nG * 3), colors: gCols, sizes: gSizes, size: 1, intensity: 1.5, flicker: 0.06, renderOrder: 4 });
  glows.object.frustumCulled = false; root.add(glows.object);
  // the guard's lamp itself: a little brass lantern on a bracket
  const lg = makeG(); lg.col(TC.brass, 1).cyl('y', -0.08, -0.5, 0, 0, 0.012, 0.012, 4).cyl('y', -0.5, -0.56, 0, 0, 0.03, 0.09, 8).cyl('y', -0.78, -0.84, 0, 0, 0.09, 0.05, 8, false, true);
  lg.col(TC.lamp, 0).em([5, 3.8, 1.8]).cyl('y', -0.56, -0.78, 0, 0, 0.08, 0.08, 8);
  const lantern = new THREE.Mesh(lg.build(), mat); lantern.frustumCulled = false; root.add(lantern);
  // star dust drifting from the wheels
  const ND = Math.round(520 * (o.detail ?? 1)), dr = o.rng || ctx.rng.fork('dust');
  const dp = new Float32Array(ND * 12), ds = new Float32Array(ND * 16), dc = new Float32Array(ND * 8), di = [];
  const axles = [];
  for (const v of vehicles) for (const z of (v.wb < 2 ? LOCO.axles : [-3.0, 3.0])) axles.push(-v.off + z);
  for (let i = 0; i < ND; i++) {
    const z = dr.pick(axles) + dr.range(-0.4, 0.4), sd = [dr(), dr(), dr(), dr()];
    for (let k = 0; k < 4; k++) { dp.set([dr.chance(0.5) ? 0.74 : -0.74, 0.1, z], (i * 4 + k) * 3); ds.set(sd, (i * 4 + k) * 4); dc.set([k % 2 ? 1 : -1, k < 2 ? -1 : 1], (i * 4 + k) * 2); }
    di.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(ds, 4)); dustGeo.setAttribute('aCorner', new THREE.BufferAttribute(dc, 2)); dustGeo.setIndex(di);
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uSpeed: speed, uClip: shared.uClip },
    vertexShader: /* glsl */`attribute vec4 aSeed; attribute vec2 aCorner; uniform float uTime, uSpeed; varying vec2 vUv; varying float vA; varying vec3 vCol; varying vec3 vW;
      void main(){
        float life = fract(uTime * (.22 + .3 * aSeed.y) + aSeed.x), sp = clamp(abs(uSpeed), 0., 40.);
        vec3 p = position;
        p.x += (aSeed.w - .5) * (.3 + 1.6 * life) * sign(p.x) + (aSeed.w - .5) * .4;
        p.y += life * (.25 + 1.5 * aSeed.z) + .25 * sin(life * 9. + aSeed.x * 40.) * life;
        p.z -= life * (1.2 + sp * .5) * (.5 + aSeed.z);
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
        vec4 mv = viewMatrix * w;
        float size = (.035 + .075 * aSeed.z) * (1. + life) + max(-mv.z, 0.) * .0012;
        mv.xy += aCorner * size;
        float tw = .55 + .45 * sin(uTime * (5. + 9. * aSeed.w) + aSeed.x * 60.);
        vA = (1. - life) * (1. - life) * smoothstep(0., .06, life) * tw * (.25 + .75 * clamp(sp / 9., 0., 1.));
        vCol = mix(vec3(.75, .86, 1.), vec3(1., .82, .5), step(.6, aSeed.y));
        vUv = aCorner; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform vec4 uClip; varying vec2 vUv; varying float vA; varying vec3 vCol; varying vec3 vW;
      void main(){ if (dot(vW, uClip.xyz) > uClip.w) discard; float r = clamp(length(vUv), 0., 1.); float c = (1. - r); c = c * c * (1. + 5. * c * c);
        float star = clamp(1. - 14. * min(abs(vUv.x), abs(vUv.y)), 0., 1.) * (1. - r); gl_FragColor = vec4(vCol * (c + star * 1.5) * vA * 2.2, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Mesh(dustGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 3; root.add(dust);

  const _v = new THREE.Vector3(), ls = o.lampSide ?? 1;                // which side of the last carriage the guard's lamp hangs on (the river's)
  const train = {
    object: root, vehicles, length, spin, door, lamp, speed, material: mat, glows, beam, dust, front: new THREE.Vector3(), tail: new THREE.Vector3(), mid: new THREE.Vector3(),
    // head and tail of the lit windows in world space (for the light the train throws on the grass)
    place(frame, sFront, dist) {
      spin.value = dist ?? sFront;
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i], fa = frame(sFront - v.off + v.wb), fb = frame(sFront - v.off - v.wb);
        const dx = fa.x - fb.x, dz = fa.z - fb.z, dy = fa.y - fb.y, l = Math.hypot(dx, dz) || 1;
        v.mesh.position.set((fa.x + fb.x) / 2, (fa.y + fb.y) / 2, (fa.z + fb.z) / 2);
        v.mesh.rotation.set(-Math.atan2(dy, l), Math.atan2(dx, dz), 0, 'YXZ');
        v.mesh.updateMatrixWorld(true);
      }
      const f0 = frame(sFront); train.front.set(f0.x, f0.y, f0.z); dust.position.copy(train.front); dust.rotation.y = Math.atan2(f0.tx, f0.tz);
      const f1 = frame(sFront - length); train.tail.set(f1.x, f1.y, f1.z);
      const f2 = frame(sFront - length / 2); train.mid.set(f2.x, f2.y, f2.z);
    },
    update(dt, time, camera) {
      const lv = vehicles[0].mesh, tv = vehicles[vehicles.length - 1].mesh, cl = shared.uClip.value;
      const put = (i) => { if (_v.x * cl.x + _v.y * cl.y + _v.z * cl.z > cl.w - 0.6) _v.y = -1e4; glows.setPosition(i, _v.x, _v.y, _v.z); };      // a lamp that has gone through the portal is gone
      _v.set(LOCO.lamp[0], LOCO.lamp[1], LOCO.lamp[2] + 0.1).applyMatrix4(lv.matrixWorld); put(0);
      for (const sx of [-1, 1]) { _v.set(sx * 0.95, 1.5, -CAR.L / 2 - 0.1).applyMatrix4(tv.matrixWorld); put(sx < 0 ? 1 : 2); }
      const sw = 0.42 * Math.sin(time * 2.3) + 0.08 * Math.sin(time * 5.1);
      lantern.position.set(ls * 1.05, 3.02, -CAR.L / 2 - 0.22).applyMatrix4(tv.matrixWorld); lantern.rotation.set(0, tv.rotation.y, sw);
      _v.set(ls * 1.05 + Math.sin(sw) * 0.67, 3.02 - Math.cos(sw) * 0.67, -CAR.L / 2 - 0.22).applyMatrix4(tv.matrixWorld); put(3);
      for (let i = 1; i < vehicles.length; i++) for (const sx of [-1, 1]) {
        _v.set(sx * 1.5, 2.4, 0).applyMatrix4(vehicles[i].mesh.matrixWorld); put(4 + (i - 1) * 2 + (sx < 0 ? 0 : 1));
      }
      glows.update(dt, time, camera);
    },
  };
  return train;
}

// ---------------------------------------------------------------- signposts: glowing surveyors' pyramids, some with a little lightning inside
// items: [{ x, y, z, size, color: [r,g,b] linear, yaw, seed }]. Three draws: the pyramids, their halos, their pools of light on the ground.
export function makeSignposts(shared, items, o = {}) {
  const n = items.length, P = [], U = [], T = [], idx = [];
  const B = [0, 1, 2].map((i) => [Math.sin(i / 3 * TAU) * 0.5, 0, Math.cos(i / 3 * TAU) * 0.5]), apex = [0, 0.86, 0];
  const edge = (a, b, w) => {                                    // two crossed ribbons: a tube of light from any side
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]), t = [d[0] / l, d[1] / l, d[2] / l];
    let u = [t[1], -t[0], 0]; if (Math.hypot(u[0], u[1]) < 0.2) u = [0, t[2], -t[1]]; const ul = Math.hypot(u[0], u[1], u[2]); u = u.map((x) => x / ul);
    const v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]];
    for (const q of [u, v]) {
      const base = P.length / 3;
      for (const [e, sgn] of [[a, -1], [a, 1], [b, -1], [b, 1]]) { P.push(e[0] + q[0] * w * sgn, e[1] + q[1] * w * sgn, e[2] + q[2] * w * sgn); U.push(sgn, e === a ? 0 : 1); T.push(0); }
      idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    }
  };
  for (let i = 0; i < 3; i++) { edge(B[i], apex, 0.05); edge(B[i], B[(i + 1) % 3], 0.04); }
  for (let i = 0; i < 3; i++) {                                    // faces: a faint film that carries the lightning
    const base = P.length / 3, a = B[i], b = B[(i + 1) % 3];
    P.push(...a, ...b, ...apex); U.push(-1, 0, 1, 0, 0, 1); T.push(1, 1, 1); idx.push(base, base + 1, base + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('aType', new THREE.Float32BufferAttribute(T, 1)); geo.setIndex(idx);
  const tint = new Float32Array(n * 4);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uFogCol: shared.uFogCol, uFogDen: shared.uFogDen, uGain: { value: o.gain ?? 1 } },
    vertexShader: /* glsl */`attribute vec2 aUv; attribute float aType; attribute vec4 aTint; varying vec2 vUv; varying float vType; varying vec4 vTint; varying float vFog;
      uniform float uFogDen;
      void main(){ vUv = aUv; vType = aType; vTint = aTint; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
        float d = length(cameraPosition - w.xyz); vFog = exp(-d * d * uFogDen * uFogDen * .35);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uTime, uGain; varying vec2 vUv; varying float vType; varying vec4 vTint; varying float vFog;
      float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
      float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h11(i), h11(i + 1.), f); }
      void main(){
        float ph = vTint.a, pulse = .78 + .22 * sin(uTime * (1.1 + ph * 1.7) + ph * 50.);
        vec3 col;
        if (vType < .5) { float x = clamp(abs(vUv.x), 0., 1.); col = vTint.rgb * (.55 * (1. - x) * (1. - x) + 2.6 * exp(-x * x * 40.)) * pulse + vec3(1.) * exp(-x * x * 160.) * .9; }
        else {
          float hgt = clamp(vUv.y, 0., 1.), tt = uTime * 2.2 + ph * 31., cell = floor(tt), f = fract(tt);
          float on = step(.66, h11(cell * 7.13 + ph * 91.)) * step(.35, ph) * smoothstep(0., .22, f) * (1. - smoothstep(.45, 1., f));
          float bx = (n1(hgt * 9. + cell * 13.7 + ph * 5.) - .5) * 1.1 * (1. - hgt) + (n1(hgt * 31. + cell * 3.1) - .5) * .25 * (1. - hgt);
          float dd = abs(vUv.x - bx), bolt = exp(-dd * dd * 700.) + .35 * exp(-dd * dd * 40.);
          col = vTint.rgb * (.11 * (1. - hgt * .7) * pulse) + mix(vTint.rgb, vec3(1.), .6) * bolt * on * 2.6 * step(hgt, .97);
        }
        gl_FragColor = vec4(col * vFog * uGain, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(n, 1)); mesh.count = n; mesh.frustumCulled = false; mesh.renderOrder = 2;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const gp = [], gc = [], gs = [], pp = new Float32Array(Math.max(n, 1) * 16);
  for (let i = 0; i < n; i++) {
    const it = items[i];
    m4.compose(v.set(it.x, it.y, it.z), q.setFromEuler(e.set(0, it.yaw || 0, 0)), sc.set(it.size, it.size, it.size)); mesh.setMatrixAt(i, m4);
    tint.set([it.color[0], it.color[1], it.color[2], it.seed ?? 0.5], i * 4);
    gp.push([it.x, it.y + it.size * 0.42, it.z]); gc.push(mulc(it.color, 0.5)); gs.push(it.size * 1.5);
    m4.compose(v.set(it.x, it.y + 0.12, it.z), q.identity(), sc.set(it.size * 3.4, 1, it.size * 3.4)); m4.toArray(pp, i * 16);
  }
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 4));
  const group = new THREE.Group(); group.add(mesh);
  const halos = fx.makeGlows({ time: shared.uTime, positions: gp.length ? gp : [[0, -999, 0]], colors: gc.length ? gc : null, sizes: gs.length ? gs : null, size: 1, intensity: 0.9, flicker: 0.12, core: 0.25, renderOrder: 3, fogAmount: 0.5 });
  group.add(halos.object);
  // pools: flat discs of the post's colour on the ground
  const pg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  pg.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 4));
  const pm = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uFogDen: shared.uFogDen },
    vertexShader: /* glsl */`attribute vec4 aTint; varying vec2 vUv; varying vec4 vTint; varying float vFog; uniform float uFogDen;
      void main(){ vUv = uv * 2. - 1.; vTint = aTint; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); float d = length(cameraPosition - w.xyz); vFog = exp(-d * d * uFogDen * uFogDen);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uTime; varying vec2 vUv; varying vec4 vTint; varying float vFog;
      void main(){ float r = clamp(length(vUv), 0., 1.), a = (1. - r); a = a * a * a; float pulse = .8 + .2 * sin(uTime * (1.1 + vTint.a * 1.7) + vTint.a * 50.);
        gl_FragColor = vec4(vTint.rgb * a * .34 * pulse * vFog, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const pools = new THREE.InstancedMesh(pg, pm, Math.max(n, 1)); pools.count = n; pools.instanceMatrix.array.set(pp); pools.frustumCulled = false; pools.renderOrder = 1; group.add(pools);
  return { object: group, mesh, halos, pools, count: n, update(dt, time, camera) { halos.update(dt, time, camera); } };
}

// ---------------------------------------------------------------- the crosses
// Outline shared with the river's mirror image: p = (across, up) / height, origin at the foot. x = body, y = ring.
export const CROSS_GLSL = /* glsl */`
vec2 crossShape(vec2 p){
  float shaft = step(abs(p.x), .055) * step(0., p.y) * step(p.y, 1.);
  float arms = step(abs(p.x), .28) * step(abs(p.y - .68), .055);
  float r = length(p - vec2(0., .68));
  float ring = exp(-(r - .34) * (r - .34) * 900.) + .22 * exp(-r * r * 9.);
  return vec2(max(shaft, arms), ring);
}`;
// kind 'white': cast from frozen cloud, a ring of gold light behind it. kind 'jewel': set with lights of every colour, a pale ring of cloud round it.
export function makeCross(shared, o = {}) {
  const H = o.height ?? 46, jewel = o.kind === 'jewel', g = makeG();
  const w = 0.11 * H, dpt = 0.075 * H;
  g.box(0, H * 0.5, 0, w, H, dpt).box(0, H * 0.68, 0, 0.56 * H, w, dpt * 0.98);
  for (let i = 0; i < 3; i++) g.box(0, -0.02 * H * (i + 0.5) + 0.0, 0, w * (1.6 + i * 0.7), 0.02 * H, dpt * (1.6 + i * 0.9));   // steps (they sink into the island)
  if (jewel) g.box(0, 0.036 * H, 0, w * 1.6, 0.028 * H, dpt * 1.9).box(0, 0.011 * H, 0, w * 2.3, 0.022 * H, dpt * 2.8);       // the jewelled one stands in the water on a spreading foot
  const geo = g.build();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uFogCol: shared.uFogCol, uFogDen: shared.uFogDen, uH: { value: H }, uKind: { value: jewel ? 1 : 0 }, uGain: { value: o.gain ?? 1 } },
    vertexShader: /* glsl */`varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: fx.GLSL_NOISE + /* glsl */`
      uniform float uTime, uH, uKind, uFogDen, uGain; uniform vec3 uFogCol; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
        float ndv = clamp(abs(dot(n, v)), 0., 1.), fr = pow(1. - ndv, 2.);
        vec3 q = vP / uH; vec3 col;
        vec3 an = abs(normalize(cross(dFdx(vP), dFdy(vP)) + 1e-6));
        vec2 uv = an.z > .6 ? q.xy : (an.x > .6 ? q.zy : q.xz);
        if (uKind < .5) {
          float c = fbm(vec3(q.xy * 8. + vec2(uTime * .012, -uTime * .02), q.z * 8. + uTime * .01));
          float veins = fbm(vec3(q.yx * 23., uTime * .03));
          float cl = smoothstep(.28, .72, c * .72 + veins * .28);
          col = mix(vec3(.4, .5, .88), vec3(.92, .96, 1.), cl) * (.7 + .3 * ndv) + vec3(.8, .9, 1.) * (.14 * veins + .45 * fr);
          col *= .8 + .2 * smoothstep(0., .25, q.y);
        } else {
          vec2 cuv = uv * 30., id = floor(cuv), f = fract(cuv) - .5;
          float hsh = hash12(id + 3.7), h2 = hash12(id * 1.7 + 11.3);
          float tw = .55 + .45 * sin(uTime * (1. + 3. * h2) + hsh * 40.);
          vec3 lc = hsh < .3 ? vec3(.2, .5, 1.) : hsh < .58 ? vec3(1., .55, .14) : hsh < .7 ? vec3(.35, 1., .5) : hsh < .82 ? vec3(1., .3, .6) : hsh < .92 ? vec3(1., .9, .4) : vec3(.9, .95, 1.);
          float r = length(f), dot_ = (1. - smoothstep(.16, .34, r)) * step(.22, h2);
          col = vec3(.035, .05, .16) * (1. + 2.5 * fr) + lc * dot_ * (1.1 + 2.2 * tw) + lc * .1 * exp(-r * r * 5.) * step(.22, h2);
        }
        float d = length(cameraPosition - vW), fg = 1. - exp(-d * d * uFogDen * uFogDen * .4);
        gl_FragColor = vec4(mix(col * uGain, uFogCol, clamp(fg, 0., 1.)), 1.);
      }`,
  });
  const cross = new THREE.Mesh(geo, mat);
  const group = new THREE.Group(); group.add(cross);
  // the ring: gold light standing behind the white cross (the jewelled one's halo of cloud is made by the world, in depth)
  const ringMat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uKind: { value: jewel ? 1 : 0 }, uFogDen: shared.uFogDen, uGain: { value: o.ringGain ?? 1 } },
    vertexShader: /* glsl */`varying vec2 vUv; varying float vFog; uniform float uFogDen;
      void main(){ vUv = uv * 2. - 1.; vec4 w = modelMatrix * vec4(position, 1.); float d = length(cameraPosition - w.xyz); vFog = exp(-d * d * uFogDen * uFogDen * .3); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: fx.GLSL_NOISE + /* glsl */`
      uniform float uTime, uKind, uGain; varying vec2 vUv; varying float vFog;
      void main(){
        float r = length(vUv), a = atan(vUv.y, vUv.x + 1e-5); vec3 col;
        if (uKind < .5) {
          float band = exp(-(r - .58) * (r - .58) * 260.), soft = exp(-(r - .58) * (r - .58) * 22.);
          float rays = .5 + .5 * sin(a * 36. + uTime * .25) * sin(a * 14. - uTime * .17);
          float spokes = pow(clamp(.5 + .5 * sin(a * 12. + uTime * .11), 0., 1.), 6.) * exp(-r * r * 2.2) * smoothstep(.1, .45, r);
          col = vec3(1., .84, .46) * (band * 1.25 + soft * (.1 + .17 * rays) + spokes * .14) + vec3(1., .93, .75) * exp(-r * r * 5.) * .05;
          col *= 1. - smoothstep(.9, 1., r);
        } else {
          vec2 p = vec2(cos(a + uTime * .03), sin(a + uTime * .03)) * r;
          float c = fbm(p * 5.5 + 3.) * .65 + fbm(p * 13.) * .35;
          float band = smoothstep(.42, .62, r) * (1. - smoothstep(.72, .98, r));
          col = vec3(.72, .78, 1.) * band * smoothstep(.3, .72, c) * .55;
        }
        gl_FragColor = vec4(col * vFog * uGain, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const rings = [];
  if (!jewel) { const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.2 * H, 1.2 * H), ringMat); ring.position.set(0, 0.68 * H, -0.06 * H); ring.renderOrder = 1; group.add(ring); rings.push(ring); }
  return { object: group, cross, rings, height: H, material: mat, ringMaterial: ringMat, update() {} };
}

// ---------------------------------------------------------------- the hero: the train. opts.world: the world lays its own track and places the train itself
export async function buildHero(ctx, opts = {}) {
  const shared = opts.shared || makeShared();
  const detail = ctx.quality?.detail ?? 1;
  const locoG = locoGeometry();
  await ctx.yield();
  const carG = carriageGeometry();
  await ctx.yield();
  const train = buildTrain(ctx, shared, { detail, cars: opts.cars, locoG, carG, lampSide: opts.lampSide, light: opts.light, rng: opts.rng });
  await ctx.yield();
  const group = new THREE.Group(); group.add(train.object);
  let frame = null, posts = null;
  if (!opts.world) {                                                   // the set-piece viewer: a length of straight track with signposts beside it
    const half = train.length / 2;
    frame = (s) => ({ x: 0, y: 1.0, z: s - half, tx: 0, tz: 1 });
    const track = new THREE.Mesh(trackGeometry(frame, { s0: -30, s1: train.length + 30, bed: 1.0 }), litMaterial(shared)); group.add(track);
    const r = ctx.rng.fork('posts'), cols = ['#7fe7ff', '#ffb057', '#9dff9a'].map(lin), items = [];
    for (let i = 0; i < 7; i++) items.push({ x: (i % 2 ? 1 : -1) * r.range(7, 16), y: 0, z: -30 + i * 10 + r.range(-3, 3), size: r.range(2.2, 4.6), color: cols[i % 3], yaw: r.range(0, 6), seed: r() });
    posts = makeSignposts(shared, items); group.add(posts.object);
    train.place(frame, train.length, 0);
  }
  return {
    object: group, radius: 17, height: 7, center: new THREE.Vector3(0, 3, 0), train, shared, anchors: {}, ground: true, groundY: 0,
    update(dt, time, camera) {
      if (frame) { shared.uTime.value = time; train.speed.value = 7; train.place(frame, train.length, time * 7); posts.update(dt, time, camera); }
      train.update(dt, time, camera);
    },
    dispose() {},
  };
}
