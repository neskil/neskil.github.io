// Stone on the Fifth Line: the stones, the event and the style kit of a printed dusk in flat inks over a mirror
// of still water.
// The position follows the record of a played game as a fact, as a record of a game and nothing more
// (source: the game file in the public archive of game records at homepages.cwi.nl, checked against an encyclopedia's diagram of the same game's first moves).
//
// SPACE. Board coordinates are the object's own: x east, z south (north is -z), y up, origin on the centre
// crossing at ground level. A crossing (column from the west, row from the north) is at
// x = (column - 10) * 140, z = (row - 10) * 140. Bearing b is the direction (sin b, 0, -cos b).
// One sun for every deal: bearing 356, 14 degrees up.
// Every shadow falls by that one fixed sun's direction (4.0 times the height away, on bearing 176).
// Built on this machine's older engine and kit as they are (from the kit: makePath only, in the world file; this file imports nothing from it).
// No deal changes the position, the line, the sun or the clock, so the stone comes down in sight at least once in every flight on every deal.
//
// THE STYLE KIT: makeStyle(ctx, opts) -> style. Make one and hand it to buildHero as opts.style.
//   opts.palette  thirteen hex strings in the brief's order; opts.hour 'gold' | 'rose' | 'grey' (else dealt).
//   style.palette linear THREE.Color by name: kerb (the bright edge), ring, dust, ground, ripple, plum, slate,
//                 slateLit, sheen, shell, shellShade, channel (the causeways' dark ink), violet, the sky's apricot
//                 and rose, and water (the sheet's ink). style.hour says which hour's inks were dealt.
//   style.sun (unit vector toward the sun), style.shadowDir (unit, on the water, bearing 176), style.SHADOW (4.0).
//   style.uniforms { uTime, uStone (x, underside height, z, seconds since the touch), uSun, uShDir, uFall
//                 (metres a second downward, the mean of the last 0.8 s), uMir (1), tBoard }:
//                 shared by every material below; style.update(dt, time) drives them from the clock alone.
//   style.glsl    the fragment chunk shared by the stones, the water, the lines, the streamers and every ink made by
//                 style.ink: lensOver(p, foot), castOver(p), standOver(p, self) and
//                 castShade(p): 1 where the falling stone or a standing one is between p and the sun.
//   style.vert, style.proj  the vertex shader the inks share (world position vW, normal vN, vertex colour vC) and
//                 the line every vertex shader of this world ends with (PROJ, below).
//   style.ink({ lit, half, shade, vertexColors, side })  flat three-step ink for any geometry (instanced or
//                 not): the step is chosen by the face's normal against the sun, shaded where castShade says.
//   style.mirror(mesh, order)  THE BUILT MIRROR: the image of a body in the water, a second mesh on the same
//                 geometry whose material has uMir -1 (the height turned over about the water's level, the inks
//                 worked out from the body's own place and normal). Every body over the water but the way out's
//                 rings and the causeways' tops gets one.
//   style.lensGeometry(segments)  the stone: two caps of radius 94.7 m meeting in a rim 24 m up, 126 m across.
//   style.lensMaterial            both stone inks in flat tones by the normal alone, with the rim line, the slate's
//                 strata rings and veins, the shell's grain bands and growth rings, wavering tone edges, and under
//                 the eave the water light, the wet band and the tide line; instance attribute aInk (0 slate,
//                 1 shell, 2 the falling slate, 4 and 5 slate and shell dry, for a stone lying in a bowl). A stone
//                 is shaded by the falling stone and by the stone standing up-sun of it.
//   style.makeWater(half)         the pan, three flat meshes on its outline: the window (it writes no colour and
//                 sets the depth inside the outline back to the far distance, so the images under the water
//                 show through the pan and nowhere else), the water sheet (one ink at one opacity, with ripple
//                 bars, the wave's rings, foam rings, splash rings and the stones' shadows by place and clock)
//                 and the lines 0.6 m over it (the paved tops of the causeways and of the nine platforms).
//                 FILTERED BY THE PIXEL'S FOOTPRINT (fwidth): the causeways' tops and edges, the wave's rings, the ripple bars, the tone edges' waver, the water light and the other lines drawn inside a face (salt, foam, grain, strata, veins, growth rings, tide lines, the sky's bands); a line thinner than a pixel is drawn a pixel wide at a lower cover (a causeway a pixel and a half wide, the wave's crests one), a waver finer than a pixel gives way to its mean; nothing else is sized or faded by distance.
//                 The window and the sky take depth 1 for the far distance (a plain depth buffer, not a reversed or logarithmic one).
//   style.streakGeometry(h, w)    a shadow streak for a slim thing h tall and w wide, about its foot.
//   style.makeSky(radius)         the built sky and its image: level bands, the sun disc and its three rings on a
//                 dome fixed about the board's centre (60 km, so the bands stay level from anywhere on the
//                 board), and the lower half-dome showing the same turned over; both at the far distance.
//   style.height(time), style.tau(time), style.speed(time), style.TABLE, style.LANDING, style.at(col, row).
//
// THE HERO: buildHero(ctx, opts) -> the thirty-six standing stones, the falling stone with its streamers, the
// crown of water ribbons at the touch and the veils of falling water while it lifts, each with its image, and
// (opts.ground !== false) the pan.
//   opts: style, palette, detail (0.6 to 1: thins the veils only), ground (default true), sky (default false).
//   update(dt, time): everything is a function of the time given; the camera argument is never read.
//   anchors (board coordinates): landing, neighbour (the shell stone beside it), portalSeat { position,
//   facing }, stones (foot and ink of each).
//   Also returned: style, and event { height, tau, speed, PERIOD }.
//   Size: radius 100, height 110 about the landing point (the lift goes to 526 m); the pan is 2,820 m wide.
//   No light, one 19 by 19 texture.

import * as THREE from 'three';

export const SP = 140;                       // metres between lines
export const LANDING = [15, 10];             // column, row of the stone that comes down
// column, row, ink (0 slate, 1 shell): the record's thirty-six standing stones
export const TABLE = [
  [16, 4, 0], [4, 16, 1], [3, 4, 0], [17, 16, 1], [15, 16, 0], [15, 17, 1], [14, 17, 0], [16, 17, 1], [3, 14, 0],
  [6, 17, 1], [13, 16, 0], [17, 14, 1], [9, 3, 0], [4, 10, 1], [16, 15, 0], [17, 15, 1], [3, 16, 0], [3, 17, 1],
  [2, 17, 0], [3, 15, 1], [2, 16, 0], [2, 15, 1], [4, 15, 0], [2, 14, 1], [4, 17, 0], [5, 16, 1], [4, 18, 0],
  [3, 13, 1], [10, 16, 0], [3, 7, 1], [5, 4, 0], [17, 6, 1], [17, 5, 0], [16, 6, 1], [14, 4, 0], [16, 9, 1],
];
const NEAR = [[15, 16], [15, 17], [16, 17], [16, 15], [14, 17], [16, 9]];   // stones given the finer lens
export const at = (col, row) => [(col - 10) * SP, (row - 10) * SP];

const D2R = Math.PI / 180;
const SUN = new THREE.Vector3(Math.cos(14 * D2R) * Math.sin(356 * D2R), Math.sin(14 * D2R), -Math.cos(14 * D2R) * Math.cos(356 * D2R));
const SHDIR = new THREE.Vector2(Math.sin(176 * D2R), -Math.cos(176 * D2R));   // on the ground, (x, z)
const SHADOW = 1 / Math.tan(14 * D2R);
const LENS_R = 94.7, RIM_R = 63, RIM_Y = 24, TOP_Y = 48;

// The event's clock: seconds since the touch, and the underside's height over the ground.
export const PERIOD = 30;
export const tau = (time) => (((time + 4.4) % PERIOD) + PERIOD) % PERIOD;
const ss = (x) => x * x * (3 - 2 * x);
export function height(time) {
  const t = tau(time);
  if (t <= 6) return 0;
  if (t <= 16) return 526 * ss(Math.pow((t - 6) / 10, 2.2));
  const s = PERIOD - t;
  if (s <= 8) return 18 * s;
  const x = (s - 8) / 6, a = 108 / 382;
  return 144 + 382 * (a * x + (3 - 2 * a) * x * x + (a - 2) * x * x * x);
}
export const speed = (time) => (height(time - 0.05) - height(time + 0.05)) * 10;   // metres a second downward

const NAMES = ['kerb', 'ring', 'dust', 'ground', 'ripple', 'plum', 'slate', 'slateLit', 'sheen', 'shell', 'shellShade', 'channel', 'violet'];
const BRIEF = ['#FFF3D0', '#FFE2A6', '#F2C36B', '#EBD0AE', '#D9B68E', '#8A6A66', '#1E1B2A', '#4A4460', '#7C7896', '#FBF3E2', '#B9A9B8', '#3A2A3C', '#8C7FA6'];
// the hour's inks: the sky's two, and for the rose and the grey-gold hour the pale bounce ink (under the eaves, on
// the bowls and the causeway walls) turned that way
const HOURS = {
  gold: { apricot: '#F6B36A', rose: '#D99A8C' },
  rose: { apricot: '#F3A586', rose: '#CF8FA0', ground: '#EBCBB6', ripple: '#D9AE98' },
  grey: { apricot: '#E8C48C', rose: '#C9A9A0', ground: '#E4D6B8', ripple: '#CEBB97' },
};

