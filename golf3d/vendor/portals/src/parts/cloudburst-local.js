// THE CLEARING: hero set piece of "The Cloudburst Local".
//
// The whole far end of the line, washed and gold: a wet track throat in which four approach lines fan
// through points into sixteen platform roads, three lattice signal gantries carrying thirty semaphore
// arms with red/green spectacle lamps, a signal cabin on stilts, water columns, rodding, ground discs,
// platform ramps; then the train shed (four 25 m iron spans, crowns 21 m, 140 m long: stone gable
// piers, plate-girder gable arches with glazed lunettes and a fretted valance, lattice ribs on cast
// columns, corrugated and glazed roof, ridge ventilators, hanging gas lamps, platforms with barrows,
// crates, churns and tea urns, buffer stops) breathing steam from its four mouths; and behind it the
// buff stone head building with pointed arcades, striped voussoirs, gables, six turrets and the great
// ribbed dome with lantern and finial, 73 m up, almost on the camera's axis.
//
// LOCAL SPACE = the brief's space. Origin on the camera's line at rail level under the country gable
//   of the shed. +Y up. The camera arrives from +Z heading -Z ("front" faces +Z). +X is west (the sun
//   side, the camera's right). Throat z 300..0 (x -75..50), shed z 0..-140 (x -62.5..37.5, span
//   centres x -50, -25, 0, 25), head building z -146..-190, dome axis (-12, -166).
//   Drop the object at the brief's origin unrotated and the brief's path runs through it.
// SIZE   The piece is 490 m long, 125 m wide and 73 m high (hero.extent = { min, max }). The returned
//        radius 78 / height 26 / center (-8, 8, 25) frame the shed mouth for the set-piece viewer.
// COST   about 83k triangles in 11 draw calls (ground 1, track ribbons 1, throat 1, arms 1, shed 1,
//        platforms 1, terminus 1, steam 1, shafts 1, drips 1, lamp glows 1). No lights, no textures.
//        Build about 160-220 ms in six yielded steps. All motion is in shaders.
// LIGHT  Every surface is shaded by the piece's own shaders (they ignore scene lights and use scene
//        fog): a low sun from front-right (brief: 60 deg right of -Z, 15 deg up = local
//        (0.836, 0.259, -0.483)), full gold, with a cool blue fill from the storm side (-X). Feed it
//        the world's weather with hero.setLight({ sunDir, sunColor, sun, sky, horizon, storm,
//        stormDir, ambient, ground, fill, wet }) (colours as hex strings or THREE.Color; sun 0..1).
//        Wet surfaces mirror an analytic sky (horizon / sky / storm wall toward stormDir) and
//        puddles also mirror the shed gable, the dome and the gantries analytically.
//
// PROGRESS  hero.setProgress(u), u = the world's 0..1 path progress (never wall-clock). It drives
//   - the edge of sunlight racing over the ground toward the train (u 0.40..0.52), cloud shadow
//     before it; hero.uniforms.uEdge can be set directly instead (xy dir, z offset, w softness)
//   - freshness (u 0.5..0.75): the first seconds of sun have the strongest glints, puddle rings from
//     the last drops, ground steam and valance drips, then settle
//   - the thirty semaphore arms and their lamps (each arm has its own u at which it drops or rises;
//     the arms over our own road drop as the train approaches each gantry)
//   Default (never called) is the settled moment just after the clearing, u = 0.56.
//   hero.setSun(s) overrides sun strength 0..1 alone; setProgress does not touch sun strength
//   unless opts.autoSun is true (0 until u 0.40, 1 by 0.52).
//
// opts
//   palette   brief palette [indigo, rain grey, maroon, cream, signal blue, brass gold, buff stone]
//   throat    300: length of the throat in metres (tracks start at z = throat)
//   straightFrom   the z at which the route's last straight to the buffers begins (default: the head of the throat); the
//             first gantry's dolls keep clear of the sight lines to the dome from every eye on it
//   steam, shafts, drips, lamps   true: the animated layers (pass false to bring your own)
//   ground    true: the wet ballast plane of the throat and the shed floor (world can lay terrain
//             up to its edge: x -75..50, z -146..throat+4, y 0)
//   autoSun   false (see PROGRESS).   sunDir  local direction to the sun (default the brief's)
//
// anchors (local space)
//   portalSeat      { position (0, 2.9, -140), facing (0,0,1), width 14, height 19 }: the 14 m arch in
//                   the last iron arch of the camera's span; a stone arch behind it frames it
//   flyThrough      camera line, x 0, y 2.9, z 300 -> -140. Our own train and the platform edge
//                   aside (edge at x -0.4, top y 1.05, as the brief asks; luggage piles from x 2.5), nothing solid is within
//                   6 m: columns at x +-12.5, gantry bridges clear y 7.6, valance clears y 13.8
//   ourTrack / rivalTrack / tracks   [x, z] polylines of the rails' centrelines (ours is x -2.6 all
//                   the way; rival's fast line starts at x +2.4 and takes the road at x 6.4);
//                   tracks[i] = { x (at the buffers), pts, from, end } for all 16 roads (then the sidings)
//   gantries        [{ z, y0 (underside), y1 (walkway), xl, xr, perches: [Vector3], band }] for crows (band: the stretch
//                   [left, right] of the first gantry kept clear of dolls for the dome, null on the others)
//   sidings         [x, z] polylines of the empty stub sidings either side (room for stored wagons);
//                   waterTank: top of the riveted tank on its trestle (west side), when the seed has one
//   cabin           signal cabin floor centre;  waterColumns: their spouts
//   shedMouths      crown centres of the four gable arches;  steamVents: where steam leaves
//   standingEngines [{ position (rail level, chimney end), heading }] at the buffers of other roads
//   departRoad      the track a departing express can take out of the first (west) span
//   platformEnds    tops of the platform ramps (umbrellas);  pigeons: roosts on the tie bars
//   dome, finial, turrets   tops, for gaze and birds;  viewpoints: clearing, throat, shed, flank
//   sunDir          the sun direction the piece is lit with
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#2B2F52', '#7C8C9A', '#6E1F26', '#EAD9B0', '#1F6FC0', '#FFC56B', '#B79A6A'];

// material kinds carried per vertex (attribute aK)
const K = { IRON: 0, STONE: 1, ARCADE: 2, CORR: 3, GLASS: 4, WOOD: 5, PAVE: 6, BRICK: 7, LATTICE: 8,
  VALANCE: 9, GLOW: 10, SLATE: 11, MATTE: 12, ARCLIT: 13, BRASS: 14,
  CHAWL: 15, VIADUCT: 16, COACH: 17, TILE: 18, DOME: 19, FIRE: 20, SPILL: 21, RAIL: 22, PAINT: 23, COAL: 24 };

// ---------------------------------------------------------------- shared GLSL
const GLSL_COMMON = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizCol, uStormCol, uAmbCol, uGroundCol, uFillCol, uStormDir;
uniform float uSun, uWet, uFresh, uTime, uLamp, uRain;
uniform vec4 uPud[6];       // the placed puddles on the throat's ground: centre x, z and half sizes (0 = none)
uniform vec4 uEdge;
uniform vec4 uGndK;       // the ground by hour: wet ballast albedo, sky mirror, hard shadow under the gantries, ground steam
uniform vec2 uPaintLo;    // the least an engine's enamel shows in its weaker channels (red or green, blue), set by the hour's exposure and tint
float gSkyK = 1., gSpecK = 1., gSunK = 1.;      // set by the ground shaders before shadeSurf: sky mirror, broad sun lobe, cast shadow
vec3 gSheenT = vec3(1.);                         // set by the surface shader: the hue an engine's enamel gives the sky it carries (white: bare wet iron)
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .25 + vn(p * 4.1 + 3.7) * .125 + vn(p * 8.3 + 1.3) * .125; }
// analytic sky used for reflections: lemon horizon, clear blue above, the indigo wall toward uStormDir
vec3 skyRefl(vec3 d){
  float h = clamp(d.y, 0., 1.);
  vec3 c = mix(uHorizCol, uSkyCol, smoothstep(.06, .8, h));
  vec2 dh = d.xz + vec2(1e-4, 0.);
  float s = dot(dh / max(length(dh), 1e-4), uStormDir.xz);
  c = mix(c, uStormCol, smoothstep(-.25, .6, s) * smoothstep(.015, .2, h) * .9);
  return c;
}
// height of the shed roof skin over x (semicircular spans on 8.5 m columns)
float roofY(float x){ float xs = mod(x + 62.5, 25.) - 12.5; return 8.5 + sqrt(max(156.25 - xs * xs, 0.)); }
float inShed(vec3 p){
  return step(p.z, .3) * step(-141., p.z) * step(abs(p.x + 12.5), 50.4) * step(p.y, roofY(p.x) - .25);
}
// 1 = direct sun reaches p (cloud-shadow edge outside, shafts through the west flank inside)
float sunVis(vec3 p){
  float e = smoothstep(-uEdge.w, uEdge.w, uEdge.z - dot(p.xz, uEdge.xy));
  float ins = inShed(p);
  float t = (37.5 - p.x) / max(uSunDir.x, .05);
  vec3 q = p + uSunDir * t;
  float bay = abs(fract(q.z / 17.5 + .25) - .5);
  float stripe = smoothstep(.2, .09, bay);
  float low = smoothstep(9.2, 7.6, q.y) * smoothstep(.07, .12, abs(fract(q.z / 8.75) - .5) + .07);
  float high = stripe * smoothstep(19., 15., q.y) * .85;
  float shaft = max(low, high) * smoothstep(-141., -134., p.z) * smoothstep(-6., 3., q.z);
  return e * mix(1., shaft, ins);
}
float shedAO(vec3 p){ return mix(1., .5 + .3 * smoothstep(-30., 0., p.z), inShed(p)); }
// the shed's hanging gas lamps (one under each crown, every third rib): a warm pool round each and a low glow under the whole roof
vec3 shedLamps(vec3 p, vec3 N){
  float xs = mod(p.x + 62.5, 25.) - 12.5, zl = mod(p.z + 30.625, 26.25) - 13.125;
  vec3 L = vec3(-xs, 9.6 - p.y, -zl);
  float d2 = dot(L, L);
  float ndl = max(dot(N, L) / sqrt(d2 + 1e-3) * .6 + .4, 0.);
  float pool = (1. - smoothstep(150., 400., d2)) / (1. + d2 / 50.);
  return vec3(1.5, .86, .36) * (inShed(p) * max(uLamp, .4) * (.1 + .6 * pool * ndl));
}
vec3 shadeSurf(vec3 alb, vec3 N, vec3 V, vec3 pL, float gloss, float wet){
  float vis = sunVis(pL) * gSunK;
  float ao = shedAO(pL);
  float ndl = dot(N, uSunDir);
  float dif = clamp(ndl * .8 + .2, 0., 1.);
  vec3 sun = uSunCol * (uSun * vis * dif);
  vec3 amb = mix(uGroundCol, uAmbCol, N.y * .5 + .5) * ao;
  amb += uFillCol * (max(dot(N, uStormDir), 0.) * .6 + .1) * ao;
  amb += uSunCol * uSun * .06 * ao * (1. - .5 * N.y);            // warm bounce off wet ground
  amb += uSunCol * (uSun * inShed(pL) * (.04 + .13 * max(N.x, 0.)) * smoothstep(-80., 37., pL.x));   // glow of the west arcade
  amb += shedLamps(pL, N);
  vec3 a = alb * mix(1., .62, wet);
  vec3 col = a * (sun + amb);
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  float nh = max(dot(N, H), 0.);
  float sp = pow(nh, mix(14., 90., gloss)) * (.12 + 1.6 * wet) * gloss;
  col += uSunCol * (uSun * vis * sp * step(0., ndl) * gSpecK);
  float F = 1. - max(dot(N, V), 0.); F = F * F * F * F * F;
  vec3 Rr = reflect(-V, N);
  col += skyRefl(Rr) * mix(gSheenT, vec3(1.), .4) * (F * (.08 + .55 * wet) * gloss * ao * gSkyK);
  float up = max(Rr.y, 0.);
  col += uAmbCol * gSheenT * (up * up * wet * gloss * .5 * (1. - .8 * uSun) * ao);     // overcast sheen on wet iron and roofs
  return col;
}
`;

const SURF_VERT = /* glsl */`
attribute vec3 aCol; attribute float aK;
#ifdef ARMS
attribute vec4 aPiv; attribute vec3 aArm; uniform float uProg;
#endif
varying vec3 vL, vN, vC; varying vec2 vUv; varying float vK;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal;
#ifdef ARMS
  // semaphore arm: rotate about the pivot's Z axis. aArm = (drop angle, state before, bounce phase)
  float s = smoothstep(aPiv.w, aPiv.w + .022, uProg);
  float st = mix(aArm.y, 1. - aArm.y, s);
  float bounce = sin((uProg - aPiv.w) * 900.) * exp(-max(uProg - aPiv.w, 0.) * 160.) * step(aPiv.w, uProg) * .12;
  float a = aArm.x * (st + bounce);
  float ca = cos(a), sa = sin(a);
  vec2 d = p.xy - aPiv.xy;
  p.xy = aPiv.xy + vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca);
  n.xy = vec2(n.x * ca - n.y * sa, n.x * sa + n.y * ca);
