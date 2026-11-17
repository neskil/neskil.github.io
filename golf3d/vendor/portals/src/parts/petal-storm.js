// THE WEEPING CHERRY AND THE GUST THAT LIFTS ITS FALLEN PETALS: hero set piece for "petal-storm" (Thousand-Tree Mountain).
//
// NOTHING IS STRIPPED (rebuilt). When the gust clock runs the curtain swings up and streams down the wind like hair, whole,
// and eases back to a steady stream; no blossom leaves a strand and no whip is bared. What flies is LAST WEEK'S FALL: half
// of the petals lie on the moss in windrows (attribute iG), and the gust lifts them, windward drifts first, into four braided
// bands that wind slowly up round the crown as a helix and lean away down the wind above it, while the moss under the tree
// clears from pink to green. The rest of the petals stay in the curtain; a few fall in still air. Read the older text below
// with that in mind: "strip" now means "lift". The curtain also hangs in TIERS (shaded and ragged-hemmed bands that wander
// round the tree) so that from far off it reads as a weeping tree of layered cascades and not as a smooth dome. Strands,
// blossoms and petals carry real bounding spheres and are frustum culled; hero.parts = { strands, blossoms, petals } are the
// meshes, for a world that wants to hide the true blossoms where they are under a pixel. hero.liftAmount() is 0..1.
//
// A thousand-year beni-shidare weeping cherry modelled on the Miharu Takizakura, scaled up by half:
// a fluted, moss-backed trunk 3 m thick, gnarled scaffold limbs arching to a dome 20 m tall and 30 m
// across, and 1,650 hanging strands 4-14 m long that fall like a pink waterfall to within a metre of
// the moss. Beside the camera corridor the strands carry true five-petalled blossoms with dark hearts;
// 44,000 loose petals sit in the curtain. When the gust clock runs, the curtain swings up and streams
// downwind like hair, strips from windward to leeward in three seconds to bare dark whips, and the
// petals pour away up the slope in braided streams.
//
// FORM (rebuilt)  the skirt hangs in 26 separate hanks with dark gaps between them and hems at unequal heights (the east
// wall beside the corridor stays close-hung); a cap of short strands rounds the top; a lintel and two jambs of strands
// make the way out one narrow slot on the corridor's axis; a great mossy low limb sweeps north beside the corridor and
// a window is kept clear of strands in front of it, so from under the crown it closes the left of the view. Strands and
// held petals are shaded as one dome (uniform uSunL, the sun in tree space: lit top and sunward side, shaded underside
// and lee) and, by moonlight (uRim), take a silver rim. Far off the strands thin instead of closing into a slab.
//
// FORM (second rebuild)  the curtain stands OPEN in two places so the tree reads as a tree from far off: to the south (the
// entry) it is drawn up like a drape, eleven metres high over the trunk, falling to head height at the western hanks and
// to the lintel over the corridor, so that trunk, roots and the fan of limbs stand in a hall of blossom; a narrower arch
// opens north-west toward the homeward leg. Six great roots run out across the moss (wood near the trunk, mossed ridges
// beyond); the moss is hummocked, and the fallen petals lie in windrows in the lee of roots and stones and along the hem,
// not as an even sprinkle. hero.moundAt(x, z) gives the moss height in local space, for things the world sets on it.
//
// ORIENTATION  origin = centre of the trunk at moss level (y = 0), +Y up.
//              +Z = SOUTH = the front: the entry view looks along -Z at the dome from 180 m.
//              +X = EAST = the stream and the morning sun. The first pass runs under the crown along
//              x = +8 heading -Z (trunk on the camera's left, lit curtain on its right). The second pass
//              is at x = -22, y = 20 heading +Z. The gust blows toward anchors.windDir (south-west and
//              up the slope: -X, +Z, +Y). Rotate hero.object about Y to suit the world; do not scale it.
// SIZE         radius 16 m, height 20 m. The moss mound reaches 19 m out and sinks 1.2 m below y = 0 at
//              its rim so it can be bedded into a terrace (opts.base = false leaves it out).
//              The stripped petals travel ~170 m along windDir before they fade.
// COST         ~134k triangles, 5 draw calls (limbs+roots ~19k, mound+stones ~4k, strands 23k,
//              blossoms 7,000 x 6 = 42k, petals 44k x 1), one 512x1024 canvas texture, no lights,
//              no render targets, build about 200-300 ms.
//
// DRIVING IT   hero.setProgress(u)   every frame with the world's u. The gust clock (seconds) is
//                                    3 * (u - opts.uHit) / (opts.uEnd - opts.uHit): defaults 0.66 and 0.72
//                                    as in the brief, so the curtain starts to lift at u 0.63, the first
//                                    blossoms leave at u 0.66 and the crown is bare by u 0.72; the petal
//                                    cloud keeps flying on u afterwards. At u = 0 the tree is calm.
//              hero.setGust(sec)     the same clock directly (< -1.5 calm, -1.5..0.7 lifting, 0..3
//                                    stripping, then bare whips streaming and the cloud leaving);
//                                    null hands control back to the demo.
//              hero.setWind(v3)      direction the gust blows toward, in the hero's local space.
//              hero.setSun(gain)     multiplier on the direct sun of every material here (cloud shadows).
//              hero.clock() / hero.stripAmount()   read-backs (seconds, 0..1) for POIs and other effects.
//              Until setProgress/setGust is called a 30 s demo loop runs on wall time (calm for 16 s,
//              the gust at 16.5, strip 18-21, bare and streaming to 30) so the part viewer shows it.
//
// OPTS         palette  7 hex strings in brief order [pale, shell pink, deep rose, copper, cedar, jade, sky]
//              hour     'morning' (default) | 'dawn' (cooler, paler) | 'afternoon' (gold through-light)
//                       | 'moon' (silver blossom, no warm light)
//              season   'peak' (default) | 'early' (deeper rose, in bud, nothing shed) | 'late' (half the
//                       blossom already gone, bare whips showing, litter thick on the moss)
//              weather  'clear' (default) | 'haze' (hanagumori: less through-light) | 'snow' (a dusting
//                       on limbs, stones and moss)
//              density  1: scales petals and true blossoms (also scaled by ctx.quality.detail)
//              strands 1650, blossoms 7000, petals 44000, base true, windDir [x,y,z], uHit 0.66, uEnd 0.72,
//              speed 19 (m/s of the petal cloud), demo true
//
// ANCHORS (local space; Vector3 unless noted)
//   trunkBase, crownCentre, crownTop
//   flyThrough      ordered points of the first pass: under the crown along x = +8 at y = 2.5, heading
//                   -Z. Every limb is at least 6 m from this line (trunk bark 6.2 m); only strands and
//                   blossoms come nearer: none hangs below y = 5.6 within 1.5 m of the line, so the lens
//                   runs down a parting with the curtain 1.5-7 m to its right.
//   partingIn, partingOut   where that line crosses the curtain ring
//   secondPass      ordered points of the pass from above: x = -22, y = 20, heading +Z (22 m west of
//                   the trunk, level with the crown top). Lifted strands stay below y = 16 there.
//   viewpoints      { entry, under, above, strip }: each { position, target }
//   windDir         unit vector the gust blows toward; windward = its horizontal reverse
//   flockStart      a point in the lit curtain 5 m ahead-right of the corridor for the white-eyes
//   portalSeat      { position, facing }: ADVISORY. The ring belongs on the world's saddle; this is
//                   the point 215 m down windDir where the petal cloud is aimed, facing back at the tree.
//   petalCloud      { origin, dir, speed, life }: where the stripped petals go, to hand over to the
//                   world's own petal streams
//   clearance       number: 6 (metres kept from flyThrough by everything solid)
//
// LIGHTING     Custom ShaderMaterials with lights: true: they use the scene's FIRST DirectionalLight as
//              the sun and the first HemisphereLight plus AmbientLight as fill, and scene fog. Wants a
//              warm white key (#FFF1DC, intensity ~3) from +X (the side) about 30 degrees up and a cool
//              blue-green fill (hemisphere ~0.8-1). Petals are thin and translucent: seen toward the sun
//              they glow (HDR up to ~1.6, gentle bloom); nothing is emissive. The mound fakes the crown's
//              shadow, offset along the sun, and lets it go as the tree strips.
// STYLE        naturalistic, linear HDR; no special art style.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEF_PALETTE = ['#F6E6E8', '#F2B8C6', '#D4567A', '#A8553A', '#1F3B30', '#5FA08C', '#BCD3E0'];
const CROWN_R = 15, CROWN_H = 20, FLY_X = 8, FLY_Y = 2.5, CLEAR = 6.3;
const TILE = 3.2;                       // metres of strand covered by one atlas tile

const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const lightU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.lights);

// ---------- shared GLSL ----------
// scene lights (fragment); directions are in view space
export const GLSL_LIGHT = /* glsl */`
  #include <common>
  #include <lights_pars_begin>
  uniform float uSunGain, uAmbGain;
  vec3 psSunDir(){
    #if NUM_DIR_LIGHTS > 0
      return directionalLights[0].direction;
    #else
      return vec3(0.0, 1.0, 0.0);
    #endif
  }
  vec3 psSunCol(){
    #if NUM_DIR_LIGHTS > 0
      return directionalLights[0].color*uSunGain;
    #else
      return vec3(0.0);
    #endif
  }
  vec3 psAmb(vec3 n){
    vec3 irr = ambientLightColor;
    #if NUM_HEMI_LIGHTS > 0
      irr += getHemisphereLightIrradiance(hemisphereLights[0], n);
    #endif
    return irr*uAmbGain;
  }
  float psHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
  float psNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
    return mix(mix(psHash(i), psHash(i + vec2(1.0, 0.0)), f.x), mix(psHash(i + vec2(0.0, 1.0)), psHash(i + vec2(1.0, 1.0)), f.x), f.y); }
  // a thin translucent petal. alb albedo, n view-space normal turned to the viewer, vd unit eye-to-fragment,
  // trB light through the back of the petal, trS glow when looking toward the sun, shade 0..1 sun reaching it
  vec3 psPetal(vec3 alb, vec3 n, vec3 vd, float trB, float trS, float shade){
    vec3 L = psSunDir(); float nl = dot(n, L);
    float front = max(nl, 0.0), back = max(-nl, 0.0);
    float toSun = max(dot(vd, L), 0.0);
    vec3 through = alb*vec3(1.05, 0.62, 0.74);
    vec3 sun = psSunCol()*shade;
    vec3 c = alb*RECIPROCAL_PI*(sun*(front*0.85 + 0.12) + psAmb(n));
    c += through*RECIPROCAL_PI*sun*(trB*back + trS*toSun*toSun);
    return c;
  }
`;

// the strand: a pendulum chain hung from a limb (vertex). Shared by ribbons, blossoms and petals so
// that everything on a strand moves as one.
//   A = (anchor xyz, length L)   B = (outward azimuth, arch length La, phase, release order 0 windward..1 leeward)
const GLSL_STRAND = /* glsl */`
  uniform float uTime, uClock;
  uniform vec3 uWindH;                 // x, z: unit horizontal wind; y: rise per metre travelled
  // swung out like hair, then easing to a steady stream: nothing is torn off. (0.62: the curtain leans and flies but the crown keeps
  // its dome and its tiers, so from the pass above it is still a tree and not a sheet of streaks)
  float psLift(float rel, float clock){ float c = clock - rel*1.4; return 0.62*smoothstep(-1.5, 0.7, c)*(1.0 - 0.36*smoothstep(3.2, 8.0, c)); }
  float psTb(float rel, float t, float id){ return rel*2.1 + (1.0 - t)*0.45 + id*0.5; }
  // THE GUST STRIPS THE WINDWARD HALF (uStrip 0..1.2 runs with the gust clock; 0 = nothing is taken). A strand's share of
  // blossom gone: the most windward go first and go bare, the middle of the crown is thinned, the lee half keeps everything.
  uniform float uStrip;
  float psStripLim(float rel){ return 0.94*smoothstep(0.64, 0.3, rel); }
  float psStrip(float rel){ return clamp((uStrip - rel*0.9)/0.35, 0.0, 1.0)*psStripLim(rel); }
  vec3 psStrand(vec4 A, vec4 B, float t, float la, float swayK, float tm){
    float L = A.w, La = max(B.y, 0.2), s = t*L;
    vec2 o = vec2(sin(B.x), cos(B.x));
    float e = exp(-s/La);
    float xo = 0.9*La*(1.0 - e);                       // the twig arches outward ...
    float bump = (1.2 + 1.8*fract(B.z*3.17))*s*exp(-s/(0.7*La));   // ... and up before it falls
    float sig = s - La*(1.0 - e);                      // hanging length so far
    float sigL = max(L - La*(1.0 - exp(-L/La)), 0.5);  // whole hanging length
    float pulse = 0.11*sin(tm*2.3 + B.z) + 0.06*sin(tm*5.1 + B.z*3.0);
    float th = la*(0.86 + 0.6*fract(B.z*7.31) + pulse);
    float th0 = th*0.40, th1 = max(th*0.85/sigL, 1e-4);
    float hx = (cos(th0) - cos(th0 + th1*sig))/th1;    // the chain integrated along a turning angle:
    float hy = -(sin(th0 + th1*sig) - sin(th0))/th1;   // hx downwind, hy down
    vec3 p = A.xyz + vec3(o.x*xo, bump, o.y*xo);
    p += vec3(uWindH.x*hx, hy + uWindH.y*hx, uWindH.z*hx);
    float w = 3.2*inversesqrt(max(L, 1.0));
    float tt = t*sqrt(max(t, 0.0));
    float gst = 1.0 + 0.7*sin(tm*0.31 + A.x*0.15 + A.z*0.11);
    vec2 sw = o*sin(tm*w + B.z + 2.2*t) + vec2(-o.y, o.x)*0.6*sin(tm*w*1.31 + B.z*1.7 + 1.4*t);
    p.xz += sw*tt*(0.07 + 0.009*L)*gst*swayK*(1.0 - 0.7*la);
    vec2 sd = vec2(-uWindH.z, uWindH.x);
    float fl = la*t*swayK;
    p.xz += sd*fl*(0.5*sin(tm*6.3 - s*0.9 + B.z) + 0.24*sin(tm*11.0 - s*2.1 + B.z*1.7));
    p.y += fl*0.4*sin(tm*8.1 - s*1.2 + B.z*2.0);
    return p;
  }
`;

