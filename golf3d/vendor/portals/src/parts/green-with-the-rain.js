// GREEN WITH THE RAIN: the hero set piece and the style kit of the world.
//
// A city beaten from one thin sheet of copper. The hero is the cathedral dome: 70 m across, 90 m to the crown, in
// thirty-two ribbed gores split down the seam that faces +Z: sixteen gores of chalk-mint verdigris on local -X
// (screen left seen from the front), sixteen of oiled new salmon copper on +X inside a scaffold of drawn rod with
// plank walks, ladders and a hoist; a drum of sixteen fretted windows over fire-gilt leaves under a deep cornice;
// the lantern split the same way; and above it the fire-gilt armillary whose equatorial hoop seats the exit portal.
// A thousand folded-sheet jackdaws sit on the old ribs and lift as one when the rain line touches the first rib.
//
// HAND-OFF
//   await buildHero(ctx, opts) -> { object, radius 46, height 144, center, anchors, update(dt, time, camera),
//                                   dispose, ground: false, style, setStoryTime(t), setProgress(u) }
//   opts.palette  seven hex strings in the brief's order: salmon, penny, chocolate, blue-green, mint, gilt, tin
//   opts.detail   0.6..1 (default ctx.quality.detail) thins far rivets, scaffold braces, jackdaws; never the dome
//   opts.style    a style made earlier with makeStyle() so that world and hero share one set of uniforms (then the
//                 world calls style.tick(time, ctx.renderer) each frame); if absent the hero makes and ticks its own
//   opts.sky / opts.rain / opts.paving   add the tin sky dome, a rain box and a paved square. Default: only when no
//                 shared style is passed (the stand-alone part viewer). The world builds its own from skyMaterial /
//                 makeRain / SheetBuilder.
//   opts.cast     'pigeons': the birds are pale new-copper pigeons that clatter up in three waves (default jackdaws)
//   opts.lastSheet  true: the world's rare event. One panel of the first new gore is still bare ribs; the panel hangs
//                 on the hoist, is swung across the scaffold at 29..32.3 s, and a rivet row runs up its edge at 33 s
//   uArm (set by hero.update): the armillary's world centre and radius; after the break its gilt is lit across from
//   the slot's side. gwSkyX(d, 1.) is the sheet of tin itself (crisp creases, flats, the shower's fringe of wire);
//   gwSky(d) = gwSkyX(d, 0.) is the soft version every facet mirrors.
//   Style uniforms the world may set: uSoft (seconds the line takes to wet: 0.5 shower, 5.5 drizzle), uTip (hammer
//                 tone), uSlotW / uSlotCol (the break's size and colour by hour), uBulge / uBulgeA (where the rain
//                 line runs ahead of itself), uBirdPale.
//   Size: plinth r 39.6, drum r 35 to y 41, dome to y 88, lantern to y 106, gilt stem to y 117, armillary centre
//   (0,132,0) with hoops of r 10.5 and a yoke out to x = +-13. Expects a square around it at y 0.
//   Cost (hero alone): about 124k triangles, 6 draw calls, 4 programs (metal, metal instanced, metal rod, birds),
//   no lights, no textures; build about 250-400 ms in steps under 50 ms.
//   Frame: the seam faces +Z, the old mint half is on -X. In the world put it at (0,0,590) with rotation.y = PI:
//   mint is then on screen left as the camera flies +Z. (In three.js, flying +Z, screen left is +X; so the world's
//   rain normal is (-0.94, 0.34): wet where -0.94x + 0.34z < 6.5t - 11, which is the style's default uRainN. The
//   default uSlotDir and uKeyDir are world values for that layout too; see anchors.world.)
//   Progress: call hero.setProgress(u) (or setStoryTime(seconds 0..40)) every frame from the world's update. It
//   drives the shared style: rain front, the slot under the cloud (32.5 s), gusts, and the jackdaws (27.5 s).
//   Never called (the part viewer): the hero loops story seconds 23..37 in its own frame as a demo.
//   anchors (local space): portalSeat {position, normal, radius} = the armillary's centre, the collar's inner
//   radius is 7.15; axis = the polar axis and last camera line (58 degrees up toward -Z); flyThrough = ordered
//   points of a safe camera line (>= 6 m clear) from the square, 9 m off the seam, through the near polar circle
//   and the collar; seam, lantern = points of interest; viewpoints; world = placement and world-space directions.
//
// THE STYLE (exports): unlit, no fog, no shadows, one routine for every surface
//   PALETTE            the seven pigments
//   toSceneColor(hex)  JS: display colour -> scene-linear value that exposure 1 / ACES / sRGB lands back on it
//   TONE_GLSL          GLSL: vec3 gwToScene(vec3 displayLinear), the same inverse per pixel
//   STYLE_GLSL         GLSL (fragment): shared uniforms; gwSky(dir) the hammered tin sky that every facet reflects
//                      (bosses, shower mass, slot); gwRamp(age) salmon-penny-chocolate-blue-green-mint;
//                      gwWetSeconds(P); gwMetal(...) the whole metal look; gwFinish(displayColour, hdr)
//   makeStyle(opts)    the shared uniforms + setStoryTime(t), setRain(nx, nz), setSlot(k), setSlotDir(v), tick()
//   metalMaterial(style, {rod})   THE material of the world. Attributes: aFlat (flat-local x, y, half size, id),
//                      aState (age, shelter, kind 0 copper / 1 gilt / 2 tin, resist), aSurf (u across, v down the
//                      fall, seam spacing: > 0 draws standing seams and rivets in the shader, < 0 only leads the
//                      patina). Works on InstancedMesh (make aState instanced); {rod:true} is the variant for
//                      instanced rods along local Y, kept >= 1.5 px wide (aState.w = 1 loose strip that flutters,
//                      aState.z = 2 a thread of water that runs only where it rains).
//   SheetBuilder       writes those attributes: set(age, shelter, kind, resist), quad(), grid(), tube(), geometry()
//   skyMaterial(style), rainMaterial(style) / makeRain(style, rng, {count, box, length}), birdMaterial(style)
//   storyTimeAt(u)     the brief's pace(u) integrated: path fraction -> story seconds
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#E9946B', '#B4683C', '#57372A', '#2F8F86', '#A8DCC8', '#F3C552', '#B7BCBB'];
const EXPOSURE = 1.0;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------------------
// EXACT COLOUR. The engine shows aces(scene * exposure / 0.6). Everything here is composed in display-linear colour
// and converted to the scene value that lands on it.
const _inv3 = (e) => new THREE.Matrix3().fromArray(e).invert().elements;
const _IN_I = _inv3([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]);
const _OUT_I = _inv3([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]);
const _mul3 = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
function _toSceneArr(d) {
  const y = _mul3(_OUT_I, d.map((c) => clamp(c, 0, 0.95))).map((c) => clamp(c, 0.0004, 0.97));
  const v = y.map((c) => {   // invert the rational fit  y = (v*(v+a)-b) / (v*(c*v+d)+e)
    const A = 0.983729 * c - 1, B = 0.432951 * c - 0.0245786, C = 0.238081 * c + 0.000090537;
    return (-B - Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A);
  });
  return _mul3(_IN_I, v).map((c) => Math.max(c, 0) * 0.6 / EXPOSURE);
}
/** Display colour (hex or THREE.Color, sRGB) -> THREE.Color holding the scene-linear value that displays as it. */
export function toSceneColor(hex) {
  const c = new THREE.Color(hex), s = _toSceneArr([c.r, c.g, c.b]);
  return new THREE.Color(s[0], s[1], s[2]);
}
const _f6 = (m) => m.map((v) => v.toFixed(6)).join(',');
export const TONE_GLSL = /* glsl */`
  vec3 gwToScene(vec3 D){
    vec3 y = clamp(mat3(${_f6(_OUT_I)})*clamp(D, 0., 0.95), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, Cc = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
    return max(mat3(${_f6(_IN_I)})*v, 0.)*${(0.6 / EXPOSURE).toFixed(5)};
  }`;

