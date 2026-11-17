// THE ORCHARD WHERE FRUIT OUTGREW US (world id: lake-of-pink-fountains), after Hieronymus Bosch.
// A garden nobody planted, built as a real bowl of three tilted lawns round a round lake: we chase a goldfinch
// 20 m tall down the slope, swing out over the lake to the blue glass tube that stands on thorn forks beside the pink fountain, fly through it, loop
// out round the blue horn where the hoopoe sits, dive east at a blue tower, pass low over the north-east shore among the
// birds standing on fruit, and climb the fountain's face to the dark round window in the globe, past the owl.
// (The last third was rerouted after the outside review: path 1,035 m, 46 s; the beats keep their script u, see SCRIPT u.)
// (Outside review, round 5: the tube no longer pierces the skirt. It stands free on the lake 17 m clear of the fountain and the path
//  swings out to it and back, +19 m; the garden is still planted against the first route, path0. See "ONE FIX IN SPACE" below.)
// (Outside review, round 1: seen from inside, the great tube is clear glass (hero part: 'tube-glass', uInTube), fuller inside the skirt;
//  the lawns stack in tone up the bowl; each far tower stands in a round pool; the finch keeps a short lead down the dive; and
//  THE DAY TURNS over the last third (U.uEve, path u 0.55 to 0.76): skyline shell pink under fuller slate, deeper lawns and hills.)
// (Correction against the brief, 6 Oct: NO SUN, NO CLOUD, NO LAMP. The sky is its three-colour grade and nothing else. What crosses it
//  is his own: THE GREAT FLIERS, eighteen large birds on the wing (egret, stork, crane, swan: neck out, legs trailing, lead white with
//  the hairline, three in shell pink, two in slate, four with a cherry or a berry in the beak), flying slowly one way round the garden
//  in three loose files over the rim of lawn three (1,320 to 1,394 m from the axis, inside the hills: seen from the garden they cross
//  the sky above the crest, and no wing at any bearing or stroke comes within 100 m of a slope, so each is whole and outlined all
//  round), set evenly by bearing from the fountain's axis; and the brief's weather, three thin
//  skeins of birds as dark specks, thickening and thinning like smoke, riding clear above the toothed crest. The water stays azurite,
//  paling to the chalk ground, with short hard-edged ragged smears of the turned skyline's pink under its far shore (lake and pools).
//  Round the window a second ruled ring of pearls opens as the day turns, and THE POUR is the event of the exit: from path u 0.62 a
//  loose ribbon of two hundred sickle-winged swifts rises out of the mussel shell at the horn's foot, climbs the sky to port of the
//  fountain and comes over in one bow into the dark from the window's upper left: on one side only, never a turn about the window's
//  axis. Each is a six-triangle swift drawn large enough to read as a bird: from across the lake one in five is drawn (each of the
//  others only out to a distance of its own, 80 to 170 m), flat to the eye and held to its size in the picture, so the ribbon is
//  birds with sky between them, never specks; and none is drawn within 25 m of the eye (its road keeps 25 m and more from ours to
//  path u 0.96, where both go in at the window; the brief's own swift ribbon is what passes our shoulders). Six towers of 100 to 125 m, none over 125:
//  nothing overtops the 140 m fountain. Lawn green is on the lawn only: the tit's breast is chalk, the mallard's beak thinned pink.)
// STYLE: flat pigment (post.flat = 1, no tone-map inverse). Everything is a lathe or loft shaded with the
// hero's glaze (pales to the chalk ground where it faces us, one sliding ivory streak) and drawn again as an
// inverted hull for the hairline. No lights, no fog, no shadows: a contact ring only.
// VARIATIONS (seed / ctx.vary.hour): forenoon; blue colourway (fountain slate, tubes pink); evening (sky ivory
// to shell pink, lawns deeper); shutters (grisaille, vermilion kept on fruit and the finch's mask).
// RARE: a 30 m bubble with a pair of cherries rises from the lake at u 0.55, settles on the horn, and the
// hoopoe pricks it at script u 0.72 (the loop's apex, path u 0.61; the brief's 0.78 would fall behind the camera).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  buildHero, PALETTE, PAT, FormBuilder, smoothProfile, thorn, makeStyleUniforms, glazeMaterial, hullMaterial,
  dotMaterial, bubbleMaterial, trackResolution, GLAZE_VERT, GLAZE_FRAG, HULL_VERT, HULL_FRAG,
} from '../parts/lake-of-pink-fountains.js';

const V3 = THREE.Vector3;
// the pour's road, in metres [to port of the window, above it, out from it]: up from the shell, over in one bow, in at the upper left
const POUR_COURSE = [[96, -70, 78], [86, -38, 68], [80, -6, 58], [70, 18, 48], [56, 28, 39], [42, 27, 30], [29, 20, 22], [17, 12, 14], [7, 5, 6], [0, 0, -2], [0, 0, -12], [0, 0, -22]];
const AX = 0, AZ = 380;                                  // fountain axis and lake centre
const LAKE_R = 170;
const POUR_FAR = 2.7;                                    // a far swift of the pour keeps its size in the picture out to 300 m
const TAU = Math.PI * 2;
const step01 = (u, e) => (u >= e ? 1 : 0);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// the bowl: height by radius from the axis (three lawns, two banks, blue hills), in metres
const PROF = [[0, -2.5], [164, -2.5], [171, 0.3], [250, 10], [262, 35], [700, 160], [715, 190], [1350, 390], [2000, 930], [2150, 700]];
function profY(r) {
  for (let i = 0; i < PROF.length - 1; i++) if (r <= PROF[i + 1][0]) { const a = PROF[i], b = PROF[i + 1]; return a[1] + (b[1] - a[1]) * (r - a[0]) / (b[0] - a[0]); }
  return PROF[PROF.length - 1][1];
}

