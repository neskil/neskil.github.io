// The Isle of Broken Towers: the hero set piece and the made things of the world.
//   buildHero        the old dragon coiled round the tallest broken tower (it uncoils, rears, opens its wings, follows us with
//                    its head, breathes fire and smoke), with the ruined town's lesser towers round it
//   makeYoungDragons the young dragons: thin-bodied, wide-winged like vast bats, flapping and gliding, a burst of fire
//   buildBoat        the small clinker boat with the patched sail and the eyes painted on her prow, and her wake
//   makeLandMaterial the stone / turf / terrace / masonry shader the islands and the ruins share (lit by uniforms the world owns)
// The dragons are animals of grey-black stone and fire: no horns, no jewels. No lettering anywhere.
import * as THREE from 'three';
import { GLSL_NOISE, makeSmokeColumn } from '../kit/fx.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const col3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// the light every shader of this world reads: the world blends its skies into these each frame
export function makeLightUniforms() {
  return {
    uSunDir: { value: new THREE.Vector3(0.3, 0.5, -0.8).normalize() }, uSunCol: { value: new THREE.Color(2.6, 2.2, 1.7) },
    uSkyCol: { value: new THREE.Color(0.55, 0.65, 0.85) }, uGndCol: { value: new THREE.Color(0.32, 0.3, 0.26) },
    uTime: { value: 0 }, uCloud: { value: 0.5 },
    uFire: { value: new THREE.Vector4(0, -500, 0, 0) }, uFireCol: { value: new THREE.Color('#ff8a2a') },
  };
}

// a small accumulator of triangles with colour and a material mix (rock, terrace, masonry)
export function makeAcc() {
  const pos = [], colr = [], mat = [], idx = [];
  return {
    pos, idx,
    v(x, y, z, c, m0 = 0, m1 = 0, m2 = 0) { pos.push(x, y, z); colr.push(c[0], c[1], c[2]); mat.push(m0, m1, m2); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    count() { return pos.length / 3; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 3));
      g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      return g;
    },
    // the same for a large land, in steps with a breath between them: its corners, its faces, its normals, its bounds
    async buildBy(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 3));
      await ctx.yield();
      g.setIndex(idx);
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      g.computeBoundingSphere();
      return g;
    },
  };
}

const LAND_VERT = /* glsl */`
attribute vec3 aMat;
varying vec3 vW, vN, vC, vM;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix*vec4(position,1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vC = color; vM = aMat;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LAND_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFireCol; uniform vec4 uFire; uniform float uTime, uCloud;
varying vec3 vW, vN, vC, vM;
${GLSL_NOISE}
#include <fog_pars_fragment>
void main(){
  vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
  vec3 m = clamp(vM, 0., 1.);
  float steep = 1.-smoothstep(.45,.8,abs(n.y));
  vec2 pf = vW.xz;
  float big = fbmLo(pf*.021), mid = vnoise(pf*.19), fine = vnoise(pf*1.7+vW.y*1.3);
  vec3 alb = vC*(.74+.56*big)*(.8+.4*mid)*(.86+.28*fine);
  // wind in the grass: gusts crossing open ground, on the clock
  alb *= mix(1., .84+.32*vnoise(pf*.085+vec2(uTime*.6, uTime*.34)), (1.-m.x)*(1.-m.z)*(1.-steep));
  // rock: beds that lie level, bent by noise, with dark joints
  float dip = vW.y+.11*pf.x-.07*pf.y+big*9.+mid*1.6;
  float bed = vnoise(vec2(dip*.36, 3.7)), bed2 = vnoise(vec2(dip*1.5+mid*2., 9.1));
  float joint = smoothstep(.36,.5,abs(vnoise(vec2(pf.x+pf.y, vW.y*.12)*.3)-.5));
  float crack = smoothstep(.3,.5,abs(vnoise(vec2(pf.x-pf.y, vW.y*.05)*.11)-.5));
  vec3 rock = vC*(.76+.3*bed)*(.9+.2*bed2)*(.72+.28*joint)*(.8+.2*crack)*(.92+.16*fine);
  // green hangs over the cliff's brow and in its ledges
  rock = mix(rock, vec3(.2,.3,.12)*(.8+.4*mid), smoothstep(.55,.8,vnoise(pf*.11+vW.y*.21))*smoothstep(.3,.62,abs(n.y))*.4);
  alb = mix(alb, rock, m.x*max(steep,.35));
  // terraces: level strips, each field its own tint, a dark riser between
  float ty = vW.y/3.2+mid*.12, tf = fract(ty), tid = floor(ty);
  float fh = hash12(vec2(tid, floor(big*5.)));
  vec3 field = mix(vec3(.30,.42,.16), mix(vec3(.62,.52,.24), vec3(.42,.5,.2), step(.5,fh)), step(.33,fh));
  field *= .85+.3*vnoise(vec2(pf.x-pf.y, pf.x+pf.y)*.9);
  alb = mix(alb, mix(field, vC*.45, smoothstep(.8,.9,tf)), m.y*(1.-steep));
  // masonry: courses and running joints, every block its own grey
  // (a third mix over 1.5 is the small stone of huts and field walls: courses a foot high, stones two feet long, laid dry)
  float sm = step(1.5, vM.z);
  float cy = vW.y/mix(1.15,.33,sm), row = floor(cy);
  float run = (abs(n.x)>abs(n.z) ? vW.z : vW.x)/mix(2.3,.64,sm)+mix(.5*mod(row,2.), hash12(vec2(row, 7.))*3., sm);
  float blk = hash12(vec2(floor(run), row));
  float mortar = max(smoothstep(mix(.86,.72,sm),.96,fract(cy)), smoothstep(mix(.9,.8,sm),.98,fract(run)));
  vec3 stone = vC*(mix(.86,.7,sm)+mix(.22,.5,sm)*blk)*(.9+.2*fine)*(1.-mix(.4,.62,sm)*mortar);
  stone *= .8+.3*vnoise(vec2(run*.2, cy*.13));
  alb = mix(alb, stone, m.z);
  // wet foot at the waterline
  alb *= mix(.55, 1., smoothstep(.1, 1.8, vW.y+mid*.6));
  float cs = smoothstep(.42,.68, fbmLo(pf*.0031+vec2(uTime*.012, uTime*.005)));
  float ndl = max(dot(n,uSunDir),0.);
  vec3 lit = uSunCol*ndl*(1.-uCloud*.6*cs)+mix(uGndCol, uSkyCol, n.y*.5+.5)*1.45;
  vec3 fl = uFire.xyz-vW; float fd2 = dot(fl,fl);
  lit += uFireCol*(uFire.w*900./(900.+fd2))*(.25+.75*max(dot(n, fl/sqrt(max(fd2,1.))),0.));
  gl_FragColor = vec4(alb*lit, 1.);
  #include <fog_fragment>
}`;

// the land shader. U: the light uniforms (makeLightUniforms); two = true draws both faces (ruins with breaches)
export function makeLandMaterial(U, two = false) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, vertexColors: true, fog: true, side: two ? THREE.DoubleSide : THREE.FrontSide,
  });
}

// ---------------------------------------------------------------- broken towers and walls
// A round tower into the accumulator: tapering, leaning, its top ragged (tops[j] = share of the height left standing in
// column j), its wall breached (holes: ellipses in angle and height). Both faces are drawn, so a breach shows the dark inside.
export function towerInto(A, o) {
  const { x, z, base, h, r0, r1, lean, leanA, seg, tops, holes, c } = o, rows = Math.max(4, Math.round(h / 2.6));
  const lx = Math.cos(leanA) * lean, lz = Math.sin(leanA) * lean, id = [];
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j < seg; j++) {
      const top = h * tops[j], y = Math.min(h * i / rows, top), t = y / h, a = j / seg * TAU;
      const r = lerp(r0, r1, t) * (1 + 0.16 * Math.exp(-y / 3.5)), k = 0.86 + 0.14 * ((i * 7 + j * 13) % 5) / 4;
      id.push(A.v(x + lx * y + Math.cos(a) * r, base + y, z + lz * y + Math.sin(a) * r, [c[0] * k, c[1] * k, c[2] * k], 0, 0, 1));
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < seg; j++) {
      const j2 = (j + 1) % seg, y0 = h * i / rows, ym = h * (i + 0.5) / rows;
      if (y0 >= h * Math.min(tops[j], tops[j2]) - 0.01) continue;
      let cut = false;
      for (const q of holes) { let da = Math.abs((j + 0.5) / seg * TAU - q.a); da = Math.min(da, TAU - da); if ((da / q.wa) ** 2 + ((ym - q.y) / q.wy) ** 2 < 1) cut = true; }
      if (cut) continue;
      A.quad(id[i * seg + j], id[(i + 1) * seg + j], id[(i + 1) * seg + j2], id[i * seg + j2]);
    }
  }
}
// what a tower is: every number drawn before any test of its place
export function drawTower(rng, h) {
  const seg = rng.pick([10, 12, 14, 16]), r0 = h * rng.range(0.13, 0.2) + 1.2, tops = [], holes = [];
  const gap = rng.range(0, TAU), deep = rng.range(0.25, 0.6), wide = rng.range(0.7, 1.9);
  for (let j = 0; j < seg; j++) {
    let da = Math.abs(j / seg * TAU - gap); da = Math.min(da, TAU - da);
    tops.push(clamp(1 - deep * Math.exp(-((da / wide) ** 2)) - 0.1 * rng(), 0.3, 1));
  }
  for (let n = rng.int(1, 3); n > 0; n--) holes.push({ a: rng.range(0, TAU), y: h * rng.range(0.25, 0.75), wa: rng.range(0.25, 0.5), wy: h * rng.range(0.06, 0.13) });
  return { h, r0, r1: r0 * rng.range(0.72, 0.9), lean: rng.range(0, 0.11) * (rng.chance(0.4) ? 1 : 0.35), leanA: rng.range(0, TAU), seg, tops, holes };
}
// a ragged wall of standing pieces between two points (some fallen: gaps), on the ground the caller gives
export function wallInto(A, rng, x0, z0, x1, z1, groundAt, hMax, c) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(len / 2.6)), dx = (x1 - x0) / len, dz = (z1 - z0) / len, th = 0.9;
  const nx = -dz * th, nz = dx * th;
  let hPrev = hMax * rng.range(0.4, 1);
  for (let k = 0; k < n; k++) {
    const hk = clamp(hPrev + hMax * rng.range(-0.35, 0.35), 0, hMax), fallen = rng.chance(0.16); hPrev = hk < 0.6 ? hMax * rng.range(0.5, 1) : hk;
    if (fallen || hk < 0.8) continue;
    const a = k / n * len, b = (k + 1) / n * len, ax = x0 + dx * a, az = z0 + dz * a, bx = x0 + dx * b, bz = z0 + dz * b;
    const g = Math.min(groundAt(ax, az), groundAt(bx, bz)) - 0.6, t = g + 0.6 + hk, kk = 0.85 + 0.3 * rng(), cc = [c[0] * kk, c[1] * kk, c[2] * kk];
    const P = [[ax - nx, az - nz], [bx - nx, bz - nz], [bx + nx, bz + nz], [ax + nx, az + nz]];
    for (let f = 0; f < 4; f++) {
      const p = P[f], q = P[(f + 1) % 4];
      A.quad(A.v(p[0], g, p[1], cc, 0, 0, 1), A.v(p[0], t, p[1], cc, 0, 0, 1), A.v(q[0], t, q[1], cc, 0, 0, 1), A.v(q[0], g, q[1], cc, 0, 0, 1));
    }
    A.quad(A.v(P[0][0], t, P[0][1], cc, 0, 0, 1), A.v(P[3][0], t, P[3][1], cc, 0, 0, 1), A.v(P[2][0], t, P[2][1], cc, 0, 0, 1), A.v(P[1][0], t, P[1][1], cc, 0, 0, 1));
  }
}