// ---------------------------------------------------------------------------------------------------------------
// SHARED UNIFORMS. One object for the whole world; every material made from it reads the same values.
/** makeStyle({palette}) -> { uniforms, palette, setStoryTime(t), setRain(nx,nz), setSlot(k), setSlotDir(v), tick(time, renderer) } */
export function makeStyle(opts = {}) {
  const palette = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).slice(0, 7);
  const lin = palette.map((h) => { const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); });
  const uniforms = {
    uTime: { value: 0 },                               // seconds, ambient motion
    uFront: { value: -1e4 },                           // rain front: wet where dot(uRainN, P.xz) < uFront
    uRainN: { value: new THREE.Vector2(-0.94, 0.34) }, // unit normal of the rain line, pointing at the dry side
    uSlot: { value: 0 },                               // 0..1 the break under the cloud
    uSlotDir: { value: new THREE.Vector3(0.928, 0.156, 0.338).normalize() }, // world direction of the slot's middle
    uKeyDir: { value: new THREE.Vector3(-0.55, 0.62, 0.56).normalize() }, // the pale dry sky (starboard, ahead)
    uPal: { value: lin },                              // the seven pigments, display-linear
    uFar: { value: new THREE.Vector2(260, 2400) },     // distance patina: starts, complete (metres)
    uPx: { value: 2 / 450 },                           // 2 / (drawing-buffer height), for minimum mark widths
    uRelease: { value: -1 },                           // seconds since the jackdaws lifted (<0: perched)
    uGust: { value: 0 },                               // 0..1 gust strength (oil-canning, flutter)
    uSlotW: { value: new THREE.Vector2(1, 1) },        // the slot's length and height, times the brief's 30 by 3 degrees
    uSlotCol: { value: new THREE.Vector3().copy(lin[0]).lerp(lin[5], 0.45).multiplyScalar(1.25) },   // bare bright copper, display-linear
    uBulge: { value: new THREE.Vector4(0, 1, 0, 1) },    // where the rain line runs ahead of itself (the world sets it)
    uBulgeA: { value: 0 },
    uBirdPale: { value: 0 },                           // 1: the cast is pale stamped pigeons
    uTip: { value: 4.2 },                              // how strongly a flat's tilt toward the eye brightens it
    uArm: { value: new THREE.Vector4(0, 1e5, 0, 12) },   // the armillary's centre (world) and radius: lit across from the break
    uBowl: { value: 0.13 },                            // the planished bowl: tilt (radians) at a flat's edge
    uSoft: { value: 0.5 },                             // seconds over which the rain line wets (0.5 sharp, 6 drizzle)
  };
  const style = {
    uniforms, palette, storyTime: null,
    /** Story clock in the brief's seconds (0..40): moves the rain front, opens the slot at 32.5 s, lifts the birds at 27.5 s. */
    setStoryTime(t) {
      style.storyTime = t;
      uniforms.uFront.value = 6.5 * t - 11;
      uniforms.uSlot.value = smoothstep(32.5, 35.0, t);
      uniforms.uRelease.value = t - 27.5;
      uniforms.uGust.value = 0.35 + 0.65 * smoothstep(-3, 0.5, t - 27.5) * (1 - 0.5 * smoothstep(34, 39, t));
    },
    setRain(nx, nz) { uniforms.uRainN.value.set(nx, nz).normalize(); },
    setSlot(k) { uniforms.uSlot.value = k; },
    setSlotDir(v) { uniforms.uSlotDir.value.copy(v).normalize(); },
    /** Call once a frame: ambient clock and pixel size. */
    tick(time, renderer) {
      uniforms.uTime.value = time;
      if (renderer) { renderer.getDrawingBufferSize(_v2); uniforms.uPx.value = 2 / Math.max(_v2.y, 1); }
    },
  };
  return style;
}
const _v2 = new THREE.Vector2(), _q = new THREE.Quaternion(), _Y = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------------------------------------------
// THE STYLE IN GLSL. Everything is worked out in display-linear colour; gwFinish() converts to scene values.
export const STYLE_GLSL = /* glsl */`
  uniform float uTime, uFront, uSlot, uPx, uGust, uTip, uSoft, uBowl;
  uniform vec2 uRainN, uFar;
  uniform vec3 uSlotDir, uKeyDir, uSlotCol;
  uniform vec4 uArm;
  uniform vec2 uSlotW;
  uniform vec4 uBulge;
  uniform float uBulgeA;
  uniform vec3 uPal[7];
  ${TONE_GLSL}
  float gwHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
  vec2 gwHash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz)*p3.zy); }
  float gwNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(gwHash(i), gwHash(i + vec2(1., 0.)), f.x), mix(gwHash(i + vec2(0., 1.)), gwHash(i + vec2(1., 1.)), f.x), f.y); }
  vec3 gwTangent(vec3 n){ vec3 t = vec3(n.z, 0., -n.x); float l = dot(t, t); return l > 1e-6 ? t*inversesqrt(l) : vec3(1., 0., 0.); }

  // the break under the cloud: x = the slot itself (30 by 3 degrees), y = a broad lobe round it for facets to catch
  vec2 gwSlot(vec3 d){
    vec3 sr = gwTangent(uSlotDir), su = cross(uSlotDir, sr);
    float a = dot(d, sr), b = dot(d, su), c = dot(d, uSlotDir);
    float core = smoothstep(0.30*uSlotW.x, 0.20*uSlotW.x, abs(a))*smoothstep(0.034*uSlotW.y, 0.016*uSlotW.y, abs(b))*step(0., c);
    float lobe = exp(-(a*a)/(0.20*uSlotW.x*uSlotW.x) - (b*b)/(0.09*uSlotW.y))*smoothstep(-0.1, 0.3, c);
    return vec2(core, lobe)*uSlot;
  }
  // THE SKY: hammered tin. Display-linear colour seen in direction d (unit). Every facet of the city reflects this
  // (sharp 0: the soft version a facet mirrors; sharp 1: the sheet itself, with crisp creases, flats and the fringe).
  // rounded hammer blows: a smooth maximum over the nearest ones (x height, yz slope); no straight edge anywhere
  vec3 gwBoss(vec2 q, float seed){
    vec2 ci = floor(q), cf = q - ci, sg = vec2(0.); float sw = 0., sh = 0.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), c = ci + o + vec2(seed, 0.);
      vec2 r = cf - (o + 0.08 + 0.84*gwHash2(c));
      float hr = gwHash(c + vec2(7.3, 1.9)), rad = mix(0.42, 0.95, hr*hr);
      float amp = rad*1.25*step(0.18, gwHash(c + vec2(3.1, 5.7)));
      float m = max(1. - dot(r, r)/(rad*rad), 0.), h = amp*m*m;
      float w = exp(10.*h); sw += w; sh += w*h; sg += r*(w*(-4.*amp*m/(rad*rad)));
    }
    return vec3(sh, sg)/max(sw, 1e-4);
  }
  vec3 gwSkyX(vec3 d, float sharp){
    float up = d.y, den = abs(up) + 0.55;
    vec2 q = d.xz/den*7.6 + uRainN*(uTime*0.11);
    // the weather has shape: the bosses stand in heaps (crowns planished bright, bellies pewter) and between the
    // heaps the sheet is calm: only planished in small flats, no outline anywhere
    vec2 hq = q*0.15 + vec2(3.7, 1.1);
    vec2 kq = uKeyDir.xz/max(length(uKeyDir.xz), 1e-4), hk = hq + kq*0.20;
    float hraw = 0.62*gwNoise(hq) + 0.38*gwNoise(hq*2.3 + 3.1), hlit = 0.62*gwNoise(hk) + 0.38*gwNoise(hk*2.3 + 3.1);
    float hl = max(length(d.xz), 1e-4);
    float side = -dot(d.xz, uRainN)/hl;                                  // 1 toward where the rain comes from
    float cl = hraw + 0.22*side*smoothstep(0.95, 0.3, up);
    float heap = smoothstep(0.52, 0.66, cl), belly = smoothstep(0.54, 0.78, cl);
    q += 0.9*vec2(gwNoise(q*0.45), gwNoise(q*0.45 + 5.3));
    float pa = 0.6*uPx, wq = max(pa*7.6/den, 1e-3);                      // one pixel, in q units
    vec3 b1 = gwBoss(q, 0.);
    float H = b1.x; vec2 g = b1.yz;
    float fh = 0.5, ftone = 0.;
    if (sharp > 0.5) {
      // a second, smaller generation of blows among the big ones (gone before it is finer than 3 px)
      float see = 1. - smoothstep(0.05, 0.11, wq);
      vec3 b2 = gwBoss(q*2.7 + vec2(17.3, 4.1), 31.);
      H += 0.225*see*b2.x; g += 0.61*see*b2.yz;
      // the hammer's flats: the whole sheet is planished in small flats that differ by a few percent
      vec2 fq = q*3.3 + vec2(9.1, 2.7), fi = floor(fq), ff = fq - fi, fr = vec2(0.), fid = fi; float bd = 9.;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j)), r = ff - (o + 0.15 + 0.7*gwHash2(fi + o + vec2(0., 57.))); float dd = dot(r, r);
        if (dd < bd) { bd = dd; fid = fi + o; fr = r; }
      }
      fh = gwHash(fid + vec2(1.3, 8.1));
      ftone = (1. - smoothstep(0.05, 0.10, wq))*mix(1., 0.6, heap)*(0.09*(fh - 0.5) + 0.04*dot(fr, kq));
    }
    H *= heap; g *= heap;
    // every blow is raised toward us: lit on the shoulder turned to the pale sky, pewter on the other, soft valleys
    float lam = clamp(-dot(g, kq)*0.55, -1., 1.);
    float L = 1. + mix(0.38, 0.30, step(0., lam))*lam*mix(0.6, 1., sharp);
    L *= 1. - 0.40*heap*(1. - smoothstep(0.0, 0.20, H));
    vec2 gh = g + kq*1.1;
    L += 0.26*mix(0.3, 1., sharp)*heap*exp(-dot(gh, gh)/0.55)*smoothstep(0.25, 0.5, H);   // planished sheen on the crown's shoulder
    // a heap of bosses is a cloud: pewter in its belly, bright on the shoulder turned to the pale sky
    L *= mix(1.07, mix(0.98, 0.64, belly), heap)*(1. + 1.7*clamp(hraw - hlit, -0.12, 0.14)*heap);
    L *= 1. + ftone;
    float showerS = smoothstep(-0.25, 0.65, side)*smoothstep(1.0, 0.12, up) + (hraw - 0.5)*0.5*smoothstep(-0.6, 0.2, side);
    float shower = smoothstep(0.18, 0.62, showerS);
    L *= mix(1.0, mix(0.58, 0.48, sharp), shower)*(1. + 0.30*shower*max(lam, 0.));
    L *= 1.0 + 0.20*(1. - shower)*smoothstep(0.0, 0.8, dot(d, uKeyDir));
    // a gleam travels over the calm sheet, east with the weather
    L *= 1. + 0.06*(1. - heap)*sin(q.x*0.55 + q.y*0.2 - uTime*0.5);
    vec3 col = uPal[6]*L;
    float veil = 0.;
    if (sharp > 0.5) {
      // under the shower: tall slanted curtains of rain, and the fringe of fine tinned wire trailing down to the roofs
      float el = asin(clamp(up, -1., 1.)), az = atan(d.x, abs(d.z) < 1e-5 ? 1e-5 : d.z);
      float sideK = smoothstep(-0.15, 0.35, side);
      float ca = az + el*0.30;
      float c1 = gwNoise(vec2(ca*8., el*1.2 + uTime*0.07)), c2 = gwNoise(vec2(ca*27. + 4., el*2.5 + uTime*0.13));
      float top = 0.34 + 0.26*gwNoise(vec2(az*3.1 + 9., uTime*0.03));
      veil = smoothstep(top, top*0.35, el + 0.05*gwNoise(vec2(az*7., 2.)))*sideK;
      col = mix(col, uPal[6]*mix(0.50, 0.92, 0.6*c1 + 0.4*c2), veil*0.80);
      float wa = ca*90., wh = gwHash(vec2(floor(wa), 4.));
      float wx = abs(fract(wa) - 0.5)/90.*hl, hem = 0.13 + 0.20*wh;
      float wl = max(0.8*pa, 0.0008);
      float wire = (1. - smoothstep(wl, wl*2., wx))*step(0.25, wh)*sideK*smoothstep(hem, hem - 0.05, el)*step(0., el);
      float run = 0.74 + 0.26*sin(el*110. + uTime*(5. + 3.*wh) + wh*40.);
      col = mix(col, uPal[6]*1.2, wire*run);
    }
    // the break: the flanks that face the slot are under-lit bare copper, hammer flat by hammer flat, strongest near it
    vec2 sq = uSlotDir.xz/max(length(uSlotDir.xz), 1e-4);
    float prox = smoothstep(0.10, 0.93, dot(d, uSlotDir));
    float sl0 = -dot(g, sq)*0.55;
    float underF = smoothstep(0.48, 0.55, sl0 + 0.35*(fh - 0.5))*(0.6 + 0.4*fh);
    float under = uSlot*mix(smoothstep(0.2, 0.9, sl0)*0.7, underF, sharp)*(1. - 0.7*veil);
    col *= mix(vec3(1.), vec3(1.045, 1.0, 0.93), uSlot*(0.5 + 0.5*prox));
    col = mix(col, uSlotCol*mix(0.80, 1.0, prox)*(0.74 + 0.42*smoothstep(0.45, 0.95, sl0)), under*(0.09 + 0.86*prox)*(1. - 0.35*shower));
    vec2 sl = gwSlot(d);
    col = mix(col, uSlotCol, clamp(sl.x + sl.y*0.35, 0., 1.));
    // below the horizon a facet sees the city: dry brown, greening with distance
    col = mix(col, mix(uPal[1], uPal[6], 0.45)*0.86, smoothstep(0.03, -0.22, up));
    return col;
  }
  vec3 gwSky(vec3 d){ return gwSkyX(d, 0.); }
  // the one ramp: salmon, penny, chocolate, blue-green, mint
  vec3 gwRamp(float a){
    // stops: salmon 0, penny 0.25, chocolate 0.5, blue-green 0.72, mint 0.92
    vec3 c = mix(uPal[0], uPal[1], smoothstep(0.0, 0.25, a)); c = mix(c, uPal[2], smoothstep(0.25, 0.5, a));
    c = mix(c, uPal[3], smoothstep(0.5, 0.72, a)); return mix(c, uPal[4], smoothstep(0.72, 0.92, a));
  }
  // seconds since the rain line passed world point P (negative: still dry)
  // (the line runs a little ahead where uBulge says: x from, x to, z centre, z radius; uBulgeA seconds)
  float gwBulge(vec2 p){ float dz = (p.y - uBulge.z)/max(uBulge.w, 1.); return uBulgeA*smoothstep(uBulge.x, uBulge.y, p.x)*exp(-dz*dz); }
  float gwWetSeconds(vec3 P){ return (uFront - dot(uRainN, P.xz))/6.5 + gwBulge(P.xz); }
  vec3 gwFinish(vec3 displayCol, float hdr){ return gwToScene(displayCol)*(1. + hdr); }

  // THE METAL. P world position, N unit normal of the hammer flat, T its tangent (unit, horizontal), V unit vector
  // to the eye, lf = (flat-local x, y in metres from the flat's centre, half size, id 0..1),
  // st = (base age 0..1, shelter 0..1, kind 0 copper 1 gilt 2 tin, resist 0..1), sf = (u across, v down the fall,
  // seam spacing: >0 draws standing seams and rivets, <0 only leads the patina), fw = metres per pixel on the surface.
  // Returns display-linear colour and, in a, the HDR boost for gwFinish.
  vec4 gwMetal(vec3 P, vec3 N, vec3 T, vec3 V, vec4 lf, vec4 st, vec3 sf, float fw, float dist, bool front){
    lf.w = floor(lf.w*4096. + 0.5)/4096.;
    float shelter = st.y, kind = st.z, resist = st.w, open = 1. - shelter;
    float isCu = 1. - step(0.5, kind), isGilt = step(0.5, kind)*(1. - step(1.5, kind));
    float w = gwWetSeconds(P);
    float wet = smoothstep(0., max(uSoft, 0.05), w)*open;
    // patina clock: led by seams and rivets, by downhill streaks and by each flat's own luck
    float su = sf.x, sv = sf.y, sp = max(abs(sf.z), 0.05);
    float seamD = (0.5 - abs(fract(su/sp) - 0.5))*sp;
    float streak = gwNoise(vec2(su*2.3, sv*0.11)), fine = gwNoise(vec2(su*9., sv*0.4 + 3.));
    float lead = 0.15 + min(seamD, 0.6)*2.7 + streak*streak*3.4 + fine*0.6 + lf.w*0.22;
    // a wall greens in tongues: water hangs from every lap, sill and string course (one every sp down the wall) and
    // from the eave, and runs down each column at its own speed; no flat's edge is a colour boundary
    float wallK = (1. - smoothstep(0.25, 0.45, abs(N.y)))*step(sf.z, 0.);
    if (wallK > 0.001) {
      float row = floor(sv/sp), dv = sv - row*sp;
      float kr = 0.62*gwNoise(vec2(su*3.4 + row*3.1, row*7.3)) + 0.38*gwNoise(vec2(su*8.3 + 5., row*3.7)), kl = 0.6*gwNoise(vec2(su*2.2 + 11., 0.5)) + 0.4*gwNoise(vec2(su*6.1, 4.5));
      kr = smoothstep(0.18, 0.80, kr); kl = smoothstep(0.15, 0.85, kl);
      float leadW = min(0.25 + dv*mix(0.25, 5.5, kr), 0.4 + sv*mix(0.08, 2.6, kl)) + fine*0.3;
      lead = mix(lead, leadW, wallK);
    }
    float grow = smoothstep(0., 1., (w - lead)/mix(0.9, 0.45, wallK))*open*(1. - resist)*isCu;
    float age = st.x + max(0.70 - st.x, 0.)*grow;
    age += (streak - 0.5)*0.12*(1. - resist)*smoothstep(0.2, 0.45, st.x)*(1. - smoothstep(0.62, 0.9, st.x))*isCu;   // weathered sheet is mottled
    // old sheet: brown still showing under each seam, streaked; wet turns chalk mint to deep blue-green
    float old = smoothstep(0.62, 0.9, st.x);
    age -= old*(0.44*smoothstep(0.20, 0.02, seamD)*(0.4 + 0.6*streak) + 0.05*streak*streak);
    float deep = smoothstep(0.1, 2.4, w - streak*0.9 - lf.w*0.5)*open*old;
    age = mix(age, min(age, 0.70 + 0.05*streak), deep);
    age = mix(age, min(age, 0.5), shelter*0.9);
    vec3 base = gwRamp(age);
    base = mix(base, uPal[2]*0.92, shelter*isCu);
    base = mix(base, uPal[5], isGilt); base = mix(base, uPal[6], step(1.5, kind));
    float chalk = smoothstep(0.62, 0.90, age)*(1. - 0.85*wet)*isCu;
    // the hammer flat: one jittered normal, a shallow planished bowl and a 4 by 4 field of dimples
    vec3 B = cross(N, T);
    float hs = max(lf.z, 1e-3), fwm = max(fw, 1e-5);
    float fwl = min(fwm, dist*uPx*1.6);                 // for mark widths: not blown up at grazing angles
    float flatPx = 2.*hs/fwm;
    float facet = smoothstep(2.5, 6., flatPx)*step(1e-3, lf.z);
    vec2 jit = (gwHash2(vec2(lf.w*917.3, lf.w*331.7 + 0.5)) - 0.5)*0.085;
    jit *= 1. + 0.5*uGust*sin(uTime*(0.7 + lf.w*1.3) + lf.w*40.);          // sheet oil-cans in the gusts
    // ...and the gusts cross the city as slow waves, so glints run along the roofs like wind on water
    float gph = dot(P.xz, vec2(0.047, 0.019)) + P.y*0.03 - uTime*1.25 + lf.w*2.4;
    jit += vec2(sin(gph), cos(gph*0.83 + 1.7))*(0.035 + 0.045*uGust);
    vec2 ln = lf.xy/hs;
    vec2 dq = ln*2. + 0.5*(gwHash2(vec2(lf.w*71., 9.)) - 0.5), dc = fract(dq) - 0.5;
    float dimFade = smoothstep(5., 14., flatPx*0.25)*(1. - smoothstep(90., 150., dist));
    vec2 lnb = clamp(ln, -1., 1.);
    vec2 tilt = (jit + lnb*uBowl + dc*exp(-dot(dc, dc)*6.)*0.42*dimFade)*facet;
    tilt *= 1. - 0.6*chalk;
    vec3 Nf = normalize(N + T*tilt.x + B*tilt.y);
    if (!front) Nf = -Nf;
    vec3 R = reflect(-V, Nf);
    vec3 tinM = uPal[6];
    float tip = clamp((dot(Nf, V) - dot(front ? N : -N, V))*uTip, -0.30, 0.36)*facet;
    vec3 rel = gwSky(R)/max(tinM, vec3(1e-3));
    vec3 Ns = front ? N : -N;
    float wallM = (1. - smoothstep(0.25, 0.45, abs(N.y)))*isCu*step(1e-3, lf.z);
    float nhl = max(length(Ns.xz), 1e-3);
    // (the band is placed by the wall's mean normal, so it runs unbroken from flat to flat; each flat's bowl only bends it)
    // (it lies on the upper storey, 3 to 9 m under the eaves, wherever the eye is not far above the wall; a slow
    // swell runs forward along it)
    float bandW = 0.5 + 0.5*sin(dot(P.xz, vec2(0.02, 0.105)) - uTime*2.3 + 1.2*sin(dot(P.xz, vec2(-0.05, 0.031))));
    float bandH = smoothstep(2.0, 3.8, sv + 0.8*bandW)*(1. - smoothstep(7.4, 10.2, sv + 1.6*bandW));
    float skyv = bandH*(0.60 + 0.40*bandW)*smoothstep(0.42, -0.05, V.y)*smoothstep(0.0, 0.04, dot(V, Ns));
    rel = mix(rel, mix(vec3(0.62, 0.52, 0.47), rel*vec3(1.08, 1.10, 1.12), skyv), wallM);
    float ndv = clamp(dot(Nf, V), 0., 1.), f1 = 1. - ndv, fres = f1*f1*f1;
    vec3 matte = base*(0.95 + 0.09*Nf.y + 0.08*dot(Nf, uKeyDir));
    vec3 shiny = base*mix(0.42 + 0.64*rel, 0.33 + 0.80*rel*rel, resist*0.85);
    vec3 col = mix(shiny, matte, chalk);
    col *= (1. + tip*(1. - 0.55*chalk))*(1. - 0.72*shelter*isGilt);
    col = mix(col, mix(base*1.28, tinM, 0.30)*(1.10 + 0.7*tip), skyv*wallM*0.95*(1. - chalk)*(1. - shelter));
    // a slope turned to the pale dry sky is a step brighter than one turned to the shower
    float rl2 = max(length(uRainN), 1e-4);
    col *= 1. + (0.17*smoothstep(-0.1, 0.8, dot(Ns, uKeyDir)) - 0.13*smoothstep(0.1, 0.9, -dot(Ns.xz, uRainN)/rl2))*(1. - 0.6*chalk)*(1. - isGilt);
    col *= 1. - 0.32*wallM*(1. - smoothstep(0.5, 12., P.y));        // a wall's lower storeys see less of the sky
    // one flat in six is aimed at the pale sky and goes silver: a planished mirror, in loose bands that the gusts
    // slide across the roofs
    vec3 Pc = P - T*lf.x - B*lf.y;                       // the flat's centre: a flat is silver or not as a whole
    float mph = dot(Pc.xz, vec2(0.040, 0.012)) + Pc.y*0.02 - uTime*0.80 + 0.8*sin(dot(Pc.xz, vec2(-0.008, 0.019)) + 1.3);
    float mv = 0.66*sin(mph) + 0.16*sin(mph*0.43 + 2.) + (gwHash(vec2(lf.w*113., 5.)) - 0.5)*0.38;
    float mirror = smoothstep(0.40, 0.60, mv)*isCu*(1. - chalk)*(1. - shelter)*step(1e-3, lf.z);
    float relL = dot(rel, vec3(0.333));
    mirror *= smoothstep(0.2, 0.5, abs(N.y));               // roofs only: a wall has its band instead
    vec2 lb = clamp(ln, -1., 1.);
    vec3 mflat = mix(base, tinM, 0.55*(1. - 0.75*resist))*(0.92 + 0.26*relL + 0.25*resist)*mix(1., 0.72, wet*(1. - resist));
    vec3 mcol = mflat*(1.04 + 0.42*lb.x - 0.34*lb.y - 0.10*dot(lb, lb));
    col = mix(col, mcol, mirror*facet);
    col = mix(col, mflat, 0.07*(1. - facet)*isCu*(1. - chalk)*(1. - shelter)*step(1e-3, lf.z));
    col *= mix(1., mix(0.54, 1.0, smoothstep(0.5, 0.7, age)), wet*(1. - 0.55*resist)*(1. - isGilt));               // wet metal is darker...
    // the line itself: where it is passing, the drops hop and the roofs are spattered silver
    float splash = smoothstep(0., 0.10, w)*(1. - smoothstep(0.25, 0.95, w))*open*step(1e-3, lf.z)*smoothstep(0.2, 0.5, abs(N.y))*clamp(0.8/max(uSoft, 0.05), 0.2, 1.);
    col = mix(col, tinM*1.06, splash*(0.30 + 0.45*gwNoise(P.xz*1.9 + vec2(uTime*2.3, -uTime*1.7)))*(1. - isGilt));
    float kd = max(dot(R, uKeyDir), 1e-4);
    float spec = pow(kd, mix(10., 70., max(wet, isGilt*0.6)))*mix(0.46, 0.95, wet);   // ...and its highlight tighter
    vec3 specCol = mix(mix(base, tinM, 0.65), mix(uPal[5], uPal[0], 0.3)*1.2, uSlot*0.7);
    col += specCol*spec*(1. - chalk);
    col = mix(col, tinM*rel, fres*0.52*(1. - chalk));
    // shader seams and rivets (where there is no real rib): min width 1.5 px, flat tint when too fine
    float fws = fwl;
    if (sf.z > 0.) {
      float fine2 = smoothstep(3., 7., sp/fws), wl = max(0.035, 1.5*fws);
      float line = (1. - smoothstep(wl*0.5, wl, seamD))*fine2;
      float band = (1. - smoothstep(wl, wl*2.4, seamD))*fine2 - line;
      float sgn = (fract(su/sp) < 0.5 ? 1. : -1.)*(dot(T, uKeyDir) < 0. ? 1. : -1.);
      float lit = band*step(0., sgn), shd = band*step(sgn, 0.);
      col *= 1. - 0.10*line - 0.36*shd - 0.04*(1. - fine2); col += mix(base, tinM, 0.7)*(0.34*lit + 0.10*line)*(1. - chalk);
      float rv = fract(sv/0.30) - 0.5, rd = length(vec2(seamD - 0.11, rv*0.30));
      float dotp = (1. - smoothstep(0.022, 0.040, rd))*smoothstep(1.2, 3., 0.035/fws);
      col *= 1. + dotp*(rv > 0. ? -0.35 : 0.45);
    }
    // the oiled new sheet: water beads, slides and runs off in bright threads
    float hdr = 0.;
    float bwet = wet*resist;
    if (bwet > 0.01) {
      float bs = 0.21, ci = floor(su/bs), spd = 0.5 + 1.3*gwHash(vec2(ci, 7.));
      float bv = (sv - uTime*spd)/0.9 + gwHash(vec2(ci, 3.))*7.;
      float on = step(0.45, gwHash(vec2(ci, floor(bv))));
      vec2 bc = vec2((fract(su/bs) - 0.5)*bs + 0.05*(gwHash(vec2(ci, 11.)) - 0.5), (fract(bv) - 0.5)*0.9);
      float seen = smoothstep(0.6, 2.2, 0.035/fws);
      float rb = max(0.035, 1.2*fws);
      float bead = on*(1. - smoothstep(rb*0.5, rb, length(bc)));
      float thr = on*(1. - smoothstep(0.012, 0.012 + max(0.02, fws), abs(bc.x)))*smoothstep(-0.45, 0.0, bc.y)*step(bc.y, 0.);
      float mk = clamp(bead + thr*0.7, 0., 1.)*seen*bwet;
      col = mix(col, tinM*(1.15 + 0.5*uSlot), mk);
      col *= 1. + 0.05*(1. - seen)*bwet;
      hdr += mk*uSlot*0.6;
    }
    // tinned sheet under rain is pocked: rings that open and fade, only where the line has passed
    if (kind > 1.5 && wet > 0.01) {
      vec2 pq = P.xz*0.8, pi = floor(pq); float ph = uTime*1.6 + gwHash(pi)*9.; vec2 pc = fract(pq) - 0.5 - 0.3*(gwHash2(pi + floor(ph)*7.) - 0.5);
      float pr = fract(ph)*0.42, ring = (1. - smoothstep(0.03, 0.09, abs(length(pc) - pr)))*(1. - fract(ph))*smoothstep(1.5, 4., 1.25/max(fws, 1e-4));
      col *= 1. + (0.55*ring - 0.06)*wet;
    }
    // after the break: the low light lands on wet metal as a run: a warm band that climbs the gores and crosses the
    // roofs, every wet flat in it turned to the break fired together (oiled new copper only brightens)
    vec2 sl = gwSlot(R);
    float took = mix(0.22, 1., max(wet*(1. - resist), isGilt));
    float fire = sl.y*(1. - chalk)*took;
    float faceS = dot(Ns, uSlotDir);
    float rph = P.y*0.21 + dot(P.xz, vec2(0.052, 0.031)) - uTime*1.5;
    float run = smoothstep(0.30, 0.78, sin(rph + 0.7*sin(dot(P.xz, vec2(0.11, -0.07)) + P.y*0.05)));
    float tipS = dot(Nf, uSlotDir) - faceS;
    float fireRun = uSlot*run*smoothstep(-0.62, 0.12, faceS)*(0.78 + 0.22*smoothstep(-0.02, 0.08, tipS))*took*(1. - 0.7*chalk)*(1. - shelter)*(1. - isGilt);
    // fire-gilt: the limbs turned to the break blaze, the others fall a little behind
    float gf = uSlot*isGilt*(1. - shelter);
    vec3 ad = P - uArm.xyz; float inArm = 1. - smoothstep(0.9, 1.25, length(ad)/max(uArm.w, 1e-3));
    float armS = dot(ad, uSlotDir)/max(uArm.w, 1e-3);               // across the armillary: +1 on the limb nearest the break
    float litG = gf*mix(smoothstep(-0.15, 0.55, dot(Nf, uSlotDir)), smoothstep(-0.25, 0.55, armS), inArm)*(0.8 + 0.2*run);
    col *= 1. - gf*mix(0.20*smoothstep(0.25, -0.5, faceS), 0.34*smoothstep(0.15, -0.6, armS), inArm);
    vec3 gold = mix(uPal[0], uPal[5], 0.66)*vec3(1.04, 0.97, 0.80);
    col += gold*fire*1.25;
    col = mix(col, gold*(0.92 + 0.12*relL), clamp(fireRun, 0., 1.)*0.90);
    col = mix(col, uPal[5]*1.12 + uPal[0]*0.34, litG*0.8);
    hdr += fire*1.5 + fireRun*0.12 + litG*0.45 + isGilt*spec*0.9;
    // a gilt leaf in its recess is dark bronze until one of its flats catches the sky as we pass
    float leaf = isGilt*step(0.5, shelter);
    if (leaf > 0.5) {
      vec3 lc = P - T*lf.x - B*lf.y - cameraPosition;
      float lgo = (length(lc.xz) - (3.5 + 27.*gwHash(vec2(lf.w*57., 2.))))/2.7;
      float flash = exp(-lgo*lgo)*step(1e-3, lf.z);
      col = mix(mix(uPal[5], uPal[1], 0.55)*(0.30 + 0.17*relL), uPal[5]*1.02, flash); hdr = flash*0.5;
    }
    // the back of the sheet: dull brown, every dimple inverted
    if (!front && kind < 0.2) { col = uPal[2]*(0.55 + 0.35*dot(rel, vec3(0.333)))*(0.9 + 0.2*isGilt); hdr = 0.; }
    // distance is patina, not fog: paler and greener until the horizon is a mint line under tin
    float far = smoothstep(uFar.x, uFar.y, dist);
    col = mix(col, mix(uPal[4], tinM, 0.3)*0.98, far*0.92);
    return vec4(col, hdr*(1. - far));
  }`;

