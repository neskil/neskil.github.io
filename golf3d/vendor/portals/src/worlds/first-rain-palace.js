// PALACE OF THE FIRST RAIN: Udaipur on the afternoon the monsoon breaks, painted as a Mewar court miniature.
//
// The whole world is one unlit gouache page. The hero (src/parts/first-rain-palace.js) gives the island palace, the rain
// front, the cloud scroll, the lightning and the shader; this file builds the rest of the picture with the same tools
// (parts.gouache) in the hero's own frame, so every lamp, pennant, lotus pad and parasol answers the same front:
//   the ghat basin and triple gate, the page-shaped lake that curls up into the far shore, the far town, the cream city
//   palace on the ridge, saw-toothed hills, side shores, a garden island, a moored pleasure boat, lotus rafts, shelducks,
//   frogs, langurs, parasols, far boats, the lotus court and the lake pavilion that holds the portal, egret strings and
//   ghat pigeons, and our own vehicle: the royal barge (prow, deck, valance, oars), which follows the camera.
// World frame: Z east (up the page), y 0 the lake. Three.js handedness puts the palace on the camera's LEFT with the close pass
// on x = -94 and the portal's axis on x = -88 (the brief's x mirrored).
// Looks (ctx.vary.hour or seed): afternoon on yellow, golden hour on a red ground, dawn on rose with the lamps still lit,
// night on lamp-black with gold dot stars. Per seed: the front on time or late (it strikes during the balcony pass), Teej
// (a flotilla and garlands), the prow (peacock, elephant or makara), the birds (egrets, sarus cranes or pied cuckoos).
// The herd: nine indigo cloud elephants, 33 times life size, walk the sky behind the last row of hills, trunk to tail, for the whole flight,
// with vermilion caparisons and gold goads and ankle chains; the rain-sky's leading edge is the carpet under their feet.
// Rare: the middle one is the White Elephant, pearl and larger, with gold tusks and a gold howdah under a parasol.
// Timetable: the ground colour holds the sky above the herd; in the last moments before the hit a flat pearl rain-sky rolls shut overhead from
// the herd's feet, and the rain wall is only as tall as that edge (uTop), so no stroke falls from the bare ground colour; the first gold snake
// starts at an elephant's goad. Birds are drawn twice (the second pass is their umber hairline); two peacocks glide off the parapet during the
// close pass; the barge (two meshes: bow and canopy) slides in from behind the eye right after the crossing, is roofed and decked past it, and on
// a tall screen draws its bow back and lifts its canopy so both keep to the frame's edges.
// The lake is jade-teal in two flat tones. Across the open water the eye rises from 2.6 m to about 8 m and comes back down for the close pass
// (the hull and oars stay on the water; the canopy stays with the eye), over lotus beds, floating lamps, marigold rings, three bathing elephants,
// a second royal barge, a flower boat, a musicians' boat and two cast-net punts. The painted mirror (the hero's lake shader) lays lens strokes
// under the palace, gate, kiosks, island, pavilion and portal only; boats and elephants carry their own strokes. The ridge under the herd stands
// on an arc, so the skyline is level at every heading. On wide screens the bow rides sunk out of the picture; tall screens show it.
// Route (the world's own): the basin and gate stand at z 76 to 153, the lake crossing passes kiosks, the garden island (12 m to the right), the
// palace steps (12.5 m to the left) and three awninged boats, the close pass runs 14 m off the plinth, the last 100 m is straight on the portal.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, gouache as G } from '../parts/first-rain-palace.js';

const M = G.M, PI = Math.PI;
const LOOKS = {
  day: { title: 'Palace of the First Rain', pal: ['#F0A81E', '#1F2A5C', '#F6F1E3', '#4F5D6B', '#D8341F', '#2F8F5B', '#E9B949'], ground: '#F0A81E', cloud: '#1F2A5C', edge: '#F6F1E3', stars: 0, lampAll: 0, wash: '#ffffff', cool: [0.8, 0.86, 0.97], land: '#E3CD86', portal: '#F2C24E', lake: '#2F7B84', deep: '#286A7C' },
  golden: { title: 'Palace of the First Rain: Red Ground', pal: ['#F2B02A', '#1B2452', '#F8EEDC', '#45526A', '#E2481F', '#2F8F5B', '#F0C050'], ground: '#B5281A', cloud: '#1B2452', edge: '#E9B949', stars: 0, lampAll: 0.15, wash: '#fff6ea', cool: [0.86, 0.8, 0.9], land: '#E0B46A', portal: '#F6CC5A', lake: '#2B6F7C', deep: '#245F73' },
  dawn: { title: 'Palace of the First Rain: Rose Dawn', pal: ['#EFA62A', '#2A336B', '#F8EFE8', '#5C6982', '#D8341F', '#3A9468', '#E9B949'], ground: '#F2C6B8', cloud: '#2A336B', edge: '#F8EFE8', stars: 0, lampAll: 0.75, wash: '#fff8f4', cool: [0.82, 0.83, 0.98], land: '#E6CDA0', portal: '#F2C24E', lake: '#4F8F94', deep: '#437F8B' },
  night: { title: 'Palace of the First Rain: Lamp-Black', pal: ['#EFA51F', '#27357A', '#F4F1EA', '#33415E', '#DE3A20', '#2E8C5C', '#EDBE4E'], ground: '#0C122C', cloud: '#27357A', edge: '#C9D3EE', stars: 1, lampAll: 1, wash: '#BCC7E8', cool: [0.74, 0.8, 0.96], land: '#8C8F9C', portal: '#F2C24E', lake: '#2E7480', deep: '#286478' },
};

// the page: level lake round the path, curling up into a 14 degree ramp beyond z = 760 and 10 degrees to each side
const soft = (d, c) => (d <= 0 ? 0 : d < c ? (d * d) / (2 * c) : d - c / 2);
const pageY = (x, z) => 0.2493 * soft(z - 760, 80) + 0.1763 * soft(Math.abs(x + 44) - 250, 80) + 0.1763 * soft(-200 - z, 80);
const pageS = (x, z) => 1 + Math.max(z - 760, Math.abs(x + 44) - 250, -200 - z, 0) / 600;
const L3 = (x, y, z) => [z - 460, y, -x];            // world -> the hero's local frame

