// THE ROOM THAT IS A CAMERA
// A shuttered quayside bedroom built fifty times life size is a camera obscura. One hole in the shutter
// (125, 72, -60) throws the live harbour upside down over floor, bed and walls; the camera is a dust mote.
// Style rules (kept by the shaders in ../parts/room-is-a-camera.js, used for every surface here): the room owns
// no light; one hole, one picture; a shadow is the absence of picture, hard and radial from the hole; glass turns
// the picture upright and is the only thing that blooms. No lights, no fog, no full-screen pass.
//
// Flight (44 s): in at the far corner by the shutter wall, the whole dark room in one frame: the hole blazing at the
// right with its fan of coloured dust, the bentwood chair in a blue cone on the boards, the iron bed, and on the
// bed-head wall the harbour hanging upside down -> a look down the fan at the chair -> WITH the beam past the bed's
// foot and along its side toward the screen, the gaze on one thing of the room, the hull hanging mast-down on the
// bed-head wall (at arm's length by the turn), the room with the bed lying before the eye
// -> one turn, 24 m from the wallpaper, and the blazing hole swings by with its fan overhead -> across the bed's
// width (the place to linger: the linen below, the washstand above; the moth lifts as we pass the bed's middle and
// goes to the carafe) -> the washstand, and round the carafe: the ball that holds the whole bay upright, the moth
// circling over its top before it crosses the beam and flies away up it -> ONE turn of the gaze
// to the left: over the counterpane from its back side and down the room, the look back, held (the bed, the chair in
// its cone under the wedges of dust from the dark shutter wall), then up by the chair's back and along the shutters to
// the hole while the path slides onto the beam's axis, and the last 67.5 m level and straight up the axis, the gaze on
// the hole, through eight uneven cones of dust (flecks drawn as dashes by the mote's own speed) into the bore of the
// hole (a knot bored through a board 5 m thick; the portal, a bare opening, sits at its outer lip, x 130).
// Every look, every ramp of the pace and of the dust is given by places of the room (the route's u abeam of a thing,
// so many metres on); the moth lifts as we pass the middle of its bed; nothing is keyed to the clock.
//
// Per seed: hour (morning, dawn, evening, night; ctx.vary.hour honoured), weather (fair, squall, sea fog burning
// off), cast (luggers, regatta, tugs and steamers), room (plum sprig, sage stripe, whitewash), fold layout, fleet.
// Rare (ctx.vary.rare): the near sail, the whole room going sail-tan for three seconds as we cross the counterpane.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, matteMaterial, linenMaterial, makeMotes, makeShafts, makeShaftDust, dress, foldHeight, STYLE_GLSL, HOLE } from '../parts/room-is-a-camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const RX0 = -90, RX1 = 125, RZ0 = -110, RZ1 = 125, RH = 145;      // the room
const EXPOSURE = 1.5;

// a rod between two points (own copy: the part keeps its helper private)
function rod(a, b, r, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, seg, 1, false);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  return g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
}
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const tube = (pts, r, seg = 24, rs = 7) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false);

