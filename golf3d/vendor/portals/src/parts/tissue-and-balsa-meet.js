// The Evening Meet: hero set piece "the thermal" and the stick-and-tissue STYLE KIT for the whole world.
//
// HOW THE STYLE IS MADE (two materials and no third, no lights, no normal attribute is read, no fog, post.flat = 1):
//   1. BALSA  balsaMaterial(): opaque, depth-written honey strip. Geometry is "sticks": a centre line plus an
//      aSide offset per vertex, so the vertex shader can keep a stick at least ~1.5 px wide at any distance;
//      a stick that would have to be widened a lot is instead mixed into the dome colour behind it ("ribs go
//      first"). Honey when you look down on it, umber when the sky is behind it (view ray pointing up).
//      A hill is LINED: an opaque paper sheet LINE_UNDER (0.3 m) below its top chords (Sticks.plate with kind 4 + shade,
//      shade 0..0.99 worked once at the build from the slope's angle to the sun; kind 6 + shade is bare sheet balsa),
//      drawn by this material from a dim cool paper (shaded) to a warm balsa sheet (lit), brighter where the eye looks
//      toward the sun. So a hill is a solid thing with a lit and a shaded side, its ribs lie on the lining under the
//      skin, and nothing behind a hill is seen through it. liningShade(dhdx, dhdz, sun) gives the shade. A hill's own
//      sticks are drawn with { soft: true }: alpha-blended over the lining, a stick widened k times at 1/k of its strength.
//   2. TISSUE tissueMaterial(): drawn after all balsa. Slack (creases, sag, corners), doubled seams, rib scallops and
//      glue blobs are drawn in this shader from a per-bay uv. Two ways of laying it on the picture:
//      WITH A BODY ({ body: 1 }; every made thing: models, the airship, trees, grass, hills, the ground): the paper
//      shows its own colour, lit (by the sky of the direction beyond it and the hour's hot, or with { lit: 1 } from
//      above, for a paper laid under the sky), and hides what is behind it: nothing made here is see-through. The frame
//      under it is drawn in the skin as each bay line's shadow ({ rib }); it writes depth, so one paper hides another
//      rightly; distance mixes its colour toward the dome's (half way at STYLE.fadeHalf = 450 m, less with { far }).
//      A hill's paper carries its shade in its colour, corner by corner (Skins.quad's cols, shadeTint()). { marks }: how
//      strongly a paper carries its scallops, seams and glue blobs (the land's papers faintly). { tunnel: n }: the
//      inside of a hull of n rings is lit by place: bright by its openings (the stern's mouth, the nose and, with
//      { bare: [a, b] }, either end of a stretch left bare) and dim between them, each ring former's shadow on the paper.
//      { form: f }: a paper standing in the low sun takes its side at strength f, warm where a face is turned to the sun, cooler
//      and darker where it is turned away; the face's own normal is taken from the derivative of its place (no normal attribute).
//      WITHOUT (the far ranges): multiply blending (dst * src), no depth write: it writes its pigment and
//      the framebuffer does the rest; distance mixes the pigment toward 1 so far skins vanish into the dome.
//      { sub: n } draws n riblets a bay, seen only close to; { deepen } a fuller pigment.
//   3. SCATTER tissueMaterial({ scatter: true }): the same geometry drawn again, additive: pigment times a wide
//      lobe round the sun (0.5 at the blur, 0 beyond 55 degrees). This is what makes sunward wings burn (the models and
//      the hill's unfinished sheet carry it, with the lift of their own paper; the airship's hull does not).
//   4. MIST   mistMaterial(): soft additive-free quads (normal blend toward the dome colour) riding a front.
//   5. SHADE  shadeMaterial(): the hour's long shadows, flat quads on the level ground, a multiply over the ground's papers.
//   The dome colour everything fades to is tbDome(dir) in STYLE_GLSL (under the horizon it is the hour's earth, the
//   uniform uEarth, which the world sets); domeMaterial() draws the dome (no line; the evening's cloud painted on it).
//
// EXPORTS (shade the whole world with these; never a second routine):
//   buildHero(ctx, opts)    the thermal, the unfinished hill and the airship frame. It makes the visit's own uniform
//                    set and returns hero.style = { fadeHalf, uniforms, balsa(o), lining(), tissue(o), mist(o), shade(),
//                    dome(), flock(list, type, rng, o) }: the materials and the model flocks bound to that set. The
//                    world makes every one of its materials through hero.style (no module variable holds a visit).
//   balsaMaterial(U, o), liningMaterial(U), tissueMaterial(U, o), mistMaterial(U, o), shadeMaterial(U), domeMaterial(U),
//   buildFlock(U, list, type, rng, o):
//                    the same factories with the uniform set U given by hand (see each).
//   styleUpdate(U, time, camera, renderer)  once per frame (buildHero's update() already does).
//   STYLE            { fadeHalf }. STYLE_GLSL  tbDome(dir), tbFade(dist), tbSun(dir), tbHash, tbNoise for any extra material.
//   Sticks, Skins    geometry builders that write the attributes those materials read.
//   TISSUE, BALSA, PALETTE  display hex of the six tissues, the two balsa tones, the brief palette.
//   BODY             the body of a made thing's paper (1: whole). shadeTint(col, shade): a hill paper's colour at a shade 0..1.
//   AIRSHIP          { length, open }: the hull's length and the radius of the opening in its nose ring (the portal's).
//   LINE_UNDER       how far a hill's lining lies under its top chords (the world lines its own hills the same way).
//   BARE             [a, b]: the hull's rings a to b carry no paper. FORM  how fully a hill's paper takes the low sun's side.
//
// HEADER NOTES. Size: radius 62 m, column from y 46 to 300 on the axis x = z = 0; hill 90 by ~100 m, crest 40 m;
// airship 120 m long, 26 m across. Front is +Z: the camera is expected to arrive from +Z looking toward -Z, so
// in a world whose course is +Z set object.rotation.y = Math.PI and object.position to the axis (15, 0, 230).
// The helix is left-hand (anticlockwise seen from above) whatever the rotation.
// opts: palette (brief order: honey, peach, lilac, red, lemon, blue, olive), detail 0.6..1 (thins the mist only),
//   count (220..300 circlers, default seeded), colourway 0 all six | 1 red and white | 2 lemon and blue (seeded),
//   cast [cabin, pylon, wing] shares (seeded), bare 0..1 share of the crest the sheet never covers (seeded),
//   crestAt, dethermalise (bool; seeded 12%), circleRadius 30, circleY0 50, circleY1 78 (the camera's circle and
//   the height it leaves at: a comfort band round it, wingtips 7 m inside and 8 m outside, 9 m under and over, holds
//   no model, but in the rare wave, when a model whose own range begins at the band's top may sink up to 9 m into it,
//   still 2 m and its ball off the flown line), airship false | { stern: [x, y, z], heading: radians }, dome (bool; preview only),
//   sun: [x, y, z] the way to the sun in LOCAL space (the hill's lining and paper and the hull's gores are shaded by it once, at the build),
//   grass: hex of the hill's green paper (default the palette's olive),
//   flown: [{x, y, z}...] the world's flown line in LOCAL space, a point about every metre: no model's ring of
//   wander comes within 2 m of it (see the models' block).
// Returned: object, radius, height, center, anchors, style, update(dt, time, camera), setProgress(sheet, wave)
//   (call every frame with two numbers 0..1 worked out from where the eye is: how far the sheet is laid, the mist
//   riding its front and the tissue tight behind it; how far the rare dethermaliser wave has fallen),
//   setFree(slot, worldPos, worldForward, bankRad, wind): slot 0 = the 14 m orange model for the overhead pass,
//   slot 1 = the 8 m lemon companion; wind 0 wound (fan) .. 1 spent (blades stopped level and folded back, skein straight). Until
//   setFree is called they circle with the column. setFreeMatrix(2, matrix, wind): the world's ride.
//   heightAt(x, z) of the hill (local), unbuilt (models left out because no height of their radius was clear),
//   columnClear(x, y0, y1, z, reach): true when no model of the column can come within reach of that local place,
//   hullInner(s): the clear radius inside the airship's ring formers, s metres from its stern along its axis,
//   post (the flat post block).
// anchors (local space): axis, crest, columnBottom/Top/Radius; circle { center, radius, y0, y1 }; portalSeat
//   { position (centre of the nose ring), facing (back along the path), travel, radius (AIRSHIP.open) }; airship
//   { stern, nose, dir, length, radius }; viewpoints { entry, image, crest } as { from, at }; axisLook.
// Cost: 91k to 127k triangles by the count of models (counted on eighty deals at the ends of the density), 17 draw calls (9 models, 6 hill and mist, 2 airship) plus 1 for the preview dome;
//   build about 150-350 ms in yielded steps; no lights, no textures. Expects around it: the dome
//   (hero.style.dome()), the field under the hill at y = 0, a mooring mast at the nose ring if wanted.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#D9A55B', '#F6C7A6', '#B8A6D9', '#D8362B', '#F4DE6A', '#7FB6DE', '#8E9A4A'];
// the six tissues and the two balsa tones, as display hex (post.flat shows them as written)
export const TISSUE = { white: '#F0F0F0', lemon: '#F4DE6A', orange: '#F08A2E', red: '#D8362B', blue: '#7FB6DE', olive: '#8E9A4A' };
export const BALSA = { honey: '#D9A55B', umber: '#5C3B1E' };

const lin = (hex) => new THREE.Color(hex);          // sRGB hex -> scene-linear; flat post shows it as the hex
const v3 = (c) => new THREE.Vector3(c.r, c.g, c.b);

// Shared uniforms: ONE set for a visit. Every material made with a set references the same uniform objects, so
// setting uSunDir.value (world space, toward the sun) or calling styleUpdate() once per frame moves the whole
// world together. A FRESH set is made by every buildHero() (two visits of this world can be on screen at once,
// one seen through the other's portal, and each needs its own sun, time and free models) and handed to every
// factory by hand: hero.style.uniforms is the set, and no variable of this module holds one.
function makeUniforms() {
  return {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.92, 0.19, -0.34).normalize() },   // world space, toward the hot blur
    uPix: { value: 0.0012 },            // world size of one pixel at 1 m (set by styleUpdate)
    uFadeHalf: { value: 450 },
    uHoney: { value: v3(lin(BALSA.honey)) },
    uUmber: { value: v3(lin(BALSA.umber)) },
    uPeach: { value: v3(lin('#F6C7A6')) },
    uLilac: { value: v3(lin('#B8A6D9')) },
    uHot: { value: v3(lin('#FFF3DC')) },
    uEarth: { value: v3(lin('#B9A27A')) },   // the dome under the horizon (set with the hour by the world)
    uFree: { value: [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()] },   // the "free" models: 0, 1 in the hero's space, 2 the world's ride (world space)
    uFreeWind: { value: new THREE.Vector3(0, 0, 0) },                  // their motors: 0 wound and running .. 1 spent, stopped
    uFreeSpin: { value: new THREE.Vector3(0, 0, 0) },                  // their propeller angles (radians; buildHero's update integrates them)
    uPop: { value: new THREE.Vector2(1e4, 0) },                      // dethermaliser wave: x = height of the wave front (m, falls), y = on
  };
}
export const STYLE = { fadeHalf: 450 };

// call once per frame from the world's update(): time, and the pixel size from the live camera and buffer
const _sz = new THREE.Vector2();
export function styleUpdate(U, time, camera, renderer) {
  U.uTime.value = time;
  let h = 900;
  if (renderer) { renderer.getDrawingBufferSize(_sz); h = Math.max(200, _sz.y); }
  const p11 = camera && camera.projectionMatrix ? camera.projectionMatrix.elements[5] : 1.6;
  U.uPix.value = 2 / (Math.max(0.2, p11) * h);
}

// GLSL shared by every material of the world. tbDome(dir): the dome's smooth colour in a world direction
// (peach low, lilac high and deeper overhead, the hour's earth below the horizon, hot blur round the sun). tbFade(dist): 0 near .. 1 gone
// (0.5 at uFadeHalf). tbSun(dir): the scatter lobe, 0.5 on the blur, 0 beyond 55 degrees.
// tbHash/tbNoise: cheap value noise for creases and tint breakup.
export const STYLE_GLSL = /* glsl */`
uniform float uTime, uPix, uFadeHalf;
uniform vec3 uSunDir, uHoney, uUmber, uPeach, uLilac, uHot, uEarth;
float tbHash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float tbHash1(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
float tbNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(tbHash(i), tbHash(i + vec2(1., 0.)), f.x), mix(tbHash(i + vec2(0., 1.)), tbHash(i + vec2(1., 1.)), f.x), f.y); }
vec3 tbDome(vec3 d){
  float h = d.y;
  vec3 c = mix(uPeach, uLilac, smoothstep(0.02, 0.62, h));
  c = mix(c, uLilac * vec3(0.7, 0.72, 0.9), smoothstep(0.4, 1., h));       // deeper overhead
  c = mix(c, uEarth, 1. - smoothstep(-0.2, 0.005, h));                     // under the horizon: the evening's earth, which every far thing of the ground fades to
  float s = dot(d, uSunDir);
  float blur = smoothstep(0.86, 0.995, s);            // the 16 degree hot blur with a wide soft fall-off
  float halo = smoothstep(0.3, 1.0, s);
  c = mix(c, uHot, 0.4 * halo * halo);
  c = mix(c, uHot, blur * blur * 0.95);
  return c;
}
float tbFade(float dist){ return 1. - exp2(-dist / max(uFadeHalf, 1.)); }
float tbSun(vec3 d){ float s = dot(d, uSunDir); return 0.5 * smoothstep(0.5736, 0.99, s); }   // cos 55 deg
`;

