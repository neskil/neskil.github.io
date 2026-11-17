// THE ROOM THAT IS A CAMERA: hero set piece "the counterpane and the carafe", and the whole style kit.
//
// WHAT IT IS. A shuttered bedroom built fifty times life size is a camera obscura: one hole in the shutter
// (HOLE = 125, 72, -60) throws the live harbour upside down over everything. The hero is the bed (a white
// counterpane 106 x 70 m folded into ridges, pillows, iron bedstead) and, beyond it, the washstand with the
// carafe: a ball of water holding the whole bay the right way up, eleven drops that each hold it too, and the
// carafe's shadow lying along the marble toward the basin with a small upright harbour burning in it. Dust motes
// and shafts included. The carafe stands at (-36, -84) near the front of the marble, 11.7 m across and 23 m tall,
// so that a flight along the washstand's front edge heads almost straight at it (steady camera included).
//
// SPACE. Local space IS the brief's room space (floor y = 0, shutter wall x = 125, bed-head wall x = -90, back
// wall z = -110). Add hero.object at the origin, unrotated: the shaders work in world coordinates.
// Real extent: bed x -88..24, z -53..23, top 43..47 (pillows 60, head posts 84); washstand x -75..-20,
// z -110..-75, marble at 45, carafe top 68.1. radius/height/center returned are a framing hint for the viewer.
//
// HOW THE STYLE IS MADE (all exported; shade the whole world with these and nothing else):
//   STYLE_GLSL       = TONE_GLSL + PICTURE_GLSL + SHADOW_GLSL + SURFACE_GLSL, for any ShaderMaterial of your own
//     toScene(D)       exact colour: display-linear colour -> scene value (inverse of exposure, ACES, sRGB)
//     harbour(o, aw)   the live harbour along unit direction o (sky, cloud, sea with marching swell bands, quay,
//                      town strip, 12 luggers with bellied shaded sails, sheer hull, strake, figures, bow wave,
//                      wake and a broken reflection, steamer and smoke, 16 gulls, 5 swaying masts), filtered to
//                      aw radians. Lugger 0 lies moored at azimuth 0.5 (uLug[0].y < 0): on the back wall, facing the
//                      entry, so the first view and the view through the previous portal hold a boat.
//                      Boats 1 and 2 (uLug[i].y = -2, -3) stand off the far shore at azimuth -0.5 and -0.85: at arm's
//                      length on the bed-head wall by the turn. The masts are five thin bars, no rigging. The rest of the fleet is never larger than 0.2 rad.
//                      THE NEAR LANE (uLane): five boats 0.15 rad apart cross azimuth -0.64 .. 0.12 with a topsail set
//                      above the lug, 0.14 to 0.18 rad above the horizon: that band is the counterpane, so two or three topsails
//                      always lie whole on the linen (stretched sixfold along the bed, masthead toward the hole) and
//                      slide ridge to ridge toward the pillows as the boats stand out (uLane.y is the lane's phase, set once
//                      per seed: the lane runs on the world's clock alone; uLane.w seeds the sails' colours).
//                      BELOW THE CASEMENT (elevation < 0: the ceiling and the tops of the walls): a moored deck under
//                      each mast bar, a cormorant drying its wings on a mooring post (azimuth -0.46), and in the night
//                      edition (uNight) a road of moon glitter on the swell (azimuth -0.3). In the third cast (uVar.x 2)
//                      fleet slots 3 and 5 are steam tugs. A squall (uVar.y) is a train of slanting rain bands. Gulls are a body and two
//                      tapered curved wings. The town's windows are drawn in the shader (soft dots), its edges re-cut
//                      when magnified, so nothing of the strip's texels shows on a wall at arm's length.
//     picture(P, aw)   what room point P receives: harbour along P -> hole. picFoot(P) gives aw (fragment only),
//                      picFall(P) the brightness falloff away from the hole's axis
//     shadowAt(P,N,pw) 1 = sees the hole. Analytic boxes / capsules / ellipsoids in uniform arrays: hard, radial
//     foldH / foldShadow  the counterpane's fold function and its ten-step self-shadow
//     roomLight(P,N,aw,pw), matteTint(m), roomDark(N), caustic(P, aw)   the complete surface recipe
//   STYLE_VS           vertex shader for matte and linen (attributes position, normal, aCol, aKind, aSway)
//   matteMaterial(style)  walls, boards, furniture (aKind 0 plain, 1 floorboards, 2 wallpaper sprig, 3 marble,
//                         4 black iron, 5 wood, 6 glazed white china: calm filtered picture, a rim of it round every
//                         edge, a glint of the hole, a blue-black dark side);   linenMaterial(style)  cloth (aKind 0 cloth, 1 counterpane top,
//                         2 thin paper lit on both faces; aSway > 0 breathes);   glassMaterial(style)  lenses
//   makeMotes(style, rng, {count, min, max, size, drift})   dust that takes its ray's colour; call
//                         mesh.userData.setSize(renderer) every frame.   makeShafts(style, rng, ends, {strength,
//                         width: number | (i) => m, tint: (i) => 0 harbour | 1 sky | 2 sea | 3 sail, seg}): ribbons
//                         that are cones from the hole, never wider on screen than ~5 degrees, gone within 7 m of
//                         the eye, white only in the last 9 m by the hole. hero.shafts / hero.motes are returned.
//                         More opts: gain: (i) => brightness of shaft i; dust: 1 breaks the ribbon into clumps, streaks
//                         and grit sliding outward (material.uniforms.uDustK).
//   makeShaftDust(style, rng, cones, {count, size, reach, speed})   the flecks a shaft is made of: instanced quads living
//                         inside cones from the hole ({end, tan, tint, gain} each), clumped, drifting outward.
//   Motes and shaft dust take material.uniforms.uVel (a Vector3: their motion relative to the eye over the blur time) and
//                         are then drawn as streaks along it; zero = round. The world sets it from the path on the way out.
//   makeStyle(ctx, opts) -> style { uniforms, pal, hour, update(dt,time), setExposure(e), setNearSail(k),
//                         addBox(min,max), addCapsule(a,b,r), addEllipsoid(c,radii) }   (24 capsules, 8 boxes,
//                         8 ellipsoids in all; the hero uses 14, 4 and 6: the last ellipsoid slot is the moth, drawn as its own flat outline, see mothSil)
//   dress(geo, colour, kind, sway)   gives any geometry the attributes the materials need (returns non-indexed)
//   foldHeight(style, x, z), toScene(hex, exposure), HOLE, DEFAULT_PALETTE
//   EDITIONS (set once by the world through style.uniforms.uVar, a Vector4): x cast (0 luggers, 1 regatta of white
//     yachts with striped spinnakers, 2 working boats among steamers; uSteam.w = how many steamers, 1..3),
//     y squall (0 off, 1..2 = on, fraction = where the rain curtain starts), z sea fog 0..1 (eased by the world
//     from u), w wallpaper (0 plum sprig, 1 sage stripe, 2 whitewash; the wall's matte comes from its aCol).
// Rules kept: the room owns no light (no lights, no fog, no full-screen pass, no render target); every colour is
// matteTint(matte) * picture; shadow is absence of picture; glass alone is written above display white (x2.6)
// so that it is the only thing that can bloom: matte tops out at scene value 1.30 / exposure.
//
// buildHero(ctx, opts) opts:
//   palette  7 hex strings [umber, plum, slate, linen, cobalt, sea green, sail tan] (default: the brief's)
//   detail   0.6..1 thins counterpane grid, motes, shafts, seed pods (default ctx.quality.detail or 1)
//   exposure the world's post.exposure, for the tone inverse (default 1)
//   hour     'morning' | 'dawn' | 'evening' | 'night' (default: by seed, morning 64 percent)
//   density  0.5..1 sails and gulls;   stage  false leaves out the floor and the two walls the hero brings
//   style    a style from makeStyle() to share (otherwise the hero makes one: it is returned as hero.style)
// Per seed: hour, fold layout, fleet, gulls, masts, steamer, cloud field, town, wind, when the sun is covered.
//
// RETURNS { object, radius, height, center, anchors, style, update(dt, time, camera), setProgress(u), dispose() }
//   update()       advances the picture (it calls style.update) and the life: falling drop, moth, slosh
//   setProgress(u) path progress 0..1: the moth lifts (opts.mothLift), its own outline as a shadow on the lit linen, flies its own course (opts.mothKeys) and crosses the beam. Never called =
//                  the moth loops on its own clock (viewer).
// ANCHORS (room space): hole; portalSeat { position, facing (-1,0,0), radius 7 }; flyThrough (the brief's nine
//   path points, raised to y 55 over the linen so the clearance over the highest fold is 7 m); viewpoints
//   { overLinen, carafe, underBed } as { from, to }; carafe (centre of the ball), carafeTop, drops[11], ewer,
//   honesty, bed { min, max, pillowTop, footRailX, headRailX }, washstand { min, max }, mothRest, carafeShadow.
//
// COST: about 100k triangles, 10 draw calls, no lights, two textures (256x256, 4096x256), build ~400 ms
// in steps under 50 ms. Fragment cost is the picture: two texture taps and three short loops per pixel.
// EXPECTS AROUND IT: the rest of the room built with matteMaterial / linenMaterial on the same style (shutter
// wall and ceiling, chair, drape, rug), the world's occluders registered with style.add*, post bloom threshold
// above 1.3 (or strength 0), saturation and contrast 1, no scene fog, no lights.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const DEFAULT_PALETTE = ['#3A2A20', '#4A2F45', '#2B333D', '#EDE8DC', '#2F7FD6', '#1FA39A', '#D9772E'];
export const HOLE = new THREE.Vector3(125, 72, -60);       // centre of the hole in the shutter, room space
export const N_LUG = 12, N_GULL = 16, N_MAST = 5, N_BOX = 8, N_CAP = 24, N_ELL = 8;

const lin = (hex) => new THREE.Color(hex);                   // THREE converts sRGB hex to linear
const v3c = (c) => new THREE.Vector3(c.r, c.g, c.b);

// ---------------------------------------------------------------------------------------------------------
// EXACT COLOUR. The engine shows  sRGB( ACES( scene * exposure / 0.6 ) ).  toScene(D) is the inverse: give it
// the display-linear colour D you want on screen (what THREE.Color holds for a hex) and it returns the scene
// value to write. Values are clamped to 0.82 display-linear (sRGB 233); anything meant to bloom (glass only) is multiplied
// AFTER toScene. uExpK = 0.6 / post.exposure (shared uniform, set with STYLE.setExposure).
// ---------------------------------------------------------------------------------------------------------
const m3inv = (e) => new THREE.Matrix3().fromArray(e).invert().elements.map((v) => v.toFixed(6)).join(',');
const ACES_IN_INV = m3inv([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]);
const ACES_OUT_INV = m3inv([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]);
export const TONE_GLSL = /* glsl */`
  uniform float uExpK;
  vec3 toScene(vec3 D){
    vec3 y = clamp(mat3(${ACES_OUT_INV})*clamp(D, 0., 0.82), 0.0003, 0.965);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, C = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*C, 0.)))/(2.*A);     // A is always below zero here (y <= 0.965)
    return max(mat3(${ACES_IN_INV})*v, 0.)*uExpK;
  }`;
// the same thing on the CPU, for anything coloured outside a shader (returns a THREE.Color in scene space)
export function toScene(hexOrColor, exposure = 1) {
  const c = hexOrColor.isColor ? hexOrColor : new THREE.Color(hexOrColor);
  const oi = new THREE.Matrix3().fromArray([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]).invert();
  const ii = new THREE.Matrix3().fromArray([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]).invert();
  const y = new THREE.Vector3(Math.min(c.r, 0.82), Math.min(c.g, 0.82), Math.min(c.b, 0.82)).applyMatrix3(oi);
  const f = (t) => { t = clamp(t, 0.0003, 0.965); const A = 0.983729 * t - 1, B = 0.432951 * t - 0.0245786, C = 0.238081 * t + 0.000090537; return (-B - Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A); };
  const v = new THREE.Vector3(f(y.x), f(y.y), f(y.z)).applyMatrix3(ii).multiplyScalar(0.6 / exposure);
  return new THREE.Color(Math.max(v.x, 0), Math.max(v.y, 0), Math.max(v.z, 0));
}

// ---------------------------------------------------------------------------------------------------------
// THE SHARED UNIFORMS. One object, referenced (not cloned) by every material made with the factories below,
// so the whole room is lit by the same picture at the same instant. makeStyle() fills it.
// ---------------------------------------------------------------------------------------------------------
function makeUniforms() {
  const arr = (n, mk) => Array.from({ length: n }, mk);
  return {
    uExpK: { value: 0.6 }, uTime: { value: 0 }, uHole: { value: HOLE.clone() },
    uSky: { value: new THREE.Vector3() }, uSea: { value: new THREE.Vector3() },        // cobalt, sea green
    uSailA: { value: new THREE.Vector3() }, uSailB: { value: new THREE.Vector3() },    // tan, rust
    uPale: { value: new THREE.Vector3(1, 1, 1) },                                      // cloud, foam, town wall
    uGain: { value: 1 },            // whole-picture brightness (cloud over the harbour's sun dims it: set by update)
    uCool: { value: 0 },            // 0..1 cooling that goes with the dimming
    uNight: { value: 0 },           // 1 in the night edition (moon glitter on the sea)
    uNear: { value: 0 },            // 0..1 the rare near sail: the whole room goes sail-tan
    uSoft: { value: 0.34 },          // soft focus: blur (radians) = uSoft / distance to the hole
    uWind: { value: new THREE.Vector4(0.035, 0.012, 1, 1 / 45) },   // cloud drift (uv/s) xy, swell speed z, fleet rate (runs/s) w
    tCloud: { value: null }, tTown: { value: null },
    uLug: { value: arr(N_LUG, () => new THREE.Vector4()) },    // az under the casement, phase 0..1, az drift over its run, tan..rust
    uLugN: { value: N_LUG },
    uGull: { value: arr(N_GULL, () => new THREE.Vector4()) },  // az, el, wheel radius, phase
    uGullN: { value: N_GULL },
    uMast: { value: arr(N_MAST, () => new THREE.Vector4()) },  // az, top el, thickness, sway phase
    uSteam: { value: new THREE.Vector4(0.9, -0.012, 1, 0) },
    uLane: { value: new THREE.Vector4(1 / 27, 0, 6, 0) },      // the near lane (boats with a topsail set, whose topsails lie on the counterpane): loops/s, phase (set once per seed; the lane runs on the world's clock alone and nothing holds or re-times it), count, colour seed   // steamer: az0, az speed, on/off, -
    // occluders: whatever blocks the picture. Furniture never moves, so these are set once.
    uBoxA: { value: arr(N_BOX, () => new THREE.Vector3(0, -900, 0)) }, uBoxB: { value: arr(N_BOX, () => new THREE.Vector3(0, -899, 0)) },
    uCapA: { value: arr(N_CAP, () => new THREE.Vector4(0, -900, 0, 0.01)) }, uCapB: { value: arr(N_CAP, () => new THREE.Vector3(0, -899, 0)) },
    uEllC: { value: arr(N_ELL, () => new THREE.Vector3(0, -900, 0)) }, uEllR: { value: arr(N_ELL, () => new THREE.Vector3(1, 1, 1)) },
    uMothF: { value: new THREE.Vector3(-1, 0, 0) }, uMothN: { value: new THREE.Vector3(0, 1, 0) },      // the moth's occluder (the last ellipsoid slot holds its centre and, in uEllR.x, its scale): a flat moth in a plane, nose along uMothF, plane normal uMothN
    uFold: { value: new THREE.Vector4(0, 0, 0, 1) },           // counterpane fold phases (per seed) and amplitude
    uBed: { value: new THREE.Vector4(-86, 20, -50, 20) },      // counterpane x0, x1, z0, z1
    uLens: { value: new THREE.Vector4(-47, 49.7, -91, 4.5) },  // the carafe's ball of water: centre, radius
    uSlosh: { value: new THREE.Vector2() },                    // the water still swinging: tilt of the small harbour
    uVar: { value: new THREE.Vector4(0, 0, 0, 0) },            // editions: x cast (0 luggers, 1 regatta, 2 steam), y squall (0 off, 1..2 on + phase), z sea fog 0..1, w paper (0 sprig, 1 stripe, 2 whitewash)
  };
}

