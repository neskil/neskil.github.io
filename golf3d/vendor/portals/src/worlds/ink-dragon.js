// MOUNTAINS OF WET INK (world id: ink-dragon)
// A sumi ink-wash gorge on rice paper that loads itself with wet ink as the camera flies in: ghost washes of
// karst towers darken into wet blots and dry sharp when the paint front (around the camera, and 120 m around
// the ink dragon's head) reaches them. River flight past a lantern raft, a climb through a mist deck, a sea of
// peaks above it, the dragon coiling round a pavilion summit before the red sun, then its tail paints the enso
// that frames the exit portal.
// Unlit: every material here is a ShaderMaterial that outputs ink density over a screen-anchored paper.
// Variations by seed / ctx.vary: paper and hour (morning sun, evening sun half sunk, night sheet with a reserved
// moon), season (clear, autumn maple, spring plum, snow, rain white-out), cast swaps (raft / angler's skiff,
// cranes / geese, carp rings / river dolphin) and the rare event: a second, diluted dragon and a double enso.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/ink-dragon.js';

const PAL = ['#EFE8D8', '#D5D1C4', '#A3A49D', '#5F6462', '#2C2F30', '#101112', '#C8321E'];
const EXPOSURE = 1.5;
const MIST_LO = 68, MIST_HI = 122;

// ---- display colour -> scene-linear value that the post chain (exposure, ACES) maps back onto it ----
function acesJS(r, g, b) {
  const f = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
  const a = f(0.59719 * r + 0.35458 * g + 0.04823 * b), c = f(0.076 * r + 0.90834 * g + 0.01566 * b), d = f(0.0284 * r + 0.13383 * g + 0.83777 * b);
  return [1.60475 * a - 0.53108 * c - 0.07367 * d, -0.10208 * a + 1.10813 * c - 0.00605 * d, -0.00327 * a - 0.07276 * c + 1.07602 * d];
}
function sceneColor(hex, gain = 1) {
  const t = new THREE.Color(hex), x = [t.r, t.g, t.b], tt = [Math.min(t.r, 0.93), Math.min(t.g, 0.93), Math.min(t.b, 0.93)];
  for (let i = 0; i < 80; i++) {
    const y = acesJS(x[0] * EXPOSURE / 0.6, x[1] * EXPOSURE / 0.6, x[2] * EXPOSURE / 0.6);
    for (let k = 0; k < 3; k++) x[k] = clamp(x[k] * Math.pow((tt[k] + 2e-3) / (Math.max(0, y[k]) + 2e-3), 0.7), 1e-4, 4);
  }
  return new THREE.Color(x[0] * gain, x[1] * gain, x[2] * gain);
}

// the same inverse in GLSL, exact: everything here is composed in display-linear colour (so a 50 % wash looks
// like a 50 % wash) and converted to the scene-linear value the post chain will map back onto it
const TONE_GLSL = (() => {
  const inv = (e) => new THREE.Matrix3().fromArray(e).invert().elements.map((v) => v.toFixed(6)).join(',');
  const inI = inv([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]);
  const outI = inv([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]);
  return /* glsl */`
  vec3 toScene(vec3 D){
    vec3 y = clamp(mat3(${outI})*clamp(D, 0., 0.95), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, Cc = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
    return max(mat3(${inI})*v, 0.)*${(0.6 / EXPOSURE).toFixed(5)};
  }
  // colour and alpha to blend over paper (in scene space) so that the result has the tone of the display-space
  // wash; the ink keeps its own colour, so overlapping strokes simply darken
  vec4 compose(vec3 pap, vec3 col, float alpha){
    vec3 Xi = toScene(col), Xp = toScene(pap), Xm = toScene(mix(pap, col, alpha));
    float den = Xp.g - Xi.g;
    return vec4(Xi, abs(den) < 1e-3 ? alpha : clamp((Xp.g - Xm.g)/den, 0., 1.));
  }
  // the exact answer over bare paper (its colour is only right where nothing else lies underneath)
  vec4 composeTrue(vec3 pap, vec3 col, float alpha){
    vec3 Xp = toScene(pap), Xm = toScene(mix(pap, col, alpha));
    vec3 k = 1. - Xm/max(Xp, 1e-4); float a2 = max(k.r, max(k.g, k.b));
    if (a2 < 0.003) return vec4(toScene(col), alpha);
    a2 = min(a2, 1.); return vec4(max((Xm - Xp*(1. - a2))/a2, 0.), a2);
  }`;
})();

// ---- GLSL shared by everything painted here ----
const INK_GLSL = /* glsl */`
  ${TONE_GLSL}
  uniform vec3 uPaper, uInk, uInk2, uRed, uMoon;
  uniform vec4 uMist;                 // lo, hi, hide-below 0..1, white-out 0..1
  uniform float uTime, uU, uDur, uVis, uPxs, uSnow, uNight;
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
  float granulate(float dens, vec2 p){ float g = vnoise(p*5.3)*0.55 + vnoise(p*12.1 + 7.)*0.45;
    return dens*(1. - mix(0.3, 0.05, smoothstep(0.55, 1., dens))*(1. - g)); }
  // rice paper, anchored to the screen: long fibres in two directions, fine tooth, faint water stains
  vec3 paperAt(vec2 fc){ vec2 p = fc/uPxs;
    float f = vnoise(p*vec2(0.03, 0.8) + 3.)*0.5 + vnoise(vec2(p.x*0.55 + p.y*0.45, (p.y - p.x*0.8)*0.028) + 11.)*0.5;
    float fine = vnoise(p*0.85 + 40.);
    float stain = vnoise(p*0.0052 + 5.)*0.6 + vnoise(p*0.016 + 9.)*0.4;
    float ring = smoothstep(0.5, 0.56, stain)*(1. - smoothstep(0.56, 0.7, stain));
    // the night sheet carries a pale wash laid in broad, slightly uneven passes (screen-anchored like the paper)
    float pass = vnoise(vec2(p.x*0.0035 + p.y*0.0012, p.y*0.016))*0.6 + vnoise(vec2(p.x*0.011, p.y*0.05) + 17.)*0.4;
    return uPaper*(1. + 0.06*(f - 0.5) + 0.03*(fine - 0.5) - 0.035*smoothstep(0.56, 0.9, stain) - 0.03*ring)*(1. - uNight*0.13*pass); }
  float mistAt(vec3 w){
    float n = vnoise(w.xz*0.0045 + uTime*vec2(0.021, 0.008)) + 0.5*vnoise(w.xz*0.013 - uTime*vec2(0.012, 0.03)) - 0.75;
    float y = w.y + n*30.;
    float band = smoothstep(uMist.x, uMist.x + 22., y)*(1. - smoothstep(uMist.y - 22., uMist.y, y));
    float below = (1. - smoothstep(uMist.y - 30., uMist.y, y))*uMist.z;
    return max(band, below); }
  float farFade(float dist){ return exp(-pow(dist/uVis, 1.6)*2.); }
  float airK(vec3 w, float dist){ return (1. - mistAt(w))*(1. - uMist.w*smoothstep(25., 110., dist))*farFade(dist); }
  vec3 inkCol(float d){ return mix(uInk2, uInk, smoothstep(0.35, 1., d)); }
`;

// ---- the paper sky ----
const DOME_VS = /* glsl */`
  varying vec3 vDir;
  void main(){ vDir = position; vec4 mv = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mv; }`;
const DOME_FS = /* glsl */`
  ${INK_GLSL}
  varying vec3 vDir;
  void main(){
    vec3 col = paperAt(gl_FragCoord.xy);
    gl_FragColor = vec4(toScene(col), 1.);
  }`;

