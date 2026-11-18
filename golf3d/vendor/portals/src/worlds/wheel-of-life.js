// THE WHEEL OF LIFE: a terraced wheel-island 300 m across whose wild animals are rings of painted plaster casts, each
// in the next instant of one movement. While the wheel turns slowly they are statues on brass pegs; once it reaches
// speed (the LOCK) every ring steps one fixed-thing pitch a tick, each cast takes the last one's place, and there is
// one living deer, fox, salmon and stream of cranes. Nothing ever deforms in time: a pose is a constant of its cast.
//
// LAYOUT  axis of the wheel = world Y through the origin. Entry along +Z from (0, 60, -300), HIGH over the yard (the whole wheel in its
//         ring of blades, the painted hills behind it), down over the wall (radius 210) at u 0.065, then a clockwise spiral that meets
//         each ring from a different side: inside the salmon looking out (T1, the fish in profile), outside the deer looking along the
//         row (T2, statues), over the ring while the whole wheel winds up, inside it looking out as it locks, beside the foxes on the
//         wheel's shade side (T3), down between the foxes and the birches, under the rain (T4), three quarters of a turn round the
//         mast INSIDE the cranes at radius 18.5 (the climax, at a third of the speed), then out on the entry's own bearing (+Z, the
//         sunlit side) and down over the terraces, the eye dipping to each ring of frozen casts as it is crossed, along a slate
//         runway through the exit slit to the arch and its turning painted sun at radius 339, against three painted flats of blue
//         hills (a fourth, low and pale, stands all the way round; the sky's own far range carries painted snow).
//         makeRoute() is the path, makeGaze() the eye (yaw toward or away from the axis and pitch by u).
// COLOUR  every terrace has its own ground (marsh, meadow, snow, wet slate: PAINTS), the yard is raked clay, each riser's plain
//         lower wall is a painted dado that sets off the casts in front of it; the sky deepens fast toward the zenith.
// SMEAR   at speed the WHOLE wheel streaks: a ring is ONE rope (its casts draw out to a pitch and close up inside a lathe band,
//         ROPE_VERT, streaked in PAINT_FRAG kind 8, over a curtain of thin peg streaks, kind 9), walls sink into the track, each
//         riser is covered row by row by a skin in the mean tones of its arcade and stairs (SKIN_VERT), the rim stripes melt into one
//         band and the decks streak (the deck materials take the ring's uSmear). Into the lock a ring jumps by whole cycles only, so
//         each ring's picture at a given clock is set by its lockOff.
// RINGS   each ring is a turntable Group (rotation.y = its drawn angle A) holding an InstancedMesh of casts, one of
//         stands (plinth, painted shadow oval, brass peg, painted cast shadow), one of fixed things (walls, weirs, tussocks, tufts)
//         and its lathe deck. One uniform per ring (uSmear) and one angle move all of it.
// LIGHT   no lights and no shadow maps, but the paint has ONE low painted sun (29 degrees up, 52 degrees left of the entry heading;
//         uSunH / uSunD): every upright face takes a lit, flank, half or shade tone by its bearing (the shade is a powder blue-grey
//         with a warm bounce band at the foot of each riser), and PAINT_FRAG works out the cast shadows exactly, one ray against the
//         five drums, the mast and the circle of blades (castSh): crescents on the decks, the mast's gnomon line, blade shadows
//         raking the yard and turning with the wall. Casts on pegs throw a painted lozenge and peg line (shadowProxy, RING_VERT).
//         The risers' arcades are real recesses (a screen 0.6 m proud of the lathe wall), the blades are 2.8 m slabs with splayed ribs.
// VARIES  paint (spring, autumn, bronze), cast (deer or hares, foxes or lynx), tick (12 or 8), weather (clear or cast
//         snow on wires), the hero's finial and markings. RARE: the wheel overshoots and every creature runs backward.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeSoup, ringPts, GLSL_COMMON, PAINT_FRAG, PAINT_VERT, buildCraneLong } from '../parts/wheel-of-life.js';
const FOX_BETWEEN = true;   // the second train of foxes (the designer's amendment of 7 Oct 2026, third small polish); false: the world is live's

const TAU = Math.PI * 2;
const DECK = [8, 22, 36, 50, 62], RIM = [150, 118, 88, 56, 34];   // terrace deck heights and outer radii (T1..T5)
const WALL_R = 210, WALL_H = 40, N_BLADE = 40, PLINTH_H = 0.3;