#endif
  vL = p; vN = n; vC = aCol; vUv = uv; vK = aK;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SURF_FRAG = /* glsl */`
uniform vec3 uCamL;
#ifdef DOOR
uniform float uRainCam; uniform vec2 uTrackR;
#endif
varying vec3 vL, vN, vC; varying vec2 vUv; varying float vK;
#ifdef TINTED
varying float vLit;
#endif
#include <fog_pars_fragment>
${GLSL_COMMON}
// rain on a wet side: separate threads of water, each with beads running down it (c: metres across the side, y: metres up,
// fc: how much of c one pixel covers). A thread is never thinner than a pixel and a half; where the threads would be finer
// than the pixels the side takes their average, so nothing is ever stretched into a smear
float rivulets(float c, float y, float fc){
  float q = c / .034, id = floor(q), fx = abs(fract(q) - .5), h = h21(vec2(id, 7.31));
  float aa = max(fc / .034, 1e-3);
  float hw = .07 + .09 * fract(h * 13.7);
  float line = 1. - smoothstep(hw, hw + aa * 1.5, fx);
  float ph = fract(y * (.5 + .7 * fract(h * 3.1)) + uTime * (.25 + .9 * fract(h * 5.3)) + h * 9.);
  float bead = smoothstep(0., .05, ph) * (1. - smoothstep(.05, .5, ph));
  return mix(.14, step(.5, h) * line * (.2 + .8 * bead), 1. - smoothstep(.25, .6, aa));
}
void main(){
  int k = int(vK + .5);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCamL - vL + vec3(0., 1e-4, 0.));
  vec2 uv = vUv;
  vec2 fw = fwidth(uv);
  vec2 qd = dFdx(uv) * dFdx(vL.y) + dFdy(uv) * dFdy(vL.y);    // which way the uv runs downhill: rain streaks follow it
  float acr = abs(qd.x) > abs(qd.y) ? uv.y : uv.x;
  float fwa = abs(qd.x) > abs(qd.y) ? fw.y : fw.x;
  float uvm = fwa / max(length(fwidth(vL)), 1e-6);             // uv per metre across the fall line: rivulets are drawn only where the uv is laid in metres
  float magK = smoothstep(.002, .02, max(fw.x, fw.y));        // 0 under magnification: stretched noise is left out an arm's length away
  vec3 alb = vC; float gloss = .3; vec3 col; bool done = false; vec3 emi = vec3(0.); float rimK = 0., ironK = 0., run = .5, sheenK = 0., glassK = 0., dryG = 0., paintP = 0., paintK = 0.; vec2 gq = vec2(0.); vec3 pT = vec3(1.), pH = vec3(1.);
  vec3 pS = vL + N * .45;
  float ins = inShed(pS);
  float wet = uWet * (1. - ins * .85) * smoothstep(-.6, .3, N.y + .35);
#ifdef DOOR
  wet = 0.;                                                   // inside our own doorway nothing is wet
#endif
  float n1 = fbm(uv * .7), n2 = vn(uv * 9.);
  if (k == ${K.LATTICE}) {
    float fx = fract(uv.x);
    float t = .075 + max(fw.x, fw.y) * .8;
    float m = min(abs(fx - uv.y), abs(fx - (1. - uv.y))) * .707;
    m = min(m, min(fx, 1. - fx));
    m = min(m, min(uv.y, 1. - uv.y) - .05);
    if (m > t) discard;
    k = ${K.IRON};
  }
  if (k == ${K.RAIL}) {
    // an open iron railing: uv.x in 1.6 m bays, uv.y 0..1 over its height. A top rail, a low rail, posts and thin balusters,
    // which drop out with distance instead of closing up, so the town shows through it
    float px = abs(fract(uv.x) - .5), bx = abs(fract(uv.x * 8.) - .5);
    float top = step(1. - uv.y, max(.09, fw.y * 1.6));
    float low = step(abs(uv.y - .1), max(.035, fw.y * .8)) * step(fw.y, .25);
    float post = step(.5 - px, max(.03, fw.x * .8)) * step(fw.x, .16);
    float bal = step(bx, .14) * step(fw.x * 8., .32) * step(uv.y, .93);
    if (max(max(top, low), max(post, bal)) < .5) discard;
    k = ${K.IRON};
  }
  if (k == ${K.PAINT}) {                                      // an engine's painted plate: iron under enamel (below)
    // paintK: how far it is a colour and not black. A strong colour keeps a body of grey in it (no channel under a third
    // of the strongest): the grade's film curve would otherwise crush a deep maroon to a flat primary red.
    paintP = 1.; k = ${K.IRON};
    float mxc = max(alb.r, max(alb.g, alb.b)), mnc = min(alb.r, min(alb.g, alb.b));
    paintK = smoothstep(.3, .65, (mxc - mnc) / max(mxc, 1e-4));
    alb = mix(alb, max(alb, mxc * vec3(.22, .22, .24)), paintK);
    pH = alb / max(mxc, 1e-4); pT = mix(vec3(1.), pH, .9 * paintK);
  }
  if (k == ${K.VALANCE}) {
    float fx = abs(fract(uv.x) - .5) * 2.;
    if (uv.y > 1. - .36 * fx) discard;
    vec2 hp = vec2((fract(uv.x) - .5) * .55, (uv.y - .5));
    if (length(hp) < .1 && fw.x < .25) discard;
    if (fx > .9 && uv.y > .3 && fw.x < .15) discard;
    alb *= .78 + .3 * n2;
    alb *= 1. - .45 * smoothstep(.35, .8, fbm(vec2(uv.x * .6, uv.y * .5 + 3.))) ;
    alb *= 1. + .6 * ins;                                     // seen from under the roof it is painted iron in lamp light, not a black cut-out
    gloss = .35;
  } else if (k == ${K.IRON}) {
    float rust = smoothstep(.5, .78, fbm(uv * vec2(1.1, .32) + 11.)) * (1. - paintP);       // (an engine's enamel is kept clean: no rust, no stains drawn out down the plate)
    alb = mix(alb, vec3(.15, .08, .05), rust * .45);
    alb *= mix(.8 + .35 * n2, .95 + .1 * n2, paintP);
    // rain running down wet plate: streaks that break the gloss, and (below) a sheen of sky so a side is never pure black
    run = vn(vec2(acr * 7., vL.y * 1.1 + uTime * .7)) * .6 + vn(vec2(acr * 19., vL.y * 2.3 + uTime * 1.3)) * .4;
    run = mix(.5, run, magK);                                  // (an arm's length away the streaks would be stretched noise: left out)
    gloss = (.6 - rust * .3) * mix(1., .7 + .5 * run, wet);
    ironK = wet;
#ifdef TINTED
    // rolling stock: wet plate carries the sky, and a polished engine is glossy dry too: an even band of sky along
    // the boiler and on the cab side before the rain (a little more of it by lamp-light, when the sky has less to give),
    // the rain's streaks once it is wet
    // (water runs down the upright plate only: a boiler's crown and a tender's top carry an even film)
    run = mix(.5, mix(.5, .38 + .4 * rivulets(acr, vL.y, fwa), (1. - smoothstep(.3, .7, abs(N.y))) * smoothstep(.3, .55, uvm)), smoothstep(0., .3, wet));
    if (paintP > .5) {
      // enamel, wet: the rain stands on it in beads (round, each holding a point of sky, sliding a little) and never runs in
      // streaks; the uv of every painted plate is laid in metres. Where a bead would be less than three or four pixels across
      // (it would be a square speck): their average.
      vec2 bq = uv * 17.;
      bq.y += uTime * (.02 + .12 * h21(vec2(floor(bq.x), 3.)));
      float bid = h21(floor(bq)), bw = max(fw.x, fw.y) * 17.;
      float br = .07 + .09 * fract(bid * 3.7);
      float bd = length(fract(bq) - .5 + (vec2(fract(bid * 7.3), fract(bid * 11.9)) - .5) * .5);
      float bead = step(.6, bid) * (1. - smoothstep(br, br + .08 + bw, bd));
      float skew = bw / max(min(fw.x, fw.y) * 17., 1e-5);       // (seen along the plate the beads would draw out into scratches: left out)
      run = mix(.5, mix(.5, .48 + .13 * bead, (1. - smoothstep(.04, .12, bw)) * (1. - smoothstep(3., 7., skew))), smoothstep(0., .3, wet) * (1. - smoothstep(.5, .85, N.y)));
    }
    gloss = (.6 - rust * .3) * mix(1., .85 + .3 * run, wet);
    ironK = max(wet, .6 + .2 * uLamp); sheenK = ironK; dryG = max(.4 - wet, 0.);
    {
      // painted plate carries the sky in its own colour: a maroon boiler shines maroon, a green one green (black and bare
      // iron stay silver), and the neutral floor under the paint is lowered so grey never swamps it
      alb *= 1. + .3 * paintK * wet;                          // (enamel does not go dull when it is wet)
      gSheenT = pT;
    }
#endif
  } else if (k == ${K.STONE}) {
    vec2 b = uv / vec2(1.3, .62); b.x += .5 * floor(b.y);
    vec2 fb = fract(b); float id = h21(floor(b));
    float mortar = smoothstep(0., .035 + fw.x, fb.x) * smoothstep(0., .07 + fw.y * 1.6, fb.y);
    alb *= (.84 + .26 * id) * mix(.66, 1., mortar);
    alb *= 1. - .42 * smoothstep(.42, .8, fbm(vec2(uv.x * .8, uv.y * .11)));
    alb = mix(alb, alb * vec3(.7, .85, .6), smoothstep(.6, .9, n1) * .35);
    gloss = .28;
  } else if (k == ${K.ARCADE} || k == ${K.ARCLIT}) {
    vec2 cell = floor(uv), f = fract(uv);
    vec2 p = vec2(f.x * .6, f.y);
    float hw = .185, spring = .44;
    vec2 c1 = vec2(.3 + hw, spring), c2 = vec2(.3 - hw, spring);
    float dTop = max(length(p - c1), length(p - c2)) - 2. * hw;
    float dLow = max(abs(p.x - .3) - hw, .1 - p.y);
    float d = p.y > spring ? dTop : dLow;
    vec2 b = uv * vec2(3.2, 11.); b.x += .5 * floor(b.y);
    vec2 fb = fract(b); float id = h21(floor(b));
    alb *= (.84 + .26 * id) * mix(.7, 1., smoothstep(0., .05, fb.x) * smoothstep(0., .09, fb.y));
    alb *= 1. - .4 * smoothstep(.42, .8, fbm(vec2(uv.x * 2.3, uv.y * .5)));
    gloss = .28;
    if (d < 0.) {
      float tr = min(abs(p.x - .3) - .011, abs(length(p - vec2(.3, spring + .17)) - .08) - .012);
      tr = min(tr, -d - .016);
      if (tr > 0.) {
        vec3 R = reflect(-V, N);
        if (k == ${K.ARCLIT}) col = uHorizCol * (.5 + 1.1 * uSun) * (.75 + .25 * n2);
        else {
          float lit = step(.8, h21(cell + 3.7));
          col = skyRefl(R) * .15 + vec3(.01, .012, .018) + vec3(1.5, .8, .3) * lit * (.35 + .15 * sin(uTime * 2.3 + cell.x * 7.));
          col += uSunCol * uSun * pow(max(dot(R, uSunDir), 0.), 60.) * 1.5;
        }
        done = true;
      } else alb *= .8;
    } else if (d < .075 && p.y > spring - .02) {
      float ang = atan(p.y - spring + .2, p.x - .3 + 1e-5);
      alb = mix(alb, vec3(.33, .1, .09), step(.5, fract(ang * 4.5)) * .85);
      alb *= 1.06;
    } else if (f.y < .07 || f.y > .955) alb *= 1.18;
    else if (abs(abs(p.x - .3) - hw - .03) < .016 && p.y < spring && p.y > .1) alb *= .55;
  } else if (k == ${K.CORR}) {
    float c = sin(uv.x * 15.7);
    float rust = smoothstep(.5, .85, fbm(uv * vec2(.5, .16) + 5.));
    alb = mix(alb, vec3(.15, .085, .055), rust * .5);
    alb *= (.82 + .2 * c * (1. - smoothstep(.1, .5, fw.x * 15.7))) * (1. - .5 * step(fract(uv.y / 2.4), .035));
    alb *= 1. + .6 * ins * smoothstep(-40., -4., vL.z);       // the underside of the first roof bays reads as sheet iron from the platform
    gloss = .7 - rust * .4;
  } else if (k == ${K.GLASS}) {
    float bx = abs(fract(uv.x / .62) - .5), by = abs(fract(uv.y / 2.2) - .5);
    float bar = max(1. - smoothstep(.06, .08 + fw.x * 2.5, bx), 1. - smoothstep(.02, .03 + fw.y * .8, by));
    float dirt = fbm(uv * vec2(.6, .25));
    vec3 g;
    vec3 Ng = normalize(vN + vec3(0., 1e-5, 0.));
    if (dot(Ng, V) > 0.) {
      vec3 R = reflect(-V, Ng);
      g = skyRefl(R) * (.5 + .2 * dirt) + uSunCol * uSun * pow(max(dot(R, uSunDir), 0.), 40.) * 2.5;
      g = mix(g, vec3(.05, .055, .06), .3 * dirt);
    } else g = mix(uHorizCol, uSkyCol, .45) * (.45 + .75 * uSun) * (.45 + .6 * dirt) + uSunCol * uSun * .25 * max(dot(-Ng, uSunDir), 0.);
    col = mix(g, vC * .12, bar * (1. - smoothstep(.6, 1.6, fw.x)) * .85);
    done = true;
  } else if (k == ${K.WOOD}) {
    float pl = floor(uv.x / .19);
    alb *= .78 + .3 * h21(vec2(pl, 3.));
    alb *= 1. - .4 * smoothstep(.43 - fw.x * 3., .5, abs(fract(uv.x / .19) - .5));
    alb *= mix(1., .8 + .3 * vn(uv * vec2(30., 2.)), magK);
    alb *= 1. - .1 * (1. - magK) * step(.6, h21(vec2(pl, floor(uv.y / .9) + 5.)));       // close to: each board its own tone, joints crisp
    alb = mix(alb, vec3(.2, .17, .14), smoothstep(.55, .85, n1) * .5);
    gloss = .35;
#ifdef TINTED
    run = .3 + .7 * rivulets(acr, vL.y, fwa);
    ironK = wet * .5; sheenK = wet;                           // wet paint and planks on rolling stock: threads of rain, sky sheen
#endif
  } else if (k == ${K.SPILL}) {
    // a footboard under a lit opening: wet plank with the lamp light from inside lying on it
    alb *= .8 + .3 * vn(uv * vec2(3., 30.));
    float sp = 1. - smoothstep(0., .5, length(uv - .5));
    emi = vec3(.72, .31, .085) * (uLamp * sp * sp * 1.3);
    gloss = .4;
  } else if (k == ${K.PAVE}) {
    vec2 b = uv / vec2(1.1, .7); b.y += .5 * floor(b.x);
    vec2 fb = fract(b); float id = h21(floor(b));
    alb *= (.82 + .28 * id) * mix(.6, 1., smoothstep(0., .04 + fw.x, fb.x) * smoothstep(0., .06 + fw.y, fb.y));
    alb *= .85 + .25 * n1;
    alb = mix(alb, vec3(.6, .58, .52) * (.75 + .3 * id), 1. - smoothstep(.4, .44 + fw.x, uv.x));
    alb = mix(alb, vec3(.62, .6, .5), (1. - smoothstep(.0, .03 + fw.x, abs(uv.x - .62) - .045)) * .8);        // a painted line a pace back from the edge
    alb *= 1. + .22 * (1. - smoothstep(.5, 1.1, abs(uv.x - 2.) + (n1 - .5) * .8));                                  // the worn walking line
    float trk = ins * smoothstep(-26., -3., vL.z);            // wet trodden in under the gable
    float pud = smoothstep(.52, .62, fbm(uv * .23 + 9.)) * (1. - ins * (1. - .8 * trk));
    pud = max(pud, ins * .7 * smoothstep(.5, .66, fbm(uv * vec2(.5, .21) + 23.)));                                      // mopped and trodden wet, catching the side shafts
    vec2 fc = vL.xz * vec2(2.3, 1.5), fi = floor(fc);
    float fpr = step(.5, h21(fi + 3.3)) * (1. - smoothstep(.1, .17, length((fract(fc) - .5 - (vec2(h21(fi), h21(fi + 7.7)) - .5) * .5) * vec2(1., .5))));
    pud = max(pud, fpr * trk * .8);
    gloss = mix(.45, .98, pud * uWet);
    wet = max(wet, pud * uWet);
    alb *= 1. - .3 * pud;
  } else if (k == ${K.BRICK}) {
    vec2 b = uv / vec2(.62, .26); b.x += .5 * floor(b.y);
    vec2 fb = fract(b); float id = h21(floor(b));
    float mm = smoothstep(0., .06 + fw.x * 2., fb.x) * smoothstep(0., .14 + fw.y * 4., fb.y);
    alb *= (.75 + .4 * id) * mix(.6, 1., mix(mm, .8, smoothstep(.2, .6, fw.y * 4.)));
    alb *= 1. - .5 * smoothstep(.4, .85, fbm(vec2(uv.x * .5, uv.y * .14) + 2.));
    gloss = .2;
  } else if (k == ${K.CHAWL}) {
    // limewashed wall of a chawl or shack: one shuttered opening per uv cell, stains under the sills
    vec2 cell = floor(uv), f = fract(uv);
    float id = h21(cell + 7.3);
    alb *= .8 + .32 * fbm(uv * vec2(.9, 1.7) + 3.);
    alb *= 1. - .45 * smoothstep(.35, .9, fbm(vec2(uv.x * 2.3, uv.y * .35) + 9.)) * (.4 + .6 * f.y);
    alb = mix(alb, alb * vec3(.55, .72, .5), smoothstep(.55, .8, n1) * .5 * (1. - f.y));
    float qx = abs(f.x - .5);
    float door = step(.62, id);
    float hw = mix(.2, .17, door), y0 = mix(.3, .05, door);
    float op = (1. - smoothstep(hw - fw.x, hw + fw.x, qx)) * smoothstep(y0 - fw.y, y0 + fw.y, f.y) * (1. - smoothstep(.8 - fw.y, .8 + fw.y, f.y));
    vec3 sh = mix(vec3(.04, .19, .2), vec3(.3, .19, .06), step(.5, h21(cell + 1.7)));
    sh = mix(sh, vec3(.24, .055, .045), step(.78, h21(cell + 4.1)));
    float open = step(.45, h21(cell + 2.3)) * (1. - step(hw * .55, qx));
    float nearW = 1. - smoothstep(.02, .09, max(fw.x, fw.y));
    // the wall's own dressing, drawn sharp: a plinth of brick courses, a string course at each floor, a painted surround and a
    // stone sill to every opening, a drainpipe down every few bays
    float gnd = step(cell.y, .5) * (1. - smoothstep(.2 - fw.y, .2 + fw.y, f.y));
    vec2 bc = vec2(uv.x * 5.2, f.y * 36.); bc.x += .5 * floor(bc.y);
    vec2 bf = fract(bc);
    vec3 pl = vec3(.3, .13, .085) * (.7 + .5 * h21(floor(bc))) * mix(1., smoothstep(0., .08 + fw.x * 6., bf.x) * smoothstep(0., .16 + fw.y * 40., bf.y) * .45 + .55, nearW);
    alb = mix(alb, pl, gnd * (1. - door * (1. - smoothstep(hw, hw + .02, qx))));
    alb *= 1. + .22 * smoothstep(.972 - fw.y, .972 + fw.y, f.y) - .2 * (1. - smoothstep(0., .01 + fw.y, abs(f.y - .958) - .004)) * nearW;
    float sur = (1. - smoothstep(hw + .04 - fw.x, hw + .04 + fw.x, qx)) * smoothstep(y0 - .035 - fw.y, y0 - .035 + fw.y, f.y) * (1. - smoothstep(.835 - fw.y, .835 + fw.y, f.y));
    alb = mix(alb, alb * 1.3 + .035, clamp(sur - op, 0., 1.) * (.4 + .6 * nearW));
    float sill = (1. - door) * (1. - smoothstep(hw + .07 - fw.x, hw + .07 + fw.x, qx)) * (1. - smoothstep(.012, .012 + fw.y, abs(f.y - y0 + .022)));
    alb = mix(alb, vec3(.5, .47, .4), sill * nearW);
    alb *= 1. - .3 * (1. - door) * (1. - smoothstep(hw + .06, hw + .08, qx)) * smoothstep(y0 - .085, y0 - .04, f.y) * (1. - smoothstep(y0 - .04, y0 - .034, f.y)) * nearW;       // the sill's shadow
    float pipe = step(.66, h21(vec2(cell.x, 5.5))) * (1. - smoothstep(.006, .006 + fw.x, abs(f.x - .06))) * (1. - smoothstep(.03, .12, fw.x));
    alb = mix(alb, vec3(.05, .055, .06), pipe * .85);
    // rooms: a dim warm inside by day (a shelf, a figure's shape), lamp-lit in the rain and at dusk
    float room = h21(cell + 6.6);
    vec3 dimIn = mix(vec3(.012, .012, .016), vec3(.085, .05, .026) * (.6 + .8 * smoothstep(y0 + .3, y0, f.y)), step(.35, room));
    vec2 hq = vec2(f.x - .5 - (room - .5) * .12, f.y - y0);        // somebody at the window: head and shoulders against the room
    float fig = max(1. - smoothstep(.03, .04, length(hq - vec2(0., .19))), 1. - smoothstep(.9, 1.1, length((hq - vec2(0., .05)) / vec2(.075, .1))));
    dimIn *= 1. - .65 * step(.55, room) * (1. - door) * fig;
    vec3 inner = mix(sh * (.7 + .3 * step(.5, fract(f.y * 14.))), dimIn, open);
    emi = vec3(1.7, .95, .36) * (uLamp * open * op * step(.4, h21(cell + 9.9)) * (.8 + .2 * sin(uTime * 3.1 + id * 40.)));
    emi += vec3(.5, .27, .1) * (.16 * open * op * step(.62, room) * (1. - uLamp));
    alb = mix(alb, inner, op * (1. - smoothstep(.25, .7, max(fw.x, fw.y))));
    alb *= 1. - .35 * smoothstep(.05, 0., f.y) * step(.5, cell.y + 1.);
    gloss = .16;
  } else if (k == ${K.VIADUCT}) {
    // brick viaduct side: uv.x metres along, uv.y metres below the deck; round arches on piers
    vec2 b = uv / vec2(.62, .26); b.x += .5 * floor(b.y);
    vec2 fb = fract(b); float id = h21(floor(b));
    float mm = smoothstep(0., .06 + fw.x * 2., fb.x) * smoothstep(0., .14 + fw.y * 4., fb.y);
    alb *= (.75 + .4 * id) * mix(.6, 1., mix(mm, .8, smoothstep(.2, .6, fw.y * 4.)));
    alb *= 1. - .5 * smoothstep(.4, .85, fbm(vec2(uv.x * .5, uv.y * .14) + 2.));
    float ax = (fract(uv.x / 10.) - .5) * 10.;
    float dA = uv.y > 5.6 ? abs(ax) - 3.7 : length(vec2(ax, uv.y - 5.6)) - 3.7;
    alb = mix(alb, alb * 1.25, (1. - smoothstep(.0, .12, abs(dA - .28) - .26)));
    alb = mix(alb, vec3(.012, .011, .013), 1. - smoothstep(-.08, .08, dA));
    alb *= 1. - .3 * step(uv.y, 1.) * step(.9, uv.y);
    alb = mix(alb, alb * vec3(.5, .68, .42), smoothstep(.5, .8, n1) * .5);
    gloss = .2;
  } else if (k == ${K.COACH}) {
    // carriage side band: uv.x in bays, uv.y 0..1 (openings in every bay) or 2..3 (every third bay only)
    float M = uv.y > 1.5 ? 3. : 1.;
    float vy = uv.y - (M > 2. ? 2. : 0.);
    float bay = floor(uv.x);
    float bm = mod(bay, M);
    float has = step(bm, .5);
    float ox = abs(fract(uv.x) - .5);
    float rect = (1. - smoothstep(.3 - fw.x, .3 + fw.x, ox)) * smoothstep(.16 - fw.y, .16 + fw.y, vy) * (1. - smoothstep(.9 - fw.y, .9 + fw.y, vy));
    float op = has * rect;
    alb *= mix(1., .82 + .3 * vn(uv * vec2(9., 40.)), magK);
    alb *= 1. - .3 * smoothstep(.485 - fw.x * 4., .5, abs(fract(uv.x * 4.) - .5)) * (1. - smoothstep(.05, .2, fw.x));     // panel joints: a fine dark seam
    float bar = (1. - smoothstep(.1, .1 + fw.y * 4., abs(fract(vy * 4.) - .5))) * step(M, 2.);
    // lamp-lit interior: brighter under the lamp, heads and shoulders against it, a dark frame round the opening
    float vx = fract(uv.x), hid = h21(vec2(bay, 5.));
    float hx = mix(.34, .66, fract(hid * 13.7)), hy = mix(.4, .56, fract(hid * 29.3));
    vec2 hp = vec2((vx - hx) * 2., (vy - hy) * 1.1);
    float sil = max(1. - smoothstep(.07, .13, length(hp)), 1. - smoothstep(.15, .26, length(vec2(hp.x * .62, hp.y + .3)))) * step(.35, hid) * .85;
    float rim = 1. - smoothstep(.0, .035, .3 - ox) * smoothstep(.16, .2, vy) * smoothstep(.9, .86, vy);
    float tb = (vx - .2) / .6;
    float vbar = smoothstep(.39, .43, abs(fract(tb * 5.) - .5)) * step(2., M) * (1. - smoothstep(.02, .08, fw.x));   // iron bars across the openings
    float lampK = (.1 + .9 * smoothstep(.2, 1., vy) * (.55 + .45 * smoothstep(.5, .0, abs(tb - .5)))) * (1. - .93 * sil) * (1. - rim) * (1. - .85 * vbar) * (.6 + .4 * h21(vec2(bay, 3.)));
    emi = vec3(.72, .31, .085) * (uLamp * op * (1. - bar) * lampK);
#ifdef TINTED
    emi *= vLit;                                              // our own coach is a frame, not a subject
#endif
    alb = mix(alb, mix(vec3(.012, .011, .012), alb * .45, max(bar, rim)), op);
    if (M > 2.) {
      // between the lit openings (6 m apart, the flicker rule) the side is continuous, unlit detail: a closed louvred
      // shutter, then a door with a dark droplight that holds the sky and a brass handle
      float near = 1. - smoothstep(.03, .12, fw.y), isDoor = step(1.5, bm), shut = (1. - has) * (1. - isDoor) * rect;
      alb = mix(alb, alb * vec3(.82, .78, .72) * mix(.8, .84 + .16 * smoothstep(.3, .5, fract(vy * 28.)), near), shut);       // fine louvres, soft
      alb *= 1. - .4 * (1. - has) * (1. - isDoor) * (1. - smoothstep(0., .025 + fw.x, abs(ox - .3))) * step(.16, vy) * step(vy, .9);
      alb *= 1. - .3 * shut * (1. - smoothstep(0., .016 + fw.x, .3 - ox) * smoothstep(0., .028 + fw.y, vy - .16) * smoothstep(0., .028 + fw.y, .9 - vy));     // a darker frame, 3 cm, round the louvres
      float dr = (1. - has) * isDoor, vxd = fract(uv.x);
      alb *= 1. - .55 * dr * (1. - smoothstep(0., .012 + fw.x, abs(ox - .36))) * step(vy, .96);
      alb *= 1. - .3 * dr * (1. - smoothstep(0., .01 + fw.x, abs(ox - .26))) * step(.14, vy) * step(vy, .36) * near;
      glassK = dr * (1. - smoothstep(.2 - fw.x, .2 + fw.x, ox)) * smoothstep(.44 - fw.y, .44 + fw.y, vy) * (1. - smoothstep(.9 - fw.y, .9 + fw.y, vy));
      gq = vec2(ox / .2, (vy - .44) / .46);
      alb = mix(alb, vec3(.5, .34, .1), dr * step(abs(vxd - .83), .02) * step(abs(vy - .3), .075) * near);
    }
    // a cream waist band and gold lining, unbroken from end to end
    float wl = 1. - smoothstep(0., fw.y, abs(vy - .07) - .028);
    alb = mix(alb, vec3(.6, .53, .36), wl * .9);
    float lnA = 1. - smoothstep(0., fw.y, abs(vy - .13) - .008), lnB = 1. - smoothstep(0., fw.y, abs(vy - .95) - .008);
    alb = mix(alb, vec3(.62, .42, .12), max(lnA, lnB) * (1. - op) * .85);
    run = .3 + .7 * rivulets(acr * 2., vL.y, fwa * 2.) * (1. - op);     // (a bay is two metres; no water runs down an open window)
    ironK = wet * .5; sheenK = wet;
    gloss = .55;
  } else if (k == ${K.TILE}) {
    vec2 b = uv / vec2(.3, .42); b.x += .5 * floor(b.y);
    float id = h21(floor(b));
    float cx = abs(fract(b.x) - .5);
    float far = smoothstep(.2, .7, max(fw.x / .3, fw.y / .42));
    alb *= mix((.72 + .4 * id) * (.75 + .5 * cx) * mix(.7, 1., smoothstep(0., .2, fract(b.y))), .9, far);
    alb = mix(alb, vec3(.05, .07, .04), smoothstep(.5, .85, n1) * .55);
    gloss = .5;
  } else if (k == ${K.GLOW}) {
    col = vC * 4.5; done = true;
  } else if (k == ${K.FIRE}) {
    // a firelit cab: the glow falls off from the firehole (low and forward), flickering slowly
    // (uv: distance in metres from the firehole / 2.3 about (.16, .2); the plate is dark iron, vC its tone)
    float fd = length(vec2(uv.x - .16, uv.y - .2)) * 2.3;
    float fl = .8 + .2 * vn(vec2(uTime * 3., 1.7));
    vec3 fire = vec3(1., .36, .08);
    vec3 plate = vC * (.75 + .5 * n2);
    // riveted seams across the plates, so the glow lies on ironwork and not on a blank panel
    float seam = 1. - smoothstep(.006, .014 + fw.y, abs(fract(uv.y * 4.6 + .2) - .5));
    float rivet = (1. - smoothstep(.1, .22, length(vec2(fract(uv.x * 46.) - .5, (fract(uv.y * 4.6 + .28) - .5) * 10.)))) * (1. - smoothstep(.01, .03, fw.x));
    plate *= (1. - .55 * seam) * (1. + .9 * rivet);
    col = plate * (fire * ((4.6 * exp(-fd / .42) + .9 * exp(-fd / 1.4)) * fl) + uAmbCol * .7 + uGroundCol * .4);
    col += (uHorizCol + uAmbCol) * ((.03 + .035 * n2) * (1. + .9 * rivet) * (1. - .5 * seam) * uSun);       // with the sun out, daylight through the open back: dark ironwork, not a black hole
    col += fire * ((1. - smoothstep(.2, .3, fd)) * (2.2 + 1.2 * vn(uv * 40. + uTime * vec2(.7, 2.3))) * fl);       // the firehole itself
    col += fire * (exp(-fd * fd / .09) * .5 * fl);
    done = true;
  } else if (k == ${K.SLATE}) {
    vec2 b = uv / vec2(.5, .34); b.x += .5 * floor(b.y);
    float id = h21(floor(b));
    alb *= (.8 + .3 * id) * mix(.7, 1., smoothstep(0., .1 + fw.y * 3., fract(b.y)));
    alb *= 1. - .3 * smoothstep(.5, .85, n1);
    gloss = .7;
  } else if (k == ${K.BRASS}) {
    alb *= .8 + .3 * n2; gloss = .95; wet = max(wet, .5);
  } else if (k == ${K.DOME}) {
    // the great dome: fine courses of pale stone, weather streaks running down from the lantern
    float crs = fract(uv.y / .9);
    alb *= mix(.8, 1., smoothstep(0., .1 + fw.y * 2., crs)) * (.9 + .16 * h21(vec2(floor(uv.y / .9), floor(uv.x / 2.2))));
    alb *= 1. - .3 * smoothstep(.45, .85, fbm(vec2(uv.x * .7, uv.y * .09)));
    alb = mix(alb, vec3(.92, .56, .2) * (alb.g * 1.6 + .25), .6);       // the brief's gold
    gloss = .5; rimK = 1.;
  } else if (k == ${K.COAL}) {
    // a tender's load: wet black lumps, each face its own tone, the wet ones catching the sky
    float lump = h21(floor(uv * 7.) + 3.1);                 // coal: black lumps, one in five with a wet face that holds a glint of sky
    alb *= .5 + .9 * lump; gloss = .1 + .5 * step(.8, lump); wet *= .45;
  } else {
    alb *= .82 + .3 * n2; gloss = .18;
  }
#ifdef DOOR
  if (!done) {
    // our own doorway: sky light from outside and a little lamp light off the floor; the sun is capped and
    // greyed so the paint reads in rain, in the shed and at dusk alike
    vec3 sc = uSunCol * uSun; float sl = dot(sc, vec3(.3, .5, .2));
    sc = mix(vec3(sl), sc, .5) * (.5 / max(sl, .5));
    float ndl = clamp(dot(N, uSunDir) * .7 + .3, 0., 1.);
    float vis = sunVis(pS);
    float open = .38 + .62 * smoothstep(-.8, .9, dot(N.xz, uTrackR));          // faces turned to the open air are brighter
    vec3 li = sc * (vis * ndl) + (mix(uGroundCol, uAmbCol, N.y * .3 + .7) * .7 + uAmbCol * .35) * open + vec3(1.2, .6, .2) * (.15 * uLamp + .07);
    li += uSunCol * (uSun * inShed(vec3(uCamL.x, 2., uCamL.z)) * .1 * (.5 + .5 * open));     // under the roof the station's own warm light reaches the paint
    float rf = smoothstep(6., -4., uCamL.z);                    // under the roof: the paint is lifted, and the lamps and the west arcade warm it
    li = li * (1. + .5 * rf) + vec3(1.5, .86, .36) * (rf * (.06 + .1 * max(uLamp, .4)) * (.6 + .4 * open));
    col = alb * li;
    if (k == ${K.BRASS}) { float rr = 1. - abs(dot(N, V)); col += (uSunCol * uSun * .22 + vec3(1.5, .86, .36) * .1) * (rf * rr * rr); }     // a warm rim on the brass strip and the pole
    vec3 Rd = reflect(-V, N); Rd.y = abs(Rd.y);
    vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
    col += skyRefl(Rd) * (gloss * gloss * .16 * open * open) + sc * (vis * pow(max(dot(N, H), 0.), 40.) * gloss * .8);
    if (k == ${K.BRASS}) {                                     // rain beading and running on the pole and the brass
      vec2 dq = vec2(uv.x * 100., uv.y * 60.);
      dq.y += uTime * (.6 + 2.2 * h21(vec2(floor(dq.x), 3.)));
      float did = h21(floor(dq));
      float dr = length((fract(dq) - .5) * vec2(1., .7) + vec2(did - .5, 0.) * .3);
      float drops = step(.68, did) * (1. - smoothstep(.07, .2 + .1 * fract(did * 7.3), dr)) * smoothstep(0., .3, uRainCam);
      col = mix(col, uAmbCol * .9 + uHorizCol * .3 + sc * vis, drops * .5);
    } else if (abs(N.y) < .5) {                                // and on the paint: fewer, slower, duller
      vec2 dq = vec2(uv.x * 46., uv.y * 22.);
      dq.y += uTime * (.2 + 1.2 * h21(vec2(floor(dq.x), 7.)));
      float did = h21(floor(dq));
      float dr = length((fract(dq) - .5) * vec2(1., .55) + vec2(did - .5, 0.) * .3);
      float drops = step(.78, did) * (1. - smoothstep(.06, .2, dr)) * smoothstep(0., .3, uRainCam);
      col = mix(col, uAmbCol * .8 + uHorizCol * .25 + sc * (vis * .5), drops * .4);
    }
    col *= 1. - .5 * smoothstep(.12, .7, vL.y - uCamL.y);       // the lintel's shadow gathers at the head of the jamb
  }
#else
  if (!done) {
    col = shadeSurf(alb, N, V, pS, gloss, wet) + emi;
    if (ironK > 0.) {
      float fr = 1. - max(dot(N, V), 0.); fr *= fr;
      vec3 Rs = reflect(-V, N); float upS = max(Rs.y, 0.); Rs.y = abs(Rs.y);
      vec3 sr = skyRefl(Rs);
      float pF = 1. - max(.5 * paintK, .45 * paintP);                             // (painted plate: every sky term below takes the paint's hue, and the floor is lower)
      col += uAmbCol * pT * (upS * upS * dryG * gloss * .5 * (1. - .8 * uSun) * shedAO(pS));       // the overcast sheen, on dry polished plate
      col += (uAmbCol * .8 + sr * .2) * pT * (ironK * pF * (.085 + .13 * fr) * (.25 + 1.3 * run) * shedAO(pS));
      col += uSkyCol * pT * (ironK * pF * (.15 * max(N.y, 0.) + .05 * (1. - abs(N.y))) * (.5 + run) * (1. - .85 * uSun) * shedAO(pS));     // under the rain a girder overhead is wet riveted iron, not a silhouette
      // seen from beneath, wet iron takes the light off the wet ground and the lamps: a blue-grey soffit, its plates told apart
      col += (uHorizCol * .5 + uAmbCol * .5 + vec3(.5, .28, .1) * uLamp * .3) * pT * (ironK * max(-N.y, 0.) * (.1 + .12 * n2 + .1 * run) * shedAO(pS));
      col += sr * mix(pT, vec3(1.), .25 * fr) * (sheenK * (.1 + .5 * fr) * (.1 + 1.1 * run * run * run) * shedAO(pS));     // rain-run streaks of sky on wet paint and plate
#ifdef TINTED
      if (k == ${K.IRON}) { float mx = max(col.r, max(col.g, col.b)); col *= 1. / (1. + 1.4 * max(mx - .7, 0.)); }     // polished plate shines, and never burns out to white
      if (paintP > .5 && paintK < 1.) {                         // black enamel: the sky lies on it as a sheen, not as a coat of silver
        float m0 = max(max(col.r, max(col.g, col.b)), 1e-4), m1 = min(m0, .075 + (m0 - .075) * .5);
        col *= mix(m1 / m0, 1., paintK);
      }
      if (paintK > 0.) {
        // enamel keeps its own colour under any sky: what the plate shows (light and sheen together) is drawn in the paint's
        // hue and a little deeper, so a maroon boiler under a blue-grey storm is deep maroon, not mauve or silver; and the two
        // weaker channels never fall below what the grade's film curve can carry (uPaintLo), so its shadows stay maroon and
        // do not crush to a flat red
        float v0 = max(max(col.r, max(col.g, col.b)), 1e-4), v = v0 * .82;
        v = min(v, .11 + (v - .11) * .55);                      // (deep even where the low sun is on it)
        col = mix(col * (v / v0), v * pH, .85 * paintK);
        col = mix(col, max(col, min(vec3(v * .78) * (uPaintLo.xxy / uPaintLo.x), uPaintLo.xxy)), paintK);       // (blue a shade over green, through the hour's tint: in deep shade it is maroon-black, never brown)
      }
#endif
    }
#ifndef TINTED
    if (k == ${K.IRON}) {
      // before the rain, dry painted iron under the pearl overcast is never a black cut-out: a soft skylight sheen on plate,
      // stiffener and rivet (gone once everything is wet, when the terms above carry it)
      float frD = 1. - max(dot(N, V), 0.); frD *= frD;
      col += (uAmbCol * .7 + uSkyCol * .3) * ((1. - uWet) * (.06 + .1 * frD + .05 * n2) * (.8 + .4 * abs(N.x)) * shedAO(pS));
    }
#endif
    if (glassK > 0.) {                                          // a droplight: dark glass holding the sky
      vec3 Rg = reflect(-V, N); Rg.y = abs(Rg.y);
      float gfr = 1. - smoothstep(0., .14, 1. - gq.x) * smoothstep(0., .08, gq.y) * smoothstep(0., .08, 1. - gq.y);       // its frame
      float bwG = max(.05, fw.x * 7.);
      float band = smoothstep(.5 - bwG, .5 + bwG, vn(vec2((uv.x + gq.y * .1) * 11., 3.7)));                  // the sky lies on the glass in slanted streaks
      vec3 gl = vec3(.016, .014, .013) * (.5 + gq.y) + vec3(.72, .31, .085) * (uLamp * .12 * gq.y);       // a dim inside, lighter toward the lamp
      gl += skyRefl(Rg) * ((.07 + .5 * band) * (.45 + .55 * run) * shedAO(pS));
      col = mix(col, mix(gl, col * .4, gfr), glassK);
    }
    if (rimK > 0.) {                                           // the dome burns gold on its sun side, indigo in its shadow
      float sv = uSun * sunVis(pS), sside = clamp(dot(N, uSunDir) * .9 + .4, 0., 1.);
      float fk = .6 + .8 * uFresh;                             // hottest in the first seconds of sun
      col *= mix(vec3(1.), mix(vec3(.5, .6, 1.25), mix(vec3(1.8, 1.62, 1.25), vec3(2.75, 2.05, .95), fk), sside), sv);
      float rd = 1. - max(dot(N, V), 0.);
      col += uSunCol * (sv * rd * rd * rd * 2.6 * fk * rimK * (.25 + .75 * clamp(dot(N, uSunDir) + .45, 0., 1.)));
    }
  }
#endif
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// analytic mirror of the scene for puddles: the shed gable, the terminus and the gantries
const GLSL_MIRROR = /* glsl */`
uniform vec3 uGz;
float gantryMask(vec3 p, vec3 R, float gz){
  float t = (gz - p.z) / min(R.z, -1e-3);
  vec3 q = p + R * t;
  float on = step(gz, p.z) * step(abs(q.x + 12.5), 56.);
  float truss = smoothstep(7.2, 7.6, q.y) * smoothstep(9.6, 9.2, q.y) * (.62 + .38 * step(abs(fract(q.x / 1.6 + q.y * .31) - .5), .2));
  float dolls = smoothstep(9.2, 9.5, q.y) * smoothstep(14.4, 13.2, q.y) * (.25 + .75 * step(abs(fract(q.x / 4.6) - .5), .1));
  float legs = step(q.y, 9.3) * step(abs(abs(q.x + 12.5) - 52.) , .8);
  return on * max(max(truss, dolls * .8), legs);
}
vec3 sceneRefl(vec3 p, vec3 R){
  vec3 c = skyRefl(R);
  float rz = min(R.z, -1e-3);
  float fwd = step(R.z, -.01);
  vec3 q = p + R * ((-166. - p.z) / rz);                      // the terminus
  float dx = q.x + 12.;
  float sil = step(abs(q.x + 12.5), 50.) * step(q.y, 27.);
  sil = max(sil, step(abs(dx), 14.) * step(q.y, 36. - abs(dx) * .6));
  float dn = 1. - dx * dx / 137.;
  sil = max(sil, step(abs(dx), 13.) * step(q.y, 47.));
  sil = max(sil, step(abs(dx), 11.7) * step(q.y, 47. + 19. * sqrt(max(dn, 0.))));
  sil = max(sil, step(abs(dx), 1.6) * step(q.y, 73.));
  sil = max(sil, step(abs(abs(q.x + 12.5) - 48.5), 2.3) * step(q.y, 38.5));
  sil = max(sil, step(abs(abs(dx) - 14.), 2.4) * step(q.y, 49.));
  vec3 stone = vec3(.6, .49, .36) * (uSunCol * uSun * (.3 + .45 * smoothstep(-10., 10., dx)) + uAmbCol * .7);
  c = mix(c, stone, sil * fwd * step(-160., p.z));
  q = p + R * ((0. - p.z) / rz);                              // the shed gable
  float ry = q.y - roofY(q.x) - .9, sw = clamp(fwidth(ry), .2, 4.);       // the gable's edge is as soft as the water is rough: no crumbs of sky along it
  float shed = step(abs(q.x + 12.5), 51.) * (1. - smoothstep(-sw, sw, ry)) * step(0., p.z);
  vec3 dark = uAmbCol * .25 + uSunCol * uSun * .03;            // mirrored iron is grey under the sky, never a black hole
  c = mix(c, dark, shed * fwd);
  float g = max(gantryMask(p, R, uGz.x), max(gantryMask(p, R, uGz.y), gantryMask(p, R, uGz.z)));
  c = mix(c, dark, g * fwd);
  return c;
}`;

const GROUND_VERT = /* glsl */`
attribute float aTd; varying vec3 vL; varying float vTd;
#include <fog_pars_vertex>
void main(){ vL = position; vTd = aTd;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uCamL; varying vec3 vL; varying float vTd;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_MIRROR}
void main(){
  vec3 p = vL;
  vec3 V = normalize(uCamL - p + vec3(0., 1e-4, 0.));
  float dist = length(uCamL - p);
  float ins = inShed(vec3(p.x, 1., p.z));
  float fwp = max(fwidth(p.x), fwidth(p.z));
  float lod = 1. - smoothstep(.05, .2, fwp);
  vec2 pr = mat2(.8, -.6, .6, .8) * p.xz, pq = mat2(.28, .96, -.96, .28) * p.xz;
  // the fine stones are turned again and their lattice is bent by a slow warp, so the octaves never line up into a weave
  vec2 wp = (vec2(vn(pq * 1.9 + 3.), vn(pr * 2.3 + 11.)) - .5) * .22;
  vec2 ps = mat2(.8, .6, -.6, .8) * pq + wp.yx, prw = pr + wp;
  float lodN = 1. - smoothstep(.02, .12, fwp);
  float g1 = vn(prw * 6.) * .65 + vn(pq * 13. + 9.) * .35, g2 = vn(prw * 11.) * .55 + vn(ps * 17. + 4.) * .45, f1 = fbm(p.xz * .07), f2 = fbm(pr * .33 + 3.);
  // (the stones' contrast is held to about half: a quiet bed for the rails, not a field of salt and pepper)
  vec3 alb = mix(vec3(.05, .045, .042), vec3(.2, .175, .15), mix(.5, mix(.5, g1, lod) * .55 + mix(.5, g2, lodN) * .45, .55));
  float near = 1. - smoothstep(1.5, 2.7, vTd), cess = 0.;
#ifdef DECK
  // the viaduct's deck: a trodden cinder path along each edge
  cess = smoothstep(2.75, 3.05, vTd);
#endif
  alb *= mix(vec3(.5, .49, .52), vec3(1.), near * .75 + .25 * f1);
  alb = mix(alb, vec3(.17, .09, .05), (1. - smoothstep(.2, 1.5, vTd)) * .4);
  alb *= 1. - mix(.14, .35, uWet) * smoothstep(.5, .75, fbm(p.xz * .21 + 20.));
  alb *= mix(.78 + .44 * (g1 * .55 + g2 * .45), 1., max(uWet, 1. - lodN));                       // dry: every stone tells
  alb *= 1. - .3 * (1. - smoothstep(.0, .55, vTd)) * smoothstep(.35, .7, vn(p.xz * vec2(1.3, .35) + 60.));       // oil and ash between the rails
  float f3 = fbm(p.xz * vec2(.8, .2) + 13.);
  float open = smoothstep(3.2, 6., vTd);                         // open ground clear of every line: round pools there, not long streaks
  float pv = mix(f3, fbm(pr * .16 + 5.) * .92, open) * .7 + f2 * .3 - near * .25;
#ifdef DECK
  alb *= 1. - .34 * (1. - smoothstep(.12, .5, vTd)) * (.7 + .3 * f3);                        // an oil stripe down each four-foot
  alb *= 1. + .3 * smoothstep(1.3, 1.6, vTd) * (1. - smoothstep(2.0, 2.5, vTd)) * (.6 + .8 * f2);     // clean stone on the ballast shoulders
  alb = mix(alb, vec3(.15, .135, .115) * (.8 + .4 * f2), cess * .85);
  pv += .1 * smoothstep(1.5, 2.1, vTd);                        // and long puddles in the six-foot and on the path, once it is wet
#endif
  float pm = smoothstep(.56, .64, pv);
  float damp = 1. - .4 * smoothstep(.5, .59, pv);              // the dark damp margin round a puddle
  alb *= damp * mix(1., .72 + .56 * fbm(pr * 1.3 + 40.), .45 + .55 * uWet);
  alb *= mix(1., uGndK.x, uWet);
  pm *= uWet * (1. - ins) * (1. - smoothstep(0., .35, near) * .9) * (1. - .8 * open);      // (the open ground keeps its placed puddles; its small pools read from the door as white smears)
  {
    // the placed puddles (under the yard's water column, and in the low ground between its roads): ragged at the rim
    float rag = (f2 - .5) * .7 + (g1 - .5) * .12 * lod, pp = 0.;
    for (int i = 0; i < 6; i++) pp = max(pp, (1. - smoothstep(.7, .86, length((p.xz - uPud[i].xy) / max(uPud[i].zw, vec2(.01))) + rag)) * step(.02, uPud[i].z));
    pm = max(pm, pp * uWet * (1. - .45 * near));
  }
  // by hour: at noon the sky lies less on the stones and the gantries throw short hard shadows; the broad sun lobe is held
  // back on the far right, so the glare under the sun is a streak and not a quarter of the picture
  { float rgt = smoothstep(10., 40., p.x - uCamL.x); gSpecK = (1. - .7 * rgt) * uGndK.y * uGndK.y; gSkyK = uGndK.y * (1. - .3 * rgt); }       // (under a high sun the stones' facets would add up to chalk)
  {
    vec3 q = p + uSunDir * ((8.4 - p.y) / max(uSunDir.y, .05));
    float dz = min(min(abs(q.z - uGz.x), abs(q.z - uGz.y)), abs(q.z - uGz.z));
    float sh = (1. - smoothstep(.55, 1.05, dz)) * step(abs(q.x + 12.5), 56.) * (.65 + .35 * step(abs(fract(q.x / 1.6) - .5), .22));
    gSunK = 1. - uGndK.z * sh * (1. - ins);
  }
  // the stones' facets: a difference of the noise across each cell, so the highlights do not sit on the lattice points
  float fac = .34 * lodN * (1. - cess);
  vec3 N = normalize(vec3((vn(prw * 11.) - vn(prw * 11. + vec2(.37, .61))) * fac, 1., (vn(ps * 17. + 4.) - vn(ps * 17. + vec2(4.53, 4.29))) * fac));
  vec3 col = shadeSurf(alb, N, V, p, .38, uWet * (1. - ins * .8));
  // rings from the last drops
  vec2 cell = floor(p.xz / .9), cf = fract(p.xz / .9) - .5;
  float ph = fract(uTime * (.7 + .8 * uRain) + h21(cell));
  float rd = length(cf - (vec2(h21(cell + 1.3), h21(cell + 2.9)) - .5) * .5);
  float ring = sin((rd - ph * .45) * 60.) * smoothstep(.07, 0., abs(rd - ph * .45)) * (1. - ph) * max(uFresh, uRain) * step(.55 - .3 * uRain, h21(cell + 5.1)) * lod;
  vec3 Np = normalize(vec3(ring * .25 + (g1 - .5) * .012, 1., ring * .25 + (g2 - .5) * .012));
  vec3 R = reflect(-V, Np);
  R.y = abs(R.y) + 1e-3;
  vec3 refl = sceneRefl(p, R);
  {
    // a puddle holds the colour of the sky overhead, not the white of the haze at the horizon (silhouettes stay where they are)
    vec3 sk0 = skyRefl(R), dsk = refl - sk0;
    vec3 skHi = mix(skyRefl(normalize(vec3(R.x, R.y + .3, R.z))), uSkyCol, .35 + .3 * uSun);
    refl = mix(refl, skHi, (1. - smoothstep(0., .02, dot(dsk, dsk))) * (.8 + .12 * uSun));
  }
  refl = max(refl, skyRefl(R) * (uSunDir.y * uSunDir.y));      // under a high sun the mirrored iron and glass stand lit in bright haze: a pale shape in a pale puddle
  float vis = sunVis(p) * gSunK;
  float sd = max(dot(R, uSunDir), 0.);
  refl += uSunCol * (uSun * vis * (pow(sd, 220.) * 10. + pow(sd, 30.) * .05 * (.4 + 1.2 * g1) * gSpecK));
  float F = 1. - max(V.y, 0.); F = .28 + .6 * F * F * F;
  // (the hour's sky factor is for the stones only; a puddle is a mirror at any hour, and never darker than the wet stones
  // beside it, the ones outside its damp margin: damp is never under .6)
  vec3 mir = refl * F + alb * .04;
  col = mix(col, max(mir, col * (.9 / damp)), pm);
  { float gl = max(col.r, max(col.g, col.b)); col *= 1. / (1. + .9 * max(gl - .7, 0.)); }     // the sun's road glitters, and never burns the rails out of the picture
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// track ribbons: aM 0 = sleepers (alpha pattern), 1 = rail head (antialiased line), 2 = rail web, 3 = rodding
const TRACK_VERT = /* glsl */`
attribute float aM; attribute vec3 aT;
varying vec3 vL, vT; varying vec2 vUv; varying float vM;
#include <fog_pars_vertex>
void main(){ vL = position; vUv = uv; vM = aM; vT = aT;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TRACK_FRAG = /* glsl */`
uniform vec3 uCamL; varying vec3 vL, vT; varying vec2 vUv; varying float vM;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 V = normalize(uCamL - vL + vec3(0., 1e-4, 0.));
  vec3 N = vec3(0., 1., 0.);
  float ins = inShed(vec3(vL.x, 1., vL.z));
  vec2 fw = fwidth(vUv) + 1e-5;
  vec3 col; float a = 1.;
  if (vM < .5) {
    float s = vUv.y / .72;
    float fs = abs(fract(s) - .5);
    float bar = 1. - smoothstep(.2 - fw.y * .7, .2 + fw.y * .7, fs);
    bar = mix(bar, .4, smoothstep(.2, .6, max(fw.y, fw.x) / .72));
    float ends = 1. - smoothstep(1.28 - fw.x, 1.28 + fw.x, abs(vUv.x));
    float id = h21(vec2(floor(s), floor(vL.x * .3)));
    vec3 alb = vec3(.085, .066, .052) * (.7 + .6 * id) * (.8 + .4 * vn(vUv * vec2(3., 30.)));
    alb = mix(alb, vec3(.2, .1, .05), smoothstep(.25, .0, abs(abs(vUv.x) - .84)) * .5);
    col = shadeSurf(alb, N, V, vL, .5, uWet * (1. - ins * .8));
    a = bar * ends;
  } else if (vM < 1.5) {
    float hw = max(.04, fw.x * .8);
    a = 1. - smoothstep(hw - fw.x * .5, hw + fw.x * .5, abs(vUv.x));
    vec3 T = normalize(vT + vec3(0., 0., 1e-5));
    vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
    float th = dot(T, H);
    float glint = pow(sqrt(max(1. - th * th, 0.)), 14.);
    float vis = sunVis(vL + vec3(0., .5, 0.));
    // the running surface is polished steel, wet or dry: it holds the sky overhead and the horizon in equal parts
    col = max(skyRefl(reflect(-V, N)) * .55, (uSkyCol + uHorizCol) * (.4 + .06 * vn(vUv.yy * 1.7))) * shedAO(vL) + vec3(.02) + uSunCol * (uSun * ins * .1);
    col *= 1. - .34 * uSun * (1. - ins);                         // (a yard of twelve roads under the sun: steel, not chalk lines)
    col += uSunCol * (uSun * vis * glint * (1.2 + 1.3 * uFresh) * (.7 + .3 * vn(vUv.yy * .4)));
    a *= clamp(.05 / hw, .22, 1.);
  } else if (vM < 2.5) {
    col = shadeSurf(vec3(.12, .062, .04) * (.8 + .4 * vn(vUv.yy * 2.3)), normalize(vec3(vT.z, .3, -vT.x)), V, vL, .4, uWet * .5);
  } else {
    float r = abs(fract(vUv.x / .16) - .5);
    float hw = max(.14, fw.x / .16 * .8);
    a = (1. - smoothstep(hw - fw.x * 3., hw + fw.x * 3., r)) * step(abs(vUv.x), .47);
    float stool = step(abs(fract(vUv.y / 2.7) - .5), .03);
    a = max(a, stool) * (1. - smoothstep(.4, 1.2, fw.x));
    vec3 galv = vec3(.105, .105, .11) * (.75 + .5 * vn(vUv * vec2(40., .7))) + vec3(.05, .02, .0) * smoothstep(.55, .8, vn(vUv * vec2(9., .3) + 5.));
    col = shadeSurf(mix(galv, vec3(.07), stool), N, V, vL, .35, uWet * .6);
  }
  if (a < .01) discard;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

const FOG_FADE = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  float fogF = 0.;
#endif`;

// lamp glows: camera-facing HDR sprites; aMode 1 = the lamp's streak mirrored in the wet ground
const GLOW_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec3 aColA, aColB; attribute vec4 aSw;
uniform float uProg, uTime, uWet, uLamp, uSun; uniform vec3 uCamL;
varying vec2 vC2; varying vec3 vCol; varying float vLaid;
#include <fog_pars_vertex>
void main(){
  vec3 c = (modelMatrix * vec4(position, 1.)).xyz; float size = aSw.z; float laid = 0.;
  float s = smoothstep(aSw.x, aSw.x + .022, uProg);
  vCol = mix(aColA, aColB, s) * (.85 + .15 * sin(uTime * (5. + aSw.y * 7.) + aSw.y * 40.));
  if (aSw.x < -1.5) vCol *= min(uLamp * 1.25, 1.);            // a lamp inside a carriage: seen when the lamps are lit
  if (aSw.w > .5) {
    // aSw.w: 1 = mirrored in the wet ground of the throat (y 0), 1 + h = in a wet surface at height h (the viaduct's deck, a
    // platform), over 500 = at the height of the carrier's own origin (a lamp-lit window on a moving coach)
    float py = aSw.w > 500. ? modelMatrix[3].y : aSw.w - 1.;
    float ch = max(uCamL.y - py, .05), t = ch / max(ch + c.y - py, .01);
    c = vec3(mix(uCamL.x, c.x, t), py + .06, mix(uCamL.z, c.z, t));
    float lim = aSw.w > 1.5 ? 1. : step(-75., c.x) * step(c.x, 50.) * step(-1., c.z);
    // (in full sun the streaks are faint and short: lamps lie on wet ground at dusk and in the rain, not at midday)
    // the streak lies in the wet, drawn out toward the eye: a quad on the ground, soft at both ends, never standing up
    vec2 toC = uCamL.xz - c.xz + vec2(1e-4, 0.); float D = length(toC); toC /= max(D, 1e-3);
    vec2 sd = vec2(-toC.y, toC.x);
    float halfL = clamp(.45 * D, 1.5, 30.) * (1. - .33 * smoothstep(.4, .6, uSun));
    float halfW = max(aSw.z * .55, D * .004);
    c.xz += sd * (aCorner.x * halfW) + toC * (aCorner.y * halfL);
    c.y = py + (aSw.w > 1.5 ? .06 : .19);
    vCol *= .12 * uWet * mix(.3, 1., min(uLamp * 1.25, 1.)) * lim * smoothstep(1.5, 5., D);
    laid = halfL;
  }
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  float d = max(-mvPosition.z, .1);
  size = max(size, d * .0045);
  mvPosition.xy += aCorner * (size * (1. - step(.5, laid)));
  vC2 = aCorner; vLaid = laid;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLOW_FRAG = /* glsl */`
varying vec2 vC2; varying vec3 vCol; varying float vLaid;
#include <fog_pars_fragment>
void main(){
  float r = length(vC2);
  float f = max(1. - r, 0.);
  float I = exp(-r * r * 26.) * 3.2 + f * f * f * .55;
  if (vLaid > .5) {
    // a lamp lying in the wet: a long soft streak toward the eye, broken across by the roughness of the ground, soft at both ends
    float x2 = vC2.x * vC2.x, y2 = vC2.y * vC2.y;
    float ym = vC2.y * vLaid;
    float brk = .74 + .26 * sin(ym * 5.3 + sin(ym * 1.7 + vC2.x * 2.) * 2.6) * sin(ym * 2.1 + 1.3);       // (uneven: never a ruled ladder of bars)
    I = exp(-x2 * 6.) * (1. - x2) * exp(-y2 * 3.2) * (1. - y2) * (1. - y2) * 2.1 * brk;
  }
  ${FOG_FADE}
  gl_FragColor = vec4(vCol * I * (1. - fogF), 1.);
}`;

// steam and ground mist: soft lit puffs that rise, swell and thin
const STEAM_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aP; attribute vec4 aVel;
uniform float uTime, uFresh; uniform vec4 uGndK;
varying vec2 vC2; varying vec3 vL; varying vec3 vS;
#include <fog_pars_vertex>
void main(){
  float life = 1. / aP.y;
  float t = fract(uTime * aP.y + aP.x);
  vec3 c = position + aVel.xyz * (t * life);
  c.x += sin(uTime * .31 + aP.x * 31.) * 1.2 * t; c.z += cos(uTime * .27 + aP.x * 17.) * 1.2 * t;
  c.y += sqrt(t) * aP.w * .35;
  float size = aP.z + aP.w * t;
  float al = smoothstep(0., .12, t) * (1. - t) * (1. - t);
  al *= mix(1., uFresh * .4 * uGndK.w, aVel.w);
  vL = c; vC2 = aCorner; vS = vec3(aP.x * 13., t, al);
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
  float ro = aP.x * 6.283 + t * (aP.x - .5) * 2.;
  mat2 R = mat2(cos(ro), -sin(ro), sin(ro), cos(ro));
  mvPosition.xy += R * aCorner * size;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STEAM_FRAG = /* glsl */`
uniform vec3 uCamL;
varying vec2 vC2; varying vec3 vL; varying vec3 vS;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float r = length(vC2);
  float n = fbm(vC2 * 1.7 + vS.x + vec2(0., -vS.y * 1.5));
  float sr = clamp(1. - r - (n - .5) * .55, 0., 1.);
  float a = vS.z * sr * sr * (3. - 2. * sr) * sr;
  if (a < .004) discard;
  vec3 V = normalize(uCamL - vL + vec3(0., 1e-4, 0.));
  float vis = sunVis(vL);
  float fs = max(dot(-V, uSunDir), 0.);
  vec3 col = uAmbCol * 1.15 * shedAO(vL) + uFillCol * .3;
  col += uSunCol * (uSun * vis * (.42 + .8 * fs * fs * fs + .3 * (1. - smoothstep(.2, .9, r))));
  col *= .75 + .4 * n;
  a *= smoothstep(.6, 5., vFogDepth);
  gl_FragColor = vec4(col, a * .68);
  #include <fog_fragment>
}`;

// light shafts through the west flank (additive slabs) and drips (falling streaks)
const SHAFT_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vL;
#include <fog_pars_vertex>
void main(){ vUv = uv; vL = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vL;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float soft = 1. - vUv.y * vUv.y; soft *= soft;
  float along = smoothstep(0., .08, vUv.x) * smoothstep(1., .55, vUv.x);
  float n = fbm(vec2(vUv.x * 7. - uTime * .36, vUv.y * 1.5 + uTime * .17 + vL.z * .1)) * .7 + fbm(vec2(vUv.x * 17. + uTime * .5, vUv.y * 4. - uTime * .3 + vL.z * .3)) * .3;
  n = smoothstep(.22, .78, n);
  vec2 mq = vec2(vUv.x * 70. - uTime * .5, vUv.y * 7. + uTime * .23 + vL.z * .37), mi = floor(mq);
  float mote = step(.93, h21(mi)) * (1. - smoothstep(.05, .32, length(fract(mq) - .5))) * (.5 + .5 * sin(uTime * 3. + h21(mi + 3.1) * 40.));
  float e = smoothstep(-uEdge.w, uEdge.w, uEdge.z - dot(vL.xz, uEdge.xy));
  ${FOG_FADE}
  float lowK = smoothstep(2.4, 6.5, vL.y) * (.35 + .65 * smoothstep(-13., -3., vL.x));       // a beam thins out above the carriage roofs: it never ends as a bar across a tender or a barrow
  float I = soft * along * lowK * (.16 + 1.5 * n + 2.2 * mote) * uSun * e * smoothstep(1.5, 9., vFogDepth) * (1. - fogF);
  gl_FragColor = vec4(uSunCol * I * .13, 1.);
}`;
const DRIP_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aP;
uniform float uTime, uFresh;
varying vec2 vC2; varying vec3 vL; varying float vA;
#include <fog_pars_vertex>
void main(){
  float t = fract(uTime * aP.y + aP.x);
  float fall = t * t * aP.z;
  vec3 c = position - vec3(0., fall, 0.);
  vL = c; vC2 = aCorner;
  vA = (.35 + .65 * uFresh) * step(aP.w, .35 + .65 * uFresh) * smoothstep(0., .1, t);
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
  float d = max(-mvPosition.z, .1);
  float w = max(.022, d * .0011);
  float up = (viewMatrix * vec4(0., 1., 0., 0.)).y;
  mvPosition.xy += vec2(aCorner.x * w, aCorner.y * (.12 + .5 * t) * up);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DRIP_FRAG = /* glsl */`
varying vec2 vC2; varying vec3 vL; varying float vA;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float a = (1. - abs(vC2.x)) * (1. - vC2.y * vC2.y) * vA;
  vec3 col = uHorizCol * .7 + uSunCol * uSun * sunVis(vL) * 1.6;
  gl_FragColor = vec4(col, a * .8);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- geometry accumulator
function makeG() {
  const P = [], N = [], C = [], U = [], KK = [], I = [];
  let cr = 0.5, cg = 0.5, cb = 0.5, kind = 0, n = 0;
  const g = {
    get tris() { return I.length / 3; },
    get nv() { return n; },
    mat(c, k) { if (c) { cr = c[0]; cg = c[1]; cb = c[2]; } if (k !== undefined) kind = k; return g; },
    v(x, y, z, nx, ny, nz, u, v, s = 1) { P.push(x, y, z); N.push(nx, ny, nz); C.push(cr * s, cg * s, cb * s); U.push(u, v); KK.push(kind); return n++; },
    // a,b,c,d counter-clockwise seen from the front; uv a=(u0,v0) b=(u1,v0) c=(u1,v1) d=(u0,v1)
    quad(a, b, c, d, u0 = 0, v0 = 0, u1 = 1, v1 = 1, s = 1) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i = g.v(a[0], a[1], a[2], nx, ny, nz, u0, v0, s);
      g.v(b[0], b[1], b[2], nx, ny, nz, u1, v0, s); g.v(c[0], c[1], c[2], nx, ny, nz, u1, v1, s); g.v(d[0], d[1], d[2], nx, ny, nz, u0, v1, s);
      I.push(i, i + 1, i + 2, i, i + 2, i + 3);
    },
    tri(a, b, c, ua = [0, 0], ub = [1, 0], uc = [0.5, 1], s = 1) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i = g.v(a[0], a[1], a[2], nx, ny, nz, ua[0], ua[1], s);
      g.v(b[0], b[1], b[2], nx, ny, nz, ub[0], ub[1], s); g.v(c[0], c[1], c[2], nx, ny, nz, uc[0], uc[1], s);
      I.push(i, i + 1, i + 2);
    },
    // box by centre and size, rotated ry about Y; uv in metres (scaled by o.uv); o.top / o.bottom false to skip
    box(cx, cy, cz, sx, sy, sz, ry = 0, o = {}) {
      const c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hy = sy / 2, hz = sz / 2, k = o.uv || 1, sh = o.shade || 1;
      const p = (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
      const A = p(-hx, -hy, hz), B = p(hx, -hy, hz), Cc = p(hx, hy, hz), D = p(-hx, hy, hz);
      const E = p(-hx, -hy, -hz), F = p(hx, -hy, -hz), G = p(hx, hy, -hz), H = p(-hx, hy, -hz);
      const u0 = o.u0 || 0, v0 = o.v0 !== undefined ? o.v0 : cy - hy;
      g.quad(A, B, Cc, D, u0, v0 * k, u0 + sx * k, (v0 + sy) * k, sh);
      g.quad(F, E, H, G, u0 + (sx + sz) * k, v0 * k, u0 + (2 * sx + sz) * k, (v0 + sy) * k, sh * 0.96);
      g.quad(B, F, G, Cc, u0 + sx * k, v0 * k, u0 + (sx + sz) * k, (v0 + sy) * k, sh * 0.98);
      g.quad(E, A, D, H, u0 - sz * k, v0 * k, u0, (v0 + sy) * k, sh * 0.98);
      if (o.top !== false) g.quad(D, Cc, G, H, u0, cz * k, u0 + sx * k, (cz + sz) * k, sh * 1.04);
      if (o.bottom) g.quad(E, F, B, A, u0, 0, u0 + sx * k, sz * k, sh * 0.8);
      return g;
    },
    // square-section beam between two points (4 sides, no caps)
    strut(a, b, w, h = w) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz) || 1;
      let sx, sy, sz;                                      // side vector: horizontal, perpendicular to the beam
      if (Math.abs(dx) + Math.abs(dz) < 1e-4) { sx = 1; sy = 0; sz = 0; } else { const l = Math.hypot(dx, dz); sx = dz / l; sy = 0; sz = -dx / l; }
      const tx = dx / len, ty = dy / len, tz = dz / len;
      const ux = sy * tz - sz * ty, uy = sz * tx - sx * tz, uz = sx * ty - sy * tx;
      const hw = w / 2, hh = h / 2;
      const c = (p, i, j) => [p[0] + sx * hw * i + ux * hh * j, p[1] + sy * hw * i + uy * hh * j, p[2] + sz * hw * i + uz * hh * j];
      const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let i = 0; i < 4; i++) { const p0 = q[i], p1 = q[(i + 1) % 4]; g.quad(c(a, p0[0], p0[1]), c(a, p1[0], p1[1]), c(b, p1[0], p1[1]), c(b, p0[0], p0[1]), i * 0.3, 0, i * 0.3 + 0.3, len, 0.92 + 0.04 * i); }
      return g;
    },
    // surface of revolution about a vertical axis; prof = [[r, y], ...] bottom to top; o.flat for facets
    lathe(cx, cy, cz, prof, sides, o = {}) {
      const ph = o.phase || 0, us = o.us || 1, vs = o.vs || 1, sxz = o.sx || 1;
      const vf = (y) => (o.vmap ? (cy + y - o.vmap[0]) / (o.vmap[1] - o.vmap[0]) : (cy + y) * vs);
      for (let j = 0; j < prof.length - 1; j++) {
        const r0 = prof[j][0], y0 = prof[j][1], r1 = prof[j + 1][0], y1 = prof[j + 1][1];
        const dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1, nr = dy / l, ny = -dr / l;
        const rm = Math.max(r0, r1, 0.01);
        if (o.flat) {
          for (let i = 0; i < sides; i++) {
            const a0 = ph + (i / sides) * 6.2832, a1 = ph + ((i + 1) / sides) * 6.2832;
            const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
            const w = rm * 6.2832 / sides * us;
            g.quad([cx + c1 * r0 * sxz, cy + y0, cz + s1 * r0], [cx + c0 * r0 * sxz, cy + y0, cz + s0 * r0], [cx + c0 * r1 * sxz, cy + y1, cz + s0 * r1], [cx + c1 * r1 * sxz, cy + y1, cz + s1 * r1],
              i * w, vf(y0), (i + 1) * w, vf(y1), 0.9 + 0.1 * Math.abs(Math.cos(a0 * 2 + j)));
          }
        } else {
          const base = n;
          for (let i = 0; i <= sides; i++) {
            const a = ph + (i / sides) * 6.2832, c = Math.cos(a), s = Math.sin(a), u = (i / sides) * rm * 6.2832 * us;
            g.v(cx + c * r0 * sxz, cy + y0, cz + s * r0, c * nr, ny, s * nr, u, vf(y0));
            g.v(cx + c * r1 * sxz, cy + y1, cz + s * r1, c * nr, ny, s * nr, u, vf(y1));
          }
          for (let i = 0; i < sides; i++) { const k = base + i * 2; I.push(k, k + 1, k + 3, k, k + 3, k + 2); }
        }
      }
      return g;
    },
    build() { const geo = new THREE.BufferGeometry(); for (const fill of fills) fill(geo); return geo; },
    // the same geometry, handing the page back after each attribute (pause: the build's yield)
    async buildAsync(pause) { const geo = new THREE.BufferGeometry(); for (const fill of fills) { fill(geo); await pause(); } return geo; },
  };
  const fills = [
    (geo) => geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)),
    (geo) => geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)),
    (geo) => geo.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)),
    (geo) => geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)),
    (geo) => geo.setAttribute('aK', new THREE.Float32BufferAttribute(KK, 1)),
    (geo) => geo.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1)),
    (geo) => geo.computeBoundingSphere(),
  ];
  return g;
}

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mulc = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// ---------------------------------------------------------------- track layout
const SPANS = [-50, -25, 0, 25];
const ROAD_OFF = [-9.9, -2.2, 6.4, 10.3];
const MID_OF = [0, 1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 8, 9, 10, 11, 11];
const APP_OF = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 3];
const OUR_X = -2.6;                              // our own line: the eye rides 1 m outside the coach side
const APP_X = [-6.8, OUR_X, 2.4, 7.0];
const OUR_ROAD = 9, RIVAL_ROAD = 10;

