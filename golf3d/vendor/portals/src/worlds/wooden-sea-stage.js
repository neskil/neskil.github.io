// A WOODEN SEA (world "wooden-sea-stage"), interiors and homes B.
// A court theatre of the 1700s in the middle of a change of scene, seen from inside its own wooden machinery: in under the stage
// to the capstan that turns the sea, up through the open floor behind the sea beside a sea serpent on its lift, forward over
// the rollers under the cloud machine, down before the sea among the wings, out over the footlights to the gilded house, and down
// the house to the ring under its ceiling. Our own house, after no named theatre; the scenery is our own. Nothing is lettered; no
// arms, cipher or crown; nobody sits in the royal box; the audience and the hands are plain figures without faces, kept far from
// the lens by place. Flames only as candles and lanterns: their count never changes after the build.
//
// TWO KINDS OF MOTION (section 153).
// BY THE METRE FLOWN, the world's own answer to the visitor, a pure function of the share of the way flown and the same for every
// visitor (setEvent): the six pairs of wings (the palace out and the storm coast in, and back for the dawn); the ship across the
// stage; the cloud machine down, up, and down again; the lift with the sea serpent up, down, and up again; the covers of the open
// floor sliding shut once the flight is through it (the light through the open floor goes with them); the second backcloth
// unrolling with the dawn's warm light.
// BY THE WORLD'S CLOCK, so that a paused visitor sees a living stage: the capstan and its walkers, the shaft, the seven rollers
// of the sea, the wind drum, the dolphins, the ship's rocking, the sea serpent's nod, the rise and fall of its coils and the slide of its
// ground row, the two far ground rows of waves sliding against each other, the gilt sun and the spokes of its glow, the lay of every hauled
// rope running, every flame and its halo, the light each box's candle throws on its own bay (each breathing by itself, softly), the dust, the stir of the hands and of the house. All of it is bounded; what update()
// turns wraps at a whole turn, and the shaders' clock wraps after 916 turns of the wind drum, close to one hour (flames, rope lay and
// dust take a new phase there; the crank hand's hands stay on the crank).
// WHAT READS THE EYE, of the allowed kinds only: filtering by pixel footprint (screen derivatives; the size of the point sprites
// from the lens's scale and the buffer's height); gloss, which reads the eye's bearing as light does; light in air (the cellar's
// veils, the shaft under the open floor, the slits under the wings' rails, the glow about the gilt sun), which thins close to the
// eye as less air lies between; the haze of the cellar, the stage and the house, which is air between the eye and a thing (it
// grows with the distance from the eye) and dims a flame's halo likewise; a halo is a point 0.6 m wide, never under 3 pixels nor
// over 90. Nothing is placed, timed, lit, hidden or thinned for a still's position, a seed, a clock or the lens.
// BEHIND THE ENTRY (section 134; the world does not set camera.nearThrough): the entry stands under the stage's front, 2.9 m
// behind the proscenium's plane and 1.8 m over the cellar floor; its frame looks upstage, 17 degrees off the house's middle line
// toward the side on which the way passes the capstan, rising 5 degrees. Behind it, along its level axis, the store vault lies
// open: nothing stands in the tube within 30 m; the vault's end wall stands across the axis 40 m behind the entry and is left; one
// pier of the vault stands beside the axis, 3.5 m off it and 32 m behind, and is left. The vault's ceiling runs 4.6 m over the axis.
//
// THE FRAME. 1 unit is 1 metre. The stage floor is y 0; x runs across the house; the proscenium's plane is z 0, the stage lies
// behind it (z greater), the house before it (z less). The cellar's floor is y -10.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import { TH, SID, sf, strut, makeStageLight, TONE, NLAN, NCH, NBOX, figureGeometry, ropeGeometry, hang, rollerGeometry, flameGeometry, seaZ, seaY, SHIPZ,
  cutGeometry, cloudOutline, sawnStrip, wingGeometry, hullGeometry, sailGeometry, wheelInto, bustGeometry, dolphinGeometry } from '../parts/wooden-sea-stage.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, f) => a + (b - a) * f;
const ss = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const CHANDS = [[-8.5, 13.2, -15], [8.5, 13.2, -15], [-6.5, 13.2, -27.5], [6.5, 13.2, -27.5]];
export const DUR = 64, CAP_W = 0.29, WIND = [-4.0, 34.6], WIND_PH = 0.7, TWRAP = TAU / 1.6 * 916;      // seconds of the flight; the capstan's turning, radians a second

// ---------------------------------------------------------------- the change of scene, keyed to the flight and to nothing else
// a wing pair's share of its change (0: the palace stands in, 1: the storm coast stands in). k 0 is the pair nearest the house.
// (the palace stands in until the flight has come down before the sea; then the pairs go one after another from the farthest, the four
// farther pairs quickly, the two nearest the house last and slowly, those on the left hand before those on the right)
export const wingShare = (k, u, s = 1) => { const a = (s < 0 ? [0.47, 0.46, 0.45, 0.445, 0.44, 0.435] : [0.56, 0.52, 0.445, 0.44, 0.435, 0.432])[k]; return ss(u, a, a + (k < 2 ? 0.14 : 0.08)) * (1 - ss(u, 0.80 + 0.004 * k, 0.85 + 0.004 * k)); };
export const shipX = (u) => -3.5 + 13 * u;      // the ship's place on its track across the stage
// the cloud machine's foot over the stage: it comes down early, is hauled up again, and comes down for good before the dawn
export const cloudY = (u) => 19.5 - 10.9 * (ss(u, 0.295, 0.34) * (1 - ss(u, 0.365, 0.425)) + ss(u, 0.60, 0.68));
export const wingZ = (k) => TH.WZ0 + TH.WDZ * k;
export const dropShare = (u) => ss(u, 0.80, 0.855);       // how much of the second backcloth has unrolled
// the lift in the open floor: the height of its deck. It brings the sea serpent up from the cellar as the eye rises beside it
export const coverShare = (u) => ss(u, 0.222, 0.248);     // how far the covers of the open floor have slid shut
export const LIFTZ = 34.0, liftY = (u) => lerp(TH.CF + 0.3, -0.05, ss(u, 0.165, 0.235) * (1 - ss(u, 0.275, 0.325)) + ss(u, 0.57, 0.66));

// ---------------------------------------------------------------- the way
export function makeRoute() {
  const pts = [
    // THE CELLAR: in under the stage's front at a tall man's height, straight and rising gently for the first 9 m (the first look
    // stands on the entry frame), past the capstan with it on the left hand, on to the light under the open floor
    [-3.55, -8.2, 2.9], [-3.95, -8.07, 4.2], [-4.75, -7.8, 6.7], [-5.6, -7.52, 9.0], [-6.4, -7.3, 11.1], [-7.6, -7.0, 13.4], [-8.0, -6.7, 16.2], [-7.6, -6.0, 19.4], [-6.4, -5.8, 22.6], [-5.0, -5.6, 25.8], [-4.0, -4.2, 28.6], [-3.4, -0.9, 30.3],
    // THE RISE through the open floor behind the sea, and forward over its rows, climbing under the cloud machine as it comes down
    [-2.6, 2.0, 30.6], [-1.8, 2.9, 28.6], [-0.9, 4.3, 26.0], [-0.6, 6.55, 22.8], [-0.2, 9.4, 19.2], [0.0, 9.6, 15.6], [0.0, 9.6, 12.6],
    // THE SEA: round before the cloud machine's face; down by the right hand; then level across the stage's front before the first wings
    [0.0, 8.4, 9.2], [0.8, 6.6, 6.8], [2.6, 5.3, 5.4], [2.8, 4.8, 4.4], [0.6, 4.5, 3.6], [-2.0, 4.2, 4.2], [-3.8, 3.8, 5.6], [-5.4, 3.6, 7.2], [-6.6, 3.5, 9.0], [-7.0, 3.6, 10.0], [-7.1, 3.7, 11.2], [-6.5, 3.8, 11.6], [-6.2, 3.9, 10.4],
    // back down the left hand before the wings, out over the footlights and the pit, round to the right hand, a turn upstage, and out
    [-6.2, 4.3, 7.2], [-6.0, 4.7, 3.8], [-5.6, 4.9, 1.2], [-4.4, 5.4, -1.4], [-2.0, 5.9, -3.2], [1.0, 6.0, -3.4], [3.6, 5.8, -2.2], [5.3, 5.5, -0.2], [5.9, 5.35, 1.6],
    [5.5, 5.3, 2.8], [4.6, 5.3, 2.6], [4.2, 5.4, 1.2],
    // THE HOUSE: out over the stalls down its middle to its far end, round, and up to the ring
    [4.4, 5.6, -2.4], [2.8, 6.6, -8.8], [1.2, 7.6, -14.5], [1.0, 7.8, -19], [1.0, 7.6, -23.5], [0.8, 7.7, -26.0], [0.2, 8.1, -28.0], [-0.8, 8.8, -28.2], [-1.3, 9.8, -26.4],
    [-0.8, 11.2, -24.0], [-0.3, 12.8, -22], [0, 13.8, -20.4], [0, 14.2, -19.5], TH.RING];
  return { path: makePath(pts), pts };
}
// the gaze, keyed to the metres flown: [metres, x, y, z], or [metres, 'ship', dx, y] for a point that rides with the ship
const GAZE = [[0, 0, -6.8, 15.7], [6.5, 0, -6.6, 15.7], [10.5, 5, -3.4, 18], [13.5, 5, -3.4, 18], [21, 1.5, -8.6, 36], [26.5, 1.5, -8.6, 36], [30.5, 'lift', -0.8, 1.8],
  // (up through the open floor: straight down the stage over the sea's rows to the house; round by the left to the cloud machine's face;
  // then the left hand's wings in their file, and the fly gallery over them)
  [40.5, 'lift', -0.8, 2.7], [49, 0, 10.6, 22.9], [56, 0, 10.6, 22.9], [61.5, -0.5, 5.2, 22], [68.5, -0.5, 5.2, 22],
  // (low before the waves on the left, across them to the ship; round by the stage's right to the house, seen from the footlights; round again to
  // the whole sea; then, backing out down the house, the boxes of the left hand with the stage beyond them, the stage in its frame, the ring)
  [76, 'ship', -0.5, 3.4], [81, 'ship', -0.5, 3.4], [84.5, 20, 5, 4], [87.5, 14, 7, -14], [90.5, -2.8, 11.5, -37], [95.5, -2.8, 11.5, -37], [98.5, 32, 6, -12], [101, 28, 6, 20], [103.5, 0, 5.8, 22], [109, 0, 5.8, 22],
  [114.5, 0, 5.5, 10], [118, -10, 8, 6], [124, -10, 8, 6], [129, 0, 6, 10], [136, 0, 6, 10], [140, 0, 12.5, -19], [142.5, 0, 14.2, -19], [151.6, 0, 14.2, -19],
  // (the last two metres and beyond the ring: the target runs on ahead through the ring, so that it never stands at the lens's own place)
  [153.6, 0, 14.2, 40], [400, 0, 14.2, 40]];
export function flightPlan(R) {
  const g = new THREE.Vector3(), L = R.path.length;
  const A = [0, 0, 0], B = [0, 0, 0], tg = (e, u, o) => { if (e[1] === 'ship') { o[0] = shipX(u) + e[2]; o[1] = e[3]; o[2] = SHIPZ; } else if (e[1] === 'lift') { o[0] = e[2]; o[1] = liftY(u) + e[3]; o[2] = LIFTZ; } else { o[0] = e[1]; o[1] = e[2]; o[2] = e[3]; } return o; };
  const gazeAt = (t, u) => {
    const m = u * L; let i = 0; while (i < GAZE.length - 2 && m > GAZE[i + 1][0]) i++;
    const a = tg(GAZE[i], u, A), b = tg(GAZE[i + 1], u, B), f = ss(m, GAZE[i][0], GAZE[i + 1][0]);
    return g.set(lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f));
  };
  return { camera: { fov: 64, near: 0.3, far: 400, lookAhead: 9, sway: 0.4, bank: 0.03 }, pois: [{ at: gazeAt, from: -0.2, to: 1.2, weight: 0.85, fade: 0.05 }] };
}
// the line of the box fronts round the house, from the left of the proscenium round to its right, in N bays of one length:
// N + 1 points [x, z, nx, nz] (nx, nz: the level direction out of the house, towards the boxes' backs)
export function houseLine(N = 43) {
  const d = [], HW = TH.HW, HR = TH.HRZ;
  for (let i = 0; i <= 40; i++) d.push([-HW, TH.APRON - 0.6 + (TH.HZC - TH.APRON + 0.6) * i / 40]);
  for (let i = 1; i <= 240; i++) { const a = Math.PI * i / 240; d.push([-HW * Math.cos(a), TH.HZC - HR * Math.sin(a)]); }
  for (let i = 1; i <= 40; i++) d.push([HW, TH.HZC + (TH.APRON - 0.6 - TH.HZC) * i / 40]);
  const cum = [0]; for (let i = 1; i < d.length; i++) cum.push(cum[i - 1] + Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]));
  const out = [], L = cum[cum.length - 1]; let k = 0;
  for (let j = 0; j <= N; j++) { const t = L * j / N; while (k < d.length - 2 && cum[k + 1] < t) k++;
    const f = (t - cum[k]) / (cum[k + 1] - cum[k] || 1), x = lerp(d[k][0], d[k + 1][0], f), z = lerp(d[k][1], d[k + 1][1], f);
    let tx = d[k + 1][0] - d[k][0], tz = d[k + 1][1] - d[k][1]; const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
    let nx = tz, nz = -tx; if (nx * x + nz * (z + 14) < 0) { nx = -nx; nz = -nz; }
    out.push([x, z, nx, nz]); }
  return out;
}
const quadGeo = (p0, p1, p2, p3) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...p0, ...p1, ...p2, ...p3], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; };