// Vertex chunk that places an instanced free-flight model on the thermal helix (define TB_HELIX).
// Per instance: aHelix (radius, height, phase, rate rad/s), aModel (span scale, seed, free slot or -1, climb m/s).
// aRange (lo, hi): the model's own range of climb when hi > lo, else the column's. Uniform uCol = vec4(bottom, top,
// bank radians, power). Models rise at their climb rate, wrap from the top of their range to its bottom and shrink to
// nothing in the last metres of each end, so the column never pops; a model that does not climb keeps its size.
// uLaw (round 10; 0 for every flock but the column's): the column's models rise slowly low in their range and faster
// high, by the height they are at: the share s of the range a model has risen at its climb rate stands at the height
// (exp(uLaw s) - 1) / (exp(uLaw) - 1) of it. So the column is thickest low at EVERY moment of the world's clock: the same
// crowd over the camera's circle for a slow visitor as for a fast one, where a column only DEALT thick and low thins as it climbs.
const HELIX_GLSL = /* glsl */`
#ifdef TB_HELIX
attribute vec4 aHelix; attribute vec4 aModel; attribute vec2 aRange;
uniform vec4 uCol; uniform float uLaw; uniform mat4 uFree[3]; uniform vec3 uFreeWind, uFreeSpin; uniform vec2 uPop;
#ifdef TB_ORIGIN
attribute vec3 aOrigin;                                  // each model circles its own centre (thistledown, climbers)
#endif
float tbFreeWind(float z){ return z > 1.5 ? uFreeWind.z : (z > 0.5 ? uFreeWind.y : uFreeWind.x); }
float tbFreeSpin(float z){ return z > 1.5 ? uFreeSpin.z : (z > 0.5 ? uFreeSpin.y : uFreeSpin.x); }
float tbWind(float seed){ return (0.55 + 0.45 * tbHash1(seed * 3.7)) * (1. - 0.85 * uCol.w); }   // uCol.w = 1: still under power
mat3 tbRotY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 tbRotZ(float a){ float c = cos(a), s = sin(a); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }
mat3 tbRotX(float a){ float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }
// local model space: nose +Z, span along X, up +Y. Returns object-space position (before modelMatrix).
vec3 tbPlace(vec3 p, out float wind){
  float seed = aModel.y, span = aModel.x;
  if (aModel.z > -0.5) {                                  // a free model: placed by a matrix the world sets
    wind = tbFreeWind(aModel.z);
    vec4 ps = vec4(p * span, 1.);
    if (aModel.z > 1.5) return (uFree[2] * ps).xyz;
    return aModel.z > 0.5 ? (uFree[1] * ps).xyz : (uFree[0] * ps).xyz;
  }
  bool own = aRange.y > aRange.x;                        // its own range of climb (clear of the flown line), else the whole column
  float lo = own ? aRange.x : uCol.x, H = max((own ? aRange.y : uCol.y) - lo, 1.);
  float hh = mod(aHelix.y - lo + aModel.w * uTime, H);
  float grow = aModel.w > 0. ? smoothstep(0., 10., hh) * smoothstep(0., 14., H - hh) : 1.;   // a standing model keeps its size
  float y = lo + (uLaw > 0. && aModel.w > 0. ? H * (exp(uLaw * hh / H) - 1.) / (exp(uLaw) - 1.) : hh);   // (round 10) slow low, fast high: see uLaw above
  float th = aHelix.z + aHelix.w * uTime, way = aHelix.w < 0. ? -1. : 1.;    // way: a model dealt a right-hand circle flies nose first too
  float r = aHelix.x * (1. + 0.05 * sin(uTime * 0.21 + seed * 40.));
  // dethermaliser: when the falling wave front has passed this model it sinks flat and level
  float pop = uPop.y * smoothstep(0., 12., y - uPop.x), y0 = y;
  #ifdef TB_ORIGIN
    pop = 0.;                                             // the wave is the column's own: a model circling a centre of its own elsewhere is not in it
  #endif
  float bank = way * uCol.z * (0.75 + 0.5 * tbHash1(seed * 7.1)) * (1. - pop) + (0.06 + 0.2 * pop) * sin(uTime * (0.7 + seed) + seed * 50.);   // popped: level, rocking like a leaf
  float pitch = 0.05 * sin(uTime * (0.5 + 0.6 * seed) + seed * 90.) - 0.03 - 0.13 * pop;
  y += 0.5 * span * 0.12 * sin(uTime * 0.6 + seed * 70.) - pop * mix(9., min(26., max(y0 - 54., 0.)), step(aHelix.x + 0.5 * span, 22.)) * smoothstep(0., 110., y0 - uPop.x);   // the small ones inside the camera's circle settle toward the crest; the rest sink 9 m (counted in every ring's clear air at the build)
  wind = tbWind(seed);                                   // circlers: motors mostly run down
  vec3 q = tbRotZ(-bank) * (tbRotX(pitch) * (p * span * grow));
  q = tbRotY(th + 1.5708 * way) * q;                      // heading = the tangent of its circle, left-hand or right
  vec3 at = q + vec3(r * sin(th), y, r * cos(th));
  #ifdef TB_ORIGIN
    at += aOrigin;
  #endif
  return at;
}
#endif
`;

// BALSA. Geometry attributes: position (stick centre line), aSide (vec3 offset to this vertex's edge; zero for
// true plates), aKind (0 main strip, 1 fine strip such as ribs and stringers: drawn alike, the fine ones are only thinner, 2 rubber skein,
// 3 propeller blade; 4..5 a hill's paper lining and 6..7 bare sheet balsa, on plates). opts.soft: a hill's own sticks, alpha-blended
// over its lining (transparent, no depth write). opts.helix: instanced models placed by HELIX_GLSL. opts.hub: [y, z] of the propeller hub
// and opts.skein: [zNose, zTail] in model units (helix only).
export function balsaMaterial(U, opts = {}) {
  const uniforms = {
    uTime: U.uTime, uPix: U.uPix, uFadeHalf: U.uFadeHalf, uSunDir: U.uSunDir, uHoney: U.uHoney, uUmber: U.uUmber,
    uPeach: U.uPeach, uLilac: U.uLilac, uHot: U.uHot, uEarth: U.uEarth,
    uCol: { value: opts.col || new THREE.Vector4(0, 300, 0.35, 0) }, uLaw: { value: opts.law || 0 }, uFree: U.uFree, uFreeWind: U.uFreeWind, uFreeSpin: U.uFreeSpin, uPop: U.uPop,
    uHub: { value: new THREE.Vector4(...(opts.hub || [0, 0.3]), ...(opts.skein || [0.25, -0.2])) },
    uMinPx: { value: opts.minPx ?? 0.8 },
  };
  return new THREE.ShaderMaterial({
    uniforms, defines: { ...(opts.helix ? (opts.origin ? { TB_HELIX: 1, TB_ORIGIN: 1 } : { TB_HELIX: 1 }) : {}), ...(opts.soft ? { TB_SOFT: 1 } : {}) }, side: THREE.DoubleSide,
    transparent: !!opts.soft, depthWrite: !opts.soft,
    vertexShader: /* glsl */`
      attribute vec3 aSide; attribute float aKind;
      uniform float uMinPx; uniform vec4 uHub;
      varying vec3 vW; varying float vGone; varying float vKind; varying float vT;
      ${STYLE_GLSL}
      ${HELIX_GLSL}
      void main(){
        vec3 p0 = position, sd = aSide; float wind = 0.;
        #ifdef TB_HELIX
          float sp = aModel.z > -0.5 ? tbFreeSpin(aModel.z) : uTime * (1.5 + 5. * tbHash1(aModel.y * 9.3)) * step(0.5, tbHash1(aModel.y * 5.7));
          float w0 = aModel.z > -0.5 ? tbFreeWind(aModel.z) : tbWind(aModel.y);
          if (aKind > 2.5) {                       // propeller blade: turn about the hub; hidden while the fan shows
            float c = cos(sp), s = sin(sp); float show = smoothstep(0.42, 0.6, w0);
            float fold = 1.5 * smoothstep(0.76, 0.9, w0);      // a folding propeller: when the motor is spent the blades lie back along the nose
            vec2 d = (p0.xy - vec2(0., uHub.x)) * show; p0.z -= abs(d.y) * sin(fold); d.y *= cos(fold);
            p0.xy = vec2(0., uHub.x) + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
            sd.xy = vec2(c * sd.x - s * sd.y, s * sd.x + c * sd.y) * show;
          } else if (aKind > 1.5) {                // rubber skein: twist runs down as it unwinds, knots slide tailward, then it sags
            float zn = clamp((uHub.z - p0.z) / max(uHub.z - uHub.w, 1e-3), 0., 1.);
            float tw = (1. - w0) * (38. * zn + 2.5 * sin(zn * 25. - (1. - w0) * 30.)) + 3.0 * zn;
            float c = cos(tw), s = sin(tw);
            float knot = 1. + 0.9 * (1. - w0) * smoothstep(0.6, 1., sin(zn * 19. + w0 * 40.));
            sd.xy = vec2(c * sd.x - s * sd.y, s * sd.x + c * sd.y) * knot;
            p0.y -= 0.02 * w0 * sin(zn * 3.14159);
          }
          vec3 P0 = tbPlace(p0, wind); float w1; vec3 P1 = tbPlace(p0 + sd, w1);
        #else
          vec3 P0 = p0, P1 = p0 + sd;
        #endif
        vec4 wp = modelMatrix * vec4(P0, 1.); vec3 ws = (modelMatrix * vec4(P1, 1.)).xyz - wp.xyz;
        float dist = length(wp.xyz - cameraPosition);
        float hw = length(ws);
        float k = uMinPx * uPix * dist / max(hw, 1e-5);
        float isStick = step(1e-6, hw) * (1. - step(1.5, aKind));
        vGone = isStick * (1. - 1. / max(k, 1.));        // true cover: a stick widened k times is drawn at 1/k of its strength, never removed
        float widen = mix(1., clamp(k, 1., 12.), isStick);
        vec3 pw = wp.xyz + ws * widen;
        vW = pw; vKind = aKind; vT = tbHash(position.xy * 3.1 + position.z);
        gl_Position = projectionMatrix * viewMatrix * vec4(pw, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying float vGone; varying float vKind; varying float vT;
      ${STYLE_GLSL}
      void main(){
        vec3 d = vW - cameraPosition; float dist = length(d); d /= max(dist, 1e-4);
        float sky = smoothstep(-0.08, 0.3, d.y);                    // the dome is behind it: umber
        vec3 c = mix(uHoney * (0.93 + 0.12 * vT), uUmber, 0.9 * sky);
        if (vKind > 1.5 && vKind < 2.5) c = uUmber * 0.62;          // rubber
        if (vKind > 3.5) {                                          // a hill's paper lining: shaded once, at the build, by its slope to the sun;
          c = mix(mix(uHot, uLilac, 0.6) * 0.42, mix(uHoney, uHot, 0.62), clamp(vKind - 4., 0., 1.));   // from a dim cool paper in the shade to a warm balsa sheet in the sun
          if (vKind > 5.5) c = mix(uUmber * 1.25, uHoney, clamp(vKind - 6., 0., 1.));       // 6..7: bare sheet balsa (a crest not yet papered)
          c = mix(c, uHot, 0.5 * tbSun(d));                         // and against the light the paper glows a little, as every paper here does
        }
        #ifdef TB_SOFT
          // a hill's own sticks lie on its lining: one widened k times is drawn at 1/k of its strength OVER the lining (true cover),
          // so a far hill is its paper with faint ribs and never a net of pale wire
          gl_FragColor = vec4(mix(c, tbDome(d), clamp(tbFade(dist) * 0.45, 0., 1.)), 1. - vGone);
        #else
        float f = max(tbFade(dist) * (vKind > 3.5 ? 0.45 : 0.9), vGone);   // a hill's lining takes half the distance's fade, so a far hill stays a solid thing
        gl_FragColor = vec4(mix(c, tbDome(d), clamp(f, 0., 1.)), 1.);
        #endif
      }`,
  });
}

// The material of a hill's lining: the balsa material, set back a little in depth so that a chord lying on it is never hidden by it.
export function liningMaterial(U) { const m = balsaMaterial(U); m.polygonOffset = true; m.polygonOffsetFactor = 2; m.polygonOffsetUnits = 2; return m; }

