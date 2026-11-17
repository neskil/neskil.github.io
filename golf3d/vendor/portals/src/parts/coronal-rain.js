// CORONAL RAIN: hero set piece "The arcade and its rain" (everything procedural; imports three only).
//
// WHAT     A magnetic arcade on the Sun: 9-14 coronal loops, each a tilted half-ellipse of thin glowing gas made
//          of fine gold-white threads that flow foot to crown (limb-brightened: brighter at the silhouette than
//          at the centre), palest violet-white at the crown. The three loops the camera passes closest (L1, L4,
//          L7) are nine separately braided strand tubes each, with black sky between them. Gold beads climb the
//          near legs. At the crowns rose-magenta knots condense, hang, then slide down the curve in showers with
//          comet tails 40-120 m long that follow the threads exactly; the nearest 60 are modelled lumps. Every
//          foot stands on a rose-white splash that flares as a shower lands. At the crown of L1 the strands part
//          round an eye 38 m wide and about 90 m long, wreathed in violet-white threads: the portal sits in it.
//          Two NAVE RIBS (uniform slots 14, 15; anchors.ribs) stand in planes 85-90 m either side of L1, a little
//          lower, and run beside the 60 degree climb line: seen from the climb they sweep in from the left and
//          right edges of the frame and converge on the eye, with a shower always sliding down each toward the
//          lens (four showers a quarter cycle apart) and beads climbing them. They are faint near their feet.
//          Knots and the climb blob are drawn as glowing gas (additive, no silhouette, a core that blooms); each
//          knot's halo is the widened head of the rain ribbon it rides.
//          Also owned: the flare kernel and the new loop that springs from it, and the gold blob on the climb (a
//          translucent teardrop 26 m long with a white-gold core, a halo and a streaming tail).
// SIZE     Local space = world space shifted: put hero.object at world (0, 0, -3040) (anchors.worldOffset).
//          Origin = middle of L1's base. L1 stands in the plane x = 0: near foot (0,0,650), far foot (0,0,-650),
//          crown (0,1040,0), 46 m thick at the foot, 56 m at the crown. The camera arrives from +Z.
//          radius 700, height 1070, center (0, 480, 0). Near feet spread over about x -520..+360.
// OPTS     palette   7 hex strings in the brief's order: gold, amber, umber, rose, violet-white, black, rose-umber
//          rain      'quiet' (default: showers on the far side of most loops and down five near legs) | 'heavy'
//                    (after the flare: every loop, both sides, and violet-white crowns)
//          loops     force the loop count (9-14); default per seed
//          flareAt   [x, z] local position of the flare kernel (default about (-175, 330))
//          fog       (false) honour scene fog. The piece is self-lit plasma in a vacuum, so by default it ignores
//                    fog and applies its own depth cue instead (far loops dim and shift toward violet: opts.far =
//                    [start, end] metres, default [1600, 5200]).
// PER SEED loop count, heights, leans, spacing, thickness, braid twist and handedness, which legs rain, shower
//          sizes and timing, thread flow rates, gold/rose balance. The ribs draw from their own small rng (seeded
//          from choices already made), so adding them changed nothing else about any seed.
// PROGRESS hero.setProgress(u)  path progress 0..1 as in the brief. Drives (a) the flare: kernel whitens at
//          u 0.606-0.615 and eases off by 0.66, the new loop rises from u 0.61 to 0.675 and stays; (b) the gold
//          blob that climbs 90 m ahead of the camera, below and left of the climb line, from u 0.74 and
//          dissolves at u 0.93.
//          hero.setFlare(kernel 0..1, loop 0..1) and hero.setBlob(positionVec3 | null, fade 0..1) drive them
//          directly. Everything else (thread flow, beads, rain, splashes, breathing) is ambient on `time`.
// ANCHORS  (local; add anchors.worldOffset for world space)
//          portalSeat   { position (0,1040,0), normal (0,-0.866,0.5) = the way the portal faces (back down the
//                       climb), radius 10, clearWidth 38 }. Only stars are behind it from the climb line.
//          climbLine    { from (0,209,480), to (0,1040,0), dir }: the 60 degree line, 960 m, inside L1's plane.
//                       Clear by 100 m+ of every loop until the eye itself.
//          flyThrough   ordered points: lake centre, the S between L4 (right) and L1 (left), the pull-up, the
//                       climb, the portal. At least 30 m from every strand; L1's leg passes 40 m to the left.
//          legPass      { L1, L4, L7: near foot positions; camera: where the u 0.60 frame is taken; look }
//          spotCentre   S1's centre (-120,0,1140);  spot2Centre  S2 (150,0,-660)
//          crown, eye { center, halfWidth, halfLength },  entry (0,400,3040) = the world's entry point
//          feet         [{ x, z, r, loop, near }] every footpoint (for umber ovals, jets leaning round them)
//          splashes     [{ x, z, period, phase, r }] one per shower: the shower lands while
//                       fract(time / period + phase) is in 0.87..0.95. Use it for the ripple rings in the sea.
//          kernel       flare kernel position;  flareLoop { from, to }
//          hero.loopPoint(i, s, out) gives the centreline of loop i at s (0 near foot, 0.5 crown, 1 far foot).
// LIGHT    Self-luminous: no lights needed, none added. Written for a black sky; linear HDR. Thread surfaces
//          peak about 0.9, rain-knot cores 2-2.6, the blob's core about 3, splashes up to 3, wreath 1.6, kernel
//          up to 6 (bloom threshold 1.1 as in the brief). Knots carry a gold underlight term (the ground is the lamp).
// COST     175-190k triangles by seed (tubes 108-121k, rain tails 25k, knots 40k), 6 draw calls (tubes, tails and
//          beads, knots, glows, blob, blob halo), no textures, no lights. Build about 120-180 ms, in steps of
//          under 20 ms (it yields between loops and between attribute uploads). ctx.quality.detail thins the
//          rain, the knots and the beads only.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#FFB52E', '#D9781A', '#34160A', '#FF4F86', '#E9E0FF', '#020204', '#7A2338'];
const NL = 17, RIB = 14, FLARE = 16;   // uniform slots: loops 0..13, the two nave ribs 14 and 15, the flare loop last
const PI = Math.PI;

// ---------------------------------------------------------------- shared GLSL: the loop function
// One analytic description of every loop places tubes, strands, beads, rain and knots.
const GLSL_ARC = /* glsl */`
#define NL ${NL}
#define PI 3.14159265
uniform vec3 uC[NL];      // centre of the base line
uniform vec3 uU[NL];      // centre -> near foot
uniform vec3 uH[NL];      // centre -> crown (leaned)
uniform vec3 uN[NL];      // unit normal of the loop plane
uniform vec4 uSw[NL];     // xyz sideways breathing (metres), w phase
uniform vec4 uRG[NL];     // foot radius, crown radius, gain, half-ellipse length (m)
uniform vec4 uMisc[NL];   // x breathing shape (1 crown sways, 2 crown fixed), y 0 plain / 1 braided / 2 nave rib, z flow speed, w crown violet
uniform vec4 uFoot[NL];   // ground height at the near foot, far foot, and how far s runs past 0 and 1 to reach it
uniform vec4 uEye;        // loop index, metres per unit s at the crown, half width, half length
uniform float uTime;
uniform float uPx;        // world size of one pixel at 1 m
uniform vec2 uFar;        // depth cue start, end

vec3 arcC(int i, float s) {
  float a = PI * s;
  return uC[i] + uU[i] * cos(a) + uH[i] * sin(a) + uSw[i].xyz * (sin(a * uMisc[i].x) * sin(uTime * 0.31 + uSw[i].w));
}
vec3 arcT(int i, float s) {
  float a = PI * s;
  return normalize(uH[i] * cos(a) - uU[i] * sin(a));
}
// a thread inside the bundle: off = (angle0, twist per unit s, radius fraction, wobble rate), side = -1 | 1
vec3 arcOff(int i, float s, vec4 off, float side, out vec3 T) {
  float a = PI * s, sa = sin(a);
  vec3 c = arcC(i, s);
  T = arcT(i, s);
  vec3 Nn = uN[i], Bn = cross(Nn, T);
  float R = mix(uRG[i].x, uRG[i].y, sa);
  float th = off.x + off.y * s;
  float rr = R * off.z * (0.74 + 0.26 * sin(off.w * s + off.x * 3.0));
  float ox = rr * cos(th), oy = rr * sin(th);
  if (abs(uEye.x - float(i)) < 0.5) {
    float d = (s - 0.5) * uEye.y / uEye.w;
    float e1 = max(0.0, 1.0 - d * d);
    float e = uEye.z * e1 * sqrt(e1);
    ox = mix(ox, side * sqrt(ox * ox * 0.4 + e * e), smoothstep(0.0, 6.0, e));
  }
  return c + Nn * ox + Bn * oy;
}
`;

