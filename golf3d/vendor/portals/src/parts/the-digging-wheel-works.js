// THE WORKS of the digging wheel: the wheel itself (sixteen toothed buckets on a ring, a dished plate face, its drive in the
// hub), the shaft, the chute, the boom behind it with its belt and its walkway, the driver's cab; and THE EARTH IN EVERY
// STATE: seated in the rising buckets, breaking from the cut and falling to a fan of talus at the wheel's foot, sliding down
// the chute, riding the boom's belt, the bridge's and the spout's, falling from the spout's lip, lying in the heap.
// A machine of its kind at a true size, after no one machine: nothing lettered, no maker's plate, no company's colours; the
// cab's glass dark, nobody in it. No dust: the digging is shown by bodies alone.
//
// WHAT MOVES, all of it a pure function of the world's clock uT, worked in the vertex shader (WORKS_MOTION) from each corner's
// mark and aux; nothing is integrated, nothing reads the lens or a seed; every count is dealt by a fixed generator:
//   kind 1  the wheel, its buckets and teeth (the core turns them)        kind 2  a bucket's load
//   kind 3  a lump falling at the wheel's foot                            kind 4  a lump riding a belt
//   kind 5  a lump on the chute                                           kind 6  a lump falling from the spout
//   kind 7  earth that stands (the heap, the fan, the belts' beds, lumps that lie)
//   kind 8  a corner of the boom's belt's heaped bed (the heap's swell rides by)  kind 9  the skin of the stream of fines from the spout
//   kind 10 a crumb spilt from a rising bucket's lip, falling through the air beside the wheel
//
// WHAT THE OTHER FILES USE: buildWorks(ctx, uniforms) -> { steel, earth, triangles, steelTriangles, earthTriangles }
//   (async; it adds three shadow boxes: the cab and two in the heap);  WORKS_BODIES (where a body of this file can be at any
//   clock);  RING, BUCKET, BW (the bucket's figures), CAB (the cab's middle), CHUTE, FAN, BELTS, fanTop(x, z), heapTop(x, z)
import { Geo, C, WHEEL, ZC, N_BUCKETS, STEEL, BRIGHT, GREY, HOLLOW, GLASS, fixedRng, BOOM, boomTop, boomBot, beltY, BRIDGE, bridgeY, SPOUT, HEAP, addShadowBox } from './the-digging-wheel.js';
import { landY, fitted } from './the-digging-wheel-land.js';
import { GLSL_STEEL } from './the-digging-wheel-machine.js';

export const RING = 8.1;                                     // the ring's outer radius: the buckets are bolted to it
// a bucket's outline in its own plane: t along its travel, p outward from the ring
// (a hooked scoop: its back bolted to the ring, its outer shell curving forward to the cutting lip, its mouth leaning forward under the lip)
export const BUCKET = [[-1.3, 0], [-1.5, 0.7], [-1.15, 1.35], [-0.3, 1.8], [0.7, 1.95], [1.05, 1.85], [0.75, 0]], MOUTH = 5, BW = 1.55;
export const CAB = { x: 67.2, y: 30.2, z: -0.1 };
const TURNS = [1, 0, 0, 0], STANDS = [0, 0, 0, 0];
// a bucket's side plate: the outline to the lip, then the side's front edge CUT BACK behind the mouth's plane (so that the
// seated load's crown shows over it side-on), down to the foot; and the point its fan is drawn from
// (the shell's outline is BUCKET's with its corners cut once, for a rounder scoop: twelve points from the ring's back to the lip)
const SHELL = (() => { const P = BUCKET.slice(0, MOUTH + 1), o = [P[0]]; for (let i = 0; i < P.length - 1; i++) for (const k of [0.25, 0.75]) o.push([P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]); o.push(P[P.length - 1]); return o; })(), LIP_I = SHELL.length - 1;
const SIDE = [...SHELL, [0.3, 1.46], [-0.28, 0.92], [0.0, 0.34], BUCKET[MOUTH + 1]], SIDE_MID = [-0.45, 0.9];
const LOAD_LUMPS = 16, LOAD_MORE = 4;                         // lumps in one bucket's load; and round three's clods more
// A FACE'S CLASS rides in its colour's blue (blue + 4 times the class; the surface code takes it off again): what kind of
// drawing the face gets. (The core's lump() scales a colour by its tone, so lumps are class 0.)
const cls = (col, k) => [col[0], col[1], col[2] + 4 * k];
const K_FACE = 1, K_SHELL = 2, K_LINER = 3, K_LIP = 4, K_BELT = 5, K_GLASS = 6, K_BOOM = 7;       // steel (0: plain plate): the wheel's face; the ring, hub and buckets' shells; the buckets' insides; lips and teeth; the belt's back; glass; the boom's own plate
const K_BED = 1, K_HEAP = 2, K_RIDE = 3, K_POUR = 4;                                   // earth (0: a lump): a bed of fines, the heap's skin, a belt's bed, the stream of fines from the spout
const STILL = [7, 0, 0, 0], SKIN = [0, 0, 0, 1];              // the mark of earth that stands; the aux of a skin (no lump's middle)
// the earth's tones (the land's own): damp and dark where fresh, paler where it has dried
const DAMP = [0.33, 0.245, 0.155], DRY = [0.56, 0.45, 0.29], LOAM = [0.47, 0.355, 0.215], SAND = [0.62, 0.51, 0.33], SOIL = [0.20, 0.14, 0.09];
// a fresh lump's tone: damp and dark or the loam's, a few of pale sand, some of the dark topsoil (fresh earth is darker than the dried face it falls past)
const freshTone = (rng) => { const q = rng(), c = q < 0.42 ? DAMP : q < 0.74 ? LOAM : q < 0.84 ? SAND : SOIL, t = rng.range(0.9, 1.1); return [c[0] * t, c[1] * t, c[2] * t]; };
// a lump's tone in a bucket's load, straight from the cut: mostly damp and dark or the dark topsoil, some of the loam's, a few of pale sand
const loadTone = (rng) => { const q = rng(), c = q < 0.46 ? DAMP : q < 0.78 ? SOIL : q < 0.92 ? LOAM : SAND, t = rng.range(0.9, 1.1) * (c === SOIL ? 1.15 : c === DAMP ? 0.76 : 0.9); return [c[0] * t, c[1] * t, c[2] * t]; };
// a lump that lies: its mark says it stands, its aux its own middle
const lie = (E, c, r, rng, col) => E.lump(c, r, rng, col, STILL, [c[0], c[1], c[2], 0]);
// THE CHUTE's floor: its lip under the tipping buckets' ports (a line from (x0, y0) to (x1, y1) at z = zLip, 0.35 m north of
// the buckets), and where it meets the boom's belt's side (z = zFoot)
export const CHUTE = { x0: 72.4, y0: 36.2, x1: 79.0, y1: 39.0, zLip: -1.95, zFoot: -3.6 };
const BELT_SPEED = 4, G_ = 9.81;                              // metres a second the belts run; gravity
const BED0_W = 1.4, BED_SWELL = 0.45, BED_WAVE = 1.6;         // the boom's belt's heaped bed: its half width; how much its crown swells and sinks along the belt (metres: 0.65 of it up, 0.35 down); the length of one swell (metres)
// what that speed along each belt's slope is in x (the boom's, the bridge's, the spout's): the drawings that run with a belt run so
const BELT_VX = [[BOOM.x1 - BOOM.x0, BOOM.rise], [BRIDGE.to[0] - BRIDGE.from[0], BRIDGE.to[1] - BRIDGE.from[1]], [SPOUT.to[0] - SPOUT.from[0], SPOUT.to[1] - SPOUT.from[1]]].map(([dx, dy]) => BELT_SPEED * Math.abs(dx) / Math.hypot(dx, dy));
const f1 = (v) => Number(v).toFixed(4);                       // a figure typed into GLSL
const POUR_Y = (() => { const dx = SPOUT.to[0] - SPOUT.from[0], dy = SPOUT.to[1] - SPOUT.from[1], l = Math.hypot(dx, dy); return SPOUT.to[1] + dy / l * 0.35 + Math.abs(dx) / l * (SPOUT.h / 2 + 0.4); })();   // the height at which the stream of fines leaves the spout's lip (its middle: SP_TOP(SPOUT_LEN + 0.35, 0.4), which buildBelts builds it from)
const FACE_OXIDE = [0.19, 0.108, 0.086];                     // the wheel's face: a dull oxide red-brown (the core's OXIDE read as orange)
const damp = (k = 1) => [DAMP[0] * k, DAMP[1] * k, DAMP[2] * k], dry = (k = 1) => [DRY[0] * k, DRY[1] * k, DRY[2] * k];