// ---------------------------------------------------------------- small standing things of the sea and the pasture
// a box into the accumulator: middle (x, y, z), half measures (hx, hy, hz), turned by yaw, leaning by tilt about its own
// long (x) axis; m = [rock, terrace, masonry] of the land shader
export function boxInto(A, x, y, z, hx, hy, hz, yaw, tilt, c, m = [0, 0, 0]) {
  const ca = Math.cos(yaw), sa = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt), id = [];
  for (let k = 0; k < 8; k++) {
    const lx = (k & 1 ? 1 : -1) * hx, ly0 = (k & 2 ? 1 : -1) * hy, lz0 = (k & 4 ? 1 : -1) * hz, ly = ly0 * ct - lz0 * st, lz = ly0 * st + lz0 * ct;
    id.push([x + lx * ca + lz * sa, y + ly, z - lx * sa + lz * ca]);
  }
  for (const f of [[0, 2, 3, 1], [4, 5, 7, 6], [0, 4, 6, 2], [1, 3, 7, 5], [2, 6, 7, 3], [0, 1, 5, 4]]) {
    const v = f.map((i) => A.v(id[i][0], id[i][1], id[i][2], c, m[0], m[1], m[2]));
    A.quad(v[0], v[1], v[2], v[3]);
  }
}
// a rock: a lumpy dome standing from 1.2 m under its foot. o: { x, y (its foot), z, r, h, lump: [radial factors, one a side],
// turn, c, soft (true: a clump of heather, not stone) }. Every number is the caller's (drawn before any test of its place).
export function rockInto(A, o) {
  const { x, y, z, r, h, lump, turn, c } = o, seg = lump.length, rows = 3, id = [], mr = o.soft ? 0 : 1;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, rr = i === 0 ? r * 1.12 : r * Math.cos(t * 1.35), yy = i === 0 ? y - 1.2 : y + h * Math.sin(t * 1.5);
    for (let j = 0; j < seg; j++) {
      const a = j / seg * TAU + turn + i * 0.3, k = 0.75 + 0.5 * lump[(j + 2 * i) % seg], q = 0.78 + 0.44 * lump[(j * 3 + i) % seg];
      id.push(A.v(x + Math.cos(a) * rr * k, yy - (i === rows ? 0.25 * h * lump[j] : 0), z + Math.sin(a) * rr * k, [c[0] * q, c[1] * q, c[2] * q], mr, 0, 0));
    }
  }
  const top = A.v(x, y + h * 1.02, z, c, mr, 0, 0);
  for (let i = 0; i < rows; i++) for (let j = 0; j < seg; j++) A.quad(id[i * seg + j], id[(i + 1) * seg + j], id[(i + 1) * seg + (j + 1) % seg], id[i * seg + (j + 1) % seg]);
  for (let j = 0; j < seg; j++) A.tri(id[rows * seg + j], top, id[rows * seg + (j + 1) % seg]);
}
// a dry stone wall along a chain of places: pts = [[x, z, ground], ...] about 1.6 m apart; it follows the ground, h high
// (each place's own share of h in vary), th thick, footed 0.45 m under the ground at every place
export function dryWallInto(A, pts, h, th, c, vary) {
  const n = pts.length, id = [], S = 2;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * th / 2, nz = dx / l * th / 2, p = pts[i];
    const top = p[2] + h * (vary ? vary[i % vary.length] : 1), ft = p[2] - 0.45, cc = [c[0] * 1.08, c[1] * 1.08, c[2] * 1.08];
    id.push([A.v(p[0] + nx * 1.3, ft, p[1] + nz * 1.3, c, 0, 0, S), A.v(p[0] + nx, top, p[1] + nz, c, 0, 0, S), A.v(p[0] + nx, top, p[1] + nz, cc, 0, 0, S), A.v(p[0] - nx, top, p[1] - nz, cc, 0, 0, S),
      A.v(p[0] - nx, top, p[1] - nz, c, 0, 0, S), A.v(p[0] - nx * 1.3, ft, p[1] - nz * 1.3, c, 0, 0, S)]);
  }
  for (let i = 0; i < n - 1; i++) { const a = id[i], b = id[i + 1]; A.quad(a[0], a[1], b[1], b[0]); A.quad(a[2], a[3], b[3], b[2]); A.quad(a[4], a[5], b[5], b[4]); }
  for (const e of [id[0], id[n - 1]]) { const p = e.map((k) => [A.pos[k * 3], A.pos[k * 3 + 1], A.pos[k * 3 + 2]]), v = [p[0], p[5], p[4], p[1]].map((q) => A.v(q[0], q[1], q[2], c, 0, 0, S)); A.quad(v[0], v[1], v[2], v[3]); }
}
// a tuft of rough grass: blades standing out of one root, each a thin triangle. lean = [[angle, reach, height] of each blade]
export function tuftInto(A, x, y, z, lean, c) {
  const dk = [c[0] * 0.55, c[1] * 0.6, c[2] * 0.55];
  for (const [a, r, h] of lean) {
    const ca = Math.cos(a), sa = Math.sin(a), bx = x + ca * r * 0.25, bz = z + sa * r * 0.25;
    A.tri(A.v(bx - sa * 0.16 * r - ca * 0.05, y - 0.1, bz + ca * 0.16 * r, dk, 0, 0, 0), A.v(bx + sa * 0.16 * r, y - 0.1, bz - ca * 0.16 * r, dk, 0, 0, 0), A.v(x + ca * r, y + h, z + sa * r, c, 0, 0, 0));
  }
}
// A GOATHERD'S HUT: low walls of small stones laid dry, each corner footed on the ground under it (feet[k], the world's
// reading, half a metre under that ground); the floor is the highest corner's ground, so no corner is buried and the low
// side shows its footing. A thick roof of turf or thatch with eaves and verges, a smoke hole in a stone collar on the
// ridge, a door (dark frame, a plank leaf ajar, a stone lintel, a step down to the ground) and a small window beside it.
// o: { x, z, yaw, w, d, hw (wall), hr (roof's rise), floor, feet[4] in the order (-X,+Z) (+X,+Z) (+X,-Z) (-X,-Z), gDoor (the
// ground before the door), wallC, roofC, face (+1 or -1: the door's side along the hut's depth), doorX, holeX, lit }
export function hutInto(A, o) {
  const { x, z, yaw, w, d, hw, hr, floor: y, feet, wallC, roofC, face, doorX, holeX, lit } = o, ca = Math.cos(yaw), sa = Math.sin(yaw), X = w / 2, Z = d / 2;
  const P = (lx, wy, lz, c, m = 0) => A.v(x + lx * ca + lz * sa, wy, z - lx * sa + lz * ca, c, 0, 0, m), W2 = (lx, lz) => [x + lx * ca + lz * sa, z - lx * sa + lz * ca];
  const C = [[-X, Z], [X, Z], [X, -Z], [-X, -Z]], top = y + hw, dark = [wallC[0] * 0.13, wallC[1] * 0.12, wallC[2] * 0.11];
  for (let k = 0; k < 4; k++) { const a = C[k], b = C[(k + 1) % 4]; A.quad(P(a[0], feet[k], a[1], wallC, 2), P(a[0], top, a[1], wallC, 2), P(b[0], top, b[1], wallC, 2), P(b[0], feet[(k + 1) % 4], b[1], wallC, 2)); }
  for (const sx of [-1, 1]) A.tri(P(sx * X, top, sx * Z, wallC, 2), P(sx * X, top + hr, 0, wallC, 2), P(sx * X, top, -sx * Z, wallC, 2));
  // the roof: two slabs 0.28 m thick, 0.55 m over the long walls and 0.4 m over the gables
  const e = 0.55, g = X + 0.4, t = 0.28, ye = top - e * hr / Z, edge = [roofC[0] * 0.5, roofC[1] * 0.5, roofC[2] * 0.5];
  for (const sz of [-1, 1]) {
    const ze = sz * (Z + e);
    A.quad(P(-sz * g, ye + t, ze, roofC), P(-sz * g, top + hr + t, 0, roofC), P(sz * g, top + hr + t, 0, roofC), P(sz * g, ye + t, ze, roofC));
    A.quad(P(-sz * g, ye, ze, edge), P(-sz * g, ye + t, ze, edge), P(sz * g, ye + t, ze, edge), P(sz * g, ye, ze, edge));
    for (const sx of [-1, 1]) A.quad(P(sx * g, ye, ze, edge), P(sx * g, ye + t, ze, edge), P(sx * g, top + hr + t, 0, edge), P(sx * g, top + hr, 0, edge));
  }
  // the smoke hole: a low collar of stones on the ridge, black within
  { const [hx, hz] = W2(holeX, 0), k = [0.03, 0.03, 0.035]; boxInto(A, hx, top + hr + t + 0.02, hz, 0.46, 0.26, 0.46, yaw, 0, wallC, [0, 0, 2]);
    A.quad(P(holeX - 0.3, top + hr + t + 0.29, 0.3, k), P(holeX + 0.3, top + hr + t + 0.29, 0.3, k), P(holeX + 0.3, top + hr + t + 0.29, -0.3, k), P(holeX - 0.3, top + hr + t + 0.29, -0.3, k)); }
  // the door and the window, a hand's breadth out from the wall; the lintel; the step
  const fz = face * (Z + 0.04), fq = (x0, x1, yb, yt, c, out = 0) => { const zz = fz + face * out; A.quad(P(x0, yb, zz, c), P(x0, yt, zz, c), P(x1, yt, zz, c), P(x1, yb, zz, c)); };
  fq(doorX - 0.6, doorX + 0.6, y, y + 1.8, dark); fq(doorX - 0.52, doorX + 0.3, y + 0.03, y + 1.72, [0.3, 0.2, 0.12], 0.03);
  { const [lx, lz] = W2(doorX, face * (Z + 0.05)); boxInto(A, lx, y + 1.93, lz, 0.9, 0.14, 0.17, yaw, 0, [wallC[0] * 1.15, wallC[1] * 1.15, wallC[2] * 1.12]);
    const hy = Math.max(0.12, (y - o.gDoor + 0.35) / 2), [sx, sz] = W2(doorX, face * (Z + 0.5)); boxInto(A, sx, y - hy, sz, 0.85, hy, 0.5, yaw, 0, [wallC[0] * 1.05, wallC[1] * 1.05, wallC[2] * 1.05], [0, 0, 2]); }
  const wx = doorX > 0 ? doorX - X * 0.55 : doorX + X * 0.55;
  fq(wx - 0.3, wx + 0.3, y + 0.95, y + 1.45, lit ? [9, 5.2, 1.8] : dark);
}
// a sea bird at rest: a white body a hand long for each unit of s, grey back, its head up; standing at (x, y, z), facing yaw
export function birdInto(A, x, y, z, yaw, s, dark = false) {
  const ca = Math.cos(yaw), sa = Math.sin(yaw), W = dark ? [0.2, 0.2, 0.22] : [1.15, 1.15, 1.1], G = dark ? [0.12, 0.12, 0.14] : [0.5, 0.53, 0.58], K = [0.16, 0.15, 0.15];
  const P = (lx, ly, lz, c) => A.v(x + (lx * ca + lz * sa) * s, y + ly * s, z + (lz * ca - lx * sa) * s, c, 0, 0, 0);
  const tail = P(0, 0.24, -0.34, K), breast = P(0, 0.2, 0.2, W), back = P(0, 0.42, -0.02, G), l = P(-0.11, 0.26, 0, W), r = P(0.11, 0.26, 0, W), belly = P(0, 0.1, 0, W);
  A.tri(tail, l, back); A.tri(tail, back, r); A.tri(l, breast, back); A.tri(back, breast, r); A.tri(tail, belly, l); A.tri(tail, r, belly); A.tri(l, belly, breast); A.tri(belly, r, breast);
  const neck = P(0, 0.34, 0.16, W), head = P(0, 0.52, 0.22, W), beak = P(0, 0.48, 0.36, [1.0, 0.7, 0.15]), hl = P(-0.06, 0.46, 0.2, W), hr = P(0.06, 0.46, 0.2, W);
  A.tri(neck, hl, head); A.tri(neck, head, hr); A.tri(hl, beak, head); A.tri(head, beak, hr); A.tri(neck, hr, hl);
  // two thin legs
  for (const sx of [-0.05, 0.05]) { const a = P(sx, 0.12, 0, K), b = P(sx + 0.02, 0.12, 0, K), c = P(sx, 0, 0.01, K); A.tri(a, b, c); }
}
// a broken arch of the old town standing in the shallows: two piers, the springing of the arch on each, and its fallen
// stones lying between them. o: { x, z, base (the sand), yaw, span, h, c, lie: [[along, across, turn, tilt] of each fallen stone] }
export function archInto(A, o) {
  const { x, z, base, yaw, span, h, c, lie } = o, ca = Math.cos(yaw), sa = Math.sin(yaw), M = [0, 0, 1];
  const at = (l) => [x + l * ca, z - l * sa];
  for (const sd of [-1, 1]) {
    const [px, pz] = at(sd * span / 2);
    boxInto(A, px, base + (h + (sd > 0 ? 0.9 : 0)) / 2, pz, 1.0, (h + (sd > 0 ? 0.9 : 0)) / 2, 1.1, yaw, 0, c, M);
    // the springing: three stones leaning in over the gap, each higher and further in
    for (let k = 0; k < (sd > 0 ? 4 : 2); k++) {
      const t = (k + 0.5) / 5 * Math.PI / 2, rr = span / 2, [qx, qz] = at(sd * rr * Math.cos(t) * 0.98);
      boxInto(A, qx, base + h + rr * Math.sin(t) * 0.8, qz, 0.52, 0.42, 0.95, yaw + (sd > 0 ? 0 : Math.PI), 0, [c[0] * (0.85 + 0.1 * k), c[1] * (0.85 + 0.1 * k), c[2] * (0.85 + 0.1 * k)], M);
    }
  }
  for (const q of lie) { const [fx, fz] = at(q[0]); boxInto(A, fx - q[1] * sa, base + 0.75, fz - q[1] * ca, 0.6, 0.45, 0.9, yaw + q[2], q[3], c, M); }
}