export default {
  id: 'lake-of-pink-fountains',
  name: 'The Orchard Where Fruit Outgrew Us',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'Hieronymus Bosch, about 1450 to 1516',
  weirdness: 0.85,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();

    // ---------------- variation: edition by seed, or by the hour the viewer asked for ----------------
    const hour = vary.hour || 'any';
    let edition = rng.pick(['forenoon', 'evening', 'blue', 'forenoon', 'shutters', 'blue', 'evening', 'forenoon']);
    if (hour === 'night') edition = 'shutters';
    else if (hour === 'golden' || hour === 'dawn') edition = 'evening';
    else if (hour === 'day' && (edition === 'shutters' || edition === 'evening')) edition = 'forenoon';
    const rare = !!vary.rare, density = vary.density ?? 1;
    const base = PALETTE.map((h) => new THREE.Color(h));
    const mixc = (a, b, t) => a.clone().lerp(b, t);
    let pal = base.map((c) => c.clone());
    if (edition === 'evening') pal[2] = mixc(base[2], base[3], 0.25);
    if (edition === 'shutters') {                          // grisaille: thinned blue-black over the chalk ground
      pal[0] = mixc(base[4], base[6], 0.16); pal[1] = mixc(base[4], base[6], 0.52); pal[2] = mixc(base[4], base[6], 0.4);
      pal[3] = mixc(base[4], base[6], 0.72);
    }
    const hex = pal.map((c) => '#' + c.getHexString());
    const C = { pink: pal[0], slate: pal[1], lawn: pal[2], deep: pal[3], ground: pal[4], verm: pal[5], ink: pal[6] };
    const blue = edition === 'blue';
    const bodyPig = blue ? C.slate : C.pink, glassPig = blue ? C.pink : C.slate;
    const deepen = (c, t = 0.3) => mixc(c, C.ink, t), thin = (c, t = 0.3) => mixc(c, C.ground, t);
    const U = makeStyleUniforms(hex);

    // ---------------- ground height ----------------
    const tri = (ang, n, sd) => { const k = (ang / TAU + 1) * n + sd; const f = k - Math.floor(k); return (1 - Math.abs(f - 0.5) * 2) * (0.35 + 0.65 * hash(Math.floor(k) + sd * 7)); };
    const CRAGS = [[0.34, 1.0], [-0.52, 0.8], [1.25, 1.1], [-1.5, 0.9], [2.3, 1.0], [-2.55, 0.85], [3.0, 0.7]];   // [bearing, height]: rock needles on the crest
    const teeth = (ang) => {
      const env = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ang * 3 + 1.2)) * (0.55 + 0.45 * Math.sin(ang * 7 + 0.4));     // massifs and long low saddles
      let c = 0; for (const [a, h] of CRAGS) { let d = Math.abs(ang - a); if (d > Math.PI) d = TAU - d; c = Math.max(c, h * Math.max(0, 1 - d / 0.075)); }
      return (0.5 * tri(ang, 31, 0.3) + 0.4 * tri(ang, 53, 1.7) + 0.25 * tri(ang, 89, 4.1)) * (0.55 + 1.1 * env) + 0.95 * c * c * (3 - 2 * c);
    };
    const groundY = (x, z) => {
      const dx = x - AX, dz = z - AZ, r = Math.hypot(dx, dz);
      let y = profY(r);
      if (r > 262) {
        const amp = r < 700 ? 5 * smoothstep(262, 330, r) * (1 - smoothstep(660, 700, r)) : r < 1350 ? 9 * smoothstep(715, 800, r) : 0;
        if (amp > 0) y += amp * noise.fbm2(x / 260, z / 260, 2);
        if (r > 1350) y += (teeth(Math.atan2(dx, dz)) - 0.4) * 300 * smoothstep(1500, 2000, r) * (1 - smoothstep(2000, 2150, r) * 0.6);
      }
      return y;
    };

    // ---------------- the hero (its local space = world minus (0, 0, 380)) ----------------
    const hero = await buildHero(ctx, { palette: hex, uniforms: U, detail, colourway: blue ? 'blue' : undefined, backdrop: false, filmAt: 0.524 });
    hero.object.position.set(AX, 0, AZ);
    scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    const A = hero.anchors, toW = (v) => v.clone().add(hero.object.position);
    await ctx.yield();

    // ---------------- the path: entry, the drop, the lake, the tube, the loop, the window ----------------
    const globeW0 = toW(A.globe.center);
    const tA = toW(A.tube.a), tB = toW(A.tube.b), tD = A.tube.dir.clone();
    const WIN = A['window'];                                 // the hero's anchor for the round opening in the globe
    const winC = toW(WIN.center), winD = WIN.dir.clone(), seat = toW(A.portalSeat.position);
    // (Outside review, round 5: ONE FIX IN SPACE.) The tube used to pierce the skirt at x -34, so the flight into it ran along the
    // scale wall. The hero's tube now stands free on the lake, west of the fountain (17 m clear of the skirt at its nearest), and
    // this stretch of the path swings out to its mouth and back: it leaves the first route at the last lake point (-28.5, 7.6, 250)
    // and is on it again a little way up the loop (-24.6, 70.6, 518). The first route (path0, 1,035 m) is kept: everything that was
    // planted against it stays planted against it, so the garden is the one it always was, and its script u still times every beat.
    const TA0 = new V3(-34, 14, 284), TD0 = new V3(0, 36, 136).normalize(), TL0 = Math.hypot(36, 136);   // the tube as it first lay
    const headPts = () => [[0, 100, 0], [0, 100, 22], [0, 100, 44], [0, 98.6, 62], [0, 91, 78], [0, 72, 104], [0, 49, 139], [0, 27, 172],
      [-1, 13.5, 194], [-6, 8.6, 212], [-17, 7.4, 232], [-28.5, 7.6, 250]].map((p) => new V3(p[0], p[1], p[2]));
    const loopPts = [];
    for (let i = 0; i < 4; i++) {                             // out of the tube and round the horn to the apex beside the hoopoe
      const ph = (i / 8) * (240 * Math.PI / 180);
      loopPts.push(new V3(36 - 70 * Math.cos(ph), 66 + 30 * Math.pow(i / 8, 0.9), 483 + 70 * Math.sin(ph)));
    }
    const tailPts = (from = 0) => {
      const t = loopPts.slice(from).map((p) => p.clone());
      // the last third (reworked for the outside review): from the apex we dive east toward the blue tower, swing low
      // over the north-east shore past the birds standing on fruit at the water's edge, and climb the fountain's face to the window
      for (const p of [[88, 69, 553], [139.2, 55, 550], [167.5, 39, 538.3], [179.2, 24, 510], [173.8, 20.5, 490]]) t.push(new V3(p[0], p[1], p[2]));
      for (const [s, y] of [[165, 21.5], [140, 28], [115, 40], [90, 54], [65, 68.5], [44, 81], [26, 90.5], [12, 95.2], [2, 96]]) t.push(winC.clone().addScaledVector(winD, s).setY(y));
      t.push(seat.clone()); return t;
    };
    const mid0 = [TA0.clone().addScaledVector(TD0, -17)];
    for (const s of [0, 35, 70, 105, TL0, TL0 + 31]) mid0.push(TA0.clone().addScaledVector(TD0, s));
    const path0 = makePath([...headPts(), ...mid0, ...tailPts()]);
    const TL = A.tube.length, mid = [new V3(-56.4, 8.8, 309.9), new V3(-61.7, 9.6, 324.5), tA.clone().addScaledVector(tD, -18)];   // straight on from the last lake point, then an 85 m arc onto the tube's axis
    for (const f of [0, 0.33, 0.66, 1]) mid.push(tA.clone().addScaledVector(tD, f * TL));
    mid.push(tA.clone().addScaledVector(tD, TL + 10), new V3(-44.5, 64, 482));   // (10 m outside the loop's old foot, so the turn out of the tube runs one way into the loop)
    const path = makePath([...headPts(), ...mid, ...tailPts(1)]);
    // SCRIPT u AND PATH u. Every beat of this world was written against the first route's first form (880 m, apex at 0.7219). The
    // tail is longer and the swing out to the tube adds a few metres, so the engine's u (arc length on the real path) is mapped to
    // that script u: uo(path u) -> script u, un(script u) -> path u. Literals everywhere below are script u; only pois, pace and
    // path lookups use path u. oldU / newU carry a path u between this path and the first route (equal metre for metre outside
    // the moved stretch, even inside it), so a beat keyed to the first route falls on the same spot of the garden.
    const L0 = path0.length, LN = path.length, DL = LN - L0;
    const D0 = path0.nearestXZ(-28.5, 250).u * L0, D1 = path.nearestXZ(loopPts[1].x, loopPts[1].z).u * LN;
    const oldU = (u) => { const d = clamp(u, 0, 1) * LN; return (d <= D0 ? d : d >= D1 ? d - DL : D0 + (d - D0) * (D1 - DL - D0) / (D1 - D0)) / L0; };
    const newU = (v) => { const d = clamp(v, 0, 1) * L0; return (d <= D0 ? d : d >= D1 - DL ? d + DL : D0 + (d - D0) * (D1 - D0) / (D1 - DL - D0)) / LN; };
    const U_KNEE = path0.nearestXZ(36, 553).u, KN = [0, U_KNEE, 0.8, 0.87, 1], KO = [0, 0.7219, 0.745, 0.8, 1];
    const pw = (x, A0, B0) => { for (let i = 0; i < 4; i++) if (x <= A0[i + 1]) return B0[i] + (B0[i + 1] - B0[i]) * (x - A0[i]) / (A0[i + 1] - A0[i]); return B0[4]; };
    const uo = (u) => pw(oldU(u), KN, KO), un = (u) => newU(pw(clamp(u, 0, 1), KO, KN));
    const P = (u) => path.pointAt(un(u)), T = (u) => path.tangentAt(un(u));
    // u of the beats, measured on the real path (as script u)
    const uOf = (pt) => uo(path.nearestXZ(pt.x, pt.z).u);
    const U_MOUTH = uOf(tA), U_END = uOf(tB), U_APEX = uOf(new V3(36, 77, 553));

    // ---------------- sky: chalk ground at the skyline, thin slate overhead (ivory to pink in the evening) ----------------
    // (outside review, round 1) the day turns as we fly: by the last third the skyline has gone shell pink under a fuller slate,
    // the lawns have taken more of the deep glaze. The sky is this grade alone: no sun, no cloud. Each edition has its own start and end.
    const SKY = edition === 'evening'
      ? { a: [thin(C.pink, 0.15), thin(C.pink, 0.62), C.ground.clone()], b: [C.pink.clone(), thin(C.pink, 0.45), thin(C.slate, 0.25)] }
      : edition === 'shutters'
        ? { a: [mixc(C.ground, C.ink, 0.08), mixc(C.ground, C.ink, 0.3), mixc(C.ground, C.ink, 0.58)], b: [C.ground.clone(), mixc(C.ground, C.ink, 0.36), mixc(C.ground, C.ink, 0.78)] }
        : { a: [C.ground.clone(), thin(C.slate, 0.6), thin(C.slate, 0.14)], b: [thin(C.pink, 0.08), C.ground.clone(), deepen(C.slate, 0.2)] };
    const skyLow = SKY.a[0].clone(), skyMid = SKY.a[1].clone(), skyHigh = SKY.a[2].clone();
    U.uSkyLow.value = skyLow;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3600, 24, 12), new THREE.ShaderMaterial({
      uniforms: { uLow: { value: skyLow }, uMid: { value: skyMid }, uHigh: { value: skyHigh } },
      side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform vec3 uLow; uniform vec3 uMid; uniform vec3 uHigh; varying vec3 vD;
        void main() {
          float l = max(length(vD), 1e-3); float e = vD.y / l;
          float t = clamp((e - 0.3) / 0.36, 0.0, 1.0);
          vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.42, t));
          col = mix(col, uHigh, smoothstep(0.3, 1.0, t));
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    trackResolution(sky, U);                                 // drawn first in every pass: line widths follow whichever buffer is being drawn

    // ---------------- round pools on the lawns (outside review, round 1): each far tower stands in its own round pool, and
    // three more lie open on the slopes, so the hillside is lawns, groves and water instead of one ruled orchard. [x, z, radius]
    const TOWER_AT = [[-34, 800, 122], [226, 574, 112], [-390, 1105, 150], [430, 1180, 140], [-180, -40, 112], [-520, 330, 104]];
    const PONDS = TOWER_AT.map(([x, z, H]) => { const r = Math.hypot(x - AX, z - AZ); return [x, z, clamp(Math.min(r - 268, 0.55 * H), 30, 80)]; });
    PONDS.push([196, 846, 52], [-262, 700, 44]);
    const inPond = (x, z, pad) => { for (const q of PONDS) if (Math.hypot(x - q[0], z - q[1]) < q[2] + pad) return true; return false; };

    // ---------------- the bowl: one mesh, lawn glaze paling in level bands, dark tufts and flower dots in its own shader ----------------
    {
      const radii = [120, 150, 164, 171];
      for (let r = 183; r < 250; r += 13) radii.push(r);
      radii.push(250, 254, 258, 262);
      for (let r = 276; r < 2150;) { radii.push(r); let next = r + Math.max(14, r * 0.047); for (const k of [700, 715, 1350, 2000]) if (r < k - 1 && next > k - 6) next = k; r = next; }
      radii.push(2150);
      const SEG = 184, nR = radii.length, pos = new Float32Array(nR * (SEG + 1) * 3), idx = [];
      for (let i = 0; i < nR; i++) {
        for (let j = 0; j <= SEG; j++) {
          const a = (j % SEG) / SEG * TAU, x = AX + Math.sin(a) * radii[i], z = AZ + Math.cos(a) * radii[i], k = (i * (SEG + 1) + j) * 3;
          pos[k] = x; pos[k + 1] = groundY(x, z); pos[k + 2] = z;
        }
        if (i % 3 === 2) await ctx.yield();
      }
      for (let i = 0; i < nR - 1; i++) for (let j = 0; j < SEG; j++) { const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new V3(AX, 300, AZ), 2400);
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...U, uLawn: { value: C.lawn }, uDeep: { value: C.deep }, uSlate: { value: C.slate }, uVerm: { value: C.verm }, uAxis: { value: new V3(AX, 0, AZ) }, uPond: { value: PONDS.map((q) => new V3(q[0], q[1], q[2])) }, uTier: { value: edition === 'evening' ? 0.26 : 0.4 } },
        vertexShader: /* glsl */`varying vec3 vWP; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          uniform vec3 uGround; uniform vec3 uInk; uniform vec3 uLawn; uniform vec3 uDeep; uniform vec3 uSlate; uniform vec3 uVerm; uniform vec3 uAxis; uniform float uTime; uniform float uEve; uniform float uTier; uniform vec3 uPond[8]; uniform vec3 uSkyLow;
          varying vec3 vWP;
          float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0); return length(pa - ba * h); }
          float line(float e, float fw) { float w = max(min(1.5 * fw, 0.1), 1e-4); return (1.0 - smoothstep(0.5 * w, w, e)) * (1.0 - smoothstep(0.1, 0.3, fw)); }
          void main() {
            vec2 q = vWP.xz - uAxis.xz; float r = length(q); float fr = max(fwidth(r), 1e-4);
            float hills = smoothstep(1350.0 - fr, 1350.0 + fr, r);
            float band = mix(26.0, 105.0, hills);
            float k = (vWP.y + uTime * 0.4) / band + 0.35; float i = floor(k);
            float pale = 0.04 + 0.2 * fract(i * 0.381966);
            vec3 lawn = mix(uLawn, uGround, pale);
            // the lawns stack in tone as he stacked them: each level band up the bowl takes a little more of the deep glaze,
            // so the pale lawn round the lake sits under a darker hillside; and all of it deepens as the day turns
            float bandY = clamp((i * band - uTime * 0.4) / 390.0, 0.0, 1.0);
            lawn = mix(lawn, uDeep, uTier * (bandY * (1.6 - 0.6 * bandY)) + 0.26 * uEve);
            // the distance: ONE pale azurite band, lighter than the lawn, thinning to the chalk at its toothed crest; no stripes on it
            float hh = clamp((vWP.y - 390.0) / 560.0, 0.0, 1.0);
            // (reworked) two ranges, as he stacked them: a nearer one in fuller azurite with its own toothed, outlined ridge, the far one paler
            float ang = atan(q.x, q.y + 1e-4 * step(abs(q.x) + abs(q.y), 1e-5));
            float rf = 0.5 * abs(sin(ang * 7.0 + 1.0)) + 0.3 * abs(sin(ang * 13.0 + 2.3)) + 0.2 * abs(sin(ang * 29.0 + 0.7));
            float ridge = vWP.y - (455.0 + 250.0 * rf); float fwr = max(fwidth(ridge), 1e-3);
            float nearR = 1.0 - smoothstep(-fwr, fwr, ridge);
            vec3 hill = mix(mix(uSlate, uGround, 0.42 + 0.3 * hh * hh), mix(uSlate, uGround, 0.2), nearR);
            hill = mix(hill, mix(uSlate, uInk, 0.12), 0.45 * uEve);
            hill = mix(hill, uInk, 0.6 * hills * (1.0 - smoothstep(0.7 * fwr, 1.5 * fwr, abs(ridge))));
            vec3 col = mix(lawn, hill, hills);
            float fk = min(fwidth(k), 1.0); float e = min(fract(k), 1.0 - fract(k));
            col = mix(col, mix(uLawn, uDeep, 0.45), line(e, fk) * 0.45 * (1.0 - hills));
            // the two thicket banks, in the deep green glaze
            float bank = smoothstep(250.0 - fr, 250.0 + fr, r) * (1.0 - smoothstep(263.0 - fr, 263.0 + fr, r))
                       + smoothstep(700.0 - fr, 700.0 + fr, r) * (1.0 - smoothstep(716.0 - fr, 716.0 + fr, r));
            col = mix(col, uDeep, bank);
            // the hairline where green steps to blue, and round the shore
            float lw = 1.2 * fr;
            col = mix(col, uInk, 0.8 * (1.0 - smoothstep(0.6 * lw, lw, abs(r - 1350.0))));
            col = mix(col, uInk, 0.75 * smoothstep(2000.0 - 1.8 * fr, 2000.0 - 0.9 * fr, r));           // and along the toothed crest: far things are outlined like near ones
            col = mix(col, mix(uDeep, uInk, 0.3), (1.0 - smoothstep(175.0 - fr, 175.0 + fr, r)) * 0.85);   // contact ring round the lake
            float px = max(length(dFdx(vWP.xz)), length(dFdy(vWP.xz)));
            // the round pools: water in the lake's own azurite, ripple rings creeping out from the middle, a hairline shore
            // and the deep green contact ring round it
            float pond = 0.0; float aw = max(px, 0.02);
            vec2 pcp = vWP.xz - cameraPosition.xz; float dpp = length(pcp); vec2 dnp = dpp > 1e-3 ? pcp / dpp : vec2(0.0, 1.0);
            for (int j = 0; j < 8; j++) {
              float d = length(vWP.xz - uPond[j].xy) - uPond[j].z;
              float inside = 1.0 - smoothstep(-aw, aw, d);
              col = mix(col, mix(uDeep, uInk, 0.3), 0.85 * (1.0 - smoothstep(4.5 - aw, 4.5 + aw, d)) * (1.0 - inside));
              vec3 wc = mix(mix(uSlate, uGround, 0.22), uGround, 0.22 * uEve);       // the pools keep the lake's azurite, a little paler once the day has turned
              // the turned skyline's smear under each pool's far shore: short ragged upright strokes of its pink, hard-edged
              vec2 qp = vWP.xz - uPond[j].xy; float latp = qp.x * dnp.y - qp.y * dnp.x;
              float tfp = dot(-qp, dnp) + sqrt(max(uPond[j].z * uPond[j].z - latp * latp, 0.0));
              float ksp = fract(sin(floor(latp / 2.6) * 78.233 + float(j) * 3.7) * 43758.5453);
              wc = mix(wc, uSkyLow, 0.8 * step(0.3, ksp) * step(tfp, 0.62 * uPond[j].z * uEve * (0.3 + 0.7 * ksp)));
              float ph = d / 6.5 + uTime * 0.11; float fw = aw / 6.5; float w = max(min(1.5 * fw, 0.12), 1e-4);
              float rp = (1.0 - smoothstep(0.5 * w, w, abs(fract(ph) - 0.5))) * (1.0 - smoothstep(0.11, 0.25, fw));
              wc = mix(wc, uGround, 0.75 * rp * step(d, -3.0));
              col = mix(col, wc, inside);
              col = mix(col, uInk, 0.8 * (1.0 - smoothstep(0.75 * aw, 1.5 * aw, abs(d))));
              pond = max(pond, inside);
            }
            // tufts and flower dots: single flicks of the pointed brush, fanned away from the eye, ruled in a loose grid
            vec2 gp = vWP.xz / 8.0;
            float vis = (1.0 - smoothstep(0.4, 0.85, px)) * (1.0 - hills) * (1.0 - bank) * step(171.5, r) * (1.0 - pond);
            if (vis > 0.01) {
              vec2 id = floor(gp); float h = h1(id); float h2 = h1(id + 17.3);
              vec2 c = (id + 0.25 + 0.5 * vec2(h, h2)) * 8.0;
              vec2 p = vWP.xz - c;
              vec2 away = vWP.xz - cameraPosition.xz; float al = length(away); away = al > 1e-3 ? away / al : vec2(0.0, 1.0);
              vec2 side = vec2(-away.y, away.x);
              float w = max(0.07, 0.9 * px);
              float sway = 0.12 * sin(uTime * 1.1 + h * 40.0);
              float len = 1.3 + 0.9 * h2;
              float kind = h1(id + 5.1);
              float d = min(seg(p, vec2(0.0), away * len + side * sway), min(seg(p, vec2(0.0), (away * 0.85 + side * (0.5 + sway)) * len * 0.8), seg(p, vec2(0.0), (away * 0.85 - side * (0.5 - sway)) * len * 0.8)));
              d = min(d, min(seg(p, vec2(0.0), (away * 0.5 + side * 0.85) * len * 0.55), seg(p, vec2(0.0), (away * 0.5 - side * 0.85) * len * 0.55)));
              float tuft = (1.0 - smoothstep(w * 0.6, w, d)) * step(kind, 0.72);
              col = mix(col, mix(uDeep, uInk, 0.25), tuft * vis);
              float dr = 0.42; float dd = length(p);
              float flower = (1.0 - smoothstep(dr, dr + px, dd)) * step(0.72, kind);
              vec3 fc = kind > 0.9 ? uVerm : uGround;
              float rim = smoothstep(dr - max(1.5 * px, 0.08), dr - 0.5 * max(1.5 * px, 0.08), dd);
              col = mix(col, mix(fc, uInk, rim * 0.8), flower * vis);
            }
            gl_FragColor = vec4(col, 1.0);
          }`,
      });
      const bowl = new THREE.Mesh(g, mat); bowl.name = 'bowl'; scene.add(bowl);
    }
    await ctx.yield();

    // ---------------- shared instanced quad + helpers ----------------
    const quadGeo = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const glazeMat = glazeMaterial(U), hullMat = hullMaterial(U);
    const glazeFruit = glazeMaterial(U, { pale: 0.3 });
    const glazeDark = glazeMaterial(U, { pale: 0.24 });                // trees, thickets, thistles: the deep green stays deep
    const BIG = new THREE.Sphere(new V3(AX, 200, AZ), 2600);
    // a form drawn twice: glaze and hairline
    const addForm = (geo, name, parent = scene, gm = glazeMat) => {
      if (!geo.boundingSphere) geo.boundingSphere = BIG;
      const a = new THREE.Mesh(geo, gm), b = new THREE.Mesh(geo, hullMat); a.name = name; b.name = name + '-line';
      parent.add(a, b); return [a, b];
    };
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new V3(), _p = new V3(), _e = new THREE.Euler();
    const instanced = (geo, list, name, withHull = true, gm = glazeMat) => {       // list: [{ p: V3, s: scale, ry, rx?, rz?, tint? }]
      const n = Math.max(1, list.length), out = [];
      for (const mat of withHull ? [gm, hullMat] : [gm]) {
        const m = new THREE.InstancedMesh(geo, mat, n); m.name = name; m.frustumCulled = false;
        list.forEach((it, i) => {
          _e.set(it.rx || 0, it.ry || 0, it.rz || 0, 'YXZ'); _q.setFromEuler(_e);
          _m4.compose(it.p, _q, _s.setScalar(it.s)); m.setMatrixAt(i, _m4);
        });
        if (!list.length) m.setMatrixAt(0, _m4.makeScale(0, 0, 0));
        m.instanceMatrix.needsUpdate = true; scene.add(m); out.push(m);
      }
      return out;
    };
    // ---------------- ball trees and thicket balls as painted discs: a sphere is round from anywhere, so each is one camera-facing
    // disc whose dots are ruled on the ball's own latitude and longitude (they stay on the ball and slide in parallax), with the
    // hairline, the glaze and the short streak of every other form, and a thin stem ribbon under it. Round at any size, 4 triangles.
    const ballMesh = (trees, bushes, name) => {
      const n = Math.max(1, trees.length + bushes.length), aBall = new Float32Array(n * 4), aStem = new Float32Array(n * 4);
      let i = 0;
      for (const t of trees) { const R = 0.275 * t.s; aBall.set([t.p.x, t.p.y + t.s - R, t.p.z, R], i * 4); aStem.set([t.s - R * 1.6, 0.028 * t.s, hash(t.p.x * 0.37 + t.p.z * 0.11), 0], i * 4); i++; }
      for (const b of bushes) { aBall.set([b.p.x, b.p.y + 0.9 * b.s, b.p.z, 0.95 * b.s], i * 4); aStem.set([0, 0, hash(b.p.x * 0.31 + b.p.z * 0.17), 1], i * 4); i++; }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
      g.setAttribute('aPart', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 1, 1, 1], 1));
      g.setIndex([4, 5, 6, 4, 6, 7, 0, 1, 2, 0, 2, 3]);
      g.setAttribute('aBall', new THREE.InstancedBufferAttribute(aBall, 4)); g.setAttribute('aStem', new THREE.InstancedBufferAttribute(aStem, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...U, uDeepC: { value: C.deep }, uStemC: { value: deepen(C.deep, 0.3) }, uPaleC: { value: mixc(C.ground, C.lawn, 0.75) } },
        vertexShader: /* glsl */`attribute vec4 aBall; attribute vec4 aStem; attribute float aPart; uniform vec2 uRes; uniform float uTime;
          varying vec2 vQ; varying float vPx; varying vec3 vR; varying vec3 vU; varying vec3 vF; varying vec3 vI;
          void main() {
            vec3 nod = vec3(sin(uTime * 1.3 + aStem.z * 40.0), 0.0, cos(uTime * 1.05 + aStem.z * 23.0)) * aBall.w * 0.09 * (1.0 - aStem.w);   // the balls nod on their stems
            vec3 c = aBall.xyz + nod; vec3 toC = cameraPosition - c; float dist = max(length(toC), 0.1); vec3 F = toC / dist;
            vec3 R = cross(vec3(0.0, 1.0, 0.0), F); float rl = length(R); R = rl > 1e-3 ? R / rl : vec3(1.0, 0.0, 0.0);
            vec3 Uv = cross(F, R);
            float pxm = projectionMatrix[1][1] * uRes.y * 0.5 / dist;
            vec3 wp;
            if (aPart < 0.5) wp = c + (R * position.x + Uv * position.y) * aBall.w;
            else { float hw = max(aStem.y, 0.8 / pxm); wp = c - nod * (1.0 - position.y) - vec3(0.0, aBall.w * 0.8 + aStem.x * (1.0 - position.y), 0.0) + R * position.x * hw - F * aBall.w * 0.4; }
            vQ = position.xy; vPx = aBall.w * pxm; vR = R; vU = Uv; vF = F; vI = vec3(aStem.z, aStem.w, aPart);
            vec4 cp = projectionMatrix * viewMatrix * vec4(wp, 1.0);
            // a ball's disc takes the depth of the ball's near face, so sloping ground never slices it: it stays whole and round
            if (aPart < 0.5) { vec4 cf = projectionMatrix * viewMatrix * vec4(wp + F * min(aBall.w, dist * 0.5), 1.0); cp.z = cf.z / max(cf.w, 1e-4) * cp.w; }
            gl_Position = cp;
          }`,
        fragmentShader: /* glsl */`uniform vec3 uGround; uniform vec3 uInk; uniform vec3 uVerm; uniform vec3 uDeepC; uniform vec3 uStemC; uniform vec3 uPaleC; uniform float uTime;
          varying vec2 vQ; varying float vPx; varying vec3 vR; varying vec3 vU; varying vec3 vF; varying vec3 vI;
          void main() {
            if (vI.z > 0.5) { gl_FragColor = vec4(uStemC, 1.0); return; }
            float r = length(vQ); if (r > 1.0) discard;
            float z = sqrt(max(1.0 - r * r, 0.0));
            vec3 N = vR * vQ.x + vU * vQ.y + vF * z;
            float bush = vI.y;
            // the copper-green glaze: full pigment at the rim, thinning a little toward a yellow green (never grey) where it faces us
            vec3 pig = uDeepC;
            vec3 col = mix(pig, uPaleC, 0.1 * z * sqrt(z));
            col = mix(col, uInk, 0.1 * smoothstep(0.8333, 1.0, r));
            // ruled rows of small touches on the ball itself: ivory flicks, and one in three a solid vermilion fruit a twelfth of the ball wide
            float rows = mix(9.0, 11.0, bush); float cells = 2.0 * rows;
            float seed = floor(vI.x * 255.0 + 0.5);                              // per-ball seed, quantised: a varying may wobble in the last bit
            float turn = atan(N.x, N.z + step(abs(N.x) + abs(N.z), 1e-6) * 1e-5) / 6.2831853 + seed / 255.0;
            float lat = acos(clamp(N.y, -1.0, 1.0)) / 3.14159265;
            vec2 cuv = vec2(turn * cells, lat * rows); float row = floor(cuv.y);
            float cx = cuv.x + 0.5 * mod(row, 2.0);
            vec2 q = vec2(fract(cx) - 0.5, fract(cuv.y) - 0.5);
            float cellPx = vPx * 3.14159265 / rows * max(z, 0.3);               // one row on screen, in pixels
            float crisp = smoothstep(3.2, 5.0, cellPx);                          // under about 4 px a row the ball keeps its flat green: fruit first, the ivory touches only when they are a real mark
            float wd = 1.0 / max(cellPx, 1.0);
            float dd = length(q * vec2(max(sin(lat * 3.14159265), 0.2), 1.0));
            float isFruit = step(0.68, fract(sin(dot(vec2(mod(floor(cx), cells), row) + seed * 0.37, vec2(12.9898, 78.233))) * 43758.5453));
            float rad = mix(0.14, 0.25, isFruit); float touch = mix(smoothstep(5.5, 8.0, cellPx), 1.0, isFruit);
            float dotc = 1.0 - smoothstep(rad - 0.5 * wd, rad + 0.5 * wd, dd);
            float ringc = (1.0 - smoothstep(rad + wd, rad + 2.0 * wd, dd)) * smoothstep(9.0, 14.0, cellPx);
            float poles = step(1.0, row) * step(row, rows - 2.0);
            col = mix(col, mix(pig, uInk, 0.55), ringc * (1.0 - dotc) * poles * touch * 0.9);
            vec3 fruitC = mix(uVerm, uGround, 0.3 * (1.0 - smoothstep(0.05, 0.12, length(q - vec2(-0.07, -0.07)))) * smoothstep(12.0, 18.0, cellPx));
            col = mix(col, mix(mix(uGround, uVerm, 0.7), mix(uGround, fruitC, isFruit), crisp), mix(0.035, dotc * poles * touch, crisp));
            // the streak: one short hard ivory arc, upper left, frayed into dashes at its ends
            float sx = abs(vQ.x + 0.56 * sqrt(max(1.0 - vQ.y * vQ.y, 0.0)));
            float sw = max(0.035, 0.8 / max(vPx, 1.0));
            float env = smoothstep(-0.05, 0.2, vQ.y) * (1.0 - smoothstep(0.5, 0.74, vQ.y));
            float dash = 0.5 + 0.5 * sin(vQ.y * 38.0 + 1.6 * sin(uTime * 0.6 + seed * 0.157));
            float band = (1.0 - smoothstep(sw - 0.6 / max(vPx, 1.0), sw + 0.6 / max(vPx, 1.0), sx)) * smoothstep(dash - 0.04, dash + 0.04, env * 1.08) * step(0.001, env) * smoothstep(11.0, 16.0, vPx);
            col = mix(col, uGround, band);
            // the hairline
            float lw = clamp(1.7 / max(vPx, 1.0), 0.02, 0.5);
            col = mix(col, uInk, smoothstep(1.0 - lw, 1.0 - 0.5 * lw, r) * 0.95);
            gl_FragColor = vec4(col, 1.0);
          }`,
      }));
      m.frustumCulled = false; m.name = name; scene.add(m); return m;
    };
    const taken = [];                                              // [x, z, radius] of everything already standing
    const free = (x, z, rad) => { for (const t of taken) if (Math.hypot(t[0] - x, t[1] - z) < t[2] + rad) return false; return true; };
    const take = (x, z, rad) => taken.push([x, z, rad]);

    const updaters = [];
    // ---------------- what grew instead of buildings: four far towers, the horn in its mussel shell, the tube's forked thorn ----------------
    const crescent = (fb, tip, e1, e2, R, pig, flat = 0.45) => {     // horns up along e2, lying in the e1/e2 plane
      const rings = [], N = 16, cen = tip.clone().addScaledVector(e2, R);
      for (let i = 0; i <= N; i++) {
        const t = i / N, ph = (150 + 240 * t) * Math.PI / 180, w = Math.pow(Math.sin(Math.PI * t), 0.7), end = i === 0 || i === N;
        rings.push({ c: cen.clone().addScaledVector(e1, Math.cos(ph) * R).addScaledVector(e2, Math.sin(ph) * R), r: end ? 0 : R * 0.3 * w, rz: end ? 0 : R * 0.3 * w * flat });
      }
      fb.loft(rings, { segs: 8, pig, pat: PAT.plain, ref: e2 });
    };
    const thornRing = (fb, cen, R, n, len, rad, pig, lift = 0.25) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, o = new V3(Math.sin(a), 0, Math.cos(a));
        thorn(fb, cen.clone().addScaledVector(o, R), o.clone().setY(lift).normalize(), i % 2 ? len * 0.62 : len, rad, { bend: new V3(0, 1, 0), curl: 0.4, pig, rings: 5, segs: 5 });
      }
    };
    const pearlList = [];                                           // world pearls: x, y, z, r, tint rgb
    const pearl = (p, r, tint) => pearlList.push(p.x, p.y, p.z, r, tint.r, tint.g, tint.b);
    const archFB = new FormBuilder();
    const tower = (fb, x, z, H, pig, glass, k, lo = false) => {   // lo: a tower never seen from near, built with fewer facets
      const y0 = groundY(x, z) - 2, m = new THREE.Matrix4().makeTranslation(x, y0, z), s = H / 90, deepP = deepen(pig, 0.3);
      const R1 = 13 * s, R2 = 8.5 * s, y1 = 30 * s, y2 = 58 * s;
      // foot and first bulb (scaled), a collar with thorns, second bulb (dotted), neck, spire bulbs, crescent
      fb.lathe([[R1 * 0.95, 0], [R1 * 0.8, 4 * s], [R1 * 0.62, 9 * s], [R1 * 0.7, 13 * s], [R1, 20 * s], [R1 * 0.92, 27 * s], [R1 * 0.5, 33 * s], [R1 * 0.36, 36 * s]], { smooth: lo ? 2 : 3, segs: lo ? 14 : 22, pig, pat: PAT.scales, cells: 30, row: 2.4 * s, m });
      fb.lathe([[R1 * 0.36, 35.5 * s], [R1 * 0.62, 36.6 * s], [R1 * 0.66, 38 * s], [R1 * 0.45, 39.4 * s], [R1 * 0.3, 40 * s]], { smooth: lo ? 2 : 3, segs: lo ? 14 : 24, pig: deepP, pat: PAT.rings, cells: 1, row: 0.9, m });
      thornRing(fb, new V3(x, y0 + 37.6 * s, z), R1 * 0.64, lo ? 10 : 14, 7.5 * s, 0.75 * s, deepP);
      fb.lathe([[R1 * 0.3, 39.6 * s], [R2 * 0.7, 43 * s], [R2, 49 * s], [R2 * 0.86, 55 * s], [R2 * 0.36, 60 * s], [R2 * 0.26, 63 * s]], { smooth: lo ? 2 : 3, segs: lo ? 12 : 20, pig: k % 2 ? thin(pig, 0.2) : pig, pat: PAT.dots, cells: 18, row: 2.2 * s, m });
      fb.lathe([[R2 * 0.26, 62.6 * s], [R2 * 0.52, 63.6 * s], [R2 * 0.55, 64.8 * s], [R2 * 0.3, 66 * s]], { smooth: lo ? 2 : 3, segs: lo ? 12 : 20, pig: deepP, pat: PAT.rings, cells: 1, row: 0.8, m });
      thornRing(fb, new V3(x, y0 + 64.4 * s, z), R2 * 0.52, lo ? 6 : 10, 5.5 * s, 0.5 * s, deepP);
      fb.lathe([[R2 * 0.3, 65.6 * s], [R2 * 0.5, 69 * s], [R2 * 0.3, 73 * s], [R2 * 0.16, 74.5 * s], [R2 * 0.34, 77 * s], [R2 * 0.14, 80.5 * s], [R2 * 0.07, 84 * s], [0.02, 86 * s]], { smooth: lo ? 2 : 3, segs: lo ? 10 : 16, pig, pat: PAT.rings, cells: 1, row: 1.6 * s, m });
      crescent(fb, new V3(x, y0 + 85.4 * s, z), new V3(Math.cos(k * 1.3), 0, Math.sin(k * 1.3)), new V3(0, 1, 0), 3.4 * s, glass);
      const np = lo ? 14 : 22;
      for (let i = 0; i < np; i++) { const a = (i / np) * TAU; pearl(new V3(x + Math.sin(a) * R1 * 0.69, y0 + 36.4 * s, z + Math.cos(a) * R1 * 0.69), 0.75 * s, pig); }
      take(x, z, R1 + 12);
    };
    const towerSpots = [[-34, 800, 122, 0], [226, 574, 112, 1], [-390, 1105, 150, 1], [430, 1180, 140, 0], [-180, -40, 112, 0], [-520, 330, 104, 1]];   // (the last two stand behind the entry, on the slope we came down: the landmarks behind the fountain on the climb)   // six towers of 100 to 125 m (taller than the brief's 70 to 95 m: two of them must stand a tenth of the entry frame), none over 125: nothing overtops the 140 m fountain
    for (let k = 0; k < towerSpots.length; k++) { const [x, z, H, sl] = towerSpots[k]; tower(archFB, x, z, Math.min(125, H * (k < 4 ? 0.94 + 0.12 * rng() : 1)), sl ? glassPig : bodyPig, sl ? bodyPig : glassPig, k, k !== 1); await ctx.yield(); }
    await ctx.yield();

    // the horn: slate blue, 70 m, curling out of a mussel shell in the water, a crescent for the hoopoe
    const hornBase = new V3(36, 0, 533), hornDeep = deepen(glassPig, 0.3);
    const hornLean = (t) => 11 * Math.pow(clamp((t - 0.45) / 0.55, 0, 1), 2);   // its last half leans to starboard, so from the loop's apex the hoopoe stands clear of the globe and its window
    const hornSpine = (t) => new V3(hornBase.x + hornLean(t) + 11 * Math.sin(Math.PI * t) * Math.cos(2.2 * Math.PI * t + 0.6), 1 + 65 * t, hornBase.z + 11 * Math.sin(Math.PI * t) * Math.sin(2.2 * Math.PI * t + 0.6) - 2 * t);
    {
      const rings = [], N = 46;
      for (let i = 0; i <= N; i++) { const t = i / N, jq = ((t * 9) % 1) - 0.5; rings.push({ c: hornSpine(t), r: 6.4 * Math.pow(1 - t, 0.75) + 1.5 + 0.5 * Math.exp(-jq * jq * 50) + (i === 0 ? 1.2 : 0) }); }
      archFB.loft(rings, { segs: 16, pig: glassPig, pat: PAT.rings, cells: 1, row: 2.4 });
      const tip = hornSpine(1);
      archFB.lathe([[1.6, -1], [3.0, -0.2], [3.3, 0.8], [2.2, 1.7], [1.0, 2.2]], { smooth: 3, segs: 18, pig: hornDeep, pat: PAT.rings, cells: 1, row: 0.7, m: new THREE.Matrix4().makeTranslation(tip.x, tip.y, tip.z) });
      thornRing(archFB, tip.clone().setY(tip.y + 0.6), 3.0, 12, 4.4, 0.42, hornDeep, 0.1);
      for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * TAU; pearl(new V3(tip.x + Math.sin(a) * 3.5, tip.y + 0.2, tip.z + Math.cos(a) * 3.5), 0.42, glassPig); }
      crescent(archFB, tip.clone().setY(tip.y + 2), new V3(0.5, 0, 0.866), new V3(0, 1, 0), 5.2, glassPig, 0.5);
      for (const t of [0.22, 0.45, 0.68]) { const c = hornSpine(t); thornRing(archFB, c, 6.4 * Math.pow(1 - t, 0.75) + 1.6, 8, 4.5 * (1 - t * 0.5), 0.5, hornDeep, 0.5); }
    }
    const hoopoeSeat = hornSpine(1).setY(hornSpine(1).y + 4.6);
    // the forked thorn branches that hold the tube over the lake: one under its low end, a taller one under its far end
    {
      const foot = new V3(tA.x + 3, -1, tA.z + 16), fork = new V3(tA.x, tA.y - 11.5, tA.z + 11), dry = mixc(C.deep, C.ground, 0.25);
      const limb = (a, b, r0, r1, sg = 1) => { const rings = []; for (let i = 0; i <= 8; i++) { const t = i / 8; rings.push({ c: a.clone().lerp(b, t).add(new V3(Math.sin(t * Math.PI) * 1.6 * sg, -Math.sin(t * Math.PI) * 1.2 * Math.abs(sg), 0)), r: i === 8 ? 0 : lerp(r0, r1, t) }); } archFB.loft(rings, { segs: 8, pig: dry, pat: PAT.veins, cells: 5, row: 1 }); };
      limb(foot, fork, 1.5, 1.0, 0.6); limb(fork, new V3(tA.x - 13, tA.y + 0.5, tA.z + 9), 0.95, 0.3, -1); limb(fork, new V3(tA.x + 13, tA.y + 1.5, tA.z + 9), 0.95, 0.3, 1);
      for (let i = 0; i < 7; i++) { const t = 0.2 + i * 0.1, c = foot.clone().lerp(fork, t), a = i * 2.4; thorn(archFB, c, new V3(Math.cos(a), 0.4, Math.sin(a)).normalize(), 3.2, 0.3, { bend: new V3(0, 1, 0), curl: 0.3, pig: dry }); }
      const seatB = tB.clone().addScaledVector(tD, -10), foot2 = new V3(seatB.x - 4, -1, seatB.z - 9), fork2 = new V3(seatB.x, seatB.y - 12.5, seatB.z - 2);
      limb(foot2, fork2, 2.1, 1.15, -0.8); limb(fork2, new V3(seatB.x - 10.5, seatB.y - 3, seatB.z), 1.05, 0.3, -1); limb(fork2, new V3(seatB.x + 10.5, seatB.y - 4, seatB.z), 1.05, 0.3, 1);   // (the tube lies in the crotch: seen from inside, the arms stay below the view down the bore)
      for (let i = 0; i < 7; i++) { const t = 0.14 + i * 0.115, c = foot2.clone().lerp(fork2, t), a = 1 + i * 2.4; thorn(archFB, c, new V3(Math.cos(a), 0.4, Math.sin(a)).normalize(), 3.6, 0.34, { bend: new V3(0, 1, 0), curl: 0.3, pig: dry }); }
    }
    const archGeo = archFB.geometry(); addForm(archGeo, 'towers-horn');
    await ctx.yield();
    // ---------------- flora geometries (unit size; instances scale them) ----------------
    const Y = new V3(0, 1, 0);
    const ballProfile = (cy, r, n, squash = 1) => { const p = []; for (let i = 0; i <= n; i++) { const th = (i / n) * Math.PI; p.push([Math.max(0, r * Math.sin(th)), cy - r * squash * Math.cos(th)]); } return p; };
    // thistle, height 1: stalk, scaled bulb with a pink brush, spikes, three dry thorned branches
    const thistleG = (lo) => {
      const fb = new FormBuilder(), dry = mixc(C.deep, C.ground, 0.3), dryD = deepen(dry, 0.2);
      const sp = (t) => new V3(0.03 * Math.sin(t * 5), t * 0.84, 0.02 * Math.sin(t * 4 + 1));
      const st = []; for (let i = 0; i <= 8; i++) { const t = i / 8; st.push({ c: sp(t), r: 0.03 - 0.012 * t }); }
      fb.loft(st, { segs: lo ? 5 : 6, pig: dry, pat: PAT.veins, cells: 4, row: 1 });
      const top = sp(1), m = new THREE.Matrix4().makeTranslation(top.x, top.y - 0.02, top.z);
      fb.lathe([[0.02, 0], [0.085, 0.03], [0.105, 0.09], [0.07, 0.14], [0.05, 0.16]], { smooth: lo ? 1 : 2, segs: lo ? 8 : 10, pig: C.deep, pat: PAT.scales, cells: 9, row: 0.035, m });
      fb.lathe([[0.05, 0.155], [0.085, 0.19], [0.07, 0.215], [0, 0.225]], { smooth: lo ? 1 : 2, segs: lo ? 8 : 10, pig: thin(C.pink, 0.1), pat: PAT.veins, cells: 14, row: 1, m });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU, up = i % 2 ? 0.1 : 0.55, o = new V3(Math.sin(a), up, Math.cos(a)).normalize();
        thorn(fb, new V3(top.x + Math.sin(a) * 0.085, top.y + 0.05 + (i % 2) * 0.05, top.z + Math.cos(a) * 0.085), o, i % 2 ? 0.1 : 0.075, 0.012, { bend: Y, curl: 0.3, pig: dryD, rings: lo ? 3 : 4, segs: lo ? 3 : 4 });
      }
      for (let b = 0; b < 3; b++) {
        const t0 = 0.3 + b * 0.17, a = b * 2.3 + 0.5, base = sp(t0), dir = new V3(Math.sin(a), 0.75, Math.cos(a)).normalize(), L = 0.3 - b * 0.05, rings = [];
        for (let i = 0; i <= 5; i++) { const t = i / 5; rings.push({ c: base.clone().addScaledVector(dir, L * t).add(new V3(0, 0.06 * t * t, 0)), r: i === 5 ? 0 : 0.014 * (1 - 0.6 * t) }); }
        fb.loft(rings, { segs: lo ? 4 : 5, pig: dry, pat: PAT.plain });
        for (let k = 1; k <= 3; k++) { const c = rings[k + 1].c, a2 = a + k * 2.1; thorn(fb, c, new V3(Math.sin(a2), 0.5, Math.cos(a2)).normalize(), 0.07, 0.008, { bend: Y, curl: 0.3, pig: dryD, rings: lo ? 3 : 4, segs: lo ? 3 : 4 }); }
      }
      return fb.geometry();
    };
    const thistleGeo = thistleG(false), thistleFarGeo = thistleG(true);
    // toothed green cap: n flattened leaves from a point, radius R, with a short stalk
    const cap = (fb, top, n, R, droop, stalk = 0.1) => {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU, o = new V3(Math.sin(a), 0, Math.cos(a)), tang = new V3(Math.cos(a), 0, -Math.sin(a)), rings = [];
        for (let i = 0; i <= 4; i++) { const t = i / 4; rings.push({ c: top.clone().addScaledVector(o, R * t).add(new V3(0, 0.03 * R - droop * t * t, 0)), r: i === 4 ? 0 : R * 0.34 * Math.sin(Math.PI * (0.18 + 0.82 * t)) + 0.01, rz: i === 4 ? 0 : R * 0.07 }); }
        fb.loft(rings, { segs: 6, pig: k % 2 ? C.deep : deepen(C.deep, 0.15), pat: PAT.veins, cells: 2, row: 1, ref: tang });
      }
      if (stalk > 0) fb.loft([{ c: top.clone(), r: R * 0.12 }, { c: top.clone().add(new V3(0.02, stalk * 0.6, 0)), r: R * 0.08 }, { c: top.clone().add(new V3(0.06, stalk, 0)), r: R * 0.07 }], { segs: 5, pig: deepen(C.deep, 0.2), pat: PAT.plain });
    };
    // strawberry, 1 across: point down, ivory seed dots in ruled rows, a toothed green cap
    const strawberry = (fb, segs, smooth, capN = 7, cells = 22, row = 0.115) => {
      fb.lathe([[0, -0.56], [0.12, -0.5], [0.3, -0.3], [0.44, -0.05], [0.5, 0.18], [0.45, 0.36], [0.28, 0.47], [0.08, 0.5], [0, 0.5]], { smooth, segs, pig: C.verm, pat: PAT.pits, cells, row });
      cap(fb, new V3(0, 0.49, 0), capN, 0.36, 0.14);
    };
    const strawGeo = (() => { const fb = new FormBuilder(); strawberry(fb, 16, 2); return fb.geometry(); })();
    const strawFarGeo = (() => { const fb = new FormBuilder(); strawberry(fb, 11, 1, 5); return fb.geometry(); })();
    // a pair of cherries, 1 = one cherry across: two globes on arching stalks that meet above
    const cherryG = (rows, segs, sr) => {
      const fb = new FormBuilder(), knot = new V3(0, 2.3, 0), dry = mixc(C.deep, C.ground, 0.2);
      for (const sx of [-1, 1]) {
        const cen = new V3(sx * 0.62, 0.5, 0.1 * sx);
        fb.lathe(ballProfile(0, 0.5, rows), { segs, pig: sx < 0 ? C.verm : deepen(C.verm, 0.12), pat: PAT.plain, m: new THREE.Matrix4().makeTranslation(cen.x, cen.y, cen.z) });
        const rings = []; for (let i = 0; i <= sr; i++) { const t = i / sr; rings.push({ c: new V3(cen.x * (1 - t * t) + 0.5 * sx * Math.sin(Math.PI * t), 0.95 + (knot.y - 0.95) * Math.sin(t * Math.PI / 2), cen.z * (1 - t)), r: 0.035 }); }
        fb.loft(rings, { segs: sr > 6 ? 5 : 4, pig: dry, pat: PAT.plain });
      }
      fb.lathe([[0.03, 0], [0.09, 0.06], [0.05, 0.14], [0, 0.16]], { segs: 6, pig: dry, pat: PAT.plain, m: new THREE.Matrix4().makeTranslation(0, 2.26, 0) });
      return fb.geometry();
    };
    const cherryGeo = cherryG(8, 12, 8), cherryFarGeo = cherryG(6, 9, 5);
    // blackberry, 1 across: pink under slate glaze, a light on every drupelet
    const blackG = (segs, smooth) => {
      const fb = new FormBuilder();
      fb.lathe([[0, -0.5], [0.2, -0.46], [0.4, -0.25], [0.47, 0.05], [0.4, 0.33], [0.2, 0.47], [0, 0.5]], { smooth, segs, pig: deepen(mixc(C.pink, C.slate, 0.62), 0.3), pat: PAT.dots, cells: 9, row: 0.15 });
      cap(fb, new V3(0, 0.49, 0), 5, 0.3, 0.1, 0.16);
      return fb.geometry();
    };
    const blackGeo = blackG(14, 2), blackFarGeo = blackG(10, 1);
    // mussel shell, 1 long, standing open: blue-black outside, ivory inside
    const shellGeo = (() => {
      const fb = new FormBuilder(), outC = mixc(C.ink, C.slate, 0.3), inC = thin(C.ground, 0);
      for (const sg of [-1, 1]) {
        const rings = [], N = 12, lean = 0.34 * sg;
        for (let i = 0; i <= N; i++) { const t = i / N, w = Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t * 0.94)), 0.6) * (0.36 - 0.1 * t); rings.push({ c: new V3(Math.sin(lean) * t + 0.02 * sg, Math.cos(lean) * t, 0.1 * t * t), r: i === N ? 0 : w, rz: i === N ? 0 : 0.035 + 0.05 * Math.sin(Math.PI * t) }); }
        fb.loft(rings, { segs: 12, pig: outC, pat: PAT.rings, cells: 1, row: 0.07, ref: new V3(0, 0, 1), paint: (t, turn) => (Math.sin(turn * TAU) * sg < -0.05 ? inC : null) });
      }
      return fb.geometry();
    })();
    await ctx.yield();
    // ---------------- placement: perches first, then fruit and shells, thistles, thickets, the orchard files ----------------
    take(hornBase.x, hornBase.z, 17); take(TA0.x + 2, TA0.z + 13, 9);
    const lists = { straw: [], strawF: [], cherry: [], cherryF: [], black: [], blackF: [], shell: [], thistleF: [], thistle: [], bush: [], treeF: [], bird: [[], [], [], []] };
    const floaters = [], contacts = [], perches = {};               // floaters: { list, i, it, R, tint, h }; contacts: [x, z, r]
    const fruitKinds = {
      straw: { size: [10.5, 13.5], rest: 0.4, top: 0.5, tint: C.verm, tilt: 1.0, berry: 1 },
      strawF: { size: [10.5, 13.5], rest: 0.4, top: 0.5, tint: C.verm, tilt: 1.0, berry: 1 },
      cherry: { size: [5.4, 6.6], rest: 0, top: 2.35, tint: C.verm, tilt: 0.12, wide: 1.2, flatTilt: 1 },
      black: { size: [8, 10], rest: 0.44, top: 0.5, tint: deepen(mixc(C.pink, C.slate, 0.62), 0.3), tilt: 0.7 },
      shell: { size: [12.5, 15.5], rest: -0.03, top: 0.93, tint: mixc(C.ink, C.slate, 0.3), tilt: 0.1 },
    };
    fruitKinds.cherryF = fruitKinds.cherry; fruitKinds.blackF = fruitKinds.black;
    const putFruit = (kind, x, z, opt = {}) => {
      const K = fruitKinds[kind], s = opt.s ?? rng.range(K.size[0], K.size[1]), r = Math.hypot(x - AX, z - AZ), wet = r < 168;
      const tilt = opt.tilt ?? (K.tilt * rng.range(0.5, 1)), ry = opt.ry ?? rng.range(0, TAU);
      const gy = wet ? 0 : groundY(x, z), y = gy + (wet ? (kind === 'cherry' ? -0.18 : kind === 'shell' ? -0.06 : 0.16) * s : K.rest * s * (K.berry ? Math.cos(tilt * 0.6) : 1));
      const it = { p: new V3(x, y, z), s, ry, rx: K.flatTilt || kind === 'shell' ? tilt * 0.5 : tilt, rz: 0 };
      const rad = s * (K.wide ?? 0.5);
      lists[kind].push(it); take(x, z, rad + (opt.gap ?? 5));
      if (wet) floaters.push({ kind, i: lists[kind].length - 1, it, R: rad, tint: K.tint, h: s * (kind === 'cherry' ? 2.3 : 1), ph: rng.range(0, TAU) });
      else contacts.push([x, z, rad * 0.8]);
      return { x, z, top: y + K.top * s * (K.berry ? Math.cos(tilt * 0.7) : 1), s, it };
    };
    // the finch's strawberry: 6 m to port of the path at u 0.305, afloat (drawn on its own, at full detail)
    const U_BERRY = 0.326, vBerry = pw(U_BERRY, KO, KN) + 0.25 * DL / L0, berryP = path0.pointAt(vBerry), berryT = path0.tangentAt(vBerry), berryLeft = new V3().crossVectors(Y, berryT).normalize();
    const berryS = 12.5, berryC = berryP.clone().addScaledVector(berryLeft, 6 + berryS * 0.5).setY(0.2 * berryS);
    { const p0 = path0.pointAt(pw(U_BERRY, KO, KN)), t0 = path0.tangentAt(pw(U_BERRY, KO, KN)), c0 = p0.addScaledVector(new V3().crossVectors(Y, t0).normalize(), 6 + berryS * 0.5); take(c0.x, c0.z, berryS * 0.5 + 8); }   // (its place as first planted: see path0)
    // perches for the standing birds
    perches.robin = putFruit('black', 47, 203, { s: 9.5, tilt: 0.3 });
    perches.kingfisher = putFruit('shell', -76, 246, { s: 15, ry: 0.9 });
    perches.jay = putFruit('straw', 140, 489, { s: 13, tilt: 0.7 });                 // the north-east shore group of the low pass (u 0.79)
    perches.woodpecker = putFruit('cherry', -112, 528, { s: 6.4 });
    perches.far1 = putFruit('shell', 146, 448, { s: 15.5, ry: 2.2 });
    putFruit('cherry', 126, 464, { s: 6.4, ry: 0.6 });
    perches.far2 = putFruit('shell', -168, 148, { s: 15.5 });
    perches.far3 = putFruit('black', -236, 652, { s: 10 });
    perches.far4 = putFruit('straw', 188, 612, { s: 13.5, tilt: 0.6 });                // beside the blue tower the dive flies at
    putFruit('shell', 264, 522, { s: 15, ry: 5.2 }); putFruit('cherry', 207, 549, { s: 6.4, ry: 2.6 });
    perches.far5 = putFruit('straw', -62, 664, { s: 14, tilt: 0.7 });               // two giant fruit with a bird on each, up-slope of the horn:
    perches.far6 = putFruit('black', 58, 690, { s: 11, tilt: 0.3 });                // what the far mouth of the tube opens on
    putFruit('shell', hornBase.x, hornBase.z, { s: 30, ry: 0.4, tilt: 0 });          // the horn's own mussel
    putFruit('cherry', -43, 232, { s: 6.2, ry: 1.9 });                                // cherries arching by the lake path
    take(60, 300, 14);                                                                // the mallard's water
    const nPerched = floaters.length;                                                 // (the fruit placed by hand above stays where it is)
    {
      const want = { straw: 15, cherry: 12, black: 10, shell: 7 };
      for (const kind of ['straw', 'cherry', 'black', 'shell']) {
        const n = Math.round(want[kind] * Math.min(density, 1.08)), K = fruitKinds[kind];
        for (let i = 0; i < n; i++) for (let tries = 0; tries < 40; tries++) {
          const zone = rng(), a = rng.range(0, TAU);
          const r = zone < 0.36 ? rng.range(72, 156) : zone < 0.64 ? rng.range(184, 240) : rng.range(282, 560);
          const x = AX + Math.sin(a) * r, z = AZ + Math.cos(a) * r, rad = K.size[1] * (K.wide ?? 0.5);
          if (!free(x, z, rad + 9)) continue;
          const y = r < 168 ? 2 : groundY(x, z) + 5;
          if (!path0.isClear(x, y, z, rad + (kind === 'cherry' ? 6 : 2), 9)) continue;
          putFruit(r < 168 || kind === 'shell' ? kind : kind + 'F', x, z); break;
        }
      }
    }
    // (outside review, round 5) the fruit was scattered against the first route, so the garden is the one it always was; whatever
    // now floats in the way of the moved tube, its forks or the swing out to its mouth is set down where the tube used to lie
    {
      const segD = (x, z, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - a.x - dx * t, z - a.z - dz * t); };
      const tLow = tA.clone().addScaledVector(tD, -4), tMid = tA.clone().addScaledVector(tD, TL * 0.6), tFar = tB.clone().addScaledVector(tD, -19);
      const inWay = (x, z, rad, cherry) => !path.isClear(x, 2, z, rad + (cherry ? 6 : 2), 9) || segD(x, z, tLow, tMid) < rad + 16 || segD(x, z, tFar, tB) < rad + 8;
      const ok = (f, x, z) => {
        const r = Math.hypot(x - AX, z - AZ);
        if (r < 58 + f.R || r > 158 - f.R || inWay(x, z, f.R, f.kind === 'cherry')) return false;
        if (Math.hypot(x - berryC.x, z - berryC.z) < f.R + berryS * 0.5 + 8 || Math.hypot(x - 60, z - 300) < f.R + 14) return false;
        for (const g of floaters) if (g !== f && Math.hypot(x - g.it.p.x, z - g.it.p.z) < f.R + g.R + 5) return false;
        return true;
      };
      for (let fi = nPerched; fi < floaters.length; fi++) {
        const f = floaters[fi], q = f.it.p; if (!inWay(q.x, q.z, f.R, f.kind === 'cherry')) continue;
        let done = false;                                             // across to the old line first, then its mirror east of the fountain, then further out
        for (const dz of [0, -11, 11, -22, 22, -33, 33, -44, 44]) {
          for (const x of [TA0.x, -q.x, q.x - 36, TA0.x + 14, TA0.x - 14, -q.x + 14, -q.x - 14]) {
            const z = clamp(q.z + dz, 240, 520);
            if (!done && ok(f, x, z)) { q.x = x; q.z = z; done = true; }
          }
          if (done) break;
        }
        if (!done) { f.it.s = 1e-3; f.R = 0.01; }                     // (never met: nowhere to set it down, so it is not there)
      }
    }
    await ctx.yield();
    // the ranked population between the big things: fruit (every third with a bird on it), open mussels, cherries and thistles
    // spaced evenly over lawns one and two, each whole and separate with lawn between
    const birdSpots = [];
    {
      const cycle = ['strawF', 'shell', 'cherryF', 'thistle', 'blackF', 'strawF', 'cherryF', 'blackF'];
      let ci = 0, bi = 0;
      take(20, 50, 16);                                                 // the finch's thistle will stand here
      for (const [r0, n0, jr] of [[212, 9, 14], [304, 11, 20], [372, 12, 22], [446, 13, 22], [528, 13, 24], [612, 13, 24]]) {
        const n = Math.max(4, Math.round(n0 * clamp(density, 0.85, 1.1)));
        for (let i = 0; i < n; i++) for (let tries = 0; tries < 6; tries++) {
          const a = (i + 0.2 + 0.6 * rng()) / n * TAU + r0 * 0.013, r = r0 + rng.range(-jr, jr), x = AX + Math.sin(a) * r, z = AZ + Math.cos(a) * r;
          let kind = cycle[ci % cycle.length]; if (kind === 'thistle' && r < 275) kind = 'black';
          const rad = kind === 'thistle' ? 6 : fruitKinds[kind].size[1] * (fruitKinds[kind].wide ?? 0.5);
          if (!free(x, z, rad + 7) || !path0.isClear(x, groundY(x, z) + 6, z, rad + 7, 10)) continue;
          if (kind === 'thistle') { const s = rng.range(16, 24); lists.thistleF.push({ p: new V3(x, groundY(x, z) - 0.4, z), s, ry: rng.range(0, TAU) }); take(x, z, 7); contacts.push([x, z, 2.2]); }
          else {
            const pc = putFruit(kind, x, z, kind === 'strawF' ? { tilt: rng.range(0.5, 0.9) } : {});
            if (kind !== 'cherryF' && (bi++ % 4) === 1) birdSpots.push(pc);
          }
          ci++; break;
        }
      }
    }
    await ctx.yield();
    // thistles on lawn two: the finch's own at the entry, the rest scattered down the slope we dive along
    const finchThistle = { p: new V3(20, groundY(20, 50) - 0.5, 50), s: 32, ry: 0.7 };
    lists.thistle.push(finchThistle); take(20, 50, 7); contacts.push([20, 50, 2.8]);
    for (let i = 0; i < Math.round(9 * Math.min(density, 1.08)); i++) for (let tries = 0; tries < 30; tries++) {
      const a = rng.range(0, TAU), r = rng.range(285, 640), x = AX + Math.sin(a) * r, z = AZ + Math.cos(a) * r, s = rng.range(16, 24);
      if (!free(x, z, 9) || path0.nearestXZ(x, z).dist < 22) continue;
      lists.thistleF.push({ p: new V3(x, groundY(x, z) - 0.4, z), s, ry: rng.range(0, TAU) }); take(x, z, 6); contacts.push([x, z, 2.2]); break;
    }
    await ctx.yield();
    // the two thicket banks: one row of dark balls on each crest, with a notch where we dive through
    for (const [rb, sz, y0] of [[258.5, 10, 0], [252, 6.5, 0], [708, 17, 0]]) {
      const n = Math.floor(TAU * rb / (sz * 1.55));
      for (let i = 0; i < n; i++) {
        const a = (i + 0.5 * rng()) / n * TAU, x = AX + Math.sin(a) * rb, z = AZ + Math.cos(a) * rb, s = sz * rng.range(0.82, 1.2);
        if (path0.nearestXZ(x, z).dist < 15 && rb < 300) continue;
        lists.bush.push({ p: new V3(x, groundY(x, z) + y0 - s * 0.15, z), s, ry: rng.range(0, TAU) });
      }
    }
    // the orchard: ruled FILES of ball trees on all three lawns, every file a straight line that converges on the fountain
    {
      const thinT = 0.55 + 0.45 * detail;
      const files = async (r0, r1, dr, nF, off, every = 1) => {
        for (let f = 0, k = 0; f < nF; f += every, k++) {
          if (k % 6 === 5) await ctx.yield();
          const a = (f + off) / nF * TAU, sa = Math.sin(a), ca = Math.cos(a);
          for (let r = r0, j = 0; r <= r1; r += dr, j++) {
            const hh = hash(f * 13.7 + j * 3.3 + r0);
            if (thinT < 1 && hash(f * 3.1 + j * 17.9) > thinT) continue;
            const rr = r + (hh - 0.5) * 2.4, x = AX + sa * rr, z = AZ + ca * rr, s = 9 + 4 * hh;
            const near = path0.nearestXZ(x, z);
            if (near.dist < 10.5 || !free(x, z, 4.2) || inPond(x, z, 7)) continue;
            lists.treeF.push({ p: new V3(x, groundY(x, z) - 0.2, z), s });
            if (near.dist < 130) contacts.push([x, z, s * 0.17]);
          }
        }
      };
      await ctx.yield();
      await files(187, 245, 19, 72, 0.5);
      await files(282, 692, 20.5, 72, 0.5);
      await files(474, 692, 20.5, 144, 0.5, 2);              // the files double where they have spread apart
      await files(742, 1335, 40, 144, 0.5);
      await ctx.yield();
      // the trees that stand 8 m to either side where we skim the first lawn
      for (const [x, z] of [[10.5, 187], [-12, 190], [9.5, 203], [-16.5, 207]]) { lists.treeF.push({ p: new V3(x, groundY(x, z) - 0.2, z), s: 11.5 }); contacts.push([x, z, 1.9]); }
    }
    await ctx.yield();
    const fruitMeshes = {
      straw: instanced(strawGeo, lists.straw, 'strawberries', true, glazeFruit), strawF: instanced(strawFarGeo, lists.strawF, 'lawn-strawberries', true, glazeFruit), cherryF: instanced(cherryFarGeo, lists.cherryF, 'lawn-cherries', true, glazeFruit), blackF: instanced(blackFarGeo, lists.blackF, 'lawn-blackberries', true, glazeFruit), cherry: instanced(cherryGeo, lists.cherry, 'cherries', true, glazeFruit),
      black: instanced(blackGeo, lists.black, 'blackberries', true, glazeFruit), shell: instanced(shellGeo, lists.shell, 'mussels'),
    };
    instanced(thistleGeo, lists.thistle, 'thistles', true, glazeDark); instanced(thistleFarGeo, lists.thistleF, 'lawn-thistles', true, glazeDark);
    ballMesh(lists.treeF, lists.bush, 'orchard-and-thicket');
    await ctx.yield();
    // floating fruit bobs (a handful of matrices a frame)
    updaters.push((dt, time) => {
      for (const f of floaters) {
        if (!f.kind) continue;
        const it = f.it, bob = Math.sin(time * 0.7 + f.ph);
        _e.set(it.rx + 0.03 * Math.sin(time * 0.5 + f.ph * 2), it.ry + 0.05 * Math.sin(time * 0.23 + f.ph), 0.035 * bob, 'YXZ'); _q.setFromEuler(_e);
        _m4.compose(_p.set(it.p.x, it.p.y + 0.028 * it.s * bob, it.p.z), _q, _s.setScalar(it.s));
        for (const m of fruitMeshes[f.kind]) m.setMatrixAt(f.i, _m4);
      }
      for (const k in fruitMeshes) for (const m of fruitMeshes[k]) m.instanceMatrix.needsUpdate = true;
    });
    // ---------------- birds: exact, placid, outlined; lofts that bend at neck, wing, tail and crest in the vertex shader ----------------
    const BONE_DECL = /* glsl */`
      attribute vec2 aBone; uniform vec4 uRot[6]; uniform vec3 uPiv[6];
      vec3 rodr(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }
      void main() {
        int bi = int(aBone.x + 0.5); vec4 R = uRot[bi]; vec3 pv = uPiv[bi]; float ang = R.w * aBone.y;
        vec3 bpos = pv + rodr(position - pv, R.xyz, ang); vec3 bnor = rodr(normal, R.xyz, ang);`;
    const boneVert = (src) => src.replace('void main() {', BONE_DECL).split('vec4(position, 1.0)').join('vec4(bpos, 1.0)').split('* normal').join('* bnor');
    const BIRD_GLAZE_VERT = boneVert(GLAZE_VERT), BIRD_HULL_VERT = boneVert(HULL_VERT);
    const cr4 = (p, t) => {                                          // Catmull-Rom through rows [x, y, z, r], t in 0..1
      const n = p.length - 1, f = Math.min(n - 1e-6, Math.max(0, t * n)), i = Math.floor(f), u = f - i, out = [];
      const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(n, i + 2)];
      for (let k = 0; k < 4; k++) out.push(0.5 * (2 * b[k] + (-a[k] + c[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u * u + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * u * u * u));
      return out;
    };
    const flat = (fb, a, b, w, thick, n, o) => {                     // a flattened feather-shaped loft from a to b
      const ts = o.ts ?? Array.from({ length: n + 1 }, (_, i) => i / n), last = ts.length - 1;
      const rings = ts.map((t, i) => { const e = Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + 0.9 * t)), 0.7); return { c: a.clone().lerp(b, t).add(new V3(0, (o.arch || 0) * Math.sin(Math.PI * t), 0)), r: i === last ? 0 : w * e, rz: i === last ? 0 : thick * e + 0.004 }; });
      fb.loft(rings, o.ts && o.paint ? { ...o, paint: (t, turn, i) => o.paint(ts[i]) } : o);
    };
    // sp: { q detail, plump, headR, beak [len, radius, droop], tail len, crest bool, col { breast, back, cap, mask, cheek, wing, bar, tail, beak, leg, belly } }
    const barTs = (n) => { const ts = [0]; for (let k = 0; k < n; k++) { if (k > 0) ts.push(k / n + 0.004); ts.push(k / n + 0.5 / n); if (k < n - 1) ts.push((k + 1) / n - 0.004); } ts.push(1); return ts; };
    const makeBird = (sp, name, geoOnly = false) => {
      const fb = new FormBuilder(); fb.useBones = true;
      const FOOT = sp.legs === false ? 0 : 0.2 - (sp.legLen ?? 0.08);       // feet height in the unit bird; the meshes are lowered by it
      const q = sp.q ?? 1, c = sp.col, pl = sp.plump ?? 1, hr = sp.headR ?? 0.1, segB = Math.round(16 * q), ink = C.ink;
      // body: up and forward from the vent to the neck; breast in front, back behind, feather scallops in ruled rows
      const spine = [[0, 0.3, -0.25, 0.02], [0, 0.36, -0.17, 0.115 * pl], [0, 0.46, -0.05, 0.19 * pl], [0, 0.58, 0.06, 0.182 * pl], [0, 0.7, 0.13, 0.125 * pl], [0, 0.79, 0.165, 0.08 + 0.3 * (hr - 0.1)]];
      const rings = [], nb = Math.round(13 * q);
      for (let i = 0; i <= nb; i++) { const v = cr4(spine, i / nb); rings.push({ c: new V3(v[0], v[1], v[2]), r: Math.max(0.012, v[3]) }); }
      fb.loft(rings, { segs: segB, pig: c.back, pat: PAT.scallops + 0.25, cells: 40, row: 0.0145, paint: (t, turn) => (Math.abs(turn - 0.5) < 0.2 ? (t < 0.3 && c.belly ? c.belly : c.breast) : Math.abs(turn - 0.5) < 0.27 && c.flank ? c.flank : sp.backPaint ? sp.backPaint(t) : null) });
      // head: a ball along the line of the beak; cap above, mask in front, cheek at the side
      const H = new V3(0, 0.845 + (hr - 0.1) * 0.6, 0.2), f = new V3(0, -0.12, 1).normalize(), hrings = [], nh = Math.round(9 * q);
      for (let i = 0; i <= nh; i++) { const th = (i / nh) * Math.PI; hrings.push({ c: H.clone().addScaledVector(f, -Math.cos(th) * hr * 1.06), r: Math.max(0, Math.sin(th)) * hr, t: f }); }
      const dors = (turn) => Math.min(turn, 1 - turn);
      fb.loft(hrings, { segs: Math.round(14 * q), pig: c.cheek, pat: sp.headPat ?? PAT.plain, cells: sp.headCells ?? 12, row: sp.headRow ?? 0.02, ref: Y, bone: 1,
        paint: (t, turn) => (sp.headPat === PAT.head || sp.headBars ? null : c.mask && t > (sp.maskAt ?? 0.62) ? c.mask : dors(turn) < (sp.capW ?? 0.21) ? c.cap : c.stripe && Math.abs(dors(turn) - 0.3) < 0.035 && t > 0.3 ? c.stripe : c.throat && dors(turn) > 0.4 ? c.throat : null) });
      const [bl, br, bd] = sp.beak ?? [0.09, 0.036, 0.01], bb = H.clone().addScaledVector(f, hr * 0.94);
      const brings = []; for (let i = 0; i <= 5; i++) { const t = i / 5; brings.push({ c: bb.clone().addScaledVector(f, bl * t).add(new V3(0, -bd * t * t, 0)), r: i === 5 ? 0 : br * (1 - t * 0.85) }); }
      fb.loft(brings, { segs: 8, pig: c.beak, pat: PAT.veins, cells: 2, row: 1, ref: sp.headPat === PAT.head ? Y : new V3(1, 0, 0), bone: 1 });   // the dark gape line down each side
      if (sp.gape) for (const sx of [-1, 1]) {                       // the gape: one dark hairline down each side of the beak, tip to face
        const gr = brings.map((b, i) => ({ c: b.c.clone().add(new V3(sx * b.r * 0.99, -0.16 * b.r, 0)), r: i === 5 ? 0 : 0.0009 }));
        gr.unshift({ c: gr[0].c.clone().addScaledVector(f, -hr * 0.1).add(new V3(sx * br * 0.1, -br * 0.1, 0)), r: 0.0009 });
        fb.loft(gr, { segs: 4, pig: ink, pat: PAT.plain, bone: 1 });
      }
      for (const sx of [-1, 1]) {                                    // the eye: one dark bead in a pale ring
        if (sp.eyes === false) continue;                             // the owl is only ever seen from behind
        const ea = sp.eyeAt ?? 0.42, e = H.clone().addScaledVector(f, hr * ea).add(new V3(sx * hr * Math.sqrt(Math.max(0.1, 0.92 - ea * ea)), hr * 0.2, 0));
        const en = e.clone().sub(H).normalize(), eq = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, sp.eyeAt ? en : new V3(sx, 0, 0)));
        const eo = sp.eyeAt ? en : new V3(sx, 0, 0), e2 = e.clone().addScaledVector(eo, hr * 0.1);
        fb.lathe(ballProfile(0, hr * (sp.eyeRingR ?? 0.19), q < 0.7 ? 3 : 4, 0.5), { segs: q < 0.7 ? 6 : 8, pig: c.eyeRing ?? C.ground, pat: PAT.plain, m: new THREE.Matrix4().makeTranslation(e.x, e.y, e.z).multiply(eq), bone: 1 });
        fb.lathe(ballProfile(0, hr * 0.115, q < 0.7 ? 3 : 4, 0.5), { segs: q < 0.7 ? 6 : 8, pig: ink, pat: PAT.plain, m: new THREE.Matrix4().makeTranslation(e2.x, e2.y, e2.z).multiply(eq), bone: 1 });
      }
      // wings folded along the flank (they open about the shoulder), with a bar; tail; legs and toes
      const shoulders = [];
      for (const sx of [-1, 1]) {
        const S = new V3(sx * 0.155 * pl, 0.655, 0.07), tip = new V3(sx * 0.09 * pl, 0.3, -0.36 - (sp.wingLong ?? 0));
        shoulders.push([S, tip]);
        flat(fb, S, tip, 0.105, 0.024, Math.round(9 * q), { segs: 8, pig: c.wing, pat: PAT.scallops + 0.45, cells: 6, row: 0.06, ref: new V3(0, 0.6, 0.8), bone: sx < 0 ? 2 : 3, ts: sp.wingBars ? barTs(sp.wingBars) : undefined,
          paint: sp.wingPaint ?? ((t) => (c.bar && t > 0.4 && t < 0.52 ? c.bar : t > 0.9 && c.bar ? c.bar : null)) });
      }
      const tl = sp.tail ?? 0.3, tr = new V3(0, 0.335, -0.2), tt = new V3(0, 0.335 - tl * 0.5, -0.2 - tl * 0.87);
      flat(fb, tr, tt, 0.06 + 0.04 * tl, 0.018, 7, { segs: 8, pig: c.tail, pat: PAT.veins, cells: 4, row: 1, ref: new V3(1, 0, 0), bone: 4, ts: sp.tailBars ? barTs(sp.tailBars) : undefined, paint: sp.tailPaint ?? ((t) => (t > 0.86 && c.bar ? c.bar : null)) });
      if (sp.legs !== false) for (const sx of [-1, 1]) {
        const hip = new V3(sx * 0.065, 0.36, -0.03), foot = new V3(sx * 0.07, FOOT + 0.012, 0.0);
        const knee = hip.clone().lerp(foot, 0.42).add(new V3(0, 0, -0.022));   // thin, dark and jointed: a feathered thigh, a knee set back, a bare shank
        fb.loft([{ c: hip, r: 0.027 }, { c: hip.clone().lerp(knee, 0.6), r: 0.017 }, { c: knee.clone().add(new V3(0, 0.012, 0)), r: 0.0095 }, { c: knee, r: 0.0125 }, { c: knee.clone().add(new V3(0, -0.012, 0.002)), r: 0.0085 }, { c: foot.clone().setY(FOOT + 0.03), r: 0.008 }, { c: foot, r: 0.012 }], { segs: 6, pig: c.leg, pat: PAT.rings, cells: 1, row: 0.012 });
        for (const [dx, dz] of [[-0.5, 0.8], [0, 1], [0.5, 0.8], [0, -1]]) thorn(fb, foot.clone(), new V3(dx, 0.02, dz).normalize(), dz < 0 ? 0.05 : 0.085, 0.0085, { bend: new V3(0, -1, 0), curl: 0.25, pig: c.leg, rings: q < 0.7 ? 3 : 4, segs: q < 0.7 ? 3 : 4 });
      }
      const crown = H.clone().add(new V3(0, hr * 0.85, -hr * 0.1));
      if (sp.crest) for (let k = 0; k < 9; k++) {                    // the hoopoe's fan: nine barred feathers, opened by joint 5
        const w = k / 8, a = -1.0 + 0.5 * w, dir = new V3(0, Math.cos(a), Math.sin(a));
        flat(fb, crown.clone().add(new V3(0, -0.01, 0)), crown.clone().addScaledVector(dir, 0.3 + 0.05 * Math.sin(Math.PI * w)), 0.042, 0.006, 5, { segs: 6, pig: c.breast, pat: PAT.plain, ref: new V3(1, 0, 0), bone: 5, boneW: () => w, paint: (t) => (t > 0.8 ? ink : t > 0.66 ? C.ground : null) });
      }
      const geo = fb.geometry(); geo.boundingSphere = new THREE.Sphere(new V3(0, 0.5, 0), 1.3);
      if (geoOnly) return { geo, foot: FOOT };
      const rot = [], piv = [new V3(), new V3(0, 0.74, 0.14), shoulders[0][0], shoulders[1][0], tr, crown];
      for (let i = 0; i < 6; i++) rot.push(new THREE.Vector4(1, 0, 0, 0));
      const bu = { uRot: { value: rot }, uPiv: { value: piv } };
      const g = new THREE.Group(); g.name = name;
      const glaze = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...U, ...bu, uBackDark: { value: 0.14 }, uPale: { value: 0.5 } }, vertexShader: BIRD_GLAZE_VERT, fragmentShader: GLAZE_FRAG, side: THREE.DoubleSide }));
      const hm = hullMaterial(U), hull = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...hm.uniforms, ...bu }, vertexShader: BIRD_HULL_VERT, fragmentShader: HULL_FRAG, side: THREE.BackSide }));
      hm.dispose(); glaze.frustumCulled = hull.frustumCulled = false; glaze.position.y = hull.position.y = -FOOT; g.add(glaze, hull); scene.add(g);
      const wingDir = shoulders.map(([S, tip]) => tip.clone().sub(S).normalize());
      const bird = { group: g, rot, wingDir, sp, foot: FOOT, ph: rng.range(0, TAU),
        // joint i turned by angle a about axis (x, y, z)
        set(i, x, y, z, a) { rot[i].set(x, y, z, a); },
        setQ(i, quat) { const s = Math.sqrt(Math.max(1e-9, 1 - quat.w * quat.w)); rot[i].set(quat.x / s, quat.y / s, quat.z / s, 2 * Math.acos(clamp(quat.w, -1, 1))); } };
      return bird;
    };
    // ---------------- the cast: twelve giant birds ----------------
    const pinkT = thin(C.pink, 0.35), dryG = mixc(C.deep, C.ground, 0.35), inkS = mixc(C.ink, C.slate, 0.25), legC = mixc(C.ink, C.pink, 0.3);
    const bars = (a, b, n) => (t) => (Math.floor(t * n) % 2 ? a : b);
    const SPECIES = {
      finch: { q: 1.5, col: { breast: pinkT, belly: C.ground, back: deepen(C.pink, 0.28), cap: C.ink, mask: C.verm, cheek: C.ground, wing: C.ink, bar: C.ground, tail: C.ink, beak: thin(C.pink, 0.6), leg: legC }, headPat: PAT.head, headCells: 26, headRow: 0.019, eyeAt: 0.68, eyeRingR: 0.165, gape: true },
      hoopoe: { q: 1.5, crest: true, legLen: 0.1, beak: [0.2, 0.022, 0.05], tail: 0.34, col: { breast: thin(C.pink, 0.12), back: thin(C.pink, 0.12), cap: thin(C.pink, 0.05), cheek: thin(C.pink, 0.2), wing: C.ink, tail: C.ink, beak: C.ink, leg: inkS }, wingPaint: bars(C.ground, C.ink, 9), tailPaint: bars(C.ink, C.ground, 5), wingBars: 9, tailBars: 5 },
      owl: { q: 1.3, plump: 1.22, headR: 0.2, headBars: true, headCells: 10, eyes: false, beak: [0.03, 0.02, 0.01], tail: 0.16, headPat: PAT.rings, col: { breast: C.ground, back: thin(inkS, 0.45), cap: thin(inkS, 0.45), cheek: C.ground, wing: thin(inkS, 0.3), tail: inkS, beak: C.ink, leg: C.ground }, wingPaint: bars(C.ground, inkS, 8), tailPaint: bars(inkS, C.ground, 4), wingBars: 8, tailBars: 4, capW: 0.3 },
      kingfisher: { beak: [0.2, 0.034, 0], tail: 0.16, headR: 0.115, col: { breast: C.pink, back: C.slate, cap: deepen(C.slate, 0.25), cheek: C.pink, throat: C.ground, wing: deepen(C.slate, 0.2), bar: thin(C.slate, 0.5), tail: deepen(C.slate, 0.3), beak: C.ink, leg: C.verm } },
      mallard: { legs: false, plump: 1.15, beak: [0.12, 0.045, 0.012], tail: 0.14, col: { breast: deepen(C.pink, 0.3), belly: thin(C.slate, 0.6), back: thin(inkS, 0.55), cap: C.deep, cheek: C.deep, throat: C.deep, wing: thin(inkS, 0.4), bar: C.slate, tail: C.ink, beak: thin(C.pink, 0.6), leg: C.pink }, capW: 0.5 },
      jay: { tail: 0.36, col: { breast: C.pink, back: deepen(C.pink, 0.15), cap: thin(C.pink, 0.4), cheek: C.pink, stripe: C.ink, throat: C.ground, wing: C.slate, bar: C.ground, tail: C.ink, beak: C.ink, leg: legC }, wingPaint: (t) => (t < 0.38 ? (Math.floor(t * 30) % 2 ? C.ink : C.slate) : t < 0.5 ? C.ground : C.ink) },
      robin: { plump: 1.12, tail: 0.24, col: { breast: C.pink, belly: C.ground, back: dryG, cap: dryG, mask: C.pink, cheek: C.pink, wing: deepen(dryG, 0.2), tail: deepen(dryG, 0.3), beak: C.ink, leg: inkS }, maskAt: 0.45, capW: 0.24 },
      woodpecker: { beak: [0.17, 0.03, 0], tail: 0.3, col: { breast: thin(C.deep, 0.6), back: C.deep, cap: C.verm, cheek: C.ground, stripe: C.ink, wing: deepen(C.deep, 0.15), bar: C.ground, tail: C.ink, beak: inkS, leg: inkS }, capW: 0.16 },
      bullfinch: { plump: 1.15, col: { breast: C.pink, back: thin(C.slate, 0.2), cap: C.ink, cheek: C.pink, wing: C.ink, bar: C.ground, tail: C.ink, beak: C.ink, leg: inkS }, capW: 0.26 },
      tit: { col: { breast: C.ground, back: C.slate, cap: C.slate, cheek: C.ground, stripe: C.ink, wing: deepen(C.slate, 0.2), bar: C.ground, tail: deepen(C.slate, 0.3), beak: C.ink, leg: inkS }, capW: 0.2 },
    };
    const birds = {};
    const stand = (name, kind, x, y, z, size, yaw, pitch = 0) => {
      const b = makeBird(typeof kind === 'string' ? SPECIES[kind] : kind, name); size = size / (0.97 - b.foot); b.group.position.set(x, y, z); b.group.scale.setScalar(size); b.group.rotation.set(pitch, yaw, 0, 'YXZ');
      if (kind !== 'finch') for (const m of b.group.children) m.frustumCulled = true;
      b.base = new V3(x, y, z); b.size = size; b.yaw = yaw; b.pitch = pitch; birds[name] = b; return b;
    };
    const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
    const onPerch = (name, kind, pc, size, tx, tz, sink = 0.02) => stand(name, kind, pc.x, pc.top - sink * size, pc.z, size, faceTo(pc.x, pc.z, tx, tz) + rng.range(-0.3, 0.3));
    await ctx.yield();
    // the finch: perched on its thistle at the entry, then on the strawberry by the lake (its flight between is scripted below)
    const thTop = new V3(finchThistle.p.x, finchThistle.p.y + finchThistle.s * 1.03, finchThistle.p.z);
    const finch = stand('finch', 'finch', thTop.x, thTop.y, thTop.z, 20, -2.2);
    await ctx.yield();
    const hoopoe = stand('hoopoe', 'hoopoe', hoopoeSeat.x, hoopoeSeat.y, hoopoeSeat.z, 19, faceTo(hoopoeSeat.x, hoopoeSeat.z, 36, 600) + 0.9);
    await ctx.yield();
    const hoopoeYaw = (u) => hoopoe.yaw + 1.5 * (1 - smoothstep(0.6, 0.69, u));
    const owlA = A.owlPerch, ringC = globeW0.clone().addScaledVector(winD, Math.sqrt(27 * 27 - 8.65 * 8.65) + 1.75), winL = WIN.left.clone();
    const owlAt = (th, out) => out.copy(ringC).addScaledVector(winL, Math.cos(th) * 10.2).addScaledVector(Y, -Math.sin(th) * 10.2);
    const owlP = owlAt(0.4, new V3());
    const owl = stand('owl', 'owl', owlP.x, owlP.y - 0.3, owlP.z, 9, Math.atan2(owlA.facing.x, owlA.facing.z) + 0.35);
    await ctx.yield();
    onPerch('robin', 'robin', perches.robin, 18, -5, 215);
    await ctx.yield();
    onPerch('kingfisher', 'kingfisher', perches.kingfisher, 19, -30, 268);
    await ctx.yield();
    onPerch('jay', 'jay', perches.jay, 20, 176, 452);
    await ctx.yield();
    onPerch('woodpecker', 'woodpecker', perches.woodpecker, 19, -34, 470);
    await ctx.yield();
    const mallard = stand('mallard', 'mallard', 60, -0.2 * 20, 300, 20, 2.4, 0.8);
    await ctx.yield();
    const farKinds = rng.shuffle(['bullfinch', 'tit', 'jay', 'kingfisher', 'robin', 'woodpecker']);
    for (let i = 0; i < 6; i++) { const k = 'far' + (i + 1); onPerch(k, i === 0 || i === 3 ? farKinds[i] : { ...SPECIES[farKinds[i]], q: 0.7 }, perches[k], rng.range(18, 22), AX, AZ); await ctx.yield(); }   // the four that are never near are built lighter
    // the lesser birds on the lawns' fruit: four kinds, instanced, each rocking and pecking on world time
    const smallBirds = [];
    {
      const kinds = ['bullfinch', 'tit', 'robin', 'jay'], birdGlaze = glazeMaterial(U, { pale: 0.5 });
      for (let k = 0; k < 4; k++) {
        const { geo, foot } = makeBird({ ...SPECIES[kinds[k]], q: 0.62 }, '', true), list = [];
        birdSpots.forEach((pc, i) => {
          if (i % 4 !== k) return;
          const size = rng.range(13, 17) / (0.97 - foot);
          list.push({ p: new V3(pc.x, pc.top - 0.02 * size - foot * size, pc.z), s: size, ry: faceTo(pc.x, pc.z, AX, AZ) + rng.range(-1.2, 1.2), ph: rng.range(0, TAU) });
          contacts.push([pc.x, pc.z, 0]);
        });
        smallBirds.push({ list, meshes: instanced(geo, list, 'lawn-' + kinds[k], true, birdGlaze) });
        await ctx.yield();
      }
      updaters.push((dt, time) => {
        for (const sb of smallBirds) {
          for (let i = 0; i < sb.list.length; i++) {
            const it = sb.list[i], peck = Math.pow(Math.max(0, Math.sin(time * 0.8 + it.ph)), 8);
            _e.set(0.45 * peck + 0.04 * Math.sin(time * 1.3 + it.ph), it.ry + 0.12 * Math.sin(time * 0.4 + it.ph), 0, 'YXZ'); _q.setFromEuler(_e);
            _m4.compose(it.p, _q, _s.setScalar(it.s));
            for (const m of sb.meshes) m.setMatrixAt(i, _m4);
          }
          for (const m of sb.meshes) m.instanceMatrix.needsUpdate = true;
        }
      });
    }
    for (const k in birds) if (k !== 'finch' && k !== 'hoopoe' && k !== 'owl' && k !== 'mallard') contacts.push([birds[k].base.x, birds[k].base.z, 0]);
    // ambient: preen, peck, flick (world time)
    const X1 = [1, 0, 0];
    const idle = (b, time, peckAmt = 0.8, nod = 0.22) => {
      const t = time + b.ph * 3, peck = Math.pow(Math.max(0, Math.sin(t * 0.9)), 10);
      b.set(1, 1, 0, 0, nod * Math.sin(t * 0.55) + peckAmt * peck);
      b.set(4, 1, 0, 0, 0.14 * Math.sin(t * 1.7) + 0.3 * peck);
      const shrug = 0.07 * Math.max(0, Math.sin(t * 0.37)); b.set(2, 0, 0, 1, -shrug); b.set(3, 0, 0, 1, shrug);
    };
    updaters.push((dt, time, camera, u) => {
      for (const k in birds) { const b = birds[k]; if (b !== finch) idle(b, time, k === 'owl' || k === 'hoopoe' ? 0.0 : k === 'mallard' ? 0.5 : 0.8, k === 'hoopoe' ? 0 : k === 'owl' ? 0.1 : 0.22); }
      hoopoe.set(5, 1, 0, 0, 0.15 + 1.0 * (0.5 + 0.5 * Math.sin(time * 0.9)) * (0.4 + 0.6 * smoothstep(0.5, 0.56, u)));
      hoopoe.group.rotation.y = hoopoeYaw(u);                        // it turns on its crescent as we come round: in profile from the tube's mouth, in profile again at the apex
      mallard.group.position.y = mallard.base.y + 0.5 * Math.sin(time * 0.7 + 1); mallard.set(1, 1, 0, 0, -0.75 + 0.15 * Math.sin(time * 0.5));
      mallard.group.rotation.y = mallard.yaw + 0.25 * Math.sin(time * 0.11);
      // the owl keeps the window, its back to us; at u 0.95 it sidesteps along the rim
      const stepK = smoothstep(0.94, 0.965, u), hop = Math.sin(Math.PI * clamp((u - 0.94) / 0.025, 0, 1));
      owlAt(0.4 + 0.2 * stepK, owl.group.position); owl.group.position.y += 0.5 * hop;
      owl.set(1, 0, 1, 0, 0.5 * Math.sin(time * 0.3) - 0.35);
    });
    // ---------------- the finch's strawberry (full detail) and the finch's script, all on u ----------------
    const berryG = new THREE.Group(); berryG.name = 'finch-strawberry';
    { const fb = new FormBuilder(); strawberry(fb, 36, 5, 9, 32, 0.085); const g = fb.geometry(); g.boundingSphere = new THREE.Sphere(new V3(), 1.2); addForm(g, 'finch-berry', berryG, glazeFruit); }
    const berryYaw = Math.atan2(berryT.x, berryT.z);
    berryG.position.copy(berryC); berryG.scale.setScalar(berryS); berryG.rotation.set(-0.6, berryYaw, 0, 'YXZ'); scene.add(berryG);   // the toothed cap leans back toward us, the pitted flank below it
    floaters.push({ kind: null, R: berryS * 0.55, tint: C.verm, h: berryS, it: { p: berryC }, ph: 1.3 });
    const berryFlat = new V3(berryT.x, 0, berryT.z).normalize();
    const finchPerch = berryC.clone().addScaledVector(berryFlat, 0.2 * berryS).add(new V3(0, 0.45 * berryS, 0));
    const finchFace = berryFlat.clone().multiplyScalar(-1).addScaledVector(berryLeft, 0.12).normalize(), finchYawB = Math.atan2(finchFace.x, finchFace.z);
    const U_TH = uo(path.nearestXZ(thTop.x, thTop.z).u), U_GO = 0.03, U_LAND = 0.262;
    const _fp = new V3(), _ft = new V3(), _fl = new V3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qI = new THREE.Quaternion();
    const spineAx = new V3(0, 0.75, 0.6).normalize();
    const lerpAng = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * t; };
    // the gaze's point of interest by the strawberry is the finch's head AS PERCHED (it has landed before that window opens): a fixed
    // point worked out here, so a frame posed out of order never looks at where the bird was a moment before
    const finchHead = new V3(), finchLook = new V3(0, 0.84 - finch.foot, 0.3).applyEuler(new THREE.Euler(0.9, finchYawB, 0, 'YXZ')).multiplyScalar(finch.size).add(finchPerch).lerp(TA0, 0.17).add(new V3(0, 1.5, 0));
    // the seed in its beak: one ivory touch (thistle down at the entry, a strawberry seed by the lake)
    const seedMesh = (() => { const g = quadGeo(); g.setAttribute('aDot', new THREE.InstancedBufferAttribute(new Float32Array([0, 0, 0, 0.44]), 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array([C.verm.r, C.verm.g, C.verm.b]), 3)); g.instanceCount = 1;
      const m = new THREE.Mesh(g, dotMaterial(U)); m.frustumCulled = false; m.name = 'finch-seed'; scene.add(m); return m; })();
    const _sd = new V3();
    updaters.push((dt, time, camera, u) => {
      const s = clamp((u - U_GO) / (U_LAND - U_GO), 0, 1), g = finch.group;
      const bob = 0.028 * berryS * Math.sin(time * 0.7 + 1.3);
      berryG.position.y = berryC.y + bob; berryG.rotation.z = 0.03 * Math.sin(time * 0.7 + 1.3);
      let open = 0, peck;
      if (s <= 0) {                                                  // on the thistle head, tugging out a seed
        const tug = Math.pow(0.5 + 0.5 * Math.sin(time * 4.2), 3);
        g.position.copy(thTop); g.rotation.set(0.42 + 0.16 * tug, finch.yaw + 0.05 * Math.sin(time * 2.1), 0, 'YXZ');
        peck = 0.5 + 0.55 * tug;
      } else if (s < 1) {                                            // off the thistle and down the slope ahead of us
        // (outside review, round 1) the finch keeps a short lead through the dive, so we really are chasing a bird bigger than the
        // trees, and only draws away to its strawberry at the end
        const Lend = U_BERRY - 0.012 - U_LAND, uf = U_GO + s * (U_LAND - U_GO) + (U_TH - U_GO) + (0.045 - (U_TH - U_GO)) * smoothstep(0, 0.25, s) + (Lend - 0.045) * smoothstep(0.5, 1, s);
        path.pointAt(un(uf), _fp); path.tangentAt(un(uf), _ft); _fl.crossVectors(Y, _ft).normalize();
        _fp.addScaledVector(_fl, lerp(15, 9, s)); _fp.y += 3 + 5 * Math.sin(Math.PI * s) + 1.2 * Math.sin(time * 5.2);
        const k0 = smoothstep(0, 0.13, s), k1 = smoothstep(0.84, 1, s);
        _fp.lerpVectors(thTop, _fp, k0).lerp(finchPerch, k1); _fp.y += k1 * bob;
        g.position.copy(_fp);
        const yawF = Math.atan2(_ft.x + _fl.x * -0.1, _ft.z), pitchF = 1.05 - Math.asin(clamp(_ft.y, -1, 1)) * 0.8;
        const yaw = lerpAng(lerpAng(finch.yaw, yawF, k0), finchYawB, k1), pitch = lerp(lerp(0.45, pitchF, k0), 0.9, k1);
        g.rotation.set(pitch, yaw, Math.sin(time * 1.3) * 0.12 * (1 - k1), 'YXZ');
        open = smoothstep(0, 0.07, s) * (1 - smoothstep(0.9, 1, s)); peck = -0.5 * open;
      } else {                                                       // on the strawberry, pulling an ivory seed
        g.position.copy(finchPerch); g.position.y += bob; g.rotation.set(0.9, finchYawB, 0, 'YXZ');
        const tug = Math.pow(0.5 + 0.5 * Math.sin(time * 2.6), 4);
        peck = 0.75 + 0.45 * tug; g.rotation.x += 0.06 * tug;
      }
      finch.set(1, 1, 0, 0, peck);
      finch.set(4, 1, 0, 0, 0.12 * Math.sin(time * 1.9) - 0.5 * open);
      const flap = Math.sin(time * 8.5) * 0.75 + 0.1;
      for (let i = 0; i < 2; i++) {
        const sx = i ? 1 : -1;
        _q1.setFromUnitVectors(finch.wingDir[i], _fl.set(sx, 0.12, -0.25).normalize());
        _q2.setFromAxisAngle(spineAx, -sx * flap); _q2.multiply(_q1);
        _q1.copy(_qI).slerp(_q2, open); finch.setQ(2 + i, _q1);
      }
      _sd.set(0, 0.076, 0.262).applyAxisAngle(_fl.set(1, 0, 0), peck).add(_ft.set(0, 0.74 - finch.foot, 0.14));
      seedMesh.position.copy(_sd).applyEuler(g.rotation).multiplyScalar(g.scale.x).add(g.position); seedMesh.scale.setScalar(open > 0.01 ? 1e-4 : 1);
      finchHead.set(0, 0.84 - finch.foot, 0.3).applyEuler(g.rotation).multiplyScalar(finch.size).add(g.position);
    });
    // ---------------- pearls of the towers and horn; contact rings; ripples and smears on the water ----------------
    {
      const n = pearlList.length / 7, aDot = new Float32Array(n * 4), aTint = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { for (let k = 0; k < 4; k++) aDot[i * 4 + k] = pearlList[i * 7 + k]; for (let k = 0; k < 3; k++) aTint[i * 3 + k] = pearlList[i * 7 + 4 + k]; }
      const g = quadGeo(); g.setAttribute('aDot', new THREE.InstancedBufferAttribute(aDot, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 3)); g.instanceCount = n;
      const m = new THREE.Mesh(g, dotMaterial(U)); m.frustumCulled = false; m.name = 'pearls'; scene.add(m);
    }
    // under each thing on the lawn a thin ring of deep green glaze, with no direction (never a cast shadow)
    {
      const n = contacts.length, g = new THREE.CircleGeometry(1, 10); g.rotateX(-Math.PI / 2);
      const m = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({ uniforms: { uCol: { value: mixc(C.lawn, C.deep, 0.72) } },
        vertexShader: /* glsl */`void main() { gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.0); }`, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), Math.max(1, n));
      const nrm = new V3();
      contacts.forEach(([x, z, r], i) => {
        const rr = r > 0 ? r : 3.2, e = 2;
        nrm.set(groundY(x - e, z) - groundY(x + e, z), 2 * e, groundY(x, z - e) - groundY(x, z + e)).normalize();
        _q.setFromUnitVectors(Y, nrm); _m4.compose(_p.set(x, groundY(x, z) + 0.12, z), _q, _s.set(rr, 1, rr)); m.setMatrixAt(i, _m4);
      });
      m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; m.name = 'contact-rings'; scene.add(m);
    }
    await ctx.yield();
    // on water: a deeper slate ring, hairline ripple rings spreading, and a short smear of the thing's own colour toward the eye
    floaters.push({ kind: null, R: 6, tint: SPECIES.mallard.col.breast, h: 14, it: { p: new V3(60, 0, 300) }, ph: 0.4 });
    {
      const n = floaters.length, aFl = new Float32Array(n * 4), aTint = new Float32Array(n * 4);
      floaters.forEach((f, i) => { aFl.set([f.it.p.x, f.it.p.z, f.R, f.ph], i * 4); aTint.set([f.tint.r, f.tint.g, f.tint.b, f.h], i * 4); });
      const g = quadGeo(); g.setAttribute('aFl', new THREE.InstancedBufferAttribute(aFl, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...U, uSlate: { value: C.slate } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
        vertexShader: /* glsl */`attribute vec4 aFl; attribute vec4 aTint; varying vec2 vQ; varying vec4 vTint; varying vec2 vRP; varying vec2 vToCam;
          void main() { float ext = aFl.z * 3.4 + max(aTint.w * 0.5, 0.0); vec3 wp = vec3(aFl.x + position.x * ext, 0.07, aFl.y + position.y * ext);
            vQ = position.xy * ext; vTint = aTint; vRP = aFl.zw; vec2 tc = cameraPosition.xz - aFl.xy; float l = length(tc); vToCam = l > 1e-3 ? tc / l : vec2(0.0, -1.0);
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec3 uGround; uniform vec3 uInk; uniform vec3 uSlate; uniform float uTime; varying vec2 vQ; varying vec4 vTint; varying vec2 vRP; varying vec2 vToCam;
          void main() {
            float R = max(vRP.x, 0.1); float d = length(vQ); float fw = max(fwidth(d), 1e-4);
            // contact ring
            float ring = 1.0 - smoothstep(R * 1.22 - fw, R * 1.22 + fw, d);
            vec3 col = mix(uSlate, uInk, 0.3); float a = ring * 0.85;
            // the smear: 0.4 of its height, toward the eye, in ragged upright strokes
            float al = dot(vQ, vToCam); float lat = vQ.x * vToCam.y - vQ.y * vToCam.x;
            float cid = floor(lat / max(R * 0.16, 0.05)); float hs = fract(sin(cid * 12.9898 + vRP.y) * 43758.5453);
            float edge = sqrt(max(R * R * 0.9 - lat * lat, 0.0));
            float sm = step(abs(lat), R * 0.92) * step(0.0, al) * step(al, edge + 0.4 * vTint.w * (0.45 + 0.55 * hs));
            col = mix(col, mix(uSlate, vTint.rgb, 0.55), sm * (1.0 - ring)); a = max(a, sm * 0.8);
            // ripple rings
            float sp = R * 0.42 + 0.6; float ph = (d - R * 1.22) / sp - uTime * 0.22 - vRP.y;
            float w = max(min(1.5 * fw / sp, 0.14), 1e-4);
            float rp = (1.0 - smoothstep(0.5 * w, w, abs(fract(ph) - 0.5))) * (1.0 - smoothstep(0.1, 0.25, fw / sp)) * step(R * 1.22, d) * (1.0 - smoothstep(R * 2.0, R * 3.3, d));
            col = mix(col, uGround, rp * (1.0 - sm)); a = max(a, rp * 0.8);
            if (a < 0.01) discard;
            gl_FragColor = vec4(col, a);
          }`,
      }));
      m.frustumCulled = false; m.renderOrder = 2; m.name = 'ripples'; scene.add(m);
    }
    // true-size white egrets along the shore, so the scale is plain; the ones by our crossing scatter at u 0.28
    {
      const fb = new FormBuilder(), w = C.ground;
      fb.lathe([[0, 0.5], [0.1, 0.56], [0.14, 0.7], [0.08, 0.84], [0, 0.88]], { segs: 6, pig: w, pat: PAT.plain, m: new THREE.Matrix4().makeRotationX(0.9).setPosition(0, 0.16, -0.5) });
      fb.loft([{ c: new V3(0, 0.66, 0.1), r: 0.04 }, { c: new V3(0, 0.8, 0.2), r: 0.028 }, { c: new V3(0, 0.92, 0.14), r: 0.026 }, { c: new V3(0, 1.0, 0.2), r: 0.04 }, { c: new V3(0, 0.99, 0.42), r: 0 }], { segs: 5, pig: w, pat: PAT.plain });
      for (const sx of [-1, 1]) fb.loft([{ c: new V3(sx * 0.04, 0.56, 0), r: 0.012 }, { c: new V3(sx * 0.04, 0, 0.02), r: 0.012 }], { segs: 4, pig: C.ink, pat: PAT.plain });
      const list = [], movers = [];
      for (let i = 0; i < Math.round(46 * detail); i++) {
        const a = i < 20 ? Math.PI + rng.range(-0.42, 0.42) : rng.range(0, TAU), r = rng.range(171.5, 180), x = AX + Math.sin(a) * r, z = AZ + Math.cos(a) * r;
        const it = { p: new V3(x, groundY(x, z) - 0.02, z), s: rng.range(1.0, 1.35) * 1.6, ry: rng.range(0, TAU) };
        list.push(it); if (path0.nearestXZ(x, z).dist < 46) movers.push({ i: list.length - 1, it, dir: new V3(x - 0, 0, z - 205).normalize(), k: rng.range(0.7, 1.3) });
      }
      const eg = instanced(fb.geometry(), list, 'egrets');
      updaters.push((dt, time, camera, u) => {
        const k = smoothstep(0.268, 0.33, u);
        for (const mv of movers) {
          const it = mv.it, kk = Math.pow(k, 0.7) * mv.k, flap = Math.sin(time * 9 + mv.i);
          _e.set(-0.9 * Math.min(1, kk * 3), Math.atan2(mv.dir.x, mv.dir.z) * Math.min(1, kk * 4) + it.ry * (1 - Math.min(1, kk * 4)), 0.5 * flap * Math.min(1, kk * 3), 'YXZ'); _q.setFromEuler(_e);
          _m4.compose(_p.copy(it.p).addScaledVector(mv.dir, 70 * kk).setY(it.p.y + 26 * kk + (kk > 0 ? 0.6 * flap : 0)), _q, _s.setScalar(it.s));
          for (const m of eg) m.setMatrixAt(mv.i, _m4);
        }
        for (const m of eg) m.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();
    // ---------------- the swifts as one ribbon (scripted on u); three skeins crossing the sky like smoke; the great fliers; the pour into the window ----------------
    const L = path.length;
    const guide = (() => {                                           // the swifts' road: tube, out over the far water, round the horn, into the window
      const g = [];
      for (const p of [[-60, 96, 350], [-105, 70, 290], [-100, 40, 225], [-62, 18, 196]]) g.push(new V3(p[0], p[1], p[2]));
      for (const b of [62, 40, 18]) g.push(path.posAtDist(un(U_MOUTH) * L - b));
      for (let d = un(U_MOUTH) * L; d < un(U_END) * L + 70; d += 22) g.push(path.posAtDist(d));
      const n0 = g.length;
      for (let i = 0; i <= 26; i++) { const a = 2.6 + (i / 26) * TAU * 2.4, rr = 26 - 5 * (i / 26); g.push(new V3(hornBase.x + hornLean((39 + 58 * (i / 26)) / 65) + Math.sin(a) * (rr + 3 * (i / 26)), 40 + 58 * (i / 26), hornBase.z + Math.cos(a) * (rr + 3 * (i / 26)))); }   // the last turn wheels round the hoopoe itself
      const n1 = g.length;
      for (const s of [168, 140, 110, 80, 52, 30, 14, 4, -8, -20]) g.push(s > 5 ? path.posAtDist(L - 6 - s).add(new V3(0, s > 40 ? 5 : 0, 0)) : winC.clone().addScaledVector(winD, s));   // down from the horn to the shore and up the fountain's face with us
      const curve = new THREE.CatmullRomCurve3(g, false, 'centripetal'), M = 700, tab = new Float32Array((M + 1) * 3), v = new V3();
      curve.arcLengthDivisions = 1200; const len = curve.getLength();
      for (let i = 0; i <= M; i++) { curve.getPointAt(i / M, v); tab[i * 3] = v.x; tab[i * 3 + 1] = v.y; tab[i * 3 + 2] = v.z; }
      const dAt = (idx) => { let best = 0, bd = 1e9; for (let i = 0; i <= M; i++) { const dx = tab[i * 3] - g[idx].x, dy = tab[i * 3 + 1] - g[idx].y, dz = tab[i * 3 + 2] - g[idx].z, dd = dx * dx + dy * dy + dz * dz; if (dd < bd) { bd = dd; best = i; } } return best / M * len; };
      const at = (d, out) => { const f = clamp(d / len, 0, 1) * M, i = Math.min(M - 1, Math.floor(f)), t = f - i; return out.set(lerp(tab[i * 3], tab[i * 3 + 3], t), lerp(tab[i * 3 + 1], tab[i * 3 + 4], t), lerp(tab[i * 3 + 2], tab[i * 3 + 5], t)); };
      return { len, at, dMouth: dAt(7), dOut: dAt(n0 - 3), dHorn0: dAt(n0 + 2), dHorn1: dAt(n1 - 1), dWin: dAt(n1 + 7) };
    })();
    await ctx.yield();
    const N_SW = Math.round(600 * (0.5 + 0.5 * detail)), N_SK0 = Math.round(360 * (0.5 + 0.5 * detail)), N_DART = N_SW;
    const N_SK = N_SK0, N_PO = Math.round(200 * (0.5 + 0.5 * detail)), N_FAR = N_SK;   // the skeins' specks (two triangles each) and the swifts of the pour (six each)
    const dartPos = new Float32Array(N_DART * 4), dartDir = new Float32Array(N_DART * 4);
    const swLag = new Float32Array(N_SW), swOff = new Float32Array(N_SW * 3);
    for (let i = 0; i < N_SW; i++) { swLag[i] = Math.pow(rng(), 0.8) * 250; const a = rng.range(0, TAU), r = rng.range(2.4, 5.2); swOff.set([Math.cos(a) * r, Math.sin(a) * r, rng.range(0, TAU)], i * 3); }
    const dartGeo = new THREE.InstancedBufferGeometry();
    { // a swift from above: a short body with a forked tail and two long sickle wings swept back
      const v = [[0, 0.5], [-0.07, 0.2], [0.07, 0.2], [-0.07, -0.22], [0.07, -0.22], [0, -0.28], [-0.13, -0.58], [0.13, -0.58]], ix = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 6, 5, 4, 5, 7];
      for (const sx of [-1, 1]) { const b = v.length; v.push([sx * 0.07, 0.24], [sx * 0.5, 0.2], [sx * 0.82, 0.0], [sx * 1.0, -0.42], [sx * 0.66, -0.12], [sx * 0.4, 0.0], [sx * 0.07, 0.0]); ix.push(b, b + 1, b + 5, b, b + 5, b + 6, b + 1, b + 2, b + 4, b + 1, b + 4, b + 5, b + 2, b + 3, b + 4); }
      dartGeo.setAttribute('position', new THREE.Float32BufferAttribute(v.flatMap((q) => [q[0], 0, q[1]]), 3)); dartGeo.setIndex(ix); }
    const dPosA = new THREE.InstancedBufferAttribute(dartPos, 4), dDirA = new THREE.InstancedBufferAttribute(dartDir, 4);
    dartGeo.setAttribute('aSide', new THREE.InstancedBufferAttribute(new Float32Array(N_DART * 3), 3));   // (zero: the swifts' wings lie level)
    // the far bird: two swept wings, two triangles; the skeins' specks
    const farGeo = new THREE.InstancedBufferGeometry();
    farGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.32, -1, 0, -0.5, 0.02, 0, 0.0, 0, 0, 0.32, -0.02, 0, 0.0, 1, 0, -0.5], 3));
    const farPos = new Float32Array(N_FAR * 4), farDir = new Float32Array(N_FAR * 4), farSide = new Float32Array(N_FAR * 3);
    const fPosA = new THREE.InstancedBufferAttribute(farPos, 4), fDirA = new THREE.InstancedBufferAttribute(farDir, 4), fSideA = new THREE.InstancedBufferAttribute(farSide, 3);
    fPosA.setUsage(THREE.DynamicDrawUsage); fDirA.setUsage(THREE.DynamicDrawUsage); fSideA.setUsage(THREE.DynamicDrawUsage);
    farGeo.setAttribute('aPos', fPosA); farGeo.setAttribute('aDir', fDirA); farGeo.setAttribute('aSide', fSideA); farGeo.instanceCount = N_FAR;
    dPosA.setUsage(THREE.DynamicDrawUsage); dDirA.setUsage(THREE.DynamicDrawUsage);
    dartGeo.setAttribute('aPos', dPosA); dartGeo.setAttribute('aDir', dDirA); dartGeo.instanceCount = N_DART;
    const darts = new THREE.Mesh(dartGeo, new THREE.ShaderMaterial({
      uniforms: U, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec4 aPos; attribute vec4 aDir; attribute vec3 aSide; uniform vec2 uRes; uniform float uTime;
        void main() {
          vec3 f = aDir.xyz; float fl = length(f); f = fl > 1e-4 ? f / fl : vec3(0.0, 0.0, 1.0);
          vec3 toC = cameraPosition - aPos.xyz; float dist = max(length(toC), 0.1);
          // a bird flying straight away from us (or at us) is drawn as he drew them, tipped so its sickle wings show, never as an edge-on dash
          vec3 v = -toC / dist; vec3 uw = vec3(0.0, 1.0, 0.0) - v * v.y; float ul = length(uw); uw = ul > 1e-3 ? uw / ul : vec3(0.0, 0.0, 1.0);
          float farW = step(1.5, length(aSide)) * smoothstep(90.0, 170.0, dist);   // (the pour, whose wing line is given at length 2: from across the lake each is drawn flat to the eye, as he drew far birds)
          vec3 ft = f + uw * 0.85 * smoothstep(0.55, 0.95, abs(dot(f, v))) * max(smoothstep(1.02, 1.25, aPos.w) * (1.0 - step(2.0, aPos.w)), farW); float ftl = length(ft); f = ftl > 1e-3 ? ft / ftl : f;   // (the swifts of the last straight, aPos.w 1.3, and the pour seen from far)
          vec3 s = cross(f, vec3(0.0, 1.0, 0.0)); float sl = length(s); s = sl > 1e-3 ? s / sl : vec3(1.0, 0.0, 0.0);
          vec3 s2 = aSide - f * dot(aSide, f); float s2l = length(s2); if (s2l > 0.2) s = s2 / s2l;   // a bird given its own wing line (the skeins bank toward the garden, the pour shows its wings to the window's axis)
          vec3 sc = cross(f, v); float scl = length(sc);
          if (scl > 1e-3 && farW > 0.0) { sc = sc / scl * (dot(sc, s) < 0.0 ? -1.0 : 1.0); vec3 sm = mix(s, sc, farW); float sml = length(sm); s = sml > 1e-3 ? sm / sml : s; }
          vec3 up = cross(s, f);
          float pxm = projectionMatrix[1][1] * uRes.y * 0.5 / dist;
          float size = min(max(aPos.w, 3.2 / pxm), uRes.y / (27.0 * pxm)) * smoothstep(0.0, 0.5, aPos.w);   // never a speck under ~2.5 px, never wider than a twentieth of the frame; a bird of no size is not drawn
          float flap = sin(uTime * 14.0 + aDir.w);
          vec3 p = aPos.xyz + (f * position.z + s * position.x * (0.75 + 0.25 * flap) + up * (abs(position.x) * (0.45 + 0.5 * flap) - position.x * position.x * 0.4)) * size;   // wings held a little up, so from behind each still reads as a bird
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */`uniform vec3 uInk; void main() { gl_FragColor = vec4(uInk, 1.0); }`,
    }));
    darts.frustumCulled = false; darts.name = 'swifts'; scene.add(darts);
    const farBirds = new THREE.Mesh(farGeo, darts.material); farBirds.frustumCulled = false; farBirds.name = 'skeins'; scene.add(farBirds);   // (the same material: no second program)
    // a swift of the pour: a spindle body and two sickle wings, six triangles, large enough to read as a bird from across the lake
    const pourGeo = new THREE.InstancedBufferGeometry();
    { const v = [[0, 0.52], [-0.075, 0.1], [0.075, 0.1], [0, -0.62]], ix = [0, 1, 2, 1, 3, 2];
      for (const sx of [-1, 1]) { const b = v.length; v.push([sx * 0.06, 0.27], [sx * 0.56, 0.2], [sx * 0.06, -0.03], [sx * 1.0, -0.46], [sx * 0.36, 0.03]); ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 4); }
      pourGeo.setAttribute('position', new THREE.Float32BufferAttribute(v.flatMap((q) => [q[0], 0, q[1]]), 3)); pourGeo.setIndex(ix); }
    const pourPos = new Float32Array(N_PO * 4), pourDir = new Float32Array(N_PO * 4), pourSide = new Float32Array(N_PO * 3);
    const pPosA = new THREE.InstancedBufferAttribute(pourPos, 4), pDirA = new THREE.InstancedBufferAttribute(pourDir, 4), pSideA = new THREE.InstancedBufferAttribute(pourSide, 3);
    pPosA.setUsage(THREE.DynamicDrawUsage); pDirA.setUsage(THREE.DynamicDrawUsage); pSideA.setUsage(THREE.DynamicDrawUsage);
    pourGeo.setAttribute('aPos', pPosA); pourGeo.setAttribute('aDir', pDirA); pourGeo.setAttribute('aSide', pSideA); pourGeo.instanceCount = N_PO;
    const pourBirds = new THREE.Mesh(pourGeo, darts.material); pourBirds.frustumCulled = false; pourBirds.name = 'pour'; scene.add(pourBirds);
    const skein = [0, 1, 2].map((k) => ({ a0: rng.range(0, TAU), tilt: rng.range(-0.25, 0.25), r: 2040 + 40 * k, y: 290 + 90 * k, sp: (k % 2 ? -1 : 1) * rng.range(0.012, 0.02) }));   // (y: metres above the crest beneath)
    for (let k = 1; k < 3; k++) { skein[k].a0 = skein[0].a0 + k * TAU / 3; skein[k].sp = skein[0].sp * (1 + 0.05 * k); }   // evenly round the sky and the same way, so a flight crosses whichever sky the eye is turned to
    // the skeins: three thin ragged ribbons of birds, each a sixth of the sky long, thickening and thinning like smoke. They ride over the
    // toothed crest at its own radius, so from anywhere in the garden there is clear sky between them and the hills (crestTop: the highest
    // tooth within 4 degrees either side, eased; they rise over each rock needle and sink over the saddles)
    const skLag = new Float32Array(N_SK * 3); for (let i = 0; i < N_SK; i++) skLag.set([rng() * rng() * 1.1, rng.gauss() * 26, rng.range(0, TAU)], i * 3);
    const crestTop = (() => {
      const n = 360, raw = new Float32Array(n), mx = new Float32Array(n), sm = new Float32Array(n);
      for (let i = 0; i < n; i++) { let m = 0; for (let q = 0; q < 4; q++) m = Math.max(m, teeth(-Math.PI + (i + q / 4) / n * TAU)); raw[i] = 930 + (m - 0.4) * 300; }
      for (let i = 0; i < n; i++) { let m = 0; for (let d = -8; d <= 8; d++) m = Math.max(m, raw[(i + d + n) % n]); mx[i] = m; }
      for (let i = 0; i < n; i++) { let a = 0; for (let d = -4; d <= 4; d++) a += mx[(i + d + n) % n]; sm[i] = a / 9; }
      return (ang) => { const f = ((ang + Math.PI) / TAU % 1 + 1) % 1 * n, i = Math.floor(f) % n, t = f - Math.floor(f); return lerp(sm[i], sm[(i + 1) % n], t); };
    })();
    // THE GREAT FLIERS: his garden's sky carries a few large birds on the wing. Eighteen of them (egret, stork, crane, swan: a long neck
    // out ahead, legs trailing), each as long in the picture as a hand held out, fly slowly one way round the garden in three loose files
    // over the rim of lawn three, inside the hills (in the picture: across the sky above the crest): lead white with the dark hairline, three in shell pink and two in slate, four with a cherry or a berry in
    // the beak, wings beating slowly. Set evenly round the sky by bearing from the fountain's axis (nine in the low file, one of the upper
    // files in each gap between them); real forms in the garden's air, in front of the hills, in the glaze and hairline of every other form.
    // Whole and separate: the low file flies some 770 m up at 1,320 m from the axis, where the slope beneath is under 400 m, so the outer wing at
    // the bottom of its stroke (banked 0.22, 0.42 below level, 194 to 221 m long) stays 117 m and more above the hill at every bearing.
    const N_GB = 18;
    const gbList = [], gbBerry = [1, 5, 11, 15];
    for (let i = 0; i < N_GB; i++) {
      const g = i - 9, k = i < 9 ? 0 : 1 + (g % 2), az = ((i < 9 ? i : g + 0.5) * 40 + 9 * (hash(i * 1.93 + 4.2) - 0.5)) * Math.PI / 180;
      gbList.push({ k, az, len: 412 + 58 * hash(i * 2.41 + 1.3), ph: hash(i * 5.3 + 2.2) * TAU, dy: (hash(i * 7.7 + 0.9) - 0.5) * 0.012, tint: [3, 13, 16].includes(i) ? thin(C.pink, 0.12) : [7, 10].includes(i) ? thin(C.slate, 0.2) : null });
    }
    const gb = (() => {
      const fbB = new FormBuilder(), fbW = new FormBuilder(), w = C.ground, ring = (z, y, r, pig) => ({ c: new V3(0, y, z), r, pig });
      // body, neck, head and beak as one turned form (tail to beak along +Z, 1 long from beak tip to toes); the legs one trailing stroke
      fbB.loft([ring(-0.27, 0, 0), ring(-0.06, -0.006, 0.064), ring(0.06, 0, 0.054), ring(0.35, 0.012, 0.016), ring(0.39, 0.016, 0.031), ring(0.422, 0.01, 0.013, C.ink), ring(0.5, -0.004, 0, C.ink)], { segs: 4, pig: w, pat: PAT.plain });
      fbB.loft([{ c: new V3(0, -0.02, -0.16), r: 0.012 }, { c: new V3(0, -0.034, -0.46), r: 0.009 }], { segs: 3, pig: thin(C.pink, 0.45), pat: PAT.plain });   // (legs in thinned red lake, pale: a dark stroke there would read as a second beak)
      // one wing, hinged at its root and reaching +X, swept back at the tip, its feathers ruled across it; the other wing is the same form turned over
      fbW.loft([{ c: new V3(0, 0, 0), r: 0.07, rz: 0.01 }, { c: new V3(0.2, 0, -0.012), r: 0.085, rz: 0.009 }, { c: new V3(0.35, 0, -0.055), r: 0.06, rz: 0.006 }, { c: new V3(0.47, 0, -0.13), r: 0 }], { segs: 4, pig: w, pat: PAT.rings, row: 0.042, flatArc: true, ref: new V3(0, 0, 1) });
      const whole = (geo) => {                                         // (the triangles that close to nothing at a pointed tip are not drawn)
        const ix = geo.index.array, ps = geo.getAttribute('position'), keep = [], same = (a, b) => ps.getX(a) === ps.getX(b) && ps.getY(a) === ps.getY(b) && ps.getZ(a) === ps.getZ(b);
        for (let t = 0; t < ix.length; t += 3) if (!same(ix[t], ix[t + 1]) && !same(ix[t + 1], ix[t + 2]) && !same(ix[t], ix[t + 2])) keep.push(ix[t], ix[t + 1], ix[t + 2]);
        geo.setIndex(keep); return geo;
      };
      const mk = (geo, n, name) => [glazeMat, hullMat].map((mat) => { const m = new THREE.InstancedMesh(geo, mat, n); m.name = name; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; });
      const bodies = mk(whole(fbB.geometry()), N_GB, 'great-fliers'), wings = mk(whole(fbW.geometry()), N_GB * 2, 'great-fliers-wings');
      const one = new THREE.Color(1, 1, 1), tc = new THREE.Color();
      gbList.forEach((b, i) => {                                       // (the tint multiplies the form's lead white: pigment over the ground)
        if (b.tint) tc.setRGB(b.tint.r / Math.max(w.r, 1e-3), b.tint.g / Math.max(w.g, 1e-3), b.tint.b / Math.max(w.b, 1e-3)); else tc.copy(one);
        bodies[0].setColorAt(i, tc); wings[0].setColorAt(i * 2, tc); wings[0].setColorAt(i * 2 + 1, tc);
      });
      // what four of them carry: a cherry or a berry, one round touch at the beak's tip
      const aDot = new Float32Array(gbBerry.length * 4), aTint = new Float32Array(gbBerry.length * 3), berryPig = deepen(mixc(C.pink, C.slate, 0.55), 0.2);
      gbBerry.forEach((bi, j) => { const c = j === 2 ? berryPig : C.verm; aTint.set([c.r, c.g, c.b], j * 3); aDot[j * 4 + 3] = 0.024 * gbList[bi].len; });
      const dg = quadGeo(), dotA = new THREE.InstancedBufferAttribute(aDot, 4); dotA.setUsage(THREE.DynamicDrawUsage);
      dg.setAttribute('aDot', dotA); dg.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 3)); dg.instanceCount = gbBerry.length;
      const dots = new THREE.Mesh(dg, dotMaterial(U, { solid: 1 })); dots.frustumCulled = false; dots.name = 'great-fliers-fruit'; scene.add(dots);
      return { bodies, wings, aDot, dotA };
    })();
    await ctx.yield();
    {
      const GB_E = [30.5, 33.3, 36.0], sg = Math.sign(skein[0].sp) || 1, _f = new V3(), _o = new V3(), _ub = new V3(), _xb = new V3(), _mb = new THREE.Matrix4(), _mw = new THREE.Matrix4(), _sc = new THREE.Matrix4();
      updaters.push((dt, time) => {
        for (let i = 0; i < N_GB; i++) {
          const b = gbList[i], a = b.az + sg * 0.011 * time, sa = Math.sin(a), ca = Math.cos(a), r = 1320 + 37 * b.k;   // (over lawn three's rim, inside the hills: no wing, at any bearing or stroke, comes within 100 m of the slope)
          const el = (GB_E[b.k] * Math.PI / 180) + b.dy + 0.006 * Math.sin(time * 0.21 + b.ph);     // degrees above a level eye at the fountain's foot, a slow rise and fall
          _f.set(ca * sg, 0, -sa * sg); _o.set(sa, 0, ca);
          _ub.set(0, 1, 0).multiplyScalar(Math.cos(0.22)).addScaledVector(_o, Math.sin(0.22));       // banked a little outward: the garden sees both wings from beneath
          _xb.crossVectors(_ub, _f);
          _mb.makeBasis(_xb, _ub, _f).setPosition(AX + sa * r, r * Math.tan(el), AZ + ca * r); _sc.makeScale(b.len, b.len, b.len); _mb.multiply(_sc);
          const th = 0.1 + 0.52 * Math.sin(time * 1.9 + b.ph);                                       // one slow beat every three seconds
          for (let m = 0; m < 2; m++) {
            gb.bodies[m].setMatrixAt(i, _mb);
            _mw.makeRotationZ(th).setPosition(0, 0.014, 0.06).premultiply(_mb); gb.wings[m].setMatrixAt(i * 2, _mw);
            _mw.makeRotationZ(Math.PI - th).setPosition(0, 0.014, 0.06).premultiply(_mb); gb.wings[m].setMatrixAt(i * 2 + 1, _mw);
          }
          const j = gbBerry.indexOf(i);
          if (j >= 0) { _o.set(0, -0.02, 0.518).applyMatrix4(_mb); gb.aDot[j * 4] = _o.x; gb.aDot[j * 4 + 1] = _o.y; gb.aDot[j * 4 + 2] = _o.z; }
        }
        for (let m = 0; m < 2; m++) { gb.bodies[m].instanceMatrix.needsUpdate = true; gb.wings[m].instanceMatrix.needsUpdate = true; }
        gb.dotA.needsUpdate = true;
      });
    }
    // THE POUR (the event of the exit): as the day turns a ribbon of swifts rises from the shell at the horn's foot, climbs the sky to port
    // of the fountain and comes over in one bow, down across the globe's shoulder into the window from its upper left: one loose ribbon,
    // as smoke goes into a hole, sky and fountain showing between the birds. It never turns about the window's axis (seen down that axis
    // a turn is a ring), and its course keeps 25 m and more from the camera's road until its last stroke through the collar, where a
    // rule in space takes over: no bird of the pour is drawn within 25 m of the eye (it is full size again by 38 m). From far the ribbon
    // is thinned and enlarged by distance from the eye, so it is always birds with sky between them: one in five is always drawn, each
    // of the others only out to its own distance (80 to 170 m, gone over 12 m), and each drawn bird keeps the size in the picture it has
    // at 110 m (a third larger beyond 180 m), turned flat to the eye and tipped when it flies straight away, as he drew far birds.
    const pour = (() => {
      const at0 = (l, y, al) => winC.clone().addScaledVector(winL, l).addScaledVector(Y, y).addScaledVector(winD, al);   // (metres to port of the window, above it, out from it)
      const g = [new V3(hornBase.x, 2, hornBase.z)];
      for (const q of POUR_COURSE) g.push(at0(q[0], q[1], q[2]));
      const curve = new THREE.CatmullRomCurve3(g, false, 'centripetal'), M = 480, tab = new Float32Array((M + 1) * 3), v = new V3();
      curve.arcLengthDivisions = 960; const len = curve.getLength();
      for (let i = 0; i <= M; i++) { curve.getPointAt(i / M, v); tab[i * 3] = v.x; tab[i * 3 + 1] = v.y; tab[i * 3 + 2] = v.z; }
      const at = (d, out) => { const f = clamp(d / len, 0, 1) * M, i = Math.min(M - 1, Math.floor(f)), t = f - i; return out.set(lerp(tab[i * 3], tab[i * 3 + 3], t), lerp(tab[i * 3 + 1], tab[i * 3 + 4], t), lerp(tab[i * 3 + 2], tab[i * 3 + 5], t)); };
      return { len, run: len - 11, at };                             // (run: gone into the dark at the portal's plane)
    })();
    const poLag = new Float32Array(N_PO * 4);
    for (let i = 0; i < N_PO; i++) { const a = hash(i * 1.91 + 3.3) * TAU, r = (3 + 12 * Math.sqrt(hash(i * 2.33 + 7.1))) * (i % 5 === 0 ? 1.6 : 1); poLag.set([(i + 0.8 * hash(i * 0.731 + 0.57)) / N_PO * pour.run, Math.cos(a) * r, Math.sin(a) * r, hash(i * 5.17 + 2.9) * TAU], i * 4); }   // evenly strung along the road, a ribbon some 30 m wide (the one in five drawn from far ride wider, so they stand apart)
    let pathU = 0;                                                    // the engine's u, for the pour (kept current in update())
    await ctx.yield();
    const _sv = new V3(), _sw = new V3(), _sx = new V3(), _sy = new V3(), _cw = new V3();
    const keys = [[0.3, 0], [0.365, guide.dMouth + 50], [0.4, guide.dMouth + 110], [0.52, guide.dOut + 120], [0.6, guide.dHorn0 + 60], [0.745, guide.dHorn1 + 30], [0.8, guide.dWin - 15], [0.83, guide.len + 5], [1.0, guide.len + 200]];   // round the horn until we pass its apex, across to the window by u 0.8, then the whole ribbon pours in past us until the very end
    const headAt = (u) => { for (let i = 0; i < keys.length - 1; i++) if (u <= keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], clamp((u - keys[i][0]) / (keys[i + 1][0] - keys[i][0]), 0, 1)); return keys[keys.length - 1][1]; };
    updaters.push((dt, time, camera, u) => {
      camera.getWorldPosition(_cw);
      const head = headAt(u) + (u < 0.3 ? -300 : 0), wheel = smoothstep(0.56, 0.62, u) * (1 - smoothstep(0.74, 0.8, u));
      for (let i = 0; i < N_SW; i++) {
        const d = head - swLag[i] + 6 * Math.sin(time * 0.7 + swOff[i * 3 + 2]);
        guide.at(d, _sv);
        const hide = d > guide.len - 13 || (i % 3 > 0 && d > guide.dWin - 55 && _sv.distanceToSquared(_cw) > 4900);   // gone into the dark at the portal's plane (and, from far off, only a third of them drawn at the window, or they knot into a blot)
        guide.at(d, _sv); guide.at(d + 2.5, _sw);
        if (d < 40) {                                                // not yet on the road: wheeling round the fountain's globe
          const kk = clamp((d + 200) / 240, 0, 1), a = time * 0.32 + swLag[i] * 0.0251, rr = 45 + 6 * Math.sin(a * 3 + 1) + 2.6 * Math.sin(swLag[i] * 2.3), yy = 116 + 15 * Math.sin(a * 2 + 0.6) + 2.4 * Math.sin(swLag[i] * 1.7);   // one wavy ring of birds wheeling round the globe (a loose cloud of them read as specks)
          _sx.set(AX + Math.sin(a) * rr, yy, AZ + Math.cos(a) * rr); _sy.set(AX + Math.sin(a + 0.05) * rr, yy, AZ + Math.cos(a + 0.05) * rr);
          _sv.lerpVectors(_sx, _sv, kk); _sw.lerpVectors(_sy, _sw, kk);
        }
        _sw.sub(_sv); if (_sw.lengthSq() < 1e-6) _sw.set(0, 0, 1);
        _sx.crossVectors(_sw, Y).normalize(); _sy.crossVectors(_sx, _sw).normalize();
        const breathe = (1 + 0.35 * Math.sin(time * 0.9 + d * 0.03)) * (1 + 1.3 * wheel);
        // on the last straight the ribbon opens round the camera: wide and under us where we are, closing again ahead, so they come in from the lower corners
        const leg = smoothstep(guide.dWin - 135, guide.dWin - 85, d), fun = leg * (1 - smoothstep(guide.dWin - 12, guide.dWin + 2, d)) * (1 - smoothstep(14, 48, _sv.distanceTo(_cw)));
        const loose = 1 + 2.6 * leg * (1 - smoothstep(guide.dWin - 45, guide.dWin - 8, d));   // a loose stream up the fountain's face, drawn in to the window only at the last
        const ox = swOff[i * 3] * breathe * loose * (1 + 1.5 * fun), oy0 = swOff[i * 3 + 1] * breathe * loose;
        _sv.addScaledVector(_sx, ox).addScaledVector(_sy, lerp(oy0, -Math.abs(oy0) * 1.3 - 2.2, fun));
        dartPos[i * 4] = _sv.x; dartPos[i * 4 + 1] = hide ? -900 : _sv.y; dartPos[i * 4 + 2] = _sv.z; dartPos[i * 4 + 3] = 1.0 + 0.3 * leg;
        dartDir[i * 4] = _sw.x; dartDir[i * 4 + 1] = _sw.y; dartDir[i * 4 + 2] = _sw.z; dartDir[i * 4 + 3] = swOff[i * 3 + 2] * 7;
      }
      for (let i = 0; i < N_SK; i++) {
        const k = i % 3, sk = skein[k], sg = Math.sign(sk.sp), a = sk.a0 + time * sk.sp - sg * skLag[i * 3] * 0.9, thick = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(a * 5 + time * 0.25 + k));
        const sa = Math.sin(a), ca = Math.cos(a), x = AX + sa * sk.r, z = AZ + ca * sk.r;
        const y = crestTop(a) + sk.y + Math.sin(a * 2 + k) * 30 + clamp(skLag[i * 3 + 1], -52, 52) * thick + 14 * Math.sin(a * 23 + skLag[i * 3 + 2]);   // (never less than 190 m, three degrees and more, above the highest tooth beneath)
        farPos[i * 4] = x; farPos[i * 4 + 1] = y; farPos[i * 4 + 2] = z; farPos[i * 4 + 3] = 5;
        farDir[i * 4] = ca * sg; farDir[i * 4 + 1] = 0; farDir[i * 4 + 2] = -sa * sg; farDir[i * 4 + 3] = skLag[i * 3 + 2];
        farSide[i * 3] = -0.47 * sa; farSide[i * 3 + 1] = 0.88; farSide[i * 3 + 2] = -0.47 * ca;      // banked toward the garden, so each speck shows its two wings
      }
      const headP = (pathU - 0.62) * 2070;                             // about 45 m/s from path u 0.62
      for (let i = 0; i < N_PO; i++) {
        let d = headP - poLag[i * 4] + 4 * Math.sin(time * 0.7 + poLag[i * 4 + 3]);
        const on = d > 0; d = ((d % pour.run) + pour.run) % pour.run;
        { const t = d / pour.run; d = pour.run * t * (1.25 - 0.25 * t); }   // they slow and close up a little as they near the hole
        pour.at(d, _sv); pour.at(d + 2, _sw); _sw.sub(_sv); if (_sw.lengthSq() < 1e-6) _sw.set(0, 0, 1);
        _sx.crossVectors(_sw, winD); if (_sx.lengthSq() < 1e-4) _sx.set(0, 1, 0); _sx.normalize(); _sy.crossVectors(_sx, _sw).normalize();
        const wide = (1 + 0.25 * Math.sin(time * 0.9 + d * 0.05)) * (1 - 0.72 * smoothstep(pour.run - 70, pour.run - 6, d));   // a loose ribbon up the sky, drawn in to the window's width at the last
        _sv.addScaledVector(_sx, poLag[i * 4 + 1] * wide).addScaledVector(_sy, poLag[i * 4 + 2] * wide * 0.55);
        pourPos[i * 4] = _sv.x; pourPos[i * 4 + 1] = on ? _sv.y : -900; pourPos[i * 4 + 2] = _sv.z; const dc = _sv.distanceTo(_cw), cut = i % 5 === 0 ? 1e6 : 80 + 90 * hash(i * 3.71 + 1.9);   // from far only some are drawn: one in five always, each of the others out to a distance of its own (never a band of half-grown specks)
        pourPos[i * 4 + 3] = (3.2 - 1.4 * smoothstep(pour.run - 60, pour.run - 8, d)) * clamp(dc / 110, 0.4, POUR_FAR) * (1 + 0.3 * smoothstep(110, 180, dc)) * (1 - smoothstep(cut, cut + 12, dc)) * smoothstep(25, 38, dc);   // (smaller as they go in at the window, so the owl and the collar stay drawn; none looms: within 110 m of the eye each keeps the size it has in the picture at 110 m, and beyond it too, out to 300 m)
        pourDir[i * 4] = _sw.x; pourDir[i * 4 + 1] = _sw.y; pourDir[i * 4 + 2] = _sw.z; pourDir[i * 4 + 3] = poLag[i * 4 + 3] * 7;
        pourSide[i * 3] = _sx.x * 2; pourSide[i * 3 + 1] = _sx.y * 2; pourSide[i * 3 + 2] = _sx.z * 2;   // (length 2: the shader's mark for the pour)
      }
      pPosA.needsUpdate = true; pDirA.needsUpdate = true; pSideA.needsUpdate = true;
      fPosA.needsUpdate = true; fDirA.needsUpdate = true; fSideA.needsUpdate = true;
      dPosA.needsUpdate = true; dDirA.needsUpdate = true;
    });
    // ---------------- bubbles climbing the great tube; the bubble that carries two cherries; the rare 30 m bubble ----------------
    const bubMat = bubbleMaterial(U);
    const bubbleMesh = (list, name) => {                              // list: [x, y, z, r, phase, speed, height, wobble]
      const n = list.length, aBub = new Float32Array(n * 4), aRise = new Float32Array(n * 4);
      list.forEach((b, i) => { aBub.set(b.slice(0, 4), i * 4); aRise.set(b.slice(4, 8), i * 4); });
      const g = quadGeo(); g.setAttribute('aBub', new THREE.InstancedBufferAttribute(aBub, 4)); g.setAttribute('aRise', new THREE.InstancedBufferAttribute(aRise, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, bubMat); m.frustumCulled = false; m.renderOrder = 20; m.name = name; return m;
    };
    {
      const list = [], nb = Math.round(72 * (0.5 + 0.5 * detail));
      for (let i = 0; i < nb; i++) { const a = rng.range(0, TAU), r = rng.range(2.2, 5.6); list.push([Math.cos(a) * r, -6, Math.sin(a) * r, rng.range(0.35, 1.6), rng(), 30 - 15.5 + rng.range(-3, 6), A.tube.length + 30, rng.range(0.1, 0.5)]); }
      const m = bubbleMesh(list, 'tube-bubbles'), holder = new THREE.Group();
      holder.position.copy(tA); holder.quaternion.setFromUnitVectors(Y, tD); holder.add(m); scene.add(holder);
      // (their speed is what is left of 30 m/s once we are moving up the tube ourselves; they also drift on the lake outside)
    }
    const carried = (R, cherryS, name, film = true) => {              // a bubble holding a pair of cherries
      const g = new THREE.Group(); g.name = name;
      if (film) g.add(bubbleMesh([[0, 0, 0, R / 0.775, 0.5, 0, 1, 0]], name + '-film'));
      const ch = new THREE.Group(); addForm(cherryGeo, name + '-cherries', ch, glazeFruit); ch.scale.setScalar(cherryS); ch.position.set(0, -R * 0.62, 0); g.add(ch);
      scene.add(g); return { g, ch };
    };
    const cb = carried(2.5, 1.45, 'cherry-bubble', false);   // (its film is the last bubble of the 'evening-bubbles' mesh: one draw call fewer, which pays for the far birds' mesh)
    let cbFilm = null;
    const big = carried(15, 6, 'rare-bubble');
    const bigRest = hoopoeSeat.clone().add(new V3(-17, 13, -13)), bigFrom = new V3(hornBase.x - 34, -18, hornBase.z - 30);
    const _cbp = new V3();
    updaters.push((dt, time, camera, u) => {
      // the cherry bubble keeps just ahead of us up the tube, leaves by the far mouth at u 0.52 and lifts away
      const k = clamp((u - (U_END - 0.083)) / 0.09, 0, 1), k2 = smoothstep(U_END - 0.023, U_END + 0.077, u);
      const s = lerp(TL - 36.7, TL + 10.3, k) + 34 * k2;
      cb.g.position.copy(tA).addScaledVector(tD, s); cb.g.position.y += 1.2 * Math.sin(time * 0.9) + 22 * k2 * k2; cb.g.position.x += 0.8 * Math.sin(time * 0.6) + 10 * k2;
      cb.ch.rotation.y = time * 0.3; cb.ch.rotation.z = 0.12 * Math.sin(time * 1.1);
      if (cbFilm) { cbFilm.setXYZ(cbFilm.count - 1, cb.g.position.x, cb.g.position.y, cb.g.position.z); cbFilm.needsUpdate = true; }
      // rare: a bubble 30 m across rises from the lake at u 0.55, settles on the horn, and the hoopoe pricks it at u 0.735
      const rise = smoothstep(0.55, 0.66, u), pop = smoothstep(0.714, 0.722, u), sc = rare ? (0.25 + 0.75 * rise) * (1 + 0.25 * pop) * (pop < 1 ? 1 : 0) * step01(u, 0.548) : 0;
      _cbp.lerpVectors(bigFrom, bigRest, rise); _cbp.y += 1.5 * Math.sin(time * 0.6); _cbp.x += 1.2 * Math.sin(time * 0.43);
      big.g.position.copy(_cbp); big.g.children[0].scale.setScalar(Math.max(sc, 1e-4));
      const fall = clamp((u - 0.718) / 0.05, 0, 1);
      big.ch.scale.setScalar(rare && u > 0.548 && fall < 1 ? 6 : 1e-4); big.ch.position.y = -15 * 0.62 - 90 * fall * fall; big.ch.rotation.y = time * 0.2;
      if (rare) { const jab = Math.sin(Math.PI * clamp((u - 0.703) / 0.03, 0, 1)); hoopoe.group.rotation.y = lerpAng(hoopoeYaw(u), Math.atan2(bigRest.x - hoopoeSeat.x, bigRest.z - hoopoeSeat.z), smoothstep(0.64, 0.7, u) * (1 - smoothstep(0.735, 0.75, u))); hoopoe.group.rotation.x = 0.5 * jab; }
    });

    // ---------------- the evening rise (outside review, round 1): as the day turns the lake lets go of its bubbles: glass balls 4 to 17 m
    // across climbing all round the fountain while the swifts pour into the window. Hidden by size until uEve (negative wobble = evening).
    {
      const list = [], nb = Math.round(96 * (0.5 + 0.5 * detail)), wa = Math.atan2(winD.x, winD.z);
      for (let i = 0, k = 0; i < nb && k < 400; k++) {
        const a = wa + (hash(k * 3.17 + 0.3) - 0.5) * (k % 3 ? 2.3 : TAU), r = 52 + 78 * Math.sqrt(hash(k * 7.31 + 1.9)), x = AX + Math.sin(a) * r, z = AZ + Math.cos(a) * r;
        if (path0.nearestXZ(x, z).dist < 11) continue;
        list.push([x, -8, z, 2.4 + 6.2 * Math.pow(hash(k * 1.93 + 4.4), 1.6), hash(k * 5.71 + 2.2), 4 + 3.5 * hash(k * 2.37 + 8.1), 150, -(0.8 + 2.2 * hash(k * 9.13))]); i++;
      }
      list.push([0, -900, 0, 2.5 / 0.775, 0.5, 0, 1, 0]);             // the cherry bubble's film (moved each frame)
      const eb = bubbleMesh(list, 'evening-bubbles'); cbFilm = eb.geometry.getAttribute('aBub'); cbFilm.setUsage(THREE.DynamicDrawUsage); scene.add(eb);
    }
    await ctx.yield();

    // ---------------- the flight ----------------
    const paceO = (w) => 1 + 0.45 * smoothstep(0.07, 0.12, w) * (1 - smoothstep(0.22, 0.28, w)) - 0.3 * smoothstep(0.34, 0.39, w) * (1 - smoothstep(0.5, 0.55, w));
    // (path u) quick down the dive, lingering over the shore among the birds, steady up the fountain's face
    const pace = (u) => { const v = oldU(u); return paceO(uo(u)) + 0.14 * smoothstep(0.63, 0.67, v) * (1 - smoothstep(0.72, 0.76, v)) - 0.24 * smoothstep(0.74, 0.78, v) * (1 - smoothstep(0.83, 0.87, v)) - 0.08 * smoothstep(0.89, 0.93, v); };   // (v: path u of the first route)
    const globeW = toW(A.globe.center);
    const pois = [                                             // from / to in path u
      { at: globeW, from: un(0.05), to: un(0.3), weight: 0.6 },
      { at: new V3(hoopoeSeat.x, 51, hoopoeSeat.z), from: un(0.49), to: un(0.67), weight: 0.78, fade: 0.25 },   // leaving the tube: the horn whole, the hoopoe on its crescent
      { at: winC, from: un(0.63), to: newU(0.69), weight: 0.7 },                                                       // the apex: the hoopoe with the globe and its window beyond
      { at: new V3(towerSpots[1][0], 118, towerSpots[1][1]), from: newU(0.635), to: newU(0.775), weight: 0.55 },            // the dive: the blue tower ahead on its lawn
      { at: new V3(AX + 10, 62, AZ), from: newU(0.735), to: newU(0.915), weight: 0.74, fade: 0.25 },                           // the low pass: the fountain whole across the water, the shore birds before it
      { at: winC.clone().add(new V3(0, -10, 0)), from: newU(0.885), to: newU(0.97), weight: 0.6, fade: 0.25 },                 // the climb: the window on the centre line
      { at: finchLook, from: un(0.262), to: un(0.335), weight: 0.5 },
      { at: new V3(-250, 30, 500), from: 0.25, to: 0.375, weight: 0.4 },                                          // the swing out to the tube: the ring over the water left of centre, the fountain standing at the frame's edge
    ];
    const _cp = new V3();
    return {
      scene, path, duration: 46, pace,
      camera: { fov: 62, near: 0.5, far: 4200, lookAhead: 22, sway: 0.5, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#' + C.ground.getHexString(), glow: 0.25, revealDistance: 320, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        camera.getWorldPosition(_cp);
        sky.position.copy(_cp);
        const eve = smoothstep(0.55, 0.76, oldU(u));                           // the day turns over the last third (path u of the first route)
        U.uEve.value = eve; pathU = u;
        skyLow.lerpColors(SKY.a[0], SKY.b[0], eve); skyMid.lerpColors(SKY.a[1], SKY.b[1], eve); skyHigh.lerpColors(SKY.a[2], SKY.b[2], eve);
        const w = uo(u);                                                       // script u (see SCRIPT u AND PATH u)
        hero.setProgress(w + (0.524 - U_END));                                // the film bursts as we pass the far mouth (a few metres short of its ring)
        hero.update(dt, time, camera);
        U.uStreakDeg.value = 35 + 9 * Math.sin(time * 0.6);
        for (const f of updaters) f(dt, time, camera, w);
      },
      dispose() { hero.dispose(); },
    };
  },
};