export default {
  id: 'wooden-sea-stage',
  name: 'A Wooden Sea',
  category: 'interior',
  weirdness: 0.15,
  media: ['interior'],
  async build(ctx) {
    const { rng } = ctx;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#070504');
    const LT = makeStageLight(), U = LT.uniforms, matS = LT.surface(), matD = LT.surface({ side: THREE.DoubleSide });
    await ctx.yield();
    const R = makeRoute(), path = R.path;
    const rMen = rng.fork('men');
    const disposables = [], flames = [];
    const mesh = (b, mat, name, parent = scene) => { const g = b.build(); disposables.push(g); const m = new THREE.Mesh(g, mat); m.name = name; parent.add(m); return m; };
    const box = (b, x0, x1, y0, y1, z0, z1, c, surf) => b.add(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), { p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], c, surf });
    const S_BRICK = sf(SID.BRICK, 0.05), S_FLAGS = sf(SID.FLAGS, 0.1), S_BOARDS = sf(SID.BOARDS, 0.25), S_WX = sf(SID.WOODX, 0.15), S_WZ = sf(SID.WOODZ, 0.15), S_WY = sf(SID.WOOD, 0.15);
    const S_GILT = sf(SID.GILT, 0.6, 0.9), S_PLASTER = sf(SID.PLASTER, 0.12), S_VELVET = sf(SID.VELVET, 0.04), S_IRON = sf(SID.PLAIN, 0.4, 0.7);
    const SW = TH.SW, CF = TH.CF, T = TH.TRAP, JY = -TH.SLAB - TH.JOIST;

    // ------------------------------------------------------------------ the cellar
    {
      const b = INT.makeBuilder();
      box(b, -SW, SW, CF - 0.4, CF, TH.CZ, TH.ZB, '#644e44', S_FLAGS);
      box(b, -SW - 0.5, -SW, CF, 0, TH.CZ, TH.ZB, TONE.BRICK, S_BRICK); box(b, SW, SW + 0.5, CF, 0, TH.CZ, TH.ZB, TONE.BRICK, S_BRICK);
      box(b, -SW, SW, CF, 0, TH.ZB, TH.ZB + 0.5, TONE.BRICK, S_BRICK); box(b, -SW, SW, CF, TH.VAULT + 1.2, TH.CZ - 0.5, TH.CZ, TONE.BRICK, S_BRICK);
      // the store vault under the house: its ceiling, and two rows of piers that leave the middle aisle clear
      box(b, -SW, SW, TH.VAULT, TH.VAULT + 0.6, TH.CZ, TH.APRON - 0.2, TONE.BRICK, S_BRICK);
      for (let z = -33; z < -4; z += 6) for (const s of [-1, 1]) box(b, s * 9.5 - 0.6, s * 9.5 + 0.6, CF, TH.VAULT, z - 0.6, z + 0.6, TONE.BRICK, S_BRICK);
      mesh(b, matS, 'cellar');
      await ctx.yield();
      // the stage's floor from below and above: boards on joists, the floor open behind the sea
      const f = INT.makeBuilder(), BRD = '#9c917e', SLX = TH.SL + 1.2;
      const floor = (x0, x1, z0, z1) => box(f, x0, x1, -TH.SLAB, 0, z0, z1, BRD, S_BOARDS);
      const joist = (z, x0 = -SW, x1 = SW) => box(f, x0, x1, JY, -TH.SLAB, z - 0.13, z + 0.13, TONE.OAK, S_WX);
      // (the floor is cut open under each roller of the sea, so that the cellar sees them turn and takes their light)
      floor(-SW, -SLX, TH.APRON, T[2]); floor(SLX, SW, TH.APRON, T[2]);
      let zf = TH.APRON; for (let i = 0; i < TH.SN; i++) { floor(-SLX, SLX, zf, seaZ(i) - TH.SLOT); zf = seaZ(i) + TH.SLOT; joist(seaZ(i) - TH.SLOT - 0.13); joist(seaZ(i) + TH.SLOT + 0.13); }
      floor(-SLX, SLX, zf, T[2]);
      floor(-SW, T[0], T[2], T[3]); floor(T[1], SW, T[2], T[3]); floor(-SW, SW, T[3], TH.ZB);
      for (let z = TH.APRON + 0.6; z < seaZ(0) - 1.2; z += 1.5) joist(z);
      for (let z = seaZ(TH.SN - 1) + 1.9; z < T[2] - 0.4; z += 1.4) joist(z);
      for (let z = T[2] + 1.2; z < T[3] - 0.4; z += 1.5) { joist(z, -SW, T[0]); joist(z, T[1], SW); }
      for (let z = T[3] + 1.2; z < TH.ZB; z += 1.5) joist(z);
      // the trimmers round the open floor
      box(f, T[0] - 0.3, T[0], JY - 0.1, 0, T[2], T[3], TONE.OAK, S_WZ); box(f, T[1], T[1] + 0.3, JY - 0.1, 0, T[2], T[3], TONE.OAK, S_WZ);
      box(f, T[0] - 0.3, T[1] + 0.3, JY - 0.1, 0, T[2] - 0.3, T[2], TONE.OAK, S_WX); box(f, T[0] - 0.3, T[1] + 0.3, JY - 0.1, 0, T[3], T[3] + 0.3, TONE.OAK, S_WX);
      // posts under the joists, a row to either side of the middle
      for (let k = 0; k < 7; k++) for (const s of [-1, 1]) { box(f, s * 15.9 - 0.17, s * 15.9 + 0.17, CF, JY, 8.6 + 3.2 * k - 0.17, 8.6 + 3.2 * k + 0.17, TONE.OAK, S_WY); box(f, s * 15.9 - 0.26, s * 15.9 + 0.26, CF, CF + 0.3, 8.6 + 3.2 * k - 0.26, 8.6 + 3.2 * k + 0.26, '#6a645c', sf(SID.STONE, 0.05)); }
      // the beam that carries the head of the capstan's shaft
      box(f, -0.5, 0.5, JY - 0.3, JY, 15.12, 16.28, TONE.OAK, S_WZ);
      // the long shafts over the chariots, a drum on each for every pair of wings
      for (const s of [-1, 1]) {
        f.add(new THREE.CylinderGeometry(0.32, 0.32, 22, 12), { p: [s * 13, -2.5, 16], r: [Math.PI / 2, 0, 0], c: TONE.DARK, surf: S_WZ });
        for (let k = 0; k < TH.WN; k++) f.add(new THREE.CylinderGeometry(0.7, 0.7, 0.9, 16), { p: [s * 13, -2.5, wingZ(k) + 0.3], r: [Math.PI / 2, 0, 0], c: TONE.PINE, surf: S_WZ });
      }
      mesh(f, matS, 'stage floor');
    }
    await ctx.yield();
    // the capstan: a rotor that the clock turns (shaft, drum, eight bars), and its walkers
    const rotor = new THREE.Group(); rotor.position.set(TH.CAP[0], CF, TH.CAP[1]); scene.add(rotor);
    {
      const b = INT.makeBuilder();
      const HS = JY - CF;
      b.add(new THREE.CylinderGeometry(0.3, 0.4, HS, 14), { p: [0, HS / 2, 0], c: TONE.OAK, surf: S_WY });
      b.add(new THREE.CylinderGeometry(0.72, 0.8, 0.2, 16), { p: [0, 0.1, 0], c: '#5a544c', surf: sf(SID.STONE, 0.05) });
      // the drum high on the shaft: a dark core between two flanges, twelve whelps, and the rope wound on it
      b.add(new THREE.CylinderGeometry(1.0, 1.0, 2.6, 20), { p: [0, 6.0, 0], c: TONE.DARK, surf: S_WY });
      for (const y of [4.72, 7.28]) b.add(new THREE.CylinderGeometry(1.5, 1.5, 0.14, 24), { p: [0, y, 0], c: TONE.OAK, surf: S_WY });
      for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; b.add(new THREE.BoxGeometry(0.2, 2.42, 0.22), { p: [1.08 * Math.cos(a), 6.0, 1.08 * Math.sin(a)], r: [0, -a, 0], c: TONE.PINE, surf: S_WY }); }
      b.add(new THREE.CylinderGeometry(1.27, 1.27, 1.36, 28, 1, true), { p: [0, 5.8, 0], c: TONE.ROPE, surf: sf(SID.ROPED, 0.05) });
      // the head the bars are set in, banded with iron
      b.add(new THREE.CylinderGeometry(0.75, 0.75, 0.7, 16), { p: [0, 1.05, 0], c: TONE.DARK, surf: S_WY });
      for (const y of [0.78, 1.32]) b.add(new THREE.CylinderGeometry(0.78, 0.78, 0.07, 16), { p: [0, y, 0], c: TONE.IRON, surf: S_IRON });
      for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; strut(b, [0.5 * Math.cos(a), 1.05, 0.5 * Math.sin(a)], [TH.BAR * Math.cos(a), 1.05, TH.BAR * Math.sin(a)], 0.14, 0.14, [0, 1, 0], TONE.PINE, S_WX); }
      const places = []; for (let j = 0; j < 8; j++) for (const r of TH.CAPR) places.push({ a: j / 8 * TAU + 0.3 / r, r });
      mesh(b, matS, 'capstan', rotor);
      const g = figureGeometry(), n = places.length, ph = new Float32Array(n * 4), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Euler(); disposables.push(g);
      const TONES = ['#4e4234', '#5c4c3c', '#444240', '#625444', '#483c32', '#584a40', '#52302c', '#2e3c48', '#3e4836', '#5a4a2c', '#44342c', '#50302a'];
      const men = new THREE.InstancedMesh(g, LT.figure(), n); men.name = 'walkers';
      places.forEach((q, i) => {
        const h = rMen.range(0.94, 1.06); _e.set(0, -q.a, 0); _q.setFromEuler(_e); _p.set(q.r * Math.cos(q.a), 0, q.r * Math.sin(q.a)); _s.set(h, h, h);
        men.setMatrixAt(i, _m.compose(_p, _q, _s)); men.setColorAt(i, _c.set(rMen.pick(TONES)).multiplyScalar(rMen.range(0.85, 1.1)));
        ph[i * 4] = rMen.range(0, TAU); ph[i * 4 + 1] = 1; ph[i * 4 + 2] = rMen(); ph[i * 4 + 3] = q.r === TH.CAPR[0] ? 11 : 14;
      });
      g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 4)); men.instanceMatrix.needsUpdate = true; men.frustumCulled = false; rotor.add(men); disposables.push({ dispose: () => men.dispose() });
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the stage house
    {
      const b = INT.makeBuilder();
      const SBR = '#84684c', S_PLK = sf(SID.PLANKS, 0.08);
      box(b, -SW - 0.5, -SW, 0, TH.ROOF, -TH.PT, TH.ZB, SBR, S_PLK); box(b, SW, SW + 0.5, 0, TH.ROOF, -TH.PT, TH.ZB, SBR, S_PLK);
      box(b, -SW, SW, 0, TH.ROOF, TH.ZB, TH.ZB + 0.5, SBR, S_PLK); box(b, -SW, SW, TH.ROOF, TH.ROOF + 0.4, -TH.PT, TH.ZB, TONE.DARK, S_WX);
      // the timber frame the boards are nailed to: posts up to the gridiron, rails, a brace in the foot of every bay; the brackets
      // under the fly galleries, and the galleries' rails
      for (const s of [-1, 1]) {
        for (let z = 2.8; z < TH.ZB; z += 4.4) { box(b, s * (SW - 0.16) - 0.16, s * (SW - 0.16) + 0.16, 0, TH.GRID, z - 0.16, z + 0.16, TONE.OAK, S_WY);
          strut(b, [s * (SW - 0.2), 10.2, z], [s * 19.6, 12.15, z], 0.16, 0.16, [0, 0, 1], TONE.OAK, S_WY);
          if (z < TH.ZB - 4.4) strut(b, [s * (SW - 0.12), 0.2, z + 0.3], [s * (SW - 0.12), 3.1, z + 4.1], 0.14, 0.14, [1, 0, 0], TONE.OAK, S_WY); }
        for (const y of [3.2, 6.4, 9.6, 16.5, 20.5]) box(b, s > 0 ? SW - 0.24 : -SW, s > 0 ? SW : -SW + 0.24, y - 0.12, y + 0.12, 0.2, TH.ZB, TONE.OAK, S_WZ);
        for (let z = 2.2; z < TH.ZB - 2; z += 2.2) box(b, s * 19.4 - 0.05, s * 19.4 + 0.05, 12.5, 13.5, z - 0.05, z + 0.05, TONE.OAK, S_WY);
        box(b, s * 19.4 - 0.04, s * 19.4 + 0.04, 12.95, 13.03, 2, TH.ZB - 2, TONE.OAK, S_WZ);
        for (const x of [11.2, 14.8, 18.4]) box(b, s * x - 0.16, s * x + 0.16, 0, TH.GRID, 0.14, 0.42, TONE.OAK, S_WY);
        for (const y of [3.2, 6.4, 9.6]) box(b, s > 0 ? TH.PW + 0.4 : -SW, s > 0 ? SW : -TH.PW - 0.4, y - 0.12, y + 0.12, 0.14, 0.36, TONE.OAK, S_WX);
        // a long ladder to the gallery in the corner by the proscenium's wall, and a lantern hung from a bracket there
        for (const dz of [-0.28, 0.28]) strut(b, [s * 17.6, 0, 2.6 + dz], [s * 19.3, 12.7, 2.6 + dz], 0.07, 0.1, [0, 0, 1], TONE.PINE, S_WY);
        for (let k = 1; k < 38; k++) { const f = k / 38, lx = s * (17.6 + 1.7 * f); box(b, lx - 0.03, lx + 0.03, 12.7 * f - 0.025, 12.7 * f + 0.025, 2.32, 2.88, TONE.PINE, S_WZ); }
        box(b, s * 16 - 0.04, s * 16 + 0.04, 5.9, 5.98, 0.14, 1.4, TONE.IRON, S_IRON); box(b, s * 16 - 0.012, s * 16 + 0.012, 5.45, 5.9, 1.288, 1.312, TONE.IRON, S_IRON);
        box(b, s * 16 - 0.1, s * 16 + 0.1, 5.06, 5.1, 1.2, 1.4, TONE.IRON, S_IRON); box(b, s * 16 - 0.11, s * 16 + 0.11, 5.4, 5.45, 1.19, 1.41, TONE.IRON, S_IRON);
        for (const dx of [-0.1, 0.1]) for (const dz of [-0.1, 0.1]) box(b, s * 16 + dx - 0.012, s * 16 + dx + 0.012, 5.1, 5.4, 1.3 + dz - 0.012, 1.3 + dz + 0.012, TONE.IRON, S_IRON);
        flames.push([s * 16, 5.15, 1.3]);
        // the rack the spare flats stand in
        for (const z of [0.9, 6.9]) box(b, s * 20.1 - 0.07, s * 20.1 + 0.07, 0, 9.0, z - 0.07, z + 0.07, TONE.OAK, S_WY);
        box(b, s * 20.1 - 0.06, s * 20.1 + 0.06, 8.88, 9.0, 0.9, 6.9, TONE.OAK, S_WZ);
      }
      for (const y of [16.5, 20.5]) box(b, -SW, SW, y - 0.12, y + 0.12, 0.14, 0.36, TONE.OAK, S_WX);
      for (let x = -19.8; x < SW; x += 4.4) box(b, x - 0.16, x + 0.16, 0, TH.GRID, TH.ZB - 0.32, TH.ZB, TONE.OAK, S_WY);
      for (const y of [3.2, 6.4, 9.6, 16.5, 20.5]) box(b, -SW, SW, y - 0.12, y + 0.12, TH.ZB - 0.24, TH.ZB, TONE.OAK, S_WX);
      // the proscenium's wall: to either side of the opening and over it
      box(b, -SW, -TH.PW, -TH.SLAB, TH.ROOF, -TH.PT, 0, TONE.CREAM, S_PLASTER); box(b, TH.PW, SW, -TH.SLAB, TH.ROOF, -TH.PT, 0, TONE.CREAM, S_PLASTER); box(b, -TH.PW, TH.PW, TH.PH, TH.ROOF, -TH.PT, 0, TONE.CREAM, S_PLASTER);
      box(b, -SW, -TH.PW, 0, TH.ROOF, 0, 0.14, SBR, S_PLK); box(b, TH.PW, SW, 0, TH.ROOF, 0, 0.14, SBR, S_PLK); box(b, -TH.PW, TH.PW, TH.PH, TH.ROOF, 0, 0.14, SBR, S_PLK);
      // (the opening's cheeks, behind the house curtain, are lined dark like the rest of the stage's side of that wall)
      for (const s of [-1, 1]) box(b, s > 0 ? TH.PW - 0.08 : -TH.PW, s > 0 ? TH.PW : -TH.PW + 0.08, 0, TH.PH, -0.74, 0.14, '#3a2e2a', S_BRICK);
      // the gridiron and the fly galleries
      for (let x = -SW + 0.4; x < SW; x += 0.9) box(b, x, x + 0.22, TH.GRID, TH.GRID + 0.22, 1, TH.ZB - 1, TONE.DARK, S_WZ);
      for (const s of [-1, 1]) { box(b, s > 0 ? 19.4 : -SW, s > 0 ? SW : -19.4, 12.2, 12.5, 2, TH.ZB - 2, TONE.OAK, S_WZ); box(b, s * 19.4 - 0.06, s * 19.4 + 0.06, 13.5, 13.62, 2, TH.ZB - 2, TONE.OAK, S_WZ); }
      // the backcloth
      b.add(new THREE.PlaneGeometry(36, 21), { p: [0, 10.5, TH.BACK], r: [0, Math.PI, 0], c: '#ffffff', surf: sf(SID.SKY, 0.03) });
      mesh(b, matS, 'stage house');
    }
    await ctx.yield();
    // the second backcloth, a roll drop before the first: a clear dawn, which unrolls from its batten as the flight nears its end
    const dropRoll = new THREE.Group(); dropRoll.position.set(0, 21, TH.BACK - 0.4); scene.add(dropRoll);
    {
      const d = INT.makeBuilder(); d.add(new THREE.PlaneGeometry(36, 21), { p: [0, 10.5, 0], r: [0, Math.PI, 0], c: '#ffffff', surf: sf(SID.DAWN, 0.03) });
      const dm = mesh(d, matS, 'second backcloth'); dm.position.set(0, 0, TH.BACK - 0.4);
      const r = INT.makeBuilder(); r.add(new THREE.CylinderGeometry(0.2, 0.2, 36.6, 12), { r: [0, 0, Math.PI / 2], c: '#75664f', surf: sf(SID.BACK, 0.03) });
      mesh(r, matS, 'drop roller', dropRoll);
      const t = INT.makeBuilder(); box(t, -18.3, 18.3, 21.1, 21.3, TH.BACK - 0.5, TH.BACK - 0.3, TONE.PINE, S_WX); mesh(t, matS, 'drop batten');
    }
    // the wings: for each pair and side a palace flat and a storm flat, each on its chariot in the cellar
    const wings = [], rWing = rng.fork('wings'), ropes = [];
    for (let k = 0; k < TH.WN; k++) for (const s of [-1, 1]) for (const storm of [0, 1]) {
      const b = INT.makeBuilder(), z = wingZ(k) + storm * 0.6, ph = rWing() * 9, crag = storm ? 1.1 : 0, W = TH.WW, H = TH.WH;
      b.add(wingGeometry(W, H, s, crag, ph), { c: '#ffffff', surf: sf(storm ? SID.STORM : SID.PALACE, 0.04) });
      // its back: canvas on a frame of battens
      b.add(wingGeometry(W, H, s, crag, ph, 1), { p: [0, 0, 0.03], c: '#5e5140', surf: sf(SID.BACK, 0.03) });
      for (const y of [0.06, H * 0.34, H * 0.67, H - 0.06]) box(b, Math.min(0, s * W / 2), Math.max(0, s * W / 2), y - 0.05, y + 0.05, 0.03, 0.11, TONE.DARK, S_WX);
      for (const x of [s * (W / 2 - 0.05), s * 0.05]) box(b, x - 0.05, x + 0.05, 0, H, 0.03, 0.11, TONE.DARK, S_WY);
      strut(b, [s * 0.1, 0.1, 0.07], [s * (W / 2 - 0.1), H * 0.34, 0.07], 0.07, 0.07, [0, 0, 1], TONE.DARK, S_WY);
      // the chariot: a mast down through the floor to a wheeled frame that runs on rails on the cellar's floor
      box(b, s * 1.4 - 0.13, s * 1.4 + 0.13, CF + 0.55, 0.4, 0.14, 0.4, TONE.PINE, S_WY);
      box(b, s * 1.4 - 1.2, s * 1.4 + 1.2, CF + 0.3, CF + 0.58, 0.02, 0.52, TONE.OAK, S_WX);
      strut(b, [s * 1.4 - 1.0, CF + 0.58, 0.27], [s * 1.4, CF + 2.2, 0.27], 0.1, 0.1, [0, 0, 1], TONE.OAK, S_WY); strut(b, [s * 1.4 + 1.0, CF + 0.58, 0.27], [s * 1.4, CF + 2.2, 0.27], 0.1, 0.1, [0, 0, 1], TONE.OAK, S_WY);
      for (const wx of [-0.9, 0.9]) for (const wz of [-0.03, 0.57]) b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 14), { p: [s * 1.4 + wx, CF + 0.3, wz], r: [Math.PI / 2, 0, 0], c: TONE.IRON, surf: S_IRON });
      const m = mesh(b, matS, 'wing'); m.position.z = z; m.userData = { k, s, storm }; wings.push(m);
      if (wings.length % 3 === 0) await ctx.yield();
    }
    for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const fb = INT.makeBuilder(); fb.add(wingGeometry(TH.WW, 8.6, 1, 0, 0), { c: '#ffffff', surf: sf(SID.PALACE, 0.04) });
      const fm = mesh(fb, matD, 'stood flat'); fm.position.set(sd * (21.4 - 0.45 * k), 0, 3.4 + 0.5 * k); fm.rotation.set(0, sd * Math.PI / 2, -sd * 0.012 * (k + 1)); }
    {
      // the chariots' rails, and a post with a ladder of lamps behind each pair of wings
      const b = INT.makeBuilder();
      for (let k = 0; k < TH.WN; k++) for (const s of [-1, 1]) {
        for (const dz of [0.27, 0.87]) box(b, s > 0 ? 9.0 : -20.5, s > 0 ? 20.5 : -9.0, CF, CF + 0.08, wingZ(k) + dz - 0.2, wingZ(k) + dz + 0.2, TONE.DARK, S_WX);
        box(b, s * (TH.PW + 1.1) - 0.05, s * (TH.PW + 1.1) + 0.05, 0, 8.6, wingZ(k) + 1.45, wingZ(k) + 1.55, TONE.DARK, S_WY);
        for (let j = 0; j < 6; j++) box(b, s * (TH.PW + 1.1) - 0.09, s * (TH.PW + 1.1) + 0.09, 1.38 + 1.3 * j, 1.5 + 1.3 * j, wingZ(k) + 1.3, wingZ(k) + 1.5, '#b08a3a', S_GILT);
      }
      mesh(b, matS, 'rails and ladders');
    }
    await ctx.yield();
    // THE SEA: seven rollers across the stage, each turning in its cut of the floor, all driven from one shaft under the floor on the
    // right hand, which the capstan turns by a rope. By the clock.
    const rollers = [], rSea = rng.fork('sea'), SHX = TH.SL + 0.8, SHY = -2.0;
    const shaft = new THREE.Group(); shaft.position.set(SHX, SHY, 0); scene.add(shaft);
    {
      const b = INT.makeBuilder(); b.add(rollerGeometry(TH.SL, TH.SR, 0.34, 4.2, 128, 28), { c: '#ffffff', surf: sf(SID.WAVE, 0.12) });
      b.add(new THREE.CylinderGeometry(0.07, 0.07, 2 * TH.SL + 3.0, 8), { r: [0, 0, Math.PI / 2], c: TONE.IRON, surf: S_IRON });
      for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(TH.SR + 0.36, TH.SR + 0.36, 0.06, 20), { p: [s * TH.SL, 0, 0], r: [0, 0, Math.PI / 2], c: '#1d5a62', surf: S_WY });
      wheelInto(b, 0.42, 0.12, 3, [SHX, 0, 0], TONE.PINE, S_WY, Math.PI / 2);
      const rg = b.build(); disposables.push(rg);
      const cr = INT.makeBuilder();
      for (let i = 0; i < TH.SN; i++) {
        const m = new THREE.Mesh(rg, matS); m.name = 'roller'; m.position.set(0, seaY(i), seaZ(i)); m.userData = { dir: i % 2 ? -1 : 1, ph: i * 1.9 }; scene.add(m); rollers.push(m);
        // its two cradles: a pair of posts and a cap at either end, outside the cut
        for (const s of [-1, 1]) { const x = s * (TH.SL + 1.38);
          box(cr, x - 0.09, x + 0.09, 0, seaY(i) + 0.22, seaZ(i) - 0.32, seaZ(i) - 0.14, TONE.OAK, S_WY); box(cr, x - 0.09, x + 0.09, 0, seaY(i) + 0.22, seaZ(i) + 0.14, seaZ(i) + 0.32, TONE.OAK, S_WY);
          box(cr, x - 0.11, x + 0.11, seaY(i) + 0.1, seaY(i) + 0.22, seaZ(i) - 0.34, seaZ(i) + 0.34, TONE.OAK, S_WZ); }
        // the belt from the shaft below
        ropes.push(hang([SHX - 0.4, SHY, seaZ(i)], [SHX, seaY(i), seaZ(i) - 0.42], 0, 2, 1), hang([SHX + 0.4, SHY, seaZ(i)], [SHX, seaY(i), seaZ(i) + 0.42], 0, 2, -1));
      }
      // a ground row of waves before the first roller, and a low one far upstage before the backcloth's lamps
      cr.add(sawnStrip(2 * TH.SL + 1.4, 0.95, 0.42, 21, true, rSea), { p: [0, 0, seaZ(0) - 1.25], c: '#ffffff', surf: sf(SID.WAVEFLAT, 0.2) });
      cr.add(sawnStrip(27, 0.8, 0.3, 30, true, rSea), { p: [0, 0, TH.BACK - 1.25], c: '#ffffff', surf: sf(SID.WAVEFLAT, 0.2) });
      for (let x = -9; x <= 9; x += 3) { strut(cr, [x, 0, seaZ(0) - 0.85], [x, 0.6, seaZ(0) - 1.22], 0.07, 0.07, [1, 0, 0], TONE.PINE, S_WY); }
      mesh(cr, matD, 'cradles');
      // the shaft under the floor with a wheel for each roller and a great wheel for the capstan's rope; its bearers
      const sh = INT.makeBuilder();
      sh.add(new THREE.CylinderGeometry(0.11, 0.11, 20, 10), { p: [0, 0, 17.5], r: [Math.PI / 2, 0, 0], c: TONE.DARK, surf: S_WZ });
      for (let i = 0; i < TH.SN; i++) wheelInto(sh, 0.4, 0.12, 3, [0, 0, seaZ(i)], TONE.PINE, S_WY);
      wheelInto(sh, 1.05, 0.16, 4, [0, 0, TH.CAP[1]], TONE.PINE, S_WY);
      mesh(sh, matS, 'shaft', shaft);
      const be = INT.makeBuilder();
      for (const z of [8.0, 12.4, 18.8, 27.0]) { box(be, SHX - 0.12, SHX + 0.12, CF, SHY + 0.05, z - 0.12, z + 0.12, TONE.OAK, S_WY); box(be, SHX - 0.3, SHX + 0.3, SHY - 0.3, SHY - 0.16, z - 0.14, z + 0.14, TONE.OAK, S_WX); }
      mesh(be, matS, 'bearers');
      // the rope from the capstan's drum to the great wheel
      ropes.push(hang([0, -4.3, TH.CAP[1] - 1.27], [SHX, SHY + 1.05, TH.CAP[1]], 0.12, 8, 1), hang([0, -4.0, TH.CAP[1] + 1.27], [SHX, SHY - 1.05, TH.CAP[1]], 0.1, 8, -1));
    }
    await ctx.yield();
    {
      const v = INT.makeBuilder(), H = JY - CF;
      for (let i = 0; i < TH.SN; i++) v.add(new THREE.PlaneGeometry(2 * TH.SL + 1.2, H), { p: [0, CF + H / 2, seaZ(i)], c: '#ffffff', surf: sf(SID.PLAIN) });
      const vm = mesh(v, LT.veil(), 'veils'); vm.renderOrder = 5;
      const sh = INT.makeBuilder(); for (let k = 0; k < 6; k++) sh.add(new THREE.PlaneGeometry(T[1] - T[0] + 0.6, -CF), { p: [(T[0] + T[1]) / 2, CF / 2, T[2] + 1 + 2 * k], c: '#ffffff', surf: sf(SID.PLAIN) });
      const sm = mesh(sh, LT.shaft(), 'shaft of light'); sm.renderOrder = 5;
      const sl = INT.makeBuilder(); for (let k = 0; k < TH.WN; k++) for (const sd of [-1, 1]) sl.add(new THREE.PlaneGeometry(11.6, H), { p: [sd * 15.1, CF + H / 2, wingZ(k) + 0.57], c: '#ffffff', surf: sf(SID.PLAIN) });
      const slm = mesh(sl, LT.slit(), 'slits of light'); slm.renderOrder = 5;
    }
    const dolphins = [];
    {
      const b = INT.makeBuilder(); b.add(dolphinGeometry(), { c: '#ffffff', surf: sf(SID.DOLPH, 0.15) }); const dg = b.build(); disposables.push(dg);
      const rDo = rng.fork('dolphins'), pv = INT.makeBuilder();
      for (const [x, z, sx] of [[-7.6, 10.5, 1], [-5.3, 10.5, 1], [-3.0, 10.5, 1], [-6.4, 13.1, 1], [-4.0, 13.1, 1], [4.6, 13.1, -1], [-2.0, 24.5, 1], [6.4, 21.9, -1]]) {
        const g = new THREE.Group(); g.position.set(x, 0.05, z); g.scale.x = sx; const m = new THREE.Mesh(dg, matD); m.name = 'dolphin'; g.add(m); scene.add(g);
        g.userData = { ph: rDo.range(0, TAU), w: rDo.range(0.7, 0.95), sx }; dolphins.push(g);
        box(pv, x - 0.06, x + 0.06, 0, 0.5, z + 0.03, z + 0.12, TONE.OAK, S_WY);
      }
      mesh(pv, matS, 'dolphin posts');
    }
    // THE SHIP on its truck, in the lane between the fourth and the fifth roller; it crosses with the flight and rocks by the clock
    const ship = new THREE.Group(), shipBody = new THREE.Group(); ship.position.set(0, 0, SHIPZ); ship.add(shipBody); scene.add(ship);
    {
      const b = INT.makeBuilder(), HY = 0.95;
      b.add(hullGeometry(0.42), { p: [0, HY, 0], c: '#ffffff', surf: sf(SID.HULL, 0.25) });
      const masts = [[-1.9, 5.0, 1.5], [0.1, 6.3, 2.0], [2.0, 5.3, 1.6]];
      for (const [x, top, w] of masts) {
        b.add(new THREE.CylinderGeometry(0.045, 0.075, top - 1.9, 7), { p: [x, HY + (top + 1.9) / 2 - 0.4, 0], c: TONE.PINE, surf: S_WY });
        let y = HY + top - 0.5, ww = w * 0.72; for (let k = 0; k < (top > 6 ? 3 : 2); k++) { const hgt = 1.15 + 0.3 * k;
          b.add(new THREE.CylinderGeometry(0.03, 0.03, ww + 0.3, 6), { p: [x, y, 0], r: [Math.PI / 2, 0.5, 0], c: TONE.DARK, surf: S_WY });
          b.add(sailGeometry(ww, hgt, 0.22 + 0.05 * k), { p: [x, y - 0.04, 0], r: [0, 0.5, 0], c: '#c4b99c', surf: sf(SID.SAIL, 0.04) });
          y -= hgt + 0.16; ww = w * (0.86 + 0.14 * k); }
      }
      // bowsprit and a plain long pennant of cloth (no device on it)
      strut(b, [2.9, HY + 1.75, 0], [4.3, HY + 2.35, 0], 0.07, 0.07, [0, 1, 0], TONE.PINE, S_WY);
      mesh(b, matD, 'ship', shipBody);
      const rg = ropeGeometry([hang([4.3, HY + 2.35, 0], [2.0, HY + 5.3, 0], 0.05, 4), hang([2.0, HY + 5.3, 0], [0.1, HY + 6.3, 0], 0.04, 3), hang([0.1, HY + 6.3, 0], [-1.9, HY + 5.0, 0], 0.04, 3), hang([-1.9, HY + 5.0, 0], [-3.1, HY + 2.3, 0], 0.05, 4),
        hang([0.1, HY + 6.2, 0], [1.3, HY + 1.4, 0.4], 0, 2), hang([0.1, HY + 6.2, 0], [1.3, HY + 1.4, -0.4], 0, 2), hang([0.1, HY + 6.2, 0], [-1.0, HY + 1.4, 0.4], 0, 2), hang([0.1, HY + 6.2, 0], [-1.0, HY + 1.4, -0.4], 0, 2)]); disposables.push(rg);
      const rm = new THREE.Mesh(rg, LT.rope()); rm.name = 'rigging'; rm.frustumCulled = false; shipBody.add(rm);
      // the truck under her and its track
      const t = INT.makeBuilder(); box(t, -2.3, 2.3, 0.3, 0.5, -0.4, 0.4, TONE.OAK, S_WX);
      for (const x of [-1.7, 1.7]) { box(t, x - 0.08, x + 0.08, 0.5, HY + 0.3, -0.08, 0.08, TONE.OAK, S_WY); for (const z of [-0.46, 0.46]) t.add(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), { p: [x, 0.22, z], r: [Math.PI / 2, 0, 0], c: TONE.IRON, surf: S_IRON }); }
      mesh(t, matS, 'truck', ship);
      const tr = INT.makeBuilder(); for (const z of [-0.46, 0.46]) box(tr, -19, 19, 0, 0.05, SHIPZ + z - 0.05, SHIPZ + z + 0.05, TONE.DARK, S_WX);
      mesh(tr, matS, 'track');
      ropes.push(hang([-19, 0.42, SHIPZ], [19, 0.42, SHIPZ], 0, 2, 1));
    }
    await ctx.yield();
    // THE CLOUD MACHINE: a car hung on four ropes from the gridiron, fronted with cut clouds, a gilded sun turning in their midst
    const cloud = new THREE.Group(), sun = new THREE.Group(), cloudRopes = new THREE.Group(); cloud.position.set(TH.CLOUD[0], 19.5, TH.CLOUD[1]); scene.add(cloud); cloud.add(sun); sun.position.set(0, 2.3, -1.42);
    cloudRopes.position.set(TH.CLOUD[0], TH.GRID, TH.CLOUD[1]); scene.add(cloudRopes);
    {
      const rC = rng.fork('cloud'), c = INT.makeBuilder();
      box(c, -2.9, 2.9, 0, 0.22, -0.5, -0.3, TONE.OAK, S_WX); box(c, -2.9, 2.9, 0, 0.22, 0.3, 0.5, TONE.OAK, S_WX);
      for (const x of [-2.8, -1.4, 0, 1.4, 2.8]) box(c, x - 0.09, x + 0.09, 0.02, 0.2, -0.5, 0.5, TONE.OAK, S_WZ);
      for (const x of [-2.6, 2.6]) { box(c, x - 0.08, x + 0.08, 0.2, 3.6, -0.48, -0.32, TONE.OAK, S_WY); strut(c, [x, 0.2, 0.4], [x, 2.6, -0.4], 0.08, 0.08, [1, 0, 0], TONE.OAK, S_WY); }
      box(c, -2.7, 2.7, 3.5, 3.66, -0.48, -0.32, TONE.OAK, S_WX);
      const cuts = [[6.4, 3.6, 0, 1.7, -0.6, '#c9c4c0'], [5.2, 2.7, -1.2, 1.0, -0.95, '#e6ddd0'], [4.6, 2.5, 1.5, 0.9, -1.15, '#f2e6d2'], [3.6, 1.9, 0.1, 3.5, -0.8, '#d8d2cc'], [3.0, 1.5, -0.2, 0.3, -1.3, '#fff2dc'],
        // (the glory: more clouds to either hand of the car and over it, on a spreader)
        [4.4, 2.4, -4.7, 2.5, -0.3, '#b9b6b8'], [4.0, 2.2, 4.9, 3.0, -0.35, '#c4c0bf'], [3.2, 1.8, -3.3, 4.7, -0.5, '#d9d2c8'], [3.4, 1.9, 3.3, 5.1, -0.45, '#cfc9c2'], [2.6, 1.5, -6.4, 1.0, -0.75, '#e8dfd0'], [2.8, 1.5, 6.5, 1.3, -0.8, '#efe4d0'], [2.4, 1.3, 0.4, 6.3, -0.3, '#bdb9bb']];
      box(c, -7.2, 7.2, 0.9, 1.06, -0.26, -0.12, TONE.OAK, S_WX); box(c, -4.2, 4.2, 4.6, 4.74, -0.3, -0.16, TONE.OAK, S_WX); for (const x of [-3.6, 3.6]) box(c, x - 0.06, x + 0.06, 1.0, 4.7, -0.3, -0.18, TONE.OAK, S_WY);
      { const ry = []; for (let i = 0; i < 64; i++) { const an = i / 64 * TAU, r = i % 2 ? 0.7 : (i % 8 === 0 ? 5.4 : (i % 4 === 0 ? 4.2 : 3.2)); ry.push([Math.cos(an) * r, Math.sin(an) * r]); }
        c.add(cutGeometry(ry), { p: [0, 2.3, -0.56], c: '#c99a3a', surf: sf(SID.GILT, 0.6, 0.9, 0.12) }); }
      // (more of them, of a stream of their own: two great grey masses behind, small bright ones before and at the skirts)
      const rG = rng.fork('glory'), more = [[5.6, 3.0, -2.6, 3.4, -0.2, '#a9a6ab'], [5.4, 2.9, 2.8, 3.8, -0.24, '#b0adb0'], [3.0, 1.6, -5.6, 4.0, -0.62, '#ddd5c8'], [3.0, 1.7, 5.7, 4.5, -0.66, '#e2d8c8'], [2.2, 1.2, -2.2, 5.9, -0.7, '#e9dfce'],
        [2.2, 1.2, 2.4, 6.2, -0.72, '#e6dccc'], [2.6, 1.4, -3.0, -0.2, -1.0, '#f4e8d4'], [2.6, 1.4, 3.2, -0.1, -1.05, '#f0e4d0'], [1.8, 1.0, -7.6, 3.2, -0.9, '#efe6d6'], [1.8, 1.0, 7.7, 3.6, -0.9, '#ece2d2']];
      for (const [w, h, x, y, z, col] of more) { const o = cloudOutline(w, h, rG);
        c.add(cutGeometry(o), { p: [x, y, z], c: col, surf: sf(SID.CLOUD, 0.03) }); c.add(cutGeometry(o, 1), { p: [x, y, z + 0.03], c: '#75664f', surf: sf(SID.BACK, 0.03) });
        box(c, x - w * 0.4, x + w * 0.4, y - 0.04, y + 0.04, z + 0.03, z + 0.09, TONE.PINE, S_WX); }
      { const gg = new THREE.PlaneGeometry(18, 18); gg.rotateY(Math.PI); disposables.push(gg); const gm = new THREE.Mesh(gg, LT.glow()); gm.name = 'glory'; gm.position.set(0, 2.3, -0.22); gm.renderOrder = 5; cloud.add(gm); }
      for (const [w, h, x, y, z, col] of cuts) { const o = cloudOutline(w, h, rC);
        c.add(cutGeometry(o), { p: [x, y, z], c: col, surf: sf(SID.CLOUD, 0.03) }); c.add(cutGeometry(o, 1), { p: [x, y, z + 0.03], c: '#75664f', surf: sf(SID.BACK, 0.03) });
        box(c, x - w * 0.4, x + w * 0.4, y - 0.04, y + 0.04, z + 0.03, z + 0.09, TONE.PINE, S_WX); box(c, x - 0.04, x + 0.04, y - h * 0.28, y + h * 0.4, z + 0.03, z + 0.09, TONE.PINE, S_WY); }
      mesh(c, matD, 'cloud machine', cloud);
      const sb = INT.makeBuilder(), star = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, r = i % 2 ? 0.95 : (i % 4 ? 1.75 : 2.2); star.push([Math.cos(a) * r, Math.sin(a) * r]); }
      sb.add(cutGeometry(star), { c: '#e8b84a', surf: sf(SID.SUN, 0.7, 0.5, 0.55) }); sb.add(new THREE.CircleGeometry(0.9, 28), { p: [0, 0, -0.04], r: [0, Math.PI, 0], c: '#f4cc66', surf: sf(SID.SUN, 0.8, 0.5, 0.72) });
      mesh(sb, matD, 'sun', sun);
      const rg = ropeGeometry([[-2.6, 0, -0.4], [2.6, 0, -0.4], [-2.6, 0, 0.4], [2.6, 0, 0.4]].map((q) => { const l = [[q[0], 0, q[2]], [q[0], -1, q[2]]]; l.run = 1; return l; })); disposables.push(rg);
      const rm = new THREE.Mesh(rg, LT.rope()); rm.name = 'cloud ropes'; rm.frustumCulled = false; cloudRopes.add(rm);
      // the sky's borders: strips of painted storm cloud hung across the stage, their lower edges sawn in heads
      const bo = INT.makeBuilder();
      for (let i = 0; i < 5; i++) { const sd = rC(), rr = () => sd;
        bo.add(sawnStrip(27, 3.8, 0.9, 13, false, rr), { p: [0, 17.8, wingZ(i) + 1.9], c: '#ffffff', surf: sf(SID.BORDER, 0.03) });
        bo.add(sawnStrip(27, 3.8, 0.9, 13, false, rr, 96, 1), { p: [0, 17.8, wingZ(i) + 1.93], c: '#75664f', surf: sf(SID.BACK, 0.03) });
        for (const x of [-9, -3, 3, 9]) box(bo, x - 0.04, x + 0.04, 15.2, 17.8, wingZ(i) + 1.93, wingZ(i) + 1.99, TONE.PINE, S_WY);
        box(bo, -13.5, 13.5, 15.6, 15.68, wingZ(i) + 1.93, wingZ(i) + 1.99, TONE.PINE, S_WX);
        box(bo, -12.4, 12.4, 15.26, 15.34, wingZ(i) + 2.25, wingZ(i) + 2.45, TONE.DARK, S_WX); for (const x of [-11, -4, 4, 11]) ropes.push(hang([x, 15.34, wingZ(i) + 2.35], [x, TH.GRID, wingZ(i) + 2.35], 0, 2));
        box(bo, -13.5, 13.5, 17.8, 17.9, wingZ(i) + 1.9, wingZ(i) + 1.98, TONE.PINE, S_WX);
        for (const x of [-11, -4, 4, 11]) ropes.push(hang([x, 17.9, wingZ(i) + 1.94], [x, TH.GRID, wingZ(i) + 1.94], 0, 2)); }
      mesh(bo, matS, 'borders');
    }
    await ctx.yield();

    // ------------------------------------------------------------------ THE HOUSE: a horseshoe of four tiers of boxes
    {
      const b = INT.makeBuilder(), cv = INT.makeBuilder(), HL = houseLine(NBOX), NB = HL.length - 1, MID = (NB - 1) / 2, rH = rng.fork('house');
      const _X = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(), _M = new THREE.Matrix4();
      const TOP = TH.TIER0 + TH.TIERH * TH.TIERS;
      // the pit, the stalls' floor and benches, the ceiling
      box(b, -TH.PW, TH.PW, TH.PITY - 0.3, TH.PITY, TH.PITZ, TH.APRON, '#6a5844', S_BOARDS); box(b, -16, 16, TH.STALL - 0.3, TH.STALL, TH.CZ - 3, TH.PITZ, '#8a7860', S_BOARDS);
      box(b, -TH.PW - 0.2, TH.PW + 0.2, TH.PITY, TH.STALL + 0.95, TH.PITZ - 0.15, TH.PITZ, TONE.OAK, S_WX); box(b, -TH.PW - 0.25, TH.PW + 0.25, TH.STALL + 0.95, TH.STALL + 1.03, TH.PITZ - 0.2, TH.PITZ + 0.05, TONE.GOLD, S_GILT);
      box(b, -TH.PW - 0.2, -TH.PW, TH.PITY, TH.STALL + 0.95, TH.PITZ, TH.APRON, TONE.OAK, S_WZ); box(b, TH.PW, TH.PW + 0.2, TH.PITY, TH.STALL + 0.95, TH.PITZ, TH.APRON, TONE.OAK, S_WZ);
      box(b, -0.75, 0.75, TH.STALL, TH.STALL + 0.015, -33.5, TH.PITZ - 0.2, '#8a1c2a', S_VELVET);
      const seats = [], rA = rng.fork('audience');
      for (let z = -8.4; z > -33.5; z -= 1.2) { const hw = (z > TH.HZC ? TH.HW : TH.HW * Math.sqrt(Math.max(0, 1 - ((z - TH.HZC) / TH.HRZ) ** 2))) - 1.5; if (hw < 2.2) continue;
        for (const s of [-1, 1]) { box(b, s > 0 ? 0.9 : -hw, s > 0 ? hw : -0.9, TH.STALL + 0.38, TH.STALL + 0.44, z - 0.2, z + 0.16, '#7a2430', S_VELVET); box(b, s > 0 ? 0.9 : -hw, s > 0 ? hw : -0.9, TH.STALL, TH.STALL + 0.38, z - 0.16, z + 0.12, TONE.OAK, S_WX);
          box(b, s > 0 ? 0.9 : -hw, s > 0 ? hw : -0.9, TH.STALL + 0.44, TH.STALL + 0.86, z - 0.24, z - 0.19, TONE.OAK, S_WX);
          for (let x = 1.25; x < hw - 0.2; x += 0.64) if (rA() < 0.8) seats.push([s * x + rA.range(-0.12, 0.12), TH.STALL + 0.44, z + rA.range(-0.05, 0.05), Math.PI + rA.range(-0.5, 0.5), rA() < 0.42]); } }
      // the music desks in the pit, a candle on each
      for (let x = -7.5; x <= 7.51; x += 1.5) for (const z of [-4.4, -6.2]) { box(b, x - 0.03, x + 0.03, TH.PITY, TH.PITY + 1.1, z - 0.03, z + 0.03, TONE.DARK, S_WY);
        b.add(new THREE.BoxGeometry(0.55, 0.36, 0.03), { p: [x, TH.PITY + 1.22, z], r: [-0.5, 0, 0], c: TONE.OAK, surf: S_WX }); box(b, x + 0.3, x + 0.33, TH.PITY + 1.1, TH.PITY + 1.3, z - 0.015, z + 0.015, '#e8dcc0', S_PLASTER); flames.push([x + 0.315, TH.PITY + 1.31, z]); }
      // the band in the pit: a player on a stool at each desk, facing the stage; a great bass at either end
      for (let x = -7.5; x <= 7.51; x += 1.5) for (const z of [-4.4, -6.2]) { box(b, x - 0.17, x + 0.17, TH.PITY, TH.PITY + 0.44, z - 0.72, z - 0.38, TONE.DARK, S_WX); seats.push([x + rA.range(-0.04, 0.04), TH.PITY + 0.44, z - 0.55, Math.PI + rA.range(-0.12, 0.12), false]); }
      for (const s of [-1, 1]) { b.add(new THREE.SphereGeometry(1, 12, 8), { p: [s * 8.5, TH.PITY + 0.75, -5.3], s: [0.36, 0.62, 0.17], c: '#7a4a26', surf: sf(SID.WOOD, 0.5) });
        box(b, s * 8.5 - 0.045, s * 8.5 + 0.045, TH.PITY + 1.2, TH.PITY + 2.15, -5.34, -5.26, '#3a2a1e', S_WY); box(b, s * 8.5 - 0.02, s * 8.5 + 0.02, TH.PITY, TH.PITY + 0.2, -5.32, -5.28, TONE.IRON, S_IRON); }
      b.add(new THREE.PlaneGeometry(36, 44), { p: [0, TH.CEIL, -19], r: [Math.PI / 2, 0, 0], c: TONE.CREAM, surf: sf(SID.CEIL, 0.05) });
      b.add(new THREE.TorusGeometry(1, 0.016, 6, 72), { p: [0, TH.CEIL - 0.05, -19], r: [Math.PI / 2, 0, 0], s: [10.6, 14.6, 8], c: TONE.GOLD, surf: S_GILT });
      // the forestage's front
      box(b, -TH.PW, TH.PW, TH.PITY, -TH.SLAB, TH.APRON - 0.2, TH.APRON, TONE.CREAM, S_PLASTER); box(b, -TH.PW, TH.PW, -0.2, 0.0, TH.APRON - 0.26, TH.APRON, TONE.GOLD, S_GILT);
      // the house side of the proscenium: its gilded frame, two great pilasters on either hand, the raised curtain's valance
      const PZ = -TH.PT;
      for (const s of [-1, 1]) { box(b, s * (TH.PW + 0.25) - 0.25, s * (TH.PW + 0.25) + 0.25, -0.5, TH.PH + 0.5, PZ - 0.12, PZ, TONE.GOLD, S_GILT);
        for (const dx of [1.5, 2.9]) { b.add(new THREE.CylinderGeometry(0.42, 0.46, TH.PH - 1.2, 16), { p: [s * (TH.PW + dx), (TH.PH - 1.2) / 2 + 0.6, PZ - 0.3], c: TONE.CELADON, surf: S_PLASTER });
          box(b, s * (TH.PW + dx) - 0.6, s * (TH.PW + dx) + 0.6, TH.PH - 0.6, TH.PH + 0.3, PZ - 0.9, PZ, TONE.GOLD, S_GILT); box(b, s * (TH.PW + dx) - 0.6, s * (TH.PW + dx) + 0.6, -0.5, 0.6, PZ - 0.9, PZ, TONE.CREAM, S_PLASTER); } }
      box(b, -TH.PW - 3.6, TH.PW + 3.6, TH.PH + 0.3, TH.PH + 1.3, PZ - 1.0, PZ, TONE.CELADON, S_PLASTER); box(b, -TH.PW - 3.7, TH.PW + 3.7, TH.PH + 1.3, TH.PH + 1.55, PZ - 1.15, PZ, TONE.GOLD, S_GILT);
      box(b, -TH.PW - 0.5, TH.PW + 0.5, TH.PH, TH.PH + 0.3, PZ - 0.14, PZ, TONE.GOLD, S_GILT);
      b.add(sawnStrip(2 * TH.PW, 2.7, 1.5, 7, false, rH, 84), { p: [0, TH.PH, -0.9], c: '#8a1c2a', surf: S_VELVET });
      for (const s of [-1, 1]) b.add(wingGeometry(1.7, TH.PH, s, 0.22, rH() * 9), { p: [s * (TH.PW - 0.85), 0, -0.8], c: '#8a1c2a', surf: S_VELVET });
      // the boxes, bay by bay and tier by tier
      for (let i = 0; i < NB; i++) {
        const a = HL[i], c = HL[i + 1], mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, nx = (a[2] + c[2]) / 2, nz = (a[3] + c[3]) / 2, D = TH.BOXD;
        const A = [a[0] + a[2] * D, a[1] + a[3] * D], C = [c[0] + c[2] * D, c[1] + c[3] * D], royal = Math.abs(i - MID) < 1.5;
        _Z.set(nx, 0, nz).normalize(); _X.crossVectors(_Y, _Z).normalize();
        for (let t = 0; t < TH.TIERS; t++) {
          const y = TH.TIER0 + TH.TIERH * t, ro = royal && (t === 1 || t === 2), out = ro ? 0.9 : 0, P = (q, k = 0) => [q[0] - q[2] * (out + k), 0, q[1] - q[3] * (out + k)];
          const fa = P(a), fc = P(c);
          // the floor of the tier (the ceiling of the one below), its edge gilded
          strut(b, [(fa[0] + A[0]) / 2, y - 0.1, (fa[2] + A[1]) / 2], [(fc[0] + C[0]) / 2, y - 0.1, (fc[2] + C[1]) / 2], D + out + 0.3, 0.2, [0, 1, 0], '#6a5844', S_WX);
          if (!(ro && t === 2)) {
            strut(b, [fa[0], y + 0.46, fa[2]], [fc[0], y + 0.46, fc[2]], 0.14, 0.92, [0, 1, 0], TONE.CELADON, S_PLASTER);
            const ra = P(a, 0.06), rc = P(c, 0.06);
            strut(b, [ra[0], y + 0.93, ra[2]], [rc[0], y + 0.93, rc[2]], 0.2, 0.09, [0, 1, 0], ro ? '#7a1826' : TONE.GOLD, ro ? S_VELVET : S_GILT);
            strut(b, [ra[0], y - 0.06, ra[2]], [rc[0], y - 0.06, rc[2]], 0.1, 0.16, [0, 1, 0], TONE.GOLD, S_GILT);
            // a gilded panel on the front: a long lozenge between two studs
            const lm = [lerp(ra[0], rc[0], 0.5), y + 0.46, lerp(ra[2], rc[2], 0.5)], l0 = [lerp(ra[0], rc[0], 0.26), y + 0.46, lerp(ra[2], rc[2], 0.26)], l1 = [lerp(ra[0], rc[0], 0.74), y + 0.46, lerp(ra[2], rc[2], 0.74)];
            strut(b, l0, l1, 0.08, 0.34, [0, 1, 0], TONE.GOLD, S_GILT);
            strut(b, [lerp(ra[0], rc[0], 0.08), y + 0.46, lerp(ra[2], rc[2], 0.08)], [lerp(ra[0], rc[0], 0.16), y + 0.46, lerp(ra[2], rc[2], 0.16)], 0.08, 0.16, [0, 1, 0], TONE.GOLD, S_GILT);
            strut(b, [lerp(ra[0], rc[0], 0.84), y + 0.46, lerp(ra[2], rc[2], 0.84)], [lerp(ra[0], rc[0], 0.92), y + 0.46, lerp(ra[2], rc[2], 0.92)], 0.08, 0.16, [0, 1, 0], TONE.GOLD, S_GILT);
          }
          // the box's back wall and the partition on its left hand
          strut(b, [A[0], y + TH.TIERH / 2, A[1]], [C[0], y + TH.TIERH / 2, C[1]], 0.2, TH.TIERH, [0, 1, 0], ro ? '#8a2030' : '#7a1c2a', S_VELVET);
          if (!ro) { const bx = (A[0] + C[0]) / 2 - nx * 0.13, bz = (A[1] + C[1]) / 2 - nz * 0.13, fx = bx - nx * 0.1, fz = bz - nz * 0.1;
            strut(b, [bx - _X.x * 0.16, y + 1.9, bz - _X.z * 0.16], [bx + _X.x * 0.16, y + 1.9, bz + _X.z * 0.16], 0.03, 0.46, [0, 1, 0], TONE.GOLD, S_GILT);
            box(b, fx - 0.015, fx + 0.015, y + 1.62, y + 1.77, fz - 0.015, fz + 0.015, '#e8dcc0', S_PLASTER); flames.push([fx, y + 1.78, fz]); }
          if (!ro || i - MID < -0.5) strut(b, [fa[0] + a[2] * 0.35, y + TH.TIERH / 2, fa[2] + a[3] * 0.35], [A[0], y + TH.TIERH / 2, A[1]], 0.07, TH.TIERH - 0.2, [0, 1, 0], '#6a1824', S_VELVET);
          // a slender gilded column on the left hand of the opening, a candle on a bracket before it
          if (!(ro && t === 2) && !(ro && i - MID > -0.5)) {
            b.add(new THREE.CylinderGeometry(0.06, 0.075, TH.TIERH * (ro ? 2 : 1) - 1.3, 8), { p: [fa[0], y + 0.95 + (TH.TIERH * (ro ? 2 : 1) - 1.3) / 2, fa[2]], c: TONE.GOLD, surf: S_GILT });
            box(b, fa[0] - 0.12, fa[0] + 0.12, y + TH.TIERH * (ro ? 2 : 1) - 0.36, y + TH.TIERH * (ro ? 2 : 1) - 0.2, fa[2] - 0.12, fa[2] + 0.12, TONE.GOLD, S_GILT);
          }
          if (!(ro && t === 2)) { const sx = fa[0] - a[2] * 0.3, sz = fa[2] - a[3] * 0.3; if (t === 0) U.uBox.value[i].set(sx, sz);
            strut(b, [fa[0], y + 0.2, fa[2]], [sx, y + 0.3, sz], 0.03, 0.03, [0, 1, 0], TONE.GOLD, S_GILT); box(b, sx - 0.018, sx + 0.018, y + 0.3, y + 0.48, sz - 0.018, sz + 0.018, '#e8dcc0', S_PLASTER); flames.push([sx, y + 0.49, sz]); }
          // two of the house at the box's front (the royal box stays empty)
          if (!ro) for (const f of [0.3, 0.7]) if (rA() < 0.82) { const px = lerp(fa[0], fc[0], f) + nx * 0.42, pz = lerp(fa[2], fc[2], f) + nz * 0.42; seats.push([px, y + 0.42, pz, Math.atan2(px, pz - 6) + rA.range(-0.3, 0.3), rA() < 0.5]); }
          // the valance of red cloth in the head of the opening
          if (!(ro && t === 1)) { const len = Math.hypot(fc[0] - fa[0], fc[2] - fa[2]);
            _M.makeBasis(_X, _Y, _Z); _M.setPosition((fa[0] + fc[0]) / 2 - nx * 0.03, y + TH.TIERH - 0.2, (fa[2] + fc[2]) / 2 - nz * 0.03);
            b.add(sawnStrip(len, ro ? 1.3 : 0.62, ro ? 0.7 : 0.36, 2, false, () => 0.25, 14), { m: _M, c: ro ? '#9a2030' : '#7c1a28', surf: S_VELVET }); }
        }
        // the wall under the first tier, with a dado; the cove from the last tier up to the ceiling
        strut(b, [a[0], (TH.STALL + TH.TIER0) / 2 - 0.1, a[1]], [c[0], (TH.STALL + TH.TIER0) / 2 - 0.1, c[1]], 0.2, TH.TIER0 - TH.STALL - 0.2, [0, 1, 0], '#84603e', S_PLASTER);
        strut(b, [a[0] - a[2] * 0.06, TH.STALL + 0.5, a[1] - a[3] * 0.06], [c[0] - c[2] * 0.06, TH.STALL + 0.5, c[1] - c[3] * 0.06], 0.2, 1.0, [0, 1, 0], '#6a1824', S_VELVET);
        // (a door at every third bay: a red curtain drawn across it, in a gilt frame)
        if (i % 3 === 2) { const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, y0 = TH.STALL;
          strut(b, [mx - _X.x * 0.66 - nx * 0.12, y0 + 1.23, mz - _X.z * 0.66 - nz * 0.12], [mx + _X.x * 0.66 - nx * 0.12, y0 + 1.23, mz + _X.z * 0.66 - nz * 0.12], 0.06, 2.46, [0, 1, 0], TONE.GOLD, S_GILT);
          strut(b, [mx - _X.x * 0.56 - nx * 0.15, y0 + 1.17, mz - _X.z * 0.56 - nz * 0.15], [mx + _X.x * 0.56 - nx * 0.15, y0 + 1.17, mz + _X.z * 0.56 - nz * 0.15], 0.06, 2.3, [0, 1, 0], '#7c1a28', S_VELVET); }
        // (a gilt sconce of two candles on that wall at every third bay)
        if (i % 3 === 1) { const sx = (a[0] + c[0]) / 2 - nx * 0.17, sz = (a[1] + c[1]) / 2 - nz * 0.17, sy = 0.8;
          box(b, sx - 0.05, sx + 0.05, sy - 0.26, sy + 0.04, sz - 0.05, sz + 0.05, TONE.GOLD, S_GILT);
          for (const d of [-0.17, 0.17]) { const cx = sx + _X.x * d - nx * 0.07, cz = sz + _X.z * d - nz * 0.07; box(b, cx - 0.018, cx + 0.018, sy, sy + 0.16, cz - 0.018, cz + 0.018, '#e8dcc0', S_PLASTER); flames.push([cx, sy + 0.17, cz]);
            strut(b, [sx, sy - 0.06, sz], [cx, sy, cz], 0.025, 0.025, [0, 1, 0], TONE.GOLD, S_GILT); } }
        const ia = [a[0] - a[2] * 2.6, TH.CEIL, a[1] - a[3] * 2.6], ic = [c[0] - c[2] * 2.6, TH.CEIL, c[1] - c[3] * 2.6];
        cv.add(quadGeo([a[0], TOP, a[1]], [c[0], TOP, c[1]], ic, ia), { c: '#c6b89a', surf: S_PLASTER });
        strut(b, [a[0] - a[2] * 0.05, TOP + 0.1, a[1] - a[3] * 0.05], [c[0] - c[2] * 0.05, TOP + 0.1, c[1] - c[3] * 0.05], 0.14, 0.2, [0, 1, 0], TONE.GOLD, S_GILT);
        if (i % 3 === 0) await ctx.yield();
      }
      // the house's end walls beside the proscenium
      for (const s of [-1, 1]) box(b, s > 0 ? TH.HW : -TH.HW - 3, s > 0 ? TH.HW + 3 : -TH.HW, TH.STALL, TH.CEIL, TH.APRON - 0.9, PZ, TONE.CREAM, S_PLASTER);
      mesh(b, matS, 'house'); await ctx.yield(); mesh(cv, matD, 'cove'); await ctx.yield();
      {
        // the house itself: plain seated figures without faces, in the stalls and at the boxes' fronts; each stirs a little on the clock
        const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Euler(), _dk = new THREE.Color('#2c2420');
        const COATS = ['#7a2a3a', '#2f4a6a', '#6a6a3a', '#8a7a5a', '#4a3a5a', '#3a5a4a', '#9a8a7a', '#5a2a2a', '#b8a88a', '#2a3a4a', '#a06a5a', '#56708a'], GOWNS = ['#b8707a', '#7a9ab8', '#c8b88a', '#9a6a8a', '#6a9a8a', '#d8c8b0', '#a84a4a', '#8a8ab0', '#c89a6a', '#e0d0c0'];
        for (const lady of [0, 1]) {
          const list = seats.filter((q, i) => (lady ? q[4] : !q[4])), g = bustGeometry(lady), n = list.length, ph = new Float32Array(n * 4); disposables.push(g);
          const aud = new THREE.InstancedMesh(g, LT.figure(), n); aud.name = 'the house';
          list.forEach((q, i) => { const hgt = rA.range(0.84, 1.1); _e.set(rA.range(-0.07, 0.08), q[3], rA.range(-0.2, 0.2)); _q.setFromEuler(_e); _p.set(q[0], q[1], q[2]); _s.set(hgt * rA.range(0.88, 1.14), hgt, hgt * rA.range(0.9, 1.1));
            aud.setMatrixAt(i, _m.compose(_p, _q, _s)); aud.setColorAt(i, _c.set(rA.pick(lady ? GOWNS : COATS)).lerp(_dk, rA.range(0.4, 0.72)).multiplyScalar(rA.range(0.62, 0.95))); ph[i * 4] = rA.range(0, TAU); ph[i * 4 + 1] = 0; ph[i * 4 + 2] = rA(); ph[i * 4 + 3] = -1; });
          g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 4)); aud.instanceMatrix.needsUpdate = true; aud.frustumCulled = false; scene.add(aud); disposables.push({ dispose: () => aud.dispose() });
          await ctx.yield();
        }
      }
      await ctx.yield();
      // the royal box: a canopy of red cloth under a gilded shell of rays (no arms, no cipher, no crown), and nobody in it
      const rb = INT.makeBuilder(), ca = HL[MID - 1], cc = HL[MID + 2], y1 = TH.TIER0 + TH.TIERH * 3;
      const q0 = [ca[0] - ca[2] * 1.5, 0, ca[1] - ca[3] * 1.5], q1 = [cc[0] - cc[2] * 1.5, 0, cc[1] - cc[3] * 1.5];
      strut(rb, [q0[0], y1 - 0.25, q0[2]], [q1[0], y1 - 0.25, q1[2]], 1.4, 0.3, [0, 1, 0], '#8a1c2a', S_VELVET);
      rb.add(sawnStrip(Math.hypot(q1[0] - q0[0], q1[2] - q0[2]) + 0.4, 1.5, 0.8, 5, false, rH, 40), { p: [(q0[0] + q1[0]) / 2, y1 - 0.38, (q0[2] + q1[2]) / 2 + 0.72], r: [0, Math.PI, 0], c: '#9a2030', surf: S_VELVET });
      const shell = []; for (let k = 0; k <= 16; k++) { const an = Math.PI * k / 16; shell.push([Math.cos(an) * (k % 2 ? 1.75 : 2.25), Math.sin(an) * (k % 2 ? 1.3 : 1.7)]); }
      rb.add(cutGeometry(shell, 1), { p: [0, y1 - 0.1, (q0[2] + q1[2]) / 2 + 0.8], c: TONE.GOLD, surf: S_GILT });
      {
        const F0 = TH.TIER0 + TH.TIERH, ZF = TH.HZC - TH.HRZ + 0.9, S_GL = sf(SID.GILT, 0.6, 0.9, 0.08), S_RED = sf(SID.VELVET, 0.04, 0, 0.03), rB = rng.fork('royal box');
        // two empty chairs of state: a seat, and a tall back with a round head in a gilt frame
        const head = (w, h) => { const o = []; for (let k = 0; k <= 12; k++) { const an = Math.PI * k / 12; o.push([Math.cos(an) * w / 2, h - w / 2 + Math.sin(an) * w / 2]); } o.push([-w / 2, 0], [w / 2, 0]); return o; };
        for (const x of [-0.8, 0.8]) { const z = ZF - 1.9;
          box(rb, x - 0.4, x + 0.4, F0 + 0.42, F0 + 0.56, z - 0.36, z + 0.36, '#9a2030', S_RED); box(rb, x - 0.42, x + 0.42, F0 + 0.34, F0 + 0.42, z - 0.38, z + 0.38, TONE.GOLD, S_GL);
          for (const dx of [-0.36, 0.36]) for (const dz of [-0.32, 0.32]) box(rb, x + dx - 0.035, x + dx + 0.035, F0, F0 + 0.36, z + dz - 0.035, z + dz + 0.035, TONE.GOLD, S_GL);
          rb.add(cutGeometry(head(0.92, 1.75)), { p: [x, F0 + 0.4, z - 0.4], r: [0, Math.PI, 0], c: TONE.GOLD, surf: S_GL }); rb.add(cutGeometry(head(0.7, 1.58)), { p: [x, F0 + 0.46, z - 0.37], r: [0, Math.PI, 0], c: '#a02434', surf: S_RED });
          for (const dx of [-0.42, 0.42]) box(rb, x + dx - 0.03, x + dx + 0.03, F0 + 0.56, F0 + 0.8, z - 0.3, z + 0.3, TONE.GOLD, S_GL); }
        // a great shell of gilt rays on the wall behind them
        const sh2 = []; for (let k = 0; k <= 24; k++) { const an = Math.PI * k / 24; sh2.push([Math.cos(an) * (k % 2 ? 1.7 : 2.15), Math.sin(an) * (k % 2 ? 1.7 : 2.15)]); }
        rb.add(cutGeometry(sh2), { p: [0, F0 + 1.3, ZF - 3.3], r: [0, Math.PI, 0], c: TONE.GOLD, surf: S_GL });
        // the hoop of candles hung in it, and a standing branch of candles to either hand
        const hy = F0 + 4.5, hz = ZF - 1.7;
        rb.add(new THREE.TorusGeometry(1.05, 0.045, 6, 36), { p: [0, hy, hz], r: [Math.PI / 2, 0, 0], c: TONE.GOLD, surf: S_GL });
        for (let j = 0; j < 16; j++) { const an = j / 16 * TAU, x = Math.cos(an) * 1.05, z = hz + Math.sin(an) * 1.05; box(rb, x - 0.02, x + 0.02, hy + 0.04, hy + 0.18, z - 0.02, z + 0.02, '#e8dcc0', S_PLASTER); flames.push([x, hy + 0.19, z]); }
        for (let j = 0; j < 3; j++) { const an = j / 3 * TAU; ropes.push(hang([Math.cos(an) * 1.05, hy, hz + Math.sin(an) * 1.05], [0, hy + 1.3, hz], 0, 2)); }
        for (const x of [-2.1, 2.1]) { const z = ZF - 1.0; rb.add(new THREE.CylinderGeometry(0.035, 0.05, 1.9, 8), { p: [x, F0 + 0.95, z], c: TONE.GOLD, surf: S_GL }); rb.add(new THREE.CylinderGeometry(0.2, 0.24, 0.06, 10), { p: [x, F0 + 0.03, z], c: TONE.GOLD, surf: S_GL });
          for (let j = 0; j < 5; j++) { const an = j / 5 * TAU, cx = x + Math.cos(an) * 0.26, cz = z + Math.sin(an) * 0.26, cy = F0 + 1.9;
            strut(rb, [x, cy - 0.12, z], [cx, cy, cz], 0.025, 0.025, [0, 1, 0], TONE.GOLD, S_GL); box(rb, cx - 0.018, cx + 0.018, cy, cy + 0.15, cz - 0.018, cz + 0.018, '#e8dcc0', S_PLASTER); flames.push([cx, cy + 0.16, cz]); } }
        // its curtains drawn back to either hand, between two gilt columns the height of both tiers; a red hanging with a gilt
        // fringe over its rail
        for (const sd of [-1, 1]) { rb.add(wingGeometry(1.5, 2 * TH.TIERH - 0.5, sd, 0.42, rB() * 9), { p: [sd * 2.25, F0 + 0.1, ZF - 0.45], c: '#a82436', surf: S_RED });
          rb.add(new THREE.CylinderGeometry(0.15, 0.17, 2 * TH.TIERH - 0.5, 14), { p: [sd * 3.12, F0 + TH.TIERH - 0.25, ZF - 0.2], c: TONE.GOLD, surf: S_GL });
          box(rb, sd * 3.12 - 0.24, sd * 3.12 + 0.24, F0 + 2 * TH.TIERH - 0.5, F0 + 2 * TH.TIERH - 0.25, ZF - 0.44, ZF + 0.04, TONE.GOLD, S_GL); }
        rb.add(new THREE.PlaneGeometry(5.3, 1.3), { p: [0, F0 + 0.36, ZF + 0.22], c: '#a82436', surf: S_RED });
        box(rb, -2.7, 2.7, F0 - 0.34, F0 - 0.26, ZF + 0.2, ZF + 0.26, TONE.GOLD, S_GL); box(rb, -2.7, 2.7, F0 + 0.82, F0 + 0.9, ZF + 0.2, ZF + 0.26, TONE.GOLD, S_GL);
        for (let x = -2.4; x <= 2.41; x += 0.6) rb.add(new THREE.ConeGeometry(0.07, 0.3, 6), { p: [x, F0 - 0.5, ZF + 0.23], r: [Math.PI, 0, 0], c: TONE.GOLD, surf: S_GL });
      }
      mesh(rb, matD, 'royal box');
      // the ring: the house's great hoop of candles, hung before the stage; four lesser hoops over the house
      const h = INT.makeBuilder(), hoop = (cx, cy, cz, R, n, upright) => {
        h.add(new THREE.TorusGeometry(R, upright ? 0.11 : 0.05, 8, 48), { p: [cx, cy, cz], r: upright ? [0, 0, 0] : [Math.PI / 2, 0, 0], c: TONE.GOLD, surf: S_GILT });
        for (let j = 0; j < n; j++) { const an = j / n * TAU, x = upright ? cx + Math.cos(an) * (R + 0.4) : cx + Math.cos(an) * R, y = upright ? cy + Math.sin(an) * (R + 0.4) : cy + 0.05, z = upright ? cz : cz + Math.sin(an) * R;
          box(h, x - 0.02, x + 0.02, y, y + 0.16, z - 0.02, z + 0.02, '#e8dcc0', S_PLASTER); flames.push([x, y + 0.17, z]); }
        if (!upright) { for (let j = 0; j < 3; j++) { const an = j / 3 * TAU; ropes.push(hang([cx + Math.cos(an) * R, cy, cz + Math.sin(an) * R], [cx, cy + 1.6, cz], 0, 2)); } ropes.push(hang([cx, cy + 1.6, cz], [cx, TH.CEIL, cz], 0, 2)); }
      };
      // (the ring hangs high in the middle of the house, over the heads of the stalls, facing down the house)
      hoop(TH.RING[0], TH.RING[1], TH.RING[2], TH.RR + 0.35, 28, true);
      { const q = (TH.RR + 0.35) * 0.7071; for (const s of [-1, 1]) ropes.push(hang([TH.RING[0] + s * q, TH.RING[1] + q, TH.RING[2]], [TH.RING[0] + s * q, TH.CEIL, TH.RING[2]], 0, 2)); }
      for (const [x, y, z] of CHANDS) hoop(x, y, z, 1.15, 14, false);
      mesh(h, matS, 'hoop');
    }
    await ctx.yield();

    // ------------------------------------------------------------------ what is kept under the open floor; the hands who stand
    // (each: its place and its strength; those over the cuts' line hang from a joist)
    const lan = [[-2.6, -6.3, 13.55, 13], [2.6, -6.3, 13.55, 13], [-2.6, -6.3, 17.85, 13], [2.6, -6.3, 17.85, 13], [8.6, -4.8, 15.25, 10], [6, -5.6, 22.35, 10], [-14, -5.6, 16.6, 13], [-14.6, -5.6, 22.6, 13], [-15, -5, 10.4, 11], [15, -4.6, 10, 11], [9, -5.6, 35, 22], [-7.65, -6.5, 34.6, 24], [16, -5.6, 32, 10], [-17.5, -5.6, 30.5, 14], [-12.2, -5.7, 24.6, 13], [8.4, -5.5, 29.4, 10]];
    {
      const b = INT.makeBuilder(), rS = rng.fork('store');
      // spare rollers of the sea on trestles
      const spare = rollerGeometry(4.2, 0.42, 0.28, 2.0, 40, 14);
      for (let k = 0; k < 3; k++) { b.add(spare, { p: [3.6, CF + 0.95 + (k === 2 ? 0.95 : 0), 36.2 + (k === 2 ? 0.55 : 1.1 * k)], c: '#ffffff', surf: sf(SID.WAVE, 0.3) }); }
      for (const x of [0.6, 6.6]) { box(b, x - 0.08, x + 0.08, CF, CF + 0.5, 35.4, 38.1, TONE.OAK, S_WZ); }
      // flats and cut clouds leaning on the back wall
      for (let k = 0; k < 4; k++) { const fb = INT.makeBuilder(); fb.add(wingGeometry(TH.WW, 8.2, 1, k % 2 ? 1.1 : 0, rS() * 9), { c: '#ffffff', surf: sf(k % 2 ? SID.STORM : SID.PALACE, 0.04) });
        const fm = mesh(fb, matD, 'stored flat'); fm.position.set(-6.5 + 4.6 * k, CF, 43.3 - 0.25 * k); fm.rotation.x = 0.16; }
      await ctx.yield();
      // spare dolphins and ground rows of waves against the wall
      for (const [x, z, rz] of [[-11.6, 42.2, 0.5], [-13.4, 41.6, -0.4]]) { const fb = INT.makeBuilder(); fb.add(dolphinGeometry(), { c: '#ffffff', surf: sf(SID.DOLPH, 0.15) }); const fm = mesh(fb, matD, 'stored dolphin'); fm.position.set(x, CF - 0.55, z); fm.rotation.set(0.22, 0, rz); }
      for (let k = 0; k < 3; k++) b.add(sawnStrip(7.5, 0.95, 0.42, 7, true, rS), { p: [4.5 - 0.5 * k, CF, 41.2 - 0.45 * k], r: [0.2, 0, 0], c: '#ffffff', surf: sf(SID.WAVEFLAT, 0.2) });
      // the dock: flats standing on edge side by side between posts, their painted faces to the middle
      for (let k = 0; k < 6; k++) { const fb = INT.makeBuilder(); fb.add(wingGeometry(TH.WW, 7.6, 1, k % 3 === 1 ? 0 : 1.1, rS() * 9), { c: '#ffffff', surf: sf(k % 3 === 1 ? SID.PALACE : SID.STORM, 0.04) });
        fb.add(wingGeometry(TH.WW, 7.6, 1, k % 3 === 1 ? 0 : 1.1, 0, 1), { p: [0, 0, 0.03], c: '#75664f', surf: sf(SID.BACK, 0.03) });
        const fm = mesh(fb, matD, 'docked flat'); fm.position.set(-9.4 - 0.5 * k, CF + 0.1, 33.2 + 0.3 * (k % 2)); fm.rotation.set(0, -Math.PI / 2, 0.05 + 0.012 * k); }
      for (const z of [30.2, 36.4]) { box(b, -12.6, -9.0, CF, CF + 0.14, z - 0.07, z + 0.07, TONE.OAK, S_WX); for (const x of [-9.1, -12.5]) box(b, x - 0.07, x + 0.07, CF, CF + 2.2, z - 0.07, z + 0.07, TONE.OAK, S_WY); }
      for (let k = 0; k < 3; k++) { b.add(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12), { p: [-1.2 + 0.95 * k, CF + 0.55, 38.4 + 0.2 * (k % 2)], c: TONE.PINE, surf: S_WY }); for (const y of [0.25, 0.85]) b.add(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 12), { p: [-1.2 + 0.95 * k, CF + y, 38.4 + 0.2 * (k % 2)], c: TONE.IRON, surf: S_IRON }); }
      // the wind machine's frame and its sheet of canvas, drawn over the drum and weighted with a bar
      { const [wx, wz] = WIND, ay = CF + 1.055;
        for (const x of [wx - 0.82, wx + 0.82]) { strut(b, [x, CF, wz - 0.7], [x, ay + 0.05, wz], 0.1, 0.1, [1, 0, 0], TONE.OAK, S_WY); strut(b, [x, CF, wz + 0.7], [x, ay + 0.05, wz], 0.1, 0.1, [1, 0, 0], TONE.OAK, S_WY); box(b, x - 0.06, x + 0.06, CF, CF + 0.12, wz - 0.8, wz + 0.8, TONE.OAK, S_WZ); }
        b.add(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 18, 1, true, -Math.PI * 0.62, Math.PI * 1.24), { p: [wx, ay, wz], r: [0, 0, Math.PI / 2], c: '#b9ab8c', surf: sf(SID.FABRIC, 0.04) });
        box(b, wx - 0.65, wx + 0.65, CF + 0.5, ay - 0.2, wz - 0.6, wz - 0.585, '#b9ab8c', sf(SID.FABRIC, 0.04)); box(b, wx - 0.75, wx + 0.75, CF + 0.42, CF + 0.52, wz - 0.64, wz - 0.54, TONE.DARK, S_WX);
        box(b, wx - 0.75, wx + 0.75, ay + 0.1, ay + 0.2, wz + 0.6, wz + 0.7, TONE.OAK, S_WX); for (const x of [wx - 0.7, wx + 0.7]) box(b, x - 0.05, x + 0.05, CF, ay + 0.2, wz + 0.6, wz + 0.7, TONE.OAK, S_WY); }
      b.add(cutGeometry(cloudOutline(4.4, 2.4, rS)), { p: [-12.5, CF + 1.5, 42.6], r: [0.3, 0, 0], c: '#e6ddd0', surf: sf(SID.CLOUD, 0.03) });
      b.add(cutGeometry(cloudOutline(3.4, 1.9, rS)), { p: [13, CF + 1.2, 42.4], r: [0.3, 0, 0], c: '#d8d2cc', surf: sf(SID.CLOUD, 0.03) });
      // a windlass for the cloud machine: a drum between two frames, its rope going up through the floor
      for (const x of [6.9, 9.1]) { strut(b, [x, CF, 31.2], [x, CF + 1.5, 32], 0.12, 0.12, [1, 0, 0], TONE.OAK, S_WY); strut(b, [x, CF, 32.8], [x, CF + 1.5, 32], 0.12, 0.12, [1, 0, 0], TONE.OAK, S_WY); }
      b.add(new THREE.CylinderGeometry(0.34, 0.34, 2.0, 14), { p: [8, CF + 1.45, 32], r: [0, 0, Math.PI / 2], c: TONE.PINE, surf: S_WX });
      ropes.push(hang([8, CF + 1.75, 32], [9.5, JY - 0.2, 26.5], 0, 2, 1));
      // a ladder to the stage, and the hung lanterns' frames
      for (const x of [-6.6, -6.05]) strut(b, [x, CF, 36.5], [x, 0.9, 39.6], 0.07, 0.1, [1, 0, 0], TONE.PINE, S_WY);
      for (let k = 1; k < 30; k++) { const f = k / 30; box(b, -6.6, -6.05, CF + (0.9 - CF) * f - 0.025, CF + (0.9 - CF) * f + 0.025, 36.5 + 3.1 * f - 0.03, 36.5 + 3.1 * f + 0.03, TONE.PINE, S_WX); }
      for (const q of lan) { box(b, q[0] - 0.1, q[0] + 0.1, q[1] - 0.14, q[1] - 0.1, q[2] - 0.1, q[2] + 0.1, TONE.IRON, S_IRON); box(b, q[0] - 0.11, q[0] + 0.11, q[1] + 0.2, q[1] + 0.25, q[2] - 0.11, q[2] + 0.11, TONE.IRON, S_IRON);
        for (const dx of [-0.1, 0.1]) for (const dz of [-0.1, 0.1]) box(b, q[0] + dx - 0.012, q[0] + dx + 0.012, q[1] - 0.1, q[1] + 0.2, q[2] + dz - 0.012, q[2] + dz + 0.012, TONE.IRON, S_IRON);
        ropes.push(hang([q[0], q[1] + 0.25, q[2]], [q[0], JY, q[2]], 0, 2)); }
      // piers and blind arches along the cellar's side walls; casks, coils and timber against them
      for (const sd of [-1, 1]) for (let z = 1.5; z < TH.ZB - 1; z += 4.2) { box(b, sd > 0 ? SW - 0.55 : -SW, sd > 0 ? SW : -SW + 0.55, CF, -1.2, z - 0.5, z + 0.5, '#8a7c70', S_BRICK);
        box(b, sd > 0 ? SW - 0.4 : -SW, sd > 0 ? SW : -SW + 0.4, -3.0, -1.2, z + 0.5, z + 3.7, '#84766a', S_BRICK); }
      for (const [x, z, n] of [[-20.6, 6, 3], [-20.6, 14.5, 2], [-20.5, 26, 4], [20.6, 8, 2], [20.5, 22, 3], [-18.5, 41, 3]]) for (let k = 0; k < n; k++) {
        b.add(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12), { p: [x + (k % 2) * 0.1, CF + 0.55, z + k * 0.95], c: TONE.PINE, surf: S_WY });
        for (const y of [0.25, 0.85]) b.add(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 12), { p: [x + (k % 2) * 0.1, CF + y, z + k * 0.95], c: TONE.IRON, surf: S_IRON }); }
      for (const [x, z] of [[-20.3, 10.4], [-20.3, 19.2], [20.3, 15], [-19, 38]]) for (let k = 0; k < 3; k++) b.add(new THREE.TorusGeometry(0.34 - 0.03 * k, 0.07, 6, 16), { p: [x, CF + 0.08 + 0.13 * k, z], r: [Math.PI / 2, 0, 0], c: TONE.ROPE, surf: sf(SID.FABRIC, 0.05) });
      for (let k = 0; k < 6; k++) box(b, -21.2 + 0.02 * k, -21.0 + 0.02 * k, CF + 0.1 + 0.16 * k, CF + 0.24 + 0.16 * k, 29.5, 35.5, TONE.PINE, S_WZ);
      // the endless ropes the chariots are made fast to, and their returns up to the long shafts
      for (let k = 0; k < TH.WN; k++) for (const sd of [-1, 1]) { ropes.push(hang([sd * 9.2, CF + 1.3, wingZ(k) + 0.27], [sd * 20.6, CF + 1.3, wingZ(k) + 0.27], 0.03, 4, 1), hang([sd * 9.2, CF + 1.36, wingZ(k) + 0.87], [sd * 20.6, CF + 1.36, wingZ(k) + 0.87], 0.03, 4, -1));
        ropes.push(hang([sd * 20.6, CF + 1.3, wingZ(k) + 0.27], [sd * 13, -2.5, wingZ(k) + 0.3], 0, 2, 1)); }
      // kept under the open floor, in its light: a shell car, a moon on its pole; the guides of the lift
      {
        // the shell car: a great gilt scallop on a truck, a ground row of waves before it
        const sh = []; for (let k = 0; k <= 18; k++) { const an = Math.PI * k / 18; sh.push([Math.cos(an) * (k % 2 ? 1.5 : 1.75), Math.sin(an) * (k % 2 ? 1.5 : 1.75)]); }
        b.add(cutGeometry(sh), { p: [10.6, CF + 0.7, 34.6], c: TONE.GOLD, surf: sf(SID.GILT, 0.6, 0.9, 0.05) });
        box(b, 9.2, 12.0, CF + 0.3, CF + 0.7, 34.65, 35.5, TONE.OAK, S_WX); for (const x of [9.6, 11.6]) for (const z of [34.6, 35.55]) b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 14), { p: [x, CF + 0.3, z], r: [Math.PI / 2, 0, 0], c: TONE.IRON, surf: S_IRON });
        b.add(sawnStrip(3.6, 0.8, 0.36, 5, true, rS), { p: [10.6, CF, 34.3], c: '#ffffff', surf: sf(SID.WAVEFLAT, 0.2) });
        // the moon: a crescent of silvered board on a pole
        const mo = [], R = 1.25; for (let k = 0; k <= 20; k++) { const an = -2.07 + 4.14 * k / 20; mo.push([Math.cos(an) * R, Math.sin(an) * R]); } for (let k = 20; k >= 0; k--) { const an = -1.662 + 3.324 * k / 20; mo.push([-0.5 + Math.cos(an) * 1.1, Math.sin(an) * 1.1]); }
        b.add(new THREE.ShapeGeometry(new THREE.Shape(mo.map((q) => new THREE.Vector2(q[0], q[1])))), { p: [-5.3, CF + 4.7, 32.9], c: '#dfe3e6', surf: sf(SID.PLAIN, 0.6, 0.6, 0.06) });
        box(b, -5.0, -4.9, CF, CF + 4.3, 32.93, 33.02, TONE.PINE, S_WY); box(b, -5.4, -4.5, CF, CF + 0.1, 32.6, 33.3, TONE.OAK, S_WX);
        for (const x of [-3.12, 7.37]) for (const z of [LIFTZ - 0.9, LIFTZ + 1.1]) box(b, x - 0.06, x + 0.06, CF, -0.12, z - 0.06, z + 0.06, TONE.OAK, S_WY);
      }
      // on the right hand of the open floor: spare clouds standing on their posts, and a spare gilt sun leaning by them
      for (const [cw, chh, x, y, z] of [[4.4, 2.4, 14.4, 1.7, 31.2], [3.8, 2.1, 15.8, 2.0, 33.0], [3.2, 1.8, 17.2, 1.5, 34.8]]) {
        b.add(cutGeometry(cloudOutline(cw, chh, rS)), { p: [x, CF + y, z], r: [0, 1.2, 0], c: '#e2dacd', surf: sf(SID.CLOUD, 0.03) });
        for (const d of [-0.3, 0.3]) box(b, x + d * 0.36 - 0.05, x + d * 0.36 + 0.05, CF, CF + y, z - d * 0.93 - 0.05, z - d * 0.93 + 0.05, TONE.PINE, S_WY); }
      { const star = []; for (let i = 0; i < 48; i++) { const an = i / 48 * TAU, r = i % 2 ? 0.8 : (i % 4 ? 1.45 : 1.85); star.push([Math.cos(an) * r, Math.sin(an) * r]); }
        b.add(cutGeometry(star), { p: [18.6, CF + 1.9, 30.2], r: [0.12, 1.2, 0], c: '#e8b84a', surf: sf(SID.SUN, 0.7, 0.5, 0.12) }); box(b, 18.9, 19.0, CF, CF + 1.9, 30.25, 30.35, TONE.PINE, S_WY); }
      // by the left hand's rails: a roller of the sea on trestles under the painter's brush, his pots on a bench
      { const tx = -13.5, tz = 26.2;
        b.add(spare, { p: [tx, CF + 1.08, tz], c: '#ffffff', surf: sf(SID.WAVE, 0.3) });
        b.add(new THREE.CylinderGeometry(0.05, 0.05, 9.3, 8), { p: [tx, CF + 1.08, tz], r: [0, 0, Math.PI / 2], c: TONE.IRON, surf: S_IRON });
        for (const x of [tx - 4.5, tx + 4.5]) { strut(b, [x, CF, tz - 0.7], [x, CF + 1.14, tz], 0.1, 0.1, [1, 0, 0], TONE.PINE, S_WY); strut(b, [x, CF, tz + 0.7], [x, CF + 1.14, tz], 0.1, 0.1, [1, 0, 0], TONE.PINE, S_WY); box(b, x - 0.06, x + 0.06, CF + 0.3, CF + 0.38, tz - 0.52, tz + 0.52, TONE.PINE, S_WZ); }
        box(b, -11.6, -10.2, CF + 0.42, CF + 0.48, 24.5, 24.95, TONE.OAK, S_WX); for (const x of [-11.5, -10.3]) box(b, x - 0.04, x + 0.04, CF, CF + 0.42, 24.55, 24.9, TONE.OAK, S_WY);
        for (const [col, x] of [['#1f7a78', -11.35], ['#e8e2d0', -11.0], ['#27508a', -10.65], ['#c8a040', -10.35]]) b.add(new THREE.CylinderGeometry(0.1, 0.09, 0.18, 10), { p: [x, CF + 0.57, 24.72], c: col, surf: sf(SID.PLAIN, 0.5) }); }
      // before the serpent, in the open floor's light: ground rows of waves stood one behind the other
      { const rP = rng.fork('props');
        for (let k = 0; k < 3; k++) { b.add(sawnStrip(5.4, 1.15, 0.46, 6, true, rP), { p: [3.6 + 0.3 * k, CF, 30.3 + 0.42 * k], r: [0.12, 0, 0], c: '#ffffff', surf: sf(SID.WAVEFLAT, 0.2) });
          for (const dx of [-2, 2]) strut(b, [3.6 + 0.3 * k + dx, CF, 30.3 + 0.42 * k + 0.5], [3.6 + 0.3 * k + dx, CF + 0.7, 30.3 + 0.42 * k + 0.12], 0.06, 0.06, [1, 0, 0], TONE.PINE, S_WY); }
      }
      mesh(b, matD, 'store');
      await ctx.yield();
      // the hands who stand: on the fly galleries at their ropes, at the windlass, in the wings
      const st = [];
      for (const s of [-1, 1]) for (const z of [9.5, 15.5, 21.5, 27.5, 33.5]) st.push([s * 20.3, 12.5, z, s * Math.PI / 2]);
      st.push([WIND[0] - 1.12, CF, WIND[1] + 0.32, 0, 2], [-6.32, CF, 36.05, Math.PI], [6.4, CF, 32, -Math.PI / 2], [9.6, CF, 32, Math.PI / 2], [8.3, CF, 17.6, -Math.PI / 2], [-17.2, CF, 12.4, -Math.PI / 2], [-16.6, CF, 20.3, -Math.PI / 2], [-15.5, 0, 35, -2.2], [-9.3, 0, 38.8, Math.PI + 0.3], [-11.2, 0, 39.3, Math.PI - 0.2], [15, 0, 4.5, 2.4], [-15.5, 0, 12, -Math.PI / 2], [13.4, 0, SHIPZ, Math.PI / 2], [14.9, 0, SHIPZ, Math.PI / 2],
        [-12.8, 0, 9.0, -Math.PI / 2], [-13.4, 0, 12.2, -Math.PI / 2], [-12.6, 0, 18.6, -Math.PI / 2], [12.9, 0, 9.0, Math.PI / 2], [13.2, 0, 15.4, Math.PI / 2], [13.2, CF, 32.4, 2.0], [-16.4, 0, 4.4, -2.3], [-12.6, CF, 25.3, Math.PI], [-18.9, 0, 5.0, -Math.PI / 2], [17.8, 0, 3.4, 2.2]);
      const g = figureGeometry(), n = st.length, ph = new Float32Array(n * 4), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Euler(); disposables.push(g);
      const TONES = ['#5a4a3a', '#6a5a48', '#4c4a46', '#7a6a54', '#50443a', '#6c5c50'], hands = new THREE.InstancedMesh(g, LT.figure(), n); hands.name = 'hands';
      st.forEach((q, i) => { const hgt = q[4] ? 1 : rMen.range(0.94, 1.06); _e.set(0, q[3], 0); _q.setFromEuler(_e); _p.set(q[0], q[1], q[2]); _s.set(hgt, hgt, hgt);
        hands.setMatrixAt(i, _m.compose(_p, _q, _s)); hands.setColorAt(i, _c.set(rMen.pick(TONES)).multiplyScalar(rMen.range(0.85, 1.1))); ph[i * 4] = q[4] ? WIND_PH : rMen.range(0, TAU); ph[i * 4 + 1] = q[4] || 0; ph[i * 4 + 2] = rMen(); ph[i * 4 + 3] = 0; });
      g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 4)); hands.instanceMatrix.needsUpdate = true; hands.frustumCulled = false; scene.add(hands); disposables.push({ dispose: () => hands.dispose() });
      // the fly galleries' rope lines down to their rails
      for (const s of [-1, 1]) for (let z = 4; z < TH.ZB - 3; z += 1.1) ropes.push(hang([s * 19.5, 13.56, z], [s * 19.9, TH.GRID, z], 0, 2));
    }
    await ctx.yield();
    const serpent = { head: new THREE.Group(), coils: [], row: new THREE.Group() }, farSea = [];
    // THE FAR SEA: two ground rows of cut waves along the stage's back, close behind the fixed low row and before the backcloth's lamps,
    // each taller than the one before it, sliding against each other on the clock
    { const rF = rng.fork('far sea');
      for (const [z, h, amp] of [[TH.BACK - 1.12, 1.05, 0.36], [TH.BACK - 1.0, 1.35, 0.42]]) { const fb = INT.makeBuilder(); fb.add(sawnStrip(33, h, amp, 30, true, rF, 330), { p: [0, 0, z], c: '#ffffff', surf: sf(SID.WAVEFLAT, 0.2) });
        const g = new THREE.Group(); mesh(fb, matD, 'far sea', g); scene.add(g); farSea.push(g); } }
    // THE LIFT in the open floor: a deck between four guides, hung on four ropes from the gridiron. It carries the sea serpent (a head and four
    // coils, cut boards, in a ground row of waves) up from the cellar to the stage as the flight passes: by the metre flown. A row of lamps
    // behind a shield at its front edge lights the serpent from below. The serpent is worked on the clock: its head nods on its post, its
    // coils rise and fall one after another, its ground row slides to and fro.
    const lift = new THREE.Group(), liftRopes = new THREE.Group(); scene.add(lift); liftRopes.position.set(0, TH.GRID, 0); scene.add(liftRopes);
    {
      const b = INT.makeBuilder(), S_SERP = sf(SID.SERPENT, 0.12), zs = LIFTZ, rL = rng.fork('lift'), X0 = -3.0, X1 = 7.25;
      let d = INT.makeBuilder();
      box(b, X0, X1, -0.14, 0, zs - 0.8, zs + 1.0, '#8c7a60', S_WX);
      for (const z of [zs - 0.72, zs + 0.92]) box(b, X0, X1, -0.4, -0.14, z - 0.08, z + 0.08, TONE.OAK, S_WX);
      for (let x = X0 + 0.1; x <= X1; x += 1.7) box(b, x - 0.07, x + 0.07, -0.34, -0.14, zs - 0.8, zs + 1.0, TONE.OAK, S_WZ);
      box(b, X0 + 0.2, X1 - 0.2, 0, 0.26, zs - 0.76, zs - 0.73, TONE.IRON, S_IRON);
      const lf = []; for (let x = X0 + 0.5; x <= X1 - 0.4; x += 0.62) { box(b, x - 0.018, x + 0.018, 0, 0.13, zs - 0.618, zs - 0.582, '#e8dcc0', S_PLASTER); lf.push([x, 0.14, zs - 0.6]); }
      mesh(b, matS, 'lift', lift);
      const V2 = (l) => new THREE.Shape(l.map((q) => new THREE.Vector2(q[0], q[1])));
      const hd = [[1.0, 0], [1.05, 1.2], [0.9, 2.0], [0.55, 2.6], [0.2, 2.9], [-0.1, 3.3], [-0.22, 2.95], [-0.6, 3.0], [-1.3, 2.8], [-1.6, 2.55], [-1.25, 2.42], [-0.7, 2.32], [-0.45, 2.2], [-0.8, 2.0], [-1.3, 1.86], [-1.0, 1.66], [-0.4, 1.6], [-0.05, 1.3], [0.1, 0.6], [0.05, 0]].map((q) => [q[0], q[1] * 1.3]);
      d.add(new THREE.ShapeGeometry(V2(hd)), { p: [-1.3, 0, zs], c: '#ffffff', surf: S_SERP });
      d.add(new THREE.CircleGeometry(0.11, 12), { p: [-1.95, 3.54, zs - 0.02], r: [0, Math.PI, 0], c: '#f0c860', surf: sf(SID.GILT, 0.6, 0.9, 0.35) });
      // (a forked tongue of red cloth, and a gilt crest down the back of its neck)
      d.add(new THREE.ShapeGeometry(V2([[-0.5, 2.9], [-1.5, 2.86], [-1.95, 3.0], [-1.6, 2.8], [-1.95, 2.62], [-1.5, 2.74], [-0.5, 2.78]])), { p: [-1.3, 0, zs + 0.012], c: '#c0342e', surf: sf(SID.PLAIN, 0.3, 0, 0.08) });
      d.add(new THREE.ShapeGeometry(V2([[0.9, 0.2], [0.95, 1.56], [0.8, 2.6], [0.45, 3.38], [0.1, 3.77], [0.3, 3.9], [0.62, 3.95], [0.5, 3.5], [0.92, 3.5], [0.78, 3.05], [1.2, 2.95], [1.0, 2.5], [1.38, 2.3], [1.1, 1.9], [1.42, 1.65], [1.12, 1.3], [1.4, 1.0], [1.1, 0.7], [1.3, 0.35], [1.0, 0.2]])),
        { p: [-1.3, 0, zs + 0.02], c: '#c99a3a', surf: sf(SID.GILT, 0.6, 0.9, 0.06) });
      for (const [x, wd, h] of [[1.2, 2.3, 2.6], [3.3, 2.0, 2.1], [5.2, 1.7, 1.5], [6.6, 1.1, 0.9]]) { const o = [], z = zs + 0.2 * Math.sin(x), cb = INT.makeBuilder(); for (let i = 0; i <= 28; i++) { const an = Math.PI * i / 28; o.push([Math.cos(an) * wd / 2, Math.sin(an) * h * (i % 2 ? 1.07 : 1)]); }
        cb.add(cutGeometry(o), { p: [x, 0, z], c: '#ffffff', surf: S_SERP }); box(cb, x - 0.05, x + 0.05, -0.1, h * 0.8, z + 0.03, z + 0.12, TONE.PINE, S_WY);
        const cg = new THREE.Group(); mesh(cb, matD, 'serpent', cg); lift.add(cg); serpent.coils.push(cg); }
      box(d, -0.9, -0.8, 0, 2.8, zs + 0.03, zs + 0.12, TONE.PINE, S_WY);
      // (the head and neck on their post: a group whose origin is the post's foot, about which it nods)
      { const hm = mesh(d, matD, 'serpent', serpent.head); hm.position.set(0.85, 0, -zs); serpent.head.position.set(-0.85, 0, zs); lift.add(serpent.head); }
      d = INT.makeBuilder(); d.add(sawnStrip(X1 - X0 - 0.6, 0.75, 0.34, 9, true, rL), { p: [(X0 + X1) / 2, 0, zs - 0.38], c: '#ffffff', surf: sf(SID.WAVEFLAT, 0.2) });
      mesh(d, matD, 'serpent', serpent.row); lift.add(serpent.row);
      { const n = lf.length, at = new Float32Array(n * 4), pos = new Float32Array(n * 3); lf.forEach((q, i) => { at.set([q[0], q[1], q[2], (i * 0.618034 + 0.31) % 1], i * 4); pos.set(q, i * 3); });
        const fg = new THREE.InstancedBufferGeometry(), bud = flameGeometry(); fg.setAttribute('position', bud.getAttribute('position')); fg.setIndex(bud.getIndex()); fg.instanceCount = n;
        fg.setAttribute('aAt', new THREE.InstancedBufferAttribute(at, 4)); disposables.push(fg, bud);
        const fm = new THREE.Mesh(fg, LT.flame()); fm.frustumCulled = false; fm.name = 'lift flames'; lift.add(fm);
        const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); hg.setAttribute('aAt', new THREE.BufferAttribute(at, 4)); disposables.push(hg);
        const hp = new THREE.Points(hg, LT.halo()); hp.frustumCulled = false; hp.renderOrder = 6; lift.add(hp); }
      const rg = ropeGeometry([-2.9, 0.5, 3.9, 7.15].map((x) => { const l = [[x, 0, zs + 0.9], [x, -1, zs + 0.9]]; l.run = 1; return l; })); disposables.push(rg);
      const rm = new THREE.Mesh(rg, LT.rope()); rm.name = 'lift ropes'; rm.frustumCulled = false; liftRopes.add(rm);
    }
    await ctx.yield();
    // THE COVERS of the open floor: two leaves of boards that slide shut from either hand, in the thickness of the floor, once the flight has
    // come up through it: by the metre flown. They leave the lift's own slot open.
    const covers = [new THREE.Group(), new THREE.Group()];
    {
      const T = TH.TRAP, z0 = LIFTZ - 1.0, z1 = LIFTZ + 1.2;
      for (const s of [-1, 1]) { const b = INT.makeBuilder(), x0 = s < 0 ? T[0] : 0, x1 = s < 0 ? 0 : T[1];
        box(b, x0, x1, -0.3, -0.04, T[2], z0, '#94897a', S_BOARDS); box(b, x0, x1, -0.3, -0.04, z1, T[3], '#94897a', S_BOARDS);
        if (s < 0) box(b, x0, -3.3, -0.3, -0.04, z0, z1, '#94897a', S_BOARDS);
        const g = covers[s < 0 ? 0 : 1]; g.userData.s = s; mesh(b, matS, 'floor covers', g); scene.add(g); }
    }
    const wind = new THREE.Group(); wind.position.set(WIND[0], CF + 1.055, WIND[1]); scene.add(wind);
    {
      const b = INT.makeBuilder();
      b.add(new THREE.CylinderGeometry(0.045, 0.045, 2.5, 8), { p: [-0.2, 0, 0], r: [0, 0, Math.PI / 2], c: TONE.IRON, surf: S_IRON });
      for (const x of [-0.62, 0.62]) b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 20), { p: [x, 0, 0], r: [0, 0, Math.PI / 2], c: TONE.OAK, surf: S_WY });
      for (let j = 0; j < 14; j++) { const a = j / 14 * TAU; b.add(new THREE.BoxGeometry(1.24, 0.1, 0.045), { p: [0, Math.sin(a) * 0.53, Math.cos(a) * 0.53], r: [-a, 0, 0], c: TONE.PINE, surf: S_WX }); }
      // the crank: an arm at the drum's left end and the bar the hand holds
      box(b, -1.0, -0.94, -0.03, 0.03, -0.03, 0.23, TONE.IRON, S_IRON); b.add(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 8), { p: [-1.22, 0, 0.2], r: [0, 0, Math.PI / 2], c: TONE.DARK, surf: S_WX });
      mesh(b, matS, 'wind drum', wind);
    }
    await ctx.yield();
    { const rg = ropeGeometry(ropes); disposables.push(rg); const rm = new THREE.Mesh(rg, LT.rope()); rm.name = 'ropes'; rm.frustumCulled = false; scene.add(rm); }
    {
      // dust in the cellar's air, lit by its lanterns
      const rD = rng.fork('dust'), n = 1500, pos = new Float32Array(n * 3), sd = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { pos.set([rD.range(-12, 12), rD.range(CF + 0.3, -1.4), rD.range(2, 41)], i * 3); sd.set([rD(), rD(), rD(), rD()], i * 4); }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dg.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4)); disposables.push(dg);
      const dp = new THREE.Points(dg, LT.motes()); dp.name = 'dust'; dp.frustumCulled = false; dp.renderOrder = 6; scene.add(dp);
    }
    // ------------------------------------------------------------------ the lights: lanterns, footlights, ladders, chandeliers
    lan.forEach((p, i) => { U.uLan.value[i].set(p[0], p[1], p[2], p[3]); flames.push([p[0], p[1] - 0.05, p[2]]); });
    const chs = [[TH.RING[0], TH.RING[1], TH.RING[2], 60], ...CHANDS.map((q) => [q[0], q[1], q[2], 34]), [0, TH.TIER0 + TH.TIERH + 4.2, TH.HZC - TH.HRZ - 0.6, 26]];
    chs.forEach((p, i) => U.uCh.value[i].set(p[0], p[1], p[2], p[3]));
    for (let x = -8.5; x <= 8.51; x += 0.5) flames.push([x, 0.12, TH.FOOT]);
    for (const sd of [-1, 1]) for (let z = 5; z < TH.ZB - 4; z += 4.4) flames.push([sd * 19.5, 13.75, z]);
    for (let x = -12; x <= 12.01; x += 0.75) flames.push([x, 0.2, TH.BACK - 0.9]);
    for (let i = 0; i < 5; i++) for (let x = -12; x <= 12.01; x += 1.5) flames.push([x, 15.4, wingZ(i) + 2.35]);
    for (let k = 0; k < TH.WN; k++) for (const s of [-1, 1]) for (let j = 0; j < 6; j++) flames.push([s * (TH.PW + 1.1), 1.5 + 1.3 * j, wingZ(k) + 1.4]);
    {
      const n = flames.length, at = new Float32Array(n * 4), pos = new Float32Array(n * 3);
      flames.forEach((p, i) => { at.set([p[0], p[1], p[2], (i * 0.618034) % 1], i * 4); pos.set(p, i * 3); });
      const fg = new THREE.InstancedBufferGeometry(), bud = flameGeometry(); fg.setAttribute('position', bud.getAttribute('position')); fg.setIndex(bud.getIndex()); fg.instanceCount = n;
      fg.setAttribute('aAt', new THREE.InstancedBufferAttribute(at, 4)); disposables.push(fg, bud);
      const fm = new THREE.Mesh(fg, LT.flame()); fm.frustumCulled = false; fm.name = 'flames'; scene.add(fm);
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); hg.setAttribute('aAt', new THREE.BufferAttribute(at, 4)); disposables.push(hg);
      const hp = new THREE.Points(hg, LT.halo()); hp.frustumCulled = false; hp.renderOrder = 6; scene.add(hp);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the flight
    const plan = flightPlan(R), size = new THREE.Vector2();
    const setEvent = (u) => {
      for (const m of wings) { const { k, s, storm } = m.userData, f = wingShare(k, u, s), out = storm ? 1 - f : f; m.position.x = s * (TH.WX + TH.WW / 2 + TH.WT * out); }
      const dr = dropShare(u); U.uDrop.value = dr; dropRoll.position.y = 21 * (1 - dr);
      ship.position.x = shipX(u); cloud.position.y = cloudY(u); cloudRopes.scale.y = TH.GRID - cloud.position.y - 3.66;
      U.uGlory.value.set(TH.CLOUD[0], cloud.position.y + 2.3, TH.CLOUD[1] - 2.2, 1);
      lift.position.y = liftY(u); U.uLift.value = lift.position.y; liftRopes.scale.y = TH.GRID - lift.position.y;
      const cs = coverShare(u); U.uOpen.value = 1 - cs; for (const g of covers) g.position.x = g.userData.s * 7.5 * (1 - cs);
    };
    setEvent(0);
    return {
      scene, path, duration: DUR, pace: 1, title: 'A Wooden Sea', ride: 'none',
      camera: plan.camera, pois: plan.pois,
      portal: { shape: 'circle', radius: TH.RR, color: '#9fd0ff', glow: 0.35, revealDistance: 46, blendDistance: 10 },
      post: { exposure: 1.3, bloom: { strength: 0.75, radius: 0.7, threshold: 0.82 },
        grade: { saturation: 1.05, contrast: 1.08, tint: '#fff4e4', shadowTint: '#120c08', vignette: 0.32, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u = 0) {
        U.uTime.value = t % TWRAP;
        setEvent(u);
        const th = (t * CAP_W) % TAU; rotor.rotation.y = th; U.uStep.value = th;
        for (const m of rollers) m.rotation.x = (m.userData.dir * th * 3 + m.userData.ph) % TAU;
        shaft.rotation.z = (th * 4) % TAU; sun.rotation.z = (t * 0.2) % TAU; wind.rotation.x = -((t * 1.6 + WIND_PH) % TAU);
        for (const d of dolphins) d.rotation.z = -d.userData.sx * 0.85 * Math.sin((t * d.userData.w + d.userData.ph) % TAU);
        serpent.head.rotation.z = 0.05 * Math.sin((t * 0.8 + 0.4) % TAU); serpent.row.position.x = 0.3 * Math.sin((t * 1.05 + 2) % TAU);
        for (let k = 0; k < serpent.coils.length; k++) serpent.coils[k].position.y = 0.14 * (Math.sin((t * 1.5 + k * 1.3) % TAU) - 1);
        farSea[0].position.x = 0.45 * Math.sin((t * 0.9) % TAU); farSea[1].position.x = -0.45 * Math.sin((t * 0.7 + 1.1) % TAU);
        shipBody.rotation.z = 0.06 * Math.sin((t * 0.9) % TAU); shipBody.rotation.x = 0.03 * Math.sin((t * 0.63 + 2) % TAU); shipBody.position.y = 0.1 * Math.sin((t * 1.3 + 1) % TAU);
        ctx.renderer.getDrawingBufferSize(size); U.uRes.value.copy(size); U.uPx.value = size.y * camera.projectionMatrix.elements[5] * 0.5;
      },
      dispose() { for (const g of disposables) g.dispose(); LT.dispose(); },
    };
  },
};
