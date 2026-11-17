// CABLES TO THE MOON: the hero. A vegetable giant hauling itself up a living cable.
// It hangs UNDER the cable like a sloth on a bough: a soft lopsided gourd of bark, moss and seed-hair 220 m long,
// seven uneven woody limbs rising from its ridge to hook over the cable, breathing sacs along its flanks, beards of
// seed-hair streaming back, seed pods gummed to its left flank (the clear ones with a small curled figure inside),
// striped fliers wheeling round it, and a new wet strand paying out behind. No head, no eye: the leading end is a bud.
//
// SPACE. The climber lives in the cable's frame (see CABLE in the common file): x right, y the cable's upward normal,
// -z up the cable; the origin is the point of the cable over the middle of the body, so the body's centre is (0, -78, 0).
// CLOCK. The gait runs on the metres we have flown (see GAIT): 840 m of our road to one round of its seven limbs.
// Each limb holds a fixed point of the cable while the body passes under it, then lets go, swings 60 m up the
// cable and hooks on again; each takes its turn after a gap of its own and swings for a time of its own (see
// makeGait). Grips never slide, BUT FOR ONE CASE (mend V): the cable's first 105 m sink with the land as the land
// falls away, and a hand holds the rope WHERE THE ROPE IS DRAWN, so the hindmost limbs reach down after it; where
// the gait's hold has sunk beyond a limb's reach (LIMB_REACH, said once below) the hand, its fingers loosened,
// takes the hold on the rope it can reach: its hold shifts along the rope toward its shoulder by what it lacks,
// and goes back as the reach allows (makeGait's solve). The same numbers (the hold it has, weight, time since the
// hold) drive the sag and the thrum of the cable in the web file.
//
// MAP OF THIS FILE
//   bodyShape()        the gourd as a function (v along, angle round) -> point
//   SOFT_*             shader of body, sacs and pods (one mesh)
//   LIMB_*             shader of limbs and hands (posed in the vertex shader from the joints the gait solves)
//   HAIR_*             beards, fringe of seed-hair, the new strand (ribbons)
//   FLY_*              the striped fliers
//   makeGait()         the limbs' schedule and the solver (pure functions of the gait clock)
//   buildHero()        puts it together; makeFarClimber() is the same creature in 1.5k triangles
import * as THREE from 'three';
import { cmStream, CM_GLSL, CM_RIBBON, withShared, makeShared, Geo, bound, CABLE_L, CABLE_D, CABLE_N, cableRadius, cableDip, C, clamp, lerp, sstep, fract } from './cables-to-the-moon-common.js';
import { makeCables } from './cables-to-the-moon-web.js';

const TAU = Math.PI * 2;
// T: seconds of the gait's own clock to one round of the seven limbs (each limb one stride of 60 m, so the body
// gains one stride a round). THE PACE, by a reason of the creature: it is slow as a sloth is slow; while one of
// its limbs takes its turn we fly the length of two of its strides (ours: 2), and a round is seven turns, so one
// round takes 7 x 2 x 60 = 840 m of OUR road (route), and it climbs at a fourteenth of our pace. That 2 is the
// mean: each visit's climber has its own (1.6 to 2.6 strides flown to a limb's turn, dealt by the world from the
// stream 'pace'), so a turn's length on the road is the visit's own. The gait is a part of the journey: it runs
// on the metres we have flown, never on the clock.
export const GAIT = { T: 32, swing: 6, stride: 60, speed: 60 / 32, s0: 250, limbs: 7, ours: 2 };
GAIT.route = GAIT.limbs * GAIT.ours * GAIT.stride;
export const gaitClock = (go) => (go / GAIT.route) * GAIT.T;
// len: tail to bud; a: half its width; b: its half depth before the belly's sag (it hangs `down` times b below its
// middle line and stands `up` times b above it, so it is b x (up + down) = 70 m deep); cy: its middle under the cable
export const FORE_AT = 0.66;      // the forward third of the body bears no boss (G2): the young bladders are smallest by here, and none is dealt ahead of 0.622 (CROWD)
export const CROWD = 0.07;        // a boss is dealt within this share of the body's length of its crowd's neck (T4)
export const BUD_AT = 0.75;       // where the bud begins, of the body's length (its girth under 0.64 of the greatest: bodyShape's key)
export const BODY = { len: 220, a: 40, b: 33, cy: -78, up: 0.9, down: 1.22 };