// TISSUE. Geometry attributes: position, aBay (vec2 uv in bay units: integer lines are ribs/spars), aSlack
// (0 tight .. 1 slack: corners, tips), and either aCol (vec3 linear pigment) or, for helix models, aPart
// (0 first colour, 1 second colour, 2 propeller fan). opts.front adds aSag (vec3 displacement of a slack bay
// centre) and aFront (float coordinate the two fronts travel along): uniform uFront = (tight, cover, width,
// wobble): fragments with aFront > tight are slack and creased, fragments with aFront > cover are not laid yet.
// opts.scatter: the additive sun-lobe pass over the same geometry. opts.bay: [metres per bay u, per bay v].
// opts.lift: metres the skin is pulled toward the eye in depth only, so a single skin always lies in front of
// its own frame from both sides (a wing has one skin surface, not two).
export function tissueMaterial(U, opts = {}) {
  const uniforms = {
    uTime: U.uTime, uPix: U.uPix, uFadeHalf: U.uFadeHalf, uSunDir: U.uSunDir, uHoney: U.uHoney, uUmber: U.uUmber,
    uPeach: U.uPeach, uLilac: U.uLilac, uHot: U.uHot, uEarth: U.uEarth,
    uCol: { value: opts.col || new THREE.Vector4(0, 300, 0.35, 0) }, uLaw: { value: opts.law || 0 }, uFree: U.uFree, uFreeWind: U.uFreeWind, uFreeSpin: U.uFreeSpin, uPop: U.uPop,
    uFront: { value: opts.frontUniform || new THREE.Vector4(1e6, 1e6, 3, 1) },
    uBay: { value: new THREE.Vector2(...(opts.bay || [4, 4])) },
    uLift: { value: opts.lift ?? 0 }, uGain: { value: opts.gain ?? 1 }, uMilk: { value: opts.milk ?? 0 },
    uSway: { value: opts.sway === true ? 1 : (opts.sway || opts.blade || 1) }, uInk: { value: opts.ink ?? 1 }, uFar: { value: opts.far ?? 1 },
    uBody: { value: opts.body ?? 0 }, uSub: { value: opts.sub ?? 0 }, uLit: { value: opts.lit ?? 0 }, uDeepen: { value: opts.deepen ?? 0 }, uRib: { value: opts.rib ?? 0.75 }, uTunnel: { value: opts.tunnel ?? 0 }, uMarks: { value: opts.marks ?? 1 }, uForm: { value: opts.form ?? 0 }, uBare: { value: new THREE.Vector2(...(opts.bare || [0, 0])) },
  };
  const defines = {};
  if (opts.helix) defines.TB_HELIX = 1;
  if (opts.helix && opts.origin) defines.TB_ORIGIN = 1;
  if (opts.sway) defines.TB_SWAY = 1;
  if (opts.blade) defines.TB_BLADE = 1;
  if (opts.front) defines.TB_FRONT = 1;
  if (opts.scatter) defines.TB_SCATTER = 1;
  const body = !!opts.body && !opts.scatter;
  if (body) defines.TB_BODY = 1;
  if (opts.body && opts.scatter) defines.TB_FANADD = 1;
  const mat = new THREE.ShaderMaterial({
    uniforms, defines, side: THREE.DoubleSide, depthWrite: body, depthTest: true, transparent: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: opts.scatter || body ? THREE.OneFactor : THREE.ZeroFactor, blendDst: opts.scatter ? THREE.OneFactor : body ? THREE.OneMinusSrcAlphaFactor : THREE.SrcColorFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`
      attribute vec2 aBay; attribute float aSlack;
      uniform float uLift; uniform vec4 uFront;
      varying vec3 vW; varying vec3 vCol; varying vec2 vBay; varying float vSlack; varying float vFront; varying vec3 vFan; varying float vThin;
      ${STYLE_GLSL}
      ${HELIX_GLSL}
      #if defined(TB_SWAY) || defined(TB_BLADE)
        uniform float uSway;
      #endif
      #ifdef TB_SWAY
        attribute vec4 aSway;                              // xyz: displacement at full swing, w: phase
      #endif
      #ifdef TB_BLADE
        attribute vec4 aRoot; attribute vec4 aLean;        // an instanced sliver: foot xyz + height; lean x, z, phase, width
      #endif
      #ifdef TB_HELIX
        attribute float aPart; attribute vec3 aColA; attribute vec3 aColB;
      #else
        attribute vec3 aCol;
      #endif
      #ifdef TB_FRONT
        attribute vec3 aSag; attribute float aFront;
      #endif
      void main(){
        vec3 p = position; float lift = uLift; vFan = vec3(0.); vFront = -1e6; vSlack = aSlack; vThin = 1.;
        #ifdef TB_SWAY
          p += aSway.xyz * sin(uTime * uSway + aSway.w);
        #endif
        #ifdef TB_BLADE
          float by = position.y, bph = aLean.z * 6.2832;
          float bsw = sin(uTime * uSway * (0.7 + 0.6 * fract(aLean.z * 7.3)) + bph);
          vec2 bln = aLean.xy * (0.7 + 0.5 * bsw);
          float btw = bph + 1.3 * by * sin(uTime * uSway * 0.6 + bph * 3.);              // twisting slowly
          vec3 bc = aRoot.xyz + vec3(bln.x * by * by, by, bln.y * by * by) * aRoot.w;
          float bw = aLean.w * (1. - 0.55 * by), bd = length((modelMatrix * vec4(bc, 1.)).xyz - cameraPosition);
          float bk = max(1., 1.6 * uPix * bd / max(bw, 1e-4));                           // never thinner than 1.6 px: paler instead
          vThin = 1. / bk;
          p = bc + vec3(cos(btw), 0., sin(btw)) * (position.x * bw * min(bk, 30.));
        #endif
        #ifdef TB_HELIX
          float wind; p = tbPlace(position, wind);
          vCol = mix(aColA, aColB, clamp(aPart, 0., 1.)); lift *= aModel.x;
          float sp = aModel.z > -0.5 ? tbFreeSpin(aModel.z) : 0.;
          vFan = vec3(step(1.5, aPart), wind, sp);
        #else
          vCol = aCol;
        #endif
        #ifdef TB_FRONT
          float sl = smoothstep(-uFront.z, uFront.z, aFront - uFront.x);
          float breathe = 0.72 + 0.28 * sin(uTime * 0.9 + aFront * 0.7 + position.x * 0.3);
          p += aSag * sl * breathe; vFront = aFront;
        #endif
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vBay = aBay;
        vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
        float len = max(length(mv.xyz), 1e-3);
        vec4 p2 = projectionMatrix * vec4(mv.xyz * (1. - min(lift / len, 0.5)), 1.);
        gl_Position.z = p2.z / max(p2.w, 1e-4) * gl_Position.w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec4 uFront; uniform vec2 uBay; uniform float uGain, uMilk;
      varying vec3 vW; varying vec3 vCol; varying vec2 vBay; varying float vSlack; varying float vFront; varying vec3 vFan; varying float vThin;
      uniform float uInk, uFar, uBody, uSub, uLit, uDeepen, uRib, uTunnel, uMarks, uForm; uniform vec2 uBare;
      ${STYLE_GLSL}
      float tbLine(float x, float c, float w, float fw){ return 1. - smoothstep(w, w + fw, abs(x - c)); }
      void main(){
        vec3 d = vW - cameraPosition; float dist = length(d); d /= max(dist, 1e-4);
        vec2 b = fract(vBay), cell = floor(vBay), fw = fwidth(vBay) + 1e-5;
        vec2 m = vBay * uBay, fm = fw * uBay;                         // metres, and metres per pixel
        float fine = 1. - smoothstep(0.1, 0.3, max(fw.x, fw.y));      // marks under ~3 px become their flat tint
        float hsh = tbHash(cell + 7.3);
        vec2 e = min(b, 1. - b), em = e * uBay;
        float wob = tbNoise(m * 0.35 + 3.) - 0.5;
        float slack = clamp(vSlack + smoothstep(-uFront.z, uFront.z, vFront - uFront.x + wob * uFront.w * 2.), 0., 1.);
        float cov = 1. - smoothstep(-0.25, 0.25, vFront - uFront.y + wob * uFront.w);
        float lead = 1. - smoothstep(0.1, 0.5, abs(vFront - uFront.y + wob * uFront.w + 0.45));   // folded leading edge of a sheet
        float deep = uDeepen + (hsh - 0.5) * 0.14;                     // each panel a breath off its neighbour (uDeepen: a fuller pigment, for a paper laid under the sky)
        float mk = fine * uMarks;                                      // uMarks: how strongly a paper carries its marks (the land's papers faintly)
        deep += mk * (0.24 * (1. - smoothstep(0., 0.16, e.x)) + 0.12 * (1. - smoothstep(0., 0.1, e.y)));   // scallop: dope pools at ribs
        float seamBay = step(0.6, tbHash(vec2(cell.x, 3.7)));          // doubled seam where two sheets overlap
        float wS = max(0.03, 0.9 * fm.x), lw = max(0.006, 0.75 * fm.x) / uBay.x;
        deep += mk * seamBay * (0.3 * step(em.x, wS * 3.) * step(b.x, 0.5) + 0.6 * tbLine(b.x, wS * 3. / uBay.x, lw, fw.x));
        float blob = 1. - smoothstep(0.06, 0.1 + length(fm), length(em) * (0.75 + 0.5 * hsh));
        deep += mk * 1.3 * blob;                                       // glue blob at each joint
        if (uSub > 0.5) {                                              // riblets: fine ribs between the formers, seen only close to
          vec2 es = (0.5 - abs(fract(vBay * uSub) - 0.5)) * uBay / uSub;
          float fs = 1. - smoothstep(0.06, 0.2, max(fw.x, fw.y) * uSub);
          deep += fs * 0.1 * max(1. - smoothstep(0.02, 0.02 + fm.x, es.x), 1. - smoothstep(0.02, 0.02 + fm.y, es.y));
        }
        // creases: contour lines of two noises, long and wandering, only where the skin is slack
        float n1 = tbNoise(m * vec2(0.55, 0.16) + hsh * 20.), n2 = tbNoise(m.yx * vec2(0.5, 0.21) + 40. + hsh * 9.);
        float cw = 0.035 + 2. * length(fwidth(m * 0.3));
        float cr = (1. - smoothstep(0., cw, abs(n1 - 0.5))) + 0.7 * (1. - smoothstep(0., cw, abs(n2 - 0.45)));
        deep += slack * (0.85 * cr * fine + 0.3 * (n1 - 0.3)) + lead * 0.9;
        vec3 T = pow(max(vCol, vec3(1e-4)), vec3(max(1. + deep, 0.5)));
        float fanA = 0.;
        #ifdef TB_BODY
          // the frame under the paper: a rib is drawn in the skin as its shadow, at every line of the bays
          vec2 wr = max(vec2(0.03), 0.6 * fm);
          float rib = max(1. - smoothstep(wr.x, wr.x + fm.x, em.x), 1. - smoothstep(wr.y, wr.y + fm.y, em.y));
          T *= mix(vec3(1.), vec3(0.66, 0.54, 0.46), uRib * rib * fine);
        #endif
        if (vFan.x > 0.5) {                                            // propeller fan: two soft sectors, arc and density fall as it runs down
          vec2 q = vBay; if (abs(q.x) < 1e-4) q.x = 1e-4;
          float r = length(q), a = atan(q.y, q.x) + vFan.z * 0.12, run = 1. - smoothstep(0.3, 0.58, vFan.y);
          float sec = smoothstep(1. - (0.2 + 0.75 * run), 1., abs(cos(a)));
          float disc = (1. - smoothstep(0.92, 1., r)) * smoothstep(0.06, 0.12, r);
          fanA = clamp(run * disc * (0.35 + 0.4 * sec), 0., 1.);
          T = mix(vec3(1.), uHoney * 1.05, fanA); cov = 1.;
        }
        float fade = tbFade(dist) * uFar;                              // uFar: how much of the distance's fade this paper takes (a hill's skin takes half)
        #ifdef TB_SCATTER
          float lobe = (tbSun(d) * uGain + uMilk) * (1. - fade) * cov * vThin * (1. - step(0.5, vFan.x));   // uMilk: paper that scatters a little everywhere (white skins, the sheet)
          gl_FragColor = vec4(pow(max(T, vec3(1e-4)), vec3(0.72)) * lobe * 1.4, 1.);
          #ifdef TB_FANADD
            if (vFan.x > 0.5) gl_FragColor = vec4(mix(uHoney, uHot, 0.5) * fanA * 0.2 * (1. - fade), 1.);   // a running propeller: a faint warm disc, added (a paper with a body draws none)
          #endif
        #elif defined(TB_BODY)
          // a paper with a BODY: it shows its own colour, lit (by the sky of the direction beyond it, mirrored above the horizon,
          // and the hot of the hour; or from above with uLit), and hides what is behind it (uBody 1: wholly); it writes depth, so one
          // paper hides another rightly; distance mixes its colour toward the dome's, it does not thin it. A propeller's fan is not
          // drawn here (the additive pass draws it).
          float a = uBody * cov * vThin * (1. - step(0.5, vFan.x));
          if (a < 0.02) discard;
          vec3 light = mix(mix(tbDome(vec3(d.x, abs(d.y), d.z)), uHot, 0.5), mix(uPeach, uHot, 0.8) * (0.95 + 0.3 * tbSun(d)), uLit);   // uLit: a paper laid under the sky (ground, hills) takes the hour's light from above
          if (uForm > 0.) {                                             // uForm: a paper standing in the low sun; its faces turned to the sun warm, those turned away cooler and darker
            vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
            if (dot(n, d) > 0.) n = -n;
            light *= mix(vec3(1.), mix(vec3(0.66, 0.72, 0.92), vec3(1.16, 1.07, 0.9), smoothstep(-0.45, 0.7, dot(n, uSunDir))), uForm);
          }
          if (uTunnel > 0.5 && !gl_FrontFacing) {                       // the inside of a hull of uTunnel rings (bay v counts them from the stern), lit by place: bright by its openings
            float r = vBay.y;                                           // (the stern's mouth, the nose, either end of a bare stretch uBare), dim between them; each ring former's shadow lies on the paper
            float glow = max(exp(-r / 2.5), exp(-(uTunnel - r) / 2.5));
            if (uBare.y > uBare.x) glow = max(glow, max(exp(-abs(r - uBare.x) / 1.5), exp(-abs(r - uBare.y) / 1.5)));
            light *= mix(0.42, 1.14, glow) * (1. - 0.3 * (1. - smoothstep(0.015, 0.06, e.y)));
          }
          T = max(mix(vec3(1.), T, uInk), vec3(0.));
          gl_FragColor = vec4(mix(T * light, tbDome(d), clamp(fade, 0., 1.)) * a, a);
        #else
          T = mix(T, vec3(1.), fade); T = max(mix(vec3(1.), T, cov * vThin * uInk), vec3(0.));
          gl_FragColor = vec4(max(T, vec3(0.02)), 1.);
        #endif
      }`,
  });
  mat.forceSinglePass = true;            // one draw, both faces: multiply and add do not care about order, and a paper with a body is kept right by the depth it writes
  return mat;
}