// ---------------------------------------------------------------------------------------------------------
// THE PICTURE. harbour(o, aw): the harbour seen along the unit direction o that leaves the room through the
// hole (o.x > 0), aw = filter width in radians (edges never sharper than this). picture(P, aw) is the light a
// room point P receives: the harbour along the straight line P -> hole. That one line is the whole inversion.
// Sky above the horizon (so it lands on the floor), land and sails just above it, sea below (so it climbs
// the walls), the near quay lowest (so it lands on the ceiling).
// ---------------------------------------------------------------------------------------------------------
export const PICTURE_GLSL = /* glsl */`
  uniform float uTime, uGain, uCool, uNear, uNight, uSoft, uLugN, uGullN;
  uniform vec3 uHole, uSky, uSea, uSailA, uSailB, uPale;
  uniform vec4 uWind, uSteam, uVar, uLane;
  uniform sampler2D tCloud, tTown;
  uniform vec4 uLug[${N_LUG}], uGull[${N_GULL}], uMast[${N_MAST}];
  float edgeD(vec2 p, vec2 a, vec2 b){ vec2 e = b - a; return dot(p - a, vec2(e.y, -e.x))/max(length(e), 1e-4); }
  float quadD(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d){ return max(max(edgeD(p, a, b), edgeD(p, b, c)), max(edgeD(p, c, d), edgeD(p, d, a))); }
  float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba*h); }
  float lineK(float d, float th, float w){ float t2 = max(th, w*0.75); return (1. - smoothstep(t2 - w, t2 + w, d))*min(1., th/t2); }
  // an edge that bellies outward by 'bulge' at its middle (0 at both corners), and a four-cornered sail whose foot
  // (a -> b) and leech (b -> c) belly while head and luff stay straight
  float edgeB(vec2 p, vec2 a, vec2 b, float bulge){ vec2 e = b - a; float l2 = max(dot(e, e), 1e-6), tt = clamp(dot(p - a, e)/l2, 0., 1.); return dot(p - a, vec2(e.y, -e.x))/sqrt(l2) - bulge*4.*tt*(1. - tt); }
  float sailD(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, float bl, float bf){ return max(max(edgeB(p, a, b, bf), edgeB(p, b, c, bl)), max(edgeD(p, c, d), edgeD(p, d, a))); }
  // a lugger's three sails: signed distance (negative inside); which = 0 main, 1 mizzen, 2 jib; su = 0 at the luff .. 1 at the leech
  float lugSails(vec2 q, out float which, out float su){
    float dMain = sailD(q, vec2(-0.38, 0.15), vec2(0.10, 0.165), vec2(0.20, 1.0), vec2(-0.25, 0.72), 0.05, 0.03);
    float dMiz = sailD(q, vec2(0.17, 0.15), vec2(0.45, 0.165), vec2(0.50, 0.70), vec2(0.24, 0.54), 0.032, 0.02);
    float dJib = sailD(q, vec2(-0.76, 0.13), vec2(-0.41, 0.15), vec2(-0.35, 0.68), vec2(-0.385, 0.66), 0.03, 0.028);
    which = 0.; su = clamp(-edgeD(q, vec2(-0.25, 0.72), vec2(-0.38, 0.15))/0.47, 0., 1.);
    float d = dMain;
    if (dMiz < d){ d = dMiz; which = 1.; su = clamp(-edgeD(q, vec2(0.24, 0.54), vec2(0.17, 0.15))/0.27, 0., 1.); }
    if (dJib < d){ d = dJib; which = 2.; su = clamp(-edgeD(q, vec2(-0.385, 0.66), vec2(-0.76, 0.13))/0.2, 0., 1.); }
    return d;
  }
  vec3 harbour(vec3 o, float aw){
    float t = uTime;
    float a = atan(o.z, max(o.x, 1e-4)), e = atan(o.y, max(length(o.xz), 1e-4));
    aw = clamp(aw, 0.0005, 0.09);
    vec2 ae = vec2(a, e);
    // ---- sky: cobalt overhead, paler toward the horizon; cumulus on a level sheet, so on the floor it is undistorted
    float up = max(o.y, 0.);
    vec3 col = mix(mix(uSky, uPale, 0.24), uSky, smoothstep(0.0, 0.3, up));
    float sy = max(o.y, 0.035);
    vec2 cuv = o.zx/sy*0.46 + uWind.xy*t;
    float clod = clamp(log2(aw*0.46/(sy*sy)*256.), 0., 6.5);
    float cn = textureLod(tCloud, cuv, clod).r, cn2 = textureLod(tCloud, cuv + vec2(0.016, 0.011), clod).r;
    float cs = 0.02 + 0.012*min(clod, 3.5);
    float cov = smoothstep(0.6 - cs, 0.66 + cs, cn)*smoothstep(0.06, 0.2, e)*(1. - 0.8*smoothstep(4., 6.5, clod));
    col = mix(col, mix(uPale*1.5, mix(uSky, uPale, 0.6)*1.02, clamp((cn - cn2)*9. + 0.35, 0., 1.)*0.75), cov);
    // ---- sea: green, swell marching in, breaking white along the quay
    if (e < 0.){
      float dn = max(-o.y, 0.02); vec2 suv = o.zx/dn;
      float fp = aw/(dn*dn);                                  // footprint on the water sheet
      float nz = textureLod(tCloud, suv*0.045 + vec2(0., t*0.004), clamp(log2(fp*0.045*256.), 0., 6.)).g;
      float keep = 1. - smoothstep(0.12, 0.5, fp*2.4);
      float sw = sin(suv.y*2.4 + 2.2*sin(suv.x*0.33 + nz*5.) + t*uWind.z*1.1);
      float sw2 = sin(suv.y*7.3 - suv.x*1.9 + nz*9. + t*uWind.z*1.9);
      vec3 sea = uSea*(0.74 + (0.26*sw + 0.1*sw2)*keep);
      sea = mix(sea, uPale*1.35, smoothstep(0.8, 0.97, sw*0.75 + sw2*0.25 + (nz - 0.5)*0.6)*keep*0.8);
      float lgd = log(dn);
      float bn = textureLod(tCloud, vec2(a*0.9 + 0.2, lgd*0.21 - t*0.004), 1.).r, bn2 = textureLod(tCloud, vec2(a*2.6 - t*0.006, lgd*0.5 + 0.4), 1.).g;
      float bph = 14.*lgd - t*uWind.z*0.9 + 1.4*sin(a*2.3 + 0.3*t) + 7.*(bn - 0.5);
      float bk = (1. - smoothstep(0.5, 1.6, 14.*aw/dn))*smoothstep(0.02, 0.045, dn), bs = sin(bph);
      sea *= 1. + 0.2*bs*bk;
      sea = mix(sea, mix(uSea, uPale, 0.55)*1.1, smoothstep(0.7, 0.98, bs)*smoothstep(0.42, 0.62, bn2)*bk*0.5);
      sea = mix(sea, mix(uSea, uPale, 0.35)*0.95, smoothstep(-0.05, 0., e)*0.5);
      // the near quay (a level strip next to the casement) and the surf along it
      float qy = suv.y - 1.15 - 0.05*sin(suv.x*0.6);
      float surf = (1. - smoothstep(0.0, 0.42, qy))*(0.55 + 0.45*sin(suv.x*5. + nz*14. + t*1.6))*(0.6 + 0.4*sin(t*0.7 + suv.x*0.4));
      sea = mix(sea, uPale*1.4, clamp(surf, 0., 1.)*step(0., qy));
      vec2 bl = vec2(suv.x*1.3 + step(0.5, fract(suv.y*2.2))*0.5, suv.y*4.4), bf = abs(fract(bl) - 0.5);
      float jw = fp*4.4 + 0.02, joint = (1. - smoothstep(0.5 - 0.05 - jw, 0.5 - 0.05 + jw, max(bf.x, bf.y)))*(1. - smoothstep(0.1, 0.35, jw));
      vec3 quay = mix(uPale, uSailA, 0.2)*(0.62 + 0.1*nz)*(1. - 0.45*(1. - joint)*(1. - smoothstep(0.1, 0.35, jw)));
      float boll = length(vec2((fract(suv.x*0.55) - 0.5)/0.55, suv.y - 1.02));
      quay = mix(quay, uSailB*0.08, 1. - smoothstep(0.07, 0.07 + fp*1.5 + 0.01, boll));
      quay = mix(quay, uSea*0.45, (1. - smoothstep(0., 0.12, -qy))*0.7);        // weed on the steps
      sea = mix(sea, quay, 1. - smoothstep(-fp - 0.004, fp + 0.004, qy));
      // ---- the anchorage below the casement (all of it lands on the ceiling and the tops of the walls)
      // under each mast bar its boat, seen from above: a pointed deck of pale planks inside a dark gunwale, a hatch, a
      // thwart, lying off the quay and swinging with her mast
      for (int i = 0; i < ${N_MAST}; i++){
        vec4 M = uMast[i]; if (M.x > 5.) continue;
        float rr = max(1.7 + 0.6*(1. - smoothstep(0.3, 0.9, abs(M.x))), 1.5/max(cos(M.x), 0.2));
        float am = M.x + (0.022*sin(t*0.55 + M.w) + 0.008*sin(t*1.3 + M.w*2.))*(0.9 - atan(1./rr));
        vec2 dq = suv - rr*vec2(sin(am), cos(am)); float dy = 0.3*sin(M.w*3.) + 0.05*sin(t*0.21 + M.w);
        dq = vec2(dq.x*cos(dy) + dq.y*sin(dy), dq.y*cos(dy) - dq.x*sin(dy))/0.7;
        if (abs(dq.x) > 0.5 || abs(dq.y) > 0.2) continue;
        float fw = fp*1.7 + 0.004, dd = abs(dq.y) - 0.115*(1. - dq.x*dq.x*5.2);
        float seam = smoothstep(0.4 - fw*20., 0.4 + fw*20., abs(fract(dq.y*40.) - 0.5))*(1. - smoothstep(0.004, 0.012, fw));
        vec3 dk = mix(uPale, uSailA, 0.45)*(0.78 - 0.2*seam + 0.1*nz);
        dk = mix(dk, uSailB*0.1, smoothstep(-0.03 - fw, -0.022, dd));
        dk = mix(dk, uSailB*0.14, 1. - smoothstep(-fw, fw, max(abs(dq.x + 0.15) - 0.075, abs(dq.y) - 0.036)));
        dk = mix(dk, uSailB*0.2, (1. - smoothstep(0.008, 0.008 + fw, abs(dq.x - 0.17)))*step(dd, -0.03));
        sea = mix(sea, dk, 1. - smoothstep(-fw, fw, dd));
      }
      // a cormorant on a mooring post out in the anchorage, wings held out to dry and shifting (on the ceiling by the
      // bed-head cornice, its head toward the wall)
      vec2 cq = vec2(a + 0.46, e + 0.4);
      if (abs(cq.x) < 0.06 && abs(cq.y) < 0.12){
        float cw = aw*1.2 + 0.0008, sh1 = 0.006*sin(t*0.7), sh2 = 0.005*sin(t*0.53 + 1.3);
        float dB = (length((cq - vec2(0.002, 0.))/vec2(0.011, 0.031)) - 1.)*0.011;
        dB = min(dB, segD(cq, vec2(0.004, 0.026), vec2(-0.003, 0.05)) - 0.0036);
        dB = min(dB, segD(cq, vec2(-0.003, 0.051), vec2(-0.019, 0.056)) - 0.0026*(0.3 + 0.7*smoothstep(-0.019, -0.008, cq.x)));
        dB = min(dB, quadD(cq, vec2(0.006, 0.02), vec2(0.008, -0.008), vec2(0.034, -0.022 + sh1), vec2(0.04, 0.012 + sh1)));
        vec2 cm = vec2(-cq.x, cq.y);
        dB = min(dB, quadD(cm, vec2(0.003, 0.02), vec2(0.005, -0.008), vec2(0.031, -0.02 + sh2), vec2(0.037, 0.014 + sh2)));
        dB = min(dB, quadD(cq, vec2(-0.004, -0.044), vec2(0.009, -0.044), vec2(0.006, -0.025), vec2(-0.006, -0.025)));
        float post = max(abs(cq.x - 0.002) - 0.0058, abs(cq.y + 0.079) - 0.041);
        sea = mix(sea, mix(uSailB, uPale, 0.18)*0.3*(0.8 + 0.4*step(-0.05, cq.y)), 1. - smoothstep(-cw, cw, post));
        sea = mix(sea, uPale*1.3, (1. - smoothstep(0.004, 0.004 + cw, abs(cq.y + 0.122)))*(1. - smoothstep(0.012, 0.03, abs(cq.x - 0.002)))*0.7);
        sea = mix(sea, uSailB*0.06, 1. - smoothstep(-cw, cw, dB));
      }
      // moon glitter (the night edition): a road of silver glints lying on the swell bands, broad under the casement
      // and narrowing to the horizon, each glint winking as its band marches in
      if (uNight > 0.5){
        float road = 1. - smoothstep(0.3, 1., abs(a + 0.3 + 0.02*sin(lgd*3.))/(0.035 + 0.45*dn));
        float wink = smoothstep(0.4, 0.75, textureLod(tCloud, vec2(a*9. + t*0.013, lgd*1.9 - t*0.03), 0.5).g);
        sea = mix(sea, uPale*1.75, road*(smoothstep(0.45, 0.9, bs)*wink*bk*0.9 + 0.3*(1. - bk)*smoothstep(0.0, 0.03, dn)));
      }
      col = mix(col, sea, smoothstep(-aw, aw, -e));
    }
    // ---- the far shore: headland, pines, town, breakwater (a strip texture; channels are white, roof, ochre)
    float tv = (e + 0.012)/0.125;
    if (tv > 0. && tv < 1.){
      float tl = log2(aw*1280.); vec2 tuv = vec2(a/3.2 + 0.5, tv);
      vec4 tx = textureLod(tTown, tuv, clamp(tl, 0.8, 8.));
      // magnified (a wall at arm's length): every edge is cut again from the smooth field, so eaves and gables stay
      // straight and no texel shows; the windows are drawn here, not stored, as small soft dots on the wall's inside
      float mag = 1. - smoothstep(-1.2, 0.8, tl), kk = 0.5*clamp(aw*1280.*0.9, 0.1, 1.);
      tx = mix(tx, smoothstep(vec4(0.5 - kk), vec4(0.5 + kk), tx), mag);
      vec4 tb = textureLod(tTown, tuv, max(tl, 2.6));
      float inner = smoothstep(0.8, 0.97, max(tb.r, tb.b))*(1. - smoothstep(0.02, 0.2, tb.g));
      vec2 wg = vec2(a/0.00625, e/0.0044); wg.y += 0.37*floor(wg.x*0.25);
      vec2 wf = (fract(wg) - 0.5)*vec2(0.00625, 0.0044);
      float wa = aw/0.0011, wdot = 1. - smoothstep(1. - min(wa, 0.9), 1. + wa, length(wf/vec2(0.0009, 0.0013)));
      float win = mix(wdot, 0.13, smoothstep(0.35, 1.1, wa))*inner;
      vec3 land = uSea*0.2*(1. - uCool*0.3);
      land = mix(land, uPale*1.22, tx.r); land = mix(land, uSailB*1.15, tx.g); land = mix(land, mix(uPale, uSailA, 0.5)*1.05, tx.b);
      land = mix(land, uSailB*0.1, win*0.85);
      col = mix(col, land, tx.a);
    }
    // ---- the paddle steamer and its long smoke, far out
    for (int k = 0; k < 3; k++){
      float fk = float(k);
      if (uSteam.z < 0.5 || fk >= uSteam.w) break;
      float sd = (uSteam.y < 0. ? -1. : 1.)*(k == 1 ? -1. : 1.), ssz = 0.085*(1. + 0.45*fk);
      float sc0 = mod(uSteam.x + fk*1.37 + sd*abs(uSteam.y)*(1. + 0.3*fk)*t + 1.7, 3.4) - 1.7;
      vec2 q = vec2((a - sc0)*sd, e + 0.006 + 0.012*fk)/ssz; float w = aw/ssz;
      float sx = max(-q.x - 0.05, 0.);                         // distance astern
      float sm = (1. - smoothstep(0.0, 1., abs(q.y - 0.62 - 0.42*sqrt(sx))/(0.1 + 0.16*sx + w)))*smoothstep(0., 0.25, sx)*(1. - smoothstep(4.5, 8., sx));
      sm *= 0.45 + 0.8*textureLod(tCloud, vec2(sx*0.09 - t*0.012, q.y*0.2), 1.).g;
      col = mix(col, mix(uSailB, uPale, 0.3)*0.2, clamp(sm, 0., 1.)*0.85);
      float dh = quadD(q, vec2(-0.62, 0.), vec2(0.56, 0.), vec2(0.7, 0.13), vec2(-0.66, 0.12));
      dh = min(dh, quadD(q, vec2(-0.1, 0.1), vec2(0.03, 0.1), vec2(0.02, 0.56), vec2(-0.09, 0.56)));
      dh = min(dh, length(q - vec2(0.1, 0.09)) - 0.15);
      col = mix(col, uSailB*0.05, 1. - smoothstep(-w, w, dh));
    }
    // ---- the fleet: luggers standing out to sea, close under the casement, so their sails stand above the horizon.
    //      Boat 0 lies moored on the entry axis (uLug[0].y < 0), sails set and drying, only bobbing.
    for (int i = 0; i < ${N_LUG}; i++){
      if (float(i) >= uLugN) break;
      vec4 L = uLug[i]; float fi = float(i), dir = L.z < 0. ? -1. : 1., moor = L.y < 0. ? 1. : 0.;
      float ph = fract(L.y + t*uWind.w);                       // 0 under the casement .. 1 hull down, far out
      float ent = 1. - smoothstep(0., 0.16, ph);                // she comes in alongside the quay, then stands out to sea
      float s = 0.2/(1. + 2.2*ph), ac = L.x + L.z*ph - dir*ent*ent*1.5;      // never a giant: on a wall at arm's length she is a boat, not a panel (the moored one and the near lane are the big sails)
      float show = smoothstep(0., 0.015, ph)*(1. - smoothstep(0.92, 1., ph));
      if (moor > 0.5){ s = 0.21; ac = L.x; show = 1.; }
      float turnB = L.y < -1.5 ? 1. : 0.;
      if (turnB > 0.5){ s = L.y < -2.5 ? 0.1 : 0.118; ac = L.x + 0.04*sin(t*0.06 + 1. + fi); show = 1.; }
      vec2 q = vec2(-(a - ac)*dir, e + 0.02 + 0.25*(s - 0.1))/s;      // bow toward -x, and she sails bow first
      if (abs(q.x) > 1.05 || q.y < -0.95 || q.y > 1.2) continue;
      float w = aw/s, way = max(1. - moor, turnB);
      q.y -= 0.014*sin(t*0.9 + fi*2.1); q.x += q.y*0.035*sin(t*0.62 + fi*1.7);      // bob and roll
      if (uVar.x > 1.5 && moor < 0.5 && turnB < 0.5 && (i == 3 || i == 5)){
        // the third cast: this slot is a steam tug: a short black hull, a wheelhouse with lit windows, a raked funnel
        // with a band in the fleet's colour, coal smoke blowing astern, white water under her bow and a wake
        vec2 g = q*2.1 + vec2(0., 0.02); float gw = w*2.1, sx = max(g.x - 0.06, 0.);
        float smk = (1. - smoothstep(0., 1., abs(g.y - 0.68 - 0.36*sqrt(sx))/(0.07 + 0.2*sx + gw)))*smoothstep(0., 0.2, sx)*(1. - smoothstep(1.3, 2.1, sx));
        smk *= 0.5 + 0.8*textureLod(tCloud, vec2(sx*0.13 - t*0.02 + fi, g.y*0.2), 1.).g;
        col = mix(col, mix(uSailB, uPale, 0.25)*0.18, clamp(smk, 0., 1.)*0.85*show);
        float dT = quadD(g, vec2(-0.5, 0.), vec2(0.46, 0.), vec2(0.5, 0.15), vec2(-0.6, 0.19));
        dT = min(dT, quadD(g, vec2(-0.26, 0.15), vec2(0.04, 0.15), vec2(0.04, 0.33), vec2(-0.26, 0.33)));
        float dF = quadD(g, vec2(0.08, 0.15), vec2(0.2, 0.15), vec2(0.25, 0.64), vec2(0.14, 0.64));
        col = mix(col, uSailB*0.05, (1. - smoothstep(-gw, gw, min(dT, dF)))*show);
        col = mix(col, uSailA*1.25, (1. - smoothstep(-gw, gw, max(dF, abs(g.y - 0.5) - 0.045)))*show);
        col = mix(col, uPale*1.1, (1. - smoothstep(-gw, gw, max(abs(g.x + 0.11) - 0.1, abs(g.y - 0.265) - 0.03)))*show*0.8);
        float bowW = 1. - smoothstep(0.4, 1., length((g - vec2(-0.52, 0.005))/vec2(0.12 + gw, 0.04 + gw)));
        float wkT = (1. - smoothstep(0.3, 1., abs(g.y + 0.012)/(0.014 + 0.03*max(g.x - 0.45, 0.) + gw)))*smoothstep(-0.5, -0.4, g.x)*(1. - smoothstep(1.0, 1.9, g.x));
        col = mix(col, uPale*1.4, clamp(max(bowW, wkT*0.8), 0., 1.)*show*(0.75 + 0.25*sin(g.x*17. - t*4. + fi)));
        continue;
      }
      // below the waterline the same sails are looked up mirrored and rippled: the broken reflection
      float under = q.y < 0.06 ? 1. : 0.;
      float brk = 0.5 + 0.5*sin(q.y*70. + 2.5*sin(q.x*11. + t*1.3 + fi) - t*2.);
      brk = mix(0.55, smoothstep(0.25, 0.6, brk), 1. - smoothstep(0.5, 1.6, 70.*w));
      vec2 qs = under > 0.5 ? vec2(q.x + 0.022*sin(q.y*46. + t*2.2 + fi), -q.y*1.12 + 0.02) : q;
      float which, su; float dS = lugSails(qs, which, su);
      float seamW = w*14.;
      float seam = (1. - smoothstep(0.035, 0.035 + seamW, abs(fract(qs.x*14. + qs.y*1.5 + 0.5*sin(qs.y*3.)) - 0.5)))*(1. - smoothstep(0.12, 0.33, seamW));
      float fineK = 1. - smoothstep(0.014, 0.04, w);          // cloth detail comes up as a sail is magnified, and is gone before it could shimmer
      float reef = (1. - smoothstep(max(0.006, w*0.8), max(0.006, w*0.8) + w, min(abs(qs.y - 0.38 - qs.x*0.08 + 0.05*su*(1. - su)), abs(qs.y - 0.515 - qs.x*0.1 + 0.05*su*(1. - su)))))*fineK;
      float pcoord = qs.x*14. + qs.y*1.5 + 0.5*sin(qs.y*3.), pid = floor(pcoord + 0.5);
      // sailcloth: cloths alternately a tone lighter and darker, weather stains, a few patches, a darker tabling
      // round the edges, and the shadow of mast and yard lying across it
      float cloth = 0.76 + 0.17*mod(pid, 2.) + 0.2*fract(sin(pid*12.9898 + fi*4.1 + which*7.)*43758.5453);
      float stn = textureLod(tCloud, qs*vec2(0.55, 0.4) + vec2(fi*0.37, which*0.21), 1.5).g, stn2 = textureLod(tCloud, qs*vec2(2.1, 0.5) + fi*0.13, 2.).r;
      cloth *= 0.7 + 0.6*stn - 0.22*smoothstep(0.62, 0.8, stn2)*fineK;
      vec2 pg = vec2(pcoord + 0.5, qs.y*5. + pid*0.37), pcl = floor(pg), pf = abs(fract(pg) - 0.5);
      float pat = step(0.93, fract(sin(dot(pcl, vec2(12.9898, 78.233)) + fi*3.3)*43758.5453))*(1. - smoothstep(0.3, 0.3 + seamW, pf.x))*(1. - smoothstep(0.22, 0.22 + w*5., pf.y))*fineK;
      cloth *= 1. + 0.12*pat*(fract(pcl.x*0.618 + pcl.y*0.31) < 0.5 ? 1. : -0.8);
      cloth *= 1. - 0.3*smoothstep(-0.03 - w, -0.012, dS)*fineK;
      float msh = (1. - smoothstep(0.012, 0.016 + w*2., min(segD(qs, vec2(-0.075, 0.16), vec2(-0.045, 1.0)), segD(qs, vec2(0.365, 0.16), vec2(0.38, 0.72)))))*0.24;
      msh = max(msh, (1. - smoothstep(0.014, 0.02 + w*2., min(segD(qs, vec2(-0.27, 0.655), vec2(0.21, 0.975)), segD(qs, vec2(0.22, 0.49), vec2(0.5, 0.675)))))*0.2);
      cloth *= 1. - msh*(1. - smoothstep(0.012, 0.03, w));
      float rrow = min(abs(qs.y - 0.35 - qs.x*0.08 + 0.05*su*(1. - su)), abs(qs.y - 0.485 - qs.x*0.1 + 0.05*su*(1. - su)));     // just under each reef band: the points hang there
      float rid = floor(pcoord*2.), rh = fract(sin(rid*91.7 + fi*5.3)*43758.5453), rdx = (fract(pcoord*2.) - 0.5)/28.;
      float ry1 = qs.y - 0.38 - qs.x*0.08 + 0.05*su*(1. - su), ry2 = qs.y - 0.515 - qs.x*0.1 + 0.05*su*(1. - su);
      float rlen = 0.026 + 0.022*rh, rsl = (rh - 0.5)*0.012;
      float tieD = min(segD(vec2(rdx, ry1), vec2(0., -0.004), vec2(rsl, -rlen)), segD(vec2(rdx, ry2), vec2(0., -0.004), vec2(-rsl, -rlen*0.85)));
      float rpt = lineK(tieD, 0.0028, w)*fineK*step(which, 1.5)*0.62 + 0.*rrow;
      vec3 sc = mix(uSailA, uSailB, which > 1.5 ? clamp(L.w + 0.35, 0., 1.) : L.w)*1.3*cloth*(1. - 0.45*rpt);
      if (uVar.x > 0.5 && uVar.x < 1.5){                        // regatta: white yachts with a coloured head panel, a coloured mizzen, striped spinnakers
        vec3 hue = mix(uSailA, mix(uSea, uSailB, step(0.66, fract(fi*0.618))), step(0.33, fract(fi*0.618)))*1.3;
        float bw = w*5., band = mix(0.5, smoothstep(0.5 - bw, 0.5 + bw, abs(fract(qs.y*5. + fi*0.37) - 0.5)*2.), 1. - smoothstep(0.15, 0.4, bw));
        sc = (which > 1.5 ? mix(hue, uPale*1.3, band) : which > 0.5 ? hue : mix(uPale*1.3, hue, smoothstep(0.64 - w, 0.64 + w, qs.y - 0.2*su)))*cloth*(1. - 0.45*rpt);
      } else if (uVar.x > 1.5) sc *= 0.5;                       // working boats among the steamers: dark tanned sails
      // bellied: light at the luff, dark in the belly, the leech catching the light again
      sc *= (mix(1.22, 0.62, smoothstep(0., 0.55, su)) + 0.34*smoothstep(0.62, 1., su))*(0.8 + 0.3*qs.y)*(1. - 0.26*seam - 0.22*reef);
      float sm = (1. - smoothstep(-w, w, dS))*show;
      col = mix(col, mix(sc, mix(col, sc, 0.62)*0.92, under), sm*mix(1., brk*(1. - smoothstep(0.1, 0.95, -q.y)), under));
      // spars, hull with a sheer and a pale strake, rudder, two figures on deck
      float spars = min(segD(q, vec2(-0.13, 0.08), vec2(-0.10, 1.05)), segD(q, vec2(0.31, 0.08), vec2(0.33, 0.76)));
      spars = min(spars, min(segD(q, vec2(-0.3, 0.69), vec2(0.23, 1.03)), segD(q, vec2(0.21, 0.52), vec2(0.52, 0.72))));
      spars = min(spars, segD(q, vec2(-0.78, 0.125), vec2(-0.4, 0.14)));
      float ytop = 0.09 + 0.3*q.x*q.x;
      float dHull = max(max(q.y - ytop, -q.y), max(q.x - 0.47 - 0.5*q.y, -0.46 - 0.8*q.y - q.x));
      dHull = min(dHull, quadD(q, vec2(0.47, -0.01), vec2(0.53, -0.01), vec2(0.575, 0.1), vec2(0.515, 0.1)));     // the rudder
      float fig = min(segD(q, vec2(0.395, ytop), vec2(0.4, ytop + 0.085)), segD(q, vec2(-0.03, ytop), vec2(-0.02, ytop + 0.08)));
      float hullK = 1. - smoothstep(-w, w, dHull);
      float dark = max(max(lineK(spars, 0.008, w), lineK(fig, 0.013, w)), hullK);
      col = mix(col, uSailB*0.055, dark*show);
      float strake = (1. - smoothstep(0.007, 0.007 + w, abs(q.y - ytop + 0.032)))*hullK*(1. - smoothstep(0.012, 0.03, w));
      col = mix(col, uPale*0.8, strake*show*0.85);
      // her dark side lying on the water under her, a white bow wave, the waterline and a wake astern
      float hx = 1. - smoothstep(0.42, 0.5, abs(q.x - 0.02));
      col = mix(col, uSailB*0.07, under*hx*(1. - smoothstep(0., 0.13, -q.y))*brk*0.7*show*step(q.y, 0.));
      float foam = (1. - smoothstep(0.4, 1., length((q - vec2(-0.47, 0.004))/vec2(0.1 + w, 0.035 + w))))*way;
      float wl = (1. - smoothstep(0.006, 0.008 + w, abs(q.y + 0.004)))*hx*(0.3 + 0.5*way);
      float wk = (1. - smoothstep(0.3, 1., abs(q.y + 0.014)/(0.012 + 0.035*max(q.x - 0.45, 0.) + w)))*smoothstep(0.46, 0.56, q.x)*(1. - smoothstep(0.62, 1.02, q.x))*way;
      col = mix(col, uPale*1.4, clamp(max(foam, max(wl, wk*0.8)), 0., 1.)*show*(0.75 + 0.25*sin(q.x*31. - t*4. + fi)));
    }
    // ---- the near lane: boats leaving close under the casement with a topsail set above the lug. Their hulls and
    //      lugsails hang on the bed-head wall; the topsail is high enough above the horizon to fall whole on the
    //      counterpane (a ten-degree beam stretches it sixfold along the bed, masthead toward the hole), and as she
    //      stands out to sea it slides from ridge to ridge toward the pillows.
    for (int j = 0; j < 7; j++){
      float fj = float(j);
      if (fj >= uLane.z) break;
      float p = fract(fj/max(uLane.z, 1.) + uLane.y + t*uLane.x + 0.02*sin(fj*2.4));
      float ac = mix(-0.64, 0.12, p), k = (0.137 - (ac + 0.03)*0.115)/0.16;      // five of them 0.15 rad apart: the bed (azimuth -0.45 to -0.03) always holds two or three
      vec2 q = vec2(a - ac, e)/k;
      if (abs(q.x) > 0.17 || q.y > 0.36 || q.y < -0.05) continue;
      float w = aw/k, show = smoothstep(0., 0.05, p)*(1. - smoothstep(0.93, 1., p));
      q.y -= 0.0025*sin(t*0.8 + fj*2.3); q.x += q.y*0.03*sin(t*0.55 + fj*1.9);
      float hsh = fract(sin(fj*12.9898 + uLane.w*78.233)*43758.5453);
      vec3 base = dot(uSailA, vec3(0.333)) < 0.12 ? uPale*vec3(0.62, 0.3, 0.1)*0.9 : mix(uSailA, uSailB, hsh < 0.5 ? 0.1 + 0.4*hsh : 0.3 + 0.7*hsh);
      // the lug, in the boat's own angle space (it hangs on the bed-head wall and the pillows)
      float dL = sailD(q, vec2(-0.062, 0.014), vec2(0.050, 0.017), vec2(0.052, 0.139), vec2(-0.040, 0.100), 0.008, 0.004);
      float su = clamp((q.x + 0.062)/0.114, 0., 1.);
      float pc = q.x*62. + q.y*9., seamW = w*62.;
      float seam = (1. - smoothstep(0.04, 0.04 + seamW, abs(fract(pc) - 0.5)))*(1. - smoothstep(0.12, 0.33, seamW));
      float cloth = 0.88 + 0.24*fract(sin(floor(pc + 0.5)*12.9898 + fj*4.1)*43758.5453);
      float reef = (1. - smoothstep(0.0006, 0.0006 + w, abs(q.y - 0.05 - q.x*0.03)))*(1. - smoothstep(0.0006, 0.002, w));
      vec3 hue1 = uSailA*1.5, hue2 = uSea*1.7, sc = base*1.5*cloth;
      float rg = (uVar.x > 0.5 && uVar.x < 1.5) ? 1. : 0.;
      if (rg > 0.5) sc = mix(uPale*1.5, hue1, smoothstep(0.05 - w, 0.05 + w, q.y - 0.3*q.x))*cloth;      // regatta: a white foot under a sail of one solid colour
      else if (uVar.x > 1.5) sc *= 0.72;
      sc *= (mix(1.16, 0.74, smoothstep(0., 0.5, su)) + 0.22*smoothstep(0.62, 1., su))*(1. - 0.22*seam - 0.16*reef);
      col = mix(col, sc, (1. - smoothstep(-w, w, dL))*show);
      // the topsail is the sail that falls on the counterpane, so it is cut for the counterpane: drawn in metres on the
      // level of the linen (27 m under the hole), where the ten-degree beam lays it down whole. sp = (across, up the
      // mast toward the hole). A jib-headed topsail: straight luff on the mast, pointed head, bellied leech and foot,
      // five cloths running up the sail, a reef band with its points, a darker tabling round the edge. Alternate
      // boats carry theirs 28 m nearer the hole, so two lie side by side on the bed with sky between.
      float Dm = 27.*length(o.xz)/max(o.y, 0.03);
      float D0 = min(27./tan(clamp(0.143*k, 0.05, 0.4)) + 6. - 16.*mod(fj, 2.), 182.);      // sliding toward the pillows, and stopping short of them
      vec2 sp = vec2((a - ac)*Dm, D0 - Dm);
      sp.x += 0.035*sp.y*sin(t*0.55 + fj*1.9) + 0.25*sin(t*0.8 + fj*2.3);
      if (abs(sp.x) < 13. && sp.y > -5. && sp.y < 25.){
        float wl = max(aw*Dm, 0.03);
        float dT = sailD(sp, vec2(-7., 0.), vec2(9., 0.8), vec2(-5.8, 19.5), vec2(-6.5, 19.2), 1.3, 0.6);
        float suT = clamp((sp.x + 7. - 0.06*sp.y)/max(16. - 0.8*sp.y, 0.5), 0., 1.);
        float pcT = (sp.x + 0.1*sp.y)/3.2, swT = wl/3.2;      // cloths run up the sail, along the beam: the ribs' small steps slide them without breaking them into checks
        float seamT = (1. - smoothstep(0.03, 0.03 + swT, abs(fract(pcT) - 0.5)))*(1. - smoothstep(0.15, 0.4, swT));
        float clothT = 0.84 + 0.3*fract(sin(floor(pcT + 0.5)*12.9898 + fj*7.3)*43758.5453);
        float ry = sp.y - 5.2 - 0.05*sp.x, lk = 1. - smoothstep(0.2, 0.6, wl);
        float reefT = (1. - smoothstep(0.16, 0.16 + wl, abs(ry)))*lk;
        float ptx = abs(fract(pcT*3.) - 0.5)*3.2/3.;
        float ptsT = (1. - smoothstep(0.1, 0.1 + wl, ptx))*(1. - smoothstep(0.9, 0.9 + wl, abs(ry + 0.9)))*lk;
        float hem = smoothstep(-0.75 - wl, -0.35, dT)*lk;
        vec3 st = base*1.3;
        if (rg > 0.5){                                          // regatta: stripes of two full colours and one cream band
          float bb = sp.y/3.7 - 0.5, bi = floor(bb), ew = clamp(wl/3.7, 0.01, 0.5);
          vec3 c0 = abs(bi - 2.) < 0.5 ? uPale*1.5 : (mod(bi, 2.) < 0.5 ? hue2 : hue1), c1 = abs(bi - 1.) < 0.5 ? uPale*1.5 : (mod(bi, 2.) < 0.5 ? hue1 : hue2);
          st = mix(c0, c1, smoothstep(0.5 - ew, 0.5 + ew, fract(bb)));
        } else if (uVar.x > 1.5) st *= 0.72;
        st *= clothT*(mix(1.2, 0.74, smoothstep(0., 0.55, suT)) + 0.26*smoothstep(0.66, 1., suT))*(1. - 0.34*seamT)*(1. - 0.3*reefT)*(1. - 0.5*ptsT)*(1. - 0.3*hem);
        col = mix(col, st, (1. - smoothstep(-wl, wl, dT))*show);
        float sparT = min(segD(sp, vec2(-7.7, -3.), vec2(-6.3, 22.5)), segD(sp, vec2(-8.2, -0.6), vec2(10.2, 0.6)));
        col = mix(col, uSailB*0.055, lineK(sparT, 0.36, wl)*show);
      }
      // mast, yards, hull with a pale strake, a line of foam
      float spars = min(segD(q, vec2(0.002, 0.004), vec2(0.006, 0.146)), segD(q, vec2(-0.043, 0.099), vec2(0.055, 0.141)));
      float ytop = 0.012 + 2.4*q.x*q.x;
      float dHull = max(max(q.y - ytop, -q.y), max(q.x - 0.078 - 0.5*q.y, -0.074 - 0.8*q.y - q.x));
      float hullK = 1. - smoothstep(-w, w, dHull);
      col = mix(col, uSailB*0.055, max(lineK(spars, 0.0013, w), hullK)*show);
      col = mix(col, uPale*0.8, (1. - smoothstep(0.001, 0.001 + w, abs(q.y - ytop + 0.0045)))*hullK*(1. - smoothstep(0.002, 0.005, w))*show*0.85);
      col = mix(col, uPale*1.4, (1. - smoothstep(0.001, 0.0015 + w, abs(q.y + 0.001)))*(1. - smoothstep(0.07, 0.085, abs(q.x)))*show*0.7);
    }
    // ---- gulls wheeling (they cross the room on their backs)
    for (int i = 0; i < ${N_GULL}; i++){
      if (float(i) >= uGullN) break;
      vec4 G = uGull[i]; float th = t*(0.22 + 0.2*fract(G.w*3.7)) + G.w;
      float gs = 0.013 + 0.012*fract(G.w*7.31);
      vec2 q = (ae - G.xy - G.z*vec2(cos(th), 0.42*sin(th*1.0 + 0.6)))/gs;
      if (dot(q, q) > 1.5) continue;
      float w = aw/gs, f = 0.25 + 0.55*sin(t*5.2 + G.w*9.);
      q.x *= sin(th) < 0. ? -1. : 1.; q.y -= 0.12*q.x;                 // banked into her turn
      float x = min(abs(q.x), 1.), yw = (0.35 + 1.1*f)*x*(1. - 0.8*x) - 0.25*f*x*x;        // the wing's curve: up to the wrist, drooping to the tip
      float slope = (0.35 + 1.1*f)*(1. - 1.6*x) - 0.5*f*x;
      float dw = max(abs(q.y - yw)/sqrt(1. + slope*slope), abs(q.x) - 1.);
      float thk = 0.02 + 0.105*(1. - x)*(1. - 0.5*x);
      float wing = (1. - smoothstep(thk - w, thk + w, dw))*min(1., thk/max(w*0.75, 1e-3));
      float body = 1. - smoothstep(1. - w*5., 1. + w*5., length((q - vec2(0.04, -0.02))/vec2(0.2, 0.115)));
      vec3 gc = mix(uPale*1.5, uSailB*0.1, smoothstep(0.74, 0.9, x));
      col = mix(col, gc, clamp(max(wing, body), 0., 1.));
    }
    // ---- the moored masts by the casement: black bars across everything, swaying together
    float bar = 0.;
    for (int i = 0; i < ${N_MAST}; i++){
      vec4 M = uMast[i]; float sway = 0.022*sin(t*0.55 + M.w) + 0.008*sin(t*1.3 + M.w*2.);
      float x = a - M.x - sway*(e + 0.9);
      if (abs(x) > 0.3 || e > M.y + 0.05) continue;
      float taper = 1. - 0.5*smoothstep(-0.9, M.y, e);
      float m = lineK(abs(x), M.z*taper, aw)*(1. - smoothstep(M.y - aw, M.y + aw, e));
      float ey = M.y*0.6;                                                   // the yard with its furled sail
      m = max(m, lineK(segD(vec2(x, e), vec2(-0.15, ey - 0.02), vec2(0.15, ey + 0.02)), M.z*0.75, aw));
      bar = max(bar, m);
    }
    col *= 1. - 0.93*bar;
    // ---- the rare near sail: for three seconds the whole room is sail, seams and reef points sweeping every surface
    if (uNear > 0.001){
      // one enormous sail passing right under the window: narrow dark seams a tenth of the frame apart, each cloth its
      // own tone, one reef band with a row of short hanging ties, and a curved leech with its bolt rope that sweeps in
      // from the right and out to the left, the harbour still showing beyond it
      float sw3 = a*16. + e*2.8;
      float sw = max(aw*16., 0.006);
      float seam = (1. - smoothstep(0.03, 0.03 + sw, abs(fract(sw3) - 0.5)))*(1. - smoothstep(0.2, 0.45, sw));
      float pid3 = floor(sw3 + 0.5), hp = fract(sin(pid3*12.9898)*43758.5453);
      float panel = 0.74 + 0.16*mod(pid3, 2.) + 0.24*hp;
      float stn3 = textureLod(tCloud, vec2(a*0.35, e*0.3) + 0.4, 2.).g;
      float ry3 = e - 0.1 - 0.05*a + 0.03*sin(a*2.);
      float band3 = (1. - smoothstep(0.007, 0.007 + aw, abs(ry3)))*(1. - smoothstep(0.006, 0.016, aw));
      float tie = segD(vec2((fract(sw3*2.) - 0.5)/32., ry3), vec2(0., -0.006), vec2(0.002, -0.06));
      float ties = lineK(tie, 0.003, aw)*(1. - smoothstep(0.004, 0.012, aw));
      vec3 ns = (dot(uSailA, vec3(0.333)) < 0.12 ? uPale*vec3(0.62, 0.3, 0.1) : uSailA)*1.1*panel*(0.72 + 0.5*stn3)*(0.86 + 0.4*e)*(0.8 + 0.3*sin(a*1.7 + 0.6))*(1. - 0.62*seam)*(1. - 0.45*band3)*(1. - 0.65*ties);
      // the leech: az of the edge at this height, bellied; it crosses the whole picture as uNear goes 0 -> 1 -> 0
      float edge = mix(1.75, -1.75, uNear) + 0.5*e*e - 0.18*e + 0.05*sin(e*5. + t*0.7);
      float cover = smoothstep(-aw, aw, a - edge);
      float rope = lineK(abs(a - edge - 0.012), 0.008, aw);
      ns *= 0.75 + 0.25*smoothstep(0.02, 0.1, a - edge);          // the tabling inside the rope
      col = mix(col, ns, cover);
      col = mix(col, uSailB*0.06, rope);
    }
    // ---- a squall: curtains of rain crossing the bay one after another (half a radian apart), so they cross the room
    //      strip by strip. In the picture each is a slanting band (azimuth against height) 0.12 rad wide, coming in from
    //      the sea: on the floor it goes board by board toward the shutter, on the linen (where it is some 16 m wide, a
    //      quarter of the bed, lying aslant across the ridges) from ridge to ridge in about 12 s, on the walls it climbs
    //      slowly. Inside it the picture is a stop darker and a little slate, never grey: a sail in the rain is still tan.
    //      The rain itself is pale streaks a metre apart falling down the band, drawn only where they are wider than a
    //      pixel or so. Its leading edge is the sharper one.
    if (uVar.y > 0.5){
      float sq = mod(a + 4.*(e - 0.18) - t*0.026 - (uVar.y - 1.)*2. + 0.25, 0.5) - 0.25;
      float cur = smoothstep(-0.1, -0.045, sq)*(1. - smoothstep(0.04, 0.062, sq));
      float sid = (a + 0.22*e)*170., shh = fract(sin(floor(sid)*12.9898)*43758.5453), sfw = aw*170.;
      float line = (1. - smoothstep(0.13, 0.13 + max(sfw, 0.04), abs(fract(sid) - 0.5)))*step(fract(e*(26. + 14.*shh) + t*(0.45 + 0.4*shh) + shh*7.), 0.62);
      line *= (1. - smoothstep(0.22, 0.55, sfw))*step(0.2, shh);
      col *= mix(vec3(1.), vec3(0.4, 0.46, 0.56)*(1. + line), cur);
    }
    // ---- sea fog burning off: the picture milky, then in full colour (the world eases uVar.z from u)
    col = mix(col, mix(vec3(dot(col, vec3(0.25, 0.6, 0.15))), uPale, 0.45)*0.9, uVar.z*0.72);
    // ---- a cloud over the harbour's sun: dimmer and cooler, eased by the caller
    col = mix(col, dot(col, vec3(0.25, 0.6, 0.15))*mix(uSky, vec3(1.), 0.55)*1.1, uCool*0.4);
    return col*uGain;
  }
  // filter width for picture(): call this in main(), never inside a loop (fragment shaders only: a material
  // whose VERTEX shader includes STYLE_GLSL sets defines: { NO_DERIV: 1 })
  #ifndef NO_DERIV
  float picFoot(vec3 P){ vec3 o = uHole - P; o /= max(length(o), 1e-3); return length(fwidth(o))*0.7; }
  #endif
  // the cosine-to-axis falloff: brightest straight opposite the hole, a third as bright at the edges
  float picFall(vec3 P){ vec3 o = uHole - P; float c = max(o.x, 0.)/max(length(o), 1e-3); return 0.3 + 0.7*c*sqrt(c); }
  vec3 picture(vec3 P, float aw){
    vec3 o = uHole - P; float dist = length(o); o /= max(dist, 1e-3);
    if (o.x < 0.01) return vec3(0.);
    return harbour(o, max(aw, uSoft/max(dist, 6.)))*smoothstep(0.015, 0.2, o.x)*smoothstep(2.6, 12., uHole.x - P.x);
  }`;

