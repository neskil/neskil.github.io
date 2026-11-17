// NIGHT BY THE SLICE: the hero set piece, the Moon Bar, and the whole style of the world.
//
// STYLE (set jelly): four stuffs and no fifth (red-black paste, agar tinted indigo to colourless, white paste, gold
// leaf). No line, no outline, no shadow, no lights, no fog: COLOUR IS THICKNESS. Everything is unlit ShaderMaterial
// shaded by one routine, STYLE_GLSL: inJelly(albedo, p, n, eye) = the stuff's display colour dimmed by the tinted
// metres daylight crossed to reach it (lightPath: nearest outer face or the clear core, mixed with the thickness the
// surface looks out through along its normal, which is all the modelling a form gets) and by the tinted metres to
// the eye (eyePath: analytic ray/box exit, the pale top 10 m integrated exactly, the clear core left out), red
// first and blue last (transmit), closing to ink; then through toScene(), the inverse of the engine's ACES, so that
// near paste IS #F4EEDC, the deep loaf IS #0D1136. Keep post saturation and contrast 1, bloom low, and call
// setExposure(post.exposure) if it is not 1.
// THE MEDIUM MOVES: wobble(p) in every vertex shader: one elastic wave per cut (120 m long, 1.5 m high, 90 m/s,
// uCutAge[5]/uCutZ0[5]), a quiver of the fresh face, and washAt(z), the pale front that follows each wave. All
// stuffs call the same function, so the stars never move against the mountain. The skin shivers; its mirror swims.
//
// WHAT buildHero MAKES (loaf space = the brief's coordinates; 6 draw calls, about 135k triangles, 100-250 ms):
//   hull    THE NIGHT LASTS: a side wall or the top looked along (more than about 48 degrees from its normal) is a mirror
//           and shows the length of the loaf, so inside nearly every wall is ink; the room shows only at the frame's outer
//           edge (walls seen square on), in the colourless top of each side wall (two pale lines to the vanishing point)
//           and in the wash that lifts the ink after each wave. Otherwise:
//           the agar seen from within and through: the loaf box BackSide, each pixel = what is behind that wall
//           through the tinted metres to it (walls glow, far end is ink, bubbles under the top, the exit disc of
//           plain daylight on the far face). The box is a unit cube stretched by uBoxMin/uBoxMax: a cut is a uniform.
//   skin    the same box FrontSide, transparent, last: fresnel mirror of the dome, and on the cut face the SECTION of
//           every extrusion drawn analytically (luneSd, ridgeH, gooseSd, leaf dashes) with drag lines, beads, a drop.
//   bar     THE MOON BY THE SLICE (fourth round): the Moon Bar is a thread of white paste (shape.barR, half a metre) that
//           stops short of each of five stations (shape.moons, about every 115 m) where a slice of the moon, 3 m thick
//           and 22 to 25 m across, hangs face on to the course, a little fuller each time: crescent to gibbous (barGeometry/barCapGeometry
//           on a wrapped shape); from z 835 the thread swells into the spooned tip the core springs from. The loaf's
//           own cut face shows a crescent 24 m across (shape.faceMoon, the skin's own uMoonOv). uMoonOv / uMoonAt let
//           any block of jelly (the world's slices) carry a moon of its own phase, size and place.
//   moons   FIFTH ROUND: each station's moon is one round that faces the eye (moonMaterial / moonGeometry: the lune lit in
//           white paste, the rest of the disc a faint round of clear jelly), every second one hung 27 m to starboard and
//           higher (shape.moons dx, dy; barC wanders over to it); the cut faces complete the disc too (skin uRoundF); the
//           lake mirrors that round. uIdleF / uStick: a block's own beat, and a foot that sticks (the standing slices).
//   room    uRoomHi / uRoomLow / uRoomBoard / uLamp / uLampDir: what wet faces mirror (domeAt) is an evening room, dark
//           above, amber low, one lamp; from within the walls are dark (open sky). uDay stays the light the jelly holds.
//   ground  shape.knoll: knolls and foothills on both sides of the valley line, snow on their tops (capLine); furrows
//           that waver, break, are rubbed and toothed near the eye (pasteMaterial furrow); shape.lake: a basin under the
//           third moon filled with clear agar that mirrors it (pasteMaterial lake / lakeMoon / lakeMoon2);
//           shape.inSight keeps leaf and sugar out of the sight lines to each moon.
//   dawn    uDawn: a layer of almost colourless agar under the indigo, rising from nothing at z 190 to 38 m by z 640
//           (dawnAt / rhoSeg): the far face low down is the room's light, so the valley lies in dawn under the night.
//   ridge   (shape.ridgeH) a range of peaks from the fourth face on, the starboard range the higher; capLine = snow of
//           white paste above uCapY metres; the valley floor is kept low along x 0 for the flight line (pathXY).
//   leaf    32,000 x detail torn scraps of gold leaf (instanced, 3 triangles, ragged in the fragment shader, clumped,
//           none within 3 m of the path, never under 1.7 px: the too-small are thinned out, not dimmed): a thin field,
//           a milky band (a slanting sheet of dust turning about the loaf) and seven figures of punched four-point
//           stars (aData.w = 1) hung square to the course with dark sky round them.
//   core, collar   the colourless shaft z 896..1060, a light pipe: from outside a pale sky-blue tube with a crisp
//           silhouette whose end is the exit disc; from inside only slow caustics on its wall. The white paste collar.
//   SIXTH ROUND   the moons stand in a receding row down the port side (shape.moons: three on the bar's line, the gibbous
//           free across the loaf; opts.gibbous moves it), the thread between them is gone and the bar is its last length,
//           the spooned tip (tipGeometry: since 10h a small smooth rounded end with the spoon's hollow; aHollow); the full moon is a
//           round of white paste on the far face (meshes.fullMoon, shape.fullMoon.R, uMaria) whose middle is the exit;
//           the lake lies under the half moon (LAKE z 392..510); a pass in the port range (z 420..690) and uWin / uKnife /
//           uLampPos / uLampK: the hull shows the room by the ray where the port wall is looked through (roomAt: board,
//           knife, lantern) and through the long cut's fresh wall (beads, a drop, the lamp's reflection, the ridge's cut
//           edge); uModel (0 = a flat tone, no modelling), uMoonLit (moonlight on the slopes that face the moons),
//           uFilm (the cut face as a sheet with one rim line); leaf aData.w 2 = lying in a furrow (it glints).
//   EIGHTH ROUND  the medium is SEEN to move: wobble() leans with height (the foot is stuck: the valley floor hardly moves, fir
//           tops more, cloud banks and moons two or three times further), frontAt(z) is the wave's pale front (a band some
//           25 m deep on the paste, the snow and the stream), uShud shakes the cut end as a wave starts, uRing breaks the
//           lake's round into rings. The ground: near the eye the fork's furrows are two flat tones (a pale crest line, a
//           darker flat trough, one thin deep line, breaks, pits); beyond some 50 m the slopes are tone and form (three flat
//           tones by how they face the moons, terraces by height, a paler floor). uStream / streamX: a stream of clear agar
//           from the lake down the valley; uWarm: the village's lamplight on the paste. The look out is one round WINDOW in
//           the port wall (uWin z, y, strength, radius; uWinAt: what it is aimed at and its field: the jelly is a lens). The
//           hull's SKY (uSky): a milky band, star clouds, small clouds of agar, a comet, by direction only; a halo and a ring
//           round the full moon; the hare and its mortar pressed into the full moon (uMaria). Leaf never whiter than the
//           moon, each scrap two tones. The long cut's wall goes back to ink toward the far end.
// NOT made here (world coder, with the exports): the ridge (shape.ridgeH + pasteMaterial(dark)), the nine goose rods
// (shape.gooseXY / gooseWing + pasteMaterial(white)), sugar, slabs, blade, board, dome. The cut face already draws
// their sections: set uniforms.uHas (ridge, moon, geese, specks) to 0 for whatever you leave out.
//
// EXPORTS
//   PALETTE, LOAF                 the brief's colours and dimensions
//   toScene(color, exposure)      JS twin of the GLSL exact-colour inverse (for anything not shaded by STYLE_GLSL)
//   makeShape(rng)                per-seed picture functions (barC/barP/barR/barA/inBar, ridgeH, gooseXY/gooseWing)
//   STYLE_GLSL, STYLE_VERT_GLSL   the shared chunk (both shaders) and eyeLocal() (vertex shaders only)
//   createJelly({palette, shape, box:{min,max}, core:false, farFace:true, exposure})  one block of jelly: shared
//        uniforms + pasteMaterial(color,{grain,side}), leafMaterial(color), leafGeometry(n,rng,fill), boxGeometry(),
//        hullMaterial(), skinMaterial(), coreMaterial(), setCuts(ages, faceZ). Make one per slab (core:false,
//        farFace:true, its own 20 m box): same shader text, so no new programs. Meshes: frustumCulled = false.
//   barGeometry(shape, z0, z1, rings, {tip})   the bar between two z (each slab's 20 m of moon)
//   pathXY(z)                     the camera's line (leaf and sugar keep clear of it)
//   pace(u), CUT_TIMES            the brief's pace and the journey seconds at which each blade stroke is fully down
//
// RETURNS { object, radius, height, center, anchors, update, dispose, ground, groundY } and also:
//   loaf        the inner group in loaf space: add your own loaf-space meshes to it
//   jelly, shape, uniforms, meshes {hull, skin, bar, core, collar, leaf}
//   setProgress(u, duration = 40)   THE PROGRESS HOOK: converts u to journey seconds with the brief's pace and calls
//   setClock(seconds, times = CUT_TIMES): cut ages and the face (z 100 + 20 per cut) follow. Call one of them every
//        frame from the world's update (with u = 0 while seen through the portal). Never called: the piece runs a
//        demo (three slabs gone, a wave every 9 s). setCuts(ages[5], faceZ) sets them by hand; setExposure(e).
// HERO SPACE: origin at the middle of the loaf's foot, +Y up, the cut face toward +Z. To get the brief's coordinates
// place it with  object.position.set(0, 0, 580); object.rotation.y = Math.PI;  then anchors go through
// object.localToWorld(). (NB the brief calls -x "port"; flying toward +Z, -x is on the RIGHT of the screen.)
// ANCHORS (hero space): portalSeat {position, facing, radius 7} on the far face at the core axis (loaf -15,50,1060);
//   flyThrough: 12 points of the brief's path (loaf (0,26,0) -> (0,42,160) -> (0,42,900) -> (-15,50,1000..1060)),
//   clear of leaf by 3 m and of the bar by 6.6 m or more; entry, faceCentre, barStart, barTip, coreStart; viewpoints
//   {entry, blade, wetFace, heart, tip, shaft}.
// OPTS: palette (7 hex: board, daylight, ink, slab blue, dark paste, white paste, gold; absorption is derived from
//   daylight -> slab blue over 30 m, so a plum recipe works), detail 0.6..1 (thins leaf), flakes (32000), exposure,
//   view ('in' | 'tip' | 'core' | 'far': debug orbit for the part viewer).
// EXPECTS AROUND IT: a pale board at y 0 (the hull floor sits 8 cm above it), a pale dome (uDay/uDayLow/uBoard are what
//   the wet faces mirror), no scene fog, no lights.
import * as THREE from 'three';