const METAL_VERT = /* glsl */`
  attribute vec4 aFlat, aState; attribute vec3 aSurf;
  uniform float uTime, uGust, uPx, uFront; uniform vec2 uRainN;
  varying vec3 vP, vN, vT, vSurf; varying vec4 vFlat, vState;
  void main(){
    vec3 p = position;
    #ifdef GW_ROD
      // drawn rod and strip: the instance's local x,z are its section; never thinner than 1.5 px on screen
      vec4 c0 = modelMatrix*instanceMatrix*vec4(0., p.y, 0., 1.);
      float sx = length((modelMatrix*instanceMatrix*vec4(1., 0., 0., 0.)).xyz);
      // (far off the scaffold thins to a light, even hatch: finer rods, some of them dropped, their colour leaning
      // to the new sheet behind them; gilt rings (kind 1) and water threads (kind 2) are never dropped)
      float rd = length(c0.xyz - cameraPosition), farK = smoothstep(200., 520., rd);
      float special = step(0.5, aState.z);
      float need = mix(0.8, mix(0.55, 0.8, step(1.5, aState.z)), farK)*uPx*rd/max(projectionMatrix[1][1], 1e-3);
      float k = max(1., need/max(sx*0.5, 1e-4));
      p.xz *= min(k, mix(12., 60., special))*max(step(0.76*farK, aFlat.w), special);
      // loose strip and rope sway from their fixed end; a tin rod is a thread of water that only runs once it rains
      p.x += step(0.5, aState.w)*p.y*(0.25/max(sx, 1e-3))*(0.3 + uGust)*sin(uTime*(1.5 + aFlat.w*2.) + p.y*2. + aFlat.w*50.);
      vec3 o0 = (modelMatrix*instanceMatrix*vec4(0., 0., 0., 1.)).xyz;
      p.y *= mix(1., smoothstep(0.3, 2.2, (uFront - dot(uRainN, o0.xz))/6.5), step(1.5, aState.z));
    #endif
    #ifdef USE_INSTANCING
      mat4 mm = modelMatrix*instanceMatrix;
    #else
      mat4 mm = modelMatrix;
    #endif
    vec4 wp = mm*vec4(p, 1.);
    mat3 m3 = mat3(mm);
    vec3 n = normal; float nl = dot(n, n); n = nl > 1e-8 ? n*inversesqrt(nl) : vec3(0., 1., 0.);
    vec3 wn = m3*n; float wl = dot(wn, wn); vN = wl > 1e-10 ? wn*inversesqrt(wl) : vec3(0., 1., 0.);
    vec3 wt = m3*gwTangentV(n); float tl = dot(wt, wt); vT = tl > 1e-10 ? wt*inversesqrt(tl) : vec3(1., 0., 0.);
    vP = wp.xyz; vFlat = aFlat; vState = aState; vSurf = aSurf;
    #ifdef GW_ROD
      vState.w = 0.85;
      vState.x = mix(aState.x, 0.10, 0.8*smoothstep(200., 520., length(wp.xyz - cameraPosition))*(1. - step(0.5, aState.z)));
    #endif
    gl_Position = projectionMatrix*viewMatrix*wp;
  }`;
const METAL_FRAG = /* glsl */`
  varying vec3 vP, vN, vT, vSurf; varying vec4 vFlat, vState;
  void main(){
    vec3 dv = cameraPosition - vP; float dist = max(length(dv), 1e-3); vec3 V = dv/dist;
    float fw = max(length(dFdx(vP)), length(dFdy(vP)));
    vec3 N = vN; float nl = dot(N, N); N = nl > 1e-8 ? N*inversesqrt(nl) : vec3(0., 1., 0.);
    vec3 T = vT - N*dot(vT, N); float tl = dot(T, T); T = tl > 1e-8 ? T*inversesqrt(tl) : gwTangent(N);
    vec4 m = gwMetal(vP, N, T, V, vFlat, vState, vSurf, fw, dist, gl_FrontFacing);
    gl_FragColor = vec4(gwFinish(m.rgb, m.a), 1.);
  }`;
/** THE material of the world. opts.instanced: InstancedMesh (aState may be an instanced attribute); opts.rod:
 *  instanced rods along local Y that are widened to 1.5 px (aFlat.w = random, aState.w = 1 for loose strip). */
export function metalMaterial(style, opts = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: style.uniforms, side: THREE.DoubleSide,
    vertexShader: 'vec3 gwTangentV(vec3 n){ vec3 t = vec3(n.z, 0., -n.x); float l = dot(t, t); return l > 1e-6 ? t*inversesqrt(l) : vec3(1., 0., 0.); }\n' + METAL_VERT,
    fragmentShader: STYLE_GLSL + METAL_FRAG,
  });
  if (opts.rod) m.defines = { GW_ROD: 1 };
  return m;
}