// ---- the sun seal (or the reserved moon): a disc that rides with the camera 1500 m out, in front of the far
// ridges and behind every nearer tower, whose pale mist-feet cover it as mist would ----
const SUN_VS = /* glsl */`
  varying vec2 vP;
  void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const SUN_FS = /* glsl */`
  ${INK_GLSL}
  uniform vec4 uSun;                 // strength, cut height in disc radii (-9 = none), moon 0/1, halo
  varying vec2 vP;
  void main(){
    float r = length(vP), pa = atan(vP.y, vP.x + 1e-5);
    float rag = 1. + 0.018*sin(pa*5. + 1.) + 0.012*sin(pa*13. + 4.);
    float cut = smoothstep(uSun.y - 0.03, uSun.y + 0.04 + 0.1*vnoise(vec2(vP.x*5., 3.)), vP.y);
    float disc = (1. - smoothstep(rag*0.955, rag, r))*cut;
    float halo = exp(-r*1.15)*uSun.w*smoothstep(3.2, 1.8, r)*cut;
    vec3 pap = paperAt(gl_FragCoord.xy);
    vec3 col = uSun.z < 0.5 ? uRed*(0.95 + 0.07*vnoise(vP*3.)) : uMoon*(0.97 + 0.05*vnoise(vP*7.));
    float alpha = max(disc, halo)*(1. - uMist.w)*uSun.x;
    if (alpha < 0.004) discard;
    gl_FragColor = compose(pap, col, alpha);
  }`;

// ---- karst towers: opaque, colour = paper under an ink density with three wetness stages ----
const TOWER_VS = /* glsl */`
  ${INK_GLSL}
  attribute vec4 aInfo;               // inkU, seed, radius, height
  uniform float uRefl;
  varying vec3 vW, vN, vNs, vL; varying vec4 vI; varying float vDist;
  void main(){
    vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    float tS = (uU - aInfo.x)*uDur;
    float blot = smoothstep(0., 0.3, tS)*(1. - smoothstep(0.7, 1.5, tS));
    vec3 p = position;
    p.xz += normalize(normal.xz + 1e-4)*(2.2*blot/sc.x);                 // the wet blot swells the silhouette
    p.xz += vec2(sin(p.y*3.1 + aInfo.y*37.), cos(p.y*2.3 + aInfo.y*19.))*0.13*p.y;   // each tower leans its own way
    vec4 wp = modelMatrix*instanceMatrix*vec4(p, 1.);
    if (uRefl > 0.5) { wp.x += sin(wp.y*0.21 + uTime*1.7 + aInfo.y*9.)*1.6*smoothstep(0., -30., wp.y); wp.z += sin(wp.y*0.17 - uTime*1.3)*1.1*smoothstep(0., -30., wp.y); }
    vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*(normal/(sc*sc)));
    // the tone follows the column, not its facets: a normal leaning mostly on the tower's axis
    vNs = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*(mix(normal, normalize(vec3(position.x, 0.08, position.z) + 1e-4), 0.72)/(sc*sc)));
    vW = wp.xyz; vL = position; vI = aInfo; vDist = distance(cameraPosition, wp.xyz);
    gl_Position = projectionMatrix*viewMatrix*wp;
  }`;
const TOWER_FS = /* glsl */`
  ${INK_GLSL}
  uniform float uRefl; uniform vec3 uSunDir, uSunUp, uSunK;        // uSunK: cos of the seal's window, tan of its radius, its cut height
  varying vec3 vW, vN, vNs, vL; varying vec4 vI; varying float vDist;
  void main(){
    float seed = vI.y, h = vL.y, wy = abs(vW.y);
    vec3 N = normalize(vN), V = normalize(cameraPosition - vW); if (!gl_FrontFacing) N = -N;
    float ndv = abs(dot(N, V)), ndvS = abs(dot(normalize(vNs), V));
    vec2 q = vec2(atan(vL.z, vL.x)*vI.z, h*vI.w);                      // metres on the rock, object-anchored
    // near the eye the tone must not follow the mesh: the facing term is broken up by a wash-sized noise, and the
    // silhouette is nibbled so it is a brush edge, not a polygon edge
    float ndv2 = clamp(ndvS + 0.4*(vnoise(q*0.045 + seed*3.)*0.65 + vnoise(q*0.16 + seed*11.)*0.35 - 0.5), 0., 1.);
    if (uRefl < 0.5 && ndv < 0.13*vnoise(q*0.3 + seed)) discard;
    // the front bleeds across the tower instead of popping
    float bleed = (vnoise(q*0.02 + seed*13.)*0.7 + vnoise(q*0.07 + seed*5.)*0.3)*1.0 + (1. - h)*0.3;
    float tS = (uU - vI.x)*uDur - bleed - uRefl*0.8;
    float wet = smoothstep(0., 0.4, tS), dry = smoothstep(0.55, 1.25, tS), settle = smoothstep(0.6, 2.6, tS);
    // below the mist deck a cliff darkens upward into the mist; above it a peak is darkest at its crest
    float low = (0.3 + 0.7*smoothstep(0., 6., wy))*(0.66 + 0.34*smoothstep(0., 46., wy));
    float crestA = smoothstep(uMist.y - 28., max(vI.w*0.94, uMist.y + 45.), wy);
    float sel = smoothstep(70., 112., wy)*(1. - uRefl);
    float crest = mix(low*0.85, mix(crestA, crestA*crestA, 0.35), sel);
    float body = mix(1.05*low, 0.2 + 0.95*crest, sel);
    // snow: paper left on the crests, the dark gathered at the foot
    float snowTop = uSnow*smoothstep(0.1, 0.55, N.y + (h - 0.75)*0.8 + 0.25*vnoise(q*0.08));
    body = mix(body, 0.3 + 0.6*(1. - crest), uSnow*0.8);
    // dry-brush: bristle tracks running down the rock, drier toward the foot
    float st = vnoise(vec2(q.x*0.2, q.y*0.03) + seed*31.)*0.6 + vnoise(vec2(q.x*0.75, q.y*0.085) + seed*7.)*0.4;
    float dk = mix(0.62, 0.22, crest);
    float keep = smoothstep(dk - 0.22, dk + 0.12, st);
    float full = body*mix(0.42, 1., keep);
    // creases: a few dark vertical strokes and shelf lines
    full += 0.3*smoothstep(0.7, 0.78, vnoise(vec2(q.x*0.4 + seed*3., q.y*0.016)))*(0.3 + 0.7*crest);
    full += 0.22*smoothstep(0.78, 0.84, vnoise(vec2(q.x*0.03 + seed, q.y*0.22)))*crest*smoothstep(0.35, 0.6, vnoise(vec2(q.x*0.12, q.y*0.3 + seed)));   // shelf lines, broken into dashes
    // wet edge: ink pools at the silhouette
    full += 0.7*smoothstep(0.5, 0.95, 1. - ndv2)*(0.35 + 0.65*crest)*mix(0.22, 1., smoothstep(40., 170., vDist));
    // close to, the wash is carried by brush texture instead: broad uneven passes of the loaded brush
    full *= mix(0.78 + 0.44*vnoise(vec2(q.x*0.05 + seed*9., q.y*0.022)), 1., smoothstep(60., 220., vDist));
    full *= 1. - snowTop;
    full = granulate(clamp(full, 0., 1.), q*0.35 + seed)*(1. + 0.035*sin(uTime*1.3 + q.x*0.6 + q.y*0.4));
    float ghost = mix(0.24 + 0.08*fract(seed*7.7), 0.17 + 0.06*fract(seed*7.7), sel)*smoothstep(0.0, 0.18, ndv2)*0.88;
    float blot = 0.62*smoothstep(0.0, 0.5, ndv2)*(0.5 + 0.5*crest)*(0.85 + 0.3*vnoise(q*0.05 + uTime*0.2));
    float d = mix(ghost, blot, wet);
    d = mix(d, full*(0.9 + 0.1*settle), dry);
    d = mix(d, floor(d*5. + 0.5 + 0.45*(vnoise(q*0.8 + seed*3.) - 0.5))/5., mix(0.1, 0.3, smoothstep(60., 250., vDist)));                            // five tones, softly
    if (uRefl > 0.5) {   // only inked rock is mirrored, and the mirror is broken into horizontal dashes sliding on the water
      vec2 sp = gl_FragCoord.xy/uPxs;
      float bar = vnoise(vec2(sp.x*0.011 + uTime*0.22 + seed*9., sp.y*0.2 - uTime*0.5));
      d *= dry*0.8*exp(-wy/34.)*smoothstep(0.46 + 0.14*smoothstep(0., 50., wy), 0.7, bar)*smoothstep(0.03, 0.45, ndv); }
    else d *= 1. - mistAt(vW)*smoothstep(15., 90., vDist);            // inside the deck, what is close still shows
    float ff = farFade(vDist);
    if (uRefl < 0.5 && ff < 0.03) discard;                             // a peak faded to bare paper must not cover the seal
    d *= (1. - uMist.w*smoothstep(70., 260., vDist))*ff;
    d = clamp(d, 0., 1.);
    // where a wall is lost in mist it is bare paper, and the seal painted on that paper shows
    float sa = dot(-V, uSunDir);
    if (uRefl < 0.5 && d < 0.3 && sa > uSunK.x && dot(-V, uSunUp)/(max(sa, 0.5)*uSunK.y) > uSunK.z) discard;
    gl_FragColor = vec4(toScene(mix(paperAt(gl_FragCoord.xy), inkCol(d), d)), 1.);
  }`;

// ---- far ridge silhouettes ----
const RIDGE_VS = /* glsl */`
  attribute vec2 aR;                  // height fraction, seed
  varying vec3 vW; varying vec2 vR; varying float vDist, vAlong;
  void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vW = wp.xyz; vR = aR; vAlong = uv.x; vDist = distance(cameraPosition, wp.xyz);
    gl_Position = projectionMatrix*viewMatrix*wp; }`;
const RIDGE_FS = /* glsl */`
  ${INK_GLSL}
  uniform vec3 uSunDir, uSunUp, uSunK;
  varying vec3 vW; varying vec2 vR; varying float vDist, vAlong;
  void main(){
    vec3 ray = normalize(vW - cameraPosition); float sa = dot(ray, uSunDir);
    if (sa > uSunK.x && dot(ray, uSunUp)/(max(sa, 0.5)*uSunK.y) > uSunK.z) discard;     // the seal is stamped over the far ridges, never cut by them
    float h = vR.x;
    float crest = smoothstep(0.15, 1., h); crest *= crest;
    float st = vnoise(vec2(vAlong*0.06, vW.y*0.02) + vR.y*17.);
    float full = crest*(0.55 + 0.45*smoothstep(0.2, 0.6, st)) + 0.25*smoothstep(0.93, 1., h);
    float front = smoothstep(0.45, 0.66, uU + 0.06*vnoise(vec2(vAlong*0.004, vR.y)));
    float d = mix(0.16*smoothstep(0.1, 0.8, h), full, front);
    d *= (1. - mistAt(vW))*(1. - uMist.w)*farFade(vDist);
    gl_FragColor = vec4(toScene(mix(paperAt(gl_FragCoord.xy), inkCol(d), clamp(d, 0., 1.))), 1.);
  }`;

// ---- brush dabs: every plant, craft, bird, ripple, wisp and raindrop is a handful of instanced stroke quads ----
// kinds: 0 stroke (flick, dry-brush)  1 blob  2 vermilion blob  3 paper reserve with grey outline  4 leaf dab
//        5 paper wisp (mist)  6 soft ink wash  7 ripple ring  8 vermilion glow  9 crescent stroke  10 reserve stroke
// iA pos.xyz, seed | iB half-axis.xyz, half-width | iC density, kind, inkU, sway | iD mode, dry or bend, drift, anim slot
// mode: 0 billboard about its axis, 1 flat on the water, 2 facing the camera
const DAB_VS = /* glsl */`
  ${INK_GLSL}
  attribute vec4 iA, iB, iC, iD;
  uniform vec3 uAnim[4]; uniform vec4 uDrift; uniform vec3 uWrap, uVel;
  uniform float uGrow, uPix;
  varying vec2 vUv; varying vec4 vK; varying vec3 vX;      // vX: air factor, reveal, thin compensation
  void main(){
    vec3 base = iA.xyz + uAnim[int(iD.w + 0.5)]; float seed = iA.w, life = 1.;
    if (iD.z != 0.) { float f = fract(uTime*iD.z/uDrift.w + seed*7.31); base += uDrift.xyz*(f - 0.5)*uDrift.w; life = smoothstep(0., 0.12, f)*(1. - smoothstep(0.88, 1., f)); }
    vec3 wb = (modelMatrix*vec4(base, 1.)).xyz;
    if (uWrap.x > 0.) { wb = cameraPosition + mod(wb + uVel*uTime - cameraPosition + uWrap*0.5, uWrap) - uWrap*0.5;
      vec3 e = abs(wb - cameraPosition)/(uWrap*0.5); life *= (1. - smoothstep(0.8, 1., max(e.x, max(e.y, e.z))))*smoothstep(3., 10., distance(wb, cameraPosition)); }
    float ms = length(modelMatrix[0].xyz), hl = length(iB.xyz), hw = iB.w*ms;
    vec3 wdir = normalize(mat3(modelMatrix)*(iB.xyz/max(hl, 1e-4)));
    float u01 = position.x*0.5 + 0.5, kind = iC.y;
    if (kind > 6.5 && kind < 7.5) { float g = fract(uTime*0.22 + seed*5.); hl *= 0.12 + 0.88*g; hw *= 0.12 + 0.88*g; life *= pow(1. - g, 1.3)*smoothstep(0., 0.08, g); }
    vec3 P = wb + wdir*position.x*hl*ms;
    float sw = abs(iC.w);
    if (sw > 0.) { vec3 s = vec3(sin(uTime*1.25 + wb.x*0.06 + wb.z*0.03), 0., cos(uTime*0.95 + wb.z*0.05))*sw;
      s += vec3(sin(uTime*4.3 + seed*40.), 0.4*cos(uTime*3.7 + seed*23.), 0.)*sw*0.1;
      P += s*(iC.w < 0. ? u01*u01 : 1.); }
    float dist = distance(cameraPosition, P), thin = 1.;
    if (iD.x > 1.5) {
      vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      float m = max(1., dist*uPix/max(hw, 1e-4)); m = min(m, 3.); thin = 1./(m*m);
      P = wb + (right*position.x*hl*ms + up*position.y*hw)*m + (P - wb - wdir*position.x*hl*ms);
    } else {
      vec3 side = iD.x > 0.5 ? normalize(cross(wdir, vec3(0., 1., 0.)) + 1e-5) : normalize(cross(wdir, cameraPosition - P));
      float use = max(hw, min(dist*uPix, hw*5.)); thin = hw/use;
      P += side*position.y*use;
    }
    float tS = (uU - iC.z)*uDur;
    vX = vec3(airK(P, dist)*life, iC.z < 0. ? 1. : clamp(tS/uGrow, 0., 1.), thin);
    vUv = vec2(u01, position.y); vK = vec4(kind, iC.x, seed, iD.y);
    gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
  }`;
const DAB_FS = /* glsl */`
  ${INK_GLSL}
  uniform float uGhost;
  varying vec2 vUv; varying vec4 vK; varying vec3 vX;
  void main(){
    float u = vUv.x, v = vUv.y, kind = vK.x, dens = vK.y, seed = vK.z, alpha = 0.;
    vec3 col = vec3(0.); float paperK = 0., own = 0.;
    vec2 p = vec2(u*2. - 1., v); float r = length(p), ang = atan(p.y, p.x + 1e-5);
    if (kind < 0.5 || (kind > 3.5 && kind < 4.5) || kind > 9.5) {
      // a stroke: fat where the brush lands, flicked thin at the end; leaf dabs are pointed at both ends
      float prof = kind > 3.5 && kind < 4.5 ? pow(sin(3.14159*clamp(u, 0., 1.)), 0.7)*(1. - 0.35*u) : mix(0.55, 1., smoothstep(0., 0.14, u))*(1. - 0.72*smoothstep(0.45, 1., u));
      float n1 = vnoise(vec2(u*9. + seed*17., v*2. + seed*5.));
      float edge = 1. - smoothstep(prof*(0.72 + 0.2*n1), prof, abs(v));
      float dryK = vK.w*smoothstep(0.15, 1., u)*1.1;
      float st = vnoise(vec2(u*2.2 + seed*31., v*5. + seed*13.))*0.7 + vnoise(vec2(u*14., v*11. + seed))*0.3;
      float keep = smoothstep(dryK - 0.16, dryK + 0.1, st + 0.12);
      float cap = smoothstep(0., 0.05, u)*smoothstep(0., 0.03, 1. - u);
      float d = granulate(clamp(dens*(0.9 + 0.1*smoothstep(0.4, 0.9, abs(v)/max(prof, 0.01))), 0., 1.), vec2(u*20., v*3.) + seed*37.);
      alpha = d*edge*keep*cap*mix(1., vX.z, 0.6);
      if (kind > 9.5) { paperK = 1. - smoothstep(prof*0.45, prof*0.72, abs(v)); alpha = max(alpha, paperK*edge*cap); dens = 0.55; }
    } else if (kind < 3.5) {
      float R = 0.8 + 0.06*sin(ang*3. + seed*20.) + 0.04*sin(ang*7. + seed*50.);
      alpha = (1. - smoothstep(R - 0.14, R, r))*min(dens, 1.);
      if (kind > 2.5) { paperK = 1. - smoothstep(R - 0.45, R - 0.22, r); dens = 0.5; alpha = 1. - smoothstep(R - 0.14, R, r); }
      else if (kind > 1.5) { own = 1.; col = uRed*max(dens, 1.)*(0.9 + 0.2*smoothstep(0.9, 0.2, r)); }
      else alpha *= 0.82 + 0.18*vnoise(p*3. + seed*9.);
      alpha *= vX.z;
    } else if (kind < 5.5) {
      paperK = 1.; alpha = dens*exp(-(p.x*p.x*2.2 + p.y*p.y*3.2))*(0.55 + 0.6*vnoise(vec2(u*3. + seed*9. + uTime*0.03, v*1.5)));
      alpha *= smoothstep(1., 0.7, r);
    } else if (kind < 6.5) {
      float st = vnoise(vec2(u*5. + seed*11., v*6. + seed*3.));
      alpha = dens*exp(-(p.x*p.x*1.6 + p.y*p.y*2.6))*(0.5 + 0.7*st)*smoothstep(1., 0.75, max(abs(p.x), abs(p.y)));
      dens *= 0.6;
    } else if (kind < 7.5) {
      float band = 1. - smoothstep(0.03, 0.09, abs(r - 0.82));
      alpha = dens*band*smoothstep(0.2, 0.55, vnoise(vec2(ang*2.5 + seed*9., r*3.)));
    } else if (kind < 8.5) {
      own = 1.; col = uRed*(1. + 0.3*exp(-r*r*8.)); alpha = dens*exp(-r*r*4.5)*smoothstep(1., 0.7, r);
    } else {
      // crescent: a stroke bowed across its width (hulls, eaves, hats, a leaping back)
      float c = vK.w*(1. - p.x*p.x)*0.62 - vK.w*0.3;
      float th = 0.34*(0.45 + 0.55*sqrt(max(0., 1. - p.x*p.x)));
      float n1 = vnoise(vec2(u*7. + seed*17., v*3.));
      alpha = (1. - smoothstep(th*(0.7 + 0.25*n1), th, abs(v - c)))*granulate(min(dens, 1.), vec2(u*16., v*4.) + seed*3.);
    }
    float grow = vX.y;
    alpha *= mix(uGhost, 1., smoothstep(0., 0.12, grow*1.12 - u*(grow < 1. ? 1. : 0.)))*vX.x;
    if (alpha < 0.004) discard;
    vec3 pap = paperAt(gl_FragCoord.xy);
    if (own < 0.5) col = mix(inkCol(dens), pap, paperK);
    // alpha is meant in display space; the blend happens in scene space, so convert the coverage
    gl_FragColor = paperK > 0.5 ? vec4(toScene(col), alpha) : compose(pap, col, alpha);
  }`;
// birds: the same dabs carried by a formation frame, wings hinged at shoulder and wrist
// iA local anchor.xyz, seed | iB half-axis.xyz, half-width | iC density, kind, wing side, tip flag | iD formation offset.xyz, skein | iE phase, mode, dry, -
const BIRD_VS = /* glsl */`
  ${INK_GLSL}
  attribute vec4 iA, iB, iC, iD, iE;
  uniform vec3 uFlockPos[2], uFlockFwd[2]; uniform float uPix, uFlapW, uSize;
  varying vec2 vUv; varying vec4 vK; varying vec3 vX;
  vec2 rot(vec2 q, float a){ float c = cos(a), s = sin(a); return vec2(c*q.x - s*q.y, s*q.x + c*q.y); }
  void main(){
    int k = int(iD.w + 0.5); float ph = iE.x, side = iC.z;
    vec3 fwd = normalize(uFlockFwd[k]), right = normalize(cross(fwd, vec3(0., 1., 0.))), up = cross(right, fwd);
    vec3 l = iA.xyz, ax = iB.xyz;
    if (side != 0.) {
      float glide = smoothstep(0.55, 0.9, sin(uTime*0.23 + ph*1.7));              // now and then they hold a glide
      float a1 = side*(0.12 + 0.62*sin(uTime*uFlapW + ph)*(1. - 0.8*glide));
      vec2 sh = vec2(side*0.45, 0.15), wr = sh + rot(vec2(side*2.75, 0.), a1);
      if (iC.w > 0.5) { float a2 = a1 + side*0.55*sin(uTime*uFlapW + ph - 1.1)*(1. - 0.8*glide);
        l.xy = wr + rot(l.xy - (sh + vec2(side*2.75, 0.)), a2); ax.xy = rot(ax.xy, a2); }
      else { l.xy = sh + rot(l.xy - sh, a1); ax.xy = rot(ax.xy, a1); }
    }
    vec3 off = iD.xyz + vec3(sin(uTime*0.31 + ph*2.)*1.6, sin(uTime*0.83 + ph)*0.9 + 0.35*sin(uTime*uFlapW + ph + 1.6), sin(uTime*0.27 + ph*3.)*2.);
    vec3 C = uFlockPos[k] + right*off.x + up*off.y + fwd*off.z;
    vec3 base = C + (right*l.x + up*l.y + fwd*l.z)*uSize;
    vec3 wax = (right*ax.x + up*ax.y + fwd*ax.z)*uSize; float hl = length(wax); vec3 wdir = wax/max(hl, 1e-4);
    float hw = iB.w*uSize, dist = distance(cameraPosition, base), thin = 1.;
    vec3 P;
    if (iE.y > 1.5) { vec3 r2 = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), u2 = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      float m = clamp(dist*uPix/max(hw, 1e-4), 1., 3.); thin = 1./(m*m);
      P = base + (r2*position.x*hl + u2*position.y*hw)*m;
    } else { P = base + wdir*position.x*hl;
      vec3 sd = normalize(cross(wdir, cameraPosition - P)); float use = max(hw, min(dist*uPix, hw*5.)); thin = hw/use; P += sd*position.y*use; }
    vX = vec3(airK(P, dist), 1., thin);
    vUv = vec2(position.x*0.5 + 0.5, position.y); vK = vec4(iC.y, iC.x, iA.w, iE.z);
    gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
  }`;

function quadGeo() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
  g.setIndex([0, 1, 2, 1, 3, 2]);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// collects dabs, then makes one instanced mesh
function dabSet() {
  const A = [], B = [], C = [], D = [];
  const set = {
    count: 0,
    add(o) {
      const p = o.p, a = o.a;
      A.push(p[0], p[1], p[2], o.seed ?? ((set.count * 0.61803) % 1));
      B.push(a[0], a[1], a[2], o.w);
      C.push(o.d ?? 1, o.kind ?? 0, o.inkU ?? -1, o.sway ?? 0);
      D.push(o.mode ?? 0, o.dry ?? 0, o.drift ?? 0, o.anim ?? 0);
      set.count++;
    },
    // a stroke between two points
    line(p0, p1, w, o = {}) {
      set.add({ ...o, p: [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], a: [(p1[0] - p0[0]) / 2, (p1[1] - p0[1]) / 2, (p1[2] - p0[2]) / 2], w });
    },
    dot(p, rx, ry, o = {}) { set.add({ ...o, p, a: [rx, 0, 0], w: ry, mode: 2, kind: o.kind ?? 1 }); },
    geometry() {
      const g = quadGeo();
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4));
      g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
      g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(C), 4));
      g.setAttribute('iD', new THREE.InstancedBufferAttribute(new Float32Array(D), 4));
      g.instanceCount = set.count;
      return g;
    },
  };
  return set;
}

// ---- one karst tower (unit radius, unit height) and its radius table for placing things on it ----
async function towerGeo(noise, v, RS = 40, HS = 30, pause = null) {
  const pos = [], idx = [], rad = [];
  for (let j = 0; j <= HS; j++) {
    if (pause && (j & 7) === 7) await pause();
    const h = j / HS, row = [];
    for (let i = 0; i < RS; i++) {
      const a = (i / RS) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const ht = clamp(v.ht + 0.22 * noise.n2(ca * 0.9 + v.off, sa * 0.9), 0.2, 0.9), hh = Math.min(1, h + 0.07 * (0.5 + 0.5 * Math.sin(a * 2 + v.off)) * h);
      const top = hh > ht ? Math.pow(Math.max(0, 1 - Math.pow((hh - ht) / (1 - ht), v.sq ?? 2)), v.pow ?? 0.55) : 1;
      // side pinnacles: some sectors of the crown stop short, so the top breaks into two or three spires
      const lobe = 1 - 0.38 * smoothstep(0.1, 0.7, noise.n2(ca * 1.6 + v.off, sa * 1.6 + 3)) * smoothstep(ht - 0.12, ht + 0.1, hh);
      const n = noise.fbm3(ca * 1.25 + v.off, h * v.fy, sa * 1.25, 3);
      const n2 = 1 - Math.abs(noise.n3(ca * 3.1 + v.off, h * v.fy * 3, sa * 3.1));      // craggy ribs and gullies
      const shelf = Math.sin(h * v.shelves * 6.283 + n * 2.5) > 0.55 ? 1 : 0;
      const r = Math.max(0, (1 - v.taper * Math.pow(h, 1.4)) * top * lobe * (1 + 0.26 * n + 0.14 * (n2 - 0.6) + 0.07 * shelf) * (1 + 0.12 * Math.pow(1 - h, 5)));
      row.push(r); pos.push(Math.cos(a) * r, h, Math.sin(a) * r);
    }
    rad.push(row);
  }
  for (let j = 0; j < HS; j++) for (let i = 0; i < RS; i++) {
    const a = j * RS + i, b = j * RS + (i + 1) % RS, c = a + RS, d = b + RS;
    idx.push(a, c, b, b, c, d);
  }
  if (pause) await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return { geo: g, rad, RS, HS };
}

export default {
  id: 'ink-dragon',
  name: 'Mountains of Wet Ink',
  category: 'wilderness',
  weirdness: 0.5,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------- the variation: hour and paper, season, cast ----------
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'evening' : (vary.hour === 'dawn' || vary.hour === 'day') ? 'morning'
      : (() => { const r = rng(); return r < 0.45 ? 'morning' : r < 0.75 ? 'evening' : 'night'; })();
    const season = (() => { const r = rng(); return r < 0.3 ? 'clear' : r < 0.5 ? 'autumn' : r < 0.68 ? 'spring' : r < 0.85 ? 'snow' : 'rain'; })();
    const craft = rng.chance(0.65) ? 'raft' : 'skiff', birds = rng.chance(0.7) ? 'cranes' : 'geese', swimmer = rng.chance(0.6) ? 'carp' : 'dolphin';
    const rare = !!vary.rare;
    const night = hour === 'night', rain = season === 'rain', snow = season === 'snow';
    const paperHex = night ? '#A4A7A5' : hour === 'evening' ? '#DAD6CB' : snow ? '#ECEAE1' : '#EFE8D8';
    const C = {
      paper: sceneColor(paperHex) };
    const D = { paper: new THREE.Color(paperHex), moon: new THREE.Color('#EFE9DC'), ink: new THREE.Color(PAL[5]), ink2: new THREE.Color(PAL[4]), red: new THREE.Color(PAL[6]) };
    const duration = 48;
    const G = {
      uPaper: { value: D.paper }, uInk: { value: D.ink }, uInk2: { value: D.ink2 }, uRed: { value: D.red }, uMoon: { value: D.moon },
      uMist: { value: new THREE.Vector4(rain ? 50 : MIST_LO, MIST_HI, 0, 0) }, uTime: { value: 0 }, uU: { value: 0 }, uDur: { value: duration },
      uVis: { value: 900 }, uPxs: { value: 1 }, uSnow: { value: snow ? 1 : 0 }, uNight: { value: night ? 1 : 0 },
    };
    const visK = rain ? 0.55 : night ? 0.85 : 1;

    // ---------- the flight ----------
    const m1 = rng.range(0.6, 1.4), m2 = rng.range(0.6, 1.4), m3 = rng.range(-1, 1);
    const path = makePath([
      [-62, 6, 25], [-30, 6, -40], [-9 * m1, 6, -105], [-13 * m2, 6, -175], [4 + 5 * m3, 6, -250], [12, 7, -335], [20, 16, -415],
      [27, 60, -480], [18, 125, -545], [-8, 185, -610], [-28, 218, -685],
      [-30, 228, -785], [-14, 230, -895], [-8, 228, -1005], [-3, 226, -1105], [0, 225, -1165], [0, 225, -1215], [0, 225, -1265],
    ]);
    const RING = new THREE.Vector3(0, 225, -1265);
    const SUMMIT = { x: 70 + rng.range(-8, 8), z: -1065 + rng.range(-15, 15), H: 262, R: 31 };
    const elevLow = hour === 'evening' ? 8.5 : night ? 17 : 12, elevHigh = hour === 'evening' ? 3.2 : night ? 15 : 5;
    const viewP = path.pointAt(0.64), sunAz = Math.atan2(SUMMIT.x - viewP.x, -(SUMMIT.z - viewP.z)) + rng.range(0.09, 0.12);   // just right of the summit at the reveal
    // the seal stands 1500 m out, a few degrees up: from the entry, and from two more points along the first river
    // reach (far towers only there, the flanking cliffs may cross it), nothing on that line may reach its lower limb;
    // and nothing may stand behind the pavilion summit at the reveal
    const sunEyes = [0].map((u) => path.pointAt(u)), limb = Math.tan(THREE.MathUtils.degToRad(elevLow - (hour === 'evening' ? 0.4 : 3.1)));
    const limbDark = Math.tan(THREE.MathUtils.degToRad(elevLow - (hour === 'evening' ? 0.4 : 1.6)));
    const hidesSun = (x, z, R, H, wall = false) => {
      {  // only the entry view is kept clear: later a cliff sliding across the seal is good parallax. A far peak may not
         // reach the seal at all; a gorge wall is inked only below the mist (its lowest 60 m), so one far enough off
         // sits under the seal and the seal hangs in the mist above it
        const e = sunEyes[0], d0 = Math.max(1, Math.hypot(x - e.x, z - e.z));
        if (d0 < 1750 && offSun(x, z, e.x, e.z) < (wall ? 0.05 + R * 1.15 / d0 : 0.06 + R * 1.5 / d0) && (wall ? Math.min(H, 60) > 6 + d0 * limbDark : H > 6 + d0 * limb)) return true;
      }
      const d1 = Math.hypot(x - viewP.x, z - viewP.z);
      return offSun(x, z, viewP.x, viewP.z) < 0.07 + R / d1 && H > 225 + d1 * 0.035;
    };
    const offSun = (x, z, ox, oz) => { let a = Math.atan2(x - ox, -(z - oz)) - sunAz; a = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(a); };

    // ---------- the hero ----------
    const heroPal = [D.paper, new THREE.Color(PAL[1]), new THREE.Color(PAL[2]), new THREE.Color(PAL[3]), D.ink2, D.ink, D.red], tone = { paper: D.paper,       // the dragon is mostly alone on bare paper: lean toward the exact wash so its greys stay neutral
      glsl: TONE_GLSL.replace('vec4 compose(', 'vec4 composeLum(') + '\n  vec4 compose(vec3 p, vec3 c, float a){ return mix(composeLum(p, c, a), composeTrue(p, c, a), 0.3); }\n' };
    await ctx.yield();
    const HP = new THREE.Vector3(RING.x, RING.y - 60, RING.z);
    const S = SUMMIT;
    const courseW = [[30, 95, 260], [4, 52, 60], [-8 * m1, 36, -120], [6, 48, -300], [26, 60, -430], [38, 112, -500], [58, 215, -620], [40, 262, -745], [70, 276, -905],
      [S.x - 45, 262, S.z + 10], [S.x, 256, S.z - 45], [S.x + 45, 258, S.z], [S.x, 268, S.z + 46], [50, 260, -1010], [10, 247, -1055]];
    const toLocal = (p) => [p[0] - HP.x, p[1] - HP.y, p[2] - HP.z];
    const hero = await buildHero(ctx, { palette: heroPal, droplets: 800, tone, course: courseW.map(toLocal) });
    hero.object.position.copy(HP);
    scene.add(hero.object);
    const timing = hero.timing;
    await ctx.yield();
    // the same curve here, to know where the head is at any travel (for the paint front and the schedule)
    const mkCourse = (h) => {
      const c = new THREE.CatmullRomCurve3(h.anchors.course.map((p) => new THREE.Vector3(p[0] + HP.x, p[1] + HP.y, p[2] + HP.z)), false, 'centripetal');
      c.arcLengthDivisions = 1500; return c;
    };
    const courseCurve = mkCourse(hero), courseLen = courseCurve.getLength();
    await ctx.yield();
    const cpLen = (i) => { const n = courseCurve.points.length, L = courseCurve.getLengths(), f = (i / (n - 1)) * (L.length - 1), k = Math.min(L.length - 2, Math.floor(f)); return L[k] + (L[k + 1] - L[k]) * (f - k); };
    // the finale is early: the tail loads the ring with ink at u 0.745-0.865, so the door hangs wet for the last eighth
    const U_FLICK = 0.745, U_END = 0.88;
    const KEYS = [[0, cpLen(1) - 120], [0.14, cpLen(2) - 30], [0.2, cpLen(3) - 40], [0.36, cpLen(3) + 400], [0.44, cpLen(7) + 40], [0.505, cpLen(9)], [0.585, cpLen(12)],
      [0.625, cpLen(15)], [U_FLICK, timing.flickTravel], [U_END, timing.endTravel], [1.01, timing.endTravel]];
    const lin = (u) => { u = clamp(u, 0, 1); let i = 0; while (i < KEYS.length - 2 && u > KEYS[i + 1][0]) i++; const a = KEYS[i], b = KEYS[i + 1]; return a[1] + (b[1] - a[1]) * clamp((u - a[0]) / (b[0] - a[0]), 0, 1); };
    const travelAt = (u) => (lin(u - 0.012) + lin(u) * 2 + lin(u + 0.012)) / 4;
    const headAt = (u, out) => courseCurve.getPointAt(clamp(travelAt(u) / courseLen, 0, 1), out);

    let hero2 = null;
    if (rare) {
      // the rare event: a second dragon in diluted wash braids round the first; its tail paints a wider, paler ring
      const pale = [...heroPal]; pale[4] = new THREE.Color('#A9A69C'); pale[5] = new THREE.Color('#7C7A72');
      const braid = courseW.map((p, i) => { const s = i % 2 ? 1 : -1, k = i < 2 ? 0.3 : 1; return [p[0] + s * 26 * k, p[1] + (i % 3 - 1) * 14 * k + 6, p[2] + 30]; });
      hero2 = await buildHero(ctx, { palette: pale, tone, droplets: 300, ensoRadius: 10.6, girth: 0.85, redEye: false, course: braid.map(toLocal) });
      hero2.object.position.copy(HP).add(new THREE.Vector3(0, 0, -0.6));
      hero2.timing2 = hero2.timing;
      scene.add(hero2.object);
    }
    await ctx.yield();

    // ---------- the paint front, precomputed: at which u does real ink reach a place ----------
    const NS = 220, PRE = 18, camS = new Float32Array((NS + 1) * 3), headS = new Float32Array((NS + 1) * 3), radS = new Float32Array(NS + 1);
    const _v = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) {
      const u = i / NS;
      path.pointAt(u, _v); camS.set([_v.x, _v.y, _v.z], i * 3);
      headAt(u, _v); headS.set([_v.x, _v.y, _v.z], i * 3);
      radS[i] = 240 * smoothstep(-0.08, 0.02, u) + 660 * smoothstep(0.42, 0.62, u);     // real ink reaches 240 m on the river so both walls ahead are loaded, 900 m above the mist
    }
    const inkUAt = (x, z, r = 0) => {
      // the front was already spreading round the entry before we arrive: what stands nearest is stamped before u = 0
      const d0 = Math.hypot(x - camS[0], z - camS[2]) - r;
      if (d0 < 125) return -0.2;                                         // the entry is already painted and dry: dark ink is the first thing seen
      for (let i = -PRE; i < 0; i++) if (d0 < 240 * smoothstep(-0.08, 0.02, i / NS)) return i / NS;
      for (let i = 0; i <= NS; i++) {
        const j = i * 3;
        if (Math.hypot(x - camS[j], z - camS[j + 2]) - r < radS[i]) return i / NS;
        if (Math.hypot(x - headS[j], z - headS[j + 2]) - r < 120) return i / NS;
      }
      return 2;
    };
    // clearances: the camera corridor and the dragon's course
    const courseS = []; for (let i = 0; i <= 260; i++) { courseCurve.getPointAt(i / 260, _v); courseS.push(_v.x, _v.y, _v.z); }
    const clearOK = (x, z, R, H) => {
      for (let i = 0; i <= NS; i++) { const j = i * 3; if (camS[j + 1] < H + 35 && Math.hypot(x - camS[j], z - camS[j + 2]) < R * 1.2 + 30) return false; }
      for (let j = 0; j < courseS.length; j += 3) if (courseS[j + 1] < H + 14 && Math.hypot(x - courseS[j], z - courseS[j + 2]) < R * 1.15 + 22) return false;
      return true;
    };
    const riverDist = (x, z) => { let b = 1e9; for (let i = 0; i <= NS; i++) { const j = i * 3; if (camS[j + 1] > 130) break; b = Math.min(b, Math.hypot(x - camS[j], z - camS[j + 2])); } return b; };

    // ---------- towers ----------
    const variantDefs = [
      { ht: 0.62, taper: 0.26, fy: 3.2, off: rng.range(0, 50), shelves: 4, pow: 0.62, sq: 1.7 },
      { ht: 0.78, taper: 0.12, fy: 2.2, off: rng.range(0, 50), shelves: 2.5, pow: 0.5 },
      { ht: 0.6, taper: 0.34, fy: 4, off: rng.range(0, 50), shelves: 5, pow: 0.5, sq: 2.2 },
    ];
    // three meshes of each: fine for the gorge walls we fly beside, middle for the peaks around the route, coarse far off
    const pause = () => ctx.yield();
    const variants = [], variantsHi = [], variantsLo = [];
    for (const v of variantDefs) { variants.push(await towerGeo(noise, v, 40, 30, pause)); await ctx.yield(); }
    for (const v of variantDefs) { variantsHi.push(await towerGeo(noise, v, 56, 42, pause)); await ctx.yield(); }
    for (const v of variantDefs) { variantsLo.push(await towerGeo(noise, v, 20, 18, pause)); await ctx.yield(); }
    const towers = [];
    const addTower = (x, z, R, H, o = {}) => {
      const t = { x, z, R, H, rot: rng.range(0, 6.283), v: o.v ?? rng.int(0, 2), ax: rng.range(0.6, 1.4), az: rng.range(0.6, 1.4), seed: rng(), river: o.river || false };
      if (t.river) { t.ax = 0.8 + (t.ax - 0.6) * 0.5625; t.az = 0.8 + (t.az - 0.6) * 0.5625; }      // the gorge walls keep their clearance
      t.inkU = o.inkU ?? inkUAt(x, z, R * 0.8); t.far = !t.river && path.nearestXZ(x, z).dist > 520;
      towers.push(t); return t;
    };
    const tr = rng.fork('towers'), _t = new THREE.Vector3();
    const riverAt = (d, lat, out = []) => {         // a point beside the river: d metres along, lat metres to the right
      const dd = Math.min(d, 430); path.posAtDist(dd, _v); path.tangentAtDist(dd, _t);
      const l = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / l, tz = _t.z / l, ex = d - dd;
      out[0] = _v.x + tx * ex - tz * lat; out[1] = 0; out[2] = _v.z + tz * ex + tx * lat; out[3] = tx; out[4] = tz; return out;
    };
    // room for a cliff beside the river: clear of the camera's line and of the dragon's low course
    const bankClear = (x, z, R) => {
      if (riverDist(x, z) < R * 0.95 + 26) return false;
      for (let j = 0; j < courseS.length; j += 3) if (courseS[j + 1] < 130 && Math.hypot(x - courseS[j], z - courseS[j + 2]) < R + 12) return false;
      return true;
    };
    for (let d = -60; d < 560; d += tr.range(30, 46)) for (const side of [-1, 1]) {
      if (tr.chance(0.04)) continue;
      path.posAtDist(Math.min(d, 430), _v); path.tangentAtDist(Math.min(d, 430), _t);
      const ex = Math.max(0, d - 430), R = tr.range(24, 46), H = tr.chance(0.25) ? tr.range(330, 480) : tr.range(150, 330);
      const nx = -_t.z, nz = _t.x, nl = Math.hypot(nx, nz) || 1, off = 48 + R * 0.9 + tr.range(0, 18);
      const x = _v.x + (nx / nl) * off * side + (_t.x / nl) * ex, z = _v.z + (nz / nl) * off * side + (_t.z / nl) * ex;
      if (riverDist(x, z) < 46 + R || !clearOK(x, z, R, H)) continue;
      if (hidesSun(x, z, R, H, true)) continue;                                     // the sun seal shows at the entry
      addTower(x, z, R, H, { river: true });
    }
    await ctx.yield();
    // the entry gate: two slender towers standing in from the banks on the entry axis, dry and dark before we
    // arrive, so wet black karst is what the previous world's portal shows
    for (const [gd, gl] of [[178, -57], [128, 55]]) {
      const R = tr.range(22, 26) * (gl > 0 ? 0.9 : 1), H = tr.range(200, 270);
      for (let k = 0; k < 4; k++) {
        const c = riverAt(gd, gl + Math.sign(gl) * k * 10);
        if (hidesSun(c[0], c[2], R, H, true) || !bankClear(c[0], c[2], R)) continue;
        const t = addTower(c[0], c[2], R, H, { river: true, v: 1, inkU: -0.2 }); t.ax = t.az = 1; t.gate = true; break;
      }
    }
    await ctx.yield();
    // the gorge has two walls: wherever the right bank came out bare, a cliff is stood there
    for (const d of [70, 125, 180, 235, 290, 345, 400]) {
      const c0 = riverAt(d, 85);
      if (towers.some((t) => t.river && Math.hypot(t.x - c0[0], t.z - c0[2]) < 56)) continue;
      const R = tr.range(26, 38), H = tr.range(160, 320);
      for (let k = 0; k < 5; k++) {
        const c = riverAt(d + (k % 2) * 18, 50 + R * 0.9 + k * 12);
        if (hidesSun(c[0], c[2], R, H, true) || !bankClear(c[0], c[2], R)) continue;
        addTower(c[0], c[2], R, H, { river: true }).bank = true; break;
      }
    }
    {  // what the entry axis looks at is already painted and dry: the walls beside us and the far bank at the bend
      const e = sunEyes[0], f = path.pointAt(0.035, _v), ax = Math.atan2(f.x - e.x, -(f.z - e.z));
      for (const t of towers) {
        if (!t.river) continue;
        let a = Math.atan2(t.x - e.x, -(t.z - e.z)) - ax; a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
        if (t.inkU <= 0 || (a < 0.45 && Math.hypot(t.x - e.x, t.z - e.z) < 360)) t.inkU = Math.min(t.inkU, -0.2);
      }
    }
    await ctx.yield();
    const summit = addTower(S.x, S.z, S.R, S.H, { v: 0 }); summit.ax = summit.az = 1;
    for (let tries = 0; tries < 2600 && towers.length < 157; tries++) {
      if ((tries & 63) === 63) await ctx.yield();
      const a = tr.range(0, 6.283), rr = 130 + 2350 * Math.pow(tr(), 1.45), x = Math.cos(a) * rr, z = -820 + Math.sin(a) * rr;
      const R = tr.range(28, 70) * (1 + rr / 3200), H = Math.min(520, tr.range(150, 430) + rr * 0.05);
      if (riverDist(x, z) < 72 + R || !clearOK(x, z, R, H)) continue;
      if (Math.abs(x) < 58 + R && z < -800 && z > -1345) continue;                 // the avenue to the ring
      if (Math.hypot(x - RING.x, z - RING.z) < 110 + R) continue;
      if (Math.hypot(x - S.x, z - S.z) < 95 + R) continue;
      if (hidesSun(x, z, R, H)) continue;
      let ok = true; for (const t of towers) if (Math.hypot(x - t.x, z - t.z) < (R + t.R) * 0.75) { ok = false; break; }
      if (ok) addTower(x, z, R, H);
    }
    const sunDir = new THREE.Vector3(Math.sin(sunAz), 0.1, -Math.cos(sunAz)).normalize();
    const sunUp = new THREE.Vector3(0, 1, 0), sunA = night ? 0.06 : 0.0524;
    // the seal's window (where mist-lost rock lets it show): only above the line where the evening sun is cut by the mist
    const sunWin = { uSunDir: { value: sunDir }, uSunUp: { value: sunUp }, uSunK: { value: new THREE.Vector3(Math.cos(sunA * 1.12), Math.tan(sunA), hour === 'evening' ? 0.02 : -9) } };
    const towerU = { ...G, ...sunWin, uRefl: { value: 0 } }, reflU = { ...G, ...sunWin, uRefl: { value: 1 } };
    const towerMat = new THREE.ShaderMaterial({ vertexShader: TOWER_VS, fragmentShader: TOWER_FS, uniforms: towerU });
    const reflMat = new THREE.ShaderMaterial({ vertexShader: TOWER_VS, fragmentShader: TOWER_FS, uniforms: reflU, side: THREE.DoubleSide });
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    const mkTowerMesh = (list, v, mat, flip, set) => {
      if (!list.length) return;
      const g = set[v].geo.clone(); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const mesh = new THREE.InstancedMesh(g, mat, list.length), info = new Float32Array(list.length * 4);
      list.forEach((t, i) => {
        _q.setFromAxisAngle(UP, t.rot); _p.set(t.x, 0, t.z); _s.set(t.R * t.ax, flip ? -t.H * 0.5 : t.H, t.R * t.az);
        mesh.setMatrixAt(i, _m.compose(_p, _q, _s)); info.set([t.inkU, t.seed, t.R, t.H], i * 4);
      });
      g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
      mesh.frustumCulled = false; scene.add(mesh); return mesh;
    };
    for (let v = 0; v < 3; v++) {
      mkTowerMesh(towers.filter((t) => t.v === v && t.river), v, towerMat, false, variantsHi);
      await ctx.yield();
      mkTowerMesh(towers.filter((t) => t.v === v && !t.river && !t.far), v, towerMat, false, variants);
      mkTowerMesh(towers.filter((t) => t.v === v && t.far), v, towerMat, false, variantsLo);    // never nearer than ~500 m
      mkTowerMesh(towers.filter((t) => t.v === v && t.river).slice(0, 18), v, reflMat, true, variantsLo);
      await ctx.yield();
    }
    // a point on a tower's surface (local angle a, height fraction h), pushed out by `out` metres
    const surf = (t, a, h, out = 0) => {
      const V = (t.river ? variantsHi : variants)[t.v], row = V.rad[Math.round(clamp(h, 0, 1) * V.HS)], r = row[((Math.round((a / 6.2832) * V.RS) % V.RS) + V.RS) % V.RS];
      let lx = Math.cos(a) * r + Math.sin(h * 3.1 + t.seed * 37) * 0.13 * h, lz = Math.sin(a) * r + Math.cos(h * 2.3 + t.seed * 19) * 0.13 * h;
      lx = lx * t.R * t.ax + Math.cos(a) * out; lz = lz * t.R * t.az + Math.sin(a) * out;
      const c = Math.cos(t.rot), s = Math.sin(t.rot);
      return [t.x + lx * c + lz * s, h * t.H, t.z - lx * s + lz * c, Math.cos(a) * c + Math.sin(a) * s, -Math.cos(a) * s + Math.sin(a) * c];
    };
    await ctx.yield();

    // ---------- far ridge silhouettes: three pale rings of mountains beyond the towers ----------
    {
      const pos = [], aR = [], uvs = [], idx = [];
      [[1750, 300, 0], [2250, 420, 1], [2800, 560, 2]].forEach(([rad, hgt, k]) => {
        const N = 150, base = pos.length / 3, sd = rng.range(0, 100);
        for (let i = 0; i <= N; i++) {
          const a = (i / N) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), wrapA = i === N ? 0 : a;
          const top = hgt * (0.45 + 0.55 * Math.abs(noise.fbm2(Math.cos(wrapA) * 3.1 + sd, Math.sin(wrapA) * 3.1 + sd * 0.7, 4)) + 0.35 * Math.max(0, noise.n2(Math.cos(wrapA) * 9 + sd, Math.sin(wrapA) * 9)));
          pos.push(ca * rad, 70, -820 + sa * rad, ca * rad, 110 + top, -820 + sa * rad);
          aR.push(0, k * 0.37 + 0.1, 1, k * 0.37 + 0.1); uvs.push(a * rad, 0, a * rad, 1);
          if (i < N) { const b = base + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 2));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
      const ridge = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: RIDGE_VS, fragmentShader: RIDGE_FS, uniforms: { ...G, ...sunWin }, side: THREE.DoubleSide }));
      ridge.frustumCulled = false; scene.add(ridge);
    }

    // ---------- the paper sky ----------
    const sunU = { uSun: { value: new THREE.Vector4(rain ? 0.3 : 1, -9, night ? 1 : 0, night ? 0.55 : 0.3) } };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3400, 32, 16), new THREE.ShaderMaterial({ vertexShader: DOME_VS, fragmentShader: DOME_FS, uniforms: { ...G }, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);
    const SUN_D = 1500, sunR = SUN_D * Math.tan(night ? 0.06 : 0.0524);
    const sun = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), new THREE.ShaderMaterial({ vertexShader: SUN_VS, fragmentShader: SUN_FS, uniforms: { ...G, ...sunU }, transparent: true, depthWrite: false }));
    sun.scale.setScalar(sunR); sun.renderOrder = 0.05; sun.frustumCulled = false; scene.add(sun);
    scene.background = C.paper.clone();
    await ctx.yield();

    // ---------- dab meshes ----------
    const V0 = new THREE.Vector3();
    const dabMeshes = [];
    const addDabs = (set, o = {}, order = 0.5) => {
      if (!set.count) return null;
      const anim = o.anim || [V0, V0, V0, V0, V0];
      const mat = new THREE.ShaderMaterial({
        vertexShader: DAB_VS.replace('uAnim[4]', 'uAnim[5]'), fragmentShader: DAB_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...G, uAnim: { value: anim }, uDrift: { value: o.drift || new THREE.Vector4(1, 0, 0, 100) }, uWrap: { value: o.wrap || new THREE.Vector3() }, uVel: { value: o.vel || new THREE.Vector3() },
          uGrow: { value: o.grow ?? 0.6 }, uPix: { value: 0.0009 }, uGhost: { value: o.ghost ?? 0 }, ...(o.uniforms || {}) },
      });
      const mesh = new THREE.Mesh(set.geometry(), mat); mesh.frustumCulled = false; mesh.renderOrder = order; scene.add(mesh); dabMeshes.push(mesh); return mesh;
    };
    const DU = 1 / duration;                       // one second, in u
    const fr = rng.fork('flora');

    // pines on ledges, plum and maple; the pavilion
    const flora = dabSet(), accents = dabSet();
    const pine = (b, ox, oz, s, inkU) => {
      const sx = -oz, sz = ox, k = fr.sign();
      const p1 = [b[0] + ox * 2.6 * s, b[1] + 3.6 * s, b[2] + oz * 2.6 * s], p2 = [p1[0] - ox * 0.6 * s + sx * 1.8 * s * k, p1[1] + 3.4 * s, p1[2] - oz * 0.6 * s + sz * 1.8 * s * k];
      flora.line([b[0] - ox, b[1] - 0.5, b[2] - oz], p1, 0.5 * s, { d: 0.95, dry: 0.3, inkU, sway: -0.12 * s });
      flora.line(p1, p2, 0.36 * s, { d: 0.9, dry: 0.4, inkU, sway: 0.12 * s });
      const pads = fr.int(3, 5);
      for (let i = 0; i < pads; i++) {
        const f = i / (pads - 1 || 1), c = [lerp(p1[0], p2[0], f) + (fr() - 0.5) * 3 * s + ox * (1 - f) * 2.5 * s, lerp(p1[1] - 0.6 * s, p2[1] + 0.8 * s, f), lerp(p1[2], p2[2], f) + (fr() - 0.5) * 3 * s + oz * (1 - f) * 2.5 * s];
        const n = fr.int(6, 8), a0 = fr.range(0, 6.28);
        for (let j = 0; j < n; j++) {
          const a = a0 + (j / n) * 6.283 + fr.range(-0.3, 0.3), L = fr.range(1.3, 2.3) * s * (1.15 - 0.4 * f);
          flora.add({ p: [c[0] + Math.cos(a) * L * 0.9, c[1] + fr.range(-0.6, 0.5) * s, c[2] + Math.sin(a) * L * 0.9], a: [Math.cos(a) * L, fr.range(-0.5, 0.25) * L, Math.sin(a) * L], w: fr.range(0.32, 0.5) * s,
            d: fr.range(0.8, 1), dry: fr.range(0.1, 0.5), inkU: inkU + (0.2 + i * 0.12) * DU, sway: 0.14 * s + 0.1 * f * s, seed: fr() });
        }
      }
    };
    const blossom = (b, ox, oz, s, inkU, kind) => {  // a crooked branch with reserved-white plum blossom, or vermilion maple dabs
      let p = [b[0], b[1], b[2]]; const pts = [p];
      for (let i = 0; i < 4; i++) { p = [p[0] + (ox * 2 + fr.range(-1.6, 1.6)) * s, p[1] + fr.range(0.2, 2.2) * s, p[2] + (oz * 2 + fr.range(-1.6, 1.6)) * s]; pts.push(p); }
      for (let i = 0; i < 4; i++) flora.line(pts[i], pts[i + 1], (0.3 - i * 0.05) * s, { d: 0.95, dry: 0.35, inkU: inkU + i * 0.1 * DU, sway: 0.05 * i * s });
      for (let i = 0, n = fr.int(9, 15); i < n; i++) {
        const q = pts[fr.int(1, 4)], r = (kind === 3 ? fr.range(0.45, 0.8) : fr.range(0.55, 1.1)) * s;
        accents.dot([q[0] + fr.range(-2, 2) * s, q[1] + fr.range(-0.6, 1.8) * s, q[2] + fr.range(-2, 2) * s], r, r * fr.range(0.7, 1), { kind, d: 1, inkU: inkU + (0.5 + i * 0.07) * DU, sway: 0.16 * s, seed: fr() });
      }
    };
    const near = towers.filter((t) => t.inkU < 1.5).sort((a, b) => a.inkU - b.inkU);
    let pineBudget = Math.round(96 * dens), accentBudget = season === 'spring' ? 12 : season === 'autumn' ? 30 : 0;
    for (const t of near) {
      const n = t.river ? fr.int(1, 3) + (t.gate || t.bank ? 2 : 0) : fr.chance(0.75) ? fr.int(1, 2) : 0;
      const nr = t.river ? path.nearestXZ(t.x, t.z) : null, pr = nr ? path.pointAt(nr.u, _v) : null;
      const toRiver = pr ? Math.atan2(pr.z - t.z, pr.x - t.x) + t.rot : 0;            // the wall that faces the water
      for (let i = 0; i < n && pineBudget > 0; i++, pineBudget--) {
        const lowLedge = t.river && (i === 0 || (i < 3 && (t.gate || t.bank))), h = lowLedge ? fr.range(14, 52) / t.H : fr.range(0.74, 0.985);
        const a = lowLedge ? toRiver + fr.range(-1.25, 1.25) : fr.range(0, 6.283);
        const b = surf(t, a, h, -1);
        if (!path.isClear(b[0], b[1], b[2], 12, 8)) continue;
        pine(b, b[3], b[4], fr.range(1.3, 2.3) * (lowLedge ? 0.85 : 1 + t.R / 90), t.inkU + (0.9 + fr()) * DU);
      }
      if (accentBudget > 0 && (t.river || fr.chance(0.35))) {
        const h = t.river && fr.chance(0.7) ? fr.range(10, 50) / t.H : fr.range(0.6, 0.93), b = surf(t, fr.range(0, 6.283), h, -0.5);
        if (path.isClear(b[0], b[1], b[2], 10, 8)) { blossom(b, b[3], b[4], fr.range(1.2, 2) * (t.river ? 1 : 1.6), t.inkU + 1.2 * DU, season === 'spring' ? 3 : 2); accentBudget--; }
      }
    }
    {  // the pavilion on the highest summit: three strokes and a dot of red
      const b = surf(summit, 0, 0.955, 0), y = b[1] - 1, x = S.x, z = S.z, iu = summit.inkU + 1.4 * DU;
      for (const dx of [-3.6, 3.6]) flora.line([x + dx * 0.8, y, z + dx * 0.6], [x + dx * 0.8, y + 6.5, z + dx * 0.6], 0.42, { d: 0.95, inkU: iu });
      flora.add({ p: [x, y + 7.4, z], a: [9, 0, 0], w: 3.4, kind: 9, dry: -1, mode: 2, d: 1, inkU: iu });
      flora.add({ p: [x, y + 12.2, z], a: [5.6, 0, 0], w: 2.5, kind: 9, dry: -1, mode: 2, d: 1, inkU: iu + 0.2 * DU });
      flora.line([x, y + 12.5, z], [x, y + 16, z], 0.3, { d: 0.95, inkU: iu + 0.3 * DU });
      accents.dot([x, y + 3.4, z], 1.5, 1.7, { kind: 2, d: 1.25, inkU: iu + 0.5 * DU });
    }
    await ctx.yield();

    // bamboo on the banks: the stalk is one stroke, the leaves unfurl one after another when the front arrives
    const bamboo = dabSet();
    const nG = Math.round(20 * dens), groves = [];
    for (let gI = 0; gI < nG; gI++) { const side = gI % 2 ? 1 : -1; groves.push([riverAt(fr.range(20, 520), side * fr.range(36, 56)), fr.int(6, 11), 1, null]); }
    for (let gI = 0; gI < 4; gI++) groves.push([riverAt(55 + gI * 78 + fr.range(-14, 14), fr.range(32, 46)), fr.int(7, 11), 1, null]);   // the right bank
    groves.push([riverAt(45, -16), 10, 0.5, -0.2], [riverAt(62, 18), 10, 0.5, -0.2]);        // two shoal groves on the entry axis, already drawn
    for (const [c, ns, sp, iuF] of groves) {
      const iu0 = iuF ?? inkUAt(c[0], c[2]);
      if (iuF !== null) flora.add({ p: [c[0], 0.03, c[2]], a: [c[3] * 9, 0, c[4] * 9], w: 3.2, kind: 6, mode: 1, d: 0.6, inkU: -1, seed: fr() });
      for (let s = 0; s < ns; s++) {
        const x = c[0] + clamp(fr.gauss(), -2, 2) * 4 * sp, z = c[2] + clamp(fr.gauss(), -2, 2) * 5 * sp, H = fr.range(8, 13), lx = fr.range(-1.4, 1.4), lz = fr.range(-1.4, 1.4), iu = iu0 + fr.range(0, 0.5) * DU;
        bamboo.line([x, -0.3, z], [x + lx, H, z + lz], fr.range(0.13, 0.2), { d: fr.range(0.6, 0.95), dry: 0.25, inkU: iu, sway: -0.75, seed: fr() });
        for (let l = 0, nl = fr.int(6, 9); l < nl; l++) {
          const f = fr.range(0.45, 1), a = fr.range(0, 6.283), L = fr.range(0.8, 1.5), px = x + lx * f, py = H * f, pz = z + lz * f;
          bamboo.add({ p: [px + Math.cos(a) * L * 0.8, py - L * 0.45, pz + Math.sin(a) * L * 0.8], a: [Math.cos(a) * L, -L * 0.6, Math.sin(a) * L], w: fr.range(0.2, 0.3), kind: 4,
            d: fr.range(0.8, 1), inkU: iu + (0.35 + l * 0.14) * DU, sway: 0.75 * f * f, seed: fr() });
        }
      }
    }
    await ctx.yield();
    // reeds: shoals in mid-river and runs along the waterline, each a soft wash and a tuft of hairline strokes
    const water = dabSet();
    const reedTuft = (c, n, spread) => {
      const iu = inkUAt(c[0], c[2]);
      water.add({ p: [c[0], 0.03, c[2]], a: [c[3] * spread * 1.6, 0, c[4] * spread * 1.6], w: spread * 0.5, kind: 6, mode: 1, d: 0.5, inkU: iu, seed: fr() });
      for (let i = 0; i < n; i++) {
        const x = c[0] + fr.gauss() * spread * 0.6 * (0.4 + Math.abs(c[3])) * 1.4, z = c[2] + fr.gauss() * spread * 0.6 * (0.4 + Math.abs(c[4])) * 1.4, h = fr.range(1.4, 3.6), lean = fr.range(-0.7, 0.7);
        bamboo.line([x, -0.1, z], [x + lean, h, z + fr.range(-0.5, 0.5)], fr.range(0.035, 0.06), { d: fr.range(0.6, 1), dry: 0.2, inkU: iu + fr.range(0, 0.6) * DU, sway: -0.55, seed: fr() });
        if (fr.chance(0.3)) bamboo.add({ p: [x + lean, h, z], a: [lean * 0.15, 0.32, 0], w: 0.09, kind: 4, d: 0.9, inkU: iu + 0.6 * DU, sway: 0.55, seed: fr() });
      }
    };
    for (let i = 0, n = Math.round(16 * dens); i < n; i++) reedTuft(riverAt(30 + (i / n) * 400 + fr.range(-10, 10), (i % 2 ? 1 : -1) * fr.range(11, 26)), fr.int(18, 30), fr.range(1.6, 3.2));
    for (let i = 0; i < 26; i++) reedTuft(riverAt(fr.range(-20, 540), fr.sign() * fr.range(40, 60)), fr.int(10, 18), fr.range(2.5, 5));
    // the river itself is bare paper: only long dry-brush strokes sliding downstream, and rings where carp rise
    for (let i = 0, n = Math.round(320 * Math.min(1.15, dens)); i < n; i++) {                                       // drawn across the stream: horizontal strokes
      const c = riverAt(-90 + (i / n) * 720 + fr.range(-6, 6), fr.range(-56, 56)), L = fr.range(3, 15) * (fr.chance(0.5) ? 1 : -1);
      if ((i & 127) === 127) await ctx.yield();
      water.add({ p: [c[0], 0.02, c[2]], a: [-c[4] * L + c[3] * L * 0.08, 0, c[3] * L + c[4] * L * 0.08], w: fr.range(0.07, 0.24), kind: 0, mode: 1, d: fr.range(0.55, 0.9), dry: fr.range(0.5, 0.9), inkU: inkUAt(c[0], c[2]) + fr.range(0, 0.5) * DU, drift: fr.range(1.2, 4.2), seed: fr() });
    }
    await ctx.yield();
    for (let i = 0; i < 36; i++) {                                                 // the river arrives as broad horizontal strokes
      const c = riverAt(24 + (i / 36) * 120 + fr.range(-4, 4), fr.range(-44, 44)), L = fr.range(8, 19) * (i % 2 ? 1 : -1);
      water.add({ p: [c[0], 0.02, c[2]], a: [-c[4] * L + c[3] * L * 0.05, 0, c[3] * L + c[4] * L * 0.05], w: fr.range(0.26, 0.5), kind: 0, mode: 1, d: 0.32, dry: 0.8, inkU: inkUAt(c[0], c[2]) + fr.range(0, 0.5) * DU, drift: fr.range(0.8, 2.2), seed: fr() });
    }
    for (let i = 0; i < 64; i++) {                                                 // a pale wash along both waterlines seats the cliffs in water
      const side = i % 2 ? 1 : -1, c = riverAt(-50 + (i >> 1) * 19 + fr.range(-5, 5), side * fr.range(45, 55)), L = fr.range(14, 24);
      water.add({ p: [c[0], 0.015, c[2]], a: [c[3] * L, 0, c[4] * L], w: fr.range(4, 8), kind: 6, mode: 1, d: fr.range(0.2, 0.34), inkU: inkUAt(c[0], c[2]), seed: fr() });
    }
    for (let i = 0, n = swimmer === 'carp' ? 14 : 5; i < n; i++) {
      const c = riverAt(20 + (i / n) * 420 + fr.range(-10, 10), fr.sign() * fr.range(7, 38)), r = fr.range(2.4, 4.6);
      water.add({ p: [c[0], 0.04, c[2]], a: [r, 0, 0], w: r, kind: 7, mode: 1, d: 0.6, seed: fr() });
      water.add({ p: [c[0], 0.04, c[2]], a: [r * 0.6, 0, 0], w: r * 0.6, kind: 7, mode: 1, d: 0.5, seed: fr() });
    }
    // mist: paper-coloured wisps sliding sideways at their own speeds; pale wash streaks lying on the cloud sea
    const wisps = dabSet(), sea = dabSet();
    for (let i = 0; i < 16; i++) {
      const c = riverAt(fr.range(-40, 600), fr.sign() * fr.range(34, 110));
      wisps.add({ p: [c[0], fr.chance(0.6) ? fr.range(3, 22) : fr.range(52, 70), c[2]], a: [fr.range(40, 90), 0, 0], w: fr.range(2.2, 5.5), kind: 5, mode: 2, d: fr.range(0.4, 0.7), drift: fr.range(1, 3.5) * fr.sign(), seed: fr() });
    }
    for (let i = 0; i < 10; i++) {                                               // low wisps sliding across the entry view
      const c = riverAt(fr.range(25, 150), fr.sign() * fr.range(6, 70));
      wisps.add({ p: [c[0], fr.range(3, 22), c[2]], a: [fr.range(26, 60), 0, 0], w: fr.range(1.6, 4), kind: 5, mode: 2, d: fr.range(0.4, 0.7), drift: fr.range(1.5, 4) * fr.sign(), seed: fr() });
    }
    for (let i = 0; i < 34; i++) {
      path.pointAt(fr.range(0.42, 1), _v); const lat = fr.sign() * fr.range(40, 420);
      wisps.add({ p: [_v.x + lat, fr.range(116, 140), _v.z + fr.range(-120, 60)], a: [fr.range(70, 190), 0, 0], w: fr.range(7, 18), kind: 5, mode: 2, d: fr.range(0.5, 0.85), drift: fr.range(1.5, 5) * fr.sign(), seed: fr() });
    }
    for (let i = 0; i < 46; i++) {
      const a = fr.range(0, 6.283), rr = 80 + 1300 * Math.sqrt(fr()), L = fr.range(70, 240);
      sea.add({ p: [Math.cos(a) * rr, fr.range(127, 133), -900 + Math.sin(a) * rr], a: [L, 0, fr.range(-0.15, 0.15) * L], w: fr.range(12, 36), kind: 6, mode: 1, d: fr.range(0.14, 0.3), drift: fr.range(2, 6) * fr.sign(), seed: fr() });
    }
    addDabs(sea, { drift: new THREE.Vector4(1, 0, 0.1, 500) }, 0.1);
    addDabs(water, { drift: new THREE.Vector4(0, 0, 1, 46), grow: 0.9 }, 0.2);
    addDabs(flora, { ghost: 0.14, grow: 0.7 }, 0.4);
    addDabs(bamboo, { ghost: 0, grow: 0.45 }, 0.45);
    addDabs(accents, { ghost: 0, grow: 0.3 }, 0.5);
    addDabs(wisps, { drift: new THREE.Vector4(1, 0, 0.15, 260) }, 0.6);
    await ctx.yield();

    // ---------- the craft: a bamboo raft with its poler, lantern and cormorants, or a lone angler's skiff ----------
    const cr = rng.fork('craft'), craftSide = cr.sign(), craftD = 80;
    const cc = riverAt(craftD, craftSide * 9.5), hx = cc[3], hz = cc[4];
    const L3 = (f, y, r) => [f * hx - r * hz, y, f * hz + r * hx];
    const craftSet = dabSet(), rail = -craftSide * 1.45, lampF = craft === 'raft' ? 4.3 : 2.9, lampY = craft === 'raft' ? 2.3 : 1.9;
    const anim = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const poleDir = new THREE.Vector3(), divers = [];
    if (craft === 'raft') {
      for (let i = 0; i < 8; i++) craftSet.line(L3(-5 - cr.range(0, 0.5), 0.28, (i - 3.5) * 0.36), L3(5 + cr.range(0, 0.6), 0.3 + 0.05 * i % 2, (i - 3.5) * 0.36), 0.2, { mode: 1, d: cr.range(0.8, 1), dry: cr.range(0.2, 0.5), seed: cr() });
      for (const f of [-3.6, 0.2, 3.7]) craftSet.line(L3(f, 0.36, -1.5), L3(f + 0.1, 0.36, 1.5), 0.09, { mode: 1, d: 1 });
      craftSet.line(L3(-5, 0.2, 0), L3(5.4, 0.2, 0), 0.26, { d: 0.9, dry: 0.3 });                        // the raft's edge, seen from the side
      craftSet.line(L3(-3.5, 0.4, 0), L3(-3.4, 2.5, 0.1), 0.34, { d: 1, dry: 0.15 });                     // the poler: one tall stroke
      craftSet.add({ p: L3(-3.4, 2.78, 0.1), a: [0.95, 0, 0], w: 0.5, kind: 9, dry: 1, mode: 2, d: 1 });  // under a wide hat stroke
      const h0 = L3(-3.1, 1.75, 0.5 * -craftSide), h1 = L3(-6.4, -1.1, 1.7 * -craftSide);
      craftSet.line(L3(-2.1, 2.7, 0.1 * -craftSide), h1, 0.06, { d: 0.95, anim: 1 });
      poleDir.set(h1[0] - h0[0], h1[1] - h0[1], h1[2] - h0[2]).normalize();
      for (let i = 0; i < 5; i++) {                                                                        // cormorants hunched on the rail
        const f = -1.6 + i * 1.05 + cr.range(-0.2, 0.2), slot = i === 1 ? 3 : i === 3 ? 4 : 0, s = cr.range(0.9, 1.15);
        craftSet.add({ p: L3(f, 0.95 * s, rail), a: [0.3 * s, 0, 0], w: 0.56 * s, kind: 1, mode: 2, d: 1, anim: slot, seed: cr() });
        craftSet.line(L3(f + 0.05, 1.3 * s, rail), L3(f + 0.42, 1.68 * s, rail), 0.1, { d: 1, anim: slot });
        craftSet.line(L3(f + 0.4, 1.66 * s, rail), L3(f + 0.72, 1.56 * s, rail), 0.05, { d: 1, anim: slot });
        if (slot) divers.push({ slot, u0: (craftD - 62 + (slot - 3) * 26) / path.length });
      }
      craftSet.line(L3(-5.2, 0.03, 0.7), L3(-15, 0.03, 3.6), 0.34, { mode: 1, d: 0.4, dry: 0.75 });      // a wake of two widening strokes
      craftSet.line(L3(-5.2, 0.03, -0.7), L3(-15, 0.03, -3.6), 0.34, { mode: 1, d: 0.4, dry: 0.75 });
    } else {
      craftSet.add({ p: L3(0, 0.42, 0), a: L3(3.6, 0, 0), w: 1.0, kind: 9, dry: -1, d: 1 });              // the hull: one bowed stroke
      craftSet.line(L3(-0.6, 0.5, 0), L3(-0.45, 1.75, 0), 0.34, { d: 1, dry: 0.15 });                      // the angler
      craftSet.add({ p: L3(-0.45, 2.0, 0), a: [0.9, 0, 0], w: 0.46, kind: 9, dry: 1, mode: 2, d: 1 });
      const tip = L3(3.6, 3.5, 1.5 * -craftSide);
      craftSet.line(L3(-0.2, 1.4, 0.1), tip, 0.045, { d: 0.9 });
      craftSet.line(tip, [tip[0], -0.2, tip[2]], 0.025, { d: 0.6, anim: 1 });
      poleDir.set(0, 1, 0);
      craftSet.line(L3(-3.8, 0.03, 0.5), L3(-11, 0.03, 2.6), 0.28, { mode: 1, d: 0.35, dry: 0.75 });
      craftSet.line(L3(-3.8, 0.03, -0.5), L3(-11, 0.03, -2.6), 0.28, { mode: 1, d: 0.35, dry: 0.75 });
    }
    craftSet.line(L3(lampF, 0.3, 0), L3(lampF, lampY + 0.7, 0), 0.07, { d: 0.95 });                        // lantern mast
    craftSet.line(L3(lampF, lampY + 0.65, 0), L3(lampF + 0.5, lampY + 0.55, 0), 0.05, { d: 0.95 });
    const lampGlow = night || rain ? 1 : 0.6;
    craftSet.add({ p: L3(lampF + 0.5, lampY, 0), a: [3.4, 0, 0], w: 3.4, kind: 8, mode: 2, d: 0.8 * lampGlow, anim: 2 });
    craftSet.add({ p: L3(lampF + 0.5, lampY, 0), a: [0.42, 0, 0], w: 0.52, kind: 2, mode: 2, d: 1.5, anim: 2 });
    for (let i = 0; i < 3; i++) craftSet.add({ p: L3(lampF + 1.2 + i * 1.5, 0.02, (i % 2 - 0.5) * 0.3), a: L3(0.9 - i * 0.15, 0, 0), w: 0.42 - i * 0.08, kind: 8, mode: 1, d: 0.85 - i * 0.2, anim: 2 }); // its reflection
    for (let i = 0; i < 3; i++) { const r = 1.6 + i * 0.7; craftSet.add({ p: L3(-1 + i * 1.6, 0.04, rail * 2.6), a: [r, 0, 0], w: r, kind: 7, mode: 1, d: 0.55, seed: cr() }); }
    const craftMesh = addDabs(craftSet, { anim }, 0.7);
    const craftPos = new THREE.Vector3(cc[0], 0, cc[2]);

    // ---------- the birds that fly with us: two skeins of red-crowned cranes, or lines of wild geese ----------
    const flockPos = [new THREE.Vector3(), new THREE.Vector3()], flockFwd = [new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -1)];
    {
      const A = [], B = [], Cc = [], Dd = [], E = [], br = rng.fork('birds'), crane = birds === 'cranes';
      const nA = Math.round((crane ? 12 : 16) * Math.min(1.15, dens)), nB = Math.round((crane ? 12 : 8) * Math.min(1.15, dens));
      const part = (off, k, ph, o) => { A.push(o.l[0], o.l[1], o.l[2], br()); B.push(o.a[0], o.a[1], o.a[2], o.w); Cc.push(o.d ?? 1, o.kind ?? 0, o.side ?? 0, o.tip ?? 0); Dd.push(off[0], off[1], off[2], k); E.push(ph, o.mode ?? 0, o.dry ?? 0, 0); };
      const bird = (off, k) => {
        const ph = br.range(0, 6.283);
        if (crane) {
          part(off, k, ph, { l: [0, 0, -0.2], a: [0, 0, 1.5], w: 0.6, kind: 10 });
          part(off, k, ph, { l: [0, 0, 0], a: [0.78, 0, 0], w: 0.62, kind: 3, mode: 2 });
          part(off, k, ph, { l: [0, 0.12, 2.6], a: [0, 0.1, 1.25], w: 0.14, d: 0.95 });
          part(off, k, ph, { l: [0, 0.3, 3.95], a: [0.32, 0, 0], w: 0.32, kind: 2, mode: 2, d: 1.2 });
          part(off, k, ph, { l: [0, -0.1, -2.7], a: [0, 0, -1.3], w: 0.08, d: 0.9 });
          part(off, k, ph, { l: [0, 0.1, -1.5], a: [0, 0, -0.6], w: 0.36, d: 0.95, dry: 0.4 });
        } else {
          part(off, k, ph, { l: [0, 0, 0], a: [0, 0, 1.35], w: 0.42, d: 0.75, dry: 0.2 });
          part(off, k, ph, { l: [0, 0, 0], a: [0.6, 0, 0], w: 0.46, kind: 1, mode: 2, d: 0.8 });
          part(off, k, ph, { l: [0, 0.1, 2.3], a: [0, 0.06, 1.1], w: 0.11, d: 0.95 });
        }
        for (const s of [-1, 1]) {
          part(off, k, ph, { l: [s * 1.8, 0.15, -0.15], a: [s * 1.4, 0, -0.1], w: crane ? 0.62 : 0.42, kind: crane ? 10 : 0, d: crane ? 1 : 0.8, dry: 0.2, side: s });
          part(off, k, ph, { l: [s * 3.95, 0.15, -0.45], a: [s * 1.3, 0, -0.3], w: crane ? 0.5 : 0.36, d: 1, dry: 0.5, side: s, tip: 1 });
        }
      };
      for (let i = 0; i < nA; i++) { const s = crane ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) : i; bird(crane ? [s * 6.5, br.range(-1.5, 1.5) + Math.abs(s) * 0.7, -Math.abs(s) * 7.5] : [s * 5.4 - 30, s * 0.5 + br.range(-1, 1), -s * 5.2], 0); }
      for (let i = 0; i < nB; i++) { const s = crane ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) : i; bird(crane ? [s * 7, br.range(-1.5, 1.5) + Math.abs(s) * 0.5, -Math.abs(s) * 8] : [-s * 5.6, s * 0.4 + br.range(-1, 1), -s * 5.5], 1); }
      const g = quadGeo();
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
      g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(Cc), 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(new Float32Array(Dd), 4));
      g.setAttribute('iE', new THREE.InstancedBufferAttribute(new Float32Array(E), 4)); g.instanceCount = A.length / 4;
      const mat = new THREE.ShaderMaterial({ vertexShader: BIRD_VS, fragmentShader: DAB_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...G, uFlockPos: { value: flockPos }, uFlockFwd: { value: flockFwd }, uPix: { value: 0.0009 }, uFlapW: { value: crane ? 5.6 : 8.5 }, uSize: { value: crane ? 0.85 : 0.62 }, uGhost: { value: 1 } } });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 0.9; scene.add(mesh);
    }

    // ---------- the river dolphin: two strokes leaping beside us (cast swap for the carp) ----------
    let dolphin = null;
    if (swimmer === 'dolphin') {
      const ds = dabSet();
      ds.add({ p: [0, 0, 0], a: [0, 0, -2.3], w: 1.15, kind: 9, dry: 1, d: 0.85 });
      ds.line([0, 0.1, 1.9], [0, 0.75, 3.0], 0.4, { d: 0.9, dry: 0.3 });
      ds.line([0, 0.5, -0.2], [0, 1.3, 0.5], 0.3, { d: 0.9, dry: 0.4 });
      dolphin = addDabs(ds, {}, 0.7); dolphin.rotation.order = 'YXZ';
    }

    // ---------- the door before it is painted: a ghost wash at the end of the avenue with a circle of paper reserved in it
    // (the night sheet's moon motif), so the flight has a destination from the moment we clear the mist; it thins away
    // as the tail arrives to load the ring with real ink. Faded through its own visibility range: no state changes.
    const doorVis = { value: 120 };
    {
      const hs = dabSet();
      hs.add({ p: [RING.x, RING.y + 2, RING.z - 3], a: [46, 0, 0], w: 34, kind: 6, mode: 2, d: 0.62, seed: 0.37 });
      hs.dot([RING.x, RING.y, RING.z - 2], 12.5, 12.5, { kind: 3, d: 1, seed: 0.11 });
      addDabs(hs, { uniforms: { uVis: doorVis } }, 0.62);
    }

    // ---------- what drifts in the air: rain, snow, plum petals, maple leaves or loose bamboo leaves ----------
    {
      const ps = dabSet(), pr = rng.fork('air'), box = new THREE.Vector3(130, 80, 130), vel = new THREE.Vector3();
      const n = Math.round((rain ? 1100 : snow ? 800 : season === 'spring' ? 320 : 200) * dens * (ctx.quality?.detail ?? 1));
      for (let i = 0; i < n; i++) {
        const p = [pr.range(0, box.x), pr.range(0, box.y), pr.range(0, box.z)];
        if (rain) ps.add({ p, a: [-0.38, -1.75, 0.2], w: pr.range(0.02, 0.04), d: pr.range(0.35, 0.7), dry: 0.7, seed: pr() });
        else if (snow) ps.dot(p, 0.16, 0.16, { kind: 3, d: 1, sway: pr.range(0.3, 0.9), seed: pr() });
        else if (season === 'spring') ps.dot(p, 0.17, 0.13, { kind: 3, d: 1, sway: pr.range(0.4, 1.1), seed: pr() });
        else if (season === 'autumn') ps.dot(p, pr.range(0.09, 0.17), 0.11, { kind: 2, d: 1, sway: pr.range(0.4, 1.1), seed: pr() });
        else { const a = pr.range(0, 6.283); ps.add({ p, a: [Math.cos(a) * 0.3, pr.range(-0.12, 0.12), Math.sin(a) * 0.3], w: 0.07, kind: 4, d: pr.range(0.5, 0.95), sway: pr.range(0.4, 1.1), seed: pr() }); }
      }
      if (rain) vel.set(-6.5, -30, 3.5); else if (snow) vel.set(-1.6, -2.4, 0.5); else vel.set(-2.4, -1.1, 0.8);
      addDabs(ps, { wrap: box, vel }, 5);
    }
    await ctx.yield();

    // ---------- the crane we ride, in this world's own strokes (camera space: eye at the origin, looking down -Z) ----------
    // a pale reserved neck stroke at bottom centre with the vermilion crown dot, and at the far left and right the
    // reserved wing strokes whose five black dry-brush primaries splay into the frame edges once per 0.9 s
    const craneParts = [];
    {
      const noMist = { uMist: { value: new THREE.Vector4(-1e4, -9999, 0, 0) }, uVis: { value: 1e5 } };   // we carry it through the mist deck
      const neck = dabSet();
      neck.line([0, -3.0, -2.6], [0.03, -1.86, -5.3], 0.2, { kind: 10, d: 0.8, seed: 0.31 });              // the neck: paper reserved inside a grey outline
      neck.line([0.03, -1.73, -5.68], [0.015, -2.42, -3.95], 0.075, { d: 1, dry: 0.3, seed: 0.62 });       // the black of the neck and head, one slim stroke
      neck.line([0.03, -1.73, -5.72], [0.05, -1.71, -6.55], 0.034, { d: 0.95, seed: 0.77 });               // the long bill, pointing where we fly
      neck.dot([0.03, -1.675, -5.6], 0.085, 0.07, { kind: 2, d: 1.25, seed: 0.2 });                        // the crown
      craneParts.push({ mesh: addDabs(neck, { uniforms: noMist }, 6), side: 0 });
      for (const sd of [-1, 1]) {
        const w = dabSet();
        w.line([0.9 * sd, -0.75, -0.7], [3.75 * sd, 0.02, -0.82], 0.3, { kind: 10, d: 0.9, seed: 0.43 });      // the white of the wing, reserved
        for (let i = 0; i < 7; i++) {
          // seven black primaries lying side by side like a comb, each pressed at its round tip and drawn back to the wing
          const th = (60 + i * 5) * Math.PI / 180, L = 2.05 - 0.1 * i, bx = (3.85 - i * 0.25) * sd, by = 0.05 - 0.07 * i;
          w.line([bx + Math.cos(th) * L * sd, by + Math.sin(th) * L, -0.8 - 0.06 * i], [bx, by, -0.8 + 0.03 * i], 0.095, { d: 1, dry: 0.3, seed: 0.17 + i * 0.19 });
        }
        for (let i = 0; i < 6; i++) {          // a shorter grey row of coverts over their roots
          const th = (62 + i * 5) * Math.PI / 180, bx = (3.72 - i * 0.26) * sd, by = -0.05 - 0.07 * i;
          w.line([bx + Math.cos(th) * 0.85 * sd, by + Math.sin(th) * 0.85, -0.78 - 0.05 * i], [bx, by, -0.78], 0.115, { d: 0.5, dry: 0.15, seed: 0.33 + i * 0.13 });
        }
        craneParts.push({ mesh: addDabs(w, { uniforms: noMist }, 6), side: sd });
      }
      for (const c of craneParts) { c.mesh.matrixAutoUpdate = false; c.mesh.visible = false; }
    }
    const _cm = new THREE.Matrix4(), _cr = new THREE.Matrix4(), _cs = new THREE.Matrix4(), _cp = new THREE.Vector3();
    const flyCrane = (time, camera, u) => {
      const on = u > 0.003 && !!camera.matrixWorld, pres = smoothstep(0.003, 0.03, u) * (1 - smoothstep(0.95, 0.992, u));
      const ph = time * (Math.PI * 2 / 0.9), beat = 0.5 + 0.5 * Math.sin(ph), splay = 0.3 + 0.7 * clamp(0.5 + 0.62 * Math.sin(ph + 0.7), 0, 1);
      for (const c of craneParts) {
        c.mesh.visible = on; if (!on) continue;
        if (c.side === 0) _cm.makeTranslation(0.03 * Math.sin(time * 0.7), -2.4 * (1 - pres) + 0.07 * Math.sin(ph - 1.2), 0.05 * Math.sin(ph - 0.4));
        else {
          _cm.makeTranslation(1.6 * c.side, -3.1 - 2.4 * (1 - pres) - 0.06 * Math.sin(ph), -3.6);
          _cm.multiply(_cr.makeRotationZ(c.side * (-0.7 + 1.0 * beat))).multiply(_cs.makeScale(1, splay, 1));
        }
        c.mesh.matrix.multiplyMatrices(camera.matrixWorld, _cm); c.mesh.matrixWorldNeedsUpdate = true;
      }
    };

    // ---------- per-frame ----------
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _size = new THREE.Vector2(), poiV = new THREE.Vector3(), poiC = new THREE.Vector3();
    let uWas = 0;   // the place (u) of the last call of update; it starts at the u of the builder's own call below, so that call and the opening of a flight are no jump
    const setFlock = (k, d, right, up, u, dt, jump) => {
      const peel = smoothstep(0.84, 0.97, u);
      path.posAtDist(d, _a); path.tangentAtDist(Math.min(d, path.length - 1), _b);
      // the heading eases by the clock step: 0.2 of the way per sixtieth of a second, the same turn at any frame rate, and none while the clock stands
      // at a jump of place (told in update) it is put on the tangent it eases toward, at any clock step: a still shows the heading a flight has there (less the flight's lag, a degree or two at the most)
      if (jump) flockFwd[k].copy(_b);
      else if (dt > 0) flockFwd[k].lerp(_b, 1 - Math.pow(0.8, dt * 60)).normalize();
      const l = Math.hypot(_b.x, _b.z) || 1;
      flockPos[k].set(_a.x - (_b.z / l) * right * (1 + 2.2 * peel), _a.y + up + 26 * peel, _a.z + (_b.x / l) * right * (1 + 2.2 * peel));
    };
    function update(dt, time, camera, u) {
      if (camera.matrixWorld) _cp.setFromMatrixPosition(camera.matrixWorld); else _cp.copy(camera.position);
      const cy = _cp.y;
      flyCrane(time, camera, u);
      G.uTime.value = time; G.uU.value = u;
      const high = smoothstep(40, 200, cy);
      G.uVis.value = lerp(900, 2500, high) * visK;
      G.uMist.value.z = smoothstep(95, 150, cy);
      G.uMist.value.w = smoothstep(66, 84, cy) * (1 - smoothstep(92, 108, cy));      // about a second of bare paper
      ctx.renderer.getDrawingBufferSize(_size); G.uPxs.value = Math.max(0.5, _size.y / 720);
      dome.position.copy(_cp);
      const el = THREE.MathUtils.degToRad(lerp(elevLow, elevHigh, high));
      sunDir.set(Math.sin(sunAz) * Math.cos(el), Math.sin(el), -Math.cos(sunAz) * Math.cos(el));
      sunUp.set(0, 1, 0).addScaledVector(sunDir, -sunDir.y).normalize();
      sun.position.copy(_cp).addScaledVector(sunDir, SUN_D); sun.lookAt(_cp);
      sunU.uSun.value.y = hour === 'evening' ? -0.05 : -9;

      // the dragon: travel, tail flick and drips are all keyed to u
      const tr2 = travelAt(u), fl = clamp((u - U_FLICK) / 0.12, 0, 1), dr = clamp((u - 0.80) / 0.18, 0, 1);
      const doorK = smoothstep(0.47, 0.57, u) * (1 - smoothstep(0.685, 0.74, u));
      doorVis.value = 120 + 6000 * doorK * doorK * doorK;
      const ghostRing = 0.3 * smoothstep(0.5, 0.6, u);                  // the ring hangs as a ghost wash at the end of the avenue before the tail loads it
      hero.setTravel(tr2); hero.setEnso(fl, dr); hero.setGhost(ghostRing);
      hero.mistBand.copy(G.uMist.value); hero.fadeRange.set(G.uVis.value * 0.7, G.uVis.value * 1.7);
      hero.update(dt, time, camera);
      if (hero2) {
        hero2.setTravel(tr2 - timing.flickTravel + hero2.timing2.flickTravel - 50 * (1 - smoothstep(0.62, U_FLICK, u))); hero2.setEnso(fl, dr * 0.8); hero2.setGhost(ghostRing * 0.6);
        hero2.mistBand.copy(G.uMist.value); hero2.fadeRange.copy(hero.fadeRange);
        hero2.update(dt, time, camera);
      }

      // birds lead the way, part before the ring
      const d = u * path.length;
      // a jump of place is told by the step of u alone, since the last call: a flight's longest step is 0.05 s x 2.5 (Pace) x 5 (the hurry) / 48 s
      // = 0.013 of the route (0.00035 at 60 frames a second and the world's own pace); past 0.04 the place was posed (a still, a visitor set down
      // along the route; posed places lie 0.25 apart) and the skeins' headings are landed. Seen through a portal u stays 0, and the frame of a
      // crossing brings only what the flight overshot the portal by, less than one frame's flight
      const jump = Math.abs(u - uWas) > 0.04; uWas = u;
      setFlock(0, d + 45 + 7 * Math.sin(time * 0.21), -27, 8 + 2 * Math.sin(time * 0.17), u, dt, jump);
      setFlock(1, d + 150 + 9 * Math.sin(time * 0.16 + 2), 44, 40 * smoothstep(0.05, 0.3, u) + 16 + 3 * Math.sin(time * 0.13 + 1), u, dt, jump);

      // the craft drifts with the stream; pole, lantern and cormorants
      const drift = 16 * smoothstep(0, 0.3, u) + Math.sin(time * 0.23) * 1.2;
      craftMesh.position.set(craftPos.x + hx * drift, Math.sin(time * 0.9) * 0.06, craftPos.z + hz * drift);
      anim[1].copy(poleDir).multiplyScalar(craft === 'raft' ? 0.55 - 0.85 * Math.max(0, Math.sin(time * 0.95)) : 0.08 * Math.sin(time * 2.1));
      anim[2].set(-hz * Math.sin(time * 1.5) * 0.14, -Math.abs(Math.sin(time * 1.5)) * 0.03, hx * Math.sin(time * 1.5) * 0.14);
      for (const dv of divers) {
        const s = (u - dv.u0) / 0.014, a = anim[dv.slot], out = -craftSide;
        if (s <= 0) a.set(0, 0, 0);
        else if (s < 1) a.set((-hz * out * 2.4 + hx * 0.8) * s, 1.3 * Math.sin(s * Math.PI) * (1 - s) - 1.7 * s * s, (hx * out * 2.4 + hz * 0.8) * s);
        else if (s < 2.6) a.set(0, -2000, 0);
        else a.set(-hz * out * 4.6 + hx * 3.4, -1.02 + 0.08 * Math.sin(time * 2.2 + dv.slot) + 0.5 * Math.max(0, 1 - (s - 2.6)), hx * out * 4.6 + hz * 3.4);
      }
      if (dolphin) {
        const T = 5.2, ph = (time % T) / T, leap = clamp(ph / 0.3, 0, 1), dd = Math.min(d + 40 + ph * 14, 420);
        riverAt(dd, -craftSide * 17, _rv);
        dolphin.position.set(_rv[0], ph < 0.3 ? 3.4 * Math.sin(leap * Math.PI) - 0.9 : -2000, _rv[2]);
        dolphin.rotation.set(-Math.cos(leap * Math.PI) * 0.95, Math.atan2(-_rv[3], -_rv[4]), 0);
      }
    }
    const _rv = [];
    update(0, 0, { position: path.start }, 0);
    // that call stands at a clock step of nought and eases nothing: one turn of 0.2 toward each skein's tangent (the leads
    // of update at time 0, u 0) is taken here by hand, so a flight opens with the birds already turned a little into the path
    flockFwd[0].lerp(path.tangentAtDist(45, _b), 0.2).normalize(); flockFwd[1].lerp(path.tangentAtDist(150 + 9 * Math.sin(2), _b), 0.2).normalize();

    return {
      scene, path, duration,
      title: rare ? 'Mountains of Wet Ink: Two Dragons' : rain ? 'Mountains of Wet Ink: Rain' : snow ? 'Mountains of Wet Ink: Snow' : night ? 'Mountains of Wet Ink: Moon Reserved' : 'Mountains of Wet Ink',
      // the kit's great-bird is a lit, modelled, teal-feathered bird with brass bells and a lantern: on unlit rice paper it reads
      // as a foreign 3D model (rendered and checked), so the crane we ride is drawn here in the world's own strokes instead
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.5, far: 7000, lookAhead: 30, sway: 0.8, bank: 1 },
      pois: [
        { at: () => poiC.copy(craftMesh.position).setY(1.5), from: 0.008, to: 0.08, weight: 0.4 },
        { at: (time, u) => headAt(Math.max(u, 0.2), poiV).lerp(path.pointAt(Math.min(1, u + 0.08), _b), 0.35), from: 0.2, to: 0.37, weight: 0.5 },
        { at: (time, u) => headAt(u, poiV), from: 0.45, to: 0.72, weight: 0.62 },
      ],
      portal: { shape: 'circle', radius: 7.2, color: paperHex, glow: 0, revealDistance: 380 },   // closed, the disc is the sheet itself
      post: {
        exposure: EXPOSURE, bloom: { strength: 0.3, radius: 0.5, threshold: 1.35 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.34, grain: 0.03, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); if (hero2) hero2.dispose(); for (const v of [...variants, ...variantsHi, ...variantsLo]) v.geo.dispose(); },
    };
  },
};