const { sin, cos, abs, pow, min, max, PI, exp, sqrt, floor } = Math;
const TAU = PI * 2;
const clamp = (x, a, b) => min(b, max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// The brief's palette: board, daylight, ink, a 20 m slab's blue, dark paste, white paste, gold leaf.
export const PALETTE = ['#E7D9BC', '#EEF1F2', '#0D1136', '#9CC1E6', '#2A1015', '#F4EEDC', '#D6A63C'];

// The loaf in loaf space (the brief's own coordinates): x -60..60, y 0..80, z 100..1060, course along +Z.
const LAKE = { z0: 392, z1: 510, y: 16.6, x: 2 };      // SIXTH ROUND: the lake lies under the half moon, early in the night
export const LOAF = { x0: -60, x1: 60, y0: 0, y1: 80, z0: 100, z1: 1060, slab: 20, barEnd: 900, coreR: 7, collarR: 7.5,
  axis: [-15, 50], waveSpeed: 90, waveLength: 120, waveHeight: 1.5 };

// ---------------------------------------------------------------------------------------------------------------
// EXACT COLOUR. The engine shows  ACES(scene * exposure / 0.6)  then sRGB. toScene() is the inverse: give it the
// colour wanted on the display (linear, i.e. a THREE.Color) and it returns the scene value that lands on it.
// ---------------------------------------------------------------------------------------------------------------
const ACES_IN = [0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777];          // column-major
const ACES_OUT = [1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602];
const M_IN_INV = new THREE.Matrix3().fromArray(ACES_IN).invert();
const M_OUT_INV = new THREE.Matrix3().fromArray(ACES_OUT).invert();
const m3 = (m) => m.elements.map((v) => v.toFixed(6)).join(',');
/** JS twin of the GLSL toScene: THREE.Color (display, linear) -> THREE.Color (scene value) at the given exposure. */
export function toScene(color, exposure = 1, out = new THREE.Color()) {
  const v = new THREE.Vector3(min(color.r, 0.95), min(color.g, 0.95), min(color.b, 0.95)).applyMatrix3(M_OUT_INV);
  const f = (y) => { y = clamp(y, 0.0004, 0.97); const A = 0.983729 * y - 1, B = 0.432951 * y - 0.0245786, C = 0.238081 * y + 0.000090537;
    return (-B - sqrt(max(B * B - 4 * A * C, 0))) / (2 * A); };
  v.set(f(v.x), f(v.y), f(v.z)).applyMatrix3(M_IN_INV);
  return out.setRGB(max(v.x, 0) * 0.6 / exposure, max(v.y, 0) * 0.6 / exposure, max(v.z, 0) * 0.6 / exposure);
}

// ---------------------------------------------------------------------------------------------------------------
// THE PICTURES. Every picture in the loaf is an extrusion, so each is a function of z giving a section in x,y.
// The same functions exist here (to build geometry) and in STYLE_GLSL (to draw the section on a cut face).
// makeShape(rng) draws the per-seed constants; shape.uniforms carries them to the shaders.
// ---------------------------------------------------------------------------------------------------------------
export function makeShape(rng, o = {}) {
  const bp = [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU];
  const tilt = [-0.95 + rng.range(-0.18, 0.18), 3.5 + 3 * rng.range(-0.04, 0.04)];      // tilt[1]: the lit limb faces screen right and a little down, as a waxing moon's does
  const pk = [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU];
  const rp = [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU];
  const gp = rng() * TAU;
  const s = { bp, tilt, rp, gp, pk };
  /** centre of the moon's disc at z -> [x, y]: wanders, sags a metre, true on the core axis by z 900 */
  s.barC = (z, o = [0, 0]) => {
    const e = 1 - sstep(820, 900, z), t = clamp((z - 100) / 800, 0, 1);
    o[0] = LOAF.axis[0] + e * (0.9 * sin(z * 0.011 + bp[0]) + 0.45 * sin(z * 0.027 + bp[1]));
    o[1] = LOAF.axis[1] + e * (-1.0 * sin(PI * t) + 0.3 * sin(z * 0.019 + bp[2]));
    for (const m of s.moons) if (m.dx && !m.free) { const k = sstep(m.z - 95, m.z - 30, z) * (1 - sstep(m.z + 30, m.z + 95, z)); o[0] += m.dx * k; o[1] += m.dy * k; }
    return o;
  };
  /** lit fraction of the moon: 1/20, 1/8, 1/4, 1/3 at the four first faces, then slowly to a fat gibbous */
  s.barP = (z) => 0.16 + 0.74 * sstep(160, 900, z);
  /** radius of the moon's disc (the bar is never more than 14 m across) */
  s.barR = (z) => 0.5 + 0.08 * sin(z * 0.043 + bp[3]) + 6.3 * sstep(835, 892, z);
  /** THE MOONS: at each station a slice of the moon hangs in the night, face on (z, radius, lit fraction) */
  // FIFTH ROUND: the moons do not hang in one line (from the flight line they stood on one screen ray, each half out from
  // behind the last): every second one hangs across the loaf, to starboard and higher, and the thread wanders over to it
  // SIXTH ROUND: A ROW OF MOONS. Seen from the wet face they stand in one receding row down the port side, each smaller
  // and fuller than the last (crescent, fat crescent, half), toward the full moon on the far face; the gibbous one hangs
  // alone across the loaf over the starboard range (free: the thread does not go to it).
  s.moons = [{ z: 318, R: 11, p: 0.2, dx: -7, dy: 3 }, { z: 450, R: 12, p: 0.36, dx: -15, dy: 12 }, { z: 600, R: 13, p: 0.5, dx: -1.6, dy: 15 },
    { z: 682, R: 16, p: 0.72, free: true, x: 32, y: 58 }];
  if (o.gibbous) { s.moons[3].x = o.gibbous.x; s.moons[3].y = o.gibbous.y; }      // the long cut's edition hangs it inside the blade's plane
  s.moonC = (m, o = [0, 0]) => { if (m.free) { o[0] = m.x; o[1] = m.y; return o; } return s.barC(m.z, o); };
  s.fullMoon = { R: 26 };                    // the full moon: a round of white paste on the far face about the exit
  s.faceMoon = { R: 12, p: 0.14 };
  /** direction the lit limb faces, an angle in the x,y plane (turns slowly along the loaf) */
  s.barA = (z) => tilt[1] + 0.16 * sstep(300, 900, z);
  /** is (x,y) inside the paste of the bar at z (with a margin in metres) */
  s.inBar = (x, y, z, margin = 0) => {
    if (z > LOAF.barEnd + margin) return false;
    for (const m of s.moons) if (abs(z - m.z) < 2.2 + margin) { const cm = s.moonC(m); if (Math.hypot(x - cm[0], y - cm[1]) < m.R + margin) return true; }
    const c = s.barC(z), R = s.barR(z) + margin, a = s.barA(z), qx = (x - c[0]) / R, qy = (y - c[1]) / R;
    const u = qx * cos(a) + qy * sin(a), v = -qx * sin(a) + qy * cos(a);
    if (u * u + v * v > 1) return false;
    return u > (1 - 2 * s.barP(z)) * sqrt(max(1 - v * v, 0)) - margin / R;
  };
  /** height of the bean-paste ridge: two crests (22-36 m) drifting along z, a valley along x 0, fork furrows low down */
  s.ridgeH = (x, z) => {
    const c1 = -30 + 5 * sin(z * 0.0061 + rp[0]), c2 = 31 + 4.5 * sin(z * 0.0048 + rp[1]);
    const e = sstep(165, 300, z) * (1 - 0.55 * sstep(930, 1040, z));          // a range of peaks from the fourth face on
    const h1 = 27 + 4 * sin(z * 0.0087 + rp[2]) + e * (9.5 * (1 - abs(sin(z * 0.0171 + pk[0]))) + 5 * (1 - abs(sin(z * 0.043 + pk[1]))) - 3);
    const h2 = 26.5 + 4 * sin(z * 0.0071 + rp[3]) + e * (15 * (1 - abs(sin(z * 0.0153 + pk[2]))) + 6 * (1 - abs(sin(z * 0.039 + pk[3]))) - 2);
    const e2 = sstep(230, 330, z) * (1 - sstep(540, 640, z));              // FIFTH ROUND: the ranges stand taller through the blue middle of the night
    const pass = sstep(420, 460, z) * (1 - sstep(640, 690, z));           // SIXTH ROUND: a pass in the port range: the look out to the room
    const h1p0 = (h1 + e2 * 6 * (1 - abs(sin(z * 0.0171 + pk[0])))) * (1 - 0.68 * pass), spurK = sstep(498, 514, z) * (1 - sstep(552, 578, z));      // tenth round: the spur stands BESIDE the window (ahead of it), never across it
    const h1p = h1p0 + spurK * (max(h1p0, 30.8 + 1.3 * sin(z * 0.115 + 1) + 0.8 * sin(z * 0.31)) - h1p0);      // ninth round: the spur under the window (twin of ridgeRaw)
    const m1 = h1p * max(0.16, 1 - 0.7 * pow(abs(x - c1) / 34, 0.8)), m2 = (h2 + e2 * 9 * (1 - abs(sin(z * 0.0153 + pk[2])))) * max(0.16, 1 - 0.7 * pow(abs(x - c2) / 32, 0.8));
    let m = min(max(m1, m2) + 0.12 * min(m1, m2), 17 + x * x / 36);      // the valley floor stays low along x 0
    const low = 1 - sstep(0.5, 0.85, m / 30);
    // THE GROUND IS A LAND (fourth round): knolls and foothills of paste on both sides of the valley line, and a basin
    // that holds a lake of clear agar (shape.lake) under the third moon
    m += 9 * s.knoll(x, z) * sstep(5, 18, abs(x - 6)) * sstep(205, 275, z) * (1 - sstep(880, 960, z));
    // FIFTH ROUND: two snow peaks stand either side of the core's axis before the far face, so the full moon hangs between
    // them from the bar's tip on (nothing of them reaches a cut face, the lake or the flight line: the GLSL twin stands)
    // TENTH ROUND: they are heaps of paste, not cones: a rounded top with a little pulled nub to one side, flanks that bow
    // out, a lobed foot (no needle apex, no straight edge)
    if (z > 975) { const pkH = (cx, H, ph, nub) => { const dx = (x - cx) / 17, dz = (z - 1028) / 38, th = Math.atan2(dz, dx + 1e-9);
        const r = Math.hypot(dx, dz) * (1 + 0.1 * sin(3 * th + ph) + 0.06 * sin(5 * th + 2.3 * ph)), rs = max(sqrt(r * r + 0.05) - 0.2236, 0);
        return H * max(0, 1 - pow(rs, 1.42)) + 2.4 * exp(-((x - cx - nub) * (x - cx - nub) / 5 + (z - 1026) * (z - 1026) / 30)); };
      m = max(m, pkH(13, 42, pk[0], 1.5), pkH(-43, 40, pk[1] + 2, -1.3)); }
    const basin = sstep(LAKE.z0, LAKE.z0 + 20, z) * (1 - sstep(LAKE.z1 - 20, LAKE.z1, z)) * (1 - sstep(13, 22, abs(x - LAKE.x)));
    m = lerp(m, min(m, 13.4), basin);
    const h = m + 0.9 * sin(x * 0.21 + z * 0.013 + rp[0]) * sin(z * 0.031 + rp[1]) + 0.4 * low * sin(x * 2.1 + 1.5 * sin(z * 0.02 + rp[2]));
    return basin > 0.001 ? max(h, LAKE.y) : h;
  };
  s.knoll = (x, z) => { const a = max(0, sin(x * 0.23 + 1.7 * sin(z * 0.021 + pk[0])) * sin(z * 0.075 + 0.8 * sin(x * 0.11) + pk[1])); return a * a; };
  s.lake = LAKE;
  /** is (x,y,z) in the way of a moon as seen from the flight line (the bundle of sight lines from 190 m to 25 m before it) */
  s.inSight = (x, y, z, k = 1) => {
    for (const m of s.moons) {
      const dz = m.z - z; if (dz < 1 || dz > 190) continue;
      if (!m.v) { const c0 = s.moonC(m), pp = pathXY(m.z - 80); m.v = [c0[0], c0[1], pp[0] - c0[0], pp[1] - c0[1]]; }       // from the moon to the flight line as we come up to it
      const c = m.v, f0 = dz / 190, f1 = min(1, dz / 25), vx = c[2], vy = c[3];
      const t = clamp(((x - c[0]) * vx + (y - c[1]) * vy) / (vx * vx + vy * vy), f0, f1);
      if (Math.hypot(x - c[0] - vx * t, y - c[1] - vy * t) < (m.R * (1 - t) + 1.5) * k) return true;
    }
    return false;
  };
  /** goose rod i (0..8): body centre [x, y]; the skein is a shallow V in section */
  s.gooseXY = (i, o = [0, 0]) => { o[0] = 6 + i * 4.2; o[1] = 66 - abs(i - 4) * 2; return o; };
  /** wing angle of goose i at z (radians above level); one beat every 55 m */
  s.gooseWing = (i, z) => 0.55 * sin(z * (TAU / 55) + gp + i * 0.7);
  s.uniforms = {
    uBarPh: { value: new THREE.Vector4(...bp) }, uBarTilt: { value: new THREE.Vector2(...tilt) },
    uRidgePh: { value: new THREE.Vector4(...rp) }, uGoosePh: { value: gp }, uPeakPh: { value: new THREE.Vector4(...pk) },
  };
  return s;
}

// ---------------------------------------------------------------------------------------------------------------
// STYLE_GLSL: the one routine every material of this world is shaded by. Include it in vertex AND fragment shader.
// All positions are in LOAF SPACE (the mesh's own space); the eye is brought into it with eyeLocal().
// ---------------------------------------------------------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
  uniform vec3 uBoxMin, uBoxMax;        // the jelly box now (uBoxMin.z is the cut face)
  uniform float uCutAge[5], uCutZ0[5];  // seconds since each cut (negative: not yet) and the z it was made at
  uniform float uTime, uExposure, uWobAmp;
  uniform vec3 uDay, uDayLow, uInk, uBoard, uK;
  uniform vec4 uBarPh, uRidgePh, uPeakPh, uCore, uHas, uDawn;   // uDawn: the clear lower layer: z where it starts to rise, z where it is full, its height, the tint left in it
  uniform float uKeep, uEyeK, uModel;   // (uModel: how much a form is modelled by the thickness it looks out through; 0 = flat tone) how true a near stuff stays (0.3; the moon and the leaf more); a stuff seen down the light pipe   // uCore: axis x, axis y, radius, z where the clear core starts
  uniform vec2 uBarTilt;
  uniform float uGoosePh, uFarFace;
  uniform mat3 uRot;                    // this block's own space -> world (a slab lying on its back): for the dome only
  uniform float uIdle, uCapY;           // the jelly's never-quite-still sway (m); height above which the ridge is capped white
  uniform float uIdleF, uStick;         // the sway's beat (rad/s); 1 = this block's foot is stuck to the board (a standing slice)
  uniform float uShud, uRing;           // EIGHTH ROUND: the cut end's shudder as a wave starts (0..1); the lake's rings as a wave passes (0..1)
  uniform vec4 uWarm, uWarm2;                   // the village's lamplight on the paste round it: x, z, reach (m), strength
  uniform vec4 uStream;                 // the stream of clear agar from the lake: z0, z1, half width, on
  uniform vec2 uSide;                   // the long cut: seconds since it (negative: not yet), and the x of its plane
  // THE ROOM (fourth round): evening. uDay is still the light the jelly holds (a paper lantern's, come through the agar);
  // what a wet face MIRRORS and what shows past the jelly is the room itself: dark above, amber low, the lamp's side warmer.
  uniform vec3 uRoomHi, uRoomLow, uRoomBoard, uLamp, uLampDir;
  // the moon of THIS block: phase, radius (below zero: the loaf's own bar), 1 = angle given, angle; and its centre (z = 1: given)
  uniform vec4 uMoonOv; uniform vec3 uMoonAt;

  // ---- exact colour: display colour (linear) -> scene value ----
  vec3 toScene(vec3 D){
    vec3 y = clamp(mat3(${m3(M_OUT_INV)})*clamp(D, 0., 0.95), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, C = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*C, 0.)))/(2.*A);
    return max(mat3(${m3(M_IN_INV)})*v, 0.)*(0.6/max(uExposure, 0.05));
  }
  float hash11(float n){ return fract(sin(n*127.1)*43758.5453); }
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }


  // ---- the pictures (twins of makeShape in JS) ----
  vec2 barC(float z){ float e = 1. - smoothstep(820., 900., z), t = clamp((z - 100.)/800., 0., 1.);
    if (uMoonAt.z > 0.5) return uMoonAt.xy;
    return vec2(${LOAF.axis[0].toFixed(1)}, ${LOAF.axis[1].toFixed(1)}) + e*vec2(0.9*sin(z*0.011 + uBarPh.x) + 0.45*sin(z*0.027 + uBarPh.y),
      -sin(3.14159265*t) + 0.3*sin(z*0.019 + uBarPh.z)); }
  float barP(float z){ return uMoonOv.x >= 0. ? uMoonOv.x : 0.16 + 0.74*smoothstep(160., 900., z); }
  // the bar is a thread of paste between the moons, swelling to the spooned tip the core springs from
  float barR(float z){ return uMoonOv.y > 0. ? uMoonOv.y : 0.5 + 0.08*sin(z*0.043 + uBarPh.w) + 6.3*smoothstep(835., 892., z); }
  float barA(float z){ return uMoonOv.z > 0.5 ? uMoonOv.w : uBarTilt.y + 0.16*smoothstep(300., 900., z); }
  // signed distance (metres, about) to the moon's lit part at section z: below zero is white paste
  float luneSd(vec2 xy, float z){
    float R = barR(z), a = barA(z); vec2 q = (xy - barC(z))/R, l = vec2(cos(a), sin(a));
    float u = dot(q, l), v = dot(q, vec2(-l.y, l.x)), t = 1. - 2.*barP(z);
    return max(length(q) - 1., t*sqrt(max(1. - v*v, 0.)) - u)*R; }
  float knoll(float x, float z){ float a = max(0., sin(x*0.23 + 1.7*sin(z*0.021 + uPeakPh.x))*sin(z*0.075 + 0.8*sin(x*0.11) + uPeakPh.y)); return a*a; }
  float knollH(float x, float z){ return 9.*knoll(x, z)*smoothstep(5., 18., abs(x - 6.))*smoothstep(205., 275., z)*(1. - smoothstep(880., 960., z)); }      // a knoll's own height over the slope it stands on
  float ridgeRaw(float x, float z, out float basin){
    float c1 = -30. + 5.*sin(z*0.0061 + uRidgePh.x), c2 = 31. + 4.5*sin(z*0.0048 + uRidgePh.y);
    float e = smoothstep(165., 300., z)*(1. - 0.55*smoothstep(930., 1040., z));
    float h1 = 27. + 4.*sin(z*0.0087 + uRidgePh.z) + e*(9.5*(1. - abs(sin(z*0.0171 + uPeakPh.x))) + 5.*(1. - abs(sin(z*0.043 + uPeakPh.y))) - 3.);
    float h2 = 26.5 + 4.*sin(z*0.0071 + uRidgePh.w) + e*(15.*(1. - abs(sin(z*0.0153 + uPeakPh.z))) + 6.*(1. - abs(sin(z*0.039 + uPeakPh.w))) - 2.);
    float e2 = smoothstep(230., 330., z)*(1. - smoothstep(540., 640., z));
    h1 += e2*6.*(1. - abs(sin(z*0.0171 + uPeakPh.x))); h2 += e2*9.*(1. - abs(sin(z*0.0153 + uPeakPh.z)));
    h1 *= 1. - 0.68*smoothstep(420., 460., z)*(1. - smoothstep(640., 690., z));
    h1 = mix(h1, max(h1, 30.8 + 1.3*sin(z*0.115 + 1.) + 0.8*sin(z*0.31)), smoothstep(498., 514., z)*(1. - smoothstep(552., 578., z)));      // ninth round: a spur of the port range stands under the window
    float m1 = h1*max(0.16, 1. - 0.7*pow(abs(x - c1)/34. + 1e-5, 0.8)), m2 = h2*max(0.16, 1. - 0.7*pow(abs(x - c2)/32. + 1e-5, 0.8));
    float m = min(max(m1, m2) + 0.12*min(m1, m2), 17. + x*x/36.);
    float low = 1. - smoothstep(0.5, 0.85, m/30.);
    m += 9.*knoll(x, z)*smoothstep(5., 18., abs(x - 6.))*smoothstep(205., 275., z)*(1. - smoothstep(880., 960., z));
    basin = smoothstep(${LAKE.z0.toFixed(1)}, ${(LAKE.z0 + 20).toFixed(1)}, z)*(1. - smoothstep(${(LAKE.z1 - 20).toFixed(1)}, ${LAKE.z1.toFixed(1)}, z))*(1. - smoothstep(13., 22., abs(x - ${LAKE.x.toFixed(1)})));
    m = mix(m, min(m, 13.4), basin);
    float h = m + 0.9*sin(x*0.21 + z*0.013 + uRidgePh.x)*sin(z*0.031 + uRidgePh.y) + 0.4*low*sin(x*2.1 + 1.5*sin(z*0.02 + uRidgePh.z));
    return h; }
  float ridgeH(float x, float z){ float b; float h = ridgeRaw(x, z, b); return b > 0.001 ? max(h, ${LAKE.y.toFixed(2)}) : h; }
  // the winter loaf: white paste laid on the crests. Above zero is white. uCapY is the share of each crest's own height
  // where the white begins (1e5: no cap); the line wavers as a hand lays it.
  float capLine(vec3 p, float depth){
    float hi = p.y - uCapY - 4.*smoothstep(985., 1000., p.z) - 12.*smoothstep(230., 330., p.z)*(1. - smoothstep(540., 640., p.z)) - 14.*smoothstep(590., 650., p.z)*(1. - smoothstep(790., 860., p.z)) + 2.2*(vnoise(p.xz*0.16) - 0.5) + 0.7*(vnoise(p.xz*0.7) - 0.5) + 1.3*(abs(sin(p.x*0.45 + 1.1*sin(p.z*0.05 + uRidgePh.z))) - 0.64);      // tenth round: across the loaf the white hangs in round lobes some 7 m long (a fine sine read as a saw)
    // and on the top of every knoll in the valley (a pinch of white paste), wherever the loaf has snow at all
    float kn = (knoll(p.x, p.z)*smoothstep(5., 18., abs(p.x - 6.))*smoothstep(13., 27., abs(p.x - 6.))*smoothstep(205., 275., p.z)*(1. - smoothstep(880., 960., p.z)) - 0.55)*7. + 1.1*(vnoise(p.xz*0.5) - 0.5) - depth*3.;      // a crust, not a column: on a cut face it is only skin deep
    float sp = smoothstep(498., 514., p.z)*(1. - smoothstep(552., 578., p.z))*(1. - smoothstep(-12., -8., p.x));      // ninth round: the spur under the window carries snow
    hi = max(hi, p.y - 28.4 + 1.2*(vnoise(p.xz*0.3 + 5.) - 0.5) - 60.*(1. - sp) - 100.*step(1e4, uCapY));
    return max(hi, uCapY > 1e4 ? -1. : kn); }
  // signed distance to the nearest of the nine goose chevrons at section z
  float gooseSd(vec2 xy, float z){
    float d = 1e3;
    for (int i = 0; i < 9; i++){
      float fi = float(i); vec2 c = vec2(6. + fi*4.2, 66. - abs(fi - 4.)*2.);
      float a = 0.55*sin(z*0.1142397 + uGoosePh + fi*0.7);
      vec2 q = xy - c; q.x = abs(q.x); vec2 e = vec2(cos(a), sin(a))*3.;
      float h = clamp(dot(q, e)/9., 0., 1.);
      d = min(d, length(q - e*h) - mix(0.5, 0.14, h));
    }
    return d; }

  // ---- the medium moves: one elastic wave per cut, 120 m long, 1.5 m high, 90 m/s; all stuffs ride it together ----
  float wave1(float z, float age, float z0){
    float s = (z - z0 - ${LOAF.waveSpeed.toFixed(1)}*age)/${LOAF.waveLength.toFixed(1)};
    float h = sin(3.14159265*clamp(s, -1., 0.));
    float q = exp(-max(age, 0.)*1.2)*exp(-max(z - z0, 0.)/70.)*sin(age*8. - (z - z0)*0.07)*0.3;   // the fresh face quivers
    return step(0., age)*(h*h*${LOAF.waveHeight.toFixed(2)} + q); }
  float waveAt(float z){ float w = 0.; for (int i = 0; i < 5; i++) w += wave1(z, uCutAge[i], uCutZ0[i]); return w; }
  vec3 wobble(vec3 p){
    float w = waveAt(p.z)*uWobAmp, hh = clamp((p.y - uBoxMin.y)/max(uBoxMax.y - uBoxMin.y, 1.), 0., 1.);
    w += uIdle*sin(uTime*uIdleF - p.z*0.045 + 1.3*sin(uTime*0.4 + p.z*0.004));       // set jelly is never quite still
    float s2 = (uSide.y - p.x - 70.*uSide.x)/70., h2 = sin(3.14159265*clamp(s2, -1., 0.));   // the long cut's sideways wave
    w -= step(0., uSide.x)*h2*h2*1.4*exp(-max(uSide.x, 0.)*0.35);
    // EIGHTH ROUND: the cut end shudders as a wave starts down the loaf (a slow, whole shake, about one a second)
    w += uShud*1.5*sin(uTime*6.3 - (p.z - uBoxMin.z)*0.08)*exp(-max(p.z - uBoxMin.z, 0.)/110.);
    // SET JELLY LEANS: its foot is stuck to the board, so the sway grows with height: the valley floor hardly moves, the
    // fir tops more, the cloud banks and the moons two or three times further (a shear, as a wobbling jelly's is)
    return vec3(w*mix(0.1 + 2.7*hh*sqrt(hh), hh*(0.55 + 0.45*hh), uStick), -0.1*w*hh, 0.35*w*hh*hh*uStick); }
  // the wave's pale front: a band some 25 m deep that runs down the loaf just behind each wave's leading edge (0..1)
  // TENTH ROUND: THE FRONT IS A TONE STEP, NOT A GLOW. One firm leading edge (half a metre: an edge, like the edge of a stuff),
  // everything behind it one flat shade paler for some 40 m, dying away softly behind that. frontP(p) is the same with the
  // edge wavering across the loaf as a hand's would (use it wherever a position is known).
  float frontAt(float z){
    float f = 0.;
    for (int i = 0; i < 5; i++){
      float age = uCutAge[i], s = (z - uCutZ0[i] - ${LOAF.waveSpeed.toFixed(1)}*age)/${LOAF.waveLength.toFixed(1)};
      f += step(0., age)*smoothstep(-2.6, -0.5, s)*(1. - smoothstep(-0.064, -0.06, s))*exp(-max(age - 9., 0.)*0.4);
    }
    return min(f, 1.); }
  float frontP(vec3 p){ return frontAt(p.z + 6.5*sin(p.x*0.085 + 1.4*sin(p.x*0.037 + 1.) + 0.05*p.y) + 2.4*sin(p.x*0.27 + 2. + 0.11*p.y) + 0.9*sin(p.x*0.7 + 0.3*p.y)); }
  // the stream's middle line and half width at z (JS twin: streamX / streamW in the part)
  float streamX(float z){ return 3.2 + 4.2*sin(z*0.0125 + 0.9) + 1.3*sin(z*0.043 + 2.); }
  float streamSd(vec2 xz){ return abs(xz.x - streamX(xz.y)) - uStream.z*(1. + 0.35*sin(xz.y*0.057) + 1.6*smoothstep(uStream.x + 26., uStream.x, xz.y)); }       // the foot sticks to the board; a standing slice bends from it and nods a little
  // the wash of paler blue that follows each wave through and fades: 0..1
  float washAt(float z){
    float w = 0.;
    for (int i = 0; i < 5; i++){
      float age = uCutAge[i], s = (z - uCutZ0[i] - ${LOAF.waveSpeed.toFixed(1)}*age)/320.;
      w += step(0., age)*smoothstep(-1., -0.3, s)*(1. - smoothstep(-0.3, 0.05, s))*exp(-max(age, 0.)*0.1);
    }
    return min(w, 1.); }

  // ---- colour is thickness ----
  // the tint thins to a tenth in the top 10 m (the pale band): integral of the density from 0 to y
  float rhoInt(float y){ float h = clamp(y - (uBoxMax.y - 10.), 0., 10.); return y - 0.045*h*h; }
  float rhoAt(float y){ return 1. - 0.09*clamp(y - (uBoxMax.y - 10.), 0., 10.); }
  float rhoAvg(float ya, float yb){ float dy = yb - ya; return abs(dy) < 0.02 ? rhoAt(ya) : (rhoInt(yb) - rhoInt(ya))/dy; }
  // THE DAWN LAYER. The loaf was poured in two: under the indigo lies a layer of almost colourless agar, nothing at the
  // cut end, rising to uDawn.z metres by z uDawn.y and level from there to the far face, the boundary soft over ten
  // metres. Daylight comes up it from the far end, so the valley between the ranges lies in dawn under the night.
  float dawnFr(float y, float z, float fr){
    float h = uDawn.z*smoothstep(uDawn.x, uDawn.y, z);
    return mix(1., mix(uDawn.w, 1., smoothstep(h - 7., h + 4. + fr, y)), smoothstep(0., 10., h)); }
  float dawnAt(float y, float z){ return dawnFr(y, z, 0.); }
  // mean tint along a straight run from (ya, za) to (yb, zb): the pale top exactly, the dawn layer by five samples
  float rhoSeg(float ya, float yb, float za, float zb){
    float fr = 0.05*abs(zb - za);          // seen down a long reach of the loaf the boundary is a broad soft fringe: the glow fades upward
    float d = dawnFr(mix(ya, yb, 0.1), mix(za, zb, 0.1), fr) + dawnFr(mix(ya, yb, 0.3), mix(za, zb, 0.3), fr) + dawnFr(mix(ya, yb, 0.5), mix(za, zb, 0.5), fr)
            + dawnFr(mix(ya, yb, 0.7), mix(za, zb, 0.7), fr) + dawnFr(mix(ya, yb, 0.9), mix(za, zb, 0.9), fr);
    return rhoAvg(ya, yb)*d*0.2; }
  // distance from p (inside the box) to where a ray along unit d leaves it
  float boxExit(vec3 p, vec3 d){
    vec3 far = mix(uBoxMin, uBoxMax, step(0., d));
    vec3 t = max((far - p)*(step(0., d)*2. - 1.), 0.)/(abs(d) + 1e-5);
    return min(t.x, min(t.y, t.z)); }
  // share of the sight line from the eye to p that runs inside the colourless core (0..1)
  float coreClear(vec3 p, vec3 eye){
    float re = length(eye.xy - uCore.xy), rp = length(p.xy - uCore.xy), R = uCore.z;
    float c = re < R ? (rp < R ? 1. : (R - re)/max(rp - re, 1e-3)) : (rp < R ? (R - rp)/max(re - rp, 1e-3) : 0.);
    return clamp(min(c, (max(p.z, eye.z) - uCore.w)/max(abs(p.z - eye.z), 1e-3)), 0., 1.); }
  // tinted metres between p and the eye
  float eyePath(vec3 p, vec3 eye){
    vec3 e = eye - p; float L = length(e); vec3 d = e/max(L, 1e-4);
    float le = min(L, boxExit(clamp(p, uBoxMin, uBoxMax), d));
    return le*rhoSeg(p.y, p.y + d.y*le, p.z, p.z + d.z*le)*(1. - coreClear(p, eye))*uEyeK; }
  // what is left of daylight after m tinted metres: red goes first, blue last, and the long view closes to ink
  vec3 transmit(float m){ return exp(-uK*m - m*m*8.0e-6); }
  // tinted metres daylight crosses to reach a surface at p facing n: the nearest outer face (or the clear core),
  // mixed with the thickness the surface itself looks out through, which is all the modelling a form gets
  float lightPath(vec3 p, vec3 n){
    vec3 q = clamp(p, uBoxMin, uBoxMax);
    float side = min(q.x - uBoxMin.x, uBoxMax.x - q.x), ends = min(q.z - uBoxMin.z, uBoxMax.z - q.z);
    float dq = dawnAt(q.y, q.z);
    float near = min(min(side, ends)*rhoAt(q.y)*dq, (uBoxMax.y - q.y)*rhoSeg(q.y, uBoxMax.y, q.z, q.z));
    float core = max(length(q.xy - uCore.xy) - uCore.z, 0.) + max(uCore.w - q.z, 0.);
    near = min(near, core);
    float t = min(boxExit(q, n), 150.), yb = q.y + n.y*t;
    float along = t*rhoSeg(q.y, yb, q.z, q.z + n.z*t) + 70.*step(yb, uBoxMin.y + 0.05)*step(n.y, 0.);    // the board sends little back
    return mix(near, min(along, near + 70.), uModel); }
  // THE rule: an opaque stuff of display colour 'albedo' at p (normal n) as the eye sees it, as a scene value
  float gKeep = 0., gEye = 1.;          // tenth round: a fragment may ask to stay truer than its material's uKeep and uEyeK (white paste laid on dark: the snow)
  vec3 inJelly(vec3 albedo, vec3 p, vec3 n, vec3 eye){
    float w = 1. - 0.32*washAt(p.z), keep = clamp(uKeep + gKeep, 0., 1.);
    // the long cut: daylight floods in from the fresh wall, a pale front that crosses the loaf in a second and fades over six
    w -= 0.3*step(0., uSide.x)*smoothstep(0., 1., (uSide.x*55. - (uSide.y - p.x))/20.)*exp(-max(uSide.x, 0.)*0.3);
    vec3 Te = transmit(eyePath(p, eye)*w*gEye);
    vec3 T = Te*transmit(lightPath(p, n)*w*0.4);          // daylight arrives scattered: under half the straight path counts
    // a stuff's own hue goes with the red: far gold and far paste are both simply pale, then blue, then ink
    // near, a stuff is only dimmed and stays true; with distance it becomes the blue ghost of itself
    vec3 W = vec3(0.3, 0.55, 0.15);
    vec3 col = mix(albedo*mix(dot(T, W), 1., keep), vec3(dot(albedo, W))*T, smoothstep(0.42*max(keep - 0.3, 0.), 1., 1. - Te.g*sqrt(Te.g)));     // gold within 10 m is gold
    return toScene(col + uInk*(1. - Te.b)); }
  // the same for bare agar: what lies behind the jelly (display colour 'behind') through 'metres' of it
  vec3 throughJelly(vec3 behind, float metres, float z){
    vec3 T = transmit(metres*(1. - 0.32*washAt(z)));
    return toScene(behind*T + uInk*(1. - T.b)); }
  // the workroom's north light, as mirrored by wet faces and seen past the board
  vec3 domeAt(vec3 d){ d = uRot*d;
    float l = max(dot(d, uLampDir), 0.); l *= l; l *= l;
    vec3 c = d.y < 0. ? mix(uRoomLow, uRoomBoard, 1. - smoothstep(-0.25, 0., d.y)) : mix(uRoomLow, uRoomHi, smoothstep(0., 0.5, d.y));
    return c + uLamp*(0.22*l + 0.5*l*l*l*l); }
