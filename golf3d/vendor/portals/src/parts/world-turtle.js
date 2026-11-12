// THE WORLD TURTLE: hero set piece (everything procedural; imports only three and kit/core).
//
// WHAT     A 900 m star-turtle swimming in place. Its carapace is a round shell-world 560 m across: hexagonal
//          scutes whose seams are river valleys, each scute a terraced province (growth rings), a 150 m snow peak
//          with lesser mountains, forests (instanced), a 40 m ring sea with marginal-scute islets, one small city
//          of domes and minarets whose windows switch on at dusk, village lights and a dozen sailing ships. The
//          sea pours off the rim all round as the Rimfall (120 m curtain that atomises into mist) and collects in
//          a faint ring of ice crystals below. Under it: plastron, a 150 m beaked head on a wrinkled neck with
//          amber planet eyes that follow the camera and blink, four flippers stroking once per 9 s and trailing
//          stardust ribbons, a tail. A small sun rides a golden hoop around the world and drives all lighting.
//          A 50 m ring of ice shards turns around the portal seat ahead of the beak.
// SIZE     Origin = base centre (below the belly); +Y up; the turtle faces +Z. Ring sea / shell rim at y = 150
//          (hero.seaY). Shell radius 280. Peak top about y = 300. Beak tip at z = +482, tail tip z = -345,
//          front flipper tips reach |x| = 400. radius 360 (framing radius: shell, neck, flipper roots), extent 480
//          (everything but the hoop), height 330, center (0,150,70). The sun hoop has radius 520 about (0,150,0).
// OPTS     palette    7 hex strings in the brief's order (void, violet, magenta, teal, green, sand, warm light)
//          progress   (number) initial progress; if neither this nor setProgress() is used the piece free-runs a
//                     slow day -> dusk loop from time so the viewer shows life
//          sun        (true) build the sun and its hoop     portalRing (true) ice-shard ring at anchors.portalSeat
//          city       (true)  ships (true)  trees (true, or a number = how many, default 6500)  stardust (true)
//          atmosphere (true) thin blue dome over the shell-world
// PER SEED scute size and layout, province colours, peak position / height / foothills, coastline, number of rim
//          islets, city bearing, skin hue (indigo, teal or plum), star-map density, flipper length and stroke
//          phase, eye colour, hoop bearing, ship count.
// PROGRESS hero.setProgress(u): path progress 0..1 as in the brief. Drives (a) the sun along its hoop from 58 deg
//          above the shell plane (day) through dusk (about u 0.4-0.5, when city windows and village lights switch
//          on one by one) to 12 deg below it at u = 1 (shell-world at night, flank and head lit warm from behind
//          the camera), (b) one slow blink centred on u = 0.80. Flipper strokes, water, ribbons, twinkle use time.
//          hero.setSunAngle(rad | null) overrides the sun elevation; hero.setBlink(0..1 | null) overrides the lid.
//          hero.sun = { direction, position (world space, updated every frame), color (linear), night 0..1 }:
//          copy direction/color into the world's one DirectionalLight so kit objects match the piece.
//          hero.heightAt(x, z) -> local y of the shell-world surface (sea level over water), hero.isLand(x, z).
// ANCHORS  (hero-local space)
//          portalSeat   { position, facing }: centre of the exit portal, 180 m ahead of the beak on the line of
//                       travel; facing is the unit normal pointing back toward the arriving camera, which comes from
//                       ahead of the turtle (26 degrees off its bow), so the ring lies between the last straight and the beak.
//          flightRoute(anchors) (a second export) gives the whole flight as points, with the rules it is built on.
//          flyThrough   ordered Vector3 list for the brief's journey: behind and 250 m above -> down across the
//                       shell (peak 120 m to the left) -> over the city and the right rim -> down 80 m beside the
//                       flank -> forward along the neck to the pass 60 m from the eye, where the list ends: the
//                       way from the eye to the ring (round the beak, a loop ahead of it and the last straight
//                       down portalSeat.facing) is flightRoute's.
//                       Clear of all solids by at least 20 m, flipper strokes included (the Rimfall mist, the
//                       ice ring and stardust are passed through). flyThroughShoulder is a shorter variant
//                       that leaves the shell between the right flipper and the neck.
//          viewpoints   { entry, overCity, flank, eye }: good camera positions;  lookAt: { world, city, eye, head }
//          peak, city, eyeRight, eyeLeft, beakTip, head, flipperTips[4], schoolCenter (comet-fish, right flank),
//          sunHoop { center, radius, normal },  rimRadius, seaY
// PARTS    hero.parts = { shell, trees (group: conifers, broadleaf), city, ships, sunGroup, hoop, portalRing, headGroup,
//          atmosphere, coral { rim, neck } }: toggle
//          .visible or move portalRing if the portal ends up elsewhere.
// LIGHTING Self-lit: every material is a custom shader reading the piece's own sun (direction, colour) plus a
//          magenta fill from the turtle's left and a teal fill from its right (the nebula). It ignores scene
//          lights, so it looks the same in any scene; it honours scene fog (the brief has none). HDR: sun 7,
//          windows 4, eyes 1.5-3, stars on the skin 3, glitter in the Rimfall 3-5; surfaces stay under 0.75.
//          The shell-world casts soft shadows on itself (a 10-step march through the height map toward the sun,
//          per pixel on the land, per vertex on trees and city); opts.coral (true) adds coral gardens.
// COST     about 400k triangles, 28 draw calls (+ about 8.6k points), 0 lights, one 280x280 data texture;
//          build about 400-600 ms, in steps of a few ms (ctx.yield between and inside every step).
//          Trees are 2-7 m (canopy texture on a 150 m peak), with scrub and boulders on the open slopes near the route.
//          Below the rim of the world the sun's key fades to half so the nebula fills carry the turtle after dusk.
import * as THREE from 'three';
import { clamp, lerp } from '../kit/core.js';

const SEA = 150, R_RIM = 280, R_MAP = R_RIM + 4, H_LO = -8, H_RANGE = 176, PERIOD = 9, R_HOOP = 520;
const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#05030f', '#2a1a5a', '#c94f9a', '#2fb8a8', '#3f8a4a', '#c9a86a', '#ffe9a8'];
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- GLSL shared chunks
const G_NOISE = /* glsl */`
uniform vec3 uSunDir, uSunCol, uFillA, uFillB, uAmb, uSideDir;
uniform float uTime, uNight;
uniform sampler2D uMap; uniform float uMapR;
float wtSh=1.;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n=h21(p); return vec2(n,h21(p+n+17.13)); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+17.7; a*=.5; } return s; }
// band-limited fbm: fw = footprint of one pixel in units of p; octaves finer than the pixel fade to their mean
float fbmB(vec2 p, float fw){ float s=0.,a=.5;
  for(int i=0;i<4;i++){ s+=a*mix(vn(p),.5,smoothstep(.2,.6,fw)); p=p*2.03+17.7; fw*=2.03; a*=.5; } return s; }
// shadow cast by the shell-world's own relief: a short march toward the sun through the height map.
// q = hero-local xz, h0 = height above the ring sea (m). Returns 1 lit .. 0 shadowed (soft, wider with distance).
float wtMapShadow(vec2 q, float h0){
  vec2 s=uSunDir.xz; float sl=max(length(s),1e-3); vec2 d=s/sl; float k=uSunDir.y/sl;
  float occ=0., t=3.;
  for(int i=0;i<10;i++){
    float hs=max(texture2D(uMap,(q+d*t)/(2.*uMapR)+.5).r*176.-8.,0.);
    occ=max(occ,clamp((hs-(h0+1.4+k*t))/(1.2+.07*t),0.,1.));
    t*=1.62;
  }
  return 1.-occ;
}
`;
const G_COMMON = /* glsl */`
${G_NOISE}
vec3 wtBump(vec3 N, vec3 P, float h, float k){
  vec3 dx=dFdx(P), dy=dFdy(P); float hx=dFdx(h), hy=dFdy(h);
  vec3 r1=cross(dy,N), r2=cross(N,dx); float det=dot(dx,r1);
  vec3 g=sign(det)*(hx*r1+hy*r2); vec3 o=abs(det)*N-k*g; float l=length(o); return l>1e-9?o/l:N; }
vec3 wtShade(vec3 alb, vec3 N, vec3 V, float rough, float ao){
  float ndl=dot(N,uSunDir);
  float dif=clamp((ndl+.1)/1.1,0.,1.)*wtSh;
  vec3 sun=uSunCol*dif*mix(vec3(1.,.42,.22),vec3(1.),smoothstep(0.,.4,ndl));
  float s=dot(N,uSideDir)*.5+.5;
  vec3 neb=mix(uFillA,uFillB,smoothstep(.15,.85,s));
  vec3 fill=neb*(.5+.5*abs(s*2.-1.))+uAmb*(.6+.4*N.y);
  vec3 H=normalize(uSunDir+V+vec3(0.,1e-4,0.));
  float sp=pow(max(dot(N,H),0.),mix(90.,6.,rough))*(1.-rough)*step(0.,ndl)*mix(2.5,.3,rough)*wtSh;
  float fr=pow(clamp(1.-dot(N,V),0.,1.),3.);
  return alb*(sun+fill*ao)+uSunCol*sp*.5+neb*fr*.45*ao;
}
`;
const G_FOG_MUL = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    col*=exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    col*=1.-smoothstep(fogNear,fogFar,vFogDepth);
  #endif
#endif
`;
// flipper stroke, shared by the limb mesh and the stardust ribbons so the trails stay glued to the tips
const G_FLAP = /* glsl */`
uniform float uStroke;
vec3 rotAx(vec3 v, vec3 a, float ang){ float c=cos(ang), s=sin(ang); return v*c+cross(a,v)*s+a*dot(a,v)*(1.-c); }
// fl: x = 0..1 along the limb, y = phase (cycles), z = amplitude (rad), w = side (+1 right, -1 left, 0 tail)
vec3 wtFlap(vec3 p, vec3 pivot, vec3 axis, vec4 fl, float stroke, out vec2 an){
  float ph=(stroke+fl.y)*6.2831853-1.25*fl.x;
  float w=smoothstep(0.,.3,fl.x)*(.5+.5*fl.x);
  an.x=fl.z*(sin(ph)+.22*sin(2.*ph+.6))*w;
  an.y=-fl.w*fl.z*.5*cos(ph)*w;
  vec3 q=rotAx(p-pivot,axis,an.x);
  q=rotAx(q,vec3(0.,1.,0.),an.y);
  return pivot+q;
}
`;
const G_VARY_V = /* glsl */`
#include <fog_pars_vertex>
varying vec3 vW; varying vec3 vN; varying vec3 vL;
`;
const G_VARY_F = /* glsl */`
#include <fog_pars_fragment>
varying vec3 vW; varying vec3 vN; varying vec3 vL;
`;
// standard tail of a vertex main(): expects vec3 p (local), vec3 n (local)
const G_VERT_END = /* glsl */`
  vL=p;
  vec4 wp=modelMatrix*vec4(p,1.); vW=wp.xyz; vN=mat3(modelMatrix)*n; vN=dot(vN,vN)>1e-12?normalize(vN):vec3(0.,1.,0.);
  vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