// ---------------------------------------------------------------------------------------------------------------
// SHEET GEOMETRY. Non-indexed shells; every quad is one hammer flat: one normal on all its corners, a flat-local
// coordinate (metres from the flat's centre along T = normalize(cross(up, N)) and B = cross(N, T)), its half size
// and a random id. A corner is [x, y, z, u, v] (u across the sheet, v down its fall, in metres) or, for smooth
// rolled parts, [x, y, z, u, v, nx, ny, nz]. Corners run anticlockwise seen from the face side; the other side is
// drawn as the dull brown back of the sheet.
export class SheetBuilder {
  constructor(rng, cap = 30000) {
    this.rng = rng; this.n = 0; this.cap = cap;
    this.pos = new Float32Array(cap * 3); this.nor = new Float32Array(cap * 3);
    this.flat = new Float32Array(cap * 4); this.st = new Float32Array(cap * 4); this.surf = new Float32Array(cap * 3);
    this.age = 0.25; this.shelter = 0; this.kind = 0; this.resist = 0; this.seam = -0.6; this.facets = true;
    this.ageFn = null;   // optional (x, y, z) -> [age, resist] override per quad centre
  }
  /** current metal state for the quads that follow */
  set(age, shelter = 0, kind = 0, resist = 0) { this.age = age; this.shelter = shelter; this.kind = kind; this.resist = resist; return this; }
  _grow() {
    const g = (a, k) => { const b = new Float32Array(this.cap * 2 * k); b.set(a); return b; };
    this.pos = g(this.pos, 3); this.nor = g(this.nor, 3); this.flat = g(this.flat, 4); this.st = g(this.st, 4); this.surf = g(this.surf, 3);
    this.cap *= 2;
  }
  _v(p, nx, ny, nz, lu, lv, hs, id, age, resist) {
    if (this.n >= this.cap) this._grow();
    const i = this.n++, i3 = i * 3, i4 = i * 4;
    this.pos[i3] = p[0]; this.pos[i3 + 1] = p[1]; this.pos[i3 + 2] = p[2];
    if (p.length >= 8) { this.nor[i3] = p[5]; this.nor[i3 + 1] = p[6]; this.nor[i3 + 2] = p[7]; }
    else { this.nor[i3] = nx; this.nor[i3 + 1] = ny; this.nor[i3 + 2] = nz; }
    this.flat[i4] = lu; this.flat[i4 + 1] = lv; this.flat[i4 + 2] = hs; this.flat[i4 + 3] = id;
    this.st[i4] = age; this.st[i4 + 1] = this.shelter; this.st[i4 + 2] = this.kind; this.st[i4 + 3] = resist;
    this.surf[i3] = p.length > 3 ? p[3] : lu; this.surf[i3 + 1] = p.length > 4 ? p[4] : -lv; this.surf[i3 + 2] = this.seam;
  }
  /** one hammer flat (or, with d omitted, a triangle) */
  quad(a, b, c, d) {
    const q = d || c;
    let nx = (c[1] - a[1]) * (q[2] - b[2]) - (c[2] - a[2]) * (q[1] - b[1]);
    let ny = (c[2] - a[2]) * (q[0] - b[0]) - (c[0] - a[0]) * (q[2] - b[2]);
    let nz = (c[0] - a[0]) * (q[1] - b[1]) - (c[1] - a[1]) * (q[0] - b[0]);
    if (!d) { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2]; nx = uy * wz - uz * wy; ny = uz * wx - ux * wz; nz = ux * wy - uy * wx; }
    const l = Math.hypot(nx, ny, nz); if (l < 1e-12) return;
    nx /= l; ny /= l; nz /= l;
    let tx = nz, tz = -nx; const tl = Math.hypot(tx, tz);
    if (tl > 1e-3) { tx /= tl; tz /= tl; } else { tx = 1; tz = 0; }
    const bx = ny * tz, by = nz * tx - nx * tz, bz = -ny * tx;       // B = N x T  (T.y = 0)
    const k = d ? 4 : 3, cx = (a[0] + b[0] + c[0] + (d ? d[0] : 0)) / k, cy = (a[1] + b[1] + c[1] + (d ? d[1] : 0)) / k, cz = (a[2] + b[2] + c[2] + (d ? d[2] : 0)) / k;
    const hs = this.facets ? 0.5 * Math.sqrt(l * 0.5) : 0, id = this.rng();
    let age = this.age, resist = this.resist;
    if (this.ageFn) { const r = this.ageFn(cx, cy, cz, id); age = r[0]; resist = r[1]; }
    const put = (p) => { const x = p[0] - cx, y = p[1] - cy, z = p[2] - cz; this._v(p, nx, ny, nz, x * tx + z * tz, x * bx + y * by + z * bz, hs, id, age, resist); };
    put(a); put(b); put(c);
    if (d) { put(a); put(c); put(d); }
  }
  /** a sheet of nu by nv flats: f(s, t) -> corner, s to the right and t upward seen from the face side */
  grid(nu, nv, f, flip = false) {
    let row = [], next = [];
    for (let i = 0; i <= nu; i++) row.push(f(i / nu, 0));
    for (let j = 1; j <= nv; j++) {
      next = []; for (let i = 0; i <= nu; i++) next.push(f(i / nu, j / nv));
      for (let i = 0; i < nu; i++) { if (flip) this.quad(row[i + 1], row[i], next[i], next[i + 1]); else this.quad(row[i], row[i + 1], next[i + 1], next[i]); }
      row = next;
    }
  }
  /** a rolled tube or bead along pts ([x,y,z] list): smooth normals, `sides` faces, radius r (number or fn(k)) */
  tube(pts, r, sides = 5, closed = false) {
    const n = pts.length, rings = []; let px = 0, py = 1, pz = 0, vlen = 0;
    const was = this.facets; this.facets = false;
    for (let k = 0; k < n; k++) {
      const a = pts[closed ? (k + n - 1) % n : Math.max(k - 1, 0)], b = pts[closed ? (k + 1) % n : Math.min(k + 1, n - 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      if (k === 0) { if (Math.abs(dy) > 0.9) { px = 1; py = 0; pz = 0; } }
      let d = px * dx + py * dy + pz * dz; px -= dx * d; py -= dy * d; pz -= dz * d;
      const pl = Math.hypot(px, py, pz) || 1; px /= pl; py /= pl; pz /= pl;
      const qx = dy * pz - dz * py, qy = dz * px - dx * pz, qz = dx * py - dy * px;
      if (k > 0) vlen += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]);
      const rr = typeof r === 'function' ? r(k) : r, ring = [];
      for (let s = 0; s <= sides; s++) {
        const an = (s / sides) * TAU, c = Math.cos(an), sn = Math.sin(an), ox = px * c + qx * sn, oy = py * c + qy * sn, oz = pz * c + qz * sn;
        ring.push([pts[k][0] + ox * rr, pts[k][1] + oy * rr, pts[k][2] + oz * rr, (s / sides) * TAU * rr, vlen, ox, oy, oz]);
      }
      rings.push(ring);
    }
    const m = closed ? n : n - 1;
    for (let k = 0; k < m; k++) { const r0 = rings[k], r1 = rings[(k + 1) % n]; for (let s = 0; s < sides; s++) this.quad(r0[s], r0[s + 1], r1[s + 1], r1[s]); }
    this.facets = was;
  }
  geometry() {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor.slice(0, n * 3), 3));
    g.setAttribute('aFlat', new THREE.BufferAttribute(this.flat.slice(0, n * 4), 4));
    g.setAttribute('aState', new THREE.BufferAttribute(this.st.slice(0, n * 4), 4));
    g.setAttribute('aSurf', new THREE.BufferAttribute(this.surf.slice(0, n * 3), 3));
    return g;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// THE DOME. theta runs from the seam (+Z) toward +X; gores 0..15 are new copper, 16..31 old verdigris.
const D = { y0: 41, R0: 34, c: 21, Rc: 55, phiMax: 1.0535, N: 32, drumR: 35, lanY: 88.6, lanTop: 106, armY: 132 };
const GORE = TAU / D.N;
function domeAt(g, s, phi, off = 0) {
  const th = (g + s) * GORE, cp = Math.cos(phi), sp = Math.sin(phi);
  const rr = D.Rc * cp - D.c + 0.42 * Math.sin(Math.PI * s) * (0.3 + 0.7 * cp) + off * cp;
  return [rr * Math.sin(th), D.y0 + D.Rc * sp + off * sp, rr * Math.cos(th)];
}
const isNew = (g) => (((g % D.N) + D.N) % D.N) < D.N / 2;
// per-seed character of the two halves
function halves(rng) {
  const oldAge = rng.range(0.95, 1.0), newAge = rng.range(0.0, 0.07), patch = 18 + rng.int(0, 11), patchAge = rng.range(0.27, 0.4);
  return {
    oldAge, newAge,
    // [age, resist] of a flat on gore g
    state(g, id, lowBias = 0) {
      if (isNew(g)) return [newAge + id * 0.07, 1];
      if (g === patch) return [patchAge + 0.08 * id, 0];          // one gore patched a few winters ago: still brown, greens in this rain
      return [clamp(oldAge - 0.05 * id * id - lowBias * 0.5, 0.55, 1), 0];
    },
    patch,
  };
}
async function buildGores(sb, H, ctx, gap) {
  const arc = D.Rc * D.phiMax, courses = 48;
  for (let g = 0; g < D.N; g++) {
    const fresh = isNew(g);
    for (let j = 0; j < courses; j++) {
      const p0 = (j / courses) * D.phiMax, p1 = ((j + 1) / courses) * D.phiMax, pm = (p0 + p1) / 2;
      if (gap && g === gap.g && j >= gap.j0 && j < gap.j1) {
        // the last sheet is not on yet: bare ribs (a purlin of rolled strip under every other course)
        if (j % 2 === 0) { sb.ageFn = null; sb.set(0.5, 0.5, 0, 0); sb.seam = -1; sb.tube([domeAt(g, 0.02, p0, -0.22), domeAt(g, 0.5, p0, -0.22), domeAt(g, 0.98, p0, -0.22)], 0.11, 4); sb.set(0.25); }
        continue;
      }
      const width = (D.Rc * Math.cos(pm) - D.c) * GORE, nu = clamp(Math.round(width / 1.3), 2, 6);
      // each course laps over the one below: its lower edge stands 5 cm proud
      sb.seam = -2.0;
      sb.ageFn = (x, y, z, id) => H.state(g, id, fresh ? 0 : 0.06 * (1 - j / courses));
      sb.grid(nu, 1, (s, t) => {
        const p = domeAt(g, s, t ? p1 + 0.002 : p0, t ? 0 : 0.05);
        p.push(s * 6.0, arc - (t ? p1 : p0) * D.Rc); return p;
      });
    }
    // two standing seams per gore: a real folded rib 7 cm high
    for (let k = 1; k <= 2; k++) {
      const s = k / 3, segs = 24;
      sb.ageFn = (x, y, z, id) => H.state(g, id * 0.5);
      for (let j = 0; j < segs; j++) {
        const p0 = (j / segs) * D.phiMax, p1 = ((j + 1) / segs) * D.phiMax;
        if (gap && g === gap.g && j * 2 >= gap.j0 && j * 2 < gap.j1) continue;
        const w0 = 0.05 / Math.max((D.Rc * Math.cos(p0) - D.c) * GORE, 0.5), w1 = 0.05 / Math.max((D.Rc * Math.cos(p1) - D.c) * GORE, 0.5);
        const a0 = domeAt(g, s - w0, p0, 0.04), b0 = domeAt(g, s, p0, 0.13), c0 = domeAt(g, s + w0, p0, 0.04);
        const a1 = domeAt(g, s - w1, p1, 0.04), b1 = domeAt(g, s, p1, 0.13), c1 = domeAt(g, s + w1, p1, 0.04);
        const v0 = arc - p0 * D.Rc, v1 = arc - p1 * D.Rc, u = s * 6;
        a0.push(u, v0); b0.push(u, v0); c0.push(u, v0); a1.push(u, v1); b1.push(u, v1); c1.push(u, v1);
        sb.facets = false; sb.quad(a0, b0, b1, a1); sb.quad(b0, c0, c1, b1); sb.facets = true;
      }
    }
    if (g % 2 === 1) await ctx.yield();
  }
  sb.ageFn = null;
}
// the ribs: a proud rolled rib over every gore joint; rib 0 is THE seam (old on its -X flank, new on its +X flank)
async function buildRibs(sb, H, ctx, rivets) {
  const arc = D.Rc * D.phiMax, segs = 46;
  for (let g = 0; g < D.N; g++) {
    const big = g % 8 === 0, seam = g === 0 || g === D.N / 2;
    const W = seam ? 0.62 : big ? 0.5 : 0.36, Hh = seam ? 0.75 : big ? 0.6 : 0.42;
    const sect = [[-1, 0], [-0.72, 0.62], [-0.3, 1], [0.3, 1], [0.72, 0.62], [1, 0]];
    const pt = (i, phi) => {
      const wid = Math.max((D.Rc * Math.cos(phi) - D.c) * GORE, 0.4), tp = 1 - 0.4 * (phi / D.phiMax);
      const p = domeAt(g, (sect[i][0] * W * tp) / wid, phi, 0.03 + sect[i][1] * Hh * tp);
      p.push(sect[i][0] * W * tp, arc - phi * D.Rc); return p;
    };
    for (let i = 0; i < 5; i++) {
      // which half does this face of the rib belong to?
      const gg = seam ? (g === 0 ? (i < 2.5 ? D.N - 1 : 0) : (i < 2.5 ? D.N / 2 - 1 : D.N / 2)) : (i < 2.5 ? g - 1 : g);
      sb.seam = -1.6;
      sb.ageFn = (x, y, z, id) => { const r = H.state(gg, id); if (!r[1]) r[0] = Math.max(r[0] - 0.12 - (i === 0 || i === 4 ? 0.25 : 0), 0.5); return r; };
      for (let j = 0; j < segs; j++) {
        const p0 = (j / segs) * D.phiMax, p1 = ((j + 1) / segs) * D.phiMax;
        sb.quad(pt(i, p0), pt(i + 1, p0), pt(i + 1, p1), pt(i, p1));
      }
    }
    // rivet rows on both flanges of the ribs the camera climbs past (and thinner rows elsewhere)
    const near = Math.min(g, D.N - g) <= 4, step = near ? 0.5 : 2.6;
    for (let v = 0.4; v < arc - 0.5; v += step) {
      const phi = v / D.Rc, wid = Math.max((D.Rc * Math.cos(phi) - D.c) * GORE, 0.4), tp = 1 - 0.4 * (phi / D.phiMax);
      for (const sd of [-1, 1]) {
        const s = (sd * (W * tp + 0.13)) / wid, p = domeAt(g, s, phi, 0.07), q = domeAt(g, s, phi, 1.07);
        rivets.push(p[0], p[1], p[2], q[0] - p[0], q[1] - p[1], q[2] - p[2], sd < 0 ? g - 1 : g, near ? 0.055 : 0.075);
      }
    }
    if (g % 3 === 2) await ctx.yield();
  }
  sb.ageFn = null;
}

// revolve a profile [[r, y, shelter?], ...] (walking the outside from bottom to top) through theta0..theta1
function revolve(sb, prof, nSeg, stateFn, th0 = 0, th1 = TAU, seam = -2.4) {
  let tot = 0; const cum = [0];
  for (let i = 1; i < prof.length; i++) { tot += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); cum.push(tot); }
  const P = (th, i) => [prof[i][0] * Math.sin(th), prof[i][1], prof[i][0] * Math.cos(th), th * 35, tot - cum[i]];
  sb.seam = seam;
  for (let k = 0; k < nSeg; k++) {
    const a = th0 + ((th1 - th0) * k) / nSeg, b = th0 + ((th1 - th0) * (k + 1)) / nSeg, g = Math.floor(((a + b) / 2) / GORE);
    for (let i = 0; i < prof.length - 1; i++) {
      sb.shelter = prof[i][2] || 0;
      sb.ageFn = (x, y, z, id) => stateFn(g, id, i);
      sb.quad(P(a, i), P(b, i), P(b, i + 1), P(a, i + 1));
    }
  }
  sb.shelter = 0; sb.ageFn = null;
}
const ringPts = (r, y, n, th0 = 0) => { const p = []; for (let k = 0; k < n; k++) { const a = th0 + (k / n) * TAU; p.push([r * Math.sin(a), y, r * Math.cos(a)]); } return p; };