// THE DRAWING OF THE WORKS' STEEL: the machine file's law of steel (steelSurface) for plain plate (the boom, the chute, the
// cab), and round it the wheel's own by each face's class: the oxide face's sectors, seams, rivets and the earth's stain
// toward the rim; the ring and the buckets' worn shells; the buckets' polished insides; bare lips and teeth; the belt's
// running cleats. Every pattern is placed from p0 (it goes round with the wheel) and filtered by the pixel's footprint.
const STEEL_SURFACE = GLSL_STEEL + /* glsl */`
  // how much of a pixel of footprint f a line of width w covers, its middle d from the pixel's (a line thinner than the
  // footprint fades to its mean); and from x to the nearest multiple of s
  float wkLine(float d, float w, float f){ return clamp((0.5 * (w + f) - abs(d)) / f, 0., min(1., w / f)); }
  float wkOff(float x, float s){ return x - s * floor(x / s + 0.5); }
  // a bolt's head, R its radius, d from its middle: dark round its foot, lit on its crown; a field of them P apart fades to
  // its mean as the footprint outgrows their spacing
  float wkBolt(vec2 d, float R, float P, float foot){
    float a = 1. - smoothstep(R - 0.5 * foot, R + 0.5 * foot, length(d));
    return mix(mix(1., clamp(0.80 + 0.36 * d.y / R, 0.58, 1.22), a), 1. - 0.6 * R * R / (P * P), smoothstep(0.3 * P, 0.6 * P, foot)); }
  // THE BOOM'S PLATE (class 7), drawn in the boom's own frame: s metres along it from its root, hb metres over its bottom
  // line (its top line is 6 m over that; a chord stands 0.55 m about each line), out metres proud of its web. A plate
  // girder's drawing: the web in plates 3 m by 3 m (their upright joints under the stiffeners below the long seam, between
  // them above it), each bay its own tone; bolted cover plates over the joints; a double bolt row along each chord; rust
  // running down from the ledges (the flanges' lips, under the top chord, under the walkway); the belt's idlers' grease
  // in dark runs down the top chord; dust on what is level and grime under it by the machine's own law. And on the sunlit
  // flank THE SHADOWS OF ITS OWN PARTS, each worked from the sun's direction and the part's figures as built (a
  // stiffener's or a post's on the web beside it; the top chord's and the walkway's on the web under them; the flange's
  // lip on the chord's face): they are ADDED TO THE SUN'S CUT at the fragment's own place (the core's gCut, which its
  // lit() and the steel's stLight then read), so that they are shadows and not paint. The boom stands: it takes the
  // steel's light everywhere.
  vec3 wkBoom(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot){
    const float SL = ${f1(BOOM.rise / (BOOM.x1 - BOOM.x0))};
    float s = p0.x - ${f1(BOOM.x0)}, hb = p0.y - ${f1(BOOM.bot0)} - s * SL;
    bool south = p0.z > ${f1(ZC)}; float outw = south ? p0.z - (${f1(BOOM.zS)}) : (${f1(BOOM.zN)}) - p0.z;
    vec3 col = base * (1. + (fbm(p0 * 0.9) - 0.5) * 0.24 * (1. - smoothstep(0.6, 2., foot)));
    float own = 0.;
    if (abs(n.z) > 0.7) {                                                    // A FLANK'S FACE: the web, a chord's face, a cover plate, a stiffener's edge
      bool chord = hb < 0.57 || hb > 5.43, cover = abs(outw - 0.06) < 0.025 || abs(outw - 0.61) < 0.025;
      float sj = wkOff(s - 4.5, 9.), line = hb < 3. ? 0. : 6.;               // from the nearest joint; the chord's own line
      if (outw > 1.5) {                                                      // the walkway's parapet (and the deck's edge under it): plate panels 1.5 m long between upright ribs, a rail along its head, a kick strip at its foot
        float hp = hb - 2.25, dj = abs(wkOff(s, 1.5));
        col *= 1. + (stHash(vec2(floor(s / 1.5 + 0.5), 3.)) - 0.5) * 0.16 * (1. - smoothstep(0.5, 1.5, foot));
        col *= (1. + 0.16 * wkLine(dj, 0.12, foot)) * (1. - 0.45 * wkLine(dj - 0.085, 0.04, foot));
        col *= (1. + 0.18 * wkLine(hp - 1.04, 0.12, foot)) * (1. - 0.4 * wkLine(hp - 0.96, 0.04, foot)) * (1. - 0.22 * wkLine(hp - 0.09, 0.18, foot));
      } else if (cover) {
        float e = chord ? min(0.9 - abs(sj), 0.45 - abs(hb - line)) : min(0.6 - abs(sj), min(hb - 0.7, 5.3 - hb));
        vec2 d = chord ? vec2(wkOff(sj, 0.3), abs(hb - line) - 0.22) : vec2(abs(abs(sj) - 0.32) - 0.13, wkOff(hb, 0.3));
        col *= 1.13 * wkBolt(d, 0.055, 0.3, foot) * (1. - 0.3 * wkLine(e, 0.06, foot));
      } else if (chord) {
        col = stPlating(col, vec2(s - 4.5, hb + 40.), vec2(9., 80.), foot);
        col *= wkBolt(vec2(wkOff(s, 0.5), abs(hb - line) - 0.3), 0.05, 0.5, foot);
      } else {
        if (abs(outw - 0.45) < 0.025) col *= 1.06;                             // a stiffener's own face, 0.7 m broad: one plate, a little paler than the web it stands on (no bay's tone, no joint down its middle)
        else { col *= 1. + (stHash(vec2(floor(s / 3.), 7.)) - 0.5) * 0.16 * (1. - smoothstep(1., 3., foot));
          col = stPlating(col, vec2(s, hb - 0.4), vec2(3., 3.), foot); }
        // rust run down the web from under the top chord (each run its own length; their mean where a run is finer than the footprint), dust thrown up off the bottom chord's ledge
        float run = smoothstep(0.42, 0.78, stNoise(vec2(s * 2.3, 5.))) * exp(-(5.45 - hb) / (0.7 + 2.6 * stNoise(vec2(s * 0.6 + 9., 2.)))) * (0.6 + 0.4 * stNoise(vec2(s * 8., hb * 0.5)));
        col = mix(col, ST_RUST * 1.15, 0.6 * mix(run, 0.1, smoothstep(0.25, 0.7, foot)));
        col = mix(col, ST_DUST, (1. - smoothstep(0.55, 1.7, hb)) * (0.2 + 0.3 * stNoise(vec2(s * 1.1, 3.))));
      }
      col = stWeather(col, p0, vec2(s, outw > 1.5 ? hb - 0.35 : chord ? hb - 0.55 : hb - 2.45), n, foot, 3.);
      if (chord && hb > 3. && !cover) {                                      // the idlers' grease, in runs down the top chord's face from under every third idler set or so
        float cell = floor(s / 3.), gr = wkLine(wkOff(s - 1.5, 3.) - 0.6 * (stHash(vec2(cell, 3.)) - 0.5), 0.26, foot) * (1. - smoothstep(0.2, 1.3, 6.55 - hb)) * smoothstep(0.35, 0.6, stHash(vec2(cell, 11.)));
        col = steelOil(col, gr * (0.5 + 0.5 * vnoise(vec3(p0.x * 4., p0.y * 0.7, 2.)))); }
      if (south && n.z > 0.7 && uSun.z > 0.05) {
        float kx = -uSun.x / uSun.z, K = uSun.y / uSun.z + SL * kx, f = 0.5 * foot;   // a shadow falls kx metres along the boom and K metres down it for every metre its caster stands proud
        if (outw < 0.03 && !chord) {
          bool post = abs(wkOff(s, 9.)) < 1.5; float hs = post ? 0.375 : 0.35, w = abs(kx) * (post ? 0.375 : 0.45);   // (hs: half the caster's breadth along the boom; w: its shadow's)
          own = wkLine(wkOff(s, 3.) * sign(kx) - hs - 0.5 * w, w, foot) * step(s, 73.);
          own = max(own, smoothstep(-f, f, hb - (5.45 - K * 0.55)));
          own = max(own, smoothstep(-f, f, hb - (2.25 - K * 1.8)) * (1. - smoothstep(-f, f, hb - (3.35 - K * 1.75))) * step(4.5, s) * step(s, 56.5));
        } else if (abs(outw - 0.55) < 0.03 && hb > 5.4) own = smoothstep(-f, f, hb - (6.55 - K * 0.3));
      }
    } else {                                                                 // a top, an underside, a stiffener's or a rib's side
      vec2 q = abs(n.y) > 0.7 ? vec2(s - 0.4, p0.z + 8.) : vec2(p0.z, hb);   // (the underside's joints lie under its ribs' middles)
      if (n.y < -0.7 && abs(hb + 0.5) > 0.02) col = stPlating(col, q, vec2(3., 6.), foot);   // (a rib's own under face, 0.5 m under the bottom line, is one plate 0.7 m broad: no joint is drawn down its middle)
      col = stWeather(col, p0, q, n, foot, 3.);
    }
    if (own > 0.) { float c0 = shadeOnce(wp); gCut = 1. - (1. - c0) * (1. - 0.94 * own); }
    return stLight(col, n, wp, 1.);
  }
  vec3 surface(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot){
    float k = floor(base.b * 0.25 + 0.02); base.b -= 4. * k;                 // the face's class (see cls)
    if (k < 0.5) return steelSurface(base, p0, wp, n, foot);                 // plain plate: the machine's own law
    if (k > 6.5) return wkBoom(base, p0, wp, n, foot);                       // the boom's plate
    if (k > 5.5) return base;                                                // glass
    if (k > 4.5) {                                                           // THE BELT'S BACK: dark rubber, its cleats running with the clock (4 m a second along the boom, toward the body)
      float cleat = wkLine(wkOff(p0.x + ${f1(BELT_VX[0])} * uT, 1.6), 0.16, foot) * step(0.5, abs(n.y));
      return base * (0.85 + 0.3 * vnoise(p0 * 3.)) * (1. + 1.6 * cleat); }
    vec2 d = p0.xy - uWheel.xy; float r = length(d), a = r > 1e-4 ? atan(d.y, d.x) : 0.;     // (the wheel's drawings are placed from p0: they go round with it; no angle is asked on the axis itself)
    vec3 mud = vec3(0.40, 0.31, 0.20) * (0.8 + 0.4 * vnoise(p0 * 2.1));
    float grain = fbm(p0 * 1.3), speck = vnoise(p0 * 7.);
    vec3 wet = vec3(0.21, 0.15, 0.095) * (0.8 + 0.4 * speck);                // fresh damp earth, as it smears on steel
    if (k < 1.5) {                                                           // THE FACE: dull oxide plate in sixteen sectors (an inner and an outer round, breaking joint), seams and rivet rows; the earth's stain toward the rim
      float outer = step(4.7, r), w = 0.3926991, aa = a + outer * 0.5 * w, sec = floor(aa / w + 0.5), plate = floor(aa / w);
      float ds = (aa - sec * w) * r, dr = r - 4.7;                                                       // (sec: the number of the nearest seam; plate: of the plate between two seams)
      float tone = fract(sin((plate > 7.5 ? plate - 16. : plate) * 12.9898 + outer * 78.233) * 43758.5453);   // (one tone a plate: where the angle wraps, the outer round's half plate 8 takes its other half's number, -8; the inner round's wrap falls on a seam)
      vec3 col = base * (0.86 + 0.26 * tone * (1. - smoothstep(0.4, 1.2, foot))) * (0.88 + 0.24 * grain);
      col = mix(col, vec3(0.115, 0.075, 0.06), 0.55 * smoothstep(0.52, 0.8, fbm(p0 * 0.6 + 11.)));              // darker, older patches
      float strap = max(wkLine(ds, 0.34, foot), wkLine(dr, 0.34, foot)), joint = max(wkLine(ds, 0.05, foot), wkLine(dr, 0.05, foot));
      col *= (1. + 0.10 * strap) * (1. - 0.6 * joint);
      float rv = 1. - smoothstep(0.035, 0.08, foot);
      if (rv > 0.) { vec2 q1 = vec2(abs(ds) - 0.11, wkOff(r, 0.3)), q2 = vec2(abs(dr) - 0.11, wkOff(a * 4.7, 0.3013364));   // (98 round the joint: the row closes on itself where the angle wraps)
        float l = min(length(q1), length(q2)); col *= 1. - 0.45 * rv * (1. - smoothstep(0.03, 0.03 + foot, l)); }
      float run = smoothstep(0.45, 0.75, vnoise(vec3(d / max(r, 1e-4) * 9., r * 0.35 + 3.)));                      // the earth's stain: thick at the rim, running in toward the hub (placed by the direction from the hub: whole round the wheel, no break where the angle wraps)
      col = mix(col, mud, clamp(smoothstep(4.8, 7.3, r) * 0.55 * run + 0.4 * smoothstep(6.5, 7.4, r), 0., 0.7));
      return col * (1. - 0.35 * (1. - smoothstep(2.2, 2.6, r)));   // (darker round the hub's drum)
    }
    if (k < 2.5) {                                                           // THE RING AND THE BUCKETS' SHELLS: worn dark steel, scuffed pale, caked with earth
      float wa = 6.2831853 * mod(uT, 20.0) / 20.0, cw = cos(wa), sw = sin(wa);
      vec3 n0 = vec3(cw * n.x + sw * n.y, -sw * n.x + cw * n.y, n.z);        // the normal AS BUILT (turned back by the wheel's angle): the machine's law of steel then sticks to the turning plate
      vec3 col = base * (0.85 + 0.3 * grain);
      if (r > 7.1) col = steelSurface(col, p0, wp, n0, foot);                 // (the ring and the buckets; the hub, the ribs, which end at 7.02 m, and the inner strap keep to their own round)
      col = mix(col, vec3(0.27, 0.265, 0.25), 0.3 * smoothstep(0.5, 0.75, fbm(p0 * 4.1 + 2.)) * (1. - smoothstep(0.1, 0.3, foot)));   // scuffed pale
      col = mix(col, mud * 0.75, 0.38 * smoothstep(0.4, 0.75, fbm(p0 * 0.9 + 5.)));   // caked with earth
      col = mix(col, wet, 0.62 * smoothstep(8.8, 9.8, r) * smoothstep(0.3, 0.6, fbm(p0 * 1.4 + 9.)));   // and, out toward the buckets' lips, the fresh dark earth of this turn's cut smeared over it
      // The hub, the ribs and the inner strap stand on the sunlit plate: a side of theirs turned from the sun takes the plate's
      // light back (three times the sky's fill), and less of it as the sun itself comes onto the side (none from 0.35): so
      // that no side goes black, and none is darkest just as it turns to the sun.
      if (r <= 7.1) col *= 1. + 2.0 * (1. - smoothstep(-0.12, 0.35, dot(n, uSun)));
      return col;
    }
    if (k < 3.5) {                                                           // THE BUCKETS' INSIDES: polished by the earth, earth clinging in streaks
      vec3 col = base * (0.8 + 0.5 * speck);
      float worn = smoothstep(0.55, 0.8, vnoise(vec3(d / max(r, 1e-4) * 60., r * 1.2 + p0.z * 5.))) * (1. - smoothstep(0.05, 0.15, foot));   // bright scores along its travel
      col = mix(col, vec3(0.34, 0.335, 0.32), 0.6 * worn);
      return mix(col, wet, 0.55 * smoothstep(0.36, 0.64, fbm(p0 * 1.1 + 4.)));   // fresh earth clinging in patches
    }
    vec3 col = base * (0.82 + 0.3 * speck) * (0.9 + 0.2 * grain);            // THE LIPS AND THE TEETH: bare bright metal,
    if (r > 7.5) col = mix(col, wet, 0.82 * smoothstep(0.38, 0.58, fbm(p0 * 1.9 + 3.)));   // the fresh dark earth of the cut smeared over half of it (not on the hub's bright cap and bolts)
    return col;
  }
`;
const EARTH_SURFACE = /* glsl */`
  varying vec3 vLump;                                                        // from a lump's middle to this place on it, as built (the motion law hands it over); (0, 1, 0) on a skin
  // fines: a closed bed of earth, grained at two sizes and strewn with small stones (each fades to its mean as the footprint outgrows it)
  vec3 fines(vec3 base, vec3 q, float foot){
    float g1 = vnoise(q * 9.), g2 = vnoise(q * 2.3 + 7.), st = smoothstep(0.62, 0.8, vnoise(q * 4.7 + 13.));
    float f1 = 1. - smoothstep(0.03, 0.07, foot), f2 = 1. - smoothstep(0.11, 0.25, foot), f3 = 1. - smoothstep(0.05, 0.12, foot);
    vec3 col = base * (1. + 0.30 * (g1 - 0.5) * f1 + 0.34 * (g2 - 0.5) * f2);
    return mix(col, base * 0.55, 0.7 * st * f3);
  }
  vec3 surface(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot){
    float k = floor(base.b * 0.25 + 0.02); base.b -= 4. * k;                 // the face's class (see cls)
    if (k < 0.5) {                                                           // A LUMP: grained, darker under its belly (where it sits in the bed)
      float lat = vLump.y / (length(vLump) + 0.03);
      return base * (0.86 + 0.28 * fbm(p0 * 3.1)) * mix(0.48, 1., smoothstep(-0.8, 0.2, lat)); }
    if (k < 1.5) return fines(base, p0, foot);                               // A BED OF FINES in a bucket, on the fan
    if (k < 2.5) {                                                           // THE HEAP'S SKIN: fines, and fall lines running down it from its top
      vec2 d = p0.xz - vec2(${f1(HEAP.x)}, ${f1(HEAP.z)}); float r = length(d), a = r > 1e-4 ? atan(d.y, d.x) : 0.;   // (no angle is asked at the heap's one top point)
      float rill = vnoise(vec3(a * 14., r * 0.22, 1.)) * (1. - smoothstep(0.3, 0.8, foot / max(r, 1.) * 14.));
      return fines(base, p0, foot) * (0.84 + 0.32 * rill); }
    if (k > 3.5) {                                                           // THE STREAM FROM THE SPOUT: fines whose grain, and darker and paler lengths, fall with the earth (placed by the seconds a grain has fallen when it passes here, less the clock)
      float tf = sqrt(max(${f1(POUR_Y)} - p0.y, 0.) / ${f1(G_ / 2)}) - uT;
      return fines(base, vec3(p0.x * 0.6, tf * 5., p0.z), foot) * (0.78 + 0.44 * vnoise(vec3(tf * 2.6, p0.z * 1.2, 4.))); }
    // A BELT'S BED: its drawing runs with the belt, at the belt's 4 m a second ALONG ITS SLOPE (in x: the boom's, the bridge's, the spout's)
    float vx = p0.x > 0. ? ${f1(BELT_VX[0])} : p0.x > ${f1((BRIDGE.to[0] + SPOUT.from[0]) / 2)} ? ${f1(BELT_VX[1])} : ${f1(BELT_VX[2])};
    return fines(base, vec3(p0.x + vx * uT, p0.y * 0.3, p0.z), foot);
  }
`;