// ---------------------------------------------------------------------------------------------------------
// SHADOW = ABSENCE OF PICTURE. No depth map: the furniture is a short list of boxes, capsules and ellipsoids
// (uniform arrays, set once), tested along the straight line from the point to the hole. So every shadow is
// razor hard, radial from the hole, and costs no render target and no build stall. The counterpane adds a
// ten-step march along its own fold function. shadowAt returns 1 where the hole is seen, 0 where it is not.
// pw = size of a pixel on the surface in metres (length(fwidth(P))), taken in main().
// ---------------------------------------------------------------------------------------------------------
export const SHADOW_GLSL = /* glsl */`
  uniform vec3 uBoxA[${N_BOX}], uBoxB[${N_BOX}], uCapB[${N_CAP}], uEllC[${N_ELL}], uEllR[${N_ELL}];
  uniform vec4 uCapA[${N_CAP}], uFold, uBed, uLens;
  uniform vec3 uMothF, uMothN;
  // the moth as the hole sees it laid flat: one rounded wing either side of a short body (q in the moth's own units:
  // x across the span, y toward the nose; the wings reach 2.45 from the middle, as the moth's own do)
  float mothSil(vec2 q){
    q.x = abs(q.x);
    vec2 p = q - vec2(1.22, -0.12);
    p = vec2(p.x*0.94 - p.y*0.34, p.x*0.34 + p.y*0.94)/vec2(1.32, 0.98);       // one rounded wing a side, swept back a little
    vec2 pa = q - vec2(0., 0.95), ba = vec2(0., -2.);
    return min((length(p) - 1.)*0.98, length(pa - ba*clamp(dot(pa, ba)/4., 0., 1.)) - 0.27);
  }
  // the counterpane: soft ridges running across the beam (along Z), wandering, with small wrinkles on top
  float foldH(vec2 p){
    float u = p.x + 3.5*sin(p.y*0.047 + uFold.x) + 1.8*sin(p.y*0.118 + p.x*0.021 + uFold.y);
    float r = 0.5 + 0.5*sin(u*0.5 + 0.5*sin(u*0.083 + uFold.z));
    float amp = 0.88 + 0.12*sin(p.y*0.06 + p.x*0.033 + uFold.x*1.7);
    float h = 2.1*r*r*sqrt(r)*amp + 0.03*sin(u*1.3 + p.y*0.31 + uFold.y*2.) + 0.02*sin(p.y*0.6 - u*0.5 + uFold.z*3.);
    float edge = min(min(p.x - uBed.x, uBed.y - p.x), min(p.y - uBed.z, uBed.w - p.y));
    return 43.4 + uFold.w*h*(0.3 + 0.7*smoothstep(0., 7., edge));
  }
  float shadowBC(vec3 P, vec3 N, float pw){
    vec3 ro = P + N*0.08, rd = uHole - ro; float tm = length(rd); rd /= max(tm, 1e-3);
    vec3 ird = vec3(rd.x < 0. ? -1. : 1., rd.y < 0. ? -1. : 1., rd.z < 0. ? -1. : 1.)/max(abs(rd), 1e-5);
    float lit = 1., e0 = pw*1.2 + 0.015;
    for (int i = 0; i < ${N_BOX}; i++){
      vec3 t0 = (uBoxA[i] - ro)*ird, t1 = (uBoxB[i] - ro)*ird, mn = min(t0, t1), mx = max(t0, t1);
      float tn = max(max(mn.x, mn.y), max(mn.z, 0.)), tf = min(min(mx.x, mx.y), min(mx.z, tm));
      lit *= 1. - smoothstep(0., e0*4., tf - tn);
    }
    vec3 d1 = rd*tm; float aa = tm*tm;
    for (int i = 0; i < ${N_CAP}; i++){
      vec3 A = uCapA[i].xyz, d2 = uCapB[i] - A, r = ro - A;
      float ee = max(dot(d2, d2), 1e-4), f = dot(d2, r), c = dot(d1, r), b = dot(d1, d2), den = aa*ee - b*b;
      float s = den > 1e-5 ? clamp((b*f - c*ee)/den, 0., 1.) : 0.;
      float tt = clamp((b*s + f)/ee, 0., 1.);
      s = clamp((b*tt - c)/max(aa, 1e-4), 0., 1.);
      float d = length(r + d1*s - d2*tt);
      lit *= smoothstep(uCapA[i].w - e0, uCapA[i].w + e0, d);
    }
    return lit;
  }
  float shadowAt(vec3 P, vec3 N, float pw){
    vec3 ro = P + N*0.08, rd = uHole - ro; float tm = length(rd); rd /= max(tm, 1e-3);
    float lit = shadowBC(P, N, pw), e0 = pw*1.2 + 0.015;
    for (int i = 0; i < ${N_ELL}; i++){
      vec3 R = max(uEllR[i], vec3(1e-3)), o2 = (ro - uEllC[i])/R, dd = rd/R;
      float A = max(dot(dd, dd), 1e-6), B = dot(o2, dd), tc = -B/A;
      float dn = sqrt(max(dot(o2, o2) - B*B/A, 0.));
      float wn = e0/mix(min(R.x, min(R.y, R.z)), max(R.x, max(R.y, R.z)), 0.4);
      if (i == ${N_ELL - 1}){
        // the last slot is the moth's: not an egg but the moth itself, a flat outline of two wing lobes either side of a
        // short body lying in a plane through uEllC (normal uMothN, nose along uMothF, uEllR.x its scale). Low over the
        // linen the plane is level, so the shadow on the linen is the moth's own outline at its own size, slid down the
        // beam; in the air the plane faces the hole, so on a wall it is the moth magnified. Its edge is as hard as a lake's.
        float den = dot(rd, uMothN); den = abs(den) < 1e-3 ? (den < 0. ? -1e-3 : 1e-3) : den;
        float tp = dot(uEllC[i] - ro, uMothN)/den, sc = max(uEllR[i].x, 1e-3);
        vec3 hm = ro + rd*tp - uEllC[i];
        float dmo = mothSil(vec2(dot(hm, cross(uMothF, uMothN)), dot(hm, uMothF))/sc)*sc;
        lit *= (tp > 0. && tp < tm) ? smoothstep(-e0, e0, dmo) : 1.;
        continue;
      }
      lit *= (tc > 0. && tc < tm) ? smoothstep(1. - wn, 1. + wn, dn) : 1.;
    }
    return lit;
  }
  // the counterpane's own folds, marched toward the hole (P on or near the linen top)
  float foldShadow(vec3 P, float pw){
    vec3 rd = uHole - P; rd /= max(length(rd), 1e-3);
    float m = 1e3, st = 0.7;
    for (int i = 0; i < 10; i++){
      vec3 p = P + rd*st;
      float inb = step(uBed.x, p.x)*step(p.x, uBed.y)*step(uBed.z, p.z)*step(p.z, uBed.w);
      m = min(m, mix(1e3, (p.y - foldH(p.xz))/st, inb));
      st = st*1.42 + 0.35;
    }
    return smoothstep(-0.004 - pw*0.03, 0.012 + pw*0.03, m);
  }`;