// Rig for every cast and fixed thing on a ring. Reads ONLY per-instance constants and the ring's smear.
// aRig = (part, t, side, tag + 10 * kind). parts: 0 body (spine arc), 1 neck and head, 2 fore leg, 3 hind leg, 4 tail,
// 6 scaled about aCtr (leaves, painted rings), 7 bead on a wire, 9 peg (unit height, stretched to the belly).
// aP0 = fore (hip L, knee L, hip R, knee R), aP1 = hind (same), aP2 = (neck, tail, spine arc, bead phase),
// aP3 = (smear stretch, mottle seed, class: 1 repair cast, 0 cast, -1 fixed thing, -2 stand; peg height), aTint = (rgb for tag 3, scale for part 6).
// uRope = (height of the ring's rope, how flat a cast lies in it, 1 if this ring has a rope): in the smear a cast draws out to one
// pitch and closes up on that line, inside the rope (ROPE_VERT), so the ring is ONE band; walls sink into the track; stands keep their height.
const RING_VERT = /* glsl */`
attribute vec3 color, aCtr; attribute vec4 aRig, aP0, aP1, aP2, aP3, aTint;
uniform float uSmear, uDir, uDeckY; uniform vec3 uBare, uSh, uHp, uNk, uTl, uRope, uSunD; uniform vec2 uLeg, uDeckR;
uniform vec4 uLong;   // x: 0 for a ring's own material; over 0 for its LONG PAINTED SHADOWS: metres of shadow a metre of height; y, z: cosine and sine of the shadow's bearing against the ring's radius
varying vec3 vCol, vN, vObj, vWorld; varying vec4 vAux;
${GLSL_COMMON}
void main(){
  float part = aRig.x, t = aRig.y, sd = aRig.z;
  float kind = floor(aRig.w / 10. + .01), tag = aRig.w - kind * 10.;
  vec3 p = position, n = normal;
  float cls = aP3.z;
  float sm = smoothstep(0., .32, uSmear * step(.001, aP3.x));   // a thing is a streak by a third of the smear (aP3.x == 0: a whole sector, never stretched)
  float lim = (cls > -.5 && uRope.z > .5) ? sm : 0.;          // a cast's neck, legs and tail draw up into its body line first
  if (part < .5) {
    float b = aP2.z; p.y -= b * p.z * p.z; n = rX(n, 2. * b * position.z);
  } else if (part < 1.5) {
    p = uNk + rX(p - uNk, aP2.x); n = rX(n, aP2.x);
    p.y -= aP2.z * uNk.z * uNk.z;
  } else if (part < 3.5) {
    bool fore = part < 2.5;
    vec3 pv = fore ? uSh : uHp; float up = fore ? uLeg.x : uLeg.y;
    vec4 a4 = fore ? aP0 : aP1;
    float hip = sd < 0. ? a4.x : a4.z, knee = sd < 0. ? a4.y : a4.w;
    vec3 H = vec3(pv.x * sd, pv.y, pv.z), q = p - H;
    if (t > .5) { q.y += up; q = rX(q, knee); n = rX(n, knee); q.y -= up; }
    q = rX(q, hip); n = rX(n, hip); p = H + q;
    p.y -= aP2.z * pv.z * pv.z;
  } else if (part < 4.5) {
    p = uTl + rX(p - uTl, aP2.y); n = rX(n, aP2.y);
    p.y -= aP2.z * uTl.z * uTl.z;
  } else if (part > 5.5 && part < 6.5) {
    p = aCtr + (p - aCtr) * aTint.w;
  } else if (part > 6.5 && part < 7.5) {
    p.y -= fract(t + aP2.w) * sd;
  } else if (part > 8.5) {
    p.y *= aP3.w;
  }
  if (part > .5 && part < 4.5) p = mix(p, vec3(0., .5 * (uSh.y + uHp.y), p.z), vec3(.6, .9, 0.) * lim);
  // a sector's deck furniture (grass tufts, snow stands: whatever stands on the deck inside the rail) sinks into the deck at speed
  if (aP3.x < .001 && cls > -.5 && cls < .5 && uDeckY > 0. && position.y > uDeckY + .01 && dot(position.xz, position.xz) < (uDeckR.y - .2) * (uDeckR.y - .2))
    p.y = uDeckY + (p.y - uDeckY) * (1. - .97 * smoothstep(0., .3, uSmear));
  vObj = p + vec3(aP3.y * 37., aP3.y * 11., 0.);
  vAux = vec4(abs(tag - 2.) < .5 ? position.x : 9., kind, kind > .5 ? uv : vec2(0., (aP3.x > .001 && cls > -.5) ? 7. : 0.));
  vCol = color;
  if (abs(tag - 1.) < .5 && aP3.z > .5) vCol = uBare;
  if (abs(tag - 3.) < .5) vCol = aTint.rgb;
  // onto the turntable, then the smear: stretch along the ring to one pitch, squash across it
  vec3 rp = (instanceMatrix * vec4(p, 1.)).xyz, c0 = instanceMatrix[3].xyz;
  vec3 rn = mat3(instanceMatrix) * n;
  float rr = max(length(c0.xz), 1.);
  vec3 T = vec3(c0.z, 0., -c0.x) / rr * uDir;
  vec3 rel = rp - c0; float d = dot(rel, T);
  vec3 perp = rel - T * d;
  float dd = d * mix(1., aP3.x * (lim > 0. ? 1.7 : 1.), sm), ang = uDir * dd / rr * sm;   // a cast draws out to 1.7 pitches: the streaks overlap into a band
  float across = mix(1., .5, sm);
  vec3 sp = c0 + perp * vec3(across, (cls < -.5 && cls > -1.5) ? mix(1., .05, sm) : 1., across);
  if (cls > -.5) sp.y = mix(sp.y, uRope.x + perp.y * uRope.y, sm * uRope.z);
  rp = rY(sp, ang) + T * dd * (1. - sm);
  rn = mix(rn, vec3(rn.x, rn.y * 2., rn.z), sm);
  // THE LONG PAINTED SHADOW (round p4; see longShadow in build): the same cast in the same pose, on the same turntable and under the
  // same smear, thrown flat onto its deck along one bearing against the ring's radius. All of it in the ring's own space, so the
  // shadow is paint on the wheel: a constant of its cast like its pose, turning with it. Part 5 is the peg's line from its foot.
  if (uLong.x > 0.) {
    bool peg = part > 4.5 && part < 5.5;
    vec2 rh = c0.xz / rr, dl = rh * uLong.y + vec2(rh.y, -rh.x) * uLong.z;
    rp.xz += dl * (max(rp.y - uDeckY, 0.) * (peg ? t : 1.) * uLong.x);
    if (peg) rp.xz += vec2(dl.y, -dl.x) * (sd * .08 * (1. - sm));
    rp.y = uDeckY + .03; rn = vec3(0., 1., 0.);
    vObj = rp; vAux = vec4(9., 0., 0., 11.);
  }
  vec4 wp = modelMatrix * vec4(rp, 1.);
  vec3 wn = mat3(modelMatrix) * rn;
  if (part > 7.5 && part < 8.5) {          // the painted cast shadow (see shadowProxy): thrown in world space, gone in the smear
    float keep = 1. - smoothstep(0., .25, uSmear);
    vec3 cw = (modelMatrix * vec4(c0, 1.)).xyz, bw = (modelMatrix * vec4((instanceMatrix * vec4(position * keep, 1.)).xyz, 1.)).xyz;
    vec2 D = -uSunD.xz; float Ls = (aP3.w + uv.x) / max(uSunD.y, .1);
    vec3 w3 = t > 1.5 ? bw + vec3(D.x, 0., D.y) * Ls : cw + vec3(D.x, 0., D.y) * (Ls * t) + vec3(-D.y, 0., D.x) * (sd * .09 * keep);
    float r3 = max(length(w3.xz), 1.);
    w3.xz *= clamp(r3, uDeckR.x, uDeckR.y) / r3; w3.y = cw.y + .045;
    wp = vec4(w3, 1.); wn = vec3(0., 1., 0.); vAux = vec4(9., 0., 0., 8.);
  }
  vWorld = wp.xyz; vN = wn;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// The rope a ring becomes at speed: a lathe band at the ring's radius, banded at the fixed-thing pitch, with a curtain of
// blurred pegs under it. It grows out of its own centre line as the smear comes in and is nothing at all without it.
const ROPE_VERT = /* glsl */`
attribute vec3 color; attribute float aKind;
uniform float uSmear; uniform vec2 uLine;
varying vec3 vCol, vN, vObj, vWorld; varying vec4 vAux;
void main(){
  float g = smoothstep(.1, .36, uSmear);
  float r = max(length(position.xz), 1.);
  vec3 c = vec3(position.x / r * uLine.x, uLine.y, position.z / r * uLine.x);
  vec3 p = c + (position - c) * g;
  vObj = position; vCol = color; vAux = vec4(9., aKind, uv);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// The skin a riser becomes at speed: rows of a lathe just proud of the arcade, each in the mean tone of what it covers. A row is
// nothing at rest (zero height on its own centre line, uv.x) and opens in its turn (uv.y) as the smear comes in, so the arches,
// doors and stairs are first crossed by long streaks and then drawn out into two or three horizontal tone bands.
const SKIN_VERT = /* glsl */`
attribute vec3 color;
uniform float uSmear;
varying vec3 vCol, vN, vObj, vWorld; varying vec4 vAux;
void main(){
  float g = smoothstep(uv.y * .5, uv.y * .5 + .42, uSmear);
  vec3 p = vec3(position.x, uv.x + (position.y - uv.x) * g, position.z);
  vObj = position; vCol = color; vAux = vec4(9., 0., 0., 5.);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix) * vec3(position.x, 0., position.z);   // the radius is never zero: a riser
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// The painted cyclorama: five soft-edged bands, a pale disc sun that casts nothing, a slate rain-bank with a scalloped
// top round a third of the horizon (centred on the exit bearing), nine flat-bottomed clouds, and the yard's colour below.
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uTop, uHor, uBank, uCap, uCloud, uBelly, uSun, uGround; uniform float uExit, uSunAz, uLift, uBankK; uniform vec4 uCl[9];
varying vec3 vDir;
float wrap(float a){ return a - 6.2831853 * floor(a / 6.2831853 + .5); }
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4);
  float el = asin(clamp(d.y, -1., 1.));
  float az = (abs(d.x) + abs(d.z) > 1e-5) ? atan(d.x, d.z) : 0.;
  float t = clamp(el / .52, 0., 1.), q = t * 5., band = floor(q) + smoothstep(.72, 1., fract(q));
  vec3 col = mix(uHor, uTop, clamp((band + .7) / 5.7, 0., 1.) * .92 + .08 * t);
  // clouds: three overlapping discs on a flat base, cream above, sage-grey bellies
  for (int i = 0; i < 9; i++) {
    vec4 c = uCl[i];
    vec2 pq = vec2(wrap(az - c.x) * cos(c.y), el - c.y) / c.z;
    float m = 0.;
    m = max(m, 1. - length(pq - vec2(-.55, .22)) / .50);
    m = max(m, 1. - length(pq - vec2(.05, .34)) / .66);
    m = max(m, 1. - length(pq - vec2(.62, .2)) / .46);
    m = max(m, 1. - length(vec2(pq.x * .55, pq.y - .1)) / .52);
    float inside = smoothstep(0., .05, m) * step(0., pq.y);
    vec3 cc = mix(uBelly, uCloud, smoothstep(.10, .16, pq.y + .05 * sin(pq.x * 9. + c.w)));
    col = mix(col, cc, inside);
  }
  // sun: a flat pale disc with one painted ring
  vec3 sd = vec3(sin(uSunAz) * cos(.5028), sin(.5028), cos(uSunAz) * cos(.5028));
  float sa = acos(clamp(dot(d, sd), -1., 1.));
  col = mix(col, uSun, .35 * (1. - smoothstep(.085, .09, sa)) + .65 * (1. - smoothstep(.05, .054, sa)));
  // the rain-bank: 14 degrees tall, scalloped, a third of the horizon wide
  float da = abs(wrap(az - uExit));
  float top = (.11 + .085 * (1. - smoothstep(.7, 1.1, da)) + .034 * abs(sin(az * 11.)) + .014 * abs(sin(az * 27. + 1.))) * uBankK - .03;   // a far range all the way round, tallest behind the arch
  float bank = 1. - smoothstep(top - .004, top + .004, el);
  vec3 bcol = mix(uBank, uBank * 1.16 + .02, step(top - .05, el));       // a paler lip along the top
  bcol = mix(bcol, uBank * .9, step(el, (.07 + .02 * sin(az * 40.)) * uBankK));         // painted streaks of rain below
  bcol = mix(bcol, uCap, step(top - .03 - .022 * abs(sin(az * 19. + .7)), el) * step(.105 * uBankK, top));   // painted snow on the peaks
  col = mix(col, bcol, bank);
  col = mix(col, uGround, 1. - smoothstep(-.012, -.004, el));
  gl_FragColor = vec4(col * uLift, 1.);
}`;

const PAINTS = {
  // yard: the raked clay of the casting yard; marsh, meadow, wet: the ground of T1, T2 and T4 (T3 is snow); hills: near, middle, far flats
  spring: { hex: ['#F3EAD6', '#7FA6B8', '#E2725B', '#D9A441', '#9DB58A', '#2E3A46'], top: '#7FA6B8', sky: '#2F74B0', skyHor: '#CFE3EA', hor: '#EFE6D2', bank: '#3D5C82', deer: '#D9A441', fox: '#E2725B',
    plaster: '#D8CEB6', gravel: '#D3A96C', marsh: '#A8BD86', meadow: '#7FA868', wet: '#5F87A0', hills: ['#2F4F74', '#4F7CA6', '#86AFCB'], cap: '#F6F1E4', leaf: ['#9DB58A', '#D9A441', '#E2725B'] },
  autumn: { hex: ['#F4E6C8', '#8FA3A6', '#C8553D', '#C98A2B', '#B9A55E', '#3A332E'], top: '#D3B36E', sky: '#C2873A', skyHor: '#F1DDB0', hor: '#F3E3BF', bank: '#5A4458', deer: '#B5562F', fox: '#C8553D',
    plaster: '#DCCFAE', gravel: '#B77F4E', marsh: '#BFA95C', meadow: '#C29A44', wet: '#6F8790', hills: ['#4A3550', '#7A5670', '#B08A8E'], cap: '#F7E9C6', leaf: ['#D9A441', '#C98A2B', '#B5462F'] },
  bronze: { hex: ['#D9D6CC', '#5E8C82', '#B8794A', '#B08D57', '#7FA394', '#22282C'], top: '#AEB7BC', sky: '#5F7C92', skyHor: '#C9D2D3', hor: '#DEDDD6', bank: '#33424E', deer: '#8C6A3C', fox: '#9A6B45',
    plaster: '#8C6A3C', gravel: '#56646E', marsh: '#4B6E66', meadow: '#3F6259', wet: '#35474F', hills: ['#27343E', '#41545F', '#6F858E'], cap: '#C9D2D3', leaf: ['#7FA394', '#B08D57', '#B8794A'] },
};

// ---------------------------------------------------------------- geometry helpers (flat-shaded soup with rig, uv and centres)
const K = (part = 0, t = 0, side = 0, tag = 0) => [part, t, side, tag];
// a soup that also records a centre per triangle (for part 6) : st.ctr([x,y,z]) applies to the triangles added after it
function soup() {
  const st = makeSoup(); st.marks = []; st.ctr = (c) => st.marks.push([st.count, c]);
  return st;
}
function finish(st) {
  const P = st.P, n = P.length / 3, g = new THREE.BufferGeometry(), N = new Float32Array(P.length), Cc = new Float32Array(P.length);
  for (let i = 0; i < n; i += 3) {
    const o = i * 3, ux = P[o + 3] - P[o], uy = P[o + 4] - P[o + 1], uz = P[o + 5] - P[o + 2], vx = P[o + 6] - P[o], vy = P[o + 7] - P[o + 1], vz = P[o + 8] - P[o + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (let k = 0; k < 3; k++) { N[o + k * 3] = nx; N[o + k * 3 + 1] = ny; N[o + k * 3 + 2] = nz; }
  }
  for (let m = 0; m < st.marks.length; m++) {
    const [t0, c] = st.marks[m], t1 = m + 1 < st.marks.length ? st.marks[m + 1][0] : st.count;
    for (let v = t0 * 3; v < t1 * 3; v++) { Cc[v * 3] = c[0]; Cc[v * 3 + 1] = c[1]; Cc[v * 3 + 2] = c[2]; }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(st.C, 3));
  g.setAttribute('aRig', new THREE.Float32BufferAttribute(st.R, 4));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(st.U, 2));
  g.setAttribute('aCtr', new THREE.BufferAttribute(Cc, 3));
  return g;
}
// a faceted limb from a to b (any direction), n sides, radii ra -> rb, optional flattening across x
function limb(st, a, b, ra, rb, n, col, rigA, rigB, capA = null, capB = null, flat = 1, colFn = null) {
  const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(ax[0], ax[1], ax[2]) || 1; ax[0] /= l; ax[1] /= l; ax[2] /= l;
  let s = Math.abs(ax[0]) > 0.9 ? [0, 0, 1] : [1, 0, 0];
  const d = s[0] * ax[0] + s[1] * ax[1] + s[2] * ax[2]; s = [s[0] - ax[0] * d, s[1] - ax[1] * d, s[2] - ax[2] * d];
  const sl = Math.hypot(s[0], s[1], s[2]) || 1; s = [s[0] / sl, s[1] / sl, s[2] / sl];
  const w = [ax[1] * s[2] - ax[2] * s[1], ax[2] * s[0] - ax[0] * s[2], ax[0] * s[1] - ax[1] * s[0]];
  const ring = (c, r) => ({ c, pts: ringPts(n, (an) => { const cs = Math.cos(an + 0.4) * r * flat, sn = Math.sin(an + 0.4) * r; return [c[0] + s[0] * cs + w[0] * sn, c[1] + s[1] * cs + w[1] * sn, c[2] + s[2] * cs + w[2] * sn]; }) });
  st.tube([ring(a, ra), ring(b, rb)], colFn || (() => col), (i) => (i ? (rigB || rigA) : rigA), capA, capB);
}
// a body of elliptical rings along z: secs = [[z, cy, halfW, halfH], ...]
function hull(st, secs, n, colFn, rig, capA, capB) {
  const rings = secs.map(([z, cy, hw, hh]) => ({ c: [0, cy, z], pts: ringPts(n, (a) => [Math.sin(a + Math.PI / n) * hw, cy + Math.cos(a + Math.PI / n) * hh, z]) }));
  st.tube(rings, colFn, typeof rig === 'function' ? rig : () => rig, capA, capB);
}

// ---------------------------------------------------------------- the quadruped cast (deer, hare, fox, lynx): rest pose, +Z forward
// o: L body length, bh/bw body half height/width, up/lo leg segments, neck, head, ear, tail..., colours
function buildQuadruped(o) {
  const st = soup(), { coat, belly, dark, bare } = o, L = o.L, h = o.bh, w = o.bw;
  const z0 = -L / 2, z1 = L / 2;
  const bodyCol = (i, j, hint) => {
    const l = Math.hypot(hint[0], hint[1], hint[2]) || 1, ny = hint[1] / l;
    if (ny < -0.45) return belly;
    if (o.rump && i === 0) return belly;
    if (o.chest && i >= 5 && ny < 0.2) return belly;
    return (o.spots && ny > 0.3 && (i + j) % 3 === 0) ? o.spots : coat;
  };
  hull(st, [[z0, 0.02, w * 0.55, h * 0.7], [z0 + L * 0.12, 0.03, w * 0.95, h * 1.0], [z0 + L * 0.3, 0.0, w, h * 0.95], [z0 + L * 0.5, -0.03, w * 0.92, h * 0.86],
    [z0 + L * 0.68, 0, w * 1.02, h * 1.0], [z0 + L * 0.86, 0.05, w * 0.95, h * 1.05], [z1, 0.12, w * 0.5, h * 0.62]], 8, bodyCol, K(0, 0, 0, 2), belly, coat);
  // neck and head (part 1), hinged at the neck base
  const nk = [0, h * 0.45, z1 - L * 0.06], na = o.neckAng, nl = o.neck;
  const nTop = [0, nk[1] + Math.sin(na) * nl, nk[2] + Math.cos(na) * nl];
  limb(st, nk, nTop, h * 0.62, o.headR * 1.05, 6, coat, K(1), K(1), null, null, 0.72, (i, j, hint) => (o.chest && hint[2] > 0.2 && hint[1] < 0.1 ? belly : coat));
  const hd = [0, nTop[1] + 0.02, nTop[2] + o.head * 0.18], sn = [0, nTop[1] - o.head * 0.3, nTop[2] + o.head];
  limb(st, [0, nTop[1] + 0.05, nTop[2] - o.head * 0.22], hd, o.headR * 0.8, o.headR, 6, coat, K(1), K(1), coat, null, 0.8);
  limb(st, hd, sn, o.headR, o.headR * 0.4, 6, coat, K(1), K(1), null, dark, 0.75, (i, j, hint) => (hint[1] < -0.02 ? belly : coat));
  for (const sd of [-1, 1]) {
    // painted eye: a slate lozenge standing just proud of the cheek
    const ex = sd * o.headR * 0.80, ey = hd[1] + o.headR * 0.25, ez = hd[2] + o.head * 0.16, e = o.headR * 0.3;
    st.tri([ex, ey + e * 0.6, ez], [ex, ey, ez + e], [ex, ey - e * 0.5, ez - e * 0.2], dark, K(1), null, null, [sd, 0, 0]);
    st.tri([ex, ey + e * 0.6, ez], [ex, ey, ez - e], [ex, ey - e * 0.5, ez - e * 0.2], dark, K(1), null, null, [sd, 0, 0]);
    // ear: a chisel-cut blade; the left ear is the one that is bare plaster on a repair cast
    const eb = [sd * o.headR * 0.55, hd[1] + o.headR * 0.7, hd[2] - o.head * 0.12], et = [sd * (o.headR * 0.6 + o.ear * 0.35), eb[1] + o.ear, eb[2] - o.ear * 0.25];
    const rg = K(1, 0, 0, sd < 0 ? 1 : 0), e2 = [eb[0] + sd * 0.02, eb[1], eb[2] + o.ear * 0.3], e3 = [eb[0] - sd * 0.05, eb[1], eb[2] - o.ear * 0.22], e4 = [eb[0] + sd * o.ear * 0.3, eb[1] + o.ear * 0.3, eb[2] - o.ear * 0.05];
    st.tri(e2, e4, et, coat, rg, rg, rg, [0, 0, 1]); st.tri(e3, e4, et, coat, rg, rg, rg, [0, 0, -1]); st.tri(e2, e3, e4, belly, rg, rg, rg, [sd, -1, 0]); st.tri(e2, e3, et, o.earIn || belly, rg, rg, rg, [-sd, 0.3, 0]);
    if (o.tuft) limb(st, et, [et[0] + sd * 0.03, et[1] + o.tuft, et[2] - 0.03], 0.025, 0.006, 3, dark, K(1), K(1));
    if (o.antler) {            // two tines each side, slate-edged plaster
      const a0 = [sd * o.headR * 0.3, hd[1] + o.headR * 0.8, hd[2] - o.head * 0.02], a1 = [sd * (o.headR * 0.5 + o.antler * 0.35), a0[1] + o.antler * 0.7, a0[2] - o.antler * 0.3], a2 = [a1[0] + sd * o.antler * 0.1, a1[1] + o.antler * 0.5, a1[2] + o.antler * 0.2];
      limb(st, a0, a1, 0.05, 0.035, 4, bare, K(1), K(1)); limb(st, a1, a2, 0.035, 0.012, 4, bare, K(1), K(1), null, dark);
      limb(st, a1, [a1[0] + sd * 0.05, a1[1] + o.antler * 0.2, a1[2] + o.antler * 0.45], 0.03, 0.01, 4, bare, K(1), K(1), null, dark);
      limb(st, [lerp(a0[0], a1[0], 0.45), lerp(a0[1], a1[1], 0.45), lerp(a0[2], a1[2], 0.45)], [a0[0] + sd * 0.1, a0[1] + o.antler * 0.35, a0[2] + o.antler * 0.5], 0.03, 0.01, 4, bare, K(1), K(1), null, dark);
    }
  }
  // legs: fore (part 2) and hind (part 3); t = 0 upper, 1 lower; hinged at shoulder / hip and knee
  const sh = [w * 0.62, -h * 0.25, z1 - L * 0.2], hp = [w * 0.66, -h * 0.2, z0 + L * 0.17];
  for (const sd of [-1, 1]) for (const [part, pv, up, lo, fat] of [[2, sh, o.up, o.lo, 1], [3, hp, o.upH || o.up, o.loH || o.lo, o.haunch || 1.35]]) {
    const H = [pv[0] * sd, pv[1], pv[2]], Kn = [H[0], H[1] - up, H[2]], F = [H[0], H[1] - up - lo, H[2]], r = o.legR;
    limb(st, [H[0], H[1] + h * 0.35, H[2]], Kn, r * 2.1 * fat, r * 1.05, 5, coat, K(part, 0, sd), K(part, 0, sd), coat, null, 0.62);
    limb(st, Kn, [F[0], F[1] + lo * 0.16, F[2]], r, r * 0.72, 5, o.sock || coat, K(part, 1, sd), K(part, 1, sd), o.sock || coat);
    limb(st, [F[0], F[1] + lo * 0.16, F[2]], [F[0], F[1], F[2] + (o.paw || 0.02)], r * 0.95, r * (o.paw ? 1.25 : 1.0), 5, dark, K(part, 1, sd), K(part, 1, sd), null, dark);   // hoof or paw
  }
  // tail (part 4)
  const tl = [0, h * 0.35, z0 + L * 0.04], tt = [0, tl[1] - Math.sin(o.tailDrop) * o.tail, tl[2] - Math.cos(o.tailDrop) * o.tail], tm = [0, lerp(tl[1], tt[1], 0.55), lerp(tl[2], tt[2], 0.55)];
  limb(st, tl, tm, o.tailR * 0.6, o.tailR, 5, o.tailCol || coat, K(4), K(4), coat);
  limb(st, tm, tt, o.tailR, o.tailR * 0.25, 5, o.tailTip || belly, K(4), K(4), null, o.tailTip || belly);
  return { geo: finish(st), tris: st.count, piv: { sh, hp, nk, tl, leg: [o.up, o.upH || o.up] }, stand: o.up + o.lo + h * 0.25, len: L + o.neck * 0.6, o };
}

// ---------------------------------------------------------------- salmon, birch, rain cloud, stand
function buildSalmon(o) {
  const st = soup(), { coat, belly, dark, flash } = o, L = o.L, z0 = -L / 2, R0 = K(0, 0, 0, 2);
  const col = (i, j, hint) => { const l = Math.hypot(hint[0], hint[1], hint[2]) || 1, ny = hint[1] / l; return ny < -0.3 ? belly : (ny < 0.35 && i >= 1 && i <= 5 ? flash : coat); };   // a coral flank band from gill to tail: the fish read against the blue foil
  hull(st, [[z0 + L * 0.06, 0, 0.05, 0.16], [z0 + L * 0.2, 0, 0.11, 0.24], [z0 + L * 0.4, 0.01, 0.2, 0.36], [z0 + L * 0.6, 0.02, 0.23, 0.4], [z0 + L * 0.78, 0.01, 0.2, 0.33], [z0 + L * 0.92, -0.01, 0.13, 0.2], [z0 + L, -0.04, 0.03, 0.05]], 8, col, R0, coat, dark);
  const zt = z0 + L * 0.06, B = (a, b, c, cl, rg = K(0)) => { st.tri(a, b, c, cl, rg, rg, rg, [1, 0, 0]); st.tri(a, b, c, cl, rg, rg, rg, [-1, 0, 0]); };
  B([0, 0.1, zt + 0.1], [0, 0.52, zt - 0.42], [0, 0, zt - 0.16], dark); B([0, -0.1, zt + 0.1], [0, -0.52, zt - 0.42], [0, 0, zt - 0.16], dark);       // tail fin
  B([0, 0.36, z0 + L * 0.62], [0, 0.7, z0 + L * 0.5], [0, 0.34, z0 + L * 0.42], flash, K(0, 0, 0, 1));                                              // dorsal fin (the repair fin)
  B([0, -0.3, z0 + L * 0.42], [0, -0.52, z0 + L * 0.34], [0, -0.3, z0 + L * 0.3], flash);
  for (const sd of [-1, 1]) {
    st.blade([sd * 0.2, -0.12, z0 + L * 0.74], [sd * 0.55, -0.3, z0 + L * 0.62], [sd * 0.2, -0.16, z0 + L * 0.64], flash, K(0), K(0), K(0));
    const ex = sd * 0.168, ey = 0.08, ez = z0 + L * 0.9, e = 0.07;
    st.tri([ex, ey + e, ez], [ex, ey, ez + e], [ex, ey - e, ez], dark, K(0), null, null, [sd, 0, 0]); st.tri([ex, ey + e, ez], [ex, ey, ez - e], [ex, ey - e, ez], dark, K(0), null, null, [sd, 0, 0]);
    st.tri([sd * 0.2, 0.2, z0 + L * 0.8], [sd * 0.21, -0.2, z0 + L * 0.79], [sd * 0.215, 0, z0 + L * 0.76], dark, K(0), null, null, [sd, 0, 0]);   // gill cut
  }
  return { geo: finish(st), tris: st.count, len: L };
}
function buildBirch(o, rng) {
  const st = soup(), { bark, dark } = o, H = o.H;
  const knots = [[0, 0, 0], [0.12, H * 0.3, 0.05], [-0.08, H * 0.58, -0.06], [0.05, H * 0.8, 0.04], [0, H * 0.97, 0]];
  for (let i = 0; i < 4; i++) limb(st, knots[i], knots[i + 1], 0.2 - i * 0.04, 0.16 - i * 0.04, 6, bark, K(0), K(0), null, i === 3 ? bark : null, 1, (a, j) => ((j + i * 2) % 5 === 0 ? dark : bark));
  const tips = [];
  for (let b = 0; b < 9; b++) {
    const t = 0.34 + 0.62 * (b / 8), y = H * t, a = b * 2.4 + rng() * 0.5, len = lerp(2.3, 0.8, (t - 0.34) / 0.62) * (0.85 + 0.3 * rng()), k = Math.min(3, Math.floor(t * 4));
    const f = t * 4 - k, base = [lerp(knots[k][0], knots[k + 1][0], f), y, lerp(knots[k][2], knots[k + 1][2], f)];
    const tip = [base[0] + Math.sin(a) * len, y + len * 0.55, base[2] + Math.cos(a) * len], mid = [lerp(base[0], tip[0], 0.6), lerp(base[1], tip[1], 0.6) + 0.1, lerp(base[2], tip[2], 0.6)];
    limb(st, base, mid, 0.06, 0.04, 4, bark, K(0), K(0)); limb(st, mid, tip, 0.04, 0.015, 4, dark, K(0), K(0));
    tips.push(tip); if (b % 3 === 0) tips.push(mid);
  }
  tips.push([0, H, 0]);
  for (const c of tips) {            // a leaf cluster: lozenge blades round a centre; the shader scales it and tints it by the pose
    st.ctr(c);
    for (let l = 0; l < 5; l++) {
      const a = l * 1.26 + rng() * 6, e = (rng() - 0.3) * 1.2, r = 1.05 + rng() * 0.8, dx = Math.sin(a) * Math.cos(e), dy = Math.sin(e), dz = Math.cos(a) * Math.cos(e);
      const q = [c[0] + dx * r, c[1] + dy * r, c[2] + dz * r], s = 0.66, sx = -dz * s, sz = dx * s, R6 = K(6, 0, 0, 3);
      st.blade([c[0] + dx * 0.1, c[1] + dy * 0.1, c[2] + dz * 0.1], [lerp(c[0], q[0], 0.55) + sx, lerp(c[1], q[1], 0.55) + 0.12, lerp(c[2], q[2], 0.55) + sz], q, bark, R6, R6, R6);
      st.blade([c[0] + dx * 0.1, c[1] + dy * 0.1, c[2] + dz * 0.1], [lerp(c[0], q[0], 0.55) - sx, lerp(c[1], q[1], 0.55) - 0.1, lerp(c[2], q[2], 0.55) - sz], q, bark, R6, R6, R6);
    }
  }
  return { geo: finish(st), tris: st.count };
}
// a cast cloud on a brass stalk with bead raindrops on wires, over a foil puddle with one painted ring that widens
function buildRainCloud(o, rng) {
  const st = soup(), { cream, bellyC, brass, bead, foil, dark } = o, Y = o.stalk, B3 = K(0, 0, 0, 30);
  limb(st, [0, 0.3, 0], [0, Y - 0.6, 0], 0.09, 0.06, 6, brass, B3, B3);
  limb(st, [0, 0, 0], [0, 0.34, 0], 0.5, 0.32, 8, o.plinth, K(0), K(0), null, o.plinth);
  const lump = (cx, cz, r, hgt) => {
    const rings = [[0, r * 0.82], [0.02, r], [hgt * 0.45, r * 0.9], [hgt * 0.8, r * 0.6], [hgt, r * 0.18]].map(([y, rr]) => ({ c: [cx, Y + y, cz], pts: ringPts(6, (a) => [cx + Math.sin(a + cx) * rr, Y + y, cz + Math.cos(a + cx) * rr * 0.8]) }));
    st.tube(rings, (i) => (i === 0 ? bellyC : cream), () => K(0), bellyC, cream);
  };
  lump(0, 0, 1.5, 1.5); lump(-1.4, 0.1, 1.05, 1.0); lump(1.3, -0.1, 1.15, 1.15); lump(-2.3, 0, 0.6, 0.55); lump(2.3, 0.05, 0.62, 0.5);
  const drop = 1.7, nB = 4;
  for (let wI = 0; wI < 5; wI++) {
    const x = -2.0 + wI * 1.0 + (rng() - 0.5) * 0.2, z = (rng() - 0.5) * 1.3, ph = rng();
    limb(st, [x, Y, z], [x, Y - drop * nB, z], 0.016, 0.016, 3, dark, K(0), K(0));
    for (let b = 0; b < nB; b++) {
      const y = Y - b * drop - 0.05, r = 0.13, R7 = K(7, ph, drop, 0), top = [x, y + r * 1.9, z], bot = [x, y - r, z];
      const eq = ringPts(3, (a) => [x + Math.sin(a) * r, y, z + Math.cos(a) * r]);
      for (let j = 0; j < 3; j++) { const hint = [eq[j][0] + eq[(j + 1) % 3][0] - 2 * x, 0, eq[j][2] + eq[(j + 1) % 3][2] - 2 * z]; st.tri(eq[j], eq[(j + 1) % 3], top, bead, R7, R7, R7, [hint[0], 0.3, hint[2]]); st.tri(eq[j], eq[(j + 1) % 3], bot, bead, R7, R7, R7, [hint[0], -0.6, hint[2]]); }
    }
  }
  // the puddle (foil, kind 5) and its painted ring (part 6: scaled about the centre by the pose)
  const pr = 2.3, F5 = K(0, 0, 0, 50), c0 = [0, 0.05, 0], rim = ringPts(12, (a) => [Math.sin(a) * pr * (1 + 0.12 * Math.sin(a * 3)), 0.05, Math.cos(a) * pr * 0.8]);
  for (let j = 0; j < 12; j++) st.tri(c0, rim[j], rim[(j + 1) % 12], foil, F5, F5, F5, [0, 1, 0]);
  st.ctr([0, 0.07, 0]);
  const R6 = K(6), ri = ringPts(12, (a) => [Math.sin(a) * 1.72, 0.07, Math.cos(a) * 1.38]), ro = ringPts(12, (a) => [Math.sin(a) * 2.0, 0.07, Math.cos(a) * 1.6]);
  for (let j = 0; j < 12; j++) st.quad(ri[j], ro[j], ro[(j + 1) % 12], ri[(j + 1) % 12], cream, R6, R6, R6, R6, [0, 1, 0]);
  st.ctr([0, 0, 0]);
  shadowProxy(st, o.plinth, 2.9, 1.7, Y + 0.5);
  return { geo: finish(st), tris: st.count };
}
// The painted cast shadow of a thing on a peg (part 8): a flat lozenge and a thin strip lying on the deck. RING_VERT lays the
// lozenge where the painted sun would throw the thing's shadow ((peg height + up) / the sun's slope away from it, in WORLD space, so
// it keeps its bearing as the turntable turns) and draws the strip from the foot of the peg to it. PAINT_FRAG paints it the deck's shade tone.
function shadowProxy(st, col, hl, hw, up) {
  const R = (t, sd) => K(8, t, sd, 0), U2 = [up, 0], n = [0, 1, 0], pts = ringPts(6, (a) => [Math.sin(a) * hw * (Math.abs(Math.sin(a)) > 0.9 ? 0.55 : 1), 0, Math.cos(a) * hl]);
  for (let j = 1; j < 5; j++) st.tri(pts[0], pts[j], pts[j + 1], col, R(2, 0), R(2, 0), R(2, 0), n, U2, U2, U2);
  const O = [0, 0, 0];
  st.tri(O, O, O, col, R(0, -1), R(0, 1), R(1, 1), n, U2, U2, U2); st.tri(O, O, O, col, R(0, -1), R(1, 1), R(1, -1), n, U2, U2, U2);
}
// plinth with its painted shadow oval and a unit brass peg (part 9, stretched to the belly by aP3.w)
function buildStand(o) {
  const st = soup(), Lh = o.halfL, Wh = o.halfW, ins = 0.07, c = (l, w, y) => [w, y, l];
  const lo = [c(-Lh, -Wh, 0), c(Lh, -Wh, 0), c(Lh, Wh, 0), c(-Lh, Wh, 0)], hi = [c(-Lh + ins, -Wh + ins, PLINTH_H), c(Lh - ins, -Wh + ins, PLINTH_H), c(Lh - ins, Wh - ins, PLINTH_H), c(-Lh + ins, Wh - ins, PLINTH_H)];
  for (let m = 0; m < 4; m++) { const m2 = (m + 1) % 4; st.quad(lo[m], lo[m2], hi[m2], hi[m], m % 2 ? o.plaster : o.chalk, K(), K(), K(), K(), [(lo[m][0] + lo[m2][0]) / 2, 0.3, (lo[m][2] + lo[m2][2]) / 2]); }
  const K4 = K(0, 0, 0, 40), uvs = [[-1.25, -1.45], [1.25, -1.45], [1.25, 1.45], [-1.25, 1.45]];
  st.tri(hi[0], hi[1], hi[2], o.chalk, K4, K4, K4, [0, 1, 0], uvs[0], uvs[1], uvs[2]); st.tri(hi[0], hi[2], hi[3], o.chalk, K4, K4, K4, [0, 1, 0], uvs[0], uvs[2], uvs[3]);
  const n = 6, r = o.pegR || 0.055, P9 = K(9, 0, 0, 30);
  for (let j = 0; j < n; j++) {
    const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, A = [Math.sin(a0) * r, 0, Math.cos(a0) * r], Bq = [Math.sin(a1) * r, 0, Math.cos(a1) * r], C = [Bq[0], 1, Bq[2]], D = [A[0], 1, A[2]], hint = [A[0] + Bq[0], 0, A[2] + Bq[2]];
    st.tri(A, Bq, C, o.brass, P9, P9, P9, hint, [j / n, 0], [(j + 1) / n, 0], [(j + 1) / n, 0]); st.tri(A, C, D, o.brass, P9, P9, P9, hint, [j / n, 0], [(j + 1) / n, 0], [j / n, 0]);
  }
  if (o.sh) shadowProxy(st, o.chalk, o.sh[0], o.sh[1], o.sh[2]);
  return { geo: finish(st), tris: st.count };
}

// ---------------------------------------------------------------- the long painted shadows (round p4): flat profile cut-outs
// A cast's long shadow is drawn from a few-triangle cut-out of its side view, standing in the cast's own middle plane (x = 0; the
// legs at their own hips), cut from the same measures as the cast and carrying the same rig parts (0 body, 1 neck and head, 2 and 3
// legs, 4 tail), so RING_VERT poses it exactly as it poses the cast and then throws it flat onto the deck (uLong). Part 5 is the
// peg's line: two triangles the shader draws from the foot of the peg to the shadow of the cast's middle.
function cutout() {
  const st = soup(), col = new THREE.Color(0, 0, 0), up = [1, 0, 0];
  // a tapered strip in the plane x, from a to b (each [y, z]), half-widths ra and rb (rb 0: a point)
  st.seg = (x, a, b, ra, rb, rg) => { const dy = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dy, dz) || 1, ny = -dz / l, nz = dy / l;
    const A = [x, a[0] + ny * ra, a[1] + nz * ra], B = [x, a[0] - ny * ra, a[1] - nz * ra], C = [x, b[0] - ny * rb, b[1] - nz * rb], D = [x, b[0] + ny * rb, b[1] + nz * rb];
    st.tri(A, B, C, col, rg, rg, rg, up); if (rb > 1e-4) st.tri(A, C, D, col, rg, rg, rg, up); };
  st.flat = (a, b, c, rg) => st.tri([0, a[0], a[1]], [0, b[0], b[1]], [0, c[0], c[1]], col, rg, rg, rg, up);
  // a body from sections [z, middle height, half height]
  st.body = (secs, rg) => { for (let i = 0; i < secs.length - 1; i++) { const [za, ca, ha] = secs[i], [zb, cb, hb] = secs[i + 1]; st.quad([0, ca + ha, za], [0, ca - ha, za], [0, cb - hb, zb], [0, cb + hb, zb], col, rg, rg, rg, rg, up); } };
  st.peg = () => { const O = [0, 0, 0]; st.tri(O, O, O, col, K(5, 0, -1), K(5, 0, 1), K(5, 1, 0), up); };   // the peg's line: one sliver, 16 cm at the peg's foot to a point under the cast (the third mend: was a strip of two; triangles)
  return st;
}
// o: the measures buildQuadruped was given. Legs and tail are cut 2.4 times as wide as the cast's, so that their shadows read at film size.
function buildQuadLong(o) {
  const st = cutout(), L = o.L, h = o.bh, w = o.bw, z0 = -L / 2, z1 = L / 2, R1 = K(1), FAT = 2.4;
  st.body([[z0, 0.02, h * 0.7], [z0 + L * 0.14, 0.03, h], [z0 + L * 0.84, 0.04, h * 1.04], [z1, 0.12, h * 0.62]], K(0));   // three quads (the third mend: were four; triangles)
  const nk = [h * 0.45, z1 - L * 0.06], nT = [nk[0] + Math.sin(o.neckAng) * o.neck, nk[1] + Math.cos(o.neckAng) * o.neck];
  st.seg(0, nk, nT, h * 0.62, o.headR * 1.05, R1);
  const hd = [nT[0] + 0.02, nT[1] + o.head * 0.18], sn = [nT[0] - o.head * 0.3, nT[1] + o.head];
  st.seg(0, [nT[0] + 0.05, nT[1] - o.head * 0.22], hd, o.headR * 0.8, o.headR, R1); st.seg(0, hd, sn, o.headR, o.headR * 0.4, R1);
  const eb = [hd[0] + o.headR * 0.7, hd[1] - o.head * 0.12];
  st.flat([eb[0], eb[1] + o.ear * 0.3], [eb[0], eb[1] - o.ear * 0.22], [eb[0] + o.ear, eb[1] - o.ear * 0.25], R1);
  if (o.antler) {
    const a0 = [hd[0] + o.headR * 0.8, hd[1] - o.head * 0.02], a1 = [a0[0] + o.antler * 0.7, a0[1] - o.antler * 0.3], a2 = [a1[0] + o.antler * 0.5, a1[1] + o.antler * 0.2];
    st.seg(0, a0, a1, 0.07, 0.055, R1); st.seg(0, a1, a2, 0.055, 0, R1); st.seg(0, a1, [a1[0] + o.antler * 0.2, a1[1] + o.antler * 0.45], 0.05, 0, R1);
    st.seg(0, [lerp(a0[0], a1[0], 0.45), lerp(a0[1], a1[1], 0.45)], [a0[0] + o.antler * 0.35, a0[1] + o.antler * 0.5], 0.05, 0, R1);
  }
  const sh = [w * 0.62, -h * 0.25, z1 - L * 0.2], hp = [w * 0.66, -h * 0.2, z0 + L * 0.17];
  for (const sd of [-1, 1]) for (const [part, pv, up, lo, fat] of [[2, sh, o.up, o.lo, 1], [3, hp, o.upH || o.up, o.loH || o.lo, o.haunch || 1.35]]) {
    const x = pv[0] * sd, r = o.legR * FAT, ky = pv[1] - up, fy = ky - lo;
    st.seg(x, [pv[1] + h * 0.35, pv[2]], [ky, pv[2]], r * 2.1 * fat, r * 1.05, K(part, 0, sd));
    st.seg(x, [ky, pv[2]], [fy, pv[2] + (o.paw || 0.02) * 0.5], r, r * (o.paw ? 1.2 : 0.85), K(part, 1, sd));
  }
  const tl = [h * 0.35, z0 + L * 0.04], tt = [tl[0] - Math.sin(o.tailDrop) * o.tail, tl[1] - Math.cos(o.tailDrop) * o.tail], tm = [lerp(tl[0], tt[0], 0.55), lerp(tl[1], tt[1], 0.55)];
  st.seg(0, tl, tm, o.tailR * 0.6 * FAT, o.tailR * FAT, K(4)); st.seg(0, tm, tt, o.tailR * FAT, 0, K(4));
  st.peg();
  return { geo: finish(st), tris: st.count };
}
function buildSalmonLong(o) {
  const st = cutout(), L = o.L, z0 = -L / 2, zt = z0 + L * 0.06, R0 = K(0);
  st.body([[z0 + L * 0.06, 0, 0.16], [z0 + L * 0.3, 0.005, 0.31], [z0 + L * 0.6, 0.02, 0.4], [z0 + L * 0.86, 0, 0.27], [z0 + L, -0.04, 0.05]], R0);   // four quads (the third mend: were six; triangles)
  st.flat([0.1, zt + 0.1], [0.52, zt - 0.42], [0, zt - 0.16], R0); st.flat([-0.1, zt + 0.1], [-0.52, zt - 0.42], [0, zt - 0.16], R0);
  st.flat([0.36, z0 + L * 0.62], [0.7, z0 + L * 0.5], [0.34, z0 + L * 0.42], R0); st.flat([-0.3, z0 + L * 0.42], [-0.52, z0 + L * 0.34], [-0.3, z0 + L * 0.3], R0);
  st.peg();
  return { geo: finish(st), tris: st.count };
}