// THE FAN OF TALUS at the socket's foot, south of the wheel: a cone about an apex that leans on the face, banked down to the
// face on the wheel's side so that nothing of it stands in the buckets' way (z0: where it begins, 0.3 m south of the buckets)
export const FAN = { ax: 86.6, ay: 26.6, az: 4.8, k: 0.60, kz: 0.85, z0: 1.9 };
// THE BELTS' LINES in the plane z = ZC (x, y): each from its head s (where the earth comes onto it) along the unit d for L metres
const beltLine = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return { s: a, e: b, d: [(b[0] - a[0]) / L, (b[1] - a[1]) / L], L }; };
const SP_A = (() => { const dx = SPOUT.to[0] - SPOUT.from[0], dy = SPOUT.to[1] - SPOUT.from[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; })();   // along the spout, toward its lip
const SP_N = SP_A[0] < 0 ? [SP_A[1], -SP_A[0]] : [-SP_A[1], SP_A[0]];                                    // square to it, upward
const SP_TOP = (k, up = 0) => [SPOUT.from[0] + SP_A[0] * k + SP_N[0] * (SPOUT.h / 2 + up), SPOUT.from[1] + SP_A[1] * k + SP_N[1] * (SPOUT.h / 2 + up)];   // a point on the spout's back, k metres from its foot (up: metres over the back)
const SPOUT_LEN = Math.hypot(SPOUT.to[0] - SPOUT.from[0], SPOUT.to[1] - SPOUT.from[1]);
export const BELTS = [
  beltLine([BOOM.x1 - 1.4, beltY(BOOM.x1 - 1.4)], [BOOM.x0 + 2.4, beltY(BOOM.x0 + 2.4)]),                 // the boom's: from under the chute down to the body
  beltLine([BRIDGE.from[0] - 0.6, bridgeY(BRIDGE.from[0] - 0.6)], [BRIDGE.to[0] - 0.6, bridgeY(BRIDGE.to[0] - 0.6)]),   // the bridge's: aft to the loader
  beltLine(SP_TOP(1.4), SP_TOP(SPOUT_LEN)),                                                               // the spout's: up and out over the heap
];
const SPOUT_V = [SP_A[0] * BELT_SPEED * 0.42, 0];              // how the earth leaves the spout's lip: over the head drum and down, level, at 0.42 of the belt's speed (1.6 m a second; no rise): it falls steeply, onto the heap's east flank under the spout, about 2 m from the heap's top
export const heapTop = (x, z) => HEAP.H * Math.pow(Math.max(1 - Math.hypot(x - HEAP.x, z - HEAP.z) / HEAP.R, 0), 1.1);
const pipeY = (x) => { const d = Math.max(x - WHEEL.x, 0); return WHEEL.y - Math.sqrt(Math.max(WHEEL.R * WHEEL.R - d * d, 0)); };
export const fanTop = (x, z) => { const cone = FAN.ay - FAN.k * Math.hypot(x - FAN.ax, (z - FAN.az) * FAN.kz);
  return Math.max(pipeY(x), Math.min(cone, pipeY(x) + Math.max(z - FAN.z0, 0) * 1.5)); };
// THE FALL'S FIGURES (kind 3; the GLSL law has the same typed in). R: the radius about the hub at which a falling lump's
// middle keeps to the face (0.3 m off it), closing by `seat` to its rest; lift: its middle over the fan's top where it lies
// on the fan; K: how wide (metres of height) the round is in which it comes off the face onto the fan (it narrows to
// nothing at its rest: the lump goes at most K / 4 over the face's line and the fan's top where they meet); kc, eps: the
// rounds of the fan's own edge and apex as the lump meets them
export const FALL = { R: 9.7, seat: 0.15, lift: 0.15, K: 0.8, kc: 0.4, eps: 0.25 };   // (K 0.8: no lump's middle is ever more than 0.21 m over the face's line and the fan's top, 0.17 m at its birth: measured over all 760, round three's clods and crumbs with them, by shots/the-digging-wheel/world/fallstats.mjs)
// the greater (the lesser) of two heights, rounded where they are within k of each other: with both never rising, never rising
const wMax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
const wMin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
// the fan as a falling lump meets it: fanTop's cone and bank without the face under them, the cone held level east of its
// apex (so that it never rises under a lump going west), its edge and its apex rounded (0.1 m under the fan's edge at
// most, 0.15 m under its apex: no more than the lump's lift)
export const fanUnder = (x, z) => { const dx = Math.min(x - FAN.ax, 0), dz = (z - FAN.az) * FAN.kz, cone = FAN.ay - FAN.k * Math.sqrt(dx * dx + dz * dz + FALL.eps * FALL.eps);
  return wMin(cone, pipeY(x) + Math.max(z - FAN.z0, 0) * 1.5, FALL.kc); };
// where a falling lump's middle is when the share e (0 to 1) of its way is done; L: [the angle about the hub where it
// breaks away, the angle where it rests, its z there, its z at rest]. (The JS mirror of the GLSL fallAt.)
export const fallAt = (L, e) => { const th = L[0] + (L[1] - L[0]) * e, rho = FALL.R + FALL.seat * e, z = L[2] + (L[3] - L[2]) * e, x = WHEEL.x + rho * Math.cos(th);
  return [x, wMax(WHEEL.y + rho * Math.sin(Math.max(th, -Math.PI / 2)), fanUnder(x, z) + FALL.lift, FALL.K * (1 - e * e) + 0.05), z]; };
// the share of its way done at the share u of its time: it gains speed from rest for the first half of its time and loses
// it again in the second (half a cosine: its acceleration along its way has no step)
const fallEase = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);
// THE WORKS' MOTION LAWS (kinds 2 and up; the core's moved() turns kind 1 itself). mark.yzw and aux are the kind's own
// numbers; turned(p), turnedBy(p, a) and wheelTurn() are the core's. Every corner of the EARTH's mesh is kind 2 or more
// (what stands is kind 7), so that the law hands vLump to the earth's drawing for every corner.
const WORKS_MOTION = /* glsl */`
  float wHash(float x){ return fract(sin(x * 91.3458 + 1.7) * 47453.5453); }
  // the socket's face in the wheel's plane (a quarter pipe of the wheel's radius about the hub, the 22 m berm at its foot):
  // the same figures as the JS pipeY()
  float pipeY(float x){ float d = max(x - uWheel.x, 0.); return uWheel.y - sqrt(max(uWheel.z * uWheel.z - d * d, 0.)); }
  // the heap's top over (x, z): the same figures as the JS heapTop()
  float heapTop(vec2 xz){ float q = length(xz - vec2(${f1(HEAP.x)}, ${f1(HEAP.z)})) / ${f1(HEAP.R)}; return ${f1(HEAP.H)} * pow(max(1. - q, 0.), 1.1); }
  // THE FALL'S LAW (kind 3), the same figures as the JS wMax, wMin, fanUnder and fallAt: the greater (the lesser) of two
  // heights, rounded where they are within k of each other; the fan as a falling lump meets it; and where the lump's middle
  // is when the share e of its way is done (aux: the angle about the hub where it breaks away, the angle where it rests,
  // its z there, its z at rest). Its height is the face's line (0.3 m off the face, closing to 0.15 at its rest) or the
  // fan's top, whichever is the higher, rounded where the two meet (a round that narrows to nothing at its rest). Every
  // lump is dealt a way along which neither ever rises (buildFoot proves each), so its height never does.
  float wMax(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return max(a, b) + h * h * k * 0.25; }
  float wMin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * 0.25; }
  float fanUnder(float x, float z){ vec2 d = vec2(min(x - ${f1(FAN.ax)}, 0.), (z - ${f1(FAN.az)}) * ${f1(FAN.kz)});
    float cone = ${f1(FAN.ay)} - ${f1(FAN.k)} * sqrt(dot(d, d) + ${f1(FALL.eps * FALL.eps)});
    return wMin(cone, pipeY(x) + max(z - ${f1(FAN.z0)}, 0.) * 1.5, ${f1(FALL.kc)}); }
  vec3 fallAt(vec4 aux, float e){ float th = mix(aux.x, aux.y, e), rho = ${f1(FALL.R)} + ${f1(FALL.seat)} * e, z = mix(aux.z, aux.w, e), x = uWheel.x + rho * cos(th);
    return vec3(x, wMax(uWheel.y + rho * sin(max(th, -1.5707963)), fanUnder(x, z) + ${f1(FALL.lift)}, ${f1(FALL.K)} * (1. - e * e) + 0.05), z); }
  varying vec3 vLump;                                         // for the earth's drawing: from a lump's middle to this corner, as built; (0, 1, 0) on a skin
  // a wave of chance along a line: at q, between the hashes of the whole numbers on either side of it; the same again
  // every 30 (so that a clock of any length asks the hash only small whole numbers)
  float wWave(float q){ q = mod(q, 30.); float i = floor(q), f = q - i; f = f * f * (3. - 2. * f); return mix(wHash(i), wHash(mod(i + 1., 30.)), f); }
  vec3 movedMore(vec3 p, vec4 mark, vec4 aux){
    vLump = aux.w > 0.5 ? vec3(0., 1., 0.) : p - aux.xyz;
    if (mark.x > 9.5) {
      // KIND 10: A CRUMB SPILT FROM A RISING BUCKET'S LIP, over and over. mark: [10, its period (s), its phase, the seconds
      // it falls]; aux.xyz: its middle where it leaves the lip (as built). It is let go at rest and FALLS STRAIGHT DOWN
      // under gravity alone (never flung, never rising), in the air just south of the buckets' sides, to the cut's face or
      // the fan below it (the height is asked at the build); there it goes into the earth and is born again.
      float P = mark.y, s = fract(uT / P + mark.z) * P, tf = min(s, mark.w);
      vec3 c = aux.xyz; c.y -= ${f1(G_ / 2)} * tf * tf;
      float a = 5. * tf + 6.2832 * mark.z, ca = cos(a), sa = sin(a); vec3 d = p - aux.xyz;
      return c + vec3(ca * d.x - sa * d.y, sa * d.x + ca * d.y, d.z) * smoothstep(0., 0.12, s) * (1. - smoothstep(mark.w - 0.02, mark.w + 0.2, s));
    }
    if (mark.x > 8.5) {
      // KIND 9: THE SKIN OF THE STREAM OF FINES that pours from the spout's lip onto the heap (a closed body of earth, no
      // dust). mark: [9, the seconds a grain has fallen from the lip when it passes this corner's ring, the ring's own
      // offset]; aux.xyz: the ring's middle (aux.w 1: a skin). The stream is uneven as the belt gave it, thick here and
      // thin there, and its unevenness FALLS with the earth: each ring swells and narrows about its own middle by a wave
      // of (the grain's seconds minus the clock). No corner goes along the stream: the stream's shape passes down through them.
      return aux.xyz + (p - aux.xyz) * (0.55 + 0.9 * wWave((mark.y - uT) * 2.6 + mark.z));
    }
    if (mark.x > 7.5) {
      // KIND 8: A CORNER OF THE BOOM'S BELT'S HEAPED BED. mark: [8, its metres along the belt's line from the belt's head,
      // how much it swells (metres: the crown's whole swell, less toward the bed's edges and the belt's two ends)]; aux: a
      // skin's. The heap is uneven as the buckets gave it, a bucketful after a bucketful, and its unevenness RIDES WITH THE
      // BELT at the belt's own speed: the corner's height is a wave of (its metres along the belt minus the belt's speed
      // times the clock). The corners stand; the heap's shape passes through them, and the lumps ride on it (kind 4).
      return p + vec3(0., mark.z * (wWave((mark.y - ${f1(BELT_SPEED)} * uT) / ${f1(BED_WAVE)}) - 0.35), 0.);
    }
    if (mark.x > 6.5) return p;                               // KIND 7: earth that stands (a skin, or a lump that lies: aux.xyz its middle)
    if (mark.x < 2.5) {
      // KIND 2: A BUCKET'S LOAD. mark: [2, the bucket's angle as built, the lump's place across the bucket (0 north, 1 south),
      // how far (metres, along the bucket's travel) the corner stands ahead of the bucket's back when the bucket is full];
      // aux.xyz: the lump's own middle (a bed's corner: its bucket's anchor), aux.w 1 for the bed of fines; for a lump
      // 0.45 times the share of the filling at which its place has room for the whole of it (roomFor).
      // The load is a function of where its bucket is NOW (fi: its angle from the wheel's lowest point, the way it goes):
      // nothing while it comes down empty and passes under; it grows from the bucket's back while the teeth are in the cut
      // (to 130 degrees: 40 above level on the face's side); it rides full; from 190 to 230 degrees (100 to 140: just past the
      // top) it slides toward -z, out over the cut-back front edge of the bucket's north side (a little of it through the
      // port by the ring; none through the side's plate), and is gone.
      float ph = mark.y, fi = mod(ph + wheelTurn() + 1.5707963, 6.2831853);
      float F = smoothstep(0., 1., clamp((fi - 0.17) / 2.10, 0., 1.));
      float kd = clamp((fi - 3.3161) / 0.6981, 0., 1.);
      if (fi > 4.02) F = 0.;
      vec2 er = vec2(cos(ph), sin(ph)), et = vec2(-er.y, er.x);
      // The bed grows out of its anchor at the bucket's back, its drawing back to the back plate growing with it (so that
      // no corner of it is ever behind the plate); a lump stands back by its own advance and grows about its own middle,
      // no faster than its place has room (no corner of it ever through the shell).
      float s = smoothstep(0., 0.4, F), bed = step(0.5, aux.w);
      if (bed < 0.5) s = min(s, F * 0.45 / max(aux.w, 0.0005));
      vec3 q = aux.xyz + (p - aux.xyz) * s; q.xy -= et * mark.w * (1. - F) * mix(1., s, bed);
      if (kd > 0.) {
        if (aux.w > 0.5) { float pp = dot(q.xy - uWheel.xy, er) - ${f1(RING)};      // the bed: drawn down to the port's sill
          q.z = mix(q.z, ${f1(-BW + 0.12)}, kd); q.xy -= er * (pp - 0.14) * kd; }
        else { float kl = clamp(kd * 1.7 - mark.z * 0.7, 0., 1.), sl = 1. - smoothstep(0.5, 1., kl);   // a lump: out over the north side, the north ones first
          float pc = dot(aux.xy - uWheel.xy, er) - ${f1(RING)};
          vec3 c = aux.xyz; c.xy -= et * mark.w * (1. - F);
          q = c + (q - c) * sl; q.z -= kl * (aux.z + ${f1(BW + 0.25)}); q.xy -= er * max(pc - 0.35, 0.) * kl * 0.8; }
      }
      return turned(q);
    }
    if (mark.x < 3.5) {
      // KIND 3: A LUMP THAT BREAKS FROM THE CUT beside the rising buckets and goes down the socket's face to the fan of talus,
      // over and over. mark: [3, its period (s), its phase (0 to 1), the seconds from breaking away to rest];
      // aux: [the angle about the hub where it breaks away, the angle where it rests, its z there, its z at rest].
      // It is built at its birth place, on the cut over the fan (never above the hub's height). NEVER FLUNG: from its birth
      // it only goes down. Its angle about the hub only falls, gaining speed for the first half of its time and losing
      // it in the second (half a cosine); it keeps to the face, comes off it onto the fan in one low round (fallAt), rolls
      // out to its rest, sinks into the fan and is born again. It has no hop and no bounce: its height never rises, its
      // speed is never upward, and its fall time is dealt (buildFoot) so that its middle's acceleration stays under g.
      float P = mark.y, s = fract(uT / P + mark.z) * P, u = clamp(s / mark.w, 0., 1.);
      float e = 0.5 - 0.5 * cos(3.14159265 * u), sink = smoothstep(P - 1.1, P - 0.1, s);
      vec3 c0 = fallAt(aux, 0.), c = fallAt(aux, e); c.y -= 0.35 * sink;
      float a = (5. + 7. * wHash(mark.z + 0.37)) * e, ca = cos(a), sa = sin(a); vec3 d = p - c0; vLump = d;   // (it tumbles the way it rolls)
      return c + vec3(ca * d.x - sa * d.y, sa * d.x + ca * d.y, d.z) * smoothstep(0., 0.3, s) * (1. - sink);
    }
    if (mark.x < 4.5) {
      // KIND 4: A LUMP RIDING A BELT at 4 m a second. mark: [4, which belt (0 the boom's, 1 the bridge's, 2 the spout's)];
      // aux.xyz: its own middle as built. Its place along the belt's line advances with the clock and wraps; it grows out of
      // the stream at the belt's head and goes down into it at the belt's foot.
      vec2 S = mark.y < 0.5 ? vec2(${f1(BELTS[0].s[0])}, ${f1(BELTS[0].s[1])}) : mark.y < 1.5 ? vec2(${f1(BELTS[1].s[0])}, ${f1(BELTS[1].s[1])}) : vec2(${f1(BELTS[2].s[0])}, ${f1(BELTS[2].s[1])});
      vec2 D = mark.y < 0.5 ? vec2(${f1(BELTS[0].d[0])}, ${f1(BELTS[0].d[1])}) : mark.y < 1.5 ? vec2(${f1(BELTS[1].d[0])}, ${f1(BELTS[1].d[1])}) : vec2(${f1(BELTS[2].d[0])}, ${f1(BELTS[2].d[1])});
      float L = mark.y < 0.5 ? ${f1(BELTS[0].L)} : mark.y < 1.5 ? ${f1(BELTS[1].L)} : ${f1(BELTS[2].L)};
      float s0 = dot(aux.xy - S, D); vec2 o = aux.xy - S - D * s0;
      float s = mod(s0 + ${f1(BELT_SPEED)} * uT, L), size = smoothstep(0., 1.4, s) * (1. - smoothstep(L - 1.3, L - 0.1, s));
      // (on the boom's belt it rides the heaped bed's own swell, kind 8's wave at its place: the same figures)
      float lift = mark.y < 0.5 ? ${f1(BED_SWELL)} * max(1. - abs(aux.z - (${f1(ZC)})) / ${f1(BED0_W)}, 0.) * smoothstep(0., 2.5, s) * (1. - smoothstep(L - 2.5, L, s)) * (wWave((s - ${f1(BELT_SPEED)} * uT) / ${f1(BED_WAVE)}) - 0.35) : 0.;
      return vec3(S + D * s + o, aux.z) + vec3(0., lift, 0.) + (p - aux.xyz) * size;
    }
    if (mark.x < 5.5) {
      // KIND 5: A LUMP ON THE CHUTE, over and over: out of a tipping bucket's port, down the chute's floor, onto the boom's
      // belt. mark: [5, its period, its phase, the seconds it takes]; aux: [its place at the port (xyz), its z on the belt]
      // It drops from the port to the chute's floor (the plate from CHUTE's lip down to the belt's side) and slides on it.
      float P = mark.y, s = fract(uT / P + mark.z) * P, u = clamp(s / mark.w, 0., 1.);
      float x = aux.x - 0.4 * u - 2.0 * u * u, z = mix(aux.z, aux.w, pow(u, 1.15));
      float ye = ${f1(BOOM.top0 + 0.95 + 0.4)} + (x - ${f1(BOOM.x0)}) * ${f1(BOOM.rise / (BOOM.x1 - BOOM.x0))};
      float lip = ${f1(CHUTE.y0)} + (clamp(x, ${f1(CHUTE.x0)}, ${f1(CHUTE.x1)}) - ${f1(CHUTE.x0)}) * ${f1((CHUTE.y1 - CHUTE.y0) / (CHUTE.x1 - CHUTE.x0))};
      float floorY = mix(lip + 0.35, ye, clamp((${f1(CHUTE.zLip)} - z) / ${f1(CHUTE.zLip - CHUTE.zFoot)}, 0., 1.));
      vec3 c = vec3(x, max(floorY, aux.y - ${f1(G_ / 2)} * s * s), z);
      return c + (p - aux.xyz) * smoothstep(0., 0.2, u) * (1. - smoothstep(0.8, 1., u));
    }
    if (mark.x < 6.5) {
      // KIND 6: A LUMP THAT FALLS FROM THE SPOUT onto the heap, over and over. mark: [6, its period, its phase, the seconds
      // it falls]; aux: [its place at the spout's lip (xyz), its speed along z]. It goes over the spout's head level (it does not
      // rise), falls under gravity to the heap's skin (heapTop) on its east flank, some 2 m from its top, and runs a little
      // way down the heap from where it lands: the way the heap falls there (away from the top), dealt up to a right angle
      // to either side, so that the lumps run down all round the place they land on (north, east and south of the top) and
      // none climbs; it rests, sinks into the heap and is born again.
      float P = mark.y, s = fract(uT / P + mark.z) * P, Tl = mark.w, tf = min(s, Tl);
      vec3 c = aux.xyz + vec3(${f1(SPOUT_V[0])}, ${f1(SPOUT_V[1])}, aux.w) * tf; c.y -= ${f1(G_ / 2)} * tf * tf;
      float tr = clamp((s - Tl) / 2.0, 0., 1.), er = 1. - (1. - tr) * (1. - tr);
      if (s > Tl) { vec2 dn = c.xz - vec2(${f1(HEAP.x)}, ${f1(HEAP.z)}); dn /= max(length(dn), 0.001);          // (the way the heap falls where it lands: away from the top)
        float ang = (wHash(mark.z) - 0.5) * 3.1416, cr = cos(ang), sr = sin(ang), run = 1.0 + 8. * wHash(mark.z + 0.61) * wHash(mark.z + 0.13);
        c.xz += vec2(cr * dn.x - sr * dn.y, sr * dn.x + cr * dn.y) * run * er; c.y = heapTop(c.xz) + 0.15; }
      float sink = smoothstep(P - 1.2, P - 0.1, s), a = 2.5 * tf + 3. * er, ca = cos(a), sa = sin(a); vec3 d = p - aux.xyz;
      c.y -= 0.4 * sink;
      return c + vec3(ca * d.x - sa * d.y, sa * d.x + ca * d.y, d.z) * smoothstep(0., 0.2, s) * (1. - sink);
    }
    return p;
  }
`;

