// THE GEODE RUN: a runaway ore cart out of a timbered tunnel, through a gallery of fallen selenite, down a throat of
// amethyst frost and round a spindly helix trestle inside the geode (the hero, src/parts/geode-run.js), then the leap
// down the daylight into the well.
//
// Everything is shaded by the hero's own light model (hero.lib): the warm carbide lamp cone and its bare spill, eight
// small cold point lamps (seven hang or stand down the mine, one rides the loose cart), the daylight line source
// inside the egg. The mine before the geode is cut from the same materials: the selenite of
// the gallery answers the lamp with the same light pipe, the tunnel timber is the trestle's timber.
//
// Variations (by seed, see pickLook): hard noon | moonlit night | overcast with rain | deep winter; mineral cast
// amethyst | celestine | fluorite; the loose cart is one white cart or a string of three tubs; swiftlets or white
// doves; buckets or glow-worm lamps on the cableway. Rare event (ctx.vary.rare): the exodus of the bat colony.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { buildHero } from '../parts/geode-run.js';

const TAU = Math.PI * 2, V3 = THREE.Vector3;
const LAMP_IDX = [0, 1, 3, 4, 5, 6, 7];              // the uPt slots that hold fixed lamps (2 rides with a cart)
const CAM_H = 1.7;                                   // eye above the rail top (the hero's flyThrough uses the same)

// the light a great crystal holds in its body: the second colour of each cast, always cold (root, tip)
const GLOWS = { amethyst: ['#D873CC', '#F9AEDD'], celestine: ['#A892EE', '#D9CCFF'], fluorite: ['#A877E6', '#DDBEFF'] };
const MINERALS = {
  amethyst: ['#0B0716', '#3D2466', '#8A5BD6', '#EEF3FA', '#9CCBFF', '#2FD3C4', '#6B5D52'],
  celestine: ['#070B14', '#27405E', '#8FB4D8', '#EEF3FA', '#A9D0FF', '#3FD39A', '#6B6058'],
  fluorite: ['#06100E', '#1C5646', '#66D2A0', '#EEF3FA', '#A8D4FF', '#8FCFF2', '#6A6056'],
};
const LOOKS = {
  noon: { shaft: '#B8D6FF', shaftK: 2.0, amb: 1.3, haze: 1.5, skyA: [0.37, 0.97, 2.3], skyB: [3.6, 3.6, 3.67], stars: 0, lamp: 1.0, fallK: 1, frozen: 0, exposure: 0.92, bloom: 0.4, fogK: 1, portal: '#bfe6ff' },
  night: { shaft: '#C6D2F0', shaftK: 0.62, amb: 0.6, haze: 0.6, skyA: [0.012, 0.02, 0.06], skyB: [0.42, 0.48, 0.66], stars: 1, lamp: 1.45, fallK: 1, frozen: 0, exposure: 1.22, bloom: 0.7, fogK: 0.8, portal: '#d7e2ff' },
  rain: { shaft: '#B4C4DA', shaftK: 1.3, amb: 1.5, haze: 1.7, skyA: [1.3, 1.45, 1.7], skyB: [2.5, 2.6, 2.8], stars: 0, lamp: 1.15, fallK: 2, frozen: 0, exposure: 0.98, bloom: 0.42, fogK: 1.25, portal: '#cfe4f2' },
  winter: { shaft: '#B0CEFF', shaftK: 1.45, amb: 1.6, haze: 1.25, skyA: [1.5, 1.9, 2.5], skyB: [3.2, 3.3, 3.5], stars: 0, lamp: 1.0, fallK: 0.8, frozen: 0.55, exposure: 0.95, bloom: 0.38, fogK: 1.1, portal: '#e6f2ff' },
};
function pickLook(rng, vary) {
  const hour = vary && vary.hour;
  let look = rng.pick(['noon', 'noon', 'night', 'rain', 'winter']);
  if (hour === 'night') look = 'night'; else if (hour === 'day') look = rng.chance(0.6) ? 'noon' : rng.pick(['rain', 'winter']);
  else if (hour === 'dawn') look = rng.chance(0.5) ? 'winter' : 'rain'; else if (hour === 'golden') look = rng.chance(0.6) ? 'noon' : 'rain';
  return {
    look, mineral: rng.pick(['amethyst', 'amethyst', 'celestine', 'fluorite']),
    tubs: rng.chance(0.4) ? 3 : 1, doves: rng.chance(0.35), glow: rng.chance(0.4),
    rare: !!(vary && vary.rare), density: (vary && vary.density) || 1,
  };
}

// ---------------------------------------------------------------- a small triangle-soup builder for carts and machines
class Soup {
  constructor() { this.p = []; this.c = []; this.m = []; this.M = new THREE.Matrix4(); this.v = new V3(); }
  put(x, y, z, col, m) { this.v.set(x, y, z).applyMatrix4(this.M); this.p.push(this.v.x, this.v.y, this.v.z); this.c.push(col[0], col[1], col[2]); this.m.push(m); }
  tri(a, b, c, col, m = 0) { this.put(a[0], a[1], a[2], col, m); this.put(b[0], b[1], b[2], col, m); this.put(c[0], c[1], c[2], col, m); }
  quad(a, b, c, d, col, m = 0) { this.tri(a, b, c, col, m); this.tri(a, c, d, col, m); }
  box(cx, cy, cz, sx, sy, sz, col, m = 0) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], col, m); this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, m);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, m); this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], col, m);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, m); this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], col, m);
  }
  bar(a, b, w, col, m = 0) {                          // square bar from a to b
    const d = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length(); d.normalize();
    const s = new V3(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0), u = new V3().crossVectors(d, s).normalize().multiplyScalar(w / 2), t = new V3().crossVectors(d, u).normalize().multiplyScalar(w / 2);
    const k = (e, su, st) => [e[0] + u.x * su + t.x * st, e[1] + u.y * su + t.y * st, e[2] + u.z * su + t.z * st];
    for (const [s0, t0, s1, t1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) this.quad(k(a, s0, t0), k(a, s1, t1), k(b, s1, t1), k(b, s0, t0), col, m);
    this.quad(k(b, -1, -1), k(b, 1, -1), k(b, 1, 1), k(b, -1, 1), col, m); this.quad(k(a, -1, -1), k(a, 1, -1), k(a, 1, 1), k(a, -1, 1), col, m);
    return len;
  }
  wheel(cx, cy, cz, r, hw, col, col2, m = 0) {        // axis along x; spoked sides so that the spin can be seen
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, y0 = cy + Math.sin(a0) * r, z0 = cz + Math.cos(a0) * r, y1 = cy + Math.sin(a1) * r, z1 = cz + Math.cos(a1) * r;
      this.quad([cx - hw, y0, z0], [cx + hw, y0, z0], [cx + hw, y1, z1], [cx - hw, y1, z1], col, m);
      const cc = i % 3 === 0 ? col2 : col;
      for (const s of [-1, 1]) this.tri([cx + s * hw, cy, cz], [cx + s * hw, y0, z0], [cx + s * hw, y1, z1], cc, m);
      const f = r + 0.035;                           // the flange inside the rail
      this.quad([cx - hw, y0, z0], [cx - hw, cy + Math.sin(a0) * f, cz + Math.cos(a0) * f], [cx - hw, cy + Math.sin(a1) * f, cz + Math.cos(a1) * f], [cx - hw, y1, z1], col2, m);
    }
  }
  point(base, dir, len, r, colRoot, colTip, m = 3) {  // a six-sided crystal point
    const d = new V3(dir[0], dir[1], dir[2]).normalize(), s = new V3(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0), u = new V3().crossVectors(d, s).normalize(), t = new V3().crossVectors(d, u);
    const ring = (h, rr, i) => { const a = (i / 6) * TAU; return [base[0] + d.x * h + (u.x * Math.cos(a) + t.x * Math.sin(a)) * rr, base[1] + d.y * h + (u.y * Math.cos(a) + t.y * Math.sin(a)) * rr, base[2] + d.z * h + (u.z * Math.cos(a) + t.z * Math.sin(a)) * rr]; };
    const apex = [base[0] + d.x * len, base[1] + d.y * len, base[2] + d.z * len];
    for (let i = 0; i < 6; i++) { this.quad(ring(0, r * 0.8, i), ring(0, r * 0.8, i + 1), ring(len * 0.68, r, i + 1), ring(len * 0.68, r, i), colRoot, m); this.tri(ring(len * 0.68, r, i), ring(len * 0.68, r, i + 1), apex, colTip, m); }
  }
  cyl(a, b, r0, r1, col, m = 0, n = 10, caps = true) {   // round (n-sided) tapered bar from a to b
    const d = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), s = new V3(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0), u = new V3().crossVectors(d, s).normalize(), t = new V3().crossVectors(d, u);
    const k = (e, r, i) => { const an = (i / n) * TAU, c = Math.cos(an) * r, sn = Math.sin(an) * r; return [e[0] + u.x * c + t.x * sn, e[1] + u.y * c + t.y * sn, e[2] + u.z * c + t.z * sn]; };
    for (let i = 0; i < n; i++) { this.quad(k(a, r0, i), k(a, r0, i + 1), k(b, r1, i + 1), k(b, r1, i), col, m); if (caps) { this.tri(a, k(a, r0, i + 1), k(a, r0, i), col, m); this.tri(b, k(b, r1, i), k(b, r1, i + 1), col, m); } }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(this.m, 1)); g.computeVertexNormals();
    return g;
  }
}

// The ore cart in RIDE SPACE: the eye is at the origin looking down -Z; the rail top is CAM_H below it.
// parts: 'body' (tub, nose, lamp, axle), 'wheels' (baked in, for the carts that are seen from outside)
function cartBody(S, col, opt = {}) {
  const { iron, rim, strap, band } = col, yr = -0.99, yf = -1.13, yb = -1.5, zb = 0.55, zf = -1.9, z1 = -1.25, wt = 0.72, wb = 0.58;
  for (const s of [-1, 1]) {                         // side walls: a pentagon, the rim sloping down to the low front
    const A = [s * wt, yr, zb], B = [s * wt, yr, z1], C = [s * wt, yf, zf], D = [s * wb, yb, zf], E = [s * wb, yb, zb];
    S.tri(A, B, E, iron); S.tri(B, D, E, iron); S.tri(B, C, D, iron);
    S.bar(A, B, 0.07, rim); S.bar(B, C, 0.07, rim);
    for (const z of [0.2, -0.5, -1.2]) S.bar([s * (wt + 0.012), yr - 0.03, z], [s * (wb + 0.012), yb, z], 0.05, strap);
    if (band) S.quad([s * (wt * 0.93 + 0.02), -1.14, zb], [s * (wt * 0.93 + 0.02), -1.14, zf], [s * (wt * 0.86 + 0.02), -1.3, zf], [s * (wt * 0.86 + 0.02), -1.3, zb], band);
  }
  S.quad([-wt, yf, zf], [wt, yf, zf], [wb, yb, zf], [-wb, yb, zf], iron); S.bar([-wt, yf, zf], [wt, yf, zf], 0.07, rim);
  S.quad([-wt, yr, zb], [wt, yr, zb], [wb, yb, zb], [-wb, yb, zb], iron); S.bar([-wt, yr, zb], [wt, yr, zb], 0.07, rim);
  S.quad([-wb, -1.44, zb], [wb, -1.44, zb], [wb, -1.44, zf], [-wb, -1.44, zf], strap);          // the bed
  for (let i = -3; i <= 3; i++) S.box(i * 0.2, yf - 0.07, zf - 0.012, 0.035, 0.035, 0.03, rim);    // rivets along the front
  if (band) S.quad([-wt * 0.93, -1.14, zb + 0.02], [wt * 0.93, -1.14, zb + 0.02], [wt * 0.86, -1.3, zb + 0.02], [-wt * 0.86, -1.3, zb + 0.02], band);
  // the sloped nose and the buffer
  const nz = -3.3, ny = -1.3, nw = 0.24, tw = wt * 0.9;
  S.quad([-tw, yf - 0.06, zf], [tw, yf - 0.06, zf], [nw, ny, nz], [-nw, ny, nz], iron);
  for (const s of [-1, 1]) { S.quad([s * tw, yf - 0.06, zf], [s * nw, ny, nz], [s * nw, yb, nz], [s * wb, yb, zf], strap); S.bar([s * tw, yf - 0.06, zf], [s * nw, ny, nz], 0.05, rim); }
  S.box(0, -1.4, nz - 0.04, 0.62, 0.16, 0.1, rim);
  S.bar([-0.56, -1.38, -3.02], [0.56, -1.38, -3.02], 0.07, strap); S.bar([-0.56, -1.38, -0.3], [0.56, -1.38, -0.3], 0.07, strap);   // axles
  // the carbide lamp on its bracket at the front left: a round water tank over the generator, a polished dish with a
  // rolled rim, the small flame behind its glass
  const lx = -0.66, ly = -0.86, lz = -2.14, brass = [0.2, 0.19, 0.17];
  S.bar([-wt, yf - 0.02, zf + 0.04], [lx, ly - 0.14, lz + 0.1], 0.04, strap); S.bar([lx, ly - 0.14, lz + 0.1], [lx, ly - 0.02, lz + 0.1], 0.035, strap);
  S.cyl([lx, ly - 0.13, lz + 0.1], [lx, ly + 0.03, lz + 0.1], 0.075, 0.075, strap, 0, 10);                  // generator
  S.cyl([lx, ly + 0.03, lz + 0.1], [lx, ly + 0.12, lz + 0.1], 0.062, 0.05, brass, 0, 10);                   // water tank
  S.cyl([lx, ly + 0.12, lz + 0.1], [lx, ly + 0.15, lz + 0.1], 0.02, 0.02, rim, 0, 6);                       // filler cap
  S.cyl([lx, ly, lz + 0.06], [lx, ly, lz - 0.05], 0.035, 0.05, strap, 0, 8, false);                         // the neck to the dish
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * TAU, a1 = ((i + 1) / 16) * TAU, P = (r, z, a) => [lx + Math.cos(a) * r, ly + Math.sin(a) * r, lz + z];
    S.quad(P(0.045, -0.04, a0), P(0.045, -0.04, a1), P(0.11, -0.1, a1), P(0.11, -0.1, a0), [0.42, 0.44, 0.5], 4);
    S.quad(P(0.11, -0.1, a0), P(0.11, -0.1, a1), P(0.15, -0.17, a1), P(0.15, -0.17, a0), [0.5, 0.52, 0.58], 4);
    S.quad(P(0.15, -0.17, a0), P(0.15, -0.17, a1), P(0.165, -0.165, a1), P(0.165, -0.165, a0), brass, 0);    // rolled rim
    S.quad(P(0.05, -0.035, a0), P(0.05, -0.035, a1), P(0.165, -0.165, a1), P(0.165, -0.165, a0), strap, 0);   // the dark back of the dish
    S.tri([lx, ly, lz - 0.075], P(0.022, -0.05, a0), P(0.022, -0.05, a1), [1, 1, 1], 2);
  }
  // strap highlights and rivets along the rim, so the tub holds up at arm's length
  for (const sd of [-1, 1]) for (let z = zb - 0.12; z > z1; z -= 0.26) S.box(sd * (wt + 0.02), yr - 0.09, z, 0.03, 0.035, 0.035, rim);
  for (let i = -3; i <= 3; i++) S.box(i * 0.2, yr - 0.09, zb + 0.012, 0.035, 0.035, 0.03, rim);
  if (opt.wheels) for (const z of [-3.02, -0.3]) for (const s of [-1, 1]) S.wheel(s * 0.5, -1.38, z, 0.32, 0.05, strap, rim);
}
const LAMP_LOCAL = new V3(-0.66, -0.86, -2.3);
function oreHeap(S, rng, root, tip, n = 16) {
  for (let i = 0; i < 5; i++) S.box(rng.range(-0.3, 0.3), -1.4, rng.range(-1.7, -0.6), rng.range(0.3, 0.5), 0.12, rng.range(0.3, 0.5), root.map((v) => v * 0.5), 3);
  for (let i = 0; i < n; i++) {
    const len = rng.range(0.2, 0.42), x = rng.range(-0.46, 0.46), z = rng.range(-1.72, -0.55), k = rng.range(0.7, 1.3);
    S.point([x, -1.4 + rng.range(0, 0.07), z], [rng.range(-0.8, 0.8), rng.range(0.35, 1), rng.range(-0.8, 0.8)], len, len * rng.range(0.22, 0.34), root.map((v) => v * k), tip.map((v) => v * k), 3);
  }
}