// ---------------------------------------------------------------------------------------------------------
// Geometry builders, exported so the world builds its field, hills, poplars and firs the same way.
// Sticks: balsa. stick(a, b, halfWidth, kind, sideDir) is one flat ribbon whose face normal is perpendicular
// to sideDir; stick2() is two crossed ribbons (reads from every side); plate() is a true flat piece.
// Buf: a growable typed array (push without leaving garbage: the big lattices are a million numbers).
class Buf {
  constructor(T = Float32Array, n = 4096) { this.T = T; this.a = new T(n); this.length = 0; }
  push() {
    const n = arguments.length;
    if (this.length + n > this.a.length) { const b = new this.T(Math.max(this.a.length * 2, this.length + n)); b.set(this.a); this.a = b; }
    const A = this.a; let L = this.length;
    for (let i = 0; i < n; i++) A[L++] = arguments[i];
    this.length = L;
  }
  attr(size) { return new THREE.BufferAttribute(this.a.subarray(0, this.length), size); }
}
export class Sticks {
  constructor() { this.p = new Buf(); this.s = new Buf(); this.k = new Buf(); this.i = new Buf(Uint32Array); this.n = 0; }
  _v(x, y, z, sx, sy, sz, k) { this.p.push(x, y, z); this.s.push(sx, sy, sz); this.k.push(k); return this.n++; }
  stick(a, b, hw, kind = 0, side = null) {
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    let sx, sy, sz;
    if (side) { sx = side[0]; sy = side[1]; sz = side[2]; } else { sx = dz; sy = 0; sz = -dx; if (Math.abs(dy) > 0.95) { sx = 1; sy = 0; sz = 0; } }
    const dt = sx * dx + sy * dy + sz * dz; sx -= dt * dx; sy -= dt * dy; sz -= dt * dz;
    const sl = Math.hypot(sx, sy, sz) || 1; sx *= hw / sl; sy *= hw / sl; sz *= hw / sl;
    const v0 = this._v(a[0], a[1], a[2], -sx, -sy, -sz, kind), v1 = this._v(a[0], a[1], a[2], sx, sy, sz, kind);
    const v2 = this._v(b[0], b[1], b[2], sx, sy, sz, kind), v3 = this._v(b[0], b[1], b[2], -sx, -sy, -sz, kind);
    this.i.push(v0, v1, v2, v0, v2, v3);
    return [dx, dy, dz, sx / hw, sy / hw, sz / hw];
  }
  stick2(a, b, hw, kind = 0, side = null) {
    const r = this.stick(a, b, hw, kind, side);
    const cx = r[1] * r[5] - r[2] * r[4], cy = r[2] * r[3] - r[0] * r[5], cz = r[0] * r[4] - r[1] * r[3];
    this.stick(a, b, hw, kind, [cx, cy, cz]);
  }
  plate(pts, kind = 0) {                       // convex polygon fan, no widening; kind: one number or one for each point
    const base = this.n; pts.forEach((q, j) => this._v(q[0], q[1], q[2], 0, 0, 0, Array.isArray(kind) ? kind[j] : kind));
    for (let j = 1; j < pts.length - 1; j++) this.i.push(base, base + j, base + j + 1);
  }
  get triangles() { return this.i.length / 3; }
  geometry(Geo = THREE.BufferGeometry) {
    const g = new Geo();
    g.setAttribute('position', this.p.attr(3)); g.setAttribute('aSide', this.s.attr(3)); g.setAttribute('aKind', this.k.attr(1));
    g.setIndex(this.i.attr(1)); return g;
  }
  async geometryAsync(ctx) { const g = this.geometry(); await ctx.yield(); g.computeBoundingSphere(); await ctx.yield(); return g; }
}
// Skins: tissue. quad(p00, p10, p11, p01, bay [u0, v0, u1, v1], colour or part, o) with o = { slack: [4] or
// number, front: [4] or number, sag: [x, y, z] (adds a centre vertex that drops when slack), cols: [4] a colour for each corner }.
export class Skins {
  constructor(part = false) { this.part = part; this.p = new Buf(); this.b = new Buf(); this.c = new Buf(); this.sl = new Buf(); this.sg = new Buf(); this.f = new Buf(); this.sw = new Buf(); this.i = new Buf(Uint32Array); this.n = 0; }
  _v(q, u, v, col, slack, front, sag) {
    this.p.push(q[0], q[1], q[2]); this.b.push(u, v); this.sl.push(slack); this.f.push(front);
    if (this.part) this.c.push(col); else this.c.push(col.r, col.g, col.b);
    if (sag) this.sg.push(sag[0], sag[1], sag[2]); else this.sg.push(0, 0, 0);
    this.sw.push(0, 0, 0, 0);
    return this.n++;
  }
  quad(p00, p10, p11, p01, bay, col, o = {}) {
    const s = o.slack ?? 0, f = o.front ?? -1e6;
    const S = (j) => (Array.isArray(s) ? s[j] : s), F = (j) => (Array.isArray(f) ? f[j] : f);
    const K = (j) => (o.cols ? o.cols[j] : col);                  // o.cols: a colour for each corner (a hill's paper, shaded at the build)
    const a = this._v(p00, bay[0], bay[1], K(0), S(0), F(0)), b = this._v(p10, bay[2], bay[1], K(1), S(1), F(1));
    const c = this._v(p11, bay[2], bay[3], K(2), S(2), F(2)), d = this._v(p01, bay[0], bay[3], K(3), S(3), F(3));
    if (o.sag) {
      const m = [0, 1, 2].map((j) => (p00[j] + p10[j] + p11[j] + p01[j]) / 4);
      const e = this._v(m, (bay[0] + bay[2]) / 2, (bay[1] + bay[3]) / 2, o.cols ? { r: (K(0).r + K(1).r + K(2).r + K(3).r) / 4, g: (K(0).g + K(1).g + K(2).g + K(3).g) / 4, b: (K(0).b + K(1).b + K(2).b + K(3).b) / 4 } : col, (S(0) + S(1) + S(2) + S(3)) / 4, (F(0) + F(1) + F(2) + F(3)) / 4, o.sag);
      this.i.push(a, b, e, b, c, e, c, d, e, d, a, e);
    } else this.i.push(a, b, c, a, c, d);
    if (o.sway) for (let j = 0; j < 4; j++) { const w = Array.isArray(o.sway[0]) ? o.sway[j] : o.sway; for (let q = 0; q < 4; q++) this.sw.a[(a + j) * 4 + q] = w[q]; }   // o.sway: one vec4 or four (TB_SWAY)
  }
  get triangles() { return this.i.length / 3; }
  geometry(Geo = THREE.BufferGeometry, front = false, sway = false) {
    const g = new Geo();
    if (sway) g.setAttribute('aSway', this.sw.attr(4));
    g.setAttribute('position', this.p.attr(3)); g.setAttribute('aBay', this.b.attr(2)); g.setAttribute('aSlack', this.sl.attr(1));
    g.setAttribute(this.part ? 'aPart' : 'aCol', this.c.attr(this.part ? 1 : 3));
    if (front) { g.setAttribute('aSag', this.sg.attr(3)); g.setAttribute('aFront', this.f.attr(1)); }
    g.setIndex(this.i.attr(1)); return g;
  }
  async geometryAsync(ctx, front = false, sway = false) { const g = this.geometry(THREE.BufferGeometry, front, sway); await ctx.yield(); g.computeBoundingSphere(); await ctx.yield(); return g; }
}