function layoutTracks(rng, L) {
  const pitch = rng.range(4.35, 4.85);
  const zA0 = L - 10, zA1 = rng.range(150, 172), zB0 = zA1 - rng.range(14, 22), zB1 = rng.range(54, 60);
  const roadX = [], midX = [];
  for (let s = 0; s < 4; s++) for (let j = 0; j < 4; j++) roadX.push(s === 2 && j === 1 ? OUR_X : SPANS[s] + ROAD_OFF[j]);
  for (let m = 0; m < 12; m++) midX.push(m === 7 ? OUR_X : -2.2 + (m - 7) * pitch);
  const curve = (z) => { const d = Math.max(0, z - 260); return d * d / 1340; };
  const sid = [];
  for (let i = 1, n = rng.int(2, 3); i <= n; i++) sid.push({ base: 15, off: pitch * i, zs: 244 - i * rng.range(9, 13), ze: 60 + i * rng.range(4, 8) });
  for (let i = 1; i <= 2; i++) sid.push({ base: 0, off: -pitch * i, zs: 248 - i * rng.range(9, 13), ze: 58 + i * rng.range(4, 8) });
  const xAt = (r, z) => {
    if (r >= 16) { const sd = sid[r - 16]; return xAt(sd.base, z) + sd.off * smoothstep(sd.zs, sd.zs - 36, z); }
    const m = MID_OF[r], ax = APP_X[APP_OF[m]];
    const s1 = smoothstep(zA0, zA1, z), s2 = smoothstep(zB0, zB1, z);
    return ax + (midX[m] - ax) * s1 + (roadX[r] - midX[m]) * s2 + curve(z);
  };
  const tracks = [];
  const seenMid = new Set(), seenApp = new Set();
  for (let r = 0; r < 16; r++) {
    const m = MID_OF[r], a = APP_OF[m];
    let from = L;
    if (seenMid.has(m)) from = zB0 + 2; else if (seenApp.has(a)) from = zA0 + 2;
    seenMid.add(m); seenApp.add(a);
    const end = r === OUR_ROAD ? -146 : -133 + (r % 3) * 0.8;
    const pts = [];
    for (let z = from; z > end; z -= 5) pts.push([xAt(r, z), z]);
    pts.push([xAt(r, end), end]);
    tracks.push({ x: roadX[r], pts, from, end });
  }
  sid.forEach((sd, i) => {
    const pts = [];
    for (let z = sd.zs + 2; z > sd.ze; z -= 5) pts.push([xAt(16 + i, z), z]);
    pts.push([xAt(16 + i, sd.ze), sd.ze]);
    tracks.push({ x: xAt(16 + i, sd.ze), pts, from: sd.zs + 2, end: sd.ze, siding: true });
  });
  return { tracks, xAt, roadX, midX, zA0, zA1, zB0, zB1 };
}