// The last lines of every vertex shader of this world: the body itself (uMir 1) or its image in the water (uMir -1,
// the same body with its height turned over about the water's level; its inks are worked out from the body's own
// place and normal, so a body and its image agree at the waterline). The image wavers as an image in water does:
// each of its points is carried a little down and up the wind by its own place and the clock, the more the higher
// the point it mirrors stands over the water, and not at all at the waterline.
export const PROJ = `vec4 wm = vec4(w.x, w.y * uMir, w.z, w.w);
  if (uMir < 0.) {
    float sway = min(w.y, 600.) * (.012 * sin(dot(w.xz, vec2(.11, .05)) + w.y * .22 - uTime * 1.3) + .007 * sin(dot(w.xz, vec2(-.04, .17)) - uTime * 2.1));
    wm.x += .94 * sway; wm.z += .342 * sway;
  }
  gl_Position = projectionMatrix * viewMatrix * wm;`;

// The fragment chunk shared by those inks.
const GLSL = /* glsl */`
uniform vec3 uSun;
uniform vec4 uStone;   // x, underside height, z of the falling stone; w: seconds since the touch
uniform float uTime;
uniform sampler2D tBoard; uniform vec2 uShDir;
// How far a ray from p toward the sun runs inside the lens standing on foot (below zero: it misses).
float lensOver(vec3 p, vec3 foot){
  vec3 a = p - foot - vec3(0., ${(TOP_Y - LENS_R).toFixed(1)}, 0.), b = p - foot - vec3(0., ${LENS_R.toFixed(1)}, 0.);
  float ba = dot(a, uSun), bb = dot(b, uSun);
  float da = ba * ba - dot(a, a) + ${(LENS_R * LENS_R).toFixed(2)}, db = bb * bb - dot(b, b) + ${(LENS_R * LENS_R).toFixed(2)};
  if (da <= 0. || db <= 0.) return -1.;
  float sa = sqrt(max(da, 0.)), sb = sqrt(max(db, 0.));
  return min(-ba + sa, -bb + sb) - max(max(-ba - sa, -bb - sb), 0.);
}
float castOver(vec3 p){ return lensOver(p, vec3(uStone.x, uStone.y, uStone.z)); }
// The same for the standing stones: the two crossings whose stone could stand between p and the sun are
// looked up in the board's table (red: 1 a standing stone, .5 the seat of the falling one). self: a foot to skip.
float standAt(vec3 p, vec2 c, vec2 self){
  if (c.x < -.5 || c.x > 18.5 || c.y < -.5 || c.y > 18.5) return -1.;
  vec2 foot = (c - 9.) * ${SP.toFixed(1)};
  if (textureLod(tBoard, (c + .5) / 19., 0.).r < .75 || abs(foot.x - self.x) + abs(foot.y - self.y) < 1.) return -1.;
  return lensOver(p, vec3(foot.x, 0., foot.y));
}
float standOver(vec3 p, vec2 self){
  vec2 g = p.xz + uShDir * (max(p.y, 0.) * ${SHADOW.toFixed(3)});
  float j = floor((g.y + 14.) / ${SP.toFixed(1)} + 9.);
  float za = g.y - (j - 9.) * ${SP.toFixed(1)}, k = uShDir.x / max(uShDir.y, 1e-3) / ${SP.toFixed(1)};
  vec2 ca = vec2(floor(g.x / ${SP.toFixed(1)} + 9.5 - za * k), j), cb = vec2(floor(g.x / ${SP.toFixed(1)} + 9.5 - (za + ${SP.toFixed(1)}) * k), j - 1.);
  return max(standAt(p, ca, self), standAt(p, cb, self));
}
float castShade(vec3 p){ return step(0.02, max(castOver(p), standOver(p, vec2(1e6)))); }
vec3 inkStep(vec3 n, vec3 lit, vec3 mid, vec3 dark, float shd){
  float d = dot(n, uSun);
  return d > .42 && shd < .5 ? lit : (d > .02 && shd < .5 ? mid : dark);
}
`;
const VERT = /* glsl */`
uniform float uMir, uTime;
varying vec3 vW; varying vec3 vN;
#ifdef USE_COLOR
varying vec3 vC;
#endif
void main(){
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  #ifdef USE_COLOR
  vC = color;
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz; vN = mat3(modelMatrix) * n;
  ${PROJ}
}
`;

// One stone: a lathe of the lower cap, a rim fillet of 1 m and the upper cap, with true normals (cap: the rows of
// each cap, when given).
function lensGeometry(seg = 112, cap = 0) {
  const capN = cap || Math.max(6, Math.round(seg / 9)), filN = seg >= 96 ? 5 : 3, rho = 1.0;
  const cy = LENS_R - RIM_Y, rc = Math.sqrt((LENS_R - rho) * (LENS_R - rho) - cy * cy), k = RIM_R / (rc + rho);
  const phiT = Math.atan2(rc, cy), prof = [];                       // each: radius, height, normal r, normal y
  for (let i = 0; i <= capN; i++) { const f = phiT * i / capN; prof.push([LENS_R * Math.sin(f), LENS_R * (1 - Math.cos(f)), Math.sin(f), -Math.cos(f)]); }
  for (let i = 1; i < filN; i++) { const a = (-1 + 2 * i / filN) * (Math.PI / 2 - phiT); prof.push([rc + rho * Math.cos(a), RIM_Y + rho * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  for (let i = capN; i >= 0; i--) { const f = phiT * i / capN; prof.push([LENS_R * Math.sin(f), TOP_Y - LENS_R * (1 - Math.cos(f)), Math.sin(f), Math.cos(f)]); }
  const rows = prof.length, pos = new Float32Array(rows * (seg + 1) * 3), nor = new Float32Array(rows * (seg + 1) * 3), idx = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), o = (j * (seg + 1) + i) * 3, p = prof[j];
    pos[o] = p[0] * k * c; pos[o + 1] = p[1]; pos[o + 2] = p[0] * k * s;
    nor[o] = p[2] * c; nor[o + 1] = p[3]; nor[o + 2] = p[2] * s;
  }
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < seg; i++) {
    const a = j * (seg + 1) + i, b = a + seg + 1;
    if (j > 0) idx.push(a, b, a + 1);
    if (j < rows - 2) idx.push(a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, RIM_Y, 0), RIM_R + 1);
  return g;
}