// ---------------------------------------------------------------------------------------------------------
// SURFACES. roomLight(P, N, aw, pw) is everything a matte point receives: picture * falloff * soft Lambert *
// shadow, plus the carafe's small upright harbour inside its own shadow. A surface's colour is then
// matteTint(its matte) * roomLight + roomDark (3 percent of the picture's average), through toScene().
// ---------------------------------------------------------------------------------------------------------
export const SURFACE_GLSL = /* glsl */`
  uniform vec4 uTint;      // x: how much a matte tints the picture, y: reflectance floor of a dark matte, z: ambient (0.03), w: glass gain
  uniform vec2 uSlosh;
  vec3 caustic(vec3 P, float aw, float pw){
    vec3 rd = uHole - P; float tm = length(rd); rd /= max(tm, 1e-3);
    vec3 Lc = uLens.xyz - P; float tc = dot(Lc, rd);
    if (tc < 1. || tc > tm) return vec3(0.);
    vec3 c = Lc - rd*tc; float k = length(c)/max(uLens.w, 1e-3);
    if (k > 0.6) return vec3(0.);
    vec2 sd = vec2(-rd.z, rd.x); sd /= max(length(sd), 1e-3);
    float az = -dot(c.xz, sd)/uLens.w*2.3 + uSlosh.x, el = -c.y/uLens.w*0.8 + 0.09 + uSlosh.y;
    vec3 o = vec3(cos(el)*cos(az), sin(el), cos(el)*sin(az));
    return harbour(o, max(pw*3.*2.3/max(uLens.w, 1e-3), 0.012))*(1. - smoothstep(0.4, 0.52, k))*1.6;
  }
  vec3 roomLight(vec3 P, vec3 N, float aw, float pw){
    vec3 o = uHole - P; o /= max(length(o), 1e-3);
    float ndl = dot(N, o), face = smoothstep(-0.02, 0.03, ndl);
    float lam = 0.35 + 0.65*smoothstep(0., 0.55, ndl);
    vec3 L = picture(P, aw)*(picFall(P)*lam*face*shadowAt(P, N, pw));
    return L + caustic(P, aw, pw)*face;
  }
  vec3 matteTint(vec3 m){
    float mx = max(m.r, max(m.g, m.b)), lum = dot(m, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(1.), m/max(mx, 1e-3), uTint.x)*(uTint.y + (1. - uTint.y)*smoothstep(0., 0.7, lum));
  }
  vec3 roomDark(vec3 N){ return mix(uSky*0.9, uSea*0.6, 0.5 + 0.5*N.y)*uTint.z*uGain; }`;

export const STYLE_GLSL = TONE_GLSL + PICTURE_GLSL + SHADOW_GLSL + SURFACE_GLSL;

// one vertex shader for matte and linen: world position, world normal, vertex colour and two free attributes
export const STYLE_VS = /* glsl */`
  attribute vec3 aCol; attribute float aKind, aSway;
  uniform float uTime;
  varying vec3 vWP, vN, vCol; varying float vKind, vSway;
  void main(){
    vec3 p = position; vSway = aSway;
    // aSway > 0: hung cloth (drape, towel) breathing in the draught, more toward its free hem
    p.x += aSway*(0.5*sin(uTime*0.7 + p.z*0.21 + p.y*0.12) + 0.22*sin(uTime*1.6 + p.z*0.6));
    p.z += aSway*0.3*sin(uTime*0.9 + p.x*0.3 + p.y*0.2);
    vec4 w = modelMatrix*vec4(p, 1.);
    vWP = w.xyz; vN = normalize(mat3(modelMatrix)*normal + vec3(0., 1e-6, 0.)); vCol = aCol; vKind = aKind;
    gl_Position = projectionMatrix*viewMatrix*w;
  }`;

// MATTE: walls, boards, furniture. Vertex colour = the matte (display-linear, straight from THREE.Color);
// aKind: 0 plain, 1 floorboards (7 m boards, dark gaps along Z), 2 wallpaper (sprig repeat, matte on matte),
// 3 marble (veins), 4 black iron (takes about half of the picture, and on the side facing the hole a hard-edged cap of
// it bent over the turning: a strip of sky, sea line and sail on a knob, a line of colour down a rail), 5 wood furniture
// (breakup along the grain).
// THE SPRIG PAPER'S TWO VALUES: [ground, figure], each the share of the picture that the paper throws back there (k below).
// The figure is the sprig printed on the paper in the wall's own metres. (Until round 12 the sprig room had 0.9 and 1.03:
// a figure 5 luma steps over its ground, which nobody saw.) The stripe room keeps its own typed line below; the whitewash
// room has no figure and reads neither.
const PAPER = { sprig: [0.9, 0.53] };
const glf = (v) => v.toFixed(4);
const MATTE_FS = /* glsl */`
  ${STYLE_GLSL}
  varying vec3 vWP, vN, vCol; varying float vKind;
  const float SPRIG_GROUND = ${glf(PAPER.sprig[0])}, SPRIG_FIGURE = ${glf(PAPER.sprig[1])};
  float h1(float n){ return fract(sin(n*127.1)*43758.5453); }
  float tl(float pw, float s){ return clamp(log2(max(pw*s*256., 1e-3)), 0., 7.); }
  void main(){
    vec3 P = vWP, N = normalize(vN + vec3(0., 1e-5, 0.));
    if (!gl_FrontFacing) N = -N;
    float aw = picFoot(P), pw = length(fwidth(P));
    vec3 oi = uHole - P; oi /= max(length(oi), 1e-3);
    float ndi = dot(N, oi), ew = clamp(fwidth(ndi), 0.012, 0.3);       // (derivative taken here, outside every branch)
    vec3 m = vCol; float k = 1.;
    if (vKind > 0.5 && vKind < 1.5){               // floorboards
      float bx = P.x/7., id = floor(bx), fx = abs(fract(bx) - 0.5)*7.;       // metres from the board's centre line
      float gw = max(pw*0.8, 0.03), gap = smoothstep(3.5 - 0.16 - gw, 3.5 - 0.16 + gw, fx)*min(1., 0.16/max(pw, 0.16));
      float jz = P.z/34. + h1(id)*7.; float jd = abs(fract(jz) - 0.5)*34.;
      gap = max(gap, (1. - smoothstep(0.07, 0.07 + gw, jd))*min(1., 0.14/max(pw, 0.14)));
      float grain = textureLod(tCloud, vec2(P.x*0.11 + h1(id)*3., P.z*0.006 + h1(id + 9.)), tl(pw, 0.11)).g;
      float fine = textureLod(tCloud, vec2(P.x*0.9, P.z*0.03 + h1(id)*5.), tl(pw, 0.9)).r;
      k = (0.93 + 0.08*h1(id + 3.))*(0.9 + 0.2*grain)*(0.93 + 0.14*fine*(1. - smoothstep(0.05, 0.3, pw)));
      k *= 1. - 0.6*gap;
    } else if (vKind > 1.5 && vKind < 2.5){        // wallpaper: a sprig of three leaves on a half-drop repeat
      vec2 uv = vec2(abs(N.x) > 0.5 ? P.z : P.x, P.y);
      vec2 g = uv/vec2(9., 12.); float col = floor(g.x); g.y += 0.5*mod(col, 2.);
      vec2 q = (fract(g) - 0.5)*vec2(9., 12.); q.x *= mod(floor(g.y) + col, 2.) < 0.5 ? 1. : -1.;
      float w = max(pw, 0.02);
      float d = segD(q, vec2(-0.6, -3.2), vec2(0.5, 2.4)) - 0.11;
      vec2 l1 = q - vec2(1.5, 1.6), l2 = q - vec2(-1.5, 0.2), l3 = q - vec2(0.9, 3.4);
      d = min(d, length(vec2(l1.x*0.8 - l1.y*0.6, (l1.x*0.6 + l1.y*0.8)*2.3)) - 1.35);
      d = min(d, length(vec2(l2.x*0.8 + l2.y*0.6, (-l2.x*0.6 + l2.y*0.8)*2.3)) - 1.25);
      d = min(d, length(vec2(l3.x*0.3 - l3.y*0.95, (l3.x*0.95 + l3.y*0.3)*2.4)) - 1.1);
      float sprig = (1. - smoothstep(-w, w, d))*(1. - smoothstep(1.5, 4., pw));
      float stripe = 0.5 + 0.5*sin(uv.x*6.2832/1.5); stripe *= 1. - smoothstep(0.2, 0.5, pw);
      float nzp = textureLod(tCloud, uv*0.013, tl(pw, 0.013)).r - 0.5;
      k = SPRIG_GROUND + (SPRIG_FIGURE - SPRIG_GROUND)*sprig + 0.06*nzp + 0.*stripe;
      if (uVar.w > 0.5 && uVar.w < 1.5){            // sage stripe: broad and narrow bands, matte on matte
        float sx = abs(fract(uv.x/9.) - 0.5)*9., sw = max(pw, 0.03);
        float broad = smoothstep(1.4 - sw, 1.4 + sw, sx)*(1. - smoothstep(3.1 - sw, 3.1 + sw, sx));
        float pin = (1. - smoothstep(0.12, 0.12 + sw, abs(sx - 0.7)))*(1. - smoothstep(0.3, 0.9, pw));
        k = 0.92 + 0.07*broad + 0.04*pin + 0.05*nzp;
      } else if (uVar.w > 1.5){                     // bare whitewash: brush strokes and a little damp
        float br = textureLod(tCloud, vec2(uv.x*0.21, uv.y*0.012), tl(pw, 0.21)).g;
        k = 0.9 + 0.12*(br - 0.5)*(1. - smoothstep(0.3, 1.2, pw)) + 0.16*nzp;
      }
    } else if (vKind > 2.5 && vKind < 3.5){        // marble
      float n1 = textureLod(tCloud, P.xz*0.021 + P.y*0.013, tl(pw, 0.021)).r, n2 = textureLod(tCloud, P.zx*0.05 + 0.3 + P.y*0.02, tl(pw, 0.05)).g;
      float vein = 1. - smoothstep(0.012, 0.05 + pw*0.02, abs(n1 + 0.25*n2 - 0.62));
      k = 0.9 + 0.16*n2 - 0.33*vein;
    } else if (vKind > 3.5 && vKind < 5.5){        // turned iron and wood: breakup along the length
      k = (0.85 + 0.3*textureLod(tCloud, vec2(P.y*0.05 + P.x*0.03, P.z*0.04), tl(pw, 0.05)).g)*(vKind > 4.5 ? mix(0.5, 1., smoothstep(0.015, 0.021, dot(vCol, vec3(0.2126, 0.7152, 0.0722)))) : 0.56);      // (a wood given a matte darker than the room's umber is dark-stained: half as bright, like the world's bentwood chair; every wood of the part itself is umber or lighter and is unchanged)
    }
    vec3 RL = roomLight(P, N, aw, pw);
    if (vKind > 5.5){
      // glazed white china (ewer, basin): the picture lies on it calm and filtered (no stripe of a stretched sail), a
      // thin rim of it runs round every edge turned from the hole, the hole itself glints on the shoulder, and the dark
      // side holds the room's own blue-black instead of nothing
      vec3 Vv = cameraPosition - P; Vv /= max(length(Vv), 1e-3);
      vec3 o = uHole - P; o /= max(length(o), 1e-3);
      float ndl = dot(N, o), sh = shadowBC(P, N, pw), fr = 1. - abs(dot(N, Vv)); fr *= fr*fr;
      vec3 pic = picture(P, max(aw, 0.05))*picFall(P);
      RL = pic*((0.35 + 0.65*smoothstep(0., 0.55, ndl))*smoothstep(-0.02, 0.03, ndl)*sh);
      RL += pic*sh*(1.1*fr*smoothstep(-0.75, 0.1, ndl) + 0.3*smoothstep(-0.3, 0.02, ndl)*(1. - smoothstep(0.02, 0.3, ndl)));
      RL += uPale*(0.9*smoothstep(0.988, 0.998, dot(reflect(-Vv, N), o))*sh*uGain);
      RL += mix(uSky, uSea, 0.5 + 0.5*N.y)*(uGain*(0.05 + 0.07*fr));
    }
    // what the lit room throws back (the picture again, at second hand): the bed-head wall is the screen and the
    // brightest thing in the room, the sky lies on the floor, the sea on the far wall. It gives furniture its form on
    // the side turned from the hole (iron, wood and marble take the most), and iron a small glint of the hole itself
    float furn = step(2.5, vKind)*step(vKind, 5.5), nearWall = smoothstep(118., 123., P.x);
    vec3 back = (mix(uSea, uPale, 0.3)*(max(-N.x, 0.)*1.3) + mix(uSky, uSea, 0.45)*(max(N.z, 0.)*1.1) + uSky*(max(-N.y, 0.)*1.0) + mix(uSky, uSea, 0.5)*(0.3 + 0.3*max(N.x, 0.)))*(uTint.z*uGain);
    RL += back*mix(0.35, mix(2.6, 1.1, nearWall), furn)*(vKind > 3.5 && vKind < 4.5 ? 0.55 : 1.);      // iron stays near black on the side turned from the hole
    if (vKind > 3.5 && vKind < 4.5){
      // black iron is polished where hands have turned it: the side that faces the hole carries a hard-edged cap of the
      // picture, bent over the turning (a strip of sky, sea line and sail on a knob, one crisp line of colour down a rail
      // or a spindle), and the rest is black but for a thin rim of what the room throws back
      vec3 Vi = cameraPosition - P; Vi /= max(length(Vi), 1e-3);
      float fr = 1. - abs(dot(N, Vi));
      float cap = smoothstep(0.5 - ew, 0.5 + ew, ndi)*(1. - smoothstep(0.5, 1.4, ew*3.));
      vec3 bent = picture(P + N*13., max(aw, 0.012))*(picFall(P)*shadowAt(P, N, pw));
      float gl = max(dot(reflect(-Vi, N), oi), 0.); gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl;
      RL = RL*(1. - 0.6*cap) + (bent*(1.7*cap) + uPale*(1.2*gl*step(0., ndi)*uGain) + back*(1.6*fr*fr))/max(k, 0.2);
    }
    vec3 D = matteTint(m)*k*(RL + roomDark(N));
    gl_FragColor = vec4(toScene(D), 1.);
  }`;
export function matteMaterial(style, opts = {}) {
  return new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: STYLE_VS, fragmentShader: MATTE_FS, side: opts.side ?? THREE.FrontSide, fog: false });
}