function buildTrackGeometry(lay, rng) {
  const P = [], U = [], M = [], T = [], I = []; let n = 0;
  const strip = (pts, off, hw, y, mode, vertical) => {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const nx = -tz, nz = tx;                               // left normal
      if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const x = pts[i][0] + nx * off, z = pts[i][1] + nz * off;
      if (vertical) { P.push(x, y, z, x, y - hw, z); U.push(-1, s, 1, s); }
      else { P.push(x - nx * hw, y, z - nz * hw, x + nx * hw, y, z + nz * hw); U.push(-hw, s, hw, s); }
      M.push(mode, mode); T.push(tx, 0, tz, tx, 0, tz);
      if (i > 0) I.push(n - 2, n - 1, n + 1, n - 2, n + 1, n);
      n += 2;
    }
  };
  lay.tracks.forEach((t, r) => {
    strip(t.pts, 0, 1.42, 0.03 + r * 0.004, 0, false);
    const near = r >= 8 && r <= 11;
    for (const side of [-0.84, 0.84]) {
      strip(t.pts, side, 0.2, 0.19, 1, false);
      if (near) strip(t.pts, side, 0.16, 0.185, 2, true);
    }
  });
  // point rodding: runs beside our line and out to the cabin side
  const rod = []; for (let z = 262; z >= 62; z -= 8) rod.push([0.15 + Math.max(0, z - 260) ** 2 / 1340, z]);
  strip(rod, 0, 0.5, 0.2, 3, false);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  geo.setAttribute('aM', new THREE.Float32BufferAttribute(M, 1));
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(T, 3));
  geo.setIndex(I);
  return geo;
}

