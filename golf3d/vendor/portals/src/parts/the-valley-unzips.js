// THE ZIP: hero set piece of "the-valley-unzips" (The Valley Unzips), and the DENIM STYLE KIT the world is cut from.
// A brass slider the size of a church (70 wide, 90 long, 63 to the top of its bridge) runs down a zip a mile long.
// Ahead of it the teeth are meshed and the denim floor is whole; behind it the two flanks part in a V (0.3 m a side
// per metre, 150 m a side at most), each flank's edge wound back on itself as a pale breaker up to 26 m tall, the two
// tapes with their teeth left lying on the turkey-red cotton underneath, every tooth rocked up a quarter turn.
//
// FRAME    Local space IS the brief's space: the zip lies on x = 0 from z = -800 to the bottom stop at z = +800,
//          course toward +Z, the red plain is y = 0 and the closed denim floor is y = 4. "Right of the course"
//          (where the afternoon polishes the metal) is -X. The piece covers |x| <= 155: the world's terrain starts
//          there, at y = 4, aWear 0.32, billow amplitude 1.5 (opts.billow), so the two meet without a step.
// SIZE     radius 130 / height 63 / center (0, 26, 400) describe the slider's neighbourhood for the viewer; the zip
//          itself is 1,600 m long. About 129k triangles (flanks 79k, teeth 43k, slider and tab 5k), 8 draw calls
//          (9 with the sky), build about 60 ms, longest step 6 ms. No lights, no textures, no render targets.
// OPTS     palette  7 hex strings in the brief's order [indigo, fade, ecru, orange, brass, red, chambray]
//          style    the world's shared makeStyle() instance (then the WORLD calls style.update every frame)
//          detail   0.6..1 thins the flank grid and the torn ends
//          wash     'worn' (default) | 'raw' | 'stonewashed'       billow  metres of breeze swell (1.5)
//          schedule [[second, sliderZ], ...] (default SCHEDULE: creeps 7 m/s from z 330, runs at 25 s, strikes the
//                   stop at 33 s, z 752)      duration  seconds that setProgress(1) stands for (44)
//          sky      true adds style.sky() to the piece (default false: the world adds it to its own scene)
//          demo     false = stand still until driven (default: plays the schedule on the clock until setProgress)
// HOOKS    hero.setProgress(u)  journey fraction 0..1 -> slider position from the schedule (call every frame; if the
//                               world uses pace(u), pass elapsed journey seconds / 44 instead of the raw path u)
//          hero.setSliderZ(z)   or place the slider yourself;  hero.sliderZ  where it is;  hero.sliderZAt(seconds)
//          hero.openingAt(z)    -> { w, edge, roll, rollTop, tape }: half-opening, |x| of the cloth's contact line,
//                               roll radius, top of the breaker (y), |x| of the parted tooth row. The roll spans
//                               |x| from edge - 1.2 roll to edge + 1.2 roll: keep the path 12 m clear of that.
//          The tab is a pendulum driven by the slider's own acceleration: it lags when the slider runs and rings
//          against the casting when it stops. Everything else moves in vertex shaders from style.uniforms.
// ANCHORS  (local) zipFrom, zipTo, sliderStart, sliderStop, bottomStop; flyThrough: the brief's line from the entry
//          over the knee, down into the V, up it, out over the young roll, beside the slider's right flank, onto
//          the parting line and past the stopped slider (>= 20 m from brass and roll with the default schedule);
//          viewpoints [{ position, target, note }] for the evaluator's frames 1, 4, 5, 6, 7; portalSeat (only a
//          suggestion: the buttonhole is the world's); tabPivot (slider-local); sliderHalfWidth/Length/Top; right.
// STYLE    makeStyle(ctx, opts) -> see the comment on makeStyle. Flat switch assumed: post { flat: 1, bloom 0,
//          grade neutral }, so every colour here is the hex shown; nothing exceeds 1 and nothing is pre-corrected.
//          Also exported: GLSL_COMMON (zipOpen, zipRoll, zipTape, denimBillow), GLSL_ROLL (flankPos: put your own
//          fringe, lint or stitches ON the rolling flank with it), PALETTE, SCHEDULE.
// WORLD   Added by the world builder: cotton() takes uTick (1 = ticking stripes along the zip instead of dots); thread()
//          takes { billow }; the flank material has uCut / uCutDir (an ellipse where the world has a hole over the flank:
//          the knee); torn ends follow the schedule's speed (most when it runs, none once it stands); the roll is lumpier.
// FIX 0   The breaker is no longer a wound-up hose: flankPos() lays the edge as an open, slumped roll of at most one
//          loose turn, true to length from the hem, so the dark turned hem and its stitch row stay outside (on the lip
//          of the young curl, wandering over the crest and down the back of the old one); the surplus is tucked under
//          at the contact line. zipRoll(w) springs up within 40 m of the slider's rear; zipWide(w) and the slump turn
//          the tall young curl into a wide old roll. uniforms.uCurl (0..1) holds the breakers near the slider low
//          (the world keeps it 0 on entry so the red wedge shows from the pocket hill, and raises it over the knee).
//          Drape folds are displaced in flankPos and drawn as creases on the wrong side. The felled seam beside the
//          zip and its dashes are now GEOMETRY riding flankPos ('zip-seam', 'zip-stitches'); the painted panel seams
//          are gone. Teeth leave the slider lying flat, kick, and rock up on end between 84 and 150 m behind it.
//          denimColor() draws long crisp fade streaks along the grain and bigger yarns near the lens; the sky has
//          ten dead-level slubs and thin level weft streaks. About 150k triangles, 10 draw calls.
// FIX 1   The wrong side of the cloth is ONE flat pale tone with a weft rib of fine lines running along the roll (shown to
//          about 150 m, then melted into its mean); everything else on a breaker is a LINE worked out in the fragment
//          shader from s and the winding angle (no interpolated ramps, so no facets and no airbrush): a crisp dark crease
//          in each drape valley, a thin rubbed line on each crest, shorter broken creases between, one tuck line at each
//          gather, the dark turned hem with a rubbed fold line. The young breaker stands 2.6 m taller in radius (zipRoll
//          and its JS twin); uniforms.uHop (course z, depth) holds the west roll low where the world's path hops it.
//          Whiskers on the closed flank are thin crisp creases (hashed lengths), not noise bands. denimColor(): single
//          yarns (ecru peeping between cords) only within about 20 m of the lens; fade streaks are broad only far off
//          and a metre or two wide near the lens; gStreak = 0.0 before the call leaves them out (straps). Teeth rock up
//          on end between 64 and 116 m behind the slider. Driven by setProgress, the tab's pendulum takes the schedule's
//          own acceleration, so a held frame shows it swung back while the slider runs.
// POLISH 3 denimColor() draws the cloth in the metal's hand: five flat tones (dnTone) with fwidth-hard borders; the grain field
//          only moves those borders, so fade lies in hard slivers along the grain; the twill rib is a thin dark line 11 degrees
//          off the grain; slubs are short hard flecks; the flank's baked wear is stretched along its grain. cotton() takes
//          uniforms.uPrint (0 off): from z 404 on, a printed medallion every 124 m down the zip line and a border line with a
//          row of dots each side (not on the ticking colourway).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#27406B', '#9DB4D0', '#E6DDC8', '#D9822B', '#C9A24A', '#C2372D', '#BFD0E4'];

// ---------------------------------------------------------------------------------------------------------------
// GLSL shared by every cloth material. denimBillow() is THE breeze: use it for anything that must ride the cloth.
// ---------------------------------------------------------------------------------------------------------------
export const GLSL_COMMON = /* glsl */`
uniform float uTime; uniform float uBreeze; uniform float uSliderZ; uniform float uCurl;
// half-width of the opening at course position z: 0 ahead of the slider, 0.3 m a metre behind it, 150 m at most
float zipOpen(float z){ float d = max(uSliderZ + 15.0 - z, 0.0); return min(0.3 * d * smoothstep(0.0, 20.0, d) + 12.0 * smoothstep(0.0, 55.0, d), 150.0); }
// nominal radius of the full-grown breaker for an opening w: under 2.5 m while it is still inside the slider (w < 30),
// then the edge springs up as the cloth leaves the slider's rear and goes on growing
float zipRoll(float w){ return 1.2 + 1.3 * smoothstep(8.0, 24.0, w) + 7.0 * smoothstep(29.0, 40.0, w) + 2.6 * smoothstep(31.0, 44.0, w) * (1.0 - smoothstep(58.0, 80.0, w)) + 8.0 * smoothstep(45.0, 150.0, w); }
// its section: the young curl stands up, taller than wide; the old one has slumped, wider than tall
float zipWide(float w){ return mix(0.85, 1.3, smoothstep(45.0, 100.0, w)); }
// where the parted tape (and its teeth) lies: centre line |x| for an opening w, at the zip-side foot of the breaker
float zipTape(float w){ return max(2.75, w - 3.5 - 1.25 * zipWide(w) * zipRoll(w)); }
float dnHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float dnNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(dnHash(i), dnHash(i + vec2(1., 0.)), f.x), mix(dnHash(i + vec2(0., 1.)), dnHash(i + vec2(1., 1.)), f.x), f.y); }
// slow sag-and-billow of the hills, in metres per unit amplitude (about -1..1); p = world xz
float denimBillow(vec2 p, float t){
  float a = sin(p.x * 0.0131 + t * 0.33 + 1.7 * sin(p.y * 0.0071 - t * 0.19));
  float b = sin(p.y * 0.0173 - t * 0.27 + 1.3 * sin(p.x * 0.0093 + t * 0.15));
  return (a * b * 0.75 + 0.25 * sin(p.x * 0.041 + p.y * 0.033 + t * 0.9)) * uBreeze;
}
`;