export async function buildWorks(ctx, uniforms) {
  const rng = fixedRng(20261011), G = new Geo(17946), E = new Geo(175998);   // (room from the first for exactly the corners they come to hold, 17,946 and 175,998: no array is grown and copied on the way, nor cut when the mesh is made (the land file's fitted); one that comes to hold more grows as ever)
  E.mark = STILL; E.aux = SKIN;                               // (the earth's mesh: what is not a lump is a skin that stands)
  const rest = () => ctx.yield();                             // (every part rests between its pieces: no build step over 50 ms)
  await buildWheel(G, E, rng, rest); await rest();
  buildBoom(G); await rest();
  await buildBelts(E, rng, rest); await rest();
  await buildFoot(E, rng, rest); await rest();
  await buildHeap(E, rng, rest); await rest();
  addShadowBox(uniforms, [CAB.x, CAB.y, CAB.z], [1.5, 1.5, 1.4]);                                // the cab
  addShadowBox(uniforms, [HEAP.x, 2.2, HEAP.z], [5.8, 2.2, 5.8]);                                  // the heap, as two boxes inside it (each corner 0.1 m and more under heapTop)
  addShadowBox(uniforms, [HEAP.x, 6.5, HEAP.z], [3.2, 2.1, 3.2]);
  const steel = fitted(G).mesh(uniforms, { surface: STEEL_SURFACE, motion: WORKS_MOTION }); await ctx.yield();
  const earth = fitted(E).mesh(uniforms, { surface: EARTH_SURFACE, motion: WORKS_MOTION });
  return { steel, earth, triangles: G.triangles + E.triangles, steelTriangles: G.triangles, earthTriangles: E.triangles };
}

// WHERE A BODY OF THIS FILE CAN BE AT ANY CLOCK, as simple shapes (for the world builder's clear-air script). Each holds its
// body with every lump's own reach (a lump of half width r reaches 1.73 r at most).
//   disc: a round about the line through c (x, y) parallel to z, radius r, from z0 to z1
//   box: min, max      capsule: a round bar from a to b, radius r      cone: its base's middle, the base's radius r, its height h
export const WORKS_BODIES = [
  { name: 'the wheel with its buckets, teeth and loads (swept)', shape: 'disc', c: [WHEEL.x, WHEEL.y], r: WHEEL.R + 0.1, z0: -1.65, z1: 1.65 },
  { name: 'the wheel\'s face, ribs and hub', shape: 'disc', c: [WHEEL.x, WHEEL.y], r: 7.5, z0: -1.65, z1: 3.85 },
  { name: 'the shaft', shape: 'capsule', a: [WHEEL.x, WHEEL.y, -8.6], b: [WHEEL.x, WHEEL.y, 3.4], r: 0.8 },
  { name: 'the boom\'s girder', shape: 'capsule', a: [BOOM.x0, (boomTop(BOOM.x0) + boomBot(BOOM.x0)) / 2, ZC], b: [BOOM.x1 + 1.5, (boomTop(BOOM.x1 + 1.5) + boomBot(BOOM.x1 + 1.5)) / 2, ZC], r: 5.2 },   // (its flanges' lips reach 5.11 m from its middle line)
  { name: 'the boom\'s walkway and parapet', shape: 'capsule', a: [BOOM.x0 + 4, boomBot(BOOM.x0 + 4) + 2.6, -1.3], b: [CAB.x - 3.4, boomBot(CAB.x - 3.4) + 2.6, -1.3], r: 1.6 },
  { name: 'the cab, its roof, hanger, landing and parapets', shape: 'box', min: [CAB.x - 3.5, CAB.y - 1.9, CAB.z - 2.9], max: [CAB.x + 1.9, CAB.y + 4.6, CAB.z + 2.5] },
  { name: 'the chute and the lumps on it', shape: 'box', min: [69.4, 33.6, -7.2], max: [79.8, 42.6, -1.2] },
  { name: 'the boom\'s belt: its bed and riding lumps', shape: 'capsule', a: [BELTS[0].s[0], BELTS[0].s[1] + 1.0, ZC], b: [BELTS[0].e[0], BELTS[0].e[1] + 1.0, ZC], r: 1.9 },
  { name: 'the bridge\'s belt: its bed and riding lumps', shape: 'capsule', a: [BELTS[1].s[0], BELTS[1].s[1] + 1.0, ZC], b: [BELTS[1].e[0], BELTS[1].e[1] + 1.0, ZC], r: 1.9 },
  { name: 'the spout\'s belt: its bed and riding lumps', shape: 'capsule', a: [BELTS[2].s[0], BELTS[2].s[1] + 1.0, ZC], b: [BELTS[2].e[0], BELTS[2].e[1] + 1.0, ZC], r: 1.9 },
  { name: 'the fall from the spout: its lumps and its stream of fines', shape: 'box', min: [HEAP.x - 5, 0, ZC - 2.6], max: [SPOUT.to[0] + 2.2, SPOUT.to[1] + 3.8, ZC + 2.6] },   // (round three's great clods, to 0.7 m, reach 0.17 m farther than the first ones)
  { name: 'the heap with the lumps on it', shape: 'cone', base: [HEAP.x, 0, HEAP.z], r: HEAP.R + 2.4, h: HEAP.H + 2.0 },
  { name: 'the fall at the wheel\'s foot', shape: 'box', min: [78.2, 20.4, 0.8], max: [91.1, 32.6, 10.2] },   // (round three's great clods, to 0.7 m, reach 0.17 m farther than the first ones: one of 0.7 m at the lowest rest that can be dealt, 1.62 radians under the hub's height, reaches x 78.31 and y 20.59, one born highest y 31.96 and x 90.80; as built the 760 keep within x 79.87 to 90.22: shots/the-digging-wheel/round3b/steel/mouths.mjs)
  { name: 'the spill from the rising buckets\' lips', shape: 'box', min: [86.6, 21.5, 1.6], max: [90.4, 39.3, 3.2] },
  { name: 'the fan of talus and the lumps on and about it', shape: 'box', min: [76.4, 21.5, 1.6], max: [90.4, 28.0, 14.6] },
];

// the wheel as it stands at clock 0: every corner marked to turn about the hub's axis
export async function buildWheel(G, E, rng, rest = async () => {}) {
  const cx = WHEEL.x, cy = WHEEL.y;
  const at = (ph) => { const c = Math.cos(ph), s = Math.sin(ph); return (t, p, z) => [cx + c * (RING + p) - s * t, cy + s * (RING + p) + c * t, z]; };
  G.mark = TURNS;
  // the ring the buckets are bolted to, and the dished plate body on the drive's side (the lens's side)
  const SEG = 64, ring = cls(STEEL, K_SHELL), face = cls(FACE_OXIDE, K_FACE), back = cls([FACE_OXIDE[0] * 0.6, FACE_OXIDE[1] * 0.6, FACE_OXIDE[2] * 0.6], K_FACE);
  for (let i = 0; i < SEG; i++) {
    const a0 = i / SEG * Math.PI * 2, a1 = (i + 1) / SEG * Math.PI * 2, P = (a, r, z) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
    G.quad(P(a0, RING, -1.4), P(a1, RING, -1.4), P(a1, RING, 1.4), P(a0, RING, 1.4), ring);
    G.quad(P(a0, 7.2, 1.4), P(a1, 7.2, 1.4), P(a1, RING, 1.4), P(a0, RING, 1.4), ring);
    G.quad(P(a0, 7.2, -1.4), P(a1, 7.2, -1.4), P(a1, RING, -1.4), P(a0, RING, -1.4), ring);
    G.quad(P(a0, 1.7, 2.55), P(a1, 1.7, 2.55), P(a1, 7.4, 1.2), P(a0, 7.4, 1.2), face);                    // THE FACE: a dished plate (its sectors, seams and rivets are drawn in STEEL_SURFACE)
    G.quad(P(a0, 7.4, 1.2), P(a1, 7.4, 1.2), P(a1, 7.4, -1.2), P(a0, 7.4, -1.2), ring);
    G.tri([cx, cy, -1.2], P(a0, 7.4, -1.2), P(a1, 7.4, -1.2), back);                                       // the back plate, on the boom's side
  }
  // eight stiffening ribs on the plate, each seated square on the dished plate's own slope (0.7 m across, 0.5 m proud of it,
  // its foot 0.08 m inside it): K(r, u, v) is the place r from the hub, u across the rib, v off the plate along its normal
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), rib = cls([FACE_OXIDE[0] * 0.72, FACE_OXIDE[1] * 0.72, FACE_OXIDE[2] * 0.72], K_SHELL);
    const K = (r, u, v) => [cx + c * (r + v * 0.2304) - s * u, cy + s * (r + v * 0.2304) + c * u, 2.55 - (r - 1.7) * 1.35 / 5.7 + v * 0.9731];
    const r0 = 2.5, r1 = 6.9, u = 0.35, v0 = -0.08, v1 = 0.5;                                                   // (from the hub's drum to the rim's strap: its outer end's top stands 7.02 m from the hub)
    G.quad(K(r0, -u, v1), K(r1, -u, v1), K(r1, u, v1), K(r0, u, v1), rib);                                   // its top,
    for (const w of [-u, u]) G.quad(K(r0, w, v0), K(r1, w, v0), K(r1, w, v1), K(r0, w, v1), rib);            // its two sides
    for (const r of [r0, r1]) G.quad(K(r, -u, v0), K(r, u, v0), K(r, u, v1), K(r, -u, v1), rib); }            // and its two ends
  // the shaft (from the boom's head through the wheel) and the hub: the drive is housed in the plate's middle and turns with
  // nothing beside it; a bolted cover and a worn cap on the shaft's end
  G.cyl([cx, cy, -8.6], [cx, cy, 3.4], 0.75, 12, STEEL);
  G.cyl([cx, cy, 2.2], [cx, cy, 3.4], 2.2, 24, cls([0.17, 0.175, 0.18], K_SHELL));
  G.cyl([cx, cy, 3.4], [cx, cy, 3.62], 1.55, 16, cls([0.24, 0.24, 0.24], K_SHELL));
  G.cyl([cx, cy, 3.62], [cx, cy, 3.8], 0.8, 12, cls([0.40, 0.39, 0.37], K_LIP));
  // the cover's bolts (twelve) and the drum's (sixteen); a raised strap ring over the face's round joint and one at its rim
  for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * Math.PI * 2, x = cx + Math.cos(a) * 1.2, y = cy + Math.sin(a) * 1.2; G.cyl([x, y, 3.6], [x, y, 3.76], 0.13, 6, cls([0.30, 0.295, 0.285], K_LIP)); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = cx + Math.cos(a) * 1.88, y = cy + Math.sin(a) * 1.88; G.cyl([x, y, 3.38], [x, y, 3.54], 0.14, 6, cls([0.22, 0.22, 0.22], K_LIP)); }
  const zf = (r) => 2.55 - (r - 1.7) * 1.35 / 5.7, strap = cls([FACE_OXIDE[0] * 0.8, FACE_OXIDE[1] * 0.8, FACE_OXIDE[2] * 0.8], K_SHELL);
  for (const [r0, r1, up] of [[4.35, 5.05, 0.09], [6.72, 7.42, 0.14]]) for (let i = 0; i < SEG; i++) {   // (each strap ring 0.7 m broad: a strap that lies on a plate is plate only at that breadth; the ribs' outer ends stand 0.18 m in over the rim's strap)
    const a0 = i / SEG * Math.PI * 2, a1 = (i + 1) / SEG * Math.PI * 2, P = (a, r, z) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
    G.quad(P(a0, r0, zf(r0) + up), P(a1, r0, zf(r0) + up), P(a1, r1, zf(r1) + up), P(a0, r1, zf(r1) + up), strap);
    G.quad(P(a0, r0, zf(r0)), P(a1, r0, zf(r0)), P(a1, r0, zf(r0) + up), P(a0, r0, zf(r0) + up), strap);
    G.quad(P(a0, r1, zf(r1)), P(a1, r1, zf(r1)), P(a1, r1, zf(r1) + up), P(a0, r1, zf(r1) + up), strap);
  }
  // the sixteen buckets
  const rngL = fixedRng(20261014);                            // (round three's own deals in the loads: what was dealt before keeps its place)
  for (let k = 0; k < N_BUCKETS; k++) {
    const ph = (k + 0.3) / N_BUCKETS * Math.PI * 2, M = at(ph);
    const tone = 0.8 + 0.5 * rng(), shell = cls([STEEL[0] * tone + 0.03 * rng(), STEEL[1] * tone, STEEL[2] * tone], K_SHELL);
    const liner = cls([0.15 * tone, 0.15 * tone, 0.15 * tone], K_LINER), lip = cls(BRIGHT, K_LIP);
    // THE SHELL: an open scoop (back, outer shell, the floor on the ring; no plate across the mouth); its two sides, each cut
    // back behind the mouth's plane (SIDE); a liner 0.1 m inside it, polished by the earth; rims round the mouth joining the two
    const IN = (q) => [SIDE_MID[0] + (q[0] - SIDE_MID[0]) * 0.92, SIDE_MID[1] + (q[1] - SIDE_MID[1]) * 0.90], ZI = BW - 0.1, ns = SIDE.length;
    for (let i = 0; i < ns; i++) {
      const a = SIDE[i], b = SIDE[(i + 1) % ns], ai = IN(a), bi = IN(b), front = i >= LIP_I && i < ns - 1;      // (front: the side's cut-back edge)
      if (!front) { G.quad(M(a[0], a[1], -BW), M(b[0], b[1], -BW), M(b[0], b[1], BW), M(a[0], a[1], BW), shell);
        G.quad(M(ai[0], ai[1], -ZI), M(bi[0], bi[1], -ZI), M(bi[0], bi[1], ZI), M(ai[0], ai[1], ZI), liner); }
      for (const z of [-1, 1]) {
        const port = z < 0 && i === ns - 1;                                                    // THE PORT in the north side, by the ring (most of the load leaves over the side's cut-back front edge: see the motion law)
        if (!port) { G.tri(M(SIDE_MID[0], SIDE_MID[1], z * BW), M(a[0], a[1], z * BW), M(b[0], b[1], z * BW), shell);
          G.tri(M(SIDE_MID[0], SIDE_MID[1], z * ZI), M(ai[0], ai[1], z * ZI), M(bi[0], bi[1], z * ZI), liner); }
        if (front) G.quad(M(a[0], a[1], z * BW), M(b[0], b[1], z * BW), M(bi[0], bi[1], z * ZI), M(ai[0], ai[1], z * ZI), lip);   // the side's cutting edge, worn bright
      }
    }
    { const L = SIDE[LIP_I], F = SIDE[ns - 1], Li = IN(L), Fi = IN(F);                                       // the rims across the lip and across the foot
      G.quad(M(L[0], L[1], -BW), M(L[0], L[1], BW), M(Li[0], Li[1], ZI), M(Li[0], Li[1], -ZI), lip);
      G.quad(M(F[0], F[1], -BW), M(F[0], F[1], BW), M(Fi[0], Fi[1], ZI), M(Fi[0], Fi[1], -ZI), shell); }
    // its cutting lip, worn bright, and four teeth
    G.quad(M(0.5, 1.975, -BW - 0.04), M(1.08, 1.89, -BW - 0.04), M(1.08, 1.89, BW + 0.04), M(0.5, 1.975, BW + 0.04), lip);
    for (let j = 0; j < 4; j++) { const z = -1.14 + j * 0.76, w = 0.27;
      const a = M(0.8, 1.48, z - w), b = M(0.8, 1.48, z + w), c = M(0.9, 2.0, z + w), d = M(0.9, 2.0, z - w), tip = M(1.72, 1.74, z);
      G.tri(a, b, tip, lip); G.tri(b, c, tip, lip); G.tri(c, d, tip, lip); G.tri(d, a, tip, lip); }
    buildLoad(E, rng, ph, M, rngL);
    if (k % 2 === 1) await rest();
  }
  G.mark = STANDS;
}