// THE DRUM: plinth, sixteen bays between piers with fretted windows over fire-gilt leaves, a deep cornice that keeps
// the wall under it dry and brown, an attic of thirty-two gilt oculi and the gutter with its scrolled spouts.
async function buildDrum(sb, H, ctx, rng) {
  const wallAge = rng.range(0.52, 0.62);
  const oldWall = (g, id) => [wallAge + 0.08 * id, 0];
  const split = (g, id) => H.state(g, id, 0.05);
  // plinth of three steps and a base roll
  revolve(sb, [[39.6, 0], [39.6, 0.9], [38.4, 0.9], [38.4, 1.8], [37.2, 1.8], [37.2, 2.7], [36.0, 2.9], [36.0, 3.6], [35.0, 4.0]], 96, oldWall, 0, TAU, 2.3);
  await ctx.yield();
  const yb = 4, yt = 26.4, R = D.drumR, bays = 16, BA = TAU / bays;
  const W = (a, y, off = 0) => [(R + off) * Math.sin(a), y, (R + off) * Math.cos(a), a * R, yt - y];
  for (let b = 0; b < bays; b++) {
    const a0 = (b - 0.5) * BA + BA * 0.5;                      // bay b spans a0..a0+BA, piers on the even ribs
    const cols = 10, rows = 14, da = BA / cols, dy = (yt - yb) / rows;
    const wl = 3, wr = 7, sill = 3, spring = 9;               // window: columns 3..7, rows 3..9 and an arch above
    const ac = a0 + BA * 0.5, hw = 2 * da, archR = hw * R, ySpring = yb + spring * dy, yTop = ySpring + 3 * dy;
    sb.seam = 1.37; sb.ageFn = (x, y, z, id) => oldWall(0, id);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const inRect = i >= wl && i < wr && j >= sill && j < spring + 3;
      if (inRect) continue;
      const y0 = yb + j * dy, y1 = y0 + dy;
      sb.shelter = smoothstep(yt - 4.5, yt - 0.6, (y0 + y1) / 2) * 0.95;
      sb.quad(W(a0 + i * da, y0), W(a0 + (i + 1) * da, y0), W(a0 + (i + 1) * da, y1), W(a0 + i * da, y1));
    }
    // spandrels between the round arch and the course above
    sb.shelter = 0;
    for (let k = 0; k < 8; k++) {
      const t0 = Math.PI - (k / 8) * Math.PI, t1 = Math.PI - ((k + 1) / 8) * Math.PI;
      const p0 = W(ac + (Math.cos(t0) * archR) / R, ySpring + Math.sin(t0) * archR), p1 = W(ac + (Math.cos(t1) * archR) / R, ySpring + Math.sin(t1) * archR);
      sb.quad(p0, p1, W(ac + (Math.cos(t1) * archR) / R, yTop), W(ac + (Math.cos(t0) * archR) / R, yTop));
    }
    // the reveal (the sheet turned in 0.7 m), the gilt leaf behind and the punched fretwork in front of it
    const ySill = yb + sill * dy, aL = ac - hw, aR = ac + hw, edge = [];
    edge.push([aL, ySill]); for (let k = 0; k <= 10; k++) { const t = Math.PI - (k / 10) * Math.PI; edge.push([ac + (Math.cos(t) * archR) / R, ySpring + Math.sin(t) * archR]); } edge.push([aR, ySill]);
    sb.set(0.5, 0.85); sb.seam = -3; sb.ageFn = null;
    for (let k = 0; k < edge.length - 1; k++) sb.quad(W(edge[k][0], edge[k][1], -0.7), W(edge[k + 1][0], edge[k + 1][1], -0.7), W(edge[k + 1][0], edge[k + 1][1]), W(edge[k][0], edge[k][1]));
    sb.quad(W(aR, ySill, -0.7), W(aL, ySill, -0.7), W(aL, ySill), W(aR, ySill));
    sb.set(0, 0, 1, 0);                                        // fire-gilt leaf, in hand-sized flats that glint in turn
    for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) {
      const y0 = ySill + (j / 7) * (yTop - ySill), y1 = ySill + ((j + 1) / 7) * (yTop - ySill), x0 = aL + (i / 4) * (aR - aL), x1 = aL + ((i + 1) / 4) * (aR - aL);
      sb.quad(W(x0, y0, -0.66), W(x1, y0, -0.66), W(x1, y1, -0.66), W(x0, y1, -0.66));
    }
    sb.set(wallAge + 0.1, 0.35, 0, 0); sb.facets = false;      // fretwork: mullions, transoms and a wheel in the arch
    const strip = (xa, ya, xb, yb2, w) => {
      const dx = (xb - xa) * R, dyy = yb2 - ya, l = Math.hypot(dx, dyy) || 1, nx = (-dyy / l) * w / R, ny = (dx / l) * w;
      sb.quad(W(xa - nx, ya - ny, -0.12), W(xb - nx, yb2 - ny, -0.12), W(xb + nx, yb2 + ny, -0.12), W(xa + nx, ya + ny, -0.12));
    };
    for (let i = 1; i < 4; i++) { const x = aL + (i / 4) * (aR - aL); strip(x, ySill, x, ySpring + (i === 2 ? 0 : archR * 0.86), 0.09); }
    for (let j = 1; j <= 4; j++) { const y = ySill + (j / 4.6) * (ySpring - ySill); strip(aR, y, aL, y, 0.09); }
    for (let k = 0; k < 12; k++) { const t0 = (k / 12) * TAU, t1 = ((k + 1) / 12) * TAU, rr = archR * 0.52, cy = ySpring + archR * 0.3;
      strip(ac + (Math.cos(t0) * rr) / R, cy + Math.sin(t0) * rr, ac + (Math.cos(t1) * rr) / R, cy + Math.sin(t1) * rr, 0.08);
      if (k % 2 === 0) strip(ac, cy, ac + (Math.cos(t0) * rr) / R, cy + Math.sin(t0) * rr, 0.06); }
    sb.facets = true;
    // rolled architrave round the opening
    sb.set(wallAge - 0.1, 0.1);
    sb.tube(edge.map((e) => W(e[0], e[1], 0.1).slice(0, 3)), 0.24, 5);
    // the pier on the bay joint: base, shaft in three faces, capital
    const ap = a0, pw = 1.25 / R;
    sb.seam = -1.2; sb.ageFn = (x, y, z, id) => oldWall(0, id * 0.7);
    for (let j = 0; j < 11; j++) {
      const y0 = yb + (j / 11) * (yt - yb - 1.2), y1 = yb + ((j + 1) / 11) * (yt - yb - 1.2), o = j === 0 ? 1.25 : 0.95, o1 = j === 0 ? 1.25 : 0.95, e = j === 0 ? 1.25 : 1;
      sb.shelter = smoothstep(yt - 4.5, yt - 0.6, y1) * 0.7;
      sb.quad(W(ap - pw * e, y0, 0), W(ap - pw * e, y0, o), W(ap - pw * e, y1, o1), W(ap - pw * e, y1, 0));
      sb.quad(W(ap - pw * e, y0, o), W(ap + pw * e, y0, o), W(ap + pw * e, y1, o1), W(ap - pw * e, y1, o1));
      sb.quad(W(ap + pw * e, y0, o), W(ap + pw * e, y0, 0), W(ap + pw * e, y1, 0), W(ap + pw * e, y1, o1));
    }
    sb.shelter = 0; sb.ageFn = null;
    if (b % 2 === 1) await ctx.yield();
  }
  // the deep cornice: sloping soffit (dry, brown), rolled bead, weathered top
  revolve(sb, [[35.0, 25.6, 0.9], [35.5, 26.5, 1], [37.0, 27.3, 1], [37.35, 27.5, 0.3], [37.2, 28.1], [36.2, 28.5], [34.9, 29.4], [34.3, 29.5]], 96, oldWall, 0, TAU, -2.3);
  sb.set(wallAge, 0.2); sb.tube(ringPts(37.4, 27.72, 96), 0.3, 5, true);
  await ctx.yield();
  // the attic: one bay to a gore, each with a fire-gilt oculus in a rolled rim; split like the dome
  const RA = 34.3, ya0 = 29.5, ya1 = 37.2;
  const A = (a, y, off = 0) => [(RA + off) * Math.sin(a), y, (RA + off) * Math.cos(a), a * RA, ya1 - y];
  for (let g = 0; g < D.N; g++) {
    const a0 = g * GORE;
    sb.seam = 1.68; sb.ageFn = (x, y, z, id) => split(g, id);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) {
      const y0 = ya0 + (j / 5) * (ya1 - ya0), y1 = ya0 + ((j + 1) / 5) * (ya1 - ya0);
      sb.shelter = smoothstep(ya1 - 2.6, ya1 - 0.3, (y0 + y1) / 2) * 0.9;
      sb.quad(A(a0 + (i / 4) * GORE, y0), A(a0 + ((i + 1) / 4) * GORE, y0), A(a0 + ((i + 1) / 4) * GORE, y1), A(a0 + (i / 4) * GORE, y1));
    }
    sb.ageFn = null; sb.shelter = 0;
    const ac = a0 + GORE / 2, cy = ya0 + 3.5, ro = 1.45, rim = [];
    sb.set(0, 0, 1, 0);
    for (let k = 0; k < 10; k++) {
      const t0 = (k / 10) * TAU, t1 = ((k + 1) / 10) * TAU;
      sb.quad(A(ac, cy, 0.22), A(ac + (Math.cos(t0) * ro) / RA, cy + Math.sin(t0) * ro, 0.1), A(ac + (Math.cos(t1) * ro) / RA, cy + Math.sin(t1) * ro, 0.1));
      rim.push(A(ac + (Math.cos(t0) * ro) / RA, cy + Math.sin(t0) * ro, 0.16).slice(0, 3));
    }
    const st = split(g, 0.5); sb.set(Math.max(st[0] - 0.15, 0), 0, 0, st[1]);
    sb.tube(rim, 0.2, 4, true);
    // a flat pilaster strip on each gore joint
    const pw = 0.5 / RA; sb.seam = -1; sb.ageFn = (x, y, z, id) => split(g, id);
    sb.quad(A(a0 - pw, ya0, 0.3), A(a0 + pw, ya0, 0.3), A(a0 + pw, ya1, 0.3), A(a0 - pw, ya1, 0.3));
    sb.quad(A(a0 - pw, ya0, 0), A(a0 - pw, ya0, 0.3), A(a0 - pw, ya1, 0.3), A(a0 - pw, ya1, 0));
    sb.quad(A(a0 + pw, ya0, 0.3), A(a0 + pw, ya0, 0), A(a0 + pw, ya1, 0), A(a0 + pw, ya1, 0.3));
    sb.ageFn = null;
    if (g % 3 === 2) await ctx.yield();
  }
  sb.set(0.25);
  // the gutter cornice under the dome's spring line and its rolled lip
  revolve(sb, [[34.3, 36.9, 0.9], [34.9, 37.7, 1], [36.0, 38.3, 1], [36.3, 38.5, 0.2], [36.2, 39.1], [35.5, 39.3], [35.3, 38.9], [34.6, 39.0], [34.5, 40.2], [33.9, 41.2]], 96, split, 0, TAU, -2.2);
  for (let h = 0; h < 2; h++) {     // the lip is two half hoops, old and new
    const pts = []; for (let k = 0; k <= 48; k++) { const a = h * Math.PI + (k / 48) * Math.PI; pts.push([36.38 * Math.sin(a), 38.82, 36.38 * Math.cos(a)]); }
    const st = split(h ? 20 : 4, 0.4); sb.set(st[0], 0, 0, st[1]); sb.tube(pts, 0.26, 5);
  }
  await ctx.yield();
  // scrolled spouts: one under every rib, a rolled tube that leans out and curls
  const spoutTips = [];
  for (let g = 0; g < D.N; g++) {
    const a = g * GORE, pts = [], st = split(g === 0 ? D.N - 1 : g, 0.3);
    for (let k = 0; k <= 9; k++) {
      const t = k / 9, out = 36.2 + 2.0 * Math.sin(t * 1.9) + (t > 0.6 ? -0.9 * (1 - Math.cos((t - 0.6) * 7.0)) * 0.5 : 0), y = 38.6 - 2.4 * t * t + (t > 0.6 ? 0.9 * Math.sin((t - 0.6) * 7.0) * 0.5 : 0);
      pts.push([out * Math.sin(a), y, out * Math.cos(a)]);
    }
    sb.set(Math.max(st[0] - 0.1, 0), 0, 0, st[1]);
    sb.tube(pts, (k) => 0.2 - 0.008 * k, 4);
    spoutTips.push([38.1 * Math.sin(a), 37.0, 38.1 * Math.cos(a)]);
  }
  sb.set(0.25); sb.seam = -0.6;
  return { spoutTips };
}

// THE LANTERN: sixteen colonnettes and round arches round a dry brown core, a cornice and a bell cap; split like
// the dome. Then the gilt ball and the stem of the finial.
async function buildLantern(sb, H, ctx) {
  const split = (g, id) => H.state(g, id, 0.04);
  revolve(sb, [[7.9, 87.2], [8.3, 88.2], [8.1, 88.9], [7.0, 89.3], [6.7, 89.9], [6.2, 90.1]], 32, split, 0, TAU, -1.3);
  for (let h = 0; h < 2; h++) { const pts = []; for (let k = 0; k <= 16; k++) { const a = h * Math.PI + (k / 16) * Math.PI; pts.push([8.35 * Math.sin(a), 88.55, 8.35 * Math.cos(a)]); }
    const st = split(h ? 20 : 4, 0.4); sb.set(st[0], 0, 0, st[1]); sb.tube(pts, 0.22, 4); }
  // dry core behind the arcade
  sb.set(0.5, 1); revolve(sb, [[4.9, 90.0, 1], [4.9, 93.5, 1], [4.9, 97.6, 1]], 16, () => [0.5, 0], 0, TAU, 1.2);
  const n = 16, LA = TAU / n;
  for (let k = 0; k < n; k++) {
    const a = k * LA, g = k === 0 ? D.N - 1 : k * 2, st = split(g, 0.3);
    const col = []; for (let j = 0; j <= 5; j++) col.push([6.05 * Math.sin(a), 90.1 + j * 1.1, 6.05 * Math.cos(a)]);
    sb.set(Math.max(st[0] - 0.1, 0), 0, 0, st[1]);
    sb.tube(col, (j) => (j === 0 || j === 5 ? 0.42 : 0.27), 5);
    const st2 = split(k * 2 + 1, 0.3), arch = [];
    for (let j = 0; j <= 8; j++) { const t = j / 8, aa = a + t * LA; arch.push([6.05 * Math.sin(aa), 95.6 + Math.sin(t * Math.PI) * 1.15, 6.05 * Math.cos(aa)]); }
    sb.set(Math.max(st2[0] - 0.1, 0), 0.2, 0, st2[1]); sb.tube(arch, 0.2, 4);
    // spandrel wall above the arch
    sb.seam = -1; sb.ageFn = (x, y, z, id) => split(k * 2 + 1, id);
    for (let j = 0; j < 4; j++) { const t0 = j / 4, t1 = (j + 1) / 4, a0 = a + t0 * LA, a1 = a + t1 * LA;
      sb.quad([6.0 * Math.sin(a0), 95.6 + Math.sin(t0 * Math.PI) * 1.15, 6.0 * Math.cos(a0)], [6.0 * Math.sin(a1), 95.6 + Math.sin(t1 * Math.PI) * 1.15, 6.0 * Math.cos(a1)], [6.0 * Math.sin(a1), 97.6, 6.0 * Math.cos(a1)], [6.0 * Math.sin(a0), 97.6, 6.0 * Math.cos(a0)]); }
    sb.ageFn = null;
  }
  await ctx.yield();
  // cornice and the bell cap in sixteen hammered gores, a rolled rib on each joint
  revolve(sb, [[6.0, 97.5, 0.9], [6.5, 98.0, 1], [7.5, 98.5, 1], [7.75, 98.7, 0.2], [7.6, 99.2], [6.6, 99.6]], 32, split, 0, TAU, -1.4);
  const cap = (t) => [5.85 * (1 - t) * (1 - t) * (1 - 0.35 * t) + 0.75, 99.6 + 6.6 * (0.25 * t + 0.75 * t * t)];
  const prof = []; for (let j = 0; j <= 7; j++) prof.push(cap(j / 7));
  revolve(sb, prof, 32, split, 0, TAU, -1.3);
  for (let k = 0; k < n; k++) {
    const a = k * LA, st = split(k === 0 ? D.N - 1 : k * 2, 0.2), pts = prof.map((p) => [(p[0] + 0.06) * Math.sin(a), p[1] + 0.05, (p[0] + 0.06) * Math.cos(a)]);
    sb.set(Math.max(st[0] - 0.15, 0), 0, 0, st[1]); sb.tube(pts, (j) => 0.16 - 0.01 * j, 4);
  }
  // fire-gilt: collar, ball, stem
  sb.set(0, 0, 1, 0);
  revolve(sb, [[0.75, 106.1], [1.25, 106.5], [0.7, 107.0], [1.0, 107.5], [1.75, 108.3], [2.05, 109.4], [1.75, 110.5], [1.0, 111.3], [0.6, 111.9], [0.85, 112.4], [0.5, 112.9], [0.45, 116.0], [0.9, 116.5], [0.9, 117.0], [0.0, 117.6]], 12, () => [0, 0], 0, TAU, -1);
  sb.set(0.25); sb.seam = -0.6;
}

// box-section hoop: circle of radius R about `c` in the plane spanned by unit U, V (band width 2*hw along U x V,
// radial thickness th); t0..t1 in radians. Sheet seams and rivets are drawn by the shader every `lap` metres.
function hoop(sb, c, U, V, R, hw, th, segs, t0 = 0, t1 = TAU, lap = 1.6) {
  const N = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
  const P = (t, r, w) => { const cs = Math.cos(t) * r, sn = Math.sin(t) * r; return [c[0] + U[0] * cs + V[0] * sn + N[0] * w, c[1] + U[1] * cs + V[1] * sn + N[1] * w, c[2] + U[2] * cs + V[2] * sn + N[2] * w, t * R, w]; };
  sb.seam = lap;
  for (let k = 0; k < segs; k++) {
    const a = t0 + ((t1 - t0) * k) / segs, b = t0 + ((t1 - t0) * (k + 1)) / segs, ro = R + th / 2, ri = R - th / 2;
    sb.quad(P(a, ro, -hw), P(b, ro, -hw), P(b, ro, hw), P(a, ro, hw));
    sb.quad(P(b, ri, -hw), P(a, ri, -hw), P(a, ri, hw), P(b, ri, hw));
    sb.quad(P(a, ri, hw), P(a, ro, hw), P(b, ro, hw), P(b, ri, hw));
    sb.quad(P(a, ro, -hw), P(a, ri, -hw), P(b, ri, -hw), P(b, ro, -hw));
  }
  if (Math.abs(t1 - t0) < TAU - 1e-3) for (const [t, f] of [[t0, 1], [t1, -1]]) {   // end caps of an arc
    const ro = R + th / 2, ri = R - th / 2;
    if (f > 0) sb.quad(P(t, ri, -hw), P(t, ro, -hw), P(t, ro, hw), P(t, ri, hw)); else sb.quad(P(t, ro, -hw), P(t, ri, -hw), P(t, ri, hw), P(t, ro, hw));
  }
}