function buildGroundGeometry(lay, L) {
  const x0 = -75, x1 = 50, z0 = -146, z1 = L + 4, nx = 62, nz = Math.round((z1 - z0) / 4);
  const P = [], D = [], I = [];
  for (let j = 0; j <= nz; j++) {
    const z = z0 + (z1 - z0) * j / nz;
    const xs = lay.tracks.map((t, r) => (z <= t.from + 3 && z >= t.end - 1 ? lay.xAt(r, z) : 1e6));
    for (let i = 0; i <= nx; i++) {
      const x = x0 + (x1 - x0) * i / nx;
      let d = 9; for (let r = 0; r < xs.length; r++) d = Math.min(d, Math.abs(x - xs[r]));
      P.push(x, 0, z); D.push(d);
    }
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + nx + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('aTd', new THREE.Float32BufferAttribute(D, 1));
  geo.setIndex(I);
  return geo;
}

// sprite batches (glows, steam, drips): quads expanded in the vertex shader
function makeSprites(names) {
  const P = [], Cn = [], I = [], A = {}; let n = 0;
  for (const k in names) A[k] = [];
  return {
    get count() { return n / 4; },
    add(x, y, z, attrs) {
      const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let i = 0; i < 4; i++) { P.push(x, y, z); Cn.push(q[i][0], q[i][1]); for (const k in names) { const a = attrs[k]; for (let j = 0; j < names[k]; j++) A[k].push(a[j]); } }
      I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('aCorner', new THREE.Float32BufferAttribute(Cn, 2));
      for (const k in names) geo.setAttribute(k, new THREE.Float32BufferAttribute(A[k], names[k]));
      geo.setIndex(I);
      return geo;
    },
  };
}

// lattice mast: four corner posts with zigzag bracing on every face
function latticeMast(g, x, z, y0, y1, w, bar, panel) {
  const h = w / 2, c = [[-h, -h], [h, -h], [h, h], [-h, h]];
  for (const p of c) g.strut([x + p[0], y0, z + p[1]], [x + p[0], y1, z + p[1]], bar * 1.3);
  const np = Math.max(1, Math.round((y1 - y0) / panel));
  for (let f = 0; f < 4; f++) {
    const a = c[f], b = c[(f + 1) % 4];
    for (let i = 0; i < np; i++) {
      const ya = y0 + (y1 - y0) * i / np, yb = y0 + (y1 - y0) * (i + 1) / np, fl = (i + f) % 2;
      g.strut([x + (fl ? a : b)[0], ya, z + (fl ? a : b)[1]], [x + (fl ? b : a)[0], yb, z + (fl ? b : a)[1]], bar);
    }
  }
}

// The dome's axis and the size of its body (buildTerminus builds it from these): the drum it stands on is DOME_R0 * DOME_SR
// (12.42 m) in radius, the dome itself a little less.
const DOME_X = -12, DOME_Z = -166, DOME_R0 = 9.2, DOME_SR = 1.35;
// A doll with its arm: from the tip of the arm, 1.56 m left of the post, to the edge of the spectacle plate, 0.61 m right.
const DOLL_LEFT = 1.56, DOLL_RIGHT = 0.61, DOLL_JITTER = 0.5;
// The band of a gantry at z that the sight lines to the dome's body cross, for eyes on the camera's line (x 0) at every
// 2.5 m of the route's last straight before the gantry (from zFrom, where that straight begins, down to the gantry): the
// two lines from each eye that touch the drum, taken to the gantry's plane. [left, right] in metres of x.
function domeBand(z, zFrom) {
  let lo = Infinity, hi = -Infinity;
  for (let ze = zFrom; ze > z; ze -= 2.5) {
    const a0 = Math.atan2(DOME_X, ze - DOME_Z), da = Math.asin(DOME_R0 * DOME_SR / Math.hypot(DOME_X, ze - DOME_Z));
    lo = Math.min(lo, (ze - z) * Math.tan(a0 - da)); hi = Math.max(hi, (ze - z) * Math.tan(a0 + da));
  }
  return lo < hi ? [lo, hi] : null;
}

// one signal gantry across the throat at z; returns its anchor
function buildGantry(g, ga, z, uG, lay, rng, C, out, dolls, band = null) {
  // dolls: the stream this gantry's dolls draw from (its own). band: a stretch of the bridge [left, right] that no doll may
  // stand in (see domeBand): a road whose doll, with its arm and wherever its jitter might put it, would reach into the
  // band has no doll on this gantry; it takes no draw and builds nothing.
  const xs = [];
  lay.tracks.forEach((t, r) => { if (t.from + 1 >= z && t.end <= z) { const x = lay.xAt(r, z); if (!xs.some((v) => Math.abs(v.x - x) < 1.2)) xs.push({ x, r }); } });
  xs.sort((a, b) => a.x - b.x);
  const xl = xs[0].x - rng.range(3.6, 5), xr = xs[xs.length - 1].x + rng.range(3.6, 5);
  const y0 = 7.6, y1 = 9.2, hz = 0.6;
  const legs = [xl, xr], gaps = [];
  for (let i = 0; i < xs.length - 1; i++) { const w = xs[i + 1].x - xs[i].x, m = (xs[i].x + xs[i + 1].x) / 2; if (w >= 4.25 && Math.abs(m) > 7) gaps.push(m); }
  for (const want of [lerp(xl, xr, 0.36), lerp(xl, xr, 0.7)]) {
    let best = null; for (const m of gaps) if (best === null || Math.abs(m - want) < Math.abs(best - want)) best = m;
    if (best !== null && Math.abs(best - want) < 14 && !legs.some((v) => Math.abs(v - best) < 8)) legs.push(best);
  }
  g.mat(C.iron, K.IRON);
  for (const lx of legs) {
    g.mat(C.stoneDark, K.STONE).box(lx, 0.3, z, 1.9, 0.6, 1.9, 0, { v0: 0 });
    g.mat(C.iron, K.IRON); latticeMast(g, lx, z, 0.6, y1, 1.1, 0.11, 1.45);
  }
  // box truss bridge
  const np = Math.round((xr - xl) / 1.6), dx = (xr - xl) / np;
  for (const zz of [z - hz, z + hz]) for (const yy of [y0, y1]) g.strut([xl - 0.6, yy, zz], [xr + 0.6, yy, zz], 0.17);
  for (let i = 0; i <= np; i++) {
    const xa = xl + i * dx, xb = xa + dx, fl = i % 2;
    for (const zz of [z - hz, z + hz]) {
      g.strut([xa, y0, zz], [xa, y1, zz], 0.1);
      if (i < np) g.strut([xa, fl ? y0 : y1, zz], [xb, fl ? y1 : y0, zz], 0.09);
    }
    if (i < np && i % 2 === 0) g.strut([xa, y1, z - hz], [xb, y1, z + hz], 0.08);
  }
  // walkway, handrail, rust-streaked plank deck
  g.mat(C.wood, K.WOOD).box((xl + xr) / 2, y1 + 0.12, z - 0.15, xr - xl + 1, 0.07, 1.0, 0, { uv: 1 });
  g.mat(C.iron, K.IRON).strut([xl, y1 + 1.15, z - hz], [xr, y1 + 1.15, z - hz], 0.07);
  for (let x = xl; x <= xr; x += 3.2) g.strut([x, y1, z - hz], [x, y1 + 1.15, z - hz], 0.06);
  // dolls with semaphore arms
  const perches = [];
  const red = [1.0, 0.07, 0.03], green = [0.05, 1.0, 0.55];
  for (const t of xs) {
    const ours = t.r === OUR_ROAD, x0 = t.x + (ours ? -OUR_X : 0), jit = ours ? 0 : DOLL_JITTER;
    if (band && x0 + jit + DOLL_RIGHT > band[0] && x0 - jit - DOLL_LEFT < band[1]) continue;
    if (!ours && t.r !== RIVAL_ROAD && out.arms.length >= out.maxArms - 1) continue;
    if (!ours && t.r !== RIVAL_ROAD && dolls.chance(0.12)) continue;
    const x = x0 + (ours ? 0 : dolls.range(-DOLL_JITTER, DOLL_JITTER)), top = y1 + dolls.range(3.9, 5.4), zf = z + hz;
    g.mat(C.cream, K.IRON).strut([x, y1, zf], [x, top - 1.6, zf], 0.2);
    g.mat(C.iron, K.IRON).strut([x, top - 1.6, zf], [x, top, zf], 0.17);
    g.lathe(x, top, zf, [[0.16, 0], [0.2, 0.08], [0.02, 0.5]], 4, { flat: true, phase: 0.785 });
    g.mat(C.iron, K.LATTICE).quad([x + 0.52, y1, zf - 0.3], [x + 0.52, top - 0.5, zf - 0.3], [x + 0.12, top - 0.5, zf - 0.3], [x + 0.12, y1, zf - 0.3], 0, 0, (top - 0.5 - y1) / 0.4, 1);
    perches.push(new THREE.Vector3(x, top + 0.5, zf));
    const nArm = !ours && dolls.chance(0.22) ? 2 : 1;
    for (let k = 0; k < nArm && out.arms.length < out.maxArms; k++) {
      const py = top - 0.75 - k * 1.5, pz = zf + 0.2, a = ga, v0 = a.nv;
      const dist = k === 1;
      a.mat(dist ? [0.75, 0.5, 0.06] : [0.62, 0.05, 0.04], K.MATTE).box(x - 0.55, py, pz, 0.9, 0.27, 0.035);
      a.mat([0.8, 0.78, 0.7], K.MATTE).box(x - 1.1, py, pz, 0.2, 0.27, 0.035);
      a.mat(dist ? [0.75, 0.5, 0.06] : [0.62, 0.05, 0.04], K.MATTE).box(x - 1.38, py, pz, 0.36, 0.27, 0.035);
      a.mat(C.iron, K.IRON).box(x + 0.3, py - 0.13, pz - 0.03, 0.62, 0.56, 0.03);
      a.mat(red, K.GLOW).box(x + 0.45, py, pz, 0.17, 0.17, 0.02);
      a.mat(green, K.GLOW).box(x + 0.31, py - 0.32, pz, 0.17, 0.17, 0.02);
      let st = 0, sw = 2;
      if (ours) sw = uG - 0.085 - k * 0.01;
      else if (t.r === RIVAL_ROAD) { st = 1; sw = uG - 0.2; }
      else if (t.r === 13) { sw = 0.5 + dolls.range(0, 0.04); }
      else if (dolls.chance(0.25)) { st = 1; sw = dolls.range(0.52, 0.92); }
      else if (dolls.chance(0.3)) sw = dolls.range(0.52, 0.92);
      out.arms.push({ v0, v1: a.nv, piv: [x, py, pz, sw], arm: [0.82, st, dolls()] });
      g.mat(C.iron, K.IRON).box(x + 0.45, py, pz - 0.2, 0.2, 0.26, 0.2);
      const cA = st ? green : red, cB = st ? red : green;
      for (const mode of [0, 1]) out.glows.add(x + 0.45, py, pz + 0.08, { aColA: mulc(cA, 2.6), aColB: mulc(cB, 2.6), aSw: [sw, dolls(), 0.42, mode] });
    }
  }
  return { z, y0, y1, xl, xr, perches, band };
}

function buildCabin(g, cx, cz, rng, C, out) {
  const fy = 4.4, w = 3.8, len = rng.range(8, 10.5), h = 2.9;
  // stilts with bracing, stair, brick locking room under one end
  g.mat(C.iron, K.IRON);
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    const z = cz - len / 2 + 0.4 + (len - 0.8) * i / 3, x = cx + sx * (w / 2 - 0.25);
    g.strut([x, 0, z], [x, fy, z], 0.2);
    if (i < 3) { const z2 = z + (len - 0.8) / 3; g.strut([x, 0.3, i % 2 ? z : z2], [x, fy - 0.2, i % 2 ? z2 : z], 0.09); }
  }
  g.mat(C.brick, K.BRICK).box(cx, 1.3, cz - len / 2 + 1.6, w - 0.7, 2.6, 2.6, 0, { v0: 0 });
  // floor, balcony toward the tracks (+X), railing
  g.mat(C.wood, K.WOOD).box(cx + 0.5, fy + 0.1, cz, w + 1.6, 0.2, len + 0.8, 0, { bottom: true });
  g.mat(C.iron, K.IRON);
  const bx = cx + w / 2 + 1.2;
  g.strut([bx, fy + 1.2, cz - len / 2 - 0.3], [bx, fy + 1.2, cz + len / 2 + 0.3], 0.07);
  for (let i = 0; i <= 6; i++) { const z = cz - len / 2 - 0.3 + (len + 0.6) * i / 6; g.strut([bx, fy + 0.2, z], [bx, fy + 1.2, z], 0.06); }
  // walls: maroon dado, cream above, a band of windows on three sides
  const y0 = fy + 0.2;
  g.mat(C.maroon, K.WOOD).box(cx, y0 + 0.5, cz, w, 1.0, len, 0, { top: false });
  g.mat(C.creamPaint, K.WOOD).box(cx, y0 + h - 0.25, cz, w, 0.5, len, 0, { top: false });
  g.mat(C.glass, K.GLASS);
  const gx = w / 2 - 0.03, gz = len / 2 - 0.03;
  g.quad([cx + gx, y0 + 1, cz + gz], [cx + gx, y0 + 1, cz - gz], [cx + gx, y0 + h - 0.5, cz - gz], [cx + gx, y0 + h - 0.5, cz + gz], 0, 0, len, 1.4);
  g.quad([cx - gx, y0 + 1, cz + gz], [cx + gx, y0 + 1, cz + gz], [cx + gx, y0 + h - 0.5, cz + gz], [cx - gx, y0 + h - 0.5, cz + gz], 0, 0, w, 1.4);
  g.quad([cx + gx, y0 + 1, cz - gz], [cx - gx, y0 + 1, cz - gz], [cx - gx, y0 + h - 0.5, cz - gz], [cx + gx, y0 + h - 0.5, cz - gz], 0, 0, w, 1.4);
  g.mat(C.creamPaint, K.WOOD).box(cx - gx + 0.05, y0 + 1.7, cz, 0.1, 1.4, len, 0, { top: false });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(cx + sx * (w / 2 - 0.08), y0 + 1.7, cz + sz * (len / 2 - 0.08), 0.2, 1.4, 0.2, 0, { top: false });
  // hipped slate roof with deep eaves, ridge, stove pipe
  const ry = y0 + h, ex = w / 2 + 0.7, ez = len / 2 + 0.7, rh = 1.5, rz = len / 2 - 1.2;
  g.mat(C.slate, K.SLATE);
  g.quad([cx + ex, ry, cz + ez], [cx + ex, ry, cz - ez], [cx, ry + rh, cz - rz], [cx, ry + rh, cz + rz], 0, 0, len, 2.4);
  g.quad([cx - ex, ry, cz - ez], [cx - ex, ry, cz + ez], [cx, ry + rh, cz + rz], [cx, ry + rh, cz - rz], 0, 0, len, 2.4);
  g.tri([cx - ex, ry, cz + ez], [cx + ex, ry, cz + ez], [cx, ry + rh, cz + rz], [0, 0], [w, 0], [w / 2, 2.4]);
  g.tri([cx + ex, ry, cz - ez], [cx - ex, ry, cz - ez], [cx, ry + rh, cz - rz], [0, 0], [w, 0], [w / 2, 2.4]);
  g.mat(C.wood, K.WOOD).box(cx, ry - 0.06, cz, ex * 2, 0.1, ez * 2, 0, { bottom: true, top: false });
  g.mat(C.iron, K.IRON).lathe(cx - 0.9, ry + 0.6, cz + rz - 1, [[0.11, 0], [0.11, 1.7], [0.2, 1.75], [0.2, 1.95], [0.02, 2.1]], 6);
  for (const sz of [-1, 1]) g.lathe(cx, ry + rh, cz + sz * rz, [[0.09, 0], [0.13, 0.15], [0.02, 0.7]], 4, { flat: true });
  // stair up the back, fire buckets under the balcony, lamp inside
  g.mat(C.wood, K.WOOD);
  for (let i = 0; i < 9; i++) g.box(cx - w / 2 - 0.55, 0.3 + i * 0.5, cz + len / 2 - 0.6 - i * 0.55, 0.9, 0.07, 0.34);
  g.mat(C.iron, K.IRON).strut([cx - w / 2 - 1.0, 1.2, cz + len / 2 - 0.4], [cx - w / 2 - 1.0, fy + 1.2, cz + len / 2 - 5.4], 0.07);
  for (let i = 0; i < 4; i++) g.mat([0.55, 0.06, 0.04], K.MATTE).lathe(bx, fy - 0.5, cz - 1.2 + i * 0.75, [[0.1, 0], [0.16, 0.3]], 6);
  out.glows.add(cx, y0 + 2.0, cz, { aColA: [1.6, 0.9, 0.4], aColB: [1.6, 0.9, 0.4], aSw: [2, rng(), 0.5, 0] });
  out.steam.add(cx - 0.9, ry + 2.7, cz + rz - 1, { aP: [rng(), 0.16, 0.25, 1.6], aVel: [0.25, 1.1, 0.1, 0] });
  return new THREE.Vector3(cx, fy + 0.2, cz);
}

function waterColumn(g, x, z, dir, rng, C, out) {
  g.mat(C.stoneDark, K.STONE).box(x, 0.12, z, 1.1, 0.24, 1.1, 0, { v0: 0 });
  g.mat(C.maroon, K.IRON).lathe(x, 0.24, z, [[0.36, 0], [0.36, 0.25], [0.24, 0.45], [0.2, 1.4], [0.24, 1.5], [0.19, 1.6], [0.17, 4.0], [0.26, 4.1], [0.26, 4.3], [0.1, 4.55]], 8);
  const ax = x + dir * 2.5, y = 4.3;
  g.mat(C.iron, K.IRON).strut([x, y, z], [ax, y + 0.15, z], 0.22);
  g.strut([x, y - 1.0, z], [x + dir * 1.5, y + 0.05, z], 0.07);
  g.lathe(x - dir * 0.45, 1.3, z, [[0.02, 0], [0.24, 0.02], [0.24, 0.07], [0.02, 0.09]], 8);          // valve wheel
  g.mat(C.leather, K.MATTE).lathe(ax, y - 1.75, z, [[0.07, 0], [0.11, 0.5], [0.17, 1.3], [0.15, 1.75]], 6);
  for (let i = 0; i < 3; i++) out.drips.add(ax, y - 1.75, z, { aP: [rng(), rng.range(0.7, 1.3), 2.5, rng() * 0.3] });
  return new THREE.Vector3(ax, y - 1.75, z);
}