// fragment: twill + wear. Inputs: uv in METRES in the panel's own grain (ribs run along uv.y), wear 0..1.
const GLSL_DENIM_FRAG = /* glsl */`
uniform vec3 cRaw, cIndigo, cFade, cEcru, cWrong;
float gStreak = 1.0;                                     // a material sets it 0 before denimColor() to leave the fade streaks out (straps)
vec3 wearRamp(float w){
  vec3 c = mix(cRaw, cIndigo, smoothstep(0.0, 0.34, w));
  c = mix(c, cFade, smoothstep(0.34, 0.80, w));
  return mix(c, mix(cFade, cEcru, 0.72), smoothstep(0.80, 1.0, w));
}
vec3 dnTone(float f, float af){                           // the five flat tones of the cloth, hard-edged
  vec3 c = mix(cRaw, cIndigo, smoothstep(0.17 - af, 0.17 + af, f));
  c = mix(c, mix(cIndigo, cFade, 0.52), smoothstep(0.41 - af, 0.41 + af, f));
  c = mix(c, cFade, smoothstep(0.62 - af, 0.62 + af, f));
  return mix(c, mix(cFade, cEcru, 0.72), smoothstep(0.86 - af, 0.86 + af, f));
}
vec3 denimColor(vec2 uv, float wear, bool front){
  // POLISH 3: the cloth is drawn in the metal's hand. Five flat tones (raw, indigo, mid, fade, rubbed), cut into hard-edged
  // shapes that lie along the grain; the twill rib is a thin crisp line 11 degrees off the grain; nothing soft anywhere.
  float ribC = (uv.x + 0.2 * uv.y) / 2.4;                // 2.4 m twill rib (12 m along the travel: under 2.4 crossings a second)
  float fw = fwidth(ribC) + 1e-5;                        // ribs per pixel
  float tri = abs(fract(ribC) - 0.5) * 2.0;
  float ribLine = 1.0 - smoothstep(0.26 - 2.0 * fw, 0.26 + 2.0 * fw, tri);
  float vis = 1.0 - smoothstep(0.07, 0.15, fw);          // dissolved where a rib is under about 7 px
  float mpp = fwidth(uv.x) + fwidth(uv.y);               // metres per pixel
  float nearK = 1.0 - smoothstep(0.09, 0.30, mpp);       // yarn level, only close to the lens
  float peepK = 1.0 - smoothstep(0.035, 0.11, mpp);      // single yarns: only where a cord is three pixels and more (within about 20 m)
  float yarn = dnNoise(vec2(uv.x * 3.6 + 2.0 * dnNoise(uv * 0.4), uv.y * 0.62));   // short strokes: weft showing between the warp cords
  float ay = clamp(fwidth(yarn), 1e-4, 0.2);
  float peep = smoothstep(0.62 - ay, 0.62 + ay, yarn) * peepK;     // ecru weft peeping between the cords, each a hard fleck
  vec2 nc = floor(uv / 3.1); vec2 np = (nc + 0.2 + 0.6 * vec2(dnHash(nc), dnHash(nc + 7.3))) * 3.1;
  float nep = (1.0 - smoothstep(0.17, 0.17 + mpp + 1e-4, length(uv - np))) * step(0.72, dnHash(nc + 3.1)) * nearK;
  if (!front) {                                          // the wrong side: ONE flat pale tone, weft-faced: a rib of fine lines, nothing soft
    float rc = uv.x / 1.6; float fb = fwidth(rc) + 1e-5;
    float line = 1.0 - smoothstep(0.15 - fb, 0.15 + fb, abs(fract(rc) - 0.5));
    float rv = 1.0 - smoothstep(0.16, 0.34, fb);         // under about 4 px a rib the lines melt into their mean
    vec3 c = mix(cWrong, cFade, 0.44 * mix(0.30, line, rv));
    return mix(c, cIndigo, peep * 0.35);
  }
  // the grain field: long slivers ten and more times longer than wide (broad far off, a metre or two wide within 100 m,
  // single cords in the nearest strip). It only moves the tone borders, so every edge it makes is a hard one.
  float nearS = 1.0 - smoothstep(0.22, 0.60, mpp);
  float gA = dnNoise(vec2(uv.x * 0.11, uv.y * 0.0065) + 31.0) - 0.5;
  float gB = dnNoise(vec2(uv.x * 0.47, uv.y * 0.011) + 31.0) - 0.5;
  float gC = dnNoise(vec2(uv.x * 1.3, uv.y * 0.05) + 5.0) - 0.5;
  float f = wear + (gA * 0.34 * (1.0 - 0.45 * nearS) + gB * 0.26 * nearS) * (0.35 + 0.65 * gStreak) + gC * 0.22 * nearK;
  float af = clamp(fwidth(f), 1e-4, 0.05);
  vec3 c = dnTone(f, af);
  // slubs: thick places in single yarns, short hard flecks one tone paler (a few one tone darker) lying along the grain
  vec2 sc = vec2(uv.x / 2.9, uv.y / 26.0); vec2 si = floor(sc); float sh = dnHash(si + 11.0);
  vec2 sf = fract(sc) - vec2(0.2 + 0.6 * dnHash(si + 3.7), 0.5); float sl = 0.10 + 0.26 * dnHash(si + 5.1);
  float fleck = (1.0 - smoothstep(0.10, 0.10 + mpp / 2.9 + 1e-4, abs(sf.x))) * (1.0 - smoothstep(sl, sl + mpp / 26.0 + 1e-4, abs(sf.y)))
    * (1.0 - smoothstep(0.40, 0.85, mpp)) * gStreak;
  c = mix(c, dnTone(f + (sh > 0.5 ? 0.23 : -0.23), af), fleck * step(0.3, abs(sh - 0.5) * 2.0));
  c = mix(c, cRaw, 0.30 * ribLine * vis * (1.0 - 0.5 * step(f, 0.17)));      // the rib: a thin dark line, clear within about 60 m
  c = mix(c, cEcru, max(peep * 0.7, nep));
  return c;
}
`;