// THE ARMILLARY FINIAL, fire-gilt. Its polar axis is the camera's last line (58 degrees up, toward -Z); the
// equatorial hoop faces the approach and carries the collar the portal sits in, on brackets to east, west and north.
const ARM = { c: [0, D.armY, 0], a: [0, 0.848, -0.53], e1: [1, 0, 0], e2: [0, -0.53, -0.848] };
const _add = (c, ...t) => { const o = [c[0], c[1], c[2]]; for (let i = 0; i < t.length; i += 2) { o[0] += t[i][0] * t[i + 1]; o[1] += t[i][1] * t[i + 1]; o[2] += t[i][2] * t[i + 1]; } return o; };
async function buildArmillary(sb, ctx) {
  const { c, a, e1, e2 } = ARM;
  sb.set(0, 0, 1, 0);
  hoop(sb, c, e1, e2, 10.5, 0.62, 0.18, 48, 0, TAU, 1.375);                       // equatorial hoop
  for (const s of [-1, 1]) hoop(sb, _add(c, a, s * 8.04), e1, e2, 6.75, 0.3, 0.14, 32, 0, TAU, 1.325);   // polar circles
  for (let k = 0; k < 4; k++) {                                                    // four meridian staves
    const L = Math.PI / 4 + k * Math.PI / 2, U = _add([0, 0, 0], e1, Math.cos(L), e2, Math.sin(L));
    hoop(sb, c, U, a, 10.5, 0.26, 0.14, 14, -0.873, 0.873, 1.31);
  }
  hoop(sb, c, e1, e2, 7.55, 0.22, 0.8, 48, 0, TAU, 0.988);                         // the portal's collar
  await ctx.yield();
  for (const t of [0, Math.PI, Math.PI / 2]) {                                     // brackets: east, west, north
    const rho = _add([0, 0, 0], e1, Math.cos(t), e2, Math.sin(t)), tau = _add([0, 0, 0], e1, -Math.sin(t), e2, Math.cos(t));
    for (const sgn of [-1, 1]) {
      const pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push(_add(c, rho, 7.9 + 2.55 * u, tau, sgn * 0.75 * Math.sin(u * Math.PI) * (1 - 0.5 * u), a, 0.0)); }
      sb.tube(pts, 0.13, 4);
    }
    sb.tube([_add(c, rho, 7.9), _add(c, rho, 10.45)], 0.17, 4);
  }
  // the yoke from the stem to the east and west pivots, and the north stay
  for (const sx of [-1, 1]) {
    const pts = []; for (let j = 0; j <= 14; j++) { const u = j / 14, an = u * Math.PI / 2; pts.push([sx * 12.7 * Math.sin(an), 116.4 + 15.6 * (1 - Math.cos(an)), 0]); }
    sb.tube(pts, (j) => 0.42 - 0.012 * j, 6);
    sb.tube([[sx * 12.9, 132, 0], [sx * 10.5, 132, 0]], 0.2, 5);
    const b = [sx * 12.9, 132, 0];
    sb.grid(6, 4, (s, t) => { const th = s * TAU, ph = (t - 0.5) * Math.PI; return [b[0] + 0.5 * Math.cos(ph) * Math.cos(th), b[1] + 0.5 * Math.sin(ph), b[2] - 0.5 * Math.cos(ph) * Math.sin(th)]; });
  }
  { const end = _add(c, e2, 10.55), pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([0, lerp(116.6, end[1], u) - 1.6 * Math.sin(u * Math.PI), lerp(0, end[2], u * u * (3 - 2 * u)) - 0.2]); } sb.tube(pts, 0.24, 5); }
  sb.set(0.25); sb.seam = -0.6;
}
// a turning hoop: built round +Y at the origin (the mesh is aligned to the polar axis and spun in update)
function buildTurningHoop(rng, off, tilt, emblem) {
  const sb = new SheetBuilder(rng, 2400); sb.set(0, 0, 1, 0);
  const U = [1, 0, 0], V = [0, -Math.sin(tilt), -Math.cos(tilt)], c = [0, off, 0], R = 8.9;
  hoop(sb, c, U, V, R, 0.36, 0.14, 48, 0, TAU, 1.165);
  const N = [0, Math.cos(tilt), -Math.sin(tilt)];
  const at = (t, r, w) => _add(c, U, Math.cos(t) * r, V, Math.sin(t) * r, N, w);
  const plate = (pts) => { for (let i = 1; i < pts.length - 1; i++) { sb.quad(pts[0], pts[i], pts[i + 1]); } };
  // wind cups: small sails standing out of the band
  for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU + 0.2; plate([at(t, R + 0.05, -0.34), at(t + 0.035, R + 0.9, 0), at(t, R + 0.05, 0.34)]); }
  // the emblem rides outside the band: a sun in splendour or a crescent
  const t0 = 1.1, P = (x, y) => at(t0 + x / R, R + 0.22, y);
  if (emblem === 'sun') {
    const disc = [P(0, 0)]; for (let k = 0; k <= 12; k++) disc.push(P(Math.cos(k / 12 * TAU) * 0.95, Math.sin(k / 12 * TAU) * 0.95)); plate(disc);
    for (let k = 0; k < 12; k++) { const an = (k / 12) * TAU, d = 0.16, r1 = k % 2 ? 1.5 : 2.0; plate([P(Math.cos(an - d) * 1.05, Math.sin(an - d) * 1.05), P(Math.cos(an) * r1, Math.sin(an) * r1), P(Math.cos(an + d) * 1.05, Math.sin(an + d) * 1.05)]); }
  } else {
    for (let k = 0; k < 10; k++) { const a0 = -1.9 + (k / 10) * 3.8, a1 = -1.9 + ((k + 1) / 10) * 3.8, w0 = Math.cos(a0 / 1.9 * Math.PI / 2), w1 = Math.cos(a1 / 1.9 * Math.PI / 2);
      plate([P(Math.cos(a0) * 1.3, Math.sin(a0) * 1.3), P(Math.cos(a1) * 1.3, Math.sin(a1) * 1.3), P(Math.cos(a1) * (1.3 - 0.75 * w1), Math.sin(a1) * 1.3), P(Math.cos(a0) * (1.3 - 0.75 * w0), Math.sin(a0) * 1.3)]); }
    for (let k = 0; k < 3; k++) { const cx = 2.3 + k * 0.2, cy = -0.9 + k * 0.9; plate([P(cx, cy + 0.3), P(cx - 0.3, cy), P(cx, cy - 0.3), P(cx + 0.3, cy)]); }
  }
  return sb.geometry();
}

// THE SCAFFOLD on the new half: drawn rod standards, ledgers, transoms and braces as instances; plank walks,
// ladders, stacked sheets and the hoist as sheet. Returns the rod list [ax,ay,az, bx,by,bz, thickness, loose].
async function buildScaffold(sb, rng, detail, ctx) {
  const rods = [], perches = [];
  const rod = (a, b, th = 0.075, loose = 0) => rods.push(a[0], a[1], a[2], b[0], b[1], b[2], th, loose);
  const lifts = 12, cols = 16;                                   // standards every half gore from 0.5 to 15.5
  const phiOf = (l) => 0.03 + (l / (lifts - 1)) * 0.93;
  const S = (i, l, off) => { const x = 0.5 + i, g = Math.min(Math.floor(x), 15); return domeAt(g, x - g, phiOf(l), off); };
  const plank = (a, b, c, d) => { sb.quad(a, b, c, d); };
  sb.facets = true; sb.seam = 0.3;
  for (let i = 0; i < cols; i++) {
    const topL = lifts - 1 - (i % 2 ? 1 : 0) - (rng.chance(0.3) ? 1 : 0);
    for (let l = 0; l <= topL; l++) {
      const o = S(i, l, 2.5), n = S(i, l, 0.95);
      if (l < topL) { rod(o, S(i, l + 1, 2.5), 0.085); if (i % 2 === 0 && l < 8) rod(n, S(i, l + 1, 0.95), 0.07); }
      rod(n, o, 0.06);
      if (i < cols - 1 && l <= topL - (rng.chance(0.2) ? 1 : 0)) {
        rod(o, S(i + 1, l, 2.5), 0.065);
        if (l > 0) { const hr = [o[0], o[1] + 1.05, o[2]], o2 = S(i + 1, l, 2.5); if (l % 2 === 1) rod(hr, [o2[0], o2[1] + 1.05, o2[2]], 0.045); }   // guard rail
        if (rng() < 0.3 * detail && l < topL) rod(o, S(i + 1, l + 1, 2.5), 0.05);                                  // brace
        // plank walk on most lifts: two strips of sheet across the transoms
        if (l > 0 && (l % 2 === 1 || rng.chance(0.3)) && !rng.chance(0.12)) {
          const a0 = S(i, l, 1.15), a1 = S(i, l, 2.4), b0 = S(i + 1, l, 1.15), b1 = S(i + 1, l, 2.4), sag = rng.range(0.03, 0.12);
          const m0 = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2 - sag, (a0[2] + b0[2]) / 2], m1 = [(a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2 - sag, (a1[2] + b1[2]) / 2];
          sb.set(rng.range(0.16, 0.34), 0, 0, 0);
          plank(a1, m1, m0, a0); plank(m1, b1, b0, m0);
          if (rng.chance(0.5)) perches.push([m1[0], m1[1] + 1.1, m1[2]]);
          // things left on the walk: a stack of new sheets, a bucket of rivets
          if (rng.chance(0.13)) {
            const c = [(m0[0] + m1[0]) / 2, m0[1] + 0.02, (m0[2] + m1[2]) / 2], ax = [(b1[0] - a1[0]) * 0.22, 0, (b1[2] - a1[2]) * 0.22], az = [(a1[0] - a0[0]) * 0.3, 0, (a1[2] - a0[2]) * 0.3], h = rng.range(0.25, 0.7);
            const P = (u, v, y) => [c[0] + ax[0] * u + az[0] * v, c[1] + y, c[2] + ax[2] * u + az[2] * v];
            sb.set(rng.range(0, 0.08), 0, 0, 1);
            sb.quad(P(-1, 1, h), P(1, 1, h), P(1, -1, h), P(-1, -1, h));
            sb.quad(P(-1, 1, 0), P(1, 1, 0), P(1, 1, h), P(-1, 1, h)); sb.quad(P(1, -1, 0), P(-1, -1, 0), P(-1, -1, h), P(1, -1, h));
            sb.quad(P(1, 1, 0), P(1, -1, 0), P(1, -1, h), P(1, 1, h)); sb.quad(P(-1, -1, 0), P(-1, 1, 0), P(-1, 1, h), P(-1, -1, h));
          }
        }
      }
      if (rng.chance(0.07)) { const e = [o[0] + rng.range(-0.3, 0.3), o[1] - rng.range(1.2, 2.6), o[2] + rng.range(-0.3, 0.3)]; rods.push(o[0], o[1], o[2], e[0], e[1], e[2], 0.11, 1); }   // loose strip
      if (l === topL) perches.push(o);
    }
    if (i % 3 === 2) await ctx.yield();
    // ladders zig-zag up every fourth bay
    if (i % 4 === 1) for (let l = 0; l < topL - 1; l++) {
      const a = S(i + (l % 2 ? 0.75 : 0.25), l, 1.9), b = S(i + (l % 2 ? 0.25 : 0.75), l + 1, 1.9), dx = S(i + 0.5, l, 2.3), w = [(dx[0] - a[0]), 0, (dx[2] - a[2])], wl = Math.hypot(w[0], w[2]) || 1;
      const ox = (w[0] / wl) * 0.22, oz = (w[2] / wl) * 0.22;
      rod([a[0] - ox, a[1], a[2] - oz], [b[0] - ox, b[1] + 0.9, b[2] - oz], 0.05); rod([a[0] + ox, a[1], a[2] + oz], [b[0] + ox, b[1] + 0.9, b[2] + oz], 0.05);
      for (let r = 1; r < 9; r++) { const t = r / 9; rod([lerp(a[0], b[0], t) - ox, lerp(a[1], b[1] + 0.9, t), lerp(a[2], b[2], t) - oz], [lerp(a[0], b[0], t) + ox, lerp(a[1], b[1] + 0.9, t), lerp(a[2], b[2], t) + oz], 0.035); }
    }
  }
  // the drum's share: straight standards from the square to the gutter on every gore joint of the new half
  for (let i = 0; i <= 15; i += 2) {
    const a = (i + 0.5) * GORE, lev = 9, W = (r, y, da = 0) => [r * Math.sin(a + da), y, r * Math.cos(a + da)];
    for (let l = 0; l < lev; l++) {
      const y0 = 2.8 + l * 4.1, y1 = y0 + 4.1, ro = 40.6, ri = 38.9;
      rod(W(ro, y0), W(ro, y1), 0.09); rod(W(ri, y0), W(ri, y1), 0.075); rod(W(ri, y1), W(ro, y1), 0.06);
      if (i < 14) { for (const h of [0, 1]) { rod(W(ro, y1, h * GORE), W(ro, y1, (h + 1) * GORE), 0.065); if (l % 3 === 1) rod(W(ro, y1 + 1.05, h * GORE), W(ro, y1 + 1.05, (h + 1) * GORE), 0.045); }
        if (rng() < 0.3 * detail) rod(W(ro, y0), W(ro, y1, 2 * GORE), 0.05);
        if (l % 3 === 1 || l === lev - 1) { sb.set(rng.range(0.16, 0.34), 0, 0, 0); for (const h of [0, 1]) plank(W(ro - 0.1, y1 + 0.04, h * GORE), W(ro - 0.1, y1 + 0.04, (h + 1) * GORE), W(ri + 0.1, y1 + 0.04, (h + 1) * GORE), W(ri + 0.1, y1 + 0.04, h * GORE)); } }
    }
  }
  // the hoist: a jib over the cornice with a wheel, the rope (loose) and a bundle of sheets on the hook
  const ha = (3 + rng.int(0, 8) + 0.5) * GORE, hx = Math.sin(ha), hz = Math.cos(ha);
  const top = [39.8 * hx, 44.5, 39.8 * hz], tip = [44.0 * hx, 46.8, 44.0 * hz], foot = [40.6 * hx, 39.7, 40.6 * hz], hookY = rng.range(14, 24);
  rod(foot, tip, 0.14); rod(top, tip, 0.09); rod([38.9 * hx, 39.7, 38.9 * hz], top, 0.09);
  rods.push(tip[0], tip[1] - 0.4, tip[2], tip[0], hookY + 1.4, tip[2], 0.045, 1);
  const bx = tip[0], bz = tip[2], q = (u, v, y) => [bx + hx * u - hz * v, hookY + y, bz + hz * u + hx * v];
  sb.set(0.03, 0, 0, 1);
  sb.quad(q(-0.9, 1.3, 0.35), q(0.9, 1.3, 0.35), q(0.9, -1.3, 0.35), q(-0.9, -1.3, 0.35)); sb.quad(q(-0.9, -1.3, 0), q(0.9, -1.3, 0), q(0.9, 1.3, 0), q(-0.9, 1.3, 0));
  sb.quad(q(0.9, 1.3, 0), q(0.9, -1.3, 0), q(0.9, -1.3, 0.35), q(0.9, 1.3, 0.35)); sb.quad(q(-0.9, -1.3, 0), q(-0.9, 1.3, 0), q(-0.9, 1.3, 0.35), q(-0.9, -1.3, 0.35));
  for (const [u, v] of [[-0.9, 1.3], [0.9, 1.3], [0.9, -1.3], [-0.9, -1.3]]) rod(q(u, v, 0.35), q(0, 0, 1.4), 0.035);
  sb.set(0.25); sb.seam = -0.6;
  return { rods, perches };
}
export function rodMesh(rods, style, rng, age = 0.36) {
  const n = rods.length / 8, g = new THREE.BufferGeometry();
  const pos = [], nor = [], surf = [];
  for (let s = 0; s < 4; s++) {
    const a0 = (s / 4) * TAU + Math.PI / 4, a1 = ((s + 1) / 4) * TAU + Math.PI / 4, am = (a0 + a1) / 2, r = 0.7071;
    const c = [[Math.cos(a0) * r, 0, Math.sin(a0) * r], [Math.cos(a0) * r, 1, Math.sin(a0) * r], [Math.cos(a1) * r, 1, Math.sin(a1) * r], [Math.cos(a1) * r, 0, Math.sin(a1) * r]];
    for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...c[k]); nor.push(Math.cos(am), 0, Math.sin(am)); surf.push(0, c[k][1], -1); }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aSurf', new THREE.Float32BufferAttribute(surf, 3));
  const st = new Float32Array(n * 4), fl = new Float32Array(n * 4), mesh = new THREE.InstancedMesh(g, metalMaterial(style, { rod: true }), n);
  const A = new THREE.Vector3(), Bv = new THREE.Vector3(), X = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4(), up = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const o = i * 8, th = rods[o + 6], loose = rods[o + 7];
    A.set(rods[o], rods[o + 1], rods[o + 2]); Bv.set(rods[o + 3] - A.x, rods[o + 4] - A.y, rods[o + 5] - A.z);
    up.set(0, 1, 0); if (Math.abs(Bv.y) > 0.95 * Bv.length()) up.set(A.x, 0, A.z).normalize();
    X.crossVectors(up, Bv).normalize(); Z.crossVectors(X, Bv).normalize();
    M.makeBasis(X.multiplyScalar(th), Bv, Z.multiplyScalar(loose === 1 ? th * 0.25 : th)); M.setPosition(A); mesh.setMatrixAt(i, M);
    st[i * 4] = age + rng.range(-0.08, 0.14); st[i * 4 + 1] = 0; st[i * 4 + 2] = loose === 3 ? 1 : loose > 1.5 ? 2 : 0; st[i * 4 + 3] = loose && loose !== 3 ? 1 : 0;
    fl[i * 4 + 3] = rng();
  }
  g.setAttribute('aState', new THREE.InstancedBufferAttribute(st, 4)); g.setAttribute('aFlat', new THREE.InstancedBufferAttribute(fl, 4));
  mesh.frustumCulled = false; return mesh;
}

