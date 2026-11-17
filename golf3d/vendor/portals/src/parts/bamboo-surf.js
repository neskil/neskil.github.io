// THE PARTING GROVE: hero set piece for "bamboo-surf" (The Bamboo Sea).
//
// A stand of ~800 giant moso bamboo, 112 m across, at the head of a gully under a ridge crest: the
// forest moving as one body. ONE wind function (GLSL chunk hero.wind.glsl, mirrored in JS as
// hero.wind.gust) bows every culm in strict sequence as gust fronts cross the stand (curving from the
// base, lagging up the stem, whipping at the tip), streams the crown plumes flat and turns them to
// their pale celadon undersides so each front is a visible travelling band from above, opens the
// canopy ceiling, drops lime shafts in behind the front, flattens the ferns and carries the torn
// leaves. THE PARTING is the scripted beat: a wall of leaves runs up the gully at 34 m/s and the
// culms on both banks splay forward and outward, pair after pair, opening a V of sky 20 m wide with
// six golden snub-nosed monkeys clinging to the bent stems, tails streaming.
//
// ORIENTATION  origin = gully floor at the mouth of the parting, +Y up. The camera travels toward -Z
//              (it arrives from +Z, the front): the lane is the line x = laneX(z), 9 m wide, climbing
//              to a ridge crest at z = -46. The wind blows toward local (+0.71, 0, -0.71): from
//              behind-left to ahead-right, as in the brief (heading 055, wind toward 100). The sun
//              belongs on the LEFT (-X), a little behind (+Z), 25-45 degrees up.
// SIZE         radius 56 m, height ~40 m (13 m of ridge + 22-26 m culms + nodding plumes).
// COST         ~139k triangles, 10 draw calls, ~210 ms build, one 512 px canvas atlas, no lights, no render targets.
//              near culms 260 x 120, far culms 560 x 40, plumes ~3,300 x 18, canopy shell 3.2k,
//              leaves 9k, ferns 1,300 x 8, ground 4.6k, boulders 1.3k, monkeys 6 x ~640, shafts.
//
// DRIVING IT   hero.setProgress(u)   the world's u every frame. The parting launches at opts.uPart
//                                    (0.565) and runs on u (seconds = (u - uPart) x opts.duration):
//                                    leaf wall and front cross the 52 m zone in 1.5 s, the V is held
//                                    3 s, then springs shut over 2.5 s.
//              hero.setParting(sec)  the same clock in seconds directly (< 0 closed; null = demo).
//              hero.setWind(k)       0..1.5 multiplier on every gust (default 1).
//              hero.setSun(gain)     multiplier on the direct sun of all materials here.
//              hero.plant(list, o)   more bamboo with the SAME materials and wind, so waves run through
//                                    the whole world unbroken: list = [{ x, y, z, h?, r?, age?, near? }]
//                                    in hero-local space; returns a Group already added to hero.object.
//              hero.heightAt(x, z)   the local terrain (gully + ridge), hero.laneX(z) the lane centre.
//              hero.wind             { glsl, uniforms, gust(x, z, time) -> [swell, ripple] 0..1, dir }
//                                    to drive ferns, canopy shells, rain or creatures elsewhere.
//              Until setProgress/setParting is called the parting plays an 18 s demo loop on time
//              (launch 9.5 s, open 11-14 s, shut by 16.5 s).
//
// OPTS         palette  [jade, lime, depth blue-green, celadon, slate, white, gold-orange] (brief order)
//              hour     'storm' (default) | 'noon' (no sun, blue-green, silver wave faces) |
//                       'evening' (amber shafts) | 'night' (moon-white shafts, silver crowns)
//              season   'summer' (default) | 'spring' (a third of the foliage yellowed, the gale carries
//                       gold leaves) | 'snow' (crowns loaded white and bowed, white flakes in the gusts)
//              weather  alias of hour. density 1 (0.5-1.3 scales culm count; x ctx.quality.detail for
//              the far set, leaves and ferns only). monkeys true. ground true (false: bring your own
//              terrain and pass heightFn(x, z)). uPart 0.565, duration 41.
//
// ANCHORS (local space)
//   flyThrough     ordered camera line: 3 m over the gully floor, then the 30 degree climb through the
//                  V and out 6 m above the crowns. Clear by >= 6 m of every culm below the canopy; in
//                  the crown layer it is clear ONLY while the parting is open (that is the beat).
//   partingStart / partingEnd   mouth and head of the parting on the lane floor
//   portalSeat     { position, facing }: where a 14 m ring would stand on the crest beyond the stand,
//                  lower edge 1 m down in the crowns, facing back toward the climb
//   viewpoints     { mouth, insideV, above, flank }: four places to stand and look at the stand from, for the set-piece
//                  viewer only (the world places nothing by them)
//   monkeys        six grip points (at rest) on the parting culms; windDir; crownTop (y of plume tops
//                  on the crest); sunSide (unit vector toward where the sun should be)
//
// LIGHTING     ShaderMaterials with lights: true and fog: true: the scene's FIRST DirectionalLight is
//              the sun (raking from the left), HemisphereLight + AmbientLight the slate fill. Below the
//              crowns the sun only reaches surfaces through the gust shutter. Wants a dim blue-green
//              fog (#1F4B4A) in the trunk space, hemisphere ~0.6-1.0, sun 2.5-3.5, gentle bloom.
//
// WORLD HOOKS  opts.lane { amp, freq, ph } fixes the lane's snake; hero.own is the group of the stand's own meshes
//              (hide it when the stand is far behind; planted bamboo stays). hero.leaves follows hero.setLeafCenter(v)
//              (the treadmill box, uniforms.uBox, wraps round that point). hero.addFerns(list, { fronds, segs }),
//              hero.addShafts(tops) (w < 0 = a shaft that never closes, gain = brightness) and hero.groundMaterial() build
//              more of the same with the same materials. hero.setGlade(i, x, z, r): up to eight glades where the sun always
//              reaches the floor (a pool of lit ferns). fernCover(x, z) (exported) says where the fern layer stands and where
//              the litter paths run; the ground shader draws the same map. Every near culm gets a soft shade at its foot.
//              hero.setFill(shut, fill): how much sun leaks through the shut canopy (0.22) and the gain on the trunk-space
//              ambient (1.35). hero.addMonkeys([{ x, z, s, az, scale, h?, share? }]) plants veteran culms with a clinging
//              monkey at arc length s up each (share: index of an earlier entry whose culm this one rides too).
import * as THREE from 'three';

const DEF_PALETTE = ['#3E8E63', '#B9D94A', '#1F4B4A', '#A9CFA0', '#59636E', '#EDF1F2', '#E3912B'];
const PART_Z0 = 6, PART_LEN = 52, PART_SPEED = 34;

// ------------------------------------------------------------------------------------------------
// ONE WIND FUNCTION. Everything that moves includes this chunk.
//   uWind  xy = unit wind direction in local xz, z = strength, w = phase offset (per seed)
//   uPart  x = metres the parting front has run up the gully, y = release 0..1, z = zone start z, w = length
//   uLane  x = amplitude, y = frequency, z = phase of the lane's snake: laneX(z) = x sin(z y + z)
// ------------------------------------------------------------------------------------------------
export const GLSL_WIND = /* glsl */`
  uniform float uTime;
  uniform vec4 uWind;
  uniform vec4 uPart;
  uniform vec4 uLane;
  uniform vec4 uBand;
  float bsPulse(float ph){
    float r = smoothstep(0.0, 0.2, ph);
    float d = max(ph - 0.2, 0.0);
    return r*exp(-d*4.2)*(0.8 + 0.2*cos(d*21.0))*(1.0 - smoothstep(0.86, 1.0, ph));
  }
  // x: swell (110 m apart, 26 m/s), y: ripple (30 m, 30 m/s); both 0..1, fast rise, damped spring-back
  vec2 bsGust(vec2 p, float t){
    float a = dot(p, uWind.xy);
    float c = dot(p, vec2(-uWind.y, uWind.x));
    float w = sin(c*0.045 + uWind.w)*7.0 + sin(c*0.11 + t*0.2 + uWind.w*2.0)*2.5;
    float s = bsPulse(fract((26.0*t - a - w)/110.0 + uWind.w*0.31));
    float r = bsPulse(fract((30.0*t - a + w*0.4)/30.0 + 0.37));
    return vec2(s, r);
  }
  // THE SWELL the world sends across its crest flight (uBand: xy the centre of the circle its fronts lie on, z the
  // radius of one of them, w on): a front every 110 m, without end. How hard a culm is bowed by it: a fast rise at the
  // front, a slow spring-back
  float bsSwell(vec2 p){
    if (uBand.w <= 0.0) return 0.0;
    vec2 e = p - uBand.xy;
    float cW = atan(e.y, e.x)*uBand.z;
    float s = uBand.z - length(e) - (sin(cW*0.045 + uWind.w)*7.0 + sin(cW*0.11 + uTime*0.2 + uWind.w*2.0)*2.5 + sin(cW*0.017 + uWind.w*1.7)*12.0);
    float sm = s - 110.0*floor(s/110.0);
    return uBand.w*smoothstep(-2.0, 9.0, sm)*exp(-max(sm - 9.0, 0.0)/26.0)*(1.0 - smoothstep(60.0, 100.0, sm));
  }
  uniform vec3 uGlades[16];
  float bsGlade(vec2 p){
    float m = 0.0;
    for (int i = 0; i < 16; i++) m = max(m, 1.0 - smoothstep(uGlades[i].z*0.45, uGlades[i].z, length(p - uGlades[i].xy)));
    return m;
  }
  // 1 under the fern layer, 0 on the narrow litter paths that wander through it (mirrored in JS as fernCover)
  float bsFernCover(vec2 p){
    vec2 w = p + vec2(sin(p.y*0.21 + 1.3), sin(p.x*0.17 + 4.1))*2.2;
    float a = sin(w.x*0.39 + 0.8*sin(w.y*0.23));
    float b = sin(w.y*0.33 + 0.9*sin(w.x*0.19) + 2.0);
    float g = sin(p.x*0.071 + p.y*0.043 + 1.0)*sin(p.y*0.063 - p.x*0.031);
    return smoothstep(0.06, 0.2, abs(a*b) + 0.35*max(g, 0.0));
  }
  float bsLaneX(float z){ return uLane.x*sin(z*uLane.y + uLane.z); }
  // xy: unit direction of the splay (forward and outward from the lane), z: opening 0..1.1
  vec3 bsPart(vec2 p, float q){
    float a = uPart.z - p.y;
    float dx = p.x - bsLaneX(p.y);
    float m = smoothstep(-6.0, 6.0, a)*(1.0 - smoothstep(uPart.w - 8.0, uPart.w + 6.0, a))*(1.0 - smoothstep(13.0, 24.0, abs(dx)));
    float x = max((uPart.x - a - 5.0*q)/9.0, 0.0);
    float o = (1.0 - exp(-2.4*x)*cos(3.4*x))*m*(1.0 - uPart.y);
    return vec3(normalize(vec2(clamp(dx/3.0, -1.0, 1.0)*0.9, -0.5)), o);
  }
  // 1 on the floor of the gully head once the parting has opened the crowns above it (light floods in behind the front)
  float bsPartLit(vec2 p){
    float a = uPart.z - p.y;
    return (1.0 - uPart.y)*smoothstep(-14.0, 6.0, uPart.x - a)*smoothstep(-8.0, 4.0, a)*(1.0 - smoothstep(64.0, 82.0, a))*(1.0 - smoothstep(18.0, 32.0, abs(p.x - bsLaneX(p.y))));
  }
  // A culm as a progressive curve. base: foot. P: (height, suppleness, lean azimuth, lean at tip in rad).
  // s: arc length up the stem. Angle at s = tip angle x (s/H)^1.6, integrated so length is kept;
  // the gust is read later the higher up the stem, so the bow travels to the tip and whips.
  // Returns the point; tang = stem direction there; wg = (swell, ripple, parting) felt at this height.
  vec3 bsCulm(vec3 base, vec4 P, float s, out vec3 tang, out vec3 wg){
    float q = clamp(s/max(P.x, 1.0), 0.0, 1.15);
    vec2 g = bsGust(base.xz, uTime - 0.42*q);
    vec3 pt = bsPart(base.xz, q);
    float calm = 1.0 - 0.85*pt.z;
    vec2 A = uWind.xy*((0.50*g.x + 0.12*g.y)*P.y*uWind.z*calm);
    A += pt.xy*(pt.z*0.82*min(P.y, 1.1));
    A += uWind.xy*(0.5*bsSwell(base.xz)*min(P.y, 1.2)*min(uWind.z, 1.0));
    A += vec2(sin(uTime*0.9 + base.x*0.31 + P.z*3.0), cos(uTime*0.73 + base.z*0.27 + P.z))*(0.03*P.y);
    A += vec2(cos(P.z), sin(P.z))*P.w;
    float ang = length(A);
    vec2 d = A/max(ang, 1e-4);
    float th = min(ang*pow(max(q, 1e-4), 1.6), 1.35);
    float a2 = th*th;
    float hx = s*th*(1.0/2.6 - a2/34.8);
    float hy = s*(1.0 - a2/8.4 + a2*a2/177.6);
    tang = vec3(d.x*sin(th), cos(th), d.y*sin(th));
    wg = vec3(g, pt.z);
    return base + vec3(d.x*hx, hy, d.y*hx);
  }
`;

// THE SWELL BAND (after GLSL_WIND): a band of leaves turned to their pale undersides behind each front of the swell
// (a front every 110 m, without end: bsSwell above bows the culms in the same places). q = how far behind the nearest
// front ahead of it a point is, in band depths (21 m close by, deeper far off so it still reads there); bsBandK(q) = 0..1,
// rising over the first third and dying away to the back: no hard edge on either side.
// bsBandHue(celadon): the colour of turned leaves at luminance 1: celadon, a little greener, whatever the light.
export const GLSL_BAND = /* glsl */`
  float bsBandQ(vec2 p, float dist, vec2 c, float R){
    vec2 e = p - c; float r = length(e);
    float cW = atan(e.y, e.x)*R;
    float wv = sin(cW*0.045 + uWind.w)*7.0 + sin(cW*0.11 + uTime*0.2 + uWind.w*2.0)*2.5 + sin(cW*0.017 + uWind.w*1.7)*12.0;
    float s = R - r - wv;
    s -= 110.0*floor(s/110.0);
    return s/(21.0*(1.0 + min(dist, 1400.0)/520.0));
  }
  float bsBandK(float q){ return smoothstep(0.0, 0.36, q)*(1.0 - smoothstep(0.44, 1.0, q)); }
  vec3 bsBandHue(vec3 cel){ vec3 h = cel*vec3(0.9, 1.08, 0.9); return h/max(dot(h, vec3(0.3, 0.55, 0.15)), 0.05); }
`;