// ---------------------------------------------------------------------------------------------------------
// One free-flight model in unit span (nose +Z, left wing +X, up +Y). type 0 high-wing cabin, 1 pylon glider,
// 2 flying wing. Returns the balsa frame, the tissue skin, the propeller hub and the skein ends for the material.
function modelParts(type, rng) {
  const F = new Sticks(), S = new Skins(true);
  const P = [
    { c0: 0.17, taper: 0.35, sweep: 0.0, wy: 0.118, le: 0.11, dih: 0.03, tip: 0.075, ribs: 17, tail: 0.19,
      st: [[0.33, 0.028, -0.005, 0.055], [0.2, 0.045, -0.035, 0.085], [0.11, 0.05, -0.045, 0.115], [-0.06, 0.05, -0.04, 0.115], [-0.2, 0.035, -0.015, 0.07], [-0.44, 0.01, 0.02, 0.045]] },
    { c0: 0.125, taper: 0.5, sweep: 0.03, wy: 0.14, le: 0.09, dih: 0.02, tip: 0.11, ribs: 19, tail: 0.17,
      st: [[0.3, 0.016, 0.0, 0.036], [0.12, 0.024, -0.012, 0.045], [-0.05, 0.022, -0.008, 0.04], [-0.26, 0.014, 0.0, 0.03], [-0.5, 0.006, 0.01, 0.025]] },
    { c0: 0.25, taper: 0.6, sweep: 0.34, wy: 0.035, le: 0.2, dih: 0.03, tip: 0.03, ribs: 17, tail: 0,
      st: [[0.25, 0.02, -0.01, 0.04], [0.1, 0.04, -0.035, 0.06], [-0.08, 0.035, -0.025, 0.05], [-0.2, 0.012, 0.0, 0.03]] },
  ][type];
  const wy = (x) => P.wy + P.dih * Math.min(Math.abs(x), 0.3) / 0.3 + P.tip * Math.max(0, Math.abs(x) - 0.3) / 0.2;
  const ch = (x) => P.c0 * (1 - P.taper * Math.max(0, Math.abs(x) - 0.3) / 0.2);
  const le = (x) => P.le - P.sweep * Math.abs(x) - (P.c0 - ch(x)) * 0.25;
  const W = (x, t, cam = 0) => [x, wy(x) + cam * ch(x), le(x) - t * ch(x)];
  // wing frame: leading edge, two spars, trailing edge, ribs (one a little out of line)
  const bp = [-0.5, -0.3, 0, 0.3, 0.5], N = P.ribs;
  for (let j = 0; j < 4; j++) {
    const a = bp[j], b = bp[j + 1];
    F.stick(W(a, 0), W(b, 0), 0.0065, 0, [0, 0, 1]); F.stick(W(a, 0.33, 0.02), W(b, 0.33, 0.02), 0.0045, 0, [0, 0, 1]);
    F.stick(W(a, 0.667, 0.01), W(b, 0.667, 0.01), 0.003, 1, [0, 0, 1]); F.stick(W(a, 0.97), W(b, 0.97), 0.0095, 0, [0, 0, 1]);
  }
  const off = rng.int(2, N - 3), offAmt = rng.range(0.15, 0.3) * (rng.chance(0.5) ? 1 : -1);
  for (let i = 0; i < N; i++) {
    const x = -0.5 + i / (N - 1), tip = i === 0 || i === N - 1;
    const x2 = x + (i === off ? offAmt / (N - 1) : 0);
    F.stick(W(x, 0), W(x2, 1), tip ? 0.0048 : 0.0032, tip ? 0 : 1, [1, 0, 0]);
    if (tip) F.stick(W(x, 0.1, 0.05), W(x, 0.8, 0.03), 0.0032, 1, [0, 1, 0]);      // tip rib stands up as a plate
  }
  for (let j = 0; j < 4; j++) {
    const a = bp[j], b = bp[j + 1], ua = (a + 0.5) * (N - 1), ub = (b + 0.5) * (N - 1);
    const sa = Math.abs(a) > 0.45 ? 0.6 : 0, sb = Math.abs(b) > 0.45 ? 0.6 : 0;
    S.quad(W(a, 0), W(b, 0), W(b, 0.33, 0.085), W(a, 0.33, 0.085), [ua, 0, ub, 1], 0, { slack: [sa, sb, sb, sa] });
    S.quad(W(a, 0.33, 0.085), W(b, 0.33, 0.085), W(b, 1), W(a, 1), [ua, 1, ub, 3], 0, { slack: [sa, sb, sb, sa] });
  }
  const st = P.st, last = st[st.length - 1], zt = last[0], yt = last[3];
  if (P.tail) {                                   // tailplane
    const hs = P.tail, tc = 0.105, T = (x, t) => [x, yt + 0.004, zt + tc - t * tc * (1 - 0.3 * Math.abs(x) / hs)];
    F.stick(T(-hs, 0), T(hs, 0), 0.0045, 0, [0, 0, 1]); F.stick(T(-hs, 1), T(hs, 1), 0.006, 0, [0, 0, 1]); F.stick(T(-hs, 0.4), T(hs, 0.4), 0.003, 1, [0, 0, 1]);
    for (let i = 0; i < 7; i++) { const x = -hs + (i / 6) * 2 * hs; F.stick(T(x, 0), T(x, 1), i % 6 === 0 ? 0.004 : 0.0026, i % 6 === 0 ? 0 : 1, [1, 0, 0]); }
    S.quad(T(-hs, 0), T(0, 0), T(0, 1), T(-hs, 1), [0, 0, 3, 2], 0, { slack: [0.5, 0, 0, 0.5] });
    S.quad(T(0, 0), T(hs, 0), T(hs, 1), T(0, 1), [3, 0, 6, 2], 0, { slack: [0, 0.5, 0.5, 0] });
  } else {                                        // flying wing: tip fins
    for (const sx of [-0.5, 0.5]) {
      const a = W(sx, 0.15), b = W(sx, 1), c = [sx, b[1] + 0.09, b[2] - 0.02], d = [sx, a[1] + 0.07, a[2] - 0.06];
      F.stick(a, d, 0.004, 0, [0, 0, 1]); F.stick(d, c, 0.004, 0, [0, 1, 0]); F.stick(c, b, 0.004, 0, [0, 0, 1]);
      S.quad(a, b, c, d, [0, 0, 2, 1], 0, { slack: [0, 0, 0.4, 0.4] });
    }
  }
  // fuselage: four longerons, a frame at each station, covered on four sides
  const C = (s, cx, cy) => [cx * s[1], cy > 0 ? s[3] : s[2], s[0]];
  for (let j = 0; j < st.length; j++) {
    const s = st[j];
    F.stick(C(s, -1, 1), C(s, 1, 1), 0.0026, 1, [0, 0, 1]); F.stick(C(s, -1, -1), C(s, 1, -1), 0.0026, 1, [0, 0, 1]);
    F.stick(C(s, -1, -1), C(s, -1, 1), 0.0026, 1, [0, 0, 1]); F.stick(C(s, 1, -1), C(s, 1, 1), 0.0026, 1, [0, 0, 1]);
    if (j === st.length - 1) break;
    const n = st[j + 1];
    for (const cx of [-1, 1]) for (const cy of [-1, 1]) F.stick(C(s, cx, cy), C(n, cx, cy), 0.0042, 0, [cx, cy, 0]);
    const ring = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]];
    for (let f = 0; f < 4; f++) S.quad(C(s, ...ring[f]), C(s, ...ring[f + 1]), C(n, ...ring[f + 1]), C(n, ...ring[f]), [f, j, f + 1, j + 1], 1);
  }
  if (type === 1) {                               // pylon under the wing
    const a = [0, st[1][3], 0.1], b = [0, st[2][3], -0.03], c = [0, P.wy, -0.02], d = [0, P.wy, 0.07];
    F.stick(a, d, 0.004, 0, [0, 0, 1]); F.stick(b, c, 0.004, 0, [0, 0, 1]); S.quad(a, b, c, d, [0, 0, 1, 1], 1);
  }
  if (P.tail) {                                   // fin
    const a = [0, yt, zt + 0.12], b = [0, yt, zt - 0.005], c = [0, yt + 0.125, zt - 0.03], d = [0, yt + 0.1, zt + 0.045];
    F.stick(a, d, 0.004, 0, [0, 0, 1]); F.stick(d, c, 0.004, 0, [0, 1, 0]); F.stick(c, b, 0.004, 0, [0, 0, 1]);
    F.stick([0, yt + 0.055, zt + 0.08], [0, yt + 0.06, zt - 0.015], 0.0026, 1, [0, 1, 0]);
    S.quad(a, b, c, d, [0, 0, 2, 2], 1, { slack: [0, 0, 0.4, 0.3] });
  }
  if (type === 0) {                               // wire legs and wheels
    for (const sx of [-1, 1]) {
      const a = [sx * 0.035, -0.035, 0.19], b = [sx * 0.095, -0.15, 0.225]; F.stick2(a, b, 0.0022, 0);
      const w = []; for (let q = 0; q < 10; q++) w.push([b[0], b[1] + 0.024 * Math.cos(q * 0.6283), b[2] + 0.024 * Math.sin(q * 0.6283)]);
      F.plate(w, 0); F.stick(a, [-a[0], a[1], a[2]], 0.002, 0, [0, 0, 1]);
    }
  }
  { const s0 = st[0], e = st[st.length - 1];                                    // nose block and stern post
    F.plate([C(s0, -1, -1), C(s0, 1, -1), C(s0, 1, 1), C(s0, -1, 1)], 0);
    F.plate([[-s0[1] * 0.6, s0[2] + 0.008, s0[0] + 0.014], [s0[1] * 0.6, s0[2] + 0.008, s0[0] + 0.014], [s0[1] * 0.6, s0[3] - 0.008, s0[0] + 0.014], [-s0[1] * 0.6, s0[3] - 0.008, s0[0] + 0.014]], 0);
    F.plate([C(e, -1, -1), C(e, 1, -1), C(e, 1, 1), C(e, -1, 1)], 0); }
  // propeller blades (kind 3), fan disc (part 2) and the rubber skein (kind 2)
  const hy = (st[0][2] + st[0][3]) / 2, hz = st[0][0] + 0.014, bl = type === 1 ? 0.1 : 0.135;
  for (const sg of [-1, 1]) F.plate([[-0.004 * sg, hy + 0.012 * sg, hz], [0.017 * sg, hy + 0.45 * bl * sg, hz], [0.012 * sg, hy + bl * sg, hz], [-0.012 * sg, hy + 0.96 * bl * sg, hz], [-0.015 * sg, hy + 0.4 * bl * sg, hz]], 3);
  S.quad([-bl, hy - bl, hz], [bl, hy - bl, hz], [bl, hy + bl, hz], [-bl, hy + bl, hz], [-1, -1, 1, 1], 2);
  const peg = st[st.length - 2], zp = peg[0] + 0.02, yp = (peg[2] + peg[3]) / 2, SEG = 6, hwS = 0.0062;
  for (let j = 0; j < SEG; j++) {
    const z0 = lerp(st[0][0], zp, j / SEG), z1 = lerp(st[0][0], zp, (j + 1) / SEG), y0 = lerp(hy, yp, j / SEG), y1 = lerp(hy, yp, (j + 1) / SEG);
    for (const sd of [[hwS, 0, 0], [0, hwS, 0]]) {
      const a = F._v(0, y0, z0, -sd[0], -sd[1], 0, 2), b = F._v(0, y0, z0, sd[0], sd[1], 0, 2), c = F._v(0, y1, z1, sd[0], sd[1], 0, 2), d = F._v(0, y1, z1, -sd[0], -sd[1], 0, 2);
      F.i.push(a, b, c, a, c, d);
    }
  }
  return { F, S, hub: [hy, hz], skein: [st[0][0], zp] };
}

// ---------------------------------------------------------------------------------------------------------
// The unfinished hill: formers (a top chord across x every BAY metres of z) and stringers along z, lying on a
// paper lining LINE_UNDER below them (what the lining would hide is not built); skinned in olive on the lower
// slopes; the crest is bare sheet balsa, where the lemon sheet (front-driven) is being laid.
const BAY = 4;
export const BODY = 1;                                 // the body of a made thing's paper: 1, it hides what is behind it (nothing made here is see-through)
export const BARE = [8, 14];                           // the airship's bare stretch: rings 8 to 14 of its 20 carry no paper
export const FORM = 1;                                 // how fully a hill's paper takes the low sun's side (tissueMaterial's opts.form)
export const LINE_UNDER = 0.3;                         // a hill's paper lining lies this far under its top chords, so its ribs lie on it
const OPEN = 7;                                       // radius of the opening in the airship's nose ring; the ring is built from it
export const AIRSHIP = { length: 120, open: OPEN };   // for the world: the hull's length (its route down the axis) and the portal's radius
// the shade of a lining at a place of slope (dh/dx, dh/dz) under a sun in the direction sun [x, y, z]: 0 turned away .. 0.99 square to it
export function liningShade(dhdx, dhdz, sun) {
  const s = 0.5 + 0.5 * (-dhdx * sun[0] + sun[1] - dhdz * sun[2]) / Math.hypot(dhdx, 1, dhdz);
  return 0.99 * smoothstep(0.15, 0.95, s);
}
// a hill's paper at a place of that shade: its colour in the hour's light, cool and dim turned away, warm and full square to the sun
export function shadeTint(col, s) { return { r: col.r * lerp(0.22, 1.06, s), g: col.g * lerp(0.36, 1.02, s), b: col.b * lerp(0.95, 0.86, s) }; }
async function buildHill(ctx, rng, noise, o) {
  const { H, RX, RZ, olive, lemon, crestAt, sun } = o;
  const NX = Math.ceil(RX / BAY) + 1, NZ = Math.ceil(RZ / BAY) + 1;
  const lump = rng.range(0.6, 1.4), sx = rng.range(-6, 6), sz = rng.range(-5, 5), sh = rng.range(0.25, 0.5);
  const heightAt = (x, z) => {
    const r = Math.hypot((x - sx * 0.3) / RX, (z - sz * 0.3) / RZ);
    if (r >= 1) return 0;
    const b = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * r), 0.85);
    const sec = sh * Math.exp(-(((x - 18 - sx) / 16) ** 2) - (((z + 10 - sz) / 18) ** 2));       // a shoulder, for an uneven outline
    const n = noise.fbm2(x * 0.035 + 11, z * 0.035 - 4, 3) * 2.2 * lump * smoothstep(0, 0.5, 1 - r);
    return Math.max(0, H * Math.min(1, b + sec * (1 - b) * 1.2) * (1 - 0.06 * lump) + n * Math.min(1, b * 3));
  };
  const hgt = [], ix = (i, j) => (j + NZ) * (2 * NX + 1) + (i + NX);
  for (let j = -NZ; j <= NZ; j++) for (let i = -NX; i <= NX; i++) hgt[ix(i, j)] = heightAt(i * BAY, j * BAY);
  const hy = (i, j) => (Math.abs(i) > NX || Math.abs(j) > NZ ? 0 : hgt[ix(i, j)]);
  const jig = (i, j, a) => 0.22 * Math.sin(i * 12.9 + j * 78.2 + a * 37.7);      // the hand: nothing quite on the grid
  const P = (i, j) => {
    let x = i * BAY + jig(i, j, 1), z = j * BAY + jig(i, j, 2);
    const cx = sx * 0.3, cz = sz * 0.3, r = Math.hypot((x - cx) / RX, (z - cz) / RZ);
    if (r > 0.985) { x = cx + (x - cx) / r * 0.985; z = cz + (z - cz) / r * 0.985; return [x, 0.02, z]; }
    return [x, Math.max(0.02, hy(i, j)), z];
  };
  const inside = (i, j) => Math.hypot((i * BAY - sx * 0.3) / RX, (j * BAY - sz * 0.3) / RZ) < 0.985;
  const F = new Sticks(), SO = new Skins(false), SL = new Skins(false), B = new Sticks();
  const D = [-0.6, 0, -0.8];                               // the way the sheet travels over the crest
  const fr = (p) => p[0] * D[0] + p[2] * D[2];
  let fmin = 1e9, fmax = -1e9; const crest = [];
  for (let j = -NZ; j <= NZ; j++) {
    for (let i = -NX; i < NX; i++) {
      const a = P(i, j), b = P(i + 1, j);
      if (!inside(i, j) && !inside(i + 1, j)) continue;
      const bare = Math.max(a[1], b[1]) > crestAt * H - 3;
      F.stick2(a, b, bare ? 0.16 : 0.13, 0);                                          // former top chord (a little stouter on the bare crest); what lies under the lining is not built
    }
    await ctx.yield();
  }
  for (let i = -NX; i <= NX; i++) {
    for (let j = -NZ; j < NZ; j++) {
      const a = P(i, j), b = P(i, j + 1);
      if (!inside(i, j) && !inside(i, j + 1)) continue;
      F.stick2(a, b, 0.085, 1);                                                       // stringer
    }
    await ctx.yield();
  }
  for (let j = -NZ; j < NZ; j++) {
    for (let i = -NX; i < NX; i++) {
      const p00 = P(i, j), p10 = P(i + 1, j), p11 = P(i + 1, j + 1), p01 = P(i, j + 1);
      const hm = Math.max(p00[1], p10[1], p11[1], p01[1]);
      if (!inside(i, j) && !inside(i + 1, j) && !inside(i + 1, j + 1) && !inside(i, j + 1)) continue;
      const wood = hm >= crestAt * H - 1.5 ? 6 : 4;        // above the olive's contour the crest is bare sheet balsa until the lemon sheet is laid
      if (hm > 0.3) B.plate([[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => { const q = P(a, b); return [q[0], Math.max(0.02, q[1] - LINE_UNDER), q[2]]; }),
        [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => wood + liningShade((hy(a + 1, b) - hy(a - 1, b)) / (2 * BAY), (hy(a, b + 1) - hy(a, b - 1)) / (2 * BAY), sun)));   // the lining, close under the top chords
      const hc = (p00[1] + p10[1] + p11[1] + p01[1]) / 4, hn = Math.min(p00[1], p10[1], p11[1], p01[1]), yc = crestAt * H;
      const shd = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => liningShade((hy(a + 1, b) - hy(a - 1, b)) / (2 * BAY), (hy(a, b + 1) - hy(a, b - 1)) / (2 * BAY), sun));
      if (hn < yc + 1.5) {                                   // olive: its upper edge is a height contour (aFront = height)
        const sl = 0.5 * smoothstep(0.55, 0.95, Math.abs(Math.sin(i * 3.3 + j * 5.1)));   // a slack corner here and there
        SO.quad(p00, p10, p11, p01, [i, j, i + 1, j + 1], olive, { slack: [0, 0, sl, 0], front: [p00[1], p10[1], p11[1], p01[1]], sag: [0, -0.5, 0], cols: shd.map((q) => shadeTint(olive, q)) });
      }
      if (hm > yc - 1.5) {                                   // the lemon sheet: travel coordinate, pushed out of range below the contour
        const f = [p00, p10, p11, p01].map((q) => fr(q) + 40 * Math.max(0, yc - q[1]));
        const f0 = [fr(p00), fr(p10), fr(p11), fr(p01)];
        fmin = Math.min(fmin, ...f0); fmax = Math.max(fmax, ...f0);
        SL.quad(p00, p10, p11, p01, [i, j, i + 1, j + 1], lemon, { front: f, sag: [0, -0.75, 0], cols: shd.map((q) => shadeTint(lemon, 0.35 + 0.65 * q)) });
        if (hc > yc) crest.push([(p00[0] + p11[0]) / 2, hc, (p00[2] + p11[2]) / 2]);
      }
    }
    await ctx.yield();
  }
  return { F, SO, SL, B, heightAt, D, fmin, fmax, crest, yc: crestAt * H };
}