`;

// ---------------------------------------------------------------- small helpers
// smooth curve through [t, value] keys (Catmull-Rom on non-uniform keys)
function spline(keys) {
  return (t) => {
    const n = keys.length;
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
    const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
    const h = k2[0] - k1[0], u = (t - k1[0]) / h;
    const m1 = (k2[1] - k0[1]) / Math.max(1e-6, k2[0] - k0[0]) * h, m2 = (k3[1] - k1[1]) / Math.max(1e-6, k3[0] - k1[0]) * h;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * k1[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * k2[1] + (u3 - u2) * m2;
  };
}

// growable geometry builder with arbitrary float attributes
class GB {
  constructor(spec) { this.spec = spec; this.data = {}; for (const k in spec) this.data[k] = []; this.idx = []; this.n = 0; }
  vert(o) { for (const k in this.spec) { const a = o[k], d = this.data[k], s = this.spec[k]; for (let i = 0; i < s; i++) d.push(a ? a[i] || 0 : 0); } return this.n++; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  // parametric surface: pos(u,v) -> [x,y,z]; attr(u,v,p,n) -> extra attributes. Normals from neighbouring vertices;
  // wrapU = the surface closes on itself in u (lathes, tubes) so the seam shades smoothly.
  grid(nu, nv, pos, attr, flip = false, wrapU = false) {
    const base = this.n, w = nu + 1, P = new Array(w * (nv + 1));
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P[j * w + i] = pos(i / nu, j / nv);
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const ia = i === nu ? (wrapU ? 1 : nu) : i + 1, ib = i === 0 ? (wrapU ? nu - 1 : 0) : i - 1;
      const a = P[j * w + ia], b = P[j * w + ib], c = P[Math.min(nv, j + 1) * w + i], d = P[Math.max(0, j - 1) * w + i], p = P[j * w + i];
      const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
      if (l > 1e-12) { const s = (flip ? -1 : 1) / l; nx *= s; ny *= s; nz *= s; } else { nx = 0; ny = 1; nz = 0; }
      const o = attr ? attr(i / nu, j / nv, p, [nx, ny, nz]) || {} : {}; o.position = p; if (!o.normal) o.normal = [nx, ny, nz]; this.vert(o);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * w + i, b = a + 1, c = a + w + 1, d = a + w;
      if (flip) this.quad(a, d, c, b); else this.quad(a, b, c, d);
    }
    return base;
  }
  // the same surface, built a few rows at a time so that a large one never holds the page (ctx.yield between row batches)
  async gridA(ctx, rows, nu, nv, pos, attr, flip = false, wrapU = false) {
    const base = this.n, w = nu + 1, P = new Array(w * (nv + 1));
    for (let j = 0; j <= nv; j++) { for (let i = 0; i <= nu; i++) P[j * w + i] = pos(i / nu, j / nv); if (j % rows === rows - 1) await ctx.yield(); }
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const ia = i === nu ? (wrapU ? 1 : nu) : i + 1, ib = i === 0 ? (wrapU ? nu - 1 : 0) : i - 1;
        const a = P[j * w + ia], b = P[j * w + ib], c = P[Math.min(nv, j + 1) * w + i], d = P[Math.max(0, j - 1) * w + i], p = P[j * w + i];
        const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
        if (l > 1e-12) { const s = (flip ? -1 : 1) / l; nx *= s; ny *= s; nz *= s; } else { nx = 0; ny = 1; nz = 0; }
        const o = attr ? attr(i / nu, j / nv, p, [nx, ny, nz]) || {} : {}; o.position = p; if (!o.normal) o.normal = [nx, ny, nz]; this.vert(o);
      }
      if (j % rows === rows - 1) await ctx.yield();
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * w + i, b = a + 1, c = a + w + 1, d = a + w;
      if (flip) this.quad(a, d, c, b); else this.quad(a, b, c, d);
    }
    return base;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    for (const k in this.spec) g.setAttribute(k, new THREE.Float32BufferAttribute(this.data[k], this.spec[k]));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    return g;
  }
}
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const lin = (hex) => new THREE.Color(hex);
const mixC = (a, b, t) => a.clone().lerp(b, t);

// ---------------------------------------------------------------- shell-world height map
// Evaluates the miniature continent once on a grid: height above the ring sea (H, metres), distance to the
// nearest scute seam (E), scute id tint (S) and forest density (F). The mesh, the trees, the city and the
// fragment shader (through an RGBA8 texture) all read the same data.
async function buildShellMap(ctx, P) {
  const N = 280, cell = (2 * R_MAP) / N, n2 = ctx.noise.n2, ridged2 = ctx.noise.ridged2;
  const H = new Float32Array(N * N), E = new Float32Array(N * N), S = new Uint8Array(N * N), F = new Float32Array(N * N);
  const GI = 24, ptx = new Float32Array(GI * GI), ptz = new Float32Array(GI * GI), prn = new Float32Array(GI * GI), psh = new Float32Array(GI * GI);
  const Sc = P.scute, rowH = Sc * 0.866, rs = ctx.rng.fork('scutes');
  for (let j = 0; j < GI; j++) for (let i = 0; i < GI; i++) {
    const jj = j - 12, ii = i - 12, k = j * GI + i;
    ptx[k] = (ii + 0.5 * (jj & 1) + rs.range(-0.17, 0.17)) * Sc + P.scuteOff[0];
    ptz[k] = (jj + rs.range(-0.17, 0.17)) * rowH + P.scuteOff[1];
    prn[k] = rs(); psh[k] = rs.range(7, 20);
  }
  const data = new Uint8Array(N * N * 4), M = P.teeth;
  for (let iz = 0; iz < N; iz++) {
    if (iz % 2 === 1) await ctx.yield();
    const z = (iz + 0.5) * cell - R_MAP;
    for (let ix = 0; ix < N; ix++) {
      const x = (ix + 0.5) * cell - R_MAP, r = Math.hypot(x, z), o = iz * N + ix;
      if (r > R_MAP + 3) { H[o] = -1; E[o] = 40; data[o * 4] = ((-1 - H_LO) / H_RANGE) * 255; data[o * 4 + 1] = 255; continue; }
      const wx = x + 9 * n2(x * 0.012 + 7, z * 0.012) + 2.5 * n2(x * 0.05, z * 0.05 + 3);
      const wz = z + 9 * n2(x * 0.012 - 4, z * 0.012 + 9) + 2.5 * n2(x * 0.05 + 8, z * 0.05);
      const jc = Math.round((wz - P.scuteOff[1]) / rowH);
      let d1 = 1e9, d2 = 1e9, k1 = 0, k2 = 0;
      for (let dj = -1; dj <= 1; dj++) {
        const j = jc + dj, ic = Math.round((wx - P.scuteOff[0]) / Sc - 0.5 * (j & 1));
        for (let di = -1; di <= 1; di++) {
          const k = (j + 12) * GI + (ic + di + 12), dx = ptx[k] - wx, dz = ptz[k] - wz, d = dx * dx + dz * dz;
          if (d < d1) { d2 = d1; k2 = k1; d1 = d; k1 = k; } else if (d < d2) { d2 = d; k2 = k; }
        }
      }
      const ex = ptx[k2] - ptx[k1], ez = ptz[k2] - ptz[k1], el = Math.hypot(ex, ez) || 1;
      let e = (((ptx[k1] + ptx[k2]) * 0.5 - wx) * ex + ((ptz[k1] + ptz[k2]) * 0.5 - wz) * ez) / el;
      const nA = n2(x * 0.021 + 3, z * 0.021 - 5), nB = n2(x * 0.05 - 9, z * 0.05 + 2), nC = n2(x * 0.11, z * 0.11 + 6);
      const coastR = P.coast + 9 * n2(x * 0.018 + 20, z * 0.018 - 11) + 3 * nB;
      let land = ss(coastR + 7, coastR - 9, r);
      const dome = 30 * Math.max(0, 1 - (r / coastR) * (r / coastR));
      const plate = ss(1.5, 15, e), sh = psh[k1];
      let terr = Math.min(e / 7, 5); const tf = Math.floor(terr); terr = tf + ss(0.3, 0.7, terr - tf);
      let h = dome + plate * sh * 0.55 + terr * sh * 0.12 + (3.2 * nA + 1.6 * nB + 0.7 * nC) * plate;
      h = lerp(dome * 0.85 - 1.3, h, ss(2.0, 6.5, e));
      let lift = 0;
      for (const pk of P.peaks) {
        const d = Math.hypot(x - pk.x, z - pk.z) / pk.r;
        if (d < 1) { const rid = ridged2(x * pk.f + pk.o, z * pk.f - pk.o, 4); lift += pk.h * Math.pow(1 - d, 1.6) * (0.62 + 0.6 * rid) * (0.9 + 0.1 * nC); }
      }
      h += lift; e += lift * 0.6;
      const dc = Math.hypot(x - P.city.x, z - P.city.z);
      if (dc < 62) { const k = ss(58, 30, dc); h = lerp(h, 4.2 + 0.5 * nC, k); land = Math.max(land, ss(62, 40, dc)); if (dc < 34) e = Math.max(e, 20); }
      h = lerp(-5 - 1.5 * nA, h, land);
      const rimT = ss(R_RIM - 10, R_RIM - 3, r);
      if (rimT > 0) {
        const ang = Math.atan2(x, z), tooth = Math.pow(Math.max(0, Math.cos(ang * M)), 1.4) * ss(R_RIM + 3, R_RIM - 2.5, r) * ss(R_RIM - 10, R_RIM - 5, r);
        h = lerp(h, -0.9 + tooth * (7.5 + 3 * nB + 2 * nC), rimT);
      }
      let f = ss(-0.25, 0.2, n2(x * 0.011 + 50, z * 0.011) + 0.5 * nB + 0.25 * nC) * ss(2.5, 5, h) * ss(72, 52, h) * ss(4, 9, e) * ss(30, 48, dc);
      f = Math.max(f, 0.75 * ss(70, 55, dc) * ss(36, 46, dc) * ss(2.5, 4, h));   // groves ringing the city
      H[o] = h; E[o] = e; S[o] = prn[k1] * 255; F[o] = f;
      const q = o * 4;
      data[q] = clamp((h - H_LO) / H_RANGE, 0, 1) * 255; data[q + 1] = clamp(e / 48, 0, 1) * 255; data[q + 2] = S[o]; data[q + 3] = f * 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const sample = (A, x, z) => {
    const fx = clamp((x + R_MAP) / cell - 0.5, 0, N - 1.001), fz = clamp((z + R_MAP) / cell - 0.5, 0, N - 1.001);
    const ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz, o = iz * N + ix;
    return (A[o] * (1 - tx) + A[o + 1] * tx) * (1 - tz) + (A[o + N] * (1 - tx) + A[o + N + 1] * tx) * tz;
  };
  return { tex, H, E, S, F, N, cell, hAt: (x, z) => sample(H, x, z), eAt: (x, z) => sample(E, x, z), fAt: (x, z) => sample(F, x, z),
    sAt: (x, z) => S[clamp(Math.floor((z + R_MAP) / cell), 0, N - 1) * N + clamp(Math.floor((x + R_MAP) / cell), 0, N - 1)] / 255 };
}

const SHELL_VERT = /* glsl */`
${G_VARY_V}
void main(){
  vec3 p=position, n=normal;
  ${G_VERT_END}
}`;
const SHELL_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
uniform vec3 uCity;
uniform vec3 cGrassA, cGrassB, cGrassC, cForest, cSand, cRockA, cRockB, cShallow, cDeep, cWarm;
void main(){
  vec2 q=vL.xz; float r=length(q);
  vec4 m=texture2D(uMap,q/(2.*uMapR)+.5);
  float h=m.r*${H_RANGE.toFixed(1)}+(${H_LO.toFixed(1)}), e=m.g*48., rnd=m.b, forest=m.a;
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  float fwq=length(fwidth(q)), nearK=1.-smoothstep(.25,1.6,fwq);
  float n1=fbm(q*.07), n2=fbm(q*.55+31.), n3=mix(.5,fbm(q*2.6+7.),nearK);
  float slope=1.-N.y;
  vec3 g=mix(cGrassA,cGrassB,smoothstep(.45,.6,rnd)); g=mix(g,cGrassC,smoothstep(.84,.9,rnd));
  g*=.65+.7*n1; g=mix(g,g*vec3(1.2,1.1,.65),n2*.5);
  float ringT=e/7., rf=fract(ringT);
  float ring=smoothstep(0.,.14,rf)*smoothstep(1.,.86,rf);
  g*=mix(1.,.62+.38*ring,step(ringT,5.2)*smoothstep(3.,6.,e));
  g*=.72+.56*n3;
  float nearD=1.-smoothstep(70.,160.,length(cameraPosition-vW));
  float n4=fbmB(q*1.1+53.,fwq*1.1)*.6+fbmB(q*4.3+11.,fwq*4.3)*.4;      // tufts, stones and furrows: ground that reads from 60 m
  g*=1.+(n4-.5)*.55*nearD;
  float flw=step(.9,h21(floor(q*1.4)))*nearK*smoothstep(.45,.7,n2);
  g=mix(g,mix(cGrassC,cWarm,h21(floor(q*1.4)+3.))*.9,flw*.7);
  g=mix(g,cForest*(.6+.8*n2),forest*.85);
  float dcy=length(q-uCity.xy), pav=smoothstep(uCity.z,uCity.z*.62,dcy);
  float ca=atan(q.x-uCity.x,q.y-uCity.y+1e-4);
  float street=max(smoothstep(.42,.5,abs(fract(ca*1.5915)-.5)),smoothstep(.4,.5,abs(fract(dcy/11.)-.5)));
  vec3 pave=cSand*(.42+.2*n3)*(1.-.3*step(.5,fract(q.x*.45))*step(.5,fract(q.y*.45))*nearK);
  g=mix(g,mix(pave,cSand*.75,street*.8),pav);
  vec3 alb=g; float rough=.95;
  float rockK=clamp(smoothstep(.2,.4,slope+(n2-.5)*.15)+smoothstep(56.,74.,h+n1*14.),0.,1.);
  vec3 rock=mix(cRockA,cRockB,vn(vec2(h*.45+n1*6.,n2*3.)));
  float hy=vL.y-${SEA.toFixed(1)};                                     // the mesh's own height: smooth, unlike the 8-bit map
  float strata=vn(vec2(hy*1.6+n1*4.,r*.05));
  float band=mix(.5,vn(vec2((q.x+q.y)*.3,hy*2.3+n2*1.5))*.6+vn(vec2((q.x-q.y)*.9,hy*6.))*.4,nearK);   // steep faces: horizontal beds, not smears
  float steep=smoothstep(.22,.6,slope);
  rock*=(.75+.5*strata)*mix(1.,.55+.9*band,steep);
  rock=mix(rock,rock*vec3(1.25,1.05,.85),smoothstep(.6,.85,strata)*.6);
  alb=mix(alb,rock,rockK);
  N=wtBump(N,vW,(strata*.6+band*.8)*rockK,.55*nearK*steep);
  N=wtBump(N,vW,n4,.3*nearD*(1.-rockK));
  alb*=1.-.2*clamp(-dot(normalize(vN+vec3(0.,1e-6,0.)),uSunDir)*2.,0.,1.)*smoothstep(.02,.2,slope);   // terraces model
  float snow=smoothstep(86.,99.,h+(n1-.5)*26.-slope*36.);
  alb=mix(alb,vec3(.5,.54,.62),snow);
  alb=mix(alb,cSand*(.75+.4*n2),smoothstep(2.8,1.3,h));
  alb=mix(vec3(dot(alb,vec3(.3,.5,.2))),alb,.82)*.84;      // quieter land: lights, snow and water are the accents
  float ao=mix(.5+.5*smoothstep(0.,11.,e),1.,snow);
  // water: ring sea, estuaries and the rivers in the scute seams
  float sea=smoothstep(.35,-.25,h);
  float river=smoothstep(3.6,2.3,e)*smoothstep(66.,50.,h)*smoothstep(-.2,.6,h);
  float w=max(sea,river);
  vec3 wcol=mix(cShallow,cDeep,clamp(-h/5.5,0.,1.)*sea);
  float rimK=smoothstep(268.,280.,r);
  float foam=smoothstep(.45,.85,vn(vec2(atan(q.x,q.y+1e-4)*70.,r*.1-uTime*1.2)))*rimK*.8+smoothstep(277.5,280.,r)*.5;
  foam+=smoothstep(-1.,-.1,h)*sea*(.35+.25*sin(uTime*1.3+n1*30.));
  wcol=mix(wcol,vec3(.7,.82,.86),clamp(foam,0.,1.)*sea*.85);
  vec3 Nw=normalize(N+vec3(vn(q*.5+uTime*.4)+.5*vn(q*1.7-uTime*.6)-.75,0.,vn(q*.5+9.-uTime*.35)+.5*vn(q*1.7+4.+uTime*.5)-.75)*.13);
  alb=mix(alb,wcol,w); rough=mix(rough,.62,w); N=normalize(mix(N,Nw,w)); ao=mix(ao,1.,w);
  wtSh=wtMapShadow(q,max(h,0.));
  { vec2 sd2=uSunDir.xz/max(length(uSunDir.xz),1e-3); float lowS=1.-smoothstep(.05,.5,uSunDir.y);
    float fs=max(texture2D(uMap,(q+sd2*mix(3.,9.,lowS))/(2.*uMapR)+.5).a,texture2D(uMap,(q+sd2*mix(6.,20.,lowS))/(2.*uMapR)+.5).a*.8);
    float dap=mix(1.,.55+.9*n3,nearK);
    wtSh*=1.-clamp(fs*dap,0.,1.)*mix(.45,.8,lowS)*(1.-w); }
  ao*=mix(.72,1.,wtSh);
  vec3 col=wtShade(alb,N,V,rough,ao);
  col+=alb*uFillB*(1.-wtSh)*.16*smoothstep(-.05,.1,uSunDir.y);    // cool bounce inside the long shadows
  col+=w*wtSh*uSunCol*pow(max(dot(N,normalize(uSunDir+V+vec3(0.,1e-4,0.))),0.),260.)*(1.-clamp(foam,0.,1.))*step(0.,dot(N,uSunDir))*2.2;
  float sd=dot(N,uSideDir)*.5+.5;
  col+=w*mix(uFillA,uFillB,sd)*.16;                       // rivers and sea mirror the nebula, also at night
  { float sang=atan(q.x,q.y+1e-4);
    float cur=smoothstep(.5,.9,vn(vec2(sang*46.,r*.09-uTime*.55)))*(1.-smoothstep(.6,2.5,fwq));     // streaks drawn toward the rim
    float gl1=vn(q*.9+vec2(uTime*.5,uTime*.2)), gl2=vn(q*2.3-vec2(uTime*.4,-uTime*.6));
    float glint=pow(gl1*gl2,3.)*8.*(1.-smoothstep(.3,1.5,fwq));
    vec3 nebW=mix(uFillA,uFillB,gl1);
    col+=sea*(cShallow*(.07+.1*cur)+nebW*glint*.9+cShallow*uNight*.05); }
  float tw=h21(floor(q*1.3));
  col+=snow*wtSh*uSunCol*step(.985,tw)*(.5+.5*sin(uTime*3.+tw*90.))*max(dot(N,uSunDir),0.)*1.6;
  col+=alb*cWarm*vec3(1.,.8,.55)*uNight*1.25*exp(-dcy*dcy/(uCity.z*uCity.z));
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

async function buildShellTop(ctx, map, U, C, P) {
  const G = 152, W = G + 1, pos = new Float32Array(W * W * 3), nor = new Float32Array(W * W * 3), idx = new Uint32Array(G * G * 6);
  const hh = (x, z) => Math.max(0, map.hAt(x, z));
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const u = -1 + (2 * i) / G, v = -1 + (2 * j) / G, o = (j * W + i) * 3;
    const x = R_RIM * u * Math.sqrt(1 - (v * v) / 2), z = R_RIM * v * Math.sqrt(1 - (u * u) / 2);
    pos[o] = x; pos[o + 1] = SEA + hh(x, z); pos[o + 2] = z;
    const d = 2.4, gx = (hh(x + d, z) - hh(x - d, z)) / (2 * d), gz = (hh(x, z + d) - hh(x, z - d)) / (2 * d), l = 1 / Math.hypot(gx, 1, gz);
    nor[o] = -gx * l; nor[o + 1] = l; nor[o + 2] = -gz * l;
    if (i === G && (j & 7) === 7) await ctx.yield();
  }
  let q = 0;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const a = j * W + i, b = a + 1, c = a + W + 1, d = a + W;
    idx[q++] = a; idx[q++] = d; idx[q++] = c; idx[q++] = a; idx[q++] = c; idx[q++] = b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uMap: { value: map.tex }, uMapR: { value: R_MAP }, uCity: { value: new THREE.Vector3(P.city.x, P.city.z, 46) },
      cGrassA: { value: C.grassA }, cGrassB: { value: C.grassB }, cGrassC: { value: C.grassC }, cForest: { value: C.forest }, cSand: { value: C.sand },
      cRockA: { value: C.rockA }, cRockB: { value: C.rockB }, cShallow: { value: C.shallow }, cDeep: { value: C.deep }, cWarm: { value: C.warm } },
    vertexShader: SHELL_VERT, fragmentShader: SHELL_FRAG, fog: true });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'shellWorld';
  return mesh;
}

const TREE_VERT = /* glsl */`
${G_NOISE}
${G_VARY_V}
attribute vec3 aCol; attribute vec2 aSh;      // aSh: x = baked shade (dark under each tier / blob), y = 1 foliage, 0 trunk
varying vec3 vCol; varying vec3 vT;
void main(){
  vec3 q=position; vec3 io=instanceMatrix[3].xyz;
  float ph=uTime*1.3+io.x*.1+io.z*.07;
  float gust=.55+.45*sin(uTime*.37+io.x*.021-io.z*.017);
  float bend=q.y*q.y*(.13*sin(ph)+.045*sin(ph*2.7+io.z))*gust;
  q.x+=bend; q.z+=bend*.6+q.y*q.y*.05*sin(uTime*1.7+io.z*.23);
  q.xz+=aSh.y*.035*vec2(sin(uTime*3.1+position.y*9.+io.x),cos(uTime*2.7+position.x*11.+io.z));   // leaf flutter
  vec3 p=(instanceMatrix*vec4(q,1.)).xyz;
  vec3 n=normalize(normalize(mat3(instanceMatrix)*normal)+vec3(0.,.45,0.));
  vCol=mix(vec3(.11,.07,.06),aCol,aSh.y)*aSh.x;
  vT=vec3(wtMapShadow(io.xz,io.y-${SEA.toFixed(1)}+2.5),aSh.y,h21(io.xz));
  ${G_VERT_END}
}`;
const TREE_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
varying vec3 vCol; varying vec3 vT;
void main(){
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  float fw=length(fwidth(vW));
  float leaf=fbmB(vW.xz*1.7+vW.y*2.3+vT.z*40.,fw*1.7);                 // leaf clumps, only where a pixel can hold them
  float clumpN=fbmB(vW.xz*.42+vW.y*.6+vT.z*9.,fw*.42);                 // boughs: survives further off than the leaves
  vec3 alb=vCol*mix(1.,(.55+.9*leaf)*(.7+.6*clumpN),vT.y);
  alb=mix(alb,alb*vec3(1.25,1.15,.8),vT.y*smoothstep(.55,.8,leaf)*.6);
  wtSh=vT.x;
  vec3 col=wtShade(alb,N,V,.95,.8);
  col+=alb*uSunCol*pow(clamp(dot(-V,uSunDir),0.,1.),4.)*.22*vT.y*wtSh;    // low sun glowing through the crowns
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// distance from (x, z) to the polyline the camera follows over the shell-world
function distToRoute(x, z, pts) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0] - ax, bz = pts[i + 1][1] - az;
    const t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - bx * t, z - az - bz * t));
  }
  return best;
}

async function buildTrees(ctx, map, U, C, P, count) {
  const rng = ctx.rng.fork('trees'), rg = ctx.rng.fork('treeShape');
  const spec = { position: 3, normal: 3, aSh: 2 };
  const trunk = (b, r, h) => { const base = [], top = [];
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU, c = Math.cos(a), s = Math.sin(a);
      base.push(b.vert({ position: [c * r * 1.3, -0.04, s * r * 1.3], normal: [c, 0.1, s], aSh: [0.7, 0] })); top.push(b.vert({ position: [c * r, h, s * r], normal: [c, 0.1, s], aSh: [1, 0] })); }
    for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; b.quad(base[i], top[i], top[j], base[j]); } };
  // conifer: trunk and three stacked skirts, each a little off-axis, dark where the skirt above shades it
  const cb = new GB(spec); trunk(cb, 0.045, 0.3);
  const tier = (r0, y0, y1, ox, oz, tipSh) => { const top = cb.vert({ position: [ox * 0.4, y1, oz * 0.4], normal: [0, 1, 0], aSh: [tipSh, 1] }), ring = [], rot = rg() * TAU;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + rot, rr = r0 * (i % 2 ? 0.82 : 1.06), c = Math.cos(a), s = Math.sin(a);
      ring.push(cb.vert({ position: [ox + c * rr, y0 - (i % 2 ? 0 : 0.035), oz + s * rr], normal: [c * 0.82, 0.57, s * 0.82], aSh: [1.08, 1] })); }
    for (let i = 0; i < 6; i++) cb.tri(top, ring[(i + 1) % 6], ring[i]); };
  tier(0.5, 0.16, 0.6, 0.03, -0.02, 0.5); tier(0.39, 0.4, 0.82, -0.03, 0.02, 0.55); tier(0.26, 0.64, 1.0, 0.01, 0.02, 0.95);
  // broadleaf (maple, cherry): trunk and a lumpy crown of three blobs with dark undersides
  const bb = new GB(spec); trunk(bb, 0.05, 0.5);
  const blob = (src, cx, cy, cz, rx, ry, tone = 1) => { const pa = src.attributes.position, ids = [];
    for (let i = 0; i < pa.count; i++) { let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
      const k = 1 + 0.3 * Math.sin(x * 7.1 + cx * 31) * Math.cos(z * 6.3 + y * 5.2 + cz * 17);
      ids.push(bb.vert({ position: [cx + x * rx * k, cy + y * ry * k, cz + z * rx * k], normal: [x * 0.8 + cx, y, z * 0.8 + cz], aSh: [tone * (0.3 + 0.8 * clamp(y * 0.8 + 0.5, 0, 1)), 1] })); }
    for (let i = 0; i < ids.length; i += 3) bb.tri(ids[i], ids[i + 1], ids[i + 2]); src.dispose(); };
  blob(new THREE.IcosahedronGeometry(1, 0), 0.02, 0.62, 0, 0.46, 0.34);
  blob(new THREE.OctahedronGeometry(1, 0), -0.26, 0.5, 0.2, 0.33, 0.25, 0.8);
  blob(new THREE.OctahedronGeometry(1, 0), 0.3, 0.47, -0.18, 0.31, 0.23, 1.12);
  blob(new THREE.OctahedronGeometry(1, 0), 0.06, 0.84, 0.1, 0.27, 0.2, 1.2);
  // scrub and boulders for the open slopes: one squat faceted lump
  const sb = new GB(spec);
  { const src = new THREE.IcosahedronGeometry(1, 0), pa = src.attributes.position, ids = [];
    for (let i = 0; i < pa.count; i++) { let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
      const k = 1 + 0.28 * Math.sin(x * 5.3 + 1.7) * Math.cos(z * 4.1 + y * 3.3);
      ids.push(sb.vert({ position: [x * 0.5 * k, 0.16 + y * 0.3 * k, z * 0.5 * k], normal: [x, y, z], aSh: [0.5 + 0.6 * clamp(y * 0.8 + 0.5, 0, 1), 1] })); }
    for (let i = 0; i < ids.length; i += 3) sb.tri(ids[i], ids[i + 1], ids[i + 2]); src.dispose(); }
  const geos = [cb.geometry(), bb.geometry(), sb.geometry()], inst = [{ m: [], c: [] }, { m: [], c: [] }, { m: [], c: [] }];
  await ctx.yield();
  const cbr = Math.atan2(P.city.x, P.city.z);
  const route = [[40, -400], [105, -200], [140, -60], [P.city.x - 18, P.city.z - 12], [Math.sin(cbr) * 306, Math.cos(cbr) * 306]];
  const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  let tries = 0, n = 0;
  while (n < count && tries++ < count * 14) {
    if ((tries & 255) === 0) await ctx.yield();
    const a = rng() * TAU, r = Math.sqrt(rng()) * (R_RIM - 30), x = Math.sin(a) * r, z = Math.cos(a) * r;
    const f = map.fAt(x, z); if (f < 0.25 || rng() > f) continue;
    if (distToRoute(x, z, route) > 250 && rng() < 0.4) continue;          // thinner where the camera never comes close
    const h = map.hAt(x, z), dc = Math.hypot(x - P.city.x, z - P.city.z), sr = map.sAt(x, z);
    let col, tall, wide, kind = 1, cherry = false;
    if (dc < 78 && rng() < 0.8) { cherry = true; col = mixC(C.cherry, C.warm, rng.range(0, 0.4)).multiplyScalar(rng.range(0.45, 0.72)); tall = rng.range(5, 7.5); wide = rng.range(5, 7); }
    else if (h > 34 || rng() < 0.4) { kind = 0; col = mixC(C.forest, C.shallow, rng.range(0.05, 0.3)).multiplyScalar(rng.range(0.6, 1.05)); tall = rng.range(8, 13.5); wide = rng.range(3.6, 5); }
    else { const base = sr > 0.86 && dc < 110 ? C.cherry : sr > 0.52 ? mixC(C.sand, C.cherry, rng.range(0, 0.35)) : mixC(C.grassA, C.sand, rng.range(0, 0.4));
      col = base.clone().multiplyScalar(rng.range(0.42, 0.75)); tall = rng.range(6, 9.5); wide = rng.range(5.5, 8); }
    col.r *= rng.range(0.85, 1.15); col.g *= rng.range(0.85, 1.15); col.b *= rng.range(0.85, 1.15);
    { const lum = col.r * 0.3 + col.g * 0.5 + col.b * 0.2, k = cherry ? 0.36 : 0.38, g = cherry ? 0.78 : 0.8;      // quieter crowns: canopy, not candy
      col.r = (col.r + (lum - col.r) * k) * g; col.g = (col.g + (lum - col.g) * k) * g; col.b = (col.b + (lum - col.b) * k) * g; }
    eu.set(rng.range(-0.07, 0.07), rng() * TAU, rng.range(-0.07, 0.07)); qt.setFromEuler(eu); sc.set(wide * 0.47, tall * 0.47, wide * 0.47); ps.set(x, SEA + h - 0.2, z);
    m4.compose(ps, qt, sc); const I = inst[kind]; for (let i = 0; i < 16; i++) I.m.push(m4.elements[i]); I.c.push(col.r, col.g, col.b); n++;
  }
  await ctx.yield();
  // scrub, heather and boulders on the steeper open slopes near the camera's route
  { const rs = rng.fork('scrub'), rockC = new THREE.Color(0.2, 0.18, 0.26), scrubC = mixC(C.forest, C.sand, 0.35), heath = mixC(C.cherry, C.forest, 0.6).multiplyScalar(0.7);
    let k = 0, t2 = 0;
    while (k < 420 && t2++ < 16000) {
      if ((t2 & 511) === 0) await ctx.yield();
      const a = rs() * TAU, r = Math.sqrt(rs()) * (R_RIM - 34), x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (distToRoute(x, z, route) > 150) continue;
      const h = map.hAt(x, z); if (h < 3 || h > 96 || map.fAt(x, z) > 0.55) continue;
      const d = 2.2, gx = (map.hAt(x + d, z) - map.hAt(x - d, z)) / (2 * d), gz = (map.hAt(x, z + d) - map.hAt(x, z - d)) / (2 * d), g = Math.hypot(gx, gz);
      if (g < 0.55 || g > 2.4) continue;
      const rock = rs() < 0.45, col = (rock ? rockC.clone().multiplyScalar(rs.range(0.7, 1.5)) : (rs() < 0.3 ? heath : scrubC).clone().multiplyScalar(rs.range(0.6, 1.1)));
      const w = rock ? rs.range(1.4, 4.2) * (rs() < 0.1 ? 1.8 : 1) : rs.range(1.6, 3.4);
      eu.set(rs.range(-0.3, 0.3), rs() * TAU, rs.range(-0.3, 0.3)); qt.setFromEuler(eu); sc.set(w, w * rs.range(0.7, 1.3), w * rs.range(0.7, 1.2)); ps.set(x, SEA + h - 0.15, z);
      m4.compose(ps, qt, sc); for (let i = 0; i < 16; i++) inst[2].m.push(m4.elements[i]); inst[2].c.push(col.r, col.g, col.b); k++;
    } }
  const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, fog: true });
  const group = new THREE.Group(); group.name = 'forest';
  geos.forEach((geo, k) => {
    const cnt = inst[k].c.length / 3;
    geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(inst[k].c), 3));
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, cnt));
    mesh.instanceMatrix.array.set(inst[k].m); mesh.instanceMatrix.needsUpdate = true; mesh.count = cnt; mesh.frustumCulled = false; group.add(mesh);
  });
  return group;
}

// ---------------------------------------------------------------- turtle skin (body, head, limbs)
const SKIN_VERT = /* glsl */`
${G_VARY_V}
attribute vec2 aUv; attribute vec3 aFeat;
varying vec2 vUv; varying vec3 vFeat;
#ifdef FLAP
${G_FLAP}
attribute vec3 aPivot; attribute vec3 aAxis; attribute vec4 aFlap;
#endif
void main(){
  vec3 p=position, n=normal;
  #ifdef FLAP
    vec2 an; p=wtFlap(p,aPivot,aAxis,aFlap,uStroke,an);
    n=rotAx(n,aAxis,an.x); n=rotAx(n,vec3(0.,1.,0.),an.y);
  #endif
  vUv=aUv; vFeat=aFeat;
  ${G_VERT_END}
}`;
// aFeat: x = dark line (mouth, creases), y = keratin (beak, carapace rim), z = pale underside
const SKIN_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
uniform vec3 cSkinA, cSkinB, cSeam, cBelly, cHorn, cStar, cLine, cMoss;
uniform float uScale, uStarScale, uStarDensity, uRim, uTone, uRough, uFillRim, uStarGain, uUnder, uFall, uRimUnder;
uniform vec3 uBounce, cFall;
varying vec2 vUv; varying vec3 vFeat;
vec3 voro(vec2 x){ vec2 n=floor(x), f=fract(x); float d1=8., d2=8.; vec2 id=n;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 r=g+h22(n+g)-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; id=n+g; } else if(d<d2){ d2=d; } }
  return vec3(sqrt(d2)-sqrt(d1),h21(id+3.3),sqrt(d1)); }
float seg(vec2 a, vec2 b){ vec2 ba=b-a; float h=clamp(dot(-a,ba)/dot(ba,ba),0.,1.); return length(a+ba*h); }
vec2 starMap(vec2 x, float fwc){ vec2 n=floor(x), f=fract(x); float st=0., ln=0.;
  float aw=1./(1./80.+fwc*1.3);                                        // glint arms never thinner than a pixel
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 c=n+g;
    vec2 a=g+.15+.7*h22(c)-f; float b=smoothstep(1.-uStarDensity,1.,h21(c+7.7));
    float d=dot(a,a); vec2 aa=abs(a);
    st+=b*(exp(-d*800.)*1.7+(exp(-aa.x*aw-aa.y*7.)+exp(-aa.y*aw-aa.x*7.))*.6*exp(-d*26.));   // small sharp four-point glints, no soft blobs
    float hl=h21(c+1.9);
    if(hl>.42){ vec2 g2=g+(hl>.71?vec2(1.,0.):vec2(0.,1.)); vec2 c2=n+g2; vec2 a2=g2+.15+.7*h22(c2)-f;
      float b2=smoothstep(1.-uStarDensity,1.,h21(c2+7.7)); float sd=seg(a,a2); ln+=min(b,b2)*exp(-sd*sd*aw*aw*.14); } }
  return vec2(st,ln); }
void main(){
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  // The three features step from 0 to their value across one quad (belly under a paddle, keratin on its leading edge), and
  // at a paddle's tip that quad is thinner than a pixel: an antialiased sample past its edge reads them far outside 0..1,
  // and the mixes below multiply that into a glowing albedo. They are held to the range the vertices carry.
  vec3 feat=clamp(vFeat,0.,1.);
  float mouth=feat.x, keratin=feat.y, belly=feat.z;
  float fw=length(fwidth(vUv));
  float near=1.-smoothstep(.12,.5,fw/uScale), nearS=1.-smoothstep(.06,.3,fw/uStarScale);
  vec3 vo=voro(vUv/uScale);
  float n1=fbm(vUv*.11), n2=fbmB(vUv*.9,fw*.9);
  float pw=fw/uScale;
  float plate=mix(.85,smoothstep(.012,.1+pw*1.5,vo.x),near);
  vo.y=mix(.5,vo.y,near);
  vec3 alb=mix(cSkinA,cSkinB,clamp(vo.y*.34+n1*.9-.12,0.,1.));
  alb*=(.66+.36*n2)*(.82+.36*vo.y);
  alb=mix(cSeam,alb,mix(1.,plate,.7*(1.-keratin)));
  alb=mix(alb,cBelly*(.7+.4*n2),belly*.4*(.45+.55*plate));
  float stri=mix(.5,vn(vec2(vUv.x*.22,vUv.y*1.5)),1.-smoothstep(.12,.4,fw));
  alb=mix(alb,cHorn*(.68+.38*stri),keratin);
  // moss and barnacle crust gathers on the upward faces and in the seams
  float mossN=fbm(vUv*.045+3.), crust=fbmB(vUv*.6+9.,fw*.6);
  float moss=smoothstep(.5,.68,mossN+.25*(1.-plate)*near)*smoothstep(-.15,.5,N.y)*(1.-keratin)*(1.-belly);
  alb=mix(alb,cMoss*(.55+.9*crust),moss*.3);
  alb*=mix(1.,uTone,(1.-belly)*(1.-keratin));
  alb*=1.-.85*mouth;
  float hgt=plate*.7*(1.-keratin)+n2*.5+stri*keratin*.5+moss*crust*.6;
  N=wtBump(N,vW,hgt,1.1*near*(1.-smoothstep(.12,.45,pw*10.)));      // no relief once a seam is narrower than a few pixels
  vec3 col=wtShade(alb,N,V,mix(uRough,.3,keratin),.65+.35*plate);
  vec2 sm=starMap(vUv/uStarScale,fw/uStarScale);
  float pulse=.6+.4*sin(vL.z*.018+uTime*.7);
  float twk=.7+.3*sin(uTime*2.3+vo.y*40.);
  col+=(cStar*sm.x*1.45*twk+cLine*sm.y*1.7*pulse)*(1.-keratin)*(1.-mouth)*nearS*uStarGain;
  col+=(cStar*.05+cLine*.03)*pulse*(1.-nearS)*(1.-keratin);
  { float fr=clamp(1.-dot(N,V),0.,1.); fr*=fr; fr*=fr;                 // warm rim: the low sun finds the brow, beak and neck folds
    col+=uSunCol*uRim*fr*clamp(dot(N,uSunDir)+.35,0.,1.)*(.6+.4*plate); }
  { float f1=clamp(1.-dot(N,V),0.,1.);                                  // nebula rim: a limb keeps a lit edge after dusk
    col+=(uFillA+uFillB)*uFillRim*f1*f1*f1*(.55+.45*plate);
    float nearRim=1.-smoothstep(8.,64.,abs(length(vL.xz)-${R_RIM.toFixed(1)}));
    col+=alb*uBounce*nearRim*4.;                                         // light off the Rimfall's spray on whatever swims beside it
    float under=uUnder*clamp(.35-.65*N.y,0.,1.);
    col+=(alb+cBelly*.25)*(uFillB*1.5+uBounce*4.)*under; }                // the paddle's underside, seen from below against the curtain
  { // Light off the fall, by place. Outside the rim and below the lip a skin is lit from the curtain above and inward of it
    // (a wide soft light and a wet sheen), less the further out it reaches; under the carapace's own rim it takes the light
    // of the spray and the ice ring below. Nothing here follows the eye.
    float rl=length(vL.xz), ro=rl-${R_RIM.toFixed(1)}; vec2 rd=vL.xz/max(rl,1.);
    float fk=uFall*smoothstep(-20.,8.,ro)*exp(-max(ro,0.)/90.)*smoothstep(${(SEA + 16).toFixed(1)},${(SEA - 8).toFixed(1)},vL.y);
    vec3 Lf=normalize(vec3(-rd.x*.5,.86,-rd.y*.5));
    vec3 fc=cFall*(uSunCol*.28+(uFillA+uFillB)*.8+uAmb*.5);
    col+=(alb*2.6+cFall*.06)*fc*clamp(dot(N,Lf)*.65+.35,0.,1.)*fk;
    col+=fc*pow(max(dot(N,normalize(Lf+V)),0.),16.)*fk*.45*(.4+.6*plate);
    col+=(alb+cBelly*.3)*fc*uRimUnder*clamp(.35-.65*N.y,0.,1.)*(1.-smoothstep(0.,70.,-ro))*step(ro,0.); }
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;
function makeSkin(U, C, o) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, cSkinA: { value: C.skinA }, cSkinB: { value: C.skinB }, cSeam: { value: C.seam }, cBelly: { value: C.belly }, cHorn: { value: C.horn },
      cStar: { value: C.star }, cLine: { value: C.line }, cMoss: { value: C.moss }, uScale: { value: o.scale }, uStarScale: { value: o.starScale }, uStarDensity: { value: o.starDensity }, uRim: { value: o.rim ?? 0.1 }, uTone: { value: o.tone ?? 1 }, uRough: { value: o.rough ?? 0.55 },
      uFillRim: { value: o.fillRim ?? 0 }, uStarGain: { value: o.starGain ?? 1 }, uUnder: { value: o.under ?? 0 }, uBounce: { value: C.water.clone().multiplyScalar(o.bounce ?? 0) },
      uFall: { value: o.fall ?? 0 }, uRimUnder: { value: o.rimUnder ?? 0 }, cFall: { value: C.water } },
    defines: o.flap ? { FLAP: 1 } : {}, vertexShader: SKIN_VERT, fragmentShader: SKIN_FRAG, fog: true });
}
const SKIN_SPEC = { position: 3, normal: 3, aUv: 2, aFeat: 3 };

// carapace rim and plastron: a lathe under the shell-world
async function buildBody(ctx, U, C, P) {
  const rK = spline([[0, 279], [0.06, 280.5], [0.12, 279.5], [0.2, 275], [0.3, 262], [0.42, 243], [0.56, 208], [0.7, 160], [0.84, 96], [1, 0.6]]);
  const yK = spline([[0, 0.3], [0.06, -2], [0.12, -7], [0.2, -14], [0.3, -25], [0.42, -39], [0.56, -54], [0.7, -66], [0.84, -75], [1, -80]]);
  const M = P.teeth, b = new GB(SKIN_SPEC);
  const pos = (u, v) => { const a = u * TAU, rim = ss(0.3, 0.1, v);
    const r = rK(v) + rim * ss(0, 0.05, v) * (2.6 * Math.sqrt(Math.max(0, Math.cos(a * M) * 0.5 + 0.5)) - 1.8) + ss(0.3, 0.6, v) * ss(1, 0.8, v) * 2.5 * Math.cos(a * 6);
    return [Math.sin(a) * r, SEA + yK(v), Math.cos(a) * r * (1 + 0.05 * ss(0.3, 0.7, v))]; };
  await b.gridA(ctx, 3, 144, 20, pos, (u, v) => { const a = u * TAU, s = 300 * (1 - v) + 20;
    return { aUv: [Math.sin(a) * s, Math.cos(a) * s], aFeat: [ss(0.19, 0.215, v) * ss(0.24, 0.215, v) * 0.6, ss(0.26, 0.17, v), ss(0.3, 0.55, v)] }; }, true, true);
  const mesh = new THREE.Mesh(b.geometry(), makeSkin(U, C, { scale: 26, starScale: 30, starDensity: P.starDensity, rimUnder: 1 }));
  mesh.name = 'body'; return mesh;
}

// head and neck: superellipse sections lofted along +Z, with brow, eye sockets, beak hook and mouth line
function makeHead(ctx, P) {
  const Z0 = 205, LEN = 277, n3 = ctx.noise.n3;
  const w = spline([[0, 58], [0.12, 47], [0.3, 35], [0.44, 31], [0.52, 40], [0.62, 49], [0.72, 49], [0.82, 44], [0.9, 32], [0.95, 20], [0.985, 9], [1, 2]]);
  const hu = spline([[0, 38], [0.2, 30], [0.44, 25], [0.52, 34], [0.62, 46], [0.72, 47], [0.82, 40], [0.9, 29], [0.95, 20], [0.985, 11], [1, 2]]);
  const hd = spline([[0, 40], [0.2, 31], [0.44, 24], [0.55, 31], [0.66, 34], [0.78, 30], [0.88, 21], [0.94, 13], [0.98, 7], [1, 2.5]]);
  const cy = spline([[0, -46], [0.3, -40], [0.5, -33], [0.7, -27], [0.88, -27], [0.94, -31], [0.975, -41], [1, -58]]);   // the beak hooks down
  const base = (t, phi) => {
    const c = Math.cos(phi), s = Math.sin(phi), pw = lerp(1, 0.8, ss(0.42, 0.6, t));
    return [w(t) * Math.sign(c) * Math.pow(Math.abs(c), pw), SEA + cy(t) + (s > 0 ? hu(t) : hd(t)) * Math.sign(s) * Math.pow(Math.abs(s), pw), Z0 + t * LEN];
  };
  const tE = 0.79, phiE = 0.44, eS = base(tE, phiE);
  const ea = base(tE, phiE + 0.05), eb = base(tE, phiE - 0.05), ec = base(tE + 0.02, phiE), ed = base(tE - 0.02, phiE);
  const eN = new THREE.Vector3(ea[0] - eb[0], ea[1] - eb[1], ea[2] - eb[2]).cross(new THREE.Vector3(ec[0] - ed[0], ec[1] - ed[1], ec[2] - ed[2])).normalize();
  const feat = (t, phi) => { const s = Math.sin(phi), c = Math.cos(phi), ph = Math.atan2(s, Math.abs(c));
    const am = lerp(0.52, 0.2, clamp((t - 0.64) / 0.36, 0, 1)), dl = ph + am, mt = ss(0.64, 0.7, t);
    return { dl, mt, mouth: mt * Math.exp(-(dl / 0.045) * (dl / 0.045)) }; };
  const pos = (u, v) => {
    const phi = u * TAU, t = v, p = base(t, phi), yc = SEA + cy(t);
    let dx = p[0], dy = p[1] - yc; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const neck = ss(0.52, 0.4, t), k = Math.min(1, w(t) / 14);
    let d = neck * (1.2 + 0.8 * ss(0.3, 0, t)) * Math.sin(p[2] * 0.3 + 8 * n3(p[0] * 0.028, p[1] * 0.028, p[2] * 0.016)) * (0.75 - 0.25 * dy);   // deep folds where the neck leaves the shell
    d += 1.5 * n3(p[0] * 0.045, p[1] * 0.045, p[2] * 0.045) + 0.6 * n3(p[0] * 0.13, p[1] * 0.13, p[2] * 0.13);
    const ex = Math.abs(p[0]) - eS[0], ey = p[1] - eS[1], ez = p[2] - eS[2], de = Math.hypot(ex, ey, ez);
    d += 4.6 * Math.exp(-(((de - 13) / 3.6) ** 2)) * (1 + 0.9 * clamp(ey / 12, -0.7, 1)) - 1.6 * Math.exp(-((de / 10.5) ** 2));   // orbit and a heavy brow
    const f = feat(t, phi);
    d += f.mt * (-1.6 * Math.exp(-((f.dl / 0.07) ** 2)) + 1.1 * ss(0, 0.1, f.dl) * ss(0.5, 0.15, f.dl));
    d += 2.2 * ss(0.5, 0.62, t) * ss(0.8, 0.66, t) * Math.max(0, dy) * Math.max(0, dy);          // cranial dome
    d *= k;
    return [p[0] + dx * d, p[1] + dy * d, p[2]];
  };
  const attr = (u, v, p) => { const phi = u * TAU, t = v, f = feat(t, phi), r = 0.5 * (w(t) + hu(t)), dE = Math.hypot(Math.abs(p[0]) - eS[0], p[1] - eS[1], p[2] - eS[2]);
    return { aUv: [(u - 0.5) * TAU * Math.max(r, 16), 205 + t * LEN], aFeat: [Math.max(f.mouth, 0.55 * Math.exp(-(((dE - 11.8) / 2.2) ** 2))), ss(0.83, 0.92, t) * (0.6 + 0.4 * ss(-0.75, -0.3, f.dl)), ss(-0.15, -0.75, Math.sin(phi)) * 0.9] }; };
  return { pos, attr, eye: new THREE.Vector3(eS[0], eS[1], eS[2]), eyeN: eN, tip: new THREE.Vector3(0, SEA + cy(1), Z0 + LEN), Z0, LEN, cy };
}

const EYE_VERT = /* glsl */`
${G_VARY_V}
uniform float uBlink; varying vec3 vD;
void main(){
  vec3 d=normalize(position); vD=d;
  float up=mix(.74,-.1,uBlink)-.34*d.x*d.x, lo=mix(-.74,-.1,uBlink)+.24*d.x*d.x;
  float lc=max(smoothstep(up-.07,up+.05,d.y),smoothstep(lo+.07,lo-.05,d.y));
  vec3 p=position+d*lc*.9; vec3 n=normal;
  ${G_VERT_END}
}`;
const EYE_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
uniform float uBlink; uniform vec2 uLook; uniform vec3 cIrisA, cIrisB, cLid;
varying vec3 vD;
void main(){
  vec3 d=normalize(vD), N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  float up=mix(.74,-.1,uBlink)-.34*d.x*d.x, lo=mix(-.74,-.1,uBlink)+.24*d.x*d.x;
  float lid=max(smoothstep(up-.012,up+.012,d.y),smoothstep(lo+.012,lo-.012,d.y));
  vec3 c=normalize(vec3(uLook,1.));
  vec3 tx=normalize(cross(vec3(0.,1.,0.),c)), ty=cross(c,tx);
  vec2 q=vec2(dot(d,tx),dot(d,ty)); float rr=length(q)+step(dot(d,c),0.);
  float bands=fbm(vec2(q.x*1.6+uTime*.02,q.y*9.+fbm(q*4.+uTime*.03)*2.4));
  vec3 iris=mix(cIrisA,cIrisB,smoothstep(.25,.75,bands));
  iris=mix(iris,cIrisB*1.25,smoothstep(.1,.0,length((q-vec2(.4,-.16))*vec2(1.,1.6))));   // a great spot
  { vec2 qn=q/max(rr,1e-3); float fib=fbm(qn*5.5+3.)*.6+vn(qn*17.+rr*2.+9.)*.4;          // radial fibres, coarse and fine
    iris*=.3+1.5*fib*fib+.5*fib; }
  iris=mix(iris,cIrisB*1.25,smoothstep(.6,.36,rr)*.5);                                   // an amber collar round the pupil
  iris*=.5+.75*smoothstep(.86,.28,rr);
  float pupil=smoothstep(.3,.25,length(q*vec2(.9,1.)));                                  // a round, calm pupil
  iris*=1.-.72*smoothstep(.5,.74,rr);                                                    // a dark limbal ring
  iris*=1.-.5*smoothstep(.42,.3,rr);                                                     // deepening toward the pupil, so it reads dark through the glow
  iris=mix(iris*(1.-.85*smoothstep(.7,.84,rr)),vec3(.004,.002,.012),pupil);
  vec3 eye=mix(iris,vec3(.02,.012,.035),smoothstep(.82,.88,rr));
  float eyeGain=mix(.62,1.5,smoothstep(90.,420.,length(cameraPosition-vW)));             // a lamp from afar, an amber planet at 60 m
  vec3 col=eye*eyeGain+wtShade(eye*.2,N,V,.92,1.);                                      // the amber glows from within
  col+=vec3(1.,.95,.85)*pow(max(dot(N,normalize(V+normalize(vec3(.25,1.,.15)))),0.),260.)*.9;
  col*=.45+.55*smoothstep(up+.02,up-.22,d.y);                                              // shade under the lid
  float wr=fbm(vec2(d.x*5.,d.y*26.));
  float edge=smoothstep(0.,.09,min(abs(d.y-up),abs(d.y-lo)));
  vec3 lc=wtShade(cLid*(.6+.8*wr)*(.35+.65*edge),N,V,.55,.8);
  col=mix(col,lc,lid);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

async function buildHead(ctx, U, C, P) {
  const hd = makeHead(ctx, P), b = new GB(SKIN_SPEC);
  await ctx.yield();
  await b.gridA(ctx, 3, 60, 104, hd.pos, hd.attr, false, true);
  await ctx.yield();
  const pivot = new THREE.Vector3(0, SEA - 42, 215), group = new THREE.Group(); group.position.copy(pivot); group.name = 'head';
  const mesh = new THREE.Mesh(b.geometry(), makeSkin(U, C, { scale: 7.5, starScale: 13, starDensity: Math.min(0.8, P.starDensity + 0.12), rim: 0.4, fillRim: 0.12, starGain: 1.25 }));
  mesh.position.copy(pivot).negate(); group.add(mesh);
  const eyeGeo = new THREE.SphereGeometry(13.6, 36, 26), eyes = [];
  for (const side of [1, -1]) {
    const n = hd.eyeN.clone(); n.x *= side; n.z += 0.1; n.normalize();
    const c = hd.eye.clone(); c.x *= side; c.addScaledVector(n, -8.3);
    const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uBlink: { value: 0 }, uLook: { value: new THREE.Vector2() },
      cIrisA: { value: C.irisA }, cIrisB: { value: C.irisB }, cLid: { value: C.skinA.clone().lerp(C.skinB, 0.35) } }, vertexShader: EYE_VERT, fragmentShader: EYE_FRAG, fog: true });
    const eye = new THREE.Mesh(eyeGeo, mat);
    const right = new THREE.Vector3(0, 1, 0).cross(n).normalize(), up = n.clone().cross(right);
    eye.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, n));
    eye.position.copy(c).sub(pivot); eye.name = side > 0 ? 'eyeRight' : 'eyeLeft';
    group.add(eye); eyes.push({ mesh: eye, mat, center: c, normal: n, look: new THREE.Vector2() });
  }
  return { group, mesh, eyes, info: hd, pivot };
}

// ---------------------------------------------------------------- flippers, tail, stardust ribbons
async function buildLimbs(ctx, U, C, P) {
  const b = new GB({ ...SKIN_SPEC, aPivot: 3, aAxis: 3, aFlap: 4 });
  const hwK = spline([[0, 0.5], [0.2, 0.84], [0.45, 1], [0.7, 0.8], [0.9, 0.45], [1, 0.03]]);
  const tips = [], gaps = [];
  const flipper = (o) => {
    const { root, side, L } = o, NS = 80, cl = [];
    let x = root.x, z = root.z, gap = null;
    for (let i = 0; i <= NS; i++) {
      const s = i / NS, beta = side * (o.beta0 + o.sweep * Math.pow(s, 1.4));
      cl.push([x, z, beta]);
      if (gap === null && Math.hypot(x, z) > R_RIM) gap = Math.atan2(x, z);
      x += Math.sin(beta) * L / NS; z += Math.cos(beta) * L / NS;
    }
    const at = (s) => { const f = clamp(s, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(f)), t = f - i, a = cl[i], c = cl[i + 1];
      return [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)]; };
    const pivot = [root.x, root.y, root.z], axis = [-Math.cos(side * o.beta0), 0, Math.sin(side * o.beta0)];
    // The limb is an arched, twisted paddle (shoulder low, wrist high, tip drooping; leading edge lifting toward the tip),
    // so no viewpoint sees the whole of it edge-on as one flat blade.
    const yc = (v) => root.y + o.droop * (4.25 * v * (1 - v) - v), tw = (v) => 0.06 + 0.36 * Math.pow(v, 1.2);
    const pos = (u, v) => {
      const a = u * TAU, cc = Math.cos(a), sn = Math.sin(a), c = at(v);
      let hw = o.chord * hwK(v); if (cc < 0) hw *= 1 + 0.08 * Math.sin(v * 44) * -cc;
      const th = o.thick * (1 - 0.78 * v) * (0.6 + 0.4 * cc) * (0.25 + 0.75 * Math.sqrt(hwK(v)));
      const camber = 0.3 * o.thick * (1 - 0.7 * v) * sn * sn * Math.sqrt(hwK(v));          // an arched section: full back, flatter palm
      const kc = cc * hw - 0.18 * hw, yv = sn * th * (sn > 0 ? 1.15 : 0.8) + camber + 0.9 * Math.sin(v * 30 + cc * 2) * (1 - v);
      const ct = Math.cos(tw(v)), st = Math.sin(tw(v)), k = side * (kc * ct - yv * st), lx = -Math.cos(c[2]), lz = Math.sin(c[2]);
      return [c[0] + lx * k, yc(v) + kc * st + yv * ct, c[1] + lz * k];
    };
    b.grid(18, 44, pos, (u, v) => { const a = u * TAU, cc = Math.cos(a), sn = Math.sin(a);
      return { aUv: [cc * o.chord * hwK(v) + (sn > 0 ? 0 : 230) + o.uvOff, v * L], aFeat: [0, ss(0.9, 1, cc) * 0.5, sn < 0 ? 0.65 : 0], aPivot: pivot, aAxis: axis, aFlap: [v, o.phase, o.amp, side] }; }, side > 0, true);
    const t = at(0.97);
    tips.push({ rest: new THREE.Vector3(t[0], yc(0.97), t[1]), pivot, axis, flap: [0.97, o.phase, o.amp, side] });
    gaps.push([gap === null ? Math.atan2(root.x, root.z) : gap, (o.chord * 0.9) / R_RIM]);
  };
  for (const side of [1, -1]) {
    await ctx.yield();
    flipper({ root: new THREE.Vector3(side * 198, SEA - 46, 150), side, L: P.flipL, chord: 31, thick: 14, beta0: 1.05, sweep: 1.3, droop: 16, phase: 0, amp: 0.3, uvOff: side * 37 });
    await ctx.yield();
    flipper({ root: new THREE.Vector3(side * 150, SEA - 49, -198), side, L: P.flipL * 0.64, chord: 40, thick: 11, beta0: 2.3, sweep: 0.5, droop: 10, phase: 0.42 + P.rearPhase, amp: 0.15, uvOff: side * 91 + 400 });
  }
  await ctx.yield();
  // tail
  const tb = [0, SEA - 50, -252];
  b.grid(14, 16, (u, v) => { const a = u * TAU, r = 21 * Math.pow(1 - v, 0.8) + 0.3;
    return [Math.cos(a) * r * (1 + 0.06 * Math.sin(v * 40)), tb[1] - 12 * v * v + Math.sin(a) * r * 0.78, tb[2] - 93 * v]; },
  (u, v) => ({ aUv: [u * 130, v * 93 + 700], aFeat: [0, ss(0.8, 1, v) * 0.6, Math.sin(u * TAU) < 0 ? 0.5 : 0], aPivot: tb, aAxis: [0, 1, 0], aFlap: [v, 0.2, 0.14, 0] }), true, true);
  const mesh = new THREE.Mesh(b.geometry(), makeSkin(U, C, { scale: 8.5, starScale: 21, starDensity: P.starDensity, flap: true, rim: 0.3, tone: 0.6, rough: 0.8, fillRim: 0.35, starGain: 1.5, under: 1, bounce: 0.25, fall: 1 }));
  mesh.frustumCulled = false; mesh.name = 'limbs';
  return { mesh, tips, gaps };
}

const RIB_HEAD = /* glsl */`
${G_FLAP}
#include <fog_pars_vertex>
attribute vec3 aPivot; attribute vec3 aAxis; attribute vec4 aFlap; attribute vec3 aRib;
uniform float uTime, uTrailT, uDrift, uPeriod, uPx;
varying vec3 vRib; varying float vNearF;
vec3 trail(float k){
  float tau=k*uTrailT; vec2 an;
  vec3 p=wtFlap(position,aPivot,aAxis,aFlap,uStroke-tau/uPeriod,an);
  p.z-=uDrift*tau; p.x+=aFlap.w*12.*k*k+sin(k*9.+uTime*.6+aRib.z)*4.*k; p.y+=cos(k*7.-uTime*.5+aRib.z*2.)*5.*k;
  return p; }