// ---------------------------------------------------------------------------------------------------------------
// makeStyle(ctx, opts) : ONE instance per world. Returns
//   palette   { indigo, fade, ecru, orange, brass, red, chambray, raw, wrong, brassPolish, copper, copperPolish,
//               white, orangeDark, redDeep }  linear THREE.Color
//   uniforms  { uTime, uBreeze, uSliderZ, uRight }  shared by every material (the hero drives uSliderZ)
//   glsl      { common, denimFrag }  chunks for your own ShaderMaterials (denimBillow, denimColor, wearRamp)
//   denim({ billow, twoSided, grainScale })   unlit twill: needs attributes uv (metres, panel grain, rib along
//               uv.y) and aWear (float 0 raw-dark .. 0.3 indigo .. 0.8 faded .. 1 ecru). Breathes by denimBillow.
//   metal('brass'|'copper')   two flat tones: needs attribute aEdge (1 on worn bevel faces). Faces whose normal
//               turns to uRight (right of the course, -X) take the polish too.
//   thread(color, { ply })    flat yarn for stitches, fringe, knee threads, bar tacks; instancing-aware; with
//               ply it draws the two-ply twist from uv (uv.x along the yarn in metres, uv.y 0..1 across).
//   cotton()                  turkey red with white 5 m dots on a staggered 30 m grid (world xz), flat.
//   sky()                     chambray dome Mesh with slubs; style.update() keeps it on the camera.
//   slab(profile, y0, y1, bevel, opts)   extruded brass/copper slab with pale bevel faces (aEdge) -> BufferGeometry
//   stitchGeometry(len)       one two-ply dash that dives into the cloth at both ends (for InstancedMesh)
//   update(dt, time, camera)  drives uTime and the sky.
// ---------------------------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE;
  const C = (h) => new THREE.Color(h);
  const palette = {
    indigo: C(hex[0]), fade: C(hex[1]), ecru: C(hex[2]), orange: C(hex[3]), brass: C(hex[4]), red: C(hex[5]),
    chambray: C(hex[6]), raw: C('#1B2B4A'), wrong: C('#C9D3E0'), brassPolish: C('#E9D69A'), copper: C('#B8693E'),
    copperPolish: C('#D99A6C'), white: C('#F3EFE4'), orangeDark: C('#B5631C'), redDeep: C('#A92C25'),
  };
  const uniforms = {
    uTime: { value: 0 }, uBreeze: { value: opts.breeze ?? 1 }, uSliderZ: { value: 330 }, uCurl: { value: 1 },      // uCurl 0: the breakers are still low near the slider; 1: full grown
    uRight: { value: new THREE.Vector3(-1, 0.28, 0.12).normalize() },
    uHop: { value: new THREE.Vector2(1e6, 0) },             // (course z, depth 0..1): a dip in the west breaker for the path
  };
  const clothU = () => ({
    uTime: uniforms.uTime, uBreeze: uniforms.uBreeze, uCurl: uniforms.uCurl,
    cRaw: { value: palette.raw }, cIndigo: { value: palette.indigo }, cFade: { value: palette.fade },
    cEcru: { value: palette.ecru }, cWrong: { value: palette.wrong }, uSliderZ: uniforms.uSliderZ, uHop: uniforms.uHop,
  });

  function denim(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { ...clothU(), uBillow: { value: o.billow ?? 1.5 }, uGrain: { value: o.grainScale ?? 1 } },
      side: o.twoSided ? THREE.DoubleSide : THREE.FrontSide,
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute float aWear; uniform float uBillow; uniform float uGrain; varying vec2 vUv; varying float vWear;
        void main(){ vUv = uv * uGrain; vWear = aWear;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          wp.y += uBillow * denimBillow(wp.xz, uTime);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: GLSL_COMMON + GLSL_DENIM_FRAG + /* glsl */`
        varying vec2 vUv; varying float vWear;
        void main(){ gl_FragColor = vec4(denimColor(vUv, vWear, gl_FrontFacing), 1.0); }`,
    });
  }

  const metalShade = {};
  function metal(kind = 'brass', o = {}) {      // o.vertexShader / o.uniforms: your own placement (must write vEdge, vN)
    const base = kind === 'copper' ? palette.copper : palette.brass;
    const pol = kind === 'copper' ? palette.copperPolish : palette.brassPolish;
    // POLISH 2: a third flat tone, tarnish, on every face turned away from the afternoon and on undersides (the metal's own 'raw dark'),
    // so a casting reads as a solid thing; an unlit bevel keeps the plain metal tone and so draws the edge as a line on the dark side
    const shade = (metalShade[kind] = metalShade[kind] || new THREE.Color());
    shade.copy(base).offsetHSL(-0.012, 0.02, -0.17);
    return new THREE.ShaderMaterial({
      uniforms: { cMetal: { value: base }, cPolish: { value: pol }, cShade: { value: shade }, uRight: uniforms.uRight, ...(o.uniforms || {}) },
      defines: o.vertexShader ? {} : { SCRATCH: 1 },          // wear on the casting: only with the stock vertex shader (it hands on the local position)
      vertexShader: o.vertexShader || /* glsl */`
        attribute float aEdge; varying float vEdge; varying vec3 vN; varying vec3 vP;
        void main(){ vEdge = aEdge; vP = position;
          #ifdef USE_INSTANCING
            mat4 mm = modelMatrix * instanceMatrix;
          #else
            mat4 mm = modelMatrix;
          #endif
          vN = mat3(mm) * normal;
          gl_Position = projectionMatrix * viewMatrix * mm * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 cMetal, cPolish, cShade, uRight; varying float vEdge; varying vec3 vN;
        #ifdef SCRATCH
          varying vec3 vP;
          float mH(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
          float mN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
            return mix(mix(mH(i), mH(i + vec2(1., 0.)), f.x), mix(mH(i + vec2(0., 1.)), mH(i + vec2(1., 1.)), f.x), f.y); }
        #endif
        void main(){ vec3 n = vN / max(length(vN), 1e-4);
          float rt = dot(n, uRight), up = step(0.5, n.y);
          float lit = max(step(-0.05, rt), up);
          // three flat tones by the way a face is turned: tops plain metal, walls half tarnished, walls turned from the afternoon and undersides full
          float dark = max((1.0 - up) * mix(0.5, 1.0, step(rt, -0.22)), step(n.y, -0.35)) * (1.0 - step(0.5, vEdge));
          float p = step(0.5, vEdge) * lit;      // the polish is an edge, and only where it turns to the afternoon
          #ifdef SCRATCH
            // wear, in the same two tones: long handling scratches and a few rubbed streaks, only on faces the polish may touch
            vec2 sp = abs(n.y) > 0.6 ? vP.zx : (abs(n.x) > abs(n.z) ? vP.zy : vP.xy);
            float aa = fwidth(sp.x) + fwidth(sp.y);
            float sc = step(0.84, mN(vec2(sp.x * 0.045 + 2.0 * mN(sp * 0.04), sp.y * 0.85 + 0.7 * mN(sp * 0.11)))) * step(0.40, mN(sp * 0.06 + 5.0));
            float nick = step(0.9, mN(sp * 0.9 + 17.0)) * step(0.68, mN(sp * 0.13 + 2.0));
            p = max(p, max(sc * (1.0 - smoothstep(1.0, 2.4, aa)), nick * (1.0 - smoothstep(0.45, 1.1, aa))) * lit);
          #endif
          gl_FragColor = vec4(mix(mix(cMetal, cShade, dark), cPolish, p), 1.0); }`,
    });
  }

  function thread(color, o = {}) {
    const c = color || palette.white;
    return new THREE.ShaderMaterial({
      uniforms: { ...clothU(), cA: { value: c }, cB: { value: o.dark || c.clone().multiplyScalar(0.8) }, uPly: { value: o.ply ? 1 : 0 },
        uSway: { value: o.sway ?? 0 }, uBillow: { value: o.billow ?? 0 } },
      side: o.twoSided ? THREE.DoubleSide : THREE.FrontSide,
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute float aSway; uniform float uSway; uniform float uBillow; varying vec2 vUv;
        void main(){ vUv = uv;
          #ifdef USE_INSTANCING
            vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          #else
            vec4 wp = modelMatrix * vec4(position, 1.0);
          #endif
          wp.y += uBillow * denimBillow(wp.xz, uTime);         // billow: ride the cloth it is sewn to
          float k = aSway * uSway * uBreeze;                 // aSway: 0 at the held end .. 1 at the loose end
          wp.x += k * (0.6 + sin(uTime * 1.3 + wp.z * 0.11 + wp.y * 0.07));
          wp.z += k * 0.6 * sin(uTime * 0.9 + wp.x * 0.09);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform vec3 cA, cB; uniform float uPly; varying vec2 vUv;
        void main(){ float t = vUv.x / 0.9 + vUv.y * 0.9; float fw = fwidth(t);
          float tri = abs(fract(t) - 0.5) * 2.0;
          float ply = smoothstep(0.72 - fw, 0.72 + fw, tri) * (1.0 - smoothstep(0.15, 0.35, fw)) * uPly;
          gl_FragColor = vec4(mix(cA, cB, ply), 1.0); }`,
    });
  }

  // turkey red, white dots, and low travelling ripples (deeper red creases) just inside the opening's edge
  function cotton() {
    return new THREE.ShaderMaterial({
      uniforms: { ...clothU(), cRed: { value: palette.red }, cDeep: { value: palette.redDeep }, cDot: { value: palette.white }, uTick: { value: 0 }, uPrint: { value: 0 } },
      vertexShader: /* glsl */`varying vec3 vW;
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        uniform vec3 cRed, cDeep, cDot; uniform float uTick; uniform float uPrint; varying vec3 vW;
        void main(){ vec2 p = vW.xz;
          float row = floor(p.y / 15.0); vec2 q = vec2(p.x + 15.0 * mod(row, 2.0), p.y);
          vec2 c = (floor(q / vec2(30.0, 15.0)) + 0.5) * vec2(30.0, 15.0);
          float d = length(q - c); float aa = 0.7 * (fwidth(p.x) + fwidth(p.y)) + 1e-4;
          float dotm = 1.0 - smoothstep(2.5 - aa, 2.5 + aa, d);
          // the print: four small pips round every dot (a sprig), gone where they are under a pixel
          dotm = max(dotm, (1.0 - smoothstep(0.85 - aa, 0.85 + aa, length(abs(q - c) - vec2(4.4)))) * (1.0 - smoothstep(0.5, 1.1, aa)));
          { float pm = uPrint * (1.0 - uTick) * step(404.0, p.y); float thinK = 1.0 - smoothstep(0.6, 1.6, aa);
            vec2 mq = vec2(p.x, mod(p.y - 380.0, 124.0) - 62.0); float r = length(mq);
            float an = atan(mq.y, mq.x + 1e-3 * step(abs(mq.x) + abs(mq.y), 1e-3));
            float sp = abs(fract(an * 14.0 / 6.2832) - 0.5) * 6.2832 / 14.0 * max(r, 1.0);
            float sp2 = abs(fract(an * 30.0 / 6.2832) - 0.5) * 6.2832 / 30.0 * max(r, 1.0);
            float med = max(1.0 - smoothstep(0.8, 0.8 + aa, abs(r - 27.0)), (1.0 - smoothstep(0.5, 0.5 + aa, abs(r - 10.0))) * thinK);
            med = max(med, 1.0 - smoothstep(1.9, 1.9 + aa, length(vec2(sp, r - 18.5))));
            med = max(med, 1.0 - smoothstep(1.1, 1.1 + aa, length(vec2(sp2, r - 32.5))));
            float bx = abs(p.x);
            float brd = max(1.0 - smoothstep(0.7, 0.7 + aa, abs(bx - 58.0)), (1.0 - smoothstep(0.35, 0.35 + aa, abs(bx - 62.0))) * thinK);
            brd = max(brd, 1.0 - smoothstep(1.6, 1.6 + aa, length(vec2(bx - 67.5, mod(p.y, 12.0) - 6.0))));
            float clear = max(step(r, 36.0), step(54.0, bx) * step(bx, 72.0));
            dotm = mix(dotm, max(med, brd), pm * max(clear, max(med, brd))); }
          float w = zipOpen(p.y); float inside = w - abs(p.x);          // metres inside the edge
          float band = smoothstep(-2.0, 6.0, inside) * (1.0 - smoothstep(16.0, 34.0, inside)) * step(1.0, w);
          float ph = inside * 0.26 + uTime * 1.2 + 2.5 * dnNoise(p * 0.035); float fp = fwidth(ph);
          float crease = (1.0 - smoothstep(0.16, 0.16 + 2.0 * fp + 0.02, abs(fract(ph) - 0.5) * 2.4)) * band * (1.0 - smoothstep(0.25, 0.6, fp));
          // the cloth itself: fine warp lines along the zip (never across the travel), long pressed folds, short broken wrinkles
          float wq = p.x / 1.15 + 0.35 * dnNoise(vec2(p.x * 0.9, p.y * 0.03)); float wf = fwidth(wq) + 1e-4;
          float warp = (1.0 - smoothstep(0.10, 0.10 + wf, abs(fract(wq) - 0.5))) * (1.0 - smoothstep(0.12, 0.3, wf));
          float fq = (p.x * 0.94 + p.y * 0.21) / 37.0 + 0.5 * dnNoise(p * 0.013); float ff = fwidth(fq) + 1e-5;
          float fid = floor(fq); float foldL = (1.0 - smoothstep(0.011, 0.011 + ff, abs(fract(fq) - 0.5))) * step(0.3, dnHash(vec2(fid, 3.0))) * (1.0 - smoothstep(0.02, 0.06, ff));
          float gq = (p.x * 0.5 - p.y * 0.86) / 19.0 + 0.9 * dnNoise(p * 0.021 + 7.0); float gf = fwidth(gq) + 1e-5;
          float wr = (1.0 - smoothstep(0.014, 0.014 + gf, abs(fract(gq) - 0.5))) * step(0.62, dnNoise(p * 0.045 + 3.0)) * (1.0 - smoothstep(0.03, 0.08, gf));
          vec3 col = mix(cRed, cDeep, max(max(crease, 0.45 * warp), max(foldL, wr)));
          // ticking (uTick 1): pairs of narrow stripes lying along the zip every 12 m, instead of the dots
          float tx = abs(abs(mod(p.x + 6.0, 12.0) - 6.0) - 1.6); float ta = fwidth(p.x) + 1e-4;
          float tick = (1.0 - smoothstep(0.55 - ta, 0.55 + ta, tx)) * (1.0 - smoothstep(0.5, 1.6, ta));
          gl_FragColor = vec4(mix(col, cDot, mix(dotm, tick, uTick)), 1.0); }`,
    });
  }

  // chambray: one flat field, ten ecru slubs drifting left a degree every ten seconds, weave near the zenith only
  let skyMesh = null;
  function sky() {
    if (skyMesh) return skyMesh;
    const sr = ctx.rng.fork ? ctx.rng.fork('denim-sky') : ctx.rng, slubs = [];
    // eight lie ahead of the course (azimuth -2 .. 2 about +Z) in two staggered tiers, two behind; all dead level
    for (let i = 0; i < 10; i++) { const az = i < 8 ? -1.9 + i * 0.54 + sr.range(-0.12, 0.12) : 2.6 + (i - 8) * 1.1;
      slubs.push(new THREE.Vector4(az, (i % 2 ? 0.40 : 0.235) + sr.range(-0.045, 0.045), sr.range(0.19, 0.33), sr.range(0.020, 0.033))); }
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: uniforms.uTime, uBreeze: uniforms.uBreeze, uSliderZ: uniforms.uSliderZ, uCurl: uniforms.uCurl,
        cSky: { value: palette.chambray }, cSlub: { value: palette.ecru }, uSlub: { value: slubs } },
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: GLSL_COMMON + /* glsl */`
        uniform vec3 cSky, cSlub; uniform vec4 uSlub[10]; varying vec3 vD;
        void main(){ vec3 d = vD / max(length(vD), 1e-4);
          float az = atan(d.x, d.z + sign(d.z + 1e-6) * 1e-5 + 1e-6); float el = asin(clamp(d.y, -1.0, 1.0));
          vec2 g = d.xz / max(d.y, 0.2) * 34.0; vec2 fg = fwidth(g); float fe = fwidth(el) + 1e-5;
          float zen = smoothstep(0.866, 0.97, d.y) * (1.0 - smoothstep(0.2, 0.5, max(fg.x, fg.y)));
          float weave = (step(0.5, fract(g.x)) - 0.5) * (step(0.5, fract(g.y)) - 0.5) * 4.0 * zen;
          float drift = uTime * 0.001745;
          // the cloth of the sky: thin level weft streaks, each a few degrees long and a quarter of a degree thick
          float fine = smoothstep(0.66, 0.70, dnNoise(vec2((az + drift) * 9.0, el * 110.0))) * (1.0 - smoothstep(0.002, 0.006, fe)) * (1.0 - smoothstep(0.8, 1.2, el));
          float s = 0.0;
          for (int i = 0; i < 10; i++) { vec4 q = uSlub[i];
            float da = mod(az - q.x + drift + 3.14159265, 6.2831853) - 3.14159265;
            float x = da / q.z; float y = (el - q.y) / q.w;
            float body = max(1.0 - x * x, 0.0) * (0.82 + 0.18 * sin(da * 23.0 + q.x * 7.0));      // a thick place in the yarn: a level spindle
            s = max(s, 1.0 - smoothstep(0.80, 1.0, y * y / max(body * body, 1e-3) + step(body, 0.0) * 4.0)); }
          vec3 col = mix(cSky * (1.0 + 0.012 * weave), cSlub, 0.22 * fine);
          gl_FragColor = vec4(mix(col, cSlub, s), 1.0); }`,
    });
    skyMesh = new THREE.Mesh(new THREE.SphereGeometry(2600, 48, 24), m);
    skyMesh.renderOrder = -0.5; skyMesh.frustumCulled = false;
    return skyMesh;
  }

  // slab(profile, y0, y1, bevel, { holes, edgeWalls }): profile = [[x, z], ...] any winding, extruded from y0 to y1.
  // The rim of both caps is a chamfer `bevel` wide flagged aEdge = 1: that pale worn edge is how brass is drawn.
  function slab(profile, y0, y1, bevel = 0.6, o = {}) {
    const pos = [], nor = [], edge = [];
    const tri = (a, b, c, n, e) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const flip = n ? (nx * n[0] + ny * n[1] + nz * n[2]) < 0 : false;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; if (flip) { nx = -nx; ny = -ny; nz = -nz; }
      const order = flip ? [a, c, b] : [a, b, c];
      for (const p of order) { pos.push(p[0], p[1], p[2]); nor.push(nx, ny, nz); edge.push(e); }
    };
    const area = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a; };
    const rings = [profile, ...(o.holes || [])].map((r, k) => {
      const sgn = (area(r) > 0 ? 1 : -1) * (k === 0 ? 1 : -1), n = r.length, out = [], ins = [];
      for (let i = 0; i < n; i++) {
        const p = r[i], a = r[(i + n - 1) % n], b = r[(i + 1) % n];
        let n1x = (p[1] - a[1]), n1z = -(p[0] - a[0]), n2x = (b[1] - p[1]), n2z = -(b[0] - p[0]);
        const l1 = Math.hypot(n1x, n1z) || 1, l2 = Math.hypot(n2x, n2z) || 1;
        n1x *= sgn / l1; n1z *= sgn / l1; n2x *= sgn / l2; n2z *= sgn / l2;
        const k2 = bevel / Math.max(0.35, 1 + n1x * n2x + n1z * n2z);
        out.push([n2x, n2z]); ins.push([p[0] - (n1x + n2x) * k2, p[1] - (n1z + n2z) * k2]);
      }
      return { r, out, ins };
    });
    const yb = Math.min(bevel, (y1 - y0) * 0.45);
    for (const { r, out, ins } of rings) {
      const n = r.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, p = r[i], q = r[j], pi = ins[i], qi = ins[j], N = [out[i][0], 0, out[i][1]];
        const A = [p[0], y0 + yb, p[1]], B = [q[0], y0 + yb, q[1]], Cc = [q[0], y1 - yb, q[1]], D = [p[0], y1 - yb, p[1]];
        const ew = o.edgeWalls ? 1 : 0;
        tri(A, B, Cc, N, ew); tri(A, Cc, D, N, ew);
        const T1 = [pi[0], y1, pi[1]], T2 = [qi[0], y1, qi[1]], NT = [N[0], 1, N[2]];
        tri(D, Cc, T2, NT, 1); tri(D, T2, T1, NT, 1);
        const B1 = [pi[0], y0, pi[1]], B2 = [qi[0], y0, qi[1]], NB = [N[0], -1, N[2]];
        tri(A, B, B2, NB, 1); tri(A, B2, B1, NB, 1);
      }
    }
    const cont = rings[0].ins.map((p) => new THREE.Vector2(p[0], p[1])), holes = rings.slice(1).map((g) => g.ins.map((p) => new THREE.Vector2(p[0], p[1])));
    const all = cont.concat(...holes), faces = THREE.ShapeUtils.triangulateShape(cont, holes);
    for (const f of faces) {
      const a = all[f[0]], b = all[f[1]], c = all[f[2]];
      tri([a.x, y1, a.y], [b.x, y1, b.y], [c.x, y1, c.y], [0, 1, 0], 0);
      tri([a.x, y0, a.y], [b.x, y0, b.y], [c.x, y0, c.y], [0, -1, 0], 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
    return g;
  }

  // one stitch: a low two-ply cord `len` long lying along +Z, centred, both ends diving 0.6 m into the cloth
  function stitchGeometry(len = 7, width = 0.9, height = 0.45) {
    const nu = 10, nv = 4, pos = [], uvs = [], idx = [];
    for (let i = 0; i <= nu; i++) {
      const s = i / nu, z = (s - 0.5) * len, e = Math.min(s, 1 - s) * len;       // metres from the nearer end
      const dive = 1 - smoothstep(0, 0.9, e), wd = width * (0.55 + 0.45 * smoothstep(0, 0.7, e));
      for (let j = 0; j <= nv; j++) {
        const a = (j / nv) * Math.PI;
        pos.push(-Math.cos(a) * wd * 0.5, Math.sin(a) * height - dive * 0.7 - 0.05, z); uvs.push(s * len, j / nv);
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3), 1));
    g.setIndex(idx); return g;
  }

  const _cp = new THREE.Vector3();
  function update(dt, time, camera) {
    uniforms.uTime.value = time;
    if (skyMesh && camera) { _cp.setFromMatrixPosition(camera.matrixWorld); skyMesh.position.copy(_cp); }
  }
  // POLISH 2: the drawn edge of a casting. A second copy of the geometry pushed out along the welded normals and shown from behind in one
  // flat dark tone (the gutter where metal meets air): the outline is geometry, so it shows through the previous portal too
  function outlineGeometry(geo) {
    const pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count, acc = new Map(), out = new Float32Array(n * 3);
    // POLISH 3: the same weld with a numeric key (no strings), read straight from the arrays: a fifth of the time, so it is a short build step
    const pa = pos.array, na = nor.array, keys = new Float64Array(n);
    for (let i = 0; i < n; i++) { const k = (Math.round(pa[i * 3] * 50) + 20000) * 1.6e9 + (Math.round(pa[i * 3 + 1] * 50) + 20000) * 40000 + (Math.round(pa[i * 3 + 2] * 50) + 20000);
      keys[i] = k; let a = acc.get(k); if (!a) { a = [0, 0, 0]; acc.set(k, a); } a[0] += na[i * 3]; a[1] += na[i * 3 + 1]; a[2] += na[i * 3 + 2]; }
    for (let i = 0; i < n; i++) { const a = acc.get(keys[i]), l = Math.hypot(a[0], a[1], a[2]) || 1; out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', pos); g.setAttribute('aOut', new THREE.BufferAttribute(out, 3));
    if (geo.index) g.setIndex(geo.index); g.boundingSphere = geo.boundingSphere; return g;
  }
  let lineMat = null;
  function outline() {
    if (!lineMat) lineMat = new THREE.ShaderMaterial({
      uniforms: { cLine: { value: palette.brass.clone().offsetHSL(-0.02, 0.0, -0.36) } }, side: THREE.BackSide,
      vertexShader: /* glsl */`
        attribute vec3 aOut;
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.0);
          vec3 wn = mat3(modelMatrix) * aOut; wn = wn / max(length(wn), 1e-4);
          wp.xyz += wn * clamp(distance(wp.xyz, cameraPosition) * 0.0042, 0.35, 2.6);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`uniform vec3 cLine; void main(){ gl_FragColor = vec4(cLine, 1.0); }`,
    });
    return lineMat;
  }
  return { palette, uniforms, glsl: { common: GLSL_COMMON, denimFrag: GLSL_DENIM_FRAG }, clothUniforms: clothU,
    denim, metal, thread, cotton, sky, slab, stitchGeometry, update, outline, outlineGeometry };
}