// The ruined town round the tallest tower (which stands at the origin of `o.object`'s space). o: { rng, U, groundAt(x,z),
// clear(x,z,h) -> true where a thing h metres high may stand (the world's margin from the route; land test), count, reach,
// fixed: [[x,z,h], ...] towers at places the world names (the mole towers) }. Returns { mesh, towers: [{x,z,h,base}] }.
export function buildRuinTown(o) {
  const rng = o.rng, A = makeAcc(), stone = col3('#777b84'), towers = [], groundAt = o.groundAt || (() => 0), clear = o.clear || (() => true);
  const put = (x, z, T) => { const base = groundAt(x, z) - 1.2; towerInto(A, { ...T, x, z, base, c: stone }); towers.push({ x, z, h: T.h, r: T.r0, base }); };
  for (const f of o.fixed || []) put(f[0], f[1], drawTower(rng, f[2]));
  const want = o.count ?? 11, reach = o.reach ?? 120;
  for (let tries = 0; tries < want * 30 && towers.length < want + (o.fixed || []).length; tries++) {
    const T = drawTower(rng, rng.range(13, 34)), a = rng.range(0, TAU), d = rng.range(22, reach), x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!clear(x, z, T.h)) continue;
    let ok = true; for (const q of towers) if (Math.hypot(q.x - x, q.z - z) < 11 + q.r + T.r0) ok = false;
    if (ok) put(x, z, T);
  }
  // walls from tower to nearest tower, and short stubs of houses
  for (let i = 0; i < towers.length; i++) {
    let best = -1, bd = 1e9; const p = towers[i];
    for (let j = 0; j < towers.length; j++) { const q = towers[j], d = Math.hypot(q.x - p.x, q.z - p.z); if (j !== i && d < bd && d > 12) { bd = d; best = j; } }
    const hw = rng.range(3.5, 8);
    if (best > i && bd < 70) { const q = towers[best], m = (px, pz) => clear(px, pz, 6); if (m((p.x + q.x) / 2, (p.z + q.z) / 2)) wallInto(A, rng, p.x, p.z, q.x, q.z, groundAt, hw, stone); }
  }
  const nStub = o.stubs ?? 16;
  for (let k = 0; k < nStub; k++) {
    const a = rng.range(0, TAU), d = rng.range(16, reach * 0.9), x = Math.cos(a) * d, z = Math.sin(a) * d, w = rng.range(5, 10), ya = rng.range(0, TAU), hh = rng.range(2.5, 6);
    if (!clear(x, z, 7)) continue;
    const cx = Math.cos(ya) * w, cz = Math.sin(ya) * w;
    wallInto(A, rng, x, z, x + cx, z + cz, groundAt, hh, stone); wallInto(A, rng, x + cx, z + cz, x + cx - cz, z + cz + cx, groundAt, hh, stone);
  }
  const mesh = new THREE.Mesh(A.build(), makeLandMaterial(o.U, true)); mesh.name = 'ruin-town';
  return { mesh, towers };
}