`;
const RIB_VERT = /* glsl */`
${RIB_HEAD}
void main(){
  float k=aRib.x;
  vec3 a=(modelViewMatrix*vec4(trail(k),1.)).xyz, b=(modelViewMatrix*vec4(trail(k+.012),1.)).xyz;
  vec3 sd=cross(normalize(b-a+vec3(1e-4,0.,0.)),normalize(a)); sd/=max(length(sd),1e-4);
  vec4 mvPosition=vec4(a+sd*aRib.y*mix(1.3,12.,pow(max(k,0.),.85)),1.);
  vRib=aRib; vNearF=mix(.1,1.,smoothstep(70.,300.,length(a)));   // a trail that fills the view up close would wash it out
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RIB_FRAG = /* glsl */`
${G_COMMON}
#include <fog_pars_fragment>
uniform vec3 cA, cB, cC; varying vec3 vRib; varying float vNearF;
void main(){
  float k=vRib.x, x=vRib.y, core=exp(-x*x*3.5);
  float st=vn(vec2(k*46.-uTime*1.2+vRib.z,x*2.5)), fine=vn(vec2(k*150.-uTime*2.,x*7.+vRib.z));
  vec3 c=mix(cA,mix(cB,cC,smoothstep(.2,.9,k)),smoothstep(0.,.3,k));
  float I=pow(clamp(1.-k,0.,1.),1.5)*smoothstep(0.,.12,k)*core*(.45+.9*st+pow(fine,6.)*3.);
  vec3 col=c*I*1.3*vNearF;
  ${G_FOG_MUL}
  gl_FragColor=vec4(col,1.);
}`;
// points: either dust riding the ribbons (RIBBON) or the stardust stream drifting past the whole turtle
const DUST_VERT = /* glsl */`
${RIB_HEAD}
attribute vec4 aRnd; varying float vI; varying float vK;
void main(){
  #ifdef RIBBON
    float k=fract(aRib.x+uTime*.03*(.5+aRnd.w));
    vec3 p=trail(k)+aRnd.xyz*(2.+24.*k);
    float size=(1.4+2.6*aRnd.w)*(1.-.5*k), I=pow(clamp(1.-k,0.,1.),1.2)*smoothstep(0.,.03,k);
  #else
    vec3 p=position; p.z=mod(position.z-uTime*uDrift*(.45+.8*aRnd.w)+900.,1800.)-900.;
    float k=aRnd.x*.5+.5, size=1.2+3.2*aRnd.w*aRnd.w, I=smoothstep(900.,650.,abs(p.z))*.8;
  #endif
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);
  float px=size*uPx/max(1.,-mvPosition.z), nearK=1.;
  #ifdef RIBBON
    nearK=smoothstep(50.,220.,length(mvPosition.xyz));                  // a paddle's trail seen from inside it is fine drops, not a column of sparks
  #endif
  gl_PointSize=clamp(px,1.6,mix(3.5,9.,nearK));
  vI=I*(.45+.55*sin(uTime*(2.+5.*aRnd.w)+aRnd.w*60.))*min(1.,px/1.6)*1.3*mix(.22,1.,nearK); vK=k;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const DUST_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 cA, cB, cC; varying float vI; varying float vK;
void main(){
  float d=length(gl_PointCoord-.5), a=smoothstep(.5,0.,d);
  vec3 col=mix(cA,mix(cB,cC,smoothstep(.3,.9,vK)),smoothstep(0.,.35,vK))*a*a*vI*2.6;
  ${G_FOG_MUL}
  gl_FragColor=vec4(col,1.);
}`;

async function buildStardust(ctx, U, C, tips, opts) {
  const rng = ctx.rng.fork('dust'), group = new THREE.Group(); group.name = 'stardust';
  const uni = { ...fogU(), ...U, uTrailT: { value: 11 }, uDrift: { value: 24 }, uPeriod: { value: PERIOD }, cA: { value: C.warm }, cB: { value: C.magenta }, cC: { value: C.teal } };
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true };
  // ribbons: one strip per flipper tip, all in one mesh
  const K = 90, pos = [], piv = [], ax = [], fl = [], rib = [], idx = [];
  tips.forEach((t, ti) => {
    const base = pos.length / 3, seed = rng() * 20;
    for (let i = 0; i <= K; i++) for (const s of [-1, 1]) { pos.push(t.rest.x, t.rest.y, t.rest.z); piv.push(...t.pivot); ax.push(...t.axis); fl.push(...t.flap); rib.push(i / K, s, seed); }
    for (let i = 0; i < K; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    t.index = ti;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPivot', new THREE.Float32BufferAttribute(piv, 3));
  g.setAttribute('aAxis', new THREE.Float32BufferAttribute(ax, 3)); g.setAttribute('aFlap', new THREE.Float32BufferAttribute(fl, 4));
  g.setAttribute('aRib', new THREE.Float32BufferAttribute(rib, 3)); g.setIndex(idx);
  const ribbons = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: uni, vertexShader: RIB_VERT, fragmentShader: RIB_FRAG, side: THREE.DoubleSide, ...add }));
  ribbons.frustumCulled = false; ribbons.renderOrder = 6; group.add(ribbons);
  await ctx.yield();
  // dust on the ribbons
  { const n = 420, p = [], pv = [], a = [], f = [], r = [], rn = [];
    for (const t of tips) for (let i = 0; i < n; i++) { p.push(t.rest.x, t.rest.y, t.rest.z); pv.push(...t.pivot); a.push(...t.axis); f.push(...t.flap); r.push(rng(), 0, rng() * 20);
      const v = new THREE.Vector3(rng.gauss(), rng.gauss(), rng.gauss()).multiplyScalar(0.5); rn.push(v.x, v.y, v.z, rng()); }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); dg.setAttribute('aPivot', new THREE.Float32BufferAttribute(pv, 3)); dg.setAttribute('aAxis', new THREE.Float32BufferAttribute(a, 3));
    dg.setAttribute('aFlap', new THREE.Float32BufferAttribute(f, 4)); dg.setAttribute('aRib', new THREE.Float32BufferAttribute(r, 3)); dg.setAttribute('aRnd', new THREE.Float32BufferAttribute(rn, 4));
    const pts = new THREE.Points(dg, new THREE.ShaderMaterial({ uniforms: uni, defines: { RIBBON: 1 }, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, ...add }));
    pts.frustumCulled = false; pts.renderOrder = 7; group.add(pts); }
  await ctx.yield();
  // stream drifting backward past the turtle (kept out of the shell-world's own airspace)
  if (opts.stardust !== false) {
    const n = Math.round(2600 * (ctx.quality && ctx.quality.detail > 0 ? ctx.quality.detail : 1)), p = [], rn = [], zero3 = new Float32Array(n * 3), zero4 = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let x, y; do { x = rng.range(-760, 760); y = rng.range(SEA - 420, SEA + 480); } while (Math.abs(x) < R_RIM + 30 && y > SEA - 110 && y < SEA + 190);
      p.push(x, y, rng.range(-900, 900)); rn.push(rng.range(-1, 1), 0, 0, rng());
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); sg.setAttribute('aRnd', new THREE.Float32BufferAttribute(rn, 4));
    sg.setAttribute('aPivot', new THREE.BufferAttribute(zero3, 3)); sg.setAttribute('aAxis', new THREE.BufferAttribute(zero3.slice(), 3));
    sg.setAttribute('aFlap', new THREE.BufferAttribute(zero4, 4)); sg.setAttribute('aRib', new THREE.BufferAttribute(zero3.slice(), 3));
    const pts = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: uni, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, ...add }));
    pts.frustumCulled = false; pts.renderOrder = 7; group.add(pts);
  }
  return group;
}