// ---------------------------------------------------------------- fixed things: one per sector, on the same turntable
function box(st, c, hx, hy, hz, col, yaw = 0, rig = K(), topCol = null) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw), P = (x, y, z) => [c[0] + x * cs + z * sn, c[1] + y, c[2] - x * sn + z * cs];
  const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), P(-hx, hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), P(-hx, hy, hz)];
  const f = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  for (const q of f) st.quad(v[q[0]], v[q[1]], v[q[2]], v[q[3]], col, rig, rig, rig, rig, [(v[q[0]][0] + v[q[1]][0]) / 2 - c[0], 0, (v[q[0]][2] + v[q[1]][2]) / 2 - c[2]]);
  st.quad(v[4], v[5], v[6], v[7], topCol || col, rig, rig, rig, rig, [0, 1, 0]);
}
// a dry-stone wall lying across the track (local: x across the ring, z along it), 1.4 m high
function buildWall(o, rng) {
  const st = soup(), half = o.half;
  for (let c = 0; c < 3; c++) {
    let x = -half; const hy = c === 2 ? 0.17 : 0.27, y = c * 0.54 + hy + (c === 2 ? -0.02 : 0);
    while (x < half - 0.1) {
      const len = Math.min(half - x, 0.8 + rng() * 0.7), col = o.stones[Math.floor(rng() * o.stones.length)];
      box(st, [x + len / 2, y, (rng() - 0.5) * 0.08], len / 2 - 0.02, hy - 0.015, 0.33 - c * 0.04 + rng() * 0.04, col, 0, K(), c === 2 ? o.cap : null);
      x += len;
    }
  }
  return { geo: finish(st), tris: st.count };
}
// a stone weir across the foil channel with a cream lip of falling water painted on its downstream face
function buildWeir(o) {
  const st = soup(), h = o.half;
  box(st, [0, 0.42, 0], h, 0.42, 0.3, o.stone, 0, K(), o.cap);
  box(st, [-h - 0.3, 0.6, 0], 0.3, 0.6, 0.45, o.stone2, 0, K(), o.cap); box(st, [h + 0.3, 0.6, 0], 0.3, 0.6, 0.45, o.stone2, 0, K(), o.cap);
  const F5 = K(0, 0, 0, 50), a = [-h, 0.86, 0.3], b = [h, 0.86, 0.3], c = [h, 0.05, 0.75], d = [-h, 0.05, 0.75];
  st.tri(a, b, c, o.water, F5, F5, F5, [0, 0.5, 1]); st.tri(a, c, d, o.water, F5, F5, F5, [0, 0.5, 1]);
  for (let k = 0; k < 5; k++) { const x = -h + (k + 0.5) * (2 * h / 5); st.tri([x - 0.12, 0.8, 0.36], [x + 0.12, 0.8, 0.36], [x, 0.2, 0.7], o.cap, K(), null, null, [0, 0.6, 1]); }
  return { geo: finish(st), tris: st.count };
}
// a snow tussock: a faceted mound with a few stiff grass blades through it
function buildTussock(o, rng) {
  const st = soup();
  const rings = [[0, 1.55], [0.34, 1.42], [0.72, 1.08], [0.98, 0.62], [1.1, 0.2]].map(([y, r]) => ({ c: [0, y, 0], pts: ringPts(8, (a) => [Math.sin(a) * r * (1 + 0.1 * Math.sin(a * 2)), y, Math.cos(a) * r]) }));
  st.tube(rings, (i, j) => (j === 5 || (j === 6 && i < 2) ? o.shade : o.snow), () => K(), null, o.snow);
  for (let k = 0; k < 7; k++) { const a = rng() * TAU, r = 0.3 + rng() * 0.5, x = Math.sin(a) * r, z = Math.cos(a) * r, hh = 0.5 + rng() * 0.5; st.blade([x - 0.05, 0.3, z], [x + 0.05, 0.3, z + 0.03], [x + Math.sin(a) * 0.25, 0.3 + hh, z + Math.cos(a) * 0.25], o.grass, K(), K(), K()); }
  return { geo: finish(st), tris: st.count };
}
function tuft(st, x, y, z, h, col, rng, n = 3) {
  for (let k = 0; k < n; k++) {
    const a = rng() * TAU, l = h * (0.7 + 0.5 * rng()), w = 0.05 + h * 0.09, dx = Math.sin(a), dz = Math.cos(a);
    st.blade([x - dz * w, y, z + dx * w], [x + dz * w, y, z - dx * w], [x + dx * l * 0.45, y + l, z + dz * l * 0.45], col, K(), K(), K());
  }
}
// lathe: profile points { r, y, col, kind, u } anticlockwise in (r, y) with the solid on the left; segs facets; uRep stripes a turn
function lathe(st, prof, segs, uRep = 0) {
  for (let k = 0; k < prof.length - 1; k++) {
    const p0 = prof[k], p1 = prof[k + 1], dy = p1.y - p0.y, dr = p1.r - p0.r, rg = [p0.kind || 0, 0, 0, 0];
    for (let j = 0; j < segs; j++) {
      const b0 = (j / segs) * TAU, b1 = ((j + 1) / segs) * TAU, bm = (b0 + b1) / 2;
      const A = [Math.sin(b0) * p0.r, p0.y, Math.cos(b0) * p0.r], B = [Math.sin(b1) * p0.r, p0.y, Math.cos(b1) * p0.r], C = [Math.sin(b1) * p1.r, p1.y, Math.cos(b1) * p1.r], D = [Math.sin(b0) * p1.r, p1.y, Math.cos(b0) * p1.r];
      const hint = [Math.sin(bm) * dy, -dr, Math.cos(bm) * dy], u0 = (j / segs) * uRep, u1 = ((j + 1) / segs) * uRep;
      if (p0.r > 1e-4) st.tri(A, B, C, p0.col, rg, rg, rg, hint, [u0, 0], [u1, 0], [u1, 0]);
      if (p1.r > 1e-4) st.tri(A, C, D, p0.col, rg, rg, rg, hint, [u0, 0], [u1, 0], [u0, 0]);
    }
  }
}
const pp = (r, y, col, kind = 0) => ({ r, y, col, kind });

// ---------------------------------------------------------------- poses: keyframes over one cycle (p = 0 at the fixed thing)
// row = [p, y, pitch(nose up +), fore hip(+ back), fore knee, hind hip, hind knee, neck, tail, spine arc]
const DEER_KEYS = [[0.0, 1.75, 0.0, -0.8, 1.9, 0.7, 1.0, 0.15, -0.3, 0.02], [0.1, 1.0, -0.38, -1.15, 0.5, 0.75, 0.9, 0.0, -0.5, 0.0], [0.19, 0.05, -0.2, -0.5, 0.05, 0.1, 1.3, -0.15, -0.2, -0.03],
  [0.29, 0.02, 0.06, 0.75, 0.5, -0.85, 0.5, -0.1, 0.1, 0.05], [0.4, 0.32, 0.02, -0.95, 0.6, 0.85, 0.25, 0.1, -0.2, -0.03], [0.5, 0.06, -0.08, -0.15, 0.0, -0.2, 1.1, -0.1, 0.0, 0.01],
  [0.6, 0.02, 0.06, 0.75, 0.5, -0.85, 0.5, -0.1, 0.1, 0.05], [0.7, 0.3, 0.03, -0.95, 0.6, 0.85, 0.25, 0.1, -0.2, -0.03], [0.8, 0.02, 0.15, -0.5, 1.3, -0.7, 0.7, 0.2, 0.0, 0.04], [0.9, 0.7, 0.45, -0.95, 1.7, 0.95, 0.1, 0.2, -0.2, 0.0]];
const FOX_KEYS = [[0.0, 0.55, -1.38, -1.2, 0.2, 0.3, 0.5, -0.2, -0.9, 0.05], [0.08, 0.5, -1.3, -1.1, 0.4, -0.5, 1.0, -0.2, -1.0, 0.07], [0.17, 0.1, -0.35, -0.3, 0.3, 0.2, 0.6, 0.2, -0.5, 0.0], [0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.45, -0.2, 0.0],
  [0.36, -0.08, 0.0, 0.45, 0.3, -0.4, 0.5, -0.1, 0.1, 0.0], [0.47, -0.1, 0.0, -0.45, 0.5, 0.4, 0.3, -0.25, 0.15, 0.0], [0.6, -0.2, 0.08, -0.2, 0.9, -0.6, 1.2, 0.1, 0.2, 0.06],
  [0.71, 0.8, 0.8, -0.9, 1.6, 0.95, 0.1, 0.3, 0.3, 0.0], [0.84, 2.7, 0.0, -1.1, 0.9, 0.3, 1.5, -0.3, -0.2, 0.1], [0.94, 2.0, -1.1, -1.4, 0.15, 0.7, 0.6, -0.1, -0.7, 0.04]];
const SALMON_KEYS = [[0.0, 1.85, 0.0, 0, 0, 0, 0, 0, 0, 0.14], [0.09, 1.25, -0.6, 0, 0, 0, 0, 0, 0, 0.1], [0.18, 0.05, -0.8, 0, 0, 0, 0, 0, 0, 0.03], [0.27, -0.3, -0.1, 0, 0, 0, 0, 0, 0, -0.05],
  [0.42, -0.26, 0.0, 0, 0, 0, 0, 0, 0, 0.05], [0.57, -0.26, 0.0, 0, 0, 0, 0, 0, 0, -0.05], [0.72, -0.3, 0.12, 0, 0, 0, 0, 0, 0, 0.04], [0.82, 0.05, 0.8, 0, 0, 0, 0, 0, 0, 0.02], [0.91, 1.25, 0.6, 0, 0, 0, 0, 0, 0, 0.1]];
function keyAt(keys, p) {
  p = ((p % 1) + 1) % 1; const n = keys.length; let k = n - 1;
  for (let i = 0; i < n; i++) if (keys[i][0] <= p) k = i;
  const a = keys[k], b = keys[(k + 1) % n], span = ((b[0] - a[0]) % 1 + 1) % 1 || 1, f0 = (((p - a[0]) % 1) + 1) % 1 / span, f = f0 * f0 * (3 - 2 * f0), out = [];
  for (let i = 1; i < a.length; i++) out.push(a[i] + (b[i] - a[i]) * f);
  return out;   // [y, pitch, fH, fK, hH, hK, neck, tail, arc]
}

// ---------------------------------------------------------------- the route (polar: t = turns clockwise from due -Z, r, y)
// In from -Z through a slit, a clockwise spiral that meets the salmon (T1), the deer twice (T2: outside, then inside the ring), the
// foxes (T3) and the rain (T4), one turn round the mast inside the cranes (the climax), and out along the tangent, down over the
// terraces to the arch. The twelve stills an outside reviewer sees (u 0.02 ... 0.94) each fall on a different one of these.
export function makeRoute() {
  const pol = (t, r, y) => { const a = Math.PI - t * TAU; return [Math.sin(a) * r, y, Math.cos(a) * r]; };
  // in HIGH over the yard (the whole wheel stands in its ring of blades, the hills behind it), down through the top of a slit
  const pts = [[0, 60, -300], [0, 60, -274], [0, 57.6, -248], [0.3, 51, -222], [3, 42, -196], [12, 30.5, -168]];
  // [turns, radius, height]: over the salmon ring and down INSIDE it (T1: the fish in profile against the yard), up over the T2 rim
  // beside the deer as statues (outside the ring, looking along the row), over the ring while it winds up, inside it looking out as
  // it locks, up to the foxes on the shade side (T3, outside), over them and down between the foxes and the birches (the lit
  // side), up under the rain (T4) and in to the mast
  const polar = [[0.04, 137.0, 19.5], [0.06, 129.0, 14.0], [0.08, 126.8, 11.4], [0.10, 126.5, 10.8], [0.12, 126.5, 10.8],
    [0.14, 126.6, 12.2], [0.158, 128.0, 17.6], [0.176, 127.0, 23.8], [0.19, 122.5, 27.6],
    [0.208, 114.2, 27.0], [0.236, 109.3, 24.5], [0.275, 109.3, 24.8],
    [0.297, 107.6, 27.6], [0.319, 103.5, 30.6], [0.341, 99.2, 30.0], [0.363, 96.8, 27.4],
    [0.39, 96.2, 26.4], [0.425, 96.2, 26.3], [0.455, 96.2, 26.4], [0.47, 96.3, 26.6],
    [0.495, 96.8, 30.2], [0.52, 95.6, 35.6], [0.545, 91.0, 40.6], [0.57, 84.2, 40.8],
    [0.595, 80.8, 39.6], [0.63, 80.3, 39.3], [0.665, 80.3, 39.3], [0.70, 80.3, 39.4],
    [0.735, 79.2, 41.2], [0.765, 76.2, 43.4], [0.795, 72.2, 43.6], [0.825, 68.6, 41.4], [0.855, 67.3, 40.0], [0.885, 67.2, 39.8], [0.915, 67.2, 39.9], [0.94, 67.2, 41.0], [0.962, 66.6, 44.6],
    [0.99, 64.6, 49.6], [1.02, 61.0, 53.6], [1.05, 57.4, 56.6], [1.085, 54.4, 57.6],
    [1.125, 53.3, 56.8], [1.175, 53.2, 56.6], [1.225, 53.2, 56.6], [1.275, 53.2, 56.7], [1.315, 53.2, 57.6],
    [1.345, 51.5, 60.6], [1.375, 45.5, 66.4], [1.405, 35.5, 72.0], [1.432, 26.0, 75.6]];
  for (const [t, r, y] of polar) pts.push(pol(t, r, y));
  // the orbit: three quarters of a turn INSIDE the stream, 4.8 m off the wingtips, ending on the bearing of the entry (+Z)
  const T_ORB0 = 1.46, T_ORB1 = 2.25, R_ORB = 18.5, Y_ORB0 = 77.5, Y_TOP = 95, Y_ORB1 = 86, N = 14, EXIT_LEN = 339;
  const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const orbY = (f) => Y_ORB0 + (Y_TOP - Y_ORB0) * Math.min(1, f / 0.62) - (Y_TOP - Y_ORB1) * ss((f - 0.72) / 0.42);   // up to the top by two thirds of the way, then easing down into the exit
  for (let k = 0; k < N; k++) pts.push(pol(T_ORB0 + (T_ORB1 - T_ORB0) * (k / N), R_ORB, orbY(k / N)));
  const aE = Math.PI - T_ORB1 * TAU, pe = [Math.sin(aE) * R_ORB, Math.cos(aE) * R_ORB], te = [-Math.cos(aE), Math.sin(aE)];   // exit line: tangent to the orbit
  const exitPt = (s, y) => [pe[0] + te[0] * s, y, pe[1] + te[1] * s];
  // down the sunlit terraces, as low as their rims allow: clear of the rain clouds (radius 45, tops y 61) and the T4 rail, 7 m over
  // the foxes, 4 m over the T3 rail, close over the deer and the salmon, and level along the runway
  for (const [s, y] of [[0, Y_ORB1 - 2], [10, 79.5], [20, 74.5], [32, 69], [52, 58.5], [62, 51.8], [74, 45.6], [84.7, 40.4], [92, 35.4], [100, 31.8], [116, 26.6], [134, 18.8], [154, 16.6], [176, 16.1], [200, 16], [230, 16], [262, 16], [294, 16], [324, 16], [EXIT_LEN, 16]]) pts.push(exitPt(s, y));
  return { pts, pol, polar, T_ORB0, T_ORB1, R_ORB, Y_ORB0, Y_TOP, Y_ORB1, EXIT_LEN, pe, te, exitPt };
}

// The gaze: one point of interest that puts the camera's eye where the picture wants it. keys = [u, degrees turned from the
// path's heading toward the axis, degrees of pitch]; between keys the two ease. A second one takes the eye to the arch.
export function makeGaze(path, U, portalPos) {
  // negative yaw looks AWAY from the axis: the deer are met twice, from outside the ring looking along the row at the tiers
  // (statues), and from inside it looking out past the leaping deer at the wall of blades and the hills (alive)
  const keys = [[U.slit + 0.015, 22, -3], [U.salmon - 0.055, 30, -10], [U.salmon - 0.012, -50, -5], [U.salmon + 0.012, -50, -5], [U.deerA - 0.05, -8, 0], [U.deerA - 0.018, 24, 2], [U.deerA + 0.006, 24, 3], [U.cross - 0.006, 40, -12], [U.cross + 0.014, -10, -15],
    [U.deerB - 0.02, -40, 1], [U.deerB + 0.01, -38, 2], [U.fox - 0.035, 40, 7], [U.fox - 0.015, 58, 4.5], [U.fox + 0.008, 60, 5], [U.over - 0.05, 10, -10], [U.over - 0.014, -50, 0], [U.over + 0.012, -52, 0],
    [U.rain - 0.022, 22, 7], [U.rain + 0.012, 24, 8], [U.orb0, 58, 2], [U.orbM, 72, -7], [U.orb1 - 0.02, 66, -6], [U.orb1 + 0.006, 16, -14], [U.orb1 + 0.026, 3, -19],
    // down the terraces: the eye dips to each ring of frozen casts as it is reached (they cross the lower third, the arch above them), and lifts to the next
    [U.xFox - 0.024, 0, -27], [U.xFox - 0.010, 0, -31], [U.xFox + 0.001, 0, -13], [U.xDeer - 0.016, 0, -28], [U.xDeer - 0.004, 0, -33], [U.xDeer + 0.011, 0, -14], [U.xSalmon - 0.02, 0, -25], [U.xSalmon - 0.006, 0, -31], [U.xSalmon + 0.008, 0, -9], [0.945, 0, -3]];
  const P = new THREE.Vector3(), T = new THREE.Vector3(), out = new THREE.Vector3();
  const at = (time, u) => {
    u = clamp(u, 0, 1); let k = 0; while (k < keys.length - 2 && u > keys[k + 1][0]) k++;
    const a = keys[k], b = keys[k + 1], f = smoothstep(a[0], b[0], u), yaw = lerp(a[1], b[1], f) * Math.PI / 180, pit = lerp(a[2], b[2], f) * Math.PI / 180;
    path.pointAt(u, P); path.tangentAt(u, T);
    let hx = T.x, hz = T.z; const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
    const rl = Math.hypot(P.x, P.z) || 1, ix = -P.x / rl, iz = -P.z / rl;            // toward the axis
    const side = Math.sign(hx * iz - hz * ix) || 1, c = Math.cos(yaw), sn = Math.sin(yaw) * side;
    const dx = hx * c - hz * sn, dz = hz * c + hx * sn, cp = Math.cos(pit);
    return out.set(P.x + dx * cp * 200, P.y + Math.sin(pit) * 200, P.z + dz * cp * 200);
  };
  return [
    { at: [0, 46, 0], from: 0, to: U.slit + 0.03, weight: 0.5 },
    { at, from: U.slit + 0.004, to: 0.95, weight: 0.93, fade: 0.04 },
    { at: [portalPos.x, portalPos.y + 2, portalPos.z], from: 0.9, to: 1, weight: 0.7, fade: 0.3 },
  ];
}