// RIVETS: instanced caps (a low four-sided boss) standing on the sheet. list: [px,py,pz, nx,ny,nz, gore, size]
function rivetMesh(list, style, H, rng, detail) {
  const all = list.length / 8, keep = [];
  for (let i = 0; i < all; i++) if (list[i * 8 + 7] < 0.06 || rng() < detail * 0.9) keep.push(i);
  const pos = [], nor = [], r1 = 0.62, h = 0.55;
  const ring = (k, r, y) => [Math.cos(k * TAU / 4 + 0.785) * r, y, Math.sin(k * TAU / 4 + 0.785) * r];
  for (let k = 0; k < 4; k++) {
    const a = ring(k, 1, 0), b = ring(k + 1, 1, 0), c = ring(k + 1, r1, h), d = ring(k, r1, h), top = [0, h * 1.25, 0];
    for (const p of [a, d, c, a, c, b, d, top, c]) { pos.push(...p); const l = Math.hypot(p[0], p[1] + 0.55, p[2]) || 1; nor.push(p[0] / l, (p[1] + 0.55) / l, p[2] / l); }
  }
  const g = new THREE.BufferGeometry(), nv = pos.length / 3;
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aFlat', new THREE.Float32BufferAttribute(new Float32Array(nv * 4), 4));
  const sf = new Float32Array(nv * 3); for (let i = 0; i < nv; i++) sf[i * 3 + 2] = -1; g.setAttribute('aSurf', new THREE.Float32BufferAttribute(sf, 3));
  const n = keep.length, st = new Float32Array(n * 4), mesh = new THREE.InstancedMesh(g, metalMaterial(style, { instanced: true }), n);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), N = new THREE.Vector3(), P = new THREE.Vector3(), Sc = new THREE.Vector3();
  for (let j = 0; j < n; j++) {
    const o = keep[j] * 8, s = list[o + 7];
    N.set(list[o + 3], list[o + 4], list[o + 5]).normalize(); q.setFromUnitVectors(Y, N); P.set(list[o], list[o + 1], list[o + 2]); Sc.set(s, s, s);
    M.compose(P, q, Sc); mesh.setMatrixAt(j, M);
    const stt = H.state(list[o + 6], rng());
    st[j * 4] = stt[1] ? stt[0] * 0.5 : Math.min(stt[0], 0.62) - 0.08 * rng(); st[j * 4 + 3] = stt[1];
  }
  g.setAttribute('aState', new THREE.InstancedBufferAttribute(st, 4));
  mesh.frustumCulled = false; return mesh;
}

// THE JACKDAWS: each one offcut folded once along the spine, a beak and two wing plates that hinge. Perched until
// uRelease passes each bird's delay, then up, round over the seam as one flock and down again on the dry side.
const BIRD_FLIGHT_GLSL = /* glsl */`
  vec3 gwFlock(float t, vec4 fly){
    float al = -0.5 + 0.85*t - fly.y*0.9 + 0.2*sin(t*0.9 + fly.w*6.28);
    float R = mix(20., 31., fly.z) + 3.*sin(t*0.7 + fly.w*17.);
    float y = 96. + 16.*fract(fly.z*7.31 + fly.y*3.7) + 3.*sin(t*1.1 + fly.w*29.);
    return vec3(-R*cos(al), y, R*sin(al));
  }
  vec3 gwBirdPos(float t, vec3 perch, vec3 land, vec4 fly){
    float tl = 4.3 + 1.6*fly.w;
    float k1 = smoothstep(0., 2.4, t), k2 = smoothstep(tl, tl + 2.6, t);
    vec3 rise = perch + vec3(perch.x*0.03, 3.2, perch.z*0.03)*min(t, 3.)*smoothstep(0., 1.2, t);
    vec3 p = mix(rise, gwFlock(t, fly), k1);
    vec3 hover = land + vec3(0., 5.*(1. - k2)*(1. - k2), 0.);
    return mix(p, hover, k2);
  }`;