// a smooth curve through keys [[x, y], ...] (Catmull-Rom on uneven keys)
function spline(keys) {
  const n = keys.length;
  const m = keys.map((k, i) => { const a = keys[Math.max(0, i - 1)], b = keys[Math.min(n - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); });
  return (x) => {
    if (x <= keys[0][0]) return keys[0][1]; if (x >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (x > keys[i + 1][0]) i++;
    const h = keys[i + 1][0] - keys[i][0], t = (x - keys[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * keys[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * keys[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------------------------------------------------------------- the gourd
// v: 0 at the tail .. 1 at the bud; th: angle round, 0 = right (+x), 90 degrees = the ridge. Returns the point and
// how deep it lies in a fold (0..1).
export function bodyShape(noise, k = 0) {
  // (round Q, R3: BOTH ENDS CLOSE ROUND. Near an end the girth goes as the square root of the way from it, a
  // blunt cap, where it went straight to the point before: the face of a very flat cone.)
  const prof = spline([[0, 0], [0.0005, 0.061], [0.002, 0.122], [0.005, 0.194], [0.012, 0.3], [0.05, 0.6], [0.13, 0.86], [0.27, 1.0], [0.44, 0.93], [0.6, 0.8], [0.75, 0.64], [0.87, 0.47], [0.95, 0.3], [0.99, 0.14], [0.995, 0.099], [0.998, 0.063], [0.9995, 0.031], [1, 0]]);
  const out = { x: 0, y: 0, z: 0, fold: 0 };
  const point = (v, th) => {
    const rho = Math.max(prof(v), 0), c = Math.cos(th), s = Math.sin(th);
    // constrictions along it like the necks of a gourd, lobes round it like a pumpkin's, and a slow lopsidedness
    const cz = fract(v * 4.3 + 0.18) - 0.5, neck = Math.exp(-(cz * cz) / 0.0055) * sstep(0.05, 0.2, v) * sstep(0.97, 0.85, v);
    const lobeA = Math.cos(th * 7 + 2.2 * Math.sin(v * 8 + k) + k), lobe = 0.045 * lobeA * sstep(0.02, 0.2, v) * sstep(1, 0.8, v);
    const low = 0.11 * noise.n3(c * 1.25 + k, s * 1.25, v * 3.4) + 0.045 * noise.n3(c * 3.1, s * 3.1 + k, v * 9);
    const f = rho * (1 - 0.15 * neck + lobe + low);
    const x0 = 6.5 * Math.sin(v * 4.4 + 0.7 + k) * rho, y0 = -7 * Math.exp(-((v - 0.3) * (v - 0.3)) / 0.03) + 13 * (2 * v - 1) * (2 * v - 1);
    out.x = x0 + BODY.a * f * c;
    out.y = BODY.cy + y0 + BODY.b * f * s * (s < 0 ? BODY.down : BODY.up);
    out.z = (0.5 - v) * BODY.len;
    // bark plates stand proud along the ridge
    const ridge = sstep(0.45, 0.9, s) * rho;
    out.y += ridge * (1.3 + 1.6 * Math.max(0, noise.n2(v * 26 + k, th * 5)));
    out.fold = clamp(neck * 0.9 + Math.max(0, -lobeA) * 0.55 * sstep(0.02, 0.2, v), 0, 1);
    return out;
  };
  return { point, prof };
}

// ---------------------------------------------------------------- body, sacs, pods
// aB: part (0 body, 1 sac, 2 dark pod, 3 clear pod, 4 pad of sap), phase, angle round a pod, fold.
// aC: the centre of a sac or pod; aAx: a pod's axis.
const SOFT_VERT = /* glsl */`
attribute vec4 aB; attribute vec3 aC, aAx;
uniform vec3 uSway;                          // roll about the cable (rad), bob (m), -
varying vec3 vW, vN, vObj, vNo, vQ, vCw, vAxw; varying vec4 vB; varying float vRho, vSc;
${CM_GLSL}
vec3 swayP(vec3 p){ float c = cos(uSway.x), s = sin(uSway.x); return vec3(p.x*c - p.y*s, p.x*s + p.y*c + uSway.y, p.z); }
vec3 swayN(vec3 p){ float c = cos(uSway.x), s = sin(uSway.x); return vec3(p.x*c - p.y*s, p.x*s + p.y*c, p.z); }
void main(){
  vec3 p = position;
  if (aB.x > 0.5 && aB.x < 1.5) {                  // a sac fills and empties
    float b = sin(uTime*1.2566 + aB.y*6.2831853), b2 = b*(1.0 - 0.3*b*b);
    vec3 q = p - aC; float hgt = dot(q, aAx);
    p = aC + q*(1.0 + 0.05*b2) + aAx*max(hgt - aB.w, 0.0)*0.55*b2;          // it stands up out of the hide as it fills, and sinks back
  }
  vObj = p; vNo = normal; vQ = p - aC; vB = aB; vRho = aC.x;       // (on the body aC.x is the girth's radius there, metres)
  vSc = length(modelMatrix[0].xyz);                                // (the size the whole thing is drawn at: 1 for the hero, the second's own for the second)
  vCw = (modelMatrix*vec4(swayP(aC), 1.0)).xyz; vAxw = mat3(modelMatrix)*swayN(aAx);
  vec4 w = modelMatrix*vec4(swayP(p), 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix)*swayN(normal));
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const SOFT_FRAG = /* glsl */`
#define CM_FOLLOW uFol
uniform float uFol;              // (mend U, U1) the share of the land's fall this creature's place takes: see FAR_FRAG
uniform vec3 uBark, uBarkD, uMoss, uLichen, uFelt, uSac, uPodAmber, uPodDark, uSkin; uniform mat3 uRot;
varying vec3 vW, vN, vObj, vNo, vQ, vCw, vAxw; varying vec4 vB; varying float vRho, vSc;
${CM_GLSL}
float sdSeg(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-5), 0.0, 1.0); return length(pa - ba*h) - r; }
// bark: plates between cracks. p: cells (along, round; per cells make the round). x = 0 on a crack, rising into
// the plate; y = the plate's number
vec2 plates(vec2 p, float per){
  vec2 n = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), c = n + g; c.y = mod(c.y, per);
    vec2 o = cmH2(c), r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = cmH(c + 7.7); } else if (d < d2) d2 = d;
  }
  return vec2(sqrt(d2) - sqrt(d1), id);
}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float part = vB.x;
  float toward = clamp(dot(-v, uSunDir), 0.0, 1.0);
  // ---- the relief of the hide (worked out for every fragment, so its screen derivatives are sound)
  float up = normalize(vNo).y, fold = vB.w, th = vB.z;
  // BARK AND BLADDER. The back and the upper flanks are furrowed bark: long ridges that run the length of the body
  // and wander, cracked across; within a ridge, fibre and flakes (the second, finer size: it is what says how big
  // the thing is). The belly is a bladder: taut pale skin, veined.
  float bark = smoothstep(-0.25, 0.3, up), zz = vObj.z;
  // (round Q, R3: NO PATTERN OF THE HIDE IS LAID BY THE ANGLE ROUND THE BODY SO THAT IT PINCHES WHERE THE BODY
  // CLOSES. Fibre, flake, grain, the cracks across, the veins, the hair and the wander of the ridges are laid in
  // the body's own metres (patterns in space, drawn out along its length): they have no pole. The long ridges
  // are counted round the body, 34 of them, so they DIE OUT as the girth falls toward an end: a ridge is whole
  // where it is 3.2 m broad (17 m of girth radius) and gone where it would be 0.9 m (5 m): the end is a blunt
  // cap of plain bark and moss, never a fan. Every pattern goes to its mean by the pixel's LARGER footprint.)
  vec3 oq = vec3(vObj.xy, zz); float rr = max(vRho, 0.0), ridgeW = rr/5.4113;
  // (mend R, G3: THE HIDE IS THE SAME HIDE AT ANY SIZE. Its patterns are laid in the body's own metres, so the
  // footprint they go to their mean by is the pixel's reach in those metres (the world's, over the size the
  // body is drawn at), and the relief's slope, further down, is the pattern's slope times that size. The
  // second of the kind, half the hero's size, had its ridges cut twice as steep as the hero's and kept twice
  // as long under the pixel: a pale back with hard dark stripes. For the hero the size is 1: nothing changes.)
  float fpx = cmPxMax(vW)/max(vSc, 1e-3), near1 = 1.0 - smoothstep(0.10, 0.54, fpx), near2 = 1.0 - smoothstep(0.034, 0.19, fpx);
  float wob = 1.3*cmN3(vec3(oq.xy*0.075, zz*0.028)) + 0.35*cmN3(vec3(oq.xy*0.2, zz*0.1));
  float rdgK = smoothstep(0.9, 3.2, ridgeW)*(1.0 - smoothstep(0.33, 0.8, fpx/max(ridgeW, 1e-3)));
  float rdg = mix(0.5, abs(fract(th*5.4113 + wob) - 0.5)*2.0, rdgK);     // 34 ridges round: 0 in a furrow .. 1 on a ridge
  float across = smoothstep(0.0, 0.2, abs(cmN3(vec3(oq.xy*0.175, zz*0.21)) - 0.5)*2.0);
  float fibre = cmN3(vec3(oq.xy*2.25, zz*0.8)), flake = cmN3(vec3(oq.xy*0.78, zz*0.31)), grainB = cmN3(vec3(oq.xy*6.5, zz*2.6));
  float hBark = smoothstep(0.0, 0.6, rdg)*(0.72 + 0.28*across) + (0.22*(flake - 0.5) + 0.12*(fibre - 0.5))*near1 + 0.06*(grainB - 0.5)*near2;
  float veinB = 1.0 - smoothstep(0.0, 0.12, abs(cmF3(vec3(oq.xy*0.125, zz*0.1)) - 0.5)*2.0);
  float hBlad = 0.1*veinB + 0.05*cmN3(vec3(oq.xy*0.5, zz*0.6))*near1;
  float h = mix(hBlad, hBark, bark)*(1.0 - step(0.5, part));
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); float hx = dFdx(h), hy = dFdy(h);
  vec3 col;
  if (part < 0.5) {
    float lod = 1.0 - smoothstep(0.25, 1.2, fpx);                        // the relief goes flat under the pixel's footprint
    vec3 r1 = cross(dpy, n), r2 = cross(n, dpx); float det = dot(dpx, r1);
    vec3 grad = (hx*r1 + hy*r2)*sign(det)/max(abs(det), 1e-6);
    n = normalize(n - clamp(grad*vSc, -3.0, 3.0)*0.85*lod);
    // bark: dark in the furrows, grey-green on the ridges, lichen in pale rosettes, moss in every furrow and fold
    vec3 albB = mix(uBarkD*0.6, uBark, smoothstep(0.05, 0.7, rdg)*(0.6 + 0.4*across))*(0.72 + 0.56*mix(0.5, 0.6*flake + 0.4*fibre, near1));
    float lich = smoothstep(0.6, 0.72, cmN3(vObj*0.22 + 40.0))*smoothstep(0.35, 0.6, cmN3(vObj*1.3))*smoothstep(0.3, 0.7, rdg);
    albB = mix(albB, uLichen*(0.6 + 0.4*smoothstep(0.3, 0.7, rdg)), lich*0.5);          // (lichen lies in the bark's own relief: never a flat pale oval)
    float moss = clamp((1.0 - smoothstep(0.0, 0.45, rdg))*0.8 + fold*1.1 + smoothstep(0.5, 0.75, cmF3(vObj*0.05 + 5.0))*0.8 - 0.15, 0.0, 1.0)*smoothstep(-0.4, 0.3, up);
    albB = mix(albB, uMoss*(0.45 + 0.6*cmN3(vObj*0.8)), moss*0.85);
    // bladder: pale grey-green skin with darker veins, mottled
    vec3 albS = mix(vec3(0.30, 0.37, 0.22), uSac*0.85, 0.35 + 0.5*cmN3(vObj*0.09 + 9.0))*(1.0 - 0.4*veinB)*(0.85 + 0.25*cmN3(vObj*0.7));
    vec3 alb = mix(albS, albB, bark);
    // seed-hair lies on the flanks and the belly in pale hanging streaks, thickest in the folds (the streaks go
    // to their mean, 0.3, under the pixel's footprint: the hair is there at every distance); and the hide is
    // drawn up into pale knots, a hashed scatter over the flanks and belly (about half of its cells hold one)
    float hairy = mix(0.3, smoothstep(0.45, 0.7, cmN3(vec3(oq.xy*0.95, zz*0.5 + 3.0*cmN3(vec3(oq.xy*0.05, zz*0.07))))), near1)*smoothstep(0.5, -0.5, up)*(0.5 + 0.5*fold);
    alb = mix(alb, uFelt*(0.7 + 0.4*fibre), hairy*0.3);
    float knot = (1.0 - smoothstep(0.1, 0.3, length(fract(vec2(zz*0.11, th*2.7) + cmH2(floor(vec2(zz*0.11, th*2.7)))*0.5) - 0.5)))*step(0.55, cmH(floor(vec2(zz*0.11, th*2.7)) + 3.3))*smoothstep(0.2, -0.6, up)*smoothstep(8.0, 20.0, rr);   // (the knots' cells are counted round the body: none where the girth closes)
    alb = mix(alb, uFelt*0.9, knot*0.6);
    float ao = (1.0 - 0.45*fold)*(0.55 + 0.45*mix(1.0, smoothstep(0.0, 0.5, rdg), bark))*(0.72 + 0.28*smoothstep(-1.0, 0.3, up));
    float ndl = dot(n, uSunDir);
    float diff = clamp((ndl + 0.3)/1.3, 0.0, 1.0);
    // lit by the sun on its sunward side, by the sky at its own height, and from below by the bright roof of the
    // forest (as its limbs and its rope are): the side turned from the sun has its ribs and folds in that light
    vec3 bounce = cmBounceL*vec3(0.42, 0.47, 0.3)*dot(uSunCol, vec3(0.33))*0.3*clamp(0.6 - 0.4*n.y, 0.0, 1.0);
    col = alb*(cmSunL*cmLitL(ndl)*0.6 + cmAmb(n)*0.8 + bounce)*ao;
    // the bladder is taut: a dull sheen, and the low sun comes a little way into its skin at the edge
    float nv = clamp(dot(n, v), 0.0, 1.0), rim = pow(1.0 - nv, 2.4);
    vec3 hv = uSunDir + v; hv /= max(length(hv), 1e-3);
    col += cmSunL*(1.0 - bark)*(pow(clamp(dot(n, hv), 0.0, 1.0), 26.0)*0.1 + uSac*rim*0.35*toward*toward);
    // (mend T, T3: THE RIM WHERE IT CROSSES THE SUN IS LIGHT CAUGHT IN ITS SEED-HAIR: only where the hair lies
    // (the flanks and the belly, in its own streaks: broken, uneven) and only as the thing stands toward the
    // sun from the eye; no edge of the bare hide or the bark is outlined, and nothing is lit from the side
    // away from the sun. It was an even pale edge all round, a little of it at every bearing.)
    col += cmSunL*uFelt*rim*0.45*toward*toward*bark*clamp(3.0*hairy, 0.0, 1.2);
  } else if (part < 1.5) {
    // ---- a breathing sac: a bladder in the hide. Where it comes out of the bark the skin is puckered into a
    // dark gathered rim; over the dome it is stretched thin, veined, and the light stands in it
    vec3 q = vQ, axw = normalize(vAxw), rel = vW - vCw;
    float em = max(dot(rel, axw) - vB.w, 0.0);                             // metres it stands out of the hide here
    vec3 tang = rel - axw*dot(rel, axw); float tl = max(length(tang), 1e-3);
    vec3 e1 = normalize(cross(axw, vec3(0.31, 0.2, 0.93))), e2 = cross(axw, e1);
    float ang = atan(dot(tang, e2), dot(tang, e1));
    float rimK = 1.0 - smoothstep(0.0, 0.45, em);                          // where it comes out of the hide (no dark ring: G2)
    float pucker = 0.5 + 0.5*sin(ang*31.0 + 7.0*cmN(vec2(ang*2.0, vB.y*40.0)));
    float veins = abs(cmF3(q*0.5 + vB.y*30.0) - 0.5)*2.0;
    float vein = 1.0 - smoothstep(0.0, 0.085, veins);
    // SOME ARE FULL, SOME SLACK (three in five full): a full one is taut and has a sheen; a slack one hangs in
    // folds that run out from its middle, and is duller
    float full = step(0.4, fract(vB.y*7.31)), slackK = 1.0 - full;
    float foldS = sin(ang*13.0 + 5.0*cmN(vec2(ang*3.0, em*0.8 + vB.y*9.0)));
    foldS *= smoothstep(0.3, 1.3, tl);                                     // (R3: the folds die out toward the dome's middle, where they would pinch)
    n = normalize(n + cross(axw, tang/tl)*foldS*0.55*slackK*smoothstep(0.2, 1.5, em));
    // A SWELLING OF THE HIDE, in the hide's own light: the sun, the sky at its height, the roof's green from
    // below; its crown takes the light and its sides turn away into the gathered rim
    float dome = clamp(dot(n, axw), 0.0, 1.0);
    float ndl = dot(n, uSunDir), diff = clamp((ndl + 0.3)/1.3, 0.0, 1.0);
    float nv = clamp(dot(n, v), 0.0, 1.0);
    float thru = pow(1.0 - nv, 1.5)*(0.35 + 0.65*toward) + 0.35*clamp(-ndl, 0.0, 1.0);
    // (G2: A BOSS IS A DOME WITH HIDE-LIGHT, never a ring round a dark or a pale middle: at its foot it is the
    // hide's own bark colour, and it goes a little greener and paler over the dome; no dark rim, no pale lip)
    vec3 hideC = mix(uBarkD, uBark, 0.5);
    vec3 skin = mix(hideC, mix(hideC, mix(vec3(0.3, 0.37, 0.22), uSac*0.62, 0.3 + 0.5*full), 0.55), smoothstep(0.2, 2.6, em));
    // (the roof's green from below is the widest light on the side turned from the sun: the under-curve of a
    // swelling takes it and its upper curve does not, which is what makes it a dome)
    vec3 bounce = cmBounceL*vec3(0.42, 0.47, 0.3)*dot(uSunCol, vec3(0.33))*0.6*clamp(0.5 - 0.5*n.y, 0.0, 1.0);
    col = skin*(cmSunL*cmLitL(ndl)*0.6 + cmAmb(n)*0.8 + bounce)*(0.6 + 0.4*dome)*(1.0 - 0.3*vein)*(1.0 - rimK*0.07*pucker)*(1.0 - 0.3*slackK*(0.5 - 0.5*foldS));
    col += uSac*vec3(1.1, 1.0, 0.45)*cmSunL*thru*0.2*(1.0 - rimK)*(0.4 + 0.6*full);
    // the sheen: the sun in a small bright point, and the bright roof below lying on the under-curve of a taut skin
    vec3 h = uSunDir + v; h /= max(length(h), 1e-3); vec3 rf = reflect(-v, n);
    col += (cmSunL*(pow(clamp(dot(n, h), 0.0, 1.0), 50.0)*0.3 + pow(clamp(dot(n, h), 0.0, 1.0), 7.0)*0.05) + cmBounceL*vec3(0.5, 0.56, 0.34)*dot(uSunCol, vec3(0.33))*pow(clamp(-rf.y, 0.0, 1.0), 5.0)*0.28)*(1.0 - rimK)*(0.25 + 0.75*full);
  } else if (part < 2.5) {
    // ---- a dark pod: a great seed, ribbed
    vec3 relP = vW - vCw, axP = normalize(vAxw); float poleP = smoothstep(0.15, 0.7, length(relP - axP*dot(relP, axP)));
    float ribs = mix(0.5, 0.5 + 0.5*cos(vB.z*9.0), poleP);                 // (R3: a pod's ribs die out toward its two ends)
    float ndl = dot(n, uSunDir), diff = clamp((ndl + 0.25)/1.25, 0.0, 1.0);
    col = uPodDark*(0.55 + 0.6*ribs)*(cmSunL*diff*0.55 + cmAmb(n)*0.8);
    vec3 h = uSunDir + v; h /= max(length(h), 1e-3);
    col += cmSunL*pow(clamp(dot(n, h), 0.0, 1.0), 24.0)*0.12*ribs;
  } else if (part < 3.5) {
    // ---- a clear pod: amber-green glass with a small curled figure inside, lit through where the sun is behind it
    vec3 axw = normalize(vAxw), rd = -v, cw = vCw;
    vec3 pn = rd - axw*dot(rd, axw); pn /= max(length(pn), 1e-3);              // a plane through the axis, facing the eye
    float t = dot(cw - vW, pn)/max(dot(rd, pn), 0.05);
    vec3 hp = vW + rd*t - cw;
    vec2 f0 = vec2(dot(hp, axw), dot(hp, cross(axw, pn)))/2.7;                // along the pod (its fat lower end is +1), across it
    vec2 f = (f0 - vec2(0.36, 0.0))/0.8;                                       // the figure lies curled in its fat end, head down
    // the figure: head tucked, back curved, knees drawn up; it stirs
    float st = sin(uTime*0.5 + vB.y*40.0), st2 = sin(uTime*0.31 + vB.y*17.0);
    vec2 hd = vec2(0.30 + 0.015*st, 0.03 + 0.02*st2);
    float d = length(f - hd) - 0.105;
    d = min(d, sdSeg(f, vec2(0.20, -0.02), vec2(-0.06, -0.10), 0.085));       // back
    d = min(d, sdSeg(f, vec2(-0.06, -0.10), vec2(-0.26, -0.03), 0.08));       // hips
    d = min(d, sdSeg(f, vec2(-0.26, -0.03), vec2(-0.05 + 0.02*st, 0.10), 0.055)); // thigh
    d = min(d, sdSeg(f, vec2(-0.05 + 0.02*st, 0.10), vec2(-0.28, 0.13), 0.045));  // shin
    d = min(d, sdSeg(f, vec2(0.16, 0.0), vec2(0.04, 0.09 + 0.02*st2), 0.04));     // arm
    // a soft shape seen through the wall, never a hard mark. The figure is a pattern of the pod's wall a metre
    // or so across: it melts into the pod's own colour as the pixel's footprint on the pod grows from 0.22 to
    // 0.34 m (antialiasing; fpx is the larger reach, cmPxMax): a pod of a few pixels is a plain lit seed
    float fig = (1.0 - smoothstep(-0.03, 0.05, d))*(1.0 - smoothstep(0.22, 0.34, fpx));
    float nv = clamp(dot(n, v), 0.0, 1.0);
    float glass = 0.30 + 0.7*pow(1.0 - nv, 2.0);
    float back = 0.7 + 1.9*toward*toward + 0.5*clamp(dot(-n, uSunDir), 0.0, 1.0);
    // lit through like a green grape held to the light: brightest where it is thickest, a paler wall at its
    // edge, faintly ribbed; the light in it is the sun's with half its gold taken out by the green of the wall
    vec3 sunW = dot(cmSunL, vec3(0.3, 0.5, 0.2))*vec3(0.9, 1.0, 0.62);
    vec3 body = uPodAmber*(cmAmb(n)*0.5 + sunW*0.2*min(back, 1.9)*(0.35 + 0.65*nv));
    body = mix(body, body*vec3(1.12, 1.0, 0.62), smoothstep(-0.3, 0.8, f0.x)*0.6);
    body *= 0.86 + 0.14*cos(vB.z*8.0)*smoothstep(0.15, 0.7, length(hp - axw*dot(hp, axw)));
    body += uPodAmber*sunW*0.1*pow(1.0 - nv, 3.0);
    col = mix(body, mix(uSkin, vec3(0.3, 0.22, 0.1), 0.45)*(cmAmb(n)*0.75 + sunW*0.06*back), fig*0.8);
    vec3 h = uSunDir + v; h /= max(length(h), 1e-3);
    col += cmSunL*pow(clamp(dot(n, h), 0.0, 1.0), 90.0)*0.55 + cmAmb(n)*glass*0.12;
  } else {
    // ---- a pad of dried sap
    float ndl = dot(n, uSunDir);
    col = vec3(0.15, 0.115, 0.06)*(cmSunL*clamp(ndl*0.7 + 0.3, 0.0, 1.0)*0.4 + cmAmb(n)*0.7);
    vec3 h = uSunDir + v; h /= max(length(h), 1e-3);
    col += cmSunL*pow(clamp(dot(n, h), 0.0, 1.0), 40.0)*0.14;
  }
  col = cmAir(col, vW);
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- geometry of the soft parts
function softGeo() { return new Geo({ aB: 4, aC: 3, aAx: 3 }); }
// the gourd: NZ rings of NA points; normals from the grid itself (the seam and the ends agree); attr(v, th, fold) sets
// the extra attributes of each vertex
function pushBody(G, shape, NZ, NA, attr) {
  const base = G.count, P = new Float32Array((NZ + 1) * (NA + 1) * 3), VS = [], F = [];
  for (let j = 0; j <= NZ; j++) {
    // rings crowd toward both ends, where the shape turns fastest
    const t = j / NZ, v = clamp(0.5 - 0.5 * Math.cos(Math.PI * t) * (0.7 + 0.3 * Math.abs(Math.cos(Math.PI * t))), 0, 1);
    VS.push(v);
    for (let i = 0; i <= NA; i++) { const p = shape.point(v, (i / NA) * TAU), k = (j * (NA + 1) + i) * 3; P[k] = p.x; P[k + 1] = p.y; P[k + 2] = p.z; F.push(p.fold); }
  }
  const at = (j, i) => (clamp(j, 0, NZ) * (NA + 1) + ((i % NA) + NA) % NA) * 3;
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NA; i++) {
    const k = (j * (NA + 1) + i) * 3, a = at(j, i - 1), b = at(j, i + 1), c = at(j - 1, i), d = at(j + 1, i);
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], wx = P[d] - P[c], wy = P[d + 1] - P[c + 1], wz = P[d + 2] - P[c + 2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz);
    if (l < 1e-6) { nx = 0; ny = 0; nz = j < NZ / 2 ? 1 : -1; } else { nx /= l; ny /= l; nz /= l; }
    if (nx * P[k] + ny * (P[k + 1] - BODY.cy) + nz * P[k + 2] * 0.3 < 0) { nx = -nx; ny = -ny; nz = -nz; }
    attr(VS[j], (i / NA) * TAU, F[j * (NA + 1) + i]);
    G.v(P[k], P[k + 1], P[k + 2], nx, ny, nz);
  }
  G.stitch(base, NZ + 1, NA, true);
}
// a blob (sac, pod, pad): an ellipsoid with half axes (ra along `axis`, rb across), seated at c
function pushBlob(G, c, axis, side, ra, rb, part, phase, seg = 10, rings = 7, squash = 1, w4 = 0) {
  const base = G.count, u = new THREE.Vector3().crossVectors(axis, side).normalize(), w = new THREE.Vector3().crossVectors(u, axis).normalize();
  for (let j = 0; j <= rings; j++) {
    const ph = (j / rings) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
    for (let k = 0; k <= seg; k++) {
      const th = (k / seg) * TAU, ct = Math.cos(th), st = Math.sin(th);
      // a pod hangs like a drop: a narrow neck where it is gummed on, fat toward its lower end
      const rr = part === 2 || part === 3 ? Math.pow(sp, 0.9) * (0.62 + 0.38 * cp) : sp;
      const lx = cp * ra, lu = ct * rr * rb, lw = st * rr * rb * squash;
      const nx = cp / ra, nu = ct * sp / rb, nw = st * sp / (rb * squash);
      const px = c.x + axis.x * lx + u.x * lu + w.x * lw, py = c.y + axis.y * lx + u.y * lu + w.y * lw, pz = c.z + axis.z * lx + u.z * lu + w.z * lw;
      let ax = axis.x * nx + u.x * nu + w.x * nw, ay = axis.y * nx + u.y * nu + w.y * nw, az = axis.z * nx + u.z * nu + w.z * nw; const l = Math.hypot(ax, ay, az) || 1;
      G.set('aB', part, phase, th, w4); G.set('aC', c.x, c.y, c.z); G.set('aAx', axis.x, axis.y, axis.z);
      G.v(px, py, pz, ax / l, ay / l, az / l);
    }
  }
  G.stitch(base, rings + 1, seg, true);
}
// a point of the hide and its outward normal
function hideAt(shape, v, th, out) {
  const p = shape.point(v, th); out.p.set(p.x, p.y, p.z);
  const a = shape.point(v, th + 0.02); _a.set(a.x, a.y, a.z).sub(out.p);
  const b = shape.point(Math.min(v + 0.004, 1), th); _b.set(b.x, b.y, b.z).sub(out.p);
  out.n.crossVectors(_a, _b).normalize();                    // d/dth x d/dv: outward for this winding
  if (out.n.dot(_c.set(out.p.x, out.p.y - BODY.cy, 0)) < 0) out.n.negate();
  out.down.copy(_a).normalize(); if (out.down.y > 0) out.down.negate();      // along the hide, downhill
  return out;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();

// ---------------------------------------------------------------- limbs and hands
// position: (cos, sin, radius) of the vertex on its ring (bough, finger); drapes and shoots keep the bough's radius in z.
// aL: limb, t (0..3 through root, knee, knee, hand), a third coordinate, kind:
//     0 the bough itself (third: metres along)        1 a finger (t is 0..1 along the finger)
//     2 a drape of moss and seed-hair hanging from the bough (third: q 0..1 down it)
//     3 a leaf of the shoots that sprout from a knee (third: 0..1 along the blade)
// aF: finger: place along the cable (m), which way round, -, phase.   drape: length, side, half width, phase.
//     shoot: length, across -1..1, angle round the knee, lean along the bough.
const LIMB_VERT = /* glsl */`
attribute vec4 aL, aF;
uniform vec3 uJ[28]; uniform vec3 uLN[7]; uniform vec4 uHand[7];     // joints (body space); each limb's plane; hand: grip 0..1, cable radius there,
uniform vec3 uDown;                                                  // (mend V) how the rope's sink changes along the hand (m a metre), the share of the land's fall the hand has taken
uniform float uFol;              // (mend U, U1) the share of the land's fall this creature's place takes: see FAR_FRAG
varying vec3 vW, vN; varying vec4 vL; varying vec2 vPhi; varying float vFol;
${CM_GLSL}
void main(){
  int li = int(aL.x + 0.5);
  float kind = aL.w;
  vec3 c, N1, N2, T = vec3(0.0, 0.0, -1.0);
  if (kind < 0.5 || kind > 1.5) {
    float t = clamp(aL.y, 0.0, 2.9999); int sg = int(floor(t)); float f = t - float(sg);
    vec3 P0 = uJ[li*4 + max(sg - 1, 0)], P1 = uJ[li*4 + sg], P2 = uJ[li*4 + sg + 1], P3 = uJ[li*4 + min(sg + 2, 3)];
    vec3 m1 = (P2 - P0)*0.2, m2 = (P3 - P1)*0.2;                          // straight between its joints, turning at the knees
    float f2 = f*f, f3 = f2*f;
    c = (2.0*f3 - 3.0*f2 + 1.0)*P1 + (f3 - 2.0*f2 + f)*m1 + (-2.0*f3 + 3.0*f2)*P2 + (f3 - f2)*m2;
    T = (6.0*f2 - 6.0*f)*P1 + (3.0*f2 - 4.0*f + 1.0)*m1 + (-6.0*f2 + 6.0*f)*P2 + (3.0*f2 - 2.0*f)*m2;
    T /= max(length(T), 1e-4);
    N1 = uLN[li]; N2 = cross(T, N1);
    // a living bough is never straight: it wanders between its joints
    float env = sin(3.14159*clamp(aL.y/3.0, 0.0, 1.0));
    c += (N1*sin(aL.y*5.3 + aL.x*2.1) + N2*cos(aL.y*3.9 + aL.x*1.3))*0.6*env;
  } else {
    // a finger: a rootlet that curls round the cable under the hand. When the hand lets go it opens as a claw
    // does: still hooked half round, standing off the rope by at most 0.6 of its radius more (so an open hand
    // is a hooked hand on the end of its limb, never prongs standing up alone over the rope)
    float w = aL.y, grip = uHand[li].x, rc = uHand[li].y, open = 1.0 - grip;
    vec3 G = uJ[li*4 + 3];
    float R = (rc + 0.75)*(1.0 + open*w*0.6);
    float th = aF.y*(0.22 + w*(3.25*grip + 1.75*open));
    vec3 radial = vec3(sin(th), cos(th), 0.0);
    c = G - vec3(0.0, rc + 0.75, 0.0) + radial*R + vec3(0.0, 0.0, aF.x*(1.0 + 0.25*w*open));
    // (mend V) the rope under a hand has sunk more at the hand's lower side than at its upper: each finger
    // closes round the rope where the rope is drawn at the finger's own metre (aF.x: its place along the hand)
    c -= uDown*(uHand[li].z*aF.x*(1.0 + 0.25*w*open));
    N1 = vec3(0.0, 0.0, 1.0); N2 = radial;
  }
  vec3 p, nrm;
  if (kind < 1.5) { nrm = N1*position.x + N2*position.y; p = c + nrm*position.z; }
  else if (kind < 2.5) {
    // a drape: it hangs from the underside, streams back down the cable, sways from its root
    float q = aL.z, L = aF.x, ph = aF.w;
    vec3 sw = vec3(sin(uTime*0.7 + ph*30.0 + q*2.0), 0.0, 0.6*sin(uTime*0.5 + ph*17.0 + q*3.0))*L*0.07*q*q;
    p = c + uDown*(position.z*0.7 + L*q*(1.0 - 0.15*q)) + vec3(0.0, 0.0, 1.0)*L*0.28*q*q + sw + T*aF.y*aF.z*(1.0 - 0.75*q);
    nrm = cross(T, uDown); float nl = length(nrm); nrm = nl > 1e-3 ? nrm/nl : vec3(1.0, 0.0, 0.0);     // (a drape that hangs straight down its bough has no side of its own)
  } else {
    // a shoot: a young leaf standing out of the knee, drooping a little at the tip
    float u = aL.z, L = aF.x, s = aF.y, an = aF.z;
    vec3 dir = N1*cos(an) + N2*sin(an) + T*aF.w; dir /= max(length(dir), 1e-3);
    vec3 wd = cross(dir, T); wd /= max(length(wd), 1e-3);
    float bw = 0.24*L*sin(3.14159*pow(clamp(u, 0.0, 1.0), 0.7));
    float fl = 0.06*L*u*sin(uTime*(1.5 + aF.w) + an*7.0 + aL.x*3.0);
    p = c + dir*(position.z + u*L) + wd*s*bw + T*fl + uDown*0.15*L*u*u;
    nrm = cross(dir, wd);
  }
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*nrm); vL = aL; vPhi = kind < 1.5 ? vec2(atan(position.y, position.x), 0.0) : vec2(aF.y, aF.w);
  // (mend V) THE SHARE OF THE LAND'S FALL THIS POINT TAKES, for the light by a thing's own height: the creature's
  // own (uFol: its place on its rope) and, along a limb whose hand has gone down with a sinking rope, the
  // hand's share (uHand.w) by the point's place along the limb: none at the shoulder, all of it at the hand
  vFol = uFol + uHand[li].w*(kind > 0.5 && kind < 1.5 ? 1.0 : clamp(aL.y/3.0, 0.0, 1.0));
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const LIMB_FRAG = /* glsl */`
#define CM_FOLLOW vFol
varying float vFol;              // (mend U, U1; mend V) the share of the land's fall this point takes: said in LIMB_VERT
uniform vec3 uBark, uBarkD, uMoss, uLichen, uFelt;
varying vec3 vW, vN; varying vec4 vL; varying vec2 vPhi;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float t = clamp(vL.y, 0.0, 3.0), kind = vL.w;
  float toward = clamp(dot(-v, uSunDir), 0.0, 1.0);
  vec3 col;
  float fpx = cmPx(vW);                                  // the pixel's footprint on the limb (taken before the branch below)
  if (kind < 1.5) {
    float len = vL.z, phi = vPhi.x, fing = kind;
    float lod = 1.0 - smoothstep(0.25, 1.35, fpx), lodFar = 1.0 - smoothstep(0.10, 0.7, fpx);   // footprint fades (cmPx)
    // bark of a living bough: long fibrous ridges, cracked across, callus at the knees, moss on every upper side
    float knee = (exp(-(t - 1.0)*(t - 1.0)/0.01) + exp(-(t - 2.0)*(t - 2.0)/0.01))*(1.0 - fing);
    float ridge = cmN(vec2(phi*4.0 + 0.6*sin(len*0.07), len*0.06 + vL.x*7.0));
    float fine = cmN(vec2(phi*13.0, len*0.5 + vL.x*3.0));
    float crack = smoothstep(0.0, 0.16, abs(cmN(vec2(phi*2.0 + vL.x, len*0.33)) - 0.5)*2.0);
    crack = mix(0.87, crack, lodFar);                    // (0.87: the mean of the cracks' light)
    float h = mix(0.6*ridge + 0.4*fine, cmN(vec2(phi*6.0, len*1.3)), knee*0.7)*crack;
    vec3 alb = mix(uBarkD, uBark, smoothstep(0.1, 0.7, h))*(0.85 + 0.3*mix(0.5, fine, lodFar));
    alb = mix(alb, uLichen, smoothstep(0.6, 0.8, cmN(vec2(phi*1.5 + 9.0, len*0.11)))*0.5);
    alb = mix(alb, uMoss, smoothstep(-0.1, 0.7, n.y)*smoothstep(0.25, 0.6, cmN(vec2(phi*2.2 + 3.0, len*0.09)))*0.85);
    // (a finger has the limb's own bark and moss, a shade darker: the hero's green-brown, never pale)
    alb *= 1.0 - 0.2*fing;
    float ndl = dot(n, uSunDir), diff = clamp((ndl + 0.3)/1.3, 0.0, 1.0);
    // (the lit roof below reaches the side turned from the sun: no limb or hand is a black shape on the rope)
    vec3 bounce = cmBounceL*vec3(0.42, 0.47, 0.3)*dot(uSunCol, vec3(0.33))*0.6*clamp(0.6 - 0.4*n.y, 0.0, 1.0);
    col = alb*(cmSunL*cmLitL(ndl)*0.6 + cmAmb(n)*0.85 + bounce)*(0.7 + 0.3*crack)*(0.85 + 0.3*mix(0.5, h, lod));
    // (mend T, T3: the rim is the sun in the limb's moss, toward the sun only, broken by the bark's own grain)
    float rim = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 2.6)*toward*toward*2.0*mix(0.5, smoothstep(0.3, 0.7, h), lod);
    col += cmSunL*uFelt*rim*0.2*(1.0 - 0.85*fing)*mix(0.5, 1.0, lod);       // (no pale edge on a finger; half on a limb a pixel or two wide)
  } else if (kind < 2.5) {
    // moss and seed-hair hanging: pale, the sun in it from behind
    float q = vL.z;
    float fib = 0.6 + 0.4*cmN(vec2(vPhi.x*3.0 + vPhi.y*50.0, q*6.0));
    vec3 alb = mix(uMoss*1.2, uFelt, smoothstep(0.1, 0.8, q))*fib;
    col = alb*(cmAmb(vec3(0.0, 0.3, 0.0))*0.8 + cmSunL*(0.10 + 0.5*toward*toward));
  } else {
    // a young leaf on a pollard shoot
    col = cmLeaf(n, v, 0.25 + 0.5*fract(vPhi.y*7.0 + vL.x*0.37), 1.0, 0.85, 0.5);
  }
  col = cmAir(col, vW);
  gl_FragColor = vec4(col, 1.0);
}`;

// THE SEVEN LIMBS. They are the creature's own: long (114 to 190 m on a 220 m body), thin, three-jointed with knobbed
// knees, each rooted in the ridge with a swollen shoulder and ending in a hand on the rope; three reach ahead up
// the cable and four trail behind, splayed along it. z, x: where it leaves the ridge (z along the body, front
// negative); L: its length; a: the share of it in the first and in the last joint; bx, by: which way its knees
// stand off the straight line from shoulder to hand (bx to the side, by up: the ones on the far side from the
// route stand out and a little up, the ones on our side hang, so that none comes near the eye); off: where its
// hand holds relative to the body's middle (metres up the cable); turn: its place in the round of steps.
export const LIMBS = [
  { z: -80, x: 8, L: 164, a: 0.30, bx: 1.0, by: 0.25, off: 205, turn: 0, thick: 1.0 },
  { z: -52, x: -10, L: 126, a: 0.30, bx: -0.3, by: -0.6, off: 135, turn: 5, thick: 0.85 },
  { z: -22, x: 11, L: 114, a: 0.30, bx: 1.0, by: 0.1, off: 92, turn: 3, thick: 0.9 },
  { z: 8, x: -9, L: 114, a: 0.30, bx: -0.3, by: -0.5, off: -78, turn: 1, thick: 1.05 },
  { z: 36, x: 12, L: 136, a: 0.30, bx: 1.0, by: 0.15, off: -130, turn: 6, thick: 0.95 },
  { z: 66, x: -8, L: 158, a: 0.30, bx: -0.25, by: -0.65, off: -185, turn: 4, thick: 0.82 },
  { z: 96, x: 7, L: 190, a: 0.29, bx: 0.9, by: 0.3, off: -250, turn: 2, thick: 1.1 },
];
// (mend V, V1) A LIMB'S REACH, SAID ONCE. LIMB_REACH: no limb is ever drawn longer, its three joints summed, than
// this many times its own length L. The knees never straighten past KNEE_STRAIGHT (the cosine of the angle each
// end joint makes with the line from shoulder to hand), so the farthest a hand stands from its shoulder is
// limbReach(l). SAID PLAINLY: the number is over 1, and it was settled on the whole field. The gait as it was
// before this rule already drew a limb longer than its length at the ends of a stance, its middle joint
// giving: up to 1.0327 of its length on seeds 1 to 200 and 1.0355 on seeds 1 to 2,000 (counted by a twin of
// the gait at every 2 m of the road, all seven limbs, no land's fall; the page's own count on the seeds
// tried agrees to the last digit). LIMB_REACH stands just over that, so that this rule moves no hand of
// the gait as dealt where the rope under it takes none of the land's fall.
// SHIFT_LOOSE, SHIFT_OVER: a hand whose hold has shifted along the rope (see the gait) loosens its fingers by
// SHIFT_LOOSE of fully open over the first SHIFT_OVER metres of the shift: hooked round the rope, not shut on it.
export const LIMB_REACH = 1.04;
const KNEE_STRAIGHT = 0.985, SHIFT_LOOSE = 0.35, SHIFT_OVER = 2;
export const limbReach = (l) => l.L * (LIMB_REACH - 2 * l.a * (1 - KNEE_STRAIGHT));
// 6 m thick at the shoulder, 2.5 m at the wrist; a knob at each knee, a swelling where it leaves the ridge
function limbRadius(l, t, noiseV) {
  const k = t / 3, base = lerp(3.0, 1.25, Math.pow(k, 0.8)) * l.thick;
  const knob = 1 + 0.95 * Math.exp(-((t - 1) * (t - 1)) / 0.006) + 0.85 * Math.exp(-((t - 2) * (t - 2)) / 0.006) + 1.3 * Math.exp(-t / 0.13) + 0.5 * Math.exp(-((3 - t) * (3 - t)) / 0.004);
  return base * knob * (1 + 0.1 * noiseV);
}
// (o.skip: limbs that are not grown; o.NR, o.NS: rings along and sides round, for one that is never seen so near)
function makeLimbGeometry(noise, rng, o = {}) {
  const G = new Geo({ aL: 4, aF: 4 }), NR = o.NR ?? 60, NS = o.NS ?? 14, skip = o.skip || [];
  const strip = (seg) => { const b = G.count - (seg + 1) * 2; for (let k = 0; k < seg; k++) { const a = b + k * 2; G.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
  for (let i = 0; i < 7; i++) {
    if (skip.includes(i)) continue;
    const l = LIMBS[i], base = G.count, segLen = [l.a * l.L, (1 - 2 * l.a) * l.L, l.a * l.L];
    for (let j = 0; j <= NR; j++) {
      const t = (j / NR) * 3, sg = Math.min(2, Math.floor(t)), len = (sg > 0 ? segLen[0] : 0) + (sg > 1 ? segLen[1] : 0) + (t - sg) * segLen[sg];
      for (let k = 0; k <= NS; k++) {
        const ph = (k / NS) * TAU, r = limbRadius(l, t, noise.n2(t * 7 + i * 9.1, Math.cos(ph) * 1.6 + Math.sin(ph) * 2.3) + 0.6 * noise.n2(t * 23 + i * 3, Math.cos(ph) * 3.1));
        G.set('aL', i, t, len, 0); G.set('aF', 0, 0, 0, 0);
        G.v(Math.cos(ph), Math.sin(ph), r);
      }
    }
    G.stitch(base, NR + 1, NS);
    // six rootlet fingers, three each way round
    const NF = 6, FR = o.FR ?? 11, FS = o.FS ?? 6;
    for (let f = 0; f < NF; f++) {
      const b2 = G.count, zoff = (f - (NF - 1) / 2) * 1.5 * l.thick, sense = f % 2 ? 1 : -1, fr = (0.75 - 0.06 * Math.abs(f - 2.5)) * l.thick;
      for (let j = 0; j <= FR; j++) {
        const w = j / FR;
        for (let k = 0; k <= FS; k++) { const ph = (k / FS) * TAU; G.set('aL', i, w, w * 12, 1); G.set('aF', zoff, sense, 0, f / NF); G.v(Math.cos(ph), Math.sin(ph), fr * (1 - 0.72 * w) * (1 + 0.25 * Math.sin(w * 9 + f))); }
      }
      G.stitch(b2, FR + 1, FS);
    }
    // drapes of moss and seed-hair hanging all along it
    const ND = Math.round(l.L / 14);
    for (let d = 0; d < ND; d++) {
      const t = 0.12 + 2.8 * (d + rng()) / ND, len = rng.range(4, 11) * (0.7 + 0.5 * Math.sin(Math.PI * t / 3)), hw = rng.range(0.4, 1.0), ph = rng(), SEG = 4, rr = limbRadius(l, t, 0);
      for (let k = 0; k <= SEG; k++) for (const sd of [-1, 1]) { G.set('aL', i, t, k / SEG, 2); G.set('aF', len, sd, hw, ph); G.v(0, 0, rr); }
      strip(SEG);
    }
    // pollard shoots: a spray of young leaves at each knee
    for (const tk of [1, 2]) for (let b = 0; b < 2; b++) {
      const len = rng.range(3, 6) * l.thick, an = rng.range(0, TAU), lean = rng.range(-0.5, 0.5), rr = limbRadius(l, tk, 0) * 0.8, t = tk + rng.range(-0.06, 0.06);
      for (let k = 0; k <= 3; k++) for (const sd of [-1, 1]) { G.set('aL', i, t, k / 3, 3); G.set('aF', len, sd, an, lean); G.v(0, 0, rr); }
      strip(3);
    }
  }
  return G;
}

// ---------------------------------------------------------------- the gait: pure functions of the gait clock
// AN UNEVEN GAIT, as a sloth's is. own.gap[i] (-1..1): limb i takes its turn at its even place in the round moved
// by gap x 0.35 of a seventh; own.swing[i] (0.8..1.25): its swing lasts that many times the mean 6 s. By these
// sizes no four limbs ever swing together (turns three apart are at least 3/7 - 0.1 = 0.33 of a round apart and
// the longest swing is 0.23 of a round), so at least four always hold; and the neighbours on one side of the body
// are three or four turns apart (see LIMBS), so two neighbouring limbs on one side never swing together.
// own.sway[3]: where in their own slow periods the body's sway and bob stand when the gait clock is at 0.
export function makeGait(shape, phase0 = 0, own = {}) {
  const n = 7, gap = own.gap || [0, 0, 0, 0, 0, 0, 0], swl = own.swing || [1, 1, 1, 1, 1, 1, 1], sw3 = own.sway || [0, 0, 0];
  const roots = LIMBS.map((l) => { const v = 0.5 - l.z / BODY.len, th = Math.PI / 2 - (l.x / BODY.a) * 0.9, p = shape.point(v, th); return new THREE.Vector3(p.x, p.y - 4, p.z); });
  const st = {
    phase0, sBody: GAIT.s0, sway: 0, bob: 0,
    J: Array.from({ length: 28 }, () => new THREE.Vector3()), LN: Array.from({ length: 7 }, () => new THREE.Vector3(1, 0, 0)),
    hand: Array.from({ length: 7 }, () => new THREE.Vector4(1, 4, 0, 0)), grips: Array.from({ length: 7 }, () => new THREE.Vector4(0, 0, 0, 0)),
    lift: new Float32Array(7), swingE: new Float32Array(7),
    // (mend V) shift[i]: by how many metres along the rope limb i's hold stands from the gait's own hold, toward
    // the metre over its shoulder, because the gait's hold is beyond its reach (0: it has the gait's hold)
    shift: new Float32Array(7),
  };
  const e1 = new THREE.Vector3(), B = new THREE.Vector3(), Gp = new THREE.Vector3(), Sv = new THREE.Vector3(), Sw = new THREE.Vector3();
  const Rs = Array.from({ length: 7 }, () => new THREE.Vector3());
  // (the rope under the hands: ours by default; another of the kind on another cable hands over that rope's own)
  const radF = own.radius || ((s) => cableRadius(clamp(s, 0, CABLE_L))), dipF = own.dip || cableDip;
  // (mend V, V1) own.rope: THE ROPE AS IT IS DRAWN under this creature's hands, in the creature's own frame:
  // seat(s, out): where the rope's drawn middle at s stands from the frame's line (the land's fall it has
  // taken, and its turn into the hill under its foot); share(s): the share of the land's fall it has taken
  // there (for the limb's light). own.down: straight down, in the frame. Without own.rope the rope is the
  // frame's line (the bare piece in the viewer has a rope too; another of the kind hands over its own).
  // (mend W, W1) rope.clip(s), if the rope has an end a hand cannot hold past: the nearest metre to s at which the
  // rope can be held. The gait's hold is taken there (grips[i].x is the hold the hand has, as with a shift).
  const rope = own.rope || null, downV = own.down || new THREE.Vector3(0, -1, 0);
  // where limb i's hand would hold: on top of the rope where it is drawn; in a swing it lifts clear, up and a
  // little to its side: 7 m out on the far side of the body from the route, no more than 2 m on ours (it lifts
  // up and in, toward the cable), so that no hand's swing reaches toward the road at any moment of the round.
  // Returns the rope's radius there.
  const hold = (i, out) => { const l = LIMBS[i], g = st.grips[i], rc = radF(g.x), lf = st.lift[i];
    out.set((l.bx > 0 ? 7 : -2) * lf, dipF(g.x, st.grips) * (1 - lf) + rc + 0.75 + 13 * lf, -(g.x - st.sBody));
    if (rope) out.add(rope.seat(g.x, Sv));
    return rc; };
  // tg: gait seconds. Fills st.
  st.solve = (tg) => {
    const sB = GAIT.s0 + GAIT.speed * tg; st.sBody = sB;
    st.sway = 0.02 * Math.sin(TAU * (tg / 9.3 + sw3[0])) + 0.012 * Math.sin(TAU * (tg / 5.1 + sw3[1]));
    st.bob = 0.9 * Math.sin(TAU * (tg / 6.4 + sw3[2]));
    for (let i = 0; i < n; i++) {
      const l = LIMBS[i], swing = GAIT.swing * swl[i], stance = GAIT.T - swing;
      const ph = (l.turn + 0.35 * gap[i]) / n + st.phase0, c = tg / GAIT.T + ph, k = Math.floor(c), tau = (c - k) * GAIT.T;
      const S0 = GAIT.s0 + GAIT.speed * (stance / 2 - ph * GAIT.T) + l.off, sg = S0 + GAIT.stride * k, g = st.grips[i];
      if (tau < stance) {
        st.swingE[i] = 0; st.lift[i] = 0; st.hand[i].x = 1;
        g.set(sg, sstep(0, 0.8, tau) * sstep(stance, stance - 0.8, tau), tau, 1.1 + 1.4 * Math.exp(-tau / 1.6));
      } else {
        const e = (tau - stance) / swing, ee = e * e * e * (e * (e * 6 - 15) + 10), sn = Math.sin(Math.PI * e);
        st.swingE[i] = e; st.lift[i] = sn * sn; st.hand[i].x = 1 - sstep(0, 0.14, e) * sstep(1, 0.84, e);
        g.set(sg + GAIT.stride * ee, 0, 0, 1.1);
      }
    }
    if (rope && rope.clip) for (let i = 0; i < n; i++) st.grips[i].x = rope.clip(st.grips[i].x);
    const cs = Math.cos(st.sway), sn = Math.sin(st.sway);
    // (mend V, V1) A HAND HOLDS THE ROPE WHERE THE ROPE IS DRAWN, AND A LIMB REACHES NO FARTHER THAN ITS REACH.
    // The hold is on the rope as its mesh draws it (hold(): the land's fall the rope has taken at the grip's
    // metre is in it), so as the land falls the limb reaches down after the rope. Where the gait's hold stands
    // beyond the limb's reach (limbReach) the limb does what a climber does: IT TAKES THE HOLD IT CAN REACH.
    // Its hold shifts along the rope toward the metre over its own shoulder, by as little as brings it within
    // reach (found by halving the rope between the gait's hold and the shoulder's metre: the rope over the
    // shoulder is always in reach), its fingers loosening as the hold shifts. The hand is on the rope all the
    // while, the limb is at its full reach and no longer, and the cable's dip is under the hand where it
    // holds (grips[i].x is the hold it has). When the gait's own hold is in reach again, the next its swing
    // carries it to or the same one, the shift is nought. One rule for every limb and every creature of the
    // kind, by the metres a hold lacks and nothing else: nothing of it is by the eye, the road or the clock.
    for (let i = 0; i < n; i++) { const r0 = roots[i]; Rs[i].set(r0.x * cs - r0.y * sn, r0.x * sn + r0.y * cs + st.bob, r0.z); }
    let shifted = false;
    for (let i = 0; i < n; i++) {
      const g = st.grips[i], reach = limbReach(LIMBS[i]); st.shift[i] = 0;
      hold(i, Gp); if (!(Gp.distanceTo(Rs[i]) > reach)) continue;
      const s0 = g.x, sR = sB - Rs[i].z; let lo = 0, hi = 1;
      for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; g.x = sR + (s0 - sR) * m; hold(i, Gp); if (Gp.distanceTo(Rs[i]) > reach) hi = m; else lo = m; }
      g.x = sR + (s0 - sR) * lo; st.shift[i] = Math.abs(s0 - g.x); shifted = true;
    }
    for (let i = 0; i < n; i++) {
      const l = LIMBS[i], g = st.grips[i], R = Rs[i], rc = hold(i, Gp);
      st.hand[i].y = rc; st.hand[i].z = 0; st.hand[i].w = 0;
      if (shifted) {
        st.hand[i].x *= 1 - SHIFT_LOOSE * sstep(0, SHIFT_OVER, st.shift[i]);
        // (a neighbour's shifted hold moves the cable's dip under this hand by centimetres: never past the reach)
        const D0 = Gp.distanceTo(R), reach = limbReach(l); if (D0 > reach) Gp.sub(R).multiplyScalar(reach / D0).add(R);
      }
      // (for the limbs' program: how the rope's sink changes along the hand, for the fingers that close round
      // it, and the share of the land's fall the hand has taken with the rope, for the limb's light)
      if (rope && (Sv.x !== 0 || Sv.y !== 0 || Sv.z !== 0)) {
        st.hand[i].w = rope.share(g.x);
        st.hand[i].z = (rope.seat(g.x + 0.75, Sv).dot(downV) - rope.seat(g.x - 0.75, Sw).dot(downV)) / 1.5;
      }
      // three joints in one plane: two equal legs and a span between the knees
      e1.subVectors(Gp, R); const D = e1.length(); e1.multiplyScalar(1 / D);
      B.set(l.bx, l.by, 0).addScaledVector(e1, -(l.bx * e1.x + l.by * e1.y)).normalize();
      const l1 = l.a * l.L, l2 = (1 - 2 * l.a) * l.L, ct = clamp((D - l2) / (2 * l1), -0.92, KNEE_STRAIGHT), sT = Math.sqrt(1 - ct * ct);
      const J = st.J, o = i * 4;
      J[o].copy(R); J[o + 3].copy(Gp);
      J[o + 1].copy(R).addScaledVector(e1, ct * l1).addScaledVector(B, sT * l1);
      J[o + 2].copy(Gp).addScaledVector(e1, -ct * l1).addScaledVector(B, sT * l1);
      st.LN[i].crossVectors(e1, B).normalize();
    }
    return st;
  };
  return st;
}

// ---------------------------------------------------------------- beards, the fringe of seed-hair, the new strand
// position: the root on the hide (body space).  aHr: q 0..1 along, side, length (m), phase.
// aHk: half width at the root (m), kind (0 beard, 1 fringe, 2 the new strand), -, -.   aDir: outward at the root.
const HAIR_VERT = /* glsl */`
attribute vec4 aHr, aHk; attribute vec3 aDir;
uniform vec3 uSway, uDown, uStrandEnd;
uniform float uFol, uStrandFol;  // (mend U, U1) the creature's own share of the land's fall; (mend V) the share the rope has taken where the new strand is made fast
varying vec3 vW; varying vec4 vR; varying vec2 vA; varying float vFol;
${CM_GLSL}
${CM_RIBBON}
vec3 swayP(vec3 p){ float c = cos(uSway.x), s = sin(uSway.x); return vec3(p.x*c - p.y*s, p.x*s + p.y*c + uSway.y, p.z); }
vec3 hairPoint(float q){
  float L = aHr.z, ph = aHr.w;
  if (aHk.y > 1.5) {                       // the new strand: from the tail to the point of the cable it was fixed to
    vec3 a = swayP(position), b = uStrandEnd;
    return mix(a, b, q) + uDown*(0.17*length(b - a))*sin(3.14159*q) + vec3(1.0, 0.0, 0.0)*1.2*sin(uTime*0.7 + q*9.0)*sin(3.14159*q);
  }
  vec3 root = swayP(position);
  // the wind comes up the cable past the body in gusts about 60 m long: all the hair it reaches streams back
  // together, and each hair flutters a little in its own time
  float gust = 0.5 + 0.5*sin(uTime*0.9 + position.z*0.1 + position.x*0.04 + 1.7*sin(uTime*0.23 + position.z*0.021));
  vec3 back = vec3(0.25*sin(uTime*0.31 + position.z*0.05), 0.0, 1.0);
  // fringe: out from the hide, drooping, streaming back
  if (aHk.y > 0.5)
    return root + aDir*L*q*(1.0 - 0.45*q) + uDown*L*0.45*q*q + back*L*q*q*(0.2 + 0.5*gust) + aDir*0.06*L*q*sin(uTime*3.3 + ph*40.0 + q*4.0);
  // a beard: it hangs, streams back down the cable in the gusts, and sways from its root
  vec3 w = vec3(sin(uTime*0.6 + ph*30.0 + q*2.6), 0.0, 0.6*sin(uTime*0.47 + ph*17.0 + q*3.4))*L*0.05*q*q;
  return root + aDir*L*0.07*sin(3.14159*min(q*1.5, 1.0)) + uDown*L*q*(1.0 - 0.22*q) + back*L*q*q*(0.26 + 0.3*gust) + w;
}
void main(){
  float q = aHr.x;
  vec3 c = hairPoint(q), c2 = hairPoint(min(q + 0.03, 1.03));
  vec3 cw = (modelMatrix*vec4(c, 1.0)).xyz, tw = mat3(modelMatrix)*(c2 - c);
  float taper = aHk.y > 1.5 ? 1.0 : (1.0 - 0.8*q);
  float k; vec4 mv = cmRibbon(cw, tw/max(length(tw), 1e-4), aHr.y, aHk.x*taper, k);
  // (vA.y: how much of the sun's bearing lies across the ribbon, toward its +1 edge: for the shade on a strand)
  vec3 tvv = mat3(viewMatrix)*(tw/max(length(tw), 1e-4)), sdv = cross(tvv, (viewMatrix*vec4(cw, 1.0)).xyz);
  vW = cw; vR = vec4(aHr.y, q, aHr.w, aHk.y); vA = vec2(k, dot(sdv/max(length(sdv), 1e-5), mat3(viewMatrix)*uSunDir));
  // (mend V) the share of the land's fall this point takes: the creature's own; and along the new strand, whose
  // far end goes down with the rope it is made fast to, that end's share by the point's place along the strand
  vFol = uFol + (aHk.y > 1.5 ? uStrandFol*clamp(q, 0.0, 1.0) : 0.0);
  gl_Position = projectionMatrix*mv;
}`;
const HAIR_FRAG = /* glsl */`
#define CM_FOLLOW vFol
varying float vFol;              // (mend U, U1; mend V) the share of the land's fall this point takes: said in HAIR_VERT
uniform vec3 uFelt, uNetCol;
varying vec3 vW; varying vec4 vR; varying vec2 vA;
${CM_GLSL}
void main(){
  float s = abs(vR.x), q = clamp(vR.y, 0.0, 1.0), kind = vR.w, fw = fwidth(vR.x) + 1e-4;
  vec3 v = normalize(cameraPosition - vW);
  float toward = clamp(dot(-v, uSunDir)*0.5 + 0.5, 0.0, 1.0);
  vec3 col; float al;
  if (kind > 1.5) {
    float e = 1.0 - smoothstep(max(1.0 - fw*1.5, 0.0), 1.0, s);
    float g = pow(clamp(0.5 + 0.5*sin(q*90.0 - uTime*2.2), 0.0, 1.0), 10.0);
    // the new strand is wet: dull where the sun is not on it, beaded every half metre, glints running down it.
    // (mend R, V1: IT IS A THREAD OF THE WEB AND GOES BY THE THREAD'S ONE LAW OF LIGHT (the common part). It
    // had a brightness of its own that no light gave it, up to four times its colour: by day a white-hot wire
    // from the climber's tail to the cable, in the dusk and the night the same. Now what it has without the
    // sun is the fill's, what it catches is the sun's at its own height, and it is never brighter than the
    // lit rope beside it. Its beads go to their mean under the pixel's footprint, three tenths of their light.)
    float bw = fwidth(q*150.0), bd = mix(1.0 - smoothstep(0.1, 0.2, abs(fract(q*150.0) - 0.5)), 0.3, smoothstep(0.3, 1.0, bw));
    float hT = vW.y + (CM_FOLLOW)*cmDrop(vW.xz), sunY = cmThreadSun(hT);
    col = cmThreadCap(uNetCol*(cmThreadDull(hT) + sunY*(0.3*toward*toward + 2.2*g*(0.3 + 0.7*toward) + 0.9*bd*(0.4 + 0.6*toward))), hT); al = e*clamp(vA.x, 0.0, 1.0);
  } else {
    // many hairs in one ribbon: streaks of thread with gaps, thinning to the tip; a nearer lock of strands lies
    // over a farther one that is dimmer and shows in the gaps (strands in front of strands)
    float strand = cmN(vec2(vR.x*8.0 + vR.z*60.0, q*1.5)), fine = cmN(vec2(vR.x*31.0 + vR.z*23.0, q*5.0));
    float body = smoothstep(0.36, 0.66, 0.55*strand + 0.45*fine + 0.2*(1.0 - s));
    float behind = smoothstep(0.34, 0.6, 0.6*cmN(vec2(vR.x*11.0 + vR.z*37.0 + 7.0, q*1.1 + 3.0)) + 0.4*fine + 0.15*(1.0 - s));
    float cover = body + (1.0 - body)*0.7*behind, front = body/max(cover, 1e-3);
    al = cover*(1.0 - smoothstep(0.6, 1.0, s))*(1.0 - 0.75*q*q)*clamp(vA.x, 0.0, 1.0)*(kind > 0.5 ? 0.8 : 0.92);
    // each lock is round: lit on its side toward the sun, in shade on the side away from it (vA.y)
    float slope = cmN(vec2((vR.x + 0.05)*8.0 + vR.z*60.0, q*1.5)) - cmN(vec2((vR.x - 0.05)*8.0 + vR.z*60.0, q*1.5));
    float lit = clamp(0.66 + (0.26*vR.x - 1.6*slope)*vA.y, 0.3, 1.0);
    // pale thread, a little under white (never the sun's own white): its own colour in the fill and the sun,
    // and the sun through it from behind, most at the thin tips (the eye still finds the climber by it from far)
    float thru = toward*toward*(0.26 + 0.2*q);
    col = uFelt*(0.55 + 0.45*fine)*mix(0.55, 1.0, front)*(cmAmb(vec3(0.0, 0.2, 0.0))*0.62*(0.6 + 0.4*lit) + cmSunL*(0.05 + 0.2*lit + thru));
    col *= 1.0/(1.0 + 0.6*max(dot(col, vec3(0.3, 0.5, 0.2)) - 0.6, 0.0));
  }
  col = cmAir(col, vW);
  gl_FragColor = vec4(col*al, al);
}`;

// ---------------------------------------------------------------- the striped fliers
// aP0: a point of the hide they haunt (body space) + phase.  aP1: outward there + radius of their round.
// position: the flier's own shape (x right, y up, z forward); color.r: 1 on a wing; color.g: wing side
const FLY_VERT = /* glsl */`
attribute vec4 aP0, aP1; attribute vec3 aCol;
uniform vec3 uSway;
varying vec3 vW, vN; varying vec3 vK; varying vec3 vLoc;
${CM_GLSL}
vec3 swayP(vec3 p){ float c = cos(uSway.x), s = sin(uSway.x); return vec3(p.x*c - p.y*s, p.x*s + p.y*c + uSway.y, p.z); }
vec3 flyAt(float t, out float settle){
  float ph = aP0.w, sp = 0.5 + 0.5*fract(ph*7.3), R = aP1.w;
  // now and then it comes in and sits on the hide
  settle = smoothstep(0.5, 0.8, sin(t*0.21*sp + ph*40.0));
  float a = t*sp*1.1 + ph*6.2831853;
  vec3 n = normalize(aP1.xyz), up = vec3(0.0, 1.0, 0.0), tz = vec3(0.0, 0.0, 1.0);
  vec3 ty = up - n*dot(up, n); ty /= max(length(ty), 1e-3);
  float out_ = mix(2.5 + 1.8*sin(a*2.3 + ph*9.0) + 0.5*R, 0.35, settle);
  vec3 p = aP0.xyz + n*out_ + (tz*cos(a)*1.4 + ty*sin(a*1.0 + 1.0*sin(a*0.5)))*R*(1.0 - 0.9*settle);
  return p;
}
void main(){
  float st, st2;
  vec3 c = flyAt(uTime, st), c2 = flyAt(uTime + 0.06, st2);
  vec3 fwd = c2 - c; float fl = length(fwd);
  fwd = fl > 1e-4 ? fwd/fl : vec3(0.0, 0.0, -1.0);
  fwd = mix(fwd, vec3(0.0, 0.0, -1.0), st*0.9); fwd /= max(length(fwd), 1e-3);
  vec3 n = normalize(aP1.xyz);
  vec3 rt = cross(fwd, n); rt /= max(length(rt), 1e-3);
  vec3 upv = cross(rt, fwd);
  vec3 p = position;
  // wings beat (a blur of amber), and fold when it sits
  if (aCol.x > 0.5) { float beat = sin(uTime*34.0 + aP0.w*90.0)*(1.0 - st)*0.9 + 0.5*st; float cb = cos(beat), sb = sin(beat)*aCol.y; p = vec3(p.x*cb, p.y + abs(p.x)*sb*aCol.y, p.z); }
  vec3 b = swayP(c + rt*p.x + upv*p.y + fwd*p.z);
  vec4 w = modelMatrix*vec4(b, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix)*(rt*normal.x + upv*normal.y + fwd*normal.z)); vK = aCol; vLoc = position;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const FLY_FRAG = /* glsl */`
#define CM_FOLLOW 0.0            // (mend U, U1) the fliers are the hero's alone, and the hero keeps its height: none of the land's fall
varying vec3 vW, vN; varying vec3 vK; varying vec3 vLoc;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW), n = normalize(vN);
  float toward = clamp(dot(-v, uSunDir)*0.5 + 0.5, 0.0, 1.0);
  vec3 col;
  // wings: amber, lit through
  if (vK.x > 0.5) {
    // a film with dark veins: every other point of it lets the world through
    float vein = step(0.8, fract(vLoc.x*2.6 + vLoc.z*0.7)) + step(0.86, fract(vLoc.z*3.1));
    if (vein < 0.5 && mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 0.5) discard;
    col = mix(vec3(0.62, 0.38, 0.1), vec3(0.08, 0.05, 0.02), min(vein, 1.0))*(cmAmb(n)*0.3 + cmSunL*(0.06 + 0.3*toward*toward));
  }
  else {
    // (the abdomen is behind the waist, at negative z of the shape: banded dark and amber)
    float stripe = step(0.6, fract(vLoc.z*2.6 + 0.2));
    vec3 alb = mix(vec3(0.03, 0.026, 0.022), vec3(0.6, 0.34, 0.06), stripe*step(vLoc.z, -0.06));
    col = alb*(cmSunL*clamp(dot(n, uSunDir)*0.7 + 0.3, 0.0, 1.0)*0.5 + cmAmb(n)*0.8);
  }
  col = cmAir(col, vW);
  gl_FragColor = vec4(col, 1.0);
}`;
function flyShape() {
  const G = new Geo({ aCol: 3 });
  // the body, 1.7 m long, six round, from the head back: head, thorax, a narrow waist, a fat banded abdomen
  const NS = 6, K = 1.1, prof = [[0, -0.76], [0.1, -0.68], [0.15, -0.56], [0.19, -0.3], [0.07, -0.08], [0.26, 0.2], [0.2, 0.56], [0, 0.78]].map(([r, z]) => [r * K, z * K]), base = G.count;
  G.set('aCol', 0, 0, 0);
  for (let j = 0; j < prof.length; j++) for (let k = 0; k <= NS; k++) { const th = (k / NS) * TAU; G.v(Math.cos(th) * prof[j][0], Math.sin(th) * prof[j][0], -prof[j][1], Math.cos(th), Math.sin(th), 0); }
  G.stitch(base, prof.length, NS, true);
  // two pairs of narrow wings
  for (const sd of [-1, 1]) for (const [z0, len, wid] of [[-0.5, 1.9, 0.5], [-0.05, 1.4, 0.36]]) {
    G.set('aCol', 1, sd, 0);
    const a = G.v(sd * 0.2, 0.2, z0, 0, 1, 0), b = G.v(sd * len, 0.34, z0 + 0.42, 0, 1, 0), c = G.v(sd * len * 0.85, 0.34, z0 + 0.42 + wid, 0, 1, 0), d = G.v(sd * 0.2, 0.2, z0 + wid * 0.7, 0, 1, 0);
    G.quad(a, b, c, d);
  }
  return G;
}

