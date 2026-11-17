// THE BRANCHING: hero set piece = "the delta from the ridge" (stage D of the world, engine metres at x0.12).
//
// What it is: a foothill ridge (crest ~180 m over the plain) with a knife spur running north to two
// frost-shattered granite towers, and beyond and below them the coastal plain in crimson and gold with a
// braided river coming apart: one silver trunk, three arms, nine, then about a hundred threads to a lagoon
// with barrier islands. Caribou by the thousand creep along the gravel bars in forking files with long
// shadows, snow-goose skeins peel off the bars and rise toward the spur, cloud shreds pour through the
// spur's notch and banner off the towers, cloud shadows slide east, channels kindle in turn.
//
// Frame: local space, +Y up. NORTH IS -Z (the camera flies toward -Z), west / the sun is -X.
// Origin = the plain directly under the gate (the notch between the towers). The piece is seen from +Z.
//   towers at z = 0, x = -/+23.4 (sheaves of jointed pillars, 45 m and 36 m; per seed they may swap), the 26 m ring between them
//   spur crest runs from the main crest (z = +300) to the gate (z = 0); deep notch at z = 85..175
//   main ridge crest along z = +300, x = -1300..1300; river gorge cut through it near x = -340
//   delta: root at about (-84, 0, -200) just past the spur's toe, fan to the lagoon shore at z = -1800, 1900 m wide
//
// opts: palette (7 hex strings, brief order), hour 'evening' | 'dawn' | 'overcast' | 'night',
//       season 'peak' | 'august' | 'late', density 0..1 (herd 5,000..8,000 -> here 4,200..6,000 quads),
//       rareEvent (bool, default rng 1 in 8), sunDir ([x,y,z] toward the sun, world space), graphSeed.
// returns the contract plus:
//   radius 420 / height 210 are FRAMING values for the viewer; true bounds are in `extent`.
//   setProgress(u)  world progress 0..1: drives the keyed skeins and the rare event (all geese lift in a travelling
//                   wave and the herd runs); ambient motion runs on `time`. setFinale(uCrest) tells the hero at
//                   which progress the camera clears the crest: skeins and event are timed on the share of the
//                   finale flown from there (0..1). setEvent(v0, v1) sets the rare event's window in that share.
//   uniforms        the shared uniform objects (uSunL, uSunCol, uSkyCol, uCloud, uPal ...) so other stages
//                   can share one sun, sky fill and cloud shadow; GLSL for it is exported as BRANCH_GLSL.
//   graph           the fork graph (nodes: x0,y0,x,y,order,parent,w in lichen space, root at 0,0 growing +y)
//                   so the hero lichen can be lofted from the very same graph; branchGraph() is exported.
//   heightAt(x,z)   ridge height in local metres (<= 0 on the plain).
//   uniforms.uHole  (x, z, half x, half z): a rectangle of the ridge left undrawn (the world lays its bench there).
//   uniforms.uFadeD 0..1: ridge and plain dissolve in by dither (1 = solid).
//   setNear(u)      the progress at which the near herd (the modelled caribou by the fork, which walk on the flight's
//                   own clock, not on `time`) stands where it was placed.
//   uniforms.uGap   (x, z, radius): a hole in the cloud deck that stands over the bar by the fork.
//   setReveal(u0, du)  progress at which the skein that crosses the mouth of the saddle starts, and how long it takes.
//   channels        the delta's channel polylines ({ pts: [[x, z]...], w, order, node }).
// anchors (local space):
//   portalSeat { position, facing, direction, radius }  centre of the ring in the gate (radius 13 m). The gate is entered FROM THE
//              NORTH, climbing: facing = back down the path (-Z, 14 degrees down), direction = travel (south, up)
//   flyThrough [Vector3...]  from 24 m short of the crest, over the saddle (about 30 m up, so the plain opens as the
//              crest is cleared) -> down the sunlit west flank of the spur with the delta ahead -> low (13 m) along
//              the trunk's east side to the gravel bar east of the first fork, where a file of caribou wades out
//              of the river across our line -> a left turn into the low sun over the two arms -> back east-south-
//              east across the root of the delta, and round a 120 m arc onto the gate's own axis, climbing
//   flyKeys    arc-length-free marks along that line (indices into flyThrough): root, fork (the bar), turn, climb;
//              also bar [x, z], forkAt [x, z], trunk (the trunk's centre line)
//   saddle, notch, reveal (the point where the delta first shows), deltaRoot, deltaCentre, towerTops[2],
//   gorgeMouth, sunDir
// Cost: about 190k triangles, 8 draw calls, one 2048 canvas texture and one 256x128 shadow texture.
// Lighting: self-lit ShaderMaterials (no scene lights needed or used): low cream key from the west-north-west
// (9 degrees up, 72 degrees left of north, so the north side of the gate, the side we come at, is lit), slate sky fill, baked terrain shadow, moving cloud shadow, scene fog plus its own
// thin gold haze. Wants a sky with the bright apricot band in the west and slate cloud to the east.
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const PALETTE = ['#DDE3D2', '#A81F2B', '#D8922A', '#6B3A2E', '#C7D5DF', '#3A4350', '#F4DDB8'];
const MAP = { x0: -1150, x1: 1150, z0: -1950, z1: 450, res: 2048 };       // channel map domain
const SHD = { x0: -1300, x1: 1300, z0: -700, z1: 560, w: 256, h: 128 }; // baked terrain shadow domain
const NSH = { x0: -216, x1: 216, z0: -250, z1: 14, w: 288, h: 176 };     // and a fine one round the north nose
const SHORE = -1800, ROOT = [-84, -200], CREST_Z = 300, BAND = 8.5;   // BAND: height of one rock bed (ledge + riser)
const NOSE_Z = -36, NOSE_R = 50;      // the lip of the north nose, and how many metres of spur a radian round it stands for
const RING = 13, TX = 23.4;            // the portal ring's radius; the towers stand this far either side of it

// ---- shared GLSL: noise, cloud shadow, mirrored sky, tundra colour. Everything is in hero-local space.
export const BRANCH_GLSL = /* glsl */`
uniform float uTime; uniform vec3 uSunL; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uHorizCol;
uniform vec3 uCamL; uniform vec4 uCloud; uniform vec3 uPal[7]; uniform vec3 uHazeCol; uniform float uHaze;
uniform float uSnow; uniform float uGreen; uniform float uAurora; uniform float uMist; uniform vec3 uGap;
float h21(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+vec2(17.1,9.7); a*=.5; } return s; }
// 1 = in sun, 0 = under cloud. uCloud = (drift x, drift z, scale, coverage); uGap = a hole in the deck that stands
// over one place (x, z, radius; no hole while the radius is 0)
float cloudShadow(vec2 xz){ vec2 q=(xz-uTime*uCloud.xy)*uCloud.z;
  float c=fbm(q)+.22*vn(q*3.3+4.), g=uGap.z>0.?1.-smoothstep(uGap.z*.45,uGap.z,length(xz-uGap.xy)):0.;
  return mix(smoothstep(uCloud.w-.065,uCloud.w+.075,c),1.,g); }
// the sky as wet things mirror it: bright band toward the sun, washed blue above, slate deck away from it
vec3 skyMirror(vec3 d){
  float up=clamp(d.y,0.,1.);
  vec2 h=d.xz/max(length(d.xz),1e-4), s=uSunL.xz/max(length(uSunL.xz),1e-4);
  float west=dot(h,s)*.5+.5;
  vec3 hor=mix(uSkyCol*2.1,uHorizCol,west*west*.7+.3);
  vec3 c=mix(hor,uSkyCol*1.5+vec3(.04,.09,.2)*(1.-uAurora),smoothstep(0.,.6,up));
  float deck=fbm(d.xz/(up+.25)*1.4+uTime*.004);
  c=mix(c,uSkyCol*.85,smoothstep(.45,.7,deck)*smoothstep(.06,.3,up)*(1.-west*.6));
  float au=vn(vec2(d.x/(up+.3)*3.+uTime*.05,d.z*2.))*smoothstep(.1,.5,up);
  return c+uAurora*vec3(.12,1.4,.55)*au*au;
}
// autumn tundra as colour only: crimson bearberry, gold willow, russet cottongrass, pale lichen heath
// fw = the size of a pixel in the units of p: the fine grain fades to its mean where it would alias
vec3 tundraCol(vec2 p,float fw){
  float n1=fbm(p*.0045), n2=fbm(p*.014+7.3), n3=fbm(p*.07+2.1), n4=mix(.5,vn(p*.45),clamp(1.3-fw*1.2,0.,1.));
  vec3 crim=uPal[1]*.5, gold=uPal[2]*.5, rus=uPal[3]*.55, pale=uPal[0]*.46;
  vec3 t=mix(crim,rus,smoothstep(.38,.7,n2));
  t=mix(t,crim*1.25,smoothstep(.5,.75,n3)*.6);
  t=mix(t,uPal[3]*.28+crim*.25,smoothstep(.45,.7,vn(p*.021+5.))*.55);
  t=mix(t,gold,smoothstep(.6,.76,n1*.7+n3*.45)*.7);
  t=mix(t,pale,smoothstep(.6,.78,fbm(p*.009+31.)+n3*.15)*.7);
  t*=.82+.36*n4;
  return mix(t,vec3(.16,.26,.1)+t*.35,uGreen*(.5+.4*n2));
}
`;

export const FOG_V = 'varying float vDepth;\n#include <fog_pars_vertex>';
export const FOG_F = 'varying float vDepth;\n#include <common>\n#include <fog_pars_fragment>';
// haze and scene fog, applied at the end of every fragment shader (needs vDepth from the vertex shader)
export const FINISH = /* glsl */`
  col=mix(col,uHazeCol,(1.-exp(-max(vDepth,0.)*uHaze))*.85);
  gl_FragColor=vec4(col,alpha);
  #include <fog_fragment>
`;

// ---- the one generator: a fork graph in "lichen space" (root at 0,0, growing +y). Orders 0..n:
// 1 trunk, 3 arms, 9 boughs, then twos to fours. Used here for the delta; loft it for the lichen.
export function branchGraph(rng, { orders = 4, ratio = 0.74, angle = 0.44, jitter = 0.25 } = {}) {
  const nodes = [];
  const grow = (x, y, a, len, order, parent, w) => {
    const id = nodes.length, nx = x + Math.sin(a) * len, ny = y + Math.cos(a) * len;
    nodes.push({ id, x0: x, y0: y, x: nx, y: ny, a, len, order, parent, w, kids: [] });
    if (parent >= 0) nodes[parent].kids.push(id);
    if (order >= orders) return;
    const n = order < 2 ? 3 : rng.int(2, order === 2 ? 4 : 3);
    const spread = angle * Math.pow(0.66, order);
    for (let k = 0; k < n; k++) {
      const t = n === 1 ? 0 : (k / (n - 1) - 0.5) * 2;
      const ca = a * 0.82 + t * spread + rng.gauss() * jitter * spread * 0.35;
      grow(nx, ny, ca, len * ratio * (1 + rng.range(-jitter, jitter)), order + 1, id, w * 0.62);
    }
  };
  grow(0, 0, rng.range(-0.06, 0.06), 1, 0, -1, 1);
  return nodes;
}

// ---- lay the graph on the plain as channel polylines (meandering, with anabranches that rejoin)
function layoutDelta(graph, rng, noise, gorgeX) {
  let maxY = 0, maxX = 0;
  for (const n of graph) { maxY = Math.max(maxY, n.y); maxX = Math.max(maxX, Math.abs(n.x)); }
  const sz = (ROOT[1] - SHORE) / maxY, sx = clamp(940 / Math.max(maxX, 1e-3), sz / 3, sz * 3);
  const W = [46, 29, 19, 12, 8], L = ROOT[1] - SHORE, fz = (y) => ROOT[1] - L * Math.pow(Math.max(y, 0) / maxY, 2.0);
  const chans = [], byNode = [];
  const add = (pts, w, order, node) => { const c = { pts, w, order, node, phase: rng() }; chans.push(c); return c; };
  // upstream course: out of the gorge, round the spur's foot, to the root
  const up = new THREE.CatmullRomCurve3([[gorgeX + 12, 450], [gorgeX - 10, 310], [gorgeX + 8, 170], [gorgeX - 4, 30],
    [gorgeX + 46, -72], [gorgeX * 0.73, -126], [gorgeX * 0.52, -158], [ROOT[0] - 42, ROOT[1] + 13], [ROOT[0], ROOT[1]]]
    .map((p) => new THREE.Vector3(p[0], 0, p[1]))).getPoints(48).map((v) => [v.x, v.z]);
  const upC = add(up, 40, 0, -1);
  for (const n of graph) {
    const ax = ROOT[0] + n.x0 * sx, az = fz(n.y0); let bx = ROOT[0] + n.x * sx, bz = fz(n.y);
    const tip = n.kids.length === 0;
    if (tip && bz > SHORE - 30) { const k = (SHORE - 30 - az) / Math.min(bz - az, -1); bx = ax + (bx - ax) * k; bz = SHORE - 30; }
    const len = Math.hypot(bx - ax, bz - az), m = Math.max(4, Math.ceil(len / 20));
    const px = -(bz - az) / len, pz = (bx - ax) / len, amp = Math.min(len * 0.075, 34), pts = [];
    for (let i = 0; i <= m; i++) {
      const t = i / m, o = amp * Math.sin(Math.PI * t) * noise.n2(n.id * 7.31 + t * 2.6, 4.4 + n.id);
      pts.push([ax + (bx - ax) * t + px * o, az + (bz - az) * t + pz * o]);
    }
    byNode[n.id] = add(pts, W[Math.min(n.order, 4)] * (0.85 + 0.3 * rng()), n.order, n.id);
  }
  // anabranches: leave a channel, swing out round a bar and rejoin
  const mains = chans.slice();
  for (const c of mains) {
    const nb = c.order === 0 ? 3 : c.order < 3 ? 2 : rng.chance(0.6) ? 1 : 0;
    for (let b = 0; b < nb; b++) {
      const t0 = rng.range(0.04, 0.55), t1 = Math.min(0.98, t0 + rng.range(0.22, 0.42)), side = rng.sign();
      const off = c.w * 1.5 + 7 + rng() * 11, n = c.pts.length - 1, i0 = Math.floor(t0 * n), i1 = Math.ceil(t1 * n), pts = [];
      if (i1 - i0 < 3) continue;
      for (let i = i0; i <= i1; i++) {
        const a = c.pts[Math.max(0, i - 1)], d = c.pts[Math.min(n, i + 1)], p = c.pts[i];
        const l = Math.hypot(d[0] - a[0], d[1] - a[1]) || 1, s = (i - i0) / (i1 - i0);
        const o = side * off * Math.pow(Math.sin(Math.PI * s), 0.8) * (1 + 0.3 * noise.n2(i * 0.4, c.phase * 40));
        pts.push([p[0] - (d[1] - a[1]) / l * o, p[1] + (d[0] - a[0]) / l * o]);
      }
      add(pts, c.w * rng.range(0.42, 0.68), c.order + 0.5, -2);
    }
  }
  // a creek off the main ridge east of the spur: it runs north over the plain past the foot of the bastion and joins the
  // delta's eastern arm (from the climb to the gate it is the silver thread on the crimson plain, left of the rock)
  {
    const arms = graph[0].kids.map((id) => byNode[id]).filter(Boolean);
    if (arms.length) {
      let ea = arms[0]; for (const a of arms) if (a.pts[a.pts.length - 1][0] > ea.pts[ea.pts.length - 1][0]) ea = a;
      let jn = ea.pts[ea.pts.length - 1]; for (const q of ea.pts) if (q[1] < -455) { jn = q; break; }
      const cp = [[222, 122], [217, 72], [225, 22], [205, -40], [187, -112], [153, -188], [117, -262], [99, -340], [lerp(99, jn[0], 0.55), lerp(-340, jn[1], 0.55)], [jn[0], jn[1]]];
      const pts = new THREE.CatmullRomCurve3(cp.map((q) => new THREE.Vector3(q[0], 0, q[1]))).getPoints(46).map((v) => [v.x, v.z]);
      add(pts, 15, 1.5, -2).creek = true;
    }
  }
  return { chans, byNode, upC, sx, sz };
}

// ---- channel map: R = water (soft-edged), G = gravel bar, B = per-channel "kindle" phase
// The canvas is kept in the page's own memory (willReadFrequently) and painted there a few channels at a time. Left to
// the browser it is painted by the graphics process, where each of the ~2,400 'lighten' strokes needs its own copy of
// what is under it: no script time at all, but many seconds during which that process draws nothing else, neither the
// world on screen nor this world's first use. The strokes and their order are the same either way.
function drawMap(chans) {
  const cv = document.createElement('canvas'); cv.width = cv.height = MAP.res;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000'; g.fillRect(0, 0, MAP.res, MAP.res);
  g.setTransform(MAP.res / (MAP.x1 - MAP.x0), 0, 0, MAP.res / (MAP.z1 - MAP.z0), -MAP.x0 * MAP.res / (MAP.x1 - MAP.x0), -MAP.z0 * MAP.res / (MAP.z1 - MAP.z0));
  g.globalCompositeOperation = 'lighten'; g.lineJoin = 'round'; g.lineCap = 'round';
  // browsers only record canvas calls and paint them at the next read-back: one pixel is read at the end of each
  // step, so that each step pays for its own strokes (a read-back never changes what is drawn)
  // (a step is cut by what its strokes cost to paint, which is their area on the canvas: a wide stroke along the trunk
  // or an arm is a step of its own, the hair-fine threads go up to six to a step. The strokes and their order are
  // unchanged, so the map is the same map)
  // (round 10: a step is half what it was. No more than three strokes and 14,000 px of canvas to a step, and a stroke
  // that is more than that by itself, the trunk under its widest halo, is drawn as two or three lengths of the same
  // line that share a point: under round caps and one colour that is the same paint. The nine green passes, the
  // halos, go down as plain paint and not as 'lighten': each is brighter than the one before, red and blue are still
  // black under them, so plain paint leaves the same pixels, and it is several times cheaper to lay)
  const steps = [], CH = 3, AREA = 14000, kpx = MAP.res / (MAP.x1 - MAP.x0);
  steps.push(() => { g.getImageData(0, 0, 1, 1); });            // (the black ground is laid in a step of its own)
  const lens = chans.map((c) => { let l = 0; for (let i = 1; i < c.pts.length; i++) l += Math.hypot(c.pts[i][0] - c.pts[i - 1][0], c.pts[i][1] - c.pts[i - 1][1]); return l * kpx; });
  const pass = (wf, style, op) => {
    const pcs = [];                                              // [channel, first point, last point, area on the canvas]
    for (let j = 0; j < chans.length; j++) {
      const w = wf(chans[j]) * kpx, area = (lens[j] + w) * w, np = chans[j].pts.length - 1, n = Math.max(1, Math.min(np, Math.ceil(area / AREA), Math.floor(lens[j] / (1.5 * w))));
      for (let q = 0; q < n; q++) pcs.push([j, Math.round((q * np) / n), Math.round(((q + 1) * np) / n), (lens[j] / n + w) * w]);
    }
    for (let a = 0; a < pcs.length;) {
      let b = a, area = 0;
      do { area += pcs[b][3]; b++; } while (b < pcs.length && b - a < CH && area + pcs[b][3] < AREA);
      const a0 = a, b0 = b; a = b;
      steps.push(() => {
        g.globalCompositeOperation = op;
        for (let j = a0; j < b0; j++) {
          const c = chans[pcs[j][0]], i1 = pcs[j][2];
          g.beginPath(); g.moveTo(c.pts[pcs[j][1]][0], c.pts[pcs[j][1]][1]);
          for (let i = pcs[j][1] + 1; i <= i1; i++) g.lineTo(c.pts[i][0], c.pts[i][1]);
          g.lineWidth = wf(c); g.strokeStyle = style(c); g.stroke();
        }
        g.getImageData(0, 0, 1, 1);
      });
    }
  };
  for (let k = 1; k <= 9; k++) { const e = lerp(40, 3, (k - 1) / 8), v = Math.round(255 * k / 9); pass((c) => c.w * 2.1 + e * (0.4 + c.w / 42), () => `rgb(0,${v},0)`, 'source-over'); }
  pass((c) => c.w + 7, (c) => `rgb(0,0,${Math.round(20 + c.phase * 235)})`, 'lighten');
  [[5.5, 64], [3.2, 128], [1.4, 191], [0, 255]].forEach(([e, v]) => pass((c) => c.w + e, () => `rgb(${v},0,0)`, 'lighten'));
  return { cv, steps };
}