// MIST: soft pale quads that show only inside a band riding a front. Instanced: aPos (surface point), aSeed
// (vec4: size m, drift phase, rise m, front coordinate). uniform uMist = (front position, band half-width, 0, 0).
export function mistMaterial(U, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPix: U.uPix, uFadeHalf: U.uFadeHalf, uSunDir: U.uSunDir, uHoney: U.uHoney, uUmber: U.uUmber, uPeach: U.uPeach, uLilac: U.uLilac, uHot: U.uHot, uEarth: U.uEarth,
      uMist: { value: opts.mistUniform || new THREE.Vector4(0, 4, 0, 0) }, uStrength: { value: opts.strength ?? 1 } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aSeed; uniform vec4 uMist; varying vec2 vUv; varying float vA;
      ${STYLE_GLSL}
      void main(){
        float band = 1. - smoothstep(0.2, 1., abs(aSeed.w - uMist.x) / max(uMist.y, 0.1));
        float t = uTime * 0.35 + aSeed.y * 6.283;
        vec3 c = aPos + vec3(sin(t) * 0.8, aSeed.z * (0.6 + 0.4 * sin(t * 0.7 + 1.)), cos(t * 0.8) * 0.8);
        vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.);
        float size = max(aSeed.x, 6. * uPix * abs(mv.z)) * (0.6 + 0.4 * band);
        mv.xy += position.xy * size; vUv = position.xy; vA = band * (0.5 + 0.5 * tbHash1(aSeed.y * 31.));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vA; uniform float uStrength;
      ${STYLE_GLSL}
      void main(){
        float r = dot(vUv, vUv); float a = (1. - smoothstep(0.05, 1., r)); a *= a * vA * 0.11 * uStrength;
        gl_FragColor = vec4(mix(uPeach, vec3(1.), 0.72), a);
      }`,
  });
}

// The long shadows of the hour: flat quads laid on the level ground, each from the foot of an upright thing straight away
// from the sun (aSt: -1..1 across, 0..1 from foot to tip, and its kind: 0 a tree's, 1 a hill's). Drawn as a multiply over the ground's papers, after all balsa
// and before the papers that stand on the ground (so the foot of a stick standing before it is darkened with the ground, and a blade,
// tree or tent standing in it keeps its own light; where two cross, the ground is darkened twice); pulled toward the eye in depth only
// (0.9 m), as a paper's lift is, so it lies on the ground from every side.
export function shadeMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPix: U.uPix, uFadeHalf: U.uFadeHalf, uSunDir: U.uSunDir, uHoney: U.uHoney, uUmber: U.uUmber, uPeach: U.uPeach, uLilac: U.uLilac, uHot: U.uHot, uEarth: U.uEarth },
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`
      attribute vec3 aSt; varying vec3 vSt; varying vec3 vW;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vSt = aSt;
        vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv;
        float len = max(length(mv.xyz), 1e-3);
        vec4 p2 = projectionMatrix * vec4(mv.xyz * (1. - min(0.9 / len, 0.5)), 1.);
        gl_Position.z = p2.z / max(p2.w, 1e-4) * gl_Position.w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vSt; varying vec3 vW;
      ${STYLE_GLSL}
      void main(){
        float t = vSt.y, s = abs(vSt.x);
        float wv = vSt.z > 0.5 ? sqrt(max(1. - t * t, 0.))                                         // a hill's: a mound, from its middle to its tip
          : mix(0.14, 1., smoothstep(0.06, 0.3, t)) * (1. - 0.8 * smoothstep(0.5, 1., t));         // a tree's: a thin trunk, then the crown, drawn out to a point
        float soft = 0.15 + 0.6 * t;                                                                  // its edge softer the further it falls
        float a = (1. - smoothstep(wv * (1. - soft), wv, s)) * (1. - smoothstep(0.75, 1., t)) * smoothstep(0., 0.02, t);
        a *= 1. - tbFade(length(vW - cameraPosition));
        gl_FragColor = vec4(mix(vec3(1.), vec3(0.58, 0.64, 0.84), (vSt.z > 0.5 ? 0.62 : 0.8) * a), 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------
// The airship frame, built about its NOSE RING (z = 0 at the nose, stern at z = -L; +Z is the way we fly,
// +X is our left (the sunward side on an evening or golden visit; at dawn the sun stands over the nose)). Its paper is in
// gores two bays wide, a colour of the visit and a pale cream paper by turns, the nose cap in one of the visit's colours and the
// pale paper by turns. ON THE STERN'S PAPERED RINGS (aft of the bare stretch, rings 0 to BARE[0]) THE PAPER OF OUR LOWER RIGHT
// IS NOT YET ON: the six bays below the three open bays, down to but not including the keel's gore (bays OPEN_TO + 1 = 16 to
// NS - 3 = 21), keep their paper from the stern's ring to the first main ring former forward of it (ring STERN_TO = 2: the
// main formers are every second ring) and are frame from there to the bare stretch (round 13: the brief's bare right side,
// away from the evening's sun; ONE edge with ONE step, so no gore's paper stands proud of its neighbour and no paper stands
// between two openings; the stern's mouth is papered all round but for the three open bays, the left half and the keel's
// gore are papered whole to the bare stretch, the nose's papered rings and the nose cap are papered whole; no paper is made
// see-through, hidden or switched: the quads are not built, on every seed, for the whole visit). On the way in the eye is
// below the hull and on its right, so through the frame of the stern's near flank one sees the lit inside of its far wall.
// Open as before: three bays high on our right (13 to 15) and a bare stretch of its middle (rings 8 to 14, BARE: 36 m of
// frame all round, the paper not yet on). Ring formers every 6 m: an outer and an
// inner ring joined by posts (no diagonals); 24 main stringers and 24 fine ones between; the tail cone is not built, so the
// stern is an open ring.
async function buildAirship(ctx, rng, o) {
  const { L, white, gores = [white, white, white], sunXY = [0.9, 0.3] } = o, NR = Math.round(L / 6), NS = 24;
  // a gore's paper is shaded once, at the build, by where it lies round the girth: full toward the sun, dimmer turned away
  const girth = (m, c) => { const a = ((m + 0.5) / NS) * Math.PI * 2 - Math.PI / 2, k = 0.55 + 0.57 * smoothstep(-0.55, 0.7, Math.cos(a) * sunXY[0] + Math.sin(a) * sunXY[1]); return { r: c.r * k, g: c.g * k, b: c.b * lerp(1, k, 0.7) }; };
  const F = new Sticks(), S = new Skins(false), OPEN_FROM = 13, OPEN_TO = 15, BARE_FROM = BARE[0], BARE_TO = BARE[1], STERN_TO = 2;   // bay 0 is at the keel, 6 on our left, 12 at the top, 18 on our right; STERN_TO: the first main ring former forward of the stern's ring (the main formers are every second ring), where the paper of our lower right ends
  const R = (s) => { const u = s / L; return u < 0.55 ? 10 + 3 * smoothstep(0, 0.3, u) : 13 - (12.2 - OPEN) * Math.pow((u - 0.55) / 0.45, 1.6); };   // nose ring: OPEN + 0.8 outside, at least OPEN + 0.15 inside
  const node = (k, m, inset = 0) => {
    const s = k * 6, a = (m / NS) * Math.PI * 2 - Math.PI / 2, r = R(s) - inset + 0.12 * Math.sin(k * 7.7 + m * 3.1);
    return [r * Math.cos(a), r * Math.sin(a), s - L + 0.1 * Math.sin(m * 5.3 + k)];
  };
  for (let k = 0; k <= NR; k++) {
    const main = k % 2 === 0 || k === NR, nose = k === NR, din = nose ? 0.45 : main ? 1.15 : 0.8;
    for (let m = 0; m < NS; m++) {
      const a = node(k, m), b = node(k, m + 1), a2 = node(k, m, din), b2 = node(k, m + 1, din);
      F.stick2(a, b, nose ? 0.2 : main ? 0.15 : 0.11, 0);
      F.stick(a2, b2, nose ? 0.16 : 0.085, 0, [0, 0, 1]);
      F.stick(a, a2, 0.06, 1, [0, 0, 1]);
    }
    await ctx.yield();
  }
  for (let m = 0; m < NS; m++) {
    for (let k = 0; k < NR; k++) {
      const a = node(k, m), b = node(k + 1, m);
      F.stick2(a, b, 0.095, 0);
      const c = node(k, m + 1), d = node(k + 1, m + 1), h0 = [0, 1, 2].map((q) => (a[q] + c[q]) / 2 * 1.006), h1 = [0, 1, 2].map((q) => (b[q] + d[q]) / 2 * 1.006);
      h0[2] = (a[2] + c[2]) / 2; h1[2] = (b[2] + d[2]) / 2;
      F.stick(h0, h1, 0.05, 1, [c[0] - a[0], c[1] - a[1], 0]);                         // fine stringer between
      if ((m < OPEN_FROM || m > OPEN_TO) && (k < BARE_FROM || k >= BARE_TO) && !(m > OPEN_TO && m < NS - 2 && k >= STERN_TO && k < BARE_FROM)) {   // covered but for three bays high on our right, the bare stretch of its middle and, on the stern, the six bays below the open bays from the first main former to the bare stretch, where the paper is not yet on
        const g = Math.floor(m / 2), band = k < 6 ? 0 : k < 12 ? 1 : 2;
        const col = g % 2 ? white : k >= NR - 3 ? gores[2 % gores.length] : gores[(g / 2 + 2 * band) % gores.length];       // gores two bays wide, a colour and the pale paper by turns, the colours by turns in three bands down the hull where the visit brings four of them (the stern's and the nose's bands alike, the middle band two colours on; with two or one every band is alike); the nose cap striped the same way in its one colour
        S.quad(a, c, d, b, [2 * m, k, 2 * m + 2, k + 1], girth(m, col));
      }
    }
    await ctx.yield();
  }
  return { F, S, R };
}

// The dome (the world's sky; the hero only makes one when previewed alone or with opts.dome).
// It carries no line; the evening's cloud is painted on it in long thin bars above the far ranges.
// A sphere drawn about the camera (the vertex shader adds cameraPosition).
export function domeMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPix: U.uPix, uFadeHalf: U.uFadeHalf, uSunDir: U.uSunDir, uHoney: U.uHoney, uUmber: U.uUmber, uPeach: U.uPeach, uLilac: U.uLilac, uHot: U.uHot, uEarth: U.uEarth },
    side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      varying vec3 vD;
      ${STYLE_GLSL}
      void main(){
        vec3 d = vD / max(length(vD), 1e-4);
        vec3 c = tbDome(d);
        // the evening's cloud, painted on the dome: long thin bars lying across the sky above the far ranges, lit from under by
        // the hour on the sun's side and mauve away from it, thinning out overhead, drifting slowly (the dome carries no line)
        float dr = uTime * 0.003;
        float n = 0.6 * tbNoise(vec2(d.x * 3.2 + d.z * 1.1 + dr, d.y * 21.) + 11.) + 0.4 * tbNoise(vec2(d.z * 3.4 - d.x * 1.2 - dr, d.y * 29.) + 4.7);
        float cl = smoothstep(0.5, 0.74, n) * smoothstep(0.27, 0.38, d.y) * (1. - smoothstep(0.52, 0.85, d.y));
        vec3 cc = mix(uLilac * vec3(0.84, 0.76, 0.95), mix(uPeach, uHot, 0.65) * 1.06, 0.25 + 0.75 * smoothstep(-0.3, 0.9, dot(d, uSunDir)));
        c = mix(c, cc, 0.55 * cl);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
}

// One instanced flock of one model type: frame, skin and scatter meshes placed by HELIX_GLSL. list items:
// { span, r, h, th, rate, climb, free (-1 | slot), a, b (THREE.Color pigments), lo, hi (its own range of climb, optional),
// origin [x, y, z] (o.origin only), hp (o.law only: the height its share of the range would be at a steady climb; h is where it is at clock 0) }. U: the visit's uniform set.
function flockMeshes(U, list, mp, type, o) {
  const n = list.length;
  const helix = new Float32Array(n * 4), model = new Float32Array(n * 4), ca = new Float32Array(n * 3), cb = new Float32Array(n * 3), org = new Float32Array(n * 3), range = new Float32Array(n * 2);
  list.forEach((m, i) => {
    helix.set([m.r, m.hp ?? m.h, m.th, m.rate], i * 4); model.set([m.span, m.seed ?? (i * 0.618 + type * 0.37) % 1, m.free, m.climb], i * 4);
    ca.set([m.a.r, m.a.g, m.a.b], i * 3); cb.set([m.b.r, m.b.g, m.b.b], i * 3);
    if (m.origin) org.set(m.origin, i * 3);
    if (m.hi > m.lo) range.set([m.lo, m.hi], i * 2);
  });
  const inst = (g, cols) => {
    g.setAttribute('aHelix', new THREE.InstancedBufferAttribute(helix, 4)); g.setAttribute('aModel', new THREE.InstancedBufferAttribute(model, 4));
    g.setAttribute('aRange', new THREE.InstancedBufferAttribute(range, 2));
    if (o.origin) g.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(org, 3));
    if (cols) { g.setAttribute('aColA', new THREE.InstancedBufferAttribute(ca, 3)); g.setAttribute('aColB', new THREE.InstancedBufferAttribute(cb, 3)); }
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 150, 0), 400); return g;
  };
  const gF = inst(mp.F.geometry(THREE.InstancedBufferGeometry), false), gS = inst(mp.S.geometry(THREE.InstancedBufferGeometry), true);
  const gX = inst(mp.S.geometry(THREE.InstancedBufferGeometry), true);   // the whole skin scatters (seen side-on a model is mostly fuselage)
  const mo = { helix: true, origin: !!o.origin, col: o.col, law: o.law, hub: mp.hub, skein: mp.skein, bay: [1, 1 / 9], lift: o.lift ?? 0.05, minPx: o.minPx };
  const mF = new THREE.Mesh(gF, balsaMaterial(U, mo)), mS = new THREE.Mesh(gS, tissueMaterial(U, { ...mo, ink: o.ink, body: o.body ?? BODY })), mX = new THREE.Mesh(gX, tissueMaterial(U, { ...mo, scatter: true, gain: o.gain, body: o.body ?? BODY }));
  mS.material.uniforms.uBay.value.set(0.67, 0.44); mX.material.uniforms.uBay.value.set(0.67, 0.44);   // metres per bay on an 8 m model
  mS.renderOrder = 1; mX.renderOrder = 2;
  for (const m of [mF, mS, mX]) m.frustumCulled = false;
  return [mF, mS, mX];
}
// For the world: its own flocks (thistledown, climbers, the ride) built from the same three models.
// type 0 cabin | 1 pylon | 2 wing; o: { col: Vector4(bottom, top, bank, power), origin: bool, lift, ink, gain }.
export function buildFlock(U, list, type, rng, o = {}) {
  return flockMeshes(U, list, modelParts(type, rng), type, { ...o, col: o.col || new THREE.Vector4(0, 300, 0.35, 0) });
}

