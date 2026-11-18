// The Carved House in Snow: a corkscrew climb through a home hollowed out of one cone of apricot rock (built at 8x),
// room after room lit from below by snow glare, up into the dovecote where a thousand pigeons lift at once.
// Everything is carved from one swept mesh and shaded by one rock shader (src/parts/carved-house-in-snow.js);
// the sun squares are analytic (rays through window rectangles), the valley in the windows is painted by view ray.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as INT from '../kit/interior.js';
import * as F from '../kit/fauna.js';
import { buildHero, LAYOUT as L, Bld, makeRock, lathe, pillow, bar, sheet, lin, sstep, lerp, angOf, FLOOR, WELL_R, S0, S_END, ARCHES, PORTAL_POS, PORTAL_DIR, shaftR, SHAFT_R, TOP as SHAFT_TOP } from '../parts/carved-house-in-snow.js';

const DEG = Math.PI / 180;
const sunVec = (az, el) => new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));
// five looks: what is outside the windows, where the sun is, the colour of the bounce, who flies
const LOOKS = {
  snow: { title: 'The Carved House in Snow', az: 142, el: 21, turn: 10, sun: [3.6, 2.8, 1.85], glare: [0.45, 0.95, 1.7], fill: [0.66, 0.38, 0.3], top: [1.15, 1.24, 1.4], fog: '#d6e4f6', fogDen: 0.0042,
    zen: '#2466d0', hor: '#8fbcf0', gA: '#f4f8ff', gB: '#8db2ea', cone: '#e8935c', cap: '#ffffff', tree: '#4a3a40', gain: 1.12, snowy: 1, flakes: 0, blossom: 0, stars: 0, hot: 1, sat: 1.1, exposure: 1.0, dust: '#fff0d8', beam: 0.04 },
  spring: { title: 'The Carved House in Blossom', az: 141, el: 25, turn: 10, sun: [3.3, 2.95, 2.4], glare: [0.5, 1.04, 0.8], fill: [0.64, 0.38, 0.37], top: [1.08, 1.25, 1.2], fog: '#e2ecd0', fogDen: 0.004,
    zen: '#3a84e2', hor: '#b4dcf2', gA: '#a4d260', gB: '#3f8a44', cone: '#eeb088', cap: '#f4c8a8', tree: '#ffc6da', gain: 1.1, snowy: 0, flakes: 0, blossom: 1, stars: 0, hot: 0.8, sat: 1.12, exposure: 1.0, dust: '#fff4c8', beam: 0.04 },
  dusk: { title: 'The Carved House at Harvest Dusk', az: 97, el: 7, turn: -8, sun: [4.0, 1.85, 1.3], glare: [0.4, 0.36, 0.95], fill: [0.4, 0.32, 0.57], top: [0.8, 0.66, 0.9], fog: '#b49cc4', fogDen: 0.0045,
    zen: '#15175c', hor: '#f47a3a', gA: '#6a58a6', gB: '#30286a', cone: '#231a46', cap: '#2e2254', tree: '#1a1234', haze: '#b06a84', mid: '#c84a7c', gain: 0.85, steep: 1.8, snowy: 0, flakes: 0, blossom: 0, stars: 0, hot: 1.1, sat: 1.12, exposure: 1.05, dust: '#ffc890', dark: 1, beam: 0.05 },
  // falling snow: no sun; the cold daylight of the snow sky falls in soft pools through every window (sky: its elevation)
  snowfall: { title: 'The Carved House in Falling Snow', az: 135, el: 30, turn: 0, sky: 42, sun: [0.36, 0.84, 2.3], glare: [0.52, 0.93, 1.66], fill: [0.57, 0.36, 0.29], top: [0.9, 1.12, 1.52], fog: '#d6e0f0', fogDen: 0.0048,
    zen: '#6e92d6', hor: '#cddcf4', gA: '#eef3fc', gB: '#5f84d0', cone: '#c79a84', cap: '#f4f7fc', tree: '#454260', gain: 0.98, snowy: 1, flakes: 1, blossom: 0, stars: 0, hot: 1.1, sat: 1.16, con: 1.15, exposure: 1.0, dust: '#eaf2ff', beam: 0.034 },
  night: { title: 'The Carved House under the Moon', az: 142, el: 23, turn: 8, sun: [0.6, 1.25, 3.1], glare: [0.12, 0.24, 0.6], fill: [0.17, 0.18, 0.33], top: [0.4, 0.52, 0.9], fog: '#0e1830', fogDen: 0.005,
    zen: '#040a20', hor: '#1a2c5a', gA: '#5c7cc0', gB: '#16285a', cone: '#38426e', cap: '#90aae0', tree: '#0a1024', gain: 1.4, snowy: 1, flakes: 0, blossom: 0, stars: 1, hot: 1.3, sat: 1.05, exposure: 1.0, dust: '#a8c0ff', beam: 0.12 },
};
const ROCK = lin('#e9b98e'), SHADE = lin('#b9795a'), OCHRE = lin('#b4432b'), INDIGO = lin('#24406e'), CREAM = lin('#eadcc0'), MADDER = lin('#a8321f'), STRAW = lin('#d9b45e'),
  WOOD = lin('#7a5234'), DARKWOOD = lin('#4a3122'), COPPER = lin('#c8703a'), BRASS = lin('#d8a440'), IRON = lin('#3a3438'), CLAY = [0.36, 0.155, 0.088], PEPPER = lin('#b8201a'), APRICOT = lin('#ff8b2e'), WHITE = lin('#f1ece2');
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k], mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const EMB = 7;                       // embrasure depth
// windows: [s, size (1 = 5 m by 8 m), height of the centre above the floor]. The sitting room's are the picture windows.
const WINS = [[12, 1.75, 11.2], [28, 1.75, 11.2], [44, 1.75, 11.2], [57, 1.6, 10.9], [82, 1.3, 10], [91, 1.3, 10], [110, 1.75, 11.2], [124, 1.75, 11.2], [138, 1.75, 11.2], [162, 1.75, 11.2], [176, 1.75, 11.2], [190, 1.75, 11.2], [204, 1.75, 11.2], [218, 1.75, 11.2],
  [243, 1.9, 11.4], [258.5, 1.9, 11.4], [276.5, 1.9, 11.4], [289, 2.0, 11.2], [322, 1.75, 11.2], [336, 1.75, 11.2], [350, 1.75, 11.2], [364, 1.75, 11.2], [378, 1.6, 10.8], [401, 1.1, 9.6], [413, 1.1, 9.6], [426.5, 0.9, 7.2]];
const ARCH_S = [128, 180, 250, 332];   // inner arches into the well, 14 m wide
const AH = 7, ASPRING = 6.5, SILL = 2.9;      // half width, springing and sill of the opening, above the ramp
const wallK = (s) => (s < 70 ? 1 : (L.radius(s) + L.wR(s)) / L.radius(s)), innerK = (s) => (s < 70 ? 1 : (L.radius(s) - L.wL(s)) / L.radius(s));
const benchH = (s) => 2.6 * sstep(78, 86, s) * (1 - sstep(436, 446, s)) * (1 - L.pinch(s)) * (1 - sstep(87.5, 91.5, s) * (1 - sstep(128, 132, s)));
const archTop = (dx) => ASPRING + Math.sqrt(Math.max(0, AH * AH - dx * dx));