// ---------------------------------------------------------------------------------------------------------------
// THE HERO
// ---------------------------------------------------------------------------------------------------------------
const Z0 = -800, Z1 = 800, FLOOR = 4, STRIP = 150, EDGE0 = 5;   // zip ends, denim floor height, strip width, tape half-gap
// slider centre z against journey time in seconds (brief: creeps 7 m/s, runs 7 -> 38 m/s in 3 s at 25 s, strikes at 33 s)
export const SCHEDULE = [[0, 330], [25, 505], [26, 517], [27, 541], [28, 575], [32.2, 734.6], [33, 752], [44, 752]];
function sliderAt(t, sch) {
  if (t <= sch[0][0]) return sch[0][1];
  for (let i = 1; i < sch.length; i++) if (t <= sch[i][0]) { const a = sch[i - 1], b = sch[i]; return lerp(a[1], b[1], (t - a[0]) / (b[0] - a[0])); }
  return sch[sch.length - 1][1];
}
// REPAIR 3: THE SLIDER'S LAW (the brief: 'for the first 25 seconds it creeps at 7 m/s ... then the slider runs away with itself, 7 to
// 38 m/s in three seconds ... strikes the bottom stop and stands still'). One smooth function of the journey's own seconds: the speed
// is creep + (top - creep) * smoothstep(runAt, runAt + spin, sec), and the place is its integral from the place it stands on entry,
// held at the stop once it has struck. No table and no knot: where it stands at any moment follows from these six numbers alone.
export function zipLaw(o = {}) {
  const start = o.start ?? 330, stop = o.stop ?? 752, creep = o.creep ?? 7, top = o.top ?? 38, runAt = o.runAt ?? 25, spin = o.spin ?? 3;
  return (sec) => { const s = Math.max(sec, 0), x = clamp((s - runAt) / spin, 0, 1);
    return Math.min(stop, start + creep * s + (top - creep) * (spin * (x * x * x - 0.5 * x * x * x * x) + Math.max(s - runAt - spin, 0))); };
}

// vertex code shared by everything that lies on the rolling flank: p = (side, s along the zip, t from the tape)
export const GLSL_ROLL = /* glsl */`
uniform float uBillow; uniform vec2 uHop; float gFlankPinch = 0.0; float gFlankFold = 0.0; float gFlankR = 1.0;
// returns world position of the cloth point (s, t) on flank sgn; nrm = its upper-face normal.
// The edge is not wound up like a hose: it lifts, flops over outward and lies as a slumped, open roll of one loose
// turn at most (TH radians), so the hem (t = 0) stays OUTSIDE, on the crest or the back of the breaker. Cloth is laid
// true to length from the hem; what the opening has pushed back beyond that is tucked under at the contact line.
vec3 flankPos(float sgn, float s, float t, out vec3 nrm, out float wound){
  float w = zipOpen(s);
  float g2 = abs(2.0 * dnNoise(vec2(s * 0.027 + sgn * 9.0, uTime * 0.02)) - 1.0);
  float pinch = 1.0 - smoothstep(0.0, 0.42, g2);                       // gathers: cinched every 25 to 50 m
  gFlankPinch = pinch;
  float big = dnNoise(vec2(s * 0.0085 + sgn * 5.0, 3.0));              // the outline rises and sags between them
  float young = 1.2 + 1.3 * smoothstep(8.0, 24.0, w) + 9.0 * smoothstep(58.0, 100.0, w) + 6.5 * smoothstep(80.0, 150.0, w);
  float R = mix(young, zipRoll(w), uCurl) * mix(1.0, (0.74 + 0.48 * big) * (1.0 - 0.40 * pinch), smoothstep(30.0, 44.0, w));
  { float hq = (s - uHop.x) / 24.0; R *= 1.0 - uHop.y * step(sgn, 0.0) * exp(-hq * hq); }      // a low gather where the path hops the west roll
  gFlankR = R;
  float TH = mix(2.85, 4.5, smoothstep(47.0, 62.0, w)) + 2.1 * (dnNoise(vec2(s * 0.024 - sgn * 3.0, 9.0 + uTime * 0.02)) - 0.5) * smoothstep(30.0, 42.0, w);
  float Rm = max(R * 0.92, 0.5);
  float a = max(min(w, Rm * TH) - t, 0.0); float th = a / Rm;
  float fold = s * 0.21 + sgn * th * 1.15 + 5.0 * dnNoise(vec2(s * 0.016, sgn * 4.0));     // oblique drape folds, 3 or 4 per 100 m
  gFlankFold = fold;
  float on = smoothstep(0.25, 1.3, th);
  float r = R * (1.0 - 0.045 * th) * (1.0 + 0.12 * sin(fold) * on);
  float slump = mix(1.0, 0.60, smoothstep(45.0, 100.0, w));            // heavy cloth: the old roll is wider than tall
  float lift = smoothstep(0.0, 0.6, th);
  float x = w - r * sin(th) * zipWide(w);
  float y = (R - r * cos(th)) * slump;
  x += 0.22 * y;                                                       // and it leans away from the zip
  y += lift * 0.5 * sin(s * 0.19 + th * 2.0 + uTime * 0.8) * min(R * 0.12, 1.0);   // the edge flutters as it lifts
  y = max(y, 0.0);
  if (t >= w) { x = t; y = 0.0; }
  float hold = smoothstep(10.0, 150.0, t) * (1.0 - smoothstep(0.0, 2.0, th));
  vec3 p = vec3(sgn * (x + ${EDGE0.toFixed(1)}), ${FLOOR.toFixed(1)} + y, s);
  p.y += uBillow * hold * denimBillow(p.xz, uTime);
  nrm = t >= w ? vec3(0.0, 1.0, 0.0) : vec3(sgn * sin(th), cos(th), 0.0);
  wound = th;
  return p;
}
`;