// LINEN: the counterpane, pillows, towel, drape. aKind 1 = the counterpane's top (normal and self-shadow from
// foldH, woven ribs across the beam that carry the picture along in small steps); aKind 0 = any other white
// cloth (geometry normal); aKind 2 = thin paper lit on both faces (honesty pods, moth wings). aSway > 0 makes hung cloth breathe (see STYLE_VS), which ripples what falls on it.
const LINEN_FS = /* glsl */`
  ${STYLE_GLSL}
  varying vec3 vWP, vN, vCol; varying float vKind, vSway;
  void main(){
    vec3 P = vWP, N = normalize(vN + vec3(0., 1e-5, 0.));
    if (!gl_FrontFacing) N = -N;
    float aw = picFoot(P), pw = length(fwidth(P));
    vec3 Pq = P; float fs = 1., rib = 0., weave = 1., fthn = fwidth(vCol.x);
    if (vKind > 0.5 && vKind < 1.5){
      const float E = 0.2;
      float h0 = foldH(P.xz), hx = foldH(P.xz + vec2(E, 0.)), hz = foldH(P.xz + vec2(0., E));
      N = normalize(vec3(h0 - hx, E, h0 - hz));
      // ribs 1.3 m apart running along Z; each rib shows the picture of its own crest, so sails move in steps
      const float RW = 1.3;
      float keep = 1. - smoothstep(0.22, 0.45, pw/RW);
      float rx = P.x/RW, rf = fract(rx) - 0.5;
      Pq.x = mix(P.x, (floor(rx) + 0.5)*RW, 0.55*keep);
      rib = cos(rf*6.2832)*keep;
      fs = foldShadow(vec3(P.x, h0 + 0.03, P.z), pw);
    } else {
      // plain cloth: a faint thread so it does not read as plaster
      weave = 0.96 + 0.04*sin(P.y*9.)*(1. - smoothstep(0.08, 0.25, pw));
      // ribs 1.3 m apart, as on the counterpane's top; never on hung cloth (the drape, the towel: aSway > 0), where a level
      // band crossed with the pleats makes bricks: muslin hangs in long unbroken strips, torn only by its folds
      float hung = step(0.004, vSway);
      weave = mix(weave, 1., hung*smoothstep(0.03, 0.12, pw));         // (and its thread is seen only within a few metres)
      weave *= mix(0.86 + 0.14*cos(P.y*4.833)*(1. - smoothstep(0.25, 0.6, pw)), 0.93, hung);
    }
    vec3 o = uHole - P; o /= max(length(o), 1e-3);
    float ndl = dot(N, o);
    if (vKind > 1.5) ndl = abs(ndl)*0.6 + 0.4;       // thin paper (seed pods, moth wings): takes the picture on both faces
    // (the law of the light holds for hung cloth too: a pleat of the drape or a face of the towel that is turned from the
    // hole is unlit, and keeps only the cool fill the lit room throws back)
    float face = smoothstep(-0.015, 0.035, ndl), lam = 0.3 + 0.7*smoothstep(0., 0.4, ndl);
    // muslin is a scrim: what falls on it is a little soft, and one pleat is only a little dimmer than the next, so a hull's
    // hard bands crossing the slanting pleats are a rippled picture and never a staircase of black and white blocks
    if (vKind < 0.5 && vSway > 0.004){ aw = max(aw, 0.016); lam = 0.7 + 0.3*lam; }
    if (vKind > 0.5 && vKind < 1.5) lam = 0.5 + 0.5*smoothstep(0.02, 0.36, ndl);      // the counterpane lies nearly edge-on to the beam: its level ground is still a white country
    vec3 L = picture(Pq, aw)*(picFall(P)*lam*face*fs*shadowAt(P, N, pw)*(1. + 0.1*rib - 0.07*rib*rib)*weave);
    // white cloth turned from the hole still takes what the lit room throws back: the far wall (the screen), the sky
    // on the floor, the sea on the bed-head wall; so a hang in shadow shows its folds, ribs and hem, faintly
    vec3 back = (mix(uSky, uSea, 0.45)*(max(N.z, 0.)*1.5) + uSky*(max(-N.y, 0.)*0.9) + mix(uSea, uPale, 0.3)*(max(-N.x, 0.)*1.1) + mix(uSky, uSea, 0.5)*(max(N.x, 0.)*0.25))*(uTint.z*uGain*weave*4.5);
    if (vKind > 1.5) back = picture(P, 0.06)*0.1 + roomDark(N)*2.;                    // a seed pod is translucent: it never goes quite out
    else if (vKind > 0.5) back *= 0.1;                                                // the counterpane's top: a hollow behind a ridge is a shadow, and a shadow is black (a hard black lake, no fill)
    vec3 tint = matteTint(vCol);
    if (vKind > 2.5){
      // the moth. vCol = (angle across the wing's fan 0..1, root 0 .. rim 1, part). Pale and translucent: the colour of
      // its ray glows through it, taken wide so that a mast's bar or a hull never puts a wing out
      float thn = vCol.x, rr = vCol.y, part = vCol.z, ghost = step(3.5, part); part -= 4.*ghost;
      vec3 cream = vec3(0.97, 0.93, 0.84); float cov = 1.;
      vec3 Vv = cameraPosition - P; Vv /= max(length(Vv), 1e-3);
      if (part < 1.5){
        float nv = part < 0.5 ? 9. : 7., fv = fthn*nv;
        float vein = (1. - smoothstep(0.07, 0.07 + fv, abs(fract(thn*nv) - 0.5)))*smoothstep(0.1, 0.3, rr)*(1. - smoothstep(0.2, 0.5, fv));
        float margin = smoothstep(0.78, 0.92, rr), bar = smoothstep(0.5, 0.56, rr)*(1. - smoothstep(0.62, 0.7, rr));
        tint = cream*(1. - 0.45*vein)*(1. - 0.34*margin)*(1. - 0.14*bar)*(1. - 0.3*(1. - smoothstep(0.02, 0.06, thn)))*(part > 0.5 ? 0.9 : 1.)*(0.62 + 0.38*smoothstep(0., 0.35, rr));
        float comb = abs(fract(thn*(ghost > 0.5 ? 13. : 30.)) - 0.5)*2.;          // 0 on a streak's centre line .. 1 between streaks
        // the lagging copies are the blur of the beat: a short uneven fringe at the rim (each feather its own length, a sixth
        // of the wing at most, one in five missing), never a row of spikes standing past the wing
        float fid = floor(thn*13.) + part*17., fh1 = fract(sin(fid*12.9898 + 4.1)*43758.5453), fh2 = fract(sin(fid*78.233 + 1.7)*43758.5453);
        cov = ghost > 0.5 ? step(comb, 0.45 + 0.3*fh2)*step(0.84 + 0.13*fh1, rr)*step(fh2, 0.8) : step(comb, 1.6 - 1.3*smoothstep(0.9, 1., rr));
      } else {
        float fr = 1. - abs(dot(N, Vv));
        float fur = textureLod(tCloud, vec2(thn*0.9, atan(N.y, abs(N.x) + 1e-3)*0.6), 1.).g;
        tint = cream*vec3(0.78, 0.72, 0.64)*(0.7 + 0.5*fur)*(1. + 0.7*fr*fr);
      }
      if (cov < 0.5) discard;
      tint *= 1. - 0.2*ghost;
      // thin paper in the beam: the wing takes the colour of its own ray (sail-tan while a sail's ray is on it, cobalt when
      // the sail has slid off, sea green above the axis) at the gain of cloud and sail, taken a little wide so that a mast's
      // bar never puts a wing out; so it is a step paler than a wall or a sheet lit by the same ray, by gain and not by white
      vec3 glow = picture(P, 0.045)*picFall(P);
      L = glow*1.55;
      back = mix(uSky, uPale, 0.5)*(0.09*uGain) + roomDark(N)*2.;
    }
    vec3 D = tint*(L + roomDark(N) + back);
    gl_FragColor = vec4(toScene(D), 1.);
  }`;
export function linenMaterial(style, opts = {}) {
  return new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: STYLE_VS, fragmentShader: LINEN_FS, side: opts.side ?? THREE.DoubleSide, fog: false });
}

// GLASS: the carafe's ball of water and the drops. Glass turns the picture over again, so each holds the whole
// bay the right way up: a fisheye of harbour() addressed by the surface normal as the eye sees it (top of the
// ball = sky), written 3 times brighter than anything matte, which is the only thing that blooms. aKind 1 =
// water (opaque lens), 0 = thin empty glass (neck, tumbler: nearly clear, a rim line only).
const GLASS_VS = /* glsl */`
  attribute float aKind;
  varying vec3 vWP, vN; varying float vKind;
  void main(){
    vec4 w = modelMatrix*vec4(position, 1.);
    vWP = w.xyz; vN = normalize(mat3(modelMatrix)*normal + vec3(0., 1e-6, 0.)); vKind = aKind;
    gl_Position = projectionMatrix*viewMatrix*w;
  }`;
const GLASS_FS = /* glsl */`
  ${STYLE_GLSL}
  varying vec3 vWP, vN; varying float vKind;
  void main(){
    vec3 P = vWP, N = normalize(vN + vec3(0., 1e-5, 0.));
    vec3 V = cameraPosition - P; float vd = length(V); V /= max(vd, 1e-3);
    if (dot(N, V) < 0.) N = -N;
    float aw = picFoot(P)*3., gw = clamp(length(fwidth(N))*0.9, 0.006, 0.05);
    vec3 nv = N - V*dot(N, V);                       // what of the normal lies across the view: 0 at the centre, 1 at the rim
    vec2 rt = vec2(V.z, -V.x); rt /= max(length(rt), 1e-3);     // screen right, level
    float kx = dot(nv.xz, rt), ky = nv.y, k = length(nv);
    float hv = max(length(V.xz), 1e-3);
    float turn = 0.5*(V.z/hv*(-0.8569) - V.x/hv*0.5155);                 // the small bay turns as we go round it: 0.5*sin(bearing - 2.6), so the fleet is in the ball at the close pass
    // level horizon across the middle; the town and the sails just above it; the top of the ball looks high into the clouds
    float kp = max(ky, 0.);
    float az = kx*0.95 + turn - 0.3 + uSlosh.x + uSlosh.y*ky*2., el = 0.03 + ky*0.3 + 0.6*kp*kp + uSlosh.y*kx*1.2;
    vec3 o = vec3(cos(el)*cos(az), sin(el), cos(el)*sin(az));
    vec3 lit = picture(P, aw)*picFall(P);            // the ray that reaches this glass, for the rim
    float f = 1. - abs(dot(N, V));
    float rim = smoothstep(0.72, 0.9, f);
    if (vKind > 0.5){
      vec3 img = harbour(o, gw)*(1. - smoothstep(0.86, 0.985, k));
      vec3 c = toScene(min(img*0.6, vec3(0.8)))*uTint.w + toScene(lit*0.6)*rim*1.5;
      gl_FragColor = vec4(c, 1.);
    } else {
      float line = smoothstep(0.55, 0.92, f);
      gl_FragColor = vec4(toScene(lit*0.75)*(0.45 + 1.5*line), 0.24 + 0.7*line);
    }
  }`;
export function glassMaterial(style) {
  return new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: GLASS_VS, fragmentShader: GLASS_FS, transparent: true, depthWrite: true, side: THREE.DoubleSide, fog: false });
}

// ---------------------------------------------------------------------------------------------------------
// makeStyle(ctx, opts): the style object for one room. Builds the two small textures, fills the shared
// uniforms from the palette and the seed, and owns the picture's clock.
//   style.uniforms            shared uniform object (pass to your own ShaderMaterials together with STYLE_GLSL)
//   style.update(dt, time)    advance the picture (clouds, swell, fleet, cloud-over-sun dimming, slosh)
//   style.setExposure(e)      tell the tone inverse the world's post.exposure
//   style.setNearSail(k)      0..1 the rare near sail (ease it yourself from u)
//   style.addBox(min,max) / addCapsule(a,b,r) / addEllipsoid(c,radii)   register furniture that blocks the picture
//   style.pal                 { umber, plum, slate, linen, cobalt, sea, tan } THREE.Colors (display-linear)
// ---------------------------------------------------------------------------------------------------------
export async function makeStyle(ctx, opts = {}) {
  const rng = ctx.rng, P = (opts.palette || DEFAULT_PALETTE).map(lin);
  const pal = { umber: P[0], plum: P[1], slate: P[2], linen: P[3], cobalt: P[4], sea: P[5], tan: P[6] };
  const U = makeUniforms();
  U.uTint = { value: new THREE.Vector4(0.34, 0.8, 0.03, 1.7) };
  // ---- hour of the day: the three harbour colours, chosen once
  const hour = opts.hour || (rng() < 0.64 ? 'morning' : rng.pick(['dawn', 'evening', 'night']));
  const rust = pal.tan.clone().lerp(new THREE.Color('#7A2E12'), 0.55);
  const H = {
    morning: { sky: pal.cobalt, sea: pal.sea, a: pal.tan, b: rust, pale: new THREE.Color(1, 1, 1), gain: 1 },
    dawn: { sky: new THREE.Color('#C9808C'), sea: new THREE.Color('#6F8088'), a: new THREE.Color('#3A2A2A'), b: new THREE.Color('#1E1618'), pale: new THREE.Color('#FFE3D2'), gain: 0.9 },
    evening: { sky: new THREE.Color('#E3A24A'), sea: new THREE.Color('#5A4690'), a: new THREE.Color('#A8431A'), b: new THREE.Color('#6A2410'), pale: new THREE.Color('#FFE9C8'), gain: 0.95 },
    night: { sky: new THREE.Color('#27407A'), sea: new THREE.Color('#2C5A6A'), a: new THREE.Color('#566A8A'), b: new THREE.Color('#2A3550'), pale: new THREE.Color('#C6D6F0'), gain: 0.6 },
  }[hour];
  U.uSky.value.copy(v3c(H.sky)); U.uSea.value.copy(v3c(H.sea)); U.uSailA.value.copy(v3c(H.a)); U.uSailB.value.copy(v3c(H.b)); U.uPale.value.copy(v3c(H.pale));
  U.uNight.value = hour === 'night' ? 1 : 0;
  // ---- the fleet, the gulls, the moored masts
  const drift = rng.range(0.2, 0.45) * (rng() < 0.5 ? -1 : 1), n = N_LUG;
  for (let i = 0; i < n; i++) U.uLug.value[i].set(i % 3 === 2 ? rng.range(-1.3, 1.0) : rng.range(-0.8, 0.1), (i + rng.range(-0.3, 0.3)) / n, drift * rng.range(0.6, 1.3), rng() < 0.6 ? rng.range(0, 0.35) : rng.range(0.6, 1));
  U.uLug.value[0].set(0.5, -1, 1, 0.08);          // boat 0: moored, sails drying, on the back wall straight ahead of the first frame
  U.uLug.value[1].set(-0.5, -2, 1, 0.72);         // boat 1: the turn boat, at arm's length on the wall by the climbing turn
  U.uLug.value[2].set(-0.85, -3, 1, 0.3);         // boat 2: the same, smaller, on the far wall where the turn begins
  U.uLane.value.set(1 / 27, (U.uLug.value[3].y * 7.3) % 1, 6, (U.uLug.value[3].y * 7.3) % 1);        // boat 0: moored on the entry axis (far wall straight ahead of the first frame), sails drying
  U.uLugN.value = Math.max(6, Math.round(N_LUG * (opts.density ?? 1)));
  for (let i = 0; i < N_GULL; i++) U.uGull.value[i].set(rng.range(-1.2, 0.9), rng.range(-0.12, 0.42), rng.range(0.08, 0.3), rng.range(0, 60));
  U.uGullN.value = Math.max(8, Math.round(N_GULL * (opts.density ?? 1)));
  const mz = [-1.15, -0.18, 9, 0.86, 9];       // three thin bars (two slots unused): one on the far wall, one down the bed, one by the window; none across the washstand (azimuth 0.1 to 0.27) or the moored boat (0.3 to 0.75)
  for (let i = 0; i < N_MAST; i++) U.uMast.value[i].set(mz[i] + rng.range(-0.12, 0.12) * (i === 2 ? 0.5 : 1) * (i === 1 || i === 3 ? 0.4 : 1), rng.range(0.5, 1.0), rng.range(0.011, 0.018) * 0.42, rng.range(0, 6.28));
  U.uSteam.value.set(rng.range(-0.6, 1.2), rng.range(0.006, 0.011) * (rng() < 0.5 ? -1 : 1), 1, 1);
  U.uFold.value.set(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0.85, 1.1));
  U.uWind.value.set(-3 / 72 * 0.46 * rng.range(0.85, 1.15), rng.range(-0.006, 0.006), rng.range(0.8, 1.2), 1 / rng.range(40, 50));
  const dimEvery = rng.range(21, 29), dimAt = rng.range(6, 12);
  await ctx.yield();
  // ---- cloud noise: tileable value-noise fbm, two different fields in R and G
  const S = 256, data = new Uint8Array(S * S * 4);
  for (let ch = 0; ch < 2; ch++) {
    const acc = new Float32Array(S * S); let amp = 0.5, tot = 0;
    for (let oc = 0, cells = ch ? 6 : 4; oc < 5; oc++, cells *= 2, amp *= 0.52) {
      const lat = new Float32Array(cells * cells); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      const sc = cells / S; tot += amp;
      for (let y = 0; y < S; y++) {
        const fy = y * sc, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), r0 = (y0 % cells) * cells, r1 = ((y0 + 1) % cells) * cells;
        for (let x = 0; x < S; x++) {
          const fx = x * sc, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), c0 = x0 % cells, c1 = (x0 + 1) % cells;
          acc[y * S + x] += amp * (lerp(lerp(lat[r0 + c0], lat[r0 + c1], sx), lerp(lat[r1 + c0], lat[r1 + c1], sx), sy));
        }
      }
      await ctx.yield();
    }
    for (let i = 0; i < S * S; i++) data[i * 4 + ch] = clamp(((acc[i] / tot - 0.5) * 1.9 + 0.5) * 255, 0, 255);
  }
  const tCloud = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  tCloud.wrapS = tCloud.wrapT = THREE.RepeatWrapping; tCloud.minFilter = THREE.LinearMipmapLinearFilter; tCloud.magFilter = THREE.LinearFilter;
  tCloud.generateMipmaps = true; tCloud.needsUpdate = true; U.tCloud.value = tCloud;
  await ctx.yield();
  U.tTown.value = await makeTownStrip(ctx);
  await ctx.yield();
  const cnt = { box: 0, cap: 0, ell: 0 };
  const style = {
    uniforms: U, pal, hour,
    setExposure(e) { U.uExpK.value = 0.6 / Math.max(e, 0.05); },
    setNearSail(k) { U.uNear.value = clamp(k, 0, 1); },
    addBox(a, b) { if (cnt.box >= N_BOX) return false; U.uBoxA.value[cnt.box].copy(a); U.uBoxB.value[cnt.box++].copy(b); return true; },
    addCapsule(a, b, r) { if (cnt.cap >= N_CAP) return false; U.uCapA.value[cnt.cap].set(a.x, a.y, a.z, r); U.uCapB.value[cnt.cap++].copy(b); return true; },
    addEllipsoid(c, r) { if (cnt.ell >= N_ELL) return false; U.uEllC.value[cnt.ell].copy(c); U.uEllR.value[cnt.ell++].copy(r); return true; },
    update(dt, time) {
      U.uTime.value = time;
      // a cloud covers the harbour's sun: two seconds down, a few held, two seconds back (never a flash)
      const tm = ((time + dimAt) % dimEvery + dimEvery) % dimEvery;
      const d = smoothstep(0, 2.2, tm) * (1 - smoothstep(5.5, 7.7, tm));
      U.uGain.value = H.gain * (1 - 0.3 * d); U.uCool.value = d * 0.6;
      // the water in the carafe is still swinging slightly, so its small harbour rocks
      U.uSlosh.value.set(0.07 * Math.sin(time * 1.25) + 0.03 * Math.sin(time * 2.1 + 1), 0.035 * Math.sin(time * 1.25 + 1.3));
    },
    dispose() { tCloud.dispose(); U.tTown.value.dispose(); },
  };
  style.setExposure(opts.exposure ?? 1);
  return style;
}