export default {
  id: 'wheel-of-life',
  name: 'The Wheel of Life',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, q = ctx.quality || { detail: 1 };
    const detail = clamp(q.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- the visit's variations (all drawn first, in a fixed order)
    const paintRoll = rng(), castRoll = rng(), tickRoll = rng(), snowRoll = rng(), sunSide = rng() < 0.5 ? 1 : -1;
    let paintId = paintRoll < 0.45 ? 'spring' : paintRoll < 0.75 ? 'autumn' : 'bronze';
    if (vary.hour === 'golden') paintId = 'autumn'; else if (vary.hour === 'night') paintId = 'bronze'; else if (vary.hour === 'day' || vary.hour === 'dawn') paintId = paintRoll < 0.7 ? 'spring' : paintId;
    const PT = PAINTS[paintId], bronze = paintId === 'bronze';
    const hares = castRoll > 0.62, lynx = castRoll > 0.3 && castRoll < 0.8, tickRate = tickRoll < 0.68 ? 12 : 8, snow = snowRoll < 0.38, rare = !!vary.rare;
    const C = (h) => new THREE.Color(h), mixC = (a, b, t) => a.clone().lerp(b, t);
    const pal = { cream: C(PT.hex[0]), blue: C(PT.hex[1]), coral: C(PT.hex[2]), ochre: C(PT.hex[3]), sage: C(PT.hex[4]), slate: C(PT.hex[5]), plaster: C(PT.plaster) };
    const chalk = bronze ? C('#59646C') : mixC(pal.plaster, pal.cream, 0.35), plasterC = bronze ? C('#6B757C') : pal.plaster, seam = mixC(pal.slate, plasterC, 0.35);
    const sageWash = mixC(plasterC, pal.sage, 0.55), blueWash = mixC(plasterC, pal.blue, 0.5), bare = bronze ? C('#C9B48A') : C('#EDE8DC');
    const LIFT = 1;                                   // post.flat: the paint is shown as written

    const scene = new THREE.Scene();
    scene.background = C(PT.hor);

    // ---- the path (see makeRoute above)
    const { pts, pol, T_ORB0, T_ORB1, R_ORB, Y_ORB0, Y_TOP, Y_ORB1, EXIT_LEN, pe, te, exitPt } = makeRoute();
    await ctx.yield();
    const path = makePath(pts, { samples: 640 });
    await ctx.yield();
    const exitAz = Math.atan2(te[0], te[1]), portalPos = new THREE.Vector3(...exitPt(EXIT_LEN, 16));
    // where things happen along it (u), found from the path itself
    const tmpV = new THREE.Vector3();
    const uNear = (t, r, y) => { const p = pol(t, r, y); let best = 0, bd = 1e9; for (let i = 0; i <= 500; i++) { const v = path.pointAt(i / 500, tmpV), d = Math.hypot(v.x - p[0], v.y - p[1], v.z - p[2]); if (d < bd) { bd = d; best = i / 500; } } return best; };
    const U = { slit: path.nearestXZ(0, -WALL_R).u, salmon: uNear(0.11, 126.5, 10.8), deerA: uNear(0.236, 109.3, 24.5), cross: uNear(0.319, 103.5, 30.6), deerB: uNear(0.425, 96.2, 26.3), fox: uNear(0.665, 80.3, 39.3), over: uNear(0.885, 67.2, 39.8),
      rain: uNear(1.225, 53.2, 56.6), orb0: uNear(T_ORB0, R_ORB, Y_ORB0), orbM: uNear((T_ORB0 + T_ORB1) / 2, R_ORB, (Y_ORB0 + Y_TOP) / 2 + 4), orb1: 0, exitWall: 0 };
    await ctx.yield();
    { let bo = 1e9, bw = 1e9; for (let i = 300; i <= 600; i++) { const v = path.pointAt(i / 600, tmpV), d = Math.hypot(v.x - pe[0], v.z - pe[1]) + Math.abs(v.y - (Y_ORB1 - 2)), w = Math.abs(Math.hypot(v.x, v.z) - WALL_R); if (d < bo) { bo = d; U.orb1 = i / 600; } if (i > 500 && w < bw) { bw = w; U.exitWall = i / 600; } } }
    { const uX = (sx) => { const q = exitPt(sx, 0); let b = 1, bd = 1e9; for (let i = Math.round(U.orb1 * 600); i <= 600; i++) { const v = path.pointAt(i / 600, tmpV), d = Math.hypot(v.x - q[0], v.z - q[2]); if (d < bd) { bd = d; b = i / 600; } } return b; };
      U.xFox = uX(Math.sqrt(74 * 74 - R_ORB * R_ORB)); U.xDeer = uX(Math.sqrt(103 * 103 - R_ORB * R_ORB)); U.xSalmon = uX(Math.sqrt(134 * 134 - R_ORB * R_ORB)); }
    // the schedule: the whole wheel winds up while the camera rises over the deer ring (smear up, lock under the full smear, smear
    // down: sharp and running by the time it is down inside the ring) ... and the reverse at the end of the orbit
    const S = { up0: U.deerA + 0.006, up1: U.cross - 0.012, lock: U.cross - 0.004, dn1: U.cross + 0.021, out0: U.orb1 - 0.008, outLock: U.orb1 + 0.01, out1: U.orb1 + 0.028 };   // the run-down is seen from above as the camera peels off (the whole wheel streaks under it); the terraces below are passed as statues
    const smearAt = (u) => Math.max(smoothstep(S.up0, S.up1, u) * (1 - smoothstep(S.lock + 0.003, S.dn1, u)), smoothstep(S.out0, S.outLock - 0.004, u) * (1 - smoothstep(S.outLock + 0.004, S.out1, u)));
    await ctx.yield();

    // ---- materials: one paint for everything (the mast's), three vertex programs
    // the long painted shadows' measures (round p4; see longShadow below): metres of shadow a metre of height, the bearing against
    // the ring's radius (over a quarter turn: they fall in toward the hub, raked 35 degrees)
    const LONG_K = 3.5, LONG_B = Math.PI - 0.61;
    // (the third mend: ONE bearing only. The cranes and the rain clouds carry no long shadow: neither has room for one at this rake.)
    const hero = await buildHero(ctx, { palette: PT.hex, detail, tick: tickRate, lift: LIFT, deck: true });
    await ctx.yield();
    const HU = hero.uniforms;                          // shared uniform objects: uPx, uLift, uHaze, uCream, uShade, uOval, uCoral, uSkyTop
    HU.uHaze.value.set(PT.hor); HU.uSkyTop.value.set(PT.top); HU.uBare.value.copy(bare);
    HU.uShade.value.setRGB(0.60, 0.69, 0.84); HU.uOval.value.set('#7E97B0');
    if (bronze) { HU.uShade.value.setRGB(0.52, 0.86, 0.80); HU.uOval.value.set('#3F4A52'); HU.uCream.value.set('#C9B48A'); }
    // ONE painted sun, low (29 degrees up) and to the left of the entry heading: it is the sky's disc, the shade side of every upright
    // face and the source of the painted cast shadows (PAINT_FRAG: castSh). The wheel is modelled from the left as it is first seen,
    // the arch is lit three-quarter face on the way out, and the blades lay their shadows across the yard
    const sunAz = Math.PI - 0.9, SUN_TAN = 0.55;
    HU.uSunD.value.set(Math.sin(sunAz), SUN_TAN, Math.cos(sunAz)); HU.uWheel.value.set(0, 1, 0, 0);
    HU.uSunH.value.set(Math.sin(sunAz), Math.cos(sunAz));
    const sharedU = () => ({ uLift: HU.uLift, uPx: HU.uPx, uHaze: HU.uHaze, uCream: HU.uCream, uShade: HU.uShade, uBare: HU.uBare, uOval: HU.uOval, uCoral: HU.uCoral, uSkyTop: HU.uSkyTop, uSunH: HU.uSunH, uSunD: HU.uSunD, uWheel: HU.uWheel, uUnroll: { value: 0 } });
    const ringMat = (mean, piv) => new THREE.ShaderMaterial({
      uniforms: { ...sharedU(), uSmear: { value: 0 }, uDir: { value: 1 }, uMean: { value: mean.clone() }, uRope: { value: new THREE.Vector3(0, 1, 0) }, uSunD: HU.uSunD, uDeckR: { value: new THREE.Vector2(0, 1e4) }, uDeckY: { value: 0 }, uLong: { value: new THREE.Vector4(0, 1, 0, 0) },
        uSh: { value: new THREE.Vector3(...(piv ? piv.sh : [0, 0, 0])) }, uHp: { value: new THREE.Vector3(...(piv ? piv.hp : [0, 0, 0])) }, uNk: { value: new THREE.Vector3(...(piv ? piv.nk : [0, 0, 0])) },
        uTl: { value: new THREE.Vector3(...(piv ? piv.tl : [0, 0, 0])) }, uLeg: { value: new THREE.Vector2(...(piv ? piv.leg : [1, 1])) } },
      vertexShader: RING_VERT, fragmentShader: PAINT_FRAG, fog: false,
    });
    const paintMat = (mean) => new THREE.ShaderMaterial({ uniforms: { ...sharedU(), uSmear: { value: 0 }, uDir: { value: 1 }, uMean: { value: (mean || pal.cream).clone() } }, vertexShader: PAINT_VERT, fragmentShader: PAINT_FRAG, fog: false });

    // ---- the ring builder
    const rings = [], dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
    const instAttrs = (geo, n) => {
      const A = { P0: new Float32Array(n * 4), P1: new Float32Array(n * 4), P2: new Float32Array(n * 4), P3: new Float32Array(n * 4), T: new Float32Array(n * 4) };
      geo.setAttribute('aP0', new THREE.InstancedBufferAttribute(A.P0, 4)); geo.setAttribute('aP1', new THREE.InstancedBufferAttribute(A.P1, 4));
      geo.setAttribute('aP2', new THREE.InstancedBufferAttribute(A.P2, 4)); geo.setAttribute('aP3', new THREE.InstancedBufferAttribute(A.P3, 4)); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(A.T, 4));
      for (let i = 0; i < n; i++) A.T[i * 4 + 3] = 1;
      return A;
    };
    const inst = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; return m; };
    // THE LONG PAINTED SHADOWS (round p4). Every cast of a ring gets one, painted on the deck it stands over: the flat silhouette of
    // its own pose, laid from the foot of its peg, LONG_K metres long for each metre of the cast's height, all at one bearing
    // (LONG_B) against the ring's radius: a low sun that turns with the wheel, so the shadow is paint, a constant of its cast like
    // its pose. It is one more InstancedMesh in the ring's own turntable: a flat cut-out (buildQuadLong and its like) that takes
    // the casts' own instance matrices and pose attributes (the very same buffers) and the ring's own uniforms (the same objects:
    // angle, tick, smear, rope, rig), drawn by RING_VERT with uLong set. So it stands, steps and draws out exactly as its cast does;
    // nothing here reads the flight, the clock or the eye. Its tone (the fourth mend: one rule on every deck, worked in PAINT_FRAG
    // from live's own tones) lies between the deck's tone and the tone of live's lozenge, which lies over it and stays the darker
    // by 21 of 255 in luma: so the material is given the deck's own three paints and the chalk live's lozenges are cut in.
    // o: { band: [inner, outer radius of the deck's track band], ground, bandC, line: the deck's three paints, k: its own length (default LONG_K) }
    const longShadow = (ring, casts, cut, o) => {
      if (!ring.longMat) { const dr = ring.mat.uniforms.uDeckR.value;
        ring.longMat = new THREE.ShaderMaterial({ uniforms: { ...ring.mat.uniforms, uLong: { value: new THREE.Vector4(o.k || LONG_K, Math.cos(o.b || LONG_B), Math.sin(o.b || LONG_B), 0) }, uLongR: { value: new THREE.Vector4(dr.x, dr.y, o.band[0], o.band[1]) },
          uLongG: { value: o.ground.clone() }, uLongB: { value: o.bandC.clone() }, uLongL: { value: o.line.clone() }, uLongC: { value: chalk.clone() } }, vertexShader: RING_VERT, fragmentShader: PAINT_FRAG, fog: false, side: THREE.DoubleSide }); }
      const g = cut.clone(); for (const nm of ['aP0', 'aP1', 'aP2', 'aP3', 'aTint']) g.setAttribute(nm, casts.geometry.getAttribute(nm));
      const m = inst(g, ring.longMat, casts.count); m.instanceMatrix.array.set(casts.instanceMatrix.array); ring.g.add(m); return m;
    };
    // THE DECKS PAINTED LIKE A STUDIO MODEL'S GROUND (round p4): paint in the deck's own shader (PAINT_FRAG, kind 1, uDk), in the
    // deck's own space, repeating exactly once a sector: drifts of flowers on the lawns, the meadow's track worn to the clay, pits
    // and paw prints on the snow, slabs and puddle rings on the wet slate. type: 1 marsh, 2 meadow, 3 snow, 4 wet slate.
    const deckPaint = (ring, type, band, a, b, c) => { const dr = ring.mat.uniforms.uDeckR.value;
      const u = { uDk: { value: new THREE.Vector4(type, ring.step, ring.r, ring.dir) }, uDkR: { value: new THREE.Vector4(band[0], band[1], dr.x, dr.y) }, uDkA: { value: a.clone() }, uDkB: { value: b.clone() }, uDkC: { value: c.clone() } };
      Object.assign(ring.deckMat.uniforms, u); if (type < 3 && ring.longMat) Object.assign(ring.longMat.uniforms, u); };   // a lawn's long shadows carry its flowers too, in the shade's tone
    // o: { r, deckY, dir, count, fixedN, N, mat, cast:{geo,len}, baseY, belly, pose(i, p) -> { y, pitch, P0, P1, P2, tint }, phase(i),
    //      stand:{geo, halfL}, fixed:{geo, len, y}, sector: geo, deck: geo, deckMat, drift }
    async function addRing(o) {
      const g = new THREE.Group(); scene.add(g);
      const Cp = TAU / o.count, F = TAU / o.fixedN, arcC = Cp * o.r, arcF = F * o.r;
      o.mat.uniforms.uDir.value = o.dir; if (o.deckR) { o.mat.uniforms.uDeckR.value.set(o.deckR[0], o.deckR[1]); o.mat.uniforms.uDeckY.value = o.deckY; }
      const casts = inst(o.cast.geo, o.mat, o.count), A = instAttrs(o.cast.geo, o.count);
      const stands = o.stand ? inst(o.stand.geo, o.mat, o.count) : null, B = stands ? instAttrs(o.stand.geo, o.count) : null;
      const repairAt = []; for (let c = 0; c < Math.ceil(o.count / o.N); c++) repairAt.push(c * o.N + rng.int(0, o.N - 1));
      for (let i = 0; i < o.count; i++) {
        const phi = o.dir * i * Cp, p = o.phase ? o.phase(i) : ((i * Cp / F) % 1), ps = o.pose(i, p), x = Math.sin(phi) * o.r, z = Math.cos(phi) * o.r, head = phi + o.dir * Math.PI / 2;
        dummy.position.set(x, o.deckY + o.baseY + ps.y, z); dummy.rotation.set(-ps.pitch, head, 0); dummy.scale.setScalar(o.scale || 1); dummy.updateMatrix(); casts.setMatrixAt(i, dummy.matrix); dummy.scale.setScalar(1);
        if (ps.P0) A.P0.set(ps.P0, i * 4); if (ps.P1) A.P1.set(ps.P1, i * 4); if (ps.P2) A.P2.set(ps.P2, i * 4); if (ps.tint) A.T.set(ps.tint, i * 4);
        A.P3.set([arcC / (o.cast.len * (o.scale || 1)), rng(), repairAt.includes(i) ? 1 : 0, 0], i * 4);
        if (stands) {
          dummy.position.set(x, o.deckY, z); dummy.rotation.set(0, head, 0); dummy.updateMatrix(); stands.setMatrixAt(i, dummy.matrix);
          B.P3.set([arcC / (2 * o.stand.halfL), 0.5, -2, Math.max(0, o.baseY + ps.y - o.belly * Math.cos(ps.pitch))], i * 4);
        }
      }
      g.add(casts); if (stands) g.add(stands);
      await ctx.yield();
      if (o.fixed) {
        const fx = inst(o.fixed.geo, o.mat, o.fixedN), D = instAttrs(o.fixed.geo, o.fixedN);
        for (let j = 0; j < o.fixedN; j++) {
          const phi = o.dir * j * F; dummy.position.set(Math.sin(phi) * o.r, o.deckY + (o.fixed.y || 0), Math.cos(phi) * o.r); dummy.rotation.set(0, phi + o.dir * Math.PI / 2, 0); dummy.updateMatrix(); fx.setMatrixAt(j, dummy.matrix);
          D.P3.set([arcF / o.fixed.len, 0.3, -1, 0], j * 4); if (o.fixed.phase) D.P2[j * 4 + 3] = o.fixed.phase(j);
        }
        g.add(fx);
      }
      await ctx.yield();
      if (o.sector) {
        const sc = inst(o.sector, o.mat, o.fixedN); instAttrs(o.sector, o.fixedN);
        for (let j = 0; j < o.fixedN; j++) { dummy.position.set(0, 0, 0); dummy.rotation.set(0, o.dir * j * F, 0); dummy.updateMatrix(); sc.setMatrixAt(j, dummy.matrix); }
        if (o.sectorPhase) { const at = o.sector.getAttribute('aP2'), tt = o.sector.getAttribute('aTint'); for (let j = 0; j < o.fixedN; j++) { const ph = o.sectorPhase(j), w = 0.5 - 0.5 * Math.cos(ph * TAU), c = pal.cream.clone().lerp(pal.coral, w); at.array[j * 4 + 3] = ph; tt.setXYZW(j, c.r, c.g, c.b, 0.3 + 0.7 * w); } }
        g.add(sc);
      }
      if (o.deck) { const dm = new THREE.Mesh(o.deck, o.deckMat); dm.frustumCulled = false; g.add(dm); }
      if (o.rope) {                    // the band the ring becomes in the smear, and the curtain of blurred pegs under it
        // PAINT_FRAG draws the band's soft lengthwise streaks and pulses (kind 8: uv.x = height across the band, -1..1, beyond
        // that the fringe, which thins out into tapered streak ends) and the peg curtain's thin upright streaks (kind 9)
        const rp = o.rope, st = makeSoup(), nS = 96, K8 = [8, 0, 0, 0], K9 = [9, 0, 0, 0], mean = o.mat.uniforms.uMean.value;
        const P4 = (rad, a, y) => [Math.sin(a) * rad, y, Math.cos(a) * rad];
        const sec = (a) => ringPts(6, (q) => P4(o.r + Math.sin(q + 0.52) * rp.hw, a, rp.y + Math.cos(q + 0.52) * rp.hh)), vOf = (q) => Math.cos(q * Math.PI / 3 + 0.52);
        let A0 = sec(0);
        for (let j = 0; j < nS; j++) {
          const a0 = (j / nS) * TAU, a1 = ((j + 1) / nS) * TAU, A1 = sec(a1), cm = P4(o.r, (a0 + a1) / 2, rp.y), out = P4(1, (a0 + a1) / 2, 0), inn = [-out[0], 0, -out[2]];
          for (let q = 0; q < 6; q++) { const q1 = (q + 1) % 6, hint = [(A0[q][0] + A0[q1][0]) / 2 - cm[0], (A0[q][1] + A0[q1][1]) / 2 - cm[1], (A0[q][2] + A0[q1][2]) / 2 - cm[2]], u0 = [vOf(q), 0], u1 = [vOf(q1), 0];
            st.tri(A0[q], A0[q1], A1[q1], mean, K8, K8, K8, hint, u0, u1, u1); st.tri(A0[q], A1[q1], A1[q], mean, K8, K8, K8, hint, u0, u1, u0); }
          for (const sg of [-1, 1]) for (const nn of [out, inn]) {      // the fringes above and below, seen from outside and from inside the ring
            const y0 = rp.y + sg * rp.hh * 0.8, y1 = rp.y + sg * rp.hh * 1.75, ua = [sg * 1.0, 0], ub = [sg * 2.0, 0];
            st.tri(P4(o.r, a0, y0), P4(o.r, a1, y0), P4(o.r, a1, y1), mean, K8, K8, K8, nn, ua, ua, ub); st.tri(P4(o.r, a0, y0), P4(o.r, a1, y1), P4(o.r, a0, y1), mean, K8, K8, K8, nn, ua, ub, ub);
          }
          const yb = rp.y - rp.hh * 0.8, yd = o.deckY + PLINTH_H;      // the curtain of blurred pegs
          for (const nn of [out, inn]) st.quad(P4(o.r, a0, yd), P4(o.r, a1, yd), P4(o.r, a1, yb), P4(o.r, a0, yb), rp.peg, K9, K9, K9, K9, nn);
          A0 = A1;
        }
        await ctx.yield();
        const rm = new THREE.Mesh(st.geometry(false), new THREE.ShaderMaterial({ uniforms: { ...sharedU(), uSmear: o.mat.uniforms.uSmear, uMean: o.mat.uniforms.uMean, uLine: { value: new THREE.Vector2(o.r, rp.y) } }, vertexShader: ROPE_VERT, fragmentShader: PAINT_FRAG, fog: false }));
        rm.frustumCulled = false; g.add(rm); o.mat.uniforms.uRope.value.set(rp.y, rp.sq, 1);
        await ctx.yield();
      }
      if (o.skin) {
        const sk = o.skin, st = makeSoup(), nS = 60, Rs = sk.R + 1.3, K0 = [0, 0, 0, 0], rows = [];
        for (const [ya, yb, col] of sk.zones) { const n = Math.max(1, Math.round((yb - ya) / 1.15)); for (let k = 0; k < n; k++) rows.push([ya + ((yb - ya) * k) / n, ya + ((yb - ya) * (k + 1)) / n, col.clone().multiplyScalar(k % 2 ? 0.965 : 1.03)]); }
        rows.forEach(([ya, yb, col], k) => { const ub = [(ya + yb) / 2, ((k * 7 + 3) % 10) / 10];
          for (let j = 0; j < nS; j++) { const a0 = (j / nS) * TAU, a1 = ((j + 1) / nS) * TAU, P4 = (a, y) => [Math.sin(a) * Rs, y, Math.cos(a) * Rs], out = [Math.sin((a0 + a1) / 2), 0, Math.cos((a0 + a1) / 2)];
            st.tri(P4(a0, ya), P4(a1, ya), P4(a1, yb), col, K0, K0, K0, out, ub, ub, ub); st.tri(P4(a0, ya), P4(a1, yb), P4(a0, yb), col, K0, K0, K0, out, ub, ub, ub); } });
        const sm = new THREE.Mesh(st.geometry(false), new THREE.ShaderMaterial({ uniforms: { ...sharedU(), uSmear: o.mat.uniforms.uSmear, uMean: o.mat.uniforms.uMean }, vertexShader: SKIN_VERT, fragmentShader: PAINT_FRAG, fog: false }));
        sm.frustumCulled = false; g.add(sm);
        await ctx.yield();
      }
      const ring = { g, mat: o.mat, deckMat: o.deckMat, dir: o.dir, step: (o.stepN ? TAU / o.stepN : F), drift: o.drift || 0, slow: o.slow, lockOff: o.lockOff || 0, period: TAU / Math.max(1, Math.round(o.count / o.N)), off: o.slowOff || 0, angle: 0, tickOff: rings.length * 0.23 + 0.11, r: o.r };
      rings.push(ring);
      await ctx.yield();
      return ring;
    }
    // a sector of ground cover, a service door in the riser and two rail posts, for one fixed-thing pitch of a terrace
    function buildSector(o) {
      const st = soup(), F = TAU / o.fixedN, sp = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r], srng = rng.fork ? rng.fork('sector' + o.fixedN) : rng;
      const n = Math.max(4, Math.round(o.tufts * detail * 0.86 * lerp(0.8, 1, clamp((density - 0.7) / 0.6, 0, 1)) * (snow ? 0.35 : 1)));   // under cast snow most of the grass is left out (and pays for the snow stands)
      for (let k = 0; k < n; k++) {
        const band = o.bands[Math.floor(srng() * o.bands.length)], r = lerp(band[0], band[1], srng()), a = srng() * F, p = sp(r, a, o.y);
        const kind = band[2], h = kind === 'reed' ? 0.7 + srng() * 0.5 : kind === 'snow' ? 0.25 + srng() * 0.3 : 0.3 + srng() * 0.5;
        if (kind === 'snow') {
          if (k % 2) { tuft(st, p[0], o.y, p[2], 0.5, o.grass, srng, 2); continue; }
          const rr = 0.8 + srng() * 0.9, hd = 0.28 + srng() * 0.3, ca = Math.cos(a), sa = Math.sin(a), sq = 0.55 + srng() * 0.2, NR = 6;
          const ringAt = (f, y) => ringPts(NR, (an) => { const lx = Math.sin(an) * rr * f * 1.5, lz = Math.cos(an) * rr * f * sq; return [p[0] + lx * ca + lz * sa, y, p[2] - lx * sa + lz * ca]; });
          const r0 = ringAt(1, o.y), r1 = ringAt(0.66, o.y + hd * 0.7), top = [p[0], o.y + hd, p[2]];
          for (let j = 0; j < NR; j++) { const j1 = (j + 1) % NR, hint = [r0[j][0] + r0[j1][0] - 2 * p[0], 1.2, r0[j][2] + r0[j1][2] - 2 * p[2]], col = j === 2 || j === 3 ? o.snowShade : o.snow;
            st.quad(r0[j], r0[j1], r1[j1], r1[j], col, K(), K(), K(), K(), hint); st.tri(r1[j], r1[j1], top, j === 3 ? o.snowShade : o.snow, K(), null, null, [0, 1, 0]); }
        }
        else tuft(st, p[0], o.y, p[2], h, kind === 'reed' ? o.reed : (srng() < 0.3 ? o.grass2 : o.grass), srng, kind === 'reed' ? 3 : 2);
      }
      // the service door (2 m) at the foot of the riser below this terrace's rim, with a cream frame and a brass handle
      const R = o.R + 0.02, a0 = F * 0.5, hw = 0.55 / R, y0 = o.y0, door = [sp(R, a0 - hw, y0), sp(R, a0 + hw, y0), sp(R, a0 + hw, y0 + 2), sp(R, a0 - hw, y0 + 2)], out = sp(1, a0, 0);
      const fr = [sp(R - 0.01, a0 - hw * 1.3, y0), sp(R - 0.01, a0 + hw * 1.3, y0), sp(R - 0.01, a0 + hw * 1.3, y0 + 2.2), sp(R - 0.01, a0 - hw * 1.3, y0 + 2.2)];
      st.quad(fr[0], fr[1], fr[2], fr[3], o.frame, K(), K(), K(), K(), out); st.quad(door[0], door[1], door[2], door[3], o.door, K(), K(), K(), K(), out);
      box(st, sp(R + 0.03, a0 + hw * 0.6, y0 + 1), 0.04, 0.04, 0.04, o.brass, a0);
      // rail posts on the rim and a brass rail between them (chords of the periodic polygon)
      for (let k = 0; k < 2; k++) { const a = F * (k / 2), b = F * ((k + 1) / 2), p = sp(o.R - 0.28, a, o.y + 0.32), q2 = sp(o.R - 0.28, b, o.y + 0.32); if (k === 0) box(st, [p[0], p[1] + 0.45, p[2]], 0.05, 0.45, 0.05, o.post, a);
        limb(st, [p[0], p[1] + 0.9, p[2]], [q2[0], q2[1] + 0.9, q2[2]], 0.04, 0.04, 3, o.brass, K(0, 0, 0, 30), K(0, 0, 0, 30)); }
      // a pilaster with a coral capital on the riser at each sector joint, and two small slate lights between
      const DEP = o.dress ? 0.6 : 0, yA = o.y0 + 1.1, yB = o.y - 1.75, pd = (DEP + 0.32) / 2, pc = sp(o.R + pd, 0, (yA + yB) / 2);
      box(st, pc, 0.42, (yB - yA) / 2, pd, o.pil, 0); box(st, [pc[0], yB - 0.25, pc[2] + 0.06], 0.52, 0.2, pd + 0.06, o.cap, 0);
      for (const fa of [0.27, 0.73]) { const aw = F * fa, hw2 = 0.38 / R, wy = o.y - 3.9, lit = [sp(R + 0.06, aw - hw2, wy), sp(R + 0.06, aw + hw2, wy), sp(R + 0.06, aw + hw2, wy + 1.0), sp(R + 0.06, aw - hw2, wy + 1.0)], fr2 = [sp(R + 0.05, aw - hw2 * 1.4, wy - 0.15), sp(R + 0.05, aw + hw2 * 1.4, wy - 0.15), sp(R + 0.05, aw + hw2 * 1.4, wy + 1.15), sp(R + 0.05, aw - hw2 * 1.4, wy + 1.15)], o2 = sp(1, aw, 0);
        st.quad(fr2[0], fr2[1], fr2[2], fr2[3], o.frame, K(), K(), K(), K(), o2); st.quad(lit[0], lit[1], lit[2], lit[3], o.door, K(), K(), K(), K(), o2); }
      if (o.extra) o.extra(st, sp, F, srng);
      // the riser's dress (the scale cue): a blind arcade round the lights, a painted roundel over each door that waxes and
      // wanes from sector to sector (part 6: in lock it pulses once a cycle), a railed gallery on the string course and a stair up to it
      if (o.dress) {
        const K0 = K(), fan = (rad, aC, yC, hwM, yB, col) => { const hw3 = hwM / R, pts2 = [sp(rad, aC - hw3, yB)]; for (let q = 0; q <= 6; q++) { const t = Math.PI * (q / 6); pts2.push(sp(rad, aC - hw3 * Math.cos(t), yC + hwM * Math.sin(t))); } pts2.push(sp(rad, aC + hw3, yB));
          const c = sp(rad, aC, (yC + yB) / 2), o3 = sp(1, aC, 0); for (let q = 0; q < pts2.length - 1; q++) st.tri(c, pts2[q], pts2[q + 1], col, K0, K0, K0, o3); st.tri(c, pts2[pts2.length - 1], pts2[0], col, K0, K0, K0, o3); };
        // the arcade is REAL depth: the riser's upper band stands DEP proud of the lathe wall as a screen pierced by two arches a
        // sector, so each arch is a recess with a dark back wall and two reveals that take the painted light and shade
        const RP = R + DEP, yT = o.y - 1.72, yBm = o.y - 5.78, yC = o.y - 3.2, hwM = 1.25, hw3 = hwM / RP, NA = 5, tg = (a) => [Math.cos(a), 0, -Math.sin(a)];
        const pan = (a, b2) => st.quad(sp(RP, a, yBm), sp(RP, b2, yBm), sp(RP, b2, yT), sp(RP, a, yT), o.wash, K0, K0, K0, K0, sp(1, (a + b2) / 2, 0));
        let aPrev = 0;
        for (const fa of [0.27, 0.73]) {
          const aC = F * fa, o3 = sp(1, aC, 0), cv = []; for (let q = 0; q <= NA; q++) { const t = Math.PI * (q / NA); cv.push([aC - hw3 * Math.cos(t), yC + hwM * Math.sin(t)]); }
          pan(aPrev, aC - hw3); aPrev = aC + hw3;
          fan(R + 0.02, aC, yC, hwM + 0.05, yBm, o.arcBack);
          for (let q = 0; q < NA; q++) { const [a1, y1] = cv[q], [a2, y2] = cv[q + 1], cm = sp(R, aC, yC - 0.4), mid = sp(R, (a1 + a2) / 2, (y1 + y2) / 2);
            st.quad(sp(RP, a1, y1), sp(RP, a2, y2), sp(RP, a2, yT), sp(RP, a1, yT), o.wash, K0, K0, K0, K0, o3);
            st.quad(sp(R, a1, y1), sp(R, a2, y2), sp(RP, a2, y2), sp(RP, a1, y1), o.frame, K0, K0, K0, K0, [cm[0] - mid[0], cm[1] - mid[1], cm[2] - mid[2]]); }
          for (const sg of [-1, 1]) { const aj = aC + sg * hw3, t3 = tg(aj); st.quad(sp(R, aj, yBm), sp(RP, aj, yBm), sp(RP, aj, yC), sp(R, aj, yC), o.frame, K0, K0, K0, K0, [-sg * t3[0], 0, -sg * t3[2]]); }
        }
        pan(aPrev, F);
        st.quad(sp(R, 0, yT), sp(RP, 0, yT), sp(RP, F, yT), sp(R, F, yT), o.pil, K0, K0, K0, K0, [0, 1, 0]); st.quad(sp(R, 0, yBm), sp(RP, 0, yBm), sp(RP, F, yBm), sp(R, F, yBm), o.arcBack, K0, K0, K0, K0, [0, -1, 0]);
        const RD = R + DEP, yR = o.y - 3.7, cR = sp(RD + 0.07, F * 0.5, yR), disc = (rad, rr, col, rig) => { const pr = ringPts(8, (q) => sp(rad, F * 0.5 + Math.sin(q) * rr / R, yR + Math.cos(q) * rr)), c = sp(rad, F * 0.5, yR), o3 = sp(1, F * 0.5, 0); for (let q = 0; q < 8; q++) st.tri(c, pr[q], pr[(q + 1) % 8], col, rig, rig, rig, o3); };
        disc(RD + 0.02, 1.25, o.frame, K0); disc(RD + 0.04, 1.05, o.door, K0); st.ctr(cR); disc(RD + 0.07, 0.95, o.frame, K(6, 0, 0, 3)); st.ctr([0, 0, 0]);
      }
      if (o.dress > 1) {
        const yg = o.y - 6.0, W = 0.9, K0 = K(), B3 = K(0, 0, 0, 30);
        for (let k = 0; k < 2; k++) { const a = F * (k / 2), b = F * ((k + 1) / 2), up = [0, 1, 0], o3 = sp(1, (a + b) / 2, 0);
          st.quad(sp(R, a, yg), sp(R + W, a, yg), sp(R + W, b, yg), sp(R, b, yg), o.pil, K0, K0, K0, K0, up); st.quad(sp(R + W, a, yg - 0.22), sp(R + W, b, yg - 0.22), sp(R + W, b, yg), sp(R + W, a, yg), o.frame, K0, K0, K0, K0, o3);
          st.quad(sp(R, a, yg - 0.22), sp(R + W, a, yg - 0.22), sp(R + W, b, yg - 0.22), sp(R, b, yg - 0.22), o.post, K0, K0, K0, K0, [0, -1, 0]);
          limb(st, sp(R + W - 0.06, a, yg + 1.0), sp(R + W - 0.06, b, yg + 1.0), 0.045, 0.045, 3, o.brass, B3, B3); limb(st, sp(R + W - 0.06, a, yg), sp(R + W - 0.06, a, yg + 1.0), 0.035, 0.035, 3, o.post, K0, K0); }
        const n = 10, aS = F * 0.1, aE2 = F * 0.9, rise = yg - o.y0, hA = (k) => o.y0 + (k * rise) / n, aA = (k) => aS + ((aE2 - aS) * k) / n, tng = sp(1, -Math.PI / 2, 0);
        for (let k = 0; k < n; k++) { const a = aA(k), b = aA(k + 1), h = hA(k + 1);
          st.quad(sp(R, a, h), sp(R + W, a, h), sp(R + W, b, h), sp(R, b, h), o.pil, K0, K0, K0, K0, [0, 1, 0]); st.quad(sp(R, a, hA(k)), sp(R + W, a, hA(k)), sp(R + W, a, h), sp(R, a, h), o.arc, K0, K0, K0, K0, tng); }
        st.quad(sp(R + W + 0.02, aS, o.y0 - 0.3), sp(R + W + 0.02, aE2, yg - 0.5), sp(R + W + 0.02, aE2, yg), sp(R + W + 0.02, aS, o.y0 + 0.55), o.frame, K0, K0, K0, K0, sp(1, F * 0.5, 0));
        limb(st, sp(R + W - 0.05, aS, o.y0 + 1.6), sp(R + W - 0.05, aE2, yg + 1.0), 0.045, 0.045, 3, o.brass, B3, B3);
        for (const k of [0, 5]) limb(st, sp(R + W - 0.05, aA(k), hA(k) + 0.5), sp(R + W - 0.05, aA(k), hA(k) + 1.6), 0.035, 0.035, 3, o.post, K0, K0);
      }
      return finish(st);
    }
    const terraceDeck = async (i, segs, stripes, bands, wash, ground = chalk, dado = plasterC) => {
      const st = makeSoup(), R = RIM[i], y = DECK[i], y0 = i ? DECK[i - 1] : 0, Rin = RIM[i + 1] - 0.3, D1 = (r, col) => pp(r, y, col, 1);
      const prof = [pp(R + 0.3, y0, seam), pp(R + 0.3, y0 + 0.8, blueWash), pp(R, y0 + 1.1, dado), pp(R, y - 6.2, seam), pp(R - 0.1, y - 6.1, seam), pp(R - 0.1, y - 5.9, plasterC), pp(R, y - 5.8, wash), pp(R, y - 1.7, seam),
        pp(R + 0.12, y - 1.6, chalk, 2), pp(R + 0.12, y - 0.1, chalk), pp(R, y, chalk), pp(R, y + 0.32, chalk), pp(R - 0.55, y + 0.32, plasterC), pp(R - 0.55, y, ground, 1)];
      for (const b of bands) prof.push(b);
      prof.push(D1(Rin, ground));
      const pr = prof.map((p) => (p.y === undefined ? { ...p, y } : p)), hf = Math.ceil(pr.length / 2);   // in two halves: a 216-segment lathe is a long step
      lathe(st, pr.slice(0, hf + 1), segs, stripes); await ctx.yield(); lathe(st, pr.slice(hf), segs, stripes); await ctx.yield();
      return st.geometry(false);
    };

    // ---- the casts
    const cream = pal.cream, slate = pal.slate, brass = pal.ochre;
    const quadPose = (keys, lr = 0.03) => (i, p) => {
      const a = keyAt(keys, p), l = keyAt(keys, p - lr), r = keyAt(keys, p + lr);
      return { y: a[0], pitch: a[1], P0: [l[2], l[3], r[2], r[3]], P1: [l[4], l[5], r[4], r[5]], P2: [-a[6], -a[7], a[8], 0] };
    };
    const deerCoat = C(PT.deer), foxCoat = C(PT.fox), belly = bronze ? mixC(pal.ochre, pal.cream, 0.35) : cream, dark = bronze ? C('#1B2226') : slate;
    const deer = hares
      ? buildQuadruped({ L: 1.7, bh: 0.42, bw: 0.3, up: 0.5, lo: 0.5, legR: 0.07, haunch: 2.0, neck: 0.45, neckAng: 0.85, head: 0.5, headR: 0.19, ear: 0.95, tail: 0.24, tailR: 0.15, tailDrop: -0.5, tailTip: cream, rump: true, paw: 0.16, coat: deerCoat, belly, dark, bare, earIn: mixC(pal.coral, cream, 0.5) })
      : buildQuadruped({ L: 1.9, bh: 0.37, bw: 0.25, up: 0.64, lo: 0.62, legR: 0.055, neck: 0.9, neckAng: 0.95, head: 0.52, headR: 0.15, ear: 0.27, antler: 0.6, tail: 0.24, tailR: 0.07, tailDrop: 0.6, rump: true, sock: mixC(deerCoat, dark, 0.35), coat: deerCoat, belly, dark, bare, spots: bronze ? null : mixC(deerCoat, cream, 0.45) });
    await ctx.yield();
    const fox = lynx
      ? buildQuadruped({ L: 1.5, bh: 0.3, bw: 0.23, up: 0.5, lo: 0.46, legR: 0.07, neck: 0.36, neckAng: 0.6, head: 0.36, headR: 0.18, ear: 0.2, tuft: 0.2, tail: 0.3, tailR: 0.09, tailDrop: 0.5, tailTip: dark, chest: true, paw: 0.14, coat: mixC(foxCoat, pal.ochre, 0.55), belly, dark, bare, spots: mixC(foxCoat, dark, 0.5) })
      : buildQuadruped({ L: 1.5, bh: 0.25, bw: 0.2, up: 0.42, lo: 0.4, legR: 0.05, neck: 0.42, neckAng: 0.5, head: 0.46, headR: 0.135, ear: 0.24, tail: 1.05, tailR: 0.18, tailDrop: 0.2, tailTip: cream, chest: true, sock: dark, paw: 0.1, coat: foxCoat, belly, dark, bare, earIn: dark });
    await ctx.yield();
    const salmon = buildSalmon({ L: 2.6, coat: bronze ? C('#7A6A48') : pal.blue, belly, dark, flash: pal.coral });
    await ctx.yield();
    const longCut = { deer: buildQuadLong(deer.o).geo, fox: buildQuadLong(fox.o).geo, salmon: buildSalmonLong({ L: 2.6 }).geo, crane: buildCraneLong() };   // the flat cut-outs (round p4): long shadows and the yard's chalk figures
    const birch = buildBirch({ H: 7, bark: bronze ? C('#8C7A55') : mixC(C('#EDE8DC'), slate, 0.34), dark }, rng.fork ? rng.fork('birch') : rng);
    await ctx.yield();
    const cloudG = buildRainCloud({ cream: bronze ? C('#9C8558') : cream, bellyC: bronze ? C('#4F7F74') : mixC(pal.sage, C('#8A9690'), 0.5), brass, bead: mixC(pal.blue, cream, 0.3), foil: mixC(pal.blue, cream, 0.35), dark, stalk: 9, plinth: plasterC }, rng.fork ? rng.fork('cloud') : rng);
    await ctx.yield();
    const standO = { plaster: plasterC, chalk, brass }, DS = hares ? 1.25 : 1.12, FS = 1.4;
    const stones = [plasterC, mixC(plasterC, slate, 0.18), mixC(plasterC, pal.blue, 0.25), mixC(plasterC, cream, 0.4)];
    const snowC = bronze ? C('#A9B4B8') : C('#F1EEE6'), snowShade = bronze ? C('#7E8C92') : C('#B4C6D8');
    // weather: cast snow on wires (beads that step down a wire in lock), one stand a sector
    const snowStand = (rad, y, hgt, nW = 2) => (st, sp, F, srng) => {
      if (!snow) return;
      const a = F * 0.3, foot = sp(rad, a, y), top = sp(rad, a, y + hgt), B3 = K(0, 0, 0, 30), cx = top[0], cz = top[2];
      limb(st, foot, top, 0.07, 0.05, 3, brass, B3, B3);
      const lr = [[0, 1.05], [0.3, 1.15], [0.75, 0.6], [0.95, 0.12]].map(([yy, rr]) => ({ c: [cx, y + hgt + yy, cz], pts: ringPts(5, (an) => [cx + Math.sin(an) * rr, y + hgt + yy, cz + Math.cos(an) * rr * 0.75]) }));
      st.tube(lr, (i) => (i === 0 ? snowShade : snowC), () => K(), snowShade, snowC);
      for (let k = 0; k < nW; k++) {
        const an = k * 2.1 + 0.4, tip = [cx + Math.sin(an) * 0.6, y + hgt, cz + Math.cos(an) * 0.45], ph = srng(), drop = 1.5;
        limb(st, tip, [tip[0], y + 0.5, tip[2]], 0.014, 0.014, 3, dark, K(), K());
        for (let b = 0; b < Math.floor((hgt - 1) / drop); b++) { const c = [tip[0], tip[1] - 0.15 - b * drop, tip[2]], r = 0.12, R7 = K(7, ph, drop, 0), eq = ringPts(3, (q4) => [c[0] + Math.sin(q4) * r, c[1], c[2] + Math.cos(q4) * r]);
          for (let j = 0; j < 3; j++) { const h2 = [eq[j][0] + eq[(j + 1) % 3][0] - 2 * c[0], 0, eq[j][2] + eq[(j + 1) % 3][2] - 2 * c[2]]; st.tri(eq[j], eq[(j + 1) % 3], [c[0], c[1] + r * 1.2, c[2]], snowC, R7, R7, R7, [h2[0], 0.5, h2[2]]); st.tri(eq[j], eq[(j + 1) % 3], [c[0], c[1] - r * 1.2, c[2]], snowShade, R7, R7, R7, [h2[0], -0.5, h2[2]]); } }
      }
    };
    const sectorO = (i, fixedN, tufts, bands, extra, dress = 2, wash = plasterC) => ({ dress, wash, arcBack: mixC(wash, mixC(slate, pal.blue, 0.45), bronze ? 0.5 : 0.42), arc: mixC(wash, slate, 0.2), fixedN, tufts, bands, y: DECK[i], y0: i ? DECK[i - 1] : 0, R: RIM[i], grass: mixC(pal.sage, pal.slate, bronze ? 0.1 : 0.32), grass2: mixC(pal.ochre, pal.cream, 0.3), reed: mixC(pal.sage, pal.ochre, 0.5), snow: snowC, snowShade, frame: cream, door: seam, brass, post: seam, pil: chalk, cap: pal.coral, extra });
    const skinO = (i, wash, dress = 2, dado = plasterC) => { const y = DECK[i], y0 = i ? DECK[i - 1] : 0, arcB = mixC(wash, mixC(slate, pal.blue, 0.45), bronze ? 0.5 : 0.42), foot = mixC(plasterC, seam, 0.1);
      return { R: RIM[i], zones: dress > 1 ? [[y0 + 0.3, y0 + 2.5, foot], [y0 + 2.5, y - 6.3, mixC(dado, cream, 0.15)], [y - 6.3, y - 5.8, mixC(chalk, seam, 0.4)], [y - 5.8, y - 4.6, mixC(wash, arcB, 0.25)], [y - 4.6, y - 2.9, mixC(wash, arcB, 0.55)], [y - 2.9, y - 1.72, mixC(wash, arcB, 0.12)]]
        : [[y0 + 0.3, y0 + 1.6, foot], [y0 + 1.6, y - 5.8, mixC(dado, cream, 0.15)], [y - 5.8, y - 4.4, mixC(wash, arcB, 0.25)], [y - 4.4, y - 2.9, mixC(wash, arcB, 0.55)], [y - 2.9, y - 1.72, mixC(wash, arcB, 0.12)]] }; };
    const D1 = (r, y, col) => pp(r, y, col, 1), coralLine = pal.coral;
    const band = (y, rIn, rOut, col, kind = 1, ground = chalk, line = coralLine) => [D1(rOut + 0.3, y, ground), pp(rOut, y, line), pp(rOut - 0.3, y, col, kind), pp((rIn + rOut) / 2, y, col, kind), pp(rIn + 0.3, y, line), D1(rIn, y, ground)];
    const marsh = C(PT.marsh), meadow = C(PT.meadow), wet = C(PT.wet);
    const dado = [plasterC, mixC(plasterC, pal.coral, 0.26), mixC(plasterC, pal.blue, 0.62), mixC(plasterC, pal.sage, 0.55)];   // behind the salmon, the deer, the foxes

    const ropeO = (mean, y, hh, hw, sq, per) => ({ y, hh, hw, sq, per, pale: mixC(mean, cream, 0.42), deep: mixC(mean, slate, 0.24), peg: mixC(brass, chalk, 0.12), peg2: mixC(brass, chalk, 0.7), hoof: mixC(slate, mean, 0.25) });
    // T1: salmon clearing weirs over a foil channel (anticlockwise)
    const foilC = mixC(pal.blue, cream, 0.3);
    const salmonPose = (i, p) => { const a = keyAt(SALMON_KEYS, p); return { y: a[0], pitch: a[1], P2: [0, 0, a[8], 0] }; };
    const fx0 = buildWeir({ half: 2.3, stone: stones[1], stone2: stones[0], cap: cream, water: foilC });
    await ctx.yield();
    const sec0 = buildSector(sectorO(0, 108, 17, [[127.5, 130.3, 'reed'], [137.6, 140.5, 'reed'], [119, 127, 'grass'], [141, 148.5, 'grass']], snowStand(120.4, DECK[0], 4.6, 1), 1, mixC(plasterC, pal.blue, 0.38)));
    await ctx.yield();
    const deck0 = await terraceDeck(0, 216, 648, band(DECK[0], 131, 137, foilC, 5, marsh, cream), mixC(plasterC, pal.blue, 0.38), marsh);
    await ctx.yield();
    const rSalmon = await addRing({ r: 134, deckY: DECK[0], dir: 1, count: 112, fixedN: 108, N: 28, mat: ringMat(mixC(pal.blue, cream, 0.3)), cast: { geo: salmon.geo, len: 2.6 }, scale: 2.0, baseY: 1.0, belly: 0.58, pose: salmonPose,
      stand: { geo: buildStand({ ...standO, halfL: 0.55, halfW: 0.35, sh: [1.8, 0.5, 0.3] }).geo, halfL: 0.55 }, fixed: { geo: fx0.geo, len: 0.9 }, deckR: [118.6, 149.2],
      sector: sec0, sectorPhase: (j) => (((-j / 12) % 1) + 1) % 1,
      deck: deck0, deckMat: paintMat(), skin: skinO(0, mixC(plasterC, pal.blue, 0.38), 1), slow: 4.5 / 134, drift: 2 / 134, slowOff: 0.548, rope: ropeO(mixC(pal.blue, cream, 0.3), DECK[0] + 1.25, 0.46, 0.26, 0.32, 2) });
    // (the band's paint for the tone rule: the foil at the deepest of its three sky steps, PAINT_FRAG kind 5: 0.7 of the way to the sky's top)
    longShadow(rSalmon, rSalmon.g.children[0], longCut.salmon, { band: [131, 137], ground: marsh, bandC: mixC(foilC, C(PT.top), 0.7), line: cream });
    deckPaint(rSalmon, 1, [131, 137], pal.ochre, cream, cream);
    await ctx.yield();
    // T2: deer (or hares) leaping dry-stone walls (clockwise, the way we fly)
    const fx1 = buildWall({ half: 2.6, stones, cap: cream }, rng.fork ? rng.fork('wall') : rng);
    await ctx.yield();
    const sec1 = buildSector(sectorO(1, 72, 40, [[105.8, 117.2, 'grass'], [106, 113, 'grass'], [106, 110, 'grass'], [96, 100.2, 'grass'], [89, 100, 'grass']], snowStand(91.4, DECK[1], 6.5), 2, mixC(plasterC, pal.sage, 0.45)));
    await ctx.yield();
    const deck1 = await terraceDeck(1, 144, 504, band(DECK[1], 100.4, 105.6, mixC(meadow, cream, 0.45), 1, meadow, cream), mixC(plasterC, pal.sage, 0.45), meadow, dado[1]);
    await ctx.yield();
    const rDeer = await addRing({ r: 103, deckY: DECK[1], dir: -1, count: 75, fixedN: 72, N: 25, mat: ringMat(mixC(deerCoat, cream, 0.35), deer.piv), cast: { geo: deer.geo, len: deer.len }, scale: DS, baseY: PLINTH_H + deer.stand * DS, belly: 0.33 * DS, pose: quadPose(DEER_KEYS),
      stand: { geo: buildStand({ ...standO, halfL: 1.3, halfW: 0.55, sh: [1.7 * DS / 1.12, 0.6, 0.45] }).geo, halfL: 1.3 }, fixed: { geo: fx1.geo, len: 0.7 }, deckR: [89.2, 117.2],
      sector: sec1, sectorPhase: (j) => (((-j / 12) % 1) + 1) % 1,
      deck: deck1, deckMat: paintMat(), skin: skinO(1, mixC(plasterC, pal.sage, 0.45), 2, dado[1]), slow: 5 / 103, drift: 1.6 / 103, rope: ropeO(mixC(deerCoat, cream, 0.35), DECK[1] + PLINTH_H + deer.stand * DS + 0.45, 0.76, 0.4, 0.3, 4), lockOff: 0.063, slowOff: 0.017 });
    longShadow(rDeer, rDeer.g.children[0], longCut.deer, { band: [100.4, 105.6], ground: meadow, bandC: mixC(meadow, cream, 0.45), line: cream });
    deckPaint(rDeer, 2, [100.4, 105.6], pal.ochre, cream, C(PT.gravel));
    await ctx.yield();
    // T3: foxes (or lynx) pouncing nose-first into snow tussocks (anticlockwise), and the ring of birches on its own turntable
    const fx2 = buildTussock({ snow: snowC, shade: snowShade, grass: sageWash }, rng.fork ? rng.fork('tus') : rng);
    await ctx.yield();
    const sec2 = buildSector(sectorO(2, 46, 46, [[62, 72, 'snow'], [86.1, 87.4, 'snow'], [76.4, 77.6, 'snow'], [62.5, 71.2, 'grass'], [76.8, 87, 'grass'], [77, 87, 'grass']], snowStand(86.0, DECK[2], 2.5), 2, mixC(plasterC, pal.coral, 0.3)));
    await ctx.yield();
    const deck2 = await terraceDeck(2, 138, 368, band(DECK[2], 70.4, 86.4, snowC, 1, snowC), mixC(plasterC, pal.coral, 0.3), snowC, dado[2]);
    await ctx.yield();
    const rFox = await addRing({ r: 74, deckY: DECK[2], dir: 1, count: 48, fixedN: 46, N: 24, mat: ringMat(mixC(foxCoat, cream, 0.35), fox.piv), cast: { geo: fox.geo, len: fox.len + 0.8 }, scale: FS, baseY: PLINTH_H + fox.stand * FS, belly: 0.22 * FS, pose: quadPose(FOX_KEYS, 0.02),
      stand: { geo: buildStand({ ...standO, halfL: 1.2, halfW: 0.5, sh: [1.6, 0.55, 0.35] }).geo, halfL: 1.2 }, fixed: { geo: fx2.geo, len: 3.1 }, deckR: [56.6, 87.2],
      sector: sec2, sectorPhase: (j) => (((-j / 23) % 1) + 1) % 1,
      deck: deck2, deckMat: paintMat(), skin: skinO(2, mixC(plasterC, pal.coral, 0.3), 2, dado[2]), slow: 3.6 / 74, drift: -1.2 / 74, rope: ropeO(mixC(foxCoat, cream, 0.35), DECK[2] + PLINTH_H + fox.stand * FS + 0.5, 0.54, 0.34, 0.3, 4), lockOff: 2.883 });
    // THE SECOND TRAIN OF FOXES (the designer's amendments of 7 Oct 2026: the fox ring holds 96 casts in two trains; the second train
    // stands on bare pegs). Live's 48 casts are not touched. 48 more stand half a cast pitch after each of them, by the law live's
    // casts follow in addRing with the place k = i + 0.5 where live has i: bearing dir * k * Cp, pose quadPose at p = (k * Cp / F) % 1,
    // the cast's own place between two tussocks (quadPose reads only p). Each rides a brass peg set straight into the deck, drawn up
    // to its belly, and throws its painted cast shadow and peg line as live's casts do; it has no plinth and no painted oval (the
    // plinths are the first train's). Its stand is a copy of the geometry of live's fox stand less the triangles live's buildStand
    // marks part 0 (the plinth's four sides and its top with the oval): what is kept is part 9, the peg, and part 8, the lozenge and
    // peg line of shadowProxy. They are two more InstancedMeshes in the fox ring's own turntable and material
    // (rFox.g, rFox.mat), so the ring's angle, tick, smear, rope and painted sun move and paint them with the first train, and
    // nothing here reads the flight, the clock or the eye. Read from what live's ring call made: the count of casts and of tussocks
    // (the first three children of rFox.g are live's casts, stands and tussocks, as addRing adds them), radius, direction, cycle
    // length, deck height, both geometries, the smear stretch of live's casts (their aP3.x) and the smear stretch, mottle seed and
    // class of live's stands (their aP3.xyz). Typed here as live's call types them: the scale FS, the base height, the belly
    // 0.22 * FS and quadPose(FOX_KEYS, 0.02). One cast in each cycle of 24 is a repair (class 1: the bare ear), drawn as live draws
    // its own. The dice are a stream of its own ('fox-between:' + the seed): one mottle draw a cast, then one repair draw a cycle;
    // no draw of the world's stream moves. With FOX_BETWEEN false the world is live's.
    if (FOX_BETWEEN) {
      const [c1, s1, f1] = rFox.g.children, a1 = c1.geometry.getAttribute('aP3').array, b1 = s1.geometry.getAttribute('aP3').array;
      const n = c1.count, Cp = TAU / n, F = TAU / f1.count, N = n / Math.round(TAU / rFox.period), r = rFox.r, dir = rFox.dir, deckY = rFox.mat.uniforms.uDeckY.value;
      const baseY = PLINTH_H + fox.stand * FS, bel = 0.22 * FS, pose = quadPose(FOX_KEYS, 0.02), frng = ctx.core.makeRng(ctx.core.hashSeed('fox-between:' + ctx.seed));
      const g2 = c1.geometry.clone(), c2 = inst(g2, rFox.mat, n), A = instAttrs(g2, n), sg = s1.geometry.clone(), s2 = inst(sg, rFox.mat, n), B = instAttrs(sg, n);
      const rig = sg.getAttribute('aRig'), keep = []; for (let v = 0; v < rig.count; v += 3) if (rig.getX(v) > 7.5 && rig.getX(v + 1) > 7.5 && rig.getX(v + 2) > 7.5) keep.push(v, v + 1, v + 2);   // the bare peg: parts 9 and 8 stay, the plinth (part 0) is left out
      for (const [nm, a] of Object.entries(sg.attributes)) if (!a.isInstancedBufferAttribute) { const o = new Float32Array(keep.length * a.itemSize); keep.forEach((v, j) => o.set(a.array.subarray(v * a.itemSize, (v + 1) * a.itemSize), j * a.itemSize)); sg.setAttribute(nm, new THREE.BufferAttribute(o, a.itemSize)); }
      for (let i = 0; i < n; i++) {
        const k = i + 0.5, phi = dir * k * Cp, p = (k * Cp / F) % 1, ps = pose(k, p), x = Math.sin(phi) * r, z = Math.cos(phi) * r, head = phi + dir * Math.PI / 2;
        dummy.position.set(x, deckY + baseY + ps.y, z); dummy.rotation.set(-ps.pitch, head, 0); dummy.scale.setScalar(FS); dummy.updateMatrix(); c2.setMatrixAt(i, dummy.matrix); dummy.scale.setScalar(1);
        A.P0.set(ps.P0, i * 4); A.P1.set(ps.P1, i * 4); A.P2.set(ps.P2, i * 4); A.P3.set([a1[0], frng(), 0, 0], i * 4);
        dummy.position.set(x, deckY, z); dummy.rotation.set(0, head, 0); dummy.updateMatrix(); s2.setMatrixAt(i, dummy.matrix);
        B.P3.set([b1[0], b1[1], b1[2], Math.max(0, baseY + ps.y - bel * Math.cos(ps.pitch))], i * 4);
      }
      for (let c = 0; c < Math.ceil(n / N); c++) A.P3[(c * N + frng.int(0, N - 1)) * 4 + 2] = 1;
      rFox.g.add(c2, s2);
    }
    {  // the foxes' long painted shadows, both trains (the second train's casts are the last but one child of the ring, as the block above adds them)
      const cut = longCut.fox, o = { band: [70.4, 86.4], ground: snowC, bandC: snowC, line: coralLine }, train2 = FOX_BETWEEN ? rFox.g.children[rFox.g.children.length - 2] : null;
      longShadow(rFox, rFox.g.children[0], cut, o);
      if (train2) longShadow(rFox, train2, cut, o);
      deckPaint(rFox, 3, [70.4, 86.4], new THREE.Color(snowC.r * 0.62, snowC.g * 0.7, snowC.b * 0.9), snowShade, new THREE.Color(train2 ? TAU / train2.count : 0, 0, 0));   // (the third paint's first number carries the cast pitch: a contact shadow at each bare peg's foot)
      await ctx.yield();
    }
    const leafC = PT.leaf.map(C), year = (i) => (((-i / 12) % 1) + 1) % 1;
    const birchPose = (i) => { const y = year(i), sc = y < 0.1 ? 0.02 : y < 0.22 ? lerp(0.2, 0.5, (y - 0.1) / 0.12) : y < 0.7 ? 1 : y < 0.84 ? lerp(0.95, 0.7, (y - 0.7) / 0.14) : y < 0.95 ? lerp(0.7, 0.12, (y - 0.84) / 0.11) : 0.02;
      const c = y < 0.2 ? mixC(leafC[0], cream, 0.4) : y < 0.42 ? leafC[0] : y < 0.5 ? mixC(leafC[0], leafC[1], (y - 0.42) / 0.08) : y < 0.66 ? leafC[1] : y < 0.72 ? mixC(leafC[1], leafC[2], (y - 0.66) / 0.06) : leafC[2];
      return { y: 0, pitch: 0, tint: [c.r, c.g, c.b, sc] }; };
    const rBirch = await addRing({ r: 59.6, deckY: DECK[2], dir: 1, count: 48, fixedN: 48, N: 12, mat: ringMat(mixC(leafC[0], cream, 0.5)), cast: { geo: birch.geo, len: 3 }, baseY: PLINTH_H, belly: 0, pose: birchPose, phase: year,
      stand: { geo: buildStand({ ...standO, halfL: 0.7, halfW: 0.7, sh: [1.5, 1.3, 4.9] }).geo, halfL: 0.7 }, slow: 3.6 / 74, drift: 0, deckR: [56.6, 87.2] });
    // T4: rain: cast clouds on stalks, each one's beads a step lower than the last (clockwise)
    const rainPh = (i) => (((-i / 12) % 1) + 1) % 1;
    const sec3 = buildSector(sectorO(3, 36, 44, [[35, 41, 'grass'], [49, 55, 'grass'], [48.5, 54.5, 'grass']], snowStand(38.5, DECK[3], 6.5), 2, mixC(plasterC, pal.ochre, 0.4)));
    await ctx.yield();
    const deck3 = await terraceDeck(3, 108, 216, band(DECK[3], 41.8, 48.2, mixC(wet, cream, 0.3), 1, wet, cream), mixC(plasterC, pal.ochre, 0.4), wet, dado[3]);
    await ctx.yield();
    const rRain = await addRing({ r: 45, deckY: DECK[3], dir: -1, count: 36, fixedN: 36, N: 12, mat: ringMat(mixC(pal.blue, cream, 0.5)), cast: { geo: cloudG.geo, len: 5.6 }, baseY: 0, belly: 0, phase: rainPh,
      pose: (i, p) => ({ y: 0, pitch: 0, P2: [0, 0, 0, p], tint: [1, 1, 1, 0.12 + 0.88 * p] }),
      sector: sec3, sectorPhase: (j) => (((-j / 12) % 1) + 1) % 1,
      deck: deck3, deckMat: paintMat(), skin: skinO(3, mixC(plasterC, pal.ochre, 0.4), 2, dado[3]), slow: 3 / 45, drift: 0.8 / 45, deckR: [34.6, 55.2] });
    deckPaint(rRain, 4, [41.8, 48.2], cream, cream, cream);
    await ctx.yield();
    hero.object.position.set(0, DECK[4], 0); scene.add(hero.object);
    await ctx.yield();

    // ---- the wall: 40 ribbed blades and 40 slits round the island, powder blue outside, cream inside, slate-edged, on brass feet
    const P_BL = TAU / N_BLADE, wall = new THREE.Group(); scene.add(wall);
    {
      const st = makeSoup(), outC = [pal.blue, mixC(pal.blue, cream, 0.22), mixC(pal.blue, slate, 0.12)], inC = [mixC(cream, plasterC, 0.5), mixC(plasterC, pal.sage, 0.45), mixC(plasterC, pal.coral, 0.4)], K0 = [0, 0, 0, 0], B3 = [3, 0, 0, 0];
      const sp = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r], NF = 8, BT = 1.4, FT = 2.2, shadowC = bronze ? C('#3F4A52') : C('#9FB0BC');
      for (let b = 0; b < N_BLADE; b++) {
        const a0 = b * P_BL, da = P_BL * 0.5 / NF;
        for (let f = 0; f < NF; f++) {
          const a = a0 + f * da, a1 = a + da, am = a + da / 2, rib = f % 2 ? 1.0 : 0, ro = WALL_R + BT + rib, ri = WALL_R - BT - rib, ar = rib ? da * 0.26 : 0, aL = a + ar, aR = a1 - ar, out = sp(1, am, 0), inn = [-out[0], 0, -out[2]];
          for (let h = 0; h < 4; h++) {            // four lifts with a hairline between them
            const y0 = FT + h * 9.5, y1 = y0 + 9.2;
            st.quad(sp(ro, aL, y0), sp(ro, aR, y0), sp(ro, aR, y1), sp(ro, aL, y1), outC[(f + (h % 2)) % 3 === 0 ? 1 : f % 2 ? 2 : 0], K0, K0, K0, K0, out);
            st.quad(sp(ri, aL, y0), sp(ri, aR, y0), sp(ri, aR, y1), sp(ri, aL, y1), inC[h === 0 && f % 2 ? 2 : (f % 2 ? 1 : 0)], K0, K0, K0, K0, inn);
            st.quad(sp(ro - 0.05, aL, y1), sp(ro - 0.05, aR, y1), sp(ro - 0.05, aR, y1 + 0.3), sp(ro - 0.05, aL, y1 + 0.3), seam, K0, K0, K0, K0, out); st.quad(sp(ri + 0.05, aL, y1), sp(ri + 0.05, aR, y1), sp(ri + 0.05, aR, y1 + 0.3), sp(ri + 0.05, aL, y1 + 0.3), seam, K0, K0, K0, K0, inn);
          }
          if (!rib && f > 0) { const as = a + da * 0.2; st.quad(sp(ro + 0.02, a, FT), sp(ro + 0.02, as, FT), sp(ro + 0.02, as, WALL_H), sp(ro + 0.02, a, WALL_H), mixC(pal.blue, slate, 0.45), K0, K0, K0, K0, out); st.quad(sp(ri - 0.02, a, FT), sp(ri - 0.02, as, FT), sp(ri - 0.02, as, WALL_H), sp(ri - 0.02, a, WALL_H), shadowC, K0, K0, K0, K0, inn); }
          if (rib) for (const [aa, sgn] of [[a, -1], [a1, 1]]) { const t = sp(1, aa + sgn * Math.PI / 2, 0); st.quad(sp(ro, aa - sgn * ar, FT), sp(ro - rib, aa, FT), sp(ro - rib, aa, WALL_H), sp(ro, aa - sgn * ar, WALL_H), mixC(pal.blue, slate, 0.4), K0, K0, K0, K0, t); st.quad(sp(ri, aa - sgn * ar, FT), sp(ri + rib, aa, FT), sp(ri + rib, aa, WALL_H), sp(ri, aa - sgn * ar, WALL_H), mixC(plasterC, slate, 0.2), K0, K0, K0, K0, t); }
          st.quad(sp(ri, a, WALL_H), sp(ri, a1, WALL_H), sp(ro, a1, WALL_H), sp(ro, a, WALL_H), slate, K0, K0, K0, K0, [0, 1, 0]);
        }
        for (const [aa, sgn] of [[a0, -1], [a0 + P_BL * 0.5, 1]]) { const t = sp(1, aa + sgn * Math.PI / 2, 0); st.quad(sp(WALL_R - BT, aa, FT), sp(WALL_R + BT, aa, FT), sp(WALL_R + BT, aa, WALL_H), sp(WALL_R - BT, aa, WALL_H), slate, K0, K0, K0, K0, t); }
        for (const fa of [0.07, 0.25, 0.43]) { const am = a0 + fa * P_BL, c = sp(WALL_R, am, FT / 2); box(st, c, 1.5, FT / 2, BT + 0.55, brass, am, B3, mixC(brass, cream, 0.4)); }
        if (b % 2 === 1) await ctx.yield();
      }
      const wm = new THREE.Mesh(st.geometry(false), paintMat()); wm.frustumCulled = false; wall.add(wm);
    }
    const slitAt = (az) => az - 0.75 * P_BL;                  // wall angle that centres a slit on azimuth az
    const exitWallPt = path.pointAt(U.exitWall), W_IN = slitAt(Math.PI), W_OUT = slitAt(Math.atan2(exitWallPt.x, exitWallPt.z));
    await ctx.yield();

    // ---- the casting yard: raked gravel, a slate court for the arch, trestles with open moulds, paint pots and ladders
    const gravel = C(PT.gravel), court = bronze ? C('#2A3238') : mixC(slate, pal.blue, 0.3), yard = new THREE.Group(); scene.add(yard);
    const yst = makeSoup();
    const gravel2 = mixC(gravel, bronze ? pal.blue : pal.sage, 0.3), gravel3 = mixC(gravel, slate, 0.16);
    const gSage = mixC(gravel, bronze ? pal.blue : pal.sage, 0.5), gBlue = mixC(gravel, pal.blue, 0.3);
    lathe(yst, [pp(2400, 0, mixC(gravel, slate, 0.12), 6), pp(1100, 0, gSage, 6), pp(640, 0, gravel, 6), pp(470, 0, pal.coral), pp(468.2, 0, gBlue, 6), pp(340, 0, cream), pp(338.6, 0, gSage, 6), pp(272, 0, pal.coral), pp(270.8, 0, gravel, 6),
      pp(231, 0, cream), pp(230, 0, gravel3, 6), pp(191, 0, cream), pp(190, 0, gravel, 6), pp(150, 0, gravel, 6)], 96);
    {
      const c = portalPos, n = 28, K6 = [6, 0, 0, 0], ring = ringPts(n, (a) => [c.x + Math.sin(a) * 34, 0.45, c.z + Math.cos(a) * 34]), ring2 = ringPts(n, (a) => [c.x + Math.sin(a) * 36.5, 0.0, c.z + Math.cos(a) * 36.5]);
      for (const [ra, rb, col] of [[11.6, 12.4, cream], [22, 22.5, pal.coral], [27.5, 29, mixC(court, cream, 0.35)]]) { const r0 = ringPts(n, (a) => [c.x + Math.sin(a) * ra, 0.5, c.z + Math.cos(a) * ra]), r1 = ringPts(n, (a) => [c.x + Math.sin(a) * rb, 0.5, c.z + Math.cos(a) * rb]); for (let j = 0; j < n; j++) yst.quad(r0[j], r1[j], r1[(j + 1) % n], r0[(j + 1) % n], col, [0, 0, 0, 0], null, null, null, [0, 1, 0]); }
      for (let j = 0; j < 14; j++) { const a = (j / 14) * TAU + 0.11, w = 0.012, P4 = (rr, da) => [c.x + Math.sin(a + da) * rr, 0.5, c.z + Math.cos(a + da) * rr]; yst.quad(P4(12.4, -w), P4(22, -w * 0.6), P4(22, w * 0.6), P4(12.4, w), j % 2 ? cream : pal.ochre, [0, 0, 0, 0], null, null, null, [0, 1, 0]); }
      for (let j = 0; j < n; j++) { yst.tri([c.x, 0.45, c.z], ring[j], ring[(j + 1) % n], court, K6, K6, K6, [0, 1, 0]); yst.quad(ring[j], ring2[j], ring2[(j + 1) % n], ring[(j + 1) % n], pal.coral, [0, 0, 0, 0], null, null, null, [0, 1, 0]); }
    }
    const yrng = rng.fork ? rng.fork('yard') : rng, pots = [pal.coral, pal.blue, pal.ochre, pal.sage, cream];
    const trestle = (x, z, yaw) => {
      const cs = Math.cos(yaw), sn = Math.sin(yaw), W = (lx, y, lz) => [x + lx * cs + lz * sn, y, z - lx * sn + lz * cs];
      box(yst, W(0, 1.5, 0), 2.6, 0.08, 0.8, mixC(plasterC, pal.ochre, 0.35), yaw, K(), cream);
      for (const lx of [-2.2, 2.2]) for (const lz of [-1, 1]) limb(yst, W(lx, 1.45, lz * 0.5), W(lx + (lx > 0 ? 0.3 : -0.3), 0, lz * 0.95), 0.07, 0.07, 4, seam, K(), K());
      const kind = yrng();
      if (kind < 0.55) {              // a two-part mould lying open like a shell, with the hollow of a cast in each half
        for (const s of [-1, 1]) { const c = W(s * 1.1, 1.82, 0); box(yst, c, 0.95, 0.24, 0.6, plasterC, yaw + s * 0.08, K(), mixC(plasterC, cream, 0.5)); box(yst, [c[0], c[1] + 0.245, c[2]], 0.62, 0.006, 0.3, mixC(slate, pal.blue, 0.4), yaw + s * 0.08); }
      } else if (kind < 0.8) {
        for (let k = 0; k < 5; k++) { const c = W(-1.8 + k * 0.9 + yrng() * 0.2, 1.58, (yrng() - 0.5) * 0.8), r = 0.2 + yrng() * 0.1; limb(yst, c, [c[0], c[1] + 0.4 + yrng() * 0.2, c[2]], r, r, 7, cream, K(), K(), null, pots[k % 5]); }
      } else {
        box(yst, W(0, 2.0, 0), 1.2, 0.42, 0.5, bare, yaw + 0.2, K(), cream); box(yst, W(1.7, 1.75, 0.2), 0.3, 0.17, 0.3, pal.coral, yaw);
      }
    };
    const ladder = (x, z, yaw, len, lean) => {
      const cs = Math.cos(yaw), sn = Math.sin(yaw), W = (lx, t) => [x + lx * cs + t * lean * sn, t * len, z - lx * sn + t * lean * cs];
      for (const s of [-0.3, 0.3]) limb(yst, W(s, 0), W(s, 1), 0.045, 0.045, 4, brass, [3, 0, 0, 0], [3, 0, 0, 0]);
      for (let k = 1; k < len / 0.45; k++) limb(yst, W(-0.3, k * 0.45 / len), W(0.3, k * 0.45 / len), 0.03, 0.03, 3, seam, K(), K());
    };
    const nTrestle = Math.round(30 * Math.max(0.7, detail));
    for (let k = 0; k < nTrestle; k++) {
      let x, z, tries = 0;
      do { const near = k < 18; x = (near ? yrng.range(-34, 34) : yrng.range(-90, 90)); z = near ? yrng.range(-325, -226) : yrng.range(-400, -230); tries++; } while (tries < 20 && (Math.abs(x) < 4.5 || (Math.abs(x) > 9 && Math.abs(x) < 18.5)));
      trestle(x, z, yrng() * 3.1);
      if (k % 6 === 0) ladder(x + 3.4, z + 1, yrng() * 6, 4.5, 0.25);
      if (k % 5 === 4) await ctx.yield();
    }
    await ctx.yield();

    // ---- the secret, given away at once: racks of spare casts in pose order beside the entry line (deer to port, foxes to starboard)
    const rack = (geoSrc, piv, mean, n, x0, z0, yaw, gap, railY, keys, stand, bellyOff, sc, nPose) => {
      const m = inst(geoSrc, ringMat(mean, piv), n); m.material.uniforms.uDir.value = 1;
      const dx = Math.sin(yaw), dz = Math.cos(yaw), sx = dz, sz = -dx, at = (l, s2, y) => [x0 + dx * l + sx * s2, y, z0 + dz * l + sz * s2];
      for (let i = 0; i < n; i++) {
        const p = 1 - i / nPose, a = keyAt(keys, p), l = -i * gap, y = railY + 0.2 + stand + a[0] * 0.55, c = at(l, 0, y);
        dummy.position.set(c[0], y, c[2]); dummy.rotation.set(-a[1], yaw, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); dummy.scale.setScalar(1);
        limb(yst, at(l, 0, railY), at(l, 0, y - bellyOff), 0.05, 0.05, 5, brass, [3, 0, 0, 0], [3, 0, 0, 0]);
        if (i % 2 === 0) { for (const s2 of [-0.8, 0.8]) limb(yst, at(l + gap / 2, s2, railY - 0.1), at(l + gap / 2, s2 * 1.9, 0), 0.09, 0.09, 4, seam, K(), K()); box(yst, at(l + gap / 2, 0, railY - 0.9), 0.8, 0.05, 0.05, seam, yaw); }
      }
      const l0 = -(n - 1) * gap - 2, l1 = 2;
      for (const s2 of [-0.8, 0.8]) box(yst, at((l0 + l1) / 2, s2, railY - 0.1), 0.09, 0.1, (l1 - l0) / 2, mixC(plasterC, pal.ochre, 0.4), yaw, K(), cream);
      box(yst, at((l0 + l1) / 2, 0, railY - 0.02), 0.8, 0.04, (l1 - l0) / 2, chalk, yaw, K(), mixC(chalk, pal.blue, 0.2));
      yard.add(m); return m;
    };
    rack(deer.geo, deer.piv, deerCoat, 25, 13.2, -219, 0, 2.62, 8.8, DEER_KEYS, deer.stand * DS, 0.33 * DS, DS, 25);
    await ctx.yield();
    rack(fox.geo, fox.piv, foxCoat, 24, -13.6, -219, 0, 2.7, 8.0, FOX_KEYS, fox.stand * FS + 0.35, 0.22 * FS, FS, 24);
    await ctx.yield();
    { // and outside the exit slit, either side of the way to the arch: spare salmon and spare foxes
      const a = exitPt(EXIT_LEN - 38, 0), sd = [te[1], -te[0]];
      rack(salmon.geo, null, pal.blue, 14, a[0] + sd[0] * 11.5, a[2] + sd[1] * 11.5, exitAz, 2.9, 10.4, SALMON_KEYS, 1.3, 0.3, 1.5, 28);
      rack(deer.geo, deer.piv, deerCoat, 8, a[0] - sd[0] * 11.5, a[2] - sd[1] * 11.5, exitAz, 3.9, 9.8, DEER_KEYS, deer.stand * DS, 0.33 * DS, DS, 25);
      await ctx.yield();
      // the avenue: inside the wall the runway runs between two more racks (foxes to starboard, deer to port) from the terrace
      // foot to the slit, with moulds and paint trestles beyond them and step-ladders at the feet of the two blades of the slit
      const AV = (s2, w) => { const q = exitPt(s2, 0); return [q[0] + sd[0] * w, q[2] + sd[1] * w]; }, f1 = AV(205, 11), d1 = AV(205, -11);
      rack(fox.geo, fox.piv, foxCoat, 12, f1[0], f1[1], exitAz, 3.6, 9.6, FOX_KEYS, fox.stand * FS + 0.35, 0.22 * FS, FS, 24);
      await ctx.yield();
      rack(deer.geo, deer.piv, deerCoat, 11, d1[0], d1[1], exitAz, 3.9, 10.0, DEER_KEYS, deer.stand * DS, 0.33 * DS, DS, 25);
      await ctx.yield();
      for (const sg of [-1, 1]) {
        for (const [s2, w] of [[163, 19], [176, 21.5], [189, 19], [224, 8.6], [238, 8.6]]) trestle(...AV(s2 + sg * 1.5, sg * w), exitAz - Math.PI / 2 + (w > 10 ? 0.25 * sg : 0));
        const p0 = AV(202.2, sg * 12.4), p1 = AV(202.2 + 2 * 0.17 * 11, sg * 12.4);         // an A-frame step-ladder, 11 m, free-standing (the wall rocks as it settles)
        ladder(p0[0], p0[1], exitAz, 11, 0.17); ladder(p1[0], p1[1], exitAz + Math.PI, 11, 0.17);
        const p2 = AV(171, sg * 15.5); ladder(p2[0], p2[1], exitAz + Math.PI / 2 * sg, 7.5, -0.2);                      // and one leaning on each inner rack
        // the painters' colour chart: two rows of test swatches laid out on the gravel beyond the trestles, each in a cream border
        const sw = [pal.coral, pal.blue, pal.ochre, pal.sage, mixC(pal.coral, cream, 0.5), mixC(pal.blue, slate, 0.4), mixC(pal.ochre, cream, 0.45), mixC(pal.sage, pal.blue, 0.5), court, mixC(pal.coral, pal.ochre, 0.5)], up = [0, 1, 0], KS = [0, 0, 0, 0];
        for (let row = 0; row < 2; row++) for (let k = 0; k < 5; k++) {
          const s2 = 158 + k * 7.4 + row * 1.5, w0 = sg * (27.5 + row * 7.2), w1 = sg * (27.5 + row * 7.2 + 5.6), Q = (ss, w, y) => { const q = AV(ss, w); return [q[0], y, q[1]]; };
          yst.quad(Q(s2 - 0.35, w0 - sg * 0.35, 0.05), Q(s2 + 5.75, w0 - sg * 0.35, 0.05), Q(s2 + 5.75, w1 + sg * 0.35, 0.05), Q(s2 - 0.35, w1 + sg * 0.35, 0.05), cream, KS, KS, KS, KS, up);
          yst.quad(Q(s2, w0, 0.08), Q(s2 + 5.4, w0, 0.08), Q(s2 + 5.4, w1, 0.08), Q(s2, w1, 0.08), sw[(k * 3 + row * 5 + (sg > 0 ? 2 : 0)) % sw.length], KS, KS, KS, KS, up);
        }
      }
    }
    // little test wheels in the yard (only rotation is real here too): a dozen spare salmon on a turned stand, always turning
    const testWheels = [];
    {
      const st = makeSoup(); for (const p of [pp(1.5, 0, plasterC), pp(1.5, 0.5, chalk), pp(0.5, 0.7, brass, 3), pp(0.36, 4.2, seam), pp(4.7, 4.2, seam), pp(4.7, 4.3, chalk, 2), pp(4.7, 4.75, chalk), pp(4.55, 4.75, chalk, 1), pp(2.3, 4.75, sageWash, 1), pp(0.7, 4.75, pal.coral), pp(0.3, 5.9, brass, 3), pp(0.5, 6.3, brass, 3), pp(0, 6.9, brass)]) st.prof = (st.prof || []).concat([p]);
      lathe(st, st.prof, 24, 24);
      const tGeo = st.geometry(false), tMat = paintMat(), sMat = ringMat(pal.blue, null), sStand = buildStand({ ...standO, halfL: 0.5, halfW: 0.3 }).geo;
      const place = [[...exitPt(EXIT_LEN - 30, 0)].map((v, i) => v + (i === 0 ? te[1] : i === 2 ? -te[0] : 0) * 25), [...exitPt(EXIT_LEN - 36, 0)].map((v, i) => v - (i === 0 ? te[1] : i === 2 ? -te[0] : 0) * 26), [-36, 0, -238]];
      instAttrs(sStand, 12);
      place.forEach((c, n) => {
        const g = new THREE.Group(); g.position.set(c[0], 0, c[2]); g.userData.w = (n % 2 ? -1 : 1) * (0.45 + 0.1 * n);
        const fish = inst(salmon.geo, sMat, 12), pegs = inst(sStand, sMat, 12), at = sStand.getAttribute('aP3');
        for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, k = keyAt(SALMON_KEYS, 1 - i / 28); dummy.position.set(Math.sin(a) * 3.5, 4.75 + 1.0 + k[0] * 0.5, Math.cos(a) * 3.5); dummy.rotation.set(-k[1], a + Math.PI / 2, 0); dummy.updateMatrix(); fish.setMatrixAt(i, dummy.matrix);
          dummy.position.set(Math.sin(a) * 3.5, 4.75, Math.cos(a) * 3.5); dummy.rotation.set(0, a + Math.PI / 2, 0); dummy.updateMatrix(); pegs.setMatrixAt(i, dummy.matrix); at.setXYZW(i, 0, 0.5, 0, 0.7 + k[0] * 0.5); }
        const m = new THREE.Mesh(tGeo, tMat); m.frustumCulled = false; g.add(m, fish, pegs); yard.add(g); testWheels.push(g);
      });
    }
    await ctx.yield();

    // ---- the exit: a plaster arch with coral and cream voussoirs and a brass hoop, standing in the yard outside a slit
    let sunWheel = null;
    {
      const f = [te[0], te[1]], r = [f[1], -f[0]], W = (lx, y, lz) => [portalPos.x + r[0] * lx + f[0] * lz, y, portalPos.z + r[1] * lx + f[1] * lz], yawA = Math.atan2(r[0], r[1]) - Math.PI / 2, cy = portalPos.y;
      for (const s of [-1, 1]) {
        box(yst, W(s * 9.4, cy / 2, 0.4), 1.45, cy / 2, 1.5, plasterC, yawA, K(), cream); box(yst, W(s * 9.4, 0.7, 0.4), 1.9, 0.7, 1.95, mixC(plasterC, pal.blue, 0.4), yawA, K(), cream);
        box(yst, W(s * 9.4, cy - 0.5, 0.4), 1.65, 0.3, 1.7, pal.coral, yawA, K(), cream);
        ladder(...W(s * 15.2, 0, -0.5).filter((_, i) => i !== 1), yawA + Math.PI / 2 * s, 9, 0.16);
      }
      await ctx.yield();
      const NV = 17, ri = 7.95, ro = 10.85;
      for (let k = 0; k < NV; k++) {
        const t0 = (k / NV) * Math.PI, t1 = ((k + 1) / NV) * Math.PI, col = k === (NV - 1) / 2 ? brass : k % 2 ? pal.coral : cream, kd = k === (NV - 1) / 2 ? [3, 0, 0, 0] : [0, 0, 0, 0];
        const P = (rad, t, lz) => W(Math.cos(t) * rad, cy + Math.sin(t) * rad, lz), tm = (t0 + t1) / 2, up = [r[0] * Math.cos(tm), Math.sin(tm), r[1] * Math.cos(tm)];
        for (const [lz, sg] of [[-1.1, -1], [1.9, 1]]) yst.quad(P(ri, t0, lz), P(ri, t1, lz), P(ro, t1, lz), P(ro, t0, lz), col, kd, kd, kd, kd, [f[0] * sg, 0, f[1] * sg]);
        yst.quad(P(ro, t0, -1.1), P(ro, t1, -1.1), P(ro, t1, 1.9), P(ro, t0, 1.9), col, kd, kd, kd, kd, up);
        yst.quad(P(ri, t0, -1.1), P(ri, t1, -1.1), P(ri, t1, 1.9), P(ri, t0, 1.9), mixC(col, slate, 0.25), kd, kd, kd, kd, [-up[0], -up[1], -up[2]]);
      }
      for (let k = 0; k < 13; k++) {
        const t0 = (k / 13) * Math.PI, t1 = ((k + 1) / 13) * Math.PI, tm = (t0 + t1) / 2, col = k % 2 ? cream : pal.blue, K0 = [0, 0, 0, 0], P = (rad, t, lz) => W(Math.cos(t) * rad, cy + Math.sin(t) * rad, lz), up = [r[0] * Math.cos(tm), Math.sin(tm), r[1] * Math.cos(tm)];
        yst.quad(P(ro + 0.25, t0, -1.5), P(ro + 0.25, t1, -1.5), P(ro + 2.9, t1, -1.5), P(ro + 2.9, t0, -1.5), col, K0, K0, K0, K0, [-f[0], 0, -f[1]]);
        yst.quad(P(ro + 2.9, t0, -1.5), P(ro + 2.9, t1, -1.5), P(ro + 2.9, t1, 2.3), P(ro + 2.9, t0, 2.3), slate, K0, K0, K0, K0, up);
        yst.quad(P(ro + 0.25, t0, 2.3), P(ro + 0.25, t1, 2.3), P(ro + 2.9, t1, 2.3), P(ro + 2.9, t0, 2.3), col, K0, K0, K0, K0, [f[0], 0, f[1]]);
      }
      { // a painted sun behind the arch: a flat wheel of long ochre and short cream rays (scenery, one tone) that turns slowly, like
        // everything else that moves here, so the gate reads from the far side of the wheel and the last view is alive
        const sst = makeSoup(), K7 = [7, 0, 0, 0], nR = 44, fr = [0, 0, -1], P = (rad, t) => [Math.cos(t) * rad, Math.sin(t) * rad, 0], ri2 = ro + 2.9;
        for (let k = 0; k < nR; k++) { const t0 = (k / nR) * TAU, t1 = ((k + 1) / nR) * TAU, tm = (t0 + t1) / 2, long = k % 2 === 0;
          sst.tri(P(ri2, t0), P(ri2, t1), P(long ? 38 : 28, tm), long ? pal.ochre : cream, K7, K7, K7, fr);
          sst.quad(P(ri2 - 0.4, t0), P(ri2 - 0.4, t1), P(ri2 + 1.5, t1), P(ri2 + 1.5, t0), pal.coral, K7, K7, K7, K7, fr); }
        const sunG = new THREE.Group(); sunG.position.set(portalPos.x + f[0] * 2.5, cy, portalPos.z + f[1] * 2.5);
        sunG.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(r[0], 0, r[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(f[0], 0, f[1])));
        const sm = new THREE.Mesh(sst.geometry(false), paintMat()); sm.frustumCulled = false; sunG.add(sm); yard.add(sunG); sunWheel = sm;
      }
      for (const sg of [-1, 1]) { box(yst, W(sg * 12.5, cy / 2 + 1, 0.4), 1.5, cy / 2 + 1, 1.9, mixC(plasterC, pal.blue, 0.3), yawA, K(), cream); limb(yst, W(sg * 12.5, cy + 2, 0.4), W(sg * 12.5, cy + 8.5, 0.4), 0.3, 0.12, 5, brass, [3, 0, 0, 0], [3, 0, 0, 0]); box(yst, W(sg * 12.5, cy + 9, 0.4), 0.55, 0.55, 0.55, pal.coral, yawA + 0.78, K(), cream); }
      for (let k = 0; k < 28; k++) { const t0 = (k / 28) * TAU, t1 = ((k + 1) / 28) * TAU; limb(yst, W(Math.cos(t0) * 7.45, cy + Math.sin(t0) * 7.45, 0.3), W(Math.cos(t1) * 7.45, cy + Math.sin(t1) * 7.45, 0.3), 0.2, 0.2, 5, brass, [3, 0, 0, 0], [3, 0, 0, 0]); }
      for (let k = 0; k < 14; k++) trestle(...W((k % 2 ? 1 : -1) * (24 + (k >> 1) * 6.5 + (k % 3) * 3), 0, 6 - (k >> 1) * 8.5).filter((_, i) => i !== 1), yawA + 0.3 * k);
    }
    await ctx.yield();
    { // the painted country behind the arch: three scalloped flats of slate hills, standing on the gravel like scenery, each paler than the last
      const bank = C(PT.bank), hor = C(PT.hor), K0 = [0, 0, 0, 0], K7 = [7, 0, 0, 0], spz = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r];
      for (const [rf, span, H, k1, k2, ph, fade] of [[455, 0.8, 58, 23, 9, 0.6, -1], [540, 0.95, 82, 13, 31, 2.1, 0.24], [650, 1.12, 110, 9, 17, 4.0, 0.5]]) {
        const nS = Math.round(span * rf / 5), base = C(PT.hills[fade < 0 ? 0 : fade < 0.4 ? 1 : 2]), lip = mixC(base, C(PT.cap), 0.3), rainC = base.clone().multiplyScalar(0.9);
        const hAt = (a) => { const e = 1 - smoothstep(0.62, 1, Math.abs(a) / span); return H * e * (0.62 + 0.26 * Math.abs(Math.sin(a * k1 + ph)) + 0.12 * Math.abs(Math.sin(a * k2 + ph * 2))); };
        for (let j = 0; j < nS; j++) {
          const a0 = -span + (2 * span * j) / nS, a1 = -span + (2 * span * (j + 1)) / nS, h0 = hAt(a0), h1 = hAt(a1), b0 = exitAz + a0, b1 = exitAz + a1, inn = [-Math.sin((b0 + b1) / 2), 0, -Math.cos((b0 + b1) / 2)];
          if (h0 < 0.5 && h1 < 0.5) continue;
          yst.quad(spz(rf, b0, 0), spz(rf, b1, 0), spz(rf, b1, h1 * 0.3), spz(rf, b0, h0 * 0.3), mixC(j % 3 === 0 ? rainC : base, hor, 0.3), K7, K7, K7, K7, inn);   // a paler foot: mist painted along the bottom of each flat
          yst.quad(spz(rf, b0, h0 * 0.3), spz(rf, b1, h1 * 0.3), spz(rf, b1, h1 * 0.86), spz(rf, b0, h0 * 0.86), j % 3 === 0 ? rainC : base, K7, K7, K7, K7, inn);
          yst.quad(spz(rf, b0, h0 * 0.86), spz(rf, b1, h1 * 0.86), spz(rf, b1, h1), spz(rf, b0, h0), lip, K7, K7, K7, K7, inn);
        }
        await ctx.yield();
      }
      { const rf = 720, nS = 240, base = mixC(C(PT.hills[2]), hor, 0.3), lip = mixC(base, C(PT.cap), 0.35), rainC = mixC(base, C(PT.hills[1]), 0.2);
        const hAt = (a) => 40 + 20 * Math.abs(Math.sin(a * 7 + 1.3)) + 11 * Math.abs(Math.sin(a * 17 + 0.4)) + 7 * Math.sin(a * 3);
        for (let j = 0; j < nS; j++) { const b0 = (j / nS) * TAU, b1 = ((j + 1) / nS) * TAU, h0 = hAt(b0), h1 = hAt(b1), inn = [-Math.sin(b0), 0, -Math.cos(b0)];
          yst.quad(spz(rf, b0, 0), spz(rf, b1, 0), spz(rf, b1, h1 * 0.82), spz(rf, b0, h0 * 0.82), j % 4 === 0 ? rainC : base, K7, K7, K7, K7, inn);
          yst.quad(spz(rf, b0, h0 * 0.82), spz(rf, b1, h1 * 0.82), spz(rf, b1, h1), spz(rf, b0, h0), lip, K7, K7, K7, K7, inn); }
        await ctx.yield();
        const roofs = [pal.coral, mixC(slate, pal.blue, 0.5), pal.sage, pal.ochre];
        for (let k = 0; k < 13; k++) {       // casting sheds: long plaster sheds with painted roofs between the wall and the hills
          const a = exitAz + 0.42 + (k / 13) * (TAU - 0.84) + yrng.range(-0.08, 0.08), rr = 300 + yrng.range(0, 110), c = spz(rr, a, 0), hx = 11 + yrng() * 8, hz = 5.5, hy = 4.2, cs = Math.cos(a), sn = Math.sin(a);
          if (Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.2) continue;
          const Wp = (lx, y, lz) => [c[0] + lx * cs + lz * sn, y, c[2] - lx * sn + lz * cs], roof = roofs[k % 4];
          box(yst, [c[0], hy, c[2]], hx, hy, hz, plasterC, a, K(), cream);
          for (const sg of [-1, 1]) { yst.quad(Wp(-hx - 0.6, 2 * hy - 0.3, sg * (hz + 0.7)), Wp(hx + 0.6, 2 * hy - 0.3, sg * (hz + 0.7)), Wp(hx + 0.6, 2 * hy + 3.4, 0), Wp(-hx - 0.6, 2 * hy + 3.4, 0), sg > 0 ? roof : mixC(roof, slate, 0.25), K0, K0, K0, K0, [sn * sg, 1.2, cs * sg]);
            yst.tri(Wp(sg * hx, 2 * hy, -hz), Wp(sg * hx, 2 * hy, hz), Wp(sg * hx, 2 * hy + 3.4, 0), cream, K0, K0, K0, [cs * sg, 0, -sn * sg]);
            yst.quad(Wp(sg * 4, 0, hz + 0.05), Wp(sg * 4 + 3, 0, hz + 0.05), Wp(sg * 4 + 3, 5, hz + 0.05), Wp(sg * 4, 5, hz + 0.05), mixC(slate, pal.blue, 0.4), K0, K0, K0, K0, [sn, 0, cs]); }
        }
      }
      // the slate runway from the wheel's foot through the exit slit to the court, lined in cream with coral dashes
      const sd = [te[1], -te[0]], X = (s2, w, y) => [pe[0] + te[0] * s2 + sd[0] * w, y, pe[1] + te[1] * s2 + sd[1] * w], up = [0, 1, 0], K6 = [6, 0, 0, 0], s0 = 152, s1 = EXIT_LEN - 33;
      yst.quad(X(s0, -6.5, 0.3), X(s0, 6.5, 0.3), X(s1, 6.5, 0.3), X(s1, -6.5, 0.3), court, K6, K6, K6, K6, up);
      for (const w of [-6.5, 6.1]) yst.quad(X(s0, w, 0.33), X(s0, w + 0.4, 0.33), X(s1, w + 0.4, 0.33), X(s1, w, 0.33), cream, K0, K0, K0, K0, up);
      for (let k = 0; k < 11; k++) { const a = s0 + 3 + k * 5.6; yst.quad(X(a, -0.25, 0.33), X(a, 0.25, 0.33), X(a + 3, 0.25, 0.33), X(a + 3, -0.25, 0.33), k % 2 ? pal.coral : cream, K0, K0, K0, K0, up); }
      yst.quad(X(s0 - 0.6, -7.2, 0.31), X(s0 - 0.6, 7.2, 0.31), X(s0, 7.2, 0.31), X(s0, -7.2, 0.31), pal.coral, K0, K0, K0, K0, up);
      // the dial: painted ticks between the wheel and the wall, one long one a slit, and spokes across the outer yard
      const tickC = mixC(gravel, slate, 0.42), spokeC = mixC(gravel, cream, 0.7);
      for (let k = 0; k < 160; k++) {
        const a = (k / 160) * TAU, long = k % 4 === 0, r0 = long ? 163 : 172, r1 = long ? 199 : 185, hw = (long ? 0.55 : 0.3), da0 = hw / r0, da1 = hw / r1;
        const m = spz((r0 + r1) / 2, a, 0), off = Math.abs((m[0] - pe[0]) * sd[0] + (m[2] - pe[1]) * sd[1]), along = (m[0] - pe[0]) * te[0] + (m[2] - pe[1]) * te[1];
        if (off < 9 && along > 0) continue;
        yst.quad(spz(r0, a - da0, 0.04), spz(r0, a + da0, 0.04), spz(r1, a + da1, 0.04), spz(r1, a - da1, 0.04), long ? pal.coral : tickC, K0, K0, K0, K0, up);
        if (long) yst.quad(spz(216, a - 0.35 / 216, 0.04), spz(216, a + 0.35 / 216, 0.04), spz(k % 8 === 0 ? 466 : 268, a + 0.5 / 400, 0.04), spz(k % 8 === 0 ? 466 : 268, a - 0.5 / 400, 0.04), spokeC, K0, K0, K0, K0, up);
      }
      // THE SETTING OUT (round p4): the yard's floor carries the pale chalk figures of the casts, laid flat on it in rows round the
      // wheel as the makers set them out: deer, fox, salmon and crane in turn, each the flat cut-out its long shadow is drawn from
      // (the standing mould pose; the crane from above, wings spread), several times life size. One row lies inside the wall,
      // every figure upright as seen from the wheel; a figure is left out only where a thing of live's stands on its
      // plot (the runway, a rack, the colour chart, a test wheel, the court). (The strobe disc, the scribed rings and the chalk
      // radial lines are paint in the gravel's own shader: PAINT_FRAG, kind 6.)
      {
        // each figure: its cut-out's triangles laid flat (a side view lies as it stands; a plan view, the wings and the tail, as it
        // spreads), with its own length and height. [cut-out, the rig part left out (the crane's legs; 9: none), where the crane's
        // head (its part 2, cut round its own pivot) sits along the neck]
        const chalkC = cream, bedC = mixC(gravel, slate, 0.24), figs = [[longCut.deer, 9, 0], [longCut.fox, 9, 0], [longCut.salmon, 9, 0], [longCut.crane, 4, 1.45]].map(([cut, skip, zHead], kind) => {
          const P = cut.getAttribute('position'), R = cut.getAttribute('aRig'), T = []; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
          for (let v = 0; v < P.count; v += 3) {
            const part = R.getX(v); if ((part > 4.5 && part < 5.5) || part === skip) continue;
            const side = Math.abs(P.getX(v) - P.getX(v + 1)) < 1e-6 && Math.abs(P.getX(v) - P.getX(v + 2)) < 1e-6, zo = part === 2 ? zHead : 0, tri = [];
            for (let k = 0; k < 3; k++) { const a = P.getZ(v + k) + zo, b = side ? P.getY(v + k) : P.getX(v + k); tri.push([a, b]); u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, b); v1 = Math.max(v1, b); }
            T.push(tri);
          }
          return { T, cu: (u0 + u1) / 2, cv: (v0 + v1) / 2, w: u1 - u0, h: v1 - v0, plan: kind === 3 };
        });
        // one figure, as large as its plot (deep across the row, long along it) takes; the crane, seen from above, is turned a quarter where that makes it larger
        // LIVE'S OWN THINGS ON THE FLOOR, each by its own place (the measures are those of the lines that make them, above): a figure is
        // left out only where its bed would lie under one of them. [x, z, clearance] spots along each thing.
        const spots = [], spot = (x, z, r) => spots.push([x, z, r]), EX = (s2, w) => [pe[0] + te[0] * s2 + sd[0] * w, pe[1] + te[1] * s2 + sd[1] * w];
        for (let s2 = 152; s2 <= EXIT_LEN - 33; s2 += 3) spot(...EX(s2, 0), 8.2);                                        // the runway with its lines
        for (let i = 0; i <= 66; i += 2) { spot(13.2, -217 - i, 2.6); spot(-13.6, -217 - i, 2.6); }                       // the two racks beside the entry line
        for (let s2 = 163; s2 <= 207; s2 += 2) { spot(...EX(s2, 11), 2.6); spot(...EX(s2, -11), 2.6); }                   // the avenue's two racks
        for (let s2 = 261; s2 <= 303; s2 += 2) { spot(...EX(s2, 11.5), 2.6); if (s2 >= 271) spot(...EX(s2, -11.5), 2.6); }   // the two racks outside the exit slit
        for (const sg of [-1, 1]) for (let s2 = 158; s2 <= 197; s2 += 3) for (let w = 27.5; w <= 41; w += 3.3) spot(...EX(s2, sg * w), 2.4);   // the painters' colour chart
        spot(...EX(EXIT_LEN - 30, 25), 6); spot(...EX(EXIT_LEN - 36, -26), 6); spot(-36, -238, 6);                         // the three test wheels
        spot(portalPos.x, portalPos.z, 36.5);                                                                             // the arch's court
        // a figure and its drying bed (a plot of damp, darker sand: the figure's own length and width times 1.08, and 0.4 m more on
        // every side). Both are painted as the floor is (kind 6), so the floor's raked chequer runs on over them.
        const layOut = (f, cx, cz, yaw, deep, long) => {
          const turn = f.plan && Math.min(deep / f.w, long / f.h) > Math.min(deep / f.h, long / f.w), s = 0.9 * (turn ? Math.min(deep / f.w, long / f.h) : Math.min(deep / f.h, long / f.w)), cs = Math.cos(yaw + (turn ? Math.PI / 2 : 0)), sn = Math.sin(yaw + (turn ? Math.PI / 2 : 0));
          const ha = f.w * s * 0.54 + 0.4, hb = f.h * s * 0.54 + 0.4, B = (aa, bb) => [cx + aa * sn + bb * cs, 0.05, cz + aa * cs - bb * sn];
          for (const [x, z, r] of spots) if (Math.abs((x - cx) * sn + (z - cz) * cs) < ha + r && Math.abs((x - cx) * cs - (z - cz) * sn) < hb + r) return;
          yst.quad(B(-ha, -hb), B(ha, -hb), B(ha, hb), B(-ha, hb), bedC, K6, K6, K6, K6, up);
          for (const tri of f.T) { const q = tri.map(([a, b]) => { const aa = (a - f.cu) * s, bb = (b - f.cv) * s; return [cx + aa * sn + bb * cs, 0.09, cz + aa * cs - bb * sn]; }); yst.tri(q[0], q[1], q[2], chalkC, K6, K6, K6, up); }
        };
        // [the row's radius, its depth, which figure it starts with]: ONE row, inside the wall on the strobe disc, between the floor's
        // own cream ring (190 to 191 m) and the wall's foot (beds 191.6 to 206.4 m, beside the dial's long ticks). The two rows
        // outside the wall are gone (the third mend: triangles under the bound on every seed). ONE RULE OF HEADING for every
        // figure all round: its feet toward the wheel's centre, its head away from it (upright as seen from the wheel).
        for (const [rad, deep, shift] of [[199, 14.4, 2]]) {
          for (let j = 0; j < 40; j++) {
            const a = ((j + 0.5) / 40) * TAU, c = spz(rad, a, 0);
            layOut(figs[(j + shift) % 4], c[0], c[2], a - Math.PI / 2, deep, (TAU / 40) * rad * 0.92);
          }
          await ctx.yield();
        }
      }
    }
    await ctx.yield();
    const yardMesh = new THREE.Mesh(yst.geometry(false), paintMat()); yardMesh.frustumCulled = false; yard.add(yardMesh);
    { // the strobe disc's paler tone (PAINT_FRAG, uWedge): the floor's own paint taken toward cream until, as shown (the top tone's
      // lift, then the screen's curve), one channel stands about 38 of 255 from the floor's; handed over as what the floor's paint
      // is multiplied by, so that the floor's raked chequer and its zones keep their own contrast on a pale wedge
      const scr = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
      const shown = (c) => { const k = 0.3 * smoothstep(0.02, 0.3, 0.3 * c.r + 0.5 * c.g + 0.2 * c.b); return [scr(lerp(c.r, cream.r, k)), scr(lerp(c.g, cream.g, k)), scr(lerp(c.b, cream.b, k))]; };
      const g0 = shown(gravel); let pale = gravel;
      for (let t = 0.1; t < 0.92; t += 0.05) { pale = mixC(gravel, cream, t); const p = shown(pale); if (Math.max(Math.abs(p[0] - g0[0]), Math.abs(p[1] - g0[1]), Math.abs(p[2] - g0[2])) >= 38) break; }
      yardMesh.material.uniforms.uWedge = { value: new THREE.Vector3(pale.r / Math.max(gravel.r, 1e-3), pale.g / Math.max(gravel.g, 1e-3), pale.b / Math.max(gravel.b, 1e-3)) };
    }
    await ctx.yield();

    // ---- the painted cyclorama
    const srng = rng.fork ? rng.fork('sky') : rng, uCl = [];
    for (let i = 0; i < 9; i++) {
      let az = exitAz + sunSide * (0.45 + (i / 9) * TAU) + srng.range(-0.12, 0.12); const el = 0.17 + 0.3 * srng() * (i % 2 ? 1 : 0.5) + (i % 3 === 0 ? 0.16 : 0);
      if (Math.abs(Math.atan2(Math.sin(az - sunAz), Math.cos(az - sunAz))) < 0.3) az += 0.5;
      uCl.push(new THREE.Vector4(az, el, srng.range(0.1, 0.2), srng() * 6));
    }
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: C(PT.sky || PT.top) }, uHor: { value: C(PT.skyHor) }, uBank: { value: mixC(C(PT.hills[2]), C(PT.skyHor), 0.25) }, uCap: { value: C(PT.cap) }, uCloud: { value: mixC(C(PT.hor), C('#FFFFFF'), 0.35) }, uBelly: { value: bronze ? C('#8E9A9C') : mixC(pal.sage, C('#9AA5A0'), 0.6) },
        uSun: { value: C('#FFF6E4') }, uGround: { value: mixC(gravel, C(PT.hor), 0.35) }, uExit: { value: exitAz }, uSunAz: { value: sunAz }, uBankK: { value: 1 }, uLift: HU.uLift, uCl: { value: uCl } },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, depthWrite: false, depthTest: false, side: THREE.BackSide, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
    await ctx.yield();

    // ---- wind lines: thin ribbons streaming off the rims while the wheel winds up and runs down (multiply blended, never under 2 px)
    const windMat = new THREE.ShaderMaterial({
      uniforms: { uSpin: { value: 0 }, uAmt: { value: 0 }, uPx: HU.uPx, uInk: { value: mixC(pal.slate, pal.blue, 0.32) } },
      vertexShader: /* glsl */`
        attribute vec3 aLine;   // x: side (-1, 1), y: along 0..1, z: speed factor
        uniform float uSpin, uPx; varying vec2 vL;
        void main(){
          float a = uSpin * aLine.z, c = cos(a), s = sin(a);
          vec3 p = vec3(c * position.x + s * position.z, position.y, -s * position.x + c * position.z);
          float d = max(length(cameraPosition - p), 1e-3);
          p.y += aLine.x * max(.07, 1.5 * d / max(uPx, 1.));
          vL = aLine.xy;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform float uAmt; uniform vec3 uInk; varying vec2 vL;
        void main(){ float a = uAmt * sin(3.14159 * clamp(vL.y, 0., 1.)) * (1. - abs(vL.x) * .4) * .78; gl_FragColor = vec4(mix(vec3(1.), uInk, a), 1.); }`,
      blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendEquation: THREE.AddEquation, depthWrite: false, transparent: true, side: THREE.DoubleSide, fog: false,
    });
    {
      const wr = rng.fork ? rng.fork('wind') : rng, P = [], L = [], I = [], nL = Math.round(280 * Math.max(0.6, detail)), RR = [134, 103, 74, 45];
      for (let k = 0; k < nL; k++) {
        const t = wr.int(0, 3), onRing = k % 5 > 2, r = onRing ? RR[t] + wr.range(-4.5, 4.5) : RIM[t] + wr.range(0.6, 6), y = DECK[t] + (onRing ? wr.range(3.4, 8.5) : wr.range(0.6, 4.6)), a0 = wr() * TAU, len = wr.range(14, 40) / r, sp = (t % 2 ? -1 : 1) * wr.range(0.8, 1.3), b = P.length / 3;
        for (let j = 0; j <= 6; j++) { const a = a0 + (j / 6) * len; for (const sd of [-1, 1]) { P.push(Math.sin(a) * r, y, Math.cos(a) * r); L.push(sd, j / 6, sp); } }
        for (let j = 0; j < 6; j++) I.push(b + j * 2, b + j * 2 + 1, b + j * 2 + 2, b + j * 2 + 1, b + j * 2 + 3, b + j * 2 + 2);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aLine', new THREE.Float32BufferAttribute(L, 3)); g.setIndex(I);
      const wm = new THREE.Mesh(g, windMat); wm.frustumCulled = false; wm.renderOrder = 5; scene.add(wm);
    }

    // ---- the drive: one angle a ring, one smear, one clock
    const heroRing = { hero: true, dir: 1, step: -TAU / 24, drift: 0.14, slow: 0.3, off: 0, angle: 0, tickOff: 0.37, started: false, locked: false };
    const all = [...rings, heroRing];
    for (const r of rings) { r.started = false; r.locked = false; }
    const camP = new THREE.Vector3();
    let camAzU = 0, prevAz = null, back = 0, wallN = null;
    const R0 = S.dn1 + 0.012, R1 = R0 + 0.045;                         // the rare overshoot: the clock runs backward here
    const wrapA = (a) => a - TAU * Math.round(a / TAU);
    const tickOf = (qq) => { const f = qq - Math.floor(qq); return Math.floor(qq) + smoothstep(0.8, 1, f); };
    const secPerU = 50;
    function update(dt, time, camera, u) {
      camera.getWorldPosition(camP);
      if (camP.x * camP.x + camP.z * camP.z > 1e-3) { const az = Math.atan2(camP.x, camP.z); camAzU += prevAz === null ? az : wrapA(az - prevAz); prevAz = az; }
      if (rare) { const w = smoothstep(R0, R0 + 0.012, u) * (1 - smoothstep(R1 - 0.012, R1, u)); back += Math.min(dt, 0.1) * 2 * w; }
      const tau = time - back, s = smearAt(u), lock = u >= S.lock && u < S.outLock;
      for (const r of all) {
        const raw = lock ? camAzU + r.dir * r.drift * tau + r.dir * r.step * (tickOf(tickRate * tau + r.tickOff) - tickRate * 12) + (r.lockOff || 0) : r.dir * r.slow * time;
        if (r.started && r.locked !== lock) r.off = lock && r.period ? r.period * Math.round((r.angle - raw) / r.period) : r.angle - raw;   // into the lock a ring jumps (under the full smear) by whole cycles only, so its picture is the set one
        r.started = true; r.locked = lock; r.angle = raw + r.off;
        // (at the run-down the cranes only draw out a little: streaked birds beside the camera, never blobs)
        if (r.hero) hero.setManual(r.angle, u > 0.5 ? s * 0.4 : s); else { r.g.rotation.y = r.angle; r.mat.uniforms.uSmear.value = s; if (r.deckMat) r.deckMat.uniforms.uSmear.value = s; }
      }
      hero.update(dt, time, camera);
      skyMat.uniforms.uBankK.value = lerp(1, 0.5, smoothstep(30, 95, camP.y));
      windMat.uniforms.uSpin.value = time * 1.1; windMat.uniforms.uAmt.value = Math.min(1, s * 1.5);   // only while the wheel is winding up or running down
      // the wall: gliding on its own clock, but brought to a slit on the path at the entry, and stopped with one on the exit bearing
      const free = 0.0286 * time, inW = smoothstep(0.02, 0.06, u) * (1 - smoothstep(U.slit + 0.03, U.slit + 0.09, u)), outW = smoothstep(U.orb0 - 0.02, U.orb0 + 0.05, u);
      const w = u < 0.5 ? inW : outW, target = u < 0.5 ? W_IN + 0.0286 * secPerU / 1.5 * (u - U.slit) : W_OUT;
      if (w <= 0) wallN = null; else if (wallN === null) wallN = Math.round((free - target) / P_BL);
      HU.uWheel.value.x = wall.rotation.y = (w <= 0 ? free : target + (1 - w) * (free - target - wallN * P_BL)) + (u > 0.5 ? 0.0062 * outW * Math.sin(time * 0.9) : 0);   // settling: it rocks a metre and a half, the slit stays on the path
      for (const t of testWheels) t.rotation.y = t.userData.w * time;
      sunWheel.rotation.z = 0.11 * time;
    }

    const sstep = (a, b, u) => smoothstep(a, b, u);
    // pace: hurried over the yard, lingering in the lock beside the deer and the foxes, slowest of all inside the cranes
    const pace = (u) => 1.5 - 0.3 * sstep(U.slit - 0.01, U.slit + 0.05, u) - 0.25 * sstep(U.deerA - 0.04, U.deerA - 0.01, u) - 0.25 * sstep(S.lock, S.dn1 + 0.01, u)
      + 0.2 * sstep(U.deerB + 0.02, U.deerB + 0.05, u) - 0.2 * sstep(U.fox - 0.03, U.fox - 0.005, u) + 0.0 * sstep(U.rain, U.rain + 0.02, u)
      - 0.32 * sstep(U.orb0 - 0.03, U.orb0 + 0.015, u) + 0.72 * sstep(U.orb1 - 0.012, U.orb1 + 0.04, u) - 0.05 * sstep(0.9, 0.95, u);
    return {
      scene, path, duration: 50, pace,
      camera: { fov: 62, near: 0.3, far: 2500, lookAhead: 22, sway: 0.4, bank: 0.25 },
      pois: makeGaze(path, U, portalPos),
      portal: { shape: 'circle', radius: 7, color: '#FFE9BE', glow: 0.8, revealDistance: 420 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0.3, radius: 0.5, threshold: 1.0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