// Scene lights (first DirectionalLight = sun) for the fragment shaders, plus small helpers.
export const GLSL_LIGHT = /* glsl */`
  #include <common>
  #include <lights_pars_begin>
  uniform float uSunGain;
  uniform vec3 uSunTint;
  vec3 bsSunDir(){
    #if NUM_DIR_LIGHTS > 0
      return directionalLights[0].direction;
    #else
      return vec3(0.0, 1.0, 0.0);
    #endif
  }
  vec3 bsSunCol(){
    #if NUM_DIR_LIGHTS > 0
      return directionalLights[0].color*uSunTint*(uSunGain*0.3183);
    #else
      return vec3(0.0);
    #endif
  }
  vec3 bsAmb(vec3 n){
    vec3 irr = ambientLightColor;
    #if NUM_HEMI_LIGHTS > 0
      irr += getHemisphereLightIrradiance(hemisphereLights[0], n);
    #endif
    return irr*0.3183;
  }
  float bsHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
  float bsNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
    return mix(mix(bsHash(i), bsHash(i + vec2(1.0, 0.0)), f.x), mix(bsHash(i + vec2(0.0, 1.0)), bsHash(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const lightU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.lights);
const lin = (hex) => new THREE.Color(hex);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fract = (x) => x - Math.floor(x);

// JS mirror of bsFernCover: where the fern layer stands (1) and where the litter paths run (0)
export function fernCover(x, z) {
  const wx = x + Math.sin(z * 0.21 + 1.3) * 2.2, wz = z + Math.sin(x * 0.17 + 4.1) * 2.2;
  const a = Math.sin(wx * 0.39 + 0.8 * Math.sin(wz * 0.23)), b = Math.sin(wz * 0.33 + 0.9 * Math.sin(wx * 0.19) + 2.0);
  const g = Math.sin(x * 0.071 + z * 0.043 + 1.0) * Math.sin(z * 0.063 - x * 0.031);
  return sstep(0.06, 0.2, Math.abs(a * b) + 0.35 * Math.max(g, 0));
}

// JS mirror of bsPulse / bsGust (for creatures and sound the world drives on the CPU)
function jsPulse(ph) {
  const r = sstep(0, 0.2, ph), d = Math.max(ph - 0.2, 0);
  return r * Math.exp(-d * 4.2) * (0.8 + 0.2 * Math.cos(d * 21)) * (1 - sstep(0.86, 1, ph));
}

// ------------------------------------------------------------------------------------------------
// CULMS: instanced tubes bent in the vertex shader; nodes, wax rings, sheaths, lichen in the fragment.
// ------------------------------------------------------------------------------------------------
function culmMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true,
    uniforms: { ...lightU(), ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec3 aBase; attribute vec4 aCulm; attribute vec4 aLook;
      uniform float uPx; uniform vec4 uBreak, uOld;
      varying vec3 vN, vV, vG; varying vec4 vS; varying vec3 vK; varying vec2 vBk;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        float q = position.y;
        float s = q*aCulm.x;
        vec3 T, wg;
        vec3 c = bsCulm(aBase, aCulm, s, T, wg);
        float r = aLook.x*(1.0 - 0.82*q*sqrt(q))*(1.0 + 0.22*exp(-s*2.2));
        vec3 n1 = normalize(cross(T, vec3(1.0, 0.0, 0.0)));
        vec3 n2 = cross(n1, T);
        vec3 nrm = n1*position.x + n2*position.z;
        vec4 mvPosition = modelViewMatrix*vec4(c, 1.0);
        float old = uOld.w*(1.0 - smoothstep(uOld.z*0.7, uOld.z, length(aBase.xz - uOld.xy)));
        float rr = max(r, (0.75 + 0.25*min(old, 2.0))*uPx*length(mvPosition.xyz));          // never thinner than 1.5 px (the lit clump's veterans 2.5: they are the mark at the end of the aisle)
        vec3 nv = normalize(normalMatrix*nrm);
        mvPosition.xyz += nv*rr;
        vN = nv; vV = mvPosition.xyz; vG = wg; vG.x = max(vG.x, bsGlade(aBase.xz)*0.9);
        vS = vec4(s, atan(position.z, position.x + 1e-5), aLook.y, aLook.z);
        vK = vec3(q, r/rr, aLook.w);
        vBk = vec2(uBreak.w*(1.0 - smoothstep(uBreak.z*0.5, uBreak.z, length(aBase.xz - uBreak.xy))), old);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uDeep, uCeladon, uWhite, uSlate;
      uniform float uSnow, uBreakSun; uniform vec2 uFill;
      varying vec3 vN, vV, vG; varying vec4 vS; varying vec3 vK; varying vec2 vBk;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        float s = vS.x, age = vS.z, seed = vS.w;
        float n = s/vK.z + seed*7.0;
        float fw = fwidth(n);
        float detail = 1.0 - smoothstep(0.22, 0.7, fw);
        float fb = fract(n);
        float f0 = abs(fract(n + 0.5) - 0.5);
        float node = (1.0 - smoothstep(0.012, 0.035 + fw, f0))*detail;
        float wax = smoothstep(0.87, 0.93, fb)*(1.0 - smoothstep(0.955, 0.985, fb))*detail;
        // colour by age: powder blue-green shoots of this year, jade, then greyer and lichened, then straw
        vec3 young = mix(uJade, vec3(0.42, 0.74, 0.66), 0.62);
        vec3 old = mix(uJade, vec3(0.42, 0.44, 0.27), 0.6);
        vec3 dead = vec3(0.50, 0.44, 0.30);
        vec3 alb = mix(young, uJade, smoothstep(0.1, 0.35, age));
        alb = mix(alb, old, smoothstep(0.55, 0.9, age));
        alb = mix(alb, dead, smoothstep(1.05, 1.2, age));
        float blot = bsNoise(vec2(vS.y*1.6 + seed*31.0, s*0.9)) * bsNoise(vec2(vS.y*4.0, s*3.1 + seed*9.0));
        alb = mix(alb, vec3(0.55, 0.60, 0.50), smoothstep(0.22, 0.5, blot)*smoothstep(0.45, 0.95, age)*0.7);     // lichen
        alb *= 0.82 + 0.3*fb*detail + 0.16*(bsNoise(vec2(vS.y*9.0, s*0.35 + seed*5.0)) - 0.5);                  // internode gradient, streaks
        alb = mix(alb, uWhite*0.7, wax*(0.5 - 0.3*smoothstep(0.6, 1.0, age)));
        alb *= 1.0 - 0.72*node;
        float sh = bsNoise(vec2(vS.y*2.5 + seed*17.0, 3.0))*0.7;
        alb = mix(alb, vec3(0.20, 0.13, 0.07)*(0.7 + 0.6*bsNoise(vec2(vS.y*14.0, s*2.0))), 1.0 - smoothstep(0.35 + sh, 0.6 + sh, s)); // brown sheath at the foot
        alb = mix(alb, vec3(0.20, 0.36, 0.14), (1.0 - smoothstep(0.4, 2.6, s))*smoothstep(0.35, 0.75, bsNoise(vec2(vS.y*3.0 + seed, s*2.0)))*0.6);  // moss
        vec3 N = normalize(vN), V = normalize(-vV), L = bsSunDir();
        float crown = smoothstep(0.5, 0.92, vK.x);
        float open = mix(uFill.x + (1.0 - uFill.x)*smoothstep(0.05, 0.75, vG.x + vG.z), 1.0, crown);     // the gust is the shutter (uFill.x: what leaks through when it is shut)
        float lit = clamp(vBk.y, 0.0, 4.0);                                                // (the clump the world stands in a shaft of its own: its stems take the whole beam)
        vec3 sun = bsSunCol()*mix(mix(vec3(1.0), uLime*1.9, 0.6), vec3(1.0), max(crown, vBk.x))*mix(max(open, min(lit, 1.0)), 1.0, vBk.x)*(1.0 + uBreakSun*vBk.x + lit);     // (vBk.x: under the break in the cloud the sun is whole)
        float ndl = max(dot(N, L), 0.0);
        vec3 amb = bsAmb(N)*mix(0.7*uFill.y, 1.0, crown) + (uJade*0.7 + uDeep + uLime*0.12)*bsAmb(vec3(0.0, 1.0, 0.0))*(0.8*uFill.y)*(1.0 - crown);
        vec3 col = alb*(amb + sun*(ndl*0.9 + 0.1));
        vec3 Hh = normalize(L + V + vec3(0.0, 1e-4, 0.0));
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fres = (1.0 - ndv)*(1.0 - ndv);
        col += sun*pow(max(dot(N, Hh), 0.0), 36.0)*0.55*(1.0 - 0.5*node);                // wet highlight
        col += bsAmb(vec3(0.0, 1.0, 0.0))*fres*fres*0.35*mix(0.5, 1.0, crown);            // wet sheen from the sky
        col = mix(col, uWhite*(amb + sun*0.6)*0.8, uSnow*smoothstep(0.2, 0.8, N.y*0.0 + blot*2.0)*0.35);
        col = mix(col, mix(uDeep, uJade, 0.4)*(amb*1.3 + sun*0.3), (1.0 - vK.y)*0.4);                    // widened far stems read thinner
        col *= mix(0.3, 1.0, max(smoothstep(0.1, 1.9, s), 0.5*min(lit, 1.0)));                                                   // every culm stands in its own shade
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// tube: unit circle in xz, y = 0..1 with rings crowded toward the tip where the curve is tight
function culmGeometry(sides, rings) {
  const pos = [], idx = [];
  for (let j = 0; j <= rings; j++) {
    const y = Math.pow(j / rings, 0.9);
    for (let i = 0; i < sides; i++) { const a = (i / sides) * Math.PI * 2; pos.push(Math.cos(a), y, Math.sin(a)); }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) {
    const a = j * sides + i, b = j * sides + (i + 1) % sides, c = a + sides, d = b + sides;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

function instAttr(geo, name, arr, size) { geo.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), size)); }

function culmMesh(list, sides, rings, mat) {
  const g = culmGeometry(sides, rings);
  const base = [], culm = [], look = [];
  for (const c of list) {
    base.push(c.x, c.y, c.z); culm.push(c.h, c.stiff, c.leanAz, c.lean); look.push(c.r, c.age, c.seed, c.node);
  }
  instAttr(g, 'aBase', base, 3); instAttr(g, 'aCulm', culm, 4); instAttr(g, 'aLook', look, 4);
  g.instanceCount = list.length;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------
// ATLAS (512 px canvas): left half a branch spray of lance leaves, right-top a feathery tip plume,
// right-bottom strip a fern frond. Red = leaf brightness, alpha = cut-out.
// ------------------------------------------------------------------------------------------------
function makeAtlas(rng) {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  const leaf = (x, y, ang, len, wid, lum) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    const v = Math.round(lum * 255);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath(); g.moveTo(0, 0);
    g.quadraticCurveTo(len * 0.3, -wid, len, 0); g.quadraticCurveTo(len * 0.3, wid, 0, 0); g.fill();
    g.strokeStyle = `rgba(255,255,255,0.35)`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.9, 0); g.stroke();
    g.restore();
  };
  // a twig from (x0,y0) heading `dir` with small lance leaves fanned at every joint
  const twig = (x0, y0, dir, len, depth, lw) => {
    const steps = Math.max(3, Math.round(len / (depth > 0 ? 26 : 11)));
    let x = x0, y = y0, d = dir;
    for (let i = 0; i < steps; i++) {
      const nx = x + Math.cos(d) * len / steps, ny = y + Math.sin(d) * len / steps;
      g.strokeStyle = 'rgb(110,110,110)'; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
      x = nx; y = ny; d += rng.range(-0.1, 0.1);
      const t = (i + 1) / steps;
      if (depth > 0 && i > 0 && rng.chance(0.72)) {
        const sgn = i % 2 ? 1 : -1;
        twig(x, y, d + sgn * rng.range(0.45, 0.9), len * (0.36 - 0.16 * t) * rng.range(0.8, 1.2), depth - 1, Math.max(1.2, lw * 0.55));
      }
      if (depth === 0) {
        const n = rng.int(2, 3);
        for (let k = 0; k < n; k++) leaf(x, y, d + rng.range(-1.1, 1.1), rng.range(16, 28), rng.range(3.0, 4.8), rng.range(0.5, 1));
      }
    }
    for (let k = 0; k < 4; k++) leaf(x, y, d + (k - 1.5) * 0.42 + rng.range(-0.1, 0.1), rng.range(18, 30), rng.range(3.2, 5.0), rng.range(0.6, 1));
  };
  // a ragged spindle so no card ever shows a straight edge: base at (cx, yb), tip at (cx, yt)
  const spindle = (cx, yb, yt, hw) => {
    g.beginPath(); g.moveTo(cx, yb);
    const pts = [];
    for (let k = 1; k < 24; k++) { const t = k / 24; pts.push([t, hw * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.75) * (k % 2 ? 1 : rng.range(0.55, 0.85))]); }
    for (const [t, w] of pts) g.lineTo(cx + w, yb + (yt - yb) * t);
    g.lineTo(cx, yt);
    for (const [t, w] of pts.reverse()) g.lineTo(cx - w * rng.range(0.85, 1), yb + (yt - yb) * t);
    g.closePath(); g.clip();
  };
  // left half: branch spray growing up from the bottom centre (canvas y is down)
  g.save(); spindle(128, 510, 4, 118);
  twig(128, 510, -Math.PI / 2, 470, 2, 4);
  for (const a of [-0.3, 0.3, -0.16, 0.16]) twig(128, 510, -Math.PI / 2 + a, rng.range(300, 420), 2, 2.5);
  for (const a of [-0.55, 0.55]) twig(128, 470, -Math.PI / 2 + a, 200, 1, 2);
  g.restore();
  // right top (256..512 x 0..384): feathery tip plume, denser and finer
  g.save(); spindle(384, 382, 4, 116);
  twig(384, 382, -Math.PI / 2, 350, 2, 3.5);
  for (const a of [-0.34, 0.34, -0.18, 0.18]) twig(384, 382, -Math.PI / 2 + a, rng.range(230, 320), 2, 2.5);
  for (const a of [-0.6, 0.6]) twig(384, 340, -Math.PI / 2 + a, 150, 1, 2);
  g.restore();
  // right bottom (256..512 x 388..512): a fern frond lying along +x
  g.save(); g.beginPath(); g.rect(258, 388, 252, 122); g.clip();
  g.strokeStyle = 'rgb(110,110,110)'; g.lineWidth = 3; g.beginPath(); g.moveTo(258, 450); g.lineTo(508, 450); g.stroke();
  for (let i = 0; i < 26; i++) {
    const t = i / 25, x = 262 + t * 240, L = 56 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) * (1 - 0.35 * t) + 5;
    leaf(x, 450, -Math.PI / 2 + 0.35, L, 5.5, rng.range(0.6, 1)); leaf(x, 450, Math.PI / 2 - 0.35, L, 5.5, rng.range(0.6, 1));
  }
  g.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  return tex;
}

// ------------------------------------------------------------------------------------------------
// PLUMES: 3 blades x 3 segments (18 triangles) of alpha-cut leaf spray riding the culm's own curve,
// arching, nodding, hinging downwind and showing their pale undersides with each gust.
// ------------------------------------------------------------------------------------------------
function plumeGeometry() {
  const pos = [], uv = [], idx = [];
  const blades = [0, Math.PI / 3, -Math.PI / 3];
  blades.forEach((phi, b) => {
    const cx = Math.cos(phi), sx = Math.sin(phi), o = pos.length / 3;
    for (let j = 0; j <= 3; j++) for (let i = 0; i < 2; i++) {
      const x = (i - 0.5), y = j / 3;
      pos.push(cx * x, y, sx * x); uv.push(b === 1 ? 1 - i : i, y);
    }
    for (let j = 0; j < 3; j++) { const a = o + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function plumeMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec3 aBase; attribute vec4 aCulm; attribute vec4 aSpray; attribute vec4 aTint;
      uniform vec4 uFlower, uBreak, uBreak2;
      varying vec2 vUv; varying vec3 vN, vV; varying vec4 vF; varying vec3 vBand;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      ${GLSL_BAND}
      void main(){
        float kind = aSpray.w, y = position.y, L = aSpray.z;
        vec3 T, wg;
        vec3 c = bsCulm(aBase, aCulm, aSpray.x*aCulm.x, T, wg);
        vec3 outw = vec3(cos(aSpray.y), 0.0, sin(aSpray.y));
        vec3 ref = vec3(-outw.z, 0.0, outw.x);
        vec3 d0 = normalize(mix(outw*0.85 + T*0.55, T, kind));
        vec3 nrm0 = normalize(cross(ref, d0));
        vec3 side = cross(d0, nrm0);
        float gs = clamp(wg.x + 0.45*wg.y, 0.0, 1.2)*uWind.z*(1.0 - 0.8*wg.z);
        vec3 pt = bsPart(aBase.xz, 1.0);
        float yy = y*sqrt(y);
        vec3 off = d0*y + (side*position.x + nrm0*position.z)*(0.44 + 0.1*kind);
        off += (outw*aTint.y - vec3(0.0, aTint.x, 0.0))*y*y;                              // nod and droop
        off += vec3(uWind.x, -0.12, uWind.y)*(gs*0.62/(1.0 + 0.7*gs)*yy) + vec3(pt.x, 0.1, pt.y)*(pt.z*0.6*yy);   // streaming (capped: a spray keeps its arch in the hardest gust)
        float fl = sin(uTime*(7.0 + aTint.z*5.0) + aTint.z*40.0 + y*5.0)*(0.015 + 0.07*gs + 0.09*pt.z)*y;
        off += nrm0*fl + side*(fl*0.6);
        vec3 p = c + off*L;
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vec3 nw = normalize(nrm0*0.35*sign(nrm0.y + 1e-4) + vec3(0.0, 0.8, 0.0) + d0*0.3 + outw*(0.55*(1.0 - kind)*uBand.w));   // (seen from above, on the crest: a crown is lit on the side its sprays turn to the sun)
        vN = normalize(normalMatrix*nw); vV = mvPosition.xyz;
        vUv = mix(vec2(uv.x*0.48 + 0.01, uv.y*0.98 + 0.01), vec2(0.51 + uv.x*0.48, 0.26 + uv.y*0.73), kind);
        float below = clamp(((modelMatrix*vec4(p, 1.0)).y - cameraPosition.y)/6.0, 0.0, 1.0);
        float flo = uFlower.w*(1.0 - smoothstep(uFlower.z*0.6, uFlower.z, length(aBase.xz - uFlower.xy)))*step(aTint.z, 0.86);
        vF = vec4(clamp(gs + pt.z*0.8, 0.0, 1.0), below, aTint.w, min(aTint.z, 0.999) + 2.0*step(0.25 + 0.5*fract(aTint.z*7.0), flo));   // w: a number per plume, +2 where it has flowered
        // (the same band the world lays over its crown sheet and tufts: see SEA_BAND there)
        vBand = vec3(uBand.w*bsBandK(bsBandQ(aBase.xz, length(mvPosition.xyz), uBand.xy, uBand.z)), max(uBreak.w*(1.0 - smoothstep(uBreak.z*0.5, uBreak.z, length(aBase.xz - uBreak.xy))), uBreak2.w*(1.0 - smoothstep(uBreak2.z*0.5, uBreak2.z, length(aBase.xz - uBreak2.xy)))), uBand.w);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uAtlas;
      uniform vec3 uJade, uLime, uDeep, uCeladon, uWhite, uGold;
      uniform float uSnow, uYellow, uBreakSun; uniform vec2 uFill;
      varying vec2 vUv; varying vec3 vN, vV; varying vec4 vF; varying vec3 vBand;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      vec3 bsBandHue(vec3 cel){ vec3 h = cel*vec3(0.9, 1.08, 0.9); return h/max(dot(h, vec3(0.3, 0.55, 0.15)), 0.05); }
      void main(){
        vec4 tx = texture2D(uAtlas, vUv, -0.8);
        float dist = length(vV);
        float rnd = fract(vF.w), flw = step(1.5, vF.w);
        float clump = bsNoise(vUv*vec2(26.0, 52.0) + rnd*50.0)*0.6 + bsNoise(vUv*vec2(60.0, 120.0))*0.4;   // leaf clumps fixed to the card: far sprays stay feathery
        // seen from under the canopy (vF.y): a spray is bunches of leaves with sky between them, not a stippled card;
        // thin where the blurred cut-out is thin (its edges and tips), and there the sky's light comes through the leaf
        float under = vF.y;
        clump = mix(clump, bsNoise(vUv*vec2(7.0, 15.0) + rnd*50.0)*0.62 + bsNoise(vUv*vec2(17.0, 36.0) + 3.0)*0.38, under);
        float thin = 1.0 - smoothstep(0.28, 0.8, texture2D(uAtlas, vUv, 2.6).a);
        if (tx.a < mix(0.4, 0.16 + 0.42*clump, smoothstep(18.0, 70.0, dist))) discard;
        float lum = max(tx.r/max(tx.a, 0.3), 0.35)*mix(1.0, 0.6 + 0.8*clump, smoothstep(18.0, 70.0, dist));
        float shade = vF.z;                                    // 1 at the crown top, lower inside the crown
        vec3 alb = mix(uDeep*1.1, mix(uJade, uLime, 0.12 + 0.3*shade*rnd), 0.25 + 0.75*shade)*(0.5 + 0.55*lum)*(0.8 + 0.4*fract(rnd*7.31));
        alb = mix(alb, vec3(0.74, 0.66, 0.20)*(0.7 + 0.5*lum), uYellow*step(0.7, rnd)*0.85);
        alb = mix(alb, mix(vec3(0.44, 0.33, 0.09), vec3(0.86, 0.64, 0.17), shade)*(0.45 + 0.6*lum)*(0.8 + 0.4*fract(rnd*7.31)), flw);       // the flowered slope: crowns gone straw-gold
        float tipK = smoothstep(0.4, 0.9, vUv.y)*(0.25 + 0.75*shade);
        alb = mix(alb, uCeladon*(0.76 + 0.3*lum), min(max(vF.x*(1.0 - 0.75*vBand.z)*(0.5 + 0.5*clump)*tipK, vF.y*0.22), 0.55));     // pale undersides on the wave face: the outer, upper leaves only (above the crowns only a little: there the swell band is the pale thing)
        alb = mix(alb, mix(uJade, uLime, 0.72)*(0.62 + 0.5*lum), 0.42*vBand.z*shade*smoothstep(0.3, 0.9, vUv.y)*(1.0 - flw)*(1.0 - 0.8*uSnow));   // above the crown sea the top sprays stand in the open: lime
        alb *= 0.5 + 0.6*vUv.y;                                                              // darker toward the stem, inside the crown
        float sn = uSnow*smoothstep(0.6, 0.97, shade)*smoothstep(0.45, 0.65, clump*0.55 + lum*0.45)*(1.0 - 0.6*vF.x)*smoothstep(0.3, 0.46, rnd);   // a third of the sprays have shed their load
        alb = mix(alb*mix(vec3(1.0), vec3(0.4, 0.66, 0.74), uSnow), uWhite*0.8, sn);
        vec3 N = normalize(vN), V = normalize(-vV), L = bsSunDir();
        float shut = max(0.15, uFill.x + 0.06);
        float open = mix(shut + (1.0 - shut)*smoothstep(0.05, 0.7, vF.x), 1.0, smoothstep(0.35, 0.8, shade));
        vec3 sun = bsSunCol()*mix(open, 1.0, vBand.y)*(1.0 + uBreakSun*vBand.y);            // (vBand.y: under the break in the cloud the sun is whole)
        float ndl = dot(N, L)*0.5 + 0.5;
        float tr = max(dot(V, -L), 0.0); tr = tr*tr*tr;                                   // light through the leaf
        vec3 col = alb*(bsAmb(N)*(0.35 + 0.65*shade) + sun*ndl*ndl*0.9)*mix(1.0, 0.5 + 0.7*thin, under) + uLime*sun*(tr*0.5*lum + vF.y*0.12*lum*(0.2 + 1.6*thin))*(1.0 - 0.8*flw);
        col += mix(uJade, uLime, 0.45 + 0.5*thin)*bsAmb(vec3(0.0, 1.0, 0.0))*(under*thin*(0.35 + 0.65*shade)*(0.5 + 0.6*lum)*(1.0 - 0.8*flw)*(1.0 - 0.7*uSnow));   // back-lit edges
        // in the swell band the leaves are turned over: pale celadon against whatever is round them (lit by the whole sky)
        vec3 lightAll = bsSunCol()*0.405 + bsAmb(vec3(0.0, 1.0, 0.0))*1.5;
        float bandL = clamp(dot(lightAll, vec3(0.3, 0.55, 0.15))*0.3, 0.12, 0.5)*(0.74 + 0.3*shade);
        vec3 bandC = bsBandHue(uCeladon)*min(max(bandL, 1.05*dot(col, vec3(0.3, 0.55, 0.15))), 0.56);
        // only the outer tips of a crown turn (its stems and body stay green), far off as close by: no crown is veiled whole
        col = mix(col, bandC, vBand.x*(0.08 + 0.66*tipK)*(1.0 - 0.5*flw));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// sprays for a list of culms: one nodding tip plume, branch sprays below it
function plumeMesh(list, rng, mat, perNear, perFar, o = {}) {
  const g = plumeGeometry();
  const base = [], culm = [], spray = [], tint = [];
  let n = 0;
  const arch = o.arch ?? 1;                                     // how far the branch sprays arch over and hang
  // o.low: boughs lower down the stem (long, arching, in the shade of the crown), so the canopy has depth from below
  if (o.low) for (const c of list) {
    if (c.age > 1.05 || !c.near) continue;
    for (let i = 0; i < o.low; i++) {
      base.push(c.x, c.y, c.z); culm.push(c.h, c.stiff, c.leanAz, c.lean);
      spray.push(rng.range(0.42, 0.66), rng.range(0, 6.2832), rng.range(4.6, 6.4) * (c.plume ?? c.h / 24), 0);
      tint.push(rng.range(0.4, 0.8), rng.range(0.05, 0.25), rng(), rng.range(0.3, 0.55));
      n++;
    }
  }
  if (!o.low) for (const c of list) {
    if (c.age > 1.05) continue;                                 // dead leaners carry nothing
    const k = c.near ? perNear : perFar;
    const az0 = rng.range(0, Math.PI * 2);
    for (let i = o.from ?? 0; i < k; i++) {
      const top = i === 0;
      const t = top ? 0 : i / k;
      const sF = top ? 0.985 : 1 - 0.07 - (c.span ?? 0.45) * t * rng.range(0.85, 1.1);
      const L = top ? rng.range(4.6, 6.0) : rng.range(3.6, 4.8) * (1 - 0.25 * t);
      const az = top ? c.leanAz + rng.range(-0.5, 0.5) : az0 + i * 2.4 + rng.range(-0.3, 0.3);
      base.push(c.x, c.y, c.z); culm.push(c.h, c.stiff, c.leanAz, c.lean);
      spray.push(sF, az, L * (c.plume ?? c.h / 24) * (c.near ? 1 : 1.28), top ? 1 : 0);
      tint.push(top ? rng.range(0.35, 0.6) : rng.range(0.18, 0.4) * arch, top ? rng.range(0.25, 0.5) : rng.range(0, 0.15) + 0.1 * (arch - 1), rng(), (top ? 1 : 1 - 0.75 * t) * rng.range(0.85, 1));
      n++;
    }
  }
  instAttr(g, 'aBase', base, 3); instAttr(g, 'aCulm', culm, 4); instAttr(g, 'aSpray', spray, 4); instAttr(g, 'aTint', tint, 4);
  g.instanceCount = n;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.userData.count = n;
  return m;
}

// ------------------------------------------------------------------------------------------------
// CANOPY SHELL: the leaf mass between the plumes. From below a dappled ceiling whose gaps widen with
// each gust; from above the dark of the crown sea. Torn fully open over the lane by the parting.
// ------------------------------------------------------------------------------------------------
function shellMesh(U, R, heightAt, noise) {
  const N = 44, size = R * 2 + 4;
  const g = new THREE.PlaneGeometry(size, size, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, heightAt(x, z) + 17.8 + 1.6 * noise.fbm2(x * 0.06, z * 0.06, 3));
  }
  const mat = new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U, uStandR: { value: R } },
    vertexShader: /* glsl */`
      varying vec3 vP, vV; varying vec3 vG;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        vec2 g = bsGust(position.xz, uTime - 0.4);
        vec3 pt = bsPart(position.xz, 1.0);
        vec3 p = position;
        p.y -= 2.3*g.x*uWind.z + 0.5*g.y*uWind.z + 3.0*pt.z;
        p.xz += uWind.xy*(g.x*2.5*uWind.z) + pt.xy*(pt.z*5.0);
        vP = position; vG = vec3(g, pt.z);
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vV = mvPosition.xyz;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uDeep, uCeladon;
      uniform float uStandR; uniform vec4 uWind; uniform sampler2D uAtlas;
      varying vec3 vP, vV; varying vec3 vG;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        vec2 q = vP.xz - uWind.xy*(vG.x*1.5);
        float f = bsNoise(q*0.33)*0.42 + bsNoise(q*0.9 + 7.0)*0.28 + bsNoise(q*2.6)*0.17 + bsNoise(q*7.0)*0.13;
        float edge = smoothstep(uStandR - 12.0, uStandR - 1.0, length(vP.xz));
        float thr = 0.34 + 0.16*vG.x + 1.3*vG.z + edge*0.7;
        if (f < thr) discard;
        // lace of real lance leaves: two rotated tilings of the spray atlas (explicit gradients: no seam lines)
        vec2 ua = q*vec2(0.42, 0.21);
        vec2 ub = vec2(q.x*0.8 - q.y*0.6, q.x*0.6 + q.y*0.8)*vec2(0.36, 0.18) + vec2(0.37, 0.61);
        vec2 sc = vec2(0.48, 0.98);
        vec4 ta = textureGrad(uAtlas, fract(ua)*sc + 0.01, dFdx(ua)*sc, dFdy(ua)*sc);
        vec4 tb = textureGrad(uAtlas, fract(ub)*sc + 0.01, dFdx(ub)*sc, dFdy(ub)*sc);
        float la = max(ta.a, tb.a), lum = max(ta.r, tb.r);
        if (la < mix(0.34, 0.12, smoothstep(25.0, 90.0, length(vV)))) discard;
        float body = smoothstep(thr, thr + 0.2, f);
        vec3 sun = bsSunCol();
        vec3 up = bsAmb(vec3(0.0, 1.0, 0.0));
        vec3 col;
        if (gl_FrontFacing) {                                   // seen from above: shadowed leaf mass between plumes
          float lf = bsNoise(q*3.1 + 5.0)*0.6 + bsNoise(q*9.0)*0.4;
          vec3 alb = mix(uDeep, uJade, 0.45 + 0.4*body*lf)*(0.7 + 0.5*lf)*(0.6 + 0.5*lum);
          alb = mix(alb, uCeladon*0.8, vG.x*0.4*lf);
          col = alb*(up*0.7 + sun*0.3*body*lf);
        } else {                                                // from below: translucent ceiling, lime where the sun is on it
          float lit = bsNoise(q*0.21 + 3.0);
          col = mix(uDeep*0.6, uJade*0.8, body)*(0.5 + 0.6*lum)*up*0.7 + uLime*sun*(0.10 + 0.25*lit*lit)*(0.3 + 0.7*lum)*(0.5 + vG.x);
        }
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------
// TORN LEAVES: single lance triangles carried by the same gusts (they burst with each front), plus
// the LEAF WALL that runs up the gully just ahead of the parting and is flung out through the V.
// ------------------------------------------------------------------------------------------------
function leafMesh(U, count, rng, R, wallFrac) {
  const seed = new Float32Array(count * 12), corner = new Float32Array(count * 9), pos = new Float32Array(count * 9);
  const cs = [[-0.2, -0.5], [0.2, -0.5], [0, 0.9]];
  for (let i = 0; i < count; i++) {
    const a = rng(), b = rng(), c = rng(), d = (i / count < wallFrac ? -1 : 1) * (0.05 + 0.95 * rng()), e = rng();
    for (let k = 0; k < 3; k++) {
      const o = i * 12 + k * 4, q = i * 9 + k * 3;
      seed[o] = a; seed[o + 1] = b; seed[o + 2] = c; seed[o + 3] = d; corner[q] = cs[k][0]; corner[q + 1] = cs[k][1]; corner[q + 2] = e;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.setAttribute('aCorner', new THREE.BufferAttribute(corner, 3));
  const mat = new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U, uBox: { value: new THREE.Vector3(R * 2 + 16, 46, R * 2 + 16) }, uLeafC: { value: new THREE.Vector3(0, 24, 0) } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; attribute vec3 aCorner;
      uniform vec3 uBox; uniform float uPx; uniform vec3 uGully; uniform vec3 uLeafC;
      varying vec3 vC; varying float vL;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        float rnd = aCorner.z, sd = abs(aSeed.w);
        vec3 p; float vis; vec3 drift;
        if (aSeed.w > 0.0) {                                    // ambient: a treadmill box blown along the wind
          vec3 p0 = aSeed.xyz*uBox;
          float sp = 15.0 + 11.0*rnd;
          p.xz = mod(p0.xz + uWind.xy*(sp*uTime) - uLeafC.xz, uBox.xz) - 0.5*uBox.xz + uLeafC.xz;
          p.y = mod(p0.y - (1.2 + 1.5*sd)*uTime + 2.0*sin(uTime*0.8 + sd*30.0) - uLeafC.y, uBox.y) - 0.5*uBox.y + uLeafC.y;
          vec3 ed = abs(p - uLeafC)/uBox;
          float edge = 1.0 - smoothstep(0.40, 0.49, max(ed.x, max(ed.y, ed.z)));
          vec2 g = bsGust(p.xz, uTime);
          float gg = max(g.x, 0.5*g.y)*uWind.z;
          p.xz += uWind.xy*(gg*5.0);
          p.y += gg*2.0*sin(sd*50.0 + uTime*2.0);
          vis = (0.12 + 0.88*smoothstep(0.08, 0.55, gg)*step(sd, 0.2 + 0.8*gg))*edge;
          drift = vec3(uWind.x, 0.0, uWind.y);
        } else {                                                // the leaf wall of the parting
          float a = uPart.x + 4.0 - aSeed.z*aSeed.z*30.0;
          float z = uPart.z - a;
          float t = clamp(a/uPart.w, 0.0, 1.6);
          float spread = 5.0 + 9.0*t;
          p.x = bsLaneX(z) + (aSeed.x - 0.5)*2.0*spread + sin(uTime*3.0 + sd*40.0)*0.8;
          p.z = z;
          p.y = uGully.x + uGully.y*max(a, 0.0) + 0.6 + aSeed.y*(9.0 + 22.0*t) + smoothstep(0.7, 1.5, t)*aSeed.y*16.0
                + 1.2*sin(uTime*2.3 + sd*60.0);
          vis = smoothstep(0.0, 5.0, uPart.x)*(1.0 - smoothstep(uPart.w + 20.0, uPart.w + 55.0, a))*smoothstep(-34.0, -18.0, a)*1.25;
          drift = vec3(0.0, 0.25, -1.0);
        }
        float ang = uTime*(5.0 + 9.0*rnd) + sd*60.0;
        vec3 e1 = normalize(drift*1.2 + vec3(cos(ang), 0.5*sin(ang*1.3), sin(ang))*0.8 + vec3(0.0, 0.01, 0.0));
        vec3 e2 = normalize(cross(e1, vec3(sin(ang*0.7), 0.9, cos(ang*0.7))) + vec3(0.0, 0.0, 1e-3));
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        float dist = length(mvPosition.xyz);
        float size = max(0.2 + 0.12*rnd, 1.7*uPx*min(dist, 90.0))*vis*smoothstep(1.5, 5.5, dist);
        vec3 o = (e1*aCorner.y + e2*aCorner.x)*size;
        mvPosition = modelViewMatrix*vec4(p + o, 1.0);
        vC = vec3(rnd, sd, e2.y);
        vL = vis;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uCeladon, uGold, uWhite;
      uniform float uYellow, uSnow;
      varying vec3 vC; varying float vL;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        if (vL < 0.02) discard;
        vec3 alb = mix(mix(uJade, uLime, vC.x), uCeladon, step(0.72, vC.y)*0.8);
        alb = mix(alb, vec3(0.62, 0.55, 0.30), step(vC.x, 0.14));
        alb = mix(alb, vec3(0.82, 0.70, 0.22), uYellow*step(0.45, fract(vC.y*7.0)));
        alb = mix(alb, uWhite, uSnow*step(0.4, fract(vC.y*5.0)));
        vec3 col = alb*(bsAmb(vec3(0.0, 1.0, 0.0))*0.8 + bsSunCol()*(0.35 + 0.4*abs(vC.z)));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------
// FERNS: 4 arching fronds each, flattened in bands by the gusts.
// ------------------------------------------------------------------------------------------------
function fernMesh(U, list, o = {}) {
  // a shuttlecock of arching fronds: each rises steeply from the crown, arches over and droops at the tip.
  // o.fronds x o.segs (5 x 2 for the ferns beside the lane, 4 x 1 for the ones further off)
  const NF = o.fronds ?? 5, NS = o.segs ?? 2;
  const pos = [], uv = [], fr = [], idx = [];
  for (let k = 0; k < NF; k++) {
    const a = (k + 0.37 * Math.sin(k * 2.4)) / NF * Math.PI * 2 + 0.3, ca = Math.cos(a), sa = Math.sin(a), o0 = pos.length / 3;
    const len = 0.82 + 0.26 * Math.abs(Math.sin(k * 1.7 + 0.6)), el = 0.75 + 0.45 * Math.abs(Math.sin(k * 2.9 + 1.1));
    for (let j = 0; j <= NS; j++) for (let i = 0; i < 2; i++) {
      const t = j / NS, w = (i - 0.5) * 0.56 * (1 - 0.25 * t), r = t * len;
      pos.push(ca * r - sa * w, t, sa * r + ca * w); uv.push(0.505 + t * 0.485, 0.005 + i * 0.235); fr.push(el, k * 1.3);
    }
    for (let j = 0; j < NS; j++) { const q = o0 + j * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aFr', new THREE.Float32BufferAttribute(fr, 2));
  g.setIndex(idx);
  const ip = [], ir = [];
  for (const f of list) { ip.push(f.x, f.y, f.z); ir.push(f.rot, f.size, f.seed, f.tone); }
  instAttr(g, 'aPos', ip, 3); instAttr(g, 'aRot', ir, 4);
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aRot; attribute vec2 aFr;
      varying vec2 vUv; varying vec4 vF; varying vec3 vV;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        float c = cos(aRot.x), s = sin(aRot.x), t = position.y;
        vec3 l = vec3(c*position.x - s*position.z, 0.0, s*position.x + c*position.z);
        vec2 g = bsGust(aPos.xz, uTime - 0.15);
        float gg = clamp(g.x + 0.6*g.y, 0.0, 1.0)*uWind.z;
        // the arch: up fast, over, and down a little at the tip; gusts press it flat and run a shiver along it
        float arch = (2.3*t - 1.75*t*t)*aFr.x*(0.78 - 0.42*gg);
        float lift = arch + 0.05*t*sin(uTime*(5.0 + aRot.z*3.0) + aRot.z*30.0 + aFr.y)*(0.3 + gg);
        vec3 p = aPos + (l*(1.0 - 0.12*t*aFr.x) + vec3(0.0, lift, 0.0))*aRot.y;
        p.xz += uWind.xy*(gg*0.45*t*aRot.y);
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        float gl = bsGlade(aPos.xz);
        vUv = uv; vF = vec4(max(max(g.x, bsPartLit(aPos.xz)), gl*0.9), aRot.w, t, gl); vV = mvPosition.xyz;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uAtlas; uniform vec3 uJade, uLime, uDeep, uCeladon, uWhite; uniform vec2 uFill; uniform float uSnow;
      varying vec2 vUv; varying vec4 vF; varying vec3 vV;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      void main(){
        vec4 tx = texture2D(uAtlas, vUv);
        float dist = length(vV);
        if (tx.a < mix(0.35, 0.2, smoothstep(14.0, 50.0, dist))) discard;
        // dim jade, darker at the crown and along the edges of each frond, a paler midrib
        vec3 alb = mix(uDeep*1.25, mix(uJade, uLime, 0.2), 0.3 + 0.6*vF.y)*(0.55 + 0.6*tx.r)*(0.5 + 0.62*vF.z);
        alb = mix(alb, uCeladon*0.7, vF.x*0.16*(1.0 - vF.w));
        alb = mix(alb, uWhite*0.75, uSnow*smoothstep(0.45, 0.9, vF.z)*0.5);
        float open = max(uFill.x + (1.0 - uFill.x)*smoothstep(0.05, 0.75, vF.x)*0.5, vF.w);   // a gust or the opened V lets in half the light; only a shaft's pool is fully lit
        vec3 upA = bsAmb(vec3(0.0, 1.0, 0.0))*uFill.y;
        // the trunk-space fill, and a little of it passed through the frond itself (brighter toward the tips): dim jade over teal, never black
        vec3 col = alb*(upA*1.35 + bsSunCol()*mix(vec3(1.0), uLime*1.9, 0.6)*open*(0.62 + 0.9*vF.w*vF.z)) + mix(uDeep, uJade, 0.3)*upA*(0.08 + 0.2*vF.z)*(0.6 + 0.5*tx.r);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// the shade at the foot of every near culm: a soft dark disc laid on the slope, so nothing stands on the floor unshadowed
function footMesh(U, list, heightAt) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, 1], 3));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  const a = [], b = [];
  for (const c of list) {
    const h0 = heightAt(c.x, c.z);
    a.push(c.x, h0 + 0.07, c.z, 0.75 + c.r * 7 + 0.5 * c.seed);
    b.push((heightAt(c.x + 0.6, c.z) - heightAt(c.x - 0.6, c.z)) / 1.2, (heightAt(c.x, c.z + 0.6) - heightAt(c.x, c.z - 0.6)) / 1.2);
  }
  instAttr(g, 'aFoot', a, 4); instAttr(g, 'aSl', b, 2);
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...fogU(), uDeep: U.uDeep },
    vertexShader: /* glsl */`
      attribute vec4 aFoot; attribute vec2 aSl;
      varying vec2 vQ;
      #include <fog_pars_vertex>
      void main(){
        vQ = position.xz;
        vec2 o = position.xz*aFoot.w;
        vec4 mvPosition = modelViewMatrix*vec4(aFoot.x + o.x, aFoot.y + dot(aSl, o), aFoot.z + o.y, 1.0);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uDeep;
      varying vec2 vQ;
      #include <fog_pars_fragment>
      void main(){
        float d = length(vQ);
        float a = (1.0 - smoothstep(0.08, 1.0, d));
        gl_FragColor = vec4(uDeep*0.1, a*a*0.66);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1;
  return m;
}

// ------------------------------------------------------------------------------------------------
// SHAFTS: ribbons of lime light along the sun's direction that open behind each front and close.
// ------------------------------------------------------------------------------------------------
function shaftMesh(U, tops) {
  // one sheet per gap in the crowns, facing the camera round the ray's own direction; the light in it is split into
  // three to five separate rays of different widths (the culms above cut it), each breathing with the wind
  const n = tops.length, pos = new Float32Array(n * 12), a = new Float32Array(n * 16), ry = new Float32Array(n * 16), dr = new Float32Array(n * 12), idx = [];
  for (let i = 0; i < n; i++) {
    const t = tops[i], d = t.dir || [0, 0, 0], seed = Math.round(fract(t.seed ?? (i * 0.6180339 + 0.37)) * 64) / 64;   // sixty-fourths: the shader rounds it again (see there)
    for (let k = 0; k < 4; k++) {
      pos.set([t.x, t.y, t.z], i * 12 + k * 3);
      a.set([k & 1 ? 1 : -1, k >> 1, t.w, t.len], i * 16 + k * 4);
      ry.set([t.gain ?? 1, seed, t.hit ?? 0.78, t.rays ?? 3], i * 16 + k * 4);
      dr.set(d, i * 12 + k * 3);
    }
    const o = i * 4; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aShaft', new THREE.BufferAttribute(a, 4));
  g.setAttribute('aRay', new THREE.BufferAttribute(ry, 4));
  g.setAttribute('aDir', new THREE.BufferAttribute(dr, 3));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: false, lights: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...U },
    vertexShader: /* glsl */`
      attribute vec4 aShaft, aRay; attribute vec3 aDir;
      varying vec3 vA, vC; varying vec4 vR;
      ${GLSL_WIND}
      #include <common>
      #include <lights_pars_begin>
      void main(){
        #if NUM_DIR_LIGHTS > 0
          vec3 L = directionalLights[0].direction;
        #else
          vec3 L = vec3(0.0, 1.0, 0.0);
        #endif
        if (dot(aDir, aDir) > 0.5) L = normalize(mat3(viewMatrix)*aDir);      // a ray of its own (a few degrees off the sun's: gaps fan the light)
        vec2 g = bsGust(position.xz, uTime - 0.55);
        vec3 pt = bsPart(position.xz, 1.0);
        vec4 mv = modelViewMatrix*vec4(position, 1.0);
        vec3 c = mv.xyz - L*(aShaft.y*aShaft.w);
        vec3 sd = cross(L, c/max(length(c), 1e-3));
        sd = sd/max(length(sd), 1e-3);
        c += sd*(aShaft.x*abs(aShaft.z)*(1.0 + 0.4*aShaft.y));
        float stand = step(aShaft.z, 0.0);
        vA = vec3(aShaft.x, aShaft.y, aRay.x*max(clamp(g.x*1.15 + pt.z, 0.0, 1.2), stand*(1.55 + 0.6*g.x)));
        vC = c;
        vR = vec4(g.x, aRay.y, aRay.z, aRay.w);
        gl_Position = projectionMatrix*vec4(c, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLime, uShaftCol; uniform float uSunGain, uTime;
      varying vec3 vA, vC; varying vec4 vR;
      float shH(float n){ return fract(sin(n*12.9898 + 4.1)*43758.5453); }
      void main(){
        // the seed and the ray count are the same at a sheet's four corners, but an interpolated value can still differ in
        // its last bit from pixel to pixel, and the hash would turn that into a stipple: round them first
        float x = vA.x, y = vA.y, seed = floor(vR.y*64.0 + 0.5)/64.0, hit = vR.z, nr = max(floor(vR.w + 0.5), 1.0);
        float env = 1.0 - x*x; env *= env;
        float rays = 0.0;
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float h1 = shH(seed*37.0 + fi*1.7), h2 = shH(seed*91.0 + fi*5.3), h3 = shH(seed*53.0 + fi*9.1);
          float c = ((fi + 0.22 + 0.56*h1)/nr)*1.76 - 0.88;                        // the rays stand apart across the sheet, dark between
          float w = mix(0.055, 0.17, h2)*(3.3/(nr + 0.6));                         // and no two are the same width
          float dx = (x - c)/w;
          float top = smoothstep(0.26*h3, 0.26*h3 + 0.18, y);                      // every ray starts at its own gap
          float breathe = 0.8 + 0.2*sin(uTime*(0.45 + 0.6*h1) + h2*20.0) + 0.3*vR.x;
          rays += step(fi + 0.5, nr)*exp(-dx*dx)*(0.62 + 0.38*h3)*top*breathe;
        }
        float dust = 0.93 + 0.07*sin(x*7.0 + seed*40.0 + 1.6*sin(uTime*0.5 + seed*9.0) + y*2.0);
        // the beam thins as it comes down into the ferns (it ends in the lit pool on the floor, not in a hard edge)
        float v = smoothstep(0.0, 0.1, y)*(1.0 - 0.7*smoothstep(hit - 0.24, hit + 0.04, y))*(1.0 - smoothstep(hit + 0.02, min(hit + 0.26, 1.0), y));
        float nearK = smoothstep(3.0, 17.0, length(vC));                             // a sheet that passes the lens fades out there: no wash across the frame
        gl_FragColor = vec4(uShaftCol*(sqrt(env)*min(rays, 1.25)*dust*v*vA.z*nearK*0.15*uSunGain), 1.0);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3;
  return m;
}

// ------------------------------------------------------------------------------------------------
// LIT MIST: the wet air standing in a shaft's pool, lit: one soft camera-facing glow each (additive), drifting and
// breathing with the gusts, sunk into the trunk-space fog with distance. list = [{ x, y, z, r, gain?, seed? }]
// ------------------------------------------------------------------------------------------------
function haloMesh(U, list) {
  const n = list.length, pos = new Float32Array(n * 12), a = new Float32Array(n * 16), sd = new Float32Array(n * 4), idx = [];
  for (let i = 0; i < n; i++) {
    const h = list[i], seed = h.seed ?? fract(i * 0.6180339 + 0.23);
    for (let k = 0; k < 4; k++) {
      pos.set([h.x, h.y, h.z], i * 12 + k * 3);
      a.set([k & 1 ? 1 : -1, k >> 1 ? 1 : -1, h.r, h.gain ?? 1], i * 16 + k * 4); sd[i * 4 + k] = seed;
    }
    const o = i * 4; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aH', new THREE.BufferAttribute(a, 4));
  g.setAttribute('aS', new THREE.BufferAttribute(sd, 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec4 aH; attribute float aS;
      varying vec3 vH; varying vec2 vD;
      ${GLSL_WIND}
      void main(){
        vec2 g = bsGust(position.xz, uTime - 0.5);
        vec4 mv = modelViewMatrix*vec4(position, 1.0);
        float d = length(mv.xyz);
        mv.xy += aH.xy*vec2(1.0, 0.62)*(aH.z*(1.0 + 0.1*sin(uTime*0.4 + aS*20.0)));
        vH = vec3(aH.xy, aH.w*(0.7 + 0.55*g.x)*smoothstep(5.0, 20.0, d));
        vD = vec2(d, aS);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uShaftCol; uniform float uSunGain, uTime;
      varying vec3 vH; varying vec2 vD;
      #include <fog_pars_fragment>
      float hlH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
      float hlN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
        return mix(mix(hlH(i), hlH(i + vec2(1.0, 0.0)), f.x), mix(hlH(i + vec2(0.0, 1.0)), hlH(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main(){
        float f = max(1.0 - dot(vH.xy, vH.xy), 0.0); f = f*f;
        float n = hlN(vH.xy*1.5 + vec2(vD.y*17.0 + uTime*0.07, vD.y*5.0 - uTime*0.04))*0.6 + hlN(vH.xy*3.6 + vec2(vD.y*3.0 - uTime*0.11, vD.y*9.0))*0.4;
        float fogK = 1.0;
        #ifdef FOG_EXP2
          fogK = exp(-fogDensity*fogDensity*vD.x*vD.x);
        #endif
        gl_FragColor = vec4(uShaftCol*(f*(0.3 + 0.95*n)*vH.z*0.15*uSunGain*fogK), 1.0);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3;
  return m;
}

// ------------------------------------------------------------------------------------------------
// GROUND and BOULDERS (one mesh): straw litter, moss, red sandstone; the gust shutter lays travelling
// patches of lime light across the floor.
// ------------------------------------------------------------------------------------------------
function groundMesh(U, R, heightAt, noise, rng, laneX) {
  const pos = [], rock = [], idx = [];
  const rings = 26, sect = 72, RO = R + 6;
  pos.push(0, heightAt(0, 0), 0); rock.push(0);
  for (let j = 1; j <= rings; j++) for (let i = 0; i < sect; i++) {
    const r = RO * Math.pow(j / rings, 0.85), a = (i + (j % 2) * 0.5) / sect * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    pos.push(x, heightAt(x, z), z); rock.push(0);
  }
  for (let i = 0; i < sect; i++) idx.push(0, 1 + (i + 1) % sect, 1 + i);
  for (let j = 1; j < rings; j++) for (let i = 0; i < sect; i++) {
    const a = 1 + (j - 1) * sect + i, b = 1 + (j - 1) * sect + (i + 1) % sect, c = a + sect, d = b + sect;
    idx.push(a, b, c, b, d, c);
  }
  // boulders and ledges of red sandstone, sunk into the banks
  const ico = new THREE.IcosahedronGeometry(1, 2);
  const ip = ico.attributes.position;
  const nB = 9;
  for (let k = 0; k < nB; k++) {
    const z = rng.range(-R * 0.6, R * 0.75), sd = rng.sign(), dx = rng.range(5.5, 16);
    const cx = laneX(z) + sd * dx, sx = rng.range(1.2, 3.2), sy = rng.range(0.7, 1.6), sz = rng.range(1.2, 3.0);
    const cy = heightAt(cx, z) + sy * 0.25, rot = rng.range(0, 6.28), o = pos.length / 3;
    const map = new Map();
    for (let i = 0; i < ip.count; i++) {
      const key = ip.getX(i).toFixed(3) + ',' + ip.getY(i).toFixed(3) + ',' + ip.getZ(i).toFixed(3);
      if (map.has(key)) { idx.push(map.get(key)); continue; }
      let x = ip.getX(i), y = ip.getY(i), zz = ip.getZ(i);
      const n = 1 + 0.32 * noise.fbm3(x * 1.3 + k * 9, y * 1.3, zz * 1.3, 3);
      y = Math.round(y * 3.2) / 3.2 * 0.6 + y * 0.4;                       // ledged strata
      x *= n * sx; y *= n * sy; zz *= n * sz;
      const rx = x * Math.cos(rot) - zz * Math.sin(rot), rz = x * Math.sin(rot) + zz * Math.cos(rot);
      const id = pos.length / 3;
      pos.push(cx + rx, cy + y, z + rz); rock.push(1); map.set(key, id); idx.push(id);
    }
    void o;
  }
  ico.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRock', new THREE.Float32BufferAttribute(rock, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = groundMaterial(U, R);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

function groundMaterial(U, R) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true,
    uniforms: { ...lightU(), ...fogU(), ...U, uStandR: { value: R } },
    vertexShader: /* glsl */`
      attribute float aRock;
      varying vec3 vP, vN, vNo, vV; varying float vRock; varying vec2 vG;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        vP = position; vNo = normal; vN = normalize(normalMatrix*normal); vRock = aRock;
        vG = bsGust(position.xz, uTime - 0.6) + vec2(bsPart(position.xz, 1.0).z, 0.0);
        vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
        vV = mvPosition.xyz;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uJade, uLime, uDeep;
      uniform float uStandR; uniform vec2 uFill;
      varying vec3 vP, vN, vNo, vV; varying float vRock; varying vec2 vG;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      ${GLSL_WIND}
      // one fallen lance leaf in each cell of p: x coverage, y a tone for it (aa: half a pixel in cell units)
      vec2 bsLeaf(vec2 p, float aa){
        vec2 i = floor(p), f = fract(p) - 0.5;
        float h = bsHash(i + 3.7), h2 = bsHash(i*1.31 + 17.0);
        f -= (vec2(h, h2) - 0.5)*0.3;
        float a = h*18.85, c = cos(a), s = sin(a);
        vec2 r = vec2(c*f.x + s*f.y, c*f.y - s*f.x);
        float x = r.x/(0.3 + 0.1*h2);
        float w = 0.085*(1.0 - x*x);
        float cov = (1.0 - smoothstep(w - aa, w + aa, abs(r.y)))*step(abs(x), 1.0)*step(0.22, fract(h*7.3));
        return vec2(cov, h2);
      }
      // rounded stones in the cells of pc laid over the grit (base) (aaP: a pixel in cell units)
      vec3 bsPebbles(vec3 base, vec2 pc, float aaP){
        float keep = 1.0 - smoothstep(0.18, 0.5, aaP);
        vec2 ci = floor(pc), cf = fract(pc); float md = 9.0, id = 0.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), o = vec2(bsHash(ci + g + 1.7), bsHash((ci + g)*1.31 + 9.0));
          float dd = length(g + 0.15 + 0.7*o - cf);
          if (dd < md) { md = dd; id = bsHash(ci + g + 5.3); }
        }
        float rad = 0.24 + 0.2*id, dome = sqrt(max(1.0 - md*md/(rad*rad), 0.0));
        float cov = (1.0 - smoothstep(rad - aaP - 0.02, rad, md))*step(0.25, fract(id*5.7))*keep;
        vec3 peb = mix(mix(vec3(0.15, 0.12, 0.10), vec3(0.40, 0.25, 0.18), fract(id*3.3)), vec3(0.36, 0.35, 0.31), step(0.7, fract(id*9.1)))*(0.45 + 0.75*dome);
        return mix(base*(1.0 - 0.35*keep*(1.0 - smoothstep(rad, rad + 0.12, md))), peb, cov);
      }
      void main(){
        vec2 q = vP.xz;
        float dist = length(vV);
        float n2 = bsNoise(q*1.7 + 11.0), n3 = bsNoise(q*7.0);
        vec2 qr = vec2(q.x*0.8 - q.y*0.6, q.x*0.6 + q.y*0.8);
        vec2 qt = vec2(q.x*0.6 + q.y*0.8, q.y*0.6 - q.x*0.8);
        float n4 = bsNoise(qr*5.3 + 3.0), n5 = bsNoise(qt*12.7 + 9.0);
        // straw leaf litter on dark soil: a matted layer, then single fallen leaves and sheath scraps at two sizes
        vec3 litter = mix(vec3(0.10, 0.078, 0.05), vec3(0.34, 0.28, 0.15), clamp(0.15 + 0.45*n2 + 0.25*n4 + 0.25*n5, 0.0, 1.0));
        vec2 pa = qr*4.6, pb = qt*2.3 + 5.5;
        float aaA = clamp(length(fwidth(pa))*0.6, 0.004, 0.5), aaB = clamp(length(fwidth(pb))*0.6, 0.004, 0.5);
        vec2 la = bsLeaf(pa, aaA), lb = bsLeaf(pb, aaB), lc = bsLeaf(pa*1.37 + 9.1, aaA*1.37);
        float fa = 1.0 - smoothstep(0.12, 0.42, aaA), fb = 1.0 - smoothstep(0.12, 0.42, aaB);
        vec3 leafA = mix(vec3(0.66, 0.57, 0.31), vec3(0.34, 0.22, 0.10), step(0.55, la.y));
        vec3 leafC = mix(vec3(0.58, 0.52, 0.26), vec3(0.42, 0.47, 0.17), step(0.8, lc.y));
        vec3 leafB = mix(vec3(0.52, 0.40, 0.22), vec3(0.24, 0.15, 0.08), step(0.5, lb.y));
        litter = mix(litter, leafB, lb.x*fb*0.9);
        litter = mix(litter, leafC, lc.x*fa*0.9);
        litter = mix(litter, leafA, la.x*fa);
        litter = mix(litter, vec3(0.30, 0.25, 0.135), (1.0 - fa)*0.35);                 // far off the leaves melt into straw
        // under the fern layer: the shade between the fronds, never lawn
        float cover = bsFernCover(q + (vec2(n4, n2) - 0.5)*0.9);
        float dxl = abs(q.x - bsLaneX(q.y));
        float bed = (1.0 - smoothstep(2.2, 3.8, dxl))*step(q.y, 152.0)*smoothstep(-52.0, -30.0, q.y);     // the stream line and the lane up the gully
        cover *= 1.0 - bed;
        vec3 under = mix(uDeep*1.05, mix(uJade, uLime, 0.15)*0.44, clamp(n3*0.55 + n5*0.45, 0.0, 1.0))*(0.75 + 0.5*n2);
        under = mix(under, mix(uDeep, uJade, 0.55)*0.5*(0.8 + 0.4*n4), smoothstep(30.0, 85.0, dist));         // far off it is the fern tops one sees
        vec3 wetBed = mix(vec3(0.07, 0.065, 0.05), vec3(0.20, 0.17, 0.12), n3*0.6 + 0.4*n5);
        // the washed bank: cobbles and pebbles bedded in dark grit, each its own tone, wet on top (two sizes; they melt
        // into the grit with distance). (The pixel footprints are taken here, outside any loop or branch.)
        vec2 pcA = qr*2.1 + 3.3, pcB = qt*5.2;
        float aaPA = clamp(length(fwidth(pcA)), 0.004, 1.0), aaPB = clamp(length(fwidth(pcB)), 0.004, 1.0);
        if (bed > 0.01) { wetBed = bsPebbles(wetBed, pcA, aaPA); wetBed = bsPebbles(wetBed, pcB, aaPB); }
        vec3 alb = mix(mix(litter, wetBed, bed*smoothstep(0.0, 6.0, q.y)), under, cover);
        float up = clamp(normalize(vNo).y, 0.0, 1.0);
        vec3 moss = mix(uDeep*0.9, mix(uJade, uLime, 0.3)*0.72, n3*0.6 + 0.4*n5)*(0.8 + 0.4*n4);
        vec3 stone = mix(vec3(0.36, 0.19, 0.13), vec3(0.55, 0.33, 0.22), bsNoise(vec2(vP.y*3.0 + n2*0.6, (q.x - q.y)*0.05)));
        stone *= (0.75 + 0.5*n3)*0.8;
        float wet = clamp(vRock - 1.0, 0.0, 1.0);                               // stones standing in the stream: dark, bare
        stone = mix(stone, vec3(0.19, 0.16, 0.14)*(0.6 + 0.6*n3), wet);
        vec3 rk = mix(stone, moss*mix(1.2, 0.8, wet), smoothstep(0.35, 0.7, up + 0.3*n2 - 0.1)*(1.0 - 0.35*wet));
        float steep = 1.0 - smoothstep(0.55, 0.8, up);
        alb = mix(alb, mix(stone, moss, 0.35*n2), steep*0.8);                   // bare rock, a little moss, where the bank is steep
        alb = mix(alb, rk, min(vRock, 1.0));
        vec2 dq = q - uWind.xy*uTime*3.0;
        float dap = smoothstep(0.35, 0.75, bsNoise(dq*0.16)*0.6 + bsNoise(dq*0.5)*0.4);
        float pool = bsGlade(q + (vec2(n2, n4) - 0.5)*1.4);
        float gst = max(vG.x, pool);
        float open = uFill.x*(0.45 + 1.1*dap) + 0.7*smoothstep(0.05, 0.7, gst)*(0.08 + 0.92*dap);        // dim dapple always, flood of light behind a front
        open = max(open, pool*pool*(0.55 + 0.45*dap));                                                    // a shaft's pool of light
        open = max(open, bsPartLit(q)*(0.3 + 0.3*dap));                                                   // the gully head under the opened V
        open = mix(open, 1.0, smoothstep(uStandR - 5.0, uStandR + 3.0, length(q)));       // open ground beyond the stand
        vec3 N = normalize(vN);
        vec3 sun = bsSunCol()*mix(vec3(1.0), uLime*1.9, 0.6)*open*(0.35 + 0.65*max(dot(N, bsSunDir()), 0.0))*mix(1.0, 0.35 + 0.4*up, min(vRock, 1.0));
        vec3 upA = bsAmb(vec3(0.0, 1.0, 0.0));
        vec3 col = alb*(bsAmb(N)*(1.15*uFill.y) + (uJade*0.8 + uLime*0.2)*upA*(0.5*uFill.y) + sun*mix(1.0, 0.75 + 0.95*pool, cover)) + uDeep*upA*(uFill.y*(0.16 + 0.2*cover));   // under the ferns only a shaft's pool glows: never lawn
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------------------------------------------
// GOLDEN SNUB-NOSED MONKEY: one builder for the three poses (exported: the world's ledge huddle and leapers use it too).
//   'cling'  the culm is the +Y axis; the monkey hugs it from +Z, face turned to +X; the tail is built straight along
//            +Z from the rump (MONKEY_TAIL long) and swung downwind by the shader
//   'sit'    hunched on y = 0, facing +X; o.tail = [[x, y, z], ...] lays the tail along a path of its own
//   'leap'   spread in the air, body along +X, back to +Y, tail streaming behind
// Smooth limbs swept through shoulder, elbow and wrist (no joint shows), a dark brown back under a long gold mantle,
// pale belly, pale-blue face under a dark cap, and fur: several hundred tufts combed down the body and along the tail,
// which stand off the surface and break the outline. Returns plain arrays: position, normal, color, tail (0..1), index.
// ------------------------------------------------------------------------------------------------
export const MONKEY_TAIL = 1.1;
// fur lit by the scene: a sun side and a shade side (the shade browner and cooler, never the same orange), sky fill from
// above, a dark underside, and a bright rim where the light grazes the coat. alb: coat colour, fur: strand noise 0..1,
// furK: 1 on the coat, 0 on bare skin (the face, the eyes, the hands). Needs GLSL_LIGHT before it.
export const GLSL_FUR = /* glsl */`
  // warm 0..1: a coat sitting in a shaft: the shade side keeps its orange and the fill carries a little of the gold
  vec3 bsFurW(vec3 alb, vec3 N, vec3 V, vec3 L, vec3 upV, float fur, float lit, float amb, vec3 rimC, float furK, float warm){
    float nl = dot(N, L), key = smoothstep(-0.25, 0.7, nl);
    float skyUp = 0.5 + 0.5*dot(N, upV);
    float rim = 1.0 - clamp(dot(N, V), 0.0, 1.0); rim = rim*rim*rim;
    vec3 a = alb*mix(1.0, 0.5 + 0.9*fur, furK);
    vec3 shadeA = mix(a, vec3(dot(a, vec3(0.3, 0.55, 0.15)))*vec3(0.78, 0.95, 1.2), mix(0.5, 0.16, warm)*furK);
    vec3 sun = bsSunCol()*lit; sun = mix(sun, vec3(dot(sun, vec3(0.3, 0.55, 0.15))), 0.3);
    vec3 fill = bsAmb(N)*(0.38 + 0.62*skyUp*skyUp)*amb;
    fill = mix(fill, vec3(dot(fill, vec3(0.3, 0.55, 0.15)))*vec3(1.22, 1.0, 0.72), 0.6*warm*furK);
    vec3 col = mix(shadeA, a, key)*(fill*(0.62 + 0.3*warm) + sun*(key*0.95));
    col += rimC*(sun*(rim*smoothstep(-0.2, 0.45, nl)*0.5) + fill*(rim*0.3))*mix(1.0, 0.35 + 0.65*fur, furK);
    return col;
  }
  vec3 bsFur(vec3 alb, vec3 N, vec3 V, vec3 L, vec3 upV, float fur, float lit, float amb, vec3 rimC, float furK){
    return bsFurW(alb, N, V, L, upV, fur, lit, amb, rimC, furK, 0.0);
  }
`;
// pose 'perch': sitting on a stem that rises toward +X at o.slope (rad), hands and feet on it, the tail hanging;
// pose 'head': the head alone, centred on the origin, face to +X (the world turns it on the neck of a perched body built
// with o.head = false). o.hi: a head for the close pass (finer, with nostrils and a mouth). The result also carries
// smooth (1 on bare skin: no fur grain there) and headAt (the head's centre in the body's space).
export function furMonkey(gold, pose, o = {}) {
  const P = [], N = [], C = [], W = [], S = [], I = [];
  let sd = (0x9e3779b9 ^ Math.imul(pose.length * 7919 + Math.round((o.seed || 0) * 1000), 104729)) | 0;
  const rnd = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rich = o.rich ?? 0;                                                // 1: a coat for a shaft of sun: gold-orange through and through, cream only down the chest
  const cGold = lin(gold), cOrange = cGold.clone().lerp(lin('#b0682a'), 0.5 - 0.32 * rich), cBack = lin('#33261e'), cPale = cGold.clone().lerp(lin('#fff0cc'), 0.66 - 0.3 * rich);
  const cMantle = cGold.clone().lerp(lin('#ffd98a'), 0.6 - 0.45 * rich), cFace = lin('#b2ccf6'), cFaceD = lin('#84a3d8'), cHand = lin('#221a15'), cTip = cGold.clone().lerp(lin('#fff4d0'), 0.75 - 0.45 * rich);
  const cEye = lin('#0a0807'), cMuzzle = lin('#e3eaf3'), cOuter = cGold.clone().lerp(cBack, 0.6);
  const S_ = pose === 'sit', Lp = pose === 'leap', Pc = pose === 'perch', Hd = pose === 'head';
  const fr = S_ || Pc || Hd ? { D: [-1, 0, 0], G: [-0.3, -1, 0], cap: [0, 1, 0] } : Lp ? { D: [0, 1, 0], G: [-1, -0.12, 0], cap: [0, 1, 0] } : { D: [0, 0, 1], G: [0, -1, 0.28], cap: [0, 1, 0] };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vert = (p, n, c, w, s = 0) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c.r, c.g, c.b); W.push(w); S.push(s); return P.length / 3 - 1; };
  // fur colour from the body-space normal: cream belly, orange-gold flanks, dark brown back (backK: how dark)
  const bkK = o.backK ?? 1;
  const furCol = (n, backK, base = cOrange) => { const d = dot(n, fr.D); return cPale.clone().lerp(base, sstep(-0.8 - 0.18 * rich, -0.42 * rich, d)).lerp(cBack, sstep(0.0, 0.55, d) * backK * bkK); };
  // a tuft: a thin triangle rooted in the coat at p, lying along `comb` and standing off the surface a little
  const fineK = o.fine ?? 1;                                               // the close one's coat: finer tufts (and more of them)
  const tuft = (p, n, comb, len, wid, cRoot, cEnd, w, lift) => {
    len *= 0.55 + 0.45 * fineK; wid *= fineK;
    const d = nrm([n[0] * lift + comb[0], n[1] * lift + comb[1], n[2] * lift + comb[2]]);
    let s = cross(d, n); if (Math.hypot(s[0], s[1], s[2]) < 0.05) s = cross(d, [0.3, 0.2, 0.9]); s = nrm(s);
    const q = [p[0] - n[0] * 0.012, p[1] - n[1] * 0.012, p[2] - n[2] * 0.012], h = wid * 0.5, nt = nrm([n[0] + d[0] * 0.6, n[1] + d[1] * 0.6, n[2] + d[2] * 0.6]);
    const a = vert([q[0] - s[0] * h, q[1] - s[1] * h, q[2] - s[2] * h], n, cRoot, w), b = vert([q[0] + s[0] * h, q[1] + s[1] * h, q[2] + s[2] * h], n, cRoot, w);
    const c = vert([p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len], nt, cEnd, w);
    I.push(a, b, c);
  };
  // an ellipsoid; t: { n, len: [a, b], wid, lift, tip, keep(p, n) } scatters tufts over it; sm = 1: bare skin
  const ellip = (c, r, colFn, t, ws = 10, hs = 8, sm = 0) => {
    const o0 = P.length / 3;
    for (let j = 0; j <= hs; j++) for (let i = 0; i <= ws; i++) {
      const th = j / hs * Math.PI, ph = i / ws * Math.PI * 2, u = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      const p = [c[0] + r[0] * u[0], c[1] + r[1] * u[1], c[2] + r[2] * u[2]], n = nrm([u[0] / r[0], u[1] / r[1], u[2] / r[2]]);
      vert(p, n, colFn(p, n), 0, sm);
    }
    for (let j = 0; j < hs; j++) for (let i = 0; i < ws; i++) { const a = o0 + j * (ws + 1) + i, b = a + 1, d = a + ws + 1, e = d + 1; I.push(a, b, d, b, e, d); }
    if (!t) return;
    for (let k = 0; k < t.n; k++) {
      const z = rnd() * 2 - 1, ph = rnd() * 6.2832, s = Math.sqrt(1 - z * z), u = [s * Math.cos(ph), z, s * Math.sin(ph)];
      const p = [c[0] + r[0] * u[0], c[1] + r[1] * u[1], c[2] + r[2] * u[2]], n = nrm([u[0] / r[0], u[1] / r[1], u[2] / r[2]]);
      const len = t.len[0] + (t.len[1] - t.len[0]) * rnd(), keep = !t.keep || t.keep(p, n);
      if (keep) tuft(p, n, t.comb || fr.G, len, t.wid * (0.7 + 0.6 * rnd()), colFn(p, n).clone().multiplyScalar(0.62), (t.tip || cTip).clone().lerp(colFn(p, n), 0.25 + 0.45 * rnd()), 0, t.lift ?? 0.55);
    }
  };
  // a tube swept through pts (Catmull-Rom), radii per point; colFn(p, n, t), wFn(t) tail weight; t as for ellip (comb 'along' = toward the tip)
  const tube = (pts, radii, colFn, wFn, t, sides = 6, per = 4) => {
    const m = pts.length, ns = (m - 1) * per, o0 = P.length / 3, cen = [], rad = [];
    const at = (i) => pts[Math.min(m - 1, Math.max(0, i))];
    for (let k = 0; k <= ns; k++) {
      const f = Math.min(k / per, m - 1 - 1e-6), i = Math.floor(f), u = f - i, p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), q = [0, 0, 0];
      for (let a = 0; a < 3; a++) q[a] = 0.5 * (2 * p1[a] + (p2[a] - p0[a]) * u + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * u * u + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * u * u * u);
      cen.push(q); rad.push(radii[i] + (radii[i + 1] - radii[i]) * u);
    }
    let b1 = null; const frames = [];
    for (let k = 0; k <= ns; k++) {
      const a = cen[Math.max(k - 1, 0)], b = cen[Math.min(k + 1, ns)], tg = nrm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
      if (!b1) b1 = nrm(cross(tg, Math.abs(tg[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
      else { const dd = dot(b1, tg); b1 = nrm([b1[0] - tg[0] * dd, b1[1] - tg[1] * dd, b1[2] - tg[2] * dd]); }
      const b2 = cross(tg, b1); frames.push([tg, b1, b2]);
      for (let i = 0; i < sides; i++) {
        const an = i / sides * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an), n = [b1[0] * ca + b2[0] * sa, b1[1] * ca + b2[1] * sa, b1[2] * ca + b2[2] * sa];
        const p = [cen[k][0] + n[0] * rad[k], cen[k][1] + n[1] * rad[k], cen[k][2] + n[2] * rad[k]];
        vert(p, n, colFn(p, n, k / ns), wFn ? wFn(k / ns) : 0);
      }
    }
    for (let k = 0; k < ns; k++) for (let i = 0; i < sides; i++) { const a = o0 + k * sides + i, b = o0 + k * sides + (i + 1) % sides, c = a + sides, d = b + sides; I.push(a, c, b, b, c, d); }
    if (!t) return;
    for (let j = 0; j < t.n; j++) {
      const tt = 0.04 + 0.94 * rnd(), k = Math.min(ns - 1, Math.floor(tt * ns)), [tg, e1, e2] = frames[k], an = rnd() * 6.2832, ca = Math.cos(an), sa = Math.sin(an);
      const n = [e1[0] * ca + e2[0] * sa, e1[1] * ca + e2[1] * sa, e1[2] * ca + e2[2] * sa], p = [cen[k][0] + n[0] * rad[k], cen[k][1] + n[1] * rad[k], cen[k][2] + n[2] * rad[k]];
      const len = t.len[0] + (t.len[1] - t.len[0]) * rnd(), cc = colFn(p, n, tt);
      tuft(p, n, t.comb === 'along' ? tg : (t.comb || fr.G), len, t.wid * (0.7 + 0.6 * rnd()), cc.clone().multiplyScalar(0.62), (t.tip || cTip).clone().lerp(cc, 0.3 + 0.4 * rnd()), wFn ? wFn(tt) : 0, t.lift ?? 0.5);
    }
  };
  const body = Hd ? [null, null, null, [[0, 0, 0], [0.11, 0.115, 0.105]]]
    : Pc ? [[[-0.04, 0.15, 0], [0.2, 0.16, 0.2]], [[0.01, 0.36, 0], [0.18, 0.27, 0.17]], [[0.03, 0.53, 0], [0.21, 0.17, 0.21]], [[0.115, 0.755, 0], [0.11, 0.115, 0.105]]]
    : S_ ? [[[-0.03, 0.16, 0], [0.21, 0.16, 0.2]], [[0, 0.36, 0], [0.18, 0.27, 0.17]], [[-0.01, 0.52, 0], [0.21, 0.17, 0.21]], [[0.06, 0.73, 0], [0.11, 0.115, 0.105]]]
    : Lp ? [[[-0.14, -0.01, 0], [0.2, 0.135, 0.15]], [[0, 0, 0], [0.3, 0.15, 0.16]], [[0.14, 0.03, 0], [0.19, 0.17, 0.2]], [[0.39, 0.08, 0], [0.11, 0.11, 0.1]]]
    : [[[0, -0.2, 0.25], [0.13, 0.12, 0.13]], [[0, 0, 0.23], [0.15, 0.25, 0.145]], [[0, 0.13, 0.27], [0.185, 0.17, 0.13]], [[0.02, 0.36, 0.2], [0.1, 0.105, 0.1]]];
  const k = o.fur ?? 1, hi = o.hi ? 1 : 0;                                 // tuft count multiplier; the close head
  if (!Hd) {
    ellip(body[0][0], body[0][1], (p, n) => furCol(n, 0.85), { n: Math.round(70 * k), len: [0.1, 0.17], wid: 0.06, lift: 0.8 });
    ellip(body[1][0], body[1][1], (p, n) => furCol(n, 1.0), { n: Math.round(110 * k), len: [0.11, 0.19], wid: 0.06, lift: 0.8 });
    // the mantle: long gold guard hairs from the shoulders, hanging over the dark back
    ellip(body[2][0], body[2][1], (p, n) => furCol(n, 0.55, cMantle), { n: Math.round(170 * k), len: [0.18, 0.34], wid: 0.06, lift: 0.6, tip: cTip, keep: (p, n) => dot(n, fr.D) > -0.6 });
  }
  // head: a gold ruff round the face, a dark cap that comes down to a brow over the eyes, the flat pale-blue face with
  // dark eyes set close, the short upturned nose and a pale swollen muzzle
  const hc = body[3][0], hs = body[3][1][0] / 0.11;
  if (o.head !== false) {
    const hp = (x, y, z) => [hc[0] + x * hs, hc[1] + y * hs, hc[2] + z * hs], hr3 = (a, b, c) => [a * hs, b * hs, c * hs];
    ellip(hc, body[3][1], (p, n) => (n[0] > 0.66 ? cFace : cGold.clone().lerp(cPale, 0.35 * sstep(0.1, 0.6, n[0])).lerp(cBack, sstep(0.25, 0.6, dot(n, fr.cap) - 0.35 * n[0]) * 0.9)),
      { n: Math.round(70 * k * (1 + hi)), len: [0.06, 0.12], wid: 0.04, lift: 1.1, comb: [-0.5, -0.4, 0], tip: cMantle, keep: (p, n) => n[0] < 0.45 }, hi ? 14 : 10, hi ? 10 : 8);
    ellip(hp(0.06, -0.006, 0), hr3(0.054, 0.08, 0.076), (p, n) => cFace.clone().lerp(cFaceD, 0.55 * sstep(0.35, 0.95, Math.abs(n[2])) + 0.25 * sstep(0.2, 0.9, -n[1])), null, hi ? 12 : 8, hi ? 9 : 6, 1);
    ellip(hp(0.082, 0.056, 0), hr3(0.034, 0.022, 0.072), () => cBack, null, 8, 5);                                // the brow
    for (const s of [-1, 1]) ellip(hp(0.099, 0.02, s * 0.037), hr3(0.014, 0.017, 0.02), () => cEye, null, hi ? 8 : 6, hi ? 6 : 4, 1);
    ellip(hp(0.096, -0.05, 0), hr3(0.038, 0.032, 0.048), () => cMuzzle, null, 8, 6, 1);
    ellip(hp(0.112, -0.012, 0), hr3(0.015, 0.015, 0.024), (p, n) => cFace.clone().lerp(cMuzzle, 0.5 * sstep(0, 1, n[1])), null, 6, 5, 1);   // the nose: a short upturned ridge
    if (hi) {
      for (const s of [-1, 1]) ellip(hp(0.1245, -0.012, s * 0.0095), hr3(0.0055, 0.007, 0.007), () => cEye, null, 5, 4, 1);
      ellip(hp(0.131, -0.058, 0), hr3(0.006, 0.0045, 0.03), () => lin('#3a1a16'), null, 6, 4, 1);
      for (const s of [-1, 1]) ellip(hp(0.1115, 0.027, s * 0.033), hr3(0.0045, 0.0045, 0.0045), () => lin('#dfe6ee'), null, 4, 3, 1);       // a glint in each eye
    }
  }
  const limbCol = (p, n, t) => furCol(n, 0.6, cGold).lerp(cOuter, 0.4 * t), limbFur = { n: Math.round(34 * k), len: [0.07, 0.12], wid: 0.045, lift: 0.8 };
  const hand = (c, r) => ellip(c, r, () => cHand, null, 6, 4, 1);
  if (Hd) { /* the head alone */ } else if (Pc) {
    const ta = Math.tan(o.slope ?? 0.55);
    for (const s of [-1, 1]) {
      const hx = 0.35 + 0.05 * s, hy = hx * ta + 0.03, fx = 0.15 - 0.03 * s, fy = fx * ta + 0.025;
      tube([[0.07, 0.56, s * 0.17], [0.24, 0.5 * (0.56 + hy) + 0.03, s * 0.22], [hx, hy, s * 0.055]], [0.062, 0.05, 0.036], limbCol, null, limbFur); hand([hx + 0.02, hy - 0.005, s * 0.05], [0.05, 0.034, 0.045]);
      tube([[0.0, 0.14, s * 0.13], [0.21, 0.33 + 0.5 * fy, s * 0.26], [fx, fy, s * 0.08]], [0.082, 0.062, 0.04], limbCol, null, limbFur); hand([fx + 0.03, fy - 0.005, s * 0.075], [0.062, 0.03, 0.045]);
    }
  } else if (S_) for (const s of [-1, 1]) {
    tube([[0.04, 0.52, s * 0.17], [0.17, 0.32, s * 0.21], [0.25, 0.2, s * 0.1]], [0.062, 0.05, 0.036], limbCol, null, limbFur); hand([0.26, 0.19, s * 0.1], [0.045, 0.035, 0.045]);
    tube([[0.02, 0.14, s * 0.13], [0.25, 0.3, s * 0.18], [0.31, 0.04, s * 0.13]], [0.082, 0.062, 0.04], limbCol, null, limbFur); hand([0.34, 0.03, s * 0.13], [0.06, 0.03, 0.04]);
  } else if (Lp) {
    const arms = [[[0.16, 0.02, 0.14], [0.36, 0.2, 0.3], [0.56, 0.36, 0.34]], [[0.16, 0, -0.14], [0.42, -0.02, -0.28], [0.66, 0.02, -0.3]]];
    const legs = [[[-0.2, 0, 0.1], [-0.38, 0.1, 0.26], [-0.64, 0.1, 0.3]], [[-0.2, -0.02, -0.1], [-0.3, -0.2, -0.24], [-0.52, -0.34, -0.24]]];
    for (const a of arms) { tube(a, [0.062, 0.05, 0.036], limbCol, null, limbFur); hand(a[2], [0.045, 0.035, 0.04]); }
    for (const a of legs) { tube(a, [0.08, 0.058, 0.038], limbCol, null, limbFur); hand(a[2], [0.055, 0.035, 0.04]); }
  } else for (const s of [-1, 1]) {
    tube([[s * 0.13, 0.2, 0.2], [s * 0.21, 0.31, 0.03], [s * 0.05, 0.44 + s * 0.05, -0.08]], [0.062, 0.05, 0.036], limbCol, null, limbFur); hand([s * 0.04, 0.45 + s * 0.05, -0.085], [0.04, 0.035, 0.04]);
    tube([[s * 0.1, -0.2, 0.22], [s * 0.23, -0.1, 0.02], [s * 0.06, -0.33 - s * 0.04, -0.07]], [0.08, 0.058, 0.038], limbCol, null, limbFur); hand([s * 0.05, -0.34 - s * 0.04, -0.08], [0.045, 0.035, 0.045]);
  }
  // the tail: as long as the body, thick and bushy, dark brown at the root, gold, pale at the tip
  if (!Hd) {
    const TL = MONKEY_TAIL, free = o.tailFree ?? 0, wMax = o.tailW ?? 1;
    const tp = o.tail || (Pc ? [[-0.2, 0.1, 0], [-0.36, -0.04, 0.02], [-0.44, -0.36, 0.035], [-0.44, -0.74, 0.01], [-0.39, -1.06, -0.03], [-0.29, -1.26, -0.06]]
      : S_ ? [[-0.17, 0.1, 0], [-0.46, 0.06, 0.06], [-0.8, 0.045, 0.02], [-1.12, 0.04, -0.06]] : Lp ? [[-0.27, 0.02, 0], [-0.62, 0.1, 0], [-0.98, 0.17, 0], [-1.34, 0.2, 0]] : [[0, -0.26, 0.33], [0, -0.26, 0.33 + TL / 3], [0, -0.26, 0.33 + 2 * TL / 3], [0, -0.26, 0.33 + TL]]);
    const tr = tp.map((_, i) => { const t = i / (tp.length - 1); return 0.043 + 0.012 * Math.sin(t * Math.PI) - (0.02 + 0.014 * (o.tailThin || 0)) * t * t; });
    tube(tp, tr, (p, n, t) => cBack.clone().lerp(cGold, 0.2 + 0.6 * sstep(0.05, 0.55, t)).lerp(cPale, sstep(0.65, 1, t) * 0.85), (t) => wMax * (free > 0 ? sstep(free, 1, t) : t),
      { n: Math.round(90 * k), len: [0.08, 0.15], wid: 0.05, lift: o.tailLift ?? 0.9, comb: 'along', tip: cTip }, 6, 5);
  }
  return { position: P, normal: N, color: C, tail: W, smooth: S, index: I, headAt: hc };
}

function monkeyMesh(U, list, gold) {
  // clinging to the parting culms: they take the culm's own transform at their grip height in the vertex shader (they
  // cannot detach); the tail hangs from the rump and streams out on the same gusts
  const fm = furMonkey(gold, 'cling'), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(fm.position, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(fm.normal, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(fm.color, 3));
  g.setAttribute('aTail', new THREE.Float32BufferAttribute(fm.tail, 1));
  g.setAttribute('aSm', new THREE.Float32BufferAttribute(fm.smooth, 1));
  g.setIndex(fm.index);
  const base = [], culm = [], grip = [];
  for (const m of list) { const c = m.culm; base.push(c.x, c.y, c.z); culm.push(c.h, c.stiff, c.leanAz, c.lean); grip.push(m.s, m.az, m.scale, m.seed); }
  instAttr(g, 'aBase', base, 3); instAttr(g, 'aCulm', culm, 4); instAttr(g, 'aGrip', grip, 4);
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec3 aBase, aCol; attribute vec4 aCulm, aGrip; attribute float aTail, aSm;
      varying vec3 vN, vV, vC, vO; varying float vSm;
      #include <fog_pars_vertex>
      ${GLSL_WIND}
      void main(){
        vec3 T, wg;
        vO = position;
        vec3 c = bsCulm(aBase, aCulm, aGrip.x, T, wg);
        vec3 outw = vec3(cos(aGrip.y), 0.0, sin(aGrip.y));
        vec3 Z = outw - T*dot(outw, T); Z = Z/max(length(Z), 1e-3);
        vec3 X = cross(T, Z);
        float gs = clamp(wg.x + 0.5*wg.y + wg.z, 0.0, 1.3);
        vec3 lp = position;
        lp.z += 0.02*sin(uTime*2.1 + aGrip.w*20.0)*(1.0 - aTail);                 // breathing, shifting grip
        vec3 p = c + (X*lp.x + T*lp.y + Z*lp.z)*aGrip.z;
        vec3 n = X*normal.x + T*normal.y + Z*normal.z;
        // tail: built straight out from the rump; at rest it hangs, in a gust it streams downwind (or along the splay),
        // sagging along its length, with a travelling flutter
        vec3 pd = bsPart(aBase.xz, 1.0);
        vec3 dw = normalize(mix(vec3(uWind.x, -0.38, uWind.y), vec3(pd.x*1.1, -0.3, pd.y*0.55), min(pd.z, 1.0)) + vec3(0.0, 1e-3, 0.0));
        float k = clamp(0.25 + 0.75*gs, 0.0, 1.0);
        vec3 dt = normalize(mix(vec3(0.0, -1.0, 0.0) + Z*0.3, dw, k));
        float len = ${MONKEY_TAIL.toFixed(2)}*aGrip.z*aTail;
        vec3 fl = cross(dw, vec3(0.0, 1.0, 0.0))*sin(uTime*(6.0 + 3.0*gs) - aTail*5.0 + aGrip.w*9.0)*(0.05 + 0.12*gs)*aTail;
        p += (dt - Z)*len - vec3(0.0, 0.16, 0.0)*(aTail*len*k) + fl*aGrip.z;
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vN = normalize(normalMatrix*n); vV = mvPosition.xyz; vC = aCol; vSm = aSm;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold;
      varying vec3 vN, vV, vC, vO; varying float vSm;
      #include <fog_pars_fragment>
      ${GLSL_LIGHT}
      ${GLSL_FUR}
      void main(){
        vec3 V = normalize(-vV), L = bsSunDir();
        vec3 N = normalize(vN); N = faceforward(N, -V, N);
        // a lit side and a shaded side, a dark belly, and a gold rim against the sky; the face and hands are bare skin
        float fur = bsNoise(vO.xy*vec2(70.0, 22.0) + vO.z*31.0)*0.6 + bsNoise(vO.zy*vec2(160.0, 50.0))*0.4;       // combed fur, darker in the partings
        vec3 col = bsFur(vC*0.76, N, V, L, normalize(mat3(viewMatrix)*vec3(0.0, 1.0, 0.0)), fur, 1.0, 1.5, mix(uGold, vec3(1.0, 0.92, 0.75), 0.55), 1.0 - clamp(vSm, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('bamboo-surf-hero') : ctx.rng, heroRng = rng;
  const noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map(lin);
  const hour = opts.hour || opts.weather || 'storm', season = opts.season || 'summer';
  const density = Math.min(1.3, Math.max(0.5, opts.density ?? 1));
  const R = 56;

  // ---- per-seed layout ----
  const laneAmp = opts.lane?.amp ?? rng.range(1.6, 3.2) * rng.sign(), laneFreq = opts.lane?.freq ?? rng.range(0.045, 0.07), lanePh = opts.lane?.ph ?? rng.range(0, 6.28);
  const laneX = (z) => laneAmp * Math.sin(z * laneFreq + lanePh);
  const bankH = rng.range(4.5, 6.5), ridgeH = rng.range(11.5, 14.5), nOff = rng.range(0, 50);
  const ownHeight = (x, z) => {
    const gz = ridgeH * Math.pow(sstep(34, -46, z), 1.3) * (1 - 0.75 * sstep(-46, -84, z));
    const dx = x - laneX(z);
    const bank = (1 - Math.exp(-(dx * dx) / 100)) * bankH * sstep(-46, -12, z);
    const n = noise.fbm2(x * 0.035 + nOff, z * 0.035, 3) * 1.7 * (0.3 + 0.7 * sstep(3, 12, Math.abs(dx)));
    const r = Math.hypot(x, z);
    return (gz + bank + n) * (1 - sstep(R - 14, R + 6, r)) - 1.5 * sstep(R + 1, R + 6, r);
  };
  const heightAt = typeof opts.heightFn === 'function' ? opts.heightFn : ownHeight;
  const windDir = new THREE.Vector2(0.7071, -0.7071);
  const windPh = rng.range(0, 6.28);

  // ---- colours by hour and season ----
  const jade = pal[0].clone(), lime = pal[1].clone(), deep = pal[2].clone(), celadon = pal[3].clone();
  const sunTint = new THREE.Vector3(1, 1, 1); let sunGain = 1; const shaftCol = lime.clone().lerp(lin('#ffffff'), 0.25);
  if (hour === 'noon') { sunGain = 0.12; jade.lerp(deep, 0.35); lime.lerp(pal[3], 0.5); celadon.lerp(lin('#cfd9d8'), 0.75); }
  else if (hour === 'evening') { sunTint.set(1.3, 0.85, 0.45); shaftCol.set('#ffd27a').lerp(lime, 0.25); }
  else if (hour === 'night') { sunTint.set(0.75, 0.85, 1.15); jade.lerp(deep, 0.3); lime.lerp(lin('#c8d6e0'), 0.55); celadon.lerp(lin('#d6dde2'), 0.8); shaftCol.set('#dfe8ff'); }

  const U = {
    uTime: { value: 0 }, uPx: { value: 0.002 },
    uWind: { value: new THREE.Vector4(windDir.x, windDir.y, 1, windPh) },
    uBand: { value: new THREE.Vector4(1, 0, 0, 0) },                     // the world's swell band (heading x, z; metres along it; on): the crowns in it turn pale
    uOld: { value: new THREE.Vector4(0, 0, 1, 0) },                      // a clump that stands in a shaft of its own (centre x, z; radius; how much more sun its stems take)
    uBreak: { value: new THREE.Vector4(0, 0, 300, 0) }, uBreakSun: { value: 0 },      // the world's break in the cloud (centre x, z; radius; on) and how much brighter the sun is in it
    uBreak2: { value: new THREE.Vector4(0, 0, 300, 0) },                              // a second opening of the same cloud (the plumes read both)
    uPart: { value: new THREE.Vector4(-100, 0, PART_Z0, PART_LEN) },
    uLane: { value: new THREE.Vector4(laneAmp, laneFreq, lanePh, 0) },
    uGlades: { value: Array.from({ length: 16 }, () => new THREE.Vector3(1e5, 1e5, 1)) },
    uGully: { value: new THREE.Vector3() },
    uSunGain: { value: sunGain }, uSunTint: { value: sunTint },
    uJade: { value: jade }, uLime: { value: lime }, uDeep: { value: deep }, uCeladon: { value: celadon },
    uSlate: { value: pal[4] }, uWhite: { value: pal[5] }, uGold: { value: pal[6] },
    uShaftCol: { value: shaftCol }, uAtlas: { value: null },
    uSnow: { value: season === 'snow' ? 1 : 0 }, uYellow: { value: season === 'spring' ? 1 : 0 },
    uFill: { value: new THREE.Vector2(0.22, 1.35) },      // x: sun leaking through the shut canopy, y: gain on the trunk-space fill
    uFlower: { value: new THREE.Vector4(0, 0, 1, 0) },    // a slope that has flowered: centre x, z, radius, amount (the world sets it; plumes there turn straw-gold)
  };
  const gy0 = heightAt(laneX(PART_Z0), PART_Z0), gy1 = heightAt(laneX(PART_Z0 - PART_LEN), PART_Z0 - PART_LEN);
  U.uGully.value.set(gy0, (gy1 - gy0) / PART_LEN, 0);

  const root = new THREE.Group(); root.name = 'bamboo-surf-hero';
  const own = new THREE.Group(); own.name = 'bamboo-surf-stand'; root.add(own);
  const culmMat = culmMaterial(U);
  U.uAtlas.value = makeAtlas(rng.fork ? rng.fork('atlas') : rng);
  const plumeMat = plumeMaterial(U);
  await ctx.yield?.();

  // ---- culms ----
  const makeCulm = (x, z, near, o = {}, rng0 = null) => {
    const rng = rng0 || heroRng;                                 // (o.rng of plant(): planting that leaves the stand's own draws alone)
    const r = o.r ?? rng.range(0.06, 0.09) * (near ? 1 : 0.92);
    const roll = rng();
    return {
      x, z, y: o.y ?? heightAt(x, z) - 0.15, near,
      h: o.h ?? rng.range(22, 26) * (0.86 + r * 1.9), r,
      stiff: rng.range(0.82, 1.18) * (0.075 / r) ** 0.35,
      leanAz: Math.atan2(windDir.y, windDir.x) + rng.gauss() * 1.1, lean: rng.range(0.05, 0.3) * (season === 'snow' ? 1.6 : 1),
      age: o.age ?? (roll < 0.16 ? rng.range(0, 0.22) : roll < 0.7 ? rng.range(0.3, 0.6) : rng.range(0.65, 1.0)),
      seed: rng(), node: rng.range(0.3, 0.42),
    };
  };
  const cell = 1.5, grid = new Map();
  const free = (x, z, min) => {
    const gx = Math.floor(x / cell), gz = Math.floor(z / cell);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const b = grid.get((gx + i) + ',' + (gz + j)); if (!b) continue;
      for (const c of b) if ((c.x - x) ** 2 + (c.z - z) ** 2 < min * min) return false;
    }
    return true;
  };
  const put = (c) => { const k = Math.floor(c.x / cell) + ',' + Math.floor(c.z / cell); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c); };
  const nearList = [], farList = [];
  const nNear = Math.round(260 * density), nFar = Math.round(548 * density * (0.6 + 0.4 * detail));
  for (let tries = 0; nearList.length < nNear && tries < nNear * 30; tries++) {
    const z = rng.range(-R + 3, R - 2), sd = rng.sign(), dx = 4.7 + 9.3 * Math.pow(rng(), 1.25);
    const x = laneX(z) + sd * dx;
    if (Math.hypot(x, z) > R - 1.5 || !free(x, z, 1.25)) continue;
    const c = makeCulm(x, z, true); nearList.push(c); put(c);
  }
  for (let tries = 0; farList.length < nFar && tries < nFar * 30; tries++) {
    const a = rng.range(0, 6.2832), rr = (R - 1) * Math.sqrt(rng()), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (Math.abs(x - laneX(z)) < 14 || !free(x, z, 1.5)) continue;
    if (noise.n2(x * 0.05 + 9, z * 0.05) < -0.45 && rng.chance(0.7)) continue;         // small glades
    const c = makeCulm(x, z, false); farList.push(c); put(c);
  }
  // dead culms leaning in the forks of others, rocking
  for (let i = 0; i < 12; i++) {
    const z = rng.range(-R * 0.7, R * 0.8), x = laneX(z) + rng.sign() * rng.range(7, 30);
    if (Math.hypot(x, z) > R - 4) continue;
    const c = makeCulm(x, z, Math.abs(x - laneX(z)) < 14, { age: 1.25, h: rng.range(13, 19), r: 0.055 });
    c.lean = rng.range(0.55, 0.95); c.leanAz = rng.range(0, 6.28); c.stiff = 0.3;
    (c.near ? nearList : farList).push(c);
  }
  // a dead leaner inside the parting must fall away from the lane: splayed across it, it showed as a dark bar under the V
  for (const c of nearList.concat(farList)) {
    if (c.age < 1.05 || c.z > PART_Z0 + 10 || c.z < PART_Z0 - PART_LEN - 16) continue;
    const dx = c.x - laneX(c.z);
    if (Math.abs(dx) < 32) { c.leanAz = Math.atan2(-0.35, dx < 0 ? -1 : 1); c.lean = Math.min(c.lean, 0.6); }
  }
  // build-time clearance: no near culm at full bend may come within 2.5 m of the lane centre below 9 m,
  // nor within 6 m at rest (lean included)
  let pushed = 0;
  for (const c of nearList) {
    const dx = c.x - laneX(c.z), s = 9, q = s / c.h;
    const th = (0.65 * c.stiff + c.lean + 0.04) * Math.pow(q, 1.6), hx = s * th / 2.6;
    const need = Math.max(2.5 + hx + c.r, 4.5) - Math.abs(dx);
    if (need > 0) { c.x += Math.sign(dx) * need; c.y = heightAt(c.x, c.z) - 0.15; pushed++; }
  }
  // the six monkey culms: veterans 8-12 m either side of the lane inside the parting
  const monkeys = [];
  if (opts.monkeys !== false) {
    for (let i = 0; i < 6; i++) {
      const sd = i % 2 ? 1 : -1, zT = PART_Z0 - 13 - Math.floor(i / 2) * 12 - (sd > 0 ? 5 : 0), dT = 8 + (i % 3) * 1.7;
      let best = null, bd = 1e9;
      for (const c of nearList) {
        if (c.age > 1.05 || c.monkey) continue;
        const dx = c.x - laneX(c.z); if (Math.sign(dx) !== sd) continue;
        const d = (c.z - zT) ** 2 + (Math.abs(dx) - dT) ** 2; if (d < bd) { bd = d; best = c; }
      }
      if (!best || bd > 36) { const z = zT, x = laneX(z) + sd * dT; best = makeCulm(x, z, true); nearList.push(best); }
      best.monkey = true; best.r = 0.09; best.h = Math.max(best.h, 25); best.age = rng.range(0.6, 0.85); best.lean = Math.min(best.lean, 0.12);
      monkeys.push({ culm: best, s: rng.range(12.5, 17), az: Math.atan2(-0.4, -sd) + rng.range(-0.5, 0.5), scale: rng.range(1.1, 1.3) * (opts.monkeyScale ?? 1), seed: rng() });
    }
  }
  await ctx.yield?.();

  const culmNear = culmMesh(nearList, 6, 10, culmMat), culmFar = culmMesh(farList, 4, 5, culmMat);
  own.add(culmNear, culmFar, footMesh(U, nearList, heightAt));
  const all = nearList.concat(farList);
  const plumes = plumeMesh(all, rng, plumeMat, 5, 3);
  own.add(plumes);
  await ctx.yield?.();

  if (opts.shell !== false) own.add(shellMesh(U, R, heightAt, noise));
  if (opts.ground !== false) own.add(groundMesh(U, R, heightAt, noise, rng, laneX));
  await ctx.yield?.();

  // ferns: everywhere but thickest on the banks, none in the stream line
  const ferns = [], nFern = Math.round(1200 * (0.5 + 0.5 * detail));
  for (let i = 0; i < nFern * 3 && ferns.length < nFern; i++) {
    const a = rng.range(0, 6.2832), rr = (R + 2) * Math.sqrt(rng()), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const dx = Math.abs(x - laneX(z)); if (dx < 1.6) continue;
    if (dx > 16 && rng.chance(0.45)) continue;
    ferns.push({ x, y: heightAt(x, z) - 0.05, z, rot: rng.range(0, 6.28), size: rng.range(0.9, 1.7), seed: rng(), tone: rng() });
  }
  await ctx.yield?.();
  // (the loop above only keeps the random sequence of earlier builds; the fern layer itself is laid below)
  // a knee-deep layer, near-continuous beside the lane and up the banks, broken by the litter paths; sparser beyond
  {
    const frng = ctx.core?.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('bs-ferns:' + ctx.seed)) : rng;
    const fNear = [], fFar = [], nA = Math.round(1300 * (0.5 + 0.5 * detail)), nB = Math.round(500 * (0.5 + 0.5 * detail));
    for (let i = 0; i < nA * 4 && fNear.length < nA; i++) {
      const z = frng.range(-R + 1, R + 1), x = laneX(z) + frng.sign() * (3.0 + 13.5 * Math.pow(frng(), 1.4));
      if (Math.hypot(x, z) > R + 2 || fernCover(x, z) < 0.5) continue;
      fNear.push({ x, y: heightAt(x, z) - 0.06, z, rot: frng.range(0, 6.28), size: frng.range(1.0, 1.75), seed: frng(), tone: frng() });
    }
    for (let i = 0; i < nB * 4 && fFar.length < nB; i++) {
      const a = frng.range(0, 6.2832), rr = (R + 2) * Math.sqrt(frng()), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (Math.abs(x - laneX(z)) < 15 || fernCover(x, z) < 0.5) continue;
      fFar.push({ x, y: heightAt(x, z) - 0.06, z, rot: frng.range(0, 6.28), size: frng.range(1.2, 2.1), seed: frng(), tone: frng() });
    }
    await ctx.yield?.();
    const fa = fernMesh(U, fNear), fb = fernMesh(U, fFar, { fronds: 4, segs: 1 }); fa.name = fb.name = 'bamboo-surf-ferns';   // named so the world can drop them once the camera is up in the crowns
    own.add(fa, fb);
  }
  await ctx.yield?.();
  const nLeaf = Math.round((season === 'summer' ? 8000 : 9000) * (0.5 + 0.5 * detail));
  const leaves = leafMesh(U, nLeaf, rng, R, 0.36);
  root.add(leaves);
  await ctx.yield?.();
  // shafts: gaps in the crowns, mostly along the lane where the camera will see them land
  const tops = [];
  for (let i = 0; i < 16; i++) {
    const z = rng.range(-R * 0.75, R * 0.8), x = laneX(z) + (i % 3 === 0 ? rng.range(-3, 3) : rng.sign() * rng.range(6, 30));
    if (Math.hypot(x, z) > R - 6) continue;
    tops.push({ x, y: heightAt(x, z) + rng.range(20, 23), z, w: rng.range(1.3, 2.8), len: rng.range(26, 34) });
  }
  const shafts = shaftMesh(U, tops); own.add(shafts);
  let monkeyObj = null;
  if (monkeys.length) { monkeyObj = monkeyMesh(U, monkeys, '#' + pal[6].getHexString()); own.add(monkeyObj); }
  await ctx.yield?.();

  // ---- more bamboo with the same materials (for the rest of the world's path) ----
  const planted = [];
  const boughRng = ctx.core?.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('bs-boughs:' + ctx.seed)) : rng;
  function plant(list, o = {}) {
    const near = [], far = [];
    for (const it of list) {
      const c = makeCulm(it.x, it.z, it.near !== false, { y: it.y, h: it.h, r: it.r, age: it.age }, o.rng);
      if (it.lean !== undefined) c.lean = it.lean;
      if (it.leanAz !== undefined) c.leanAz = it.leanAz;
      if (it.stiff !== undefined) c.stiff = it.stiff;
      if (it.plume !== undefined) c.plume = it.plume;
      if (it.span !== undefined) c.span = it.span;                 // how far down from the tip the sprays stand (0.45 of the height)
      else if (o.span !== undefined && c.near) c.span = o.span;
      (c.near ? near : far).push(c);
    }
    const grp = new THREE.Group(); grp.name = 'bamboo-surf-planted';
    if (near.length && o.culms !== false) grp.add(culmMesh(near, 6, 10, culmMat));
    if (near.length && o.culms !== false && o.feet !== false) grp.add(footMesh(U, near, heightAt));
    if (far.length && o.culms !== false) grp.add(culmMesh(far, 4, 5, culmMat));
    if (o.plumes !== false) grp.add(plumeMesh(near.concat(far), o.rng || rng, plumeMat, o.perNear ?? 5, o.perFar ?? 3, { arch: o.arch, from: o.from }));
    if (o.boughs && near.length) grp.add(plumeMesh(near, boughRng, plumeMat, 0, 0, { low: o.boughs }));     // (a rng of their own: the stand's draws stay as they were)
    root.add(grp); planted.push(grp);
    return grp;
  }

  // ---- more monkeys on culms of their own, where the world wants them: list = [{ x, z, s (grip height up the stem), az, scale, h? }] ----
  function addMonkeys(list, o = {}) {
    const culms = [], ms = [];
    for (const it of list) {
      let c = it.share !== undefined ? culms[it.share] : null;
      if (!c) { c = makeCulm(it.x, it.z, true, { h: it.h ?? rng.range(25, 27.5), r: 0.09, age: rng.range(0.6, 0.85) }); c.lean = it.lean ?? rng.range(0.03, 0.09); c.monkey = true; }
      culms.push(c);
      ms.push({ culm: c, s: it.s, az: it.az, scale: it.scale ?? 1.5, seed: rng() });
    }
    const uniq = culms.filter((c, i) => culms.indexOf(c) === i);
    const grp = new THREE.Group(); grp.name = 'bamboo-surf-monkeys';
    grp.add(culmMesh(uniq, 6, 10, culmMat), plumeMesh(uniq, rng, plumeMat, o.sprays ?? 2, 2), monkeyMesh(U, ms, '#' + pal[6].getHexString()));
    own.add(grp);
    return { group: grp, rest: ms.map(restGrip) };
  }

  // ---- anchors ----
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const floorY = (z) => heightAt(laneX(z), z);
  const crownTop = heightAt(0, -46) + 26;
  const yTop = crownTop + 6;
  const flyThrough = [];
  const zClimb0 = 14, y0 = floorY(zClimb0) + 3, zClimb1 = zClimb0 - (yTop - y0) / Math.tan(Math.PI / 6);
  for (const z of [R + 30, R, 40, 26]) flyThrough.push(V3(laneX(Math.min(z, R)), Math.max(floorY(Math.min(z, R)), 0) + 3, z));
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, e = t * t * (3 - 2 * t), z = zClimb0 + (zClimb1 - zClimb0) * t;
    flyThrough.push(V3(laneX(z) * (1 - e), y0 + (yTop - y0) * (0.35 * t + 0.65 * e), z));
  }
  flyThrough.push(V3(0, yTop, zClimb1 - 30), V3(0, yTop, zClimb1 - 70));
  const restGrip = (m) => {
    const c = m.culm, q = m.s / c.h, th = c.lean * Math.pow(q, 1.6), hx = m.s * th / 2.6;
    return V3(c.x + Math.cos(c.leanAz) * hx, c.y + m.s, c.z + Math.sin(c.leanAz) * hx);
  };
  const anchors = {
    flyThrough,
    partingStart: V3(laneX(PART_Z0), floorY(PART_Z0), PART_Z0),
    partingEnd: V3(laneX(PART_Z0 - PART_LEN), floorY(PART_Z0 - PART_LEN), PART_Z0 - PART_LEN),
    portalSeat: { position: V3(0, crownTop + 6, zClimb1 - 70), facing: V3(0, 0, 1) },
    viewpoints: {
      mouth: V3(laneX(24), floorY(24) + 3, 24),
      insideV: V3(laneX(-8) * 0.6, y0 + (yTop - y0) * 0.3, -8),
      above: V3(0, yTop, zClimb1 - 8),
      flank: V3(R + 16, 14, 6),
    },
    monkeys: monkeys.map(restGrip),
    windDir: V3(windDir.x, 0, windDir.y),
    sunSide: V3(-0.45, 0.42, 0.79).normalize(),
    crownTop,
  };

  // ---- clocks ----
  let partSec = null, windK = 1;
  const uPartStart = opts.uPart ?? 0.565, duration = opts.duration ?? 41;
  const applyPart = (sec) => {
    const tRel = PART_LEN / PART_SPEED + 3.0;
    U.uPart.value.x = sec >= 0 ? sec * PART_SPEED : -100;
    U.uPart.value.y = sstep(tRel, tRel + 2.5, sec);
  };
  const size = new THREE.Vector2();
  const gust = (x, z, t) => {
    const a = x * windDir.x + z * windDir.y, c = -x * windDir.y + z * windDir.x;
    const w = Math.sin(c * 0.045 + windPh) * 7 + Math.sin(c * 0.11 + t * 0.2 + windPh * 2) * 2.5;
    return [jsPulse(fract((26 * t - a - w) / 110 + windPh * 0.31)), jsPulse(fract((30 * t - a + w * 0.4) / 30 + 0.37))];
  };

  const radius = R, height = ridgeH + 28, center = V3(0, 15, -4);

  return {
    object: root, radius, height, center, anchors,
    ground: true, groundY: -1.4,
    heightAt, laneX, plant, own, leaves, monkeyList: monkeys,
    addFerns: (list, o) => fernMesh(U, list, o),
    addShafts: (list) => shaftMesh(U, list),
    addHalos: (list) => haloMesh(U, list),
    groundMaterial: () => groundMaterial(U, 1e6),
    setGlade(i, x, z, r) { U.uGlades.value[i].set(x, z, r); },
    setLitClump(x, z, r, gain) { U.uOld.value.set(x, z, r, gain); },
    setLeafCenter(v) { leaves.material.uniforms.uLeafC.value.copy(v); },
    wind: { glsl: GLSL_WIND, uniforms: U, gust, dir: windDir },
    stats: { culms: all.length, plumes: plumes.userData.count, monkeys: monkeys.length, pushed },
    setProgress(u) { partSec = (u - uPartStart) * duration; },
    setParting(sec) { partSec = sec; },
    setWind(k) { windK = k; },
    setSun(g) { U.uSunGain.value = sunGain * g; },
    setFill(shut, fill) { U.uFill.value.set(shut, fill); },
    addMonkeys,
    update(dt, time, camera) {
      U.uTime.value = time;
      U.uWind.value.z = windK;
      if (camera && ctx.renderer) {
        ctx.renderer.getDrawingBufferSize(size);
        U.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 1e-3) * Math.max(size.y, 1));
      }
      const sec = partSec !== null ? partSec : (time % 18) - 9.5;
      applyPart(sec);
    },
    dispose() { /* everything is reachable from `object` (geometries, materials, the atlas texture) */ },
  };
}