// the far shore as a strip of data (R white wall, G roof, B ochre wall, A land): headland with pines to the
// left, the town climbing in the middle, the breakwater and its light to the right. Row 12 is the waterline.
async function makeTownStrip(ctx) {
  const rng = ctx.rng, F = 2, W = 2048 * F, Hh = 128 * F, Y0 = 12 * F, d = new Uint8Array(W * Hh * 4);
  const ph = [rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)];
  const hill = new Float32Array(W), tri = (v) => Math.abs((((v % 2) + 2) % 2) - 1);
  for (let x = 0; x < W; x++) {
    const az = (x / W - 0.5) * 3.2, xs = x / F;
    const town = smoothstep(-0.75, -0.2, az) * (1 - smoothstep(0.45, 0.9, az));
    const head = 1 - smoothstep(-0.9, -0.35, az);
    let h = 30 + 16 * Math.sin(az * 2.1 + ph[0]) + 9 * Math.sin(az * 5.3 + ph[1]) + 4 * Math.sin(az * 13 + ph[2]);
    h = h * (0.55 + 0.5 * head) + 62 * town * (0.75 + 0.25 * Math.sin(az * 3.1 + ph[3]));
    h *= 1 - smoothstep(0.7, 0.95, az) * 0.94;                       // down to the breakwater
    if (az > 0.95) h = (az < 1.36 && Math.abs(az - 1.12) > 0.03) ? 6 : 0;
    // pines: pointed crowns of three sizes, each with a slight shoulder, not a sawtooth
    const c1 = tri(xs * 0.19 + Math.sin(xs * 0.05) * 2), c2 = tri(xs * 0.071 + 0.4), c3 = tri(xs * 0.43 + Math.sin(xs * 0.11));
    const jag = head * (1 - town) * (c1 * c1 * 10 + c2 * (0.4 + 0.6 * c2) * 6 + c3 * 2.5);
    hill[x] = Math.min(Hh - Y0 - 2 * F, Math.max(0, (h + jag) * F));
    for (let y = Y0; y < Y0 + hill[x]; y++) { const i = (y * W + x) * 4; d[i + 3] = 255; if (az > 0.95) d[i] = 120; }
    if (x % 512 === 511) await ctx.yield();
  }
  await ctx.yield();
  const rect = (x0, y0, w, h, r, g, b) => { for (let y = Math.max(0, y0); y < Math.min(Hh, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) { const i = (y * W + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } };
  const roofRow = (x0, x1, y) => { if (y < 0 || y >= Hh) return; for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x1)); x++) { const cov = clamp(Math.min(x + 1, x1) - Math.max(x, x0), 0, 1), i = (y * W + x) * 4; d[i] = d[i] * (1 - cov); d[i + 1] = Math.max(d[i + 1], 235 * cov); d[i + 2] = d[i + 2] * (1 - cov); d[i + 3] = Math.max(d[i + 3], 255 * cov); } };
  const houses = [];
  for (let k = 0; k < 190; k++) {
    const az = rng.range(-0.62, 0.78), x = Math.round((az / 3.2 + 0.5) * W), top = hill[clamp(x, 0, W - 1)] / F;
    const t = rng() ** 1.4; houses.push({ x, y: Y0 + F + Math.round(t * Math.max(0, top - 22) * F), w: rng.int(11, 26) * F, h: rng.int(7, 15) * F, ochre: rng() < 0.32, tall: rng() < 0.04 });
  }
  houses.sort((a, b) => b.y - a.y);
  let n = 0;
  for (const h of houses) {
    const hh = h.tall ? h.h + 16 * F : h.h, w = h.tall ? 8 * F : h.w, v = 215 + ((h.x * 7) % 40);
    rect(h.x, h.y, w, hh, h.ochre ? 40 : v, 0, h.ochre ? 235 : 0);
    // the roof: pitched, its sloping edges written with fractional cover so they come back straight when magnified
    const rh = h.tall ? 9 * F : (3 + (h.w >> 4)) * F;
    for (let r = 0; r < rh; r++) { const inset = h.tall ? r * 0.45 : Math.min(r * 1.5, (w + 4) / 2 - 0.75); roofRow(h.x - 2 + inset, h.x + w + 2 - inset, h.y + hh + r); }
    if (!h.tall) rect(h.x + (w >> 1) - 2, h.y, 4, 6, 20, 60, 0);
    if (++n % 40 === 0) await ctx.yield();
  }
  rect(Math.round((-0.62 / 3.2 + 0.5) * W), Y0, Math.round(1.4 / 3.2 * W), 3 * F, 150, 0, 60);         // the town quay
  const lx = Math.round((1.36 / 3.2 + 0.5) * W); rect(lx, Y0 + 6 * F, 7 * F, 24 * F, 250, 0, 0); rect(lx - F, Y0 + 30 * F, 9 * F, 4 * F, 0, 240, 0);   // the light
  await ctx.yield();
  const tex = new THREE.DataTexture(d, W, Hh, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// the same fold function as foldH() in SHADOW_GLSL, on the CPU (to place the counterpane's vertices and the moth)
export function foldHeight(style, x, z) {
  const F = style.uniforms.uFold.value, B = style.uniforms.uBed.value;
  const u = x + 3.5 * Math.sin(z * 0.047 + F.x) + 1.8 * Math.sin(z * 0.118 + x * 0.021 + F.y);
  const r = 0.5 + 0.5 * Math.sin(u * 0.5 + 0.5 * Math.sin(u * 0.083 + F.z));
  const amp = 0.88 + 0.12 * Math.sin(z * 0.06 + x * 0.033 + F.x * 1.7);
  const h = 2.1 * r * r * Math.sqrt(r) * amp + 0.03 * Math.sin(u * 1.3 + z * 0.31 + F.y * 2) + 0.02 * Math.sin(z * 0.6 - u * 0.5 + F.z * 3);
  const edge = Math.min(Math.min(x - B.x, B.y - x), Math.min(z - B.z, B.w - z));
  return 43.4 + F.w * h * (0.3 + 0.7 * smoothstep(0, 7, edge));
}

// ---- geometry helpers: every piece ends up with position, normal, aCol, aKind, aSway and no index ----
// dress(geo, colour, kind, sway): colour = THREE.Color (the matte), kind = see the materials, sway = number or (x,y,z)=>number
export function dress(geo, col, kind = 0, sway = 0) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.position.count, pos = g.attributes.position;
  const c = new Float32Array(n * 3), k = new Float32Array(n), s = new Float32Array(n);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; k[i] = kind; s[i] = typeof sway === 'function' ? sway(pos.getX(i), pos.getY(i), pos.getZ(i)) : sway; }
  g.setAttribute('aCol', new THREE.BufferAttribute(c, 3)); g.setAttribute('aKind', new THREE.BufferAttribute(k, 1)); g.setAttribute('aSway', new THREE.BufferAttribute(s, 1));
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'aCol', 'aKind', 'aSway'].includes(name)) g.deleteAttribute(name);
  return g;
}
const at = (g, x, y, z) => g.translate(x, y, z);
// a turned piece (post, leg, jug): profile = [[radius, y], ...] from the bottom up
const turned = (profile, seg = 14) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y)), seg);
// a rod between two points
function rod(a, b, r, seg = 8) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, seg, 1, false);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  return g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// =========================================================================================================
// THE HERO: the counterpane and the carafe (bed, pillows, iron frame, washstand, carafe, drops, moth)
// =========================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const style = opts.style || await makeStyle(ctx, opts);
  const pal = style.pal, U = style.uniforms;
  const root = new THREE.Group(); root.name = 'room-is-a-camera-hero';
  const linenMat = linenMaterial(style), matteMat = matteMaterial(style), glassMat = glassMaterial(style);
  const X0 = -86, X1 = 20, Z0 = -50, Z1 = 20;
  U.uBed.value.set(X0, X1, Z0, Z1);
  const fh = (x, z) => foldHeight(style, x, z);
  const linen = [], matte = [], glass = [];

  // ---- the counterpane's top: a 106 x 70 m sheet on the fold function (indexed, its own mesh)
  {
    const nx = Math.round(208 * detail), nz = Math.round(132 * detail), n = (nx + 1) * (nz + 1);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), kind = new Float32Array(n).fill(1), sway = new Float32Array(n);
    for (let j = 0, i = 0; j <= nz; j++) {
      const z = lerp(Z0, Z1, j / nz);
      for (let k = 0; k <= nx; k++, i++) {
        const x = lerp(X0, X1, k / nx);
        pos[i * 3] = x; pos[i * 3 + 1] = fh(x, z); pos[i * 3 + 2] = z; nor[i * 3 + 1] = 1;
        col[i * 3] = pal.linen.r; col[i * 3 + 1] = pal.linen.g; col[i * 3 + 2] = pal.linen.b;
      }
      if (j % 10 === 0) await ctx.yield();
    }
    await ctx.yield();
    const idx = new Uint32Array(nx * nz * 6);
    for (let j = 0, t = 0; j < nz; j++) for (let k = 0; k < nx; k++) { const a = j * (nx + 1) + k, b = a + 1, c = a + nx + 1, d = c + 1; idx[t++] = a; idx[t++] = c; idx[t++] = b; idx[t++] = b; idx[t++] = c; idx[t++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1)); g.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const top = new THREE.Mesh(g, linenMat); top.name = 'counterpane'; root.add(top);
  }
  await ctx.yield();

  // ---- the hang: down both long sides to 25 m and to 10 m at the foot, in soft vertical folds
  {
    const per = [];        // perimeter: x, z, outward nx, nz, hem height
    const stepL = 0.62 / detail, R = 2;
    for (let x = X0; x < X1 - R; x += stepL) per.push([x, Z1, 0, 1, 25]);
    for (let k = 0; k <= 7; k++) { const a = (1 - k / 7) * Math.PI / 2; per.push([X1 - R + Math.cos(a) * R, Z1 - R + Math.sin(a) * R, Math.cos(a), Math.sin(a), lerp(25, 10, smoothstep(0, 1, k / 7))]); }
    for (let z = Z1 - R - stepL; z > Z0 + R; z -= stepL) per.push([X1, z, 1, 0, 10]);
    for (let k = 0; k <= 7; k++) { const a = -(k / 7) * Math.PI / 2; per.push([X1 - R + Math.cos(a) * R, Z0 + R + Math.sin(a) * R, Math.cos(a), Math.sin(a), lerp(10, 25, smoothstep(0, 1, k / 7))]); }
    for (let x = X1 - R - stepL; x >= X0; x -= stepL) per.push([x, Z0, 0, -1, 25]);
    const ts = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.955, 1], rows = ts.length - 1, m = per.length, pos = new Float32Array(m * (rows + 1) * 3), tv = new Float32Array(m * (rows + 1));
    const p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28);
    let s = 0;
    for (let i = 0; i < m; i++) {
      const [x, z, nx, nz, hem0] = per[i];
      if (i) s += Math.hypot(x - per[i - 1][0], z - per[i - 1][1]);
      const fold = Math.sin(s * 0.47 + 2.1 * Math.sin(s * 0.11 + p1)) * 0.75 + Math.sin(s * 1.21 + p2) * 0.25;
      const topY = fh(x - nx * 0.5, z - nz * 0.5) - 0.12, hem = hem0 + 0.7 * Math.sin(s * 0.29 + p2) + 0.4 * fold;
      for (let j = 0; j <= rows; j++) {
        const t = ts[j], out = (j === rows - 1 ? 0.12 : 0) - 0.5 + 1.5 * (1 - (1 - t) ** 4) + t * (0.5 + 0.6 * fold) * smoothstep(0.05, 0.5, t), o = (i * (rows + 1) + j) * 3;
        pos[o] = x + nx * out; pos[o + 1] = topY - (topY - hem) * t ** 1.55; pos[o + 2] = z + nz * out; tv[o / 3] = t;
      }
    }
    await ctx.yield();
    const idx = [];
    for (let i = 0; i < m - 1; i++) for (let j = 0; j < rows; j++) { const a = i * (rows + 1) + j, b = a + 1, c = a + rows + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(tv, 1)); g.setIndex(idx); g.computeVertexNormals();
    await ctx.yield();
    // the hem: the last strip is the cloth turned up and stitched, a band of doubled linen standing a little proud
    const gg = g.toNonIndexed(), T = gg.attributes.aT;
    await ctx.yield();
    const hung = dress(gg, pal.linen, 0, 0), C = hung.attributes.aCol, hemC = pal.linen.clone().multiplyScalar(0.66);
    await ctx.yield();
    for (let v = 0; v < T.count; v += 3) if (Math.min(T.getX(v), T.getX(v + 1), T.getX(v + 2)) > 0.95) for (let k = 0; k < 3; k++) C.setXYZ(v + k, hemC.r, hemC.g, hemC.b);
    await ctx.yield();
    linen.push(hung);
  }
  await ctx.yield();

  // ---- two pillows banked against the head rail
  const pillowAt = [[-75.5, 50.6, -31.5, 0.07], [-76.2, 51.0, 3.5, -0.05]];
  for (const [px, py, pz, yaw] of pillowAt) {
    const g = new THREE.SphereGeometry(1, 30, 20), p = g.attributes.position, lean = -0.5 + rng.range(-0.05, 0.05), wr = rng.range(0, 6.28);
    const rx = 9.6, ry = 4.4, rz = 15.5 * rng.range(0.95, 1.04), cl = Math.cos(lean), sl = Math.sin(lean), cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const qx = Math.sign(x) * Math.abs(x) ** 0.5, qz = Math.sign(z) * Math.abs(z) ** 0.5, rim = Math.max(Math.abs(qx), Math.abs(qz)) ** 5;
      const ear = 1 + 0.1 * (Math.abs(qx) * Math.abs(qz)) ** 3;                              // the corners pull out into ears
      const puff = (1 - 0.62 * rim) * (1 + 0.1 * Math.sin(qz * 5.5 + wr) * Math.sin(qx * 4 + wr * 1.7));
      x = qx * rx * ear; z = qz * rz * ear; y = Math.sign(y) * Math.abs(y) ** 0.85 * ry * puff + 0.5 * (1 - rim) * Math.sin(qz * 2.2 + wr);
      const x1 = x * cl - y * sl, y1 = x * sl + y * cl;
      p.setXYZ(i, px + x1 * cy + z * sy, py + y1, pz - x1 * sy + z * cy);
    }
    g.computeVertexNormals();
    linen.push(dress(g, pal.linen, 0, 0));
    style.addEllipsoid(V(px, py, pz), V(7.6, 4.6, 12.6));
  }
  await ctx.yield();

  // ---- the iron bedstead: four knobbed posts, a foot rail whose spindles rule black bars across the linen,
  //      a taller head rail, side irons and slats under the mattress
  const iron = pal.slate.clone().multiplyScalar(0.6), wood = pal.umber, brass = pal.tan.clone().lerp(pal.umber, 0.35);
  const postProfile = (h) => [[1.7, 0], [1.7, 1.0], [1.0, 2.2], [0.95, 27.5], [1.35, 28.3], [1.35, 33.2], [0.95, 34], [0.9, h - 8], [1.3, h - 7.5], [1.3, h - 6.6], [0.85, h - 6], [0.75, h - 4.8], [1.5, h - 4], [2.05, h - 2.6], [1.7, h - 1.1], [0.6, h - 0.15], [0, h]];
  const FX = 23.6, HX = -88.4, PZ0 = Z0 - 3, PZ1 = Z1 + 3, FOOT_TOP = 62.5, HEAD_TOP = 77;
  for (const [x, h] of [[FX, FOOT_TOP + 7.5], [HX, HEAD_TOP + 7.5]]) for (const z of [PZ0, PZ1]) {
    matte.push(dress(at(turned(postProfile(h), 12), x, 0, z), iron, 4));
    style.addCapsule(V(x, 2, z), V(x, h - 2.4, z), 0.55);
  }
  matte.push(dress(rod(V(FX, FOOT_TOP, PZ0), V(FX, FOOT_TOP, PZ1), 0.62, 10), iron, 4), dress(rod(V(FX, 30.8, PZ0), V(FX, 30.8, PZ1), 0.62, 10), iron, 4));
  matte.push(dress(rod(V(HX, HEAD_TOP, PZ0), V(HX, HEAD_TOP, PZ1), 0.62, 10), iron, 4), dress(rod(V(HX, 30.8, PZ0), V(HX, 30.8, PZ1), 0.62, 10), iron, 4), dress(rod(V(HX, 62, PZ0), V(HX, 62, PZ1), 0.5, 8), iron, 4));
  style.addCapsule(V(FX, FOOT_TOP, PZ0), V(FX, FOOT_TOP, PZ1), 0.45);
  style.addCapsule(V(HX, HEAD_TOP, PZ0), V(HX, HEAD_TOP, PZ1), 0.6);
  await ctx.yield();
  const nSp = 6;
  for (let i = 0; i < nSp; i++) {
    const z = lerp(PZ0, PZ1, (i + 1) / (nSp + 1)) + rng.range(-0.4, 0.4);
    // a spindle with a turned bead in the middle; its shadow is one long black line down the bed
    matte.push(dress(at(turned([[0.42, 30.8], [0.42, 44], [0.8, 45], [0.95, 46.2], [0.8, 47.4], [0.42, 48.4], [0.42, FOOT_TOP]], 8), FX, 0, z), iron, 4));
    style.addCapsule(V(FX, 30.8, z), V(FX, FOOT_TOP, z), 0.3);
  }
  for (let i = 0; i < 9; i++) {
    const z = lerp(PZ0, PZ1, (i + 1) / 10);
    matte.push(dress(rod(V(HX, 30.8, z), V(HX, HEAD_TOP, z), 0.4, 6), iron, 4));
  }
  await ctx.yield();
  for (const z of [Z0 + 1.6, Z1 - 1.6]) matte.push(dress(at(new THREE.BoxGeometry(FX - HX, 2.6, 1.0), (FX + HX) / 2, 29.6, z), iron, 4));
  for (let i = 0; i < 17; i++) matte.push(dress(at(new THREE.BoxGeometry(3.6, 0.7, Z1 - Z0 - 2), lerp(X0 + 4, X1 - 4, i / 16), 30.9, (Z0 + Z1) / 2), wood, 5));
  matte.push(dress(at(new THREE.BoxGeometry(X1 - X0 - 1, 0.6, Z1 - Z0 - 1), (X0 + X1) / 2, 31.9, (Z0 + Z1) / 2), pal.linen.clone().multiplyScalar(0.5), 0));   // ticking under the slats
  style.addBox(V(X0 + 0.5, 25.6, Z0 + 0.5), V(X1 - 0.5, 42.9, Z1 - 0.5));        // the mattress and the hang at the sides
  style.addBox(V(X1 - 0.6, 10.8, Z0 + 0.6), V(X1 + 0.3, 42.9, Z1 - 0.6));        // the hang at the foot
  await ctx.yield();

  // ---- the washstand against the back wall: marble top, turned legs, a shelf, two drawers, a brass towel rail
  const WX0 = -75, WX1 = -20, WZ0 = -110, WZ1 = -77, MY = 45;
  {
    const sh = new THREE.Shape(), r = 1.2, w = WX1 - WX0, d = WZ1 - WZ0;
    sh.moveTo(r, 0); sh.lineTo(w - r, 0); sh.quadraticCurveTo(w, 0, w, r); sh.lineTo(w, d); sh.lineTo(0, d); sh.lineTo(0, r); sh.quadraticCurveTo(0, 0, r, 0);
    const slab = new THREE.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.45, bevelSize: 0.45, bevelSegments: 3, curveSegments: 5 });
    slab.rotateX(-Math.PI / 2); slab.translate(WX0, MY - 1.95, WZ1 - 0.45);     // shape y -> world -z: the rounded front corners at z = WZ1
    matte.push(dress(slab, new THREE.Color('#9a9da2'), 3));
    matte.push(dress(at(new THREE.BoxGeometry(WX1 - WX0, 9, 1.4), (WX0 + WX1) / 2, MY + 4.5, WZ0 + 0.7), new THREE.Color('#9a9da2'), 3));
    matte.push(dress(at(new THREE.BoxGeometry(WX1 - WX0 - 3, 9.4, WZ1 - WZ0 - 3), (WX0 + WX1) / 2, 37.9, (WZ0 + WZ1) / 2), wood, 5));
    const front = wood.clone().multiplyScalar(1.25), ZF = WZ1 - 1.15, iron2 = pal.slate.clone().multiplyScalar(0.3);
    for (const cx of [-59.5, -35.5]) {
      // a drawer front as a joiner makes it: a frame of rails and stiles, a raised field panel inside a bead, a keyhole plate
      matte.push(dress(at(new THREE.BoxGeometry(21, 6, 0.5), cx, 37.9, WZ1 - 1.4), front, 5));
      for (const dy of [-2.55, 2.55]) matte.push(dress(at(new THREE.BoxGeometry(21, 0.9, 0.45), cx, 37.9 + dy, ZF + 0.2), front, 5));
      for (const dx of [-9.95, 9.95]) matte.push(dress(at(new THREE.BoxGeometry(1.1, 4.2, 0.45), cx + dx, 37.9, ZF + 0.2), front, 5));
      const bz = ZF + 0.3, bc = wood.clone().multiplyScalar(1.7), bx = 8.7, by = 1.7;
      for (const [x0, y0, x1, y1] of [[-bx, -by, bx, -by], [-bx, by, bx, by], [-bx, -by, -bx, by], [bx, -by, bx, by]]) matte.push(dress(rod(V(cx + x0, 37.9 + y0, bz), V(cx + x1, 37.9 + y1, bz), 0.17, 6), bc, 5));
      matte.push(dress(at(new THREE.BoxGeometry(15.6, 2.4, 0.3), cx, 37.9, ZF + 0.12), front, 5));
      matte.push(dress(at(turned([[0.35, 0], [0.35, 0.5], [0.9, 0.9], [1.0, 1.4], [0.6, 1.9], [0, 2]], 14).rotateX(Math.PI / 2), cx, 37.5, ZF + 0.25), brass, 0));
      const plate = new THREE.CylinderGeometry(0.62, 0.62, 0.12, 18).rotateX(Math.PI / 2); plate.scale(0.75, 1.25, 1);
      matte.push(dress(at(plate, cx, 39.95, ZF + 0.47), brass, 0));
      matte.push(dress(at(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 10).rotateX(Math.PI / 2), cx, 40.12, ZF + 0.56), iron2, 4), dress(at(new THREE.BoxGeometry(0.2, 0.5, 0.1), cx, 39.78, ZF + 0.56), iron2, 4));
    }
    const leg = [[1.4, 0], [2.0, 0.9], [1.3, 2.2], [1.7, 6], [2.3, 8.6], [1.5, 11.5], [1.25, 20], [1.9, 24], [2.3, 26.5], [1.6, 28], [2.4, 29], [2.4, 33.4]];
    for (const x of [WX0 + 3.4, WX1 - 3.4]) for (const z of [WZ0 + 3.6, WZ1 - 3.6]) matte.push(dress(at(turned(leg, 12), x, 0, z), wood, 5));
    matte.push(dress(at(new THREE.BoxGeometry(WX1 - WX0 - 6, 1.3, WZ1 - WZ0 - 6), (WX0 + WX1) / 2, 9.6, (WZ0 + WZ1) / 2), wood, 5));
    style.addBox(V(WX0 + 0.1, 42.6, WZ0 + 0.2), V(WX1 - 0.1, MY - 0.15, WZ1 - 0.02));
    style.addBox(V(WX0 + 1.8, 33.4, WZ0 + 0.2), V(WX1 - 1.8, 42.6, WZ1 - 1.8));
  }
  // the towel rail along the front, close under the marble's edge (so the towel hangs from the top of the drawer front
  // down past the shelf, not from the middle of the drawer), with a towel over it
  const RAILY = 42.2, RAILZ = WZ1 + 1.7, RX0 = -43, RX1 = -22.5;
  matte.push(dress(rod(V(RX0, RAILY, RAILZ), V(RX1, RAILY, RAILZ), 0.42, 10), brass, 0));
  for (const x of [RX0 + 0.8, RX1 - 0.8]) matte.push(dress(rod(V(x, RAILY, RAILZ), V(x, RAILY - 0.6, WZ1 - 1.5), 0.3, 8), brass, 0));
  for (const x of [RX0, RX1]) matte.push(dress(at(new THREE.SphereGeometry(0.75, 10, 8), x, RAILY, RAILZ), brass, 0));
  {
    const nu = 14, nv = 44, pos = [], idx = [], tx0 = -39.5, tx1 = -28.5, pf = rng.range(0, 6.28);
    for (let j = 0; j <= nv; j++) {
      const v = j / nv, over = clamp((v - 0.36) / 0.1, 0, 1), a = over * Math.PI;         // back hem -> over the rail -> front hem
      const y = v < 0.36 ? lerp(31, RAILY, v / 0.36) : v > 0.46 ? lerp(RAILY, 24.5, (v - 0.46) / 0.54) : RAILY + 0.62 * Math.sin(a);
      const zc = RAILZ + (v < 0.36 ? -0.62 : v > 0.46 ? 0.62 : -0.62 * Math.cos(a));
      for (let i = 0; i <= nu; i++) {
        const u = i / nu, hang = Math.max(0, RAILY - y) / 15;
        pos.push(lerp(tx0, tx1, u) + 0.25 * hang * Math.sin(u * 5 + pf), y + (v > 0.46 ? 0.5 * hang * Math.sin(u * 3.1 + pf) : 0), zc + (v > 0.46 ? 1 : -1) * hang * (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(u * 9.4 + pf))));
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const tw = dress(g, pal.linen, 0, (x, y) => 0.22 * clamp((RAILY - 1 - y) / 14, 0, 1));
    {   // the woven stripes: two slate bands above each hem (front hem at 24.5, back hem at 31)
      const P = tw.attributes.position, C = tw.attributes.aCol, st = pal.slate.clone().multiplyScalar(0.7);
      for (let i = 0; i < P.count; i++) {
        const y = P.getY(i), front = P.getZ(i) > RAILZ, h = front ? y - 24.5 : y - 31;
        if ((h > 1.0 && h < 1.75) || (h > 2.2 && h < 2.5) || (front && h > 3.3 && h < 3.5)) C.setXYZ(i, st.r, st.g, st.b);
      }
    }
    linen.push(tw);
    await ctx.yield();
    {   // the fringe: a row of knotted tassels under both hems
      const fp = [], nF = 46;
      for (const [row, zs] of [[nv, 1], [0, -1]]) for (let k = 0; k < nF; k++) {
        const u0 = k / nF, u1 = (k + 0.62) / nF, um = (k + 0.31) / nF, o = (row * (nu + 1)) * 3, yh = pos[o + 1] + 0.05, zh = pos[o + 2 + Math.round(um * nu) * 3];
        fp.push(lerp(tx0, tx1, u0), yh, zh, lerp(tx0, tx1, u1), yh, zh, lerp(tx0, tx1, um) + 0.05 * Math.sin(k * 2.1), yh - 0.72 - 0.08 * Math.sin(k * 1.7), zh + zs * 0.12);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.computeVertexNormals();
      linen.push(dress(fg, pal.linen, 0, (x, y) => 0.22 * clamp((RAILY - 1 - y) / 14, 0, 1)));
    }
  }
  await ctx.yield();

  // ---- on the marble: ewer and basin (white china), the honesty in its jar, the carafe, the drops
  const china = pal.linen, EW = V(-63, MY, -94);
  // a smooth turned piece: the profile is splined and the lathe keeps its own analytic normals (smooth across the
  // seam), so the china has no facets or crease; a bend moves vertices only
  const smoothTurned = (profile, seg, n, bend) => {
    const cv = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(n).map((q) => new THREE.Vector2(Math.max(q.x, 0.001), q.y));
    const g = new THREE.LatheGeometry(cv, seg);
    if (bend) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) bend(p, i); }
    return g;
  };
  await ctx.yield();
  matte.push(dress(at(smoothTurned([[0.01, 0.3], [3, 0.3], [3.5, 0], [4.1, 0], [4.4, 0.6], [7.5, 3.1], [9.4, 4.5], [10.1, 4.85], [10.35, 5.25], [10.1, 5.6], [9.6, 5.45], [9.1, 4.95], [7.2, 3.7], [4, 1.3], [0.01, 1.05]], 56, 60), EW.x, EW.y, EW.z), china, 6));
  await ctx.yield();
  {
    // the ewer: a pear body, a waisted neck, a lip pulled out into a spout on the side away from the handle
    const g = smoothTurned([[0.01, 0], [2.6, 0], [3.05, 0.4], [2.7, 1.2], [4.2, 3.5], [5.2, 6.5], [5.0, 9.5], [3.6, 12], [2.6, 13.6], [2.5, 14.6], [3.3, 16], [3.85, 17], [3.6, 17.15], [2.95, 16.2], [2.2, 14.8], [0.01, 14.6]], 56, 72, (p, i) => {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z);
      if (y > 14.2 && r > 0.3) { const c = 0.5 + 0.5 * x / r, k = smoothstep(14.2, 17.1, y) * c * c * c * c; p.setX(i, x + 2.6 * k); p.setY(i, y + 1.1 * k); }
    });
    matte.push(dress(at(g, EW.x, EW.y + 1.0, EW.z), china, 6));
    const handle = new THREE.TorusGeometry(3.4, 0.48, 12, 36, Math.PI * 1.1); handle.rotateZ(Math.PI * 0.42); handle.scale(0.8, 1.2, 1);
    matte.push(dress(at(handle, EW.x - 4.6, EW.y + 10.5, EW.z), china, 6));
    style.addEllipsoid(V(EW.x, EW.y + 8, EW.z), V(4.6, 8, 4.6)); style.addEllipsoid(V(EW.x, EW.y + 2.6, EW.z), V(9, 2.4, 9));
  }
  await ctx.yield();
  const CAR = V(-36, MY, -84), CS = 1.3, BALL = 4.5 * CS, BY = 4.7 * CS;
  U.uLens.value.set(CAR.x, CAR.y + BY, CAR.z, BALL);
  const gk = (g, kind) => { const n = g.attributes.position.count; g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(n).fill(kind), 1)); g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
  {
    const ball = [[0.01, 0.02], [2.6, 0.02]], neck = [];
    for (let k = 0; k <= 28; k++) { const a = lerp(-0.95, 0.98, k / 28); ball.push([BALL * Math.cos(a), BY + BALL * Math.sin(a)]); }
    neck.push(ball[ball.length - 1], ...[[1.6, 9.3], [1.3, 10.6], [1.22, 13.4], [1.5, 14.5], [1.75, 14.9], [1.55, 15.0], [1.3, 14.4]].map(([r, y]) => [r * CS, y * CS]));
    glass.push(gk(at(turned(ball, 56), CAR.x, CAR.y, CAR.z), 1), gk(at(turned(neck, 32), CAR.x, CAR.y, CAR.z), 0));
    glass.push(gk(at(turned([[2.45, 10.0], [2.55, 10.2], [2.4, 16.4], [2.0, 17.5], [0.01, 17.75]].map(([r, y]) => [r * CS, y * CS]), 32), CAR.x, CAR.y, CAR.z), 0));     // the tumbler upturned over the neck
    style.addEllipsoid(V(CAR.x, CAR.y + BY, CAR.z), V(BALL * 0.96, BALL * 0.96, BALL * 0.96));
    style.addCapsule(V(CAR.x, CAR.y + 10.5 * CS, CAR.z), V(CAR.x, CAR.y + 16 * CS, CAR.z), 2.2 * CS);
  }
  await ctx.yield();
  // eleven drops of spilled water along the marble's front edge, each a small lens
  const drops = [];
  for (let i = 0; i < 11; i++) {
    const x = lerp(-69, -26, (i + rng.range(-0.3, 0.3)) / 10), r = rng.range(0.6, 1.25), z = WZ1 - 0.9 - r - rng.range(0, 1.1);
    const g = new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.62, 1 + rng.range(0, 0.25));
    glass.push(gk(at(g, x, MY, z), 1)); drops.push(V(x, MY + r * 0.3, z));
  }
  await ctx.yield();
  // dried honesty in a small jar: three stems, coin pods of translucent paper
  const JAR = V(-48, MY, -97);
  glass.push(gk(at(turned([[0.01, 0.05], [1.7, 0.05], [1.9, 0.5], [1.9, 3.6], [1.35, 4.5], [1.5, 5.1]], 18), JAR.x, JAR.y, JAR.z), 0));
  for (let sI = 0; sI < 3; sI++) {
    const a0 = rng.range(0, 6.28), lean = rng.range(2.5, 5.5), h = rng.range(15, 20), pts = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(V(JAR.x + Math.cos(a0) * lean * t * t, JAR.y + 0.4 + h * t, JAR.z + Math.sin(a0) * lean * t * t + 0.6 * Math.sin(t * 5 + sI))); }
    const curve = new THREE.CatmullRomCurve3(pts);
    matte.push(dress(new THREE.TubeGeometry(curve, 12, 0.13, 5, false), pal.linen.clone().lerp(pal.umber, 0.55), 0));
    const nPod = Math.round(8 * detail);
    for (let k = 0; k < nPod; k++) {
      const t = 0.42 + 0.58 * (k + rng()) / nPod, c = curve.getPoint(t), ang = rng.range(0, 6.28), out = rng.range(1.3, 2.1), r = rng.range(0.85, 1.3);
      const pc = V(c.x + Math.cos(ang) * out, c.y + rng.range(0.2, 1.1), c.z + Math.sin(ang) * out);
      // a coin of translucent paper inside a thin darker frame (the pod's rim)
      const ry = rng.range(0, 3.14), rx = rng.range(-0.5, 0.5), sw = 0.07 + 0.05 * rng();
      const pod = new THREE.CircleGeometry(r * 0.9, 16); pod.scale(1, 1.25, 1); pod.rotateY(ry); pod.rotateX(rx);
      linen.push(dress(at(pod, pc.x, pc.y, pc.z), pal.linen, 2, sw));
      const frame = new THREE.RingGeometry(r * 0.9, r, 16); frame.scale(1, 1.25, 1); frame.rotateY(ry); frame.rotateX(rx);
      linen.push(dress(at(frame, pc.x, pc.y, pc.z), pal.linen.clone().lerp(pal.tan, 0.35).multiplyScalar(0.45), 2, sw));
      matte.push(dress(rod(c, pc, 0.07, 4), pal.linen.clone().lerp(pal.umber, 0.55), 0));
    }
    await ctx.yield();
  }
  await ctx.yield();

  // ---- the stage: the floor and the two walls the set piece is seen against (opts.stage === false leaves them out)
  if (opts.stage !== false) {
    const RX0s = -90, RX1s = 125, RZ0 = -110, RZ1 = 125, RH = 145;
    const fl = new THREE.PlaneGeometry(RX1s - RX0s, RZ1 - RZ0, 1, 1); fl.rotateX(-Math.PI / 2); matte.push(dress(at(fl, (RX0s + RX1s) / 2, 0, (RZ0 + RZ1) / 2), pal.umber, 1));
    const wb = new THREE.PlaneGeometry(RX1s - RX0s, RH); matte.push(dress(at(wb, (RX0s + RX1s) / 2, RH / 2, RZ0), pal.plum, 2));
    const wl = new THREE.PlaneGeometry(RZ1 - RZ0, RH); wl.rotateY(Math.PI / 2); matte.push(dress(at(wl, RX0s, RH / 2, (RZ0 + RZ1) / 2), pal.plum, 2));
    const trim = pal.linen.clone().multiplyScalar(0.7);
    for (const [y, hh, th] of [[2.5, 5, 0.9], [5.3, 0.6, 1.3], [112, 1.6, 0.9]]) {
      matte.push(dress(at(new THREE.BoxGeometry(RX1s - RX0s, hh, th), (RX0s + RX1s) / 2, y, RZ0 + th / 2), trim, 0));
      matte.push(dress(at(new THREE.BoxGeometry(th, hh, RZ1 - RZ0), RX0s + th / 2, y, (RZ0 + RZ1) / 2), trim, 0));
    }
  }
  await ctx.yield();

  // ---- assemble: one mesh per material
  const linenMesh = new THREE.Mesh(mergeGeometries(linen, false), linenMat); linenMesh.name = 'linen'; root.add(linenMesh);
  await ctx.yield();
  const matteMesh = new THREE.Mesh(mergeGeometries(matte, false), matteMat); matteMesh.name = 'matte'; root.add(matteMesh);
  await ctx.yield();
  const glassMesh = new THREE.Mesh(mergeGeometries(glass, false), glassMat); glassMesh.name = 'glass'; glassMesh.renderOrder = 2; root.add(glassMesh);
  for (const g of [...linen, ...matte, ...glass]) g.dispose();

  // ---- the drop that swells on the towel rail and falls every nine seconds, with its bay inside it
  const dropGeo = new THREE.SphereGeometry(0.8, 16, 12); dropGeo.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(dropGeo.attributes.position.count).fill(1), 1));
  const fallDrop = new THREE.Mesh(dropGeo, glassMat); fallDrop.renderOrder = 2; root.add(fallDrop);
  const DROP0 = V(RX0 + 3.2, RAILY - 0.5, RAILZ);

  await ctx.yield();
  // ---- the house moth: rests on the counterpane, lifts as we pass, crosses the beam and flies away up it.
  //      Fore and hind wing on each side, each a fan from its root to a scalloped rim (aCol = angle across the fan 0..1,
  //      root 0 .. rim 1, part: 0 fore, 1 hind, 2 body, +4 for the two lagging copies of each wing that are the blur of
  //      the beat); LINEN_FS (aKind 3) draws the veins, the darker margin and the fringe, and never lets a wing go black.
  const moth = new THREE.Group(), wingL = new THREE.Group(), wingR = new THREE.Group(), ghostL = [], ghostR = [];
  moth.rotation.order = 'YXZ';
  {
    const fan = (root, a0, a1, rf, n, part, sx) => {
      const pos = [], nor = [], col = [], rim = [];
      for (let i = 0; i <= n; i++) { const t = i / n, a = lerp(a0, a1, t), r = rf(t); rim.push([root[0] + Math.cos(a) * r, root[1] + Math.sin(a) * r]); }
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
        const tri = sx > 0 ? [[root, tm, 0], [rim[i + 1], t1, 1], [rim[i], t0, 1]] : [[root, tm, 0], [rim[i], t0, 1], [rim[i + 1], t1, 1]];
        for (const [q, th, rr] of tri) { pos.push(q[0] * sx, 0.02 * part, -q[1]); nor.push(0, 1, 0); col.push(th, rr, part); }
      }
      const g = new THREE.BufferGeometry(), m = pos.length / 3;
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(new Float32Array(m).fill(3), 1));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(new Float32Array(m), 1));
      return g;
    };
    const foreR = (t) => (2.45 - 1.2 * Math.pow(t, 1.25)) * (0.9 + 0.1 * smoothstep(0, 0.07, t)) * (1 + 0.03 * Math.cos(t * 44) * smoothstep(0.08, 0.2, t));
    const hindR = (t) => (1.6 - 0.3 * t + 0.16 * Math.sin(t * Math.PI)) * (1 + 0.04 * Math.cos(t * 31) * smoothstep(0.05, 0.2, t));
    const side = (sx, part) => mergeGeometries([fan([0.16, 0.14], 0.3, -1.02, foreR, 40, part, sx), fan([0.14, -0.22], -0.5, -1.72, hindR, 32, part + 1, sx)], false);
    await ctx.yield();
    for (const [grp, sx, gh] of [[wingL, -1, ghostL], [wingR, 1, ghostR]]) {
      grp.add(new THREE.Mesh(side(sx, 0), linenMat));
      for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(side(sx, 4), linenMat); gh.push(m); moth.add(m); }
    }
    // the body: a furred thorax and abdomen, a small head, two antennae swept forward and out
    const parts = [new THREE.SphereGeometry(1, 12, 9).scale(0.3, 0.27, 0.55).translate(0, 0, -0.35), new THREE.SphereGeometry(1, 12, 9).scale(0.24, 0.22, 0.85).translate(0, -0.03, 0.75),
      new THREE.SphereGeometry(0.19, 10, 8).translate(0, 0.02, -0.98)];
    for (const sx of [-1, 1]) parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0.08 * sx, 0.08, -1.05), V(0.35 * sx, 0.3, -1.7), V(0.8 * sx, 0.42, -2.3), V(1.15 * sx, 0.36, -2.75)]), 10, 0.055, 5, false));
    const bg = mergeGeometries(parts.map((g) => g.toNonIndexed()), false), bn = bg.attributes.position.count, bc = new Float32Array(bn * 3);
    for (let i = 0; i < bn; i++) { bc[i * 3] = bg.attributes.position.getZ(i); bc[i * 3 + 1] = 0.5; bc[i * 3 + 2] = 2; }
    for (const k of Object.keys(bg.attributes)) if (k !== 'position' && k !== 'normal') bg.deleteAttribute(k);
    bg.setAttribute('aCol', new THREE.BufferAttribute(bc, 3)); bg.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(bn).fill(3), 1)); bg.setAttribute('aSway', new THREE.BufferAttribute(new Float32Array(bn), 1));
    moth.add(wingL, wingR, new THREE.Mesh(bg, linenMat));
    moth.scale.setScalar(2.1); root.add(moth);
  }
  await ctx.yield();
  // ---- the dust over the bed and washstand, and the shafts that stream in overhead from the hole
  const motes = makeMotes(style, rng, { count: Math.round(5200 * detail), min: V(-90, 30, -110), max: V(125, 100, 40) }); root.add(motes);
  const ends = [];
  for (let i = 0; i < Math.round(44 * detail); i++) {
    const k = rng();
    if (k < 0.5) { const x = rng.range(X0 + 3, X1 - 3), z = rng.range(Z0 + 3, Z1 - 3); ends.push(V(x, fh(x, z) + 1.5, z)); }      // onto the linen
    else if (k < 0.72) ends.push(V(-89.5, rng.range(48, 100), rng.range(-105, 20)));                                           // the bed-head wall
    else if (k < 0.88) ends.push(V(rng.range(-70, -22), rng.range(46, 95), -109.5));                                           // above the washstand
    else ends.push(V(rng.range(30, 100), 0.5, rng.range(-100, 60)));                                                           // the open floor
  }
  const shafts = makeShafts(style, rng, ends); root.add(shafts);
  await ctx.yield();
  const mothEll = N_ELL - 1;
  let progress = -1;           // < 0: nobody has called setProgress, so the moth loops on its own clock
  // the moth's course, keyed to u: [u, x, y, z]
  const [ML0, ML1] = opts.mothLift ?? [0.462, 0.49];       // (a world whose course differs gives its own keys: opts.mothKeys(places) -> [[u, x, y, z], ...], opts.mothLift [u0, u1])
  // the places of the washstand a world's course needs: the carafe (its ball's centre, its neck's top, the radius of the
  // tumbler upturned over the neck) and the honesty (its jar's foot, and at any seed the reach of its pods about the
  // jar's axis: stems lean 5.5 m and wander 0.6, pods stand 2.1 off them and are 1.3 across; and their greatest
  // height above the marble: stems 20.4, pods 1.1 higher and 1.6 tall)
  const mothPlaces = () => ({ carafe: V(CAR.x, CAR.y + BY, CAR.z), neckTop: V(CAR.x, CAR.y + 15.0 * CS, CAR.z), tumblerR: 2.55 * CS, honesty: JAR.clone(), honestyR: 9.5, honestyTop: MY + 23.1 });
  // with no course from a world (the viewer) it rests on a slope of the linen that faces the hole (the steepest one
  // near x -40), so the linen behind it is lit and takes its shadow, and flies these keys
  const mothDefault = () => {
    let mx0 = -32; { let best = -1e9; for (let x = -36; x <= -27; x += 0.5) { const sl = fh(x - 0.6, -32) - fh(x + 0.6, -32); if (sl > best) { best = sl; mx0 = x; } } }
    const MOTH0 = V(mx0, fh(mx0, -32) + 0.5, -32);
    return [[0.3, MOTH0.x, MOTH0.y, MOTH0.z], [0.462, MOTH0.x, MOTH0.y, MOTH0.z], [0.485, MOTH0.x - 0.5, MOTH0.y + 2.4, MOTH0.z - 2], [0.5, -35, 49.5, -37], [0.52, -37.5, 52.5, -44], [0.545, -40, 55.5, -54], [0.57, -39.5, 58.3, -62], [0.6, -38.5, 58.3, -69],
      [0.63, -30.4, 58.3, -75.7], [0.66, -16, 59.5, -81], [0.7, -6, 66, -90], [0.76, 10, 84, -80], [0.84, 40, 106, -62], [0.92, 60, 122, -50], [1.2, 70, 130, -40]];       // from u 0.52 to 0.66 some 24 m ahead of the eye and to the right of the carafe
  };
  const MK = opts.mothKeys ? opts.mothKeys(mothPlaces()) : mothDefault();
  const mothAt = (u, out) => {
    let i = 1; while (i < MK.length - 2 && u > MK[i + 1][0]) i++;
    const a = MK[i], b = MK[i + 1], p0 = MK[i - 1], p1 = MK[Math.min(i + 2, MK.length - 1)], t = clamp((u - a[0]) / (b[0] - a[0]), 0, 1), t2 = t * t, t3 = t2 * t;
    const cr = (k) => 0.5 * ((2 * a[k]) + (-p0[k] + b[k]) * t + (2 * p0[k] - 5 * a[k] + 4 * b[k] - p1[k]) * t2 + (-p0[k] + 3 * a[k] - 3 * b[k] + p1[k]) * t3);
    return out.set(cr(1), cr(2), cr(3));
  };

  const anchors = {
    hole: HOLE.clone(),                                           // the hole in the shutter (the only light)
    portalSeat: { position: HOLE.clone(), facing: V(-1, 0, 0), radius: 7 },
    flyThrough: [V(0, 15, 0), V(0, 21, 62), V(-24, 37, 98), V(-47, 55, 22), V(-43, 55, -66), V(-36, 56, -83), V(0, 60, -69), V(58, 72, -60), V(125, 72, -60)],
    viewpoints: {
      overLinen: { from: V(-45, 55, 12), to: V(-47, 50, -91) },    // the art director's frame: ridges, sails, the carafe above
      carafe: { from: V(-37, 56, -79), to: V(-47, 50, -91) },
      underBed: { from: V(0, 15, 0), to: V(0, 20, 60) },
    },
    carafe: V(CAR.x, CAR.y + BY, CAR.z), carafeTop: V(CAR.x, CAR.y + 17.75 * CS, CAR.z), drops, ewer: V(EW.x, EW.y + 9, EW.z), honesty: V(JAR.x, JAR.y + 12, JAR.z),
    bed: { min: V(X0, 25, Z0), max: V(X1, 47.6, Z1), pillowTop: 60, footRailX: FX, headRailX: HX },
    washstand: { min: V(WX0, 0, WZ0), max: V(WX1, MY, WZ1) },
    mothRest: V(MK[0][1], MK[0][2], MK[0][3]), carafeShadow: V(-60, 45.2, -87.5),    // where the small upright harbour burns, on the marble toward the basin
  };
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function update(dt, time, camera) {
    style.update(dt, time);
    motes.userData.setSize(ctx.renderer);
    // the falling drop
    const tm = ((time % 9) + 9) % 9;
    if (tm < 6.5) { const k = smoothstep(0, 6.5, tm); fallDrop.position.set(DROP0.x, DROP0.y - 0.3 * k, DROP0.z); fallDrop.scale.set(0.25 + 0.75 * k, (0.25 + 0.75 * k) * (1 + 0.25 * k), 0.25 + 0.75 * k); }
    else { const f = Math.min(1, (tm - 6.5) / 1.7), y = lerp(DROP0.y - 0.3, 0.5, f * f); fallDrop.position.set(DROP0.x, y, DROP0.z); const s = f < 0.97 ? 1 : 0.001; fallDrop.scale.set(s * 0.9, s * 1.25, s * 0.9); }
    // the moth: at rest on the linen until its lift, then along its own course across the beam and away up it (its
    // place is keyed to the flight's u; on its own clock where nobody calls setProgress)
    const mu = progress < 0 ? 0.44 + 0.5 * (((time / 22) % 1 + 1) % 1) : progress;
    mothAt(mu, tmp); mothAt(mu + 0.004, tmp2);
    const fl = smoothstep(ML0, ML1, mu);
    tmp2.sub(tmp);
    moth.position.set(tmp.x + fl * 0.9 * Math.sin(time * 2.3), tmp.y + fl * 0.7 * Math.sin(time * 3.1), tmp.z + fl * 0.9 * Math.sin(time * 1.7 + 1));
    const yaw = tmp2.lengthSq() > 1e-8 ? Math.atan2(-tmp2.x, -tmp2.z) : Math.PI / 2;
    // its attitude is its own: nose up along its course, a slow yaw and roll on the clock (nothing here reads the camera)
    const yawNow = lerp(Math.PI / 2, yaw, fl) + 0.2 * Math.sin(time * 0.9) * fl;
    moth.rotation.set(fl * (0.55 + 0.12 * Math.sin(time * 2.9)), yawNow, 0.12 * fl * Math.sin(time * 1.9));
    // wings: a V beating fast in flight (two lagging copies are the blur), folded flat and breathing at rest
    const beat = (ph) => fl > 0.01 ? lerp(0.1, 0.42 + 0.62 * Math.sin(time * 34 - ph), fl) : 0.1 + 0.04 * Math.sin(time * 1.3);
    wingL.rotation.z = -beat(0); wingR.rotation.z = beat(0);
    for (let k = 0; k < 2; k++) { const f = beat(0.55 * (k + 1)); ghostL[k].rotation.z = -f; ghostR[k].rotation.z = f; const sc = fl > 0.01 ? 1 : 0.001; ghostL[k].scale.setScalar(sc); ghostR[k].scale.setScalar(sc); }
    moth.getWorldPosition(tmp); root.worldToLocal(tmp);
    // its occluder: a flat moth (see mothSil in SHADOW_GLSL) just behind it on the ray from the hole. A rule of the room,
    // not of the flight: within 2 m of the linen the plane is level, so the shadow on the linen is the moth's own outline
    // at its own size, starting under it and sliding down the beam over the ridges as it rises (6 m for every metre of
    // height); from 9 m above the linen, and anywhere off the bed, the plane faces the hole, so the shadow on a wall is
    // the moth magnified by the wall's distance (a door's size on the bed-head wall when it crosses the beam near the hole)
    tmp2.copy(tmp).sub(HOLE).normalize();
    const B4 = U.uBed.value, over = tmp.x > B4.x && tmp.x < B4.y && tmp.z > B4.z && tmp.z < B4.w, kUp = over ? smoothstep(2, 9, tmp.y - fh(tmp.x, tmp.z)) : 1;
    const N = U.uMothN.value.set(-tmp2.x * kUp, 1 - kUp - tmp2.y * kUp, -tmp2.z * kUp).normalize();
    const Fw = U.uMothF.value.set(-Math.sin(yawNow) * (1 - 0.85 * kUp), 0.85 * kUp, -Math.cos(yawNow) * (1 - 0.85 * kUp));
    Fw.addScaledVector(N, -Fw.dot(N)); if (Fw.lengthSq() < 1e-6) Fw.set(0, 0, 1).addScaledVector(N, -N.z); Fw.normalize();
    U.uEllC.value[mothEll].copy(tmp).addScaledVector(tmp2, 0.4); U.uEllR.value[mothEll].set(moth.scale.x, 1, 1);
  }
  update(0, 0, null);
  return {
    object: root, radius: 60, height: 62, center: V(-38, 44, -44), anchors, style, shafts, motes,
    update, setProgress(u) { progress = u; },
    dispose() { if (!opts.style) style.dispose(); },
    ground: false, groundY: 0,
  };
}