// ---------------------------------------------------------------- dragon skin
// aUv = (metres along the body, angle round it), aKind: 0 scales, 1 wing membrane, 2 plates / claws / bone, 3 eye, 4 teeth
const SKIN_VERT = /* glsl */`
attribute vec2 aUv; attribute float aKind;
varying vec3 vW, vN; varying vec2 vUv; varying float vKind;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix*vec4(position,1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vUv = aUv; vKind = aKind;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SKIN_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFireCol, uScale, uBronze; uniform vec4 uFire; uniform float uTime, uThrough;
varying vec3 vW, vN; varying vec2 vUv; varying float vKind;
${GLSL_NOISE}
#include <fog_pars_fragment>
void main(){
  vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
  vec3 V = normalize(cameraPosition-vW);
  float isScale = 1.-smoothstep(.2,.8,vKind), isWing = smoothstep(.5,.9,vKind)*(1.-smoothstep(1.1,1.5,vKind));
  float isEye = smoothstep(2.6,2.9,vKind)*(1.-smoothstep(3.1,3.4,vKind)), isTooth = smoothstep(3.6,3.9,vKind)*(1.-smoothstep(4.1,4.4,vKind));
  float isFire = smoothstep(4.6,4.9,vKind);
  // scales: rows of overlapping plates, each its own grey and its own tilt, like broken stone
  vec2 q = vec2(vUv.x/1.9, vUv.y*2.4); q.x += .5*mod(floor(q.y),2.);
  vec2 id = floor(q), f = fract(q);
  float h = hash12(id), seam = smoothstep(0.,.14,f.x)*(1.-smoothstep(.88,1.,f.x))*smoothstep(0.,.2,f.y);
  vec3 tilt = vec3(hash12(id+3.1), hash12(id+7.7), hash12(id+1.9))-.5;
  vec3 n0 = n;
  n = normalize(n+tilt*(.6*isScale+.25*(1.-isScale)*(1.-isWing)));
  float belly = smoothstep(-.2,-.9,sin(vUv.y));
  vec3 alb = uScale*(.7+.55*h*h)*(.5+.5*seam)*(1.-.25*f.y);
  alb = mix(alb, uScale*vec3(1.5,1.38,1.2), belly*.5);
  alb = mix(alb, uScale*(.8+.5*vnoise(vUv*vec2(.6,3.))), 1.-isScale);
  // the wing: dark leather, ribs along the fingers, the low sun coming through it bronze
  float rib = smoothstep(.8,1.,abs(sin(vUv.y*5.5)));
  vec3 wing = vec3(.085,.075,.075)*(.75+.5*vnoise(vUv*vec2(.35,2.)))*(1.-.45*rib);
  alb = mix(alb, wing, isWing);
  alb = mix(alb, vec3(.62,.58,.5), isTooth);
  float ndl = max(dot(n,uSunDir),0.), ndv = clamp(dot(n,V),0.,1.);
  // stone keeps its grey under a bronze sky: the light's colour is taken on the skin at a third of its strength
  vec3 sunG = mix(vec3(dot(uSunCol, vec3(.3,.5,.2))), uSunCol, .3);
  vec3 amb = mix(uGndCol, uSkyCol, n.y*.5+.5)*1.15;
  amb = mix(vec3(dot(amb, vec3(.3,.5,.2))), amb, .35);
  vec3 lit = sunG*ndl+amb;
  vec3 col = alb*lit;
  // what catches the light: a hard glint on the plates, a rim against the sky
  vec3 hv = normalize(uSunDir+V);
  float sp = pow(clamp(dot(n,hv),0.,1.), 26.)*(.35+h);
  col += uBronze*sunG*sp*(.22*isScale+.12*(1.-isScale))*(1.-isWing*.7);
  // the rim is the body's own outline (the plates' tilt left out), so that from far off it is a line of light and not a glow
  float rim = pow(clamp(1.-dot(n0,V),0.,1.), 4.)*clamp(dot(uSunDir, -V)*.6+.55, 0., 1.);
  col += uBronze*uSunCol*rim*.13*(1.-isWing*.5);
  // the sun through the web: only through a wing that stands open (folded, it lies on the body and nothing shines through)
  col += vec3(.85,.56,.27)*uSunCol*max(dot(-n,uSunDir),0.)*.07*uThrough*isWing*(1.-.6*rib);
  vec3 fl = uFire.xyz-vW; float fd2 = dot(fl,fl);
  col += (alb+.05)*uFireCol*(uFire.w*1100./(1100.+fd2))*(.3+.7*max(dot(n, fl/sqrt(max(fd2,1.))),0.));
  col = mix(col, vec3(.2,1.7,.45)*(1.1+.5*sin(uTime*1.3)), isEye);
  col = mix(col, mix(vec3(3.,1.9,.7), vec3(2.2,.6,.1), clamp(vUv.x,0.,1.))*(.7+.6*vnoise(vec2(vUv.y*3., vUv.x*6.-uTime*9.))), isFire);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
function makeSkinMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uScale: { value: new THREE.Color('#474a52') }, uBronze: { value: new THREE.Color('#bd9c6c') }, uThrough: { value: 1 } },
    vertexShader: SKIN_VERT, fragmentShader: SKIN_FRAG, fog: true, side: THREE.DoubleSide,
  });
}
// a dynamic buffer of skin: positions and normals rewritten every frame, uv and kind fixed
function makeSkinBuffer(nVert, idx) {
  const g = new THREE.BufferGeometry(), P = new Float32Array(nVert * 3), N = new Float32Array(nVert * 3), UV = new Float32Array(nVert * 2), K = new Float32Array(nVert);
  const pa = new THREE.BufferAttribute(P, 3), na = new THREE.BufferAttribute(N, 3);
  pa.setUsage(THREE.DynamicDrawUsage); na.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', pa); g.setAttribute('normal', na);
  g.setAttribute('aUv', new THREE.BufferAttribute(UV, 2)); g.setAttribute('aKind', new THREE.BufferAttribute(K, 1));
  g.setIndex(idx);
  return { g, P, N, UV, K, pa, na };
}

// ---------------------------------------------------------------- the old dragon
// Lean as a hound, huge as a hill: a body 170 m long wound two and a half times round the tallest tower. Its spine is laid
// in cylinder coordinates round the tower's axis (angle, distance, height) in two poses, coiled and reared, and blended by a
// wave that runs from the head down the neck to the chest as `rise` goes 0 to 1: the head lifts first, the neck unwinds, the
// chest climbs over the broken top, the wings open. o: { U, Ht, rBase, rTop, face (azimuth the reared chest faces), dir }.
function makeOldDragon(o) {
  const { U, Ht, rBase, rTop, face } = o, dir = o.dir || 1, ph = o.phases || [0, 0, 0];
  const Rt = (y) => lerp(rBase, rTop, clamp(y / Ht, 0, 1));
  const LB = 170, NS = 150, NR = 12, S0 = 0.4, TURNS = 2.0, CLIMB = 0.8, TC = 0.55, SW = 66, NPL = 64;
  const RB = [[0, 0.3], [0.08, 1.8], [0.25, 3.6], [0.36, 4.4], [0.5, 3.5], [0.62, 4.7], [0.7, 5.0], [0.77, 3.7], [0.9, 2.7], [1, 2.5]];
  const rb = (s) => { for (let i = 1; i < RB.length; i++) if (s <= RB[i][0]) { const a = RB[i - 1], b = RB[i]; return lerp(a[1], b[1], sstep(a[0], b[0], s)); } return 2.5; };
  const th0 = face - dir * TAU * (TURNS * S0 + CLIMB), yCoil = (s) => 2.5 + (Ht - 4.5) * Math.pow(s, 0.9);
  const wrapPi = (a) => a - TAU * Math.round(a / TAU);
  const C = { th: 0, rho: 0, y: 0, w: 0 };
  const pose = (s, k, look) => {
    const thc = th0 + dir * TAU * TURNS * s, yc = yCoil(s) - 2.2 * (1 - sstep(0, 0.07, s)), rc = Rt(yc) + rb(s) * 0.85 + 0.25 + 9 * (1 - sstep(0, 0.07, s));
    C.th = thc; C.rho = rc; C.y = yc; C.w = 0;
    if (s <= S0) return C;
    const t = (s - S0) / (1 - S0), w = sstep(0, 1, k * 1.7 - 0.7 * (1 - t));
    let thr, yr, rr;
    if (t <= TC) {
      const q = t / TC;
      thr = th0 + dir * TAU * (TURNS * S0 + CLIMB * q); yr = lerp(yCoil(S0), Ht + 2.5, Math.pow(q, 0.9));
      rr = Rt(yr) + rb(s) * 0.85 + 0.25 - 2.5 * sstep(0.8, 1, q);
    } else {
      const q = (t - TC) / (1 - TC);
      yr = Ht + 2.5 + 25 * (1 - (1 - q) * (1 - q)) - 2.5 * q * q * q * q;
      rr = Rt(Ht) + rb(s) * 0.85 - 2.25 - 7 * Math.sin(Math.PI * q) * (1 - q) + 9 * q * q;
      thr = face + clamp(wrapPi(look - face), -2, 2) * Math.pow(q, 1.5);
    }
    C.th = lerp(thc, thr, w); C.rho = lerp(rc, rr, w); C.y = lerp(yc, yr, w); C.w = w;
    return C;
  };
  // ---- buffers
  const LEGS = [[0.36, 1], [0.36, -1], [0.67, 1], [0.67, -1]], LRG = 5, LSD = 6, SPN = 11, SPM = 6, ARG = 9, ASD = 5;
  const vBody = 0, vPlate = NS * (NR + 1), vLeg = vPlate + NPL * 3, legV = LRG * LSD + 9, vWing = vLeg + 4 * legV, wingV = SPN * SPM + ARG * ASD, nVert = vWing + 2 * wingV;
  const idx = [];
  for (let i = 0; i < NS - 1; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, b, b + 1, a, b + 1, a + 1); }
  for (let p = 0; p < NPL; p++) idx.push(vPlate + p * 3, vPlate + p * 3 + 1, vPlate + p * 3 + 2);
  for (let l = 0; l < 4; l++) {
    const b0 = vLeg + l * legV;
    for (let i = 0; i < LRG - 1; i++) for (let j = 0; j < LSD; j++) { const a = b0 + i * LSD + j, a2 = b0 + i * LSD + (j + 1) % LSD; idx.push(a, a + LSD, a2 + LSD, a, a2 + LSD, a2); }
    for (let c = 0; c < 3; c++) idx.push(b0 + LRG * LSD + c * 3, b0 + LRG * LSD + c * 3 + 1, b0 + LRG * LSD + c * 3 + 2);
  }
  for (let w = 0; w < 2; w++) {
    const b0 = vWing + w * wingV;
    for (let e = 0; e < SPN - 1; e++) for (let m = 0; m < SPM - 1; m++) { const a = b0 + e * SPM + m, b = a + SPM; idx.push(a, b, b + 1, a, b + 1, a + 1); }
    const a0 = b0 + SPN * SPM;
    for (let i = 0; i < ARG - 1; i++) for (let j = 0; j < ASD; j++) { const a = a0 + i * ASD + j, a2 = a0 + i * ASD + (j + 1) % ASD; idx.push(a, a + ASD, a2 + ASD, a, a2 + ASD, a2); }
  }
  const buf = makeSkinBuffer(nVert, idx), P = buf.P, N = buf.N;
  for (let i = 0; i < NS; i++) for (let j = 0; j <= NR; j++) { const v = vBody + i * (NR + 1) + j; buf.UV[v * 2] = i / (NS - 1) * LB; buf.UV[v * 2 + 1] = j / NR * TAU; }
  for (let v = vPlate; v < vWing; v++) { buf.K[v] = 2; buf.UV[v * 2] = v * 0.37; buf.UV[v * 2 + 1] = v * 0.11; }
  for (let w = 0; w < 2; w++) {
    const b0 = vWing + w * wingV;
    for (let e = 0; e < SPN; e++) for (let m = 0; m < SPM; m++) { const v = b0 + e * SPM + m; buf.K[v] = 1; buf.UV[v * 2] = m * 6 + e; buf.UV[v * 2 + 1] = (Math.PI / 2 + e / 2 * Math.PI) / 5.5; }
    for (let v = b0 + SPN * SPM; v < b0 + wingV; v++) { buf.K[v] = 2; buf.UV[v * 2] = v * 0.3; buf.UV[v * 2 + 1] = v * 0.2; }
  }
  const mesh = new THREE.Mesh(buf.g, makeSkinMaterial(U)); mesh.frustumCulled = false; mesh.name = 'old-dragon';
  // spine samples: position, tangent, across (N), dorsal (B), angle, half width
  const SPx = new Float64Array(NS * 3), ST = new Float64Array(NS * 3), SN = new Float64Array(NS * 3), SB = new Float64Array(NS * 3), STH = new Float64Array(NS), SR = new Float64Array(NS), SWt = new Float64Array(NS);
  const set = (v, x, y, z, nx, ny, nz) => { P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z; N[v * 3] = nx; N[v * 3 + 1] = ny; N[v * 3 + 2] = nz; };
  return { mesh, buf, pose, rb, Rt, LB, NS, NR, S0, SW, NPL, LEGS, LRG, LSD, SPN, SPM, ARG, ASD, vBody, vPlate, vLeg, legV, vWing, wingV, SPx, ST, SN, SB, STH, SR, SWt, set, ph, Ht, face, dir };
}

// the dragon's body for this frame. rise 0..1 (coiled to reared), look: the azimuth round the tower's axis the head turns to
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _q = new THREE.Vector3();
function poseSpine(D, time, rise, look) {
  const { NS, NR, SPx, ST, SN, SB, STH, SR, SWt, set, ph } = D;
  for (let i = 0; i < NS; i++) {
    const s = i / (NS - 1), c = D.pose(s, rise, look);
    // it breathes: the chest swells a little on the clock; the neck sways once reared
    const sway = 0.035 * c.w * sstep(0.72, 1, s) * Math.sin(time * 0.5 + ph[0] + s * 3);
    const th = c.th + sway, rho = c.rho + 0.25 * Math.sin(time * 0.7 + ph[1]) * sstep(0.55, 0.68, s) * (1 - sstep(0.7, 0.8, s));
    SPx[i * 3] = rho * Math.cos(th); SPx[i * 3 + 1] = c.y; SPx[i * 3 + 2] = rho * Math.sin(th); STH[i] = th; SR[i] = D.rb(s); SWt[i] = c.w;
  }
  for (let i = 0; i < NS; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(NS - 1, i + 1), s = i / (NS - 1);
    let tx = SPx[i1 * 3] - SPx[i0 * 3], ty = SPx[i1 * 3 + 1] - SPx[i0 * 3 + 1], tz = SPx[i1 * 3 + 2] - SPx[i0 * 3 + 2];
    const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    // dorsal reference: out from the tower's axis; up for the reared neck
    const m = SWt[i] * sstep(0.74, 0.9, s);
    let rx = Math.cos(STH[i]) * (1 - m), ry = m, rz = Math.sin(STH[i]) * (1 - m);
    const dt = rx * tx + ry * ty + rz * tz; rx -= tx * dt; ry -= ty * dt; rz -= tz * dt;
    const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
    ST[i * 3] = tx; ST[i * 3 + 1] = ty; ST[i * 3 + 2] = tz; SB[i * 3] = rx; SB[i * 3 + 1] = ry; SB[i * 3 + 2] = rz;
    SN[i * 3] = ty * rz - tz * ry; SN[i * 3 + 1] = tz * rx - tx * rz; SN[i * 3 + 2] = tx * ry - ty * rx;
  }
  // the body's rings: deeper than wide at the back, flat to the wall at the belly, a low ridge along the spine
  for (let i = 0; i < NS; i++) {
    const r = SR[i], px = SPx[i * 3], py = SPx[i * 3 + 1], pz = SPx[i * 3 + 2];
    for (let j = 0; j <= NR; j++) {
      const a = j / NR * TAU, ca = Math.cos(a), sa = Math.sin(a), up = Math.max(0, sa);
      const w = r * ca, d = r * sa * (sa > 0 ? 1.12 : 0.8) + 0.22 * r * up * up * up * up * up * up;
      set(D.vBody + i * (NR + 1) + j, px + SN[i * 3] * w + SB[i * 3] * d, py + SN[i * 3 + 1] * w + SB[i * 3 + 1] * d, pz + SN[i * 3 + 2] * w + SB[i * 3 + 2] * d,
        SN[i * 3] * ca + SB[i * 3] * sa, SN[i * 3 + 1] * ca + SB[i * 3 + 1] * sa, SN[i * 3 + 2] * ca + SB[i * 3 + 2] * sa);
    }
  }
  // the plates along the back: irregular, like the broken crown of a wall
  for (let p = 0; p < D.NPL; p++) {
    const s = 0.06 + 0.86 * p / (D.NPL - 1), i = Math.round(s * (NS - 1)), r = SR[i], hh = r * (0.4 + 0.5 * ((p * 7919) % 13) / 12), hl = 0.7 + 0.3 * r, v = D.vPlate + p * 3;
    const bx = SPx[i * 3] + SB[i * 3] * r * 1.2, by = SPx[i * 3 + 1] + SB[i * 3 + 1] * r * 1.2, bz = SPx[i * 3 + 2] + SB[i * 3 + 2] * r * 1.2;
    const tx = ST[i * 3], ty = ST[i * 3 + 1], tz = ST[i * 3 + 2], nx = SN[i * 3], ny = SN[i * 3 + 1], nz = SN[i * 3 + 2];
    set(v, bx - tx * hl, by - ty * hl, bz - tz * hl, nx, ny, nz); set(v + 1, bx + tx * hl, by + ty * hl, bz + tz * hl, nx, ny, nz);
    set(v + 2, bx + SB[i * 3] * hh - tx * 0.4, by + SB[i * 3 + 1] * hh - ty * 0.4, bz + SB[i * 3 + 2] * hh - tz * 0.4, nx, ny, nz);
  }
}
// a tube of `rings` rings by `sides` sides along the bend root - knee - foot, written from vertex v0; returns the end frame in _d, _e1, _e2
function limbTube(D, v0, root, knee, foot, rings, sides, r0, r1, ref) {
  for (let i = 0; i < rings; i++) {
    const u = i / (rings - 1), k0 = (1 - u) * (1 - u), k1 = 2 * u * (1 - u), k2 = u * u;
    _q.set(root.x * k0 + knee.x * k1 + foot.x * k2, root.y * k0 + knee.y * k1 + foot.y * k2, root.z * k0 + knee.z * k1 + foot.z * k2);
    _d.set((knee.x - root.x) * (1 - u) + (foot.x - knee.x) * u, (knee.y - root.y) * (1 - u) + (foot.y - knee.y) * u, (knee.z - root.z) * (1 - u) + (foot.z - knee.z) * u).normalize();
    _e1.crossVectors(_d, ref); if (_e1.lengthSq() < 1e-6) _e1.set(1, 0, 0); _e1.normalize(); _e2.crossVectors(_d, _e1);
    const r = lerp(r0, r1, u);
    for (let j = 0; j < sides; j++) {
      const a = j / sides * TAU, ca = Math.cos(a), sa = Math.sin(a), nx = _e1.x * ca + _e2.x * sa, ny = _e1.y * ca + _e2.y * sa, nz = _e1.z * ca + _e2.z * sa;
      D.set(v0 + i * sides + j, _q.x + nx * r, _q.y + ny * r, _q.z + nz * r, nx, ny, nz);
    }
  }
}
const _root = new THREE.Vector3(), _knee = new THREE.Vector3(), _foot = new THREE.Vector3(), _ref = new THREE.Vector3();
const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3(), _W = new THREE.Vector3(), _Cd = new THREE.Vector3(), _Nw = new THREE.Vector3(), _sh = new THREE.Vector3();
// the four legs: each from the body's flank to a hold on the tower's wall (the forelegs take the broken rim once it is reared)
function poseLegs(D) {
  const { NS, SPx, ST, SN, SB, STH, SR, Ht } = D;
  for (let l = 0; l < 4; l++) {
    const sL = D.LEGS[l][0], side = D.LEGS[l][1], i = Math.round(sL * (NS - 1)), r = SR[i], v0 = D.vLeg + l * D.legV;
    _T.set(ST[i * 3], ST[i * 3 + 1], ST[i * 3 + 2]); _N.set(SN[i * 3], SN[i * 3 + 1], SN[i * 3 + 2]); _B.set(SB[i * 3], SB[i * 3 + 1], SB[i * 3 + 2]);
    _root.set(SPx[i * 3], SPx[i * 3 + 1], SPx[i * 3 + 2]).addScaledVector(_N, side * r * 0.75);
    _foot.copy(_root).addScaledVector(_N, side * 6).addScaledVector(_T, -1.5);
    const thf = Math.atan2(_foot.z, _foot.x), yf = clamp(_foot.y, 0.6, Ht - 0.6), rf = D.Rt(yf) + 0.6;
    _foot.set(rf * Math.cos(thf), yf, rf * Math.sin(thf));
    _ref.set(Math.cos(STH[i]), 0, Math.sin(STH[i]));
    _knee.addVectors(_root, _foot).multiplyScalar(0.5).addScaledVector(_ref, 3.2).addScaledVector(_N, side);
    limbTube(D, v0, _root, _knee, _foot, D.LRG, D.LSD, 1.15 * r / 3.2, 0.55 * r / 3.2, _ref);
    // three claws on the stone
    const c0 = v0 + D.LRG * D.LSD;
    for (let c = 0; c < 3; c++) {
      const o = (c - 1) * 0.8;
      D.set(c0 + c * 3, _foot.x + _e1.x * (o - 0.3), _foot.y + _e1.y * (o - 0.3), _foot.z + _e1.z * (o - 0.3), _ref.x, _ref.y, _ref.z);
      D.set(c0 + c * 3 + 1, _foot.x + _e1.x * (o + 0.3), _foot.y + _e1.y * (o + 0.3), _foot.z + _e1.z * (o + 0.3), _ref.x, _ref.y, _ref.z);
      D.set(c0 + c * 3 + 2, _foot.x + _e1.x * o * 1.4 + _d.x * 1.7 - _ref.x * 0.35, _foot.y + _e1.y * o * 1.4 + _d.y * 1.7 - _ref.y * 0.35, _foot.z + _e1.z * o * 1.4 + _d.z * 1.7 - _ref.z * 0.35, _ref.x, _ref.y, _ref.z);
    }
  }
}
// the wings: arm, forearm and four fingers with the skin between, in a plane (span W, chord Cd). open 0: folded along the
// body like a leaning slab of the ruin; open 1: half opened and lifted, 90 m to the tip. They never stop moving a little.
const WA = [[0, 0], [0.26, 0.05], [0.5, 0]], WE = [[0.04, -0.4], [0.24, -0.5], [0.45, -0.5], [0.68, -0.52], [0.9, -0.38], [1, -0.04]], WS = [0, 1, 2, 2, 2, 2];
function poseWings(D, time, open) {
  const { NS, SPx, ST, SN, SB, SR, SW, SPN, SPM, ph } = D, i = Math.round(0.69 * (NS - 1)), r = SR[i];
  _T.set(ST[i * 3], ST[i * 3 + 1], ST[i * 3 + 2]); _N.set(SN[i * 3], SN[i * 3 + 1], SN[i * 3 + 2]); _B.set(SB[i * 3], SB[i * 3 + 1], SB[i * 3 + 2]);
  for (let w = 0; w < 2; w++) {
    const side = w ? -1 : 1, v0 = D.vWing + w * D.wingV, beat = Math.sin(time * 0.55 + ph[2] + w * 0.6);
    const f = clamp(open * (0.94 + 0.06 * beat), 0, 1), el = 0.42 + 0.07 * beat * open;
    // open, the wings stand to the two sides of the way the chest faces (Bh, level) whatever the body's own twist there
    const bhx = Math.cos(D.face), bhz = Math.sin(D.face), lx = bhz * side, lz = -bhx * side;
    _sh.set(SPx[i * 3], SPx[i * 3 + 1], SPx[i * 3 + 2]);
    _a.copy(_N).multiplyScalar(side * r * 0.55).addScaledVector(_B, r * 0.5); _b.set(lx * r * 0.6 + bhx * r * 0.4, r * 0.3, lz * r * 0.6 + bhz * r * 0.4);
    _sh.add(_a.lerp(_b, f));
    // span: folded it points back down the body; open it stands out sideways, lifted, a little forward
    _a.copy(_T).multiplyScalar(-0.9).addScaledVector(_B, 0.3).addScaledVector(_N, side * 0.25).normalize();
    _b.set(lx * Math.cos(el) + bhx * 0.15, Math.sin(el), lz * Math.cos(el) + bhz * 0.15).normalize();
    _W.copy(_a).lerp(_b, f).normalize();
    _a.copy(_B).multiplyScalar(0.6).addScaledVector(_N, side * 0.5).normalize();
    _b.set(-bhx * 0.5, -0.75, -bhz * 0.5).normalize();
    _Cd.copy(_a).lerp(_b, f); _Cd.addScaledVector(_W, -_Cd.dot(_W)).normalize();
    _Nw.crossVectors(_W, _Cd).normalize();
    const sSpan = SW * lerp(0.42, 1, f), sChord = SW * lerp(0.3, 1, f);
    const at = (a, c, lift, out) => out.copy(_sh).addScaledVector(_W, a * sSpan).addScaledVector(_Cd, -c * sChord).addScaledVector(_Nw, lift);
    for (let e = 0; e < SPN; e++) {
      const e0 = e >> 1, odd = e & 1, A0 = WA[WS[e0]], E0 = WE[e0], A1 = WA[WS[Math.min(5, e0 + odd)]], E1 = WE[Math.min(5, e0 + odd)];
      const ax = (A0[0] + A1[0]) / 2, ac = (A0[1] + A1[1]) / 2, ex = (E0[0] + E1[0]) / 2, ec = (E0[1] + E1[1]) / 2, pull = odd ? 0.88 : 1;
      for (let m = 0; m < SPM; m++) {
        const u = m / (SPM - 1), a = lerp(ax, ex, u * pull), c = lerp(ac, ec, u * pull);
        const lift = (-0.05 * Math.sin(Math.PI * u) * (odd ? 1.5 : 1) + 0.012 * Math.sin(time * 1.1 + e * 0.7 + m + ph[2]) * u) * SW * f;
        at(a, c, lift, _q);
        D.set(v0 + e * SPM + m, _q.x, _q.y, _q.z, _Nw.x, _Nw.y, _Nw.z);
      }
    }
    // the arm and the leading finger: one bent tube
    const a0 = v0 + SPN * SPM, pts = [WA[0], WA[1], WA[2], WE[5]];
    for (let k = 0; k < D.ARG; k++) {
      const u = k / (D.ARG - 1) * 3, s0 = Math.min(2, Math.floor(u)), fu = u - s0, p0 = pts[s0], p1 = pts[s0 + 1];
      at(lerp(p0[0], p1[0], fu), lerp(p0[1], p1[1], fu), 0, _q);
      const rr = lerp(2.1, 0.3, k / (D.ARG - 1)) * lerp(0.75, 1, f);
      for (let j = 0; j < D.ASD; j++) {
        const an = j / D.ASD * TAU, ca = Math.cos(an), sa = Math.sin(an), nx = _Cd.x * ca + _Nw.x * sa, ny = _Cd.y * ca + _Nw.y * sa, nz = _Cd.z * ca + _Nw.z * sa;
        D.set(a0 + k * D.ASD + j, _q.x + nx * rr, _q.y + ny * rr, _q.z + nz * rr, nx, ny, nz);
      }
    }
  }
}

// ---------------------------------------------------------------- head, jaw, fire
// a loft of half-elliptic rings along +Z (the snout); sec: [z, half width, height above, depth below]
function headLoft(sec, uv0, sides = 10) {
  const pos = [], uv = [], kind = [], idx = [];
  for (let i = 0; i < sec.length; i++) for (let j = 0; j <= sides; j++) {
    const a = j / sides * TAU, ca = Math.cos(a), sa = Math.sin(a), q = sec[i];
    pos.push(q[1] * ca, sa > 0 ? q[2] * sa : q[3] * sa, q[0]); uv.push(uv0 + q[0], a); kind.push(0);
  }
  for (let i = 0; i < sec.length - 1; i++) for (let j = 0; j < sides; j++) { const a = i * (sides + 1) + j, b = a + sides + 1; idx.push(a, b + 1, b, a, a + 1, b + 1); }
  const tri = (p0, p1, p2, k) => { const n = pos.length / 3; pos.push(...p0, ...p1, ...p2); uv.push(0, 0, 1, 0, 0, 1); kind.push(k, k, k); idx.push(n, n + 1, n + 2); };
  return { pos, uv, kind, idx, tri };
}
function finishLoft(L, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(L.pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(L.uv, 2));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(L.kind, 1)); g.setIndex(L.idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}
function makeHead(mat) {
  const up = headLoft([[-2.4, 1.3, 1.3, 1.2], [0.4, 2.1, 1.8, 0.9], [3, 2.25, 1.65, 0.5], [5, 1.6, 1.05, 0.35], [8, 1.15, 0.8, 0.3], [10.5, 0.85, 0.65, 0.25], [11.7, 0.3, 0.25, 0.1]], 170);
  for (const sx of [-1, 1]) {
    // the green eyes, deep under the brow; the teeth along the lip
    up.tri([sx * 1.95, 0.95, 2.9], [sx * 1.75, 0.55, 3.9], [sx * 1.5, 1.0, 4.6], 3); up.tri([sx * 1.95, 0.95, 2.9], [sx * 1.5, 1.0, 4.6], [sx * 1.85, 1.25, 3.7], 3);
    for (let k = 0; k < 9; k++) { const z = 4.2 + k * 0.72, w = lerp(1.5, 0.75, k / 8) * 0.92; up.tri([sx * w, -0.25, z], [sx * w, -0.25, z + 0.5], [sx * w * 0.96, -0.95, z + 0.25], 4); }
  }
  const lo = headLoft([[0, 1.55, 0.2, 0.9], [3, 1.5, 0.2, 0.7], [7, 1.0, 0.15, 0.45], [9.8, 0.6, 0.12, 0.3], [10.7, 0.15, 0.05, 0.1]], 190);
  for (const sx of [-1, 1]) for (let k = 0; k < 8; k++) { const z = 3.4 + k * 0.78, w = lerp(1.4, 0.6, k / 7) * 0.9; lo.tri([sx * w, 0.1, z], [sx * w, 0.1, z + 0.5], [sx * w * 0.96, 0.7, z + 0.25], 4); }
  const head = finishLoft(up, mat), jaw = finishLoft(lo, mat);
  jaw.position.set(0, -0.55, 0.8); head.add(jaw); head.matrixAutoUpdate = true;
  return { head, jaw };
}
const FIRE_VERT = /* glsl */`
uniform float uTime, uK; varying float vT, vA; varying vec3 vN, vW;
void main(){
  vT = uv.x; vA = uv.y;
  vec3 p = position; float t = clamp(uv.x,0.,1.);
  p.xy += vec2(sin(uTime*5.+p.z*.33), cos(uTime*4.3+p.z*.27))*t*1.6;
  p.xy *= 1.+.18*sin(uTime*7.+p.z*.8);
  vec4 wp = modelMatrix*vec4(p,1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const FIRE_FRAG = /* glsl */`
uniform float uTime, uK, uCore; varying float vT, vA; varying vec3 vN, vW;
${GLSL_NOISE}
void main(){
  float t = clamp(vT,0.,1.);
  vec3 V = normalize(cameraPosition-vW);
  float face = pow(clamp(abs(dot(normalize(vN),V)),0.,1.), 1.4);
  float n = fbmLo(vec2(vA*1.6, t*7.-uTime*3.4))*.7+.3*vnoise(vec2(vA*5., t*22.-uTime*9.));
  float front = 1.-smoothstep(uK*1.1-.3, uK*1.1, t);
  float a = front*(1.-smoothstep(.62,1.,t))*smoothstep(-.02,.05,t)*face*clamp(n*1.9-.35+uCore*.5,0.,1.)*smoothstep(0.,.08,uK);
  vec3 c = mix(vec3(3.2,2.4,1.1), vec3(2.3,.62,.1), smoothstep(0.,.5,t+(1.-uCore)*.25));
  c = mix(c, vec3(.9,.12,.02), smoothstep(.55,1.,t));
  gl_FragColor = vec4(c*a, 1.);
}`;
// the breath: two cones of fire one in the other, along +Z from the mouth, 58 m long
function makeFire(U) {
  const group = new THREE.Group(), mats = [];
  for (const [rad, core] of [[1, 0], [0.45, 1]]) {
    const g = new THREE.CylinderGeometry(1, 1, 1, 12, 18, true), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const t = 0.5 - p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)), r = (0.5 + 7.8 * Math.pow(t, 0.8)) * rad;
      p.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r, t * 58); uv.setXY(i, t, a);
    }
    g.computeVertexNormals();
    const m = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uK: { value: 0 }, uCore: { value: core } }, vertexShader: FIRE_VERT, fragmentShader: FIRE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5; group.add(mesh); mats.push(m);
  }
  return { group, set(k) { mats[0].uniforms.uK.value = k; mats[1].uniforms.uK.value = k; } };
}