export default {
  id: 'room-is-a-camera',
  name: 'The Room That Is a Camera',
  category: 'domestic',
  weirdness: 0.3,
  media: ['tiny', 'interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1);
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    // ---- the edition, chosen once (every draw in a fixed order)
    const weatherRoll = rng(), hourRoll = rng(), squallPhase = rng(), castRoll = rng(), roomRoll = rng();
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'evening' : vary.hour === 'dawn' ? 'dawn' : vary.hour === 'day' ? 'morning'
      : hourRoll < 0.56 ? 'morning' : hourRoll < 0.76 ? 'evening' : hourRoll < 0.88 ? 'dawn' : 'night';
    const weather = weatherRoll < 0.4 ? 'fair' : weatherRoll < 0.52 ? 'squall' : weatherRoll < 0.64 ? 'fog' : 'fair';
    const cast = castRoll < 0.55 ? 0 : castRoll < 0.8 ? 1 : 2;                   // luggers, regatta, tugs and steamers
    const room = roomRoll < 0.5 ? 0 : roomRoll < 0.7 ? 1 : 2;                   // plum sprig, sage stripe, whitewash
    const exposure = hour === 'night' ? EXPOSURE * 1.25 : EXPOSURE;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const style = await makeStyle(ctx, { hour, density: clamp(dens * (cast === 2 ? 0.45 : 1), 0.4, 1), exposure });
    const U = style.uniforms, pal = style.pal;
    U.uFold.value.w = 0.36 + 0.04 * U.uFold.value.w;      // low ridges under a metre high (0.83 to 0.85 m): under a nine-degree beam the black lakes behind them take about a fifth of the linen (at 0.6 m the far slopes are barely steeper than the beam and there is no lake at all: 3 percent of the linen, measured)
    U.uVar.value.set(cast, weather === 'squall' ? 1 + squallPhase * 0.999 : 0, weather === 'fog' ? 1 : 0, room);
    if (cast === 2) U.uSteam.value.w = 3;
    await ctx.yield();
    // ---- the route (44 s). In at the far corner by the shutter wall, the whole room in one frame, the hole and its fan
    // at the right; a look down the fan at the chair; then WITH the beam along the bed's far side, the gaze on the
    // bed-head wall, the screen, and the hull hanging mast-down on it (at arm's length by the turn), the room with the bed before the eye; a
    // right turn 25 m from that wallpaper, the gaze leading it round while the black shutter wall and the blazing hole
    // swing by with the shafts fanning from them; across the bed's width 14 to 19 m above the linen, the washstand
    // ahead and above (the moth lifts as we pass the bed's middle); round the carafe's front 11 m off; then along the washstand and up, while
    // the gaze turns once, to the left: over the counterpane from its back side, down the room (held), up by the chair's
    // back and along the shutters to the hole; one slide onto the beam's axis, which is joined at x 62.5; then 67.5 m
    // dead level and straight up the axis (y 72, z -60) into the bore, the gaze on the hole.
    const path = makePath([
      [82, 60, 118], [75, 60, 97], [64, 60.5, 77], [48, 61.5, 62], [28, 63, 54], [6, 65, 52.5], [-17, 67, 56.5], [-38, 68.5, 60], [-55, 68.8, 55.5], [-64.5, 67.5, 41], [-66, 65, 22],
      [-63, 62, 2], [-59, 60, -18], [-57, 58.5, -36], [-56.5, 57.3, -53], [-53.5, 56.4, -65.5], [-45.5, 56, -72.3], [-36, 56, -73.5], [-26.5, 56.6, -75.5], [-14, 58.6, -78.5],
      [1, 62, -80], [16, 65.6, -78.5], [30, 68.6, -73.5], [42, 70.7, -66.8], [51, 71.7, -62], [57.5, 72, -60.2], [62, 72, -60], [68, 72, -60], [78, 72, -60], [90, 72, -60], [102, 72, -60], [114, 72, -60], [HOLE.x + 5, HOLE.y, HOLE.z],
    ]);
    // WHERE things happen is given by places of the room: the route's u at a place (the point of the route nearest to it
    // in plan), so many metres further on. Every look window, every ramp of the pace and of the dust below is worked out
    // from these at build; none is a typed u.
    const LEN = path.length, uAt = (x, z, metres = 0) => path.nearestXZ(x, z).u + metres / LEN;
    const uChair = uAt(70, 12),          // abeam of the bentwood chair
      uRug = uAt(8, 47),                 // over the rag rug by the bed's foot
      uWall = uAt(-90, 57),              // the turn: nearest to the hull's place on the bed-head wall
      uHeadN = uAt(-88.4, 23),           // level with the head rail's north post: the eye comes over the bed
      uPilN = uAt(-76.2, 3.5),           // abeam of the north pillow
      uBedMid = uAt(-33, -15),           // abeam of the bed's middle
      uPilS = uAt(-75.5, -31.5),         // abeam of the south pillow
      uHeadS = uAt(-88.4, -53),          // level with the head rail's south post: the eye leaves the bed
      uCar = uAt(-36, -84),              // abeam of the carafe
      uWash = uAt(-20, -77),             // abeam of the marble's east corner: the washstand is rounded
      uPost = uAt(23.6, -53),            // abeam of the foot rail's south post (the route's nearest point to it)
      uAxis = uAt(62.5, -60),            // where the route comes onto the beam's axis
      uFace = uAt(95, -60);              // on the axis, 30 m short of the shutter wall's room face
    // The pace. Slow on arrival (the whole room in one frame), gathering way until 40 m short of the chair; with the
    // beam at the flight's own speed; lingering over the linen (from the north pillow, full by the bed's middle), round
    // the carafe and through the turn and the look back down the room (the design as amended has the look back slow),
    // easing off between the foot rail's post and the axis; then on up the beam, the pace rising from that post to
    // 30 m along the axis, and easing a little over the last 35 m to the bore's outer lip.
    const pace = (u) => 1.0 - 0.37 * (1 - smoothstep(0, uChair - 40 / LEN, u)) - 0.16 * smoothstep(uPilN, uBedMid, u) * (1 - smoothstep(uPost, uAxis, u))
      + 0.25 * smoothstep(uPost, uAxis + 30 / LEN, u) - 0.03 * smoothstep(uFace, 1, u);
    // seconds of the flight at a place, and the u reached after so many seconds, through this pace
    const DURATION = 44, clock = (() => {
      const N = 880, t = new Float64Array(N + 1);
      for (let i = 0; i < N; i++) t[i + 1] = t[i] + 1 / clamp(pace((i + 0.5) / N), 0.35, 2.5);
      const k = DURATION / t[N];
      const uOf = (s) => { let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (k * t[m] < s) lo = m; else hi = m; } return (lo + clamp((s / k - t[lo]) / (t[hi] - t[lo]), 0, 1)) / N; };
      const sOf = (u) => { const x = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(x)); return k * (t[i] + (t[i + 1] - t[i]) * (x - i)); };
      return { uOf, sOf };
    })();
    // The moth's own course. It rests on the linen near x -45, z -42, on the slope that faces the hole most steeply
    // (between the shadow lines of the foot rail's post and its first spindle), and it lifts as we pass the middle of the
    // bed it rests on. From the lift it flies one course through places of the room at one even speed (8 m/s: seconds
    // since the lift give its place along the course). A moth goes to the light: up off the linen over the
    // counterpane's south hem; across to the carafe's west side; a half turn round the carafe on its far side from our
    // route (west, south, east: the side of the wall behind the washstand, never between the carafe and the route), at
    // the least radius that keeps its wing tips 2 m off the tumbler upturned over the neck; then from the carafe's east
    // side up to the beam's axis (y 72, z -60) between bed and washstand, and away up the fan toward the hole, in the
    // fan's upper cones 14 to 20 m above the axis (over the foot rail's posts), the course ending at the bore's upper
    // lip. Its height by the carafe is the neck's top where the place allows it, which is on the carafe's east side
    // only: the honesty stands in the west and south of the half turn (its pods fill the way to the wall and to the
    // ewer, so there is no passing outside it) and the moth goes over it by the least rise that keeps it 2 m off the
    // pods; and to come to the carafe at all it has to cross over our own route's line, 10 m off it or more. So it
    // climbs evenly from the hem to that height, holds it round the west and south, and comes down to the neck's top
    // toward the east; the half turn ends 10 degrees short of the carafe's east side (further south), so that the
    // moth keeps its 10 m from our route there. The course is the same at every seed and moment, and it reads no eye.
    const MOTH_LIFT = clock.sOf(uBedMid), MOTH_RISE = 1.5, MOTH_SPEED = 8;      // seconds of the flight at which we pass abeam of the bed's middle
    const mothKeys = ({ carafe, neckTop, tumblerR, honesty, honestyR, honestyTop }) => {
      let mx = -45, best = -1e9; for (let x = -49; x <= -41; x += 0.5) { const sl = foldHeight(style, x - 0.6, -42) - foldHeight(style, x + 0.6, -42); if (sl > best) { best = sl; mx = x; } }
      const r = V(mx, foldHeight(style, mx, -42) + 0.5, -42);
      // the moth's own reach from its keyed place, with its sway: 6.6 m to a wing tip, 3.4 m down to its lowest point
      const REACH = 6.6, LOW = 3.4, CLEAR = 2;
      const ROUND = tumblerR + CLEAR + REACH, over = honestyTop + CLEAR + LOW, honestyNear = honestyR + CLEAR + REACH;
      const on = (deg, y) => V(carafe.x + ROUND * Math.cos(deg * Math.PI / 180), y, carafe.z + ROUND * Math.sin(deg * Math.PI / 180));      // 180 the carafe's west side, 270 its south (the wall's side), 360 its east
      const hem = V(-36, 56, -52), west = on(180, over);
      // on the straight line from the hem to the carafe's west side: the point where the honesty first comes within reach (there it is already over it)
      let k = 1; while (k > 0 && Math.hypot(lerp(hem.x, west.x, k) - honesty.x, lerp(hem.z, west.z, k) - honesty.z) < honestyNear) k -= 0.01;
      const reach = V(lerp(hem.x, west.x, k), over, lerp(hem.z, west.z, k));
      // from the end of the half turn to the beam's axis it crosses over our route's line again: 12 m above the line where it passes over it
      const east = on(350, neckTop.y), axis = V(-25, 72, -60); let cross = null, least = 1e9;
      for (let i = 0; i <= 100; i++) { const x = lerp(east.x, axis.x, i / 100), z = lerp(east.z, axis.z, i / 100), n = path.nearestXZ(x, z); if (n.dist < least) { least = n.dist; cross = V(x, n.y + 12, z); } }
      const course = new THREE.CatmullRomCurve3([r, hem, reach, west, on(210, over), on(240, over), on(270, over), on(300, over), on(325, 0.5 * (over + neckTop.y)), east, cross,
        axis, V(5, 86, -66), V(55, 92, -60), V(HOLE.x, HOLE.y + 7, HOLE.z)], false, 'centripetal');
      const len = course.getLength(), keys = [[0, r.x, r.y, r.z], [clock.uOf(MOTH_LIFT), r.x, r.y, r.z]], p = V(0, 0, 0);
      for (let s = 0.25; s <= DURATION - MOTH_LIFT + 2; s += 0.25) {     // a key every quarter second of its flight (the last few lie past the route's end, for the spline)
        course.getPointAt(Math.min(1, MOTH_SPEED * s / len), p);
        keys.push([MOTH_LIFT + s <= DURATION ? clock.uOf(MOTH_LIFT + s) : 1 + (MOTH_LIFT + s - DURATION) / DURATION, p.x, p.y, p.z]);
      }
      return keys;
    };
    const hero = await buildHero(ctx, { style, detail, stage: false, exposure, hour, density: dens, mothKeys, mothLift: [clock.uOf(MOTH_LIFT), clock.uOf(MOTH_LIFT + MOTH_RISE)] });
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    const matteMat = matteMaterial(style, { side: THREE.DoubleSide }), linenMat = linenMaterial(style);
    const matte = [], linen = [];
    const paper = room === 0 ? pal.plum : room === 1 ? new THREE.Color('#5E7052') : new THREE.Color('#CFCABC');
    const trim = pal.linen.clone().multiplyScalar(0.7);

    // ---- the shell: boards, four walls, ceiling, skirting, picture rail, cornice, ceiling rose
    {
      const W = RX1 - RX0, D = RZ1 - RZ0, cx = (RX0 + RX1) / 2, cz = (RZ0 + RZ1) / 2;
      matte.push(dress(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2).translate(cx, 0, cz), pal.umber, 1));
      matte.push(dress(new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2).translate(cx, RH, cz), pal.slate.clone().lerp(pal.linen, 0.35), 0));
      // the three papered walls: paper from the boards to the top edge of the picture rail, and from there to the ceiling a
      // frieze of plain plaster in the ceiling's own matte and kind; the whitewash room is whitewash to the ceiling (one plane)
      const railTop = 112 + 1.6 / 2, plaster = pal.slate.clone().lerp(pal.linen, 0.35);
      const wall = (w, turn, x, z) => {
        const piece = (y0, y1, col, kind) => dress(new THREE.PlaneGeometry(w, y1 - y0).rotateY(turn).translate(x, (y0 + y1) / 2, z), col, kind);
        return room === 2 ? [piece(0, RH, paper, 2)] : [piece(0, railTop, paper, 2), piece(railTop, RH, plaster, 0)];
      };
      matte.push(...wall(W, 0, cx, RZ0), ...wall(W, Math.PI, cx, RZ1), ...wall(D, Math.PI / 2, RX0, cz));
      // the shutter wall, with the round hole bored through it (shape space: x = -z of the room, y = height)
      const sh = new THREE.Shape(); sh.moveTo(-RZ1, 0); sh.lineTo(-RZ0, 0); sh.lineTo(-RZ0, RH); sh.lineTo(-RZ1, RH); sh.lineTo(-RZ1, 0);
      const hp = new THREE.Path(); hp.absarc(-HOLE.z, HOLE.y, 9.12, 0, Math.PI * 2, true); sh.holes.push(hp);
      matte.push(dress(new THREE.ShapeGeometry(sh, 64).rotateY(Math.PI / 2).translate(RX1, 0, 0), pal.umber, 5));
      for (const [y, hh, th] of [[2.5, 5, 0.9], [5.3, 0.6, 1.3], [112, 1.6, 0.9], [141.5, 7, 2.2], [137.2, 1.8, 3.4]]) {
        matte.push(dress(box(W, hh, th, cx, y, RZ0 + th / 2), trim, 0), dress(box(W, hh, th, cx, y, RZ1 - th / 2), trim, 0));
        matte.push(dress(box(th, hh, D, RX0 + th / 2, y, cz), trim, 0), dress(box(th, hh, D, RX1 - th / 2, y, cz), trim, 0));
      }
      // the plaster ceiling rose: rings and petals, over the middle of the room
      const prof = [[0.01, 0], [5, 0], [6, 1.2], [9, 1.5], [10, 2.6], [14, 2.9], [15.5, 4.2], [21, 4.4], [22, 5]].map(([r, y]) => new THREE.Vector2(r, RH - 5 + y));
      matte.push(dress(new THREE.LatheGeometry(prof, 48).translate(17, 0, 7), trim, 0));
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2, g = new THREE.SphereGeometry(1, 10, 6); g.scale(4.2, 0.9, 1.5); g.rotateY(-a);
        matte.push(dress(g.translate(17 + Math.cos(a) * 15, RH - 2.6, 7 + Math.sin(a) * 15), trim, 0));
      }
    }
    await ctx.yield();

    // ---- the shutters: a window reveal, two leaves of boards, ledges and iron strap hinges (all turned away
    //      from the hole, so they hold only the room's own dark), and the knot bored out round
    {
      const z0 = -96, z1 = -24, y0 = 20, y1 = 126, iron = pal.slate.clone().multiplyScalar(0.6);
      matte.push(dress(box(2.4, 4, z1 - z0 + 8, RX1 - 1.2, y0 - 2, (z0 + z1) / 2), trim, 0), dress(box(2.4, 4, z1 - z0 + 8, RX1 - 1.2, y1 + 2, (z0 + z1) / 2), trim, 0));
      for (const z of [z0 - 2, z1 + 2]) matte.push(dress(box(2.4, y1 - y0, 4, RX1 - 1.2, (y0 + y1) / 2, z), trim, 0));
      for (let i = 0; i < 9; i++) {                       // boards, alternately proud, leaving the hole's board clear
        const bz = lerp(z0, z1, (i + 0.5) / 9); if (Math.abs(bz - HOLE.z) < 9) continue;
        matte.push(dress(box(0.5 + 0.25 * (i % 2), y1 - y0, 7.6, RX1 - 0.3, (y0 + y1) / 2, bz), pal.umber, 5));
      }
      for (const y of [34, 100, 116]) {
        matte.push(dress(box(1.2, 5, z1 - z0 - 3, RX1 - 1.0, y, (z0 + z1) / 2), pal.umber, 5));
        for (const [za, zb] of [[z0, z0 + 22], [z1 - 22, z1]]) matte.push(dress(box(0.5, 2, zb - za, RX1 - 1.8, y, (za + zb) / 2), iron, 4));
      }
    }
    await ctx.yield();
    // the hole is a knot bored out through a thick board: a bore 5 m deep from the room face (x 125) to the outer lip
    // (x 130, where the portal sits), flaring toward the room, its room edge torn into fibres, with one thin flat sliver
    // peeled up the grain. Daylight falls on the cut from outside: brightest at the lip, dark at the room side.
    let rimMat;
    {
      const NA = 192, pos = [], ak = [], idx = [], ragged = [];
      for (let i = 0; i < 96; i++) ragged.push(rng.range(0, 0.1));
      const spl = rng.int(0, 95), hh = (n) => { const v = Math.sin(n * 127.1 + spl * 3.7) * 43758.5453; return v - Math.floor(v); };
      const rows = [[-1, 0], [0, 0.13], [0.06, 0.3], [0.2, 0.46], [0.36, 0.53], [0.55, 0.57], [0.75, 0.6], [0.9, 0.62], [0.965, 0.66], [1, 1.36]];   // [s along the bore, brightness]; row 0 = the torn fibres
      const NR = rows.length - 1;
      for (let i = 0; i <= NA; i++) {
        const ii = i % NA, a = ii / NA * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a);
        const spike = hh(ii) ** 3, tooth = 0.06 + 0.2 * hh(ii + 500) + (0.4 + 0.9 * Math.abs(sa) ** 3) * spike + 10 * ragged[ii >> 1] * 0.1 * hh(ii * 3.1);      // short torn fibres: a ragged edge, never a saw
        for (let j = 0; j <= NR; j++) {
          const [s, kb] = rows[j];
          let r, x, k;
          if (j === 0) { r = 9.2 - 1.6 * tooth; x = 124.9 - 0.4 * tooth; k = 0.16 + 0.2 * hh(ii + 900); }      // dark fibres torn inward over the tan of the bore: longest at the top and bottom, where the grain runs
          else { const sc = Math.max(s, 0); r = 9.2 - 2.32 * sc ** 0.75 + 0.05 * Math.sin(a * 9 + sc * 5) * (1 - sc); x = 124.97 + 5.03 * sc; k = (0.06 + kb) * (1 - 0.28 * sa); }
          pos.push(x, HOLE.y + sa * r, HOLE.z + ca * r); ak.push(k);
        }
      }
      for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + 1, c = a + NR + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      // the sliver: a thin flat strip torn up the grain from the edge, curling a little off the wall into the room
      {
        const a0 = (0.5 + (spl / 95 - 0.5) * 0.5) * Math.PI, z0 = HOLE.z + Math.cos(a0) * 9.0, y0 = HOLE.y + Math.sin(a0) * 9.0, b = pos.length / 3, n = 10;
        for (let k = 0; k <= n; k++) {
          const t = k / n, w = 0.62 * (1 - t) ** 0.7 + 0.03, lift = 0.15 + 1.9 * t * t, lean = 0.9 * t * t;
          for (const sgn of [-1, 1]) { pos.push(124.85 - lift * 0.5, y0 - 0.5 + 1.7 * t, z0 + lean * 0.5 + sgn * w * 0.7 * (1 - 0.3 * t * sgn)); ak.push(0.5 + 0.35 * t); }      // one short sliver, close to the board
        }
        for (let k = 0; k < n; k++) { const a = b + k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(ak, 1)); g.setIndex(idx);
      rimMat = new THREE.ShaderMaterial({
        uniforms: Object.assign({ uWood: { value: new THREE.Vector3().setFromColor(new THREE.Color('#D9A565')) } }, U),
        vertexShader: /* glsl */`attribute float aK; varying vec3 vWP; varying float vK;
          void main(){ vec4 w = modelMatrix*vec4(position, 1.); vWP = w.xyz; vK = aK; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          uniform vec3 uWood; varying vec3 vWP; varying float vK;
          void main(){
            vec3 q = vWP - uHole; float pw = length(fwidth(vWP));
            // quarter-sawn: the growth layers are sheets of constant z, so on the face the grain runs up the board and
            // in the bore it runs into the depth (and converges on the far lip). Three scales: a few dark growth lines far
            // apart, kept until the hole is a thumbnail and never thinner than a pixel and a half; broad bands; fine lines
            // only when they are over 3 px.
            float lod = clamp(log2(max(pw*0.04*256., 1e-3)), 0., 7.);
            float n = textureLod(tCloud, vec2(q.z*0.04 + 0.3, q.y*0.012 + q.x*0.02), lod).g;
            float n2 = textureLod(tCloud, vec2(q.z*0.33, q.y*0.02 + q.x*0.03 + 0.5), lod + 2.).r;
            float gz = q.z + 1.3*n;
            float broad = 0.5 + 0.5*sin(gz*1.9), bw = pw*1.9;
            broad = mix(0.5, smoothstep(0.3, 0.7, broad), 1. - smoothstep(0.5, 1.6, bw));
            float fz = abs(fract(gz*2.3 + 0.37*n2) - 0.5), fw = pw*2.3;
            float fine = (1. - smoothstep(0.07, 0.07 + max(fw, 0.03), fz))*(1. - smoothstep(0.16, 0.33, fw));
            float cg = q.z*0.36 + 0.33*sin(q.z*0.83 + 1.7) + 0.05*sin(q.y*0.9);                 // unevenly spaced, a little wavy
            float cgw = max(length(vec2(dFdx(cg), dFdy(cg))), 1e-4);                             // how fast it runs on screen
            float cd = abs(fract(cg) - 0.5)/cgw;                                                 // pixels from the nearest line
            float half_ = max(1.1, 0.02/cgw);                                                    // half width: 11 cm of wood, never under 1.1 px
            float cid = floor(cg), cs = 0.55 + 0.45*fract(sin(cid*91.7 + 3.1)*437.5);              // some lines strong, some faint
            float coarse = cs*(1. - smoothstep(half_ - 0.6, half_ + 0.6, cd))*(1. - smoothstep(0.12, 0.3, cgw));
            vec3 wood = mix(uWood*vec3(0.62, 0.5, 0.4), uWood, 0.35 + 0.65*broad)*(0.86 + 0.24*n2)*(1. - 0.42*fine)*(1. - 0.7*coarse);
            // daylight on raw wood: the hour tints it a little, never to amber or silver, so it stays wood
            float pl = dot(uPale, vec3(0.2126, 0.7152, 0.0722));
            vec3 day = mix(vec3(pl), uPale, 0.3);
            gl_FragColor = vec4(toScene(wood*day*(vK*min(uGain*1.2, 1.))), 1.);
          }`,
        side: THREE.DoubleSide, fog: false,
      });
      const rim = new THREE.Mesh(g, rimMat); rim.name = 'rim'; scene.add(rim);
    }
    await ctx.yield();

    // ---- the bentwood chair, standing out on the boards under the beam at (70, 12): round seat, splayed legs, a
    //      stretcher ring, a hooped back. It stands near enough to the hole that its whole shadow lies on the floor:
    //      four legs, the seat as a dark disc, the hoop as one long curved line raking away past the foot of the bed.
    {
      const CX = 70, CZ = 12, SY = 23, wood = pal.umber.clone().multiplyScalar(0.5),      /* dark-stained bentwood: on the lit boards (which are umber too) the chair is a dark, solid thing and its hoop one continuous line */
      ya = rng.range(0.4, 1.1) * 0 + 2.2;      // (the draw is kept; the chair is turned so its hoop is seen broadside from the hole)
      const P = (r, a, y) => V(CX + Math.cos(a + ya) * r, y, CZ + Math.sin(a + ya) * r);
      matte.push(dress(new THREE.CylinderGeometry(11, 10.4, 1.3, 40).translate(CX, SY, CZ), wood, 5));
      matte.push(dress(new THREE.TorusGeometry(10.9, 0.8, 8, 40).rotateX(Math.PI / 2).translate(CX, SY + 0.2, CZ), wood, 5));
      for (const a of [0.6, 2.54, 3.74, 5.68]) {
        const top = P(8.6, a, SY - 0.5), foot = P(11.6, a, 0);
        matte.push(dress(rod(foot, top, 0.85, 10), wood, 5)); style.addCapsule(foot, top, 0.7);
      }
      matte.push(dress(new THREE.TorusGeometry(9.6, 0.5, 6, 36).rotateX(Math.PI / 2).translate(CX, 9.5, CZ), wood, 5));
      // the back: one long bent hoop from the back legs up and over, and a smaller loop inside it
      const hoop = [], loop = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16, a = lerp(-0.62, 0.62, t), up = Math.sin(t * Math.PI); hoop.push(P(9.4 + 2.2 * up, a, SY + 26 * Math.sqrt(up))); loop.push(P(9.3 + 1.6 * up, a * 0.55, SY + 0.4 + 17 * Math.sqrt(up))); }
      matte.push(dress(tube(hoop, 0.95, 40, 8), wood, 5), dress(tube(loop, 0.65, 32, 7), wood, 5));
      for (const [i0, i1] of [[0, 3], [3, 6], [6, 10], [10, 13], [13, 16]]) style.addCapsule(hoop[i0], hoop[i1], 0.6);      // five short pieces: the hoop's shadow is one curved line, no fatter than the hoop
      style.addEllipsoid(V(CX, SY, CZ), V(11, 1.1, 11));
    }
    await ctx.yield();
    // ---- the rag rug by the bed: braided rings, each its own rag
    {
      const cx = 8, cz = 47, ra = 21, rb = 13.5, rings = 22, seg = 128, pos = [], col = [], idx = [];
      const rags = [pal.linen.clone().multiplyScalar(0.85), pal.plum.clone().multiplyScalar(1.5), pal.slate.clone().multiplyScalar(1.6), pal.tan.clone().lerp(pal.umber, 0.4), pal.umber.clone().multiplyScalar(1.8), pal.linen.clone().lerp(pal.cobalt, 0.35)];
      for (let i = 0; i < rings; i++) {
        const c = rags[(i * 5 + rng.int(0, 1)) % rags.length], f0 = i / rings, f1 = (i + 1) / rings, b = pos.length / 3;
        for (let s = 0; s <= seg; s++) {
          const a = s / seg * Math.PI * 2, wob = 1 + 0.012 * Math.sin(a * 7 + i);
          for (const [f, y] of [[f0, 0.34], [(f0 + f1) / 2, 0.5], [f1, 0.34]]) { pos.push(cx + Math.cos(a) * ra * f * wob, y, cz + Math.sin(a) * rb * f * wob); col.push(c.r, c.g, c.b); }
        }
        for (let s = 0; s < seg; s++) for (let j = 0; j < 2; j++) { const a0 = b + s * 3 + j, a1 = a0 + 1, c0 = a0 + 3, c1 = c0 + 1; idx.push(a0, a1, c0, a1, c1, c0); }
        if (i % 6 === 5) await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      await ctx.yield();
      g.computeVertexNormals(); const ng = g.toNonIndexed();
      await ctx.yield();
      const rc = ng.attributes.color.clone(), rug = dress(ng, pal.linen, 0); rug.setAttribute('aCol', rc); matte.push(rug);
    }
    await ctx.yield();

    // ---- the muslin drape: a brass pole on two brackets above the bed head, two curtains tied back, breathing
    {
      const PX = -79, PY = 119, brass = pal.tan.clone().lerp(pal.umber, 0.35);
      matte.push(dress(rod(V(PX, PY, -47), V(PX, PY, 17), 0.75, 10), brass, 0));
      for (const z of [-47, 17]) matte.push(dress(new THREE.SphereGeometry(1.5, 12, 8).translate(PX, PY, z), brass, 0));
      for (const z of [-40, 10]) matte.push(dress(rod(V(RX0, PY - 3, z), V(PX, PY, z), 0.5, 6), brass, 0));
      style.addCapsule(V(PX, PY, -47), V(PX, PY, 17), 0.75);
      await ctx.yield();
      const nu = 64, nv = 40;        // fine enough that a pleat is a smooth curve and the gather at the tie-back has no corners
      for (const [zo, dir] of [[-45, 1], [15, -1]]) {
        const pos = [], nrm = [], idx = [], ph = rng.range(0, 6.28);
        // the cloth as a function of (u across, v down), so its normals come from the surface itself and not from the
        // mesh: at the gather the pleats are deep and close, every quad a twisted sliver, and mesh normals put a step at each row
        const f = (u, v, o) => {
          const wd = lerp(1, 0.42, smoothstep(0, 0.62, v)) + 0.2 * smoothstep(0.62, 1, v), amp = 0.5 + 1.5 * (1 - wd);
          return o.set(PX + 0.9 + amp * Math.sin(u * 40 + ph + 0.6 * Math.sin(u * 9)) - 2.2 * v * (1 - v), PY - 0.6 - 53 * v - 1.6 * u * u * smoothstep(0.5, 1, v) + 2.5 * u * Math.sin(v * Math.PI), zo + dir * 27 * u * wd);
        };
        const p0 = V(0, 0, 0), pa = V(0, 0, 0), pb = V(0, 0, 0), E = 0.002;
        for (let j = 0; j <= nv; j++) {
          const v = j / nv;
          for (let i = 0; i <= nu; i++) {
            const u = i / nu; f(u, v, p0); pos.push(p0.x, p0.y, p0.z);
            f(u + E, v, pa).sub(f(u - E, v, pb)); f(u, v + E, p0).sub(f(u, v - E, pb)); p0.cross(pa).normalize(); nrm.push(p0.x, p0.y, p0.z);      // dP/dv x dP/du: the side the winding calls front
          }
        }
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
        linen.push(dress(g, pal.linen, 0, (x, y) => 0.01 + 0.5 * clamp((PY - 4 - y) / 50, 0, 1)));      // (sway above zero everywhere marks it as hung cloth for the linen shader: no level ribs)
        // a tie-back cord where the curtain is gathered
        matte.push(dress(new THREE.TorusGeometry(2.6, 0.3, 6, 16).rotateX(Math.PI / 2).translate(PX + 0.6, PY - 34, zo + dir * 6), brass, 0));
        await ctx.yield();
      }
    }
    await ctx.yield();
    const shell = new THREE.Mesh(mergeGeometries(matte, false), matteMat); shell.name = 'room'; scene.add(shell);
    await ctx.yield();
    const cloth = new THREE.Mesh(mergeGeometries(linen, false), linenMat); cloth.name = 'drape'; scene.add(cloth);
    for (const g of [...matte, ...linen]) g.dispose();
    await ctx.yield();

    // ---- three flies circling in the beam; each tows a hard black dot across the sea on the back wall
    const blackMat = new THREE.ShaderMaterial({ vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }', fragmentShader: 'void main(){ gl_FragColor = vec4(0., 0., 0., 1.); }', side: THREE.DoubleSide, fog: false });
    const flies = [];
    {
      const body = new THREE.SphereGeometry(1, 10, 8); body.scale(0.42, 0.42, 1.0);
      const head = new THREE.SphereGeometry(0.36, 8, 6).translate(0, 0.05, 1.1);
      const bodyGeo = dress(mergeGeometries([body.toNonIndexed(), head.toNonIndexed()], false), pal.slate.clone().multiplyScalar(0.25), 4);
      const wing = new THREE.CircleGeometry(1, 10); wing.scale(0.5, 1.25, 1); wing.rotateX(-Math.PI / 2); wing.translate(0.55, 0.45, -0.5);
      const wingGeo = dress(wing, pal.linen, 2), dotGeo = new THREE.CircleGeometry(1.5, 24).scale(1.7, 1, 1);
      for (let i = 0; i < 3; i++) {
        const g = new THREE.Group(), wl = new THREE.Mesh(wingGeo, linenMat), wr = new THREE.Mesh(wingGeo, linenMat); wr.scale.x = -1;
        g.add(new THREE.Mesh(bodyGeo, matteMat), wl, wr); g.scale.setScalar(1.05); scene.add(g);
        const dot = new THREE.Mesh(dotGeo, blackMat); scene.add(dot);
        flies.push({ g, wl, wr, dot, ph: i * 2.1 + rng.range(0, 1.2), sp: rng.range(0.28, 0.42) * (i === 1 ? -1 : 1), r: rng.range(0.7, 1), y: rng.range(80, 83) });
      }
    }

    await ctx.yield();
    // ---- dust: the whole room, and thicker in the beam on the way out; shafts to the far wall, the floor and
    //      straight down the room past the last leg of the flight
    const motesRoom = makeMotes(style, rng, { count: Math.round(6500 * detail * dens), min: V(RX0, 0, RZ0), max: V(RX1, 120, RZ1), size: 1.25 });
    await ctx.yield();
    const motesBeam = makeMotes(style, rng, { count: Math.round(4200 * detail), min: V(20, 52, -100), max: V(RX1 + 5, 92, -36), size: 0.9, drift: V(-3.2, 0.25, 0.5) });      // (out to the back wall: the look back and the turn into the beam are flown on that side)
    // the last 40 m: thick dust in the mouth of the beam, blown inward from the hole
    const motesExit = makeMotes(style, rng, { count: Math.round(1500 * detail), min: V(84, 61, -71), max: V(RX1 + 5, 83, -49), size: 0.75, drift: V(-4.2, 0.3, 0.4) });
    scene.add(motesRoom, motesBeam, motesExit);
    await ctx.yield();
    const ends = [];
    for (let i = 0; i < Math.round(20 * detail); i++) ends.push(i % 3 === 0 ? V(rng.range(-80, 60), rng.range(20, 110), RZ1 - 0.5) : i % 3 === 1 ? V(rng.range(-20, 100), 0.5, rng.range(30, 120)) : V(RX0 + 0.5, rng.range(50, 100), rng.range(20, 120)));
    for (let i = 0; i < 16; i++) { rng.range(0, 6.28); rng.range(14, 44); }       // (draws kept so every seed's layout stays as it was)
    const shafts = makeShafts(style, rng, ends, { strength: 0.1 }); scene.add(shafts);
    await ctx.yield();
    // the beam on the way out: eight cones round the axis, unevenly spaced, three strong and the rest faint, each one
    // colour (blue below the axis, where the sky goes; sea green above; tan level with the hole, where the sails are).
    // Each is a ragged ribbon of clumped dust with thousands of flecks living inside it, streaming past the mote.
    const CONES = [[3.75, 0.34, 1.5, 1.0], [5.6, 0.24, 0.8, 0.3], [4.62, 0.5, 1.0, 0.22], [0.12, 0.3, 1.2, 0.9], [3.05, 0.22, 0.7, 0.3], [1.05, 0.4, 1.4, 0.85], [2.2, 0.27, 0.7, 0.28], [1.65, 0.55, 0.9, 0.2]];
    const cones = CONES.map(([a, th, w, gain]) => {
      const tt = Math.tan(th);
      return { end: V(HOLE.x - 215, HOLE.y + Math.sin(a) * tt * 215, HOLE.z + Math.cos(a) * tt * 215), tan: 0.034 * w, tint: Math.sin(a) < -0.3 ? 1 : Math.sin(a) > 0.3 ? 2 : 3, gain };
    });
    const beam = makeShafts(style, rng, cones.map((c) => c.end), { strength: 0.5, seg: 14, width: (i) => 215 * cones[i].tan * 1.25, tint: (i) => cones[i].tint, gain: (i) => 0.25 + 0.75 * cones[i].gain, dust: 1 }); beam.name = 'beam'; scene.add(beam);
    await ctx.yield();
    const shaftDust = makeShaftDust(style, rng, cones, { count: Math.round(9000 * detail), reach: 135, speed: 6.5, size: 1 }); scene.add(shaftDust);
    await ctx.yield();
    // the long look back: six cones that leave the hole sideways, down the room, and cross the dark by the shutter wall
    // in front of the eye: blue low (one falls onto the boards by the chair, the sky that lies on the floor; two go to
    // the bed's foot), tan along the shutter wall to the far corner and down the room, sea green high; and three toward
    // the back wall, which cross the dark of the shutter wall as the gaze comes round to the hole: blue low, sea green
    // high, tan level. Every end is a place of the room.
    const BACK = [[[66, 0, 18], 11, 1, 1.0], [[24, 44, 8], 9, 1, 0.8], [[24, 42, -9], 8, 1, 0.6], [[90, 66, 125], 16, 3, 1.0], [[-90, 49, 39], 14, 3, 0.12], [[20, 95, 125], 16, 2, 0.8],
      [[60, 10, -110], 12, 1, 0.9], [[30, 118, -110], 13, 2, 0.8], [[25, 67, -110], 10, 3, 0.65]];
    const backCones = BACK.map(([e, w, tint, gain]) => { const end = V(e[0], e[1], e[2]); return { end, tan: 0.5 * w / end.distanceTo(HOLE), tint, gain, w }; });
    // by the cone: the six old cones' ribbons draw from the world's stream, in their old order; the three toward the back
    // wall draw from a stream of their own
    const backWallRng = ctx.core.makeRng(ctx.core.hashSeed('back wall cones:' + ctx.seed));
    const back = makeShafts(style, rng, backCones.map((c) => c.end), { strength: 0, seg: 14, width: (i) => backCones[i].w, tint: (i) => backCones[i].tint, gain: (i) => backCones[i].gain, dust: 1, wide: 0.085, rngOf: (i) => (i < 6 ? rng : backWallRng) }); back.name = 'back'; scene.add(back);
    await ctx.yield();
    // (the flecks of all nine cones are dealt anew from the world's stream: nine cones and more flecks than the live version's six)
    const backDust = makeShaftDust(style, rng, backCones, { count: Math.round(7200 * detail), reach: 150, speed: 6.5, size: 1.1 }); scene.add(backDust);
    await ctx.yield();
    // the hole blazes: the dust in its mouth, seen from anywhere in the room as a small soft star (a quad that faces the
    // eye, additive, under the bloom threshold); it goes out on the run up the beam, where the opening itself is ahead
    const star = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      uniforms: { uHole: U.uHole, uPale: U.uPale, uGain: U.uGain, uExpK: U.uExpK, uStar: { value: 0 } },
      vertexShader: 'uniform vec3 uHole; varying vec2 vQ; void main(){ vec4 mv = viewMatrix*vec4(uHole + vec3(-1.2, 0., 0.), 1.); mv.xy += position.xy*30.; vQ = position.xy*2.; gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 uPale; uniform float uGain, uExpK, uStar; varying vec2 vQ; void main(){ float r2 = dot(vQ, vQ); float a = (exp(-r2*22.) + 0.22*exp(-r2*5.))*(1. - smoothstep(0.6, 1., r2)); gl_FragColor = vec4(uPale*(a*uStar*uGain*uExpK/0.6), 1.); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    star.frustumCulled = false; star.renderOrder = 5; star.name = 'star'; scene.add(star);
    await ctx.yield();
    // ---- the looks. After the linen the gaze is ONE target that glides in straight lines between places of the room, by
    // metres flown: it rests on the carafe while the route rounds the washstand (until 5 m past abeam of it); crosses to
    // the bed's middle, reached 30 m short of the foot rail's south post, and on down the room to the place of the look
    // back, where it is held for a typed 2.5 s of the flight (the hold a look needs to be read), ending abeam of that post; then by the top of the chair's back
    // (8 m past the post) and the north edge of the shutters (10 m short of the axis) to the hole, reached where the
    // route comes onto the beam's axis. One turn, to the left, with no stop but the look back. A leg that leaves or
    // reaches a rest is eased there; at a place passed without a rest the target keeps the mean of the two legs' speeds
    // (never over three times either, so it never runs back).
    const CAR = A.carafe.clone(), BED_MIDDLE = V(-5, 44, -15), LOOK_BACK = V(10, 30, 62), CHAIR_TOP = V(63.2, 49, 21.4), SHUTTERS = V(125, 72, -24);
    const uBed = uPost - 30 / LEN, uBackEnd = uPost, uBack = clock.uOf(clock.sOf(uBackEnd) - 2.5);
    const GAZE = [[0, CAR], [uCar + 5 / LEN, CAR], [uBed, BED_MIDDLE], [uBack, LOOK_BACK], [uBackEnd, LOOK_BACK], [uPost + 8 / LEN, CHAIR_TOP], [uAxis - 10 / LEN, SHUTTERS], [uAxis, HOLE.clone()], [2, HOLE.clone()]];
    const legLen = GAZE.slice(1).map((k, i) => k[1].distanceTo(GAZE[i][1])), keySpeed = GAZE.map((k, i) => {
      if (i === 0 || i === GAZE.length - 1 || legLen[i - 1] < 1e-6 || legLen[i] < 1e-6) return 0;
      const a = legLen[i - 1] / (k[0] - GAZE[i - 1][0]), b = legLen[i] / (GAZE[i + 1][0] - k[0]);
      return Math.min(0.5 * (a + b), 3 * a, 3 * b);
    });
    const gazeAt = new THREE.Vector3();
    const gaze = (time, u) => {
      let i = 0; while (i < GAZE.length - 2 && u > GAZE[i + 1][0]) i++;
      const du = GAZE[i + 1][0] - GAZE[i][0], x = clamp((u - GAZE[i][0]) / du, 0, 1), x2 = x * x, x3 = x2 * x;
      const m0 = legLen[i] > 1e-6 ? keySpeed[i] * du / legLen[i] : 0, m1 = legLen[i] > 1e-6 ? keySpeed[i + 1] * du / legLen[i] : 0;
      return gazeAt.lerpVectors(GAZE[i][1], GAZE[i + 1][1], m0 * (x3 - 2 * x2 + x) + (3 * x2 - 2 * x3) + m1 * (x3 - x2));
    };
    // each look is a stretch between places; where two overlap the eye is led from one to the next
    const pois = [
      { at: [76, 14, 6], from: 0, to: uChair + 15 / LEN, weight: 0.55, fade: 0.3 },             // from the entry to 15 m past the chair's beam: down the beam's own fan at what it lights, the bentwood chair on the sky-lit boards, as the eye comes up to it and passes
      { at: [-90, 66, 57], from: uChair - 30 / LEN, to: uWall, weight: 0.6, fade: 0.3 },         // from 30 m short of the chair's beam to the turn (the route's nearest point to that hull): with the beam, the gaze on one named thing of the room, the hull hanging mast-down from its level sea line on the bed-head wall, the screen, at arm's length by the turn; the room with the bed lies before the eye (the designer's amendment: the lift to the quay on the ceiling is given up)
      { at: HOLE.clone(), from: uWall - 5 / LEN, to: uPilN + 30 / LEN, weight: 0.62, fade: 0.3 },       // from 5 m before the turn to 30 m past the north pillow (the wall look hands over to it at the turn): the gaze leads the turn round: the shutter wall and the blazing hole swing by, shafts fanning from them over the bed
      { at: [-45, 45.5, -75], from: uHeadN, to: uCar - 20 / LEN, weight: 0.85, fade: 0.3 },      // from the bed's head rail to 20 m short of the carafe's beam: across the bed's width: the linen and its sails below, the washstand and the carafe above (the design's frame at 26 s lies in it)
      { at: gaze, from: uBedMid, to: 1, weight: 0.92, fade: 0.12 },                              // from the bed's middle to the end (full where the eye leaves the bed): the carafe, the one turn over the room, the look back, the hole. One entry: nothing leans on the steady camera's own factor
    ];

    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), vel = new THREE.Vector3();
    const wedgeK = hour === 'evening' ? 1 : hour === 'dawn' ? 0.95 : 0.85;
    const fogOn = weather === 'fog';
    // where the dust (and the fog, and the rare sail) change along the route: each a ramp between two places, worked out once
    const M = 1 / LEN, ramp = (s, u) => smoothstep(s[0], s[1], u);      // (M: one metre of route, in u)
    const SPAN = {
      beamIn: [uRug + 30 * M, uWall],                  // the eight cones, strong from the entry, fade from 30 m past the rug to the turn
      beamOver: [uPilN, uBedMid],                      // and come up again from the north pillow to the bed's middle,
      beamOverOut: [uCar, uWash + 10 * M],             // until the carafe is passed (out 10 m past the marble's east corner)
      roomThin: [uWash, uWash + 30 * M],               // the room's own shafts thin over the 30 m after the washstand is rounded
      wedgeFlecks: [uWash, uPost - 30 * M],            // the flecks of the wedges come up from there until the gaze reaches the bed's middle (30 m short of the foot rail's post),
      wedgeRibbons: [uPost - 40 * M, uPost - 25 * M],  // their ribbons as the gaze comes down the room (40 to 25 m short of the foot rail's post),
      wedgeOut: [uPost + 10 * M, uAxis + 10 * M],      // and both go out from 10 m past the post to 10 m along the axis
      beamOut: [uPost, uAxis],                         // the eight cones come up for the ride out between the post and the axis,
      beamRise: [uAxis, uFace],                        // and rise once more along the axis, to 30 m short of the shutter wall
      starOut: [uAxis - 15 * M, uAxis + 15 * M],       // the star in the hole's mouth goes out over the 30 m round the start of the axis
      streaks: [uAxis, uAxis + 30 * M],                // dust drawn as streaks: over the first 30 m of the axis
      fogOff: [20 * M, uPilN],                         // sea fog burns off from 20 m inside the room to the north pillow
      nearSailIn: [uPilS, uPilS + 10 * M],             // the rare near sail comes over the 10 m after the south pillow,
      nearSailOut: [uHeadS + 10 * M, uCar],            // and the blue pours back from 10 m past the bed to the carafe's beam
    };
    function update(dt, time, camera, uNow) {
      const u = uNow;
      hero.setProgress(u);
      // The dust, by stretch of the flight (uniforms only). The beam's eight cones are strong from the entry to the bed-head
      // wall (seen whole from the side on arrival, then overhead), fainter where the eye looks up the beam from the far wall
      // (the turn and the linen: there the eight overlap, and at full strength would be one white glare). For the turn over the room the room's own shafts thin and the cones that cross the
      // dark by the shutter wall take over; on the slide onto the axis the eight come up again for the ride out.
      const outK = ramp(SPAN.beamOut, uNow), thin = ramp(SPAN.roomThin, uNow);
      const inK = 1 - ramp(SPAN.beamIn, u), wedgeOut = 1 - ramp(SPAN.wedgeOut, uNow), lookK = ramp(SPAN.wedgeFlecks, uNow) * wedgeOut;
      // the turn opens with the flecks alone; the ribbons of the wedges come up as the gaze comes down the room, and stay under
      // the lit boards in every edition (measured: about two thirds of the boards' brightness in the evening, three
      // quarters in the morning). The star in the hole's mouth is out 15 m along the axis.
      back.material.uniforms.uShaft.value = 0.36 * wedgeK * ramp(SPAN.wedgeRibbons, uNow) * wedgeOut; star.material.uniforms.uStar.value = 0.8 * (1 - ramp(SPAN.starOut, uNow)); backDust.material.uniforms.uDustA.value = lookK; backDust.userData.setSize(ctx.renderer);
      shafts.material.uniforms.uShaft.value = 0.1 * (1 - 0.9 * thin); hero.shafts.material.uniforms.uShaft.value = 0.12 * (1 - 0.9 * thin);
      const overK = ramp(SPAN.beamOver, u) * (1 - ramp(SPAN.beamOverOut, u));      // over the linen and by the carafe the hole is out of frame at the right: the cones are seen from the side again, streaming overhead
      beam.material.uniforms.uShaft.value = (lerp(0.16, 0.7, outK) + 0.45 * ramp(SPAN.beamRise, uNow) + 0.3 * inK + 0.24 * overK) * (1 - 0.85 * lookK * (1 - outK));
      shaftDust.material.uniforms.uDustA.value = (0.4 + 0.6 * Math.max(outK, inK, 0.7 * overK)) * (1 - 0.85 * lookK * (1 - outK));
      // dust seen from a fast mote is a streak: its motion relative to the eye over a sixteenth of a second, from the
      // path (not from the camera, which a still or a portal view holds in place); only on the ride up the axis
      const sk = ramp(SPAN.streaks, uNow), uu = clamp(uNow, 0, 1);
      path.tangentAt(uu, vel).multiplyScalar(-(path.length / DURATION) * pace(uu) * 0.06 * sk);
      motesBeam.material.uniforms.uVel.value.copy(vel).x -= 3.2 * 0.06 * sk; motesExit.material.uniforms.uVel.value.copy(vel).x -= 4.2 * 0.06 * sk;
      motesRoom.material.uniforms.uVel.value.copy(vel); hero.motes.material.uniforms.uVel.value.copy(vel);
      shaftDust.material.uniforms.uVel.value.copy(vel).x -= 6.5 * 0.06 * sk; backDust.material.uniforms.uVel.value.copy(vel);
      shaftDust.userData.setSize(ctx.renderer);
      hero.update(dt, time, camera);
      motesRoom.userData.setSize(ctx.renderer); motesBeam.userData.setSize(ctx.renderer); motesExit.userData.setSize(ctx.renderer);
      // (the fleet, the near lane and every sail on the linen run on the world's clock alone: nothing here holds, pins or
      // re-times them. Six boats 27 m apart are always crossing the bed, so the eye finds sails wherever it comes over it.)
      // sea fog burning off: milky at entry, in full colour by the bed
      U.uVar.value.z = fogOn ? 1 - ramp(SPAN.fogOff, u) : 0;
      // the rare near sail, as we cross the counterpane's south half: eased in, held to the bed's edge, and the blue pours back
      if (rare) style.setNearSail(ramp(SPAN.nearSailIn, u) * (1 - Math.sqrt(ramp(SPAN.nearSailOut, u))));
      // the flies and their dots (the dot is where the fly's line from the hole meets the back wall)
      for (let i = 0; i < flies.length; i++) {
        const f = flies[i], a = time * f.sp + f.ph, wob = Math.sin(time * 1.7 + f.ph * 3);
        tmp.set(45 + Math.cos(a) * 8 * f.r + wob * 0.8, f.y + 1.2 * Math.sin(a * 2.3 + f.ph), -84 + Math.sin(a) * 3 * f.r);
        f.g.position.copy(tmp);
        f.g.rotation.set(0, Math.atan2(-Math.sin(a) * 8 * f.sp, Math.cos(a) * 3 * f.sp), 0.25 * wob);
        const fl = 0.5 + 0.5 * Math.sin(time * 41 + i * 2); f.wl.rotation.z = fl * 0.7; f.wr.rotation.z = -fl * 0.7;
        const t = (RZ0 + 0.25 - HOLE.z) / Math.min(tmp.z - HOLE.z, -1);
        tmp2.copy(tmp).sub(HOLE).multiplyScalar(t).add(HOLE);
        f.dot.position.set(clamp(tmp2.x, RX0 + 3, RX1 - 3), clamp(tmp2.y, 50, 110), RZ0 + 0.25);
      }
    }
    update(0, 0, null, 0);

    const titles = { morning: 'The Room That Is a Camera', dawn: 'The Room That Is a Camera, at Dawn', evening: 'The Room That Is a Camera, Evening', night: 'The Room That Is a Camera, by Moonlight' };
    return {
      scene, path, duration: DURATION, pace,
      title: titles[hour],
      camera: { fov: 62, near: 0.3, far: 700, lookAhead: 20, sway: 0.3, bank: 0.04 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#fff3dc', glow: 0.3, frame: 0, revealDistance: 300, veil: { morning: '#6fa8e0', dawn: '#e2b4bc', evening: '#f2c684', night: '#5f7fbe' }[hour] },     // a bare opening: the hole is a hole in a board, and no halo washes the wood
      post: {
        exposure,
        bloom: { strength: 0.35, radius: 0.45, threshold: 1.05 },             // only glass is written above 0.9
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.1, grain: 0.008, aberration: 0 },
      },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); style.dispose(); },
    };
  },
};