// ---------------------------------------------------------------------------------------------------------
// DUST. Motes are instanced quads that take the colour of the ray they cross (picture() at their centre) and
// go black in shadow, so the beam is drawn in moving dust. Shafts are long additive ribbons from the hole,
// each the colour of the piece of harbour it carries, whitening toward the hole (where the next world shows).
// Both evaluate the picture per VERTEX (the colour is constant along a ray), so they cost almost nothing.
// ---------------------------------------------------------------------------------------------------------
// a quad corner for a fleck seen moving: clipA and clipB are where it is now and a blur time ago; pos = the quad's
// corner (-1..1), px its radius in pixels. Returns the offset in pixels; sl = the streak's length in pixels.
const STREAK_GLSL = /* glsl */`
  vec2 streakOff(vec4 clipA, vec4 clipB, vec2 pos, float px, vec2 res, out float sl){
    vec2 sd = (clipB.xy/max(clipB.w, 0.05) - clipA.xy/max(clipA.w, 0.05))*res*0.5;
    sl = length(sd); vec2 sn = sl > 0.5 ? sd/max(sl, 1e-3) : vec2(1., 0.);
    sl = min(sl, 0.16*res.y)*step(0.05, clipB.w)*step(0.05, clipA.w);
    return sn*(pos.x*(px + 0.5*sl) + 0.5*sl) + vec2(-sn.y, sn.x)*(pos.y*px);
  }`;