// the mouth's plane at the height p over the ring (t of the line from the foot to the lip), and the bucket's back there
const mouthT = (p) => 0.75 + 0.30 * p / 1.85;
const backT = (p) => { for (let i = 0; i < 4; i++) { const a = BUCKET[i], b = BUCKET[i + 1]; if (p <= b[1]) return a[0] + (b[0] - a[0]) * (p - a[1]) / (b[1] - a[1]); } return 0.7; };
// how far behind the mouth's plane the full load's top lies: least in the bucket's middle, more toward the lip and the sides
const loadDepth = (p, z) => 0.08 + 0.14 * p / 1.85 + 0.45 * (z / BW) ** 2;   // (round three: heaped fuller; with its corners' deal of 0.06 m it is still 0.02 m and more behind the mouth's plane)

// ONE BUCKET'S LOAD (kind 2), built as the bucket carries it when full: a closed bed of fines across the whole bucket, and
// lumps seated in it. NOTHING of it stands ahead of the mouth's plane or outside the bucket's sides: a lump of half width r
// reaches at most 1.73 r from its middle (the core's lump: 1.35 by 1.28), and its middle is kept that far inside.
function buildLoad(E, rng1, ph, M, rng2) {
  const m0 = E.mark, a0 = E.aux, anchor = M(-1.2, 0.2, 0), rng = rng1;
  const PS = [0.1, 0.62, 1.18, 1.74], ZS = [-1.44, -0.72, 0, 0.72, 1.44], V = [];
  for (const p of PS) { const row = []; for (const z of ZS) { const edge = Math.abs(z) > 1.4 || p < 0.2 || p > 1.7, t = mouthT(p) - loadDepth(p, z) - (edge ? 0.1 : rng.range(-0.06, 0.1));
    row.push({ at: M(t, p, z), dt: t - Math.min(t, backT(p) + 0.14) }); } V.push(row); }
  for (let i = 0; i < PS.length - 1; i++) for (let j = 0; j < ZS.length - 1; j++) { triMarked(E, [V[i][j], V[i + 1][j], V[i + 1][j + 1]], ph, anchor, rng); triMarked(E, [V[i][j], V[i + 1][j + 1], V[i][j + 1]], ph, anchor, rng); }
  for (let j = 0; j < LOAD_LUMPS + LOAD_MORE; j++) { const rng = j < LOAD_LUMPS ? rng1 : rng2;      // (round three's LOAD_MORE clods, 0.2 to 0.34 m, are dealt by their own generator)
    const r = j < 2 ? rng.range(0.4, 0.5) : j < LOAD_LUMPS ? 0.15 + 0.22 * rng() ** 1.6 : 0.2 + 0.14 * rng(), zmax = BW - 0.14 - 1.73 * r, z = rng.range(-zmax, zmax), p = rng.range(0.25 + r, 1.5 - 0.3 * r);
    const depth = Math.max(loadDepth(p, z) + 0.25 * r, 1.73 * r + 0.06), t = mouthT(p) - depth, c = M(t, p, z);
    const n0 = E.n, dt = t - Math.min(t, backT(p) + 0.14 + r * 0.5);
    E.lump(c, r, rng, loadTone(rng), [2, ph, (z + BW) / (2 * BW), dt], [c[0], c[1], c[2], 0]);
    roomFor(E, n0, ph, c, [t, p, z], dt);
  }
  E.mark = m0; E.aux = a0;
}
// THE ROOM A LOAD'S LUMP HAS IN ITS BUCKET (SHELL_IN: the shell's outline closed by the mouth's plane and the ring, a convex round;
// its sides at z plus and minus BW; all taken 2 cm in). The lump just built (corners n0 on, its middle c in the world and
// mid in the bucket's own t, p, z) stands back dt from its place while the bucket fills. If any corner of it would stand
// through the shell when the bucket is full, the lump is drawn in about its middle until none does. Then its aux.w is
// set: 0.45 times the least share F1 of the filling at which the whole lump has room. (Its room toward each wall changes
// evenly with the filling, so a lump grown as F / F1 has room at every share before F1 as well: the motion law grows it so.)
const SHELL_IN = [...SHELL, BUCKET[MOUTH + 1]].map((a, i, B) => { const b = B[(i + 1) % B.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return { a, n: [-(b[1] - a[1]) / l, (b[0] - a[0]) / l] }; });   // each edge: a point of it, its outward normal (the outline runs clockwise from the ring's back)
function roomFor(E, n0, ph, c, mid, dt) {
  const er = [Math.cos(ph), Math.sin(ph)], et = [-er[1], er[0]], IN = 0.02, walls = [], off = [];
  for (const { a, n } of SHELL_IN) walls.push({ n: [n[0], n[1], 0], room: -((mid[0] - a[0]) * n[0] + (mid[1] - a[1]) * n[1]) - IN, gain: -n[0] * dt });   // room when full; how much of it the filling gives
  for (const sd of [-1, 1]) walls.push({ n: [0, 0, sd], room: BW - IN - sd * mid[2], gain: 0 });
  // (off: the lump's corners about its middle, EACH PLACE ONCE: a lump's sixty corners stand at twelve places, five faces
  // meeting at each, and a place tried once has no more to say when it comes again: the fit and F1 below are a least and
  // a greatest over the places. first: the corners at which a place first comes)
  const P = E.P, first = [];
  for (let i = n0; i < E.n; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; let s = 0; while (s < first.length && !(P[first[s] * 3] === x && P[first[s] * 3 + 1] === y && P[first[s] * 3 + 2] === z)) s++;
    if (s < first.length) continue; first.push(i);
    const dx = x - c[0], dy = y - c[1]; off.push([dx * et[0] + dy * et[1], dx * er[0] + dy * er[1], z - c[2]]); }
  let fit = 1; for (const w of walls) for (const o of off) { const reach = o[0] * w.n[0] + o[1] * w.n[1] + o[2] * w.n[2]; if (reach * fit > w.room) fit = Math.max(w.room, 0) / reach; }
  if (fit < 1) for (let i = n0; i < E.n; i++) for (let k = 0; k < 3; k++) E.P[i * 3 + k] = c[k] + (E.P[i * 3 + k] - c[k]) * fit;
  let F1 = 0; for (const w of walls) if (w.gain > 1e-6) for (const o of off) F1 = Math.max(F1, 1 - (w.room - fit * (o[0] * w.n[0] + o[1] * w.n[1] + o[2] * w.n[2])) / w.gain);
  for (let i = n0; i < E.n; i++) E.A[i * 4 + 3] = 0.45 * Math.min(Math.max(F1, 0.002), 1);
}
// a triangle of a bucket's bed: every corner with its own advance from the bucket's back
function triMarked(E, v, ph, anchor, rng) {
  const t = rng.range(0.98, 1.14) * 0.74, col = cls([DAMP[0] * t, DAMP[1] * t, DAMP[2] * t], K_BED), n0 = E.n;   // (fresh from the cut: damp and dark)
  E.mark = [2, ph, 0.5, 0]; E.aux = [anchor[0], anchor[1], anchor[2], 1]; E.tri(v[0].at, v[1].at, v[2].at, col);
  for (let k = 0; k < 3; k++) E.M[(n0 + k) * 4 + 3] = v[k].dt;
}

// the boom behind the wheel: a closed plate girder (two whole plated sides between boxed chords of 1.1 m, each chord under
// a flange plate that laps out over it; a stiffening post every 9 m and, on the south flank, a stiffener 0.7 m broad every
// 3 m between them and bolted cover plates at the joints; a bottom plate with a cross rib 0.7 m broad every 3 m; its two
// ends closed; no lattice, no opening), the belt in its trough on the girder's back, the chute, and the driver's cab hung
// on the lens's side.
// Nothing here in steel is thinner than 0.7 m but plate, and a strap, a rib or a stiffener that lies on a plate is itself
// plate only where BOTH its greater measures are 0.7 m or more (the lead's ruling, round three b): every one here is.
export function buildBoom(G) {
  const x0 = BOOM.x0, x1 = BOOM.x1, xe = x1 + 1.5, top = boomTop, bot = boomBot, zS = BOOM.zS, zN = BOOM.zN;
  const CHORD = cls(GREY, K_BOOM), PLATE = cls([GREY[0] * 0.8, GREY[1] * 0.8, GREY[2] * 0.8], K_BOOM), RIB = cls([GREY[0] * 0.9, GREY[1] * 0.9, GREY[2] * 0.9], K_BOOM), COVER = cls([GREY[0] * 0.95, GREY[1] * 0.95, GREY[2] * 0.95], K_BOOM);
  for (const z of [zS, zN]) { const sd = z > ZC ? 1 : -1;      // (sd: the way out of the girder on this flank)
    G.beam([x0, top(x0), z], [xe, top(xe), z], 1.1, 1.1, CHORD); G.beam([x0, bot(x0), z], [xe, bot(xe), z], 1.1, 1.1, CHORD);
    G.quad([x0, bot(x0), z], [xe, bot(xe), z], [xe, top(xe), z], [x0, top(x0), z], PLATE);
    for (let i = 0; i <= 8; i++) { const x = x0 + i * 9; G.beam([x, bot(x), z], [x, top(x), z], 0.75, 0.75, CHORD); }
    // each chord's flange: a plate 0.12 m thick lapping 0.3 m out over the chord's outer face (above the top chord, under the bottom one)
    for (const [f, up] of [[top, 0.61], [bot, -0.61]]) G.beam([x0, f(x0) + up, z + sd * 0.17], [xe, f(xe) + up, z + sd * 0.17], 1.36, 0.12, CHORD);
  }
  // THE SOUTH FLANK, which the lens passes: an upright stiffener every 3 m between the posts (0.7 m broad along the boom,
  // as broad as a post nearly, standing 0.45 m proud of the web, from chord to chord, its head and foot cut to the chords'
  // slope); at every joint (midway between two posts) a bolted cover plate on the web
  // and one on each chord's face, each 0.06 m proud (their bolts, and the parts' own shadows, are drawn in STEEL_SURFACE)
  for (let j = 1; j < 24; j++) { if (j % 3 === 0) continue; const x = x0 + j * 3, a = x - 0.35, b = x + 0.35, zo = zS + 0.45;
    G.quad([a, bot(a) + 0.55, zo], [b, bot(b) + 0.55, zo], [b, top(b) - 0.55, zo], [a, top(a) - 0.55, zo], CHORD);
    for (const xs of [a, b]) { const y0 = bot(xs) + 0.55, y1 = top(xs) - 0.55; G.quad([xs, y0, zS], [xs, y0, zo], [xs, y1, zo], [xs, y1, zS], CHORD); } }
  const coverAt = (xa, xb, f, lo, hi, z) => { const P = [[xa, f(xa) + lo, z], [xb, f(xb) + lo, z], [xb, f(xb) + hi, z], [xa, f(xa) + hi, z]]; G.quad(P[0], P[1], P[2], P[3], COVER);
    for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4]; G.quad(p, q, [q[0], q[1], q[2] - 0.06], [p[0], p[1], p[2] - 0.06], COVER); } };
  for (let k = 0; k < 8; k++) { const x = x0 + 4.5 + 9 * k;
    coverAt(x - 0.6, x + 0.6, bot, 0.7, 5.3, zS + 0.06); coverAt(x - 0.9, x + 0.9, bot, -0.45, 0.45, zS + 0.61); coverAt(x - 0.9, x + 0.9, top, -0.45, 0.45, zS + 0.61); }
  G.quad([x0, top(x0), zS], [xe, top(xe), zS], [xe, top(xe), zN], [x0, top(x0), zN], PLATE);
  // THE UNDERSIDE: a bottom plate between the bottom chords (0.25 m under their line), a cross rib under it every 3 m
  // (0.7 m broad along the boom, 0.25 m deep, 4.3 m long from chord to chord: the chords stand 0.05 m lower; 2.3 m of
  // plate between each two; the first begins 0.05 m inside the boom's root end)
  G.quad([x0, bot(x0) - 0.25, zS], [xe, bot(xe) - 0.25, zS], [xe, bot(xe) - 0.25, zN], [x0, bot(x0) - 0.25, zN], PLATE);
  for (const x of [x0, xe]) G.quad([x, bot(x) - 0.25, zS], [x, bot(x) - 0.25, zN], [x, top(x), zN], [x, top(x), zS], PLATE);   // its two ends, closed
  for (let j = 0; j <= 24; j++) { const x = x0 + 0.4 + j * 3, a = x - 0.35, b = x + 0.35, za = zS - 0.55, zb = zN + 0.55;
    G.quad([a, bot(a) - 0.5, za], [b, bot(b) - 0.5, za], [b, bot(b) - 0.5, zb], [a, bot(a) - 0.5, zb], RIB);
    for (const xs of [a, b]) G.quad([xs, bot(xs) - 0.25, za], [xs, bot(xs) - 0.5, za], [xs, bot(xs) - 0.5, zb], [xs, bot(xs) - 0.25, zb], RIB); }
  // THE BELT on the girder's back: dark rubber (its cleats run with the clock: STEEL_SURFACE) between two low kerbs, so that
  // the earth heaped on it stands over the boom's top line from below and from the side
  G.beam([x0 + 2, beltY(x0 + 2) - 0.2, ZC], [x1 - 1, beltY(x1 - 1) - 0.2, ZC], 3.0, 0.5, cls([0.06, 0.06, 0.065], K_BELT));
  for (const z of [-3.2, -6.8]) G.beam([x0 + 2, beltY(x0 + 2) - 0.1, z], [x1 - 1, beltY(x1 - 1) - 0.1, z], 0.7, 0.55, GREY);
  // (the belt, its kerbs, its bed and its lumps end inside the hood over the boom's foot: the machine file's pale hood, x 4.5
  // to 11.5, the bed and the lumps going in by the dark mouth in its east face; this file builds no hood of its own there)
  // THE CHUTE, on the boom's side of the wheel (it stands; the wheel turns 0.25 m clear of it): a sloping floor from under
  // the tipping buckets' ports down to the belt, a back wall beyond the belt, an end wall toward the face
  const cy = (x) => beltY(x) + 0.45, K = CHUTE;
  slab(G, [K.x0, K.y0, K.zLip], [K.x1, K.y1, K.zLip], [K.x1, cy(K.x1), K.zFoot], [K.x0, cy(K.x0), K.zFoot], -0.22, GREY);
  slab(G, [72.0, cy(72.0) - 0.6, -6.9], [79.7, cy(79.7) - 0.6, -6.9], [79.7, 40.2, -6.9], [72.0, 37.4, -6.9], 0.25, GREY);
  slab(G, [79.5, cy(79.5) - 0.6, -6.9], [79.5, cy(79.5) - 0.6, K.zLip], [79.5, 39.9, K.zLip], [79.5, 40.2, -6.9], 0.25, GREY);
  // THE DRIVER'S CAB, hung on the lens's side by the wheel: a white box with a band of dark glass (nobody in it), a door on
  // the lens's side, a plated landing with its parapet 1.1 m high: things of a known size beside the wheel
  const CABC = C('#DCD8CC'), cxb = CAB.x, cyb = CAB.y, czb = CAB.z, glass = cls(GLASS, K_GLASS), RAIL = [GREY[0] * 1.25, GREY[1] * 1.25, GREY[2] * 1.2];
  G.box(cxb, cyb, czb, 3.2, 3.2, 3.0, CABC);
  G.box(cxb + 0.2, cyb + 0.55, czb + 0.02, 2.9, 1.25, 3.06, glass);                    // the glass band, round the front and both sides
  G.box(cxb + 1.62, cyb + 0.35, czb, 0.06, 1.9, 2.6, glass);                            // the front pane, deeper, toward the wheel
  G.box(cxb - 0.95, cyb - 0.45, czb + 1.52, 0.95, 2.1, 0.08, C('#7C878C'));              // the door
  G.box(cxb - 0.95, cyb + 0.2, czb + 1.57, 0.6, 0.7, 0.04, glass);                      // its window
  G.box(cxb, cyb + 1.7, czb, 3.6, 0.22, 3.4, GREY);                                      // its roof
  G.box(cxb - 0.4, cyb - 1.72, czb + 1.1, 4.4, 0.24, 2.6, GREY);                         // the landing, under the cab and out to the south
  G.box(cxb - 2.5, cyb - 1.72, czb - 1.15, 1.8, 0.24, 2.3, GREY);                        // and round its west side to the boom's walkway
  G.box(cxb - 0.4, cyb - 1.05, czb + 2.36, 4.4, 1.1, 0.1, RAIL);                         // its plated parapets: south,
  G.box(cxb + 1.76, cyb - 1.05, czb + 1.95, 0.1, 1.1, 0.9, RAIL);                        // east,
  G.box(cxb - 3.36, cyb - 1.05, czb + 1.0, 0.1, 1.1, 2.8, RAIL);                         // and west
  G.beam([cxb, cyb + 1.8, czb - 0.6], [cxb, top(cxb) + 0.2, BOOM.zS], 0.7, 0.7, GREY);   // hung from the boom's top chord
  // THE WALKWAY along the boom's south side, 2.25 m over the bottom chord's line, from the body to the cab's landing: a plated
  // deck 1.8 m wide on boxed brackets (0.7 m) at the girder's posts, a plated parapet 1.1 m high on its open side
  const wy = (x) => bot(x) + 2.25, wa = x0 + 4, wb = cxb - 3.4;
  G.beam([wa, wy(wa) - 0.1, -1.4], [wb, wy(wb) - 0.1, -1.4], 1.8, 0.2, CHORD);          // (the deck and the parapet take the boom's own drawing: the parapet's panels, ribs and rail)
  G.beam([wa, wy(wa) + 0.55, -0.55], [wb, wy(wb) + 0.55, -0.55], 0.1, 1.1, cls(RAIL, K_BOOM));
  G.box(wa, wy(wa) + 0.55, -1.4, 0.1, 1.1, 1.8, RAIL);
  for (let i = 1; i <= 6; i++) { const x = x0 + i * 9; G.beam([x, wy(x) - 0.25, -0.75], [x, wy(x) - 1.7, -2.1], 0.7, 0.7, GREY); }
}
// a plate: the four corners of one face, pushed th along the face's normal
function slab(G, a, b, c, d, th, col) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const l = Math.hypot(n[0], n[1], n[2]); n = n.map((q) => q / l * th);
  const P = [a, b, c, d], Q = P.map((p) => [p[0] + n[0], p[1] + n[1], p[2] + n[2]]);
  G.quad(P[0], P[1], P[2], P[3], col); G.quad(Q[0], Q[1], Q[2], Q[3], col);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; G.quad(P[i], P[j], Q[j], Q[i], col); }
}