`;

/** Vertex shaders only (after STYLE_GLSL): the eye in the mesh's own space. Rigid transforms only: slabs lean, slide
 *  and tip but never scale. Pass it on as a varying (vEye). */
export const STYLE_VERT_GLSL = /* glsl */`
  vec3 eyeLocal(){ return (cameraPosition - modelMatrix[3].xyz)*mat3(modelMatrix); }
`;

// ---------------------------------------------------------------------------------------------------------------
// createJelly: one set of shared uniforms and the material factories for one block of jelly (the loaf; the world
// coder makes one more per cut slab with its own box). Identical shader text, so no extra programs are compiled.
// ---------------------------------------------------------------------------------------------------------------
export function createJelly(o = {}) {
  const pal = (o.palette || PALETTE).map((h) => new THREE.Color(h));
  const shape = o.shape;
  const box = o.box || { min: [LOAF.x0, LOAF.y0, LOAF.z0], max: [LOAF.x1, LOAF.y1, LOAF.z1] };
  // absorption per metre, from the palette: 30 m of agar turns daylight into the slab blue
  const k = new THREE.Vector3(-Math.log(pal[3].r / pal[1].r) / 30, -Math.log(pal[3].g / pal[1].g) / 30, -Math.log(pal[3].b / pal[1].b) / 30);
  const uniforms = {
    uBoxMin: { value: new THREE.Vector3(...box.min) }, uBoxMax: { value: new THREE.Vector3(...box.max) },
    uCutAge: { value: [-1, -1, -1, -1, -1] }, uCutZ0: { value: [box.min[2], box.min[2], box.min[2], box.min[2], box.min[2]] },
    uTime: { value: 0 }, uExposure: { value: o.exposure ?? 1 }, uWobAmp: { value: 1 },
    uDay: { value: pal[1] }, uDayLow: { value: pal[1].clone().lerp(pal[3], 0.16) }, uInk: { value: pal[2] }, uBoard: { value: pal[0] },
    uK: { value: k }, uPx: { value: 600 },
    uCore: { value: new THREE.Vector4(LOAF.axis[0], LOAF.axis[1], o.core === false ? -1e4 : LOAF.coreR, o.core === false ? 1e6 : LOAF.barEnd) },
    uHas: { value: new THREE.Vector4(1, 1, 1, 1) },     // sections drawn on the cut face: ridge, moon, geese, leaf specks
    uFarFace: { value: o.farFace ? 1 : 0 },             // 1: the far (z max) face is a cut face too (a slab)
    uFloor: { value: 1 },                               // 0: this block lies on its back, its foot is a wall like any other
    uDawn: { value: new THREE.Vector4(1e6, 2e6, 0, 1) }, uKeep: { value: 0.3 }, uEyeK: { value: 1 }, uModel: { value: 0.65 },
    uRoomHi: { value: new THREE.Color('#150E0A') }, uRoomLow: { value: new THREE.Color('#3A2413') }, uRoomBoard: { value: new THREE.Color('#5E4326') },
    uLamp: { value: new THREE.Color('#F2B55E') }, uLampDir: { value: new THREE.Vector3(0.7, 0.25, 0.65).normalize() },
    uMoonOv: { value: new THREE.Vector4(-1, -1, 0, 0) }, uMoonAt: { value: new THREE.Vector3(0, 0, 0) },
    uLampPos: { value: new THREE.Vector3(-430, 170, 760) }, uLampK: { value: new THREE.Vector4(1.3, 600, 1, 1) }, uSteelC: { value: new THREE.Color('#B4BAC0') },
    uWin: { value: new THREE.Vector4(512, 48, 0, 24) }, uKnife: { value: new THREE.Vector4(-72, 470, -0.06, 0) }, uBowl: { value: new THREE.Vector3(700, 1250, 1) },      // the look out (z0, z1, strength, the pane's metres); the knife beside the loaf (heel x, z, angle, on)
    uRot: { value: new THREE.Matrix3() }, uIdle: { value: o.idle ?? 0.22 }, uIdleF: { value: o.idleF ?? 1.25 }, uStick: { value: o.stick ?? 0 }, uCapY: { value: 1e5 }, uSide: { value: new THREE.Vector2(-1, 1e5) },
    uShud: { value: 0 }, uRing: { value: 0 }, uWarm: { value: new THREE.Vector4(0, 0, 1, 0) }, uWarm2: { value: new THREE.Vector4(0, 0, 1, 0) }, uStream: { value: new THREE.Vector4(506, 912, 1.5, 0) },
    ...shape.uniforms,
  };
  const U = (extra) => Object.assign({}, uniforms, extra);      // shares the uniform objects by reference
  const FS_HEAD = /* glsl */`${STYLE_GLSL}
    varying vec3 vP; varying vec3 vN; varying vec3 vEye;`;
  const VS_HEAD = FS_HEAD + STYLE_VERT_GLSL;

  /** Opaque paste (white bar, black ridge, goose rods, collar) set in the jelly. Geometry in loaf space with normals.
   *  color: display colour (hex or THREE.Color); grain: 0..0.2 tone breakup; side: THREE side (default DoubleSide). */
  function pasteMaterial(color, p = {}) {
    return new THREE.ShaderMaterial({
      uniforms: U({ uAlbedo: { value: new THREE.Color(color) }, uGrain: { value: p.grain ?? 0.1 }, uCapCol: { value: pal[5] }, uSlabT: { value: pal[3].clone().multiplyScalar(1 / max(pal[3].r, pal[3].g, pal[3].b, 1e-3)) }, uCapOn: { value: p.cap ? 1 : 0 }, uFurrow: { value: p.furrow ?? 0 }, uMoon: { value: p.moon ? 1 : 0 }, uStreak: { value: p.streak ?? 0 }, uMoonLit: { value: p.moonLit ?? 0 }, uMaria: { value: p.maria ?? 0 }, uTip: { value: p.tip ?? 0 },
        uLake: { value: p.lake || new THREE.Vector4(0, 0, 0, 0) }, uLakeMoon: { value: p.lakeMoon || new THREE.Vector4(0, 0, 1e5, 1) }, uLakeMoon2: { value: p.lakeMoon2 || new THREE.Vector2(0.5, 0) },
        ...(p.keep !== undefined ? { uKeep: { value: p.keep } } : {}), ...(p.eyeK !== undefined ? { uEyeK: { value: p.eyeK } } : {}), ...(p.model !== undefined ? { uModel: { value: p.model } } : {}) }), side: p.side ?? THREE.DoubleSide,
      vertexShader: /* glsl */`${VS_HEAD}
        attribute float aHollow; varying float vHol;      // 1 in the spoon's hollow (the tip); geometries without it read 0
        attribute vec3 aTipQ; varying vec3 vTipQ;         // the tip: the scoop's own coordinates (along, across) and the drag ridges' tone (+ crest, - trough)
        void main(){ vP = position; vN = normal; vEye = eyeLocal(); vHol = aHollow; vTipQ = aTipQ;
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position + wobble(position), 1.); }`,
      fragmentShader: /* glsl */`${FS_HEAD}
        varying float vHol; varying vec3 vTipQ;
        uniform vec3 uAlbedo, uCapCol, uSlabT; uniform float uGrain, uCapOn, uFurrow, uMoon, uStreak, uMoonLit, uMaria, uTip; uniform vec4 uLake, uLakeMoon; uniform vec2 uLakeMoon2;
        void main(){
          if (vP.z < uBoxMin.z || vP.x > uBoxMax.x) discard;     // the blade has been here
          vec3 e = vEye - vP; float dist = length(e);
          vec3 n = vN/max(length(vN), 1e-4); if (dot(n, e) < 0.) n = -n;
          // the hand: paste pressed through a nozzle keeps long streaks and a fine tooth; both fade to their mean far off
          float near = 1. - smoothstep(30., 140., dist), fine = 1. - smoothstep(8., 45., dist);
          float g = (vnoise(vec2(vP.z*0.045, (vP.x - vP.y)*0.8)) - 0.5)*near + 0.6*(vnoise(vP.xy*3.1 + vP.z*0.9) - 0.5)*fine;
          g -= 0.45*smoothstep(0.62, 0.7, vnoise(vec2(vP.z*0.012, (vP.x + vP.y*0.6)*2.6)))*fine;     // the nozzle's grooves
          // the fork's furrows (the ridge only): combed while the paste was soft, running lengthways and wavering; the
          // crests are rubbed paler. Finer than about 3 px they give way to their mean.
          // THE FORK AND THE HAND (fourth round). Near, each furrow wavers by a third of its width, a crest breaks every ten
          // or twenty metres, crests are rubbed paler in patches and carry a tooth, crumbs lie in the troughs: all of it
          // changes along the course, so it streams under us; beyond some 60 m it gives way to the plain furrow, then its mean.
          float fz = max(fwidth(vP.z), 1e-4), nearZ = 1. - smoothstep(0.5, 2.5, fz), fineZ = 1. - smoothstep(0.04, 0.22, fz);
          // EIGHTH ROUND: BEAN PASTE A FORK WAS DRAWN THROUGH. Near the eye each furrow is a decided pale crest line beside a
          // darker flat trough: two flat tones meeting at an edge, with one thin deep line where the tine cut. The furrows
          // waver by a third of their width, a crest is broken off where the fork skipped, crests are rubbed paler in
          // patches, and within some 20 m the paste shows its pits and its tooth. Beyond some 60 m the furrows are gone:
          // the slopes there are tone and form (below), never corduroy.
          float fnear = 1. - smoothstep(64., 120., dist);      // ninth round: the side slopes are the same combed paste as the floor, seen further off
          float fq = vP.x*2.2 + 1.5*sin(vP.z*0.02 + uRidgePh.z) + 0.6*vnoise(vec2(vP.x*0.3, vP.z*0.01))
                   + 2.0*(vnoise(vec2(vP.x*0.45, vP.z*0.1)) - 0.5) + 0.9*(vnoise(vec2(vP.x*1.3 + 7., vP.z*0.33)) - 0.5);
          float fw = max(fwidth(fq), 1e-4), fa = clamp(fw/3.14159, 0.004, 0.5);
          float fsg = fract(fq/6.2831853 + 0.5) - 0.5, fc = 1. - 2.*abs(fsg);            // fsg: across one furrow, 0 on the crest's own line
          float fi = floor(fq/6.2831853 + 0.5), bz = vP.z/13. + hash11(fi*1.37)*9., bc = floor(bz);
          float gap = step(0.5, hash21(vec2(fi, bc)))*(1. - smoothstep(0.03, 0.24, abs(fract(bz) - 0.25 - 0.5*hash21(vec2(bc, fi + 3.)))))*(1. - smoothstep(24., 42., dist))*smoothstep(0.88, 0.95, n.y);      // ninth round: where the fork skipped (on the floor) the crest thins to a point and is gone (never a square end); only near the eye: further off the furrow lines run unbroken
          float crest = smoothstep(0.74 + 0.32*gap - fa, 0.74 + 0.32*gap + fa, fc);
          float groove = (1. - smoothstep(0.04 - 0.5*fa, 0.04 + 0.5*fa, abs(fsg - 0.19)))*(1. - smoothstep(0.2, 0.5, gap))*(1. - smoothstep(0.02, 0.1, fa));
          float rub = 0.55*smoothstep(0.585, 0.615, vnoise(vec2(vP.x*0.13, vP.z*0.085)))*(1. - smoothstep(28., 60., dist));      // (a rubbed patch is one firm step of tone)
          float tooth = (vnoise(vec2(vP.x*8., vP.z*4.3)) - 0.5)*fineZ;
          float pitK = (1. - smoothstep(0.1, 0.45, fz))*(1. - smoothstep(14., 30., dist));
          float pits = smoothstep(0.66, 0.72, vnoise(vP.xz*2.7 + 11.))*pitK;
          vec2 cc = floor(vP.xz*1.3), cq2 = fract(vP.xz*1.3) - 0.5 - (vec2(hash21(cc + 4.1), hash21(cc + 8.3)) - 0.5)*0.5;
          float crumb = step(0.9, hash21(cc))*(1. - smoothstep(0.1, 0.2, length(cq2)))*fineZ*(1. - crest);
          float fvis = (1. - smoothstep(1.0, 2.6, 2.9*max(fwidth(vP.x), 1e-4)))*fnear;      // ninth round: by the furrow's own mean width on screen (the waver's local slope made it come and go in soft blocks)
          float fur = mix(1.3, (mix(0.96 - 0.42*groove, mix(2.7, 2.25, smoothstep(30., 70., dist)) + 1.1*rub, crest)*(1. + 0.5*tooth*crest) + 1.5*crumb)*(1. - 0.34*pits), fvis)*(0.9 + 0.2*vnoise(vP.xz*0.07 + 3.));      // and the whole field is patchy, as a hand leaves it
          g = mix(g, 0.5*(vnoise(vP.xy*3.1 + vP.z*0.9) - 0.5)*fine, uFurrow);      // ninth round: the ridge is combed, not streaked (the nozzle's long soft blocks read as camouflage on the slopes)
          // the nozzle's long streaks close to (the Moon Bar): finer than three pixels they give way to their mean
          float sa = (vP.x - vP.y)*8., sb = (vP.x + vP.y)*8., sw = fwidth(sa) + fwidth(sb);
          g += uStreak*(vnoise(vec2(vP.z*0.03, sa)) + vnoise(vec2(vP.z*0.03 + 9., sb)) - 1.)*(1. - smoothstep(0.3, 0.8, sw));
          // THE MOON CUT LENGTHWAYS: a lune has two faces, the swelling lit limb and the hollow, and the hollow lies in the
          // moon's own thickness: a third darker and bluer. They meet in the horn, one crisp edge running the length of the bar.
          vec2 mq = (vP.xy - barC(vP.z))/max(barR(vP.z), 1.); float ma = barA(vP.z); vec2 ml = vec2(cos(ma), sin(ma));
          float mu = dot(mq, ml), mv = dot(mq, vec2(-ml.y, ml.x));
          float hollow = uMoon*smoothstep(-0.012, 0.012, (1. - length(mq)) - (mu - (1. - 2.*barP(vP.z))*sqrt(max(1. - mv*mv, 0.))))*(1. - smoothstep(884., 892., vP.z))*(1. - smoothstep(0.5, 0.8, abs(vN.z)/max(length(vN), 1e-4)));
          float faceC = dot(n, vec3(-0.62, 0.55, 0.56));
          float cq = capLine(vP + vec3(0., 0.9*uMoonLit, 0.), 0.);
          // TENTH ROUND: the white's edge is a level line of the LAND, not of the mesh: near the line the height is taken from the
          // picture function itself (across a sharp crest the mesh's facets and its normals made the edge a saw), and the
          // snowline no longer steps down on the faces turned to the moons (that step ran along the creases)
          if (uCapOn > 0.5 && abs(cq) < 4.5 && vP.z < 968.) cq = capLine(vec3(vP.x, mix(ridgeH(vP.x, vP.z), vP.y, smoothstep(940., 968., vP.z)) + 0.9*uMoonLit, vP.z), 0.);
          float cw = clamp(fwidth(cq), 1e-3, 0.5);      // white paste on the crests, lower on the faces turned to the moons
          // ninth round: spread paste ends in round lobes. TENTH ROUND: seen end-on along the valley a 10 m lobe is a tooth: there the
          // short lobes give way (by their own width against their height on screen) and long ones of some 30 m carry the edge
          float lph = vP.z*0.3 + 2.4*vnoise(vP.xz*0.045 + 9.) + vP.x*0.07, lratio = 3.5*fwidth(cq)/max(fwidth(lph), 1e-4);
          cq += (0.9*(abs(sin(lph)) - 0.64)*smoothstep(0.9, 2.2, lratio) + 1.5*(abs(sin(vP.z*0.105 + 1.7*vnoise(vP.xz*0.02 + 4.) + vP.x*0.03)) - 0.64))*uCapOn;
          float cap = uCapOn*smoothstep(-cw, cw, cq);
          fur = mix(fur, 1., cap);                                   // one paste laid on another: a crisp line at any distance
          // THE LAKE: a basin of the valley filled with clear agar. It mirrors the night: the third moon hanging over its far
          // end (the true reflection of that slice of paste, found by the ray), ink above, the dawn low down; its skin is
          // never still, so the moon in it wavers.
          // EIGHTH ROUND: THE STREAM. Clear agar runs out of the lake's far end and winds down the valley floor to the dawn: a
          // pale ribbon that holds the light of the far end, short ripple lines running down it, a paler wet line at its banks.
          float bank = 0.;
          if (uStream.w > 0.5 && vP.z > uStream.x - 6. && vP.z < uStream.y) {
            float ss = streamSd(vP.xz) + 3.*smoothstep(uStream.y - 40., uStream.y, vP.z), sa = clamp(fwidth(ss), 1e-3, 3.);
            if (ss < 0. && sa < 2.*uStream.z) {
              float ry = abs(e.y)/max(dist, 1e-4);
              float rq = vP.z*0.42 - uTime*1.5 + 1.3*sin(vP.x*1.3 + vP.z*0.21), rw = clamp(fwidth(rq), 1e-3, 1.);
              float ripl = (1. - smoothstep(0.07, 0.1 + 1.5*rw, abs(fract(rq) - 0.5)))*(1. - smoothstep(0.25, 0.6, rw))*smoothstep(0.4, 0.55, vnoise(vec2(vP.x*0.8 + floor(rq)*3.1, 1.7)));
              vec3 wc = uInk*1.5 + uDayLow*(0.3 + 0.34*(1. - smoothstep(0.03, 0.45, ry)));
              wc += uDayLow*0.3*ripl; wc *= 1. + 0.55*smoothstep(-0.5 - sa, 0., ss) + 0.4*frontP(vP);
              wc *= min(1., dot(uCapCol, vec3(0.287, 0.526, 0.143))/max(dot(wc, vec3(0.3, 0.55, 0.15)), 1e-4));      // (tenth round: its wet line inside the wave's front is never lighter than the moon's cream)
              vec3 Tw = transmit(eyePath(vP, vEye)*0.6);
              gl_FragColor = vec4(toScene(wc*Tw + uInk*(1. - Tw.b)), 1.); return;
            }
            bank = (1. - smoothstep(0., 0.4 + sa, ss))*(1. - smoothstep(1.5, 4., sa));
          }
          if (uLake.w > 0.5 && vP.z > uLake.x && vP.z < uLake.y) {
            float lb; float depth = uLake.z - ridgeRaw(vP.x, vP.z, lb);
            if (lb > 0.001 && depth > 0.) {
              vec3 dv = -e/max(dist, 1e-4);
              float lf = 1. - smoothstep(0.15, 0.8, fz);
              vec2 rp2 = vec2(sin(vP.x*0.9 + uTime*0.8 + 1.7*sin(vP.z*0.31 - uTime*0.5)), sin(vP.z*0.7 - uTime*0.6 + 1.3*sin(vP.x*0.43 + uTime*0.4)));
              // EIGHTH ROUND: when a wave passes under it the lake's round breaks into rings (uRing), which run out to the shore and die
              float rgd = length((vP.xz - vec2(${LAKE.x.toFixed(1)}, ${((LAKE.z0 + LAKE.z1) / 2).toFixed(1)}))*vec2(1., 0.5)), rgs = sin(rgd*1.25 - uTime*3.4), rgw = clamp(fwidth(rgd)*1.25, 1e-3, 2.);
              float ring = uRing*rgs*(1. - smoothstep(0.6, 1.6, rgw)); rp2 += 5.*ring;
              vec3 r = vec3(dv.x + 0.004*rp2.x*lf, abs(dv.y) + 0.02, dv.z + 0.004*rp2.y*lf); r /= max(length(r), 1e-4);
              // the moon is a round that faces the eye: in the water it is that same round, upside down, wavering only at its edge
              vec3 mc = uLakeMoon.xyz - vP; float al = dot(mc, r); vec3 hh = r*al - mc;
              vec3 rr = cross(vec3(0., 1., 0.), -r); rr /= max(length(rr), 1e-3); vec3 uu = cross(-r, rr);
              vec2 lq = vec2(dot(hh, rr), dot(hh, uu))/max(uLakeMoon.w, 1.), ll = vec2(-cos(uLakeMoon2.y), sin(uLakeMoon2.y));
              float lu = dot(lq, ll), lv = dot(lq, vec2(-ll.y, ll.x)), wav = 0.045*(rp2.x + rp2.y)*lf + 0.22*ring;
              float lsd = (1. - 2.*uLakeMoon2.x)*sqrt(max(1. - lv*lv, 0.)) - lu, lrd = length(lq) - 1. + wav;
              float lw = clamp(fwidth(lq.x) + fwidth(lq.y), 0.01, 0.2);
              float moonR = (1. - smoothstep(-lw, lw, lrd))*step(0.001, al), moon = moonR*(1. - smoothstep(-lw, lw, lsd + wav));
              vec3 sky = uInk*1.9 + uDayLow*(0.05 + 0.55*(1. - smoothstep(0.03, 0.32, r.y)));
              vec3 T = transmit(eyePath(vP, vEye));
              sky = mix(sky, sky + (uDayLow - uInk)*0.06, moonR);                                            // the unlit round, faintly paler
              // seventh round: the water is seen to be water: short pale ripple lines lie across it and drift (finer than three pixels: gone)
              float rq = vP.z*0.5 + 1.5*sin(vP.x*0.23 + uTime*0.25) + 0.7*sin(vP.x*0.61 - uTime*0.4), rw = clamp(fwidth(rq), 1e-3, 1.);
              float ripl = (1. - smoothstep(0.05, 0.07 + 1.5*rw, abs(fract(rq) - 0.5)))*(1. - smoothstep(0.2, 0.55, rw))*smoothstep(0.5, 0.62, vnoise(vec2(vP.x*0.16 + floor(rq)*3.1, uTime*0.12)))*smoothstep(0.3, 1.2, depth);
              sky += (uDayLow - uInk)*0.11*ripl*(1. - moonR) + (uDayLow - uInk)*0.2*uRing*smoothstep(0.55, 0.9, rgs)*(1. - smoothstep(0.6, 1.6, rgw));
              vec3 lake = mix(sky, uCapCol*0.9, moon*0.92)*(1. + 0.5*(1. - smoothstep(0., 0.35, depth)));      // a paler wet line at the shore
              gl_FragColor = vec4(toScene(lake*T + uInk*(1. - T.b)), 1.); return;
            }
          }
          float drift = mix(0.95, 0.82 + 0.26*vnoise(vec2(vP.x*0.6 + vP.z*0.15, vP.z*0.08)) - 0.1*smoothstep(0.55, 0.75, vnoise(vP.xz*0.21 + 5.)), (1. - smoothstep(1.5, 5., fz))*uCapOn);      // wind-laid drifts in the snow
          // SIXTH ROUND: MOONLIGHT ON THE LAND. The moons hang to port and ahead: every slope and crest that faces them carries
          // a rim of their light (paste a shade warmer and paler, snow whiter), the slopes turned away stay in the ink, so
          // each range reads as a shape against the night. It is tone only: no cast shadow, no lamp.
          // EIGHTH ROUND: TONE AND FORM. A slope is one of three flat tones by how it faces the moons (they hang to port and
          // ahead): the faces turned to them pale and warm, the faces turned away a cool dark, the rest the paste's own
          // colour, meeting at soft-wavering edges; the valley floor is a shade paler than the slopes. No cast shadow, no lamp.
          // TENTH ROUND: A KNOLL TAKES THE TONE OF THE SLOPE IT STANDS ON. Its own round back, turned from the moons, was one
          // isolated dark disc with a firm edge (the see-through disc on the left range, the dark leaf on the knoll): the tone
          // is chosen by the land's slope WITHOUT the knoll, so a knoll reads by its outline, its furrows and its pinch of snow.
          vec3 nT = n;
          if (uFurrow > 0.5 && n.y > 0.15) { float e7 = 1.6; vec2 kg = vec2(knollH(vP.x + e7, vP.z) - knollH(vP.x - e7, vP.z), knollH(vP.x, vP.z + e7) - knollH(vP.x, vP.z - e7))/(2.*e7);
            vec3 nb = vec3(n.x/n.y + kg.x, 1., n.z/n.y + kg.y); nT = nb/max(length(nb), 1e-3); }

          // (tenth round: where the furrows show, each combed strip takes its tone whole: a tone's edge runs along the furrows and
          // steps from strip to strip, as light lies on combed paste. One smooth round edge laid across the furrows read as a
          // see-through disc lying over the slope: the dark round on the starboard range over the village.)
          float face = dot(nT, vec3(-0.62, 0.55, 0.56)) + 0.1*(vnoise(vP.xz*0.09 + 3.) - 0.5) + 0.2*(hash11(fi*2.17 + 3.) - 0.5)*fvis*uFurrow, aw2 = clamp(fwidth(face), 2e-4, 0.05);      // ninth round: one pixel of edge wherever the slope turns, however slowly (a fixed band left soft blots on the knolls)
          float kn9 = 9.*knoll(vP.x, vP.z)*smoothstep(5., 18., abs(vP.x - 6.))*smoothstep(205., 275., vP.z)*(1. - smoothstep(880., 960., vP.z));
          // (tenth round: a knoll's side turned from the moons is only a shade cooler: at full strength it was one isolated dark patch, a hole in the paste)
          float mlit = smoothstep(0.62 - aw2, 0.62 + aw2, face)*uMoonLit, mshd = (1. - smoothstep(0.22 - aw2, 0.22 + aw2, face))*uMoonLit*(1. - 0.72*smoothstep(0.8, 3., kn9)), mh = smoothstep(16., 46., vP.y);
          // (tenth round: a half tone between the paste's own colour and the moonlit one: a buttress turned half from the moons was
          // one dark round with a single firm edge among pale slopes, the see-through disc on the left range at u 0.34)
          float mhalf = smoothstep(0.4 - aw2, 0.4 + aw2, face)*uMoonLit;
          float fy = vP.y - kn9 + 2.*(vnoise(vP.xz*0.13 + 7.) - 0.5), fyw = clamp(fwidth(fy), 0.02, 1.5);      // tenth round: a knoll is the floor's own paste heaped up: it keeps the floor's paler tone (it stood out of it as a dark patch)
          float floorK = (1. - smoothstep(21.7 - fyw, 22.3 + fyw, fy))*uMoonLit;
          // and the slopes are laid in terraces: three flat tones by height, their edges wavering as a hand leaves them
          float ty = vP.y - kn9 + 3.2*(vnoise(vP.xz*0.1 + 1.) - 0.5), tyw = clamp(fwidth(vP.y), 0.02, 0.7);      // ninth round: by the range's own height: a knoll's top is no dark cap
          // (tenth round: the middle terrace is a shade, not a dark band: on a rounded hill it stood as a dark see-through disc)
          // (and the three tones climb: each terrace a shade paler than the one below. A middle terrace darker than both its
          // neighbours lay round a buttress as a closed dark shape: the see-through disc on the starboard range over the village.)
          float terr = mix(1., mix(1., 1.07, smoothstep(26. - tyw, 26. + tyw, ty))*mix(1., 1.1, smoothstep(32.5 - tyw, 32.5 + tyw, ty)), uMoonLit);
          // the full moon's seas: where the hand pressed the paste thin it is a breath cooler (never near the opening in its middle)
          float mr = length(vP.xy - uCore.xy), mar = uMaria*smoothstep(0.5, 0.6, vnoise(vP.xy*0.075 + 3.7) + 0.25*vnoise(vP.xy*0.3 + 9.))*smoothstep(9.5, 14., mr)*(1. - smoothstep(22.5, 25.5, mr));
          // EIGHTH ROUND: THE HARE IN THE MOON, pressed into the paste with a thumb: a hare bent over its mortar, the pestle in its
          // paws, a shade cooler than the cream (flat, one crisp edge), low on the left of the round and clear of the opening
          if (uMaria > 0.5) { vec2 hq = vec2(-(vP.x - uCore.x), vP.y - uCore.y); float hw2 = clamp(fwidth(hq.x) + fwidth(hq.y), 1e-3, 1.);
            float hd = length((hq - vec2(-13., -9.))*vec2(1., 1.3)) - 6.;                                   // its body
            hd = min(hd, length(hq - vec2(-10.6, -3.4)) - 2.7);                                               // its head
            vec2 e1 = hq - vec2(-12.6, 1.4), e2 = hq - vec2(-10.2, 1.9);                                       // two ears laid back
            hd = min(hd, length(vec2(e1.x*0.92 + e1.y*0.39, (-e1.x*0.39 + e1.y*0.92)*0.3)) - 0.95);
            hd = min(hd, length(vec2(e2.x*0.98 + e2.y*0.2, (-e2.x*0.2 + e2.y*0.98)*0.3)) - 0.9);
            vec2 pa = vec2(-8.6, -6.4), pb = vec2(-3.2, -11.6), pq = hq - pa, pd = pb - pa; float ph = clamp(dot(pq, pd)/dot(pd, pd), 0., 1.);
            hd = min(hd, length(pq - pd*ph) - 0.55);                                                          // the pestle
            vec2 mq2 = abs(hq - vec2(-2.6, -15.4)) - vec2(3.4 - 0.25*(hq.y + 15.4), 2.5); hd = min(hd, max(mq2.x, mq2.y));      // the mortar
            hd = min(hd, length((hq - vec2(-18.6, -11.6))*vec2(1., 1.1)) - 1.5);                              // its scut
            mar = max(mar, (1. - smoothstep(-hw2, hw2, hd))*2.4); }
          float frnt = frontP(vP)*uMoonLit;                      // the wave's pale front running down the valley floor and the snow
          vec3 ridgeC = uAlbedo*mix(1., fur, uFurrow)*terr*mix(mix(mix(1., 0.72/min(terr, 1.), mshd), 1.4 + 0.5*mh, mhalf), 1.75 + 1.5*mh, mlit)*mix(vec3(1.), vec3(0.7, 0.79, 1.26), mshd)*(1. + 0.9*floorK) + uCapCol*(0.05*mlit*(0.3 + mh) + 0.03*floorK);
          // NINTH ROUND: THE SNOW IS WHITE PASTE SPREAD WITH A KNIFE. Long shallow strokes lie along the slope, one over the
          // next: two close tones of cream meeting at a firm edge, a thin cooler line where a stroke's edge stands proud;
          // its lower edge on the dark paste is thick: a paler lip, and under it a narrow dark crease. Finer than a few pixels
          // the strokes give way to their mean. (No sugar grains: they read as square flecks.)
          float kq = vP.y*0.34 + vP.z*0.02 + 2.0*vnoise(vec2(vP.z*0.055, vP.x*0.07 + 3.)) + 0.5*vnoise(vec2(vP.z*0.16, vP.y*0.2 + 1.));      // tenth round: narrower strokes that bow and waver (level bands on a flat slope read as straight-edged facets)
          // TENTH ROUND: on the two peaks by the full moon the knife was drawn down from the top: five strokes fan round each heap
          float pw = 0.;
          { vec2 pc = vec2(vP.x > -15. ? 13. : -43., 1028.), pd = (vP.xz - pc)/vec2(17., 38.); float pr = length(pd);
            pw = smoothstep(982., 996., vP.z)*(1. - smoothstep(0.85, 1.05, pr));
            if (abs(pd.x) + abs(pd.y) < 1e-4) pd = vec2(1e-4, 0.);
            kq = mix(kq, atan(pd.y, pd.x)*1.5915494 + 0.05*vP.y + 0.35*vnoise(vec2(vP.y*0.11, vP.x*0.2 + 3.)), pw); }
          float kw = clamp(fwidth(kq), 1e-3, 1.);
          float kp = abs(fract(kq*0.5)*2. - 1.), kvis = (1. - smoothstep(0.22, 0.45, kw))*uCapOn;
          float kpar = smoothstep(0.5 - 0.6*kw, 0.5 + 0.6*kw, kp), kline = (1. - smoothstep(0.03 + 0.5*kw, 0.06 + 1.5*kw, abs(kp - 0.5)))*(1. - smoothstep(0.08, 0.22, kw));
          float lip = (1. - smoothstep(0.55, 0.75 + cw, cq))*(1. - smoothstep(0.25, 0.5, cw))*uCapOn;
          drift = mix(drift, mix(mix(0.76, 0.98, kpar)*(1. - 0.13*kline), 1.03, lip), kvis);
          // (tenth round: the crease is a narrow line in METRES. Round a knoll's pinch of snow, where the line's function falls away
          // slowly, it was a dark ring fifteen metres wide: the see-through dark disc on the left range, the knoll's dark leaf)
          float gq = clamp(cw/max(length(fwidth(vP)), 1e-4), 0.3, 4.);
          float under = (1. - cap)*smoothstep(-0.75 - cw, -0.5, cq/gq)*(1. - smoothstep(0.25, 0.5, cw))*uCapOn;      // the crease under the lip
          ridgeC *= 1. - 0.45*under;
          // TENTH ROUND: on the snow the tones go by the STROKE: each stroke of the knife is one flat tone (moonward cream, the
          // middle tone, the cool one), chosen by how the slope faces the moons and by the stroke's own hand, so the edges
          // between tones are the strokes' edges (long, bowed, following the slope) and never a straight crease of the form.
          // (and by the LAND'S OWN slope, taken from the height function, not from the mesh: a facet's straight edge never shows in the snow)
          float faceA = face;
          if (cap > 0.002 && vP.z < 960. && uTip < 0.5 && uCapOn > 0.5) { float e9 = 2.2, hA = ridgeH(vP.x - e9, vP.z), hB = ridgeH(vP.x + e9, vP.z), hC = ridgeH(vP.x, vP.z - e9), hD = ridgeH(vP.x, vP.z + e9);
            vec3 nA = vec3(hA - hB, 2.*e9, hC - hD); nA /= max(length(nA), 1e-3);
            faceA = mix(dot(nA, vec3(-0.62, 0.55, 0.56)) + 0.1*(vnoise(vP.xz*0.09 + 3.) - 0.5), face, smoothstep(930., 960., vP.z)); }
          float sid = mod(floor(kq + 0.5), 10.), faceS = faceA + 0.42*(hash11(sid*1.31 + 2.) - 0.5)*kvis;
          float slit = smoothstep(0.62 - aw2, 0.62 + aw2, faceS)*uMoonLit, sshd = (1. - smoothstep(0.22 - aw2, 0.22 + aw2, faceS))*uMoonLit;
          gKeep = 0.36*cap; gEye = mix(1., 0.3, cap);      // white paste laid on the dark stays cream a long way (as the moons do), lavender only far off
          // two close pale tones and the cream: the loaf's own cool (pale blue in the indigo, pale lavender in the plum), never slate
          vec3 sMid = mix(vec3(1.), uSlabT, 0.2)*0.9, sShd = mix(vec3(1.), uSlabT, 0.4)*mix(0.8, 0.86, pw);
          vec3 snowC = uCapCol*drift*mix(vec3(1.), mix(mix(sMid, sShd, sshd), vec3(0.93), slit), uMoonLit)*mix(vec3(1.), vec3(0.8, 0.86, 0.97), (1. - crest)*0.75*uFurrow*uMoonLit*fvis*(1. - kvis));
          // TENTH ROUND: NOTHING INSIDE IS BRIGHTER THAN THE MOON'S CREAM. Every lift (the stream's bank, the village's windows,
          // the room's lamp through the round window, the wave's front) multiplies the DARK paste only; the snow takes each as a
          // step toward a cream that stops short of the moon's, so it keeps its two tones and its strokes and never burns out.
          vec3 capMax = uCapCol*0.955;
          vec2 wd = (vP.xz - uWarm.xy)/max(uWarm.z, 1.); float wk = uWarm.w*exp(-dot(wd, wd)*1.6)*uMoonLit;      // the village's windows warm the ground about it
          // the lamp of the room falls in through the round window: ONE pool, a patch with an edge (a round window's light), wavering a little
          vec2 wd2 = (vP.xz - uWarm2.xy)/max(uWarm2.z, 1.); float wl2 = length(wd2) + 0.07*sin(vP.x*0.9 + vP.z*0.6) + 0.05*sin(vP.z*1.7 - vP.x*0.8), ww2 = clamp(fwidth(wl2), 1e-3, 0.2);
          float wk2 = uWarm2.w*(1. - smoothstep(0.86 - ww2, 0.9 + ww2, wl2))*uMoonLit;
          ridgeC = mix(ridgeC, ridgeC*1.4 + uCapCol*0.09, bank*uMoonLit);
          ridgeC = ridgeC*(1. + 1.2*wk) + uLamp*0.15*wk;
          ridgeC = ridgeC*(1. + 1.5*wk2) + uLamp*0.2*wk2;
          ridgeC = ridgeC*(1. + 0.7*frnt) + uCapCol*0.03*frnt;
          snowC = mix(snowC, uCapCol*vec3(1., 0.93, 0.8)*0.94, 0.45*wk);
          snowC = mix(snowC, uCapCol*vec3(1., 0.9, 0.7)*0.94, 0.62*wk2);
          snowC = mix(snowC, capMax, 0.5*frnt);
          vec3 base = mix(ridgeC, min(snowC, capMax), cap);
          // SEVENTH ROUND: PASTE A SPOON HAS BEEN DRAGGED THROUGH (the tip, uTip 1). In the hollow the spoon's own drag marks
          // follow the scoop, a shade paler and cooler; along the outside each drag ridge is a pale crest beside a cooler
          // trough; within some 25 m the paste shows its pits and tooth. Tone steps only: no shading round the form.
          float th = smoothstep(0.4, 0.6, vHol);
          float tf = (vTipQ.y*(1. + 0.35*vTipQ.x*vTipQ.x) + 0.06*sin(vTipQ.x*5. + 1.))*2.9 + 0.12*vnoise(vTipQ.xy*9.), tw = clamp(fwidth(tf), 1e-3, 1.);
          float tmark = (1. - smoothstep(0.1, 0.13 + 1.5*tw, abs(fract(tf) - 0.5)))*(1. - smoothstep(0.3, 0.7, tw))*th;
          float tsh = (1. - smoothstep(0.0, 0.3, abs(fract(tf) - 0.24)))*(1. - smoothstep(0.3, 0.7, tw))*th;            // the shallow groove beside each mark
          float tcrest = smoothstep(0.3, 0.5, vTipQ.z)*(1. - th), ttrough = smoothstep(0.22, 0.42, -vTipQ.z)*(1. - th);
          float tnear = 1. - smoothstep(14., 34., dist);
          float pit = smoothstep(0.66, 0.74, vnoise(vP.xz*2.3 + vP.y*1.9))*tnear + 0.5*(vnoise(vP.xz*7. + vP.y*5.) - 0.5)*tnear*(1. - smoothstep(6., 20., dist));
          vec3 tipTone = mix(vec3(1.), mix(vec3(1.), vec3(1.12, 1.115, 1.1), tmark)*mix(vec3(1.), vec3(0.93, 0.95, 0.985), tsh)
                           *mix(vec3(1.), vec3(1.05, 1.045, 1.03), tcrest)*mix(vec3(1.), vec3(0.7, 0.78, 0.93), ttrough)*(1. - 0.1*pit), uTip);
          gl_FragColor = vec4(inJelly(base*tipTone*max(1. + uGrain*2.*g, 0.2)*mix(vec3(1.), vec3(0.58, 0.67, 0.84), hollow)*mix(vec3(1.), vec3(0.76, 0.83, 0.94), smoothstep(0.4, 0.6, vHol))*mix(vec3(1.), vec3(0.9, 0.918, 0.955), mar), vP, n, vEye), 1.);
        }`,
    });
  }

  /** THE MOONS (fifth round). Each is a round of the moon that always faces the eye, so it is never an egg: the lit part
   *  white paste (the lune, drawn analytically, crisp at any distance), the rest of the disc completed in clear jelly, a
   *  faintly paler round with a crisp edge, so that a gibbous is a disc with a shaded limb. Geometry: moonGeometry(). */
  function moonMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: U({ uPaste: { value: pal[5] }, uSlabC: { value: pal[3] }, uKeep: { value: 0.94 }, uEyeK: { value: 0.13 }, uRound: { value: 0.03 } }),
      vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
        attribute vec3 aCtr; attribute vec3 aMoon;        // aMoon: radius, lit fraction, the angle the lit limb faces
        varying vec2 vQ; varying vec3 vC; varying vec3 vEye; varying vec3 vMoon; varying vec3 vP;
        void main(){
          vEye = eyeLocal(); vec3 c = aCtr + wobble(aCtr);
          vec3 f = vEye - c; f /= max(length(f), 1e-3);
          vec3 r = cross(vec3(0., 1., 0.), f); r /= max(length(r), 1e-3);      // the eye is never straight above a moon
          vec3 up = cross(f, r);
          vQ = position.xy; vMoon = aMoon; vC = aCtr;
          vP = c + (r*position.x + up*position.y)*aMoon.x;
          gl_Position = projectionMatrix*modelViewMatrix*vec4(vP, 1.);
        }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}
        uniform vec3 uPaste, uSlabC; uniform float uRound;
        varying vec2 vQ; varying vec3 vC; varying vec3 vEye; varying vec3 vMoon; varying vec3 vP;
        void main(){
          if (vP.z < uBoxMin.z || vP.x > uBoxMax.x) discard;
          vec2 l = vec2(-cos(vMoon.z), sin(vMoon.z));
          float u = dot(vQ, l), v = dot(vQ, vec2(-l.y, l.x)), sd = (1. - 2.*vMoon.y)*sqrt(max(1. - v*v, 0.)) - u;
          float aa = clamp(fwidth(u) + fwidth(v), 1e-4, 0.2), lit = 1. - smoothstep(-aa, aa, sd);
          vec3 e = vEye - vC; vec3 n = e/max(length(e), 1e-4);
          vec2 m = vQ*vMoon.x;                                  // metres on the face: the nozzle's streaks, a fine tooth close to
          float fine = 1. - smoothstep(0.02, 0.12, aa);
          float g = (vnoise(vec2(m.x*0.5 + 3.*vMoon.y, (m.x - m.y)*0.9)) - 0.5)*(1. - smoothstep(0.004, 0.05, aa)) + 0.5*(vnoise(m*3.1) - 0.5)*fine;
          vec3 paste = inJelly(uPaste*(1. + 0.1*g - 0.05*smoothstep(-0.25, 0., sd)), vC, n, vEye);       // a breath of shade toward the terminator
          vec3 T = transmit(eyePath(vC, vEye));
          vec3 dark = toScene(mix(uInk*1.15, uSlabC, uRound)*mix(vec3(1.), T, 0.5) + uInk*0.3*(1. - T.b));
          gl_FragColor = vec4(mix(dark, paste, lit), 1.);
        }`,
    });
  }
  /** Geometry for moonMaterial: list = [{ c: [x, y, z], R, p, a }]; one fan of 64 per moon, all in one draw call. */
  function moonGeometry(list) {
    const K = 64, pos = [], ctr = [], mo = [], idx = [];
    list.forEach((m, i) => {
      const b = i * (K + 1);
      pos.push(0, 0, 0); ctr.push(...m.c); mo.push(m.R, m.p, m.a);
      for (let k = 0; k < K; k++) { const a = (k / K) * TAU; pos.push(cos(a), sin(a), 0); ctr.push(...m.c); mo.push(m.R, m.p, m.a); idx.push(b, b + 1 + k, b + 1 + ((k + 1) % K)); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCtr', new THREE.Float32BufferAttribute(ctr, 3));
    g.setAttribute('aMoon', new THREE.Float32BufferAttribute(mo, 3)); g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 580), 900);
    return g;
  }

  /** Gold leaf: instanced torn scraps, flat and matte, each with its own fixed tilt and tone. Use with leafGeometry(). */
  function leafMaterial(color) {
    return new THREE.ShaderMaterial({
      uniforms: U({ uAlbedo: { value: new THREE.Color(color ?? pal[6]) }, uKeep: { value: 0.78 }, uFar: { value: 1.7 } }), side: THREE.DoubleSide,
      vertexShader: /* glsl */`${STYLE_GLSL}${STYLE_VERT_GLSL}
        uniform vec3 uAlbedo; uniform float uPx, uFar;
        attribute vec3 aPos; attribute vec4 aQuat; attribute vec4 aData;      // aData: size m, tone, seed, 1 = a punched star (the figures)
        varying vec3 vCol; varying vec3 vUv; varying float vClip; varying float vSeed; varying float vStar;
        vec3 qrot(vec4 q, vec3 v){ return v + 2.*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
        void main(){
          vec3 eye = eyeLocal(); vec3 c = aPos;
          float dist = length(eye - c);
          float px = aData.x*uPx/max(dist, 0.5);                 // the scrap's size on screen, pixels
          float isStar = step(0.5, aData.w)*step(aData.w, 1.5), lying = step(1.5, aData.w);
          float lim = min(1., mix(0.024, 0.07, isStar)*uPx/max(px, 1e-3));      // and never a card against the lens: under a fortieth of the frame
          px *= lim;
          float grow = lim*max(1., 1.7/max(px, 1e-3));           // never thinner than about 1.5 px
          // torn outline: each rim corner at its own radius (position.z is the corner's number)
          float rr = mix(0.8 + 0.2*hash11(aData.z*91.7 + position.z*7.3), 1., isStar);
          vec3 l = vec3(position.xy*rr*aData.x*grow, 0.); l.x *= mix(mix(0.42, 1., hash11(aData.z*3.7)), 1., isStar);   // some are strips
          vec3 nrm = qrot(aQuat, vec3(0., 0., 1.));
          float faceOn = 1. - smoothstep(2., 7., px);                  // tiny scraps turn to face the eye so none is edge-on
          vec4 mv = modelViewMatrix*vec4(c + wobble(c), 1.);
          mv.xyz += mix(mat3(modelViewMatrix)*qrot(aQuat, l), l, faceOn);
          gl_Position = projectionMatrix*mv;
          if (dot(nrm, eye - c) < 0.) nrm = -nrm;
          // scraps too small to draw are not dimmed (a paving of dim specks would hide the ink): only their fair share
          // is drawn at all, each at full tone
          float cover = clamp(px/mix(uFar, 1.7, max(isStar, lying)), 0., 1.);      // (uFar: the loaf's hanging leaf gives way sooner with distance, so it never gathers into a swarm at the vanishing point)
          if (hash11(aData.z*5.31 + 0.7) > cover*cover + 0.02 || lying*step(px, 2.2) > 0.5) gl_Position = vec4(2., 2., 2., 1.);      // (leaf lying far off is not drawn at all: a field of specks read as dirt)
          // leaf lying in a furrow glints as we pass over it: each scrap catches the light for a moment, slowly, never a flash
          float gl = sin(uTime*(0.5 + 0.6*hash11(aData.z*2.9)) + aData.z*6.3 + dot(eye.xz, vec2(0.11, 0.07))); gl = max(gl, 0.); gl *= gl; gl *= gl;
          // EIGHTH ROUND: leaf is never whiter than the moon: its tone stops a shade under the paste's cream (silver stays grey silver)
          vec3 la = uAlbedo*aData.y*(1. + 0.55*lying*gl); la *= min(1., 0.62/max(dot(la, vec3(0.3, 0.55, 0.15)), 1e-3));
          vCol = inJelly(la, c, nrm, eye);
          vUv = vec3(position.xy*rr, px); vClip = min(c.z - uBoxMin.z, uBoxMax.x - c.x); vSeed = aData.z; vStar = isStar;
        }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}
        varying vec3 vCol; varying vec3 vUv; varying float vClip; varying float vSeed; varying float vStar;
        void main(){
          if (vClip < 0.) discard;
          float px = vUv.z, big = smoothstep(4., 12., px);
          // close to, the tear shows: a ragged edge and the leaf's faint beaten wrinkles
          float sd = vSeed, th = atan(vUv.y, vUv.x + 1e-5);
          float rad = 0.36 + 0.3*vnoise(vec2(th*1.1 + sd, sd)) + 0.1*vnoise(vec2(th*4.3 - sd, sd + 3.));
          float c2 = cos(2.*th), star = 0.76/pow(pow(abs(cos(th)) + 1e-3, 0.55) + pow(abs(sin(th)) + 1e-3, 0.55), 1.818);        // the figures' stars are punched from the leaf: four points
          if (length(vUv.xy) > mix(mix(1.2, rad, big), mix(0.5, star, smoothstep(3., 8., px)), step(0.5, vStar))) discard;
          float wr = (vnoise(vec2(vUv.x*9. + vUv.y*3., vUv.y*1.3) + sd) - 0.5)*0.2*big;
          // EIGHTH ROUND: a scrap is two tones: its body, and a paler edge where the torn leaf curls up (one side of it)
          float ca = sd*6.283, curl = smoothstep(0.02, 0.12, dot(vUv.xy, vec2(cos(ca), sin(ca))) - 0.1 - 0.12*vnoise(vec2(th*2.3 + sd, 2.)))*big*(1. - step(0.5, vStar));
          gl_FragColor = vec4(vCol*(1. + wr)*mix(1., mix(0.8, 1.2, curl), big*(1. - step(0.5, vStar))), 1.);
        }`,
    });
  }
  /** Geometry for leafMaterial: n scraps; fill(i, out) writes out.pos[3], out.size, out.tone for scrap i (rng is ctx.rng). */
  function leafGeometry(n, rng, fill) {
    const g = new THREE.InstancedBufferGeometry();
    const pv = [];                                   // a pentagon of three triangles; z is the corner's number
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; pv.push(cos(a), sin(a), i + 1); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3));
    g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
    const aPos = new Float32Array(n * 3), aQuat = new Float32Array(n * 4), aData = new Float32Array(n * 4);
    const o2 = { pos: [0, 0, 0], size: 1, tone: 1 };
    for (let i = 0; i < n; i++) {
      fill(i, o2);
      const i3 = i * 3, i4 = i * 4;
      aPos[i3] = o2.pos[0]; aPos[i3 + 1] = o2.pos[1]; aPos[i3 + 2] = o2.pos[2];
      // a random fixed tilt: uniform quaternion
      const u1 = rng(), u2 = rng() * TAU, u3 = rng() * TAU, a = sqrt(1 - u1), b = sqrt(u1);
      aQuat[i4] = a * sin(u2); aQuat[i4 + 1] = a * cos(u2); aQuat[i4 + 2] = b * sin(u3); aQuat[i4 + 3] = b * cos(u3);
      aData[i4] = o2.size; aData[i4 + 1] = o2.tone; aData[i4 + 2] = rng() * 100;
    }
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 3));
    g.setAttribute('aQuat', new THREE.InstancedBufferAttribute(aQuat, 4));
    g.setAttribute('aData', new THREE.InstancedBufferAttribute(aData, 4));
    g.instanceCount = n;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 580), 700);
    return g;
  }

  /** Unit box (0..1) that the hull and skin shaders stretch over uBoxMin..uBoxMax, so a cut only moves a uniform. */
  function boxGeometry(segZ = 96) { const g = new THREE.BoxGeometry(1, 1, 1, 4, 4, segZ); g.translate(0.5, 0.5, 0.5);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 580), 900); return g; }
  const BOX_VS = (shiver) => /* glsl */`${VS_HEAD}
    void main(){ vP = mix(uBoxMin, uBoxMax, position); vN = normal; vEye = eyeLocal();
      vec3 p = vP + wobble(vP); p.y = max(p.y, uBoxMin.y + 0.08);        // clear of the board
      ${shiver ? 'p += normal*0.05*sin(vP.z*0.19 + vP.y*0.23 + vP.x*0.17 + uTime*2.3)*(1. - step(vP.y, uBoxMin.y + 0.01));' : ''}
      gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); }`;

  /** The agar itself: the box drawn from its far side (BackSide, opaque, drawn first). Each pixel is what lies beyond
   *  that wall seen through the tinted metres between it and the eye; the far face carries the exit disc. */
  function hullMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: U({ uDiscGain: { value: 1.1 }, uFloor: uniforms.uFloor, uFarDim: { value: 0.04 }, uBand: { value: 1 }, uWinAt: { value: new THREE.Vector4(-430, 97, 760, 2.1) }, uSky: { value: 0 } }), side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
      vertexShader: BOX_VS(false),
      fragmentShader: /* glsl */`${FS_HEAD}
        uniform float uDiscGain, uFloor, uFarDim, uBand;
        // SIXTH ROUND: THE ROOM SEEN FROM WITHIN. Where a wall is looked through (the look out through the pass in the port
        // range; the fresh wall of the long cut) what lies beyond it is the room itself, found by the ray: the cypress board
        // under the lamp with its seams and the lamp's long streak, the knife lying beside the loaf (bright steel, a dark
        // handle), the paper lantern with its dark frame, the dark of the room above. Display colours; the agar between
        // tints them like everything else.
        uniform vec3 uLampPos, uSteelC, uBowl; uniform vec4 uLampK, uWin, uKnife, uWinAt; uniform float uSky;
        vec3 roomAt(vec3 ro, vec3 d){
          vec3 col = mix(uRoomLow, uRoomHi, smoothstep(-0.02, 0.5, d.y));
          vec3 lv0 = uLampPos - ro; lv0 /= max(length(lv0), 1e-3);
          float gl = max(dot(d, lv0), 0.); gl *= gl; gl *= gl; gl *= gl;
          col += uLamp*uLampK.w*0.1*gl;                                     // the lamp's glow hangs in the room's air
          float tB = 1e6;
          vec3 pB = ro + d*(ro.y/max(-d.y, 0.004));                        // (derivatives are taken outside the branch)
          float aq = clamp(max(fwidth(pB.x), fwidth(pB.z)), 0.05, 6.);
          if (d.y < -0.004) {
            tB = ro.y/(-d.y); vec3 p = ro + d*tB;
            vec3 Lv = uLampPos - p; float dl = max(length(Lv), 1e-3);
            float I = uLampK.x*uLampK.w/(1. + dl*dl/(uLampK.y*uLampK.y));
            float fx = fract((p.x + 20.)/40.)*40., seam = (1. - smoothstep(0.25 + aq, 0.6 + 2.*aq, min(fx, 40. - fx)))*min(1., 0.6/aq + 0.3);
            float grain = vnoise(vec2(p.x*0.42, p.z*0.012))*(1. - smoothstep(0.5, 2.5, aq));
            vec3 b = uBoard*(1. + 0.14*(grain - 0.5))*(1. + 0.2*(hash11(floor((p.x + 20.)/40.)*3.7 + 1.) - 0.5))*(1. - 0.42*seam)*(uLamp*I + uRoomLow*uLampK.z);      // each plank its own tone
            float sp = max(dot(reflect(d, vec3(0., 1., 0.)), Lv/dl), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
            b += uLamp*uLampK.w*0.34*sp;                                   // the lamp lies along the polished wood
            // the knife: q.x along the blade from the heel, q.y from the spine to the edge
            vec2 k = p.xz - uKnife.xy; float ca = cos(uKnife.z), sa = sin(uKnife.z);
            vec2 q = vec2(k.x*sa + k.y*ca, -k.x*ca + k.y*sa);
            float tt = max(q.x - 112., 0.)/58., w = 26.*sqrt(max(1. - tt*tt, 0.));
            float blade = smoothstep(-aq, aq, q.x)*(1. - smoothstep(170. - aq, 170. + aq, q.x))*smoothstep(-aq, aq, q.y)*(1. - smoothstep(w - aq, w + aq, q.y));
            float bandX = (q.x - 70. - 22.*sin(uTime*0.23))/34.;
            vec3 steel = uSteelC*(0.34 + 0.2*smoothstep(0.5, 0.62, q.y/max(w, 1.)) + 0.5*smoothstep(0.86, 0.94, q.y/max(w, 1.)))*(0.5 + 0.9*I)
                       + vec3(1., 0.93, 0.8)*uLampK.w*(0.75*exp(-bandX*bandX) + 0.12);
            float handle = smoothstep(-76. - aq, -76. + aq, q.x)*(1. - smoothstep(-aq, aq, q.x))*(1. - smoothstep(7. - aq, 7. + aq, abs(q.y - 9.)));
            vec3 wood = mix(vec3(0.16, 0.085, 0.05)*1.2, vec3(0.72, 0.66, 0.55), smoothstep(-9., -8., q.x))*(uLamp*I*1.5 + uRoomLow);
            b = mix(mix(b, wood, handle*uKnife.w), steel, blade*uKnife.w);
            // spilled sugar on the board: a few clear grains the size of boulders, each a pale lozenge with one bright edge
            vec2 sgc = floor(p.xz/70.), sgq = p.xz - (sgc + 0.5 + (vec2(hash21(sgc + 3.3), hash21(sgc + 9.1)) - 0.5)*0.6)*70.;
            float sga = hash21(sgc + 5.7)*3.1, sgs = 3. + 5.*hash21(sgc + 1.9); sgq = vec2(sgq.x*cos(sga) - sgq.y*sin(sga), sgq.x*sin(sga) + sgq.y*cos(sga));
            float sgd = max(abs(sgq.x), abs(sgq.y)) - sgs, sgk = step(0.55, hash21(sgc + 7.7))*(1. - smoothstep(-aq, aq, sgd))*step(34., p.x);
            b = mix(b, b*1.25 + uLamp*I*(0.1 + 0.4*smoothstep(-1.2 - aq, -0.2, sgd)), sgk);
            col = mix(b, uRoomLow*0.8, smoothstep(500., 2600., tB));
          }
          // the tea bowl, far off on the board to starboard: a dark turned shape, the lamp down its near side (the long cut's wall)
          { vec2 bo = uBowl.xy - ro.xz; float dh = max(length(d.xz), 1e-3); vec2 dn = d.xz/dh;
            float ta = dot(bo, dn), rs = bo.x*dn.y - bo.y*dn.x, tt3 = ta/dh, yb = ro.y + d.y*tt3;
            float rad = mix(92., 236., smoothstep(8., 204., yb)), sa3 = 0.5 + 0.004*max(tt3, 0.);
            float inb = (1. - smoothstep(rad - sa3, rad + sa3, abs(rs)))*smoothstep(-sa3, sa3, yb)*(1. - smoothstep(206. - sa3, 206. + sa3, yb))*step(0., ta)*step(tt3, tB)*uBowl.z;
            vec2 n2 = (-dn*sqrt(max(rad*rad - rs*rs, 0.)) + vec2(dn.y, -dn.x)*rs)/max(rad, 1.);
            vec2 lb = uLampPos.xz - uBowl.xy; lb /= max(length(lb), 1e-3);
            float lit = clamp(dot(n2, lb)*0.6 + 0.4, 0., 1.), rim3 = smoothstep(196., 204., yb);
            vec3 bowl = vec3(0.3, 0.215, 0.15)*(uLamp*1.5*lit*lit + uRoomLow*0.7) + uLamp*0.12*lit*lit*lit*lit*lit*lit + vec3(0.35, 0.23, 0.14)*uLamp*rim3*0.5;
            col = mix(col, bowl, inb); }
          // the lantern: paper lit from within, a dark wooden frame (posts, rails, one mullion on each side)
          vec3 bc = vec3(uLampPos.x, 172., uLampPos.z), bh = vec3(82., 172., 82.);
          vec3 dd = d + vec3(1e-5)*(step(0., d)*2. - 1.);
          vec3 t1 = (bc - bh - ro)/dd, t2 = (bc + bh - ro)/dd, tmn = min(t1, t2), tmx = max(t1, t2);
          float tn = max(max(tmn.x, tmn.y), tmn.z), tf = min(min(tmx.x, tmx.y), tmx.z);
          if (tn < tf && tn > 0. && tn < tB) {
            vec3 p = ro + d*tn, l = (p - bc)/bh;
            float uu = abs(l.x) > abs(l.z) ? l.z : l.x, sa2 = 0.022 + 0.00006*tn;
            float post = smoothstep(0.86 - sa2, 0.86 + sa2, abs(uu)) + (1. - smoothstep(0.03 - sa2, 0.03 + sa2, abs(uu)));
            float sy = sa2*82.;
            float rail = (1. - smoothstep(2.5 - sy, 2.5 + sy, abs(p.y - 134.))) + (1. - smoothstep(2.5 - sy, 2.5 + sy, abs(p.y - 232.))) + (1. - smoothstep(42. - sy, 42. + sy, p.y)) + smoothstep(324. - sy, 324. + sy, p.y);
            float h = (p.y - uLampPos.y)/120., fib = vnoise(vec2((p.x + p.z)*0.05, p.y*0.9));
            vec3 paper = uLamp*uLampK.w*(0.8 + 0.7*exp(-h*h))*(0.95 + 0.1*fib);
            col = mix(col, mix(paper, vec3(0.05, 0.032, 0.02), clamp(post + rail, 0., 1.)), max(smoothstep(34., 40., p.y), smoothstep(0.84, 0.88, abs(uu))));      // open between its feet
          }
          return col; }

        void main(){
          vec3 e = vP - vEye; float L = length(e); vec3 d = e/max(L, 1e-4);
          float m = eyePath(vP, vEye), px = max(fwidth(vP.x), fwidth(vP.z));
          // the look out: a reach of the port wall (over the pass in the range) is looked through; the long cut's fresh wall too
          float inL = smoothstep(0., 30., vEye.z - uBoxMin.z);
          // EIGHTH ROUND: THE LOOK OUT IS A WINDOW. One round of clear jelly in the port wall (uWin: its z, y, strength, radius),
          // a pale rim line round it; the thick jelly is a lens, so the room stands in it whole and small: the lantern, the
          // lamp-lit board, the knife (the sight line is turned toward uWinAt and its field widened by uWinAt.w)
          float wr = length(vP.zy - uWin.xy), wa = max(fwidth(wr), 1e-3), onPort = step(vN.x, -0.5)*inL*uWin.z;
          onPort *= smoothstep(0.43, 0.6, abs(d.x));          // looked along, the wall is a mirror: the window is seen as we come abreast of it
          float win = onPort*(1. - smoothstep(uWin.w - wa, uWin.w + wa, wr));
          float wrim = onPort*onPort*(1. - smoothstep(0.07 + 0.5*wa, 0.12 + 1.3*wa, abs(wr - uWin.w)));
          float cutW = step(0.5, vN.x)*step(0., uSide.x)*inL*(1. - smoothstep(790., 900., vP.z));      // eighth round: toward the far end the fresh wall is the night's own ink again
          vec3 dw = d + 0.006*vec3(sin(vP.z*0.19 + uTime*1.1 + 2.*sin(vP.y*0.13 - uTime*0.6)), sin(vP.y*0.23 - uTime*0.9 + 2.*sin(vP.z*0.11 + uTime*0.5)), 0.); dw /= max(length(dw), 1e-4);
          // SEVENTH ROUND: through the long cut's fresh wall the thick jelly bends every sight line outward and down, so the
          // lamp-lit board lies over the lower half of the wall with its seams and grain, running back to a soft horizon
          vec3 dc = mix(dw, d + (dw - d)*0.3, cutW) + vec3(0.6, -0.16, 0.)*cutW;
          // eighth round: and by its height: the wall's lower third always looks down on the lamp-lit board (its seams, its grain,
          // the lamp's streak), the rest out across the room, wherever the eye stands
          dc.y = mix(dc.y, mix(-0.55, 0.2, smoothstep(26., 96., vP.y)), 0.85*cutW); dc /= max(length(dc), 1e-4);
          if (win > 0.001) { vec3 wc = vec3(uBoxMin.x, uWin.y, uWin.x), ax = wc - vEye, tg = uWinAt.xyz - wc; ax /= max(length(ax), 1e-3); tg /= max(length(tg), 1e-3);
            dc = tg + (dw - ax)*uWinAt.w; dc /= max(length(dc), 1e-4); }
          vec3 room = (win + cutW > 0.001) ? roomAt(vP, dc) : vec3(0.);
          // THE NIGHT LASTS. Agar is about n 1.34: a side wall or the top met at more than some 48 degrees from its normal is
          // a mirror (total internal reflection, as in a glass rod), and what it shows is the length of the loaf, wherever the
          // eye stands, outside looking in through the cut face or inside. So looking down the loaf nearly every wall is ink;
          // the room shows only where a wall is seen nearly square on (the outer edge of the frame) and in the colourless
          // top 10 m of each side wall, the night's horizon glow: two pale lines running to the vanishing point.
          float c = abs(dot(d, vN)), wM = 0., wB = 0., mm = m, rrM = 1e4, yF = vP.y;
          float hF = uDawn.z*smoothstep(uDawn.x, uDawn.y, uBoxMax.z);      // the dawn layer's height at the far face
          if (d.z > 0.02 && vN.z < 0.5 && vN.z > -0.5 && vN.y > -0.5) {
            float zs = max(vEye.z, uBoxMin.z);
            vec2 q = vEye.xy + d.xy*((zs - vEye.z)/d.z);          // where the sight line enters the loaf (inside: the eye itself)
            if (q.x > uBoxMin.x && q.x < uBoxMax.x && q.y > uBoxMin.y && q.y < uBoxMax.y) {
              float inK = smoothstep(0., 30., vEye.z - uBoxMin.z);                       // from outside the wet face bends every sight line toward the axis
              wM = 1. - smoothstep(0.6, 0.8, c/mix(1.34, 1., inK));
              float fe = smoothstep(uBoxMax.z - 270., uBoxMax.z - 140., vP.z);
              if (vN.x > 0.5 && uSide.x >= 0.) wM *= mix(1., 0.3, 1. - smoothstep(790., 900., vP.z));                               // the long cut: a fresh wall, the room floods in
              wM = max(wM, fe);        // the far end stands against something: no glow beside it
              wM *= 1. - smoothstep(uBoxMax.y - 9., uBoxMax.y - 1.5, q.y);              // from outside, the top of the cut face lets the room in
              yF = vEye.y + d.y*((uBoxMax.z - vEye.z)/d.z); yF = yF > uBoxMax.y ? uBoxMax.y + 100. : max(yF, uBoxMin.y);   // off the top: the night
              mm = (uBoxMax.z - zs)/d.z*rhoSeg(q.y, min(yF, uBoxMax.y), zs, uBoxMax.z)*(1. - coreClear(vP, vEye));
              if (abs(vN.x) > 0.5) wB = smoothstep(uBoxMax.y - 7., uBoxMax.y - 1., vP.y)*uBand*(1. - fe)*smoothstep(-4., 10., vEye.z - uBoxMin.z);
              rrM = length(vEye.xy + d.xy*((uBoxMax.z - vEye.z)/d.z) - uCore.xy);       // where the mirrored line meets the far end, unfolded
            }
          }
          vec3 behind = domeAt(d), farDark = uInk*1.5 + uDayLow*uFarDim;
          // OPEN SKY: from within, the room beyond the walls is dark, so the sides fall to indigo-black and only the leaf shows
          behind = mix(behind, uInk*0.5, 0.95*smoothstep(0., 30., vEye.z - uBoxMin.z));
          behind = mix(behind, room, max(win, cutW)); wM *= 1. - max(win, 0.6*cutW);
          m = mix(m, min(m, 20.), win);                          // the pane we look out through is thin: the lantern stays warm
          // the skin shivers, so the glow of the walls swims a little
          behind *= 1. + 0.035*sin(vP.z*0.11 + vP.y*0.2 + uTime*1.7 + 2.*sin(vP.y*0.07 - uTime*0.6));
          float gain = 0.;
          if (vN.y < -0.5 && uFloor > 0.5) {                     // the floor: the board, lit only through the jelly
            float grain = vnoise(vec2(vP.x*0.9, vP.z*0.03))*(1. - smoothstep(0.1, 0.5, px));
            behind = uRoomBoard*0.7*(0.94 + 0.08*grain)*transmit(lightPath(vP + vec3(0., 0.5, 0.), vec3(0., 1., 0.))*0.5);
          } else if (vN.y > 0.5) {                               // a few bubbles trapped under the top
            vec2 g = vP.xz/7., id = floor(g); vec2 c = (vec2(hash21(id), hash21(id + 7.3)) - 0.5)*0.6;
            float r = length(fract(g) - 0.5 - c)*7., R = 0.25 + 0.7*hash21(id + 3.1);
            float has = step(0.62, hash21(id + 11.7))*(1. - smoothstep(0.08, 0.3, px));
            behind *= 1. + has*(0.35*(1. - smoothstep(0., 0.22, abs(r - R))) - 0.12*(1. - smoothstep(R - 0.1, R, r)));
          } else if (vN.z > 0.5) {                               // the far face: the full moon is a disc of plain daylight
            float rr = length(vP.xy - uCore.xy);
            float disc = 1. - smoothstep(uCore.z - 0.2, uCore.z + 0.05, rr);
            // the far end stands against something dark; the disc's daylight spills a little way into the jelly round it
            behind = mix(uDayLow, farDark + uDayLow*0.22*exp(-max(rr - uCore.z, 0.)/14.) + uDayLow*uSky*(0.2*exp(-max(rr - 26., 0.)/7.) + 0.1*(1. - smoothstep(0.3, 0.6 + 2.*px, abs(rr - 33.)))), smoothstep(hF - 5.5, hF - 2.5, vP.y + 100.*step(hF, 1.))); gain = disc;      // eighth round: a soft halo round the full moon, and one thin ring      // sixth round: the dawn is a band with a decided upper edge
          }
          float wsh = washAt(vP.z);
          vec3 T = transmit(m*(1. - 0.32*wsh));
          vec3 disp = behind*T + uInk*(1. - T.b);
          // 10h (N1): THE LOAF'S END IS A BLOCK OF JELLY, NOT A PANE. Looked into aslant through the cut face, the far side wall
          // near the end was seen across a thin wedge of the loaf with the room standing in it under a flat tint: a see-through
          // sheet over that side of the view. But a side wall met from within is a mirror (the rule above: agar's total internal
          // reflection), and near the fresh face what it mirrors is jelly that holds the lamp's light, as a slice does: the
          // loaf's own body across to the other wall. So there the wall is the colour of the tinted metres to it and the loaf's
          // whole width beyond (paler in the colourless top): a deep blue band, deepening to ink with the way to it. The light
          // comes in by the fresh face: the first slab's length of the loaf holds it and it is gone a slab further in (measures
          // of the place, the same from anywhere).
          if (abs(vN.x) > 0.5) { vec3 Tw = transmit((m + (uBoxMax.x - uBoxMin.x)*rhoAt(vP.y)*uEyeK)*(1. - 0.32*wsh));
            disp = mix(disp, uDay*Tw + uInk*(1. - Tw.b), 0.95*(1. - smoothstep(${LOAF.slab.toFixed(1)}, ${(2 * LOAF.slab).toFixed(1)}, vP.z - uBoxMin.z))*(1. - max(win, cutW))); }
          disp += win*0.12*uDay*transmit(36.);                    // the pane has a body: the pale blue of a slice laid over the room
          if (gain > 0.) {                                       // the clear core is a light pipe: its daylight comes down the shaft
            vec3 Td = transmit(min(m, 5. + 0.035*m));
            disp = mix(disp + uInk*1.4*wsh, uDay*Td + uInk*(1. - Td.b), gain);
          } else if (vN.z > 0.5) disp += uInk*1.4*wsh;
          if (wM > 0.) {                                         // the mirror: the far end of the loaf through the whole length of it
            vec3 Tm = transmit(mm*(1. - 0.32*wsh));
            float bn = max(abs(d.x)/max(d.z, 1e-3)*(uBoxMax.z - max(vEye.z, uBoxMin.z)) - (d.x > 0. ? uBoxMax.x - vEye.x : vEye.x - uBoxMin.x), 0.)/120.;   // bounces off the side walls on the way
            vec3 farEnd = mix(uDayLow*exp(-0.55*bn), farDark + uDayLow*0.22*exp(-max(rrM - uCore.z, 0.)/14.), smoothstep(hF - 5.5, hF - 2.5, yF + 100.*step(hF, 1.)));
            disp = mix(disp, farEnd*Tm + uInk*(1. - Tm.b) + uInk*1.4*wsh, wM);      // the pale wash lifts the ink as it passes
          }
          if (wB > 0.) { vec3 Tb = transmit(13. + 0.075*L); disp = mix(disp, uDay*Tb + uInk*(1. - Tb.b), wB); }
          float aa2 = max(max(fwidth(vP.z), fwidth(vP.y)), 1e-3);
          float wm1 = onPort*(1. - smoothstep(-wa, wa, abs(wr - (uWin.w - 0.6)) - 0.6)), wm2 = onPort*(1. - smoothstep(-wa, wa, abs(wr - (uWin.w - 1.9)) - 0.7));
          disp = mix(disp, disp*0.5 + uInk*1.1 + uDay*vec3(0.09, 0.16, 0.34), 0.8*wm2);      // ninth round: no grey band: the thick clear jelly's meniscus, paler inside,
          disp = mix(disp, uInk*2.4 + uDay*vec3(0.035, 0.07, 0.19), 0.85*wm1);                // deeper at the edge,
          disp = mix(disp, uDay*0.8 + uInk, 0.9*wrim);                                        // and one thin pale wet line
          // EIGHTH ROUND: THE SKY IS RICH. Far off in the depth of the jelly, by direction only (so it lies behind every subject and
          // never against the lens): a milky band of sugar dust slanting across the night, two star clouds, long flat strata
          // of agar low over the ranges with a paler upper edge, a comet of leaf with its tail. Flat pale tones; specks never
          // under a pixel and a half.
          float skyK = uSky*inL*(1. - max(win, cutW))*step(-0.5, vN.y)*smoothstep(0.035, 0.16, d.y), ad = max(length(fwidth(d)), 1e-4);
          if (skyK > 0.001) {
            float az = atan(d.x, abs(d.z) + 1e-4), el = d.y;
            float bb = dot(d, vec3(0.52, 0.6, -0.61)) - 0.12 + 0.05*vnoise(vec2(az*3., el*3.));
            float band = exp(-bb*bb/0.012)*(0.45 + 0.9*vnoise(vec2(az*7. + 3., el*9.)))*(1. - 0.6*smoothstep(0.5, 0.7, vnoise(vec2(az*4. + 9., el*14.))));
            vec3 c1 = vec3(-0.5, 0.52, 0.69), c2 = vec3(0.62, 0.42, 0.66);
            float cl = exp(-dot(d - c1, d - c1)/0.02) + 0.8*exp(-dot(d - c2, d - c2)/0.012);
            vec2 sg = vec2(az, el)*46., sid = floor(sg); vec2 sq = fract(sg) - 0.5 - (vec2(hash21(sid + 1.3), hash21(sid + 7.9)) - 0.5)*0.7;
            float sh = hash21(sid + 3.3), sr = max(0.03 + 0.08*sh*sh, 0.8*ad*46.);
            float star = step(1. - 0.055 - 0.5*clamp(band + cl, 0., 1.), hash21(sid + 5.5))*(1. - smoothstep(sr*0.6, sr*1.2, length(sq)))*min(1., (0.03 + 0.08*sh*sh)/sr + 0.35);
            // four long flat clouds of agar low over the ranges, each a lens with a ragged belly and a paler moonlit top
            float strata = 0., sedge = 0., sw = clamp(ad/0.02, 0.03, 0.6);
            for (int i = 0; i < 4; i++) { float fi = float(i);
              vec2 sc = vec2(-1.25 + 0.8*fi + 0.22*sin(fi*2.7 + 1.) + 0.004*uTime, 0.215 + 0.04*sin(fi*1.9 + 1.));
              vec2 s2 = (vec2(az, el) - sc)/vec2(0.15 + 0.05*sin(fi*3.1), 0.026 + 0.007*cos(fi*2.3));
              s2.y *= s2.y < 0. ? 2.4 : 1.;                                             // a flat belly
              float sdl = dot(s2, s2) - 0.28*(0.5 + 0.5*sin(s2.x*7. + fi*2.))*step(0., s2.y)*(1. - s2.x*s2.x), inC = 1. - smoothstep(1. - sw, 1. + sw, sdl);      // a heaped top
              strata = max(strata, inC); sedge = max(sedge, inC*smoothstep(0.1, 0.1 + sw, s2.y - 0.15*sin(s2.x*5. + fi))); }
            vec3 cd = vec3(0.6 - 0.02*sin(uTime*0.05), 0.58, 0.55); cd /= length(cd); vec3 ct = vec3(0.5, 0.42, -0.2); ct /= length(ct);      // the comet: its head, and the way its tail streams
            vec3 cv = d - cd; float ca = dot(cv, ct), cp = length(cv - ct*ca);
            float comet = smoothstep(0., 0.02, ca)*(1. - smoothstep(0.05, 0.3, ca))*(1. - smoothstep(0.3, 1., cp/(0.006 + 0.07*max(ca, 0.) + ad))) + (1. - smoothstep(0.012, 0.016 + ad, length(cv)));
            float dust = 0.55*smoothstep(0.4, 0.46, band) + 0.45*smoothstep(0.8, 0.87, band);      // (tenth round: the two star clouds are crowds of stars only: their flat dust lay over the ranges as two faint discs)      // sugar dust: flat pale tones, an edge where it thins
            vec3 sky = uDay*transmit(62.)*0.11*min(dust, 1.2) + mix(uDay, uDayLow, 0.5)*0.55*star + uDay*(0.3*transmit(75.)*strata*(1. - sedge) + 0.42*transmit(48.)*sedge) + vec3(0.96, 0.93, 0.84)*0.5*comet;
            disp += sky*skyK*(1. - 0.6*wM*step(d.y, 0.1));
          }
          if (cutW > 0.001) {
            // THE FRESH WET FACE OF THE LONG CUT, seen from within: the lamp's reflection swims on it, beads stand on it and one
            // drop runs down, and the ridge's cut edge is a clean pale line along its foot
            vec3 lw = uLampPos - vP; lw /= max(length(lw), 1e-3);
            vec3 nw = vec3(1., 0.035*sin(vP.z*0.17 + uTime*1.3 + 2.*sin(vP.y*0.13 + uTime*0.7)), 0.035*sin(vP.y*0.21 - uTime*1.1 + 2.*sin(vP.z*0.09 - uTime*0.5))); nw /= length(nw);
            float rs = max(dot(reflect(d, nw), lw), 0.); float r4 = rs*rs; r4 *= r4; float r16 = r4*r4; r16 *= r16;
            vec3 wet = uLamp*uLampK.w*(0.012*r4 + 0.5*r16*r16);      // (eighth round: no broad khaki haze; the lamp is its streak and one small bright image)
            // the lamp lies on the wet face as one long pale streak, standing the height of the wall and broken by its ripple
            float zs = vEye.z + 44. + 5.*sin(vP.y*0.21 + uTime*0.8 + 2.*sin(vP.y*0.07 - uTime*0.45)) + 2.*sin(vP.y*0.9 - uTime*1.3);      // (it goes with the eye, as a reflection does)
            float sq = (vP.z - zs)/(3.2 + 0.05*(vP.y - uBoxMin.y)), st = exp(-sq*sq);
            wet += uLamp*uLampK.w*st*(0.3 + 0.12*sin(vP.y*0.8 + uTime*1.1))*smoothstep(0., 10., vP.y - ridgeH(uBoxMax.x - 0.3, vP.z))*(1. - smoothstep(uBoxMax.y - 14., uBoxMax.y - 2., vP.y));
            vec2 bg = vP.zy/5.6, bid = floor(bg); vec2 bq = (fract(bg) - 0.5 - (vec2(hash21(bid + 2.2), hash21(bid + 8.8)) - 0.5)*0.7)*5.6;
            float br = 0.3 + 0.5*hash21(bid + 4.4);
            float bead = step(0.7, hash21(bid + 6.6))*(1. - smoothstep(br - aa2, br + aa2, length(bq*vec2(1., 0.85))))*(1. - smoothstep(0.3, 1.1, aa2));
            float dz0 = vEye.z + 20. + 22.*hash11(floor(uTime/11.)), dy = uBoxMax.y - 4. - mod(uTime, 11.)*6.5;
            float trail = (1. - smoothstep(0.1 + aa2, 0.2 + 2.*aa2, abs(vP.z - dz0 - 0.2*sin(vP.y*0.9))))*step(dy, vP.y)*step(vP.y, uBoxMax.y - 4.);
            float drop = 1. - smoothstep(0.45, 0.6 + aa2, length((vP.zy - vec2(dz0 + 0.2*sin(dy*0.9), dy))*vec2(1., 0.7)));
            float foot = 1. - smoothstep(0.25 + aa2, 0.5 + 2.*aa2, abs(vP.y - ridgeH(uBoxMax.x - 0.3, vP.z) - 0.45));
            float skinTop = 1. - smoothstep(0.2 + aa2, 0.45 + 2.*aa2, uBoxMax.y - vP.y);
            disp += wet*(1. + 0.5*bead)*cutW;
            disp = mix(disp, vec3(0.82, 0.88, 0.95)*mix(T, vec3(1.), 0.4), cutW*clamp(0.55*bead + 0.3*trail + 0.7*drop + 0.8*max(foot, skinTop), 0., 1.)*smoothstep(0.03, 0.25, T.g));
          }
          vec3 col = toScene(disp);
          gl_FragColor = vec4(col*(1. + gain*(uDiscGain - 1.)*exp(-m*0.02)), 1.);
        }`,
    });
  }

  /** The wet skin: the same box from outside (FrontSide, transparent, drawn last). Mirrors the dome by fresnel, and on
   *  the cut face draws the section of every extrusion analytically from the picture functions, with drag lines,
   *  beads and one running drop. */
  function skinMaterial(p = {}) {
    return new THREE.ShaderMaterial({
      uniforms: U({ ...(p.moonOv ? { uMoonOv: { value: p.moonOv } } : {}), uPaste: { value: pal[5] }, uDark: { value: pal[4] }, uGold: { value: pal[6] }, uSheen: { value: o.sheen ?? 0.05 }, uHaze: { value: o.haze ?? 0 }, uRoundF: { value: p.round ?? 0.13 }, uFilm: { value: p.film ?? 0 }, uSlab: { value: p.slab ?? 0 }, uSlabC: { value: pal[3] } }),   // uHaze: a thin slab's wet faces carry a little of the room
      side: THREE.FrontSide, transparent: true, depthWrite: false,
      vertexShader: BOX_VS(true),
      fragmentShader: /* glsl */`${FS_HEAD}
        uniform vec3 uPaste, uDark, uGold, uSlabC; uniform float uSheen, uHaze, uRoundF, uFilm, uSlab;
        void main(){
          vec3 e = vP - vEye; float L = length(e); vec3 d = e/max(L, 1e-4);
          vec3 n = vN; float film = 0., rimL = 0.;
          vec2 uv = abs(n.x) > 0.5 ? vP.zy : (abs(n.y) > 0.5 ? vP.xz : vP.xy);
          float aa = max(max(fwidth(uv.x), fwidth(uv.y)), 1e-4);          // metres per pixel on this face
          vec3 aq = max(fwidth(vP), vec3(1e-4));                           // (10h) and along each of the block's own axes: a wet line is measured across itself
          float t = uTime;
          vec2 rip = vec2(sin(uv.x*0.21 + t*1.3 + 2.*sin(uv.y*0.13 + t*0.7)), sin(uv.y*0.17 - t*1.1 + 2.*sin(uv.x*0.11 - t*0.5)));
          float sway = waveAt(vP.z)*0.03;
          vec3 n2 = n + (vec3(rip.x, rip.y, rip.y - rip.x)*0.03 + sway)*(1. - abs(n)); n2 /= max(length(n2), 1e-4);
          float c = clamp(dot(-d, n2), 0., 1.), f1 = 1. - c;
          float F = 0.004 + 0.996*f1*f1*f1*f1*f1;          // square on, a wet face is clear
          vec3 refl = domeAt(reflect(d, n2));
          if (abs(n.z) < 0.5) { F *= 0.55; refl = mix(refl, uRoomLow*1.5, 0.75); }      // the long skin shivers: a soft pale sheen over the ink, never a clean mirror
          float aS = 0., aD = 0.; vec3 sec = vec3(0.);
          if (n.z < -0.5 || (n.z > 0.5 && uFarFace > 0.5)) {     // a cut face
            vec2 xy = vP.xy; float z = n.z < 0. ? uBoxMin.z + 0.02 : uBoxMax.z - 0.02, w = 0.6*aa;
            float gold = 0.;                                     // leaf specks: torn scraps cut through are short gold dashes
            vec2 gc = xy/4.6, id = floor(gc); float hs = hash21(id + floor(z)*0.37);
            vec2 q = (fract(gc) - 0.5)*4.6 - (vec2(hash21(id + 1.7), hash21(id + 5.1)) - 0.5)*2.6;
            float an = hs*40., len = 0.25 + 1.1*hash21(id + 9.2);
            vec2 dr = vec2(cos(an), sin(an)); float al = clamp(dot(q, dr), -len, len);
            float gw = max(0.05, 0.8*aa);                          // a dash is leaf seen edge on: never under 1.5 px, paler when widened
            gold = step(0.72, hs)*uHas.w*(1. - smoothstep(gw*0.6, gw*1.4, length(q - dr*al)))*min(1., 0.07/gw + 0.25)*(1. - smoothstep(0.35, 0.9, aa));
            float dG = gooseSd(xy, z), dM = luneSd(xy, z), dR = xy.y - ridgeH(xy.x, z);
            float aR = uHas.x*(1. - smoothstep(-w, w, dR)), aM = uHas.y*(1. - smoothstep(-w, w, dM - w));
            float aG = uHas.z*(1. - smoothstep(-w, w, dG - clamp(0.8*aa - 0.3, 0., 1.3)))*step(z, 830.);      // tenth round: a rod's cut end is never under a pixel and a half thick: nine chevrons are read on every face
            // faint drag lines the blade left, running the way it travelled
            float drag = (vnoise(vec2(xy.x*2.3, xy.y*0.045)) - 0.5)*(1. - smoothstep(0.1, 0.45, aa));
            float wP = max(aM, aG)*(1. - aR), wG = gold*(1. - aR)*(1. - max(aM, aG));      // each stuff by its own coverage: an edge is where one stuff stops
            // the rest of the moon's disc: a round of clearer jelly, faintly paler than what is round it, with a crisp edge
            aD = uHas.y*uRoundF*(1. - smoothstep(-w, w, length(xy - barC(z)) - barR(z)))*(1. - aR)*(1. - max(aM, aG))*(1. - wG);
            aS = clamp(aR + wP + wG, 0., 1.);
            vec3 alb = (mix(uDark, uPaste, smoothstep(-w, w, capLine(vec3(xy, z), max(-dR, 0.))))*aR + uPaste*wP + uGold*wG)/max(aR + wP + wG, 1e-4);
            sec = inJelly(alb*(1. + 0.07*drag), vec3(xy, z - 0.05*n.z), vec3(0., 0., n.z), vEye);
            F *= 1. + 0.2*drag;
            F += uHaze;
            // close to, the upper part of what we see of a wet face carries the dome as a pale cool sheen (keyed to how high the
            // mirrored sight line climbs: strongest at the top of the view, half strength a third of the way down, its lower
            // boundary wavering with the skin's ripple); it slides up and off as we enter
            float fd = abs(vEye.z - z), e0 = mix(0.8, -0.06, smoothstep(5., 20., fd));
            float sh = uSheen*smoothstep(e0, e0 + 0.5, (uRot*reflect(d, n2)).y + 0.05*rip.x + 0.03*rip.y)*(1. - smoothstep(30., 58., fd));
            F += sh; refl = mix(refl, uLamp*0.8, clamp(sh*1.6, 0., 1.));
            // beads of water, and one drop running down
            vec2 bg = xy/2.6, bid = floor(bg); vec2 bq = (fract(bg) - 0.5 - (vec2(hash21(bid + 2.2), hash21(bid + 8.8)) - 0.5)*0.7)*2.6;
            float br = 0.1 + 0.2*hash21(bid + 4.4), fine = 1. - smoothstep(0.06, 0.22, aa);
            float bead = step(0.7, hash21(bid + 6.6))*(1. - smoothstep(br - aa, br + aa, length(bq)))*fine;
            float dx = uBoxMin.x + (uBoxMax.x - uBoxMin.x)*(0.22 + 0.56*hash11(floor(t/11.) + z));
            float dy = uBoxMax.y - 4. - mod(t, 11.)*7.5;
            float trail = (1. - smoothstep(0.05 + aa, 0.09 + 2.*aa, abs(xy.x - dx - 0.12*sin(xy.y*0.9))))*step(dy, xy.y)*step(xy.y, uBoxMax.y - 4.)
                        *(1. - smoothstep(0.1, 0.5, aa));
            // 10h (N1c): the track a running drop leaves on a wet face draws up into a few beads; it is never one line the height
            // of the face (which stood in the view as a seam between two panes)
            trail *= step(0.6, hash11(floor(xy.y/2.6) + 3.7))*(1. - smoothstep(0.2, 0.34 + aa, abs(fract(xy.y/2.6) - 0.5)*2.6));
            float drop = 1. - smoothstep(0.22, 0.28 + aa, length((xy - vec2(dx + 0.12*sin(dy*0.9), dy))*vec2(1., 0.7)));
            F = clamp(F + 0.85*bead + 0.22*trail + 0.6*drop*(1. - smoothstep(0.1, 0.5, aa)), 0., 1.);
            // SIXTH ROUND: the loaf's own cut face is a sheet: a breath of the slab's pale blue over all of it, and one pale
            // rim line where the face meets the top and the sides (the edge of the sheet catching the lamp)
            // (10h: each edge's line is measured across itself, so a face seen aslant never carries a broad pale cap)
            vec2 ed = vec2(min(xy.x - uBoxMin.x, uBoxMax.x - xy.x), uBoxMax.y - xy.y);
            rimL = max(1. - smoothstep(0.3 + aq.x, 0.55 + 2.*aq.x, ed.x), 1. - smoothstep(0.3 + aq.y, 0.55 + 2.*aq.y, ed.y))*step(n.z, -0.5);
            film = uFilm*step(n.z, -0.5)*(mix(0.035, 0.09, smoothstep(30., 90., fd)) + 0.75*rimL)*(1. - aS*0.6);      // seventh round: close to, the sheet is clear and the night behind it sharp
          }
          vec3 r = toScene(refl);
          float a = aS + F - aS*F;
          vec4 o = vec4((sec*aS*(1. - F) + r*F)/max(a, 1e-4), a);
          float ad = aD*(1. - a); vec3 rd = toScene(uDay*0.92);                 // the round lies under the wet sheen, over the night
          vec4 o2 = vec4((o.rgb*o.a + rd*ad)/max(o.a + ad, 1e-4), o.a + ad);
          vec3 fc = toScene(mix(uSlabC*0.8, uDay*0.95, rimL)); float a2 = o2.a + film - o2.a*film;
          vec4 o3 = vec4((o2.rgb*o2.a*(1. - film) + fc*film)/max(a2, 1e-4), a2);
          // NINTH ROUND: A SLICE IS A SLAB OF WET JELLY (uSlab 1). Its faces are distinct tones: the cut face clear, the end face
          // deeper; every edge of the block carries one pale wet line (never under a pixel and a half), and the lamp sits as
          // one small glint on the top corner nearest the eye.
          if (uSlab > 0.5) {
            vec3 sz = uBoxMax - uBoxMin, q = vP - uBoxMin; float bodyA = 0.; vec3 bodyC = uSlabC; vec2 ed, ea, ex;
            // 10h (N1): A SLICE'S END IS A DEEP BLUE BAND. Looked into at its end a slice is not 20 m of jelly but its whole length
            // (agar is a light pipe: a sight line that enters the end stays in the slab), so the end face is the colour of that
            // thickness, uDay through the slab's own length, paler in the colourless top as the loaf is; where the ridge is cut
            // by the end the dark paste stands in it. (It was a flat slate at two thirds, which over the pale far face read as
            // the edge of a pane.)
            if (abs(n.x) > 0.5) { ed = vec2(sz.y - q.y, min(q.z, sz.z - q.z)); ea = aq.yz; ex = sz.yz;
              vec3 Tn = transmit(sz.x*rhoAt(vP.y)*uEyeK);
              bodyC = uDay*Tn + uInk*(1. - Tn.b); bodyA = 0.95*(1. - uHas.x*(1. - smoothstep(-0.6*aq.y, 0.6*aq.y, vP.y - ridgeH(vP.x, vP.z)))); }
            else if (abs(n.y) > 0.5) { ed = vec2(min(q.x, sz.x - q.x), min(q.z, sz.z - q.z)); ea = aq.xz; ex = sz.xz; bodyC = uSlabC*0.85 + uDay*0.3; bodyA = 0.6; }
            else { ed = vec2(min(q.x, sz.x - q.x), sz.y - q.y); ea = aq.xy; ex = sz.xy; }
            // (10h: each wet line is measured across itself and never takes more than an eighth of its face, so a face seen
            // aslant keeps its own tone between its two lines: a band, never one white line)
            ea = min(ea, 0.066*ex);
            vec2 r2 = 1. - smoothstep(0.1 + 0.6*ea, 0.18 + 1.6*ea, ed); float rl = max(r2.x, r2.y);
            vec3 slabC = mix(bodyC, uDay*0.92 + uLamp*0.2, rl); float slabA = max(bodyA, 0.92*rl);
            vec3 mid = 0.5*(uBoxMin + uBoxMax), cn = vec3(vEye.x > mid.x ? uBoxMax.x : uBoxMin.x, uBoxMax.y, vEye.z > mid.z ? uBoxMax.z : uBoxMin.z);
            float gw = max(1.5, 3.6*aa), gl = (1. - smoothstep(0.4*gw, gw, length((vP - cn - vec3(sign(mid.x - cn.x)*2.4, -1.2, 0.))*vec3(0.6, 1., 1.))))*(1. - smoothstep(230., 380., length(vEye - cn)));
            slabC = mix(slabC, uLamp*2.4 + uDay*0.4, gl); slabA = max(slabA, gl);
            float a3 = o3.a + slabA - o3.a*slabA;
            o3 = vec4((o3.rgb*o3.a*(1. - slabA) + toScene(slabC)*slabA)/max(a3, 1e-4), a3);
          }
          // 10h (N1): THE LOAF'S END IS A BLOCK TOO. From outside, its side walls for the first slab's length behind the fresh
          // face are what a slice's end is: the colour of the loaf's whole width behind them (paler in the colourless top, the
          // dark paste standing in it where the ridge meets the wall), dying away over the next slab's length, where the lamp's
          // light that came in by the face is gone and the long skin is its sheen over the ink again.
          else if (abs(n.x) > 0.5) {
            vec3 Tn = transmit((uBoxMax.x - uBoxMin.x)*rhoAt(vP.y)*uEyeK*(1. - 0.32*washAt(vP.z)));
            float bandA = 0.95*(1. - smoothstep(${LOAF.slab.toFixed(1)}, ${(2 * LOAF.slab).toFixed(1)}, vP.z - uBoxMin.z))*(1. - uHas.x*(1. - smoothstep(-0.6*aq.y, 0.6*aq.y, vP.y - ridgeH(vP.x, vP.z))));
            float a3 = o3.a + bandA - o3.a*bandA;
            o3 = vec4((o3.rgb*o3.a*(1. - bandA) + toScene(uDay*Tn + uInk*(1. - Tn.b))*bandA)/max(a3, 1e-4), a3);
          }
          gl_FragColor = o3;
        }`,
    });
  }

  /** The colourless core: a shaft of plain daylight in the dark. It is a light pipe: looked along from outside (the sight
   *  line within some 35 degrees of its axis) its wall is a mirror for the daylight coming down it from the exit disc, so
   *  it is a pale tube with a crisp silhouette, paler than everything round it; close to and square on it is clear, so we
   *  slide in, not through a fog. From inside it is only a faint sheen on the wall round us. Premultiplied alpha. */
  function coreMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: U({ uStrength: { value: 0.8 }, uInGain: { value: 1 }, uTube: { value: 1 } }), side: THREE.DoubleSide, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`${VS_HEAD}
        void main(){ vP = position; vN = normal; vEye = eyeLocal();
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position + wobble(position), 1.); }`,
      fragmentShader: /* glsl */`${FS_HEAD}
        uniform float uStrength, uInGain, uTube;
        void main(){
          if (vP.z < uBoxMin.z) discard;
          vec3 e = vEye - vP; float L = length(e); vec3 d = e/max(L, 1e-4);
          vec3 n = vN/max(length(vN), 1e-4);
          float c = abs(dot(n, d));
          bool inside = length(vEye.xy - uCore.xy) < uCore.z && vEye.z > uCore.w;
          if (inside == gl_FrontFacing) discard;                  // outside: the near wall only; inside: the wall round us
          float along = smoothstep(uCore.w - 4., uBoxMax.z, vP.z), f1 = 1. - c;
          vec2 dr = vP.xy - uCore.xy; dr /= max(length(dr), 1e-4);      // round the shaft without the seam of atan()
          float sn = vnoise(vec2(dr.x*1.6 + 0.3*sin(uTime*0.5 + vP.z*0.05), dr.y*1.6 + vP.z*0.06 - uTime*0.35));
          float streak = 0.45 + 1.3*sn*sn;   // the wall of the shaft is not quite even, and swims
          // inside: the pipe's wall round us carries fine lengthways caustics of the daylight coming down it, slowly turning;
          // never a veil
          if (inside) {
            float cn = vnoise(vec2(dr.x*4. + dr.y*2.3 + uTime*0.16, dr.y*4. - dr.x*1.7 + vP.z*0.012 - uTime*0.1));
            gl_FragColor = vec4(toScene(uDay)*((0.012*streak + 0.*cn)*f1*f1*uInGain*uStrength), 0.); return; }      // no caustic lobes: perspective turned them into rays round the disc
          // outside: the pipe. Its light swims slowly down it (long soft bands, never a flicker)
          float sw = vnoise(vec2(vP.z*0.035 - uTime*0.55, dr.x*1.3 + dr.y*0.7 + 0.2*sin(uTime*0.4)));
          float m = eyePath(vP, vEye);
          // bluer than the paste it springs from (the bar's tip stays a tip), paler toward the disc
          vec3 T = transmit(min(m, mix(27., 12., along) + 0.1*m)*(1. - 0.32*washAt(vP.z)));
          vec3 disp = (uDay*T + uInk*(1. - T.b))*(0.84 + 0.32*sw);
          // A ROD OF CLEAR JELLY, NOT A BEAM: looked along it is the pale pipe; seen from the side it is clear, and only its
          // two edges (where the sight line grazes the wall) stay pale, crisp along its whole length, so what lies beyond
          // shows through its middle. Nothing about it fades with distance, so it has no end that dissolves.
          vec2 dxy = d.xy/max(length(d.xy), 1e-3);
          float rim = 1. - smoothstep(0.0, 0.42, abs(dot(dr, dxy)));
          // (10h, N2: THE THREAD IS A THIN CLEAR LINE from the tip on. Over its first 60 m by the tip the rod was a pale body
          // with two broad soft rims (byTip 1 at the tip, 0 from 62 m on), which from the valley lengthened the tip into one
          // long white shape. Now it is as clear there as along the rest of its length, and springs from the tip by its two
          // crisp edge lines alone: only this line, which reads a place, is changed.)
          float byTip = 0.;
          float a = (mix(0.015, 0.8, smoothstep(70., 260., L))*mix(0.18, 1., byTip) + 0.55*rim*rim*(1. - smoothstep(80., 220., L))*byTip)*mix(0.3, 1., smoothstep(uCore.z + 1., uCore.z*4., length(vEye.xy - uCore.xy)));
          // SEVENTH ROUND: the rod's two edges are crisp pale lines (where the sight line grazes its wall), about two pixels
          // wide at any distance, and they hold from the torn end of the tip all the way down to the full moon
          float cw = clamp(fwidth(c)*2., 0.004, 0.25), edge = (1. - smoothstep(cw, 2.2*cw, c))*0.8;
          a = max(a, edge);
          a = min(a, 0.92)*smoothstep(uCore.w - 5., uCore.w + 2., vP.z)*uTube;
          a *= (1. - smoothstep(110., 190., uCore.w - vEye.z))*(1. - smoothstep(uCore.w - 30., uCore.w - 8., vEye.z));      // too far off it is a line from nowhere; past the tip its source is behind us
          disp = mix(disp, uDay*mix(T, vec3(1.), 0.35) + uInk*(1. - T.b)*0.5, edge);
          // where the sight line goes on through the pipe to the exit disc, the disc itself shows: the pale end of the tube
          float tz = (uBoxMax.z - vEye.z)/max(vP.z - vEye.z, 1e-3);
          vec2 hit = vEye.xy + (vP.xy - vEye.xy)*max(tz, 0.);
          a *= vP.z > vEye.z ? smoothstep(uCore.z - 0.6, uCore.z + 0.1, length(hit - uCore.xy)) : 1.;
          gl_FragColor = vec4(toScene(disp)*a, a);
        }`,
    });
  }

  /** seconds since each of the five cuts (negative: not yet), and where the loaf's face now stands */
  function setCuts(ages, faceZ) {
    for (let i = 0; i < 5; i++) uniforms.uCutAge.value[i] = ages[i] ?? -1;
    if (faceZ !== undefined) uniforms.uBoxMin.value.z = faceZ;
  }
  return { uniforms, shape, palette: pal, pasteMaterial, moonMaterial, moonGeometry, leafMaterial, leafGeometry, boxGeometry, hullMaterial, skinMaterial, coreMaterial, setCuts };
}