// ---------------------------------------------------------------- buildHero: the tallest tower and the old dragon on it
// opts: { U (light uniforms; made here when absent), rng, Ht 50, face (azimuth the reared chest faces), dir (winding sense),
//   ruin: false | { rng, groundAt, clear, fixed, count, reach } }.
// update(dt, time, camera, state): state = { rise 0..1, fire 0..1, look: Vector3 (world) the head turns to }. Without a state
// (the set-piece viewer) it stands reared, breathing fire, looking at the camera.
export async function buildHero(ctx, opts = {}) {
  const U = opts.U || makeLightUniforms(), rng = opts.rng || ctx.rng.fork('old');
  const Ht = opts.Ht ?? 50, rBase = Ht * 0.172, rTop = Ht * 0.132, face = opts.face ?? Math.PI / 2, dir = opts.dir || 1;
  const object = new THREE.Group(); object.name = 'isle-of-broken-towers-hero';
  // the tallest tower: its crown broken lowest where the dragon's chest comes over it, a deep notch at its back
  const A = makeAcc(), seg = 20, tops = [], holes = [], notch = face + Math.PI + rng.range(-0.5, 0.5);
  const wrap = (a) => Math.abs(a - TAU * Math.round(a / TAU));
  for (let j = 0; j < seg; j++) {
    const a = j / seg * TAU;
    tops.push(1 - 0.08 * Math.exp(-((wrap(a - face) / 0.8) ** 2)) - 0.26 * Math.exp(-((wrap(a - notch) / 0.5) ** 2)) - 0.05 * rng());
  }
  for (let n = 0; n < 3; n++) holes.push({ a: rng.range(0, TAU), y: Ht * rng.range(0.3, 0.8), wa: rng.range(0.16, 0.3), wy: Ht * rng.range(0.035, 0.06) });
  towerInto(A, { x: 0, z: 0, base: -3, h: Ht + 3, r0: rBase, r1: rTop, lean: 0, leanA: 0, seg, tops, holes, c: col3('#777b84') });
  const tower = new THREE.Mesh(A.build(), makeLandMaterial(U, true)); tower.name = 'tallest-tower'; object.add(tower);
  await ctx.yield();
  const D = makeOldDragon({ U, Ht, rBase: rBase * 1.02, rTop: rTop * 1.02, face, dir, phases: [rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU)] });
  object.add(D.mesh);
  const { head, jaw } = makeHead(D.mesh.material); head.scale.setScalar(1.55); object.add(head);
  const fire = makeFire(U); fire.group.position.set(0, -0.45, 9.6); fire.group.scale.setScalar(1 / 1.55); head.add(fire.group);
  await ctx.yield();
  const smoke = makeSmokeColumn({ rng, position: [0, Ht, 0], height: 30, radius: [0.7, 6], size: [2.2, 11], count: 44, color: '#4a4852', colorTop: '#8a8790', shadowColor: '#201e26', ambient: '#16151b', opacity: 0.7, rate: 0.09, wind: [1, 0, 0.35], bend: 0.5 });
  smoke.object.renderOrder = 4; smoke.object.frustumCulled = false; object.add(smoke.object);
  await ctx.yield();
  let town = null;
  if (opts.ruin !== false) {
    town = buildRuinTown({ U, rng: (opts.ruin && opts.ruin.rng) || ctx.rng.fork('ruin'), count: 7, reach: 80, ...(opts.ruin || {}) });
    object.add(town.mesh);
  }
  await ctx.yield();
  const _lt = new THREE.Vector3(), _hp = new THREE.Vector3(), _F = new THREE.Vector3(), _R = new THREE.Vector3(), _Uh = new THREE.Vector3(), _m = new THREE.Matrix4(), _u0 = new THREE.Vector3();
  const headWorld = new THREE.Vector3(), fireAt = new THREE.Vector3(), jawPh = rng.range(0, TAU);
  const NS = D.NS;
  const hero = {
    object, radius: 105, height: 96, center: new THREE.Vector3(0, 44, 0), ground: true, groundY: 0,
    anchors: { headWorld, fireAt }, towers: town ? town.towers : [], Ht, rBase, rTop, U,
    update(dt, time, camera, st) {
      const rise = st ? st.rise : 1, fk = st ? st.fire : 0.9;
      if (st) _lt.copy(st.look).sub(object.position); else _lt.set(Math.cos(face - 0.5) * 110, 8, Math.sin(face - 0.5) * 110);
      if (!opts.U) U.uTime.value = time;
      poseSpine(D, time, rise, Math.atan2(_lt.z, _lt.x)); poseLegs(D); poseWings(D, time, sstep(0.5, 1, rise));
      D.buf.pa.needsUpdate = true; D.buf.na.needsUpdate = true;
      D.mesh.material.uniforms.uThrough.value = sstep(0.5, 1, rise);
      // the head: along the neck's end while it lies coiled, turned to us as it rears
      const e = (NS - 1) * 3, w = D.SWt[NS - 1];
      _hp.set(D.SPx[e], D.SPx[e + 1], D.SPx[e + 2]);
      _F.set(D.ST[e], D.ST[e + 1], D.ST[e + 2]); _u0.copy(_lt).sub(_hp).normalize(); _F.lerp(_u0, 0.85 * w).normalize();
      _u0.set(Math.cos(D.STH[NS - 1]) * (1 - w), w, Math.sin(D.STH[NS - 1]) * (1 - w)).normalize();
      _R.crossVectors(_u0, _F); if (_R.lengthSq() < 1e-6) _R.set(1, 0, 0); _R.normalize(); _Uh.crossVectors(_F, _R);
      _m.makeBasis(_R, _Uh, _F); head.quaternion.setFromRotationMatrix(_m); head.position.copy(_hp).addScaledVector(_F, 2.4);
      jaw.rotation.x = 0.05 + 0.5 * fk + 0.02 * Math.sin(time * 0.9 + jawPh);
      fire.set(fk);
      headWorld.copy(_hp).add(object.position); fireAt.copy(headWorld).addScaledVector(_F, 36);
      smoke.uniforms.uBase.value.copy(headWorld).addScaledVector(_F, 19).addScaledVector(_Uh, 0.8);
      smoke.uniforms.uSunDir.value.copy(U.uSunDir.value); smoke.uniforms.uSunColor.value.copy(U.uSunCol.value).multiplyScalar(0.4);
      smoke.update(dt, time);
      if (!opts.U) U.uFire.value.set(fireAt.x, fireAt.y, fireAt.z, fk * 1.2);
    },
    dispose() {},
  };
  hero.update(0, 0, null, opts.U ? { rise: 0, fire: 0, look: new THREE.Vector3(1, 0, 0).add(object.position) } : undefined);
  return hero;
}