// THE WHEEL'S FOOT: the fan of talus (a faceted mound leaning on the socket's face, south of the wheel, with lumps lying on
// it) and THE FALL (kind 3): lumps that break from the cut beside the rising buckets and go down the face to the fan.
const N_FALL = 260, N_FANLUMPS = 260, N_FALL_MORE = 40, N_CLODS_ON = 40, N_CRUMBS = 420, N_SPILL = 240;
export async function buildFoot(E, rng, rest = async () => {}) {
  // the fan's skin: a grid over its ground, each corner a little off its place, each face its own tone; only where the fan
  // stands over the land (the land file's own height there: the skin is tucked 5 cm under it at its edge)
  const X0 = 77.2, Z0 = FAN.z0, NX = 24, NZ = 24, DX = 0.56, DZ = 0.54, V = [];
  for (let i = 0; i <= NX; i++) { const row = []; for (let j = 0; j <= NZ; j++) {
    const x = X0 + i * DX + (i && i < NX ? rng.range(-0.16, 0.16) : 0), z = Z0 + j * DZ + (j && j < NZ ? rng.range(-0.16, 0.16) : 0), f = fanTop(x, z), g = landY(x, z);
    const up = f > g + 0.04; row.push({ p: [x, up ? f + rng.range(-0.07, 0.09) * Math.min(1, (f - g) * 2) : g - 0.05, z], up });
  } V.push(row); if (i % 4 === 3) await rest(); }
  const fanCol = (a, b, c) => { const y = (a.p[1] + b.p[1] + c.p[1]) / 3, t = rng.range(0.84, 1.1), k = Math.min(1, Math.max(0, (y - 22.3) / 3.2));   // fresher and darker toward its top, where the earth comes down
    return cls([(DRY[0] + (DAMP[0] - DRY[0]) * k) * t, (DRY[1] + (DAMP[1] - DRY[1]) * k) * t, (DRY[2] + (DAMP[2] - DRY[2]) * k) * t], K_BED); };
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = V[i][j], b = V[i + 1][j], c = V[i + 1][j + 1], d = V[i][j + 1];
    if (a.up || b.up || c.up) E.tri(a.p, b.p, c.p, fanCol(a, b, c)); else E.tri(a.p, a.p, a.p, HOLLOW);
    if (a.up || c.up || d.up) E.tri(a.p, c.p, d.p, fanCol(a, c, d)); else E.tri(a.p, a.p, a.p, HOLLOW); }
  // lumps lying on the fan (a few great clods, mostly at its toe, where the great ones roll to; many small) and strewn on the berm about its foot
  for (let j = 0; j < N_FANLUMPS; j++) {
    const big = rng() < 0.07, r = big ? rng.range(0.4, 0.62) : 0.11 + 0.26 * rng() ** 1.8, x = rng.range(77.6, 88.4), z = FAN.z0 + 0.4 + 11 * rng() ** 1.5, f = fanTop(x, z), g = landY(x, z);
    const on = f > g + 0.04, steep = Math.abs(landY(x + 0.4, z) - landY(x - 0.4, z)) > 0.6;
    if ((on && (!big || f - g < 1.6)) || (!steep && rng() < 0.5)) lie(E, [x, Math.max(f, g) + r * 0.1, z], r, rng, on ? freshTone(rng) : dry(rng.range(0.8, 1.0))); else lie(E, [x, g - 3, z], 0.01, rng, HOLLOW);   // (a lump that finds no place is laid away under the ground: the count never changes)
    if (j % 50 === 49) await rest();
  }
  // THE FALL. Each lump's way is dealt and then PROVED here, by arithmetic along it (fallAt): its birth place on the cut,
  // over the fan; its rest (on the fan, or on the terrace at the face's foot) and how far south it goes on the way, taken
  // from what was dealt only if its height never rises along that way (else nearer, at last straight down the face and
  // no way south, which cannot rise); and its fall time, from the greatest acceleration of its middle along the way: so
  // long that this stays under 0.95 g.
  // ROUND THREE: the stream is denser and of more sizes. After the first N_FALL lumps (dealt as they were, by the works'
  // generator) come N_FALL_MORE great clods (0.3 to 0.7 m), dealt by a generator of their own and each given its way and
  // its time BY THE SAME LAW AND THE SAME PROOF; then N_CLODS_ON clods more of the same sizes and N_CRUMBS crumbs (0.07 to
  // 0.18 m, each an eight-faced lump), each of which goes THE WAY OF ONE OF THOSE LUMPS (a way proved above: it breaks from the cut where a lump has)
  // in that lump's time or up to 1.3 times as long (a slower fall asks less of gravity), at its own beat. The new ones
  // lie a shorter while before they are born again (1.4 to 3 s), so more of them are in the air at once.
  const rng1 = rng, rng2 = fixedRng(20261013), ways = [], typed = FALL_PROOF.every(([W, t]) => fallTime(W) === t);   // (typed: the law still gives the three proof ways their typed times: see FALL_WAYS)
  for (let j = 0; j < N_FALL + N_FALL_MORE; j++) { const rng = j < N_FALL ? rng1 : rng2, sort = j < N_FALL ? 0 : 1;
    const r = sort === 0 ? 0.16 + 0.44 * rng() ** 1.6 : 0.3 + 0.4 * rng() ** 1.3, q0 = rng() ** 1.25, z0 = 1.9 + 1.5 * r + rng.range(0, 1.0);   // (beside the buckets' south side: no lump stands in a bucket's way)
    const q1 = -1.5 + 0.72 * rng() - (r > 0.4 ? 0.12 : 0), dz = 0.3 + 4.2 * rng() ** 1.4, slow = rng.range(0.9, 1.12), lies = sort ? rng.range(1.4, 3.0) : rng.range(2.4, 4.6);
    // its birth: on the cut's arc between the lowest place there where the face stands clear of the fan and 8.6 degrees under the hub's height
    let free = -1.22; while (free < -0.36 && WHEEL.y + FALL.R * Math.sin(free) < fanUnder(WHEEL.x + FALL.R * Math.cos(free), z0) + FALL.lift + 0.05) free += 0.02;
    const th0 = free + (-0.15 - free) * q0, far = Math.min(q1, th0 - 0.2);
    let L = null, T = 0; const row = typed ? FALL_WAYS[j] : undefined;
    if (row !== undefined && row[0] === th0 + 2 * far + 3 * z0 + 5 * dz) { const c = row[1], d = c % 13;   // (its way and its time as typed, the row being this lump's own: see FALL_WAYS)
      L = [th0, d < 12 ? th0 - 0.2 + (far - th0 + 0.2) * FALL_K[d % 3] : far, z0, c < 12 ? z0 + dz * FALL_G[(c / 3) | 0] : z0]; T = row[2]; }
    else {
      for (const g of FALL_G) for (const k of FALL_K) {
        if (L && T * T < FALL.R * (L[0] - L[1])) break;                     // (taken: its way holds, and it is not slow for its length)
        const W = [th0, th0 - 0.2 + (far - th0 + 0.2) * k, z0, z0 + dz * g], t = fallTime(W);
        if (t > 0 && (!L || t * t / (W[0] - W[1]) < T * T / (L[0] - L[1]))) { L = W; T = t; }
      }
      if (!L) L = [th0, far, z0, z0];                                       // (straight down the face to where it was dealt to rest: that way cannot rise)
      T = fallTime(L, true, 2400); if (!T) { L = [th0, L[1], z0, z0]; T = fallTime(L, true, 2400); }   // (its time, worked finely for the way taken)
    }
    T *= 1.05 + 0.45 * (slow - 0.9);
    ways.push({ L, T });
    E.lump(fallAt(L, 0), r, rng, freshTone(rng), [3, T + lies, rng(), T], L);
    if (j % 5 === 4) await rest();
  }
  // (N_CLODS_ON great clods more, each on a way proved above: the first of the ways, from one drawn, that begins far enough
  // south of the buckets' sides for a clod of its size: 1.9 m and 1.5 times its radius; a way is a lump's MIDDLE's, the same
  // for any size; were there none so far south, the clod is made as small as its way asks)
  for (let j = 0; j < N_CLODS_ON; j++) { const rng = rng2, n = ways.length; let r = 0.3 + 0.4 * rng() ** 1.3, i = Math.floor(rng() * n), k = 0;
    while (k < n && ways[(i + k) % n].L[2] < 1.9 + 1.5 * r) k++;
    const w = ways[(i + k) % n], T = w.T * rng.range(1.0, 1.3); r = Math.min(r, (w.L[2] - 1.9) / 1.5);
    E.lump(fallAt(w.L, 0), r, rng, freshTone(rng), [3, T + rng.range(1.4, 3.0), rng(), T], w.L);
  }
  for (let j = 0; j < N_CRUMBS; j++) { const rng = rng2, r = 0.07 + 0.11 * rng(), w = ways[Math.floor(rng() * ways.length)], T = w.T * rng.range(1.0, 1.3), tone = freshTone(rng);
    crumb(E, fallAt(w.L, 0), r, rng, [tone[0] * 0.85, tone[1] * 0.85, tone[2] * 0.85], [3, T + rng.range(1.4, 3.0), rng(), T], w.L);
    if (j % 100 === 99) await rest();
  }
  // THE SPILL (kind 10): crumbs that slip off the rising buckets' heaped lips, from 6 degrees under the hub's height to 43
  // over it, and fall straight down through the air just south of the buckets' sides (0.1 m and more clear of the round
  // the buckets sweep) to the face or the fan below: earth seen IN THE AIR beside the wheel. Each is let go at rest and
  // falls under gravity alone for the time its height asks; one that would have under 1.2 m to fall (the land's own
  // height asked) is laid away under the ground (the count never changes).
  for (let j = 0; j < N_SPILL; j++) { const rng = rng2, th = rng.range(-0.1, 0.75), rho = rng.range(9.55, 9.95), r = 0.06 + 0.14 * rng() ** 1.5, c = [WHEEL.x + rho * Math.cos(th), WHEEL.y + rho * Math.sin(th), 1.75 + 1.69 * r + rng.range(0, 0.7)];
    const floor = Math.max(landY(c[0], c[2]), fanTop(c[0], c[2])), T = Math.sqrt(2 * Math.max(c[1] - floor, 0) / G_), tone = freshTone(rng), mark = [10, T + rng.range(0.25, 1.3), rng(), T];
    if (c[1] - floor > 1.2) crumb(E, c, r, rng, [tone[0] * 0.8, tone[1] * 0.8, tone[2] * 0.8], mark, [c[0], c[1], c[2], 0]); else crumb(E, [c[0], floor - 3, c[2]], 0.01, rng, HOLLOW, STILL, [c[0], floor - 3, c[2], 0]);
    if (j % 40 === 39) await rest();
  }
}
// a crumb of earth: an eight-faced lump, for the small ones (a twenty-faced ball would be wasted on them): six corners
// pulled out of round, none farther than 1.69 r from its middle. It takes ten draws of rng. mark and aux are its own.
function crumb(E, c, r, rng, col, mark, aux) {
  const k = [rng.range(0.7, 1.3), rng.range(0.55, 1.0), rng.range(0.7, 1.3)], m0 = E.mark, a0 = E.aux;
  const V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((v) => { const j = rng.range(0.7, 1.3); return [c[0] + v[0] * r * k[0] * j, c[1] + v[1] * r * k[1] * j, c[2] + v[2] * r * k[2] * j]; });
  const t = rng.range(0.8, 1.15), cc = [col[0] * t, col[1] * t, col[2] * t];
  E.mark = mark; E.aux = aux;
  for (const [a, b, d] of [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]) E.tri(V[a], V[b], V[d], cc);
  E.mark = m0; E.aux = a0;
}
// a falling lump's way L (see fallAt), proved: 0 if its height anywhere rises along it, or if it would rest in the air
// (more than 0.1 m over its seat on the fan's top or on the terrace); else the least time (seconds) in which it can go that way with its middle's acceleration never
// over g (the greatest second difference of its place over the share of its time, by fallEase)
function fallTime(L, anyRest = false, N = 240) {
  const at = (i) => fallAt(L, fallEase(i / N)), end = fallAt(L, 1);
  if (!anyRest && end[1] > fanTop(end[0], end[2]) + FALL.lift + 0.1) return 0;
  let a = at(0), b = at(1), most = 0;
  if (b[1] > a[1] + 1e-9) return 0;
  for (let i = 2; i <= N; i++) { const c = at(i); if (c[1] > b[1] + 1e-9) return 0;
    most = Math.max(most, Math.hypot(c[0] - 2 * b[0] + a[0], c[1] - 2 * b[1] + a[1], c[2] - 2 * b[2] + a[2]) * N * N); a = b; b = c; }
  return Math.sqrt(most / G_);
}
// THE FALL'S WAYS AS THE LAW GIVES THEM, TYPED (FALL_WAYS; round three, for the build's time: proving each of the 300 ways
// along fallAt took the build some 300 ms of its work in node, a fifth of the whole, and the ways are the same on every
// seed and every visit: the works' generators are fixed and no seed deals the land). A ROW: [mark, code, T]. mark: th0 +
// 2 far + 3 z0 + 5 dz of the lump as dealt; code: the way the proof took (0 to 11: the twelve that are tried, in the order
// they are tried, g by k; 12: none held, straight down to where it was dealt to rest; 13 more: that way laid straight,
// no way south); T: its time as fallTime works it finely, before the lump's own slowness.
// THE GUARD: a row is taken only if (a) its mark is the dealt lump's own to the last bit (whoever changes what is dealt
// before the fall, or the land under the fan, changes the marks) and (b) THE LAW STILL GIVES WHAT IT GAVE: three ways
// (FALL_PROOF: the longest way south, the longest way round, the shortest) are tried by fallTime in every build and must
// give their typed times to the last bit. Else the way is proved along fallAt as it always was (the build is then
// slower; nothing else changes). A change to the fan or to the fall's figures that none of the three ways feels would
// not be seen by (b): WHOEVER CHANGES fallAt, fanUnder, fanTop, fallEase, fallTime, FALL OR FAN TYPES THE ROWS AGAIN:
// node shots/the-digging-wheel/round3/speed/fallrows.mjs prints them (it works every way by the law, in a copy of this
// file with the table emptied); with --check it says whether the rows typed here are the law's, bit for bit.
const FALL_G = [1, 0.6, 0.3, 0], FALL_K = [1, 0.66, 0.33];   // the shares of its way south (g) and of its way round (k) at which a way is tried
const FALL_PROOF = [
  [[-0.23830931864829202, -0.8416151428967715, 2.642491041306271, 7.138007603190075], 2.3293123822737583],
  [[-0.1508906011793547, -1.1477469490282237, 3.210523432611388, 3.210523432611388], 3.7687074877065556],
  [[-0.6410996824394486, -0.8410996824394485, 3.1566698426553716, 3.1566698426553716], 1.0785437333953583],
];
const FALL_WAYS = [
  [14.364996407342158, 9, 2.935230271573972], [16.086117943414617, 9, 2.6395113411753774], [12.880889907373255, 9, 1.4318605371590223], [8.026351125585212, 10, 2.093029181551396], [6.565226793771817, 11, 2.3463562454287583],
  [10.461232841731135, 9, 2.364175356886144], [8.654959471612225, 11, 1.9575433459691292], [26.788636289328135, 9, 1.8545283936243788], [13.323051279269077, 6, 0.9362883386370496], [19.324980580557266, 9, 2.455568425560461],
  [21.926522968411618, 2, 1.8211663792042776], [9.871226229222511, 10, 2.759144904413639], [15.684457520855986, 9, 2.4881257076518586], [25.01175080675307, 9, 2.293952580186624], [27.28796610799946, 10, 2.5053374447259746],
  [11.12638804616336, 10, 3.4724617536161735], [12.459912376330706, 10, 2.5839805504113147], [24.796169977938295, 10, 3.1487140401135196], [27.15293735399132, 9, 2.426197412733331], [22.75814442724727, 9, 1.9768803220394664],
  [21.389591398967028, 2, 2.0437944904632297], [16.353350551427656, 10, 2.9931275514959403], [23.481544356140176, 2, 1.6329391851173671], [21.259999735877614, 11, 1.28184326161208], [12.512650810583759, 10, 2.97860202134202],
  [10.850187345212651, 9, 2.4333088771901816], [10.297851374541954, 11, 2.1066079013202077], [13.916743370870947, 10, 2.456612764071119], [15.142058626640917, 9, 2.034189930914453], [8.582783200339879, 10, 2.610456758694918],
  [18.77918071511817, 9, 2.9970276449365736], [19.279618474360515, 1, 2.9387460460594346], [9.622330767004879, 9, 1.8602281155886422], [16.473302991341875, 11, 1.2552868580167542], [13.02619155027896, 10, 2.669247499409358],
  [8.65066062737613, 10, 2.3301363839270137], [9.33837597433455, 11, 2.1384266741810674], [13.526435785195694, 9, 2.1325548151297333], [10.34420739875259, 9, 2.074196788508144], [22.28076360107601, 2, 1.8439800010934944],
  [17.90541555810633, 11, 2.1297645506535554], [6.820288021702332, 2, 1.4424216663701805], [27.391272273513763, 9, 2.0329513183341574], [13.274222402150418, 9, 2.554295895090472], [11.492452079153702, 6, 2.3755638869286315],
  [21.775087686955196, 10, 2.185009773092693], [21.482278287028095, 9, 3.587981001976402], [25.13231279852164, 2, 1.7881832799031492], [20.38567766246566, 2, 2.3004175106486415], [17.016814249665895, 2, 2.2902762744353935],
  [12.011832868274613, 10, 2.4291182356758836], [17.259667914752292, 9, 2.417763687692975], [21.887570463512738, 9, 2.2740007658257055], [9.49495334318207, 9, 3.118282162239224], [19.83075844262944, 6, 2.60562357907157],
  [11.750600441320369, 9, 2.008145139204897], [12.325651907263175, 11, 2.723691138070145], [25.200857013230912, 9, 1.8172688449834324], [13.45559861411855, 9, 2.4553738320961913], [26.442227456724467, 9, 2.0752598929670416],
  [7.466789819860046, 10, 2.232642022378435], [12.459456784945697, 10, 2.3320386847435026], [11.071234080629683, 9, 2.0455755002882787], [8.995808647605656, 0, 2.3383937670135806], [20.543101923835632, 10, 2.4896295610538877],
  [23.47922602889858, 9, 1.7801417371133363], [10.158358004630678, 6, 1.5088726112672726], [8.311794279190762, 9, 3.320551788231656], [23.52026510325321, 2, 2.080246729578814], [11.505211077202134, 9, 1.4835109806197415],
  [9.012927945358747, 9, 1.3039174223814682], [17.023779094257993, 6, 2.2444118318729114], [25.685874613009823, 1, 1.7438074826078702], [8.562603302181838, 9, 3.258321013454855], [9.387837108414196, 9, 2.127926228350274],
  [12.899628618489334, 9, 2.0538807604820435], [23.2869147682572, 2, 2.270888000155298], [6.900540948916382, 0, 2.3870683323190147], [19.87832366751131, 2, 1.9157265401172185], [24.698054306783234, 9, 1.1046198879644786],
  [8.949621996522673, 8, 1.4718006162709334], [11.057395219607262, 10, 2.697231727916448], [8.537741874571429, 2, 1.2159832058174407], [23.07273183994483, 9, 2.6261536302385857], [26.644682715437945, 2, 1.7241417634505707],
  [20.318868913968522, 1, 3.0958244408168722], [21.595850174339006, 2, 1.4235754462094785], [12.182015439376935, 10, 2.0930737996491313], [11.719428674629327, 11, 2.400644578504076], [23.245423289604357, 9, 1.7568007498384475],
  [28.483516328895995, 0, 2.4154675693412817], [27.47197623538505, 0, 2.5133639680331434], [25.854442952482785, 9, 1.6691391420212967], [19.709848789114876, 11, 2.102745726941454], [17.982830652932883, 9, 1.78674386635492],
  [7.976202850495536, 9, 2.5621848098801348], [7.5710466310552675, 10, 2.7790688267802954], [8.788085600440503, 9, 2.0019794091015135], [21.63435936873705, 0, 2.452094996381261], [5.309802451709681, 0, 1.629399953273412],
  [8.581072891262135, 9, 2.5270633606811654], [10.676830841089744, 9, 2.4509932544340196], [21.19595127103352, 9, 2.4675558091872203], [17.166074860481448, 9, 2.3294100946753256], [10.5917765363263, 10, 2.884386681319515],
  [9.915820505188695, 9, 1.68131118689897], [13.826068906199199, 10, 2.7008970036708897], [17.295121110055774, 8, 1.2990662157825075], [8.368603011008515, 8, 1.2179336122480027], [10.567769282946387, 9, 1.8371525675859015],
  [12.255659080318328, 9, 2.213154922540234], [20.444201359468565, 2, 1.7513662923727935], [20.275048436116833, 3, 2.2082361835137694], [10.29198287390856, 9, 1.9785719994161979], [23.55662081585559, 9, 2.287917005559504],
  [9.420662898018941, 5, 1.520703803477244], [14.453767791697357, 11, 1.170207154993557], [11.86410778192144, 8, 1.2692141724638373], [16.793092306924624, 9, 1.8507394691548702], [22.082442428536947, 9, 2.3718265150425535],
  [12.265516631434323, 5, 1.2764566710589633], [13.364815813694882, 11, 2.6169546895703037], [8.756338074855137, 10, 2.264845962123667], [12.480918666785744, 11, 1.327708787806598], [20.532921719336194, 10, 2.440580620884258],
  [8.665268631778547, 9, 1.1182512496937407], [7.944862928452878, 9, 1.4518729033853814], [13.983046111773936, 9, 1.1813256287811216], [24.916018731761582, 1, 2.1358728295339975], [24.324927681894884, 9, 1.7728344935070472],
  [14.004751214226133, 9, 2.439179729487286], [14.211434886587686, 10, 3.2340023732503185], [19.95008807523802, 1, 2.660829759804581], [12.363457228131704, 10, 2.249033367939388], [16.332815852440906, 10, 2.0940594085876],
  [16.749244172754484, 11, 2.224372445554555], [10.70777918685177, 9, 2.512113780503814], [8.490651134341649, 6, 1.3918967277497436], [10.662689329402165, 9, 1.0627399842169738], [13.459423360082205, 6, 1.2444135050429674],
  [9.501235059508328, 9, 2.3415335886255444], [11.331715065095153, 5, 1.4459507921358932], [17.150997616452333, 6, 2.7439281347557944], [21.842964754174325, 0, 2.3910408056166728], [24.57332448244209, 1, 2.3361050508952395],
  [14.283644847735905, 9, 2.505691090105199], [15.479878986952706, 9, 2.814107023995183], [26.04743565539524, 9, 2.6435092557277904], [18.76439206100602, 10, 2.2233983694281148], [17.517194919140287, 11, 1.3594326128214989],
  [20.02988108667585, 11, 1.4081185403598762], [8.41620069393522, 9, 1.0374007192251233], [19.963525098929335, 0, 2.1867706657419395], [20.64651748807064, 9, 2.3439034725473324], [17.849493468778228, 11, 1.45669244705923],
  [19.287126852075616, 10, 2.383603293715343], [23.965819345991775, 9, 2.601135706330836], [7.276275564059077, 9, 2.998594743768091], [16.777352572045604, 9, 1.1056496429599125], [11.865750169602634, 11, 2.385178890899085],
  [9.312046449965349, 2, 1.3608585134538889], [8.343787911260907, 10, 2.401670678767004], [11.152457398911256, 6, 2.1303516413507984], [19.27717233813174, 10, 3.0342469800865626], [16.22217982984458, 9, 1.8233323133440127],
  [21.161850024419593, 10, 1.4592600774815476], [11.719159377146674, 10, 3.3337365889253943], [10.159389129563785, 10, 3.095582260002218], [11.775378401445149, 3, 1.9712802029228282], [11.39458776349657, 9, 3.8099332543519093],
  [10.869647257938775, 11, 2.068482202982631], [18.79399329936131, 11, 1.4205342174396434], [23.755710543616516, 9, 1.8538533944800024], [21.09907949696033, 1, 2.550468358692326], [18.447304784546674, 11, 1.1420036993259137],
  [12.422688249721066, 10, 3.5478932824072236], [26.63623578815415, 9, 2.907029150145211], [6.645395959202736, 10, 2.4756246829888466], [12.420211172282752, 10, 2.5429812935309712], [26.985658192548534, 9, 1.720962269249916],
  [11.297926876155191, 6, 1.8793928040058838], [15.906487915635296, 6, 1.2722735355496617], [7.843760741822496, 9, 1.6567769701479362], [19.69203542523043, 2, 1.8134211022363165], [20.18010436021617, 10, 1.5805755200548701],
  [12.907475547860141, 10, 2.853596412599617], [27.24196679953272, 9, 2.0839515358641902], [8.265481996196817, 9, 1.477165615861393], [8.811482968510603, 10, 2.5349396810612967], [26.03427529772378, 10, 2.2864355269936114],
  [26.619677244249953, 1, 2.0254697210107544], [26.04989678711371, 10, 2.2942144830943283], [14.096207943412676, 9, 1.3466644653791047], [25.736277841899284, 10, 2.1669559450415483], [10.767950609277722, 9, 3.0691965732907858],
  [19.368937224380367, 10, 2.185599636695756], [17.893947182228914, 9, 2.4761095099786554], [16.375080610760385, 9, 3.1963894921241076], [26.021541472999505, 10, 1.8825058500043121], [9.666820174797824, 6, 1.4495837858124805],
  [18.73064757699742, 9, 2.6055217225880374], [11.552748144142683, 9, 1.8285667534135883], [7.3765478444759465, 6, 1.4370722953130348], [26.457034795336273, 9, 1.2129740152464752], [14.403994429324554, 11, 2.3773139780445436],
  [19.17271844524388, 10, 3.1192048747499443], [9.154804257838856, 10, 2.286352836187439], [18.66430793000946, 9, 2.3148044477877323], [8.477499927992614, 3, 2.2385873395247526], [22.507983775806935, 0, 2.2649642976813635],
  [17.737873250731617, 10, 2.4152093055774992], [9.063707625263469, 9, 2.3024194585705646], [28.351641865348196, 2, 1.760576796561321], [22.00350954478521, 9, 1.9494544186667169], [23.367802822134607, 1, 2.3181306047045376],
  [6.649014581801914, 2, 1.418631705677516], [9.949897548877155, 9, 2.563626901039355], [18.909016154201616, 9, 2.4910010414621233], [14.360823671777652, 9, 2.3180513327295738], [19.034844642935067, 9, 1.2753998807550333],
  [28.476545448663792, 2, 1.9109654266375196], [8.907328739501626, 5, 1.3981125721872945], [17.144714019890703, 10, 2.902909037788206], [18.87493169526045, 11, 2.146154143695272], [26.18843088053006, 10, 3.077516812719536],
  [16.460977167227114, 9, 1.6146509560087525], [9.696405205543783, 10, 2.3134977290895216], [17.996844157061975, 9, 2.5141289406108], [12.044781878473021, 9, 2.03053164129423], [18.27743426213538, 8, 1.6319133401432395],
  [26.371882335615183, 9, 1.0153751327812048], [28.171081288269367, 9, 1.7393541775985015], [8.418991652686332, 10, 2.540618773838961], [14.074138908516748, 9, 1.070309926840353], [9.223745824424974, 9, 1.9438216581920316],
  [19.887784190697005, 11, 1.9301182334508813], [9.13075136182629, 9, 2.851463394367205], [12.523524591051231, 10, 3.248992327979177], [14.903635910367719, 9, 2.0918804361494074], [8.33057445045373, 10, 2.222308352848003],
  [13.284343172121915, 9, 2.195914502164589], [6.174310964491427, 7, 2.8024387270646423], [10.98833511980019, 9, 2.532025155144019], [19.00209988520359, 9, 2.9760500311342444], [14.363598754994117, 10, 3.58357800645936],
  [16.05235615955051, 3, 1.7251806645860617], [9.984408219155803, 10, 2.2755637989007393], [11.37267713797689, 11, 2.2946595289496083], [8.711124074452913, 10, 2.591124278611973], [25.707833194181728, 9, 1.478671897074156],
  [16.706806585090064, 10, 2.317417350435008], [8.233321837586619, 10, 2.5042350516902716], [18.386975752145716, 9, 2.340912608892613], [13.418958554155552, 9, 3.027443958564477], [10.409434243814204, 11, 2.5296337300402088],
  [11.178042460946092, 9, 1.7463188446871851], [7.467695173937339, 10, 3.264547461583237], [8.819133965146598, 10, 2.403858665328036], [13.870707057234968, 11, 2.885511797240494], [16.26562433304722, 11, 1.423296651135479],
  [9.26601511948187, 9, 1.9256211673706287], [14.219155522261442, 9, 2.0448391172163327], [19.961606279318175, 9, 0.9330722043757667], [8.148045368251017, 10, 2.5255297123245675], [13.526140064403453, 10, 2.6354121241268045],
  [23.489498488558212, 11, 2.111064634709624], [6.601783285384858, 3, 2.284644038875015], [10.00576579089305, 9, 2.124251601558907], [16.111008549627954, 9, 2.128409462304976], [16.769769033373738, 9, 2.041673841651358],
  [9.397630033757277, 10, 3.0145433597130524], [8.0174039734234, 11, 2.5995046292612947], [8.431126685396293, 11, 2.280977761199948], [10.065627456372187, 9, 3.3742484762700933], [22.449016461943774, 9, 2.6153284357100026],
  [21.543931190928106, 2, 1.8496495271403042], [8.949989786001062, 3, 2.5869219882437786], [26.298244307625545, 9, 2.472018431899949], [24.12606959476473, 9, 2.62132206953275], [26.738780453930808, 1, 2.5962187079692707],
  [10.653465855676217, 10, 2.8378867916804165], [24.78861193850414, 0, 1.7571290292205917], [15.340519373243016, 9, 1.6995062637418075], [27.18945603198863, 9, 2.4253633387049365], [8.943144547542486, 10, 2.7034185926644625],
  [18.08397242187059, 9, 3.3025950260255605], [26.718965460589153, 9, 1.5714027169280247], [6.7657369170490185, 3, 2.315972353253801], [21.505930984269806, 1, 2.3050961373813235], [15.883746683764985, 11, 2.2041171751938053],
  [13.498931975805569, 9, 3.496772876855438], [11.885785166630376, 11, 2.6861199854386197], [19.667994835364617, 11, 2.4176335855716258], [25.256790909467718, 10, 2.237876317060288], [12.187582631723718, 9, 1.8816140409531805],
  [23.285184006558303, 9, 2.382962067403573], [18.542657914275154, 9, 2.1101456590389125], [8.584452650823184, 9, 1.9609196149170773], [14.17080439303894, 9, 2.7106479450957264], [10.320251509535563, 9, 2.3196730355993744],
];