// ---------------------------------------------------------------------------------------------------------------
// Geometry of the pictures
// ---------------------------------------------------------------------------------------------------------------
/** The Moon Bar between z0 and z1 (loaf space): a 48-point lune swept over 'rings' rings. With tip: true the last
 *  10 m is the rounded, slightly ragged spooned end. The world coder uses it for each slab's 20 m of moon. */
export function barGeometry(shape, z0, z1, rings = 300, o = {}) {
  const M = 48, tipLen = o.tip ? 10 : 0, tipRings = o.tip ? 22 : 0, body = rings - tipRings;
  const pos = new Float32Array((rings + 1) * M * 3), idx = new Uint16Array(rings * M * 6);
  const c = [0, 0];
  for (let i = 0; i <= rings; i++) {
    let z, s = 1;
    if (i <= body) z = lerp(z0, z1 - tipLen, i / body);
    else { const t = (i - body) / tipRings; z = z1 - tipLen + tipLen * sin(t * PI * 0.5); s = sqrt(max(1 - pow(sin(t * PI * 0.5), 2), 0)); }
    shape.barC(z, c);
    const R = shape.barR(z), a = shape.barA(z), tt = 1 - 2 * shape.barP(z), ca = cos(a), sa = sin(a);
    const ux = 0.5 * (1 + tt);                             // about the middle of the lit part, where the tip closes
    for (let j = 0; j < M; j++) {
      const lim = j < M / 2, b = lim ? -PI / 2 + (PI * j) / (M / 2) : PI / 2 - (PI * (j - M / 2)) / (M / 2);
      let u = (lim ? 1 : tt) * cos(b), v = sin(b);
      if (s < 1) { const rag = 1 + 0.1 * sin(j * 1.9 + i * 0.9) * (1 - s) + 0.06 * sin(j * 0.7 - i * 1.3) * (1 - s); u = ux + (u - ux) * s * rag; v = v * s * rag; }
      const k = (i * M + j) * 3;
      pos[k] = c[0] + R * (u * ca - v * sa); pos[k + 1] = c[1] + R * (u * sa + v * ca); pos[k + 2] = z;
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + ((j + 1) % M), c2 = a + M, d = b + M, k = (i * M + j) * 6;
    idx[k] = a; idx[k + 1] = b; idx[k + 2] = c2; idx[k + 3] = b; idx[k + 4] = d; idx[k + 5] = c2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.userData.capAt = o.cap ? z0 : null;
  // normals from the ring's own neighbours (the shaders turn them to face the eye, so the winding does not matter)
  const nor = new Float32Array(pos.length);
  for (let i = 0; i <= rings; i++) for (let j = 0; j < M; j++) {
    const a = (i * M + ((j + M - 1) % M)) * 3, b = (i * M + ((j + 1) % M)) * 3, c2 = (max(i - 1, 0) * M + j) * 3, d = (min(i + 1, rings) * M + j) * 3;
    const ax = pos[b] - pos[a], ay = pos[b + 1] - pos[a + 1], az = pos[b + 2] - pos[a + 2];
    const bx = pos[d] - pos[c2], by = pos[d + 1] - pos[c2 + 1], bz = pos[d + 2] - pos[c2 + 2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz);
    if (l < 1e-7) { nx = 0; ny = 0; nz = 1; } else { nx /= l; ny /= l; nz /= l; }
    const k = (i * M + j) * 3; nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
  }
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(LOAF.axis[0], LOAF.axis[1], (z0 + z1) / 2), (z1 - z0) / 2 + 30);
  return g;
}
/** The broken end of a length of the bar at z: the lune itself, a flat face of paste square to the course (facing -Z).
 *  THE MOON IS SEEN WHERE THE BAR IS BROKEN: the rod was laid in three lengths, and the near end of each hangs in the
 *  night as the moon at that phase (a crescent, a half, a gibbous), which we come up to and pass. */
export function barCapGeometry(shape, z) {
  const K = 28, pos = [], nor = [], idx = [], c = shape.barC(z), R = shape.barR(z), a = shape.barA(z), tt = 1 - 2 * shape.barP(z), ca = cos(a), sa = sin(a);
  for (let k = 0; k <= K; k++) { const b = -PI / 2 + (PI * k) / K;
    for (const m of [1, tt]) { const u = m * cos(b), v = sin(b); pos.push(c[0] + R * (u * ca - v * sa), c[1] + R * (u * sa + v * ca), z); nor.push(0, 0, -1); } }
  for (let k = 0; k < K; k++) { const i = k * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(c[0], c[1], z), 20);
  return g;
}

/** A body of revolution about the core axis (loaf space): profile = [[r, z], ...]; ragged > 0 tears its last ring. */
function latheZ(profile, seg, rng, ragged = 0) {
  const pos = [], idx = [], n = profile.length;
  const jit = []; for (let j = 0; j < seg; j++) jit.push(ragged ? 1 + ragged * (rng() - 0.3) * (0.5 + 0.5 * sin(j * 0.9)) : 1);
  for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) {
    const a = (j / seg) * TAU, r = profile[i][0] * (profile[i][2] ? jit[j] : 1);
    pos.push(LOAF.axis[0] + r * cos(a), LOAF.axis[1] + r * sin(a), profile[i][1]);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = a + seg, d = b + seg;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/** The camera's line at z -> [x, y]: the brief's path, except that from z 600 it eases 8 m to starboard and a metre down,
 *  so that the far disc and the daylight shaft stand clear of the bar's tip well before we reach it. Leaf and sugar keep
 *  out of its way; the world builds its path from it. */
export const streamX = (z) => 3.2 + 4.2 * sin(z * 0.0125 + 0.9) + 1.3 * sin(z * 0.043 + 2);      // the stream's middle line (twin of the GLSL)
export function pathXY(z, o = [0, 0]) {
  // beside the Moon Bar at its own height to z 520, then down into the valley between the ranges (the dawn layer) and
  // 6 m to starboard, and from z 850 up and to port into the colourless core
  const t = sstep(845, 1000, z), s = sstep(500, 640, z);
  const e = 1 - sstep(160, 300, z);                     // we come in through the face on the swing, to starboard, and straighten inside
  // 21 m to starboard of the bar's axis and 10 m under it, so that each moon hangs in the sky ahead, up to port
  o[0] = lerp(6, LOAF.axis[0], t) + 16 * e; o[1] = lerp(40 - 12.5 * s, LOAF.axis[1], t) + 4.5 * e; return o;
}
/** The brief's pace(u): slow outside, quick through the middle, near 1 for the last tenth. */
export function pace(u) {
  const K = [[0, 0.42], [0.13, 0.42], [0.15, 0.38], [0.3, 1.42], [0.82, 1.42], [0.9, 1], [1, 1]];
  let i = 0; while (i < K.length - 2 && u > K[i + 1][0]) i++;
  return lerp(K[i][1], K[i + 1][1], sstep(K[i][0], K[i + 1][0], u));
}
/** The moments the blade is fully down, in journey seconds (the brief's strokes start at 1.5, 5.5, 9.5, 19, 28 s). */
export const CUT_TIMES = [3.9, 7.9, 11.9, 19, 28];


/** 10h (N2): THE SPOONED TIP IS SMALL AND CLEAN. The Moon Bar is its spooned tip alone: one spoonful of white paste where
 *  the clear core springs. A rounded end as long as the clear rod is wide (twice LOAF.coreR: 14 m, z 886 to 900) and half
 *  as wide (7 m across), smooth all round, its back drawn up into the little curl the spoon left, and on the side toward
 *  the flight line the spoon's hollow with one soft raised lip (aHollow = 1 in the hollow: the shader gives it a cooler
 *  shade; aTipQ.xy: the bowl's own coordinates, for the spoon's marks in it). Its place and size are these measures of the
 *  loaf, the same from everywhere.
 *  (It was a quenelle 44 m long and 13.6 m across with four drag ridges, a lip torn into seven notches and five tags,
 *  fourteen crumbs off the lip and a torn end: from the valley, with the pale first length of the rod behind it, one long
 *  lumpy white shape. The tear and the crumbs were dealt from the hero's stream; they are gone, so everything dealt after
 *  the tip in that stream, the leaf first, falls anew at every seed. Nothing is kept to hold the old deal.) */
export async function tipGeometry(shape, ctx) {
  const M = 64, NR = 64, z1 = LOAF.barEnd, LEN = 2 * LOAF.coreR, z0 = z1 - LEN, R0 = LOAF.coreR / 2, pos = [], hol = [], tq = [], idx = [], c = [0, 0];
  const ph0 = -0.3, zc = z0 + 0.52 * LEN, HZ = 0.3 * LEN, HP = 0.8;        // the scoop: toward the flight line (starboard and below), in the tip's fuller half
  const wrap = (a) => Math.atan2(sin(a), cos(a));
  for (let i = 0; i <= NR; i++) {
    if (ctx && i % 12 === 11) await ctx.yield();
    const t = i / NR, z = z0 + (z1 - z0) * t;
    shape.barC(z, c);
    const end = sstep(z1 - 1.1 * R0, z1 - 0.2, z), back = 1 - min(t / 0.42, 1);
    const R = R0 * sqrt(max(1 - pow(back, 2.4), 0)) * sqrt(max(1 - end * end, 0)) + 0.04;
    const curl = sstep(0.16, 0, t), cy = c[1] + 0.38 * R0 * curl * curl, cx = c[0] - 0.18 * R0 * curl * curl;      // the back end, pulled up as the spoon left
    for (let j = 0; j < M; j++) {
      const ph = (j / M) * TAU - PI, dp = wrap(ph - ph0), bu = (z - zc) / HZ, bv = dp / HP, s = Math.hypot(bv, bu);
      let r = 1;
      if (s < 1) r -= 0.5 * (1 - s * s) * (1 - 0.25 * end);
      r += 0.12 * Math.exp(-((s - 1) * (s - 1)) / 0.03) * (1 - end);
      pos.push(cx + R * r * cos(ph), cy + R * r * sin(ph) * 0.96, z);
      hol.push(1 - sstep(0.7, 0.98, s)); tq.push(bu, bv, 0);
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + ((j + 1) % M); idx.push(a, b, a + M, b, b + M, a + M); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aHollow', new THREE.Float32BufferAttribute(hol, 1));
  g.setAttribute('aTipQ', new THREE.Float32BufferAttribute(tq, 3));
  if (ctx) await ctx.yield();
  g.setIndex(idx); g.computeVertexNormals();
  if (ctx) await ctx.yield();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(LOAF.axis[0], LOAF.axis[1], (z0 + z1) / 2), LEN);
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// THE HERO
// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('moon-bar') : ctx.rng;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const shape = makeShape(rng, { gibbous: opts.gibbous });
  const jelly = createJelly({ palette: opts.palette || PALETTE, shape, exposure: opts.exposure ?? 1 });
  const U = jelly.uniforms, pal = jelly.palette;
  for (let i = 0; i < 5; i++) U.uCutZ0.value[i] = LOAF.z0 + LOAF.slab * (i + 1);
  U.uDawn.value.set(108, 182, 38, 0.07);      // the dawn layer: nothing at the cut end, 38 m deep from z 300 to the far face (sixth round: the whole valley lies in it, so the land is lit from the first moon on)
  U.uCapY.value = 33;                        // snow of white paste on every peak above this height

  // hero space: origin at the middle of the loaf's foot, the cut face toward +Z. Loaf space (the brief's own
  // coordinates) is the inner group: put object at (0,0,580) with rotation.y = PI and the two coincide.
  const object = new THREE.Group(); object.name = 'night-by-the-slice-hero';
  const loaf = new THREE.Group(); loaf.rotation.y = PI; loaf.position.z = (LOAF.z0 + LOAF.z1) / 2; object.add(loaf);
  const toHero = (x, y, z) => new THREE.Vector3(-x, y, (LOAF.z0 + LOAF.z1) / 2 - z);
  const add = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; loaf.add(m); return m; };

  // the agar: far walls first, wet skin last
  await ctx.yield();
  const boxGeo = jelly.boxGeometry(96);
  const hull = add(boxGeo, jelly.hullMaterial(), -2);
  await ctx.yield();
  const skin = add(boxGeo, jelly.skinMaterial({ moonOv: new THREE.Vector4(shape.faceMoon.p, shape.faceMoon.R, 0, 0) }), 6);
  await ctx.yield();

  // the Moon Bar, z 100 to 900, with its spooned tip
  // (10h, N2: white paste a shade under the moon's cream, the shade the cast has, and keeping as true as the full moon's own
  // paste does, its keep and its eyeK, so that the tip is a shade under the moon from everywhere and never brighter; smooth:
  // no nozzle's streaks, the moon's own fine grain)
  const barMat = jelly.pasteMaterial(pal[5].clone().multiplyScalar(0.955), { grain: 0.012, keep: 0.94, eyeK: 0.06, model: 0, tip: 1 });
  // THE MOON BY THE SLICE (fourth round). Between its moons the bar is only a thread of paste; at each station hangs a
  // slice of the moon itself, 3 m thick, face on to the course, a little fuller each time (shape.moons), and at z 835
  // the thread swells into the spooned tip the colourless core springs from. From the flight line each is a moon in
  // the sky ahead; passing it we see it is a slice. Their paste keeps true a long way (uEyeK): they are what glows.
  // the thread stops short of each moon (its face hangs clear) and takes up again behind it
  // SIXTH ROUND: the thread between the moons is gone (from the flight line it was a streak across every picture): the
  // moons hang free, and the Moon Bar is its last length, the spoonful of paste the clear core springs from
  await ctx.yield();
  const bar = add(await tipGeometry(shape, ctx), barMat, 0);
  await ctx.yield();
  const moons = add(jelly.moonGeometry(shape.moons.map((m) => { const c = shape.moonC(m); return { c: [c[0], c[1], m.z], R: m.R, p: m.p, a: shape.barA(160) }; })), jelly.moonMaterial(), 0);
  await ctx.yield();

  // the colourless core (z 896 to the far face) and its collar of white paste
  const R = LOAF.coreR, zf = LOAF.z1, coreProf = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; coreProf.push([0.05 + (R - 0.1) * sin(t * PI * 0.5), LOAF.barEnd - 4 + 7 * (1 - cos(t * PI * 0.5))]); }
  for (let i = 1; i <= 16; i++) coreProf.push([R - 0.05, LOAF.barEnd + 3 + (zf - LOAF.barEnd - 3) * (i / 16)]);
  const core = add(latheZ(coreProf, 48, rng), jelly.coreMaterial(), 4);
  await ctx.yield();
  // collar: a sleeve round the core for 12 m whose bore narrows toward the far face (so its white lip faces us down the
  // loaf), flaring outside to a hand-pressed rim against the face
  const collarProf = [[R + 0.5, zf - 12, 1], [R + 0.72, zf - 10.4, 1], [R + 0.95, zf - 5], [R + 1.3, zf - 2.2], [R + 2.1, zf - 1.1], [R + 3.3, zf - 0.6, 1],
    [R + 3.1, zf - 0.4, 1], [R + 0.6, zf - 0.4], [R - 0.15, zf - 0.4], [R - 0.02, zf - 2.5], [R + 0.16, zf - 6], [R + 0.36, zf - 10], [R + 0.5, zf - 12, 1]];
  const collar = add(latheZ(collarProf, 72, rng, 0.14), jelly.pasteMaterial(pal[5], { grain: 0.05, keep: 0.94, eyeK: 0.06, model: 0 }), 0);
  await ctx.yield();
  // SIXTH ROUND: THE FULL MOON. The phases end in a full moon of white paste pressed on the far face, 52 m across, standing
  // between the two snow peaks; the exit is its middle (the world gives the opening the same cream as its veil).
  const fullMoon = (() => { const K = 96, RM = shape.fullMoon.R, pos = [], idx = [];
    for (let i = 0; i <= 3; i++) { const r = lerp(R + 0.3, RM, [0, 0.12, 0.6, 1][i]);
      for (let k = 0; k < K; k++) { const a = (k / K) * TAU; pos.push(LOAF.axis[0] + r * cos(a), LOAF.axis[1] + r * sin(a), zf - 0.45); } }
    for (let i = 0; i < 3; i++) for (let k = 0; k < K; k++) { const a = i * K + k, b = i * K + ((k + 1) % K); idx.push(a, b, a + K, b, b + K, a + K); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((v, i) => (i % 3 === 2 ? -1 : 0)), 3)); g.setIndex(idx);
    return add(g, jelly.pasteMaterial(pal[5], { grain: 0.012, keep: 0.94, eyeK: 0.06, model: 0, maria: 1, side: THREE.DoubleSide }), 0); })();
  await ctx.yield();

  // the camera's line (the brief's path), used to keep leaf out of the way and given back as an anchor

  // gold leaf: torn scraps at their true depths, clumped where the leaf tore, denser near the path, never within 3 m of it
  const N = Math.round((opts.flakes ?? 32000) * detail);
  const NLIE = Math.round(2600 * detail), NA = N + NLIE;      // NLIE: scraps that lie on the paste (the valley floor, the crests)
  const fp = new Float32Array(NA * 3), fs = new Float32Array(NA), ft = new Float32Array(NA);
  const pc = [0, 0], bc = [0, 0];
  // THE SKY HAS A PICTURE IN IT: not an even scatter. A thin field at every depth; a milky band, a slanting sheet of leaf
  // dust that runs the whole loaf and turns slowly about it; and constellations, a few large scraps hung in one plane
  // across the loaf so that the figure is read as we come up to it (the Plough, Orion, Cassiopeia, the Swan).
  const FIG = [
    { wide: 1, p: [[-1, 0.3, 1], [-0.62, 0.5, 0.9], [-0.3, 0.34, 0.9], [-0.02, 0.1, 0.8], [0.08, -0.5, 0.9], [0.62, -0.62, 0.9], [0.74, 0.08, 1]] },
    { wide: 0, p: [[-0.5, 0.78, 1], [0.45, 0.84, 0.9], [-0.36, 0.1, 0.85], [0, 0, 0.85], [0.36, -0.1, 0.85], [-0.55, -0.82, 0.9], [0.48, -0.76, 1], [0, 1, 0.6], [0.06, -0.36, 0.6]] },
    { wide: 1, p: [[-1, 0.5, 0.9], [-0.5, -0.5, 1], [0, 0.2, 0.9], [0.5, -0.6, 0.9], [1, 0.55, 1]] },
    { wide: 0, p: [[0, 1, 1], [0, 0.32, 0.9], [0, -0.92, 0.9], [-0.8, 0.5, 0.85], [0.75, 0.22, 0.85], [0, -0.3, 0.6]] },
  ];
  // where the sky is free: low to starboard between the flight line and the range; high to port over the bar; and, from
  // the valley, straight ahead over the flight line
  // SIXTH ROUND: the moons hang to port, so the figures stand high to starboard (and one to port after the half moon):
  // five figures, none across a moon or the full moon's face
  const SLOT = { star: [33, 67, 12, 7], port: [-37, 68, 10, 7.5] };
  const figs = [[0, 'star', 290], [1, 'star', 420], [3, 'star', 535], [2, 'port', 700], [0, 'star', 880]];
  const stars = [], dark = [];
  for (const [fi, slot, z] of figs) { const S = SLOT[slot], rot = rng.range(-0.18, 0.18), zc = z + rng.range(-12, 12);
    for (const p of FIG[fi].p) { const px = p[0] * cos(rot) - p[1] * sin(rot), py = p[0] * sin(rot) + p[1] * cos(rot);
      let x = S[0] - px * S[2], y = S[1] + py * S[3]; const zz = zc + rng.range(-2.5, 2.5);       // flying +Z, +x is screen left
      y = max(y, shape.ridgeH(x, zz) + 3); if (shape.inBar(x, y, zz, 2.5)) y += 9;
      stars.push([clamp(x, LOAF.x0 + 3, LOAF.x1 - 3), min(y, LOAF.y1 - 2.5), zz, 3 * p[2]]); }
    dark.push([S[0], S[1], S[2] + 5, S[3] + 4, zc]); }
  const NF = max(0, N - stars.length);
  const bandPh = rng() * TAU;
  // NOTHING HANGS ACROSS A MOON SEEN FROM FURTHER BACK EITHER (shape.inSight clears one bundle of sight lines from 190 m to
  // 25 m before each moon): from every point of the flight line, from the loaf's own start to 25 m before a moon (eyes
  // every 2.5 m of the route), no scrap lies inside the cone from that eye to the moon's round, with the scrap's own size
  // and 1 m to spare. A rule in space: it holds on every seed and at every moment of the flight.
  const EYE_STEP = 2.5, eyeXY = []; for (let ze = LOAF.z0; ze < LOAF.z1; ze += EYE_STEP) { pathXY(ze, pc); eyeXY.push(pc[0], pc[1]); }
  const moonXY = shape.moons.map((m) => shape.moonC(m, [0, 0]));
  const acrossMoon = (x, y, z, sz) => {
    for (let k = 0; k < shape.moons.length; k++) {
      const m = shape.moons[k], c = moonXY[k]; if (z > m.z - 25) continue;
      const i1 = min(eyeXY.length / 2 - 1, floor((z - 6 - LOAF.z0) / EYE_STEP));
      for (let i = 0; i <= i1; i++) {
        const ze = LOAF.z0 + i * EYE_STEP, t = (z - ze) / (m.z - ze), ex = eyeXY[i * 2], ey = eyeXY[i * 2 + 1];
        if (Math.hypot(x - ex - (c[0] - ex) * t, y - ey - (c[1] - ey) * t) < m.R * t + sz + 1) return true;
      }
    }
    return false;
  };
  let n = 0, guard = 0, cx = 0, cy = 0, cz = 0, clump = 0;
  while (n < NF && guard < N * 12) {
    guard++;
    if (guard % 200 === 0) await ctx.yield();
    let x, y, z, sz;
    if (clump > 0) {                                               // a torn sheet leaves a drift of small scraps
      clump--; x = cx + rng.gauss() * 1.6; y = cy + rng.gauss() * 1.2; z = cz + rng.gauss() * 2.6; sz = 0.3 + 0.7 * rng() * rng();
    } else {
      z = rng.range(LOAF.z0 + 0.5, LOAF.z1 - 1);
      const r3 = rng(); sz = 0.3 + 1.5 * r3 * r3 * r3 * r3;
      if (rng() < 0.12) {                                            // the milky band: a breath of dust only (sixth round)
        const th = 0.55 + 0.5 * sin(z * 0.0045 + bandPh), al = rng.gauss() * 34, off = rng.gauss() * 2.6;
        x = 10 + al * cos(th) - off * sin(th); y = 55 + al * sin(th) + off * cos(th); sz = 0.26 + 0.5 * rng() * rng() + (rng() < 0.04 ? 0.9 : 0);
      } else { x = rng.range(LOAF.x0 + 1, LOAF.x1 - 1); y = rng.range(3, LOAF.y1 - 1); }
      pathXY(z, pc);
      const dp = Math.hypot(x - pc[0], y - pc[1]);
      // TENTH ROUND: THE LEAF HANGS IN THE JELLY AGAIN, within reach: none nearer the flight line than 8 m (no fleck across the
      // lens), most of it within 30 m (so each scrap is seen as a scrap as we pass), thinner beyond
      if (dp < 8 || (dp > 30 && rng() > 0.45)) continue;
      // THE LAST STRETCH (beyond z 930) keeps the clear zone it has live: next to none within 36 m of the flight line (the sixth
      // round's rule). It is not thinned otherwise: the full moon's clean round is kept by the rules in space below.
      if (z > 930 && dp < 36 && rng() > 0.03 + 0.97 * (dp / 36) * (dp / 36) * (dp / 36)) continue;      // the full moon and the way out are a clean picture
      if (y > 68 && rng() > 0.5) continue;                         // thinner in the pale band
      if (z < 245 && rng() > 0.2) continue;                        // and next to none behind the cut face (sixth round: the way in is a clean picture)
      if (rng() < 0.2) { clump = 2 + floor(rng() * 6); cx = x; cy = y; cz = z; }
    }
    if (x < LOAF.x0 + 1 || x > LOAF.x1 - 1 || y > LOAF.y1 - 1 || z < LOAF.z0 + 0.5 || z > LOAF.z1 - 1) continue;
    if (y < shape.ridgeH(x, z) + 0.8 + sz) continue;
    pathXY(z, pc);
    const dpp = Math.hypot(x - pc[0], y - pc[1]);
    if (dpp < 8 + sz) continue;
    // NOTHING ACROSS THE FULL MOON: beyond z 930 no scrap (nor any of a torn sheet's drift) hangs inside the moon's own round about
    // the axis (its 26 m, the wave's height and the scrap's own size), so from every point of the last straight, where the
    // lens is on that axis, the whole round is clean
    if (z > 930 && Math.hypot(x - LOAF.axis[0], y - LOAF.axis[1]) < shape.fullMoon.R + LOAF.waveHeight + sz) continue;
    // the full moon is seen clear from the pagoda on: nothing hangs between the flight line and its round
    if (z > 560) { const ax = LOAF.axis[0] - pc[0], ay = LOAF.axis[1] - pc[1], tt = clamp(((x - pc[0]) * ax + (y - pc[1]) * ay) / (ax * ax + ay * ay + 1e-6), 0, 1);
      if (Math.hypot(x - pc[0] - ax * tt, y - pc[1] - ay * tt) < lerp(10, 29, tt)) continue; }
    // and each subject is seen clear as we come up to it: the village, the round window, the pagoda, the bridge, the two peaks
    // (the bridge is at z 727: its box runs from 50 m before it to 10 m past it; the pagoda stands on its spur at x 38, z 670: its box runs, as it did, from 2 m to starboard of the flight line to 20 m beyond it and from 70 m before it to 10 m past it)
    if ((x > -32 && x < pc[0] + 4 && z > 258 && z < 348 && y < 40) || (x < pc[0] - 5 && z > 448 && z < 554 && abs(y - 48) < 27) || (x > 8 && x < 58 && z > 600 && z < 680 && y < 62)
      || (abs(x - pc[0]) < 17 && z > 677 && z < 737 && y < 40) || (z > 958 && y < 54 && (abs(x - 13) < 17 || abs(x + 43) < 17))) continue;
    if (dpp < 20) sz = min(sz, 0.3 + dpp * 0.04);                  // the nearest scraps are small ones
    if (clump > 0 && dpp < 18 && (n % 3) !== 0) continue;
    if (shape.inBar(x, y, z, 0.5 + sz * 0.6) || shape.inSight(x, y, z) || acrossMoon(x, y, z, sz)) continue;      // each moon hangs in clear ink
    let inDark = false; for (const d of dark) if (abs(z - d[4]) < 26 && abs(x - d[0]) < d[2] && abs(y - d[1]) < d[3]) { inDark = true; break; }
    if (inDark) continue;                                          // dark sky round each figure
    if (z > LOAF.barEnd - 6 && Math.hypot(x - LOAF.axis[0], y - LOAF.axis[1]) < LOAF.collarR + (z > LOAF.z1 - 5 ? 4 : 1.2) + sz) continue;
    fp[n * 3] = x; fp[n * 3 + 1] = y; fp[n * 3 + 2] = z; fs[n] = sz; ft[n] = 0.8 + 0.3 * rng(); n++;
  }
  // leaf that came to rest: scraps lying in the troughs of the valley floor under the flight line, and gold on the ridge tops
  const nLie0 = n;
  for (let i = 0; i < NLIE; i++) {
    if (i % 250 === 249) await ctx.yield();
    const crest = false; let x, z;
    if (crest) { z = rng.range(180, 1040); x = rng.range(-56, 56); for (let k = 0; k < 6 && shape.ridgeH(x, z) < 30; k++) x = rng.range(-56, 56); }
    else { z = rng.range(196, 900); pathXY(z, pc); x = pc[0] + rng.gauss() * (z < 480 ? 13 : 10); }
    const sz = crest ? 0.4 + 0.8 * rng() * rng() : 0.45 + 0.95 * rng() * rng(), tone = (crest ? 0.9 : 1.5) + 0.4 * rng();
    if (abs(x) > 57 || (z > shape.lake.z0 && z < shape.lake.z1 && shape.ridgeH(x, z) <= shape.lake.y + 0.01)) continue;
    if (z > 500 && abs(x - streamX(z)) < 3.4) continue;            // none in the stream
    fp[n * 3] = x; fp[n * 3 + 1] = shape.ridgeH(x, z) + 0.14; fp[n * 3 + 2] = z; fs[n] = sz; ft[n] = tone; n++;
  }
  const nField = n;
  for (const st of stars) { if (n >= NA) break; fp[n * 3] = st[0]; fp[n * 3 + 1] = st[1]; fp[n * 3 + 2] = st[2]; fs[n] = st[3]; ft[n] = 1.25; n++; }
  await ctx.yield();
  const leafGeo = jelly.leafGeometry(n, rng, (i, o) => { o.pos[0] = fp[i * 3]; o.pos[1] = fp[i * 3 + 1]; o.pos[2] = fp[i * 3 + 2]; o.size = fs[i]; o.tone = ft[i]; });
  { const q = leafGeo.getAttribute('aQuat');                      // the figures' scraps hang square to the course, a little askew
    const dd = leafGeo.getAttribute('aData');
    for (let i = nField; i < n; i++) { const a = rng.range(-0.2, 0.2), b = rng.range(-0.2, 0.2); q.setXYZW(i, sin(a / 2), sin(b / 2), 0, cos(a / 2) * cos(b / 2)); dd.setW(i, 1); }
    for (let i = nLie0; i < nField; i++) { const a = -PI / 2 + rng.range(-0.22, 0.22), b = rng.range(-0.2, 0.2); q.setXYZW(i, sin(a / 2), 0, sin(b / 2), cos(a / 2) * cos(b / 2)); dd.setW(i, 2); } }      // lying flat, a little curled
  const leaf = add(leafGeo, jelly.leafMaterial(), 1);
  leaf.material.uniforms.uFar.value = 2.8;
  await ctx.yield();

  // ---- the clock: the world sets it from u; alone (the part viewer) the piece keeps its own slow rhythm of cuts ----
  let driven = false;
  const tab = new Float32Array(65);                                // journey seconds at u, from the brief's pace
  { let acc = 0; for (let i = 1; i <= 64; i++) { acc += 1 / (64 * pace((i - 0.5) / 64)); tab[i] = acc; } for (let i = 1; i <= 64; i++) tab[i] /= acc; }
  const ages = [-1, -1, -1, -1, -1];
  function setClock(t, times = CUT_TIMES) {
    driven = true; let face = LOAF.z0;
    for (let i = 0; i < 5; i++) U.uCutZ0.value[i] = LOAF.z0 + LOAF.slab * (i + 1);
    for (let i = 0; i < 5; i++) { ages[i] = t >= times[i] ? t - times[i] : -1; if (ages[i] >= 0) face += LOAF.slab; }
    jelly.setCuts(ages, face);
  }
  function setProgress(u, duration = 40) {
    const f = clamp(u, 0, 1) * 64, i = min(63, floor(f));
    setClock(duration * lerp(tab[i], tab[i + 1], f - i));
  }
  const _size = new THREE.Vector2();
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (!driven) {                                                 // three slabs gone; a far cut every 9 s keeps the jelly moving
      const a = time % 9;
      jelly.setCuts([40 + a, 20 + a, 9 + a, a, -1], LOAF.z0 + 3 * LOAF.slab);
      U.uCutZ0.value[3] = LOAF.z0 + 3 * LOAF.slab;
    }
    if (ctx.renderer && camera) { ctx.renderer.getDrawingBufferSize(_size); U.uPx.value = 0.5 * _size.y * camera.projectionMatrix.elements[5]; }
  }
  update(0, 0, null);

  // ---- anchors, in hero space ----
  const fly = [0, 80, 160, 400, 600, 660, 710, 760, 820, 900, 925, 950, 975, 1000, 1030, 1060].map((z) => { pathXY(z, pc); return toHero(pc[0], pc[1], z); });
  const anchors = {
    portalSeat: { position: toHero(LOAF.axis[0], LOAF.axis[1], LOAF.z1), facing: new THREE.Vector3(0, 0, 1), radius: 7 },
    flyThrough: fly,
    entry: toHero(0, 26, 0),
    faceCentre: toHero(0, 40, LOAF.z0 + 3 * LOAF.slab),
    barStart: toHero(...shape.barC(LOAF.z0), LOAF.z0),
    barTip: toHero(LOAF.axis[0], LOAF.axis[1], LOAF.barEnd),
    coreStart: toHero(LOAF.axis[0], LOAF.axis[1], LOAF.barEnd - 4),
    viewpoints: {
      entry: toHero(0, 26, 0), blade: toHero(0, 34, 80), wetFace: toHero(0, 41.5, 150),
      heart: toHero(0, 42, 520), tip: toHero(0, 42, 860), shaft: toHero(LOAF.axis[0], LOAF.axis[1], 1010),
    },
  };

  // debug only (the part viewer): ?hv=in | tip | core puts the orbit inside the loaf
  let center = toHero(0, 36, 100), radius = 50, height = 12;
  const hv = opts.view;
  if (hv === 'in') { center = toHero(2, 43, 420); radius = 9; height = 6; }
  if (hv === 'tip') { center = toHero(5, 45, 880); radius = 12; height = 6; }
  if (hv === 'core') { center = toHero(LOAF.axis[0], LOAF.axis[1], 1004); radius = 1; height = 1; }
  if (hv === 'far') { center = toHero(0, 30, 400); radius = 260; height = 200; }

  return {
    object, radius, height, center, anchors,
    loaf, jelly, shape, uniforms: U, meshes: { hull, skin, bar, core, collar, leaf, moons, fullMoon },
    setProgress, setClock, setCuts: (a, z) => { driven = true; jelly.setCuts(a, z); },
    setExposure: (e) => { U.uExposure.value = e; },
    update, dispose() {},
    ground: true, groundY: 0,
  };
}