// ---- ridge, spur and gorge as one height function (local metres; <= 0 means "plain")
function makeHeight(noise, P) {
  const spurX = (z) => (7 * Math.sin(z * 0.021 + P.ph) + 4 * Math.sin(z * 0.053 + P.ph * 2.3)) * smoothstep(20, 90, z);
  const gorgeXf = (z) => P.gorgeX + 14 * Math.sin(z * 0.012 + P.ph) + (z < 30 ? (30 - z) * 0.25 : 0);
  const spurH = (z) => {
    let h = lerp(147, 172, smoothstep(30, 300, z));
    const nb = smoothstep(78, 118, z) * (1 - smoothstep(140, 184, z));
    h -= P.notch * nb;
    h += (5 * noise.n2(z * 0.03, 3.1) + 2.5 * noise.n2(z * 0.11, 9.3)) * smoothstep(55, 100, z);
    // north of the gate the crest steps down a little to the lip of the nose (z = NOSE_Z); the nose itself, a bastion of
    // buttresses and gullies standing over its own talus, is shaped in H round that lip
    // (in three rock steps, not a ramp)
    if (z < -10) { const d = Math.min(-10 - z, -10 - NOSE_Z); h -= 4.4 * (smoothstep(4.2, 5.6, d) + smoothstep(12.4, 13.8, d) + smoothstep(20.6, 22, d)) + 1.6 * noise.n2(z * 0.16, 1.5) * smoothstep(-12, -30, z); }
    if (z > 318) h -= 44 * Math.pow(smoothstep(318, 362, z), 1.25);      // the south end: a nose that runs down into the slope
    return h;
  };
  let lastG = 0;                              // how deep in a gully the last point asked for lies (0..1), for the mesh's baked shade
  // one flank of the spur: d = metres out from the crest line, za = the place along the spur, sd = -1 west, +1 east.
  // A wall under the crest, a talus apron under the wall, and buttresses and gullies running down the fall line
  // (ridged noise along the spur, drifting with distance from the crest). Returns what the flank adds to the crest's
  // height; flG is how deep in a gully the point lies.
  let flG = 0;
  const flank = (d, za, sd) => {
    const zz = za * 0.019 + sd * 7.7;
    const but = noise.ridged2(zz + 0.0022 * d, d * 0.0031 + 2.2 + sd, 3);        // high on the buttress crests
    const gul = noise.n2(za * 0.052 + sd * 3.1, d * 0.011);
    const dc = 30 + 15 * noise.n2(za * 0.013 + sd * 9, 4.4);                     // where the wall gives way to the apron
    const near = 1 - smoothstep(60, 130, za);                                    // the west wall under the gate is the steepest
    const wall = sd < 0 ? lerp(1.22, 1.62, near) : 1.1, apron = 0.64;
    const t = smoothstep(dc - 10, dc + 14, d), drop = lerp(d * wall, dc * wall + (d - dc) * apron, t);
    const fl = smoothstep(3, 34, d) * (1 - 0.55 * smoothstep(dc + 25, dc + 110, d));
    // flutes: narrow ribs down the walls, a dozen metres apart, dying out on the apron
    const flu = noise.ridged2(za * 0.075 + sd * 3.3 + 0.004 * d, d * 0.012 + 5, 2);
    const fl2 = smoothstep(5, 24, d) * (1 - smoothstep(dc + 8, dc + 55, d));
    // gullies: V-cut couloirs about thirty metres apart that wander down the fall line and split the wall into
    // buttresses; where each leaves the wall it has dropped a cone of talus on the apron. On the west flank, which the
    // camera comes down a stone's throw from, they are broad open couloirs (a narrow slot there is a black comb)
    const open = sd < 0 ? smoothstep(-20, 30, za) * (1 - smoothstep(236, 290, za)) : 0;
    const GS = 46, zc = za + 7 * noise.n2(d * 0.021 + sd * 2, za * 0.012 + 3.3) + 0.12 * d * (sd < 0 ? 1 : -0.6), cell = zc / GS, ci = Math.floor(cell);
    let gdist = 1e9, gk = 0;
    for (let q = ci - 1; q <= ci + 1; q++) {
      const hq = Math.abs(Math.sin(q * 127.1 + sd * 311.7 + P.ph) * 43758.5453) % 1, dq = Math.abs(cell - (q + 0.4 + 0.2 * hq)) * GS;
      if (dq < gdist) { gdist = dq; gk = 0.8 + 0.5 * ((hq * 7.13) % 1); }
    }
    const gw = (10.5 + 0.06 * d) * (0.8 + 0.4 * gk) * (1 + 0.6 * open), gcut = Math.exp(-(gdist * gdist) / (gw * gw));
    const genv = smoothstep(9, 32, d) * (1 - smoothstep(dc + 4, dc + 34, d)) * (1 - smoothstep(306, 326, za)), cone = smoothstep(dc - 4, dc + 22, d) * (1 - smoothstep(dc + 30, dc + 95, d));
    flG = Math.min(1, gk * gcut * genv);
    // ribs: by the gate (and all down the east side, which is only ever seen from the gate's own approach) the flank
    // is ribbed down the fall line, a rib and a V-cut gully every twenty metres from the wall to the foot of the apron:
    // seen along the spur they stand one behind the other, each with a lit side and a gully in shade. (Not on the west
    // flank south of the gate, which the flight comes down a stone's throw above: narrow cuts there are a comb.)
    const wR = sd > 0 ? 1 : 1 - smoothstep(40, 95, za);
    let rib = 0;
    if (wR > 0) {
      const zr = (za + 6 * noise.n2(d * 0.024 + sd * 5.3, za * 0.016 + 1.7) + 0.16 * d * (sd < 0 ? 1 : -0.6)) / (sd > 0 ? 27 : 21) + sd * 0.31;
      const rr = tri1(zr), r2 = tri1(zr * 2.37 + 0.4);
      const renv = smoothstep(5, 24, d) * (1 - 0.75 * smoothstep(dc + 40, dc + 140, d)) * wR;
      rib = ((rr - 0.55) * (sd > 0 ? 15 : 11.5) + (r2 - 0.5) * 2.4) * renv;
      flG = Math.max(flG, Math.min(1, 1.2 * (1 - rr) * (1 - rr)) * renv * 0.8);
    }
    return -drop - 1.6 * Math.sqrt(d) + ((but - 0.4) * 40 + gul * 6.5) * fl + (flu - 0.5) * lerp(10, 5, open) * fl2
      - lerp(27, 15, open) * gk * gcut * genv + 7.5 * gk * Math.exp(-(gdist * gdist) / (gw * gw * 5)) * cone + rib;
  };
  // ---- the north nose: a bastion of three stepped buttresses. Each is a blade of rock that runs out from the lip on
  // its own bearing (0 = north, + = east): its crest goes down in tiers (a level shoulder, then a cliff), its two walls
  // fall in five or six unequal tiers with plain faces (round 10: no pleats; a wall is broken only by the two or three
  // couloirs cut back into it, by one chimney and by facets tens of metres wide). Between the blades the walls meet in V-cut
  // couloirs, and at the foot of each couloir a cone of talus fans out over the plain. Everything is joined by max(),
  // so every junction is a crease: an arete, a couloir line, the foot of a wall on its fan.
  const hj = (k) => Math.abs(Math.sin(k * 91.7 + P.ph * 3.1) * 43758.5453) % 1;
  const TOPN = 134, RA = 76, HA = 17;
  // Each buttress is broad (hw = half the width of its top, at the lip and at its toe). sw is the level of the top of its
  // walls, [metres out from the lip, height]: benches that slope a little, parted by two or three big risers, so that a
  // wall is two or three broad buttresses with plain faces, no two alike. cut are the couloirs, [where along the wall,
  // how far back, half the width]: one stands at each big riser and is cut back into the wall from its top to its foot,
  // through every tier. (Stepped every six metres, with every riser pleated on one wavelength, the walls were combs of
  // equal ribs: a stack of pleated skirts.)
  const NBUT = [
    { b: -1.0 + 0.1 * (hj(1) - 0.5), k: 0.94 + 0.1 * hj(2), hw: [13, 8], sw: [[-20, 134], [0, 134], [6, 119], [24, 114], [30, 86], [46, 80], [52, 58], [60, 55], [66, 34], [86, 24], [97, -8]], cut: [[27, 10, 6.5], [49, 6, 5], [63, 9, 6]] },
    // (the middle one is the stair under the gate, see stairTop: its profile is what the crest drops BELOW the stair)
    { b: 0, k: 1, stair: 1, hw: [11.5, 8], sw: [[-20, 0], [40, 0], [46, 27], [70, 31], [76, 64], [92, 68], [98, 100], [112, 105], [117, 118]], cut: [[5, 9, 6], [43, 10, 6.5], [73, 8, 6], [95, 5, 5]] },
    { b: 0.52 + 0.1 * (hj(5) - 0.5), k: 0.92 + 0.12 * hj(6), hw: [10.5, 6.5], sw: [[-20, 134], [0, 134], [10, 128], [28, 122], [34, 92], [54, 84], [60, 60], [70, 56], [75, 38], [92, 26], [102, -8]], cut: [[31, 9, 6], [57, 10, 6.5], [72.5, 6, 5]] },
    // (and a lower fourth one round to the east, so the east face is not one even slope)
    { b: 1.14 + 0.08 * (hj(7) - 0.5), k: 0.9 + 0.1 * hj(8), hw: [6, 4], sw: [[-20, 134], [0, 134], [5, 124], [20, 116], [25, 92], [44, 84], [49, 58], [58, 54], [62, 40], [77, 26], [87, -8]], cut: [[22.5, 8, 5.5], [46.5, 9, 6], [60, 5, 4.5]] },
  ];
  // What does not depend on the vertex is tabulated once (half a metre to the entry, read with a lerp):
  // cw, along a buttress: the level of its walls' top (sw). cc: the level of its crest, which goes down each bench of sw
  // in two or three steps of its own, of unequal length (blocks standing on the buttress, never lower than its walls).
  // ft, across a buttress: its risers are not ruled lines but two to four broad facets of unequal width, some standing
  // a metre proud of the others, and a chimney cut back into them: the same in every riser, so the chimney runs down
  // the end of the buttress through all its tiers as one shadowed couloir.
  // WALL, along each of its two walls: the wall is a stair of its own, five or six risers of unequal height with
  // treads of unequal depth between them (f = where each riser stands, wandering along the wall so that a tread
  // pinches and swells; r = its height; e = half its run; s, l = the talus banked against its foot; c = the couloirs).
  const TN = 301, FN = 321, WALL = [];
  NBUT.forEach((B, i) => {
    const sw = B.sw, swAt = (v) => { let j = 1; while (j < sw.length - 1 && v > sw[j][0]) j++; const a = sw[j - 1], b = sw[j]; return lerp(a[1], b[1], clamp((v - a[0]) / (b[0] - a[0]), 0, 1)); };
    const bnd = [];
    for (let j = 0; j < sw.length - 1; j++) {
      const a = sw[j], b = sw[j + 1], len = b[0] - a[0], bench = Math.abs(b[1] - a[1]) < 1.1 * len && a[0] >= 0 && j < sw.length - 2;
      bnd.push([a[0], bench]);
      if (bench) for (let x = a[0] + 4.5 + 6 * hj(400 + i * 31 + j), m = 0; x < b[0] - 3.5; m++) { bnd.push([x, true]); x += 4.5 + 7 * hj(420 + i * 31 + j * 5 + m); }
    }
    bnd.push([sw[sw.length - 1][0], false]);
    B.cw = new Float32Array(TN); B.cc = new Float32Array(TN);
    for (let q = 0; q < TN; q++) {
      const v = -20 + q * 0.5; B.cw[q] = swAt(v);
      let j = 0; while (j < bnd.length - 2 && v >= bnd[j + 1][0]) j++;
      B.cc[q] = bnd[j][1] ? lerp(swAt(bnd[j][0]), swAt(bnd[j + 1][0]), smoothstep(bnd[j + 1][0] - 1.3, bnd[j + 1][0], v)) : swAt(v);
    }
    const ft = B.ft = new Float32Array(FN), brk = [];
    for (let x = -80 + 14 * hj(100 + i * 13), j = 0; x < 80; j++) { brk.push([x, (hj(110 + i * 13 + j) - 0.5) * 2.6]); x += 11 + 19 * hj(140 + i * 13 + j); }
    // [where across the buttress, how far back it is cut, half its width]
    const chim = [[(hj(194 + i) > 0.5 ? 1 : -1) * ((B.stair ? 7.5 : 4) + 5 * hj(170 + i)), 9 + 4 * hj(174 + i), 4.5 + 2 * hj(178 + i)]];
    for (let q = 0; q < FN; q++) {
      const t = -80 + q * 0.5; let v = brk[0][1];
      for (let j = 1; j < brk.length; j++) v += (brk[j][1] - brk[j - 1][1]) * smoothstep(brk[j][0] - 0.7, brk[j][0] + 0.7, t);
      for (const c of chim) v += c[1] * Math.max(0, 1 - Math.abs(t - c[0]) / c[2]);
      ft[q] = v;
    }
    for (let sd = 0; sd < 2; sd++) {
      const w = i * 2 + sd, n = hj(200 + w) > 0.45 ? 6 : 5, wk = [], W = { n, f: new Float32Array(n * TN), s: new Float32Array(n * TN), c: new Float32Array(TN), r: [], e: [], l: [] };
      B.cut.forEach((c, m) => { const dp = c[1] * (0.75 + 0.5 * hj(300 + w * 9 + m)), at = c[0] + 3 * (hj(310 + w * 9 + m) - 0.5); for (let q = 0; q < TN; q++) W.c[q] = Math.max(W.c[q], dp * Math.max(0, 1 - Math.abs(-20 + q * 0.5 - at) / c[2])); });
      let tot = 0; for (let k = 0; k < n; k++) { wk.push(0.5 + 1.1 * hj(210 + w * 7 + k)); tot += wk[k]; }
      for (let k = 0, acc = 0; k < n; k++) {
        const f0 = 2.6 + ((acc + 0.55 * wk[k]) / tot) * 44.8, amt = 1.2 + 2.6 * hj(250 + w * 7 + k); acc += wk[k];
        W.r.push((73.9 * wk[k]) / tot); W.e.push(Math.max(0.7, 0.06 * W.r[k])); W.l.push(2.2 + 2.6 * hj(270 + w * 7 + k));
        for (let q = 0; q < TN; q++) {
          const v = -20 + q * 0.5;
          W.f[k * TN + q] = f0 + 1.5 * noise.n2(v * 0.022 + k * 3.7, w * 5.1 + 0.3) + 0.7 * noise.n2(v * 0.09 + k * 1.3, w + 9.1);
          W.s[k * TN + q] = amt * smoothstep(-0.25, 0.2, noise.n2(v * 0.11 + k * 3.1, w * 5.3 + 0.7));
        }
      }
      WALL.push(W);
    }
  });
  const wallDrop = (tt, s, w) => {
    if (tt <= 0) return 0;
    const W = WALL[w], fq = clamp((s + 20) * 2, 0, TN - 1.001), q = fq | 0, a = fq - q;
    let d = 4.2 * Math.min(tt, 2.6) + 0.25 * clamp(tt - 2.6, 0, 44.8);
    for (let k = 0; k < W.n; k++) {
      const o = k * TN + q, e = W.e[k], x = tt - (W.f[o] + (W.f[o + 1] - W.f[o]) * a);
      if (x <= -e) break;
      d += x >= e ? W.r[k] : (W.r[k] * (x + e)) / (2 * e);
      if (x > 0.5) { const m = 1 - (x - 0.5) / W.l[k]; if (m > 0) d -= (W.s[o] + (W.s[o + 1] - W.s[o]) * a) * m; }
    }
    return tt > 47.4 ? d + (tt - 47.4) * 1.9 : d;
  };
  for (const B of NBUT) { B.ax = Math.sin(B.b); B.az = Math.cos(B.b); }
  const NCONE = [-1.42, -0.6, 0.16, 0.84].map((b, i) => { const ra = 66 * (0.94 + 0.16 * hj(11 + i)); return [Math.sin(b) * ra, Math.cos(b) * ra, 30 * (0.9 + 0.25 * hj(21 + i))]; });
  const tri1 = (v) => { const f = v - Math.floor(v); return 1 - Math.abs(2 * f - 1); };            // 0..1..0, creased
  // ---- the stair under the gate. From the gate's floor the crest goes down to the north in five rock tiers, each a
  // slab that dips a little to the west (so the low sun lies on it) and ends in a riser six to nine metres high whose
  // front is broken in plan into facets a dozen metres long: those that face the sun are lit, the others stand in
  // their own shade. X = metres east of the crest line, Nn = metres north of the lip of the nose.
  const STEPS = [[-25, 6], [-12, 7], [4, 7.5], [19, 8], [33, 9]];          // [where the riser stands, how far it drops]
  const stairFront = (k, X) => STEPS[k][0] + 3.3 * (2 * tri1(X / (13 + 4 * hj(40 + k)) + hj(30 + k)) - 1) + 1.1 * noise.n2(X * 0.21 + k * 9.1, 3.3);
  const stairTop = (X, Nn) => {
    let h = 147, on = 0;
    for (let k = 0; k < STEPS.length; k++) { const f = stairFront(k, X), s = smoothstep(f - 0.85, f + 0.85, Nn); h -= STEPS[k][1] * s; if (k === 0) on = s; }
    return h + on * (0.13 * clamp(X, -14, 14) + 0.45 * noise.n2(X * 0.19 + 7.7, Nn * 0.19));
  };
  let noseG = 0;
  const noseH = (X, Nn) => {
    const r = Math.hypot(X, Nn);
    // (behind the blades the core stands well back, so the couloirs between them are deep; the skirt and the fans are
    // lobed and lumpy: scree, not a turned cone)
    const wob = 9 * noise.n2(X * 0.027 + 4.4, Nn * 0.027 + 1.1), rr = r + wob * smoothstep(40, 80, r);
    let base = rr < RA ? Math.min(TOPN - 6, HA + (RA - rr) * 0.92) : HA - (rr - RA) * 0.62;
    for (const c of NCONE) base = Math.max(base, c[2] - 0.64 * (Math.hypot(X - c[0], Nn - c[1]) + 0.55 * wob));
    base += (noise.n2(X * 0.31 + 9.1, Nn * 0.31) * 0.55 + noise.n2(X * 0.12, Nn * 0.12 + 5.5) * 1.2) * smoothstep(24, 60, r) * (1 - smoothstep(RA + 30, RA + 60, r));
    let fin = -1e9, env = -1e9, cg = 0;
    for (let i = 0; i < NBUT.length; i++) {
      const B = NBUT[i], s = (X * B.ax + Nn * B.az) / B.k; if (s < -18) continue;
      let t = -X * B.az + Nn * B.ax; t += 3.2 * noise.n2(s * 0.045 + i * 7.7, 2.2) * smoothstep(6, 30, s);
      // (the risers of the crest are broken in plan: seen from the north each is a few broad facets and a chimney)
      const fq = clamp((t + 80) * 2, 0, FN - 1.001), q = fq | 0, wq = clamp((s + 20) * 2, 0, TN - 1.001), wi = wq | 0, wl = i * 2 + (t > 0 ? 1 : 0), Wc = WALL[wl].c;
      const half = lerp(B.hw[0], B.hw[1], smoothstep(10, B.stair ? 45 : 80, s)), cu = Wc[wi] + (Wc[wi + 1] - Wc[wi]) * (wq - wi), tt = Math.max(0, Math.abs(t) - half + cu);
      const sp = s + (B.ft[q] + (B.ft[q + 1] - B.ft[q]) * (fq - q)) * smoothstep(4, 14, s) * (1 - smoothstep(5, 16, tt));
      const pq = clamp((sp + 20) * 2, 0, TN - 1.001), pi = pq | 0, profC = B.cc[pi] + (B.cc[pi + 1] - B.cc[pi]) * (pq - pi), profW = B.cw[wi] + (B.cw[wi + 1] - B.cw[wi]) * (wq - wi);
      // (a wall is a stair of its own, see wallDrop; its top is the plain bench, not the crest's own steps)
      const dr = wallDrop(tt, s, wl), top = Math.max(base, fin), wk = smoothstep(0, 5, tt);
      let cr;
      if (B.stair) {
        const hw = 134 - 24.5 * smoothstep(2, 8, Nn) - profW;
        if (wk >= 1) cr = hw;
        // (the stair is only sounded where this buttress can reach the surface: elsewhere its wall's level will do for the shade)
        else if (147 - profC - dr + 5.5 < top) { env = Math.max(env, hw - tt * 0.7); continue; }
        else cr = lerp(stairTop(X, Nn) - profC, hw, wk);
      } else cr = lerp(profC, profW, wk);
      env = Math.max(env, cr - tt * 0.7);
      if (cr - dr + 5.5 < top) continue;                         // (nor are the crags of a buttress that lies under the others here)
      // (by how far below the top, so the end of a buttress and its shoulders are as broken as its walls)
      const dd = TOPN - cr + dr;
      const crag = ((noise.ridged2(X * 0.085 + i * 3.3, Nn * 0.085 + 1.9, 2) - 0.55) * 4 * smoothstep(3, 14, dd)
        + (noise.ridged2(X * 0.2 + i * 5.1, Nn * 0.2 + 7.7, 1) - 0.5) * 1.9 * smoothstep(-2, 6, s) * (0.3 + 0.7 * smoothstep(0, 6, dd))) * (B.stair ? smoothstep(0, 4, dr) : 1);   // (the stair's treads are slabs)
      if (cr - dr + crag > fin) { fin = cr - dr + crag; cg = Math.min(1, cu / 5) * smoothstep(0, 4, tt); }      // (cg: how deep in a wall's couloir)
    }
    const h = Math.max(base, fin);
    noseG = smoothstep(5, 28, env - h) * (1 - smoothstep(RA + 6, RA + 42, r)) * smoothstep(6, 16, r);
    if (fin > base) noseG = Math.max(noseG, 0.85 * cg);
    return h;
  };
  const H = (x, z) => {
    lastG = 0;
    const cz = CREST_Z + 30 * noise.n2(x * 0.0015, 5.5) * smoothstep(60, 300, Math.abs(x));
    let crest = 186 + 26 * noise.n2(x * 0.0032, 1.7) + 12 * noise.n2(x * 0.011, 8.2);
    crest -= 13 * Math.exp(-(x + 8) * (x + 8) / 3000);
    crest *= 1 - 0.5 * smoothstep(850, 1300, Math.abs(x));
    const dz = z - cz;                       // (the north face is at its steepest under the saddle: the plain opens at once)
    // the col: on the south side a hanging valley leads gently up to the saddle (the camera climbs it)
    const col = dz > 0 ? Math.exp(-(x + 8) * (x + 8) / 5600) : 0, dq = dz - 150;
    let h = dz < 0 ? crest + dz * (0.58 + 0.4 * Math.exp(-(x + 8) * (x + 8) / 90000)) : crest - lerp(dz * 0.5, dz * 0.2 + 0.25 * (Math.sqrt(dq * dq + 400) + dq), col);
    const rib = noise.ridged2(x * 0.0042 + 2, z * 0.0016, 3);
    // (the ribs of the north face stand back from the saddle, so that the plain opens full width beyond it)
    const open = dz < 0 ? 1 - 0.75 * Math.exp(-(x + 8) * (x + 8) / 78000) : 1;
    h += (rib - 0.55) * 68 * smoothstep(10, 150, Math.abs(dz)) * smoothstep(-40, 40, h) * (1 - 0.85 * col) * open;
    // the north face away from the saddle is seen from the river as a range: couloirs and ribs a few tens of metres apart
    // run down it from the crest (a face of broad swells alone reads as clay)
    if (dz < 0 && h > -30) {
      const awayN = 1 - Math.exp(-(x + 8) * (x + 8) / 30000), ax = Math.abs(x), fx = ax < 420 ? 0.017 : 0.011;
      const rn = noise.ridged2(x * fx + 5.1 - dz * 0.0016, dz * 0.0045 + 2.7, ax < 420 ? 3 : 2);
      h += (rn - 0.55) * 36 * awayN * smoothstep(6, 60, -dz) * smoothstep(-30, 30, h);
    }
    // the south face is only ever seen from the bench, as a range some kilometres off: broad ribs and gullies run down
    // it from the crest itself (so the skyline is notched), dying out toward the col we climb
    if (dz > -14) {
      const away = 1 - Math.exp(-(x + 8) * (x + 8) / 7000), sfk = smoothstep(-14, 26, dz) * away;
      const rg = noise.ridged2(x * 0.019 + 11.3, z * 0.0045 + 4.1, 3), rg2 = noise.ridged2(x * 0.052 + 3.7, z * 0.011 + 9.2, 2);
      h += ((rg - 0.55) * 30 + (rg2 - 0.5) * 9) * sfk;
    }
    // the gate shelf the towers stand on: full width round the towers, tapering back to a knife arete by z = 44, with a
    // broken edge on both sides (a shelf of even width reads as a road)
    const gz = smoothstep(-26, -9, z), gx = 1 - smoothstep(30, 56, Math.abs(x));
    const gate = gx * gz * (1 - smoothstep(48, 80, z));
    const shelf = gx * gz * (1 - smoothstep(16, 44, z)), gateC = (1 - smoothstep(14, 28, Math.abs(x))) * gz * (1 - smoothstep(48, 80, z));
    if (z < 364 && Math.abs(x) < 330) {
      // the spur is an arete, not a cone (see flank). (Beyond 330 m its apron is far under the plain.)
      const dx = x - spurX(z), sd = dx < 0 ? -1 : 1;
      let s, g;
      if (z >= NOSE_Z) {
        const edge = 1 + (0.3 * noise.n2(z * 0.13 + sd * 4.1, 2.7) + 0.16 * noise.n2(z * 0.37, sd * 7.3)) * smoothstep(7, 22, Math.abs(z));   // (even under the towers)
        // (north of the towers the crest is the stair, a dozen metres to either side of the crest line)
        const stz = z < -4, stw = stz ? 11.5 * (1 - smoothstep(-10, -4, z)) * (1 + 0.1 * noise.n2(z * 0.31, 4.4)) : 0;
        const d = Math.max(0, Math.abs(dx) - Math.max((3.2 * gate + 13.6 * shelf) * edge, stw));
        // the south nose: two or three ribs with gullies between them run down it
        const nose = z > 300 ? (noise.ridged2(dx * 0.14 + 3.3, z * 0.02 + 1.7, 2) - 0.5) * 11 * smoothstep(304, 320, z) * smoothstep(0, 10, d) : 0;
        s = (stz ? stairTop(dx, NOSE_Z - z) : spurH(z)) + flank(d, z, sd) + nose; g = flG;
      } else {
        // the north nose: the spur ends in a bastion. Round the lip the same wall, buttresses, gullies and talus cones
        // are wrapped as a fan (the place along the spur becomes the bearing from the lip), the west flank's shapes
        // running round the north face to the north-east, where they give way to the east flank's
        // (round to the west and the east the bastion gives way to the spur's own flanks, wrapped round the lip as a fan)
        const r = Math.hypot(dx, NOSE_Z - z), ph = Math.atan2(dx, NOSE_Z - z), w = smoothstep(0.5, 1.05, ph), we = smoothstep(1.22, 1.52, Math.abs(ph));
        s = noseH(dx, NOSE_Z - z); g = noseG;
        if (we > 0) {
          let fw = 0, fe = 0, gw = 0, ge = 0;
          if (w < 1) { fw = flank(r, NOSE_Z - (ph + 1.5708) * NOSE_R, -1); gw = flG; }
          if (w > 0) { fe = flank(r, NOSE_Z - (1.5708 - ph) * NOSE_R, 1); ge = flG; }
          s = lerp(s, spurH(NOSE_Z) + lerp(fw, fe, w), we); g = lerp(g, lerp(gw, ge, w), we);
        }
      }
      const a = h, k = 12; h = 0.5 * (a + s + Math.sqrt((a - s) * (a - s) + k * k)) - k * 0.5 * Math.exp(-Math.abs(a - s) / 20);
      if (s > a - 6) lastG = g;
    }
    const onNose = (1 - smoothstep(NOSE_Z - 4, NOSE_Z + 14, z)) * (1 - smoothstep(150, 200, Math.abs(x)));     // (the bastion keeps its own edges: no swells, no contour ledges)
    const onStair = (1 - smoothstep(12, 18, Math.abs(x))) * (1 - smoothstep(-10, -4, z)) * smoothstep(-95, -85, z);
    h += (5.5 * noise.fbm2(x * 0.021, z * 0.021, 3) + 1.6 * noise.n2(x * 0.09, z * 0.09)) * smoothstep(4, 60, h) * (1 - 0.7 * gateC) * (1 - 0.6 * col) * (1 - 0.75 * onNose) * (1 - 0.9 * onStair);
    // the crest floor between the towers and behind them: shattered slabs in steps of a metre or so, not a ramp
    if (gate > 0.01 && h > 60) {
      const v = 2.6 * noise.fbm2(x * 0.085 + 31, z * 0.085, 2) + 0.02 * z, tq = v / 1.15, fq = tq - Math.floor(tq);
      h += ((Math.floor(tq) + smoothstep(0.7, 1, fq)) * 1.15 - v + 0.9 * noise.n2(x * 0.3, z * 0.3 + 5)) * gate * (0.45 + 0.55 * smoothstep(5, 12, Math.abs(x)));
    }
    // frost-shattered ledges, in patches only: beds of uneven thickness that dip across the spur, so that no two
    // ledges are the same height apart and none follows a contour (even beds read as contour stripes)
    const tw = (1 - smoothstep(130, 250, Math.abs(x))) * (1 - smoothstep(300, 345, z)) * (1 - gateC) * smoothstep(12, 36, h)
      * smoothstep(-0.25, 0.35, noise.n2(x * 0.017 + 20, z * 0.017)) * (dz > 0 ? Math.exp(-(x + 8) * (x + 8) / 1800) : 1) * (1 - onNose) * (1 - onStair)
      * (0.3 + 0.7 * smoothstep(60, 170, z)) * (z < 250 ? 1 - smoothstep(2, 14, x) : 1);        // (by the gate, and on the whole east flank, the flanks are ribbed down the fall line: contour ledges are bands there)
    if (tw > 0.01) {
      const bb = BAND * (1.5 + 0.7 * noise.n2(x * 0.011 + 3, z * 0.011));
      const t = (h + 0.12 * x + 0.05 * z + 9 * noise.n2(x * 0.02, z * 0.02 + 8)) / bb, f = t - Math.floor(t);
      h += (smoothstep(0.5, 0.92, f) - f) * bb * tw * 0.5;
    }
    const gd = Math.abs(x - gorgeXf(z)) - 22;
    const gh = Math.max(gd, 0) * 0.92 - 4 + 10 * noise.n2(x * 0.02, z * 0.02 + 7) * smoothstep(0, 60, gd);
    const kk = 14; h = 0.5 * (h + gh - Math.sqrt((h - gh) * (h - gh) + kk * kk)) + (h < 20 ? 0 : 0);
    return h - 3 * (1 - smoothstep(0, 25, h));
  };
  return { H, spurX, spurH, gorgeXf, gullyOf: () => lastG, stairFront, nSteps: STEPS.length };
}

// ---- ridge mesh: one grid, fine near the spur (about 2 m) and coarse at the ends (about 28 m)
async function buildRidgeGeo(ctx, H, gullyOf) {
  const NX = 220, NZ = 200, Z0 = -260, Z1 = 560;
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), ao = new Float32Array((NX + 1) * (NZ + 1)), gul = new Float32Array((NX + 1) * (NZ + 1));
  const xs = [], zs = [];
  const find = (arr, v) => { let a = 0, b = arr.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (arr[m] > v) b = m; else a = m; } return a; };
  for (let i = 0; i <= NX; i++) { const s = (i / NX) * 2 - 1; xs.push(1300 * (0.16 * s + 0.84 * s * Math.pow(Math.abs(s), 1.6))); }
  // rows: 9 m apart out on the plain, 3.6 m along the spur, over the saddle and down both its noses, 5 m behind
  // (the north nose, down to the plain at z = -190, is as fine as the spur: the camera climbs it to the gate)
  for (let j = 0; j <= NZ; j++) zs.push(j <= 8 ? lerp(Z0, -190, j / 8) : j <= 162 ? lerp(-190, 364, (j - 8) / 154) : lerp(364, Z1, (j - 162) / 38));
  for (let j = 0, k = 0; j <= NZ; j++) {
    const z = zs[j], back = 1 - smoothstep(505, 560, z);
    for (let i = 0; i <= NX; i++, k++) {
      if (i % 37 === 36) await ctx.yield();                            // (a sixth of a row to a step: the first rows run cold)
      let h = H(xs[i], z); gul[k] = gullyOf(); if (h > 0) h *= back;
      const edge = i === 0 || i === NX || j === 0 || j === NZ;
      pos[k * 3] = xs[i]; pos[k * 3 + 1] = edge ? -9 : Math.max(h, -8); pos[k * 3 + 2] = z;
    }
    await ctx.yield();
  }
  const W = NX + 1;
  // (the west flank under the gate, which the camera comes down a stone's throw above: a cliff edge that crosses the
  // grid on the slant is a row of teeth, one to a row, and from above that is a comb of dark spikes. The heights are
  // eased over their neighbours there, twice)
  for (let pass = 0; pass < 2; pass++) {
    const src = new Float32Array((NX + 1) * (NZ + 1)); for (let k = 0; k < src.length; k++) src[k] = pos[k * 3 + 1];
    for (let j = 1; j < NZ; j++) {
      const z = zs[j], wz = smoothstep(-34, -10, z) * (1 - smoothstep(270, 310, z)), wn = 0;   // (not the north nose: its buttresses keep their edges)
      if (wz <= 0 && wn <= 0) continue;
      for (let i = 1; i < NX; i++) {
        const x = xs[i], w = Math.max(wz * smoothstep(-205, -150, x) * (1 - smoothstep(-30, -12, x)), wn * (1 - smoothstep(150, 210, Math.abs(x)))); if (w <= 0) continue;
        const k = j * W + i, avg = (src[k - 1] + src[k + 1] + src[k - W] + src[k + W] + 0.5 * (src[k - W - 1] + src[k - W + 1] + src[k + W - 1] + src[k + W + 1])) / 6;
        pos[k * 3 + 1] = lerp(src[k], avg, 0.75 * w);
      }
      if ((j & 31) === 31) await ctx.yield();
    }
    await ctx.yield();
  }
  for (let j = 0, k = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++, k++) {
    if (i === 0 && (j & 3) === 3) await ctx.yield();
    const i0 = Math.max(0, i - 2), i1 = Math.min(NX, i + 2), j0 = Math.max(0, j - 2), j1 = Math.min(NZ, j + 2);
    const avg = (pos[(j * W + i0) * 3 + 1] + pos[(j * W + i1) * 3 + 1] + pos[(j0 * W + i) * 3 + 1] + pos[(j1 * W + i) * 3 + 1]) / 4;
    const i2 = Math.max(0, i - 5), i3 = Math.min(NX, i + 5), j2 = Math.max(0, j - 6), j3 = Math.min(NZ, j + 6);
    const wide = (pos[(j * W + i2) * 3 + 1] + pos[(j * W + i3) * 3 + 1] + pos[(j2 * W + i) * 3 + 1] + pos[(j3 * W + i) * 3 + 1]) / 4;
    ao[k] = clamp(0.72 + (pos[k * 3 + 1] - avg) * 0.06 + Math.min(0, pos[k * 3 + 1] - wide + 2.5) * 0.062 * (pos[k * 3 + 1] > 12 ? 1 : 0), 0.2, 1.0);
    ao[k] = Math.max(0.2, ao[k] * (1 - 0.62 * smoothstep(0.12, 0.7, gul[k])));        // a gully lies in shade under the low sun
  }
  await ctx.yield();
  // (the shade is softened over the neighbours: on a steep wall, where the grid's cells are slivers, a shade that
  // changes from one vertex to the next is a comb of dark spikes)
  {
    const src = ao.slice();
    for (let j = 1, k; j < NZ; j++) {
      for (let i = 1; i < NX; i++) { k = j * W + i; ao[k] = 0.3 * src[k] + 0.7 * (src[k - 1] + src[k + 1] + src[k - W] + src[k + W] + 0.5 * (src[k - W - 1] + src[k - W + 1] + src[k + W - 1] + src[k + W + 1])) / 6; }
      if ((j & 63) === 63) await ctx.yield();
    }
  }
  // ---- the north nose has a mesh of its own, 1.3 m fine: the climb to the gate looks straight at it, and at the ridge's
  // own spacing there (3.6 m by up to 5 m) a buttress is a swelling and a couloir a dimple. The ridge leaves those cells
  // out of its index; the nose's outermost vertices lie on the ridge's own edges (their heights and shade are read off
  // the ridge mesh, and over the first five metres inward the two are blended), so the join is watertight.
  const PI0 = find(xs, -152), PI1 = find(xs, 152) + 1, PJ0 = 8, PJ1 = find(zs, 9) + 1;        // (as far south as the towers' feet)
  const px0 = xs[PI0], px1 = xs[PI1], pz0 = zs[PJ0], pz1 = zs[PJ1], MX = Math.round((px1 - px0) / 1.3), MZ = Math.round((pz1 - pz0) / 1.3), MW = MX + 1;
  const pdx = (px1 - px0) / MX, pdz = (pz1 - pz0) / MZ, npv = MW * (MZ + 1);
  const ppos = new Float32Array(npv * 3), pao = new Float32Array(npv), pgul = new Float32Array(npv), pwb = new Float32Array(npv);
  const bil = (arr, st, off, x, z) => {
    const i = find(xs, x), j = find(zs, z), u = clamp((x - xs[i]) / (xs[i + 1] - xs[i]), 0, 1), v = clamp((z - zs[j]) / (zs[j + 1] - zs[j]), 0, 1), k = (j * W + i) * st + off;
    return lerp(lerp(arr[k], arr[k + st], u), lerp(arr[k + W * st], arr[k + W * st + st], u), v);
  };
  for (let j = 0, k = 0; j <= MZ; j++) {
    const z = j === MZ ? pz1 : pz0 + j * pdz;
    for (let i = 0; i <= MX; i++, k++) {
      // (on the west flank south of the lip, which the flight comes down a stone's throw above, the nose keeps the
      // ridge's own eased surface: see the easing above)
      const x = i === MX ? px1 : px0 + i * pdx, ws = 0.75 * smoothstep(-34, -10, z) * smoothstep(-205, -150, x) * (1 - smoothstep(-30, -12, x));
      const wb = smoothstep(0, 5, Math.min(x - px0, px1 - x, z - pz0, pz1 - z)) * (1 - ws);
      let h = bil(pos, 3, 1, x, z);
      if (wb > 0) { h = lerp(h, Math.max(H(x, z), -8), wb); pgul[k] = gullyOf() * wb; }
      ppos[k * 3] = x; ppos[k * 3 + 1] = h; ppos[k * 3 + 2] = z; pwb[k] = wb;
    }
    await ctx.yield();                                                 // (a row to a step)
  }
  for (let j = 0, k = 0; j <= MZ; j++) {
    const ja = Math.max(0, j - 5) * MW, jb = Math.min(MZ, j + 5) * MW, jc = Math.max(0, j - 15) * MW, jd = Math.min(MZ, j + 15) * MW, jr = j * MW;
    for (let i = 0; i <= MX; i++, k++) {
      const h = ppos[k * 3 + 1], ia = Math.max(0, i - 5), ib = Math.min(MX, i + 5), ic = Math.max(0, i - 15), id = Math.min(MX, i + 15);
      const avg = (ppos[(jr + ia) * 3 + 1] + ppos[(jr + ib) * 3 + 1] + ppos[(ja + i) * 3 + 1] + ppos[(jb + i) * 3 + 1]) / 4, wide = (ppos[(jr + ic) * 3 + 1] + ppos[(jr + id) * 3 + 1] + ppos[(jc + i) * 3 + 1] + ppos[(jd + i) * 3 + 1]) / 4;
      // (a wall sixty metres high stands under its own crest everywhere: what the ridge's measure calls a hollow is
      // here simply the wall, so the shade is gentle and the hard shadows are left to the baked sun)
      const a = clamp(0.76 + (h - avg) * 0.045 + Math.min(0, h - wide + 8) * 0.011 * (h > 12 ? 1 : 0), 0.44, 1.0);
      pao[k] = Math.max(0.3, a * (1 - 0.5 * smoothstep(0.12, 0.7, pgul[k])));
    }
    if ((j & 7) === 7) await ctx.yield();
  }
  for (let pass = 0; pass < 2; pass++) {
    const src = pao.slice();
    for (let j = 1, k; j < MZ; j++) {
      for (let i = 1; i < MX; i++) { k = j * MW + i; pao[k] = 0.4 * src[k] + 0.6 * (src[k - 1] + src[k + 1] + src[k - MW] + src[k + MW] + 0.5 * (src[k - MW - 1] + src[k - MW + 1] + src[k + MW - 1] + src[k + MW + 1])) / 6; }
      if ((j & 31) === 31) await ctx.yield();
    }
  }
  for (let k = 0; k < npv; k++) if (pwb[k] < 1) pao[k] = lerp(bil(ao, 1, 0, ppos[k * 3], ppos[k * 3 + 2]), pao[k], pwb[k]);
  await ctx.yield();
  const pnr = new Float32Array(npv * 3), pidx = new Uint32Array(MX * MZ * 6);
  for (let j = 0, k = 0, q = 0; j <= MZ; j++) {
    const j0 = Math.max(0, j - 1), j1 = Math.min(MZ, j + 1);
    for (let i = 0; i <= MX; i++, k++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(MX, i + 1);
      const sx = (ppos[(j * MW + i1) * 3 + 1] - ppos[(j * MW + i0) * 3 + 1]) / (ppos[(j * MW + i1) * 3] - ppos[(j * MW + i0) * 3]), sz = (ppos[(j1 * MW + i) * 3 + 1] - ppos[(j0 * MW + i) * 3 + 1]) / (ppos[(j1 * MW + i) * 3 + 2] - ppos[(j0 * MW + i) * 3 + 2]);
      const il = 1 / Math.sqrt(sx * sx + 1 + sz * sz);
      pnr[k * 3] = -sx * il; pnr[k * 3 + 1] = il; pnr[k * 3 + 2] = -sz * il;
      if (i < MX && j < MZ) { const a = k, b = a + 1, c = a + MW, d = c + 1; pidx[q++] = a; pidx[q++] = c; pidx[q++] = b; pidx[q++] = b; pidx[q++] = c; pidx[q++] = d; }
    }
    if ((j & 15) === 15) await ctx.yield();
  }
  const noseGeo = new THREE.BufferGeometry();
  noseGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  noseGeo.setAttribute('aAO', new THREE.BufferAttribute(pao, 1));
  noseGeo.setAttribute('normal', new THREE.BufferAttribute(pnr, 3));
  noseGeo.setIndex(new THREE.BufferAttribute(pidx, 1));
  await ctx.yield();
  const inPatch = (x, z) => x > px0 && x < px1 && z > pz0 && z < pz1;
  const idx = new Uint32Array((NX * NZ - (PI1 - PI0) * (PJ1 - PJ0)) * 6);
  for (let j = 0, q = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    if (i >= PI0 && i < PI1 && j >= PJ0 && j < PJ1) continue;
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
  }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aAO', new THREE.BufferAttribute(ao, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  // normals from the grid's own slopes, in short steps (computeVertexNormals on 42,000 vertices is one long step)
  const nrm = new Float32Array((NX + 1) * (NZ + 1) * 3);
  for (let j = 0, k = 0; j <= NZ; j++) {
    const j0 = Math.max(0, j - 1), j1 = Math.min(NZ, j + 1), dz = zs[j1] - zs[j0];
    for (let i = 0; i <= NX; i++, k++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(NX, i + 1);
      const sx = (pos[(j * W + i1) * 3 + 1] - pos[(j * W + i0) * 3 + 1]) / (xs[i1] - xs[i0]), sz = (pos[(j1 * W + i) * 3 + 1] - pos[(j0 * W + i) * 3 + 1]) / dz;
      const il = 1 / Math.sqrt(sx * sx + 1 + sz * sz);
      nrm[k * 3] = -sx * il; nrm[k * 3 + 1] = il; nrm[k * 3 + 2] = -sz * il;
    }
    if ((j & 15) === 15) await ctx.yield();
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  // darken the ground under and behind something standing on it (contact shadow, baked into the vertices). It is kept
  // apart from the terrain's own shade (aAO): that one says where a gully or a hollow is, and snow lies there; a block
  // must not gather a ring of snow round its foot
  const con = new Float32Array((NX + 1) * (NZ + 1)), pcon = new Float32Array(npv);
  geo.setAttribute('aCon', new THREE.BufferAttribute(con, 1)); noseGeo.setAttribute('aCon', new THREE.BufferAttribute(pcon, 1));
  // the terrain's own shade at (x, z): low in a gully or a hollow
  const aoAt = (x, z) => {
    if (x <= xs[0] || x >= xs[NX] || z <= zs[0] || z >= zs[NZ]) return 1;
    if (inPatch(x, z)) return pao[Math.min(MZ, Math.round((z - pz0) / pdz)) * MW + Math.min(MX, Math.round((x - px0) / pdx))];
    return bil(ao, 1, 0, x, z);
  };
  const splat = (x, z, r, amt) => {
    const i0 = find(xs, x - r), i1 = Math.min(NX, find(xs, x + r) + 1), j0 = find(zs, z - r), j1 = Math.min(NZ, find(zs, z + r) + 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const d = Math.hypot(xs[i] - x, zs[j] - z) / r; if (d < 1) con[j * W + i] = 1 - (1 - con[j * W + i]) * (1 - amt * (1 - d * d));
    }
    if (x + r > px0 && x - r < px1 && z + r > pz0 && z - r < pz1) {
      const a0 = Math.max(1, Math.floor((x - r - px0) / pdx)), a1 = Math.min(MX - 1, Math.ceil((x + r - px0) / pdx)), b0 = Math.max(1, Math.floor((z - r - pz0) / pdz)), b1 = Math.min(MZ - 1, Math.ceil((z + r - pz0) / pdz));
      for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) {
        const k = j * MW + i, d = Math.hypot(ppos[k * 3] - x, ppos[k * 3 + 2] - z) / r; if (d < 1) pcon[k] = 1 - (1 - pcon[k]) * (1 - amt * (1 - d * d));
      }
    }
  };
  // the mesh's own height at (x, z): what stands on the ridge stands on this (0 beyond the mesh)
  const hAt = (x, z) => {
    if (x <= xs[0] || x >= xs[NX] || z <= zs[0] || z >= zs[NZ]) return 0;
    if (inPatch(x, z)) {
      const fx = Math.min((x - px0) / pdx, MX - 1e-4), fz = Math.min((z - pz0) / pdz, MZ - 1e-4), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = (j * MW + i) * 3 + 1;
      return lerp(lerp(ppos[k], ppos[k + 3], u), lerp(ppos[k + MW * 3], ppos[k + MW * 3 + 3], u), v);
    }
    const i = find(xs, x), j = find(zs, z), u = (x - xs[i]) / (xs[i + 1] - xs[i]), v = (z - zs[j]) / (zs[j + 1] - zs[j]), k = (j * W + i) * 3 + 1;
    return lerp(lerp(pos[k], pos[k + 3], u), lerp(pos[k + W * 3], pos[k + W * 3 + 3], u), v);
  };
  return { geo, splat, hAt, aoAt, noseGeo, conAttrs: [geo.attributes.aCon, noseGeo.attributes.aCon] };
}