// ---------------------------------------------------------------------------------------------------------------
// The shell: a gallery section (floor, bench, splayed walls, ring vault) swept along the centre line. Windows are
// embrasures pushed 7 m into the outer wall; inner arches are holes in the wall on the well side.
// ---------------------------------------------------------------------------------------------------------------
async function buildShell(ctx, noise, wins) {
  const b = new Bld(), f = {}, rings = [], starts = [];
  const sList = []; for (let s = S0; s <= S_END + 1e-6; s += 1) { const k = s >= 238 && s <= 302; if (s === 238) sList.push([s, false]); sList.push([s, k]); if (s === 302) sList.push([s, false]); }
  for (const [s, kil] of sList) {
    if ((rings.length & 7) === 0) await ctx.yield();      // eight sections of the sweep, then let a frame through
    L.frame(s, f);
    const wl = L.wL(s), wr = L.wR(s), cr = L.crown(s), hw = cr * 0.55, rise = cr - hw, pin = L.pinch(s), bh = benchH(s), bw = 3.4, rib = L.rib(s), wk = wallK(s), ik = innerK(s);
    const limit = s > 380 ? FLOOR + 3 * (1 - sstep(458, 465, s)) : 1e9, near = wins.filter((w) => Math.abs(w.s - s) < 13), arch = ARCH_S.find((a) => Math.abs(a - s) < 31);
    const ids = [], flag = [];
    const put = (l, h, nl, nh, kind, disp, side, aoK, fw = side === -1 ? 1 : 0) => {
      let push = 0, hole = 0;
      if (side === 1) for (const w of near) { const ex = Math.abs(s - w.s) * wk / (2.5 * w.k), ey = Math.abs(h - w.h) / (4 * w.k); push = Math.max(push, (1 - sstep(1, 1.65, ex)) * (1 - sstep(1, 1.6, ey))); }
      let flat = 1;
      if (fw > 0 && arch !== undefined) { const dx = (s - arch) * ik; flat = lerp(1, sstep(9.8, 15, Math.abs(dx)), fw); if (side === -1 && Math.abs(dx) < AH + 0.15 && h > SILL - 0.15 && h < archTop(Math.min(AH, Math.abs(dx))) + 0.15) hole = 1; }
      let x = f.x + f.nx * l, y = f.y + h + (kind === 7 || h < 0.01 ? rib : 0), z = f.z + f.nz * l;
      // (no relief at the foot of a wall: it meets the floor, or its bench, in a clean line)
      if (disp) { const ribV = s > 74 && s < 440 ? 0.62 * (1 - sstep(0.4, 1.7, Math.abs((((s % 8) + 8) % 8) - 4))) * (1 - pin) : 0;
        const d = ((noise.fbm3(x * 0.055, y * 0.055, z * 0.055, 3) * 0.9 + noise.n3(x * 0.3, y * 0.3, z * 0.3) * 0.12) * disp * (1 - 0.6 * pin) + ribV) * (1 - push) * flat * (side === 0 ? 1 : sstep(0, 2.2, h - (side === 1 ? bh : 0))); x += f.nx * nl * d; z += f.nz * nl * d; y += nh * d; }
      if (push > 0) { x += f.nx * push * EMB; z += f.nz * push * EMB; }
      let clamped = 0; if (y > limit) { y = limit; clamped = Math.hypot(x, z) < 29.6 ? 1 : 0; }
      const t = 0.93 + 0.14 * noise.n3(x * 0.02, y * 0.05, z * 0.02), straw = kind === 7 && s < 64 ? sstep(0.1, 0.5, noise.fbm2(x * 0.09, z * 0.09, 2)) * 0.7 : 0;
      const ao = aoK ?? (kind === 7 ? 0.4 + 0.6 * sstep(0, 7, Math.min(l + wl, wr - bw - l)) : 0.5 + 0.5 * sstep(0, 7, h - (side === 1 ? bh : 0)));
      let c = kil && kind === 7 ? [0.5 * ao, 0.5, 0.5] : mul(mix3(mul(ROCK, t), STRAW, straw), ao);
      const u = kil && kind === 7 ? (l + wl) / (wl + wr - bw) * 3 : s, v = kil && kind === 7 ? s - 238 : (kind === 7 ? l : h);
      ids.push(b.v(x, y, z, f.nx * nl, nh, f.nz * nl, c, kil && kind === 7 ? 4 : kind, 0, u, v)); flag.push(hole ? 2 : clamped);
    };
    const NF = 12, NW = 9, NV = 20;
    for (let i = 0; i <= NF; i++) put(lerp(-wl + 0.2, wr - bw, i / NF), 0, 0, 1, 7, 0, 0);                    // floor 0..12
    put(wr - bw, 0, -1, 0, 0, 0, 0, 0.07); put(wr - bw, bh, -1, 0, 0, 0, 0, 0.3);                              // bench front 13,14: dark at its foot
    put(wr - bw, bh, 0, 1, 0, 0, 0, 0.9); put(wr - 0.2, bh, 0, 1, 0, 0, 0, 0.5);                                // bench top 15,16
    for (let i = 0; i <= NW; i++) { const t = i / NW; put(wr - 0.2 - 1.4 * t, lerp(bh, hw, t), -1, 0.1, 0, 1, 1); }          // outer wall 17..26
    for (let i = 0; i <= NV; i++) { const a = (i / NV) * Math.PI, hx = (wr + wl) / 2 - 1.6, cx = (wr - wl) / 2, n = Math.hypot(Math.cos(a) * rise, Math.sin(a) * hx); put(cx + hx * Math.cos(a), hw + rise * Math.sin(a), -Math.cos(a) * rise / n, -Math.sin(a) * hx / n, 0, 1, Math.cos(a) > 0.2 ? 1 : 0, undefined, sstep(0.1, 0.6, -Math.cos(a))); }   // vault 27..47
    for (let i = 0; i <= NW; i++) { const t = i / NW; put(-(wl - 1.6) - 1.4 * t, lerp(hw, 0, t), 1, 0.1, 0, 0.8, -1); }             // inner wall 48..57
    rings.push({ ids, flag, s });
  }
  const RUNS = [[0, 12], [13, 14], [15, 16], [17, 26], [27, 47], [48, 57]];
  for (let r = 0; r + 1 < rings.length; r++) {
    const A = rings[r], B = rings[r + 1]; starts.push(b.ni);
    if (A.s === B.s) continue;
    for (const [i0, i1] of RUNS) for (let i = i0; i < i1; i++) {
      const fa = A.flag[i], fb = A.flag[i + 1], fc = B.flag[i], fd = B.flag[i + 1];
      if (fa === 2 || fb === 2 || fc === 2 || fd === 2) continue;
      if (fa && fb && fc && fd) continue;
      b.quadN(A.ids[i], A.ids[i + 1], B.ids[i + 1], B.ids[i]);
    }
  }
  starts.push(b.ni);
  await ctx.yield();
  // smooth normals from the faces (the embrasures and the fbm relief need them)
  const P = b.P, N = b.N, I = b.I, acc = new Float32Array(b.n * 3);
  for (let t = 0; t < b.ni; t += 3) {
    if (t % 12288 === 0) await ctx.yield();      // 4096 faces, then let a frame through
    const a = I[t] * 3, c = I[t + 1] * 3, d = I[t + 2] * 3, ux = P[c] - P[a], uy = P[c + 1] - P[a + 1], uz = P[c + 2] - P[a + 2], vx = P[d] - P[a], vy = P[d + 1] - P[a + 1], vz = P[d + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    acc[a] += nx; acc[a + 1] += ny; acc[a + 2] += nz; acc[c] += nx; acc[c + 1] += ny; acc[c + 2] += nz; acc[d] += nx; acc[d + 1] += ny; acc[d + 2] += nz;
  }
  await ctx.yield();
  for (let i = 0; i < b.n; i++) { if ((i & 4095) === 0) await ctx.yield(); const k = i * 3, l = Math.hypot(acc[k], acc[k + 1], acc[k + 2]); if (l > 1e-6) { N[k] = acc[k] / l; N[k + 1] = acc[k + 1] / l; N[k + 2] = acc[k + 2] / l; } }
  return { b, rings, starts };
}

// a frame swept round a closed outline [[x, y, mx, my], ...]: prof = [[offset, station, normal type, colour], ...],
// map(x, y, station, out) -> world point. normal types: 0 reveal, 1 room front, 2 outer skirt, 3 well front.
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
function sweepFrame(b, outline, prof, map, litOf, v0 = 13) {
  const ix = []; let arc = 0;
  for (let i = 0; i <= outline.length; i++) {
    const o = outline[i % outline.length], pr = outline[(i + outline.length - 1) % outline.length]; if (i) arc += Math.hypot(o[0] - pr[0], o[1] - pr[1]);
    ix[i] = prof.map((q) => {
      const x = o[0] + o[2] * q[0], y = o[1] + o[3] * q[0]; map(x, y, q[1], _a);
      if (q[2] === 0) map(x - o[2] * 0.3, y - o[3] * 0.3, q[1], _b).sub(_a); else if (q[2] === 2) map(x + o[2] * 0.3, y + o[3] * 0.3, q[1], _b).sub(_a);
      else if (q[2] === 1) { map(x, y, q[1] - 0.5, _b); _b.subVectors(_a, _b); } else { map(x, y, q[1] + 0.5, _b); _b.subVectors(_a, _b); }
      _b.normalize(); b.lit = litOf ? litOf(q, _a) : null;
      return b.v(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z, q[3], 0, 0, arc, v0 + q[0]);
    });
  }
  for (let i = 0; i < outline.length; i++) for (let j = 0; j + 1 < prof.length; j++) { if (prof[j][0] === prof[j + 1][0] && prof[j][1] === prof[j + 1][1]) continue; b.quadN(ix[i][j], ix[i + 1][j], ix[i + 1][j + 1], ix[i][j + 1]); }
  b.lit = null;
}
const archOutline = (hw, y0, ySpring, seg = 12) => {
  const o = [[-hw, y0, -0.7, -0.7], [-hw, (y0 + ySpring) / 2, -1, 0], [-hw, ySpring, -1, 0]];
  for (let i = 1; i < seg; i++) { const a = Math.PI - (i / seg) * Math.PI; o.push([hw * Math.cos(a), ySpring + hw * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  o.push([hw, ySpring, 1, 0], [hw, (y0 + ySpring) / 2, 1, 0], [hw, y0, 0.7, -0.7], [0, y0, 0, -1]); return o;
};

// the valley seen through the windows, painted by view ray (so it has true parallax), plus grille, icicles, spindrift
const PANE_VERT = /* glsl */`
attribute vec2 aP; attribute vec2 aI; varying vec3 vW; varying vec2 vP, vI;
void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vP=aP; vI=aI; gl_Position=projectionMatrix*viewMatrix*w; }`;
const PANE_FRAG = /* glsl */`precision highp float;
uniform float uTime, uU, uDur, uGain, uSnowy, uFlakes, uBlossom, uStars, uRare, uDim, uFogDen, uSteep;
uniform vec3 uZen, uHor, uGA, uGB, uCone, uCap, uTree, uSun, uFrame, uFogCol, uHaze; uniform vec4 uMid;
varying vec3 vW; varying vec2 vP, vI;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
void main(){
  vec2 p=vP; float seed=vI.x;
  float top=1.5+sqrt(max(6.25-p.x*p.x,0.));
  float aa=fwidth(p.x)+fwidth(p.y)+1e-3;
  float inside=(1.-smoothstep(2.5-aa,2.5+aa,abs(p.x)))*smoothstep(-4.-aa,-4.+aa,p.y)*(1.-smoothstep(top-aa,top+aa,p.y));
  vec3 rd=normalize(vW-cameraPosition);
  rd=normalize(rd+vec3(0.,.07,0.));                 // the valley lies below the house: its horizon sits low in every window
  float hl=max(length(rd.xz),1e-3), tanEl=rd.y/hl, H=cameraPosition.y+18.;
  float az=atan(rd.z,rd.x+1e-5);
  vec3 col;
  if(rd.y>-.003){
    float k=pow(clamp(rd.y*uSteep+.015,0.,1.),.5); col=mix(uHor,uZen,k);       // steep, so that a small window holds the whole gradient
    col=mix(col,uMid.rgb,uMid.a*smoothstep(.1,.4,k)*(1.-smoothstep(.5,.85,k)));      // dusk: a band of rose between the orange and the indigo
    col=mix(col,uHaze,exp(-max(rd.y,0.)*34.)*.4);                              // a pale band on the horizon
    // a far range under the sky: blue in shadow, its crest catching the light
    float rg=.02+.03*vn(vec2(az*7.,1.3))+.012*vn(vec2(az*29.,4.1));
    col=mix(col,mix(mix(uGB,uHor,.5),mix(uCap,uHor,.35),smoothstep(.5,1.,rd.y/rg)*step(.5,uSnowy+uStars)),1.-smoothstep(rg-.003,rg+.003,rd.y));
    float sg=max(dot(rd,uSun),0.); col+=uHor*.3*sg*sg*sg*(1.-uStars);
    col+=uStars*step(.9965,h21(floor(vec2(az*220.,rd.y*260.))))*vec3(2.5);
  } else {
    float t=H/max(-rd.y,1e-3); vec2 g=cameraPosition.xz+rd.xz*t; float hz=1.-exp(-t/2600.);
    float n=vn(g*.0055)*.55+vn(g*.021)*.3+vn(g*.085)*.15;
    vec3 gc=mix(uGB,uGA,smoothstep(.22,.5,n));
    // orchards: dark scribble of hedges and rows of trees
    float fade=1.-smoothstep(500.,1900.,t);
    float orch=smoothstep(.42,.56,vn(g*.0032+7.))*fade;
    float hedge=1.-smoothstep(.012,.03+t*.00004,abs(vn(g*.007+3.)-.5));
    vec2 c=vec2(g.x/9.,g.y/22.), cf=fract(c)-.5; float rows=smoothstep(.34,.1,abs(cf.x))*smoothstep(.5,.3,abs(cf.y));
    gc=mix(gc,uTree,clamp(rows*orch*.8+hedge*fade*.75,0.,1.));
    gc+=uSnowy*step(.992,h21(floor(g*.7)))*.6*(1.-hz);
    col=mix(gc,uHaze,hz);
  }
  // the other cones of the valley: capped, a lit and a shaded side, some with a thread of smoke
  float best=1e9; vec3 cc=vec3(0.); float ca=0.;
  vec3 smoke=vec3(0.); float sa=0.;
  float sunA=atan(uSun.z,uSun.x+1e-5);
  // (26 of them, one every 14 degrees, so that every window holds two or three; they stand on their own ground a little
  // below the eye whatever room we are in, so that they rise into the sky of the upper rooms as well)
  float Hc=22.+cameraPosition.y*.1;
  for(int i=0;i<26;i++){
    float fi=float(i), a0=fi*.2417+h21(vec2(fi,1.))*.13-3.1, D=280.+h21(vec2(fi,2.))*620., hh=62.+h21(vec2(fi,3.))*105., bw=hh*(.34+.2*h21(vec2(fi,4.)));
    float da=az-a0; da-=6.2832*floor(da/6.2832+.5);
    float x=D*da, y=Hc+D*tanEl, yn=clamp(y/hh,0.,1.), wd=bw*pow(max(1.-yn,0.),.8)*(1.+.08*sin(yn*9.+fi*3.));
    float m=smoothstep(0.,D*.0025+.4,wd-abs(x))*smoothstep(0.,.1,yn)*step(abs(da),.9);      // the foot is lost in the haze of the valley
    if(m>.01 && D<best){
      best=D; float sd=sin(sunA-a0); float lit=smoothstep(-.35,.25,x/max(wd,1.)*(sd>=0.?1.:-1.));
      vec3 body=mix(uCone*.42+uGB*.22,uCone,lit);
      float cap=smoothstep(.52,.6,yn+.1*vn(vec2(x*.05+fi*9.,y*.05)))*step(.5,uSnowy+.2)+uSnowy*smoothstep(.55,.9,vn(vec2(x*.03+fi*5.,y*.11)))*.5;
      body=mix(body,mix(uCap*.62+uGB*.25,uCap,lit),clamp(cap,0.,1.));
      body=mix(body,vec3(.1,.06,.08),step(.86,h21(floor(vec2(x*.07+fi,y*.035))))*step(yn,.5)*step(.06,yn)*.6);
      cc=mix(body,uHor,1.-exp(-D/3600.)); ca=m;
    }
    if(i==2||i==7||i==13||i==20){
      float yy=y-hh; float wx=sin(yy*.022-uTime*.45+fi)*yy*.08+yy*.22;
      float s2=smoothstep(yy*.07+7.,0.,abs(x-wx))*step(0.,yy)*(1.-smoothstep(110.,280.,yy))*.7*step(abs(da),.9);
      if(s2>sa){ sa=s2; smoke=mix(uHor,vec3(1.),.75); }
    }
  }
  col=mix(col,cc,ca); col=mix(col,smoke,sa);
  col*=uGain;
  // weather in the opening
  float sp=vn(vec2(p.x*.45-uTime*1.4+seed*10.,p.y*1.3+uTime*.25));
  col=mix(col,vec3(.95,.98,1.)*uGain,smoothstep(.72,.98,sp)*.4*uSnowy);
  if(uFlakes>.01){ for(int k=0;k<3;k++){ float fk=float(k); vec2 q=vec2(p.x*(.42+fk*.3)+sin(uTime*.6+p.y*.7+fk)*.22, p.y*(.42+fk*.3)+uTime*(.55+fk*.3)); vec2 qi=floor(q); float d=length(fract(q)-.5-(vec2(h21(qi+seed),h21(qi+3.+seed))-.5)*.6); col=mix(col,vec3(1.08)*uGain,smoothstep(.15,.07,d)*.95*uFlakes); } }
  if(uBlossom>.01){
    float sw=sin(uTime*.8+seed*20.)*.14; float sgn=fract(seed*7.)>.5?1.:-1.;
    float reach=smoothstep(-.6,2.2,p.x*sgn+p.y*.3+.4);
    float bough=1.-smoothstep(.05,.11,abs(p.y-(-1.2+p.x*sgn*.55+.5*sin(p.x*1.3+seed*9.)+sw)))*1.;
    float tw=1.-smoothstep(.03,.07,abs(fract(p.x*.9+p.y*.5+seed)-.5-.25*sin(p.y*2.+seed*5.)));
    float clus=smoothstep(.5,.62,vn(vec2(p.x*1.5+sw+seed*30.,p.y*1.5)))*reach;
    float pet=vn(p*7.+seed*9.+sw*3.);
    vec3 bc=mix(vec3(1.,.62,.74),vec3(1.,.95,.95),pet)*uGain*1.05;
    col=mix(col,vec3(.2,.1,.08)*uGain,clamp(bough*reach+tw*clus*.5,0.,1.)*.85*uBlossom);
    col=mix(col,bc,clus*uBlossom);
  }
  if(uSnowy>.01){
    float cx=p.x*2.3, k=floor(cx), len=(.35+1.5*h21(vec2(k,seed*31.)))*step(.25,h21(vec2(k,seed*17.)));
    float dy=top-p.y, w=clamp(1.-dy/max(len,.05),0.,1.);
    float ic=step(dy,len)*smoothstep(.36*w+.02,.36*w-.06,abs(fract(cx)-.5));
    col=mix(col,vec3(.78,.9,1.)*uGain*(1.+.6*smoothstep(.2,.0,abs(fract(cx)-.5-.1))),ic*.8*uSnowy);
    float yd=top-len-fract(uTime*.35+h21(vec2(k,3.)))*3.2; float dr=length(vec2((fract(cx)-.5)/2.3,(p.y-yd)*.6));
    col+=vec3(1.4)*smoothstep(.07,.03,dr)*step(1.2,len)*uSnowy;
    col=mix(col,vec3(1.)*uGain,smoothstep(-3.55,-3.95,p.y+.25*vn(vec2(p.x*1.7+seed*40.,1.)))*uSnowy);       // snow lying on the sill
  }
  // the cap of snow slipping past (rare): vI.y = the u at which this room's curtain starts to pour
  float tt=(uU-vI.y)*uDur;
  float front=4.6-tt*9.;                                                     // the leading edge drops through the opening
  float cur=smoothstep(front,front+1.6,p.y+.5*vn(vec2(p.x*2.,seed*9.)))*(1.-smoothstep(1.05,1.7,tt))*step(0.,tt)*uRare;
  float cn=vn(vec2(p.x*2.6+seed*5.,p.y*.3+uTime*9.)), cn2=vn(vec2(p.x*7.+seed*3.,p.y*.8+uTime*15.));
  col=mix(col,mix(vec3(.62,.74,.95),vec3(1.,1.,1.02)*2.1,smoothstep(.12,.6,cn*.6+cn2*.5)),cur);
  float gl=uRare*smoothstep(.9,1.5,tt)*(1.-smoothstep(2.6,4.6,tt));
  vec2 gq=vec2(p.x*3.2+seed*7.,p.y*3.2+uTime*4.), gi=floor(gq);                // the after-fall: round sparks, each twinkling
  float gd=length(fract(gq)-.5-(vec2(h21(gi+3.1),h21(gi+7.7))-.5)*.5), gtw=sin(uTime*7.+h21(gi)*40.);
  col+=vec3(4.2)*gl*step(.8,h21(gi+1.7))*smoothstep(.24,.06,gd)*gtw*gtw;
  // wooden grille and the rock round the opening
  float bars=max(1.-smoothstep(.13-aa,.13+aa,abs(p.x)), 1.-smoothstep(.11-aa,.11+aa,abs(abs(p.y)-1.2)));
  col=mix(col,vec3(.16,.09,.055)*(1.+uGain*.12),bars);
  col=mix(uFrame,col,inside);
  float fd=length(cameraPosition-vW)*uFogDen; col=mix(uFogCol,col,exp(-fd*fd*.5));
  gl_FragColor=vec4(col,1.);
}`;

const hsh = (x, y, z) => { const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return v - Math.floor(v); };
const wrapA = (a) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));

export default {
  id: 'carved-house-in-snow', name: 'The Carved House in Snow', category: 'interior', weirdness: 0.15, media: ['interior'],
  async build(ctx) {
    const { rng, noise } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = vary.density ?? 1;
    const vr = rng.fork('look-a');
    let lookName = vr.pick(['snow', 'dusk', 'spring', 'snowfall', 'snow', 'spring', 'dusk', 'snowfall']);
    if (vary.hour === 'night') lookName = 'night'; else if (vary.hour === 'golden') lookName = 'dusk'; else if (vary.hour === 'dawn') lookName = 'snow'; else if (vary.hour === 'day' && lookName === 'dusk') lookName = 'snow';
    const rare = !!vary.rare; if (rare && lookName !== 'night') lookName = 'snow';      // the snow cap can only slip on a bright snow morning (or under the moon)
    const look = LOOKS[lookName], cast = { slate: vr.chance(0.45) ? 0.2 : 0, goats: vr.chance(0.4), cat: vr.pick(['cream', 'black', 'tabby']) };
    const scene = new THREE.Scene(); scene.background = new THREE.Color(look.fog); scene.fog = new THREE.FogExp2(look.fog, look.fogDen * 0.8);
    const time = { value: 0 }, rock = makeRock(), U = rock.U, DUR = 44;
    U.uSunCol.value.setRGB(...look.sun); U.uGlareCol.value.setRGB(...look.glare); U.uFillCol.value.setRGB(...look.fill); U.uTopCol.value.setRGB(...look.top);
    U.uFogCol.value.set(look.fog); U.uFogDen.value = look.fogDen; U.uHotCol.value.multiplyScalar(look.hot); U.uShimmer.value = look.snowy ? 0.42 : 0.4;
    const SUN0 = sunVec(look.az - look.turn / 2, look.el), SUN1 = sunVec(look.az + look.turn / 2, look.el), SUNM = sunVec(look.az, look.el), hasSun = look.sun[0] + look.sun[1] + look.sun[2] > 0.1;
    const skyMode = !!look.sky, skyC = Math.cos((look.sky || 28) * DEG), skyS = Math.sin((look.sky || 28) * DEG); U.uSky.value.set(skyC, skyS, skyMode ? 1 : 0);
    const lightDir = (w) => (skyMode ? new THREE.Vector3(w.n.x * skyC, skyS, w.n.z * skyC) : null);      // towards the light, for a window under a snow sky
    U.uSun.value.copy(SUN0);
    // ---- the flight: 9 m above the ramp, then 1.14 turns of a helix up the shaft, then 60 m straight at 55 degrees ----
    // the route weaves a little inside the gallery: out towards the oven, the samovar and the loom, in towards the arches of the well
    const LAT = [[0, -2], [58, -1.5], [72, 0], [98, 1.5], [124, 1.0], [150, 0], [162, 1.5], [184, -3.5], [214, -2.5], [226, 1.2], [250, -5], [283, 0.6], [296, 1.0], [312, 0], [330, -3], [346, 0], [372, 1.5], [384, 1.2], [392, 0], [408, 0], [424, 2.2], [442, 2], [465, 0], [470, 0]];
    const lat = (s) => { for (let i = 0; i + 1 < LAT.length; i++) if (s <= LAT[i + 1][0]) return lerp(LAT[i][1], LAT[i + 1][1], sstep(LAT[i][0], LAT[i + 1][0], s)); return 0; };
    const pts = [], aEnd0 = L.angle(S_END), CH0 = PORTAL_POS.clone().addScaledVector(PORTAL_DIR, -60), aC = angOf(CH0.x, CH0.z) + Math.PI * 2 * Math.ceil((aEnd0 + 5 - angOf(CH0.x, CH0.z)) / (Math.PI * 2));
    for (let s = 0; s <= S_END + 1e-6; s += 7.75) { const f = L.frame(s, {}), l = lat(s); pts.push([f.x + f.nx * l, f.y + 9, f.z + f.nz * l]); }
    const hY0 = FLOOR + 9, hY1 = CH0.y, nH = Math.round((aC - aEnd0) / 0.36);
    for (let i = 1; i < nH; i++) { const t = i / nH, a = aEnd0 + (aC - aEnd0) * t, r = lerp(21, 20, sstep(0, 0.2, t)) + 3.5 * sstep(0.78, 1, t); if (t > 0.94) break; pts.push([r * Math.cos(a), hY0 + (hY1 - hY0) * (0.85 * t + 0.15 * t * t * t), -r * Math.sin(a)]); }
    for (let i = 0; i <= 4; i++) pts.push(CH0.clone().addScaledVector(PORTAL_DIR, i * 15));
    await ctx.yield();
    const path = makePath(pts), PLEN = path.length, uOfS = (s) => s / PLEN;
    await ctx.yield();

    // ---- windows and inner arches ----
    const roomOf = (s) => (s < 70 ? 0 : s < 150 ? 1 : s < 230 ? 2 : s < 310 ? 3 : s < 390 ? 4 : 5);
    // rare event: the u at which each room's windows start to pour (just as we come through its arch), then the shaft
    const roomU = [0.002, ...ARCHES.map((s) => uOfS(s - 6)), 0.69];
    const wins = WINS.map(([s, k, h]) => {
      const f = L.frame(s, {}), wr = L.wR(s), n = new THREE.Vector3(f.nx, 0, f.nz), c = new THREE.Vector3(f.x + f.nx * (wr + 5), f.y + h, f.z + f.nz * (wr + 5)), r = roomOf(s);
      return { s, k, h, c, n, t: new THREE.Vector3(f.tx, 0, f.tz), m: c.clone().addScaledVector(n, -5.5), hw: 2.5 * k, hh: 4 * k, reach: skyMode ? 46 : 60 + 14 * k, sunny: hasSun && (skyMode || n.dot(SUNM) > 0.3), bounce: hasSun && !skyMode && n.dot(SUNM) > 0.3, facing: n.dot(SUNM), seed: rng(),
        u: roomU[r] + 0.004 * Math.max(0, (s - (r ? ARCHES[r - 1] : 0)) / 20) };
    });
    const arches = ARCH_S.map((s) => { const f = L.frame(s, {}), rW = L.radius(s) - L.wL(s); return { s, a: f.a, y: f.y, rW, ik: rW / L.radius(s), hw: L.crown(s) * 0.55, er: new THREE.Vector3(f.nx, 0, f.nz), et: new THREE.Vector3(f.tx, 0, f.tz), c: new THREE.Vector3(f.nx * (rW + 1), f.y + 7, f.nz * (rW + 1)), axis: new THREE.Vector3(0, f.y + 8, 0) }; });
    let sm0 = S_END; for (let s = 380; s < S_END; s += 0.5) if (L.y(s) + L.crown(s) > FLOOR + 0.4) { sm0 = s; break; }
    const aEnd = L.angle(S_END);
    const sOfAngle = (a) => { let A = a; while (A > aEnd) A -= Math.PI * 2; while (A <= aEnd - Math.PI * 2) A += Math.PI * 2; let lo = S_END - 175, hi = S_END; if (A < L.angle(lo)) return -1; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (L.angle(m) < A) lo = m; else hi = m; } return (lo + hi) / 2; };
    const heroOpts = {
      rock, duration: DUR, snowy: look.snowy, sky: { zen: mul(lin(look.zen), look.gain * 1.35), hor: mul(lin(look.hor), look.gain * 1.3), cloud: look.flakes ? 0.75 : look.stars ? 0.15 : 0.4, flakes: look.flakes ? 1 : look.snowy ? 0.3 : 0, stars: look.stars ? 1 : look.dark ? 0.5 : 0 },
      column: mul(look.top, look.stars ? 0.035 : look.dark ? 0.04 : 0.052), slate: cast.slate, dark: look.dark ? 0.85 : 0, bounce: look.dark ? [0.26, 0.12, 0.1] : null, fillK: 0.67, glow: mul(lin(look.hor), look.gain * 1.25), holeAngle: Math.atan2(-SUNM.z, SUNM.x), archY: arches.map((a) => a.y + 6),
      mouth(a, r) { const s = sOfAngle(a); if (s < sm0 - 0.5) return false; const d = r - L.radius(s); return d > -(L.wL(s) + 1.2) && (d < L.wR(s) + 1.2 || r > 28.6); },
      wellSkip(a, yc) {
        // no niche where the loft's ramp runs close behind the well wall: its back would come through the gallery wall
        const sl = sOfAngle(a); for (const q of [sl - 4, sl, sl + 4]) if (sl > 0 && q > 396 && q < S_END + 3 && L.radius(q) - L.wL(q) < 16.4 && yc + 2.4 > L.y(q) - 1.5 && yc - 2.4 < L.y(q) + 7) return 3;
        for (const A of arches) { const da = Math.abs(wrapA(a - A.a)) * WELL_R; if (da < AH + 4.2 && yc > A.y - 3.3 && yc < A.y + 16.8) return 3; } return 0; },
      wellCut(a, y) { for (const A of arches) { const da = Math.abs(wrapA(a - A.a)) * WELL_R; if (da < AH + 1.3 && y > A.y + SILL - 1.3 && y < A.y + archTop(Math.min(AH, Math.max(0, da - 0.6))) + 1.3) return true; } return false; },
    };
    const hero = await buildHero(ctx, heroOpts); scene.add(hero.object);
    await ctx.yield();
    const sunWins = wins.filter((w) => w.sunny).sort((a, b) => b.facing - a.facing).slice(0, skyMode ? 26 : 11);
    if (skyMode) for (const h of hero.holes) h.reach = 70;
    rock.setWindows(hasSun ? sunWins.concat(hero.holes) : []);

    // ---- baked light: snow glare fans upward from every window, sky fill, white light from the well ----
    const blobs = [], blob = (s, l, r, k = 0.72) => { const p = L.point(s, l, 0); blobs.push([p.x, p.y, p.z, r, k]); };
    // [0] snow glare: a fan thrown upward from each sill onto the vault and upper walls, nothing below the sills
    // [1] fill: what the windows and the sunlit floor send sideways (walls in shade, the lit side of every prop)
    // [2] top: white light from the well through the inner arches, and down the shaft
    const lightFn = (px, py, pz, nx, ny, nz, o) => {
      let g = 0, fl = 0.07, top = 0;
      for (let i = 0; i < wins.length; i++) {
        const w = wins[i], m = w.m, ly = m.y - py; if (ly > 28 || ly < -36) continue;
        const lx = m.x - px, lz = m.z - pz, d2 = lx * lx + ly * ly + lz * lz; if (d2 > 6400) continue;
        const d = Math.sqrt(d2) + 1e-3, ndl = Math.max(0, (nx * lx + ny * ly + nz * lz) / d), ka = 0.74 * w.k * Math.sqrt(w.k), fan = sstep(0.26, 0.7, (py - (m.y - 3.4 * w.k)) / d);
        g += (0.1 + 0.9 * ndl) * fan * ka * 0.62 / (1 + d2 / 560) + (d < 8 ? 0.5 * (1 - d / 8) : 0);
        fl += (0.16 + 0.84 * ndl) * ka * 0.2 / (1 + d2 / 420) + (w.bounce ? ka * 0.07 / (1 + d2 / 900) * (1 - 0.6 * Math.max(0, ny)) : 0);
      }
      for (let i = 0; i < arches.length; i++) { const c = arches[i].c, lx = c.x - px, ly = c.y - py, lz = c.z - pz, d2 = lx * lx + ly * ly + lz * lz; if (d2 > 3600) continue; const d = Math.sqrt(d2) + 1e-3; top += (0.25 + 0.75 * Math.max(0, (nx * lx + ny * ly + nz * lz) / d)) * 0.9 / (1 + d2 / 230); }
      // under the dovecote floor the ramp runs in a trench: its walls fall into shade, so that the white mouth above pulls the eye up
      if (py > 58 && px * px + pz * pz < 1000) { const k = sstep(58, 70, py) * (1 - sstep(77, 80, py)); fl *= 1 - 0.5 * k; g *= 1 - 0.6 * k; top += sstep(62, 79, py) * 0.5 * (0.5 + 0.5 * ny); g += 0.6 * sstep(68, 77, py) * (0.2 + 0.8 * Math.max(0, ny)); }
      // contact shade: on the floor under and round things, and on the foot of the things themselves
      for (let i = 0; i < blobs.length; i++) { const q = blobs[i], dy = py - q[1]; if (dy > 3.2 || dy < -1.5) continue; const dx = px - q[0], dz = pz - q[2], d2 = dx * dx + dz * dz, r2 = q[3] * q[3]; if (d2 >= r2) continue;
        const k = ny > 0.6 ? (dy < 1.3 ? 1 - q[4] * (1 - d2 / r2) : 1) : 1 - 0.5 * (1 - d2 / r2) * (1 - sstep(0, 3.2, dy)); g *= k; fl *= k; top *= 0.5 + 0.5 * k; }
      if (ny < 0.3) fl *= 1 - 0.65 * Math.min(1, g) * (1 - sstep(-0.3, 0.3, ny)); if (ny < -0.25) fl *= 1 + 0.6 * ny;                                    // undersides
      o[0] = Math.min(g, 1.0); o[1] = Math.min(fl, 0.9); o[2] = Math.min(top, 0.85);
    };

    // ---- shell ----
    const shell = await buildShell(ctx, noise, wins);
    await ctx.yield();
    // window panes: one mesh
    const pg = new THREE.BufferGeometry(), pP = [], pA = [], pI = [], pX = [];
    wins.forEach((w, i) => { for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pP.push(w.c.x + w.t.x * sx * 3.3 * w.k, w.c.y + sy * 4.8 * w.k, w.c.z + w.t.z * sx * 3.3 * w.k); pA.push(sx * 3.3, sy * 4.8); pI.push(w.seed, w.u); } pX.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); });
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pP, 3)); pg.setAttribute('aP', new THREE.Float32BufferAttribute(pA, 2)); pg.setAttribute('aI', new THREE.Float32BufferAttribute(pI, 2)); pg.setIndex(pX);
    const PU = { uTime: time, uU: { value: 0 }, uDur: { value: DUR }, uGain: { value: look.gain }, uSnowy: { value: look.snowy }, uFlakes: { value: look.flakes }, uBlossom: { value: look.blossom }, uStars: { value: look.stars }, uRare: { value: rare ? 1 : 0 }, uDim: U.uDim, uSteep: { value: look.steep || 2.6 }, uMid: { value: new THREE.Vector4(...(look.mid ? lin(look.mid) : [0, 0, 0]), look.mid ? 0.65 : 0) },
      uZen: { value: new THREE.Color(look.zen) }, uHor: { value: new THREE.Color(look.hor) }, uGA: { value: new THREE.Color(look.gA) }, uGB: { value: new THREE.Color(look.gB) }, uCone: { value: new THREE.Color(look.cone) }, uCap: { value: new THREE.Color(look.cap) }, uTree: { value: new THREE.Color(look.tree) },
      uSun: U.uSun, uHaze: { value: look.haze ? new THREE.Color(look.haze) : new THREE.Color(look.hor).lerp(new THREE.Color(1, 1, 1), 0.3) }, uFrame: { value: new THREE.Color(SHADE[0] * look.fill[0] * 0.9, SHADE[1] * look.fill[1] * 0.9, SHADE[2] * look.fill[2] * 0.9) }, uFogCol: U.uFogCol, uFogDen: U.uFogDen };
    const panes = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: PU, vertexShader: PANE_VERT, fragmentShader: PANE_FRAG, side: THREE.DoubleSide })); panes.frustumCulled = false; scene.add(panes);

    await ctx.yield();
    // ---- trim: the inner arches (frames and reveals through the well wall) and the coping round the ramp mouth ----
    const trim = new Bld(), wellLit = (y) => { const t = sstep(-8, FLOOR, y); return [0.03, 0.15, 0.62 + 0.5 * t]; };
    for (const A of arches) {
      // st <= 0: the room face, 0.75 m proud of the leaning wall (st < 0 sinks back into the rock); st 0..1: the reveal
      // through the wall; st >= 1: the well face, 0.6 m proud of the well wall. t = metres round the wall, h above A.y.
      const map = (t, h, st, out) => {
        const k = Math.min(1, Math.max(0, st)), rise = L.y(A.s + t / A.ik) - A.y;      // on the room side the opening climbs with the ramp
        const r0 = A.rW + 0.95 + 1.4 * Math.min(1.12, Math.max(0, h) / A.hw) + Math.min(st, 0), r1 = 11.4 + Math.max(0, st - 1), r = lerp(r0, r1, k), a2 = A.a + t / lerp(A.rW, WELL_R, k);
        return out.set(r * Math.cos(a2), A.y + h + rise * (1 - k), -r * Math.sin(a2));
      };
      // a plain raised band, a step, then an inner fascia with a painted ochre fillet, and the reveal
      const R1 = mul(ROCK, 1.0), R2 = mul(ROCK, 0.84), OC = [0.35, 0.1, 0.06];
      sweepFrame(trim, archOutline(AH, SILL, ASPRING, 16), [[2.45, -2.6, 2, R2], [2.25, 0, 2, R1], [2.25, 0, 1, R1], [1.45, 0, 1, R1], [1.45, 0, 0, R2], [1.45, 0.05, 0, R2], [1.45, 0.05, 1, R1], [1.1, 0.05, 1, R1], [1.1, 0.05, 1, OC], [0.78, 0.05, 1, OC], [0.78, 0.05, 1, R1], [0, 0.05, 1, R1], [0, 0.05, 0, R1], [0, 0.5, 0, R1], [0, 1, 0, R2], [0, 1, 3, R1], [2.1, 1, 3, R1], [2.1, 1, 2, R2], [2.2, 2.4, 2, R2]], map,
        (q, p) => (q[1] >= 1 ? (q[0] === 0 && q[2] === 0 ? wellLit(p.y).map((v) => v * 0.8) : wellLit(p.y)) : q[0] === 0 && q[2] === 0 ? (q[1] > 0.2 ? [0.04, 0.2, 0.32] : [0.03, 0.26, 0.08]) : null), 4.4);       // the reveal: in shade at the room's edge, brightening to the well's white light
    }
    await ctx.yield();
    for (let s = Math.floor(sm0) - 1; s < S_END; s++) {
      const quad = (l0, l1, sA, sB) => { const yA = FLOOR + 3 * (1 - sstep(458, 465, sA)), yB = FLOOR + 3 * (1 - sstep(458, 465, sB)); const p = [L.point(sA, l0(sA), 0), L.point(sA, l1(sA), 0), L.point(sB, l1(sB), 0), L.point(sB, l0(sB), 0)];
        trim.lit = [0.12, 0.5, 0.6]; const id = p.map((q, i) => trim.v(q.x, i < 2 ? yA : yB, q.z, 0, 1, 0, ROCK, 0, 0, sA, 14)); trim.quadN(id[0], id[1], id[2], id[3]); trim.lit = null; };
      const oIn = (q) => L.wR(q) - 2.2, oOut = (q) => Math.max(L.wR(q) - 2.2, 30.4 - L.radius(q)), iIn = (q) => -(L.wL(q) - 2.2), iOut = (q) => Math.min(-(L.wL(q) - 2.2), 13.4 - L.radius(q));
      quad(oIn, oOut, s, s + 1); quad(iOut, iIn, s, s + 1);
    }

    await ctx.yield();
    // ---- props: one merged mesh a room, all in the rock shader ----
    const rooms = [0, 1, 2, 3, 4, 5].map(() => new Bld());
    const M = (s, l, h = 0, yaw = 0, sc = 1) => L.seat(s, -l * 0 + l, h, yaw, sc);
    const tint = (c, k = 0.12) => (x, y, z) => mul(c, 1 - k + 2 * k * hsh(Math.round(x * 3), Math.round(y * 3), Math.round(z * 3)));
    const put = (s, geo, o) => rooms[roomOf(s)].add(geo, o);
    const dirOf = (m, x, y, z, k = 1) => new THREE.Vector3(x, y, z).transformDirection(m).multiplyScalar(k);
    const prng = rng.fork('props');
    // a string of dried things hanging from the vault
    const hang = (s, l, hTop, len, type) => {
      const m = M(s, l, hTop), d = dirOf(m, 1, 0, 0.5, 0.75), ph = prng(), sw = (x, y) => { const k = Math.min(1, -y / len); return [d.x * k * k, 0, d.z * k * k, ph]; };
      put(s, bar([0, 0.6, 0], [0, -len, 0], 0.06, 0.06, 4), { m, c: mul(STRAW, 0.6), kind: 1, sway: sw });
      if (type === 4) { put(s, new THREE.ConeGeometry(0.95, 3.2, 7, 2).rotateX(Math.PI).translate(0, -len - 1.2, 0), { m, c: tint([0.3, 0.36, 0.2], 0.3), kind: 1, sway: sw }); return; }
      const n = Math.round(len / (type === 3 ? 1.5 : 0.8));
      for (let i = 1; i <= n; i++) {
        const y = -i * (len / n) + 0.3, a = i * 2.4 + ph * 6, r = 0.3;
        const g = type === 2 ? lathe([[0.03, -1], [0.6, -0.8], [0.98, -0.2], [0.9, 0.35], [0.45, 0.78], [0.15, 1.0], [0.1, 1.5]], 9) : new THREE.SphereGeometry(1, 7, 5);
        const sc = type === 0 ? [0.3, 0.9, 0.3] : type === 1 ? [0.46, 0.44, 0.46] : type === 2 ? [0.4, 0.36, 0.4] : [0.34, 0.95, 0.34];
        g.scale(sc[0], sc[1], sc[2]); if (type === 0 || type === 3) g.rotateZ(0.5 * Math.sin(a * 3)).rotateY(a); g.translate(Math.cos(a) * r, y, Math.sin(a) * r);
        const k0 = prng(), cx = Math.cos(a) * r, cz = Math.sin(a) * r;
        const c = type === 0 ? mul(PEPPER, 0.75 + 0.5 * k0) : type === 1 ? mul(APRICOT, 0.6 + 0.3 * k0) : type === 2 ? (x, yy, z) => mul(mix3(WHITE, [0.5, 0.36, 0.42], 0.3 * sstep(0.2, 0.9, Math.abs(Math.sin(Math.atan2(z - cz, x - cx) * 3.5)))), 0.78 + 0.2 * k0) : mul([0.85, 0.6, 0.12], 0.8 + 0.3 * k0);
        put(s, g, { m, c, kind: 1, sway: sw });
      }
    };
    const vaultH = (s, l) => { const cr = L.crown(s), hw = cr * 0.55, hx = (L.wR(s) + L.wL(s)) / 2 - 1.6, cx = (L.wR(s) - L.wL(s)) / 2, q = Math.min(0.98, Math.abs(l - cx) / hx); return hw + (cr - hw) * Math.sqrt(1 - q * q); };
    const sack = (s, l, h, yaw, w, hh, c) => { put(s, pillow(w, hh, w * 0.8, 0.75, 10, 7), { m: M(s, l, h, yaw), c: tint(c, 0.1), kind: 2, uv: (x, y, z) => [x * 2, y * 2 + z] }); put(s, new THREE.ConeGeometry(w * 0.16, hh * 0.3, 6).translate(0, hh * 1.08, 0), { m: M(s, l, h, yaw), c: mul(c, 0.8), kind: 2 }); };
    const heap = (s, l, r, h, c = STRAW) => { const g = lathe([[r, 0], [r * 0.9, h * 0.25], [r * 0.66, h * 0.6], [r * 0.34, h * 0.88], [0.05, h]], 14), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.22 * noise.n3(p.getX(i) * 0.5 + s, p.getY(i) * 0.5, p.getZ(i) * 0.5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); put(s, g, { m: M(s, l), c: tint(c, 0.22), kind: 1 });
      for (let i = 0; i < 34; i++) { const a = prng() * 6.283, t = 0.12 + 0.8 * prng(), rr = r * (1 - 0.72 * t); put(s, new THREE.ConeGeometry(0.17, 1.5 + prng() * 1.5, 4).rotateZ(-(0.45 + 0.8 * (1 - t))).rotateY(-a).translate(Math.cos(a) * rr, h * t * 0.95 + 0.3, Math.sin(a) * rr), { m: M(s, l), c: tint(mul(c, 1.2), 0.25), kind: 1 }); }
      blob(s, l, r * 1.5); };

    await ctx.yield();
    // STABLE: stall walls, manger, hay, sledge, harness, sacks
    for (const sz of [28, 49]) { await ctx.yield(); put(sz, pillow(11, 5.2, 1.8, 0.3, 14, 8), { m: M(sz, 13.5), c: tint(mul(ROCK, 1.05), 0.08), kind: 0, uv: (x, y, z) => [x + sz, y] }); blob(sz, 13, 4);
      put(sz, pillow(8.6, 1.5, 2.4, 0.8, 12, 5).translate(0.6, 4.7, 0), { m: M(sz, 13.5), c: tint(STRAW, 0.25), kind: 1 });
      for (let i = 0; i < 14; i++) { const x = -3.6 + i * 0.6, a = prng() * 6.283; put(sz, new THREE.ConeGeometry(0.15, 1.4 + prng(), 4).rotateZ(0.9 * Math.cos(a)).rotateX(0.9 * Math.sin(a)).translate(x + 0.6, 5.9, 0.5 * Math.sin(a)), { m: M(sz, 13.5), c: tint(mul(STRAW, 1.15), 0.25), kind: 1 }); } }
    put(31, pillow(3.2, 3.4, 12, 0.3, 8, 6), { m: M(38.5, 17.6), c: tint(mul(ROCK, 0.9), 0.1), kind: 1 });
    put(31, pillow(2.6, 1.6, 11, 0.9, 10, 6), { m: M(38.5, 17.4, 2.9), c: tint(STRAW, 0.25), kind: 1 });
    await ctx.yield();
    heap(24, -14.6, 5, 4.6, mul(STRAW, 1.2)); await ctx.yield(); heap(62, -14.5, 4.2, 3.6); heap(9, 14, 4, 3.2); heap(60, 13.5, 3.6, 2.6);
    await ctx.yield();
    { // the sledge, drawn up along the left wall: runners with upturned noses, posts, rails, a slatted deck and a roped load of hay
      const SL = { s: 50, l: -12.6 }, m = M(SL.s, SL.l, 0, 0.2), W1 = lin('#a06e42'), W2 = lin('#74502f');
      for (const sx of [-2.3, 2.3]) {
        const run = [[-6, 0.32], [3.6, 0.32], [5.2, 0.75], [6.3, 1.75], [6.75, 3.05]];
        for (let i = 0; i + 1 < run.length; i++) put(SL.s, bar([sx, run[i][1], run[i][0]], [sx, run[i + 1][1], run[i + 1][0]], 0.34, 0.3, 6), { m, c: tint(W1, 0.14), kind: 1 });
        for (const z of [-4.4, -1.2, 2.2]) put(SL.s, bar([sx, 0.4, z], [sx * 0.92, 2.5, z], 0.24, 0.2, 5), { m, c: tint(W2, 0.14), kind: 1 });
        put(SL.s, bar([sx * 0.92, 2.55, -5.4], [sx * 0.92, 2.55, 3.4], 0.24, 0.24, 5), { m, c: tint(W1, 0.14), kind: 1 });
        put(SL.s, bar([sx * 0.92, 2.6, 3.2], [sx, 3.05, 6.75], 0.18, 0.16, 5), { m, c: tint(W2, 0.14), kind: 1 });
      }
      for (let i = 0; i < 6; i++) put(SL.s, pillow(0.72, 0.26, 9.0, 0.3, 6, 4).translate(-1.9 + i * 0.76, 2.72, -1.0), { m, c: tint(mul(W1, 0.95 + 0.2 * prng()), 0.15), kind: 1 });
      put(SL.s, bar([-2.3, 3.05, 6.75], [2.3, 3.05, 6.75], 0.2, 0.2, 5), { m, c: tint(W2), kind: 1 });
      put(SL.s, pillow(3.7, 2.5, 6.4, 0.8, 12, 7).translate(0, 2.9, -1.6), { m, c: tint(STRAW, 0.25), kind: 1 });
      for (const z of [-3.4, 0.2]) put(SL.s, new THREE.TorusGeometry(1.98, 0.09, 4, 12, Math.PI).scale(1, 1.32, 1).translate(0, 2.9, z), { m, c: mul(STRAW, 0.45), kind: 1 });
      blob(SL.s, SL.l, 7.5);
    }
    await ctx.yield();
    { // harness on the left wall
      const m = M(33, -17.9, 11.5, -Math.PI / 2), d = dirOf(m, 1, 0, 0, 0.3), sw = (x, y) => [d.x * Math.max(0, -y) * 0.25, 0, d.z * Math.max(0, -y) * 0.25, 0.37];
      put(33, bar([0, 0, -0.2], [0, 0.2, 1.4], 0.25, 0.2, 5), { m, c: DARKWOOD, kind: 1 });
      put(33, new THREE.TorusGeometry(1.5, 0.34, 6, 16).scale(0.8, 1.2, 1).translate(0, -1.9, 1.1), { m, c: tint(lin('#a8683a'), 0.2), kind: 1, sway: sw });
      put(33, new THREE.TorusGeometry(1.5, 0.2, 5, 16).scale(0.8, 1.2, 1).translate(0, -1.9, 1.38), { m, c: tint(MADDER, 0.15), kind: 2, sway: sw });
      for (const sx of [-1.2, 1.2]) put(33, sheet(0.4, 6, 1, 6).translate(sx, -3.6, 1.2), { m, c: lin('#8a5632'), kind: 2, sway: sw });
      put(33, new THREE.SphereGeometry(0.45, 6, 4).translate(1.2, -9.8, 1.2), { m, c: BRASS, kind: 3, sway: sw });
    }
    for (const [sz, l, yw] of [[8, -14, 0.3], [11.5, -15.5, 1.2], [9, -11.5, 2.2]]) { sack(sz, l, 0, yw, 3, 3.6, lin('#c9b28c')); blob(sz, l, 3.4); }
    put(26, lathe([[1.5, 0], [1.9, 0.3], [2.1, 2.6], [2.0, 2.7], [1.8, 0.6], [0.1, 0.5]], 10), { m: M(36, 15.6), c: tint(lin('#9a6a42'), 0.15), kind: 1 }); blob(36, 15.6, 3);
    { const m = M(50.8, 17.8, 0, 0); put(47, bar([0, 0, 0], [1.6, 13, 0.4], 0.16, 0.14, 5), { m, c: WOOD, kind: 1 }); for (const dx of [-0.5, 0, 0.5]) put(47, bar([1.6, 13, dx * 0.4 + 0.4], [1.75 + Math.abs(dx) * 0.2, 15.4, dx * 1.6 + 0.4], 0.09, 0.06, 4), { m, c: IRON, kind: 3 }); }

    await ctx.yield();
    // KITCHEN: oven pit, bread column, copper, prunings, cauldron
    const OVEN = { s: 121, l: 4 }, ovenP = L.point(OVEN.s, OVEN.l, 1.2), BREAD = { s: 134.5, l: 12.2 };
    put(OVEN.s, lathe([[6.3, 0], [6.1, 1.3], [5.5, 2.0], [4.7, 2.0], [4.5, 0.5]], 22), { m: M(OVEN.s, OVEN.l), c: (x, y, z) => mul(mix3(CLAY, [0.1, 0.07, 0.06], sstep(1.2, 2.1, y) * 0.7), 0.85 + 0.3 * hsh(Math.round(x), 0, Math.round(z))), kind: 1 });
    put(OVEN.s, new THREE.CircleGeometry(4.6, 20).rotateX(-Math.PI / 2).translate(0, 0.7, 0), { m: M(OVEN.s, OVEN.l), kind: 6, c: [1, 0.4, 0.1], l: [0, 1, 0] });
    for (let i = 0; i < 5; i++) { const a = 0.6 + i * 1.25; put(OVEN.s, new THREE.CylinderGeometry(1.0, 1.0, 0.22, 9).rotateZ(Math.PI / 2 - 0.25).rotateY(a).translate(Math.cos(a) * -4.45, 1.25, Math.sin(a) * 4.45), { m: M(OVEN.s, OVEN.l), c: tint(lin('#e8c890'), 0.2), kind: 1, emis: 0.12 }); }
    for (let i = 0; i < 13; i++) { const a = i * 0.4833 + 0.2, r = 6.9 + 0.5 * prng(); put(OVEN.s, pillow(2.2 + prng(), 1.1 + 0.5 * prng(), 1.7 + prng() * 0.6, 0.55, 8, 5).rotateY(-a).translate(Math.cos(a) * r, 0, Math.sin(a) * r), { m: M(OVEN.s, OVEN.l), c: tint(mix3(ROCK, [0.2, 0.15, 0.13], 0.25 + 0.35 * prng()), 0.12), kind: 1 }); }
    blob(OVEN.s, OVEN.l, 8.5, 0.35);
    await ctx.yield();
    { // flatbread column on a low board
      const m = M(BREAD.s, BREAD.l); put(BREAD.s, lathe([[2.9, 0], [3.0, 0.5], [2.9, 0.7], [0.1, 0.7]], 14), { m, c: tint(WOOD), kind: 1 });
      for (let i = 0; i < 17; i++) put(BREAD.s, new THREE.CylinderGeometry(2.1 + 0.25 * prng(), 2.2 + 0.2 * prng(), 0.27, 11, 1).translate(0.25 * (prng() - 0.5), 0.86 + i * 0.3, 0.25 * (prng() - 0.5)), { m, c: (x, y, z) => mix3(lin('#f0deb0'), lin('#b98a4a'), sstep(0.55, 0.85, hsh(Math.round(x * 2.2), i, Math.round(z * 2.2))) * 0.7), kind: 1 });
      blob(BREAD.s, BREAD.l, 4.2);
    }
    await ctx.yield();
    for (const [sz, h, r] of [[101.6, 12.4, 1.9], [104.4, 9.6, 1.5], [115.8, 8.8, 1.3], [118.4, 12.6, 1.2], [129.8, 11.8, 1.8], [132.4, 9.0, 1.4]]) {   // copper pans on pegs
      const m = M(sz, L.wR(sz) - 1.75, h, Math.PI / 2);
      put(sz, lathe([[0.05, 0], [r * 0.8, 0.06], [r, 0.5], [r * 1.04, 0.56], [r * 0.9, 0.2], [0.05, 0.14]], 12).rotateX(Math.PI / 2), { m, c: tint(COPPER, 0.15), kind: 3, emis: sz < 106 ? 0.4 : 0.2 });
      put(sz, bar([0, r, 0.3], [0, r + 2.2, 0.25], 0.14, 0.1, 5), { m, c: IRON, kind: 3 }); put(sz, bar([0, r + 2.1, -0.3], [0, r + 2.2, 0.6], 0.12, 0.12, 5), { m, c: DARKWOOD, kind: 1 });
    }
    { const m = M(89.5, 11.5, 0, 0.3); for (let i = 0; i < 16; i++) { const y = 0.3 + (i % 4) * 0.42 + Math.floor(i / 8) * 0.3, x = ((i * 0.618) % 1 - 0.5) * 3; put(89.5, bar([x, y, -3.4 + prng()], [x + prng() - 0.5, y + 0.3 * prng(), 3 + prng()], 0.2, 0.11, 5), { m, c: tint(lin('#8a6a4c'), 0.3), kind: 1 }); } blob(89.5, 11.5, 4); }
    { const m = M(143.5, 6.4); put(143, lathe([[1.2, 0.9], [2.4, 1.6], [2.9, 3.2], [2.7, 4.6], [2.9, 4.8], [2.6, 4.7], [2.5, 3.2], [0.1, 1.9]], 14), { m, c: tint(COPPER, 0.18), kind: 3 }); for (let i = 0; i < 3; i++) { const a = i * 2.094; put(143, bar([Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6], [Math.cos(a) * 1.2, 1.7, Math.sin(a) * 1.2], 0.16, 0.14, 5), { m, c: IRON, kind: 3 }); } blob(143.5, 6.4, 4); }
    await ctx.yield();
    // the bread oven: a clay beehive built against the outer wall, right where the axis of the stable meets it, so that its
    // glowing mouth is the orange eye seen through the first arch from the door
    const HEARTH = { s: 96, l: L.wR(96) - 1.6 }, hearthM = M(HEARTH.s, HEARTH.l), hearthAt = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(hearthM);
    { const m = hearthM, PL = lin('#d9b08a'), X0 = 3.5;
      put(HEARTH.s, lathe([[3.3, 0], [3.48, 0.35], [3.42, 1.6], [3.12, 3.0], [2.5, 4.2], [1.7, 5.1], [1.05, 5.6], [0.8, 5.85], [0.98, 6.05], [0.98, 6.3], [0.2, 6.4]], 18), { m, kind: 1,
        c: (x, y, z) => { const soot = sstep(0.5, 2.6, x) * (1 - sstep(1.2, 2.6, Math.abs(z))) * sstep(2.3, 3.2, y) * (1 - sstep(4.6, 6.4, y)); return mul(mix3(PL, [0.07, 0.055, 0.05], Math.max(soot * 0.85, y > 5.9 ? 0.7 : 0)), (0.8 + 0.3 * hsh(Math.round(Math.atan2(z, x) * 5), Math.round(y * 1.4), 7)) * (0.7 + 0.3 * sstep(0, 1.2, y))); } });
      put(HEARTH.s, new THREE.CircleGeometry(1.32, 12, 0, Math.PI).translate(0, 1.5, 0).rotateY(Math.PI / 2).translate(X0, 0, 0), { m, c: [1, 0.4, 0.09], kind: 1, emis: 2.8, l: [0, 0.4, 0] });
      put(HEARTH.s, new THREE.PlaneGeometry(2.64, 1.1).translate(0, 0.95, 0).rotateY(Math.PI / 2).translate(X0, 0, 0), { m, c: [1, 0.34, 0.06], kind: 1, emis: 2.4, l: [0, 0.4, 0] });
      put(HEARTH.s, new THREE.TorusGeometry(1.62, 0.44, 6, 14, Math.PI).translate(0, 1.5, 0).rotateY(Math.PI / 2).translate(X0 - 0.02, 0, 0), { m, c: tint(mul(PL, 0.8), 0.14), kind: 1 });
      for (const z of [-1.62, 1.62]) put(HEARTH.s, pillow(0.9, 1.6, 0.9, 0.45, 8, 5).translate(X0 - 0.02, 0, z), { m, c: tint(mul(PL, 0.8), 0.14), kind: 1 });
      put(HEARTH.s, pillow(2.4, 0.42, 5.2, 0.4, 10, 5).translate(X0 + 0.5, 0, 0), { m, c: tint(mul(ROCK, 0.6), 0.14), kind: 1 });
      for (let i = 0; i < 3; i++) put(HEARTH.s, new THREE.CylinderGeometry(0.85, 0.9, 0.16, 10).rotateZ(0.12 * (i - 1)).translate(X0 + 0.9, 0.52 + i * 0.15, 1.7 - i * 0.1), { m, c: tint(lin('#ecd6a4'), 0.2), kind: 1, emis: 0.1 });
      // a split of logs beside it, and the long peel leaning on the wall
      for (let i = 0; i < 7; i++) { const y = 0.34 + Math.floor(i / 3) * 0.6, z = -4.6 - (i % 3) * 0.72 - (i > 5 ? 0.36 : 0) - Math.floor(i / 3) * 0.3; put(HEARTH.s, bar([1.0, y, z], [3.6 + 0.4 * prng(), y, z + 0.2 * (prng() - 0.5)], 0.34, 0.3, 6), { m, c: tint(lin('#8a6a4c'), 0.3), kind: 1 }); }
      put(HEARTH.s, bar([2.3, 0, 4.4], [0.9, 9.2, 4.9], 0.13, 0.11, 5), { m, c: tint(WOOD, 0.15), kind: 1 }); put(HEARTH.s, pillow(0.16, 1.9, 1.5, 0.5, 6, 5).translate(2.36, 0, 4.38), { m, c: tint(WOOD, 0.2), kind: 1 });
      blob(HEARTH.s, HEARTH.l - 2.2, 5.4, 0.5);
    }
    await ctx.yield();
    // a great jar: turned clay with a painted zigzag band on the shoulder, throwing rings, darker towards the foot
    const greatJar = (s, l, k, i) => put(s, lathe([[1.5, 0], [2.3, 0.7], [2.8, 1.4], [3.3, 3.0], [3.55, 4.6], [3.5, 6.8], [3.1, 8.3], [2.5, 9.5], [1.8, 10.3], [1.5, 10.6], [1.45, 11.2], [1.7, 11.5], [1.95, 11.65], [1.8, 11.95], [1.35, 11.9]].map((q) => [q[0] * k, q[1] * k]), 22), { m: M(s, l, 0, i * 1.3), kind: 1,
      c: (x, y, z) => { const a = Math.atan2(z, x), zz = Math.abs(((a * 3.82 + 100) % 1) - 0.5) * 2, band = y > 7.2 * k && y < 8.6 * k; return band ? (Math.abs((y / k - 7.9) - (zz - 0.5) * 0.9) < 0.22 || Math.abs(y / k - 7.9) > 0.6 ? mul(WHITE, 0.8) : mul(CLAY, 0.55)) : mul(CLAY, (0.82 + 0.3 * hsh(Math.round(a * 3), Math.round(y), i)) * (0.86 + 0.14 * Math.sin(y * 5)) * (0.62 + 0.38 * sstep(0, 3.5 * k, y))); } });
    greatJar(105.5, -13.9, 0.56, 7); put(105.5, pillow(2.6, 0.6, 2.6, 0.8, 10, 5), { m: M(105.5, -13.9, 6.6, 0.4), c: tint(CREAM, 0.1), kind: 2, w: 1, uv: (x, y, z) => [x * 1.5, z * 0.8] }); blob(105.5, -13.9, 3.6, 0.6);
    put(110.5, lathe([[0.9, 0], [1.5, 0.6], [1.7, 1.6], [1.35, 2.5], [0.95, 2.9], [1.1, 3.2], [1.0, 3.25]], 14), { m: M(110.5, -14.6), c: tint(lin('#cdbb98'), 0.14), kind: 1 }); blob(110.5, -14.6, 2.4, 0.5);
    sack(86, -12.5, 0, 0.4, 3.2, 3.4, lin('#d2c09a')); sack(89.5, -13.6, 0, 1.7, 2.8, 3, lin('#b9a680')); blob(88, -13, 4.5);
    await ctx.yield();
    // strings of peppers, apricots, garlic, maize and herbs under the vaults of kitchen and storeroom
    { const nStr = Math.round(40 * Math.min(1.2, dens)); for (let i = 0; i < nStr; i++) {
      if ((i & 3) === 0) await ctx.yield();      // four strings, then let a frame through
      const kitchen = i < nStr * 0.5, s = kitchen ? 80 + ((i * 7.31) % 62) : 158 + ((i * 9.17) % 66), l = ((i * 0.618034) % 1 - 0.5) * 22;
      if (L.pinch(s) > 0.05 || (kitchen && Math.abs(s - OVEN.s) < 10 && Math.abs(l - OVEN.l) < 9) || Math.abs(l - lat(s)) < 2.2) continue;
      const top = vaultH(s, l) - 0.4, bottom = 15.8 + 2.6 * prng() + Math.abs(l) * 0.12; hang(s, l, top, Math.max(2.5, top - bottom), i % 7 === 6 ? 4 : i % 5 === 3 ? 2 : i % 4 === 1 ? 1 : i % 9 === 4 ? 3 : 0);
    } }

    await ctx.yield();
    // STOREROOM: the great jars, a hanging balance, baskets of walnuts, sacks, small crocks on the bench
    for (let i = 0; i < 5; i++) {
      const s = [156.5, 169, 183, 197, 211][i], k = (i ? 0.92 : 0.7) + 0.14 * prng();
      greatJar(s, 9.3 + (i % 2) * 0.8, k, i);
      if (i % 3 !== 1) put(s, pillow(4.4 * k, 0.9, 4.4 * k, 0.8, 10, 5), { m: M(s, 9.3 + (i % 2) * 0.8, 11.7 * k, i), c: tint(i % 2 ? CREAM : mul(INDIGO, 1.6), 0.1), kind: 2, w: 1, uv: (x, y, z) => [x * 1.5, z * 0.8] });
      blob(s, 9.3 + (i % 2) * 0.8, 6.2, 0.6);
    }
    await ctx.yield();
    { // the balance, hung from the vault, swinging
      const s = 201, l = -11, top = vaultH(s, l) - 0.3, m = M(s, l, top, Math.PI / 2), dz = dirOf(m, 0, 0, 1, 1), ph = 0.21, hb = top - 11.5;
      const sw = (side) => (x, y) => { const k = -y / hb; return [dz.x * 0.55 * k, side * 0.42 * Math.min(1, Math.abs(x) / 4), dz.z * 0.55 * k, ph]; };
      put(s, bar([0, 0.4, 0], [0, -hb + 0.6, 0], 0.09, 0.09, 4), { m, c: IRON, kind: 3, sway: sw(0) });
      put(s, bar([-4.4, -hb, 0], [4.4, -hb, 0], 0.22, 0.22, 6), { m, c: tint(DARKWOOD), kind: 1, sway: (x, y) => sw(Math.sign(x))(x, y) });
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 3; i++) { const a = i * 2.094; put(s, bar([sx * 4.2, -hb, 0], [sx * 4.2 + Math.cos(a) * 1.7, -hb - 4.4, Math.sin(a) * 1.7], 0.05, 0.05, 4), { m, c: IRON, kind: 3, sway: sw(sx) }); }
        put(s, lathe([[0.05, 0], [1.5, 0.12], [1.9, 0.5], [1.95, 0.55], [1.5, 0.25], [0.05, 0.14]], 12).translate(sx * 4.2, -hb - 4.9, 0), { m, c: tint(BRASS, 0.1), kind: 3, sway: sw(sx) });
        put(s, new THREE.SphereGeometry(sx < 0 ? 0.9 : 0.6, 7, 5).scale(1, 0.7, 1).translate(sx * 4.2, -hb - 4.3, 0), { m, c: sx < 0 ? tint(lin('#6a4a2c'), 0.3) : IRON, kind: sx < 0 ? 1 : 3, sway: sw(sx) });
      }
    }
    for (const [s, l, r] of [[198.5, -12.4, 2.6], [203.5, -13.4, 2.2], [209.5, -11.8, 2.8], [216, -13, 2.0]]) {
      const m = M(s, l, 0, s);
      put(s, lathe([[r * 0.7, 0], [r * 0.95, r * 0.5], [r, r * 1.05], [r * 0.93, r * 1.1], [r * 0.9, r * 0.9]], 14), { m, c: (x, y, z) => mul(lin('#a8804a'), (0.6 + 0.4 * (Math.floor(y * 3.2) % 2)) * (0.8 + 0.4 * hsh(Math.round(Math.atan2(z, x) * 9), 1, 2))), kind: 1 });
      const top = pillow(r * 1.8, r * 0.55, r * 1.8, 1, 12, 6), tp = top.attributes.position; for (let i = 0; i < tp.count; i++) tp.setY(i, tp.getY(i) + 0.14 * Math.sin(tp.getX(i) * 7) * Math.sin(tp.getZ(i) * 7)); top.computeVertexNormals();
      put(s, top, { m: M(s, l, r * 0.78, s), c: tint(lin('#8a5a30'), 0.35), kind: 1 }); blob(s, l, r * 1.9);
    }
    for (const [s, l, y, yw] of [[221, -12, 0, 0.2], [223.8, -13.4, 0, 1.4], [222.4, -12.8, 3.1, 0.8], [157.5, -12.5, 0, 2]]) sack(s, l, y, yw, 3.3, 3.3, lin('#cdb890')); blob(222.5, -12.6, 5); blob(157.5, -12.5, 3.4);
    for (let i = 0; i < 9; i++) { const s = 158 + i * 7.7 + (i % 2) * 2, sc = 0.7 + 0.5 * prng(); if (wins.some((w) => Math.abs(w.s - s) < 4.6)) continue; put(s, lathe([[0.6, 0], [1.0, 0.5], [1.05, 1.3], [0.7, 1.9], [0.75, 2.1], [0.5, 2.15]].map((q) => [q[0] * sc, q[1] * sc]), 9), { m: M(s, L.wR(s) - 1.9, benchH(s)), c: tint(i % 3 ? CLAY : lin('#d8c8a0'), 0.2), kind: 1 }); }

    await ctx.yield();
    // SITTING ROOM: cushions on the rock bench, the iron stove, the low table with the samovar, the cat, the curtain
    for (let i = 0; i < 12; i++) {
      const s = 240 + i * 5.6, cc = [mul(INDIGO, 1.5), MADDER, mul(lin('#c98a2a'), 0.9), CREAM][i % 4]; if (Math.abs(s - 251) < 5 || L.pinch(s) > 0) continue;
      put(s, pillow(2.9, 1.0, 4.6, 0.6, 10, 6), { m: M(s, L.wR(s) - 1.9, benchH(s) - 0.1, 0.06 * Math.sin(i * 5)), c: tint(cc, 0.08), kind: 2, w: i % 2, uv: (x, y, z) => [x * 1.3, z * 0.9] });
      if (i % 3 !== 2 && !wins.some((w) => Math.abs(w.s - s) < 6.2)) put(s, pillow(1.1, 2.6, 3.6, 0.7, 8, 6), { m: M(s, L.wR(s) - 0.95, benchH(s) + 0.7, 0), c: tint([MADDER, CREAM, mul(INDIGO, 1.5)][i % 3], 0.08), kind: 2, w: 1, uv: (x, y, z) => [z, y * 1.2] });
    }
    const STOVE = { s: 251, l: 11.2 }, stoveP = L.point(STOVE.s, STOVE.l, 3);
    { const m = M(STOVE.s, STOVE.l);
      put(STOVE.s, lathe([[2.3, 0.9], [2.5, 1.2], [2.5, 5.2], [2.7, 5.4], [2.7, 5.8], [1.9, 6.4], [0.7, 6.7], [0.7, 12.5]], 12), { m, c: tint(IRON, 0.25), kind: 3 });
      for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.78; put(STOVE.s, bar([Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1], [Math.cos(a) * 1.9, 1.1, Math.sin(a) * 1.9], 0.28, 0.2, 5), { m, c: IRON, kind: 3 }); }
      put(STOVE.s, bar([0, 12.2, 0], [-6.5, 13.6, 0], 0.7, 0.7, 8), { m, c: tint(IRON, 0.2), kind: 3 });
      put(STOVE.s, new THREE.CylinderGeometry(2.56, 2.56, 2.2, 8, 1, true, Math.PI / 2 - 0.5, 1.0).translate(0, 2.8, 0), { m, c: [1, 0.42, 0.1], kind: 1, emis: 3.2, l: [0, 0.4, 0] });
      for (const y of [1.9, 2.8, 3.7]) put(STOVE.s, new THREE.CylinderGeometry(2.6, 2.6, 0.16, 8, 1, true, Math.PI / 2 - 0.55, 1.1).translate(0, y, 0), { m, c: IRON, kind: 3 });
      blob(STOVE.s, STOVE.l, 4.5);
    }
    await ctx.yield();
    // the low table stands where the third window's sun square crosses the kilim; the camera comes straight at it and passes 8 m off
    const TABLE = { s: 285, l: 8.4 }, samTop = L.point(TABLE.s, TABLE.l, 11.3);
    { const m = M(TABLE.s, TABLE.l), top = 2.4, kr = prng.fork ? prng.fork('kit') : prng, T = (dx, dy, dz) => new THREE.Matrix4().makeTranslation(dx, dy, dz);
      put(TABLE.s, INT.tableGeometry({ rng: kr, scale: 8, round: true, width: 0.92, depth: 0.92, height: 0.3, color: '#7a4a2a' }), { m, c: 'geo', kind: 1 });
      put(TABLE.s, lathe([[0.05, 0], [2.9, 0.05], [3.15, 0.3], [3.2, 0.34], [2.85, 0.16], [0.05, 0.12]], 24), { m: M(TABLE.s, TABLE.l, top), c: (x, y, z) => mul(BRASS, 0.8 + 0.25 * Math.sin(Math.atan2(z, x) * 16) * Math.sin(Math.hypot(x, z) * 4)), kind: 3 });
      await ctx.yield();
      const sm = M(TABLE.s, TABLE.l, top + 0.15).multiply(T(0.3, 0, 0.2));
      // the samovar: foot, waisted stem, fluted urn with a moulded shoulder, crown, chimney; ring handles, tap and key
      put(TABLE.s, lathe([[1.55, 0], [1.75, 0.22], [1.6, 0.42], [1.15, 0.8], [0.85, 1.2], [0.95, 1.38], [1.25, 1.5], [1.9, 1.85], [2.22, 2.7], [2.3, 3.6], [2.24, 4.7], [1.95, 5.45], [1.5, 5.85], [1.2, 6.0], [1.5, 6.2], [1.52, 6.42], [1.1, 6.6], [0.8, 6.85], [0.58, 7.4], [0.72, 7.5]], 24),
        { m: sm, c: (x, y, z) => { const a = Math.atan2(z, x), fl = y > 1.9 && y < 5.4 ? 0.8 + 0.22 * Math.abs(Math.sin(a * 8)) : 0.92; return mul(BRASS, fl * (Math.abs(y - 2.05) < 0.14 || Math.abs(y - 5.2) < 0.12 ? 0.55 : 1) * (0.94 + 0.12 * hsh(Math.round(a * 20), Math.round(y * 6), 3))); }, kind: 3 });
      await ctx.yield();
      for (const sx of [-1, 1]) { put(TABLE.s, new THREE.TorusGeometry(0.78, 0.15, 6, 12, Math.PI).rotateZ(-sx * Math.PI / 2).translate(sx * 2.28, 4.2, 0), { m: sm, c: BRASS, kind: 3 }); put(TABLE.s, new THREE.SphereGeometry(0.3, 8, 6).translate(sx * 3.02, 4.2, 0), { m: sm, c: tint(DARKWOOD), kind: 1 }); }
      put(TABLE.s, bar([0, 2.6, 0], [1.7, 2.5, 2.3], 0.17, 0.13, 6), { m: sm, c: BRASS, kind: 3 }); put(TABLE.s, bar([1.7, 2.95, 2.3], [1.7, 2.1, 2.3], 0.1, 0.16, 6), { m: sm, c: BRASS, kind: 3 });
      put(TABLE.s, new THREE.TorusGeometry(0.3, 0.07, 5, 10).translate(1.7, 3.2, 2.3), { m: sm, c: BRASS, kind: 3 });
      put(TABLE.s, new THREE.CylinderGeometry(1.0, 1.0, 0.5, 12, 1, true).translate(0, 1.05, 0), { m: sm, c: [1, 0.45, 0.12], kind: 1, emis: 1.3 });
      await ctx.yield();
      put(TABLE.s, INT.teapotGeometry({ rng: kr, scale: 8, height: 0.19, color: '#e8e0d0' }), { m: sm.clone().multiply(T(0, 7.45, 0)), c: 'geo', kind: 3 });
      await ctx.yield();
      for (const [dx, dz] of [[2.0, -1.5], [-1.9, 1.7]]) { const gm = M(TABLE.s, TABLE.l, top + 0.2).multiply(T(dx, 0, dz));
        put(TABLE.s, lathe([[0.05, 0], [0.7, 0.04], [0.75, 0.14], [0.3, 0.1]], 12), { m: gm, c: mul(WHITE, 0.95), kind: 3 });
        put(TABLE.s, lathe([[0.26, 0.12], [0.36, 0.3], [0.24, 0.62], [0.4, 1.02], [0.42, 1.05]], 12), { m: gm, c: (x, y) => (y < 0.92 ? [0.62, 0.2, 0.03] : mul(WHITE, 0.9)), kind: 3, emis: 0.12 }); }
      await ctx.yield();
      put(TABLE.s, INT.plateGeometry({ rng: kr, scale: 8, radius: 0.12, color: '#e8e2d2', band: '#24406e' }), { m: M(TABLE.s, TABLE.l, top + 0.2).multiply(T(-1.8, 0, -1.8)), c: 'geo', kind: 3 });
      for (let i = 0; i < 7; i++) put(TABLE.s, new THREE.SphereGeometry(0.3, 7, 5).translate(-1.8 + 0.5 * Math.cos(i * 0.9) * (i ? 1 : 0), top + 0.55, -1.8 + 0.5 * Math.sin(i * 0.9) * (i ? 1 : 0)), { m: M(TABLE.s, TABLE.l), c: tint(APRICOT, 0.2), kind: 1 });
      for (const [a, cc] of [[0.25, MADDER], [2.0, mul(INDIGO, 1.5)], [-1.25, CREAM]]) { put(TABLE.s, pillow(3.4, 0.9, 3.4, 0.7, 10, 5), { m: M(TABLE.s - Math.cos(a) * 5.4, TABLE.l - Math.sin(a) * 4.8, 0.1, a), c: tint(cc, 0.08), kind: 2, w: 1, uv: (x, y, z) => [x, z] }); blob(TABLE.s - Math.cos(a) * 5.4, TABLE.l - Math.sin(a) * 4.8, 3, 0.6); }
      blob(TABLE.s, TABLE.l, 6.2, 0.8);
    }
    await ctx.yield();
    // geraniums on a sunlit sill, the door curtain drawn aside at the far arch
    { const w = wins.find((q) => q.s === 289), f = L.frame(291.2, {}), m = new THREE.Matrix4().makeRotationY(Math.atan2(f.tx, f.tz)).setPosition(f.x + f.nx * (L.wR(289) + 2.2), f.y + 3.35, f.z + f.nz * (L.wR(289) + 2.2));
      const vase = INT.vaseGeometry({ rng: prng, scale: 11, height: 0.24, color: '#b8573a', flowers: 16, flowerColors: ['#d81e1e', '#e8382a', '#c81a2c'] });
      await ctx.yield();
      put(289, vase, { m, c: 'geo', kind: 1, sway: (x, y) => (y > 3 ? [0.07 * f.tx, 0, 0.07 * f.tz, 0.6 + x] : null), l: [0.9, 0.9, 0] }); w.pot = true; }
    await ctx.yield();
    // the door curtain of the far arch: indigo cloth with cream bands, about 4.2 m wide to a side, hung on rings inside the opening from
    // a wooden arm set in each jamb, drawn aside and gathered to the jamb by a cord, falling almost to the floor. It is still
    // swinging: the swag between arm and cord billows along the way, most at its free edge, and the tail below the cord swings
    // from the cord down; arm and cord hold still. Nothing here is darker than the cloth (the arms are the lighter wood).
    // x = metres from the middle of the arch, y = metres above the ramp, z = metres along the way (the pleats). The jamb stands
    // 7.8 m out at the floor and 6.4 m at its springing, 11 m up, and the head closes above it. The curtain hangs at s = 308.6,
    // inside the arch and 1.4 m before the lantern under its crown; the arms leave the middle of the opening to the lantern, and
    // the free edge (4.1 m out at the arm, 5.5 m at the cord) and the cord (7.8 m up) keep the cloth farther from the middle of
    // the opening 9 m up, where the way goes through, than the lantern's foot hangs from it (about 4.5 m): the clear corridor
    // this arch already has. The gather stands about 0.5 m off the jamb, which leans in as it rises
    { const s = 308.6, B = rooms[roomOf(s)], f = L.frame(s, {}), YP = 13.0, Y0 = 12.7, YT = 7.8, YH = 0.9, VT = (Y0 - YT) / (Y0 - YH), NU = 48, NV = 30, CW = 4.5, blue = mul(INDIGO, 1.5);
      const wp = (x, y, z) => [f.x + f.nx * x + f.tx * z, f.y + y, f.z + f.nz * x + f.tz * z];
      for (const sx of [-1, 1]) {
        const P = [], id = [], ph = 0.13 + sx * 0.02;
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const u = i / NU, v = j / NV, a = Math.min(1, v / VT), b = sstep(VT, 1, v);      // u: 0 at the free edge, 1 at the jamb; v: 0 at the arm, 1 at the hem
          const xi = v < VT ? lerp(4.1, 5.5, a) : 5.5 - 0.5 * b, xo = v < VT ? lerp(5.7, 6.3, sstep(0, 1, a)) : lerp(6.3, 6.9, b), w = xo - xi;
          const fold = (w / 28.27) * Math.sqrt(2 * ((CW / w) ** 2 - 1));      // 4.5 pleats take up what the span leaves of the cloth's width (CW is nominal: a sine's length runs a little short of it)
          P.push([sx * lerp(xi, xo, u), lerp(Y0, YH, v) + (1 - u) * b - 0.09 * (1 - Math.cos(u * 25.133)) * (1 - sstep(0, 0.08, v)), fold * Math.sin(u * 28.27 + sx)]);
        }
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const q = (ii, jj) => P[Math.min(NV, Math.max(0, jj)) * (NU + 1) + Math.min(NU, Math.max(0, ii))], a = q(i - 1, j), b = q(i + 1, j), c = q(i, j - 1), e = q(i, j + 1), p = q(i, j);
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = e[0] - c[0], vy = e[1] - c[1], vz = e[2] - c[2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = (nz > 0 ? 0.5 : -0.5) / (Math.hypot(nx, ny, nz) || 1); nx *= nl; ny *= nl; nz = nz * nl + 0.5;      // the normal along the way:
          const nm = 1 / Math.hypot(nx, ny, nz); nx *= nm; ny *= nm; nz *= nm;      // the mean of the pleat's own and the hanging plane's, so that a thin cloth takes the room's light on both halves nearer alike and no flank turns more than about 41 degrees from the plane
          const w = wp(p[0], p[1], p[2]), u = i / NU, v = j / NV, tail = Math.max(0, (v - VT) / (1 - VT)), k = 0.85 * tail ** 1.2 + 0.55 * Math.sin(Math.min(1, v / VT) * 3.1416) * (1 - u) ** 0.8;
          const vi = B.v(w[0], w[1], w[2], f.nx * nx + f.tx * nz, ny, f.nz * nx + f.tz * nz, mul(blue, 0.94 + 0.12 * hsh(i, j, sx + 2)), 2, 0, (u - 0.5) * 7.6, -0.35 * v * (Y0 - YH), 1); id.push(vi);
          B.S[vi * 3] = f.tx * k; B.S[vi * 3 + 1] = 0; B.S[vi * 3 + 2] = f.tz * k; B.M[vi * 4 + 2] = ph; B.sway = true;
        }
        for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) B.quadN(id[j * (NU + 1) + i], id[j * (NU + 1) + i + 1], id[(j + 1) * (NU + 1) + i + 1], id[(j + 1) * (NU + 1) + i]);
        // the arm in the jamb with its knob and rings, the cord round the gather and its end in the jamb
        put(s, bar(wp(sx * 6.9, YP, 0), wp(sx * 3.9, YP, 0), 0.2, 0.17, 7), { c: tint(WOOD, 0.15), kind: 1 });
        put(s, new THREE.SphereGeometry(0.36, 8, 6).translate(...wp(sx * 3.75, YP, 0)), { c: tint(WOOD, 0.15), kind: 1 });
        for (let i = 0; i <= 4; i++) put(s, new THREE.TorusGeometry(0.28, 0.04, 4, 10).rotateY(1.5708), { m: M(s, sx * lerp(4.1, 5.7, i / 4), YP - 0.04), c: tint(WOOD, 0.15), kind: 1 });
        put(s, new THREE.TorusGeometry(0.52, 0.09, 5, 14).rotateX(1.5708).scale(1, 1, 0.7), { m: M(s, sx * 5.9, YT), c: tint(CREAM, 0.1), kind: 1 });
        put(s, bar(wp(sx * 6.25, YT, 0), wp(sx * 7.5, YT + 0.3, 0), 0.07, 0.07, 5), { c: tint(CREAM, 0.1), kind: 1 });
      }
    }
    await ctx.yield();
    { // the cat: curled on an indigo cushion in the sun square by the table, flank breathing, an ear twitching, the tail flicking
      const s = 290.5, l = 1.6, m = M(s, l, 0.95, -0.7), base = cast.cat === 'black' ? lin('#26232a') : cast.cat === 'tabby' ? lin('#b08a5c') : lin('#f2e2c4');
      const cc = (x, y, z) => { let c = base; if (cast.cat === 'tabby') c = mul(base, 0.55 + 0.55 * sstep(-0.2, 0.2, Math.sin(z * 3.6 + x * 2.2 + y))); return mul(c, (0.62 + 0.38 * sstep(0.05, 1.3, y)) * (0.92 + 0.16 * hsh(Math.round(x * 5), Math.round(y * 5), Math.round(z * 5)))); };
      put(s, pillow(6.6, 1.05, 7.6, 0.55, 14, 6), { m: M(s, l, 0, -0.7), c: (x, y, z) => mul(INDIGO, (1.5 + 0.5 * (Math.abs(x) > 2.75 || Math.abs(z) > 3.25 ? 1 : 0)) * (0.55 + 0.45 * sstep(0.9, 3.2, Math.hypot(x * 1.1, z * 0.95)))), kind: 2, uv: (x, y, z) => [x, z] });
      await ctx.yield();
      const dm = dirOf(m, 0, 0, 1, 1), br = (x, y) => [0, 0.09 * Math.max(0, y), 0, 0.0];
      // a crescent of body: haunch, back, shoulders, and the head tucked onto the forepaws
      const lump = (r, sx, sy, sz, px, py, pz, sw) => put(s, new THREE.SphereGeometry(r, 14, 10).scale(sx, sy, sz).translate(px, py, pz), { m, c: cc, kind: 1, sway: sw });
      lump(1, 1.45, 1.0, 1.5, -0.55, 0.9, -1.25, br); lump(1, 1.3, 0.92, 1.7, -0.95, 0.85, 0.2, br); lump(1, 1.25, 0.9, 1.3, -0.35, 0.82, 1.4, br);
      await ctx.yield();
      lump(0.82, 1, 0.92, 1.05, 1.15, 1.08, 1.5, null);                                                         // head
      lump(0.34, 1, 0.8, 1.2, 1.78, 0.82, 1.3, null); lump(0.3, 1.9, 0.6, 0.9, 1.25, 0.25, 0.55, null);        // muzzle, forepaws
      await ctx.yield();
      for (const sx of [-1, 1]) { const g = new THREE.ConeGeometry(0.4, 1.0, 4).rotateY(Math.PI / 4).scale(1, 1, 0.55).rotateX(-0.25).rotateZ(-sx * 0.25).translate(1.15 + sx * 0.52, 2.05, 1.4 - sx * 0.12);
        put(s, g, { m, c: (x, y, z) => mul(cc(x, 1.4, z), y > 2.1 ? 0.6 : 0.95), kind: 1, sway: () => [dm.x * 0.1 * sx, 0, dm.z * 0.1 * sx, 0.71] }); }
      const tp = [[-1.3, 0.4, -2.3], [0.1, 0.36, -2.75], [1.5, 0.34, -2.5], [2.5, 0.32, -1.6], [3.0, 0.3, -0.4], [3.05, 0.3, 0.7]];
      for (let i = 0; i + 1 < tp.length; i++) put(s, bar(tp[i], tp[i + 1], 0.34 - i * 0.035, 0.31 - i * 0.035, 7), { m, c: (x, y, z) => mul(cc(x, 0.9, z), i > 2 ? 0.7 : 1), kind: 1, sway: (x, y, z) => { const k = sstep(0.4, 3.0, x); return [dm.x * 0.55 * k * k, 0.35 * k * k, dm.z * 0.55 * k * k, 0.52]; } });
      blob(s, l, 4.6, 0.8);
    }

    await ctx.yield();
    // floor-following strips (carpets, warp threads): rows along s, the surface h metres above the ramp
    const strip = (B, sA, sB, l0, l1, h, o) => {
      const n = Math.max(1, Math.round((sB - sA) / (o.step || 1))), nl = o.nl || 1, id = [];
      for (let i = 0; i <= n; i++) for (let j = 0; j <= nl; j++) { const s = lerp(sA, sB, i / n), l = lerp(l0, l1, j / nl), p = L.frame(s, {}), k = B.v(p.x + p.nx * l, p.y + h + (o.sag ? o.sag(i / n) : 0), p.z + p.nz * l, 0, 1, 0, o.c, o.kind || 1, 0, o.uv ? o.uv(j / nl, s - sA)[0] : 0, o.uv ? o.uv(j / nl, s - sA)[1] : 0, o.w || 0); id.push(k);
        if (o.shiver) { B.S[k * 3 + 1] = o.shiver * Math.sin((i / n) * Math.PI); B.M[k * 4 + 2] = o.ph || 0; B.sway = true; } }
      for (let i = 0; i < n; i++) for (let j = 0; j < nl; j++) B.quadN(id[i * (nl + 1) + j], id[i * (nl + 1) + j + 1], id[(i + 1) * (nl + 1) + j + 1], id[(i + 1) * (nl + 1) + j]);
    };
    // LOOM ROOM: the ground loom under the path with its half-woven carpet, the upright loom, skeins, baskets, dye pots
    { const B = rooms[4];
      strip(B, 343, 356, -4.2, 4.2, 2.0, { kind: 4, c: [0.55, 0.55, 0.55], uv: (u, v) => [u, v], nl: 4 });
      for (let i = 0; i < 34; i++) { const l = -4.1 + i * (8.2 / 33); strip(B, 356, 368, l - 0.06, l + 0.06, 2.0, { kind: 1, c: mul(CREAM, 0.85 + 0.2 * prng()), shiver: 0.07 + 0.05 * prng(), ph: prng(), step: 2, sag: (t) => -0.12 * Math.sin(t * Math.PI) }); }
      for (const s of [342.6, 356.1, 368.2]) { put(s, bar([-5.2, 2.0 - 0.3, 0], [5.2, 2.0 - 0.3, 0], 0.34, 0.34, 7), { m: M(s, 0), c: tint(WOOD, 0.15), kind: 1 }); for (const sx of [-5, 5]) put(s, bar([sx, 0, 0], [sx, 2.3, 0], 0.3, 0.24, 6), { m: M(s, 0), c: tint(DARKWOOD), kind: 1 }); }
      for (const s of [359.5, 363]) put(s, bar([-4.6, 2.22, 0], [4.6, 2.22, 0.3], 0.16, 0.16, 5), { m: M(s, 0), c: WOOD, kind: 1 });
      blob(349, 0, 7, 0.5); blob(361, 0, 6, 0.3);
      await ctx.yield();
      // upright loom on the outer side
      const s = 375, m = M(s, 11.2);
      for (const z of [-5.8, 5.8]) put(s, bar([0, 0, z], [0, 21, z], 0.55, 0.45, 7), { m, c: tint(WOOD, 0.18), kind: 1 });
      for (const y of [1.8, 20.2]) put(s, bar([0, y, -6.4], [0, y, 6.4], 0.5, 0.5, 8), { m, c: tint(DARKWOOD, 0.18), kind: 1 });
      put(s, bar([0.4, 9.5, -6], [0.4, 9.5, 6], 0.22, 0.22, 6), { m, c: WOOD, kind: 1 }); put(s, bar([0.6, 13.5, -6], [0.6, 13.5, 6], 0.18, 0.18, 6), { m, c: WOOD, kind: 1 });
      put(s, new THREE.PlaneGeometry(11, 7.4, 6, 4).rotateY(Math.PI / 2).translate(0.3, 5.6, 0), { m, c: [0.55, 0.55, 0.55], kind: 4, uv: (x, y, z) => [(z + 5.5) / 11, y] });
      const dx = dirOf(m, 1, 0, 0, 1);
      for (let i = 0; i < 40; i++) { const z = -5.3 + i * (10.6 / 39), ph = prng(); put(s, new THREE.PlaneGeometry(0.11, 10.8, 1, 6).rotateY(Math.PI / 2).translate(0.3 + (i % 2) * 0.35, 14.7, z), { m, c: mul(CREAM, 0.85 + 0.2 * prng()), kind: 1, sway: (x, y) => { const k = Math.sin(((y - 9.3) / 10.8) * Math.PI) * 0.09; return [dx.x * k, 0, dx.z * k, ph]; } }); }
      for (let i = 0; i < 6; i++) { const z = -5 + i * 2, len = 2.5 + 1.6 * prng(), ph = prng(), sw = (x, y) => { const k = (20.2 - y) / 5 * 0.3; return [dx.x * k * 0.3 + dirOf(m, 0, 0, 1, k).x, 0, dx.z * k * 0.3 + dirOf(m, 0, 0, 1, k).z, ph]; };
        put(s, bar([0.9, 20, z], [0.9, 20 - len, z], 0.05, 0.05, 4), { m, c: CREAM, kind: 1, sway: sw }); put(s, new THREE.SphereGeometry(0.62, 7, 5).translate(0.9, 20 - len - 0.5, z), { m, c: tint([MADDER, mul(INDIGO, 1.6), lin('#c98a2a'), CREAM][i % 4], 0.15), kind: 2, sway: sw }); }
      blob(s, 11.2, 6.5, 0.45);
      await ctx.yield();
      // skeins on a pole
      const s2 = 371.5, m2 = M(s2, -13.6, 0, 0), dz = dirOf(m2, 1, 0, 0.3, 1);
      for (const z of [-5.4, 5.4]) put(s2, bar([0, 0, z], [0, 12.6, z], 0.36, 0.28, 6), { m: m2, c: tint(WOOD), kind: 1 });
      put(s2, bar([0, 12.2, -6], [0, 12.2, 6], 0.24, 0.24, 6), { m: m2, c: tint(DARKWOOD), kind: 1 });
      for (let i = 0; i < 9; i++) { const z = -4.6 + i * 1.15, ph = prng(), cc = [MADDER, mul(INDIGO, 1.7), MADDER, lin('#c98a2a'), mul(INDIGO, 1.4), CREAM, MADDER, mul(INDIGO, 1.7), lin('#8a2a3a')][i];
        put(s2, pillow(1.25, 4.4 + prng(), 0.95, 0.85, 8, 8).translate(0, 7.2 - (i % 2) * 0.4, z), { m: m2, c: (x, y, zz) => mul(cc, 0.75 + 0.35 * Math.abs(Math.sin(x * 9 + zz * 7))), kind: 2, sway: (x, y) => { const k = (12.2 - y) / 5 * 0.32; return [dz.x * k, 0, dz.z * k, ph]; } }); }
      blob(s2, -13.6, 6, 0.5);
      await ctx.yield();
      for (const [sb, lb, top] of [[317, 11.5, WHITE], [348.5, -13.4, WHITE], [352, -13, lin('#7a1a14')], [356.5, -12.2, mul(INDIGO, 1.2)], [361.5, -13.2, lin('#c98a2a')]]) {
        if (top !== WHITE) {      // a dye pot: glazed clay with runs of dye down its side, the dark liquor inside, a stirring stick, a wet skein over the rim
          const pm = M(sb, lb, 0, sb);
          put(sb, lathe([[1.5, 0], [2.25, 0.5], [2.6, 1.5], [2.55, 2.3], [2.2, 2.8], [2.3, 3.0], [2.5, 3.08], [2.48, 3.2], [2.25, 3.16], [2.1, 2.85]], 20), { m: pm, kind: 1,
            c: (x, y, z) => { const a = Math.atan2(z, x), run = sstep(0.5, 0.85, hsh(Math.round(a * 7), 3, sb)) * sstep(0.8, 3.0, y); return mix3(mul(CLAY, (0.8 + 0.25 * hsh(Math.round(a * 4), Math.round(y * 2), sb)) * (0.86 + 0.14 * Math.sin(y * 6)) * (0.65 + 0.35 * sstep(0, 1.6, y))), mul(top, 0.8), run * 0.75); } });
          put(sb, new THREE.CircleGeometry(2.15, 20).rotateX(-Math.PI / 2).translate(0, 2.82, 0), { m: pm, c: mul(top, 0.75), kind: 3 });
          put(sb, bar([0.6, 0.5, 0.3], [-1.9, 5.8, -0.8], 0.13, 0.11, 6), { m: pm, c: tint(WOOD, 0.15), kind: 1 });
          put(sb, new THREE.TorusGeometry(0.75, 0.3, 7, 14).scale(1, 1.5, 0.7).translate(2.38, 2.6, 0).rotateY(1.1), { m: pm, c: (x, y, z) => mul(top, 0.85 + 0.35 * Math.abs(Math.sin(y * 9 + x * 5))), kind: 2 });
          blob(sb, lb, 3.6); continue;
        }
        put(sb, lathe([[1.6, 0], [2.2, 0.5], [2.4, 1.4], [2.4, 2.4], [2.15, 2.72], [2.0, 2.5]], 16), { m: M(sb, lb), c: (x, y, z) => mul(STRAW, (0.62 + 0.38 * (Math.floor(y * 3.2) % 2)) * (0.8 + 0.4 * hsh(Math.round(Math.atan2(z, x) * 9), 1, sb))), kind: 1 });
        const tg = pillow(4.2, top === WHITE ? 2.2 : 0.3, 4.2, 1, 12, 6); if (top === WHITE) { const q = tg.attributes.position; for (let i = 0; i < q.count; i++) q.setY(i, q.getY(i) * (1 + 0.3 * Math.sin(q.getX(i) * 5) * Math.sin(q.getZ(i) * 5))); tg.computeVertexNormals(); }
        put(sb, tg, { m: M(sb, lb, top === WHITE ? 1.9 : 2.25), c: tint(top, 0.1), kind: top === WHITE ? 2 : 3 }); blob(sb, lb, 3.6);
      }
    }
    await ctx.yield();
    for (const [s, side, wd, ht, lx, yw] of [[329, 1, 4.6, 8], [343, 1, 4.6, 7.5], [357, 1, 4.6, 8], [276, -1, 5.5, 8], [292, -1, 5, 8.5], [215.5, -1, 5, 7.5], [384.5, -1, 5.6, 8.6, -12.0, Math.PI + 0.445], [384.5, 1, 5.0, 8.0, 12.2, Math.PI - 0.445],
      [65.9, -1, 5.2, 9.2, -10.0, Math.PI + 0.3], [145.6, 1, 5, 8.8, 10.0, Math.PI - 0.34], [225.6, -1, 5, 8.8, -10.0, Math.PI + 0.34], [305.6, 1, 4.8, 8.8, 10.4, Math.PI - 0.34]]) {      // the last hangs on the cheek of the loft arch, facing us
      await ctx.yield();
      const l = lx ?? (side > 0 ? L.wR(s) - 2.25 : -(L.wL(s) - 2.5)), m = M(s, l, 14.6, yw ?? side * Math.PI / 2), d = dirOf(m, 0, 0, 1, 1), ph = prng();
      put(s, bar([-wd / 2 - 0.6, 0.1, 0], [wd / 2 + 0.6, 0.1, 0], 0.17, 0.17, 6), { m, c: tint(DARKWOOD), kind: 1 });
      put(s, sheet(wd, ht, 4, 8, (u, v) => 0.12 + 0.1 * Math.sin(u * 7) * v), { m, c: [0.55, 0.55, 0.55], kind: 4, uv: (x, y) => [x / wd + 0.5, -y + s], sway: (x, y) => { const k = (-y / ht) ** 2 * 0.22; return [d.x * k, 0, d.z * k, ph]; } });
      for (let i = 0; i < 9; i++) put(s, bar([-wd / 2 + (i + 0.5) * wd / 9, -ht, 0.2], [-wd / 2 + (i + 0.5) * wd / 9, -ht - 0.8, 0.22], 0.06, 0.04, 4), { m, c: CREAM, kind: 1 });
    }
    await ctx.yield();
    // LOFT: quilts aired over poles, bedding rolls, brazier, ladder
    // a quilt hung over a pole, drawn as cloth: it lies over the pole's crest and falls in a few broad folds that deepen down the
    // drop, the hem rises and falls with the folds and one end hangs a little lower than the other, and a plain binding of the
    // quilt's own colour is laid over the hem and both ends on either face. m seats the pole (z along it, x to the well), hp =
    // the pole's height, sx = the side of the pole it falls to (along the seat's x), drop = metres from 0.2 m over the pole down
    // to the hem (what the flat sheet before it measured), ref = the drop its swing is measured against, K = metres it swings at
    // the hem of that drop (the crests of the folds, seen from its outer side, swing a little more than the hollows, so that the
    // folds deepen and ease as it swings and never turn inside out),
    // seen = 1 where its outer face is the one the room sees, -1 where the face towards the pole is. The folds, the hem and the
    // lower end come from a hash of the place, not from the world's own stream. The folds' shade is laid into the baked light
    // after the bake (quiltShade), so that the patchwork's cream darkens with its colour
    const quiltShade = [], _qv = new THREE.Vector3(), _qn = new THREE.Vector3();
    const quilt = (s, m, hp, len, sx, drop, ref, col, st, ph, K, seen) => {
      const B = rooms[roomOf(s)], R = 0.27, NA = 3, H = drop - 0.2, BW = Math.min(0.24, H * 0.3), NU = Math.round(len * 4), NV = Math.max(3, Math.round((H - BW) * 1.6));
      const nf = len / 2.6, p1 = 6.283 * hsh(s, sx, 1.5), p2 = 6.283 * hsh(s, sx, 2.5), skew = (hsh(s, sx, 3.5) - 0.5) * 0.5, d = dirOf(m, 1, 0, 0, 1);
      const us = [0]; for (let i = 0; i <= NU; i++) us.push((BW + (len - 2 * BW) * i / NU) / len); us.push(1);
      const rows = []; for (let a = 0; a <= NA; a++) rows.push([0, a / NA]); for (let j = 1; j <= NV; j++) rows.push([1, (H - BW) * j / NV]); rows.push([1, H]);      // [0, share of the quarter turn over the pole] or [1, metres hung]
      const fold = (uu) => Math.sin(6.283 * nf * uu + p1) + 0.3 * Math.sin(6.283 * nf * 1.7 * uu + p2), deep = (hm) => { const q = Math.min(1.1, hm / 6); return 0.25 * q + 0.75 * q * q; };
      const NI = us.length, NR = rows.length;
      const at = (i, r) => { const uu = us[Math.min(NI - 1, Math.max(0, i))], [hang, w] = rows[Math.min(NR - 1, Math.max(0, r))];
        if (!hang) { const th = w * 1.5708; return [sx * R * Math.sin(th), hp + R * Math.cos(th), (uu - 0.5) * len]; }
        const g = deep(w), yh = hp + 0.2 - drop + Math.min(1, H / 4) * (0.14 * Math.sin(6.283 * nf * uu + p1 + 1.3) + skew * (uu - 0.5));
        return [sx * (R + 0.14 * g) + 0.2 * g * fold(uu), hp - (w / H) * (hp - yh), (uu - 0.5) * len * (1 - 0.04 * g)]; };
      const G = [];      // every point of the cloth: place, normal, swing, shade, pattern coordinates
      for (let r = 0; r < NR; r++) for (let i = 0; i < NI; i++) {
        const a = at(i - 1, r), b = at(i + 1, r), c = at(i, r - 1), e = at(i, r + 1), q = at(i, r), [hang, w] = rows[r];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = e[0] - c[0], vy = e[1] - c[1], vz = e[2] - c[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = (nx * sx > 0 || (!hang && ny > 0) ? 1 : -1) / (Math.hypot(nx, ny, nz) || 1); nx *= nl; ny *= nl; nz *= nl;
        if (!hang && w === 0) { nx = 0; ny = 1; nz = 0; }
        if (hang) { nx = nx * 0.5 + sx * 0.5; ny *= 0.5; nz *= 0.5; const nm = 1 / Math.hypot(nx, ny, nz); nx *= nm; ny *= nm; nz *= nm; }      // the mean of the fold's own normal and the hanging plane's: a thick cloth takes the room's light on both flanks of a fold nearer alike
        const hm = hang ? w : 0, g = deep(hm), F = fold(us[i]), k = hm / ref, kk = K * k * k * (0.85 + 0.15 * F * sx / 1.3) * sx;
        _qv.set(q[0], q[1], q[2]).applyMatrix4(m); _qn.set(nx, ny, nz).transformDirection(m);
        G.push([_qv.x, _qv.y, _qv.z, _qn.x, _qn.y, _qn.z, kk, 1 - 0.3 * g * Math.min(1, Math.max(0, -F * sx * seen) / 1.3) + 0.05 * g * Math.min(1, Math.max(0, F * sx * seen)), (us[i] - 0.5) * len * 0.6, (hang ? R * 1.5708 + w : R * 1.5708 * w) * sx * 0.6]);
      }
      // one vertex: the point a, or the point f of the way from a to b, lifted off metres along the cloth's normal
      const vert = (a, c, mw, b = a, f = 0, off = 0) => { const lp = (j) => a[j] + (b[j] - a[j]) * f;
        const vi = B.v(lp(0) + a[3] * off, lp(1) + a[4] * off, lp(2) + a[5] * off, a[3], a[4], a[5], c, 2, 0, lp(8), lp(9), mw);
        B.S[vi * 3] = d.x * lp(6); B.S[vi * 3 + 1] = 0; B.S[vi * 3 + 2] = d.z * lp(6); B.M[vi * 4 + 2] = ph; quiltShade.push([B, vi, lp(7)]); return vi; };
      const id = []; for (let r = 0; r <= NR - 2; r++) for (let i = 1; i <= NI - 2; i++) id[r * NI + i] = vert(G[r * NI + i], mul(col, 0.94 + 0.12 * hsh(i * 0.37 + s, r * 0.61, sx + 2)), st * 2);
      for (let r = 0; r < NR - 2; r++) for (let i = 1; i < NI - 2; i++) B.quadN(id[r * NI + i], id[r * NI + i + 1], id[(r + 1) * NI + i + 1], id[(r + 1) * NI + i]);
      // the binding: from the cloth's edge to 3 cm past where the patchwork ends, 1.5 cm off the cloth on either face, so that no edge of it lies in an edge of the patchwork
      const edge = mul(col, 0.9), fu = 0.03 * NU / (len - 2 * BW), fv = 0.03 * NV / (H - BW), strip = (n, outer, seam, next, f) => {
        const O = [], I = [[], []]; for (let j = 0; j < n; j++) { O.push(vert(G[outer(j)], edge, 0)); for (const t of [0, 1]) I[t].push(vert(G[seam(j)], edge, 0, G[next(j)], f, t ? 0.015 : -0.015)); }
        for (let j = 0; j + 1 < n; j++) for (const t of [0, 1]) B.quadN(O[j], I[t][j], I[t][j + 1], O[j + 1]); };
      strip(NR, (r) => r * NI, (r) => r * NI + 1, (r) => r * NI + 2, fu); strip(NR, (r) => r * NI + NI - 1, (r) => r * NI + NI - 2, (r) => r * NI + NI - 3, fu);
      strip(NI, (i) => (NR - 1) * NI + i, (i) => (NR - 2) * NI + i, (i) => (NR - 3) * NI + i, fv);
      B.sway = true;
    };
    const BRAZ = { s: 413, l: -7.5 }, brazP = L.point(BRAZ.s, BRAZ.l, 2.6);
    for (const [s, l, cc, st] of [[399.5, -11.2, mul(INDIGO, 1.1), 1], [405, 10.4, lin('#cfc6b6'), 0], [417.5, 8.2, mul(MADDER, 0.85), 1]]) {
      const m = M(s, l), hp = Math.min(10.5, vaultH(s, l) - 3), len = s > 410 ? 6 : 9;
      for (const z of [-len / 2 - 0.4, len / 2 + 0.4]) put(s, bar([0, 0, z], [0, hp + 0.3, z], 0.3, 0.24, 6), { m, c: tint(WOOD), kind: 1 });
      put(s, bar([0, hp, -len / 2 - 0.9], [0, hp, len / 2 + 0.9], 0.2, 0.2, 6), { m, c: tint(DARKWOOD), kind: 1 });
      for (const sx of [-1, 1]) { const drop = sx > 0 ? 6.6 : 5.2, ph = prng();
        quilt(s, m, hp, len, sx, drop, drop, cc, st, ph, 0.65, 1); }
      blob(s, l, 4.5, 0.3);
    }
    await ctx.yield();
    // four more hang from poles along the walls of the ramp mouth, where the climb comes up into the dovecote: they frame the reveal.
    // Each is thrown over its pole with the long drop to the room and a short fold behind it at the wall; the red one at 424 hangs
    // doubled, 3.2 m down either side: the climbing eye is under its hem until about 11 m short of the pole's middle and passes
    // it 8.4 m off, 2 m above the hem. (The wall ribs stand 0.62 m proud every 8 m as far as s = 440; the pole at 424 runs into
    // rib 420 on the vault's haunch with its downhill end.)
    // where a wall of the plain section stands at station s, h metres over the floor there (side 1 the outer wall, -1 the well's): metres from the middle.
    // (Not the outer wall's line below its springing where the bench stands, before s = 446: no arm ends there)
    const wallLat = (s, h, side) => { const cr = L.crown(s), hw = cr * 0.55, hx = (L.wR(s) + L.wL(s)) / 2 - 1.6, cx = (L.wR(s) - L.wL(s)) / 2; return h > hw ? cx + side * hx * Math.sqrt(Math.max(0, 1 - ((h - hw) / (cr - hw)) ** 2)) : side > 0 ? L.wR(s) - 0.2 - 1.4 * (h / hw) : -(L.wL(s) - 1.6) - 1.4 * (1 - h / hw); };
    for (const [s, side, len, cc, st, both] of [[441.6, -1, 7.6, mul(INDIGO, 1.25), 1], [444.6, 1, 8, mul(INDIGO, 1.25), 1], [454, 1, 6, lin('#d6cdbd'), 0], [424, -1, 4.6, mul(MADDER, 0.9), 1, 3.2]]) {
      const hp = Math.min(10.6, FLOOR + 2.2 - L.y(s)), hw = L.crown(s) * 0.55, hx = (L.wR(s) + L.wL(s)) / 2 - 1.6, cx = (L.wR(s) - L.wL(s)) / 2;
      const lw = hp > hw ? cx + side * hx * Math.sqrt(Math.max(0, 1 - ((hp - hw) / (L.crown(s) - hw)) ** 2)) : side > 0 ? L.wR(s) - 0.2 - 1.4 * (hp / hw) : -(L.wL(s) - 1.6) - 1.4 * (1 - hp / hw);
      const l = lw - side * 0.95, m = M(s, l), drop = Math.min(6.4, hp - 1.2), ph = prng();
      put(s, bar([0, hp, -len / 2 - 0.8], [0, hp, len / 2 + 0.8], 0.2, 0.2, 6), { m, c: tint(DARKWOOD), kind: 1 });
      // the arms run from the pole's ends into the wall, each to the wall at its own station and height and 0.6 m into the rock:
      // the pole is straight and level, the wall bends and the ramp climbs under it, so the two arms of a pole differ in length
      for (const z of [-len / 2 - 0.5, len / 2 + 0.5]) { const a = new THREE.Vector3(0, hp, z).applyMatrix4(m); let s2 = s, best = 1e9;
        for (let q = s - 9; q <= s + 9; q += 0.05) { const f = L.frame(q, {}), al = Math.abs((a.x - f.x) * f.tx + (a.z - f.z) * f.tz); if (al < best) { best = al; s2 = q; } }
        const f = L.frame(s2, {}), w = wallLat(s2, a.y - 0.5 - L.y(s2), side) + side * 0.6;
        put(s, bar([a.x, a.y, a.z], [f.x + f.nx * w, a.y - 0.5, f.z + f.nz * w], 0.16, 0.2, 5), { c: tint(WOOD), kind: 1 }); }
      quilt(s, m, hp, len, side, both || drop, both ? both * 1.4 : drop, cc, st, ph, 0.6, 1); quilt(s, m, hp, len, -side, both || 1.6, both ? both * 1.4 : drop, cc, st, ph, 0.6, -1);
    }
    await ctx.yield();
    { // the shutter of the loft's last window, left open: it rocks, and snow sifts in past it
      const w = wins[wins.length - 1], ws = w.s - 3.4, m = M(ws, L.wR(ws) - 1.5, w.h - 3.4, 0.9), d = dirOf(m, 1, 0, 0, 1);
      for (let i = 0; i < 4; i++) put(ws, pillow(0.22, 6.6, 0.74, 0.3, 4, 4).translate(0, 0, -1.2 + i * 0.8), { m, c: tint(mul(WOOD, 0.9 + 0.25 * prng()), 0.14), kind: 1, sway: (x, y, z) => [d.x * 0.1 * (z + 1.6), 0, d.z * 0.1 * (z + 1.6), 0.44] });
      for (const y of [1.2, 5.4]) put(ws, bar([0.16, y, -1.6], [0.16, y, 1.6], 0.12, 0.12, 4), { m, c: tint(DARKWOOD), kind: 1, sway: (x, yy, z) => [d.x * 0.1 * (z + 1.6), 0, d.z * 0.1 * (z + 1.6), 0.44] });
    }
    for (let i = 0; i < 5; i++) { const s = 409.5 + (i % 3) * 2.6 + (i > 2 ? 1.3 : 0), y = i > 2 ? 2.2 : 0; put(s, new THREE.CylinderGeometry(1.25, 1.25, 4.8, 10, 1).rotateZ(Math.PI / 2).translate(0, 1.25, 0), { m: M(s, 12.6 - (s - 409) * 0.25, y), c: tint([CREAM, mul(INDIGO, 1.6), MADDER, CREAM, lin('#c98a2a')][i], 0.08), kind: 2, w: 1, uv: (x, y2, z) => [y2, x * 0.9] }); }
    blob(412, 11.8, 5);
    { const m = M(BRAZ.s, BRAZ.l); put(BRAZ.s, lathe([[0.3, 1.5], [1.5, 1.7], [2.1, 2.5], [2.2, 2.7], [1.9, 2.6], [0.1, 2.0]], 12), { m, c: tint(IRON, 0.2), kind: 3 });
      put(BRAZ.s, new THREE.CircleGeometry(1.85, 12).rotateX(-Math.PI / 2).translate(0, 2.45, 0), { m, kind: 6, c: [1, 0.4, 0.1], l: [0, 1, 0] });
      for (let i = 0; i < 3; i++) { const a = i * 2.094; put(BRAZ.s, bar([Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7], [Math.cos(a) * 0.9, 1.9, Math.sin(a) * 0.9], 0.14, 0.12, 5), { m, c: IRON, kind: 3 }); } blob(BRAZ.s, BRAZ.l, 3.4); }
    const ladder = (B, m, len, lean, n) => { for (const z of [-0.95, 0.95]) B.add(bar([0, 0, z], [-lean, len, z], 0.17, 0.15, 5), { m, c: tint(WOOD, 0.15), kind: 1 }); for (let i = 1; i <= n; i++) { const t = i / (n + 1); B.add(bar([-lean * t, len * t, -0.95], [-lean * t, len * t, 0.95], 0.1, 0.1, 5), { m, c: tint(DARKWOOD, 0.15), kind: 1 }); } };
    ladder(rooms[5], M(433, 5.6, 0, 0.1), 11, 1.9, 8);
    for (let i = 0; i < 7; i++) { const s = 423 + i * 3.4, bh2 = benchH(s), y = (i % 2) * 0.0; if (bh2 < 0.5) continue; put(s, new THREE.CylinderGeometry(1.05, 1.05, 2.9, 10, 1).translate(0, 1.05, 0).rotateX(Math.PI / 2), { m: M(s, L.wR(s) - 1.9, bh2 + y), c: tint([CREAM, mul(INDIGO, 1.4), MADDER, lin('#c98a2a')][i % 4], 0.08), kind: 2, w: 1, uv: (x, y2, z) => [x, z * 0.9] }); }
    for (let i = 0; i < 5; i++) { const s = 394.5 + i * 4.1, l = (i % 2 ? 1 : -1) * Math.min(9.5, L.wR(s) - 3.2), top = vaultH(s, l) - 0.3; hang(s, l, top, 2.2 + (i % 3) * 0.6, [2, 0, 4, 1][i % 4]); }
    await ctx.yield();
    // dovecote floor: the keeper's long ladder against the wall, grain sacks by the parapet
    { const a = aEnd + 2.3, mk = (r, ang, y, yaw) => new THREE.Matrix4().makeRotationY(ang + yaw).setPosition(r * Math.cos(ang), y, -r * Math.sin(ang));
      ladder(rooms[5], mk(25.8, a, FLOOR, Math.PI), 31, 3.2, 22);
      for (let i = 0; i < 6; i++) { const ang = aEnd + 1.2 + i * 0.22, r = 16.2 + (i % 2) * 2.3; rooms[5].add(pillow(3, 3.2, 2.4, 0.75, 10, 7), { m: mk(r, ang, FLOOR + (i === 5 ? 2.9 : 0), i * 1.3), c: tint(lin('#cdb890'), 0.1), kind: 2, uv: (x, y, z) => [x * 2, y * 2 + z] }); if (i === 5) continue; }
    }

    await ctx.yield();
    // ---- what fills the cheeks of the arches and the walls between: painted ware on plank shelves, hens, lanterns ----
    const T4 = (dx, dy, dz) => new THREE.Matrix4().makeTranslation(dx, dy, dz), RX = (a) => new THREE.Matrix4().makeRotationX(a), RY = (a) => new THREE.Matrix4().makeRotationY(a);
    const WARE = [mul(INDIGO, 1.7), MADDER, lin('#c98a2a'), lin('#2f6e5a')], GLAZE = lin('#efe6d2');
    // a plate: white glaze, a painted rim, a ring of strokes and a rosette (stood on its edge by the matrix it is given)
    const plate = (s, m, r, i) => { const c1 = WARE[i % 4], c2 = WARE[(i + 1 + (i >> 2)) % 4];
      put(s, lathe([[0.02, 0.05], [r * 0.26, 0.04], [r * 0.3, 0.04], [r * 0.56, 0.06], [r * 0.6, 0.07], [r * 0.8, 0.16], [r * 0.84, 0.18], [r, 0.3], [r * 1.02, 0.27], [r * 0.6, 0], [0.02, -0.02]], 18), { m, kind: 3,
        c: (x, y, z) => { const q = Math.hypot(x, z) / r, a = Math.atan2(z, x); return y < 0.035 && q > 0.3 ? mul(GLAZE, 0.7) : q > 0.82 ? c1 : q < 0.28 ? c2 : q > 0.58 && q < 0.81 ? (Math.cos(a * 9) > 0.2 ? c2 : GLAZE) : q > 0.29 && q < 0.57 && Math.cos(a * 6) > 0.3 ? c1 : GLAZE; } }); };
    const jug = (s, m, k, i) => { const c1 = WARE[i % 4], body = i % 3 ? GLAZE : mul(CLAY, 1.4);
      put(s, lathe([[0.5, 0], [0.78, 0.25], [0.97, 0.78], [1.0, 0.84], [1.0, 1.3], [0.985, 1.36], [0.74, 1.85], [0.42, 2.2], [0.44, 2.5], [0.46, 2.56], [0.6, 2.75], [0.5, 2.76]].map((q) => [q[0] * k, q[1] * k]), 14), { m, kind: 3, c: (x, y) => { const h = y / k; return (h > 0.82 && h < 1.33) || h > 2.53 ? c1 : body; } });
      put(s, new THREE.TorusGeometry(0.5 * k, 0.11 * k, 5, 10, Math.PI).rotateZ(-Math.PI / 2).translate(0.62 * k, 1.9 * k, 0), { m, c: body, kind: 3 }); };
    const bowls = (s, m, n, j) => { for (let q = 0; q < n; q++) put(s, lathe([[0.3, 0], [0.85, 0.42], [0.9, 0.5], [0.78, 0.42], [0.25, 0.12]], 12), { m: m.clone().multiply(T4(0, q * 0.24, 0)), c: (x, y) => (y > 0.36 ? WARE[(j + q) % 4] : GLAZE), kind: 3 }); };
    // a plank on brackets with ware along it: local x along the shelf, +z out into the room, the wall about z = 0
    const ware = (s, m, len, seed) => {
      put(s, pillow(len, 0.36, 3.0, 0.3, 8, 4).translate(0, -0.36, 0.4), { m, c: tint(WOOD, 0.16), kind: 1 });
      for (const x of [-len * 0.36, len * 0.36]) put(s, bar([x, -0.3, 1.5], [x, -2.3, -1.0], 0.2, 0.14, 5), { m, c: tint(DARKWOOD, 0.15), kind: 1 });
      const n = Math.max(2, Math.round(len / 2.3));
      for (let i = 0; i < n; i++) { const x = -len / 2 + (i + 0.5) * (len / n), h = hsh(i, seed, 3.1), j = Math.floor(hsh(i, seed, 9.7) * 16), r = 0.9 + 0.8 * h;
        if (h < 0.5) plate(s, m.clone().multiply(T4(x, r * 0.96, 0.5)).multiply(RX(Math.PI / 2 - 0.3)), r, j);
        else if (h < 0.8) jug(s, m.clone().multiply(T4(x, 0, 0.9)).multiply(RY(h * 20)), 0.62 + 0.3 * h, j);
        else bowls(s, m.clone().multiply(T4(x, 0, 0.9)), 3, j); }
    };
    await ctx.yield();
    // on the walls: the inner wall of each room, and both tiers on the cheek of an arch (side -1 = the well side)
    const innerL = (s, h) => -(L.wL(s) - 1.6) - 1.4 * (1 - Math.min(1, h / (L.crown(s) * 0.55)));
    for (const [s, h, len] of [[104, 9.6, 6.5], [112, 13.2, 5], [160, 10.4, 6.5], [264, 10.8, 7.5], [266.5, 6.4, 5.5], [318.6, 10.2, 5.4], [200, 6.2, 5]]) { ware(s, M(s, innerL(s, h) + 0.75, h, -Math.PI / 2), len, s); await ctx.yield(); }
    const cheekShelf = (a, side, h, len, lc = 10.1) => ware(a, M(a - 4.45, side * (lc - 1.0 * (h / 12)), h, Math.PI - side * 0.33), len, a + h);
    for (const [a, side, h, len, lc] of [[70, 1, 5.4, 5.2], [70, 1, 9.4, 5.2], [70, 1, 13.2, 4.4], [150, -1, 5.6, 5], [150, -1, 9.8, 5], [230, 1, 5.6, 5], [230, 1, 9.8, 5], [310, -1, 5.4, 4.6, 10.6], [310, -1, 9.4, 4.6, 10.6], [310, -1, 13.2, 4.2, 10.6]]) { cheekShelf(a, side, h, len, lc); await ctx.yield(); }
    await ctx.yield();
    // hens: a body, a bent neck that pecks (the quick sway), comb and wattle, a fan of tail feathers, wings, legs
    const hen = (s, l, yaw, i, sc = 1, h0 = 0) => {
      const m = M(s, l, h0, yaw, sc), fwd = dirOf(m, 0, 0, 1, 1), ph = 2.05 + 0.9 * prng(), base = [lin('#f1e9da'), lin('#a8522a'), lin('#3a3236'), lin('#d9a05a')][i % 4], dark = mul(base, 0.55), RED = lin('#c8201a'), LEG = lin('#c9a23a');
      const peck = (x, y, z) => { const k = sstep(1.7, 2.7, y) * sstep(0.3, 1.5, z); return [fwd.x * 0.28 * k * sc, -0.78 * k * sc, fwd.z * 0.28 * k * sc, ph]; };
      const cb = (x, y, z) => mul(i % 4 === 2 ? mix3(base, WHITE, 0.7 * sstep(0.55, 0.75, hsh(Math.round(x * 4), Math.round(y * 4), Math.round(z * 4)))) : base, (0.7 + 0.3 * sstep(1.0, 2.6, y)) * (0.9 + 0.2 * hsh(Math.round(x * 5), Math.round(y * 5), Math.round(z * 5))));
      put(s, new THREE.SphereGeometry(1, 12, 9).scale(1.05, 1.0, 1.55).translate(0, 1.85, 0), { m, c: cb, kind: 1, sway: peck });
      put(s, new THREE.SphereGeometry(1, 9, 7).scale(0.6, 0.95, 0.62).rotateX(0.9).translate(0, 2.35, 1.2), { m, c: cb, kind: 1, sway: peck });
      put(s, new THREE.SphereGeometry(0.5, 9, 7).translate(0, 2.7, 1.9), { m, c: cb, kind: 1, sway: peck });
      put(s, new THREE.ConeGeometry(0.2, 0.6, 5).rotateX(Math.PI / 2 + 0.5).translate(0, 2.5, 2.5), { m, c: lin('#d9a030'), kind: 1, sway: peck });
      put(s, pillow(0.16, 0.5, 0.8, 0.7, 6, 4).translate(0, 3.05, 1.8), { m, c: RED, kind: 1, sway: peck });
      put(s, new THREE.SphereGeometry(0.2, 6, 4).scale(0.6, 1.3, 0.8).translate(0, 2.25, 2.3), { m, c: RED, kind: 1, sway: peck });
      for (let q = -2; q <= 2; q++) put(s, pillow(0.14, 1.9 + 0.3 * (2 - Math.abs(q)), 0.75, 0.6, 5, 4).rotateX(-0.75).rotateZ(q * 0.2).translate(q * 0.22, 2.2, -1.25), { m, c: (x, y) => mul(dark, 0.8 + 0.4 * sstep(2.4, 3.8, y)), kind: 1 });
      for (const sx of [-1, 1]) { put(s, pillow(0.3, 1.25, 1.9, 0.7, 6, 5).translate(sx * 0.98, 1.35, -0.15), { m, c: (x, y, z) => mul(dark, 0.9 + 0.5 * hsh(Math.round(y * 5), Math.round(z * 5), i)), kind: 1 });
        put(s, bar([sx * 0.4, 1.1, 0.1], [sx * 0.42, 0.12, 0.25], 0.09, 0.08, 5), { m, c: LEG, kind: 1 }); put(s, new THREE.ConeGeometry(0.34, 0.14, 3).rotateY(Math.PI).translate(sx * 0.42, 0.07, 0.4), { m, c: LEG, kind: 1 }); }
      if (!h0) blob(s, l, 2.6 * sc, 0.6);
    };
    { const HENS = [[30, -6.5, 0.6], [35.5, -9, 2.4], [39, 5.2, -1.0], [50, -5.6, 1.7], [77, 4.6, 2.6], [80.5, -5, 0.4], [85, 5.6, -2.2], [88.5, -6.8, 1.2], [92.5, 7.2, 3.0], [100, -4.8, -0.6]];
      for (let i = 0; i < HENS.length; i++) { hen(HENS[i][0], HENS[i][1], HENS[i][2], i); await ctx.yield(); }
      hen(49, 12.2, -1.9, 1, 1.25, 5.15); }      // the cock on the stall wall
    await ctx.yield();
    // lanterns: one hung under the crown of every arch (their glow goes into the rock shader as a small warm light), six on the parapet of the well
    const glows = [];
    const lantern = (s, l, hTop, len, k = 1) => {
      const m = M(s, l, hTop), d = dirOf(m, 1, 0, 0.4, 0.4), ph = prng(), sw = (x, y) => { const q = Math.min(1.3, -y / len); return [d.x * q * q, 0, d.z * q * q, ph]; };
      put(s, bar([0, 0.5, 0], [0, -len, 0], 0.07, 0.07, 4), { m, c: IRON, kind: 3, sway: sw });
      put(s, lathe([[0.08, 0.5], [0.3, 0.3], [0.95, -0.1], [1.05, -0.25], [0.9, -0.3]].map((q) => [q[0] * k, q[1] * k]), 6).translate(0, -len, 0), { m, c: tint(BRASS, 0.12), kind: 3, sway: sw });
      put(s, new THREE.CylinderGeometry(0.72 * k, 0.6 * k, 1.7 * k, 6, 1, true).translate(0, -len - 1.15 * k, 0), { m, c: [1, 0.5, 0.14], kind: 1, emis: 2.4, l: [0, 0.5, 0], sway: sw });
      for (let i = 0; i < 6; i++) { const a = i * 1.0472; put(s, bar([Math.cos(a) * 0.74 * k, -len - 0.3 * k, Math.sin(a) * 0.74 * k], [Math.cos(a) * 0.62 * k, -len - 2.0 * k, Math.sin(a) * 0.62 * k], 0.07 * k, 0.07 * k, 4), { m, c: IRON, kind: 3, sway: sw }); }
      put(s, lathe([[0.75, 0], [0.7, -0.2], [0.2, -0.4], [0.05, -0.75]].map((q) => [q[0] * k, q[1] * k]), 6).translate(0, -len - 2.0 * k, 0), { m, c: tint(BRASS, 0.12), kind: 3, sway: sw });
      const c = new THREE.Vector3(0, -len - 1.15 * k, 0).applyMatrix4(m); glows.push([c.x, c.y, c.z, 3.6 * k, 0.42]); return c;
    };
    for (let i = 0; i < ARCHES.length; i++) { const a = ARCHES[i], top = vaultH(a, 0) - 0.3, c = lantern(a, 0, top, top - 17.2, 1.3); rock.setHot(4 + i, c.x, c.y - 0.6, c.z, 0.34); await ctx.yield(); }
    await ctx.yield();
    for (let i = 0; i < 6; i++) { const ang = aEnd + 0.5 + i * 1.0472, x = 12.8 * Math.cos(ang), z = -12.8 * Math.sin(ang), m = T4(x, FLOOR + 3, z);
      rooms[5].add(bar([0, 0, 0], [0, 2.7, 0], 0.2, 0.15, 5), { m, c: tint(DARKWOOD, 0.15), kind: 1 });
      rooms[5].add(new THREE.CylinderGeometry(0.95, 0.75, 2.2, 6, 1, true).translate(0, 3.8, 0), { m, c: [1, 0.5, 0.14], kind: 1, emis: 2.4, l: [0, 0.5, 0] });
      rooms[5].add(new THREE.ConeGeometry(1.4, 1.0, 6).translate(0, 5.4, 0), { m, c: tint(BRASS, 0.12), kind: 3 });
      glows.push([x, FLOOR + 6.8, z, 4.6, 0.4]); }
    rock.setHot(9, 0, FLOOR + 7.5, 0, 1.25); { const g = L.point(450, 0, 5.5); rock.setHot(10, g.x, g.y, g.z, 0.75); glows.push([g.x, g.y - 1, g.z, 9, 0.22]); }
    await ctx.yield();
    // snow lying in the window embrasures, blown in over the sills
    if (look.snowy) for (const w of wins) { if (w.pot) continue; await ctx.yield(); put(w.s, pillow(5.8, 3.2, 4.5 * w.k, 0.75, 9, 6), { m: M(w.s, L.wR(w.s) + 3.9, w.h - 4 * w.k - 2.3), c: (x, y, z) => mul([0.86, 0.91, 1.0], 0.9 + 0.1 * Math.sin(x * 1.3 + z * 0.8)), kind: 1, l: [0.95, 0.22, 0.25] }); }
    await ctx.yield();
    { // a low table laid just inside the loom room, and the runner that leads to it through the arch
      const s = 316.5, l = 4.6, m = M(s, l, 0, 0.4), top = 1.92;
      put(s, lathe([[1.6, 0], [1.9, 0.3], [1.2, 1.3], [1.3, 1.6], [3.5, 1.75], [3.65, 2.0], [3.6, 2.05], [3.4, 1.9], [0.05, 1.85]], 20), { m, c: (x, y, z) => mul(BRASS, 0.75 + 0.25 * Math.sin(Math.atan2(z, x) * 12) * Math.sin(Math.hypot(x, z) * 3)), kind: 3 });
      jug(s, m.clone().multiply(T4(-1.5, top, 0.7)), 0.8, 1); plate(s, m.clone().multiply(T4(1.3, top, -1.0)), 1.05, 2); plate(s, m.clone().multiply(T4(-0.6, top, -1.9)), 0.9, 7); bowls(s, m.clone().multiply(T4(1.9, top, 1.3)), 1, 3);
      for (let i = 0; i < 5; i++) put(s, new THREE.CylinderGeometry(1.0, 1.05, 0.14, 12).translate(0.2 + 0.1 * Math.sin(i * 3), top + 0.08 + i * 0.15, 1.7), { m, c: (x, y, z) => mix3(lin('#f0deb0'), lin('#b98a4a'), sstep(0.55, 0.85, hsh(Math.round(x * 2.2), i, Math.round(z * 2.2))) * 0.7), kind: 1 });
      await ctx.yield();
      for (let i = 0; i < 6; i++) put(s, new THREE.SphereGeometry(0.3, 7, 5).translate(1.9 + 0.42 * Math.cos(i * 1.05) * (i ? 1 : 0), top + 0.5, 1.3 + 0.42 * Math.sin(i * 1.05) * (i ? 1 : 0)), { m, c: tint(APRICOT, 0.2), kind: 1 });
      for (const [a, cc] of [[0.6, MADDER], [2.6, mul(INDIGO, 1.5)]]) { put(s, pillow(3.2, 0.9, 3.2, 0.7, 10, 5), { m: M(s - Math.cos(a) * 5.2, l - Math.sin(a) * 4.6, 0.05, a), c: tint(cc, 0.08), kind: 2, w: 1, uv: (x, y, z) => [x, z] }); blob(s - Math.cos(a) * 5.2, l - Math.sin(a) * 4.6, 2.8, 0.6); }
      blob(s, l, 5.6, 0.75);
      strip(rooms[4], 303.5, 323, -3.3, 3.3, 0.1, { kind: 4, c: [0.55, 0.55, 0.55], uv: (u, v) => [u, v], nl: 4, step: 0.5, sag: (t) => L.rib(303.5 + t * 19.5) });
    }
    await ctx.yield();
    // ---- the donkey in its stall (or two goats): kit quadruped posed standing, ears, tail and head moved by sway ----
    const animals = new Bld(), noses = [];
    const beast = (s, l, yaw, preset, k) => {
      const g = F.quadrupedGeometry(preset), an = g.attributes.aAnim, pos = g.attributes.position, m = M(s, l, 0, yaw), sd = dirOf(m, 1, 0, 0, 1); let zi = 0;
      { g.computeVertexNormals(); const nr = g.attributes.normal, acc = new Map(), key = (i) => Math.round(pos.getX(i) * 40) + ',' + Math.round(pos.getY(i) * 40) + ',' + Math.round(pos.getZ(i) * 40);
        for (let i = 0; i < pos.count; i++) { const k = key(i), a = acc.get(k) || [0, 0, 0]; a[0] += nr.getX(i); a[1] += nr.getY(i); a[2] += nr.getZ(i); acc.set(k, a); }
        for (let i = 0; i < pos.count; i++) { const a = acc.get(key(i)), l2 = Math.hypot(a[0], a[1], a[2]) || 1; nr.setXYZ(i, a[0] / l2, a[1] / l2, a[2] / l2); } }
      for (let i = 1; i < pos.count; i++) if (pos.getZ(i) - pos.getY(i) * 0.15 > pos.getZ(zi) - pos.getY(zi) * 0.15) zi = i;
      noses.push(new THREE.Vector3(pos.getX(zi), pos.getY(zi), pos.getZ(zi)).applyMatrix4(m));
      animals.add(g, { m, c: 'geo', kind: 1, sway: (x, y, z, i) => { const part = an.getZ(i), w = an.getY(i); if (part > 4.5) return [sd.x * 0.4 * k, 0.05, sd.z * 0.4 * k, 0.83]; if (part > 2.5 && part < 3.5) return [sd.x * 1.5 * k * w * w, 0, sd.z * 1.5 * k * w * w, 0.31]; if (part > 1.5 && part < 2.5) return [0, -0.3 * k * an.getX(i), 0, 0.12]; return null; } });
      blob(s, l, 7 * k, 0.6);
    };
    // they stand across the stall, in profile to the door, heads towards the path and a little towards us
    if (cast.goats) { const goat = { ...F.HERD_PRESETS.deer, h: 6.2, antlers: 0, horns: 0.3, ears: 0.2, tail: 0.14, neckAng: 46, headPitch: 26, coat: '#eadfc8', belly: '#f4eee0', legs: '#d2c4a8', sock: '#a39078', accent: '#d8ccb4', horn: '#6a5a48', pattern: 'none' };
      beast(40.5, 12.6, 1.9, goat, 0.6); await ctx.yield(); beast(48.5, 11.8, 2.2, { ...goat, h: 5.0, coat: '#8a6c54', belly: '#c8b89c', legs: '#77604c', accent: '#b09a80' }, 0.5);
    } else beast(44, 12.4, 1.95, { ...F.HERD_PRESETS.horse, h: 9, ears: 0.26, neckLen: 0.5, neckAng: 34, headLen: 0.5, headR: 0.115, headPitch: 52, tail: 0.5, tailType: 'tuft', mane: 0.7, coat: '#9a918a', belly: '#e2dacb', legs: '#847c75', sock: '#5e5650', accent: '#e6ddce', hoof: '#2e2a28' }, 1);
    await ctx.yield();

    // ---- meshes ----
    const matProp = rock.material({ sway: true, side: THREE.DoubleSide }), matShell = rock.material(), matTrim = rock.material({ side: THREE.DoubleSide });
    let propTris = 0;
    for (const B of [...rooms, animals]) { if (!B.n) continue; await B.bake(lightFn, ctx); for (const [b, vi, sh] of quiltShade) if (b === B) { b.L[vi * 3] *= sh; b.L[vi * 3 + 1] *= sh; b.L[vi * 3 + 2] *= sh; } const me = new THREE.Mesh(B.build(lightFn), matProp); scene.add(me); propTris += B.triangles; await ctx.yield(); }
    await trim.bake(lightFn, ctx); scene.add(new THREE.Mesh(trim.build(lightFn), matTrim));
    await ctx.yield();
    { // soot above the oven, then light and split the shell into six culled chunks that share their vertex buffers
      const b = shell.b, P = b.P, C = b.C;
      { const hp = hearthAt(1.2, 0, 0); for (let i = 0; i < b.n; i++) { const k = i * 3, dy = P[k + 1] - hp.y; if (dy < 4 || dy > 17) continue; const d = Math.hypot(P[k] - hp.x, P[k + 2] - hp.z); if (d > 6) continue; const q = (1 - d / 6) * sstep(4, 7.5, dy) * (1 - sstep(11, 17, dy)) * 0.62; C[k] *= 1 - q; C[k + 1] *= 1 - q * 0.97; C[k + 2] *= 1 - q * 0.92; } }
      for (let i = 0; i < b.n; i++) { const k = i * 3, dy = P[k + 1] - ovenP.y; if (dy < 7 || dy > 30) continue; const d = Math.hypot(P[k] - ovenP.x, P[k + 2] - ovenP.z); if (d > 17) continue; const q = (1 - d / 17) * sstep(7, 20, dy) * 0.78; C[k] *= 1 - q; C[k + 1] *= 1 - q * 0.97; C[k + 2] *= 1 - q * 0.92; }
      await b.bake(lightFn, ctx);
      const full = b.build(lightFn), I = b.I, pairs = shell.rings.length - 1, NCH = 6, v = new THREE.Vector3();
      for (let c = 0; c < NCH; c++) {
        await ctx.yield();
        const i0 = shell.starts[Math.floor((c * pairs) / NCH)], i1 = shell.starts[Math.floor(((c + 1) * pairs) / NCH)], g = new THREE.BufferGeometry(), box = new THREE.Box3();
        for (const k in full.attributes) g.setAttribute(k, full.attributes[k]);
        g.setIndex(new THREE.Uint32BufferAttribute(I.slice(i0, i1), 1));
        for (let i = i0; i < i1; i += 7) box.expandByPoint(v.set(P[I[i] * 3], P[I[i] * 3 + 1], P[I[i] * 3 + 2]));
        g.boundingSphere = box.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 6;
        scene.add(new THREE.Mesh(g, matShell));
      }
    }
    await ctx.yield();
    // the spindle, still twirling on its thread
    const spinP = L.point(372, -7.5, 8.4), spin = new Bld(); spin.lit = [0.5, 0.6, 0.35];
    spin.add(lathe([[0.05, 0], [0.16, 0.2], [0.16, 2.2], [1.25, 2.3], [1.3, 2.55], [0.2, 2.7], [0.14, 4.4], [0.05, 4.5]], 10), { c: tint(WOOD, 0.2), kind: 1 });
    spin.add(lathe([[0.2, 2.75], [0.75, 3.1], [0.8, 3.7], [0.25, 4.2]], 10), { c: (x, y, z) => mul(WHITE, 0.75 + 0.3 * Math.abs(Math.sin(y * 14 + Math.atan2(z, x)))), kind: 2 });
    spin.add(bar([0, 4.4, 0], [0, vaultH(372, -7.5) - 8.4, 0], 0.05, 0.05, 4), { c: WHITE, kind: 1 }); spin.lit = null;
    const spindle = new THREE.Mesh(spin.build(), matProp); spindle.position.copy(spinP); scene.add(spindle);

    await ctx.yield();
    // ---- sun beams: one additive mesh, skewed by the sun uniform. A room beam is eight sheets (the four walls of its prism
    // and four slices inside it). A bar of sun from a flight hole of the dovecote is far stronger: a ribbon that turns to
    // face the camera, with the brightness profile of a round column of lit dust, plus ten sheets that give it body. ----
    const sunShaft = sunVec(look.az + 0.3 * look.turn, look.el);
    const holeLen = (w) => { const sd = lightDir(w) || sunShaft; let t = 6; for (; t < 96; t += 0.5) { const y = w.c.y - sd.y * t; if (y < FLOOR || Math.hypot(w.c.x - sd.x * t, w.c.z - sd.z * t) > shaftR(y) + 0.8) break; } return (skyMode ? Math.min(t, 44) : t) + 0.6; };
    const beamList = hasSun ? sunWins.map((w) => ({ w, len: skyMode ? 30 : look.el < 15 ? 50 : 40, shaft: false })).concat(hero.holes.map((w) => ({ w, len: holeLen(w), shaft: true }))) : [];
    const sunMax = Math.max(look.sun[0], look.sun[1], look.sun[2], 1e-3), sunHue = new THREE.Color(look.sun[0] / sunMax, look.sun[1] / sunMax, look.sun[2] / sunMax);
    const shK = (look.stars || skyMode ? 0.5 : 1) / Math.max(look.beam, 1e-3), SHEET = 0.05 * shK, RIBBON = 0.46 * shK;      // the bars are as bright in every look
    const BU = { uTime: time, uSun: U.uSun, uSky: U.uSky, uDim: U.uDim, uCol: { value: sunHue.clone().multiplyScalar(look.beam) }, uGlit: { value: 0 } };
    const MU = { uTime: time, uSun: U.uSun, uSky: U.uSky, uDim: U.uDim, uCol: { value: skyMode ? new THREE.Color(0.72, 0.86, 1.0) : sunHue.clone() }, uGlit: { value: 0 }, uPx: { value: 0.003 }, uGain: { value: look.stars ? 0.5 : skyMode ? 1.1 : 0.85 } };
    if (beamList.length) {
      const bp = [], be = [], bt = [], bn = [], bi = [], up = new THREE.Vector3(0, 1, 0);
      for (const { w, len, shaft } of beamList) { await ctx.yield(); const r = new THREE.Vector3(-w.n.z, 0, w.n.x), at = (a, b2) => w.c.clone().addScaledVector(r, a * w.hw).addScaledVector(up, b2 * w.hh), big = w.hw > 2;
        const segs = [[-1, -1, 1, -1, 1], [1, -1, 1, 1, 1], [1, 1, -1, 1, 1], [-1, 1, -1, -1, 1]];
        if (shaft) segs.push([-0.45, -1, -0.45, 1, 0.8], [0, -1, 0, 1, 0.8], [0.45, -1, 0.45, 1, 0.8], [-1, -0.45, 1, -0.45, 0.8], [-1, 0, 1, 0, 0.8], [-1, 0.45, 1, 0.45, 0.8]);
        else if (big) segs.push([-0.36, -1, -0.36, 1, 0.6], [0.36, -1, 0.36, 1, 0.6], [-1, -0.36, 1, -0.36, 0.6], [-1, 0.36, 1, 0.36, 0.6]);
        for (const [a0, b0, a1, b1, gk] of segs) { const A = at(a0, b0), B2 = at(a1, b1), e = B2.clone().sub(A).normalize(), base = bp.length / 3, g = shaft ? 10 + gk * SHEET : gk; for (const [q, t, sd] of [[A, 0, 0], [B2, 0, 1], [B2, 1, 1], [A, 1, 0]]) { bp.push(q.x, q.y, q.z); be.push(e.x, e.y, e.z); bt.push(t, len, sd, g); bn.push(w.n.x, w.n.z); } bi.push(base, base + 1, base + 2, base, base + 2, base + 3); }
        if (shaft) { const NS = 8, base = bp.length / 3;      // the ribbon: aT.w < 0, aE.x = its half width
          for (let i = 0; i <= NS; i++) for (const sd of [0, 1]) { bp.push(w.c.x, w.c.y, w.c.z); be.push((w.hw + w.hh) * 0.52, 0, 0); bt.push(i / NS, len, sd, -RIBBON); bn.push(w.n.x, w.n.z); }
          for (let i = 0; i < NS; i++) { const k = base + i * 2; bi.push(k, k + 1, k + 3, k, k + 3, k + 2); } } }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aE', new THREE.Float32BufferAttribute(be, 3)); bg.setAttribute('aT', new THREE.Float32BufferAttribute(bt, 4)); bg.setAttribute('aN', new THREE.Float32BufferAttribute(bn, 2)); bg.setIndex(bi);
      const beams = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: BU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: `attribute vec3 aE; attribute vec4 aT; attribute vec2 aN; uniform vec3 uSun, uSky; varying vec3 vW, vN; varying float vT, vS, vG;
          void main(){ vec3 sd=mix(uSun, vec3(aN.x*uSky.x, uSky.y, aN.y*uSky.x), uSky.z);      // under a snow sky each window's light falls along its own axis
            vec3 p=position-sd*aT.x*aT.y; vT=aT.x; vS=aT.z; vG=aT.w; vec3 n=cross(aE,sd);
            if(aT.w<0.){ n=cross(sd,cameraPosition-p); n*=inversesqrt(dot(n,n)+1e-4); p+=n*(aT.z*2.-1.)*aE.x; }
            vW=p; vN=n*inversesqrt(dot(n,n)+1e-6); gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
        fragmentShader: `precision highp float; uniform float uTime, uDim, uGlit; uniform vec3 uCol; varying vec3 vW, vN; varying float vT, vS, vG;
          float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
          void main(){ vec3 d=cameraPosition-vW; float dist=length(d), a;
            float n=vn(vW.xz*.3+vW.y*.17+uTime*vec2(.22,.09))*.6+vn(vW.xz*1.3-vW.y*.9+uTime*vec2(-.17,.36))*.4;
            if(vG<0.){ float x=vS*2.-1.;                                             // a bar of sun in the dovecote: a column of lit dust
              a=sqrt(max(1.-x*x,0.))*(1.-.35*vT)*smoothstep(0.,.05,vT)*(.7+.6*n)*smoothstep(6.,46.,dist)*(-vG); }
            else { float shaft=step(5.,vG), gk=vG-10.*shaft, f=abs(dot(normalize(vN),d/max(dist,1e-3)));
              a=mix(pow(max(1.-vT,0.),.9)*smoothstep(0.,.22,vT), (1.-.35*vT)*smoothstep(0.,.05,vT), shaft)*smoothstep(0.,.5,f)*(.4+1.1*n)*smoothstep(1.5,mix(8.,42.,shaft),dist)*pow(max(sin(vS*3.1416),0.),.6)*gk; }
            a*=uDim;
            vec3 gp=vW*1.5+vec3(0.,uTime*2.2,0.), gc=floor(gp), gf=fract(gp)-.5;       // glitter: round sparks where a sheet cuts a falling cell
            a+=uGlit*step(.88,h21(gc.xz+gc.y*17.3+floor(uTime*6.)))*smoothstep(.34,.08,length(gf))*4.*(1.-vT);
            gl_FragColor=vec4(uCol*a,1.); }` }));
      beams.frustumCulled = false; beams.renderOrder = 2; scene.add(beams);
      await ctx.yield();
      // motes hanging in each beam; in the rare event they become the glitter of the slipped snow, pouring down the light
      const mP = [], mC = [], mR = [], mQ = [], mH = [], mI = [], mr = rng.fork('motes'), per = Math.round(110 * detail);
      for (const { w, len } of beamList) { await ctx.yield(); const n = w.hw > 2 ? per : Math.round(per * 0.3);
        for (let i = 0; i < n; i++) { const base = mP.length / 3, a = mr.range(-1, 1), b2 = mr(), t = mr.range(0.04, 0.9) ** 1.3, sd = mr();
          for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { mP.push(x, y, 0); mC.push(w.c.x, w.c.y, w.c.z); mR.push(-w.n.z, 0, w.n.x, w.hw); mQ.push(a, b2, t, sd); mH.push(w.hh, len); }
          mI.push(base, base + 1, base + 2, base, base + 2, base + 3); } }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(mP, 3)); mg.setAttribute('aC', new THREE.Float32BufferAttribute(mC, 3)); mg.setAttribute('aR', new THREE.Float32BufferAttribute(mR, 4));
      mg.setAttribute('aQ', new THREE.Float32BufferAttribute(mQ, 4)); mg.setAttribute('aH', new THREE.Float32BufferAttribute(mH, 2)); mg.setIndex(mI);
      const motes = new THREE.Mesh(mg, new THREE.ShaderMaterial({ uniforms: MU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `attribute vec3 aC; attribute vec4 aR, aQ; attribute vec2 aH; uniform vec3 uSun, uSky; uniform float uTime, uGlit, uPx; varying vec2 vUv; varying float vA, vTw;
          void main(){ float seed=aQ.w, fall=mix(.03,.42,max(uGlit,uSky.z*.35));
            vec3 sd=mix(uSun, vec3(aR.z*uSky.x, uSky.y, -aR.x*uSky.x), uSky.z);
            float b=fract(aQ.y-uTime*fall*(.6+.8*fract(seed*7.3)))*2.-1.;
            float a=aQ.x+.05*sin(uTime*.5+seed*40.), t=aQ.z;
            vec3 c=aC+aR.xyz*(a*aR.w)+vec3(0.,b*aH.x,0.)-sd*(t*aH.y);
            vec4 mv=viewMatrix*vec4(c,1.);
            float tw=.5+.5*sin(uTime*(3.+5.*fract(seed*3.1))+seed*60.);
            float size=mix(.07,.19,fract(seed*5.7))*(1.+1.5*uGlit*tw);
            size=max(size,-mv.z*uPx*1.3);
            mv.xy+=position.xy*size; vUv=position.xy; vTw=tw;
            vA=(1.-b*b*b*b)*(1.-smoothstep(.8,1.,abs(a)))*smoothstep(0.,.06,t)*(1.-t*.55)*smoothstep(2.,7.,-mv.z)*(1.-smoothstep(60.,110.,-mv.z));
            gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `precision highp float; uniform vec3 uCol; uniform float uGlit, uDim, uGain; varying vec2 vUv; varying float vA, vTw;
          void main(){ float d=length(vUv); float a=smoothstep(1.,.25,d)*vA; if(a<.003) discard;
            gl_FragColor=vec4(mix(uCol,vec3(1.),uGlit*.6)*(uGain*(.5+vTw)+uGlit*(1.2+7.*vTw*vTw*vTw))*a*uDim,1.); }` }));
      motes.frustumCulled = false; motes.renderOrder = 4; scene.add(motes);
    }
    await ctx.yield();
    // the last of the slipped snow, veiling the great window in falling sparkle (rare)
    const VU = { uTime: time, uA: { value: 0 } };
    if (rare) { const R = new THREE.Vector3(0, 0, -1), Up = new THREE.Vector3(Math.sin(55 * DEG), Math.cos(55 * DEG), 0), c = PORTAL_POS.clone().addScaledVector(PORTAL_DIR, -6.5), vp = [], vq = [];
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = c.clone().addScaledVector(R, x * 18).addScaledVector(Up, y * 19); vp.push(q.x, q.y, q.z); vq.push(x * 18, y * 19); }
      const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); vg.setAttribute('aP', new THREE.Float32BufferAttribute(vq, 2)); vg.setIndex([0, 1, 2, 0, 2, 3]);
      const vm = new THREE.Mesh(vg, new THREE.ShaderMaterial({ uniforms: VU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: `attribute vec2 aP; varying vec2 vP; void main(){ vP=aP; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.); }`,
        fragmentShader: `precision highp float; uniform float uTime, uA; varying vec2 vP;
          float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
          float spark(vec2 p, float sc, float sp){ vec2 q=vec2(p.x*sc+.3*sin(p.y*.4+uTime), p.y*sc+uTime*sp); vec2 qi=floor(q); float h=h21(qi);
            float d=length(fract(q)-.5-(vec2(h21(qi+3.),h21(qi+7.))-.5)*.6); return smoothstep(.2,.03,d)*step(.55,h)*(.35+.65*sin(uTime*8.+h*90.)*sin(uTime*8.+h*90.)); }
          void main(){ if(uA<.003) discard; vec2 p=vP; float mask=1.-smoothstep(.55,1.,length(p/vec2(17.5,18.5)));
            float sp=spark(p,.8,4.)+spark(p+7.,1.4,6.)*.7+spark(p+19.,.5,3.)*1.2;
            float streak=smoothstep(.5,.95,vn(vec2(p.x*.8,p.y*.12+uTime*1.9)))*(.55+.45*vn(vec2(p.x*5.,p.y*.5+uTime*6.)));
            gl_FragColor=vec4((vec3(1.,.97,.9)*sp*9.+vec3(.75,.86,1.)*streak*1.5)*mask*uA,1.); }` }));
      vm.frustumCulled = false; vm.renderOrder = 5; scene.add(vm); }

    await ctx.yield();
    // ---- steam, smoke, breath and spindrift: one instanced mesh of soft puffs ----
    const puffs = []; const puff = (o, v, s0, s1, period, phase, alpha, duty, c, wob = 0.5) => puffs.push({ o, v, s0, s1, period, phase, alpha, duty, c, wob });
    const WH = [1, 1, 1], f31 = L.frame(39, {});
    for (const n of noses) { const fw = new THREE.Vector3(-f31.nx * 0.93 - f31.tx * 0.36, -0.1, -f31.nz * 0.93 - f31.tz * 0.36); for (let i = 0; i < 8; i++) puff([n.x, n.y - 0.2, n.z], [fw.x * (5.5 + i * 0.7) + prng() - 0.5, fw.y * 5 + 1.4 + prng(), fw.z * (5.5 + i * 0.7) + prng() - 0.5], 0.6, 3.2 + prng(), 2.5, i * 0.014, 0.7, 0.66, [1.5, 1.4, 1.25], 0.3); }
    for (let i = 0; i < 16; i++) puff([samTop.x, samTop.y - 0.6, samTop.z], [1.6 * (prng() - 0.4), 6.5 + 2.5 * prng(), 1.6 * (prng() - 0.5)], 0.5, 3.0 + prng(), 3.6, i / 16, 0.5, 1, hasSun ? [1.9, 1.7, 1.4] : WH, 1.0);
    for (const [dx, dz] of [[2.0, -1.5], [-1.9, 1.7]]) { const p = new THREE.Vector3(dx, 3.8, dz).applyMatrix4(M(TABLE.s, TABLE.l)); for (let i = 0; i < 4; i++) puff([p.x, p.y, p.z], [0.4 * (prng() - 0.5), 2.6, 0.4 * (prng() - 0.5)], 0.25, 1.0, 2.6, i / 4 + dx, 0.35, 1, WH, 0.35); }
    { const p = L.point(BREAD.s, BREAD.l, 6.4); for (let i = 0; i < 6; i++) puff([p.x, p.y, p.z], [prng() - 0.5, 4.5, prng() - 0.5], 0.9, 2.8, 3.6, i / 6, 0.26, 1, WH, 0.7); }
    { const top = vaultH(OVEN.s, OVEN.l) - 2.5, a = L.point(OVEN.s, OVEN.l, 3), bq = L.point(OVEN.s + 4, OVEN.l - 1, top), cq = L.point(OVEN.s + 40, 0, vaultH(OVEN.s + 40, 0) - 2), SM = [0.16, 0.145, 0.14];
      for (let i = 0; i < 12; i++) puff([a.x + 2 * (prng() - 0.5), a.y, a.z + 2 * (prng() - 0.5)], [bq.x - a.x, bq.y - a.y, bq.z - a.z], 1.6, 6.5, 5, i / 12, 0.8, 1, SM, 1.4);
      for (let i = 0; i < 18; i++) puff([bq.x, bq.y, bq.z], [cq.x - bq.x, cq.y - bq.y, cq.z - bq.z], 4.5, 8.5, 11, i / 18, 0.7, 1, SM, 2.5); }
    { const a = hearthAt(0, 6.5, 0), b2 = hearthAt(3.5, 17, 5); for (let i = 0; i < 7; i++) puff([a.x, a.y, a.z], [b2.x - a.x + prng() - 0.5, b2.y - a.y, b2.z - a.z + prng() - 0.5], 0.9, 4.2, 4.5, i / 7, 0.55, 1, [0.2, 0.18, 0.17], 1.0); }
    for (let i = 0; i < 4; i++) puff([brazP.x, brazP.y + 0.4, brazP.z], [0.6 * (prng() - 0.5), 5, 0.6 * (prng() - 0.5)], 0.6, 2.2, 3, i / 4, 0.16, 1, [1, 0.85, 0.7], 0.5);
    if (look.snowy) for (const w of wins) { if ((w.s > 70 && w.s < 310 && !(w.s > 310)) && w.seed > 0.4) continue; for (let i = 0; i < 4; i++) puff([w.m.x + w.t.x * 3 * (prng() - 0.5), w.m.y - 3.4, w.m.z + w.t.z * 3 * (prng() - 0.5)], [-w.n.x * 9 + 2 * (prng() - 0.5), -2.6, -w.n.z * 9 + 2 * (prng() - 0.5)], 0.9, 3.4, 3 + 2 * prng(), prng(), 0.3, 0.8, WH, 0.8); }
    const QU = { uTime: time, uLight: { value: new THREE.Color(look.fill[0] * 0.75 + look.glare[0] * 0.3 + look.sun[0] * 0.05, look.fill[1] * 0.75 + look.glare[1] * 0.3 + look.sun[1] * 0.05, look.fill[2] * 0.75 + look.glare[2] * 0.3 + look.sun[2] * 0.05) }, uFogCol: U.uFogCol, uFogDen: U.uFogDen };
    { const n = puffs.length, aO = new Float32Array(n * 4), aV = new Float32Array(n * 4), aQ = new Float32Array(n * 4), aC = new Float32Array(n * 4), g = new THREE.InstancedBufferGeometry();
      puffs.forEach((p, i) => { aO.set([p.o[0], p.o[1], p.o[2], p.s0], i * 4); aV.set([p.v[0], p.v[1], p.v[2], p.wob], i * 4); aQ.set([p.period, p.phase, p.alpha, p.duty], i * 4); aC.set([p.c[0], p.c[1], p.c[2], p.s1], i * 4); });
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = n;
      for (const [k, arr] of [['aO', aO], ['aV', aV], ['aQ', aQ], ['aC', aC]]) g.setAttribute(k, new THREE.InstancedBufferAttribute(arr, 4));
      const pm = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: QU, transparent: true, depthWrite: false,
        vertexShader: `attribute vec4 aO, aV, aQ, aC; uniform float uTime; varying vec2 vUv; varying vec4 vC; varying float vS;
          void main(){ float cyc=uTime/aQ.x+aQ.y, t=fract(cyc), life=t/aQ.w, on=step(life,1.); life=min(life,1.); float seed=fract(aQ.y*17.31+floor(cyc)*.37);
            vec3 c=aO.xyz+aV.xyz*(life*(1.6-.6*life))+vec3(sin(life*5.+seed*40.),.3*sin(life*3.+seed*11.),cos(life*4.+seed*23.))*aV.w*life;
            vec4 mv=viewMatrix*vec4(c,1.); float size=mix(aO.w,aC.w,life); mv.xy+=position.xy*size;
            vUv=position.xy; vS=seed; vC=vec4(aC.rgb, aQ.z*smoothstep(0.,.14,life)*pow(1.-life,1.4)*on*smoothstep(2.,8.,-mv.z)); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `precision highp float; uniform vec3 uLight, uFogCol; uniform float uFogDen, uTime; varying vec2 vUv; varying vec4 vC; varying float vS;
          float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
          void main(){ float d=length(vUv); float n=vn(vUv*1.8+vS*31.+uTime*.15); float a=smoothstep(1.,.15,d+.35*(n-.5))*vC.a; if(a<.004) discard;
            gl_FragColor=vec4(vC.rgb*uLight*(.8+.3*n), a); }` }));
      pm.frustumCulled = false; pm.renderOrder = 3; scene.add(pm); }

    await ctx.yield();
    // ---- flames and embers (kit), dust, feathers, weather ----
    const fires = []; for (let i = 0; i < 7; i++) { const a = i * 0.898 + 0.3; fires.push({ position: [ovenP.x + Math.cos(a) * 2.9, ovenP.y - 0.45, ovenP.z + Math.sin(a) * 2.9], width: 3.0, height: 3.9 + (i % 3) * 1.0, tongues: 3, embers: Math.round(10 * detail) }); }
    fires.push({ position: [ovenP.x, ovenP.y - 0.45, ovenP.z], width: 3.8, height: 6.0, tongues: 4, embers: Math.round(30 * detail) }, { position: [brazP.x, brazP.y - 0.1, brazP.z], width: 3, height: 1.9, tongues: 5, embers: 10 });
    { const hp = hearthAt(3.75, 0.5, 0); fires.push({ position: [hp.x, hp.y, hp.z], width: 2.1, height: 2.3, tongues: 3, embers: Math.round(6 * detail) }); }
    const flames = INT.makeFlames({ rng: rng.fork('fire'), gain: look.stars ? 0.36 : look.dark ? 0.21 : skyMode ? 0.3 : 0.34, fires });
    await ctx.yield();
    scene.add(flames.object);
    // firelight seen from far off: a soft orange eye over the oven pit (from the far end of the kitchen) and one at the mouth
    // of the bread oven (from the stable door, through the first arch); each is small and steady and fades as you reach it
    for (const [c, r0, r1, k0, k1] of [[new THREE.Vector3(ovenP.x, ovenP.y + 4.2, ovenP.z), 6.5, 8.5, 0.16, 0.75], [hearthAt(4.4, 3.0, 0), 3.6, 10, 0.1, 1.3 * look.hot]]) {
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { uTime: time, uC: { value: c }, uR: { value: new THREE.Vector4(r0, r1, k0, k1) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `uniform vec3 uC; uniform vec4 uR; uniform float uTime; varying vec2 vUv; varying float vK;
          void main(){ vec4 mv=viewMatrix*vec4(uC,1.); float far=smoothstep(22.,85.,-mv.z); mv.z+=6.*far; mv.xy+=position.xy*mix(uR.x,uR.y,far); vUv=position.xy;      // drawn a little nearer, so that the wall behind does not cut the glow
            vK=mix(uR.z,uR.w,far)*(.86+.1*sin(uTime*7.3+uR.x)+.06*sin(uTime*13.1)); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `precision highp float; varying vec2 vUv; varying float vK;
          void main(){ float r=length(vUv*vec2(1.,1.15)), a=max(1.-r,0.); a=a*a*(1.+2.*a); gl_FragColor=vec4(vec3(1.,.42,.1)*a*vK,1.); }` }));
      gm.frustumCulled = false; gm.renderOrder = 4; scene.add(gm); }
    { const n = glows.length, g = new THREE.InstancedBufferGeometry(), aG = new Float32Array(n * 4), aK = new Float32Array(n);
      glows.forEach((q, i) => { aG.set(q.slice(0, 4), i * 4); aK[i] = q[4]; });
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = n;
      g.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK, 1));
      const lm = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: time }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `attribute vec4 aG; attribute float aK; uniform float uTime; varying vec2 vUv; varying float vK;
          void main(){ vec4 mv=viewMatrix*vec4(aG.xyz,1.); float far=smoothstep(10.,60.,-mv.z); mv.z+=1.6; mv.xy+=position.xy*aG.w*mix(1.,1.6,far); vUv=position.xy;
            vK=aK*mix(.6,1.,far)*smoothstep(2.5,8.,-mv.z)*(.88+.08*sin(uTime*6.1+aG.x*3.)+.05*sin(uTime*11.3+aG.z)); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `precision highp float; varying vec2 vUv; varying float vK;
          void main(){ float r=length(vUv), a=max(1.-r,0.); a=a*a*(1.+2.*a); gl_FragColor=vec4(vec3(1.,.5,.16)*a*vK,1.); }` }));
      lm.frustumCulled = false; lm.renderOrder = 4; scene.add(lm); }
    rock.setHot(0, ovenP.x, ovenP.y + 2.5, ovenP.z, 1.3); rock.setHot(1, stoveP.x - L.frame(STOVE.s, {}).nx * 4, stoveP.y, stoveP.z - L.frame(STOVE.s, {}).nz * 4, 0.55); rock.setHot(2, brazP.x, brazP.y + 1.5, brazP.z, 0.55); { const g = hearthAt(5.4, 2.4, 0); rock.setHot(3, g.x, g.y, g.z, 1.0); }
    const set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeParticles({ rng: rng.fork('embers'), preset: 'embers', time, follow: false, center: [ovenP.x, ovenP.y + 10.5, ovenP.z], box: [15, 24, 15], count: Math.round(700 * detail), size: [0.18, 0.44] }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: Math.round(2600 * detail), box: [56, 30, 56], size: [0.06, 0.16], colors: [look.dust, '#ffffff', look.dust], intensity: look.stars ? 0.3 : 0.45 }));
    await ctx.yield();
    const featherCol = look.dark ? ['#f4efe8', '#e8dfd8', '#d8cfd8'] : ['#ffffff', '#f2f4f8', '#e2e8f2'];
    set.add(fx.makeParticles({ rng: rng.fork('feathers'), preset: 'petals', time, follow: false, center: [0, 138, 0], box: [58, 120, 58], count: Math.round(520 * detail * dens), size: [0.35, 0.9], colors: featherCol, velocity: [0.35, -1.5, 0.2], intensity: 1.0 }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('wellf'), preset: 'petals', time, follow: false, center: [0, 36, 0], box: [22, 86, 22], count: Math.round(170 * detail), size: [0.3, 0.75], colors: featherCol, velocity: [0.15, -1.2, 0.1], intensity: 1.0 }));
    await ctx.yield();
    { const mp = L.point(441, 0, 12); set.add(fx.makeParticles({ rng: rng.fork('mouthf'), preset: 'petals', time, follow: false, center: [mp.x, mp.y, mp.z], box: [30, 26, 30], count: Math.round(200 * detail), size: [0.3, 0.7], colors: featherCol, velocity: [0.2, -1.4, 0.15], intensity: 1.0 })); }
    await ctx.yield();
    const veilC = PORTAL_POS.clone().addScaledVector(PORTAL_DIR, -9);
    let veil = null, glitter = null, shaftSnow = null;
    if (look.snowy) veil = set.add(fx.makeParticles({ rng: rng.fork('veil'), preset: 'snow', time, follow: false, center: [veilC.x, veilC.y, veilC.z], box: [34, 30, 34], count: Math.round((rare ? 1500 : 600) * detail), size: [0.12, 0.34], velocity: [2.2, -2.4, 0.8], intensity: look.stars ? 1.2 : 2.2 }));
    await ctx.yield();
    if (look.snowy) set.add(fx.makeParticles({ rng: rng.fork('throat'), preset: 'snow', time, follow: false, center: [0, 146, 0], box: [27, 128, 27], count: Math.round((look.flakes ? 900 : 260) * detail), size: [0.16, 0.42], velocity: [0.25, -3.2, 0.15], intensity: look.stars ? 1.1 : 1.8 }));
    await ctx.yield();
    // snowfall noon (the design: 'flakes drifting in at every window and down the shaft'): the snow is where the house is open to
    // the sky and nowhere else. DOWN THE SHAFT: these flakes stand in the dovecote's own volume, 2 * SHAFT_R across from its floor
    // (FLOOR) to its head (SHAFT_TOP), round the thicker fall down its throat; the kit thins them toward the faces of that
    // volume. They do not go with the eye through the rooms under the rock.
    if (look.flakes) shaftSnow = set.add(fx.makeParticles({ rng: rng.fork('fall'), preset: 'snow', time, follow: false, center: [0, (FLOOR + SHAFT_TOP) / 2, 0], box: [2 * SHAFT_R, SHAFT_TOP - FLOOR, 2 * SHAFT_R], count: Math.round(1500 * detail), size: [0.1, 0.3] }));
    // AT EVERY WINDOW: flakes cross the window's opening at the pane and drift in along the window's own axis at an even pace,
    // for a way between the pane's distance from the embrasure's mouth and one and a half times that: thick at the pane,
    // thinning evenly to nothing, gone within the first metres past the mouth. They sink as they come in, slowly at first,
    // and end at the sill's own level, just inside the mouth; none reaches the middle of a room. One mesh; a flake belongs to
    // one window and is placed by that window's centre, axis, opening and mouth alone, fifty to a window of the plain size
    // and more or fewer by its opening's open area. No flake starts where its pane is not open: the shell pushes the wall
    // and the vault's outer part EMB into the rock round each window (buildShell), and where the room's vault is low or
    // falls along the ramp, part of the pane stands behind rock. (A stream of its own: no draw of the world's is moved.)
    if (look.flakes) {
      await ctx.yield();
      const wr = ctx.core.makeRng(ctx.core.hashSeed('carved6-window-snow:' + ctx.seed)), sP = [], sC = [], sR = [], sQ = [], sI = [];
      // is a point of a window's pane in the open? The shell's own section at the point's own place along the gallery, pushed as
      // buildShell pushes it (the same bells, EMB, wall, vault and the loft's ceiling). x: metres across the window from its
      // centre, along the flakes' own cross axis; y: the height in the world.
      const fq = {}, paneOpen = (w, x, y) => { const px = w.c.x - w.n.z * x, pz = w.c.z + w.n.x * x; let s = w.s;
        for (let i = 0; i < 5; i++) { L.frame(s, fq); s += ((px - fq.x) * fq.tx + (pz - fq.z) * fq.tz) / wallK(s); }
        L.frame(s, fq); const l = (px - fq.x) * fq.nx + (pz - fq.z) * fq.nz, h = y - fq.y, wl = L.wL(s), wR = L.wR(s), cr = L.crown(s), hw = cr * 0.55, bh = benchH(s);
        if (h >= cr || (s > 380 && y > FLOOR + 3 * (1 - sstep(458, 465, s)))) return false;
        const push = (1 - sstep(1, 1.65, Math.abs(s - w.s) * wallK(s) / (2.5 * w.k))) * (1 - sstep(1, 1.6, Math.abs(h - w.h) / (4 * w.k)));
        if (h <= hw) return l < wR - 0.2 - 1.4 * Math.max(0, (h - bh) / (hw - bh)) + EMB * push - 0.1;
        const sa = (h - hw) / (cr - hw), ca = Math.sqrt(1 - sa * sa); return l < (wR - wl) / 2 + ((wR + wl) / 2 - 1.6) * ca + (ca > 0.2 ? EMB * push : 0) - 0.1; };
      // per window, at nine places across the opening: the highest start (as a share of the opening's half height) with 0.4 m of
      // open pane above it; -1 where the pane is shut at every height
      const COLS = 9, openTops = (w) => { const tops = []; for (let j = 0; j < COLS; j++) { const x = (-0.85 + 1.7 * j / (COLS - 1)) * w.hw; let top = -1;
        for (let i = 32; i >= 0 && top < -0.9; i--) { const b = -0.8 + 1.6 * i / 32; if (paneOpen(w, x, w.c.y + b * w.hh + 0.4)) top = b; } tops.push(top); } return tops; };
      for (const w of wins) { const tops = openTops(w), open = tops.reduce((q, t) => q + Math.max(0, t + 0.8), 0) / COLS / 1.6, n = Math.round(50 * detail * w.k * w.k * open), way = w.c.distanceTo(w.m);
        for (let i = 0; i < n; i++) { const a = wr.range(-0.85, 0.85), bq = wr.range(-0.8, 0.8), ph = wr(), sd = wr(), cj = (a + 0.85) / 1.7 * (COLS - 1), bTop = Math.min(tops[Math.floor(cj)], tops[Math.min(COLS - 1, Math.floor(cj) + 1)]);
          if (bTop < -0.75) continue;                                // the pane is shut there: no flake starts in rock
          const base = sP.length / 3, b2 = -0.8 + (bq + 0.8) * (bTop + 0.8) / 1.6;
          for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { sP.push(x, y, 0); sC.push(w.c.x, w.c.y, w.c.z, way); sR.push(w.n.x, w.n.z, w.hw, w.hh); sQ.push(a, b2, ph, sd); }
          sI.push(base, base + 1, base + 2, base, base + 2, base + 3); } }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sP, 3)); sg.setAttribute('aC', new THREE.Float32BufferAttribute(sC, 4));
      sg.setAttribute('aR', new THREE.Float32BufferAttribute(sR, 4)); sg.setAttribute('aQ', new THREE.Float32BufferAttribute(sQ, 4)); sg.setIndex(sI);
      const winSnow = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { uTime: time, uPx: MU.uPx }, transparent: true, depthWrite: false,
        vertexShader: `attribute vec4 aC, aR, aQ; uniform float uTime, uPx; varying vec2 vUv; varying float vA; varying vec3 vCol;
          void main(){ float seed=aQ.w, p=fract(aQ.z+uTime/mix(5.,8.,fract(seed*7.3)));        // one passage from the pane to the end of its way, 5 to 8 s
            vec3 n=vec3(aR.x,0.,aR.y), t=vec3(-aR.y,0.,aR.x);
            vec3 c=aC.xyz+t*(aQ.x*aR.z)+vec3(0.,aQ.y*aR.w,0.)-n*(aC.w*mix(1.,1.5,fract(seed*3.7))*p)       // an even pace along the axis
              +t*((.25+.5*p)*sin(uTime*(.5+.5*fract(seed*5.1))+seed*40.))
              -vec3(0.,(aQ.y+1.)*aR.w*p*(.35+.65*p),0.);                                                      // sinking to the sill's level at the end of its way
            vec4 mv=viewMatrix*vec4(c,1.);
            float s0=mix(.08,.22,fract(seed*5.7)), size=max(s0,-mv.z*uPx*1.3);
            mv.xy+=position.xy*size; vUv=position.xy;
            vCol=mix(vec3(1.),vec3(.835,.894,.969),fract(seed*9.7))*1.1;
            vA=smoothstep(0.,.08,p)*(1.-p)*clamp(s0*s0/(size*size),.3,1.)*smoothstep(2.,6.,-mv.z);
            gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `precision highp float; varying vec2 vUv; varying float vA; varying vec3 vCol;
          void main(){ float a=smoothstep(1.,.3,length(vUv))*vA*.92; if(a<.004) discard; gl_FragColor=vec4(vCol,a); }` }));
      winSnow.frustumCulled = false; winSnow.renderOrder = 4; scene.add(winSnow);
    }
    await ctx.yield();
    if (look.blossom) set.add(fx.makeParticles({ rng: rng.fork('petal'), preset: 'petals', time, count: Math.round(300 * detail * dens), box: [54, 30, 54], size: [0.22, 0.5], colors: ['#ffd0de', '#fff0f4', '#ffb4c8'] }));
    await ctx.yield();
    if (rare) { glitter = set.add(fx.makeParticles({ rng: rng.fork('glit'), preset: 'snow', time, count: Math.round(900 * detail), box: [44, 30, 44], size: [0.1, 0.26], velocity: [0.6, -5.5, 0.4], intensity: 2.4, twinkle: 1 })); glitter.setOpacity(0); }
    await ctx.yield();

    // ---- gaze, post, frame loop ----
    const upShaft = new THREE.Vector3(0, 168, 0), samLook = L.point(TABLE.s + 1.5, TABLE.l + 3.4, 5.6), loomLook = L.point(375, 11, 10), ovenLook = L.point(OVEN.s, OVEN.l, 1.5), carpetLook = L.point(354, 0.5, 2);
    const lookDown = new THREE.Vector3(-0.72 * 17.9, FLOOR + 1, -0.72 * 9.9), topSky = new THREE.Vector3(0, 214, 0);
    const pois = [
      { at: ovenLook, from: 0.1, to: 0.185, weight: 0.55 },                                                      // down into the oven pit
      { at: arches[1].axis, from: 0.212, to: 0.3, weight: 0.6, fade: 0.36 },                                     // left through the storeroom arch into the well
      { at: samLook, from: 0.345, to: 0.428, weight: 0.8 },                                                      // the samovar in its sun square, a window behind
      { at: arches[3].axis, from: 0.445, to: 0.487, weight: 0.5, fade: 0.4 },                                    // the well again from the loom room
      { at: carpetLook, from: 0.478, to: 0.525, weight: 0.42 }, { at: loomLook, from: 0.5, to: 0.55, weight: 0.36 },
      // the shaft, four pictures: up the honeycomb as the flock bursts, the open top and its snow, back down into the lit
      // house, then the great window with the escort round it
      { at: upShaft, from: 0.64, to: 0.75, weight: 0.5 }, { at: PORTAL_POS.clone(), from: 0.69, to: 0.755, weight: 0.4 },
      { at: topSky, from: 0.725, to: 0.83, weight: 0.74 },
      { at: lookDown, from: 0.8, to: 0.905, weight: 0.86 },
      { at: PORTAL_POS.clone(), from: 0.872, to: 0.99, weight: 0.8, fade: 0.25 },
    ];
    const sunT = new THREE.Vector3(), size = new THREE.Vector2();
    const pulse = (x, a, b, c, d) => sstep(a, b, x) * (1 - sstep(c, d, x));
    return {
      scene, path, duration: DUR, title: look.title, ride: 'none',
      // linger in the sitting room and in the shaft, hurry through the links between rooms
      pace: (u) => 1.08 - 0.16 * sstep(0.33, 0.37, u) * (1 - sstep(0.41, 0.45, u)) - 0.36 * sstep(0.66, 0.7, u) * (1 - sstep(0.875, 0.915, u)),
      camera: { fov: 64, near: 0.5, far: 1400, lookAhead: 26, sway: 0.7, bank: 0.34 },
      pois,
      portal: { shape: 'arch', width: 14, height: 16, tilt: true, color: look.stars ? '#9fb8ff' : '#eaf3ff', glow: 0.7, revealDistance: 170 },
      post: { exposure: look.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 1.2 }, grade: { saturation: look.sat + 0.04, contrast: look.con || 1.1, tint: '#fffaf2', shadowTint: '#1c1226', vignette: 0.3, grain: 0.018, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t; hero.update(dt, t, camera, u); PU.uU.value = u;
        U.uSun.value.copy(sunT.lerpVectors(SUN0, SUN1, u).normalize());
        flames.update(dt, t, camera); set.update(dt, t, camera);
        spindle.rotation.y = t * 5.2; spindle.position.x = spinP.x + 0.12 * Math.sin(t * 0.9); spindle.position.z = spinP.z + 0.12 * Math.cos(t * 0.7);
        ctx.renderer.getDrawingBufferSize(size); MU.uPx.value = 2 / (Math.max(0.2, camera.projectionMatrix.elements[5]) * Math.max(1, size.y));
        if (rare) {      // keyed to u: each room's windows pour white as we come through its arch, the room dips, then its beams fill with glitter
          let dim = 0, gl = 0; for (const ru of roomU) { const sec = (u - ru) * DUR; dim = Math.max(dim, pulse(sec, 0.15, 0.6, 1.0, 1.9)); gl = Math.max(gl, pulse(sec, 0.9, 1.5, 2.8, 4.6)); }
          U.uDim.value = 1 - 0.72 * dim; BU.uGlit.value = gl; MU.uGlit.value = gl; glitter.setOpacity(gl * 0.8); VU.uA.value = pulse(u, 0.69, 0.715, 0.9, 0.955);
        }
      },
      dispose() {},
    };
  },
};
