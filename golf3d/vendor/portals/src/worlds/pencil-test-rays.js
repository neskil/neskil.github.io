// ARCADE OF LEAPS ("pencil-test-rays"): an animator's pencil test of a calm morning sea where devil rays leap.
// Three pencils and the paper, nothing else. Every mark is a camera-facing ribbon, a paper hull or a hatch patch in
// the unlit materials of src/parts/pencil-test-rays.js (makeStyle); colours are opaque mixes toward paper that land on
// their hex through toScene() (the inverse of the engine's tone map); the living step at twelve drawings a second,
// held lines boil at six, the camera alone is smooth. Distance is an earlier stage of the same drawing: blue
// construction beyond 220 m, rough scribble to 70 m, one clean line inside that.
//
// LAYOUT (world space): the eye enters at (0, 1.25, 0) heading -Z, skimming a flat sheet of paper (y 0) as a ray breaks the
// surface in front of it; climbs to 11 m (the gaze tips up into the sky under a leap, then down onto the back of a ray
// gliding below, its hatch shadow on the water); comes down through a swing of 25 degrees right past a FISHING BOAT (u 0.25:
// two stick figures, a rod bobbing on twos, the animator's note in the air beside it, a ray breaching beyond its bow) onto
// the Arcade's axis, where ONE RAY PACES THE EYE at arm's length (u 0.30 to 0.375: banking, its white belly toward us, hatch,
// gill slits, two remoras); climbs out between two feet to 10 m and looks down on A SQUADRON of seven rays gliding under it in
// a V at its own speed (u 0.39 to 0.47), comes down low and level along the outside of the colonnade (u 0.52: one bold ray at
// the top of the nearest arc), back in onto the axis; then a long left turn of 32 degrees onto the axis of the sheet's far
// margin, which stands askew to the lane, lifted and curling back over us with its lip rolled right over; tips up and climbs
// 60 m at 20 degrees through a ring of seven bodied drawings (the last leap, standing in the air) and the round peg hole.
// THE LANDMARK (round 20, THE PAINTED SHEET, the designer's brief of 10 Oct): behind our sheet's lifted margin, on the same
// pegs, stands THE NEXT SHEET, 244 m wide and 100 m high with a dog-eared corner: THE PAINTED BACKGROUND the test is drawn
// for. A sea in two flat tones, a warm band with a low half sun of bare paper, a sky in two: brush bands with uneven edges and
// slivers of bare paper, in the paper's own blue taken deeper and lighter and one warm tone from the paper, opaque and flat at
// every distance (paint is the stage AFTER the clean line, so this one thing is not an earlier stage with distance). On it the
// huge ray INKED (a bold line, a tone on its back with spine and ribs, a white belly, a hatch shadow on the painted sea; two
// poses flipped), and over the paint in the blue pencil the field guide, the arc of action and the ringed frame number. A bold
// line round its edge, the dog-ear's underside in bare paper, its peg slots dark, a hatch shadow where it stands behind our
// margin. It is in sight from the first frame and grows all the way: the whole flight is a run toward it.
// PAINT HAS BEGUN ON OUR OWN SHEET (round 20), BY PLACE: loose dry strokes of the paper's blue along the swell, none before the
// fishing boat's lane metre, densest where the far margin lifts, thinning to nothing 105 to 160 m either side of the lane.
// Fixed paint of the sheet: a lattice in the swell's frame from the lane's origin, every stroke from typed hashes of its row
// and cell; under a stroke the sea's blue ruling and the lane's blue guides are rubbed out. Nothing of it reads the eye, a
// clock, a seed's number or a place of the review.
// MORE RAYS IN THE MIDDLE (round 20): between the lane metre where the last ray of the squadron comes down (the furthest
// landing of its seven leaps, near lane metre 129; the squadron stands where it always stood) and the long
// left turn (lane metre 352) the lane's shoal has a hundred more rays, one in four at one and a half times and the rest at a
// half, dealt from the shoal's own stream after its last draw of before. Over 12 m of the lane at either end of that band a ray
// is only its blue oval, drawn on or rubbed back by its own place along the lane: a rule of the lane's metres on every seed.
// So "three pencils and the paper, nothing else" now holds for the test itself; the painted background and the first wash on
// our sheet are paint.
// Every leap is first its plan (the arc of action, its spacing ticks, blue ovals for the drawings not yet made); one bodied
// ray (paper hull, back in tone with spine and ribs, bold line, hatch shadow) leaps it and rubs the plan out as it goes.
// NOTHING IS HELD behind a ray (a ruling: this world shows the drawings not yet made). The plan is drawn under the bodies.
// TONE: near, middle and far are three values: the nearest backs in the softest, darkest pencil, cross-hatched hearts to the
// shadows, a wash of graphite in streaks along the swell on the far sea and under the horizon, pale hard line beyond.
// A cleaned shoal ray is drawn only while it is whole inside the frame (nearer, it is still its blue oval).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeStyle, makeLeapPool, ribbonGeometry, PALETTE, LANE, DIGITS, BACK_GLSL, toSceneColor } from '../parts/pencil-test-rays.js';

const DEG = Math.PI / 180;
const PAPERS = [
  { name: 'cream bond', pal: PALETTE, sheet2: '#FFF9E8' },
  { name: 'newsprint', pal: ['#EFE2B2', '#262624', '#A29D8A', '#D3CAA4', '#86C2E2', '#3F9A52'], sheet2: '#F8EFCB' },
  { name: 'punched white', pal: ['#F3F1EA', '#5A3A26', '#B5A292', '#DCD3C7', '#B9A8E8', '#D9472F'], sheet2: '#FBFAF4' },
];
const STAGES = [
  { name: 'pencil test', stage: [70, 220, 7.2] },
  { name: 'rough pass', stage: [25, 200, 4] },
  { name: 'final line', stage: [150, 430, 9] },
];

