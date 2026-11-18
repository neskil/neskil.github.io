// Stone on the Fifth Line: a game board the size of a country lying under a film of still water, a mirror ruled by
// nineteen dark causeways each way, with stones the size of hills standing on the crossings over their own images
// and one more coming down out of the low sun to meet its image.
// The position follows the record of a played game as a fact, as a record of a game and nothing more
// (source: the game file in the public archive of game records at homepages.cwi.nl, checked against an encyclopedia's diagram of the same game's first moves).
// The table itself is the constant TABLE of the part file.
//
// A printed dusk in flat inks. Every lit ink is unlit and stepped by the face's own normal against one fixed sun
// (bearing 356, 14 degrees up); the birds, the mist, the way out's rings, the second disc and the bowls' shadows
// on the mist are flat inks. Nothing reads the camera, nothing is carried with it, and everything that moves is
// a function of the time given to update() and of its own place.
// THE GAZE ALONE KEEPS THINGS FROM FRAME TO FRAME (the loop's gaze, below): the place on the line and the clock of the
// last step and of the last asking, the flight's pace against the clock and the pace it is making for (pcW), and for one
// passage two answers of yes or no (the film's and the one the gaze follows), each with the place where its turn ends,
// the lead (ntLd: how far on along the line the bearing is taken from), and on the loop what was last added for the
// lead with the bearing it was added to (ntAd, ntBe); all of them read the clock, its step and the place on the line
// as they are given, nothing else.
// WHAT THAT GAZE DOES NOT DO AT OTHER PACES THAN THE FILM'S (partial): under the steady camera it turns to the seat in part only;
// a change of pace or the fivefold rush after the turn has begun does not undo the turn; at the rush little of a turn is seen.
// WHERE SUCH A CHANGE MOVES A TOUCH, FOR WHICH THE TURN HAS BEGUN, ON PAST THE LOOP'S MIDDLE, the begun turn stands; where
// the flight is then making for more than four times the film's pace, the bearing may be taken from further on along the
// line (the lead, below, says when and how far; the camera follows the gaze late). A touch moved on past the place where
// the seat stands 34 degrees left of OUT's bearing (the gaze's own on the way out, below), near the left edge of a 16:9 view
// (u 0.84 of the line), is led for less, and past the place where it stands 62 degrees left of that bearing (u 0.87)
// not at all: there the stone lands out of
// view, as it did before the lead was written (a separate reader's count on its own copy of the flight, 3,000 flights
// at twice the film's pace and more with a rush begun between u 0.30 and 0.62: 16 of the 86 touches moved past the
// loop's middle with a turn begun land with the seat over 40 degrees off the camera's axis, all between u 0.86 and
// 0.90; without the lead 59 did).
// THE LEAD LEANS ON ONE FIGURE OF THE ENGINE, typed here as a number and read from nowhere: EASE, 1.4 a second, the rate at
// which the engine this world was built on brings a flight's pace to the pace asked of it (save in the four seconds after a
// crossing while the flight is gaining pace, where that engine eases more slowly). It serves the lead alone: the pace the
// flight is taken to be making for, the place of the touch for which the lead is asked, and how far the flight runs in the
// next half second; where an engine eases at another rate these are taken a little wrong.
// Every shadow falls by that one fixed sun's direction (4.0 times the height away, on bearing 176), built or drawn by place.
// Built on this machine's older engine and kit as they are (from the kit: makePath only).
// THE MIRROR IS BUILT: every body over the water but the way out's rings and the causeways' tops has a second
// mesh under the water's level, the same body with its height turned over, inked as the body itself is; the sky
// has its lower half-dome; over them lies one water sheet of one ink at one opacity. The pan's outline is drawn
// before every image and every body over the water, as a window in the depth (the part file), so the images
// show through the pan and nowhere else.
// The window and the sky take depth 1 for the far distance (a plain depth buffer, not a reversed or logarithmic one).
// FILTERED BY THE PIXEL'S FOOTPRINT (fwidth), here and in the part file: the causeways' tops and edges, the wave's rings, the ripple bars, the tone edges' waver, the water light, the mist's shapes and the other lines drawn inside a face (salt, foam, grain, strata, veins, growth rings, tide lines, the sky's bands); a line thinner than a pixel is drawn a pixel wide at a lower cover (a causeway a pixel and a half wide, the wave's crests one), a waver or shape finer than a pixel gives way to its mean; nothing else is sized or faded by distance.
// THE FLIGHT: a high entry south of the board (520 m up) and a dive that shows the ruled board from above, the open crossing, the gap beside the landing point (passed once), one wide loop to the left round the landing point, low from 70 m past the gap round to its south (the eye 10 m up) through the great colony of wading birds, which goes up as the stone tops its lift and starts down, and out north-west past the shell neighbour's east side.
// No deal changes the position, the flown line, the sun or the event's clock, so the stone comes down in sight at least once in every flight on every deal.
// THE STONE IS SEEN TO LAND, whole, in a flight on forty deals of forty (counted on forty deals at thirty phases of the clock each: 1,200 flights of 1,200).
// A deal changes the hour's inks, the mist's height, the clouds, the flocks, the boats and where each bird of the colony stands, and the rare deal adds
// a pale second disc in the east.
//
// SPACE: x east, z south, y up, origin on the centre crossing; a crossing (column from the west, row from the
// north) stands at ((column - 10) * 140, (row - 10) * 140). Bearing b is the direction (sin b, 0, -cos b).

import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero, SP, TABLE, LANDING, PROJ, height as heightOf, tau as tauOf } from '../parts/stone-on-the-fifth-line.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
const DURATION = 70;

// The planned line as a turtle in line spacings (go: straight; arc: radius, degrees, side) from (15.764, 20.794),
// 250 m south of the board's south line and 520 m up, on bearing 356: a dive over the south line and the pair of
// shell stones down onto the pan, the open crossing, the gap beside the landing point (passed once), one wide loop
// to the left round the landing point (182 m radius about (14.58, 10.42), through 270 degrees), straight on bearing
// 45, a quarter turn to the left round the shell neighbour's east side and straight out on bearing 315. With it
// the clock at its marks and the eye's height over the water by the length flown.
const ROUTE = {
  start: [15.764, 20.794], bearing: 356,
  segs: [['go', 2.5], ['go', 1.3], ['go', 2.7], ['arc', 1.6, 23.5, 1], ['go', 2.2], ['arc', 1.8, 64.5, -1], ['go', 0.3],
    ['arc', 1.3, 270, -1], ['go', 2.011], ['arc', 1.0, 90, -1], ['go', 0.894]],
  // clock (s) at the end of segment index: the start, then 0, 1, 2, 4, 5, 6, 7, 8, 9, 10
  marks: [[0, -1], [7.5, 0], [11.0, 1], [18.3, 2], [27.5, 4], [39.0, 5], [40.4, 6], [57.5, 7], [63.1, 8], [67.5, 9], [70, 10]],
  eye: [[0, 520], [2.5, 220], [3.8, 110], [5.1, 46], [6.5, 16], [7.1, 14], [11.69, 14], [12.2, 10], [15.8, 10], [17.2, 16], [19.8, 18], [21.4, 16], [22.29, 18]],
};