// THE EARTH ON ITS WAY from the chute to the heap. (Every count here is dealt by the fixed generator: the same on every seed.)
const BELT_BED = [{ w: BED0_W, h: 1.25, n: 400, more: 70 }, { w: 0.98, h: 0.98, n: 130, more: 0 }, { w: 0.98, h: 0.92, n: 84, more: 0 }];   // each belt's bed of fines (half width, height in the middle), its count of lumps, and the count of great clods more (round three: dealt by a generator of their own, after the others)
const N_CHUTE = 60, N_SPOUT = 190, N_SPOUT_MORE = 90;
// (the shaders' smoothstep, in JS: the boom's belt's bed has none of its swell at the belt's two ends, by the same figures as the motion law's kind 4)
const sstep =(a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export async function buildBelts(E, rng, rest = async () => {}) {
  const rng2 = fixedRng(20261012);                            // (round three's own deals: what was dealt before keeps its place)
  // on each belt A CLOSED BED OF FINES, heaped in the middle of the trough (its drawing runs with the belt: EARTH_SURFACE), and
  // on it the lumps that ride (kind 4): a few great clods, many small, the great ones toward the middle. THE BOOM'S BELT'S
  // bed is a heaped ribbon standing 1.25 m over the belt, cut every 0.9 m or so, each corner of its crown and shoulders
  // marked to swell with the heap's unevenness as that rides by (kind 8); the lumps on it ride the same swell
  for (let id = 0; id < BELTS.length; id++) { const B = BELTS[id];
    const { w, h, n, more } = BELT_BED[id], prof = [[-w, 0.07], [-0.55 * w, 0.72 * h], [0, h], [0.55 * w, 0.72 * h], [w, 0.07]];
    const at = (s, i, k) => [B.s[0] + B.d[0] * s, B.s[1] + B.d[1] * s + prof[i][1] * k, ZC + prof[i][0] * (0.55 + 0.45 * k)];
    const cuts = [[0, 0.05], [1.3, 1]], nc = id === 0 ? Math.round((B.L - 2.6) / 0.9) : 1; for (let c = 1; c <= nc; c++) cuts.push([1.3 + (B.L - 2.6) * c / nc, 1]); cuts.push([B.L, 0.05]);
    const swell = (s, i) => (i % 4 ? [8, s, BED_SWELL * (1 - Math.abs(prof[i][0]) / w) * sstep(0, 2.5, s) * (1 - sstep(B.L - 2.5, B.L, s)), 0] : STILL);   // a corner's mark on the boom's belt: its edges stand
    const bedY = (dz) => { const a = Math.abs(dz) / w; return a < 0.55 ? h * (1 - 0.28 * a / 0.55) : 0.07 + (0.72 * h - 0.07) * (1 - a) / 0.45; };   // the bed's own top across the belt
    for (let c = 0; c < cuts.length - 1; c++) for (let i = 0; i < 4; i++) { const col = cls(damp(id === 0 ? rng2.range(0.9, 1.12) : 1.12), K_RIDE), n0 = E.n;
      E.quad(at(cuts[c][0], i, cuts[c][1]), at(cuts[c][0], i + 1, cuts[c][1]), at(cuts[c + 1][0], i + 1, cuts[c + 1][1]), at(cuts[c + 1][0], i, cuts[c + 1][1]), col);
      if (id === 0) [[c, i], [c, i + 1], [c + 1, i + 1], [c, i], [c + 1, i + 1], [c + 1, i]].forEach(([cc, ii], k) => { const m = swell(cuts[cc][0], ii); for (let q = 0; q < 4; q++) E.M[(n0 + k) * 4 + q] = m[q]; }); }   // (each corner of the quad's two triangles takes its own mark: the corners are written in this order)
    for (let j = 0; j < n + more; j++) { const g = j < n ? rng : rng2;
      const big = j >= n ? g() < 0.6 : g() < 0.07, r = big ? g.range(0.42, 0.62) : 0.13 + 0.26 * g() ** 1.7, s = g() * B.L, dz = g.range(-1, 1) * (big ? 0.35 : 0.8) * w;
      const c = [B.s[0] + B.d[0] * s, B.s[1] + B.d[1] * s + bedY(dz) + r * 0.15, ZC + dz];
      E.lump(c, r, g, freshTone(g), [4, id, 0, 0], [c[0], c[1], c[2], 0]);
      if (j % 80 === 79) await rest();
    }
  }
  await rest();
  // down the chute (kind 5): from the tipping buckets' ports (100 to 140 degrees round the wheel) to the boom's belt
  for (let j = 0; j < N_CHUTE; j++) {
    const th = rng.range(1.745, 2.443), r = 0.18 + 0.3 * rng() ** 1.5, T = rng.range(1.0, 1.4), c = [WHEEL.x + 8.45 * Math.cos(th), WHEEL.y + 8.45 * Math.sin(th), -BW - 0.25];
    E.lump(c, r, rng, freshTone(rng), [5, T * rng.range(1.0, 1.4), rng(), T], [c[0], c[1], c[2], ZC + rng.range(-0.8, 0.8)]);
  }
  // off the spout's lip (kind 6): each leaves it level at 0.42 of the belt's speed (SPOUT_V) and falls until it meets the heap
  // (round three: N_SPOUT_MORE great clods more, 0.3 to 0.7 m, dealt by their own generator after the others)
  for (let j = 0; j < N_SPOUT + N_SPOUT_MORE; j++) { const g = j < N_SPOUT ? rng : rng2;
    const r = j < N_SPOUT ? 0.24 + 0.36 * g() ** 1.5 : 0.3 + 0.4 * g() ** 1.3, q = SP_TOP(SPOUT_LEN + 0.15 + 0.9 * g(), 0.15 + r * 0.6 + 0.5 * g()), b = [q[0], q[1], ZC + g.range(-0.7, 0.7)], vz = g.range(-0.35, 0.35);
    const over = (t) => b[1] + SPOUT_V[1] * t - G_ / 2 * t * t > heapTop(b[0] + SPOUT_V[0] * t, b[2] + vz * t) + 0.15;
    let Tl = 0.2; while (Tl < 3 && over(Tl)) Tl += 0.005;
    for (let lo = Tl - 0.005, k = 0; k < 20; k++) { const m = (lo + Tl) / 2; if (over(m)) lo = m; else Tl = m; }   // (the landing found to a hair: the lump's run begins at the height its fall ends at, with no step up)
    E.lump(b, r, g, freshTone(g), [6, Tl + 2.0 + g.range(1.3, 1.9), g(), Tl], [b[0], b[1], b[2], vz]);
    if (j % 60 === 59) await rest();
  }
  // THE STREAM OF FINES from the spout's lip to the heap: a closed body of damp earth along the way the lumps fall (out
  // over the head drum level at SPOUT_V, then down under gravity), a round a metre across, its lower end sunk in the
  // heap. Nine rings of six corners, each ring square to the fall there; every corner marked with the seconds of fall
  // at its ring and the ring's middle (kind 9: the stream's unevenness falls through the rings). No dust: a body.
  { const q0 = SP_TOP(SPOUT_LEN + 0.35, 0.4), ctr = (t) => [q0[0] + SPOUT_V[0] * t, q0[1] - G_ / 2 * t * t, ZC]; let te = 0.3; while (te < 3 && ctr(te)[1] > heapTop(ctr(te)[0], ZC) - 0.5) te += 0.01;
    const NR = 8, rings = [];
    for (let i = 0; i <= NR; i++) { const t = te * Math.sqrt(i / NR), c = ctr(t), vx = SPOUT_V[0], vy = -G_ * t, vl = Math.hypot(vx, vy), e = [-vy / vl, vx / vl], a = 0.46 + 0.08 * t, b = 0.72;
      rings.push(Array.from({ length: 6 }, (_, k) => { const th = (k + 0.5 * (i % 2)) / 6 * Math.PI * 2, j = rng2.range(0.85, 1.15); return { p: [c[0] + e[0] * a * Math.cos(th) * j, c[1] + e[1] * a * Math.cos(th) * j, c[2] + b * Math.sin(th) * j], m: [9, t, 0, 0], a: [c[0], c[1], c[2], 1] }; })); }
    const tri = (A, B, Cc) => { const n0 = E.n; E.tri(A.p, B.p, Cc.p, cls(damp(rng2.range(0.78, 1.0)), K_POUR)); [A, B, Cc].forEach((v, k) => { for (let q = 0; q < 4; q++) { E.M[(n0 + k) * 4 + q] = v.m[q]; E.A[(n0 + k) * 4 + q] = v.a[q]; } }); };
    for (let i = 0; i < NR; i++) for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6, A = rings[i][k], B = rings[i][k1], Cc = rings[i + 1][k1], D = rings[i + 1][k]; tri(A, B, Cc); tri(A, Cc, D); }
    const top = { p: ctr(0), m: [9, 0, 0, 0], a: [...ctr(0), 1] }; for (let k = 0; k < 6; k++) tri(top, rings[0][k], rings[0][(k + 1) % 6]);
  }
}