export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, opts);
  const P = style.palette, U = style.uniforms, rng = ctx.rng, noise = ctx.noise;
  const detail = clamp(opts.detail ?? 1, 0.6, 1);
  const schedule = opts.schedule || SCHEDULE, duration = opts.duration ?? 44;
  // REPAIR 3: where the slider stands at journey second t: the world's law (opts.law, a smooth function), else the table above
  const zAt = typeof opts.law === 'function' ? opts.law : (t) => sliderAt(t, schedule);
  const zFirst = zAt(0), zLast = zAt(1e6);
  const root = new THREE.Group(); root.name = 'the-zip';
  const seedA = rng.range(0, 100), wash = opts.wash === 'raw' ? -0.16 : opts.wash === 'stonewashed' ? 0.22 : 0;
  await ctx.yield();

  // ---- the two flanks that roll back (one mesh): position = (side, s, t), wound in the vertex shader -----------
  const NS = Math.round(330 * detail), NT = Math.round(75 * (0.7 + 0.3 * detail)), nv = (NS + 1) * (NT + 1);
  const fp = new Float32Array(nv * 2 * 3), fuv = new Float32Array(nv * 2 * 2), fw = new Float32Array(nv * 2), fidx = [];
  const grainA = rng.range(0.10, 0.19), grainB = -rng.range(0.10, 0.19);
  for (let f = 0; f < 2; f++) {
    const sgn = f === 0 ? 1 : -1, g = f === 0 ? grainA : grainB, cg = Math.cos(g), sg = Math.sin(g), o = f * nv;
    for (let i = 0; i <= NS; i++) {
      const fi = i / NS, s = fi < 0.16 ? lerp(Z0, 120, fi / 0.16) : lerp(120, Z1 + 20, (fi - 0.16) / 0.84);   // dense where the journey is
      for (let j = 0; j <= NT; j++) {
        const t = STRIP * Math.pow(j / NT, 1.45), k = o + i * (NT + 1) + j;
        fp[k * 3] = sgn; fp[k * 3 + 1] = s; fp[k * 3 + 2] = t;
        fuv[k * 2] = t * cg - s * sg + f * 31.7; fuv[k * 2 + 1] = t * sg + s * cg;
        const edgeK = smoothstep(40, 150, t);             // settle to the world's floor tone (0.32) at the outer edge
        fw[k] = lerp(0.36 + wash + 0.20 * noise.fbm2(fuv[k * 2] * 0.021 + seedA, fuv[k * 2 + 1] * 0.0024 + f * 7, 3) + 0.10 * noise.n2(fuv[k * 2] * 0.075, fuv[k * 2 + 1] * 0.007 + seedA), 0.32 + wash, edgeK);
        if (i < NS && j < NT) { const b = k + NT + 1; if (sgn > 0) fidx.push(k, b, k + 1, k + 1, b, b + 1); else fidx.push(k, k + 1, b, k + 1, b + 1, b); }
      }
      if (i % 10 === 9) await ctx.yield();
    }
  }
  const flankGeo = new THREE.BufferGeometry();
  flankGeo.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  flankGeo.setAttribute('uv', new THREE.BufferAttribute(fuv, 2));
  flankGeo.setAttribute('aWear', new THREE.BufferAttribute(fw, 1));
  flankGeo.setIndex(fidx);
  flankGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 900);
  const flankMat = new THREE.ShaderMaterial({
    uniforms: { ...style.clothUniforms(), uBillow: { value: opts.billow ?? 1.5 },
      uCut: { value: new THREE.Vector4(1e6, 1e6, 1, 1) }, uCutDir: { value: new THREE.Vector2(0, 1) } },   // an ellipse (centre xz, half-axes) where the world has a hole over the flank
    side: THREE.DoubleSide,
    vertexShader: style.glsl.common + GLSL_ROLL + /* glsl */`
      attribute float aWear; varying vec2 vUv; varying float vWear; varying vec3 vST; varying float vTh; varying vec2 vWXZ;
      void main(){ vec3 n; float th; vec3 p = flankPos(position.x, position.y, position.z, n, th); vWXZ = p.xz;
        vUv = uv; vWear = aWear; vST = position; vTh = th;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
    fragmentShader: style.glsl.common + style.glsl.denimFrag + /* glsl */`
      uniform vec4 uCut; uniform vec2 uCutDir; varying vec2 vUv; varying float vWear; varying vec3 vST; varying float vTh; varying vec2 vWXZ;
      void main(){ float sgn = vST.x, s = vST.y, t = vST.z; float wear = vWear;
        vec2 kq = vWXZ - uCut.xy; if (length(vec2(dot(kq, uCutDir) / uCut.z, (kq.x * uCutDir.y - kq.y * uCutDir.x) / uCut.w)) < 1.0) discard;
        float back = gl_FrontFacing ? 0.0 : 1.0;
        // whiskers: sharp pale creases running out from the zip, and a fan ahead of the slider where the cloth is still held
        float aw = fwidth(t) + fwidth(s) + 1e-3, fine = 1.0 - smoothstep(0.6, 1.8, aw);      // metres a pixel; a crease under a pixel melts away
        float wa = s * 0.085 + t * 0.022 * sgn + sgn * 40.0 + 0.8 * dnNoise(vec2(s * 0.01, t * 0.02));
        float wi = floor(wa + 0.5), wh = dnHash(vec2(wi * 1.3 + 5.0, sgn * 3.0 + 4.0)), wlen = 22.0 + 90.0 * wh;
        float whisk = (1.0 - smoothstep(0.42, 0.42 + aw, abs(wa - wi - 0.3 * (wh - 0.5)) / 0.085)) * step(0.4, wh)
          * smoothstep(13.0, 17.0, t) * (1.0 - smoothstep(0.8 * wlen, wlen, t));
        vec2 q = vec2(t + 5.0, s - uSliderZ - 20.0); float ql = length(q), fr = max(q.y + 34.0, 4.0);
        float fa3 = q.x / fr * 3.4 + sgn * 13.0, fi = floor(fa3 + 0.5), flen = 60.0 + 130.0 * dnHash(vec2(fi * 1.9 + 2.0, sgn * 7.0 + 1.0));
        float fanL = (1.0 - smoothstep(0.45, 0.45 + aw, abs(fa3 - fi) / 3.4 * fr)) * smoothstep(0.0, 30.0, q.y) * smoothstep(14.0, 18.0, t)
          * (1.0 - smoothstep(0.75 * flen, flen, ql));
        wear += 0.34 * max(whisk, fanL) * fine;
        // POLISH 3: drag creases out on the flank: long thin lines oblique to the zip, a rubbed crest with a raw line beside it,
        // each its own length (42 m apart along the course: under one a second), so no stretch of the cloth is bare
        { float ca = (s * 0.5 + t * sgn * 0.87) / 21.0 + 1.3 * dnNoise(vec2(s * 0.006, t * 0.011 + sgn * 3.0));
          float ci = floor(ca + 0.5), ch = dnHash(vec2(ci * 2.1 + 9.0, sgn * 2.0 + 6.0)), cd = (ca - ci) * 21.0;
          float t0 = 22.0 + 60.0 * ch, t1 = t0 + 34.0 + 70.0 * dnHash(vec2(ci * 0.7 + 1.0, 3.0));
          float on2 = step(0.28, ch) * smoothstep(t0, t0 + 5.0, t) * (1.0 - smoothstep(t1 - 5.0, t1, t)) * (1.0 - smoothstep(1.5, 4.0, aw));
          wear += (0.34 * (1.0 - smoothstep(0.55, 0.55 + aw, abs(cd))) - 0.24 * (1.0 - smoothstep(0.45, 0.45 + aw, abs(cd - 1.5)))) * on2; }
        // beside the zip (the felled seam itself is geometry): a dark gutter outside it, the tape edge rubbed pale
        float wob = 0.5 * sin(s * 0.031 + sgn) + 0.25 * sin(s * 0.117);
        float tt = t + wob, ta = fwidth(tt) + 1e-4;
        wear -= 0.30 * smoothstep(13.6, 14.4, tt) * (1.0 - smoothstep(15.5, 18.5, tt));
        wear += 0.30 * (1.0 - smoothstep(1.0, 3.0, t)) + 0.18 * smoothstep(0.3, 2.5, vTh);
        // gathers, worked out here from s alone (no interpolated ramp: no facet)
        float g2 = abs(2.0 * dnNoise(vec2(s * 0.027 + sgn * 9.0, uTime * 0.02)) - 1.0);
        float pk = smoothstep(0.45, 0.8, (1.0 - smoothstep(0.0, 0.42, g2)) * smoothstep(0.2, 1.5, vTh)); wear -= 0.3 * pk * (1.0 - back);
        vec3 colF = denimColor(vUv, clamp(wear, 0.0, 1.0), true);
        vec3 colB = denimColor(vUv, 0.5, false);
        // the wrong side, where it has flopped over, is ONE flat pale tone with its weft rib. Everything else on it is
        // a LINE: a crisp dark crease in each drape valley, a thin rubbed line on each fold crest, shorter broken creases
        // between them, one tuck line at each gather; then the dark turned hem and the tape at the free edge
        float on = smoothstep(0.35, 1.0, vTh);
        float fold = s * 0.21 + sgn * vTh * 1.15 + 5.0 * dnNoise(vec2(s * 0.016, sgn * 4.0));
        float fq = fract(fold / 6.2832 + 0.25), fd = min(fq, 1.0 - fq), fa = fwidth(fold) / 6.2832 + 1e-4;
        float lw = max(0.011, 0.9 * fa), keep = 1.0 - smoothstep(0.10, 0.22, fa);
        float crease = (1.0 - smoothstep(lw, lw + fa, fd)) * on * keep;
        float crestL = (1.0 - smoothstep(0.7 * lw, 0.7 * lw + fa, 0.5 - fd)) * on * keep;
        float f2 = s * 0.66 + sgn * vTh * 2.3 + 6.0 * dnNoise(vec2(s * 0.031 + 11.0, sgn * 2.0));
        float id2 = floor(f2 / 6.2832 + 0.5), fd2 = abs(f2 / 6.2832 - id2), fa2 = fwidth(f2) / 6.2832 + 1e-4;
        float h2 = dnHash(vec2(id2 * 3.7 + 1.3, sgn * 5.0 + 2.0)), t0 = 0.5 + 2.4 * dnHash(vec2(id2 * 1.9 + 7.0, 4.0));
        float small = (1.0 - smoothstep(0.7 * fa2, 1.7 * fa2, fd2)) * step(0.22, h2) * smoothstep(t0, t0 + 0.15, vTh) * (1.0 - smoothstep(t0 + 1.7, t0 + 2.0, vTh))
          * (1.0 - smoothstep(0.08, 0.2, fa2));
        float fg = fwidth(g2) + 1e-4;
        float tuck = (1.0 - smoothstep(fg, 2.2 * fg, g2)) * smoothstep(0.5, 1.2, vTh) * (1.0 - smoothstep(0.05, 0.12, fg));
        vec3 cLine = mix(cIndigo, cFade, 0.18);
        colB = mix(colB, mix(cEcru, vec3(1.0), 0.45), crestL);
        colB = mix(colB, mix(cLine, cFade, 0.2), small);
        colB = mix(colB, cLine, max(crease, tuck));
        float hem = 1.0 - smoothstep(6.4 - ta, 6.4 + ta, tt);
        float hemLine = (1.0 - smoothstep(0.35, 0.35 + ta, abs(tt - 6.4))) * (1.0 - smoothstep(0.4, 1.2, ta));
        float tape = 1.0 - smoothstep(1.7 - ta, 1.7 + ta, tt);
        colB = mix(colB, wearRamp(0.33), hem);
        colB = mix(colB, wearRamp(0.74), hemLine);          // the hem's folded edge, rubbed
        colB = mix(colB, cRaw, tape);
        gl_FragColor = vec4(mix(colF, colB, back), 1.0); }`,
  });
  const flank = new THREE.Mesh(flankGeo, flankMat); flank.frustumCulled = false; flank.name = 'flanks'; root.add(flank);
  await ctx.yield();

  // ---- the felled seam beside the zip, as geometry riding the flank: a raised ridge 8 m wide and 2 m high on the
  // ---- face of the cloth, two rows of separate two-ply dashes on its crown and one row on the turned hem's back --
  {
    const XR = [[6.2, 0.04, 0.10], [7.0, 1.55, 0.72], [8.3, 2.0, 0.93], [10.2, 1.8, 0.74], [12.1, 2.0, 0.93], [13.4, 1.55, 0.72], [14.2, 0.04, 0.06]];
    const NR = Math.round(300 * detail), rp = [], ruv = [], rh = [], rw = [], rix = [];
    for (let f = 0; f < 2; f++) for (let i = 0; i <= NR; i++) {
      const fi = i / NR, sv = fi < 0.12 ? lerp(Z0, 120, fi / 0.12) : lerp(120, Z1 + 20, (fi - 0.12) / 0.88), sgn = f === 0 ? 1 : -1;
      for (let c = 0; c < XR.length; c++) {
        const k = rp.length / 3, wobT = 0.5 * Math.sin(sv * 0.031 + sgn) + 0.25 * Math.sin(sv * 0.117);
        rp.push(sgn, sv, XR[c][0] - wobT); ruv.push(XR[c][0] + f * 40, sv); rh.push(XR[c][1]); rw.push(clamp(XR[c][2] + wash * 0.6, 0.02, 1));
        if (i < NR && c < XR.length - 1) { if (sgn > 0) rix.push(k, k + XR.length, k + 1, k + 1, k + XR.length, k + XR.length + 1); else rix.push(k, k + 1, k + XR.length, k + 1, k + XR.length + 1, k + XR.length); }
      }
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
    rg.setAttribute('aH', new THREE.Float32BufferAttribute(rh, 1)); rg.setAttribute('aWear', new THREE.Float32BufferAttribute(rw, 1)); rg.setIndex(rix);
    rg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 900);
    const rm = new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms(), uBillow: { value: opts.billow ?? 1.5 } }, side: THREE.DoubleSide,
      vertexShader: style.glsl.common + GLSL_ROLL + /* glsl */`
        attribute float aWear; attribute float aH; varying vec2 vUv; varying float vWear;
        void main(){ vec3 n; float th; vec3 p = flankPos(position.x, position.y, position.z, n, th);
          p += n * (aH + 0.12); vUv = uv; vWear = aWear;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
      fragmentShader: style.glsl.common + style.glsl.denimFrag + /* glsl */`
        varying vec2 vUv; varying float vWear;
        void main(){ gl_FragColor = vec4(denimColor(vUv, vWear, true), 1.0); }`,
    });
    const ridge = new THREE.Mesh(rg, rm); ridge.frustumCulled = false; ridge.name = 'zip-seam'; root.add(ridge);
    await ctx.yield();
    // the dashes: 7 m cords with a 3 m gap; the hand wanders half a metre and skips one in forty
    const dg = (() => { const nu = 5, nv = 3, len = 7, pos = [], uvs = [], idx = [];
      for (let i = 0; i <= nu; i++) { const sx = i / nu, z = (sx - 0.5) * len, e = Math.min(sx, 1 - sx) * len, dive = 1 - smoothstep(0, 0.9, e);
        for (let j = 0; j <= nv; j++) { const an = (j / nv) * Math.PI; pos.push(-Math.cos(an) * 0.5, Math.sin(an) * 0.5 - dive * 0.75 - 0.05, z); uvs.push(sx * len, j / nv); } }
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const k = i * (nv + 1) + j, k2 = k + nv + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); return g; })();
    const ist = [], sr = rng.fork ? rng.fork('zip-stitch') : rng;
    for (let f = 0; f < 2; f++) for (const [t0, face, lift, off] of [[8.3, 1, 2.0, 0], [12.1, 1, 2.0, 5], [4.1, -1, 0.0, 2.5]]) {
      for (let sv = -330 + off; sv < Z1 + 12; sv += 10) {
        if (sr() < 0.025) continue;
        const sgn = f === 0 ? 1 : -1, wobT = 0.5 * Math.sin(sv * 0.031 + sgn) + 0.25 * Math.sin(sv * 0.117);
        ist.push(sgn, sv, t0 - wobT + 0.5 * noise.n2(sv * 0.03, t0 + f * 9.1), face * (1 + lift));
      }
    }
    dg.setAttribute('aST', new THREE.InstancedBufferAttribute(new Float32Array(ist), 4)); dg.instanceCount = ist.length / 4;
    dg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 900);
    const dm = new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms(), uBillow: { value: opts.billow ?? 1.5 }, cA: { value: P.orange }, cB: { value: P.orangeDark } }, side: THREE.DoubleSide,
      vertexShader: style.glsl.common + GLSL_ROLL + /* glsl */`
        attribute vec4 aST; varying vec2 vUv;
        void main(){ vec3 n; float th; float face = sign(aST.w), lift = abs(aST.w) - 1.0;
          vec3 org = flankPos(aST.x, aST.y, aST.z, n, th);
          float wide = max(1.0, distance(org, cameraPosition) * 0.0045);        // a dash stays a line of orange far off
          vec3 p = flankPos(aST.x, aST.y + position.z, aST.z + position.x * wide, n, th);
          p += n * face * (lift + position.y + 0.1); vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 cA, cB; varying vec2 vUv;
        void main(){ float t = vUv.x / 0.9 + vUv.y * 0.9; float fw = fwidth(t);
          float ply = smoothstep(0.72 - fw, 0.72 + fw, abs(fract(t) - 0.5) * 2.0) * (1.0 - smoothstep(0.15, 0.35, fw));
          gl_FragColor = vec4(mix(cA, cB, ply), 1.0); }`,
    });
    const dashes = new THREE.Mesh(dg, dm); dashes.frustumCulled = false; dashes.name = 'zip-stitches'; root.add(dashes);
  }
  await ctx.yield();

  // ---- the red plain under it -----------------------------------------------------------------------------------
  const cottonMat = style.cotton();
  const plain = new THREE.Mesh(new THREE.PlaneGeometry(2 * (STRIP + EDGE0 - 3), Z1 - Z0 + 16).rotateX(-Math.PI / 2), cottonMat);
  plain.position.set(0, 0, (Z0 + Z1) / 2 + 10); plain.name = 'red-plain'; root.add(plain);
  await ctx.yield();

  // ---- the two tapes: dark indigo ribbons that carry the teeth; closed they lie on the floor under the chain, ---
  // ---- parted they lie on the red at the foot of each breaker --------------------------------------------------
  const GLSL_TAPE = /* glsl */`
    // x of the tape centre and y of its top at course position z
    vec2 tapeAt(float z){ float w = zipOpen(z); float c = zipTape(w); return vec2(c, mix(${(FLOOR + 0.2).toFixed(1)}, 0.4, smoothstep(2.75, 13.0, c))); }`;
  {
    const n = 200, tp = [], tuv = [], twr = [], tix = [], across = [-3.2, 0, 3.4, 7.5];
    for (let f = 0; f < 2; f++) for (let i = 0; i <= n; i++) {
      const z = lerp(Z0, Z1 + 20, i / n);
      for (let j = 0; j < 4; j++) {
        const k = tp.length / 3; tp.push(f === 0 ? 1 : -1, z, across[j]); tuv.push(across[j] * 4 + f * 9, z * 0.5); twr.push(j === 0 ? 0.42 : j === 3 ? 0.05 : 0.16);
        if (i < n && j < 3) { if (f === 0) tix.push(k, k + 4, k + 1, k + 1, k + 4, k + 5); else tix.push(k, k + 1, k + 4, k + 1, k + 5, k + 4); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2));
    g.setAttribute('aWear', new THREE.Float32BufferAttribute(twr, 1)); g.setIndex(tix);
    // REPAIR 3 (the red behind the slider): where the valley has opened the parted tape is a woven ribbon of the lining's own turkey red
    // (the brief: 'blue rolling away from the bright red cotton underneath'; its palette's #C2372D): ribs across it and a selvedge at each
    // edge in the deeper red, so the teeth lie on red. Ahead of the slider, where the chain is still closed, it stays the dark indigo ribbon
    // it was; the change happens inside the casting, where the two tapes part
    const m = new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms(), cRed: { value: P.red }, cDeep: { value: P.redDeep } }, side: THREE.DoubleSide,
      vertexShader: style.glsl.common + GLSL_TAPE + /* glsl */`
        attribute float aWear; varying vec2 vUv; varying float vWear; varying vec3 vT;
        void main(){ vec2 c = tapeAt(position.y); vUv = uv; vWear = aWear; vT = vec3(position.z, position.y, smoothstep(3.1, 4.6, c.x));
          float ripple = 0.25 * sin(position.y * 0.5 + uTime * 2.0) * smoothstep(3.0, 14.0, c.x) * step(1.0, position.z);
          vec3 p = vec3(position.x * (c.x + position.z), c.y + ripple - 0.012 * position.z, position.y);
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
      fragmentShader: style.glsl.common + style.glsl.denimFrag + /* glsl */`
        uniform vec3 cRed, cDeep; varying vec2 vUv; varying float vWear; varying vec3 vT;
        void main(){ vec3 den = denimColor(vUv, vWear, true);
          float q = vT.y / 1.5, fq = fwidth(q) + 1e-4, fa = fwidth(vT.x) + 1e-4;
          float rib = (1.0 - smoothstep(0.16 - fq, 0.16 + fq, abs(fract(q) - 0.5))) * (1.0 - smoothstep(0.2, 0.5, fq));
          float selv = max(1.0 - smoothstep(-2.5 - fa, -2.5 + fa, vT.x), smoothstep(6.7 - fa, 6.7 + fa, vT.x));
          gl_FragColor = vec4(mix(den, mix(cRed, cDeep, max(selv, 0.7 * rib)), vT.z), 1.0); }`,
    });
    const tape = new THREE.Mesh(g, m); tape.frustumCulled = false; tape.name = 'tapes'; root.add(tape);
  }
  await ctx.yield();

  // ---- teeth: 268 brass blocks, meshed ahead of the slider, parted behind it, each rocking a quarter turn -------
  let toothHull = null;
  const toothGeo = (() => {
    const half = [[1.5, 2.7], [-1.2, 2.7], [-1.8, 1.7], [-3.6, 1.7], [-4.2, 2.5], [-5.6, 2.5], [-6.25, 1.5]];
    const prof = [...half, [-6.5, 0], ...half.slice().reverse().map(([x, z]) => [x, -z])];
    const boss = []; for (let i = 0; i < 6; i++) boss.push([-4.95 + Math.cos(i * Math.PI / 3) * 1.35, Math.sin(i * Math.PI / 3) * 1.35]);
    toothHull = style.slab(prof, 0, 3.05, 0.06);            // POLISH 2: the plain block the tooth's drawn edge is made from
    return mergeGeometries([style.slab(prof, 0, 3, 0.4), style.slab(boss, 2.9, 3.7, 0.3)]);
  })();
  const teethMat = style.metal('brass', {
    uniforms: style.clothUniforms(),
    vertexShader: style.glsl.common + GLSL_TAPE + /* glsl */`
      attribute float aEdge; attribute vec2 aZS; varying float vEdge; varying vec3 vN;
      void main(){ vEdge = aEdge; float z = aZS.x, sgn = aZS.y;
        vec2 c = tapeAt(z); float d = uSliderZ + 15.0 - z;
        float e = max(d - 60.0, 0.0);
        float phi = 1.5708 * smoothstep(64.0, 116.0, d) + 0.5 * sin(e * 0.16) * exp(-e * 0.03) + 0.05 * sin(uTime * 1.1 + z) * step(64.0, d);
        float cs = cos(phi), sn = sin(phi);
        vec2 l = vec2(position.x - 1.5, position.y);                       // rock about the root's outer foot
        vec3 p = vec3(1.5 + l.x * cs + l.y * sn, -l.x * sn + l.y * cs, position.z);
        vec3 n = vec3(normal.x * cs + normal.y * sn, -normal.x * sn + normal.y * cs, normal.z);
        p.x = (p.x + c.x) * sgn; p.y += c.y + 0.1; p.z += z; n.x *= sgn;
        vN = mat3(modelMatrix) * n;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
  });
  teethMat.side = THREE.DoubleSide;
  const zs = [];
  const zTeethEnd = Math.min(Z1 - 14, zLast + 47);      // the chain ends under the bottom stop
  for (let f = 0; f < 2; f++) for (let z = Z0 + 9 + f * 6; z < zTeethEnd; z += 12) zs.push(z, f === 0 ? 1 : -1);
  toothGeo.setAttribute('aZS', new THREE.InstancedBufferAttribute(new Float32Array(zs), 2));
  const teeth = new THREE.InstancedMesh(toothGeo, teethMat, zs.length / 2);
  teeth.frustumCulled = false; teeth.name = 'teeth'; root.add(teeth);
  await ctx.yield();
  { // POLISH 2: every tooth drawn with the casting's dark edge (the hull seen from behind; the mirrored row is wound the other way)
    const og = style.outlineGeometry(toothHull), cLine = style.outline().uniforms.cLine;
    for (const sg of [1, -1]) {
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', og.attributes.position); g.setAttribute('aOut', og.attributes.aOut); g.setIndex(og.index);
      const sel = []; for (let i = 0; i < zs.length; i += 2) if (zs[i + 1] === sg) sel.push(zs[i], sg);
      g.setAttribute('aZS', new THREE.InstancedBufferAttribute(new Float32Array(sel), 2)); g.instanceCount = sel.length / 2;
      const m = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), cLine }, side: sg > 0 ? THREE.BackSide : THREE.FrontSide,
        vertexShader: style.glsl.common + GLSL_TAPE + /* glsl */`
          attribute vec3 aOut; attribute vec2 aZS;
          void main(){ float z = aZS.x, sgn = aZS.y;
            vec2 c = tapeAt(z); float d = uSliderZ + 15.0 - z;
            float e = max(d - 60.0, 0.0);
            float phi = 1.5708 * smoothstep(64.0, 116.0, d) + 0.5 * sin(e * 0.16) * exp(-e * 0.03) + 0.05 * sin(uTime * 1.1 + z) * step(64.0, d);
            float cs = cos(phi), sn = sin(phi);
            vec2 l = vec2(position.x - 1.5, position.y);
            vec3 p = vec3(1.5 + l.x * cs + l.y * sn, -l.x * sn + l.y * cs, position.z);
            vec3 n = vec3(aOut.x * cs + aOut.y * sn, -aOut.x * sn + aOut.y * cs, aOut.z);
            p.x = (p.x + c.x) * sgn; p.y += c.y + 0.1; p.z += z; n.x *= sgn;
            vec4 wp = modelMatrix * vec4(p, 1.0);
            wp.xyz += n / max(length(n), 1e-4) * clamp(distance(wp.xyz, cameraPosition) * 0.0034, 0.16, 1.5);
            gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`uniform vec3 cLine; void main(){ gl_FragColor = vec4(cLine, 1.0); }`,
      });
      const tl = new THREE.Mesh(g, m); tl.frustumCulled = false; tl.name = 'teeth-line'; root.add(tl);
    } }
  await ctx.yield();

  // ---- the slider: a brass casting 70 m wide, 90 m long, 62 m to the top of its bridge --------------------------
  const chaikin = (pts, it = 2) => { let p = pts; for (let k = 0; k < it; k++) { const q = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } p = q; } return p; };
  const mirror = (half) => [...half, ...half.slice().reverse().filter((p) => Math.abs(p[0]) > 1e-6).map(([x, z]) => [-x, z])];
  const bodyW = 1 + rng.range(-0.06, 0.06), noseL = rng.range(-3, 3);            // every seed casts its own slider
  // plan of the plates, x >= 0 half, from the nose (z +45, leading down the course) back to the notched rear
  const plateHalf = [[0, 45 + noseL], [7, 44.5 + noseL], [13, 40], [15.5, 30], [16, 12], [20, -4], [29, -20], [34.5, -33], [35, -41], [32, -45], [15, -45], [9, -40], [0, -35]]
    .map(([x, z]) => [x * bodyW, z]);
  const plate = chaikin(mirror(plateHalf), 2);
  const sl = [];
  sl.push(style.slab(plate, 9.5, 22, 1.5));                                        // top plate: a thick casting
  sl.push(style.slab(plate.map(([x, z]) => [x * 0.5, z * 0.8 - 3]), 21.5, 29, 1.3)); // its crown
  sl.push(style.slab(plate, 21.6, 23.4, 0.7, { holes: [plate.map(([x, z]) => [x * 0.9, z * 0.93 - 0.5])] }));   // POLISH 2: a raised rim round the top plate
  sl.push(style.slab(plate.map(([x, z]) => [x * 0.97, z * 0.985]), 0.4, 3.3, 0.8)); // bottom plate (under the cloth)
  await ctx.yield();
  for (const sx of [1, -1]) {                                                      // side flanges hanging from the top plate
    const outer = [[16, 14], [19.5, -3], [28.5, -19.5], [34, -33], [34.6, -43.5]].map(([x, z]) => [x * bodyW * sx, z]);
    const inner = outer.slice().reverse().map(([x, z]) => [x - 3.6 * sx, z]);
    sl.push(style.slab([...outer, ...inner], 5.6, 9.8, 0.7));
    const boss = []; for (let i = 0; i < 10; i++) boss.push([sx * 25.5 * bodyW + Math.cos(i * 0.628) * 3.6, -33 + Math.sin(i * 0.628) * 3.6]);
    sl.push(style.slab(boss, 21.6, 23.8, 0.9));                                    // a stamped stud on each shoulder
    const ring = []; for (let i = 0; i < 14; i++) ring.push([sx * 25.5 * bodyW + Math.cos(i * 0.449) * 6.2, -33 + Math.sin(i * 0.449) * 6.2]);
    sl.push(style.slab(ring, 21.6, 22.6, 0.6, { holes: [ring.map(([x, z]) => [sx * 25.5 * bodyW + (x - sx * 25.5 * bodyW) * 0.76, -33 + (z + 33) * 0.76])] }));
    await ctx.yield();
  }
  sl.push(style.slab(chaikin([[0, 14], [4.5, 6], [8.5, -14], [8, -32], [0, -37], [-8, -32], [-8.5, -14], [-4.5, 6]], 1), 3.2, 9.8, 0.6)); // the diamond that parts the teeth
  await ctx.yield();
  // the bridge: a hoop standing on the top plate whose arm overhangs the rear and carries the tab. profile (z, y)
  const br = chaikin([[0, 26], [-4, 40], [-12, 52], [-25, 60], [-42, 62.5], [-53, 61], [-62, 58.5], [-64.5, 55], [-62, 52], [-53, 52.5], [-47.5, 50], [-45.5, 40], [-45, 26]], 2);
  const brHole = chaikin([[-13, 32], [-14.5, 40], [-20.5, 48], [-29, 52], [-36.5, 50], [-37.5, 32]], 2);
  sl.push(style.slab(chaikin([[8, 28], [9, 12], [6, 2], [-6, 2], [-9, 12], [-8, 28]], 2), 28.5, 31, 1.0));   // a raised cartouche on the crown's nose
  const toXYZ = new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1);
  sl.push(style.slab(br, -10, 10, 1.6, { holes: [brHole] }).applyMatrix4(toXYZ));
  await ctx.yield();
  const sliderGeo = mergeGeometries(sl); sl.forEach((g) => g.dispose());
  const brassMat = style.metal('brass');
  const slider = new THREE.Group(); slider.name = 'slider';
  const sliderBody = new THREE.Mesh(sliderGeo, brassMat); slider.add(sliderBody); root.add(slider);
  await ctx.yield();

  // the pull tab: hangs from the arm's tip like a bell. profile (x, y) about the pivot, y down
  const PIVOT = new THREE.Vector3(0, 56.5, -57);
  const tabHalf = [[0, 7.5], [12, 7.5], [16, 4], [16, -6], [12, -11], [7, -17], [7, -26], [12.5, -36], [15, -45], [14, -49.5], [9, -52], [0, -52]];
  const tabProf = chaikin(mirror(tabHalf), 2).map(([x, y]) => [x, -y]);
  const eye = chaikin([[11.5, 3], [11.5, -6.2], [-11.5, -6.2], [-11.5, 3]], 2).map(([x, y]) => [x, -y]);
  const slot = chaikin([[5, -35.5], [5, -46], [-5, -46], [-5, -35.5]], 2).map(([x, y]) => [x, -y]);
  const tabGeo = style.slab(tabProf, -2, 2, 1.2, { holes: [eye, slot] }).rotateX(Math.PI / 2);
  const tab = new THREE.Mesh(tabGeo, brassMat); tab.position.copy(PIVOT); tab.name = 'pull-tab'; slider.add(tab);
  await ctx.yield();
  { const lm = style.outline();                               // POLISH 2: the casting's drawn edge
    const a = new THREE.Mesh(style.outlineGeometry(sliderGeo), lm); a.name = 'slider-line'; a.frustumCulled = false; slider.add(a);
    await ctx.yield();
    const b = new THREE.Mesh(style.outlineGeometry(tabGeo), lm); b.name = 'tab-line'; b.frustumCulled = false; tab.add(b); }
  await ctx.yield();

  // the bottom stop: a brass staple clamped over the chain at the foot of the valley
  const stopGeo = mergeGeometries([
    style.slab(chaikin([[15, 0], [15, 16], [-15, 16], [-15, 0]], 2), 3.6, 10.5, 1.0),
    style.slab(chaikin([[19, 3], [19, 13], [-19, 13], [-19, 3]], 1), 3.2, 6.2, 0.7)]);
  const stop = new THREE.Mesh(stopGeo, brassMat); stop.position.set(0, 0, zLast + 45.5 + 3); stop.name = 'bottom-stop'; root.add(stop);
  { const sl2 = new THREE.Mesh(style.outlineGeometry(stopGeo), style.outline()); sl2.name = 'stop-line'; sl2.frustumCulled = false; stop.add(sl2); }
  await ctx.yield();

  // ---- torn-loose ends: short white threads that snap off the tape edge at the slider's rear mouths and whirl up
  {
    const n = Math.round(140 * detail), tp = [], ts = [], ti = [], tr = rng.fork ? rng.fork('torn') : rng;
    for (let i = 0; i < n; i++) {
      const ph = tr(), sd = tr() < 0.5 ? -1 : 1, r1 = tr(), r2 = tr();
      for (let j = 0; j <= 3; j++) for (const a of [-1, 1]) { tp.push(j / 3, a, 0); ts.push(ph, sd, r1, r2); }
      const b = i * 8; for (let j = 0; j < 3; j++) ti.push(b + j * 2, b + j * 2 + 1, b + j * 2 + 2, b + j * 2 + 1, b + j * 2 + 3, b + j * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(ts, 4)); g.setIndex(ti);
    const m = new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms(), cA: { value: P.white }, uRun: { value: 1 }, uAmt: { value: 1 } }, side: THREE.DoubleSide,
      vertexShader: style.glsl.common + /* glsl */`
        attribute vec4 aSeed; uniform float uRun; uniform float uAmt;
        void main(){ float life = fract(uTime * (0.55 + 0.35 * aSeed.z) + aSeed.x);
          float up = 1.0 - (1.0 - life) * (1.0 - life);
          // REPAIR 3: they were hairlines born against the casting's rear face and read as scratches across the brass. They are threads
          // (the brief: 'short white threads snap free of the tape edge and whirl up for a second'): born at the parted tape's outer edge
          // just behind the casting, outboard of its plates, they whirl up and out over the young rolls BESIDE the metal, with a thread's body
          vec3 o = vec3(aSeed.y * (36.0 + 10.0 * aSeed.w), 4.0 + up * (5.0 + 9.0 * aSeed.z), uSliderZ - 51.0 - life * (10.0 + 26.0 * aSeed.w) * uRun);
          float ang = life * (7.0 + 9.0 * aSeed.w) + aSeed.x * 40.0, len = 2.6 + 3.0 * aSeed.z;
          vec3 dir = vec3(cos(ang) * 0.8, sin(ang * 0.7) * 0.6 + 0.3, sin(ang) * 0.8);
          o.x += aSeed.y * (up * (7.0 + 8.0 * aSeed.z) + (1.0 + sin(ang * 0.6)) * 1.5 * life); o.z += cos(ang * 0.5) * 2.0 * life;
          float t = position.x; vec3 p = o + dir * (t - 0.5) * len + vec3(0.0, sin(t * 3.14159) * 1.1 * sin(ang * 1.3), 0.0);
          vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
          float wd = max(0.17, -mv.z * 0.0016) * smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.75, 1.0, life)) * step(aSeed.z, uAmt);   // as many at once as before, each one a thread
          vec3 vd = mat3(viewMatrix) * dir; vec2 sdir = vec2(-vd.y, vd.x); sdir = sdir / max(length(sdir), 1e-4);
          mv.xy += sdir * position.y * wd;
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform vec3 cA; void main(){ gl_FragColor = vec4(cA, 1.0); }`,
    });
    const torn = new THREE.Mesh(g, m); torn.frustumCulled = false; torn.name = 'torn-ends'; root.add(torn); root.userData.tornMat = m;
  }
  if (opts.sky) root.add(style.sky());
  await ctx.yield();

  // ---- driving it -----------------------------------------------------------------------------------------------
  let progress = -1, zNow = zFirst, zPrev = zNow, vel = 7, th = 0, om = 0;
  const openingAt = (z, sz = zNow) => {                      // JS twins of zipOpen / zipRoll / zipTape
    const d = Math.max(sz + 15 - z, 0), w = Math.min(0.3 * d * smoothstep(0, 20, d) + 12 * smoothstep(0, 55, d), 150);
    const R = 1.2 + 1.3 * smoothstep(8, 24, w) + 7 * smoothstep(29, 40, w) + 2.6 * smoothstep(31, 44, w) * (1 - smoothstep(58, 80, w)) + 8 * smoothstep(45, 150, w);   // nominal; it swells to 1.22 R between gathers
    const wide = lerp(0.85, 1.3, smoothstep(45, 100, w));
    return { w, edge: w + EDGE0, roll: R, rollTop: FLOOR + 2.2 * 1.22 * R * lerp(1, 0.6, smoothstep(45, 100, w)), tape: Math.max(2.75, w - 3.5 - 1.25 * wide * R) };
  };
  const setSliderZ = (z) => { zNow = clamp(z, Z0 + 100, Z1); };
  // REPAIR 3: THE TAB is a pendulum pushed by the slider's own acceleration (it lags when the slider runs, rings against the casting when it
  // stops). Its swing is worked out once, here, from journey second 0 to the last from the law itself, so the angle at any moment of the
  // journey is a function of the journey alone: the film, a held frame and a viewer who enters with the clock at any reading see the same.
  // Before, a jump in the journey set it 'at rest at its balance'. It starts hanging plumb and at rest (no typed first angle).
  const TAB_HZ = 60, tabN = Math.ceil(duration * TAB_HZ) + 2, tabTh = new Float32Array(tabN);
  { let a = 0, w = 0; const hj = 1 / TAB_HZ;
    for (let i = 0; i < tabN; i++) { tabTh[i] = a; const tt = i * hj;
      const acc = clamp((zAt(tt + 0.3) - 2 * zAt(tt) + zAt(tt - 0.3)) / 0.09, -70, 70);
      w += (acc * Math.cos(a) / 50 - 0.62 * Math.sin(a) - 0.22 * w) * hj; a += w * hj;
      if (a < -0.15) { a = -0.15; w = Math.abs(w) * 0.55; }                       // it strikes the casting and rebounds
      if (a > 1.25) { a = 1.25; w = -Math.abs(w) * 0.3; } } }
  const tabAt = (tj) => { const f = clamp(tj, 0, duration) * TAB_HZ, i = Math.min(tabN - 2, Math.floor(f)); return lerp(tabTh[i], tabTh[i + 1], f - i); };
  // and on the breeze it is never quite still (the brief: 'the pull tab swinging from it like a bell'): a slow idle swing on the clock, small
  // enough to read the same at any phase, its start phase from a stream of its own
  const tabRng = ctx.core.makeRng(ctx.core.hashSeed('zip-tab-idle:' + ctx.seed)), tabPh = tabRng() * 6.2832;
  function update(dt, time, camera) {
    if (!opts.style) style.update(dt, time, camera);
    if (progress >= 0) setSliderZ(zAt(progress * duration));
    else if (opts.demo !== false && progress === -1) setSliderZ(zAt(time % duration));   // nobody drives it: play the law on the clock
    U.uSliderZ.value = zNow; slider.position.z = zNow;
    // torn ends fly while teeth are parting: most when the slider runs, none once it stands (from the law, so a held frame shows them too)
    const tj = progress >= 0 ? progress * duration : (time % duration);
    const spd = progress === -2 ? 7 : (zAt(tj + 0.15) - zAt(tj - 0.15)) / 0.3;
    root.userData.tornMat.uniforms.uAmt.value = clamp(spd / 9, 0, 1.2); root.userData.tornMat.uniforms.uRun.value = clamp(spd / 7, 0.3, 2.5);
    const idle = 0.07 * Math.sin(time * 0.79 + tabPh) + 0.02 * Math.sin(time * 1.9 + 2.0 * tabPh);
    if (progress === -2) {                                   // placed by hand (no law): the pendulum takes the acceleration it measures
      const h = clamp(dt, 0, 0.1);
      if (h > 1e-4) {
        const v = clamp((zNow - zPrev) / h, -60, 60), acc = clamp((v - vel) / h, -70, 70); vel = v; zPrev = zNow;
        const n = Math.max(1, Math.ceil(h / 0.017)), hs = h / n;
        for (let i = 0; i < n; i++) {
          om += (acc * Math.cos(th) / 50 - 0.62 * Math.sin(th) - 0.22 * om) * hs; th += om * hs;
          if (th < -0.15) { th = -0.15; om = Math.abs(om) * 0.55; }
          if (th > 1.25) { th = 1.25; om = -Math.abs(om) * 0.3; }
        }
      }
      tab.rotation.x = clamp(th + idle, -0.15, 1.25);
    } else tab.rotation.x = clamp(tabAt(tj) + idle, -0.15, 1.25);
  }

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const zStop = zLast;
  const anchors = {
    zipFrom: V(0, FLOOR, Z0), zipTo: V(0, FLOOR, Z1),
    sliderStart: V(0, 0, zFirst), sliderStop: V(0, 0, zStop), bottomStop: V(0, 7, zStop + 56),
    // the journey of the brief around this piece (seconds are journey time; see SCHEDULE for the slider)
    flyThrough: [V(-210, 70, 0), V(-166, 70, 71), V(-100, 68, 176), V(-35, 9, 250), V(-22, 9, 330), V(-26, 10, 390), V(-50, 16, 425),
      V(-75, 17, 470), V(-75, 18, 548), V(-40, 17, 600), V(0, 17, 660), V(-30, 20, 690), V(-62, 24, 742), V(-58, 32, 810)],
    viewpoints: [
      { position: V(-210, 70, 0), target: V(0, 20, 330), note: 'entry: slider on the axis, red wedge behind it' },
      { position: V(-22, 9, 340), target: V(0, 22, 470), note: '21 s (slider near z 477): up the V, teeth 25 m left, breakers both sides' },
      { position: V(-75, 17, 500), target: V(0, 30, 520), note: '26 s (slider near z 517): the brass wall and the tab' },
      { position: V(0, 17, 610), target: V(0, 20, 700), note: '31 s (slider near z 690): the valley parting under the lens' },
      { position: V(-62, 24, 742), target: V(0, 30, 740), note: '36 s: the stopped slider, tab ringing' },
    ],
    portalSeat: { position: V(-40, 52, 905), normal: V(0, -0.31, -0.95).normalize(), radius: 7, note: 'suggestion only: the buttonhole belongs to the waistband the world builds' },
    tabPivot: PIVOT.clone(),            // slider-local; add (0, 0, hero.sliderZ)
    sliderHalfWidth: 35, sliderHalfLength: 45, sliderTop: 63,
    right: V(-1, 0, 0),
  };
  return {
    object: root, radius: 130, height: 63, center: V(0, 26, 400), anchors, style,
    parts: { flank, plain, teeth, slider, tab, stop },
    get sliderZ() { return zNow; },
    sliderZAt: (seconds) => zAt(seconds),                    // where the slider stands at journey second t
    openingAt,                                               // (z[, sliderZ]) -> { w, edge, roll, rollTop, tape } metres
    setProgress(u) { progress = clamp(u, 0, 1); },           // u = journey fraction (duration opts.duration, 44 s)
    setSliderZ(z) { progress = -2; setSliderZ(z); },         // or place the slider yourself
    update, dispose() {},
    ground: false, groundY: 0,
  };
}