const LENS_VERT = /* glsl */`
attribute float aInk; uniform float uMir, uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vInk;
void main(){
  vec4 p = vec4(position, 1.); vL = position; vInk = aInk; vN = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p; vN = mat3(instanceMatrix) * normal;   // a tilted stone of a heap keeps its true normals
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz;
  ${PROJ}
}
`;
// A stone's ink: flat tones chosen by the face's own normal against the fixed sun and the sky's up, never by the
// eye. Upper cap of slate: a sheen band on the sun's side of the crown, lit on the flank toward the sun below
// the crown, half (also all over the crown, which looks at the sky: from above a slate stone is one deep
// blue-black), shade. Upper cap of shell: its palest ink over the crown and the side toward the sun (from above
// a shell stone is white), then four steps down round the side turned from the sun. Underside: half where the
// low sun creeps under the eave, then two warm tones of the ground's bounce. A thin even line on the rim toward
// the sun (all round a stone lying in a bowl), 1 m tall, one tone lighter than the lit ink (never the pure white). Slate carries level strata rings one tone lighter than what they cross and a pale vein or two; shell
// carries parallel grain bands one tone darker (fainter on its palest ink) and three broad growth rings round the crown. THE EDGE BETWEEN TWO
// TONES IS A FINE WAVERING LINE: the step is carried to and fro across the edge by a smooth wave of the stone's own
// place whose phase runs on with the bands, 0.3 m either way at the most and with crests 2 to 2.6 m apart, so no
// edge runs as one straight seam across the bands and none has a corner. On the underside of a stone of the board: a slow net of water light in two tones, by
// the stone's own place and the clock, widest at the waterline (and fainter the higher the falling stone hangs),
// a dark wet band up to 6.5 m and a pale tide line over it. Rings, bands, veins, nets and lines are filtered by
// the pixel's footprint (fwidth). The steps between the tones breathe by the clock (the light over the domes).
// aInk: 0 slate, 1 shell, 2 the falling slate; 4 and 5 the same two inks dry, for a stone lying in a bowl.
const LENS_FRAG = /* glsl */`
${GLSL}
uniform vec3 cSlate, cSlateHalf, cSlateLit, cSheen, cShell, cShellHalf, cShellShade, cWhite, cViolet, cGround, cKerb;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vInk;
float lcov(float dist, float hw, float f){ return clamp((max(hw, .6 * f) - dist) / f + .5, 0., 1.) * clamp(2.4 * hw / f, 0., 1.); }
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  float dry = step(3.5, vInk), kind = vInk - 4. * dry;
  bool slate = kind < .5 || kind > 1.5, upper = vL.y > ${RIM_Y.toFixed(1)};
  vec2 foot = floor((vW.xz - vL.xz) / ${SP.toFixed(1)} + .5) * ${SP.toFixed(1)};     // the stone's own crossing
  float shd = step(.3, max(kind > 1.5 ? -1. : castOver(vW), standOver(vW, foot)));
  float d0 = dot(n, uSun), fy = max(fwidth(vL.y), 1e-4);
  float ang = atan(vL.z, abs(vL.x) < 1e-4 ? 1e-4 : vL.x), hs = fract(sin(dot(foot, vec2(.0131, .0173))) * 91.7);
  // the bands: slate's strata rings (level, each wandering a little), shell's grain (parallel, in a direction fixed
  // by the stone's own place)
  float ga = hs * 6.2832;
  float g = slate ? (vL.y + .9 * sin(ang * 3. + vL.y * .3) + .5 * sin(ang * 7. + 2.)) / 4.6
                  : (dot(vL.xz, vec2(cos(ga), sin(ga))) + vL.y * .45 + 2.2 * sin(vL.y * .21 + ga)) / 3.4;
  float fg = max(fwidth(g), 1e-4), bid = floor(g + .5);
  // the light over the domes: the steps between the tones glide a few metres to and fro as the light breathes, in
  // slow waves that drift down the wind across the board, by place and clock; and the edge's own fine waver (wv:
  // -1..1, gone where a pixel is wider than a crest; 0.0032 of the step is 0.3 m on a cap of this radius)
  float fp = fwidth(vL.x) + fwidth(vL.y) + fwidth(vL.z);
  float wv = (.55 * sin(dot(vL, vec3(2., .9, 1.)) + 6.2832 * g) + .45 * sin(dot(vL, vec3(-1.2, 1.4, 2.5)) - 3.1416 * g + 1.7)) * clamp(1.6 - fp * 1.3, 0., 1.);
  float d = d0 + .065 * sin(uTime - dot(vW.xz, vec2(.94, .342)) * .018) + .028 * sin(uTime * 1.9 + dot(vW.xz, vec2(-.342, .94)) * .031)
    + .0032 * sqrt(max(1. - d0 * d0, 0.)) * wv;
  float ny = n.y + .0014 * wv;
  // the tone: slate 4 sheen, 3 lit, 2 half, 1 shade; shell 4 lit, 3, 2 half, 1, 0 shade (5 the sheen);
  // on the underside 2 half, 0 the near bounce, -1 the deep bounce
  float t;
  if (upper) {
    if (slate) {
      t = (d > .42 && ny < .9) ? 3. : ((d > .03 || ny > .9) ? 2. : 1.);
      if (d > .5 && d < .6 && n.y > .88) t = 4.;
      if (shd > .5) t = 1.;
    } else {
      t = d > .2 ? 4. : (d > -.05 ? 3. : (d > -.25 ? 2. : (d > -.4 ? 1. : 0.)));
      if (d > .5 && d < .6 && n.y > .88) t = 5.;
      if (shd > .5) t = 0.;
    }
  } else {
    t = d > .25 ? 2. : (d > -.12 ? 0. : -1.);
    if (shd > .5) t = -1.;
  }
  float rim = clamp((max(.5, .5 * fy) - abs(vL.y - ${RIM_Y.toFixed(1)})) / fy + .5, 0., 1.) * clamp(1.2 / fy, .5, 1.) * max(step(.3, d0), dry) * (1. - shd);
  // the fields of the veins, the growth rings and the water light, with their footprints: taken here, for every
  // pixel, so that no derivative is asked for inside a branch
  vec2 vd = vec2(cos(ga * 1.7 + 1.), sin(ga * 1.7 + 1.));
  float v1 = dot(vL.xz, vd) + 7. * sin(dot(vL.xz, vec2(-vd.y, vd.x)) * .06 + ga) + vL.y * .7 - 30. * (hs - .5);
  float v2 = dot(vL.xz, vec2(-vd.y, vd.x)) * .8 + dot(vL.xz, vd) * .6 + 5. * sin(vL.y * .2 + ga * 3.) + 22.;
  float fv1 = max(fwidth(v1), 1e-4), fv2 = max(fwidth(v2), 1e-4);
  float rr = length(vL.xz) + 1.3 * sin(ang * 5. + ga) + .8 * sin(ang * 9. - ga * 2.), fr = max(fwidth(rr), 1e-4);
  vec2 q = (vL.xz + foot * .37) * .36; float T = uTime * .5;
  float a = sin(q.x + 1.5 * sin(q.y * .63 + T) + .6 * sin(q.y * 1.9 - T * 1.3)), b = sin(q.y * 1.13 + 1.5 * sin(q.x * .71 - T * .8) + 2. + .6 * sin(q.x * 2.1 + T * 1.1));
  float fa = max(fwidth(a), 1e-4), fb = max(fwidth(b), 1e-4);
  vec3 col, netA, netB, wet;
  if (slate) {
    float wd = .055 + .03 * sin(bid * 3.7);
    float ring = (1. - smoothstep(wd, wd + fg, abs(fract(g) - .5))) * clamp(1.2 - fg * 1.5, .3, 1.);
    vec3 bounce = mix(cSlate, cGround, .2), deep = mix(cSlate, cGround, .09);
    col = t > 3.5 ? cSheen : (t > 2.5 ? cSlateLit : (t > 1.5 ? cSlateHalf : (t > .5 ? cSlate : (t > -.5 ? bounce : deep))));
    vec3 up = t > 2.5 ? cSheen : (t > 1.5 ? cSlateLit : (t > .5 ? cSlateHalf : (t > -.5 ? mix(cSlate, cGround, .34) : bounce)));
    col = mix(col, up, ring);
    // a pale vein across the stone, and on every other stone a second one, each wandering
    float vein = max(lcov(abs(v1), .5, fv1), step(.5, fract(hs * 7.)) * lcov(abs(v2), .38, fv2));
    col = mix(col, mix(cSheen, cKerb, .3), .8 * vein * (upper ? 1. : .5));
    col = mix(col, mix(cSheen, cKerb, .2), rim);
    netA = mix(cSlateLit, cKerb, .6); netB = mix(cSlate, cGround, .42); wet = cSlate * .55;
  } else {
    float wd = .13 + .05 * sin(bid * 2.4 + ga);
    float line = (1. - smoothstep(wd, wd + fg, abs(fract(g) - .5))) * clamp(1. - fg * 1.6, .32, 1.);
    vec3 bounce = mix(cShellShade, cGround, .5), deep = mix(cShellShade, cGround, .22), dark = mix(cShellShade, cViolet, .4);
    vec3 s3 = mix(cShell, cShellHalf, .5), s1 = mix(cShellHalf, cShellShade, .5);
    col = t > 4.5 ? cWhite : (t > 3.5 ? cShell : (t > 2.5 ? s3 : (t > 1.5 ? cShellHalf : (t > .5 ? s1 : (t > -.25 ? (upper ? cShellShade : bounce) : deep)))));
    vec3 dn = t > 4.5 ? cShell : (t > 3.5 ? cShellHalf : (t > 2.5 ? s1 : (t > 1.5 ? cShellShade : (t > .5 ? dark : (t > -.25 ? (upper ? dark : deep) : mix(cShellShade, cViolet, .3))))));
    col = mix(col, dn, line * (upper && t > 3.5 ? .4 : .8));
    // three broad growth rings round the crown, each wandering, in a warm pale tone of what they cross
    if (upper) {
      float grow = max(max(lcov(abs(rr - 13.), .8, fr), lcov(abs(rr - 26.), 1., fr)), lcov(abs(rr - 40.), .8, fr));
      col = mix(col, mix(col, cGround, .55) * .96, grow);
    }
    col = mix(col, mix(cShell, cKerb, .6), rim);
    netA = mix(cShell, cKerb, .5); netB = mix(cShell, cGround, .3); wet = mix(cShellShade, cViolet, .55) * .8;
  }
  if (!upper && dry < .5) {
    // water light under the eave: two sets of wavering bright bands that cross as a net and slide slowly, by the
    // stone's own place and the clock; the bands are widest at the waterline
    float lift = kind > 1.5 ? exp(-uStone.y / 45.) : 1.;
    float hw = (.3 - .24 * clamp(vL.y / ${RIM_Y.toFixed(1)}, 0., 1.)) * lift * (1. - .5 * shd);
    float core = max(lcov(abs(a), hw * .45, fa), lcov(abs(b), hw * .45, fb)), halo = max(lcov(abs(a), hw, fa), lcov(abs(b), hw, fb));
    col = mix(col, netB, .75 * halo); col = mix(col, netA, .9 * core);
    // the wet band and the tide line
    float hh = vL.y + .5 * sin(ang * 6. + ga) + .3 * sin(ang * 13. - ga);
    col = mix(col, wet, .6 * clamp((6.5 - hh) / fy + .5, 0., 1.));
    col = mix(col, mix(cShell, cWhite, .4), lcov(abs(hh - 7.6), .42, fy) * (1. - .4 * shd));
  }
  gl_FragColor = vec4(col, 1.);
}
`;
const INK_FRAG = /* glsl */`
${GLSL}
uniform vec3 cLit, cHalf, cShade; uniform float uMir;
varying vec3 vW; varying vec3 vN;
#ifdef USE_COLOR
varying vec3 vC;
#endif
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  #ifdef DOUBLE_SIDED
  if (gl_FrontFacing == (uMir < 0.)) n = -n;       // a two-sided ink: the face turned away takes the normal turned over
  #endif
  vec3 col = inkStep(n, cLit, cHalf, cShade, castShade(vW));
  #ifdef USE_COLOR
  col *= vC;
  #endif
  gl_FragColor = vec4(col, 1.);
}
`;