// the dressing of the throat: boundary walls, cabin, water columns, ground discs, hut, stacks, lamps
function buildThroat(g, lay, L, rng, C, out, anchors) {
  for (const wx of [-74.2, 49.2]) {
    const off = (z) => Math.max(0, z - 260) ** 2 / 1340;
    for (let z = 0; z < L; z += 20) {
      const za = z, zb = Math.min(L, z + 20), x = wx + off((za + zb) / 2), hgt = 2.7 + 0.25 * Math.sin(z * 0.37 + wx);
      g.mat(mulc(C.brick, rng.range(0.85, 1.1)), K.BRICK).box(x, hgt / 2, (za + zb) / 2, 0.5, hgt, zb - za, 0, { v0: 0, u0: z });
      g.mat(C.stoneDark, K.STONE).box(x, hgt + 0.08, (za + zb) / 2, 0.7, 0.16, zb - za);
      g.mat(mulc(C.brick, 0.9), K.BRICK).box(x, (hgt + 0.3) / 2, za + 0.4, 0.85, hgt + 0.3, 0.8, 0, { v0: 0 });
    }
  }
  // signal cabin on the storm side, glass toward the sun
  const cz = rng.range(118, 160);
  let minX = 1e9; lay.tracks.forEach((t, r) => { if (t.end < cz) minX = Math.min(minX, lay.xAt(r, cz - 6), lay.xAt(r, cz + 6)); });
  anchors.cabin = buildCabin(g, Math.min(-42, minX - 7.5), cz, rng, C, out);
  // water columns at the platform ends
  anchors.waterColumns = [[-12.3, 1], [12.7, -1], [-37.3, 1], [38.2, -1]].map(([x, d], i) => waterColumn(g, x, 50 + (i % 2) * 3.5, d, rng, C, out));
  // ground discs and point levers beside the turnouts
  for (let i = 0; i < 12; i++) {
    const r = rng.int(0, 15), z = rng.range(70, L - 30), x = lay.xAt(r, z) + (rng.chance(0.5) ? 2.05 : -2.05);
    if (Math.abs(x) < 1.2 || lay.tracks.some((t, k) => t.end < z && t.from > z && Math.abs(lay.xAt(k, z) - x) < 1.9)) continue;
    g.mat(C.iron, K.IRON).box(x, 0.3, z, 0.12, 0.6, 0.12);
    g.mat([0.8, 0.78, 0.72], K.MATTE).box(x, 0.72, z + 0.07, 0.4, 0.4, 0.04);
    g.mat([0.6, 0.05, 0.04], K.MATTE).box(x, 0.72, z + 0.1, 0.4, 0.09, 0.02);
    out.glows.add(x, 0.98, z + 0.12, { aColA: [1.6, 0.12, 0.05], aColB: [0.1, 1.6, 0.8], aSw: [rng.chance(0.4) ? rng.range(0.5, 0.9) : 2, rng(), 0.16, 0] });
    g.mat(C.iron, K.IRON).strut([x + 0.5, 0.05, z - 0.6], [x + 0.75, 0.95, z - 0.6], 0.07);
    g.mat([0.8, 0.78, 0.72], K.MATTE).box(x + 0.76, 1.0, z - 0.6, 0.16, 0.16, 0.16);
  }
  // riveted water tank on a lattice trestle (west side, in the sun), ash and ballast heaps (east)
  {
    const tz = rng.range(175, 215); let mx = -1e9;
    lay.tracks.forEach((t, r) => { if (t.end < tz - 6 && t.from > tz - 6) mx = Math.max(mx, lay.xAt(r, tz - 6), lay.xAt(r, tz + 6)); });
    const tx = Math.max(mx + 7.5, 40);
    if (tx < 45) {
      g.mat(C.iron, K.IRON);
      for (const sx of [-2.4, 2.4]) for (const sz of [-1.8, 1.8]) { g.mat(C.stoneDark, K.STONE).box(tx + sx, 0.25, tz + sz, 1.3, 0.5, 1.3, 0, { v0: 0 }); g.mat(C.iron, K.IRON); latticeMast(g, tx + sx, tz + sz, 0.5, 6.6, 0.8, 0.09, 1.5); }
      for (const sz of [-1.8, 1.8]) g.strut([tx - 3.4, 6.75, tz + sz], [tx + 3.4, 6.75, tz + sz], 0.3);
      g.mat(mixc(C.maroon, C.iron, 0.5), K.IRON).box(tx, 8.25, tz, 6.8, 2.7, 4.6, 0, { bottom: true });
      g.mat(C.iron, K.IRON);
      for (const yy of [6.98, 8.25, 9.55]) g.box(tx, yy, tz, 6.95, 0.12, 4.75, 0, { top: false });
      for (let i = -2; i <= 2; i++) g.box(tx + i * 1.36, 8.25, tz, 0.1, 2.7, 4.72, 0, { top: false });
      g.mat(C.iron, K.LATTICE).quad([tx - 3.5, 0.3, tz + 2.5], [tx - 3.5, 9.9, tz + 2.5], [tx - 3.5, 9.9, tz + 2.05], [tx - 3.5, 0.3, tz + 2.05], 0, 0, 24, 1);
      g.mat(C.leather, K.MATTE).lathe(tx - 2.2, 4.4, tz - 2.9, [[0.1, 0], [0.16, 0.6], [0.14, 2.35]], 6);
      g.mat(C.iron, K.IRON).strut([tx - 2.2, 6.9, tz - 1.8], [tx - 2.2, 6.75, tz - 2.9], 0.2);
      for (let i = 0; i < 9; i++) out.drips.add(tx + rng.range(-3.3, 3.3), 6.9, tz + (rng.chance(0.5) ? 2.3 : -2.3), { aP: [rng(), rng.range(0.6, 1.1), 6.8, rng() * 0.6] });
      anchors.waterTank = new THREE.Vector3(tx, 9.7, tz);
    }
    for (let i = 0; i < 7; i++) {
      const hz = rng.range(170, L - 30), hx2 = rng.range(-71, -52), r0 = rng.range(1.4, 2.8), hh = r0 * rng.range(0.38, 0.5);
      if (lay.tracks.some((t, r) => t.end < hz && t.from > hz && Math.abs(lay.xAt(r, hz) - hx2) < r0 + 2.4)) continue;
      g.mat(rng.chance(0.5) ? [0.035, 0.033, 0.035] : [0.2, 0.18, 0.15], K.MATTE).lathe(hx2, 0, hz, [[r0, 0], [r0 * 0.55, hh * 0.65], [r0 * 0.12, hh]], 7, { phase: rng() * 6, sx: rng.range(0.8, 1.5) });
    }
  }
  // platelayers' hut with a stone-weighted tin roof, sleeper stacks, rail lengths, lamp posts
  const hx = -68 + rng.range(-1.5, 1.5), hzz = rng.range(36, 50);
  g.mat(C.brick, K.BRICK).box(hx, 1.15, hzz, 3.4, 2.3, 2.8, 0, { v0: 0, top: false });
  g.mat(C.tin, K.CORR).quad([hx - 2.1, 2.2, hzz + 1.8], [hx + 2.1, 2.7, hzz + 1.8], [hx + 2.1, 2.7, hzz - 1.8], [hx - 2.1, 2.2, hzz - 1.8], 0, 0, 3.6, 4.2);
  for (let i = 0; i < 6; i++) { const px = hx + rng.range(-1.7, 1.7); g.mat(C.stoneDark, K.MATTE).box(px, 2.5 + px * 0 + (px - hx) * 0.12, hzz + rng.range(-1.4, 1.4), 0.3, 0.2, 0.26, rng() * 3); }
  g.mat(C.maroon, K.WOOD).box(hx + 1.72, 1.0, hzz + 0.4, 0.06, 2.0, 0.9);
  for (let s = 0; s < 3; s++) {
    const sx = 43 + rng.range(-2, 2), sz = rng.range(80, 230), ry = rng.range(-0.2, 0.2);
    let maxX = -1e9; lay.tracks.forEach((t, r) => { if (t.end < sz + 3) maxX = Math.max(maxX, lay.xAt(r, sz)); });
    if (sx < maxX + 3.6) continue;
    for (let j = 0; j < 4; j++) g.mat(mulc(C.sleeper, rng.range(0.8, 1.3)), K.WOOD).box(sx, 0.14 + j * 0.27, sz, 2.6, 0.25, 2.2 - j * 0.3, ry + (j % 2) * 1.5708);
  }
  lay.tracks.forEach((t) => {                               // buffer stops of the sidings
    if (!t.siding) return;
    const x = t.x, z = t.end - 0.5;
    g.mat([0.5, 0.07, 0.05], K.WOOD).box(x, 1.05, z, 2.5, 0.4, 0.45);
    for (const sx of [-0.84, 0.84]) g.mat(C.iron, K.IRON).strut([x + sx, 0.15, z + 2.2], [x + sx, 1.1, z], 0.14).strut([x + sx, 0.15, z + 0.1], [x + sx, 1.2, z + 0.1], 0.14);
    out.glows.add(x, 1.55, z + 0.3, { aColA: [1.6, 0.1, 0.04], aColB: [1.6, 0.1, 0.04], aSw: [2, rng(), 0.26, 0] });
  });
  anchors.sidings = lay.tracks.filter((t) => t.siding).map((t) => t.pts);
  g.mat([0.22, 0.12, 0.08], K.IRON);
  for (let i = 0; i < 5; i++) g.box(-69.5 + i * 0.22, 0.1 + (i % 2) * 0.12, 185, 0.12, 0.14, 11);
  for (const [lx, lz] of [[-72.6, 110], [-72.6, 225], [47.7, 60], [47.7, 170], [47.7, 262]]) {
    g.mat(C.iron, K.IRON).lathe(lx, 0, lz, [[0.2, 0], [0.2, 0.5], [0.1, 0.8], [0.07, 5.2], [0.14, 5.3]], 6);
    g.strut([lx - 0.5, 4.7, lz], [lx + 0.5, 4.7, lz], 0.05);
    g.mat([1.0, 0.75, 0.4], K.GLOW).lathe(lx, 5.3, lz, [[0.14, 0], [0.24, 0.5]], 4, { flat: true, phase: 0.785 });
    g.mat(C.iron, K.IRON).lathe(lx, 5.8, lz, [[0.3, 0], [0.05, 0.25], [0.02, 0.5]], 4, { flat: true, phase: 0.785 });
    out.glows.add(lx, 5.55, lz, { aColA: [1.5, 0.95, 0.45], aColB: [1.5, 0.95, 0.45], aSw: [2, rng(), 0.55, 0] });
  }
}

const SHED = { R: 12.5, SY: 8.5, ZL: -140, BAY: 8.75, NB: 16 };