const GLSL_FRAG_COMMON = /* glsl */`
uniform vec3 cGold, cAmber, cUmber, cRose, cViolet, cRoseDeep;
uniform float uTime;
float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
// value noise, periodic in x with period px
float vnoise(vec2 p, float px) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, px), x1 = mod(i.x + 1.0, px);
  return mix(mix(h21(vec2(x0, i.y)), h21(vec2(x1, i.y)), f.x), mix(h21(vec2(x0, i.y + 1.0)), h21(vec2(x1, i.y + 1.0)), f.x), f.y);
}
`;

// fog: additive gas is attenuated by fog (never tinted); only compiled in when opts.fog is set
const FOG_VERT_PARS = '#include <fog_pars_vertex>\n';
const FOG_FRAG_PARS = '#include <fog_pars_fragment>\n';
const FOG_ATTEN = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#endif
`;

function lin(hex) { return new THREE.Color(hex); }

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const heavy = opts.rain === 'heavy';
  const useFog = !!opts.fog;
  const group = new THREE.Group(); group.name = 'coronal-rain-arcade';

  // ------------------------------------------------------------ layout of the loops (local space)
  // index 0 = L1 (plane x = 0), 1 = L4 (right-hand neighbour), 2 = L7 (left-hand neighbour): these three are braided.
  const nLoops = Math.max(9, Math.min(14, opts.loops ?? rng.int(9, 14)));
  const hand = rng.sign();                         // braid handedness for this seed
  const warm = rng.range(-1, 1);                   // gold/rose balance for this seed
  const loops = [];
  const nearZ = (x) => 650 + 0.0019 * (x + 120) * (x + 120) - 27;     // the far shore of S1's umbra
  loops.push({ A: [0, 0, 650], B: [0, 0, -650], h: 1040, lean: 0, rf: 23, rc: 28, braided: true, name: 'L1' });
  let xr = 0, xl = 0, mr = 0, ml = 0;
  const taper = rng.range(95, 150), splay = rng.range(1.0, 1.45);      // per seed: how fast the ribs shorten, how far the far feet fan out
  for (let k = 1; k < nLoops; k++) {
    // right side takes about a third of the loops; the first on each side is fixed for the leg pass
    const right = k === 1 ? true : k === 2 ? false : (mr + 1) / (ml + 1) < 0.55;
    let x, m;
    if (right) { mr++; m = mr; xr += mr === 1 ? 150 : rng.range(70, 115); x = xr; }
    else { ml++; m = ml; xl -= ml === 1 ? 98 : rng.range(66, 108); x = xl; }
    const side = right ? 1 : -1;
    const h = Math.max(250, (m === 1 ? rng.range(780, 910) : 940 - m * taper * rng.range(0.85, 1.15)) + rng.range(-45, 45));
    const lean = side * Math.min(30, (m === 1 ? rng.range(5, 8) : 4 + m * rng.range(4.5, 6.5))) * PI / 180;
    const thick = rng.range(24, 40) * (k <= 2 ? 1.08 : 1);
    const zb = -650 + m * rng.range(35, 75) + rng.range(-30, 30) + (m > 2 && rng.chance(0.3) ? rng.range(120, 300) : 0);
    loops.push({
      A: [x, 0, nearZ(x) + rng.range(-12, 12)], B: [x * splay + rng.range(-25, 25) + (right ? 20 : -10), 0, zb],
      h, lean, rf: thick * 0.46, rc: thick * 0.56, braided: k <= 2, name: k === 1 ? 'L4' : k === 2 ? 'L7' : 'L' + (k + 7),
    });
  }
  // the flare loop (slot FLARE): springs from the kernel on the left, inside the arcade
  const kern = opts.flareAt ? new THREE.Vector3(opts.flareAt[0], 0, opts.flareAt[1]) : new THREE.Vector3(-175 + rng.range(-20, 20), 0, 330 + rng.range(-30, 30));
  const flareFar = new THREE.Vector3(kern.x + rng.range(20, 70), 0, kern.z - rng.range(430, 520));
  const flareH = 300, flareLean = -rng.range(4, 12) * PI / 180;

  // the two nave ribs (slots RIB, RIB + 1): loops that stand in planes 85-90 m either side of L1, a little lower and
  // narrower and set 185 m further on, so that their near halves run beside the 60 degree climb line. From the climb
  // they sweep in from the left and right edges of the frame and converge (in perspective) on the eye, passing the
  // lens at 65-95 m with rain sliding down them toward it. They have their own rng, so the parent stream and every
  // other per-seed choice is exactly as it was before they were added.
  let rs = (Math.floor((warm + 1) * 5e5) * 31 + nLoops * 7919 + (hand > 0 ? 13 : 0)) >>> 0;
  const rr = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; };
  rr.range = (a, b) => a + (b - a) * rr();
  const ribs = [
    { A: [-92 + rr.range(-5, 5), 0, 412 + rr.range(-12, 12)], B: [-80 + rr.range(-5, 5), 0, -775 + rr.range(-15, 15)], h: 1004 + rr.range(-8, 8), lean: 1.2 * PI / 180, rf: 10, rc: 12, name: 'RL' },
    { A: [90 + rr.range(-5, 5), 0, 422 + rr.range(-12, 12)], B: [84 + rr.range(-5, 5), 0, -768 + rr.range(-15, 15)], h: 998 + rr.range(-8, 8), lean: -1.2 * PI / 180, rf: 10, rc: 12, name: 'RR' },
  ];

  // uniform arrays
  const uC = [], uU = [], uH = [], uN = [], uSw = [], uRG = [], uMisc = [], uFoot = [];
  for (let i = 0; i < NL; i++) { uFoot.push(new THREE.Vector4()); uC.push(new THREE.Vector3()); uU.push(new THREE.Vector3(0, 0, 1)); uH.push(new THREE.Vector3(0, 1, 0)); uN.push(new THREE.Vector3(-1, 0, 0)); uSw.push(new THREE.Vector4()); uRG.push(new THREE.Vector4(1, 1, 0, 1)); uMisc.push(new THREE.Vector4(1, 0, 1, 0)); }
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vS = new THREE.Vector3();
  function setLoop(i, A, B, h, lean, rf, rc, gain, braided, crownViolet) {
    vA.fromArray(A); vB.fromArray(B);
    uC[i].copy(vA).add(vB).multiplyScalar(0.5);
    uU[i].copy(vA).sub(uC[i]);
    vS.set(uU[i].z, 0, -uU[i].x).normalize();       // horizontal, perpendicular to the base line (+X for L1)
    uH[i].set(0, Math.cos(lean), 0).addScaledVector(vS, Math.sin(lean)).multiplyScalar(h);
    uN[i].copy(uU[i]).cross(uH[i]).normalize();
    const len = PI * Math.sqrt((uU[i].lengthSq() + h * h) / 2);
    uRG[i].set(rf, rc, gain, len);
    uMisc[i].set(i === 0 ? 2 : 1, braided === 2 ? 2 : braided ? 1 : 0, uMisc[i].z, crownViolet);
    return vS;
  }
  loops.forEach((L, i) => {
    const side = setLoop(i, L.A, L.B, L.h, L.lean, L.rf, L.rc, 1, L.braided, heavy ? 1 : (i === 0 ? 1 : rng.range(0.25, 0.6)));
    const amp = i === 0 ? rng.range(5, 7) : rng.range(5, 10);
    uSw[i].set(side.x * amp, 0, side.z * amp, rng.range(0, 6.28));
    uMisc[i].z = rng.range(0.75, 1.3);            // thread flow rate
    L.len = uRG[i].w;
    // feet that stand in a hollow (the umbra's dish): opts.groundAt(x, z) -> local ground height there (<= 0)
    const gy = (F) => Math.max(-90, Math.min(0, opts.groundAt ? opts.groundAt(F[0], F[2]) : 0));
    const ga = gy(L.A), gb = gy(L.B), hy = uH[i].y;
    uFoot[i].set(ga, gb, Math.asin(Math.min(0.3, -ga / hy)) / PI, Math.asin(Math.min(0.3, -gb / hy)) / PI);
    L.ga = ga; L.gb = gb;
  });
  const gyAt = (F) => Math.max(-90, Math.min(0, opts.groundAt ? opts.groundAt(F[0], F[2]) : 0));
  ribs.forEach((L, k) => {
    const i = RIB + k, side = setLoop(i, L.A, L.B, L.h, L.lean, L.rf, L.rc, 1, 2, heavy ? 1 : 0.7);
    const amp = rr.range(3, 4.5);                 // they breathe less: the lens passes close
    uSw[i].set(side.x * amp, 0, side.z * amp, rr.range(0, 6.28));
    uMisc[i].z = rr.range(0.9, 1.3);
    L.len = uRG[i].w; L.slot = i;
    const ga = gyAt(L.A), gb = gyAt(L.B), hy = uH[i].y;
    uFoot[i].set(ga, gb, Math.asin(Math.min(0.3, -ga / hy)) / PI, Math.asin(Math.min(0.3, -gb / hy)) / PI);
    L.ga = ga; L.gb = gb;
  });
  const LP = loops.slice(); ribs.forEach((L) => { LP[L.slot] = L; });      // every loop by uniform slot
  setLoop(FLARE, kern.toArray(), flareFar.toArray(), 1, flareLean, 7, 10, 0, false, 1);
  uMisc[FLARE].z = 2.2;

  const uEye = new THREE.Vector4(0, PI * 650, 21, 58);
  const shared = {
    uC: { value: uC }, uU: { value: uU }, uH: { value: uH }, uN: { value: uN }, uSw: { value: uSw }, uRG: { value: uRG },
    uMisc: { value: uMisc }, uFoot: { value: uFoot }, uEye: { value: uEye }, uTime: { value: 0 }, uPx: { value: 0.0028 },
    uFar: { value: new THREE.Vector2(opts.far?.[0] ?? 1600, opts.far?.[1] ?? 5200) },
    cGold: { value: pal[0].clone().lerp(pal[3], Math.max(0, -warm) * 0.06) }, cAmber: { value: pal[1] }, cUmber: { value: pal[2] },
    cRose: { value: pal[3].clone().lerp(pal[0], Math.max(0, warm) * 0.08) }, cViolet: { value: pal[4] }, cRoseDeep: { value: pal[6] },
  };
  const mkMat = (o) => {
    const m = new THREE.ShaderMaterial({
      uniforms: useFog ? { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...(o.uniforms || {}) } : { ...shared, ...(o.uniforms || {}) },
      vertexShader: '#include <common>\n' + (useFog ? FOG_VERT_PARS : '') + GLSL_ARC.replace('#define PI 3.14159265', '') + o.vertexShader,
      fragmentShader: (useFog ? FOG_FRAG_PARS : '') + GLSL_FRAG_COMMON + o.fragmentShader.replace('//FOG', useFog ? FOG_ATTEN : ''),
      fog: useFog, transparent: o.transparent ?? true, depthWrite: o.depthWrite ?? false, depthTest: true,
      blending: o.blending ?? THREE.AdditiveBlending, side: o.side ?? THREE.FrontSide,
    });
    return m;
  };
  const FOGV = useFog ? '#include <fog_vertex>\n' : '';

  // JS mirror of arcC (without breathing) for anchors
  function loopPoint(i, s, out = new THREE.Vector3()) {
    const a = PI * s;
    return out.copy(uC[i]).addScaledVector(uU[i], Math.cos(a)).addScaledVector(uH[i], Math.sin(a));
  }
  await ctx.yield?.();

  // ------------------------------------------------------------ tubes: sheaths, braided strands, eye wreath (1 draw)
  // Every tube is a thread of the loop function. Vertex data: position = (s, angle 0..1, loop),
  // aOff = thread offset (see arcOff), aPar = (side, radius in m or -fraction of the bundle radius, kind, seed).
  // kind 0 sheath, 1 strand, 2 wreath.
  const tp = [], to = [], tq = [], ti = [];
  let tv = 0;
  function addTube(loop, s0, s1, segs, sides, off, side, radius, kind, seed) {
    for (let j = 0; j <= segs; j++) {
      const s = s0 + (s1 - s0) * (j / segs);
      for (let k = 0; k <= sides; k++) { tp.push(s, k / sides, loop); to.push(off[0], off[1], off[2], off[3]); tq.push(side, radius, kind, seed); }
    }
    for (let j = 0; j < segs; j++) for (let k = 0; k < sides; k++) {
      const a = tv + j * (sides + 1) + k, b = a + sides + 1;
      ti.push(a, a + 1, b, b, a + 1, b + 1);
    }
    tv += (segs + 1) * (sides + 1);
  }
  const strandsOf = [];           // per braided loop and per rib: the strand parameters (rain and beads ride them)
  for (let i = 0; i < loops.length; i++) {
    const L = loops[i];
    if (i % 2 === 1) await ctx.yield?.();
    addTube(i, -uFoot[i].z - 0.004, 1 + uFoot[i].w + 0.004, 96, 8, [0, 0, 0, 0], 0, -1.0, 0, rng());
    if (!L.braided) { addTube(i, -uFoot[i].z - 0.004, 1 + uFoot[i].w + 0.004, 96, 6, [0, 0, 0, 0], 0, -0.52, 0, rng()); continue; }
    const list = [], ns = 9, tw = hand * rng.range(4.2, 5.6) * 2 * PI * (L.len / 2700);
    for (let j = 0; j < ns; j++) {
      const inner = j % 3 === 0;
      const off = [(j / ns) * 2 * PI + rng.range(-0.18, 0.18), tw * (inner ? -0.6 : 1) * rng.range(0.94, 1.06), inner ? rng.range(0.32, 0.42) : rng.range(0.74, 0.92), rng.range(9, 17)];
      const side = i === 0 ? (Math.cos(off[0] + off[1] * 0.5) >= 0 ? 1 : -1) : (j % 2 === 0 ? 1 : -1), rad = (inner ? rng.range(3.4, 4.3) : rng.range(2.6, 3.7)) * (i === 0 ? 1 : 0.82);
      list.push({ off, side, rad });
      addTube(i, -uFoot[i].z - 0.004, 1 + uFoot[i].w + 0.004, i === 0 ? 240 : 140, 6, off, side, rad, 1, rng());
    }
    strandsOf[i] = list;
  }
  // the eye wreath: fine violet-white threads that hug the rim of the eye of L1 at every height
  for (let j = 0; j < 12; j++) {
    const side = j % 2 === 0 ? 1 : -1, up = rng.sign();
    const off = [up * PI / 2 + rng.range(-0.25, 0.25), 0, 0.1 + 0.68 * ((Math.floor(j / 2) + rng()) / 6), 0];
    addTube(0, 0.5 - rng.range(0.034, 0.05), 0.5 + rng.range(0.034, 0.05), 40, 5, off, side, rng.range(0.9, 1.5), 2, rng());
  }
  addTube(FLARE, 0, 1, 96, 8, [0, 0, 0, 0], 0, -1.0, 1, rng());
  addTube(FLARE, 0, 1, 96, 6, [0, 0, 0, 0], 0, -0.5, 1, rng());
  // the ribs: a faint sheath and seven near-parallel strands each, half a turn of twist end to end
  for (const L of ribs) {
    const i = L.slot, s0 = -uFoot[i].z - 0.004, s1 = 1 + uFoot[i].w + 0.004, list = [];
    addTube(i, s0, s1, 96, 8, [0, 0, 0, 0], 0, -1.0, 0, rr());
    addTube(i, s0, s1, 96, 6, [0, 0, 0, 0], 0, -0.55, 0, rr());
    const tw = hand * rr.range(2.2, 3.6);
    for (let j = 0; j < 7; j++) {
      const inner = j === 6;
      const off = [(j / 6) * 2 * PI + rr.range(-0.3, 0.3), tw * rr.range(0.9, 1.1), inner ? rr.range(0.1, 0.3) : rr.range(0.6, 0.95), rr.range(7, 13)];
      const rad = inner ? rr.range(2.2, 2.8) : rr.range(1.5, 2.3);
      list.push({ off, side: 1, rad });
      addTube(i, s0, s1, 132, 6, off, 1, rad, 1, rr());
    }
    strandsOf[i] = list;
  }
  await ctx.yield?.();
  const tubeGeo = new THREE.BufferGeometry();
  tubeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tp), 3));
  await ctx.yield?.();
  tubeGeo.setAttribute('aOff', new THREE.BufferAttribute(new Float32Array(to), 4));
  await ctx.yield?.();
  tubeGeo.setAttribute('aPar', new THREE.BufferAttribute(new Float32Array(tq), 4));
  await ctx.yield?.();
  tubeGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(ti), 1));
  await ctx.yield?.();
  tubeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 500, 0), 1600);
  const tubeMat = mkMat({
    vertexShader: /* glsl */`
      attribute vec4 aOff, aPar;
      varying vec3 vN, vView;
      varying vec4 vA;     // s, angle, length coordinate (m), kind
      varying vec4 vB;     // gain, distance, flow, crown violet
      varying vec3 vE;     // local height, width dimming, seed
      void main() {
        float s = position.x; int i = int(position.z + 0.5);
        float kind = aPar.z;
        vec3 T; vec3 c = arcOff(i, s, aOff, aPar.x, T);
        vec3 T2; vec3 c2 = arcOff(i, s + 0.0015, aOff, aPar.x, T2);
        vec3 Ts = normalize(c2 - c);
        vec3 n1 = normalize(cross(Ts, uN[i])), n2 = cross(Ts, n1);
        float len = uRG[i].w, sa = sin(PI * s);
        float r = aPar.y;
        float foot = max(min(s, 1.0 - s), 0.0) * len;             // metres from the nearer foot (0 below the surface: feet sunk into a dish must not flare)
        if (r < 0.0) r = -r * mix(uRG[i].x, uRG[i].y, sa) * (1.0 + 0.07 * sin(s * 31.0 + uTime * 0.21 + aPar.w * 6.0)) * (1.0 + 0.30 * exp(-foot / 45.0));
        else r *= 1.0 + 0.22 * sin(s * len / 41.0 + aPar.w * 40.0 - uTime * 0.5) + 0.25 * exp(-foot / 30.0);
        vec3 wc = (modelMatrix * vec4(c, 1.0)).xyz;
        float dist = length(cameraPosition - wc);
        float rmin = 0.8 * uPx * dist;
        float dim = r / max(r, rmin); r = max(r, rmin);
        float a = position.y * 6.2831853;
        vec3 dir = cos(a) * n1 + sin(a) * n2;
        vec3 p = c + dir * r;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vN = mat3(modelMatrix) * dir; vView = cameraPosition - wp.xyz;
        float fade = 1.0;
        if (kind > 1.5) fade = 1.0 - smoothstep(0.78, 1.04, abs(s - 0.5) * uEye.y / uEye.w);
        vA = vec4(s, position.y, abs(s - 0.5) * len, kind);
        vB = vec4(uRG[i].z * fade, dist, uMisc[i].z, uMisc[i].w);
        // braided loops: the sheath is only a far-off envelope, and never veils the eye
        if (kind < 0.5 && abs(uMisc[i].y - 1.0) < 0.5) vB.x *= 0.5 * smoothstep(350.0, 1500.0, dist) * (abs(uEye.x - float(i)) < 0.5 ? smoothstep(0.03, 0.09, abs(s - 0.5)) : 1.0);
        // nave ribs: thin near their feet (they must not stand as columns in the S), full strength overhead
        if (uMisc[i].y > 1.5) vB.x *= mix(0.22, 1.0, smoothstep(80.0, 430.0, p.y)) * (kind < 0.5 ? 0.55 : 1.15);
        vE = vec3(p.y - (s < 0.5 ? uFoot[i].x : uFoot[i].y), dim, aPar.w);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        ${FOGV}
      }`,
    fragmentShader: /* glsl */`
      uniform vec2 uFar;
      varying vec3 vN, vView; varying vec4 vA, vB; varying vec3 vE;
      void main() {
        float kind = vA.w, s = vA.x;
        float ndv = abs(dot(normalize(vN), normalize(vView)));
        float edge = 1.0 / max(ndv, 0.25);                                  // thin gas: brightest at the silhouette
        float flow = uTime * vB.z;
        float ang = vA.y + vE.z + s * 0.6;
        float th, I;
        if (kind < 0.5) {
          // far off a thread is thinner than a pixel: draw the noise out along the loop and lift the floor, so a
          // distant arch is one continuous glowing curve (both legs), not a string of beads
          float farT = smoothstep(800.0, 2400.0, vB.y), ls = 1.0 + 3.0 * farT;
          float t1 = vnoise(vec2(ang * 22.0 + s * 3.0, vA.z / (120.0 * ls) + flow * 0.55 / ls), 22.0);
          float t2 = vnoise(vec2(ang * 52.0 - s * 5.0, vA.z / (70.0 * ls) + flow * 0.9 / ls + 7.3), 52.0);
          float l1 = smoothstep(0.5 - 0.2 * farT, 0.92, t1), l2 = smoothstep(0.58 - 0.2 * farT, 0.97, t2);
          th = mix(l1 * 0.75 + l2 * 0.65, 0.42, 0.55 * farT);
          I = min(0.9, (mix(0.014, 0.085, farT) + 0.4 * th) * (0.55 + 0.45 * min(edge, 2.6)));
        } else {
          float t1 = vnoise(vec2(ang * 13.0, vA.z / 60.0 + flow * 1.3), 13.0);
          float t2 = vnoise(vec2(ang * 31.0, vA.z / 24.0 + flow * 2.1 + 3.1), 31.0);
          float t3 = vnoise(vec2(ang * 3.0, vA.z / 150.0 + flow * 0.6), 3.0);
          float l1 = smoothstep(0.42, 0.85, t1), l2 = smoothstep(0.5, 0.95, t2);
          float t4 = vnoise(vec2(ang * 67.0, vA.z / 9.0 + flow * 4.0 + 1.7), 67.0);
          float fine = 1.0 - smoothstep(60.0, 420.0, vB.y);                 // hair-fine threads, only near the lens
          th = (l1 * 0.7 + l2 * 0.6 + smoothstep(0.55, 0.95, t4) * 0.4 * fine) * (0.35 + 1.0 * t3) * mix(1.0, 0.55 + 0.9 * t4, fine);
          I = min(0.9, (0.045 * (1.0 - 0.7 * vB.w * smoothstep(0.9, 1.0, sin(3.14159265 * s))) + 0.33 * th) * (0.4 + 0.6 * edge)) * mix(1.0, 1.7, smoothstep(200.0, 1200.0, vB.y));
          if (kind > 1.5) I = min(0.75, (0.2 + 0.5 * th) * (0.4 + 0.6 * edge));
        }
        float sa = sin(3.14159265 * s);
        vec3 hot = mix(cGold, vec3(1.0, 0.93, 0.78), 0.55);
        vec3 col = mix(cAmber, cGold, smoothstep(0.0, 0.6, th));
        col = mix(col, hot, 0.45 * smoothstep(0.7, 1.3, th));
        // crowns: gold -> pale gold-white -> violet-white on the thread crests (never through grey)
        float cv = vB.w * smoothstep(0.9, 1.0, sa);
        col = mix(col, vec3(1.0, 0.9, 0.82), smoothstep(0.0, 0.5, cv) * 0.6);
        col = mix(col, cViolet, smoothstep(0.35, 1.0, cv) * (0.4 + 0.6 * smoothstep(0.1, 0.8, th)));
        if (kind > 1.5) col = cViolet;
        else I *= 1.0 - 0.3 * cv;
        // feet: gold-hot and dissolving into the surface
        float y = vE.x;
        col = mix(col, mix(cGold, hot, 0.5), 0.6 * exp(-max(y, 0.0) / 70.0));
        I *= (1.0 + 0.7 * exp(-max(y, 0.0) / 40.0)) * smoothstep(-2.0, 14.0, y);
        float f = smoothstep(uFar.x, uFar.y, vB.y);
        float lum = dot(col, vec3(0.3, 0.55, 0.15));
        col = mix(col, cViolet * lum, f * 0.6) * (1.0 - 0.5 * f);
        col *= I * vB.x * vE.y;
        //FOG
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`,
  });
  const tubes = new THREE.Mesh(tubeGeo, tubeMat); tubes.frustumCulled = false; tubes.renderOrder = 2; group.add(tubes);
  await ctx.yield?.();

  // ------------------------------------------------------------ the rain: showers of drops, beads, knots
  // A drop is (aA = loop, direction along s, hang position s0, kind) + aOff (its thread) + aT = (period, phase,
  // size, side). kind 0 = rain knot with tail, 1 = gold bead climbing a leg.
  const GLSL_DROP = /* glsl */`
    // returns head position s; q = fall progress 0..1, grow = condensation 0..1, alive = visibility
    float dropS(int i, vec4 A, vec4 Tm, out float q, out float grow, out float alive) {
      float ph = fract(uTime / Tm.x + Tm.y);
      if (A.w > 0.5) {                                   // bead: evenly spaced, quick, foot to shoulder
        q = ph; grow = 1.0; alive = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.62, 1.0, ph));
        return A.y > 0.0 ? ph * A.z : 1.0 - ph * A.z;
      }
      grow = smoothstep(0.0, 0.22, ph);
      q = clamp((ph - 0.25) / 0.70, 0.0, 1.0);
      float d = (30.0 * q + 55.0 * q * q) / 85.0;       // 30 -> 140 m/s
      alive = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.935, 0.955, ph));
      float s0 = A.z + A.y * 0.006 * min(ph, 0.25) * 4.0;
      return mix(s0, A.y > 0.0 ? 1.0 + uFoot[i].w : -uFoot[i].z, d);
    }`;
  const drops = [], splashes = [], feet = [];
  const NR = Math.round(2400 * detail), NK = Math.round(60 * detail), NB = Math.round(360 * detail);
  const NKR = Math.round(8 * detail);            // modelled knots per rib shower
  const order = rng.shuffle([...Array(loops.length - 3).keys()].map((k) => k + 3));
  const nearRain = new Set([0, 1, 2, ...(heavy ? order : order.slice(0, 2))]);
  const farRain = new Set([0, 1, 2, ...(heavy ? order : order.slice(1, 1 + Math.ceil(order.length * 0.6)))]);
  const showers = [];
  for (let i = 0; i < loops.length; i++) for (const dir of [-1, 1]) {
    if (!(dir < 0 ? nearRain : farRain).has(i)) continue;
    const n = heavy ? rng.int(2, 4) : (i < 3 && dir < 0 ? 2 : rng.int(1, 2));
    for (let k = 0; k < n; k++) {
      const fall = loops[i].len * 0.5 / 85 / 0.7;
      showers.push({ loop: i, dir, count: rng.int(20, 60) * (i < 3 && dir < 0 ? 1.5 : 1), period: fall * rng.range(0.9, 1.3), phase: (k + rng.range(0, 0.6)) / n + i * 0.37,
        th: rng.range(0, 6.28), rho: rng.range(0.2, 0.8), strand: rng.int(0, 8) });
    }
  }
  const total = showers.reduce((a, s) => a + s.count, 0);
  let knotsLeft = NK; const knotShowers = showers.filter((s) => s.dir < 0 && s.loop < 3).length;
  for (const sh of showers) {
    const L = loops[sh.loop], n = Math.max(6, Math.round(sh.count * NR / total));
    const nk = sh.dir < 0 && sh.loop < 3 ? Math.min(knotsLeft, Math.ceil(NK / knotShowers)) : 0; knotsLeft -= nk;
    for (let k = 0; k < n; k++) {
      let off, side = rng.sign();
      if (L.braided) { const st = strandsOf[sh.loop][(sh.strand + rng.int(0, 2)) % 9]; off = [st.off[0] + rng.range(-0.05, 0.05), st.off[1], st.off[2], st.off[3]]; side = st.side; }
      else off = [sh.th + rng.gauss() * 0.45, 0, Math.max(0.05, Math.min(0.95, sh.rho + rng.gauss() * 0.16)), 0];
      const knot = k < nk, big = knot || rng.chance(0.12);
      drops.push({ A: [sh.loop, sh.dir, 0.5 + sh.dir * rng.range(0.004, 0.075), knot ? 0.25 : 0], off, T: [sh.period, sh.phase + rng.range(0, 0.08), big ? rng.range(6, 14) : rng.range(2.6, 6.5), side], knot });
    }
    const F = sh.dir < 0 ? L.A : L.B;
    splashes.push({ x: F[0], z: F[2], period: sh.period, phase: sh.phase % 1, r: 15, loop: sh.loop, near: sh.dir < 0 });
  }
  // the ribs: four showers a quarter of a cycle apart down each near half (so at any moment, whatever the clock, one
  // is sliding past the climb line toward the lens) and two down the far half. Knots ride the strands.
  for (const L of ribs) for (const dir of [-1, 1]) {
    const n = dir < 0 ? 4 : 2, fall = L.len * 0.5 / 85 / 0.7, period = fall * rr.range(0.95, 1.1), ph0 = rr();
    for (let k = 0; k < n; k++) {
      const phase = ph0 + (k + rr.range(-0.08, 0.08)) / n, count = Math.round((dir < 0 ? 26 : 18) * (0.5 + 0.5 * detail)), st0 = Math.floor(rr() * 7);
      for (let j = 0; j < count; j++) {
        const st = strandsOf[L.slot][(st0 + Math.floor(rr() * 3)) % 7], knot = dir < 0 && j < NKR;
        drops.push({ A: [L.slot, dir, 0.5 + dir * rr.range(0.006, 0.085), knot ? 0.25 : 0], off: [st.off[0] + rr.range(-0.06, 0.06), st.off[1], st.off[2], st.off[3]],
          T: [period, phase + rr.range(0, 0.07), knot ? rr.range(6, 11) : rr() < 0.2 ? rr.range(5, 8) : rr.range(2.6, 5.5), 1], knot });
      }
      const F = dir < 0 ? L.A : L.B;
      splashes.push({ x: F[0], z: F[2], period, phase: phase % 1, r: 15, loop: L.slot, near: dir < 0 });
    }
  }
  loops.forEach((L, i) => { feet.push({ x: L.A[0], z: L.A[2], r: L.rf, loop: i, near: true }); feet.push({ x: L.B[0], z: L.B[2], r: L.rf, loop: i, near: false }); });
  ribs.forEach((L) => { feet.push({ x: L.A[0], z: L.A[2], r: L.rf, loop: L.slot, near: true }); feet.push({ x: L.B[0], z: L.B[2], r: L.rf, loop: L.slot, near: false }); });
  // beads: evenly spaced, climbing the near legs (and a few far legs)
  const beadLegs = [];
  for (let i = 0; i < loops.length; i++) { beadLegs.push([i, 1]); if (i > 2 && rng.chance(0.4)) beadLegs.push([i, -1]); }
  const perLeg = Math.max(4, Math.floor(NB / (beadLegs.length + 6)));
  for (const [i, dir] of beadLegs) {
    const L = loops[i], lanes = L.braided ? 3 : 1, reach = rng.range(0.36, 0.44), speed = rng.range(95, 130);
    for (let ln = 0; ln < lanes; ln++) {
      const st = L.braided ? strandsOf[i][(ln * 3 + 1 + i) % 9] : null;
      const off = st ? st.off : [rng.range(0, 6.28), 0, rng.range(0.3, 0.9), 0], period = reach * L.len / speed, ph0 = rng();
      for (let k = 0; k < perLeg; k++) drops.push({ A: [i, dir, reach, 1], off, T: [period, ph0 + k / perLeg, rng.range(10, 20), st ? st.side : 1], knot: false });
    }
  }
  for (const L of ribs) {                        // gold beads climbing the ribs' near legs, past the lens on the climb
    const reach = rr.range(0.34, 0.4), period = reach * L.len / rr.range(100, 125);
    for (let ln = 0; ln < 2; ln++) {
      const st = strandsOf[L.slot][ln * 3 + 1], ph0 = rr(), nb = Math.max(4, Math.round(9 * detail));
      for (let k = 0; k < nb; k++) drops.push({ A: [L.slot, 1, reach, 1], off: st.off, T: [period, ph0 + k / nb, rr.range(10, 18), 1], knot: false });
    }
  }
  await ctx.yield?.();
  drops.sort((a, b) => (b.knot ? 1 : 0) - (a.knot ? 1 : 0));
  const nKnots = drops.filter((d) => d.knot).length;
  const dA = new Float32Array(drops.length * 4), dO = new Float32Array(drops.length * 4), dT = new Float32Array(drops.length * 4);
  drops.forEach((d, k) => { dA.set(d.A, k * 4); dO.set(d.off, k * 4); dT.set(d.T, k * 4); });

  // tails: tangent-aligned soft ribbons of 4 segments that bend along the thread
  const SEG = 4, bp = [], bi = [];
  for (let j = 0; j <= SEG; j++) bp.push(-1, j / SEG, 0, 1, j / SEG, 0);
  for (let j = 0; j < SEG; j++) { const a = j * 2; bi.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  const rainGeo = new THREE.InstancedBufferGeometry();
  rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); rainGeo.setIndex(bi);
  rainGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(dA, 4));
  rainGeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(dO, 4));
  rainGeo.setAttribute('aT', new THREE.InstancedBufferAttribute(dT, 4));
  rainGeo.instanceCount = drops.length;
  const rainMat = mkMat({
    side: THREE.DoubleSide,
    vertexShader: GLSL_DROP + /* glsl */`
      attribute vec4 aA, aOff, aT;
      varying vec2 vUV; varying vec4 vP, vQ;
      void main() {
        int i = int(aA.x + 0.5);
        float q, grow, alive; float sH = dropS(i, aA, aT, q, grow, alive);
        float len = uRG[i].w, bead = step(0.5, aA.w), size = aT.z;
        float headLen = mix(size * 0.7, size, bead);
        float kn = step(0.2, aA.w) * (1.0 - bead);                                    // this drop carries a modelled knot
        float tail = mix((40.0 + 80.0 * q) * (0.7 + 0.06 * size) * (1.0 + 0.35 * kn), 0.0, bead) + headLen;   // 40 m while it hangs, 60-120 m (knots to 160 m) falling
        float s = clamp(sH + aA.y * (headLen - position.y * tail) / len, -uFoot[i].z, 1.0 + uFoot[i].w);
        vec3 T; vec3 c = arcOff(i, s, aOff, aT.w, T);
        vec3 wc = (modelMatrix * vec4(c, 1.0)).xyz, Tw = mat3(modelMatrix) * T;
        vec3 V = cameraPosition - wc; float dist = length(V);
        vec3 sv = normalize(cross(Tw, V) + vec3(1e-4, 0.0, 0.0));
        float w0 = size * 0.5 * grow * (1.0 + 0.9 * kn);                             // a knot's head is its soft halo
        float w = mix(w0 * mix(1.0, 0.3 / (1.0 + 0.9 * kn), position.y), 2.2, bead);
        float wmin = 0.8 * uPx * dist, wr = sqrt(w / max(w, wmin)), dim = wr * (0.45 + 0.55 * wr);
        w = max(w, wmin);
        wc += sv * position.x * w;
        vUV = position.xy;
        float fd = smoothstep(uFar.x, uFar.y, dist);
        vP = vec4(bead + 0.25 * kn, alive * dim * (1.0 - 0.45 * fd) * mix(0.42, 1.0, smoothstep(50.0, 260.0, dist)), headLen / tail, aT.y * 37.0 + aOff.x);   // close to the lens a drop covers many pixels: thinner, so a shower never sums to white
        vQ = vec4(q, tail / max(max(w0, wmin), 0.01), grow, uMisc[i].w);
        vec4 mvPosition = viewMatrix * vec4(wc, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        ${FOGV}
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUV; varying vec4 vP, vQ;
      void main() {
        float x = vUV.x, y = vUV.y, hy = vP.z;
        float ex = exp(-x * x * 3.2) * (1.0 - x * x);
        vec3 col;
        if (vP.x > 0.5) {
          float cap = ex * smoothstep(0.0, 0.16, y) * (1.0 - smoothstep(0.25, 1.0, y));
          col = (cGold * 0.85 + vec3(1.0, 0.92, 0.75) * 0.45 * cap) * cap;
        } else {
          float dy = (y - hy) * vQ.y;
          float kn = step(0.2, vP.x);
          float head = exp(-(x * x * 2.6 + dy * dy * 1.1)) * (1.0 - x * x) * vQ.z;
          float lumps = 0.45 + 0.75 * vnoise(vec2(y * vQ.y * 0.22 + vP.w, vP.w * 3.0), 4096.0);
          float tl = pow(max(1.0 - y, 0.0), 1.3) * smoothstep(0.0, hy, y) * ex * lumps * (0.6 + 0.4 * smoothstep(0.0, 0.1, vQ.x)) * (1.0 + 0.7 * kn);
          head *= 0.5 + 0.5 * smoothstep(0.0, 0.08, vQ.x);
          col = cRoseDeep * (tl + head * 0.25 * kn) + cRose * (tl * 0.85 + head * mix(1.0, 0.16, kn)) + vec3(1.0, 0.82, 0.9) * (head * head * mix(0.6, 0.04, kn) + tl * tl * 0.25 * kn);
        }
        col *= vP.y;
        //FOG
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`,
  });
  const rain = new THREE.Mesh(rainGeo, rainMat); rain.frustumCulled = false; rain.renderOrder = 4; group.add(rain);
  await ctx.yield?.();

  // ------------------------------------------------------------ modelled knots: lumpy teardrops at the heads of the
  // near-leg rain (instances share the first nKnots drops, so each sits exactly at the head of its tail)
  const GLSL_LUMP = /* glsl */`
    float lump(vec3 p, float sd, float amp) {
      return 1.0 + amp * (sin(p.x * 2.9 + sd * 9.0) * sin(p.y * 3.3 + sd * 5.0) * sin(p.z * 2.6 + sd * 7.0)
                 + 0.36 * sin(p.x * 6.1 + sd * 3.0 + uTime * 0.9) * sin(p.y * 5.3 - sd) * sin(p.z * 6.7 + sd * 2.0)
                 + 0.14 * sin(p.x * 13.0 + sd) * sin(p.y * 12.0 + uTime * 1.3) * sin(p.z * 11.0));
    }
    // a knot: a lumpy head drawn out behind (-z) into a short teardrop, longer the faster it falls (q)
    vec3 shp(vec3 p, float sd, float q) {
      vec3 v = p * lump(p, sd, 0.27);
      float back = smoothstep(0.1, -1.0, p.z);
      v.z *= mix(1.2, 1.9 + 2.1 * q, back);
      v.xy *= 1.0 - 0.62 * back * (0.5 + 0.5 * q);
      return v;
    }
    // the climb blob: a smooth teardrop 4.7 radii long whose tail thins to a wavering point
    vec3 tear(vec3 p, float sd, float q) {
      vec3 v = p * lump(p, sd, 0.1);
      float back = smoothstep(0.25, -1.0, p.z);
      v.z *= mix(1.15, 3.6, back);
      v.xy *= 1.0 - 0.84 * back * back;
      v.xy += vec2(sin(v.z * 0.9 + uTime * 1.7), cos(v.z * 0.7 + uTime * 1.3)) * 0.1 * back;
      return v;
    }
    vec3 shpN(vec3 p, float sd, float q, out vec3 P0) {
      vec3 t1 = normalize(cross(p, vec3(0.31, 0.9, 0.3))), t2 = cross(p, t1);
      P0 = SHAPE(p, sd, q);
      return normalize(cross(SHAPE(normalize(p + t1 * 0.07), sd, q) - P0, SHAPE(normalize(p + t2 * 0.07), sd, q) - P0));
    }`;
  // Knots and the blob are glowing gas, not solids: nothing at the silhouette (a ray there passes through almost no
  // gas), brightest through the middle, with a core that blooms. They are blended "over" (premultiplied: colour +
  // what is behind x (1 - alpha), alpha from the thickness), so a cluster of knots in front of a gold rib keeps its
  // rose instead of summing to white. Their soft halo is the head of the rain ribbon each knot rides (see rainMat)
  // and, for the blob, its own halo ribbon below.
  const KNOT_FRAG = /* glsl */`
      varying vec3 vN, vView, vL; varying vec4 vK;     // vK: gain, seed, gold 0..1, dissolve threshold
      void main() {
        vec3 n = normalize(vN);
        float ndv = abs(dot(n, normalize(vView)));
        float mott = vnoise(vL.xy * 2.3 + vL.z * 1.7 + vK.y, 4096.0);
        float m2 = vnoise(vL.yz * 5.1 - vL.x * 2.3 + vK.y * 3.0 + uTime * 0.35, 4096.0);
        if (vK.w < mott) discard;
        float thick = pow(ndv, 2.4), core = thick * thick;         // soft to the rim, even on a long body seen side-on
        vec3 deep = mix(cRoseDeep * 1.4, cAmber, vK.z), body = mix(cRose, cGold, vK.z), hot = mix(vec3(1.0, 0.76, 0.86), vec3(1.0, 0.94, 0.78), vK.z);
        vec3 col = deep * thick * (0.3 + 0.4 * mott) + body * core * mix(0.45 + 0.5 * mott, 0.4 + 0.4 * mott, vK.z) * (0.7 + 0.6 * m2)
                 + hot * core * core * core * mix(0.34 + 0.3 * m2, 0.4 + 0.3 * m2, vK.z)
                 + cGold * max(0.0, -n.y) * 0.14 * thick * (1.0 - vK.z);       // the ground is the lamp
        col *= vK.x;
        //FOG
        gl_FragColor = vec4(max(col, 0.0), clamp(thick * 0.8 * vK.x, 0.0, 1.0));
      }`;
  const ico = new THREE.IcosahedronGeometry(1, 3);
  const knotGeo = new THREE.InstancedBufferGeometry();
  knotGeo.setAttribute('position', ico.getAttribute('position'));
  knotGeo.setAttribute('aA', rainGeo.getAttribute('aA')); knotGeo.setAttribute('aOff', rainGeo.getAttribute('aOff')); knotGeo.setAttribute('aT', rainGeo.getAttribute('aT'));
  knotGeo.instanceCount = nKnots;
  const knotMat = mkMat({
    vertexShader: GLSL_DROP + GLSL_LUMP.replace(/SHAPE/g, 'shp') + /* glsl */`
      attribute vec4 aA, aOff, aT;
      varying vec3 vN, vView, vL; varying vec4 vK;
      void main() {
        int i = int(aA.x + 0.5);
        float q, grow, alive; float sH = dropS(i, aA, aT, q, grow, alive);
        vec3 T; vec3 c = arcOff(i, sH, aOff, aT.w, T);
        vec3 m = T * aA.y, n1 = normalize(cross(m, uN[i])), n2 = cross(m, n1);
        float sd = aT.y * 17.3 + aOff.x, ca = cos(sd * 5.0 + uTime * 0.25), sn = sin(sd * 5.0 + uTime * 0.25);
        vec3 p = position; p.xy = mat2(ca, -sn, sn, ca) * p.xy;
        vec3 P0; vec3 nl = shpN(p, sd, q, P0);
        float r = aT.z * 0.5 * grow * alive;
        vec3 lp = c + (n1 * P0.x + n2 * P0.y + m * P0.z) * r;
        vec4 wp = modelMatrix * vec4(lp, 1.0);
        vN = mat3(modelMatrix) * (n1 * nl.x + n2 * nl.y + m * nl.z); vView = cameraPosition - wp.xyz; vL = P0;
        vK = vec4(1.0 - 0.4 * smoothstep(uFar.x, uFar.y, length(vView)), sd, 0.0, 2.0);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        ${FOGV}
      }`,
    fragmentShader: KNOT_FRAG,
  });
  const overBlend = (m) => { m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; return m; };
  overBlend(knotMat);
  const knots = new THREE.Mesh(knotGeo, knotMat); knots.frustumCulled = false; knots.renderOrder = 5; group.add(knots);

  // the gold blob that climbs beside the climb line ahead of the camera (placed by setProgress / setBlob): a glowing
  // translucent teardrop 26 m long, lying 42 degrees across the line of sight so that it reads as a teardrop and not
  // as a disc, with a white-gold core, a soft halo and a streaming tail (the halo ribbon).
  const blobMat = mkMat({
    uniforms: { uFade: { value: 0 } },
    vertexShader: GLSL_LUMP.replace(/SHAPE/g, 'tear') + /* glsl */`
      uniform float uFade;
      varying vec3 vN, vView, vL; varying vec4 vK;
      void main() {
        vec3 P0; vec3 nl = shpN(position, 3.7, 1.0, P0);
        vec4 wp = modelMatrix * vec4(P0, 1.0);
        vN = mat3(modelMatrix) * nl; vView = cameraPosition - wp.xyz; vL = P0;
        vK = vec4(0.95 * uFade, 3.7, 1.0, uFade * 1.3 - 0.15);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        ${FOGV}
      }`,
    fragmentShader: KNOT_FRAG,
  });
  overBlend(blobMat);
  const blob = new THREE.Mesh(ico, blobMat); blob.scale.setScalar(5.5); blob.visible = false; blob.frustumCulled = false; blob.renderOrder = 5; group.add(blob);
  const haloGeo = new THREE.PlaneGeometry(2, 1, 1, 10); haloGeo.translate(0, 0.5, 0);
  const uBP = { value: new THREE.Vector3() }, uBA = { value: new THREE.Vector3(0, 1, 0) };
  const haloMat = mkMat({
    side: THREE.DoubleSide, uniforms: { uFade: blobMat.uniforms.uFade, uBP, uBA },
    vertexShader: /* glsl */`
      uniform vec3 uBP, uBA;
      varying vec2 vUV;
      void main() {
        vec3 c = uBP + uBA * (18.0 - position.y * 84.0);            // 18 m ahead of the body's centre to 66 m behind it
        vec3 wc = (modelMatrix * vec4(c, 1.0)).xyz, aw = mat3(modelMatrix) * uBA;
        vec3 sv = normalize(cross(aw, cameraPosition - wc) + vec3(1e-4, 0.0, 0.0));
        wc += sv * position.x * 18.0;
        vUV = position.xy;
        vec4 mvPosition = viewMatrix * vec4(wc, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        ${FOGV}
      }`,
    fragmentShader: /* glsl */`
      uniform float uFade;
      varying vec2 vUV;
      void main() {
        float xm = vUV.x * 18.0, m = 18.0 - vUV.y * 84.0;
        float halo = exp(-(xm * xm / 105.0 + m * m / (m > 0.0 ? 80.0 : 380.0)));
        float streak = 0.35 + 0.95 * vnoise(vec2(xm * 0.33 + 3.0, m * 0.08 + uTime * 1.5), 4096.0);
        float tail = (1.0 - step(0.0, m)) * exp(m / 24.0) * exp(-xm * xm / (10.0 + 0.5 * abs(m))) * streak * smoothstep(0.0, 9.0, -m);
        vec3 col = cGold * 0.3 * halo + mix(cAmber, cGold, 0.45) * 0.4 * tail + vec3(1.0, 0.9, 0.7) * 0.07 * halo * halo;
        col *= uFade * (1.0 - vUV.x * vUV.x) * smoothstep(0.0, 0.07, vUV.y) * (1.0 - smoothstep(0.8, 1.0, vUV.y));
        //FOG
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`,
  });
  const blobHalo = new THREE.Mesh(haloGeo, haloMat); blobHalo.visible = false; blobHalo.frustumCulled = false; blobHalo.renderOrder = 4; group.add(blobHalo);
  await ctx.yield?.();

  // ------------------------------------------------------------ footpoint glows, splashes and the flare kernel (1 draw)
  // aS = (x, y, z, radius), aF = (period, phase, steady level, flash level), aG = kind: 0 flat disc on the
  // surface, 1 upright soft flare facing the camera, 2 kernel (upright), 3 kernel (flat)
  const gS = [], gF = [], gG = [];
  for (const f of feet) {
    const L = LP[f.loop], gy = f.near ? L.ga : L.gb;
    gS.push(f.x, gy + 3.5, f.z, f.r * 3.4); gF.push(1, 0, 0.32, 0); gG.push(0);
    gS.push(f.x, gy, f.z, f.r * 2.6); gF.push(1, 0, 0.16, 0); gG.push(1);
  }
  for (const sp of splashes) {
    const L = LP[sp.loop], gy = sp.near ? L.ga : L.gb;
    gS.push(sp.x, gy + 3.8, sp.z, 34); gF.push(sp.period, sp.phase, 0, 2.6); gG.push(0);
    gS.push(sp.x, gy, sp.z, 30); gF.push(sp.period, sp.phase, 0, 1.5); gG.push(1);
  }
  gS.push(kern.x, 0, kern.z, 50); gF.push(1, 0, 0, 0); gG.push(2);
  gS.push(kern.x, 4, kern.z, 58); gF.push(1, 0, 0, 0); gG.push(3);
  const glowGeo = new THREE.InstancedBufferGeometry();
  glowGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); glowGeo.setIndex([0, 1, 2, 0, 2, 3]);
  glowGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(gS), 4));
  glowGeo.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(gF), 4));
  glowGeo.setAttribute('aG', new THREE.InstancedBufferAttribute(new Float32Array(gG), 1));
  glowGeo.instanceCount = gG.length;
  const uKernel = { value: 0 };
  const glowMat = mkMat({
    side: THREE.DoubleSide, uniforms: { uKernel },
    vertexShader: /* glsl */`
      attribute vec4 aS, aF; attribute float aG;
      uniform float uKernel;
      varying vec2 vUV; varying vec4 vG; varying float vR;
      void main() {
        float f = fract(uTime / aF.x + aF.y + 0.13);
        float pulse = smoothstep(0.0, 0.02, f) * (1.0 - smoothstep(0.08, 0.2, f));
        float I = aF.z * (0.85 + 0.15 * sin(uTime * 1.7 + aS.x)) + aF.w * pulse;
        if (aG > 1.5) I = uKernel * 4.0;
        vec3 c = (modelMatrix * vec4(aS.xyz, 1.0)).xyz;
        float flat_ = step(abs(aG - 1.5), 1.0) < 0.5 ? 1.0 : 0.0;       // kinds 0 and 3 lie on the surface
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 wp = flat_ > 0.5 ? c + vec3(position.x, 0.0, position.y) * aS.w
                              : c + right * position.x * aS.w + vec3(0.0, 1.0, 0.0) * (position.y * 0.5 + 0.42) * aS.w;
        vUV = position.xy;
        vG = vec4(I, flat_, f / 0.2, aG);
        vR = flat_ * step(0.01, aF.w) * (1.0 - min(f / 0.2, 1.0));
        vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        ${FOGV}
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUV; varying vec4 vG; varying float vR;
      void main() {
        float d = length(vUV), edge = 1.0 - smoothstep(0.7, 1.0, d);
        float kq = step(1.5, vG.w);
        float g = exp(-d * d * mix(6.0, 9.0, kq)), g2 = exp(-d * d * mix(22.0, 40.0, kq));
        float ring = exp(-(d - vG.z * 0.85) * (d - vG.z * 0.85) * 90.0) * vR;
        vec3 tint = vG.w > 1.5 ? cViolet : cRose;
        vec3 col = (tint * (g * 0.8 + ring * 0.6) + vec3(1.0, 0.9, 0.93) * g2 * 0.7) * vG.x * edge;
        if (vG.y < 0.5) col *= 0.75 + 0.25 * smoothstep(-0.84, -0.6, vUV.y);
        //FOG
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`,
  });
  const glows = new THREE.Mesh(glowGeo, glowMat); glows.frustumCulled = false; glows.renderOrder = 3; group.add(glows);

  // ------------------------------------------------------------ progress hooks
  const flareHv = new THREE.Vector3().copy(uH[FLARE]);          // unit-height lean direction of the flare loop
  const climbFrom = new THREE.Vector3(0, 209, 480), climbTo = new THREE.Vector3(0, 1040, 0);
  const climbDir = new THREE.Vector3().subVectors(climbTo, climbFrom).normalize();
  const tmp = new THREE.Vector3(), zAxis = new THREE.Vector3(0, 0, 1);
  // the camera's frame on the climb (right = +X, up = climbUp) and the blob's long axis: 42 degrees off the line of
  // sight, heading up and to the right toward the eye, tail streaming back down and left past the lens
  const climbUp = new THREE.Vector3(0, -climbDir.z, climbDir.y);
  const blobAxis = new THREE.Vector3().copy(climbDir).multiplyScalar(Math.cos(0.733)).addScaledVector(climbUp, Math.sin(0.733) * 0.8).add(new THREE.Vector3(Math.sin(0.733) * 0.6, 0, 0)).normalize();
  function setFlare(kernel, loop) {
    uKernel.value = Math.max(0, Math.min(1, kernel));
    const l = Math.max(0, Math.min(1, loop)), e = 1 - (1 - l) * (1 - l);
    uH[FLARE].copy(flareHv).multiplyScalar(Math.max(4, flareH * e));
    uRG[FLARE].z = Math.min(1, l * 6) * (1.5 - 0.6 * l);
    uRG[FLARE].w = PI * Math.sqrt((uU[FLARE].lengthSq() + uH[FLARE].lengthSq()) / 2);
  }
  function setBlob(pos, fade = 1) {
    blob.visible = blobHalo.visible = !!pos && fade > 0.01;
    if (!blob.visible) return;
    blob.position.copy(pos); blob.quaternion.setFromUnitVectors(zAxis, blobAxis);
    uBP.value.copy(pos); uBA.value.copy(blobAxis);
    blobMat.uniforms.uFade.value = fade;
  }
  const sstep = ctx.core?.smoothstep ?? ((a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); });
  function setProgress(u) {
    setFlare(sstep(0.606, 0.615, u) * (1 - sstep(0.615, 0.66, u)), sstep(0.61, 0.675, u));
    const fade = sstep(0.725, 0.755, u) * (1 - sstep(0.895, 0.93, u));
    if (fade > 0.01) {
      // 90 m ahead of the camera on the climb, below and left of its line (drifting in from 31 m to 19 m off it,
      // toward the eye) so that it never covers the portal
      const k = Math.max(0, Math.min(1, (u - 0.74) / 0.19)), off = 1 - 0.38 * k;
      tmp.copy(climbFrom).addScaledVector(climbDir, Math.max(0, (u - 0.74) / 0.26) * 960 + 90);
      tmp.x -= 25 * off; tmp.addScaledVector(climbUp, -18 * off);
      setBlob(tmp, fade);
    } else setBlob(null);
  }
  setFlare(0, 0);

  // ------------------------------------------------------------ anchors
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const footOf = (i) => V(loops[i].A[0], loops[i].ga, loops[i].A[2]);
  const anchors = {
    worldOffset: V(0, 0, -3040),
    entry: V(0, 400, 3040),
    crown: V(0, 1040, 0),
    eye: { center: V(0, 1040, 0), halfWidth: 19, halfLength: 45 },
    portalSeat: { position: V(0, 1040, 0), normal: climbDir.clone().negate(), radius: 10, clearWidth: 38 },
    climbLine: { from: climbFrom.clone(), to: climbTo.clone(), dir: climbDir.clone() },
    flyThrough: [V(-120, 85, 1140), V(-30, 86, 1010), V(60, 88, 900), V(88, 90, 800), V(78, 96, 720), V(63, 104, 650), V(30, 135, 575), V(6, 180, 510), V(0, 209, 480), V(0, 1040, 0)],
    legPass: { L1: footOf(0), L4: footOf(1), L7: footOf(2), camera: V(88, 90, 800), look: V(40, 150, 560) },
    spotCentre: V(-120, 0, 1140), spot2Centre: V(150, 0, -660),
    feet, splashes,
    kernel: kern.clone(), flareLoop: { from: kern.clone(), to: flareFar.clone(), height: flareH },
    loops: loops.map((L, i) => ({ name: L.name, near: V(...L.A), far: V(...L.B), crown: loopPoint(i, 0.5), braided: L.braided, radius: L.rc })),
    ribs: ribs.map((L) => ({ name: L.name, near: V(...L.A), far: V(...L.B), crown: loopPoint(L.slot, 0.5), radius: L.rc })),
  };

  // ------------------------------------------------------------ per frame
  const size = new THREE.Vector2();
  function update(dt, time, camera) {
    shared.uTime.value = time;
    if (camera) {
      let hpx = 720;
      if (ctx.renderer?.getDrawingBufferSize) hpx = Math.max(1, ctx.renderer.getDrawingBufferSize(size).y);
      shared.uPx.value = 2 / (Math.max(0.1, camera.projectionMatrix.elements[5]) * hpx);
    }
  }

  return {
    object: group, radius: 700, height: 1070, center: V(0, 480, 0), anchors,
    update, setProgress, setFlare, setBlob, loopPoint,
    splashes, feet, uniforms: shared,
    dispose() { ico.dispose(); },
    ground: true, groundY: 0,
  };
}