// The water sheet: one flat ink at one opacity over the whole pan, laid over the built image of the world beneath
// it. On it, by place and clock only: patches of thin pale ripple bars, the wave's swell and rings, a thin line of salt
// along both waterlines of every causeway and round every platform, the foam ring where a stone's underside
// meets the water, small splash rings under the lifting stone, and every stone's shadow and the shade of every
// causeway running east as one darker ink. Each mark is filtered by the pixel's footprint on the water (fwidth of the
// place). The sheet is written ready for blending: its colour times its cover, and what it lets through.
const MARKS = /* glsl */`
float h1(vec2 v){ return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }
float cov(float d, float hw, float f){ return clamp((hw - d) / f + .5, 0., 1.); }
`;
const WATER_FRAG = /* glsl */`
${GLSL}
${MARKS}
uniform vec3 cWater, cBar, cFoam, cShadow, cDark; uniform float uOpacity; uniform vec2 uLand;
varying vec3 vW;
// ripple bars: thin pale crests lying across the breeze that comes over the water from the north, travelling
// down it, each a row of lengths with gaps: a sparse set 30 m apart everywhere, and a fainter fine set 7.5 m apart
// shown only inside wide patches that drift down the breeze at 4 m a second (where a breath of wind touches the
// still water)
float crest(float al, float ac, float gap, float hw, float v, float fa){
  float c = (al - uTime * v + .3 * gap * sin(ac * .33 / gap + gap)) / gap, n = floor(c);
  float cut = step(.42, fract(ac / (4. * gap + 60.) + h1(vec2(n, gap)) * 5. + uTime * .01 * v));      // each crest is a row of lengths
  return cut * cov(abs(c - n - .5) * gap, max(hw, .5 * fa), fa) * clamp(3.4 * hw / fa, 0., 1.);
}
float bars(vec2 p){
  vec2 wd = vec2(.17, .985);
  float al = dot(p, wd), ac = dot(p, vec2(-wd.y, wd.x)), fa = max(fwidth(al), 1e-3);
  vec2 g = vec2(al - uTime * 4., ac) / vec2(170., 260.);
  float gust = sin(g.x * 1.7 + 1.3 * sin(g.y * 2.1 + .6)) + sin(g.y * 2.9 + 1.1 * sin(g.x * 1.3 + 2.));
  // and one more sparse set, fainter, 38 m apart, coming across the first from the east
  vec2 we = vec2(-.96, .28);
  float bl = dot(p, we), fb = max(fwidth(bl), 1e-3);
  return max(max(.5 * smoothstep(.3, .7, gust) * crest(al, ac, 7.5, .3, 1.8, fa), crest(al, ac + 300., 30., .24, 2.4, fa)),
    .6 * crest(bl, dot(p, vec2(-we.y, we.x)) + 170., 38., .22, 2., fb));
}
void lay(inout vec3 C, inout float T, vec3 c, float a){ C = C * (1. - a) + c * a; T *= 1. - a; }
void main(){
  vec2 p = vW.xz;
  vec2 f2 = max(fwidth(p), vec2(1e-3)); float fc = max(f2.x, f2.y);
  vec2 q = p / ${SP.toFixed(1)} + 9.;
  vec2 cell = clamp(floor(q + .5), 0., 18.);
  vec2 d = (q - cell) * ${SP.toFixed(1)};
  float r = length(d);
  vec4 brd = textureLod(tBoard, (cell + .5) / 19., 0.);
  vec3 P = vec3(p.x, 0., p.y);
  float ov = max(castOver(P), standOver(P, vec2(1e6)));
  float sh = clamp(ov / max(fwidth(ov), .05), 0., 1.);            // 1 under a stone's shadow, its edge one pixel soft
  vec3 C = cWater * uOpacity; float T = 1. - uOpacity;

  // a causeway's own shadow: 0.6 m of wall lays 2.4 m of shade on the water along the south bank of one running east
  float bank = cov(abs(d.y - 3.7), 1.2, f2.y) * clamp(2.4 / f2.y, 0., 1.) * (1. - cov(abs(d.x), 2.5, f2.x));
  lay(C, T, cShadow, .5 * max(sh, bank));                         // the shadow lies on the sheet, under every mark
  lay(C, T, cBar, .6 * (1. - .3 * sh) * bars(p));

  // the wave: a swell running out from the rim at 90 m a second and fading with its age (to less than half its
  // strength by 20 s after the touch): a pale face 13 to 31 m wide before a bright crest, a darker trough 11 to
  // 25 m wide behind it, a second thinner crest behind the trough and one faint ring following; the widths swell
  // and thin round the ring by place and the whole ring wanders up to 3 m off the round. No crest is drawn
  // thinner than a pixel, no band thinner than four.
  vec2 wq = p - uLand;
  float dl = length(wq), fl = max(fwidth(dl), 1e-3), front = ${RIM_R.toFixed(1)} + 90. * uStone.w;
  float wa = atan(wq.y, abs(wq.x) < 1e-4 ? 1e-4 : wq.x);
  float swell = .5 + .5 * sin(wa * 5. + 1.3 + .35 * sin(wa * 11.)), swell2 = .5 + .5 * sin(wa * 8. - 2.1);
  float lw = max(3.2, 1.05 * fl), st = (1. - .4 * smoothstep(900., 2000., dl)) * (1. - .55 * smoothstep(5., 20., uStone.w));
  float wr = dl - front - 3. * sin(wa * 9. + .7) * clamp(3.2 / fl, 0., 1.);
  float face = max(6.5 + 9. * swell, 2. * fl), trough = max(5.5 + 7. * swell2, 2. * fl);
  lay(C, T, cFoam, .3 * st * cov(abs(wr - face), face, fl));
  lay(C, T, cDark, .5 * st * cov(abs(wr + trough), trough, fl));
  float crest = cov(abs(wr), lw * (.55 + .9 * swell), fl), crest2 = cov(abs(wr + 2. * trough + lw), lw * (.55 + .4 * swell2), fl);
  lay(C, T, cFoam, st * max(max(.9 * crest, .6 * crest2), .3 * cov(abs(wr + 2. * trough + 18.), .55 * lw, fl)));
  // where it crosses a causeway it breaks: white flecks on the water for some metres either side, each lasting a
  // third of a second; where a fleck is smaller than a pixel, their mean
  float nearC = 1. - smoothstep(4., 11., min(abs(d.x), abs(d.y))), brk = cov(abs(wr + trough), trough + lw, fl);
  if (nearC * brk > 0.) {
    float fk = step(.52, h1(floor(p / 1.7) + floor(uTime * 3.) * 7.31)) * cov(length(fract(p / 1.7) - .5) * 1.7, .55, fc);
    lay(C, T, cFoam, st * nearC * brk * mix(fk, .3, smoothstep(.6, 1.6, fc / 1.7)));
  }

  // salt: a thin pale line along both waterlines of every causeway, wandering a little, and round each platform
  vec2 sw = 2.95 + .22 * sin(p.yx * .9 + cell * 1.7) + .12 * sin(p.yx * 2.3);
  vec2 sl2 = vec2(cov(abs(abs(d.x) - sw.x), max(.2, .5 * f2.x), f2.x) * clamp(.8 / f2.x, 0., 1.), cov(abs(abs(d.y) - sw.y), max(.2, .5 * f2.y), f2.y) * clamp(.8 / f2.y, 0., 1.));
  float starW = step(abs(fract((cell.x - 3.) / 6. + .5) - .5), .05) * step(abs(fract((cell.y - 3.) / 6. + .5) - .5), .05);
  float salt = max(sl2.x * step(sw.y, abs(d.y)), sl2.y * step(sw.x, abs(d.x))) * (1. - starW * step(r, 18.4));
  salt = max(salt, starW * cov(abs(r - 18.5), max(.22, .5 * fc), fc) * clamp(.8 / fc, 0., 1.) * step(3., min(abs(d.x), abs(d.y))));
  lay(C, T, cFoam, .8 * salt * (1. - .35 * sh));

  // foam where a stone's underside meets the water: a thin wandering ring; a second ring runs out from it when the
  // wave reaches that stone. The falling stone has its ring only while it is seated.
  float ang = atan(d.y, abs(d.x) < 1e-4 ? 1e-4 : d.x);
  float has = brd.r > .75 ? 1. : (brd.r > .25 ? step(uStone.y, .6) : 0.);
  float r0 = 11.6 + .55 * sin(ang * 5. + uTime * .6 + cell.x * 1.7) + .3 * sin(ang * 11. - uTime * .9 + cell.y);
  float foam = cov(abs(r - r0), max(.42, .5 * fc), fc) * clamp(1.7 / fc, 0., 1.);
  float tc = uStone.w - (length((cell - 9.) * ${SP.toFixed(1)} - uLand) - ${RIM_R.toFixed(1)}) / 90.;
  if (tc > 0. && tc < 4.) foam = max(foam, (1. - tc / 4.) * cov(abs(r - r0 - tc * 7.), max(.5, .5 * fc), fc) * clamp(1.7 / fc, 0., 1.));
  lay(C, T, cFoam, has * foam);

  // under the lifting stone: small rings where its falling water strikes the sheet
  float env = smoothstep(6.3, 7.2, uStone.w) * (1. - smoothstep(12., 13.8, uStone.w));
  if (env > 0. && dl < 58.) {
    vec2 g = (p - uLand) / 7., id = floor(g);
    float tt = fract(uTime * .8 + h1(id) * 7.);
    float ring = cov(abs(length((g - id - .5) * 7.) - tt * 3.2), max(.25, .5 * fc), fc) * (1. - tt) * step(.35, h1(id + 3.)) * clamp(1.2 / fc, 0., 1.);
    lay(C, T, cFoam, ring * env);
  }
  gl_FragColor = vec4(C, 1. - T);
}
`;
// The lines: one sheet 0.6 m over the water that is drawn only where a causeway or a platform lies: the paved top
// of the built causeways (their side walls and posts are bodies of the world file). A causeway is 5 m wide and
// never drawn thinner than a pixel and a half. Its top is paved: two rows of slabs 3.6 m long, laid in bond, in
// two close dark tones chosen by the slab's own place, with dark joints; where a slab is smaller than two and a
// half pixels the top is the one mean ink. A pale kerb course runs along the sun's side (the north bank of one
// running east, the west bank of one running north). The nine marked points are dark round platforms 36 m across
// (never drawn under 1.8 pixels across), paved in rings, with a pale rim all round, 1.6 m wide and never drawn at less than half its ink. The wave breaks in white flecks where it crosses them; a stone's shadow darkens them.
const LINES_FRAG = /* glsl */`
${GLSL}
${MARKS}
uniform vec3 cChan, cChan2, cKerb, cShell, cShadeMul; uniform vec2 uLand;
varying vec3 vW;
void main(){
  vec2 p = vW.xz;
  vec2 f2 = max(fwidth(p), vec2(1e-3)); float fc = max(f2.x, f2.y);
  vec2 q = p / ${SP.toFixed(1)} + 9.;
  vec2 cell = clamp(floor(q + .5), 0., 18.);
  vec2 d = (q - cell) * ${SP.toFixed(1)}, ad = abs(d);
  float r = length(d);
  float star = step(abs(fract((cell.x - 3.) / 6. + .5) - .5), .05) * step(abs(fract((cell.y - 3.) / 6. + .5) - .5), .05);
  vec2 hw = max(vec2(2.5), f2 * .78);
  vec2 fade = 1. - .4 * smoothstep(vec2(30.), vec2(150.), f2);
  float wX = cov(ad.x, hw.x, f2.x) * fade.x, wZ = cov(ad.y, hw.y, f2.y) * fade.y;
  float eX = cov(abs(d.x + 2.), max(.4, .5 * f2.x), f2.x) * clamp(1.1 / f2.x, 0., 1.);
  float eZ = cov(abs(d.y + 2.), max(.4, .5 * f2.y), f2.y) * clamp(1.3 / f2.y, 0., 1.);
  float edge = max(eX * (1. - cov(ad.y, 1.6, f2.y)), eZ * (1. - cov(ad.x, 1.6, f2.x)));
  float disc = star * cov(r, max(18., .9 * fc), fc);
  float rim = star * cov(abs(r - 17.3), max(.8, .55 * fc), fc) * clamp(3.2 / fc, .5, 1.);
  float a = max(max(wX, wZ), disc);
  edge = max(edge * (1. - star * cov(r, 16.4, fc)), rim);
  // the paving: slabs by place. On a causeway: the place along it and the row across it; on a platform: rings 3 m
  // wide cut into slabs round the centre
  bool nx = wX > wZ; float alo = nx ? p.y : p.x, acr = nx ? d.x : d.y, id = nx ? cell.x : cell.y + 31.;
  float row = step(0., acr), sl = alo / 3.6 + row * .5, fs = (nx ? f2.y : f2.x) / 3.6;
  float tone = h1(vec2(floor(sl), id + row * 7.)), joint = max(cov(.5 - abs(fract(sl) - .5), .022, fs), cov(abs(acr), .08, nx ? f2.x : f2.y));
  if (star * cov(r, 17., fc) > .5) {
    float ri = floor(r / 3.), n = 5. + 6. * ri, an = atan(d.y, abs(d.x) < 1e-4 ? 1e-4 : d.x) / 6.2832 * n + ri * .37;
    fs = fc * n / (6.2832 * max(r, 1.));
    tone = h1(vec2(floor(an), ri + cell.x * 3. + cell.y * 11.));
    joint = max(cov(.5 - abs(fract(an) - .5), .012 * n / max(r, 1.), fs), cov(.5 - abs(fract(r / 3.) - .5), .027, fc / 3.));
  }
  float fine = clamp(1.7 - fs * 4.2, 0., 1.);                    // 1 where a slab is plain to see, 0 where it is under two and a half pixels
  vec3 top = mix(mix(cChan, cChan2, .5), mix(tone > .5 ? cChan2 : cChan, cChan * .62, joint), fine);
  // lengths of the kerb course take the paler ink in turn, sliding slowly along the bank
  vec3 ecol = mix(cKerb, cShell, step(.5, fract(alo / 31. + h1(vec2(id, 2.)) * 7. - uTime * .09)));
  vec3 col = mix(top, ecol, edge);
  // (the wave's ring as the water sheet draws it: wandering up to 3 m off the round, breaking over its trough)
  vec2 wq = p - uLand;
  float dl = length(wq), fl = max(fwidth(dl), 1e-3), front = ${RIM_R.toFixed(1)} + 90. * uStone.w, lw = max(3.2, 1.05 * fl);
  float wa = atan(wq.y, abs(wq.x) < 1e-4 ? 1e-4 : wq.x);
  float wr = dl - front - 3. * sin(wa * 9. + .7) * clamp(3.2 / fl, 0., 1.), trough = max(5.5 + 7. * (.5 + .5 * sin(wa * 8. - 2.1)), 2. * fl);
  float brk = cov(abs(wr + trough), trough + lw, fl) * (1. - .4 * smoothstep(900., 2000., dl)) * (1. - .55 * smoothstep(5., 20., uStone.w));
  col = mix(col, cShell, brk * mix(step(.42, h1(floor(p / 1.4) + floor(uTime * 3.) * 5.17)), .55, smoothstep(.6, 1.6, fc / 1.4)));
  vec3 P = vec3(p.x, .6, p.y);
  float ov = max(castOver(P), standOver(P, vec2(1e6)));
  col = mix(col, col * cShadeMul, clamp(ov / max(fwidth(ov), .05), 0., 1.));
  if (a < .004) discard;                                         // after every derivative above
  gl_FragColor = vec4(col, a);
}
`;