// ---------------------------------------------------------------- shaders (built on the hero's light model, G = hero.lib.glsl)
const LAMP_VS = /* glsl */`
float lampAt(vec3 p){
  vec3 lp=uLampPos.xyz-p; float ld=length(lp);
  float cone=smoothstep(uLampDir.w,mix(uLampDir.w,1.0,0.45),dot(-lp/max(ld,1e-3),uLampDir.xyz));
  return uLampPos.w*cone/(1.0+ld*ld*0.003)*(1.0-smoothstep(uLampRange*0.73,uLampRange*1.13,ld));
}`;
function makeShaders(G) {
  const sh = {};
  sh.ROCK_VS = G.VS_PARS + /* glsl */`
attribute float aZone; varying float vZone;
void main(){
  vP=position; vN=normal; vZone=aZone;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
  sh.ROCK_FS = G.FS_PARS + /* glsl */`
uniform vec3 uRoot, uTip, uMilk, uCast2; uniform float uRoom, uCham; varying float vZone;
float rockH(vec3 p){ return vn3(p*1.25)*0.56+vn3(p.zxy*4.3+vec3(3.1,7.7,1.3))*0.32+vn3(p.yzx*12.5+vec3(5.0,1.0,9.0))*0.12; }
void main(){
  vec3 toC=uCamL-vP; float dist=length(toC); vec3 V=toC/max(dist,1e-3);
  vec3 Ng=normalize(vN); if(dot(Ng,V)<0.0) Ng=-Ng;
  // the noise lattice is turned off the world axes so no grain lines up with the tunnel
  vec3 rp=vec3(dot(vP,vec3(0.80,0.36,-0.48)),dot(vP,vec3(-0.60,0.48,-0.64)),dot(vP,vec3(0.0,0.80,0.60)));
  float n1=vn3(rp*0.31), n2=vn3(rp*1.1+11.0)*0.6+vn3(rp.yzx*2.7+2.0)*0.4, n3=vn3(rp*5.3)*0.6+vn3(rp.zxy*11.0+4.0)*0.4;
  // hewn relief: a smooth two-scale height field, its slope taken by central steps (no screen derivatives), raked by the lamp
  float e=0.045, h0=rockH(rp);
  vec3 g=vec3(rockH(rp+vec3(e,0.0,0.0)),rockH(rp+vec3(0.0,e,0.0)),rockH(rp+vec3(0.0,0.0,e)))-h0;
  vec3 gw=vec3(dot(g,vec3(0.80,-0.60,0.0)),dot(g,vec3(0.36,0.48,0.80)),dot(g,vec3(-0.48,-0.64,0.60)))/e;   // back to world axes
  vec3 N=normalize(Ng-(gw-Ng*dot(gw,Ng))*0.3);
  float strata=smoothstep(0.25,0.75,0.5+0.5*sin(vP.y*1.9+n1*6.0+n2*1.2));      // beds lying nearly flat, warped
  vec3 alb=mix(vec3(0.06,0.05,0.055),vec3(0.27,0.225,0.2),clamp(n1*0.5+n2*0.3+h0*0.3-0.05,0.0,1.0))*(0.72+0.5*n3)*(0.82+0.3*strata);   // a warm grey host rock: the lamp shows it as stone
  float fineK=1.0-smoothstep(5.0,16.0,dist);
  alb*=mix(1.0,0.68+0.64*vn3(rp*27.0+vec3(1.0,4.0,7.0)),fineK);               // grit close to: no smooth expanses at arm's length
  float frost=smoothstep(1.2,2.0,vZone);                                      // the throat: amethyst frost
  alb=mix(alb,uRoot*(0.5+0.9*n2),max(0.22*smoothstep(0.45,0.8,n2),frost*0.8));
  // the second mineral crusts the rock in zones, and rust runs down the beds from the seams
  float z2=smoothstep(0.48,0.66,vn3(rp*0.055+vec3(9.0,3.0,5.0)));
  alb=mix(alb,uCast2*(0.1+0.3*n2),z2*(0.4+0.4*frost));
  float rust=smoothstep(0.52,0.78,vn3(rp*vec3(0.16,0.05,0.16)+vec3(2.0,8.0,4.0)))*(1.0-frost);
  alb=mix(alb,vec3(0.34,0.17,0.07)*(0.55+0.8*n3),rust*0.5);
  // quartz seams: sheets of ridged noise cutting the wall, thick and thin, each with its own sparkle
  float vc=dot(rp,vec3(0.22,0.9,0.37))*0.5+(vn3(rp*0.3+31.0)-0.5)*2.4+(n2-0.5)*0.16;
  float vd=abs(fract(vc)-0.5), vw=0.008+0.05*smoothstep(0.45,0.85,vn3(rp*0.7+9.0));
  float vein=(1.0-smoothstep(vw*0.35,vw,vd))*smoothstep(0.42,0.62,vn3(rp*0.21+5.0))*(1.0-frost);
  vec3 Lk; vec3 E=geodeLight(vP,N,Lk);
  float lum=dot(E,vec3(0.3,0.5,0.2));
  float aa=1.0-smoothstep(9.0,30.0,dist);                                     // fine sparkle only where a pixel can hold it
  vec3 cq=rp*mix(11.0,7.0,frost); vec3 cell=floor(cq); vec3 ch=h33(cell);
  float pt=(1.0-smoothstep(0.07,mix(0.24,0.42,frost),length(fract(cq)-0.5)))*aa;   // a point of light at the heart of the cell, not a lit tile
  float gl=facetGlint(V,ch.x*7.0,0.9)*step(mix(0.94,0.62,frost),ch.y)*pt;
  float vsp=facetGlint(V,ch.z*5.0+1.7,0.8)*pt;
  alb=mix(alb,uMilk*(0.34+0.2*n3),vein*0.7);
  vec3 col=alb*E+uMilk*vein*lum*(0.05+1.4*vsp);
  // wet rock answers the lamp
  vec3 ll=normalize(uLampPos.xyz-vP+vec3(0.0,1e-4,0.0));
  float sp=pow(max(dot(reflect(-V,N),ll),0.0),26.0)*smoothstep(0.4,0.75,n2+0.25*strata);
  col+=uMilk*(sp*lum*0.20);
  col+=mix(uMilk,uTip,0.3+0.6*frost)*(gl*lum*mix(1.2,2.4,frost));              // wet sparkle, frost glitter
  // the rooms hold a breath of their own colour, so the gallery has walls and a roof beyond the lamp, and a few wet
  // points of light hang in that dark
  float room=uRoom*smoothstep(0.35,1.0,vZone)+uCham*(1.0-smoothstep(0.0,0.6,vZone));   // the loading chamber, seen first through the portal before ours, is never a black floor
  col+=(mix(uRoot,uCast2*0.22,z2*0.75)*0.8+alb*uMilk*0.6)*room*(0.10+0.34*n1+0.22*h0)*(0.6+0.4*Ng.y+0.35*strata);   // the breath takes the colour of what it falls on: rock, rust, either mineral
  col+=mix(uTip,uMilk,0.5)*(room*2.0*facetGlint(V,ch.x*3.0+ch.z,0.93)*step(0.97,ch.y)*(1.0-smoothstep(0.07,0.3,length(fract(cq)-0.5)))*(1.0-smoothstep(30.0,70.0,dist)));
` + G.FS_END + '}';

  sh.PROP_VS = G.VS_PARS + /* glsl */`
attribute vec3 color; attribute float aM; varying vec3 vC; varying float vM; varying vec3 vL;
void main(){
  vec4 wp=modelMatrix*vec4(position,1.0);
  vP=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); vC=color; vM=aM; vL=position;
  vec4 mvPosition=viewMatrix*wp;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
  sh.PROP_FS = G.FS_PARS + /* glsl */`
uniform vec3 uSpillPos, uRoot, uTip; uniform float uSpillK, uEmis;
varying vec3 vC; varying float vM; varying vec3 vL;
void main(){
  vec3 V=normalize(uCamL-vP); vec3 N=normalize(vN); if(dot(N,V)<0.0) N=-N;
  vec3 Lk; vec3 E=geodeLight(vP,N,Lk);
  vec3 sd=uSpillPos-vP; float r2=dot(sd,sd);
  E+=uLampCol*(uSpillK*0.3/(0.2+r2))*max(dot(N,sd*inversesqrt(max(r2,1e-4)))*0.6+0.4,0.0);   // the lamp's own spill
  E/=1.0+0.3*dot(E,vec3(0.3,0.5,0.2));                                                           // iron never bleaches in the column
  float n=vn3(vL*7.0)*0.6+vn3(vL*23.0)*0.4;
  float fres=pow(1.0-max(dot(N,V),0.0),3.0); float lum=dot(E,vec3(0.3,0.5,0.2));
  vec3 col=vC*(0.7+0.6*n)*(E+uAmbCol*0.5+uDarkCol*1.5)+vC*(fres*lum*0.25);
  if(vM>3.5){ col=vC*(E*1.3+fres*lum*0.8)+vec3(0.5)*uEmis*0.12; }                                // polished dish
  else if(vM>2.5){ float gl=facetGlint(V,h11(dot(floor(vL*9.0+0.5),vec3(1.0,5.0,11.0))),0.9);
    col=vC*E*1.5+uTip*(fres*lum*0.5+gl*uGlint*(0.1+lum)*1.2); }                                  // ore
  else if(vM>1.5){ col=vC*uEmis; }                                                               // flame
` + G.FS_END + '}';

  sh.BAT_VS = /* glsl */`
attribute vec4 aC; attribute vec4 aD; attribute float aWing;
uniform float uTime, uPx, uLampRange, uExo, uBatK; uniform vec4 uLampPos, uLampDir; uniform vec3 uShaftA, uShaftB;
varying float vLit;
#include <fog_pars_vertex>
` + LAMP_VS + /* glsl */`
void main(){
  vec3 c=aC.xyz; float hang=aD.w, ph=aC.w, vis=1.0; vec3 fw=aD.xyz;
#ifdef EXODUS
  float sd=aC.w, dir=sd>0.5?1.0:-1.0;
  float y=uExo-aC.y+sin(uTime*0.7+sd*40.0)*3.0;
  vec3 ax=mix(uShaftA,uShaftB,clamp(y/193.0,0.0,1.0));
  float ang=aC.z+uTime*(0.5+0.5*fract(sd*7.0))*dir+y*0.02;
  float r=aC.x*(0.85+0.15*sin(uTime*0.9+sd*60.0));
  c=vec3(ax.x+cos(ang)*r,y,ax.z+sin(ang)*r); fw=normalize(vec3(-sin(ang)*dir,0.9,cos(ang)*dir)); hang=0.0; ph=sd;
  vis=step(1.0,y)*step(y,186.0);
#endif
  fw=normalize(fw+vec3(0.0,1e-4,0.0));
  vec3 rt=normalize(cross(fw,vec3(0.0,1.0,0.0))+vec3(1e-3,0.0,0.0)); vec3 upv=cross(rt,fw);
  vec4 mvC=modelViewMatrix*vec4(c,1.0);
  float s=max(1.0,1.4*max(-mvC.z,0.1)/(uPx*0.55))*vis*uBatK;
  float flap=sin(uTime*(15.0+fract(ph*7.0)*6.0)+ph*90.0)*(1.0-hang);
  vec3 lp=position*s; lp.x*=mix(1.0,0.3,hang); lp.y+=aWing*(flap*0.5-hang*0.35+0.16)*s;
  vec3 p=c+rt*lp.x+upv*lp.y+fw*lp.z;
  vec3 tl=c-uLampPos.xyz; float tld=length(tl);
  vLit=uLampPos.w*smoothstep(-0.2,0.6,dot(tl/max(tld,1e-3),uLampDir.xyz))/(1.0+tld*tld*0.0022);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
  sh.BAT_FS = /* glsl */`
uniform vec3 uLampCol; varying float vLit;
#include <fog_pars_fragment>
void main(){
  gl_FragColor=vec4(vec3(0.006,0.005,0.01)+vec3(0.14,0.14,0.165)*uLampCol*vLit,1.0);   // pale fur in the lamp, dark flecks against the daylight
  #include <fog_fragment>
}`;

  sh.WPT_VS = /* glsl */`
attribute vec4 aPt;                         // type, seed, size (m), speed
uniform vec3 uShaftA, uShaftB, uShaftCol, uMilk, uLampCol, uPtCol; uniform vec4 uLampPos, uLampDir, uDive, uWc;
uniform float uTime, uPx, uCloud, uLampRange;
varying float vTy; varying vec3 vCol; varying float vSz;
#include <fog_pars_vertex>
` + LAMP_VS + /* glsl */`
void main(){
  float ty=aPt.x, sd=aPt.y; vec3 p=position; float a=1.0, size=aPt.z; vec3 col=vec3(0.0);
  if(ty<1.5){                                // dust motes (0) and pale moths (1): seen only in the lamp beam
    float k=ty<0.5?0.35:1.5;
    p+=vec3(sin(uTime*0.31*k+sd*40.0),sin(uTime*0.23*k+sd*71.0)*0.6,cos(uTime*0.27*k+sd*13.0))*k;
    if(ty>0.5) a*=0.6+0.4*sin(uTime*(9.0+sd*8.0)+sd*60.0);
    col=uMilk*uLampCol*(lampAt(p)*(ty<0.5?0.16:0.3));
  } else if(ty<2.5){                         // drips from the roof
    float life=fract(uTime*aPt.w+sd); p.y-=life*life*2.9;
    col=uMilk*uLampCol*(lampAt(p)*0.3)+uMilk*0.004;
  } else if(ty<4.5){                         // rain (3) and snow (4) down the column: position = (radius, y0, angle)
    float span=uShaftB.y-uShaftA.y-4.0;
    float y=mod(position.y-uTime*aPt.w,span)+1.0;
    float sn=step(3.5,ty);
    float ang=position.z+sn*sin(uTime*0.5+sd*30.0)*0.25;
    vec3 ax=uShaftA+(uShaftB-uShaftA)*((y-uShaftA.y)/(uShaftB.y-uShaftA.y));
    float r=position.x+sn*sin(uTime*0.6+sd*91.0)*1.5;
    p=vec3(ax.x+cos(ang)*r,y,ax.z+sin(ang)*r);
    col=uShaftCol*uCloud*mix(0.3,0.5,sn); a=smoothstep(0.0,3.0,y);
  } else if(ty<5.5){                         // splinters and stones falling with the cart
    p+=uDive.xyz*(uDive.w*aPt.w)+vec3(sin(uTime*1.3+sd*30.0),0.0,cos(uTime*1.1+sd*50.0))*0.3;
    a=smoothstep(0.0,5.0,uDive.w); col=(uShaftCol*uCloud*0.22+0.02)*mix(vec3(0.5,0.48,0.55),uMilk,fract(sd*9.0));
  } else if(ty<6.5){ p=uWc.xyz; a=uWc.w; col=uLampCol*0.5; }                   // the loose cart's lamp
  else { a=0.85+0.15*sin(uTime*13.0+sd*30.0)*sin(uTime*7.3+sd*11.0); col=uPtCol*aPt.w; }   // hanging lamps
  vTy=ty; vCol=col*a;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  float ps=size*uPx/max(-mvPosition.z,0.5);
  if(ty<0.5){ vCol*=min(1.0,ps*ps/5.0); ps=clamp(ps,1.6,3.2); }                // dust: a soft mote a pixel or two across
  else if(ty>2.5&&ty<3.5){ vCol*=1.0-0.75*smoothstep(60.0,170.0,-mvPosition.z); ps=clamp(ps,22.0,60.0); }   // rain: long threads
  else ps=clamp(ps,1.0,ty>5.5?140.0:80.0);
  vSz=ps; gl_PointSize=ps;
  #include <fog_vertex>
}`;
  sh.WPT_FS = /* glsl */`
varying float vTy; varying vec3 vCol; varying float vSz;
#include <fog_pars_fragment>
void main(){
  vec2 c=gl_PointCoord-0.5; float d=length(c)*2.0, s;
  if(vTy<0.5) s=exp(-d*d*3.2);
  else if(vTy<1.5) s=1.0-smoothstep(0.25,1.0,max(abs(c.x)*1.3,abs(c.y)*3.0)*2.0);
  else if(vTy<2.5) s=(1.0-smoothstep(0.0,0.22,abs(c.x)))*(1.0-smoothstep(0.6,1.0,abs(c.y)*2.0));
  else if(vTy<3.5) s=(1.0-smoothstep(0.35,1.0,abs(c.x)*vSz))*(1.0-smoothstep(0.2,1.0,abs(c.y)*2.0));
  else if(vTy<4.5) s=1.0-smoothstep(0.2,1.0,d);
  else if(vTy<5.5) s=1.0-smoothstep(0.5,0.7,max(abs(c.x)*2.6,abs(c.y)));
  else s=exp(-d*d*7.0)*1.6+exp(-d*d*90.0)*6.0;
  vec3 col=vCol*s*(vTy>2.5&&vTy<3.5?1.0:1.0-smoothstep(0.92,1.0,d));
` + G.FS_ADD_FOG + /* glsl */`
  gl_FragColor=vec4(col,1.0);
}`;

  sh.SPARK_VS = /* glsl */`
attribute vec4 aSp;                         // type (0 spark, 1 lamp halo), seed, side, -
uniform float uTime, uPx, uSpark, uFlame;
varying vec2 vS;
void main(){
  vec3 p=position; float a, size;
  if(aSp.x<0.5){
    float rate=2.2+aSp.y*2.0, ph=uTime*rate+aSp.y*17.0, life=fract(ph);
    vec3 v=vec3(aSp.z*(0.3+1.7*fract(aSp.y*7.3)),0.4+2.2*fract(aSp.y*3.1),2.0+4.0*fract(aSp.y*5.7));
    p+=v*life*0.45; p.y-=2.2*life*life;
    a=(1.0-life)*uSpark*step(fract(aSp.y*11.0+floor(ph)*0.37),uSpark*0.8+0.1); size=0.06;
  } else { a=uFlame; size=1.1; }
  vS=vec2(aSp.x,a);
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(size*uPx/max(-mv.z,0.3),1.5,220.0);
}`;
  sh.SPARK_FS = /* glsl */`
uniform vec3 uLampCol; varying vec2 vS;
void main(){
  vec2 c=gl_PointCoord-0.5; float d=length(c)*2.0;
  vec3 col=vS.x<0.5?vec3(0.7,0.86,1.0)*(5.0*(1.0-smoothstep(0.3,1.0,d))):uLampCol*(exp(-d*d*7.0)*0.07+exp(-d*d*38.0)*0.20+exp(-d*d*420.0)*0.9);
  gl_FragColor=vec4(col*vS.y*(1.0-smoothstep(0.9,1.0,d)),1.0);
}`;
  return sh;
}

export default {
  id: 'geode-run', name: 'The Geode Run', category: 'interior', weirdness: 0.25,
  media: ['rail', 'interior'],
  async build(ctx) {
    const V = pickLook(ctx.rng.fork('vary'), ctx.vary), LK = LOOKS[V.look];
    const rng = ctx.rng.fork('world'), noise = ctx.noise;
    const detail = (ctx.quality && ctx.quality.detail) || 1, dens = V.density;
    const palette = MINERALS[V.mineral].slice();
    if (V.look === 'winter') palette[6] = '#6E717E';                             // frosted timber
    const pc = palette.map((h) => new THREE.Color(h)), rgb = (c, k = 1) => [c.r * k, c.g * k, c.b * k];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette[0]).multiplyScalar(0.35);
    scene.fog = new THREE.FogExp2(new THREE.Color(palette[0]).multiplyScalar(0.5), 0.011);

    // ---- the hero, unmoved: hero-local space is world space
    const hero = await buildHero(ctx, { palette, cutaway: false, haze: 0.003 * LK.fogK, glint: 0.72 });
    scene.add(hero.object);
    const A = hero.anchors, U = hero.uniforms, lib = hero.lib, G = lib.glsl, HL = lib.layout, sh = makeShaders(G);
    U.uShaftCol.value.set(LK.shaft).multiplyScalar(LK.shaftK); U.uAmbCol.value.multiplyScalar(LK.amb); U.uHazeCol.value.multiplyScalar(LK.haze);
    U.uSkyA.value.setRGB(...LK.skyA); U.uSkyB.value.setRGB(...LK.skyB); U.uStars.value = LK.stars;
    U.uFallK.value = LK.fallK; U.uFrozen.value = LK.frozen; U.uLampRange.value = 56; U.uLampCol.value.setRGB(1.0, 0.7, 0.38).multiplyScalar(2.5); U.uDarkCol.value.multiplyScalar(3);   // the carbide flame: warm, against the cold of the crystal
    const haze0 = U.uHaze.value;
    U.uGlowA.value.set(GLOWS[V.mineral][0]); U.uGlowB.value.set(GLOWS[V.mineral][1]); U.uGlowK.value = V.look === 'night' ? 0.6 : 1;
    // the geode's second mineral, grown in zones among the first: one of the other two casts, drawn from a stream of its own
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    U.uCast2.value.set(MINERALS[own('geode-cast2').pick(Object.keys(MINERALS).filter((m) => m !== V.mineral))][2]);
    const rngC = ctx.rng.fork('cham');                                         // the chamber druse draws from a fork of its own
    if (V.doves) U.uBirdCol.value.setRGB(0.5, 0.54, 0.62).multiplyScalar(0.25 + 0.3 * LK.shaftK);
    if (V.glow) U.uBkGlow.value.setRGB(0.22, 1.25, 0.42);
    if (V.look === 'winter') U.uMilk.value.multiplyScalar(1.04);
    const tmpA = new V3(), tmpB = new V3(), tmpC = new V3(), m4 = new THREE.Matrix4(), up = new V3(0, 1, 0);
    await ctx.yield();

    // ---- the line of the mine: s = metres back up the track from the throat mouth (the hero's entry), z = e0.z + s
    const e0 = A.entry.position, S0 = 300, DS = 0.25, DUCK_S = 262, FORK_S = 234;
    const ph0 = rng.range(0, TAU), swingS = rng.range(100, 122), swingSign = rng.sign(), galA = rng.range(8, 11.5);
    const tunShift = (s) => 2.2 * smoothstep(228, 240, s) + 0.7 * Math.sin((s - 190) * 0.06) * smoothstep(192, 206, s) * (1 - smoothstep(268, 282, s));
    const galLat = (s) => { const g = clamp((s - 40) / 142, 0, 1), env = Math.sin(Math.PI * g) ** 2; return env * (galA * Math.sin(TAU * g * 1.15 + ph0) + swingSign * 5 * Math.exp(-(((s - swingS) / 14) ** 2))); };
    const slope = (s) => lerp(lerp(lerp(0.07, 0.08, smoothstep(34, 44, s)), 0.0875, smoothstep(182, 194, s)), 0, smoothstep(276, 286, s));
    const NF = Math.round(S0 / DS), fy = new Float32Array(NF + 1); fy[0] = e0.y;
    for (let i = 1; i <= NF; i++) fy[i] = fy[i - 1] + slope((i - 0.5) * DS) * DS;
    const railY = (s) => (s <= 0 ? e0.y + 0.07 * s : s >= S0 ? fy[NF] : lerp(fy[Math.floor(s / DS)], fy[Math.min(NF, Math.floor(s / DS) + 1)], s / DS - Math.floor(s / DS)));
    // the hero's approach leaves the throat mouth already swinging left toward the column: the throat bends to meet it
    const ed = A.entry.direction, bendK = ed.x / (ed.z || -1), BL = 36;         // dx/ds at the mouth (s runs back up the track, +Z)
    const bendX = (s) => bendK * (s <= 0 ? s : s >= BL ? BL * 0.5 : s - (s * s * s) / (BL * BL) + (s * s * s * s) / (2 * BL * BL * BL));
    const railX = (s) => e0.x + tunShift(s) + galLat(s) + bendX(s), zAt = (s) => e0.z + s;
    const pre = [];                                                           // rail-top points every ~1.5 m, entry of the world first
    {
      let len = 0; const acc = [0];
      for (let i = NF; i > 0; i--) { const s1 = i * DS, s0 = s1 - DS; len += Math.hypot(railX(s1) - railX(s0), railY(s1) - railY(s0), DS); acc.push(len); }
      const n = Math.round(len / 1.5); let j = 0;
      for (let k = 0; k <= n; k++) {
        const d = (k / n) * len; while (j < NF - 1 && acc[j + 1] < d) j++;
        const s = S0 - (j + (d - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j])) * DS;
        let hx = railX(s - 0.4) - railX(s + 0.4), hz = -0.8; const hl = Math.hypot(hx, hz); hx /= hl; hz /= hl;
        pre.push({ x: railX(s), y: railY(s), z: zAt(s), hx, hz, s });
      }
    }
    const pts = [];
    for (let i = 0; i < pre.length - 2; i += 2) { const p = pre[i]; pts.push(new V3(p.x, p.y + CAM_H - 0.42 * Math.exp(-(((p.s - DUCK_S) / 3.2) ** 2)), p.z)); }
    for (const p of A.flyThrough) pts.push(p.clone());
    await ctx.yield();
    const path = makePath(pts, { samples: 700 });
    await ctx.yield();
    const PL = path.length, NP = Math.ceil(PL), PP = new Float32Array((NP + 1) * 3);
    for (let i = 0; i <= NP; i++) { path.posAtDist(Math.min(i, PL), tmpA); PP[i * 3] = tmpA.x; PP[i * 3 + 1] = tmpA.y; PP[i * 3 + 2] = tmpA.z; }
    const pathP = (d, out) => { const f = clamp(d, 0, NP - 0.001), i = Math.floor(f), t = f - i; return out.set(lerp(PP[i * 3], PP[i * 3 + 3], t), lerp(PP[i * 3 + 1], PP[i * 3 + 4], t), lerp(PP[i * 3 + 2], PP[i * 3 + 5], t)); };
    const distOf = (p) => { let b = 1e9, bi = 0; for (let i = 0; i <= NP; i++) { const dx = PP[i * 3] - p.x, dy = PP[i * 3 + 1] - p.y, dz = PP[i * 3 + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < b) { b = d; bi = i; } } return bi; };
    const entryD = distOf(A.flyThrough[0]), railEndD = distOf(tmpB.copy(A.railEnd.position).setY(A.railEnd.position.y + CAM_H));
    const dOfS = (s) => entryD * (1 - s / S0);                                 // path distance of a point of the mine (close enough for cues)
    await ctx.yield();

    // ---- the rock: one tube swept back from the throat mouth through throat, gallery, tunnel and loading chamber
    const KEYS = [   // s, half-width left (-X), right (+X), roof above the rail, floor below it, roughness, zone (0 mine, 1 gallery, 2 throat)
      [-1.5, 5.5, 5.5, 7.7, 3.3, 0.05, 2], [28, 6.4, 6.4, 8.6, 3.6, 0.06, 2], [36, 8, 8, 10, 4.2, 0.08, 2], [48, 23, 23, 25, 7.5, 0.14, 1], [72, 30, 30, 34, 9, 0.16, 1],
      [158, 30, 30, 31, 9, 0.16, 1], [180, 11, 11, 11, 3, 0.12, 1], [189.5, 2.6, 2.6, 4.2, 0.6, 0.08, 0], [192, 1.9, 1.9, 3.3, 0.45, 0.05, 0], [281, 1.9, 1.9, 3.3, 0.45, 0.05, 0],
      [283, 2.6, 2.6, 4.0, 0.5, 0.06, 0], [285.5, 8, 8, 8.4, 0.5, 0.07, 0], [293.6, 8, 8, 8.4, 0.5, 0.07, 0],
      [296.6, 8.6, 8.6, 9.8, 7.6, 0.08, 0], [315, 8.6, 8.6, 9.8, 7.6, 0.08, 0], [318, 0.3, 0.3, 0.3, 0.1, 0, 0]];   // behind s = 294 the floor is a sump 7.6 m deep (the way in crosses it on staging)
    const prmOut = [0, 0, 0, 0, 0, 0], uCham = { value: 2.2 };
    const prm = (s) => {
      let k = 0; while (k < KEYS.length - 2 && KEYS[k + 1][0] < s) k++;
      const a = KEYS[k], b = KEYS[k + 1], t = smoothstep(a[0], b[0], s);
      for (let i = 0; i < 6; i++) prmOut[i] = lerp(a[i + 1], b[i + 1], t);
      prmOut[1] += 3.4 * bell(s, 221, 246, 0.3);                               // the alcove of the boarded branch
      return prmOut;
    };
    const tubeX = (s) => e0.x + tunShift(s) + bendX(s);
    const surf = (s, th, o) => {
      const q = prm(s), c = Math.cos(th), sn = Math.sin(th), cx = tubeX(s), ry = railY(s), z = zAt(s);
      const w = lerp(q[0], q[1], smoothstep(-0.3, 0.3, c)), h = lerp(q[3], q[2], smoothstep(-0.25, 0.25, sn));
      const px = w * Math.sign(c) * Math.pow(Math.abs(c), 0.75), py = h * Math.sign(sn) * Math.pow(Math.abs(sn), sn > 0 ? 0.75 : 0.45);
      const n = 1 + q[4] * (1.4 * noise.fbm3((cx + px) * 0.09, (ry + py) * 0.09, z * 0.09, 3) + 0.5 * noise.n3((cx + px) * 0.5, (ry + py) * 0.5, z * 0.5));
      o.x = cx + px * n; o.y = ry + py * (py > 0 ? n : 1); o.z = z; o.zone = q[5]; o.cx = cx; o.cy = ry + (q[2] - q[3]) * 0.5; return o;
    };
    {
      const ss = []; for (let s = -1.5; s <= 318; s += 1.6) ss.push(s); for (const k of KEYS) ss.push(k[0]);
      ss.sort((a, b) => a - b); const rings = ss.filter((s, i) => i === 0 || s - ss[i - 1] > 0.3);
      const NSEG = 40, P = [], N = [], Z = [], IDX = [], o = {};
      let ri = 0;
      for (const s of rings) {
        for (let j = 0; j <= NSEG; j++) {
          surf(s, (j / NSEG) * TAU - Math.PI / 2, o); P.push(o.x, o.y, o.z);
          const nx = o.cx - o.x, ny = o.cy - o.y, nl = Math.hypot(nx, ny) || 1; N.push(nx / nl, ny / nl, 0); Z.push(o.zone);
        }
        if ((++ri & 63) === 0) await ctx.yield();
      }
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < NSEG; j++) { const a = i * (NSEG + 1) + j, b = a + 1, c = a + NSEG + 1, d = c + 1; IDX.push(a, c, b, b, c, d); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('aZone', new THREE.Float32BufferAttribute(Z, 1)); geo.setIndex(IDX);
      const mesh = new THREE.Mesh(geo, lib.mkMat(sh.ROCK_VS, sh.ROCK_FS, { uRoom: { value: 2.4 }, uCham }, { side: THREE.DoubleSide }));
      mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- timber and iron of the mine (the hero's trestle material: instanced open boxes)
    const mats = [], tims = [], dirv = new V3(), P1 = new V3(), P2 = new V3(), lf = new V3(), hd = new V3();
    // what this round adds to the mine takes its grain and its seeds from a stream of its own, so the world's stream deals
    // the gallery, the frost and the bats exactly as before
    const rngN = own('geode-mine-new'); let timRng = rng;
    const member = (a, b, w, d, kind = 0, hint = null) => {
      dirv.copy(b).sub(a); const len = dirv.length(); if (len < 0.05) return;
      lib.setBasis(a, dirv, len, w, d, 0, m4, hint); for (let i = 0; i < 16; i++) mats.push(m4.elements[i]);
      tims.push(timRng(), kind, 0);
    };
    const mem = (ax, ay, az, bx, by, bz, w, d, kind = 0, hint = null) => member(P1.set(ax, ay, az), P2.set(bx, by, bz), w, d, kind, hint);
    const track = (ptsT, i0, i1, stilts) => {
      for (let i = i0; i <= i1; i++) {
        const p = ptsT[i]; lf.set(p.hz, 0, -p.hx); hd.set(p.hx, 0, p.hz);
        mem(p.x - lf.x, p.y - 0.24, p.z - lf.z, p.x + lf.x, p.y - 0.24, p.z + lf.z, 0.24, 0.17, 0, hd);
        if ((i - i0) % 2 === 0 && i + 2 <= i1) for (const sd of [-0.5, 0.5]) { const q = ptsT[i + 2]; mem(p.x + lf.x * sd, p.y - 0.07, p.z + lf.z * sd, q.x + q.hz * sd, q.y - 0.07, q.z - q.hx * sd, 0.1, 0.14, 2, lf); }
        if (!stilts || !stilts(p)) continue;
        if ((i - i0) % 3 === 0 && i + 3 <= i1) for (const sd of [-0.58, 0.58]) { const q = ptsT[i + 3]; mem(p.x + lf.x * sd, p.y - 0.55, p.z + lf.z * sd, q.x + q.hz * sd, q.y - 0.55, q.z - q.hx * sd, 0.26, 0.42, 0, lf); }
        if ((i - i0) % 6 === 0) {                                             // a low bent on two battered legs
          const drop = prm(p.s)[3] + 1.2, fl = p.y - drop;
          mem(p.x - lf.x * 1.6, p.y - 0.78, p.z - lf.z * 1.6, p.x + lf.x * 1.6, p.y - 0.78, p.z + lf.z * 1.6, 0.36, 0.44, 0, up);
          for (const sd of [-1, 1]) mem(p.x + lf.x * 1.25 * sd, p.y - 1.0, p.z + lf.z * 1.25 * sd, p.x + lf.x * (1.25 + drop * 0.11) * sd, fl, p.z + lf.z * (1.25 + drop * 0.11) * sd, 0.34, 0.34, 0, hd);
          if (drop > 4.5) { mem(p.x - lf.x * 1.5, p.y - 2.2, p.z - lf.z * 1.5, p.x + lf.x * 1.9, p.y - drop * 0.75, p.z + lf.z * 1.9, 0.18, 0.2, 0, hd); mem(p.x - lf.x * 1.9, p.y - drop * 0.75, p.z - lf.z * 1.9, p.x + lf.x * 1.9, p.y - drop * 0.75, p.z + lf.z * 1.9, 0.2, 0.24, 0, up); }
        }
      }
    };
    track(pre, 0, pre.length - 2, (p) => p.s < 188 || p.s > 294.5);
    // timber sets down the tunnel, lagging on the roof, the low beam, the boarded branch
    for (let s = 193.5, k = 0; s < 281; s += 4.5, k++) {
      const cx = tubeX(s), ry = railY(s), z = zAt(s), inAlc = s > 221 && s < 246, lean = rng.range(-0.12, 0.12);
      if (Math.abs(s - DUCK_S) < 2.3) { mem(cx - 1.85, ry + 2.78, zAt(DUCK_S), cx + 1.85, ry + 2.5, zAt(DUCK_S), 0.34, 0.36, 0, up); mem(cx - 1.55, ry - 0.45, zAt(DUCK_S) + 0.2, cx - 1.6, ry + 2.7, zAt(DUCK_S), 0.28, 0.28); mem(cx + 1.5, ry - 0.45, zAt(DUCK_S) - 0.2, cx + 1.62, ry + 2.45, zAt(DUCK_S), 0.28, 0.28); continue; }
      mem(cx - 1.55, ry - 0.45, z, cx - 1.5 + lean, ry + 2.95, z, 0.28, 0.28);
      if (!inAlc) mem(cx + 1.55, ry - 0.45, z, cx + 1.5 + lean, ry + 2.95, z, 0.28, 0.28); else mem(cx + 4.6, ry - 0.45, z, cx + 4.5, ry + 2.95, z, 0.28, 0.28);
      mem(cx - 1.8, ry + 3.06, z, cx + (inAlc ? 4.8 : 1.8), ry + 3.06 + lean * 0.5, z, 0.3, 0.32, 0, up);
      if (k % 2 === 0) for (const bx of [-1.1, -0.2, 0.75]) mem(cx + bx, ry + 3.24, z + 0.3, tubeX(s - 4.5) + bx + rng.range(-0.1, 0.1), railY(s - 4.5) + 3.24, zAt(s - 4.5) - 0.3, 0.42, 0.06, 0, up);
    }
    {
      const bx = e0.x + 2.2 + bendX(232), dead = [];
      for (let s = 240; s >= 225; s -= 1.5) dead.push({ x: bx, y: railY(s) - 0.02 - (240 - s) * 0.02, z: zAt(s), hx: 0, hz: -1, s });
      track(dead, 0, dead.length - 1, null);
      const zb = zAt(227.2), ry = railY(227.2);
      mem(bx - 0.95, ry + 0.55, zb, bx + 2.3, ry + 0.75, zb, 0.3, 0.06, 0, up); mem(bx - 0.95, ry + 1.65, zb, bx + 2.3, ry + 1.45, zb, 0.3, 0.06, 0, up);
      mem(bx - 0.9, ry - 0.3, zb - 0.08, bx + 2.2, ry + 2.5, zb - 0.08, 0.26, 0.06, 0, up); mem(bx - 0.9, ry + 2.4, zb - 0.12, bx + 2.2, ry - 0.2, zb - 0.12, 0.26, 0.06, 0, up);
    }
    // the loading chamber: a siding, the ore chute, a ladderway, picks against the wall, a coat on a nail and a lunch tin
    const ch = { x: tubeX(S0), y: railY(S0), fl: railY(S0) - 0.5 };
    {
      const side = []; for (let s = 313; s >= 287.5; s -= 1.5) side.push({ x: ch.x - 4.4 + 0.5 * smoothstep(300, 287, s), y: ch.y, z: zAt(s), hx: 0, hz: -1, s });
      track(side, 0, side.length - 1, (p) => p.s > 294.5);
      const zc = zAt(292.5);                                                   // chute from the right wall
      for (const dz of [-0.45, 0, 0.45]) mem(ch.x + 7.6, ch.y + 5.6, zc + dz, ch.x + 3.0, ch.y + 1.5, zc + dz, 0.42, 0.07, 0, hd.set(0, 0, 1));
      for (const dz of [-0.7, 0.7]) { mem(ch.x + 7.6, ch.y + 6.0, zc + dz, ch.x + 3.0, ch.y + 1.9, zc + dz, 0.07, 0.5, 0, hd.set(0, 0, 1)); mem(ch.x + 4.6, ch.fl, zc + dz, ch.x + 4.6, ch.y + 2.9, zc + dz, 0.22, 0.22); mem(ch.x + 6.3, ch.fl, zc + dz, ch.x + 6.3, ch.y + 4.4, zc + dz, 0.22, 0.22); }
      const zl = zAt(288.4);                                                   // ladderway
      for (const dx of [-0.3, 0.3]) mem(ch.x + 5.6 + dx, ch.fl, zl, ch.x + 6.9 + dx, ch.y + 7.6, zl + 0.4, 0.1, 0.1);
      for (let r = 0; r < 19; r++) { const t = (r + 0.5) / 19; mem(ch.x + 5.3 + 1.3 * t, ch.fl + 8.1 * t, zl + 0.4 * t, ch.x + 5.9 + 1.3 * t, ch.fl + 8.1 * t, zl + 0.4 * t, 0.06, 0.06); }
      for (let i = 0; i < 5; i++) {                                            // a row of picks
        const z = zAt(289.2 + i * 0.55), x = ch.x - 6.9 + rng.range(-0.15, 0.15);
        mem(x + 0.5, ch.fl, z, x, ch.fl + 1.05, z + rng.range(-0.1, 0.1), 0.05, 0.05); mem(x - 0.02, ch.fl + 1.02, z - 0.32, x + 0.06, ch.fl + 1.0, z + 0.32, 0.05, 0.07, 1);
      }
      const zn = zAt(286.4), xn = ch.x - 3.1;                                  // by the tunnel mouth: the coat, the tin
      mem(xn, ch.fl, zn, xn, ch.y + 2.4, zn, 0.24, 0.24);
      mem(xn + 0.9, ch.fl, zn + 0.5, xn + 0.9, ch.fl + 0.55, zn + 0.5, 0.7, 0.6);
      ch.coat = [xn + 0.1, ch.y + 1.85, zn + 0.15]; ch.tin = [xn + 0.9, ch.fl + 0.55, zn + 0.5];
    }
    await ctx.yield();

    // ---- the cold lamps (uPt): 0 hangs in the chamber, 1 marks the points, 2 rides the loose cart, 3 stands in the gallery (4 to 7: below)
    const galSide = rng.sign(), LAMPS = [
      new V3(ch.x + 2.0, ch.y + 3.9, zAt(291.5)), new V3(tubeX(239) - 1.35, railY(239) + 2.45, zAt(239)), new V3(0, -999, 0),
      new V3(railX(138) + 2.7 * galSide, railY(138) + 2.6, zAt(138))];
    const LAMP_W = [5.0, 0.9, 0, 1.3, 1.0, 1.5, 1.3, 1.0];
    mem(LAMPS[0].x, LAMPS[0].y + 0.25, LAMPS[0].z, LAMPS[0].x, ch.y + 9.2, LAMPS[0].z, 0.05, 0.05, 1);
    mem(LAMPS[3].x + 0.25 * galSide, railY(138) - prm(138)[3] - 1, LAMPS[3].z, LAMPS[3].x + 0.25 * galSide, LAMPS[3].y + 0.4, LAMPS[3].z, 0.2, 0.2);
    mem(LAMPS[3].x + 0.25 * galSide, LAMPS[3].y + 0.3, LAMPS[3].z, LAMPS[3].x - 0.2 * galSide, LAMPS[3].y + 0.3, LAMPS[3].z, 0.08, 0.08, 1);
    // more cold lamps down the line, so that no stretch of the mine is black beyond the cart's own lamp: 4 hangs at the
    // timber set nearest the midpoint between the chamber's lamp and the points' lamp, 5 is the lamp at the tunnel's
    // last set (the gallery's mouth), 6 stands in the gallery midway between its lamp and the throat, 7 midway down the throat
    {
      const sA = 193.5 + 4.5 * Math.round(((291.5 + 239) / 2 - 193.5) / 4.5), sG = (138 + 42) / 2, sT = 42 / 2;
      LAMPS.push(new V3(tubeX(sA) + 1.3, railY(sA) + 2.5, zAt(sA)), new V3(tubeX(193.5), railY(193.5) + 2.72, zAt(193.5) - 0.3),
        new V3(railX(sG) - 2.7 * galSide, railY(sG) + 2.6, zAt(sG)), new V3(railX(sT) + 2.9 * galSide, railY(sT) + 2.3, zAt(sT)));
      timRng = rngN;
      mem(LAMPS[4].x, LAMPS[4].y + 0.2, LAMPS[4].z, LAMPS[4].x, railY(sA) + 3.0, LAMPS[4].z, 0.05, 0.05, 1);
      for (const [i, s, sd] of [[6, sG, -galSide], [7, sT, galSide]]) {
        mem(LAMPS[i].x + 0.25 * sd, railY(s) - prm(s)[3] - 1, LAMPS[i].z, LAMPS[i].x + 0.25 * sd, LAMPS[i].y + 0.4, LAMPS[i].z, 0.2, 0.2);
        mem(LAMPS[i].x + 0.25 * sd, LAMPS[i].y + 0.3, LAMPS[i].z, LAMPS[i].x - 0.2 * sd, LAMPS[i].y + 0.3, LAMPS[i].z, 0.08, 0.08, 1);
      }
      timRng = rng;
    }

    // ---- the selenite gallery: beams lying at every angle; three of them the track only just misses
    const railP = (s, out) => out.set(railX(s), railY(s), zAt(s));
    const trackGap = (a, b) => {                    // least distance from a segment to the middle of the cart's clear box
      let best = 1e9;
      for (let i = 0; i + 2 < pre.length; i += 2) { const p = pre[i], q = pre[i + 2]; if (p.z < Math.min(a.z, b.z) - 60 || q.z > Math.max(a.z, b.z) + 60) continue; best = Math.min(best, lib.segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, p.x, p.y + 1.2, p.z, q.x, q.y + 1.2, q.z)); }
      return best;
    };
    const gBeams = [];
    const pushBeam = (c, d, len, w, minGap, blaze) => {
      const a = c.clone().addScaledVector(d, -len / 2), b = c.clone().addScaledVector(d, len / 2);
      if (trackGap(a, b) < w * 0.5 + minGap) return false;
      for (const o of gBeams) if (lib.segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, o.a.x, o.a.y, o.a.z, o.b.x, o.b.y, o.b.z) < (w + o.w) * 0.5 - 0.5) return false;
      gBeams.push({ a, b, w, wz: w * rng.range(0.55, 0.85), blaze, seed: rng() }); return true;
    };
    {
      const c = new V3(), d = new V3(), SQ = rng.range(126, 132), DK = rng.range(148, 158);
      railP(DK, c); c.y += CAM_H + 1.05 + 1.3; c.x += 3; pushBeam(c, d.set(1, 0.1, 0.4 * rng.sign()).normalize(), 46, 2.6, 2.0, 0.1);                   // duck under it
      for (const sd of [-1, 1]) { railP(SQ + sd * 0.8, c); c.x += sd * 3.6; c.y += 7; pushBeam(c, d.set(0.16 * sd, 1, 0.14 * sd).normalize(), 38, 2.2, 2.2, 0.08); }   // squeeze between two
      railP(swingS, c); c.x -= swingSign * 4.4; c.y += 5; pushBeam(c, d.set(0.08 * swingSign, 1, 0.42).normalize(), 42, 3.0, 2.3, 0.1);                 // swing round the third
      pushBeam(c.set(ch.x - 6.8, ch.y + 4.0, zAt(288.6)), d.set(0.45, 0.8, -0.25).normalize(), 8, 1.2, 3, 0.16);     // two blades already in the loading chamber
      pushBeam(c.set(ch.x + 6.9, ch.y + 6.4, zAt(297)), d.set(-0.55, 0.6, 0.3).normalize(), 8, 1.1, 3, 0.14);
      for (const sd of [-1, 1]) pushBeam(c.set(ch.x + sd * 4.7, ch.y + 3.4, zAt(285.3)), d.set(sd * 0.5, 0.78, 0.4).normalize(), 9.5, 1.35, 2.2, 0.2);   // the mouth of the tunnel wears them like tusks
      pushBeam(c.set(ch.x + 6.6, ch.y + 1.3, zAt(286.6)), d.set(0.85, 0.42, 0.4).normalize(), 7, 1.0, 2.2, 0.18);
      const want = Math.round(70 * dens) + gBeams.length - 4;
      for (let tries = 0; gBeams.length < want && tries < 900; tries++) {
        const s = rng.range(50, 180), q = prm(s), big = rng.chance(0.15);
        c.set(tubeX(s) + rng.range(-q[0] + 2, q[1] - 2), railY(s) + rng.range(-q[3] + 1, q[2] * 0.85), zAt(s));
        d.set(rng.range(-1, 1), rng.range(-0.7, 0.7), rng.range(-1, 1)).normalize();
        pushBeam(c, d, big ? rng.range(45, 62) : rng.range(20, 40), big ? rng.range(3.2, 4.4) : rng.range(2, 3), 3.4, rng.range(0.08, 0.22) + 0.08 * smoothstep(95, 45, s));
      }
      const n = gBeams.length, geo = lib.makeBeamGeo(), sel = new Float32Array(n * 4), mesh = new THREE.InstancedMesh(geo, lib.mkMat(G.SELENITE_VS, G.SELENITE_FS), n);
      gBeams.forEach((b, i) => {
        c.copy(b.a).add(b.b).multiplyScalar(0.5); d.copy(b.b).sub(b.a); const len = d.length();
        mesh.setMatrixAt(i, lib.setBasis(c, d, len, b.w, b.wz, b.seed * TAU, m4));
        sel[i * 4] = b.seed; sel[i * 4 + 1] = b.blaze; sel[i * 4 + 2] = len; sel[i * 4 + 3] = 0.5;
      });
      geo.setAttribute('aSel', new THREE.InstancedBufferAttribute(sel, 4)); mesh.frustumCulled = false; scene.add(mesh);
    }
    // the gallery floor: heaps of selenite fragments where blades have fallen and broken, lying nearly flat on the rock
    // the whole length of the gallery. They are the blades' own crystal, so the lamp runs through them as the cart
    // passes above. A stream of their own; none within the cart's clear box.
    {
      const rs = own('geode-shards'), NH = Math.round(46 * dens), o = {}, c = new V3(), d = new V3(), a = new V3(), b = new V3(), mm = [], ss = [];
      for (let h = 0; h < NH; h++) {
        const s0 = rs.range(47, 181), th0 = rs.range(-Math.PI + 0.3, -0.3), cnt = rs.int(5, 9), spread = rs.range(1.5, 4.5), yaw0 = rs.range(0, TAU);
        for (let k = 0; k < cnt; k++) {
          const s = clamp(s0 + rs.range(-1, 1) * spread, 46, 182), th = th0 + rs.range(-1, 1) * spread * 0.035, big = rs.chance(0.14);
          const len = big ? rs.range(3, 5.5) : rs.range(0.6, 2.6), w = clamp(len * rs.range(0.16, 0.3), 0.2, 1.3), thick = w * rs.range(0.4, 0.75);
          const yaw = yaw0 + rs.gauss() * 0.7, pitch = rs.range(-0.22, 0.22), blaze = rs.range(0.1, 0.24), seed = rs();
          surf(s, th, o); c.set(o.x, o.y + thick * 0.35, o.z); d.set(Math.cos(yaw), pitch, Math.sin(yaw)).normalize();
          a.copy(c).addScaledVector(d, -len / 2); b.copy(c).addScaledVector(d, len / 2);
          if (trackGap(a, b) < w * 0.5 + 2.6) continue;
          lib.setBasis(c, d, len, thick, w, 0, m4, up); for (let i = 0; i < 16; i++) mm.push(m4.elements[i]);
          ss.push(seed, blaze, len, 0.5);
        }
      }
      const geo = lib.makeBeamGeo(), mesh = new THREE.InstancedMesh(geo, lib.mkMat(G.SELENITE_VS, G.SELENITE_FS), ss.length / 4);
      mesh.instanceMatrix.array.set(mm); geo.setAttribute('aSel', new THREE.InstancedBufferAttribute(new Float32Array(ss), 4)); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- amethyst: frost closing in down the throat, druse on the gallery walls
    {
      const NT = Math.round(700 * (0.6 + 0.4 * detail)), NG = Math.round(320 * dens), NC = 130, NM = 34, NA = NT + NG + NC + NM, NTU = 200, geo = lib.makeCrystalGeo(), inst = new Float32Array((NA + NTU) * 3);
      const mesh = new THREE.InstancedMesh(geo, lib.mkMat(G.CRYSTAL_VS, G.CRYSTAL_FS), NA + NTU), o = {}, d = new V3(), base = new V3(), tip = new V3();
      let n = 0;
      for (let i = 0, guard = 0; i < NA - NM && guard < 7000; guard++) {
        const throat = i < NT, cham = i >= NT + NG, s = throat ? rng.range(-1, 42) : cham ? rng.range(284.5, 315) : rng.range(44, 184), th = cham ? rng.range(-0.1, Math.PI + 0.1) : rng.range(0, TAU);
        surf(s, th, o);
        d.set(o.cx - o.x, railY(s) + 2.2 - o.y, 0).normalize(); d.x += rng.range(-0.55, 0.55); d.y += rng.range(-0.55, 0.55); d.z += rng.range(-0.6, 0.6); d.normalize();
        const len = throat ? (rng.chance(0.12) ? rng.range(2.4, 3.3) : rng.range(0.5, 2.1)) : cham ? rng.range(0.5, 2.3) : rng.range(1, 4.8);
        base.set(o.x, o.y, o.z).addScaledVector(d, -len * 0.25); tip.copy(base).addScaledVector(d, len);
        const gx = tip.x - railX(s), gy = tip.y - (railY(s) + 1.2);
        if (throat ? (Math.hypot(gx, gy) < 3.3 || (Math.abs(gx) < 2 && gy < 0 && gy > -2.6)) : Math.hypot(gx, gy) < (cham ? 4.2 : 6.5)) continue;
        if (cham) { rng(); rng(); rng(); rng(); rng(); rng(); i++; continue; }   // the chamber's own druse is set below (same draws as before, so nothing after it moves)
        const w = len * rng.range(0.2, 0.32) + 0.08;
        mesh.setMatrixAt(n, lib.setBasis(base, d, len, w, w * rng.range(0.8, 1.1), rng.range(0, TAU), m4));
        inst[n * 3] = rng(); inst[n * 3 + 1] = clamp(Math.pow(rng(), 2.2), 0, 1) + (len > (throat ? 2.4 : 3.5) ? 2 : 0); inst[n * 3 + 2] = rng.range(0.8, 1.3); n++; i++;   // the longest points hold light of their own (hue + 2), as the great druses of the geode do
      }
      // the loading chamber: slender points 1.5-3.5 m long in clusters of four to six that share a root
      for (let placed = 0, guard = 0; placed < NC - 6 && guard < 400; guard++) {
        const s = rngC.range(285.5, 314), th = rngC.range(-0.1, Math.PI + 0.1), cnt = rngC.int(4, 6), mlen = rngC.range(2.3, 3.5);
        surf(s, th, o);
        const ix = o.cx - o.x, iy = railY(s) + 2.2 - o.y, il = Math.hypot(ix, iy) || 1, ox = o.x, oy = o.y, oz = o.z;
        for (let k = 0; k < cnt; k++) {
          const len = k === 0 ? mlen : rngC.range(1.5, Math.max(1.6, mlen * 0.8)), j = k === 0 ? 0.22 : 0.8;
          d.set(ix / il + rngC.range(-j, j), iy / il + rngC.range(-j, j), rngC.range(-j, j)).normalize();
          const w = len * rngC.range(0.08, 0.115), wr = rngC.range(0.8, 1.1), roll = rngC.range(0, TAU), sd = rngC(), hu = Math.pow(rngC(), 2.2), br = rngC.range(0.85, 1.3);
          base.set(ox, oy, oz).addScaledVector(d, -len * 0.2); tip.copy(base).addScaledVector(d, len);
          if (Math.hypot(tip.x - railX(s), tip.y - (railY(s) + 1.2)) < 4.2) continue;
          mesh.setMatrixAt(n, lib.setBasis(base, d, len, w, w * wr, roll, m4));
          inst[n * 3] = sd; inst[n * 3 + 1] = clamp(hu, 0, 1) + (k === 0 ? 2 : 0); inst[n * 3 + 2] = br; n++; placed++;   // each cluster's master point glows
        }
      }
      // the signature on the entry axis: druse crowding the wall round the tunnel mouth, big points first, catching the lamp
      for (let i = 0, guard = 0; i < NM && guard < 400; guard++) {
        const k = i % 3, side = (Math.floor(i / 3) & 1) ? 1 : -1, top = Math.floor(i / 3) % 5 === 4;
        if (k === 0) { const th = top ? rng.range(1.15, 2.0) : side > 0 ? rng.range(-0.05, 0.95) : rng.range(2.2, 3.2); surf(rng.range(283.5, 285.4), th, o); base.set(o.x, o.y, o.z + 0.3); }
        const len = (k === 0 ? rng.range(2.6, 4.4) : rng.range(0.9, 2.3)) * (top ? 0.6 : 1);
        d.set((o.cx - o.x) * 0.045 + rng.range(-0.45, 0.45), (railY(284) + 3 - o.y) * 0.05 + rng.range(-0.3, 0.55), 1).normalize();
        tip.copy(base).addScaledVector(d, len);
        if (Math.hypot(tip.x - railX(284), tip.y - (railY(284) + 1.3)) < 3.1) continue;
        const w = len * rng.range(0.2, 0.3) * 0.5 + 0.06;
        tmpA.copy(base).addScaledVector(d, -len * 0.25).add(tmpB.set(k ? rng.range(-0.7, 0.7) : 0, k ? rng.range(-0.7, 0.7) : 0, 0));
        mesh.setMatrixAt(n, lib.setBasis(tmpA, d, len, w, w * rng.range(0.8, 1.1), rng.range(0, TAU), m4));
        inst[n * 3] = rng(); inst[n * 3 + 1] = clamp(Math.pow(rng(), 2.2), 0, 1) + (k === 0 ? 2 : 0); inst[n * 3 + 2] = rng.range(1.0, 1.4); n++; i++;
      }
      // the tunnel: a pocket of small bright points in the wall of every bay between two timber sets (the sets stand
      // every 4.5 m from 193.5, so the bays' middles are at 195.75 and on), on a drawn side and height, each cluster with
      // a master point; half the bays hold a second pocket on the other wall. No tip comes within 1.35 m of the eye line.
      {
        const rt = own('geode-tunnel-druse');
        for (let s = 195.75; s < 279 && n < NA + NTU - 12; s += 4.5) {
          if (Math.abs(s - DUCK_S) < 2.5) continue;
          const side0 = rt.sign(), np = rt.chance(0.5) ? 2 : 1;
          for (let p = 0; p < np; p++) {
            const th0 = rt.range(-0.25, 1.05), sp = s + rt.range(-1.3, 1.3), cnt = rt.int(3, 5), mlen = rt.range(0.5, 0.85);
            surf(sp, (p ? -side0 : side0) > 0 ? th0 : Math.PI - th0, o);
            const ix = o.cx - o.x, iy = railY(sp) + CAM_H - o.y, il = Math.hypot(ix, iy) || 1, ox = o.x, oy = o.y, oz = o.z;
            for (let k = 0; k < cnt; k++) {
              const len = k === 0 ? mlen : rt.range(0.22, 0.5), j = k === 0 ? 0.3 : 0.9;
              d.set((ix / il) * 0.7 + rt.range(-j, j), (iy / il) * 0.7 + rt.range(-j, j), rt.range(-j, j)).normalize();
              const w = len * rt.range(0.22, 0.3) + 0.03, wr = rt.range(0.8, 1.1), roll = rt.range(0, TAU), sd = rt(), hu = Math.pow(rt(), 2.2), br = rt.range(0.9, 1.3);
              base.set(ox, oy, oz).addScaledVector(d, -len * 0.25); tip.copy(base).addScaledVector(d, len);
              if (Math.hypot(tip.x - railX(sp), tip.y - (railY(sp) + CAM_H)) < 1.35) continue;
              mesh.setMatrixAt(n, lib.setBasis(base, d, len, w, w * wr, roll, m4));
              inst[n * 3] = sd; inst[n * 3 + 1] = clamp(hu, 0, 1) + 2; inst[n * 3 + 2] = br; n++;
            }
          }
        }
      }
      mesh.count = n; geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3)); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- bats: a dark fur on the gallery roof that peels off as the lamp comes under it and streams ahead down the throat
    const NB = Math.round(800 * dens * (0.6 + 0.4 * detail));
    const batBase = () => {
      const K = 1.15, sh0 = [[0, 0, 0.3, 0], [-0.07, 0, -0.2, 0], [0.07, 0, -0.2, 0], [-0.05, 0, 0.14, 0], [-0.42, 0, 0.1, 0.6], [-0.05, 0, -0.16, 0], [-0.42, 0, 0.1, 0.6], [-0.8, 0, -0.1, 1], [-0.3, 0, -0.14, 0.4],
        [0.05, 0, 0.14, 0], [0.42, 0, 0.1, 0.6], [0.05, 0, -0.16, 0], [0.42, 0, 0.1, 0.6], [0.8, 0, -0.1, 1], [0.3, 0, -0.14, 0.4]];
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(sh0.flatMap((v) => [v[0] * K, v[1] * K, v[2] * K]), 3));
      g.setAttribute('aWing', new THREE.Float32BufferAttribute(sh0.map((v) => v[3]), 1));
      return g;
    };
    const uBatK = { value: 1 };
    const bat = { roost: new Float32Array(NB * 3), prev: new Float32Array(NB * 3), k: new Float32Array(NB * 8), aC: new Float32Array(NB * 4), aD: new Float32Array(NB * 4) };
    {
      const cl = []; for (let i = 0; i < 7; i++) cl.push([rng.range(62, 170), rng.range(1.0, 2.14)]);
      const o = {};
      for (let i = 0; i < NB; i++) {
        const c = cl[i % cl.length], s = clamp(c[0] + rng.gauss() * 7, 54, 176), th = clamp(c[1] + rng.gauss() * 0.22, 0.8, 2.34);
        surf(s, th, o); bat.roost[i * 3] = o.x; bat.roost[i * 3 + 1] = o.y - 0.25; bat.roost[i * 3 + 2] = o.z;
        const k = i * 8;
        bat.k[k] = dOfS(s) - 52 - rng.range(0, 26); bat.k[k + 1] = rng.range(7, 75); bat.k[k + 2] = rng.range(1.9, 5.5); bat.k[k + 3] = rng.range(0, TAU);
        bat.k[k + 4] = rng.range(0.5, 1.6) * rng.sign(); bat.k[k + 5] = rng.range(-1, 1); bat.k[k + 6] = rng.range(0.5, 1.5); bat.k[k + 7] = rng.range(-1, 1);
        bat.aC[i * 4 + 3] = rng();
      }
      const g = batBase();
      bat.cAttr = new THREE.InstancedBufferAttribute(bat.aC, 4); bat.dAttr = new THREE.InstancedBufferAttribute(bat.aD, 4);
      bat.cAttr.setUsage(THREE.DynamicDrawUsage); bat.dAttr.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('aC', bat.cAttr); g.setAttribute('aD', bat.dAttr); g.instanceCount = NB;
      const mesh = new THREE.Mesh(g, lib.mkMat(sh.BAT_VS, sh.BAT_FS, { uBatK }, { side: THREE.DoubleSide }));
      mesh.frustumCulled = false; mesh.renderOrder = 2; scene.add(mesh);
      let lo = 1e9; for (let i = 0; i < NB; i++) { lo = Math.min(lo, bat.k[i * 8]); bat.aC[i * 4] = bat.roost[i * 3]; bat.aC[i * 4 + 1] = bat.roost[i * 3 + 1]; bat.aC[i * 4 + 2] = bat.roost[i * 3 + 2]; bat.aD[i * 4] = 0.05; bat.aD[i * 4 + 1] = -1; bat.aD[i * 4 + 2] = 0.05; bat.aD[i * 4 + 3] = 1; }
      bat.prev.set(bat.roost); bat.first = lo; bat.state = 0;                    // 0 all hanging (buffers hold the roost), 1 flying
    }
    const uExo = { value: -50 };
    if (V.rare) {                                    // the exodus: the whole colony comes up the shaft
      const NE = Math.round(5000 * (0.5 + 0.5 * detail)), g = batBase(), c = new Float32Array(NE * 4), d = new Float32Array(NE * 4);
      for (let i = 0; i < NE; i++) { c[i * 4] = 2.5 + 11 * Math.sqrt(rng()); c[i * 4 + 1] = rng.range(0, 190) * Math.pow(rng(), 0.6); c[i * 4 + 2] = rng.range(0, TAU); c[i * 4 + 3] = rng(); d[i * 4 + 1] = 1; }
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(c, 4)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(d, 4)); g.instanceCount = NE;
      const mesh = new THREE.Mesh(g, lib.mkMat(sh.BAT_VS, sh.BAT_FS, { uExo, uBatK: { value: 1 } }, { side: THREE.DoubleSide, defines: { EXODUS: '' } }));
      mesh.frustumCulled = false; mesh.renderOrder = 2; scene.add(mesh);
    }
    await ctx.yield();

    // ---- particles: dust and moths in the lamp, drips, rain or snow down the column, debris of the leap, lamp glows
    const uDive = { value: new THREE.Vector4(0, -1, 0, 0) }, uWc = { value: new THREE.Vector4(0, -999, 0, 0) };
    {
      let ptRng = rng; const pos = [], pt = [], add = (x, y, z, ty, size, sp) => { pos.push(x, y, z); pt.push(ty, ptRng(), size, sp); };
      for (let i = 0; i < Math.round(520 * detail); i++) { const s = rng.range(186, 314), q = prm(s); add(tubeX(s) + rng.range(-1, 1) * (q[0] - 0.4), railY(s) + rng.range(0.2, Math.min(q[2] - 0.3, 5)), zAt(s), 0, rng.range(0.04, 0.08), 0); }
      for (let i = 0; i < Math.round(340 * detail); i++) { const s = rng.range(44, 186); add(railX(s) + rng.range(-12, 12), railY(s) + rng.range(-3, 8), zAt(s), 0, rng.range(0.05, 0.1), 0); }
      for (let i = 0; i < Math.round(300 * dens * detail); i++) { const s = rng.range(40, 186); add(railX(s) + rng.gauss() * 5, railY(s) + 1.5 + rng.gauss() * 2.6, zAt(s), 1, rng.range(0.35, 0.6), 0); }
      for (let i = 0; i < 70; i++) { const s = rng.range(192, 312), q = prm(s); add(tubeX(s) + rng.range(-1, 1) * (q[0] - 0.5), railY(s) + Math.min(q[2] - 0.3, 3.0), zAt(s), 2, 0.34, rng.range(0.45, 0.9)); }
      if (V.look === 'rain') for (let i = 0; i < Math.round(3000 * detail); i++) add(15.5 * Math.sqrt(rng()), rng.range(0, 189), rng.range(0, TAU), 3, rng.range(3.2, 5.2), rng.range(32, 44));
      if (V.look === 'winter') for (let i = 0; i < Math.round(1400 * detail); i++) add(16 * Math.sqrt(rng()), rng.range(0, 189), rng.range(0, TAU), 4, rng.range(0.22, 0.42), rng.range(2, 4.5));
      const re = A.railEnd.position, dv = tmpA.copy(A.portalSeat.position).sub(tmpB.set(re.x, re.y + CAM_H, re.z)).normalize();
      uDive.value.set(dv.x, dv.y, dv.z, 0);
      for (let i = 0; i < 60; i++) { const a = rng.range(0, TAU), r = rng.range(2.2, 7), f = rng.range(4, 30); add(re.x + dv.x * f + Math.cos(a) * r, re.y + CAM_H + dv.y * f + rng.range(-2.5, 2.5), re.z + dv.z * f + Math.sin(a) * r, 5, rng.range(0.1, 0.32), rng.range(0.8, 1.03)); }
      add(0, 0, 0, 6, 1.5, 0);
      for (const i of [0, 1, 3]) add(LAMPS[i].x, LAMPS[i].y, LAMPS[i].z, 7, 1.7, LAMP_W[i]);
      add(tubeX(193.5), railY(193.5) + 2.72, zAt(193.5) - 0.3, 7, 2.3, 1.5);
      ptRng = rngN; for (const i of [4, 6, 7]) add(LAMPS[i].x, LAMPS[i].y, LAMPS[i].z, 7, 1.7, LAMP_W[i]);   // the glows of the lamps added down the line (5 is the one above)
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aPt', new THREE.Float32BufferAttribute(pt, 4));
      const mesh = new THREE.Points(geo, lib.mkMat(sh.WPT_VS, sh.WPT_FS, { uDive, uWc }, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      mesh.renderOrder = 6; mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- machines and carts (one lit material family; vertex colour is the albedo)
    const propMat = (spillPos, spillK) => lib.mkMat(sh.PROP_VS, sh.PROP_FS, { uSpillPos: { value: spillPos || new V3() }, uSpillK: { value: spillK || 0 }, uEmis: { value: 6 } }, { side: THREE.DoubleSide });
    const matStill = propMat(null, 0), matDead = propMat(null, 0); matDead.uniforms.uEmis.value = 0;
    const tcol = rgb(pc[6].clone().lerp(pc[3], 0.3), 0.75), ironC = [0.2, 0.15, 0.125], rimC = [0.4, 0.36, 0.33], strapC = [0.075, 0.065, 0.06];   // rusted plate and worn bright rims: a tub the lamp can show, not a black shape
    const rootC = rgb(pc[1], 1.1), tipC = rgb(pc[2], 1.0), poolC = rgb(pc[5], 0.9);
    const addMesh = (S, mat, parent = scene) => { const m = new THREE.Mesh(S.geo(), mat); m.frustumCulled = false; parent.add(m); return m; };

    // the waterwheel at the pool's edge, its launder from the wall, the nodding pump beam
    const wheel = { ok: false };
    {
      // (the seat's score and the thread's seed come from a stream of the wheel's own: how many seats are tried depends
      // on the floor and the trestle, and nothing after the wheel is to move with them)
      const pl = A.pool, well = A.portalSeat.position, rw = own('geode-wheel'); let best = -1, bx = 0, bz = 0; timRng = rw;
      for (let k = 0; k < 28; k++) {
        const a = (k / 28) * TAU, x = pl.center.x + Math.cos(a) * pl.radius * 0.96, z = pl.center.z + Math.sin(a) * pl.radius * 0.96;
        if (!HL.clear(x, 6, z, 7, -9, 12, 14) || HL.floorH(x, z) > 3.2) continue;
        const sc = Math.min(Math.hypot(x - well.x, z - well.z), 34) + Math.min(path.distanceTo(x, 6, z), 26) + rw.range(0, 6);
        if (sc > best) { best = sc; bx = x; bz = z; }
      }
      if (best > 0) {
        wheel.ok = true;
        const ry = Math.atan2(pl.center.x - bx, pl.center.z - bz), cy = Math.cos(ry), sy = Math.sin(ry), AX = 4.9, R = 4.4;
        const W = (lx, ly, lz, out) => out.set(bx + lx * cy + lz * sy, ly, bz - lx * sy + lz * cy);
        const wm = (a, b, w, d, kind = 0) => member(W(a[0], a[1], a[2], tmpA), W(b[0], b[1], b[2], tmpB), w, d, kind);
        const S = new Soup();
        for (let i = 0; i < 16; i++) {
          const a0 = (i / 16) * TAU, a1 = ((i + 1) / 16) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          for (const x of [-0.55, 0.55]) { S.bar([x, s0 * R, c0 * R], [x, s1 * R, c1 * R], 0.2, tcol); if (i % 2 === 0) S.bar([x, 0, 0], [x, s0 * R, c0 * R], 0.16, tcol); }
          S.quad([-0.6, s0 * (R - 0.75), c0 * (R - 0.75)], [0.6, s0 * (R - 0.75), c0 * (R - 0.75)], [0.6, s0 * (R + 0.15) + c0 * 0.3, c0 * (R + 0.15) - s0 * 0.3], [-0.6, s0 * (R + 0.15) + c0 * 0.3, c0 * (R + 0.15) - s0 * 0.3], tcol.map((v) => v * 0.8));
        }
        S.bar([-1.1, 0, 0], [1.1, 0, 0], 0.3, strapC);
        wheel.grp = new THREE.Group(); wheel.grp.position.set(bx, AX, bz); wheel.grp.rotation.y = ry; scene.add(wheel.grp);
        wheel.mesh = addMesh(S, matStill, wheel.grp);
        for (const x of [-1.0, 1.0]) for (const z of [-2.6, 2.6]) wm([x, AX + 0.1, 0], [x * 1.3, HL.floorH(W(x, 0, z, tmpC).x, tmpC.z) - 0.6, z], 0.3, 0.3);
        // the launder: a trough on trestle legs from a spring in the wall to the top of the wheel
        const fy = AX + R + 0.95; let fl = 6; while (fl < 60) { W(0, fy, -fl - 2, tmpC); if ((tmpC.x * tmpC.x + tmpC.z * tmpC.z) / 8100 + ((fy - 70) / 85) ** 2 > 0.99 || !HL.clear(tmpC.x, fy, tmpC.z, 4, -4, 6, 8)) break; fl += 2; }
        wm([0, fy, 0.9], [0, fy + fl * 0.03, -fl], 0.7, 0.08); for (const x of [-0.38, 0.38]) wm([x, fy + 0.2, 0.9], [x, fy + 0.2 + fl * 0.03, -fl], 0.07, 0.42);
        for (let z = -3; z > -fl + 1; z -= 6) for (const x of [-0.45, 0.45]) wm([x, fy, z], [x * 2.6, HL.floorH(W(x * 2.6, 0, z, tmpC).x, tmpC.z) - 0.5, z], 0.2, 0.2);
        // the pump: a post and a walking beam that nods as the wheel turns
        wm([2.4, HL.floorH(W(2.4, 0, 1.2, tmpC).x, tmpC.z) - 0.5, 1.2], [2.4, 7.4, 1.2], 0.36, 0.36);
        const Sb = new Soup(); Sb.bar([0, 0, -3.4], [0, 0, 3.4], 0.34, tcol); Sb.box(0, -0.25, 3.3, 0.4, 0.9, 0.5, tcol); Sb.bar([0, -0.3, 3.3], [0, -6.2, 3.3], 0.09, strapC); Sb.bar([0, 0, -3.3], [-1.2, -2.4, -2.6], 0.1, strapC);
        wheel.pump = new THREE.Group(); W(2.4, 7.6, 1.2, wheel.pump.position); wheel.pump.rotation.y = ry; scene.add(wheel.pump);
        wheel.beam = addMesh(Sb, matStill, wheel.pump);
        // the thread of water off the end of the launder, past the wheel, into the pool (the hero's fall shader)
        const rp = [], rd = [], rr = [], ri = [], sd = rw(), n = 6, top = W(0, fy, 1.15, new V3());
        for (let i = 0; i <= n; i++) { const y = fy - (fy * i) / n; for (const s of [-1, 1]) { rp.push(top.x, y, top.z); rd.push(0, -1, 0); rr.push(s * 0.34, 0, fy - y, sd); } }
        for (let i = 0; i < n; i++) { const a = i * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); geo.setAttribute('aDir', new THREE.Float32BufferAttribute(rd, 3));
        geo.setAttribute('aRib', new THREE.Float32BufferAttribute(rr, 4)); geo.setIndex(ri);
        const fall = new THREE.Mesh(geo, lib.mkMat(G.RIBBON_VS, G.RIBBON_FS, {}, { side: THREE.DoubleSide })); fall.frustumCulled = false; scene.add(fall);
      }
      timRng = rng;
    }
    // the headframe across the lip of the sinkhole, lowering a kibble on its rope down the shaft
    const kib = { ok: false };
    {
      const sk = A.sinkhole.position, ax = { x: 0, z: 0 }, rk = own('geode-kibble'); HL.shaftAt(172, ax); timRng = rk;   // a stream of its own: the tries depend on the trestle and the fallen blades
      const a0 = rk.range(0, TAU);                                             // seats tried all round the shaft, ten degrees apart from a drawn first bearing, until one is free
      for (let k = 0; k < 36 && !kib.ok; k++) {
        const a = a0 + (k * TAU) / 36, x = ax.x + Math.cos(a) * 8.5, z = ax.z + Math.sin(a) * 8.5; let ok = true;
        for (let y = 86; y < 168 && ok; y += 3) ok = HL.clear(x, y, z, 6.5, -9, 11, 11);
        for (const o of lib.beams) if (ok && lib.segSegDist(x, 86, z, x, 168, z, o.a.x, o.a.y, o.a.z, o.b.x, o.b.y, o.b.z) < o.wx * 0.5 + 2.2) ok = false;
        if (!ok) continue;
        kib.ok = true; kib.x = x; kib.z = z; kib.top = 173; kib.ph = rk.range(0, TAU);
        const px = -Math.sin(a), pz = Math.cos(a);
        for (const off of [-0.7, 0.7]) mem(x + px * 17 + Math.cos(a) * off, 173.2, z + pz * 17 + Math.sin(a) * off, x - px * 17 + Math.cos(a) * off, 173.4, z - pz * 17 + Math.sin(a) * off, 0.55, 0.6, 0, up);
        mem(x - Math.cos(a) * 1.1, 173.7, z - Math.sin(a) * 1.1, x + Math.cos(a) * 1.1, 173.7, z + Math.sin(a) * 1.1, 0.5, 0.5, 1, up);
        const bg = lib.makeBucketGeo(), nv = bg.attributes.position.count, col = new Float32Array(nv * 3);
        for (let i = 0; i < nv; i++) { col[i * 3] = 0.07; col[i * 3 + 1] = 0.07; col[i * 3 + 2] = 0.09; }
        bg.setAttribute('color', new THREE.BufferAttribute(col, 3)); bg.setAttribute('aM', new THREE.BufferAttribute(new Float32Array(nv), 1));
        kib.mesh = new THREE.Mesh(bg, matStill); kib.mesh.scale.setScalar(1.5); kib.mesh.frustumCulled = false; scene.add(kib.mesh);
        const Sr = new Soup(); Sr.bar([0, 0, 0], [0, 1, 0], 1, [0.05, 0.045, 0.04]);
        kib.rope = addMesh(Sr, matStill); kib.rope.scale.set(0.16, 1, 0.16);
      }
      void sk; timRng = rng;
    }
    // what is left of the miners: a coat on a nail, a lunch tin on a crate
    {
      const S = new Soup(), wool = [0.05, 0.055, 0.085], dark = [0.03, 0.033, 0.05], tin = [0.3, 0.32, 0.37], [cx, cy, cz] = ch.coat;
      const X = [-0.3, -0.19, -0.06, 0.06, 0.2, 0.31], row = (y, wk, fold) => X.map((x, i) => [cx + x * wk, cy + y - (Math.abs(x) > 0.25 ? 0.09 : 0) * (y > -0.2 ? 1 : 0), cz + 0.03 + fold * (i % 2 ? 0.05 : -0.01) + (i === 2 || i === 3 ? 0.03 : 0)]);
      const R = [row(-0.06, 0.82, 0.2), row(-0.42, 1.0, 0.6), row(-0.85, 1.12, 1), row(-1.22, 1.22, 1.3)];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) S.quad(R[j][i], R[j][i + 1], R[j + 1][i + 1], R[j + 1][i], i === 2 ? dark : wool);
      S.tri([cx - 0.12, cy - 0.06, cz + 0.06], [cx + 0.12, cy - 0.06, cz + 0.06], [cx, cy + 0.07, cz + 0.02], wool);                 // the collar hooked over the nail
      for (const sd of [-1, 1]) S.cyl([cx + sd * 0.27, cy - 0.16, cz + 0.05], [cx + sd * 0.36, cy - 0.86, cz + 0.08], 0.075, 0.06, wool, 0, 7);   // sleeves
      S.cyl([cx, cy + 0.02, cz - 0.1], [cx, cy + 0.02, cz + 0.07], 0.012, 0.012, tin, 0, 5);                                           // the nail
      const [tx, ty, tz] = ch.tin;
      S.box(tx, ty + 0.08, tz, 0.3, 0.16, 0.19, tin); S.cyl([tx - 0.15, ty + 0.16, tz], [tx + 0.15, ty + 0.16, tz], 0.095, 0.095, tin, 0, 10);   // domed lid
      for (const sd of [-1, 1]) S.bar([tx + sd * 0.1, ty + 0.25, tz], [tx + sd * 0.06, ty + 0.31, tz], 0.012, dark); S.bar([tx - 0.06, ty + 0.31, tz], [tx + 0.06, ty + 0.31, tz], 0.012, dark);
      S.cyl([tx + 0.3, ty, tz + 0.12], [tx + 0.3, ty + 0.2, tz + 0.12], 0.045, 0.04, tin, 0, 8); S.cyl([tx + 0.3, ty + 0.2, tz + 0.12], [tx + 0.3, ty + 0.26, tz + 0.12], 0.018, 0.018, dark, 0, 6);   // a flask
      addMesh(S, matStill);
    }
    // the points lever that throws itself
    const lever = (() => {
      const S = new Soup(), plate = [0.3, 0.31, 0.35];
      S.cyl([0, 0, 0], [0, 1.2, 0], 0.05, 0.028, rimC, 0, 8); S.cyl([0, 1.2, 0], [0, 1.42, 0], 0.04, 0.045, [0.02, 0.02, 0.025], 0, 8);   // tapered lever, bound grip
      S.cyl([0, 1.42, 0], [0, 1.47, 0], 0.045, 0.02, [0.02, 0.02, 0.025], 0, 8);
      S.box(0, 0.62, 0.09, 0.09, 0.16, 0.2, [0.5, 0.52, 0.56]);                                                    // the weight that throws it
      const S2 = new Soup(); S2.cyl([-0.06, 0, 0], [0.06, 0, 0], 0.08, 0.08, strapC, 0, 10);                        // pivot
      for (let i = 0; i < 8; i++) { const a0 = (i / 8 - 0.5) * 1.5, a1 = ((i + 1) / 8 - 0.5) * 1.5, Q = (r, a, z) => [Math.sin(a) * r, Math.cos(a) * r, z];   // quadrant plate with its notched rim
        for (const z of [-0.05, 0.05]) S2.quad(Q(0.12, a0, z), Q(0.12, a1, z), Q(i % 2 ? 0.5 : 0.46, a1, z), Q(i % 2 ? 0.5 : 0.46, a0, z), plate); }
      const m = addMesh(S, matStill); m.position.set(tubeX(244) - 1.25, railY(244) - 0.35, zAt(244));
      addMesh(S2, matStill).position.copy(m.position);
      mem(m.position.x - 0.25, m.position.y, m.position.z, m.position.x + 0.25, m.position.y, m.position.z, 0.3, 0.2, 1, up);
      return m;
    })();
    // two derelict carts on the siding
    {
      const S = new Soup(); cartBody(S, { iron: [0.075, 0.06, 0.06], rim: [0.1, 0.09, 0.09], strap: [0.03, 0.028, 0.03], band: null }, { wheels: true });
      const g = S.geo();
      for (const [s, rz, ry] of [[296.5, 0, 0.03], [305.5, -0.42, -0.25]]) { const m = new THREE.Mesh(g, matDead); m.position.set(ch.x - 4.4 + (rz ? -0.5 : 0), ch.y + CAM_H + (rz ? 0.12 : 0), zAt(s) - 1.4); m.rotation.set(0, ry, rz); m.frustumCulled = false; scene.add(m); }
    }
    // winter: icicles under the trestle
    if (V.look === 'winter') {
      const tr = A.track.outer, N = Math.round(520 * detail), geo = lib.makeCrystalGeo(), inst = new Float32Array(N * 3), c = new V3(), d = new V3();
      const ice = lib.mkMat(G.CRYSTAL_VS, G.CRYSTAL_FS, { uRoot: { value: new THREE.Color('#9DB4D6') }, uTip: { value: new THREE.Color('#F2F7FF') }, uShadow: { value: new THREE.Color('#3A4763') } });
      const mesh = new THREE.InstancedMesh(geo, ice, N);
      for (let i = 0; i < N; i++) {
        const j = rng.int(2, tr.length - 3), p = tr[j], q = tr[j + 1], hx = q.x - p.x, hz = q.z - p.z, hl = Math.hypot(hx, hz) || 1, sd = rng.sign() * rng.range(0.85, 1.15) * 0.6, len = rng.range(0.4, 2.1) * (rng.chance(0.1) ? 1.8 : 1);
        c.set(p.x + (hz / hl) * sd, p.y - 0.36, p.z - (hx / hl) * sd); d.set(rng.range(-0.05, 0.05), -1, rng.range(-0.05, 0.05)).normalize();
        mesh.setMatrixAt(i, lib.setBasis(c, d, len, 0.07 + len * 0.05, 0.07 + len * 0.05, rng.range(0, TAU), m4));
        inst[i * 3] = rng(); inst[i * 3 + 1] = 0; inst[i * 3 + 2] = rng.range(1.1, 1.6);
      }
      geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3)); mesh.frustumCulled = false; scene.add(mesh);
    }
    // all the mine's timber in one instanced mesh
    {
      const n = tims.length / 3, geo = lib.makeBoxGeo(), mesh = new THREE.InstancedMesh(geo, lib.mkMat(G.TIMBER_VS, G.TIMBER_FS), n);
      mesh.instanceMatrix.array.set(mats); mesh.instanceMatrix.needsUpdate = true;
      geo.setAttribute('aTim', new THREE.InstancedBufferAttribute(new Float32Array(tims), 3)); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- our cart, built round the eye: rim, low nose, two spinning wheels, the lamp, the flapping lever, the ore
    const cart = new THREE.Group(), lampW = new V3(), cartMat = propMat(lampW, 1.5);
    let wheelsM = [], brake, ore, sparkU;
    {
      const S = new Soup(); cartBody(S, { iron: ironC, rim: rimC, strap: strapC, band: null }); addMesh(S, cartMat, cart);
      const Sw = new Soup(); Sw.wheel(0, 0, 0, 0.32, 0.05, strapC, rimC); const wg = Sw.geo();
      for (const s of [-1, 1]) { const m = new THREE.Mesh(wg, cartMat); m.position.set(s * 0.5, -1.38, -3.02); if (s < 0) m.scale.x = -1; m.frustumCulled = false; cart.add(m); wheelsM.push(m); }
      const Sl = new Soup(); Sl.cyl([0, 0, 0], [0.04, 0.5, -0.11], 0.03, 0.022, rimC, 0, 7); Sl.cyl([0.04, 0.5, -0.11], [0.052, 0.66, -0.146], 0.034, 0.03, [0.05, 0.05, 0.06], 0, 8); Sl.cyl([0.04, 0.44, -0.097], [0.048, 0.5, -0.11], 0.04, 0.04, [0.3, 0.3, 0.33], 0, 8);
      brake = addMesh(Sl, cartMat, cart); brake.position.set(0.8, -1.12, -1.35);
      const So = new Soup(); oreHeap(So, rng, rootC, tipC); ore = addMesh(So, cartMat, cart);
      const pos = [], sp = [];
      for (const s of [-1, 1]) for (let i = 0; i < 28; i++) { pos.push(s * 0.5, -1.69, -3.0); sp.push(0, rng(), s, 0); }
      pos.push(LAMP_LOCAL.x, LAMP_LOCAL.y, LAMP_LOCAL.z + 0.06); sp.push(1, 0, 0, 0);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aSp', new THREE.Float32BufferAttribute(sp, 4));
      sparkU = { uTime: U.uTime, uPx: U.uPx, uLampCol: U.uLampCol, uSpark: { value: 0 }, uFlame: { value: 1 } };
      const pm = new THREE.Points(geo, new THREE.ShaderMaterial({ vertexShader: sh.SPARK_VS, fragmentShader: sh.SPARK_FS, uniforms: sparkU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      pm.frustumCulled = false; pm.renderOrder = 8; cart.add(pm);
      scene.add(cart);
    }
    // the loose cart (or a string of three tubs) on the second track, on the wall side of ours
    const wcLamp = new V3(0, -999, 0), wcMat = propMat(wcLamp, 0.8), tubs = [];
    {
      const S = new Soup(); cartBody(S, { iron: [0.62, 0.63, 0.66], rim: [0.75, 0.76, 0.8], strap: [0.3, 0.3, 0.33], band: poolC }, { wheels: true }); oreHeap(S, rng, rootC, tipC, 12);
      const g = S.geo();
      for (let i = 0; i < V.tubs; i++) { const m = new THREE.Mesh(g, wcMat); m.frustumCulled = false; m.visible = false; scene.add(m); tubs.push(m); }
    }

    // ---- runtime
    const night = V.look === 'night' ? 0.5 : 1;
    const fogMine = new THREE.Color(palette[0]).multiplyScalar(0.45), fogGeo = pc[4].clone().lerp(pc[2], 0.5).multiplyScalar(0.2 * night * Math.min(1, 0.45 + 0.4 * LK.shaftK));   // luminous: the far wall sits pale
    const camP = new V3(), camF = new V3(), camU = new V3(), tan = new V3(), tan2 = new V3(), fwd = new V3(), rgt = new V3(), upv = new V3(), ldir = new V3(), bm = new THREE.Matrix4();
    const wp = new V3(), wq = new V3(), wf = new V3(), wr = new V3(), wu = new V3(), poiA = new V3(), poiB = new V3(), poiC = new V3(), wcNow = new V3().copy(A.track.second[0]);
    const hs = A.helix.startDist, he = A.helix.endDist, inner = A.track.second, nH = inner.length - 15;
    // where the loose cart draws level and how far it gets ahead: each from a stream of its own, since they set where
    // the look at the loose cart opens and nothing built before them may move it
    const level = hs + (he - hs) * own('geode-level').range(0.16, 0.24), lead = own('geode-lead').range(18, 26);
    const wcAt = (Dw, out) => {
      if (Dw <= he) { const f = clamp((Dw - hs) / 1.5, 0, nH - 0.001), i = Math.floor(f); return out.lerpVectors(inner[i], inner[i + 1], f - i); }
      if (Dw <= he + 23.7) { const f = clamp(nH + ((Dw - he) / 23.7) * 14, 0, inner.length - 1.001), i = Math.floor(f); return out.lerpVectors(inner[i], inner[i + 1], f - i); }
      pathP(entryD + Dw, out); out.y -= CAM_H; return out;
    };
    for (const i of LAMP_IDX) U.uPt.value[i].set(LAMPS[i].x, LAMPS[i].y, LAMPS[i].z, LAMP_W[i]);
    const uS = (s) => dOfS(s) / PL, uE = entryD / PL, uR = railEndD / PL;
    const axv = { x: 0, z: 0 }, dark0 = U.uDarkCol.value.clone();

    const update = (dt, time, camera, u) => {
      const D = u * PL, Dh = D - entryD, live = u > 0;
      const mine = 1 - smoothstep(entryD - 60, entryD + 30, D);
      scene.fog.density = lerp(0.0026 * LK.fogK, 0.0065, mine);                  // thin air in the mine: the lamps down the line show through it
      scene.fog.color.copy(fogGeo).lerp(fogMine, mine);
      // the cart round the eye
      const e = camera.matrixWorld.elements;
      camP.set(e[12], e[13], e[14]); camU.set(e[4], e[5], e[6]).normalize(); camF.set(-e[8], -e[9], -e[10]).normalize();
      path.tangentAtDist(D, tan); path.tangentAtDist(D + 6, tan2);
      if (!live) { camP.copy(path.start); camF.copy(path.startTangent); camU.set(0, 1, 0); }
      const turn = tan.z * tan2.x - tan.x * tan2.z, onRail = D < railEndD ? 1 : 0, fall = Math.max(0, D - railEndD);
      const jolt = Math.exp(-((D / 6) % 1) * 9) * onRail;
      fwd.copy(tan).multiplyScalar(0.62).addScaledVector(camF, 0.38).normalize();
      rgt.crossVectors(fwd, camU).normalize(); upv.crossVectors(rgt, fwd);
      const roll = clamp(turn * 1.5, -0.2, 0.2) * onRail + 0.012 * Math.sin(time * 23) * (0.4 + jolt) + Math.min(fall, 60) * 0.0015 * Math.sin(time * 1.7);
      const cr = Math.cos(roll), sr = Math.sin(roll);
      tmpA.copy(rgt).multiplyScalar(cr).addScaledVector(upv, -sr); tmpB.copy(upv).multiplyScalar(cr).addScaledVector(rgt, sr);
      cart.quaternion.setFromRotationMatrix(bm.makeBasis(tmpA, tmpB, tmpC.copy(fwd).negate()));
      const crane = clamp((tan.y - camF.y) * 1.25, 0, 0.7) * onRail;             // looking down past the rim, the rider rises to see over it
      cart.position.copy(camP).addScaledVector(tmpB, -0.025 * jolt + 0.008 * Math.sin(time * 31) - 1.3 * (1 - smoothstep(0, 0.012, u)) - crane);
      cart.visible = live; cart.updateMatrixWorld(true);
      wheelsM[0].rotation.x = -time * 41; wheelsM[1].rotation.x = -time * 41.7;
      brake.rotation.x = 0.12 * Math.sin(time * 3.3) + 0.3 * jolt * Math.sin(time * 40) + 0.35 * smoothstep(0, 20, fall) * Math.sin(time * 9);
      const lift = smoothstep(2, 45, fall);
      ore.position.y = 0.035 * jolt + 0.01 * Math.sin(time * 27) + 0.32 * lift; ore.rotation.x = -0.22 * lift;
      sparkU.uSpark.value = live ? clamp(Math.abs(turn) * 3.0 + 0.18 * jolt, 0, 1) * onRail : 0;
      const flick = 1 + 0.05 * Math.sin(time * 31) + 0.04 * Math.sin(time * 17.3 + 1);
      sparkU.uFlame.value = live ? flick : 0; cartMat.uniforms.uEmis.value = 4.5 * flick;
      lampW.copy(LAMP_LOCAL).applyMatrix4(cart.matrixWorld);
      ldir.copy(tan).multiplyScalar(0.7).addScaledVector(camF, 0.3); ldir.y += 0.42 * bell(D, dOfS(165), dOfS(92), 0.4) - 0.03; ldir.normalize();
      hero.setLamp(lampW, ldir, LK.lamp * flick, 37);
      const galK = bell(D, dOfS(196), dOfS(24), 0.12), chamK = 1 - smoothstep(dOfS(292), dOfS(276), D);
      uCham.value = 2.2 * chamK;
      U.uLampRange.value = 58 + 14 * galK;                                       // the gallery is a big room: the lamp reaches its walls
      U.uDarkCol.value.copy(dark0).multiplyScalar(1 + 8 * chamK + 1.2 * galK);
      const pl = U.uPt.value, fl2 = 0.9 + 0.1 * Math.sin(time * 11) * Math.sin(time * 6.3);
      for (let q = 0; q < LAMP_IDX.length; q++) pl[LAMP_IDX[q]].w = LAMP_W[LAMP_IDX[q]] * fl2;

      // the loose cart: waits at the buffer stop, draws level, edges ahead, goes over the end first
      const Dw = Dh - 30 * (1 - smoothstep(hs - 25, level, Dh)) + lead * smoothstep(level, he, Dh);
      let wcOn = false;
      for (let i = 0; i < tubs.length; i++) {
        const m = tubs[i], dI = Math.max(Dw, hs + 1) + (tubs.length - 1 - i) * 4.15, on = live && D > entryD - 80 && entryD + dI < PL - 5;
        m.visible = on; if (!on) continue;
        wcAt(dI, wp); wcAt(dI + 1.2, wq); wf.subVectors(wq, wp); if (wf.lengthSq() < 1e-6) wf.set(0, 0, -1); wf.normalize();
        wr.crossVectors(wf, up).normalize(); wu.crossVectors(wr, wf);
        m.quaternion.setFromRotationMatrix(bm.makeBasis(wr, wu, tmpC.copy(wf).negate()));
        m.position.copy(wp).addScaledVector(wu, CAM_H + 0.012 * Math.sin(time * 29 + i * 2));
        if (i === 0) { m.updateMatrixWorld(true); wcLamp.copy(LAMP_LOCAL).applyMatrix4(m.matrixWorld); wcNow.copy(m.position); wcOn = true; }
      }
      uWc.value.set(wcLamp.x, wcLamp.y, wcLamp.z, wcOn ? flick : 0); if (wcOn) pl[2].set(wcLamp.x, wcLamp.y, wcLamp.z, 0.55); else pl[2].set(lampW.x, lampW.y + 0.7, lampW.z, (0.85 + 0.6 * chamK) * flick);   // in the mine the slot is the lamp's own soft spill on walls and timber

      // machines
      if (wheel.ok) { wheel.mesh.rotation.x = time * 0.5; wheel.beam.rotation.x = 0.2 * Math.sin(time * 1.0); }
      if (kib.ok) { const y = 128 + 36 * Math.sin(time * 0.09 + kib.ph); kib.mesh.position.set(kib.x, y, kib.z); kib.mesh.rotation.y = time * 0.2; kib.rope.position.set(kib.x, y, kib.z); kib.rope.scale.y = kib.top - y; }
      lever.rotation.z = lerp(0.55, -0.55, smoothstep(dOfS(257), dOfS(253), D));

      // bats: nothing to move while they all hang (the buffers already hold the roost), nor once they have scattered
      // up into the dark of the egg and shrunk away
      const batOn = live && D > bat.first && Dh < 215;
      uBatK.value = 1 - smoothstep(165, 210, Dh);
      if (batOn || bat.state === 1) {
        const br = bat.roost, bk = bat.k, bc = bat.aC, bd = bat.aD, bp = bat.prev;
        for (let i = 0; i < NB; i++) {
          const k = i * 8, t = D - bk[k], j = i * 3, c = i * 4;
          let x = br[j], y = br[j + 1], z = br[j + 2];
          if (t > 0 && batOn) {
            const kk = smoothstep(0, 42, t), dA = D + bk[k + 1] * kk + 6;
            pathP(dA, tmpA);
            const ang = bk[k + 3] + time * bk[k + 4], r = bk[k + 2], g = Math.min(Math.max(0, dA - entryD - 20) * 0.9, 150);
            x = lerp(x, tmpA.x + Math.cos(ang) * r + bk[k + 5] * g, kk);
            y = lerp(y, tmpA.y + 0.8 + Math.sin(ang) * r * 0.6 + bk[k + 6] * g * 0.8, kk) - 4 * Math.sin(Math.PI * kk) * (1 - kk);
            z = lerp(z, tmpA.z + Math.sin(ang * 1.3) * 3 + bk[k + 7] * g, kk);
            const dx = x - bp[j], dy = y - bp[j + 1], dz = z - bp[j + 2], l = Math.hypot(dx, dy, dz);
            if (l > 1e-3 && l < 25) { bd[c] = dx / l; bd[c + 1] = clamp(dy / l, -0.7, 0.7); bd[c + 2] = dz / l; } else if (bd[c + 3] > 0.5 || l >= 25) { bd[c] = tan.x; bd[c + 1] = 0; bd[c + 2] = tan.z; }
            bd[c + 3] = 0;
          } else { bd[c] = 0.05; bd[c + 1] = -1; bd[c + 2] = 0.05; bd[c + 3] = 1; }
          bc[c] = x; bc[c + 1] = y; bc[c + 2] = z; bp[j] = x; bp[j + 1] = y; bp[j + 2] = z;
        }
        bat.cAttr.needsUpdate = true; bat.dAttr.needsUpdate = true; bat.state = batOn ? 1 : 0;
      }
      uExo.value = V.rare ? lerp(-10, 340, smoothstep(railEndD - 70, PL - 15, D)) : -50;
      uDive.value.w = fall; U.uHaze.value = haze0 * (1 - 0.72 * smoothstep(0, 35, fall));
      hero.update(dt, time, camera);
    };

    // the reveal's gaze rests on the middle of the helix in the daylight column: the shaft's axis at the mean of the
    // helix's top and bottom
    const yHelixMid = (A.helix.yTop + A.helix.yBottom) / 2;
    HL.shaftAt(yHelixMid, axv); poiB.set(axv.x, yHelixMid, axv.z);
    const seat = A.portalSeat.position.clone(), plume = seat.clone().addScaledVector(A.portalSeat.normal, 10);
    // while the cart is on the rails the rider looks out over the cave-side rail, not straight down through the deck:
    // the gaze meets the column where a line falling GAZE_FALL metres per metre out from the eye meets it, and it goes
    // to the well only from the place where the rail has passed over the well for the last time (the rail crosses above
    // it once in each turn of the helix): from there the well swings out across the cave as the cart runs on, and
    // while it is still near under the rail the gaze rests above it, on a line falling no steeper than WELL_FALL
    const GAZE_FALL = 0.95, WELL_FALL = 0.9, poiD = new V3();
    // the look at the column opens where the hero's own sight line for the reveal ends (A.revealDist metres of rail
    // past the throat's mouth, which the hero keeps open): there the column takes the eye. It closes where the look at
    // the well has come in fully (wellIn: the well look opens where the rail has passed over the well and comes in
    // over a quarter of its own length), so the eye goes from the column to the well and does not fall back to the
    // rail between them. It comes and goes over a fifth of its own length, as it always has.
    const COL_FROM = A.revealDist;
    let dOver = entryD + hs;
    { let best = 1e9; for (let d = Math.max(entryD + hs, entryD + he - (he - hs) / A.helix.turns); d <= entryD + he; d += 1) { pathP(d, tmpA); const q = Math.hypot(tmpA.x - plume.x, tmpA.z - plume.z); if (q < best) { best = q; dOver = d; } } }
    const WELL_TO = 0.99, WELL_FADE = 0.25, wellIn = dOver + WELL_FADE * (WELL_TO * PL - dOver);
    const pois = [
      { at: (t, u) => pathP(u * PL + 34, poiA).setY(poiA.y + 15), from: uS(172), to: uS(92), weight: 0.24 },                 // the roof where the bats hang
      { at: (t, u) => { path.pointAt(u, poiC); HL.shaftAt(poiC.y, axv); const y = clamp(poiC.y - GAZE_FALL * Math.hypot(axv.x - poiC.x, axv.z - poiC.z), 5, 150); HL.shaftAt(y, axv); return poiC.set(axv.x, y, axv.z); }, from: (entryD + COL_FROM) / PL, to: wellIn / PL, weight: 0.5, fade: 0.2 },   // the column as the anchor of the helix, at the point where a line falling GAZE_FALL from the eye meets it: the open cave below the rail
      { at: poiB, from: uE - 0.03, to: uE + 0.066, weight: 0.72, fade: 0.3 },                                                // THE REVEAL: across the shaft and down the column to the pool
      { at: () => wcNow, from: (entryD + level - 45) / PL, to: (entryD + level + 60) / PL, weight: 0.22 },
      // the well, in one pull from the place where the rail has passed over it to the end: first its plume (or the point
      // above it where a line falling WELL_FALL from the eye meets it); along the spur, from the helix's end to the
      // rail's end, the aim sinks to the seat itself and the limit lets go, so the gaze leads the turn round to the well
      // and the leap looks straight into it
      { at: (t, u) => {
        const D = u * PL, k = smoothstep(entryD + he, railEndD, D); pathP(D, poiD);
        const cap = poiD.y - WELL_FALL * Math.hypot(plume.x - poiD.x, plume.z - poiD.z) - 200 * k;
        return poiD.set(lerp(plume.x, seat.x, k), Math.max(lerp(plume.y, seat.y, k), cap), lerp(plume.z, seat.z, k));
      }, from: dOver / PL, to: WELL_TO, weight: 0.65, fade: WELL_FADE },
    ];
    // the runaway: slow out of the chamber, gathering down the tunnel and the gallery, a held breath at the reveal,
    // fast round the helix and faster in the fall, easing only as the well comes up
    const pace = (u) => {
      let a = lerp(0.55, 0.8, smoothstep(0, uS(190), u));
      a = lerp(a, 1.0, smoothstep(uS(190), uS(20), u));
      a = lerp(a, 1.15, smoothstep(uE + 0.07, uE + 0.15, u));
      a = lerp(a, 1.45, smoothstep(uR - 0.03, uR + 0.035, u));
      a = lerp(a, 1.08, smoothstep(0.925, 0.985, u));
      return a * (1 - 0.4 * smoothstep(uE - 0.02, uE + 0.012, u) * (1 - smoothstep(uE + 0.05, uE + 0.09, u)));
    };
    return {
      scene, path, duration: 40, title: 'The Geode Run', ride: 'none', style: 'none',
      camera: { fov: 64, near: 0.3, far: 900, lookAhead: 24, sway: 0.35, bank: 0.8 },
      pois, pace,
      portal: { shape: 'circle', radius: 7, color: LK.portal, glow: 1.1, tilt: true, revealDistance: 240 },
      post: {
        exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.7, threshold: 0.85 },
        grade: { saturation: 1.08, contrast: 1.06, tint: '#f0f4ff', shadowTint: '#0a0618', vignette: 0.42, grain: 0.03, aberration: 0 },
      },
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