export default {
  id: 'pencil-test-rays',
  name: 'Arcade of Leaps',
  category: 'ocean',
  weirdness: 0.4,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    // ---------- the edition (seeded): stage of production, paper and pencils, weather, cast, hour ----------
    const ed = rng.fork('papers');                               // the edition has its own stream of draws
    const stageV = STAGES[ed.pick([0, 0, 0, 1, 2, 2])];
    const paperV = PAPERS[ed.pick([0, 0, 0, 1, 1, 2, 2])];
    const weather = ed.pick(['calm', 'calm', 'breeze', 'breeze', 'shower']);
    const mantas = ed.chance(0.28);
    const terns = ed.chance(0.4), dhow = ed.chance(0.35);
    const lowSun = vary.hour === 'dawn' || vary.hour === 'golden' || ((vary.hour ?? 'any') === 'any' && rng.chance(0.3));
    const rare = !!vary.rare;
    const pal = paperV.pal, exposure = 1;
    const duration = 40;

    const scene = new THREE.Scene();
    // a display colour as the hex of the scene value that lands on it (the same inverse of the tone map as toScene() in the shaders)
    const sceneHex = (hex) => { const c = toSceneColor(new THREE.Color(hex), exposure); return '#' + c.getHexString(); };
    const style = makeStyle(pal, { exposure, stage: stageV.stage });
    scene.background = null;
    const disposables = [];
    const lineMat = style.lineMaterial();                       // every held stroke of the world shares this
    const addStrokes = (strokes, parent = scene, order = 1) => {
      const m = new THREE.Mesh(ribbonGeometry(strokes), lineMat); m.frustumCulled = false; m.renderOrder = order; parent.add(m); return m;
    };

    // ---------- geometry of the course ----------
    const TURN = 25 * DEG, RT = 100 / TURN;                      // the swing: 100 m of arc
    const laneDir = new THREE.Vector3(Math.sin(TURN), 0, -Math.cos(TURN));
    const laneRight = new THREE.Vector3(-laneDir.z, 0, laneDir.x);
    const L0 = new THREE.Vector3(RT * (1 - Math.cos(TURN)), 0, -150 - RT * Math.sin(TURN));     // where the lane begins (s = 0)
    const lanePt = (s, x = 0, y = 0) => new THREE.Vector3().copy(L0).addScaledVector(laneDir, s).addScaledVector(laneRight, x).setY(y);
    style.uniforms.uSun.value.set(laneRight.x, laneRight.z);     // hatch falls to the right of the lane, away from the sun circle

    // ---------- the hero: the Arcade ----------
    const hero = await buildHero(ctx, { palette: pal, detail, style, exposure, stage: stageV.stage, sea: false, sky: false,
      somersault: mantas, shadowLen: lowSun ? 1.3 : 0.45, takeoff: { [-2]: 4.2, 0: 4.0, 2: 3.3, 6: 5.2, 18: 4.5 } });   // (arch 2's ray is down before the eye climbs through its crown)
    hero.object.position.copy(lanePt(LANE.zStart));
    hero.object.rotation.y = -TURN;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();

    // THE FAR MARGIN stands askew to the lane: the sheet's edge runs 32 degrees off square, so all down the Arcade the curled
    // page is seen from an angle, its near end on the left, receding to the right. The course leaves the lane in a long left
    // turn (radius 90 m from s 352) onto the page's own axis; page coordinates: s along that axis (400 where the turn ends), x across.
    const PHI = 32 * DEG, RP = 90, S_T = 352;
    const pDir = new THREE.Vector3(Math.sin(TURN - PHI), 0, -Math.cos(TURN - PHI)), pRight = new THREE.Vector3(-pDir.z, 0, pDir.x);
    const PE = lanePt(S_T + RP * Math.sin(PHI), -RP * (1 - Math.cos(PHI)));
    const pagePt = (s, x = 0, y = 0) => new THREE.Vector3().copy(PE).addScaledVector(pDir, s - 400).addScaledVector(pRight, x).setY(y);
    // THE COURSE moves the eye like an animator's camera over the sheet. First course [metres along, height]: a skim 1.25 m
    // over the water, a climb to 11 m (the gaze tips up into the sky, then down onto the back of a leaping ray), and down
    // again through the swing to meet the pacing ray at 2 m.
    const FIRST = [[0, 1.25], [28, 1.25], [46, 1.6], [62, 3.0], [82, 6.6], [100, 10.2], [114, 11.4], [128, 11.0], [150, 7.8]];
    const SWING = [[5, 4.4], [10, 2.5], [15, 2.2], [20, 2.6]];
    // THROUGH THE ARCADE in an S, so the colonnade is seen head-on, from outside and from under its crowns: down the axis
    // to the fifth arch, out between two right feet (s 59) and low over the water along the outside of the colonnade (15 m
    // right of the axis), back in between two feet (s 156) banking, up among the crowns of the large arches (s 250), down
    // onto the axis again for the last plans and the turn to the page.  [s along, x across, y]
    const COURSE = [[0, 0, 2.8], [18, 0.2, 2.9], [37, 1.9, 6.2], [58.5, 8.5, 10.4], [82, 13.6, 9.6], [104, 16.3, 5.4], [124, 17, 2.3], [150, 13, 1.7], [172, 6.5, 2], [195, 4.7, 2.4], [215, 4.5, 2.5], [250, -1, 2.3], [285, -2.5, 2.1], [320, -1, 2], [352, 0, 2]];
    const CLIMB = [[400, 2], [410, 2.9], [428.8, 9.7], [447.6, 16.6], [466.4, 23.4]];
    const pts = [];
    for (const [d, y] of FIRST) pts.push([0, y, -d]);
    for (const [a, y] of SWING) pts.push([RT * (1 - Math.cos(a * DEG)), y, -150 - RT * Math.sin(a * DEG)]);
    for (const [s, x, y] of COURSE) pts.push(lanePt(s, x, y));
    for (const a of [8, 16, 24]) pts.push(lanePt(S_T + RP * Math.sin(a * DEG), -RP * (1 - Math.cos(a * DEG)), 2));
    for (const [s, y] of CLIMB) pts.push(pagePt(s, 0, y));
    const path = makePath(pts);
    const seat = pagePt(466.4, 0, 23.4);

    // ---------- sky: bare paper, and what the animator left on it (all of it follows the eye, at infinity) ----------
    const skyG = new THREE.Group(); scene.add(skyG);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 16, 10), style.skyMaterial());
    dome.renderOrder = -10; dome.frustumCulled = false; skyG.add(dome);
    const RS = 2400;
    // a point of the sky: az in degrees from the first course (-Z) toward the right (+X), el in degrees up
    const sky = (az, el, r = RS) => [r * Math.cos(el * DEG) * Math.sin(az * DEG), r * Math.sin(el * DEG), -r * Math.cos(el * DEG) * Math.cos(az * DEG)];
    const skyOval = (az, el, w, h, turns = 1, tilt = 0, wob = 0.03, n = 26) => {
      const o = [], a0 = rng() * 6.28, ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i <= Math.round(n * turns); i++) {
        const a = a0 + i / n * 6.2832, r = 1 + wob * Math.sin(a * 3 + a0) + (i / n) * wob * 1.5;
        const x = Math.cos(a) * w * r, y = Math.sin(a) * h * r;
        o.push(sky(az + (x * ct - y * st) / Math.max(0.2, Math.cos(el * DEG)), el + x * st + y * ct));
      }
      return o;
    };
    const AX = 25;                                               // azimuth of the Arcade's axis
    const skyS = [];
    // the sun: a circle drawn twice round with its blue construction cross, far to the left of the Arcade
    const sunAz = AX - 62, sunEl = lowSun ? 14 : 23;
    skyS.push({ pts: skyOval(sunAz, sunEl, 3.1, 3.1, 2.08, 0, 0.02, 40), pencil: 0, press: 2.3, taper: false, seed: 3.1 });
    // (its blue construction cross is only a centre mark now, and the hand has pencilled the rays in: long and short by turns)
    skyS.push({ pts: [sky(sunAz - 1.3, sunEl - 0.05), sky(sunAz + 1.4, sunEl + 0.05)], pencil: 1, press: 1.3, seed: 4 });
    skyS.push({ pts: [sky(sunAz + 0.05, sunEl - 1.3), sky(sunAz - 0.05, sunEl + 1.4)], pencil: 1, press: 1.3, seed: 5 });
    for (let i = 0; i < 14; i++) {
      const a = (i + 0.3 * Math.sin(i * 2.7)) / 14 * 6.2832, r0 = 4.3 + 0.3 * Math.sin(i * 1.9), r1 = r0 + (i % 2 ? 1.5 : 3.0) + 0.5 * Math.sin(i * 3.3), ce = Math.max(0.2, Math.cos(sunEl * DEG));
      if (sunEl + Math.sin(a) * r1 < 1.2) continue;                // (none below the ruled horizon)
      skyS.push({ pts: [sky(sunAz + Math.cos(a) * r0 / ce, sunEl + Math.sin(a) * r0), sky(sunAz + Math.cos(a + 0.03) * r1 / ce, sunEl + Math.sin(a + 0.03) * r1)], pencil: 0, press: i % 2 ? 1.5 : 2.0, seed: 30 + i });
    }
    skyS.push({ pts: skyOval(sunAz, sunEl, 3.5, 3.4, 1.1, 0.3, 0.04, 30), pencil: 1, press: 1.3, taper: false, seed: 6 });
    // four field-guide corner marks, and the long blue horizon guide that overshoots the ruled horizon at both ends
    for (const [a, e, sa, se] of [[-40, 25, 1, -1], [40, 25, -1, -1], [AX - 34, 3.5, 1, 1], [AX + 34, 3.5, -1, 1]]) {
      skyS.push({ pts: [sky(a, e + se * 4.5), sky(a, e), sky(a + sa * 6, e)], pencil: 1, press: 1.7, taper: false, seed: a + e });
      skyS.push({ pts: [sky(a - sa * 1.2, e), sky(a + sa * 1.5, e)], pencil: 1, press: 1.3, seed: a - e });
    }
    {
      const hz = []; for (let a = -78; a <= 118; a += 4) hz.push(sky(a, 0.42 + 0.05 * Math.sin(a * 0.3)));
      skyS.push({ pts: hz, pencil: 1, press: 1.6, seed: 9 });
      // the ruled graphite horizon: one sure line all the way round, drawn in four pulls of the ruler
      for (let q = 0; q < 4; q++) { const g = []; for (let a = q * 90 - 60; a <= q * 90 + 33; a += 3) g.push(sky(a, 0.0)); skyS.push({ pts: g, pencil: 0, press: 2.1, seed: 20 + q }); }
    }
    addStrokes(skyS, skyG, -5);
    await ctx.yield();

    // five clouds: one loose graphite contour each that does not quite close, the blue ovals it was built from left inside.
    // The whole set is re-drawn a little further along every second (update steps the mesh round).
    // (round 17) The clouds are drawn larger: each CLOUD_GROW times as tall, and as wide as the sky's own layout leaves room.
    // The sun with its rays is taken as SUN_REACH degrees about its place: a cloud at the sun's height that cannot keep
    // CLOUD_GAP degrees of paper from it at the width it was first drawn keeps its first size, height and width, so no
    // cloud comes nearer the sun than it was first drawn. The cloud sheet turns to the right as the seconds pass (update),
    // so a cloud right of the sun only leaves it; a cloud standing LEFT of the sun is carried toward it and keeps its
    // first size too. Where two clouds stand at one height their widths are held so that CLOUD_GAP degrees stay between
    // them, and no cloud is narrower than it was first drawn. All of it is worked out here, once, from the fixed places
    // of the sky (azimuth and elevation in degrees); every draw is taken as before.
    const CLOUD_GROW = 1.8, CLOUD_GAP = 2.5, SUN_REACH = 9;
    const cloudL = [[-21, 12.5, 8.5, 2.6], [3, 20, 6, 1.9], [AX - 3, 24, 9, 2.4], [AX + 27, 13, 7.5, 2.5], [72, 10, 9, 2.8], [-58, 9, 7, 2.2]].slice(0, 5 + (weather === 'calm' ? 0 : 1))
      .map(([az, el, w, h]) => ({ az, el, w0: w, h0: h, w: w * CLOUD_GROW, h: h * CLOUD_GROW }));
    {
      const band = (c) => [c.el - 0.3 * c.h, c.el + 1.3 * c.h];                                  // a cloud's contour: 0.3 h under its line, 1.3 h over it
      const meet = (a, b) => !(a[0] > b[1] + CLOUD_GAP || b[0] > a[1] + CLOUD_GAP);              // at one height
      const first = (c) => { c.w = c.w0; c.h = c.h0; };
      for (const c of cloudL) {                                                                  // the sun first
        if (c.az < sunAz) { first(c); continue; }
        if (!meet(band(c), [sunEl - SUN_REACH, sunEl + SUN_REACH])) continue;
        const room = c.az - sunAz - SUN_REACH - CLOUD_GAP;
        if (room < c.w0) first(c); else c.w = Math.min(c.w, room);
      }
      for (let i = 0; i < cloudL.length; i++) for (let j = i + 1; j < cloudL.length; j++) {      // then cloud and cloud
        const ca = cloudL[i], cb = cloudL[j];
        if (!meet(band(ca), band(cb))) continue;
        const room = Math.abs(ca.az - cb.az) - CLOUD_GAP;
        if (ca.w + cb.w <= room) continue;
        if (room < ca.w0 + cb.w0) { first(ca); first(cb); continue; }
        const k = room / (ca.w + cb.w); let wa = ca.w * k, wb = cb.w * k;
        if (wa < ca.w0) { wa = ca.w0; wb = room - wa; } else if (wb < cb.w0) { wb = cb.w0; wa = room - wb; }
        ca.w = wa; cb.w = wb;
      }
    }
    const cloudS = [];
    for (const { az, el, w, h } of cloudL) {
      const c = [], n = 46, a0 = -0.35 + rng() * 0.2, bumps = rng.int(3, 5), sd = rng() * 50;
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * 6.0, cx = Math.cos(a), sy = Math.sin(a);
        const y = sy > 0 ? sy * (0.75 + 0.55 * Math.abs(Math.sin(a * bumps * 0.5 + sd))) : sy * 0.3;
        c.push(sky(az + cx * w * (1 + 0.06 * Math.sin(a * 5 + sd)), el + y * h));
      }
      cloudS.push({ pts: c, pencil: 0, press: (t) => 1.5 + 0.9 * Math.sin(t * 9 + sd) ** 2, seed: sd });
      const no = rng.int(3, 4);
      for (let k = 0; k < no; k++) {
        const fx = (k + 0.5) / no * 2 - 1;
        cloudS.push({ pts: skyOval(az + fx * w * 0.62, el + h * (0.28 + 0.2 * rng()), w * (0.34 + 0.12 * rng()), h * (0.62 + 0.2 * rng()), 1.25, rng.range(-0.2, 0.2), 0.04, 22), pencil: 1, press: 1.25, taper: false, seed: sd + k });
      }
    }
    if (weather === 'shower') {                                  // a far shower: blue ruled dashes slanting from the furthest cloud
      for (let i = 0; i < 26; i++) {
        const a = 60 + rng() * 22, e0 = 7.5 - rng() * 1.5;
        for (let e = e0; e > 0.8; e -= 2.1) cloudS.push({ pts: [sky(a - (e0 - e) * 0.28, e), sky(a - (e0 - e + 1.2) * 0.28, e - 1.2)], pencil: 1, press: 1.2, seed: i + e });
      }
    }
    const clouds = addStrokes(cloudS, skyG, -5);
    // six frigatebirds high up: a blue oval and one graphite wing tick each, wheeling in steps
    // (round 18) each bird lies over what the sky holds behind it: its oval and the paper under its wings are bare paper
    // laid after the clouds and before the bird's own lines (the order of drawing: a cloud's contour stops at a bird)
    const frigS = [], frigP = [];
    for (let i = 0; i < 6; i++) {
      const az = -30 + i * 11 + rng.range(-3, 3), el = 30 + rng.range(-4, 6) - Math.abs(i - 2.5) * 1.5, s = rng.range(0.8, 1.2), tl = rng.range(-0.4, 0.4);
      const ov = skyOval(az, el, 1.5 * s, 0.6 * s, 1.2, tl, 0.05, 16);
      const wg = [sky(az - 2.6 * s, el - 0.5 * s + tl), sky(az - 1.1 * s, el + 0.75 * s), sky(az, el + 0.1 * s), sky(az + 1.2 * s, el + 0.8 * s), sky(az + 2.7 * s, el - 0.4 * s - tl)];
      frigS.push({ pts: ov, pencil: 1, press: 1.2, taper: false, seed: i * 3.3 });
      frigS.push({ pts: wg, pencil: 0, press: 1.6, seed: i * 5.1 });
      const c = sky(az, el);
      for (let k = 0; k < ov.length - 1; k++) frigP.push(c, ov[k], ov[k + 1]);
      frigP.push(wg[0], wg[1], wg[2], wg[2], wg[3], wg[4], wg[0], wg[2], wg[4]);
    }
    const frigates = addStrokes(frigS, skyG, -4.8);
    {
      const n = frigP.length, pos = new Float32Array(n * 3), idx = [];
      for (let k = 0; k < n; k++) pos.set(frigP[k], k * 3);
      for (let k = 0; k < n; k += 3) idx.push(k, k + 1, k + 2, k, k + 2, k + 1);                 // both windings: the dome's paper is drawn from inside
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); disposables.push(g);
      const pm = style.skyMaterial(); pm.depthTest = false;                                       // (the strokes of the sky stand a hair nearer in depth than their own places)
      const m = new THREE.Mesh(g, pm); m.frustumCulled = false; m.renderOrder = -4.9; frigates.add(m);
    }
    await ctx.yield();

    // ---------- the sea: a flat sheet of paper ruled with the blue perspective grid ----------
    // Two constructions meet at a ruled seam 30 m before the lane: the first squared to the first course, the second
    // to the Arcade. Past the far margin (and under its lifted part) lies the next sheet.
    const SEAT_S = 466.4, SEAT_Y = 23.4, FLAT = 9, GAP = 0.12;    // the hole's centre on the lane (m along, m up); half the flat patch; the sheet stands this far in front of the portal
    const CURL_R = (SEAT_Y - GAP * 0.342 - FLAT * 0.93969) / 1.34202, CURL_A = CURL_R * 110 * DEG;
    const FTOP = 13, ROLL_R = 4, ROLL_A = 235, ROLL_LEN = ROLL_R * ROLL_A * DEG;      // the flat patch above the hole; the lip: a scroll that hangs toward us
    const HOLE_V = CURL_A + FLAT, ROLL_V = HOLE_V + FTOP, PAGE_LEN = ROLL_V + ROLL_LEN, P2_RISE = 72, P2_HALF = 122, P2_LEN = ROLL_V + P2_RISE, PAGE_HALF = 150;
    const LIFT = SEAT_S - GAP * 0.93969 - (CURL_R * 0.93969 - FLAT * 0.34202), EDGE = LIFT + PAGE_LEN;
    // (roll 2: the NEXT SHEET, standing behind this one on the same pegs: it goes on up past our sheet's lip for 84 m, its top flopping back)
    const curlAt = (v, roll = 1) => (v < CURL_A ? 110 * v / CURL_A : v < ROLL_V ? 110 : roll === 2 ? 110 - 34 * Math.min(1, (v - ROLL_V) / 66) ** 2 * (3 - 2 * Math.min(1, (v - ROLL_V) / 66)) : 110 + roll * ROLL_A * Math.min(1, (v - ROLL_V) / ROLL_LEN)) * DEG;
    const sheet2 = new THREE.Color(paperV.sheet2);
    // (round 20) THE PAINTED SHEET (the owner's brief of 10 Oct): the washes of the next sheet are flat tones of THIS PAPER'S OWN BLUE (entry 5
    // of its six) taken deeper and lighter, and one warm tone taken from the paper itself. They are fixed colours of the paint: the blue pencil's
    // standing back inside the Arcade (round 19) does not touch them.
    const hslOf = (hex) => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, c = mx - mn;
      return [c === 0 ? 0 : (mx === r ? ((g - b) / c + 6) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4) / 6, c === 0 ? 0 : c / (1 - Math.abs(2 * l - 1)), l]; };
    const toneOf = (hex, ds, dl, sMax = 1) => { const [h, s, l] = hslOf(hex); return new THREE.Color().setHSL(h, Math.min(sMax, Math.max(0, s + ds)), Math.min(1, Math.max(0, l + dl)), THREE.SRGBColorSpace); };
    const paintU = { value: new THREE.Vector4(1e6, 1e6 + 1, 0, 0) };       // the first wash on our own sheet: where along the lane it begins and where it is densest (set where the fishing boat is placed)
    // The light sky is the blue mixed 0.70 toward the sheet: paler than the blue pencil even at the half strength it has while the eye is in
    // the Arcade (round 19; one blue is one pencil), so the field guide, the arc of action and the ringed number drawn over the paint in
    // that pencil can be read on it on every metre of the flight.
    const washU = { uWSeaD: { value: toneOf(pal[4], -0.06, -0.20) }, uWSeaL: { value: toneOf(pal[4], 0, -0.05) }, uWWarm: { value: toneOf(pal[0], 0.30, -0.07, 0.8) },
      uWSkyL: { value: new THREE.Color(pal[4]).lerp(sheet2, 0.70) }, uWSkyD: { value: toneOf(pal[4], 0.02, -0.11) } };
    const PP0 = pagePt(0, 0);
    const laneU = { uL0: { value: new THREE.Vector4(L0.x, L0.z, laneDir.x, laneDir.z) }, uP0: { value: new THREE.Vector4(PP0.x, PP0.z, pDir.x, pDir.z) }, uSheet2: { value: sheet2 },
      uPage: { value: new THREE.Vector4(LIFT, EDGE, PAGE_HALF, 0) } };
    const GRID_GLSL = /* glsl */`
      uniform vec4 uL0, uP0, uPage, uTick; uniform vec3 uSheet2;
      float gridLine(float x, float fw, float px){ float d = abs(fract(x - 0.5) - 0.5)/max(fw, 1e-5); return 1. - smoothstep(px*0.5 - 0.5, px*0.5 + 0.5, d); }
      // 10 m cells while a cell is wider than ~7 px, then every fifth line, then bare paper
      float ruled(vec2 q, vec2 fw, float reach){
        vec2 fine = vec2(gridLine(q.x, fw.x, 1.3), gridLine(q.y, fw.y, 1.3))*(1. - smoothstep(0.06*reach, 0.13*reach, fw));
        vec2 q5 = q/5., fw5 = fw/5.;
        vec2 coarse = vec2(gridLine(q5.x, fw5.x, 1.5), gridLine(q5.y, fw5.y, 1.5))*(1. - smoothstep(0.045, 0.1, fw5));
        return max(max(fine.x, fine.y), max(coarse.x, coarse.y));
      }
      // quick hatch in whole strokes, each about a pencil line and a half wide whatever the distance; where the tone ends the
      // strokes end, raggedly, one by one (no fade). fwB = fwidth(p.x*0.62 + p.y*0.78), taken by the caller outside any branch
      float hatchW(vec2 p, float fwB, float dist, float mask){
        float per = 0.5*exp2(floor(log2(max(dist, 6.)/20.)));
        float ph = (p.x*0.62 + p.y*0.78)/per + 0.35*vnoise2(p*0.36/per) + 0.09*(hash11(clock6() + 7.) - 0.5);
        float fw = max(fwB/per, 1e-4);
        float row = floor(ph), f = abs(fract(ph) - 0.5), along = (p.x*0.78 - p.y*0.62)/per;
        float brk = step(0.2, vnoise2(vec2(along*0.3 + row*7.3, row*1.7)));
        float hw = clamp(0.0024*dist/per, 0.07, 0.19);
        float line = (1. - smoothstep(hw - fw, hw + fw, f))*brk*step(0.12 + 0.76*hash11(row*1.37 + 2.), mask);
        return mix(line, 1.7*hw*step(0.5, mask), smoothstep(0.28, 0.4, fw));
      }
      vec2 laneXS(vec2 w){ vec2 d = w - uL0.xy; return vec2(d.x*(-uL0.w) + d.y*uL0.z, dot(d, uL0.zw)); }   // x across (right +), s along
      vec2 pageXS(vec2 w){ vec2 d = w - uP0.xy; return vec2(d.x*(-uP0.w) + d.y*uP0.z, dot(d, uP0.zw)); }   // the same in the far margin's own frame
      // (round 20) PAINT HAS BEGUN ON OUR OWN SHEET, BY PLACE: the first wash of the sea, loose strokes of the paper's blue laid along the
      // swell. A stroke's place comes from the sheet's metres (rows 1.3 m apart across the swell, counted from the lane's origin) and a
      // typed hash (where a row's strokes start, which are laid, how long and how broad each is). How many are laid is a rule of the
      // lane's metres alone: none before the fishing boat, most by the far margin, thinning to nothing 105 to 160 m either side of the
      // lane. Nothing here reads the eye, the clock, a still's position or a seed's number; fwidth only softens the edge.
      uniform vec4 uPaint; uniform vec3 uWPaint;      // lane metre of the fishing boat, lane metre of the far margin on the lane's axis | the paint
      float paintAt(vec2 w){
        vec2 d = w - uL0.xy, wd = vec2(cos(uTick.w), sin(uTick.w)), wn = vec2(-wd.y, wd.x);
        vec2 p = vec2(dot(d, wd), dot(d, wn));                              // metres along the swell, metres across it
        float aa = max(fwidth(p.y), 1e-3);
        float row = floor(p.y/1.3), fy = p.y/1.3 - row - 0.5, off = hash11(row*1.71 + 3.)*7.;
        float ci = floor(p.x/34. + off), fx = p.x/34. + off - ci - 0.5;
        vec2 xs = laneXS(uL0.xy + wd*((ci + 0.5 - off)*34.) + wn*((row + 0.5)*1.3));        // the stroke's own middle, in lane metres
        float dens = 0.9*pow(clamp((xs.y - uPaint.x)/(uPaint.y - uPaint.x), 0., 1.), 1.1)*(1. - smoothstep(105., 160., abs(xs.x)));
        vec2 id = vec2(ci, row);
        float hl = 0.24 + 0.22*hash21(id + 5.3), hw = 0.10 + 0.13*hash21(id + 9.1), n = vnoise2(vec2(p.x*0.16, row*3.7 + 1.));
        float qx = fx/hl, hwn = hw*(0.7 + 0.6*n), qy = (fy + 0.1*(n - 0.5))/hwn;
        float qq = sqrt(qx*qx + qy*qy), aq = aa/(hwn*1.3);
        float cov = (1. - smoothstep(1. - aq, 1. + aq, qq))*step(hash21(id*vec2(0.731, 1.137) + 11.7), dens - 1e-4);
        float dry = mix(step(0.63 - 0.38*smoothstep(0.2, 1., abs(qx)), vnoise2(vec2(p.x*0.035 + row*5.1, p.y*16.))), 0.22, smoothstep(0.02, 0.08, aa));      // the bristles leave threads of bare paper along the stroke, more toward its ends where the brush runs dry
        return cov*(1. - dry);
      }
    `;
    const seaMat = new THREE.ShaderMaterial({
      uniforms: { ...style.uniforms, ...laneU, uTick: { value: new THREE.Vector4(0, 0, 200, 0.8) }, uPaint: paintU, uWPaint: { value: new THREE.Color(pal[4]) } }, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: style.GLSL + GRID_GLSL + /* glsl */`
        varying vec3 vW;
        void main(){
          float dist = max(length(vW - cameraPosition), 0.3), g = grainAt(vW, dist);
          vec2 xs = laneXS(vW.xz);
          vec2 qa = vW.xz/10. + vec2(0.5, 0.), qb = xs/10. + vec2(0.5, 0.);
          vec2 fa = fwidth(qa), fb = fwidth(qb);
          vec2 hp = vec2(xs.x, -xs.y); float fwB = fwidth(hp.x*0.62 + hp.y*0.78), fwC = fwidth(hp.y*0.62 - hp.x*0.78);       // (the hatch is re-traced six times a second, like every held line)
          float seam = xs.y + 30.;
          float line = seam > 0. ? ruled(qb, fb, 1.) : ruled(qa, fa, 1.);
          // the seam itself: ruled twice, a little apart
          float fs = max(fwidth(seam), 1e-4);
          line = max(line, (1. - smoothstep(0.6, 1.6, abs(seam)/fs))*step(abs(xs.x), 380.));
          line = max(line, (1. - smoothstep(0.6, 1.6, abs(seam + 0.9 + 0.002*xs.x)/fs))*step(abs(xs.x + 40.), 300.));
          // NEAR, MIDDLE AND FAR ARE THREE VALUES: the far sea takes a wash of graphite rubbed on with the side of the pencil, in
          // long streaks that lie along the swell (a value step toward the horizon, a second one under the horizon itself; the
          // streaks end raggedly, never fade; where they would be finer than the grain they are their flat average)
          vec2 wd = vec2(cos(uTick.w), sin(uTick.w)), wq = vec2(dot(vW.xz, wd)*0.007, dot(vW.xz, vec2(-wd.y, wd.x))*0.03); float wfw = max(fwidth(wq.x), fwidth(wq.y));
          float wn = vnoise2(wq + 3.) *0.65 + vnoise2(wq*3.1 + 9.)*0.35, far = dist + 70.*(wn - 0.5);
          float streak = mix(step(0.47, wn), 0.55, smoothstep(0.35, 0.7, wfw))*step(0.3, g);
          vec3 washC = far > 520. ? mix(uPale, uSmudge, 0.75) : far > 240. ? mix(uPale, uSmudge, 0.25) : uPale;
          vec3 col = mix(uPaper, washC, step(140., far)*streak*(far > 520. ? 1. : far > 240. ? 0.85 : 0.55));
          col = mix(col, uBlue, clamp(line, 0., 1.)*(0.55 + 0.45*smoothstep(0.1, 0.55, g)));
          // (round 20) where a stroke of the first wash lies it is flat, opaque paint: the blue grid and the graphite wash under it are gone
          col = mix(col, uWPaint, paintAt(vW.xz)*step(pageXS(vW.xz).y, uPage.x));
          // past the sheet's far margin, and under its lifted part: the next sheet, with the hatch shadow of this one
          vec2 ps = pageXS(vW.xz); float fp2 = max(fwidth(ps.y), 1e-4);
          bool under = ps.y > uPage.x && abs(ps.x) < uPage.z, beyond = ps.y > uPage.y;
          if (under || beyond){
            float rim = vnoise2(ps*0.12);
            float sh = under ? smoothstep(-95. - 14.*rim, -70., ps.x)*(1. - smoothstep(118., 150., ps.x + 14.*rim)) : 0.;
            sh = max(sh, (1. - step(uPage.y + 5. + 3.*rim, ps.y))*step(uPage.y, ps.y)*step(uPage.z, abs(ps.x)));
            col = mix(uSheet2, mix(uSmudge, uGraphite, 0.3), hatchW(hp, fwB, dist, sh));
            col = mix(col, mix(uSmudge, uGraphite, 0.6), hatchW(vec2(hp.y, -hp.x), fwC, dist, sh*step(ps.y, uPage.y - 6.)*smoothstep(-60., 40., ps.x + 30.*rim)));   // (cross-hatched, deepest under the turn of the page)
            if (beyond && abs(ps.x) >= uPage.z) col = mix(col, uGraphite, (1. - smoothstep(0.8, 1.8, (ps.y - uPage.y)/fp2))*0.8);
          }
          gl_FragColor = vec4(toScene(col), 1.);
        }` });
    const seaGeo = new THREE.CircleGeometry(2350, 64); seaGeo.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(seaGeo, seaMat); sea.position.copy(lanePt(200)); sea.renderOrder = -4; sea.frustumCulled = false; scene.add(sea);
    await ctx.yield();

    // ---------- wavelet ticks and long swell contours: a window of marks on the water that wraps round the eye ----------
    const breeze = weather === 'breeze';
    const windA = rng.range(0.5, 1.1) + (breeze ? 0.3 : 0);
    const TICK_VS = /* glsl */`
      attribute vec2 aV; attribute vec4 aT;       // u 0..1, side | base x, base z, length (m), seed
      uniform vec4 uTick;                         // eye x, z, window side, crest angle
      uniform float uThin;
      varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
      vec3 mark(vec2 c, float u, float len, float seed, float kind){
        float ang = uTick.w + (hash11(seed) - 0.5)*(kind > 1.5 ? 0.3 : 0.7);
        vec2 d = vec2(cos(ang), sin(ang)), n = vec2(-d.y, d.x);
        float x = u - 0.5;
        vec2 p = c + d*x*len + n*len*(kind > 1.5 ? 0.02*sin(u*9. + seed) : (0.25 - x*x)*(0.25 + 0.5*hash11(seed + 2.)));
        if (kind > 0.5 && kind < 1.5){ float th = u*7.6 + seed; p = c + d*(cos(th)*0.5 + x*0.9)*len + n*(sin(th)*0.32)*len; }   // a whitecap loop
        return vec3(p.x, 0.03, p.y);
      }
      void main(){
        float seed = aT.w, W = uTick.z, len = aT.z, kind = len > 6. ? 2. : len < 0. ? 1. : 0.;
        len = abs(len);
        float c12 = clock12()/12.;
        vec2 b = aT.xy + vec2(-sin(uTick.w), cos(uTick.w))*c12*(kind > 1.5 ? 0.5 : 0.9);
        b += W*floor((uTick.xy - b)/W + 0.5);
        float dist = length(vec3(b.x, 0., b.y) - cameraPosition);
        // re-drawn now and then: every mark has its own short life on the stepped clock
        float life = floor(c12*0.5 + hash11(seed + 5.)), born = hash11(seed*1.7 + life*3.1);
        float keep = kind > 1.5 ? step(dist, 330.) : kind > 0.5 ? step(dist, 230.) : step(hash11(seed*3.3 + 1.), min(1., uThin/max(dist*dist, 1.)))*step(dist, 190.);
        float show = keep*step(0.22, born);
        vec3 P = mark(b, aV.x, len, seed, kind), Q = mark(b, aV.x + 0.08, len, seed, kind);
        vec3 o = boil(vec3(0.), seed + floor(aV.x*3.), clock6(), dist);
        float press = (0.45 + 0.75*sin(3.1416*clamp(aV.x, 0.03, 0.97)))*(kind > 1.5 ? 0.8 : 1.);
        gl_Position = ribbon(P + o, Q + o, aV.y, press, 1., vPx);
        if (show < 0.5) gl_Position = vec4(0., 0., 2., 1.);
        float st = stageOf(dist);
        vCol = kind > 1.5 ? (st > 0.5 ? uPale : mix(uSmudge, uPale, 0.5)) : dist < 26. ? mix(uGraphite, uSmudge, 0.35) : st < 0.5 ? uSmudge : uPale;
        if (st > 1.5) vCol = mix(uBlue, uPaper, 0.3);
        vW = P; vUVK = vec3(aV.x*len, aV.y, show);
      }`;
    const tickU = { uTick: { value: new THREE.Vector4(0, 0, 200, windA) }, uThin: { value: 22 * 22 } };
    seaMat.uniforms.uTick.value.w = windA;
    // (round 20) where a stroke of paint lies, the blue lane guides ruled on the water under it are rubbed out: the same strokes by the same rule
    { const rub = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...laneU, uTick: seaMat.uniforms.uTick, uPaint: paintU }, side: THREE.DoubleSide, vertexShader: lineMat.vertexShader,
        fragmentShader: style.GLSL + GRID_GLSL + style.LINE_FS.replace('if (vUVK.z < 0.01) discard;', 'if (vUVK.z < 0.01 || (vW.y < 0.2 && paintAt(vW.xz) > 0.5)) discard;') });
      disposables.push(rub); hero.laneGuides.material = rub; }
    const swellU = { uTick: { value: new THREE.Vector4(0, 0, 640, windA) }, uThin: tickU.uThin };
    const stripGeo = (segs, n, fill) => {
      const aV = [], idx = [];
      for (let j = 0; j <= segs; j++) { aV.push(j / segs, -1, j / segs, 1); if (j < segs) { const v = j * 2; idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); } }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segs + 1) * 6), 3));
      g.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(aV), 2)); g.setIndex(idx);
      const aT = new Float32Array(n * 4); for (let i = 0; i < n; i++) fill(aT, i * 4, i);
      g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); g.instanceCount = n;
      return g;
    };
    const tickRng = rng.fork('ticks');
    const nTick = Math.round(7400 * detail * (breeze ? 1.15 : 1));
    const tickGeo = stripGeo(2, nTick, (a, v) => { a[v] = tickRng() * 200; a[v + 1] = tickRng() * 200; a[v + 2] = 0.35 + tickRng() * tickRng() * 1.3; a[v + 3] = tickRng() * 300; });
    await ctx.yield();
    const nSwell = Math.round(150 * detail), nCap = breeze ? Math.round(500 * detail) : 0;
    const swellGeo = stripGeo(10, nSwell + nCap, (a, v, i) => {
      const cap = i >= nSwell, W = 640;
      a[v] = tickRng() * W; a[v + 1] = tickRng() * W; a[v + 2] = cap ? -(0.7 + tickRng() * 0.9) : 16 + tickRng() * 44; a[v + 3] = tickRng() * 300;
    });
    const tickMat = style.lineMaterial(TICK_VS, tickU), swellMat = style.lineMaterial(TICK_VS, swellU);
    for (const [g, m] of [[tickGeo, tickMat], [swellGeo, swellMat]]) { const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 0; scene.add(mesh); }
    await ctx.yield();

    // ---------- the wider sea: leaps drawn by the Arcade's own shaders, in windows that wrap round the eye ----------
    // A leap is its plan first (the arc of action with its spacing ticks and the blue ovals of the drawings not yet made),
    // then ONE bold ray that leaps it, rubbing the plan out as it fills it; nothing is held behind it but its splash and
    // its hatch shadow on the water.
    const poolRng = rng.fork('pools');
    const keepSeg = (s0, x0, s1, x1) => { const a = lanePt(s0, x0), b = lanePt(s1, x1); return new THREE.Vector4(a.x, a.z, b.x, b.z); };
    const pk = (s) => pagePt(s), keep = [new THREE.Vector4(0, 40, 0, -165), keepSeg(-100, 0, 372, 0), keepSeg(35, 1.5, 90, 14.5), keepSeg(90, 14.5, 122, 17), keepSeg(122, 17, 195, 4.7), new THREE.Vector4(pk(380).x, pk(380).z, pk(470).x, pk(470).z)];
    const edgeLimit = pagePt(LIFT - 14).dot(pDir);
    const keepR = (r) => new THREE.Vector4(r, pDir.x, pDir.z, edgeLimit);
    const big = mantas ? 1.45 : 1, few = (mantas ? 0.62 : 1) * Math.min(1.06, Math.max(0.9, density)) * detail;
    const scatterLeaps = (n, W, size = 1) => Array.from({ length: n }, (_, i) => ({
      x: poolRng() * W, z: poolRng() * W, heading: poolRng() * 6.2832, phase: poolRng() * 40,
      height: poolRng.range(2.2, 5.6) * size, half: poolRng.range(1.1, 2.5) * big * size, length: poolRng.range(7, 13) * size * (mantas ? 1.2 : 1), id: i, seed: poolRng() }));
    const NEAR_R = 90;
    // near the eye: cleaned, bodied rays with their smudged backs and hatch shadows, each over the six ovals of its plan
    const poolA = makeLeapPool(style, hero.rayUniforms, { leaps: scatterLeaps(Math.round(56 * few), 190, 1.5), window: 190, from: 0, to: NEAR_R,
      skins: [4, 5], plan: 6, dark: true, hull: true, shadow: true, splash: [3], arc: [32, 12],
      period: 6.4, jitter: 50, scatter: 6.2832, keep, keepR: keepR(14), rng: poolRng });
    await ctx.yield();
    // further out: rough scribble over a blue oval, an arc being pencilled water to water (a dense, light pool) ...
    const poolB1 = makeLeapPool(style, hero.rayUniforms, { leaps: scatterLeaps(Math.round(180 * few), 340, 1.35).slice(0, Math.round(142 * few)), window: 340, from: 70, to: 170,
      skins: [4], parts: (p) => p === 0 || p === 3, hull: true, dark: true, splash: [3], arc: [16, 0], period: 6.2, jitter: 60, scatter: 6.2832, keep, keepR: keepR(28), rng: poolRng });
    await ctx.yield();
    // ... and, out to 320 m, the ones whose crowns we see opening
    const poolB = makeLeapPool(style, hero.rayUniforms, { leaps: scatterLeaps(Math.round(40 * few), 640, 1.2), window: 640, from: NEAR_R, to: 318,
      skins: [4], hull: false, splash: [3], arc: [20, 4], period: 6.6, jitter: 80, scatter: 6.2832, keep, keepR: keepR(40), rng: poolRng });
    await ctx.yield();
    // along the horizon: a crowd of blue ovals hopping on little arcs of action, three beads of plan on each
    const poolC = makeLeapPool(style, hero.rayUniforms, { leaps: scatterLeaps(Math.round(96 * few), 1360, 2.5), window: 1360, from: 318, to: 670,
      skins: [4], plan: 2, parts: (p) => p >= 3, arc: [12, 0], period: 6.0, jitter: 120, scatter: 6.2832, keep, keepR: keepR(60), rng: poolRng });
    await ctx.yield();
    // the featured leaps of the first course, each on its own spot and on the world's own clock, so one or two of them are
    // in the air whenever the entry is looked at (the phases put the early ray of the entry frame at the top of its arc at 12 s)
    const feat = [
      { x: -12, z: -40, heading: 0.1, phase: 3.35, height: 7.2, half: 3.6 * big, length: 16, id: 3 },         // the early leap of the entry frame: 39 m ahead, left of the course (it lands 8 m off it)
      { x: -24, z: -70, heading: 3.0, phase: 0.5, height: 6.2, half: 2.5 * big, length: 17, id: 5 },          // its neighbour, half a cycle off: one of the two is always in the air
      { x: 22, z: -62, heading: -0.1, phase: 4.6, height: 7.5, half: 2.5 * big, length: 17, id: 8 },
      { x: 27, z: -118, heading: -0.25, phase: 2.7, height: 6, half: 2.4 * big, length: 16, id: 11 },
      { x: 32, z: -176, heading: 0.2, phase: 5.9, height: 8.5, half: 2.6 * big, length: 18, id: 22 },
      { x: 60, z: -200, heading: 1.1, phase: 1.6, height: 6.0, half: 2.5 * big, length: 16, id: 41 },
    ];
    const LEAP = { skins: [4, 5, 6], plan: 12, dark: true, hull: true, shadow: true, splash: [2, 3], rng: poolRng };
    const poolD = makeLeapPool(style, hero.rayUniforms, { ...LEAP, leaps: feat, arc: [40, 12], period: 6.4 });
    await ctx.yield();
    // leaps scripted to the flight (their clock is the path's own). Each is placed from the moment it is to be looked at:
    // when the eye is at uBeat the ray is at the top of its arc, `lead` metres ahead and `side` metres off the course,
    // heading `al` degrees off it (90: square across our view, the open kite facing us; near 0: it travels with us).
    const beatLeap = (uBeat, side, lead, al, len, h, half, id, tb = 0.5) => {
      const d = uBeat * path.length, P = path.posAtDist(d), T = path.tangentAtDist(d).setY(0).normalize(), R = new THREE.Vector3(-T.z, 0, T.x);
      const Ld = new THREE.Vector3().copy(T).multiplyScalar(Math.cos(al * DEG)).addScaledVector(R, Math.sin(al * DEG)), C = P.clone().setY(0).addScaledVector(T, lead).addScaledVector(R, side).addScaledVector(Ld, -(tb - 0.5) * len);
      return { x: C.x, z: C.z, heading: Math.atan2(Ld.z, Ld.x), phase: 1.2 + 3 * tb - uBeat * duration, height: -h, half: half * big, length: len, id };
    };
    // THE FIRST COURSE: a ray breaks the surface right in front of us as we come in, its crown standing where it left the
    // water (u 0.02); a big one leaps across our course against the sky as the eye climbs (u 0.08); one on the right (u 0.205)
    const poolE = makeLeapPool(style, hero.rayUniforms, { ...LEAP, leaps: [beatLeap(0.02, -1.2, 10.5, 78, 20, 6.5, 3.3, 5, 0.2), beatLeap(0.08, 1, 15, 84, 22, 7.4, 4.0, 12), beatLeap(0.205, 10.5, 22, 84, 18, 6.2, 2.7, 19)],
      arc: [40, 12], period: 1000 });
    // SEEN FROM ABOVE (u 0.16): at the top of the eye's climb one ray glides along our course below us, belly down and wings
    // level: we look onto its back (spine, ribs, whip tail) with its hatch shadow on the water under it
    const DOWN = [0.16, -0.6, 9, 7, 30, 7.2, 4.4];
    const downL = beatLeap(...DOWN, 61), downAt = new THREE.Vector3(downL.x, 0.94 * DOWN[5], downL.z);
    // THE SQUADRON (u 0.43): out between two feet the eye is 10 m up and the gaze tips down again: seven rays in a V glide
    // along our course under us, the leader a whole kite a third of the frame wide, every one with its hatch shadow on the grid
    const SQ = [0.43, 0.6, 12.5, -7, 52, 5.9, 4.3];
    const sqL = beatLeap(...SQ, 62), sqV = new THREE.Vector3();
    const sqAt = (time, u) => { const t = Math.min(1, Math.max(0, 0.5 + (u - SQ[0]) * duration / 3)), x = (t - 0.5) * SQ[4];
      return sqV.set(sqL.x + Math.cos(sqL.heading) * x, 0.94 * SQ[5] * 4 * t * (1 - t) - 1.5, sqL.z + Math.sin(sqL.heading) * x); };
    const squad = [sqL, ...[[9.5, 21, 3.1, 4.9, 0.46], [18, 30, 2.9, 4.4, 0.55], [26, 41, 2.7, 4.6, 0.42], [-6.5, 23.5, 3.0, 5.2, 0.57], [-3, 38, 2.8, 4.3, 0.45], [9, 49, 2.6, 5.0, 0.52]]
      .map(([side, lead, half, h, tb], i) => beatLeap(SQ[0], side, lead, SQ[3] + (i % 2 ? 2 : -1), 50, h, half, 63 + i * 2, tb))];
    const poolL = makeLeapPool(style, hero.rayUniforms, { ...LEAP, flat: true, leaps: [downL, ...squad], arc: [48, 12], period: 1000 });
    // THE BREACHES, each the one dark whole ray of its frame: the ray that crosses our bows in the swing (u 0.253), far beyond
    // it one still in rough scribble over its blue oval, the big one that leaps away from the colonnade while we run along
    // its outside (u 0.52), the one that crosses the lane before the last arches (u 0.80) and the one beside the peg hole
    const poolP = makeLeapPool(style, hero.rayUniforms, { ...LEAP, leaps: [beatLeap(0.25, -8.5, 25, -84, 22, 6.8, 3.6, 26, 0.45), beatLeap(0.52, -1.5, 19, -84, 24, 6.6, 4.3, 31), beatLeap(0.262, 30, 84, 70, 20, 6.5, 3.0, 29), beatLeap(0.6175, 9.5, 24, -50, 26, 7, 3.4, 33), beatLeap(0.445, 30, 52, -80, 22, 7, 3.2, 49), beatLeap(0.595, -3, 24, -80, 24, 5.6, 3.2, 47)],
      arc: [48, 12], period: 1000 });
    const poolQ = makeLeapPool(style, hero.rayUniforms, { ...LEAP, leaps: [beatLeap(0.80, -1.5, 14.5, -86, 24, 5.4, 3.1, 37), beatLeap(0.868, -8, 20, -86, 22, 6, 3.0, 43), beatLeap(0.82, -16, 17, -133, 20, 5.6, 3.4, 57)],
      arc: [48, 12], period: 1000 });
    // THE PACING RAY (u 0.26 to 0.29): one finished ray that leaps along our course a few metres to the right in a long
    // flat arc and travels with us for a second and more, the closest drawing of the trip
    const PACE = [0.338, 6.0, 4.2, 3, 54, 3.3, 3.2];
    const paceL = beatLeap(...PACE, 53), paceV = new THREE.Vector3();
    const paceAt = (time, u) => {                              // where it is at u (the gaze leans toward it while it is in the air)
      const t = Math.min(1, Math.max(0, 0.5 + (u - PACE[0]) * duration / 3)), x = (-8.5 + 17 * t) * PACE[4] / 17;
      return paceV.set(paceL.x + Math.cos(paceL.heading) * x, Math.max(2.6, 0.94 * PACE[5] * 4 * t * (1 - t)), paceL.z + Math.sin(paceL.heading) * x);
    };
    const poolR = makeLeapPool(style, hero.rayUniforms, { ...LEAP, flat: 0.25, dark: -1, leaps: [paceL], arc: [48, 12], period: 1000 });
    const pools = [poolA, poolB1, poolB, poolC, poolD, poolE, poolL, poolP, poolQ, poolR];
    for (const p of pools) scene.add(p.group);
    await ctx.yield();

    // ---------- the far margin: the sheet lifts and curls back over us, punched with the three peg holes ----------
    // Sheet coordinates: x across the lane, v = metres along the paper from the lift line. The curl is a circular arc
    // that reaches 110 degrees at the round hole (so the hole faces the 20 degree climb squarely) and goes on to 150.
    const pageGeo = (off, len, roll) => {
      // (round 20) A SAVING: the sheet is straight across its middle, so there every fourth of the old nodes across is kept (the same places,
      // the same surface); by its sides, where it curls across, and over the next sheet's dog-ear every node is kept
      const NX0 = 76, XI = []; for (let i = 0; i <= NX0; i++) { const x = (roll === 2 ? P2_HALF : PAGE_HALF) * (2 * i / NX0 - 1); if (i === 0 || i === NX0 || (roll === 2 ? x < -62 : Math.abs(x) > 82) || i % 4 === 1) XI.push(i); }
      const nx = XI.length - 1, nv = roll === 2 ? 60 : roll ? 72 : 44, pos = new Float32Array((nx + 1) * (nv + 1) * 3), sh = new Float32Array((nx + 1) * (nv + 1) * 2), idx = [];
      for (let m = 0; m <= nx; m++) { const i = XI[m];
        const half = roll === 2 ? P2_HALF : PAGE_HALF, x = -half + 2 * half * i / NX0, e = roll === 2 ? 0 : Math.min(1, Math.max(0, (Math.abs(x) - 86) / (PAGE_HALF - 86))), f = 1 - e * e * (3 - 2 * e);
        const earW = roll === 2 ? Math.min(1, Math.max(0, (-66 - x) / 56)) : 0, ear0 = len - 34 * earW;      // (the dog-ear of the next sheet's near corner)
        let s = LIFT, y = 0, th = 0;
        for (let j = 0; j <= nv; j++) {
          const v = len * j / nv;
          const t1 = f * curlAt(v, roll) + (earW > 0 && v > ear0 ? 150 * DEG * ((v - ear0) / (34 * earW)) ** 1.4 : 0);
          if (j > 0) { const tm = (th + t1) / 2, dv = len / nv; s += Math.cos(tm) * dv; y += Math.sin(tm) * dv; }
          th = t1;
          const k = m * (nv + 1) + j, P = pagePt(s + Math.sin(th) * off, x, y - Math.cos(th) * off + (off ? -0.02 : 0.02));
          pos.set([P.x, P.y, P.z], k * 3); sh.set([x, v], k * 2);
          if (m < nx && j < nv) idx.push(k, k + nv + 1, k + 1, k + 1, k + nv + 1, k + nv + 2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSheet', new THREE.BufferAttribute(sh, 2)); g.setIndex(idx);
      return g;
    };
    const PAGE_FS = /* glsl */`
      varying vec3 vW; varying vec2 vS; uniform float uBack; uniform vec3 uBird;
      const float ROLLV = ${ROLL_V.toFixed(2)}, ROLLR = ${ROLL_R.toFixed(2)};
      float holes(vec2 p){                     // signed distance to the punched holes: the round one and a slot either side
        float d = length(p - vec2(0., ${HOLE_V.toFixed(2)})) - 6.9;
        vec2 q = vec2(abs(abs(p.x) - 60.) - 6.5, p.y - ${HOLE_V.toFixed(2)});
        return min(d, length(vec2(max(q.x, 0.), q.y)) - 3.4);
      }
      // (round 20) the brush of the next sheet's paint. wEdge: how far the edge between two bands wanders at x (m); wGap: the half width of the
      // sliver of bare paper left there (none along most of it); wBand: a band between two heights of the paper, the brush running dry at its edges
      uniform vec3 uWSeaD, uWSeaL, uWWarm, uWSkyL, uWSkyD; uniform float uNextPose;
      float wEdge(float x, float k){ return (vnoise2(vec2(x*0.027 + k*7.1, k*3.3)) - 0.5)*2.6 + (vnoise2(vec2(x*0.17 + k*5.7, k*1.9 + 4.)) - 0.5)*0.7; }
      float wGap(float x, float k){ return max(vnoise2(vec2(x*0.045 + k*2.9, 8. + k)) - 0.5, 0.)*1.7; }
      float wBand(vec2 s, float lo, float hi, float k, float fp){
        float a = s.y - lo, b = hi - s.y;
        float dry = step(0.64 + 0.5*smoothstep(0.15, 1.1, min(a, b)), vnoise2(vec2(s.x*0.11 + k*3., s.y*2.3)));      // the dry brush leaves slivers of bare paper along a band's edge, fewer further in: wash or paper, never a tone between
        return smoothstep(-fp, fp, a)*smoothstep(-fp, fp, b)*(1. - dry);
      }
      void main(){
        float dist = max(length(vW - cameraPosition), 0.3), g = grainAt(vW, dist);
        float fp = max(length(fwidth(vS)), 1e-4), hw = max(0.1, fp*0.9);
        vec2 hp = vec2(vS.x, -vS.y);
        float fwB = fwidth(hp.x*0.62 + hp.y*0.78), fwC = fwidth(hp.y*0.62 - hp.x*0.78);
        // the cut edges pale with distance in steps, like every other drawing here; the round hole keeps a step ahead
        vec3 ink = dist < 300. ? uGraphite : dist < 470. ? mix(uGraphite, uSmudge, 0.4) : dist < 640. ? mix(uGraphite, uSmudge, 0.75) : uSmudge;
        vec3 inkHole = dist < 500. ? uGraphite : mix(uGraphite, uSmudge, 0.6);
        vec2 q = laneXS(uP0.xy + uP0.zw*(uPage.x + vS.y) + vec2(-uP0.w, uP0.z)*vS.x)/10. + vec2(0.5, 0.), fq = fwidth(q);      // the sea's own grid runs on up the lifted sheet
        vec3 col;
        if (uBack < 0.5){
          float d = holes(vS);
          if (d < 0.) discard;
          col = mix(uPaper, uBlue, ruled(q, fq, 1.9)*(0.55 + 0.45*smoothstep(0.1, 0.55, g)));
          // the turn of the page takes a quick hatch, heavier to the right, away from the sun circle
          float rim = vnoise2(vS*0.11);
          float form = smoothstep(2. + 5.*rim, 9., vS.y)*(1. - smoothstep(13., 21. + 6.*rim, vS.y))*smoothstep(-70., 60., vS.x + 40.*rim)*(1. - smoothstep(88., 120., abs(vS.x)));
          // and the stepped hatch shadow of the last bird to cross the sheet
          vec2 bd = (vS - uBird.xy)*vec2(1., 2.3); bd.y += 0.1*abs(bd.x)*abs(bd.x);
          form = max(form, uBird.z*(1. - smoothstep(0.75, 1.15, length(bd)/4.2 + 0.3*(rim - 0.5))));
          // the lip of the sheet rolls right over: its hatch shadow lies on the sheet under it, the inside of the roll is in tone,
          // and the back of the paper (bare, no grid) takes a hatch that is heaviest underneath
          float rv = vS.y - ROLLV, edgeFade = 1. - smoothstep(92., 126., abs(vS.x));
          form = max(form, smoothstep(-5.5 - 2.5*rim, -2.5, rv)*edgeFade);
          if (!gl_FrontFacing){ col = uPaper; form = smoothstep(ROLLR*2.1 + 1.5*rim, ROLLR*3.3, rv)*edgeFade; }
          col = mix(col, mix(uSmudge, uGraphite, 0.3), hatchW(hp, fwB, dist, form));
          // the cut edges: the rims of the holes and the sheet's own far edge, one sure line each
          float edge = min(d, ${PAGE_LEN.toFixed(2)} - vS.y);
          bool isRound = d < ${PAGE_LEN.toFixed(2)} - vS.y && abs(vS.x) < 20.;      // the round hole's rim is a full line from any distance
          float hwR = isRound ? max(0.1, fp*1.7) : hw;
          col = mix(col, isRound ? inkHole : ink, (1. - smoothstep(hwR, hwR + fp, edge))*(isRound ? 0.75 + 0.25*g : 0.6 + 0.4*g));
        } else {
          // (round 20) THE NEXT SHEET IS THE PAINTED BACKGROUND the test is drawn for, pinned up behind ours on the same pegs: a sea in two
          // tones under a sky in three washes, laid as broad brush bands whose edges wander with the hand and leave slivers of bare paper;
          // the sun sits on the horizon, a half disc of bare paper. Every tone is flat and opaque and lands on its hex. The sheet's cut edge
          // takes a bold line, its own peg slots are dark, its turned corner shows the bare back, and the hatch shadows lie over the paint.
          if (length(vS - vec2(0., ${HOLE_V.toFixed(2)})) < 8.6) discard;
          float lit = holes(vS - vec2(1.5, -1.4));
          float past = vS.y - ${(ROLL_V + 1.2).toFixed(2)};
          float rim2 = vnoise2(vS*0.07 + 3.), top = ${P2_LEN.toFixed(2)} - vS.y;
          // the shadow our sheet's rolled lip throws up it (deep, ragged), and the form of its own top flopping back: a quick hatch, heavier to the right
          float sh = max(step(0., lit)*step(past, 0.)*(1. - smoothstep(84., 108., abs(vS.x) + 10.*rim2)), step(0., past)*(1. - smoothstep(4.5 + 5.*rim2, 8. + 7.*rim2, past))*(1. - smoothstep(96., 118., abs(vS.x) + 10.*rim2)));
          float form = (1. - smoothstep(3. + 4.*rim2, 7. + 6.*rim2, top))*smoothstep(-60., 90., vS.x + 50.*rim2);
          col = uSheet2;
          if (gl_FrontFacing){
            float x = vS.x, v = vS.y;
            float e1 = 62. + wEdge(x, 1.), e2 = 69.5 + 0.6*wEdge(x, 2.), e3 = 74. + 0.16*wEdge(x, 3.), e4 = 83. + wEdge(x, 4.), e5 = 96. + wEdge(x, 5.), e6 = ${(P2_LEN - 5).toFixed(2)} + 0.7*wEdge(x, 6.);
            float g1 = wGap(x, 1.), g2 = 0.6*wGap(x, 2.), g3 = 0.3*wGap(x, 3.), g4 = wGap(x, 4.), g5 = wGap(x, 5.);
            float side = 1. - smoothstep(-fp, fp, abs(x) - 115. - 2.4*(vnoise2(vec2(v*0.13, 2.3 + sign(x))) - 0.5));
            float sun = smoothstep(-fp, fp, length(vS - vec2(-58., 74.)) - 6.4 - 0.3*(vnoise2(vS*0.5 + 5.) - 0.5));
            col = mix(col, uWSeaD, wBand(vS, -9., e1 - g1, 0., fp)*side);
            col = mix(col, uWSeaL, wBand(vS, e1 + g1, e2 - g2, 1., fp)*side);
            col = mix(col, uWSeaD, wBand(vS, e2 + g2, e3 - g3, 2., fp)*side);
            col = mix(col, uWWarm, wBand(vS, e3 + g3, e4 - g4, 3., fp)*side*sun);
            col = mix(col, uWSkyL, wBand(vS, e4 + g4, e5 - g5, 4., fp)*side);
            col = mix(col, uWSkyD, wBand(vS, e5 + g5, e6, 5., fp)*side);
            // the hatch shadow the inked ray throws on the painted sea, under its low wing (it flips with the drawing)
            vec2 sd = (vS - vec2(uNextPose > 0.5 ? 27. : 17., 65.7))/vec2(25., 3.1);
            float rsh = 1. - smoothstep(0.78, 1.08, length(sd) + 0.3*(rim2 - 0.5));
            col = mix(col, uGraphite, hatchW(hp, fwB, dist, rsh));
            // its own peg slots, behind ours on the same pegs: dark
            vec2 q2 = vec2(abs(abs(vS.x) - 60.) - 6.5, vS.y - ${HOLE_V.toFixed(2)});
            float dsl = length(vec2(max(q2.x, 0.), q2.y)) - 3.4;
            col = mix(col, mix(uGraphite, uSmudge, 0.15), 1. - smoothstep(-fp, fp, dsl));
          }
          col = mix(col, mix(uSmudge, uGraphite, 0.75), hatchW(hp, fwB, dist, max(sh, 0.8*form)));
          col = mix(col, uGraphite, hatchW(vec2(hp.y, -hp.x), fwC, dist, sh*step(0., past)));     // (cross-hatched where the shadow is deepest)
          // the dog-eared corner shows the back of the sheet: bare paper, a quick hatch only along its fold
          if (!gl_FrontFacing && past > 12.){
            float fold = vS.y - (${P2_LEN.toFixed(2)} - 34.*clamp((-66. - vS.x)/56., 0., 1.));
            col = mix(uSheet2, mix(uSmudge, uGraphite, 0.3), hatchW(hp, fwB, dist, 1. - smoothstep(1.5 + 3.*rim2, 5. + 4.*rim2, fold)));
          }
          float hw2 = max(0.5, fp*2.6), edge2 = min(top - 0.25, ${(122 - 0.25).toFixed(2)} - abs(vS.x));
          col = mix(col, uGraphite, (1. - smoothstep(hw2, hw2 + fp, edge2))*(0.72 + 0.28*g));
        }
        gl_FragColor = vec4(toScene(col), 1.);
      }`;
    const wreathU = { value: -1 }, WREATH_T0 = 32.9;            // the last leap round the peg hole: which drawing is in hand, and when (s) it begins
    const nextPoseU = { value: 0 };                             // which of its two drawings the next sheet shows (the animator's flip)
    const birdU = { value: new THREE.Vector3(0, 0, 0) };       // sheet x, v of the last bird's shadow, and whether it is there
    const pageMat = (back) => new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...laneU, uBack: { value: back }, uBird: birdU, ...washU, uNextPose: nextPoseU }, side: THREE.DoubleSide,
      vertexShader: 'attribute vec2 aSheet; uniform float uTime, uBack; uniform vec4 uP0; varying vec3 vW; varying vec2 vS; void main(){ vS = aSheet; float k = smoothstep(' + (ROLL_V + 1).toFixed(2) + ', ' + (ROLL_V + 9).toFixed(2) + ', aSheet.y)*step(aSheet.y, ' + (ROLL_V + 8).toFixed(2) + ' + 99.*(1. - uBack)); vec3 p = position + vec3(-uP0.z*0.9, 0.35, -uP0.w*0.9)*1.1*k*sin(uTime*0.7 + aSheet.x*0.015); vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: style.GLSL + GRID_GLSL + PAGE_FS });
    const page = new THREE.Mesh(pageGeo(0, PAGE_LEN, 1), pageMat(0)); page.frustumCulled = false; page.renderOrder = -3; scene.add(page);
    await ctx.yield();
    const page2 = new THREE.Mesh(pageGeo(3.2, P2_LEN, 2), pageMat(1)); page2.frustumCulled = false; page2.renderOrder = -3; scene.add(page2);
    await ctx.yield();

    // ---------- THE NEXT DRAWING: what is pencilled on the tall sheet behind ours (seen from the first glance, growing all the way) ----------
    // The sheet after this one stands on the same pegs, lifted behind our margin. Since round 20 it is THE PAINTED BACKGROUND
    // (the page shader lays its washes) and what is pencilled on it here is: the field guide ruled in blue, the arc of action
    // with its spacing ticks and the ringed frame number in the blue pencil over the paint, and one huge ray INKED (a bold line,
    // spine and ribs, a toned back and a white belly). The animator flips between this sheet and the one under it: the ray is
    // in one pose, then the next, about three times in two seconds.
    const nextFlip = [], nextFill = [];
    // (round 20) the body of the next sheet's inked ray: the back in tone like every finished ray's; on the second drawing the far wing
    // shows its belly, bare white paper
    const nextFillMat = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...laneU }, side: THREE.DoubleSide,
      vertexShader: 'attribute vec4 aPl; varying vec3 vW; varying vec4 vPl; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vPl = aPl; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: style.GLSL + 'uniform vec3 uSheet2;' + BACK_GLSL + /* glsl */`
        varying vec3 vW; varying vec4 vPl;
        void main(){
          float dist = max(length(vW - cameraPosition), 0.3), g = grainAt(vW, dist);
          vec4 c = backTone(vPl.xy, vPl.z, g, max(length(fwidth(vPl.xy)), 1e-4), 1.);
          if (c.a < 0.5) discard;
          if (vPl.w > 0.5 && vPl.x < -0.2 - 0.07*vnoise2(vPl.xy*5. + 2.) && vPl.z <= 1.) c.rgb = uSheet2;
          gl_FragColor = vec4(toScene(c.rgb), 1.);
        }` });
    disposables.push(nextFillMat);
    {
      const cv = [[LIFT, 0, 0]];                                  // the sheet's centre line: [s, y, angle] every 0.5 m of paper
      for (let j = 1; j <= Math.ceil(P2_LEN / 0.5); j++) { const p = cv[j - 1], t1 = curlAt(j * 0.5, 2), tm = (p[2] + t1) / 2; cv.push([p[0] + Math.cos(tm) * 0.5, p[1] + Math.sin(tm) * 0.5, t1]); }
      const s2At = (x, v, off = 0.22) => { const f = Math.min(cv.length - 1.001, Math.max(0, v / 0.5)), i = Math.floor(f), t = f - i, a = cv[i], b = cv[i + 1], th = a[2] + (b[2] - a[2]) * t, o = 3.2 - off;
        return pagePt(a[0] + (b[0] - a[0]) * t + Math.sin(th) * o, x, a[1] + (b[1] - a[1]) * t - Math.cos(th) * o).toArray(); };
      const nr = rng.fork('next'), V0 = ROLL_V + 9, V1 = P2_LEN - 7, VC = (V0 + V1) / 2 + 2, N = [], plan = hero.rayUniforms.uPlan.value;
      const ln = (x0, v0, x1, v1, pencil = 1, press = 1.0, n = 10) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(s2At(x0 + (x1 - x0) * t + (nr() - 0.5) * 0.25, v0 + (v1 - v0) * t + (nr() - 0.5) * 0.25)); } N.push({ pts, pencil, press, taper: false, seed: nr() * 90 }); };
      // the field guide: a frame ruled twice, overshooting its corners, with the centre cross and the quarter marks
      for (const k of [0, 1]) { const o = k * 0.9;
        ln(-84 - 5 * k, V0 + o, 84 + 6, V0 - o * 0.5); ln(-84 - 4, V1 - o, 84 + 5 * k, V1 + o * 0.6); ln(-80 + o, V0 - 4, -80 - o * 0.4, V1 + 5 * k + 3, 1, 1.0, 14); ln(80 - o, V0 - 3 - 3 * k, 80 + o * 0.5, V1 + 4, 1, 1.0, 14); }
      ln(-9, VC, 9, VC + 0.3, 1, 0.9, 3); ln(0.2, VC - 9, -0.2, VC + 9, 1, 0.9, 3);
      for (const q of [-40, 40]) { ln(q, V0 - 1.5, q, V0 + 2.5, 1, 0.9, 2); ln(q, V1 - 2.5, q, V1 + 1.5, 1, 0.9, 2); }
      // the arc of action the next ray will leap, with its spacing ticks (close together over the top, wide at the feet)
      const arcAt = (t) => [-72 + 144 * t, V0 + 4 + (V1 - V0 - 16) * 4 * t * (1 - t)];
      { const pts = []; for (let i = 0; i <= 44; i++) pts.push(s2At(...arcAt(i / 44))); N.push({ pts, pencil: 1, press: (t) => 0.9 + 0.8 * Math.sin(Math.PI * t), seed: 4.4 }); }
      for (let k = 0; k < 12; k++) { const t = 0.5 - 0.5 * Math.cos(Math.PI * (k + 0.5) / 12), a = arcAt(t), b = arcAt(t + 0.01), dx = b[0] - a[0], dv = b[1] - a[1], l = Math.hypot(dx, dv) / 2.6;
        ln(a[0] + dv / l, a[1] - dx / l, a[0] - dv / l, a[1] + dx / l, 1, 0.9, 2); }
      // the ringed frame number, top right, and the scene's under it; a few lines of the animator's notes bottom left
      const wr = (txt, x0, v0, sz, pencil, press) => { let ox = x0; for (const ch of txt) { const d = DIGITS[+ch], pts = [];
        for (let k = 0; k + 1 < d.length; k += 2) pts.push(s2At(ox + (+d[k] + (nr() - 0.5) * 0.12) * sz + (+d[k + 1]) * sz * 0.12, v0 + (+d[k + 1] + (nr() - 0.5) * 0.1) * sz)); N.push({ pts, pencil, press, taper: false, seed: nr() * 90 }); ox += sz * 1.7; } };
      wr('36', 50, V1 - 19, 5.2, 1, 1.4);
      { const pts = []; for (let i = 0; i <= 34; i++) { const a = i / 30 * 6.2832 + 0.8, r = 1 + 0.07 * i / 30; pts.push(s2At(58.5 + Math.cos(a) * 14 * r, V1 - 13.6 + Math.sin(a) * 9.4 * r)); } N.push({ pts, pencil: 1, press: 1.1, taper: false, seed: 8.1 }); }
      for (let r = 0; r < 4; r++) { const pts = [], w = 22 - r * 4 - nr() * 5; for (let i = 0; i <= 26; i++) { const t = i / 26; pts.push(s2At(-70 + t * w, V0 + 13 - r * 2.6 + 0.55 * Math.sin(t * w * 2.1 + r * 3) * (0.4 + nr()))); } N.push({ pts, pencil: 3 + (r === 0 ? 1 : 0), press: 1.2, seed: nr() * 90 }); }
      addStrokes(N, scene, -2);
      // the ray itself, in two poses (two sheets): nose up and to the left; then a drawing on, wings lifted, tail whipped over
      for (const pose of [0, 1]) {
        const R = [], hs = 33 - pose * 2, tilt = (-28 + pose * 9) * DEG, ct = Math.cos(tilt), st = Math.sin(tilt), cx = -6 + pose * 10, cvv = VC + 3 + pose * 4, bend = pose ? 0.86 : 1;
        const at = (px, py, off = 0.22) => { const qx = px * bend, qy = py + (pose ? 0.16 * px * px : 0); return s2At(cx + hs * (qx * ct - qy * st), cvv + hs * (qx * st + qy * ct), off); };
        // (round 20) INKED, not roughed in blue: the bold dark line round it, the spine, three ribs to a wing and the tail in graphite; under
        // the line a body in tone (the same back every finished ray here has) and, on the drawing with the wings lifted, the white belly of
        // the far wing. The two drawings flip as before.
        R.push({ pts: plan.map((q) => at(q.x, q.y)), pencil: 0, press: (t) => 2.9 + 0.8 * Math.sin(t * 25 + pose), taper: false, seed: 60 + pose * 7 });
        R.push({ pts: [at(0, 0.34), at(0.01, -0.14), at(0, -0.62)], pencil: 0, press: 1.7, seed: 64 + pose });
        for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) R.push({ pts: [at(sx * 0.13, 0.2 - 0.15 * r), at(sx * (0.5 - 0.06 * r), 0.1 - 0.13 * r), at(sx * (0.86 - 0.2 * r), -0.11 - 0.07 * r)], pencil: 0, press: 1.1, seed: 67 + pose * 9 + r + sx });
        const tl = []; for (let i = 0; i <= 12; i++) { const t = i / 12; tl.push(at((pose ? -0.55 : 0.4) * t * t + 0.05 * Math.sin(t * 9) * t, -0.7 - 1.05 * t)); }
        R.push({ pts: tl, pencil: 0, press: (t) => 2.4 * (1 - 0.7 * t), seed: 66 + pose });
        nextFlip.push(addStrokes(R, scene, -2));
        // its body: a fan over the kite and a ring a little outside the line for the smudge's overshoot, laid between the paint and the line
        const fP = [...at(0, -0.05, 0.14)], fA = [0, -0.05, 0, pose], fI = [];
        for (let j = 0; j <= 48; j++) { fP.push(...at(plan[j].x, plan[j].y, 0.14), ...at(plan[j].x * 1.1, plan[j].y * 1.1, 0.14)); fA.push(plan[j].x, plan[j].y, 1, pose, plan[j].x * 1.1, plan[j].y * 1.1, 1.1, pose); }
        for (let j = 0; j < 48; j++) { const q = 1 + j * 2; fI.push(0, q, q + 2, q, q + 1, q + 3, q, q + 3, q + 2); }
        const fg = new THREE.BufferGeometry();
        fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fP), 3)); fg.setAttribute('aPl', new THREE.BufferAttribute(new Float32Array(fA), 4)); fg.setIndex(fI);
        const fm = new THREE.Mesh(fg, nextFillMat); fm.frustumCulled = false; fm.renderOrder = -2.5; scene.add(fm); nextFill.push(fm);
      }
    }
    await ctx.yield();

    // ---------- what the animator left round the peg hole: the near detail of the final approach ----------
    // a point of the lifted sheet (x across, v up the paper), held `off` metres off it on our side
    const sheetAt = (x, v, off = 0.07) => {
      let s = LIFT, y = 0, th = 0; const n = Math.max(2, Math.ceil(v / 0.6));
      for (let j = 1; j <= n; j++) { const t1 = curlAt(v * j / n), tm = (th + t1) / 2; s += Math.cos(tm) * v / n; y += Math.sin(tm) * v / n; th = t1; }
      return pagePt(s - Math.sin(th) * off, x, y + Math.cos(th) * off).toArray();
    };
    {
      const M = [], HV = HOLE_V, mr = rng.fork('margin');
      const seg = (x0, v0, x1, v1, pencil = 1, press = 1.2, n = 6) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(sheetAt(x0 + (x1 - x0) * t + (mr() - 0.5) * 0.05, v0 + (v1 - v0) * t + (mr() - 0.5) * 0.05)); } M.push({ pts, pencil, press, seed: mr() * 90 }); };
      // the blue registration cross through the hole, each arm ruled twice and overshooting
      for (const k of [0, 1]) { const o = k * 0.22;
        seg(-15.5 - k, HV + o, -7.2, HV + o * 0.4); seg(7.2, HV - o * 0.5, 16.5 + k * 1.4, HV - o);
        seg(o, HV + 7.2, -o * 0.5, HV + 13.2 + k); seg(-o, HV - 7.2, o * 0.6, HV - 15 - k * 1.2); }
      // field-guide ticks along the arms and the four corner marks of the field
      for (let i = 0; i < 4; i++) for (const sg of [-1, 1]) { const r = 8.6 + i * 2; seg(sg * r, HV - 0.45, sg * r + 0.04, HV + 0.5, 1, 1, 1); if (i < 3 && r < 13) seg(-0.45, HV + sg * r, 0.5, HV + sg * r + 0.03, 1, 1, 1); }
      for (const [sx, sv] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = sx * 21, cv = HV + sv * (sv > 0 ? 11.6 : 13.2); seg(cx - sx * 3.4, cv, cx + sx * 0.5, cv, 1, 1.3, 3); seg(cx, cv - sv * 3, cx, cv + sv * 0.5, 1, 1.3, 3); }
      // an earlier circle for the hole, a little off, rubbed out (two turns of a compass that slipped), and its centre cross
      for (const [ex, ev, er, pn] of [[1.45, -0.95, 7.15, 6], [1.3, -1.1, 7.3, 6], [-0.5, 0.35, 8.05, 1]]) {
        let run = [];
        for (let i = 0; i <= 96; i++) { const a = i / 96 * 6.2832 * 1.04 + ex, x = ex + Math.cos(a) * er, v = ev + Math.sin(a) * er;
          if (Math.hypot(x, v) > 7.12) run.push(sheetAt(x, HV + v)); else { if (run.length > 2) M.push({ pts: run, pencil: pn, press: pn === 6 ? 1.5 : 0.9, taper: false, seed: mr() * 90 }); run = []; } }
        if (run.length > 2) M.push({ pts: run, pencil: pn, press: pn === 6 ? 1.5 : 0.9, taper: false, seed: mr() * 90 });
      }
      // the drawing's number and the scene's, pencilled below right of the hole: "33" ringed, and "12-8"
      const write = (txt, x0, v0, sz, pencil) => { let ox = x0; for (const ch of txt) {
        if (ch === '-') seg(ox, v0 + sz, ox + sz * 0.8, v0 + sz * 1.05, pencil, 1.2, 2);
        else { const d = DIGITS[+ch], pts = []; for (let k = 0; k + 1 < d.length; k += 2) pts.push(sheetAt(ox + (+d[k] + (mr() - 0.5) * 0.14) * sz + (+d[k + 1]) * sz * 0.12, v0 + (+d[k + 1] + (mr() - 0.5) * 0.1) * sz)); if (pts.length > 1) M.push({ pts, pencil, press: pencil === 0 ? 2.2 : 1.5, taper: false, seed: mr() * 90 }); }
        ox += sz * 1.7; } };
      write('35', 26.5, HV - 8.4, 2.4, 0);
      { const pts = []; for (let i = 0; i <= 30; i++) { const a = i / 26 * 6.2832 + 1, r = 1 + 0.06 * i / 26; pts.push(sheetAt(30.3 + Math.cos(a) * 6.2 * r, HV - 6 + Math.sin(a) * 4.2 * r)); } M.push({ pts, pencil: 0, press: 1.6, taper: false, seed: 7.7 }); }
      write('12-8', -17.6, HV - 12.2, 0.8, 5);
      // THE LAST LEAP: one more arc of action, pencilled in the air right round the way to the peg hole (a ring standing 12 m
      // in front of the sheet, square to the climb: we fly through the middle of it), and a ray that leaps it as we come:
      // seven drawings (a dart leaving the water line, open kites over the top, a dart going in), each first a blue oval,
      // then the drawing in hand, then a finished one: bodied, its back in tone, the bold line round it.
      const WR = 14, WK = 7, WHS = 4.5, wAng = (k) => (203 - 226 * k / (WK - 1)) * DEG;
      const climbD = new THREE.Vector3().copy(pDir).multiplyScalar(Math.cos(20 * DEG)).setY(Math.sin(20 * DEG)), ringUp = new THREE.Vector3().copy(pDir).multiplyScalar(-Math.sin(20 * DEG)).setY(Math.cos(20 * DEG));
      const ringAt = (x, v, k = 0) => new THREE.Vector3().copy(seat).addScaledVector(climbD, -12 - 0.12 * k).addScaledVector(pRight, x).addScaledVector(ringUp, v).toArray();
      { const pts = []; for (let i = 0; i <= 52; i++) { const a = (211 - 242 * i / 52) * DEG; pts.push(ringAt(Math.cos(a) * WR, Math.sin(a) * WR, -16)); } M.push({ pts, pencil: 2, press: (t) => 1.3 + 1.2 * Math.sin(Math.PI * t), seed: 3.3 }); }
      const plan = hero.rayUniforms.uPlan.value, W = [], fillP = [], fillA = [], fillI = [];
      for (let k = 0; k < WK; k++) {
        const a = wAng(k), ca = Math.cos(a), sa = Math.sin(a), hx = sa, hv = -ca, e = Math.min(k, WK - 1 - k), open = e === 0 ? 0.45 : e === 1 ? 0.84 : 1, hs = WHS;
        const at = (px, py, kk = k) => ringAt(ca * WR + hs * (px * open * ca + py * hx), sa * WR + hs * (px * open * sa + py * hv), kk);
        M.push({ pts: [ringAt(ca * (WR - 0.7), sa * (WR - 0.7), -16), ringAt(ca * (WR + 0.7), sa * (WR + 0.7), -16)], pencil: 2, press: 1.3, seed: 20 + k });          // its spacing tick
        const ov = []; for (let i = 0; i <= 20; i++) { const t = i / 16 * 6.2832 + k; ov.push(at(1.02 * Math.cos(t) * (1 + 0.04 * i / 16), -0.05 + 0.62 * Math.sin(t), -14)); }
        M.push({ pts: ov, pencil: 1, press: 0.9, taper: false, seed: 40 + k });
        W.push({ pts: plan.map((q) => at(q.x, q.y)), pencil: k, press: (t) => 2.1 + 1.0 * Math.sin(t * 25 + k), taper: false, seed: 50 + k * 3.1 });        // (pencil carries the drawing's number here)
        W.push({ pts: [at(0, 0.34), at(0.01, -0.14), at(0, -0.62)], pencil: k, press: 1.3, seed: 51 + k * 3.1 });
        for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) W.push({ pts: [at(sx * 0.13, 0.2 - 0.15 * r), at(sx * (0.5 - 0.06 * r), 0.1 - 0.13 * r), at(sx * (0.86 - 0.2 * r), -0.11 - 0.07 * r)], pencil: k, press: 0.75, seed: 53 + k * 3.1 + r + sx });   // the ribs of the wings
        const wh = (k % 2 ? 1 : -1) * 0.5, tl = []; for (let i = 0; i <= 8; i++) { const t = i / 8; tl.push(at((wh * t * t * 0.5 + 0.05 * Math.sin(t * 9) * t) / open, -0.70 - 0.8 * t)); }
        W.push({ pts: tl, pencil: k, press: (t) => 1.4 * (1 - 0.8 * t), seed: 52 + k * 3.1 });
        // its body: a fan over the kite and a ring a little outside the line for the smudge's overshoot
        const v0 = fillP.length / 3; fillP.push(...at(0, -0.05, k - 0.5)); fillA.push(0, -0.05, 0, k);
        for (let j = 0; j <= 48; j++) { fillP.push(...at(plan[j].x, plan[j].y, k - 0.5), ...at(plan[j].x * 1.1, plan[j].y * 1.1, k - 0.5)); fillA.push(plan[j].x, plan[j].y, 1, k, plan[j].x * 1.1, plan[j].y * 1.1, 1.1, k); }
        for (let j = 0; j < 48; j++) { const q = v0 + 1 + j * 2; fillI.push(v0, q, q + 2, q, q + 1, q + 3, q, q + 3, q + 2); }
      }
      {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fillP), 3)); g.setAttribute('aPl', new THREE.BufferAttribute(new Float32Array(fillA), 4)); g.setIndex(fillI);
        const fm = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uNow: wreathU }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
          vertexShader: 'attribute vec4 aPl; uniform float uNow; varying vec3 vW; varying vec3 vPl; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vPl = aPl.xyz; gl_Position = aPl.w - uNow < 0.5 ? projectionMatrix*viewMatrix*w : vec4(0., 0., 2., 1.); }',
          fragmentShader: style.GLSL + BACK_GLSL + /* glsl */`
            varying vec3 vW; varying vec3 vPl;
            void main(){
              float dist = max(length(vW - cameraPosition), 0.3), g = grainAt(vW, dist);
              vec4 c = backTone(vPl.xy, vPl.z, g, max(length(fwidth(vPl.xy)), 1e-4), 1.);
              if (c.a < 0.5) discard;
              gl_FragColor = vec4(toScene(c.rgb), 1.);
            }` });
        disposables.push(fm);
        const m = new THREE.Mesh(g, fm); m.frustumCulled = false; m.renderOrder = 1; scene.add(m);
      }
      const WREATH_VS = /* glsl */`
        attribute vec3 aNext; attribute vec4 aLine; attribute float aSeed;
        uniform float uNow;                         // the number of the drawing in hand (they are made in order; below 0 none yet)
        varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
        void main(){
          vec3 P = (modelMatrix*vec4(position, 1.)).xyz, Q = (modelMatrix*vec4(aNext, 1.)).xyz;
          float dist = length(P - cameraPosition), k = aLine.w, d = k - uNow;
          float keyK = mod(k, 2.) < 0.5 ? 1. : 0.;
          float show = step(d, 2.5)*step(dist, 260.), wt = 1.;
          vec3 col = d > 0.5 ? mix(uBlue, uPaper, d > 1.5 ? 0.4 : 0.) : uGraphite;
          wt = d > 0.5 ? 0.8 : dist < 60. ? 2.2 : 1.7;
          vec3 o = boil(vec3(0.), aSeed + floor(aLine.y*0.5), d > -0.5 ? clock12() : clock6(), dist);
          gl_Position = ribbon(P + o, Q + o, aLine.x, aLine.z, wt, vPx);
          if (show < 0.5) gl_Position = vec4(0., 0., 2., 1.);
          vW = P; vCol = col; vUVK = vec3(aLine.y, aLine.x, show);
        }`;
      const wm = new THREE.Mesh(ribbonGeometry(W), style.lineMaterial(WREATH_VS, { uNow: wreathU })); wm.frustumCulled = false; wm.renderOrder = 1; scene.add(wm);
      addStrokes(M, scene, 1);
    }
    await ctx.yield();

    // ---------- things drawn in three stages (pelicans, boats, weed): blue construction, rough scribble, the clean line ----------
    // One ribbon set per thing holds all three drawings; the vertex shader shows the stage its distance calls for:
    // beyond uStage.y only the blue, then the scribble over it, and as the eye closes inside uStage.x the scribble is
    // rubbed back to a ghost while each clean line is laid from end to end.
    const STAGED_VS = /* glsl */`
      attribute vec3 aNext; attribute vec4 aLine; attribute float aSeed;
      attribute vec4 aObj;          // centre of the thing (local) | stage of this stroke: 0 clean, 1 rough, 2 blue
      attribute vec3 aAnim;         // flap amplitude (m), flap phase, length of the stroke (m)
      uniform vec2 uBeat;           // period of the wingbeat (s), 0 one beat a period / 1 a steady rock
      uniform float uBold;          // weight of the clean line
      uniform float uNear;          // metres (0: off): inside this depth a line is drawn no wider on the screen than it is there
      varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
      void main(){
        float t = clock12()/12.;
        float bp = fract(t/uBeat.x + aAnim.y);
        float beat = uBeat.y > 0.5 ? sin(bp*6.2832) : sin(clamp(bp*4.5, 0., 1.)*6.2832);
        vec3 lift = vec3(0., aAnim.x*beat, 0.);
        vec3 P = (modelMatrix*vec4(position + lift, 1.)).xyz, Q = (modelMatrix*vec4(aNext + lift, 1.)).xyz;
        float dist = length((modelMatrix*vec4(aObj.xyz, 1.)).xyz - cameraPosition), st = stageOf(dist);
        float cleanF = clamp((uStage.x - dist)/uStage.z, 0., 1.), sk = aObj.w, show = 1., press = aLine.z, clk = clock6();
        vec3 col = uGraphite;
        if (sk > 1.5){ col = cleanF > 0.5 ? mix(uBlue, uPaper, 0.5) : uBlue; }
        else if (sk > 0.5){ show = 1. - step(1.5, st); col = cleanF > 0.15 ? mix(uPale, uPaper, 0.35) : mix(uGraphite, uSmudge, 0.45); clk = cleanF > 0.15 ? clk : clock12(); }
        else { show = step(aLine.y/max(aAnim.z, 0.01) + 0.02, cleanF*1.05); press *= 1.25; }
        float kn = uNear > 0. ? min(1., max((projectionMatrix*viewMatrix*vec4(P, 1.)).w, 0.3)/uNear) : 1.;     // (the clip depth ribbon() measures by; every stage of the drawing)
        vec3 o = boil(vec3(0.), aSeed + floor(aLine.y*0.6), clk, dist)*(sk > 0.5 && sk < 1.5 ? 2.2 : 1.)*kn;     // the wander shrinks with the line
        press *= kn;
        gl_Position = ribbon(P + o, Q + o, aLine.x, press, sk < 0.5 ? uBold : 1., vPx);
        if (sk < 0.5) gl_Position.z -= 0.0005*gl_Position.w;          // the clean line lies over the rough ones it was found in
        if (show < 0.5) gl_Position = vec4(0., 0., 2., 1.);
        vW = P; vCol = col; vUVK = vec3(aLine.y, aLine.x, show);
      }`;
    // strokes: [{ pts, stage, press, amp: [flap amplitude of each point], phase, centre: [x, y, z] }]
    const stagedMesh = (strokes, beat = [5.5, 0], extraU = {}) => {
      const g = ribbonGeometry(strokes.map((s) => ({ pts: s.pts, pencil: s.stage === 2 ? 1 : 0, press: s.press ?? 1, taper: s.taper, seed: s.seed })));
      let n = 0; for (const s of strokes) n += s.pts.length * 2;
      const aObj = new Float32Array(n * 4), aAnim = new Float32Array(n * 3); let v = 0;
      for (const s of strokes) {
        let len = 0; for (let i = 1; i < s.pts.length; i++) len += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1], s.pts[i][2] - s.pts[i - 1][2]);
        for (let i = 0; i < s.pts.length; i++) for (let k = 0; k < 2; k++) { aObj.set([s.centre[0], s.centre[1], s.centre[2], s.stage], v * 4); aAnim.set([s.amp ? s.amp[i] : 0, s.phase ?? 0, len], v * 3); v++; }
      }
      g.setAttribute('aObj', new THREE.BufferAttribute(aObj, 4)); g.setAttribute('aAnim', new THREE.BufferAttribute(aAnim, 3));
      const m = new THREE.Mesh(g, style.lineMaterial(STAGED_VS, { uBeat: { value: new THREE.Vector2(beat[0], beat[1]) }, uBold: { value: 1 }, uNear: { value: 0 }, ...extraU }));
      m.frustumCulled = false; m.renderOrder = 1; scene.add(m); return m;
    };
    const srng = rng.fork('staged');
    // the rough pass of a clean drawing: three loose strokes for each line, that miss it and each other
    const roughOf = (clean, amt = 0.12, passes = 3) => {
      const out = [];
      for (const s of clean) for (let k = 0; k < passes; k++) {
        const ox = srng.range(-amt, amt), oy = srng.range(-amt, amt), oz = srng.range(-amt, amt), f = srng.range(0.9, 1.12), sd = srng() * 90;
        const m = s.pts.length, c = s.pts[m >> 1];
        const pts = s.pts.map((p, i) => [c[0] + (p[0] - c[0]) * f + ox + amt * 0.8 * Math.sin(i * 1.7 + sd), c[1] + (p[1] - c[1]) * f + oy + amt * 0.8 * Math.sin(i * 2.3 + sd * 2), c[2] + (p[2] - c[2]) * f + oz + amt * 0.8 * Math.cos(i * 1.3 + sd)]);
        out.push({ ...s, pts, stage: 1, press: 0.8, seed: sd });
      }
      return out;
    };
    const oval3 = (c, ax, bx, turns = 1.2, n = 18) => {            // a blue oval that goes round more than once
      const o = [], a0 = srng() * 6.28;
      for (let i = 0; i <= Math.round(n * turns); i++) { const a = a0 + i / n * 6.2832, r = 1 + 0.05 * i / n, ca = Math.cos(a) * r, sa = Math.sin(a) * r; o.push([c[0] + ax[0] * ca + bx[0] * sa, c[1] + ax[1] * ca + bx[1] * sa, c[2] + ax[2] * ca + bx[2] * sa]); }
      return o;
    };
    const place = (strokes, at, yaw, scale, extra = {}) => {      // move a drawing made about the origin to its spot
      const cs = Math.cos(yaw), sn = Math.sin(yaw), T = (p) => [at[0] + (p[0] * cs + p[2] * sn) * scale, at[1] + p[1] * scale, at[2] + (-p[0] * sn + p[2] * cs) * scale];
      return strokes.map((s) => ({ ...s, pts: s.pts.map(T), centre: at, ...extra, amp: s.amp ? s.amp.map((q) => q * scale) : undefined }));
    };

    // ---------- six brown pelicans (or terns) gliding in line astern on the left: we overhaul them in the first seconds ----------
    const birdDrawing = () => {
      const C = [], B = [], wingAmp = (p) => 0.6 * Math.pow(Math.min(1, Math.abs(p[0]) / 1.9), 1.3);
      const st = (pts, press = 1, flap = false) => C.push({ pts, stage: 0, press, amp: flap ? pts.map(wingAmp) : undefined });
      for (const sx of [-1, 1]) {
        st([[sx * 0.16, 0.14, -0.2], [sx * 0.6, 0.6, -0.34], [sx * 1.05, 0.8, -0.3], [sx * 1.55, 0.62, -0.14], [sx * 2.0, 0.3, 0.12]], 1.4, true);
        st([[sx * 2.0, 0.3, 0.12], [sx * 1.8, 0.4, 0.3], [sx * 1.66, 0.5, 0.2], [sx * 1.45, 0.56, 0.36], [sx * 1.28, 0.62, 0.26], [sx * 0.85, 0.58, 0.42], [sx * 0.2, 0.08, 0.32]], 1.0, true);
        st([[sx * 0.55, 0.55, -0.3], [sx * 0.8, 0.52, 0.34]], 0.6, true);
      }
      st([[0, 0.2, -0.52], [0, 0.31, -0.1], [0, 0.22, 0.42], [0, 0.1, 0.78], [0.1, 0.06, 0.92]], 1.1);
      st([[0, 0.0, -0.5], [0, -0.17, -0.1], [0, -0.1, 0.35], [0, 0.06, 0.78], [-0.1, 0.06, 0.92]], 1);
      st([[0, 0.0, -0.5], [0, 0.2, -0.6], [0, 0.4, -0.58], [0, 0.52, -0.7], [0, 0.5, -0.86], [0, 0.4, -0.9]], 1);
      st([[0, 0.47, -0.84], [0, 0.4, -1.2], [0, 0.3, -1.52]], 1.1);
      st([[0, 0.38, -0.84], [0, 0.2, -1.05], [0, 0.2, -1.3], [0, 0.3, -1.52]], 0.8);
      B.push({ pts: oval3([0, 0.06, 0.08], [0, 0, 0.64], [0, 0.27, 0]), stage: 2, press: 0.9, taper: false });
      B.push({ pts: oval3([0, 0.06, 0.08], [0.24, 0, 0], [0, 0, 0.62], 1.1), stage: 2, press: 0.8, taper: false });
      B.push({ pts: oval3([0, 0.45, -0.76], [0, 0, 0.15], [0, 0.13, 0], 1.3, 12), stage: 2, press: 0.8, taper: false });
      const wl = [[-2.2, 0.22, 0.02], [-1.05, 0.76, -0.1], [0, 0.16, -0.05], [1.05, 0.76, -0.1], [2.2, 0.22, 0.02]];
      B.push({ pts: wl, stage: 2, press: 0.9, amp: wl.map(wingAmp) });
      B.push({ pts: [[0, 0.3, -1.66], [0, 0.12, 1.0]], stage: 2, press: 0.8 });
      return [...B, ...roughOf(C, 0.07), ...C];
    };
    const nBird = terns ? 9 : 6, birdScale = terns ? 0.72 : 1.25;
    const flockS = [];
    for (let k = 0; k < nBird; k++) {
      const at = [srng.range(-1, 1) - k * 0.3, 4.6 + k * 0.45 + srng.range(-0.3, 0.3) + (terns ? k % 3 : 0), k * (terns ? 5.2 : 7.6) + srng.range(-0.8, 0.8)];
      // only the leader's centre is its own: the others count as a little further off, so they stay rough when it is cleaned
      flockS.push(...place(birdDrawing(), at, srng.range(-0.06, 0.06), birdScale, { phase: k * 0.137, centre: k === 0 ? at : [at[0] - 72, at[1], at[2]] }));
    }
    const flock = stagedMesh(flockS, terns ? [1.1, 1] : [5.2, 0]);
    await ctx.yield();

    // ---------- two pangas at anchor beside the lane (or one sailing dhow): blue box, rough, clean as we draw level ----------
    const boatDrawing = (sail) => {
      const C = [], B = [], N = 12;
      for (const sx of [-1, 1]) {
        const gun = [], chine = [];
        for (let i = 0; i <= N; i++) { const t = i / N, z = 3.4 - 7.2 * t; gun.push([sx * 0.86 * Math.pow(1 - t * t * t, 0.8), 0.55 + 0.6 * t * t, z]); chine.push([sx * 0.6 * Math.pow(1 - Math.pow(t, 2.4), 0.9), 0.03, z + 0.25 * t]); }
        C.push({ pts: gun, stage: 0, press: 1.3 }, { pts: chine, stage: 0, press: 0.8 });
        C.push({ pts: [[sx * 0.72, 0.64, 2.7], [sx * 0.6, 0.72, 0.4], [sx * 0.5, 0.86, -2.1]], stage: 0, press: 0.75 });            // an oar, shipped
        C.push({ pts: [[sx * 0.5, 0.86, -2.1], [sx * 0.42, 0.98, -2.6], [sx * 0.5, 0.9, -3.0], [sx * 0.6, 0.8, -2.5], [sx * 0.5, 0.86, -2.1]], stage: 0, press: 0.7 });
      }
      C.push({ pts: [[-0.86, 0.55, 3.4], [-0.6, 0.03, 3.4], [0.6, 0.03, 3.4], [0.86, 0.55, 3.4], [-0.86, 0.55, 3.4]], stage: 0, press: 1.1 });
      C.push({ pts: [[0, 1.2, -3.86], [0, 0.6, -3.72], [0, 0.03, -3.3]], stage: 0, press: 1.2 });
      for (const z of [1.7, 0.1, -1.6]) { const hw = 0.82 * Math.pow(1 - Math.pow((3.4 - z) / 7.2, 3), 0.8); C.push({ pts: [[-hw, 0.5, z], [hw, 0.5, z + 0.03]], stage: 0, press: 0.9 }, { pts: [[-hw, 0.5, z + 0.26], [hw, 0.5, z + 0.3]], stage: 0, press: 0.7 }); }
      C.push({ pts: [[0, 0.5, 3.45], [0, 1.0, 3.5], [0.02, 1.02, 3.9], [0, 0.66, 3.92], [0, 0.56, 3.66], [0, 0.0, 3.76]], stage: 0, press: 1.1 });   // the outboard
      C.push({ pts: [[0, 0.95, 3.52], [0.05, 1.0, 2.85]], stage: 0, press: 0.8 });
      const net = []; for (let i = 0; i <= 40; i++) { const a = i * 0.52, r = 0.1 + i * 0.011; net.push([0.08 + Math.cos(a) * r, 0.5 + i * 0.004 + 0.03 * Math.sin(a * 3), 0.9 + Math.sin(a) * r * 1.15]); }
      C.push({ pts: net, stage: 0, press: 0.75 });
      C.push({ pts: [[0, 1.16, -3.84], [0.25, 0.5, -5.2], [0.4, 0.0, -6.6]], stage: 0, press: 0.7 });                                 // the anchor line
      if (sail) {                                                                                                                 // a dhow: mast and lateen yard, the sail only blocked in
        C.push({ pts: [[0, 0.5, -0.6], [0, 5.2, -0.9]], stage: 0, press: 1.2 }, { pts: [[0, 2.2, 2.6], [0, 4.7, -0.9], [0, 6.4, -3.4]], stage: 0, press: 1 });
        B.push({ pts: [[0, 2.2, 2.6], [0, 6.4, -3.4], [0.5, 1.5, -2.9], [0, 2.2, 2.6]], stage: 2, press: 0.9 });
      }
      const X = 0.98, Y0 = 0, Y1 = 1.22, Z0 = -3.95, Z1 = 3.98, over = (a, b, k = 0.12) => [[a[0] - (b[0] - a[0]) * k, a[1] - (b[1] - a[1]) * k, a[2] - (b[2] - a[2]) * k], [b[0] + (b[0] - a[0]) * k, b[1] + (b[1] - a[1]) * k, b[2] + (b[2] - a[2]) * k]];
      for (const x of [-X, X]) for (const y of [Y0, Y1]) B.push({ pts: over([x, y, Z1], [x, y, Z0], y > 0.5 && x > 0 ? 1.1 : 0.14), stage: 2, press: 0.85 });
      for (const z of [Z0, Z1]) for (const y of [Y0, Y1]) B.push({ pts: over([-X, y, z], [X, y, z], 0.2), stage: 2, press: 0.85 });
      for (const z of [Z0, Z1]) for (const x of [-X, X]) B.push({ pts: over([x, Y0, z], [x, Y1, z], 0.25), stage: 2, press: 0.85 });
      B.push({ pts: over([0, 0.03, Z1], [0, 0.03, Z0], 0.5), stage: 2, press: 0.7 });
      return [...B, ...roughOf(C, 0.1), ...C];
    };
    const boats = [];
    const boatStage = { uBold: { value: 1.9 }, uStage: { value: new THREE.Vector3(Math.max(stageV.stage[0], 62), Math.max(stageV.stage[1], 200), stageV.stage[2]) } };   // (cleaned as we draw level, whatever the edition)
    for (const [s, x, yaw, bs = 1] of dhow ? [[238, 26, 2.2]] : [[168, 36, 2.05], [234, 23, 2.2, 1.14]]) {      // broadside to the lane, near enough to read
      const sc = (dhow ? 1.8 : 1.6) * bs, m = stagedMesh(place(boatDrawing(dhow).map((q) => (q.stage === 0 ? { ...q, press: (q.press ?? 1) * 1.5 } : q)), [0, 0, 0], 0, sc, { centre: [0, 0.6, 0] }), [5.5, 0], boatStage);
      m.position.copy(lanePt(s, x, 0)); m.rotation.y = -TURN + yaw;
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(9.5 * sc, 3.2 * sc).rotateX(-Math.PI / 2).rotateY(-TURN + yaw + Math.PI / 2), style.toneMaterial(0));
      sh.position.copy(lanePt(s + 0.6, x + 1.5 * sc, 0.04)); sh.renderOrder = 0; scene.add(sh);
      boats.push({ mesh: m, ph: srng() * 6 });
    }
    await ctx.yield();

    // ---------- three rafts of drifting sargassum: scribble over blue kidney shapes, the nearest cleaned into leaf loops ----------
    const weeds = [];
    for (const [k, at] of [[0, [9, 0.04, -124]], [1, [-37, 0.04, -160]], [2, lanePt(306, -44, 0.04).toArray()]]) {
      const B = [], R = [], C = [], rx = 5.2 - k * 0.6, rz = 3.1;
      B.push({ pts: oval3([-1.2, 0, 0.3], [rx * 0.72, 0, 0.5], [-0.3, 0, rz * 0.8], 1.25, 20), stage: 2, press: 0.9, taper: false });
      B.push({ pts: oval3([1.9, 0, -0.5], [rx * 0.5, 0, -0.6], [0.3, 0, rz * 0.62], 1.2, 18), stage: 2, press: 0.9, taper: false });
      for (let j = 0; j < 4; j++) {
        const pts = []; let a = srng() * 6;
        for (let i = 0; i < 22; i++) { a += 2.2 + srng() * 1.4; const r = 0.25 + 0.75 * srng(); pts.push([(j - 1.5) * 1.6 + Math.cos(a) * r * rx * 0.42, 0, Math.sin(a) * r * rz * 0.8]); }
        R.push({ pts, stage: 1, press: 0.85, amp: pts.map(() => 0.03) });
      }
      if (k === 0) for (let j = 0; j < 16; j++) {
        const a = srng() * 6.28, r = Math.sqrt(srng()), cx = Math.cos(a) * r * rx * 0.8, cz = Math.sin(a) * r * rz * 0.8, d = srng() * 6.28, l = 0.5 + srng() * 0.5, pts = [];
        for (let i = 0; i <= 12; i++) { const t = i / 12 * 6.2832, u = Math.sin(t / 2) * l, w = Math.sin(t) * l * 0.2; pts.push([cx + Math.cos(d) * u - Math.sin(d) * w, 0.04 * Math.sin(t / 2), cz + Math.sin(d) * u + Math.cos(d) * w]); }
        C.push({ pts, stage: 0, press: 0.95, amp: pts.map(() => 0.05) });
        if (j % 3 === 0) C.push({ pts: [[cx, 0, cz], [cx - Math.cos(d + 0.5) * 1.3, 0, cz - Math.sin(d + 0.5) * 1.3], [cx - Math.cos(d + 1.1) * 2.3, 0, cz - Math.sin(d + 1.1) * 2.3]], stage: 0, press: 0.7 });
      }
      weeds.push(...place([...B, ...R, ...C], at, srng() * 3, 1, { phase: k * 0.3, centre: k === 0 ? at : [at[0] + 90, at[1], at[2]] }));
    }
    stagedMesh(weeds, [3.1, 1]);
    await ctx.yield();

    // ---------- the desert headland, far ahead to the right: never more than blue construction ----------
    const V0 = lanePt(200), headS = [];
    const hp = (a, r, y) => { const c = Math.cos(a * DEG), s = Math.sin(a * DEG); return [V0.x + r * (laneDir.x * c + laneRight.x * s), y, V0.z + r * (laneDir.z * c + laneRight.z * s)]; };
    const hA = 19, hB = 51, hk = srng() * 9;
    const ridge = (a) => { const t = (a - hA) / (hB - hA), env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.6); return 300 * env * (0.62 + 0.2 * Math.sin(t * 7 + hk) + 0.12 * Math.sin(t * 17 + hk * 2) + 0.06 * Math.sin(t * 41)); };
    for (let q = 0; q < 2; q++) { const pts = []; for (let a = hA - 0.6 + q * 14; a <= hA + 17 + q * 15.6; a += 0.5) pts.push(hp(a, 1900, ridge(a) + q * 3)); headS.push({ pts, pencil: 1, press: 2, seed: 60 + q }); }
    headS.push({ pts: [hp(hA - 3, 1860, 1), hp(hB + 3, 1860, 1)], pencil: 1, press: 1.5, seed: 63 });
    for (let j = 0; j < 7; j++) { const a = hA + 3 + j * 4.2 + srng() * 2, h = ridge(a), pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(hp(a + t * (2.5 + srng()) * (j % 2 ? 1 : -0.6), 1900 - t * 60, h * (1 - t) * (1 - 0.35 * Math.sin(t * 3.1)))); } headS.push({ pts, pencil: 1, press: 1.3, seed: 70 + j }); }
    for (let j = 0; j < 40; j++) {                                // cardon cacti: a blue cylinder and its centre line
      const a = hA + 2 + srng() * (hB - hA - 4), y0 = ridge(a) * srng.range(0.1, 0.75), r = 1840 - srng() * 60, h = 26 + srng() * 16, w = 0.17;
      headS.push({ pts: [hp(a - w, r, y0), hp(a - w, r, y0 + h), hp(a, r, y0 + h + 4), hp(a + w, r, y0 + h), hp(a + w, r, y0)], pencil: 1, press: 1.2, taper: false, seed: 100 + j });
      headS.push({ pts: [hp(a, r, y0 - 6), hp(a, r, y0 + h + 10)], pencil: 1, press: 0.9, seed: 150 + j });
    }
    const box = (a, r, y, w, h, vp) => {                          // a blue box with its vanishing lines running out past it
      headS.push({ pts: [hp(a - w, r, y), hp(a - w, r, y + h), hp(a + w, r, y + h), hp(a + w, r, y), hp(a - w, r, y)], pencil: 1, press: 1.3, taper: false, seed: a * 9 });
      headS.push({ pts: [hp(a - w * 1.5, r, y + h), hp(a + w * (1 + vp), r, y + h * (1 + 0.08 * vp))], pencil: 1, press: 0.9, seed: a * 7 });
      headS.push({ pts: [hp(a - w * 1.5, r, y), hp(a + w * (1 + vp), r, y - h * 0.05 * vp)], pencil: 1, press: 0.9, seed: a * 5 });
    };
    for (let j = 0; j < 9; j++) box(hA + 5 + j * 1.5 + srng() * 0.6, 1820, ridge(hA + 5 + j * 1.5) * 0.12 + srng() * 14, 0.42, 20 + srng() * 8, 3 + srng() * 3);
    box(hA + 1.2, 1820, 8, 0.2, 78, 1.5); box(hA + 1.2, 1820, 86, 0.32, 14, 2);    // the lighthouse: a tall box and its lamp
    headS.push({ pts: [hp(hA + 1.2, 1820, -6), hp(hA + 1.2, 1820, 122)], pencil: 1, press: 0.9, seed: 5 });
    addStrokes(headS, scene, -2);
    await ctx.yield();

    // ---------- THE FISHING BOAT of the swing (u 0.25): passed close on the right as the eye comes down, its crew two stick figures ----------
    // (one standing amidships with a rod that bobs on twos, its line running down to the water; one sitting in the stern, a hand on
    // the tiller), and beside it in the air the animator's note to himself: an arrow, a ringed 12, two lines of scribble.
    {
      const dB = 0.25 * path.length, PB = path.posAtDist(dB), TB = path.tangentAtDist(dB).setY(0).normalize(), RB = new THREE.Vector3(-TB.z, 0, TB.x);
      const at = PB.clone().setY(0).addScaledVector(TB, 17.5).addScaledVector(RB, 8.5), D = at.clone().sub(PB).setY(0).normalize(), X = new THREE.Vector3(-D.z, 0, D.x);
      // (round 20) the first wash on our own sheet begins at the fishing boat's place along the lane and is densest where the far margin lifts
      paintU.value.set((at.x - L0.x) * laneDir.x + (at.z - L0.z) * laneDir.z, (LIFT - ((L0.x - PP0.x) * pDir.x + (L0.z - PP0.z) * pDir.z)) / (laneDir.x * pDir.x + laneDir.z * pDir.z), 0, 0);
      const ax = D.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -62 * DEG);                     // the bow points away and to the left: a three-quarter view
      const C = [], FS = 1.4, fig = (pts, press = 1.1, amp) => C.push({ pts: pts.map((q) => [q[0] * FS, 0.2 + (q[1] - 0.2) * FS, q[2] < 1.5 ? -0.6 + (q[2] + 0.6) * FS : 2.7 + (q[2] - 2.7) * FS]), stage: 0, press, amp });
      const loop = (c, rx, ry, n = 14) => { const o = []; for (let i = 0; i <= n + 2; i++) { const a = i / n * 6.2832 + 1; o.push([c[0], c[1] + Math.sin(a) * ry, c[2] + Math.cos(a) * rx]); } return o; };
      // the fisherman, standing: legs braced, spine, the head and its hat, both arms out to the rod
      fig([[0.1, 0.2, -0.25], [0.08, 0.62, -0.42], [0.05, 1.0, -0.6]], 1.2); fig([[-0.1, 0.2, -1.05], [-0.06, 0.6, -0.84], [0.05, 1.0, -0.6]], 1.2);
      fig([[0.05, 1.0, -0.6], [0.08, 1.34, -0.66], [0.12, 1.62, -0.6]], 1.3);
      fig(loop([0.12, 1.8, -0.6], 0.13, 0.15), 1.0); fig([[0.12, 1.9, -0.36], [0.12, 1.93, -0.6], [0.12, 1.9, -0.86]], 1.0); fig([[0.12, 1.93, -0.72], [0.12, 2.04, -0.6], [0.12, 1.93, -0.48]], 0.8);
      fig([[0.12, 1.56, -0.6], [0.36, 1.42, -0.48], [0.56, 1.52, -0.4]], 1.0, [0, 0.02, 0.05]); fig([[0.12, 1.56, -0.6], [0.3, 1.3, -0.74], [0.5, 1.4, -0.7]], 1.0, [0, 0.02, 0.04]);
      fig([[0.42, 1.36, -0.62], [0.9, 1.9, -0.3], [1.5, 2.5, 0.0], [2.1, 2.95, 0.3]], 0.9, [0.03, 0.07, 0.13, 0.2]);                // the rod
      fig([[2.1, 2.95, 0.3], [2.3, 1.6, 0.42], [2.36, 0.05, 0.5]], 0.5, [0.2, 0.08, 0]);                                              // its line, down to the water
      fig(loop([2.36, 0.03, 0.5], 0.22, 0.02, 10), 0.6);
      // the helmsman, sitting in the stern
      fig([[0, 0.62, 2.7], [0.02, 0.98, 2.76], [0.04, 1.26, 2.7]], 1.3); fig(loop([0.04, 1.43, 2.7], 0.12, 0.14), 1.0);
      fig([[0.04, 1.2, 2.7], [0.1, 1.0, 3.0], [0.05, 1.0, 3.3]], 1.0); fig([[0, 0.62, 2.7], [0.1, 0.72, 2.2], [0.12, 0.3, 2.0]], 1.1); fig([[0, 0.62, 2.7], [-0.14, 0.7, 2.25], [-0.16, 0.3, 2.1]], 1.1);
      const sc = 2.1, drawing = [...boatDrawing(dhow).map((q) => (q.stage === 0 ? { ...q, press: (q.press ?? 1) * 1.5 } : q)), ...roughOf(C, 0.06, 2), ...C.map((q) => ({ ...q, press: q.press * 1.4 }))];
      const m = stagedMesh(place(drawing, [0, 0, 0], 0, sc, { centre: [0, 0.6, 0] }), [1.7, 1], { ...boatStage, uNear: { value: 8 } });   // no line of this boat is drawn wider than it is at 8 m (the style's measure of a line)
      const yaw = Math.atan2(-ax.x, -ax.z);
      m.position.copy(at); m.rotation.y = yaw;
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(9.5 * sc, 3.4 * sc).rotateX(-Math.PI / 2).rotateY(yaw + Math.PI / 2), style.toneMaterial(0));
      sh.position.copy(at).addScaledVector(laneRight, 1.6 * sc).setY(0.04); sh.renderOrder = 0; scene.add(sh);
      boats.push({ mesh: m, ph: 2.2 });
      // the note, upright in the air to the right of the boat, square to the way we come
      const NS = [], nt = (x, y) => [at.x + X.x * (x - 20.5) + D.x * 1.5, y + 1.2, at.z + X.z * (x - 20.5) + D.z * 1.5], nrg = rng.fork('note');
      const nl = (pts, press = 1.3, pencil = 0) => NS.push({ pts: pts.map(([x, y]) => nt(x + (nrg() - 0.5) * 0.06, y + (nrg() - 0.5) * 0.06)), pencil, press, taper: false, seed: nrg() * 90 });
      { const a = []; for (let i = 0; i <= 12; i++) { const t = i / 12; a.push([13.2 - 4.4 * t - 1.2 * Math.sin(t * 3.1), 8.6 - 3.6 * t * t - 1.2 * t]); } nl(a, 1.5); nl([[8.9, 4.9], [8.6, 3.75], [9.9, 4.0]], 1.5); }
      for (let r = 0; r < 2; r++) { const a = [], w = 5.2 - r * 1.6; for (let i = 0; i <= 22; i++) { const t = i / 22; a.push([13.6 + t * w, 9.6 - r * 1.25 + 0.3 * Math.sin(t * w * 4.2 + r * 2) * (0.5 + nrg())]); } nl(a, 1.1); }
      { let ox = 14.2; for (const ch of '12') { const d = DIGITS[+ch], a = []; for (let k = 0; k + 1 < d.length; k += 2) a.push([ox + (+d[k]) * 0.62 + (+d[k + 1]) * 0.07, 6.3 + (+d[k + 1]) * 0.62]); nl(a, 1.6); ox += 1.15; }
        const a = []; for (let i = 0; i <= 26; i++) { const an = i / 22 * 6.2832 + 0.7, rr = 1 + 0.06 * i / 22; a.push([15.25 + Math.cos(an) * 1.9 * rr, 6.95 + Math.sin(an) * 1.25 * rr]); } nl(a, 1.3); }
      nl([[13.4, 5.2], [17.4, 5.35]], 1.0, 1);
      { // the net the boat has shot: a line of floats bowing out across our course (we pass over it) to a flag buoy on the left
        const W = (tb, rb, y = 0.06) => new THREE.Vector3(PB.x + TB.x * tb + RB.x * rb, y, PB.z + TB.z * tb + RB.z * rb), frg = rng.fork('net');
        const cv = new THREE.CatmullRomCurve3([W(15.4, 7.2), W(10.6, 5), W(8.7, 1), W(9.6, -2.5), W(12.4, -4.6), W(15.5, -5.2)]);
        const A3 = (v) => [v.x, v.y, v.z], ring = (c, r, y, n = 12, ph = 0) => { const o = []; for (let i = 0; i <= n + 2; i++) { const an = i / n * 6.2832 + ph; o.push([c.x + Math.cos(an) * r, y, c.z + Math.sin(an) * r]); } return o; };
        NS.push({ pts: cv.getSpacedPoints(40).map(A3), pencil: 0, press: 0.6, taper: false, seed: 7.7 });
        for (let k = 1; k <= 13; k++) { const c = cv.getPointAt(k / 14.2);
          NS.push({ pts: ring(c, 0.27, 0.08, 10, frg() * 6), pencil: 0, press: 1.25, taper: false, seed: 11 + k });
          if (k % 2) NS.push({ pts: ring(c, 0.5, 0.05, 10, frg() * 6), pencil: 1, press: 0.8, taper: false, seed: 31 + k }); }
        const e = cv.getPointAt(1), up = (h, r = 0) => [e.x + RB.x * (r + 0.16 * h), h, e.z + RB.z * (r + 0.16 * h)];
        NS.push({ pts: [up(0.1), up(1.3), up(2.6)], pencil: 0, press: 1.5, taper: false, seed: 3.1 });                            // the pole, leaning
        NS.push({ pts: [up(2.6), up(2.3, 0.5), up(2.25, 1.0), up(2.1, 0.5), up(1.95)], pencil: 0, press: 1.3, taper: false, seed: 4.3 });   // its flag
        { const o = []; for (let i = 0; i <= 12; i++) { const an = i / 10 * 6.2832; o.push(up(0.34 + Math.sin(an) * 0.3, Math.cos(an) * 0.34 - 0.05)); } NS.push({ pts: o, pencil: 0, press: 1.3, taper: false, seed: 5.9 }); }
        NS.push({ pts: ring(e, 1.0, 0.05, 14), pencil: 1, press: 0.9, taper: false, seed: 6.4 }); NS.push({ pts: [up(-0.2), up(3.1)], pencil: 1, press: 0.8, taper: false, seed: 6.9 });
      }
      addStrokes(NS, scene, 1);
    }
    await ctx.yield();

    // ---------- the shoal under the grid: rays seen from above, sliding up the lane toward us and under the eye ----------
    // Each is first a blue oval gone round twice with its wingtips breaking the paper as graphite ticks; inside 45 m every
    // other one is cleaned up: the kite's outline, a thumb-smudged back and a quick hatch shadow beside it, falling right.
    // The shoal keeps to a window that travels with the eye (from 20 m behind it to 80 m ahead, 18 m either side).
    const SHOAL_GLSL = /* glsl */`
      attribute vec4 aT;                          // x across, place along the loop (0..1), half span, seed (integer part) + kind/4
      uniform vec4 uL0, uShoal;                   // uShoal: length of the loop (m), spread (1 = 40 m either side), where the loop is centred (m along), the eye's x across
      uniform vec2 uPlan[49];
      vec3 onLane(vec2 xs, float y){ vec2 w = uL0.xy + uL0.zw*xs.y + vec2(-uL0.w, uL0.z)*xs.x; return vec3(w.x, y, w.y); }
      vec2 shoalAt(out float seed, out float flap){
        seed = floor(aT.w); float t = clock12()/12., W = 80.*uShoal.y;
        flap = sin(t*2.6 + seed*1.7);
        float x = aT.x*uShoal.y + 1.6*sin(t*0.35 + seed);
        return vec2(uShoal.w + mod(x - uShoal.w + W*0.5, W) - W*0.5, uShoal.z + mod(aT.y*uShoal.x - t*4.2 - uShoal.z, uShoal.x) - 30.);
      }
      float cleaned(float seed, float dist){ return step(dist, 45.)*max(step(0.5, mod(seed, 2.)), step(dist, 22.)*step(cameraPosition.y, 6.5)*step(1.8, cameraPosition.y)); }   // close under a low eye every one is cleaned (not in the first glance, which skims lower still)
      float whole(vec2 c, float hs){
        vec3 w = onLane(c, 0.03); vec2 d = cameraPosition.xz - w.xz; float l = max(length(d), 1e-3);
        vec4 cc = projectionMatrix*viewMatrix*vec4(w + vec3(d.x, 0., d.y)/l*min(hs*1.0, l*0.9), 1.);
        return step(-0.94*cc.w, cc.y)*step(0.1, cc.w)*step(abs(cc.x) + hs*projectionMatrix[0][0], 0.98*cc.w);
      }
      vec2 kite(vec2 pl, float hs, float flap){ return hs*vec2(pl.x*(0.94 + 0.08*flap), -pl.y); }     // nose toward us
    `;
    const SHOAL_VS = SHOAL_GLSL + /* glsl */`
      attribute vec2 aV;                          // u 0..1, side
      varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
      void main(){
        // kind: 0 the blue oval (twice round) | 1 2 the wingtip ticks | 3 the kite's outline | 4 its spine stroke | 5 the whip tail
        float seed, flap, kind = floor(fract(aT.w)*8. + 0.5), hs = aT.z, sgn = kind < 1.5 ? -1. : 1., u = aV.x;
        vec2 c = shoalAt(seed, flap), p, q;
        float dist = length(onLane(c, 0.03) - cameraPosition), cl = cleaned(seed, dist)*whole(c, hs), press = 1.25, wt = 1.;
        if (kind < 0.5){ float an = u*7.3 + seed; vec2 r = hs*vec2(0.98 + 0.1*flap, 0.66)*(1. + 0.04*u); p = c + r*vec2(cos(an), sin(an)); q = c + r*vec2(cos(an + 0.2), sin(an + 0.2)); press = dist < 45. ? 1.25 : 0.85; }
        else if (kind < 2.5){ vec2 b = c + vec2(sgn*hs*(0.92 + 0.1*flap), 0.12*hs), d = vec2(sgn*0.3, -0.45)*hs; p = b + d*(u - 0.3); q = p + d*0.2; press = 1.4; }
        else if (kind < 3.5){ float j = floor(u*48. + 0.5); int i0 = int(clamp(j, 0., 48.)); int i1 = i0 >= 48 ? 1 : i0 + 1;
          p = c + kite(uPlan[i0], hs, flap); q = c + kite(mix(uPlan[i0], uPlan[i1], 0.5), hs, flap);
          press = 0.7 + 0.95*vnoise1(j*0.19 + seed); }                                   // one line, thick and thin
        else if (kind < 4.5){ p = c + kite(vec2(0.025*sin(u*5. + seed), mix(0.36, -0.62, u)), hs, flap); q = c + kite(vec2(0.025*sin(u*5. + 0.4 + seed), mix(0.36, -0.62, u + 0.08)), hs, flap);
          press = 0.3 + 0.9*sin(3.1416*clamp(u, 0.02, 0.98)); }
        else { float wh = sin(clock12()/12.*2.1 + seed), u2 = u + 0.08;
          p = c + kite(vec2(wh*u*u*0.5 + 0.05*sin(u*9. + seed)*u, -0.70 - 1.25*u), hs, flap); q = c + kite(vec2(wh*u2*u2*0.5 + 0.05*sin(u2*9. + seed)*u2, -0.70 - 1.25*u2), hs, flap);
          press = 1.25*(1. - 0.8*u); }
        vec3 P = onLane(p, 0.035), Q = onLane(q, 0.035);
        float show = step(dist, 95.)*(kind < 0.5 ? 1. : kind < 2.5 ? step(-0.1, flap*sin(seed*3.3 + kind)) : cl);
        vec3 o = boil(vec3(0.), seed + kind, clock12(), dist);
        // the cleaned ones nearest the eye are drawn as boldly as any ray in the air; a value step paler further out
        vCol = kind < 0.5 ? mix(uBlue, uPaper, dist < 45. ? (cl > 0.5 ? 0.3 : 0.) : 0.2) : kind < 2.5 ? mix(uGraphite, uSmudge, 0.3)
          : dist < 17. ? uGraphite : dist < 30. ? mix(uGraphite, uSmudge, 0.35) : mix(uGraphite, uSmudge, 0.6);
        if (kind > 2.5) wt = (dist < 17. ? 2.3 : dist < 30. ? 1.7 : 1.2)*(kind > 3.5 ? 0.75 : 1.);
        gl_Position = ribbon(P + o, Q + o, aV.y, press, wt, vPx);
        if (show < 0.5) gl_Position = vec4(0., 0., 2., 1.);
        vW = P; vUVK = vec3(u*4., aV.y, show);
      }`;
    // the cleaned ones' tone: a fan over the kite, a little larger than its outline (the thumb smudge overshoots the line)
    const SHOALFILL_VS = SHOAL_GLSL + /* glsl */`
      attribute vec3 aP; varying vec3 vW; varying vec3 vPl;
      void main(){
        float seed, flap, hs = aT.z; vec2 c = shoalAt(seed, flap);
        float dist = length(onLane(c, 0.03) - cameraPosition), show = cleaned(seed, dist)*whole(c, hs);
        vec2 p = c + kite(aP.xy*(1. + 0.1*aP.z), hs, flap);
        vec4 w = vec4(onLane(p, 0.022), 1.);
        vW = w.xyz; vPl = vec3(aP.xy, aP.z);
        gl_Position = show > 0.5 ? projectionMatrix*viewMatrix*w : vec4(0., 0., 2., 1.);
      }`;
    const SHOALFILL_FS = /* glsl */`
      varying vec3 vW; varying vec3 vPl;
      void main(){
        float dist = max(length(vW - cameraPosition), 0.3), g = grainAt(vW, dist);
        // the smudge is rubbed on in streaks that follow the sweep of the wings; paper and grid show between them
        vec2 sp = vec2(vPl.x*1.1 + vW.x*0.13, (vPl.y + 0.42*abs(vPl.x))*6.5 + vW.z*0.07);
        float streak = vnoise2(sp), tone = streak*0.6 + g*0.4 + 0.1*(1. - vPl.z);
        if (vPl.z > 0.86 + 0.3*vnoise2(vW.xz*1.7)) discard;        // a ragged edge, a little outside the line
        if (tone < 0.44) discard;
        vec3 col = mix(uPaper, uSmudge, tone > 0.63 ? 1. : 0.66);
        // the dark of the back along the spine, a step deeper
        float sx = abs(vPl.x), dk = step(sx, 0.2 + 0.12*vnoise2(sp*0.7 + 5.))*step(0.5, streak);
        col = mix(col, mix(uSmudge, uGraphite, 0.35), dk);
        gl_FragColor = vec4(toScene(col), 1.);
      }`;
    const nShoal = Math.round(130 * Math.max(0.7, detail)), shoalRng = rng.fork('shoal');
    // (laid out on a jittered lattice, five abreast, so the water under the eye is never empty for long; since round 20 the lane's
    // shoal has a second lattice of rays in the middle, see below, and there rays do lie across one another)
    const shoalRows = Math.ceil(nShoal / 5), rowPh = Array.from({ length: shoalRows }, () => shoalRng());
    const shoalSeed = Array.from({ length: nShoal }, (_, i) => { const row = Math.floor(i / 5), col = i % 5;
      return [(((col + rowPh[row] + shoalRng.range(-0.3, 0.3)) / 5 + 1) % 1) * 80 - 40, (row + shoalRng.range(0.1, 0.9)) / shoalRows, shoalRng.range(1.2, 2.4) * (mantas ? 1.2 : 1), i * 3 + Math.floor(shoalRng() * 3)]; });
    // two shoals: the one under the lane, and one that comes down the first course right under the eye
    const shoalU = [{ uL0: laneU.uL0, uShoal: { value: new THREE.Vector4(84, 0.42, -22, 0) }, uPlan: hero.rayUniforms.uPlan },
      { uL0: { value: new THREE.Vector4(1.5, 30, 0.02, -1) }, uShoal: { value: new THREE.Vector4(90, 0.4, 0, 0) }, uPlan: hero.rayUniforms.uPlan }];
    const shoalMats = shoalU.map((U) => style.lineMaterial(SHOAL_VS, U));
    const shoalFill = shoalU.map((U) => new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...U }, side: THREE.DoubleSide, vertexShader: style.GLSL + SHOALFILL_VS, fragmentShader: style.GLSL + SHOALFILL_FS }));
    disposables.push(...shoalFill);
    const bandU = { value: new THREE.Vector2(0, 0) };      // (round 20) the band of the lane the middle's new rays keep to
    for (const [segs, kinds] of [[22, [0]], [1, [1, 2]], [48, [3]], [8, [4, 5]]]) {
      const g = stripGeo(segs, nShoal * kinds.length, (a, v, i) => { const r = shoalSeed[i % nShoal]; a[v] = r[0]; a[v + 1] = r[1]; a[v + 2] = r[2]; a[v + 3] = r[3] + kinds[Math.floor(i / nShoal)] / 8; });
      for (const sm of shoalMats) { const m = new THREE.Mesh(g, sm); m.frustumCulled = false; m.renderOrder = 0; scene.add(m); }
    }
    {
      const plan = hero.rayUniforms.uPlan.value, aP = [], idx = [];
      aP.push(0, -0.05, 0); for (let j = 0; j <= 48; j++) aP.push(plan[j].x, plan[j].y, 1); for (let j = 0; j < 48; j++) idx.push(0, 1 + j, 2 + j);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(aP.length), 3)); g.setAttribute('aP', new THREE.BufferAttribute(new Float32Array(aP), 3)); g.setIndex(idx);
      const aT = new Float32Array(nShoal * 4); shoalSeed.forEach((r, i) => aT.set(r, i * 4));
      g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); g.instanceCount = nShoal;
      for (const fm of shoalFill) { const m = new THREE.Mesh(g, fm); m.frustumCulled = false; m.renderOrder = -1; scene.add(m); }
    }
    // (round 20) MORE RAYS IN THE MIDDLE: between the squadron and the long left turn the shoal under the lane gains rays at two more sizes,
    // a half and one and a half times. They are dealt by the shoal's own stream AFTER its last draw (every ray of live stands where it
    // stands), on the same jittered lattice five abreast, and drawn by the shoal's own shaders; one in four is the larger size, so that
    // fewer lie across one another. A ray of these is drawn only while ITS OWN PLACE ALONG THE LANE lies between the lane metre where the last ray of
    // the squadron comes down (the furthest landing of its seven leaps) and 352 (the long left turn). At either end, over 12 m of the lane, it is a drawing
    // being made or rubbed back: only its blue oval, and of that only as much of the stroke as its place has earned; the ticks, the clean
    // kite and its tone come when the oval is whole. No fade and no cut line: a rule of the lane's metres, the same on every seed.
    {
      const nMore = Math.round(100 * Math.max(0.7, detail)), rows2 = Math.ceil(nMore / 5), rowPh2 = Array.from({ length: rows2 }, () => shoalRng());
      const more = Array.from({ length: nMore }, (_, i) => { const row = Math.floor(i / 5), col = i % 5;
        return [(((col + rowPh2[row] + shoalRng.range(-0.3, 0.3)) / 5 + 1) % 1) * 80 - 40, (row + shoalRng.range(0.1, 0.9)) / rows2, shoalRng.range(1.2, 2.4) * (mantas ? 1.2 : 1) * (i % 4 === 1 ? 1.5 : 0.5), (nShoal + i) * 3 + Math.floor(shoalRng() * 3)]; });
      bandU.value.set(Math.max(...squad.map((l) => (l.x + Math.cos(l.heading) * l.length / 2 - L0.x) * laneDir.x + (l.z + Math.sin(l.heading) * l.length / 2 - L0.z) * laneDir.z)), S_T);
      const BAND = 'uniform vec2 uBand; float band(float s){ return min(clamp((s - uBand.x)/12., 0., 1.), clamp((uBand.y - s)/12., 0., 1.)); }\n';
      const U2 = { ...shoalU[0], uBand: bandU };
      const lm = style.lineMaterial(BAND + SHOAL_VS.replace('cl = cleaned(seed, dist)*whole(c, hs), press = 1.25, wt = 1.;', 'bq = band(c.y), cl = cleaned(seed, dist)*whole(c, hs)*step(0.999, bq), press = 1.25, wt = 1.;')
        .replace('float an = u*7.3 + seed;', 'float an = u*bq*7.3 + seed;')
        .replace('float show = step(dist, 95.)*(kind < 0.5 ? 1. : kind < 2.5 ? step(-0.1, flap*sin(seed*3.3 + kind)) : cl);', 'float show = step(dist, 95.)*(kind < 0.5 ? step(0.001, bq) : kind < 2.5 ? step(0.999, bq)*step(-0.1, flap*sin(seed*3.3 + kind)) : cl);'), U2);
      const fm = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...U2 }, side: THREE.DoubleSide,
        vertexShader: style.GLSL + BAND + SHOALFILL_VS.replace('show = cleaned(seed, dist)*whole(c, hs);', 'show = cleaned(seed, dist)*whole(c, hs)*step(0.999, band(c.y));'), fragmentShader: style.GLSL + SHOALFILL_FS });
      disposables.push(fm);
      for (const [segs, kinds] of [[22, [0]], [1, [1, 2]], [48, [3]], [8, [4, 5]]]) {
        const g = stripGeo(segs, nMore * kinds.length, (a, v, i) => { const r = more[i % nMore]; a[v] = r[0]; a[v + 1] = r[1]; a[v + 2] = r[2]; a[v + 3] = r[3] + kinds[Math.floor(i / nMore)] / 8; });
        const m = new THREE.Mesh(g, lm); m.frustumCulled = false; m.renderOrder = 0; scene.add(m);
      }
      const plan = hero.rayUniforms.uPlan.value, aP = [], idx = [];
      aP.push(0, -0.05, 0); for (let j = 0; j <= 48; j++) aP.push(plan[j].x, plan[j].y, 1); for (let j = 0; j < 48; j++) idx.push(0, 1 + j, 2 + j);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(aP.length), 3)); g.setAttribute('aP', new THREE.BufferAttribute(new Float32Array(aP), 3)); g.setIndex(idx);
      const aT = new Float32Array(nMore * 4); more.forEach((r, i) => aT.set(r, i * 4));
      g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); g.instanceCount = nMore;
      const m = new THREE.Mesh(g, fm); m.frustumCulled = false; m.renderOrder = -1; scene.add(m);
    }
    await ctx.yield();
    // ---------- the last living thing: one more bird crossing the lifted page above the peg hole, its hatch shadow stepping over the sheet ----------
    // (a flat drawing held parallel to the sheet, like the frigatebirds of the sky: a blue oval, the wing tick, the forked tail; two wing positions)
    const lastBird = new THREE.Group(); lastBird.matrixAutoUpdate = false; lastBird.visible = false; scene.add(lastBird);
    const birdUp = new THREE.Vector3().copy(pDir).multiplyScalar(Math.cos(110 * DEG)).setY(Math.sin(110 * DEG)), birdN = new THREE.Vector3().crossVectors(pRight, birdUp);
    const birdWings = [0, 1].map((w) => {
      const B = [], sc = terns ? 0.6 : 0.9, dip = w ? -0.55 : 0.5, q = (x, y) => [x * sc, y * sc, 0];
      B.push({ pts: [q(-3.6, -0.3 + dip * 0.9), q(-2.5, 0.55 + dip * 0.5), q(-1.3, 0.95), q(-0.35, 0.3), q(0.25, 0.3), q(1.3, 1.0), q(2.6, 0.6 + dip * 0.5), q(3.7, -0.2 + dip * 0.9)], pencil: 0, press: 1.7, seed: 3 + w });
      B.push({ pts: [q(-1.3, 0.95), q(-0.9, 0.45), q(-0.2, -0.1)], pencil: 0, press: 1.0, seed: 5 + w }, { pts: [q(1.3, 1.0), q(0.9, 0.5), q(0.15, -0.1)], pencil: 0, press: 1.0, seed: 6 + w });
      B.push({ pts: [q(0, 0.2), q(-0.15, -0.9), q(-0.7, -2.0)], pencil: 0, press: 1.1, seed: 7 }, { pts: [q(0, 0.2), q(0.2, -0.9), q(0.5, -2.1)], pencil: 0, press: 1.1, seed: 8 });
      B.push({ pts: [q(0, 0.25), q(0.1, 0.8), q(0.5, 1.15)], pencil: 0, press: 1.2, seed: 9 });
      const ov = []; for (let i = 0; i <= 22; i++) { const a = i / 18 * 6.2832 + 0.6, r = 1 + 0.05 * i / 18; ov.push(q(Math.cos(a) * 0.5 * r + 0.02, Math.sin(a) * 0.95 * r - 0.1)); }
      B.push({ pts: ov, pencil: 1, press: 0.9, taper: false, seed: 11 }, { pts: [q(-4.2, 0.35), q(4.3, 0.45)], pencil: 1, press: 0.8, seed: 12 });
      return addStrokes(B, lastBird, 2);
    });
    const BIRD_N = 64, BIRD_U0 = 0.865, BIRD_U1 = 0.995, birdTrack = new Float32Array(BIRD_N * 5);
    for (let i = 0; i < BIRD_N; i++) { const t = i / (BIRD_N - 1), x = -31 + 57 * t, v = HOLE_V + 8.7 - 2.4 * t + 0.5 * Math.sin(t * 9), P = sheetAt(x, v, 6.5); birdTrack.set([P[0], P[1], P[2], x + 2.4, v - 1.7], i * 5); }
    await ctx.yield();

    // ---------- the sea to the left of the colonnade: leaps on spots of their own, so the left of the frame is never bare ----------
    // (the windows of the wider sea follow the eye, and the course keeps to the right of the lane: without these the left is thin).
    // Each is on the world's clock, at its own stage: near ones bodied with their hatch shadows, further out a rough scribble
    // over its blue oval, an arc being pencilled from water to water, a crown opening; a row of small arcs further off.
    const leftRng = rng.fork('left');
    const leftAt = [[95, -34], [128, -52], [156, -32], [180, -66], [240, -80], [262, -30], [286, -52], [312, -34], [330, -70],
      [112, -72], [142, -90], [202, -40], [218, -64], [250, -44], [274, -74], [298, -30], [322, -58], [342, -40], [306, -90], [280, -62], [300, -76], [318, -100],
      [300, -110, 1.5], [345, -128, 1.5], [270, -150, 1.6], [330, -175, 1.7], [230, -185, 1.7], [290, -215, 1.8], [190, -140, 1.6], [150, -110, 1.5],
      [100, -27], [119, -24], [84, -31]];                         // (three more abreast of the first arches, where the eye climbs out of the lane)
    const poolF = makeLeapPool(style, hero.rayUniforms, { leaps: leftAt.map(([ls, lx, sz = 1], i) => { const P = lanePt(ls, lx);
        return { x: P.x, z: P.z, heading: leftRng() * 6.2832, phase: (i * 1.93 + leftRng() * 0.8) % 5.2, height: leftRng.range(4.8, 7.2) * sz, half: leftRng.range(2.7, 3.4) * big * sz, length: leftRng.range(14, 19) * sz, id: 70 + i * 3 }; }),
      skins: [4], plan: 3, dark: true, hull: true, shadow: true, splash: [3], arc: [24, 6], period: 5.2, rng: leftRng });
    scene.add(poolF.group);
    await ctx.yield();

    // ==== the flight ====
    const camP = new THREE.Vector3(), prevP = new THREE.Vector3(), vel = new THREE.Vector3(); let first = true;
    // (round 19) INSIDE THE ARCADE THE BLUE STANDS BACK: while the eye is in the colonnade the non-photo blue pencil is drawn at
    // half strength (its one colour mixed BLUE_BACK toward the paper), so the graphite rays and the arcs of action read clear of
    // the construction. One law for every ray, edition and seed: a smooth window on the eye's place along the lane (lane metres,
    // the s the Arcade's own clock reads), whose ends are the colonnade's own: it comes in over the first four arches, from the
    // first arch on, and goes out over the last four, whole again at the last arch. The blue is lighter, never gone; the arcs'
    // pencil, the graphite and the tone are untouched. Before the first arch and after the last the blue is at full strength.
    const BLUE_BACK = 0.5, BLUE_EASE = 4 * LANE.pitch, ARCH = hero.anchors.arches, ARCH_A = ARCH[0].s, ARCH_Z = ARCH[ARCH.length - 1].s;
    const BLUE_IN = [ARCH_A, ARCH_A + BLUE_EASE], BLUE_OUT = [ARCH_Z - BLUE_EASE, ARCH_Z];
    const blue0 = style.uniforms.uBlue.value.clone(), paper0 = style.uniforms.uPaper.value.clone();
    const FLIP_U = 0.612;
    const upV = new THREE.Vector3(), upAt = (time, u) => { path.pointAt(u, upV); const s = (upV.x - L0.x) * laneDir.x + (upV.z - L0.z) * laneDir.z; return upV.copy(lanePt(s + 34, 0, 13)); };
    const boatAt = boats[boats.length - 1].mesh.position.clone().setY(2.2);
    const pois = [
      { at: downAt, from: 0.105, to: 0.2, weight: 0.7 },                       // at the top of the climb the gaze tips down onto the ray gliding below
      { at: boatAt, from: 0.19, to: 0.278, weight: 0.5 },                       // coming down in the swing the gaze leans to the fishing boat
      { at: paceAt, from: 0.298, to: 0.395, weight: 0.7, fade: 0.22 },                     // the gaze stays with the ray beside us until it has gone in
      { at: upAt, from: 0.585, to: 0.7, weight: 0.3 },
      { at: sqAt, from: 0.376, to: 0.475, weight: 0.52, fade: 0.22 },                      // out between two feet, 10 m up: the gaze tips down onto the squadron gliding under us
      { at: lanePt(190, 4, 5), from: 0.48, to: 0.56, weight: 0.35 },          // along the outside of the colonnade: the gaze leans a little toward it
      { at: seat, from: 0.56, to: 0.9, weight: 0.45 },
    ];
    return {
      scene, path, duration,
      // the flight lingers a little at its three close passes (the boat, the ray alongside, the squadron under the eye) and before the great sheet
      pace: (u) => { const b = (c, w) => { const x = Math.abs(u - c) / w; return x >= 1 ? 0 : (1 - x * x) ** 2; }; return 1 - 0.28 * b(0.25, 0.05) - 0.3 * b(0.34, 0.05) - 0.3 * b(0.44, 0.05) - 0.2 * b(0.615, 0.05); },
      title: mantas ? 'Arcade of Leaps: the manta reel' : stageV.name === 'pencil test' ? 'Arcade of Leaps' : `Arcade of Leaps: ${stageV.name}`,
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 30, sway: 0, bank: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 7, color: pal[1], style: 'ring', glow: 0, halo: false, veil: sceneHex(pal[4]), tilt: true, revealDistance: 420, blendDistance: 25 },   // the paper keeps its exact colour to the last 25 m
      post: { exposure, bloom: { strength: 0, radius: 0.1, threshold: 2 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.1, grain: 0.012, aberration: 0 } },
      update(dt, time, camera, u) {
        style.update(time, ctx.renderer);
        camP.setFromMatrixPosition(camera.matrixWorld);
        if (first) { prevP.copy(camP); first = false; }
        const jump = camP.distanceTo(prevP);
        if (dt > 1e-4 && jump < 6) vel.lerp(prevP.subVectors(camP, prevP).divideScalar(dt), 1 - Math.exp(-dt * 5));
        else if (jump >= 6) vel.set(0, 0, 0);
        if (vel.length() > 30) vel.setLength(30);
        prevP.copy(camP);
        { const sE = (camP.x - L0.x) * laneDir.x + (camP.z - L0.z) * laneDir.z;                    // the eye's place along the lane
          const q = BLUE_BACK * THREE.MathUtils.smoothstep(sE, BLUE_IN[0], BLUE_IN[1]) * (1 - THREE.MathUtils.smoothstep(sE, BLUE_OUT[0], BLUE_OUT[1]));
          style.uniforms.uBlue.value.copy(blue0).lerp(paper0, q); }
        // the sky is at infinity; it sinks a little as the eye climbs so the ruled horizon stays on the sheet's far edge
        skyG.position.set(camP.x, camP.y - (camP.y - 2) * 1.2 - 2, camP.z);
        clouds.rotation.y = -Math.floor(time) * 0.0028;
        { const fl = Math.floor(time * 1.4) % 2; nextFlip[0].visible = nextFill[0].visible = fl === 0; nextFlip[1].visible = nextFill[1].visible = fl === 1; nextPoseU.value = fl; }      // the animator flips to the sheet after and back
        frigates.rotation.y = -Math.floor(time * 12) / 12 * 0.011;
        tickU.uTick.value.x = swellU.uTick.value.x = camP.x; tickU.uTick.value.y = swellU.uTick.value.y = camP.z;
        for (const p of [poolA, poolB1, poolB, poolC]) p.set(time, camP.x, camP.z, vel.x, vel.z);
        poolD.set(time, 0, 0, 0, 0); poolF.set(time, 0, 0, 0, 0);
        for (const p of [poolE, poolL, poolP, poolQ, poolR]) p.set(u * duration, 0, 0, 0, 0);
        const st12 = Math.floor(time * 12) / 12, fu = Math.floor(u * duration * 12) / 12;        // the living are on twos
        flock.position.set(-22, 0, -62 - fu * 12);
        shoalU[1].uShoal.value.z = Math.min(150, 40 - camP.z);                  // the first course's shoal keeps to a window that travels with the eye
        const sEye = (camP.x - L0.x) * laneDir.x + (camP.z - L0.z) * laneDir.z, xEye = (camP.x - L0.x) * laneRight.x + (camP.z - L0.z) * laneRight.z;
        shoalU[0].uShoal.value.set(84, 0.42, Math.min(Math.max(-60, sEye) + 10, 372), xEye);     // ... and so does the lane's: from 20 m behind the eye to 80 m ahead, right under it
        wreathU.value = Math.floor((u * duration - WREATH_T0) * 4);            // the last leap, round the peg hole: four drawings a second
        const bi = Math.floor((fu / duration - BIRD_U0) / (BIRD_U1 - BIRD_U0) * (BIRD_N - 1));
        lastBird.visible = bi >= 0 && bi < BIRD_N;
        if (lastBird.visible) {
          lastBird.matrix.makeBasis(pRight, birdUp, birdN).setPosition(birdTrack[bi * 5], birdTrack[bi * 5 + 1], birdTrack[bi * 5 + 2]); lastBird.matrixWorldNeedsUpdate = true;
          birdWings[0].visible = bi % 20 < 13; birdWings[1].visible = !birdWings[0].visible; birdU.value.set(birdTrack[bi * 5 + 3], birdTrack[bi * 5 + 4], 1); } else birdU.value.z = 0;
        for (const b of boats) { b.mesh.rotation.x = 0.03 * Math.sin(st12 * 1.1 + b.ph); b.mesh.rotation.z = 0.05 * Math.sin(st12 * 0.8 + b.ph * 2); b.mesh.position.y = 0.05 * Math.sin(st12 * 1.3 + b.ph); }
        hero.update(dt, time, camera);
        if (rare) { const t = (u - FLIP_U) * duration; hero.flipTest(t >= 0 && t < 5 ? t : -1, 0); }
      },
      dispose() { hero.dispose(); style.dispose(); for (const d of disposables) d.dispose(); for (const p of [...pools, poolF]) { for (const g of p.geos) g.dispose(); for (const m of p.mats) m.dispose(); } },
    };
  },
};