// The built sky: level bands by height over a fixed centre, the sun disc and three flat rings round it.
const SKY_FRAG = /* glsl */`
uniform vec3 uSun; uniform vec3 cApricot, cRose, cViolet, cKerb, cWater, cDust, cMist; uniform float uMir, uTime;
varying vec3 vP;
void main(){
  vec3 dir = vP / max(length(vP), 1e-3); dir.y *= uMir;
  if (uMir < 0.) {                       // the image wavers: its heights go up and down a little by bearing and clock
    float az = atan(dir.z, abs(dir.x) < 1e-5 ? 1e-5 : dir.x);
    dir.y += .008 * sin(az * 23. + dir.y * 9. - uTime * 1.1) + .004 * sin(az * 61. - uTime * 1.7);
    dir = dir / max(length(dir), 1e-4);
  }
  float e = degrees(asin(clamp(dir.y, -1., 1.))), fe = max(fwidth(e), 1e-4);
  vec3 col = cMist;
  col = mix(col, cApricot, clamp((e + .0) / fe + .5, 0., 1.));
  col = mix(col, mix(cApricot, cRose, .45), clamp((e - 4.) / fe + .5, 0., 1.));
  col = mix(col, cRose, clamp((e - 9.) / fe + .5, 0., 1.));
  col = mix(col, mix(cRose, cViolet, .4), clamp((e - 16.) / fe + .5, 0., 1.));
  col = mix(col, mix(cRose, cViolet, .72), clamp((e - 26.) / fe + .5, 0., 1.));
  col = mix(col, cViolet, clamp((e - 40.) / fe + .5, 0., 1.));
  float a = degrees(acos(clamp(dot(dir, uSun), -1., 1.))), fa = max(fwidth(a), 1e-4), up = step(0., e);
  col = mix(col, cApricot, up * clamp((16. - a) / fa + .5, 0., 1.));
  col = mix(col, cDust, up * clamp((9.5 - a) / fa + .5, 0., 1.));
  col = mix(col, cWater, up * clamp((5. - a) / fa + .5, 0., 1.));
  col = mix(col, cKerb, up * clamp((2. - a) / fa + .5, 0., 1.));
  gl_FragColor = vec4(col, 1.);
}
`;