const MOTE_VS = /* glsl */`
  ${STYLE_GLSL}
  ${STREAK_GLSL}
  uniform vec3 uVel;
  attribute vec4 aSeed; attribute vec3 aHome;
  uniform vec3 uBoxMin, uBoxMax, uDrift; uniform vec2 uRes; uniform float uMote;
  varying vec3 vC; varying vec2 vQ;
  void main(){
    float ph = aSeed.x*6.2832, t = uTime;
    vec3 c = aHome + vec3(sin(t*0.11 + ph)*4. + sin(t*0.31 + ph*3.)*1.2, sin(t*0.07 + ph*2.)*3. - mod(t*0.12*aSeed.y, 3.), cos(t*0.09 + ph*1.7)*4. + sin(t*0.27 + ph*5.)*1.2);
    c = uBoxMin + mod(c + uDrift*t - uBoxMin, max(uBoxMax - uBoxMin, vec3(1.)));
    vec3 o = uHole - c; float dist = length(o); o /= max(dist, 1e-3);
    float lit = o.x > 0.02 ? shadowAt(c, o, 0.3) : 0.;
    float inbed = step(uBed.x, c.x)*step(c.x, uBed.y)*step(uBed.z, c.z)*step(c.z, uBed.w);
    lit *= mix(1., step(foldH(c.xz), c.y), inbed);
    float tw = 0.55 + 0.45*sin(t*(0.6 + aSeed.z*1.5) + ph*7.);            // the mote turns: a flat fleck catches the ray and loses it
    vC = lit > 0.01 ? harbour(o, 0.03)*picFall(c)*lit*tw : vec3(0.);
    vec4 mv = viewMatrix*vec4(c, 1.);
    float size = (0.05 + 0.12*aSeed.w*aSeed.w)*uMote;
    vec4 clip = projectionMatrix*mv;
    float px = max(size*projectionMatrix[1][1]/max(-mv.z, 0.2)*uRes.y*0.5, 0.9);    // radius in pixels, never under a pixel
    vQ = position.xy;
    float sl; if (length(uVel) > 1e-4) px = min(px, 1.8 + 0.003*uRes.y);            // in the beam a near mote is a dash, never a disc
    vec2 off = streakOff(clip, projectionMatrix*viewMatrix*vec4(c + uVel, 1.), position.xy, px, uRes, sl);
    vC *= (1. + 0.9*smoothstep(2., 14., sl))/sqrt(1. + 0.25*sl/max(px, 0.5));      // a streak is thinner light, but a near one flares
    clip.xy += off*2./uRes*clip.w;
    if (lit < 0.01) clip = vec4(2., 2., 2., 1.);                                   // unlit motes are black: not drawn
    gl_Position = clip;
  }`;
const MOTE_FS = /* glsl */`
  uniform float uExpK;
  varying vec3 vC; varying vec2 vQ;
  void main(){
    float a = 1. - smoothstep(0.35, 1., length(vQ));
    gl_FragColor = vec4(vC*a*1.35*uExpK/0.6, 1.);
  }`;
// makeMotes(style, { count, min, max }): motes filling the box min..max (room space). Call .userData.setSize(renderer) each frame.
export function makeMotes(style, rng, opts = {}) {
  const n = opts.count ?? 6000, mn = opts.min ?? new THREE.Vector3(-90, 0, -110), mx = opts.max ?? new THREE.Vector3(125, 130, 125);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(n * 4), home = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { for (let k = 0; k < 4; k++) seed[i * 4 + k] = rng(); home[i * 3] = lerp(mn.x, mx.x, rng()); home[i * 3 + 1] = lerp(mn.y, mx.y, rng()); home[i * 3 + 2] = lerp(mn.z, mx.z, rng()); }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 3));
  g.instanceCount = n;
  const uniforms = Object.assign({ uBoxMin: { value: mn.clone() }, uBoxMax: { value: mx.clone() }, uRes: { value: new THREE.Vector2(1280, 720) }, uMote: { value: opts.size ?? 1 }, uVel: { value: new THREE.Vector3() }, uDrift: { value: (opts.drift ?? new THREE.Vector3()).clone() } }, style.uniforms);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: MOTE_VS, fragmentShader: MOTE_FS, defines: { NO_DERIV: 1 }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'motes';
  const sz = new THREE.Vector2();
  mesh.userData.setSize = (renderer) => { if (renderer) { renderer.getDrawingBufferSize(sz); uniforms.uRes.value.copy(sz); } };
  return mesh;
}

const SHAFT_VS = /* glsl */`
  ${STYLE_GLSL}
  attribute vec3 aEnd; attribute vec4 aRay;          // aRay: t along 0..1, side -1..1, width at the far end, seed
  attribute float aGain;
  uniform float uWide, uDustK;
  varying float vCap, vTan; varying vec3 vSd, vAx;     // (vTan, vSd, vAx are the same at every vertex of a ray)
  attribute float aTint;                             // 0 = the harbour along the ray, 1 sky, 2 sea, 3 sail (a shaft that must read as one colour)
  varying vec3 vC, vSP; varying vec4 vR; varying float vLen;
  void main(){
    vec3 dir = aEnd - uHole; float len = length(dir);
    vec3 P = uHole + dir*aRay.x;
    vec3 sd = cross(dir, P - cameraPosition); sd /= max(length(sd), 1e-3);
    // a cone from the hole, and never wider on screen than about a tenth of the frame (no veil when the eye is in the beam)
    vec3 o = -dir/max(len, 1e-3);
    vTan = aRay.z/max(len, 1e-3); vCap = 1.;
    float cap = uWide*length(P - cameraPosition);
    float hw = min(mix(min(1.2, aRay.z*0.25), aRay.z, aRay.x), cap);
    if (uDustK > 0.5){
      // a cone of dust is the straight wedge of its own geometry: its half width is linear in the distance from the hole,
      // so both edges are straight lines that meet at the hole. Like every ribbon it is capped by the line above, vertex
      // by vertex; vCap is the share of the wedge's own half width that is left at this vertex (for the edge's fade).
      float own = vTan*aRay.x*len;
      hw = min(own, cap);
      vCap = own > 1e-4 ? hw/own : 1.;
    }
    P += sd*aRay.y*hw; vSd = sd; vAx = -o;
    vC = o.x > 0.02 ? harbour(o, 0.035)*picFall(aEnd) : vec3(0.);
    if (aTint > 0.5) vC = (aTint < 1.5 ? uSky : aTint < 2.5 ? uSea*1.15 : uSailA*1.4)*(picFall(aEnd)*uGain*step(0.02, o.x));
    vC *= aGain;
    vR = aRay; vLen = len; vSP = P;
    gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
  }`;
const SHAFT_FS = /* glsl */`
  uniform float uExpK, uTime, uShaft, uDustK; uniform sampler2D tCloud;
  uniform vec3 uHole;
  varying vec3 vC, vSP; varying vec4 vR; varying float vLen, vCap, vTan; varying vec3 vSd, vAx;
  void main(){
    float d = vR.x*vLen, side = 1. - vR.y*vR.y;
    // where this pixel lies in its wedge, from its place in the room (a ribbon's own coordinate, interpolated over the two
    // triangles of each tapering piece, zigzags): yq = -1..1 across, the same all the way down any straight line from the hole
    vec3 q = vSP - uHole; float tq = max(dot(q, vAx), 1e-3);
    float yq = clamp(dot(q, vSd)/max(vTan*tq, 1e-3), -1., 1.);
    float lodF = clamp(log2(max(fwidth(yq)*1.9*256., 1e-3)), 0., 6.);       // filaments finer than a few pixels go to their average
    float dust = textureLod(tCloud, vec2(d*0.011 - uTime*0.045 + vR.w*7., vR.y*0.12 + vR.w*3.), 1.).r;
    float a = side*side*smoothstep(0., 0.06, vR.x)*(1. - smoothstep(0.82, 1., vR.x))*(0.2 + 2.1*dust*dust)*mix(0.05, 1., smoothstep(3., 60., d));
    if (uDustK > 0.001){
      // light travels straight: the filaments are looked up across the wedge's own width only (the same all the way down
      // a ray, so a ruler laid from the hole along any streak stays on it). Only the dust moves: clumps and grit sliding
      // outward along the rays, looked up by the distance from the hole. Where the ribbon is drawn narrower than the
      // wedge (vCap < 1) the soft edge is at the ribbon's real edge.
      float fil = textureLod(tCloud, vec2(vR.w*11. + 0.37, yq*1.9 + vR.w*5.), lodF).g;
      float fil2 = textureLod(tCloud, vec2(vR.w*3. + 0.71, yq*5.3 + vR.w*9.), min(lodF + 1.5, 6.)).r;
      float n1 = textureLod(tCloud, vec2(tq*0.019 - uTime*0.075 + vR.w*7., vR.w*3.), 0.).r;                     // clumps sliding outward
      float n3 = textureLod(tCloud, vec2(tq*0.07 - uTime*0.26 + vR.w*17., yq*3.7 + vR.w*9.), 0.).r;           // grit
      float edge = (1. - smoothstep(0.7, 1., min(abs(yq)/max(vCap, 1e-3), 1.)))*(0.4 + 0.6*(1. - yq*yq));
      float f = smoothstep(0.3, 0.72, fil)*(0.45 + 0.9*fil2);
      float dusty = edge*(0.07 + f*(0.5 + 2.2*smoothstep(0.4, 0.78, n1))*(0.45 + 1.1*n3*n3));
      a = mix(a, dusty*smoothstep(0., 0.04, vR.x)*(1. - smoothstep(0.82, 1., vR.x))*mix(0.05, 1., smoothstep(3., 40., d)), uDustK);
    }
    a *= smoothstep(1.5, 7., distance(vSP, cameraPosition));        // nothing within a few metres of the eye: the mote is in the beam, not in a fog
    vec3 c = mix(vec3(1.), vC, smoothstep(2., 9., d));              // white only in the last few metres by the hole (the next world shows there)
    gl_FragColor = vec4(c*a*uShaft*uExpK/0.6, 1.);
  }`;
// makeShafts(style, ends): one ribbon from the hole to each end point (room space, on the first surface the ray meets)
// opts.wide: the ribbon's greatest width as a fraction of its distance from the eye (0.045; more for cones seen from the side)
export function makeShafts(style, rng, ends, opts = {}) {
  // opts.width: one number, or (i) => width at the far end;  opts.tint: (i) => 0 harbour | 1 sky | 2 sea | 3 sail
  // opts.rngOf: (i) => the stream cone i draws from (default: rng for every cone)
  const n = ends.length, SEG = opts.seg ?? 6, pos = [], end = [], ray = [], idx = [], tint = [], gain = [];
  for (let i = 0; i < n; i++) {
    const r = opts.rngOf ? opts.rngOf(i) : rng;
    const e = ends[i], w = typeof opts.width === 'function' ? opts.width(i) : opts.width ?? (2 + 5 * r()), sd = r(), b = pos.length / 3, tn = opts.tint ? opts.tint(i) : 0, gn = opts.gain ? opts.gain(i) : 1;
    for (let k = 0; k <= SEG; k++) for (const s of [-1, 1]) { pos.push(0, 0, 0); end.push(e.x, e.y, e.z); ray.push(k / SEG, s, w, sd); tint.push(tn); gain.push(gn); }
    for (let k = 0; k < SEG; k++) { const a = b + k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aEnd', new THREE.Float32BufferAttribute(end, 3)); g.setAttribute('aRay', new THREE.Float32BufferAttribute(ray, 4)); g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 1)); g.setAttribute('aGain', new THREE.Float32BufferAttribute(gain, 1)); g.setIndex(idx);
  const uniforms = Object.assign({ uShaft: { value: opts.strength ?? 0.12 }, uDustK: { value: opts.dust ?? 0 }, uWide: { value: opts.wide ?? 0.045 } }, style.uniforms);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: SHAFT_VS, fragmentShader: SHAFT_FS, defines: { NO_DERIV: 1 }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'shafts';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// SHAFT DUST. What a shaft is made of: flecks living inside cones from the hole, thick at each cone's core and
// in clumps along it (with gaps between), drifting outward from the hole and turning. Each fleck is one colour,
// its cone's (the piece of harbour that cone carries), and is drawn as a streak along its motion relative to the
// eye (uVel, set by the world from the flight), so flecks near a fast camera become short bright dashes.
//   cones: [{ end: Vector3 (room space, where the cone's axis meets the wall), tan, tint 1 sky | 2 sea | 3 sail, gain }]
//   opts: { count, size, reach (m from the hole), speed (m/s outward) }.   Call mesh.userData.setSize(renderer) each frame.
// ---------------------------------------------------------------------------------------------------------
const FLECK_VS = /* glsl */`
  ${STREAK_GLSL}
  attribute vec4 aCone, aFl; attribute vec2 aTG;      // aCone: axis (unit, from the hole), tan;  aFl: d0, radial fraction, angle, seed;  aTG: tint, gain
  uniform vec3 uHole, uSky, uSea, uSailA, uVel; uniform vec2 uRes; uniform float uTime, uGain, uFleck, uReach, uOut, uDustA;
  varying vec3 vC; varying vec2 vQ;
  void main(){
    vec3 ax = aCone.xyz, b1 = cross(ax, vec3(0., 1., 0.)); b1 /= max(length(b1), 1e-3); vec3 b2 = cross(ax, b1);
    float d = 3. + mod(aFl.x + uTime*uOut*(0.7 + 0.6*aFl.w), uReach);
    float ang = aFl.z + 0.05*uTime*(aFl.w - 0.5), rr = d*aCone.w*aFl.y;
    vec3 c = uHole + ax*d + (b1*cos(ang) + b2*sin(ang))*rr + vec3(0., 0.35*sin(uTime*0.6 + aFl.w*40.), 0.3*sin(uTime*0.45 + aFl.w*23.));
    float tw = 0.35 + 0.65*abs(sin(uTime*(0.5 + 1.6*aFl.w) + aFl.w*61.));               // a flat fleck turning in its ray
    vec3 tint = aTG.x < 1.5 ? uSky : aTG.x < 2.5 ? uSea*1.15 : uSailA*1.4;
    float core = 1. - 0.6*aFl.y;
    vC = mix(vec3(1.), tint, smoothstep(2., 9., d))*(aTG.y*uGain*tw*core*uDustA*smoothstep(3., 9., d)*(1. - smoothstep(uReach*0.8, uReach, d)));
    vec4 mv = viewMatrix*vec4(c, 1.), clip = projectionMatrix*mv;
    float px = max((0.02 + 0.05*aFl.w*aFl.w)*uFleck*projectionMatrix[1][1]/max(-mv.z, 0.2)*uRes.y*0.5, 0.75);
    float sl; vec2 off = streakOff(clip, projectionMatrix*viewMatrix*vec4(c + uVel, 1.), position.xy, px, uRes, sl);
    px = min(px, 1.5 + 0.002*uRes.y);
    off = streakOff(clip, projectionMatrix*viewMatrix*vec4(c + uVel, 1.), position.xy, px, uRes, sl);
    vC *= (1. + 1.6*smoothstep(2., 14., sl))/sqrt(1. + 0.2*sl/max(px, 0.5));
    vQ = position.xy;
    clip.xy += off*2./uRes*clip.w;
    if (uDustA < 0.004) clip = vec4(2., 2., 2., 1.);
    gl_Position = clip;
  }`;
const FLECK_FS = /* glsl */`
  uniform float uExpK;
  varying vec3 vC; varying vec2 vQ;
  void main(){
    float a = 1. - smoothstep(0.3, 1., length(vQ));
    gl_FragColor = vec4(vC*a*1.35*uExpK/0.6, 1.);
  }`;
export function makeShaftDust(style, rng, cones, opts = {}) {
  const n = opts.count ?? 8000, reach = opts.reach ?? 130, U = style.uniforms;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const cone = new Float32Array(n * 4), fl = new Float32Array(n * 4), tg = new Float32Array(n * 2);
  let tot = 0; for (const c of cones) tot += c.gain * (0.4 + c.tan);
  // clumps: each cone has its own run of thick and thin stretches along its length
  const clump = cones.map(() => Array.from({ length: 24 }, () => rng() ** 2.2));
  let i = 0;
  for (let k = 0; k < cones.length && i < n; k++) {
    const c = cones[k], ax = new THREE.Vector3().subVectors(c.end, HOLE).normalize();
    const m = k === cones.length - 1 ? n - i : Math.min(n - i, Math.round(n * c.gain * (0.4 + c.tan) / tot));
    for (let j = 0; j < m; j++, i++) {
      let d0 = 0;
      for (let tries = 0; tries < 6; tries++) { d0 = rng() * reach; if (rng() < 0.12 + 0.88 * clump[k][Math.floor(d0 / reach * 24) % 24]) break; }
      cone[i * 4] = ax.x; cone[i * 4 + 1] = ax.y; cone[i * 4 + 2] = ax.z; cone[i * 4 + 3] = c.tan;
      fl[i * 4] = d0; fl[i * 4 + 1] = Math.abs(rng() + rng() + rng() - 1.5) / 1.5 * (0.75 + 0.5 * rng()); fl[i * 4 + 2] = rng() * 6.2832; fl[i * 4 + 3] = rng();
      tg[i * 2] = c.tint; tg[i * 2 + 1] = c.gain;
    }
  }
  g.setAttribute('aCone', new THREE.InstancedBufferAttribute(cone, 4)); g.setAttribute('aFl', new THREE.InstancedBufferAttribute(fl, 4)); g.setAttribute('aTG', new THREE.InstancedBufferAttribute(tg, 2));
  g.instanceCount = n;
  const uniforms = { uHole: U.uHole, uSky: U.uSky, uSea: U.uSea, uSailA: U.uSailA, uTime: U.uTime, uGain: U.uGain, uExpK: U.uExpK,
    uVel: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2(1280, 720) }, uFleck: { value: opts.size ?? 1 }, uReach: { value: reach }, uOut: { value: opts.speed ?? 4 }, uDustA: { value: 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: FLECK_VS, fragmentShader: FLECK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'shaft-dust';
  const sz = new THREE.Vector2();
  mesh.userData.setSize = (renderer) => { if (renderer) { renderer.getDrawingBufferSize(sz); uniforms.uRes.value.copy(sz); } };
  return mesh;
}