// ---------------------------------------------------------------- Rimfall, mist, ice ring, atmosphere
const CURT_VERT = /* glsl */`
${G_VARY_V}
varying vec2 vUv;
void main(){
  vec3 p=position, n=normal; vUv=uv;
  ${G_VERT_END}
}`;
const CURT_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
varying vec2 vUv;
uniform float uTeeth; uniform vec2 uGaps[6]; uniform vec3 cWater;
// The bow in the spray, by the sun's place: a ring 42 degrees from the point opposite the sun (a fainter second ring at 51),
// red outermost, as bright as the sun that makes it. V runs from the drop to the eye.
vec3 wtBow(vec3 V){
  float an=acos(clamp(dot(V,uSunDir),-1.,1.));
  float x1=(an-.733)/.05, x2=(.89-an)/.07;
  vec3 b=vec3(smoothstep(-.4,1.1,x1),1.-min(abs(x1)*.8,1.),1.-smoothstep(-1.1,.4,x1))*exp(-x1*x1);
  b+=vec3(smoothstep(-.4,1.1,x2),1.-min(abs(x2)*.8,1.),1.-smoothstep(-1.1,.4,x2))*exp(-x2*x2)*.3;
  b=mix(vec3(dot(b,vec3(.333))),b,.7);                                 // a pale bow, as by a low sun
  return b*dot(uSunCol,vec3(.3,.5,.2));
}
void main(){
  float ang=vUv.x*6.2831853, a=vUv.x*1770., f=vUv.y;
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  float wrap=clamp(dot(N,uSunDir)*.5+.5,0.,1.);
  float back=pow(max(dot(-V,uSunDir),0.),3.);
  float sd=dot(N,uSideDir)*.5+.5;
  vec3 neb=mix(uFillA,uFillB,smoothstep(.15,.85,sd));
  float dist=length(cameraPosition-vW);
  #ifdef MIST
    float fwm=fwidth(a)+fwidth(f)*112.;
    vec3 tint=mix(cWater,cWater*vec3(.35,.95,1.05),.6);
   #ifdef CREST
    // Spray standing over the lip, all round the rim where the sea breaks over: f runs up from the sea's edge. Plumes here
    // and there, none where a paddle, the neck or the tail leaves the shell.
    float gapc=0.;
    for(int i=0;i<6;i++){ float d=abs(mod(ang-uGaps[i].x+3.14159265,6.2831853)-3.14159265); gapc=max(gapc,1.-smoothstep(uGaps[i].y*.6,uGaps[i].y*1.5,d)); }
    float fu=clamp(f,0.,1.);
    float plume=.3+1.2*vn(vec2(a*.09,uTime*.05));
    float al=fbm(vec2(a*.034+uTime*.012,fu*1.5-uTime*.2))*smoothstep(0.,.1,fu)*(1.-fu)*(1.-fu)*plume*(1.-gapc);
    float strk=mix(.5,vn(vec2(a*.3,fu*4.-uTime*.7)),1.-smoothstep(1.5,6.,fwm));
    al*=.5+.9*strk;
    vec3 col=tint*(uSunCol*(wrap*wrap*.35+back*1.1)+neb)*al*.42;
    col+=vec3(1.,.55,.3)*uSunCol*back*back*al*.3;
   #else
    float al=fbm(vec2(a*.028+uTime*.02,f*2.2-uTime*.12))*smoothstep(0.,.3,f)*smoothstep(1.,.55,f);
    float strk=mix(.5,vn(vec2(a*.22,f*9.-uTime*.5)),1.-smoothstep(1.5,6.,fwm));          // falling veils inside the mist
    float grain=mix(.5,vn(vec2(a*1.1,f*46.-uTime*1.6)),1.-smoothstep(.3,1.4,fwm));
    al*=.45+.8*strk+.5*(grain-.5);
    vec3 col=tint*(uSunCol*(wrap*wrap*.3+back*.9)+neb*1.1)*al*al*.5;
    col+=vec3(1.,.55,.3)*uSunCol*back*back*al*al*.25;
    { float ab=clamp(al,0.,1.); col+=wtBow(V)*ab*ab*.4; }                                  // the bow stands in the mist under the fall, where the mist is thick enough to show it
   #endif
    col*=smoothstep(12.,110.,dist);                                                       // never a wall of fog in the lens
    ${G_FOG_MUL}
    gl_FragColor=vec4(col,1.);
  #else
    // fwa: a pixel's footprint across the fall's ropes, in metres. The ropes run down the fall, so a footprint drawn out along
    // them (the curtain seen from the lip, down its own face) costs a quarter of what it costs across them.
    float fall=pow(max(f,0.),.75)*70.-uTime*6.5, fwa=fwidth(a)+fwidth(fall)*.25;
    float sh=fbm(vec2(a*.085,fall*.045));
    float st=mix(.5,vn(vec2(a*.33,fall*.09)),1.-smoothstep(1.2,5.,fwa));
    float fine=mix(.5,vn(vec2(a*1.25,fall*.3)),1.-smoothstep(.3,1.4,fwa));
    float d3=mix(.5,vn(vec2(a*4.1,fall*.75+3.)),1.-smoothstep(.08,.4,fwa));               // detail that only exists near the camera
    float d4=mix(.5,vn(vec2(a*11.,fall*1.7+7.)),1.-smoothstep(.03,.15,fwa));
    float t1=pow(1.-abs(2.*vn(vec2(a*.55,fall*.05+11.))-1.),6.)*(1.-smoothstep(.5,2.2,fwa));
    float t2=pow(1.-abs(2.*vn(vec2(a*2.3,fall*.14+5.))-1.),7.)*(1.-smoothstep(.12,.6,fwa));
    float thread=clamp(t1+.8*t2+.12*smoothstep(.5,2.2,fwa),0.,1.);                        // foam threads
    float tooth=pow(max(0.,cos(ang*uTeeth)),1.4);
    float dens=sh*.75+st*.5+fine*.28+(d3-.5)*.22+(d4-.5)*.14+(1.-f)*.42-tooth*.5*smoothstep(.6,0.,f);
    float body=smoothstep(.5,1.05,dens);
    float gap=0.;
    for(int i=0;i<6;i++){ float d=abs(mod(ang-uGaps[i].x+3.14159265,6.2831853)-3.14159265); gap=max(gap,smoothstep(uGaps[i].y*1.5,uGaps[i].y*.6,d)); }
    float opn=1.-.92*gap*smoothstep(.03,.18,f);
    float veil=fbm(vec2(a*.045+uTime*.012,fall*.035));
    float fadeDown=pow(clamp(1.-f,0.,1.),.8)*smoothstep(1.,.8,f);
    float rear=smoothstep(.62,.2,abs(ang-3.14159265))*smoothstep(.04,.2,f);          // thinner behind, so plastron and tail show from the entry
    opn*=1.-.6*rear;
    float alpha=body*opn*mix(1.,veil*1.4,smoothstep(.25,1.,f))*fadeDown*.92;
    alpha=max(alpha,(.34+.4*thread)*opn*fadeDown*smoothstep(.0,.06,f));                  // glassy water between the white ropes
    alpha=max(alpha,smoothstep(.03,0.,f)*.85*(1.-tooth*.8)*(1.-gap));
    float lipK=1.-smoothstep(.14,.4,f);
    alpha=max(alpha,.86*lipK*opn*(1.-tooth*.4*smoothstep(.1,0.,f)));                       // no hoop or stars through the top 40 m
    float cl=vn(vec2(a*.055,fall*.028+2.))*vn(vec2(a*.17+5.,fall*.065));
    float clump=smoothstep(.2,.42,cl)*(1.-smoothstep(4.,12.,fwa));                         // torn foam falling in clumps
    alpha=max(alpha,clump*.82*opn*fadeDown);
    float fr=pow(clamp(1.-abs(dot(N,V)),0.,1.),3.);
    float foam=clamp(smoothstep(.72,1.2,dens)*.8+thread*.9+clump*(.45+.5*fine),0.,1.);
    // The lip. Where the sea breaks over the rim it is a bright crest (the top few metres); just under it the water is still
    // whole and bends over as dark glass between the white ropes, and only further down is it all foam. f is held to the
    // curtain's own range before the exponential.
    float fcl=clamp(f,0.,1.);
    float crest=exp(-fcl*24.)*(1.-.85*gap);
    float glass=smoothstep(.012,.05,fcl)*(1.-smoothstep(.07,.24,fcl))*(1.-thread);
    foam=clamp(foam*(1.-.85*glass)+crest*(.5+.5*st),0.,1.);
    vec3 deep=cWater*vec3(.07,.4,.5);
    vec3 light=uSunCol*(wrap*wrap*.5+back*.5)+neb*1.15+uAmb;
    // seen from near enough for a pixel to hold its ropes, the fall is white ropes over dark glass, not one pale sheet
    float nearC=1.-smoothstep(.4,2.,fwa), fm=mix(foam,foam*(.3+.7*foam),nearC);
    vec3 col=mix(deep*1.6,cWater,fm)*light*(.72+(.5+.3*nearC)*st+.3*(fine-.5)+.5*(d3-.5)+.4*(d4-.5)-.1*nearC);
    col+=cWater*light*(crest*(1.+1.6*st)+thread*.3*nearC);                               // the crest and the ropes catch the light
    col+=deep*(.16+.3*fr);                                                                // the fall keeps its teal in nebula light
    col+=neb*fr*.4;
    col+=vec3(1.,.5,.22)*cWater*uSunCol*back*(.25+.75*smoothstep(.3,1.,f))*.55;           // warm where the sun shines through
    vec2 gc=vec2(a*1.2,fall*1.6), gf=fract(gc)-.5; float gr=h21(floor(gc));
    float gl=step(.982,gr)*exp(-dot(gf,gf)*22.)*(1.-smoothstep(.5,2.5,fwa))*smoothstep(8.,60.,dist)+.02*smoothstep(.5,2.5,fwa);
    col+=uSunCol*gl*(wrap+back)*2.6*smoothstep(.1,.6,f);
    col+=wtBow(V)*foam*smoothstep(.04,.3,fcl)*.08;                                       // and, fainter, in the fall's own foam below the glassy lip
    gl_FragColor=vec4(col,alpha);
    #include <fog_fragment>
  #endif
}`;
const ICE_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec4 aRnd; uniform float uTime, uPx, uSpin; varying float vI;
void main(){
  float ang=position.z+uTime*uSpin*(.6+.8*aRnd.x);
  vec3 p=vec3(sin(ang)*position.x,position.y+sin(uTime*.4+aRnd.w*30.)*1.5,cos(ang)*position.x);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);
  float size=.7+2.6*aRnd.w*aRnd.w, px=size*uPx/max(1.,-mvPosition.z);
  gl_PointSize=clamp(px,1.5,9.);
  float tw=pow(.5+.5*sin(uTime*(1.5+6.*aRnd.y)+aRnd.w*80.),4.);
  vI=(.22+2.4*tw)*min(1.,px/1.5);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ICE_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 cIce; varying float vI;
void main(){
  vec2 d=gl_PointCoord-.5; float l=length(d), a=smoothstep(.5,0.,l);
  float star=max(0.,1.-abs(d.x)*abs(d.y)*110.)*smoothstep(.5,.1,l);
  vec3 col=cIce*vI*(a*a+star*.6);
  ${G_FOG_MUL}
  gl_FragColor=vec4(col,1.);
}`;
const HALO_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
uniform vec3 cIce, cAir;
void main(){
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  #ifdef RING
    float r=length(vL.xy), ang=atan(vL.x,vL.y+1e-4);
    float k=(r-${(R_RIM + 12).toFixed(1)})/98.;
    float bands=(.35+.65*vn(vec2(r*.13,3.)))*(.5+.5*fbm(vec2(ang*9.+uTime*.03,r*.05)));
    float I=bands*smoothstep(0.,.12,k)*smoothstep(1.,.35,k)/max(abs(dot(N,V)),.16);
    vec3 col=cIce*I*.05*(.5+length(uSunCol)*.3);
  #else
    float rim=pow(clamp(1.-abs(dot(N,V)),0.,1.),3.4);
    float day=clamp(dot(N,uSunDir)*.6+.45,0.,1.);
    vec3 col=mix(vec3(1.,.42,.18),cAir,smoothstep(.1,.6,day))*day*rim*length(uSunCol)*.13+cAir*rim*.03;
    if(!gl_FrontFacing) col*=.4;
    col*=smoothstep(30.,200.,length(cameraPosition-vW));                 // the air's limb is a far thing: no pale wall across the view where the flight goes through it at the lip
  #endif
  ${G_FOG_MUL}
  gl_FragColor=vec4(col,1.);
}`;

function icePoints(rng, U, C, n, gen, spin) {
  const p = [], rn = [];
  for (let i = 0; i < n; i++) { const q = gen(); p.push(q[0], q[1], q[2]); rn.push(rng(), rng(), rng(), rng()); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aRnd', new THREE.Float32BufferAttribute(rn, 4));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uSpin: { value: spin }, cIce: { value: C.ice } },
    vertexShader: ICE_VERT, fragmentShader: ICE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
  pts.frustumCulled = false; pts.renderOrder = 5; return pts;
}

async function buildRimfall(ctx, U, C, P, gaps) {
  const rng = ctx.rng.fork('rimfall'), group = new THREE.Group(); group.name = 'rimfall';
  const spec = { position: 3, normal: 3, uv: 2 };
  const cb = new GB(spec);
  await cb.gridA(ctx, 5, 224, 14, (u, v) => { const a = u * TAU; let r, y;
    if (v < 0.07) { const t = v / 0.07; r = R_RIM - 2.5 + 4.5 * t; y = SEA + 0.35 - 0.6 * t * t; } else { const f = (v - 0.07) / 0.93; r = R_RIM + 2 + 17 * Math.pow(f, 1.5); y = SEA - 0.25 - 120 * Math.pow(f, 1.2); }
    return [Math.sin(a) * r, y, Math.cos(a) * r]; }, (u, v) => ({ uv: [u, Math.max(0, (v - 0.07) / 0.93)] }), true, true);
  const g6 = []; for (let i = 0; i < 6; i++) g6.push(new THREE.Vector2(gaps[i] ? gaps[i][0] : 0, gaps[i] ? gaps[i][1] : 0.001));
  const uni = { ...fogU(), ...U, uTeeth: { value: P.teeth }, uGaps: { value: g6 }, cWater: { value: C.water } };
  const curtain = new THREE.Mesh(cb.geometry(), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: CURT_VERT, fragmentShader: CURT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true }));
  curtain.renderOrder = 2; group.add(curtain);
  await ctx.yield();
  const mb = new GB(spec);
  mb.grid(96, 6, (u, v) => { const a = u * TAU, r = R_RIM + 8 + 32 * Math.sin(Math.PI * Math.min(1, v * 1.05) * 0.86); return [Math.sin(a) * r, SEA - 42 - 112 * v, Math.cos(a) * r]; }, (u, v) => ({ uv: [u, v] }), true, true);
  const mist = new THREE.Mesh(mb.geometry(), new THREE.ShaderMaterial({ uniforms: uni, defines: { MIST: 1 }, vertexShader: CURT_VERT, fragmentShader: CURT_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: true }));
  mist.renderOrder = 3; group.add(mist);
  await ctx.yield();
  // spray standing over the lip, all round the rim: a low veil 30 m tall leaning out over the fall, lit by the sun and the nebula
  const sb = new GB(spec);
  sb.grid(96, 3, (u, v) => { const a = u * TAU, r = R_RIM + 1 + 13 * v; return [Math.sin(a) * r, SEA - 3 + 30 * v, Math.cos(a) * r]; }, (u, v) => ({ uv: [u, v] }), true, true);
  const spray = new THREE.Mesh(sb.geometry(), new THREE.ShaderMaterial({ uniforms: uni, defines: { MIST: 1, CREST: 1 }, vertexShader: CURT_VERT, fragmentShader: CURT_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: true }));
  spray.renderOrder = 3; group.add(spray);
  await ctx.yield();
  // ice ring below the rim: where the fall curves back and freezes
  const yR = SEA - 132;
  group.add(icePoints(rng, U, C, 3400, () => [R_RIM + 14 + 96 * Math.pow(rng(), 1.7), yR + rng.gauss() * 3.5, rng() * TAU], 0.035));
  const rg = new THREE.RingGeometry(R_RIM + 12, R_RIM + 110, 128, 2); rg.rotateX(-Math.PI / 2);
  const haloU = { ...fogU(), ...U, cIce: { value: C.ice }, cAir: { value: C.air } };
  const ringV = /* glsl */`${G_VARY_V} void main(){ vec3 p=position, n=normal; ${G_VERT_END} vL=vec3(position.x,position.z,0.); }`;
  const ring = new THREE.Mesh(rg, new THREE.ShaderMaterial({ uniforms: haloU, defines: { RING: 1 }, vertexShader: ringV, fragmentShader: HALO_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: true }));
  ring.position.y = yR; ring.renderOrder = 4; group.add(ring);
  return { group, haloU };
}

function buildAtmosphere(haloU) {
  const g = new THREE.SphereGeometry(1, 56, 14, 0, TAU, 0, Math.PI / 2); g.scale(R_RIM + 6, 190, R_RIM + 6); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: haloU, vertexShader: SHELL_VERT, fragmentShader: HALO_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: true }));
  m.position.y = SEA - 2; m.renderOrder = 4; m.name = 'atmosphere'; return m;
}

// ---------------------------------------------------------------- coral and barnacle gardens (rim teeth, neck, crown)
const CORAL_VERT = /* glsl */`
${G_NOISE}
${G_VARY_V}
attribute vec3 aCol; attribute vec3 aTipCol; attribute float aTip;
varying vec3 vCol; varying vec3 vTipCol; varying vec2 vTip;
void main(){
  vec3 io=instanceMatrix[3].xyz;
  vec3 q=position; q.xz+=aTip*aTip*.12*vec2(sin(uTime*1.1+io.x*.3+position.y*3.),cos(uTime*.9+io.z*.3+position.x*4.));   // soft tips sway
  vec3 p=(instanceMatrix*vec4(q,1.)).xyz;
  vec3 n=normalize(mat3(instanceMatrix)*normal);
  vCol=aCol; vTipCol=aTipCol; vTip=vec2(aTip,h21(io.xz));
  ${G_VERT_END}
}`;
const CORAL_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
varying vec3 vCol; varying vec3 vTipCol; varying vec2 vTip;
void main(){
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  float t=clamp(vTip.x,0.,1.);                                         // a prong thinner than a pixel: held to the vertices' range before the power
  vec3 alb=vCol*(.35+.75*t)*(.8+.4*fbmB(vL.xz*2.+vL.y*3.,length(fwidth(vL))*2.));
  vec3 col=wtShade(alb,N,V,.8,.55+.45*t);
  float pulse=.65+.35*sin(uTime*1.3+vTip.y*40.+vL.z*.05);
  col+=vTipCol*pow(t,2.5)*(.9+1.5*uNight)*pulse+vTipCol*.06*t;        // fluorescent tips, brighter after dusk
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;
function coralGeometry(rng) {
  const b = new GB({ position: 3, normal: 3, aTip: 1 });
  // branching staghorn: bent three-sided prongs
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + rng.range(-0.4, 0.4), lean = rng.range(0.25, 0.75), len = rng.range(0.7, 1.15), r0 = rng.range(0.07, 0.11);
    const pts = [[Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1], [Math.cos(a) * (0.1 + lean * 0.3 * len), 0.5 * len, Math.sin(a) * (0.1 + lean * 0.3 * len)],
      [Math.cos(a + 0.5) * (0.1 + lean * 0.42 * len), len, Math.sin(a + 0.5) * (0.1 + lean * 0.42 * len)]];
    const rings = pts.map((c, j) => { const r = r0 * (1 - 0.38 * j), ring = [];
      for (let i = 0; i < 3; i++) { const t = (i / 3) * TAU + j; ring.push(b.vert({ position: [c[0] + Math.cos(t) * r, c[1], c[2] + Math.sin(t) * r], normal: [Math.cos(t), 0.25, Math.sin(t)], aTip: [j * 0.5] })); }
      return ring; });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { const i2 = (i + 1) % 3; b.quad(rings[j][i], rings[j + 1][i], rings[j + 1][i2], rings[j][i2]); }
    const cap = b.vert({ position: [pts[2][0], pts[2][1] + 0.06, pts[2][2]], normal: [0, 1, 0], aTip: [1] });
    for (let i = 0; i < 3; i++) b.tri(cap, rings[2][(i + 1) % 3], rings[2][i]);
  }
  // a brain-coral mound and two barnacle cones beside the prongs
  const mound = (cx, cz, r, hgt, tipK) => { const top = b.vert({ position: [cx, hgt, cz], normal: [0, 1, 0], aTip: [tipK] }), r1 = [], r2 = [];
    for (let i = 0; i < 6; i++) { const t = (i / 6) * TAU, c = Math.cos(t), sn = Math.sin(t), w = 1 + 0.18 * Math.sin(i * 2.4 + cx * 9);
      r1.push(b.vert({ position: [cx + c * r * 0.66 * w, hgt * 0.72, cz + sn * r * 0.66 * w], normal: [c * 0.6, 0.8, sn * 0.6], aTip: [tipK * (i % 2 ? 0.75 : 0.3)] }));
      r2.push(b.vert({ position: [cx + c * r * w, -0.05, cz + sn * r * w], normal: [c, 0.15, sn], aTip: [0] })); }
    for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; b.tri(top, r1[j], r1[i]); b.quad(r2[i], r1[i], r1[j], r2[j]); } };
  mound(0.42, -0.3, 0.36, 0.34, 0.8); mound(-0.45, 0.12, 0.2, 0.3, 0.25); mound(-0.2, -0.5, 0.16, 0.26, 0.25);
  return b.geometry();
}
// spots: [{ p: Vector3, n: Vector3 (surface normal), s: size }]
function buildCoral(ctx, U, C, spots, name) {
  const rng = ctx.rng.fork('coral-' + name), geo = coralGeometry(rng), n = spots.length;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: CORAL_VERT, fragmentShader: CORAL_FRAG, side: THREE.DoubleSide, fog: true });
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
  const cols = new Float32Array(Math.max(1, n) * 3), tips = new Float32Array(Math.max(1, n) * 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3();
  const bases = [mixC(C.magenta, C.sand, 0.45), mixC(C.teal, C.violet, 0.4), mixC(C.sand, C.warm, 0.3), mixC(C.magenta, C.violet, 0.5)];
  const glows = [C.teal.clone().multiplyScalar(1.5), C.magenta.clone().multiplyScalar(1.5), mixC(C.teal, C.warm, 0.35).multiplyScalar(1.3)];
  spots.forEach((sp, i) => {
    q.setFromUnitVectors(up, sp.n); q2.setFromAxisAngle(up, rng() * TAU); q.multiply(q2);
    sc.set(sp.s * rng.range(0.8, 1.3), sp.s * rng.range(0.8, 1.5), sp.s * rng.range(0.8, 1.3));
    mesh.setMatrixAt(i, m4.compose(sp.p, q, sc));
    const c = rng.pick(bases).clone().multiplyScalar(rng.range(0.5, 0.85)), g = rng.pick(glows);
    cols.set([c.r, c.g, c.b], i * 3); tips.set([g.r, g.g, g.b], i * 3);
  });
  geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(cols, 3)); geo.setAttribute('aTipCol', new THREE.InstancedBufferAttribute(tips, 3));
  mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'coral-' + name;
  return mesh;
}
async function coralSpots(ctx, map, P, hd) {
  const rng = ctx.rng.fork('coralSpots'), n3 = ctx.noise.n3, rim = [], neck = [], V = THREE.Vector3;
  const cb = Math.atan2(P.city.x, P.city.z);
  // rim teeth, islets and shallows of the ring sea, denser on the side the camera leaves by
  for (let tries = 0; rim.length < 300 && tries < 9000; tries++) {
    if ((tries & 255) === 255) await ctx.yield();
    const near = rng() < 0.6, a = near ? cb + rng.range(-0.75, 1.0) : rng() * TAU, r = rng.range(250, 280.5), x = Math.sin(a) * r, z = Math.cos(a) * r, h = map.hAt(x, z);
    if (h < -1.3 || h > 9 || (r < 268 && h < 0.2)) continue;
    if (n3(x * 0.03, 7, z * 0.03) < -0.25) continue;
    const d = 1.5, gx = (map.hAt(x + d, z) - map.hAt(x - d, z)) / (2 * d), gz = (map.hAt(x, z + d) - map.hAt(x, z - d)) / (2 * d);
    rim.push({ p: new V(x, SEA + Math.max(h, -0.6) - 0.15, z), n: new V(-gx, 1.6, -gz).normalize(), s: rng.range(1.6, 3.6) * (rng() < 0.12 ? 1.7 : 1) });
  }
  // the neck where it leaves the shell, its upper folds, and the crown of the head
  const P3 = (u, v) => { const q = hd.pos(u, v); return new V(q[0], q[1], q[2]); };
  await ctx.yield();
  for (let tries = 0; neck.length < 320 && tries < 9000; tries++) {
    if ((tries & 127) === 127) await ctx.yield();
    const crown = rng() < 0.22, v = crown ? rng.range(0.55, 0.74) : Math.pow(rng(), 1.5) * 0.5 + 0.015, phi = crown ? rng.range(0.3, 0.7) * Math.PI : rng.range(-0.12, 1.12) * Math.PI, u = ((phi / TAU) % 1 + 1) % 1;
    const p = P3(u, v);
    if (n3(p.x * 0.035, p.y * 0.035, p.z * 0.035) + (crown ? 0.1 : 0.3 - v) < 0.05) continue;
    const du = P3(u + 0.01, v).sub(P3(u - 0.01, v)), dv = P3(u, Math.min(1, v + 0.01)).sub(P3(u, Math.max(0, v - 0.01)));
    const nn = du.cross(dv).normalize(); if (nn.dot(new V(p.x, p.y - (SEA + hd.cy(v)), 0)) < 0) nn.negate();
    neck.push({ p: p.addScaledVector(nn, -0.25), n: nn, s: rng.range(1.8, 4.2) * (rng() < 0.1 ? 1.6 : 1) });
  }
  return { rim, neck };
}

// ---------------------------------------------------------------- city, ships, village lights
const CITY_SPEC = { position: 3, normal: 3, aCol: 3, aWin: 3, aGlow: 1 };
const CITY_VERT = /* glsl */`
${G_NOISE}
${G_VARY_V}
attribute vec3 aCol; attribute vec3 aWin; attribute float aGlow; varying vec3 vCol; varying vec3 vWin; varying float vGlow; varying float vShd;
void main(){
  vec3 p=position, n=normal;
  if(aWin.z<0.) p+=n*.45*sin(uTime*1.7+position.y*.6+position.x*.21);      // sailcloth
  vCol=aCol; vWin=aWin; vGlow=aGlow;
  vShd=wtMapShadow(position.xz,max(position.y-${SEA.toFixed(1)},0.)+1.);
  ${G_VERT_END}
}`;
const CITY_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
uniform vec3 cWarm; varying vec3 vCol; varying vec3 vWin; varying float vGlow; varying float vShd;
void main(){
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW); if(!gl_FrontFacing) N=-N;
  vec3 alb=vCol*(.8+.4*vn(vL.xz*.7+vL.y));
  wtSh=vShd;
  vec3 col=wtShade(alb,N,V,.75,1.);
  vec2 wc=vWin.xy/vec2(1.7,2.5), wf=fract(wc), wi=floor(wc);
  float win=step(.28,wf.x)*step(wf.x,.72)*step(.3,wf.y)*step(wf.y,.82)*step(.98,vWin.z);
  float hs=h21(wi+floor(vL.xz*.13));
  float on=step(hs,uNight*1.2-.1);
  col=mix(col,col*.3,win*(1.-on));
  col+=cWarm*vec3(1.,.82,.6)*2.5*win*on*(.75+.25*sin(uTime*(1.+hs*3.)+hs*40.));
  col+=cWarm*vGlow*(.5+2.2*uNight);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;
const LAMP_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute float aRnd; uniform float uTime, uPx, uNight; varying float vI;
void main(){
  vec4 mvPosition=modelViewMatrix*vec4(position,1.);
  float px=(1.6+1.6*aRnd)*uPx/max(1.,-mvPosition.z);
  gl_PointSize=clamp(px,1.8,30.);
  vI=step(aRnd,uNight*1.2-.1)*(.7+.3*sin(uTime*(1.5+aRnd*3.)+aRnd*50.))*min(1.,px/1.8);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LAMP_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 cWarm; varying float vI;
void main(){
  float a=smoothstep(.5,0.,length(gl_PointCoord-.5));
  vec3 col=cWarm*a*a*vI*4.5;
  ${G_FOG_MUL}
  gl_FragColor=vec4(col,1.);
}`;
const poly = (pts) => (v) => { const f = clamp(v, 0, 1) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), t = f - i; return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)]; };
function lathe(b, pts, cx, by, cz, segs, attr) {
  const pf = poly(pts);
  b.grid(segs, pts.length - 1, (u, v) => { const a = u * TAU, q = pf(v); return [cx + Math.cos(a) * q[0], by + q[1], cz + Math.sin(a) * q[0]]; },
    (u, v) => { const q = pf(v); return attr(u * TAU * q[0], q[1], v); }, true, true);
}
const domePts = (R, dh, tall) => { const p = [[R * 1.06, -1.5], [R * 1.06, 0.8], [R, 1], [R, dh], [R * 1.09, dh + 0.3], [R * 1.09, dh + 0.9], [R * 0.97, dh + 1.1]];
  for (let i = 1; i <= 6; i++) { const f = (i / 6) * 1.45; p.push([R * 0.97 * Math.cos(f) * (1 + 0.16 * Math.sin(f * 2.2)), dh + 1.1 + R * tall * Math.sin(f)]); }
  const top = dh + 1.1 + R * tall * Math.sin(1.45); p.push([R * 0.07, top + R * 0.12], [R * 0.05, top + R * 0.45], [0.02, top + R * 0.55]); return p; };