export function makeStyle(ctx, opts = {}) {
  const hex = (opts.palette && opts.palette.length >= 13) ? opts.palette : BRIEF;
  const hr = (ctx.rng.fork ? ctx.rng.fork('hour') : ctx.rng)();
  const hour = HOURS[opts.hour] ? opts.hour : (hr < 0.5 ? 'gold' : hr < 0.8 ? 'rose' : 'grey');
  const palette = {};
  NAMES.forEach((n, i) => { palette[n] = new THREE.Color(hex[i]); });
  for (const k in HOURS[hour]) palette[k] = new THREE.Color(HOURS[hour][k]);
  const mixc = (a, b, t) => a.clone().lerp(b, t);
  const [lx, lz] = at(LANDING[0], LANDING[1]);

  // the board's table for the shaders: red 1 a standing stone, .5 the falling one's seat
  const data = new Uint8Array(19 * 19 * 4);
  const cellOf = (col, row) => ((row - 1) * 19 + (col - 1)) * 4;
  for (const [c, r] of TABLE) data[cellOf(c, r)] = 255;
  data[cellOf(LANDING[0], LANDING[1])] = 128;
  const board = new THREE.DataTexture(data, 19, 19, THREE.RGBAFormat, THREE.UnsignedByteType);
  board.magFilter = board.minFilter = THREE.NearestFilter; board.generateMipmaps = false; board.needsUpdate = true;

  const uniforms = {
    uSun: { value: SUN.clone() }, uShDir: { value: SHDIR.clone() }, uTime: { value: 0 }, uMir: { value: 1 },
    uStone: { value: new THREE.Vector4(lx, 0, lz, 0) }, uFall: { value: 0 }, tBoard: { value: board },
  };
  const U = (own) => { const o = { ...uniforms }; for (const k in own) o[k] = { value: own[k] }; return o; };
  const P = palette;
  P.water = mixc(P.rose, new THREE.Color('#C98FA0'), 0.5);
  const shadeMul = new THREE.Color(0.5, 0.42, 0.5);

  const ink = (o = {}) => new THREE.ShaderMaterial({
    uniforms: U({ cLit: o.lit || P.shell, cHalf: o.half || mixc(o.lit || P.shell, o.shade || P.shellShade, 0.5), cShade: o.shade || P.shellShade }),
    vertexShader: VERT, fragmentShader: INK_FRAG, vertexColors: !!o.vertexColors, side: o.side ?? THREE.FrontSide,
  });
  const lensMaterial = new THREE.ShaderMaterial({
    uniforms: U({ cSlate: P.slate, cSlateHalf: mixc(P.slate, P.slateLit, 0.36), cSlateLit: P.slateLit, cSheen: P.sheen, cShell: P.shell,
      cShellHalf: mixc(P.shell, P.shellShade, 0.53), cShellShade: P.shellShade, cWhite: new THREE.Color('#FFFFFF'), cViolet: P.violet, cGround: P.ground, cKerb: P.kerb }),
    vertexShader: LENS_VERT, fragmentShader: LENS_FRAG,
  });
  // the water sheet: its colour is written times its cover, with what it lets through as the blend's other factor
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: U({ cWater: P.water, cBar: mixc(P.shell, new THREE.Color('#FFFFFF'), 0.3), cFoam: mixc(P.shell, new THREE.Color('#FFFFFF'), 0.5), cShadow: mixc(P.plum, P.channel, 0.6),
      cDark: mixc(P.water, P.channel, 0.6), uOpacity: 0.28, uLand: new THREE.Vector2(lx, lz) }),
    vertexShader: VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const linesMaterial = new THREE.ShaderMaterial({
    uniforms: U({ cChan: P.channel, cChan2: mixc(P.channel, P.plum, 0.3), cKerb: P.kerb, cShell: P.shell, cShadeMul: shadeMul, uLand: new THREE.Vector2(lx, lz) }),
    vertexShader: VERT, fragmentShader: LINES_FRAG, transparent: true, depthWrite: false,
  });
  // the window: the pan's own outline at the water's level, drawn before any body over the water and before every
  // image under it. It writes no colour; it sets the depth inside the outline back to the far distance (this takes
  // depth 1 for the far distance: a plain depth buffer, not a reversed or logarithmic one), so that
  // the images, which lie wholly under the water's level, show through the pan and nowhere else, whatever real
  // thing (the mist sea, a bowl's foot) lies under and beyond them.
  const windowMaterial = new THREE.ShaderMaterial({
    vertexShader: 'void main(){ vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.); gl_FragDepth = 1.; }', colorWrite: false, depthFunc: THREE.AlwaysDepth, side: THREE.DoubleSide,
  });

  // The image of a body in the water: a second mesh on the same geometry (and, for instanced bodies, the same
  // instance table) whose material differs only in uMir and in which face it draws. order: its place in the
  // drawing order, after the window and before every body over the water.
  const mirror = (mesh, order = -6) => {
    const src = mesh.material, mat = src.clone();
    mat.uniforms = { ...src.uniforms, uMir: { value: -1 } };
    mat.side = src.side === THREE.FrontSide ? THREE.BackSide : src.side === THREE.BackSide ? THREE.FrontSide : THREE.DoubleSide;
    const m = mesh.isInstancedMesh ? new THREE.InstancedMesh(mesh.geometry, mat, mesh.count) : new THREE.Mesh(mesh.geometry, mat);
    if (mesh.isInstancedMesh) m.instanceMatrix = mesh.instanceMatrix;
    m.position.copy(mesh.position); m.quaternion.copy(mesh.quaternion); m.scale.copy(mesh.scale);
    m.frustumCulled = false; m.renderOrder = order; m.name = (mesh.name || 'body') + '-image';
    return m;
  };

  // the pan: the window, the water sheet over the images, and the lines 0.6 m over the sheet
  const makeWater = (half = 9 * SP + 150) => {
    const g = new THREE.PlaneGeometry(half * 2, half * 2, 1, 1); g.rotateX(-Math.PI / 2);
    const grp = new THREE.Group(); grp.name = 'pan';
    const win = new THREE.Mesh(g, windowMaterial); win.renderOrder = -8; win.name = 'window';
    const sheet = new THREE.Mesh(g, waterMaterial); sheet.renderOrder = 1; sheet.name = 'water';
    const lines = new THREE.Mesh(g, linesMaterial); lines.position.y = 0.6; lines.renderOrder = 2; lines.name = 'lines';
    for (const m of [win, sheet, lines]) { m.frustumCulled = false; grp.add(m); }
    return grp;
  };
  // a shadow streak about a foot at the origin: h tall, w wide, tapering down-sun, 0.06 m over the water
  const streakGeometry = (h = 11, w = 2.6) => {
    const L = h * SHADOW, px = SHDIR.y, pz = -SHDIR.x, g = new THREE.BufferGeometry();
    const v = [-px * w / 2, 0.06, -pz * w / 2, px * w / 2, 0.06, pz * w / 2,
      SHDIR.x * L + px * w * 0.15, 0.06, SHDIR.y * L + pz * w * 0.15, SHDIR.x * L - px * w * 0.15, 0.06, SHDIR.y * L - pz * w * 0.15];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    g.setIndex([0, 2, 1, 0, 3, 2]);
    return g;
  };
  // the sky and its image: the whole dome, and under the water's level the lower half of the same dome showing the
  // upper half turned over; both at the far distance, the image drawn after the window
  const makeSky = (radius = 60000) => {
    const skyU = (mir) => ({ uSun: uniforms.uSun, cApricot: { value: P.apricot }, cRose: { value: P.rose }, cViolet: { value: P.violet }, cKerb: { value: P.kerb },
      cWater: { value: P.ring }, cDust: { value: P.dust }, cMist: { value: mixc(P.apricot, P.shell, 0.55) }, uMir: { value: mir }, uTime: uniforms.uTime });
    // the dome writes its depth at .99999 of the far distance and the image is drawn at .999996 of it: the image
    // fails against the dome everywhere but inside the window, which sets the depth back to the far distance
    const mat = (mir) => new THREE.ShaderMaterial({
      uniforms: skyU(mir), fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: mir > 0,
      vertexShader: `varying vec3 vP; void main(){ vP = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = vec4(p.xy, p.w * ${mir < 0 ? '.999996' : '.99999'}, p.w); }`,
    });
    const grp = new THREE.Group(); grp.name = 'sky';
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), mat(1)); m.renderOrder = -10; m.name = 'sky-dome';
    const im = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(-1)); im.renderOrder = -7; im.name = 'sky-image';
    for (const o of [m, im]) { o.frustumCulled = false; grp.add(o); }
    return grp;
  };

  return {
    hour, palette, sun: SUN.clone(), shadowDir: SHDIR.clone(), SHADOW, SP, TABLE, LANDING, at, height, tau, speed, shadeMul,
    uniforms, glsl: GLSL, vert: VERT, proj: PROJ, board, ink, lensGeometry, lensMaterial, waterMaterial, linesMaterial,
    makeWater, streakGeometry, makeSky, mirror,
    update(dt, time) {
      uniforms.uTime.value = time; uniforms.uFall.value = (height(time - 0.8) - height(time)) / 0.8;
      uniforms.uStone.value.set(lx, height(time), lz, tau(time));
    },
    dispose() { board.dispose(); },
  };
}