// the petal outline shared by true blossoms and loose petals (fragment): q.x across, q.y from claw (0) to tip (1.1)
export const GLSL_SHAPE = /* glsl */`
  float psPetalMask(vec2 q){
    float tp = 0.55 + 0.45*clamp(q.y, 0.0, 1.0);
    float d = (q.x*q.x)/(0.1444*tp*tp) + (q.y - 0.58)*(q.y - 0.58)/0.25;
    float notch = length(vec2(q.x, q.y - 1.1));
    return (d > 1.0 || notch < 0.12) ? 0.0 : 1.0;
  }
`;

// ---------- small helpers ----------
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function lin(hex, k = 1) { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); }
function mixV(a, b, t) { return new THREE.Vector3().copy(a).lerp(b, t); }
// distance from (x,y,z) to the corridor line x = FLY_X, y = FLY_Y, |z| <= 26
function flyDist(x, y, z) {
  const dz = Math.max(0, Math.abs(z) - 26);
  return Math.hypot(x - FLY_X, y - FLY_Y, dz);
}
// push a limb point of radius r out of the corridor
function pushClear(p, r) {
  const d = flyDist(p.x, p.y, p.z), need = CLEAR + r;
  if (d >= need) return;
  let dx = p.x - FLY_X, dy = p.y - FLY_Y; const l = Math.hypot(dx, dy);
  if (l < 1e-3) { dx = 0; dy = 1; } else { dx /= l; dy /= l; }
  if (dy < 0.35) { dy = 0.35; const k = Math.sqrt(1 - dy * dy) * Math.sign(dx || 1); dx = k; }   // never push into the ground
  p.x = FLY_X + dx * need; p.y = FLY_Y + dy * need;
}
// keep a point inside the dome
function domeClamp(p) {
  if (p.y > CROWN_H - 0.7) p.y = CROWN_H - 0.7;
  const rmax = (CROWN_R - 0.4) * Math.sqrt(Math.max(0.05, 1 - (p.y / (CROWN_H + 0.5)) ** 2));     // a true dome: the top is round, not a table
  const r = Math.hypot(p.x, p.z);
  if (r > rmax) { p.x *= rmax / r; p.z *= rmax / r; }
}

// ---------- the wood: lofted, fluted tubes ----------
function makeBuf(maxV, maxI) {
  return { pos: new Float32Array(maxV * 3), nor: new Float32Array(maxV * 3), col: new Float32Array(maxV * 3), uv: new Float32Array(maxV * 2),
    idx: new Uint32Array(maxI), nv: 0, ni: 0, maxV, maxI };
}
const _t = V3(0, 0, 0), _n = V3(0, 0, 0), _b = V3(0, 0, 0), _q = V3(0, 0, 0);
// P: centre line (Vector3[]), R: radius at each point. o: { flute, k1, k2, twist, phase, bump, noise, moss, ao }
function addTube(B, P, R, sides, o = {}) {
  const n = P.length; if (n < 2 || B.nv + n * (sides + 1) > B.maxV || B.ni + (n - 1) * sides * 6 > B.maxI) return;
  const flute = o.flute ?? 0, k1 = o.k1 ?? 5, k2 = o.k2 ?? 8, twist = o.twist ?? 0, ph = o.phase ?? 0, bump = o.bump ?? 0, noise = o.noise;
  const moss = o.moss ?? 0, ao = o.ao ?? 1, base = B.nv;
  let v = 0, havePrev = false; const N = V3(1, 0, 0);
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(i - 1, 0)], c = P[Math.min(i + 1, n - 1)], p = P[i];
    _t.subVectors(c, a); if (_t.lengthSq() < 1e-10) _t.set(0, 1, 0); _t.normalize();
    if (!havePrev) { N.set(0, 0, 1); if (Math.abs(_t.z) > 0.9) N.set(1, 0, 0); havePrev = true; }
    N.addScaledVector(_t, -N.dot(_t)); if (N.lengthSq() < 1e-8) N.set(_t.y, -_t.x, 0); N.normalize();
    _b.crossVectors(_t, N);
    if (i > 0) v += p.distanceTo(P[i - 1]);
    const rad = R[i];
    const fr = (th) => {
      let f = 1 + flute * (0.6 * Math.sin(k1 * th + twist * v + ph) + 0.4 * Math.sin(k2 * th - twist * 0.6 * v + ph * 2.3));
      if (bump && noise) {
        const cx = Math.cos(th), sx = Math.sin(th);
        f += bump * noise.n3((p.x + (N.x * cx + _b.x * sx) * rad) * 0.9, (p.y + (N.y * cx + _b.y * sx) * rad) * 0.7, (p.z + (N.z * cx + _b.z * sx) * rad) * 0.9);
      }
      return f;
    };
    for (let j = 0; j <= sides; j++) {
      const th = (j / sides) * Math.PI * 2, cx = Math.cos(th), sx = Math.sin(th);
      const rr = rad * fr(th), dr = rad * (fr(th + 0.06) - fr(th - 0.06)) / 0.12;
      const rx = N.x * cx + _b.x * sx, ry = N.y * cx + _b.y * sx, rz = N.z * cx + _b.z * sx;
      const tx = -N.x * sx + _b.x * cx, ty = -N.y * sx + _b.y * cx, tz = -N.z * sx + _b.z * cx;
      const k = B.nv * 3;
      B.pos[k] = p.x + rx * rr; B.pos[k + 1] = p.y + ry * rr; B.pos[k + 2] = p.z + rz * rr;
      _q.set(rx * rr - tx * dr, ry * rr - ty * dr, rz * rr - tz * dr); if (_q.lengthSq() < 1e-12) _q.set(rx, ry, rz); _q.normalize();
      B.nor[k] = _q.x; B.nor[k + 1] = _q.y; B.nor[k + 2] = _q.z;
      B.col[k] = ao * (o.aoFn ? o.aoFn(p.y) : 1); B.col[k + 1] = moss; B.col[k + 2] = clamp(rad / 0.8, 0, 1);
      B.uv[B.nv * 2] = th * Math.max(rad, 0.05); B.uv[B.nv * 2 + 1] = v;
      B.nv++;
    }
  }
  const ring = sides + 1;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * ring + j, b = a + 1, c = a + ring, d = c + 1;
    B.idx[B.ni++] = a; B.idx[B.ni++] = b; B.idx[B.ni++] = c; B.idx[B.ni++] = b; B.idx[B.ni++] = d; B.idx[B.ni++] = c;
  }
}
function polyAt(P, t, out) { const f = clamp(t, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)); return out.copy(P[i]).lerp(P[i + 1], f - i); }
function headingAt(P, t) { const f = clamp(t, 0, 0.999) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)); return Math.atan2(P[i + 1].x - P[i].x, P[i + 1].z - P[i].z); }
function radAt(R, t) { const f = clamp(t, 0, 1) * (R.length - 1), i = Math.min(R.length - 2, Math.floor(f)); return lerp(R[i], R[i + 1], f - i); }

// height of the moss mound (shared by roots, stones and the mound itself)
// The moss is hummocked velvet, and the great roots run out under it as mossy ridges long after the wood has dived below.
// info(x, z, out) fills out = [height, hummock -1..1, root ridge 0..1, distance to the nearest root line].
function makeMound(noise, sd, roots = []) {
  const info = (x, z, out) => {
    const r = Math.hypot(x, z);
    const hum = (noise.n2(x * 0.42 + sd, z * 0.42 - sd) * 0.7 + noise.n2(x * 1.05 - sd, z * 1.05 + sd) * 0.3) * smoothstep(2.2, 5.5, r) * (1 - smoothstep(15.5, 18.5, r));
    let ridge = 0, near = 1e9;
    for (const rt of roots) {
      const P = rt.P; let best = 1e9, bs = 0;
      for (let i = 0; i + 1 < P.length; i++) {
        const ax = P[i][0], az = P[i][1], bx = P[i + 1][0] - ax, bz = P[i + 1][1] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz), 0, 1), d = Math.hypot(x - ax - bx * t, z - az - bz * t);
        if (d < best) { best = d; bs = (i + t) / (P.length - 1); }
      }
      if (best < near) near = best;
      const w = lerp(0.62, 0.3, bs), a = rt.h * smoothstep(0.0, 0.12, bs) * (1 - smoothstep(0.55, 1, bs));
      ridge = Math.max(ridge, a * Math.exp(-(best * best) / (w * w)));
    }
    out[0] = 0.28 + 0.8 * Math.exp(-(r * r) / 27) + 0.2 * noise.fbm2(x * 0.13 + sd, z * 0.13 - sd, 3) * smoothstep(1.5, 6, r) - 1.7 * smoothstep(13, 19, r) + 0.24 * hum + ridge;
    out[1] = hum; out[2] = ridge; out[3] = near;
    return out;
  };
  const tmp = [0, 0, 0, 0], mound = (x, z) => info(x, z, tmp)[0];
  mound.info = info;
  return mound;
}