// THE HEAP under the spout: a faceted mound (heapTop: the core's HEAP, 14 m high, 26 m across, its middle at (-112, -5)),
// every corner a little off its place, every face its own tone; dried pale on its old sides, damp and dark where the fresh
// earth comes down: its top, and a fan down its east side, under the spout, widening to the toe; lumps of many sizes lying all over it, the great clods at
// its toe. (The spout's lumps run down from where they land, east of the top: the motion law, kind 6.)
const N_HEAPLUMPS = 560;
const heapFresh = (x, z) => { const dx = x - HEAP.x, dz = z - HEAP.z, q = Math.hypot(dx, dz) / HEAP.R, da = Math.abs(Math.atan2(dz, dx));
  return Math.max(1 - q / 0.22, Math.min(1, Math.max(0, (0.45 + 0.5 * q - da) / 0.3)) * (1 - 0.5 * q * q)); };
export async function buildHeap(E, rng, rest = async () => {}) {
  const HX = HEAP.x, HZ = HEAP.z, HR = HEAP.R, RINGS = 12, SEGS = 44, ring = [];
  for (let i = 0; i <= RINGS; i++) { const row = [], q = i / RINGS; for (let s = 0; s < SEGS; s++) { const a = (s + 0.5 * (i % 2)) / SEGS * 6.2832, r = HR * q * (i === RINGS ? 1.04 : rng.range(0.95, 1.05)), x = HX + Math.cos(a) * r, z = HZ + Math.sin(a) * r;
      row.push([x, i === RINGS ? 0 : Math.max(0.05, heapTop(x, z) + (i ? rng.range(-0.3, 0.3) : 0)), z]); } ring.push(row); }
  const tone = (a, b, c) => { const k = Math.min(1, Math.max(0, heapFresh((a[0] + b[0] + c[0]) / 3, (a[2] + b[2] + c[2]) / 3))), t = rng.range(0.86, 1.1);
    return cls([(DRY[0] + (DAMP[0] * 0.88 - DRY[0]) * k) * t, (DRY[1] + (DAMP[1] * 0.88 - DRY[1]) * k) * t, (DRY[2] + (DAMP[2] * 0.88 - DRY[2]) * k) * t], K_HEAP); };
  for (let i = 0; i < RINGS; i++) for (let s = 0; s < SEGS; s++) { const s1 = (s + 1) % SEGS, a = ring[i][s], b = ring[i][s1], c = ring[i + 1][s1], d = ring[i + 1][s]; if (i) E.tri(a, b, c, tone(a, b, c)); E.tri(a, c, d, tone(a, c, d)); }       // (the innermost row is the mound's one top point)
  await rest();
  for (let j = 0; j < N_HEAPLUMPS; j++) {
    const a = rng() * 6.283, q = Math.pow(rng(), 0.6), big = q > 0.72 && rng() < 0.22, r = big ? rng.range(0.5, 1.0) : 0.12 + 0.33 * rng() ** 1.8;
    const x = HX + Math.cos(a) * HR * q * 1.02, z = HZ + Math.sin(a) * HR * q * 1.02, k = Math.min(1, Math.max(0, heapFresh(x, z)));
    lie(E, [x, heapTop(x, z) + r * 0.1, z], r, rng, [DRY[0] + (DAMP[0] - DRY[0]) * k, DRY[1] + (DAMP[1] - DRY[1]) * k, DRY[2] + (DAMP[2] - DRY[2]) * k]);
    if (j % 80 === 79) await rest();
  }
}