// birds: strings that ride between the barge and the front (uBirdX is the front's distance ahead), ghat pigeons that burst,
// and strings along the palace in the rain
const BIRD_VERT = /* glsl */`
attribute vec3 aP; attribute vec2 aW; attribute vec4 aA, aB;
uniform vec3 uCamL, uBody, uBill, uLeg, uWing, uPigeon, uCool, uWash, uUmber; uniform float uTime, uBirdX, uBurst, uPx, uLate, uGap, uOut, uBirdPx;
varying vec3 vCol;
void main() {
  float mode = aA.x, ph = aB.y, size = aB.z, flap = 0., fold = 0.; vec3 pos, f;
  if (mode < 0.5) {
    // far off, a string is drawn larger than life (never under uBirdPx pixels: 7 on a 1080-line picture, 3 on a 450-line one), so it is
    // also strung wider: the birds never merge into a line
    float low = step(aA.z, 45.), sf = max(1., abs(aA.y * uBirdX) * uPx * 3.4 * uBirdPx / uGap), z = mod(aA.w + aB.x * sf + aB.w * uTime + 1100., 2200.) - 1012., a = z * 0.006 + aA.y * 0.02;
    // a string keeps a share (aA.y) of the front's distance ahead of the barge and rides 15 to 19.5 degrees up, on the indigo, its
    // leading roll and the ground above it; the two low strings (endless, wrapped right round) cross 30 to 40 m up just ahead of the bow the whole way out
    float dx = aA.y * uBirdX + mix(40. * sin(a), 70. + 12. * sin(a), low);
    pos = vec3(uCamL.x + dx, max(aA.z, abs(dx) * (0.27 + 0.08 * fract(aA.z * 0.37)) * (1. - low)) + mix(6., 2.5, low) * sin(z * 0.011 + aA.y * 9.), z);
    f = normalize(vec3(0.24 * cos(a), 0., 1.)) * (aB.w < 0. ? -1. : 1.);
    flap = sin(uTime * 5.5 + ph + aB.x * 0.12);
  } else if (mode < 1.5) {
    float t = max(uBurst - fract(ph * 3.7) * 0.9, 0.), go = step(0.001, t);
    vec3 dir = vec3(cos(aB.x), 0., sin(aB.x));
    pos = aA.yzw + dir * (aB.w * t + 1.5 * sin(t * 0.7 + ph) * go) + vec3(0., (4.6 * t - 0.16 * t * t) * (0.55 + 0.45 * fract(ph * 7.3)) + 0.03 * sin(uTime * 3. + ph) * (1. - go), 0.);
    f = dir; flap = sin(uTime * 17. + ph * 9.) * go; fold = 1. - go;
  } else {
    float x = mod(aA.y + aB.x + aB.w * uTime + 260., 640.) - 260.;
    pos = vec3(x, aA.z + 3. * sin(x * 0.03 + ph), aA.w + 8. * sin(x * 0.017 + aA.z));
    f = vec3(1., 0., 0.); flap = sin(uTime * 6. + ph + aB.x * 0.1); size *= uLate;
  }
  vec3 side = vec3(-f.z, 0., f.x);
  float dist = length(pos - uCamL), sc = size * max(1., dist * uPx * uBirdPx / max(size, 0.2));
  // uOut 1 draws the same flock again a little larger, in umber, just behind and a pixel down: the hairline every form on the page has
  vec3 q = aP * (1. + 0.22 * uOut); float wa = flap * (0.35 + 0.75 * aW.x) * step(0.01, aW.x), az = abs(q.z) * mix(1., 0.2, fold);
  q.y = q.y * mix(1., 2.3, fold) + 0.13 * fold + az * sin(wa); q.z = sign(q.z) * az * cos(wa);
  vec3 p = pos + (f * q.x + vec3(0., 1., 0.) * q.y + side * q.z) * sc;
  vec3 c = aW.y < 0.5 ? uBody : aW.y < 1.5 ? uBill : aW.y < 2.5 ? uLeg : uWing;
  if (mode > 0.5 && mode < 1.5) c = aW.y < 0.5 ? uPigeon : aW.y < 1.5 ? uBill : aW.y < 2.5 ? uBill : uPigeon * 0.82;
  vCol = mix(c * mix(vec3(1.), uCool, step(flap, -0.1) * step(0.05, aW.x)) * uWash, uUmber, uOut);
  vec4 mv = modelViewMatrix * vec4(p, 1.); mv.xyz *= 1. + 0.004 * uOut; mv.xy += vec2(0.5, -0.9) * (uOut * uPx * -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const BIRD_FRAG = /* glsl */`varying vec3 vCol; void main() { gl_FragColor = vec4(vCol, 1.); }`;

function birdGeometry(inst) {
  const P = [], W = [], tri = (a, b, c, wa, wb, wc, t) => { P.push(...a, ...b, ...c); W.push(wa, t, wb, t, wc, t); };
  tri([0.35, 0, 0], [0, 0, 0.1], [-0.5, 0, 0], 0, 0, 0, 0); tri([0.35, 0, 0], [-0.5, 0, 0], [0, 0, -0.1], 0, 0, 0, 0);
  tri([0.33, 0, 0.035], [0.33, 0, -0.035], [0.72, 0.02, 0], 0, 0, 0, 1);
  tri([-0.48, 0, 0.025], [-0.48, 0, -0.025], [-0.92, -0.03, 0], 0, 0, 0, 2);
  // the same body drawn upright, so a bird seen from the side (a far string, a pigeon on a step) is not edge-on
  tri([0.35, 0.03, 0], [-0.5, 0, 0], [0, -0.13, 0], 0, 0, 0, 0); tri([0.35, 0.03, 0], [0, 0.12, 0], [-0.5, 0, 0], 0, 0, 0, 0);
  tri([0.33, 0.06, 0], [0.33, -0.02, 0], [0.72, 0.02, 0], 0, 0, 0, 1); tri([-0.46, 0.02, 0], [-0.46, -0.03, 0], [-0.92, -0.03, 0], 0, 0, 0, 2);
  for (const s of [-1, 1]) {
    tri([0.16, 0, 0.07 * s], [-0.2, 0, 0.07 * s], [-0.25, 0, 0.6 * s], 0.1, 0.1, 0.6, 0); tri([0.16, 0, 0.07 * s], [-0.25, 0, 0.6 * s], [0.13, 0, 0.6 * s], 0.1, 0.6, 0.6, 0);
    tri([0.13, 0, 0.6 * s], [-0.25, 0, 0.6 * s], [-0.1, 0, 1.1 * s], 0.6, 0.6, 1, 3);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(inst.A), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(inst.B), 4));
  g.instanceCount = inst.A.length / 4; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// small shared builders on the hero's accumulator -------------------------------------------------------------------
// flat disc-ish cone (parasol, boat awning): n-sided frustum without caps
const cone = (acc, n, r0, r1, y0, y1, col, mat = M.PLAIN) => acc.ngon(n, r0, r1, y0, y1, col, mat, { cap: false });
// a painted boat lying along local x: tapered hull, gold rail, optional parasol; built at the accumulator's origin
function boat(acc, col, len, hullCol, parasolCol) {
  const w = len * 0.24, h = len * 0.12;
  acc.box(0, -h * 0.3, 0, len * 0.62, h * 1.3, w, hullCol, M.PLAIN, { tx: 1.5, tz: 1.0, cap: col.brass });
  acc.box(0, h, 0, len * 0.93, h * 0.12, w * 1.04, col.gold, M.GOLD);
  for (const s of [-1, 1]) acc.quad([s * len * 0.46, h, -w * 0.5], [s * len * 0.46, h, w * 0.5], [s * len * 0.58, h * 1.55, 0], [s * len * 0.58, h * 1.55, 0], hullCol, M.PLAIN + 0.5);
  if (parasolCol) { acc.push(-len * 0.12, h, 0); acc.ngon(4, len * 0.012, len * 0.012, 0, len * 0.42, col.gold, M.GOLD, { cap: false }); cone(acc, 8, len * 0.3, len * 0.02, len * 0.42, len * 0.56, parasolCol); acc.pop(); }
  // the big boats are painted: a striped strake along each side over a gold beam, and a gold-ruled eye at each bow
  if (len >= 13) {
    const sc = hullCol === col.verm ? col.indigo : col.verm;
    for (const sz of [-1, 1]) {
      const z = sz * (w * 0.5 + 0.03), xa = -len * 0.36 * sz, xb = len * 0.36 * sz;
      acc.quad([xa, h * 0.5, z], [xb, h * 0.5, z], [xb, h * 0.95, z], [xa, h * 0.95, z], sc, M.STRIPE);
      G.beam(acc, [-len * 0.38, h * 0.43, z], [len * 0.38, h * 0.43, z], 0.04, col.gold, M.GOLD);
      for (const sx of [-1, 1]) {
        const ex = sx * len * 0.4, ey = h * 0.74, lw = 0.34, lh = 0.24, zz = z + sz * 0.02;
        acc.quad([ex, ey - lh, zz], [ex + lw * sz, ey, zz], [ex, ey + lh, zz], [ex - lw * sz, ey, zz], col.pearl, M.PLAIN + 0.5);
        acc.quad([ex, ey - lh * 0.45, zz + sz * 0.01], [ex + lw * 0.45 * sz, ey, zz + sz * 0.01], [ex, ey + lh * 0.45, zz + sz * 0.01], [ex - lw * 0.45 * sz, ey, zz + sz * 0.01], col.ink, M.PLAIN + 0.5);
        for (const [a, b] of [[[0, -lh], [lw, 0]], [[lw, 0], [0, lh]], [[0, lh], [-lw, 0]], [[-lw, 0], [0, -lh]]]) G.beam(acc, [ex + a[0], ey + a[1], zz], [ex + b[0], ey + b[1], zz], 0.028, col.gold, M.GOLD);
      }
    }
  }
}
// a painted figure about 1.75 m tall on the accumulator's origin, facing +z: a bell skirt or jama, a torso, arms, a head, and a turban or veil
// (hat), or a brass pot carried on the head with one arm raised to it (carry)
function figure(a, col, skirt, top, hat, carry) {
  a.ngon(6, 0.34, 0.15, 0, 0.92, skirt, M.PLAIN, { cap: false }); a.ngon(6, 0.16, 0.2, 0.92, 1.38, top, M.PLAIN, { cap: false });
  for (const sx of [-1, 1]) G.beam(a, [sx * 0.21, 1.34, 0], carry && sx > 0 ? [sx * 0.2, 1.82, 0.02] : [sx * 0.3, 0.92, 0.08], 0.045, top);
  a.push(0, 1.36, 0); a.lathe([[0.05, 0], [0.11, 0.06], [0.12, 0.16], [0.07, 0.25], [0.0, 0.27]], 6, col.skin, M.PLAIN); a.pop();
  if (carry) { a.push(0, 1.62, 0, 0, 0.62); G.pot(a, col, 1); a.pop(); } else { a.push(0, 1.56, 0); a.lathe([[0.12, 0], [0.17, 0.06], [0.13, 0.15], [0.0, 0.19]], 6, hat, M.PLAIN); a.pop(); }
}
// a parasol on a pole, built round the accumulator's origin (the cloth shader tilts and withdraws it about its foot)
function parasol(acc, col, s, c) {
  acc.ngon(4, 0.035 * s, 0.035 * s, 0, 2.3 * s, col.gold, M.GOLD, { cap: false }); cone(acc, 8, 1.25 * s, 0.06 * s, 2.3 * s, 2.85 * s, c);
  acc.quad([-1.25 * s, 2.1 * s, 0], [1.25 * s, 2.1 * s, 0], [1.25 * s, 2.3 * s, 0], [-1.25 * s, 2.3 * s, 0], col.gold, M.GOLD);
}
// stacked white cube house at page scale s, on the accumulator's origin
function house(acc, col, rng, s, tint) {
  const w = rng.range(7, 13) * s, d = rng.range(6, 9) * s, h = rng.range(5, 11) * s;
  acc.box(0, -2 * s, 0, w, h + 2 * s, d, tint, M.HOUSE, { cap: col.marbleB, capMat: M.PLAIN + 0.5 });
  if (rng.chance(0.55)) { const w2 = w * rng.range(0.4, 0.6), h2 = rng.range(3, 5) * s; acc.box(rng.range(-0.2, 0.2) * w, h, rng.range(-0.1, 0.1) * d, w2, h2, d * 0.6, rng.chance(0.3) ? col.rose : col.marble, M.HOUSE, { cap: col.marbleB, capMat: M.PLAIN + 0.5 }); }
  if (rng.chance(0.3)) acc.quad([-w * 0.3, h * 0.45, d / 2 + 0.3 * s], [w * 0.1, h * 0.45, d / 2 + 0.3 * s], [w * 0.1, h * 0.45 + 0.5 * s, d / 2 + 2.2 * s], [-w * 0.3, h * 0.45 + 0.5 * s, d / 2 + 2.2 * s], rng.chance(0.5) ? col.verm : col.saffron, M.STRIPE);
  return h;
}

export default {
  id: 'first-rain-palace',
  name: 'Palace of the First Rain',
  category: 'city',
  after: 'the Mewar court painters, 17th and 18th centuries',
  weirdness: 0.35,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('frp-variant'), detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const Y = async () => { await ctx.yield(); };
    // every variant is drawn in a fixed order, whatever the hour asked for
    const seedLook = vr.pick(['day', 'day', 'day', 'golden', 'golden', 'dawn', 'night', 'night']);
    const late = vr.chance(0.3), teej = vr.chance(0.33), prow = vr.pick(['peacock', 'peacock', 'peacock', 'elephant', 'makara']), cast = vr.pick(['egret', 'egret', 'egret', 'crane', 'cuckoo']);
    const hour = vary.hour || 'any', lookId = LOOKS[hour] ? hour : seedLook, look = LOOKS[lookId], rare = !!vary.rare, duration = 44;
    const uHit = late ? 0.63 : 0.45;
    // the front's run after the strike, metres a whole share of the flight: the timetable's own number, named so that what rides the
    // front can take one second of its travel (FRONT_RUN / duration) from the same two numbers
    const FRONT_RUN = 1320;

    const scene = new THREE.Scene(); scene.background = new THREE.Color(look.ground);
    // The route (world frame): out of the ghat basin through the gate at z 150, a slow curve to the right across the lake past the kiosks, the
    // garden island and the palace steps, the close pass 14 m off the plinth (x -94), then dead straight on the portal's axis (x -88)
    const path = makePath([[0, 2.6, 110], [0, 2.6, 150], [0, 2.6, 170], [-28, 6.5, 250], [-66, 8.2, 330], [-94, 3.3, 388], [-95, 2.6, 470], [-95, 2.6, 505], [-93.2, 2.6, 537], [-88.3, 2.6, 566], [-88, 2.6, 585], [-88, 2.6, 650]].map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const LEN = path.length, zHit = path.pointAt(uHit).z, tmp = new THREE.Vector3();
    const pathX = (z) => { let lo = 0, hi = 1; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, tmp).z < z) lo = m; else hi = m; } return path.pointAt(lo, tmp).x; };
    const uAtZ = (z) => { let lo = 0, hi = 1; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, tmp).z < z) lo = m; else hi = m; } return lo; };
    // THE HERD: nine indigo cloud elephants walk the sky behind the last row of hills (hero-local x HX), trunk to tail, for the whole flight.
    // Their feet are held at a fixed angle above the horizon ahead (just in the indigo carpet at the rain-sky's leading edge, a little higher
    // once the rain is over us, so they show over the kiosks and the court walls); the walk is driven by u, 700 m over the flight.
    const HX = 2060, ES = 33, EGAP = 690, HZ0 = -500, D2R = PI / 180;
    const herdZ = (u) => HZ0 + 700 * u, herdY = (u) => 2.6 + Math.tan(lerp(14.6, 15.3, smoothstep(0.5, 0.62, u)) * D2R) * (HX - (path.pointAt(u, tmp).z - 460));
    const eScale = (e) => ES * (rare && e === 4 ? 1.18 : e % 3 === 1 ? 1.1 : 1);
    // the first gold snake starts at a goad: the elephant whose goad stands nearest 20 degrees right of the bow (5 on a late front) as it draws
    const uBolt = uHit - 0.045, boltE = (() => { const zt = (late ? 0.09 : 0.36) * (HX - (path.pointAt(uBolt, tmp).z - 460)) - tmp.x; let b = 0, bd = 1e9; for (let e = 0; e < 9; e++) { const d = Math.abs(herdZ(uBolt) + (e - 4) * EGAP + 7 * eScale(e) - zt); if (d < bd) { bd = d; b = e; } } return b; })();
    const hero = await buildHero(ctx, { palette: look.pal, water: false, skyGround: look.ground, cloud: look.cloud, cloudEdge: look.edge, stars: look.stars, lampAll: look.lampAll, wash: look.wash, cool: look.cool,
      // on a late front the first snake strikes during the balcony pass, when the gaze is on the palace: it stands nearer our line and lower
      bolt0X: HX - 70, bolt0Z: herdZ(uBolt) + (boltE - 4) * EGAP + 7 * eScale(boltE), bolt0Y: herdY(uBolt) + 13.6 * eScale(boltE), bolt0Jit: 4.5, bolt0Wide: 0.6, bolt0End: herdY(uBolt) - 40, bolt0Dz: 0.75 * EGAP,
      kioskZ: 108, rainSky: lookId === 'night' ? 0.5 : 1 });
    await Y();
    const page = hero.object, U = hero.uniforms, pl = hero.anchors.placement;
    // the lake is jade-teal in two flat tones (only the water changes: slate stays slate everywhere else)
    U.uLake.value.set(...G.lin(look.lake)); U.uLakeHi.value.set(...G.lin(look.deep));
    page.position.set(pl.position[0], pl.position[1], pl.position[2]); page.rotation.y = pl.rotationY; page.updateMatrixWorld(true); scene.add(page);

    const c0 = hero.colors, lin = G.lin, mixc = G.mixc, mulc = G.mulc;
    const col = { ...c0, rose: mixc(c0.verm, c0.marble, 0.78), cream: lin('#F1E2B4'), creamB: lin('#E2CD96'), land: lin(look.land), sky: mixc(c0.indigo, c0.marble, 0.72), pink: mixc(c0.verm, c0.marble, 0.5), dark: mixc(c0.umber, c0.indigo, 0.4), wood: lin('#8A5A2B'), skin: lin('#B8763E') };
    const tints = [col.marble, col.marble, col.marbleB, col.rose, col.sky, col.cream, col.marble];
    const clothCols = [col.verm, col.saffron, col.mala, col.verm, col.indigo, col.saffron];
    // accumulators: near static, far static (the page beyond the level lake), world cloth; all three take WORLD coordinates
    const acc = G.makeAcc(false), far = G.makeAcc(false), cl = G.makeAcc(true);
    for (const a of [acc, far, cl]) a.push(-460, 0, 0, PI / 2);
    const poles = [], birds = [];                  // pennant poles and peacock seats are kept in the hero's local frame
    const r1 = rng.fork('frp-near'), r2 = rng.fork('frp-far'), r3 = rng.fork('frp-life'), r4 = rng.fork('frp-more'), r5 = rng.fork('frp-folk');

    // ---------- the page: lake grid (own mesh) and painted land ----------
    const landY = (x, z) => { const zz = Math.min(z, 2080); return pageY(x, zz) + 0.5 * soft(zz - 2000, 30); };
    {
      const xs = [-1900, -1500, -1150, -900, -700, -560, -460, -400, -374, -354, -334, -314, -294, -200, -100, 0, 100, 206, 226, 246, 266, 286, 312, 372, 472, 612, 812, 1062, 1412, 1812];
      const zs = [-900, -600, -420, -300, -280, -260, -240, -220, -200, -100, 0, 150, 300, 450, 600, 760, 780, 800, 820, 840, 870, 950, 1100, 1300, 1500, 1700, 1900, 2000, 2040, 2080, 2250, 2600];
      const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), idx = [];
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3; pos[k] = zs[j] - 460; pos[k + 1] = pageY(xs[i], zs[j]); pos[k + 2] = -xs[i]; }
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1], isLand = z0 >= 1900 || x0 >= 812 || x1 <= -900 || z1 <= -420;
        if (!isLand) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); continue; }
        const lc = mixc(col.land, (i + j) % 3 === 0 ? col.mala : (i + j) % 3 === 1 ? col.rose : col.saffron, 0.1 + 0.08 * r2());
        far.quad([x0, landY(x0, z0), z0], [x0, landY(x0, z1), z1], [x1, landY(x1, z1), z1], [x1, landY(x1, z0), z0], lc, M.HILL + 0.5);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere();
      const lake = new THREE.Mesh(g, hero.makeMaterial(G.LAKE_VERT, G.LAKE_FRAG, { side: THREE.DoubleSide })); lake.position.y = 0.04; lake.frustumCulled = false; page.add(lake);
    }
    await Y();

    // ---------- far shore: ghats, the stacked town, trees, bathing elephants ----------
    {
      const s = 4.2;
      for (let i = 0; i < 4; i++) far.box(0, 262 + i * 4.5, 1886 + i * 7, 1500, 4.5, 7, i % 2 ? col.marbleB : col.marble, M.PLAIN, { cap: col.marble });
      const tiers = [[1925, 16], [1958, 14], [1992, 12]];
      for (let t = 0; t < tiers.length; t++) {
        const [z, n] = tiers[t];
        for (let i = 0; i < n; i++) {
          const x = -780 + (1560 * (i + r2.range(0.1, 0.9))) / n, zz = z + r2.range(-8, 8), sc = s * r2.range(0.85, 1.2);
          if (r2.chance(0.2)) { far.push(x, landY(x, zz), zz, r2.range(0, 6), sc * r2.range(3.2, 4.6)); G.tree(far, col, 1, r2.chance(0.3)); far.pop(); continue; }
          far.push(x, landY(x, zz), zz, r2.range(-0.12, 0.12)); const h = house(far, col, r2, sc, r2.pick(tints));
          if (r2.chance(0.22)) { far.push(0, h, 0, 0, 1); G.chhatri(far, col, sc * 0.9, 4, false); far.pop(); }
          far.pop();
        }
        await Y();
      }
      // two elephants bathing at the ghats: specks that rock and spray (the page makes them 14 m tall)
      for (const ex of [-190 + r2.range(-30, 30), 250 + r2.range(-30, 30)]) {
        cl.push(ex, 262, 1880, r2.range(-0.4, 0.4)); cl.anim(9, 0, 3, 0, r2.range(0, 6.28));
        cl.box(0, 0, 0, 20, 12, 9, col.slate, M.PLAIN, { tx: 0.85, tz: 0.8 }); cl.box(12, 5, 0, 7, 8, 7, col.slate, M.PLAIN, { tx: 0.8 });
        cl.quad([15, 12.5, 0], [15.8, 12.5, 0], [19, 19, 0], [18.2, 19, 0], col.slate, M.PLAIN + 0.5);
        cl.quad([18, 19, -0.3], [18.6, 19, -0.3], [18.6, 25, -0.3], [18, 25, -0.3], col.pearl, M.DASH + 0.5);
        cl.pop();
      }
    }
    await Y();

    // ---------- the cream city palace on the ridge: stepped blocks, a hundred balconies, nine domes ----------
    {
      const zf = 2052, y0 = landY(0, 2080) - 6, CP = [[-372, 104, 92], [-262, 96, 126], [-160, 104, 150], [-50, 116, 170], [62, 100, 142], [160, 104, 158], [264, 100, 122], [368, 104, 94]];
      const SMALL = [[0.9, 0], [1.0, 0.3], [0.8, 0.7], [0.4, 1.0], [0.0, 1.15]];
      far.box(0, y0 - 46, zf - 14, 900, 46, 20, col.creamB, M.HOUSE, { cap: col.cream, capMat: M.PLAIN + 0.5 });
      for (let b = 0; b < CP.length; b++) {
        const [xc, w, h] = CP[b], x0 = xc - w / 2, x1 = xc + w / 2, ns = Math.round(h / 26), sh = h / ns, d = 70;
        for (let k = 0; k < ns; k++) far.quad([x1, y0 + k * sh, zf], [x0, y0 + k * sh, zf], [x0, y0 + (k + 1) * sh, zf], [x1, y0 + (k + 1) * sh, zf], k % 2 ? col.cream : mixc(col.cream, col.marble, 0.35), M.HOUSE);
        far.quad([x0, y0, zf], [x0, y0, zf + d], [x0, y0 + h, zf + d], [x0, y0 + h, zf], col.creamB, M.PLAIN); far.quad([x1, y0, zf + d], [x1, y0, zf], [x1, y0 + h, zf], [x1, y0 + h, zf + d], col.creamB, M.PLAIN);
        far.quad([x0, y0 + h, zf], [x0, y0 + h, zf + d], [x1, y0 + h, zf + d], [x1, y0 + h, zf], col.cream, M.PLAIN + 0.5);
        far.box(xc, y0 + h, zf + 1, w + 6, 5, 8, col.creamB, M.PLAIN, { cap: col.cream });
        const nb = Math.max(2, Math.round(w / 17));
        for (let i = 0; i < nb; i++) for (const fy of [0.34, 0.68]) {
          if (r2.chance(0.12)) continue;
          const x = x0 + ((i + 0.5) / nb) * w, y = y0 + h * (fy + r2.range(-0.03, 0.03));
          far.box(x, y, zf - 4, 11, 11, 8, col.marble, M.HOUSE, { cap: col.creamB }); far.push(x, y + 11, zf - 4, 0, 5.2); far.lathe(SMALL, 6, col.marble, M.DOME); far.pop();
          if (r2.chance(0.4)) far.quad([x - 5, y + 3, zf - 8.4], [x + 5, y + 3, zf - 8.4], [x + 5, y + 6.5, zf - 8.4], [x - 5, y + 6.5, zf - 8.4], r2.pick([col.verm, col.saffron]), M.STRIPE);
        }
        // a dome on a drum, chhatris at the corners, a gold finial
        const dr = b === 3 ? 30 : r2.range(15, 22);
        far.push(xc, y0 + h + 5, zf + 26); far.ngon(8, dr * 0.95, dr * 0.92, 0, dr * 0.5, col.cream, M.PLAIN, { cap: false });
        far.push(0, dr * 0.5, 0, 0, dr); far.lathe(G.DOME_PROF, 12, col.marble, M.DOME); far.pop(); far.push(0, dr * 1.62, 0); G.finial(far, col, dr * 0.42); far.pop(); far.pop();
        for (const sx of [-1, 1]) if (r2.chance(0.7)) { far.push(xc + sx * (w / 2 - 9), y0 + h + 5, zf + 6); G.chhatri(far, col, r2.range(5.5, 7.5), 4, false); far.pop(); }
        if (b % 2 === 0) { const px = xc + r2.range(-20, 20), py = y0 + h + 5; G.beam(far, [px, py, zf + 4], [px, py + 44, zf + 4], 0.9, col.gold, M.GOLD); poles.push([L3(px, py + 40, zf + 4), 30, 9]); }
        await Y();
      }
      // the crenellated wall walking the ridge, with towers
      const wy = (x) => landY(x, 2190) + 18 + 60 * Math.abs(Math.sin(x * 0.0037 + 1.3)) + 28 * Math.abs(Math.sin(x * 0.011));
      for (let x = -1740; x < 1740; x += 120) {
        if (x > -520 && x < 480) continue;
        const ya = wy(x), yb = wy(x + 120);
        far.quad([x + 120, yb - 40, 2190], [x, ya - 40, 2190], [x, ya, 2190], [x + 120, yb, 2190], col.creamB, M.PLAIN);
        for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5; far.box(x + 120 * t, lerp(ya, yb, t) - 1, 2190, 13, 9, 6, col.cream, M.PLAIN + 0.5); }
        if (((x + 1740) / 120) % 2 === 0) far.box(x, ya - 44, 2192, 30, 62, 30, col.cream, M.HOUSE, { cap: col.creamB });
      }
      await Y();
      // saw-toothed hills in three rows
      const hillCols = [mulc(col.mala, 0.92), mixc(col.mala, col.saffron, 0.45), mixc(col.indigo, col.marble, 0.55), mixc(col.verm, col.marble, 0.62), mixc(col.slate, col.saffron, 0.45), mixc(col.mala, col.marble, 0.4)];
      for (let row = 0; row < 3; row++) {
        const z = 2215 + row * 120, base = landY(0, 2200) - 30;
        for (let x = -2000 + row * 70; x < 2000;) {
          const w = r2.range(230, 380), hgt = r2.range(150, 235) + row * 30, ax = x + w * r2.range(0.3, 0.7);
          far.quad([x - 40, base, z], [x + w + 40, base, z], [ax, base + hgt, z], [ax, base + hgt, z], hillCols[(r2.int(0, 5) + row) % 6], M.HILL + 0.5);
          x += w * r2.range(0.5, 0.75);
        }
      }
      // side shores: towns climbing the side ramps, trees, and hills behind
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 58; i++) {
          if (i % 10 === 9) await Y();
          const z = -150 + i * 33 + r2.range(-20, 20), x = -44 + sd * (i % 2 ? r2.range(870, 1010) : r2.range(1040, 1260)), sc = pageS(x, z) * r2.range(0.9, 1.2);
          far.push(x, landY(x, z), z, -sd * PI / 2 + r2.range(-0.2, 0.2));
          if (r2.chance(0.28)) G.tree(far, col, sc * r2.range(3, 4.4), r2.chance(0.3)); else house(far, col, r2, sc, r2.pick(tints));
          far.pop();
        }
        for (let z = -500; z < 2000;) {
          const w = r2.range(240, 420), hgt = r2.range(150, 260), x = -44 + sd * 1420, az = z + w * r2.range(0.3, 0.7), b = landY(x, 600) - 40;
          far.quad([x, b, z - 40], [x, b, z + w + 40], [x, b + hgt, az], [x, b + hgt, az], hillCols[r2.int(0, 5)], M.HILL + 0.5);
          z += w * r2.range(0.5, 0.75);
        }
        await Y();
      }
      // boats on the risen lake and the level water, a parasol each (forty at Teej)
      const nb = teej ? 40 : 20;
      for (let i = 0; i < nb + 7; i++) {
        if (i % 6 === 5) await Y();
        const near = i >= nb, row = near && i - nb < 3; let z = near ? (i % 2 ? r3.range(230, 390) : r3.range(570, 720)) : r3.range(880, 1760), x = near ? (i % 3 === 0 ? r3.range(190, 240) : r3.range(-420, -180)) : r3.range(-620, 620);
        // three of the near boats keep us company on the open lake: 13 m long under striped awnings, 11 m either side of our line, rowing along it (cloth kind 15)
        if (row) { z = [230, 308, 370][i - nb]; x = pathX(z) + [11.5, -11.5, -11.5][i - nb]; }
        const sc = pageS(x, z), ry = r3.range(-0.25, 0.25);
        cl.push(x, pageY(x, z) + 0.2 * sc, z, row ? PI / 2 - 0.42 + ry * 0.2 : ry); cl.anim(row ? 15 : 13, 0, 0, 0, r3.range(0, 6.28));
        const bl = 7.5 * sc * r3.range(0.8, 1.2), hc = r3.pick([col.verm, col.saffron, col.indigo, col.wood, col.marble]), pc = r3.pick([col.verm, col.saffron, col.marble, col.mala]);
        if (!row) boat(cl, col, bl, hc, pc);
        else {
          boat(cl, col, 13, hc, null);
          for (const sx of [-2.6, 2.6]) for (const sz of [-1.15, 1.15]) G.beam(cl, [sx, 1.5, sz], [sx, 4.3, sz], 0.05, col.gold, M.GOLD);
          cl.quad([-3.1, 4.3, 1.5], [3.1, 4.3, 1.5], [3.1, 4.3, -1.5], [-3.1, 4.3, -1.5], pc, M.STRIPE + 0.5);
          for (const sz of [-1.5, 1.5]) cl.quad([-3.1, 3.85, sz], [3.1, 3.85, sz], [3.1, 4.3, sz], [-3.1, 4.3, sz], col.gold, M.GOLD);
          cl.box(0, 1.6, 0, 3.6, 0.45, 1.9, pc === col.verm ? col.saffron : col.verm, M.STRIPE, { cap: col.indigo });
          cl.push(4.4, 1.55, 0); parasol(cl, col, 0.9, pc === col.mala ? col.verm : col.mala); cl.pop();
          for (const [fx, fy, sc] of [[-0.9, 2.05, 1.1], [0.8, 2.05, 1.1], [-5.1, 1.56, 1.4]]) { cl.push(fx, fy, 0.1, PI / 2, sc); figure(cl, col, r5.pick(clothCols), r5.pick([col.marble, col.saffron, col.marble]), r5.pick([col.verm, col.saffron, col.mala]), false); cl.pop(); }
          G.beam(cl, [-5.0, 3.6, 0.5], [-6.9, -0.5, 1.7], 0.05, col.wood);
          // the water it parts: pearl comma strokes off both quarters
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 2; k++) { const x0 = sx * (6.2 + k * 1.5), z0 = sz * (1.2 + k * 0.9); cl.quad([x0, -0.12, z0], [x0 + sx * 1.5, -0.12, z0 + sz * 0.9], [x0 + sx * 1.6, -0.12, z0 + sz * 1.15], [x0, -0.12, z0 + sz * 0.3], col.pearl, M.PLAIN + 0.5); }
        }
        cl.pop();
      }
    }
    await Y();

    // ---------- the ghat basin: washing steps, terraces, house fronts, pots, saris, a banyan ----------
    const inFrame = (x, y, z, ry, fn) => { acc.push(x, y, z, ry); cl.push(x, y, z, ry); fn(); acc.pop(); cl.pop(); };
    const sariOn = (x, y, z, w, len, c, ph) => { cl.anim(5, x, y, z, ph); for (let j = 0; j < 2; j++) cl.quad([x - w / 2, y - (len / 2) * (j + 1), z], [x + w / 2, y - (len / 2) * (j + 1), z], [x + w / 2, y - (len / 2) * j, z], [x - w / 2, y - (len / 2) * j, z], c, M.STRIPE, { wt: [(j + 1) / 2, (j + 1) / 2, j / 2, j / 2] }); };
    const garland = (xa, xb, y, z, sag, ph) => { const n = 7; cl.anim(4, (xa + xb) / 2, y, z, ph);
      for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, s0 = Math.sin(t0 * PI), s1 = Math.sin(t1 * PI), xA = lerp(xa, xb, t0), xB = lerp(xa, xb, t1), yA = y - sag * s0, yB = y - sag * s1;
        cl.quad([xA, yA - 0.16, z], [xB, yB - 0.16, z], [xB, yB + 0.16, z], [xA, yA + 0.16, z], col.saffron, M.BEAD + 0.5, { wt: [s0, s1, s1, s0] }); } };
    acc.push(0, 0, 110); cl.push(0, 0, 110);      // the basin and its gate stand 110 m up the page: the open water is that much shorter
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 8; i++) acc.box(sd * (14.375 + 0.75 * i), -0.5, 2, 0.75, 0.7 + 0.4 * i, 72, i % 2 ? col.marbleB : col.marble, M.PLAIN, { cap: col.marble });
      acc.box(sd * 26.5, -0.5, 2, 13, 3.9, 72, col.marbleB, M.PLAIN, { cap: col.marble, capMat: M.TILE + 0.5 });
      // three house fronts behind the terrace
      for (let hI = 0; hI < 3; hI++) {
        const zc = -22 + hI * 24, H = [13, 17.5, 14.5][(hI + (sd > 0 ? 1 : 0)) % 3] + r1.range(-1, 1), tint = r1.pick([col.marble, col.marble, col.rose, col.cream, col.sky]);
        inFrame(sd * 33, 0, zc, -sd * PI / 2, () => {
          acc.quad([-12, 3.4, 0], [12, 3.4, 0], [12, H, 0], [-12, H, 0], tint, M.WALL + 0.5);
          acc.quad([-12, H, 0.05], [12, H, 0.05], [12, H + 1.6, 0.05], [-12, H + 1.6, 0.05], tint, M.KANG + 0.5);
          acc.box(0, 10.6, 0.15, 24, 0.3, 0.3, col.marbleB);
          for (const jx of [-6.5, 5.5]) { acc.push(jx + r1.range(-1, 1), 7.4, 0); G.jharokha(acc, col, r1.range(3.8, 4.6), r1.range(2.4, 2.9), r1); acc.pop(); }
          const dx = r1.range(-2, 2), door = r1.chance(0.5) ? col.verm : col.ink;
          acc.quad([dx - 1.4, 3.4, 0.04], [dx + 1.4, 3.4, 0.04], [dx + 1.4, 6.6, 0.04], [dx - 1.4, 6.6, 0.04], door, door === col.verm ? M.STRIPE : M.PLAIN);
          acc.push(dx, 3.4, 0.14); acc.archPlate(2.8, 2.1, 0.8, 3.5, col.marble, { segs: 10 }); acc.pop();
          G.awning(acc, cl, col, dx, 7.1, 0.1, 4.6, 3.0, 1.4, r1.pick([col.saffron, col.verm, col.mala]), r1.range(0, 6.28));
          if (r1.chance(0.7)) sariOn(-6.5 + r1.range(-1, 1), 8.5, 2.95, r1.range(1, 1.5), 1.9, r1.pick(clothCols), r1.range(0, 6.28));
          if (r1.chance(0.6)) { acc.push(r1.range(-7, 7), H, -2.5); G.chhatri(acc, col, r1.range(1.3, 1.7), 4, true); acc.pop(); }
          // washing line of saris between two poles on the terrace, pots by the door
          const lx = r1.range(-9, 4), ly = 6.3; G.beam(acc, [lx, 3.4, 4.6], [lx, ly, 4.6], 0.05, col.wood); G.beam(acc, [lx + 6, 3.4, 4.6], [lx + 6, ly, 4.6], 0.05, col.wood); G.beam(acc, [lx, ly, 4.6], [lx + 6, ly, 4.6], 0.025, col.dark);
          for (let k = 0; k < 4; k++) sariOn(lx + 0.8 + k * 1.45, ly, 4.6, 1.2, r1.range(1.6, 2.4), clothCols[(k + hI) % 6], r1.range(0, 6.28));
          for (let k = 0; k < 3; k++) { acc.push(dx + r1.range(-4, 4), 3.4, r1.range(0.6, 2), 0, r1.range(0.8, 1.3)); G.pot(acc, col, 1); acc.pop(); }
        });
        await Y();
      }
      // on the steps: brass pots, saris laid out to dry, mooring posts
      for (let k = 0; k < 9; k++) { const i = r1.int(1, 7), z = r1.range(-12, 34); acc.push(sd * (14.375 + 0.75 * i), 0.2 + 0.4 * i, z, 0, r1.range(0.7, 1.15)); G.pot(acc, col, 1); acc.pop(); }
      for (let k = 0; k < 5; k++) { const z = -8 + k * 9 + r1.range(-2, 2), x0 = sd * r1.range(20.6, 23), w = r1.range(3.6, 5.2), dz = r1.range(1.1, 1.5); acc.quad([x0, 3.43, z], [x0, 3.43, z + dz], [x0 + sd * w, 3.43, z + dz], [x0 + sd * w, 3.43, z], clothCols[(k + (sd > 0 ? 2 : 0)) % 6], M.STRIPE); }
      for (const z of [-6, 14, 31]) { acc.push(sd * 12.6, -0.5, z); acc.ngon(6, 0.17, 0.14, 0, 3.6, col.verm, M.PLAIN, { cap: false }); acc.push(0, 3.6, 0); G.finial(acc, col, 0.5); acc.pop(); acc.pop(); }
      // pigeons on the steps and the terrace edge
      for (let k = 0; k < Math.round(30 * Math.max(detail, 0.8)); k++) {
        const i = r3.int(0, 8), z = r3.range(7, 37), p = L3(sd * (14.375 + 0.75 * Math.min(i, 7) + (i > 7 ? r3.range(1, 3) : 0)), (i > 7 ? 3.4 : 0.2 + 0.4 * i) + 0.12, z + 110);
        birds.push([1, p[0], p[1], p[2]], [r3.range(-0.45, 0.45) - sd * 0.2, r3.range(0, 6.28), r3.range(0.6, 0.8), r3.range(12, 17)]);
      }
      // people on the ghat: women with pots on the washing steps, men on the terrace; they sway, and dance when the rain reaches them
      for (let k = 0; k < 5; k++) {
        const i = r5.int(0, 6), z = r5.range(-4, 34), onT = k > 2;
        cl.push(sd * (onT ? r5.range(21.5, 25) : 14.375 + 0.75 * i), onT ? 3.4 : 0.2 + 0.4 * i, z, -sd * PI / 2 + r5.range(-0.6, 0.6), r5.range(1.35, 1.6)); cl.anim(9, 0, 0, 0, r5.range(0, 6.28));
        figure(cl, col, r5.pick(clothCols), onT ? col.marble : r5.pick(clothCols), r5.pick([col.verm, col.saffron, col.mala]), !onT && k % 2 === 0); cl.pop();
      }
    }
    // the banyan over the left ghat, with hanging roots; a small boat tied at the right steps
    acc.push(28.5, 3.4, 24, r1.range(0, 6), 6.4); G.tree(acc, col, 1, false); acc.pop();
    for (let k = 0; k < 12; k++) { const a = r1.range(0, 6.28), r = r1.range(2, 5.6), x = 28.5 + Math.cos(a) * r, z = 24 + Math.sin(a) * r, y1 = 3.4 + 8.2, y0 = 3.6 + r1.range(0, 3.5); cl.anim(5, x, y1, z, r1.range(0, 6.28)); cl.quad([x - 0.05, y0, z], [x + 0.05, y0, z], [x + 0.05, y1, z], [x - 0.05, y1, z], col.umber, M.PLAIN + 0.5, { wt: [1, 1, 0, 0] }); }
    inFrame(-11.6, 0.3, 21, PI / 2, () => { boat(acc, col, 6.5, col.saffron, null); });
    await Y();

    // ---------- the triple-arched gate across the basin mouth (z 38..43): we row through the centre arch ----------
    for (const [x, w] of [[-20.75, 4.5], [-8.5, 4], [8.5, 4], [20.75, 4.5]]) acc.box(x, -0.5, 40.5, w, 20.5, 5, col.marble, M.WALL);
    inFrame(0, 0, 38, PI, () => {
      acc.archPlate(13, 7, 4.1, 20, col.marble, { segs: 22, depth: 5 });
      acc.push(0, 0, -0.04); acc.archPlate(12.3, 7, 3.7, 13, col.verm, { segs: 22 }); acc.pop();
      for (const sx of [-14.5, 14.5]) { acc.push(sx, 0, -0.04); acc.archPlate(7.5, 5, 2.25, 9, col.saffron, { segs: 14 }); acc.pop(); }
      for (const sx of [-14.5, 14.5]) { acc.push(sx, 0, 0); acc.archPlate(8, 5, 2.5, 20, col.marble, { segs: 14, depth: 5 }); acc.pop(); acc.push(sx, 9.8, 0.06); G.jharokha(acc, col, 4.4, 2.6, r1); acc.pop(); }
      acc.quad([-23, 17.3, 0.06], [23, 17.3, 0.06], [23, 18.5, 0.06], [-23, 18.5, 0.06], col.verm, M.STRIPE);
      acc.box(0, 18.7, 0.3, 47, 0.4, 0.6, col.marbleB); acc.box(0, 12.9, 0.2, 14.6, 0.3, 0.4, col.marbleB);
      for (const jx of [-4.2, 0, 4.2]) acc.quad([jx - 1.2, 13.7, 0.06], [jx + 1.2, 13.7, 0.06], [jx + 1.2, 16.4, 0.06], [jx - 1.2, 16.4, 0.06], col.marble, M.JALI);
      for (const jx of [-2.1, 2.1]) acc.quad([jx - 0.35, 14.2, 0.07], [jx + 0.35, 14.2, 0.07], [jx + 0.35, 15.9, 0.07], [jx - 0.35, 15.9, 0.07], col.gold, M.GOLD);
      acc.quad([-23, 20.6, 0.05], [23, 20.6, 0.05], [23, 22.3, 0.05], [-23, 22.3, 0.05], col.marble, M.KANG + 0.5);
      garland(-6.2, 6.2, 12.7, 0.5, 1.5, r1.range(0, 6.28));
      if (teej) for (const sx of [-14.5, 14.5]) garland(sx - 3.8, sx + 3.8, 8.6, 0.5, 1.1, r1.range(0, 6.28));
      for (const sx of [-8.5, 8.5]) G.awning(acc, cl, col, sx, 9.2, 0.1, 3.6, 2.2, 1.0, sx > 0 ? col.saffron : col.verm, r1.range(0, 6.28));
    });
    acc.box(0, 20, 40.5, 47, 0.6, 6, col.marbleB, M.PLAIN, { cap: col.marble });
    acc.push(0, 20.6, 40.5); G.chhatri(acc, col, 2.4, 8, true); acc.pop();
    for (const sx of [-1, 1]) {
      acc.push(sx * 20, 20.6, 40.5); G.chhatri(acc, col, 1.7, 4, true); acc.pop();
      G.beam(acc, [sx * 10.5, 20.6, 40.5], [sx * 10.5, 28, 40.5], 0.07, col.gold, M.GOLD); poles.push([L3(sx * 10.5, 27.4, 150.5), 6, 1.6]);
      G.peacock(acc, cl, col, [sx * 15, 22.3, 38.4], 1.7, r1.range(0, 6.28));
    }
    acc.pop(); cl.pop();
    await Y();

    // ---------- on the open lake: kiosks in the water, a garden island close on the right, the palace steps on the left, boats, lotus beds ----------
    // everything solid keeps 6 m clear of our line; `blocked` keeps the lotus rafts out of the masonry
    const blockers = [], blocked = (x, z) => { for (const b of blockers) if ((x - b[0]) * (x - b[0]) + (z - b[1]) * (z - b[1]) < b[2] * b[2]) return true; return false; };
    // lanes: boats under way (z, metres off our line, half width, half length); the last three are the flower boat, the second royal barge and the musicians
    const lanes = [[230, 11.5, 2.8, 6.5], [308, -11.5, 2.8, 6.5], [370, -11.5, 2.8, 6.5], [205, 21, 2.4, 5], [258, 27, 4.6, 11.5], [326, -22, 2.8, 6]];
    const free = (x, z) => !blocked(x, z) && !lanes.some(([zb, off, hw, hl]) => Math.abs(z - zb) < 17.5 + hl && Math.abs(x - pathX(z) - off) < hw);
    // the cast-net punts and the bathing elephants stand still: the lotus keeps clear of them
    const PUNTS = [[288, -20], [344, 20]], BATH = [];
    for (const [pz, off] of PUNTS) blockers.push([pathX(pz) + off, pz, 5.5]);
    let ix = pathX(215) - 44; while (path.nearestXZ(ix, 215).dist < 43.5) ix -= 1.5;
    blockers.push([ix, 215, 34]);
    BATH.push([ix + 35.5, 205, 1.05, 1.2], [pathX(366) + 15, 366, -1.0, 1.25]);
    for (const b of BATH) blockers.push([b[0], b[1], 5]);
    inFrame(ix, 0, 215, 0, () => {
      acc.ngon(10, 30, 28.5, -0.5, 2.2, col.marble, M.PLAIN, { capCol: mulc(col.mala, 0.92) }); acc.ngon(10, 31.5, 31.5, -0.5, 0.5, col.marbleB, M.PLAIN, { cap: false });
      acc.push(0, 2.2, 0); acc.ngon(8, 7, 6.6, 0, 1.2, col.marble); acc.push(0, 1.2, 0); G.chhatri(acc, col, 3.6, 8, true); acc.pop(); acc.pop();
      for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.283 + r1.range(-0.2, 0.2), r = r1.range(15, 23); acc.push(Math.cos(a) * r, 2.2, Math.sin(a) * r, r1.range(0, 6), r1.range(2.6, 4.2)); G.tree(acc, col, 1, k % 3 === 0); acc.pop(); }
      // landing steps toward our line with a striped runner, pots, two peacocks, a low pierced rail and marigold swags on posts
      for (let i = 0; i < 3; i++) acc.box(31 + i * 0.7, -0.5, 0, 0.7, 2.4 - i * 0.7, 12, i % 2 ? col.marbleB : col.marble);
      for (let i = 0; i < 3; i++) acc.quad([30.65 + i * 0.7, 1.92 - i * 0.7, 1.6], [31.35 + i * 0.7, 1.92 - i * 0.7, 1.6], [31.35 + i * 0.7, 1.92 - i * 0.7, -1.6], [30.65 + i * 0.7, 1.92 - i * 0.7, -1.6], col.verm, M.STRIPE);
      for (const pz of [-4.6, 3.9, 5.2]) { acc.push(30.2, 2.2, pz, 0, 1.2); G.pot(acc, col, 1); acc.pop(); }
      for (const sz of [-1, 1]) {
        G.peacock(acc, cl, col, [27.2, 2.2, sz * 9.5], 1.9, r4.range(0, 6.28));
        acc.push(29.4, 2.2, sz * 6.6); acc.ngon(6, 0.2, 0.16, 0, 4.2, sz > 0 ? col.verm : col.saffron, M.PLAIN, { cap: false }); acc.push(0, 4.2, 0); G.finial(acc, col, 0.7); acc.pop(); acc.pop();
      }
      cl.push(29.4, 0, 0, PI / 2); garland(-6.4, 6.4, 6.0, 0, 1.5, r4.range(0, 6.28)); cl.pop();
      for (const [fx, fz, cr] of [[29.2, -2.7, 0], [29.6, 2.5, 1], [26.4, 4.7, 0]]) { cl.push(fx, 2.2, fz, PI / 2 + r5.range(-0.5, 0.5), 1.5); cl.anim(9, 0, 0, 0, r5.range(0, 6.28)); figure(cl, col, r5.pick(clothCols), r5.pick([col.marble, col.saffron]), r5.pick([col.verm, col.mala]), cr === 1); cl.pop(); }
      G.beam(acc, [0, 2.2, 12], [0, 14, 12], 0.09, col.gold, M.GOLD); G.beam(acc, [12, 2.2, -13], [12, 13, -13], 0.09, col.gold, M.GOLD);
    });
    poles.push([L3(ix, 13.4, 227), 7, 1.9]); poles.push([L3(ix + 12, 12.4, 202), 6, 1.7]);
    // chhatri kiosks on plinths in the water, alternating either side of our line, a peacock on each
    const lakeKiosk = (z, off) => { const x = pathX(z) + off, sg = off > 0 ? -1 : 1; blockers.push([x, z, 5]);
      acc.push(x, 0, z); acc.ngon(8, 3.3, 3.0, -0.5, 2.4, col.marble, M.PLAIN, { cap: false }); acc.ngon(8, 3.3, 3.3, 2.4, 2.75, col.marbleB);
      acc.ngon(8, 3.34, 3.34, 1.5, 1.95, col.verm, M.PLAIN, { cap: false }); acc.push(0, 2.75, 0); G.chhatri(acc, col, 1.45, 8, true); acc.pop(); acc.pop();
      G.peacock(acc, cl, col, [x + sg * 2.75, 2.75, z], 1.75, r4.range(0, 6.28)); };
    lakeKiosk(185, 13); lakeKiosk(262, 13); lakeKiosk(274, -13); lakeKiosk(338, -13);
    await Y();
    const pleasureBoat = (bx, bz, rr, hull, awn, par, ry = PI / 2, pen = true) => {
      inFrame(bx, 0.3, bz, ry + rr.range(-0.15, 0.15), () => {
        boat(acc, col, 15, hull, null);
        for (const sx of [-3.2, 3.2]) for (const sz of [-1.3, 1.3]) G.beam(acc, [sx, 1.8, sz], [sx, 5.0, sz], 0.05, col.gold, M.GOLD);
        cl.anim(2, 0, 5, 0, rr.range(0, 6.28));
        for (let i = 0; i < 4; i++) { const xa = -3.6 + i * 1.8, xb = xa + 1.8, wa = i === 0 ? 0 : i === 2 ? 1 : 0.7, wb = i === 3 ? 0 : i === 1 ? 1 : 0.7; cl.quad([xa, 5, 1.6], [xb, 5, 1.6], [xb, 5, -1.6], [xa, 5, -1.6], awn, M.STRIPE + 0.5, { wt: [wa, wb, wb, wa] }); }
        cl.anim(5, 0, 5, 1.6, rr.range(0, 6.28));
        for (let i = 0; i < 8; i++) for (const sz of [-1.6, 1.6]) cl.quad([-3.6 + i * 0.9, 4.5, sz], [-2.7 + i * 0.9, 4.5, sz], [-2.7 + i * 0.9, 5, sz], [-3.6 + i * 0.9, 5, sz], i % 2 ? col.verm : col.gold, i % 2 ? M.PLAIN : M.GOLD, { wt: [1, 1, 0.2, 0.2] });
        acc.box(0, 1.9, 0, 4.4, 0.5, 2.2, col.indigo, M.STRIPE, { cap: col.verm }); acc.box(-1.6, 2.4, 0, 0.9, 0.7, 1.6, col.mala);
        G.beam(acc, [6.6, 1.8, 0], [6.6, 6.4, 0], 0.05, col.gold, M.GOLD);
        cl.push(-5.6, 1.8, 0); cl.anim(10, 0, 0, 0, rr.range(0, 6.28)); parasol(cl, col, 1.2, par); cl.pop();
        for (const [fx, fy, sc] of [[0.5, 2.4, 1.15], [1.7, 2.4, 1.1], [-4.9, 1.8, 1.4], [5.4, 1.8, 1.4]]) { cl.push(fx, fy, r5.range(-0.4, 0.4), r5.range(-0.6, 0.6), sc); cl.anim(9, 0, 0, 0, r5.range(0, 6.28)); figure(cl, col, r5.pick(clothCols), r5.pick([col.marble, col.saffron, col.marble]), r5.pick([col.verm, col.saffron, col.mala]), false); cl.pop(); }
        if (pen) poles.push([acc.world(6.6, 6.0, 0), 2.3, 0.8]); else { acc.push(6.6, 6.4, 0); G.finial(acc, col, 0.6); acc.pop(); }
      });
    };
    // one moored at the garden island, on its far quarter (11 m off our line as the route curves round it)
    inFrame(ix, 0, 215, 0, () => pleasureBoat(22, 27.5, r1, col.verm, col.saffron, col.mala, -(PI / 2 + 0.87)));
    blockers.push([ix + 22, 242.5, 9]);
    // THE PALACE STEPS: a marble landing stage standing in the lake 12.5 m to our left (z 290 to 335), laid along our heading: four washing
    // steps under a lotus moulding, a tiled platform with a pierced rail and a chhatri, two lamp pillars, parasols, pots, and a moored pleasure boat
    {
      const zc = 312, b = Math.atan2(pathX(zc + 18) - pathX(zc - 18), 36), cx = pathX(zc) + Math.cos(b) * 12.5, cz = zc - Math.sin(b) * 12.5;
      for (const t of [-18, -6, 6, 18]) blockers.push([cx + Math.sin(b) * t - Math.cos(b) * -5 * 0 + Math.cos(b) * 4, cz + Math.cos(b) * t - Math.sin(b) * 4, 11]);
      inFrame(cx, 0, cz, Math.atan2(-Math.cos(b), Math.sin(b)), () => {       // local x runs along our heading, local +z points at our line
        for (let i = 0; i < 4; i++) acc.box(0, -0.5, -0.35 - i * 0.7, 45, 0.8 + 0.7 * i, 0.7, i % 2 ? col.marbleB : col.marble, M.PLAIN, { cap: col.marble });
        acc.box(0, -0.5, -6.3, 45, 3.6, 7, col.marbleB, M.PLAIN, { cap: col.marble, capMat: M.TILE + 0.5 });
        acc.quad([-22.5, 2.4, -2.72], [22.5, 2.4, -2.72], [22.5, 3.1, -2.78], [-22.5, 3.1, -2.78], col.marble, M.LOTUS + 0.5);
        for (const ex of [-22.52, 22.52]) acc.quad([ex, -0.5, ex > 0 ? 0 : -9.8], [ex, -0.5, ex > 0 ? -9.8 : 0], [ex, 2.2, ex > 0 ? -9.8 : -2.8], [ex, 2.2, ex > 0 ? -2.8 : -9.8], col.marble, M.LOTUS + 0.5);
        acc.quad([-22.5, 3.1, -9.6], [22.5, 3.1, -9.6], [22.5, 4.3, -9.6], [-22.5, 4.3, -9.6], col.marble, M.JALI);
        for (let i = 0; i <= 6; i++) { const px = -22.2 + i * 7.4; acc.box(px, 3.1, -9.6, 0.6, 1.7, 0.6, col.marbleB, M.PLAIN, { cap: col.marble }); acc.push(px, 4.8, -9.6); G.finial(acc, col, 0.7); acc.pop(); if (i < 6) garland(px + 0.5, px + 6.9, 4.5, -9.25, 0.8, r4.range(0, 6.28)); }
        for (let i = 0; i < 4; i++) { const y = 2.4 - 0.7 * i, z0 = -2.45 + 0.7 * i; acc.quad([-2, y + 0.02, z0 + 0.35], [2, y + 0.02, z0 + 0.35], [2, y + 0.02, z0 - 0.35], [-2, y + 0.02, z0 - 0.35], col.verm, M.STRIPE); acc.quad([-2, y - 0.7, z0 + 0.37], [2, y - 0.7, z0 + 0.37], [2, y, z0 + 0.37], [-2, y, z0 + 0.37], col.verm, M.STRIPE); }
        acc.push(0, 3.1, -6.6); G.chhatri(acc, col, 1.9, 4, true); acc.pop();
        // lamp pillars: 12 m tapering shafts ringed with lamp brackets, a gold flame at the head
        for (const lx of [-17, 17]) {
          acc.push(lx, 3.1, -5.6); acc.ngon(8, 1.1, 1.0, 0, 0.9, col.marble); acc.ngon(8, 0.62, 0.4, 0.9, 11.4, col.marble, M.PLAIN, { cap: false }); acc.ngon(8, 0.85, 0.85, 11.4, 11.8, col.marbleB);
          for (let k = 0; k < 5; k++) { const y = 2.4 + k * 1.9, r = 0.9 - k * 0.07; acc.ngon(8, r, r, y, y + 0.14, col.marbleB, M.PLAIN, { cap: false }); for (let j = 0; j < 4; j++) { const a = j * PI / 2 + k * 0.6; acc.push(Math.cos(a) * r, y + 0.14, Math.sin(a) * r); acc.lathe([[0.0, 0], [0.14, 0.1], [0.1, 0.3], [0.0, 0.52]], 5, col.gold, M.GOLD); acc.pop(); } }
          acc.push(0, 11.8, 0); acc.lathe([[0.0, 0], [0.5, 0.25], [0.56, 0.7], [0.34, 1.3], [0.12, 1.9], [0.0, 2.4]], 7, col.gold, M.GOLD); acc.pop(); acc.pop();
        }
        for (const [px, pc] of [[-11.5, col.saffron], [-5, col.mala], [10.5, col.verm]]) { cl.push(px, 3.1, -5.2); cl.anim(10, 0, 0, 0, r4.range(0, 6.28)); parasol(cl, col, 1.6, pc); cl.pop(); }
        for (let k = 0; k < 8; k++) { const st = r4.int(0, 3); acc.push(r4.range(-21, 21), 0.3 + 0.7 * st, -0.35 - 0.7 * st, 0, r4.range(0.85, 1.3)); G.pot(acc, col, 1); acc.pop(); }
        for (const [sx, c] of [[-14, col.saffron], [7, col.indigo], [15.5, col.mala]]) acc.quad([sx, 1.72, -1.1], [sx + 3.4, 1.72, -1.1], [sx + 3.4, 1.72, -1.7], [sx, 1.72, -1.7], c, M.STRIPE);
        G.beam(acc, [21.5, 3.1, -8.6], [21.5, 12.5, -8.6], 0.08, col.gold, M.GOLD); poles.push([acc.world(21.5, 11.9, -8.6), 3.8, 1.2]);
        pleasureBoat(9.5, 2.7, r4, col.indigo, col.verm, col.saffron, 0, false);
        // people on the stage: one under each parasol, others along the rail, women coming down the steps with pots
        for (const px of [-11.5, -5, 10.5]) { cl.push(px + 0.6, 3.1, -4.85, r5.range(-0.4, 0.4), 1.6); cl.anim(9, 0, 0, 0, r5.range(0, 6.28)); figure(cl, col, r5.pick(clothCols), col.marble, r5.pick([col.verm, col.saffron, col.mala]), false); cl.pop(); }
        for (let k = 0; k < 8; k++) {
          const st = k < 4 ? r5.int(0, 3) : -1; let x = r5.range(-20, 20); if (Math.abs(x) < 3.6) x += x < 0 ? -4.2 : 4.2;
          cl.push(x, st < 0 ? 3.1 : 0.3 + 0.7 * st, st < 0 ? r5.range(-8.4, -3.3) : -0.35 - 0.7 * st, r5.range(-0.7, 0.7), r5.range(1.4, 1.65)); cl.anim(9, 0, 0, 0, r5.range(0, 6.28));
          figure(cl, col, r5.pick(clothCols), st < 0 ? r5.pick([col.marble, col.saffron, col.marble]) : r5.pick(clothCols), r5.pick([col.verm, col.saffron, col.mala]), st >= 0); cl.pop();
        }
        { const q = acc.world(0, 0, -5); hero.reflBox(q[0], 1.8, q[2], 19, 1.8, 9, col.marbleB); }
        { const e = cl.world(-27.5, 0, 0.8), bq = acc.world(9.5, 0, 2.7); BATH.push([-e[2], e[0] + 460, -1.0, 1.15]); blockers.push([-e[2], e[0] + 460, 5]); hero.reflBox(bq[0], 2.6, bq[2], 6.5, 2.6, 2.2, mixc(col.indigo, col.verm, 0.3)); }
      });
    }
    await Y();
    // a flotilla keeps us company across the open lake: small parasol boats, a passenger under the parasol and a rower standing in the stern,
    // rowing to and fro along our line (cloth kind 15), 26 m and more to either side of it
    {
      const hits = (x, z) => blockers.some((b) => Math.hypot(x - b[0], z - b[1]) < b[2] + 6.5);
      for (const [fz, off] of [[196, 30], [222, 46], [276, -40], [272, 60], [296, -62], [300, -30], [318, 62], [334, -44], [345, 40], [356, -70], [366, -32]]) {
        const x = pathX(fz) + off; if (hits(x, fz) || hits(x - 6.5, fz + 15) || hits(x + 6.5, fz - 15)) continue;
        const bl = r5.range(8, 10.5), hc = r5.pick([col.verm, col.saffron, col.indigo, col.wood, col.marble]), pc = r5.pick([col.verm, col.saffron, col.mala, col.marble]), h = bl * 0.12;
        await Y();
        cl.push(x, 0.22, fz, PI / 2 - 0.42 + r5.range(-0.12, 0.12)); cl.anim(15, 0, 0, 0, r5.range(0, 6.28));
        boat(cl, col, bl, hc, pc === hc ? col.mala : pc);
        cl.push(-bl * 0.12 + 0.75, h, 0.1, PI / 2, 1.2); figure(cl, col, r5.pick(clothCols), r5.pick([col.marble, col.saffron]), r5.pick([col.verm, col.mala, col.saffron]), false); cl.pop();
        cl.push(bl * 0.33, h, 0, -PI / 2, 1.35); figure(cl, col, r5.pick(clothCols), col.marble, r5.pick([col.verm, col.saffron]), false); cl.pop();
        G.beam(cl, [bl * 0.33 - 0.2, h + 1.7, 0.45], [bl * 0.33 + 1.5, -0.5, 1.5], 0.05, col.wood);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x0 = sx * bl * 0.5, z0 = sz * 0.9; cl.quad([x0, -0.1, z0], [x0 + sx * 1.3, -0.1, z0 + sz * 0.8], [x0 + sx * 1.4, -0.1, z0 + sz * 1.02], [x0, -0.1, z0 + sz * 0.28], col.pearl, M.PLAIN + 0.5); }
        cl.pop();
      }
    }
    await Y();
    // where every bloom and every floating lamp is laid (noted for the boats of the pass, which keep their lanes off them)
    const bloomAt = [], lampAt = [];
    const rL = r3, padCols = [col.mala, mulc(col.mala, 0.86), mixc(col.mala, col.saffron, 0.22), mulc(col.mala, 1.06)];
    const duck = (x, z, right) => {
      const ph = r3.range(0.1, 3.0) + (right ? PI : 0);
      cl.push(x, 0.06, z, r3.range(-0.5, 0.5), r3.range(0.9, 1.15)); cl.anim(11, 0, 0.2, 0, ph);
      cl.lathe([[0.02, 0], [0.2, 0.05], [0.25, 0.2], [0.17, 0.32], [0.03, 0.36]], 6, mixc(col.saffron, col.verm, 0.45), M.PLAIN, { squash: 2.0 });
      cl.push(0, 0.2, 0.36); cl.ngon(5, 0.07, 0.055, 0, 0.3, col.cream, M.PLAIN, { cap: false }); cl.push(0, 0.3, 0.02); cl.lathe([[0.01, 0], [0.08, 0.04], [0.08, 0.1], [0.0, 0.15]], 5, col.cream, M.PLAIN, { squash: 1.5 }); cl.pop(); cl.pop();
      for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const x0 = sx * (0.34 + k * 0.5), z0 = -0.25 - k * 0.55, x1 = sx * (1.0 + k * 0.85), z1 = -1.9 - k * 0.9, w = 0.11; cl.quad([x0, 0.01, z0], [x1, 0.01, z1], [x1 - sx * w, 0.01, z1], [x0 - sx * w, 0.01, z0], col.pearl, M.PLAIN + 0.5); }
      cl.pop();
    };
    const raft = (cx, cz, n, rad, clear, r3 = rL, every = 4, big = 1) => {
      n = Math.max(4, Math.round(n * density * (0.5 + 0.5 * detail))); let lfx = 1e9, lfz = 1e9;
      for (let i = 0; i < n; i++) {
        const a = r3.range(0, 6.283), r = rad * Math.sqrt(r3()), x = cx + Math.cos(a) * r * 1.5, z = cz + Math.sin(a) * r * 2.2, s = r3.range(0.42, 0.95) * big, y = 0.1 + (i % 5) * 0.004, ph = r3.range(0, 6.28);
        if (clear && !clear(x, z)) { r3(); continue; }
        // pads on our own line slide under the prow: they stay flat there, and carry no flower or frog to poke through the bow boards
        const onLine = Math.abs(x - pathX(z)) < 5, fw = onLine ? 0.1 : 1;
        cl.anim(9, x, y, z, ph); cl.quad([x - s, y, z - s], [x - s, y, z + s], [x + s, y, z + s], [x + s, y, z - s], r3.pick(padCols), M.PAD + 0.5, { wt: [fw, fw, fw, fw] });
        if (onLine) continue;
        if (i % every === 1 && Math.abs(x + s * 0.8 - pathX(z)) > 6.2) { const fx = x + s * 0.8, fz = z + s * 0.6;
          if (Math.hypot(fx - lfx, fz - lfz) >= 1.5) { lfx = fx; lfz = fz; bloomAt.push([fx, fz]); cl.anim(9, fx, y, fz, ph + 1); for (const k of [0, 1]) { const dx = k ? 0 : 0.62, dz = k ? 0.62 : 0; cl.quad([fx - dx, y, fz - dz], [fx + dx, y, fz + dz], [fx + dx, y + 1.25, fz + dz], [fx - dx, y + 1.25, fz - dz], col.pink, M.FLOWER + 0.5, { wt: [0.15, 0.15, 0.15, 0.15] }); } } }
        if (i % 9 === 5) { cl.anim(12, x, y + 0.04, z, ph); cl.quad([x - 0.16, y + 0.04, z - 0.12], [x - 0.16, y + 0.04, z + 0.12], [x + 0.2, y + 0.2, z + 0.12], [x + 0.2, y + 0.2, z - 0.12], mulc(col.mala, 0.6), M.PLAIN); }
      }
    };
    for (let i = 0; i < 6; i++) raft(r3.range(-24, 24), r3.range(162, 206), 20, 4.8, free);
    for (let z = 166, i = 0; z < 374; z += 19, i++) {
      if (i % 4 === 3) await Y();
      const px = pathX(z), off = i % 3 === 0 ? r3.range(-1.5, 1.5) : (i % 2 ? 1 : -1) * r3.range(5, 12);
      raft(px + off, z, 26, 5.5, free);
      if (i % 2 === 0) { const sd = off > 0 ? 1 : -1, dz = z + r3.range(4, 12); duck(pathX(dz) + sd * r3.range(2.5, 6), dz, sd < 0); duck(pathX(dz + 2.5) + sd * r3.range(4, 8), dz + 2.5, sd < 0); }
    }
    await Y();
    // more rafts close to our line across the open lake, so the lower half of the frame is never bare slate
    for (let z = 174, i = 0; z < 372; z += 19, i++) raft(pathX(z) + (i % 2 ? -1 : 1) * r4.range(3.5, 11), z + r4.range(-4, 4), 14, 3.6, free, r4);
    await Y();
    // ---------- more on the water, so the lake is never a bare floor: lotus beds, floating lamps, marigold rings, bathing elephants, boats
    // under way close by, and under each of them its painted reflection (lens strokes) and its ripple rings ----------
    const r6 = rng.fork('frp-lake2'), lakeC = G.lin(look.lake);
    // a lens-shaped stroke lying on the water, pointed at both ends, its long axis at `ang` to the frame's x
    const lens = (a, x, y, z, hl, hd, ang, c) => {
      const ca = Math.cos(ang), sa = Math.sin(ang), P = (u, v) => [x + ca * u * hl - sa * v * hd, y, z + sa * u * hl + ca * v * hd];
      a.quad(P(-1, 0), P(-0.45, -1), P(-0.45, 1), P(-0.45, 1), c, M.PLAIN + 0.5); a.quad(P(-0.45, -1), P(0.45, -1), P(0.45, 1), P(-0.45, 1), c, M.PLAIN + 0.5); a.quad(P(0.45, -1), P(1, 0), P(0.45, 1), P(0.45, 1), c, M.PLAIN + 0.5);
    };
    // a painted ripple ring: three arcs
    const ring = (a, x, y, z, r, c, wd = 0.07, n = 12) => {
      for (let j = 0; j < n; j++) {
        if (j % 4 === 3) continue;
        const a0 = (j / n) * 6.2832, a1 = ((j + 1) / n) * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        a.quad([x + c0 * (r + wd), y, z + s0 * (r + wd)], [x + c1 * (r + wd), y, z + s1 * (r + wd)], [x + c1 * (r - wd), y, z + s1 * (r - wd)], [x + c0 * (r - wd), y, z + s0 * (r - wd)], c, M.PLAIN + 0.5);
      }
    };
    // under a boat lying along its frame's x: four tapering strokes on the side toward our line (sd), in the hull's colour and the awning's
    const under = (len, hc, tc, sd) => { const w = len * 0.24; for (let k = 0; k < 4; k++) lens(cl, (k % 2 ? 0.05 : -0.04) * len, -0.1, sd * (w * 0.5 + 0.5 + k * (0.75 + 0.03 * len)), len * 0.45 * Math.pow(0.72, k), 0.2 + 0.012 * len, 0, mixc(k % 3 === 2 ? tc : hc, lakeC, 0.4)); };
    const wake = (len) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x0 = sx * len * 0.5, z0 = sz * len * 0.1; cl.quad([x0, -0.1, z0], [x0 + sx * 1.3, -0.1, z0 + sz * 0.8], [x0 + sx * 1.4, -0.1, z0 + sz * 1.02], [x0, -0.1, z0 + sz * 0.28], col.pearl, M.PLAIN + 0.5); } };
    // a floating lamp: a brass dish with a gold flame (gold leaf: it alone blooms), rocking
    const lamp = (x, z, s, ph) => { lampAt.push([x, z]); cl.push(x, 0.07, z, 0, s); cl.anim(9, 0, 0, 0, ph); cl.lathe([[0.05, 0], [0.34, 0.06], [0.4, 0.17], [0.3, 0.2]], 6, col.brass, M.PLAIN); cl.push(0, 0.17, 0); cl.lathe([[0.0, 0], [0.12, 0.1], [0.09, 0.3], [0.0, 0.52]], 5, col.gold, M.GOLD); cl.pop(); cl.pop(); };
    // a marigold ring thrown on the water
    const mring = (gx, gz, gr, ph) => { cl.anim(9, gx, 0.09, gz, ph);
      for (let j = 0; j < 9; j++) { const a0 = (j / 9) * 6.2832, a1 = ((j + 1) / 9) * 6.2832, ro = gr + 0.15, ri = gr - 0.15;
        cl.quad([gx + Math.cos(a0) * ro, 0.09, gz + Math.sin(a0) * ro], [gx + Math.cos(a1) * ro, 0.09, gz + Math.sin(a1) * ro], [gx + Math.cos(a1) * ri, 0.09, gz + Math.sin(a1) * ri], [gx + Math.cos(a0) * ri, 0.09, gz + Math.sin(a0) * ri], col.saffron, M.BEAD + 0.5, { u0: j * 0.56, wt: [0.06, 0.06, 0.06, 0.06] }); } };
    // a bathing elephant, belly-deep, facing its frame's +z: it rocks, its trunk is raised and throws dotted water back over its own
    // shoulders, a mahout sits on its vermilion blanket; rings spread round it and its grey lies on the water as lens strokes toward our line
    const bather = (x, z, ry, s, ph) => {
      const gr = mixc(col.slate, col.marble, 0.42), earIn = mixc(gr, col.pink, 0.6), yw = 0.5 + 0.12 / s;
      cl.push(x, -0.5 * s, z, ry, s); cl.anim(9, 0, 0, 0, ph);
      cl.lathe([[0.25, 0], [1.2, 0.5], [1.45, 1.5], [1.25, 2.4], [0.45, 2.9], [0.0, 3.0]], 10, gr, M.PLAIN, { squash: 1.75 });
      cl.push(0, 1.25, 2.55); cl.lathe([[0.1, 0], [0.8, 0.3], [0.95, 1.0], [0.75, 1.7], [0.2, 2.05], [0.0, 2.1]], 9, gr, M.PLAIN, { squash: 1.1 }); cl.pop();
      for (const sx of [-1, 1]) {
        const R = [sx * 0.8, 2.6, 2.35], pt = (a, r) => [R[0] + sx * Math.cos(a) * r, R[1] + Math.sin(a) * r * 0.95, R[2] - 0.3 * r];
        for (let i = 0; i < 5; i++) { const a0 = (-75 + 32 * i) * PI / 180, a1 = a0 + 32 * PI / 180; cl.quad(R, pt(a0, 1.3), pt(a1, 1.3), pt(a1, 1.3), i % 2 ? earIn : gr, M.PLAIN + 0.5); }
        G.beam(cl, [sx * 0.36, 1.95, 3.4], [sx * 0.52, 1.75, 4.25], 0.07, col.pearl);
        // the blanket's skirts and gold hem
        cl.quad([sx * 1.42, 1.9, -1.3], [sx * 1.42, 1.9, 1.1], [sx * 0.7, 2.96, 1.1], [sx * 0.7, 2.96, -1.3], col.verm, M.STRIPE + 0.5); G.beam(cl, [sx * 1.44, 1.9, -1.3], [sx * 1.44, 1.9, 1.1], 0.05, col.gold, M.GOLD);
      }
      cl.quad([-0.7, 2.97, -1.3], [0.7, 2.97, -1.3], [0.7, 2.97, 1.1], [-0.7, 2.97, 1.1], col.verm, M.STRIPE + 0.5);
      cl.quad([-0.3, 2.3, 3.6], [0.3, 2.3, 3.6], [0.3, 3.25, 3.2], [-0.3, 3.25, 3.2], col.verm, M.PLAIN + 0.5); cl.push(0, 3.3, 2.6); cl.lathe([[0.16, 0], [0.18, 0.05], [0.0, 0.2]], 5, col.gold, M.GOLD); cl.pop();
      const tk = [[0, 2.1, 3.45], [0, 1.95, 4.15], [0, 2.5, 4.7], [0, 3.4, 4.75], [0, 4.15, 4.3]];
      for (let i = 0; i < 4; i++) G.beam(cl, tk[i], tk[i + 1], 0.3 - i * 0.045, gr);
      // dotted water in three arcs from the trunk tip back over the shoulders
      for (const dx of [-0.9, 0, 0.9]) { let pv = [0, 4.3, 4.2], v0 = 0;
        for (let i = 1; i <= 5; i++) { const t = i / 5, q = [dx * t, 4.3 + 2.4 * t - 3.4 * t * t, 4.2 - 4.4 * t], dl = Math.hypot(q[0] - pv[0], q[1] - pv[1], q[2] - pv[2]);
          cl.quad([pv[0] - 0.07, pv[1], pv[2]], [pv[0] + 0.07, pv[1], pv[2]], [q[0] + 0.07, q[1], q[2]], [q[0] - 0.07, q[1], q[2]], col.pearl, M.DASH + 0.5, { v0 }); v0 += dl; pv = q; } }
      cl.push(0, 2.75, -0.2, 0, 0.85 / s * 1.3); figure(cl, col, r6.pick(clothCols), col.marble, r6.pick([col.verm, col.saffron]), false); cl.pop();
      ring(cl, 0, yw, 0.8, 3.6, col.pearl, 0.06 / s + 0.03); ring(cl, 0.4, yw, 0.6, 5.0, col.pearl, 0.05 / s + 0.03, 16);
      cl.pop();
      const q = path.pointAt(uAtZ(z - 24), tmp), dl = Math.hypot(q.x - x, q.z - z) || 1, dx = (q.x - x) / dl, dz = (q.z - z) / dl, ang = Math.atan2(dx, -dz);
      for (let k = 0; k < 4; k++) { const d = (3.0 + k * 0.8) * s, lx = x + dx * d, lz = z + dz * d; cl.anim(9, lx, 0.16, lz, ph + k); lens(cl, lx, 0.16, lz, 1.9 * s * Math.pow(0.72, k), 0.17 * s, ang, mixc(k === 1 ? col.verm : gr, lakeC, 0.55)); }
    };
    for (const [bx, bz, bry, bs] of BATH) bather(bx, bz, bry, bs, r6.range(0, 6.28));
    await Y();
    // eight broad lotus beds beside our line, a bloom on every third pad
    for (const [bz, off] of [[180, -9], [205, 8], [235, 6], [260, -9], [285, 8], [320, 5], [350, 7], [372, -6]]) { raft(pathX(bz) + off, bz, 70, 6, free, r6, 3, 1.15); await Y(); }
    // floating lamps and marigold rings scattered along the crossing
    for (let i = 0; i < 40; i++) {
      const z = 171 + i * 5.1 + r6.range(-1.5, 1.5), off = (i % 2 ? 1 : -1) * r6.range(3.4, 13), s = r6.range(1.3, 1.8), ph = r6.range(0, 6.28); let x = pathX(z) + off;
      if (!free(x, z)) x = pathX(z) - off;
      if (free(x, z)) lamp(x, z, s, ph);
    }
    for (let i = 0; i < 10; i++) { const z = 178 + i * 20 + r6.range(-4, 4), x = pathX(z) + (i % 2 ? -1 : 1) * r6.range(4, 10), gr = r6.range(0.6, 0.9), ph = r6.range(0, 6.28); if (free(x, z)) mring(x, z, gr, ph); }
    await Y();
    // boats under way beside us (cloth kind 15: they row to and fro along our line). A boat's +x is its bow.
    {
      // THE SECOND ROYAL BARGE, 27 m to our left: 22 m of vermilion hull, a malachite canopy on six gold poles with a gilded dome, the raja on
      // an indigo dais, six oarsmen, a helmsman, a peacock at the bow with its tail fanned
      const z0 = 258, x0 = pathX(z0) + 27, dk = 2.96;
      cl.push(x0, 0.22, z0, PI / 2 - 0.42); cl.anim(15, 0, 0, 0, r6.range(0, 6.28));
      boat(cl, col, 22, col.verm, null);
      for (const px of [-7.5, -4, -0.5]) for (const sz of [-2, 2]) G.beam(cl, [px, dk, sz], [px, 6.6, sz], 0.06, col.gold, M.GOLD);
      cl.quad([-8.1, 6.6, 2.5], [0.1, 6.6, 2.5], [0.1, 6.6, -2.5], [-8.1, 6.6, -2.5], col.mala, M.STRIPE + 0.5);
      for (const sz of [-2.5, 2.5]) cl.quad([-8.1, 5.9, sz], [0.1, 5.9, sz], [0.1, 6.6, sz], [-8.1, 6.6, sz], col.verm, M.SCALLOP + 0.5);
      for (const ex of [-8.1, 0.1]) cl.quad([ex, 5.9, -2.5], [ex, 5.9, 2.5], [ex, 6.6, 2.5], [ex, 6.6, -2.5], col.verm, M.SCALLOP + 0.5);
      cl.push(-4, 6.6, 0, 0, 0.95); cl.lathe(G.DOME_PROF, 8, col.gold, M.GOLD); cl.pop(); cl.push(-4, 7.6, 0); G.finial(cl, col, 0.7); cl.pop();
      cl.box(-4, dk, 0, 3.4, 0.55, 2.6, col.indigo, M.STRIPE, { cap: col.verm });
      cl.push(-4, dk + 0.2, 0, PI / 2, 1.3); figure(cl, col, col.saffron, col.marble, col.verm, false); cl.pop();
      for (const [fx, fz] of [[-6.2, 0.9], [-1.9, -0.9]]) { cl.push(fx, dk, fz, PI / 2, 1.3); figure(cl, col, r6.pick(clothCols), col.marble, r6.pick([col.saffron, col.mala]), false); cl.pop(); }
      for (const ox of [2, 4.2, 6.4]) for (const sz of [-1, 1]) {
        cl.push(ox, dk - 0.5, sz * 1.5, -PI / 2, 1.0); figure(cl, col, r6.pick(clothCols), col.marble, r6.pick([col.verm, col.saffron, col.mala]), false); cl.pop();
        G.beam(cl, [ox, dk + 0.7, sz * 2.3], [ox - 0.9, -0.3, sz * 5.6], 0.05, col.wood); G.beam(cl, [ox - 0.72, 0.3, sz * 4.95], [ox - 0.9, -0.3, sz * 5.6], 0.15, col.verm);
      }
      cl.push(-9.3, dk, 0, PI / 2, 1.4); figure(cl, col, col.indigo, col.marble, col.saffron, false); cl.pop(); G.beam(cl, [-9.5, dk + 1.7, 0.4], [-12.8, -0.4, 1.3], 0.06, col.wood);
      // the bow: a malachite neck and gilded head, the tail fanned behind it
      const nk = [[10.4, 3.3, 0], [11.5, 4.5, 0], [12.0, 5.5, 0], [12.6, 5.85, 0]]; for (let i = 0; i < 3; i++) G.beam(cl, nk[i], nk[i + 1], 0.27 - i * 0.05, col.mala);
      cl.push(12.55, 5.6, 0); cl.lathe([[0.02, 0], [0.2, 0.08], [0.22, 0.24], [0.1, 0.4], [0.0, 0.44]], 6, col.gold, M.GOLD); cl.pop();
      for (const cz of [-0.22, 0, 0.22]) G.beam(cl, [12.5, 6.0, 0], [12.35, 6.5, cz], 0.03, col.gold, M.GOLD);
      for (let i = 0; i < 7; i++) { const a = (-66 + 22 * i) * PI / 180, L = 2.7 - 0.2 * Math.abs(i - 3), sy = Math.cos(a), sz = Math.sin(a);
        cl.quad([10.2, 3.0 + sz * 0.06, -sy * 0.06], [10.2, 3.0 - sz * 0.06, sy * 0.06], [10.2, 3.0 + sy * L - sz * 0.3, sz * L + sy * 0.3], [10.2, 3.0 + sy * L + sz * 0.3, sz * L - sy * 0.3], col.mala, M.FEATHER); }
      G.beam(cl, [-10.4, dk, 0], [-10.4, 8.4, 0], 0.06, col.gold, M.GOLD); cl.quad([-10.4, 7.2, 0], [-12.9, 7.5, 0], [-12.9, 8.1, 0], [-10.4, 8.3, 0], col.verm, M.STRIPE + 0.5);
      wake(22); under(22, col.verm, col.mala, -1);
      cl.pop();
    }
    await Y();
    {
      // a flower boat heaped with marigold and lotus, 21 m to our left
      cl.push(pathX(205) + 21, 0.22, 205, PI / 2 - 0.36); cl.anim(15, 0, 0, 0, r6.range(0, 6.28));
      boat(cl, col, 9.5, col.wood, null);
      cl.push(0.7, 1.2, 0); cl.lathe([[1.0, 0], [0.92, 0.5], [0.55, 0.95], [0.0, 1.1]], 10, col.saffron, M.BEAD); cl.pop();
      cl.push(-1.3, 1.2, 0); cl.lathe([[0.8, 0], [0.7, 0.35], [0.35, 0.65], [0.0, 0.75]], 8, col.pink, M.BEAD); cl.pop();
      cl.push(2.5, 1.2, 0); cl.lathe([[0.7, 0], [0.6, 0.3], [0.3, 0.55], [0.0, 0.62]], 8, col.saffron, M.BEAD); cl.pop();
      cl.push(-3.5, 1.28, 0, PI / 2, 1.35); figure(cl, col, r6.pick(clothCols), col.marble, col.verm, false); cl.pop(); G.beam(cl, [-3.7, 2.9, 0.4], [-5.4, -0.5, 1.3], 0.05, col.wood);
      cl.push(3.7, 1.28, 0); parasol(cl, col, 0.85, col.verm); cl.pop();
      wake(9.5); under(9.5, col.saffron, col.pink, -1);
      cl.pop();
      // the musicians' boat, 22 m to our right: four seated under a striped awning, two drums, a long gold horn
      cl.push(pathX(326) - 22, 0.22, 326, PI / 2 - 0.46); cl.anim(15, 0, 0, 0, r6.range(0, 6.28));
      boat(cl, col, 11.5, col.indigo, null);
      for (const sx of [-2.3, 2.3]) for (const sz of [-1.15, 1.15]) G.beam(cl, [sx, 1.55, sz], [sx, 4.4, sz], 0.05, col.gold, M.GOLD);
      cl.quad([-2.8, 4.4, 1.45], [2.8, 4.4, 1.45], [2.8, 4.4, -1.45], [-2.8, 4.4, -1.45], col.verm, M.STRIPE + 0.5);
      for (const sz of [-1.45, 1.45]) cl.quad([-2.8, 3.9, sz], [2.8, 3.9, sz], [2.8, 4.4, sz], [-2.8, 4.4, sz], col.saffron, M.SCALLOP + 0.5);
      for (let k = 0; k < 4; k++) { cl.push(-1.65 + k * 1.1, 1.1, -0.15, 0, 1.05); figure(cl, col, clothCols[(k * 2 + 1) % 6], col.marble, [col.verm, col.saffron, col.mala, col.saffron][k], false); cl.pop(); }
      for (const dx of [-1.1, 0]) { cl.push(dx, 1.55, 0.75); cl.lathe([[0.2, 0], [0.3, 0.22], [0.2, 0.45], [0.0, 0.46]], 6, col.verm, M.PLAIN); cl.pop(); }
      G.beam(cl, [1.65, 2.75, 0.2], [2.3, 3.5, 1.5], 0.035, col.gold, M.GOLD); G.beam(cl, [2.3, 3.5, 1.5], [2.5, 3.72, 1.9], 0.12, col.gold, M.GOLD);
      cl.push(-4.6, 1.55, 0, PI / 2, 1.35); figure(cl, col, r6.pick(clothCols), col.marble, col.saffron, false); cl.pop(); G.beam(cl, [-4.8, 3.2, 0.4], [-6.6, -0.5, 1.4], 0.05, col.wood);
      wake(11.5); under(11.5, col.indigo, col.verm, 1);
      cl.pop();
    }
    await Y();
    // two punts lying still, a fisherman on each casting a net that falls open on the water
    for (const [pz, off] of PUNTS) {
      const sd = off > 0 ? -1 : 1, hc = off > 0 ? col.marble : col.saffron;
      cl.push(pathX(pz) + off, 0.22, pz, PI / 2 - 0.42 + r6.range(-0.2, 0.2)); cl.anim(9, 0, 0, 0, r6.range(0, 6.28));
      boat(cl, col, 7.5, hc, null);
      cl.push(1.6, 0.9, 0, sd > 0 ? 0 : PI, 1.4); figure(cl, col, r6.pick(clothCols), col.marble, col.verm, false); cl.pop();
      cl.push(-2.3, 0.5, 0, PI / 2, 1.15); figure(cl, col, r6.pick(clothCols), col.saffron, col.mala, false); cl.pop();
      // the net: nine dashed pearl threads running from his hands down to a hoop of ripples on the water
      for (let j = 0; j < 9; j++) { const a = (j / 9) * 6.2832, rx = 1.9 + Math.cos(a) * 1.9, rz = sd * 3.2 + Math.sin(a) * 1.9, tx = -Math.sin(a) * 0.04, tz = Math.cos(a) * 0.04;
        cl.quad([rx - tx, -0.1, rz - tz], [rx + tx, -0.1, rz + tz], [1.65 + tx * 0.6, 2.95, sd * 0.45 + tz * 0.6], [1.65 - tx * 0.6, 2.95, sd * 0.45 - tz * 0.6], col.pearl, M.DASH + 0.5); }
      ring(cl, 1.9, -0.1, sd * 3.2, 1.9, col.pearl, 0.07); ring(cl, 1.9, -0.1, sd * 3.2, 2.9, col.pearl, 0.05, 16); ring(cl, 0, -0.1, 0, 5.2, col.pearl, 0.06, 16);
      under(7.5, hc, col.pearl, sd);
      cl.pop();
    }
    await Y();
    // in the basin, right under the entry: two small rafts, marigold garlands thrown on the water, floating brass pots
    raft(-6.2, 125, 9, 2.0, undefined, r4); raft(5.6, 136, 9, 2.0, undefined, r4);
    for (const [gx, gz, gr] of [[3.6, 119.5, 0.7], [-4.4, 131, 0.8], [7.4, 127.5, 0.6], [-8.2, 138.5, 0.75], [1.2, 141, 0.6]]) {
      cl.anim(9, gx, 0.09, gz, r4.range(0, 6.28));
      for (let j = 0; j < 9; j++) { const a0 = (j / 9) * 6.2832, a1 = ((j + 1) / 9) * 6.2832, ro = gr + 0.14, ri = gr - 0.14;
        cl.quad([gx + Math.cos(a0) * ro, 0.09, gz + Math.sin(a0) * ro], [gx + Math.cos(a1) * ro, 0.09, gz + Math.sin(a1) * ro], [gx + Math.cos(a1) * ri, 0.09, gz + Math.sin(a1) * ri], [gx + Math.cos(a0) * ri, 0.09, gz + Math.sin(a0) * ri], col.saffron, M.BEAD + 0.5, { u0: j * 0.56, wt: [0.06, 0.06, 0.06, 0.06] }); }
    }
    for (const [px, pz] of [[-5.2, 122], [6.2, 132.5], [-6.8, 143]]) { cl.push(px, -0.2, pz, 0, r4.range(0.85, 1.15)); cl.anim(9, 0, 0, 0, r4.range(0, 6.28)); G.pot(cl, col, 1); cl.pop(); }
    await Y();
    for (let z = 386; z < 540; z += 13) { if (z > 444 && z < 476) continue; raft(-83.2, z, 9, 1.4, (x) => x < -81.2 && x > -86.5); }
    for (let z = 392; z < 560; z += 15) raft(pathX(z) + (z % 30 < 15 ? -1 : 1) * r3.range(1, 6), z + 6, 12, 3.0, (x) => x < -82 && x > -103);
    for (const kz of [400, 440, 480, 520]) raft(-102.5, kz + 7, 9, 2.0, (x, zz) => x > -104.4 && (x + 108) * (x + 108) + (zz - kz) * (zz - kz) > 16);
    for (let z = 582; z < 646; z += 9) for (const sd of [-1, 1]) raft(-88 + sd * r3.range(3, 16), z, 8, 2.6, (x, zz) => Math.abs(x + 88) < 20 && Math.abs(x + 88) > 5 && zz < 646 && !(Math.abs(Math.abs(x + 88) - 11) < 3.4 && Math.abs((((zz - 582) % 20) + 20) % 20 - 10) < 3.6));
    await Y();

    // the lotus court and its approach: an avenue of floating lamps up to the portal, marigold rings, denser lotus along the walls, two small
    // boats of watchers moored under them, people at the pavilion's doors
    for (let z = 548; z < 645; z += 7.5) { if (Math.abs(z - 575) < 4.5) continue; for (const sd of [-1, 1]) lamp(pathX(z) + sd * 5.4, z, 1.5, r6.range(0, 6.28)); }
    for (const [gx, gz] of [[-80, 588], [-96.5, 603], [-80.5, 622], [-96, 638], [-97.5, 562]]) mring(gx, gz, r6.range(0.65, 0.9), r6.range(0, 6.28));
    for (const bz of [590, 602, 622, 634]) for (const sd of [-1, 1]) raft(-88 + sd * 16.5, bz, 22, 2.2, (x, zz) => Math.abs(x + 88) > 13.6 && Math.abs(x + 88) < 20.6 && zz < 646 && zz > 581, r6, 3, 1.1);
    for (const [bx, bz, sd, hc] of [[-105.6, 607, 1, col.saffron], [-71.4, 627, -1, col.verm]]) {
      cl.push(bx, 0.22, bz, PI / 2); cl.anim(9, 0, 0, 0, r6.range(0, 6.28));
      boat(cl, col, 6.5, hc, null);
      for (const fx of [-1.2, 0.9]) { cl.push(fx, 0.8, 0, sd > 0 ? 0 : PI, 1.3); figure(cl, col, r6.pick(clothCols), r6.pick([col.marble, col.saffron]), r6.pick([col.verm, col.mala]), false); cl.pop(); }
      ring(cl, 0, -0.1, 0, 4.4, col.pearl, 0.06); under(6.5, hc, col.pearl, sd);
      cl.pop();
    }
    for (const bz of [552, 564, 583]) raft(pathX(bz) - 8.5, bz, 30, 2.6, (x, zz) => x < pathX(zz) - 5.2 && x > -104 && Math.abs(zz - 575) > 3.5, r6, 3, 1.1);
    // lamps and marigold rings set afloat along the close pass, on the open side
    for (let z = 396, i = 0; z < 541; z += 8.5, i++) { const x = pathX(z) - r6.range(5.6, 11.5), s = r6.range(1.3, 1.7), ph = r6.range(0, 6.28); if (!blocked(x, z) && !(Math.abs(x + 108) < 4.5 && Math.abs(((z - 380) % 40) - 20) < 4.5)) lamp(x, z, s, ph); if (i % 4 === 2) mring(pathX(z) - r6.range(6, 10), z + 4, r6.range(0.65, 0.9), r6.range(0, 6.28)); }
    cl.push(-88, 0, 650, PI);
    for (const sx of [-1, 1]) for (const fx of [-1.8, 0.3, 2.0]) { cl.push(sx * 17.25 + fx, 0.8, 1.2, r6.range(-0.4, 0.4), 1.5); cl.anim(9, 0, 0, 0, r6.range(0, 6.28)); figure(cl, col, r6.pick(clothCols), r6.pick([col.marble, col.saffron, col.marble]), r6.pick([col.verm, col.saffron, col.mala]), false); cl.pop(); }
    cl.pop();
    await Y();

    // ---------- on the island palace: parasols on the roof terrace (they withdraw as the rain arrives), langurs on the cornice ----------
    const Wl = (x, y, z) => [-z, y, x + 460];           // the hero's local frame -> world
    for (let lx = -72, k = 0; lx <= 72; lx += 9, k++) {
      if (Math.abs(lx) < 20 || Math.abs(Math.abs(lx) - 27) < 5 || Math.abs(Math.abs(lx) - 52) < 5) continue;
      const p = Wl(lx + r3.range(-1.5, 1.5), 26, 76.2); cl.push(p[0], p[1], p[2], r3.range(0, 6)); cl.anim(10, 0, 0, 0, r3.range(0, 6.28)); parasol(cl, col, r3.range(1.25, 1.6), clothCols[k % 6]); cl.pop();
    }
    for (const lx of [-8, 7]) { const p = Wl(lx, 29.5, 77.5); cl.push(p[0], p[1], p[2]); cl.anim(10, 0, 0, 0, r3.range(0, 6.28)); parasol(cl, col, 1.7, lx < 0 ? col.verm : col.saffron); cl.pop(); }
    for (const lx of [-63, -44, -31, 33, 47, 64]) {
      const p = Wl(lx, 26.02, 79.4), ph = r3.range(0.2, 3.0) + (lx > 0 ? PI : 0);
      cl.push(p[0], p[1], p[2], PI / 2); cl.anim(14, 0, 0, 0, ph);
      cl.box(0, 0.1, 0, 0.7, 0.42, 0.26, col.dark, M.PLAIN + 0.5); cl.box(0.42, 0.34, 0, 0.3, 0.3, 0.24, col.dark, M.PLAIN + 0.5); cl.quad([0.5, 0.42, 0.13], [0.62, 0.42, 0.13], [0.62, 0.56, 0.13], [0.5, 0.56, 0.13], col.cream, M.PLAIN + 0.5);
      cl.quad([-0.35, 0.3, 0], [-0.42, 0.3, 0], [-0.75, 1.0, 0], [-0.68, 1.0, 0], col.dark, M.PLAIN + 0.5);
      for (const fx of [-0.25, 0.25]) cl.box(fx, 0, 0, 0.1, 0.12, 0.2, col.dark, M.PLAIN + 0.5);
      cl.pop();
    }
    // along the plinth of the close pass: mooring posts with garlands, pierced panels, pots and cloths on the ledge, moored boats
    {
      let prevX = null;
      for (let lx = -74, k = 0; lx <= 74.1; lx += 6.17, k++) {
        if (Math.abs(lx) < 15) { prevX = null; continue; }
        if (k % 5 === 4) await Y();
        const p = Wl(lx, 0, 82.3), bay = Wl(lx + 3.08, 0, 80.03);
        acc.push(p[0], -0.5, p[2]); acc.ngon(6, 0.15, 0.12, 0, 4.4, k % 2 ? col.verm : col.saffron, M.PLAIN, { cap: false }); acc.push(0, 4.4, 0); G.finial(acc, col, 0.55); acc.pop(); acc.pop();
        if (prevX !== null) inFrame(-82.3, 0, 460 + (lx + prevX) / 2, PI / 2, () => garland(-(lx - prevX) / 2 + 0.2, (lx - prevX) / 2 - 0.2, 3.6, 0, 0.85, r1.range(0, 6.28)));
        prevX = lx;
        if (lx + 6.17 > 74.1 || Math.abs(lx + 3.08) < 16.5) continue;
        inFrame(bay[0], 0, bay[2], -PI / 2, () => {     // the frame faces the path: local x runs along the wall
          if (k % 3 === 0) { acc.quad([-1.4, 0.7, 0], [1.4, 0.7, 0], [1.4, 2.4, 0], [-1.4, 2.4, 0], col.marble, M.JALI); acc.box(0, 0.45, 0.1, 3.2, 0.25, 0.3, col.marbleB); }
          else if (k % 3 === 1) { sariOn(r1.range(-0.8, 0.8), 3.1, 0.07, r1.range(1.3, 1.9), r1.range(1.5, 2.3), r1.pick(clothCols), r1.range(0, 6.28)); for (const px of [-1.9, 1.7]) { acc.push(px, 3.85, -1.0, 0, r1.range(0.8, 1.1)); G.pot(acc, col, 1); acc.pop(); } }
          else { acc.quad([-0.9, 0.9, 0.03], [0.9, 0.9, 0.03], [0.9, 2.5, 0.03], [-0.9, 2.5, 0.03], col.verm, M.FEATHER); acc.push(0, 3.85, -1.0, 0, 1.25); G.pot(acc, col, 1); acc.pop(); acc.push(0, 3.85 + 0.75, -1.0, 0, 0.5); G.tree(acc, col, 1, false); acc.pop(); }
        });
      }
      inFrame(-80.15, 0, 460, -PI / 2, () => {
        for (const ax of [-9.5, 0, 9.5]) {
          garland(ax - 3.3, ax + 3.3, 8.7, 0.25, 1.2, r1.range(0, 6.28));
          G.beam(acc, [ax, 9.3, 0.1], [ax, 7.9, 0.1], 0.025, col.gold, M.GOLD); acc.push(ax, 7.2, 0.1); acc.lathe([[0.0, 0], [0.24, 0.12], [0.3, 0.36], [0.12, 0.62], [0.0, 0.72]], 6, col.gold, M.GOLD); acc.pop();
        }
        for (const mx of [-14.6, -4.75, 4.75, 14.6]) acc.quad([mx - 0.55, 7.6, 0.06], [mx + 0.55, 7.6, 0.06], [mx + 0.55, 9.1, 0.06], [mx - 0.55, 9.1, 0.06], col.saffron, M.FEATHER);
      });
      // a striped runner down the landing steps, a parasol at each end of the top step
      for (let i = 0; i < 4; i++) {
        const y = 3.0 - 0.7 * i, z0 = 80 + 0.6 * i, z1 = z0 + 0.6, yb = i === 3 ? 0 : y - 0.7;
        acc.quad(Wl(-2, y + 0.02, z0), Wl(2, y + 0.02, z0), Wl(2, y + 0.02, z1), Wl(-2, y + 0.02, z1), col.verm, M.STRIPE); acc.quad(Wl(-2, yb, z1 + 0.02), Wl(2, yb, z1 + 0.02), Wl(2, y, z1 + 0.02), Wl(-2, y, z1 + 0.02), col.verm, M.STRIPE);
      }
      for (const lx of [-10.5, 10.5]) { const p = Wl(lx, 3.0, 80.35); cl.push(p[0], p[1], p[2]); cl.anim(10, 0, 0, 0, r1.range(0, 6.28)); parasol(cl, col, 1.5, lx < 0 ? col.saffron : col.mala); cl.pop(); }
      await Y();
      // people on the landing and watching from the loggia over its pierced rail
      for (const [lx, ly, lz, cr] of [[-9.8, 3.0, 80.3, 0], [-5.4, 3.0, 80.3, 1], [4.6, 3.0, 80.3, 0], [9.8, 3.0, 80.3, 0], [1.1, 2.3, 80.9, 1], [-11.8, 9.9, 79.4, 0], [-6.6, 9.9, 79.2, 0], [-1.6, 9.9, 79.3, 0], [5.6, 9.9, 79.5, 0], [12.9, 9.9, 79.7, 0]]) {
        const p = Wl(lx, ly, lz); cl.push(p[0], p[1], p[2], -PI / 2 + r5.range(-0.5, 0.5), r5.range(1.45, 1.65)); cl.anim(9, 0, 0, 0, r5.range(0, 6.28));
        figure(cl, col, r5.pick(clothCols), cr ? r5.pick(clothCols) : r5.pick([col.marble, col.saffron, col.marble]), r5.pick([col.verm, col.saffron, col.mala]), cr === 1); cl.pop();
      }
      for (const lx of [-52, -27, 36, 61]) { const p = Wl(lx + r1.range(-2, 2), 0.28, 82.9); inFrame(p[0], p[1], p[2], PI / 2 + r1.range(-0.08, 0.08), () => { boat(acc, col, 5.2, r1.pick([col.saffron, col.verm, col.indigo]), null); acc.box(0, 0.6, 0, 1.6, 0.3, 0.9, r1.pick(clothCols), M.STRIPE); }); }
    }
    await Y();

    // ---------- the lotus court (z 575..648) and the lake pavilion that holds the portal ----------
    const courtWall = (x, z0, z1, facing) => {       // a wall along z at world x, its face turned to `facing` (+1: toward +x)
      const len = z1 - z0, hl = len / 2;
      inFrame(x, 0, (z0 + z1) / 2, facing > 0 ? PI / 2 : -PI / 2, () => {
        acc.quad([-hl, -0.5, 0], [hl, -0.5, 0], [hl, 2.6, 0.5], [-hl, 2.6, 0.5], col.marble, M.LOTUS + 0.5);
        acc.quad([-hl, 2.6, 0], [hl, 2.6, 0], [hl, 9.2, 0], [-hl, 9.2, 0], col.marble, M.WALL + 0.5);
        acc.box(0, 9.2, 0, len, 0.3, 0.7, col.marbleB); acc.quad([-hl, 9.5, 0.05], [hl, 9.5, 0.05], [hl, 11.1, 0.05], [-hl, 11.1, 0.05], col.marble, M.KANG + 0.5);
        const nb = Math.max(2, Math.round(len / 9));
        for (let i = 0; i <= nb; i++) { const px = -hl + (i / nb) * len; acc.box(px, -0.5, 0.25, 1.1, 10.2, 0.6, col.marbleB, M.PLAIN, { cap: col.marble }); acc.push(px, 9.7, 0.25); G.finial(acc, col, 0.9); acc.pop(); }
        for (let i = 0; i < nb; i++) {
          const bx = -hl + ((i + 0.5) / nb) * len;
          acc.quad([bx - 2.2, 6.7, 0.04], [bx + 2.2, 6.7, 0.04], [bx + 2.2, 8.7, 0.04], [bx - 2.2, 8.7, 0.04], col.marble, M.JALI);
          if (teej || i % 2 === 0) garland(bx - 3.6, bx + 3.6, 6.4, 0.75, 1.0, r1.range(0, 6.28));
          if (i % 2 === 1) G.awning(acc, cl, col, bx, 4.0, 0.1, 4.2, 2.6, 1.1, r1.pick([col.saffron, col.verm]), r1.range(0, 6.28));
          else sariOn(bx + r1.range(-1.5, 1.5), 9.5, 0.5, 1.2, 2.2, r1.pick(clothCols), r1.range(0, 6.28));
        }
      });
    };
    courtWall(-66, 573, 648, -1); courtWall(-111, 580, 648, 1);
    inFrame(-72.3, 0, 573, PI, () => { acc.quad([-6.3, -0.5, 0], [6.3, -0.5, 0], [6.3, 9.2, 0], [-6.3, 9.2, 0], col.marble, M.WALL + 0.5); acc.quad([-6.3, 9.5, 0], [6.3, 9.5, 0], [6.3, 11.1, 0], [-6.3, 11.1, 0], col.marble, M.KANG + 0.5); acc.box(0, 9.2, 0, 12.6, 0.3, 0.7, col.marbleB); });
    for (const [x, z, sx] of [[-66, 611, 1], [-111, 614, -1]]) {
      acc.push(x, 9.5, z); G.chhatri(acc, col, 1.5, 8, true); acc.pop();
      G.beam(acc, [x, 9.5, z + 18], [x, 16, z + 18], 0.06, col.gold, M.GOLD); poles.push([L3(x, 15.5, z + 18), 5, 1.4]); G.beam(acc, [x, 9.5, z - 18], [x, 16, z - 18], 0.06, col.gold, M.GOLD); poles.push([L3(x, 15.5, z - 18), 5, 1.4]);
      G.peacock(acc, cl, col, [x - sx * 0.2, 11.1, z + 9], 1.7, r1.range(0, 6.28)); G.peacock(acc, cl, col, [x - sx * 0.2, 11.1, z - 10], 1.6, r1.range(0, 6.28));
    }
    for (const fz of [592, 612, 632]) for (const sd of [-1, 1]) { acc.push(-88 + sd * 11, -0.45, fz); G.fountain(acc, col, 1.0, 6); acc.pop(); }
    await Y();
    inFrame(-88, 0, 650, PI, () => {
      const zf = -0.45, aY = (x) => G.archY(x / 6.5, 5, 5);
      // the painted panel round the portal arch: vermilion, a gold rule round the panel and another round the arch
      acc.push(0, 0, zf); acc.archPlate(13, 5, 5, 14, col.verm, { segs: 26, depth: 0.9, shade: mulc(col.verm, 0.8) }); acc.pop();
      for (const sx of [-1, 1]) acc.quad([sx > 0 ? 6.5 : -12.5, -0.5, zf], [sx > 0 ? 12.5 : -6.5, -0.5, zf], [sx > 0 ? 12.5 : -6.5, 14, zf], [sx > 0 ? 6.5 : -12.5, 14, zf], col.verm, M.PLAIN + 0.5);
      const rule = [[-12.0, -0.4], [-12.0, 13.5], [12.0, 13.5], [12.0, -0.4]]; for (let i = 0; i < 3; i++) G.beam(acc, [rule[i][0], rule[i][1], zf + 0.12], [rule[i + 1][0], rule[i + 1][1], zf + 0.12], 0.13, col.gold, M.GOLD);
      let pv = [-7.0, -0.4]; for (let i = 0; i <= 26; i++) { const x = -6.5 + (i / 26) * 13, q = [x * 1.077, aY(x) + 0.5]; G.beam(acc, [pv[0], pv[1], zf + 0.12], [q[0], q[1], zf + 0.12], 0.1, col.gold, M.GOLD); pv = q; } G.beam(acc, [pv[0], pv[1], zf + 0.12], [7.0, -0.4, zf + 0.12], 0.1, col.gold, M.GOLD);
      for (const sx of [-1, 1]) for (const yy of [3.2, 6.6, 10]) { acc.push(sx * 9.6, yy, zf + 0.1); acc.lathe([[0.0, 0], [0.3, 0.25], [0.42, 0.7], [0.22, 1.25], [0.0, 1.6]], 6, col.gold, M.GOLD); acc.pop(); }
      acc.quad([-7.2, -0.5, zf - 1.6], [7.2, -0.5, zf - 1.6], [7.2, 12.5, zf - 1.6], [-7.2, 12.5, zf - 1.6], col.ink, M.PLAIN + 0.5);
      // wings: lamp-niched walls, a cusped doorway and a balcony each
      for (const sx of [-1, 1]) {
        const x0 = sx > 0 ? 12.5 : -22, x1 = sx > 0 ? 22 : -12.5, xc = sx * 17.25;
        acc.quad([x0, -0.5, zf], [x1, -0.5, zf], [x1, 22, zf], [x0, 22, zf], col.marble, M.WALL + 0.5);
        acc.quad([xc - 2.6, -0.5, zf + 0.04], [xc + 2.6, -0.5, zf + 0.04], [xc + 2.6, 3.6, zf + 0.04], [xc - 2.6, 3.6, zf + 0.04], col.ink, M.PLAIN + 0.5);
        acc.quad([xc - 2.4, 1.6, zf + 0.07], [xc + 2.4, 1.6, zf + 0.07], [xc + 2.4, 3.6, zf + 0.07], [xc - 2.4, 3.6, zf + 0.07], col.verm, M.STRIPE);
        acc.push(xc, -0.5, zf + 0.14); acc.archPlate(5.4, 2.4, 1.3, 4.25, col.marble, { segs: 12 }); acc.pop();
        acc.push(xc, 8.2, zf); G.jharokha(acc, col, 4.6, 2.8, r1); acc.pop();
        acc.push(xc, 16.6, zf); G.jharokha(acc, col, 4.0, 2.5, r1); acc.pop();
        acc.box(xc, -0.5, zf + 1.4, 9.5, 1.3, 2.8, col.marbleB, M.PLAIN, { cap: col.marble }); for (const px of [-3.4, 3.2]) { acc.push(xc + px, 0.8, zf + 1.6, 0, 1.2); G.pot(acc, col, 1); acc.pop(); }
        acc.quad([sx * 22, -0.5, zf], [sx * 22, -0.5, zf - 10], [sx * 22, 22, zf - 10], [sx * 22, 22, zf], col.marble, M.WALL + 0.5);
        acc.push(sx * 17, 22.5, zf - 5); G.chhatri(acc, col, 2.0, 8, true); acc.pop();
        G.beam(acc, [sx * 8.5, 22.5, zf - 1], [sx * 8.5, 31, zf - 1], 0.08, col.gold, M.GOLD);
        // a pair of cypresses on a plinth outside each wing
        for (const dz of [1.5, 6.5]) { acc.push(sx * 25.6, -0.5, zf + dz); acc.ngon(8, 1.9, 1.7, 0, 1.6, col.marble, M.PLAIN, { capCol: mulc(col.mala, 0.9) }); acc.push(0, 1.6, 0, 0, 4.6); G.tree(acc, col, 1, true); acc.pop(); acc.pop(); }
      }
      acc.quad([-12.5, 14, zf], [12.5, 14, zf], [12.5, 22, zf], [-12.5, 22, zf], col.marble, M.WALL + 0.5);
      acc.box(0, 21.4, zf + 0.25, 44.4, 0.35, 0.5, col.marbleB); acc.box(0, 22, zf - 5, 44.8, 0.5, 10.6, col.marbleB, M.PLAIN, { cap: col.marble });
      acc.quad([-22, 22.5, zf + 0.05], [22, 22.5, zf + 0.05], [22, 24.2, zf + 0.05], [-22, 24.2, zf + 0.05], col.marble, M.KANG + 0.5);
      acc.push(0, 22.5, zf - 5); acc.ngon(8, 6.2, 6.0, 0, 3.2, col.marble, M.WALL, { cap: false }); acc.ngon(8, 7.0, 6.2, 3.0, 3.5, col.marbleB, M.PLAIN, { capCol: col.marble });
      acc.push(0, 3.5, 0, 0, 6.0); acc.lathe(G.DOME_PROF, 20, col.marble, M.DOME); acc.pop(); acc.push(0, 3.5 + 1.13 * 6.0, 0); G.finial(acc, col, 4.2); acc.pop(); acc.pop();
      garland(-12, -1, 20.4, 0.4, 1.6, r1.range(0, 6.28)); garland(1, 12, 20.4, 0.4, 1.6, r1.range(0, 6.28));
      if (teej) { garland(-21, -13.5, 13.2, 0.4, 1.2, 1); garland(13.5, 21, 13.2, 0.4, 1.2, 2); }
    });
    for (const sx of [-1, 1]) { poles.push([L3(-88 - sx * 8.5, 30.4, 651.45), 6.5, 1.8]); G.peacock(acc, cl, col, [-88 + sx * 12, 24.2, 650.2], 1.9, r1.range(0, 6.28)); }
    await Y();

    // ---------- the painted mirror: boxes the lake dabs as reflections (world x, y and z ranges, a flat colour) ----------
    {
      const rbox = (x0, x1, y0, y1, z0, z1, c) => hero.reflBox((z0 + z1) / 2 - 460, (y0 + y1) / 2, -(x0 + x1) / 2, (z1 - z0) / 2, (y1 - y0) / 2, (x1 - x0) / 2, c);
      rbox(6.5, 23, 0, 20, 148, 153, col.marble); rbox(-23, -6.5, 0, 20, 148, 153, col.marble); rbox(-6.5, 6.5, 11, 20, 148, 153, col.marble);
      for (const [kz, off] of [[185, 13], [262, 13], [274, -13], [338, -13]]) { const kx = pathX(kz) + off; rbox(kx - 3.3, kx + 3.3, 0, 10.4, kz - 3.3, kz + 3.3, col.marble); }
      rbox(ix - 24, ix + 24, 0, 12.5, 191, 239, mulc(col.mala, 0.92));
      rbox(-110, -100.5, 0, 22, 649, 660, col.marble); rbox(-75.5, -66, 0, 22, 649, 660, col.marble); rbox(-100.5, -75.5, 14, 22, 649, 660, col.marble);
      rbox(-100.5, -94.5, 0, 14, 649.5, 652, col.verm); rbox(-81.5, -75.5, 0, 14, 649.5, 652, col.verm);
      rbox(-66.5, -65.5, 0, 11, 573, 648, col.marble); rbox(-111.5, -110.5, 0, 11, 580, 648, col.marble);
      // the portal's own gold, laid on the court water as a path of strokes up to the arch
      rbox(-93.6, -82.4, 0, 13, 649.1, 649.5, mulc(col.gold, 0.9));
    }
    // ---------- pennants (laid along the hero's local +X; the shader swings them round their poles with the wind) ----------
    cl.pop();
    for (const [p, len, h] of poles) G.pennant(cl, p, len, h, r1.pick([col.verm, col.saffron, col.verm, col.mala]), r1.range(0, 6.28));
    await Y();

    // ---------- THE CLOSE PASS HAS ITS LIFE: boats under way on the open side, more people on the landing, the loggia and the pavilion's
    // doorsteps, peacocks on the plinth's lip that dance when the rain reaches them, lotus beds and lamps down the pass. Everything here is
    // dealt from streams of its own (made from the seed and a name, no parent) and laid after the last vertex above, so nothing above is
    // dealt anew.
    // WHAT RIDES THE FRONT, named. The world's strike key sets the front and the wind line 60 m ahead of it; these new things read them
    // at THEIR OWN pivots, through the hero's own shader branches, called by the lake's own builders, and read nothing of the eye or of
    // the share of the flight: the new pads flip as the wind line crosses them and bounce once the rain is on them, their blooms with
    // them (raft(), kind 9); the new frogs leap (raft(), kind 12); the dealt floating lamps and the dealt marigold rings bounce under
    // the rain (lamp() and mring(), kind 9); the new figures and the punts bounce (figure, kind 9); the two landing parasols tilt and
    // are drawn in (parasol, kind 10); the lamps in the new pier niches light by the hero's own lamp line; the plinth's peacocks fan
    // (kinds 16, 17, see the hero's vertex shader). The boats under way, the listed ones and the dealt ones alike, with all they
    // carry, ride the near-boat branch (kind 15), which reads the clock only, as the lake's own boats under way do. ----------
    {
      const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
      const rb = own('frp-r10-boats'), rf = own('frp-r10-folk'), rp = own('frp-r10-peacocks');
      const hullC = [col.verm, col.saffron, col.indigo, col.wood, col.marble], commas = (hl, hw) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x0 = sx * hl, z0 = sz * hw; cl.quad([x0, -0.1, z0], [x0 + sx * 1.3, -0.1, z0 + sz * 0.8], [x0 + sx * 1.4, -0.1, z0 + sz * 1.02], [x0, -0.1, z0 + sz * 0.28], col.pearl, M.PLAIN + 0.5); } };
      cl.push(-460, 0, 0, PI / 2);
      // the builders are the lake's own boats (the company boat, the flotilla's parasol boat, the flower boat, the cast-net punt), each with
      // its dice from the stream it is handed (rb for the listed boats, a dealt boat's own stream below); the first three row to and fro
      // along the line (cloth kind 15) and hand back their hull's length, the punt lies still
      const company = (x, z, r = rb) => {
        const ry = r.range(-0.25, 0.25), hc = r.pick(hullC), pc = r.pick([col.verm, col.saffron, col.marble, col.mala]);
        cl.push(x, 0.2, z, PI / 2 - 0.42 + ry * 0.2); cl.anim(15, 0, 0, 0, r.range(0, 6.28));
        boat(cl, col, 13, hc, null);
        for (const sx of [-2.6, 2.6]) for (const sz of [-1.15, 1.15]) G.beam(cl, [sx, 1.5, sz], [sx, 4.3, sz], 0.05, col.gold, M.GOLD);
        cl.quad([-3.1, 4.3, 1.5], [3.1, 4.3, 1.5], [3.1, 4.3, -1.5], [-3.1, 4.3, -1.5], pc, M.STRIPE + 0.5);
        for (const sz of [-1.5, 1.5]) cl.quad([-3.1, 3.85, sz], [3.1, 3.85, sz], [3.1, 4.3, sz], [-3.1, 4.3, sz], col.gold, M.GOLD);
        cl.box(0, 1.6, 0, 3.6, 0.45, 1.9, pc === col.verm ? col.saffron : col.verm, M.STRIPE, { cap: col.indigo });
        cl.push(4.4, 1.55, 0); parasol(cl, col, 0.9, pc === col.mala ? col.verm : col.mala); cl.pop();
        for (const [fx, fy, sc] of [[-0.9, 2.05, 1.1], [0.8, 2.05, 1.1], [-5.1, 1.56, 1.4]]) { cl.push(fx, fy, 0.1, PI / 2, sc); figure(cl, col, r.pick(clothCols), r.pick([col.marble, col.saffron, col.marble]), r.pick([col.verm, col.saffron, col.mala]), false); cl.pop(); }
        G.beam(cl, [-5.0, 3.6, 0.5], [-6.9, -0.5, 1.7], 0.05, col.wood);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 2; k++) { const x0 = sx * (6.2 + k * 1.5), z0 = sz * (1.2 + k * 0.9); cl.quad([x0, -0.12, z0], [x0 + sx * 1.5, -0.12, z0 + sz * 0.9], [x0 + sx * 1.6, -0.12, z0 + sz * 1.15], [x0, -0.12, z0 + sz * 0.3], col.pearl, M.PLAIN + 0.5); }
        cl.pop();
        return 13;
      };
      const parasolBoat = (x, z, lmax, r = rb) => {
        const bl = r.range(8, lmax), hc = r.pick(hullC), pc = r.pick([col.verm, col.saffron, col.mala, col.marble]), h = bl * 0.12;
        cl.push(x, 0.22, z, PI / 2 - 0.42 + r.range(-0.12, 0.12)); cl.anim(15, 0, 0, 0, r.range(0, 6.28));
        boat(cl, col, bl, hc, pc === hc ? col.mala : pc);
        cl.push(-bl * 0.12 + 0.75, h, 0.1, PI / 2, 1.2); figure(cl, col, r.pick(clothCols), r.pick([col.marble, col.saffron]), r.pick([col.verm, col.mala, col.saffron]), false); cl.pop();
        cl.push(bl * 0.33, h, 0, -PI / 2, 1.35); figure(cl, col, r.pick(clothCols), col.marble, r.pick([col.verm, col.saffron]), false); cl.pop();
        G.beam(cl, [bl * 0.33 - 0.2, h + 1.7, 0.45], [bl * 0.33 + 1.5, -0.5, 1.5], 0.05, col.wood);
        commas(bl * 0.5, 0.9);
        cl.pop();
        return bl;
      };
      const flowerBoat = (x, z, r = rb) => {
        cl.push(x, 0.22, z, PI / 2 - 0.36); cl.anim(15, 0, 0, 0, r.range(0, 6.28));
        boat(cl, col, 9.5, col.wood, null);
        cl.push(0.7, 1.2, 0); cl.lathe([[1.0, 0], [0.92, 0.5], [0.55, 0.95], [0.0, 1.1]], 10, col.saffron, M.BEAD); cl.pop();
        cl.push(-1.3, 1.2, 0); cl.lathe([[0.8, 0], [0.7, 0.35], [0.35, 0.65], [0.0, 0.75]], 8, col.pink, M.BEAD); cl.pop();
        cl.push(2.5, 1.2, 0); cl.lathe([[0.7, 0], [0.6, 0.3], [0.3, 0.55], [0.0, 0.62]], 8, col.saffron, M.BEAD); cl.pop();
        cl.push(-3.5, 1.28, 0, PI / 2, 1.35); figure(cl, col, r.pick(clothCols), col.marble, col.verm, false); cl.pop(); G.beam(cl, [-3.7, 2.9, 0.4], [-5.4, -0.5, 1.3], 0.05, col.wood);
        cl.push(3.7, 1.28, 0); parasol(cl, col, 0.85, col.verm); cl.pop();
        wake(9.5); under(9.5, col.saffron, col.pink, 1);
        cl.pop();
        return 9.5;
      };
      // A cast-net punt. The side its net falls to is the punt's OWN COIN, the first of its dice (below a half: the side that lies toward
      // our line here, else away); the fisherman faces his net, as the lake's do. It hands back where the net's middle lies in the world.
      const punt = (x, z, hc) => {
        const sd = rb() < 0.5 ? 1 : -1;
        cl.push(x, 0.22, z, PI / 2 - 0.42 + rb.range(-0.2, 0.2)); cl.anim(9, 0, 0, 0, rb.range(0, 6.28));
        const e = cl.world(1.9, 0, sd * 3.2), net = [-e[2], e[0] + 460];
        boat(cl, col, 7.5, hc, null);
        cl.push(1.6, 0.9, 0, sd > 0 ? 0 : PI, 1.4); figure(cl, col, rb.pick(clothCols), col.marble, col.verm, false); cl.pop();
        cl.push(-2.3, 0.5, 0, PI / 2, 1.15); figure(cl, col, rb.pick(clothCols), col.saffron, col.mala, false); cl.pop();
        for (let j = 0; j < 9; j++) { const a = (j / 9) * 6.2832, rx = 1.9 + Math.cos(a) * 1.9, rz = sd * 3.2 + Math.sin(a) * 1.9, tx = -Math.sin(a) * 0.04, tz = Math.cos(a) * 0.04;
          cl.quad([rx - tx, -0.1, rz - tz], [rx + tx, -0.1, rz + tz], [1.65 + tx * 0.6, 2.95, sd * 0.45 + tz * 0.6], [1.65 - tx * 0.6, 2.95, sd * 0.45 - tz * 0.6], col.pearl, M.DASH + 0.5); }
        ring(cl, 1.9, -0.1, sd * 3.2, 1.9, col.pearl, 0.07); ring(cl, 1.9, -0.1, sd * 3.2, 2.9, col.pearl, 0.05, 16); ring(cl, 0, -0.1, 0, 5.2, col.pearl, 0.06, 16);
        // the hull's painted under-strokes are the lake's own under(), on the side toward our line whichever way the net fell: that is
        // the lake's convention for the painted mirror (every boat's strokes lie toward the line), kept as it is; the flower boat's too
        under(7.5, hc, col.pearl, 1);
        cl.pop();
        return net;
      };
      // THE LIST (route z, metres off our line on the open side, kind). In every 40 m of the pass from z 380 to the water-gate one boat rests
      // 12 to 30 m off (a punt between two kiosks, or a parasol boat abeam a kiosk and behind it) and two more 30 to 80 m off; none within 8 m of
      // the line, none between the line and the palace, every hull 6 m and more clear of a kiosk's plinth and of the water-gate at every
      // phase of its track. A boat that stands on a blocker is dropped (the lake's own test). Each boat under way notes its home and its
      // hull's length (wayAt), each punt its middle and its net's (puntAt), for the things dealt down the pass after them.
      const onBlocker = (x, z) => blockers.some((b) => Math.hypot(x - b[0], z - b[1]) < b[2] + 6.5), puntAt = [], wayAt = [];
      const PASS = [[400, 29, 'fl9'], [414, 44, 'co'], [416, 70, 'fl'], [426, 17, 'pu'], [444, 40, 'fw'], [456, 76, 'fl'], [480, 29, 'fl9'], [484, 45, 'co'], [496, 72, 'fl'], [506, 18, 'pu'], [524, 41, 'fl'], [532, 62, 'co'], [544, 80, 'fl'], [548, 44, 'fl'], [552, 22, 'pu']];
      for (let i = 0; i < PASS.length; i++) {
        const [bz, off, kind] = PASS[i], x = pathX(bz) - off;
        await Y();
        if (onBlocker(x, bz)) continue;
        if (kind === 'co') wayAt.push([x, bz, company(x, bz)]); else if (kind === 'fw') wayAt.push([x, bz, flowerBoat(x, bz)]); else if (kind === 'pu') { const net = punt(x, bz, [col.marble, col.saffron, col.wood][i % 3]); puntAt.push([x, bz, net[0], net[1]]); } else wayAt.push([x, bz, parasolBoat(x, bz, kind === 'fl9' ? 9 : 10.5)]);
      }
      await Y();
      // PEOPLE ON THE STEPS THERE ARE (hero-local places along the face; a landing step s stands at y 3.0 - 0.7 s, z 80.3 + 0.6 s): two knots
      // under two more parasols and a woman with a pot on the landing, four more watchers on the loggia beside the others, three more on each
      // doorstep of the pavilion. Nobody stands on a pot: the hero hands over where its landing pots are, and a figure within 0.8 m of one on
      // its own step moves a metre along the step. None in a balcony, on the ledge, on a moored boat or on the swing. They face the water
      // as the landing's own figures do: that is the ghat's rule (a figure on a step or at a rail faces away from the wall behind it),
      // not the route's; nothing here reads where our line runs.
      const pots = hero.anchors.landingPots || [], onStep = (lx, st) => { for (const [px, ps] of pots) if (ps === st && Math.abs(px - lx) < 0.8) return lx + (lx >= px ? 1.0 : -1.0); return lx; };
      const person = (lx, y, lz, carry) => {
        const p = Wl(lx, y, lz); cl.push(p[0], p[1], p[2], -PI / 2 + rf.range(-0.5, 0.5), rf.range(1.45, 1.65)); cl.anim(9, 0, 0, 0, rf.range(0, 6.28));
        figure(cl, col, rf.pick(clothCols), carry ? rf.pick(clothCols) : rf.pick([col.marble, col.saffron, col.marble]), rf.pick([col.verm, col.saffron, col.mala]), carry); cl.pop();
      };
      for (const [lx, pc] of [[-7.6, col.verm], [7.2, col.indigo]]) { const p = Wl(lx, 2.3, 80.72); cl.push(p[0], p[1], p[2]); cl.anim(10, 0, 0, 0, rf.range(0, 6.28)); parasol(cl, col, 1.4, pc); cl.pop(); }
      for (const [lx, st, cr] of [[-8.4, 1, 0], [-6.9, 1, 0], [-7.6, 2, 0], [6.5, 1, 0], [8.0, 1, 0], [7.2, 2, 0], [2.9, 3, 1]]) person(onStep(lx, st), 3.0 - 0.7 * st, 80.3 + 0.6 * st, cr === 1);
      for (const [lx, lz] of [[-10.5, 79.5], [-8.0, 79.3], [-0.3, 79.5], [3.4, 79.4]]) person(lx, 9.9, lz, false);
      await Y();
      cl.push(-88, 0, 650, PI);
      for (const sx of [-1, 1]) for (const [fx, fz] of [[-0.8, 0.35], [1.2, 0.3], [4.1, 0.7]]) { cl.push(sx * 17.25 + fx, 0.8, fz, rf.range(-0.4, 0.4), 1.5); cl.anim(9, 0, 0, 0, rf.range(0, 6.28)); figure(cl, col, rf.pick(clothCols), rf.pick([col.marble, col.saffron, col.marble]), rf.pick([col.verm, col.saffron, col.mala]), false); cl.pop(); }
      cl.pop();
      cl.pop();
      await Y();
      // PEACOCKS THAT DANCE IN THE FIRST RAIN (hero-local frame from here): one on the plinth's lip under each lower balcony's place (the
      // 11 m module), facing the water, dropped where the ledge bush of a feather-panel bay stands within its fan's reach (2.9 m). The ledge
      // itself is 0.4 m wide and the wall is behind it, so the bird stands at the lip with 0.77 m of air behind its fan. Cloth kinds 17 (body)
      // and 16 (train): the bird fans, shivers and turns when the front has reached its own place (see the hero's vertex shader).
      for (const sg of [-1, 1]) for (let i = 0; i < 5; i++) {
        const lx = sg * (24.5 + 11 * i), s = rp.range(1.4, 1.5), ph = rp.range(0, 6.28); let bush = false;
        for (let k = 2; k < 25; k += 3) { const px = -74 + 6.17 * k, bx = px + 3.08; if (Math.abs(px) >= 15 && px + 6.17 <= 74.1 && Math.abs(bx) >= 16.5 && Math.abs(bx - lx) < 2.9) bush = true; }
        if (bush) continue;
        cl.anim(17, lx, 3.05, 79.9, ph); G.peacock(cl, cl, col, [lx, 3.05, 79.9], s, ph, 16);
      }
      await Y();
      // THE PASS'S WATER, AS FULL AS THE OPEN LAKE'S (world frame again): boats under way on the open side, lotus beds, floating lamps and
      // marigold rings, all by the lake's own builders, each kind from a stream of its own. NO PLACE IS TYPED: every deal is STATIONARY
      // along the pass (it has no first thing at a set place). The pass lies between two places of the world, named by what they are: the
      // foot of the first corner tower our line passes (the hero hands over its towers' feet) and the water-gate's sill (the hero's own
      // anchor, the middle of the gate's threshold). Each deal begins two longest gaps before the tower's foot, its first step is drawn
      // over a whole gap, and it draws EVERY die before any test, so a thing left out moves no other thing's dice.
      cl.push(-460, 0, 0, PI / 2);
      const KIOSKS = [400, 440, 480, 520], NB = G.NEAR_BOAT, SWING = NB.reach + NB.nod;
      const feet = hero.anchors.towerFeet.map((t) => Wl(t[0], t[1], t[2])).sort((a, b) => Math.abs(a[0] - pathX(a[2])) - Math.abs(b[0] - pathX(b[2])));
      const towerFoot = Math.min(feet[0][2], feet[1][2]), gateSill = Wl(...hero.anchors.waterGate.position)[2];
      // the line's x by the metre from a boat's reach before the pass to its end (the tests below ask it many thousand times)
      const LZ0 = Math.floor(towerFoot - 2 * SWING - 8), lineTab = [];
      for (let z = LZ0; z <= gateSill + 9; z++) lineTab.push(pathX(z));
      const lineX = (z) => { const f = clamp(z - LZ0, 0, lineTab.length - 1.001), i = Math.floor(f); return lerp(lineTab[i], lineTab[i + 1], f - i); };
      await Y();
      // WHERE A HULL GOES. A boat under way rides the hero's near-boat branch (cloth kind 15, the clock only): it rows SWING metres to and
      // fro along route z and NB.slant of that toward the open water (the numbers are the shader's own, handed over by the parts file).
      // Its hull is taken as three discs of its half width (0.12 of its length, boat()'s own beam) along its length, at every 1.25 m of
      // that track; a boat that lies still is the same three discs at home.
      const hullAt = (x0, z0, len, way) => {
        const hw = 0.12 * len, hl = len / 2 - hw, dn = Math.hypot(NB.slant, 1), D = [];
        for (let m = way ? -SWING : 0; m <= (way ? SWING : 0); m += 1.25) for (const t of [-hl, 0, hl]) D.push([x0 - NB.slant * (m + t / dn), z0 + m + t / dn, hw]);
        return { D, lo: D[0][1] - 5, hi: D[D.length - 1][1] + 5 };
      };
      const TRACKS = wayAt.map(([x, z, len]) => hullAt(x, z, len, true)), NEWWAY = [];
      const afloat = lampAt.concat(bloomAt).filter((q) => q[1] > LZ0 && q[1] < gateSill);
      // BOATS UNDER WAY ON THE OPEN SIDE, by round 10's builders above (the lake's own company boat, parasol boat and flower boat, with the
      // lake's comma wakes, and the flower boat's wake() and painted under-strokes as the lake's flower boat has them). The stream
      // frp-r10e-boats deals them: the gap to the next (WAY_LO to WAY_HI metres of route), then per boat its metres off the line on the
      // open side (11.5 to 27: the range of the lake's own boats beside us, the company boats 11.5, the flower boat 21, the musicians 22,
      // the royal barge 27), a die for its kind by thirds, and one die that forks the boat's own stream for its dress (heading, colours,
      // phase, figures). None on the palace side: there is no room beside the kiosks' mooring posts.
      // THE TEST, in route order, first come first laid, else LEFT OUT (no second place, no second side). The boat's home lies in the
      // pass, and at EVERY place of its track its hull (of the greatest length its kind takes) is
      //  - 6 m and more from our line (the lake's rule: everything solid keeps 6 m clear of the line), 6 m and more before the gate's sill;
      //  - on no blocker and in no lane of the lake (live's free(), asked at the hull's middle and at both its sides);
      //  - 2 m and more from a kiosk's plinth (radius 3.3);
      //  - 6.5 m and more from a punt's middle and 3.9 m from its net's middle;
      //  - 1.5 m and more from the hull of every boat under way of round 10 and of every boat laid before it, at any phase of both;
      //  - 0.8 m and more from every lamp afloat and every lotus bloom laid so far (the lake's builders note where they lay).
      const rw = own('frp-r10e-boats'), WAY_LO = 0.75, WAY_HI = 1.5, WDEAL = [];
      for (let z = towerFoot - 2 * WAY_HI + rw.range(0, WAY_HI); z <= gateSill; z += rw.range(WAY_LO, WAY_HI)) WDEAL.push([z, rw.range(11.5, 27), rw(), Math.floor(rw() * 1e9)]);
      const wayClear = (T) => {
        for (const [px, pz, hw] of T.D) {
          if (pz + hw > gateSill - 6 || lineX(pz) - px - hw < 6) return false;
          if (!free(px, pz) || !free(px - hw, pz) || !free(px + hw, pz)) return false;
          for (const kz of KIOSKS) if (Math.hypot(px + 108, pz - kz) < 3.3 + 2 + hw) return false;
          for (const [qx, qz, nx, nz] of puntAt) if (Math.hypot(px - qx, pz - qz) < 6.5 + hw || Math.hypot(px - nx, pz - nz) < 3.9 + hw) return false;
          for (const O of TRACKS) if (pz > O.lo && pz < O.hi) for (const q of O.D) if (Math.hypot(px - q[0], pz - q[1]) < hw + q[2] + 1.5) return false;
          for (const q of afloat) if (Math.hypot(px - q[0], pz - q[1]) < hw + 0.8) return false;
        }
        return true;
      };
      for (const [z0, off, kd, die] of WDEAL) {
        if (z0 < towerFoot) continue;
        const kind = kd < 1 / 3 ? 0 : kd < 2 / 3 ? 1 : 2, x0 = pathX(z0) - off, T = hullAt(x0, z0, [13, 10.5, 9.5][kind], true);
        if (wayClear(T)) {
          const r = ctx.core.makeRng(ctx.core.hashSeed('frp-r10e-boats-dress:' + die));
          if (kind === 0) company(x0, z0, r); else if (kind === 1) parasolBoat(x0, z0, 10.5, r); else flowerBoat(x0, z0, r);
          TRACKS.push(T); NEWWAY.push(T);
        }
        await Y();
      }
      // LOTUS BEDS, each one the open lake's own raft: live's lake law lays a raft of BED_N pads of radius BED_R, 3.5 to 11 m off the line
      // on either side, by raft() with its own every-fourth-pad bloom and its own pad size, and a dealt bed here is exactly that call.
      // The stream frp-r10b-lotus deals bed after bed: a coin for its side (+1 palace, -1 open), its metres off the line, one die that
      // forks the bed's own stream for its pads, and the gap to the next bed (GAP_LO to GAP_HI metres of route: the count of the open
      // lake's pads against the pass's sets it, see the round's notes). IN THE PASS are only the beds whose whole length lies inside it:
      // the centre at least the bed's own half length (2.2 radii, the builder's own shape) after the tower's foot and before the sill.
      // THE CLEAR RULE (per pad): nothing outside the pass, on a blocker or in a lane of the lake (free()), beyond the mooring
      // posts on the palace side, within 5 m of a kiosk's middle, within 6.5 m of a punt's middle or 3.9 m of its net's middle, or within
      // 1 m of the hull of a boat under way dealt above at any place of its track. WHERE OUR OWN OARS SWEEP THE LAKE'S RULE IS THE RULE,
      // and it is raft()'s own, as on the open lake: a pad within 5 m of the line lies flat (it neither flips nor bounces and slides
      // under the prow) and carries no bloom and no frog, and no bloom stands within 6.2 m of the line. A lamp or a marigold ring keeps
      // the clear rule and 3.5 m from the line besides (the lake's own lamps keep 3.4).
      const rl = own('frp-r10b-lotus'), BED_N = 14, BED_R = 3.6, GAP_LO = 4, GAP_HI = 7.5, DEAL = [];
      for (let z = towerFoot - 2 * GAP_HI + rl.range(0, GAP_HI); z <= gateSill; z += rl.range(GAP_LO, GAP_HI)) DEAL.push([z, rl() < 0.5 ? 1 : -1, rl.range(3.5, 11), Math.floor(rl() * 1e9)]);
      const PASSBEDS = DEAL.filter(([z]) => z - 2.2 * BED_R >= towerFoot && z + 2.2 * BED_R <= gateSill);
      const padClear = (x, z) => {
        if (z < towerFoot || z > gateSill || !free(x, z)) return false;
        if (x > lineX(z) && z < 543.5 && x > -85.3) return false;
        for (const kz of KIOSKS) if (Math.hypot(x + 108, z - kz) < 5) return false;
        for (const [px, pz, nx, nz] of puntAt) if (Math.hypot(x - px, z - pz) < 6.5 || Math.hypot(x - nx, z - nz) < 3.9) return false;
        for (const T of NEWWAY) if (z > T.lo && z < T.hi) for (const q of T.D) if (Math.hypot(x - q[0], z - q[1]) < q[2] + 1) return false;
        return true;
      };
      const lampClear = (x, z) => Math.abs(x - lineX(z)) >= 3.5 && padClear(x, z);
      // THE TESTS, in route order, on the pass's beds as dealt. A bed FAILS on a side when fewer than half of ITS WHOLE DEAL of pads pass
      // the clear rule there, whatever the graphics level and the visit's density: a dry run of raft() itself is asked for three times
      // the deal (raft() thins its ask by level and density, never under 0.35 of it, so the whole deal is always shown) and its clear
      // function counts the first BED_N pads it is shown, in the stream's order, and refuses every pad (nothing is laid; the dice come
      // from a fresh copy of the bed's own stream, so the pads are the same dice on either side and at every level, and no test moves a
      // die). Failing on its dealt side a bed is tried once on the other side with the same dice; failing there too it is LEFT OUT.
      // Nothing is moved along the route and nothing is added. The bed that is laid is thinned by raft() as the lake's own rafts are.
      const padsOf = (die) => ctx.core.makeRng(ctx.core.hashSeed('frp-r10b-lotus-pads:' + die)), PADS = [];
      for (const [bz, sd0, off, die] of PASSBEDS) {
        let side = 0;
        for (const sd of [sd0, -sd0]) {
          let ok = 0, all = 0;
          raft(pathX(bz) + sd * off, bz, 3 * BED_N, BED_R, (x, z) => { if (all < BED_N) { all++; if (padClear(x, z)) ok++; } return false; }, padsOf(die));
          if (ok * 2 >= all) { side = sd; break; }
        }
        if (side) raft(pathX(bz) + side * off, bz, BED_N, BED_R, (x, z) => { const k = padClear(x, z); if (k) PADS.push([x, z]); return k; }, padsOf(die));
        await Y();
      }
      // FLOATING LAMPS AND MARIGOLD RINGS, by the lake's own lamp() and mring(), a deal of their own from frp-r10b-lamps: group after
      // group, LAMP_LO to LAMP_HI metres of route apart; per group a coin for its side, then for three lamps a share of the metres off, a
      // share of the spread, size and phase, then a coin for a marigold ring (RING_CHANCE), its share of the metres off, its size (the
      // lake's 0.6 to 0.9) and phase. A group whose place lies in the pass sets afloat, on the palace side, two lamps 4 to 9 m off the
      // line within 4 m of its place; on the open side three, 4 to 12 m off within 2.5 m; and its ring, if the coin gave one, abeam its
      // place 4 to 10 m off (the lake's own range) on its side. A lamp or a ring that fails the clear rule, or has a laid pad of these
      // beds within 1.7 m, is left out.
      const rm = own('frp-r10b-lamps'), LAMP_LO = 18, LAMP_HI = 32, RING_CHANCE = 0.3, GROUPS = [];
      for (let z = towerFoot - 2 * LAMP_HI + rm.range(0, LAMP_HI); z <= gateSill; z += rm.range(LAMP_LO, LAMP_HI)) {
        const L = [z, rm() < 0.5 ? 1 : -1];
        for (let k = 0; k < 3; k++) L.push([rm(), rm.range(-1, 1), rm.range(1.3, 1.7), rm.range(0, 6.28)]);
        L.push([rm() < RING_CHANCE, rm(), rm.range(0.6, 0.9), rm.range(0, 6.28)]);
        GROUPS.push(L);
      }
      const offPads = (x, z) => !PADS.some((q) => Math.hypot(x - q[0], z - q[1]) < 1.7);
      for (const L of GROUPS) {
        const gz = L[0], sd = L[1], n = sd > 0 ? 2 : 3, omax = sd > 0 ? 9 : 12, dz = sd > 0 ? 4 : 2.5, [has, ro, gr, gph] = L[5];
        if (gz < towerFoot) continue;
        for (let k = 1; k <= n; k++) { const [uo, uz, s, ph] = L[k + 1], z = gz + dz * uz, x = pathX(z) + sd * (4 + (omax - 4) * uo); if (lampClear(x, z) && offPads(x, z)) lamp(x, z, s, ph); }
        const rx = pathX(gz) + sd * (4 + 6 * ro);
        if (has && lampClear(rx, gz) && offPads(rx, gz)) mring(rx, gz, gr, gph);
      }
      cl.pop();
    }
    await Y();

    // ---------- our vehicle: the royal barge, in ride space (eye at the origin looking down -Z, the lake at y = -2.56) ----------
    // Only the edges of the frame: the scalloped valance of the canopy along the top and the oars beating in the lower corners; the fanned
    // bow boards and the figurehead show low in the bottom centre on tall screens.
    // Three meshes, bow (bg), canopy (cg) and oars (og). On a wide screen the bow rides sunk out of the picture (the fan could only ever show cut
    // off by the bottom edge): the valance along the top and the oar blades beating in the lower corners are the barge. On a tall screen
    // update() shows the bow, drawn back, and lifts the canopy, so each keeps to its edge. Hull and oars stay on the water when the eye rises.
    const bg = G.makeAcc(true), cg = G.makeAcc(true), og = G.makeAcc(true); bg.anim(4, 0, 0, 0, 0); cg.anim(4, 0, 0, 0, 0); og.anim(4, 0, 0, 0, 0);
    {
      const fanCol = prow === 'peacock' ? col.mala : prow === 'elephant' ? col.verm : col.indigo, PV = [0, -2.28, -3.9];
      // the deck runs back past the eye (a tall screen looks down on it): fifteen planks in two wood tones, each one piece from
      // the stern to where the gunwale cuts it off, and one striped runner down the middle
      const zEnd = (x) => (Math.abs(x) <= 1.0 ? -3.95 : -2.4 - ((2.3 - Math.abs(x)) / 1.3) * 1.55), wood2 = mixc(col.wood, col.umber, 0.3);
      for (let i = 0; i < 15; i++) { const x0 = -2.3 + (4.6 * i) / 15, x1 = x0 + 4.6 / 15; bg.quad([x0, -2.14, 4.5], [x1, -2.14, 4.5], [x1, -2.14, zEnd(x1)], [x0, -2.14, zEnd(x0)], i % 2 ? col.wood : wood2, M.PLAIN); }
      bg.quad([-0.8, -2.12, 4.5], [0.8, -2.12, 4.5], [0.8, -2.12, -3.85], [-0.8, -2.12, -3.85], col.verm, M.STRIPE + 0.5);
      for (const sx of [-1, 1]) {
        G.beam(bg, [sx * 0.86, -2.11, 4.5], [sx * 0.86, -2.11, -3.8], 0.035, col.gold, M.GOLD);
        G.beam(bg, [sx * 2.3, -2.02, -2.4], [sx * 1.0, -2.02, -3.95], 0.07, col.gold, M.GOLD); G.beam(bg, [sx * 2.3, -2.02, 4.5], [sx * 2.3, -2.02, -2.4], 0.07, col.gold, M.GOLD);
        bg.quad([sx * 2.5, -2.62, -2.4], [sx * 1.15, -2.62, -4.05], [sx * 1.0, -2.02, -3.95], [sx * 2.3, -2.02, -2.4], col.verm, M.PLAIN); bg.quad([sx * 2.5, -2.62, 4.5], [sx * 2.5, -2.62, -2.4], [sx * 2.3, -2.02, -2.4], [sx * 2.3, -2.02, 4.5], col.verm, M.PLAIN);
        // the rowers' benches along each side: a cushion by every oar lock
        for (let i = 0; i < 5; i++) bg.box(sx * 1.72, -2.14, -1.8 + i * 1.4, 0.8, 0.14, 0.62, i % 2 ? col.saffron : col.mala, M.PLAIN, { cap: i % 2 ? col.saffron : col.mala });
      }
      // bow boards: a fan of thirteen boards round the figurehead's feet on an indigo ground with a gold rim
      const n = 13, fp = (a, r, y) => [PV[0] + Math.sin(a) * r, y, PV[2] - Math.cos(a) * r]; let prev = null;
      for (let i = 0; i <= n; i++) { const a = (-104 + (208 * i) / n) * PI / 180, p = fp(a, 2.15, -2.3); if (prev) { bg.quad([PV[0], -2.32, PV[2]], prev, p, p, mixc(col.indigo, col.ink, 0.5), M.PLAIN + 0.5); G.beam(bg, [prev[0], -2.22, prev[2]], [p[0], -2.22, p[2]], 0.05, col.gold, M.GOLD); } prev = p; }
      for (let i = 0; i < n; i++) {
        const a = (-96 + (192 * i) / (n - 1)) * PI / 180, len = 2.0 - 0.26 * Math.abs(Math.sin(a)), px = Math.cos(a), pz = Math.sin(a);
        // a board is one feather on the peacock; on the other prows three painted bands (alternating board to board, like scales) and a gold tip
        const cuts = prow === 'peacock' ? [0.12, 1] : [0.12, 0.42, 0.7, 0.88, 1];
        for (let k = 0; k < cuts.length - 1; k++) {
          const r0 = cuts[k] * len, r1 = cuts[k + 1] * len, w0 = lerp(0.07, 0.27, (cuts[k] - 0.12) / 0.88), w1 = lerp(0.07, 0.27, (cuts[k + 1] - 0.12) / 0.88), b = fp(a, r0, lerp(-2.26, -2.14, cuts[k])), t = fp(a, r1, lerp(-2.26, -2.14, cuts[k + 1]));
          const tip = prow !== 'peacock' && k === cuts.length - 2, c = prow === 'peacock' ? fanCol : tip ? col.gold : (i + k) % 2 ? col.saffron : fanCol;
          bg.quad([b[0] - px * w0, b[1], b[2] - pz * w0], [b[0] + px * w0, b[1], b[2] + pz * w0], [t[0] + px * w1, t[1], t[2] + pz * w1], [t[0] - px * w1, t[1], t[2] - pz * w1], c, prow === 'peacock' ? M.FEATHER : tip ? M.GOLD : M.PLAIN);
        }
      }
      await Y();
      // the figurehead is designed for the one view it ever gets: from behind and above
      if (prow === 'peacock') {
        bg.push(0, -0.08, 0.35);
        const nk = [[0, -2.2, -4.3], [0, -1.98, -4.5], [0, -1.86, -4.78], [0, -1.9, -5.02]];
        for (let i = 0; i < 3; i++) G.beam(bg, nk[i], nk[i + 1], 0.2 - i * 0.03, col.mala);
        bg.push(0, -2.06, -5.06); bg.lathe([[0.01, 0], [0.15, 0.05], [0.17, 0.14], [0.1, 0.25], [0.0, 0.28]], 6, col.mala, M.PLAIN, { squash: 1.35 }); bg.pop();
        G.beam(bg, [0, -1.93, -5.2], [0, -1.98, -5.46], 0.04, col.saffron);
        for (const cx of [-0.2, -0.1, 0, 0.1, 0.2]) { G.beam(bg, [0, -1.82, -5.04], [cx, -1.66, -5.0], 0.018, col.gold, M.GOLD); bg.push(cx, -1.68, -5.0); bg.lathe([[0.0, 0], [0.04, 0.03], [0.0, 0.07]], 4, col.gold, M.GOLD); bg.pop(); }
        bg.pop();
      } else if (prow === 'elephant') {
        // seen only from behind and above: a domed head with twin forehead bumps under a vermilion and gold caparison, two great
        // scalloped fan ears that flap, pearl tusks curving up and out, and the trunk raised in salute, up and over to one side into
        // a rolled tip that holds a lotus bud
        const gr = mixc(col.slate, col.marble, 0.5), earIn = mixc(gr, col.pink, 0.62), BIG = 1e4;
        bg.push(0, -2.46, -4.45, 0, 0.72); const lo = (p) => [p[0], p[1] > 0.3 ? 0.3 + (p[1] - 0.3) * 0.72 : p[1], p[2]];
        bg.lathe([[0.05, 0], [0.42, 0.08], [0.5, 0.26], [0.44, 0.44], [0.26, 0.56], [0.0, 0.6]], 10, gr, M.PLAIN, { squash: 1.15 });
        for (const sx of [-1, 1]) { bg.push(sx * 0.21, 0.42, -0.1); bg.lathe([[0.22, 0], [0.21, 0.1], [0.14, 0.19], [0.0, 0.23]], 7, gr, M.PLAIN); bg.pop(); }
        const cp = [[0.64, 0.1], [0.6, 0.4], [0.4, 0.6], [0.02, 0.67], [-0.3, 0.6]];
        for (let i = 0; i < 4; i++) {
          bg.quad([-0.2, cp[i][1], cp[i][0]], [0.2, cp[i][1], cp[i][0]], [0.2, cp[i + 1][1], cp[i + 1][0]], [-0.2, cp[i + 1][1], cp[i + 1][0]], col.verm, M.PLAIN + 0.5);
          for (const sx of [-1, 1]) G.beam(bg, [sx * 0.21, cp[i][1], cp[i][0]], [sx * 0.21, cp[i + 1][1], cp[i + 1][0]], 0.028, col.gold, M.GOLD);
        }
        bg.quad([-0.24, -0.02, 0.67], [0.24, -0.02, 0.67], [0.24, 0.1, 0.645], [-0.24, 0.1, 0.645], col.gold, M.GOLD);
        bg.push(0, 0.66, 0.02); bg.lathe([[0.17, 0], [0.19, 0.05], [0.08, 0.11], [0.0, 0.2]], 6, col.gold, M.GOLD); bg.pop();
        for (const sx of [-1, 1]) {
          const R = [sx * 0.38, 0.44, 0.04], o = [sx * 0.819, 0, 0.574], nr = [-0.574, 0, sx * 0.819], ns = 9, ri = 0.5, ro = 1.0;
          const pt = (a, r) => [R[0] + o[0] * Math.cos(a) * r, R[1] + Math.sin(a) * r, R[2] + o[2] * Math.cos(a) * r];
          // a rounded upper lobe, and a scalloped lower rim (every other spoke is drawn in)
          const ang = (j) => (50 - 17 * j) * PI / 180, kk = (j) => (j < 3 ? 1 - 0.32 * (ang(j) / 0.873) * (ang(j) / 0.873) : (1 + 0.22 * Math.sin(-ang(j))) * (j % 2 ? 0.86 : 1));
          bg.anim(4, R[0], R[1], R[2], sx > 0 ? 0.4 : 2.3);
          for (let i = 0; i < ns; i++) {
            const a0 = ang(i), a1 = ang(i + 1), p0 = pt(a0, ri), p1 = pt(a1, ri), q0 = pt(a0, ro * kk(i)), q1 = pt(a1, ro * kk(i + 1));
            bg.quad(R, p1, p0, p0, earIn, M.PLAIN + 0.5, { wt: [0, 0.2, 0.2, 0.2] });
            const i0 = bg.vert(p0[0], p0[1], p0[2], nr[0], nr[1], nr[2], gr, 500 + i, ro - ri, BIG, BIG, M.PLAIN, 0.2), i1 = bg.vert(p1[0], p1[1], p1[2], nr[0], nr[1], nr[2], gr, 501 + i, ro - ri, BIG, BIG, M.PLAIN, 0.2);
            const i2 = bg.vert(q1[0], q1[1], q1[2], nr[0], nr[1], nr[2], gr, 501 + i, 0, BIG, BIG, M.PLAIN, 0.5), i3 = bg.vert(q0[0], q0[1], q0[2], nr[0], nr[1], nr[2], gr, 500 + i, 0, BIG, BIG, M.PLAIN, 0.5);
            bg.tri(i0, i1, i2); bg.tri(i0, i2, i3);
          }
          bg.anim(4, 0, 0, 0, 0);
          const tu = [[sx * 0.28, 0.16, -0.5], [sx * 0.46, 0.16, -0.95], [sx * 0.6, 0.34, -1.3], [sx * 0.68, 0.62, -1.48], [sx * 0.7, 0.88, -1.5]].map(lo);
          for (let i = 0; i < 4; i++) G.beam(bg, tu[i], tu[i + 1], 0.075 - i * 0.012, col.pearl);
        }
        const tk = [[0, 0.3, -0.5], [0, 0.14, -0.88], [0.02, 0.12, -1.22], [0.1, 0.3, -1.48], [0.22, 0.58, -1.58], [0.34, 0.86, -1.5], [0.4, 1.04, -1.32], [0.32, 1.12, -1.14], [0.2, 1.02, -1.08]].map(lo);
        for (let i = 0; i < 8; i++) G.beam(bg, tk[i], tk[i + 1], 0.16 - i * 0.012, gr);
        for (const i of [4, 6]) G.beam(bg, [tk[i][0], tk[i][1] - 0.03, tk[i][2]], [tk[i][0], tk[i][1] + 0.03, tk[i][2]], 0.19 - i * 0.012, col.gold, M.GOLD);
        bg.push(0.2, 0.73, -1.08); bg.lathe([[0.0, 0], [0.1, 0.07], [0.12, 0.17], [0.06, 0.3], [0.0, 0.36]], 6, col.pink, M.PLAIN); bg.pop();
        bg.pop();
      } else {
        // makara: a malachite head, six scalloped gold plates across its ridge, flared saffron gill-fans, an upturned snout with a pearl in its jaws
        const gm = mulc(col.mala, 0.95);
        bg.push(0, -2.42, -4.5, 0, 0.85);
        bg.lathe([[0.02, 0], [0.32, 0.08], [0.4, 0.3], [0.3, 0.5], [0.06, 0.58]], 10, gm, M.PLAIN, { squash: 1.6 });
        for (let i = 0; i < 6; i++) {
          const z = 0.5 - i * 0.2, yb = 0.54 - 0.28 * z * z, h = 0.22 + 0.13 * Math.sin((PI * (i + 0.5)) / 6), w = 0.13 + 0.05 * Math.sin((PI * (i + 0.5)) / 6);
          bg.quad([-w, yb, z], [w, yb, z], [w * 0.8, yb + h * 0.55, z + 0.02], [-w * 0.8, yb + h * 0.55, z + 0.02], col.gold, M.GOLD + 0.5);
          bg.quad([-w * 0.8, yb + h * 0.55, z + 0.02], [w * 0.8, yb + h * 0.55, z + 0.02], [0, yb + h, z + 0.05], [0, yb + h, z + 0.05], col.gold, M.GOLD + 0.5);
        }
        for (const sx of [-1, 1]) {
          const R = [sx * 0.3, 0.26, 0.15], o = [sx * 0.94, 0, 0.34];
          bg.anim(4, R[0], R[1], R[2], sx > 0 ? 1.1 : 3.0);
          for (let i = 0; i < 5; i++) {
            const a = (18 + 21 * i) * PI / 180, sa = Math.sin(a), ca = Math.cos(a), L = 0.78 - 0.04 * i, d = [o[0] * sa, ca, o[2] * sa], pp2 = [o[0] * ca, -sa, o[2] * ca], wb = 0.035, wt = 0.14;
            const B = [R[0] + d[0] * 0.08, R[1] + d[1] * 0.08, R[2] + d[2] * 0.08 + i * 0.004], T = [R[0] + d[0] * L, R[1] + d[1] * L, R[2] + d[2] * L + i * 0.004];
            bg.quad([B[0] - pp2[0] * wb, B[1] - pp2[1] * wb, B[2] - pp2[2] * wb], [B[0] + pp2[0] * wb, B[1] + pp2[1] * wb, B[2] + pp2[2] * wb], [T[0] + pp2[0] * wt, T[1] + pp2[1] * wt, T[2] + pp2[2] * wt], [T[0] - pp2[0] * wt, T[1] - pp2[1] * wt, T[2] - pp2[2] * wt], col.saffron, M.FEATHER, { wt: [0, 0, 0.4, 0.4] });
          }
          bg.anim(4, 0, 0, 0, 0);
          bg.push(sx * 0.31, 0.42, -0.3); bg.lathe([[0.0, 0], [0.08, 0.05], [0.0, 0.11]], 5, col.gold, M.GOLD); bg.pop();
        }
        const sn = [[0, 0.3, -0.55], [0, 0.32, -0.95], [0, 0.48, -1.2], [0, 0.72, -1.28], [0, 0.9, -1.14]]; for (let i = 0; i < 4; i++) G.beam(bg, sn[i], sn[i + 1], 0.15 - i * 0.03, gm);
        G.beam(bg, [0, 0.2, -0.6], [0, 0.3, -1.0], 0.07, gm);
        bg.push(0, 0.6, -1.02); bg.lathe([[0.0, 0], [0.08, 0.03], [0.11, 0.11], [0.08, 0.19], [0.0, 0.22]], 6, col.pearl, M.PLAIN); bg.pop();
        bg.pop();
      }
      await Y();
      // canopy valance: crimson scallops with a gold band, tassels at the points, two poles (its own mesh)
      cg.anim(5, 0, 2.3, -3.3, 0.7);
      // on the red ground the canopy is saffron over a malachite lining, so the top of the frame is not one red mass
      const canC = lookId === 'golden' ? col.saffron : col.verm, canU = lookId === 'golden' ? col.mala : col.verm;
      cg.quad([-5.2, 1.74, -3.3], [5.2, 1.74, -3.3], [5.2, 2.4, -3.3], [-5.2, 2.4, -3.3], canC, M.SCALLOP + 0.5, { wt: [0.3, 0.3, 0, 0] });
      for (let i = 0; i < 13; i++) { const x = -5.2 + 0.4 + 0.8 * i; cg.anim(5, x, 1.74, -3.3, i * 1.3); cg.quad([x - 0.035, 1.56, -3.3], [x + 0.035, 1.56, -3.3], [x + 0.035, 1.77, -3.3], [x - 0.035, 1.77, -3.3], col.gold, M.GOLD, { wt: [1.1, 1.1, 0.3, 0.3] }); cg.quad([x - 0.08, 1.46, -3.3], [x + 0.08, 1.46, -3.3], [x + 0.06, 1.58, -3.3], [x - 0.06, 1.58, -3.3], canU, M.PLAIN + 0.5, { wt: [1.3, 1.3, 1.1, 1.1] }); }
      cg.anim(4, 0, 0, 0, 0);
      // the canopy's underside, from the valance back past the eye: above the scallops there is cloth, never sky
      cg.quad([-5.2, 2.4, -3.3], [5.2, 2.4, -3.3], [5.2, 2.4, 4.5], [-5.2, 2.4, 4.5], canU, M.STRIPE + 0.5);
      // oars: four a side, each about its lock; a comma splash where each of the two foremost goes in, and the bow wave
      for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) {
        // the two foremost reach forward, so their vermilion blades dip inside the frame's lower corners (and clear the plinth's posts)
        const lk = [sg * 2.25, -2.0, -2.5 + i * 1.4], d = i < 2 ? [sg * 2.1, -0.75, -3.4] : [sg * 3.0, -0.75, -2.6], ph = i * 0.22, at = (t) => [lk[0] + d[0] * t, lk[1] + d[1] * t, lk[2] + d[2] * t];
        og.anim(7, lk[0], lk[1], lk[2], ph);
        G.beam(og, at(-0.12), at(0.8), 0.05, col.brass);
        const a = at(0.76), b = at(1.0); og.quad([a[0], a[1], a[2] + 0.2], [b[0], b[1], b[2] + 0.2], [b[0], b[1], b[2] - 0.2], [a[0], a[1], a[2] - 0.2], col.verm, M.PLAIN);
        if (i < 2) {
          const c = Math.cos(0.5), s = Math.sin(0.5) * sg, ex = lk[0] + d[0] * c + d[2] * s, ez = lk[2] - d[0] * s + d[2] * c;
          og.anim(8, ex, -2.52, ez, ph);
          for (let k = 0; k < 3; k++) { const a0 = k * 0.9, a1 = a0 + 0.7, r0 = 0.5, r1 = 0.62 - k * 0.03; og.quad([ex + Math.cos(a0) * r0 * sg, -2.52, ez + Math.sin(a0) * r0], [ex + Math.cos(a1) * r0 * sg, -2.52, ez + Math.sin(a1) * r0], [ex + Math.cos(a1) * r1 * sg, -2.52, ez + Math.sin(a1) * r1], [ex + Math.cos(a0) * (r1 + 0.03) * sg, -2.52, ez + Math.sin(a0) * (r1 + 0.03)], col.pearl, M.PLAIN + 0.5); }
        }
      }
      for (const sg of [-1, 1]) for (let k = 0; k < 2; k++) {
        const ex = sg * (1.9 + k * 0.9), ez = -5.2 + k * 1.1; bg.anim(8, ex, -2.53, ez, 1.2 + k * 1.9 + (sg > 0 ? 0.6 : 0));
        bg.quad([ex, -2.53, ez], [ex + sg * 0.9, -2.53, ez + 0.5], [ex + sg * 0.95, -2.53, ez + 0.62], [ex, -2.53, ez + 0.14], col.pearl, M.PLAIN + 0.5);
      }
    }
    await Y();

    // ---------- birds: nine strings ahead of the front, pigeons (already seated), three strings along the palace in the rain ----------
    {
      const per = Math.round((cast === 'egret' ? 80 : cast === 'crane' ? 34 : 72) * Math.max(detail, 0.7)), size = cast === 'egret' ? 1.5 : cast === 'crane' ? 2.4 : 1.0, gap = cast === 'egret' ? 14 : cast === 'crane' ? 30 : 13;
      const leads = [0.03, 0.06, 0.3, 0.38, 0.47, 0.56, 0.66, 0.76, 0.88];
      for (let s = 0; s < 9; s++) {
        const hgt = s < 2 ? 31 + s * 7 : r3.range(50, 110), z0 = r3.range(-1000, 1000), sp = (s % 2 ? 1 : -1) * r3.range(12, 18), g2 = s < 2 ? 2200 / per : gap;
        for (let i = 0; i < per; i++) birds.push([0, leads[s], hgt, z0], [i * g2 + (cast === 'crane' && i % 2 ? -g2 * 0.7 : 0) + r3.range(-0.6, 0.6), r3.range(0, 6.28), size * r3.range(0.9, 1.1), sp]);
      }
      for (let s = 0; s < 3; s++) {
        const x0 = r3.range(-200, 200), hgt = [15, 24, 33][s] + r3.range(-2, 2), zz = [108, 128, 96][s], sp = r3.range(15, 19), nn = Math.round((cast === 'crane' ? 10 : 26) * Math.max(detail, 0.7));
        for (let i = 0; i < nn; i++) birds.push([2, x0, hgt, zz], [-i * gap * 0.6 + (cast === 'crane' && i % 2 ? -11 : 0), r3.range(0, 6.28), size * r3.range(0.9, 1.1), sp]);
      }
    }

    await Y();
    // ---------- the cloud elephants: nine, in the cloud's own indigo with a hairline in the cloud-edge colour, vermilion caparisons, gold goads
    // and ankle chains. Rare: the middle one is the WHITE ELEPHANT, pearl and larger, with gold tusks and a gold howdah under a parasol ----------
    let herd = null;
    {
      const el = G.makeAcc(true), ec = G.lin(look.cloud), ee = G.lin(look.edge);
      const BACK = [[-5.9, 5.6], [-5.5, 8.2], [-4.2, 9.9], [-1.4, 10.7], [1.6, 10.5], [3.9, 9.8]], BELLY = [4.6, 4.2, 4.0, 4.1, 4.3, 4.9];
      const HEAD = [[3.9, 9.8], [4.7, 11.0], [6.0, 11.3], [7.1, 10.6], [7.6, 9.0], [7.3, 7.0], [6.2, 5.6], [4.4, 5.2]];
      const EAR = [[4.5, 10.3], [3.3, 10.2], [2.5, 8.9], [2.8, 7.2], [3.9, 6.3], [4.9, 7.0]];
      const TRUNK = [[7.2, 7.4], [7.9, 5.6], [8.8, 4.5], [9.9, 4.4], [10.8, 5.2], [11.3, 6.4]];
      for (let e = 0; e < 9; e++) {
        const white = rare && e === 4, eh = white ? col.pearl : ec, eb = white ? mulc(col.pearl, 0.86) : mulc(ec, 0.82), earC = white ? mixc(col.pearl, col.pink, 0.4) : mixc(ec, col.marble, 0.14), le = white ? col.umber : ee;
        el.push(0, 0, (e - 4) * EGAP, -PI / 2, eScale(e)); el.anim(4, 0, 0, 0, 0);
        const q = (pts, c, z = 0, mat = M.PLAIN) => el.quad([pts[0][0], pts[0][1], z], [pts[1][0], pts[1][1], z], [pts[2][0], pts[2][1], z], [pts[3][0], pts[3][1], z], c, mat + 0.5);
        const ln = (a, b, z = 0.5, r = 0.12, c = le, mat = M.PLAIN) => G.beam(el, [a[0], a[1], z], [b[0], b[1], z], r, c, mat);
        // far legs, body under an arched back, tail
        for (const [lx, k] of [[-2.2, 1], [2.0, 2]]) { el.anim(9, lx, 4.6, 0, e * 2.1 + k * 1.57); q([[lx - 0.8, 0], [lx + 0.8, 0], [lx + 0.9, 4.8], [lx - 0.9, 4.8]], eb, -0.6); G.beam(el, [lx - 0.85, 0.7, -0.4], [lx + 0.85, 0.7, -0.4], 0.09, col.gold, M.GOLD); }
        el.anim(4, 0, 0, 0, 0);
        for (let i = 0; i < 5; i++) { q([[BACK[i][0], BELLY[i]], [BACK[i + 1][0], BELLY[i + 1]], BACK[i + 1], BACK[i]], eh); ln(BACK[i], BACK[i + 1]); ln([BACK[i][0], BELLY[i]], [BACK[i + 1][0], BELLY[i + 1]], 0.5, 0.08); }
        q([[-5.8, 8.4], [-5.5, 8.6], [-6.5, 5.0], [-6.8, 5.0]], eh); q([[-6.9, 5.0], [-6.4, 5.0], [-6.3, 4.3], [-7.0, 4.3]], le);
        // domed head, fan ear, tusk, the trunk reaching for the tail ahead
        for (let i = 1; i < 7; i++) q([[5.7, 8.3], HEAD[i], HEAD[i + 1], HEAD[i + 1]], eh, 0.2);
        q([[5.7, 8.3], HEAD[0], HEAD[1], HEAD[1]], eh, 0.2); q([[5.7, 8.3], HEAD[7], HEAD[0], HEAD[0]], eh, 0.2);
        for (let i = 0; i < 6; i++) ln(HEAD[i], HEAD[i + 1], 0.7);
        el.anim(9, 4.4, 9.6, 0, e * 1.3);
        for (let i = 0; i < 5; i++) q([[3.8, 8.4], EAR[i], EAR[i + 1], EAR[i + 1]], earC, 0.9); q([[3.8, 8.4], EAR[5], EAR[0], EAR[0]], earC, 0.9);
        for (let i = 0; i < 6; i++) ln(EAR[i], EAR[(i + 1) % 6], 1.3, 0.09);
        el.anim(9, 7.2, 7.4, 0, e * 1.7);
        for (let i = 0; i < 5; i++) { const w0 = 0.85 - i * 0.12, w1 = w0 - 0.12, d0 = [TRUNK[Math.min(i + 1, 5)][1] - TRUNK[Math.max(i - 1, 0)][1], TRUNK[Math.max(i - 1, 0)][0] - TRUNK[Math.min(i + 1, 5)][0]], d1 = [TRUNK[Math.min(i + 2, 5)][1] - TRUNK[i][1], TRUNK[i][0] - TRUNK[Math.min(i + 2, 5)][0]];
          const l0 = Math.hypot(d0[0], d0[1]) || 1, l1 = Math.hypot(d1[0], d1[1]) || 1, n0 = [d0[0] / l0 * w0, d0[1] / l0 * w0], n1 = [d1[0] / l1 * w1, d1[1] / l1 * w1], A = TRUNK[i], B = TRUNK[i + 1];
          q([[A[0] - n0[0], A[1] - n0[1]], [A[0] + n0[0], A[1] + n0[1]], [B[0] + n1[0], B[1] + n1[1]], [B[0] - n1[0], B[1] - n1[1]]], eh, 0.3);
          ln([A[0] + n0[0], A[1] + n0[1]], [B[0] + n1[0], B[1] + n1[1]], 0.8, 0.09); ln([A[0] - n0[0], A[1] - n0[1]], [B[0] - n1[0], B[1] - n1[1]], 0.8, 0.09); }
        el.anim(4, 0, 0, 0, 0); q([[6.5, 6.1], [6.9, 6.6], [8.6, 5.7], [8.5, 5.4]], white ? col.gold : col.pearl, 1.0, white ? M.GOLD : M.PLAIN); q([[6.25, 9.3], [6.65, 9.3], [6.65, 9.65], [6.25, 9.65]], white ? col.ink : ee, 1.0);
        // caparison with a gold border, the curl of the cloud on the haunch, the goad
        q([[-2.3, 6.0], [2.3, 6.0], [2.3, 10.2], [-2.3, 10.4]], col.verm, 0.7, M.STRIPE);
        for (const [a, b] of [[[-2.3, 6.0], [2.3, 6.0]], [[2.3, 6.0], [2.3, 10.2]], [[-2.3, 10.4], [-2.3, 6.0]]]) G.beam(el, [a[0], a[1], 1.2], [b[0], b[1], 1.2], 0.12, col.gold, M.GOLD);
        for (let i = 0; i < 9; i++) { const a0 = i * 0.9, a1 = a0 + 0.9, r0 = 0.25 + i * 0.12, r1 = r0 + 0.12; ln([-4.1 + Math.cos(a0) * r0, 7.3 + Math.sin(a0) * r0], [-4.1 + Math.cos(a1) * r1, 7.3 + Math.sin(a1) * r1], 0.6, 0.08); }
        G.beam(el, [5.0, 11.2, 0.6], [7.0, 13.6, 0.6], 0.1, col.gold, M.GOLD); G.beam(el, [7.0, 13.6, 0.6], [7.7, 12.9, 0.6], 0.1, col.gold, M.GOLD);
        if (white) {      // the gold howdah, its vermilion fringe, the parasol on a gold pole
          q([[-1.9, 10.5], [1.9, 10.35], [1.9, 11.7], [-1.9, 11.7]], col.gold, 0.9, M.GOLD); q([[-2.1, 10.2], [2.1, 10.05], [2.1, 10.5], [-2.1, 10.6]], col.verm, 1.0, M.STRIPE);
          G.beam(el, [0, 11.7, 0.9], [0, 13.5, 0.9], 0.09, col.gold, M.GOLD); q([[-2.9, 13.3], [2.9, 13.3], [0.35, 14.5], [-0.35, 14.5]], col.verm, 0.9); q([[-2.9, 13.05], [2.9, 13.05], [2.9, 13.35], [-2.9, 13.35]], col.gold, 1.0, M.GOLD);
        }
        // near legs with gold ankle chains
        for (const [lx, k] of [[-4.0, 0], [3.4, 3]]) { el.anim(9, lx, 4.6, 0, e * 2.1 + k * 1.57); q([[lx - 0.85, 0], [lx + 0.85, 0], [lx + 1.0, 5.2], [lx - 1.0, 5.2]], eh, 0.25); ln([lx - 0.85, 0], [lx - 1.0, 5.0], 0.6, 0.08); ln([lx + 0.85, 0], [lx + 1.0, 5.0], 0.6, 0.08); G.beam(el, [lx - 0.9, 0.7, 0.8], [lx + 0.9, 0.7, 0.8], 0.09, col.gold, M.GOLD); }
        el.pop();
        await Y();
      }
      await Y(); herd = new THREE.Mesh(await el.toGeometryAsync(Y), null); await Y();
    }
    // THE RIDGE: the page's saw-toothed hills, redrawn just in front of the herd and kept at its feet (it rides up and down with the herd, never
    // sideways), so the elephants walk behind a painted ridge for the whole flight and never float on the bare sky. Three rows, hero-local.
    let ridge = null;
    {
      const rg = G.makeAcc(false), rc = [mulc(col.mala, 0.92), mixc(col.mala, col.saffron, 0.45), mixc(col.indigo, col.marble, 0.55), mixc(col.verm, col.marble, 0.62), mixc(col.slate, col.saffron, 0.45), mixc(col.mala, col.marble, 0.4)];
      // The rows stand on an arc round the middle of our route (hero-local -80, 48), not on a flat plane: the crest then keeps the same height
      // above the horizon at every heading, so the skyline stays level as the gaze swings, and it closes the low side shores.
      const RCX = -80, RCZ = 48, RP = (rr, sl, y) => [RCX + rr * Math.cos(sl / rr) - HX, y, RCZ + rr * Math.sin(sl / rr)];
      for (let row = 2; row >= 0; row--) for (let z = -3900 + row * 90; z < 3900;) {
        const w = r5.range(250, 400), top = r5.range(-8, 44) + row * 22, az = z + w * r5.range(0.3, 0.7), rr = HX - 70 - RCX + row * 10, tp = RP(rr, az, top);
        rg.quad(RP(rr, z - 50, -560), RP(rr, z + w + 50, -560), tp, tp, rc[(r5.int(0, 5) + row) % 6], M.HILL + 0.5);
        z += w * r5.range(0.5, 0.72);
      }
      ridge = new THREE.Mesh(rg.toGeometry(), null);
    }

    // ---------- meshes: three static, one cloth, the barge, the birds (and the herd) ----------
    const solidMat = page.children[0].material, clothMat = page.children[1].material;
    const nearMesh = new THREE.Mesh(await acc.toGeometryAsync(Y), solidMat); page.add(nearMesh);
    const farMesh = new THREE.Mesh(await far.toGeometryAsync(Y), solidMat); farMesh.frustumCulled = false; page.add(farMesh);
    const lifeMesh = new THREE.Mesh(await cl.toGeometryAsync(Y), clothMat); lifeMesh.frustumCulled = false; page.add(lifeMesh);
    herd.material = clothMat; herd.frustumCulled = false; herd.position.set(HX, herdY(0), herdZ(0)); page.add(herd);
    ridge.material = solidMat; ridge.frustumCulled = false; ridge.position.set(HX, herdY(0), 0); page.add(ridge);
    // two peacocks that glide down off the parapet and out over the kiosks as the barge comes level, trailing their trains
    // (hero-local frame; one small mesh each, hidden until its moment, moved by u)
    const gliders = [], GL = [{ u0: uAtZ(384), a: [-18, 28.9, 78.4], b: [21.5, 3.2, 110] }, { u0: uAtZ(432), a: [20, 28.9, 78.4], b: [61.5, 3.2, 110] }];
    {
      const gp = G.makeAcc(false), pb = mixc(col.indigo, col.mala, 0.45);
      G.beam(gp, [-0.3, 0, 0], [0.75, 0.12, 0], 0.17, pb); G.beam(gp, [0.7, 0.12, 0], [1.2, 0.36, 0], 0.07, col.mala);
      gp.push(1.2, 0.3, 0); gp.lathe([[0.01, 0], [0.08, 0.05], [0.09, 0.12], [0.0, 0.2]], 5, col.mala, M.PLAIN); gp.pop();
      G.beam(gp, [1.26, 0.42, 0], [1.46, 0.4, 0], 0.02, col.saffron);
      for (const cz of [-0.07, 0, 0.07]) G.beam(gp, [1.2, 0.5, 0], [1.14, 0.72, cz], 0.014, col.gold, M.GOLD);
      for (const sz of [-1, 1]) {
        gp.quad([0.6, 0.1, sz * 0.15], [0.0, 0.1, sz * 0.15], [-0.15, 0.3, sz * 1.25], [0.45, 0.3, sz * 1.25], col.wood, M.PLAIN);
        gp.quad([0.45, 0.3, sz * 1.25], [-0.15, 0.3, sz * 1.25], [-0.3, 0.2, sz * 1.95], [0.1, 0.2, sz * 1.95], mixc(col.wood, col.umber, 0.4), M.PLAIN);
      }
      for (let i = 0; i < 7; i++) {
        const a = (-15 + 5 * i) * PI / 180, L = 3.1 - 0.25 * Math.abs(i - 3), dx = -Math.cos(a), dz = Math.sin(a), y0 = 0.06 + i * 0.012, y1 = -0.35 + i * 0.012, wb = 0.04, wt = 0.17;
        gp.quad([-0.25 + dz * wb, y0, dx * wb], [-0.25 - dz * wb, y0, -dx * wb], [-0.25 + dx * L - dz * wt, y1, dz * L - dx * wt], [-0.25 + dx * L + dz * wt, y1, dz * L + dx * wt], col.mala, M.FEATHER);
      }
      const gg = gp.toGeometry();
      for (const g of GL) { const m = new THREE.Mesh(gg, solidMat); m.position.set(0, -60, 0); m.scale.setScalar(0.01); m.frustumCulled = false; g.yaw = Math.atan2(-(g.b[2] - g.a[2]), g.b[0] - g.a[0]); page.add(m); gliders.push(m); }
    }
    const BU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uCamL: { value: new THREE.Vector3() }, uKey: { value: new THREE.Vector3(0, 1, 0) }, uWindX: { value: -20 }, uSide: { value: 1 }, uFrontX: { value: -1e5 }, uLampAll: { value: 0 } };
    const bargeMat = new THREE.ShaderMaterial({ uniforms: BU, vertexShader: G.GOUACHE_VERT, fragmentShader: G.GOUACHE_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide, defines: { CLOTH: 1 } });
    const barge = new THREE.Group(), bowMesh = new THREE.Mesh(await bg.toGeometryAsync(Y), bargeMat), canopyMesh = new THREE.Mesh(await cg.toGeometryAsync(Y), bargeMat);
    const oarMesh = new THREE.Mesh(await og.toGeometryAsync(Y), bargeMat);
    bowMesh.frustumCulled = false; canopyMesh.frustumCulled = false; oarMesh.frustumCulled = false; barge.add(bowMesh, canopyMesh, oarMesh); scene.add(barge);
    const A = [], B = []; for (let i = 0; i < birds.length; i += 2) { A.push(birds[i][0], birds[i][1], birds[i][2], birds[i][3]); B.push(birds[i + 1][0], birds[i + 1][1], birds[i + 1][2], birds[i + 1][3]); }
    const v3 = (c) => new THREE.Vector3(c[0], c[1], c[2]);
    const BIRDU = { uCamL: U.uCamL, uTime: U.uTime, uPx: U.uPx, uCool: U.uCool, uWash: U.uWash, uUmber: { value: v3(lookId === 'night' ? mixc(col.umber, col.ink, 0.5) : col.umber) }, uOut: { value: 0 }, uBirdPx: { value: 7 }, uBirdX: { value: 1400 }, uBurst: { value: 0 }, uLate: { value: 0 }, uGap: { value: cast === 'egret' ? 14 : cast === 'crane' ? 30 : 13 },
      uBody: { value: v3(cast === 'egret' ? col.pearl : cast === 'crane' ? mixc(col.slate, col.marble, 0.62) : lookId === 'night' ? col.pearl : col.dark) }, uBill: { value: v3(cast === 'crane' ? col.verm : col.saffron) }, uLeg: { value: v3(col.dark) },
      uWing: { value: v3(cast === 'egret' ? col.pearl : cast === 'crane' ? mixc(col.slate, col.dark, 0.5) : lookId === 'night' ? col.dark : col.pearl) }, uPigeon: { value: v3(mixc(col.slate, col.sky, 0.55)) } };
    const flock = new THREE.Mesh(birdGeometry({ A, B }), new THREE.ShaderMaterial({ uniforms: BIRDU, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide }));
    flock.frustumCulled = false; page.add(flock);
    const flockLine = new THREE.Mesh(flock.geometry, new THREE.ShaderMaterial({ uniforms: { ...BIRDU, uOut: { value: 1 } }, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide }));
    flockLine.frustumCulled = false; page.add(flockLine);
    await Y();

    // ---------- the timetable ----------
    // the front's distance ahead of the barge against progress to the hit: far up the page at first, then closing fast
    const DK = [[0, 2500], [0.22, 2100], [0.44, 1500], [0.67, 850], [0.84, 380], [1, 0]];
    const ahead = (k) => { for (let i = 1; i < DK.length; i++) if (k <= DK[i][0]) return lerp(DK[i - 1][1], DK[i][1], (k - DK[i - 1][0]) / (DK[i][0] - DK[i - 1][0])); return 0; };
    const keyW = new THREE.Vector3(hero.anchors.keyDir[0], hero.anchors.keyDir[1], hero.anchors.keyDir[2]).applyQuaternion(page.quaternion), qi = new THREE.Quaternion(), pp = new THREE.Vector3();
    const sstep = smoothstep, bolt0 = hero.boltMeshes[0] || [], boltY0 = herdY(uBolt), boltZ0 = herdZ(uBolt);
    U.uHerdGap.value = EGAP; U.uHerdRare.value = rare ? 1 : 0;
    // the plinth's rain-dancing peacocks raise their fans over one second of the front's travel past their own place
    U.uFrontRun.value = FRONT_RUN / duration;
    const update = (dt, time, camera, u) => {
      const preview = !!ctx.through, uu = clamp(u, 0, 1);
      let frontZ; const camX = path.pointAt(uu, pp).z - 460;      // the barge's place along the hero's local x
      if (uu < uHit) frontZ = camX + 460 + ahead(uu / uHit); else frontZ = zHit - (uu - uHit) * FRONT_RUN;
      // The rain-sky is placed by the angle of its leading edge above the horizon ahead. It stands at the herd's feet, just over the hills
      // (15 degrees), so the ground colour stays in the picture and the elephants walk it in silhouette; in the last moments before the rain
      // strikes it rolls shut over our heads (the pearl crosses the open band of sky between u 0.33 and 0.38) and stays shut behind us.
      const kc = Math.min(uu / uHit, 1), pk = clamp((kc - 0.7) / 0.3, 0, 1), phi = (15 + 110 * pk * pk * pk) * PI / 180, T = Math.abs(phi - PI / 2) < 1e-3 ? 1e3 : Math.tan(phi);
      let edgeX = camX + 397.4 / T;
      if (edgeX > 340 && T > 0.26) edgeX = (312.64 + T * camX) / (T - 0.2493);
      hero.setFront(frontZ - 460); hero.setCloud(edgeX);
      // the first snake starts at an elephant's goad as the rain-sky closes over (it rides with the herd); the second grows over the lotus court
      hero.setLightning((uu - (uHit - 0.075)) / 0.16, 0);
      hero.setLightning((uu - 0.84) / 0.15, 1);
      for (const m of bolt0) m.position.set(0, herdY(uu) - boltY0, herdZ(uu) - boltZ0);
      herd.position.set(HX, herdY(uu), herdZ(uu)); U.uHerd.value.set(HX, herdY(uu), herdZ(uu), ES); ridge.position.y = herdY(uu);
      // the rain eases as we come into the lotus court, so the portal is not hatched over
      U.uRainAmt.value = lerp(1, 0.4, sstep(0.84, 0.93, uu));
      // the rain thins the painted mirror by half; in the lotus court it is let back, so the pavilion and the portal's gold lie on the water
      U.uReflWet.value = lerp(0.5, 0.12, sstep(0.7, 0.8, uu));
      U.uLift.value = 0.2493 * soft(frontZ - 760, 80);
      // the rain hangs from the scroll: the wall is only as tall as the indigo's leading edge stands above it, so no stroke is ever
      // drawn on the bare ground colour
      U.uTop.value = phi < 1.2 ? clamp(Math.max(frontZ - camX - 460, 1) * Math.tan(phi - 0.01) + 2.6 - U.uLift.value, 30, 400) : 400;
      hero.update(dt, time, camera);
      // the smallest a far bird is drawn, in pixels, follows the picture's height, so the strings stay strings on a small buffer
      BIRDU.uBirdPx.value = clamp((2 * Math.tan(((camera.fov || 62) * PI) / 360)) / Math.max(U.uPx.value, 1e-6) / 154, 3, 7);
      // the barge rides with the eye and dips on the stroke; hidden while we are only seen through the last portal
      barge.visible = !preview;
      barge.position.setFromMatrixPosition(camera.matrixWorld); barge.quaternion.setFromRotationMatrix(camera.matrixWorld);
      // it slides in from behind the eye in the first moments after the crossing (prow from below, valance from above) and back out
      // at the exit. On a tall screen the bow is drawn back and the canopy lifted, so the vehicle keeps to the frame's edges there too.
      // Both ride a little outside the picture (bow lower, valance higher): the barge frames the page and does not fill it.
      const cy = time * 4.18879, bob = 0.035 * Math.sin(cy + 0.6), slide = 6 * (1 - sstep(0, 0.008, uu)) + 6 * sstep(0.985, 1, uu), tall = clamp((1.25 - (camera.aspect || 1.78)) / 0.7, 0, 1);
      // the hull and the oars keep to the water while the eye rises over the open lake; the bow shows on tall screens only (sunk 4 m otherwise)
      const drop = Math.max(0, barge.position.y - 2.75), bowOn = tall > 0.45 ? 1 : 0;
      bowMesh.position.set(0, bob - drop - 4 * (1 - bowOn), slide + 3.4 * tall * bowOn); canopyMesh.position.set(0, bob + 0.1 + 0.95 * tall, slide); oarMesh.position.set(0, bob - drop, slide);
      bowMesh.rotation.x = canopyMesh.rotation.x = oarMesh.rotation.x = 0.006 * Math.sin(cy + 0.2);
      qi.copy(barge.quaternion).invert(); BU.uKey.value.copy(keyW).applyQuaternion(qi);
      BU.uWindX.value = lerp(-20, 20, sstep(uHit - 0.03, uHit + 0.004, uu));
      BIRDU.uBirdX.value = frontZ - path.pointAt(uu, pp).z; BIRDU.uBurst.value = Math.max(0, (uu - 0.016) * duration); BIRDU.uLate.value = sstep(uHit - 0.02, uHit + 0.04, uu);
      for (let i = 0; i < 2; i++) {
        const g = GL[i], m = gliders[i], t = (uu - g.u0) / 0.09, on = t > 0 && t < 1 && !preview;
        if (!on) { m.position.set(0, -60, 0); m.scale.setScalar(0.01); }      // parked under the lake (always drawn, so nothing is uploaded mid-flight)
        else { const s = t * t * (3 - 2 * t); m.position.set(lerp(g.a[0], g.b[0], t), lerp(g.a[1], g.b[1], s) + 1.2 * Math.sin(t * 9), lerp(g.a[2], g.b[2], t)); m.rotation.set(0.1 * Math.sin(time * 2.3 + i), g.yaw, -0.25 * Math.sin(PI * t)); m.scale.setScalar(2.6 * sstep(0, 0.08, t) * (1 - sstep(0.93, 1, t)) + 0.001); }
      }
    };
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.4, 4400); path.pointAt(0, c0.position); c0.lookAt(0, 2.6, 170); c0.updateMatrixWorld(); update(0, 0, c0, 0); }

    const facePoi = new THREE.Vector3(), poiAt = (time, u) => { path.pointAt(clamp(u, 0, 1), facePoi); facePoi.x += 15; facePoi.y = 6.5; facePoi.z += 34; return facePoi; };
    return {
      scene, path, duration,
      // linger along the balconies and in the court, row hardest across the open lake
      pace: (u) => 0.8 + 0.34 * sstep(0.04, 0.3, u) - 0.36 * sstep(0.44, 0.56, u) + 0.2 * sstep(0.84, 0.93, u),
      title: look.title + (rare ? ': the White Elephant' : teej ? ' at Teej' : ''),
      ride: 'none', style: 'none',
      // nearThrough: seen through the last portal the page is drawn from 0.4 m, so the lake, rafts and garlands in front of the entry are in the opening
      camera: { fov: 62, near: 0.4, nearThrough: 0.4, far: 4400, lookAhead: 24, sway: 0.15, bank: 0 },
      // the island palace's near corner and frontispiece are held for the hit; then the gaze goes to the balconies
      // first the garden island on the right, then the island palace's near corner and frontispiece (held for the hit), then the balconies
      pois: [{ at: new THREE.Vector3(ix + 8, 8, 215), from: 0.08, to: 0.21, weight: 0.45, fade: 0.06 }, { at: new THREE.Vector3(-40, 16, 400), from: 0.27, to: 0.5, weight: 0.4, fade: 0.08 }, { at: poiAt, from: 0.49, to: 0.82, weight: 0.6, fade: 0.08 }],
      portal: { shape: 'arch', width: 12, height: 16.4, color: look.portal, glow: 1.1 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0.07, radius: 0.1, threshold: 1.15 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