export function birdMaterial(style) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uRelease: style.uniforms.uRelease }, style.uniforms), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aPerch, aLand, aFly; attribute vec2 aPart;
      uniform float uRelease, uTime, uPx;
      varying vec3 vP; varying float vNape;
      ${BIRD_FLIGHT_GLSL}
      void main(){
        float t = uRelease - aFly.x;
        float tl = 4.3 + 1.6*aFly.w;
        float fly = step(0., t)*smoothstep(0., 0.5, t)*(1. - smoothstep(tl + 2.2, tl + 2.7, t));
        vec3 c = t <= 0. ? aPerch.xyz : gwBirdPos(t, aPerch.xyz, aLand.xyz, aFly);
        vec3 c2 = t <= 0. ? aPerch.xyz : gwBirdPos(t + 0.08, aPerch.xyz, aLand.xyz, aFly);
        float yaw = mix(aPerch.w, aLand.w, step(tl, t)) + 0.5*sin(uTime*0.7 + aFly.w*40.)*step(0.6, fract(uTime*0.13 + aFly.w*3.));
        vec3 fwd = vec3(sin(yaw), 0., cos(yaw));
        vec3 dv = c2 - c; float dl = length(dv);
        if (dl > 1e-3 && fly > 0.01) fwd = normalize(mix(fwd, dv/dl, fly) + vec3(0., 0., 1e-4));
        vec3 rt = vec3(fwd.z, 0., -fwd.x); float rl = length(rt); rt = rl > 1e-4 ? rt/rl : vec3(1., 0., 0.);
        vec3 up = cross(fwd, rt);
        // wings hinge at the spine: beating in flight, folded back along the body on the perch
        vec3 p = position; float side = aPart.x;                 // -1 left wing, 1 right wing, 0 body
        float beat = sin(uTime*(11. + 4.*aFly.w) + aFly.w*60.)*(0.55 + 0.45*sin(uTime*0.8 + aFly.z*20.));
        float ang = mix(-1.25, 0.15 + 0.85*beat, fly)*abs(side);
        float ca = cos(ang), sa = sin(ang);
        float px = abs(p.x); p = vec3(sign(p.x)*px*ca, p.y + px*sa*(1. + 0.35*aPart.y), p.z - px*0.35*(1. - fly)*abs(side));
        p.y += 0.05*sin(uTime*2.3 + aFly.w*30.)*(1. - fly);        // a perched bird bobs
        vec3 wc = (modelMatrix*vec4(c, 1.)).xyz;
        float need = 2.2*uPx*length(wc - cameraPosition)/max(projectionMatrix[1][1], 1e-3);
        // only a bird in flight is enlarged to its pixel minimum; perched birds keep their size and are folded away
        // beyond 300 m, so the far dome is a clean field with ribs, not confetti
        float bd = length(wc - cameraPosition);
        p *= mix(clamp(need/0.7, 1., 1.7)*(1. - smoothstep(210., 300., bd)), clamp(need/0.7, 1., 7.), fly);
        vec3 lp = c + rt*p.x + up*p.y + fwd*p.z;
        vec4 wp = modelMatrix*vec4(lp, 1.);
        vP = wp.xyz; vNape = aPart.y;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      varying vec3 vP; varying float vNape; uniform float uBirdPale;
      void main(){
        vec3 dx = dFdx(vP), dy = dFdy(vP), n = cross(dx, dy); float nl = dot(n, n);
        vec3 N = nl > 1e-16 ? n*inversesqrt(nl) : vec3(0., 1., 0.);
        vec3 dv = cameraPosition - vP; float dist = max(length(dv), 1e-3); vec3 V = dv/dist;
        if (dot(N, V) < 0.) N = -N;
        vec3 rel = gwSky(reflect(-V, N))/max(uPal[6], vec3(1e-3));
        vec3 base = mix(uPal[2]*0.8, mix(uPal[2], uPal[6], 0.55), smoothstep(0.35, 0.9, vNape));
        base = mix(base, mix(uPal[0], uPal[6], 0.28)*(0.92 + 0.3*smoothstep(0.35, 0.9, vNape)), uBirdPale*0.92);
        base = mix(base, uPal[5], step(1.5, vNape));                 // the beak is a snip of gilt
        vec3 col = base*(0.45 + 0.6*rel);
        col = mix(col, mix(uPal[4], uPal[6], 0.3), smoothstep(uFar.x, uFar.y, dist)*0.9);
        gl_FragColor = vec4(gwFinish(col, 0.), 1.);
      }`,
  });
}
function birdMesh(style, rng, count, perches, lands, waves) {
  const pos = [], part = [];
  const tri = (a, b, c, side, na, nb, nc) => { pos.push(...a, ...b, ...c); part.push(side, na, side, nb, side, nc); };
  // body: one plate folded along the spine (two flanks), paler nape toward the head; beak; fan tail
  const head = [0, 0.1, 0.42], nape = [0, 0.16, 0.2], rump = [0, 0.07, -0.3], bl = [-0.11, -0.07, 0.12], br = [0.11, -0.07, 0.12], tl = [-0.1, 0.0, -0.62], tr = [0.1, 0.0, -0.62];
  for (const b of [bl, br]) { tri(head, nape, b, 0, 0.6, 1, 0.3); tri(nape, rump, b, 0, 1, 0, 0.3); }
  tri(head, [0, 0.07, 0.6], [0, 0.02, 0.44], 0, 2, 2, 2); tri(rump, tl, tr, 0, 0, 0, 0);
  for (const s of [-1, 1]) {      // wing: an inner plate and a swept tip (aPart.y > 0 bends the tip further)
    const r0 = [s * 0.04, 0.1, 0.2], r1 = [s * 0.04, 0.08, -0.16], m0 = [s * 0.42, 0.1, 0.24], m1 = [s * 0.4, 0.08, -0.2], tip = [s * 0.86, 0.1, -0.06];
    tri(r0, m0, m1, s, 0, 0.2, 0.2); tri(r0, m1, r1, s, 0, 0.2, 0); tri(m0, tip, m1, s, 0.2, 0.9, 0.2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2));
  const aP = new Float32Array(count * 4), aL = new Float32Array(count * 4), aF = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const p = perches[i % perches.length], l = lands[Math.floor(rng() * lands.length)];
    aP.set([p[0], p[1], p[2], Math.atan2(p[0], p[2]) + rng.range(-1.2, 1.2)], i * 4);
    aL.set([l[0] + rng.range(-0.8, 0.8), l[1], l[2] + rng.range(-0.8, 0.8), Math.atan2(l[0], l[2]) + rng.range(-1.2, 1.2)], i * 4);
    aF.set([clamp((p[0] + 35) / 70, 0, 1) * 2.2 + rng.range(0, 0.7), rng(), rng(), rng()], i * 4);
    if (waves) aF[i * 4] = Math.min(Math.floor(aF[i * 4] / 2.9 * 3), 2) * 1.5 + 0.25 * aF[i * 4 + 3];   // pigeons clatter up in three waves
  }
  g.setAttribute('aPerch', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aLand', new THREE.InstancedBufferAttribute(aL, 4)); g.setAttribute('aFly', new THREE.InstancedBufferAttribute(aF, 4));
  const mesh = new THREE.InstancedMesh(g, birdMaterial(style), count); mesh.frustumCulled = false;
  const I = new THREE.Matrix4(); for (let i = 0; i < count; i++) mesh.setMatrixAt(i, I);
  return mesh;
}

// THE RAIN: slanted tinned wires in a box that wraps round whichever camera is drawing, only where the line has
// passed. No CPU work per frame. makeRain(style, rng, { count, box:[x,y,z], length }) -> Mesh (add it to the scene).
export function rainMaterial(style) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uBox: { value: new THREE.Vector3(150, 110, 150) }, uLen: { value: 3.2 }, uNear: { value: 3.5 } }, style.uniforms),
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aSeed;
      uniform float uTime, uFront, uPx, uLen, uBulgeA, uNear; uniform vec2 uRainN; uniform vec3 uBox; uniform vec4 uBulge;
      varying vec2 vUv; varying float vA;
      void main(){
        vec3 fall = normalize(vec3(uRainN.x*0.30, -1., uRainN.y*0.30));
        float speed = 34. + 12.*aSeed.w;
        vec3 q = aSeed.xyz*uBox + fall*(uTime*speed);
        vec3 c = mod(q - cameraPosition + 0.5*uBox, uBox) - 0.5*uBox + cameraPosition;
        float bz = (c.z - uBulge.z)/max(uBulge.w, 1.);
        float w = (uFront - dot(uRainN, c.xz))/6.5 + uBulgeA*smoothstep(uBulge.x, uBulge.y, c.x)*exp(-bz*bz);
        vec3 toCam = cameraPosition - c; float dist = max(length(toCam), 1e-3);
        vec3 sd = cross(fall, toCam/dist); float sl = length(sd); sd = sl > 1e-4 ? sd/sl : vec3(1., 0., 0.);
        float pxm = uPx*dist/max(projectionMatrix[1][1], 1e-3);
        float halfW = clamp(0.012, 0.8*pxm, 1.4*pxm);
        vec3 p = c + fall*(position.y*uLen*(0.7 + 0.6*aSeed.w)) + sd*(position.x*halfW);
        vUv = position.xy;
        vA = smoothstep(0., 0.6, w)*smoothstep(0.5*min(uBox.x, uBox.z), 0.3*min(uBox.x, uBox.z), dist)*clamp(0.012/halfW, 0.25, 1.)*smoothstep(0.23*uNear, uNear, dist);
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      varying vec2 vUv; varying float vA;
      void main(){
        float a = (1. - abs(vUv.x))*smoothstep(0., 0.2, vUv.y)*smoothstep(1., 0.6, vUv.y)*vA;
        if (a < 0.01) discard;
        gl_FragColor = vec4(gwFinish(uPal[6]*1.12, uSlot*0.5), a*0.7);
      }`,
  });
}
export function makeRain(style, rng, o = {}) {
  const count = o.count ?? 3000, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  const seed = new Float32Array(count * 4); for (let i = 0; i < count * 4; i++) seed[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  const mat = rainMaterial(style); if (o.box) mat.uniforms.uBox.value.set(...o.box); if (o.length) mat.uniforms.uLen.value = o.length; if (o.near) mat.uniforms.uNear.value = o.near;
  const m = new THREE.InstancedMesh(g, mat, count), I = new THREE.Matrix4(); for (let i = 0; i < count; i++) m.setMatrixAt(i, I);
  m.frustumCulled = false; m.renderOrder = 5; return m;
}


// ---------------------------------------------------------------------------------------------------------------
// THE SKY: a dome of hammered tin (the same gwSky every facet reflects), a mint line at the horizon.
export function skyMaterial(style) {
  return new THREE.ShaderMaterial({
    uniforms: style.uniforms, side: THREE.BackSide, depthWrite: false, depthTest: true,
    vertexShader: /* glsl */`varying vec3 vD;
      void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      varying vec3 vD;
      void main(){
        float l = max(length(vD), 1e-4); vec3 d = vD/l;
        vec3 du = vec3(d.x, max(d.y, 0.012), d.z); du /= max(length(du), 1e-4);
        vec3 col = gwSkyX(du, 1.);
        col = mix(col, mix(uPal[4], uPal[6], 0.35), smoothstep(0.05, 0.0, d.y)*0.9);
        float core = gwSlot(du).x;
        gl_FragColor = vec4(gwFinish(col, core*1.6), 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// story seconds for a path fraction u, by the brief's pace(u) (40 s journey)
const _PACE = (u) => lerp(lerp(lerp(lerp(1.25, 1.15, smoothstep(0.27, 0.31, u)), 1.05, smoothstep(0.40, 0.44, u)), 0.7, smoothstep(0.68, 0.73, u)), 0.95, smoothstep(0.90, 0.93, u));
const _STORY = (() => { const n = 256, t = new Float32Array(n + 1); for (let i = 0; i < n; i++) t[i + 1] = t[i] + 1 / _PACE((i + 0.5) / n); for (let i = 0; i <= n; i++) t[i] *= 40 / t[n]; return t; })();
/** story seconds (0..40) at path fraction u, following the brief's pace(u) */
export function storyTimeAt(u) { const x = clamp(u, 0, 1) * 256, i = Math.min(Math.floor(x), 255); return lerp(_STORY[i], _STORY[i + 1], x - i); }

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const ownStyle = !opts.style, style = opts.style || makeStyle({ palette: opts.palette });
  // stand-alone (the part viewer passes no shared style): add the viewer's sky, rain and paving
  const _STANDALONE = !opts.style;
  const withSky = opts.sky ?? _STANDALONE, withRain = opts.rain ?? _STANDALONE, withPaving = opts.paving ?? _STANDALONE;
  const object = new THREE.Group(); object.name = 'green-with-the-rain-hero';
  const metal = metalMaterial(style);
  const H = halves(rng);
  const rivets = [];

  const sb = new SheetBuilder(rng, 90000);
  const gap = opts.lastSheet ? { g: 0, j0: 25, j1: 35 } : null;
  await buildGores(sb, H, ctx, gap); await ctx.yield();
  await buildRibs(sb, H, ctx, rivets); await ctx.yield();
  const drum = await buildDrum(sb, H, ctx, rng); await ctx.yield();
  await buildLantern(sb, H, ctx); await ctx.yield();
  await buildArmillary(sb, ctx); await ctx.yield();
  const qAlign = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...ARM.a));
  const flipE = rng.chance(0.5), spin = rng.sign();
  const hoops = [[flipE ? 'moon' : 'sun', 3.6, 0.17, 0.42 * spin], [flipE ? 'sun' : 'moon', -3.6, -0.17, -0.3 * spin]].map(([em, off, tilt, w]) => {
    const m = new THREE.Mesh(buildTurningHoop(rng, off, tilt, em), metal);
    m.position.set(...ARM.c); m.quaternion.copy(qAlign); m.frustumCulled = false; m.userData = { w, ph: rng.range(0, TAU) }; object.add(m); return m;
  });
  // THE LAST SHEET (the world's rare event): one panel of gore 0 hangs on the hoist, is swung across the scaffold and
  // laid on the seam at 29..32.3 s; a row of rivets runs up its edge at 33 s. Moved by the story clock alone.
  let sheet = null;
  if (gap) {
    const pb = new SheetBuilder(rng, 2000), arc = D.Rc * D.phiMax, list = [];
    for (let j = gap.j0; j < gap.j1; j++) {
      const p0 = (j / 48) * D.phiMax, p1 = ((j + 1) / 48) * D.phiMax, width = (D.Rc * Math.cos((p0 + p1) / 2) - D.c) * GORE, nu = clamp(Math.round(width / 1.3), 2, 6);
      pb.seam = -2.0; pb.ageFn = (x, y, z, id) => [0.01 + id * 0.05, 1];
      pb.grid(nu, 1, (s, t) => { const p = domeAt(0, 0.03 + s * 0.94, t ? p1 + 0.002 : p0, t ? 0.02 : 0.07); p.push(s * 6.0, arc - (t ? p1 : p0) * D.Rc); return p; });
      for (const s of [0.035, 0.965]) for (let k = 0; k < 2; k++) { const ph = lerp(p0, p1, (k + 0.5) / 2), a = domeAt(0, s, ph, 0.08), b = domeAt(0, s, ph, 1.08); list.push(a[0], a[1], a[2], b[0] - a[0], b[1] - a[1], b[2] - a[2], 0, 0.058); }
    }
    pb.ageFn = null; pb.set(0.3, 0, 0, 0); pb.seam = -1;
    const pt = (gap.j1 / 48) * D.phiMax, top = domeAt(0, 0.5, pt, 0.1), tl = domeAt(0, 0.1, pt, 0.1), tr = domeAt(0, 0.9, pt, 0.1);
    // the sling and the hoist rope: their own mesh, let go (folded away) once the sheet is laid
    const rb = new SheetBuilder(rng, 200); rb.set(0.3, 0, 0, 0); rb.seam = -1;
    const rel = (q) => [q[0] - top[0], q[1] - top[1], q[2] - top[2]];
    rb.tube([rel(tl), [0, 3.2, 0], rel(tr)], 0.06, 4); rb.tube([[0, 3.2, 0], [0, 15, 0]], 0.13, 4);
    const mesh = new THREE.Mesh(pb.geometry(), metal); mesh.frustumCulled = false;
    // the panel turns on its rope about a vertical axis through its own middle while it hangs
    const cc = domeAt(0, 0.5, ((gap.j0 + gap.j1) / 96) * D.phiMax, 0), pivot = new THREE.Group(); pivot.position.set(cc[0], cc[1], cc[2]); mesh.position.set(-cc[0], -cc[1], -cc[2]); pivot.add(mesh);
    const rig = new THREE.Mesh(rb.geometry(), metal); rig.frustumCulled = false; rig.position.set(top[0] - cc[0], top[1] - cc[1], top[2] - cc[2]); pivot.add(rig);
    const grp = new THREE.Group(); grp.add(pivot); object.add(grp);
    const riv = rivetMesh(list, style, H, rng, 1); const rivN = riv.count; riv.count = 0; object.add(riv);
    sheet = { grp, riv, rivN, pivot, rig };
  }
  const scaf = await buildScaffold(sb, rng, detail, ctx); await ctx.yield();
  // threads of water from the scrolled spouts (tin rods that run only where it rains; loose = 2)
  for (const tp of drum.spoutTips) { const k = 1 + 0.02 * rng(); scaf.rods.push(tp[0], tp[1], tp[2], tp[0] * k, tp[1] - rng.range(7, 15), tp[2] * k, 0.035, 2); }
  // the armillary's hoops are sheet bands that would break into dots far off: a fine gilt rod runs hidden inside each
  // band and is widened to its pixel minimum with distance, so from the entry the finial is unbroken rings (loose = 3)
  const ringRods = (list, c, U, V, R, segs) => { for (let k = 0; k < segs; k++) { const a = (k / segs) * TAU, b = ((k + 1.04) / segs) * TAU;
    const A = _add(c, U, Math.cos(a) * R, V, Math.sin(a) * R), B = _add(c, U, Math.cos(b) * R, V, Math.sin(b) * R); list.push(A[0], A[1], A[2], B[0], B[1], B[2], 0.06, 3); } };
  // (their own little generator: the world's random sequence is left exactly as it was)
  const r2 = Object.assign(() => (r2.s = (r2.s * 16807) % 2147483647) / 2147483647, { s: 90217, range: (a, b) => a + (b - a) * r2() });
  const fixedRings = []; ringRods(fixedRings, ARM.c, ARM.e1, ARM.e2, 10.5, 40); ringRods(fixedRings, ARM.c, ARM.e1, ARM.e2, 7.55, 32);
  for (const s of [-1, 1]) ringRods(fixedRings, _add(ARM.c, ARM.a, s * 8.04), ARM.e1, ARM.e2, 6.75, 28);
  object.add(rodMesh(fixedRings, style, r2));
  for (const [i, off, tilt] of [[0, 3.6, 0.17], [1, -3.6, -0.17]]) {
    const list = []; ringRods(list, [0, off, 0], [1, 0, 0], [0, -Math.sin(tilt), -Math.cos(tilt)], 8.9, 36);
    hoops[i].add(rodMesh(list, style, r2));
  }
  const rodsM = rodMesh(scaf.rods, style, rng); object.add(rodsM); await ctx.yield();
  const rivM = rivetMesh(rivets, style, H, rng, detail); object.add(rivM); await ctx.yield();
  // jackdaws: perched on the crests of the old half's ribs, the lantern cornice and the scaffold's top rail
  const perches = [], lands = scaf.perches.slice();
  for (let g = D.N / 2; g <= D.N; g++) for (let k = 0; k < 40; k++) {
    const phi = 0.04 + rng() * 0.98, tp = 1 - 0.4 * (phi / D.phiMax), big = g % 8 === 0;
    perches.push(domeAt(g, 0, phi, 0.03 + (g % 16 === 0 ? 0.75 : big ? 0.6 : 0.42) * tp));
  }
  for (let k = 0; k < 60; k++) { const a = Math.PI + rng() * Math.PI; perches.push([7.7 * Math.sin(a), 99.25, 7.7 * Math.cos(a)]); }
  for (let k = 0; k < 90; k++) { const a = rng() * Math.PI; lands.push([36.4 * Math.sin(a), 39.1, 36.4 * Math.cos(a)]); }
  rng.shuffle(perches);
  for (const p of scaf.perches) if (rng.chance(0.5)) perches.splice(rng.int(0, perches.length - 1), 0, p);
  const birds = birdMesh(style, rng, Math.round(1000 * detail), perches, lands, opts.cast === 'pigeons'); object.add(birds);
  if (opts.cast === 'pigeons') style.uniforms.uBirdPale.value = 1; await ctx.yield();
  if (withRain) object.add(makeRain(style, rng, { count: Math.round(2400 * detail), box: [170, 130, 170] }));
  await ctx.yield();
  const shell = new THREE.Mesh(sb.geometry(), metal); shell.frustumCulled = false; object.add(shell);
  await ctx.yield();

  let sky = null;
  if (withSky) {
    sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 20), skyMaterial(style));
    sky.renderOrder = -1; sky.frustumCulled = false; object.add(sky);
  }
  if (withPaving) {
    const pb = new SheetBuilder(rng, 20000); pb.set(0.3, 0, 0, 0); pb.seam = 3.0;
    pb.ageFn = (x, y, z, id) => [0.22 + 0.12 * id + (x < 0 ? 0.0 : 0.0), 0];
    for (let k = 0; k < 4; k++) { pb.grid(44, 11, (s, t) => { const x = (s - 0.5) * 220, z = (0.5 - (k + t) / 4) * 220; return [x, 0, z, x, z]; }); await ctx.yield(); }
    const pave = new THREE.Mesh(pb.geometry(), metal); object.add(pave);
  }

  // ---- progress -------------------------------------------------------------------------------------------
  let driven = false;
  const _hp = new THREE.Vector3(), _cp = new THREE.Vector3();
  const hero = {
    object, radius: 46, height: 144, center: new THREE.Vector3(0, 66, 0), ground: false, groundY: 0, style,
    anchors: {
      // where the 14 m portal sits: the armillary's centre, in the collar of the equatorial hoop (inner radius 7.15),
      // facing back down the approach; portal: { shape: 'circle', radius: 7, tilt: true }
      portalSeat: { position: new THREE.Vector3(0, D.armY, 0), normal: new THREE.Vector3(0, -0.848, 0.53), radius: 7 },
      // the armillary's polar axis = the camera's last line (58 degrees up, toward local -Z)
      axis: new THREE.Vector3(...ARM.a),
      // a safe camera line, at least 6 m clear: square side of the climb, 9 m off the seam, then dead straight
      // through the near polar circle and the collar (ends at the portal seat)
      flyThrough: [[0, 10, 140], [0, 45, 70], [0, 64, 49], [0, 81, 32], [0, 106.4, 16], [0, 125.2, 4.25], [0, 132, 0]].map((p) => new THREE.Vector3(...p)),
      // the seam at mid height (the brief's poi), the lantern, and good places to look from
      seam: new THREE.Vector3(0, 70, 25), lantern: new THREE.Vector3(0, 98, 0),
      viewpoints: { square: new THREE.Vector3(0, 12, 135), shoulder: new THREE.Vector3(-14, 52, 62), climb: new THREE.Vector3(0, 78, 35) },
      // the hero in the world: object.position (0,0,590), rotation.y = PI; world rain normal and slot direction
      world: { position: new THREE.Vector3(0, 0, 590), rotationY: Math.PI, rainN: [-0.94, 0.34], slotDir: [0.928, 0.156, 0.338], keyDir: [-0.55, 0.62, 0.56] },
    },
    /** story clock in the brief's seconds; call every frame from the world (or use setProgress) */
    setStoryTime(t) { driven = true; style.setStoryTime(t); },
    /** path fraction 0..1 -> story clock by the brief's pace(u) */
    setProgress(u) { hero.setStoryTime(storyTimeAt(u)); },
    update(dt, time, camera) {
      if (ownStyle) style.tick(time, ctx.renderer);
      if (!driven) {
        // stand-alone demo: loop story seconds 24..38 with the rain line laid out in the hero's own frame
        const t = 23.2 + ((time * 0.5) % 14);
        style.setStoryTime(t);
        object.getWorldPosition(_hp);
        style.uniforms.uRainN.value.set(0.94, -0.34);
        style.uniforms.uFront.value = 6.5 * t - 11 - 200.65 + 0.94 * _hp.x - 0.34 * _hp.z;
        style.uniforms.uSlotDir.value.set(-0.928, 0.156, -0.338);
        style.uniforms.uKeyDir.value.set(0.55, 0.62, -0.56).normalize();
      }
      if (sky && camera) { _cp.setFromMatrixPosition(camera.matrixWorld); sky.position.copy(object.worldToLocal(_cp)); }
      if (sheet) {
        const t = style.storyTime ?? 0, k = smoothstep(29, 32.3, t), a = (1 - k) * 1.3 + (1 - k) * 0.03 * Math.sin(time * 0.9), out = Math.min(1, (1 - k) * 2.5) * (7.5 + 0.3 * Math.sin(time * 1.3));
        sheet.grp.rotation.y = a; sheet.grp.position.set(Math.sin(a + GORE * 0.5) * out, (1 - k) * (5 - 3 * smoothstep(29, 31, t)) + Math.sin(k * Math.PI) * 2.2, Math.cos(a + GORE * 0.5) * out);
        sheet.pivot.rotation.y = -(1 - k) * 1.35 + (1 - k) * 0.22 * Math.sin(time * 0.6);
        sheet.rig.scale.y = Math.max(1 - smoothstep(31.6, 32.6, t), 0.01);
        sheet.riv.count = Math.round(sheet.rivN * smoothstep(33, 35.6, t));
      }
      _hp.set(0, D.armY, 0); object.localToWorld(_hp); style.uniforms.uArm.value.set(_hp.x, _hp.y, _hp.z, 12.5);
      // far off the turning hoops are folded away (they would only fill the finial in): the fixed rings read alone
      if (camera) { _cp.setFromMatrixPosition(camera.matrixWorld); const hk = Math.max(smoothstep(360, 290, _cp.distanceTo(_hp)), 0.001); for (const h of hoops) h.scale.setScalar(hk); }
      const gust = style.uniforms.uGust.value;
      for (const h of hoops) { h.userData.ph += dt * h.userData.w * (0.5 + 1.6 * gust); h.quaternion.copy(qAlign).multiply(_q.setFromAxisAngle(_Y, h.userData.ph)); }
    },
    dispose() {},
  };
  return hero;
}