// ---------------------------------------------------------------- the young dragons
// Thin-bodied, wide-winged like vast bats: 16 m long, 25 m from tip to tip. One instanced mesh; the wings beat in the vertex
// shader (flapping and gliding by turns, each on its own rate and phase), the tail weaves, and a burst of fire comes from the
// mouth on each one's own seeded schedule (or held, for the two whose passes are beats of the flight).
const YOUNG_VERT = /* glsl */`
attribute vec2 aUv; attribute float aKind; attribute vec3 aWing; attribute vec4 iA, iB;
uniform float uTime;
varying vec3 vW, vN; varying vec2 vUv; varying float vKind;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal;
  float ph = uTime*iA.y+iA.x;
  float glide = smoothstep(.15,.6, sin(uTime*.31*iA.z+iA.x*1.7));
  float amp = mix(.72, .1, glide);
  float w = clamp(aWing.x, 0., 1.);
  float ang = aWing.y*(amp*sin(ph-.9*w)*(.35+.65*w)+.16+.1*glide);
  float c = cos(ang), s = sin(ang);
  vec2 piv = vec2(aWing.y*.5, .45), d = p.xy-piv;
  p.xy = mix(p.xy, piv+vec2(c*d.x-s*d.y, s*d.x+c*d.y), step(.5, abs(aWing.y)));
  n.xy = mix(n.xy, vec2(c*n.x-s*n.y, s*n.x+c*n.y), step(.5, abs(aWing.y)));
  float tail = smoothstep(0., -9., p.z)*(1.-abs(aWing.y));
  p.x += sin(ph*.5+p.z*.45)*.9*tail; p.y += amp*.35*sin(ph+1.6)*(1.-tail);
  // the fire: gathered into the mouth until its burst comes
  float x = fract((uTime+iB.y)/max(iB.x, 1.));
  float burst = max(smoothstep(0.,.05,x)*(1.-smoothstep(.16,.26,x)), iB.z);
  float isFire = step(4.5, aKind);
  p = mix(p, vec3(0., .1, 7.2)+(p-vec3(0., .1, 7.2))*burst*(1.+.2*sin(uTime*23.+p.z)), isFire);
  vec4 wp = modelMatrix*instanceMatrix*vec4(p,1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n); vUv = aUv; vKind = aKind;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
export function makeYoungDragons(o) {
  const { U, count, rng } = o, pos = [], uv = [], kind = [], wing = [], idx = [];
  const V = (x, y, z, k, u0, v0, w0 = 0, ws = 0) => { pos.push(x, y, z); uv.push(u0, v0); kind.push(k); wing.push(w0, ws, 0); return pos.length / 3 - 1; };
  // body: tail to snout along +Z
  const SEC = [[-9.5, 0.06, 0.06], [-6, 0.28, 0.3], [-2.5, 0.6, 0.7], [0.5, 0.8, 0.95], [2.8, 0.7, 0.85], [4.2, 0.36, 0.42], [5.6, 0.33, 0.38], [6.2, 0.5, 0.48], [7.1, 0.3, 0.26], [7.9, 0.08, 0.08]], SD = 8;
  for (let i = 0; i < SEC.length; i++) for (let j = 0; j <= SD; j++) { const a = j / SD * TAU, q = SEC[i]; V(Math.cos(a) * q[1], 0.2 + Math.sin(a) * q[2], q[0], 0, q[0] * 2 + 40, a); }
  for (let i = 0; i < SEC.length - 1; i++) for (let j = 0; j < SD; j++) { const a = i * (SD + 1) + j, b = a + SD + 1; idx.push(a, b + 1, b, a, a + 1, b + 1); }
  // wings: a fan of skin from the arm to the finger tips; aWing = (distance out 0..1, side)
  const TIP = [[0.5, 3.2], [5.2, 3.4], [12.5, 1.2], [10.6, -3.2], [7.4, -5.2], [3.8, -5.4], [0.5, -3.6]], HUB = [4.6, 1.4];
  for (const sd of [-1, 1]) {
    const hub = V(sd * HUB[0], 0.55, HUB[1], 1, 0, 0.3, HUB[0] / 12.5, sd), ring = [];
    for (let k = 0; k < TIP.length; k++) ring.push(V(sd * TIP[k][0], 0.45 + 0.25 * Math.sin(k * 1.3), TIP[k][1], 1, k, (Math.PI / 2 + k * Math.PI) / 5.5, TIP[k][0] / 12.5, sd));
    // each web of skin has its own corner at the hub (its rib coordinate midway between its two fingers), so that the dark
    // ribs lie along the fingers only and never band across a web
    for (let k = 0; k < TIP.length - 1; k++) idx.push(V(sd * HUB[0], 0.55, HUB[1], 1, 0, (Math.PI + k * Math.PI) / 5.5, HUB[0] / 12.5, sd), ring[k], ring[k + 1]);
    {
      const a = TIP[TIP.length - 1], c = TIP[0];
      idx.push(V(sd * HUB[0], 0.55, HUB[1], 1, 0, 0, HUB[0] / 12.5, sd), V(sd * a[0], 0.45, a[1], 1, 0, 0, a[0] / 12.5, sd), V(sd * c[0], 0.45, c[1], 1, 0, 0, c[0] / 12.5, sd));
    }
    // eyes
    const e = V(sd * 0.46, 0.5, 6.35, 3, 0, 0); V(sd * 0.4, 0.34, 6.7, 3, 0, 0); V(sd * 0.36, 0.56, 6.85, 3, 0, 0); idx.push(e, e + 1, e + 2);
  }
  // the fire: a short cone before the mouth
  const f0 = pos.length / 3, FS = 6, FR = 4;
  for (let i = 0; i < FR; i++) for (let j = 0; j < FS; j++) { const t = i / (FR - 1), a = j / FS * TAU, r = 0.15 + 1.5 * Math.pow(t, 0.7) * (1 - 0.75 * t * t); V(Math.cos(a) * r, 0.1 + Math.sin(a) * r, 7.6 + t * 10, 5, t, a); }
  for (let i = 0; i < FR - 1; i++) for (let j = 0; j < FS; j++) { const a = f0 + i * FS + j, a2 = f0 + i * FS + (j + 1) % FS; idx.push(a, a + FS, a2 + FS, a, a2 + FS, a2); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { iA.set([rng.range(0, TAU), rng.range(4.2, 5.6), rng.range(0.7, 1.3), 0], i * 4); iB.set([rng.range(6, 11), rng.range(0, 11), 0, 0], i * 4); }
  const aB = new THREE.InstancedBufferAttribute(iB, 4);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', aB);
  const mat = makeSkinMaterial(U); mat.vertexShader = YOUNG_VERT;
  const mesh = new THREE.InstancedMesh(g, mat, count); mesh.frustumCulled = false; mesh.name = 'young-dragons';
  const _m4 = new THREE.Matrix4(), _eu = new THREE.Euler(0, 0, 0, 'YXZ'), _qq = new THREE.Quaternion(), _ps = new THREE.Vector3(), _sc = new THREE.Vector3();
  return {
    mesh, count,
    // place dragon i: position, heading (yaw: 0 looks down +Z, turning toward +X), pitch (nose up), roll (bank), size
    place(i, x, y, z, yaw, pitch, roll, size = 1) {
      _eu.set(-pitch, yaw, roll); _qq.setFromEuler(_eu); _m4.compose(_ps.set(x, y, z), _qq, _sc.set(size, size, size)); mesh.setMatrixAt(i, _m4);
    },
    hold(i, on) { iB[i * 4 + 2] = on; },
    commit() { mesh.instanceMatrix.needsUpdate = true; aB.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- the boat
// Small, clinker-built, old: overlapping strakes, a mast with one patched sail filled from astern, eyes painted on her prow,
// one small plain cloaked figure at the steering oar, a white seabird on her masthead. Origin at the waterline amidships,
// bow toward +Z. Returns { object, hull, sail, sail uniforms, wakeXZ (her wake's lay-out for the world to lay on its sea) }.
// o.plain: a fishing boat of the isles (no eyes on the prow, no bird; o.sail its canvas).
export function buildBoat(o) {
  const rng = o.rng, grp = new THREE.Group(); grp.name = 'boat';
  const pos = [], colr = [], idx = [];
  const V = (x, y, z, c) => { pos.push(x, y, z); colr.push(c[0], c[1], c[2]); return pos.length / 3 - 1; };
  const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
  const LZ0 = -4.2, LZ1 = 4.7, NST = 14, NSK = 5, wood = col3('#6b4a2e'), woodD = col3('#3d2a1b'), tar = col3('#2a211a');
  const beam = (z) => { const t = (z - LZ0) / (LZ1 - LZ0), f = Math.sin(Math.PI * Math.pow(t, 0.8)); return 0.16 + 1.3 * Math.pow(Math.max(0, f), 0.7) * (t < 0.12 ? 0.8 + t * 1.6 : 1); };
  const sheer = (z) => 0.78 + 0.045 * z * z + (z > 3 ? (z - 3) * 0.28 : 0), keel = -0.42;
  // strakes: each a band from keel to gunwale, the lower edge of each standing out over the one below (the clinker lap)
  for (const sd of [-1, 1]) for (let k = 0; k < NSK; k++) {
    const tint = 0.8 + 0.35 * rng(), c = [wood[0] * tint, wood[1] * tint, wood[2] * tint], cd = [c[0] * 0.55, c[1] * 0.55, c[2] * 0.55], row = [];
    for (let i = 0; i <= NST; i++) {
      const z = lerp(LZ0, LZ1, i / NST), b = beam(z), top = sheer(z);
      const f0 = k / NSK, f1 = (k + 1) / NSK, sh = (f) => Math.pow(f, 0.55);
      row.push(V(sd * (b * sh(f0) + 0.05), lerp(keel, top, f0), z, cd), V(sd * b * sh(f1), lerp(keel, top, f1), z, c));
    }
    for (let i = 0; i < NST; i++) quad(row[i * 2], row[i * 2 + 1], row[i * 2 + 3], row[i * 2 + 2]);
  }
  // keel and stem post, bottom boards, thwarts
  const box = (x0, y0, z0, x1, y1, z1, c) => {
    const p = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map((q) => V(q[0], q[1], q[2], c));
    quad(p[0], p[3], p[2], p[1]); quad(p[4], p[5], p[6], p[7]); quad(p[0], p[4], p[7], p[3]); quad(p[1], p[2], p[6], p[5]); quad(p[3], p[7], p[6], p[2]); quad(p[0], p[1], p[5], p[4]);
  };
  box(-0.07, keel - 0.12, LZ0, 0.07, keel + 0.05, LZ1 - 0.2, tar);
  box(-0.08, keel, LZ1 - 0.3, 0.08, sheer(LZ1) + 0.55, LZ1 + 0.02, woodD);
  box(-0.07, keel, LZ0 - 0.05, 0.07, sheer(LZ0) + 0.25, LZ0 + 0.2, woodD);
  box(-0.75, -0.14, -3, 0.75, -0.1, 3.4, woodD);
  for (const z of [-2.2, -0.4, 1.9]) box(-beam(z) * 0.96, 0.42, z - 0.14, beam(z) * 0.96, 0.47, z + 0.14, wood);
  // mast, yard, steering oar
  box(-0.11, -0.1, 0.5, 0.11, 6.4, 0.72, woodD); box(-2.5, 5.75, 0.74, 2.5, 5.9, 0.88, woodD);
  box(0.5, -0.5, -4.9, 0.62, 1.1, -3.5, wood);
  // the eyes painted on her prow: a pale almond and a dark pupil on each bow
  if (!o.plain) for (const sd of [-1, 1]) {
    const z = 3.55, x = sd * (beam(z) + 0.035), y = 0.72, w = col3('#e9e4d2'), d = col3('#16181c');
    const a = V(x, y, z - 0.42, w), b = V(x + sd * 0.02, y + 0.2, z, w), c = V(x - sd * 0.05, y, z + 0.42, w), e = V(x + sd * 0.02, y - 0.17, z, w);
    quad(a, b, c, e);
    const m = sd * 0.02; quad(V(x + m, y, z - 0.13, d), V(x + m + sd * 0.01, y + 0.12, z, d), V(x + m, y, z + 0.13, d), V(x + m + sd * 0.01, y - 0.11, z, d));
  }
  // the one who sails her: small, plain, cloaked, at the steering oar; and the white bird on the masthead
  const cloak = col3('#4a4338'), skin = col3('#8a6a50'), white = col3('#f0f0ea');
  const cone = (x, y, z, r, h, c, n = 7) => { const top = V(x, y + h, z, c), ring = []; for (let j = 0; j < n; j++) { const a = j / n * TAU; ring.push(V(x + Math.cos(a) * r, y, z + Math.sin(a) * r, [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8])); } for (let j = 0; j < n; j++) idx.push(top, ring[(j + 1) % n], ring[j]); };
  cone(0.1, 0.4, -3.1, 0.42, 1.05, cloak); box(-0.03, 1.36, -3.22, 0.23, 1.62, -2.98, skin); cone(0.1, 1.5, -3.1, 0.2, 0.3, cloak);
  if (!o.plain) { box(-0.08, 6.4, 0.5, 0.08, 6.62, 0.86, white); cone(0, 6.5, 0.92, 0.07, 0.16, white, 4); }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); hg.setIndex(idx); hg.computeVertexNormals();
  const hull = new THREE.Mesh(hg, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); grp.add(hull);
  // the sail: weathered canvas with darker and paler patches, bellied forward and never still
  const NU = 9, NV = 9, sp = [], sc = [], si = [], canvas = col3(o.sail || '#c9b98f'), patch = [col3('#a8946a'), col3('#d8cfb4'), col3('#8f8266')];
  const cellC = []; for (let k = 0; k < (NU - 1) * (NV - 1); k++) cellC.push(rng.chance(0.2) ? rng.pick(patch) : canvas);
  for (let j = 0; j < NV - 1; j++) for (let i = 0; i < NU - 1; i++) {
    const c = cellC[j * (NU - 1) + i], tone = 0.9 + 0.1 * ((i + j) % 2), n = sp.length / 3;
    for (const [du, dv] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const u = (i + du) / (NU - 1), v = (j + dv) / (NV - 1); sp.push((u - 0.5) * 4.7 * (0.86 + 0.14 * v), 1.25 + v * 4.55, 0.9); sc.push(c[0] * tone, c[1] * tone, c[2] * tone); }
    si.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); sg.setIndex(si); sg.computeVertexNormals();
  const sailU = { uSailT: { value: 0 } };
  const sm = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  sm.onBeforeCompile = (sh) => {
    sh.uniforms.uSailT = sailU.uSailT;
    sh.vertexShader = 'uniform float uSailT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { float su = clamp(position.x/4.7+.5, 0., 1.), sv = clamp((position.y-1.25)/4.55, 0., 1.);
        float belly = sin(3.14159*su)*sin(3.14159*min(sv*.92+.04, 1.));
        transformed.z += belly*(1.15+.12*sin(uSailT*1.7+su*5.))+.05*sin(uSailT*5.+sv*9.+su*4.)*belly; }`);
  };
  const sail = new THREE.Mesh(sg, sm); grp.add(sail);
  // the wake's lay-out: [across, astern] pairs in her own frame, two rows a side opening astern, and the foam round her bow
  const wakeXZ = [];
  // (one V of foam opening astern of her: 15 rows of 5 evenly across, three boat lengths long)
  for (let i = 0; i <= 14; i++) { const d = i / 14, back = -2.2 - d * 26, half = 1.15 + Math.pow(d, 0.8) * 4.3; for (let j = 0; j < 5; j++) wakeXZ.push([half * (j / 2 - 1), back]); }
  return { object: grp, hull, sail, sailU, wakeXZ, wakeCols: 5, length: LZ1 - LZ0 };
}