async function buildShedShell(g, rng, C, out, anchors, pause) {
  const { R, SY, ZL, BAY, NB } = SHED;
  const arc = (c, r, th) => [c + Math.cos(th) * r, SY + Math.sin(th) * r];
  const P4 = 0.7854;
  // --- country gable (z 0) and end screen (z ZL): girder arches, glazed lunettes, valance, stone piers
  for (const zf of [0, ZL]) {
    for (const c of SPANS) {
      const NS = 26;
      for (let i = 0; i < NS; i++) {
        const t0 = Math.PI * i / NS, t1 = Math.PI * (i + 1) / NS;
        const a = arc(c, 11.6, t0), b = arc(c, 12.95, t0), cc = arc(c, 12.95, t1), d = arc(c, 11.6, t1);
        const u0 = i * 1.5, u1 = u0 + 1.5;
        g.mat(C.maroon, K.IRON).quad([a[0], a[1], zf], [b[0], b[1], zf], [cc[0], cc[1], zf], [d[0], d[1], zf], u0, 0, u1, 1.35);
        g.quad([d[0], d[1], zf], [d[0], d[1], zf - 0.8], [a[0], a[1], zf - 0.8], [a[0], a[1], zf], u0, 2, u1, 2.8, 0.8);
        if (zf === 0) g.quad([b[0], b[1], zf], [b[0], b[1], zf - 0.8], [cc[0], cc[1], zf - 0.8], [cc[0], cc[1], zf], u0, 3, u1, 3.8);
        const e = arc(c, 11.42, t0), f = arc(c, 11.42, t1);
        g.mat(C.creamPaint, K.IRON).quad([e[0], e[1], zf + 0.05], [a[0], a[1], zf + 0.05], [d[0], d[1], zf + 0.05], [f[0], f[1], zf + 0.05], u0, 5, u1, 5.2);
      }
      const ta = Math.asin((15 - SY) / 11.42), NL = 14;
      for (let i = 0; i < NL; i++) {
        const t0 = ta + (Math.PI - 2 * ta) * i / NL, t1 = ta + (Math.PI - 2 * ta) * (i + 1) / NL;
        const a = arc(c, 11.42, t0), b = arc(c, 11.42, t1);
        g.mat(C.glass, K.GLASS).quad([b[0], 15, zf - 0.1], [a[0], 15, zf - 0.1], [a[0], a[1], zf - 0.1], [b[0], b[1], zf - 0.1], b[0], 15, a[0], (a[1] + b[1]) / 2);
      }
      const xe = Math.cos(ta) * 11.42;
      g.mat(C.maroon, K.IRON).box(c, 15, zf - 0.1, xe * 2, 0.34, 0.3);
      g.mat(C.creamPaint, K.VALANCE).quad([c - xe + 0.3, 13.75, zf - 0.05], [c + xe - 0.3, 13.75, zf - 0.05], [c + xe - 0.3, 14.9, zf - 0.05], [c - xe + 0.3, 14.9, zf - 0.05], 0, 1, Math.round((xe * 2 - 0.6) / 0.6), 0);
      for (let i = 1; i < 6; i++) { const x = c - xe + (2 * xe) * i / 6, yt = SY + Math.sqrt(Math.max(11.42 * 11.42 - (x - c) * (x - c), 0)); g.mat(C.maroon, K.IRON).strut([x, 15, zf - 0.1], [x, yt, zf - 0.1], 0.14); }
      if (zf === 0) {
        anchors.shedMouths.push(new THREE.Vector3(c, 13, 0));
        const nd = 26; for (let i = 0; i < nd; i++) out.drips.add(c - xe + 0.5 + (2 * xe - 1) * (i + rng()) / nd, 13.8, 0.05, { aP: [rng(), rng.range(0.5, 0.9), 13.6, rng()] });
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = -62.5 + 25 * i, zc = zf === 0 ? -0.95 : ZL - 0.95;
      g.mat(mulc(C.stone, rng.range(0.9, 1.08)), K.STONE);
      g.box(x, 0.55, zc, 3.2, 1.1, 3.2, 0, { v0: 0 }).box(x, 5.25, zc, 2.5, 8.3, 2.5, 0, { v0: 1.1 }).box(x, 9.65, zc, 3.1, 0.5, 3.1);
      g.lathe(x, 9.9, zc, [[1.6, 0], [1.6, 1.3], [0.8, 1.7], [0.8, 2.9], [1.1, 3.1], [0.06, 6.0]], 4, { flat: true, phase: P4, vs: 1 });
      g.mat(C.stoneDark, K.STONE).lathe(x, 15.9, zc, [[0.05, 0], [0.3, 0.2], [0.3, 0.45], [0.04, 0.8]], 6);
      for (const sx of [-0.92, 0.92]) g.mat(C.voussoir, K.STONE).lathe(x + sx, 1.1, zc + 1.3, [[0.24, 0], [0.17, 0.2], [0.17, 7.2], [0.3, 7.6], [0.3, 7.9]], 6);
      if (zf === 0 && i > 0 && i < 4) for (let k = 0; k < 6; k++) out.drips.add(x + rng.range(-0.3, 0.3), 9.2, 0.75, { aP: [rng(), rng.range(0.8, 1.4), 9, rng() * 0.5] });
    }
    await pause();
  }
  // --- flank walls: buff stone arcades (west one glows from inside), buttresses, coping
  for (const [xw, sgn] of [[37.5, 1], [-62.5, -1]]) {
    const xo = xw + sgn * 0.45, xi = xw - sgn * 0.45, H = 9.2, nb = 28;
    g.mat(C.stone, K.ARCADE);
    if (sgn > 0) g.quad([xo, 0, -1.6], [xo, 0, ZL], [xo, H, ZL], [xo, H, -1.6], 0, 0, nb, 1);
    else g.quad([xo, 0, ZL], [xo, 0, -1.6], [xo, H, -1.6], [xo, H, ZL], nb, 0, 0, 1);
    g.mat(mulc(C.stone, 0.9), sgn > 0 ? K.ARCLIT : K.ARCADE);
    if (sgn > 0) g.quad([xi, 0, ZL], [xi, 0, -1.6], [xi, H, -1.6], [xi, H, ZL], nb, 0, 0, 1);
    else g.quad([xi, 0, -1.6], [xi, 0, ZL], [xi, H, ZL], [xi, H, -1.6], 0, 0, nb, 1);
    g.mat(C.stoneLight, K.STONE).box(xw, H + 0.2, ZL / 2, 1.4, 0.4, -ZL - 2);
    for (let k = 1; k < NB; k++) {
      const z = -k * BAY;
      g.mat(mulc(C.stone, rng.range(0.85, 1.05)), K.STONE).box(xo + sgn * 0.5, 4.3, z, 1.0, 8.6, 1.2, 0, { v0: 0 });
      g.box(xo + sgn * 0.3, 8.9, z, 0.6, 0.6, 1.2);
      if (k % 2 === 0) g.lathe(xw, H + 0.4, z, [[0.75, 0], [0.75, 0.8], [0.05, 2.6]], 4, { flat: true, phase: P4 });
    }
  }
  await pause();
  // --- roof: lattice ribs with soffit flange and tie rod, purlins, corrugated and glazed skin
  for (let s = 0; s < 4; s++) {
    const c = SPANS[s];
    for (let k = 1; k < NB; k++) {
      const z = -k * BAY, NS = 18;
      for (let i = 0; i < NS; i++) {
        const t0 = Math.PI * i / NS, t1 = Math.PI * (i + 1) / NS;
        const a = arc(c, 11.3, t0), b = arc(c, 11.3, t1), cc = arc(c, 12.15, t1), d = arc(c, 12.15, t0);
        g.mat(C.ironPaint, K.LATTICE).quad([a[0], a[1], z], [b[0], b[1], z], [cc[0], cc[1], z], [d[0], d[1], z], i * 2.3, 0, (i + 1) * 2.3, 1);
        g.mat(C.maroon, K.IRON).quad([a[0], a[1], z + 0.2], [b[0], b[1], z + 0.2], [b[0], b[1], z - 0.2], [a[0], a[1], z - 0.2], i * 2, 0, i * 2 + 2, 0.4, 0.85);
      }
      if ((k & 7) === 0) await pause();
      g.mat(C.iron, K.IRON).strut([c - 12.2, 9.1, z], [c + 12.2, 9.1, z], 0.09);
      if (k % 3 === 2) {
        g.strut([c, 20.6, z], [c, 10.3, z], 0.05);
        g.mat([1.0, 0.72, 0.36], K.GLOW).lathe(c, 9.55, z, [[0.15, 0], [0.27, 0.55]], 4, { flat: true, phase: P4 });
        g.mat(C.iron, K.IRON).lathe(c, 10.1, z, [[0.44, 0], [0.12, 0.28], [0.04, 0.6]], 6);
        out.glows.add(c, 9.8, z, { aColA: [1.5, 0.92, 0.42], aColB: [1.5, 0.92, 0.42], aSw: [2, rng(), 0.75, 0] });
      } else if (k % 3 === 0) anchors.pigeons.push(new THREE.Vector3(c + rng.range(-9, 9), 9.2, z));
    }
    for (let j = 0; j < 7; j++) {
      const th = Math.PI * (j + 1) / 8, a = arc(c, 11.75, th), b = arc(c, 12.2, th);
      g.mat(C.ironPaint, K.LATTICE).quad([a[0], a[1], -0.8], [a[0], a[1], ZL], [b[0], b[1], ZL], [b[0], b[1], -0.8], 0, 0, 300, 1);
    }
    const NS = 20;
    for (let k = 0; k < NB; k++) {
      if ((k & 7) === 0) await pause();
      const z0 = -k * BAY, z1 = z0 - BAY, tint = rng.range(0.82, 1.12);
      const tarp = rng.chance(0.07) ? rng.int(2, 5) : -1;
      for (let i = 0; i < NS; i++) {
        const t0 = Math.PI * i / NS, t1 = Math.PI * (i + 1) / NS, tm = (t0 + t1) / 2 * 57.3;
        const glassy = (tm > 62 && tm < 118) || (s === 3 && k % 2 === 1 && tm > 9 && tm < 52);
        const a = arc(c, R, t0), b = arc(c, R, t1);
        if (glassy) g.mat(C.glass, K.GLASS);
        else {
          let col = mulc(C.tin, tint * (0.94 + 0.12 * ((i * 7 + k * 3) % 5) / 4));
          if (rng.chance(0.035)) col = rng.chance(0.5) ? C.oxide : mulc(C.tin, 1.6);
          g.mat(col, K.CORR);
        }
        g.quad([a[0], a[1], z0], [a[0], a[1], z1], [b[0], b[1], z1], [b[0], b[1], z0], z0, t0 * R, z1, t1 * R);
        if (i === tarp || i === tarp + 1) {
          const a2 = arc(c, R + 0.1, t0), b2 = arc(c, R + 0.1, t1);
          g.mat(mulc(C.blue, 0.8), K.MATTE).quad([a2[0], a2[1], z0 - 1.2], [a2[0], a2[1], z1 + 2.1], [b2[0], b2[1], z1 + 2.4], [b2[0], b2[1], z0 - 1.5], 0, 0, 5, 2);
        }
      }
      if (k % 2 === 0) {                                      // ridge ventilator, one per two bays
        const zc = z0 - BAY + 0.2;
        g.mat(mulc(C.tin, 0.55), K.CORR).box(c, 21.5, zc, 2.2, 1.2, 14.6, 0, { top: false });
        g.mat(mulc(C.tin, 0.9 * tint), K.CORR);
        g.quad([c + 1.6, 22.0, zc + 7.6], [c + 1.6, 22.0, zc - 7.6], [c, 22.75, zc - 7.6], [c, 22.75, zc + 7.6], 0, 0, 15.2, 1.8);
        g.quad([c - 1.6, 22.0, zc - 7.6], [c - 1.6, 22.0, zc + 7.6], [c, 22.75, zc + 7.6], [c, 22.75, zc - 7.6], 0, 0, 15.2, 1.8);
      }
    }
  }
  // valley gutters and cast columns (maroon base, cream shaft, bracketed capital), fire buckets
  for (const x of [-37.5, -12.5, 12.5]) {
    await pause();
    g.mat(mulc(C.iron, 0.8), K.IRON).box(x, 8.75, ZL / 2, 1.1, 0.4, -ZL - 0.5);
    for (let k = 1; k < NB; k++) {
      const z = -k * BAY;
      g.mat(C.maroon, K.IRON).lathe(x, 0, z, [[0.5, 0], [0.5, 0.3], [0.38, 0.45], [0.38, 1.5], [0.45, 1.58], [0.29, 1.75]], 8);
      g.mat(C.creamPaint, K.IRON).lathe(x, 0, z, [[0.27, 1.75], [0.22, 7.3]], 8);
      g.mat(C.maroon, K.IRON).lathe(x, 0, z, [[0.22, 7.3], [0.31, 7.4], [0.27, 7.5], [0.5, 8.1], [0.58, 8.2], [0.58, 8.55]], 8);
      for (const sx of [-1, 1]) g.mat(C.ironPaint, K.LATTICE).tri([x + sx * 0.25, 6.2, z], [x + sx * 2.7, 8.55, z], [x + sx * 0.25, 8.55, z], [0, 0], [3, 0], [0, 1]);
      if (rng.chance(0.3)) {
        const sx = x > 0 ? 1 : -1;
        g.mat(C.wood, K.WOOD).box(x + sx * 0.36, 1.75, z, 0.08, 0.12, 1.3);
        for (let b = -1; b <= 1; b++) g.mat([0.55, 0.06, 0.04], K.MATTE).lathe(x + sx * 0.5, 1.35, z + b * 0.42, [[0.1, 0], [0.16, 0.3]], 6);
      }
    }
  }
}

function buildShedFloor(g, lay, rng, C, out, anchors) {
  const Y = 1.05, ZA = 34, ZR = 46, ZB = -134, ZL = SHED.ZL;
  const load = () => rng.pick([C.maroon, C.buff, mixc(C.blue, C.leather, 0.6), C.tin, C.leather, C.sack, C.sack]);     // (no bright blue: a blue box with brass bands reads as a sign)
  // a trunk that still reads as a trunk against the light: pale boards, two brass-bound straps, a lighter lid edge
  const trunk = (x, y, z, w, h, d, ry, col) => {
    const c = Math.cos(ry), s = Math.sin(ry), lc = [Math.max(col[0], 0.1), Math.max(col[1], 0.085), Math.max(col[2], 0.07)];
    g.mat(lc, K.WOOD).box(x, y + h / 2, z, w, h, d, ry);
    g.mat(C.brass, K.BRASS);
    for (const e of [-0.3, 0.3]) g.box(x + c * e * w, y + h / 2 + 0.005, z - s * e * w, 0.05, h + 0.01, d + 0.024, ry);
    g.mat(mulc(lc, 1.5), K.MATTE).box(x, y + h * 0.74, z, w + 0.014, 0.028, d + 0.014, ry, { top: false });
    g.mat(C.brass, K.BRASS); for (const e of [-1, 1]) g.box(x + c * e * (w / 2 + 0.012), y + h * 0.5, z - s * e * (w / 2 + 0.012), 0.024, 0.05, d * 0.42, ry, { top: false });   // end handles
  };
  // low: near the portal (z < -95) nothing tall stands close to the eye: the trunks sit on the paving by the far edge, no barrow
  const barrow = (x, z, ry, low) => {
    const c = Math.cos(ry), s = Math.sin(ry);
    if (!low) {
      g.mat(C.wood, K.WOOD).box(x, Y + 0.62, z, 1.7, 0.1, 0.85, ry);
      for (const sd of [-0.46, 0.46]) {                       // two spoked wheels: an iron tyre, six red spokes, a brass hub
        const wx = x + s * sd, wy = Y + 0.42, wz = z + c * sd, R = 0.42, P = (rr, a) => [wx + c * Math.cos(a) * rr, wy + Math.sin(a) * rr, wz - s * Math.cos(a) * rr];
        g.mat([0.2, 0.2, 0.22], K.MATTE);
        for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.2832, a1 = (i + 1) / 12 * 6.2832; g.quad(P(R * 0.82, a0), P(R, a0), P(R, a1), P(R * 0.82, a1), 0, 0, 0.2, 0.2, 0.9 + 0.1 * (i % 2)); }
        g.mat([0.42, 0.07, 0.05], K.MATTE);
        for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * 6.2832; g.quad(P(0.06, a - 0.5), P(R * 0.84, a - 0.07), P(R * 0.84, a + 0.07), P(0.06, a + 0.5), 0, 0, 0.1, 0.4); }
        g.mat(C.brass, K.BRASS);
        for (let i = 0; i < 6; i++) { const a0 = i / 6 * 6.2832, a1 = (i + 1) / 6 * 6.2832; g.tri(P(0, 0), P(0.09, a0), P(0.09, a1)); }
      }
      g.mat(C.iron, K.IRON).strut([x - s * 0.46, Y + 0.42, z - c * 0.46], [x + s * 0.46, Y + 0.42, z + c * 0.46], 0.05);     // the axle
      g.mat(C.wood, K.WOOD).strut([x + c * 0.85, Y + 0.65, z - s * 0.85], [x + c * 1.7, Y + 0.95, z - s * 1.7], 0.07);
      g.strut([x - c * 0.85, Y + 0.6, z + s * 0.85], [x - c * 0.85, Y, z + s * 0.85], 0.07);
    }
    const n = rng.int(2, 4); let h = low ? Y : Y + 0.67;
    for (let i = 0; i < n; i++) {
      const hh = rng.range(0.25, 0.45), col = mulc(load(), rng.range(0.7, 1.1) * 1.7);
      const tx = x + rng.range(-0.25, 0.25), tz = z + rng.range(-0.1, 0.1), tw = rng.range(0.7, 1.2), td = rng.range(0.5, 0.75), tr = ry + rng.range(-0.3, 0.3);
      if (low) { if (h + hh <= Y + 1.1) trunk(4.08 + (tx - x) * 0.3, h, tz, Math.min(tw, 0.95), hh, td, 1.5708 + (tr - ry), col); else continue; }
      else trunk(tx, h, tz, tw, hh, td, tr, col);
      h += hh;
    }
  };
  const crates = (x, z, low) => {
    const n = rng.int(3, 6);
    for (let i = 0; i < n; i++) {
      const sz = rng.range(0.5, 0.9), lv = i > 2 ? 1 : 0, col = mulc(C.crate, rng.range(0.75, 1.2)), jx = rng.range(-0.5, 0.5) * (1 - lv), ry = rng.range(-0.3, 0.3);
      if (low && lv) continue;
      const cx = low ? 4.12 + jx * 0.2 : x + jx, cy = Y + sz / 2 + lv * 0.7, cz = z + (i % 3 - 1) * 0.85 * (1 - lv * 0.6);
      g.mat(col, K.WOOD).box(cx, cy, cz, sz * 1.1, sz, sz, ry);
      g.mat(mulc(col, 1.45), K.MATTE).box(cx, cy + sz * 0.36, cz, sz * 1.1 + 0.03, 0.06, sz + 0.03, ry, { top: false }).box(cx, cy - sz * 0.36, cz, sz * 1.1 + 0.03, 0.06, sz + 0.03, ry, { top: false });   // battens
    }
  };
  const churns = (x, z) => { const n = rng.int(4, 8); for (let i = 0; i < n; i++) g.mat(mulc(C.tin, rng.range(1.1, 1.6)), K.BRASS).lathe(x + (i % 2) * 0.48 + rng.range(-0.05, 0.05), Y, z + Math.floor(i / 2) * 0.5, [[0.2, 0], [0.2, 0.55], [0.12, 0.7], [0.15, 0.78], [0.15, 0.82]], 6); };
  const urn = (x, z) => {
    g.mat(mulc(C.crate, 1.15), K.WOOD).box(x, Y + 0.45, z, 0.9, 0.9, 1.6);
    g.mat(C.cream, K.MATTE).box(x, Y + 0.915, z, 1.0, 0.04, 1.7);                                   // a scrubbed counter top and a painted plinth
    g.mat(C.maroon, K.MATTE).box(x, Y + 0.08, z, 0.93, 0.16, 1.63, 0, { top: false });
    g.mat(C.brass, K.BRASS).lathe(x, Y + 0.9, z + 0.3, [[0.16, 0], [0.24, 0.1], [0.25, 0.5], [0.12, 0.62], [0.05, 0.78]], 8);
    g.lathe(x, Y + 0.9, z - 0.35, [[0.12, 0], [0.17, 0.08], [0.17, 0.34], [0.06, 0.45]], 8);
    for (const [px, pz] of [[-0.5, -0.9], [0.5, -0.9], [0.5, 0.9], [-0.5, 0.9]]) g.mat(C.wood, K.WOOD).strut([x + px, Y, z + pz], [x + px, Y + 2.3 + (px > 0 ? 0.25 : 0), z + pz], 0.06);
    g.mat(mixc(C.cream, C.blue, rng.chance(0.4) ? 0.6 : 0), K.MATTE).quad([x - 0.75, Y + 2.25, z + 1.1], [x + 0.75, Y + 2.6, z + 1.1], [x + 0.75, Y + 2.6, z - 1.1], [x - 0.75, Y + 2.25, z - 1.1], 0, 0, 2, 2);
    out.glows.add(x, Y + 1.25, z + 0.3, { aColA: [1.3, 0.6, 0.2], aColB: [1.3, 0.6, 0.2], aSw: [2, rng(), 0.22, 0] });
    out.steam.add(x, Y + 1.7, z + 0.3, { aP: [rng(), 0.3, 0.12, 0.7], aVel: [0.05, 0.7, 0, 0] });
  };
  const bench = (x, z) => { g.mat(C.maroon, K.WOOD).box(x, Y + 0.42, z, 0.45, 0.07, 2.0).box(x - 0.2, Y + 0.75, z, 0.06, 0.5, 2.0); for (const e of [-0.9, 0.9]) g.mat(C.iron, K.IRON).box(x, Y + 0.2, z + e, 0.42, 0.4, 0.06); };
  anchors.platformEnds = [];
  for (let s = 0; s < 4; s++) {
    const c = SPANS[s];
    for (const [xa, xb] of [[c - 8.2, s === 2 ? OUR_X - 1.8 : c - 3.9], [c - 0.4, c + 4.7]]) {
      const w = xb - xa, mid = (xa + xb) / 2;
      g.mat(mulc(C.pave, rng.range(0.9, 1.08)), K.PAVE);
      g.quad([xa, Y, ZA], [mid, Y, ZA], [mid, Y, ZB], [xa, Y, ZB], 0, ZA, w / 2, ZB);
      g.quad([mid, Y, ZA], [xb, Y, ZA], [xb, Y, ZB], [mid, Y, ZB], w / 2, ZA, 0, ZB);
      g.quad([xa, 0.05, ZR], [xb, 0.05, ZR], [xb, Y, ZA], [xa, Y, ZA], 1, ZR, 1 + w, ZA);
      g.mat(C.brick, K.BRICK);
      g.quad([xa, 0, ZB], [xa, 0, ZA], [xa, Y, ZA], [xa, Y, ZB], ZB, 0, ZA, Y);
      g.quad([xb, 0, ZA], [xb, 0, ZB], [xb, Y, ZB], [xb, Y, ZA], ZA, 0, ZB, Y);
      g.tri([xa, 0, ZA], [xa, 0, ZR], [xa, Y, ZA], [ZA, 0], [ZR, 0], [ZA, Y]);
      g.tri([xb, 0, ZR], [xb, 0, ZA], [xb, Y, ZA], [ZR, 0], [ZA, 0], [ZA, Y]);
      anchors.platformEnds.push(new THREE.Vector3(mid, Y, 30));
      const cam = Math.abs(mid - 2.15) < 0.1;
      const px = () => (cam ? rng.range(3.0, 4.1) : mid + rng.range(-0.9, 0.9));
      if (cam) {
        // our own platform, sliding by below the door: a pile every 18 m, right of the eye and under it
        let kk = 0;
        for (let z = -10; z > ZB + 6; z -= 18, kk++) {
          const low = z < -95;
          barrow(rng.range(3.1, 3.6), z, rng.range(-0.35, 0.35) + (kk % 2 ? 1.5708 : 0), low);
          churns(rng.range(2.5, 2.8), z - 2.6);
          if (kk % 2 === 0) urn(4.0, z + 3.3); else { crates(rng.range(3.5, 4.0), z + 3.2, low); bench(4.3, z - 9); }
        }
        barrow(3.3, 14, 0.3); crates(3.7, 4);
      } else for (let z = 24 - rng.range(0, 8); z > ZB + 6; z -= rng.range(11, 19)) {
        const t = rng();
        if (t < 0.34) barrow(px(), z, rng.range(-0.5, 0.5) + (rng.chance(0.5) ? 1.5708 : 0));
        else if (t < 0.56) crates(px(), z);
        else if (t < 0.74) churns(px() - 0.3, z);
        else if (t < 0.86 && z < -6) urn(cam ? 3.9 : mid, z);
        else bench(cam ? 4.2 : mid, z);
      }
      if (!cam) {                                             // gas lamp on the open platform end
        g.mat(C.maroon, K.IRON).lathe(mid, Y, 22, [[0.18, 0], [0.18, 0.4], [0.08, 0.7], [0.06, 3.4], [0.12, 3.5]], 6);
        g.mat([1.0, 0.75, 0.4], K.GLOW).lathe(mid, Y + 3.5, 22, [[0.12, 0], [0.22, 0.45]], 4, { flat: true, phase: 0.785 });
        g.mat(C.iron, K.IRON).lathe(mid, Y + 3.95, 22, [[0.28, 0], [0.04, 0.24], [0.02, 0.5]], 4, { flat: true, phase: 0.785 });
        out.glows.add(mid, Y + 3.72, 22, { aColA: [1.5, 0.95, 0.45], aColB: [1.5, 0.95, 0.45], aSw: [2, rng(), 0.5, 0] });
      }
    }
  }
  // concourse across the buffer end (our road runs on through it to the portal)
  g.mat(C.pave, K.PAVE);
  for (const [xa, xb] of [[-62.05, OUR_X - 1.8], [-0.4, 37.05]]) {
    g.quad([xa, Y, ZB], [xb, Y, ZB], [xb, Y, ZL - 6], [xa, Y, ZL - 6], 2, ZB, 2 + xb - xa, ZL - 6);
    g.mat(C.brick, K.BRICK).quad([xa, 0, ZB + 0.02], [xb, 0, ZB + 0.02], [xb, Y, ZB + 0.02], [xa, Y, ZB + 0.02], xa, 0, xb, Y);
    g.mat(C.pave, K.PAVE);
  }
  g.mat(C.brick, K.BRICK).quad([OUR_X - 1.8, 0, ZL - 6], [OUR_X - 1.8, 0, ZB], [OUR_X - 1.8, Y, ZB], [OUR_X - 1.8, Y, ZL - 6], 0, 0, 12, Y);
  g.quad([-0.4, 0, ZB], [-0.4, 0, ZL - 6], [-0.4, Y, ZL - 6], [-0.4, Y, ZB], 0, 0, 12, Y);
  // buffer stops with red lamps, and where engines stand
  anchors.standingEngines = [];
  lay.tracks.forEach((t, r) => {
    if (r === OUR_ROAD || t.siding) return;
    const x = t.x, z = t.end + 0.6;
    g.mat([0.5, 0.07, 0.05], K.WOOD).box(x, 1.05, z, 2.5, 0.4, 0.45);
    for (const sx of [-0.84, 0.84]) { g.mat(C.iron, K.IRON).strut([x + sx, 0.15, z + 2.2], [x + sx, 1.1, z], 0.14).strut([x + sx, 0.15, z + 0.1], [x + sx, 1.2, z + 0.1], 0.14); }
    out.glows.add(x, 1.55, z + 0.3, { aColA: [1.6, 0.1, 0.04], aColB: [1.6, 0.1, 0.04], aSw: [2, rng(), 0.26, 0] });
    if (Math.abs(x) > 5) anchors.standingEngines.push({ position: new THREE.Vector3(x, 0, z + 4), heading: new THREE.Vector3(0, 0, -1) });
  });
}