// The crown: ribbons of water standing up round the rim at the touch, leaning outward, never farther than
// 75 m from the landing point. aCr: angle round the rim, place up the ribbon 0..1, place across -1..1, a seed.
// aCr2: greatest height, start (seconds after the touch), life, and 1 / 1.7 of the half width at the foot (which is 2.1 to 3.4 m). A ribbon tapers
// from its foot to a point; it rises fast, stands, and its top sinks back at a pace of its own until nothing is
// left at the end of its life; before its start and after its end it has no size. A ribbon is twisted along its
// height (2.5 radians from foot to tip, from a turn of its own), so that it shows its face from every side. Rather
// more than a third of the ribbons turn over outward at the top in a curl of 3.4 m radius at the most.
const CROWN_VERT = /* glsl */`
attribute vec4 aCr; attribute vec4 aCr2;
uniform vec4 uStone; uniform float uTime, uMir; uniform vec2 uLand;
varying vec3 vS;
void main(){
  float v = aCr.y, s = aCr.z, sd = aCr.w, t = uStone.w - aCr2.y;
  float k = clamp(t / max(aCr2.z, .1), 0., 1.), on = step(0., t) * step(t, aCr2.z);
  float q = 1. - clamp(k / .35, 0., 1.), rise = 1. - q * q, sink = 1. - smoothstep(.45 + .25 * fract(sd * 3.), 1., k);
  float curl = step(.62, fract(sd * 5.)), H = aCr2.x * rise * sink;
  float rc = min(3.4, .12 * H) * curl, vs = min(v, .7) / .7, phi = 2.5 * max(v - .7, 0.) / .3;
  float y = mix(v * H, vs * (H - 2.5 * rc) + rc * sin(phi), curl);
  float wide = 1.7 * s * aCr2.w * pow(max(1. - v, 1e-4), .6), tw = sd * 6.2832 + 2.5 * v;
  float a = aCr.x + wide * cos(tw) / 66.;
  vec3 rad = vec3(cos(a), 0., sin(a));
  float ro = 64.6 + (1.2 + mix(8., 2.4, curl) * v * v) * rise + rc * (1. - cos(phi)) + .5 * sin(v * 7. - uTime * 3. + sd * 20.) * v
    + wide * sin(tw) * (1. - .5 * v);
  vec3 p = vec3(uLand.x, 0., uLand.y) + on * (rad * ro + vec3(0., y, 0.));
  vec4 w = modelMatrix * vec4(p, 1.);
  vS = vec3(s, v, sd);
  ${PROJ}
}
`;
// A ribbon's water, drawn inside it by its place across (-1 to 1) and up (0 to 1) and by the clock, in the veils'
// two pale inks, a little see-through: a thin wash of the lower ink, thinning toward the tip, and on it three
// lines that taper with the ribbon, one down its middle to the tip and one either side ending lower, the paler
// ink running up the middle one in long dashes. FILTERED BY THE PIXEL'S FOOTPRINT: every edge is a pixel soft.
const CROWN_FRAG = /* glsl */`
uniform vec3 cPale, cUnder; uniform float uTime;
varying vec3 vS;
void main(){
  float s = vS.x, v = vS.y, sd = vS.z, fs = max(fwidth(s), 1e-3), fv = max(fwidth(v), 1e-4);
  float mid = clamp((.26 - abs(s)) / fs + .5, 0., 1.);
  float top = .55 + .3 * fract(sd * 7.);
  float side = clamp((.13 - abs(abs(s) - .68)) / fs + .5, 0., 1.) * clamp((top - v) / fv + .5, 0., 1.);
  float run = fract(v * 3. - uTime * .8 + sd * 5.), dash = .55 + .45 * smoothstep(0., .1, run) * (1. - smoothstep(.6, .8, run));
  float wash = .36 * (1. - .6 * v), line = max(.84 * mid * dash, .6 * side);
  float cover = max(wash, line);
  if (cover < .004) discard;                                     // after every derivative above
  gl_FragColor = vec4(.84 * mid * dash > max(wash, .6 * side) ? cPale : cUnder, cover);
}
`;
// The veils: water pouring off the underside while the stone lifts, in veils that hang from it along arcs about
// its axis with open gaps between them. A veil is one upright sheet from the underside down to the water, and the
// falling lines are drawn inside it by place and clock. aVeil: the angle of its middle round the axis, its
// distance from the axis, half its length as an angle, its seed (a whole number, 0 to 999); aLines: how many lines it holds (8 to 20, one
// every 1.5 m). position: x from -1 to 1 along the veil, y 1 at the underside and 0 at the water. While nothing
// of a veil is drawn (the stone seated or high) its sheet is folded flat on the water and has no area.
const VEIL_VERT = /* glsl */`
attribute vec4 aVeil; attribute float aLines;
uniform vec4 uStone; uniform float uTime, uMir; uniform vec2 uLand;
varying vec3 vV; varying vec2 vId;
void main(){
  float a = aVeil.x + position.x * aVeil.z, r = aVeil.y;
  float yU = uStone.y + ${LENS_R.toFixed(1)} - sqrt(max(${(LENS_R * LENS_R).toFixed(2)} - r * r, 0.));
  vV = vec3((position.x + 1.) * aVeil.z * r, (1. - position.y) * yU, yU);   // metres along the veil, metres under the underside, the underside's height
  vId = vec2(aVeil.w, aLines);
  float env = smoothstep(6.3, 7.2, uStone.w) * (1. - smoothstep(11.8, 13.6, uStone.w));
  vec4 w = modelMatrix * vec4(uLand.x + cos(a) * r, position.y * yU * step(.001, env), uLand.y + sin(a) * r, 1.);
  ${PROJ}
}
`;
// A veil's water, drawn inside its sheet by place and clock: every 1.5 m along it a line hangs from the underside,
// 0.5 to 2 m wide at its top and tapering to a point at its lower end, 19 to 80 m long or as far as the water,
// breathing a little; its ink (one of two pale inks by line) comes down it in long dashes, a little see-through,
// and between the lines the veil is a thin wash of the lower ink down to 0.8 of their length; under a point
// that ends over the water hang two short drops. FILTERED BY THE PIXEL'S FOOTPRINT: every edge is a pixel soft,
// and where a pixel is wider than 0.7 of a line's place in the veil the veil is one even pale wash. While the stone is
// seated or high nothing is drawn. A veil's seed and its count of lines come as whole numbers and are rounded here
// before any hash is taken of them.
const VEIL_FRAG = /* glsl */`
uniform vec4 uStone; uniform float uTime; uniform vec3 cPale, cUnder;
varying vec3 vV; varying vec2 vId;
float vh(float x){ return fract(sin(x * 127.1 + 3.7) * 43758.5453); }
void main(){
  float s = vV.x, d = vV.y, yU = vV.z, fs = max(fwidth(s), 1e-3), fd = max(fwidth(d), 1e-3);
  float env = smoothstep(6.3, 7.2, uStone.w) * (1. - smoothstep(11.8, 13.6, uStone.w));
  float i0 = floor(s / 1.5), core = 0., sheet = 0., tone = 0., drop = 0., seed = floor(vId.x + .5) * .091, lines = floor(vId.y + .5);
  for (int j = -1; j <= 1; j++) {
    float i = i0 + float(j);
    if (i < 0. || i > lines - .5) continue;
    float sd = vh(i * 1.37 + seed);
    float len = min(yU, (30. + 50. * vh(sd * 7.3 + 1.)) * (.82 + .18 * sin(uTime * (1.1 + sd) + sd * 40.)));
    float t = clamp(d / max(len, .1), 0., 1.), off = abs(s - (i + .5) * 1.5), in1 = clamp((len - d) / fd + .5, 0., 1.);
    float hw = (.25 + .75 * vh(sd * 3.1 + 2.)) * pow(max(1. - t, 0.), .6);
    float run = fract((d - uTime * (16. + 10. * sd)) / (18. + 14. * sd) + sd * 5.);
    float c = clamp((hw - off) / fs + .5, 0., 1.) * in1 * (.4 + .6 * smoothstep(0., .08, run) * (1. - smoothstep(.55, .75, run)));
    float g = len + 1. + 1.4 * vh(sd * 5. + 3.);
    float dr = clamp((.17 - off) / fs + .5, 0., 1.) * max(clamp((.55 - abs(d - g)) / fd + .5, 0., 1.), clamp((.4 - abs(d - g - 2.4)) / fd + .5, 0., 1.)) * clamp(1.4 / fd, 0., 1.);
    if (c > core) { core = c; tone = step(.4, vh(sd * 9. + 4.)); }
    sheet = max(sheet, clamp((.95 - off) / fs + .5, 0., 1.) * (1. - smoothstep(.55, .8, t)));
    drop = max(drop, dr);
  }
  float wash = smoothstep(.2, .7, fs / 1.5), a = max(max(.78 * core, .24 * sheet), .9 * drop);
  float cover = mix(a, .3, wash) * env;
  if (cover < .004) discard;                                     // after every derivative above
  vec3 col = .78 * core > .24 * sheet ? mix(cPale, cUnder, tone) : cUnder;
  gl_FragColor = vec4(mix(.9 * drop > max(.78 * core, .24 * sheet) ? cPale : col, mix(cPale, cUnder, .6), wash), cover);
}
`;
// The streamers: a few long thin ribbons of torn air standing in the sky over the stone while it comes down, each
// two strips crossed at right angles so that it shows from every side. aRib: angle round the stone's axis, place
// along 0..1, side -1..1, seed. aRib2: metres from the axis, which strip (0 across the radius, 1 along it), and
// the height of its foot over the stone's underside (12 m clear of the crown there). Length and lean go by the
// stone's speed: at rest a streamer has no length and no width.
const WAKE_VERT = /* glsl */`
attribute vec4 aRib; attribute vec3 aRib2;
uniform vec4 uStone; uniform float uTime, uFall, uMir;
varying vec3 vW; varying vec3 vN; varying vec3 vR;
void main(){
  float v = aRib.y, sd = aRib.w, sp = clamp(uFall, 0., 40.), s2 = fract(sd * 7.3);
  vec3 rad = vec3(cos(aRib.x), 0., sin(aRib.x)), tn = vec3(-rad.z, 0., rad.x);
  vec3 across = aRib2.y < .5 ? tn : rad;
  float len = sp * (2.3 + 1.7 * s2);
  float wob = sin(v * 5. - uTime * 2.2 + sd * 30.) * v * (1.2 + 1.6 * s2) * clamp(sp / 5., 0., 1.);
  float wide = (1.1 + .6 * sd) * (1. - .72 * v) * clamp(sp / 5., 0., 1.);
  vec3 lean = rad * .13 + vec3(.2, 0., .11);
  vec3 p = vec3(uStone.x, uStone.y + aRib2.z, uStone.z) + rad * aRib2.x + across * (aRib.z * wide) + tn * wob
    + vec3(0., v * len, 0.) + lean * (v * v * len);
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = aRib2.y < .5 ? -rad : tn; vR = vec3(v, aRib.z, sd);
  ${PROJ}
}
`;
const WAKE_FRAG = /* glsl */`
${GLSL}
uniform vec3 cLit, cHalf, cShade; uniform float uMir;
varying vec3 vW; varying vec3 vN; varying vec3 vR;
void main(){
  float v = vR.x;
  if (fract(v * 4.5 + vR.z * 9. - uTime * 1.3) < .55 * v * v) discard;      // torn into dashes toward the tip
  vec3 n3 = vN / max(length(vN), 1e-4);
  if (gl_FrontFacing == (uMir < 0.)) n3 = -n3;
  gl_FragColor = vec4(inkStep(n3, cLit, cHalf, cShade, 0.), 1.);
}
`;