// ---- terrain shadow for the low sun, baked over ridge and near plain (R8, 1 = lit)
async function bakeShade(ctx, H, sun) {
  const gw = 261, gh = 127, hs = new Float32Array(gw * gh);
  const gx = (SHD.x1 - SHD.x0) / (gw - 1), gz = (SHD.z1 - SHD.z0) / (gh - 1);
  for (let j = 0, k = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++, k++) hs[k] = Math.max(H(SHD.x0 + i * gx, SHD.z0 + j * gz), 0);
    if (j % 4 === 3) await ctx.yield();
  }
  const samp = (x, z) => {
    const fx = clamp((x - SHD.x0) / gx, 0, gw - 1.001), fz = clamp((z - SHD.z0) / gz, 0, gh - 1.001);
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * gw + i;
    return lerp(lerp(hs[k], hs[k + 1], u), lerp(hs[k + gw], hs[k + gw + 1], u), v);
  };
  const hl = Math.hypot(sun.x, sun.z) || 1e-3, dx = sun.x / hl, dz = sun.z / hl, tan = Math.max(sun.y, 0.02) / hl;
  const data = new Uint8Array(SHD.w * SHD.h);
  for (let j = 0, k = 0; j < SHD.h; j++) {
    const z = lerp(SHD.z0, SHD.z1, (j + 0.5) / SHD.h);
    for (let i = 0; i < SHD.w; i++, k++) {
      const x = lerp(SHD.x0, SHD.x1, (i + 0.5) / SHD.w), h0 = samp(x, z) + 1.5;
      let lit = 1;
      for (let s = 0, d = 9; s < 20 && d < 1250; s++, d *= 1.3) {
        const over = samp(x + dx * d, z + dz * d) - (h0 + d * tan);
        if (over > 0) lit = Math.min(lit, 1 - clamp(over / (3 + d * 0.035), 0, 1));
      }
      data[k] = Math.round(255 * lit);
    }
    await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, SHD.w, SHD.h, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// the same shadow round the north nose, a metre and a half to the texel (the plain keeps the coarse one)
async function bakeShadeFine(ctx, Hm, sun) {
  const hl = Math.hypot(sun.x, sun.z) || 1e-3, dx = sun.x / hl, dz = sun.z / hl, tan = Math.max(sun.y, 0.02) / hl;
  const data = new Uint8Array(NSH.w * NSH.h);
  for (let j = 0, k = 0; j < NSH.h; j++) {
    const z = lerp(NSH.z0, NSH.z1, (j + 0.5) / NSH.h);
    for (let i = 0; i < NSH.w; i++, k++) {
      const x = lerp(NSH.x0, NSH.x1, (i + 0.5) / NSH.w), hh = Hm(x, z);
      let lit = 1;
      if (hh > -1) {
        const h0 = hh + 0.7;
        for (let s = 0, d = 2.2; s < 26 && d < 800; s++, d *= 1.26) {
          const over = Hm(x + dx * d, z + dz * d) - (h0 + d * tan);
          if (over > 0) { lit = Math.min(lit, 1 - clamp(over / (0.8 + d * 0.022), 0, 1)); if (lit <= 0) break; }
        }
      }
      data[k] = Math.round(255 * lit);
    }
    if ((j & 1) === 1) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, NSH.w, NSH.h, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

const ROCK_VS = /* glsl */`
attribute float aAO; attribute float aCon; varying vec3 vP; varying vec3 vN; varying float vAO; varying float vCon; varying float vMag; varying float vInst;
${FOG_V}
void main(){
  vec3 p=position, n=normal; vInst=0.; vCon=aCon;
  #ifdef USE_INSTANCING
    p=(instanceMatrix*vec4(p,1.)).xyz; n=mat3(instanceMatrix)*n; vInst=1.;
  #endif
  vP=p; vN=n; vAO=aAO; vMag=length(modelMatrix[0].xyz);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const SHADE_UV = `vec2((P.x-(${SHD.x0.toFixed(1)}))/${(SHD.x1 - SHD.x0).toFixed(1)},(P.z-(${SHD.z0.toFixed(1)}))/${(SHD.z1 - SHD.z0).toFixed(1)})`;
// Frost-shattered granite. Every detail term fades by the size of a pixel in local metres (fwp), never by distance,
// so the same shader holds when the world shows the ridge magnified (stage C) and at its own scale (stage D).
// Nothing is drawn as a small cell or an outline (cells a few pixels across read as mosaic, outlined ones as paving):
// shattered blocks that stand proud of each other while they are a dozen pixels across, streaks and chutes down the fall line (sampled on the two vertical planes and
// blended by the facing, never by blending coordinates), sparse gaping joints, and talus as stones of mixed size.
// Strata dip across the slope, are of uneven thickness and are continuous; they are faint at the ridge's own scale
// and plain when the ridge stands in as a distant range.
const ROCK_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform sampler2D uShade; uniform sampler2D uShadeN; uniform float uBare; uniform vec4 uHole; uniform float uFadeD;
varying vec3 vP; varying vec3 vN; varying float vAO; varying float vCon; varying float vMag; varying float vInst;
// loose stones: x = gap between the two nearest, y = the stone's id, zw = from the stone's centre to here
vec4 cells(vec2 p){
  vec2 i=floor(p), f=fract(p), rb=vec2(0.); float d1=9., d2=9., id=0.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y)); vec2 r=g+vec2(h21(i+g),h21(i+g+57.3))*.85+.075-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; id=h21(i+g+11.7); rb=r; } else if(d<d2){ d2=d; }
  }
  return vec4(sqrt(d2)-sqrt(d1),id,-rb);
}
// Jointed rock. Beds dip across the slope; every bed is cut by two sets of upright joints whose bearing, spacing and
// offset are the bed's own, so the blocks of one bed never line up with those of the next. A block is a prism in
// space, not a pattern laid on a face: the same blocks show on every facing, with no blending of projections.
float bedBlock(vec2 q,float bi,float sc,float seed,out vec2 ai,out vec2 af,out vec2 d1,out vec2 len){
  float r1=h21(vec2(bi,seed)), r2=h21(vec2(bi+3.7,seed+9.1));
  float ang=r1*6.2832; d1=vec2(cos(ang),sin(ang));
  len=sc*vec2(mix(1.4,2.7,r2),mix(1.15,2.1,fract(r2*7.3)));
  vec2 a=vec2(dot(q,d1),dot(q,vec2(-d1.y,d1.x)))/len+vec2(r1,r2)*17.;
  ai=floor(a); af=a-ai;
  return h21(ai+vec2(bi*13.7+seed,bi*5.3));
}
// x = the block's tone (0..1), y = dark of joints and of the shade a prouder neighbour throws, z = ledge top showing,
// w = level of detail (0 when a bed is only a few pixels thick). fn = the side face that shows where this block
// stands proud of its neighbour, fk = how much of the pixel is that face.
vec4 blocks(vec3 q,float sc,float seed,float fw,out vec3 fn,out float fk){
  float b=(q.y+dot(q.xz,vec2(.12,.05)))/sc+(fbm(q.xz*.21/sc+seed)-.5)*1.3, bi=floor(b), bf=b-bi;   // beds that swell and pinch a little
  // (a bed seen thinner than about six pixels is a tone, not blocks: small blocks with their shade are a checker there)
  float lod=clamp(1.7-fw*9./sc,0.,1.)*clamp(1.8-fwidth(b)*5.5,0.,1.);
  fn=vec3(0.,1.,0.); fk=0.;
  if(lod<=0.) return vec4(.5,0.,0.,0.);
  vec2 ai,af,d1,len,ai2,af2,d1b,len2;
  float id=bedBlock(q.xz,bi,sc,seed,ai,af,d1,len);
  float sb=bf<.5?-1.:1.;
  float idv=bedBlock(q.xz,bi+sb,sc,seed,ai2,af2,d1b,len2);
  vec2 sa=vec2(af.x<.5?-1.:1.,af.y<.5?-1.:1.), ho=vec2(bi*13.7+seed,bi*5.3);
  float id1=h21(ai+vec2(sa.x,0.)+ho), id2=h21(ai+vec2(0.,sa.y)+ho);
  vec3 e=vec3(min(bf,1.-bf)*sc,min(af.x,1.-af.x)*len.x,min(af.y,1.-af.y)*len.y);    // metres to the nearest bed plane and joints
  // not every joint has opened: across the others two blocks are one
  vec3 opn=step(vec3(.36,.46,.46),fract((vec3(id)+vec3(idv,id1,id2))*17.31));
  vec3 dh=(vec3(id)-vec3(idv,id1,id2))*sc*.18*opn;                                   // how far this block stands out from each
  // a joint is a crack a few centimetres wide: far off it is a thin grey line (the share of the pixel it covers), never a stroke
  float jw=(.004+.011*fract(id*9.7))*sc, jc=clamp((jw*2.+fw*.28)/(fw*1.4+1e-4),0.,1.);
  vec3 jl=(1.-smoothstep(vec3(jw),vec3(jw+fw*1.4+.004*sc),e))*opn*jc;
  vec3 wd=max(dh,0.)+.02*sc;
  vec3 face=(1.-smoothstep(wd*.55,wd+fw*.5,e))*step(.02*sc,dh);
  vec3 shw=(1.-smoothstep(vec3(0.),max(-dh,0.)*.9+.02*sc+fw,e))*step(dh,vec3(-.02*sc));
  shw.x*=sb>0.?1.:.45;                                                               // an overhang shades more than a step below
  float dark=max(max(jl.x,max(jl.y,jl.z))*.8,max(shw.x,max(shw.y,shw.z))*.5);
  vec3 up=vec3(-.119,.992,-.05);
  if(face.x>=face.y&&face.x>=face.z){ fn=up*sb; fk=face.x; }
  else if(face.y>=face.z){ fn=vec3(d1.x,0.,d1.y)*sa.x; fk=face.y; }
  else { fn=vec3(-d1.y,0.,d1.x)*sa.y; fk=face.z; }
  float top=face.x*step(0.,sb);
  return vec4(mix(.5,id,lod),dark*lod,top*lod,lod);
}
#define LR(s) clamp(1.5-fwp*(s)*5.,0.,1.)
#define LC(s) clamp(1.5-fwp*(s)*7.,0.,1.)
void main(){
  if(uFadeD<=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))) discard;
  vec3 P=vP; vec3 Ng=vN/max(length(vN),1e-4);
  if(uHole.z>0. && abs(P.x-uHole.x)<uHole.z && abs(P.z-uHole.y)<uHole.w) discard;
  vec3 toC=uCamL-P; float dist=length(toC); vec3 V=toC/max(dist,1e-3);
  float fwp=length(fwidth(P));
  float mag=clamp((vMag-1.)*.5,0.,1.), nmag=1.-mag;            // 1 while the ridge stands in as a distant range
  // the north nose, the bastion the climb to the gate looks at: massive granite in upright blades. No level beds are
  // drawn on it, its joints are faint, its fans are scree; seen from a way off its faces are the mesh's own planes
  float nz=(1.-smoothstep(12.,32.,P.z))*(1.-smoothstep(150.,200.,abs(P.x)))*nmag;
  vec3 Nf=cross(dFdx(P),dFdy(P)); float nfl=length(Nf); Nf=nfl>1e-9?Nf/nfl:Ng; if(Nf.y<0.) Nf=-Nf;
  Ng=mix(Ng,Nf,.5*nz*(1.-smoothstep(4.,9.,P.z))*smoothstep(45.,140.,dist)); Ng/=max(length(Ng),1e-4);
  // the stair under the gate: a tread is a slab and a riser is a wall, with an arris between them (the mesh alone rounds
  // every step into a swelling)
  float stM=nz*(1.-smoothstep(13.,20.,abs(P.x)))*smoothstep(-96.,-86.,P.z)*(1.-smoothstep(-9.,-4.,P.z))*smoothstep(96.,106.,P.y);
  // (and so are the stepped walls and blade ends below it, a little less sharply)
  float stL=nz*(1.-smoothstep(-34.,-22.,P.z))*(1.-smoothstep(118.,132.,P.y))*smoothstep(4.,16.,P.y);
  { float st0=1.-Ng.y, kk=mix(.6,2.2,smoothstep(.1,.3,st0)); vec3 Ns=vec3(Ng.x*kk,Ng.y,Ng.z*kk); Ns/=max(length(Ns),1e-4); Ng=mix(Ng,Ns,max(stM,stL*.75)); }
  // round the gate the spur's flanks are seen end on, along the spur: what shows there is ribs and gullies down the fall
  // line, and level beds across them would be bands
  float gK=(1.-smoothstep(150.,340.,length(P.xz-vec2(0.,20.))))*nmag;
  // (and once the camera itself is on the gate's own approach, every flank in sight is seen that way)
  float bedK=(1.-gK)*(1.-.85*(1.-smoothstep(130.,290.,length(uCamL.xz-vec2(0.,-60.))))*nmag);
  float steep=1.-Ng.y, slope=smoothstep(.12,.3,steep), soft=1.-uBare, wall=smoothstep(.2,.45,steep);   // ground up to about 40 degrees holds talus
  vec3 w3=Ng*Ng; float wxz=max(w3.x+w3.z,1e-3);
  vec2 sdir=uSunL.xz/max(length(uSunL.xz),1e-3);
  float warp=fbm(P.xz*.02), sn=fbm(P.xz*.028+5.);
  float g1=mix(.5,vn(P.xz*2.7+P.y*2.1),LR(2.7)), g2=mix(.5,vn(P.xz*9.+P.y*7.3),LR(9.));
  // down the fall line: streaks a few metres apart, chutes a few tens
  float yy=P.y*.03;
  float fa=vn(vec2(P.z*.3+warp*3.,yy+3.)), fb=vn(vec2(P.x*.3+warp*3.,yy+7.));
  float ga=vn(vec2(P.z*.085+warp*2.,yy*.4+13.)), gc=vn(vec2(P.x*.085+warp*2.,yy*.4+17.));
  float fl=mix(.5,(fa*w3.x+fb*w3.z)/wxz,LR(.3)), gl=mix(.5,(ga*w3.x+gc*w3.z)/wxz,LR(.085));
  float streak=smoothstep(.5,.8,fl)*wall*nmag*max(smoothstep(.42,.66,vn(P.xz*.035+P.y*.03+7.)),nz)*(1.-.7*stM)*(1.-.8*stL), chute=smoothstep(.55,.75,gl)*wall*soft*nmag;   // (streaks in patches only: evenly spaced on a shaded wall they are a comb)   // (magnified they are smears a hundred metres long)
  // strata: continuous beds of uneven thickness that dip across the slope
  float sy=(P.y+dot(P.xz,vec2(.12,.05)))/${BAND.toFixed(1)}+(warp-.5)*3.2;
  float fsy=fwidth(sy), lB=clamp(1.5-fsy*5.,0.,1.)*(1.-.85*nz)*(.25+.75*bedK);
  float str=mix(.5,smoothstep(.3,.7,vn(vec2(sy*1.3,3.7))),lB), str2=mix(.5,vn(vec2(sy*4.1,9.1)),clamp(1.5-fsy*16.,0.,1.));
  // the jointed blocks at three sizes; where the stone is massive only the big joints show
  vec3 wv=(vec3(vn(P.xz*.06+3.),vn(P.zy*.06+11.),vn(P.xy*.06+23.))-.5);
  float massive=smoothstep(.42,.62,fbm(P.xz*.03+P.y*.02+50.));
  vec3 fnA,fnB,fnC; float fkA,fkB,fkC;
  vec4 A=blocks(P+wv*1.1,6.4,3.,fwp,fnA,fkA);
  vec4 B=blocks(P+wv*.6,2.1,17.,fwp,fnB,fkB);
  vec4 C=blocks(P+wv*.3,.62,41.,fwp,fnC,fkC);
  float kB=mix(1.,.62,massive)*mix(.3,1.,slope), kC=mix(1.,.45,massive)*slope, nm=(1.-mag)*(1.-smoothstep(240.,520.,dist));   // as a far range the ridge shows its beds only
  A.y*=nm*.42; A.z*=nm; fkA*=nm*.5; A.x=mix(.5,A.x,nm); B.yz*=kB*nm; fkB*=kB*nm; B.x=mix(.5,B.x,nm); C.yz*=kC*nm; fkC*=kC*nm; C.x=mix(.5,C.x,nm);
  float jk=mix(mix(.42,.1,smoothstep(120.,300.,dist)),1.,slope)*(1.-.88*nz);   // the joints show on flat rock too, a little less, and not from far off
  float hollow=fbm(P.xz*.09+13.)*.6+(vn(P.xz*.45+3.)-.5)*.1+(1.-vAO)*.9+(P.y-150.)*.004-max(dot(Ng,uSunL),0.)*.45+uSnow*(.15+smoothstep(40.,90.,P.y)*.35)+chute*.15-.16*mag*(1.-uSnow)+.1*nmag*smoothstep(70.,130.,P.y);
  float snow=smoothstep(.63,.8,hollow)*smoothstep(.45,.75,Ng.y+uBare*.3)*mix(1.,uSnow,uBare);
  // (old snow lies all year in the shaded gullies high on the spur)
  snow=max(snow,(1.-smoothstep(.45,.7,vAO))*smoothstep(50.,90.,P.y)*smoothstep(.38,.56,fbm(P.xz*.05+3.))*smoothstep(.2,.45,Ng.y)*nmag*.9);
  float bareS=1.-smoothstep(.02,.22,snow);                  // (any snow at all lies smooth over the joints and stones)
  float tone=fbm(P.xz*.011+P.y*.009+2.);
  float fr=max(mag,smoothstep(240.,520.,dist));               // far off, or standing in as a range: beds, not blocks
  float tv=tone+(str-.5)*mix(.16,.7,fr)*mix(1.,.3,mag)+(str2-.5)*mix(.05,.3,fr)*nmag+((A.x-.5)*.26+(B.x-.5)*.22*kB+(C.x-.5)*.14*kC)*jk*bareS;
  vec3 rock=mix(vec3(.13,.13,.145),vec3(.45,.4,.32),smoothstep(.15,.85,tv));
  rock=mix(rock,uPal[4]*.36,smoothstep(.55,.8,vn(P.xz*.07+P.y*.05))*.35);
  rock=mix(rock,vec3(.34,.2,.12),smoothstep(.62,.8,fbm(P.xz*.05+P.y*.08+71.))*.4);            // rust where water has run
  rock*=(.86+.2*g1+.1*g2)*mix(1.,.84,uBare);
  rock*=(1.-.24*streak*smoothstep(.06,.42,abs(dot(Ng,V))))*(1.-.3*chute);
  float graze=smoothstep(.06,.42,abs(dot(Ng,V)));       // (a wall seen edge-on from above: its upright joints would be a comb of dark spikes)
  float dark=max(A.y,max(B.y*.85,C.y*.7))*jk*mix(1.,.5,mag)*bareS*graze;
  rock*=1.-.5*dark;
  // the bastion's granite is shattered into irregular plates a few metres across (no ruled joints): each of its own
  // tone and tilt, a dark crack round it
  // (the cracks are hairlines, and only here and there: drawn all round every plate they are crazy paving)
  vec2 qnz=vec2(P.x*.8+P.z*.6,P.y*1.1+(P.z*.8-P.x*.6)*.45)+wv.xy*3.2+(vec2(g1,sn)-.5)*.5;
  vec4 fq1=cells(qnz*.23+17.), fq2=cells(qnz*.71+5.);
  float lf1=LC(.23)*nz*bareS, lf2=LC(.71)*nz*bareS;
  // (plates of a tone each, no more: a crack drawn round every plate is a net on a smooth surface. Only here and there
  // a master joint shows)
  rock*=1.+(fq1.y-.5)*.2*lf1+(fq2.y-.5)*.1*lf2;
  float fqm=smoothstep(.56,.74,vn(qnz*.11+3.));
  rock*=1.-.2*(1.-smoothstep(.0,.04,fq1.x))*lf1*fqm*graze;
  rock=mix(rock,vec3(.44,.47,.13),smoothstep(.6,.72,fbm(P.xz*.9+P.y*.6+3.))*.35*LR(1.8));     // map lichen, near only
  // black crust in broad soft patches (as a hard-edged fine noise it read as a checker of dark squares from the gate)
  vec2 qc=P.xz*.16+P.y*.25+21.+(wv.xy)*.5;
  rock=mix(rock,rock*.45+vec3(.02,.02,.025),smoothstep(.56,.82,vn(qc)*.7+vn(qc*2.3+5.)*.3)*.3*LR(.44));
  float top=max(A.z,B.z*.8)*jk*bareS;
  rock=mix(rock,vec3(.3,.29,.27)*(.8+.4*g2),top*.6);                                           // grit and stones lying on the ledges
  // old snow in the hollows and on the lee: smooth drifts with a soft edge (worked out here, so that the stones under a
  // drift, and the joints of the rock, do not show through it as dashes or squares)
  // what lies on the gentle ground and in the chutes: talus as stones of three sizes, each with a lit and a shadowed
  // side and a dark gap round it; tundra low down; old snow
  float lie=(1.-slope)*soft;
  // (on the bastion the fans are scree all over; the ledges high on it are swept slabs with scree lying in patches)
  float talus=max(max(lie*smoothstep(.15,.4,sn),chute*.8),lie*nz*mix(.92,.12+.6*smoothstep(.45,.62,vn(P.xz*.13+9.)),smoothstep(84.,100.,P.y)));
  float bigm=smoothstep(.35,.65,fbm(P.xz*.045+31.));
  vec4 s0=cells(P.xz*.27+3.+(wv.xy)*.6), s1=cells(P.xz*.85+7.), s2=cells(P.xz*2.5+1.);
  float l0=LC(.27)*bigm*nmag, l1=LC(.85)*nmag, l2=LC(2.5)*nmag;      // (magnified, a stone would be the size of a house: scree is a tone then)
  float gap0=(1.-smoothstep(.02,.16,s0.x))*l0, gap1=(1.-smoothstep(.03,.2,s1.x))*l1*(1.-.7*l0*smoothstep(.16,.3,s0.x)), gap2=(1.-smoothstep(.04,.24,s2.x))*l2*(1.-l0*.8)*(1.-.5*l1);
  float st=mix(.5,mix(mix(s2.y,s1.y,l1*.75),s0.y,l0*smoothstep(.12,.22,s0.x)),max(l0,max(l1,l2)));
  st=mix(.5,st,bareS);                                        // (under a drift's edge the stones are one tone: no squares in the snow)
  vec3 scr=mix(vec3(.15,.15,.165),vec3(.47,.43,.37),smoothstep(.1,.9,st))*(.9+.2*g2);
  scr=mix(scr,scr*vec3(.7,.72,.8),smoothstep(.45,.7,fbm(P.xz*.06+31.))*.6);          // older, lichened runs
  scr=mix(scr,vec3(.3,.34,.13),step(.8,fract(st*7.3))*.35*max(l0,l1)*bareS);
  float lee=dot(normalize(s0.zw+1e-4),sdir)*l0*smoothstep(.1,.25,s0.x)+dot(normalize(s1.zw+1e-4),sdir)*l1*.6*(1.-l0);
  scr*=1.+.22*lee*bareS;
  scr*=1.-.62*max(gap0,max(gap1*.85,gap2*.6))*bareS;
  vec3 alb=mix(rock,scr,talus*mix(.94,.42,mag));
  // as a range: continuous beds a few tens of metres thick that dip across the slope, each of its own tone with a
  // line of shade under it; colour only (relief on them, lit by a low sun, breaks into dashes)
  float bq=(P.y+dot(P.xz,vec2(.21,.07)))/2.7+(warp-.5)*2.6+(sn-.5)*1.2, bqi=floor(bq), bqf=bq-bqi, fbq=fwidth(bq);
  float lQ=clamp(1.5-fbq*3.,0.,1.)*mag;
  float bedT=h21(vec2(bqi,7.3))-.5, bedE=(1.-smoothstep(0.,.26+fbq,bqf))*step(.3,h21(vec2(bqi,3.1)));
  alb*=1.+(bedT*.6-.36*bedE)*lQ;
  alb=mix(alb,alb*vec3(.62,.66,.78),lQ*step(.72,h21(vec2(bqi,11.7)))*.7);                         // a slate bed among the cream ones
  alb=mix(alb,alb*vec3(.8,.84,.95),lQ*smoothstep(.45,.7,fbm(P.xz*.035+P.y*.02+9.))*.6);          // slate runs among the cream
  // from the river, at its own scale, the range is a few hundred metres off: the same dipping beds, a dozen metres
  // thick, cream ribs standing out of blue-grey gullies (the hollows are baked into the mesh)
  float frd=smoothstep(90.,300.,dist)*nmag;
  float b2=(P.y+dot(P.xz,vec2(.21,.07)))/13.+(warp-.5)*1.1+(sn-.5)*.45, b2i=floor(b2), b2f=b2-b2i, fb2=fwidth(b2);
  float lQ2=clamp(1.5-fb2*3.,0.,1.)*frd*(1.-.85*nz)*bedK;
  alb*=1.+((h21(vec2(b2i,7.3))-.5)*.62-.36*(1.-smoothstep(0.,.25+fb2,b2f))*step(.3,h21(vec2(b2i,3.1))))*lQ2;
  alb=mix(alb,alb*vec3(.66,.7,.84),lQ2*step(.72,h21(vec2(b2i,11.7)))*.6);
  alb=mix(alb,mix(alb*vec3(.66,.75,.98),alb*vec3(1.14,1.06,.93),smoothstep(.5,.86,vAO)),max(frd,gK*(1.-nz)*smoothstep(40.,110.,dist))*.85);
  // down the fall line of the flanks: pale ribs, slate-blue runnels between them
  float colm=vn(vec2(P.z*.11+warp*2.2,P.x*.007+5.))*.6+vn(vec2(P.z*.31+warp*3.+3.,P.x*.018))*.4, flK=(1.-bedK)*(1.-nz)*nmag*smoothstep(40.,120.,dist);
  alb=mix(alb,mix(alb*vec3(.6,.7,.95),alb*vec3(1.16,1.1,1.),smoothstep(.36,.62,colm)),flK*.8);
  alb*=1.+.16*nz*smoothstep(.82,.98,vAO)*(1.-talus);                                             // a lip, an arris: weathered pale
  float low=1.-smoothstep(58.,96.,P.y+sn*40.);
  float veg=lie*smoothstep(.47,.55,fbm(P.xz*.06+9.)+.3*(sn-.5))*low*smoothstep(.6,.72,Ng.y);
  veg=max(veg,(1.-smoothstep(.07,.2,steep))*(1.-smoothstep(30.,100.,P.y+sn*50.))*soft);
  veg*=1.-.85*nz*smoothstep(5.,22.,P.y);
  alb=mix(alb,tundraCol(P.xz,fwp)*(.85+.3*g1),veg*(1.-.25*talus));
  alb=mix(alb,vec3(.74,.78,.86),snow);
  // relief in metres (fine grain, strata, stones); the blocks' own faces are set below
  float stoneH=(min(s0.x*2.2,1.)*1.6*l0+min(s1.x*2.,1.)*.5*l1*(1.-.6*l0)+min(s2.x*2.,1.)*.16*l2)*talus*(1.-veg)*bareS;
  float hgt=(str-.5)*.06*slope*nmag-chute*1.2-streak*.14+stoneH+((g1-.5)*.1+(g2-.5)*.025)*nmag;
  hgt*=bareS;
  vec3 dpx=dFdx(P), dpy=dFdy(P); float hx=dFdx(hgt), hy=dFdy(hgt);
  vec3 r1=cross(dpy,Ng), r2=cross(Ng,dpx); float det=dot(dpx,r1);
  vec3 gb=(hx*r1+hy*r2)*(sign(det)/max(abs(det),1e-7));
  gb*=min(1.,.9/max(length(gb),1e-4));
  vec3 nb=Ng-gb;
  float rk=bareS*(1.-veg)*(1.-talus)*mix(1.,.5,mag)*jk*mix(.25,1.,graze);
  // every block faces its own way a little; where it stands proud its side shows: a ledge top, an overhang, a joint face
  nb+=((vec3(A.x,fract(A.x*7.31),fract(A.x*13.7))-.5)*.5*A.w+(vec3(B.x,fract(B.x*7.31),fract(B.x*13.7))-.5)*.36*B.w*kB+(vec3(C.x,fract(C.x*7.31),fract(C.x*13.7))-.5)*.24*C.w*kC)*rk*mix(.2,1.,smoothstep(.35,.9,slope));   // (a dome is jointed granite, not scales: a block's own tilt shows on walls) (on near-level rock under a low sun a strong tilt puts every other block in shade: a checker)
  nb+=(vec3(s0.y,fract(s0.y*7.31),fract(s0.y*13.7))-.5)*.7*l0*talus*(1.-veg)*bareS+(vec3(s1.y,fract(s1.y*5.31),fract(s1.y*11.7))-.5)*.5*l1*(1.-l0)*talus*(1.-veg)*bareS;
  nb+=((vec3(fq1.y,fract(fq1.y*7.31),fract(fq1.y*13.7))-.5)*.16*lf1+(vec3(fq2.y,fract(fq2.y*5.31),fract(fq2.y*11.7))-.5)*.07*lf2)*(1.-veg)*(1.-talus);
  nb=nb/max(length(nb),1e-4);
  nb=mix(nb,fnA,fkA*A.w*.9*rk); nb=mix(nb,fnB,fkB*B.w*.8*rk); nb=mix(nb,fnC,fkC*C.w*.6*rk);
  vec3 N=nb/max(length(nb),1e-4);
  float sh=texture2D(uShade,${SHADE_UV},mag*3.).r; float cs=cloudShadow(P.xz);     // (magnified, a texel of the baked shadow is 80 m: read it blurred)
  // (round the bastion the low sun's shadows are baked a second time, a metre and a half fine: a buttress throws a hard edge)
  vec2 sN=vec2((P.x-(${NSH.x0.toFixed(1)}))/${(NSH.x1 - NSH.x0).toFixed(1)},(P.z-(${NSH.z0.toFixed(1)}))/${(NSH.z1 - NSH.z0).toFixed(1)});
  float eN=min(min(sN.x,1.-sN.x),min(sN.y,1.-sN.y));
  sh=mix(sh,texture2D(uShadeN,clamp(sN,0.,1.)).r,smoothstep(0.,.05,eN)*nmag);
  sh=mix(sh,1.,uBare*(1.-vInst)*smoothstep(146.,160.,P.y));      // (the towers' heads stand in the sun; a loose block has the light of the ground it lies on)
  cs=mix(cs,1.,.75*smoothstep(110.,160.,P.y));               // high ground catches the sun under the cloud deck
  cs=mix(cs,1.,1.-smoothstep(70.,230.,length(P.xz-vec2(-30.,140.))));   // and a gap in the deck stands over the spur
  cs=mix(cs,1.,.88*nz);                                       // and over the bastion: the low sun models it
  float occ=smoothstep(.16,.62,vAO);                          // gullies, hollows, and the ground a block stands on
  float ndl=max(dot(N,uSunL),0.), ao=mix(.68+.1*uBare,1.,vAO)*(1.-.3*chute)*(1.-.4*dark*(1.-veg)*bareS)*(.84+.16*occ);     // (a gully is slate-blue under the sky, not soot)
  float sunK=sh*cs*mix(.1+.2*uBare+.3*vInst,1.,occ)*(1.-.5*dark*(1.-veg)*bareS);   // (a loose block is dark at its foot, not black)
  float con=clamp(vCon,0.,1.), litK=clamp(sh*cs,0.,1.)*vInst;   // the ground a block stands on; a block's extra fill is for one that stands in the sun
  ao*=1.-.5*con; sunK*=1.-.85*con;
  // a range a few kilometres off under a low sun: what the sun only grazes is in shade, and the shade is deep and blue
  // a block's own tilt shades it by degrees: it never throws a sunlit face wholly into shade, nor lights one in a
  // shadowed face (that was a checker of cream and navy squares from the gate); the side faces of proud blocks keep theirs
  float ndG=max(dot(Ng,uSunL),0.), fcK=clamp(max(fkA*A.w,max(fkB*B.w,fkC*C.w))*rk,0.,1.);
  ndl=mix(clamp(ndl,ndG*.6,ndG*1.25+.3),ndl,fcK);
  float amb=mix(1.,.72,mag); ndl=mix(ndl,smoothstep(.25,.7,ndl),mag);
  ndl=mix(ndl,ndl*.7+.3*clamp(dot(N,uSunL)*.5+.5,0.,1.),vInst);       // a loose block is lit round its corners: no facet of it is a black shard
  // (a loose block in shade still stands in the light thrown back by the lit rock round it: slate, never a navy sliver)
  vec3 col=alb*(uSunCol*ndl*sunK+(uSkyCol*mix(.74+.6*N.y,1.05+.35*N.y,litK)+uSunCol*(.04+.1*litK)*(1.-.5*N.y)*(1.-mag)*mix(.4,1.,sh*cs)+(uPal[1]*.05+uPal[6]*.05)*(1.-N.y))*ao*amb*mix(vec3(1.),vec3(.8,.93,1.2),mag));
  vec3 Hh=uSunL+V; Hh/=max(length(Hh),1e-4);
  float nv=length(fwidth(N)), pw=40./(1.+nv*30.);
  float sp=pow(max(dot(N,Hh),0.),pw)*sunK*(pw+2.)/42.;                    // wet glint after the shower: a sheen, never a sparkle
  col+=uSunCol*sp*(.1+.22*snow)*(.3+.7*g2);
  col=mix(col,uHazeCol*1.12,mag*(1.-exp(-max(vDepth,0.)*.00042))*.5);    // as a range it stands in more air
  float alpha=1.;
  ${FINISH}
}`;

const PLAIN_VS = /* glsl */`
varying vec3 vP;
${FOG_V}
void main(){ vP=position; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const PLAIN_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform sampler2D uMap; uniform sampler2D uShade;
uniform float uFadeD; uniform vec4 uWake[10];
varying vec3 vP;
// x = gap between the two nearest cells, y = the cell's id, zw = from the cell's centre to here
vec4 cells(vec2 p){
  vec2 i=floor(p), f=fract(p), rb=vec2(0.); float d1=9., d2=9., id=0.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y)); vec2 r=g+vec2(h21(i+g),h21(i+g+57.3))*.8+.1-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; id=h21(i+g+11.7); rb=r; } else if(d<d2){ d2=d; }
  }
  return vec4(sqrt(d2)-sqrt(d1),id,-rb);
}
// The coastal plain is seen from 200 m up and from 18 m up, so it is built as things with an outline at every size,
// each fading to its mean by the size of a pixel on the ground: oriented thaw lakes and drained lake basins a hundred
// metres long, beaded streams, ice-wedge polygons at two sizes with wet troughs and pooled low centres, cushions of
// single plants; along the river gravel bars with cobbles, wet threads between the bars, shoals under shallow water.
void main(){
  if(uFadeD<=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))) discard;
  vec3 P=vP; vec2 p=P.xz;
  vec3 toC=uCamL-P; float dist=length(toC); vec3 V=toC/max(dist,1e-3);
  vec2 dpx=dFdx(p), dpy=dFdy(p);
  float fw=abs(dpx.x)+abs(dpy.x)+abs(dpx.y)+abs(dpy.y);
  float fq=sqrt(max(sqrt(max(length(dpx)*length(dpy),1e-9))*fw,1e-9));    // ground seen aslant: a pixel is long but narrow
  vec2 sdir=uSunL.xz/max(length(uSunL.xz),1e-3);
  vec2 muv=vec2((p.x-(${MAP.x0}.))/${MAP.x1 - MAP.x0}.,(p.y-(${MAP.z0}.))/${MAP.z1 - MAP.z0}.);
  float inMap=step(0.,muv.x)*step(muv.x,1.)*step(0.,muv.y)*step(muv.y,1.);
  vec4 m=texture2D(uMap,muv)*inMap;
  vec2 suv=${SHADE_UV};
  float sh=mix(1.,texture2D(uShade,suv).r,step(0.,suv.x)*step(suv.x,1.)*step(0.,suv.y)*step(suv.y,1.));
  float cs=cloudShadow(p);
  // coast: lagoon behind barrier islands, then the sea (a level shore: a wavy one reads as a bent horizon)
  float cn=(fbm(p*.004+3.)-.5)*64.+(fbm(p*.02)-.5)*20.;
  float lag=smoothstep(0.,16.,(${SHORE}.+cn)-p.y);
  float zb=${SHORE - 340}.+(fbm(vec2(p.x*.0016,2.))-.5)*90.;
  float gapn=vn(vec2(p.x*.0035,7.));
  float wB=34.+80.*smoothstep(.3,.55,gapn);
  float isl=(1.-smoothstep(wB*.55,wB,abs(p.y-zb)+(vn(p*.03)-.5)*10.))*smoothstep(.26,.36,gapn)*clamp(wB*2./(fw+1.),0.,1.);
  // the river's own ground: gravel bars and what grows along them
  float gn=vn(p*.09), rip=1./(1.+fw*.5);
  float kf1=clamp(1.5-fq*2.,0.,1.), kf2=clamp(1.5-fq*7.,0.,1.);
  float fine=(vn(p*.6+3.)-.5)*.07*kf1+(vn(p*2.3+9.)-.5)*.035*kf2;
  // seen from low down no edge on the river is a ruled line: bays and spits a few metres across, then single stones
  float kfr=clamp(1.5-fq*.7,0.,1.), rag=((vn(p*.23+7.)-.5)*.6+(vn(p*.71+3.)-.5)*.34)*kfr+(vn(p*1.9+13.)-.5)*.2*kf1;
  float gb=clamp(m.g+((gn-.5)*.24+(vn(p*.031+3.)-.5)*.3+(vn(p*.011+9.)-.5)*.2+fine+rag*.16)*smoothstep(0.,.2,m.g)*(1.-smoothstep(.9,1.,m.g)),0.,1.);
  float river=smoothstep(.02,.3,gb), dry=1.-river;
  // ---- the tundra
  vec3 crim=uPal[1]*.55, gold=uPal[2]*.55, rus=uPal[3]*.55, pale=uPal[0]*.44, dkg=vec3(.06,.085,.04), soil=vec3(.05,.04,.035);
  vec3 t=tundraCol(p,fw), t0=t;
  float wetz=smoothstep(.42,.6,fbm(p*.0055+9.));
  // ice-wedge polygons: 17 m, and 5 m inside them; each cell of its own tone, troughs dark and wet, rims lit on the
  // sunward side, some low centres pooled
  // (polygon ground comes in fields, never wall to wall, and no cell is a tile: the net is bent by the ground's own grain)
  float pmask=smoothstep(.4,.62,fbm(p*.0042+17.)+.12*(vn(p*.019+3.)-.5));
  vec2 pw=(vec2(vn(p*.035+11.),vn(p*.035+47.))-.5)*1.1+(vec2(vn(p*.13+5.),vn(p*.13+29.))-.5)*.35;
  vec4 pg=cells(p*.06+fbm(p*.01)*1.5+pw), pg2=cells(p*.21+7.+(vn(p*.05)-.5)*.5+pw*1.7);
  float pf1=clamp(1.6-fq*.75,0.,1.)*pmask, pf2=clamp(1.7-fq*1.6,0.,1.)*(.35+.65*pmask);
  float tr1=(1.-smoothstep(.02,.09+fq*.05,pg.x))*pf1, tr2=(1.-smoothstep(.03,.12+fq*.18,pg2.x))*pf2*(.45+.55*wetz);
  float rimL=dot(pg.zw/max(length(pg.zw),1e-3),sdir)*smoothstep(.03,.1,pg.x)*(1.-smoothstep(.1,.3,pg.x));
  t*=mix(1.,.84+.32*pg.y,pf1*.85);
  t=mix(t,mix(t,pale,.6),smoothstep(.08,.14,pg.x)*(1.-smoothstep(.16,.32,pg.x))*pf1*.2*(1.-.6*wetz));   // raised rims, dry and pale
  t*=1.+.34*rimL*pf1;
  // frost hummocks five metres across: each a low dome, lit on its sunward side and in shade on the other
  float hl2=length(pg2.zw), hsd=dot(pg2.zw/max(hl2,1e-3),sdir);
  t*=1.+(.3*hsd*smoothstep(.04,.3,hl2)-.1*smoothstep(.1,.42,hl2))*pf2;
  // cushions of single plants, a metre and a half across (seen only from low down)
  vec4 cu=cells(p*.7+3.+(vn(p*2.1)-.5)*.3);
  float pf3=clamp(1.6-fq*2.3,0.,1.), qc=fract(cu.y*5.71+pg.y*1.3);
  vec3 cc=mix(crim,gold,step(.36,qc)); cc=mix(cc,rus,step(.56,qc)); cc=mix(cc,pale,step(.76,qc)); cc=mix(cc,dkg*1.6,step(.9,qc));
  float csd=dot(cu.zw/max(length(cu.zw),1e-3),sdir);
  float cul=length(cu.zw), cuk=smoothstep(.08,.4,cul);
  t=mix(t,mix(soil*(1.-.5*max(-csd,0.)),cc*(.8+.4*fract(cu.y*9.1))*(1.+(.5*max(csd,0.)-.36*max(-csd,0.))*cuk),smoothstep(.02,.12,cu.x)),pf3*.7);
  t*=mix(1.,.8+.4*vn(p*4.3+1.),clamp(1.5-fq*13.,0.,1.));
  t=mix(t,t*.62+vec3(.012,.03,.004),wetz*.4);                                    // sedge meadow in the wet ground
  t=mix(t,t*.3+vec3(.008,.01,.014),max(tr1*.85,tr2*.62));
  // oriented thaw lakes and drained basins: ellipses a little west of north, each with a wet dark margin
  vec2 lq=vec2(p.x*.9781+p.y*.2079,-p.x*.2079+p.y*.9781);
  vec4 lk=cells(vec2(lq.x/165.,lq.y/290.)+(fbm(p*.0021+5.)-.5)*.5+13.);
  float lsz=.2+.2*fract(lk.y*7.31);
  float le=length(lk.zw)/lsz+(vn(p*.021+7.)-.5)*.34+(vn(p*.075)-.5)*.12*clamp(1.5-fq*.2,0.,1.);
  float aaL=max(fwidth(le)*.8,.012);
  float isLake=step(.58,lk.y), isBasin=step(.3,lk.y)*(1.-isLake);
  float inL=1.-smoothstep(1.-aaL,1.+aaL,le);
  float lake=inL*isLake*dry;
  float marg=(1.-smoothstep(1.,1.28+aaL,le))*(1.-inL)*(isLake+isBasin)*dry;
  t=mix(t,dkg*1.3+t*.2,marg*.75);
  // a drained basin: pale sedge and gold grass in rings round the pond that is left
  float bas=inL*isBasin*dry, ring=.5+.5*sin(le*17.+vn(p*.03)*4.);
  vec3 bcol=mix(mix(gold*.95,pale*1.05,.5),dkg*2.2,.3+.3*ring*clamp(1.4-fwidth(le)*9.,0.,1.))*(.8+.35*vn(p*.06+4.));
  t=mix(t,bcol,bas*.85);
  float bpond=bas*(1.-smoothstep(.34-aaL,.34+aaL,le+(vn(p*.05+17.)-.5)*.2));
  float pn=fbm(p*.011+40.)+.22*vn(p*.05);
  float pond=max(smoothstep(.83,.86,pn),step(.8,pg.y)*(1.-smoothstep(.13,.2,length(pg.zw)+(vn(p*.4)-.5)*.08))*wetz*pf1);      // a pond in some low centres
  t=mix(t,t*.5+vec3(.0,.012,.0),smoothstep(.66,.77,pn)*.7);
  // channel fringe: gold willow line, dark sedge, then gravel bar
  t=mix(t,uPal[2]*.5*mix(1.,.7+.5*cu.y,pf3),smoothstep(.05,.2,gb)*(1.-smoothstep(.26,.4,gb))*.42*smoothstep(.42,.62,vn(p*.045+8.)+(vn(p*.3)-.5)*.3*kf1)*mix(1.,.35+.65*smoothstep(.04,.14,cu.x)*step(.3,fract(cu.y*3.7)),pf3));
  t=mix(t,vec3(.1,.11,.05),smoothstep(.26,.38,gb)*(1.-smoothstep(.44,.54,gb))*.8*smoothstep(.3,.55,vn(p*.06+3.)));
  // gravel: cobbles near, each with a lit side and a dark gap; pale dry tops, darker damp hollows, drift lines
  vec4 cb=cells(p*1.25+5.);
  float pfc=clamp(1.6-fq*6.,0.,1.);
  vec3 gravel=mix(uPal[4]*.36,uPal[0]*.42,vn(p*.17))*mix(.97,.8+.34*vn(p*1.4),rip);
  gravel*=mix(1.,(.72+.5*cb.y)*(1.+.3*dot(cb.zw/max(length(cb.zw),1e-3),sdir))*(.6+.4*smoothstep(.02,.14,cb.x)),pfc*.85);
  gravel*=.86+.28*smoothstep(.4,.6,vn(vec2(p.x*.05+p.y*.012,p.y*.021-p.x*.004)+31.));     // bars laid down in long lenses
  vec4 cb2=cells(p*.33+9.+(vn(p*.9)-.5)*.4);
  float pfb=clamp(1.6-fq*1.5,0.,1.), patchK=smoothstep(.4,.62,vn(p*.07+23.));
  gravel*=mix(1.,(.8+.36*cb2.y)*(1.+.2*dot(cb2.zw/max(length(cb2.zw),1e-3),sdir))*(.7+.3*smoothstep(.03,.16,cb2.x)),pfb*.7*patchK);   // boulder patches
  gravel*=mix(1.,.84+.3*vn(p*.42+7.)+.12*(vn(p*1.1+5.)-.5),kfr*.8);
  float damp=1.-smoothstep(.02,.07,abs(vn(vec2(p.x*.09+p.y*.02,p.y*.028-p.x*.006)+47.)-.5)+(vn(p*.5+3.)-.5)*.03);
  gravel=mix(gravel,gravel*vec3(.52,.56,.62),damp*.7*kfr);                                   // damp threads where the last flood ran
  float drift=smoothstep(.45,.49,abs(fract((m.r*3.+vn(p*.06+5.)*.6)*1.7)-.5));
  gravel=mix(gravel,vec3(.07,.06,.05),drift*.3*kf1*smoothstep(.05,.3,m.r));                 // drift lines of twigs along the old waterlines
  float bar=smoothstep(.46,.58,gb);
  vec3 alb=mix(t,gravel,bar);
  float isv=smoothstep(.6,.66,vn(p*.055+1.7)+(vn(p*.37+2.)-.5)*.2*kfr+(vn(p*1.3)-.5)*.1*kf1)*(1.-smoothstep(.08,.3,m.r));
  vec3 scrub=mix(mix(vec3(.1,.115,.05),uPal[2]*.42,smoothstep(.35,.65,vn(p*.5+9.))),t0*.75,.3);
  scrub*=mix(1.,(.72+.5*cu.y)*(.55+.45*smoothstep(.02,.12,cu.x))*(1.+.2*csd),pf3);
  alb=mix(alb,scrub,bar*isv);                                       // willow and sedge on the higher bars
  // fine silt laid down in the lee of the bars: smooth and pale, ripple-marked where the last flood drained off it
  float siltK=smoothstep(.5,.6,vn(p*.045+61.)+(vn(p*.21+9.)-.5)*.25*kfr)*bar*(1.-isv)*smoothstep(.6,.85,gb);
  vec3 siltC=mix(uPal[0]*.43,uPal[6]*.4,vn(p*.08+3.))*(.92+.12*vn(p*.9+5.));
  siltC*=1.+.07*sin(dot(p,vec2(.9,.44))*7.+vn(p*.35)*7.)*clamp(1.5-fq*11.,0.,1.);
  alb=mix(alb,siltC,siltK*.85);
  // the herd's own trails over the bars and the silt: trodden lines that part and join, pocked with hoof prints
  float tn2=(vn(p*.017+13.)*2.4+vn(p*.06+29.)*.5)*3.2, tw2=abs(fract(tn2)-.5)/max(fwidth(tn2),1e-5)*fq;
  float trk=(1.-smoothstep(.3,.7+fq,tw2))*bar*clamp(1.5-fq*2.,0.,1.)*smoothstep(.35,.5,vn(p*.011+71.));
  alb=mix(alb,alb*.5,trk*(.4+.6*smoothstep(.3,.6,vn(p*2.7+tn2*5.))));
  // the waterline, drawn below: wl rises through .66 where the stream begins (m.r is the map's soft-edged channel)
  float wn=(vn(p*.045+2.)-.5)*.45+(gn-.5)*.2+fine*1.6+rag*.5;
  float wl=m.r+wn, aw=clamp(fwidth(wl)*1.2,.02,.125);
  float wetl=smoothstep(.34,.6,wl)*bar;                            // the dark wet line the falling river leaves along every bar
  alb=mix(alb,alb*vec3(.4,.43,.47),wetl);
  alb=mix(alb,mix(gravel,uPal[2]*.5,gn*.6),isl);
  alb=mix(alb,vec3(.8,.84,.9),uSnow*.5*smoothstep(.5,.7,fbm(p*.02+77.))*(1.-bar));
  vec3 land=alb*(uSunCol*.42*sh*cs+uSkyCol*.95+uHorizCol*.2);      // (in shade the ground is still under the whole lit sky)
  // ---- water. The channels: soft-edged in the map, given a hard, ragged waterline here. Wet threads between the bars.
  float chan=smoothstep(.66-aw,.66+aw,wl);
  float shal=chan*(1.-smoothstep(.72,1.02,wl));                    // the shallow margin: the stones of the bar show through it
  float thal=smoothstep(.4,.62,vn(vec2(p.x*.05+p.y*.012,p.y*.015-p.x*.004)+3.)+(vn(p*.19+5.)-.5)*.3*kf1);
  float deep=smoothstep(.6,.88,m.r+wn*.6)*(.2+.8*thal);         // the thalweg wanders; shoals show through the rest
  float still=max(max(pond,bpond),lake)*(1.-smoothstep(.15,.35,gb));
  still=max(still,tr1*wetz*.75*(1.-smoothstep(.15,.35,gb)));       // the troughs of the wet polygons stand full of water
  still=max(still,lag*(1.-isl));
  float wat=max(chan,still);
  // ripples: wind ruffles on still water, riffles running with the stream in the channels
  // (trains of small waves crossing one another, their crests bent by a slow warp and drawn out along the stream:
  // sines, so there is no lattice in them; each train fades to flat where a pixel is longer than its wave)
  float ruf=mix(1.,.35+1.3*vn(p*.02-uTime*vec2(.5,.12)),still*(1.-chan));
  float rk=clamp(1.5-fq*2.5,0.,1.), rk0=clamp(1.5-fq*.6,0.,1.), rk2=clamp(1.5-fq*7.,0.,1.), rk3=clamp(1.5-fq*15.,0.,1.);
  // (the warp is kept small: a strong one bends the crests into marbled swirls when the water fills the foreground)
  vec2 wq=p+(vec2(vn(p*.09+3.),vn(p*.09+19.))-.5)*3.+(vec2(vn(p*.37+7.),vn(p*.37+31.))-.5)*.7, gw=vec2(0.);
  float tw=uTime;
  gw+=vec2(.52,.2)*.022*cos(dot(wq,vec2(.52,.2))+tw*1.3)*rk0+vec2(-.37,.3)*.026*cos(dot(wq,vec2(-.37,.3))-tw*1.1)*rk0;
  gw+=vec2(1.3,.31)*.045*cos(dot(wq,vec2(1.3,.31))+tw*2.1)*rk+vec2(-1.05,.6)*.05*cos(dot(wq,vec2(-1.05,.6))-tw*1.8)*rk+vec2(1.9,-.45)*.03*cos(dot(wq,vec2(1.9,-.45))+tw*2.9)*rk;
  gw+=vec2(4.3,.9)*.011*cos(dot(wq,vec2(4.3,.9))+tw*4.4)*rk2+vec2(-3.4,1.7)*.012*cos(dot(wq,vec2(-3.4,1.7))-tw*3.9)*rk2+vec2(6.1,-1.3)*.007*cos(dot(wq,vec2(6.1,-1.3))+tw*5.6)*rk2;
  // (a light chop over the trains, so that no two crests are alike)
  // wavelets a hand long, close under the lens
  gw+=vec2(9.1,2.3)*.0046*cos(dot(wq,vec2(9.1,2.3))+tw*6.8)*rk3+vec2(-7.4,5.2)*.005*cos(dot(wq,vec2(-7.4,5.2))-tw*6.1)*rk3+vec2(12.7,-3.1)*.0032*cos(dot(wq,vec2(12.7,-3.1))+tw*8.2)*rk3;
  gw+=(vec2(vn(wq*.8+vec2(tw*.5,0.)),vn(wq*.8+vec2(7.,-tw*.4)))-.5)*.045*rk+(vec2(vn(wq*2.6+vec2(-tw*.9,3.)),vn(wq*2.6+vec2(11.,tw*.8)))-.5)*.08*rk2+(vec2(vn(wq*7.3+vec2(tw*1.7,5.)),vn(wq*7.3+vec2(3.,-tw*1.4)))-.5)*.06*rk3;
  // V wakes behind the caribou that wade the shallows
  float wakeK=0.;
  for(int i=0;i<10;i++){
    vec2 q=p-uWake[i].xy, wd=uWake[i].zw; float l=length(wd);
    float bh=-dot(q,wd)/max(l,1e-3);
    if(l>.01&&bh>0.&&bh<13.){ wd/=l; float sd=dot(q,vec2(-wd.y,wd.x)), arm=abs(sd)-bh*.42;
      float k=exp(-min(arm*arm/(.04+bh*.035),30.))*smoothstep(0.,.8,bh)*(1.-smoothstep(3.,10.,bh));
      wakeK+=k; gw+=vec2(-wd.y,wd.x)*(sd<0.?-1.:1.)*k*.5; }
  }
  vec3 Nw=vec3(-gw.x,1.,-gw.y);
  Nw.xz*=ruf*mix(1.,1.7,(1.-deep)*chan); Nw/=max(length(Nw),1e-4);
  vec3 R=reflect(-V,Nw); R.y=abs(R.y)+.02; R/=max(length(R),1e-4);
  // (the sky lies in the water as a picture: it is looked up with the ripples calmed, and the ripples are drawn over it)
  vec3 Ns=vec3(Nw.x*.3,Nw.y,Nw.z*.3); Ns/=max(length(Ns),1e-4);
  vec3 Rs=reflect(-V,Ns); Rs.y=abs(Rs.y)+.02; Rs/=max(length(Rs),1e-4);
  float fres=mix(mix(.3,.14,chan),1.,pow(1.-clamp(V.y,0.,1.),3.4));
  vec3 sky=skyMirror(mix(R,Rs,chan)); sky=mix(sky,uSkyCol*.5,.7*max(pond,bpond)*(1.-chan)*(1.-lag)*(1.-lake));
  // the water carries the sky: the clouds lie in it, slate-based and lit cream toward the sun, and the ripples break their edges
  { float cup=clamp(Rs.y,0.,1.); vec2 cq=Rs.xz/(cup+.32)*1.7+uTime*vec2(.006,.002);
    float cl=fbm(cq)+.25*vn(cq*3.1+7.), clm=smoothstep(.5,.68,cl)*smoothstep(.03,.25,cup)*(1.-uAurora);
    float wR=dot(Rs.xz/max(length(Rs.xz),1e-4),sdir)*.5+.5;
    sky=mix(sky,mix(uSkyCol*.7,uHorizCol*.6+uSunCol*.08,clamp(wR*.7+.4*smoothstep(.55,.8,cl),0.,1.)),clm*.6*chan); }
  float gust=vn(p*.02-uTime*vec2(.5,.12));
  // glacial water: milky with silt, paler over the shoals and their gravel, a darker thread down the thalweg; seen
  // from above it is this body that shows, seen aslant the sky lies on it
  float shoal=smoothstep(.35,.65,vn(vec2(p.x*.05+p.y*.014,p.y*.016-p.x*.005)+3.)+(vn(p*.21+5.)-.5)*.3*kf1);
  vec3 silt=mix(vec3(.25,.31,.35),gravel*vec3(.66,.76,.82),max(.45*shoal*(1.-deep),shal*.9));
  silt=mix(silt,vec3(.07,.12,.18),deep*.9*(1.-shal));
  vec3 bed=silt*(uSunCol*.34*sh*cs+uSkyCol*.9+uHorizCol*.2);
  vec3 dark=vec3(.02,.03,.035)*(uSkyCol.b*2.+.3);
  float rs=clamp(1.4-fq*1.6,0.,1.);
  vec3 wcol=sky*fres*mix(1.,.72+.4*gust,still*(1.-chan))+mix(dark,bed,chan)*(1.-fres*mix(1.,.55,shal));
  // every ripple has a face to the low sun and a face away from it (close to: this is what the water is made of)
  wcol*=(1.+clamp(-dot(gw,sdir)*5.,-.32,.26)*mix(.5,1.,chan))*mix(1.,.84,chan*rs);
  wcol+=uSkyCol*.2*chan*smoothstep(.66-aw*4.,.66,wl)*(1.-smoothstep(.66+aw,.66+aw*5.,wl))*clamp(1.5-fq*3.,0.,1.);   // the bright line where the water meets the bar
  // the low sun on the water: threads kindle in turn; toward the sun a path of glitter
  float kin=smoothstep(.55,1.,sin(6.2832*(m.b*3.+uTime*.05+p.x*.0005)));
  float gl=vn(wq*vec2(1.25,1.05)+vec2(uTime*1.3,uTime*2.4))*.7+vn(wq*3.1-vec2(uTime*2.2,uTime*.9))*.3;   // (a sparkle the size of a ripple: drawn out along the stream it was a smear from low down)
  gl=mix(.14,gl*gl*gl*2.6,rs);
  float sunw=max(dot(R,uSunL),0.), s8=sunw*sunw; s8*=s8; s8*=s8;
  float s48=s8*s8*s8; s48*=s48;
  float glit=s48*(.12+1.1*min(gl*gl,2.2))+s8*.14;
  wcol+=uSunCol*((.04+.13*kin)*gl*chan+glit*.62*wat)*sh*cs;
  wcol+=uSunCol*.25*cs*gl*lag*(1.-isl)*(1.-chan);
  // seen from the ridge: light runs down the channels reach after reach, each channel in its own time (wind and sun
  // on moving water; close to, the ripples themselves do this)
  float runw=sin(p.y*.019+p.x*.007+uTime*1.25+m.b*37.)*.6+sin(p.y*.047-p.x*.011+uTime*2.1+m.b*11.)*.4;
  wcol*=mix(1.,.8+.42*smoothstep(-.5,.7,runw),(1.-rs)*chan*.9);
  wcol+=uSunCol*.07*smoothstep(.45,.9,runw)*(1.-rs)*chan*sh*cs*(.5+.5*kin);
  wcol=mix(wcol,vec3(.75,.8,.86)*(uSkyCol*2.+.3),uSnow*.6*smoothstep(.55,.7,m.r)*(1.-smoothstep(.8,.95,m.r))); // ice rims
  wcol+=(uSkyCol*1.2+uSunCol*.25*sh*cs)*min(wakeK,1.)*.3*chan;
  land=mix(land,land*.7+sky*.2,wetl*(1.-chan));                     // wet stones and wet silt shine a little
  vec3 col=mix(land,wcol,wat);
  // river mist at frost dawn: separate low wisps along the water, never a sheet (close to, the water is clear)
  float mw=fbm(p*.0105+vec2(uTime*.03,7.))*.72+vn(p*.043-vec2(uTime*.05,3.))*.28;
  float mist=uMist*smoothstep(.55,.72,mw)*smoothstep(.2,.7,m.r+.3*smoothstep(.3,.85,gb))*.62*smoothstep(40.,340.,dist);
  col=mix(col,(uSkyCol*1.6+uSunCol*.2*cs),mist);
  float alpha=1.;
  ${FINISH}
}`;

// ---- frost-shattered granite: a sheaf of jointed pillars of very unequal height. Every pillar is a column of
// irregular five- or six-sided section, cut by cross joints into drums that sit a little askew on one another with a
// dark recessed seam between, and broken off at the top along a steep plane with the arrises knocked away. Tall thin
// ones stand at the heart, stumps and splinters round the foot; the finer joints are drawn by the rock shader.
function towerGeo(rng, height, rad, nOuter = 0) {
  const pos = [], ao = [];
  const tri = (a, b, c, s) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); ao.push(s[0], s[1], s[2]); };
  const pillar = (cx, cz, r, base, top, sides, lean) => {
    const angs = [], rr = []; let a0 = rng() * 6.283;
    for (let i = 0; i < sides; i++) { angs.push(a0); a0 += (6.283 / sides) * rng.range(0.7, 1.3); rr.push(r * rng.range(0.82, 1.18)); }
    const hgt = Math.max(top - base, 1), inner = 0.5 + 0.5 * clamp(Math.hypot(cx, cz) / (rad * 0.75), 0, 1);     // the heart of the sheaf is in its own shade
    const aoOf = (y, k = 1) => clamp((0.34 + (y - base) / (height * 0.42)) * inner * k, 0.2, 1);
    // a ring of the section at height y: k scales it, (ox, oz) shifts it, (tx, tz) tilts its plane
    const ring = (y, k, ox, oz, tx, tz) => angs.map((a, i) => {
      const px = Math.cos(a) * rr[i] * k, pz = Math.sin(a) * rr[i] * k;
      return [cx + lean[0] * (y - base) + ox + px, y + tx * px + tz * pz, cz + lean[1] * (y - base) + oz + pz];
    });
    const band = (A, B, sa, sb) => { for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; tri(A[i], B[i], A[j], [sa, sb, sa]); tri(A[j], B[i], B[j], [sa, sb, sb]); } };
    let y = base - 3, k = 1.1, ox = 0, oz = 0, guard = 0;
    while (y < top - 0.05 && guard++ < 9) {
      let bh = hgt * rng.range(0.16, 0.34) + 0.8; const last = y + bh > top - 0.16 * hgt; if (last) bh = top - y;
      const y1 = y + bh, k1 = k * rng.range(0.9, 0.99), seam = Math.min(0.22, r * 0.12);
      const tx = last ? 0 : rng.range(-0.1, 0.1), tz = last ? 0 : rng.range(-0.1, 0.1);
      if (!last) {
        const A = ring(y, k, ox, oz, 0, 0), B = ring(y1 - seam, k1, ox, oz, tx, tz), C = ring(y1, k1 * 0.86, ox, oz, tx, tz);
        band(A, B, aoOf(y), aoOf(y1)); band(B, C, aoOf(y1), aoOf(y1, 0.42));               // the drum, and the seam cut in under the next
        ox += rng.range(-0.1, 0.1) * r; oz += rng.range(-0.1, 0.1) * r; k = k1 * rng.range(0.94, 1.04);
        const D = ring(y1 + seam, k, ox, oz, tx, tz); band(C, D, aoOf(y1, 0.42), aoOf(y1, 0.9));
        y = y1 + seam;
      } else {
        // the broken top: a steep fracture plane, its upper arrises chamfered, a rough cap
        const ca = rng() * 6.283, ck = rng.range(0.55, 1.35), fx = Math.cos(ca) * ck, fz = Math.sin(ca) * ck, ch = r * 0.3;
        const A = ring(y, k, ox, oz, 0, 0), B = ring(y1 - ch, k1, ox, oz, fx, fz), C = ring(y1, k1 * 0.72, ox, oz, fx * 0.8, fz * 0.8);
        band(A, B, aoOf(y), aoOf(y1)); band(B, C, aoOf(y1), 1);
        const c = [0, 0, 0]; C.forEach((q) => { c[0] += q[0] / sides; c[1] += q[1] / sides; c[2] += q[2] / sides; }); c[1] += r * 0.12;
        for (let i = 0; i < sides; i++) tri(C[i], c, C[(i + 1) % sides], [1, 1, 1]);
        break;
      }
    }
  };
  const small = nOuter > 0, n1 = small ? 2 : 3, n2 = small ? Math.max(2, nOuter - 3) : rng.int(5, 6), n3 = small ? 2 : rng.int(7, 9);
  const a1 = rng() * 6.283;
  // the heart: tall thin columns leaning on one another
  for (let i = 0; i < n1; i++) {
    const a = a1 + (i / n1) * 6.283, d = i === 0 ? 0 : rad * rng.range(0.2, 0.3);
    pillar(Math.cos(a) * d, Math.sin(a) * d, rad * rng.range(0.29, 0.36), 0, height * [1, 0.84, 0.7][i] * rng.range(0.94, 1), rng.int(5, 6), [rng.range(-0.025, 0.025), rng.range(-0.025, 0.025)]);
  }
  // round it: columns of half to three quarters of the height
  for (let i = 0; i < n2; i++) {
    const a = a1 + 0.5 + (i / n2) * 6.283 + rng.range(-0.25, 0.25), d = rad * rng.range(0.44, 0.62), f = d / rad;
    pillar(Math.cos(a) * d, Math.sin(a) * d * 0.9, rad * rng.range(0.22, 0.3), -f * 2, height * rng.range(0.42, 0.78), rng.int(5, 6), [-Math.cos(a) * rng.range(0, 0.06), -Math.sin(a) * rng.range(0, 0.06)]);
  }
  // the foot: stumps and splinters
  for (let i = 0; i < n3; i++) {
    const a = a1 + (i / n3) * 6.283 + rng.range(-0.3, 0.3), d = rad * rng.range(0.74, 1.02), f = d / rad;
    pillar(Math.cos(a) * d, Math.sin(a) * d * 0.9, rad * rng.range(0.2, 0.28), -f * 2.5, height * rng.range(0.1, 0.4), rng.int(4, 6), [-Math.cos(a) * rng.range(-0.02, 0.09), -Math.sin(a) * rng.range(-0.02, 0.09)]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAO', new THREE.Float32BufferAttribute(ao, 1));
  g.setAttribute('aCon', new THREE.Float32BufferAttribute(new Float32Array(ao.length), 1));
  g.computeVertexNormals();
  return g;
}

// frost-shattered blocks: irregular convex hulls (0 slab, 1 block, 2 splinter, 3 rubble), dark toward the buried base
function hullGeo(rng, kind) {
  const n = [11, 13, 10, 12][kind], ex = [1.2, 1, 0.72, 1][kind], ey = [0.36, 0.74, 1.1, 0.62][kind], ez = [0.95, 0.84, 0.6, 0.92][kind], pts = [];
  const sq = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.55);            // toward a box: planar faces, sharp arrises
  for (let i = 0; i < n; i++) {
    let x = rng.range(-1, 1), y = rng.range(-1, 1), z = rng.range(-1, 1); const l = Math.hypot(x, y, z) || 1, k = rng.range(0.78, 1) / l;
    x = sq(x * k); y = sq(y * k); z = sq(z * k);
    pts.push(new THREE.Vector3((x + y * (kind === 2 ? 0.35 : 0.14)) * ex, y * ey, (z - y * 0.1) * ez));
  }
  const g = new ConvexGeometry(pts), P = g.attributes.position, ao = new Float32Array(P.count);
  for (let i = 0; i < P.count; i++) ao[i] = clamp(0.62 + 0.5 * P.getY(i) / ey, 0.42, 1);     // (the ground line is at mid-height: a shaded foot, never a black one)
  g.setAttribute('aAO', new THREE.Float32BufferAttribute(ao, 1));
  g.setAttribute('aCon', new THREE.Float32BufferAttribute(new Float32Array(ao.length), 1));
  return g;
}

// ---- herd: per animal one upright blob and one long ground shadow, never thinner than ~2 pixels
const HERD_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec3 corner; attribute vec4 aPos; attribute vec4 aDir;
uniform float uHerdAdv; uniform float uPx; uniform vec2 uShadowDir; uniform float uShLen; uniform float uNearT;
varying vec2 vUv; varying float vPart; varying float vKind; varying float vSun; varying float vLod; varying float vFlip;
${FOG_V}
void main(){
  // kind 0 cow, 1 bull, 2 Dall sheep, 3 the shadow alone of an animal that is modelled (see the near herd)
  float kind=aDir.z, own=step(2.5,kind);
  // an animal is never drawn smaller than a few pixels, so from the ridge the files read; by the same licence it is
  // never drawn smaller than 2.3 m, so that from low over the river a file is animals with legs and not a row of dots
  // (the quad holds the antlers too: the withers are at two thirds of its height, as tall as a modelled animal's)
  float hgt=mix(max(.19*aPos.w,kind>1.5?1.5:2.5*(.86+.14*aPos.w)),.19*aPos.w,own), len=hgt*1.42;
  float adv=mix(uHerdAdv*(kind>1.5?.12:1.)*(.8+.4*fract(aPos.z*7.31)),uNearT*aPos.z,own);
  vec3 c=vec3(aPos.x+aDir.x*adv,aDir.w,aPos.y+aDir.y*adv);
  vec4 mvPosition=modelViewMatrix*vec4(c,1.);
  float dist=max(-mvPosition.z,.1), S=max(length(modelMatrix[0].xyz),1e-5), px=dist*uPx;
  float nearK=1.-smoothstep(380.*S,1500.*S,dist);
  float hh=max(hgt*S,px*mix(2.4,4.3,nearK));
  vLod=clamp(1.9-hh/(px*4.6),0.,1.);                      // a blob under four pixels, an animal with legs from nine
  vec3 dv=mat3(modelViewMatrix)*vec3(aDir.x,0.,aDir.y); vFlip=dv.x<0.?-1.:1.;
  if(corner.z<.5){
    float hw=max(len*S*.62,px*mix(1.2,1.7,nearK))*(1.-own);
    mvPosition.xy+=vec2(corner.x*2.*hw,corner.y*hh*(1.-own)); mvPosition.z+=min(dist*.004,.6);
  } else {
    vec2 pr=vec2(-uShadowDir.y,uShadowDir.x);
    float wd=max(len*.8,px*mix(1.7,2.7,nearK)/S), L=max(len*uShLen,px*mix(8.,17.,nearK)/S);
    // (kind 4 and up: the shadow of a plant; its fraction shortens the shadow, and it is never fattened to be seen)
    if(kind>3.5){ wd=len*.8; L=len*uShLen*(1.-fract(kind)); }
    vec3 q=c+vec3(uShadowDir.x,0.,uShadowDir.y)*(corner.y*L)+vec3(pr.x,0.,pr.y)*(corner.x*wd);
    q.y+=.03+dist*.0006/S;
    mvPosition=modelViewMatrix*vec4(q,1.);
  }
  vUv=corner.xy; vPart=corner.z; vKind=kind; vSun=cloudShadow(c.xz);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const HERD_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
varying vec2 vUv; varying float vPart; varying float vKind; varying float vSun; varying float vLod; varying float vFlip;
void main(){
  vec3 col; float alpha;
  if(vPart<.5){
    // a caribou side on, head toward +x: a deep body carried level, the neck sloping forward and down to a small head
    // held low, two pairs of legs with daylight between them, the rack swept back over the shoulders and up
    vec2 q=vec2(vUv.x*2.*vFlip,vUv.y);
    float bull=step(.5,vKind)*step(vKind,1.5), sheep=step(1.5,vKind);
    float aa=.035;
    float body=1.-smoothstep(1.-aa*4.,1.,length((q-vec2(-.12,.5-.03*q.x))/vec2(.56,.165)));
    vec2 na=vec2(.3,.57), nb=vec2(.7,.6); vec2 pa=q-na, ba=nb-na; float hn=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
    float neck=1.-smoothstep(.1-.03*hn-aa,.1-.03*hn,length(pa-ba*hn));
    float head=1.-smoothstep(1.-aa*5.,1.,length((q-vec2(.8,.575-.25*(q.x-.8)))/vec2(.15,.07)));
    float lx=q.x-(q.y-.2)*.06, lw=.036+.02*smoothstep(.25,.42,q.y);
    float legs=step(q.y,.44)*max(max(1.-smoothstep(lw-.012,lw,abs(lx-.27)),1.-smoothstep(lw-.012,lw,abs(lx-.13))),max(1.-smoothstep(lw-.012,lw,abs(lx+.5)),1.-smoothstep(lw-.012,lw,abs(lx+.63))));
    float ay=(q.y-.63)/mix(.2,.36,bull), ax=.66-.34*ay+.42*ay*ay;
    float beam=(1.-smoothstep(.022,.045,abs(q.x-ax)))*step(0.,ay)*step(ay,1.);
    float brow=(1.-smoothstep(.02,.04,abs(q.y-.66-(q.x-.68)*.45)))*step(.68,q.x)*step(q.x,.86)*bull;
    float tine=(1.-smoothstep(.02,.04,abs(q.x-ax-.02-(ay-.62)*.5)))*step(.62,ay)*step(ay,.95);
    float ant=max(beam,max(brow,tine))*(1.-sheep);
    float blob=1.-smoothstep(.55,1.,length((q-vec2(0.,.42))/vec2(1.,.42)));
    float shape=max(max(body,neck),max(head,max(legs,ant)));
    alpha=mix(shape,blob,vLod);
    // the coat of the modelled animals: grey-brown, darker legs and belly, the pale neck and mane, the white rump
    vec3 coat=vec3(.115,.085,.06), pale=vec3(.5,.48,.43);
    vec3 hide=mix(coat,vec3(.05,.04,.032),max(legs*(1.-body),(1.-smoothstep(.36,.44,q.y))*.6));
    hide=mix(hide,pale*mix(.62,1.,bull),smoothstep(.2,.42,q.x)*(1.-smoothstep(.74,.8,q.x))*step(.4,q.y)*(1.-vLod*.6));
    hide=mix(hide,pale*.9,(1.-smoothstep(-.66,-.56,q.x))*step(.44,q.y)*(1.-vLod)*.85);
    hide=mix(hide,vec3(.34,.27,.19),ant*(1.-max(body,max(neck,head)))*(1.-vLod));
    hide=mix(hide,vec3(.82,.8,.74),sheep);
    col=hide*(uSunCol*(.14+.3*smoothstep(.3,.75,q.y))*vSun+uSkyCol*.66+uHorizCol*.08);
  } else {
    float e=1.-abs(vUv.x*2.);
    // close to, the shadow has legs: four thin strokes from the hooves, then the body
    float stripe=1.-smoothstep(.06,.13,abs(abs(vUv.x*2.+.18)-.39));
    float shp=mix(smoothstep(0.,.6,e),stripe,(1.-smoothstep(.26,.36,vUv.y))*(1.-vLod)*step(vKind,3.5));
    alpha=shp*(1.-smoothstep(.55,1.,vUv.y))*(.28+.55*vSun)*(vKind>1.5&&vKind<2.5?.5:1.);
    col=uSkyCol*.12;
  }
  if(alpha<.01) discard;
  ${FINISH}
}`;

// ---- snow geese: skeins that peel off the bars one bird after another and climb toward the spur
const GEESE_VS = /* glsl */`
${BRANCH_GLSL}
attribute float aW; attribute vec4 aA; attribute vec4 aB; attribute vec4 aO;
uniform float uPx; uniform float uEvent; uniform float uProg; uniform vec2 uRev;
varying float vTip; varying float vLit; varying float vVis; varying float vUnder;
${FOG_V}
void main(){
  float key=step(1.5,aO.w), rest=step(.5,aO.w)*(1.-key), strm=step(3.5,aO.w), key3=step(2.5,aO.w)*(1.-strm);
  float sk=mix((uProg-aA.w)/max(aB.w,1e-3),(uProg-uRev.x)/max(uRev.y,1e-3),key3);   // the last skein is keyed to the reveal over the saddle
  float s=mix(fract(uTime/aB.w+aA.w),clamp(sk+uTime*.0004,0.,1.),key);   // keyed skeins cross as the camera comes
  float q=mix(clamp(s*1.25-aO.y,0.,1.),clamp(uEvent*2.4-aO.y,0.,.93),rest);
  // a stream: chevron after chevron flies the route on the world's clock, for as long as the flight is in its window
  // (a.w = where the window opens in the finale's share, b.w = how long it is), so that whenever the camera hangs
  // over the fork there are birds on the wing in front of it, and they are moving
  float qs=fract(uTime*15./max(length(aB.xyz-aA.xyz),1.)-aO.y);
  q=mix(q,qs,strm);
  float air=max(smoothstep(0.,.03,q),key);
  vVis=mix(smoothstep(0.,.02,mix(s,q,key))*(1.-smoothstep(.92,1.,q)),1.,rest);
  vVis=mix(vVis,smoothstep(0.,.05,qs)*(1.-smoothstep(.9,1.,qs))*smoothstep(aA.w,aA.w+.02,uProg)*(1.-smoothstep(aA.w+aB.w-.03,aA.w+aB.w,uProg)),strm);
  vec3 c=mix(aA.xyz,aB.xyz,q);
  c.y=mix(aA.y,aB.y,mix(smoothstep(0.,.8,q),q,key))+sin(q*23.+aO.z*6.3)*1.2*air;
  vec2 d=aB.xz-aA.xz; d/=max(length(d),1e-3); vec2 pr=vec2(-d.y,d.x);
  vec2 gs=(vec2(fract(aO.z*13.7),fract(aO.z*7.3))-.5)*mix(16.,6.,rest);
  c.xz+=pr*aO.x*air+gs*(1.-air)+pr*sin(q*9.+aA.w*40.)*6.*air*(1.-key);
  vec4 mc=modelViewMatrix*vec4(c,1.);
  float dist=max(-mc.z,.1), S=max(length(modelMatrix[0].xyz),1e-5);
  float k=max(.3,dist*uPx*(mix(3.4,16.,key)+5.*strm)/S)*vVis;
  float flap=sin(uTime*(17.+5.*fract(aO.z*3.1))+aO.z*6.283)*air;
  vec3 v=position; v.x*=mix(.3,1.,air); v.y+=abs(v.x)*(flap*.85+.12)-aW*aW*flap*.12;
  vec3 p=c+(vec3(pr.x,0.,pr.y)*v.x+vec3(0.,1.,0.)*v.y-vec3(d.x,0.,d.y)*v.z)*k;
  vTip=aW; vLit=.5+.5*flap;
  // a skein that flies high (its route starts above 160 m) is seen from below once the camera is under it: grey
  // against the cloud, not white on white
  vUnder=step(160.,aA.y)*smoothstep(4.,40.,c.y-uCamL.y);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
  vVis*=cloudShadow(c.xz)*.6+.4;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const GEESE_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
varying float vTip; varying float vLit; varying float vVis; varying float vUnder;
void main(){
  if(vVis<.02) discard;
  vec3 col=mix(vec3(.8),vec3(.03),smoothstep(.74,.84,vTip))*(uSunCol*(.45+.75*vLit)*vVis+uSkyCol*1.8)*mix(1.,.2,vUnder);
  float alpha=1.;
  ${FINISH}
}`;

// ---- cloud shreds pouring east through the notch, and banners off the towers
const SHRED_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec2 corner; attribute vec4 aS; attribute vec4 aT;
varying vec2 vUv; varying float vFade; varying float vSeed; varying float vA;
${FOG_V}
void main(){
  float s=fract(uTime*aT.y/aT.x+aT.z), e=abs(s-.5)*2.;
  // (aT.z of 1 and over marks the shreds that cross the bastion's face: thicker than those in the notch)
  vA=mix(.34,.52,step(1.,aT.z));
  vec3 c=aS.xyz+vec3((s-.5)*aT.x,mix(-e*e*abs(aT.x)*.09,s*abs(aT.x)*.12,aT.w)+sin(s*9.+aT.z*30.)*2.,(s-.5)*aT.x*.18);
  vec4 mvPosition=modelViewMatrix*vec4(c,1.);
  float S=max(length(modelMatrix[0].xyz),1e-5), sz=aS.w*S*mix(.7+.6*s,.35+1.3*s,aT.w);
  mvPosition.xy+=corner*sz*vec2(1.9,.85);
  float dist=max(-mvPosition.z,.1);
  vFade=mix(sin(3.1416*s),smoothstep(0.,.08,s)*(1.-s)*(1.-s)*1.6,aT.w)*smoothstep(9.*S,42.*S,dist);
  vUv=corner; vSeed=aT.z;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const SHRED_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
varying vec2 vUv; varying float vFade; varying float vSeed; varying float vA;
void main(){
  vec2 q=vUv*2.; float r=1.-clamp(dot(q,q),0.,1.);
  float thick=smoothstep(.4,.7,vA);
  float n=fbm(vUv*vec2(2.4,6.5)+vSeed*37.+vec2(-uTime*.11,uTime*.03));
  n=mix(n,n*.56+.3*fbm(vUv*vec2(7.,17.)+vSeed*11.+vec2(-uTime*.2,uTime*.05))+.15*vn(vUv*vec2(19.,46.)+vSeed*5.+vec2(-uTime*.33,0.)),smoothstep(.34,.5,vA));
  // (a thin shred is a soft wisp; a thick one has a ragged edge and a body)
  float rp=smoothstep(0.,.55,r);
  float alpha=mix(smoothstep(.34,.95,n*(.35+r))*r*r,smoothstep(.4,.6,n*(.5+.85*rp))*rp,step(.45,vA))*vFade*vA;
  if(alpha<.01) discard;
  vec3 col=uSkyCol*1.8+uSunCol*(.2+.14*(.5-vUv.x)+.18*n);
  // (a thick shred has a body: lit along its top, slate under it, so that it reads against a bright sky and a pale wall)
  col=mix(col,mix(uSkyCol*1.05,uSkyCol*1.5+uSunCol*.3,smoothstep(-.3,.3,vUv.y*2.+(n-.5)*1.2)),smoothstep(.34,.5,vA));
  ${FINISH}
}`;

// ---- the near herd: the few caribou the camera passes close enough to see as animals are modelled (one bull,
// instanced: body, white neck and mane, head, four jointed legs that walk, antlers with brow, bez and top tines).
// Local frame: faces -Z, +Y up, metres, shoulder at 1.25. aPart.x = 1..4 a leg (fore left, fore right, hind left,
// hind right), 5 = neck, head and antlers; aPart.y = how far along that part (0 at the hip or the withers).
export function caribouGeo() {
  const pos = [], col = [], part = [], idx = [];
  const v3 = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // a tube through stations [x, y, z, half width, half height, colour, how far along its part], n sides; under darkens the underside
  const loft = (st, n, pt = 0, under = 1) => {
    const rings = [];
    for (let i = 0; i < st.length; i++) {
      const a = st[Math.max(0, i - 1)], b = st[Math.min(st.length - 1, i + 1)], t = nrm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
      const ref = Math.abs(t[1]) > 0.8 ? [0, 0, 1] : [0, 1, 0], u = nrm(crs(ref, t)), w = crs(t, u), s = st[i], i0 = pos.length / 3;
      for (let k = 0; k < n; k++) {
        const an = (k / n) * 6.2832, ca = Math.cos(an), sa = Math.sin(an), p = v3(v3(s, u, ca * s[3]), w, sa * s[4]);
        const sh = under < 1 && p[1] < s[1] - s[4] * 0.3 ? under : 1;
        pos.push(p[0], p[1], p[2]); col.push(s[5][0] * sh, s[5][1] * sh, s[5][2] * sh); part.push(pt, s[6] ?? 0);
      }
      rings.push(i0);
    }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < n; k++) { const a = rings[i] + k, b = rings[i] + (k + 1) % n, c = rings[i + 1] + k, d = rings[i + 1] + (k + 1) % n; idx.push(a, b, c, b, d, c); }
    for (const e of [0, rings.length - 1]) {                      // closed ends
      const s = st[e], c = pos.length / 3; pos.push(s[0], s[1], s[2]); col.push(s[5][0], s[5][1], s[5][2]); part.push(pt, s[6] ?? 0);
      for (let k = 0; k < n; k++) { const a = rings[e] + k, b = rings[e] + (k + 1) % n; if (e) idx.push(a, b, c); else idx.push(b, a, c); }
    }
  };
  const coat = [0.105, 0.072, 0.048], dark = [0.05, 0.038, 0.03], white = [0.56, 0.54, 0.49], cream = [0.36, 0.33, 0.28], horn = [0.4, 0.32, 0.22], nose = [0.03, 0.025, 0.02];
  // body, rump to breast: a white rump patch, a pale flank stripe low down, deep in the chest
  loft([[0, 1.04, 0.95, 0.05, 0.09, white], [0, 1.02, 0.84, 0.19, 0.25, white], [0, 0.99, 0.6, 0.255, 0.3, coat], [0, 0.96, 0.1, 0.27, 0.3, coat],
    [0, 0.97, -0.38, 0.27, 0.34, coat], [0, 1.02, -0.72, 0.2, 0.29, cream], [0, 1.07, -0.88, 0.12, 0.2, white]], 8, 0, 0.62);
  // neck and its hanging white mane, head and muzzle
  loft([[0, 1.1, -0.78, 0.13, 0.19, white, 0], [0, 1.27, -1.03, 0.1, 0.17, white, 0.4], [0, 1.45, -1.24, 0.085, 0.11, cream, 0.7]], 6, 5);
  loft([[0, 0.98, -0.8, 0.09, 0.15, white, 0], [0, 1.08, -1.02, 0.065, 0.17, white, 0.4], [0, 1.27, -1.2, 0.04, 0.08, white, 0.7]], 5, 5);
  loft([[0, 1.47, -1.2, 0.09, 0.1, coat, 0.75], [0, 1.47, -1.4, 0.075, 0.085, coat, 0.85], [0, 1.42, -1.6, 0.05, 0.055, dark, 0.95], [0, 1.39, -1.7, 0.04, 0.042, nose, 1]], 6, 5);
  // legs: thigh, hock or knee, cannon, hoof
  let li = 0;
  for (const z of [-0.5, 0.62]) for (const sx of [-1, 1]) {
    const x = sx * 0.15, kz = z < 0 ? -0.04 : 0.1; li++;
    loft([[x, 0.9, z, 0.085, 0.13, coat, 0], [x, 0.52, z + kz, 0.048, 0.06, dark, 0.45], [x, 0.13, z, 0.034, 0.036, dark, 0.86], [x, 0.0, z - 0.03, 0.05, 0.055, nose, 1]], 5, li);
  }
  // antlers: a beam that sweeps back, out and up and then forward at the top; brow tine over the face, bez tine, back
  // tine, two points at the top
  for (const sx of [-1, 1]) {
    const A = (pts, r0, r1) => loft(pts.map((p, i) => { const k = i / (pts.length - 1), r = lerp(r0, r1, k); return [sx * p[0], p[1], p[2], r, r, horn, 0.8]; }), 4, 5);
    A([[0.07, 1.54, -1.24], [0.19, 1.74, -1.08], [0.3, 1.95, -1.03], [0.35, 2.12, -1.14], [0.34, 2.24, -1.33]], 0.04, 0.026);
    A([[0.07, 1.56, -1.27], [0.07, 1.62, -1.5], [0.05, 1.72, -1.62]], 0.024, 0.014);
    A([[0.16, 1.7, -1.1], [0.24, 1.74, -1.32], [0.27, 1.84, -1.42]], 0.022, 0.013);
    A([[0.3, 1.95, -1.03], [0.35, 2.02, -0.85]], 0.02, 0.012);
    A([[0.34, 2.24, -1.33], [0.28, 2.36, -1.46]], 0.02, 0.012);
    A([[0.35, 2.12, -1.14], [0.47, 2.22, -1.26]], 0.02, 0.012);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// iPos = (x, z, size, walking speed in m/s; 0 grazes), iRot = (heading x, heading z, phase, how deep it stands in water),
// iUp = how much the ground rises for each metre it walks (the world's own file on the bench uses this shader too)
export const CARI_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec3 color; attribute vec2 aPart; attribute vec4 iPos; attribute vec4 iRot; attribute float iUp;
uniform float uNearT;
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying float vH;
${FOG_V}
vec2 rot2(vec2 q,float a){ float c=cos(a), s=sin(a); return vec2(c*q.x-s*q.y,s*q.x+c*q.y); }
void main(){
  vec3 p=position, n=normal;
  float walk=step(.001,iPos.w), ph=iRot.z*6.2832, went=uNearT*iPos.w;
  // the stride is tied to the ground covered (a hoof on the ground stays where it is): two steps every 1.05 body-metres
  float cyc=went/(1.05*iPos.z)*6.2832+ph;
  if(aPart.x>.5&&aPart.x<4.5){
    float diag=(aPart.x<1.5||aPart.x>3.5)?0.:3.1416, th=.3*sin(cyc+diag)*walk*smoothstep(0.,.2,aPart.y);
    vec3 pv=vec3(p.x,.9,aPart.x<2.5?-.5:.62);
    vec2 q=rot2(p.yz-pv.yz,th); p.yz=pv.yz+q; n.yz=rot2(n.yz,th);
    // the swinging leg folds at the knee and clears the ground
    p.y+=max(cos(cyc+diag),0.)*.09*walk*aPart.y;
  } else if(aPart.x>4.5){
    // grazing: the neck goes down to the ground and the head works from side to side; walking, the head is carried low and nods
    float gz=mix(1.15+.07*sin(uTime*.9+ph*3.),.28+.05*sin(cyc*2.),walk)*smoothstep(-.1,.5,aPart.y+.2);
    vec3 pv=vec3(0.,1.08,-.8);
    vec2 q=rot2(p.yz-pv.yz,gz); p.yz=pv.yz+q; n.yz=rot2(n.yz,gz);
    p.x+=(1.-walk)*.1*sin(uTime*1.7+ph*5.)*aPart.y;
  }
  p.y+=.012*sin(cyc*2.)*walk;
  vec2 f=iRot.xy/max(length(iRot.xy),1e-4);
  vec3 R=vec3(-f.y,0.,f.x), F=vec3(f.x,0.,f.y);
  vec3 c=vec3(iPos.x+f.x*went,.02-iRot.w+iUp*went,iPos.y+f.y*went);
  vec3 wp=c+(R*p.x+vec3(0.,1.,0.)*p.y-F*p.z)*iPos.z;
  vP=wp; vH=p.y*iPos.z; vN=R*n.x+vec3(0.,1.,0.)*n.y-F*n.z; vCol=color*(.85+.3*fract(iRot.z*7.3));
  vec4 mvPosition=modelViewMatrix*vec4(wp,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
export const CARI_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform float uRim;
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying float vH;
void main(){
  vec3 N=vN/max(length(vN),1e-4); vec3 toC=uCamL-vP; vec3 V=toC/max(length(toC),1e-3);
  float cs=cloudShadow(vP.xz), ndl=max(dot(N,uSunL)*.72+.28,0.);
  float hair=.86+.28*vn(vP.xz*9.+vP.y*13.);
  vec3 col=vCol*hair*(uSunCol*ndl*cs*.4+uSkyCol*(.5+.32*N.y)+uHorizCol*.1*(1.-N.y));
  float rim=1.-max(dot(N,V),0.); rim*=rim*rim;
  col+=(uSunCol*.16*cs*max(dot(-V,uSunL)*.5+.5,0.)+uSkyCol*.2)*rim*(.4+vCol.r*2.);       // the low sun in the hair along its back
  // (uRim: the low sun rims the side of the animal that is turned to it, warm, where that side is seen edge on)
  float rl=(1.-max(dot(N,V),0.)); rl*=rl*rl*max(dot(N,uSunL)+.15,0.);
  col+=uSunCol*(vec3(.05,.04,.03)+vCol*1.5)*rl*uRim*cs;
#ifdef BENCH
  // (on the pale heath of the bench the coat is a tone deeper, so the animal stands off its ground)
  col*=(smoothstep(-.05,.5,vH)*.5+.5)*mix(.52,.9,smoothstep(.15,.4,vCol.r));
#else
  col*=smoothstep(-.05,.5,vP.y)*.45+.55;                                                // darker toward the ground it stands on
#endif
  float alpha=1.;
  ${FINISH}
}`;

// ---- the animals' reflections in the river: the same modelled caribou again, turned over in the water's surface and
// laid ON that surface where the eye would see them (each vertex slid along its own sight line down to the water), so
// that whatever stands nearer hides them like anything else lying on the plain. Shown only where the map has water.
const MIRR_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec3 color; attribute vec2 aPart; attribute vec4 iPos; attribute vec4 iRot;
uniform float uNearT;
varying vec3 vP; varying vec3 vCol; varying float vY;
${FOG_V}
vec2 rot2(vec2 q,float a){ float c=cos(a), s=sin(a); return vec2(c*q.x-s*q.y,s*q.x+c*q.y); }
void main(){
  vec3 p=position;
  float walk=step(.001,iPos.w), ph=iRot.z*6.2832, went=uNearT*iPos.w;
  float cyc=went/(1.05*iPos.z)*6.2832+ph;
  if(aPart.x>.5&&aPart.x<4.5){
    float diag=(aPart.x<1.5||aPart.x>3.5)?0.:3.1416, th=.3*sin(cyc+diag)*walk*smoothstep(0.,.2,aPart.y);
    vec3 pv=vec3(p.x,.9,aPart.x<2.5?-.5:.62);
    vec2 q=rot2(p.yz-pv.yz,th); p.yz=pv.yz+q;
    p.y+=max(cos(cyc+diag),0.)*.09*walk*aPart.y;
  } else if(aPart.x>4.5){
    float gz=mix(1.15+.07*sin(uTime*.9+ph*3.),.28+.05*sin(cyc*2.),walk)*smoothstep(-.1,.5,aPart.y+.2);
    vec3 pv=vec3(0.,1.08,-.8);
    vec2 q=rot2(p.yz-pv.yz,gz); p.yz=pv.yz+q;
    p.x+=(1.-walk)*.1*sin(uTime*1.7+ph*5.)*aPart.y;
  }
  vec2 f=iRot.xy/max(length(iRot.xy),1e-4);
  vec3 R=vec3(-f.y,0.,f.x), F=vec3(f.x,0.,f.y);
  vec3 c=vec3(iPos.x+f.x*went,.02-iRot.w,iPos.y+f.y*went);
  vec3 wp=c+(R*p.x+vec3(0.,1.,0.)*p.y-F*p.z)*iPos.z;
  vY=wp.y;
  float h=max(wp.y,0.);
  vec3 cam=uCamL; float k=cam.y/max(cam.y+h,.5);
  vec3 q3=vec3(mix(cam.x,wp.x,k),.04,mix(cam.z,wp.z,k));
  // the ripples carry the image about, the more the further it lies from the animal's feet
  q3.xz+=vec2(sin(q3.z*3.1+uTime*2.3)+.6*sin(q3.z*7.7-uTime*3.1),sin(q3.x*2.7-uTime*1.9))*.05*h;
  vP=q3; vCol=color*(.85+.3*fract(iRot.z*7.3));
  vec4 mvPosition=modelViewMatrix*vec4(q3,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const MIRR_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform sampler2D uMap;
varying vec3 vP; varying vec3 vCol; varying float vY;
void main(){
  if(vY<.0) discard;
  vec2 p=vP.xz;
  vec2 muv=vec2((p.x-(${MAP.x0}.))/${MAP.x1 - MAP.x0}.,(p.y-(${MAP.z0}.))/${MAP.z1 - MAP.z0}.);
  float wr=texture2D(uMap,muv).r+(vn(p*.045+2.)-.5)*.45+(vn(p*.09)-.5)*.2;
  float wat=smoothstep(.66,.8,wr);
  float brk=.72+.28*sin(p.y*9.+p.x*2.3+uTime*3.4+2.*vn(p*1.7));
  float alpha=wat*brk*.66*(1.-.45*smoothstep(.6,3.2,vY))*(1.-smoothstep(120.,220.,vDepth));
  if(alpha<.02) discard;
  vec3 col=vCol*(uSkyCol*.8+uHorizCol*.12+uSunCol*.1*cloudShadow(p));
  ${FINISH}
}`;

// ---- what grows along the river: tufts (a sheaf of blades: sedge tussocks, cotton-grass with its white heads, reeds
// at the waterline) and dwarf willow thickets (low domes of leaves). iPos = (x, z, height, width), iCol = (rgb, kind):
// kind 0 tussock, 1 cotton-grass, 2 reed; for a thicket iCol.w turns it about.
const TUFT_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec2 aT; attribute vec3 aOff; attribute vec4 iPos; attribute vec4 iCol;
varying vec3 vP; varying vec3 vCol; varying float vT;
${FOG_V}
void main(){
  float kind=iCol.w, cot=step(.5,kind)*step(kind,1.5), t=aT.x;
  vec3 p=position; p.xz*=iPos.w; p.y*=iPos.z;
  p+=aOff*cot*(.5+.5*iPos.z);
  p.xz+=vec2(sin(uTime*1.6+iPos.x*.7+p.y*2.),cos(uTime*1.3+iPos.y*.6+p.y*1.4))*.05*t*t*iPos.z;
  vec3 wp=vec3(iPos.x,0.,iPos.y)+p;
  vP=wp; vT=t;
  vCol=mix(iCol.rgb*(.4+.85*t),vec3(.62,.61,.57),aT.y*cot);
  vec4 mvPosition=modelViewMatrix*vec4(wp,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const TUFT_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
varying vec3 vP; varying vec3 vCol; varying float vT;
void main(){
  vec3 toC=uCamL-vP; vec3 V=toC/max(length(toC),1e-3);
  float cs=cloudShadow(vP.xz), back=max(dot(-V,uSunL),0.); back*=back;
  // blades are thin: the low sun shines through them from behind and lights their tips from the side
  vec3 col=vCol*(uSunCol*(.3+.5*back+.25*vT)*cs+uSkyCol*.8+uHorizCol*.14);
  float alpha=1.;
  ${FINISH}
}`;
const BUSH_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec4 iPos; attribute vec4 iCol;
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec3 vL;
${FOG_V}
void main(){
  float a=iCol.w*6.2832, ca=cos(a), sa=sin(a);
  vec3 p=position, n=normal;
  p.xz=vec2(ca*p.x-sa*p.z,sa*p.x+ca*p.z); n.xz=vec2(ca*n.x-sa*n.z,sa*n.x+ca*n.z);
  vL=vec3(p.x,p.y,p.z);
  p.xz*=iPos.w; p.y*=iPos.z;
  p.xz+=vec2(sin(uTime*1.2+iPos.x),cos(uTime*.9+iPos.y))*.03*p.y;
  vec3 wp=vec3(iPos.x,0.,iPos.y)+p;
  vP=wp; vN=vec3(n.x*iPos.z,n.y*iPos.w,n.z*iPos.z); vCol=iCol.rgb;
  vec4 mvPosition=modelViewMatrix*vec4(wp,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const BUSH_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec3 vL;
void main(){
  vec3 N=vN/max(length(vN),1e-4); vec3 toC=uCamL-vP; vec3 V=toC/max(length(toC),1e-3);
  float cs=cloudShadow(vP.xz), ndl=max(dot(N,uSunL)*.7+.3,0.);
  // leaves: sprays of them catch the light, the gaps between show the dark of the twigs inside
  vec2 q=vP.xz*5.+vP.y*vec2(3.1,-2.3);
  float lf=vn(q)*.6+vn(q*2.7+7.)*.4, spray=smoothstep(.3,.62,lf);
  float tone=vn(vP.xz*.9+vCol.r*40.);
  vec3 leaf=mix(vCol,mix(uPal[2]*.5,uPal[1]*.5,step(.5,fract(vCol.g*37.))),smoothstep(.45,.75,tone)*.6)*(.6+.8*vn(q*1.9+3.));
  vec3 alb=mix(vec3(.03,.028,.022),leaf,spray);
  float low=smoothstep(.0,.55,vL.y);
  vec3 col=alb*(uSunCol*ndl*cs*(.3+.35*low)+uSkyCol*(.45+.35*N.y)*(.45+.55*low)+uHorizCol*.1);
  float rim=1.-max(dot(N,V),0.); rim*=rim;
  col+=leaf*uSunCol*.3*cs*rim*max(dot(-V,uSunL)*.5+.5,0.)*spray;
  float alpha=1.;
  ${FINISH}
}`;

// ---- the ground under a loose block: a dark line round its foot, and the shadow it throws down-sun where the ground
// is in the sun. A quad laid on the slope under each block (x = down-sun), drawn over the rock and under the block.
const FOOT_VS = /* glsl */`
${BRANCH_GLSL}
uniform sampler2D uShade;
attribute vec4 aD; varying vec2 vM; varying vec2 vR; varying float vLit;
${FOG_V}
void main(){
  vec3 P=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz-normalize(instanceMatrix[0].xyz)*aD.y*.5;       // the block's own place
  vM=vec2(position.x*aD.z+aD.y*.5,position.z*aD.w); vR=aD.xy;
  vLit=texture2D(uShade,${SHADE_UV}).r*cloudShadow(P.xz);
  vec4 mvPosition=modelViewMatrix*(instanceMatrix*vec4(position,1.)); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const FOOT_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
varying vec2 vM; varying vec2 vR; varying float vLit;
void main(){
  float r=vR.x, tail=vR.y;
  float foot=1.-smoothstep(r*.85,r*1.45,length(vM));
  float shd=(1.-smoothstep(r*.45,r*.95,abs(vM.y)))*smoothstep(-r*.4,r*.2,vM.x)*(1.-smoothstep(tail*.4+r*.5,tail+r*.9,vM.x));
  float alpha=max(foot*.5,shd*.5*vLit)*(1.-smoothstep(240.,480.,vDepth));
  if(alpha<.012) discard;
  vec3 col=uSkyCol*.09;
  ${FINISH}
}`;

// ---- the banner cloud off the head of each tower: a streamer that hangs on the summit and tears away down-wind. A strip
// laid along the wind (aB0 = the tower's head and the banner's length, aB1 = the wind's bearing and a phase), turned
// about its own axis to face the camera, its cloud scrolling down-wind.
const BAN_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec4 aB0; attribute vec4 aB1; varying vec2 vUv; varying float vPh;
${FOG_V}
void main(){
  float u=uv.x, v=uv.y-.5;
  vec3 W=aB1.xyz/max(length(aB1.xyz),1e-4);
  vec3 c=aB0.xyz+W*(u*aB0.w);
  c.y+=sin(u*5.-uTime*.9+aB1.w*6.)*1.8*u+sin(u*11.-uTime*1.7+aB1.w*17.)*.8*u+u*u*aB0.w*.06;
  c.z+=sin(u*3.3-uTime*.6+aB1.w*9.)*2.6*u;
  vec3 side=cross(W,uCamL-c); side/=max(length(side),1e-4); if(side.y<0.) side=-side;
  vec3 p=c+side*v*mix(5.,aB0.w*.3,smoothstep(0.,.55,u));
  vUv=vec2(u,v*2.); vPh=aB1.w;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const BAN_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
varying vec2 vUv; varying float vPh;
void main(){
  float u=vUv.x, v=vUv.y;
  float n=fbm(vec2(u*3.2-uTime*.5,v*1.3+vPh*7.))*.65+fbm(vec2(u*9.-uTime*.95,v*3.4+vPh*3.))*.35;
  // (it hangs on the summit: densest over the first third, where it is a body of cloud, and torn to wisps beyond)
  float edge=1.-smoothstep(.25,1.,abs(v+(n-.5)*.9));                      // (its edges are torn by its own cloud, never ruled)
  float body=edge*smoothstep(0.,.025,u)*pow(max(1.-u,0.),.9)*(1.+.45*(1.-smoothstep(.05,.4,u)));
  float alpha=smoothstep(.36,.62,n*(.5+1.05*body))*min(1.,body*2.)*.92*smoothstep(6.,30.,vDepth);
  if(alpha<.012) discard;
  // lit cream along its top, slate under it: so it reads against a bright sky and against a pale tower alike
  float topK=smoothstep(-.6,.35,v+(n-.5)*1.2);
  vec3 col=mix(uSkyCol*vec3(.5,.54,.62),uSkyCol*1.7+uSunCol*.42,topK)*(.82+.36*n);
  ${FINISH}
}`;

const HOURS = {
  evening: { sun: [-0.939, 0.156, -0.305], sunCol: '#F4DDB8', sunI: 2.7, sky: '#7f93b2', skyI: 0.8, horiz: 1.55, cover: 0.6, mist: 0, aurora: 0, snow: 0 },
  dawn: { sun: [0.96, 0.12, -0.25], sunCol: '#ffd3bd', sunI: 2.3, sky: '#8f9fc0', skyI: 0.8, horiz: 1.4, cover: 0.42, mist: 1, aurora: 0, snow: 0.25 },
  // (the slate overcast breaking at the day's end: a low amber sun under the deck, windows of it travelling over the plain)
  overcast: { sun: [-0.925, 0.191, -0.327], sunCol: '#ffc083', sunI: 3.1, sky: '#94859c', skyI: 0.9, horiz: 1.7, horizCol: '#ffb469', cover: 0.5, mist: 0, aurora: 0, snow: 0.1 },
  night: { sun: [-0.6, 0.5, -0.35], sunCol: '#a9bcff', sunI: 0.95, sky: '#2c3d6c', skyI: 0.8, horiz: 0.2, cover: 0.45, mist: 0, aurora: 1, snow: 0 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('branching-hero'), noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const hour = HOURS[opts.hour] || HOURS.evening, season = opts.season || 'peak';
  const density = clamp(opts.density ?? rng.range(0.3, 1), 0, 1);
  const rare = opts.rareEvent ?? rng.chance(1 / 8);
  const sunW = new THREE.Vector3().fromArray(opts.sunDir || hour.sun).normalize();
  const P = { ph: rng() * 6.283, notch: rng.range(50, 70), gorgeX: -rng.range(300, 380) };
  const tallWest = rng.chance(0.5);
  const root = new THREE.Group(); root.name = 'the-branching-hero';

  // ---- shared uniforms (one sun, one sky fill, one cloud shadow)
  const U = {
    uTime: { value: 0 }, uSunL: { value: sunW.clone() },
    uSunCol: { value: new THREE.Color(hour.sunCol).multiplyScalar(hour.sunI) },
    uSkyCol: { value: new THREE.Color(hour.sky).multiplyScalar(hour.skyI) },
    uHorizCol: { value: (hour.horizCol ? new THREE.Color(hour.horizCol) : new THREE.Color('#F4DDB8').lerp(pal[6], 0.5)).multiplyScalar(hour.horiz) },
    uCamL: { value: new THREE.Vector3(0, 200, 300) },
    uCloud: { value: new THREE.Vector4(16, 2.7, rng.range(0.0016, 0.0024), hour.cover + rng.range(-0.04, 0.04)) },
    uPal: { value: pal }, uHazeCol: { value: (hour.horizCol ? new THREE.Color(hour.horizCol).lerp(pal[6], 0.35) : new THREE.Color('#F4DDB8').lerp(pal[6], 0.5)).multiplyScalar(0.55 * Math.min(hour.horiz, 1.2)) },
    uHaze: { value: 0.00013 }, uSnow: { value: Math.max(hour.snow, season === 'late' ? 0.6 : 0) },
    uGreen: { value: season === 'august' ? 0.75 : 0 }, uAurora: { value: hour.aurora }, uMist: { value: hour.mist },
    uGap: { value: new THREE.Vector3(0, 0, 0) },      // (set once the bar by the fork is known: the sun stands on the file that crosses it)
    uHole: { value: new THREE.Vector4(0, 0, 0, 0) }, uFadeD: { value: 1 },     // uFadeD: ridge and plain dissolve in (the world sets it)
  };
  const mat = (vs, fs, extra = {}, params = {}) => new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, extra),
    vertexShader: vs, fragmentShader: fs, fog: true, ...params,
  });

  // ---- 1. the fork graph, the delta laid on the plain, the channel map
  const graph = branchGraph(opts.graphSeed != null ? makeRng(opts.graphSeed) : rng.fork('graph'),
    { orders: 4, ratio: rng.range(0.7, 0.78), angle: rng.range(0.4, 0.5), jitter: 0.25 });
  const delta = layoutDelta(graph, rng.fork('delta'), noise, P.gorgeX);
  await ctx.yield();
  const { cv, steps } = drawMap(delta.chans);
  for (const st of steps) { st(); await ctx.yield(); }
  const mapTex = new THREE.CanvasTexture(cv);
  mapTex.flipY = false; mapTex.colorSpace = THREE.NoColorSpace; mapTex.generateMipmaps = true;
  mapTex.minFilter = THREE.LinearMipmapLinearFilter; mapTex.magFilter = THREE.LinearFilter;
  mapTex.anisotropy = 8;                                     // three.js clamps it to what the device has
  await ctx.yield();

  // ---- 2. ridge, spur, gorge; baked low-sun shadow
  const T = makeHeight(noise, P), H = T.H;
  await ctx.yield();                                         // (the nose's tables are a step of their own)
  const { geo: ridgeGeo, splat: ridgeSplat, hAt: Hm, aoAt, noseGeo, conAttrs } = await buildRidgeGeo(ctx, H, T.gullyOf);
  await ctx.yield();
  const shadeTex = await bakeShade(ctx, Hm, sunW);      // (from the mesh's own heights: no second sounding of the ridge)
  const uShade = { value: shadeTex };
  await ctx.yield();
  const uShadeN = { value: await bakeShadeFine(ctx, Hm, sunW) };
  const ridge = new THREE.Mesh(ridgeGeo, mat(ROCK_VS, ROCK_FS, { uShade, uShadeN, uBare: { value: 0 } }));
  ridge.name = 'ridge'; root.add(ridge);
  const noseMesh = new THREE.Mesh(noseGeo, ridge.material); noseMesh.name = 'nose'; root.add(noseMesh);
  await ctx.yield();

  const uWake = { value: Array.from({ length: 10 }, () => new THREE.Vector4()) };
  // ---- 3. the plain: tundra, polygons, ponds, channels, lagoon, barrier islands, sea
  const plainGeo = new THREE.PlaneGeometry(11000, 11000, 40, 40); plainGeo.rotateX(-Math.PI / 2); plainGeo.translate(0, 0, -1500);
  const plain = new THREE.Mesh(plainGeo, mat(PLAIN_VS, PLAIN_FS, { uMap: { value: mapTex }, uShade, uWake }));
  plain.name = 'plain'; plain.renderOrder = -0.5; root.add(plain);

  // ---- 4. the gate: two frost-shattered towers and the talus round them, blocks along the crest
  // The flight: high over the saddle so the plain opens the moment the crest is cleared, down the west side of the
  // spur with the fork in the middle of the view, low along the east bank of the trunk over the gravel bar to the
  // first fork, a wide left turn into the low sun over the western arm and on round to the south-east, then one
  // climbing leg across the root of the delta and a right-hand arc onto the gate's own axis. The gate is come at
  // from the north, from below: the last 110 m climb 14 degrees up the line of the nose to the ring.
  const dip = (14 * Math.PI) / 180, seat = new THREE.Vector3(0, H(0, 0) + RING + 1.4, 0), SL = 96;
  const straight = new THREE.Vector3(0, seat.y - SL * Math.sin(dip), -SL * Math.cos(dip));
  const gmax = (x, z, r) => { let g = -1e9; for (let dx = -r; dx <= r; dx += r) for (let dz = -r; dz <= r; dz += r) g = Math.max(g, H(x + dx, z + dz)); return g; };
  const flyTop = Math.max(gmax(-12, 300, 10), gmax(-9, 322, 8)) + 12, fly = [], flyKeys = {};
  // metres from (x, z) to the nearest channel's waterline: negative in the stream
  const chanBB = delta.chans.map((c) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of c.pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); } return [x0, x1, z0, z1]; });
  const chanEdge = (x, z, reach = 70) => {
    let best = reach;
    for (let ci = 0; ci < delta.chans.length; ci++) {
      const c = delta.chans[ci], bb = chanBB[ci], pad = reach + c.w;
      if (x < bb[0] - pad || x > bb[1] + pad || z < bb[2] - pad || z > bb[3] + pad) continue;
      const pts = c.pts; let d2 = 1e18;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], ex = b[0] - a[0], ez = b[1] - a[1], t = clamp(((x - a[0]) * ex + (z - a[1]) * ez) / Math.max(ex * ex + ez * ez, 1e-6), 0, 1);
        const qx = x - a[0] - ex * t, qz = z - a[1] - ez * t; d2 = Math.min(d2, qx * qx + qz * qz);
      }
      best = Math.min(best, Math.sqrt(d2) - c.w * 0.5);
    }
    return best;
  };
  let bankAt = null, trunkW = 40;
  {
    // the trunk channel from the root to the first fork, and the fork itself
    const trunk = delta.byNode[0].pts, nT = trunk.length - 1, F = trunk[nT];
    const tp = (t) => { const f = clamp(t, 0, 1) * nT, i = Math.min(nT - 1, Math.floor(f)), k = f - i; return [lerp(trunk[i][0], trunk[i + 1][0], k), lerp(trunk[i][1], trunk[i + 1][1], k)]; };
    // a place beside the trunk: t along it, off metres east of its centre line (the sunlit bank lies behind whatever stands there)
    trunkW = delta.byNode[0].w;
    bankAt = (t, off) => {
      const a = tp(t - 0.05), b = tp(t + 0.05), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, q = tp(t);
      let nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l; if (nx < 0) { nx = -nx; nz = -nz; }
      return [q[0] + nx * off, q[1] + nz * off, (b[0] - a[0]) / l, (b[1] - a[1]) / l];
    };
    const yS = flyTop + 17, LOW = 9.5, yD = (k) => lerp(yS, 40, 1 - Math.pow(1 - k, 1.7));     // (the drop is made early: by the foot of the spur we are low)
    const add = (x, z, y, clear = 13) => { fly.push(new THREE.Vector3(x, Math.max(y, gmax(x, z, 8) + clear), z)); return fly.length - 1; };
    add(-8, 324, flyTop + 9, 10); add(-10, 300, yS, 10);
    // down the west flank: the spur's sunlit wall on the right, the delta ahead
    add(-28, 262, yS - 2, 10); add(-66, 205, yD(0.09)); add(-102, 130, yD(0.24)); add(-122, 45, yD(0.43)); add(-128, -45, yD(0.63)); add(-116, -125, yD(0.83));
    flyKeys.root = add(ROOT[0] - 6, ROOT[1] + 15, 40);
    // low along the trunk's east bank, over the gravel bar the herd walks, to the first fork
    await ctx.yield();
    // (to the gravel bar that lies east of the fork: the nearest ground there that is dry for seven metres round)
    const t1 = bankAt(0.3, trunkW * 0.5 + 13); let S = [F[0], F[1]], best = -1e9;
    for (let dx = 16; dx <= 70; dx += 6) for (let dz = -24; dz <= 40; dz += 6) {
      const x = F[0] + dx, z = F[1] + dz, e = Math.min(chanEdge(x, z, 14), chanEdge(x - 7, z, 14), chanEdge(x + 7, z, 14), chanEdge(x, z - 7, 14), chanEdge(x, z + 7, 14));
      const sc = Math.min(e, 6) * 3 - Math.hypot(dx - 36, dz - 6) * 0.25; if (e > 1.5 && sc > best) { best = sc; S = [x, z]; }
    }
    await ctx.yield();
    add(t1[0], t1[1], 20); add(lerp(t1[0], S[0], 0.55), lerp(t1[1], S[1], 0.55), LOW + 1, 8);
    flyKeys.fork = add(S[0], S[1], LOW, 8); flyKeys.bar = S; U.uGap.value.set(S[0] - 25, S[1] - 20, 190);
    // a wide left turn over the western arm, into the low sun, and on round until we head south-east
    for (const [dx, dz, y] of [[-14, -50, 11], [-60, -88, 14], [-118, -78, 19]]) add(F[0] + dx, F[1] + dz, y, 9);
    flyKeys.turn = fly.length - 1;
    add(F[0] - 148, F[1] - 22, 23, 9);
    // Then the climb: a straight leg east-south-east across the root of the delta to an arc (120 m radius) that swings
    // right onto the gate's own axis. It rises gently at first, so that the river and the plain stay under the gate in
    // the picture, and steepens into the arc (the leg leaves B along the tangent to that arc)
    const B = [F[0] - 128, F[1] + 26], yB = 27, RA = 120, zS = straight.z;
    flyKeys.climb = add(B[0], B[1], yB);
    const arcAt = (th) => [-RA * (1 - Math.cos(th)), zS - RA * Math.sin(th)];
    let ta = 0.25, tb = 1.5;
    for (let i = 0; i < 30; i++) { const th = (ta + tb) / 2, q = arcAt(th); if ((q[0] - B[0]) * Math.cos(th) - (q[1] - B[1]) * Math.sin(th) > 0) ta = th; else tb = th; }
    const th0 = (ta + tb) / 2, A0 = arcAt(th0), leg = Math.hypot(A0[0] - B[0], A0[1] - B[1]), run = leg + RA * th0;
    const rise = (dist) => lerp(yB, straight.y, Math.pow(dist / run, 0.8));       // (the height is gained early: from high up the plain lies open beside the bastion, as it lay under the lichen)
    for (const k of [0.34, 0.68]) add(lerp(B[0], A0[0], k), lerp(B[1], A0[1], k), rise(leg * k), 22);
    for (const k of [1, 0.66, 0.33]) { const q = arcAt(th0 * k); add(q[0], q[1], rise(leg + RA * th0 * (1 - k)), 22); }
    flyKeys.trunk = trunk.map((q) => [q[0], q[1]]); flyKeys.forkAt = [F[0], F[1]];
  }
  const nFlyHigh = flyKeys.root;
  await ctx.yield();
  fly.push(straight, seat.clone());
  const segDist = (x, z, i0, i1) => { let d = 1e9; for (let i = i0; i < i1; i++) { const a = fly[i], b = fly[i + 1], ex = b.x - a.x, ez = b.z - a.z, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez), 0, 1); d = Math.min(d, Math.hypot(x - a.x - ex * t, z - a.z - ez * t)); } return d; };
  const nearFly = (x, z) => segDist(x, z, 0, fly.length - 1);
  const nearHigh = (x, z) => segDist(x, z, 1, nFlyHigh);          // the line down the west flank, from which the spur is seen closest
  const bareMat = mat(ROCK_VS, ROCK_FS, { uShade, uShadeN, uBare: { value: 1 } }), wsgn = sunW.x < 0 ? 1 : -1;
  const sl = Math.hypot(sunW.x, sunW.z) || 1, shx = -sunW.x / sl, shz = -sunW.z / sl, tanEl = Math.max(sunW.y, 0.05) / sl, shK = clamp(1 / Math.max(tanEl, 0.15), 0.8, 5);
  // something standing on the ridge darkens the ground under it and throws a shadow down-sun: a long one where the
  // ground falls away from the sun, a short one up a slope that faces it (never a streak up a sunlit wall)
  const ground = (x, z, r, h, amt) => {
    ridgeSplat(x, z, r * 1.5 + 1.2, amt);
    const up = (Hm(x + shx * 3, z + shz * 3) - Hm(x, z)) / 3, len = Math.min(h * shK, h / Math.max(tanEl + up, 0.16));
    const n = Math.min(8, Math.floor(len / Math.max(r, 1)));
    for (let i = 1; i <= n; i++) ridgeSplat(x + shx * i * r, z + shz * i * r, r + 1, amt * 0.7 * (1 - i / (n + 1)));
  };
  await ctx.yield();
  const tH = tallWest ? [45, 36] : [36, 45], towerTops = [], tg = [];
  for (let i = 0; i < 2; i++) {
    const x = i === 0 ? -TX : TX, base = Hm(x, 0) - 0.8, g = towerGeo(rng.fork('tower' + i), tH[i], tH[i] > 40 ? 7.6 : 6.8);
    g.translate(x, base, rng.range(-1.5, 1.5)); tg.push(g); towerTops.push(new THREE.Vector3(x, base + tH[i], 0));
    ground(x, 0, 6, 9, 0.5);
    await ctx.yield();
  }
  const towers = new THREE.Mesh(mergeGeometries(tg), bareMat); towers.name = 'towers'; root.add(towers);
  tg.forEach((g) => g.dispose());
  await ctx.yield();
  // frost-shattered blocks, from slab to rubble: round the towers' feet, along the crests, and gathered in talus
  // cones under the spur's walls (one or two big ones in each, the rest falling away in size down the fall line)
  const hr4 = rng.fork('block'), hulls = [0, 1, 2, 3].map((k) => hullGeo(hr4, k)), HY = [0.36, 0.74, 1.1, 0.62];
  const br = rng.fork('blocks'), items = [];
  const slopeAt = (x, z) => Math.hypot(Hm(x + 1.5, z) - Hm(x - 1.5, z), Hm(x, z + 1.5) - Hm(x, z - 1.5));
  // (the fly line is 13 m and more above the ground: blocks up to 3 m stand under it. In front of the ring nothing
  // stands higher than the ring's foot, and the floor behind it carries slabs, not blocks. On the west flank, which
  // the camera comes down a stone's throw from, there is no rubble, no slab on edge and no splinter: seen from above
  // against the lit wall those are dark slivers. What stands there is a block.)
  const put = (x, z, sc, force = -1, sink = 0) => {
    const hi = nearHigh(x, z) < 75;
    if (!sink && nearFly(x, z) < 42) sc = Math.min(sc, 3.2);
    if (!sink && hi && sc < 0.9) return;
    if (!sink && slopeAt(x, z) > (sc < 2.6 && (force < 0 || sc < 1) ? 2.6 : 3.3)) return;   // (nothing loose lies on a wall: steeper than 41 degrees, or 48 for the big blocks)
    const floor = Math.abs(x) < RING + 1.5 && z > -34 && z < 70;
    if (floor) sc = Math.min(sc, z < 15 ? 0.55 : 1.5);
    let kind = sc > 1.6 ? (br.chance(0.45) ? 0 : 1) : sc > 0.7 ? [1, 1, 2, 0, 3][br.int(0, 4)] : [3, 3, 3, 1, 2][br.int(0, 4)];
    if (force >= 0) kind = force;
    if (floor && sc > 0.8) kind = 0;
    if (hi && !floor && kind !== 1) kind = sc > 1.3 ? 1 : 3;
    items.push([x, z, sc, kind, sink]);
  };
  for (let i = 0; i < 90; i++) { const a = br() * 6.283, d = br.range(6.5, 12.5); put((i % 2 ? TX : -TX) + Math.cos(a) * d, Math.sin(a) * d * 1.3, 0.3 + Math.pow(br(), 2) * 1.3); }
  for (let i = 0; i < 70; i++) put(br.gauss() * 10, br.range(-22, 66), br.range(0.2, 0.6));
  for (let i = 0; i < 190; i++) { const z = br.range(-18, 335); put(T.spurX(z) + br.gauss() * (4 + 5 * br()), z, Math.pow(br(), 2.2) * 2.1 + 0.35); }
  await ctx.yield();
  for (let i = 0; i < 90; i++) put(br.range(-80, 60), CREST_Z + br.gauss() * 16, Math.pow(br(), 2.2) * 2.2 + 0.4);
  await ctx.yield();
  {
    // the north nose: fallen blocks on its talus, the biggest furthest out, and a few lodged on the ledges of its wall
    const nr = makeRng(hashSeed('branching-nose:' + ctx.seed));
    for (let i = 0; i < 150; i++) {
      const a = nr.range(-2.3, 1.3), t = Math.pow(nr(), 0.7), r = 46 + t * 110;
      const sc = 0.45 + Math.pow(nr(), 2.2) * (1.2 + 2.2 * t);
      put(Math.sin(a) * r, NOSE_Z - Math.cos(a) * r, sc, sc > 1.2 ? 1 : 3);                 // (blocks and rubble: a slab or a splinter on a fan is a loose flake)
      if ((i & 31) === 31) await ctx.yield();
    }

  }
  await ctx.yield();
  for (let c = 0; c < 52; c++) {
    const inCol = c >= 43, sd = inCol ? -1 : br.chance(0.7) ? -1 : 1, z0 = inCol ? br.range(180, 292) : br.range(8, 300);
    const cx = inCol ? br.range(-190, -60) : T.spurX(z0) + sd * br.range(20, 96), n = br.int(9, 19), sp = br.range(4, 10);
    for (let k = 0; k < n; k++) {
      const t = k === 0 ? br.range(0.65, 1) : Math.pow(br(), 2.8), dd = Math.abs(br.gauss()) * sp * (k === 0 ? 0.4 : 1.8);
      put(cx + sd * dd, z0 + br.gauss() * sp * 0.8, 0.3 + t * 3.0);
    }
    if ((c & 7) === 7) await ctx.yield();
  }
  await ctx.yield();
  {
    // crags and talus, laid out from the shape of the wall itself. Along each side of the spur the wall is read at
    // mid-height: where it stands proud (a buttress) outcrops of big blocks are stacked up its crest; where it is cut
    // (a gully) a cone of fallen blocks fans out on the apron below, the biggest having rolled the furthest.
    const kr = makeRng(hashSeed('branching-crags:' + ctx.seed));
    for (const sd of [-1, 1]) {
      const curv = [];
      for (let z = -6; z <= 300; z += 3) { const x = T.spurX(z) + sd * 27; curv.push(Hm(x, z) - 0.5 * (Hm(x, z - 8) + Hm(x, z + 8))); }
      await ctx.yield();
      for (let i = 2; i < curv.length - 2; i++) {
        const z = -6 + i * 3, c = curv[i];
        if (c > 1.4 && c >= curv[i - 1] && c >= curv[i + 1] && (sd < 0 || kr.chance(0.5))) {
          // a buttress crest: outcrops stepping down it
          // (big blocks sunk more than half into the wall: they step its skyline and carry the same joints; fewer of
          // them beside the camera's own line)
          for (let d = 12 + kr() * 6; d < 56; d += kr.range(9, 16)) {
            const x0 = T.spurX(z) + sd * d, z0 = z + kr.gauss() * 2.2, n = kr.int(1, 3), few = nearHigh(x0, z0) < 75 && kr.chance(0.5);
            let sc = kr.range(4.2, 7.4) * (d < 20 ? 0.7 : 1);
            for (let k = 0; k < n; k++) {
              const bx = x0 - sd * k * sc * 0.45 + kr.gauss() * 0.8, bz = z0 + kr.gauss() * sc * 0.4, sk = kr.range(0.45, 0.7);
              if (!few) put(bx, bz, sc, 1, sk);
              sc *= kr.range(0.6, 0.8);
            }
          }
        } else if (c < -1.4 && c <= curv[i - 1] && c <= curv[i + 1] && (sd < 0 || kr.chance(0.4))) {
          // a gully mouth: its cone
          const n = kr.int(12, 18), reach = kr.range(40, 68);
          for (let k = 0; k < n; k++) {
            const t = Math.pow(kr(), 0.8), d = 34 + t * reach, lat = kr.gauss() * (2.5 + 0.2 * t * reach);
            const big = Math.pow(kr(), 2.4), sc = 0.45 + big * (0.9 + 1.2 * t);
            put(T.spurX(z) + sd * d, z + lat + 0.12 * d * (sd < 0 ? -1 : 0.6), sc);
          }
        }
        if ((i & 15) === 15) await ctx.yield();
      }
      await ctx.yield();
    }
    // the last of the arete, either side of our line and across its floor: tilted slabs and wedged blocks
    for (let i = 0; i < 46; i++) { const z = kr.range(14, 78), sd = kr.sign(); put(sd * kr.range(RING + 1.6, RING + 9), z, kr.range(1.2, 2.3), kr.chance(0.7) ? 0 : 1); }
    for (let i = 0; i < 70; i++) { const z = kr.range(15, 72); put(kr.gauss() * 5.4, z, 0.5 + Math.pow(kr(), 1.6) * 1.0, kr.chance(0.55) ? 0 : 1); }
  }
  await ctx.yield();
  {
    // the stair under the gate: fallen blocks lie on every tread, most of them at the foot of the riser they came off
    const sr = makeRng(hashSeed('branching-stair:' + ctx.seed));
    for (let k = 0; k < T.nSteps; k++) {
      const n = 8 + sr.int(0, 4);
      for (let i = 0; i < n; i++) {
        const X = sr.range(-10, 10), f0 = T.stairFront(k, X), f1 = k + 1 < T.nSteps ? T.stairFront(k + 1, X) : f0 + 12, dep = f1 - f0 - 4.6;
        const Nn = f0 + 2.3 + Math.pow(sr(), 1.8) * Math.max(dep, 0), sc = 0.5 + Math.pow(sr(), 1.7) * 1.5, kind = sc > 1.1 ? (sr.chance(0.3) ? 0 : 1) : sr.chance(0.5) ? 3 : 1;
        if (dep < 1 || slopeAt(X, NOSE_Z - Nn) > 1.1) continue;
        items.push([X, NOSE_Z - Nn, sc, kind, 0.1, 1]);
      }
    }
  }
  await ctx.yield();
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  const n4 = new THREE.Vector3(), qn = new THREE.Quaternion(), qi = new THREE.Quaternion(), up4 = new THREE.Vector3(0, 1, 0);
  const blockSets = hulls.map((g, k) => { const m = new THREE.InstancedMesh(g, bareMat, Math.max(1, items.filter((it) => it[3] === k).length)); m.count = 0; m.frustumCulled = false; m.name = 'crest-blocks-' + k; root.add(m); return m; });
  let nIt = 0;
  const feet = [], xs4 = new THREE.Vector3(), zs4 = new THREE.Vector3();
  for (const [x, z, sc, kind, sink, keep] of items) {
    if ((++nIt & 15) === 0) await ctx.yield();
    // (nothing loose lies in a gully or a hollow high on the spur: old snow lies there, and a block on snow is a chip
    // afloat on it)
    if (!keep && Hm(x, z) > 45 && aoAt(x, z) < 0.57) continue;
    const tilt = sink ? 0.16 : kind === 0 ? 0.28 : 0.6, m = blockSets[kind];
    s4.set(sc * br.range(0.75, 1.4), sc * br.range(0.7, 1.25), sc * br.range(0.75, 1.35));
    e4.set(br.range(-tilt, tilt), br() * 6.283, br.range(-tilt, tilt)); q4.setFromEuler(e4);
    // it lies on the slope it stands on (turned most of the way to the ground's own normal) and is half sunk into it,
    // so that on a wall it is a proud block of that wall and never a plate hanging in the air
    const h0 = Hm(x, z);
    n4.set(Hm(x - 1.5, z) - Hm(x + 1.5, z), 3, Hm(x, z - 1.5) - Hm(x, z + 1.5)).normalize();
    qn.setFromUnitVectors(up4, n4); qi.identity().slerp(qn, 0.8); q4.premultiply(qi);
    n4.set(0, 1, 0).applyQuaternion(qi);
    const lift = s4.y * HY[kind] * (0.04 - sink);
    p4.set(x + n4.x * lift, h0 + n4.y * lift, z + n4.z * lift); m4.compose(p4, q4, s4); m.setMatrixAt(m.count++, m4);
    if (sink >= 0.3) ridgeSplat(x, z, sc * 1.3, 0.2); else if (sc > 0.7) ground(x, z, sc * 1.1, sc * HY[kind] * 1.3, 0.42);
    if (sc > 0.62 && sink < 0.3) {
      // its foot on the ground (see FOOT_VS): a quad on the slope, long down-sun by the shadow the block throws
      const r = Math.max(s4.x, s4.z) * 0.8, hb = s4.y * HY[kind], up = (Hm(x + shx * 3, z + shz * 3) - h0) / 3;
      const tail = Math.min(7, hb * shK, hb / Math.max(tanEl + up, 0.16));
      xs4.set(shx, 0, shz).addScaledVector(n4, -(shx * n4.x + shz * n4.z)).normalize(); zs4.crossVectors(xs4, n4);
      feet.push([x + n4.x * 0.12 + xs4.x * tail * 0.5, h0 + n4.y * 0.12 + xs4.y * tail * 0.5, z + n4.z * 0.12 + xs4.z * tail * 0.5, xs4.x, xs4.y, xs4.z, n4.x, n4.y, n4.z, zs4.x, zs4.y, zs4.z, r, tail]);
    }
  }
  blockSets.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  await ctx.yield();
  {
    const fg = new THREE.PlaneGeometry(2, 2); fg.rotateX(-Math.PI / 2);
    const fD = new Float32Array(Math.max(1, feet.length) * 4), fm = new THREE.InstancedMesh(fg, mat(FOOT_VS, FOOT_FS, { uShade }, { transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }), Math.max(1, feet.length));
    feet.forEach((f, i) => {
      const lx = f[12] * 1.7 + f[13] * 0.5, lz = f[12] * 1.7;
      m4.set(f[3] * lx, f[6], f[9] * lz, f[0], f[4] * lx, f[7], f[10] * lz, f[1], f[5] * lx, f[8], f[11] * lz, f[2], 0, 0, 0, 1); fm.setMatrixAt(i, m4);
      fD.set([f[12], f[13], lx, lz], i * 4);
      if ((i & 255) === 255) fm.instanceMatrix.needsUpdate = true;
    });
    fg.setAttribute('aD', new THREE.InstancedBufferAttribute(fD, 4));
    fm.count = feet.length; fm.instanceMatrix.needsUpdate = true; fm.frustumCulled = false; fm.renderOrder = 1; fm.name = 'block-feet'; root.add(fm);
  }
  await ctx.yield();
  // gendarmes: small shattered pinnacles standing on the crests and the ledges below them, and round the lip of the
  // north nose. None stands on the flank the camera comes down: seen from above, a sheaf of pillars is a comb.
  {
    const pr = rng.fork('pinnacles'), g1 = towerGeo(pr, 11, 2.7, 6), g2 = towerGeo(pr, 7, 2.3, 5);
    await ctx.yield();
    const NPn = 44, sets = [new THREE.InstancedMesh(g1, bareMat, NPn / 2), new THREE.InstancedMesh(g2, bareMat, NPn / 2)];
    for (let i = 0; i < NPn; i++) {
      let x, z; const nose = i >= 44;
      if (i < 20) { z = pr.range(112, 292); x = T.spurX(z) + pr.gauss() * 3.5; }
      else if (i < 34) { z = pr.range(60, 290); x = T.spurX(z) - wsgn * pr.range(16, 70); if (nearHigh(x, z) < 95) x = T.spurX(z) + wsgn * pr.range(14, 60); }
      else if (!nose) { x = pr.range(-230, 110); z = CREST_Z + pr.range(-70, 8); if (Math.abs(x + 8) < 34) x -= 70; }
      else { const a = pr.range(-2.1, 1.0), r = pr.range(9, 30); x = Math.sin(a) * r; z = NOSE_Z - Math.cos(a) * r; }       // on the ledges under the lip of the nose
      if (!nose && nearFly(x, z) < 26) x += x > -30 ? 44 : -44;
      const sc = nose ? pr.range(0.8, 1.5) : Math.min(pr.range(0.6, 1.5), nearFly(x, z) < 60 ? 0.8 : 9); s4.set(sc * pr.range(0.8, 1.3), sc, sc * pr.range(0.8, 1.3));
      e4.set(pr.range(-0.12, 0.12), pr() * 6.283, pr.range(-0.12, 0.12)); q4.setFromEuler(e4);
      p4.set(x, Hm(x, z) - 1.2 * sc, z); m4.compose(p4, q4, s4); sets[i & 1].setMatrixAt(i >> 1, m4);
      ground(x, z, 2.6 * sc, 7 * sc, 0.45);
    }
    sets.forEach((m, k) => { m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; m.name = 'pinnacles-' + k; root.add(m); });
  }
  conAttrs.forEach((a) => { a.needsUpdate = true; });
  await ctx.yield();

  // ---- 5. caribou in forking files along the bars (walking upstream, toward us), Dall sheep on the spur
  const hr = rng.fork('herd'), NH = Math.round(lerp(4200, 6000, density) * lerp(0.7, 1, (detail - 0.6) / 0.4)), NS = 26;
  const files = [];
  for (const n of graph) {
    const c = delta.byNode[n.id];
    if (n.order > 3) continue;
    for (const kid of n.kids) {
      const k = delta.byNode[kid].pts, a = c.pts.slice(Math.floor(c.pts.length * 0.35)), b = k.slice(1, Math.ceil(k.length * (n.order === 3 ? 0.45 : 0.75)));
      const pts = a.concat(b); let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const dens = n.order === 0 ? 1.5 : n.order === 1 ? 1.25 : 1, side = hr.sign();
      files.push({ pts, len, dens, wa: c.w, wb: delta.byNode[kid].w, na: a.length, side, gap: hr.range(4, 9), id: files.length });
      if (n.order < 2) files.push({ pts, len, dens, wa: c.w, wb: delta.byNode[kid].w, na: a.length, side: -side, gap: hr.range(5, 11), id: files.length });
    }
  }
  {
    // the river above the root: files come down both banks to the fork
    const pts = delta.upC.pts.slice(Math.floor(delta.upC.pts.length * 0.55)); let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    for (const side of [-1, 1]) files.push({ pts, len, dens: 1.5, wa: delta.upC.w, wb: delta.upC.w, na: pts.length, side, gap: hr.range(5, 10), id: files.length });
  }
  await ctx.yield();
  const totalLen = files.reduce((s, f) => s + f.len * f.dens, 0), spacing0 = Math.max(0.5, (totalLen / NH) * 0.62);
  // The animals within reach of the low run along the trunk are modelled (the near herd): the sprite that would have
  // stood there gives up its place, and keeps only its shadow.
  const NEAR_MAX = Math.round(lerp(120, 270, (detail - 0.6) / 0.4)), near = [], iLow0 = flyKeys.root, iLow1 = Math.min(flyKeys.climb + 2, fly.length - 1);
  const ZONE = 96, cand = [], CAND_MAX = 1400;
  const nearFree = (x, z, r) => { for (const q of near) if (Math.abs(q[0] - x) < r && Math.abs(q[1] - z) < r && Math.hypot(q[0] - x, q[1] - z) < r) return false; return true; };
  const FLORA_MAX = Math.round(lerp(1300, 2300, (detail - 0.6) / 0.4));
  const hPos = new Float32Array((NH + NS + NEAR_MAX + CAND_MAX + FLORA_MAX + 4) * 4), hDir = new Float32Array((NH + NS + NEAR_MAX + CAND_MAX + FLORA_MAX + 4) * 4); let hn = 0;
  if (bankAt) {
    // the file by the fork: it has waded the trunk and walks out over the gravel bar east of the fork, across our own
    // line, side on to us (those still in the water trail wakes; the low sun lays every shadow out beside its animal)
    {
      // the head of that file, nearer still: half a dozen that have already crossed stand and walk on the bar right
      // under the line we come in on, a bull foremost (from the low run he is an eighth of the frame tall)
      const A = fly[flyKeys.fork - 1], Sb = fly[flyKeys.fork], dl = Math.hypot(Sb.x - A.x, Sb.z - A.z) || 1, dx = (Sb.x - A.x) / dl, dz = (Sb.z - A.z) / dl;
      for (const [a, b, sc, sp, hx, hz, wade] of [[13, 5, 1.78, 0.33, 0.8, 0.6, 0], [16, -6, 1.45, 0, 0.5, 0.86, 0], [9, 11, 1.5, 0.33, 0.8, 0.6, 0], [7, -10, 1.44, 0, -0.9, 0.4, 0], [19, 3, 1.62, 0.33, 0.8, 0.6, 1], [23, -5, 1.4, 0.33, 0.8, 0.6, 1], [28, 6, 1.5, 0.33, 0.8, 0.6, 1], [35, -9.5, 1.36, 0.33, 0.8, 0.6, 0], [39, 9, 1.0, 0.33, 0.8, 0.6, 0]]) {
        // (each takes the nearest footing to its place: dry bar close by the water; the waders stand where they are put)
        let x = A.x + dx * a - dz * b, z = A.z + dz * a + dx * b, e = chanEdge(x, z, 14), best = -1e9;
        if (!wade) for (let oa = -6; oa <= 6; oa += 2) for (let ob = -8; ob <= 8; ob += 2) {
          const qx = A.x + dx * (a + oa) - dz * (b + ob), qz = A.z + dz * (a + oa) + dx * (b + ob);
          if (!nearFree(qx, qz, 4.4)) continue;
          const qe = chanEdge(qx, qz, 14), scr = Math.min(qe, 1.6) * 3 - Math.max(qe - 5, 0) - Math.hypot(oa, ob) * 0.4 + oa * 0.25;
          if (scr > best) { best = scr; x = qx; z = qz; e = qe; }
        }
        const ph = (a * 0.37 + b * 0.11 + 7) % 1;
        if (!nearFree(x, z, 4)) continue;
        near.push([x, z, sc, e < 1.2 ? 0.33 : sp, hx, hz, ph, e < 1.2 ? clamp(0.2 - e * 0.045, 0.24, 0.42) * sc : 0, e < 1.2 ? 1 : 0]);
      }
    }
    {
      const S = flyKeys.bar, gl = Math.hypot(0.8, 0.6), gx = 0.8 / gl, gz = 0.6 / gl; let wet = 0;
      for (let a = -52, i = 0; a < 44; a += hr.range(5.6, 7.4), i++) {
        const lat = 1.3 * Math.sin(i * 2.1), x = S[0] + gx * a - gz * lat, z = S[1] + gz * a + gx * lat + 10, e = chanEdge(x, z, 14), ph = hr();
        const sc = hr.chance(0.3) ? hr.range(1.56, 1.7) : hr.chance(0.15) ? 1.0 : hr.range(1.3, 1.48);
        if (e < -11 || !nearFree(x, z, 4.6) || (e < 1.2 && wet >= 8)) continue;
        if (e < 1.2) wet++;
        near.push([x, z, sc, 0.33, gx, gz, ph, e < 1.2 ? clamp(0.2 - e * 0.045, 0.24, 0.5) * sc : 0, e < 1.2 ? 1 : 0]);
      }
      for (const [t, ph] of [[0.3, 0.2], [0.47, 0.7]]) {
        const b = bankAt(t, trunkW * 0.5 - 3.6), sc = 1.36 + 0.2 * ph;
        if (nearFree(b[0], b[1], 5)) near.push([b[0], b[1], sc, 0.33, -b[2], -b[3], ph, 0.47 * sc, 1]);
      }
    }
    // the file on the trunk's east bank, nose to tail, between the water and our own line
    let tl = 0; const tk = flyKeys.trunk; for (let i = 1; i < tk.length; i++) tl += Math.hypot(tk[i][0] - tk[i - 1][0], tk[i][1] - tk[i - 1][1]);
    for (let d = 14, i = 0; d < tl - 3; d += hr.range(5.6, 8.2), i++) {
      if (noise.n2(d * 0.05, 7.7) < -0.42) continue;
      for (const off of [6.5, 10.5, 14.5]) {
        const b = bankAt(d / tl, trunkW * 0.5 + off + 1.3 * Math.sin(i * 1.7)), bull = hr.chance(0.3), ph = hr();
        if (chanEdge(b[0], b[1], 12) < 2.2 || !nearFree(b[0], b[1], 5)) continue;
        near.push([b[0], b[1], bull ? hr.range(1.5, 1.62) : hr.chance(0.15) ? 0.95 : hr.range(1.2, 1.4), 0.3 * (0.8 + 0.4 * ph), -b[2], -b[3], ph, 0, 0]); break;
      }
    }
  }
  if (bankAt) {
    // round the turn into the sun: animals scattered on the dry bars either side of our own line, a stone's throw off,
    // some grazing, most walking upstream (whichever way the hour turns the gaze there, the nearest are whole animals)
    const tr = makeRng(hashSeed('branching-turn:' + ctx.seed));
    for (let i = flyKeys.fork; i < Math.min(flyKeys.climb + 2, fly.length - 1); i++) {
      const a = fly[i], b = fly[i + 1], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, tx = (b.x - a.x) / l, tz = (b.z - a.z) / l;
      for (let d = 4; d < l; d += tr.range(5.5, 8)) for (const sd of [-1, 1]) {
        const off = sd * (i > flyKeys.turn ? tr.range(9, 46) : tr.range(15, 40)), x = a.x + tx * d - tz * off, z = a.z + tz * d + tx * off, ph = tr(), bull = tr.chance(0.3), sc = bull ? tr.range(1.5, 1.62) : tr.chance(0.15) ? 0.95 : tr.range(1.2, 1.4);
        if (near.length >= NEAR_MAX - 40 || chanEdge(x, z, 12) < 2.4 || !nearFree(x, z, 5.4) || (i > flyKeys.turn && tr.chance(0.4))) continue;
        near.push([x, z, sc, ph < 0.3 ? 0 : 0.3 * (0.8 + 0.4 * ph), 0.35 + 0.5 * (ph - 0.5), 0.94, ph, 0, 0]);
      }
    }
    await ctx.yield();
  }
  for (const f of hr.shuffle(files.slice())) {
    const spacing = spacing0 / f.dens;
    for (let i = 1; i < f.pts.length && hn < NH; i++) {
      const a = f.pts[i - 1], b = f.pts[i], sl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / sl, tz = (b[1] - a[1]) / sl;
      const w = i < f.na ? f.wa : f.wb, off = f.side * (w * 0.5 + f.gap);
      for (let d = hr() * spacing; d < sl && hn < NH; d += spacing * hr.range(0.5, 1.5)) {
        if (noise.n2((i * 20 + d) * 0.012, f.id * 3.7) < -0.18) continue;          // files come in strings with gaps
        const lat = off + hr.gauss() * 1.1, k = hn * 4, kind = hr.chance(0.13) ? 1 : 0;
        const ax = a[0] + tx * d - tz * lat, az = a[1] + tz * d + tx * lat, ph = hr(), sz = kind ? 1.25 : hr.chance(0.2) ? 0.7 : hr.range(0.9, 1.08);
        if (Math.abs(ax) < 460 && az < ROOT[1] + 130 && az > ROOT[1] - 470 && cand.length < CAND_MAX) {
          // (within reach of the low run, the turn into the sun and the first of the climb: a modelled animal if it is
          // among the nearest, see below; the others stay as they were)
          const sd = segDist(ax, az, iLow0, iLow1);
          if (sd < ZONE) { cand.push([sd, ax, az, sz, ph, tx, tz, kind]); continue; }
        }
        hPos[k] = ax; hPos[k + 1] = az; hPos[k + 2] = ph; hPos[k + 3] = sz;
        hDir[k] = -tx; hDir[k + 1] = -tz; hDir[k + 2] = kind; hDir[k + 3] = 0; hn++;
      }
    }
  }
  await ctx.yield();
  // the nearest to the flight's own line are modelled; one that stands in the water, or within a body's length of a
  // modelled animal, gives up its place; the rest stay sprites
  cand.sort((a, b) => a[0] - b[0]);
  for (let ci = 0; ci < cand.length; ci++) {
    const [sd, ax, az, sz, ph, tx, tz, kind] = cand[ci];
    if ((ci & 127) === 127) await ctx.yield();
    if (near.length < NEAR_MAX) {
      if (nearFree(ax, az, 5.2) && chanEdge(ax, az, 12) > 1.6) near.push([ax, az, 1.2 * sz + 0.06, 0.3 * (0.8 + 0.4 * ph), -tx, -tz, ph, 0, 0]);
      continue;
    }
    if (!nearFree(ax, az, 7)) continue;
    const k = hn * 4; hPos[k] = ax; hPos[k + 1] = az; hPos[k + 2] = ph; hPos[k + 3] = sz;
    hDir[k] = -tx; hDir[k + 1] = -tz; hDir[k + 2] = kind; hDir[k + 3] = 0; hn++;
  }
  await ctx.yield();
  for (let i = 0; i < NS; i++, hn++) {                                              // sheep: white flecks on the sunny flank
    const z = hr.range(12, 82), x = T.spurX(z) - hr.range(20, 52) * (sunW.x < 0 ? 1 : -1), k = hn * 4, a = hr() * 6.283;
    hPos[k] = x; hPos[k + 1] = z; hPos[k + 2] = hr(); hPos[k + 3] = 0.75;
    hDir[k] = Math.cos(a); hDir[k + 1] = Math.sin(a); hDir[k + 2] = 2; hDir[k + 3] = Hm(x, z) + 0.05;
  }
  // ---- what grows along the low run: reeds and sedge drawn along every waterline, tussocks and cotton-grass on the
  // bars and the tundra, dwarf willow thickets in clumps; each throws its own long shadow (drawn with the herd's)
  const tufts = [], bushes = [];
  if (bankAt) {
    const fr = makeRng(hashSeed('branching-flora:' + ctx.seed));
    const C = (i) => pal[i], mixc = (a, b, k, g = 1) => [lerp(a.r, b.r, k) * g, lerp(a.g, b.g, k) * g, lerp(a.b, b.b, k) * g];
    const olive = new THREE.Color(0.2, 0.22, 0.09), straw = new THREE.Color(0.62, 0.5, 0.26);
    const shadow = (x, z, h, w) => {
      const k = hn * 4; hn++;
      hPos[k] = x; hPos[k + 1] = z; hPos[k + 2] = 0; hPos[k + 3] = (w / 0.8) / 1.42 / 0.19;
      hDir[k] = 1; hDir[k + 1] = 0; hDir[k + 2] = 4 + clamp(1 - (h * 0.8) / Math.max(w, 0.05), 0, 0.92); hDir[k + 3] = 0.02;
    };
    const tuft = (x, z, kind, h, w, c) => { if (tufts.length + bushes.length >= FLORA_MAX) return; h *= 1.5; w *= 1.6; tufts.push([x, z, h, w, c[0], c[1], c[2], kind]); shadow(x, z, h * 0.6, w * 0.8); };
    const bush = (x, z, h, w, c) => { if (tufts.length + bushes.length >= FLORA_MAX || !nearFree(x, z, w + 1.6)) return; bushes.push([x, z, h, w, c[0], c[1], c[2], fr()]); shadow(x, z, h * 0.9, w * 1.7); };
    let n = 0;
    for (let i = iLow0 - 1; i < iLow1; i++) {
      const a = fly[i], b = fly[i + 1], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, tx = (b.x - a.x) / l, tz = (b.z - a.z) / l;
      for (let d = 0; d < l; d += 1.15) for (let j = 0; j < 6; j++) {
        if (++n % 40 === 0) await ctx.yield();
        const r = fr(), off = (fr.chance(0.5) ? -1 : 1) * (3 + 50 * r * r), x0 = a.x + tx * d - tz * off, z0 = a.z + tz * d + tx * off;
        let x = x0, z = z0, e = chanEdge(x, z, 22);
        if (e > 2.6 && e < 9 && fr.chance(0.7)) {
          // (from a little way up the bar, walk down to the water's edge: the waterline is drawn in reeds)
          const gx = chanEdge(x + 1, z, 22) - chanEdge(x - 1, z, 22), gz = chanEdge(x, z + 1, 22) - chanEdge(x, z - 1, 22), gl = Math.hypot(gx, gz) || 1, go = e - fr.range(0.5, 1.9);
          x -= (gx / gl) * go; z -= (gz / gl) * go; e = chanEdge(x, z, 22);
        }
        if (e < -1.2) continue;
        const nn = noise.n2(x * 0.045, z * 0.045 + 31), n2 = noise.n2(x * 0.013 + 9, z * 0.013);
        if (e < 0.3) { if (fr.chance(0.55)) tuft(x, z, 2, fr.range(0.75, 1.25), fr.range(0.5, 0.9), mixc(olive, straw, fr.range(0.15, 0.7), 0.5)); }
        else if (e < 2.6) {
          if (fr.chance(0.6)) tuft(x, z, 2, fr.range(0.8, 1.4), fr.range(0.6, 1.1), mixc(olive, straw, fr.range(0.2, 0.9), 0.55));
          else tuft(x, z, 0, fr.range(0.4, 0.65), fr.range(0.8, 1.3), mixc(straw, C(2), fr.range(0, 0.6), 0.5));
        } else if (e < 16) {
          if (nn > 0.12) {
            if (fr.chance(0.4)) bush(x, z, fr.range(0.7, 1.5), fr.range(1.1, 2.4), mixc(C(2), olive, fr.range(0.1, 0.6), 0.5));
            else tuft(x, z, fr.chance(0.4) ? 1 : 0, fr.range(0.4, 0.7), fr.range(0.7, 1.2), mixc(straw, olive, fr.range(0, 0.6), 0.52));
          } else if (fr.chance(0.22)) tuft(x, z, fr.chance(0.3) ? 1 : 0, fr.range(0.35, 0.55), fr.range(0.6, 1), mixc(straw, C(0), fr.range(0, 0.5), 0.5));
        } else if (fr.chance(0.62)) {
          const k = fr();
          if (k < 0.22 && nn > -0.1) bush(x, z, fr.range(0.5, 1.0), fr.range(0.9, 1.9), mixc(C(1), C(2), n2 > 0 ? fr.range(0.5, 1) : fr.range(0, 0.4), 0.5));
          else if (k < 0.45) tuft(x, z, 1, fr.range(0.4, 0.62), fr.range(0.6, 1), mixc(straw, olive, fr.range(0.2, 0.7), 0.5));
          else tuft(x, z, 0, fr.range(0.35, 0.6), fr.range(0.8, 1.4), mixc(straw, C(3), fr.range(0, 0.7), 0.5 + 0.1 * fr()));
        }
      }
    }
    await ctx.yield();
  }
  // the near herd: instances, and for each (but the waders) a shadow drawn with the sprites' shadows
  const cariGeo0 = caribouGeo(), cariGeo = new THREE.InstancedBufferGeometry();
  for (const q of near) { q[2] *= 1.2; q[7] *= 1.2; }           // (a bull with his antlers stands two metres: from the low run that is a fifteenth of the frame)
  cariGeo.setIndex(cariGeo0.index); for (const nm of ['position', 'normal', 'color', 'aPart']) cariGeo.setAttribute(nm, cariGeo0.attributes[nm]);
  const cP = new Float32Array(Math.max(near.length, 1) * 4), cR = new Float32Array(Math.max(near.length, 1) * 4), wakes = [];
  near.forEach((q, i) => {
    cP.set([q[0], q[1], q[2], q[3]], i * 4); cR.set([q[4], q[5], q[6], q[7]], i * 4);
    if (q[8]) { wakes.push(q); return; }
    const k = hn * 4; hn++;
    hPos[k] = q[0]; hPos[k + 1] = q[1]; hPos[k + 2] = q[3]; hPos[k + 3] = 1.25 * q[2] / 0.19;
    hDir[k] = q[4]; hDir[k + 1] = q[5]; hDir[k + 2] = 3; hDir[k + 3] = 0.02;
  });
  cariGeo.setAttribute('iPos', new THREE.InstancedBufferAttribute(cP, 4)); cariGeo.setAttribute('iRot', new THREE.InstancedBufferAttribute(cR, 4));
  cariGeo.setAttribute('iUp', new THREE.InstancedBufferAttribute(new Float32Array(Math.max(near.length, 1)), 1));
  cariGeo.instanceCount = near.length;
  const uNearT = { value: 0 };
  const nearHerd = new THREE.Mesh(cariGeo, mat(CARI_VS, CARI_FS, { uNearT, uRim: { value: 0.3 } }));
  nearHerd.frustumCulled = false; nearHerd.name = 'near-herd'; root.add(nearHerd);

  // their reflections (see MIRR_VS): those that stand in the river or at its edge
  {
    const ms = near.filter((q) => chanEdge(q[0], q[1], 12) < 5.5).slice(0, 26), mg = new THREE.InstancedBufferGeometry();
    mg.setIndex(cariGeo0.index); for (const nm of ['position', 'color', 'aPart']) mg.setAttribute(nm, cariGeo0.attributes[nm]);
    const mP = new Float32Array(Math.max(ms.length, 1) * 4), mR = new Float32Array(Math.max(ms.length, 1) * 4);
    ms.forEach((q, i) => { mP.set([q[0], q[1], q[2], q[3]], i * 4); mR.set([q[4], q[5], q[6], q[7]], i * 4); });
    mg.setAttribute('iPos', new THREE.InstancedBufferAttribute(mP, 4)); mg.setAttribute('iRot', new THREE.InstancedBufferAttribute(mR, 4));
    mg.instanceCount = ms.length;
    const mm = new THREE.Mesh(mg, mat(MIRR_VS, MIRR_FS, { uNearT, uMap: { value: mapTex } }, { transparent: true, depthWrite: false, side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }));
    mm.frustumCulled = false; mm.renderOrder = 1; mm.name = 'herd-mirror'; root.add(mm);
  }
  await ctx.yield();
  // the tufts: one sheaf of seven blades, each a bent tapering strip; three carry a cotton head
  {
    const pos = [], aT = [], aOff = [], idx = [];
    for (let bI = 0; bI < 7; bI++) {
      const an = (bI / 7) * 6.2832 + 0.4 * Math.sin(bI * 2.3), lean = 0.22 + 0.3 * ((bI * 0.618) % 1), hh = 0.72 + 0.28 * ((bI * 0.377) % 1), ca = Math.cos(an), sa = Math.sin(an), i0 = pos.length / 3;
      for (let r = 0; r < 3; r++) {
        const t = r / 2, out = 0.12 + lean * t * t, y = hh * t, w = r === 2 ? 0 : 0.085 * (1 - 0.45 * t);
        if (r < 2) { pos.push(ca * out - sa * w, y, sa * out + ca * w, ca * out + sa * w, y, sa * out - ca * w); aT.push(t, 0, t, 0); aOff.push(0, 0, 0, 0, 0, 0); }
        else { pos.push(ca * out, y, sa * out); aT.push(1, 0); aOff.push(0, 0, 0); }
      }
      idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2, i0 + 2, i0 + 3, i0 + 4);
      if (bI % 2 === 0 && bI < 6) {
        const tx = ca * (0.12 + lean), ty = hh, tz = sa * (0.12 + lean), j0 = pos.length / 3;
        for (const o of [[0, 0.09, 0], [0.07, 0, 0.02], [-0.03, -0.07, 0.06], [-0.05, 0, -0.07]]) { pos.push(tx, ty, tz); aT.push(1, 1); aOff.push(o[0], o[1], o[2]); }
        idx.push(j0, j0 + 1, j0 + 2, j0, j0 + 2, j0 + 3, j0, j0 + 3, j0 + 1);
      }
    }
    const tg = new THREE.InstancedBufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 2)); tg.setAttribute('aOff', new THREE.Float32BufferAttribute(aOff, 3)); tg.setIndex(idx);
    const tP = new Float32Array(Math.max(tufts.length, 1) * 4), tC = new Float32Array(Math.max(tufts.length, 1) * 4);
    tufts.forEach((q, i) => { tP.set([q[0], q[1], q[2], q[3]], i * 4); tC.set([q[4], q[5], q[6], q[7]], i * 4); });
    tg.setAttribute('iPos', new THREE.InstancedBufferAttribute(tP, 4)); tg.setAttribute('iCol', new THREE.InstancedBufferAttribute(tC, 4)); tg.instanceCount = tufts.length;
    const tm = new THREE.Mesh(tg, mat(TUFT_VS, TUFT_FS, {}, { side: THREE.DoubleSide })); tm.frustumCulled = false; tm.name = 'bar-tufts'; root.add(tm);
    await ctx.yield();
    // the thickets: a low lumpy dome
    const dg = new THREE.SphereGeometry(1, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), dp = dg.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      const x = dp.getX(i), y = dp.getY(i), z = dp.getZ(i), k = 1 + 0.2 * Math.sin(x * 5.1 + z * 3.3) + 0.16 * Math.sin(z * 7.3 - y * 4.1 + 1.7) + 0.1 * Math.sin(x * 11 + y * 6);
      dp.setXYZ(i, x * k, y * (0.85 + 0.3 * Math.sin(x * 4.2 + z * 5.7 + 0.5)), z * k);
    }
    dg.computeVertexNormals();
    const bg = new THREE.InstancedBufferGeometry(); bg.setIndex(dg.index); bg.setAttribute('position', dg.attributes.position); bg.setAttribute('normal', dg.attributes.normal);
    const bP = new Float32Array(Math.max(bushes.length, 1) * 4), bC = new Float32Array(Math.max(bushes.length, 1) * 4);
    bushes.forEach((q, i) => { bP.set([q[0], q[1], q[2], q[3]], i * 4); bC.set([q[4], q[5], q[6], q[7]], i * 4); });
    bg.setAttribute('iPos', new THREE.InstancedBufferAttribute(bP, 4)); bg.setAttribute('iCol', new THREE.InstancedBufferAttribute(bC, 4)); bg.instanceCount = bushes.length;
    const bm = new THREE.Mesh(bg, mat(BUSH_VS, BUSH_FS)); bm.frustumCulled = false; bm.name = 'bar-willows'; root.add(bm);
  }
  await ctx.yield();
  const herdGeo = new THREE.InstancedBufferGeometry();
  herdGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(24), 3));
  herdGeo.setAttribute('corner', new THREE.Float32BufferAttribute([-.5, 0, 1, .5, 0, 1, .5, 1, 1, -.5, 1, 1, -.5, 0, 0, .5, 0, 0, .5, 1, 0, -.5, 1, 0], 3));
  herdGeo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  herdGeo.setAttribute('aPos', new THREE.InstancedBufferAttribute(hPos, 4));
  herdGeo.setAttribute('aDir', new THREE.InstancedBufferAttribute(hDir, 4));
  herdGeo.instanceCount = hn;
  const elev = Math.max(sunW.y, 0.05), sh2 = new THREE.Vector2(-sunW.x, -sunW.z).normalize();
  const HU = { uHerdAdv: { value: 0 }, uPx: { value: 0.0015 }, uShadowDir: { value: sh2 }, uShLen: { value: clamp(1.1 / Math.tan(Math.asin(elev)), 1.5, 8) }, uNearT };
  const herd = new THREE.Mesh(herdGeo, mat(HERD_VS, HERD_FS, HU, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  herd.frustumCulled = false; herd.renderOrder = 2; herd.name = 'herd'; root.add(herd);
  await ctx.yield();

  // ---- 6. snow geese: skeins on a loop (time), resting flocks that only lift in the rare event (progress)
  const gr = rng.fork('geese'), NSK = 14, NREST = Math.round(800 * detail), NKEY = 4 * 80 + 6 * 60 + 26, GMAX = Math.round(2200 * detail) + NREST + NKEY;
  const gA = new Float32Array(GMAX * 4), gB = new Float32Array(GMAX * 4), gO = new Float32Array(GMAX * 4); let gn = 0;
  const gch = delta.chans.filter((c) => !c.creek);
  const barPoint = (minOrder) => {
    for (let t = 0; t < 40; t++) { const c = gr.pick(gch); if (c.order < minOrder || c.node === -1) continue;
      const p = gr.pick(c.pts), s = gr.sign() * (c.w * 0.5 + gr.range(4, 12)); return [p[0] + s, p[1] + gr.range(-6, 6)]; }
    return [ROOT[0] + 40, ROOT[1] - 300];
  };
  for (let sIdx = 0; sIdx < NSK; sIdx++) {
    const a = barPoint(1), n = Math.min(gr.int(60, 300), Math.floor((GMAX - NREST - NKEY) / NSK * 1.6), GMAX - NREST - NKEY - gn);
    const bx = gr.range(-190, 190), by = gr.range(172, 245), bz = gr.range(110, 330);
    const period = gr.range(52, 84), ph = gr(), line = gr.chance(0.4), GS = 18, ng = Math.ceil(n / GS), gOffs = [];
    for (let g = 0; g < ng; g++) gOffs.push([gr.gauss() * 22, gr.range(-0.4, 0.4)]);
    for (let i = 0; i < n; i++, gn++) {
      const k = gn * 4, grp = Math.floor(i / GS), j = i % GS, r = Math.ceil(j / 2), side = line ? 1 : j % 2 ? 1 : -1;
      gA[k] = a[0]; gA[k + 1] = 0.12; gA[k + 2] = a[1]; gA[k + 3] = ph;
      gB[k] = bx; gB[k + 1] = by; gB[k + 2] = bz; gB[k + 3] = period;
      gO[k] = gOffs[grp][0] + side * r * 2.6 + gr.gauss() * 1.1; gO[k + 1] = clamp((grp + gOffs[grp][1] + r * 0.09 + gr.gauss() * 0.03) / ng, 0, 1) * 0.25; gO[k + 2] = gr(); gO[k + 3] = 0;
    }
  }
  await ctx.yield();
  const flocks = []; for (let i = 0; i < 36; i++) flocks.push(barPoint(2));
  // (and on the bars of the trunk and the first arms, which the camera skims)
  const armC = graph.filter((n) => n.order <= 1).map((n) => delta.byNode[n.id]).filter((c) => c && c.pts.length > 3);
  for (let i = 0; i < 10 && armC.length; i++) { const c = armC[i % armC.length], q = c.pts[gr.int(1, c.pts.length - 2)], sd = gr.sign() * (c.w * 0.5 + gr.range(5, 14)); flocks.splice(gr.int(0, 12), 0, [q[0] + sd, q[1] + gr.range(-8, 8)]); }
  // three skeins keyed to the world's progress: they cross between the spur and the plain while the camera hangs there
  // (routes laid out against the fly-through: each is over the tundra left of the spur, 250-400 m off, while the camera
  // hangs above the fork; every route carries three chevrons, drawn big enough to read as birds)
  // a fourth crosses the mouth of the saddle, below and ahead of the camera, as the plain opens (keyed by setReveal)
  // (their progress is the share of the finale flown, 0 at the crest and 1 at the gate: see setFinale)
  //   one goes down the west flank with us and out over the plain; one comes off the western bars and crosses our bows
  //   low over the trunk; one crosses the foot of the spur as we climb back to it, clear of the gate's own axis
  const sdl = fly[1], fk = flyKeys.forkAt, keyed = [[40, 150, 90, -420, 45, -330, 0.06, 0.34, 2], [fk[0] - 120, 2, fk[1] - 60, 86, 60, -150, 0.33, 0.3, 2], [-330, 60, -60, 60, 110, -330, 0.62, 0.3, 2],
    [sdl.x - 250, sdl.y - 28, sdl.z - 95, sdl.x + 190, sdl.y - 86, sdl.z - 300, 0, 1, 3]];
  for (const [ax, ay, az, bx, by, bz, u0, du, kq] of keyed) {
    const len = Math.hypot(bx - ax, by - ay, bz - az);
    for (let i = 0; i < 80; i++, gn++) {
      const v = i < 26 ? 0 : i < 52 ? 1 : 2, j = i - v * 26, r = Math.ceil(j / 2), side = j % 2 ? 1 : -1, k = gn * 4;
      gA[k] = ax; gA[k + 1] = ay; gA[k + 2] = az; gA[k + 3] = u0;
      gB[k] = bx; gB[k + 1] = by; gB[k + 2] = bz; gB[k + 3] = du;
      gO[k] = [0, 52, -66][v] + side * r * (5.2 + 0.5 * Math.sin(v * 2.1 + side)) + gr.gauss() * 2.4 + Math.sin(r * 0.8 + v * 2 + side) * 3.2; gO[k + 1] = ([0, 95, 170][v] + r * 6.4 + gr.gauss() * 3.4 + (gr.chance(0.18) ? 5 : 0)) / len; gO[k + 2] = gr(); gO[k + 3] = kq;
    }
  }
  {
    // one more skein, for the climb to the gate: twenty-six birds in a V that come in from the east and cross the sky
    // left of the ring, high over the spur, as the camera climbs the last of the way (seen from below, against the
    // cloud: see vUnder in GEESE_VS)
    const kr2 = makeRng(hashSeed('branching-gate-skein:' + ctx.seed)), A = [215, 186, 70], B = [15, 206, -20], len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
    for (let i = 0; i < 26; i++, gn++) {
      const r = Math.ceil(i / 2), side = i % 2 ? 1 : -1, k = gn * 4;
      gA[k] = A[0]; gA[k + 1] = A[1]; gA[k + 2] = A[2]; gA[k + 3] = 0.74;
      gB[k] = B[0]; gB[k + 1] = B[1]; gB[k + 2] = B[2]; gB[k + 3] = 0.2;
      gO[k] = side * r * 7.2 + kr2.gauss() * 1.1; gO[k + 1] = (r * 8.4 + kr2.gauss() * 1.6) / len; gO[k + 2] = kr2(); gO[k + 3] = 2;
    }
  }
  {
    // the streams over the fork (see GEESE_VS), laid where the tundra, not the pale river, is behind the birds as the
    // flank line sees them: one crosses the middle of the high view from the west, over the crimson strip between the
    // river and the spur's foot; one comes up off the bars by the fork straight toward the flank line and over it; one
    // flies north with us, below and to the left, down the same strip
    const sr = makeRng(hashSeed('branching-streams:' + ctx.seed));
    // (and one for the climb back to the gate: it crosses our bows from the left, a stone's throw ahead and below, with the
    // spur's sunlit flank behind it)
    const streams = [[-300, 40, -120, -50, 60, -95, 0.0, 0.27], [fk[0] - 70, 5, fk[1] - 70, -78, 128, 110, 0.1, 0.3], [-190, 60, 230, -175, 45, -150, -0.02, 0.2], [34, 62, -212, -176, 92, -112, 0.7, 0.24], [78, 80, -236, -150, 106, -138, 0.71, 0.24],
      // (and one across the head of the stair, under the ring, as we come up to it)
      [130, 147, -36, -150, 158, -22, 0.86, 0.14]];
    for (const [ax, ay, az, bx, by, bz, u0, du] of streams) {
      const len = Math.hypot(bx - ax, by - ay, bz - az);
      for (let i = 0; i < 60; i++, gn++) {
        const v = Math.floor(i / 15), j = i - v * 15, r = Math.ceil(j / 2), side = j % 2 ? 1 : -1, k = gn * 4;
        gA[k] = ax; gA[k + 1] = ay; gA[k + 2] = az; gA[k + 3] = u0;
        gB[k] = bx; gB[k + 1] = by; gB[k + 2] = bz; gB[k + 3] = du;
        gO[k] = [0, 24, -30, 12][v] + side * r * (4.4 + 0.4 * Math.sin(v * 2.1 + side)) + sr.gauss() * 1.4;
        gO[k + 1] = v * 0.25 + (r * 5.6 + sr.gauss() * 2 + [0, 14, 5, 22][v]) / len; gO[k + 2] = sr(); gO[k + 3] = 4;
      }
    }
  }
  for (let i = 0; i < NREST && gn < GMAX; i++, gn++) {
    const f = flocks[Math.floor(Math.pow(gr(), 1.6) * flocks.length)], a = [f[0] + gr.gauss() * 7, f[1] + gr.gauss() * 9], k = gn * 4;
    gA[k] = a[0]; gA[k + 1] = 0.12; gA[k + 2] = a[1]; gA[k + 3] = gr();
    gB[k] = a[0] + gr.range(-90, 90); gB[k + 1] = gr.range(35, 130); gB[k + 2] = a[1] + gr.range(120, 420); gB[k + 3] = 60;
    gO[k] = gr.range(-20, 20); gO[k + 1] = clamp((a[1] - SHORE) / 1500, 0, 1) * 1.2 + gr() * 0.12; gO[k + 2] = gr(); gO[k + 3] = 1;
  }
  const gv = [], gw = [], tri3 = (...v) => v.forEach((p) => { gv.push(p[0], 0, p[1]); gw.push(Math.abs(p[0]) * 2); });
  tri3([0, -0.3], [-0.045, 0], [0.045, 0]); tri3([-0.045, 0], [0, 0.2], [0.045, 0]);
  for (const s of [-1, 1]) { tri3([s * 0.04, -0.09], [s * 0.3, -0.075], [s * 0.04, 0.08]); tri3([s * 0.04, 0.08], [s * 0.3, -0.075], [s * 0.5, 0.05]); }
  const gooseGeo = new THREE.InstancedBufferGeometry();
  gooseGeo.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3));
  gooseGeo.setAttribute('aW', new THREE.Float32BufferAttribute(gw, 1));
  gooseGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(gA, 4));
  gooseGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(gB, 4));
  gooseGeo.setAttribute('aO', new THREE.InstancedBufferAttribute(gO, 4));
  gooseGeo.instanceCount = gn;
  const GU = { uPx: HU.uPx, uEvent: { value: 0 }, uProg: { value: 0 }, uRev: { value: new THREE.Vector2(0.52, 0.22) } };
  const geese = new THREE.Mesh(gooseGeo, mat(GEESE_VS, GEESE_FS, GU, { side: THREE.DoubleSide }));
  geese.frustumCulled = false; geese.name = 'geese'; root.add(geese);
  await ctx.yield();
  // ROUND 21 (F2): each bird of the loop skeins and the streams is kept off the lens's line by its own place across.
  // Nothing held them against the route (this part is built before the world has its path): the world calls this once
  // it has. `line` is the route where the geese are drawn, a point every quarter of a metre, five numbers each: x, y, z
  // in this part's own frame (as the world's place() scales the part), 2.0 m of the lens's air in this part's metres,
  // and the progress u there (not read here: the test is by place along the whole of that line, whether or not a
  // stream is drawn there). No height is written: A, B, the phase and the period of every skein and stream stay as
  // dealt, and so do each bird's delay (aO.y) and its number for the sines (aO.z). Each bird's own way is walked as
  // GEESE_VS flies it: at the share q of its flight it is q of the way from A to B in plan, across that line by its
  // own place aO.x and (a loop skein's bird) by the skein's weave sin(q * 9 + phase * 40) * 6 m, at the height
  // mix(A.y, B.y, smoothstep(0, .8, q)) (a stream's bird: by q itself) with its own bob sin(q * 23 + aO.z * 6.3) *
  // 1.2 m; a tested place every quarter of a metre of flight at most, against every point of the line. The skin is the
  // chevron's furthest vertex (the wing tip at full flap) at the shader's near size (k = .3): 0.186 m. (That .3 is the
  // floor in the shader's size, k = max(.3, dist * uPx * (3.4 to 16, and 5 more for a stream's bird) / S) * vVis: over
  // the floor the size grows with the lens's distance and with a smaller picture (uPx) and falls with the part's own
  // scale S; vVis, the bird's showing, 1 at the most, multiplies either. 2.2 m from the lens the floor rules while
  // the picture is taller than about 185 lines for a stream's bird, 30 for a loop skein's; in a smaller picture a
  // near bird is drawn bigger than this skin.) A bird whose way keeps 2.0 m and the
  // skin everywhere, and the half steps of the two walks besides (a pair fails where the gap squared is under
  // T^2 + e^2, e the half steps: some 14 mm more is asked), is not written. One whose way does not has its place across
  // MOVED ASIDE to the
  // nearest place from which its whole way clears: away from the line on the side where it passes it (when at all its
  // failing places its place across lies on one side of the line's); where the line crosses its way (failing places
  // on both sides, or dead on) the side that asks the lesser move, and if they are equal the side of its dealt sign.
  // The place is found by a sweep over the tested places in the order of their places across (see below), each step
  // landing on the far edge of a forbidden stretch. A loop skein's bird is walked from q = .03 on: below that it fans
  // out from the bar and its place across is not yet whole in the law (it acts by smoothstep(0, .03, q)), so no move
  // across clears a bird on the bar, and a moved bird sits on the bar where it was dealt. Nothing is drawn from a
  // generator; the work is handed back (ctx.yield) after each skein and after each moved bird. A moved bird is then
  // held against the other birds of its skein, where both are in the air (the take-off from the bar is not held),
  // and may be sent on further across, the way it was moved (NO TWO BIRDS IN ONE PLACE, below; that search hands the
  // work back after each bird's pairs).
  const geeseAside = async (line) => {
    const NL = line.length / 5, HB = 0.25, hf = new Float64Array(NL);
    const gap = (a, b) => Math.hypot(line[a * 5] - line[b * 5], line[a * 5 + 1] - line[b * 5 + 1], line[a * 5 + 2] - line[b * 5 + 2]);
    for (let m = 0; m < NL; m++) hf[m] = Math.max(m > 0 ? gap(m, m - 1) : 0, m < NL - 1 ? gap(m, m + 1) : 0) / 2;
    // (the flap lifts a vertex by |x| * (flap * .85 + .12) - aW^2 * flap * .12, flap from -1 to 1)
    let chev = 0;
    for (let v = 0; v < gw.length; v++) { const x = Math.abs(gv[v * 3]), w2 = gw[v] * gw[v] * 0.12; chev = Math.max(chev, Math.hypot(x, Math.max(Math.abs(x * 0.97 - w2), Math.abs(x * 0.73 - w2)), gv[v * 3 + 2])); }
    chev *= 0.3;
    let moved = false;
    for (let i0 = 0, i1; i0 < gn; i0 = i1) {
      const k0 = i0 * 4, kind = gO[k0 + 3]; i1 = i0 + 1;
      if (kind !== 0 && kind !== 4) continue;                       // (the keyed skeins, the gate skein and the resting geese are not touched)
      const same = (i) => { for (let c = 0; c < 4; c++) if (gA[i * 4 + c] !== gA[k0 + c] || gB[i * 4 + c] !== gB[k0 + c]) return false; return gO[i * 4 + 3] === kind; };
      while (i1 < gn && same(i1)) i1++;
      const n = i1 - i0, strm = kind === 4, ax = gA[k0], ay = gA[k0 + 1], az = gA[k0 + 2], by = gB[k0 + 1];
      let dx = gB[k0] - ax, dz = gB[k0 + 2] - az; const len = Math.max(Math.hypot(dx, dz), 1e-3); dx /= len; dz /= len;
      // its birds in the order of their places across the line
      const ord = []; for (let i = i0; i < i1; i++) ord.push(i);
      ord.sort((p, q) => gO[p * 4] - gO[q * 4]);
      const ox = Float64Array.from(ord, (i) => gO[i * 4]), oz = Float64Array.from(ord, (i) => gO[i * 4 + 2]);
      const wv = strm ? 0 : 6, wph = gA[k0 + 3] * 40, q0 = strm ? 0 : 0.03;
      // (no bird moves more than HB between two tested places: its fastest, for one unit of q)
      const dq = HB / (strm ? Math.hypot(len, Math.abs(by - ay) + 1.2 * 23) : Math.hypot(len + 6 * 9, Math.abs(by - ay) * 1.5 / 0.8 + 1.2 * 23));
      const sheet = (q) => ay + (by - ay) * (strm ? q : smoothstep(0, 0.8, q));     // the skein's height at q, before the bob
      // THE TESTED PAIRS: a point of the line and a share q of the flight from which a bird could reach it (the shares a
      // step of dq apart at most, over the stretch of the flight within reach of the point), four numbers each: c, the
      // place across that would pass dead on (the point's place across the skein's own line, less the weave at q);
      // `left`, (the need with the skin) squared plus (half a step of the line and of the bird) squared, less the gap
      // along squared: what is left for the gaps across and in height (two tested points stand off the true nearest
      // pair by half a step each, at right angles to the gap); g, the skein's height there less the point's; b, the
      // bob's own angle q * 23. A bird with the place across o and the number z FAILS at a pair when
      // (o - c)^2 + (g + sin(b + z * 6.3) * 1.2)^2 < left. A pair that no bob can reach is not kept.
      const C = [], R = [], Gp = [], Bb = [];
      for (let m = 0; m < NL; m++) {
        const k = m * 5, px = line[k] - ax, pz = line[k + 2] - az, a = px * dx + pz * dz, T = line[k + 3] + chev, e = hf[m] + HB / 2, Tp = T + e;
        const qa = Math.max(q0, (a - Tp) / len), qb = Math.min(1, (a + Tp) / len);
        if (qb < qa) continue;
        const y = line[k + 1], ha = sheet(qa), hb = sheet(qb);
        if (y < Math.min(ha, hb) - 1.2 - Tp || y > Math.max(ha, hb) + 1.2 + Tp) continue;   // (the skein's height is out of this point's reach at any such q, whatever the bob)
        const l = pz * dx - px * dz, t2 = T * T + e * e, nq = Math.max(1, Math.ceil((qb - qa) / dq));
        for (let s = 0; s <= nq; s++) {
          const q = qa + (qb - qa) * s / nq, da = q * len - a, left = t2 - da * da, g = sheet(q) - y, gm = Math.abs(g) - 1.2;
          if (left <= 0 || (gm > 0 && gm * gm >= left)) continue;
          C.push(l - (wv ? Math.sin(q * 9 + wph) * wv : 0)); R.push(left); Gp.push(g); Bb.push(q * 23);
        }
      }
      // the finding: at every pair, the birds whose places across are within reach of it; each is tried with its own
      // bob, and of a failing bird it is kept on which side of the line its failing places lie (1: its place across
      // is the greater; 2: the lesser; 3: both, or dead on)
      const fl = new Uint8Array(n); let any = false;
      for (let p = 0; p < C.length; p++) {
        const c = C[p], r = Math.sqrt(R[p]);
        let j = 0, hi = n; while (j < hi) { const b = (j + hi) >> 1; if (ox[b] <= c - r) j = b + 1; else hi = b; }
        for (; j < n && ox[j] < c + r; j++) {
          const dl = ox[j] - c, dy = Gp[p] + Math.sin(Bb[p] + oz[j] * 6.3) * 1.2;
          if (dl * dl + dy * dy < R[p]) { fl[j] |= dl > 0 ? 1 : dl < 0 ? 2 : 3; any = true; }
        }
      }
      if (any) {
        await ctx.yield();
        // the pairs in the order of their places across, so that a sweep meets only the pairs near where it stands
        const M = C.length, id = new Uint32Array(M); for (let p = 0; p < M; p++) id[p] = p;
        id.sort((p, q) => C[p] - C[q]);
        const Cs = new Float64Array(M), Rs = new Float64Array(M), Gs = new Float64Array(M), Bs = new Float64Array(M); let rmax = 0;
        for (let p = 0; p < M; p++) { const i = id[p]; Cs[p] = C[i]; Rs[p] = R[i]; Gs[p] = Gp[i]; Bs[p] = Bb[i]; if (R[i] > rmax) rmax = R[i]; }
        rmax = Math.sqrt(rmax);                                      // (no pair forbids a place further than this from its own c)
        await ctx.yield();
        // THE SWEEP, from the place o toward the side sg: every pair that could forbid the place it stands at is tried
        // (the same test as the finding's); where the bird would fail, the place is put a tenth of a millimetre beyond
        // the far edge of that pair's forbidden stretch (so that the attribute's 32 bits cannot round it back inside,
        // which holds for a place across under 2,048 m: the dealt ones are tens of metres;
        // a step is taken only if it moves the place on, so the sweep ends); again until a whole sweep moves nothing.
        // Every place passed over lies in some pair's forbidden stretch or in that tenth of a millimetre, so the place
        // it ends at is the nearest on that side from which the bird's whole way clears, and one a 32-bit attribute holds.
        const sweep = (o, z, sg) => {
          let x = o;
          for (let again = true; again;) {
            again = false;
            let p = 0, hi = M;
            if (sg > 0) {
              while (p < hi) { const b = (p + hi) >> 1; if (Cs[b] <= x - rmax) p = b + 1; else hi = b; }
              for (; p < M && Cs[p] - rmax < x; p++) {
                const dl = x - Cs[p], dy = Gs[p] + Math.sin(Bs[p] + z * 6.3) * 1.2;
                if (dl * dl + dy * dy < Rs[p]) { const nx = Math.fround(Cs[p] + Math.sqrt(Rs[p] - dy * dy) + 1e-4); if (nx > x) { x = nx; again = true; } }
              }
            } else {
              while (p < hi) { const b = (p + hi) >> 1; if (Cs[b] < x + rmax) p = b + 1; else hi = b; }
              for (p--; p >= 0 && Cs[p] + rmax > x; p--) {
                const dl = x - Cs[p], dy = Gs[p] + Math.sin(Bs[p] + z * 6.3) * 1.2;
                if (dl * dl + dy * dy < Rs[p]) { const nx = Math.fround(Cs[p] - Math.sqrt(Rs[p] - dy * dy) - 1e-4); if (nx < x) { x = nx; again = true; } }
              }
            }
          }
          return x;
        };
        // NO TWO BIRDS IN ONE PLACE (the designer's term). While both are in the air (q from q0 on: a bird under q0, on
        // the bar or taking off from it, is held against nobody) a moved bird may not stand nearer to another bird of
        // its skein or stream, centre to centre, than that skein's nearest two in the air stand AS DEALT (d0, the least
        // at the tested q: at or over the true least): where the place found by the
        // sweep would, it goes on outward across (the way it was moved) by the least to the next place that is free of
        // every neighbour and also passes the line's test; its delay and its number for the sines stay as dealt.
        // Two birds in the air keep their gap in q (the difference of their delays; a stream's two also fly a lap apart,
        // that gap less one), so along they stand that gap times len apart at every clock; across by their two places
        // and (a loop skein) the difference of their two weaves; in height by the sheet and their two bobs. The last two
        // change with the clock, so a pair is walked over the flight where both are in the air (q from q0 on):
        // near(j, m, xm, L2, st, keep) holds bird j at q against bird m at q + dl standing at the place xm, a tested q
        // every st at most; there a2 is their gap along squared, c the place across at which j would stand level with m,
        // h their gap in height. keep false: it returns the least, over the tested q, of a2 + (j's dealt place - c)^2
        // + h^2: the pair's distance squared at its nearest tested q (a pair whose gaps along and across alone are L2
        // or more is not walked). keep true:
        // every tested q at which j could stand nearer than L2 allows is kept as a forbidden stretch of j's places
        // across, its middle (SC) and its half width squared (SR). Between two tested q the gap between the two birds
        // is a piece of a path: half a piece is at most e long (half a step times the pair's greatest speed against each
        // other: the two weaves' difference 2 * 6 * 9 * min(1, 4.5 * |dl|), a loop skein's sheet (B.y - A.y) * 6 / .8^2
        // * |dl| (a stream has no such term: its sheet is a straight climb, which leaves the gap between two birds as
        // it is), the two bobs 2 * 1.2 * 23), and the path
        // leaves its chord by at most `bend` (a step squared over 8 times its greatest turning: two weaves 6 * 9^2, a
        // loop skein's sheet (B.y - A.y) * 6 / .8^2 twice, two bobs 1.2 * 23^2). So a
        // pair no nearer than sqrt((d0 + bend)^2 + e^2) at every tested q is no nearer than d0 at any clock.
        const oy = Float64Array.from(ord, (i) => gO[i * 4 + 1]), D = Math.abs(by - ay), SC = [], SR = [];
        const bend = dq * dq / 8 * (2 * wv * 81 + (strm ? 0 : 2 * D * 6 / 0.64) + 2 * 1.2 * 529);
        const near = (j, m, xm, L2, st, keep) => {
          let best = Infinity; const dy = oy[j] - oy[m];
          for (let lap = 0; lap < (strm ? 2 : 1); lap++) {
            const dl = strm ? dy - Math.floor(dy) - lap : dy, al = Math.abs(dl), a2 = al * len * al * len;
            const qa = Math.max(q0, q0 - dl), qb = Math.min(1, 1 - dl);
            if (qb <= qa) continue;
            let lim = L2 - a2;
            if (keep) { const e = st / 2 * Math.hypot(2 * wv * 9 * Math.min(1, 4.5 * al), (strm ? 0 : D * 6 / 0.64 * al) + 2 * 1.2 * 23); lim += e * e; }
            else { const s = Math.abs(ox[j] - xm) - 2 * wv * Math.min(1, 4.5 * al); if (s > 0 && s * s >= lim) continue; }
            if (lim <= 0) continue;
            const nq = Math.max(1, Math.ceil((qb - qa) / st)), bj = oz[j] * 6.3, bm = oz[m] * 6.3;
            for (let s = 0; s <= nq; s++) {
              const q = qa + (qb - qa) * s / nq, p = q + dl, h = sheet(q) - sheet(p) + (Math.sin(q * 23 + bj) - Math.sin(p * 23 + bm)) * 1.2;
              const c = xm + (wv ? (Math.sin(p * 9 + wph) - Math.sin(q * 9 + wph)) * wv : 0);
              if (keep) { const left = lim - h * h; if (left > 0) { SC.push(c); SR.push(left); } }
              else { const d2 = a2 + (ox[j] - c) * (ox[j] - c) + h * h; if (d2 < best) best = d2; }
            }
          }
          return best;
        };
        // d0, from the places as dealt (none is written yet): first the pairs at the two ends of their flight (a bound
        // from above that spares most walks), then the pairs that could still come under the least found, walked; in
        // both rounds a pair too far apart across or along to come under the least found so far is passed over
        let d2 = Infinity;
        for (const st of [1, dq]) {
          for (let j = 0; j < n; j++) {
            for (let m = j + 1; m < n; m++) {
              const s = ox[m] - ox[j] - 2 * wv; if (s > 0 && s * s >= d2) break;   // (the places across are in order: no later bird is nearer)
              const v = near(j, m, ox[m], d2, st, false); if (v < d2) d2 = v;
            }
            await ctx.yield();
          }
        }
        const lim0 = (Math.sqrt(d2) + bend) * (Math.sqrt(d2) + bend);
        for (let j = 0; j < n; j++) {
          if (!fl[j]) continue;
          let o;
          if (fl[j] === 1) o = sweep(ox[j], oz[j], 1); else if (fl[j] === 2) o = sweep(ox[j], oz[j], -1);
          else { const p = sweep(ox[j], oz[j], 1), m = sweep(ox[j], oz[j], -1), dp = p - ox[j], dm = ox[j] - m; o = dp < dm ? p : dm < dp ? m : ox[j] < 0 ? m : p; }
          // its neighbours: the birds that stay where they were dealt and the moved birds already placed (ox holds a
          // placed bird's new place); a failing bird not yet placed is held against this one when its turn comes
          const sg = o > ox[j] ? 1 : -1; SC.length = 0; SR.length = 0;
          for (let m = 0; m < n; m++) if (m !== j && (!fl[m] || m < j)) near(j, m, ox[m], lim0, dq, true);
          for (;;) {
            let x = o;
            for (let again = true; again;) {
              again = false;
              for (let p = 0; p < SC.length; p++) { const dl = x - SC[p]; if (dl * dl < SR[p]) { const t = Math.fround(SC[p] + sg * (Math.sqrt(SR[p]) + 1e-4)); if (sg > 0 ? t > x : t < x) { x = t; again = true; } } }
            }
            if (x === o) break;
            o = sweep(x, oz[j], sg);                                 // (the line's test again from the place the neighbours leave free)
          }
          gO[ord[j] * 4] = o; ox[j] = o; moved = true;
          await ctx.yield();
        }
      }
      await ctx.yield();
    }
    if (moved) gooseGeo.attributes.aO.needsUpdate = true;
  };

  // ---- 7. cloud shreds through the notch, banners off the towers
  const cr = rng.fork('shreds'), NC = 36, NCX = 18, cS = new Float32Array((NC + NCX) * 4), cT = new Float32Array((NC + NCX) * 4), wsg = sunW.x < 0 ? 1 : -1;
  {
    // seen from the climb to the gate: shreds of cloud that drift across the bastion's face below the ring (never as
    // high as its foot) and across the foot of the wall, three puffs to a shred
    const xr = makeRng(hashSeed('branching-banners:' + ctx.seed));
    for (let c = 0; c < 6; c++) {
      const hiS = c % 3 < 2, len = xr.range(150, 200), x0 = xr.range(-20, 20), y0 = hiS ? xr.range(100, 118) : xr.range(78, 92), z0 = hiS ? xr.range(-84, -64) : xr.range(-104, -90), sp = xr.range(10, 14), ph = 1 + (c + xr.range(0, 0.2)) / 6.1;
      for (let j = 0; j < 3; j++) {
        const k = (NC + c * 3 + j) * 4;
        cS[k] = x0 + (j - 1) * xr.range(13, 19); cS[k + 1] = y0 + xr.range(-3, 3); cS[k + 2] = z0 + xr.range(-4, 4); cS[k + 3] = xr.range(9.5, 13.5) * (j === 1 ? 1.25 : 1);
        cT[k] = len * wsg; cT[k + 1] = sp * wsg; cT[k + 2] = ph; cT[k + 3] = 0;
      }
    }
  }
  // (the tower that stands up-wind of the ring: its banner would lie across behind the ring and read as cloud in it.
  // It streams up and over instead, pitched to pass clear above the ring's top, and its shreds ride the same line)
  const upw = wsg > 0 ? 0 : 1, banP = clamp((seat.y + RING + 12 - towerTops[upw].y) / TX, 0.3, 0.7);
  for (let i = 0; i < NC; i++) {
    const k = i * 4, banner = i >= 12 && i < 24;
    if (i >= 24) {
      // torn cloud streaming over the saddle and down its lee, under the camera as it clears the crest
      const z = CREST_Z + cr.range(-70, 26), len = cr.range(200, 320), x = cr.range(-70, 40);
      cS[k] = x; cS[k + 1] = Math.max(H(x, z), H(-12, z)) + cr.range(5, 22); cS[k + 2] = z; cS[k + 3] = cr.range(11, 21);
      cT[k] = len * wsg; cT[k + 1] = cr.range(10, 17) * wsg; cT[k + 2] = cr(); cT[k + 3] = 0;
    } else if (!banner) {
      const z = cr.range(86, 176), len = cr.range(230, 340);
      cS[k] = T.spurX(z) + cr.range(-12, 12); cS[k + 1] = T.spurH(z) + cr.range(-2, 16); cS[k + 2] = z; cS[k + 3] = cr.range(10, 20);
      cT[k] = len * wsg; cT[k + 1] = cr.range(9, 15) * wsg; cT[k + 2] = cr(); cT[k + 3] = 0;
    } else {
      const t = towerTops[i % 2], len = cr.range(46, 80);
      cS[k] = t.x + wsg * len * 0.5; cS[k + 1] = t.y - cr.range(0, 5) + (i % 2 === upw ? banP * len * 0.5 : 0); cS[k + 2] = t.z + len * 0.09 * wsg; cS[k + 3] = cr.range(6, 10);
      cT[k] = len * wsg; cT[k + 1] = cr.range(6, 10) * wsg; cT[k + 2] = cr(); cT[k + 3] = 1;
    }
  }
  await ctx.yield();
  const shredGeo = new THREE.InstancedBufferGeometry();
  shredGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  shredGeo.setAttribute('corner', new THREE.Float32BufferAttribute([-.5, -.5, .5, -.5, .5, .5, -.5, .5], 2));
  shredGeo.setIndex([0, 1, 2, 0, 2, 3]);
  shredGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(cS, 4));
  shredGeo.setAttribute('aT', new THREE.InstancedBufferAttribute(cT, 4));
  shredGeo.instanceCount = NC + NCX;
  const shreds = new THREE.Mesh(shredGeo, mat(SHRED_VS, SHRED_FS, {}, { transparent: true, depthWrite: false }));
  shreds.frustumCulled = false; shreds.renderOrder = 3; shreds.name = 'cloud-shreds'; root.add(shreds);
  {
    // the banners: two streamers to a tower, one over the other
    const bg0 = new THREE.PlaneGeometry(1, 1, 14, 2); bg0.translate(0.5, 0.5, 0);
    const bg = new THREE.InstancedBufferGeometry(); bg.setIndex(bg0.index); bg.setAttribute('position', bg0.attributes.position); bg.setAttribute('uv', bg0.attributes.uv);
    const b0 = new Float32Array(16), b1 = new Float32Array(16), xr = makeRng(hashSeed('branching-banner:' + ctx.seed));
    for (let i = 0; i < 4; i++) {
      const tw = towerTops[i % 2], up = i < 2 ? 0 : 1, ov = i % 2 === upw;
      b0.set([tw.x + wsg * 0.4, tw.y - 0.6 - up * 3.4, tw.z, (ov ? (up ? 46 : 64) : up ? 58 : 92) * xr.range(0.9, 1.15)], i * 4);
      b1.set([wsg, ov ? banP + up * 0.16 : up ? 0.26 : 0.1, 0.2 + (up ? 0.14 : 0), xr()], i * 4);        // (always away to the south: behind the ring, never across its face)
    }
    bg.setAttribute('aB0', new THREE.InstancedBufferAttribute(b0, 4)); bg.setAttribute('aB1', new THREE.InstancedBufferAttribute(b1, 4)); bg.instanceCount = 4;
    const banners = new THREE.Mesh(bg, mat(BAN_VS, BAN_FS, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    banners.frustumCulled = false; banners.renderOrder = 3; banners.name = 'banners'; root.add(banners);
  }
  await ctx.yield();

  // ---- 8. anchors: the safe line along the spur, the gate, the views
  const notchZ = 130;
  const anchors = {
    portalSeat: { position: seat.clone(), facing: new THREE.Vector3(0, -Math.sin(dip), -Math.cos(dip)), direction: new THREE.Vector3(0, Math.sin(dip), Math.cos(dip)), radius: RING },
    flyThrough: fly, flyKeys,
    saddle: new THREE.Vector3(-8, H(-8, CREST_Z), CREST_Z),
    reveal: fly[1].clone(),
    notch: new THREE.Vector3(T.spurX(notchZ), H(T.spurX(notchZ), notchZ), notchZ),
    deltaRoot: new THREE.Vector3(ROOT[0], 0, ROOT[1]),
    deltaCentre: new THREE.Vector3(ROOT[0], 0, (ROOT[1] + SHORE) * 0.5),
    gorgeMouth: new THREE.Vector3(T.gorgeXf(0), 0, 0),
    towerTops, sunDir: sunW.clone(),
  };

  // ---- per frame
  const camW = new THREE.Vector3(), qW = new THREE.Quaternion(), size = new THREE.Vector2();
  let event = 0, run = 0, prog = 0, uCrest = 0.31, uNow = 0, nearU = 0.62; const evt = [0.34, 0.6], rev = [0.25, 0.17];
  const update = (dt, time, camera) => {
    U.uTime.value = time;
    root.updateWorldMatrix(true, false);
    if (camera) {
      camW.setFromMatrixPosition(camera.matrixWorld); U.uCamL.value.copy(root.worldToLocal(camW));
      let hgt = 720; if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); hgt = Math.max(size.y, 1); }
      HU.uPx.value = 2 / (Math.max(Math.abs(camera.projectionMatrix.elements[5]), 1e-3) * hgt);
    }
    root.getWorldQuaternion(qW).invert(); U.uSunL.value.copy(sunW).applyQuaternion(qW).normalize();
    run += Math.min(dt || 0, 0.1) * event * 1.4;                       // the herd breaks into a run in the rare event
    HU.uHerdAdv.value = (time % 900) * 0.3 + run;
    GU.uEvent.value = event; GU.uProg.value = prog;
    // the near herd walks on the flight's own clock, so it is where it was put when the camera comes by
    const nt = (uNow - nearU) * 46; uNearT.value = nt;
    for (let i = 0; i < 10; i++) { const q = wakes[i]; if (q) uWake.value[i].set(q[0] + q[4] * q[3] * nt, q[1] + q[5] * q[3] * nt, q[4], q[5]); }
  };
  update(0, 0, null);

  return {
    object: root, radius: 420, height: 320, center: new THREE.Vector3(0, 120, -640),
    extent: { min: new THREE.Vector3(-1300, 0, -2600), max: new THREE.Vector3(1300, 215, 560), crest: 180 },
    anchors, graph, uniforms: U, heightAt: H, rareEvent: rare, channels: delta.chans,
    // world progress u; the keyed skeins and the rare event run on the share of the finale flown (crest 0, gate 1)
    setProgress(u) { uNow = u; prog = (u - uCrest) / Math.max(1 - uCrest, 1e-3); event = rare ? smoothstep(evt[0], evt[1], prog) : 0; },
    setFinale(u) { uCrest = u; this.setReveal(rev[0], rev[1]); },
    setEvent(v0, v1) { evt[0] = v0; evt[1] = v1; },
    setNear(u) { nearU = u; },                    // the u at which the near herd stands where it was placed
    nearCount: near.length,
    setReveal(u0, du) { rev[0] = u0; rev[1] = du; GU.uRev.value.set((u0 - uCrest) / Math.max(1 - uCrest, 1e-3), du / Math.max(1 - uCrest, 1e-3)); },
    geeseAside,                                   // (line): once, when the world has its path (see ROUND 21 (F2) above)
    update,
    dispose() { /* everything is reachable from `object` */ },
    ground: false, groundY: 0,
  };
}
