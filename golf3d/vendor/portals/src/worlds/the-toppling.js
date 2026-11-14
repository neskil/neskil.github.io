// THE TOPPLING
// A floor-level chase beside the breaking wave of a domino run through a sunlit house in Montevideo built 25 times
// life size. The camera rides a glass marble on a child's track of stair rods, cotton reels and yardsticks: under
// the dining table, past the sleeper on the rug, up an open atlas and a yardstick ramp laid on a stepladder in the
// double doors. There the track ends: the marble leaps, and flies the whole length of the patio hall, 80 m up, over a
// fan of ivory tiles that opens into a picture beneath it; it swings wide to the left, comes down past the bird's (or
// the flower's) standing neck into a brass shoehorn. The line climbs a winding stair of big books to a ledger tower;
// our rails leave it, swing out to the left and above on three garden canes, and come back on to the ledger
// three-quarter on. Up the end wall stand thousands more tiles on shelves against a dark board; a wave runs out
// through them from the middle and paints a sunburst of fourteen broad rays, a shaft of sun from the last roof light
// falls across it, and under it a round-headed gateway of dominoes holds the portal.
//
// World space == the hero's space (src/parts/the-toppling.js): travel is -Z, station s = 480 - z, floor y = 0,
// windows on +X. Room one (kit 'room' shell, 120 x 360 x 100 m) spans z 480..120, the hall (180 x 540 x 120 m,
// five tall windows, five roof lights, doors, pier glasses, palms; a house, a palm and washing outside) z 110..-430.
// Each room has its own kit light rig; the tiles read the same sun through the same window shapes. Everything is
// made in build(); update() only moves, shows and dims.
//
// Beats (u is path progress; the path is 963 m long, so on the floor u is close to station / 963):
//   0.00-0.07  level along the dining-room floor, a sun shape across the line, the line running to a point between
//              the table legs
//   0.013      the first tile goes (four are leaning already as we arrive); the crest then keeps 8 m ahead of the eye
//   0.07-0.14  under the table (its boards, bearers and corner blocks overhead, the cane of the seats): turned legs,
//              chair legs, leaning rays of sun with gold motes in them; 0.05-0.12 the gaze turns right round to the
//              crest, side on and a few metres off, the window wall behind it; 0.111 six spoons are set swinging
//   0.14-0.21  the eye swings 11 m to the left on the bare floor: the crest runs side on against the windows
//   0.20-0.28  the wool rug; the sleeper in the third window's sun on the left, closest at 0.26-0.27 (flank, ear,
//              tail, whiskers); RARE: it lies on a pouffe level with the atlas; at 0.220-0.237 it wakes, at
//              0.245-0.279 bats a tile (the parrot beats its wings) and from 0.260 a second wave races ours on the
//              left all the way to the gateway
//   0.28-0.38  up the atlas and the ramp, the painted double doors and the hall ahead; windmill 0.30, metronome 0.34, toy
//              lorry 0.36; the lip at 0.384 (our marble sinks out of the picture there and is back by 0.76)
//   0.38-0.81  THE LEAP: no track, slow from 0.41 to 0.66, 80 m up at 0.55; the marble's own shadow runs ahead over the
//              floor; the cobalt (or amber) marble runs to the far point, the fan opens toward us 0.43-0.57
//              (the kingfisher is an anamorphosis: it stands upright as seen from 0.52), sparrows cross; from 0.51
//              the eye swings 40 m to the left and comes round on the standing neck (0.79)
//   0.56-0.66  the picture lies finished: the gaze lifts along it to the standing stem and the end wall
//   0.48-0.87  the wall's first wave: a sunburst spreads out from behind the gateway over the whole end wall (first rays
//              by 0.61, half the wall by 0.70, the rim at 0.87); 0.86-0.955 a second wave opens an eye at the end of
//              every ray and a rank of smaller ones round the gateway (0.94: it passes overhead; all open by 0.96)
//   0.81       landing in the shoehorn; 0.83-0.93 the rails swing 40 m out to the left and 7.5 m above the book
//              stair (seen from outside its curve, the tiles climbing it), the gateway three-quarter on
//   0.93-0.97  back over the ledger (tooled leather, a label, a silk marker); 0.97-1.00 straight at the gateway,
//              which shivers (0.93-0.99); the marble runs through
// Looks by seed: clear spring morning / peacock, midsummer siesta behind louvres / sunflower, grey July overcast /
// koi, low gold evening / kingfisher; the sleeper is a cinnamon dog, a green parrot on a chair rail or a tabby
// kitten; the hall marble cobalt or amber.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import { buildHero } from '../parts/the-toppling.js';

const SC = 25, ZA = 480, ZD = 120, ZB = 110, LA = 360, LB = 540, XA = 60, XB = 90, HA = 100, HB = 120;
const PAL = ['#E9DFC6', '#C8923F', '#5E7FB4', '#F6F1E4', '#137E8C', '#1E3F9A', '#D9A62B'];
const TAU = Math.PI * 2;
const hexMix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const sf = INT.surf, SU = INT.SURF;
// A kit material with GLSL of our own added (the kit's light rig stays in charge of the light): `pars` goes in front of
// main(), `albedo` runs right after the kit's pattern code (it may change diffuseColor, iGloss, iH, iMat, iEmis, or
// discard), `swap` is a list of exact-string replacements in the generated fragment shader.
const patchMat = (mat, key, o) => {
  const obc = mat.onBeforeCompile, ck = mat.customProgramCacheKey;
  mat.customProgramCacheKey = () => ck.call(mat) + ':' + key;
  mat.onBeforeCompile = (sh, r) => {
    obc.call(mat, sh, r);
    if (o.uniforms) Object.assign(sh.uniforms, o.uniforms);
    let f = sh.fragmentShader;
    if (o.pars) f = f.replace('#include <clipping_planes_pars_fragment>', '#include <clipping_planes_pars_fragment>\n' + o.pars);
    if (o.albedo) f = f.replace('#include <alphamap_fragment>', o.albedo + '\n#include <alphamap_fragment>');
    for (const [a, b] of o.swap || []) f = f.split(a).join(b);
    sh.fragmentShader = f;
  };
  return mat;
};
const S_WOOD = sf(SU.WOOD, 0.42), S_WOODG = sf(SU.WOOD, 0.42, 0, 0.1), S_WOODM = sf(SU.WOOD, 0.16), S_BRASS = sf(SU.PLAIN, 0.8, 1), S_IRON = sf(SU.PLAIN, 0.4, 0.7);
const S_CLOTH = sf(SU.FABRIC, 0.05), S_PAPER = sf(SU.PLAIN, 0.06), S_MATTE = sf(SU.PLAIN, 0.1), S_GLOSS = sf(SU.PLAIN, 0.75);
const S_STONE = sf(SU.STONE, 0.3), S_FUR = sf(SU.PLAIN, 0.03), S_LEAF = sf(SU.PLAIN, 0.35, 0, 0, 0.5), S_CER = sf(SU.PLAIN, 0.9);

// ---- small geometry helpers (plain position + normal geometries for INT.makeBuilder) ----
// box with chamfered edges whose normals blend across the chamfer: reads as a rounded solid in 44 triangles
function cbox(w, h, d, r = 0.1) {
  const hh = [w / 2, h / 2, d / 2]; r = Math.min(r, hh[0] * 0.9, hh[1] * 0.9, hh[2] * 0.9);
  const P = [], N = [], I = [];
  const id = (ax, s, sj, sk) => ax * 8 + (s > 0 ? 4 : 0) + (sj > 0 ? 2 : 0) + (sk > 0 ? 1 : 0);
  for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) for (const sj of [-1, 1]) for (const sk of [-1, 1]) {
    const j = (ax + 1) % 3, k = (ax + 2) % 3, p = [0, 0, 0], nn = [0, 0, 0];
    p[ax] = s * hh[ax]; p[j] = sj * (hh[j] - r); p[k] = sk * (hh[k] - r); nn[ax] = s;
    const o = id(ax, s, sj, sk) * 3; P[o] = p[0]; P[o + 1] = p[1]; P[o + 2] = p[2]; N[o] = nn[0]; N[o + 1] = nn[1]; N[o + 2] = nn[2];
  }
  const tri = (a, b, c) => {
    const ax = P[b * 3] - P[a * 3], ay = P[b * 3 + 1] - P[a * 3 + 1], az = P[b * 3 + 2] - P[a * 3 + 2], bx = P[c * 3] - P[a * 3], by = P[c * 3 + 1] - P[a * 3 + 1], bz = P[c * 3 + 2] - P[a * 3 + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const cx = P[a * 3] + P[b * 3] + P[c * 3], cy = P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1], cz = P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2];
    if (nx * cx + ny * cy + nz * cz >= 0) I.push(a, b, c); else I.push(a, c, b);
  };
  const quad = (a, b, c, e) => { tri(a, b, c); tri(a, c, e); };
  for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) quad(id(ax, s, -1, -1), id(ax, s, 1, -1), id(ax, s, 1, 1), id(ax, s, -1, 1));
  for (let ax = 0; ax < 3; ax++) { const j = (ax + 1) % 3; for (const s of [-1, 1]) for (const sj of [-1, 1]) quad(id(ax, s, sj, -1), id(ax, s, sj, 1), id(j, sj, 1, s), id(j, sj, -1, s)); }
  for (const s0 of [-1, 1]) for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) tri(id(0, s0, s1, s2), id(1, s1, s2, s0), id(2, s2, s0, s1));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
  return g;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 10, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const sph = (r, a = 12, b = 8) => new THREE.SphereGeometry(r, a, b);
const lathe = (prof, seg = 12) => new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(Math.max(p[0], 0.001), p[1])), seg);
const tube = (pts, r, n = 12, rad = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), n, r, rad, false);
// a smooth blob: sphere stretched to (sx, sy, sz); normals are fixed by the builder's normal matrix
const blob = (r, seg = 14) => new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7)));
// cotton reel (two flanges, a waist of coloured thread), origin at its foot
function reel(b, x, y, z, h, r, thread, wood) {
  b.add(lathe([[0.001, 0], [r, 0], [r, h * 0.12], [r * 0.6, h * 0.2], [r * 0.6, h * 0.8], [r, h * 0.88], [r, h], [0.001, h]], 10), { p: [x, y, z], c: wood, surf: S_WOOD,
    tint: (X, Y, Z, k) => { const v = (Y - y) / h; if (v > 0.16 && v < 0.84) k.set(thread).multiplyScalar(0.8 + 0.2 * Math.sin(Y * 40)); } });
}

// ---- the four looks ----
const el = (deg, az) => { const e = deg * Math.PI / 180, a = az * Math.PI / 180; return [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)]; };
const LOOKS = {
  // clear spring morning: sun in the north-east at 38 degrees, white shapes on honey parquet, blue shadow between
  spring: { fillK: 1.0, design: 'peacock', sunDir: [0.58, 0.616, 0.533], sunHex: '#fff1dc', sunI: 13, ambient: 1.32, ambSky: '#9fb9ea', ambGround: '#c7a476', skyI: 5.2,
    zenith: '#6c9fdc', horizon: '#d8e6f2', cloud: '#ffffff', outGround: '#d9cdb4', fog: '#a9bcd8', fogD: 0.00135, exposure: 1.0, tint: '#f6f8ff', shadowTint: '#141f3c',
    mull: [2, 5], bar: 0.024, frame: '#f1ede2', frost: 0.04, shaft: 0.46, dapple: 0.38, wallA: '#b3c1d8', wallB: '#d2dbe9', wallWarm: 0.1, floorGloss: 0.62, curtain: '#e9e2cf',
    heroSun: [1.0, 0.94, 0.82, 1.55], heroSky: [0.52, 0.63, 0.9, 0.86], heroBounce: 0.55, shadowCol: [0.4, 0.5, 0.78], shadowK: 0.85, slats: null, paneGain: 0.34, sat: 1.1, paintN: 0.3, paintS: 1.08 },
  // midsummer siesta: louvred shutters closed to, the sun shapes cut into bars, a warm dim room
  siesta: { fillK: 0.9, warmK: 0.7, wallWarm: 0.06, design: 'sunflower', sunDir: el(40, 52), sunHex: '#fff3dc', sunI: 15, ambient: 1.0, ambSky: '#a6b8de', ambGround: '#c09a70', skyI: 3.4,
    zenith: '#3f86d8', horizon: '#dfeaf4', cloud: '#ffffff', outGround: '#e2d2a8', fog: '#9aaec8', fogD: 0.0014, exposure: 1.1, tint: '#f6f8ff', shadowTint: '#0e2238',
    mull: [2, 15], bar: 0.1, frame: '#2f5a3c', frost: 0.02, shaft: 0.36, dapple: 0.2, wallA: '#b4c3c2', wallB: '#d0dcd9', floorGloss: 0.7, curtain: '#e6e4d8',
    heroSun: [1.0, 0.94, 0.82, 1.5], heroSky: [0.5, 0.62, 0.92, 0.74], heroBounce: 0.34, shadowCol: [0.3, 0.42, 0.7], shadowK: 0.85, slats: [6.667, 0.6], paneGain: 0.42, sat: 1.16, paintN: 0.3, paintS: 1.05 },
  // grey July morning: a veiled sun that comes and goes with the cloud, pearl light from the roof lights, a waxed floor
  overcast: { fillK: 1.25, design: 'koi', sunDir: [0.58, 0.616, 0.533], sunHex: '#f6f3ec', sunI: 4.2, ambient: 2.3, ambSky: '#c3ccd6', ambGround: '#b8a48c', skyI: 7.5,
    zenith: '#aab4be', horizon: '#dfe3e6', cloud: '#f4f5f6', outGround: '#aeb0aa', fog: '#b4bcc6', fogD: 0.0015, exposure: 1.04, tint: '#f1f5fa', shadowTint: '#1c222c',
    mull: [2, 5], bar: 0.024, frame: '#eeeae0', frost: 0.12, shaft: 0.3, dapple: 0.62, wallA: '#d3d2c6', wallB: '#e2e1d6', floorGloss: 0.92, curtain: '#e4e4dc',
    heroSun: [1, 0.98, 0.94, 0.5], heroSky: [0.72, 0.78, 0.86, 0.86], heroBounce: 0.36, shadowCol: [0.6, 0.64, 0.72], shadowK: 0.4, slats: null, paneGain: 0.3, sat: 1.14, paintN: 0, paintS: 1.1 },
  // low gold evening: the sun at 15 degrees, shadows three times the tiles' height, gold shapes high on the far wall
  evening: { fillK: 0.85, design: 'kingfisher', sunDir: el(15, 50), sunHex: '#ffb45e', sunI: 15, ambient: 1.25, ambSky: '#8d96c8', ambGround: '#c48a58', skyI: 3.6,
    zenith: '#5b78c4', horizon: '#ffd09a', cloud: '#ffc890', outGround: '#c89a6a', fog: '#c49a82', fogD: 0.0014, exposure: 1.04, tint: '#fff2e2', shadowTint: '#1d1838',
    mull: [2, 5], bar: 0.024, frame: '#f0e6d2', frost: 0.05, shaft: 0.3, dapple: 0.3, wallA: '#d6c4a4', wallB: '#e4d4b6', floorGloss: 0.66, curtain: '#ecdcc0',
    heroSun: [1.0, 0.72, 0.4, 1.7], heroSky: [0.56, 0.58, 0.86, 0.8], heroBounce: 0.5, shadowCol: [0.42, 0.4, 0.72], shadowK: 0.8, slats: null, paneGain: 0.36, sat: 1.14, paintN: 0.85, paintS: 1.3 },
};