export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, opts);
  const rng = ctx.rng, P = style.palette, U = style.uniforms;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const object = new THREE.Group(); object.name = 'stone-on-the-fifth-line';
  const [lx, lz] = at(LANDING[0], LANDING[1]);
  const pause = () => (ctx.yield ? ctx.yield() : Promise.resolve());

  if (opts.ground !== false) object.add(style.makeWater());
  if (opts.sky) object.add(style.makeSky());
  await pause();

  // the stones: the finer lens for the falling stone and the six nearest the flown line, the coarser for the rest;
  // the images of those seven are a lens of 72 segments on the same instance table
  const isNear = (c, r) => NEAR.some((n) => n[0] === c && n[1] === r);
  const fineG = lensGeometry(112); await pause();
  const coarseG = lensGeometry(48); await pause();
  const imageG = lensGeometry(72); await pause();
  const m4 = new THREE.Matrix4(), stones = [], stoneMeshes = [];   // stoneMeshes: the fine and coarse stones and their two images
  const group = (geo, list, imageGeo) => {
    geo.setAttribute('aInk', new THREE.InstancedBufferAttribute(new Float32Array(list.map((s) => s[2])), 1));
    const mesh = new THREE.InstancedMesh(geo, style.lensMaterial, list.length);
    list.forEach((s, i) => { const [x, z] = at(s[0], s[1]); mesh.setMatrixAt(i, m4.makeTranslation(x, s[3] || 0, z)); });
    mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'stones'; object.add(mesh);
    const image = style.mirror(mesh);
    if (imageGeo) { imageGeo.setAttribute('aInk', geo.attributes.aInk); image.geometry = imageGeo; }
    object.add(image); stoneMeshes.push(mesh, image); return mesh;
  };
  const nearList = TABLE.filter((s) => isNear(s[0], s[1]));
  const fine = group(fineG, [[LANDING[0], LANDING[1], 2], ...nearList], imageG);          // instance 0 is the falling stone
  const coarse = group(coarseG, TABLE.filter((s) => !isNear(s[0], s[1])));
  for (const s of TABLE) { const [x, z] = at(s[0], s[1]); stones.push({ foot: new THREE.Vector3(x, 0, z), ink: s[2] ? 'shell' : 'slate', col: s[0], row: s[1] }); }
  await pause();

  const TAU = Math.PI * 2;
  const mixc = (a, b, t) => a.clone().lerp(b, t);
  const own = (o) => { const u = { ...U }; for (const k in o) u[k] = { value: o[k] }; return u; };
  const land2 = new THREE.Vector2(lx, lz);

  // the crown: thirteen low clumps all round the rim (under 24 m, gone within 5 s) and seven tall ones behind and
  // down-sun (bearing 180 to 250, to 90 m, from 1.9 s after the touch, gone by 9 s); a clump is three ribbons, each
  // 4.2 to 6.8 m wide at its foot, side by side about 4 m apart (so a clump stands as one sheet), the outer two lower, each starting at a moment of its own
  // (the last figure handed to sheet() is drawn from the deal and not used)
  const cr = [], cr2 = [], cidx = [], SV = 16, SS = 2;
  const hx = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
  const sheet = (ang, hmax, start, life) => {
    const seed = rng();
    for (let r = 0; r < 3; r++) {
      const o = cr.length / 4, sd = (seed + r * 0.37 + hx(seed, r) * 0.2) % 1;
      const a = ang + (r - 1 + (hx(seed, r + 7) - 0.5) * 0.5) * 3.9 / 64.6, hw = 1.25 + 0.75 * hx(seed, r + 3);
      const hm = hmax * (r === 1 ? 1 : 0.55 + 0.4 * hx(seed, r + 11)), st = start + 0.25 * hx(seed, r + 5), lf = life - 0.25;
      for (let j = 0; j <= SV; j++) for (let i = 0; i <= SS; i++) { cr.push(a, j / SV, i / SS * 2 - 1, sd); cr2.push(hm, st, lf, hw); }
      for (let j = 0; j < SV; j++) for (let i = 0; i < SS; i++) { const q = o + j * (SS + 1) + i; cidx.push(q, q + 1, q + SS + 1, q + 1, q + SS + 2, q + SS + 1); }
    }
  };
  for (let i = 0; i < 13; i++) sheet((i + rng() * 0.6) * TAU / 13, 12 + rng() * 10, rng() * 0.3, 3.2 + rng() * 1.3, 3 + rng() * 2.2);
  for (let i = 0; i < 7; i++) {
    const start = 1.9 + rng() * 0.5;
    sheet((180 + (i + rng() * 0.7) * 10 - 90) * D2R, 46 + rng() * 44, start, 8.9 - start - rng() * 0.6, 9 + rng() * 4);
  }
  const crownG = new THREE.BufferGeometry();
  crownG.setAttribute('aCr', new THREE.Float32BufferAttribute(cr, 4));
  crownG.setAttribute('aCr2', new THREE.Float32BufferAttribute(cr2, 4));
  crownG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(cr.length / 4 * 3), 3));
  crownG.setIndex(cidx);
  const crown = new THREE.Mesh(crownG, new THREE.ShaderMaterial({
    uniforms: own({ cPale: P.shell, cUnder: mixc(P.shell, P.shellShade, 0.5), uLand: land2 }),
    vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false,
  }));
  crown.frustumCulled = false; crown.renderOrder = 4; crown.name = 'crown'; object.add(crown); object.add(style.mirror(crown));
  await pause();

  // the veils: fourteen at the full graphics level, on three rings 26, 40 and 52 m from the stone's axis (three,
  // five and six), each 8 to 20 lines long, standing where it was dealt along its ring, with open water between
  // most of them. All fourteen are drawn from the deal at every graphics level (with as many further draws
  // as bring the deal's draws here to 3,040, so that every later draw of the deal is the same at every level)
  // and a lower level keeps eight to thirteen of them, the rings thinned unevenly.
  const veil = [], veilN = [], PER = [3, 5, 6], VEILS = 14, nVeil = Math.round(VEILS * detail);
  let drawn = 0;
  for (let ringI = 0, made = 0; ringI < 3; ringI++) {
    const r = [26, 40, 52][ringI], a0 = rng() * TAU; drawn++;
    for (let i = 0; i < PER[ringI]; i++, made++) {
      const n = 8 + Math.floor(rng() * 13), a = a0 + (i + 0.5 * rng()) * TAU / PER[ringI], seed = rng(); drawn += 3;
      if ((made * 5) % VEILS < nVeil) { veil.push(a, r, Math.min(n * 0.75 / r, 0.42 * TAU / PER[ringI]), Math.floor(seed * 1000)); veilN.push(n); }
    }
  }
  for (; drawn < 3040; drawn++) rng();
  const VS = 8, vp = [], vi = [];
  for (let i = 0; i <= VS; i++) vp.push(i / VS * 2 - 1, 1, 0, i / VS * 2 - 1, 0, 0);
  for (let i = 0; i < VS; i++) { const q = i * 2; vi.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  const dropG = new THREE.InstancedBufferGeometry();
  dropG.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3));
  dropG.setIndex(vi);
  dropG.setAttribute('aVeil', new THREE.InstancedBufferAttribute(new Float32Array(veil), 4));
  dropG.setAttribute('aLines', new THREE.InstancedBufferAttribute(new Float32Array(veilN), 1));
  dropG.instanceCount = veilN.length;
  const curtains = new THREE.Mesh(dropG, new THREE.ShaderMaterial({
    uniforms: own({ cPale: P.shell, cUnder: mixc(P.shell, P.shellShade, 0.5), uLand: land2 }),
    vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false,
  }));
  // (drawn after the crown, and its image after the crown's: an order of their own)
  curtains.frustumCulled = false; curtains.renderOrder = 4.1; curtains.name = 'curtains'; object.add(curtains); object.add(style.mirror(curtains, -5.9));
  await pause();

  // the streamers: nine over the crown, each two crossed strips, its foot 12 m clear of the stone's surface
  const rib = [], rib2 = [], ridx = [], SEG = 14;
  for (let i = 0; i < 9; i++) {
    const a = (i + rng() * 0.7) * TAU / 9, seed = rng(), rho = 14 + 42 * Math.sqrt(rng());
    const footY = TOP_Y - (LENS_R - Math.sqrt(LENS_R * LENS_R - rho * rho)) + 12;
    for (let strip = 0; strip < 2; strip++) {
      const o = rib.length / 4;
      for (let j = 0; j <= SEG; j++) { rib.push(a, j / SEG, -1, seed, a, j / SEG, 1, seed); rib2.push(rho, strip, footY, rho, strip, footY); }
      for (let j = 0; j < SEG; j++) { const q = o + j * 2; ridx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const wakeG = new THREE.BufferGeometry();
  wakeG.setAttribute('aRib', new THREE.Float32BufferAttribute(rib, 4));
  wakeG.setAttribute('aRib2', new THREE.Float32BufferAttribute(rib2, 3));
  wakeG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(rib.length / 4 * 3), 3));
  wakeG.setIndex(ridx);
  const wake = new THREE.Mesh(wakeG, new THREE.ShaderMaterial({
    uniforms: own({ cLit: P.shell, cHalf: mixc(P.shell, P.shellShade, 0.5), cShade: P.shellShade }),
    vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, side: THREE.DoubleSide,
  }));
  wake.frustumCulled = false; wake.name = 'streamers'; object.add(wake); object.add(style.mirror(wake));
  await pause();

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const [nx, nz] = at(16, 9);
  const anchors = {
    landing: V(lx, 0, lz), neighbour: V(nx, 0, nz),
    portalSeat: { position: V(880.6, 18, -298.2), facing: V(Math.sin(315 * D2R), 0, -Math.cos(315 * D2R)) },
    stones,
  };
  const update = (dt, time) => {
    style.update(dt, time);
    fine.setMatrixAt(0, m4.makeTranslation(lx, U.uStone.value.y, lz));
    fine.instanceMatrix.needsUpdate = true;
  };
  update(0, 0);
  return {
    object, radius: 100, height: 110, center: V(lx, 30, lz), anchors, style, update, event: { height, tau, speed, PERIOD },
    dispose() { for (const m of stoneMeshes) m.dispose(); if (!opts.style) style.dispose(); },
    ground: false, groundY: 0,
  };
}