async function buildLimbs(ctx, rng, mound, greatRoots = []) {
  const noise = ctx.noise, B = makeBuf(40000, 230000), cand = [];
  const sx = rng.range(0, 100);
  const lean = rng.range(Math.PI * 0.62, Math.PI * 1.38), leanA = rng.range(0.2, 0.55);   // always leaning away from the corridor
  const topY = rng.range(17.3, 18.6);
  const trunkAt = (y, out) => {
    const k = clamp(y / 4.3, 0, 1), up = smoothstep(5, 12, y);
    return out.set(Math.cos(lean) * leanA * k * k + noise.n2(y * 0.23 + sx, 1.7) * 0.3 * clamp(y / 3, 0, 1) + noise.n2(y * 0.15 + sx, 9.1) * 1.3 * up, y,
      Math.sin(lean) * leanA * k * k + noise.n2(y * 0.23 + sx, 4.9) * 0.3 * clamp(y / 3, 0, 1) + noise.n2(y * 0.15 + sx, 13.3) * 1.3 * up);
  };
  const girth = (y) => 1.5 + 1.15 * Math.exp(-(y + 0.9) / 0.75) + 0.28 * Math.exp(-(((y - 4.2) / 1.0) ** 2));
  const trunkR = (y) => (y <= 4.3 ? girth(y) : (0.16 + (girth(4.3) - 0.16) * Math.exp(-(y - 4.3) / 1.7)) * (1 - 0.72 * smoothstep(13.5, topY, y)));
  const add = (P, R, sides, o, w, t0) => {
    addTube(B, P, R, sides, { noise, ...o });
    if (w > 0) for (let i = 1; i < P.length; i++) {
      const t = i / (P.length - 1); if (t <= t0) continue;
      cand.push({ a: P[i - 1], b: P[i], r: R[i], up: !!o.up, w: w * P[i].distanceTo(P[i - 1]) * (0.6 + 0.8 * t) * (1 + 2.6 * smoothstep(9, 16, P[i].y)) });
    }
  };
  const branch = (P0, heading, len, rise, droop, r0, r1, n, wob) => {
    const P = [], R = [], sd = rng.range(0, 100);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = heading + wob * noise.n2(t * 2.3 + sd, 5.1) * t, d = len * (t - 0.12 * t * t);
      const rad = lerp(r0, r1, Math.pow(t, 0.8));
      const p = V3(P0.x + Math.sin(a) * d, P0.y + rise * 4 * t * (1 - t) - droop * t * t + 0.22 * noise.n2(t * 3.7 + sd, 11.3) * t, P0.z + Math.cos(a) * d);
      if (i > 0) { pushClear(p, rad); domeClamp(p); }
      P.push(p); R.push(rad);
    }
    return { P, R };
  };
  const twigs = (par, list, lenK) => {
    for (const tp of list) {
      const P0 = polyAt(par.P, tp, V3(0, 0, 0)), h = headingAt(par.P, tp) + rng.sign() * rng.range(0.25, 1.05), len = rng.range(2.4, 4.4) * lenK;
      const tw = branch(P0, h, len, rng.range(0.3, 1.0), len * rng.range(0.32, 0.66), Math.min(0.05, radAt(par.R, tp)), 0.016, 6, 0.9);
      add(tw.P, tw.R, 4, { moss: -0.25 }, 3, 0.1);
    }
  };

  // risers: twigs that climb off the top of a limb and arch over, so the dome is clothed from above
  const risers = (par, list) => {
    for (const tp of list) {
      const P0 = polyAt(par.P, tp, V3(0, 0, 0)), h = headingAt(par.P, tp) + rng.sign() * rng.range(0.2, 1.3), len = rng.range(2.6, 4.6);
      const tw = branch(P0, h, len, rng.range(1.5, 2.8), rng.range(0.1, 1.0), Math.min(0.065, radAt(par.R, tp)), 0.018, 7, 0.9);
      add(tw.P, tw.R, 4, { moss: -0.25, up: true }, 4.5, 0.3);
    }
  };

  // trunk, carried on up as the central leader
  {
    const ys = [-0.9, -0.3, 0.2, 0.7, 1.3, 2.0, 2.8, 3.6, 4.3, 5.0, 5.8, 6.8, 8, 9.5, 11, 12.6, 14.2, 15.8, topY], P = [], R = [];
    for (const y of ys) { P.push(trunkAt(y, V3(0, 0, 0))); R.push(trunkR(y)); }
    add(P, R, 20, { flute: 0.15, k1: 5, k2: 9, twist: 0.33, phase: rng.range(0, 6), bump: 0.07, moss: 0.12, aoFn: (y) => 0.62 + 0.38 * smoothstep(-0.3, 2.2, y) }, 1, 0.8);
    await ctx.yield();
    const leader = { P: P.slice(11), R: R.slice(11) };
    twigs(leader, [0.55, 0.7, 0.82, 0.92, 1.0, 1.0], 1.0); risers(leader, [0.6, 0.8, 0.95, 1.0]);
    await ctx.yield();
    // upper branches off the leader fill the top of the dome
    const nUp = 12, a0 = rng.range(0, 6.28);
    for (let k = 0; k < nUp; k++) {
      const y = 7.6 + (k / (nUp - 1)) * (topY - 9.2) + rng.range(-0.3, 0.3), P0 = trunkAt(y, V3(0, 0, 0));
      const f = (y - 7.6) / 9.5, len = rng.range(4.6, 7.6) * (1 - 0.45 * f);
      const br = branch(P0, a0 + k * 2.4 + rng.range(-0.4, 0.4), len, rng.range(0.9, 2.0), rng.range(0.8, 2.2), Math.min(0.2, trunkR(y) * 0.6), 0.045, 9, 0.8);
      add(br.P, br.R, 6, { flute: 0.08, bump: 0.05, moss: 0.0 }, 1.4, 0.35);
      twigs(br, [0.4, 0.62, 0.84, 1.0], 0.95); risers(br, [0.3, 0.6, 0.9]);
      if (k % 2 === 1) await ctx.yield();
    }
  }
  await ctx.yield();
  // roots gripping the mound
  {
    const nR = rng.int(6, 8), a0 = rng.range(0, 6.28);
    for (let k = 0; k < nR; k++) {
      const az = a0 + ((k + rng.range(-0.3, 0.3)) / nR) * Math.PI * 2, sd = rng.range(0, 100);
      const reach = rng.range(4.4, 7.2) * (Math.sin(az) > 0.3 ? 0.72 : 1), P = [], R = [];
      for (let i = 0; i < 8; i++) {
        const t = i / 7, a = az + 0.55 * noise.n2(t * 2.1 + sd, 2.2) * t, r = 0.9 + (reach - 0.9) * t;
        const x = Math.sin(a) * r, z = Math.cos(a) * r;
        P.push(V3(x, lerp(1.25, mound(x, z) - 0.3, Math.pow(t, 0.55)) + 0.1 * noise.n2(t * 4 + sd, 6.6), z));
        R.push(0.58 * Math.pow(1 - t, 0.8) + 0.11);
      }
      add(P, R, 7, { flute: 0.12, k1: 3, k2: 5, twist: 0.5, phase: sd, bump: 0.08, moss: 0.3, aoFn: () => 0.7 }, 0, 1);
    }
  }
  // the great roots: thick as a thigh where they leave the trunk, running out over the moss until they dive under it
  for (const rt of greatRoots) {
    const P = [], R = [], n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n, f = t * rt.wood * (rt.P.length - 1), k = Math.min(rt.P.length - 2, Math.floor(f)), ft = f - k, x = lerp(rt.P[k][0], rt.P[k + 1][0], ft), z = lerp(rt.P[k][1], rt.P[k + 1][1], ft);
      const rad = 0.66 * Math.pow(1 - t, 0.7) + 0.13;
      P.push(V3(x, lerp(1.5, mound(x, z) + rad * 0.25 - 0.3 * t * t, Math.pow(Math.min(1, t * 2.2), 0.6)), z)); R.push(rad);
    }
    add(P, R, 9, { flute: 0.14, k1: 3, k2: 5, twist: 0.45, phase: rt.sd, bump: 0.09, moss: 0.32, aoFn: () => 0.78 }, 0, 1);
  }
  // scaffold limbs, their weeping secondaries and whip twigs
  const nSc = rng.int(6, 8), az0 = rng.range(0, 6.28), asymA = rng.range(0, 6.28), asymK = rng.range(0.05, 0.16);
  for (let k = 0; k < nSc; k++) {
    const az = az0 + ((k + rng.range(-0.28, 0.28)) / nSc) * Math.PI * 2;
    const Rk = rng.range(9.6, 12.6) * (1 + asymK * Math.cos(az - asymA)), y0 = rng.range(3.3, 5.3), yE = rng.range(11, 15.5), sd = rng.range(0, 100);
    const c0 = trunkAt(y0, V3(0, 0, 0)), P = [], R = [];
    for (let i = 0; i < 13; i++) {
      const t = i / 12, a = az + 0.5 * noise.n2(t * 1.9 + sd, 3.3) * t, r = Rk * Math.pow(t, 0.85), rad = 0.6 * Math.pow(1 - t, 1.15) + 0.1;
      const p = V3(c0.x + Math.sin(a) * r, y0 + (yE - y0) * (1 - Math.pow(1 - t, 2.3)) - 1.4 * t ** 4 + 0.6 * noise.n2(t * 3.1 + sd, 7.7) * Math.min(1, t * 3), c0.z + Math.cos(a) * r);
      if (i > 0) { pushClear(p, rad); domeClamp(p); }
      P.push(p); R.push(rad);
    }
    const sc = { P, R };
    add(P, R, 9, { flute: 0.13, k1: 4, k2: 7, twist: 0.6, phase: sd, bump: 0.08, moss: 0.1 }, 1, 0.7);
    let side = rng.sign();
    for (const base of [0.3, 0.45, 0.6, 0.78, 0.94]) {
      const tp = clamp(base + rng.range(-0.05, 0.05), 0, 1); side = -side;
      const P0 = polyAt(P, tp, V3(0, 0, 0)), len = rng.range(4.6, 7.6) * (1 - 0.22 * tp);
      const br = branch(P0, headingAt(P, tp) + side * rng.range(0.45, 1.2), len, rng.range(0.6, 1.6), rng.range(1.0, 3.0), Math.min(0.3, radAt(R, tp) * 0.6), 0.045, 9, 0.9);
      add(br.P, br.R, 6, { flute: 0.08, bump: 0.05, moss: 0.0 }, 1.4, 0.35);
      twigs(br, [0.36, 0.58, 0.8, 1.0], 1.0); risers(br, [0.3, 0.62]);
      await ctx.yield();
    }
    twigs(sc, [0.88, 1.0, 1.0], 1.1); risers(sc, [0.36, 0.5, 0.64, 0.78, 0.9]);
    await ctx.yield();
  }
  // the great low limb: it leaves the trunk at head height and sweeps north beside the corridor, moss-backed, so that
  // from under the crown it closes the left of the view on the way out (kept 5.7 m and more from the fly line)
  {
    const sd = rng.range(0, 100), G = [[0.4, 3.3, -1.3], [1.0, 4.1, -4.2], [1.7, 4.6, -7.2], [2.5, 5.0, -9.8], [3.1, 5.6, -12.0], [3.0, 6.6, -14.0], [2.2, 7.9, -15.6]];
    const P = [], R = [];
    for (let i = 0; i <= 18; i++) {
      const f = (i / 18) * (G.length - 1), k = Math.min(G.length - 2, Math.floor(f)), t = f - k, a = G[k], b = G[k + 1];
      P.push(V3(lerp(a[0], b[0], t) + 0.22 * noise.n2(i * 0.5 + sd, 2.1), lerp(a[1], b[1], t) + 0.18 * noise.n2(i * 0.45 + sd, 7.4), lerp(a[2], b[2], t)));
      R.push(0.62 * Math.pow(1 - i / 18, 0.9) + 0.13);
    }
    const gl = { P, R };
    add(P, R, 11, { flute: 0.14, k1: 4, k2: 7, twist: 0.5, phase: sd, bump: 0.09, moss: 0.34 }, 1.6, 0.25);
    for (const [tp, side] of [[0.45, -1], [0.62, 1], [0.8, -1], [0.95, 1]]) {
      const P0 = polyAt(P, tp, V3(0, 0, 0)), len = rng.range(3.4, 5.2);
      const br = branch(P0, headingAt(P, tp) + side * rng.range(0.5, 1.0), len, rng.range(0.8, 1.6), rng.range(0.6, 1.8), Math.min(0.22, radAt(R, tp) * 0.6), 0.04, 8, 0.8);
      add(br.P, br.R, 6, { flute: 0.08, bump: 0.05, moss: 0.1 }, 1.6, 0.3);
      twigs(br, [0.5, 0.8, 1.0], 0.9); risers(br, [0.4, 0.8]);
    }
    twigs(gl, [0.7, 0.86, 1.0, 1.0], 1.0); risers(gl, [0.5, 0.7, 0.9]);
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(B.pos.slice(0, B.nv * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(B.nor.slice(0, B.nv * 3), 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(B.col.slice(0, B.nv * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(B.uv.slice(0, B.nv * 2), 2));
  g.setIndex(new THREE.BufferAttribute(B.idx.slice(0, B.ni), 1));
  g.computeBoundingSphere();
  return { geometry: g, cand, topY, tris: B.ni / 3 };
}

function woodMaterial(U, C) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true,
    uniforms: { ...lightU(), ...fogU(), uSunGain: U.uSunGain, uAmbGain: U.uAmbGain, uBare: U.uBare, uSnow: U.uSnow, uTime: U.uTime,
      uBark: { value: C.bark }, uBarkRed: { value: C.barkRed }, uMossD: { value: C.mossD }, uMossL: { value: C.mossL }, uLichen: { value: C.lichen } },
    vertexShader: /* glsl */`
      attribute vec3 aCol;
      varying vec3 vN, vNl, vP, vCol, vVP; varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){
        vP = position; vNl = normal; vCol = aCol; vUv = uv;
        vN = normalize(normalMatrix*normal);
        vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
        vVP = mvPosition.xyz;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 uBark, uBarkRed, uMossD, uMossL, uLichen; uniform float uBare, uSnow, uTime;
      varying vec3 vN, vNl, vP, vCol, vVP; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN); vec3 nl = normalize(vNl);
        float big = vCol.z;
        float n1 = psNoise(vUv*vec2(2.2, 0.9)), n2 = psNoise(vUv*vec2(9.0, 3.0) + 7.0);
        float band = smoothstep(0.55, 0.85, psNoise(vec2(vUv.x*1.6, vUv.y*11.0)));          // the cherry's horizontal lenticels
        float crack = smoothstep(0.62, 0.9, psNoise(vec2(vUv.x*7.0, vUv.y*1.1) + 3.0))*big;  // old bark splits lengthways
        vec3 bark = mix(uBarkRed, uBark, smoothstep(0.04, 0.3, big))*(0.62 + 0.55*n1 + 0.3*n2);
        bark = mix(bark, bark*1.9 + 0.02, band*0.45*(1.0 - 0.6*big));
        bark *= 1.0 - 0.6*crack;
        bark = mix(bark, uLichen, smoothstep(0.72, 0.9, psNoise(vP.xz*1.7 + vP.y*2.3))*0.5*smoothstep(0.1, 0.5, big));
        float mn = psNoise(vP.xz*2.3 + vP.y*1.1), mf = psNoise(vP.xz*17.0 + vP.y*13.0);
        float moss = smoothstep(0.25, 0.75, nl.y*0.85 + vCol.y + (mn - 0.5)*0.8 + 0.25*big);
        vec3 mcol = mix(uMossD, uMossL, mn*0.6 + mf*0.5)*(0.75 + 0.5*mf);
        vec3 alb = mix(bark, mcol, moss);
        float snow = uSnow*smoothstep(0.35, 0.75, nl.y + (mn - 0.5)*0.4);
        alb = mix(alb, vec3(0.78, 0.8, 0.84), snow);
        vec3 L = psSunDir();
        float dap = 0.55 + 0.45*psNoise(vP.xz*0.9 + vP.y*0.6 + uTime*0.06);
        float domeD = length(vec3(vP.x/15.5, (vP.y - 2.0)/18.5, vP.z/15.5));
        float shade = mix(mix(0.42*dap + 0.1, 1.0, smoothstep(0.72, 1.0, domeD)), 1.0, uBare);   // under its own blossom until it strips
        shade = max(shade, (0.62 + 0.3*dap)*smoothstep(13.5, 7.0, vP.y)*smoothstep(-2.5, 1.5, vP.z + 0.3*vP.x));   // the south hall stands open: light reaches the trunk and its roots
        float nlg = max(dot(n, L), 0.0);
        float rim = pow(1.0 - max(dot(n, -normalize(vVP)), 0.0), 3.0);
        vec3 c = alb*RECIPROCAL_PI*(psSunCol()*nlg*shade + psAmb(n)*vCol.x*(1.0 + 0.5*rim));
        c += mcol*RECIPROCAL_PI*psSunCol()*moss*shade*0.25*max(dot(n, L)*0.5 + 0.5, 0.0);   // moss is velvety: a little wrap
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the moss mound and its stones ----------
async function buildBase(rng, noise, mound, pause) {
  // rock: x = 1 on a stone; y = hummock (-1 hollow .. 1 crest); z = how thick the fallen petals lie (windrows in the lee of
  // roots and stones, in the hollows and along the rim; almost none on the crests)
  const pos = [], rock = [], idx = [], I4 = [0, 0, 0, 0];
  const RINGS = 36, SEGS = 96, nMound = 1 + RINGS * SEGS;
  const inf = new Float32Array(nMound * 2);                                    // root ridge, distance to the nearest root line: kept for the drifts below
  const put0 = (x, z) => { mound.info(x, z, I4); const k = pos.length / 3; inf[k * 2] = I4[2]; inf[k * 2 + 1] = I4[3]; pos.push(x, I4[0], z); rock.push(0, I4[1], 0); };
  put0(0, 0);
  for (let i = 1; i <= RINGS; i++) {
    const r = 19 * Math.pow(i / RINGS, 0.85);
    for (let j = 0; j < SEGS; j++) {
      const a = (j / SEGS) * Math.PI * 2 + (i % 2) * (Math.PI / SEGS);
      put0(Math.sin(a) * r, Math.cos(a) * r);
    }
    if (i % 5 === 0 && pause) await pause();
  }
  for (let j = 0; j < SEGS; j++) idx.push(0, 1 + j, 1 + ((j + 1) % SEGS));
  for (let i = 1; i < RINGS; i++) for (let j = 0; j < SEGS; j++) {
    const a = 1 + (i - 1) * SEGS + j, b = 1 + (i - 1) * SEGS + ((j + 1) % SEGS), c = a + SEGS, d = b + SEGS;
    idx.push(a, c, b, b, c, d);
  }
  // moss-backed stones, kept off the corridor
  const stones = [], nSt = rng.int(8, 11);
  for (let k = 0, tries = 0; k < nSt && tries < 80; tries++) {
    const a = rng.range(0, 6.28), r = rng.range(3.6, 15.5), x = Math.sin(a) * r, z = Math.cos(a) * r, s = rng.range(0.45, 1.25) * (r > 9 ? 1.25 : 1);
    if (Math.abs(x - FLY_X) < 3.2 + s) continue;
    if (stones.some((o) => Math.hypot(o.x - x, o.z - z) < o.s + s + 0.6)) continue;
    stones.push({ x, z, s }); k++;
    const NU = 12, NV = 7, base = pos.length / 3, sd = rng.range(0, 100);
    const sx = rng.range(0.9, 1.5), sy = rng.range(0.5, 0.8), sz = rng.range(0.8, 1.3), rot = rng.range(0, 6.28), cy = mound(x, z) + s * sy * rng.range(0.05, 0.3);
    const put = (u, v) => {
      const ph = v * Math.PI, th = u * Math.PI * 2, dx = Math.sin(ph) * Math.cos(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.sin(th);
      let rr = s * (1 + 0.28 * noise.n3(dx * 1.2 + sd, dy * 1.2, dz * 1.2) + 0.1 * noise.n3(dx * 3.1, dy * 3.1 + sd, dz * 3.1));
      rr *= 1 - 0.22 * Math.abs(Math.sin(dx * 2.3 + sd) * Math.sin(dz * 2.9 + sd));          // a few flat facets
      const lx = dx * rr * sx, lz = dz * rr * sz;
      pos.push(x + lx * Math.cos(rot) + lz * Math.sin(rot), cy + dy * rr * sy, z - lx * Math.sin(rot) + lz * Math.cos(rot)); rock.push(1, 0.3, 0.25 + 0.6 * Math.max(0, dy));
    };
    put(0, 0);
    for (let v = 1; v < NV; v++) for (let u = 0; u < NU; u++) put(u / NU, v / NV);
    put(0, 1);
    const last = base + 1 + (NV - 1) * NU;
    for (let u = 0; u < NU; u++) idx.push(base, base + 1 + ((u + 1) % NU), base + 1 + u);
    for (let v = 0; v < NV - 2; v++) for (let u = 0; u < NU; u++) {
      const a = base + 1 + v * NU + u, b = base + 1 + v * NU + ((u + 1) % NU), c = a + NU, d = b + NU;
      idx.push(a, b, c, b, d, c);
    }
    for (let u = 0; u < NU; u++) idx.push(last, last - NU + u, last - NU + ((u + 1) % NU));
  }
  if (pause) await pause();
  // where the petals lie: beside every root, round every stone, in the hollows, in a broken ring under the hem
  for (let i = 0; i < nMound; i++) {
    const x = pos[i * 3], z = pos[i * 3 + 2], r = Math.hypot(x, z); I4[1] = rock[i * 3 + 1]; I4[2] = inf[i * 2]; I4[3] = inf[i * 2 + 1];
    if (i % 900 === 899 && pause) await pause();
    let st = 0; for (const o of stones) { const d = Math.hypot(x - o.x, z - o.z) / (o.s * 1.25); st = Math.max(st, Math.exp(-((d - 1.15) ** 2) / 0.16)); }
    const root = I4[3] < 50 ? Math.exp(-(((I4[3] - 0.75) / 0.5) ** 2)) * smoothstep(1.8, 4, r) * (1 - smoothstep(11, 13.5, r)) : 0;
    const w1 = noise.n2(x * 0.16 + 7.7, z * 0.16 - 3.1), w2 = noise.n2((x * 0.75 + z * 0.66) * 0.11, (z * 0.75 - x * 0.66) * 0.5 + 5.0);      // windrows lie along the wind
    const rim = Math.exp(-(((r - 13.2) / 2.3) ** 2)) * (0.45 + 0.55 * smoothstep(-0.2, 0.3, w1));
    rock[i * 3 + 2] = clamp(0.12 + 0.62 * root + 0.6 * st + 0.42 * rim + 0.5 * smoothstep(0.1, 0.5, w2) * smoothstep(-0.1, 0.35, w1) - 0.5 * I4[1] - 1.2 * I4[2] - 0.25 * smoothstep(5, 2, r), 0, 1);
  }
  if (pause) await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRock', new THREE.Float32BufferAttribute(rock, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return { geometry: g, stones, tris: idx.length / 3 };
}

function baseMaterial(U, C) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true,
    uniforms: { ...lightU(), ...fogU(), uSunGain: U.uSunGain, uAmbGain: U.uAmbGain, uTime: U.uTime, uSnow: U.uSnow, uShade: U.uShade, uLitter: U.uLitter, uClock: U.uClock, uWindH: U.uWindH,
      uMossD: { value: C.mossD }, uMossL: { value: C.mossL }, uRock: { value: C.rock }, uShell: { value: C.shell }, uPale: { value: C.pale } },
    vertexShader: /* glsl */`
      attribute vec3 aRock;
      varying vec3 vN, vNl, vP, vVP; varying vec3 vRock;
      #include <fog_pars_vertex>
      void main(){
        vP = position; vNl = normal; vRock = aRock;
        vN = normalize(normalMatrix*normal);
        vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
        vVP = mvPosition.xyz;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 uMossD, uMossL, uRock, uShell, uPale, uWindH; uniform vec4 uShade; uniform float uLitter, uSnow, uTime, uClock;
      varying vec3 vN, vNl, vP, vVP; varying vec3 vRock;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN); vec3 nl = normalize(vNl);
        float r = length(vP.xz), dist = length(vVP);
        float n1 = psNoise(vP.xz*0.8), n2 = psNoise(vP.xz*5.0 + 11.0), n3 = psNoise(vP.xz*21.0);
        // velvet: pale on the crests of the hummocks, deep in the hollows, a fine nap that fades with distance
        float hum = clamp(vRock.y*0.5 + 0.5 + (n2 - 0.5)*0.3, 0.0, 1.0);
        vec3 moss = mix(uMossD*0.62, uMossL*1.12, smoothstep(0.18, 0.9, hum*0.75 + n1*0.25))*(0.78 + 0.44*n3*(1.0 - smoothstep(10.0, 34.0, dist)));
        float mossAmt = mix(1.0, smoothstep(0.15, 0.65, nl.y + (n2 - 0.5)*0.6), vRock.x);
        vec3 rock = uRock*(0.55 + 0.9*psNoise(vP.xz*3.0 + vP.y*4.0));
        vec3 alb = mix(rock, moss, mossAmt);
        // fallen petals: single specks near the lens, a pale drift far off
        // fallen petals lie in windrows: thick drifts with ragged edges where the mesh says they gather, a scatter of single
        // petals between, and almost bare moss on the crests
        float dn = vRock.z + uLitter*0.6 + (psNoise(vP.xz*1.7 + 9.0) - 0.5)*0.42 + (n2 - 0.5)*0.2;
        // the gust lifts the fall off the moss, windward first, drift by drift: pink clears to green
        dn -= 0.62*smoothstep(0.0, 4.2, uClock + 0.7 - clamp(0.5 + 0.5*dot(vP.xz, uWindH.xz)/16.0, 0.0, 1.0)*1.7 - 3.0*psNoise(vP.xz*0.55 + 3.0));
        float thick = smoothstep(0.5, 0.64, dn)*smoothstep(0.2, 0.65, nl.y);
        float thin = clamp(0.035 + 0.5*smoothstep(0.22, 0.52, dn), 0.0, 0.6)*smoothstep(0.2, 0.65, nl.y);
        vec2 g = vP.xz*9.5; vec2 ci = floor(g), cf = fract(g) - 0.5;
        float h = psHash(ci), h2 = psHash(ci + 17.3);
        vec2 d2 = cf - (vec2(h2, psHash(ci + 41.1)) - 0.5)*0.62;
        float ang = h*6.2832, ca = cos(ang), sa = sin(ang);
        d2 = vec2(d2.x*ca + d2.y*sa, -d2.x*sa + d2.y*ca);
        float pet = 1.0 - smoothstep(0.055, 0.085, d2.x*d2.x + d2.y*d2.y*2.2);
        vec2 g2 = vP.xz*14.0 + 3.7; vec2 cj = floor(g2), cg = fract(g2) - 0.5; float hj = psHash(cj + 5.1);
        vec2 d3 = cg - (vec2(hj, psHash(cj + 23.9)) - 0.5)*0.6;
        float pet2 = (1.0 - smoothstep(0.07, 0.11, dot(d3, d3)*1.6))*step(hj, 0.75);
        float speck = max(pet*step(h, thin + thick*0.9), pet2*thick);                 // in a drift the petals overlap: two layers of them
        float far = smoothstep(12.0, 40.0, dist);
        float cover = mix(max(speck, thick*0.58), thick*0.8 + thin*0.25, far);
        alb = mix(alb, mix(uShell, uPale, h2*0.55)*(0.86 + 0.2*hj), cover);
        alb = mix(alb, vec3(0.78, 0.8, 0.84), uSnow*smoothstep(0.3, 0.7, nl.y + (n1 - 0.5)*0.5)*0.8);
        // the crown's shadow, dappled, let go as the tree strips
        float hh = clamp(dot(vP.xz, uShade.xy)/max(dot(uShade.xy, uShade.xy), 1e-3), 0.0, 1.0);   // a capsule from the trunk to where the crown's shadow lands
        float sd = length(vP.xz - uShade.xy*hh)/max(uShade.z, 1.0);
        float dap = psNoise(vP.xz*1.1 + uTime*0.07)*0.6 + psNoise(vP.xz*3.7 - uTime*0.11)*0.4;
        float lit = smoothstep(0.55, 1.12, sd + (dap - 0.5)*0.45);
        float shade = mix(1.0, lit, uShade.w);
        vec3 c = alb*RECIPROCAL_PI*(psSunCol()*max(dot(n, psSunDir()), 0.0)*shade + psAmb(n)*mix(1.0, 0.72 + 0.28*lit, uShade.w));
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the blossom atlas for the strands ----------
// Four columns, each a 0.4 m x 3.2 m length of blossom cord. R = coverage, G = shade (dark heart .. pale
// petal edge), B = a random id per blossom (the order in which blossoms let go when the tree strips).
function makeAtlas(rng, budK) {
  const W = 512, H = 1024, CW = 128;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgb(0,205,128)'; g.fillRect(0, 0, W, H);
  const draw = (x, y, R, rot, squash, id, bud, shades) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, squash);
    if (bud) {
      g.fillStyle = `rgb(255,${shades[0] - 95},${id})`; g.beginPath(); g.ellipse(0, 0, R * 0.3, R * 0.55, 0, 0, Math.PI * 2); g.fill();
    } else {
      for (let k = 0; k < 5; k++) {
        g.save(); g.rotate((k / 5) * Math.PI * 2);
        const gr = g.createLinearGradient(0, -R * 0.08, 0, -R * 1.02);
        gr.addColorStop(0, `rgb(255,${Math.floor(shades[k] * 0.62)},${id})`); gr.addColorStop(0.55, `rgb(255,${shades[k] - 25},${id})`); gr.addColorStop(1, `rgb(255,${shades[k]},${id})`);
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, -R * 0.56, R * 0.36, R * 0.5, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      g.fillStyle = `rgb(255,60,${id})`; g.beginPath(); g.arc(0, 0, R * 0.13, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  };
  for (let c = 0; c < 4; c++) {
    g.save(); g.beginPath(); g.rect(c * CW + 3, 0, CW - 6, H); g.clip();
    const n = 64 + c * 5;
    for (let i = 0; i < n; i++) {
      const y = ((i + rng()) / n) * H, off = (rng() + rng() + rng() - 1.5) * 44;
      const x = c * CW + CW / 2 + clamp(off, -44, 44), R = rng.range(12, 18), rot = rng.range(0, 6.28), squash = rng.range(0.5, 1);
      const id = Math.floor(rng() * 255), bud = rng.chance(budK), shades = [0, 1, 2, 3, 4].map(() => Math.floor(rng.range(195, 255)));
      for (const yo of [0, -H, H]) { if (y + yo > -30 && y + yo < H + 30) draw(x, y + yo, R, rot, squash, id, bud, shades); }
    }
    g.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// ---------- strands: camera-facing ribbons carrying the blossom atlas and a bare twig ----------
function strandMaterial(U, C, atlas) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), uSunGain: U.uSunGain, uAmbGain: U.uAmbGain, uTime: U.uTime, uClock: U.uClock, uWindH: U.uWindH, uViewH: U.uViewH,
      uCentre: U.uCentre, uShed: U.uShed, uStrip: U.uStrip, uTrans: U.uTrans, uSunL: U.uSunL, uRim: U.uRim, uTier: U.uTier, uAtlas: { value: atlas },
      uShell: { value: C.shell }, uRose: { value: C.rose }, uHeart: { value: C.heart }, uTwig: { value: C.twig } },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB, iC;
      uniform float uViewH, uRim; uniform vec3 uCentre, uSunL;
      varying vec2 vUv; varying vec4 vS; varying vec3 vN, vVP, vK; varying vec2 vX, vF; varying float vTs, vTy, vGo;
      #include <fog_pars_vertex>
      ${GLSL_STRAND}
      void main(){
        float t = position.y;
        vGo = psStrip(iB.w);
        float la = psLift(iB.w, uClock);
        vec3 p = psStrand(iA, iB, t, la, 1.0, uTime);
        vec3 p2 = psStrand(iA, iB, t + 0.03, la, 1.0, uTime);
        vec4 wp = modelMatrix*vec4(p, 1.0);
        vec3 tg = mat3(modelMatrix)*(p2 - p);
        vec3 sd = cross(tg, wp.xyz - cameraPosition); sd /= max(length(sd), 1e-6);
        float depth = max(-(viewMatrix*wp).z, 0.05);
        float pxw = 2.0*depth/(projectionMatrix[1][1]*uViewH);     // metres per pixel at this depth
        float w = max(0.40*iC.z, 1.6*pxw);
        // far off, where a strand is drawn wider than it is, some are left out so the curtain keeps its partings
        w *= step(fract(iC.w*7.31 + iB.z*0.37), clamp(0.40*iC.z/(1.6*pxw) + 0.18, 0.0, 1.0));
        wp.xyz += sd*(position.x*w);
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        vVP = mvPosition.xyz;
        vX = vec2(position.x + 0.5, 0.55*mix(1.0, 0.6, t)*pxw/w);
        vUv = vec2((floor(iC.x) + 0.5 + position.x*0.94)/4.0, t*iA.w/${TILE.toFixed(2)} + iC.w);
        vS = vec4(t, iB.w, mix(0.0075, 0.003, t)/w, 1.0 - smoothstep(5.0, 22.0, w/pxw));
        vTs = t*iA.w;
        vec3 q = p - uCentre;
        vec3 nl = normalize(q*vec3(1.0, 0.7, 1.0) + vec3(0.0, 4.0, 0.001));
        vN = normalize(mat3(viewMatrix)*(mat3(modelMatrix)*nl));
        float ao = mix(0.32, 1.0, smoothstep(0.3, 0.95, length(q.xz)/15.0 + 0.25*smoothstep(0.0, 8.0, q.y)));
        vK = vec3(iC.y*(0.7 + 0.3*smoothstep(2.0, 16.0, p.y)), mix(ao, 1.0, la*0.6), la);
        // the crown as one form: the flank turned to the sun, the flank turned away, and the hem in the crown's own shade
        float form = smoothstep(-0.7, 0.4, dot(q.xz, uSunL.xz)/15.0 + 0.05*q.y);
        vF = vec2(mix(0.36 + 0.3*uRim, 1.0, form), mix(0.6 + 0.25*uRim, 1.0, smoothstep(-9.5, -2.0, q.y)));   // by moonlight the lee side keeps more of its silver
        // the crown hangs in TIERS, each a skirt of cascades over the one below: the tier lines wander round the tree
        // (laid out on the strand at rest, so a tier rides up with its strands when the gust lifts them)
        { vec3 p0 = psStrand(iA, iB, t, 0.0, 1.0, 0.0), q0 = p0 - uCentre; float az = atan(q0.z, q0.x + 1e-4); vTy = (p0.y + 1.5*sin(az*3.0 + 1.3) + 0.8*sin(az*7.0 + 4.0))/4.4; }
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform sampler2D uAtlas; uniform vec3 uShell, uRose, uHeart, uTwig; uniform float uClock, uShed, uTrans, uRim;
      varying vec2 vUv; varying vec4 vS; varying vec3 vN, vVP, vK; varying vec2 vX, vF; varying float vTs, vTy, vGo;
      uniform vec2 uTier;
      #include <fog_pars_fragment>
      void main(){
        vec4 tx = texture2D(uAtlas, vUv);
        float gone = 1.0 - step(max(uShed, vGo), tx.b + 1e-4);          // a season thins the blossom; the gust takes it from the windward strands
        float tb = fract(vTy), tierK = vS.w*(1.0 - 0.45*vK.z)*0.92;      // tiers read from far off and in still air
        float cov = tx.r*(1.0 - gone);
        // from far off a strand is not one pink stroke: its blossom sits in clusters a metre long, some thin, some full, with dark between
        float clh = psHash(vec2(vS.y*57.0 + 3.0, floor(vTs*0.85 + vS.y*13.0)));
        float clk = max(vS.w, min(vK.z*1.7, 1.0));                        // in the gust the clusters part further and the boughs show between them
        cov *= 1.0 - 0.9*clk*step(clh, mix(0.2, 0.44, smoothstep(0.1, 0.5, vK.z)));
        cov *= 1.0 - 0.8*tierK*(1.0 - smoothstep(0.0, 0.13, tb))*step(0.45, fract(vS.y*37.0 + tx.b*0.3));   // each tier's hem is ragged: the dark of the crown shows through it
        float thr = mix(0.5, 0.13, vS.w);
        float bl = smoothstep(thr - 0.08, thr + 0.08, cov);
        float hw = mix(vS.z, max(vS.z, vX.y), gone);                    // the bare whip never thinner than about a pixel
        float tw = 1.0 - smoothstep(hw*0.7, hw*1.3 + 1e-4, abs(vX.x - 0.5));
        if (max(bl, tw) < 0.5) discard;
        vec3 n = normalize(vN); vec3 vd = normalize(vVP);
        vec3 body = mix(uRose, uShell, clamp(vK.x + (tx.g - 0.85)*0.9, 0.0, 1.0));
        body = mix(body, uShell, vS.w*0.1);
        vec3 alb = mix(uHeart, body, smoothstep(0.27, 0.52, tx.g));
        vec3 L = psSunDir();
        float fk = 0.3 + 0.7*vS.w, shp = mix(1.0, vF.x*vF.y, fk);              // the mass shading takes over as strands merge
        // every cascade is a shingle: its arching shoulder takes the light, its tips hang in the shade of the one above
        float tier = 1.0 + uTier.x*(1.0 - smoothstep(0.25, 2.4, vTs)) - uTier.y*smoothstep(0.5, 1.0, vS.x)*(1.0 - vK.z);
        float expo = clamp(dot(n, L)*0.6 + 0.5, 0.0, 1.0)*vK.y*shp*tier;        // how much sun reaches this part of the crown
        float bk = smoothstep(-0.15, 0.55, dot(vd, L));                         // 0 the lit face, 1 seen against the sun
        vec3 amb = psAmb(n)*mix(1.0, (0.4 + 0.6*vK.y)*(0.66 + 0.34*vF.x)*(0.7 + 0.3*vF.y), fk);
        vec3 cb = alb*RECIPROCAL_PI*(psSunCol()*expo*mix(0.95, 0.22, bk) + amb);
        cb += alb*vec3(1.05, 0.62, 0.74)*RECIPROCAL_PI*psSunCol()*(expo*bk*1.2*uTrans);
        cb += mix(alb, vec3(0.8), 0.5)*RECIPROCAL_PI*psSunCol()*(uRim*0.55*smoothstep(0.5, 1.0, vF.x)*vK.y);   // moonlit rim
        cb *= mix(1.0, 0.62 + 0.7*clh, 0.7*clk);
        cb *= mix(1.0, mix(0.4, 1.28, smoothstep(0.03, 0.66, tb)), tierK);       // a tier's shoulder takes the light; its tips hang dark over the shoulder below
        vec3 ct = uTwig*(1.0 + 0.6*(1.0 - gone))*(0.7 + 0.6*psHash(vec2(vS.y*91.0, floor(vUv.y*3.0))))*RECIPROCAL_PI*(psSunCol()*(0.25 + 0.6*max(dot(n, psSunDir()), 0.0))*vK.y*shp + amb);
        gl_FragColor = vec4(mix(ct, cb, step(0.5, bl)), 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- true blossoms: five cupped petals and a dark heart, 6 triangles ----------
function blossomGeometry() {
  const pos = [], nor = [], q = [];
  const a = V3(0, 0, 0), b = V3(0, 0, 0), c = V3(0, 0, 0), n = V3(0, 0, 0);
  const tri = (qa, qb, qc, ang, part, tw) => {
    const cx = Math.cos(ang), sx = Math.sin(ang);
    const P = (qq, out) => out.set(cx * qq[1] - sx * qq[0], sx * qq[1] + cx * qq[0], part ? 0.07 : 0.3 * qq[1] + tw * qq[0]);
    P(qa, a); P(qb, b); P(qc, c);
    n.subVectors(b, a).cross(V3(0, 0, 0).subVectors(c, a)).normalize();
    for (const [v, qq] of [[a, qa], [b, qb], [c, qc]]) { pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); q.push(qq[0], qq[1], part); }
  };
  for (let k = 0; k < 5; k++) tri([0, -0.1], [-0.75, 1.15], [0.75, 1.15], (k / 5) * Math.PI * 2 + 0.2 * Math.sin(k * 2.1), 0, k % 2 ? 0.14 : -0.1);
  tri([0, 0.24], [-0.21, -0.12], [0.21, -0.12], 0.4, 1, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3));
  return g;
}
function blossomMaterial(U, C) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), uSunGain: U.uSunGain, uAmbGain: U.uAmbGain, uTime: U.uTime, uClock: U.uClock, uWindH: U.uWindH,
      uCentre: U.uCentre, uShed: U.uShed, uStrip: U.uStrip, uTrans: U.uTrans, uSize: { value: 0.056 },
      uShell: { value: C.shell }, uRose: { value: C.rose }, uHeart: { value: C.heart }, uAnther: { value: C.anther } },
    vertexShader: /* glsl */`
      attribute vec3 aQ; attribute vec4 iA, iB, iC; attribute float iD;
      uniform float uSize, uShed; uniform vec3 uCentre;
      varying vec3 vQ, vN, vVP; varying vec2 vK;
      #include <fog_pars_vertex>
      ${GLSL_STRAND}
      void main(){
        float t = iC.x, sd = iC.w;
        float la = psLift(iB.w, uClock);
        vec3 c = psStrand(iA, iB, t, la, 1.0, uTime);
        float a = iC.y*6.2832;
        c += vec3(cos(a)*iC.z, -0.5*iC.z, sin(a)*iC.z);                       // out on its pedicel
        vec3 f = normalize(vec3(cos(a)*0.8, -0.25 - 0.9*fract(sd*13.7), sin(a)*0.8));   // nodding outward and down
        f = normalize(f + vec3(uWindH.x, 0.2, uWindH.z)*la*0.45);
        vec3 e1 = cross(f, vec3(0.31, 0.2, 0.93)); e1 /= max(length(e1), 1e-4);
        vec3 e2 = cross(f, e1);
        float sp = sd*31.4 + 0.25*sin(uTime*1.7 + sd*50.0) + la*0.6*sin(uTime*9.0 + sd*80.0);
        float cs = cos(sp), sn = sin(sp);
        vec3 a1 = e1*cs + e2*sn, a2 = e2*cs - e1*sn;
        float id = fract(sd*5.3);
        float sc = step(max(uShed, psStrip(iB.w)), id + 1e-4)*uSize*(0.8 + 0.45*fract(sd*3.7));
        vec3 lp = c + (a1*position.x + a2*position.y + f*position.z)*sc;
        vec3 ln = a1*normal.x + a2*normal.y + f*normal.z;
        vec4 mvPosition = modelViewMatrix*vec4(lp, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        vVP = mvPosition.xyz; vN = normalMatrix*ln; vQ = aQ;
        vec3 q = c - uCentre;
        float ao = mix(0.55, 1.0, smoothstep(0.3, 0.95, length(q.xz)/15.0 + 0.25*smoothstep(0.0, 8.0, q.y)));
        vK = vec2(iD, mix(ao, 1.0, la*0.6));
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      ${GLSL_SHAPE}
      uniform vec3 uShell, uRose, uHeart, uAnther; uniform float uTrans;
      varying vec3 vQ, vN, vVP; varying vec2 vK;
      #include <fog_pars_fragment>
      void main(){
        vec3 alb;
        if (vQ.z < 0.5) {
          if (psPetalMask(vQ.xy) < 0.5) discard;
          vec3 body = mix(uRose, uShell, clamp(vK.x + (vQ.y - 0.6)*0.5, 0.0, 1.0));
          alb = mix(uHeart, body, smoothstep(0.08, 0.5, vQ.y))*(0.93 + 0.07*sin(vQ.x*34.0));
        } else {
          alb = mix(uHeart*0.6, uAnther, step(0.62, psHash(floor(vQ.xy*26.0) + 3.0)));
        }
        vec3 n = normalize(vN); vec3 vd = normalize(vVP);
        if (dot(n, vd) > 0.0) n = -n;
        gl_FragColor = vec4(psPetal(alb, n, vd, uTrans*1.25, uTrans*0.9, vK.y), 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- petals: one triangle each, held in the curtain, falling in still air, then flying ----------
function petalMaterial(U, C) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), uSunGain: U.uSunGain, uAmbGain: U.uAmbGain, uTime: U.uTime, uClock: U.uClock, uWindH: U.uWindH, uViewH: U.uViewH,
      uCentre: U.uCentre, uShed: U.uShed, uStrip: U.uStrip, uTrans: U.uTrans, uSunL: U.uSunL, uWind: U.uWind, uSideV: U.uSideV, uUpV: U.uUpV, uSpeed: U.uSpeed, uLife: U.uLife,
      uLoose: U.uLoose, uSize: { value: 0.05 }, uShell: { value: C.shell }, uRose: { value: C.rose }, uHeart: { value: C.heart }, uPale: { value: C.pale } },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB, iC, iD, iG;
      uniform float uViewH, uSpeed, uLoose, uLife, uShed, uSize; uniform vec3 uWind, uSideV, uUpV, uCentre, uSunL;
      varying vec2 vQ; varying vec3 vN, vVP; varying vec2 vK; varying float vForm;
      #include <fog_pars_vertex>
      ${GLSL_STRAND}
      void main(){
        float t = iC.x, id = iC.y;
        float grd = step(0.4, iD.w);                                          // three in five lie on the moss as last week's fall
        float loose = step(iD.w, uLoose);                                     // a few are falling in still air
        float la = psLift(iB.w, uClock);
        vec3 p = psStrand(iA, iB, t, la, 1.0, uTime);                         // the rest are held in the curtain and stay in it
        float a = iD.x*6.2832;
        p += vec3(cos(a), -0.5, sin(a))*iD.y;
        float y0 = max(p.y - 0.15, 0.3);
        float per = y0/0.95 + 2.0 + 4.0*iC.z;
        float ph = fract(uTime/per + iC.w)*per;
        float fall = min(ph*0.95, y0);
        float gs = max(uClock - iB.w*1.4 + 1.5, 0.0);
        float fk = smoothstep(0.0, 1.2, fall);
        vec3 lp = p + vec3((sin(fall*1.3 + iC.z*40.0)*0.4 + 0.22*fall*sin(iC.w*20.0))*fk, -fall, (cos(fall*1.1 + iC.w*40.0)*0.4 + 0.22*fall*cos(iC.w*20.0))*fk);
        lp += uWind*(gs*gs*5.0*(0.5 + iC.z));
        float visL = smoothstep(0.0, 0.25, ph)*(1.0 - smoothstep(1.0, 2.4, gs));
        // THE GUST LIFTS WHAT HAS ALREADY FALLEN. A petal on the moss goes up when the front reaches its drift (windward first),
        // slowly at first, and is drawn into one of four bands that wind up round the tree as a wide slow gyre, a funnel that
        // opens with height (it clears the streaming curtain); above the crown the bands lean away down the wind and thin out.
        vec3 hm = iG.xyz; float r0 = length(hm.xz), a0 = atan(hm.z, hm.x + 1e-5);
        float h1 = fract(iC.w*13.3), h2 = fract(iC.z*17.3), h3 = fract(iC.w*23.7);
        float Tg = clamp(0.5 + 0.5*dot(hm.xz, uWindH.xz)/16.0, 0.0, 1.0)*1.2 + iG.w*3.8 - 1.0;
        float tg = max(uClock - Tg, 0.0), up = smoothstep(0.0, 0.7, tg);
        float yy = hm.y + 0.07 + (2.3 + 3.3*h1)*(tg - (1.0 - exp(-1.6*tg))/1.6);
        float gat = smoothstep(0.2, 2.6, tg), lane = floor(h3*4.0);
        float thB = lane*1.5708 + 0.42*Tg;
        thB += 6.2832*floor((a0 - thB)/6.2832 + 0.5);                         // the turn of its band that lies nearest where it lay
        float thL = thB + 0.42*(uClock - Tg) + 0.15*(yy - hm.y) + 0.4*sin(yy*0.17 + lane*2.0) + (h2 - 0.5)*(0.22 + 1.2*abs(h2 - 0.5));   // four bands with clear air between
        float th = mix(a0 + 0.45*tg, thL, gat);
        float rr = mix(r0, 15.6 + 0.74*min(yy, 22.0) + 0.22*max(yy - 22.0, 0.0) + (fract(iC.z*91.7) - 0.5)*4.2 + 1.2*sin(tg*0.9 + h1*20.0), gat);
        float away = max(tg - (6.0 + 3.5*h1), 0.0);
        vec3 gp = vec3(cos(th)*rr, yy + 0.25*up*sin(uTime*2.1 + h1*40.0), sin(th)*rr) + uWind*(away*away*0.45 + away*2.0)
          + up*0.3*vec3(sin(uTime*1.7 + h2*31.0), 0.0, cos(uTime*1.3 + h3*29.0));
        float lifeG = 11.5 + 4.0*h2;
        float visG = 1.0 - smoothstep(lifeG - 3.5, lifeG, tg);
        // a petal held in a windward strand is torn out when the stripping reaches it (ts: seconds of the gust clock since)
        // and goes off down the wind, rising, in the lee of its strand
        float lim = psStripLim(iB.w), took = step(id, lim - 1e-4)*step(0.0005, uStrip);
        float ts = max((uStrip - iB.w*0.9 - 0.35*id/max(lim, 0.05))*(5.0/1.2), 0.0)*took;
        float torn = step(1e-4, ts)*(1.0 - loose)*(1.0 - grd);
        vec3 tp = p + uWind*(ts*(3.0 + 4.0*h1) + ts*ts*1.6) + vec3(0.0, ts*(0.6 + 1.6*h2), 0.0)
          + 0.6*min(ts, 1.5)*vec3(sin(uTime*2.3 + h1*40.0 + ts*2.0), sin(uTime*1.9 + h2*31.0), cos(uTime*2.1 + h3*29.0 + ts*1.7));
        float visT = 1.0 - smoothstep(2.6, 4.2, ts);
        vec3 P = mix(mix(mix(p, tp, torn), lp, loose), gp, grd);
        float vis = mix(mix(mix(step(uShed, id + 1e-4), visT, torn), visL, loose), visG, grd);
        // tumbling in the air; lying nearly flat on the moss
        float fly = max(max(loose, torn), grd*up);
        float spin = iC.z*40.0*(1.0 - grd) + grd*(1.0 - up)*0.25*sin(iC.w*50.0) + fly*uTime*(4.0 + 7.0*iC.w) + (1.0 - fly)*(1.0 - grd)*0.3*sin(uTime*1.3 + iC.w*50.0);
        float be = iC.w*6.2832 + fly*uTime*(1.0 + 2.0*iC.z);
        vec3 e1 = vec3(cos(be), 0.0, -sin(be));
        vec3 e2 = vec3(sin(be)*cos(spin), -sin(spin), cos(be)*cos(spin));
        vec4 wp = modelMatrix*vec4(P, 1.0);
        float depth = max(-(viewMatrix*wp).z, 0.05);
        float pxw = 2.0*depth/(projectionMatrix[1][1]*uViewH);
        float sz = uSize*(0.8 + 0.4*fract(iC.w*7.7))*(1.0 + 0.8*fly)*mix(1.0, mix(0.4, 1.0, smoothstep(1.5, 8.0, depth)), fly);   // seen whole once it is in the air; by the lens, three centimetres
        float need = 3.0*pxw;                                                   // never under 2 px; thinned instead
        float keep = step(fract(iC.z*91.7), clamp(14.0*sz*sz/(need*need), 0.0, 1.0));
        float s = max(sz, need)*vis*keep*mix(smoothstep(0.35, 1.0, depth), smoothstep(1.0, 2.2, depth), fly);
        wp.xyz += mat3(modelMatrix)*((e1*position.x + e2*(position.y - 0.5))*s);
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        vVP = mvPosition.xyz; vQ = position.xy;
        vN = mat3(viewMatrix)*(mat3(modelMatrix)*cross(e1, e2));
        vK = vec2(iD.z, max(fly, grd)*0.6);
        { vec3 qf = p - uCentre;
          float fm = mix(0.36, 1.0, smoothstep(-0.7, 0.4, dot(qf.xz, uSunL.xz)/15.0 + 0.05*qf.y))*mix(0.6, 1.0, smoothstep(-9.5, -2.0, qf.y))
            *mix(0.4, 1.0, smoothstep(0.3, 0.95, length(qf.xz)/15.0 + 0.25*smoothstep(0.0, 8.0, qf.y)));
          vForm = mix(1.0, fm, (1.0 - max(fly, grd))*smoothstep(8.0, 30.0, depth)); }
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      ${GLSL_SHAPE}
      uniform vec3 uShell, uRose, uHeart, uPale; uniform float uTrans;
      varying vec2 vQ; varying vec3 vN, vVP; varying vec2 vK; varying float vForm;
      #include <fog_pars_fragment>
      void main(){
        if (psPetalMask(vQ) < 0.5) discard;
        vec3 body = mix(mix(uRose, uShell, clamp(vK.x + (vQ.y - 0.5)*0.4, 0.0, 1.0)), uPale, vK.y*(0.15 + 0.7*vK.x));
        vec3 alb = mix(mix(uHeart, uRose, vK.y), body, smoothstep(0.0, mix(0.4, 0.2, vK.y), vQ.y));
        vec3 n = normalize(vN); vec3 vd = normalize(vVP);
        if (dot(n, vd) > 0.0) n = -n;
        vec3 L = psSunDir(); float toSun = max(dot(vd, L), 0.0);
        vec3 c = alb*RECIPROCAL_PI*(psSunCol()*(0.72 + 0.38*abs(dot(n, L)))*vForm + psAmb(n)*(0.5 + 0.5*vForm));   // thin: both faces carry the sun
        c += alb*vec3(1.05, 0.62, 0.74)*RECIPROCAL_PI*psSunCol()*(uTrans*0.9*toSun*toSun*vForm);
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const R0 = ctx.rng;
  const rngV = R0.fork('ps-variety'), rngL = R0.fork('ps-limbs'), rngG = R0.fork('ps-ground'), rngS = R0.fork('ps-strands'),
    rngB = R0.fork('ps-blossoms'), rngP = R0.fork('ps-petals'), rngA = R0.fork('ps-atlas');
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE;
  const hour = opts.hour || 'morning', season = opts.season || 'peak', weather = opts.weather || 'clear';
  const detail = ctx.quality?.detail ?? 1, density = clamp(opts.density ?? 1, 0.25, 1.5);

  // ----- colours (linear) -----
  const pale = lin(pal[0], 0.86), shell = lin(pal[1], 0.86), rose = lin(pal[2], 0.96), copper = lin(pal[3]), cedar = lin(pal[4]), jade = lin(pal[5]);
  const deep = rngV.range(-0.12, 0.14) + (season === 'early' ? 0.22 : season === 'late' ? -0.1 : 0);   // per seed: a paler or a deeper tree
  if (deep > 0) shell.lerp(rose, deep); else shell.lerp(pale, -deep);
  let trans = 1.0;
  if (hour === 'moon' || hour === 'dawn') {
    const k = hour === 'moon' ? 0.82 : 0.28;
    for (const c of [pale, shell, rose]) { const g = 0.3 * c.x + 0.55 * c.y + 0.15 * c.z; c.lerp(V3(g * 0.96, g, g * 1.1), k); }
    trans = hour === 'moon' ? 0.3 : 0.8;
  } else if (hour === 'afternoon') trans = 1.25;
  if (weather === 'haze') trans *= 0.6;
  const C = {
    pale, shell, rose,
    heart: V3(rose.x * 0.5 + copper.x * 0.08, rose.y * 0.32 + copper.y * 0.05, rose.z * 0.42),
    twig: mixV(V3(0.05, 0.033, 0.034), copper, 0.08),
    bark: mixV(V3(0.17, 0.14, 0.125), cedar, 0.15), barkRed: mixV(V3(0.11, 0.06, 0.055), copper, 0.25),
    mossD: V3(cedar.x * 0.9 + 0.012, cedar.y * 1.3 + 0.035, cedar.z * 0.55),
    mossL: mixV(jade, V3(0.2, 0.34, 0.07), 0.45).multiplyScalar(0.6),
    lichen: mixV(jade, pale, 0.5).multiplyScalar(0.55),
    rock: V3(0.034, 0.04, 0.046), anther: V3(0.78, 0.56, 0.12),
  };

  if (hour === 'moon') for (const c of [C.mossD, C.mossL, C.lichen]) { const g = 0.3 * c.x + 0.55 * c.y + 0.15 * c.z; c.lerp(V3(g * 0.86, g * 1.0, g * 1.1), 0.72); }   // by moonlight moss is blue-green, in key with the silver blossom

  // ----- wind -----
  const wind = V3(-142, 46, 160);
  if (opts.windDir) { const w = opts.windDir; wind.set(w.x ?? w[0], w.y ?? w[1], w.z ?? w[2]); }
  const U = {
    uTime: { value: 0 }, uClock: { value: -30 }, uSunGain: { value: 1 }, uAmbGain: { value: 1 }, uBare: { value: 0 },
    uSnow: { value: weather === 'snow' ? 0.7 : 0 }, uShed: { value: 0 }, uStrip: { value: 0 }, uTrans: { value: trans },
    uLitter: { value: season === 'late' ? 0.32 : season === 'early' ? -0.25 : 0 },
    uLoose: { value: season === 'late' ? 0.12 : season === 'early' ? 0.012 : 0.06 },
    uViewH: { value: 1080 }, uCentre: { value: V3(0, 10.5, 0) }, uShade: { value: new THREE.Vector4(0, 0, 14, 0.8) },
    uWind: { value: V3(0, 0, 1) }, uWindH: { value: V3(0, 0, 1) }, uSideV: { value: V3(1, 0, 0) }, uUpV: { value: V3(0, 1, 0) },
    uSpeed: { value: opts.speed ?? 19 }, uLife: { value: 10 },
    uSunL: { value: V3(0.85, 0.5, -0.15) }, uRim: { value: hour === 'moon' ? 1 : 0 }, uTier: { value: new THREE.Vector2(0.24, 0.2) },
  };
  const setWind = (v) => {
    const w = V3(v.x, v.y, v.z); if (w.lengthSq() < 1e-8) w.set(0, 0, 1); w.normalize();
    let h = Math.hypot(w.x, w.z); if (h < 0.2) { w.x += 0.3; w.normalize(); h = Math.hypot(w.x, w.z); }
    U.uWind.value.copy(w); U.uWindH.value.set(w.x / h, w.y / h, w.z / h);
    U.uSideV.value.set(-w.z / h, 0, w.x / h);
    U.uUpV.value.crossVectors(U.uSideV.value, w).normalize(); if (U.uUpV.value.y < 0) U.uUpV.value.negate();
  };
  setWind(wind);

  const object = new THREE.Group(); object.name = 'petal-storm-hero';
  // the great roots: [degrees round the trunk (0 = south, 90 = east), how far the mossy ridge runs]. Their wood stops where it
  // would come within the corridor's clearance; the ridge it raises in the moss runs on.
  const rngR = makeRng(hashSeed('ps-roots:' + (ctx.seed ?? 1))), greatRoots = [];
  for (const [deg, reach] of [[64, 12.2], [118, 10.6], [14, 12.4], [-42, 12.8], [-112, 11.2], [172, 10.8]]) {
    const az = (deg + rngR.range(-7, 7)) * Math.PI / 180, sd = rngR.range(0, 100), wig = rngR.range(0.5, 0.9) * rngR.sign(), len = reach * rngR.range(0.9, 1.08), P = [];
    for (let i = 0; i <= 22; i++) { const r = 1.1 + (len - 1.1) * i / 22, a = az + wig * 0.42 * ctx.noise.n2(r * 0.22 + sd, 3.3) * Math.min(1, r / 5); P.push([Math.sin(a) * r, Math.cos(a) * r]); }
    let wood = 0;
    for (let i = 1; i <= 22; i++) { if (flyDist(P[i][0], 0.7, P[i][1]) < CLEAR + 0.5 || i > 16) break; wood = i / 22; }
    greatRoots.push({ P, sd, h: rngR.range(0.34, 0.5), wood });
  }
  const mound = makeMound(ctx.noise, rngG.range(0, 50), greatRoots);

  // ----- wood -----
  await ctx.yield();
  const limbs = await buildLimbs(ctx, rngL, mound, greatRoots.filter((r) => r.wood > 0.12));
  const wood = new THREE.Mesh(limbs.geometry, woodMaterial(U, C)); wood.name = 'cherry-limbs'; object.add(wood);
  await ctx.yield();

  // ----- mound -----
  let baseTris = 0;
  if (opts.base !== false) {
    const b = await buildBase(rngG, ctx.noise, mound, ctx.yield ? () => ctx.yield() : null); baseTris = b.tris;
    const m = new THREE.Mesh(b.geometry, baseMaterial(U, C)); m.name = 'cherry-mound'; object.add(m);
    await ctx.yield();
  }

  // ----- strands -----
  const cand = limbs.cand, cum = new Float32Array(cand.length); let tot = 0;
  for (let i = 0; i < cand.length; i++) { tot += cand[i].w; cum[i] = tot; }
  const pickCand = (r) => { const x = r * tot; let lo = 0, hi = cand.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < x) lo = mid + 1; else hi = mid; } return cand[lo]; };
  // The curtain is hung in HANKS: the outer skirt is gathered into two dozen cascades with dark partings between them, some
  // sweeping the moss and some stopping short, so that from across the valley the crown reads as a dome of separate falls with
  // the trunk and limbs showing through, not as a wall. The east wall (beside the corridor) stays close-hung. On top of the
  // strands drawn from the limbs come three hand-placed sets: a lintel over the corridor, the two jambs of the way out, and a
  // cap of short strands that rounds the top of the dome.
  const nBase = Math.max(200, Math.round(opts.strands ?? 1650)), nLint = Math.round(nBase * 0.06), nExit = Math.round(nBase * 0.13), nCap = Math.round(nBase * 0.07);
  const nS = nBase + nLint + nExit + nCap;
  const sA = new Float32Array(nS * 4), sB = new Float32Array(nS * 4), sC = new Float32Array(nS * 4);
  const sW = new Float32Array(nS), sT = new Float32Array(nS); let wTot = 0, lTot = 0;
  const wh = U.uWindH.value, cen = U.uCentre.value;
  const NH = 26, hanks = [];
  for (let k = 0; k < NH; k++) hanks.push({ c: ((k + 0.5 + rngS.range(-0.2, 0.2)) / NH) * 6.2832, low: rngS() < 0.62 ? rngS.range(0.7, 1.9) : rngS.range(3.2, 6.0) });
  const nearCand = (x, z, yMin) => {
    let best = cand[0], bd = 1e9;
    for (let k = 0; k < cand.length; k++) { const c = cand[k]; if (c.b.y < yMin) continue; const d = (c.b.x - x) ** 2 + (c.b.z - z) ** 2 + 0.02 * (c.b.y - yMin) ** 2; if (d < bd) { bd = d; best = c; } }
    return best;
  };
  for (let i = 0; i < nS; i++) {
    if (i % 400 === 399) await ctx.yield();
    let ax, ay, az, ex, ez, endY, La, out, kind = 0;
    if (i < nBase) {
      const c = pickCand(rngS()), f = rngS();
      ax = lerp(c.a.x, c.b.x, f); ay = lerp(c.a.y, c.b.y, f) - c.r * 0.5; az = lerp(c.a.z, c.b.z, f);
      out = Math.atan2(ax, az) + rngS.range(-0.75, 0.75); La = c.up ? rngS.range(1.3, 3.1) : rngS.range(0.7, 2.3);
      {                                                                        // no twig arches out past the dome: the top stays round
        const rd = (CROWN_R - 0.4) * Math.sqrt(Math.max(0.05, 1 - ((ay - 0.6) / (CROWN_H + 0.5)) ** 2)) + 0.5, ra = Math.hypot(ax, az);
        if (ra + 0.9 * La > rd) La = Math.max(0.35, (rd - ra) / 0.9);
      }
      ex = ax + Math.sin(out) * 0.9 * La; ez = az + Math.cos(out) * 0.9 * La;
      const re = Math.hypot(ex, ez), r1 = rngS(), r2 = rngS(), r3 = rngS();
      endY = re > 10 ? lerp(0.7, 2.4, r1) : re > 6.5 ? lerp(1.2, 5.5, r1) : lerp(3.5, 9, r1);
      if (re > 8.2) {                                                          // gather it into its hank
        let phi = Math.atan2(ex, ez); if (phi < 0) phi += 6.2832;
        const h = hanks[Math.min(NH - 1, Math.floor((phi / 6.2832) * NH))];
        let d = phi - h.c; if (d > Math.PI) d -= 6.2832; if (d < -Math.PI) d += 6.2832;
        const east = smoothstep(0.15, 0.75, Math.sin(phi)), comp = lerp(0.4, 0.88, east), p2 = h.c + d * comp;
        const tx = Math.sin(p2) * re, tz = Math.cos(p2) * re, dd = Math.hypot(tx - ax, tz - az);
        out = Math.atan2(tx - ax, tz - az); La = clamp(dd / 0.9, 0.35, 3.4);
        ex = ax + Math.sin(out) * 0.9 * La; ez = az + Math.cos(out) * 0.9 * La;
        const hem = h.low + 2.4 * Math.min(1, Math.abs(d) / (Math.PI / NH)) * (0.4 + 0.6 * r2) + (re < 10 ? 2.2 * r3 : 0);
        endY = lerp(hem, endY, east);
      }
    } else if (i < nBase + nLint) {                                            // the lintel: a fringe over the corridor, thickest at the way out
      kind = 1; ex = FLY_X + rngS.range(-1.45, 1.45); ez = -15.2 + 29 * Math.pow(rngS(), 1.8); endY = rngS.range(4.7, 5.8);
    } else if (i < nBase + nLint + nExit) {                                    // the jambs of the way out, either side of the slot
      kind = 2; ex = FLY_X + rngS.sign() * rngS.range(1.6, 7.6); ez = rngS.range(-15.6, -5.2); endY = rngS.range(0.9, 2.3);
    } else {                                                                   // the cap
      kind = 3; const a = rngS.range(0, 6.2832), r = 9.5 * Math.sqrt(rngS()); ex = Math.sin(a) * r; ez = Math.cos(a) * r; endY = rngS.range(6.5, 11.5) - 0.25 * r;
    }
    if (kind) {
      const re = Math.hypot(ex, ez); if (re > 15.3) { ex *= 15.3 / re; ez *= 15.3 / re; }
      const c = nearCand(ex, ez, endY + (kind === 3 ? 5.5 : 4.2)), f = rngS();
      ax = lerp(c.a.x, c.b.x, f); ay = lerp(c.a.y, c.b.y, f) - c.r * 0.5; az = lerp(c.a.z, c.b.z, f);
      const dd = Math.hypot(ex - ax, ez - az);
      out = dd > 0.05 ? Math.atan2(ex - ax, ez - az) : rngS.range(0, 6.2832); La = clamp(dd / 0.9, 0.7, 3.4);
      ex = ax + Math.sin(out) * 0.9 * La; ez = az + Math.cos(out) * 0.9 * La;
    }
    // THE TWO GREAT OPENINGS. Toward the entry (south) the curtain is drawn up like a drape from the western hanks to the
    // corridor, and every strand between the trunk and that side stops short above head height: from down the stream, and
    // from the lane as we come in, the trunk and the fan of its limbs stand in full view in a hall of blossom. A second,
    // narrower arch opens north-west, toward the homeward leg.
    {
      const nz = ctx.noise.n2(ex * 0.9 + 3.1, ez * 0.9 - 1.7), nz2 = ctx.noise.n2(ex * 0.31 - 5.2, ez * 0.31 + 8.4);
      if (ez > 1.0) {
        const cxo = 0.6 + 1.2 * nz2, k = (ex < cxo ? 1 - smoothstep(5.6, 8.6, cxo - ex) : 1 - smoothstep(8.9, 10.5, ex)) * smoothstep(1.0, 3.2, ez);
        const top = ex < cxo ? lerp(11.4, 3.4, Math.pow(clamp((cxo - ex) / 8.6, 0, 1), 1.8)) : lerp(11.4, 7.2, smoothstep(cxo, 8, ex));
        if (k > 0) endY = Math.max(endY, lerp(endY, top + 1.2 * nz + 1.6 * Math.max(0, nz2), k));
      }
      const al = -(ex + ez) * 0.7071, lat = Math.abs(ex - ez) * 0.7071;
      if (al > 1.0) {
        const hw = lerp(2.8, 5.4, clamp(Math.hypot(ex, ez) / 15, 0, 1)), k = (1 - smoothstep(hw * 0.7, hw * 1.12, lat)) * smoothstep(1.0, 3.0, al);
        if (k > 0) endY = Math.max(endY, lerp(endY, 9.0 * (1 - 0.5 * (lat / hw) ** 2) + 1.1 * nz, k));
      }
    }
    const re = Math.hypot(ex, ez);
    // the window beside the lane: nothing hangs between the lens and the great limb, so the limb closes the left of the view
    const dead = ex > 1.4 && ex < FLY_X - 1.5 && ez > -13.2 && ez < -3.2 && (ay < 7.4 || kind === 2);
    const inLane = Math.abs(ex - FLY_X) < 1.5 && Math.abs(ez) < 19;
    if (inLane) endY = Math.max(endY, kind === 1 ? 4.7 : rngS.range(5.6, 7.5));   // the parting the camera flies down
    if (re < 3.2) endY = Math.max(endY, 6.5);                                  // nothing draped over the trunk
    if (!dead && ex > 1.4 && ex < FLY_X - 1.5 && ez > -13.2 && ez < -3.2) endY = Math.max(endY, 7.2);
    const L = dead ? 0.02 : clamp(ay - endY + La, 2.2, 16.5);
    const rel = clamp(0.5 + 0.5 * ((ax - cen.x) * wh.x + (az - cen.z) * wh.z) / CROWN_R + rngS.range(-0.1, 0.1), 0, 1);
    const tint = clamp(rngS.range(0.3, 0.92) + 0.25 * ctx.noise.n2(ax * 0.12 + 7, az * 0.12), 0, 1);
    sA.set([ax, ay, az, L], i * 4); sB.set([out, La, rngS.range(0, 6.28), rel], i * 4);
    sC.set([rngS.int(0, 3) + 0.5, tint, rngS.range(0.85, 1.25), rngS()], i * 4);
    const dz = Math.max(0, Math.abs(ez) - 20), dl = Math.hypot(ex - FLY_X, dz);
    sW[i] = (wTot += L * (dl < 7.5 && endY < 6 ? 7 : 1)); sT[i] = (lTot += L);
  }
  const pickBy = (arr, total, r) => { const x = r * total; let lo = 0, hi = nS - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < x) lo = mid + 1; else hi = mid; } return lo; };
  const big = new THREE.Sphere(V3(0, 10, 0), 46), parts = {};                // the curtain swung right up still lies inside it
  let atlas = null;
  {
    const rows = [0, 0.06, 0.13, 0.22, 0.36, 0.55, 0.77, 1], p = [], ix = [];
    rows.forEach((t, i) => { p.push(-0.5, t, 0, 0.5, t, 0); if (i > 0) { const a = (i - 1) * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix);
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(sA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(sB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(sC, 4));
    g.instanceCount = nS; g.boundingSphere = big;
    atlas = makeAtlas(rngA, season === 'early' ? 0.4 : 0.14);
    const m = new THREE.Mesh(g, strandMaterial(U, C, atlas)); m.name = 'cherry-strands'; object.add(m); parts.strands = m;
  }
  await ctx.yield();

  // ----- true blossoms, most of them beside the corridor -----
  const nB = Math.max(500, Math.round((opts.blossoms ?? 7000) * density * (0.5 + 0.5 * detail)));
  {
    const iA = new Float32Array(nB * 4), iB = new Float32Array(nB * 4), iC = new Float32Array(nB * 4), iD = new Float32Array(nB);
    for (let i = 0; i < nB; i++) {
      const s = pickBy(sW, wTot, rngB()) * 4;
      iA.set(sA.subarray(s, s + 4), i * 4); iB.set(sB.subarray(s, s + 4), i * 4);
      iC.set([0.05 + 0.95 * Math.pow(rngB(), 0.85), rngB(), rngB.range(0.03, 0.17), rngB()], i * 4);
      iD[i] = clamp(sC[s + 1] + rngB.range(-0.2, 0.2), 0, 1);
    }
    const g = new THREE.InstancedBufferGeometry(), bg = blossomGeometry();
    g.setAttribute('position', bg.getAttribute('position')); g.setAttribute('normal', bg.getAttribute('normal')); g.setAttribute('aQ', bg.getAttribute('aQ'));
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 1));
    g.instanceCount = nB; g.boundingSphere = big;
    const m = new THREE.Mesh(g, blossomMaterial(U, C)); m.name = 'cherry-blossoms'; object.add(m); parts.blossoms = m;
  }
  await ctx.yield();

  // ----- petals -----
  const nP = Math.max(2000, Math.round((opts.petals ?? 44000) * density * detail));
  {
    const iA = new Float32Array(nP * 4), iB = new Float32Array(nP * 4), iC = new Float32Array(nP * 4), iD = new Float32Array(nP * 4), iG = new Float32Array(nP * 4);
    // where last week's fall lies: in windrows along the wind, in a broken ring under the hem, thin on the hummocks and none on the roots
    const rngF = makeRng(hashSeed('ps-fallen:' + (ctx.seed ?? 1))), I4 = [0, 0, 0, 0];
    // (the mound is read once on a half-metre lattice: where the petals may lie, how high the moss stands and where a root runs)
    const GN = 65, gDen = new Float32Array(GN * GN), gRid = new Float32Array(GN * GN), gTop = new Float32Array(GN * GN);
    for (let j = 0; j < GN; j++) {
      for (let i = 0; i < GN; i++) {
        const x = -16 + i * 0.5, z = -16 + j * 0.5; mound.info(x, z, I4);
        const w1 = ctx.noise.n2(x * 0.16 + 7.7, z * 0.16 - 3.1), w2 = ctx.noise.n2((x * 0.75 + z * 0.66) * 0.11, (z * 0.75 - x * 0.66) * 0.5 + 5.0);
        gDen[j * GN + i] = 0.16 + 0.6 * smoothstep(0.1, 0.5, w2) * smoothstep(-0.1, 0.35, w1) - 0.4 * I4[1] - 1.2 * I4[2];
        gRid[j * GN + i] = I4[2]; gTop[j * GN + i] = I4[0];
      }
      if ((j & 7) === 7) await ctx.yield();
    }
    const gAt = (G, x, z) => { const fx = clamp((x + 16) * 2, 0, GN - 1.001), fz = clamp((z + 16) * 2, 0, GN - 1.001), i0 = Math.floor(fx), j0 = Math.floor(fz), u = fx - i0, v = fz - j0, o = j0 * GN + i0; return (G[o] * (1 - u) + G[o + 1] * u) * (1 - v) + (G[o + GN] * (1 - u) + G[o + GN + 1] * u) * v; };
    for (let i = 0; i < nP; i++) {
      const s = pickBy(sT, lTot, rngP()) * 4;
      iA.set(sA.subarray(s, s + 4), i * 4); iB.set(sB.subarray(s, s + 4), i * 4);
      iC.set([0.04 + 0.96 * rngP(), rngP(), rngP(), rngP()], i * 4);
      iD.set([rngP(), rngP.range(0.02, 0.2), clamp(sC[s + 1] + rngP.range(-0.25, 0.25), 0, 1), rngP()], i * 4);
      if (iD[i * 4 + 3] >= 0.4) {
        let x = 0, z = 6, y = 0;
        for (let k = 0; k < 5; k++) {
          const a = rngF.range(0, 6.2832), r = Math.sqrt(rngF.range(2.6 * 2.6, 15.6 * 15.6)); x = Math.sin(a) * r; z = Math.cos(a) * r;
          const den = 0.45 * Math.exp(-(((r - 13.2) / 2.3) ** 2)) + gAt(gDen, x, z);
          if (rngF() < den) break;
        }
        y = gAt(gRid, x, z) > 0.015 ? mound.info(x, z, I4)[0] : gAt(gTop, x, z);
        iG.set([x, y, z, rngF()], i * 4);
      }
      if (i % 1000 === 999) await ctx.yield();
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.1, 0, -0.75, 1.15, 0, 0.75, 1.15, 0], 3));
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4));
    g.setAttribute('iG', new THREE.InstancedBufferAttribute(iG, 4));
    g.instanceCount = nP; g.boundingSphere = new THREE.Sphere(V3(U.uWindH.value.x * 30, 32, U.uWindH.value.z * 30), 104);   // the spiral, and where it leans away to
    const m = new THREE.Mesh(g, petalMaterial(U, C)); m.name = 'cherry-petals'; object.add(m); parts.petals = m;
  }
  await ctx.yield();

  // ----- anchors -----
  const W = U.uWind.value.clone();
  const anchors = {
    trunkBase: V3(0, 0, 0), crownCentre: V3(0, 10.5, 0), crownTop: V3(0, limbs.topY + 1, 0),
    flyThrough: [V3(FLY_X, FLY_Y, 30), V3(FLY_X, FLY_Y, 15), V3(FLY_X, FLY_Y, 5), V3(FLY_X, FLY_Y, -5), V3(FLY_X, FLY_Y, -15), V3(FLY_X, FLY_Y + 0.5, -30)],
    partingIn: V3(FLY_X, FLY_Y, 12.7), partingOut: V3(FLY_X, FLY_Y, -12.7),
    secondPass: [V3(-22, 20, -40), V3(-22, 20, -15), V3(-22, 20, 0), V3(-22, 20, 15), V3(-22, 20, 40)],
    viewpoints: {
      entry: { position: V3(FLY_X, -11, 180), target: V3(0, 9, 0) },
      under: { position: V3(FLY_X, FLY_Y, 6), target: V3(12, 5, -3) },
      above: { position: V3(-10, 22, -78), target: V3(0, 9, 0) },
      strip: { position: V3(-22, 20, -4), target: V3(0, 10, 4) },
    },
    windDir: W, windward: V3(-U.uWindH.value.x, 0, -U.uWindH.value.z),
    flockStart: V3(11.5, 5, 1),
    portalSeat: { position: V3(0, 12, 0).addScaledVector(W, 215), facing: V3(-U.uWindH.value.x, 0, -U.uWindH.value.z) },
    petalCloud: { origin: V3(0, 10.5, 0), dir: W, speed: U.uSpeed.value, life: U.uLife.value },
    clearance: 6,
  };

  // ----- driving -----
  const uHit = opts.uHit ?? 0.66, uEnd = Math.max(uHit + 1e-3, opts.uEnd ?? 0.72), demo = opts.demo !== false;
  let driven = false, uNow = 0, gustSec = null, clock = -30, sunLight = null, sunSearch = 0;
  const buf = new THREE.Vector2(), _c = V3(0, 0, 0), _d = V3(0, 0, 0), _qt = new THREE.Quaternion();
  const stripMax = clamp(opts.strip ?? 0, 0, 1);                // 0: the gust strips nothing; 1: it strips the windward half
  const stripAmount = () => stripMax * clamp((clock - 1) / 5, 0, 1);
  const liftAmount = () => smoothstep(-1.5, 2.1, clock)*(1 - 0.36 * smoothstep(3.2, 8.0, clock));

  const hero = {
    object, radius: 16, height: CROWN_H, center: V3(0, 10, 0), anchors, ground: true, groundY: 0,
    stats: { limbTris: limbs.tris, baseTris, strands: nS, blossoms: nB, petals: nP },
    setProgress(u) { driven = true; uNow = u; },
    setGust(sec) { gustSec = sec; },
    setWind(v) { setWind(v); anchors.windDir.copy(U.uWind.value); },
    setSun(gain) { U.uSunGain.value = gain; },
    clock: () => clock, stripAmount, liftAmount, parts,
    moundAt: (x, z) => mound(x, z),          // local height of the moss at local (x, z)
    uniforms: U,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (ctx.renderer?.getDrawingBufferSize) U.uViewH.value = ctx.renderer.getDrawingBufferSize(buf).y || 1080;
      if (gustSec != null) clock = gustSec;
      else if (driven) clock = clamp((3 * (uNow - uHit)) / (uEnd - uHit), -30, 60);
      else if (demo) clock = (time % 30) - 18;
      else clock = -30;
      U.uClock.value = clock;
      U.uStrip.value = stripMax * clamp((clock - 1) / 5, 0, 1) * 1.2;          // the windward half is stripped over five seconds of the gust clock
      const bare = Math.max(U.uShed.value * 0.5, 0.3 * stripAmount());
      U.uBare.value = bare;
      // the crown's shadow on the moss follows the scene's sun
      if (!sunLight && sunSearch-- <= 0) {
        sunSearch = 40; let root = object; while (root.parent) root = root.parent;
        root.traverse((o) => { if (!sunLight && o.isDirectionalLight) sunLight = o; });
      }
      if (sunLight) {
        _d.setFromMatrixPosition(sunLight.matrixWorld).sub(_c.setFromMatrixPosition(sunLight.target.matrixWorld));
        if (_d.lengthSq() > 1e-8) {
          _d.normalize().applyQuaternion(object.getWorldQuaternion(_qt).invert());
          U.uSunL.value.copy(_d);
          const k = Math.min(9 / Math.max(_d.y, 0.3), 22);
          U.uShade.value.set(-_d.x * k, -_d.z * k, 14, 0.8 * (1 - 0.75 * bare));
        }
      }
    },
    dispose() { atlas?.dispose(); },
  };
  return hero;
}