// ---------------------------------------------------------------- the hero
// opts: { shared (the world's uniforms; without it the piece lights itself for the viewer), pods, clear, flies, phase }
// (T4's measure) the greatest distance from a boss to its nearest neighbour, in breadths of the body where it stands
const loneMost = (sacs) => sacs.reduce((m, a) => Math.max(m, sacs.reduce((d, b) => (b === a ? d : Math.min(d, a.c.distanceTo(b.c))), Infinity) / a.wide), 0);
// the dress of the kind: the hide's, the limbs' and the hair's own colours
const dress = () => ({ uBark: { value: C('#8A9478') }, uBarkD: { value: C('#3A4033') }, uMoss: { value: C('#4A6632') }, uLichen: { value: C('#A9AD7E') }, uFelt: { value: C('#B4C2B0') },
  uSac: { value: C('#A9C58A') }, uPodAmber: { value: C('#BEDD9C') }, uPodDark: { value: C('#3A2A1C') }, uSkin: { value: C('#2F5A2A') }, uNetCol: { value: C('#D8ECD0', 1.2) } });
export async function buildHero(ctx, opts = {}) {
  const viewer = !opts.shared;
  const shared = opts.shared || makeShared({ sunAz: -124, sunEl: 44, sunCol: '#ffb070', sunI: 2.6 });
  const U = shared.U, noise = ctx.noise, CABLE = shared.cable;
  // the visit's own pace (see GAIT): the world hands over its gait clock; alone in the viewer the mean one serves
  const gClock = opts.clock || gaitClock;
  // its streams of chance, one to a kind of thing (the world hands them over; alone in the viewer it takes its own)
  const fk = opts.forks || {}, fork = (k) => cmStream(shared, fk[k], k, ctx, viewer);
  const phaseR = fork('phase'), sacsR = fork('sacs'), podsR = fork('pods'), limbsR = fork('limbs'), beardsR = fork('beards'), feltR = fork('felt'), fliersR = fork('fliers');
  if (viewer) { U.uHemiSky.value.set(0.5, 0.45, 0.55); U.uHemiGnd.value.set(0.18, 0.15, 0.2); U.uFogCol.value.set(0.87, 0.35, 0.16); U.uFog.value.set(0.0005, 0.0005, 4000, 200); }
  // the gait's own deal: where the round stands at the start of the flight, then where the sway and the bob stand
  // (stream 'phase'); and each limb's gap and the length of its swing (stream 'gait')
  const gaitR = fork('gait'), phase0 = opts.phase ?? phaseR(), gaitDeal = { sway: [phaseR(), phaseR(), phaseR()], gap: LIMBS.map(() => gaitR.range(-1, 1)), swing: LIMBS.map(() => gaitR.range(0.8, 1.25)) };
  // (mend V, V1) THE ROPE UNDER ITS HANDS, AS IT IS DRAWN, in the climber's own frame (x: the frame's X, y: its
  // normal, -z: up the cable): the frame's own offset() and sunk() (the common part: the cable's mesh is built
  // from the same stations, course and share), read with the land's fall as it stands this frame. The rope's
  // girth and the metre its dip is read at are the mesh's own under the foot too.
  const sv = new THREE.Vector3(), downF = new THREE.Vector3(0, -CABLE_N.y, CABLE_D.y).normalize();
  const rope = { seat: (s, out) => { CABLE.offset(s, shared.drop, sv); return out.set(sv.dot(CABLE.X), sv.dot(CABLE.n), -sv.dot(CABLE.d)); },
    share: (s) => { CABLE.course(s, sv); const d = shared.drop(sv.x, sv.z); return d > 1e-6 ? CABLE.sunk(s, shared.drop) / d : 0; } };
  const shape = bodyShape(noise, 0), gait = makeGait(shape, phase0, { ...gaitDeal, rope, down: downF, radius: (s) => CABLE.girth(clamp(s, -30, CABLE_L)), dip: (s, G) => cableDip(Math.max(s, 0), G) });
  const group = new THREE.Group(); group.name = 'climber'; group.matrixAutoUpdate = false;
  const sway = new THREE.Vector3(), rot = new THREE.Matrix3().set(CABLE.X.x, CABLE.n.x, -CABLE.d.x, CABLE.X.y, CABLE.n.y, -CABLE.d.y, CABLE.X.z, CABLE.n.z, -CABLE.d.z);
  const cols = dress();
  const hide = { p: new THREE.Vector3(), n: new THREE.Vector3(), down: new THREE.Vector3() };

  // ---- the soft mesh: body, sacs, pods
  const S = softGeo();
  pushBody(S, shape, 100, 80, (v, th, fold) => { S.set('aB', 0, 0, th, fold); S.set('aC', BODY.a * Math.max(shape.prof(v), 0), 0, 0); S.set('aAx', 0, 0, 1); });
  await ctx.yield();
  const sacs = [];
  // nine to a flank, but never in a row: they crowd in threes where the gourd necks in, big and small, half sunk
  // in the folds. THE BUD'S OWN RULE (every seed): the leading end of the body is the growing bud, whose young
  // hide bears no bladder. The bud is the body's own form: from BUD_AT = 0.75 of its length on, its girth has
  // fallen under 0.64 of its greatest (the profile's own key in bodyShape). So the crowds are dealt at the three
  // necks behind it (0.07, 0.31 and 0.54 of the length; the rearmost crowd a little ahead of its neck, as said
  // below) and NONE at the foremost neck, which is the bud's; no
  // bladder is dealt and then left out, and none holds room it does not fill. Toward the bud the bladders are
  // the younger and the smaller: from 0.4 of the length one is made smaller, down to 0.55 of its dealt size at
  // FORE_AT = 0.66. G2: BOSSES STAND IN GROUPS, three to a crowd at a neck on one flank. (round Q, T4: it is so
  // BY THE WAY A PLACE IS DEALT, on every deal. A boss stands within CROWD = 0.07 of the body's length (15.4 m)
  // of its crowd's neck along the body, and within the crowd's 0.95 radians round it: so the others of its crowd
  // are never farther from it than 49 m, which is under ONE BREADTH OF THE BODY at every neck (56, 80 and 69 m).
  // Before, a place was only held at or behind FORE_AT, and one far draw stood alone at 0.66. The foremost
  // crowd's neck is at 0.552, so no boss is ahead of 0.622: the forward third bears none, with nothing held
  // back. loneMost (facts.bud) is the measure: the greatest distance from a boss to its nearest neighbour, in
  // breadths of the body there.)
  // (mend R, X4: THE REARMOST CROWDS HAVE THE SAME ROOM AS THE OTHERS. No boss stands behind SAC_FLOOR = 0.08 of
  // the length, where the tail closes; the rearmost necks lie at 0.064 and 0.086, so a crowd's middle is its
  // neck, or CROWD ahead of the floor where the neck lies nearer the floor than that (0.15: both rearmost
  // crowds): every crowd has its whole 2 x CROWD of the length to stand in. Round Q held the floor by moving
  // every draw behind it ONTO it: two draws in three of the first flank's rear crowd stood on one ring, 0.054
  // of the length was all its room, and on 8 visits in 1,000 the three found none and spent every boss's tries.)
  // (no two bladders' domes stand within 3 m of each other: two pale domes side by side lean toward a pair of
  // eyes. A boss deals its place and size anew until it has room: its tries are its own, 400 at most. TO THE
  // LETTER A BOSS CAN STILL GIVE UP after its 400 and a visit then has one fewer; it never does on the first
  // 1,000 visits: every one has its 18, and no boss took more than 66 tries.)
  const SAC_FLOOR = 0.08;
  for (let sd = 0; sd < 2; sd++) for (let j = 0, sacTries = 0; j < 9; j++) {
    const neck = (Math.floor(j / 3) + 0.32) / 4.3 + (sd ? 0.012 : -0.01), v = Math.max(neck, SAC_FLOOR + CROWD) + clamp(sacsR.gauss() * 0.035, -CROWD, CROWD), dth = sacsR.range(-0.55, 0.4), th = sd ? Math.PI - dth : dth;
    hideAt(shape, v, th, hide);
    // a bladder IN the hide: its middle lies under the skin, only a low dome of it stands out
    const r = sacsR.range(4.0, 7.5) * (0.75 + 0.5 * sacsR()), sink = r * sacsR.range(0.5, 0.72), c = hide.p.clone().addScaledVector(hide.n, -sink);
    if (sacs.some((q) => q.c.distanceTo(c) < (q.r + r) * 0.87 + 3)) { if (++sacTries < 400) j--; else sacTries = 0; continue; }
    sacTries = 0;
    const yg = 1 - 0.45 * sstep(0.4, FORE_AT, v), ph = sacsR();
    sacs.push({ c, r, wide: 2 * BODY.a * Math.max(shape.prof(v), 0) });
    pushBlob(S, hide.p.clone().addScaledVector(hide.n, -sink * yg), hide.n.clone(), hide.down, r * yg * 0.92, r * yg, 1, ph, 14, 9, 1, sink * yg);
  }
  await ctx.yield();
  // pods on the left flank, above the sacs: dark seeds and clear urns
  const NP = opts.pods ?? 23, NC = Math.min(opts.clear ?? 9, NP), pods = [], tmp = new THREE.Vector3(), ax = new THREE.Vector3();
  for (let i = 0, tries = 0; i < NP && tries < 4000; tries++) {
    if (tries % 100 === 99) await ctx.yield();
    const v = podsR.range(0.27, 0.76), th = Math.PI - podsR.range(0.36, 0.9);
    hideAt(shape, v, th, hide);
    // a vessel hung ON the hide: it stands a hand clear of it on its pad of gum (never sunk in it); no pod within
    // 6.5 m of another, and no clear pod within 11 m of another clear one (never two side by side)
    const c = hide.p.clone().addScaledVector(hide.n, i < NC ? 1.2 : 0.85);
    if (pods.some((p) => p.c.distanceTo(c) < (i < NC && p.clear ? 11 : 6.5))) continue;
    // it lies along the flank, hanging down the hide askew
    tmp.crossVectors(hide.n, hide.down).normalize(); ax.copy(hide.down).addScaledVector(tmp, podsR.range(-0.8, 0.8)).normalize();
    pods.push({ c, n: hide.n.clone(), ax: ax.clone(), clear: i < NC, phase: podsR(), p: hide.p.clone() }); i++;
  }
  podsR.shuffle(pods);
  await ctx.yield();
  for (const p of pods) {
    tmp.crossVectors(p.n, p.ax).normalize();
    // a long spindle; and under it, on the hide, its pad of dark gum, as long as the pod: the pod's own shade
    pushBlob(S, p.c, p.ax, tmp, p.clear ? 2.7 : 1.6, p.clear ? 0.85 : 0.62, p.clear ? 3 : 2, p.phase, 16, 12);
    pushBlob(S, p.p.clone().addScaledVector(p.n, 0.1), p.n, p.ax, 0.4, p.clear ? 0.95 : 0.7, 4, p.phase, 12, 5, p.clear ? 2.6 : 2.1);
  }
  // (mend U, U1; made true in mend V) uFol 0: the hero's BODY hangs on our cable above the stretch that sinks
  // with the land (its place is CABLE.at, which takes no fall; its tail is 140 m and more up the cable, and the
  // cable takes none of the fall past its 105th metre), so no point of the body, its hair or its fliers takes
  // any of the land's fall. ITS HINDMOST HANDS ARE NOT ABOVE THAT STRETCH: the hindmost limb holds the cable
  // from under its foot to its 143rd metre and the next from about its 40th on, and those hands take the
  // cable's share at their grip (the gait's hold); a limb's points name that share to the light along the
  // limb (LIMB_VERT's vFol), and the new strand's far end, made fast at the cable's 46th metre, likewise
  // (HAIR_VERT's vFol).
  const fol = { value: 0 };
  const softU = withShared(U, { uSway: { value: sway }, uRot: { value: rot }, uFol: fol, ...cols });
  const soft = new THREE.Mesh(bound(S.geometry(), 0, -60, 0, 300), new THREE.ShaderMaterial({ uniforms: softU, vertexShader: SOFT_VERT, fragmentShader: SOFT_FRAG, side: THREE.DoubleSide, fog: false }));
  soft.name = 'climber-body'; group.add(soft);
  await ctx.yield();

  // ---- limbs and hands
  const LG = makeLimbGeometry(noise, limbsR);
  const limbU = withShared(U, { uJ: { value: gait.J }, uLN: { value: gait.LN }, uHand: { value: gait.hand }, uDown: { value: new THREE.Vector3(0, -CABLE_N.y, CABLE_D.y).normalize() }, uFol: fol, ...cols });
  const limbs = new THREE.Mesh(bound(LG.geometry(), 0, -20, 0, 320), new THREE.ShaderMaterial({ uniforms: limbU, vertexShader: LIMB_VERT, fragmentShader: LIMB_FRAG, side: THREE.DoubleSide, fog: false }));
  limbs.name = 'climber-limbs'; group.add(limbs);
  await ctx.yield();

  // ---- beards, fringe, the new strand
  const H = new Geo({ aHr: 4, aHk: 4, aDir: 3 }), down = new THREE.Vector3(0, -CABLE_N.y, CABLE_D.y).normalize();
  const tuft = (rng, root, dir, len, hw, kind, seg) => {
    const base = H.count, ph = rng();
    for (let i = 0; i <= seg; i++) for (const sd of [-1, 1]) { H.set('aHr', i / seg, sd, len, ph); H.set('aHk', hw, kind, 0, 0); H.set('aDir', dir.x, dir.y, dir.z); H.v(root.x, root.y, root.z); }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; H.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  for (let i = 0; i < 80; i++) {                      // beards, 30 to 50 m, from the lower flanks and the belly
    const v = beardsR.range(0.05, 0.92), th = Math.PI * 1.5 + beardsR.range(-1.3, 1.3);
    hideAt(shape, v, th, hide); tuft(beardsR, hide.p.clone().addScaledVector(hide.n, -0.3), hide.n, beardsR.range(30, 50) * (0.6 + 0.4 * shape.prof(v)), beardsR.range(2.2, 4.6), 0, 14);
  }
  for (let i = 0; i < 1300; i++) {                    // a felt of seed-hair over the flanks and belly
    const v = feltR.range(0.02, 0.97), th = Math.PI * 1.5 + clamp(feltR.gauss() * 0.9, -1.25, 1.25);
    hideAt(shape, v, th, hide); tuft(feltR, hide.p.clone().addScaledVector(hide.n, -0.2), hide.n, feltR.range(3, 9), feltR.range(1.0, 2.2), 1, 3);
    if (i % 100 === 99) await ctx.yield();
  }
  const tail = shape.point(0.012, -Math.PI / 2), tailP = new THREE.Vector3(tail.x, tail.y - 2, tail.z);
  tuft(feltR, tailP, down, 1, 0.16, 2, 40);
  const strandEnd = new THREE.Vector3(), strandS = opts.strandS ?? 46;       // where the new strand was fixed to the cable
  const strandFol = { value: 0 };
  const hairU = withShared(U, { uSway: { value: sway }, uDown: { value: down }, uStrandEnd: { value: strandEnd }, uFol: fol, uStrandFol: strandFol, ...cols });
  const hair = new THREE.Mesh(bound(H.geometry(), 0, -70, 60, 420), new THREE.ShaderMaterial({ uniforms: hairU, vertexShader: HAIR_VERT, fragmentShader: HAIR_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  hair.name = 'climber-hair'; hair.renderOrder = 1; group.add(hair);
  await ctx.yield();

  // ---- the striped fliers that plague it
  const NFly = Math.round((opts.flies ?? 90)), fs = flyShape(), fg = new THREE.InstancedBufferGeometry(); fg.instanceCount = NFly;
  { const g0 = fs.geometry(); fg.setAttribute('position', g0.getAttribute('position')); fg.setAttribute('normal', g0.getAttribute('normal')); fg.setAttribute('aCol', g0.getAttribute('aCol')); fg.setIndex(g0.getIndex()); }
  const p0 = new Float32Array(NFly * 4), p1 = new Float32Array(NFly * 4);
  for (let i = 0; i < NFly; i++) {
    const v = fliersR.range(0.15, 0.86), th = fliersR() < 0.8 ? Math.PI - fliersR.range(-0.45, 0.95) : fliersR.range(-0.4, 0.9);
    hideAt(shape, v, th, hide); p0.set([hide.p.x, hide.p.y, hide.p.z, fliersR()], i * 4); p1.set([hide.n.x, hide.n.y, hide.n.z, fliersR.range(2.5, 8.5)], i * 4);
  }
  fg.setAttribute('aP0', new THREE.InstancedBufferAttribute(p0, 4)); fg.setAttribute('aP1', new THREE.InstancedBufferAttribute(p1, 4));
  bound(fg, 0, -70, 0, 300);
  const flies = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: withShared(U, { uSway: { value: sway } }), vertexShader: FLY_VERT, fragmentShader: FLY_FRAG, side: THREE.DoubleSide, fog: false }));
  flies.name = 'climber-fliers'; group.add(flies);

  // ---- the piece as the viewer wants it: with a stretch of its cable
  const root = new THREE.Group(); root.name = 'climber-root'; root.add(group);
  if (viewer) { const cab = makeCables(ctx, shared, { quiet: true, peaks: [{ x: 0, z: -400, h: 95, r: 180, p: 1.6 }], grips: gait.grips, strandS }); root.add(cab.object); }

  const inv = new THREE.Matrix4(), cw = new THREE.Vector3(), size = new THREE.Vector2(), jw = new THREE.Vector3();
  const place = (go) => {
    gait.solve(gClock(go));
    CABLE.matrix(gait.sBody, group.matrix); group.matrixWorldNeedsUpdate = true;
    sway.set(gait.sway, gait.bob, 0);
    strandEnd.set(0, cableDip(strandS, gait.grips) - CABLE.radius(strandS) * 0.8, gait.sBody - strandS);
    // (mend V, V1) the new strand is made fast to the cable WHERE THE CABLE IS DRAWN (three turns of it are wound
    // there on the cable's mesh, the web part): its far end goes down with the rope, and names its share to the light
    strandEnd.add(rope.seat(strandS, jw)); strandFol.value = rope.share(strandS);
  };
  place(0);
  const centerS = GAIT.s0 + 45;
  return {
    object: root, group, gait, gaitDeal, grips: gait.grips, pods, sacs, budAt: BUD_AT, shape, strandS, loneMost: loneMost(sacs),
    radius: 150, height: 120, center: CABLE.at(centerS, 0, -62), ground: false,
    anchors: { bodyCentre: (go, out = new THREE.Vector3()) => CABLE.at(GAIT.s0 + GAIT.speed * gClock(go), 0, BODY.cy, out) },
    triangles: S.triangles + LG.triangles + H.triangles + NFly * fs.triangles,
    // a point of the body (body space x, y, z) in the world when we have flown `go` metres
    worldOf(go, x, y, z, out = new THREE.Vector3()) { return CABLE.at(GAIT.s0 + GAIT.speed * gClock(go) - z, x, y, out); },
    // how the point p (world) stands to the body when we have flown `go` metres: metres from the nearest point of
    // its hide, and the body's own thickness (its greatest width) at that point of its length
    flank(go, p) {
      const q = CABLE.coords(p, jw), sB = GAIT.s0 + GAIT.speed * gClock(go), px = q.y, pm = q.z, pz = sB - q.x; let best = Infinity, thick = 0;
      for (let j = 0; j <= 44; j++) for (let k = 0; k < 16; k++) {
        const v = j / 44, h = shape.point(v, (k / 16) * TAU), d = Math.hypot(h.x - px, h.y - pm, h.z - pz);
        if (d < best) { best = d; thick = 2 * BODY.a * Math.max(shape.prof(v), 0); }
      }
      return { gap: best, thick };
    },
    // the nearest the point p (world) comes to any limb when we have flown `go` metres (metres from the limb's surface)
    // (mend V: the limbs stand as the land's fall has them NOW: the caller sets the land's bend for `go` first)
    limbClearance(go, p) {
      gait.solve(gClock(go)); let best = Infinity;
      for (let i = 0; i < 7; i++) for (let k = 0; k < 3; k++) {
        const a = gait.J[i * 4 + k], b = gait.J[i * 4 + k + 1];
        const A = CABLE.at(gait.sBody - a.z, a.x, a.y, jw), ax2 = A.x, ay2 = A.y, az2 = A.z, Bw = CABLE.at(gait.sBody - b.z, b.x, b.y, jw);
        const dx = Bw.x - ax2, dy = Bw.y - ay2, dz = Bw.z - az2, l2 = dx * dx + dy * dy + dz * dz;
        const t = clamp(((p.x - ax2) * dx + (p.y - ay2) * dy + (p.z - az2) * dz) / l2, 0, 1);
        best = Math.min(best, Math.hypot(p.x - ax2 - dx * t, p.y - ay2 - dy * t, p.z - az2 - dz * t) - 4.5 * LIMBS[i].thick);
      }
      // and the six fingers under each hand: letting go or hooking on they open to 2.5 times the cable's radius
      // and sweep round its flank, so each hand counts as a ball of that radius about the cable's middle where
      // it holds, and about the hand itself while it is lifted
      for (let i = 0; i < 7; i++) {
        const s = gait.grips[i].x, rf = 2.5 * cableRadius(clamp(s, 0, CABLE_L)), h = gait.J[i * 4 + 3];
        CABLE.at(s, 0, 0, jw).add(CABLE.offset(s, shared.drop, cw)); best = Math.min(best, Math.hypot(p.x - jw.x, p.y - jw.y, p.z - jw.z) - rf);
        CABLE.at(gait.sBody - h.z, h.x, h.y, jw); best = Math.min(best, Math.hypot(p.x - jw.x, p.y - jw.y, p.z - jw.z) - rf);
      }
      return best;
    },
    // go: metres of the route flown (alone in the viewer, where there is no route, it walks on the clock)
    update(dt, time, camera, go) {
      place(go === undefined ? (time * 27) % 1300 : go);
      if (camera) {
        if (viewer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = 2 * Math.tan((camera.fov || 60) * Math.PI / 360) / Math.max(size.y, 1); U.uTime.value = time; }
      }
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------- the same creature far away: about 1.5k triangles
const FAR_VERT = /* glsl */`
attribute vec3 aE;                    // kind (0 body, 1 limb, 2 beard), q, phase
varying vec3 vW, vN, vNo, vE, vP;
${CM_GLSL}
void main(){
  vec3 p = position; vP = position;
  if (aE.x > 1.5) p += vec3(sin(uTime*0.6 + aE.z*30.0), 0.0, 0.5*sin(uTime*0.45 + aE.z*11.0))*4.0*aE.y*aE.y;
  if (aE.x > 0.5 && aE.x < 1.5) p += vec3(0.0, 1.0, 0.0)*1.5*sin(uTime*0.35 + aE.z*20.0)*sin(3.14159*aE.y);
  vec4 w = modelMatrix*vec4(p, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vNo = normal; vE = aE;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
// (mend U, U1) THE SHARE OF THE LAND'S FALL THE CREATURE'S PLACE TAKES (uFol; the common part's CM_FOLLOW): the light by
// a thing's own height reads vW.y + uFol * the land's fall there, which is the height the thing has before
// the land sinks under it. A creature on a rope or a far line takes the share its line takes at its place:
// its frame (o.frame) RETURNS that share from the line's own function (the web part's fall), the same one
// its place is ridden by, and update() writes it here: the two cannot part. The hero keeps its height: 0.
// (A creature is one stiff body: every point of it sinks by the fall its frame's origin takes, and its light
// adds the same share of the fall at the point's own place; over a body's length on a sunk line the two
// differ by a metre or two at the most, 0.01 of the air's thinning. At the origin they are the same.)
const FAR_FRAG = /* glsl */`
#define CM_FOLLOW uFol
uniform float uFol;
uniform vec3 uBark, uBarkD, uFelt, uMoss, uSac;
varying vec3 vW, vN, vNo, vE, vP;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW), n = normalize(vN);
  float up = normalize(vNo).y, shade = 1.0;
  vec3 alb;
  if (vE.x < 0.5) {
    // the hero's own dress, told in the body's own metres: bark in plates along the back with moss in the creases,
    // felt below, and the pale bladders sunk in the flanks, each in its dark rim
    float pl = cmF3(vP*0.07), cr = smoothstep(0.4, 0.6, cmN3(vP*vec3(0.2, 0.2, 0.045) + 3.0));
    vec3 bark = mix(uBarkD, uBark, 0.3 + 0.7*cr)*(0.7 + 0.6*pl);
    vec3 felt = mix(uFelt, uMoss, 0.6*smoothstep(0.35, 0.7, cmN3(vP*0.045 + 9.0)))*(0.8 + 0.4*pl);
    alb = mix(felt, bark, smoothstep(-0.2, 0.5, up));
    alb = mix(alb, uMoss*(0.7 + 0.6*pl), 0.6*smoothstep(0.48, 0.7, cmN3(vP*0.03 + 17.0))*smoothstep(-0.5, 0.3, up));
    vec3 cp = vP*0.05, ci = floor(cp), cf = fract(cp) - 0.5;
    float d = length(cf + 0.3*(vec3(cmH3(ci + 3.1), cmH3(ci + 7.7), cmH3(ci + 1.3)) - 0.5));
    float on = step(0.45, cmH3(ci))*(1.0 - smoothstep(0.25, 0.75, abs(up + 0.1)));
    alb = mix(alb, uBarkD*0.8, on*(1.0 - smoothstep(0.3, 0.4, d)));
    alb = mix(alb, mix(uSac, uMoss, 0.45)*(0.75 + 0.35*pl), on*(1.0 - smoothstep(0.2, 0.31, d)));
    shade = 0.62 + 0.38*smoothstep(0.25, 0.6, pl + 0.25*cr);
  } else if (vE.x < 1.5) {
    // woody limbs: bark in rings and knots, moss on their upper side
    float kn = cmN3(vP*vec3(0.25, 0.25, 0.25) + 5.0);
    alb = mix(mix(uBarkD, uBark, 0.45 + 0.55*kn), uMoss, 0.35*smoothstep(0.2, 0.8, n.y)*smoothstep(0.4, 0.6, cmN3(vP*0.11)));
    // (G3 e: in the plain cut the limbs wear the body's own moss and felt, so from far they are of the body's
    // colour and the body and its beard are seen first, not a dark tangle)
    alb = mix(alb, mix(uMoss, uFelt, 0.45), 0.55);
    shade = 0.75 + 0.25*kn;
  } else {
    // the beard: pale fibre, thinning to its tip
    alb = mix(uFelt, vec3(0.62, 0.64, 0.5), 0.6)*(0.8 + 0.3*cmH(floor(vec2(vE.z*91.0, vE.y*9.0))));
  }
  float ndl = dot(n, uSunDir), diff = clamp((ndl + 0.3)/1.3, 0.0, 1.0);
  // lit by the sun on one side and from below by the bright roof of the forest, as the climber beside us is: a far
  // climber is never a black shape, and never glossy (no rim, no shine)
  vec3 bounce = cmBounceL*vec3(0.42, 0.47, 0.3)*dot(uSunCol, vec3(0.33))*0.6*clamp(0.6 - 0.4*n.y, 0.0, 1.0);
  vec3 col = alb*shade*(cmSunL*cmLitL(ndl)*0.6 + cmAmb(n)*0.85 + bounce);
  // (a far climber keeps the hero's own green and its beard at every distance: it takes the air as the hill it
  // climbs from does, the roof's things' law, and no other)
  col = cmHaze(col, vW, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
// frame: (time, out Matrix4) => the share of the land's fall its place takes; sets the creature's frame each frame
// (origin on its cable over the body's middle, x right, y the cable's upward normal, -z the way it climbs)
export function makeFarClimber(ctx, shared, o = {}) {
  const noise = ctx.noise, rng = cmStream(shared, o.rng, 'far' + (o.key ?? 0), ctx), shape = bodyShape(noise, 3.7 + (o.key ?? 0) * 2.1), gait = makeGait(shape, rng());
  gait.solve(rng.range(0, 32));
  // (mend V) reachLimited: true if the rule of a limb's reach moved a hand of this pose (it should move none)
  const reachLimited = gait.shift.some((v) => v > 0);
  const G = new Geo({ aE: 3 }), NZ = 30, NA = 18;
  pushBody(G, shape, NZ, NA, () => G.set('aE', 0, 0, 0));
  // limbs: boughs bent through their joints (a curve through the four joints, never straight struts), swollen at
  // the knees and tapering to the hand
  const a = new THREE.Vector3(), b = new THREE.Vector3(), t = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3();
  const cr = (p0, p1, p2, p3, f, out) => { const f2 = f * f, f3 = f2 * f; for (const k of ['x', 'y', 'z']) out[k] = 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * f3); return out; };
  for (let i = 0; i < 7; i++) {
    const base = G.count, ph = rng(), NS = 6, off = i * 4, J = gait.J, SUB = 5; let rings = 0;
    for (let k = 0; k <= 3 * SUB; k++) {
      const sg = Math.min(2, Math.floor(k / SUB)), f = k / SUB - sg, q = k / (3 * SUB);
      const p0 = J[off + Math.max(0, sg - 1)], p1 = J[off + sg], p2 = J[off + sg + 1], p3 = J[off + Math.min(3, sg + 2)];
      cr(p0, p1, p2, p3, f, a); cr(p0, p1, p2, p3, f + 0.02, b);
      t.subVectors(b, a).normalize(); n1.copy(gait.LN[i]).addScaledVector(t, -gait.LN[i].dot(t)).normalize(); n2.crossVectors(t, n1);
      const knee = Math.exp(-Math.pow((q - 1 / 3) * 7, 2)) + Math.exp(-Math.pow((q - 2 / 3) * 7, 2));
      // (G3 e: seen from far a climber is a body and a beard before any limbs: the plain cut's limbs are slim)
      const r = lerp(2.6, 1.3, q) * LIMBS[i].thick * (1 + 0.35 * knee) * (0.9 + 0.2 * noise.n2(q * 9 + i * 3.3, ph * 7));
      G.set('aE', 1, q, ph);
      for (let s = 0; s <= NS; s++) { const an = (s / NS) * TAU, c = Math.cos(an), sn = Math.sin(an), ex = n1.x * c + n2.x * sn, ey = n1.y * c + n2.y * sn, ez = n1.z * c + n2.z * sn; G.v(a.x + ex * r, a.y + ey * r, a.z + ez * r, ex, ey, ez); }
      rings++;
    }
    G.stitch(base, rings, NS);
  }
  // beards: flat strips hanging
  const hide = { p: new THREE.Vector3(), n: new THREE.Vector3(), down: new THREE.Vector3() }, dn = new THREE.Vector3(0, -CABLE_N.y, CABLE_D.y).normalize();
  for (let i = 0; i < 26; i++) {
    hideAt(shape, rng.range(0.1, 0.9), Math.PI * 1.5 + rng.range(-1.1, 1.1), hide);
    const L = rng.range(30, 58), w = rng.range(2.4, 5.0), ph = rng(), base = G.count;
    for (let k = 0; k <= 4; k++) { const q = k / 4; G.set('aE', 2, q, ph); for (const sd of [-1, 1]) G.v(hide.p.x + dn.x * L * q + sd * w * (1 - 0.8 * q) * 0.5, hide.p.y + dn.y * L * q, hide.p.z + dn.z * L * q + 0.34 * L * q * q + sd * w * 0.3 * (1 - q), hide.n.x, hide.n.y, hide.n.z); }
    for (let k = 0; k < 4; k++) { const q0 = base + k * 2; G.i.push(q0, q0 + 1, q0 + 2, q0 + 1, q0 + 3, q0 + 2); }
  }
  const geo = G.geometry(); bound(geo, 0, -50, 0, 320);
  const own = { uBark: { value: C('#4E5444') }, uBarkD: { value: C('#2A2D24') }, uFelt: { value: C('#8C9A80') }, uMoss: { value: C('#44602E') }, uSac: { value: C('#A9B48A') }, uFol: { value: 0 } };
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: FAR_VERT, fragmentShader: FAR_FRAG, side: THREE.DoubleSide, fog: false }));
  mesh.name = 'far-climber'; mesh.matrixAutoUpdate = false; mesh.frustumCulled = false;
  return { object: mesh, triangles: G.triangles, reachLimited, update(time) { own.uFol.value = o.frame(time, mesh.matrix) || 0; mesh.matrixWorldNeedsUpdate = true; } };
}