export default {
  id: 'the-toppling',
  name: 'The Toppling',
  category: 'domestic',
  weirdness: 0.1,
  media: ['tiny', 'interior', 'rail'],
  async build(ctx) {
    await ctx.yield();
    const xr = makeRng('the-toppling:' + ctx.seed);      // for what was added late, so that nothing laid out earlier moves
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const col = (h) => new THREE.Color(h);

    // ---- which visit is this ----
    const pick = rng.fork('look')();
    let lookName = pick < 0.16 ? 'overcast' : pick < 0.3 ? 'evening' : pick < 0.5 ? 'siesta' : pick < 0.64 ? 'evening' : pick < 0.72 ? 'overcast' : 'spring';
    if (vary.hour === 'golden') lookName = 'evening'; else if (vary.hour === 'night') lookName = 'overcast';
    else if (vary.hour === 'dawn') lookName = 'spring'; else if (vary.hour === 'day' && (lookName === 'evening' || lookName === 'overcast')) lookName = pick < 0.5 ? 'spring' : 'siesta';
    const look = LOOKS[lookName], rare = !!vary.rare;
    const vr = rng.fork('pet');
    const petPick = vr(), sleeper = petPick < 0.6 ? 'dog' : petPick < 0.8 ? 'parrot' : 'kitten', amber = vr() < 0.3;
    const sunDir = new THREE.Vector3().fromArray(look.sunDir).normalize(), sunny = look.sunI > 0;
    scene.fog = new THREE.FogExp2(look.fog, look.fogD);
    scene.background = col(look.fog).multiplyScalar(0.55);

    // ---- window layout shared by the rigs and the tiles ----
    const WIN_A = { w: 36, h: 84, sill: 3 }, BAYS_A = 5, WIN_B = { w: 52, h: 100, sill: 3 }, HALL_BAYS = 5;
    const HALL_WZ = []; for (let k = 0; k < HALL_BAYS; k++) HALL_WZ.push(ZB - (k + 0.5) * LB / HALL_BAYS);
    const ROOF = { x: 56, w: 60, d: 66, z: [70, -40, -150, -260] };
    const ROOF_E = { x: 46, w: 40, d: 66, z: -370 };      // a fifth, narrower roof light over the tower: its sun falls across the picture on the end wall
    const DOOR_W = 52, DOOR_H = 86;      // the double doorway between the rooms: wide and tall, so that the hall is seen large through it
    const heroWins = [], heroRoofs = [];
    for (let k = 0; k < BAYS_A; k++) heroWins.push({ x: XA, y: WIN_A.sill + WIN_A.h / 2, z: ZA - (k + 0.5) * LA / BAYS_A, w: WIN_A.w, h: WIN_A.h });
    for (const z of HALL_WZ) heroWins.push({ x: XB, y: WIN_B.sill + WIN_B.h / 2, z, w: WIN_B.w, h: WIN_B.h });
    for (const z of ROOF.z) heroRoofs.push({ x: ROOF.x, z, w: ROOF.w, d: ROOF.d });
    heroRoofs.push(ROOF_E);
    // one more window stands in the wall behind our entry (never seen): its sun shape lies across the line in the first second
    const WIN_E = { x: XA, y: WIN_A.sill + WIN_A.h / 2, z: ZA + LA / BAYS_A / 2, w: WIN_A.w, h: WIN_A.h };
    heroWins.push(WIN_E);

    // ---- the hero: the line, the fan, the neck, the arch, the hall marble ----
    const LINE0 = 13, RS = rare ? 22 : 0;      // the line's first tile; on the rare visit the sleeper lies 22 m further on
    const APEX_S = 700;     // station of the fan's apex; the fan lies from s 470 (rim) to here
    const FAN_R = 230;      // rim radius: the fan runs wall to wall (clipped 10 m short of the side walls)
    const DECK = 6.5;       // height of the bridge deck (the line's foot) between the atlas and the doorway
    // THE EYE. 2.5 m over the floor, up the atlas to 9 m, then up a ramp of yardsticks that climbs over a chair back and a
    // stepladder standing before the doorway to a lip at 30 m, right in the door. There the marble LEAPS: a slow ballistic arc right over the fan
    // (53 m at its top), so that while the picture opens and lies finished nothing at all stands between the eye and the
    // floor. It comes down over the bird's head into a shoehorn on a pile of books and runs on up the stair of books.
    const RAMP_S = 290, LIP = 362, LIP_Y = 27, LAND = 734, LAND_Y = 23, LAND_M = -0.16, SCOOP = 22, TOP_S = 822, TOWER = 31, END_Y = TOWER + 7.5;
    const FIN = { x: 40, x0: 744, x1: 786, x2: 800, x3: 852, lift: 7.5, l0: 742, l1: 786, l2: 812, l3: 852 };
    const soft = (x, k) => k * Math.log(1 + Math.exp(x / k));
    const RAMP_M = (LIP_Y - 9) / soft(LIP - RAMP_S, 6);
    // THE FLIGHT, by station: up from the lip to 80 m under the roof lights, where the whole floor lies below as one
    // picture; then down in a long swing to the left, low across the far side of the picture, and back to the axis
    // into the shoehorn. A Hermite curve through these knots, leaving the lip at the ramp's slope.
    const FLY = [[LIP, LIP_Y], [400, 46], [440, 68], [472, 79], [505, 80], [540, 70], [580, 51], [620, 37], [660, 31], [700, 27.5], [LAND, LAND_Y]];
    const FLY_M = FLY.map((k, i) => (i === 0 ? RAMP_M : i === FLY.length - 1 ? LAND_M : (FLY[i + 1][1] - FLY[i - 1][1]) / (FLY[i + 1][0] - FLY[i - 1][0])));
    const flyY = (s) => {
      let i = 0; while (i < FLY.length - 2 && s > FLY[i + 1][0]) i++;
      const s0 = FLY[i][0], y0 = FLY[i][1], s1 = FLY[i + 1][0], y1 = FLY[i + 1][1], h = s1 - s0, t = clamp((s - s0) / h, 0, 1), t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * FLY_M[i] + (3 * t2 - 2 * t3) * y1 + (t3 - t2) * h * FLY_M[i + 1];
    };
    const CLIMB_M = (END_Y - LAND_Y - LAND_M * SCOOP / 2) / (SCOOP / 2 + (TOP_S - LAND) - SCOOP - 15);
    // the path the LINE is laid beside: straight down the house, winding only with the stair of books
    const eyeBase = (s) => {
      let y = 2.5;
      if (s > 235) y = 2.5 + 6.5 * smoothstep(235, 275, s);
      if (s > 270) y += RAMP_M * soft(Math.min(s, LIP) - RAMP_S, 6);
      if (s > LIP) y = flyY(Math.min(s, LAND));
      if (s > LAND) {       // the scoop turns the fall into the climb of the book stair, which eases out level at the tower
        const d = s - LAND, q = Math.min(d, SCOOP); y = LAND_Y + LAND_M * q + (CLIMB_M - LAND_M) * q * q / (2 * SCOOP);
        if (d > SCOOP) y += CLIMB_M * (d - SCOOP);
        const e0 = TOP_S - 30 - LAND; if (d > e0) { const t = Math.min(d - e0, 30); y -= CLIMB_M * t * t / 60; if (d > e0 + 30) y -= CLIMB_M * (d - e0 - 30); }
      }
      let x = 0; if (s > LAND + 6 && s < TOP_S - 4) { const k = Math.sin(Math.PI * (s - LAND - 6) / (TOP_S - LAND - 10)); x = -22 * k * k; }
      return [x, y, ZA - s];
    };
    // THE EYE leaves the line twice: a wide swing to the left on the bare floor past the table (the crest is then seen
    // side on, with the windows behind it), and the long swing of the flight over the picture
    const eyeFn = (s) => {
      const e = eyeBase(s);
      e[0] += -11 * smoothstep(133, 153, s) * (1 - smoothstep(161, 202, s)) - 40 * smoothstep(468, 560, s) * (1 - smoothstep(612, 728, s));
      // THE FINALE: out of the shoehorn the rails leave the stair of books. They swing 40 m out to the left on tall piers
      // of books and 7 m higher, so that the stair is seen from outside its curve and a little above, and they come
      // round on the gateway three-quarter on, from the left and above, straightening for the last 28 m only.
      if (s > LAND) { e[0] = -FIN.x * smoothstep(FIN.x0, FIN.x1, s) * (1 - smoothstep(FIN.x2, FIN.x3, s)); e[1] += FIN.lift * smoothstep(FIN.l0, FIN.l1, s) * (1 - smoothstep(FIN.l2, FIN.l3, s)); }
      return e;
    };
    // OUR LINE cannot fly: it keeps to the deck through the doorway, steps down to the floor, runs up the bare aisle of the fan
    // beside the hall marble's chute (the bird's spine), goes round the neck and climbs the stair of books to the top of the
    // ledger tower, where it runs on to the foot of the arch while our track rides over it on trestles
    const eyeY = (s) => eyeBase(s)[1];
    const LINE_TOP = TOWER + 0.3, END_DROP = END_Y - LINE_TOP;      // on the stair the line's foot sinks from 2.5 to 5.2 m under the eye, on the tower to 7.2 m
    const LINE0_Y = eyeY(LAND + 14) - 2.5;
    const lineY = (s) => {
      if (s < 235) return 0;
      if (s <= LIP - 12) return Math.max(0, Math.min(eyeY(s) - 2.5, DECK));
      if (s < LAND + 14) return Math.max(DECK * (1 - smoothstep(LIP - 12, LIP + 22, s)), LINE0_Y * smoothstep(APEX_S + 6, LAND + 14, s));
      return eyeY(s) - 2.5 - 2.7 * smoothstep(LAND + 14, LAND + 52, s) - (END_DROP - 5.2) * smoothstep(TOP_S - 36, TOP_S - 2, s);
    };
    const lineOffset = (s) => 4 - (ctx.vary.rare ? 3.4 : 4.0) * smoothstep(LIP + 16, LIP + 60, s) * (1 - smoothstep(APEX_S - 22, APEX_S - 8, s)) + 2.9 * smoothstep(APEX_S - 22, APEX_S - 8, s) * (1 - smoothstep(LAND + 24, LAND + 44, s)) + 7.6 * smoothstep(826, 868, s);
    const hero = await buildHero({ ...ctx, rng: rng.fork('hero') }, {
      eye: eyeFn, lineEye: eyeBase, lineY, lineOffset,
      arch: { inner: 10.6, outer: 15.2, spring: 9.6, courses: 24 }, archAt: [0, TOWER, ZA - 879],
      wall: { z: ZB - LB, cy: TOWER + 10, r0: 21.5, r1: 74, yMin: 28.6, hole: 5, rays: 14, pitch: 2.16 },
      palette: PAL, design: look.design, rare, windows: heroWins, roofs: heroRoofs, roofY: HB, splitZ: (ZD + ZB) / 2, slats: look.slats,
      chuteX: 0, apexZ: ZA - APEX_S, rim: FAN_R, phi: 1.05, aisle: 1.0, notch: 7.5, clipX: 80, strikeR: 9, neckAt: [0, 0, ZA - APEX_S - 2],
      neckTiers: [[0, 9], [0.3, 6], [0.9, 4], [1.7, 3], [2.4, 2], [2.7, 2], [2.3, 2], [1.5, 2], [0.6, 3]], lineStart: LINE0, secondFrom: 237.5 + RS, marbleColor: amber ? '#d98a1c' : PAL[5], sunDir: look.sunDir,
      arcs: [{ r: 46, n: 3 }, { r: 76, n: 7 }, { r: 104, n: 10 }],
      branches: [
        { from: [5.4, 0, ZA - 106], to: [9.4, 0, ZA - 106], trig: 107 },
        { from: [5.4, DECK, ZA - 279], to: [9.6, DECK, ZA - 279], trig: 280 },
        { from: [5.4, DECK, ZA - 309], to: [9.6, DECK, ZA - 309], trig: 310 },
        { from: [5.4, DECK, ZA - 328], to: [8.6, DECK, ZA - 328], trig: 329 },
      ],
    });
    scene.add(hero.object);
    const A = hero.anchors;
    hero.setLight({
      sunDir: look.sunDir, sunColor: new THREE.Color(look.heroSun[0], look.heroSun[1], look.heroSun[2]).multiplyScalar(look.heroSun[3]),
      skyColor: new THREE.Color(look.heroSky[0], look.heroSky[1], look.heroSky[2]).multiplyScalar(look.heroSky[3] * 1.4),
      bounceColor: col(PAL[1]).multiplyScalar(look.heroBounce), shadowColor: new THREE.Color(look.shadowCol[0], look.shadowCol[1], look.shadowCol[2]),
      shadowStrength: look.shadowK, sunAmount: sunny ? 1 : 0, paintNeutral: look.paintN, paintSat: look.paintS,
    });
    await ctx.yield();

    // ---- the path: the hero's eye stations, every 10 m ----
    const pts = []; for (let s = 0; s <= 880; s += 10) pts.push(A.station(s));
    const path = makePath(pts);
    const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3();
    const stationOf = (u) => ZA - path.pointAt(clamp(u, 0, 1), tmpP).z;
    const baseY = (s) => A.line.base(s, tmpP).y;
    // station -> u, for pois and pace (the flight makes the path longer than the house)
    const U_TAB = []; for (let i = 0; i <= 256; i++) U_TAB.push(stationOf(i / 256));
    const uOf = (s) => { let lo = 0, hi = 256; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (U_TAB[m] < s) lo = m; else hi = m; } const a = U_TAB[lo], b = U_TAB[hi]; return (lo + (b > a ? clamp((s - a) / (b - a), 0, 1) : 0)) / 256; };
    await ctx.yield();

    // ---- light rigs and the two shells ----
    const mkRig = (ambK, ownPanes) => {
      const rig = INT.makeLightRig({ scale: SC, sunDir: look.sunDir, sunColor: look.sunHex, sunIntensity: look.sunI, ambient: look.ambient * ambK, ambientSky: look.ambSky, ambientGround: look.ambGround,
        bounceColor: hexMix(PAL[1], '#a8742c', 0.5), bounce: 4.2, aoRadius: 1.3, aoStrength: 1.0, dapple: look.dapple > 0 ? { amount: look.dapple, size: 1.8, speed: 1.4 } : 0 });
      const add0 = rig.addWindowRow;      // wall windows take this look's glazing bars (the siesta's louvres are thick bars)
      rig.addWindowRow = (r) => {
        const wall = Math.abs(r.normal.y ?? r.normal[1] ?? 0) < 0.5, row = add0(wall ? { ...r, mullions: look.mull, bar: look.bar * SC } : r);
        if (row && wall && ownPanes) row.noPane = true;
        return row;
      };
      return rig;
    };
    const rigA = mkRig(1.4, false), rigB = mkRig(1.3, true);
    await ctx.yield();
    // a rig lives in its room's own space (z = world z minus the room's z): helpers that take world positions
    const occA = (p, r) => rigA.addOccluder([p[0], p[1], p[2] - ZA], r), occB = (p, r) => rigB.addOccluder([p[0], p[1], p[2] - ZB], r);      // the hall is far wider for its glass: lift its fill so the walls stay cream
    const roofRow = rigB.addWindowRow({ origin: [ROOF.x, HB, ROOF.z[0] - ZB], axis: [0, 0, -1], up: [1, 0, 0], normal: [0, -1, 0], width: ROOF.d, height: ROOF.w, spacing: ROOF.z[0] - ROOF.z[1], count: ROOF.z.length,
      mullions: [5, 4], bar: 0.9, sky: look.zenith, skyIntensity: look.skyI * 1.5 });
    if (roofRow) { roofRow.depth = 5; roofRow.noShaft = true; roofRow.noCurtain = true; roofRow.paneGain = look.paneGain * 1.5; }
    const roofEnd = rigB.addWindowRow({ origin: [ROOF_E.x, HB, ROOF_E.z - ZB], axis: [0, 0, -1], up: [1, 0, 0], normal: [0, -1, 0], width: ROOF_E.d, height: ROOF_E.w, spacing: 110, count: 1,
      mullions: [5, 3], bar: 0.9, sky: look.zenith, skyIntensity: look.skyI * 1.5 });
    if (roofEnd) { roofEnd.depth = 5; roofEnd.noCurtain = true; roofEnd.paneGain = look.paneGain * 1.5; roofEnd.shaftGain = look.endShaft ?? 1.05; }      // this one keeps its beam: the shaft across the sunburst
    await ctx.yield();
    const wlOpts = { shaftGain: look.shaft, shaftDensity: 0.3, motes: false, frost: look.frost, scroll: 0.08, paneGain: look.paneGain, glare: 0.5, frameColor: look.frame,
      outdoor: { zenith: look.zenith, horizon: look.horizon, ground: look.outGround, cloud: look.cloud }, motesPerWindow: Math.round(120 * detail * dens), maxMotes: Math.round(900 * detail), moteSize: 0.0045, moteGain: 0.9 };
    const floorPal = { floorA: PAL[1], floorB: '#b07a30', floorC: '#8a5a22', floorD: '#5a3814' };
    const roomA = INT.makeRoom({ rng: rng.fork('roomA'), style: 'room', scale: SC, rig: rigA, width: 2 * XA / SC, length: LA / SC, bays: BAYS_A, height: HA / SC, thickness: 0.2,
      floor: 'parquet', floorGloss: look.floorGloss, wall: 'wallpaper', wainscot: 0.95, ceiling: { type: 'beams' }, entry: 'open', sun: { side: 1 }, light: { sky: look.skyI },
      windows: { w: WIN_A.w / SC, h: WIN_A.h / SC, sill: WIN_A.sill / SC, arch: 0, sides: 1 }, exit: { w: DOOR_W / SC, h: DOOR_H / SC, arch: 0 }, skyColor: look.zenith,
      palette: { ...floorPal, wallA: look.wallA, wallB: look.wallB, wainscot: '#ece4d0', trim: '#efe8d6', ceiling: '#e9e2d0', beam: '#6a4426', frame: look.frame, reveal: '#ddd4c0' },
      windowLight: wlOpts, chunks: 5 });
    roomA.object.position.z = ZA; scene.add(roomA.object);
    { const r = rigA.addWindowRow({ origin: [XA, WIN_E.y, WIN_E.z - ZA], axis: [0, 0, -1], normal: [-1, 0, 0], up: [0, 1, 0], width: WIN_A.w, height: WIN_A.h, spacing: LA / BAYS_A, count: 1, sky: look.zenith, skyIntensity: look.skyI });
      if (r) { r.noCurtain = true; r.noPane = true; r.noShaft = true; } }
    await ctx.yield();
    const roomB = INT.makeRoom({ rng: rng.fork('roomB'), style: 'room', scale: SC, rig: rigB, width: 2 * XB / SC, length: LB / SC, bays: HALL_BAYS, height: HB / SC, thickness: 0.2,
      floor: 'parquet', floorGloss: look.floorGloss, wall: 'wallpaper', wainscot: 1.1, ceiling: { type: 'glass' }, entry: { w: DOOR_W / SC, h: DOOR_H / SC, arch: 0 }, sun: { side: 1 }, light: { sky: look.skyI },
      windows: { w: WIN_B.w / SC, h: WIN_B.h / SC, sill: WIN_B.sill / SC, arch: 0, sides: 1 }, exit: { w: 30 / SC, h: 62 / SC, arch: 0 }, skyColor: look.zenith,
      wallPatternScale: 2.2, palette: { ...floorPal, wallA: hexMix(look.wallA, '#b7a37c', look.wallWarm ?? 0.3), wallB: hexMix(look.wallB, '#cdbb96', look.wallWarm ?? 0.3), wainscot: '#ddd4be', trim: '#ece5d2', ceiling: '#e6dfcc', frame: look.frame, reveal: '#d6cdb8' },
      windowLight: { ...wlOpts, shaftGain: look.shaft * (lookName === 'evening' ? 0.3 : 0.7), shaftDensity: 0.16 }, chunks: 5 });     // the hall's beams are three times as long: thinner air
    roomB.object.position.z = ZB; scene.add(roomB.object);
    await ctx.yield();
    // The kit's beams of sun are an even veil with edges a third of the window wide: nothing in the picture says "shaft".
    // Here the beam is cut into leaning rays (the sun comes through the leaves outside, as the dappled shapes on the
    // floor show), its edges are firm, and the first metres in front of the eye are left clear so that passing through a
    // beam does not wash the picture out.
    for (const room of [roomA, roomB]) room.object.traverse((o) => {
      if (!o.isMesh || !o.parent || o.parent.name !== 'interior-shafts') return;
      let f = o.material.fragmentShader;
      f = f.split('float s0=max(sIn,0.);').join('float s0=max(sIn,4.);');
      f = f.split('smoothstep(0.,.35,min(e.x,e.y))').join('smoothstep(0.,.07,min(e.x,e.y))');
      f = f.split('(.25+.75*edge)').join('(.04+.96*edge)');
      f = f.split('float streak=.55+.9*i_n2(vec2(mid.x/uHs.x*2.5+vK*7.3,mid.y/uHs.y*3.5));').join('float sN=i_n2(vec2(mid.x/uHs.x*7.+vK*7.3,mid.y/uHs.y*11.)), sM=i_n2(vec2(mid.x/uHs.x*23.+vK*3.1,mid.y/uHs.y*37.)); float streak=.1+2.7*sN*sN*(.35+.65*sN)*(.6+.8*sM);');
      if (room === roomB) {
        f = f.split('mid.x/uHs.x*7.+vK*7.3,mid.y/uHs.y*11.').join('mid.x/uHs.x*10.+vK*7.3,mid.y/uHs.y*15.');
        f = f.split('gl_FragColor=vec4(col,1.);').join('col*=mix(.3,1.,smoothstep(10.,150.,s0)); col/=1.+1.5*max(col.r,max(col.g,col.b)); gl_FragColor=vec4(col,1.);');
      }
      o.material.fragmentShader = f;
    });
    // seen through the last world's doorway the eye stands well behind our entry: the parquet runs on back under it
    { const fe = INT.makeBuilder(); fe.add(new THREE.PlaneGeometry(2 * XA, 160, 6, 8).rotateX(-Math.PI / 2), { p: [0, 0, 80] }); roomA.object.add(new THREE.Mesh(fe.build(), roomA.materials.floor)); }
    // the kentia palm by the first hall window throws the shade of its fronds on the sunlit parquet, and the shade stirs
    const PALM = { x: 70, z: 56, h: 30 };
    const frondU = { uFrond: { value: new THREE.Vector4(PALM.x - PALM.h * sunDir.x / sunDir.y, PALM.z - PALM.h * sunDir.z / sunDir.y - ZB, 19, sunny ? 0.92 : 0) }, uFrondT: { value: 0 } };
    patchMat(roomB.materials.floor, 'frond', {
      uniforms: frondU,
      pars: /* glsl */`uniform vec4 uFrond; uniform float uFrondT;
        float tf_frond(vec3 P) {
          vec2 q = (P.xz - uFrond.xy) / uFrond.z; float r = length(q);
          if (r > 1.25) return 1.0;
          float sh = 0.0;
          for (int i = 0; i < 9; i++) {
            float fi = float(i), a = fi * 0.698 + 0.3 * sin(fi * 2.4) + 0.05 * sin(uFrondT * (0.5 + 0.07 * fi) + fi * 1.9);
            vec2 d = vec2(cos(a), sin(a)); float len = 0.72 + 0.28 * sin(fi * 3.7 + 1.0);
            float al = dot(q, d), ac = dot(q, vec2(-d.y, d.x)) + 0.05 * sin(uFrondT * 0.9 + fi) * al;
            float t = clamp(al / len, 0.0, 1.0), wid = 0.2 * sin(3.1416 * min(t * 1.15 + 0.06, 1.0));
            float leaf = step(abs(fract((al + abs(ac) * 0.55) * 15.0 + 0.5) - 0.5), 0.27 + 0.2 * (1.0 - t));
            float inside = (1.0 - smoothstep(wid * 0.85, wid, abs(ac))) * step(0.0, al) * (1.0 - step(len, al));
            float rib = 1.0 - smoothstep(0.006, 0.016, abs(ac));
            sh = max(sh, inside * max(leaf, rib));
          }
          sh = max(sh, 1.0 - smoothstep(0.08, 0.13, r));
          return 1.0 - uFrond.w * sh * (1.0 - smoothstep(1.0, 1.25, r));
        }`,
      swap: [['float sunSh=1.;', 'float sunSh=tf_frond(iP);']],
    });
    // unseen fill, standing well outside the walls so it is even: the sky through the glass onto the far wall and the floor,
    // and the warm return of the sunlit room onto the window wall (no lamp is lit anywhere)
    for (const z of [-140, -400]) {
      rigB.addLight({ position: [260, 70, z], color: look.ambSky, intensity: 1.9 * look.fillK, range: 2600 });
      rigB.addLight({ position: [-260, 50, z], color: hexMix(look.ambGround, '#fff2dc', 0.5), intensity: 1.5 * look.fillK * (look.warmK ?? 1), range: 2600 });
    }
    rigA.addLight({ position: [220, 60, -180], color: look.ambSky, intensity: 2.0 * look.fillK, range: 2200 });
    rigA.addLight({ position: [-220, 45, -180], color: hexMix(look.ambGround, '#fff2dc', 0.5), intensity: 1.7 * look.fillK * (look.warmK ?? 1), range: 2200 });
    await ctx.yield();
    // per-room materials for everything this world adds (vertex-coloured, lit by that room's rig); leaves and cloth sway
    const matA = INT.propMaterial({ rig: rigA, sway: { dir: [0.4, 0, 1], amp: 0.016, freq: 0.9, k: 0.6 } });
    const matB = INT.propMaterial({ rig: rigB, sway: { dir: [0.4, 0, 1], amp: 0.02, freq: 0.8, k: 0.6 } });
    const bA = INT.makeBuilder(), bT = INT.makeBuilder(), bB = INT.makeBuilder();          // world-space geometry for room one / the hall
    const inA = (z) => z > (ZD + ZB) / 2;

    // ---- hall ceiling with its five roof lights (claraboyas): plaster, cross beams, iron curbs, glass wells ----
    {
      const cb = INT.makeBuilder(), cc = '#e9e2d0', x0 = ROOF.x - ROOF.w / 2, x1 = ROOF.x + ROOF.w / 2, zF = ZB, zE = ZB - LB;
      const cq = (xa, xb, zHi, zLo) => cb.quad([xa, HB, zHi], [xa, HB, zLo], [xb, HB, zLo], [xb, HB, zHi], cc, S_MATTE);
      cq(-XB, x0, zF, zE); cq(x1, XB, zF, zE);
      let zPrev = zF;
      for (const z of ROOF.z) { cq(x0, x1, zPrev, z + ROOF.d / 2); zPrev = z - ROOF.d / 2; }
      { const eA = ROOF_E.z + ROOF_E.d / 2, eB = ROOF_E.z - ROOF_E.d / 2; cq(x0, x1, zPrev, eA); cq(ROOF_E.x + ROOF_E.w / 2, x1, eA, eB); cq(x0, x1, eB, zE); }
      cb.tessellate(34);
      { const m = new THREE.Mesh(cb.build(), roomB.materials.prop); m.name = 'hall-ceiling'; scene.add(m); }
      await ctx.yield();
      const cb2 = INT.makeBuilder(), iron = '#2c3a36';
      for (const R of [...ROOF.z.map((z) => ({ ...ROOF, z })), ROOF_E]) {
        const z = R.z, x0 = R.x - R.w / 2, x1 = R.x + R.w / 2, za = z + ROOF.d / 2, zb = z - ROOF.d / 2, yT = HB + 5;
        cb2.quad([x0, HB, za], [x0, yT, za], [x0, yT, zb], [x0, HB, zb], '#cfd6d2', S_MATTE);       // well sides, facing in
        cb2.quad([x1, HB, zb], [x1, yT, zb], [x1, yT, za], [x1, HB, za], '#dfe6e2', S_MATTE);
        cb2.quad([x0, HB, zb], [x0, yT, zb], [x1, yT, zb], [x1, HB, zb], '#d7ded9', S_MATTE);
        cb2.quad([x1, HB, za], [x1, yT, za], [x0, yT, za], [x0, HB, za], '#d7ded9', S_MATTE);
        for (const sx of [0, 1]) cb2.add(cbox(2.2, 2.6, ROOF.d + 4, 0.4), { p: [sx ? x1 : x0, HB - 0.9, z], c: iron, surf: S_IRON });
        for (const sz of [0, 1]) cb2.add(cbox(R.w + 4, 2.6, 2.2, 0.4), { p: [R.x, HB - 0.9, sz ? za : zb], c: iron, surf: S_IRON });
        for (let i = 1; i < 4; i++) cb2.add(cbox(1.1, 1.6, ROOF.d, 0.2), { p: [x0 + R.w * i / 4, HB + 0.4, z], c: iron, surf: S_IRON });   // glazing ribs
        for (const k of [-1, 1]) cb2.add(cbox(2 * XB, 4.2, 3.4, 0.5), { p: [0, HB - 2.1, z + k * (ROOF.d / 2 + 14)], c: '#e2dac6', surf: S_MATTE });   // cross beams
        await ctx.yield();      // one roof light at a time
      }
      for (const sx of [-1, 1]) cb2.add(cbox(3, 4, LB, 0.8), { p: [sx * (XB - 1.5), HB - 2, (zF + zE) / 2], c: '#efe8d6', surf: S_MATTE });        // cornice
      for (const z of [zF - 1.5, zE + 1.5]) cb2.add(cbox(2 * XB, 4, 3, 0.8), { p: [0, HB - 2, z], c: '#efe8d6', surf: S_MATTE });
      await ctx.yield();
      const m = new THREE.Mesh(cb2.build(), roomB.materials.prop); m.name = 'hall-ceiling'; scene.add(m);
    }
    await ctx.yield();

    // ---- tall panelled doors: a closed pair in the west wall behind the arch, an open pair folded back at the doorway ----
    const WALNUT = '#6b4126', OAK = '#96683a';
    const doorB = [];
    const doorLeaf = (b, M, w, h, colr, painted = null) => {       // local: x across (0..w), y up, z thickness; origin at the hinge foot
      const S_D = painted ? sf(SU.PLAIN, 0.5) : S_WOOD;
      b.add(cbox(w, h, 1.4, 0.25), { p: [w / 2, h / 2, 0], pre: M, c: colr, surf: S_D, grad: [0, h * 0.2, 0.8, 1] });
      const pw = w - 5, ph = [h * 0.16, h * 0.4, h * 0.22]; let y = 3.2;
      for (const p of ph) {
        for (const sz of [-1, 1]) {
          b.add(cbox(pw, p, 0.5, 0.2), { p: [w / 2, y + p / 2, sz * 0.8], pre: M, c: painted ? painted.rail : hexMix(colr, '#c8a070', 0.12), surf: S_D });
          b.add(cbox(pw - 3, p - 3, 0.5, 0.2), { p: [w / 2, y + p / 2, sz * 1.05], pre: M, c: painted ? painted.panel : hexMix(colr, '#000000', 0.12), surf: S_D });
          if (!painted) continue;
          // a painted and gilded panel: a gilt fillet all round, a tall lozenge of gilt moulding, a cream boss with a blue heart
          const cx = w / 2, cy = y + p / 2, z = sz * 1.3, a = pw / 2 - 3.4, c2 = p / 2 - 3.4, dl = Math.hypot(a, c2), ang = Math.atan2(c2, a);
          for (const k of [-1, 1]) { b.add(cbox(pw - 5, 0.45, 0.3, 0.1), { p: [cx, cy + k * (p / 2 - 2.6), z], pre: M, c: painted.gilt, surf: S_BRASS }); b.add(cbox(0.45, p - 5, 0.3, 0.1), { p: [cx + k * (pw / 2 - 2.6), cy, z], pre: M, c: painted.gilt, surf: S_BRASS }); }
          for (const kx of [-1, 1]) for (const ky of [-1, 1]) b.add(cbox(dl, 0.6, 0.36, 0.12), { p: [cx + kx * a / 2, cy + ky * c2 / 2, z], r: [0, 0, -kx * ky * ang], pre: M, c: painted.gilt, surf: S_BRASS });
          b.add(cyl(Math.min(a, c2) * 0.34, Math.min(a, c2) * 0.34, 0.5, 20), { p: [cx, cy, z], r: [Math.PI / 2, 0, 0], pre: M, c: painted.boss, surf: S_CER });
          b.add(cyl(Math.min(a, c2) * 0.17, Math.min(a, c2) * 0.17, 0.7, 14), { p: [cx, cy, z], r: [Math.PI / 2, 0, 0], pre: M, c: painted.heart, surf: S_CER });
          for (const kx of [-1, 1]) for (const ky of [-1, 1]) b.add(sph(0.7, 8, 6), { p: [cx + kx * (pw / 2 - 2.6), cy + ky * (p / 2 - 2.6), z], pre: M, c: painted.gilt, surf: S_BRASS });
        }
        y += p + h * 0.045;
      }
      for (const sz of [-1, 1]) { b.add(sph(1.1, 10, 8), { p: [w - 2.2, h * 0.42, sz * 1.8], pre: M, c: PAL[6], surf: S_BRASS }); b.add(cbox(1.6, 7, 0.3, 0.1), { p: [w - 2.2, h * 0.42, sz * 0.85], pre: M, c: PAL[6], surf: S_BRASS }); }
    };
    {
      const zW = ZB - LB - 2.5;
      doorLeaf(bB, new THREE.Matrix4().makeTranslation(-15, 0, zW), 15, 62, hexMix(WALNUT, OAK, 0.25));
      doorLeaf(bB, new THREE.Matrix4().makeTranslation(15, 0, zW).multiply(new THREE.Matrix4().makeRotationY(Math.PI)), 15, 62, hexMix(WALNUT, OAK, 0.25));
      await ctx.yield();
      for (const sx of [-1, 1]) { const b = INT.makeBuilder(); doorLeaf(b, new THREE.Matrix4(), DOOR_W / 2, DOOR_H - 1, '#1f6f78', { rail: '#2b8791', panel: '#17525e', gilt: '#e0b23c', boss: '#f1e6c8', heart: PAL[5] }); doorB.push({ b, sx }); await ctx.yield(); }   // the open pair stirs in the draught (own meshes)
      await ctx.yield();
    }

    // ---- the patio hall, lived in: doors, pictures and pier glasses on the long walls, consoles, chairs, plants ----
    const hallPics = [];
    {
      const hr = rng.fork('hall'), GILT = '#c9a148', CREAM = '#efe8d6', doorCol = hexMix(WALNUT, OAK, 0.3), LX = -XB + 0.9;
      const kz = new THREE.Color(look.zenith), kh = new THREE.Color(look.horizon), kw = new THREE.Color(look.wallB);
      // a closed pair in a wall x = const (sx = -1 left wall, +1 right), with casing, cornice and an overdoor panel
      const sideDoor = (z) => {
        doorLeaf(bB, new THREE.Matrix4().makeTranslation(LX, 0, z + 13).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)), 13, 60, doorCol);
        doorLeaf(bB, new THREE.Matrix4().makeTranslation(LX, 0, z - 13).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2)), 13, 60, doorCol);
        for (const sz of [-1, 1]) bB.add(cbox(1.8, 64, 3.4, 0.4), { p: [LX - 0.2, 32, z + sz * 14.9], c: CREAM, surf: S_MATTE });
        bB.add(cbox(2.0, 4.4, 34.6, 0.5), { p: [LX - 0.1, 62.6, z], c: CREAM, surf: S_MATTE });
        bB.add(cbox(3.2, 1.8, 39, 0.5), { p: [LX + 0.3, 65.8, z], c: CREAM, surf: S_MATTE });
        bB.add(cbox(0.8, 13, 27, 0.3), { p: [LX - 0.45, 75, z], c: hexMix(look.wallA, '#8a7a5a', 0.25), surf: S_MATTE });
        bB.add(cyl(4.6, 4.6, 0.5, 20), { p: [LX - 0.05, 75, z], r: [0, 0, Math.PI / 2], s: [1, 1, 1.9], c: GILT, surf: S_BRASS });
        bB.add(cyl(3.7, 3.7, 0.6, 20), { p: [LX, 75, z], r: [0, 0, Math.PI / 2], s: [1, 1, 1.9], c: hexMix(look.zenith, '#2c4a6a', 0.5), surf: S_GLOSS });
        bB.add(cbox(0.5, 1.2, 30, 0.2), { p: [LX - 0.2, 0.6, z], c: '#8a6a42', surf: S_WOOD });            // threshold
      };
      // a pier glass: gilt frame with a crest; the glass holds the sky and the window bars of the wall opposite
      const glass = (cx, cy, cz, w, h, nx, nz) => {
        const M = new THREE.Matrix4().makeBasis(new THREE.Vector3(nz, 0, -nx), new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx, 0, nz)).setPosition(cx, cy, cz), fw = 2.2;
        for (const s of [-1, 1]) { bB.add(cbox(fw, h + fw * 2, 1.6, 0.5), { p: [s * (w / 2 + fw / 2), 0, 0.4], pre: M, c: GILT, surf: S_BRASS }); bB.add(cbox(w + fw * 2, fw, 1.6, 0.5), { p: [0, s * (h / 2 + fw / 2), 0.4], pre: M, c: GILT, surf: S_BRASS }); }
        bB.add(lathe([[0.01, 0], [w * 0.34, 0], [w * 0.3, 2.2], [w * 0.16, 3.4], [w * 0.1, 6.2], [0.01, 7.4]], 14), { p: [0, h / 2 + fw, 0.3], s: [1, 1, 0.16], pre: M, c: GILT, surf: S_BRASS });
        for (const s of [-1, 1]) bB.add(sph(1.5, 10, 8), { p: [s * (w / 2 + fw * 0.5), h / 2 + fw * 1.3, 0.6], pre: M, c: GILT, surf: S_BRASS });
        bB.add(new THREE.PlaneGeometry(w, h, 12, 16), { p: [0, 0, 0.5], pre: M, surf: sf(SU.PLAIN, 0.95, 0.2, 0.3), tint: (X, Y, Z, k) => {
          const v = (Y - cy) / h + 0.5, u = ((nx !== 0 ? Z - cz : X - cx) / w + 0.5), du = Math.abs(u - 0.4);
          k.copy(kw).multiplyScalar(0.34).lerp(kz, 0.12);                                   // the far wall, dim in the old silvering
          if (du < 0.21 && v > 0.1 && v < 0.94) { k.copy(kh).lerp(kz, smoothstep(0.2, 0.9, v)).multiplyScalar(0.62); if (du < 0.02 || Math.abs(v - 0.52) < 0.012 || Math.abs(v - 0.78) < 0.012) k.multiplyScalar(0.45); }
          k.multiplyScalar(0.85 + 0.15 * Math.sin(u * 3.1));
        } });
      };
      const console_ = async (x, z, rotY, sc, vase) => {
        const g = INT.tableGeometry({ rng: hr, scale: sc, width: 1.4, depth: 0.42, height: 0.8, legs: 'turned', color: WALNUT }), top = g.userData.top;
        bB.add(g, { p: [x, 0, z], r: [0, rotY, 0] });
        await ctx.yield();
        if (vase === 1) { const v = INT.vaseGeometry({ rng: hr, scale: sc * 1.15, height: 0.36, color: hr.pick(['#e8e2d4', '#5E7FB4', '#d9cdb4']), flowers: 7, flowerColors: ['#f4f0e6', '#f0dc8a', '#e9c9d6'] }); await ctx.yield(); bB.add(v, { p: [x, top, z] }); }
        else if (vase === 2) { bB.add(INT.fruitBowlGeometry({ rng: hr, scale: sc, color: '#d9d2c2' }), { p: [x, top, z] }); }
        else { for (const dz of [-6, 0.5, 6.4]) bB.add(lathe([[0.01, 0], [1.3, 0], [1.9, 1.4], [1.2, 4.2], [0.7, 5.6], [1.0, 6.4], [0.01, 6.4]], 10), { p: [x, top, z + dz], s: 0.7 + 0.25 * hr(), c: hr.pick(['#5E7FB4', '#e8e2d4', '#137E8C', '#c8923f']), surf: S_CER }); }
      };
      const hallChair = INT.chairGeometry({ rng: hr, scale: 18, style: 'dining', color: hexMix(WALNUT, OAK, 0.3), seatColor: '#c7a96a' });      // the kit draws no random numbers for a chair: one geometry serves all ten
      const chairAt = (x, z, rotY) => bB.add(hallChair, { p: [x, 0, z], r: [0, rotY, 0] });
      const pic = (x, y, z, w, h, nx, nz) => hallPics.push({ position: [x, y, z], normal: [nx, 0, nz], width: w, height: h, seed: hr(), frame: 'gilt', frameWidth: 0.06 });
      // LEFT WALL (no windows): door, glass, picture, in turn
      for (const z of [18, -195, -360]) { sideDoor(z); await ctx.yield(); }
      await ctx.yield();
      for (const z of [-34, -142, -302]) { glass(LX - 0.6, 56, z, 20, 44, 1, 0); await ctx.yield(); await console_(-XB + 5.6, z, Math.PI / 2, 18, z === -142 ? 1 : 0); await ctx.yield(); }
      pic(LX - 0.7, 64, 72, 40, 28, 1, 0); pic(LX - 0.7, 64, -88, 46, 31, 1, 0); pic(LX - 0.7, 64, -250, 44, 30, 1, 0); pic(LX - 0.7, 62, -412, 26, 34, 1, 0);
      for (const z of [-70, -106, -232, -268]) { chairAt(-XB + 5.3, z, Math.PI / 2 + hr.range(-0.1, 0.1)); await ctx.yield(); }
      bB.add(INT.sofaGeometry({ rng: hr, scale: 21, color: '#7f8ea2', pillowColors: ['#d9a62b', '#e9dfc6', '#137E8C'] }), { p: [-XB + 13, 0, 72], r: [0, Math.PI / 2, 0] });
      await ctx.yield();
      // RIGHT WALL: the piers between the windows
      const RX = XB - 0.9, piers = []; for (let k = 0; k + 1 < HALL_WZ.length; k++) piers.push((HALL_WZ[k] + HALL_WZ[k + 1]) / 2);
      pic(RX + 0.7, 70, piers[0], 26, 34, -1, 0); pic(RX + 0.7, 70, piers[2], 26, 34, -1, 0);
      glass(RX + 0.6, 58, piers[1], 18, 42, -1, 0); glass(RX + 0.6, 58, piers[3], 18, 42, -1, 0);
      await ctx.yield();
      await console_(XB - 5.6, piers[1], -Math.PI / 2, 18, 2); await ctx.yield(); await console_(XB - 5.6, piers[3], -Math.PI / 2, 18, 1); await ctx.yield();
      chairAt(XB - 5.3, piers[1] - 20, -Math.PI / 2 + 0.12); await ctx.yield(); chairAt(XB - 5.3, piers[1] + 20, -Math.PI / 2 - 0.1); await ctx.yield();
      // FAR WALL: the closed doors get their casing and overdoor; pictures and consoles either side
      {
        const zF = ZB - LB + 0.9;
        // (the wall above the wainscot is the hero's mosaic panel: no casing, no pictures here)
        await console_(-52, zF + 5, 0, 18, 1); await ctx.yield(); await console_(52, zF + 5, 0, 18, 0); await ctx.yield();
        chairAt(-28, zF + 6, 0.1); await ctx.yield(); chairAt(28, zF + 6, -0.1); await ctx.yield(); chairAt(-76, zF + 6, 0.05); await ctx.yield(); chairAt(76, zF + 6, -0.08);
      }
      await ctx.yield();
    }

    if (hallPics.length) {
      // the kit's frames, with pictures of our own on the canvases: a low-horizon campo under a dull gold sky, or (tall canvases)
      // a portrait in a dark ground, all under brown varnish, so that nothing on these walls is louder than the arch
      const pics = INT.makePictures({ rig: rigB, rng: rng.fork('pictures'), scale: SC, pictures: hallPics }); pics.object.name = 'hall-pictures'; scene.add(pics.object);
      patchMat(pics.object.children[0].material, 'oils', {
        pars: /* glsl */`
          vec3 tp_paint(vec2 uv, float seed, float asp, out float gloss) {
            float s1 = i_h21(vec2(seed, 1.3)), s2 = i_h21(vec2(seed, 7.7)), s3 = i_h21(vec2(seed, 13.1));
            vec2 p = vec2(uv.x * asp, uv.y);
            float brush = i_fbm2(p * vec2(11.0, 30.0) + seed * 5.0);
            vec3 c;
            if (asp < 0.9) {
              vec2 q = (uv - vec2(0.5 + 0.04 * (s1 - 0.5), 0.63)) * vec2(asp, 1.0);
              float face = 1.0 - smoothstep(0.085, 0.1, length(q * vec2(1.25, 1.0)));
              float hair = 1.0 - smoothstep(0.11, 0.125, length((q - vec2(0.0, 0.035)) * vec2(1.1, 1.0)));
              vec2 b = (uv - vec2(0.5, 0.2)) * vec2(asp, 1.0);
              float body = 1.0 - smoothstep(0.26, 0.29, length(b * vec2(0.8, 1.0)));
              float collar = 1.0 - smoothstep(0.05, 0.062, length((q + vec2(0.0, 0.125)) * vec2(0.8, 1.6)));
              c = mix(vec3(0.085, 0.064, 0.042), vec3(0.17, 0.125, 0.07), 1.0 - smoothstep(0.1, 0.75, length(uv - vec2(0.42, 0.62))));
              c = mix(c, mix(vec3(0.03, 0.032, 0.045), vec3(0.085, 0.028, 0.028), s2), body);
              c = mix(c, vec3(0.045, 0.032, 0.022), hair * (1.0 - face));
              c = mix(c, vec3(0.5, 0.46, 0.38), collar * (1.0 - face));
              c = mix(c, vec3(0.5, 0.33, 0.22) * (0.75 + 0.5 * smoothstep(-0.08, 0.08, q.x + q.y)), face);
            } else {
              float hz = 0.34 + 0.1 * s1;
              float cl = i_fbm2(p * vec2(1.6, 4.5) + seed * 3.0);
              vec3 sky = mix(vec3(0.46, 0.37, 0.2), vec3(0.14, 0.18, 0.21), smoothstep(hz, 0.98, uv.y));
              sky = mix(sky, vec3(0.5, 0.44, 0.31), smoothstep(0.48, 0.8, cl) * 0.6 * smoothstep(hz + 0.04, hz + 0.3, uv.y));
              float ridge = hz + 0.035 * i_fbm2(vec2(p.x * 2.2 + seed * 9.0, 2.0));
              c = mix(vec3(0.1, 0.125, 0.125), sky, smoothstep(-0.006, 0.006, uv.y - ridge));
              vec3 lc = mix(vec3(0.17, 0.15, 0.07), vec3(0.065, 0.06, 0.032), smoothstep(hz, 0.0, uv.y));
              lc *= 0.8 + 0.4 * i_fbm2(p * vec2(3.0, 14.0) + seed);
              float dn = (hz - uv.y) / hz;
              float rx = asp * (0.3 + 0.4 * s2) + 0.12 * asp * sin(uv.y * 9.0 + s3 * 6.0) * dn, rw = 0.012 + 0.16 * (hz - uv.y);
              lc = mix(lc, vec3(0.4, 0.36, 0.25), (1.0 - smoothstep(rw * 0.7, rw, abs(p.x - rx))) * step(uv.y, hz));
              c = mix(c, lc, smoothstep(0.006, -0.006, uv.y - hz + 0.012));
              vec2 tc = vec2(asp * (0.72 - 0.44 * step(0.5, s3)), hz + 0.1), tq = (p - tc) / vec2(0.2, 0.13);
              float crown = 1.0 - smoothstep(0.8, 1.0, length(tq) + 0.3 * i_fbm2(p * 9.0 + seed));
              float trunk = (1.0 - smoothstep(0.012, 0.02, abs(p.x - tc.x))) * step(uv.y, tc.y) * step(hz - 0.06, uv.y);
              c = mix(c, vec3(0.042, 0.052, 0.028) * (0.8 + 0.6 * smoothstep(-0.5, 0.8, tq.y)), max(crown, trunk));
            }
            c *= 0.8 + 0.4 * brush;
            c *= vec3(0.9, 0.82, 0.68) * 1.35;
            gloss = 0.5 + 0.25 * i_n2(p * 46.0 + seed);
            return c;
          }`,
        albedo: /* glsl */`
          { float tSeed = floor(I_VCOL.r * 997. + .5) * .37 + step(0., vObjPos.x) * 5.3 + step(-300., vObjPos.z) * 2.9, tAsp = max(floor(I_VCOL.g * 400. + .5) * .01, .05), tG;
            diffuseColor.rgb = tp_paint(vIntUv, tSeed, tAsp, tG); iGloss = tG; iH = 0.; }`,
      });
    }
    await ctx.yield();

    // two tall gilt-framed pictures on the wall either side of the double doors, in room one (the kit's own bright canvases)
    {
      const pr = makeRng('the-toppling:doorpics:' + ctx.seed), list = [];
      for (const sx of [-1, 1]) list.push({ position: [sx * (DOOR_W / 2 + (XA - DOOR_W / 2) / 2), 61, ZD + 0.7], normal: [0, 0, 1], width: 22, height: 34, seed: pr(), frame: 'gilt', frameWidth: 0.07 });
      const dp = INT.makePictures({ rig: rigA, rng: pr, scale: SC, pictures: list }); dp.object.name = 'room-one-things'; scene.add(dp.object);
      await ctx.yield();
      // and a kentia palm in a blue-and-white pot before each of them, stirring
      for (const sx of [-1, 1]) { bA.add(INT.plantGeometry({ rng: pr, scale: SC * 0.8, kind: 'palm', height: 1.5, potColor: sx < 0 ? '#5E7FB4' : '#e8e2d4', leafColor: sx < 0 ? '#5f7a2a' : '#6a8430' }), { p: [sx * 44, 0, ZD + 9] }); await ctx.yield(); }
    }
    await ctx.yield();

    // ---- beyond the hall's glass: sky and crossing clouds, the house opposite with its parapet, a palm top, washing on the roof ----
    // (the kit's panes are switched off for this row, so that what is outside is really outside and slides behind the bars)
    const outU = { uTime: { value: 0 }, uZenith: { value: col(look.zenith) }, uHorizon: { value: col(look.horizon) }, uCloud: { value: col(look.cloud) }, uGround: { value: col(look.outGround) },
      uGain: { value: look.skyI * look.paneGain * (lookName === 'overcast' ? 0.62 : 1.0) }, uCover: { value: lookName === 'overcast' ? 0.2 : lookName === 'evening' ? 0.5 : 0.56 } };
    let palmCrown = null;
    {
      const sky = new THREE.ShaderMaterial({ uniforms: outU, side: THREE.DoubleSide, depthWrite: true,
        vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uGain, uCover; uniform vec3 uZenith, uHorizon, uCloud, uGround; varying vec3 vW;
          float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
          float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
          void main() {
            vec3 rd = normalize(vW - cameraPosition + vec3(0.0, 1.0e-4, 0.0));
            float el = rd.y, az = rd.z / max(abs(rd.x), 0.12);
            vec3 c = mix(uHorizon, uZenith, smoothstep(0.0, 0.6, el));
            vec2 q = vec2(az * 2.6 + uTime * 0.035, el * 7.0);
            float cl = vn(q) * 0.55 + vn(q * 2.3 + 3.7) * 0.3 + vn(q * 5.1 + 9.1) * 0.15;
            float m = smoothstep(uCover, uCover + 0.16, cl) * smoothstep(0.0, 0.2, el);
            c = mix(c, uCloud * (0.82 + 0.3 * smoothstep(uCover, uCover + 0.4, cl)), m * 0.9);
            c = mix(uGround * 0.8, c, smoothstep(-0.03, 0.02, el));
            gl_FragColor = vec4(c * uGain, 1.0);
          }` });
      const P = [], X0 = XB + 6, X1 = 560, Z0 = -1000, Z1 = 720, Y0 = -80, Y1 = 640;
      const q4 = (a, b, c, d) => P.push(...a, ...b, ...c, ...a, ...c, ...d);
      q4([X1, Y0, Z1], [X1, Y0, Z0], [X1, Y1, Z0], [X1, Y1, Z1]); q4([X0, Y0, Z0], [X1, Y0, Z0], [X1, Y1, Z0], [X0, Y1, Z0]); q4([X0, Y0, Z1], [X1, Y0, Z1], [X1, Y1, Z1], [X0, Y1, Z1]);
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      const sm = new THREE.Mesh(sg, sky); sm.name = 'outdoor-sky'; sm.frustumCulled = false; scene.add(sm);
      // the house opposite (its front in shade, its coping in the sun), shutters, the palm, the poles of the washing line
      const ob = INT.makeBuilder(), basic = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }), g = outU.uGain.value;
      const lit = (hex, k) => col(hex).multiplyScalar(k * g);
      const front = lit(hexMix(look.outGround, look.ambSky, 0.45), 0.5), cope = lit(sunny ? hexMix('#fff6e2', look.sunHex, 0.5) : '#d8d8d2', sunny ? 0.95 : 0.6), shut = lit('#2f5a3c', 0.34), dark = lit('#20261e', 0.3);
      const HX = 172, HY = 56;
      ob.add(box(90, HY + 40, 1700), { p: [HX + 45, HY / 2 - 20, -140], c: front });
      ob.add(box(6, 3.4, 1700), { p: [HX - 1.2, HY - 1.7, -140], c: cope }); ob.add(box(3, 1.6, 1700), { p: [HX - 0.6, HY - 12, -140], c: front.clone().multiplyScalar(1.25) });
      ob.add(box(92, 0.6, 1700), { p: [HX + 45, HY + 0.3, -140], c: cope.clone().multiplyScalar(0.8) });
      for (let z = 640; z > -960; z -= 46) {
        for (const y of [8, 34]) { ob.add(box(0.6, 17, 11), { p: [HX - 0.4, y + 8.5, z], c: shut }); ob.add(box(1.0, 1.2, 14), { p: [HX - 0.7, y - 0.6, z], c: front.clone().multiplyScalar(1.3) }); }
        if (((z / 46) | 0) % 3 === 0) ob.add(box(7, 9, 7), { p: [HX + 24, HY + 4.5, z + 12], c: front.clone().multiplyScalar(1.15) });           // chimney stacks
      }
      const PZ = HALL_WZ[1] - 6, PXo = 138, PH = 60;
      for (let i = 0; i < 6; i++) ob.add(cyl(1.6 - i * 0.1, 1.8 - i * 0.1, PH / 6 + 0.2, 7), { p: [PXo + 0.6 * Math.sin(i * 0.8), PH / 6 * (i + 0.5), PZ], c: lit('#6a5a48', 0.5 + 0.06 * (i & 1)) });
      for (const z of [HALL_WZ[2] + 44, HALL_WZ[2] - 44]) ob.add(cyl(0.45, 0.45, 20, 5), { p: [HX + 9, HY + 10, z], c: dark });
      ob.add(box(0.25, 0.25, 88), { p: [HX + 9, HY + 19.4, HALL_WZ[2]], c: dark });
      const om = new THREE.Mesh(ob.build(), basic); om.name = 'outdoor-house'; om.frustumCulled = false; scene.add(om);
      await ctx.yield();
      // palm crown: drooping fronds as tapered strips, each with a pale midrib; the whole crown stirs
      const cb = INT.makeBuilder(), fr2 = rng.fork('palm');
      for (let i = 0; i < 17; i++) {
        const az = i / 17 * TAU + fr2.range(-0.15, 0.15), len = fr2.range(22, 31), up = fr2.range(0.25, 1.1), PP = [], NN = [], II = [], ca = Math.cos(az), sa = Math.sin(az), n = 7;
        for (let j = 0; j <= n; j++) { const t = j / n, r = len * t, y = up * r * 0.9 - 0.022 * r * r * (1.4 - up * 0.5), w = 4.6 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)) + 0.3; PP.push(ca * r - sa * w, y - 0.5 * w * 0.3, sa * r + ca * w, ca * r, y + 0.4, sa * r, ca * r + sa * w, y - 0.5 * w * 0.3, sa * r - ca * w); for (let q = 0; q < 3; q++) NN.push(0, 1, 0);
          if (j > 0) { const a = (j - 1) * 3, b2 = j * 3; II.push(a, b2, a + 1, a + 1, b2, b2 + 1, a + 1, b2 + 1, a + 2, a + 2, b2 + 1, b2 + 2); } }
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); fg.setAttribute('normal', new THREE.Float32BufferAttribute(NN, 3)); fg.setIndex(II);
        const base = lit(fr2.pick(['#2c4a2a', '#24402a', '#365a2e']), 0.55 + 0.25 * up);
        cb.add(fg, { tint: (X, Y, Z, k) => { k.copy(base).multiplyScalar(0.75 + 0.5 * smoothstep(-6, 12, Y)); } });
      }
      cb.add(sph(2.6, 8, 6), { c: lit('#5a4a30', 0.5) });
      palmCrown = new THREE.Mesh(cb.build(), basic); palmCrown.name = 'outdoor-palm'; palmCrown.position.set(PXo + 1.4, PH, PZ); palmCrown.frustumCulled = false; scene.add(palmCrown);
      await ctx.yield();
      // the washing: sheets and shirts on the roof line, lifting in the breeze (vertex shader)
      const WP = [], WC = [], WA = [], wr = rng.fork('washing'), cloths = ['#f4f1e8', '#f4f1e8', '#5E7FB4', '#f4f1e8', '#c8523f', '#e9dfc6', '#137E8C', '#f4f1e8', '#d9a62b'];
      let wz = HALL_WZ[2] + 40;
      for (let i = 0; i < 9 && wz > HALL_WZ[2] - 40; i++) {
        const w = wr.range(5.5, 10.5), h = wr.range(6, 10.5), c = lit(cloths[i % cloths.length], 0.85), ph = wr() * 6.28, nx = 4, ny = 4, x = HX + 9, yT = HY + 19.3;
        for (let a = 0; a < nx; a++) for (let b2 = 0; b2 < ny; b2++) {
          const v = (a2, b3) => { WP.push(x, yT - h * b3 / ny, wz - w * a2 / nx); WC.push(c.r, c.g, c.b); WA.push(b3 / ny, ph + a2 * 0.5, h); };
          v(a, b2); v(a + 1, b2); v(a + 1, b2 + 1); v(a, b2); v(a + 1, b2 + 1); v(a, b2 + 1);
        }
        wz -= w + wr.range(1.2, 3.2);
      }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(WP, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(WC, 3)); wg.setAttribute('aW', new THREE.Float32BufferAttribute(WA, 3));
      const wm = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: { uTime: outU.uTime }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec3 color; attribute vec3 aW; uniform float uTime; varying vec3 vC;
          void main() { vec3 p = position; float k = aW.x * aW.x;
            p.x += k * aW.z * (0.34 + 0.3 * sin(uTime * 1.7 + aW.y) + 0.12 * sin(uTime * 4.3 + aW.y * 2.1 + p.z * 0.6));
            p.y += k * aW.z * 0.12 * (1.0 + sin(uTime * 1.7 + aW.y));
            vC = color * (0.86 + 0.14 * sin(p.z * 1.3 + uTime * 2.6 + aW.y) * aW.x);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
        fragmentShader: /* glsl */`varying vec3 vC; void main() { gl_FragColor = vec4(vC, 1.0); }` }));
      wm.name = 'outdoor-washing'; wm.frustumCulled = false; scene.add(wm);
      // glazing bars (or the siesta's louvres) as real bars in the window reveals
      const [mx, my] = look.mull, bw = Math.max(look.bar * SC, 0.5);
      for (const z of HALL_WZ) {
        for (let i = 1; i < mx; i++) bB.add(box(0.7, WIN_B.h, bw), { p: [XB + 3.2, WIN_B.sill + WIN_B.h / 2, z - WIN_B.w / 2 + WIN_B.w * i / mx], c: look.frame, surf: S_MATTE });
        for (let j = 1; j < my; j++) bB.add(box(0.7, bw, WIN_B.w), { p: [XB + 3.2, WIN_B.sill + WIN_B.h * j / my, z], c: look.frame, surf: S_MATTE });
      }
    }
    await ctx.yield();

    // ---- books ----
    // Every book is laid here quad by quad into a geometry of its own kind (one mesh per room): two boards that overhang a
    // block of leaves, a rounded back. A second attribute tells each point where it lies on its face, in metres, and how
    // large the face is, and the book shader draws the binding from that: cloth grain, rubbed edges, a tooled double frame
    // with corner fans and a centre piece or a paper label on the covers (a ledger gets leather corners, a leather back strip
    // and a lettered label); raised bands, gilt rules, a lettered label and small tools on the backs; the leaves of the page
    // block, plain, sprinkled or gilt, in the shade of the board that overhangs them.
    const BOOKS = ['#6e2f2a', '#2f4a3a', '#2c3a5c', '#8a6a3e', '#5a3a4a', '#a59a82', '#3e4650', '#7a4a2a'];
    const mkBk = () => ({ P: [], N: [], C: [], S: [], U: [], B: [], I: [], n: 0 });
    const bkA = mkBk(), bkB = mkBk();
    const S_PAGE = sf(SU.PLAIN, 0.06), S_BACK = sf(SU.PLAIN, 0.3), S_RIB = sf(SU.FABRIC, 0.2);
    // a grid of nu x nv quads from corner o along edges a and b (normal n); face coordinates u0 + du * f, v0 + dv * g
    const bkQuad = (K, ox, oy, oz, ax, ay, az, bx, by, bz, nx, ny, nz, c, sv, type, rnd, u0, v0, du, dv, hu, hv, nu = 1, nv = 1) => {
      const base = K.n;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const fu = i / nu, fv = j / nv;
        K.P.push(ox + ax * fu + bx * fv, oy + ay * fu + by * fv, oz + az * fu + bz * fv); K.N.push(nx, ny, nz); K.C.push(c.r, c.g, c.b); K.S.push(sv[0], sv[1], sv[2], sv[3]);
        K.U.push(type, rnd); K.B.push(u0 + du * fu, v0 + dv * fv, hu, hv);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c2 = a + nu + 1, d = c2 + 1; K.I.push(a, b, d, a, d, c2); }
      K.n += (nu + 1) * (nv + 1);
    };
    const kCov = new THREE.Color(), kDark = new THREE.Color(), kPage = new THREE.Color(), kRib = new THREE.Color(), PAGE_A = col('#e9e1c8'), PAGE_B = col('#cfc19d');
    // one book lying flat: w across (the back at -x), t thick, d deep, foot at y0, turned by yaw. o: { top: 1 | 4 (a ledger's
    // cover), sub (the top cover is cut into sub x sub quads, for the per-vertex fill), ribbon: colour, ribbonAt: 0..1 }
    const emitBook = (K, cx, y0, cz, w, t, d, yaw, cover, rnd, o = {}) => {
      const cs = Math.cos(yaw), sn = Math.sin(yaw), bt = Math.min(0.32, t * 0.12), hw = w / 2, hd = d / 2, sub = o.sub ?? 1;
      kCov.set(cover); kDark.copy(kCov).multiplyScalar(0.72); kPage.copy(PAGE_A).lerp(PAGE_B, rnd);
      const face = (ox, oy, oz, ax, ay, az, bx, by, bz, c, sv, type, u0, v0, du, dv, hu, hv, nu = 1, nv = 1) => {
        const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, l = 1 / (Math.hypot(nx, ny, nz) || 1);
        bkQuad(K, cx + cs * ox + sn * oz, y0 + oy, cz - sn * ox + cs * oz, cs * ax + sn * az, ay, -sn * ax + cs * az, cs * bx + sn * bz, by, -sn * bx + cs * bz,
          (cs * nx + sn * nz) * l, ny * l, (-sn * nx + cs * nz) * l, c, sv, type, rnd, u0, v0, du, dv, hu, hv, nu, nv);
      };
      const board = (ya, yb, ttype, n) => {       // tooled above and below, plain cloth on its four edges
        face(-hw, yb, hd, w, 0, 0, 0, 0, -d, kCov, S_CLOTH, ttype, -hw, hd, w, -d, hw, hd, n, d > w * 1.6 ? n * 2 : n);
        face(-hw, ya, -hd, w, 0, 0, 0, 0, d, kDark, S_CLOTH, 1, -hw, -hd, w, d, hw, hd);
        face(hw, ya, hd, 0, 0, -d, 0, yb - ya, 0, kDark, S_CLOTH, 5, 0, 0, 1, 1, 1, 1);
        face(-hw, ya, hd, w, 0, 0, 0, yb - ya, 0, kDark, S_CLOTH, 5, 0, 0, 1, 1, 1, 1);
        face(hw, ya, -hd, -w, 0, 0, 0, yb - ya, 0, kDark, S_CLOTH, 5, 0, 0, 1, 1, 1, 1);
      };
      board(0, bt, 1, 1); board(t - bt, t, o.top ?? 1, sub);
      // the leaves, set in from the boards on three sides
      const px1 = hw - 0.5, px0 = -hw + 0.3, pz = hd - 0.45, ph = t - 2 * bt, hy = ph / 2;
      face(px1, bt, pz, 0, 0, -2 * pz, 0, ph, 0, kPage, S_PAGE, 3, pz, -hy, -2 * pz, ph, pz, hy);
      face(px0, bt, pz, px1 - px0, 0, 0, 0, ph, 0, kPage, S_PAGE, 3, px0, -hy, px1 - px0, ph, hw, hy);
      face(px1, bt, -pz, px0 - px1, 0, 0, 0, ph, 0, kPage, S_PAGE, 3, px1, -hy, px0 - px1, ph, hw, hy);
      // the back: a shallow round from board to board
      const NB2 = 4, bulge = Math.min(0.42, t * 0.16), base = K.n;
      for (let k = 0; k <= NB2; k++) {
        const a = -Math.PI / 2 + Math.PI * k / NB2, lx = -hw + 0.08 - bulge * Math.cos(a), ly = t / 2 + (t / 2 - 0.015) * Math.sin(a);
        let nx = -Math.cos(a) * t * 0.5, ny = Math.sin(a) * bulge; const l = 1 / (Math.hypot(nx, ny) || 1); nx *= l; ny *= l;
        for (const lz of [-hd, hd]) {
          K.P.push(cx + cs * lx + sn * lz, y0 + ly, cz - sn * lx + cs * lz); K.N.push(cs * nx, ny, -sn * nx); K.C.push(kDark.r, kDark.g, kDark.b); K.S.push(S_BACK[0], S_BACK[1], S_BACK[2], S_BACK[3]);
          K.U.push(2, rnd); K.B.push(lz, ly - t / 2, hd, t / 2);
        }
        if (k > 0) { const A0 = base + (k - 1) * 2; K.I.push(A0, A0 + 1, A0 + 3, A0, A0 + 3, A0 + 2); }
      }
      K.n += (NB2 + 1) * 2;
      if (o.ribbon) {       // a silk marker out of the head of the leaves, drooping (both sides drawn)
        kRib.set(o.ribbon); const rx = w * 0.2 * ((o.ribbonAt ?? 0.5) - 0.5), y = bt + ph * 0.55, pts = [[y, pz - 0.3], [y - 0.1, pz + 0.9], [y - 0.8, pz + 1.6], [y - 2.0, pz + 1.85]];
        for (let i = 0; i < 3; i++) { const p0 = pts[i], p1 = pts[i + 1];
          face(rx - 0.4, p0[0], p0[1], 0.8, 0, 0, 0, p1[0] - p0[0], p1[1] - p0[1], kRib, S_RIB, 0, 0, 0, 1, 1, 1, 1);
          face(rx + 0.4, p0[0], p0[1], -0.8, 0, 0, 0, p1[0] - p0[0], p1[1] - p0[1], kRib, S_RIB, 0, 0, 0, 1, 1, 1, 1); }
      }
    };
    // a pile of books from y0 up to exactly y1
    const pile = (K, cx, cz, w, d, y0, y1, yaw, br, opts = {}) => {
      let y = y0, i = 0;
      while (y < y1 - 0.05) {
        let t = br.range(opts.tMin ?? 2.0, opts.tMax ?? 3.4); if (y1 - y - t < 1.2) t = y1 - y;
        const k = br.range(0.84, 1), top = y + t >= y1 - 0.05;
        const bx = cx + (top ? 0 : br.range(-0.5, 0.5)), bz = cz + (top ? 0 : br.range(-0.5, 0.5)), bw = w * (top ? 1 : k), bd = d * (top ? 1 : br.range(0.84, 1));
        const byaw = yaw + (top ? 0 : br.range(-0.16, 0.16)) + ((i & 1) && opts.flip ? Math.PI : 0), cover = br.pick(BOOKS), ribbon = br.chance(0.3) ? br.pick(['#7a2f2a', '#2f5a6a', '#b8892e']) : null;
        const rnd = br(), ribbonAt = ribbon ? br() : 0.5; if (top) br();
        emitBook(K, bx, y, bz, bw, t, bd, byaw, cover, rnd, { ribbon, ribbonAt });
        y += t; i++;
      }
    };
    const BOOK_PARS = /* glsl */`
      varying vec4 vBk;
      float bkLine(float d, float w, float aa) { return 1.0 - smoothstep(w, w + aa, abs(d)); }
      // a line of gilt lettering along x: blocks of several widths, some with a counter
      float bkText(vec2 p, float h, float seed, float aa) {
        float cw = h * 1.5, c = floor(p.x / cw), f = fract(p.x / cw), r = i_h21(vec2(c, seed)), r2 = fract(r * 7.3);
        float on = step(0.16, r) * smoothstep(0.1, 0.1 + aa / cw, f) * (1.0 - smoothstep(0.5 + 0.36 * r2, 0.5 + 0.36 * r2 + aa / cw, f));
        return on * (1.0 - smoothstep(h, h + aa, abs(p.y))) * (1.0 - 0.7 * step(0.5, fract(r * 13.1)) * step(abs(p.y), h * 0.3) * step(0.3, f) * step(f, 0.5));
      }`;
    const BOOK_ALBEDO = /* glsl */`
      { float bkT = floor(vIntUv.x + 0.5); vec2 fq = fwidth(vBk.xy);
        if (bkT > 0.5 && bkT < 4.5) {
          float bkR = vIntUv.y; vec2 q = vBk.xy, hq = max(vBk.zw, vec2(0.05));
          float aa = max(max(fq.x, fq.y), 0.003) * 1.4, lod = clamp(1.25 - aa * 3.0, 0.0, 1.0);
          vec3 base = diffuseColor.rgb, gilt = vec3(0.86, 0.58, 0.19);
          float gold = 0.0, gl = iGloss, metal = 0.0, e = min(hq.x - abs(q.x), hq.y - abs(q.y));
          if (bkT < 1.5 || bkT > 3.5) {
            // a cover: cloth, rubbed at the edges, a double frame with a fan in each corner
            float sc = min(hq.x, hq.y);
            float weave = 0.5 * i_n2(q * vec2(31.0, 3.0)) + 0.5 * i_n2(q * vec2(3.0, 31.0));
            base *= 0.72 + 0.56 * mix(0.5, weave, lod);
            base *= 0.78 + 0.44 * i_n2(q * 0.5 + bkR * 31.0);
            float rub = (1.0 - smoothstep(0.0, 0.14 * sc, e)) * (0.3 + 0.7 * i_n2(q * 1.7 + 5.0));
            base = mix(base, base * 1.9 + 0.03, rub * 0.55);
            float in1 = 0.17 * sc, in2 = 0.25 * sc;
            gold = max(bkLine(e - in1, 0.022 * sc, aa), bkLine(e - in2, 0.007 * sc, aa));
            vec2 cq = hq - vec2(in2) - abs(q); float cd = length(cq), cin = step(0.0, min(cq.x, cq.y));
            float ca = atan(cq.y, max(cq.x, 1.0e-3));
            float fan = (1.0 - smoothstep(0.3 * sc, 0.3 * sc + aa, cd)) * step(0.42, fract(ca * 3.82 + 0.25)) * step(0.07 * sc, cd);
            gold = max(gold, max(fan, bkLine(cd - 0.34 * sc, 0.008 * sc, aa)) * cin);
            if (bkT < 1.5) {
              if (bkR < 0.5) {              // a lozenge in the middle
                float lz = abs(q.x) / (0.34 * sc) + abs(q.y) / (0.22 * sc), la = aa / (0.22 * sc);
                gold = max(gold, max(bkLine(lz - 1.0, 0.05, la), (1.0 - smoothstep(0.62, 0.62 + la, lz)) * step(0.5, fract(lz * 4.0 + 0.25))));
              } else {                      // or a paper label, lettered in ink
                vec2 lq = q - vec2(0.0, -0.16 * hq.y), lh = vec2(0.44 * hq.x, 0.2 * hq.y); float le = min(lh.x - abs(lq.x), lh.y - abs(lq.y)), lin = smoothstep(0.0, aa, le);
                base = mix(base, vec3(0.5, 0.43, 0.29) * (0.82 + 0.36 * i_n2(lq * 3.0)), lin);
                float ink = max(bkText(lq + vec2(0.0, lh.y * 0.34), lh.y * 0.17, bkR * 91.0, aa), bkText(lq + vec2(3.0, -lh.y * 0.34), lh.y * 0.13, bkR * 57.0, aa)) * step(abs(lq.x), lh.x * 0.82);
                base = mix(base, vec3(0.045, 0.03, 0.025), ink * lin * 0.9);
                gold *= 1.0 - lin;
              }
            } else {
              // a ledger: a leather back strip and leather corners ruled in gilt, a red label twice ruled and lettered in two lines
              float sp = q.x + hq.x, cr = hq.x - q.x + hq.y - abs(q.y);
              float lea = max(1.0 - smoothstep(0.34 * sc, 0.34 * sc + aa, sp), 1.0 - smoothstep(0.62 * sc, 0.62 * sc + aa, cr));
              vec3 lcol = vec3(0.3, 0.075, 0.04) * (0.6 + 0.8 * i_n2(q * 3.0)) * (0.85 + 0.3 * i_n2(q * 23.0));
              base = mix(base, lcol, lea); gl = mix(gl, 0.4, lea);
              gold = max(gold * (1.0 - lea), max(bkLine(sp - 0.375 * sc, 0.011 * sc, aa), bkLine(cr - 0.665 * sc, 0.011 * sc, aa)));
              vec2 lq = q - vec2(0.05 * hq.x, 0.0), lh = vec2(0.52 * hq.x, 0.27 * sc); float le = min(lh.x - abs(lq.x), lh.y - abs(lq.y)), lin = smoothstep(0.0, aa, le);
              base = mix(base, vec3(0.3, 0.035, 0.03) * (0.7 + 0.6 * i_n2(lq * 2.0)), lin); gl = mix(gl, 0.42, lin);
              float lg = max(bkLine(le - 0.035 * sc, 0.012 * sc, aa), bkLine(le - 0.075 * sc, 0.005 * sc, aa));
              lg = max(lg, bkText(vec2(lq.x + 40.0, lq.y + lh.y * 0.3), lh.y * 0.2, 3.7, aa) * step(abs(lq.x), lh.x * 0.74));
              lg = max(lg, bkText(vec2(lq.x + 17.0, lq.y - lh.y * 0.34), lh.y * 0.15, 8.1, aa) * step(abs(lq.x), lh.x * 0.56));
              gold = max(gold * (1.0 - lin), lg * lin);
              // the boards between are blind-tooled in a diaper of lozenges, a small gilt dot in each
              float dd = 0.2 * sc; vec2 dq = vec2(q.x + q.y, q.x - q.y) / dd, df = fract(dq) - 0.5, df2 = fract(dq + 0.5) - 0.5;
              float plain = (1.0 - lea) * (1.0 - lin) * step(in2 + 0.02 * sc, e);
              base *= 1.0 - 0.32 * max(bkLine(df.x * dd, 0.011 * sc, aa), bkLine(df.y * dd, 0.011 * sc, aa)) * plain;
              gold = max(gold, (1.0 - smoothstep(0.03 * sc, 0.03 * sc + aa, length(df2) * dd)) * plain);
            }
          } else if (bkT < 2.5) {
            // a back: five compartments between raised bands, a lettered label, small tools, gilt rules
            float g = (q.x / hq.x) * 2.5 + 2.5, ck = floor(g), cf = fract(g) - 0.5, cw = hq.x * 0.4, bx = (0.5 - abs(cf)) * cw, vy = q.y / hq.y;
            float band = 1.0 - smoothstep(0.09, 0.09 + aa, bx), grv = smoothstep(0.09, 0.16, bx) * (1.0 - smoothstep(0.16, 0.42, bx));
            base *= 0.76 + 0.48 * i_n2(q * vec2(5.0, 9.0) + bkR * 17.0);
            base *= 1.0 - 0.34 * grv;
            base = mix(base, base * 1.5 + 0.015, band * 0.7);
            gold = bkLine(bx - 0.3, 0.035, aa) * step(abs(vy), 0.84);
            float isLab = step(abs(ck - 1.0), 0.5) + step(abs(ck - 3.0), 0.5) * step(0.5, bkR);
            vec2 lp = vec2(cf * cw, q.y);
            float lin = step(abs(cf), 0.3) * step(abs(vy), 0.76) * isLab;
            vec3 lcol = bkR < 0.33 ? vec3(0.24, 0.035, 0.03) : (bkR < 0.66 ? vec3(0.025, 0.035, 0.03) : vec3(0.04, 0.11, 0.08));
            base = mix(base, lcol, lin);
            float th = 0.07 * cw;
            float tl = max(max(bkText(vec2(q.y + 9.0, lp.x - 0.17 * cw), th, bkR * 31.0, aa), bkText(vec2(q.y + 5.0, lp.x), th, bkR * 47.0, aa)), bkText(vec2(q.y + 2.0, lp.x + 0.17 * cw), th, bkR * 73.0, aa)) * step(abs(vy), 0.6);
            float dm = abs(lp.x) + abs(lp.y) * 0.8, tool = (1.0 - isLab) * (1.0 - smoothstep(0.13 * cw, 0.13 * cw + aa, dm)) * step(0.06 * cw, dm);
            gold = max(max(gold * (1.0 - lin), tl * lin), tool);
            base *= 0.7 + 0.3 * sqrt(max(1.0 - vy * vy, 0.0));
            gl = 0.34;
          } else {
            // the leaves: page lines, gatherings, the shade of the board above; sprinkled red or gilt on some books
            float py = q.y, ln = 0.5 + 0.5 * sin(py * 64.0 + 2.5 * i_n2(vec2(q.x * 0.6, py * 7.0)));
            float sig = i_n2(vec2(py * 5.0 + bkR * 40.0, q.x * 0.15));
            base *= mix(0.9, 0.78 + 0.26 * ln, lod) * (0.84 + 0.26 * sig);
            float pg = step(0.58, bkR);
            base = mix(base, gilt * (0.5 + 0.55 * mix(0.5, ln, lod)), pg * 0.85);
            base = mix(base, vec3(0.42, 0.08, 0.06), step(bkR, 0.22) * (step(0.62, i_n2(q * vec2(7.0, 26.0) + 3.0)) * 0.75 * lod + 0.2 * (1.0 - lod)));
            base *= 0.4 + 0.6 * smoothstep(0.0, 0.8, hq.y - py);
            base *= 0.78 + 0.22 * smoothstep(0.0, 0.3, hq.y + py);
            gl = mix(gl, 0.6, pg); metal = 0.75 * pg;
          }
          diffuseColor.rgb = mix(base, gilt * (0.75 + 0.5 * i_n2(q * 9.0)), gold * (0.7 + 0.3 * lod));
          iGloss = mix(gl, 0.82, gold); iMetal = max(metal, gold * 0.9); iMat = 0.0;
        } else if (bkT > 4.5) { diffuseColor.rgb *= 0.8 + 0.3 * i_n2(vObjPos.xz * 3.0 + vObjPos.y * 5.0); }
      }`;
    const bookMaterial = (rig) => {
      const mat = patchMat(INT.propMaterial({ rig }), 'book', { pars: BOOK_PARS, albedo: BOOK_ALBEDO });
      const obc = mat.onBeforeCompile;
      mat.onBeforeCompile = (sh, r) => {
        obc.call(mat, sh, r);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aBk; varying vec4 vBk;').split('vIntUv=uv;').join('vIntUv=uv; vBk=aBk;');
      };
      return mat;
    };
    const bookMesh = (K, rig, name) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(K.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(K.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(K.C, 3));
      g.setAttribute('surf', new THREE.Float32BufferAttribute(K.S, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(K.U, 2)); g.setAttribute('aBk', new THREE.Float32BufferAttribute(K.B, 4)); g.setIndex(K.I);
      const m = new THREE.Mesh(g, bookMaterial(rig)); m.name = name; scene.add(m); return m;
    };

    // ---- room one: the table and eight cane-seat chairs, the sitting half ----
    const fr = rng.fork('furniture');
    {
      const TS = SC * 1.12, zT = ZA - 100;
      bA.add(INT.tableGeometry({ rng: fr, scale: TS, width: 2.4, depth: 1.0, height: 0.78, legs: 'turned', color: WALNUT }), { p: [0, 0, zT], r: [0, Math.PI / 2, 0] });
      await ctx.yield();
      const cg = INT.chairGeometry({ rng: fr, scale: TS, style: 'dining', color: hexMix(WALNUT, OAK, 0.3), seatColor: '#c7a96a' });
      const seats = [];
      for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) {
        const cp = [sx * (20 + fr.range(-0.6, 1.6)), 0, zT + (i - 1.5) * 15.5 + fr.range(-1, 1)], cr = -sx * Math.PI / 2 + fr.range(-0.08, 0.08);
        bA.add(cg, { p: cp, r: [0, cr, 0] }); seats.push([cp, cr]);
        if (sx > 0) await ctx.yield();
      }
      await ctx.yield();
      // SEEN FROM BELOW (the eye passes under all of this at 2.5 m): the table top is six boards on cross bearers, with a
      // glued and screwed block in each corner and two runners for a drawer; each seat has its four rails, corner blocks
      // and the woven cane of the seat between webbing
      {
        const yU = (0.78 - 0.045) * TS, BOARD = ['#7a4a2c', '#6b3f25', '#84532f', '#70442a', '#7d4d2b', '#683c22'], S_UN = sf(SU.WOOD, 0.2);
        for (let k = 0; k < 6; k++) bA.add(cbox(3.76, 0.3, 61.5, 0.08), { p: [(k - 2.5) * 3.9, yU - 0.16, zT], c: BOARD[k], surf: S_UN, tint: (X, Y, Z, c) => { c.multiplyScalar(0.86 + 0.2 * Math.sin(Z * 0.9 + k * 2.1) * Math.sin(Z * 0.23 + k)); } });
        for (let k = 0; k < 5; k++) bA.add(cbox(22.6, 1.3, 1.9, 0.25), { p: [0, yU - 0.95, zT + (k - 2) * 13.2], c: '#5a3520', surf: S_WOOD });
        for (const sx of [-1, 1]) bA.add(cbox(1.0, 0.9, 30, 0.2), { p: [sx * 5.2, yU - 2.05, zT + 14], c: '#8a6a44', surf: S_WOODM });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          bA.add(cbox(7.4, 2.0, 1.7, 0.3), { p: [sx * 9.3, yU - 1.3, zT + sz * 28.9], r: [0, sx * sz * Math.PI / 4, 0], c: '#9a7448', surf: S_WOODM });
          bA.add(cyl(0.34, 0.34, 0.3, 8), { p: [sx * 9.3, yU - 2.4, zT + sz * 28.9], c: '#c9a148', surf: S_BRASS });
        }
        await ctx.yield();
        const sh = 0.46 * TS, hw = 0.225 * TS, hd = 0.22 * TS, yS = sh - 0.035 * TS, RAILC = hexMix(WALNUT, OAK, 0.45), CANE = '#c9a868';
        for (const [cp, cr] of seats) {
          const M = new THREE.Matrix4().makeRotationY(cr).setPosition(cp[0], 0, cp[2]);
          for (const sz of [-1, 1]) bA.add(cbox(2 * hw - 2.2, 1.5, 0.7, 0.15), { p: [0, yS - 0.75, sz * (hd - 0.95)], pre: M, c: RAILC, surf: S_WOOD });
          for (const sx of [-1, 1]) bA.add(cbox(0.7, 1.5, 2 * hd - 2.2, 0.15), { p: [sx * (hw - 0.95), yS - 0.75, 0], pre: M, c: RAILC, surf: S_WOOD });
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) bA.add(cbox(3.0, 1.1, 0.8, 0.15), { p: [sx * (hw - 2.1), yS - 0.6, sz * (hd - 2.1)], r: [0, sx * sz * Math.PI / 4, 0], pre: M, c: '#a07a4c', surf: S_WOODM });
          bA.add(cbox(2 * hw - 3.4, 0.12, 2 * hd - 3.4, 0.04), { p: [0, yS - 0.08, 0], pre: M, c: CANE, surf: S_CLOTH, tint: (X, Y, Z, c) => { c.multiplyScalar(0.9 + 0.1 * Math.sin(X * 3.1) * Math.sin(Z * 3.1)); } });
          for (let k = -1; k <= 1; k++) { bA.add(cbox(1.2, 0.1, 2 * hd - 2.6, 0.03), { p: [k * 3.1, yS - 0.2, 0], pre: M, c: '#8f7446', surf: S_CLOTH }); bA.add(cbox(2 * hw - 2.6, 0.1, 1.2, 0.03), { p: [0, yS - 0.28, k * 3.1], pre: M, c: '#a08250', surf: S_CLOTH }); }
        }
      }
      await ctx.yield();
      const top = 0.78 * TS;
      bA.add(INT.vaseGeometry({ rng: fr, scale: TS, height: 0.34, color: '#e8e2d4', flowers: 12, flowerColors: ['#f4f0e6', '#f0dc8a', '#e9c9d6', '#f6efe0'] }), { p: [2, top, zT + 4] });
      await ctx.yield();
      bA.add(INT.fruitBowlGeometry({ rng: fr, scale: TS, color: '#d9d2c2' }), { p: [-3, top, zT - 16] });
      await ctx.yield();
      for (const [px, pz] of [[7, 20], [-7, 20], [7, -24], [-7, -8]]) { bA.add(INT.plateGeometry({ rng: fr, scale: TS, color: '#ece6d8', band: '#5E7FB4' }), { p: [px, top, zT + pz] }); await ctx.yield(); }
      // a lace runner hanging over the near end of the table, stirring
      bA.add(new THREE.PlaneGeometry(12, 6, 6, 4), { p: [0, top - 2.7, zT + 1.2 * TS + 0.25], c: '#d9d2bf', surf: sf(SU.FABRIC, 0.05, 0, 0, 0.6) });
      occA([0, 4, zT], 30);
    }
    await ctx.yield();
    {
      // armchair and slippers on the right of the rug, the chimneypiece, kettle and mate gourd on the left wall
      bA.add(INT.chairGeometry({ rng: fr, scale: SC * 1.05, style: 'arm', color: WALNUT, seatColor: '#7f8ea2' }), { p: [38, 0, ZA - 252], r: [0, -Math.PI / 2 - 0.35, 0] });
      occA([38, 4, ZA - 252], 13);
      await ctx.yield();
      for (const k of [0, 1]) {
        const M = new THREE.Matrix4().makeTranslation(22 + k * 3.6, 0, ZA - 262 - k * 2.5).multiply(new THREE.Matrix4().makeRotationY(-1.9 + k * 0.3));
        bA.add(blob(1, 12), { p: [0, 0.5, 0], s: [1.9, 0.5, 3.6], pre: M, c: '#8a5a48', surf: S_CLOTH });
        bA.add(blob(1, 12), { p: [0, 1.05, 1.5], s: [1.8, 0.95, 2.2], pre: M, c: '#7a4a3c', surf: S_CLOTH });
        bA.add(blob(1, 10), { p: [0, 1.0, -1.3], s: [1.35, 0.3, 1.9], pre: M, c: '#d8c8a8', surf: S_FUR });
      }
      const fx0 = -XA + 0.44 * SC * 0.5 * 1.3;
      bA.add(INT.fireplaceGeometry({ rng: fr, scale: SC * 1.3, width: 1.9, color: '#e4e0d6', hearthColor: '#6a7a8a' }), { p: [fx0, 0, ZA - 214], r: [0, Math.PI / 2, 0] });
      await ctx.yield();
      // hearth tiles
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) bA.add(cbox(5.6, 0.5, 5.6, 0.12), { p: [-XA + 14 + j * 5.8, 0.25, ZA - 228.5 + i * 5.8], c: (i + j) & 1 ? '#c9c2b2' : '#7f8fa6', surf: S_CER });
      await ctx.yield();
      // the kettle and the mate gourd with its bombilla
      bA.add(INT.teapotGeometry({ scale: SC, height: 0.26, color: '#b8bcc0' }), { p: [-XA + 20, 0.5, ZA - 207], r: [0, 0.9, 0] });
      bA.add(lathe([[0, 0], [1.3, 0.1], [2.2, 1.2], [2.3, 2.4], [1.7, 3.6], [1.25, 4.3], [1.4, 4.7], [1.2, 4.75], [1.0, 4.3], [0, 4.2]], 14), { p: [-XA + 23, 0.5, ZA - 222], c: '#6a4a2a', surf: S_WOOD });
      bA.add(lathe([[1.45, 4.5], [1.55, 4.75], [1.45, 5.0], [1.3, 5.0], [1.3, 4.5]], 14), { p: [-XA + 23, 0.5, ZA - 222], c: '#c9ccd0', surf: S_BRASS });
      bA.add(cyl(0.12, 0.12, 6, 6), { p: [-XA + 23.6, 6.4, ZA - 222], r: [0, 0, -0.35], c: '#d0d2d6', surf: S_BRASS });
      await ctx.yield();
      // book piles round the rug and against the walls
      const br = rng.fork('piles');
      for (const [x, z, w, d, h] of [[30, ZA - 300, 9, 12, 9], [-34, ZA - 318, 11, 8, 6], [44, ZA - 190, 8, 11, 12], [-46, ZA - 150, 10, 13, 7], [48, ZA - 330, 12, 9, 15], [-30, ZA - 60, 9, 12, 5], [34, ZA - 30, 10, 8, 8]])
        pile(bkA, x, z, w, d, 0, h, br.range(0, TAU), br, { flip: true });
    }
    await ctx.yield();

    // ---- the rug and the longcase clock ----
    // A wool rug of our own, so that it holds up from a hand's height: indigo field with madder guls and a medallion, a wide
    // madder border of gold lozenges between cream guard stripes, an indigo selvedge, knotted fringes, and standing pile
    // (dark at the knot, bright at the tip) wherever the eye passes close.
    const RUG = { x: -10, z: ZA - 232, w: 76, l: 124 };
    const makeRug = (RUG, rig, rr, y0, name) => {
      const rb = INT.makeBuilder(), g0 = new THREE.PlaneGeometry(RUG.w, RUG.l, 14, 22); g0.rotateX(-Math.PI / 2);
      rb.add(g0, { p: [RUG.x, y0, RUG.z], c: '#ffffff', surf: sf(SU.FABRIC, 0.03) });
      {       // the fringe: warp ends knotted in pairs (one geometry for all of them)
        const FP = [], FN = [], FC = [], k = new THREE.Color(), cA = col('#dccba2'), cB = col('#a89674');
        for (const e of [-1, 1]) for (let x = -RUG.w / 2 + 0.3; x < RUG.w / 2; x += 0.46) {
          const len = 1.5 + rr.range(0, 0.6), sk = rr.range(-0.3, 0.3), z0 = RUG.z + e * RUG.l / 2, x0 = RUG.x + x;
          FP.push(x0 - 0.13, y0 - 0.01, z0, x0 + 0.13, y0 - 0.01, z0, x0 + sk, 0.02, z0 + e * len, x0 + 0.13, y0 - 0.01, z0, x0 - 0.13, y0 - 0.01, z0, x0 + sk, 0.02, z0 + e * len);
          k.copy(cA).lerp(cB, rr());
          for (let i = 0; i < 6; i++) { FN.push(0, 1, 0); FC.push(k.r, k.g, k.b); }
        }
        const gq = new THREE.BufferGeometry();
        gq.setAttribute('position', new THREE.Float32BufferAttribute(FP, 3)); gq.setAttribute('normal', new THREE.Float32BufferAttribute(FN, 3)); gq.setAttribute('color', new THREE.Float32BufferAttribute(FC, 3));
        rb.add(gq, { surf: S_CLOTH });
      }
      const rugMat = patchMat(INT.propMaterial({ rig }), 'rug', {
        uniforms: { uRug: { value: new THREE.Vector4(RUG.x, RUG.z, RUG.w / 2, RUG.l / 2) } },
        pars: /* glsl */`
          uniform vec4 uRug;      // centre x, z, half width, half length
          // the rug, knot by knot, at rug coordinates q (metres): selvedge, guard stripes, a border of lozenges, a field of stepped guls
          vec3 tr_rug(vec2 q, float fw, out float knotK) {
            vec2 hf = uRug.zw;
            float K = 0.2, lod = clamp(1.7 - fw / K, 0.0, 1.0);              // one knot; far away the steps melt into smooth shapes
            vec2 qk = mix(q, (floor(q / K) + 0.5) * K, lod), a = abs(qk);
            float e = min(hf.x - a.x, hf.y - a.y);
            vec3 indigo = vec3(0.03, 0.042, 0.085), madder = vec3(0.2, 0.036, 0.026), cream = vec3(0.45, 0.375, 0.24), gold = vec3(0.33, 0.19, 0.045), navy = vec3(0.016, 0.02, 0.04), sage = vec3(0.1, 0.14, 0.1);
            float along = (hf.x - a.x < hf.y - a.y) ? qk.y : qk.x;
            vec3 c, mean;
            if (e < 10.0) {
              mean = mix(madder, cream, 0.38);
              if (e < 1.0) c = navy;
              else if (e < 1.6) c = cream;
              else if (e < 2.2) c = mix(madder, gold, step(0.5, fract(along / 1.2)));
              else if (e < 2.8) c = cream;
              else if (e < 8.2) {                                            // lozenges with a cream heart, small stars between them
                float t = abs(fract(along / 5.0) - 0.5) * 5.0, d = t + abs(e - 5.5) * 0.95;
                c = madder;
                c = mix(c, gold, step(d, 2.3)); c = mix(c, navy, step(d, 1.9)); c = mix(c, cream, step(d, 1.5)); c = mix(c, madder, step(d, 0.9)); c = mix(c, gold, step(d, 0.4));
                float t2 = abs(fract(along / 5.0 + 0.5) - 0.5) * 5.0, d2 = max(t2, abs(e - 5.5));
                c = mix(c, cream, step(d2, 0.5) * step(2.3, d));
              }
              else if (e < 8.8) c = cream;
              else if (e < 9.4) c = navy;
              else c = gold;
              c = mix(mean, c, clamp(1.6 - fw / 0.5, 0.0, 1.0));
            } else {
              vec2 cs = vec2(3.2, 4.0), g = qk / cs;
              float row = floor(g.y); g.x += 0.5 * mod(row, 2.0);
              vec2 f = (fract(g) - 0.5) * cs;                                // metres from the middle of this gul
              float d = abs(f.x) / 1.15 + abs(f.y) / 1.6, alt = mod(floor(g.x) + floor(row * 0.5), 2.0);
              c = indigo; mean = mix(indigo, madder, 0.3);
              c = mix(c, gold, step(d, 1.0)); c = mix(c, mix(madder, sage, alt), step(d, 0.84)); c = mix(c, cream, step(d, 0.46)); c = mix(c, navy, step(d, 0.3)); c = mix(c, gold, step(d, 0.13));
              float ds = abs(abs(f.x) - cs.x * 0.5) + abs(f.y);              // a small star between neighbours
              c = mix(c, cream, step(ds, 0.42)); c = mix(c, madder, step(ds, 0.2));
              c = mix(mean, c, clamp(1.5 - fw / 1.1, 0.0, 1.0));
            }
            vec2 kf = fract(q / K) - 0.5;
            knotK = (1.0 - 1.3 * dot(kf, kf)) * lod + (1.0 - lod) * 0.89;
            return c;
          }`,
        albedo: /* glsl */`
          { vec2 rq = vObjPos.xz - uRug.xy;
            if (abs(rq.x) < uRug.z && abs(rq.y) < uRug.w) {
              vec2 rf = fwidth(rq); float rfw = max(rf.x, rf.y), rk;
              vec3 rc = tr_rug(rq, rfw, rk);
              float nap = i_n2(rq * 0.3 + 7.0), fleck = i_n2(rq * 8.0), abr = i_n2(vec2(rq.y * 0.22, 3.0));
              rc *= rk * (0.88 + 0.26 * nap) * (0.94 + 0.14 * abr) * (1.0 + 0.16 * fleck * clamp(1.0 - rfw * 3.0, 0.0, 1.0));
              diffuseColor.rgb = rc; iMat = 2.0; iGloss = 0.03; iEmis = vec3(0.0);
              iH = (rk * 0.003 + fleck * 0.004) * clamp(1.0 - rfw * 4.0, 0.0, 1.0);
            } }`,
      });
      rugMat.polygonOffset = true; rugMat.polygonOffsetFactor = -1; rugMat.polygonOffsetUnits = -1;
      const mesh = new THREE.Mesh(rb.build(), rugMat); mesh.name = name; scene.add(mesh);
      return { object: mesh };
    };
    const rugs = makeRug(RUG, rigA, rng.fork('rug'), 0.07, 'rug');
    await ctx.yield();
    // a second, larger rug of the same family lies across the hall between the doorway and the rim of the fan (low, so that the
    // line's shadows lie on it)
    makeRug({ x: 0, z: 58, w: 124, l: 84 }, rigB, makeRng('the-toppling:rug2:' + ctx.seed), 0.022, 'hall-rug');
    await ctx.yield();
    // a long runner of the same family down the left of the hall beyond the picture, from the bird's neck to the foot of the
    // ledger tower: the canes of our last rails stand on it
    makeRug({ x: -47, z: -292, w: 31, l: 132 }, rigB, makeRng('the-toppling:rug3:' + ctx.seed), 0.03, 'hall-rug');
    await ctx.yield();
    // the box the tiles came in, left on the floor beside the runner with the spare ones: two rows still standing in it, the
    // rest tipped out, a few of them paint side up
    {
      const sp = makeRng('the-toppling:spill:' + ctx.seed), BX = -22, BZ = -252, M = new THREE.Matrix4().makeRotationY(0.42).setPosition(BX, 0, BZ), IV = hexMix(PAL[0], '#8a7a5a', 0.12);
      const PAINTS = [PAL[4], PAL[5], PAL[6], '#d9662b', PAL[2]], BOXC = '#9a7446';
      bB.add(cbox(11.4, 0.4, 7.4, 0.1), { p: [0, 0.2, 0], pre: M, c: BOXC, surf: S_WOODM });
      for (const k of [-1, 1]) { bB.add(cbox(11.4, 3.0, 0.4, 0.1), { p: [0, 1.7, k * 3.5], pre: M, c: BOXC, surf: S_WOODM, grad: [0, 3.2, 0.8, 1] }); bB.add(cbox(0.4, 3.0, 7.4, 0.1), { p: [k * 5.5, 1.7, 0], pre: M, c: hexMix(BOXC, '#3a2a14', 0.2), surf: S_WOODM, grad: [0, 3.2, 0.8, 1] }); }
      bB.add(cbox(12.2, 0.4, 8.2, 0.1), { p: [9.5, 0.2, -6.5], r: [0, 0.5, 0], pre: M, c: hexMix(BOXC, '#c9a868', 0.3), surf: S_WOODM });      // its lid, slid off
      for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) if (sp() < 0.8) bB.add(cbox(1.0, 2.0, 0.3, 0.05), { p: [-4.4 + i * 1.1, 1.4, -2.2 + r * 1.3 + sp.range(-0.1, 0.1)], r: [sp.range(-0.12, 0.12), 0, 0], pre: M, c: IV, surf: S_GLOSS });
      for (let i = 0; i < 26; i++) {
        const a = sp.range(0.3, 2.9), d = 5.5 + 15 * Math.pow(sp(), 0.8), x = BX + Math.cos(a) * d * 1.2, z = BZ + 3 + Math.sin(a) * d, yaw = sp.range(0, TAU), up = sp() < 0.55;
        const T = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
        bB.add(cbox(1.0, 0.3, 2.0, 0.05), { p: [0, 0.16, 0], pre: T, c: IV, surf: S_GLOSS });
        if (up) bB.add(cbox(0.8, 0.05, 1.8, 0.02), { p: [0, 0.33, 0], pre: T, c: sp.pick(PAINTS), surf: S_GLOSS });
        else bB.add(sph(0.09, 6, 4), { p: [0, 0.32, 0.48], pre: T, c: PAL[6], surf: S_BRASS });
      }
      occB([BX, 1.5, BZ], 6);
    }
    await ctx.yield();
    await ctx.yield();
    const clock = INT.makeClock({ rig: rigA, rng: rng.fork('clock'), kind: 'longcase', scale: SC, color: '#5e2a17', material: matA, hour: 10.1, speed: 40 });
    const CLOCK_S = sleeper === 'parrot' && !rare ? 328 : 272;      // with the parrot it stands where it is seen under the chair, past the bird
    clock.object.position.set(-XA + 0.17 * SC, 0, ZA - CLOCK_S); clock.object.rotation.y = Math.PI / 2; scene.add(clock.object);
    occA([-XA + 5, 3, ZA - CLOCK_S], 9);
    await ctx.yield();

    // ---- the sleeper on the rug: a wiry cinnamon mongrel, a tabby kitten, or a green parrot on a chair rail ----
    // Local frame: origin on the floor under the nose, +z the way the nose points, +x the animal's left (the path side).
    // The coat is laid lock by lock: tapered, kinked blades rooted on the body's ellipsoids, dark at the root and pale at the tip,
    // thickest on the side the camera passes.
    const tufts = async (b, sr, list, n, off, colour, o = {}) => {
      const P = [], N = [], C = [], k0 = new THREE.Color(), k1 = new THREE.Color(), d = new THREE.Vector3(), nn = new THREE.Vector3(), dir = new THREE.Vector3(), side = new THREE.Vector3(), fl = new THREE.Vector3();
      const tot = list.reduce((a, bl) => a + bl.hair * (bl.s[0] * bl.s[2] + bl.s[1] * bl.s[2]), 0), pale = o.pale ?? 0.2, rootK = o.root ?? 0.6;
      for (const bl of list) {
        const cnt = Math.round(n * bl.hair * (bl.s[0] * bl.s[2] + bl.s[1] * bl.s[2]) / tot), L0 = bl.len ?? 1, W0 = bl.w ?? 0.11;
        fl.fromArray(bl.flow ?? [0, -0.12, -1]);
        for (let i = 0; i < cnt; i++) {
          if ((i & 63) === 63) await ctx.yield();
          d.set(sr.gauss(), sr.gauss(), sr.gauss()).normalize();
          if (d.y < -0.6) d.y = -d.y * 0.5;                              // little on the side that lies on the floor
          if (d.x < -0.15 && sr() < (bl.bias ?? 0.6)) d.x = -d.x;        // more on the side the path is on
          d.normalize();
          const px = bl.c[0] + d.x * bl.s[0] - off[0], py = bl.c[1] + d.y * bl.s[1] - off[1], pz = bl.c[2] + d.z * bl.s[2] - off[2];
          nn.set(d.x / bl.s[0], d.y / bl.s[1], d.z / bl.s[2]).normalize();
          dir.copy(fl).add(side.set(sr.range(-0.4, 0.4), sr.range(-0.3, 0.3), sr.range(-0.3, 0.3)));
          dir.addScaledVector(nn, -dir.dot(nn)).normalize().addScaledVector(nn, sr.range(0.22, 0.5) * (bl.lift ?? 1)).normalize();
          side.crossVectors(dir, nn); if (side.lengthSq() < 1e-6) continue; side.normalize();
          const len = L0 * sr.range(0.65, 1.35), w = W0 * sr.range(0.7, 1.35), kx = sr.range(-0.5, 0.5) * w;
          const ax = px - side.x * w, ay = py - side.y * w, az = pz - side.z * w, bx = px + side.x * w, by = py + side.y * w, bz = pz + side.z * w;
          const mx = px + dir.x * len * 0.58 + nn.x * len * 0.1 + side.x * kx, my = py + dir.y * len * 0.58 + nn.y * len * 0.1 + side.y * kx, mz = pz + dir.z * len * 0.58 + nn.z * len * 0.1 + side.z * kx, mw = w * 0.5;
          const tx = px + dir.x * len - side.x * kx * 0.6, ty = py + dir.y * len - 0.06 * len - side.y * kx * 0.6, tz = pz + dir.z * len - side.z * kx * 0.6;
          P.push(ax, ay, az, bx, by, bz, mx + side.x * mw, my + side.y * mw, mz + side.z * mw, ax, ay, az, mx + side.x * mw, my + side.y * mw, mz + side.z * mw, mx - side.x * mw, my - side.y * mw, mz - side.z * mw,
            mx - side.x * mw, my - side.y * mw, mz - side.z * mw, mx + side.x * mw, my + side.y * mw, mz + side.z * mw, tx, ty, tz);
          colour(px + off[0], py + off[1], pz + off[2], k0); const v = sr.range(0.82, 1.18); k1.copy(k0).multiplyScalar(v * 1.12).lerp(o.tip ?? k0, pale * sr()); k0.multiplyScalar(rootK * v);
          const n0 = [nn.x, nn.y + 0.25, nn.z], n1 = [nn.x * 0.7 + dir.x * 0.2, nn.y * 0.7 + 0.45, nn.z * 0.7 + dir.z * 0.2];
          const put = (kc, q) => { C.push(kc.r, kc.g, kc.b); N.push(q[0], q[1], q[2]); };
          put(k0, n0); put(k0, n0); put(k1, n1); put(k0, n0); put(k1, n1); put(k1, n1); put(k1, n1); put(k1, n1); put(k1, n1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      b.add(g, { surf: o.surf ?? sf(SU.PLAIN, 0.14, 0, o.glow ?? 0.05, 0.1) });
    };
    // a lumpier ellipsoid than a sphere: the under-form of a coat
    const lump = (r, seg, amp, nz, seed) => { const g = blob(r, seg), pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = 1 + amp * nz.n3(x * 2.3 + seed, y * 2.3, z * 2.3); pa.setXYZ(i, x * k, y * k, z * k); } g.computeVertexNormals(); return g; };
    // The dog's and the kitten's coat, lock by lock. A lock is a narrow strip lying along the body's flow (root, belly, tip);
    // the hair shader draws ten separate strands of different length in it, each at least a pixel and a half wide, so the
    // coat is hair by hair up close and a ragged soft mass from across the room. uv.x = lock number + position across the
    // lock, uv.y = root to tip. One lock in five stands off the body, which makes the coat wiry.
    const hairAcc = () => ({ P: [], N: [], C: [], S: [], U: [], I: [], n: 0, id: 0 });
    const locks = async (A, sr, list, n, off, colour, o = {}) => {
      const k0 = new THREE.Color(), k1 = new THREE.Color(), k2 = new THREE.Color(), d = new THREE.Vector3(), nn = new THREE.Vector3(), dir = new THREE.Vector3(), side = new THREE.Vector3(), fl = new THREE.Vector3();
      const tot = list.reduce((a, bl) => a + bl.hair * (bl.s[0] * bl.s[2] + bl.s[1] * bl.s[2]), 0), pale = o.pale ?? 0.2, rootK = o.root ?? 0.5, glow = o.glow ?? 0.05, s0 = SU.PLAIN + 0.02 + 0.12 * 0.95;
      for (const bl of list) {
        const cnt = Math.round(n * bl.hair * (bl.s[0] * bl.s[2] + bl.s[1] * bl.s[2]) / tot), L0 = bl.len ?? 1, W0 = bl.w ?? 0.2, rows = bl.rows ?? 3;
        fl.fromArray(bl.flow ?? [0, -0.12, -1]);
        for (let i = 0; i < cnt; i++) {
          if ((i & 63) === 63) await ctx.yield();
          d.set(sr.gauss(), sr.gauss(), sr.gauss()).normalize();
          if (d.y < -0.6) d.y = -d.y * 0.5;                              // little on the side that lies on the floor
          if (d.x < -0.15 && sr() < (bl.bias ?? 0.6)) d.x = -d.x;        // more on the side the path is on
          d.normalize();
          const px = bl.c[0] + d.x * bl.s[0] - off[0], py = bl.c[1] + d.y * bl.s[1] - off[1], pz = bl.c[2] + d.z * bl.s[2] - off[2];
          nn.set(d.x / bl.s[0], d.y / bl.s[1], d.z / bl.s[2]).normalize();
          dir.copy(fl).add(side.set(sr.range(-0.35, 0.35), sr.range(-0.25, 0.25), sr.range(-0.3, 0.3)));
          dir.addScaledVector(nn, -dir.dot(nn)); if (dir.lengthSq() < 1e-6) continue; dir.normalize();
          side.crossVectors(dir, nn); if (side.lengthSq() < 1e-6) continue; side.normalize();
          const fly = sr() < (bl.fly ?? 0.2), lift = (fly ? sr.range(0.3, 0.6) : sr.range(0.04, 0.2)) * (bl.lift ?? 1);
          const len = L0 * sr.range(0.65, 1.35) * (fly ? 0.8 : 1), w = W0 * sr.range(0.75, 1.3), seed = 1 + (A.id++ % 251);
          colour(px + off[0], py + off[1], pz + off[2], k0); const v = sr.range(0.85, 1.15);
          k1.copy(k0).multiplyScalar(v); k2.copy(k0).multiplyScalar(v * 1.1).lerp(o.tip ?? k0, pale * sr()); k0.multiplyScalar(rootK * v);
          for (let r = 0; r < rows; r++) {
            const t = rows === 2 ? r : r * 0.5, a = t * len, out = len * (lift * t + 0.1 * Math.sin(Math.PI * t) - 0.03), wr = w * (r === 0 ? 0.9 : t < 1 ? 1.05 : 0.85), kc = t === 0 ? k0 : t < 1 ? k1 : k2;
            const cx = px + dir.x * a + nn.x * out, cy = py + dir.y * a + nn.y * out - 0.05 * len * t * t, cz = pz + dir.z * a + nn.z * out;
            for (const sg of [-1, 1]) {
              A.P.push(cx + side.x * wr * sg, cy + side.y * wr * sg, cz + side.z * wr * sg);
              A.N.push(nn.x + dir.x * 0.15 * t, nn.y + 0.3, nn.z + dir.z * 0.15 * t);
              A.C.push(kc.r, kc.g, kc.b); A.S.push(s0, 0, glow, 1 - 0.12 * t); A.U.push(seed + (sg < 0 ? 0.02 : 0.98), t);
            }
            if (r > 0) { const b0 = A.n + (r - 1) * 2; A.I.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2); }
          }
          A.n += rows * 2;
        }
      }
    };
    const hairGeo = (A) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(A.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(A.C, 3));
      g.setAttribute('surf', new THREE.Float32BufferAttribute(A.S, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(A.U, 2)); g.setIndex(A.I);
      return g;
    };
    const makeHairMat = (tipColor, rim, gain) => patchMat(INT.propMaterial({ rig: rigA, side: THREE.DoubleSide, sway: { dir: [1, 0, 0.3], amp: 0.004, freq: 2.2, k: 2 } }), 'hair', {
      uniforms: { uHair: { value: new THREE.Vector4(10, rim, gain, 0) }, uHairTip: { value: tipColor } },
      pars: /* glsl */`uniform vec4 uHair; uniform vec3 uHairTip;`,
      albedo: /* glsl */`
        if (vIntUv.x > 0.5) {
          float hs = floor(vIntUv.x), hx = fract(vIntUv.x) * uHair.x, hpx = fwidth(vIntUv.x) * uHair.x, hv = vIntUv.y;
          float hid = floor(hx), hf = hx - hid - 0.5;
          float r1 = i_h21(vec2(hid * 1.37 + hs * 0.613, hs * 0.071 + 2.0)), r2 = fract(r1 * 7.31 + 0.13), r3 = fract(r1 * 23.7);
          float hl = 0.42 + 0.58 * r1, ht = hv / hl;
          float kink = 0.42 * (r2 - 0.5) * sin(hv * (4.0 + 5.0 * r3) + r3 * 6.2832) * (0.3 + hv);
          float hw = max(0.3 * sqrt(max(1.0 - ht * ht, 0.0)), min(0.75 * hpx, 0.5));
          if (ht > 1.0 || abs(hf - kink) > hw) discard;
          vec3 hc = diffuseColor.rgb * (0.5 + 0.55 * r2);
          hc = mix(hc, uHairTip * (0.4 + 0.4 * ht), step(0.82, r3) * 0.6);
          diffuseColor.rgb = hc * ((0.8 + 0.25 * ht) * uHair.z);
        } else {
          vec3 hp = vObjPos;
          float u1 = i_n2(vec2(hp.x * 13.0 + hp.y * 7.0, hp.z * 1.3)), u2 = i_n2(vec2(hp.x * 31.0 - hp.y * 17.0, hp.z * 2.6 + 4.0));
          diffuseColor.rgb *= (0.55 + 0.4 * u1 + 0.25 * u2 * u2) * uHair.z;
        }
        iMat = 2.0;`,
      swap: [
        ['vec3 irr=gl_FrontFacing?vIrr:vIrrB;', 'vec3 irr=vIrr;'],
        ['#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal *= faceDirection;\n#endif'],
        ['reflectedLight.directDiffuse+=dirD*lam*(1.+fuzz*.6);', 'reflectedLight.directDiffuse+=dirD*lam*(1.+fuzz*.6)+uSunCol*sunAcc*lam*(sunSh*uHair.y*(1.-ndv)*(1.-ndv));'],
      ],
    });
    // the green parrot: asleep on the front rail of a dining chair pulled out onto the rug, fluffed up, beak sunk in its breast
    const makeParrot = async (sr, nz, g, mk, furMat) => {
      const PY = 3.75, HC = [0, PY + 4.55, 0.5], BC = [0, PY + 2.6, -0.2], GLOW = 0.1, S_F = sf(SU.PLAIN, 0.2, 0, GLOW);
      const gA = col('#3f9a3c'), gD = col('#1d6a30'), gP = col('#a4cf52'), yel = col('#f2d23e'), red = col('#d2362a'), blu = col('#2a56b8');
      const pf = (X, Y, Z, k) => {
        const n = nz.fbm3(X * 0.6, Y * 0.6, Z * 0.6, 3);
        k.copy(gA).lerp(gD, clamp(0.5 * smoothstep(0.2, -1.6, Z) + n * 0.45, 0, 1)).lerp(gP, clamp(smoothstep(0.5, 1.6, Z) * smoothstep(PY + 4.2, PY + 1.6, Y) * 0.75 - n * 0.2, 0, 1));
        k.lerp(yel, smoothstep(PY + 4.9, PY + 5.5, Y) * smoothstep(0.3, 1.1, Z) * 0.92);
        k.lerp(yel, 0.6 * smoothstep(0.75, 0.25, Math.hypot(Math.abs(X) - 1.05, Y - (PY + 4.3), Z - 0.9)));
      };
      const wf = (X, Y, Z, k) => { const n = nz.fbm3(X * 0.6, Y * 0.6, Z * 0.6, 3); k.copy(gA).lerp(gD, clamp(0.35 + n * 0.5, 0, 1)); k.lerp(red, smoothstep(-0.9, -0.3, Y) * smoothstep(0.1, 0.8, Z) * 0.9); k.lerp(blu, smoothstep(-3.0, -4.6, Y) * 0.85); };
      const chair = INT.makeBuilder(), WOODC = '#5c2f1b', WOODD = '#43200f';
      for (const [x, z] of [[-4.8, 0], [4.8, 0], [-4.8, -9.6], [4.8, -9.6]]) {
        chair.add(cyl(0.4, 0.27, 11.6, 8), { p: [x, 5.8, z], c: WOODC, surf: S_WOOD });
        chair.add(blob(0.62, 8), { p: [x, 8.6, z], s: [1, 0.6, 1], c: WOODD, surf: S_WOOD }); chair.add(blob(0.56, 8), { p: [x, 1.5, z], s: [1, 0.7, 1], c: WOODD, surf: S_WOOD });
      }
      chair.add(cyl(0.3, 0.3, 9.6, 8), { p: [0, PY - 0.3, 0], r: [0, 0, Math.PI / 2], c: WOODC, surf: S_WOOD });
      for (const x of [-4.8, 4.8]) chair.add(cyl(0.26, 0.26, 9.6, 6), { p: [x, 5.4, -4.8], r: [Math.PI / 2, 0, 0], c: WOODC, surf: S_WOOD });
      chair.add(cyl(0.26, 0.26, 9.6, 6), { p: [0, 4.6, -9.6], r: [0, 0, Math.PI / 2], c: WOODC, surf: S_WOOD });
      chair.add(box(10.4, 1.3, 0.5), { p: [0, 10.9, 0.1], c: WOODD, surf: S_WOOD }); chair.add(box(0.5, 1.3, 9.8), { p: [-5, 10.9, -4.8], c: WOODD, surf: S_WOOD }); chair.add(box(0.5, 1.3, 9.8), { p: [5, 10.9, -4.8], c: WOODD, surf: S_WOOD });
      chair.add(box(11.4, 0.8, 11.2), { p: [0, 11.9, -4.6], c: '#7c2c2a', surf: S_CLOTH });
      for (const x of [-4.8, 4.8]) chair.add(box(0.8, 13.5, 0.7), { p: [x, 18.4, -10.3], r: [-0.1, 0, 0], c: WOODC, surf: S_WOOD });
      chair.add(box(11, 1.8, 0.6), { p: [0, 24.6, -10.95], r: [-0.1, 0, 0], c: WOODD, surf: S_WOOD }); chair.add(box(3.4, 11, 0.4), { p: [0, 18.6, -10.4], r: [-0.1, 0, 0], c: WOODC, surf: S_WOOD });
      mk(chair, matA, 0, 0, 0);
      await ctx.yield();
      // feet on the rail, the fluffed body, the folded wings, the long tail hanging behind the rail
      const body = INT.makeBuilder(), chest = INT.makeBuilder(), tail = INT.makeBuilder(), eyes = INT.makeBuilder(), head = INT.makeBuilder();
      const FOOT = '#8d8676';
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
        const x = s * 0.62 + (i - 1) * 0.24, a0 = i === 1 ? -0.2 : 0.1;
        body.add(tube([[x, PY + 0.5, -0.1], [x, PY + 0.08, 0.34 + a0 * 0.2], [x, PY - 0.42, 0.3], [x, PY - 0.62, 0.02]], 0.11, 6, 5), { c: FOOT, surf: S_MATTE });
        body.add(new THREE.ConeGeometry(0.07, 0.3, 5), { p: [x, PY - 0.68, -0.12], r: [-1.9, 0, 0], c: '#2a2622', surf: S_GLOSS });
        if (i === 1) body.add(tube([[x, PY + 0.5, -0.1], [x, PY + 0.02, -0.36], [x, PY - 0.4, -0.3]], 0.1, 5, 5), { c: FOOT, surf: S_MATTE });
      }
      chest.add(lump(1, 18, 0.05, nz, 41), { p: [0, 0, 0], s: [1.75, 2.45, 1.9], surf: S_F, tint: (X, Y, Z, k) => pf(X + BC[0], Y + BC[1], Z + BC[2], k) });
      const wing = async (s) => {
        const b = INT.makeBuilder();
        b.add(lump(1, 12, 0.05, nz, 45 + s), { p: [s * 0.25, -1.9, -0.25], s: [0.42, 2.3, 1.45], r: [0.3, 0, 0], surf: S_F, tint: wf });
        for (let i = 0; i < 7; i++) {            // the primaries, laid like a closed fan down past the rail
          const gq = new THREE.BufferGeometry(), z0 = -0.2 - i * 0.2, y1 = -4.3 - i * 0.26, hw = 0.3, x = s * (0.42 + 0.03 * i), zt = z0 - 1.2 - i * 0.1;
          gq.setAttribute('position', new THREE.Float32BufferAttribute([x, -1.6, z0 + hw, x, -1.6, z0 - hw, x, y1, zt, x, -1.6, z0 - hw, x, -1.6, z0 + hw, x, y1, zt, x, -1.6, z0 + hw, x, y1 + 0.9, zt + 0.5, x, y1, zt, x, y1 + 0.9, zt + 0.5, x, -1.6, z0 + hw, x, y1, zt], 3));
          gq.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(12).fill(0).flatMap(() => [s, 0.3, 0]), 3));
          b.add(gq, { surf: S_F, tint: (X, Y, Z, k) => { k.copy(gD).lerp(blu, smoothstep(-2.6, -4.6, Y) * 0.9).multiplyScalar(0.8 + 0.3 * (i % 2)); } });
        }
        await tufts(b, sr, [{ c: [s * 0.3, -1.7, -0.2], s: [0.5, 2.1, 1.4], hair: 1, len: 0.75, w: 0.3, flow: [0, -1, -0.4], bias: 0, lift: 0.4 }], 360 * detail, [0, 0, 0], wf, { tip: gP, pale: 0.35, glow: GLOW, root: 0.5 });
        return b;
      };
      for (let i = 0; i < 5; i++) {
        const gq = new THREE.BufferGeometry(), u = i - 2, hw = 0.36, x = u * 0.3, yt = -4.9 + Math.abs(u) * 0.5, zt = -2.2 - 0.1 * Math.abs(u), zo = -0.03 * Math.abs(u);
        gq.setAttribute('position', new THREE.Float32BufferAttribute([x - hw, 0, zo, x + hw, 0, zo, x + u * 0.12, yt, zt, x + hw, 0, zo, x - hw, 0, zo, x + u * 0.12, yt, zt], 3));
        gq.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(6).fill(0).flatMap(() => [0, 0.4, 1]), 3));
        tail.add(gq, { surf: S_F, tint: (X, Y, Z, k) => { k.copy(u === 0 ? gA : gD).lerp(red, (u !== 0 ? 0.7 : 0) * smoothstep(-0.6, -1.8, Y) * smoothstep(-3.6, -2.4, Y)).lerp(yel, 0.6 * smoothstep(-3.8, -4.8, Y)); } });
      }
      await ctx.yield();
      // the head: hooked horn beak, cere, the pale bare ring round a shut eye
      head.add(lump(1, 16, 0.04, nz, 51), { s: [1.28, 1.25, 1.4], surf: S_F, tint: (X, Y, Z, k) => pf(X + HC[0], Y + HC[1], Z + HC[2], k) });
      { const gt = tube([[0, 0.2, 1.0], [0, 0.22, 1.5], [0, -0.12, 1.86], [0, -0.66, 1.8], [0, -0.98, 1.58]], 0.44, 12, 8), pa = gt.attributes.position, nrm = gt.attributes.normal, c0 = new THREE.Vector3();
        for (let i = 0; i < pa.count; i++) { const t = Math.floor(i / 9) / 12, k = 0.42 * (0.12 + 0.88 * t * t); c0.fromBufferAttribute(nrm, i); pa.setXYZ(i, pa.getX(i) - c0.x * k * 0.72, pa.getY(i) - c0.y * k, pa.getZ(i) - c0.z * k); }
        gt.computeVertexNormals();
        head.add(gt, { surf: sf(SU.PLAIN, 0.6, 0, 0.05), tint: (X, Y, Z, k) => k.set('#e2d2a4').lerp(col('#6a5a44'), smoothstep(-0.3, -0.95, Y)) }); }
      head.add(blob(1, 10), { p: [0, -0.52, 1.16], s: [0.34, 0.3, 0.42], c: '#4c443a', surf: S_GLOSS });
      head.add(blob(1, 10), { p: [0, 0.42, 1.12], s: [0.46, 0.2, 0.3], c: '#d9cfb8', surf: S_MATTE });
      for (const s of [-1, 1]) {
        head.add(blob(0.05, 6), { p: [s * 0.2, 0.44, 1.36], c: '#3a302a', surf: S_MATTE });
        head.add(blob(1, 12), { p: [s * 1.06, 0.3, 0.62], s: [0.16, 0.36, 0.38], c: '#e4dfd0', surf: S_MATTE });
        head.add(tube([[s * 1.2, 0.3, 0.9], [s * 1.25, 0.2, 0.62], [s * 1.2, 0.3, 0.34]], 0.045, 6, 4), { c: '#2a2420', surf: S_MATTE });
        eyes.add(blob(0.26, 10), { p: [s * 1.14, 0.3, 0.62], s: [0.6, 1, 1], c: '#e07a1e', surf: S_GLOSS });
        eyes.add(blob(0.14, 8), { p: [s * 1.24, 0.3, 0.62], s: [0.5, 1, 1], c: '#050404', surf: S_GLOSS });
        eyes.add(blob(0.045, 6), { p: [s * 1.31, 0.38, 0.68], c: '#ffffff', surf: sf(SU.PLAIN, 0.9, 0, 1.5) });
      }
      // the feathers: broad short blades in overlapping rows, dark at the quill and yellow-green at the edge
      await ctx.yield();
      const to = { tip: gP, pale: 0.4, glow: GLOW, root: 0.5 }, NF = 3600 * detail;
      const fb = INT.makeBuilder(), fh = INT.makeBuilder(), fc = INT.makeBuilder();
      await tufts(fb, sr, [{ c: [0, 0, 0], s: [1.75, 2.45, 1.9], hair: 1, len: 0.6, w: 0.22, flow: [0, -1, -0.15], bias: 0, lift: 0.7 }], NF * 0.62, [0, 0, 0], (X, Y, Z, k) => pf(X + BC[0], Y + BC[1], Z + BC[2], k), to);
      await ctx.yield();
      await tufts(fh, sr, [{ c: [0, 0, -0.1], s: [1.28, 1.25, 1.3], hair: 1, len: 0.36, w: 0.13, flow: [0, -0.5, -1], bias: 0, lift: 0.5 }], NF * 0.26, [0, 0, 0], (X, Y, Z, k) => pf(X + HC[0], Y + HC[1], Z + HC[2], k), to);
      await tufts(fc, sr, [{ c: [0, 0.5, -0.5], s: [1.1, 0.9, 1.1], hair: 1, len: 0.62, w: 0.2, flow: [0, 0.2, -1], bias: 0, lift: 1.3 }], NF * 0.12, [0, 0, 0], (X, Y, Z, k) => pf(X + HC[0], Y + HC[1], Z + HC[2], k), to);
      await ctx.yield();
      mk(body, matA, 0, 0, 0);
      const chestM = mk(chest, matA, BC[0], BC[1], BC[2]); mk(fb, furMat, 0, 0, 0, chestM);
      const headG = new THREE.Group(); headG.position.fromArray(HC); headG.rotation.x = 0.42; g.add(headG);
      mk(head, matA, 0, 0, 0, headG); mk(fh, furMat, 0, 0, 0, headG);
      const earM = mk(fc, furMat, 0, 0, 0, headG), eyeM = mk(eyes, matA, 0, 0, 0, headG), tailM = mk(tail, furMat, 0, PY + 1.3, -1.7);
      const pawM = mk(await wing(1), furMat, 1.5, PY + 4.3, -0.2), wing2 = mk(await wing(-1), furMat, -1.5, PY + 4.3, -0.2);
      eyeM.visible = false;
      // (half as large again on an ordinary visit, and nearer the track: the close pass is a portrait of the bird)
      const PS = rare ? 1 : 1.5;
      g.scale.setScalar(PS); g.position.set(rare ? -10.2 : -13.5, 0, ZA - (rare ? 230 + RS : 249)); g.rotation.y = rare ? 1.0 : 0.45;      // (turned so that its two near legs stand one behind the other: the far wall and the clock show between them and the bird)
      scene.add(g);
      occA([g.position.x, (PY + 2.5) * PS, g.position.z], 3.2 * PS); occA([g.position.x - 4 * PS, 12 * PS, g.position.z - 2 * PS], 7 * PS);
      return { g, chestM, earM, tailM, pawM, wing2, whM: headG, eyeM, kit: false, parrot: true, scale: PS, headY: HC[1], head: new THREE.Vector3(g.position.x, (PY + 3.6) * PS, g.position.z), hip: new THREE.Vector3(g.position.x, (PY + 3.6) * PS, g.position.z) };
    };
    const SL = await (async () => {
      const sr = rng.fork('sleeper'), nz = ctx.noise, NH = Math.round(4800 * detail);
      const furMat = INT.propMaterial({ rig: rigA, side: THREE.DoubleSide, sway: { dir: [1, 0, 0.3], amp: 0.004, freq: 2.2, k: 2 } });
      const g = new THREE.Group(); g.name = 'sleeper';
      const mk = (b, mat, x, y, z, parent = g) => { const m = new THREE.Mesh(b.build(), mat); m.position.set(x, y, z); parent.add(m); return m; };
      if (sleeper === 'parrot') return await makeParrot(sr, nz, g, mk, furMat);
      const kit = sleeper === 'kitten';
      const baseC = col(kit ? '#b39c78' : '#b06a36'), darkC = col(kit ? '#604a34' : '#7a4322'), paleC = col(kit ? '#ecdfc8' : '#e2bd92'), DARK = kit ? '#3a2e28' : '#241a16', noseC = kit ? '#c98a84' : '#2c2421';
      const GLOW = kit ? 0.17 : 0.06, S_COAT = sf(SU.PLAIN, 0.05, 0, GLOW);
      const fur = (X, Y, Z, k) => { fur0(X, Y, Z, k); k.lerp(darkC, 0.45).multiplyScalar(0.62); };       // the under-coat, seen between the locks
      const hairMat = makeHairMat(paleC.clone(), look.sunI > 8 ? 0.45 : 0.2, look.sunI > 8 ? 0.68 : 0.9);      // in full sun a pale coat burns out: the paint is darker there
      const mkH = (A, x, y, z, parent = g) => { const m = new THREE.Mesh(hairGeo(A), hairMat); m.position.set(x, y, z); parent.add(m); return m; };
      const fur0 = (X, Y, Z, k) => {
        const n = nz.fbm3(X * 0.35, Y * 0.35, Z * 0.35, 3), back = smoothstep(2.2, 4.6, Y), under = 1 - smoothstep(0.3, 1.8, Y);
        k.copy(baseC).lerp(darkC, clamp(back * 0.45 + n * 0.3, 0, 1)).lerp(paleC, clamp(under * 0.6 - n * 0.2, 0, 1));
        if (kit) { const st = Math.sin(Z * 1.5 + Math.sin(X * 0.9) * 0.8 + n * 2.0); k.lerp(darkC, smoothstep(0.25, 0.75, st) * 0.7 * smoothstep(1.2, 2.6, Y)); }
        if (Z > -1.6 && Y < 2.0) k.lerp(paleC, 0.5);
      };
      const mz = kit ? 0.6 : 1, noseZ = 0.62 * mz + (kit ? -0.25 : 0);
      const B_HEAD = { c: [0, 2.3, -3.3], s: [2.3, 2.0, 2.7], hair: 2.4, len: 0.52, w: 0.085, flow: [0, -0.1, -1] }, B_MUZ = { c: [0, 1.65, -1.2 * mz], s: [1.45, 1.2, 1.9 * mz], hair: 2.4, len: 0.34, w: 0.07, flow: [0, -0.3, -1] };
      const B_NECK = { c: [0, 3.1, -6.6], s: [3.5, 3.1, 3.6], hair: 1.3, len: 1.0, w: 0.11 }, B_HIP = { c: [-0.4, 2.8, -16.6], s: [3.9, 3.0, 4.8], hair: 1, len: 1.15, w: 0.12 };
      const B_THIGH = { c: [2.9, 1.6, -16.8], s: [1.8, 1.6, 3.4], hair: 1.3, len: 0.9, w: 0.11, flow: [0.2, -0.5, -0.8] }, B_THIGH2 = { c: [-3.0, 1.5, -16.2], s: [1.6, 1.5, 3.2], hair: 0.2 };
      const B_FPAW = { c: [-2.5, 0.85, 0.2], s: [1.05, 0.8, 1.7], hair: 1.4, len: 0.36, w: 0.07, flow: [0, -0.2, 1] }, B_HFOOT = { c: [3.4, 0.6, -13.4], s: [1.0, 0.6, 1.5], hair: 1.6, len: 0.36, w: 0.07, flow: [0, -0.2, 1] };
      const B_FLEW = { c: [1.0, 1.15, -0.7 * mz], s: [0.75, 0.8, 1.5 * mz], hair: 2.4, len: 0.36, w: 0.07, flow: [0.1, -1, -0.3], bias: 1 };
      const chestB = { c: [0, 3.25, -11.2], s: [4.2, 3.4, 5.8], hair: 1.6, len: 1.25, w: 0.12 };
      const body = INT.makeBuilder(), under = INT.makeBuilder(), chest = INT.makeBuilder(), ear = INT.makeBuilder(), tail = INT.makeBuilder(), paw = INT.makeBuilder(), wh = INT.makeBuilder(), eyes = INT.makeBuilder();
      let li = 0;
      for (const bl of [B_HEAD, B_MUZ, B_NECK, B_HIP, B_THIGH, B_THIGH2, B_FPAW, B_HFOOT]) under.add(lump(1, 18, 0.05, nz, li++ * 7.1), { p: bl.c, s: bl.s, surf: S_COAT, tint: fur });
      under.add(tube([[-2.7, 1.2, -4.6], [-2.6, 0.95, -2], [-2.5, 0.85, 0]], 0.95, 6, 8), { surf: S_COAT, tint: fur });                      // far foreleg
      await ctx.yield();
      const toes = (b, x0, y0, z0, pale) => {
        for (let i = 0; i < 4; i++) { const u = i - 1.5, zz = z0 - Math.abs(u) * 0.22;
          b.add(blob(0.4, 9), { p: [x0 + u * 0.52, y0, zz], s: [1, 0.9, 1.35], c: pale, surf: S_COAT });
          b.add(new THREE.ConeGeometry(0.1, 0.42, 6), { p: [x0 + u * 0.52, y0 - 0.12, zz + 0.62], r: [1.75, 0, 0], c: kit ? '#d8cdb8' : '#3a3028', surf: S_GLOSS });
          if (i > 0) b.add(box(0.07, 0.4, 0.7), { p: [x0 + (u - 0.5) * 0.52, y0 - 0.02, zz + 0.2], c: DARK, surf: S_MATTE }); }
      };
      toes(body, -2.5, 0.5, 1.75, kit ? '#ecdfc8' : '#e2c9a4');
      await ctx.yield();
      // the face: a modelled nose with wings and nostrils, the stop, lips, chin, whisker pads, shut eyes under their lids
      const noseS = sf(SU.PLAIN, 0.5), noseT = (X, Y, Z, k) => { k.multiplyScalar(0.75 + 0.6 * smoothstep(1.75, 2.45, Y)); };
      body.add(blob(1, 14), { p: [0, 1.95, noseZ], s: [kit ? 0.42 : 0.8, kit ? 0.34 : 0.6, 0.5], c: noseC, surf: noseS, tint: noseT });
      body.add(box(0.08, 0.62, 0.12), { p: [0, 1.36, noseZ + 0.26], c: DARK, surf: S_MATTE });
      if (!kit) under.add(lump(1, 10, 0.05, nz, 3), { p: [0, 3.05, -2.0], s: [1.5, 0.66, 1.1], surf: S_COAT, tint: fur });
      body.add(lump(1, 10, 0.04, nz, 5), { p: [0, 0.74, -0.8 * mz], s: [0.95, 0.5, 1.3 * mz], surf: S_COAT, tint: (X, Y, Z, k) => k.copy(paleC) });
      for (const s of [-1, 1]) {
        const ws = kit ? 0.52 : 1;
        body.add(blob(1, 9), { p: [s * 0.42 * ws, 1.84, noseZ + 0.12], s: [0.36 * ws, 0.32 * ws, 0.34], c: noseC, surf: noseS, tint: noseT });
        body.add(blob(1, 8), { p: [s * 0.34 * ws, 1.84, noseZ + 0.42], s: [0.15 * ws, 0.19 * ws, 0.12], c: '#0a0706', surf: S_MATTE });
        under.add(lump(1, 12, 0.05, nz, 9 + s), { p: [s * B_FLEW.c[0], B_FLEW.c[1], B_FLEW.c[2]], s: B_FLEW.s, surf: S_COAT, tint: (X, Y, Z, k) => { fur(X, Y, Z, k); k.lerp(paleC, 0.3).multiplyScalar(0.72 + 0.4 * smoothstep(0.6, 1.5, Y)); } });
        body.add(lump(1, 10, 0.04, nz, 13 + s), { p: [s * 0.9, 1.52, -0.12 * mz], s: [0.62, 0.5, 0.8 * mz], surf: S_COAT, tint: (X, Y, Z, k) => k.copy(paleC).multiplyScalar(0.95) });
        for (let i = 0; i < 6; i++) body.add(blob(0.065, 6), { p: [s * (1.36 + 0.05 * (i % 2)), 1.36 + 0.14 * (i % 3), (-0.3 + 0.22 * Math.floor(i / 3) + 0.1 * (i % 3)) * mz], c: DARK, surf: S_MATTE });
        body.add(tube([[s * 0.1, 1.3, noseZ + 0.2], [s * 0.8, 1.02, noseZ - 0.5], [s * 1.3, 1.1, noseZ - 1.5 * mz], [s * 1.45, 1.3, noseZ - 2.2 * mz]], 0.1, 8, 5), { c: DARK, surf: S_MATTE });       // the lip line
        body.add(lump(1, 10, 0.03, nz, 17 + s), { p: [s * 1.3, 3.1, -1.9], s: [0.7, 0.44, 0.52], surf: S_COAT, tint: (X, Y, Z, k) => { k.copy(darkC).multiplyScalar(0.45); } });                          // the lid
        body.add(tube([[s * 0.66, 3.0, -1.38], [s * 1.3, 2.8, -1.52], [s * 1.96, 3.04, -2.16]], 0.2, 8, 5), { c: DARK, surf: S_MATTE });                                                             // the shut eye
        body.add(tube([[s * 0.8, 3.3, -1.55], [s * 1.3, 3.42, -1.68], [s * 1.86, 3.3, -2.2]], 0.05, 8, 4), { c: hexMix(DARK, '#8a5a3a', 0.4), surf: S_MATTE });                                     // a fold above it
        eyes.add(blob(0.46, 12), { p: [s * 1.3, 3.05, -1.8], s: [1, 0.85, 0.7], c: kit ? '#9ab04a' : '#3a2412', surf: S_GLOSS });
        eyes.add(blob(0.2, 8), { p: [s * 1.3, 3.05, -1.52], s: [0.7, 1, 0.5], c: '#060404', surf: S_GLOSS });
        eyes.add(blob(0.07, 6), { p: [s * 1.3 + 0.12, 3.2, -1.44], c: '#ffffff', surf: sf(SU.PLAIN, 0.9, 0, 1.5) });
      }
      await ctx.yield();
      // the far ear lies still; the near ear, the chest, the near foreleg, the tail and the whiskers move
      const E_HAIR = { c: [0.95, -1.5, 0.2], s: [1.15, 1.95, 0.6], hair: 1, len: 0.6, w: 0.08, flow: [0.25, -1, 0.1], bias: 1 };
      const earGeo = (near) => {
        const ge = kit ? new THREE.ConeGeometry(0.95, 2.2, 5) : lump(1, 10, 0.05, nz, 21);
        return { g: ge, o: kit ? { p: [0, 1.0, 0], s: [1, 1, 0.45], surf: S_COAT, tint: (X, Y, Z, k) => k.copy(Y > 1.1 ? darkC : baseC) }
          : { p: [near * 0.75, -1.5, 0.2], s: [1.1, 1.9, 0.5], r: [0, 0, near * 0.32], surf: S_COAT, tint: (X, Y, Z, k) => k.copy(darkC).lerp(baseC, 0.15 + 0.2 * nz.n3(X, Y, Z)).multiplyScalar(0.8) } };
      };
      { const e = earGeo(-1); under.add(e.g, { ...e.o, p: [-1.9 + e.o.p[0], (kit ? 3.6 : 4.0) + e.o.p[1], -3.9 + e.o.p[2]] }); }
      { const e = earGeo(1); ear.add(e.g, e.o); }
      chest.add(lump(1, 20, 0.04, nz, 31), { p: [0, 0, 0], s: chestB.s, surf: S_COAT, tint: (X, Y, Z, k) => fur(X, Y + chestB.c[1], Z + chestB.c[2], k) });
      paw.add(tube([[0, 0.35, 0], [-0.2, 0.1, 2.8], [-0.4, 0, 5.2]], 0.95, 6, 8), { surf: S_COAT, tint: (X, Y, Z, k) => fur(X, Y + 0.9, Z, k) });
      paw.add(lump(1, 12, 0.05, nz, 35), { p: [0, 0.5, -0.2], s: [1.25, 1.3, 1.7], surf: S_COAT, tint: (X, Y, Z, k) => fur(X, Y + 0.9, Z, k) });       // the elbow
      paw.add(lump(1, 12, 0.05, nz, 37), { p: [-0.4, 0, 5.6], s: [1.1, 0.85, 1.8], surf: S_COAT, tint: (X, Y, Z, k) => k.copy(paleC).lerp(baseC, 0.5).multiplyScalar(0.8) });
      toes(paw, -0.4, -0.3, 7.15, kit ? '#ecdfc8' : '#e6d2b4');
      const tl = kit ? [[0, 0, 0], [1.6, -0.6, -2.4], [3.6, -1.0, -3.4], [5.6, -1.1, -2.6], [6.6, -1.0, -0.8]] : [[0, 0, 0], [1.2, -0.5, -2.2], [3.0, -1.0, -3.6], [5.2, -1.2, -4.0]];
      { const gt = tube(tl, kit ? 0.5 : 0.62, 14, 7), pa = gt.attributes.position, c0 = new THREE.Vector3(), nrm = gt.attributes.normal;
        for (let i = 0; i < pa.count; i++) { const t = Math.floor(i / 8) / 14, k = 1 - (kit ? 0.3 : 0.75) * t * t; c0.fromBufferAttribute(nrm, i); pa.setXYZ(i, pa.getX(i) - c0.x * 0.62 * (1 - k), pa.getY(i) - c0.y * 0.62 * (1 - k), pa.getZ(i) - c0.z * 0.62 * (1 - k)); }
        tail.add(gt, { surf: S_COAT, tint: (X, Y, Z, k) => { k.copy(baseC).lerp(darkC, kit ? smoothstep(0.2, 0.8, Math.sin(Z * 2.2 + X * 2.2)) * 0.8 : 0.3).multiplyScalar(0.7); } }); }
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
        const brow = i >= 5, a = brow ? 0.9 + (i - 5) * 0.3 : (i - 2) * 0.2, len = (brow ? 1.3 : 2.5 + sr.range(-0.5, 0.5)) * (kit ? 1.25 : 1), gw = new THREE.BufferGeometry();
        const x0 = s * (brow ? 1.0 : 0.95), y0 = brow ? 3.45 : 1.42 + i * 0.07, z0 = brow ? -1.7 : (noseZ - 0.45) * (kit ? 1 : 1), hw = 0.075;
        const tx = x0 + s * len * Math.cos(a) * 0.92, ty = y0 + len * Math.sin(a) * 0.6 - 0.15, tz = z0 - len * 0.3;
        gw.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0 - hw, z0, x0, y0 + hw, z0, tx, ty, tz, x0, y0 + hw, z0, x0, y0 - hw, z0, tx, ty, tz], 3));
        gw.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.3, 1, 0, 0.3, 1, 0, 0.3, 1, 0, 0.3, 1, 0, 0.3, 1, 0, 0.3, 1], 3));
        wh.add(gw, { c: '#f8f3e8', surf: sf(SU.PLAIN, 0.3, 0, 0.4) });
      }
      await ctx.yield();
      // the coat
      const tipC = paleC, to = { tip: tipC, glow: GLOW, pale: kit ? 0.3 : 0.24 }, K = kit ? 0.8 : 1;
      const hBody = hairAcc(), hChest = hairAcc(), hPaw = hairAcc(), hEar = hairAcc(), hTail = hairAcc();
      const lk = (bl) => { const short = (bl.len ?? 1) < 0.6; return { ...bl, len: (bl.len ?? 1) * K * (short ? 1.15 : 1), w: short ? 0.13 : 0.21, rows: short ? 2 : 3, lift: bl.lift ?? 1, fly: short ? 0.06 : 0.14 }; };
      await locks(hBody, sr, [B_HEAD, B_MUZ, B_FLEW, B_FPAW].map(lk), NH * 0.3, [0, 0, 0], fur0, to); await ctx.yield();
      await locks(hBody, sr, [B_NECK, B_HIP, B_THIGH, B_THIGH2, B_HFOOT].map(lk), NH * 0.31, [0, 0, 0], fur0, to); await ctx.yield();
      await locks(hChest, sr, [lk(chestB)], NH * 0.21, chestB.c, fur0, to); await ctx.yield();
      await locks(hPaw, sr, [{ c: [0, 0.5, -0.2], s: [1.25, 1.3, 1.7], hair: 1.2, len: 0.8 * K, w: 0.17, flow: [0, -0.3, 1] }, { c: [-0.2, 0.2, 2.6], s: [1.0, 0.95, 3.0], hair: 1.3, len: 0.55 * K, w: 0.13, rows: 2, flow: [0, -0.15, 1], fly: 0.1 }, { c: [-0.4, 0, 5.6], s: [1.1, 0.85, 1.8], hair: 1.4, len: 0.36 * K, w: 0.12, rows: 2, flow: [0, -0.2, 1], fly: 0.05 }], NH * 0.11, [0, 0, 0], (X, Y, Z, k) => { fur0(X, Y + 0.9, Z, k); k.lerp(baseC, 0.5); if (Z > 4.2) k.lerp(paleC, 0.35); }, to);
      if (!kit) await locks(hEar, sr, [{ ...E_HAIR, len: 0.7, w: 0.13, rows: 2, fly: 0.1 }], NH * 0.045, [0, 0, 0], (X, Y, Z, k) => k.copy(darkC).lerp(baseC, 0.15).multiplyScalar(0.85), { ...to, pale: 0.05 });
      await locks(hTail, sr, tl.slice(0, -1).map((p, i) => ({ c: [(p[0] + tl[i + 1][0]) / 2, (p[1] + tl[i + 1][1]) / 2, (p[2] + tl[i + 1][2]) / 2], s: [1.3, 0.66, 1.3], hair: 1, len: (kit ? 0.5 : 1.0), w: 0.16, flow: [tl[i + 1][0] - p[0], 0, tl[i + 1][2] - p[2]], bias: 0 })), NH * 0.05, [0, 0, 0], (X, Y, Z, k) => k.copy(baseC).lerp(darkC, 0.3), to);
      await ctx.yield();
      mk(body, matA, 0, 0, 0); mk(under, hairMat, 0, 0, 0); await ctx.yield(); mkH(hBody, 0, 0, 0); await ctx.yield();
      const chestM = mk(chest, hairMat, chestB.c[0], chestB.c[1], chestB.c[2]); mkH(hChest, 0, 0, 0, chestM);
      const earM = mk(ear, hairMat, 1.9, kit ? 3.6 : 4.0, -3.9), tailM = mk(tail, hairMat, 0, 1.9, -20.6), pawM = mk(paw, hairMat, 2.7, 0.9, -4.6), whM = mk(wh, furMat, 0, 0, 0), eyeM = mk(eyes, matA, 0, 0, 0);
      mkH(hPaw, 0, 0, 0, pawM); mkH(hTail, 0, 0, 0, tailM); if (!kit) mkH(hEar, 0, 0, 0, earM);
      eyeM.visible = false;
      // It lies in the third window's sun shape with its head toward us, turned a little to the path. On the rare visit it lies
      // further off, clear of the second line it is about to start.
      const scale = kit ? 0.95 : 1.25, yaw = 0.32;
      // On the rare visit it lies on a pouffe as high as the atlas beside it, so that the eye meets it face to face and its paw is
      // level with the first tile of the second line.
      const LIFT = rare ? 4.4 : 0;
      g.scale.setScalar(scale); g.position.set(rare ? (kit ? -9.6 : -10.6) : (kit ? -8.4 : -9.5), LIFT, ZA - 240 - RS); g.rotation.y = yaw;
      scene.add(g);
      if (rare) {
        const c = Math.cos(yaw), sn = Math.sin(yaw), lx = -1.3 * scale, lz = -10.5 * scale, px = g.position.x + lx * c + lz * sn, pz = g.position.z - lx * sn + lz * c;
        bA.add(cbox(9.2 * scale, LIFT - 0.05, 24 * scale, 0.9), { p: [px, (LIFT - 0.05) / 2, pz], r: [0, yaw, 0], c: '#b8892e', surf: sf(SU.FABRIC, 0.25) });
        bA.add(cbox(9.45 * scale, 0.4, 24.25 * scale, 0.2), { p: [px, LIFT - 0.5, pz], r: [0, yaw, 0], c: '#6a3a2a', surf: sf(SU.FABRIC, 0.2) });
        bA.add(cbox(9.45 * scale, 0.4, 24.25 * scale, 0.2), { p: [px, 0.5, pz], r: [0, yaw, 0], c: '#6a3a2a', surf: sf(SU.FABRIC, 0.2) });
      }
      occA([g.position.x - 12 * scale * Math.sin(yaw), 1.5, g.position.z - 12 * scale * Math.cos(yaw)], 9.5 * scale);
      return { g, chestM, earM, tailM, pawM, whM, eyeM, kit, parrot: false, scale, head: new THREE.Vector3(g.position.x + 0.3, LIFT + 2.5 * scale, g.position.z - 2.6 * scale),
        hip: new THREE.Vector3(g.position.x - 15 * scale * Math.sin(yaw) + 1, LIFT + 3.6 * scale, g.position.z - 15 * scale * Math.cos(yaw)) };
    })();
    await ctx.yield();

    // ---- what the marble and the line stand on ----
    const tangentAt = (s) => { const a = A.station(s - 0.5, tmpP), ax = a.x, az = a.z, b = A.station(s + 0.5, tmpP); let tx = b.x - ax, tz = b.z - az; const l = Math.hypot(tx, tz) || 1; return [tx / l, tz / l]; };
    const eyeAt = (s) => { const p = A.station(s, tmpP); return [p.x, p.y, p.z]; };
    const RAIL = 2.1, PLANK = RAIL + 0.9;                 // rails below the eye; top of the ramp's yardstick plank below the eye
    const CATCH0 = LAND - 8, CATCH1 = LAND + 24, CATCH_Y = eyeAt(LAND + 16)[1] - PLANK - 0.5;     // the shoehorn and the pile it lies on
    const STAIR0 = LAND + 32, STAIR1 = TOP_S, STEP = (STAIR1 - STAIR0) / 14;
    const stepTop = (s) => baseY(STAIR0 + Math.floor((s - STAIR0) / STEP) * STEP) - 0.3;
    const ground = (s) => (s < 235 ? 0 : s < 275 ? Math.max(0, baseY(s) - 0.28) : s < RAMP_S + 6 ? baseY(s) : s <= LIP + 1 ? eyeY(s) - PLANK
      : s < STAIR0 ? CATCH_Y : s < STAIR1 ? stepTop(s) : baseY(s));
    const onTrack = (s) => s <= LIP + 0.01 || s >= CATCH0 + 8;
    const F_PIERS = [770, 792, 814], T_PIERS = [834, 850, 866];      // beyond the shoehorn the rails span from cane to cane: three tall ones on the floor, three short ones on the ledger
    const BOXWOOD = hexMix(PAL[1], PAL[0], 0.45), BOXWOOD2 = hexMix(PAL[1], PAL[0], 0.3), BRASS = hexMix(PAL[6], '#8a5a1a', 0.3);
    const br = rng.fork('books');
    const qR = new THREE.Quaternion(), vA = new THREE.Vector3(), vB = new THREE.Vector3(), vY = new THREE.Vector3(0, 1, 0), mR = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
    const rod = (b, p0, p1, r, c, surf) => { vA.fromArray(p0); vB.fromArray(p1); const len = vA.distanceTo(vB); vB.sub(vA).normalize(); qR.setFromUnitVectors(vY, vB); vA.addScaledVector(vB, len / 2); mR.compose(vA, qR, one); b.add(cyl(r, r, len, 6), { m: mR, c, surf }); };
    // a squared timber between two points (w across, d the other way), for the stepladder
    const beam = (b, p0, p1, w, d, c, surf = S_WOOD) => { vA.fromArray(p0); vB.fromArray(p1); const len = vA.distanceTo(vB); vB.sub(vA).normalize(); qR.setFromUnitVectors(vY, vB); vA.addScaledVector(vB, len / 2); mR.compose(vA, qR, one); b.add(cbox(w, len, d, 0.12), { m: mR, c, surf }); };
    {
      // the track: two brass stair rods on pencil sleepers, on cotton reels where it runs low and on pencil trestles where it
      // rides high. It stops at the lip in the doorway and begins again in the shoehorn beyond the bird.
      const railGeo = (b, s0, s1) => {
        const P = [], N = [], I = []; let n = 0;
        for (const side of [-0.36, 0.36]) {
          const start = n / 1;
          for (let s = s0; s <= s1 + 0.01; s += 2) {
            const e = eyeAt(Math.min(s, 879.5)), t = tangentAt(Math.min(s, 879)), rx = -t[1], rz = t[0], cx = e[0] + rx * side, cy = e[1] - RAIL, cz = e[2] + rz * side;
            for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, ox = Math.cos(a) * 0.085, oy = Math.sin(a) * 0.085; P.push(cx + rx * ox, cy + oy, cz + rz * ox); N.push(rx * Math.cos(a), Math.sin(a), rz * Math.cos(a)); }
            if (n > start) for (let k = 0; k < 4; k++) { const a0 = n - 4 + k, a1 = n - 4 + (k + 1) % 4, b0 = n + k, b1 = n + (k + 1) % 4; I.push(a0, b0, a1, a1, b0, b1); }
            n += 4;
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
        b.add(g, { c: BRASS, surf: S_BRASS });
      };
      railGeo(bT, 0, LIP); railGeo(bB, CATCH0 + 8, 880);
      const PENCIL = ['#c9a23c', '#5E7FB4', '#b9b3a2', '#8a6a52', '#6f8a7a'], THREAD = ['#d8d0bc', '#8fa2be', '#b89a5e', '#9aa890', '#c7b8a8'];
      for (let s = 6, i = 0; s < 878; s += 4, i++) {
        if (!onTrack(s)) continue;
        const e = eyeAt(s), t = tangentAt(s), yaw = Math.atan2(t[0], t[1]), b = inA(e[2]) || s <= LIP + 1 ? bT : bB, y = e[1] - RAIL - 0.17;
        if (s > LIP + 1) { b.add(cyl(0.045, 0.045, 0.96, 5), { p: [e[0], y + 0.1, e[2]], r: [0, yaw, Math.PI / 2], c: BRASS, surf: S_BRASS }); continue; }      // beyond the leap the rails span from pier to pier: slim brass ties only
        b.add(cyl(0.11, 0.11, 1.9, 6), { p: [e[0], y, e[2]], r: [0, yaw, Math.PI / 2], c: PENCIL[i % PENCIL.length], surf: S_GLOSS });
        b.add(new THREE.ConeGeometry(0.11, 0.3, 6), { p: [e[0] - t[1] * 1.1, y, e[2] + t[0] * 1.1], r: [0, yaw, Math.PI / 2], c: '#e9d8b0', surf: S_WOODM });
        const g0 = ground(s), h = y - 0.11 - g0;
        if (i % 2 === 0 && h > 0.25) { const n = Math.max(1, Math.min(5, Math.round(h / 1.25))); for (let k = 0; k < n; k++) reel(b, e[0], g0 + k * h / n, e[2], h / n, 0.5, THREAD[((i >> 1) + k) % THREAD.length], BOXWOOD2); }
        if ((i & 7) === 0) await ctx.yield();
      }
      // yardsticks (inch marks as inlaid strips): two beside the hero's where the run leaves the floor, and the plank of the ramp
      const stick = (b, s0, s1, off, yFn = baseY, hw = 0.86) => {
        let prev = null;
        for (let s = s0; s <= s1 + 0.01; s += 2.2) {
          const e = eyeAt(Math.min(s, 879.5)), t = tangentAt(Math.min(s, 879)), rx = -t[1], rz = t[0], y = yFn(Math.min(s, 879.5)) + 0.02;
          const cur = { s, L: [e[0] + rx * (off - hw), y, e[2] + rz * (off - hw)], R: [e[0] + rx * (off + hw), y, e[2] + rz * (off + hw)] };
          if (prev) {
            const c = (Math.floor(prev.s / 22.9) & 1) ? BOXWOOD : BOXWOOD2, dn = (q) => [q[0], q[1] - 0.26, q[2]];
            b.quad(prev.L, prev.R, cur.R, cur.L, c, S_WOODG); b.quad(prev.L, cur.L, dn(cur.L), dn(prev.L), hexMix(c, '#3a2a14', 0.25), S_WOOD);
            b.quad(cur.R, prev.R, dn(prev.R), dn(cur.R), hexMix(c, '#3a2a14', 0.25), S_WOOD); b.quad(dn(prev.L), dn(cur.L), dn(cur.R), dn(prev.R), hexMix(c, '#3a2a14', 0.4), S_WOODM);
            const up = (q, f) => [lerp(prev.R[0], prev.L[0], f) * (1 - q) + lerp(cur.R[0], cur.L[0], f) * q, lerp(prev.R[1], cur.R[1], q) + 0.012, lerp(prev.R[2], prev.L[2], f) * (1 - q) + lerp(cur.R[2], cur.L[2], f) * q];
            for (const q of [0.125, 0.375, 0.625, 0.875]) { const tl = q < 0.2 ? 0.34 : q > 0.6 && q < 0.7 ? 0.24 : 0.15; b.quad(up(q - 0.011, 0.03), up(q + 0.011, 0.03), up(q + 0.011, tl), up(q - 0.011, tl), '#4a321c', S_MATTE); }
            b.quad(up(0, 0), up(1, 0), up(1, 0.022), up(0, 0.022), '#5a3c20', S_MATTE); b.quad(up(0, 0.978), up(1, 0.978), up(1, 1), up(0, 1), '#5a3c20', S_MATTE);
          }
          prev = cur;
        }
      };
      stick(bA, 275, LIP - 12, 0); stick(bA, 275, LIP - 12, 2.0);
      await ctx.yield();
      stick(bA, RAMP_S + 2, LIP + 0.6, 0, (s) => eyeY(s) - PLANK, 1.0);
      await ctx.yield();
      // book piers under the deck; two gates of tall piles with a yardstick across that carry the plank; piles under the line where it
      // steps down to the hall floor
      for (const s of [318, 339]) pile(bkA, 2.2, ZA - s, 6.8, 5.6, 0, DECK - 0.26, br.range(-0.06, 0.06), br, { flip: true });
      await ctx.yield();
      // (two gates carry the plank: a yardstick across two long pencils, each stood in a cotton reel on a low pile, so that
      // the doorway and the hall beyond are seen between and over them)
      const voidK = mkBk();
      for (const s of [316.5, 336]) {
        const yb = eyeY(s) - PLANK - 0.26, hp = s < 320 ? 4.4 : 6.6, gx = s < 320 ? 10.2 : 11.2;
        for (const sx of [-1, 1]) {
          pile(voidK, sx * 9.6, ZA - s, 6, 7.4, 0, yb - 0.3, br.range(-0.1, 0.1), br, { flip: true, tMin: 2.4, tMax: 3.8 });      // (the draws of the tall piles that stood here)
          if (s > 320) continue;                 // the second gate is gone: from the first to the stepladder the plank spans free, and the doorway is clear
          pile(bkA, sx * gx, ZA - s, 6, 7.4, 0, hp, xr.range(-0.1, 0.1), xr, { flip: true, tMin: 2.0, tMax: 2.6 });
          reel(bA, sx * gx, hp, ZA - s, 1.5, 1.0, sx < 0 ? '#8fa2be' : '#b89a5e', BOXWOOD2);
          const pc = sx < 0 ? '#c9a23c' : '#a8584a', y0 = hp + 0.5, y1 = yb - 0.3;
          bA.add(cyl(0.34, 0.34, y1 - y0 - 1.5, 6), { p: [sx * gx, (y0 + y1 - 1.5) / 2, ZA - s], c: pc, surf: S_GLOSS });
          bA.add(cyl(0.36, 0.36, 0.7, 8), { p: [sx * gx, y1 - 1.15, ZA - s], c: BRASS, surf: S_BRASS });
          bA.add(cyl(0.33, 0.33, 0.8, 8), { p: [sx * gx, y1 - 0.4, ZA - s], c: '#d8a09a', surf: S_MATTE });
        }
        if (s < 320) rod(bA, [-gx - 0.8, yb - 0.16, ZA - s], [gx + 0.8, yb - 0.16, ZA - s], 0.15, BRASS, S_BRASS);      // a brass stair rod across, under the plank
        await ctx.yield();
      }
      for (const s of [LIP - 5, LIP + 6]) pile(bkA, 4.2, ZA - s, 5.6, 6.4, 0, baseY(s + 3.2) - 0.26, br.range(-0.1, 0.1), br, { flip: true });
      await ctx.yield();
      // The lip of the ramp stands on a pair of garden canes in cotton reels on fat books, a brass rod across them
      // under the plank: slim things, so that the doorway and the hall beyond are seen whole (a stepladder stood here once)
      for (const [sC, k0] of [[LIP - 7, 0]]) {
        const yT = eyeY(sC) - PLANK - 0.26, zc = ZA - sC, CANE_C = '#b9a064';
        for (const sx of [-1, 1]) {
          const x = sx * 2.5;
          bA.add(cbox(5.2, 2.6, 6.4, 0.3), { p: [x * 1.5, 1.3, zc], r: [0, sx * 0.2, 0], c: sx < 0 ? '#7a2e2a' : '#263a6e', surf: S_CLOTH });
          bA.add(cbox(4.6, 1.9, 5.9, 0.1), { p: [x * 1.5 + 0.2, 1.3, zc + 0.1], r: [0, sx * 0.2, 0], c: '#e4dac0', surf: S_PAPER });
          reel(bA, x, 2.6, zc, 1.5, 1.0, ['#8fa2be', '#b89a5e', '#9aa890', '#d8d0bc'][(k0 * 2 + (sx > 0 ? 1 : 0)) % 4], BOXWOOD2);
          bA.add(cyl(0.2, 0.27, yT - 2.6, 6), { p: [x, (yT + 2.6) / 2, zc], c: CANE_C, surf: S_WOODM });
          for (let y = 7; y < yT - 1; y += 5.2) bA.add(cyl(0.31, 0.31, 0.22, 6), { p: [x, y, zc], c: hexMix(CANE_C, '#3a2a10', 0.5), surf: S_WOODM });
        }
        rod(bA, [-3.2, yT - 0.16, zc], [3.2, yT - 0.16, zc], 0.15, BRASS, S_BRASS);
      }
      occA([0, 2, ZA - (LIP - 7)], 5);
      // THE SHOEHORN: a brass scoop that catches the marble out of the air and lets it down onto the rails
      {
        // (polished brass: a bright rolled rim, an engraved line inside it, a fluted bowl; its back is darker)
        const NS = 14, S_HORN = sf(SU.PLAIN, 0.72, 0.4, 0.14), rimL = [], rimR = [];
        const horn = (ka, kb, cIn, cOut) => {
          const P = [], N = [], I = []; let n = 0, row = 0; const nk = kb - ka;
          for (let s = CATCH0; s <= CATCH0 + 24.01; s += 1.0, row++) {
            const e = eyeAt(s), q = (s - CATCH0) / 24, rad = lerp(1.9, 0.95, smoothstep(0, 1, q)), arc = lerp(1.5, 1.15, q), cy = e[1] - RAIL + rad - 0.3 - 1.2 * (1 - q) * (1 - q);
            for (let k = ka; k <= kb; k++) { const a = -arc + 2 * arc * k / NS, sx = Math.sin(a), cs = Math.cos(a); P.push(e[0] + sx * rad, cy - cs * rad, e[2]); N.push(-sx, cs, 0);
              if (k === 0) rimL.push([e[0] + sx * rad, cy - cs * rad, e[2]]); if (k === NS) rimR.push([e[0] + sx * rad, cy - cs * rad, e[2]]); }
            if (row > 0) for (let k = 0; k < nk; k++) { const a0 = n - (nk + 1) + k, b0 = n + k; I.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
            n += nk + 1;
          }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
          bB.add(g, { c: cIn, surf: S_HORN, tint: (X, Y, Z, k) => { k.multiplyScalar(0.86 + 0.14 * Math.sin(Z * 2.6)); } });
          const g2 = g.clone(); g2.index.array.reverse(); const na = g2.attributes.normal; for (let i = 0; i < na.count; i++) na.setXYZ(i, -na.getX(i), -na.getY(i), -na.getZ(i));
          bB.add(g2, { c: cOut, surf: S_HORN });
        };
        const HB1 = '#f0c860', HB2 = '#6e4a12', HB3 = '#d9a62b', HBK = hexMix(BRASS, '#3a2a10', 0.2);
        horn(0, 1, HB1, HBK); horn(1, 2, HB2, HBK); horn(2, 6, HB3, HBK); horn(6, 8, hexMix(HB3, '#fff0c0', 0.3), HBK); horn(8, 12, HB3, HBK); horn(12, 13, HB2, HBK); horn(13, 14, HB1, HBK);
        for (const rim of [rimL, rimR]) bB.add(tube(rim.filter((p, i) => (i % 3) === 0 || i === rim.length - 1), 0.11, 16, 6), { c: '#f6d67a', surf: S_HORN });
      }
    }
    await ctx.yield();

    // ---- the open atlas: a propped page we climb (s 235..275) and a level page beyond (to s 303), the map printed on it ----
    {
      const X0 = -4.6, X1 = 17, S0 = 235, S1 = 303, NX = 40, NS = 68, nz = ctx.noise;
      const pg = (s) => (s < 275 ? Math.max(0.06, DECK * smoothstep(235, 275, s) - 0.28) : DECK - 0.28);
      const P = [], N = [], C = [], I = [], k = new THREE.Color();
      const sea = col('#b4ccd4'), deep = col('#8fb0c4'), ink = col('#4a3a2a'), cream = col('#e9e0c4'), lands = ['#e2d6a8', '#d6c18a', '#c8d0a0', '#e0b89e', '#d8cfae'].map(col);
      for (let j = 0; j <= NS; j++) for (let i = 0; i <= NX; i++) {
        if (i === 0 && (j & 3) === 0) await ctx.yield();      // a few rows of the map at a time
        const x = lerp(X0, X1, i / NX), s = lerp(S0, S1, j / NS), y = pg(s) - 0.5 * Math.pow(Math.abs(s - 275) < 3 ? 1 - Math.abs(s - 275) / 3 : 0, 2);
        P.push(x, y, ZA - s); N.push(0, 1, 0);
        const e = nz.fbm2(x * 0.07 + 3, s * 0.07, 4) + 0.12, mar = Math.min(x - X0, X1 - x, s - S0, S1 - s, Math.abs(s - 275) + 0.6);
        if (e > 0) { k.copy(lands[Math.floor((nz.n2(x * 0.045 + 9, s * 0.045) * 0.5 + 0.5) * 4.99)]).multiplyScalar(0.92 + 0.1 * nz.n2(x * 0.5, s * 0.5)); k.lerp(ink, 0.6 * (1 - smoothstep(0, 0.035, e))); }
        else k.copy(sea).lerp(deep, smoothstep(0, 0.4, -e));
        const gx = Math.abs(((x + 100) % 5) - 2.5), gs = Math.abs((s % 5) - 2.5);
        k.lerp(ink, 0.22 * (1 - smoothstep(2.2, 2.45, Math.max(gx, gs))));
        if (mar < 1.6) k.copy(cream); else if (mar < 1.95) k.copy(ink).lerp(cream, 0.3);
        k.multiplyScalar(0.72 + 0.28 * smoothstep(0, 5, Math.abs(s - 275)));
        C.push(k.r, k.g, k.b);
      }
      for (let j = 0; j < NS; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; I.push(a, b, d, a, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      bA.add(g, { surf: S_PAPER });
      await ctx.yield();
      // what is printed sharp on the map: a ruled border, the graticule, place names in small type, a compass star
      {
        const yP = (ss) => pg(ss) - 0.5 * Math.pow(Math.abs(ss - 275) < 3 ? 1 - Math.abs(ss - 275) / 3 : 0, 2) + 0.035, INK = '#3a2c20', SEP = '#7a5a3c', RED = '#a8402e';
        const lineS = (x, hw, sa, sb, c) => { for (let a = sa; a < sb - 0.01; a += 2) { const b2 = Math.min(a + 2, sb); bA.quad([x - hw, yP(a), ZA - a], [x + hw, yP(a), ZA - a], [x + hw, yP(b2), ZA - b2], [x - hw, yP(b2), ZA - b2], c, S_PAPER); } };
        const lineX = (ss, hw, xa, xb, c) => bA.quad([xa, yP(ss - hw), ZA - ss + hw], [xb, yP(ss - hw), ZA - ss + hw], [xb, yP(ss + hw), ZA - ss - hw], [xa, yP(ss + hw), ZA - ss - hw], c, S_PAPER);
        for (const [m, hw] of [[1.3, 0.13], [1.75, 0.05]]) { lineS(X0 + m, hw, S0 + m, S1 - m, INK); lineS(X1 - m, hw, S0 + m, S1 - m, INK); lineX(S0 + m, hw, X0 + m, X1 - m, INK); lineX(S1 - m, hw, X0 + m, X1 - m, INK); }
        await ctx.yield();
        for (let x = 0; x < X1 - 2; x += 5) lineS(x, 0.045, S0 + 1.75, S1 - 1.75, SEP);
        await ctx.yield();
        for (let ss = 240; ss < S1 - 2; ss += 5) lineX(ss, 0.045, X0 + 1.75, X1 - 1.75, SEP);
        const ar = makeRng('the-toppling:atlas:' + ctx.seed);
        for (let i = 0; i < 26; i++) {       // place names: a few words of small type, some in red
          const x = ar.range(X0 + 3, X1 - 6), ss = ar.range(S0 + 4, S1 - 4), h = ar.range(0.1, 0.2), c = ar.chance(0.2) ? RED : INK; let cx = x;
          for (let w = 0, nw = ar.int(1, 3); w < nw; w++) { const len = ar.range(0.5, 1.5); lineX(ss, h, cx, cx + len, c); cx += len + 0.3; }
          if (ar.chance(0.6)) lineX(ss + 0.02, 0.24, x - 0.75, x - 0.27, c);       // the town's dot
        }
        const cxs = 12.6, css = 251;       // the compass star
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, L = k & 1 ? 1.3 : 2.4, dx = Math.sin(a), ds = Math.cos(a), px = -ds * 0.28, ps = dx * 0.28;
          bA.quad([cxs + px, yP(css + ps), ZA - css - ps], [cxs + dx * L, yP(css + ds * L), ZA - css - ds * L], [cxs + dx * L, yP(css + ds * L), ZA - css - ds * L], [cxs - px, yP(css - ps), ZA - css + ps], k & 1 ? SEP : (k & 2 ? RED : INK), S_PAPER); }
      }
      await ctx.yield();
      // page block edges and the cover board
      const edge = (xa, sa, xb, sb) => {
        const ya = pg(sa), yb = pg(sb), la = Math.max(0, ya - 1.7), lb = Math.max(0, yb - 1.7), ca = Math.max(0, ya - 2.2), cb2 = Math.max(0, yb - 2.2);
        bA.quad([xa, ya, ZA - sa], [xa, la, ZA - sa], [xb, lb, ZA - sb], [xb, yb, ZA - sb], '#dcd2b4', S_CLOTH);
        bA.quad([xa, la, ZA - sa], [xa, ca, ZA - sa], [xb, cb2, ZA - sb], [xb, lb, ZA - sb], '#4a5670', S_CLOTH);
      };
      for (let s = S0; s < S1; s += 4) { edge(X1, s, X1, s + 4); edge(X0, s + 4, X0, s); }
      edge(X0, S0, X1, S0); edge(X1, S1, X0, S1);
      await ctx.yield();
      bA.add(cbox(X1 - X0 + 1.4, 0.5, 30, 0.1), { p: [(X0 + X1) / 2, DECK - 2.3, ZA - 289.5], c: '#4a5670', surf: S_CLOTH });
      for (const [x, s] of [[-0.6, 264], [12.5, 264], [-0.6, 274], [12.5, 274], [-0.6, 296], [12.5, 296]]) { pile(bkA, x, ZA - s, 7.5, 6.5, 0, pg(s - 3.2) - 2.25, br.range(-0.2, 0.2), br, { flip: true }); await ctx.yield(); }
      occA([3, 1, ZA - 280], 18);
    }
    await ctx.yield();

    // ---- the small machines the side branches set off (static parts here, moving parts as their own meshes) ----
    const SILVER = '#c4c8cc', TOYRED = '#a8584a', TOYBLUE = '#5E7FB4';
    const moving = (b, mat, x, y, z) => { const m = new THREE.Mesh(b.build(), mat); m.position.set(x, y, z); scene.add(m); return m; };
    // six spoons hung from a pencil laid across two stacks of cotton reels, under the table
    const SPOON = { x: 11.6, y: 5.4, z0: ZA - 111.5, dz: 1.9 };
    for (const z of [SPOON.z0 - 1.6, SPOON.z0 + 5 * SPOON.dz + 1.6]) for (let k = 0; k < 4; k++) reel(bA, SPOON.x, k * 1.3, z, 1.3, 0.62, ['#8fa2be', '#d8d0bc', '#b89a5e', '#9aa890'][k], BOXWOOD2);
    bA.add(cyl(0.16, 0.16, 5 * SPOON.dz + 5.4, 6), { p: [SPOON.x, SPOON.y, SPOON.z0 + 2.5 * SPOON.dz], r: [Math.PI / 2, 0, 0], c: '#c9a23c', surf: S_GLOSS });
    const spoonB = INT.makeBuilder();
    spoonB.add(cyl(0.035, 0.035, 1.0, 5), { p: [0, -0.5, 0], c: '#e9e2d0', surf: S_MATTE });
    spoonB.add(cbox(0.14, 2.6, 0.34, 0.05), { p: [0, -2.2, 0], c: SILVER, surf: S_BRASS });
    spoonB.add(blob(1, 12), { p: [0, -4.0, 0], s: [0.2, 0.95, 0.66], c: SILVER, surf: S_BRASS });
    const spoons = new THREE.InstancedMesh(spoonB.build(), matA, 6); spoons.frustumCulled = false; scene.add(spoons);
    // a wooden windmill on a pile of books beside the bridge
    const MILL = { x: 13.2, z: ZA - 279 };
    pile(bkA, MILL.x - 0.4, MILL.z, 7.5, 6.5, 0, DECK - 0.26, 0.1, br, { flip: true });
    bA.add(cbox(6.4, 0.26, 1.72, 0.05), { p: [7.9, DECK - 0.11, MILL.z], c: BOXWOOD, surf: S_WOOD });
    bA.add(lathe([[0.01, 0], [1.9, 0], [1.9, 0.3], [1.35, 0.5], [0.95, 5.6], [1.2, 5.8], [0.01, 7.2]], 6), { p: [MILL.x, DECK - 0.26, MILL.z], c: '#d9c9a0', surf: S_WOOD, tint: (X, Y, Z, k) => { if (Y > DECK + 5.4) k.set(TOYRED); } });
    bA.add(cbox(0.7, 1.3, 0.2, 0.05), { p: [MILL.x - 0.5, DECK + 1.0, MILL.z + 1.3], r: [0, -0.45, 0], c: TOYBLUE, surf: S_GLOSS });
    const millB = INT.makeBuilder();
    millB.add(cyl(0.3, 0.3, 0.9, 8), { r: [Math.PI / 2, 0, 0], c: TOYRED, surf: S_GLOSS });
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; millB.add(cbox(0.9, 3.6, 0.12, 0.04), { p: [Math.cos(a) * 2.1 - Math.sin(a) * 0.3, Math.sin(a) * 2.1 + Math.cos(a) * 0.3, 0.4], r: [0, 0, a - Math.PI / 2], c: i & 1 ? '#efe6d0' : TOYBLUE, surf: S_WOODM }); millB.add(cbox(0.16, 4.2, 0.16, 0.03), { p: [Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.3], r: [0, 0, a - Math.PI / 2], c: '#8a6a42', surf: S_WOOD }); }
    const mill = moving(millB, matA, MILL.x - 0.7, DECK + 4.6, MILL.z + 1.5); 
    // a metronome on another pile
    const METRO = { x: 13.0, z: ZA - 309 };
    pile(bkA, METRO.x - 0.2, METRO.z, 7.5, 6.5, 0, DECK - 0.26, -0.08, br, { flip: true });
    bA.add(cbox(6.4, 0.26, 1.72, 0.05), { p: [7.9, DECK - 0.11, METRO.z], c: BOXWOOD2, surf: S_WOOD });
    bA.add(lathe([[0.01, 0], [1.75, 0], [1.75, 0.25], [1.5, 0.4], [0.62, 5.4], [0.01, 5.5]], 4), { p: [METRO.x, DECK - 0.26, METRO.z], r: [0, Math.PI / 4 - 0.5, 0], c: '#6a3a22', surf: S_WOOD });
    bA.add(cbox(1.3, 3.6, 0.08, 0.02), { p: [METRO.x - 0.42, DECK + 2.3, METRO.z + 0.78], r: [-0.21, -0.5, 0], c: '#e6dcc0', surf: S_MATTE });
    const metB = INT.makeBuilder();
    metB.add(cbox(0.12, 4.8, 0.08, 0.02), { p: [0, 2.4, 0], c: SILVER, surf: S_BRASS });
    metB.add(cbox(0.7, 0.55, 0.3, 0.06), { p: [0, 3.5, 0], c: PAL[6], surf: S_BRASS });
    const metro = moving(metB, matA, METRO.x - 0.62, DECK + 0.5, METRO.z + 1.15); metro.rotation.y = -0.5;
    // a toy lorry held at the top of a sloping yardstick; it rolls away to the windows
    const LORRY = { x0: 9.6, x1: 35, z: ZA - 328 };
    { const len = Math.hypot(LORRY.x1 - LORRY.x0, DECK), ang = Math.atan2(DECK, LORRY.x1 - LORRY.x0);
      bA.add(cbox(len + 1, 0.26, 2.4, 0.05), { p: [(LORRY.x0 + LORRY.x1) / 2, DECK / 2 - 0.13, LORRY.z], r: [0, 0, -ang], c: BOXWOOD, surf: S_WOOD });
      pile(bkA, 11.4, LORRY.z, 6.5, 7, 0, DECK - 0.75, 0.05, br, { flip: true }); pile(bkA, 22, LORRY.z + 0.4, 6, 7.5, 0, DECK * (LORRY.x1 - 24.5) / (LORRY.x1 - LORRY.x0) - 0.3, -0.1, br, { flip: true });
      bA.add(cbox(4.4, 0.26, 1.72, 0.05), { p: [7.0, DECK - 0.11, LORRY.z], c: BOXWOOD2, surf: S_WOOD }); }
    const lorB = INT.makeBuilder();
    lorB.add(cbox(1.5, 1.5, 1.9, 0.2), { p: [1.3, 1.25, 0], c: TOYRED, surf: S_GLOSS }); lorB.add(cbox(2.6, 0.9, 2.0, 0.12), { p: [-0.8, 0.95, 0], c: '#d9c9a0', surf: S_WOOD });
    lorB.add(cbox(4.2, 0.25, 1.7, 0.08), { p: [0, 0.5, 0], c: '#5a4632', surf: S_WOOD }); lorB.add(cbox(0.1, 0.7, 1.3, 0.03), { p: [2.02, 1.5, 0], c: '#bcd0e2', surf: S_GLOSS });
    for (const wx of [-1.3, 1.3]) for (const wz of [-1, 1]) lorB.add(cyl(0.48, 0.48, 0.3, 12), { p: [wx, 0.48, wz], r: [Math.PI / 2, 0, 0], c: '#2a2622', surf: S_MATTE });
    const lorry = moving(lorB, matA, LORRY.x0 + 1.6, DECK, LORRY.z);
    await ctx.yield();

    // ---- the hall: the stair of books the line climbs, the piers that carry our rails past it, the ledger tower, plants ----
    {
      const BIGBOOKS = ['#7a2e2a', '#1f4a5c', '#2f4a34', '#8a5a2a', '#263a6e', '#5a2f4a', '#a5823a', '#3a3a3e', '#8a3a22', '#6c5640'].map((c) => hexMix(c, '#120c08', 0.3));
      const RIBS = ['#8a3a34', '#3a6a7a', '#c8992e'];
      // a pile of big books from y0 up to exactly y1. o: { calm (how far each book is shifted, 0..1), ledger (the top book is a ledger, square on) }
      const bigPile = (cx, cz, w, d, y0, y1, yaw, jit, tMin, tMax, o = {}) => {
        let y = y0, i = 0; const calm = o.calm ?? 1;
        while (y < y1 - 0.05) {
          let t = xr.range(tMin, tMax); if (y1 - y - t < tMin * 0.6) t = y1 - y;
          const top = y + t >= y1 - 0.05, led = top && o.ledger;
          emitBook(bkB, cx + (led ? 0 : xr.range(-0.6, 0.6) * calm), y, cz + (led ? 0 : xr.range(-0.6, 0.6) * calm), w * (top ? 1 : xr.range(0.86, 1)), t, d * (top ? 1 : xr.range(0.86, 1)),
            led ? 0 : yaw + xr.range(-jit, jit) + ((i & 1) ? Math.PI : 0), led ? '#7a4622' : (o.dark ? hexMix(xr.pick(BIGBOOKS), '#0c0806', o.dark) : xr.pick(BIGBOOKS)), led ? xr() * 0 + 0.8 : xr(), { ribbon: !led && xr.chance(0.3) ? xr.pick(RIBS) : null, ribbonAt: xr(), sub: led ? 5 : 2, top: led ? 4 : 1 });
          y += t; i++;
        }
      };
      const baseTan = (s) => { const a = eyeBase(s - 0.5), b = eyeBase(s + 0.5), l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; return [(b[0] - a[0]) / l, (b[2] - a[2]) / l]; };
      // the stair: fourteen piles fanned along the line's own path, each a step higher than the last
      for (let i = 0, s = STAIR0; s < STAIR1 - 1; s += STEP, i++) {
        const e = eyeBase(s + STEP / 2), t = baseTan(s + STEP / 2), rx = -t[1], rz = t[0];
        bigPile(e[0] + rx * 2.3, e[2] + rz * 2.3, 13.5, STEP + 2.6, 0, stepTop(s + 0.1), Math.atan2(t[0], t[1]), 0.1, 3.2, 5.6, { calm: 0.5, dark: 0.35 });
        if ((i & 1) === 1) await ctx.yield();
      }
      // the pile the shoehorn lies on, and the line's own stair from the floor beside the bird's neck up to the big one
      bigPile(-0.9, ZA - (CATCH0 + CATCH1) / 2, 8.2, CATCH1 - CATCH0 + 1, 0, CATCH_Y, 0, 0.06, 3.0, 4.6);
      await ctx.yield();
      for (let s = APEX_S + 12; s < STAIR0 - 1; s += 4.8) {
        const q = A.line.base(s + 2.4, tmpP), qx = q.x, qz = q.z, top = baseY(s) - 0.3;
        if (top > 0.8) bigPile(qx + 0.4, qz, 5.4, 6.4, 0, top, 0, 0.12, Math.min(2.2, top), Math.min(3.6, top + 0.01));
        if (rare && top > 0.8 && s > LAND + 26) { const q2 = A.second.base(s + 2.4, tmpP); bigPile(q2.x - 0.4, q2.z, 5.4, 6.4, 0, top, 0, 0.12, Math.min(2.2, top), Math.min(3.6, top + 0.01)); }
        await ctx.yield();
      }
      await ctx.yield();
      // beyond the shoehorn the rails span from cane to cane: three garden canes, each stood in a cotton reel on one fat book on
      // the floor, and three short ones on the ledger. Nothing but the rails comes near the eye.
      const REELC = ['#8fa2be', '#b89a5e', '#9aa890', '#d8d0bc'], CANE = '#b9a064';
      const cane = (x, y0, z, y1, k) => {
        reel(bB, x, y0, z, 1.5, 1.0, REELC[k % 4], BOXWOOD2);
        bB.add(cyl(0.2, 0.26, y1 - y0, 6), { p: [x, (y0 + y1) / 2, z], c: CANE, surf: S_WOODM });
        for (let y = y0 + 4.5; y < y1 - 1; y += 5.2) bB.add(cyl(0.3, 0.3, 0.22, 6), { p: [x, y, z], c: hexMix(CANE, '#3a2a10', 0.5), surf: S_WOODM });
        bB.add(cbox(1.5, 0.22, 0.5, 0.05), { p: [x, y1 - 0.11, z], c: BRASS, surf: S_BRASS });
      };
      for (const s of F_PIERS) {
        const e = eyeAt(s), t = tangentAt(s);
        bigPile(e[0], e[2], 7.6, 6.8, 0, 3.4, Math.atan2(t[0], t[1]) + 0.3, 0.1, 3.4, 3.4, { calm: 0, dark: 0.3 });
        cane(e[0], 3.4, e[2], e[1] - RAIL - 0.1, s);
        await ctx.yield();
      }
      bigPile(0, -378, 31, 74, 0, TOWER, 0, 0.035, 3.3, 4.8, { ledger: true, calm: 0.6 });
      await ctx.yield();
      for (const s of T_PIERS) { const e = eyeAt(s); cane(e[0], TOWER, e[2], e[1] - RAIL - 0.1, s + 1); }
      occB([0, 4, -378], 34); occB([-1, 3, ZA - (CATCH0 + CATCH1) / 2], 12);
      await ctx.yield();
      // the ledger's silk marker: out of its leaves at the near end, down the face of the tower, stirring
      {
        const zf = -378 + 37, x0 = -10.4, wd = 2.6, P = [], N = [], I = [], pts = [[TOWER - 0.42, zf - 0.6, 0], [TOWER - 0.5, zf + 0.5, 0.3], [TOWER - 1.5, zf + 1.05, 1], [TOWER - 4.5, zf + 1.1, 1], [TOWER - 8, zf + 1.0, 1], [TOWER - 11, zf + 1.15, 1]];
        for (let i = 0; i < pts.length; i++) { const p = pts[i], nz = p[2]; P.push(x0, p[0], p[1], x0 + wd / 2, p[0] - (i === pts.length - 1 ? -1.3 : 0), p[1], x0 + wd, p[0], p[1]); for (let k = 0; k < 3; k++) N.push(0, 1 - nz, nz);
          if (i > 0) { const a = (i - 1) * 3, b = i * 3; I.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
        const g2 = g.clone(); g2.index.array.reverse(); const na = g2.attributes.normal; for (let i = 0; i < na.count; i++) na.setXYZ(i, -na.getX(i), -na.getY(i), -na.getZ(i));
        const ro = { c: '#a32a26', surf: sf(SU.FABRIC, 0.3, 0, 0.04, 1), sway: [TOWER - 11, TOWER - 1.5, 0.7, 0], tint: (X, Y, Z, k) => { k.multiplyScalar(0.8 + 0.3 * Math.sin(X * 2.4) * Math.sin(Y * 0.9)); } };
        bB.add(g, ro); bB.add(g2, ro);
      }
      // a kentia palm in a brass pot, a fern on a turned stand and a ficus on the piers between the hall windows
      const pz = (k) => (HALL_WZ[k] + HALL_WZ[k + 1]) / 2;
      bB.add(INT.plantGeometry({ rng: fr, scale: SC * 0.84, kind: 'palm', height: 2.0, potColor: '#b8892e', leafColor: '#5f7a2a' }), { p: [PALM.x, 0, PALM.z] });
      await ctx.yield();
      bB.add(lathe([[0.01, 0], [4.2, 0], [4.4, 0.5], [1.2, 1.4], [0.8, 8], [1.3, 12], [0.9, 15.5], [4.6, 16.4], [4.8, 17], [0.01, 17]], 14), { p: [80, 0, pz(2)], c: WALNUT, surf: S_WOOD });
      bB.add(INT.plantGeometry({ rng: fr, scale: SC * 0.8, kind: 'fern', height: 0.8, potColor: '#c9c2b2', leafColor: '#6a8430' }), { p: [80, 17, pz(2)] });
      await ctx.yield();
      bB.add(INT.plantGeometry({ rng: fr, scale: SC * 0.8, kind: 'ficus', potColor: '#b8892e', leafColor: '#5f7a2a' }), { p: [78, 0, HALL_WZ[4] - 40] });
      await ctx.yield();
      bB.add(INT.plantGeometry({ rng: fr, scale: SC * 0.8, kind: 'palm', height: 1.7, potColor: '#c9c2b2', leafColor: '#6a8430' }), { p: [-72, 0, -410] });
      await ctx.yield();
      bA.add(INT.plantGeometry({ rng: fr, scale: SC * 0.7, kind: 'fern', height: 0.8, potColor: '#b8892e', leafColor: '#5f7a2a' }), { p: [46, 0, ZA - 88] });
      occB([PALM.x, 3, PALM.z], 9); occB([80, 2, pz(2)], 7);
    }
    await ctx.yield();

    // ---- motes: only inside the beams of sun, where they glitter; none in the shade ----
    const moteU = { uTime: { value: 0 }, uBufH: { value: 450 }, uCol: { value: col(look.sunHex).lerp(col('#ffbe46'), 0.7).multiplyScalar(look.sunI > 8 ? 2.6 : sunny ? 0.9 : 0) } };
    const makeMotes = async (wins, roofs, xr, yMax, per, size, mr) => {
      const P = [], S = [], L = sunDir, kz = L.z / L.x, ky = L.y / L.x, rays = [];
      for (const w of wins) for (let i = 0; i < per; i++) {
        if (i === 0) await ctx.yield();        // one window's motes at a time
        // two motes in three hang in a dozen thin rays through each window (the gaps in the leaves outside), the rest anywhere in its beam
        if (i === 0) { rays.length = 0; for (let r = 0; r < 12; r++) rays.push([mr.range(-0.45, 0.45) * w.w, w.y + mr.range(-0.12, 0.48) * w.h, mr.range(0.9, 2.2)]); }
        const ray = i % 3 ? rays[i % 12] : null, y = mr.range(0.4, yMax);
        const yw = ray ? ray[1] + mr.gauss() * ray[2] : 0, x = ray ? w.x - (yw - y) / ky : mr.range(xr[0], xr[1]);
        const zw = w.z + (ray ? clamp(ray[0] + mr.gauss() * ray[2], -0.5 * w.w, 0.5 * w.w) : mr.range(-0.5, 0.5) * w.w);
        if (ray) { if (x < xr[0] || x > xr[1]) continue; P.push(x, y, zw - (w.x - x) * kz); S.push(mr(), size * mr.range(0.6, 1.5), mr.range(1.2, 4.5), mr.range(0.35, 1)); continue; }
        const ywU = y + (w.x - x) * ky;
        const ok = ywU > w.y - w.h / 2 && ywU < w.y + w.h / 2 && (!look.slats || ((ywU / look.slats[0]) % 1) < look.slats[1]);
        const ph = mr(), sz = size * mr.range(0.6, 1.5), tw = mr.range(1.2, 4.5), br = mr.range(0.35, 1);
        if (ok) { P.push(x, y, zw - (w.x - x) * kz); S.push(ph, sz, tw, br); }
      }
      for (const r of roofs) for (let i = 0; i < per; i++) {
        const y = mr.range(1, HB - 14), xx = r.x + mr.range(-0.5, 0.5) * r.w - (HB - y) * L.x / L.y, zz = r.z + mr.range(-0.5, 0.5) * r.d - (HB - y) * L.z / L.y;
        const ph = mr(), sz = size * mr.range(0.6, 1.5), tw = mr.range(1.2, 4.5), br = mr.range(0.35, 1);
        if (Math.abs(xx) < XB - 3 && zz < ZB - 4 && zz > ZB - LB + 4) { P.push(xx, y, zz); S.push(ph, sz, tw, br); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(S, 4));
      const m = new THREE.Points(g, moteMat); m.frustumCulled = false; m.renderOrder = 5; scene.add(m); return m;
    };
    const moteMat = new THREE.ShaderMaterial({
      uniforms: moteU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uTime, uBufH; varying float vA;
        void main() {
          float ph = aSeed.x * 6.2832;
          vec3 p = position + vec3(sin(uTime * 0.23 + ph), 0.6 * sin(uTime * 0.17 + ph * 1.7), cos(uTime * 0.19 + ph * 2.3)) * (0.5 + aSeed.y * 6.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); float d = max(-mv.z, 0.05);
          float px = aSeed.y * uBufH * 0.5 * projectionMatrix[1][1] / d, pc = clamp(px, 1.7, uBufH * 0.011);
          float tw = 0.5 + 0.5 * sin(uTime * aSeed.z + ph * 40.0); tw = tw * tw; tw = 0.3 + 1.6 * tw * tw * tw;
          vA = aSeed.w * tw * min(px / 1.7, 1.0) * min((px / pc) * 1.4, 1.0) * smoothstep(0.8, 3.0, d) * exp(-d * 0.004);
          gl_PointSize = pc; gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; varying float vA;
        void main() { float r = length(gl_PointCoord - 0.5), a = 1.0 - smoothstep(0.12, 0.5, r); gl_FragColor = vec4(uCol * (vA * a), 1.0); }`,
    });
    const mr = rng.fork('dust');
    const motesA = sunny ? await makeMotes([WIN_E, ...heroWins.slice(0, BAYS_A)], [], [-24, 42], 20, Math.round(2100 * detail * dens), 0.06, mr) : null;
    await ctx.yield();
    const motesB = sunny ? await makeMotes(heroWins.slice(BAYS_A, BAYS_A + HALL_BAYS), heroRoofs, [-70, 82], 74, Math.round(900 * detail * dens), 0.17, mr) : null;
    await ctx.yield();

    // ---- merge what was collected; curtains at every window ----
    for (const g of bA.buildChunks(3, LA)) { const m = new THREE.Mesh(g, matA); m.name = 'room-one-things'; scene.add(m); }
    await ctx.yield();
    { const m = new THREE.Mesh(bT.build(), matA); m.name = 'room-one-things'; scene.add(m); }      // the track of room one
    await ctx.yield();
    { const m = new THREE.Mesh(bB.build(), matB); m.name = 'hall-things'; scene.add(m); }
    await ctx.yield();
    bookMesh(bkA, rigA, 'room-one-things');
    await ctx.yield();
    bookMesh(bkB, rigB, 'hall-books');
    await ctx.yield();
    for (const rig of [rigA, rigB]) {
      const cu = INT.makeCurtains({ rig, rng: rng.fork('curtains'), color: look.curtain, scale: SC, fullness: 1.1, emissive: 0.14, segments: [12, 10], swayAmp: 0.08, swayFreq: 0.7 });
      (rig === rigA ? roomA : roomB).object.add(cu.object);
      await ctx.yield();
    }

    // ---- small lives: sparrows, a bluebottle, the kettle's steam, a fallen leaf ----
    const bufSize = new THREE.Vector2();
    const lifeU = { uTime: { value: 0 }, uBufH: { value: 450 }, uSun: { value: sunDir }, uSunCol: { value: col(look.sunHex).multiplyScalar(sunny ? 1.5 : 0) }, uAmb: { value: col(look.ambSky).multiplyScalar(0.55 + 0.25 * look.ambient) } };
    const birdMat = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lifeU }, fog: true, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 color; attribute float aWing; attribute vec4 aFly;     // aFly: flap amount, phase, -, -
        uniform float uTime; varying vec3 vC, vN;
        #include <common>
        #include <fog_pars_vertex>
        void main() {
          vec3 p = position, n = normal;
          float a = aFly.x * (0.25 + 0.95 * sin(uTime * 34.0 + aFly.y)) + (1.0 - aFly.x) * -1.25;
          if (abs(aWing) > 0.5) { float s = sign(aWing), c = cos(a), sn = sin(a) * s, x = p.x - s * 0.35; p = vec3(s * 0.35 + x * c - p.y * sn, p.y * c + x * sn, p.z); n = vec3(n.x * c - n.y * sn, n.y * c + n.x * sn, n.z); }
          vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
          vN = mat3(modelMatrix) * mat3(instanceMatrix) * n; vC = color;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSun, uSunCol, uAmb; varying vec3 vC, vN;
        #include <common>
        #include <fog_pars_fragment>
        void main() {
          vec3 N = normalize(vN + vec3(0.0, 1.0e-5, 0.0));
          float d = abs(dot(N, uSun)) * 0.6 + 0.4 * max(dot(N, uSun), 0.0);
          gl_FragColor = vec4(vC * (uSunCol * d * 0.55 + uAmb * (0.7 + 0.3 * N.y)), 1.0);
          #include <fog_fragment>
        }`,
    });
    const NB = 3, birds = (() => {
      const P = [], N = [], C = [], W = [];
      const add = (g, c, wing) => { const pa = g.attributes.position, na = g.attributes.normal, ix = g.index; const k = new THREE.Color(c);
        const push = (i) => { P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); N.push(na.getX(i), na.getY(i), na.getZ(i)); C.push(k.r, k.g, k.b); W.push(wing); };
        if (ix) for (let i = 0; i < ix.count; i++) push(ix.getX(i)); else for (let i = 0; i < pa.count; i++) push(i); };
      const tr = (g, sx, sy, sz, x, y, z) => { g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
      add(tr(blob(1, 10), 0.75, 0.7, 1.5, 0, 0, 0), '#8a6a4a', 0); add(tr(blob(1, 8), 0.6, 0.58, 0.66, 0, 0.42, 1.35), '#6e5a4c', 0);
      add(tr(blob(1, 6), 0.5, 0.4, 0.5, 0, -0.05, 1.3), '#2a221c', 0); add(tr(new THREE.ConeGeometry(0.16, 0.5, 5).rotateX(Math.PI / 2), 1, 1, 1, 0, 0.36, 2.1), '#3a3028', 0);
      add(tr(box(0.9, 0.08, 1.6), 1, 1, 1, 0, 0.1, -2.0), '#5a4636', 0); add(tr(blob(1, 8), 0.6, 0.5, 1.0, 0, -0.25, 0.2), '#d8cdb8', 0);
      for (const s of [-1, 1]) { const g = new THREE.BufferGeometry(); const x0 = s * 0.35, x1 = s * 3.0;
        g.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0.3, 0.9, x1, 0.3, 0.2, x0, 0.3, -1.0, x1, 0.3, 0.2, s * 2.3, 0.3, -1.1, x0, 0.3, -1.0], 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3)); add(g, '#7a5a3e', s); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1));
      const fly = new THREE.InstancedBufferAttribute(new Float32Array(NB * 4), 4); fly.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aFly', fly);
      const m = new THREE.InstancedMesh(g, birdMat, NB); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m);
      return { mesh: m, fly };
    })();
    // the bluebottle in the first shaft
    const flyB = INT.makeBuilder();
    flyB.add(blob(1, 8), { s: [0.2, 0.18, 0.34], c: '#1c2a5a', surf: sf(SU.PLAIN, 0.85, 0.6) }); flyB.add(blob(1, 6), { p: [0, 0.03, 0.34], s: [0.14, 0.13, 0.13], c: '#3a1c14', surf: S_GLOSS });
    for (const s of [-1, 1]) flyB.add(blob(1, 6), { p: [s * 0.3, 0.16, -0.1], s: [0.34, 0.02, 0.2], c: '#cfd6dc', surf: sf(SU.PLAIN, 0.6, 0, 0.6) });
    const bluebottle = moving(flyB, matA, 12, 7, ZA - 80);
    // steam over the kettle
    const NS = Math.round(46 * detail), steamGeo = new THREE.BufferGeometry();
    { const pp = new Float32Array(NS * 3), ph = new Float32Array(NS); for (let i = 0; i < NS; i++) { pp[i * 3] = -XA + 23.6; pp[i * 3 + 1] = 5.6; pp[i * 3 + 2] = ZA - 204.4; ph[i] = (i + 0.5) / NS; }
      steamGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3)); steamGeo.setAttribute('aPh', new THREE.BufferAttribute(ph, 1)); }
    const steamMat = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lifeU, uCol: { value: col('#f4f1ea').multiplyScalar(sunny ? 0.9 : 0.75) } }, fog: true, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        attribute float aPh; uniform float uTime, uBufH; varying float vA;
        #include <common>
        #include <fog_pars_vertex>
        void main() {
          float q = fract(aPh + uTime * 0.09), h = q * 15.0;
          vec3 p = position + vec3(sin(aPh * 91.0 + h * 0.5 + uTime * 0.6) * (0.3 + q * 2.2) + q * q * 3.0, h, cos(aPh * 57.0 + h * 0.4) * (0.3 + q * 1.8));
          vA = smoothstep(0.0, 0.12, q) * (1.0 - q) * (1.0 - q);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = min((1.6 + 5.0 * q) * projectionMatrix[1][1] * uBufH * 0.5 / max(gl_Position.w, 0.5), 220.0);
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; varying float vA;
        #include <common>
        #include <fog_pars_fragment>
        void main() {
          float d = 1.0 - smoothstep(0.08, 0.5, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(uCol, d * vA * 0.22);
          #include <fog_fragment>
        }`,
    });
    const steam = new THREE.Points(steamGeo, steamMat); steam.frustumCulled = false; steam.renderOrder = 3; scene.add(steam);
    // one fallen leaf skittering along the hall floor
    const leafB = INT.makeBuilder();
    { const g = new THREE.CircleGeometry(1, 7); g.rotateX(-Math.PI / 2); leafB.add(g, { s: [0.8, 1, 1.7], c: '#9a7a3a', surf: S_MATTE, tint: (X, Y, Z, k) => k.multiplyScalar(0.8 + 0.3 * Math.abs(X)) });
      const g2 = new THREE.CircleGeometry(1, 7); g2.rotateX(Math.PI / 2); leafB.add(g2, { s: [0.8, 1, 1.7], c: '#7a5a2a', surf: S_MATTE }); leafB.add(cyl(0.05, 0.03, 1.2, 4), { p: [0, 0.02, -2.1], r: [Math.PI / 2, 0, 0], c: '#5a3a1a', surf: S_MATTE }); }
    const leaf = moving(leafB, matB, 30, 0.3, 80);
    const doors = [];
    for (const d of doorB) { const m = moving(d.b, matB, d.sx * (DOOR_W / 2 + 1.2), 0, ZB - 1); m.rotation.y = Math.PI / 2 - d.sx * 0.17; doors.push(m); await ctx.yield(); }
    await ctx.yield();

    // ---- our vehicle: a clear glass marble with a twist of peacock green, rolling 1.6 m ahead of the eye ----
    const MR = 0.45;
    const marbleMat = new THREE.ShaderMaterial({
      uniforms: { uSunDir: { value: sunDir }, uSun: { value: col(look.sunHex).multiplyScalar(sunny ? 2.4 : 0.5) }, uSky: { value: col(look.zenith).lerp(col(look.horizon), 0.4) },
        uFloor: { value: col(PAL[1]) }, uWall: { value: col(look.wallB) }, uTwist: { value: col(PAL[4]) }, uTwist2: { value: col('#58d8c0') }, uBright: { value: look.sunI > 8 ? 1 : 0.55 } },
      vertexShader: /* glsl */`
        varying vec3 vN, vWP, vOP, vOV;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0); vN = mat3(modelMatrix) * normal; vWP = wp.xyz; vOP = position;
          vOV = (cameraPosition - wp.xyz) * mat3(modelMatrix);          // the way to the eye, in the marble's own space
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunDir, uSun, uSky, uFloor, uWall, uTwist, uTwist2; uniform float uBright;
        varying vec3 vN, vWP, vOP, vOV;
        // a small analytic picture of the house along direction E: honey floor with leaning sun shapes, cream walls,
        // tall bright windows on the +x side, a pale ceiling with a roof light
        vec3 roomAt(vec3 E) {
          float dn = max(-E.y, 0.05);
          vec2 fp = E.xz / dn;
          float par = 0.86 + 0.14 * sin(fp.x * 5.0) * sin(fp.y * 5.0);
          float pool = smoothstep(0.15, 0.55, sin(fp.y * 0.9 + fp.x * 0.9 + 1.0));
          vec3 floorC = uFloor * par * (0.5 + 1.7 * uBright * pool);
          float ax = max(abs(E.x), 0.15), wz = E.z / ax, wy = E.y / ax;
          float stripe = abs(fract(wz * 0.75) - 0.5) * 2.0;
          float win = step(0.0, E.x) * (1.0 - smoothstep(0.5, 0.62, stripe)) * smoothstep(0.03, 0.09, stripe) * smoothstep(-0.02, 0.04, wy) * (1.0 - smoothstep(0.9, 1.1, wy));
          vec3 c = mix(uWall * (0.62 + 0.3 * E.y), vec3(0.82, 0.8, 0.72) * 0.75, smoothstep(0.55, 0.72, E.y));
          c = mix(c, uSky * 2.4 + vec3(0.25), win);
          c = mix(c, uSky * 2.0, smoothstep(0.84, 0.95, E.y) * 0.85);
          return mix(c, floorC, 1.0 - smoothstep(-0.05, 0.03, E.y));
        }
        void main() {
          vec3 N = normalize(vN + vec3(0.0, 1.0e-5, 0.0)), V = normalize(cameraPosition - vWP + vec3(0.0, 1.0e-4, 0.0));
          float nv = max(dot(N, V), 0.0);
          vec3 off = N - dot(N, V) * V;
          vec3 E = normalize(-V - off * 2.3 + vec3(0.0, 1.0e-4, 0.0));          // a ball lens: the room upside down and tiny
          vec3 c = roomAt(E) * vec3(0.92, 1.0, 0.97) * (0.5 + 0.62 * nv);
          // the twist: three twisted vanes about the marble's own axis, found by stepping the bent ray through the glass
          vec3 No = normalize(vOP + vec3(0.0, 1.0e-5, 0.0)), rd = normalize(-normalize(vOV + vec3(0.0, 1.0e-5, 0.0)) - No * 0.42);
          float dens = 0.0, edge = 0.0;
          for (int i = 0; i < 6; i++) {
            vec3 p = vOP + rd * (0.07 + 0.135 * float(i));
            float a = p.y * 6.5, ca = cos(a), sa = sin(a);
            vec2 q = vec2(p.x * ca - p.z * sa, p.x * sa + p.z * ca);
            float v1 = (1.0 - smoothstep(0.02, 0.05, abs(q.x))) * (1.0 - smoothstep(0.25, 0.31, abs(q.y)));
            float v2 = (1.0 - smoothstep(0.02, 0.05, abs(q.y))) * (1.0 - smoothstep(0.25, 0.31, abs(q.x)));
            float v = max(v1, v2) * (1.0 - smoothstep(0.31, 0.39, abs(p.y))) * (1.0 - smoothstep(0.38, 0.43, length(p)));
            edge = max(edge, v * smoothstep(0.16, 0.29, max(abs(q.x), abs(q.y))));
            dens = max(dens, v);
          }
          vec3 twc = mix(uTwist * 1.25, uTwist2, edge) * (0.7 + 0.8 * uBright * (0.4 + 0.6 * max(dot(N, uSunDir), 0.0)) + 0.35);
          c = mix(c, twc, dens * 0.82);
          float f = 1.0 - nv, f2 = f * f, fres = f2 * f2;
          c += (uSky * 1.5 + vec3(0.3)) * fres * 0.6;                           // a thin bright rim
          vec3 H = normalize(uSunDir + V + vec3(0.0, 1.0e-4, 0.0));
          float nh = max(dot(N, H), 0.0), nh2 = nh * nh, nh8 = nh2 * nh2 * nh2 * nh2, nh64 = nh8 * nh8 * nh8 * nh8 * nh8 * nh8 * nh8 * nh8;
          c += (uSun * uBright + vec3(0.6)) * nh64 * nh64 * nh64 * nh64 * 2.6;    // one hot highlight
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const marble = new THREE.Mesh(new THREE.SphereGeometry(MR, 36, 22), marbleMat); marble.frustumCulled = false; marble.rotation.order = 'YXZ'; scene.add(marble);
    await ctx.yield();

    // the flying marble's shadow on the hall floor and the fan: a soft round shade with the bright spot the glass gathers
    // in its middle. It leaves from under the lip and comes back under the marble in the shoehorn.
    const shadeU = { uK: { value: new THREE.Vector3(0, 0, 0) }, uCol: { value: col(look.sunHex).multiplyScalar(sunny ? 1.6 : 0) } };
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: shadeU, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uK, uCol; varying vec2 vQ;
        void main() {
          float r = length(vQ), d = (1.0 - smoothstep(0.16, 0.62, r)) * uK.x;
          float c = (1.0 - smoothstep(0.015, 0.075, length(vQ - vec2(0.03, 0.02)))) * uK.y;
          gl_FragColor = vec4(uCol * c, d * (1.0 - 0.5 * c));
        }`,
    }));
    shade.frustumCulled = false; shade.renderOrder = 4; shade.scale.set(13, 1, 13); scene.add(shade);
    const ramp2 = (v, a, b, e) => clamp((v - a) / e + 0.5, 0, 1) * clamp((b - v) / e + 0.5, 0, 1);
    const sunOnFloor = (x, y, z) => {
      let m = 0; const L = sunDir;
      for (let k = BAYS_A; k < BAYS_A + HALL_BAYS; k++) { const w = heroWins[k], yw = y + (w.x - x) * L.y / L.x, zw = z + (w.x - x) * L.z / L.x; m = Math.max(m, ramp2(zw, w.z - w.w / 2, w.z + w.w / 2, 4) * ramp2(yw, w.y - w.h / 2, w.y + w.h / 2, 4)); }
      for (const r of heroRoofs) { const xr = x + (HB - y) * L.x / L.y, zr = z + (HB - y) * L.z / L.y; m = Math.max(m, ramp2(xr, r.x - r.w / 2, r.x + r.w / 2, 5) * ramp2(zr, r.z - r.d / 2, r.z + r.d / 2, 5)); }
      return sunny ? m : 0;
    };

    // ---- things of room one are hidden once the camera is well into the hall ----
    const setA = [roomA.object, rugs.object, clock.object, SL.g, spoons, mill, metro, lorry, bluebottle, steam];
    if (motesA) setA.push(motesA);
    scene.traverse((o) => { if (o.name === 'room-one-things') setA.push(o); });

    hero.uniforms.uWidth.value.set(13, 14, 13, 15); hero.uniforms.uDap.value = clamp(look.dapple * 0.9, 0.26, 0.34);
    const LEAD = 12;
    const camP = new THREE.Vector3(), q0 = new THREE.Vector3(), q1 = new THREE.Vector3(), lookM = new THREE.Matrix4(), mI = new THREE.Matrix4(), qI = new THREE.Quaternion(), vS = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    const crestPoi = new THREE.Vector3(), fernPoi = new THREE.Vector3(), sleepPoi = new THREE.Vector3(), archPoi = new THREE.Vector3(), midPoi = new THREE.Vector3(), gaze = { s: 0, x: 0 };
    const U_SLOW0 = uOf(384), U_SLOW1 = uOf(432), U_FAST0 = uOf(596), U_FAST1 = uOf(660), U_HEAD = uOf(240), U_HIP = uOf(270), WALL0 = 440, WALL1 = 812, WALL2 = 768, WALL3 = 850;
    const B0 = [XB - 5, WIN_B.sill + 1.0, HALL_WZ[1]], B1 = [14, 30, HALL_WZ[1] + 14], B2 = [-86, 72, HALL_WZ[1] - 100];
    const bez = (q, i, out) => { const a = (1 - q) * (1 - q), b = 2 * q * (1 - q), c = q * q; return out.set(a * B0[0] + b * B1[0] + c * B2[0] + (i - 1) * 3 * q, a * B0[1] + b * B1[1] + c * B2[1] + i * 2.5 * q, a * (B0[2] + (i - 1) * 6) + b * (B1[2] - i * 7) + c * (B2[2] - i * 12)); };
    let millAngle = 0;
    const qRoll = new THREE.Quaternion(), vX = new THREE.Vector3(1, 0, 0);
    const pace = (u) => 1.2 - 0.62 * smoothstep(U_SLOW0, U_SLOW1, u) + 0.62 * smoothstep(U_FAST0, U_FAST1, u) - 0.2 * smoothstep(0.86, 0.92, u);
    const leadOf = (s) => LEAD + 48 * smoothstep(LIP - 10, LIP + 60, s) * (1 - smoothstep(610, LAND + 2, s));

    function update(dt, time, camera, u) {
      const s = stationOf(u), ub = s / 880;
      gaze.s = s;
      // the wave
      hero.setLineFront(s + lerp(LINE0 + 6.5, leadOf(s), smoothstep(0, 34, s)));
      hero.setMarble(clamp((s - 340) / 64, 0, 1));
      hero.setFanFront(A.fanFrontMax * Math.pow(clamp((s - 404) / 116, 0, 1), 0.6));
      hero.setSecondFront(rare && s >= 222.5 + RS ? s + leadOf(s) + 3 * (1 - smoothstep(700, 850, s)) : -1e3);
      hero.setShiver(smoothstep(0.93, 0.985, ub));
      hero.setWallFront(A.wallFrontMax * Math.pow(clamp((s - WALL0) / (WALL1 - WALL0), 0, 1), 0.5), s > WALL2 ? A.wallFrontMax * (s - WALL2) / (WALL3 - WALL2) : -1e3);
      hero.update(dt, time, camera);
      const inOne = s < 425;
      for (const o of setA) o.visible = inOne;
      roomB.update(dt, time, camera); moteU.uTime.value = time; frondU.uFrondT.value = time;
      outU.uTime.value = time; palmCrown.rotation.z = 0.045 * Math.sin(time * 0.7); palmCrown.rotation.x = 0.035 * Math.sin(time * 0.9 + 1.0);
      ctx.renderer.getDrawingBufferSize(bufSize); lifeU.uBufH.value = bufSize.y; lifeU.uTime.value = time; moteU.uBufH.value = bufSize.y;
      steamMat.uniforms.uTime.value = time; steamMat.uniforms.uBufH.value = bufSize.y; birdMat.uniforms.uTime.value = time;

      if (inOne) {
        roomA.update(dt, time, camera); clock.update(dt, time);
        // the sleeper: flank every 3.5 s; ear, whiskers and tail as the crest goes by; in the rare visit it wakes and bats a tile
        const sr = s - RS, br2 = Math.sin(time * TAU / 3.5), near = smoothstep(212.5, 230.5, sr) * (1 - smoothstep(248.5, 266.5, sr));
        const wake = rare ? smoothstep(184.5, 200.5, sr) : 0, bat = rare ? smoothstep(208.5, 222.5, sr) * (1 - smoothstep(224.5, 240.5, sr)) : 0;
        const lift = Math.max(near * (0.55 + 0.45 * Math.sin(time * 11)), wake);
        const th = sr > 239.5 && sr < 261.5 ? Math.abs(Math.sin((sr - 239.5) / 22 * TAU)) : 0;
        SL.eyeM.visible = wake > 0.5;
        if (SL.parrot) {
          const puff = 0.07 * near * (0.6 + 0.4 * Math.sin(time * 9)), fl = Math.max(bat * (0.9 + 0.5 * Math.sin(time * 21)), 0.14 * wake);
          SL.chestM.scale.set(1 + 0.03 * br2 + puff, 1 + 0.018 * br2 + puff * 0.4, 1 + 0.035 * br2 + puff);
          SL.whM.rotation.set(0.42 * (1 - wake) + 0.025 * br2, 0.5 * wake * Math.sin(time * 2.3), 0.06 * near * Math.sin(time * 17));
          SL.whM.position.y = SL.headY + 0.55 * wake + 0.06 * br2;
          SL.earM.scale.setScalar(1 + 0.3 * lift);
          SL.tailM.rotation.x = 0.05 * Math.sin(time * 1.9) + 0.25 * th * th;
          SL.pawM.rotation.z = fl; SL.wing2.rotation.z = -fl;
        } else {
          SL.chestM.scale.set(1 + 0.022 * br2, 1 + 0.05 * br2, 1 + 0.01 * br2);
          if (SL.kit) { SL.earM.rotation.x = -0.5 * lift * Math.sin(time * 14); SL.earM.rotation.z = -0.25 * lift; } else { SL.earM.rotation.z = -1.0 * lift; SL.earM.rotation.x = 0.25 * lift; }
          SL.tailM.rotation.x = 0.5 * th * th + 0.04 * Math.sin(time * 1.9) + wake * 0.3 * (0.6 + 0.4 * Math.sin(time * 9));
          SL.whM.rotation.z = 0.012 * Math.sin(time * 6.3) + near * 0.05 * Math.sin(time * 23);
          SL.pawM.rotation.y = bat * (SL.kit ? 0.8 : 0.36); SL.pawM.rotation.x = -0.22 * bat;
        }
        // spoons
        const amp = 0.05 + 0.8 * smoothstep(110, 121, s) * (1 - 0.65 * smoothstep(125, 330, s));
        for (let i = 0; i < 6; i++) {
          lookM.makeRotationZ(amp * Math.sin(time * 2.7 - i * 0.55) * (i === 0 ? 1 : 0.85 + 0.15 * Math.sin(i * 7.1)));
          lookM.setPosition(SPOON.x, SPOON.y - 0.16, SPOON.z0 + i * SPOON.dz); spoons.setMatrixAt(i, lookM);
        }
        spoons.instanceMatrix.needsUpdate = true;
        // windmill, metronome, lorry
        millAngle += dt * (0.35 + 5.5 * smoothstep(282, 296, s) * (1 - 0.5 * smoothstep(300, 420, s)));
        mill.rotation.z = -millAngle;
        const mg = smoothstep(311, 318, s);
        metro.rotation.z = 0.48 * (1 - mg) + mg * 0.48 * Math.cos(time * 6.6);
        const lq = clamp((s - 331) / 50, 0, 1), lx = LORRY.x0 + 1.6 + 44 * lq * lq * (3 - 2 * lq), onSlope = lx < LORRY.x1;
        lorry.position.set(lx, onSlope ? DECK * (LORRY.x1 - lx) / (LORRY.x1 - LORRY.x0) : 0, LORRY.z);
        lorry.rotation.z = lx < LORRY.x1 - 1.5 ? -Math.atan2(DECK, LORRY.x1 - LORRY.x0) : 0;
        // bluebottle
        const fa = time * 0.9;
        bluebottle.position.set(14.5 + 6 * Math.cos(fa), 8 + 1.6 * Math.sin(time * 1.7), ZA - 80 + 5 * Math.sin(fa));
        bluebottle.rotation.y = Math.atan2(-Math.sin(fa) * 6, Math.cos(fa) * 5) ; bluebottle.rotation.z = 0.3 * Math.sin(time * 3.1);
      }
      // sparrows: on the sill, then across the hall as the fan starts to open
      for (let i = 0; i < NB; i++) {
        const q = clamp((ub - 0.462 - i * 0.007) / 0.1, 0, 1), flying = q > 0 && q < 1;
        if (flying) { bez(q, i, q0); bez(Math.min(q + 0.02, 1.02), i, q1); q0.y += 0.8 * Math.sin(time * 5 + i); }
        else if (q <= 0) { q0.set(B0[0], B0[1] + 0.5 * Math.abs(Math.sin(time * 4.2 + i * 2.1)) * (Math.sin(time * 0.9 + i) > 0 ? 1 : 0), B0[2] + (i - 1) * 6); q1.set(q0.x - 6, q0.y, q0.z + (i - 1) * 3 + 2 * Math.sin(time * 0.7 + i)); }
        else { bez(1, i, q0); q1.set(q0.x + 5, q0.y, q0.z + 3); }
        lookM.lookAt(q1, q0, UP); qI.setFromRotationMatrix(lookM); mI.compose(q0, qI, vS.set(1, 1, 1)); birds.mesh.setMatrixAt(i, mI);
        birds.fly.setXYZW(i, flying ? 1 : 0, i * 2.3, 0, 0);
      }
      birds.mesh.instanceMatrix.needsUpdate = true; birds.fly.needsUpdate = true;
      // the open doors stir in the draught
      for (let i = 0; i < doors.length; i++) doors[i].rotation.y = Math.PI / 2 + (i ? -1 : 1) * (0.17 + 0.035 * Math.sin(time * 0.8 + i * 1.9) + 0.012 * Math.sin(time * 2.1 + i));
      // the leaf
      leaf.position.set(30 + 14 * Math.sin(time * 0.23) + 3 * Math.sin(time * 1.3), 0.3 + 0.5 * Math.abs(Math.sin(time * 2.1)), 52 + 10 * Math.sin(time * 0.31 + 1));
      leaf.rotation.set(0.4 * Math.sin(time * 3.1), time * 1.7, 0.3 * Math.sin(time * 2.3));
      // our marble, on its rails
      path.pointAt(clamp(u, 0, 1), camP);        // the eye is exactly on the path; seen through a portal the marble waits at the start
      qI.setFromRotationMatrix(lookM.extractRotation(camera.matrixWorld));
      // in a tall, narrow picture the marble is made smaller so that it never spans more than a quarter of the width
      const m00 = camera.projectionMatrix ? camera.projectionMatrix.elements[0] : 0.94, mk = clamp(0.22 / (0.242 * Math.max(m00, 0.1)), 0.45, 1);
      // It rolls on the rails ahead of the eye, as far ahead as keeps the whole sphere well inside the foot of the picture
      // (nearer, and a little smaller, while the gaze dips below a rising track), never a cropped arc at its lower edge.
      let maz = 0, pd = 0; const LEAD0 = 5.9, MDROP = RAIL + 0.11 - MR, uA = u + LEAD0 / path.length;
      qR.copy(qI).invert();
      if (uA < 1) {
        path.pointAt(uA, q1); q1.y -= MDROP; vS.copy(q1).sub(camP).applyQuaternion(qR);
        if (vS.z < -1) { maz = clamp(Math.atan2(vS.x, -vS.z), -0.62, 0.62); pd = Math.atan2(vS.y, Math.hypot(vS.x, vS.z)) + Math.atan2(MDROP, LEAD0); }
      }
      // While we fly there are no rails and we are the marble: it sinks out of the foot of the picture past the lip (its shadow
      // runs on over the floor) and comes up again before the shoehorn.
      const flyM = smoothstep(LIP - 4, LIP + 14, s) * (1 - smoothstep(LAND - 62, LAND - 42, s));
      const dep = clamp(0.28 + pd, 0.24, 0.62), md = MDROP / Math.tan(dep), mel = lerp(clamp(pd - dep, -0.42, -0.14), -0.86, flyM), ms = mk * clamp(md / LEAD0 * 0.9 + 0.1, 0.5, 1);
      marble.scale.setScalar(ms);
      marble.position.copy(vS.set(md * Math.tan(maz), md * Math.tan(mel), -md).applyQuaternion(qI)).add(camP);
      marble.quaternion.copy(qI).multiply(qRoll.setFromAxisAngle(vX, -(s * 0.12 + time * 0.55) % TAU));
      marble.visible = !ctx.through && flyM < 0.995; gaze.x = camP.x;
      {
        const fly = smoothstep(LIP - 34, LIP - 14, s) * (1 - smoothstep(LAND - 26, LAND - 6, s)), mp = marble.position;
        // (not where the sun would throw it, which is out of the picture from this height: ahead of us, where the gaze rests)
        const sx = mp.x * 0.86, sz = mp.z - 6 - 0.95 * mp.y;
        const gy = Math.hypot(sx, sz - (ZA - APEX_S)) < FAN_R - 1 && Math.abs(sx) < 80 && sz > ZA - APEX_S ? 1.0 : 0.08, lit = sunOnFloor(sx, gy, sz), sc = 12 + 0.26 * mp.y;
        shade.position.set(sx, gy, sz); shade.scale.set(sc, 1, sc); shade.visible = !ctx.through && fly > 0.01 && Math.abs(sx) < XB - 4;
        shadeU.uK.value.set(fly * (0.5 + 0.2 * lit * look.shadowK), 0, 0);      // a soft round shade, no bright spot
      }
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.pointAt(0, new THREE.Vector3())) }, 0);

    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.3, far: 1600, lookAhead: 24, sway: 0.5, bank: 0.1, nearThrough: 0.3 },
      pois: [
        // under the table the gaze drops to the crest: the falling tiles near and large, the window side of the room beyond them
        // (half way along the table it turns right round to them: the leaning tiles a few metres off, the chair legs and the
        // window wall with its rays behind, and the rails out of the picture; then forward again)
        { at: () => { const k = smoothstep(36, 62, gaze.s) * (1 - smoothstep(104, 126, gaze.s)); return fernPoi.set(12 + 10 * k, 0.6 + 1.6 * k, ZA - gaze.s - 12 + 4 * k); }, from: uOf(26), to: uOf(140), weight: 0.7, fade: 0.3 },
        // the wide swing past the table: the crest side on, the windows behind it
        { at: () => crestPoi.set(4, 1.2, ZA - gaze.s - 14), from: uOf(128), to: uOf(206), weight: 0.6, fade: 0.3 },
        // the sleeper; on the rare visit its head only (it is awake, and looks after the tiles it set going), then the second wave
        ...(rare ? [{ at: SL.head, from: uOf(204), to: uOf(248 + RS), weight: 0.62, fade: 0.3 },
          { at: () => A.second.base(Math.max(gaze.s, 240 + RS) + 20, sleepPoi), from: uOf(238 + RS), to: uOf(304), weight: 0.45, fade: 0.3 }]
          : [{ at: (t, u) => sleepPoi.copy(SL.head).lerp(SL.hip, smoothstep(U_HEAD, U_HIP, u)), from: uOf(200), to: uOf(276), weight: SL.parrot ? 0.66 : 0.62, fade: 0.3 }]),
        // up the ramp the gaze is held a little below level: through the doorway, down the length of the hall's floor
        { at: [0, -24, ZA - 620], from: uOf(262), to: uOf(476), weight: 0.72, fade: 0.3 },
        // the middle of the picture, from the rim and then from above on the left
        // (once the picture lies finished the gaze lifts along it to the standing stem at its far point: the far half of the
        // picture, the window wall and the end wall's first rays, a second picture and not the first one again from nearer)
        { at: () => { const k = smoothstep(508, 562, gaze.s); return midPoi.set(0, 8 * k, ZA - APEX_S + lerp(118, 12, k)); }, from: uOf(352), to: uOf(640), weight: 0.78, fade: 0.25 },
        // the far end of the picture, with the standing stem (or neck) at its point
        { at: [0, 8, ZA - APEX_S], from: uOf(578), to: uOf(706), weight: 0.6, fade: 0.3 },
        // then the arch and the wall behind it, to the end
        { at: () => archPoi.set(0.15 * gaze.x, TOWER + 9 + 12 * smoothstep(770, 835, gaze.s), -410), from: uOf(672), to: 1.0, weight: 0.85, fade: 0.15 },
      ],
      portal: { shape: 'arch', width: 20, height: 24, color: lookName === 'evening' ? '#ffd9a8' : '#cfe6ff', glow: 0.55, revealDistance: 420 },
      post: { exposure: look.exposure, bloom: { strength: 0.2, radius: 0.6, threshold: 1.3 },
        grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() {},
    };
  },
};