const COLOURWAYS = [
  ['white', 'lemon', 'orange', 'red', 'blue', 'olive'],
  ['red', 'white', 'red', 'white'],
  ['lemon', 'blue', 'lemon', 'blue', 'white'],
];

// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('thermal') : ctx.rng, noise = ctx.noise;
  const pal = opts.palette || PALETTE, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const U = makeUniforms();                              // this visit's own set: every material of the hero and of the world is made with it
  U.uHoney.value.copy(v3(lin(pal[0]))); U.uPeach.value.copy(v3(lin(pal[1]))); U.uLilac.value.copy(v3(lin(pal[2])));
  const tis = { white: lin(TISSUE.white), lemon: lin(pal[4]), orange: lin(TISSUE.orange), red: lin(pal[3]), blue: lin(pal[5]), olive: lin(pal[6]) };
  const preview = opts.dome ?? true;   // the dome is drawn unless the caller has its own (the world passes dome: false)
  const root = new THREE.Group(); root.name = 'thermal';
  const H = 40, colBottom = 46, colTop = 300, bank = 0.35;
  const colU = new THREE.Vector4(colBottom, colTop, bank, 0);
  const circle = { radius: opts.circleRadius ?? 30, y0: opts.circleY0 ?? 50, y1: opts.circleY1 ?? 78 };
  const way = COLOURWAYS[opts.colourway ?? (rng.chance(0.6) ? 0 : rng.chance(0.5) ? 1 : 2)];
  const cast = opts.cast ?? rng.pick([[0.6, 0.3, 0.1], [0.3, 0.6, 0.1], [0.4, 0.27, 0.33]]);
  const count = Math.round(opts.count ?? rng.range(220, 300));
  const armN = 2, pitch = rng.range(0.05, 0.068);
  // keep-out annuli: the camera's circle, and the height band of the airship on the outside of the column
  const AL = AIRSHIP.length, shipOn = opts.airship !== false, shipO = opts.airship || {};
  const shipHead = shipO.heading ?? Math.PI - (25 * Math.PI) / 180;                 // way we fly it: (sin a, 0, cos a)
  const shipDir = new THREE.Vector3(Math.sin(shipHead), 0, Math.cos(shipHead));
  const stern = new THREE.Vector3(...(shipO.stern || [circle.radius + 19, circle.y1 + 2, -51]));
  const nose = stern.clone().addScaledVector(shipDir, AL);
  const keep = [{ r0: circle.radius - 7, r1: circle.radius + 8, y0: circle.y0 - 9, y1: circle.y1 + 9 },
    { r0: circle.radius + 6, r1: circle.radius + 25, y0: circle.y1 - 24, y1: circle.y1 + 11 }];   // the circle; the way out of it to the airship's stern, with the air under it where the world's waiting models circle
  if (shipOn) {
    let rm = 1e9; for (let i = 0; i <= 12; i++) { const q = stern.clone().addScaledVector(shipDir, (AL * i) / 12); rm = Math.min(rm, Math.hypot(q.x, q.z)); }
    keep.push({ r0: rm - 17, r1: 1e4, y0: stern.y - 23, y1: stern.y + 23 });
  }

  // The flown line through the column, when the world gives it (opts.flown: local points about a metre apart).
  // No model's whole ring of wander (its breathing radius, its bob, its whole range of climb, the rare sink; the
  // model as a ball of its furthest point) comes within 2 m of that line. By place, at the build; no clock is read.
  const flown = opts.flown || null;
  const BALL = [0.73, 0.79, 0.6], AIR = 2.1, SINK = 9;      // furthest point of a model from its centre, in spans, by type; the sink of the rare wave
  const ringClear = (type, span, r, lo, hi) => {             // the ring at radius r swept through the heights lo..hi
    if (!flown) return true;
    const e = BALL[type] * span + AIR, r0 = r * 0.95, r1 = r * 1.05, bob = 0.06 * span;
    const sink = r + 0.5 * span <= 22 ? Math.min(26, Math.max(lo + bob - 54, 0)) : SINK;      // as the helix sinks it (HELIX_GLSL)
    const y0 = lo - bob - sink, y1 = hi + bob;
    for (const p of flown) { const rp = Math.hypot(p.x, p.z), dr = Math.max(0, r0 - rp, rp - r1), dy = Math.max(0, y0 - p.y, p.y - y1); if (dr * dr + dy * dy < e * e) return false; }
    return true;
  };

  // ---- the three hundred models: three types, each a frame, a skin and a scatter draw --------------------
  // A model whose radius touches no keep-out band climbs the whole column. One that does stands where it was dealt
  // when that is under every band of its radius; else it climbs in its own range, from the lowest clear height above
  // those bands to the column's top. Where no range is clear it is not built.
  const per = [[], [], []]; let unbuilt = 0;
  const LAW = 3, law = (s) => (Math.exp(LAW * s) - 1) / (Math.exp(LAW) - 1);   // (round 10) HELIX_GLSL's uLaw: slow low, fast high
  const wayId = COLOURWAYS.indexOf(way);
  per[0].push({ span: 14, r: circle.radius + 2, h: 64, th: 0, rate: 0.3, climb: 0, free: 0, a: [tis.orange, tis.red, tis.blue][wayId], b: [tis.white, tis.white, tis.lemon][wayId] });
  per[0].push({ span: 8, r: circle.radius - 9, h: 58, th: 2, rate: 0.4, climb: 0, free: 1, a: [tis.lemon, tis.white, tis.lemon][wayId], b: [tis.lemon, tis.white, tis.lemon][wayId] });
  for (let i = 2; i < count; i++) {
    const t = rng(), type = t < cast[0] ? 0 : t < cast[0] + cast[1] ? 1 : 2;
    const q = Math.pow(rng(), 1.1), span = 2.6 + 11.4 * q;
    let r = lerp(9, 57, Math.pow(q, 0.8)) + rng.gauss() * 2.5; r = clamp(r, 6, 60 - span * 0.3);
    // (round 10) a model is dealt its SHARE of the range evenly, and the height of that share is the helix's own law (LAW):
    // more of the three hundred are low over the camera's circle, so the image looks up into models near enough to read as
    // aeroplanes, and they are as many at any moment of the clock. No draw of the dealing is added or moved, no model is
    // made larger, and the column still stands 300 m. (Before: the height itself dealt, with the power 1.7, at a steady climb.)
    const share = rng(); let h = colBottom + (colTop - colBottom) * law(share), hp = colBottom + (colTop - colBottom) * share, climb = rng.range(0.25, 0.7);   // thickest low, where the camera circles
    const arm = rng.int(0, armN - 1), jit = rng.gauss() * 0.16;
    const v = 5 + 0.45 * span, ca = rng.pick(way), cb = rng.chance(0.55) ? rng.pick(way) : ca, vr = rng.range(0.92, 1.08);
    const bands = keep.filter((k) => r + span * 0.5 > k.r0 && r - span * 0.5 < k.r1);
    let lo = 0, hi = 0, clear = !bands.length && ringClear(type, span, r, colBottom, colTop);
    if (!clear) {
      const under = Math.min(colTop, ...bands.map((k) => k.y0)), top = Math.max(colBottom, ...bands.map((k) => k.y1));
      if (h < under - 2 && ringClear(type, span, r, h, h)) { climb = 0; clear = true; }
      for (let y = top; !clear && y <= colTop - 80; y += 4) {
        if (ringClear(type, span, r, y, colTop)) { lo = y; hi = colTop; h = y + law(share) * (colTop - y); hp = y + share * (colTop - y); clear = true; }   // the same share of its own range as it was dealt of the column
      }
    }
    if (clear) { const th = arm * (Math.PI * 2 / armN) + h * pitch + jit; per[type].push({ span, r, h, hp: climb ? hp : h, th, rate: v / r * vr, climb, lo, hi, free: -1, a: tis[ca], b: tis[cb] }); }
    else unbuilt++;
    if (i % 60 === 59) await ctx.yield();
  }
  await ctx.yield();
  // For the world, which lays other aeroplanes about: true when no model of the column, anywhere on its ring and through
  // its whole range of climb (its bob and the rare sink counted, the model as a ball), comes within `reach` of the local
  // place (x, y0..y1, z). By place, from the deal above; the two free models are the world's to place and are not counted.
  const columnClear = (x, y0, y1, z, reach) => {
    const rp = Math.hypot(x, z);
    for (let type = 0; type < 3; type++) for (const m of per[type]) {
      if (m.free >= 0) continue;
      const own = m.hi > m.lo, lo = m.climb ? (own ? m.lo : colBottom) : m.h, hi = m.climb ? (own ? m.hi : colTop) : m.h, bob = 0.06 * m.span;
      const sink = m.r + 0.5 * m.span <= 22 ? Math.min(26, Math.max(lo + bob - 54, 0)) : SINK, e = BALL[type] * m.span + reach;
      const dr = Math.max(0, m.r * 0.95 - rp, rp - m.r * 1.05), dy = Math.max(0, lo - bob - sink - y1, y0 - hi - bob);
      if (dr * dr + dy * dy < e * e) return false;
    }
    return true;
  };
  const modelMeshes = [];
  for (let type = 0; type < 3; type++) {
    const list = per[type], n = list.length; if (!n) continue;
    const mp = modelParts(type, rng); await ctx.yield();
    const [mF, mS, mX] = flockMeshes(U, list, mp, type, { col: colU, law: LAW });
    for (const m of [mF, mS, mX]) { m.frustumCulled = false; root.add(m); modelMeshes.push(m); }
    await ctx.yield();
  }

  // ---- the unfinished hill, its lemon sheet and the mist that pulls it tight ------------------------------
  const hill = await buildHill(ctx, rng, noise, { H, RX: 45, RZ: rng.range(46, 54), olive: opts.grass ? lin(opts.grass) : tis.olive, lemon: tis.lemon, crestAt: opts.crestAt ?? rng.range(0.5, 0.62), sun: opts.sun || [-0.92, 0.19, -0.34] });
  const sheetFront = new THREE.Vector4(0, 0, 3, 1), mistU = new THREE.Vector4(0, 6, 0, 0);
  const hillFrame = new THREE.Mesh(await hill.F.geometryAsync(ctx), balsaMaterial(U, { soft: true }));
  const hillLining = new THREE.Mesh(await hill.B.geometryAsync(ctx), liningMaterial(U));
  const hillSkin = new THREE.Mesh(hill.SO.geometry(THREE.BufferGeometry, true), tissueMaterial(U, { front: true, frontUniform: new THREE.Vector4(hill.yc - 3.5, hill.yc, 2, 0.7), bay: [BAY, BAY], lift: 0.5, far: 0.5, body: BODY, lit: 1, rib: 0.18, marks: 0.2, form: FORM }));
  const gSheet = hill.SL.geometry(THREE.BufferGeometry, true);
  const sheet = new THREE.Mesh(gSheet, tissueMaterial(U, { front: true, frontUniform: sheetFront, bay: [BAY, BAY], lift: 0.6, far: 0.5, body: BODY, lit: 1, rib: 0.3, form: FORM }));
  const sheetX = new THREE.Mesh(gSheet, tissueMaterial(U, { front: true, frontUniform: sheetFront, bay: [BAY, BAY], lift: 0.6, scatter: true, milk: 0.03, gain: 0.8 }));
  hillSkin.renderOrder = 1; sheet.renderOrder = 1; sheetX.renderOrder = 2;
  root.add(hillFrame, hillLining, hillSkin, sheet, sheetX);
  await ctx.yield();
  const NM = Math.round(2500 * detail), mPos = new Float32Array(NM * 3), mSeed = new Float32Array(NM * 4), mrng = rng.fork ? rng.fork('mist') : rng;
  for (let i = 0; i < NM; i++) {
    const c = hill.crest[Math.floor(mrng() * hill.crest.length) % hill.crest.length];
    const x = c[0] + mrng.range(-2.5, 2.5), z = c[2] + mrng.range(-2.5, 2.5);
    mPos.set([x, hill.heightAt(x, z) + 0.4, z], i * 3);
    mSeed.set([mrng.range(1.8, 4.2), mrng(), mrng.range(0.2, 2.2), x * hill.D[0] + z * hill.D[2] + mrng.range(-1, 1)], i * 4);
    if (i % 150 === 149) await ctx.yield();
  }
  const gMist = new THREE.InstancedBufferGeometry();
  gMist.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); gMist.setIndex([0, 1, 2, 0, 2, 3]);
  gMist.setAttribute('aPos', new THREE.InstancedBufferAttribute(mPos, 3)); gMist.setAttribute('aSeed', new THREE.InstancedBufferAttribute(mSeed, 4));
  gMist.instanceCount = NM;
  const mist = new THREE.Mesh(gMist, mistMaterial(U, { mistUniform: mistU, strength: 0.03 })); mist.frustumCulled = false; mist.renderOrder = 3; root.add(mist);

  // ---- the airship frame -----------------------------------------------------------------------------------
  const ship = new THREE.Group(); ship.name = 'airship'; ship.position.copy(nose); ship.rotation.y = shipHead;
  let hullR = null;
  if (shipOn) {
    const gc = [...new Set(way.filter((c) => c !== 'white' && c !== 'olive'))], gores = gc.map((c) => tis[c]);       // the visit's own colours
    const sn = opts.sun || [-0.92, 0.19, -0.34];
    const A = await buildAirship(ctx, rng, { L: AL, white: tis.lemon.clone().lerp(new THREE.Color(1, 1, 1), 0.62), gores,
      sunXY: [sn[0] * Math.cos(shipHead) - sn[2] * Math.sin(shipHead), sn[1]] });   // the hull's pale paper is a cream
    hullR = A.R;
    const aF = new THREE.Mesh(await A.F.geometryAsync(ctx), balsaMaterial(U));
    const gA = A.S.geometry();
    const aS = new THREE.Mesh(gA, tissueMaterial(U, { bay: [1.7, 6], lift: 0.45, body: BODY, far: 0.4, tunnel: Math.round(AL / 6), bare: BARE, marks: 0.45 }));     // the hull's paper carries no additive pass: its light is its own, by place
    aS.renderOrder = 1; ship.add(aF, aS); root.add(ship);
    await ctx.yield();
  }
  let dome = null;
  if (preview) { dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), domeMaterial(U)); dome.frustumCulled = false; dome.renderOrder = -0.5; root.add(dome); }

  // ---- progress: the world calls setProgress(sheet, wave) every frame with two numbers 0..1 that it works out from
  // where the eye is (a place, never a share of the flight): how far the lemon sheet is laid over the crest (the
  // mist rides its front), and how far the rare dethermaliser wave has fallen down the column.
  const bare = opts.bare ?? rng.range(0.22, 0.5), fspan = hill.fmax - hill.fmin;
  const rare = opts.dethermalise ?? rng.chance(0.12);
  let driven = false, freeSet = [false, false, false], spin = [1.5708, 1.5708, 1.5708];   // a free model's blades stand level until its motor has turned them
  function applyProgress(sheetK, waveK) {
    const cover = lerp(hill.fmin + 0.14 * fspan, hill.fmin + (1 - bare) * fspan, sheetK);
    sheetFront.set(cover - 9, cover, 2.5, 1); mistU.set(cover - 6.5, 7.5, 0, 0);
    U.uPop.value.set(rare ? lerp(colTop + 12, colBottom - 30, waveK) : 1e4, rare ? 1 : 0);   // at 0 the front is over every model: nothing has sunk
  }
  applyProgress(0, 0);
  const _inv = new THREE.Matrix4(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _u = new THREE.Vector3(), _p = new THREE.Vector3();
  // free models: slot 0 the 14 m orange (the overhead pass), slot 1 the 8 m lemon (the companion). Position and
  // forward are in WORLD space; bank in radians (left wing down positive); wind 0 = wound and running, 1 = spent.
  function setFree(slot, pos, forward, bankRad = 0, wind = 1) {
    freeSet[slot] = true; root.updateMatrixWorld(); _inv.copy(root.matrixWorld).invert();
    placeFree(slot, _p.copy(pos).applyMatrix4(_inv), _f.copy(forward).transformDirection(_inv), bankRad, wind);
  }
  function placeFree(slot, posL, fwdL, bankRad, wind) {
    _f.copy(fwdL).normalize(); _l.set(0, 1, 0).cross(_f); if (_l.lengthSq() < 1e-6) _l.set(1, 0, 0); _l.normalize(); _u.crossVectors(_f, _l).normalize();
    const c = Math.cos(bankRad), s = Math.sin(bankRad), lx = _l.clone().multiplyScalar(c).addScaledVector(_u, -s), ux = _u.clone().multiplyScalar(c).addScaledVector(_l, s);
    U.uFree.value[slot].makeBasis(lx, ux, _f).setPosition(posL);
    if (slot === 0) U.uFreeWind.value.x = wind; else U.uFreeWind.value.y = wind;
  }
  // slot 2 (the world's ride) is given as a finished matrix in the space of the mesh that draws it
  function setFreeMatrix(slot, m, wind = 1) { freeSet[slot] = true; U.uFree.value[slot].copy(m); U.uFreeWind.value.setComponent(slot, wind); }
  const P3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    axis: P3(0, 0, 0), crest: P3(0, H, 0), columnBottom: colBottom, columnTop: colTop, columnRadius: 60,
    circle: { center: P3(0, 0, 0), radius: circle.radius, y0: circle.y0, y1: circle.y1 },
    portalSeat: shipOn ? { position: nose.clone(), facing: shipDir.clone().negate(), travel: shipDir.clone(), radius: OPEN } : null,
    airship: shipOn ? { stern: stern.clone(), nose: nose.clone(), dir: shipDir.clone(), length: AL, radius: 13 } : null,
    viewpoints: {
      entry: { from: P3(0, 7, 230), at: P3(0, 120, 0) },
      image: { from: P3(-circle.radius * 0.7, lerp(circle.y0, circle.y1, 0.55), circle.radius * 0.7), at: P3(-4, 190, -3) },
      crest: { from: P3(circle.radius, circle.y0 + 2, 6), at: P3(0, H - 4, 0) },
    },
    axisLook: P3(0, lerp(circle.y0, circle.y1, 0.6) + 60, 0),
  };
  function update(dt, time, camera) {
    styleUpdate(U, time, camera, ctx.renderer);
    if (!driven) { const k = 0.5 - 0.5 * Math.cos(time * 0.09); applyProgress(k, k); }   // alone in the viewer: a slow demo on the world's own clock
    for (let s = 0; s < 2; s++) {
      if (!freeSet[s]) {                                                     // demo: circle with the column, motor running down
        const r = s === 0 ? circle.radius + 14 : circle.radius - 10, y = s === 0 ? circle.y1 + 12 : circle.y0 + 4, th = time * (s === 0 ? 0.2 : 0.3) + s * 2.4;
        placeFree(s, _p.set(r * Math.sin(th), y, r * Math.cos(th)), _f.set(Math.cos(th), 0, -Math.sin(th)), bank, s === 0 ? 1 : (time * 0.05) % 1);
      }
    }
    for (let s = 0; s < 3; s++) {
      const w = U.uFreeWind.value.getComponent(s);
      spin[s] = (spin[s] + Math.min(dt, 0.1) * 6.2832 * lerp(1.4, 0, smoothstep(0.45, 0.8, w))) % 6283.2;
      if (w > 0.72) {                                                         // a spent motor stops with its blades level, the nearest such angle, and there they fold
        const level = Math.round((spin[s] - 1.5708) / Math.PI) * Math.PI + 1.5708;
        spin[s] += (level - spin[s]) * (1 - Math.exp(-4 * Math.min(dt, 0.1)));
      }
    }
    U.uFreeSpin.value.set(spin[0], spin[1], spin[2]);
    ship.rotation.y = shipHead + 0.008 * Math.sin(time * 0.17);             // swinging half a degree at its mast (the nose is fixed)
  }
  const view = { r: 62, h: colTop, c: new THREE.Vector3(0, 95, 0) };
  const style = { fadeHalf: STYLE.fadeHalf, uniforms: U, balsa: (o) => balsaMaterial(U, o), lining: () => liningMaterial(U), tissue: (o) => tissueMaterial(U, o), mist: (o) => mistMaterial(U, o), shade: () => shadeMaterial(U),
    dome: () => domeMaterial(U), flock: (list, type, r, o) => buildFlock(U, list, type, r, o) };
  return {
    object: root, radius: view.r, height: view.h, center: view.c, anchors,
    update, setProgress(sheetK, waveK = 0) { driven = true; applyProgress(clamp(sheetK, 0, 1), clamp(waveK, 0, 1)); }, setFree, setFreeMatrix, colourway: wayId, hill,
    style, rare, unbuilt, heightAt: hill.heightAt, columnClear,
    hullInner: (s) => (hullR ? hullR(clamp(s, 0, AL)) - 1.35 : 1e6),      // inside the deepest former (1.15 m) and its sticks' own wander and width
    post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
    dispose() {}, ground: false, groundY: 0,
  };
}