// the stone head building: arcaded block, gabled pavilions, turrets, drum, ribbed dome and finial
function buildTerminus(g, rng, C, anchors) {
  const ZF = -146, ZK = -186, X0 = -62.5, X1 = 37.5, H = 24, DX = DOME_X, DZ = DOME_Z, P4 = 0.7854;
  const st = (f = 1) => mulc(C.stone, f * rng.range(0.94, 1.06));
  const bayW = 4.17, nb = Math.round((X1 - X0) / bayW);
  // main block: three storeys of pointed arcades on all four faces
  g.mat(st(), K.ARCADE);
  g.quad([X0, 1.05, ZF], [X1, 1.05, ZF], [X1, H, ZF], [X0, H, ZF], 0, 0, nb, 3);
  g.quad([X1, 0, ZK], [X0, 0, ZK], [X0, H, ZK], [X1, H, ZK], 0, 0, nb, 3);
  g.quad([X1, 0, ZF], [X1, 0, ZK], [X1, H, ZK], [X1, H, ZF], 0, 0, 10, 3);
  g.quad([X0, 0, ZK], [X0, 0, ZF], [X0, H, ZF], [X0, H, ZK], 0, 0, 10, 3);
  // cornice, pierced parapet and pitched slate roofs with cresting
  g.mat(C.stoneLight, K.STONE).box(-12.5, H + 0.3, (ZF + ZK) / 2, X1 - X0 + 1.2, 0.6, ZF - ZK + 1.2);
  for (const z of [ZF + 0.3, ZK - 0.3]) g.mat(C.stoneLight, K.VALANCE).quad([X0, H + 1.9, z], [X1, H + 1.9, z], [X1, H + 0.6, z], [X0, H + 0.6, z], 0, 1, 110, 0);
  const RY = H + 0.6, RT = H + 6.2, zm = (ZF + ZK) / 2;
  g.mat(C.slate, K.SLATE);
  g.quad([X0 + 1, RY, ZF - 1], [X1 - 1, RY, ZF - 1], [X1 - 1, RT, zm], [X0 + 1, RT, zm], 0, 0, 98, 20);
  g.quad([X1 - 1, RY, ZK + 1], [X0 + 1, RY, ZK + 1], [X0 + 1, RT, zm], [X1 - 1, RT, zm], 0, 0, 98, 20);
  g.mat(C.maroon, K.VALANCE).quad([X0 + 1, RT + 0.7, zm], [X1 - 1, RT + 0.7, zm], [X1 - 1, RT, zm], [X0 + 1, RT, zm], 0, 1, 140, 0);
  // buttress piers with pinnacles along both long faces
  for (let i = 0; i <= 12; i++) {
    const x = X0 + (X1 - X0) * i / 12;
    if (Math.abs(x - DX) < 15 && Math.abs(x - DX) > 13) continue;
    for (const [z, sg] of [[ZF, 1], [ZK, -1]]) {
      if (sg > 0 && Math.abs(x) < 9) continue;                // keep the portal's arch clear
      g.mat(st(0.96), K.STONE).box(x, H / 2 + 0.6, z + sg * 0.5, 1.3, H + 1.2, 1.0, 0, { v0: 0 });
      g.lathe(x, H + 1.2, z + sg * 0.4, [[0.85, 0], [0.85, 1.2], [0.5, 1.5], [0.5, 2.6], [0.7, 2.75], [0.04, 5.0]], 4, { flat: true, phase: P4 });
    }
  }
  // gabled pavilions: the central one under the dome and one at each end
  const pav = (cx, hw, hgt, apex, zf, zk) => {
    g.mat(st(1.03), K.ARCADE);
    const n = Math.max(2, Math.round(hw * 2 / 4.6));
    g.quad([cx - hw, 1.05, zf], [cx + hw, 1.05, zf], [cx + hw, hgt, zf], [cx - hw, hgt, zf], 0, 0, n, 3);
    g.quad([cx + hw, 0, zk], [cx - hw, 0, zk], [cx - hw, hgt, zk], [cx + hw, hgt, zk], 0, 0, n, 3);
    g.quad([cx + hw, 0, zf], [cx + hw, 0, zk], [cx + hw, hgt, zk], [cx + hw, hgt, zf], 0, 0, 9, 3);
    g.quad([cx - hw, 0, zk], [cx - hw, 0, zf], [cx - hw, hgt, zf], [cx - hw, hgt, zk], 0, 0, 9, 3);
    g.mat(st(1.0), K.ARCADE);                                  // gable ends, each with one tall window
    g.tri([cx - hw, hgt, zf], [cx + hw, hgt, zf], [cx, apex, zf], [0, 0.25], [1, 0.25], [0.5, 0.95]);
    g.tri([cx + hw, hgt, zk], [cx - hw, hgt, zk], [cx, apex, zk], [0, 0.25], [1, 0.25], [0.5, 0.95]);
    g.mat(C.slate, K.SLATE);
    g.quad([cx + hw + 0.4, hgt - 0.2, zf + 0.5], [cx + hw + 0.4, hgt - 0.2, zk - 0.5], [cx, apex + 0.25, zk - 0.5], [cx, apex + 0.25, zf + 0.5], 0, 0, 40, 12);
    g.quad([cx - hw - 0.4, hgt - 0.2, zk - 0.5], [cx - hw - 0.4, hgt - 0.2, zf + 0.5], [cx, apex + 0.25, zf + 0.5], [cx, apex + 0.25, zk - 0.5], 0, 0, 40, 12);
    for (const z of [zf, zk]) g.mat(C.stoneLight, K.STONE).lathe(cx, apex, z, [[0.5, 0], [0.5, 0.6], [0.25, 0.9], [0.4, 1.5], [0.03, 3.2]], 4, { flat: true, phase: P4 });
  };
  pav(DX, 14, 30, 37, ZF - 0.5, ZK - 3.5);
  pav(X0 + 6.5, 6.5, 26, 31.5, ZF - 0.5, ZK - 2.5);
  pav(X1 - 6.5, 6.5, 26, 31.5, ZF - 0.5, ZK - 2.5);
  // turrets with small ribbed domes: four at the corners, two flanking the central gable each side
  const turret = (x, z, r, top, yb = 0) => {
    g.mat(st(1.02), K.STONE).lathe(x, 0, z, [[r * 1.15, yb], [r * 1.15, yb + 1.2], [r, yb + 1.6], [r, top - 6], [r * 1.12, top - 5.7], [r * 1.12, top - 5.3]], 8, { flat: true, phase: 0.39 });
    g.mat(st(1.0), K.ARCADE).lathe(x, 0, z, [[r * 0.94, top - 5.3], [r * 0.94, top - 1.6]], 8, { flat: true, phase: 0.39, us: 1 / (r * 0.94 * 0.785), vmap: [top - 5.3, top - 1.6] });
    g.mat(C.stoneLight, K.STONE).lathe(x, 0, z, [[r * 1.14, top - 1.6], [r * 1.2, top - 1.3], [r * 1.14, top - 1.0]], 8, { flat: true, phase: 0.39 });
    const prof = []; for (let i = 0; i <= 6; i++) { const t = i / 6; prof.push([r * 1.02 * Math.max(0, Math.cos(t * 1.5708)) ** 0.75 + 0.03, top - 1.0 + r * 1.7 * Math.sin(t * 1.5708)]); }
    g.mat(C.domeStone, K.STONE).lathe(x, 0, z, prof, 8, { vs: 0.7 });
    g.mat(C.gilt, K.BRASS).lathe(x, top - 1.0 + r * 1.7, z, [[0.1, 0], [0.3, 0.3], [0.1, 0.6], [0.2, 0.9], [0.02, 2.4]], 6);
    anchors.turrets.push(new THREE.Vector3(x, top + r * 1.7 + 1.4, z));
  };
  const th = rng.range(36, 39.5);
  for (const x of [X0, X1]) for (const z of [ZF + 0.5, ZK - 0.5]) turret(x, z, 2.3, th);
  for (const sx of [-1, 1]) for (const z of [ZF - 1.5, ZK - 3.5]) turret(DX + sx * 14, z, 2.3, (th + rng.range(2, 4.5)) * 1.16, z > -160 ? 23 : 0);
  // octagonal drum, ring of pinnacles, the ribbed dome, lantern and finial: enlarged about the drum's foot
  // (1.35 across, 1.42 up) so the dome stands 73 m and clear of the gantries and the steam
  const nr = rng.pick([8, 12, 16]), DR0 = DOME_R0, dy0 = 42.5, dh = rng.range(12.5, 14.5), SR = DOME_SR, SH = 1.42, DR = DR0 * SR;
  const Y = (y) => 28 + (y - 28) * SH, sp = (prof) => prof.map(([r, y]) => [r * SR, Y(y)]);
  g.mat(st(0.98), K.STONE).lathe(DX, 0, DZ, sp([[DR0 + 1.4, 28], [DR0 + 1.4, 30.5], [DR0 + 0.4, 31.5]]), 8, { flat: true, phase: 0.39 });
  g.mat(st(1.04), K.ARCADE).lathe(DX, 0, DZ, sp([[DR0, 31.5], [DR0, 41]]), 8, { flat: true, phase: 0.39, us: 1 / (DR * 0.785 / 2), vmap: [Y(31.5), Y(41)] });
  g.mat(C.stoneLight, K.STONE).lathe(DX, 0, DZ, sp([[DR0 + 0.2, 41], [DR0 + 0.9, 41.5], [DR0 + 0.9, 42.1], [DR0 - 0.4, dy0]]), 8, { flat: true, phase: 0.39 });
  for (let i = 0; i < 8; i++) {
    const a = 0.39 + i * P4, px = DX + Math.cos(a) * (DR + 0.6), pz = DZ + Math.sin(a) * (DR + 0.6);
    g.mat(st(1.0), K.STONE).lathe(px, Y(30.5), pz, [[0.95, 0], [0.95, 10.5], [1.15, 10.8], [1.15, 11.6], [0.7, 12], [0.7, 13.4], [0.9, 13.6], [0.04, 16.2]].map(([r, y]) => [r * SR, y * SH]), 6, { flat: true });
  }
  const dprof = [], NP = 12;
  for (let i = 0; i <= NP; i++) { const t = i / NP * 1.5708; dprof.push([((DR0 - 0.55) * Math.max(0, Math.cos(t)) ** 0.72 + 1.1 * (i / NP)) * SR, Y(dy0 + dh * Math.sin(t) ** 0.92)]); }
  g.mat(C.domeStone, K.DOME).lathe(DX, 0, DZ, dprof, 32, { vs: 0.6 });
  for (let i = 0; i < nr; i++) {                              // meridian ribs
    const a = 0.39 + i * 6.2832 / nr, ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j < NP; j++) {
      const p0 = dprof[j], p1 = dprof[j + 1];
      g.mat(C.stoneLight, K.DOME).strut([DX + ca * (p0[0] + 0.16), p0[1], DZ + sa * (p0[0] + 0.16)], [DX + ca * (p1[0] + 0.16), p1[1], DZ + sa * (p1[0] + 0.16)], 0.74, 0.56);
    }
  }
  const ly = dy0 + dh;
  g.mat(st(1.05), K.ARCADE).lathe(DX, 0, DZ, sp([[1.25, ly - 0.3], [1.25, ly + 2.6]]), 8, { flat: true, us: 1 / (1.25 * SR * 0.785), vmap: [Y(ly - 0.3), Y(ly + 2.6)] });
  g.mat(C.stoneLight, K.STONE).lathe(DX, 0, DZ, sp([[1.5, ly + 2.6], [1.5, ly + 2.9], [1.1, ly + 3.4], [0.5, ly + 4.3], [0.3, ly + 4.6]]), 8);
  const fy0 = 60, fy = Y(fy0);
  g.mat(C.gilt, K.BRASS).lathe(DX, 0, DZ, sp([[0.3, ly + 4.6], [0.55, ly + 5], [0.3, ly + 5.4], [0.42, ly + 5.9], [0.12, ly + 6.6], [0.2, fy0 - 1.1], [0.04, fy0]]), 8);
  anchors.dome = new THREE.Vector3(DX, Y(dy0 + dh * 0.5), DZ);
  anchors.finial = new THREE.Vector3(DX, fy, DZ);
  // the great stone arch in the concourse wall that frames the portal (opening 15.4 x 13.6)
  const NA = 12, aw = 7.7, asp = 6.0, ar = aw * 2;
  for (let side = -1; side <= 1; side += 2) {
    let prev = null;
    for (let i = 0; i <= NA; i++) {
      const t = (i / NA) * 1.0472;                             // equilateral pointed arch: centre at the far springing
      const x = side * (aw - ar * (1 - Math.cos(t))), y = asp + ar * Math.sin(t);
      const xo = side * (aw + 1.5 - (ar + 1.5) * (1 - Math.cos(t)) * 1.0), yo = asp + (ar + 1.5) * Math.sin(t);
      if (prev) {
        const vou = i % 2 ? C.voussoir : C.stoneLight;
        const A = [prev[0], prev[1], ZF + 0.9], B = [prev[2], prev[3], ZF + 0.9], Cc = [xo, yo, ZF + 0.9], D = [x, y, ZF + 0.9];
        if (side > 0) g.mat(vou, K.STONE).quad(A, B, Cc, D, 0, 0, 1.5, 1.4); else g.mat(vou, K.STONE).quad(B, A, D, Cc, 0, 0, 1.5, 1.4);
        const S0 = [prev[0], prev[1], ZF + 0.06], S1 = [x, y, ZF + 0.06];
        if (side > 0) g.mat(st(0.8), K.STONE).quad(S0, A, D, S1, 0, 0, 2.1, 1.4); else g.mat(st(0.8), K.STONE).quad(A, S0, S1, D, 0, 0, 2.1, 1.4);
      }
      prev = [x, y, xo, yo];
    }
    g.mat(st(1.0), K.STONE).box(side * (aw + 0.8), 3.5, ZF + 0.3, 1.6, 4.9, 2.6, 0, { v0: 1.05 });
    g.mat(C.voussoir, K.STONE).lathe(side * (aw + 0.1), 1.05, ZF + 1.2, [[0.4, 0], [0.28, 0.3], [0.28, 4.3], [0.5, 4.8], [0.5, 4.95]], 8);
  }
  g.mat([0.012, 0.012, 0.016], K.MATTE).quad([-aw, 0, ZF + 0.06], [aw, 0, ZF + 0.06], [aw, asp, ZF + 0.06], [-aw, asp, ZF + 0.06]);
  for (let i = 0; i < NA; i++) {
    const t0 = (i / NA) * 1.0472, t1 = ((i + 1) / NA) * 1.0472;
    const xa = aw - ar * (1 - Math.cos(t0)), ya = asp + ar * Math.sin(t0), xb = Math.max(0, aw - ar * (1 - Math.cos(t1))), yb = asp + ar * Math.sin(t1);
    g.quad([-xa, ya, ZF + 0.06], [xa, ya, ZF + 0.06], [xb, yb, ZF + 0.06], [-xb, yb, ZF + 0.06]);
  }
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const pal = (Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const [pIndigo, pRain, pMaroon, pCream, pBlue, pGold, pBuff] = pal;
  const L = opts.throat ?? 300;
  const yieldNow = async () => { if (ctx.yield) await ctx.yield(); };

  // per-seed character: stone warmth, ironwork livery, weathering
  const warmth = rng.range(0.1, 0.4), livery = rng.pick(['maroon', 'maroon', 'indigo', 'green']);
  const paint = livery === 'maroon' ? mulc(pMaroon, 1.25) : livery === 'indigo' ? mulc(mixc(pIndigo, pBlue, 0.25), 1.5) : [0.03, 0.085, 0.055];
  const C = {
    iron: [0.035, 0.036, 0.04], ironPaint: mixc(paint, [0.05, 0.05, 0.05], 0.35), maroon: paint,
    cream: mulc(pCream, 0.8), creamPaint: mulc(pCream, 0.72), buff: pBuff, blue: pBlue,
    stone: mulc(mixc(pBuff, pCream, warmth), 0.88), stoneLight: mulc(mixc(pBuff, pCream, 0.75), 0.86),
    stoneDark: mixc(mulc(pBuff, 0.45), [0.12, 0.12, 0.12], 0.4), voussoir: mulc(mixc(pMaroon, pBuff, 0.3), 1.7),
    domeStone: mulc(mixc(pBuff, pCream, 0.3), 0.95), gilt: mulc(pGold, 0.8), brass: mulc(pGold, 0.6),
    slate: mulc(mixc(pIndigo, pRain, 0.5), 0.75), tin: mixc(pRain, [0.24, 0.24, 0.24], 0.5), oxide: [0.3, 0.09, 0.05],
    glass: [0.1, 0.12, 0.14], wood: [0.2, 0.14, 0.09], sleeper: [0.1, 0.08, 0.06], crate: [0.3, 0.22, 0.13],
    pave: [0.36, 0.34, 0.3], brick: mulc(mixc(pMaroon, pBuff, 0.45), 1.25), leather: [0.06, 0.04, 0.03], sack: [0.4, 0.33, 0.2],
  };

  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const sunDir = (opts.sunDir ? v3(opts.sunDir) : new THREE.Vector3(0.836, 0.259, -0.483)).normalize();
  const gz = [200 + rng.range(-6, 6), 120 + rng.range(-6, 6), 50 + rng.range(0, 5)];
  const shared = {
    uSunDir: { value: sunDir }, uSunCol: { value: v3(mulc(mixc(pGold, [1, 1, 1], 0.1), 2.1)) },
    uSkyCol: { value: v3(mulc(mixc(pBlue, [1, 1, 1], 0.4), 0.9)) }, uHorizCol: { value: v3(mulc(mixc(pCream, [1, 0.84, 0.3], 0.65), 0.86)) },
    uStormCol: { value: v3(mulc(pIndigo, 1.7)) }, uAmbCol: { value: v3(mulc(mixc(pRain, [0.5, 0.62, 0.85], 0.5), 0.56)) },
    uGroundCol: { value: new THREE.Vector3(0.075, 0.065, 0.055) }, uFillCol: { value: new THREE.Vector3(0.05, 0.09, 0.2) },
    uStormDir: { value: new THREE.Vector3(-0.8, 0, 0.6).normalize() },
    uSun: { value: 1 }, uWet: { value: 1 }, uFresh: { value: 0.8 }, uTime: { value: 0 }, uProg: { value: 0.56 }, uLamp: { value: 0 },
    uEdge: { value: new THREE.Vector4(-0.6, 0.8, 1000, 14) }, uCamL: { value: new THREE.Vector3(0, 30, 400) },
    uGz: { value: new THREE.Vector3(gz[0], gz[1], gz[2]) },
    uGndK: { value: new THREE.Vector4(1, 1, 0, 1) }, uPaintLo: { value: new THREE.Vector2(0.05, 0.055) },
    uRain: { value: 0 }, uPud: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, 0, 0)) },
  };
  const mk = (vs, fs, o = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared }, vertexShader: vs, fragmentShader: fs, fog: true, ...o });
  const surfMat = mk(SURF_VERT, SURF_FRAG, { side: THREE.DoubleSide });
  const armMat = mk(SURF_VERT, SURF_FRAG, { side: THREE.DoubleSide, defines: { ARMS: 1 } });

  const object = new THREE.Group(); object.name = 'cloudburst-local-hero';
  const anchors = { shedMouths: [], pigeons: [], turrets: [] };
  const out = {
    arms: [], maxArms: 30,
    glows: makeSprites({ aColA: 3, aColB: 3, aSw: 4 }),
    steam: makeSprites({ aP: 4, aVel: 4 }),
    drips: makeSprites({ aP: 4 }),
  };
  const addMesh = (geo, mat, name, order = 0) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.renderOrder = order; m.frustumCulled = order < 3; object.add(m); return m; };

  // 1. tracks and ground
  const lay = layoutTracks(rng.fork('tracks'), L);
  await yieldNow();
  if (opts.ground !== false) addMesh(buildGroundGeometry(lay, L), mk(GROUND_VERT, GROUND_FRAG), 'ground');
  await yieldNow();
  addMesh(buildTrackGeometry(lay, rng), mk(TRACK_VERT, TRACK_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 'tracks', 1);
  await yieldNow();

  // 2. gantries with their arms, and the dressing of the throat
  const gT = makeG(), gA = makeG();
  const rg = rng.fork('gantries');
  anchors.gantries = [];
  // The first gantry stands between the clearing and the dome: no doll of it stands where a sight line to the dome's body
  // crosses the bridge, from any eye on the route's last straight before it (domeBand). Every gantry's dolls draw from a
  // stream of that gantry's own, made from the seed and its name, so what one gantry holds never moves another's.
  const straightFrom = Math.min(opts.straightFrom ?? L, L);
  for (let i = 0; i < gz.length; i++) {
    const z = gz[i], dolls = ctx.core.makeRng(ctx.core.hashSeed('gantry-dolls-' + i + ':' + ctx.seed));
    anchors.gantries.push(buildGantry(gT, gA, z, (740 - z) / 880, lay, rg, C, out, dolls, i === 0 ? domeBand(z, straightFrom) : null));
    await yieldNow();
  }
  buildThroat(gT, lay, L, rng.fork('throat'), C, out, anchors);
  await yieldNow();
  addMesh(await gT.buildAsync(yieldNow), surfMat, 'throat');
  {
    const geo = gA.build(), n = gA.nv, piv = new Float32Array(n * 4), arm = new Float32Array(n * 3);
    for (const a of out.arms) for (let i = a.v0; i < a.v1; i++) { piv.set(a.piv, i * 4); arm.set(a.arm, i * 3); }
    geo.setAttribute('aPiv', new THREE.BufferAttribute(piv, 4)); geo.setAttribute('aArm', new THREE.BufferAttribute(arm, 3));
    addMesh(geo, armMat, 'arms');
  }
  await yieldNow();

  // 3. the shed, 4. its platforms, 5. the terminus
  const gS = makeG();
  await buildShedShell(gS, rng.fork('shed'), C, out, anchors, yieldNow);
  addMesh(await gS.buildAsync(yieldNow), surfMat, 'shed');
  const gF = makeG();
  buildShedFloor(gF, lay, rng.fork('floor'), C, out, anchors);
  await yieldNow();
  addMesh(await gF.buildAsync(yieldNow), surfMat, 'platforms');
  const gH = makeG();
  buildTerminus(gH, rng.fork('terminus'), C, anchors);
  await yieldNow();
  addMesh(await gH.buildAsync(yieldNow), surfMat, 'terminus');

  // 6. steam, shafts, drips, lamp glows
  const rs = rng.fork('steam');
  if (opts.steam !== false) {
    anchors.steamVents = [];
    for (const c of SPANS) {
      for (let i = 0; i < 9; i++) out.steam.add(c + rs.range(-8, 8), rs.range(9, 15.5), rs.range(-12, 1), { aP: [rs(), 1 / rs.range(9, 14), rs.range(2.4, 4), rs.range(6, 10)], aVel: [rs.range(-0.2, 0.5), rs.range(0.7, 1.5), rs.range(1.1, 2.4), 0] });
      for (let i = 0; i < 10; i++) out.steam.add(c + rs.range(-7, 7), rs.range(10, 15), rs.range(-128, -18), { aP: [rs(), 1 / rs.range(12, 18), rs.range(2.5, 4), rs.range(5, 8)], aVel: [rs.range(-0.15, 0.15), rs.range(0.2, 0.45), rs.range(0.3, 0.9), 0] });
      for (let i = 0; i < 6; i++) out.steam.add(c + rs.range(2, 10), rs.range(16, 20), rs.range(-130, -6), { aP: [rs(), 1 / rs.range(6, 9), 1.2, rs.range(3.5, 5.5)], aVel: [rs.range(-0.3, 0.1), rs.range(0.7, 1.1), 0.2, 1] });
      anchors.steamVents.push(new THREE.Vector3(c, 20, -4));
    }
    for (let i = 0; i < 56; i++) {
      const x = rs.range(-68, 44), z = rs.range(8, L - 10);
      if (Math.abs(x) < 6) continue;
      out.steam.add(x, 0.4, z, { aP: [rs(), 1 / rs.range(5, 9), 1.2, rs.range(3, 5)], aVel: [rs.range(-0.25, 0.25), rs.range(0.4, 0.75), rs.range(-0.25, 0.25), 1] });
    }
    const m = addMesh(out.steam.build(), mk(STEAM_VERT, STEAM_FRAG, { transparent: true, depthWrite: false }), 'steam', 3);
    m.userData.puffs = out.steam.count;
  }
  if (opts.shafts !== false) {
    const P = [], U = [], I = []; let n = 0;
    const Ld = sunDir, perp = new THREE.Vector3(Ld.z, 0, -Ld.x).normalize();
    for (let k = 1; k < SHED.NB; k += 2) {
      const zc = -SHED.BAY * (k + 0.5), sx = 34.5, sy = 14.2;
      const t = Math.min(sy / Math.max(Ld.y, 0.05) + 4, (-1.5 - zc) / Math.max(-Ld.z, 0.05), (sx + 61) / Math.max(Ld.x, 0.05));
      if (t < 16) continue;
      const ex = sx - Ld.x * t, ey = sy - Ld.y * t, ez = zc - Ld.z * t;
      for (const [ox, oy, oz] of [[0, 3.4, 0], [perp.x * 2.7, 0, perp.z * 2.7]]) {
        P.push(sx - ox, sy - oy, zc - oz, ex - ox, ey - oy, ez - oz, ex + ox, ey + oy, ez + oz, sx + ox, sy + oy, zc + oz);
        U.push(0, -1, 1, -1, 1, 1, 0, 1); I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setIndex(I);
    addMesh(geo, mk(SHAFT_VERT, SHAFT_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), 'shafts', 4);
  }
  if (opts.drips !== false) addMesh(out.drips.build(), mk(DRIP_VERT, DRIP_FRAG, { transparent: true, depthWrite: false }), 'drips', 5);
  if (opts.lamps !== false) addMesh(out.glows.build(), mk(GLOW_VERT, GLOW_FRAG, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 'glows', 6);

  // ---- anchors
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  Object.assign(anchors, {
    portalSeat: { position: V(0, 2.9, -140), facing: V(0, 0, 1), width: 14, height: 19 },
    flyThrough: [V(L > 260 ? (L - 260) ** 2 / 1340 : 0, 2.9, L), V(0, 2.9, 260), V(0, 2.9, 200), V(0, 2.9, 120), V(0, 2.9, 50), V(0, 2.9, 0), V(0, 2.9, -70), V(0, 2.9, -140)],
    ourTrack: lay.tracks[OUR_ROAD].pts, rivalTrack: lay.tracks[RIVAL_ROAD].pts, departRoad: lay.tracks[13].pts,
    tracks: lay.tracks, trackXAt: lay.xAt,
    viewpoints: {
      clearing: { position: V(1.2, 2.9, L), target: V(-12, 40, -166) },
      throat: { position: V(0, 2.9, 160), target: V(-8, 22, -100) },
      shed: { position: V(0, 2.9, -20), target: V(0, 4, -140) },
      flank: { position: V(150, 30, 60), target: V(-12, 18, -70) },
    },
    sunDir: sunDir.clone(),
  });

  // ---- progress and light
  const U = shared;
  let autoSun = !!opts.autoSun;
  const setProgress = (u) => {
    u = clamp(u, 0, 1);
    U.uProg.value = u;
    U.uEdge.value.z = lerp(-270, 430, smoothstep(0.4, 0.535, u));
    U.uFresh.value = smoothstep(0.44, 0.52, u) * (1 - 0.72 * smoothstep(0.56, 0.8, u));
    if (autoSun) U.uSun.value = smoothstep(0.4, 0.52, u);
  };
  setProgress(0.56);
  const setCol = (un, c, k = 1) => { if (c === undefined) return; const col = c.isColor ? c : new THREE.Color(c); un.value.set(col.r * k, col.g * k, col.b * k); };
  const setLight = (o = {}) => {
    if (o.sunDir) U.uSunDir.value.copy(o.sunDir.isVector3 ? o.sunDir : v3(o.sunDir)).normalize();
    if (o.stormDir) U.uStormDir.value.copy(o.stormDir.isVector3 ? o.stormDir : v3(o.stormDir)).setY(0).normalize();
    setCol(U.uSunCol, o.sunColor, o.sunIntensity ?? 2.05); setCol(U.uSkyCol, o.sky); setCol(U.uHorizCol, o.horizon); setCol(U.uStormCol, o.storm);
    setCol(U.uAmbCol, o.ambient); setCol(U.uGroundCol, o.ground); setCol(U.uFillCol, o.fill);
    if (o.sun !== undefined) U.uSun.value = o.sun;
    if (o.wet !== undefined) U.uWet.value = o.wet;
  };
  const tmp = new THREE.Vector3(), inv = new THREE.Matrix4();

  return {
    object, radius: 78, height: 26, center: new THREE.Vector3(-8, 8, 25), anchors,
    extent: { min: new THREE.Vector3(-75, 0, -190), max: new THREE.Vector3(50, 74, L + 4) },
    uniforms: shared, setProgress, setLight, mk, colors: C,
    setSun(s) { autoSun = false; U.uSun.value = s; },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) {
        object.updateWorldMatrix(true, false);
        inv.copy(object.matrixWorld).invert();
        U.uCamL.value.copy(tmp.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv));
      }
    },
    dispose() {},
    ground: true, groundY: -0.06,
  };
}

// shared with the world file, which builds the rest of the line with the same shading
export { OUR_X, K, makeG, makeSprites, lin, mixc, mulc, SURF_FRAG, GLSL_COMMON, GLSL_MIRROR, FOG_FADE, GLOW_VERT, GLOW_FRAG,
  TRACK_VERT, TRACK_FRAG, GROUND_VERT, GROUND_FRAG };