// ---------------------------------------------------------------- ANOTHER OF THE KIND, NEAR (round Q, R6 b)
// One of the climber's kind on the next cable over, heading down it (mend W: it works a stretch of that cable, down
// and back, on the world's clock: the world file's habit, o.go). It is made of the same things
// as ours and wears the same dress, drawn by the same shaders at their own fineness: bark and bladder hide with
// moss, the bosses in crowds at two necks (none on its forward third), woody kneed limbs with their drapes and
// shoots, hands of rootlets, beards and a felt of seed-hair. It walks hand over hand by its OWN gait on its OWN
// clock (the world's seconds from its own start: o.tg0; mend W: by its own habit of going, o.go, which says how
// many seconds of its own going it has made at the world's second t), on ITS cable (o.frame gives the cable's
// place and line at a moment; nothing here knows of the road). It is UNLIKE ours: of its own size (the frame's), of its
// own lumps, and FIVE of the kind's seven limbs are grown (its stream says which two are not). It goes
// BARE: no urn, no pod, no rider, no flier. Everything of it is dealt from its one stream, in this order: the
// gait's sway; the limbs not grown; the gaps and swings of the five that are (mend S, the reader's R2: it dealt
// a gap and a swing for all seven and then left two ungrown: four draws on every visit fed only the schedules
// of limbs never built; a limb not grown has no draw now); the start of its round; the bosses; the limbs'
// drapes and shoots; the beards; the felt.
// (mend W, W1) A HAND HOLDS THE ROPE WHERE THE ROPE IS DRAWN is true of this one too: o.rope is ITS rope as its
// mesh draws it this frame, in its own frame (seat(s, out): where the rope's drawn middle at the hold s stands
// from the frame's line: the rope hangs slack and sways, so 130 m from the creature's middle it lies metres
// off the straight line of the frame; share(s): the share of the land's fall the rope takes there, less the
// share its own place takes), and o.radius(s) the rope's own girth at the hold. The gait takes them as it
// takes ours: the same reach (LIMB_REACH) and the same slip along the rope where a hold is out of reach.
// o: { rng, frame(t, matrix, down) => the share of the land's fall its place takes (mend U), tg0, go(t), radius(s), rope: { seat, share, clip } }
export async function buildSecond(ctx, shared, o = {}) {
  const U = shared.U, noise = ctx.noise, rng = cmStream(shared, o.rng, 'traverser', ctx);
  const sway0 = [rng(), rng(), rng()], skip = rng.pick([[1, 4], [3, 2], [5, 4], [1, 2]]);
  // (mend V: down, straight down in its frame, is the gait's too: the way its rope's sink is read. Mend W, W1: it
  // IS handed its rope (o.rope, o.radius: see above); mend V handed it none, because its rope takes none of
  // the land's fall where it holds, which was true and beside the point: the rope sags and sways)
  const down = new THREE.Vector3(0, -1, 0);
  const deal = { sway: sway0, gap: LIMBS.map((l, i) => skip.includes(i) ? 0 : rng.range(-1, 1)), swing: LIMBS.map((l, i) => skip.includes(i) ? 1 : rng.range(0.8, 1.25)), radius: o.radius, dip: () => 0, down, rope: o.rope };
  const shape = bodyShape(noise, 6.3), gait = makeGait(shape, rng(), deal);
  const group = new THREE.Group(); group.name = 'second'; group.matrixAutoUpdate = false;
  const sway = new THREE.Vector3(), cols = dress(), hide = { p: new THREE.Vector3(), n: new THREE.Vector3(), down: new THREE.Vector3() };
  const S = softGeo(), sacs = [];
  pushBody(S, shape, 64, 48, (v, th, fold) => { S.set('aB', 0, 0, th, fold); S.set('aC', BODY.a * Math.max(shape.prof(v), 0), 0, 0); S.set('aAx', 0, 0, 1); });
  await ctx.yield();
  // the bosses: three to a crowd at the two necks behind the bud, on each flank, by the kind's own rule (CROWD)
  for (let sd = 0, tries = 0; sd < 2; sd++) for (let j = 0; j < 6; j++) {
    const neck = (Math.floor(j / 3) + 1.32) / 4.3 + (sd ? 0.012 : -0.01), v = neck + clamp(rng.gauss() * 0.035, -CROWD, CROWD), dth = rng.range(-0.55, 0.4), th = sd ? Math.PI - dth : dth;
    hideAt(shape, v, th, hide);
    const r = rng.range(4.0, 7.5) * (0.75 + 0.5 * rng()), sink = r * rng.range(0.5, 0.72), c = hide.p.clone().addScaledVector(hide.n, -sink), ph = rng();
    if (sacs.some((q) => q.c.distanceTo(c) < (q.r + r) * 0.87 + 3)) { if (++tries < 400) j--; continue; }
    sacs.push({ c, r, wide: 2 * BODY.a * Math.max(shape.prof(v), 0) });
    pushBlob(S, hide.p.clone().addScaledVector(hide.n, -sink), hide.n.clone(), hide.down, r * 0.92, r, 1, ph, 12, 8, 1, sink);
  }
  // (mend U, U1) uFol: the share of the land's fall its place on its cable takes, written by place() from what its frame returns
  const fol = { value: 0 };
  const soft = new THREE.Mesh(bound(S.geometry(), 0, -60, 0, 300), new THREE.ShaderMaterial({ uniforms: withShared(U, { uSway: { value: sway }, uRot: { value: new THREE.Matrix3() }, uFol: fol, ...cols }), vertexShader: SOFT_VERT, fragmentShader: SOFT_FRAG, side: THREE.DoubleSide, fog: false }));
  soft.name = 'second-body'; group.add(soft);
  await ctx.yield();
  const LG = makeLimbGeometry(noise, rng, { skip, NR: 44, NS: 12, FR: 8, FS: 5 });
  const limbs = new THREE.Mesh(bound(LG.geometry(), 0, -20, 0, 320), new THREE.ShaderMaterial({ uniforms: withShared(U, { uJ: { value: gait.J }, uLN: { value: gait.LN }, uHand: { value: gait.hand }, uDown: { value: down }, uFol: fol, ...cols }), vertexShader: LIMB_VERT, fragmentShader: LIMB_FRAG, side: THREE.DoubleSide, fog: false }));
  limbs.name = 'second-limbs'; group.add(limbs);
  await ctx.yield();
  const H = new Geo({ aHr: 4, aHk: 4, aDir: 3 });
  const tuft = (root, dir, len, hw, kind, seg) => { const base = H.count, ph = rng();
    for (let i = 0; i <= seg; i++) for (const sd of [-1, 1]) { H.set('aHr', i / seg, sd, len, ph); H.set('aHk', hw, kind, 0, 0); H.set('aDir', dir.x, dir.y, dir.z); H.v(root.x, root.y, root.z); }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; H.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
  for (let i = 0; i < 46; i++) { const v = rng.range(0.05, 0.92), th = Math.PI * 1.5 + rng.range(-1.3, 1.3);
    hideAt(shape, v, th, hide); tuft(hide.p.clone().addScaledVector(hide.n, -0.3), hide.n, rng.range(30, 50) * (0.6 + 0.4 * shape.prof(v)), rng.range(2.2, 4.6), 0, 12); }
  await ctx.yield();
  for (let i = 0; i < 520; i++) { const v = rng.range(0.02, 0.97), th = Math.PI * 1.5 + clamp(rng.gauss() * 0.9, -1.25, 1.25);
    hideAt(shape, v, th, hide); tuft(hide.p.clone().addScaledVector(hide.n, -0.2), hide.n, rng.range(3, 9), rng.range(1.0, 2.2), 1, 3);
    if (i % 100 === 99) await ctx.yield(); }
  const hair = new THREE.Mesh(bound(H.geometry(), 0, -70, 60, 420), new THREE.ShaderMaterial({ uniforms: withShared(U, { uSway: { value: sway }, uDown: { value: down }, uStrandEnd: { value: new THREE.Vector3() }, uFol: fol, uStrandFol: { value: 0 }, ...cols }), vertexShader: HAIR_VERT, fragmentShader: HAIR_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  hair.name = 'second-hair'; hair.renderOrder = 1; group.add(hair);
  // (mend W: the frame FIRST: its rope's seat is read in the frame of this moment, so the gait is solved after it)
  const tg0 = o.tg0 ?? 0, go = o.go || ((t) => t), place = (t) => { fol.value = o.frame(t, group.matrix, down) || 0; gait.solve(tg0 + go(t)); group.matrixWorldNeedsUpdate = true; sway.set(gait.sway, gait.bob, 0); };
  place(0);
  return { object: group, gait, skip, limbsGrown: 7 - skip.length, bosses: sacs.length, loneMost: loneMost(sacs), triangles: S.triangles + LG.triangles + H.triangles, update: place };
}