const minaretPts = (r, h) => [[r * 1.35, -1.5], [r * 1.35, 0.8], [r, 1], [r * 0.85, h * 0.6], [r * 1.55, h * 0.63], [r * 1.55, h * 0.665], [r * 0.8, h * 0.675], [r * 0.72, h * 0.84],
  [r * 1.05, h * 0.87], [r * 0.95, h * 0.92], [r * 0.3, h * 0.975], [0.03, h]];

async function buildCity(ctx, map, U, C, P) {
  const rng = ctx.rng.fork('city'), b = new GB(CITY_SPEC), cx = P.city.x, cz = P.city.z;
  const wall = () => mixC(C.sand, C.warm, rng.range(0, 0.4)).multiplyScalar(rng.range(0.55, 0.75));
  const roofs = [C.teal.clone().multiplyScalar(0.7), C.teal.clone().multiplyScalar(0.7), mixC(C.magenta, C.sand, 0.3).multiplyScalar(0.7), C.sand.clone().multiplyScalar(0.9), mixC(C.teal, C.violet, 0.5)];
  const dome = (x, z, R, dh, tall, segs) => { const wc = wall(), rc = rng.pick(roofs), top = dh + 1.1 + R * tall * Math.sin(1.45);
    lathe(b, domePts(R, dh, tall), x, SEA + map.hAt(x, z), z, segs, (ua, y) => { const roof = y > dh + 1, c = roof ? rc : wc;
      return { aCol: [c.r, c.g, c.b], aWin: [ua, y - 0.6, y > 0.95 && y < dh + 0.05 ? 1 : 0], aGlow: y > top ? 1 : 0 }; }); };
  const minaret = (x, z, r, h) => { const wc = wall(), rc = rng.pick(roofs);
    lathe(b, minaretPts(r, h), x, SEA + map.hAt(x, z), z, 8, (ua, y) => { const roof = y > h * 0.86, c = roof ? rc : wc;
      return { aCol: [c.r, c.g, c.b], aWin: [ua, y * 0.5, (y > 0.95 && y < h * 0.6 + 0.05) || (y > h * 0.675 - 0.05 && y < h * 0.84 + 0.05) ? 1 : 0], aGlow: y > h * 0.97 ? 1 : (y > h * 0.69 && y < h * 0.83 ? 0.25 : 0) }; }); };
  dome(cx, cz, 9.5, 8, 1.05, 20);
  await ctx.yield();
  const rot = rng() * TAU;
  for (let i = 0; i < 4; i++) { const a = rot + (i / 4) * TAU; minaret(cx + Math.cos(a) * 14.5, cz + Math.sin(a) * 14.5, 1.5, rng.range(30, 36)); await ctx.yield(); }
  const placed = [[cx, cz, 17]];
  let tries = 0, houses = 0, towers = 0;
  while (tries++ < 400 && houses < 30) {
    const a = rng() * TAU, d = rng.range(20, 42), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, R = rng.range(2.6, 5.4) * (d < 28 ? 1.15 : 1);
    if (map.hAt(x, z) < 2.5 || placed.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + R + 1.2)) continue;
    placed.push([x, z, R]);
    if ((placed.length & 1) === 0) await ctx.yield();
    if (towers < 6 && rng() < 0.2) { minaret(x, z, 1.1, rng.range(17, 26)); towers++; } else { dome(x, z, R, rng.range(4, 8.5), rng.range(0.8, 1.25), 9); houses++; }
  }
  const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, cWarm: { value: C.warm } }, vertexShader: CITY_VERT, fragmentShader: CITY_FRAG, side: THREE.DoubleSide, fog: true });
  const mesh = new THREE.Mesh(b.geometry(), mat); mesh.name = 'city';
  return { mesh, mat };
}