// A monotone cubic through a table of [x, y] rows: it passes through every row and never overshoots one.
function monotone(tab) {
  const n = tab.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((tab[i + 1][1] - tab[i][1]) / (tab[i + 1][0] - tab[i][0]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x) => {
    if (x <= tab[0][0]) return tab[0][1];
    if (x >= tab[n - 1][0]) return tab[n - 1][1];
    let i = 0; while (x > tab[i + 1][0]) i++;
    const h = tab[i + 1][0] - tab[i][0], t = (x - tab[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * tab[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * tab[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}

// The line: points every 30 m or so along the turtle, a smooth curve through them, and the same curve handed to
// the engine by the clock: the distance d the engine asks for stands for the clock d / length * 70 s, and the
// place is where the table of marks puts the eye at that clock, in metres on the plan, eased between the marks
// (a monotone cubic), so the speed never jumps.
function makeRoute() {
  const eyeAt = monotone(ROUTE.eye);
  let x = (ROUTE.start[0] - 10) * SP, z = (ROUTE.start[1] - 10) * SP, b = ROUTE.bearing * D2R, s = 0;
  const pts = [[x, eyeAt(0), z]], ends = [];
  for (const seg of ROUTE.segs) {
    if (seg[0] === 'go') {
      const len = seg[1] * SP, n = Math.max(1, Math.round(len / 30));
      for (let i = 0; i < n; i++) { x += Math.sin(b) * len / n; z -= Math.cos(b) * len / n; s += len / n; pts.push([x, eyeAt(s / SP), z]); }
    } else {
      const r = seg[1] * SP, ang = seg[2] * D2R, n = Math.max(2, Math.round(r * ang / 26)), da = seg[3] * ang / n, chord = 2 * r * Math.sin(Math.abs(da) / 2);
      for (let i = 0; i < n; i++) { b += da / 2; x += Math.sin(b) * chord; z -= Math.cos(b) * chord; b += da / 2; s += r * ang / n; pts.push([x, eyeAt(s / SP), z]); }
    }
    ends.push(s);
  }
  const real = makePath(pts, { samples: 800 }), L = real.length, total = s;
  const flown = monotone(ROUTE.marks.map(([t, i]) => [t, i < 0 ? 0 : ends[i]]));   // clock -> metres of the turtle
  // the turtle's metres are metres on the plan; the curve's own length also counts the dive: plan[i] is the
  // length on the plan of the first i of 1,500 equal parts of the curve
  const NP = 1500, plan = new Float32Array(NP + 1), pa = new THREE.Vector3(), pb = new THREE.Vector3();
  real.posAtDist(0, pa);
  for (let i = 1; i <= NP; i++) { real.posAtDist(i / NP * L, pb); plan[i] = plan[i - 1] + Math.hypot(pb.x - pa.x, pb.z - pa.z); pa.copy(pb); }
  const warp = (d) => {
    const m = flown(d / L * DURATION) / total * plan[NP];
    let lo = 0, hi = NP;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (plan[mid] <= m) lo = mid; else hi = mid; }
    return (lo + (m - plan[lo]) / Math.max(plan[hi] - plan[lo], 1e-6)) / NP * L;
  };
  const path = Object.assign(Object.create(real), {
    posAtDist(d, out = new THREE.Vector3()) {
      if (d <= 0) return out.copy(real.start).addScaledVector(real.startTangent, d);
      if (d >= L) return out.copy(real.end).addScaledVector(real.endTangent, d - L);
      return real.posAtDist(warp(d), out);
    },
    tangentAtDist(d, out = new THREE.Vector3()) { return real.tangentAtDist(d <= 0 ? 0 : d >= L ? L : warp(d), out); },
    pointAt(u, out = new THREE.Vector3()) { return path.posAtDist(u * L, out); },
    tangentAt(u, out = new THREE.Vector3()) { return path.tangentAtDist(u * L, out); },
  });
  return { path, real };
}

// ---- vertex shaders of the world's own inks (each ends with the part's PROJ line: the body or its image) --------

// A flat boat with one sail going up and down its own stretch of water at walking pace, 15 m beside a causeway; it
// rocks when the wave from the landing point passes under it. aSeg: where the stretch starts (x, z), its direction
// as an angle, its length; aPh: a seed (its phase, and which side of the causeway it keeps). BOAT_AT is shared
// with its shadow.
const BOAT_AT = /* glsl */`
attribute vec4 aSeg; attribute float aPh;
uniform float uTime, uMir; uniform vec4 uStone; uniform vec2 uLand;
vec2 boatDir(){ return vec2(cos(aSeg.z), sin(aSeg.z)); }
vec2 boatAt(){
  float s = aSeg.w * abs(fract((uTime * 1.4 + aPh * 300.) / (2. * max(aSeg.w, 1.))) * 2. - 1.);
  vec2 d = boatDir();
  return aSeg.xy + d * s + vec2(-d.y, d.x) * (fract(aPh * 7.) > .5 ? 15. : -15.);
}
`;
const BOAT_VERT = /* glsl */`
${BOAT_AT}
varying vec3 vW; varying vec3 vN; varying vec3 vC;
void main(){
  vec2 d = boatDir(), e = vec2(-d.y, d.x), c = boatAt();
  float tw = uStone.w - (length(c - uLand) - 63.) / 90.;
  float roll = tw > 0. ? .3 * exp(-tw * .5) * sin(tw * 3.6) : 0.;
  roll += .03 * sin(uTime * 1.1 + aPh * 60.);
  float cr = cos(roll), sr = sin(roll);
  vec3 q = vec3(position.x, cr * position.y - sr * position.z, sr * position.y + cr * position.z);
  vec3 nn = vec3(normal.x, cr * normal.y - sr * normal.z, sr * normal.y + cr * normal.z);
  vec3 p = vec3(c.x + d.x * q.x + e.x * q.z, max(q.y + .1 + .06 * sin(uTime * 1.3 + aPh * 60.), 0.), c.y + d.y * q.x + e.y * q.z);   // never under the water's level
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vC = color;
  vN = mat3(modelMatrix) * vec3(d.x * nn.x + e.x * nn.z, nn.y, d.y * nn.x + e.y * nn.z);
  ${PROJ}
}
`;
// A boat's built shadow: a flat streak laid down-sun from the boat's place, moving with it.
const BOAT_SHADOW_VERT = /* glsl */`
${BOAT_AT}
varying vec3 vW;
void main(){
  vec2 c = boatAt();
  vec4 w = modelMatrix * vec4(c.x + position.x, position.y, c.y + position.z, 1.); vW = w.xyz;
  ${PROJ}
}
`;
// A low cloud slab. aCloud: its place along the arc of sky kept for clouds (0..1), its distance from the board's
// centre, its height, a seed. It drifts along that arc by the clock and thins to nothing at the arc's two ends,
// which lie either side of the sun's bearing. uArc: the arc's first bearing and its width, in radians. The slab is
// turned to its bearing by a rotation (its length against the bearing's growth, its depth outward), so its faces
// look outward and its normals are true.
const CLOUD_VERT = /* glsl */`
attribute vec4 aCloud;
uniform float uTime, uMir; uniform vec2 uArc;
varying vec3 vW; varying vec3 vN; varying vec3 vC;
void main(){
  float f = fract(aCloud.x + uTime * (.00022 + .00012 * aCloud.w));
  float k = smoothstep(0., .035, f) * (1. - smoothstep(.965, 1., f));
  float b = uArc.x + uArc.y * f, sb = sin(b), cb = cos(b);
  vec3 q = position * k;
  vec3 p = vec3(sb * (aCloud.y + q.z) - cb * q.x, aCloud.z + q.y, -cb * (aCloud.y + q.z) - sb * q.x);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vC = color;
  vN = mat3(modelMatrix) * vec3(sb * normal.z - cb * normal.x, normal.y, -cb * normal.z - sb * normal.x);
  ${PROJ}
}
`;
// A plate of a stack of lens clouds: one smooth round plate, stretched to its own length, depth and thickness and
// turned to its own yaw. aStack: the plate's centre at rest and its stack's seed; aPlate: half length, half depth,
// half thickness, yaw. A stack drifts to and fro along the wind by the clock (to 240 m either way, each stack at
// its own slow pace) and each plate slides up to 30 m either way across it, all at one pace, each at its own moment.
const PLATE_VERT = /* glsl */`
attribute vec4 aStack; attribute vec4 aPlate;
uniform float uTime, uMir;
varying vec3 vN;
void main(){
  float c = cos(aPlate.w), s = sin(aPlate.w);
  vec3 q = position * aPlate.xzy, n = normal / aPlate.xzy;
  vec3 wind = vec3(.94, 0., .342);
  vec3 p = aStack.xyz + vec3(c * q.x + s * q.z, q.y, -s * q.x + c * q.z)
    + wind * (240. * sin(uTime * (.04 + .015 * aStack.w) + aStack.w * 40.)) + vec3(-wind.z, 0., wind.x) * (30. * sin(uTime * .23 + aPlate.w * 5.));
  vN = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
  vec4 w = modelMatrix * vec4(p, 1.);
  ${PROJ}
}
`;
// Its ink: three flat pale tones by the plate's own normal and the fixed sun: gold beneath, a pale cream round
// the edge and toward the sun, a pale plum on top.
const PLATE_FRAG = /* glsl */`
uniform vec3 uSun, cTop, cSunny, cUnder;
varying vec3 vN;
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  gl_FragColor = vec4(n.y < -.6 ? cUnder : ((n.y < .25 || dot(n, uSun) > .3) ? cSunny : cTop), 1.);
}
`;
// Pale birds with dark wing tips, 3 m in span, that never settle: a skein wheels round its flock's centre, all its
// birds at one pace (each stone's flock at a pace of its own), each weaving a little within the skein. aFlock: the
// centre's x and z, the lowest height of the wheel, its radius. aBird: its angle round the centre at the clock's
// nought, a seed (how far out it flies, to 0.09 more than the radius at the most), its height over the lowest,
// its size.
const BIRD_VERT = /* glsl */`
attribute vec4 aFlock; attribute vec4 aBird;
uniform float uTime, uMir;
varying float vSide;
void main(){
  float pace = .15 + .012 * fract(aFlock.x * .013 + aFlock.y * .007);
  float ang = aBird.x + uTime * pace + .03 * sin(uTime * .7 + aBird.y * 40.), rad = aFlock.w * (1. + .09 * aBird.y);
  vec3 c = vec3(aFlock.x + cos(ang) * rad, aFlock.z + aBird.z + 4. * sin(ang * 2. + aBird.y * 20.), aFlock.y + sin(ang) * rad);
  vec2 fw = vec2(-sin(ang), cos(ang)), rt = vec2(-fw.y, fw.x);
  float flap = sin(uTime * (5. + 2. * aBird.y) + aBird.x * 9.);
  vec3 p = c + aBird.w * (vec3(rt.x, 0., rt.y) * position.x * (1. - .25 * abs(flap)) + vec3(fw.x, 0., fw.y) * position.z + vec3(0., abs(position.x) * flap * .7, 0.));
  vSide = position.x;
  vec4 w = modelMatrix * vec4(p, 1.);
  ${PROJ}
}
`;
const BIRD_FRAG = /* glsl */`
uniform vec3 cA, cB;
varying float vSide;
void main(){ gl_FragColor = vec4(abs(vSide) < .6 ? cA : cB, 1.); }
`;
// A wading bird's flat shape between its two poses, shared by the bands and the great colony. position: the bird
// standing, 3.2 m tall (x forward, y up); aFly: the same corner in flight (neck stretched forward, legs trailing,
// the two wings out along z; y over its feet's height). In flight the wings beat about once a second, each bird
// at its own pace and from its own moment (a wing's tip goes 1.5 m up and down about its place), and the neck of a standing bird
// dips now and then.
const WADER_SHAPE = /* glsl */`
attribute vec3 aFly;
vec3 waderShape(float up, float sd){
  float beat = sin(uTime * (5. + 2. * sd) + sd * 90.);
  float dip = position.y > 2.2 ? .22 * max(0., sin(uTime * (.5 + .4 * sd) + sd * 70.)) : 0.;
  vec3 st = vec3(position.x + dip * (position.y - 2.2), position.y * (1. - dip * .5), 0.);
  vec3 fl = vec3(aFly.x, aFly.y + abs(aFly.z) * (.55 * beat + .06) - .1 * beat, aFly.z * (1. - .16 * beat * beat));
  return mix(st, fl, smoothstep(0., .3, up));
}
`;
// A wading bird of the bands. aW: its place (x, z), the seconds from the
// touch at which it lifts, a seed. aW2: the direction its skein flies out in (an angle on the water: along a
// causeway), half the length of the skein's round (nought: this bird never flies), how long the flight with the
// wave lasts, and its turn in the flock's round of 87 s. aW3: half of how far the round bulges to the side (to the
// left of the way out, in metres; negative: to the right), the height of its feet in flight, how far it draws in sideways
// toward the skein's middle line in flight, and the way it faces while it stands. It stands, dipping its neck now
// and then. A bird that flies does so with its skein, the birds standing about it: all lift within a second of
// one another, the foremost first, when the wave's ring nears their ground or the skein's turn comes (a flight of
// 12.4 s in every 87 s), take the flying pose, fly one long
// narrow oval along a causeway's direction, each bird the same oval through its own place, low over the water,
// and stand again where they stood.
const WADER_VERT = /* glsl */`
attribute vec4 aW; attribute vec4 aW2; attribute vec4 aW3;
uniform vec4 uStone; uniform float uTime, uMir;
varying vec3 vTone;
${WADER_SHAPE}
float ease(float k){ return k * k * (3. - 2. * k); }
void main(){
  float sd = aW.w, fly = step(.5, aW2.y);
  float tw = uStone.w > 20. ? uStone.w - 30. : uStone.w;
  float k1 = clamp((tw - aW.z) / max(aW2.z, 1.), 0., 1.), k2 = clamp(fract(uTime / 87. + aW2.w) * 7., 0., 1.);
  float up = fly * max(smoothstep(0., .22, k1) * (1. - smoothstep(.7, 1., k1)), smoothstep(0., .22, k2) * (1. - smoothstep(.7, 1., k2)));
  float th = 6.2832 * (ease(k1) + ease(k2));
  vec2 e1 = vec2(cos(aW2.x), sin(aW2.x)), e2 = vec2(-e1.y, e1.x);
  vec2 c = aW.xy + up * (e1 * (aW2.y * sin(th)) + e2 * (aW3.x * (1. - cos(th)) + aW3.z));
  vec2 vel = e1 * (aW2.y * cos(th)) + e2 * (aW3.x * sin(th));
  vec2 fs = vec2(cos(aW3.w), sin(aW3.w));                                   // standing, each bird faces its own way
  vec2 fw = mix(fs, vel / max(length(vel), 1e-3), up);
  fw = dot(fw, fw) > .01 ? fw / max(length(fw), 1e-3) : fs;
  vec2 rt = vec2(-fw.y, fw.x);
  vec3 q = waderShape(up, sd);
  vec3 p = vec3(c.x, up * aW3.y, c.y) + vec3(fw.x, 0., fw.y) * q.x + vec3(rt.x, 0., rt.y) * q.z + vec3(0., q.y, 0.);
  vTone = vec3(color.rg, up);
  vec4 w = modelMatrix * vec4(p, 1.);
  ${PROJ}
}
`;
// A wading bird of the great colony round the loop. uLoop: the loop's centre on the water. aC: its place (x, z),
// the seconds after the touch at which it goes up (12.8 and more), a seed.
// aC2: half the swing of its round about the loop's centre (radians, signed: the way it sets out), half of how
// far the round bulges away from or toward that centre (metres), the height of its feet in flight, and the seconds
// after the touch at which it stands again. aC3: how far it draws in toward its skein's middle line in flight
// (metres, along the radius), the way it faces while it stands, its skein's seed, and its place in the skein
// (0 to 1). EVERY BIRD OF THE COLONY GOES UP AS THE STONE TOPS ITS LIFT AND STARTS DOWN, at its own moment by its
// own place (the build gives the moments), and is in the air until the touch and aC2.w seconds more; in that time it flies one round, an oval about the
// loop's centre through its own place: the angle swings out and back, the radius bulges, and near the ends it
// rises from and sinks to the water where it stood. In every round of the clock about one skein in seven goes
// up early, at a moment of its own between 9.6 and 15.4 s after the touch (which skeins: by the count of the
// rounds). A bird whose swing is nought never flies.
const COLONY_VERT = /* glsl */`
attribute vec4 aC; attribute vec4 aC2; attribute vec4 aC3;
uniform vec4 uStone; uniform float uTime, uMir; uniform vec2 uLoop;
varying vec3 vTone;
${WADER_SHAPE}
float ease(float k){ return k * k * (3. - 2. * k); }
void main(){
  float sd = aC.w, tau = uStone.w, fly = step(1e-4, abs(aC2.x));
  float lap = floor((uTime + 4.4 - 9.5) / 30.);
  float early = step(fract(aC3.z + lap * .1031), .14);
  float tl = mix(aC.z, 9.6 + 5.8 * fract(aC3.z * 7.3 + lap * .37) + 1.2 * aC3.w, early);
  float t1 = tau - tl + (tau < 9.5 ? 30. : 0.);
  float k = fly * clamp(t1 / max(30. + aC2.w - tl, 1.), 0., 1.);
  float up = smoothstep(0., .08, k) * (1. - smoothstep(.8, 1., k));
  float th = 6.2832 * ease(k);
  vec2 rel = aC.xy - uLoop; float r0 = max(length(rel), 1.);
  float a = atan(rel.y, abs(rel.x) < 1e-4 ? 1e-4 : rel.x) + aC2.x * sin(th);
  float r = r0 + aC2.y * (1. - cos(th)) + aC3.x * up;
  vec2 rd = vec2(cos(a), sin(a)), tn = vec2(-rd.y, rd.x);
  vec2 c = uLoop + rd * r;
  vec2 vel = tn * (r * aC2.x * cos(th)) + rd * (aC2.y * sin(th));
  vec2 fs = vec2(cos(aC3.y), sin(aC3.y));
  vec2 fw = mix(fs, vel / max(length(vel), 1e-3), smoothstep(0., .5, up));
  fw = dot(fw, fw) > .01 ? fw / max(length(fw), 1e-3) : fs;
  vec2 rt = vec2(-fw.y, fw.x);
  vec3 q = waderShape(up, sd);
  vec3 p = vec3(c.x, up * (aC2.z + 1.2 * sin(th * 3. + sd * 20.)), c.y) + vec3(fw.x, 0., fw.y) * q.x + vec3(rt.x, 0., rt.y) * q.z + vec3(0., q.y, 0.);
  vTone = vec3(color.rg, up);
  vec4 w = modelMatrix * vec4(p, 1.);
  ${PROJ}
}
`;
// The mist sea: two pale inks in long level shapes that roll slowly, drawn by place and filtered by the pixel's
// footprint; farther than 9 km from the board's centre it is the one ink the sky keeps below the horizon.
const MIST_FRAG = /* glsl */`
uniform float uTime; uniform vec3 cFar, cPale, cDeep;
varying vec3 vW;
void main(){
  vec2 p = vW.xz;
  float f = sin(p.x * .0021 + 1.3 * sin(p.y * .0017 + uTime * .06)) + sin(p.y * .0047 - uTime * .08 + 2. * sin(p.x * .0011 + 1.7));
  float g = sin(p.y * .0093 + uTime * .11 + 1.5 * sin(p.x * .0031 - uTime * .04));
  float ff = max(fwidth(f), 1e-4), fg = max(fwidth(g), 1e-4);
  float far = 2.4 * smoothstep(4500., 9000., length(p));          // the shapes shrink away with distance from the board
  float a = clamp((f - .25 - far) / ff + .5, 0., 1.) * clamp(1.6 - ff * 1.2, 0., 1.);
  float b = clamp((g - .55 - far) / fg + .5, 0., 1.) * clamp(1.6 - fg * 1.2, 0., 1.);
  vec3 col = mix(cFar, cPale, a);
  col = mix(col, cDeep, b * (1. - a));
  gl_FragColor = vec4(col, 1.);
}
`;

const PALETTE = ['#FFF3D0', '#FFE2A6', '#F2C36B', '#EBD0AE', '#D9B68E', '#8A6A66', '#1E1B2A', '#4A4460', '#7C7896', '#FBF3E2', '#B9A9B8', '#3A2A3C', '#8C7FA6'];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const [LX, LZ] = [(LANDING[0] - 10) * SP, (LANDING[1] - 10) * SP];
const isStone = (c, r) => (c === LANDING[0] && r === LANDING[1]) || TABLE.some((s) => s[0] === c && s[1] === r);
const isStar = (c, r) => (c === 4 || c === 10 || c === 16) && (r === 4 || r === 10 || r === 16);
// seconds after the touch at which the wave (90 m a second from the rim, 63 m out) reaches a place
const waveAt = (x, z) => (Math.hypot(x - LX, z - LZ) - 63) / 90;

export default {
  id: 'stone-on-the-fifth-line',
  name: 'Stone on the Fifth Line',
  category: 'bizarre',
  weirdness: 0.6,
  media: ['air', 'open'],

  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    // the deal: the hour's inks, the mist's height, the clouds' number and layout, the flocks, the boats
    const deal = ctx.rng.fork('deal');
    const mistHigh = deal() < 0.45;
    const nClouds = Math.round(clamp((12 + deal() * 8) * density, 12, 20));
    const nBands = Math.round(clamp((9 + deal() * 5) * density, 8, 14));
    const nBoats = Math.round(clamp((15 + deal() * 4) * density, 12, 20));
    const nStacks = Math.round(clamp((9 + deal() * 3) * density, 8, 12));
    const hourWish = vary.hour === 'golden' ? 'gold' : vary.hour === 'dawn' ? 'rose' : undefined;
    const rare = vary.rare === true;

    const { path, real } = makeRoute();
    const style = makeStyle(ctx, { palette: PALETTE, hour: hourWish });
    const P = style.palette, U = style.uniforms;
    const mixc = (a, b, t) => a.clone().lerp(b, t);
    const sm = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
    const hero = await buildHero(ctx, { style, detail, ground: true, sky: false });
    scene.add(hero.object);
    scene.add(style.makeSky());
    await ctx.yield();
    const own = (o) => { const u = { ...U }; for (const k in o) u[k] = { value: o[k] }; return u; };
    const withVert = (mat, vert) => { mat.vertexShader = vert; return mat; };
    const quat = new THREE.Quaternion(), m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    // a body over the water goes into the scene with its image under it (the image on the body's own geometry, or
    // on a lighter one handed in); every instanced mesh is listed, to be freed
    const instanced = [];
    const both = (mesh, imageGeometry) => {
      const image = style.mirror(mesh);
      if (imageGeometry) image.geometry = imageGeometry;
      mesh.frustumCulled = false; scene.add(mesh); scene.add(image);
      if (mesh.isInstancedMesh) instanced.push(mesh, image);
      return mesh;
    };

    // ---- the mist sea under the pan's edge, drawn before the window, and the two bowls standing in it -----------
    const cFar = mixc(P.apricot, P.shell, 0.55);                 // the ink the built sky keeps below the horizon
    const mistY = mistHigh ? -34 : -82;
    const mistG = new THREE.PlaneGeometry(44000, 44000, 1, 1); mistG.rotateX(-Math.PI / 2);
    const mist = new THREE.Mesh(mistG, new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uMir: U.uMir, cFar: { value: cFar }, cPale: { value: mixc(cFar, P.kerb, 0.7) }, cDeep: { value: mixc(cFar, P.rose, 0.4) } },
      vertexShader: style.vert, fragmentShader: MIST_FRAG,
    }));
    mist.position.y = mistY; mist.frustumCulled = false; mist.renderOrder = -9; mist.name = 'mist'; scene.add(mist);

    // A bowl of the game at the size of a mountain: a squat body of revolution, wider than tall (700 m across the
    // belly, 300 m tall), on a foot ring, with a wide mouth 612 m across under a low lip and no neck, in banded wood,
    // toned as a round turned thing: five flat steps round its girth, by how far the face's own normal is turned
    // from the sun's bearing on the plan (the palest within 40 degrees of it, the darkest beyond 136), each step's
    // edge leaning its own way with the normal's rise (8 to 18 degrees), so the edges run up the bowl as curves
    // of different shapes, toothed along the turning's bands (each band sets every edge over by its own few
    // degrees); a level face takes the middle step or the darkest; the foot ring and its groove take
    // the darkest; the lip is bright within 100 degrees of the sun's bearing; each band of the turning has a
    // shade of its own over all of it. It is
    // heaped to 438 m with stones of the board's size lying nearly level in four rings one over another (eleven,
    // seven, three and one), each stone leaning outward by 0.2 of a radian at the most and none touching its
    // neighbours in the ring; inside the rings stands a dark mound, so that the gaps between the stones are shadow. The bowl of shell stones stands just beyond the scarp at the north-east
    // corner, on (22.3, 1.7) in the board's measure; the bowl of slate stones beyond the north edge, on bearing 325
    // from the board's centre, 2,220 m out. The foot is a spreading drum: 6 m wider all round than the foot ring at
    // the water's level and 1.05 m wider for every metre down from there, so that it encloses every band of the
    // bowl's image that stands over the mist (the image shows through the pan and nowhere else); it stands in the
    // mist under the water's level, to 30 m under the mist, and is drawn with the mist, before the window.
    const jarRng = ctx.rng.fork('jars');
    const wood = (c, t) => mixc(c, cFar, t);
    const woodDark = mixc(P.plum, P.channel, 0.3);                // the wood's darkest ink; the other four steps lie close over it, toward the ripple's ink
    const jarMat = new THREE.ShaderMaterial({
      uniforms: { uSun: U.uSun, uTime: U.uTime, uMir: U.uMir, c0: { value: wood(mixc(P.ripple, woodDark, 0.3), 0.12) }, c1: { value: wood(mixc(P.ripple, woodDark, 0.5), 0.14) },
        c2: { value: wood(mixc(P.ripple, woodDark, 0.68), 0.16) }, c3: { value: wood(mixc(P.ripple, woodDark, 0.84), 0.18) }, c4: { value: wood(woodDark, 0.2) }, cLip: { value: wood(mixc(P.kerb, P.ground, 0.25), 0.06) } },
      vertexShader: style.vert, vertexColors: true,
      fragmentShader: `uniform vec3 uSun, c0, c1, c2, c3, c4, cLip; uniform float uMir; varying vec3 vN; varying vec3 vC;
        void main(){
          vec3 n = vN / max(length(vN), 1e-4);                         // the body's own normal, on the body and on its image
          float hl = length(n.xz), sl = max(length(uSun.xz), 1e-4);
          // degrees round the girth from the sun's bearing (0 to 180)
          float g = degrees(acos(clamp(dot(n.xz, uSun.xz) / (max(hl, 1e-4) * sl), -1., 1.))) + vC.b;
          vec3 col = g < 40. + 10. * n.y ? c0 : (g < 72. - 14. * n.y ? c1 : (g < 104. + 18. * n.y ? c2 : (g < 136. - 8. * n.y ? c3 : c4)));
          if (hl < .12) col = n.y > 0. ? c2 : c4;                       // a level face has no place round the girth
          if (vC.g > .75) col = g < 100. ? cLip : col;                  // the lip
          else if (vC.g > .25) col = c4;                                // the foot
          gl_FragColor = vec4(col * vC.r, 1.);
        }`,
    });
    const footInk = style.ink({ lit: mixc(P.ripple, cFar, 0.4), half: mixc(P.plum, cFar, 0.45), shade: mixc(P.plum, cFar, 0.35) });
    const heapMat = new THREE.ShaderMaterial({
      uniforms: { ...style.lensMaterial.uniforms, cSlate: { value: mixc(P.slate, cFar, 0.05) }, cSlateHalf: { value: mixc(mixc(P.slate, P.slateLit, 0.8), cFar, 0.05) },
        cSlateLit: { value: mixc(P.slateLit, cFar, 0.05) }, cSheen: { value: mixc(P.sheen, cFar, 0.05) }, cShell: { value: mixc(P.shell, cFar, 0.03) },
        cShellHalf: { value: mixc(mixc(P.shell, P.shellShade, 0.53), cFar, 0.04) }, cShellShade: { value: mixc(P.shellShade, cFar, 0.05) } },
      vertexShader: style.lensMaterial.vertexShader, fragmentShader: style.lensMaterial.fragmentShader,
    });
    // the turning's profile (radius, height): the foot ring, a groove, the belly, the lip, inside the mouth a floor
    // 14 m under the lip, and on it the dark mound in three steps that stands inside the heap's rings
    const PROFILE = [[176, 0], [176, 16], [160, 22], [196, 44], [250, 74], [296, 110], [328, 148], [346, 186], [350, 222], [340, 254], [322, 278],
      [306, 292], [310, 300], [296, 300], [290, 286], [176, 286], [170, 318], [92, 326], [86, 352], [16, 360], [10, 392], [0, 392]];
    // the shade of the band above each joint of the profile
    const BAND = [0.72, 0.6, 0.9, 1, 0.92, 1, 0.92, 1, 0.92, 1, 0.92, 0.78, 0.98, 0.5, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42];
    const TOP = 300, FOOT = 176, BELLY = 350, heap = [];         // heap rows: x, y of the underside, z, tilt axis angle, tilt, ink
    const jarG = new THREE.LatheGeometry(PROFILE.map((q) => new THREE.Vector2(q[0], q[1])), 96).toNonIndexed();
    {
      // flat bands: the turning's faces come segment by segment, two to a band, in the profile's order
      const jp = jarG.attributes.position, col = new Float32Array(jp.count * 3);
      // (red: the band's shade; green: 0.5 on the foot ring and its groove, 1 on the lip, 0 elsewhere; blue: the
      // band's tooth, up to 9 degrees either way, by which every step's edge is set over on that band)
      for (let f = 0; f < jp.count; f += 3) {
        const b = Math.floor(f / 6) % (PROFILE.length - 1), kind = b < 2 ? 0.5 : b === 11 || b === 12 ? 1 : 0, t = Math.sin(b * 12.9898 + 4.1) * 43758.5453;
        for (let k = 0; k < 3; k++) col.set([BAND[b], kind, (t - Math.floor(t) - 0.5) * 18], (f + k) * 3);
      }
      jarG.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    const PAN = 9 * SP + 150;                                    // half the pan's width
    const jars = [[(22.3 - 10) * SP, (1.7 - 10) * SP, 5], [Math.sin(325 * D2R) * 2220, -Math.cos(325 * D2R) * 2220, 4]];
    for (const [cx, cz, ink] of jars) {
      const body = new THREE.Mesh(jarG, jarMat); body.position.set(cx, 0, cz); body.name = 'jar'; both(body);
      const footH = 30 - mistY;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(FOOT + 6, FOOT + 6 + 1.05 * footH, footH, 72, 1, true), footInk);
      foot.position.set(cx, -footH / 2, cz); foot.renderOrder = -9; foot.frustumCulled = false; foot.name = 'jar-foot'; scene.add(foot);
      // the heap, layer on layer: how many, the ring's radius, the underside's height, the greatest lean outward
      const rows = [[11, 236, 274, 0.12], [7, 148, 314, 0.2], [3, 74, 356, 0.14], [1, 0, 390, 0.04]];
      for (const [n, r, y, tilt] of rows) {
        // (a ring's stones keep their even places but for a play that leaves the chord between two neighbours' middles
        // longer than a stone is wide: no two stones of a ring touch)
        const a0 = jarRng() * TAU, play = n > 1 ? 0.9 * Math.max(0, 1 - 2 * Math.asin(63 / r) / (TAU / n)) : 0;
        for (let i = 0; i < n; i++) {
          const a = a0 + (i + (jarRng() - 0.5) * play) * TAU / n, lean = tilt * (0.35 + 0.65 * jarRng());
          // a stone leans outward: it turns about the level line across its radius
          heap.push([cx + Math.cos(a) * r, y + (n > 1 ? jarRng() * 3 : 0), cz + Math.sin(a) * r, a + Math.PI / 2, -lean, ink]);
        }
      }
    }
    await ctx.yield();
    // each bowl's built shadow on the mist: its round carried down-sun by 4 times its height over the mist
    const bsP = [], bsLen = style.SHADOW * (TOP + 100 - mistY), sd = style.shadowDir, sa = Math.atan2(sd.y, sd.x);
    for (const [cx, cz] of jars) {
      const ring = [];
      for (let i = 0; i <= 24; i++) { const a = sa + Math.PI / 2 + i / 24 * Math.PI; ring.push([cx + Math.cos(a) * BELLY, cz + Math.sin(a) * BELLY]); }
      for (let i = 0; i <= 24; i++) { const a = sa - Math.PI / 2 + i / 24 * Math.PI; ring.push([cx + sd.x * bsLen + Math.cos(a) * BELLY, cz + sd.y * bsLen + Math.sin(a) * BELLY]); }
      const mx = cx + sd.x * bsLen / 2, mz = cz + sd.y * bsLen / 2;
      for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; bsP.push(mx, 0, mz, q[0], 0, q[1], p[0], 0, p[1]); }
    }
    const bsG = new THREE.BufferGeometry(); bsG.setAttribute('position', new THREE.Float32BufferAttribute(bsP, 3));
    bsG.setAttribute('normal', new THREE.Float32BufferAttribute(bsP.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
    const jarShadow = new THREE.Mesh(bsG, new THREE.MeshBasicMaterial({ color: mixc(P.plum, cFar, 0.55), side: THREE.DoubleSide }));
    jarShadow.position.y = mistY + 1.5; jarShadow.frustumCulled = false; jarShadow.renderOrder = -8.5; jarShadow.name = 'jar-shadows'; scene.add(jarShadow);
    const heapG = style.lensGeometry(18, 3);
    heapG.setAttribute('aInk', new THREE.InstancedBufferAttribute(new Float32Array(heap.map((h) => h[5])), 1));
    const heaps = new THREE.InstancedMesh(heapG, heapMat, heap.length);
    heap.forEach((h, i) => {
      quat.setFromAxisAngle(v3.set(Math.cos(h[3]), 0, Math.sin(h[3])), h[4]);
      m4.compose(v3.set(0, -24, 0).applyQuaternion(quat).add(new THREE.Vector3(h[0], h[1] + 24, h[2])), quat, one);
      heaps.setMatrixAt(i, m4);
    });
    heaps.instanceMatrix.needsUpdate = true; heaps.name = 'heaps'; both(heaps);
    await ctx.yield();

    // a geometry of flat faces from a list of triangles (nine figures each), each face with its own normal
    const flat = (tris, colors) => {
      const n = tris.length / 9, nor = new Float32Array(n * 9), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        a.fromArray(tris, i * 9); b.fromArray(tris, i * 9 + 3); c.fromArray(tris, i * 9 + 6);
        b.sub(a); c.sub(a); b.cross(c).normalize();
        for (let k = 0; k < 3; k++) b.toArray(nor, i * 9 + k * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      if (colors) g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return g;
    };

    // ---- low cloud slabs: level lozenges stacked in steps, all round the sky but for the arc about the sun --------
    const cloudRng = ctx.rng.fork('clouds');
    const cT = [], cC = [], cA = [];
    const slab = (attr, ox, oy, oz, len, dep, th, tint) => {
      const N = 12, at = (i, y) => { const a = (i % N) / N * TAU; return [ox + Math.cos(a) * len / 2, oy + y, oz + Math.sin(a) * dep / 2]; };
      for (let i = 0; i < N; i++) {
        const b0 = at(i, 0), b1 = at(i + 1, 0), t0 = at(i, th), t1 = at(i + 1, th);
        cT.push(ox, oy + th, oz, ...t1, ...t0, ox, oy, oz, ...b0, ...b1, ...b0, ...t0, ...t1, ...b0, ...t1, ...b1);
        for (let k = 0; k < 12; k++) { cC.push(tint[0], tint[1], tint[2]); cA.push(attr[0], attr[1], attr[2], attr[3]); }
      }
    };
    for (let i = 0; i < nClouds; i++) {
      const dist = 3900 + cloudRng() * 3000, elev = (4 + cloudRng() * cloudRng() * 13) * D2R, seed = cloudRng();
      const attr = [(i + cloudRng() * 0.7) / nClouds, dist, dist * Math.tan(elev), seed];
      const len = (900 + cloudRng() * 1100) * dist / 5000, dep = 380 + cloudRng() * 260, th = 46 + cloudRng() * 40, steps = 2 + Math.floor(cloudRng() * 3);
      let ox = 0, w = len;
      for (let j = 0; j < steps; j++) {
        slab(attr, -ox, j * th * 0.9, 0, w, dep * (1 - j * 0.16), th, [0.93, 0.84, 0.88]);
        if (j === steps - 1) slab(attr, -ox, (j + 1) * th * 0.9 + 1, 0, w * 0.96, dep * (1 - j * 0.16) * 0.96, th * 0.3, [1, 1, 1]);
        w *= 0.5 + cloudRng() * 0.22; ox += (cloudRng() - 0.5) * (len - w) * 0.7;
      }
    }
    const cloudG = flat(cT, cC);
    cloudG.setAttribute('aCloud', new THREE.Float32BufferAttribute(cA, 4));
    // a slab's ink, by the face's own normal against the sun in three flat steps. On the slab the low sun shines
    // through: a face turned from the sun takes the brightest ink, a face across it and the underside the middle
    // one, a face turned to the sun the shell with a little rose. On the slab's image in the water the steps run
    // the other way round (uMir is 1 on the slab and -1 on its image).
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: own({ c0: P.kerb, c1: mixc(P.kerb, P.shell, 0.5), c2: mixc(P.shell, P.rose, 0.16), uArc: new THREE.Vector2(26 * D2R, 312 * D2R) }),
      vertexShader: CLOUD_VERT, vertexColors: true,
      fragmentShader: `${style.glsl}\nuniform vec3 c0, c1, c2; uniform float uMir; varying vec3 vW; varying vec3 vN; varying vec3 vC;
        void main(){
          vec3 n = vN / max(length(vN), 1e-4);
          float d = -uMir * dot(n, uSun), clr = 1. - castShade(vW);
          gl_FragColor = vec4((d > .42 && clr > .5 ? c0 : (d > .02 && clr > .5 ? c1 : c2)) * vC, 1.);
        }`,
    });
    const clouds = new THREE.Mesh(cloudG, cloudMat); clouds.name = 'clouds'; both(clouds);
    await ctx.yield();

    // ---- stacks of lens clouds at many heights, over the pan and beyond it on every side but the sun's: each three
    // to seven thin smooth plates one over another, and no two stacks built alike: a stack is widest at a height of
    // its own (low, middle or high), narrows from there at its own rate, and every plate lies a little off the
    // one below, the whole leaning its own way. Two always stand east and south-east of the shell neighbour;
    // the others are dealt round the board's centre, and among them three or four single long plates;
    // none is dealt within 22 degrees of the sun's bearing and no dealt stack's middle rests within 1,000 m of the
    // flown line on the plan (its plates lie a little off the middle and it drifts 240 m from there).
    const stackRng = ctx.rng.fork('stacks');
    const sA = [], pA = [];
    const stack = (x, y, z, len, plates = 0) => {
      const n = plates || 3 + Math.floor(stackRng() * 5), seed = stackRng(), yaw = stackRng() * Math.PI;
      const peak = stackRng(), taper = 0.35 + 0.55 * stackRng(), lean = (stackRng() - 0.5) * 0.1;
      let yy = y, ox = 0, oz = 0;
      for (let j = 0; j < n; j++) {
        const k = n > 1 ? 1 - taper * Math.abs(j / (n - 1) - peak) / Math.max(peak, 1 - peak) : 1;
        const hl = len / 2 * k * (0.85 + 0.3 * stackRng()), th = 4.5 + stackRng() * 5;
        ox += (lean + (stackRng() - 0.5) * 0.1) * len; oz += (stackRng() - 0.5) * 0.1 * len;
        sA.push(x + ox, yy + th, z + oz, seed);
        pA.push(hl, hl * (0.5 + 0.3 * stackRng()), th, yaw + (stackRng() - 0.5) * 0.3);
        yy += th * 2 + 26 + stackRng() * 34;
      }
    };
    const NX = (16 - 10) * SP, NZ = (9 - 10) * SP;
    stack(NX + Math.sin(95 * D2R) * 1900, 520, NZ - Math.cos(95 * D2R) * 1900, 820);
    stack(NX + Math.sin(140 * D2R) * 1700, 430, NZ - Math.cos(140 * D2R) * 1700, 700);
    // no dealt stack stands before the sun: seen from each of 41 points of the line, the middle of a stack lies
    // more than 11 degrees and its own reach (its length and its drift) away from the sun's direction. A stack is
    // dealt a bearing and a distance; while it stands over the line it is moved 400 m out, and while it stands
    // before the sun, 6 degrees further round, away from the sun's bearing.
    const sunClear = (x, y, z, reach) => {
      for (let i = 0; i <= 40; i++) {
        real.pointAt(i / 40, v3);
        const dx = x - v3.x, dy = y - v3.y, dz = z - v3.z, d = Math.hypot(dx, dy, dz) || 1;
        if (Math.acos(clamp((dx * style.sun.x + dy * style.sun.y + dz * style.sun.z) / d, -1, 1)) < 11 * D2R + Math.atan2(reach, d)) return false;
      }
      return true;
    };
    const dealt = (b, dist, y, len, plates) => {
      for (let k = 0; k < 40; k++) {
        const x = Math.sin(b) * dist, z = -Math.cos(b) * dist;
        if (real.nearestXZ(x, z).dist < 1000) dist += 400;
        else if (!sunClear(x, y + 120, z, len * 0.9 + 240)) b += (b > Math.PI ? -6 : 6) * D2R;
        else break;
      }
      stack(Math.sin(b) * dist, y, -Math.cos(b) * dist, len, plates);
    };
    for (let i = 0; i < nStacks - 2; i++) {
      const b = (22 + (i + stackRng() * 0.8) / (nStacks - 2) * 316) * D2R, dist = 500 + stackRng() * 3700;
      dealt(b, dist, 300 + stackRng() * stackRng() * 1100 + dist * 0.03, 300 + stackRng() * 600, 0);
    }
    for (let i = 0, nLong = 3 + Math.floor(stackRng() * 2); i < nLong; i++) {
      const b = (22 + (i + stackRng() * 0.8) / nLong * 316) * D2R, dist = 900 + stackRng() * 3300;
      dealt(b, dist, 300 + stackRng() * stackRng() * 1100 + dist * 0.03, 700 + stackRng() * 700, 1);
    }
    const plateG = new THREE.InstancedBufferGeometry(), ball = new THREE.SphereGeometry(1, 24, 6);
    plateG.setAttribute('position', ball.attributes.position); plateG.setAttribute('normal', ball.attributes.normal); plateG.setIndex(ball.index);
    plateG.setAttribute('aStack', new THREE.InstancedBufferAttribute(new Float32Array(sA), 4));
    plateG.setAttribute('aPlate', new THREE.InstancedBufferAttribute(new Float32Array(pA), 4));
    plateG.instanceCount = pA.length / 4;
    const midSky = mixc(P.rose, P.violet, 0.4);
    const plates = new THREE.Mesh(plateG, new THREE.ShaderMaterial({
      uniforms: { uSun: U.uSun, uTime: U.uTime, uMir: U.uMir, cTop: { value: mixc(P.shell, midSky, 0.42) }, cSunny: { value: mixc(P.shell, P.kerb, 0.5) }, cUnder: { value: mixc(P.ring, P.shell, 0.25) } },
      vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG,
    }));
    // (a plate's image is the same plate of fewer faces, on the same tables)
    const plateImageG = new THREE.InstancedBufferGeometry(), ball2 = new THREE.SphereGeometry(1, 18, 5);
    plateImageG.setAttribute('position', ball2.attributes.position); plateImageG.setAttribute('normal', ball2.attributes.normal); plateImageG.setIndex(ball2.index);
    plateImageG.setAttribute('aStack', plateG.attributes.aStack); plateImageG.setAttribute('aPlate', plateG.attributes.aPlate);
    plateImageG.instanceCount = plateG.instanceCount;
    plates.name = 'lens-clouds'; both(plates, plateImageG);
    await ctx.yield();

    // the rare deal: a pale second disc low in the east with one ring (flat, built, far away), and its image
    if (rare) {
      const discG = new THREE.CircleGeometry(470, 64), ringG = new THREE.RingGeometry(600, 650, 80);
      const dm = new THREE.MeshBasicMaterial({ color: mixc(P.shell, P.rose, 0.2), side: THREE.DoubleSide }), hm = new THREE.MeshBasicMaterial({ color: mixc(P.shell, P.rose, 0.5), side: THREE.DoubleSide });
      for (const s of [1, -1]) for (const m of [new THREE.Mesh(discG, dm), new THREE.Mesh(ringG, hm)]) {
        m.rotation.y = -Math.PI / 2 - 0.2; m.position.set(9400, 1900 * s, 1900); m.renderOrder = s < 0 ? -6.5 : 0; m.name = 'second-disc'; scene.add(m);
      }
    }

    // a built shadow: a flat shape just over the water that makes everything under it one step darker (the same
    // figure the lines use), and leaves itself out where a stone's shadow already lies
    const builtShadow = (vert) => {
      const m = new THREE.ShaderMaterial({
        uniforms: own({ cMul: style.shadeMul, uLand: new THREE.Vector2(LX, LZ) }), vertexShader: vert || style.vert,
        fragmentShader: `${style.glsl}\nuniform vec3 cMul; varying vec3 vW;\nvoid main(){ gl_FragColor = vec4(mix(cMul, vec3(1.), castShade(vW)), 1.); }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
        blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
      });
      return m;
    };
    // where a bowl's shadow reaches in over the pan's edge it lies on the water too: the same shape again just over
    // the sheet, kept to the pan
    const jarOnPan = builtShadow();
    jarOnPan.fragmentShader = jarOnPan.fragmentShader.replace('void main(){', `void main(){ if (max(abs(vW.x), abs(vW.z)) > ${PAN.toFixed(1)}) discard;`);
    const jarShadowPan = new THREE.Mesh(bsG, jarOnPan);
    jarShadowPan.position.y = 0.07; jarShadowPan.frustumCulled = false; jarShadowPan.renderOrder = 3; jarShadowPan.name = 'jar-shadows-pan'; scene.add(jarShadowPan);

    // ---- the causeways' bodies. Their paved tops are the part's line sheet; here: both side walls of every causeway,
    // 0.6 m of stone from the water up (the north faces lit, the west faces in the half tone), and slim mooring posts 4 m tall
    // standing in the water 3.4 m from a causeway's middle, every 35 m, by turns on either bank, along every stretch
    // whose middle lies within 420 m of the flown line on the plan where the line is under 60 m up; round each platform that carries no stone and
    // lies within 600 m of that line a ring of twelve. No post stands within 31 m of a stone's axis or of a
    // platform's middle but those rings. Each post has its image and its built shadow.
    const wallT = [];
    const wall = (ax, az, bx, bz, nx, nz) => {
      const q = [ax, 0, az, bx, 0, bz, bx, 0.6, bz, ax, 0, az, bx, 0.6, bz, ax, 0.6, az];
      const flip = ((bz - az) * -0.6) * nx + (0.6 * (bx - ax)) * nz < 0;    // the first triangle's normal against the wanted side
      if (flip) for (const o of [0, 9]) for (let k = 0; k < 3; k++) { const t = q[o + 3 + k]; q[o + 3 + k] = q[o + 6 + k]; q[o + 6 + k] = t; }
      wallT.push(...q);
    };
    for (let i = 1; i <= 19; i++) {
      const c = (i - 10) * SP;
      for (const s of [-1, 1]) { wall(c + s * 2.5, -PAN, c + s * 2.5, PAN, s, 0); wall(-PAN, c + s * 2.5, PAN, c + s * 2.5, 0, s); }
    }
    const walls = new THREE.Mesh(flat(wallT), style.ink({ lit: mixc(P.kerb, P.ripple, 0.25), half: mixc(P.channel, P.plum, 0.45), shade: mixc(P.channel, P.slate, 0.35) }));
    walls.name = 'causeway-walls'; both(walls);
    const postAt = [];
    for (let col = 1; col <= 19; col++) for (let row = 1; row <= 19; row++) {
      for (let k = 0; k < 2; k++) {
        const c2 = col + (k === 0 ? 1 : 0), r2 = row + (k === 1 ? 1 : 0);
        if (c2 > 19 || r2 > 19) continue;
        const ax = (col - 10) * SP, az = (row - 10) * SP;
        const nr = real.nearestXZ(ax + (k === 0 ? 70 : 0), az + (k === 1 ? 70 : 0));
        if (nr.dist > 420 || nr.y > 60) continue;
        for (let j = 0; j < 4; j++) {
          const along = 17.5 + 35 * j, side = (j + col + row) % 2 ? 3.4 : -3.4;
          if ((along < 31 && (isStone(col, row) || isStar(col, row))) || (along > SP - 31 && (isStone(c2, r2) || isStar(c2, r2)))) continue;
          postAt.push(ax + (k === 0 ? along : side), az + (k === 1 ? along : side));
        }
      }
      if (isStar(col, row) && !isStone(col, row) && real.nearestXZ((col - 10) * SP, (row - 10) * SP).dist < 600) {
        for (let j = 0; j < 12; j++) { const a = (j + 0.5) * TAU / 12; postAt.push((col - 10) * SP + Math.cos(a) * 19.6, (row - 10) * SP + Math.sin(a) * 19.6); }
      }
    }
    const postT = [], postC = [];
    for (let i = 0; i < 3; i++) {
      const a0 = i * TAU / 3 + 0.4, a1 = (i + 1) * TAU / 3 + 0.4, b = 0.3, t = 0.2;
      const p0 = [Math.cos(a0) * b, 0, Math.sin(a0) * b], p1 = [Math.cos(a1) * b, 0, Math.sin(a1) * b], q0 = [Math.cos(a0) * t, 4, Math.sin(a0) * t], q1 = [Math.cos(a1) * t, 4, Math.sin(a1) * t];
      postT.push(...p0, ...q0, ...q1, ...p0, ...q1, ...p1);
      for (let k = 0; k < 6; k++) postC.push(1, 1, 1);
    }
    postT.push(Math.cos(0.4) * 0.2, 4, Math.sin(0.4) * 0.2, Math.cos(0.4 + 2 * TAU / 3) * 0.2, 4, Math.sin(0.4 + 2 * TAU / 3) * 0.2, Math.cos(0.4 + TAU / 3) * 0.2, 4, Math.sin(0.4 + TAU / 3) * 0.2);
    for (let k = 0; k < 3; k++) postC.push(1.5, 1.5, 1.5);
    const postInk = style.ink({ lit: mixc(P.channel, P.plum, 0.7), half: mixc(P.channel, P.plum, 0.3), shade: mixc(P.channel, P.slate, 0.4), vertexColors: true });
    const posts = new THREE.InstancedMesh(flat(postT, postC), postInk, Math.max(1, postAt.length / 2));
    const postShadows = new THREE.InstancedMesh(style.streakGeometry(4, 0.5), builtShadow(), Math.max(1, postAt.length / 2));
    for (let i = 0; i < postAt.length / 2; i++) { m4.makeTranslation(postAt[i * 2], 0, postAt[i * 2 + 1]); posts.setMatrixAt(i, m4); postShadows.setMatrixAt(i, m4); }
    posts.count = postShadows.count = postAt.length / 2;
    posts.instanceMatrix.needsUpdate = true; postShadows.instanceMatrix.needsUpdate = true;
    posts.name = 'posts'; both(posts);
    postShadows.frustumCulled = false; postShadows.renderOrder = 3; postShadows.name = 'post-shadows'; scene.add(postShadows); instanced.push(postShadows);
    await ctx.yield();

    // ---- boats on the water, each going up and down a lane 15 m beside a causeway between two crossings, beside
    // the low legs of the line; up to nine of them first on the open water north-west of the gap (stretches whose
    // middle lies 60 to 520 m from the point (694, -108), within 34 degrees of bearing 327 from it) ---------------
    const lifeRng = ctx.rng.fork('life');
    const stretches = [];                    // every stretch of causeway between two neighbouring crossings near the line
    for (let col = 1; col <= 19; col++) for (let row = 1; row <= 19; row++) for (let k = 0; k < 2; k++) {
      const c2 = col + (k === 0 ? 1 : 0), r2 = row + (k === 1 ? 1 : 0);
      if (c2 > 19 || r2 > 19) continue;
      const ax = (col - 10) * SP, az = (row - 10) * SP, mx = ax + (k === 0 ? 70 : 0), mz = az + (k === 1 ? 70 : 0), near = real.nearestXZ(mx, mz);
      if (near.dist > 420) continue;
      const stoneA = isStone(col, row), stoneB = isStone(c2, r2);
      stretches.push({ k, ax, az, mx, mz, off: near.dist, eye: near.y, stoneA, stoneB,
        inA: stoneA ? 74 : isStar(col, row) ? 30 : 16, inB: stoneB ? 74 : isStar(c2, r2) ? 30 : 16 });
    }
    // a flat hull 10 m long, dark, and one pale sail 9 m tall with a belly; every boat keeps to a lane of which
    // none of nine points along it is nearer than 22 m to the flown line or 96 m to the landing point
    const hull = [], hullC = [], rim = [[-5, 0], [-3, -1.5], [3, -1.5], [5, 0], [3, 1.5], [-3, 1.5]];
    const paint = (n, c) => { for (let i = 0; i < n * 3; i++) hullC.push(c[0], c[1], c[2]); };
    for (let i = 0; i < 6; i++) {
      const [x0, z0] = rim[i], [x1, z1] = rim[(i + 1) % 6];
      hull.push(x0 * 0.86, 0, z0 * 0.8, x0, 0.9, z0, x1, 0.9, z1, x0 * 0.86, 0, z0 * 0.8, x1, 0.9, z1, x1 * 0.86, 0, z1 * 0.8, 0, 0.9, 0, x1, 0.9, z1, x0, 0.9, z0);
    }
    paint(18, [0.3, 0.25, 0.31]);
    const sl0 = [0.9, 1.0, 0], sl1 = [0.9, 10, 0], sl2 = [-3.9, 1.5, 0], slM = [-0.9, 4.3, 1.1];
    hull.push(...sl0, ...sl1, ...slM, ...sl1, ...sl2, ...slM, ...sl2, ...sl0, ...slM);
    paint(3, [1, 1, 1]);
    const boatSeg = [], boatPh = [];
    const inWedge = (st) => {
      const dx = st.mx - 694, dz = st.mz + 108, d = Math.hypot(dx, dz), b = Math.atan2(dx, -dz) / D2R;
      return d > 60 && d < 520 && Math.abs(((b - 327) % 360 + 540) % 360 - 180) < 34;
    };
    const rank = (st) => (inWedge(st) ? 0 : st.off > 190 ? 2 : 1);
    const order = lifeRng.shuffle(stretches.slice()).sort((a, b) => rank(a) - rank(b));
    let wedged = 0;
    for (const st of order) {
      const len = SP - st.inA - st.inB, sx = st.ax + (st.k === 0 ? st.inA : 0), sz = st.az + (st.k === 1 ? st.inA : 0), ph = lifeRng();
      if (boatSeg.length / 4 >= nBoats || len < 40 || st.eye > 30 || st.off > 330 || (inWedge(st) && wedged >= 9)) continue;
      const side = (ph * 7) % 1 > 0.5 ? 15 : -15;
      let clear = true;
      for (let j = 0; j <= 8; j++) {
        const x = sx + (st.k === 0 ? len * j / 8 : -side), z = sz + (st.k === 1 ? len * j / 8 : side);
        if (real.distanceTo(x, 5, z) < 22 || Math.hypot(x - LX, z - LZ) < 96) clear = false;
      }
      if (!clear) continue;
      boatSeg.push(sx, sz, st.k === 0 ? 0 : Math.PI / 2, len); boatPh.push(ph);
      if (inWedge(st)) wedged++;
    }
    const boatAttr = (g) => {
      g.setAttribute('aSeg', new THREE.InstancedBufferAttribute(new Float32Array(boatSeg.length ? boatSeg : [0, 0, 0, 1]), 4));
      g.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(boatPh.length ? boatPh : [0]), 1));
      g.instanceCount = boatPh.length; return g;
    };
    const boatG = new THREE.InstancedBufferGeometry(), hullG = flat(hull, hullC);
    for (const k of ['position', 'normal', 'color']) boatG.setAttribute(k, hullG.attributes[k]);
    const boatMat = withVert(style.ink({ lit: P.shell, half: mixc(P.shell, P.shellShade, 0.5), shade: P.shellShade, vertexColors: true, side: THREE.DoubleSide }), BOAT_VERT);
    boatMat.uniforms.uLand = { value: new THREE.Vector2(LX, LZ) };
    const boats = new THREE.Mesh(boatAttr(boatG), boatMat); boats.name = 'boats'; both(boats);
    const boatShG = new THREE.InstancedBufferGeometry(), streak = style.streakGeometry(10, 4.6);
    boatShG.setAttribute('position', streak.attributes.position); boatShG.setIndex(streak.index);
    const boatShadows = new THREE.Mesh(boatAttr(boatShG), builtShadow(BOAT_SHADOW_VERT));
    boatShadows.frustumCulled = false; boatShadows.renderOrder = 3; boatShadows.name = 'boat-shadows'; scene.add(boatShadows);
    await ctx.yield();

    // ---- wading birds, 3.2 m tall, standing in the water in dense bands by place: beside the line where it
    // crosses the open mirror (from u 0.2296 to 0.40, 14 to 70 m off it); beside the straight toward the shell
    // neighbour (u 0.835 to 0.9, 14 to 80 m off) and beside the last turn and leg (u 0.905 to 0.985, 14 to 80 m
    // off), in the measure of 1,050, 350 and 600 birds (the great colony round the loop is built after them). A bird's place is 14 m or more from
    // every part of the line, off every causeway, platform and boat's lane, and a ring of 5 to 11 m radius beside
    // it on the far side from the line is clear of the line by 12 m on the plan, of every stone's axis by 70 m
    // and of the landing point by 100 m. (The figures pushed here for a flight are set again below, skein by skein.)
    const wd = [], wd2 = [], pt = new THREE.Vector3(), tg = new THREE.Vector3(), np = new THREE.Vector3();
    // every band draws for its full number at every graphics level; a lower level stands only the first of them
    const flockFull = 0.85 + 0.3 * (nBands - 8) / 6, flockK = flockFull * detail;
    const axes = TABLE.map((s) => [(s[0] - 10) * SP, (s[1] - 10) * SP]);
    const offLine = (x, z) => { const m = (v) => Math.abs(v - Math.round(v / SP) * SP); return Math.min(m(x), m(z)); };
    const laneClear = (x, z) => {
      for (let i = 0; i < boatPh.length; i++) {
        const sx = boatSeg[i * 4], sz = boatSeg[i * 4 + 1], alongX = boatSeg[i * 4 + 2] === 0, len = boatSeg[i * 4 + 3], side = (boatPh[i] * 7) % 1 > 0.5 ? 15 : -15;
        const al = alongX ? x - sx : z - sz, ac = alongX ? z - sz - side : x - sx + side;
        if (al > -8 && al < len + 8 && Math.abs(ac) < 6) return false;
      }
      return true;
    };
    // (a band lies beside the line from u0 to u1, out to `far` metres from it)
    const band = async (u0, u1, far, full, want) => {
      for (let i = 0, made = 0; i < full * 4 && made < full; i++) {
        const du = lifeRng(), u = u0 + (u1 - u0) * du, side = lifeRng() < 0.5 ? -1 : 1, dl = lifeRng(), lat = 14 + (far - 14) * Math.pow(dl, 1.5), seed = lifeRng(), R = 5 + 6 * lifeRng();
        if (i % 120 === 119) await ctx.yield();
        path.pointAt(u, pt); path.tangentAt(u, tg);
        const tl = Math.hypot(tg.x, tg.z) || 1, px = -tg.z / tl * side, pz = tg.x / tl * side;
        const x = pt.x + px * lat, z = pt.z + pz * lat;
        if (Math.abs(x) > PAN - 12 || Math.abs(z) > PAN - 12 || offLine(x, z) < 4.6 || !laneClear(x, z)) continue;
        const near = real.nearestXZ(x, z);
        if (near.dist < 14) continue;
        // straight away from the line at its place; the middle of the ring kept clear lies R out that way
        real.pointAt(near.u, np);
        const nl = Math.hypot(x - np.x, z - np.z) || 1, ax = (x - np.x) / nl, az = (z - np.z) / nl, cx = x + ax * R, cz = z + az * R;
        let clear = Math.hypot(cx - LX, cz - LZ) - R > 100 && Math.hypot(x - LX, z - LZ) > 100;
        for (const [sx, sz] of axes) if (Math.hypot(cx - sx, cz - sz) - R < 70 || Math.hypot(x - sx, z - sz) < 70) clear = false;
        for (let j = 1; j < 8 && clear; j++) { const a = j * TAU / 8; if (real.nearestXZ(cx - R * (Math.cos(a) * ax - Math.sin(a) * az), cz - R * (Math.sin(a) * ax + Math.cos(a) * az)).dist < 12) clear = false; }
        const starX = Math.round((x / SP + 6) / 6) * 6 - 6, starZ = Math.round((z / SP + 6) / 6) * 6 - 6;
        if (!clear || Math.hypot(x - starX * SP, z - starZ * SP) < 23) continue;
        const dist = Math.hypot(x - LX, z - LZ), wave = waveAt(x, z), lead = 3.4 * (1 - sm((dist - 200) / 220));
        const cell = Math.sin(Math.floor(x / 55) * 12.9898 + Math.floor(z / 55) * 78.233) * 43758.5453, more = 3 * lifeRng();
        if (made++ >= want) continue;
        wd.push(x, z, wave - lead, seed);
        wd2.push(Math.atan2(az, ax), R, lead + 6 + more, cell - Math.floor(cell) + 0.05 * seed);
      }
    };
    await band(0.2296, 0.40, 70, Math.round(1050 * flockFull), Math.round(1050 * flockK));
    await band(0.835, 0.9, 80, Math.round(350 * flockFull), Math.round(350 * flockK));
    await band(0.905, 0.985, 80, Math.round(600 * flockFull), Math.round(600 * flockK));
    // The flights. The birds standing on one 55 m square of the pan are one skein. Its round is an oval through
    // each bird's own place, 35 to 55 m either way along a causeway's direction (or 0.62 of that), 18 to 30 m
    // wide on the side away from the line, feet 5.5 to 14 m over the water; in the air every bird draws in to 0.3 of its sideways distance from the skein's middle line. A bird
    // flies only if its place and nine points of its round (taken at half and at full height) are 28 m or
    // more from the line on the plan (the line taken as 401 points), 100 m from the landing point, 68 m from
    // every stone's axis and 6 m inside the pan's edge. Of the eight rounds a square could fly (four ways, two
    // lengths) it flies the one that carries the most of its birds; at most sixty of a square fly, and where
    // fewer than twenty could, none does; the birds left standing are then taken once more as squares set half a
    // square over. Each skein has its own turn in the round of 87 s. The skein lifts 3.4 s before the wave's ring would reach its middle
    // where the stone comes down within 200 m (less from there out to 420 m, where it waits for the ring) and
    // is down again 9 to 12 s later.
    const nW = wd.length / 4, wd3 = new Float32Array(Math.max(1, nW) * 4), lineXZ = [];
    for (let i = 0; i <= 400; i++) { real.pointAt(i / 400, pt); lineXZ.push(pt.x, pt.z); }
    const hh = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
    // the birds of the list as squares of 55 m, the squares' corners moved by `shift`
    const squaresOf = (list, shift) => {
      const map = new Map();
      for (const i of list) {
        const key = Math.floor((wd[i * 4] + shift) / 55) + ',' + Math.floor((wd[i * 4 + 1] + shift) / 55);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(i);
      }
      return [...map.values()];
    };
    let tested = 0;
    // one square's skein: its round is chosen and, if twenty or more can fly it, given to them
    const skein = async (list) => {
      let mx = 0, mz = 0;
      for (const i of list) { mx += wd[i * 4] / list.length; mz += wd[i * 4 + 1] / list.length; }
      const local = [], stones = [[LX, LZ, 100 * 100]];         // what lies within reach of the square: the line's points, the stones' axes
      for (let i = 0; i < lineXZ.length; i += 2) if (Math.hypot(lineXZ[i] - mx, lineXZ[i + 1] - mz) < 200) local.push(lineXZ[i], lineXZ[i + 1]);
      for (const [sx, sz] of axes) if (Math.hypot(sx - mx, sz - mz) < 240) stones.push([sx, sz, 68 * 68]);
      const clearAt = (px, pz) => {
        if (Math.max(Math.abs(px), Math.abs(pz)) > PAN - 6) return false;
        for (let i = 0; i < local.length; i += 2) { const dx = local[i] - px, dz = local[i + 1] - pz; if (dx * dx + dz * dz < 28 * 28) return false; }
        for (const [sx, sz, rr] of stones) { const dx = sx - px, dz = sz - pz; if (dx * dx + dz * dz < rr) return false; }
        return true;
      };
      const near = real.nearestXZ(mx, mz); real.pointAt(near.u, np);
      const awx = mx - np.x, awz = mz - np.z, kx = Math.floor(mx / 27.5), kz = Math.floor(mz / 27.5);
      const A0 = 35 + 20 * hh(kx + 3, kz), B = 9 + 6 * hh(kx, kz + 5), H = 7 + 5.5 * hh(kx + 9, kz + 2), first = hh(kx, kz) < 0.5 ? -1 : 1;
      const able = list.filter((i) => clearAt(wd[i * 4], wd[i * 4 + 1]));
      let best = null;
      for (let c = 0; c < 8 && able.length >= 20; c++) {
        // the way out: first across the way to the line, then along it; either sense; the full length, then the short
        const east = (Math.abs(awz) >= Math.abs(awx)) === (c % 4 < 2), s1 = c % 2 ? -first : first, A = c < 4 ? A0 : 0.62 * A0;
        const e1x = east ? s1 : 0, e1z = east ? 0 : s1, e2x = east ? 0 : (awx < 0 ? -1 : 1), e2z = east ? (awz < 0 ? -1 : 1) : 0;
        const fliers = [];
        for (const i of able) {
          const x = wd[i * 4], z = wd[i * 4 + 1], sq = -0.7 * ((x - mx) * e2x + (z - mz) * e2z);
          let clear = fliers.length < 60;
          for (let j = 1; j < 10 && clear; j++) for (let h = 1; h <= 2 && clear; h++) {
            const th = j * TAU / 10, along = A * Math.sin(th) * h / 2, side = (B * (1 - Math.cos(th)) + sq) * h / 2;
            clear = clearAt(x + e1x * along + e2x * side, z + e1z * along + e2z * side);
          }
          if (clear) fliers.push(i);
          if (++tested % 300 === 0) await ctx.yield();
        }
        if (!best || fliers.length > best.fliers.length) best = { fliers, A, e1x, e1z, e2x, e2z };
        if (fliers.length === Math.min(60, able.length)) break;
      }
      if (!best || best.fliers.length < 20) return;
      const { fliers, A, e1x, e1z, e2x, e2z } = best, left = e1x * e2z - e1z * e2x, turn = hh(kx + 4, kz + 6);
      const dist = Math.hypot(mx - LX, mz - LZ), lift = waveAt(mx, mz) - 3.4 * (1 - sm((dist - 200) / 220)), dur = 9 + 3 * hh(kx + 1, kz + 8);
      for (const i of fliers) {
        const x = wd[i * 4], z = wd[i * 4 + 1], front = clamp(((x - mx) * e1x + (z - mz) * e1z) / 55 + 0.5, 0, 1);
        wd[i * 4 + 2] = lift + 0.9 * (1 - front);
        wd2[i * 4] = Math.atan2(e1z, e1x); wd2[i * 4 + 1] = A; wd2[i * 4 + 2] = dur; wd2[i * 4 + 3] = turn + 0.012 * front;
        wd3[i * 4] = left * B; wd3[i * 4 + 1] = H + 3 * wd[i * 4 + 3] - 1.5; wd3[i * 4 + 2] = -0.7 * left * ((x - mx) * e2x + (z - mz) * e2z);
      }
    };
    const everyBird = [];
    for (let i = 0; i < nW; i++) {
      // the way it faces while it stands; until a skein takes it, it never flies
      const seed = wd[i * 4 + 3];
      wd3[i * 4 + 3] = wd2[i * 4] + Math.PI + ((seed * 5) % 1 > 0.5 ? 1 : -1) * Math.PI / 2 + (seed - 0.5) * 5;
      wd2[i * 4 + 1] = 0; everyBird.push(i);
    }
    for (const list of squaresOf(everyBird, 0)) await skein(list);
    // those left standing are taken once more, as squares set half a square over
    for (const list of squaresOf(everyBird.filter((i) => wd2[i * 4 + 1] === 0), 27.5)) await skein(list);
    // the bird's flat faces: three corners standing [x, y], the same three in flight [x, y over the body's line, z],
    // and the face's ink (0 rose, 1 dark, 2 a wing: pale rose from its root, dark over the outer third of its
    // length, 3 a leg: dark while it stands, rose in flight); out: how far out along a wing each corner lies (0 to 1).
    // In flight the two faces of the legs, of the body and of the neck lie crossed, one upright and one level, so
    // that the bird's long line shows its width from the side and from below alike; the head and the bill lie tilted
    // 45 degrees about that line.
    const WT = [], WF = [], WC = [];
    const wtri = (st, fl, tone, out = [0, 0, 0]) => {
      for (let k = 0; k < 3; k++) { WT.push(st[k][0], st[k][1], 0); WF.push(fl[k][0], fl[k][1] + 1.84, fl[k][2] || 0); WC.push(tone, out[k], 0); }
    };
    wtri([[-0.07, 0], [0.05, 0], [-0.01, 1.55]], [[-2.8, -0.1, 0], [-2.8, 0.1, 0], [-0.9, 0, 0]], 3);                         // two legs, trailing in flight
    wtri([[0.2, 0], [0.32, 0], [0.26, 1.55]], [[-2.7, 0, -0.1], [-2.7, 0, 0.1], [-0.85, 0, 0]], 3);
    wtri([[-0.98, 1.8], [0, 1.42], [0.82, 1.84]], [[-1.3, 0, 0], [0, -0.42, 0], [0.9, 0.02, 0]], 0);                            // the body, slim in flight
    wtri([[-0.98, 1.8], [0.82, 1.84], [-0.1, 2.26]], [[-1.3, 0, 0], [0.9, 0.02, 0], [-0.1, 0.02, 0.42]], 0);
    wtri([[0.5, 1.92], [0.74, 1.96], [1.1, 2.94]], [[0.75, 0.19, 0], [0.8, -0.19, 0], [2.25, -0.02, 0]], 0);                    // the neck, stretched forward in flight
    wtri([[0.5, 1.92], [1.1, 2.94], [0.93, 2.97]], [[0.75, 0, 0], [2.25, 0, -0.13], [2.2, 0, 0.13]], 0);
    wtri([[0.9, 2.94], [1.32, 2.97], [1.2, 3.2]], [[2.15, -0.1, -0.1], [2.55, -0.02, -0.02], [2.3, 0.19, 0.19]], 0);           // the head
    wtri([[1.24, 3.1], [1.27, 2.96], [1.68, 2.88]], [[2.45, 0.1, 0.1], [2.5, -0.04, -0.04], [2.9, -0.12, -0.12]], 1);          // the bill
    // the two wings, folded to nothing while it stands: each set at the body, 1.05 m from front to back at its
    // root, 0.8 m at the wrist (1.45 m out and 0.28 m higher), and from there a blade swept back to a point 2.8 m out
    for (const s of [1, -1]) {
      const fold = [[-0.5, 2.05], [0.42, 2.05], [-0.14, 2.05]];
      const A = [0.55, 0.14, s * 0.08], B = [-0.5, 0.14, s * 0.08], Wf = [0.4, 0.42, s * 1.45], Wb = [-0.4, 0.42, s * 1.45], T = [-0.75, 0.2, s * 2.8];
      wtri(fold, [A, B, Wb], 2, [0, 0, 0.5]); wtri(fold, [A, Wb, Wf], 2, [0, 0.5, 0.5]); wtri(fold, [Wf, Wb, T], 2, [0.5, 0.5, 1]);
    }
    const birdShape = (g) => {
      g.setAttribute('position', new THREE.Float32BufferAttribute(WT, 3));
      g.setAttribute('aFly', new THREE.Float32BufferAttribute(WF, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(WC, 3));
      return g;
    };
    const roseInk = mixc(P.rose, new THREE.Color('#D4567A'), 0.6);
    const waderInks = { cA: { value: roseInk }, cB: { value: mixc(P.plum, P.channel, 0.35) }, cC: { value: mixc(roseInk, P.shell, 0.22) } };
    const WADER_FRAG = 'uniform vec3 cA, cB, cC; varying vec3 vTone; void main(){ gl_FragColor = vec4(vTone.x > 2.5 ? (vTone.z > .5 ? cA : cB) : (vTone.x > 1.5 ? (vTone.y > .67 ? cB : cC) : (vTone.x > .5 ? cB : cA)), 1.); }';
    const waderG = birdShape(new THREE.InstancedBufferGeometry());
    waderG.setAttribute('aW', new THREE.InstancedBufferAttribute(new Float32Array(wd.length ? wd : [0, 0, 0, 0]), 4));
    waderG.setAttribute('aW2', new THREE.InstancedBufferAttribute(new Float32Array(wd2.length ? wd2 : [0, 1, 8, 0]), 4));
    waderG.setAttribute('aW3', new THREE.InstancedBufferAttribute(wd3, 4));
    waderG.instanceCount = wd.length / 4;
    const waders = new THREE.Mesh(waderG, new THREE.ShaderMaterial({
      uniforms: { uStone: U.uStone, uTime: U.uTime, uMir: U.uMir, ...waderInks },
      vertexShader: WADER_VERT, fragmentShader: WADER_FRAG, side: THREE.DoubleSide, vertexColors: true,
    }));
    waders.name = 'waders'; both(waders);
    await ctx.yield();

    // ---- THE GREAT COLONY round the loop: the densest standing of waders in the world, 3,000 at the full
    // graphics level, on three grounds about the loop's centre: outside the loop's circle to the north (bearing
    // 322 round to 28, 20 to 150 m from the circle: 0.38 of them, four in five of these within 90 m of it), inside the circle (bearing 170 through west to
    // 32, 14 m from the circle inward to 22 m from the centre: 0.42 of them) and outside it to the south and west
    // (bearing 170 to 322, 14 to 114 m from it), on every ground the more the nearer to the
    // circle. THE NORTHERN BIRDS WITHIN 90 M OF THE CIRCLE GO UP FIRST: those whose seed is under 0.55 at 12 s after
    // the touch and 1 s more for every 150 m from the landing point, the others of them 3.4 s after that; every
    // other bird of the colony when a front that leaves the landing point 16 s after the touch, at 230 m a second,
    // reaches it. A place is 14 m or more from every part of the line on the
    // plan, 100 m from the landing point, 70 m from every stone's axis, off every causeway, platform and boat's
    // lane. The birds standing on one 55 m square on one side of the circle are one skein and fly rounds of one
    // shape (COLONY_VERT): a swing of 80 to 140 m either way along the circle, three skeins in four setting out
    // the way the loop is flown; a bulge of 2 to 12 m away from the circle where the skein stands within 70 m of it and
    // 16 to 60 m farther out (inside the circle: toward the centre), feet 11 to 36 m over the water (the northern
    // birds that go up first: 2 to 36 m, most of them low); one
    // outer skein in four instead crosses over the circle and back, its feet 40 to 49 m up. A bird flies its
    // skein's round only if, at every one of 159 moments of it at which it is off the water, its body is 23 m or
    // more from the line (the line as points 3.7 m apart with their heights), 100 m from the landing point,
    // 72 m from every stone's axis and 8 m inside the pan's edge; failing that it flies a round of half the
    // swing with the plain bulge if that passes, or one of 0.3 of the swing the other way, and failing those too it
    // stands for good.
    const CX = (14.58 - 10) * SP, CZ = (10.42 - 10) * SP, LOOP_R = 1.3 * SP;
    const colRng = ctx.rng.fork('colony');
    const FRONT = 230;                                           // metres a second: the front that sends the colony up
    const COLONY = 3000, nColony = Math.round(COLONY * detail);
    const cl = [], cl2 = [], cl3 = [], colSide = [], colFirst = [];
    for (let i = 0, made = 0; i < COLONY * 6 && made < COLONY; i++) {
      const ground = colRng(), bk = colRng(), dl = colRng(), seed = colRng(), face = colRng() * TAU;
      const inner = ground >= 0.38 && ground < 0.8, b = (ground < 0.38 ? 322 + 66 * bk : inner ? 170 + 222 * bk : 170 + 152 * bk) * D2R;
      const north = ground < 0.38, first = north && dl < 0.8;
      const lat = first ? 20 + 70 * Math.pow(dl / 0.8, 1.3) : north ? 90 + 300 * (dl - 0.8) : 14 + (inner ? (LOOP_R - 36) * Math.pow(dl, 1.5) : 100 * Math.pow(dl, 2.3)), r = LOOP_R + (inner ? -lat : lat);
      const x = CX + Math.sin(b) * r, z = CZ - Math.cos(b) * r;
      if (i % 200 === 199) await ctx.yield();
      if (r < 20 || Math.abs(x) > PAN - 12 || Math.abs(z) > PAN - 12 || offLine(x, z) < 4.6 || !laneClear(x, z)) continue;
      if (Math.hypot(x - LX, z - LZ) < 100 || real.nearestXZ(x, z).dist < 14) continue;
      let clear = true;
      for (const [sx, sz] of axes) if (Math.hypot(x - sx, z - sz) < 70) clear = false;
      const starX = Math.round((x / SP + 6) / 6) * 6 - 6, starZ = Math.round((z / SP + 6) / 6) * 6 - 6;
      if (!clear || Math.hypot(x - starX * SP, z - starZ * SP) < 23) continue;
      if (made++ >= nColony) continue;
      const far = Math.hypot(x - LX, z - LZ);
      cl.push(x, z, first ? (seed < 0.55 ? 12 : 15.4) + far / 150 : 16 + far / FRONT, seed); cl2.push(0, 0, 0, 3); cl3.push(0, face, 0, 0); colSide.push(inner ? -1 : 1); colFirst.push(first);
    }
    // the line by the loop as points with their heights, sorted into squares of 40 m
    const lineGrid = new Map();
    for (let i = 0; i <= 500; i++) {
      real.pointAt(0.4 + 0.6 * i / 500, pt);
      const key = (Math.floor(pt.x / 40) + 512) * 1024 + Math.floor(pt.z / 40) + 512;
      if (!lineGrid.has(key)) lineGrid.set(key, []);
      lineGrid.get(key).push(pt.x, pt.y, pt.z);
    }
    const nearStones = axes.filter(([sx, sz]) => Math.hypot(sx - CX, sz - CZ) < 620);
    // a round of the colony, as COLONY_VERT flies it, tried at 159 moments
    const roundClear = (x, z, At, Ar, H, draw) => {
      const rx = x - CX, rz = z - CZ, r0 = Math.hypot(rx, rz), a0 = Math.atan2(rz, rx);
      for (let j = 1; j < 160; j++) {
        const k = j / 160, th = TAU * k * k * (3 - 2 * k), up = sm(k / 0.08) * (1 - sm((k - 0.8) / 0.2));
        if (up < 0.004) continue;
        const a = a0 + At * Math.sin(th), r = r0 + Ar * (1 - Math.cos(th)) + draw * up;
        const px = CX + Math.cos(a) * r, pz = CZ + Math.sin(a) * r, py = up * H + 1.84;
        if (r < 8 || Math.max(Math.abs(px), Math.abs(pz)) > PAN - 8 || Math.hypot(px - LX, pz - LZ) < 100) return false;
        for (const [sx, sz] of nearStones) if (Math.hypot(px - sx, pz - sz) < 72) return false;
        const gx = Math.floor(px / 40), gz = Math.floor(pz / 40);
        for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iz = gz - 1; iz <= gz + 1; iz++) {
          const cell = lineGrid.get((ix + 512) * 1024 + iz + 512);
          if (!cell) continue;
          for (let q = 0; q < cell.length; q += 3) { const dx = cell[q] - px, dy = cell[q + 1] - py, dz = cell[q + 2] - pz; if (dx * dx + dy * dy + dz * dz < 23 * 23) return false; }
        }
      }
      return true;
    };
    const colSkeins = new Map();
    for (let i = 0; i < colSide.length; i++) {
      const key = Math.floor(cl[i * 4] / 55) + ',' + Math.floor(cl[i * 4 + 1] / 55) + ',' + colSide[i];
      if (!colSkeins.has(key)) colSkeins.set(key, []);
      colSkeins.get(key).push(i);
    }
    let flown = 0;
    for (const list of colSkeins.values()) {
      let mr = 0, dLo = 1e9, dHi = 0;
      const i0 = list[0], side = colSide[i0], kx = Math.floor(cl[i0 * 4] / 55), kz = Math.floor(cl[i0 * 4 + 1] / 55);
      for (const i of list) {
        const d = Math.hypot(cl[i * 4] - LX, cl[i * 4 + 1] - LZ);
        mr += Math.hypot(cl[i * 4] - CX, cl[i * 4 + 1] - CZ) / list.length; dLo = Math.min(dLo, d); dHi = Math.max(dHi, d);
      }
      const sgn = hh(kx + 2, kz + side) < 0.75 ? -1 : 1, swing = (80 + 60 * hh(kx + 5, kz)) / mr, over = side > 0 && hh(kx, kz + 7) < 0.25;
      const lat = Math.abs(mr - LOOP_R), wide = lat < 70 ? 1 + 5 * hh(kx + 1, kz + 3) : 8 + 22 * hh(kx + 1, kz + 3);
      const plain = side > 0 ? wide : -Math.min(wide, (mr - 30) / 2), Ar = over ? -(lat + 5 + 14 * hh(kx + 8, kz)) : plain;
      const H = over ? 42 + 5 * hh(kx + 6, kz + 1) : 13 + 30 * hh(kx + 6, kz + 1);
      const settle = 3 + 5.8 * hh(kx + 3, kz + 8), turn = hh(kx + 7, kz + 4);
      for (const i of list) {
        const x = cl[i * 4], z = cl[i * 4 + 1], draw = -0.6 * (Math.hypot(x - CX, z - CZ) - mr), low = hh(kx + 6, kz + 1), h = colFirst[i] && !over ? 5 + 33 * low * low + 6 * cl[i * 4 + 3] - 3 : H + 4 * cl[i * 4 + 3] - 2;
        let At = 0, bulge = 0;
        if (roundClear(x, z, sgn * swing, Ar, h, draw)) { At = sgn * swing; bulge = Ar; }
        else if (roundClear(x, z, sgn * swing * 0.5, plain, Math.min(h, 36), draw)) { At = sgn * swing * 0.5; bulge = plain; }
        else if (roundClear(x, z, -sgn * swing * 0.3, plain, Math.min(h, 36), draw)) { At = -sgn * swing * 0.3; bulge = plain; }
        cl2[i * 4] = At; cl2[i * 4 + 1] = bulge; cl2[i * 4 + 2] = At && bulge === plain ? Math.min(h, 36) : h; cl2[i * 4 + 3] = settle + 0.6 * cl[i * 4 + 3];
        cl3[i * 4] = draw; cl3[i * 4 + 2] = turn; cl3[i * 4 + 3] = clamp((Math.hypot(x - LX, z - LZ) - dLo) / Math.max(dHi - dLo, 1), 0, 1);
        if (++flown % 25 === 0) await ctx.yield();
      }
    }
    const colonyG = birdShape(new THREE.InstancedBufferGeometry());
    colonyG.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(cl.length ? cl : [0, 0, 16, 0]), 4));
    colonyG.setAttribute('aC2', new THREE.InstancedBufferAttribute(new Float32Array(cl2.length ? cl2 : [0, 0, 0, 3]), 4));
    colonyG.setAttribute('aC3', new THREE.InstancedBufferAttribute(new Float32Array(cl3.length ? cl3 : [0, 0, 0, 0]), 4));
    colonyG.instanceCount = cl.length / 4;
    const colony = new THREE.Mesh(colonyG, new THREE.ShaderMaterial({
      uniforms: { uStone: U.uStone, uTime: U.uTime, uMir: U.uMir, uLoop: { value: new THREE.Vector2(CX, CZ) }, ...waderInks },
      vertexShader: COLONY_VERT, fragmentShader: WADER_FRAG, side: THREE.DoubleSide, vertexColors: true,
    }));
    colony.name = 'colony'; both(colony);
    await ctx.yield();

    // ---- the flocks that never settle, each a skein or two flying close together. Round every standing stone two
    // skeins of half its flock each (one skein where the flock's full number is under forty), opposite one another on a wheel
    // 66 to 72 m from its axis, 15 to 34 m up, each strung along 0.6 of a radian of the wheel; where the line comes
    // within 25 m of that wheel the flock wheels lower, 4 to 22 m up, and where that too is within 25 m the stone
    // has none. One more skein wheels round the falling stone's seat, 84 to 92 m out, 44 to 74 m up: outside its
    // column and spray.
    const fl = [], bd = [];
    // (a flock draws for its full number at every graphics level and flies the first n of them)
    const flock = (x, z, low, spread, radius, n, size, full) => {
      const a0 = lifeRng() * TAU, skeins = full >= 40 ? 2 : 1;
      for (let i = 0; i < full; i++) {
        const b0 = a0 + (i % skeins) * Math.PI + (lifeRng() - 0.5) * 0.6, b1 = lifeRng(), b2 = lifeRng() * spread, b3 = size * (0.9 + 0.2 * lifeRng());
        if (i < n) { fl.push(x, z, low, radius); bd.push(b0, b1, b2, b3); }
      }
    };
    // the least distance from the line to a ring of birds round an axis: radii r0 to r1 (with a wing's reach), heights y0 to y1
    const ringGap = (x, z, r0, r1, y0, y1) => {
      let least = 1e9;
      for (let i = 0; i <= 800; i++) {
        real.pointAt(i / 800, pt);
        const rho = Math.hypot(pt.x - x, pt.z - z);
        least = Math.min(least, Math.hypot(Math.max(0, rho - r1, r0 - rho), Math.max(0, pt.y - y1, y0 - pt.y)));
      }
      return least;
    };
    const FLOCK = 44, nFlock = Math.round(FLOCK * detail);
    for (let i = 0; i < axes.length; i++) {
      const [x, z] = axes[i];
      if (ringGap(x, z, 64, 73.8, 13, 36) >= 25) flock(x, z, 19, 11, 66, nFlock, 1.5, FLOCK);
      else if (ringGap(x, z, 64, 73.8, 2, 28) >= 25) flock(x, z, 8, 10, 66, nFlock, 1.5, FLOCK);
      if (i % 6 === 5) await ctx.yield();
    }
    flock(LX, LZ, 48, 22, 84, Math.max(20, Math.round(30 * detail)), 1.7, 30);
    const birdG = new THREE.InstancedBufferGeometry();
    birdG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.42, -0.52, 0, 0.1, 0, 0, -0.16, -0.52, 0, 0.1, -1, 0, -0.3, -0.42, 0, -0.14,
      0, 0, 0.42, 0, 0, -0.16, 0.52, 0, 0.1, 0.52, 0, 0.1, 0.42, 0, -0.14, 1, 0, -0.3, 0, 0, 0.42, -0.1, 0, -0.5, 0.1, 0, -0.5], 3));
    birdG.setAttribute('aFlock', new THREE.InstancedBufferAttribute(new Float32Array(fl), 4));
    birdG.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array(bd), 4));
    birdG.instanceCount = bd.length / 4;
    const birds = new THREE.Mesh(birdG, new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uMir: U.uMir, cA: { value: P.shell }, cB: { value: mixc(P.plum, P.channel, 0.4) } },
      vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide,
    }));
    birds.name = 'flocks'; both(birds);

    // ---- the way out: flat rings round the opening in the air, as round the sun, with their built shadow; the
    // opening is 26 m across and the rings reach 16.4 m from its middle -----------------------------------------
    const end = real.end, fwd = real.endTangent;
    const gate = new THREE.Group();
    [[13.4, 14.2, P.kerb], [14.2, 15.2, P.ring], [15.2, 16.4, P.dust]].forEach(([a, b, col]) => {
      gate.add(new THREE.Mesh(new THREE.RingGeometry(a, b, 72), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })));
    });
    gate.position.copy(end).addScaledVector(fwd, 0.5); gate.lookAt(v3.copy(end).addScaledVector(fwd, 10)); gate.name = 'gate-rings';
    scene.add(gate); gate.updateMatrixWorld(true);
    const gsG = new THREE.RingGeometry(13.4, 16.4, 72), gp = gsG.attributes.position, gn = gsG.attributes.normal;
    for (let i = 0; i < gp.count; i++) {
      v3.fromBufferAttribute(gp, i).applyMatrix4(gate.matrixWorld); v3.addScaledVector(style.sun, -v3.y / style.sun.y);
      gp.setXYZ(i, v3.x, 0.07, v3.z); gn.setXYZ(i, 0, 1, 0);
    }
    const gateShadow = new THREE.Mesh(gsG, builtShadow());
    gateShadow.frustumCulled = false; gateShadow.renderOrder = 3; gateShadow.name = 'gate-shadow'; scene.add(gateShadow);
    await ctx.yield();

    // ---- the gaze. Its figures for the approach are given along a scale v of the line: 0.086 over the pair of
    // shell stones, 0.25 where the open crossing begins, 0.393 at the crossing's second mark and the same as u
    // from there; vOf(u) gives v.
    // One point follows the stone by the clock, between it and its seat (while the stone hangs too high to hold
    // whole it goes back down to the seat); between v 0.29 and 0.38 it is aimed a stone's width east of the stone.
    // Others: far under the landing point for a moment of the open crossing (which tips the view down onto the
    // water ahead); for a moment before it a point west of the stone's seat; the shell neighbour at its rim's
    // height on the way into the gap. From the gap on, one point of full weight (loopAim, below) carries the
    // gaze round the loop and out.
    // Before the gap (v under 0.44, fading out by 0.5) the first point is also lifted just as far as it takes to
    // hold the whole stone under the view's top edge from where the line is at that u (a little more before v 0.1, and after v 0.3,
    // where the stone stands off to the side of the gaze), up to 12 degrees of tilt. Where the stone's crown stands
    // more than 32 degrees up it cannot be held whole: over the next 8 degrees the point lets it go, drops to the
    // seat's height and (after v 0.3) moves 84 m east and 84 m north, toward the shell neighbour. (Up to u 0.3166
    // the tilt this point asks for is overruled by the hold, the last point of the list: see holdAim, below.)
    const aim = new THREE.Vector3(), eyeAt = new THREE.Vector3();
    const vOf = (u) => (u < 0.157 ? u * 0.086 / 0.157 : u < 0.2614 ? 0.086 + (u - 0.157) * 0.164 / 0.1044 : u < 0.393 ? 0.25 + (u - 0.2614) * 0.143 / 0.1316 : u);
    const stoneAim = (time, u = 0) => {
      const v = vOf(u), h = heightOf(time), east = 126 * sm(clamp((v - 0.27) / 0.04, 0, 1) * clamp((0.40 - v) / 0.04, 0, 1));
      path.pointAt(u, eyeAt);
      const far = Math.hypot(LX - eyeAt.x, LZ - eyeAt.z), top = Math.atan2(h + 48 - eyeAt.y, far) / D2R;
      const early = 1 - sm((v - 0.44) / 0.06), hold = 1 - sm((top - 32) / 8), go = (1 - hold) * early * sm((v - 0.3) / 0.08);
      const tilt = clamp(top - 21 + 2.5 * (1 - sm(v / 0.1)) + 5 * sm((v - 0.3) / 0.12), 0, 12) * hold * early;
      const pull = 0.75 * Math.max(0.3, sm(u / 0.04));           // this point's weight where the engine eases the gaze in at the entry
      return aim.set(LX + east + 84 * go, Math.max(20 + 20 * sm(h / 90) * (1 - sm((h - 190) / 200)), eyeAt.y + far * Math.tan(Math.min(tilt / pull, 30) * D2R)), LZ - 84 * go);
    };
    // HOLDING THE STONE IN VIEW (holdTilt): from a tilt pb of the gaze, whose bearing on the plan is (fx, fz),
    // seen from gEye. The lens is taken as 25 degrees of half height, which is true in windows 1.6 wide and wider;
    // in a narrower window the lens is wider and the stone may be cut by the top edge for a time. The stone's top
    // is its crown, or (ribs 1) the tips of its streamers while it falls (their feet 12 m over the crown, their
    // length 4 m for every metre a second of its fall, as the part draws them). If that top would stand higher in
    // the view than topAt of the half height, the gaze tilts up just far enough to put it there, as far as
    // cap degrees. If that is not enough, the gaze lets the stone go. Where `rest` is set it then rests on the
    // tilt pb it was given, whatever the stone does; otherwise it tilts down, if it must, until the stone's
    // underside stands clear above the view's top edge (GO_BOT of the half height; never further down than 30
    // degrees). Holding and letting go meet between hmax - 1.5 and hmax + wide degrees of the tilt needed.
    // A stone more than 44 to 52 degrees to the side of the gaze is left alone (where `rest` is set: 40 to 58).
    const gDir = new THREE.Vector3(), gEye = new THREE.Vector3(), gTo = new THREE.Vector3(), holdPt = new THREE.Vector3();
    const s01 = (a, b, x) => sm((x - a) / (b - a)), TAN25 = Math.tan(25 * D2R);
    const HOLD_TOP = 0.88, HOLD_MAX = Math.atan(0.5 * TAN25) / D2R, GO_BOT = 1.05;
    // how high a point f metres ahead of the eye and y metres over it stands in the view at tilt p: 1 at the top edge
    const viewY = (y, p, f) => { const c = Math.cos(p), sn = Math.sin(p), dep = f * c + y * sn; return dep > 1 ? (y * c - f * sn) / (dep * TAN25) : 9; };
    // the tilt between lo and hi at which that point stands at `want` of the half height (fourteen halvings)
    const solveTilt = (y, want, lo, hi, f) => { for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (viewY(y, m, f) > want) lo = m; else hi = m; } return hi; };
    const holdTilt = (pb, fx, fz, time, hmax, ribs, topAt = HOLD_TOP, rimToo = false, cap = hmax, rest = false, wide = 1.5) => {
      const h = heightOf(time), soon = heightOf(time + (rimToo ? 0.4 : 0.5)), fall = clamp((heightOf(time - 0.8) - h) / 0.8, 0, 40);
      const sx = LX - gEye.x, sz = LZ - gEye.z, far = Math.hypot(sx, sz) || 1e-4;
      // the engine's camera follows the gaze about half a second late: the stone is taken where it is and where
      // it will be by then, the higher for its top and the lower for its underside (rimToo: its top is taken
      // where it will be 0.4 s on, so that the late camera has it there)
      const yBot = Math.min(h, soon) - gEye.y, yTop = (rimToo ? soon : Math.max(h, soon)) - gEye.y + 48 + ribs * (12 + 4 * fall) * Math.min(1, fall / 5);
      const fwd = sx * fx + sz * fz;                                            // metres ahead of the eye, along the gaze on the plan
      let need = viewY(yTop, pb, fwd) > topAt ? solveTilt(yTop, topAt, pb, 60 * D2R, fwd) : pb;
      // (rimToo: seen from close by and from below, the rim's near point stands higher in the view than the crown)
      if (rimToo && fwd > 64 && viewY(yTop - 24, need, fwd - 63) > topAt) need = solveTilt(yTop - 24, topAt, need, 60 * D2R, fwd - 63);
      const go = rest || viewY(yBot, pb, fwd) >= GO_BOT ? pb : solveTilt(yBot, GO_BOT, -30 * D2R, pb, fwd);
      const hold = 1 - s01(hmax - 1.5, hmax + wide, need / D2R), side = Math.acos(clamp(fwd / far, -1, 1)) / D2R;
      return pb + ((go + (Math.min(need, cap * D2R) - go) * hold) - pb) * (1 - (rest ? s01(40, 58, side) : s01(44, 52, side)));
    };
    // THE GAZE'S TABLES ARE KNOTTED ON THE LINE'S OWN PLACES: mark(s) is the place, as a share of the flight, of
    // the line's mark number floor(s) (the start, then the end of each stretch the clock is given for) and the
    // share s - floor(s) of the way on to the next mark; knots(rows) is the smooth curve through rows of
    // [s, degrees].
    const MARK_U = ROUTE.marks.map((m) => m[0] / DURATION);
    const mark = (s) => { const i = Math.min(Math.floor(s), MARK_U.length - 2); return MARK_U[i] + (s - i) * (MARK_U[i + 1] - MARK_U[i]); };
    const knots = (rows) => monotone(rows.map(([s, deg]) => [mark(s), deg]));
    const sixths = (s, list) => list.map((deg, i) => [s + i / 6, deg]);
    // THE HOLD (the last point of the list, over the dive and the approach): it takes the gaze as the points
    // before it leave it at that u and clock and keeps its bearing but for the glance (below); the tilt is its own. It does the engine's
    // mixing again for the sweeping camera (look-ahead 40 m, the guard at both ends); under the steady camera the
    // engine gives it 0.35 of its weight and the hold is weaker. Over the dive the tilt it starts from is the
    // dive's own (DIVE: the board from above: 20 to 24 degrees down at the entry, 27.5 down about the south
    // line, 23 down at the line's first mark, then down on the water some 370 to 600 m ahead as far as the pair of shell stones,
    // so that the board is still seen from above over them; it gives way to the other points' tilt over the
    // second third to the fifth sixth of the stretch from the pair to the open crossing); from
    // there the stone is held as holdTilt says, as far up as HOLD_MAX degrees (the horizon then lies three
    // quarters down the view), streamers and all, and where it cannot be held the gaze tilts down under it.
    const DIVE = knots([...sixths(0, [-24, -20, -21.5, -24.5, -27.5, -26.5]), [1, -23], [1 + 1 / 3, -20.5], [1 + 2 / 3, -18.5],
      ...sixths(2, [-16.5, -12.5, -8, -4.5, -2.5, -0.5, 0])]);
    // THE GLANCE (degrees to the right): from the line's first mark to the pair of shell stones the hold turns the
    // bearing it was left up to 6 degrees toward the slate stone the line passes on its left, then, over the
    // first half of the stretch on to the open crossing, up to 24 degrees toward the one it passes on its right,
    // and gives it back unturned by the fifth sixth of that stretch.
    const GLANCE = knots([...sixths(1, [0, -1, -2, -3, -4, -5.5]), ...[-6, -4.5, 1.5, 8.5, 17, 23, 24, 19.5, 12, 4, 0].map((deg, i) => [2 + i / 12, deg])]);
    // the gaze as the first n points of the list leave it at that u and clock, seen from gEye, into gDir; the
    // guard's share is returned
    const mixBefore = (n, time, u) => {
      const L = path.length, guard = s01(0, 0.04, u) * (1 - s01(0.93, 0.985, u));
      path.posAtDist(u * L, gEye); path.posAtDist(u * L + 40, gTo); gDir.subVectors(gTo, gEye).normalize();
      for (let i = 0; i < n; i++) {
        const q = pois[i], wide = (q.to - q.from) * q.fade, w = s01(q.from, q.from + wide, u) * (1 - s01(q.to - wide, q.to, u)) * q.weight * guard;
        if (w <= 0.001) continue;
        const at = typeof q.at === 'function' ? q.at(time, u) : q.at;
        if (at.isVector3) gTo.copy(at); else gTo.set(at[0], at[1], at[2]);
        gTo.sub(gEye).normalize(); gDir.multiplyScalar(1 - w).addScaledVector(gTo, w).normalize();
      }
      return guard;
    };
    const holdAim = (time, u = 0) => {
      const guard = mixBefore(pois.length - 1, time, u);
      const hl = Math.hypot(gDir.x, gDir.z) || 1e-4, p0 = Math.atan2(gDir.y, hl);
      const b = Math.atan2(gDir.x, -gDir.z) + GLANCE(u) * D2R, fx = Math.sin(b), fz = -Math.cos(b);
      const pb = p0 + (DIVE(u) * D2R - p0) * (1 - s01(mark(2 + 1 / 3), mark(2 + 5 / 6), u));
      // (at the entry the engine gives every point only a share of its weight: the change of tilt is asked for
      // that many times over, up to three times, so that what is left of it is the whole)
      // (between u 0.1 and 0.19 the gaze stays down on the board: the hold may not lift it there, only let a stone
      // that the view's top edge would cut go out over that edge)
      const down = s01(0.09, 0.1, u) * (1 - s01(0.19, 0.22, u)), pbDeg = pb / D2R;
      const held = holdTilt(pb, fx, fz, time, HOLD_MAX, 1, HOLD_TOP, false, HOLD_MAX, false, 8), kept = down > 0 ? holdTilt(pb, fx, fz, time, pbDeg + 1.6, 1, HOLD_TOP, false, pbDeg) : held;
      const tilt = p0 + (held + (kept - held) * down - p0) / Math.max(guard, 1 / 3);
      return holdPt.set(gEye.x + fx * Math.cos(tilt) * 1000, gEye.y + Math.sin(tilt) * 1000, gEye.z + fz * Math.cos(tilt) * 1000);
    };
    // THE LOOP AND THE WAY OUT (loopAim: one point of full weight from before the gap to the end; it gives the
    // gaze's bearing and tilt outright, 1,000 m off). Bearings in degrees, clockwise from north.
    // ITS BEARING, when no touch falls on the loop's first half: SWEEP: north-west through the gap and over
    // the colony's northern ground beyond it (328 where the loop heads west), then round to the right across the
    // sun and the shell neighbour onto the stone's seat by the middle of the loop's arc; from there on round the
    // arc it keeps to the seat, aimed 8 to 5 degrees to the seat's left (SEAT_OFF), so the gaze turns with the
    // loop about the stone; toward the arc's end it passes to OUT: north, the sun and the stone's seat before
    // it, then a little west of north with the shell neighbour under the sun, then round to the left onto the
    // shell neighbour while the line turns past its east side (bearing 308 through the middle of the last turn,
    // a little left of the way out), and to the last leg's own bearing at the end.
    // WHEN A TOUCH FALLS BESIDE THE GAP OR ON THE LOOP'S FIRST HALF (nearTouch): the gaze turns to the stone's
    // seat instead, over the stretch of line flown in 4.5 s at the film's pace that ends as far before that
    // touch as is flown in 3 s at the film's pace, or where the line has come to u 0.6, whichever is first,
    // and keeps to it round the loop; the two ways are one from the middle of the loop's arc.
    // TWO ANSWERS ARE KEPT FROM FRAME TO FRAME. THE FILM'S (filmTouch): the next touch to come where that
    // falls before the open crossing, else the first touch at or after the crossing, placed on the line from
    // the clock at the film's pace of 70 s for the whole line; it is taken at the first asking, at every
    // asking up to the open crossing (no turn begins before it) and outright whenever the place on the line
    // or the clock steps back or leaps, and is kept from there on. THE FLIGHT'S (paceTouch, only
    // where the pace is measured, paceOf): the first touch still to come that falls beside the gap or after
    // it, placed from the clock at the flight's own pace against it (a pace under a twentieth of the film's
    // counts as a twentieth).
    // THE GAZE TURNS WHERE EITHER SAYS YES, and where both do, for the one whose turn ends first: so a flight
    // at another pace turns for every touch the film's answer turns for, never later, and also for the
    // touches its own pace brings. From the open crossing on, wherever the pace is measured and the turn has
    // not begun, the flight's answer is taken again at every asking that finds the place moved on (an asking
    // on an unmoved place, as in a frame with a step of nought, keeps the answer as it stands; before the
    // crossing both answers are taken at every asking, the film's alone where the pace is not measured) and
    // the turn is set by the two as they then stand; a turn that would have begun already begins at the
    // place the line has come to, so long as it can end by u 0.6.
    // Once the turn has begun the answer stands to the end, so that a change of the flight's pace against the
    // world's clock cannot turn the gaze over in the middle of the turn; from u 0.535, where no turn can
    // begin any more, a no stands as well (a change of pace after that is not followed). Where the pace is
    // not measured (or is the film's own) the film's answer alone decides at a taking, and between takings
    // the answer is kept as it stands.
    // THE LEAD (ntLd; easedTouch, leadOf). A turn begun for a touch that a later change of pace moves on past
    // the loop's middle stands as well, and the camera, which follows the gaze late, would come round the loop
    // behind the seat. So once the turn has begun, wherever the pace is measured and an asking finds the place
    // moved on, the first touch still to come beside the gap or after it is placed again, by the pace as it is
    // easing (paceRun: the pace is taken to close on the pace the flight is making for by the share
    // 1 - exp(-EASE t) of the difference in t seconds), from the place and the clock that pace was measured at
    // (pcU, pcT), not from the asking's own: where an asking comes with the place of one step and the clock of
    // the step before it, a touch placed from those two lies that step's flight too far on, further after a
    // long step than after a short one, and the lead would go to and fro with an uneven clock. Where that touch
    // falls beside the gap or on the loop's first half (turnsTo's yes) the lead is asked to be nought. Where it
    // falls later the lead is asked to reach to the place of that touch or to u 0.845, whichever comes first
    // (nought once the line has come as far), and no further than the line will have come in half a second;
    // less for a touch within 0.01 of the line after the last place of turnsTo's yes; less for a touch after
    // u 0.84 and nought for one after 0.87 (the touch's own place on the line: at 0.84 the seat stands 34
    // degrees left of OUT's bearing, which is loopAim's own from u 0.835, near the left edge of a 16:9 view;
    // at 0.87 it stands 62 degrees left of it, outside the view); less where the pace the flight
    // is making for is under eight times
    // the film's and nought where it is under four times. The lead goes toward what is asked by no more than
    // the place has moved since the last asking; an asking that finds the place moved on and the pace not
    // measured takes it toward nought as fast; an asking on an unmoved place keeps it; it is nought at the
    // first asking, at every asking up to the open crossing and after a step back or a leap, and stays nought
    // until a turn has begun. What the lead asks to be added to a bearing (leadOf) is what the seat's bearing
    // with SEAT_OFF is from the place that far on along the line, less what it is from the place the line has
    // come to, the short way round and no more than its asker allows either way: 60 degrees in gapTurn, which
    // adds it as it is wherever the lead is over nought, and 40 in loopAim. Past the gap the seat's bearing
    // turns up to 16.6 degrees in a hundredth of the line (at u 0.58; 4.3 at u 0.5) and the gaze may be far
    // ahead of a camera that follows it late: the more is added there, the nearer the gaze comes to the point
    // opposite the camera, past which the camera would turn back the other way round. The tilt of gapTurn
    // and of loopAim is held from the bearing as it is before anything is added.
    // THE HOLD (ntAd, ntBe; loopAim alone). The lead falls to nought as the line nears the touch, and over
    // u 0.8 to 0.835 loopAim's own bearing leaves the seat's for OUT, which lies up to 34 degrees to the right
    // of it there: either would take the bearing back to the right while the camera is still coming round to
    // the left after it. So wherever the lead is over nought, or something was added at its last asking,
    // loopAim adds the leftmost of three: what the lead asks, what gives again the bearing it gave at its last
    // asking (taken only where something was added then), and nothing. What was added is forgotten wherever
    // the lead is set to nought outright (the first asking, up to the open crossing, after a step back or a
    // leap). Save for that, from an asking at which something was added to the next the bearing loopAim
    // gives never goes to the right, and it is never to the right of loopAim's own; once the lead is nought,
    // the adding ends at the first asking that finds loopAim's own bearing come round as far to the left as
    // the bearing last given. The lead reaches no further than u 0.845 because the seat's bearing with
    // SEAT_OFF is 310.3 there and OUT's leftmost, later on, is 308: a bearing held from the lead is one that
    // OUT comes round to (to 310.3 at u 0.922), not one the gaze would have to come back from.
    // THE FLIGHT'S PACE (paceOf, from update, with the step of the clock, the clock and the place on the line):
    // the share of the line flown in a second of the clock over the last step in which the place moved on, by
    // less than LEAP, and the clock came on by that step and no more; not measured at the start, after a step
    // back or a leap of the place, and where the clock was set between two steps. A step of the clock that
    // finds the place unmoved forgets the place, and a step of nought forgets place and pace (a flight that
    // takes either is measured again at its second step after it); an asking that finds a step back or a
    // leap forgets the pace; and it counts as not measured where it is the film's own to a millionth part,
    // so that at the film's pace every line here does what it does where nothing is measured.
    // THE PACE THE FLIGHT IS MAKING FOR (pcW, in paceOf): where this step is measured and a pace is kept from
    // before it (pcV over nought), that pace plus the change of pace over this step divided by
    // 1 - exp(-EASE times the step); else this step's pace (nought where it is not measured). It is read only
    // where the pace is measured.
    // WHETHER A TOUCH IS ONE OF THESE IS A PLAIN YES OR NO (turnsTo), never a share: round the loop's first
    // half the two ways lie as far as half a turn apart, and a gaze part of the way between them would have to
    // swing through the whole of that as the line passes the place where they stand opposite. Before the gap the
    // turn is made by gapTurn, a point of full weight that takes the gaze as the four points before it leave it
    // (and, when no such touch falls, gives it back unchanged); from the gap on by loopAim.
    // ITS TILT: TILT, a few degrees over level, and from there the stone is held as holdTilt says, without
    // its streamers (they may leave the view's top): up to the gap its crown and near rim under 0.9 of the half
    // height, as far up as 36 degrees; on the loop (from u 0.6, eased in from 0.57) under 0.84 of the half height
    // and never farther up than HOLD_MAX degrees, so that the horizon lies no lower than three quarters down the
    // view: while the stone would need a little more than that the gaze waits at HOLD_MAX for it to come down
    // into view (up to 12.5 degrees more where the line is 230 m and more from the landing point, none where
    // it is nearer than 150 m), and while it would need more still the gaze lets it go, over the next 6 degrees
    // of the tilt needed, and rests on TILT: on the stone's seat, the water and the birds. It never tilts down
    // to let a stone go.
    const lEye = new THREE.Vector3(), loopPt = new THREE.Vector3(), aEye = new THREE.Vector3();
    const toSeat = (e) => { const b = Math.atan2(LX - e.x, e.z - LZ) / D2R; return b < -90 ? b + 360 : b; };   // -90 to 270
    const twelfths = (s, from, list) => list.map((deg, i) => [s + (from + i) / 12, deg]);
    const U_MID = mark(6.5);                                     // the middle of the loop's arc
    const SEAT_OFF = knots(twelfths(6, 3, [-8, -8, -8, -8, -7.5, -6, -5.5, -5, -5, -5]));
    path.pointAt(U_MID, lEye);
    const SWEEP = knots([[4 + 5 / 6, 318], [5, 319.5], [5.5, 320.5], ...[322, 325.5, 328, 328, 335.5, 351, 372, 392.5, 410, 423, 429.5, 431].map((deg, i) => [6 + i / 24, deg]),
      [6.5, 360 + toSeat(lEye) + SEAT_OFF(U_MID)]]);
    const OUT = knots([[6 + 11 / 12, 362], ...sixths(7, [357.5, 355.5, 354.5, 353, 349.5, 342.5]), ...sixths(8, [329.5, 318, 310, 308, 308, 310]), [9, 312], [9 + 1 / 3, 313], [9 + 2 / 3, 314], [10, 315]]);
    const TILT = knots([[4 + 5 / 6, 5], [5, 4.5], ...sixths(6, [4.5, 4, 3.5, 3.5, 3, 3]), [7, 3], [7.5, 4], [8, 4], [8.5, 3], [9, 2], [10, 0]]);
    const turn = (a, b, k) => a + k * (((b - a) % 360 + 540) % 360 - 180);      // from bearing a toward b by the share k, the short way round
    // is a touch at the place x of the line one the gaze turns to: beside the gap or on the loop's first half
    const turnsTo = (x) => (x >= 0.5173 && x < U_MID - 0.0047 ? 1 : 0);
    const LEAP = 0.01;                                           // a step of the place longer than this is a leap: the measure takes none as long, and an asking that finds one takes the film's answer outright
    const EASE = 1.4;                                            // a second: the rate at which the flight's pace is taken to close on the pace it is making for
    let pcU = -1, pcT = 0, pcV = 0, pcW = 0;                     // the place and the clock at the last step of the clock; the pace (0: not measured, or the film's own); the pace the flight is making for
    const paceOf = (dt, time, u) => {
      if (!(dt > 1e-6)) { if (dt === 0) { pcV = 0; pcU = -1; } return; }
      const du = u - pcU, own = Math.abs(time - pcT - dt) < 1e-6;   // the clock came on by its own step
      const v = own && du > 0 && du < LEAP ? du / dt : 0;
      pcW = v > 0 && pcV > 0 ? pcV + (v - pcV) / (1 - Math.exp(-EASE * dt)) : v;
      pcV = Math.abs(v * DURATION - 1) < 1e-6 ? 0 : v; pcU = du === 0 ? -1 : u; pcT = time;
    };
    // the place on the line of the first touch at or after the open crossing, at the film's pace
    const filmTouch = (time, u) => {
      let x = u + (30 - tauOf(time)) / DURATION;
      while (x - 30 / DURATION >= 0.405) x -= 30 / DURATION;
      return x;
    };
    // the place on the line of the first touch still to come beside the gap or after it, at the measured pace
    const paceTouch = (time, u) => {
      const per = Math.min(1 / pcV, 20 * DURATION);              // seconds of the clock for the whole line
      let x = u + (30 - tauOf(time)) / per;
      while (x < 0.5173) x += 30 / per;
      return x;
    };
    // the share of the line flown over the next t seconds of the clock, the pace easing from what it is toward the pace
    // the flight is making for (neither taken as under a twentieth of the film's)
    const paceRun = (t) => { const v = Math.max(pcV, 1 / (20 * DURATION)), w = Math.max(pcW, 1 / (20 * DURATION)); return w * t - (w - v) * (1 - Math.exp(-EASE * t)) / EASE; };
    // the place on the line of the first touch still to come beside the gap or after it, at the pace as it is easing
    const easedTouch = (time, u) => {
      let t = 30 - tauOf(time);
      while (u + paceRun(t) < 0.5173) t += 30;
      return u + paceRun(t);
    };
    let ntYes = 0, ntBy = 0.6, flYes = 0, flBy = 0.6, ntU = -1, ntT = 0, ntLd = 0, ntAd = 0, ntBe = 0;   // the answer the gaze follows and the film's, each with where its turn ends; the place and the clock at the last asking; the lead; what loopAim added at its last asking (nought or to the left: under nought) and the bearing it added it to
    const nearTouch = (time, u) => {
      const leapt = ntU >= 0 && (u < ntU - 1e-9 || u > ntU + LEAP || time < ntT - 1e-9 || time > ntT + 0.5);
      if (leapt) pcV = 0;
      const px = pcV > 0 ? paceTouch(time, u) : 0, pYes = turnsTo(px), pBy = Math.min(px - 0.045, 0.6);   // the flight's answer (a no where the pace is not measured)
      if (u < 0.405 || ntU < 0 || leapt) {
        const x = filmTouch(time, u);
        ntYes = flYes = turnsTo(x); ntBy = flBy = Math.min(x - 0.045, 0.6);
        if (pYes) { ntBy = ntYes ? Math.min(ntBy, pBy) : pBy; ntYes = 1; }
        ntLd = 0; ntAd = 0;
      } else if (pcV > 0 && u > ntU && !(ntYes && u >= ntBy - 0.065)) {
        const by = !pYes ? flBy : flYes ? Math.min(flBy, pBy) : pBy;
        if (!(flYes || pYes)) ntYes = 0;
        else if (u < by - 0.065) { ntYes = 1; ntBy = by; }
        else if (u + 0.065 <= 0.6) { ntYes = 1; ntBy = u + 0.065; }
      } else if (pcV > 0 && u > ntU) {
        const x = easedTouch(pcT, pcU), to = Math.max(Math.min(Math.min(x, 0.845) - u, paceRun(0.5)), 0) * s01(U_MID - 0.0047, U_MID + 0.0053, x) * (1 - s01(0.84, 0.87, x)) * s01(4, 8, pcW * DURATION);
        ntLd = Math.max(ntLd - (u - ntU), Math.min(ntLd + (u - ntU), to));
      } else if (ntLd > 0 && u > ntU) ntLd = Math.max(ntLd - (u - ntU), 0);
      ntU = u; ntT = time;
      return ntYes * s01(ntBy - 0.065, ntBy, u) * (1 - s01(U_MID, U_MID + 0.02, u));
    };
    // what the lead asks to be added to a bearing, in degrees, no more than `most` either way (seat: the seat's bearing with SEAT_OFF from the place the line has come to)
    const leadOf = (u, seat, most) => { const on = u + ntLd; return Math.max(-most, Math.min(most, ((toSeat(path.pointAt(on, aEye)) + SEAT_OFF(on) - seat) % 360 + 540) % 360 - 180)); };
    const turnPt = new THREE.Vector3(), UNDER_LEFT = 4, UNDER_UP = 4.5;
    const gapTurn = (time, u = 0) => {
      mixBefore(4, time, u);
      const hl = Math.hypot(gDir.x, gDir.z) || 1e-4, p0 = Math.atan2(gDir.y, hl), k = nearTouch(time, u);
      // (beside the stone, where its underside passes overhead to the left, the gaze goes UNDER_LEFT degrees further
      // left and UNDER_UP further up, in over u 0.47 to 0.515 and out over 0.5175 to 0.5425)
      const under = s01(0.47, 0.515, u) * (1 - s01(0.5175, 0.5425, u));
      let b = (turn(Math.atan2(gDir.x, -gDir.z) / D2R, toSeat(gEye), k) - UNDER_LEFT * under) * D2R, fx = Math.sin(b), fz = -Math.cos(b);
      const tilt = p0 + (holdTilt(p0, fx, fz, time, 36, 0, 0.9, true, 36, true, 4.5) - p0) * k + UNDER_UP * D2R * under;
      if (ntLd > 0) { b += leadOf(u, toSeat(gEye) + SEAT_OFF(u), 60) * D2R; fx = Math.sin(b); fz = -Math.cos(b); }
      return turnPt.set(gEye.x + fx * Math.cos(tilt) * 1000, gEye.y + Math.sin(tilt) * 1000, gEye.z + fz * Math.cos(tilt) * 1000);
    };
    const loopAim = (time, u = 0) => {
      path.pointAt(u, lEye);
      const seat = toSeat(lEye) + SEAT_OFF(u);
      let b = turn(SWEEP(u), seat, s01(U_MID - 0.025, U_MID + 0.005, u));
      b = turn(b, OUT(u), s01(0.8, 0.835, u));
      b = turn(b, seat, nearTouch(time, u));
      let fx = Math.sin(b * D2R), fz = -Math.cos(b * D2R);
      gEye.copy(lEye);
      const k = s01(0.57, 0.6, u), cap = 36 + (HOLD_MAX - 36) * k;
      const wait = 1.5 + 12.5 * s01(150, 230, Math.hypot(LX - lEye.x, LZ - lEye.z));
      const tilt = holdTilt(TILT(u) * D2R, fx, fz, time, cap + wait * k, 0, 0.9 - 0.06 * k, true, cap, true, 4.5);
      if (ntLd > 0 || ntAd < 0) {                                // the hold: the leftmost of what the lead asks, what gives the last bearing again, and nothing
        const own = b;
        ntAd = Math.min(ntLd > 0 ? leadOf(u, seat, 40) : 0, ntAd < 0 ? ntAd + (((ntBe - b) % 360 + 540) % 360 - 180) : 0, 0);
        ntBe = own; b += ntAd; fx = Math.sin(b * D2R); fz = -Math.cos(b * D2R);
      }
      return loopPt.set(lEye.x + fx * Math.cos(tilt) * 1000, lEye.y + Math.sin(tilt) * 1000, lEye.z + fz * Math.cos(tilt) * 1000);
    };
    const pois = [
      { at: stoneAim, from: 0, to: 0.585, weight: 0.75, fade: 0.05 },
      { at: [LX, -150, LZ], from: 0.2296, to: 0.3074, weight: 0.45, fade: 0.4 },
      { at: [LX - 420, 20, LZ], from: 0.205, to: 0.238, weight: 0.3, fade: 0.4 },
      { at: [NX, 26, NZ], from: 0.45, to: 0.6, weight: 0.38, fade: 0.25 },
      { at: gapTurn, from: 0.39, to: 0.6, weight: 1, fade: 0.08 },
      { at: loopAim, from: 0.527, to: 1, weight: 1, fade: 0.09 },
      { at: holdAim, from: 0, to: 0.3166, weight: 1, fade: 0.06 },
    ];

    return {
      scene, path, duration: DURATION,
      camera: { fov: 50, near: 1, far: 16000, lookAhead: 40, bank: 0 },
      pois,
      // the way out's look is fixed on every deal: the ring, an opaque pass drawn before the water sheet
      portal: { shape: 'circle', radius: 13, color: '#FFF3D0', glow: 0.6, revealDistance: 4600, style: 'ring' },
      post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none',
      style: 'none',
      companion: 'none',
      // the clock alone: the part sets the stone, its shadow and every shared uniform from the time given
      // (the place on the line goes to the gaze's measure of the flight's pace and nowhere else)
      update(dt, time, camera, u) { hero.update(dt, time); paceOf(dt, time, u); },
      // (the engine frees geometries and materials; an instanced mesh's own table is freed by the mesh, each once)
      dispose() { for (const m of instanced) m.dispose(); hero.dispose(); style.dispose(); },
    };
  },
};