function buildShips(ctx, map, cityMat, C, P) {
  const rng = ctx.rng.fork('ships'), b = new GB(CITY_SPEC), group = new THREE.Group(); group.name = 'ships';
  for (let s = 0; s < P.ships; s++) {
    let ang, rad, tries = 0; do { ang = (s / P.ships) * TAU + rng.range(-0.15, 0.15); rad = rng.range(P.coast + 16, R_RIM - 13); } while (map.hAt(Math.sin(ang) * rad, Math.cos(ang) * rad) > -1.5 && tries++ < 8);
    const ox = Math.sin(ang) * rad, oz = Math.cos(ang) * rad, hx = Math.cos(ang), hz = -Math.sin(ang), L = rng.range(7, 10), sc = L / 8;   // heading: tangent
    const T = (lx, ly, lz) => [ox + hx * lx - hz * lz, SEA + ly, oz + hz * lx + hx * lz];
    const hull = new THREE.Color(0.16, 0.08, 0.05).lerp(C.sand, rng.range(0, 0.3)), sail = (rng() < 0.3 ? mixC(C.magenta, C.warm, 0.35) : mixC(C.warm, C.sand, rng.range(0.1, 0.5))).multiplyScalar(0.7);
    b.grid(8, 6, (u, v) => { const t = u * 2 - 1, w = Math.pow(Math.max(0, 1 - t * t), 0.6) * 2.4 * sc, a = v * Math.PI; return T(t * L + (1 - Math.sin(a)) * 0.6 * t, 1.5 * sc - Math.sin(a) * 2.3 * sc * (0.7 + 0.3 * (1 - t * t)) + t * t * 0.9, Math.cos(a) * w); },
      (u, v) => ({ aCol: [hull.r, hull.g, hull.b], aWin: [0, 0, 0], aGlow: 0 }), false, false);
    for (const m of [[-0.25, 15.5, 6.2], [0.45, 11.5, 4.6]]) {       // [mast position, height, foot]
      const mx = m[0] * L, mh = m[1] * sc, ft = m[2] * sc;
      b.grid(3, 4, (u, v) => { const k = 1 - v * 0.92; return T(mx + (u - 0.35) * ft * k, 2.2 * sc + v * mh, Math.sin(u * Math.PI) * 1.3 * sc * k + 0.3); },
        (u, v) => ({ aCol: [sail.r, sail.g, sail.b], aWin: [0, 0, -1], aGlow: 0 }), false, false);
      const top = b.vert({ position: T(mx, 2.6 * sc + mh, 0.3), normal: [0, 1, 0], aCol: [0.1, 0.06, 0.04], aGlow: 1.2 }), base = [];
      for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; base.push(b.vert({ position: T(mx + Math.cos(a) * 0.3, 1.2 * sc, 0.3 + Math.sin(a) * 0.3), normal: [Math.cos(a) * hx, 0.2, Math.cos(a) * hz], aCol: [0.12, 0.07, 0.05], aGlow: 0 })); }
      for (let i = 0; i < 3; i++) b.tri(top, base[(i + 1) % 3], base[i]);
    }
  }
  const mesh = new THREE.Mesh(b.geometry(), cityMat); mesh.frustumCulled = false; group.add(mesh);
  return group;
}

function buildLamps(ctx, map, U, C, P) {
  const rng = ctx.rng.fork('lamps'), p = [], rn = [];
  let tries = 0;
  while (p.length < 170 * 3 && tries++ < 6000) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * (R_RIM - 34), x = Math.sin(a) * r, z = Math.cos(a) * r, h = map.hAt(x, z), e = map.eAt(x, z);
    if (h < 2.5 || h > 46 || e < 5 || e > 15 || map.fAt(x, z) > 0.5) continue;
    const n = rng.int(2, 6); for (let i = 0; i < n; i++) { const xx = x + rng.gauss() * 5, zz = z + rng.gauss() * 5, hh = map.hAt(xx, zz); if (hh > 2) { p.push(xx, SEA + hh + 1.6, zz); rn.push(rng()); } }
  }
  for (let i = 0; i < 90; i++) { const a = rng() * TAU, d = rng.range(8, 50), x = P.city.x + Math.cos(a) * d, z = P.city.z + Math.sin(a) * d, h = map.hAt(x, z); if (h > 1.5) { p.push(x, SEA + h + 1.4, z); rn.push(rng() * 0.8); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aRnd', new THREE.Float32BufferAttribute(rn, 1));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, cWarm: { value: C.warm } }, vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
  pts.renderOrder = 1; pts.name = 'villageLights'; return pts;
}

// ---------------------------------------------------------------- sun on its hoop, portal ice ring
const UV_VERT = /* glsl */`
${G_VARY_V}
varying vec2 vUv;
#ifdef SHARD
attribute float aRnd; varying float vR;
#endif
uniform float uSize;
void main(){
  vec3 p=position, n=normal; vUv=uv;
  #ifdef SHARD
    p=(instanceMatrix*vec4(position,1.)).xyz; n=normalize(mat3(instanceMatrix)*normal); vR=aRnd;
  #endif
  ${G_VERT_END}
  #ifdef BILLBOARD
    mvPosition=modelViewMatrix*vec4(0.,0.,0.,1.); mvPosition.xy+=position.xy*uSize; gl_Position=projectionMatrix*mvPosition;
  #endif
}`;
const SUN_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
varying vec2 vUv; uniform vec3 cSun, cGold; uniform float uSunAng;
void main(){
  #if defined(BILLBOARD)
    vec2 d=vUv-.5; float r=length(d)*2.;
    float I=pow(max(0.,1.-r),3.)*1.3+exp(-r*r*45.)*2.+pow(max(0.,1.-r),2.)*.22*pow(abs(sin(atan(d.y,d.x)*6.+uTime*.1)),10.);
    vec3 col=cSun*I*smoothstep(1.,.72,r);
  #elif defined(HOOP)
    float ang=vUv.x*6.2831853, d=abs(mod(ang-uSunAng+3.14159265,6.2831853)-3.14159265);
    float stud=smoothstep(.12,0.,abs(fract(vUv.x*72.)-.5));
    float run=pow(.5+.5*sin(ang*36.+uTime*1.2),8.);
    vec3 col=cGold*(.34+stud*1.2+run*.3+3.4*exp(-d*d*60.)+.6*exp(-d*d*4.));
  #elif defined(GIMBAL)
    vec3 col=cGold*(1.5+2.*smoothstep(.12,0.,abs(fract(vUv.x*24.)-.5)));
  #else
    vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
    vec3 col=cSun*(5.+2.6*fbm(vL.xy*.35+uTime*.12)+2.*pow(clamp(1.-abs(dot(N,V)),0.,1.),2.));
  #endif
  ${G_FOG_MUL}
  gl_FragColor=vec4(col,1.);
}`;
const SHARD_FRAG = /* glsl */`
${G_COMMON}
${G_VARY_F}
uniform vec3 cIce; varying float vR;
void main(){
  vec3 N=normalize(vN+vec3(0.,1e-6,0.)), V=normalize(cameraPosition-vW);
  float fr=pow(clamp(1.-abs(dot(N,V)),0.,1.),2.), sd=dot(N,uSideDir)*.5+.5, wrap=clamp(dot(N,uSunDir)*.5+.5,0.,1.);
  float sp=pow(max(dot(N,normalize(uSunDir+V)),0.),50.);
  float tw=pow(.5+.5*sin(uTime*(1.+3.*vR)+vR*70.+dot(N,vec3(3.,5.,7.))),6.);
  vec3 col=cIce*(.14+.5*fr+.3*wrap*wrap)+mix(uFillA,uFillB,sd)*(.45+fr)+uSunCol*sp*2.+cIce*tw*1.7;
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

function buildSun(U, C, P) {
  const hoop = new THREE.Group(); hoop.name = 'sunHoop'; hoop.position.set(0, SEA, 0);
  const d = new THREE.Vector3(Math.cos(P.hoopYaw), 0, -Math.sin(P.hoopYaw)), up = new THREE.Vector3(0, 1, 0), nrm = d.clone().cross(up);
  hoop.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, up, nrm));
  const uni = { ...fogU(), ...U, cSun: { value: C.sun }, cGold: { value: C.gold }, uSunAng: { value: 0 }, uSize: { value: 95 } };
  const mk = (defines, extra = {}) => new THREE.ShaderMaterial({ uniforms: uni, defines, vertexShader: UV_VERT, fragmentShader: SUN_FRAG, fog: true, ...extra });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R_HOOP, 1.9, 4, 320), mk({ HOOP: 1 })); ring.frustumCulled = false; hoop.add(ring);
  const sun = new THREE.Group(); sun.name = 'sun'; hoop.add(sun);
  sun.add(new THREE.Mesh(new THREE.IcosahedronGeometry(15, 3), mk({})));
  sun.add(new THREE.Mesh(new THREE.TorusGeometry(23, 1.3, 4, 48), mk({ GIMBAL: 1 })));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mk({ BILLBOARD: 1 }, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.frustumCulled = false; glow.renderOrder = 8; sun.add(glow);
  return { hoop, sun, uni, dir: d, normal: nrm };
}

function buildPortalRing(ctx, U, C, seat) {
  const rng = ctx.rng.fork('portalRing'), group = new THREE.Group(); group.name = 'portalRing';
  group.position.copy(seat.position); group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), seat.facing);
  const spin = new THREE.Group(); group.add(spin);
  const n = 230, geo = new THREE.OctahedronGeometry(1, 0), rn = new Float32Array(n);
  const mesh = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, cIce: { value: C.ice } }, defines: { SHARD: 1 }, vertexShader: UV_VERT, fragmentShader: SHARD_FRAG, fog: true }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU, big = rng() < 0.12, r = 25 + rng.gauss() * (big ? 1.2 : 2.4), w = big ? rng.range(1.2, 2) : rng.range(0.3, 0.95);
    p.set(Math.sin(a) * r, rng.gauss() * 1.7, Math.cos(a) * r); e.set(rng() * TAU, rng() * TAU, rng() * TAU); q.setFromEuler(e); s.set(w, w * rng.range(2.2, 4.5), w * rng.range(0.7, 1.2));
    mesh.setMatrixAt(i, m4.compose(p, q, s)); rn[i] = rng();
  }
  geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rn, 1)); mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; spin.add(mesh);
  group.add(icePoints(rng, U, C, 650, () => [25 + rng.gauss() * 3.4, rng.gauss() * 2.6, rng() * TAU], 0.22));
  return { group, spin };
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, V3 = THREE.Vector3, detail = ctx.quality && ctx.quality.detail > 0 ? ctx.quality.detail : 1;
  const pal = (Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const [, cViolet, cMagenta, cTeal, cGreen, cSand, cWarm] = pal, white = new THREE.Color(1, 1, 1);

  // ---- per-seed parameters
  const cityBearing = rng.range(1.2, 1.7), coast = rng.range(233, 240);
  const P = {
    scute: rng.range(84, 104), scuteOff: [rng.range(-35, 35), rng.range(-35, 35)], coast, teeth: rng.int(22, 30),
    city: { x: Math.sin(cityBearing) * (coast - 31), z: Math.cos(cityBearing) * (coast - 31) },
    peaks: [{ x: rng.range(-18, 18), z: rng.range(-24, 12), r: rng.range(116, 130), h: rng.range(132, 146), f: 0.0105, o: rng.range(0, 60) }],
    starDensity: rng.range(0.45, 0.7), flipL: rng.range(205, 225), rearPhase: rng.range(-0.08, 0.12), ships: rng.int(10, 14), hoopYaw: 0.61 + rng.range(-0.2, 0.2),
  };
  for (let i = rng.int(2, 4); i > 0; i--) { const a = cityBearing + rng.range(1.9, 5.4), d = rng.range(118, 180);   // never under the camera corridor
    P.peaks.push({ x: Math.sin(a) * d, z: Math.cos(a) * d, r: rng.range(42, 66), h: rng.range(22, 48), f: 0.021, o: rng.range(0, 60) }); }
  const variant = rng.pick(['indigo', 'teal', 'plum']), vio = cViolet.clone().multiplyScalar(2.7);
  const C = {
    skinA: variant === 'indigo' ? mixC(vio, cTeal, 0.14) : variant === 'teal' ? mixC(cTeal, vio, 0.55).multiplyScalar(0.7) : mixC(vio, cMagenta, 0.22).multiplyScalar(0.85),
    skinB: variant === 'teal' ? mixC(cGreen, cTeal, 0.6).multiplyScalar(0.5) : mixC(cTeal, vio, 0.5).multiplyScalar(0.6),
    seam: mixC(cSand, cTeal, 0.72).multiplyScalar(0.36), belly: mixC(vio, cSand, 0.3).multiplyScalar(0.5), horn: mixC(cSand, vio, 0.25).multiplyScalar(0.75),
    star: cWarm.clone(), line: cTeal.clone(), warm: cWarm.clone(), magenta: cMagenta.clone(), teal: cTeal.clone(), violet: vio, sand: cSand.clone().multiplyScalar(0.85),
    grassA: cGreen.clone().multiplyScalar(0.95), grassB: mixC(cSand, cGreen, 0.25).multiplyScalar(0.75), grassC: mixC(cMagenta, cSand, 0.45).multiplyScalar(0.6), moss: mixC(cGreen, cTeal, 0.45).multiplyScalar(0.5),
    forest: mixC(cGreen, cViolet, 0.35).multiplyScalar(0.42), rockA: new THREE.Color(0.1, 0.085, 0.15), rockB: new THREE.Color(0.2, 0.18, 0.27),
    shallow: cTeal.clone().multiplyScalar(0.75), deep: mixC(vio, cTeal, 0.3).multiplyScalar(0.5), cherry: mixC(cMagenta, cWarm, 0.25),
    water: mixC(white, cTeal, 0.3).multiplyScalar(0.72), ice: mixC(white, cTeal, 0.25), air: new THREE.Color(0.2, 0.45, 1.0),
    irisA: new THREE.Color(0.8, 0.2, 0.02).lerp(new THREE.Color(0.72, 0.36, 0.02), rng()), irisB: new THREE.Color(1.0, 0.52, 0.09),
    sun: new THREE.Color(1.0, 0.72, 0.38), gold: mixC(cSand, cWarm, 0.5),
  };
  // shared uniforms (same objects in every material)
  const U = {
    uSunDir: { value: new V3(0.5, 0.6, -0.4).normalize() }, uSunCol: { value: new THREE.Color(2.4, 2.1, 1.7) },
    uFillA: { value: cMagenta.clone().multiplyScalar(0.5) }, uFillB: { value: cTeal.clone().multiplyScalar(0.46) }, uAmb: { value: vio.clone().multiplyScalar(0.55) },
    uSideDir: { value: new V3(1, 0, 0) }, uTime: { value: 0 }, uNight: { value: 0 }, uStroke: { value: 0 }, uPx: { value: 470 },
  };

  const object = new THREE.Group(); object.name = 'worldTurtle';
  const map = await buildShellMap(ctx, P);
  U.uMap = { value: map.tex }; U.uMapR = { value: R_MAP };
  await ctx.yield();
  const shell = await buildShellTop(ctx, map, U, C, P); object.add(shell);
  await ctx.yield();
  let trees = null;
  if (opts.trees !== false) { trees = await buildTrees(ctx, map, U, C, P, typeof opts.trees === 'number' ? opts.trees : Math.round(6500 * detail)); object.add(trees); }
  await ctx.yield();
  await ctx.yield();
  object.add(await buildBody(ctx, U, C, P));
  await ctx.yield();
  const head = await buildHead(ctx, U, C, P); object.add(head.group);
  await ctx.yield();
  let coral = null;
  if (opts.coral !== false) {
    const spots = await coralSpots(ctx, map, P, head.info);
    await ctx.yield();
    const rimCoral = buildCoral(ctx, U, C, spots.rim, 'rim'); object.add(rimCoral);
    await ctx.yield();
    const neckCoral = buildCoral(ctx, U, C, spots.neck, 'neck'); neckCoral.position.copy(head.pivot).negate(); head.group.add(neckCoral);
    coral = { rim: rimCoral, neck: neckCoral };
    await ctx.yield();
  }
  const limbs = await buildLimbs(ctx, U, C, P); object.add(limbs.mesh);
  await ctx.yield();
  object.add(await buildStardust(ctx, U, C, limbs.tips, opts));
  await ctx.yield();
  const rimfall = await buildRimfall(ctx, U, C, P, [[0, 0.2], [Math.PI, 0.1], ...limbs.gaps]); object.add(rimfall.group);
  await ctx.yield();
  let atmosphere = null; if (opts.atmosphere !== false) { atmosphere = buildAtmosphere(rimfall.haloU); object.add(atmosphere); }
  let city = null, ships = null;
  await ctx.yield();
  if (opts.city !== false) { city = await buildCity(ctx, map, U, C, P); object.add(city.mesh); }
  await ctx.yield();
  if (opts.ships !== false) {
    const cm = city ? city.mat : new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, cWarm: { value: C.warm } }, vertexShader: CITY_VERT, fragmentShader: CITY_FRAG, side: THREE.DoubleSide, fog: true });
    ships = buildShips(ctx, map, cm, C, P); object.add(ships);
  }
  await ctx.yield();
  object.add(buildLamps(ctx, map, U, C, P));
  await ctx.yield();
  const sun = buildSun(U, C, P); if (opts.sun === false) sun.hoop.visible = false; object.add(sun.hoop);

  // ---- anchors (hero-local)
  const eyeR = head.eyes[0].center.clone(), eyeL = head.eyes[1].center.clone(), tip = head.info.tip.clone();
  const portalPos = new V3(0, SEA - 28, tip.z + 180);
  const eyePass = new V3(eyeR.x + 58, eyeR.y - 2, eyeR.z - 8);
  // The portal looks back over the turtle's right shoulder: the camera loops round ahead of the beak and flies the
  // last straight toward the animal, 26 degrees off its line of travel, so the ring lies between the last straight and the beak.
  const facing = new V3(Math.sin(0.454), 0, Math.cos(0.454));
  const cityTop = new V3(P.city.x, SEA + map.hAt(P.city.x, P.city.z), P.city.z), cb = Math.atan2(P.city.x, P.city.z);
  const pk = P.peaks[0], peak = new V3(pk.x, SEA + map.hAt(pk.x, pk.z), pk.z);
  const tipX = limbs.tips[0].rest.x;
  const flyThrough = [
    new V3(-30, SEA + 250, -600), new V3(40, SEA + 185, -400), new V3(105, SEA + 105, -200), new V3(140, SEA + 62, -60),
    new V3(P.city.x - 18, SEA + 58, P.city.z - 12), new V3(Math.sin(cb + 0.04) * 306, SEA + 34, Math.cos(cb + 0.04) * 306),
    new V3(tipX - 15, SEA - 45, 62), new V3(tipX + 48, SEA - 78, 150), new V3(tipX + 5, SEA - 60, 268), new V3(255, SEA - 34, 352),
    eyePass.clone(),
  ];
  for (const q of [flyThrough[2], flyThrough[3], flyThrough[4]]) q.y = Math.max(q.y, SEA + Math.max(0, map.hAt(q.x, q.z)) + 38);
  const flyThroughShoulder = [   // shorter variant: leaves the shell between the right flipper and the neck
    new V3(-30, SEA + 250, -600), new V3(40, SEA + 185, -400), new V3(105, SEA + 105, -200), new V3(140, SEA + 62, -60),
    new V3(P.city.x - 40, SEA + 58, P.city.z + 10), new V3(150, SEA + 44, 215), new V3(152, SEA + 5, 300), new V3(132, SEA - 12, 360), eyePass.clone(),
  ];
  const anchors = {
    portalSeat: { position: portalPos, facing }, flyThrough, flyThroughShoulder,
    viewpoints: { entry: flyThrough[0].clone(), overCity: flyThrough[4].clone(), flank: flyThrough[7].clone(), eye: eyePass.clone() },
    lookAt: { world: new V3(0, SEA + 40, 0), city: cityTop.clone().setY(cityTop.y + 12), eye: eyeR.clone(), head: new V3(0, SEA - 30, 400) },
    peak, city: cityTop, eyeRight: eyeR, eyeLeft: eyeL, beakTip: tip, head: new V3(0, SEA - 30, 400),
    flipperTips: limbs.tips.map((t) => t.rest.clone()), schoolCenter: new V3(R_RIM + 95, SEA - 62, 30),
    sunHoop: { center: new V3(0, SEA, 0), radius: R_HOOP, normal: sun.normal.clone() }, rimRadius: R_RIM, seaY: SEA,
    // where the flight leaves the shell: over the city, but never less than 0.24 rad aft of the front flipper's tip
    lipBearing: Math.max(cb + 0.04, Math.atan2(limbs.tips[0].rest.x, limbs.tips[0].rest.z) + 0.24),
    flipperRoot: new V3(198, SEA - 46, 150),
  };
  await ctx.yield();
  let portalRing = null;
  if (opts.portalRing !== false) { portalRing = buildPortalRing(ctx, U, C, anchors.portalSeat); object.add(portalRing.group); }

  // ---- state
  const sunAngK = spline([[0, 58], [0.3, 30], [0.42, 14], [0.52, 4], [0.7, -5], [1, -12]]);
  const st = { progress: typeof opts.progress === 'number' ? opts.progress : null, sunAngle: null, blink: null };
  const sunState = { direction: new V3(0, 1, 0), position: new V3(), color: new THREE.Color(), night: 0 };
  const sunLocal = new V3(), tmp = new V3(), tmp2 = new V3(), size = new THREE.Vector2(), hiC = new THREE.Color(2.1, 1.9, 1.55), loC = new THREE.Color(2.2, 1.25, 0.62);
  let first = true;

  function update(dt, time, camera) {
    const prog = st.progress !== null ? clamp(st.progress, 0, 1) : 0.5 - 0.5 * Math.cos(time * 0.045 + 1.0);
    const a = st.sunAngle !== null ? st.sunAngle : (sunAngK(prog) * Math.PI) / 180;
    U.uTime.value = time; U.uStroke.value = time / PERIOD;
    // sun
    sunLocal.copy(sun.dir).multiplyScalar(Math.cos(a)); sunLocal.y = Math.sin(a);
    sun.sun.position.set(R_HOOP * Math.cos(a), R_HOOP * Math.sin(a), 0); sun.uni.uSunAng.value = a;
    object.updateMatrixWorld();
    U.uSunDir.value.copy(sunLocal).transformDirection(object.matrixWorld);
    U.uSideDir.value.set(1, 0, 0).transformDirection(object.matrixWorld);
    U.uSunCol.value.copy(loC).lerp(hiC, ss(0.05, 0.6, a)).multiplyScalar(lerp(0.5, 1, ss(-0.07, 0.02, a)));   // below the rim the key fades: nebula light takes over
    U.uNight.value = ss(0.33, 0.03, a);
    sunState.direction.copy(U.uSunDir.value); sun.sun.getWorldPosition(sunState.position); sunState.color.copy(U.uSunCol.value); sunState.night = U.uNight.value;
    // ambient life
    head.group.rotation.y = 0.034 * Math.sin(time * 0.23) + 0.012 * Math.sin(time * 0.61 + 2);
    head.group.rotation.x = 0.02 * Math.sin(time * 0.17 + 1);
    if (ships) ships.rotation.y = time * 0.0045;
    if (portalRing) portalRing.spin.rotation.y = time * 0.11;
    // eyes: blink and gaze
    let blink = st.blink;
    if (blink === null) blink = st.progress !== null ? ss(0.763, 0.775, prog) * ss(0.803, 0.7896, prog) : ss(0, 0.35, (time % 11) / 1.9) * ss(1, 0.5, (time % 11) / 1.9);
    for (const e of head.eyes) {
      e.mat.uniforms.uBlink.value = clamp(blink, 0, 1);
      if (camera) {
        tmp.setFromMatrixPosition(camera.matrixWorld); e.mesh.worldToLocal(tmp).normalize();
        if (tmp.z > -0.15) tmp2.set(tmp.x, tmp.y, 0).multiplyScalar(0.55 / Math.max(tmp.z, 0.4)); else tmp2.set(0.12, 0, 0);
        if (tmp2.length() > 0.42) tmp2.setLength(0.42);
        const k = first || !(dt > 0) ? 1 : 1 - Math.exp(-dt * 2.2);
        e.look.x += (tmp2.x - e.look.x) * k; e.look.y += (tmp2.y - e.look.y) * k;
        e.mat.uniforms.uLook.value.copy(e.look);
      }
    }
    if (camera && ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = 0.5 * size.y * camera.projectionMatrix.elements[5]; }
    first = false;
  }
  update(0, 0, null);

  const api = {
    object, radius: 360, extent: 480, height: 330, center: new V3(0, SEA, 70), anchors, ground: false, groundY: 0, seaY: SEA,
    update,
    setProgress(u) { st.progress = u; },
    setSunAngle(rad) { st.sunAngle = rad === undefined ? null : rad; },
    setBlink(b) { st.blink = b === undefined ? null : b; },
    sun: sunState,
    heightAt: (x, z) => SEA + Math.max(0, map.hAt(x, z)),
    isLand: (x, z) => Math.hypot(x, z) < R_RIM && map.hAt(x, z) > 0.3,
    parts: { shell, trees, city: city && city.mesh, ships, sunGroup: sun.sun, hoop: sun.hoop, portalRing: portalRing && portalRing.group, headGroup: head.group, atmosphere, coral },
    uniforms: U,
    dispose() { map.tex.dispose(); },
  };
  Object.defineProperty(object.userData, 'hero', { value: api, enumerable: false });   // scene.getObjectByName('worldTurtle').userData.hero
  return api;
}

// ---------------------------------------------------------------- the flight, as rules in hero-local coordinates
// One place for the route, so the world and any clearance check fly the same line.
//  * Over the shell the artist's route is kept (anchors.flyThrough).
//  * The dive: from the lip (anchors.lipBearing, aft of the front flipper) the line slants outward and forward beside
//    the Rimfall, the curtain a wall on the turtle's side, to a point 85 m outside the flipper's tip, 65 m aft of it and
//    30 m below its root; then it runs forward 150 m outside the tip and 52 m below the root. The slant is
//    shallower than a drop straight off the lip (30 to 35 degrees down); the limb is passed outside its tip and below
//    its root, never edge-on, and stays 60 m or more away with its stroke counted.
//  * The end: past the eye, out to the right, then a left-hand loop of radius 90 m ahead of the beak and a last straight
//    of 105 m down anchors.portalSeat.facing: the portal lies between the camera and the turtle.
export function flightRoute(A) {
  const S = A.seaY, r = A.flyThrough.map((v) => [v.x, v.y, v.z]), tip = A.flipperTips[0], P = A.portalSeat.position, F = A.portalSeat.facing;
  const lb = A.lipBearing, lip = [Math.sin(lb) * 306, S + 34, Math.cos(lb) * 306], yOut = A.flipperRoot.y - 30;
  // the opening, 1000 m and 700 m astern, then the artist's four knots: high over the tail, over the aft shell, over the middle, over the city
  const pts = [[-80, S + 142, -1000], [-42, S + 170, -700], ...r.slice(1, 5)];
  const e = r[10];
  pts.push(lip, [tip.x + 85, yOut, tip.z - 65], [tip.x + 150, A.flipperRoot.y - 52, 175], [tip.x + 120, S - 77, 268], [238, S - 37, 328], e.slice());
  const R = 90, LS = 105;
  const X = [P.x + F.x * LS, P.z + F.z * LS], c = [X[0] + F.z * R, X[1] - F.x * R];   // where the loop ends, and its centre
  const a0 = -0.52, a1 = Math.atan2(F.x, -F.z), arc = (a) => [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)];
  const s0 = arc(a0);
  pts.push([e[0] - 20, S - 13, e[2] + 66], [e[0] + 8, S - 17, e[2] + 150]);       // round the tip of the beak, 55 m off it, then out
  const NA = 7;
  for (let i = 0; i <= NA; i++) { const q = arc(a0 + (a1 - a0) * i / NA); pts.push([q[0], S - 22 - 6 * Math.min(1, i / 3), q[1]]); }
  pts.push([P.x + F.x * 55, P.y, P.z + F.z * 55], [P.x, P.y, P.z]);
  return { pts, lip, loopCentre: c, index: { tail: 2, aft: 3, rim: 6, out: 7, flank: 8, turn: 9, neck: 10, eye: 11, beak: 12, leg: 13, loop: 14, loopEnd: 14 + NA } };
}
