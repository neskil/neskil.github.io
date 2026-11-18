// Still Waving: a world flown facing backwards. You kneel on the back seat and watch, through the back window,
// the house and the person at its gate get smaller; the whole outdoors is carried past a camera that never
// looks ahead until the brow of the hill has taken the house. Everything outdoors is one group W set from u.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import {
  makeFiction, makeShared, buildFigure, buildFarForms, buildGlass, buildCar, makeToonMaterial, makeAcc,
  LIGHT_GLSL, U_TURN, U_FREE, EYE,
} from '../parts/still-waving.js';

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const NOISE_GLSL = /* glsl */`
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
// THE CLIMB: as the car comes out of the cutting the land behind it (lane, banks, hedges, all of a piece) falls away
// below the window, more the further behind us it lies. Nothing moves against the ground it stands on.
// uSinkA = (sin, cos of the last line's heading, gate x, gate z); uSinkB = (the car's place along that line, where the cutting ends, metres of fall).
const SINK_GLSL = /* glsl */`
uniform vec4 uSinkA; uniform vec4 uSinkB;
float swSink(vec2 xz) {
  vec2 d = xz - uSinkA.zw; float a = d.x * uSinkA.x + d.y * uSinkA.y, b = d.x * uSinkA.y - d.y * uSinkA.x;
  return uSinkB.z * smoothstep(4., 60., uSinkB.x - a) * smoothstep(uSinkB.y - 95., uSinkB.y - 55., a) * (1. - smoothstep(60., 130., abs(b)));
}
`;
// every outdoor vertex shader: world position, world normal, distance to the lens
const VERT_HEAD = /* glsl */`
uniform vec3 uCamW; uniform float uTime; uniform float uWind;
${SINK_GLSL}
varying vec3 vWp; varying vec3 vLp; varying vec3 vN; varying vec3 vCol; varying float vDist;
`;
const VERT_TAIL = /* glsl */`
  vLp = p; p.y -= swSink(p.xz);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vWp = wp.xyz; vN = mat3(modelMatrix) * n; vDist = distance(wp.xyz, uCamW);
  gl_Position = projectionMatrix * viewMatrix * wp;
`;
const FRAG_HEAD = /* glsl */`
${LIGHT_GLSL}
${NOISE_GLSL}
uniform float uTime; uniform vec3 uCamW; uniform vec4 uRingL; uniform vec3 uRingC;
varying vec3 vWp; varying vec3 vLp; varying vec3 vN; varying vec3 vCol; varying float vDist;
// the exit ring's own cool light on whatever stands near it: leaves, copes, verge
vec3 swRing(vec3 alb, vec3 n, float wrap) {
  vec3 L = uRingL.xyz - vLp; float d2 = dot(L, L);
  float nl = max(dot(n, L) / sqrt(d2 + 1e-3) * (1. - wrap) + wrap, 0.);
  return alb * uRingC * (uRingL.w * nl * 34. / (34. + d2));
}
`;

// THE HEDGES' CAP (the lane hedges, s 118 to s 299: the two materials made with uRim 1). No leaf of them is paler than
// two thirds of the lane's gravel beside it, at any hour the world deals: from the hill the hedges are a low dark line
// and the lane the ONE pale thread. The gravel's tone is the lane shader's own (its mean albedo, 0.86 of the palette's
// gravel, less the 0.30 a wet lane loses: uLane.rgb, set at build from the palette) under swLight's own shares for a
// level face (1.9 of the key by the sine of the afterglow's height, uLane.w; 0.74 + 0.25 of the sky). The cap is on the
// leaf's own tone before the air (the haze lies on lane and hedge alike) and has no term from the eye, the ray or the
// place: one rule for every leaf these two materials draw. Up to half the cap a leaf keeps its tone exactly, so the
// dark of the hedge is as it was; above that the tone bends over and can only approach the cap, so lit clumps and
// sprays still differ from one another under it (an olive rim on dark leaf, never one flat band, never cream). The hue
// is the leaf's own: the whole colour is scaled, nothing is added.
const CAP_GLSL = /* glsl */`
uniform vec4 uLane;
vec3 swCap(vec3 c, float on) {
  const vec3 LW = vec3(.2126, .7152, .0722);
  float cap = (2. / 3.) * dot(uLane.rgb * (uKeyCol * (1.9 * uLane.w) + uSkyCol * (.74 + .25)), LW);
  float knee = .5 * cap, l = dot(c, LW);
  float l2 = min(l, knee) + (cap - knee) * (1. - exp(-max(l - knee, 0.) / max(cap - knee, 1e-4)));
  return c * mix(1., l2 / max(l, 1e-4), on);
}
`;

// lit colour from vertex colours, with a surface per kind (aSway carries it): 0 plain, 1 limewash, 2 slate,
// 3 field stone, 4 weathered wood. Each pattern fades to its mean before it reaches a pixel.
const litMaterial = (shared, extra = {}) => new THREE.ShaderMaterial({
  uniforms: { ...shared, uDim: { value: 1 }, uWarm: { value: 0 } }, ...extra,
  vertexShader: /* glsl */`${VERT_HEAD} attribute vec3 color; attribute float aSway; varying float vKind;
    void main() { vec3 p = position, n = normal; vCol = color; vKind = aSway; ${VERT_TAIL} }`,
  fragmentShader: /* glsl */`${FRAG_HEAD} uniform float uDim; uniform float uWarm; uniform vec4 uSinkA; varying float vKind;
    void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
      float fp = 560. / max(vDist, 1.);
      vec3 alb = vCol; vec3 nb = vec3(0.);
      float sheen = 0.;                                                           // only the farm's slates set it (flight round 2); 0 to 1
      vec2 w = vec2(vLp.x + vLp.z * .73, vLp.y);                                  // along the face, up
      if (vKind > 3.1 && vKind < 3.4) w.x = vLp.x * uSinkA.x + vLp.z * uSinkA.y;      // the lane walls of the road ahead: metres along the lane
      if (vKind < .5) {
        alb *= 1. - .10 * vn(vLp.xy * 3.1 + vLp.z * 1.7) * smoothstep(1., 5., fp * .3);
      } else if (vKind < 1.5) {                                                   // limewash: brush blotches, rain streaks under the eaves, damp at the foot
        float k = smoothstep(1., 4., fp * .25);
        float blot = vn(w * 1.3) * .6 + vn(w * 4.1 + 3.) * .4;
        float streak = vn(vec2(w.x * 5., w.y * .35 + 2.)) * smoothstep(1.5, 4.4, vLp.y);
        alb *= 1. - (.10 * (blot - .5) + .10 * streak) * k;
        alb = mix(alb, alb * vec3(.74, .80, .76), (1. - smoothstep(.05, .7, vLp.y + (blot - .5) * .5)) * .55);
        nb = vec3(blot - .5, 0., vn(w * 9.) - .5) * .12 * k;
      } else if (vKind < 2.5) {                                                   // slate: courses, staggered joints, the odd pale or mossy slate
        float k = smoothstep(1.5, 5., fp * .24);
        float row = floor(vLp.y / .24), fx = vLp.x / .30 + .5 * mod(row, 2.);
        float id = h21(vec2(floor(fx), row));
        float lip = smoothstep(.0, .18, fract(vLp.y / .24)), joint = smoothstep(.0, .08, abs(fract(fx) - .5) * 2. - .0) ;
        alb *= mix(1., (.80 + .36 * id) * (.72 + .28 * lip) * (.8 + .2 * smoothstep(.0, .12, 1. - abs(fract(fx) - .5) * 2.)), k);
        alb = mix(alb, alb * vec3(.80, 1.05, .78), step(.9, id) * .5 * k);
        alb *= 1. - .12 * vn(vLp.xy * vec2(.7, 2.)) ;
        // the farm's roofs (kind 2.3): each slate takes its own part of the roof's small sheen, .45 to 1 of it (riven
        // slates lie at slightly different tilts), less under the lip of the course above; and the slate's tail, the
        // 3 cm of its cut lower edge just above that lip's shadow, takes the whole of it: a thin lit line to each
        // course. Never above 1; where the courses are too far off to draw, the pattern's own mean (.72)
        if (vKind > 2.2) { float cy = fract(vLp.y / .24), tail = smoothstep(.16, .22, cy) * (1. - smoothstep(.28, .34, cy));
          sheen = mix(.72, max((.45 + .55 * id) * (.75 + .25 * lip), tail), k); }
      } else if (vKind < 3.5) {                                                   // field stone: courses of uneven stones, dark joints, lichen on the cope
        // dry field stone: the courses step up and down every stride of wall, tall courses and thin ones, long stones and
        // short, grey ones and warm buff ones, the joints dark and open
        float k = smoothstep(1.2, 4., fp * .2);
        float seg = floor(w.x / .85 + .3 * vn(vec2(w.y * 2.1, 5.))), sh = h21(vec2(seg, 17.));
        float yy = w.y / .135 + sh * 3.7; yy += .20 * sin(yy * 3.1 + sh * 40.) + .05 * sin(yy * 7.3 + sh * 11.);      // courses of unequal height (monotonic)
        float row = floor(yy);
        float len = mix(.16, .52, h21(vec2(row, seg + 9.)) * h21(vec2(row + 3., seg)));
        float fx = (w.x + h21(vec2(row, seg + 3.)) * 7.) / len + .12 * (vn(vec2(w.y * 9., row)) - .5);
        float id = h21(vec2(floor(fx), row + seg * 13.)), id2 = h21(vec2(floor(fx) + 31., row + seg * 7.));
        vec2 cf = vec2(fract(fx), fract(yy));
        float sx = fract(w.x / .85 + .3 * vn(vec2(w.y * 2.1, 5.)));
        float jx = min(min(cf.x, 1. - cf.x) * len / .135, min(sx, 1. - sx) * .85 / .135) * 2.0, jy = min(cf.y, 1. - cf.y) * 2.;
        float joint = jx * jy / (jx + jy + 1e-3) * 2.;                             // rounded corners
        float body = smoothstep(.05, .30, joint + (vn(w * 23.) - .5) * .10);
        vec3 tint = mix(mix(vec3(.80, .86, .92), vec3(1.0, 1.0, 1.0), id), vec3(1.22, 1.04, .76), step(.62, id2) * (.5 + .5 * id));   // grey, pale grey, buff
        alb *= mix(vec3(1.), tint * (.80 + .34 * id) * (.92 + .16 * vn(w * 31.)), k);
        alb *= mix(1., .40 + .60 * body, k) * 1.12;
        float lich = smoothstep(.55, .75, vn(w * 2.3 + 5.) * .6 + vn(w * 7.) * .4) * smoothstep(.2, 1.1, vLp.y);
        alb = mix(alb, vec3(.42, .46, .34) * (.7 + .5 * id), lich * .40 * smoothstep(.6, 3., fp * .2));
        alb = mix(alb, alb * vec3(.62, .74, .60), (1. - smoothstep(.0, .30, vLp.y + (vn(w * 3.) - .5) * .2)) * .6);   // green and damp at the foot
        nb = vec3(cf.x - .5, cf.y - .5, 0.) * (1. - body) * 1.1 * k + vec3(id - .5, id2 - .5, 0.) * .16 * k;
      } else {                                                                    // wood: grain along the height, silvered
        float k = smoothstep(1.5, 5., fp * .05);
        float gr = vn(vec2(vLp.x * 40. + vLp.z * 37., vLp.y * 2.3)) * .6 + vn(vec2(vLp.x * 90. + vLp.z * 83., vLp.y * 6.)) * .4;
        alb *= 1. + (gr - .5) * .6 * k;
      }
      vec3 c = swLight(alb * uDim, normalize(n + nb));
      // THE FARM'S SLATE IS DARK SLATE (run c). Its tone is its albedo, SLATE, the same constant as the roof of the house
      // at the gate (one valley, one quarry), under the light every other face has. Over that lies a small sheen of the
      // dusk sky, warmer where the mirrored ray goes toward the afterglow. THE RULE IS THE SLATE'S OWN: a dry slate
      // face mirrors about 5 percent of what is beyond it when met square on (refractive index near 1.57), and a riven
      // roofing slate is too rough to rise toward a mirror at a glancing angle as wet smooth stone would; so SLATE_SKY,
      // 0.05, is the LARGEST share of the sky any slate may hold, from any place and at any angle. A face met square on
      // holds 0.02 and the share rises with the angle between eye and slate, as light does, to that 0.05 and no
      // further (sheen is never above 1). The slate's albedo is about 0.09 and the sky it stands against is the sky
      // itself, so a roof is darker than the sky and the hazed hills behind it by the slate's own darkness, not by where
      // the eye is. (Run b gave 6 to 38 percent, and up to 1.45 times that on one slate: the roofs went as pale as the haze.)
      if (sheen > 0.) {
        const float SLATE_SKY = .05;
        vec3 vv = normalize(uCamW - vWp + vec3(0., 1e-4, 0.)), rr = reflect(-vv, n);
        float fr = 1. - max(dot(n, vv), 0.);
        c += mix(uSkyCol, uKeyCol, .40 * smoothstep(-.2, .8, dot(rr, uSunW))) * (sheen * (.02 + (SLATE_SKY - .02) * fr * fr));
      }
      // from the hilltop the lime wall is the palest peach thing in the valley: it keeps the afterglow through the haze
      float lime = step(.5, vKind) * step(vKind, 1.5) * uWarm;
      c = mix(c, c * vec3(1.20, 1.02, .82), lime);
      c += swRing(alb, n, .25);
      gl_FragColor = vec4(swFog(c, vDist * (1. - .45 * lime)), 1.); }`,
});

// leaves: hedge and ash crowns. Wind in the vertex shader; in the fragment shader leaf masses with dark gaps between
// them, single leaves catching the sky, and a silhouette eaten into by the same masses so no outline is a smooth blob.
const foliageMaterial = (shared, rim = 0) => new THREE.ShaderMaterial({
  uniforms: { ...shared, uRim: { value: rim } },      // uRim 1: the hedges of the cutting (boughs, and the dusk along their tops)
  vertexShader: /* glsl */`${VERT_HEAD} attribute vec3 color; attribute float aSway; varying float vKeep;
    void main() { vec3 p = position, n = normal; vCol = color; vKeep = aSway;
      float w = aSway * (.5 + .5 * sin(uTime * 1.3 + p.x * .21 + p.z * .17)) * uWind;
      p.x += w * .10 * sin(uTime * 2.7 + p.z * 1.9 + p.y * 2.3); p.z += w * .10 * sin(uTime * 3.1 + p.x * 2.1);
      p.y += w * .05 * sin(uTime * 4.3 + p.x * 3.3 + p.z * 2.9);
      ${VERT_TAIL} }`,
  fragmentShader: /* glsl */`${FRAG_HEAD} ${CAP_GLSL} varying float vKeep; uniform float uRim;
    float tri(vec3 q, vec3 w, float f, float o) { return vn(q.zy * f + o) * w.x + vn(q.xz * f + o) * w.y + vn(q.xy * f + o) * w.z; }
    void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
      float fp = 560. / max(vDist, 1.);
      float kM = smoothstep(1.2, 4., fp * .45), kL = smoothstep(1.5, 4.5, fp * .07);
      float fl = .35 * sin(uTime * 2. + vLp.x * 3. + vLp.y * 2.);
      vec3 q = vLp;
      float fq = max(fwidth(q.x), max(fwidth(q.y), fwidth(q.z)));                  // metres under one pixel, the long way: a face seen edge-on
      // leaf masses about 45 cm across, seen on three planes so no face smears
      float mass = vn(q.xz * 2.3 + q.y * 1.1) * .34 + vn(q.xy * 2.5 + q.z * 1.3 + 4.) * .33 + vn(q.zy * 2.4 + q.x * 1.2 + 8.) * .33;
      float fine = vn(q.xz * 9.1 + q.y * 5.3 + fl) * .34 + vn(q.xy * 9.7 + q.z * 4.3) * .33 + vn(q.zy * 8.9 + q.x * 5.1 + fl) * .33;
      float grit = vn(q.xz * 31. + q.y * 17.) * .5 + vn(q.zy * 29. + q.x * 19. + q.y * 7.) * .5;
      float leafId = h21(floor(q.xy * 13. + q.z * 7.3)) * .5 + h21(floor(q.zy * 12. + q.x * 6.1) + 5.) * .5;
      if (vKeep < .4) {                                                            // the grass bank under the hedge
        vec3 w3 = n * n; w3 *= w3; w3 /= (w3.x + w3.y + w3.z + 1e-4);        // the face it lies on, nearly unblended
        // clumps; each size fades to its mean before a slant can squeeze it into stripes
        float tus = mix(.5, tri(q, w3, 1.5, 2.), 1. - smoothstep(.10, .30, fq * 1.5)) * .6 + mix(.5, tri(q, w3, 3.4, 7.), 1. - smoothstep(.10, .30, fq * 3.4)) * .4;
        float bl = tri(q, w3, 18., 0.) * .55 + tri(q, w3, 41., 3.) * .45;          // blades
        float drift = smoothstep(.50, .70, tri(q, w3, .30, 20.) * .7 + tus * .3);  // where the seed heads stand
        float scrape = smoothstep(.63, .70, tri(q, w3, .8, 31.) * .65 + tri(q, w3, 2.9, 5.) * .35) * (1. - smoothstep(.12, .36, fq));   // bare earth where the bank has slipped
        vec3 ga = vCol * vec3(1.14, 1.0, .76) * 1.36 * (.60 + .74 * tus) * (1. + (bl - .5) * .7 * kL);
        ga = mix(ga, vec3(dot(ga, vec3(.30, .60, .10))), .34);                                      // the meadow's grey green, not emerald
        ga = mix(ga, ga * vec3(1.32, 1.18, .84), drift * .40);
        ga = mix(ga, ga * vec3(1.9, 1.7, 1.1), step(.86, h21(floor(q.xz * 21.) + floor(q.y * 21.))) * drift * kL * .7);   // single seed heads
        ga = mix(ga, ga * .46, (1. - smoothstep(.22, .52, tus)) * .6 * kM);                     // the dark between clumps
        ga = mix(ga, vec3(.150, .118, .092) * (.75 + .5 * bl), scrape * .85 * kM);
        vec3 nb2 = normalize(n + vec3(bl - .5, 0., tus - .5) * .6 * kM);
        // a gentler key than the open meadow gets: a bank facing the afterglow is warm, never a pale slab
        vec3 gc = ga * (uKeyCol * max(dot(nb2, uSunW), 0.) * .85 + mix(uGndCol, uSkyCol, nb2.y * .5 + .5) * .74 + uSkyCol * .62);
        gl_FragColor = vec4(swFog(gc, vDist), 1.); return;
      }
      float hed = step(vKeep, .9);                                                 // hawthorn (0.8) or an ash crown (1)
      // the outline: where the surface turns away from the eye the gaps between masses are open air
      vec3 v = normalize(uCamW - vWp + vec3(0., 1e-4, 0.));
      float rim = abs(dot(n, v));
      float open = mass * .7 + fine * .3;
      if (rim < (.56 - open) * .9 * kM * step(.5, vKeep)) discard;
      float m = mix(.5, mass, kM);
      vec3 alb = vCol * mix(.50 + 1.0 * m, (.56 + .34 * m), hed) * mix(vec3(1.), vec3(.94, .98, .80), hed);
      alb *= 1. + (fine - .5) * .7 * kL;
      alb *= mix(1., (.55 + .9 * leafId) * (.7 + .6 * grit), kL * .85);                                              // leaf by leaf
      alb = mix(alb, vCol * .55, smoothstep(.46, .30, mass) * kM * .5);                        // the dark inside the hedge
      alb = mix(alb, vCol * vec3(1.55, 1.6, 1.25), step(.80, leafId) * kL * smoothstep(.4, .7, mass) * .55);   // single leaves turned to the sky
      vec3 c = swLight(alb, normalize(n + (vec3(mass, fine, leafId) - .5) * kM * vec3(.7, .3, .7))) + alb * uSkyCol * vec3(.44, .52, .44) * (1. - .55 * hed);
      c += alb * uKeyCol * .30 * (1. - .5 * hed) * smoothstep(.5, .85, m) * kM * max(dot(n, uSunW) + .35, 0.);   // the afterglow through the outer leaves
      c *= .74 + .26 * smoothstep(-.2, .9, n.y + mass);                                         // undersides in shade
      c += uSkyCol * vec3(.012, .017, .020);                                                     // shade is blue air, never black
      // the cutting's hedges: bough by bough (masses about 1.8 m across, which hold to the far end of the lane), and along
      // the top, where the leaves see the whole sky, the last of the afterglow
      float bough = vn(q.xz * .55 + q.y * .4 + 3.) * .6 + vn(q.xy * .6 + q.z * .5) * .4;
      c *= mix(1., .62 + .76 * bough, uRim * hed);
      // and its face: clump by clump (the 45 cm masses), lit ones and the dark between them, and the upper half of the face,
      // which sees the sky over the far hedge, takes the sky's light and the afterglow; the foot, under its own top, does not.
      // vKeep runs from 0.8 at the foot of the hawthorn to 0.88 along its shoulders (set at build for these two hedges only).
      // That light is a fact of the hedge and of nothing else: how high the leaf stands on the hedge's own rings (vKeep) and,
      // in the line below, which way it faces the afterglow. Along each hedge's falling end (S_FLARE to S_STOP) the rings
      // themselves carry less of it (set at build, see hedgeRun and skyEnd): a hedge that has sunk to a ragged knee-high
      // line has no upper half standing in the sky. The body does NOT follow skyEnd's square law as the sprays do: its
      // baked share reaches this shader as vKeep = 0.8 + 0.08 x share and passes through the smoothstep below (0.81 to
      // 0.875), a second curve. So the body keeps all its light until the share has fallen to 0.94 (0.9 m into the
      // fall), has half of it at a share of 0.53 (7.6 m in, s 278.6) and none from a share of 0.125 down (18.1 m in,
      // s 289.1), ten metres before the hedge stops; the sprays above it go out by the square law over all 28 m.
      // It is the same from every eye.
      float clump = smoothstep(.34, .66, mass), topK = smoothstep(.81, .875, vKeep) * uRim * hed;
      c *= mix(1., .62 + .76 * clump, uRim * hed * kM);
      c += vCol * (uSkyCol * 1.1 + uKeyCol * (.5 + .9 * max(dot(n, uSunW), 0.))) * topK * (.30 + .70 * mix(.5, clump, kM));
      // the face turned from the afterglow is in shade, and the brief's shade is #34454F (0.034, 0.059, 0.078 linear), "never grey or black"
      c = max(c, vec3(.034, .059, .078) * (.25 + .30 * bough) * uRim * hed);      // its floor only: the deepest leaf shade is a third of that tone
      c += swRing(alb, n, .35) * .85;                                                           // the ring's light in the leaves that hang over it
      c = swCap(c, uRim * hed);                                                                 // the lane hedges' cap: see CAP_GLSL
      gl_FragColor = vec4(swFog(c, vDist), 1.); }`,
});

// leaf sprays: flat cards cut to ash leaves (a stem with paired leaflets) by the fragment shader. They give the crowns
// and the hedge tops an outline with sky in it. Shaded by the crown's own outward normal, so a tree is lit as one mass.
const sprayMaterial = (shared, rim = 0) => new THREE.ShaderMaterial({
  uniforms: { ...shared, uRim: { value: rim } }, side: THREE.DoubleSide,
  vertexShader: /* glsl */`${VERT_HEAD} attribute vec3 color; attribute vec4 aCard; attribute float aSky; varying vec2 vUv; varying float vPh; varying vec2 vSky;
    void main() { vec3 p = position, n = normal; vCol = color; vUv = uv; vPh = aCard.w;
      vSky = vec2(aSky, normal.y);                                                 // the card's share of the hedge's sky light, and how far it faces up in the place's own frame (one value to a card)
      float w = (.5 + .5 * sin(uTime * 1.3 + aCard.x * .21 + aCard.z * .17)) * uWind;
      vec3 d = p - aCard.xyz;                                                      // the card flutters about its own centre and rides the bough
      p += vec3(sin(uTime * 2.7 + aCard.w * 6.), .5 * sin(uTime * 4.3 + aCard.w * 9.), sin(uTime * 3.1 + aCard.w * 4.)) * .09 * w;
      p += cross(vec3(.3, 1., .2), d) * .16 * sin(uTime * 5.1 + aCard.w * 17.) * w;
      ${VERT_TAIL} }`,
  fragmentShader: /* glsl */`${FRAG_HEAD} ${CAP_GLSL} varying vec2 vUv; varying float vPh; varying vec2 vSky; uniform float uRim;
    void main() {
      float fp = 560. / max(vDist, 1.), kL = smoothstep(.8, 2.6, fp * .12);         // leaflets about 12 cm wide
      float sx = vUv.x * 3., id = floor(sx), lx = fract(sx) * 2. - 1., ax = abs(lx);
      float yy = vUv.y * 4.2 + id * .37 + vPh, fy = fract(yy) - .5;
      float env = sin(3.1416 * clamp(vUv.y, 0., 1.)) * (1. - .55 * abs(vUv.x * 2. - 1.));
      vec2 e = vec2((ax - .48) * 1.7, fy * 2.3 - (ax - .48) * 1.1);
      float leaf = 1. - smoothstep(.42, .56, dot(e, e) / max(env * env, .04));
      leaf = max(leaf, (1. - smoothstep(.04, .09, ax)) * step(.08, env));
      // far off a spray is only a soft-edged tuft
      vec2 c2 = vUv * 2. - 1.; float tuftA = 1. - smoothstep(.55, 1.0, dot(c2 * vec2(1., .8), c2 * vec2(1., .8)) + (h21(floor(vUv * 6.) + vPh) - .5) * .7);
      float a = mix(tuftA, leaf, kL);
      if (a < .5) discard;
      vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
      float tone = .78 + .5 * h21(vec2(id + floor(yy), vPh * 7.));
      vec3 alb = vCol * mix(1., tone, kL);
      vec3 c = swLight(alb, n);
      c += alb * uKeyCol * .42 * max(dot(n, uSunW) + .45, 0.);                    // thin leaves pass the afterglow
      c *= .70 + .30 * smoothstep(-.4, .7, n.y);
      // the shoots along the top of the cutting's hedges hold the afterglow. As on the hedge's face this is a fact of the
      // hedge: how far the spray faces up (in the place's own frame, not the tipped one) and the share its place on the
      // hedge has of the sky light (vSky.x: all of it, falling to none along the hedge's falling end). The same from every eye.
      c += (alb * (1.5 * uKeyCol + .8 * uSkyCol) + vec3(.030, .026, .012) * uKeyCol) * smoothstep(.25, .75, vSky.y) * uRim * vSky.x;
      c = max(c, vec3(.034, .059, .078) * (.20 + .25 * tone) * uRim);                             // leaves in shade: a floor in the brief's shade hue (#34454F), never black
      c += swRing(alb, n, .45) * 1.25;
      c = swCap(c, uRim);                                                                       // the lane hedges' cap: see CAP_GLSL
      gl_FragColor = vec4(swFog(c, vDist), 1.); }`,
});
// a bag of spray cards: add(centre, outward normal, size, colour, tone)
const makeSprays = () => {
  const P = [], Nn = [], C = [], UV = [], CD = [], SK = [], IX = [], col = new THREE.Color(), r = new THREE.Vector3(), u = new THREE.Vector3(), t = new THREE.Vector3();
  let h = 0.137;
  const rnd = () => { h = (h * 9301.17 + 0.2113) % 1; return h; };       // layout only; fixed sequence, the same on every visit
  // the leaders' own stream (flight round 1, the repair): a hedge's shoots are dealt from this and never from the sprays'
  // sequence, so standing leaders on a hedge does not re-deal the tilt of every spray laid after them. Start 0.5772, same generator.
  let hU = 0.5772;
  const rndUp = () => { hU = (hU * 9301.17 + 0.2113) % 1; return hU; };
  return {
    count: () => P.length / 12,
    add(c, n, size, hex, k = 1, upright = 0, sky = 1, own = null) {      // sky: the share of the hedge's sky light at this place on it (the cutting's hedges only)
      // the card lies across the outward normal, tilted at random, its stem pointing mostly outward and down like a hanging spray
      // (own: flight round 3: a caller's own generator for the card's tilt and phase, so a NEW tree reads nothing of the
      // bag's layout sequence; no live call passes it, and live's cards are laid exactly as they were)
      const rn = own || (upright ? rndUp : rnd);
      t.set(rn() - 0.5, rn() - 0.5, rn() - 0.5).normalize(); r.crossVectors(n, t).normalize();
      u.copy(n).multiplyScalar(0.55).addScaledVector(t, 0.5).add(r.clone().multiplyScalar(0.2)); u.y -= 0.35; u.normalize();
      // a leader: this year's shoot standing straight out of the top, a third as wide as it is tall, turned any way round
      if (upright) { u.set(t.x * 0.35, 1, t.z * 0.35).normalize(); n = t.set(t.z, 0.25, -t.x).normalize(); }
      r.crossVectors(u, n).normalize(); if (r.lengthSq() < 0.5) r.set(1, 0, 0);
      col.set(hex).multiplyScalar(k); const ph = rn(), base = P.length / 3, w = size * (upright ? 0.30 : 0.55), l = size;
      for (const [cx, cy] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) {
        P.push(c.x + r.x * cx * w + u.x * (cy - 0.35) * l, c.y + r.y * cx * w + u.y * (cy - 0.35) * l, c.z + r.z * cx * w + u.z * (cy - 0.35) * l);
        if (upright) Nn.push(n.x * 0.5, 0.86, n.z * 0.5); else Nn.push(n.x, n.y, n.z);      // a leader is lit as the top of the hedge it stands on
        C.push(col.r, col.g, col.b); UV.push(cx * 0.5 + 0.5, cy); CD.push(c.x, c.y, c.z, ph); SK.push(sky);
      }
      IX.push(base, base + 1, base + 2, base, base + 2, base + 3);
    },
    mesh(material) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setAttribute('aCard', new THREE.Float32BufferAttribute(CD, 4)); g.setAttribute('aSky', new THREE.Float32BufferAttribute(SK, 1)); g.setIndex(IX);
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
  };
};

// real grass at the lane's edge: instanced tussocks, eight blades each, bent by the same gusts that cross the meadow.
// aI = (x, y, z, yaw), aJ = (height, tone 0..1, phase, seed-head share).
const tuftMaterial = (shared, pal) => new THREE.ShaderMaterial({
  uniforms: { ...shared, uVerge: { value: new THREE.Color(pal.verge) }, uMeadow: { value: new THREE.Color(pal.meadow) }, uSeed: { value: new THREE.Color(pal.seedhead) } },
  side: THREE.DoubleSide,
  vertexShader: /* glsl */`${VERT_HEAD} ${NOISE_GLSL} attribute vec4 aI; attribute vec4 aJ; uniform vec3 uVerge; uniform vec3 uMeadow; uniform vec3 uSeed; varying float vT;
    void main() {
      float cy = cos(aI.w), sy = sin(aI.w), t = position.y;                        // t: 0 at the root, 1 at the tip
      vec3 base = aI.xyz;
      vec4 bw = modelMatrix * vec4(base, 1.);
      float dist = distance(bw.xyz, uCamW), keep = 1. - smoothstep(60., 95., dist);
      float gust = vn(base.xz * .06 + vec2(uTime * .55, uTime * .32)) * .65 + vn(base.xz * .21 + vec2(uTime * 1.2, -uTime * .6)) * .35;
      vec3 l = vec3(position.x * cy - position.z * sy, 0., position.x * sy + position.z * cy);
      float hgt = aJ.x * keep;
      vec3 p = base + l * (.6 + .4 * keep) + vec3(0., t * hgt, 0.);
      float bend = t * t * hgt * (.25 + (.50 * gust + .08 * sin(uTime * 3.1 + aJ.z * 40. + base.x)) * uWind);
      p.x += bend * .8 + l.x * t * hgt * 1.4; p.z += bend * .45 + l.z * t * hgt * 1.4; p.y -= bend * .35;
      vec3 n = normalize(vec3(l.x * 2. + .3, 1.2, l.z * 2. + .2));
      vec3 root = mix(uVerge * .45, uMeadow * .7, aJ.y);
      vec3 tip = mix(mix(uVerge, uMeadow, aJ.y) * 1.15, uSeed * 1.2, aJ.w * smoothstep(.55, 1., t));
      vCol = mix(root, tip, t); vT = t;
      ${VERT_TAIL} }`,
  fragmentShader: /* glsl */`${FRAG_HEAD} varying float vT;
    void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
      vec3 c = swLight(vCol, n) + vCol * uKeyCol * .35 * vT * max(dot(n, uSunW) + .5, 0.);
      c += swRing(vCol, n, .5);
      gl_FragColor = vec4(swFog(c, vDist), 1.); }`,
});

// meadow and far land. Late-summer grass: green underneath, drifts of tawny seed heads that the wind runs through,
// dark clover in the hollows, hedged fields on the far rim. Every pattern fades to its mean tone before its period
// reaches a pixel (fp = pixels per metre at this distance).
const groundMaterial = (shared, pal) => new THREE.ShaderMaterial({
  uniforms: { ...shared, uMeadow: { value: new THREE.Color(pal.meadow) }, uDark: { value: new THREE.Color(pal.dark) }, uSeed: { value: new THREE.Color(pal.seedhead) },
    uHouse: { value: new THREE.Vector2(0, -22) }, uWet: { value: pal.wet || 0 }, uMist: { value: 0 }, uHigh: { value: 0 } },
  vertexShader: /* glsl */`${VERT_HEAD}
    void main() { vec3 p = position, n = normal; vCol = vec3(0.); ${VERT_TAIL} }`,
  fragmentShader: /* glsl */`${FRAG_HEAD}
    uniform vec3 uMeadow; uniform vec3 uDark; uniform vec3 uSeed; uniform vec2 uHouse; uniform float uWet; uniform vec4 uSinkA; uniform float uMist; uniform float uHigh; uniform float uFwd; uniform vec4 uBeck;
    void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
      vec2 q = vLp.xz;
      float fp = 560. / max(vDist, 1.);                                          // pixels per metre here
      float big = vn(q * .011) * .6 + vn(q * .037 + 9.) * .4;                    // field to field
      float mid = vn(q * .19 + 4.) * .6 + vn(q * .53 + 11.) * .4;
      // the wind: two trains of gusts crossing the grass
      float gust = vn(q * .06 + vec2(uTime * .55, uTime * .32)) * .65 + vn(q * .21 + vec2(uTime * 1.2, -uTime * .6)) * .35;
      // tussocks (0.7 m), blades (6 cm, streaked along the wind) and specks, each faded out as it nears a pixel
      float kT = smoothstep(1.2, 4., fp * .7), kB = smoothstep(1.5, 5., fp * .08), kS = smoothstep(1.5, 4., fp * .04);
      float tus = vn(q * 1.45 + 2.) * .6 + vn(q * 3.1) * .4;
      vec2 qb = vec2(q.x * 15. + q.y * 6. + gust * 2.5, q.y * 5.5 - q.x * 2.);
      float bl = vn(qb) * .55 + vn(qb * 2.3 + 7.) * .45;
      float sp = h21(floor(q * 26.));
      // tawny seed heads lie in drifts; the gusts flatten and lift them
      float drift = smoothstep(.42, .7, vn(q * .045 + 20.) * .55 + mid * .25 + gust * .28);
      vec3 green = uMeadow * (.74 + .42 * big) * (.9 + .2 * mid);
      vec3 alb = mix(green, uSeed * (.8 + .3 * mid), drift * .55);
      alb *= 1. + (tus - .5) * .5 * kT;
      alb *= 1. + (bl - .5) * .75 * kB;
      alb = mix(alb, uSeed * 1.25, step(.93, sp) * kS * (.35 + .5 * drift));     // seed heads catching the afterglow
      alb = mix(alb, uDark * 1.1, smoothstep(.62, .2, tus) * .28 * kT * (1. - drift));   // the dark between tussocks
      alb *= .76 + .50 * gust * smoothstep(1400., 40., vDist);
      float r = distance(q, uHouse);
      float far = smoothstep(380., 760., r);                                     // the bowl's rim: hedged fields
      vec2 fq = q * .0085 + vec2(vn(q * .003) * 1.7, vn(q * .0031 + 5.) * 1.7);
      vec2 fc = floor(fq), ff = abs(fract(fq) - .5);
      float fields = h21(fc + 3.), hedgeLn = smoothstep(.455, .485, max(ff.x, ff.y));
      vec3 fcol = mix(uMeadow * .72, mix(uSeed * .62, uMeadow * 1.02, fields), step(.35, fields));
      alb = mix(alb, fcol, far * .85);
      alb = mix(alb, uDark * 1.25, hedgeLn * .8 * far * .85);
      // THE VALLEY FLOOR, seen from far or from above: fields, blue-green and tawny by turns, ruled by dark hedgerows.
      // fa runs from the gate toward the hill along the last line of the road, fb across it; the long hedges fan out
      // from behind the house, so from the hilltop they all lead the eye to it.
      vec2 dg = q - uSinkA.zw; float fa = dg.x * uSinkA.x + dg.y * uSinkA.y, fb = dg.x * uSinkA.y - dg.y * uSinkA.x;
      // the hillside beyond the hollow (more than 200 m to the car's right of the lane): it is farmed like the valley floor,
      // so it keeps the fields and their hedgerows where the bowl's rim would fade them to open hill. Its fields come in
      // between s 420 and s 470 (110 to 60 m short of uBeck.x), a ramp 5 m longer at each end than the hollow's own
      // opening (s 425 to 465): about the same place, not the same numbers.
      float hillK = smoothstep(200., 280., -fb) * smoothstep(uBeck.x - 110., uBeck.x - 60., fa);
      float vfar = smoothstep(mix(110., 70., uHigh), mix(240., 125., uHigh), vDist) * (1. - far * (1. - hillK)) * smoothstep(-70., -20., fa);
      float fA = fa / 37. + .22 * vn(vec2(fb * .006, 3.)) + .5, row = floor(fA);
      float fBc = fb / max(.30, (fa + 150.) / 400.) / mix(64., 96., h21(vec2(row, 7.)));
      float fB = fBc + h21(vec2(row, 2.)) * 5., col = floor(fB);
      float wA = max(fwidth(fA), 1e-5), wB = max(fwidth(fBc), 1e-5);
      float eA = .5 - abs(fract(fA) - .5), eB = .5 - abs(fract(fB) - .5);
      float lnA = 1. - smoothstep(.7, 1.6, min(eA / wA, eA * 37. / 1.6)), lnB = 1. - smoothstep(.6, 1.3, min(eB / wB, eB * 80. / 1.6));
      float lnK = 1. - smoothstep(.10, .30, max(wA, wB));
      float fid = h21(vec2(row, col) + 11.);
      vec3 fld = fid < .42 ? uMeadow * vec3(.66, .84, .90) * .80 : (fid < .80 ? mix(uSeed, uMeadow, .30) * .92 : uMeadow * vec3(.92, 1.04, .86));
      fld *= .90 + .20 * mid + .10 * (vn(vec2(fb * .5, fa * .03)) - .5);        // mown lines along the field
      alb = mix(alb, fld, vfar * .80);
      alb = mix(alb, uDark * .80, max(lnA, lnB) * lnK * vfar * .90);
      alb = mix(alb, alb * vec3(.60, .74, .98), far * .65);                      // the hills hold the blue of the hour
      alb = mix(alb, alb * .78, uWet * .6);
      vec3 c = swLight(alb, normalize(n + vec3(bl - .5, 0., tus - .5) * .5 * kT));
      c += alb * uKeyCol * .30 * drift * gust * smoothstep(700., 20., vDist);    // the sheen running with the gusts
      c *= mix(vec3(1.), mix(vec3(1.24, 1.03, .80), vec3(.86, .97, 1.12), smoothstep(-240., 200., fb)), vfar);
      float lastLight = drift * smoothstep(.45, .75, gust + mid * .4);
      c = mix(c, c * mix(vec3(.80, .90, .95), vec3(.56, .70, .94), far) + alb * uKeyCol * .95 * lastLight * (1. - far), uFwd);   // the afterglow side of the valley is warmer
      // ground mist pooled in the low ground before the house: the house and its trees stand on a pale band
      float wisp = vn(vec2(fb * .017 + uTime * .012, fa * .03)) * .6 + vn(vec2(fb * .045 - uTime * .017, fa * .08 + 4.)) * .4;
      float pool = smoothstep(-30., 30., fa) * (1. - smoothstep(40., 110., fa + 60. * (wisp - .5)));            // the long pool before the house
      float lie = smoothstep(.30, .95, fract(fA)) * (1. - smoothstep(150., 215., fa)) * .45;                    // thin veils lying against the far hedge of each field
      float mistK = max(pool * smoothstep(.22, .62, wisp), lie * smoothstep(.40, .75, wisp)) * uMist * smoothstep(80., 150., vDist);
      c = mix(c, (uFogCol * 1.10 + uKeyCol * .14) * mix(vec3(1.08, 1.0, .90), vec3(.96, 1.0, 1.04), smoothstep(-240., 200., fb)), mistK * .70);
      c += swRing(alb, n, .2);
      // THE BECK (the road ahead): it comes down past the knoll, runs under the lane at the bridge and winds away over the
      // low ground on the afterglow side, widening into a tarn. Water is the sky lying on the land; rushes darken its banks.
      float aF = fa - uBeck.x;
      float f1 = 58. + smoothstep(6., 40., fb) * (14. * sin(fb * .031) + 9. * sin(fb * .0113)) - .30 * max(fb, 0.);      // the reach that crosses under the lane
      float g2 = -11. - 3. * sin(aF * .13) - 45. * (1. - smoothstep(-50., 10., aF)) - 130. * (1. - smoothstep(-112., -50., aF));                                    // the reach that runs beside the lane, then away to the tarn
      float d1 = aF - f1, d2 = fb - g2;
      float w1 = max(fwidth(d1), 1e-4), w2 = max(fwidth(d2), 1e-4);
      float hw1 = 1.0 + .5 * vn(vec2(fb * .11, 2.)), hw2 = 1.7 + 1.1 * vn(vec2(aF * .09, 5.)) + 3.0 * smoothstep(14., 34., aF) * (1. - smoothstep(50., 58., aF));      // it widens into a pool above the bridge
      float m1 = step(-15., fb) * step(4.6, abs(fb)) * (1. - smoothstep(380., 480., fb)), m2 = step(aF, 59.5) * smoothstep(-118., -100., aF);
      float water = max((1. - smoothstep(0., 1., (abs(d1) - max(hw1, .9 * w1)) / max(w1, .25))) * m1,
                        (1. - smoothstep(0., 1., (abs(d2) - max(hw2, .9 * w2)) / max(w2, .25))) * m2);
      vec2 tp = vec2(aF - uBeck.y, fb - uBeck.z);
      float tr = length(tp * vec2(1. / 85., 1. / 44.)) + (vn(tp * .021 + 3.) - .5) * .38;      // the long tarn in the low ground on the afterglow side
      water = max(water, 1. - smoothstep(.90, 1.0, tr));
      float rush = max((1. - smoothstep(hw1 + .2, hw1 + 2.6, abs(d1) + (tus - .5) * 1.6)) * m1, (1. - smoothstep(hw2 + .2, hw2 + 2.6, abs(d2) + (tus - .5) * 1.6)) * m2);
      rush = max(rush, 1. - smoothstep(.95, 1.25, tr + (tus - .5) * .2)) * (1. - water);
      c = mix(c, c * vec3(.46, .58, .42), rush * .75);
      vec3 vw = normalize(uCamW - vWp + vec3(0., 1e-4, 0.));
      float gW = .5 + .5 * dot(normalize(-vw.xz + vec2(1e-5, 0.)), normalize(uSunW.xz + vec2(1e-5, 0.)));
      float frW = 1. - max(vw.y, 0.); frW = frW * frW * frW; frW = .34 + .66 * frW * frW;      // close to, we look down into dark water; further off it is all sky
      vec3 skyW = mix(uSkyCol * .66, uKeyCol * vec3(1.16, .95, .72), gW * gW) * (.74 + .40 * vn(vec2(aF * .45 + uTime * .8, fb * 5. - uTime * .2)));
      float eW = min(smoothstep(hw1 * .35, hw1, abs(d1)) * m1 + (1. - m1), smoothstep(hw2 * .35, hw2, abs(d2)) * m2 + (1. - m2)) * smoothstep(.55, .95, tr);
      skyW = mix(skyW, uDark * .55 + skyW * .18, eW * .7);                                        // the banks and their rushes stand in it upside down
      // so that it is water and not a pale plane: (1) the rushes of the bank stand in it as a ragged dark fringe, spike by
      // spike, up to 2 m in from the bank (rushes are about a metre tall and lean); (2) wind lanes: where a breath of air
      // ruffles it the water takes the blue overhead and loses the glow, in long patches that drift down the wind; (3) rings
      // where a fish has risen, at three places down the middle of the pool, each widening to 2.4 m in 4.5 s and dying as it goes
      float inB = max((hw1 - abs(d1)) * m1, (hw2 - abs(d2)) * m2);
      float spike = vn(vec2((aF + fb) * 2.9, 7.)) * .6 + vn(vec2((aF - fb) * 8.3, 3.)) * .4;
      float fringe = (1. - smoothstep(.15, .4 + 1.6 * spike, inB)) * step(.001, m1 + m2) * smoothstep(.55, .95, tr);
      skyW = mix(skyW, uDark * .50 + skyW * .15, fringe * .8);
      float wlane = smoothstep(.50, .66, vn(vec2(aF * .22 - uTime * .10, fb * .9 + uTime * .03)) * .65 + vn(vec2(aF * .7 - uTime * .25, fb * 2.6)) * .35);
      skyW = mix(skyW, uSkyCol * vec3(.46, .60, .80), wlane * .60 * (1. - fringe));
      // a ring is a pale line and a dark one, each 0.11 m wide: like every pattern here it fades to the water's own tone
      // (its mean: the two lines are added to and taken from it) before its width nears a pixel
      float kR = smoothstep(1.5, 5., fp * .11);
      for (int k = 0; k < 3; k++) {
        float fk = float(k), cA = 24. + 13. * fk, cB = -11. - 3. * sin(cA * .13) + (k == 1 ? 1.2 : -.8);
        float rr = length(vec2(aF - cA, fb - cB)), ph = fract(uTime / 4.5 + fk * .37), fall = (1. - ph) * (1. - ph);
        float e1 = (rr - 2.4 * ph) / .11, e2 = (rr - 2.4 * ph + .24) / .11;
        skyW += (uSkyCol * .55 * exp(-e1 * e1) - skyW * .35 * exp(-e2 * e2)) * fall * step(.001, m2) * kR;
      }
      float glint = smoothstep(.80, .92, vn(vec2(aF * 2.6 + uTime * 1.3, fb * 7. - uTime * .4))) * (1. - eW);
      skyW += uKeyCol * .30 * glint * gW;                                                         // the current, catching the last light
      c = mix(c, min(skyW * frW * 1.12, vec3(.92)) + uSkyCol * vec3(.36, .50, .66) * (1. - frW), water);      // the ember of the afterglow lies in it: no track is that colour
      gl_FragColor = vec4(swFog(c, vDist), 1.); }`,
});

// the lane: pale gravel with stones in it, two worn ruts, grass down the crown and ragged verges. uv.x = metres from
// the axis, uv.y = metres along. After rain the ruts hold water and the water holds the sky.
const laneMaterial = (shared, pal) => new THREE.ShaderMaterial({
  uniforms: { ...shared, uGravel: { value: new THREE.Color(pal.gravel) }, uVerge: { value: new THREE.Color(pal.verge) }, uSeed: { value: new THREE.Color(pal.seedhead) },
    uWet: { value: pal.wet || 0 }, uSkyTint: { value: new THREE.Color(pal.zenith) }, uBand: { value: new THREE.Color(pal.band) }, uOpp: { value: new THREE.Color(pal.opposite) },
    uRingS: { value: new THREE.Vector2(635, 0) }, uRingCol: { value: new THREE.Color('#CFE3F2') }, uFwd: shared.uFwd },
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  vertexShader: /* glsl */`${VERT_HEAD} varying vec2 vUv;
    void main() { vec3 p = position, n = normal; vCol = vec3(0.); vUv = uv; ${VERT_TAIL} }`,
  fragmentShader: /* glsl */`${FRAG_HEAD}
    uniform vec3 uGravel; uniform vec3 uVerge; uniform vec3 uSeed; uniform float uWet; uniform vec3 uSkyTint; uniform vec3 uBand; uniform vec3 uOpp; uniform vec2 uRingS; uniform vec3 uRingCol; uniform float uFwd; varying vec2 vUv;
    void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
      float x = abs(vUv.x), fp = 560. / max(vDist, 1.);
      float kG = smoothstep(1.5, 5., fp * .07), kP = smoothstep(1.2, 4., fp * .5), kS = smoothstep(1.5, 4., fp * .035);
      // gravel: fine grit, pebbles (cells of 3.5 cm, some pale, some dark), patches of bare earth
      float grit = vn(vUv * vec2(27., 23.)) * .5 + vn(vUv * vec2(61., 57.)) * .5;
      float peb = vn(vUv * vec2(47., 43.) + 7.) * .6 + vn(vUv * vec2(19., 17.)) * .4;
      float ptch = vn(vUv * vec2(1.3, .55) + 3.) * .6 + vn(vUv * vec2(3.7, 1.9)) * .4;
      float wob = (vn(vec2(vUv.y * .23, 1.5)) - .5) * .22;                         // the ruts wander a little
      float rutD = abs(x - .78 + wob * sign(vUv.x));
      float rut = 1. - smoothstep(.13, .40, rutD);
      vec3 alb = uGravel * (.86 + .22 * (ptch - .5) * kP);
      alb *= 1. + (grit - .5) * .5 * kG;
      alb = mix(alb, uGravel * vec3(1.14, 1.10, 1.04), smoothstep(.62, .72, peb) * kS * .55);
      alb = mix(alb, uGravel * vec3(.58, .55, .52), smoothstep(.38, .28, peb) * kS * .55);
      alb *= 1. - rut * (.20 + .12 * ptch);                                      // packed and damp where the wheels run
      // grass down the crown, in tufts, and coming in from the verges
      float tuft = vn(vUv * vec2(5., 1.7) + 9.) * .6 + vn(vUv * vec2(13., 4.)) * .4;
      float crown = (1. - smoothstep(.04, .30, x + (tuft - .5) * .3 * kP)) * smoothstep(.40, .70, ptch + (tuft - .5) * .6) * .8;
      float blade = vn(vUv * vec2(34., 9.) + uTime * vec2(.6, .2)) * .6 + vn(vUv * vec2(71., 15.)) * .4;
      vec3 grass = mix(uVerge, uSeed, .15 + .35 * tuft) * (.72 + .55 * mix(.5, blade, kG)) * (.85 + .3 * vn(vUv * vec2(1.7, .45) + uTime * vec2(.9, .6)));
      alb = mix(alb, grass, crown * .85);
      float edge = smoothstep(1.50, 1.92, x + (vn(vUv * vec2(2.3, .9)) - .5) * .55 + (tuft - .5) * .28 * kP);
      alb = mix(alb, grass, edge);
      vec3 c = swLight(alb, normalize(n + vec3(grit - .5, 0., peb - .5) * .35 * kG));
      // rain: puddles in the ruts and a wet sheen everywhere, both showing the sky the back window faces
      vec3 v = normalize(uCamW - vWp + vec3(0., 1e-4, 0.));
      float fres = 1. - max(v.y, 0.); fres = fres * fres; fres = .08 + .92 * fres * fres;
      vec3 skyR = mix(mix(uOpp, uBand, .30) * 1.12, uSkyTint * 1.05, smoothstep(.0, .5, v.y));
      float pm = vn(vUv * vec2(.83, .31) + 13.) * .6 + vn(vUv * vec2(2.9, 1.1) + 2.) * .4;
      float puddle = smoothstep(.535, .575, pm + rut * .10 - .06) * smoothstep(.45, .75, rut) * (1. - edge) * (1. - crown);
      float rip = 1. + .07 * (vn(vUv * vec2(9., 5.) + uTime * vec2(.9, 1.3)) - .5) * kP;
      c *= 1. - uWet * .30 * (1. - edge);                                           // wet gravel is darker
      c = mix(c, skyR * rip, min(1., uWet * 1.2) * (puddle * mix(.6, .95, fres) + (1. - edge) * (1. - crown) * .22 * fres));
      float ahead = uRingS.x - vUv.y;                                             // metres this side of the ring
      float streak = ahead > 0. ? exp(-ahead / 14.) * .8 + exp(-ahead / 80.) * .75 : exp(max(ahead, -60.) / 3.);
      float shim = .88 + .24 * vn(vec2(vUv.x * 3., vUv.y * .35 - uTime * 1.4));
      c *= mix(vec3(1.), mix(vec3(.72), vec3(.60, .76, .88), edge), uFwd);                                      // dusk on the gravel, so the light can lie on it
      c += alb * uRingCol * streak * shim * uRingS.y * ((.16 + .62 * rut) * (1. - edge) * (1. - crown) + .10);
      gl_FragColor = vec4(swFog(c, vDist), 1.); }`,
});

// the sky: a dome that follows the lens but turns and tips with the carried world (uWinv: world -> fiction)
const skyMaterial = (pal, shared) => new THREE.ShaderMaterial({
  uniforms: {
    uTime: shared.uTime, uWinv: { value: new THREE.Matrix3() }, uSunF: { value: new THREE.Vector3() },
    uGlow: { value: new THREE.Color(pal.glow) }, uOpp: { value: new THREE.Color(pal.opposite) }, uZen: { value: new THREE.Color(pal.zenith) },
    uBand: { value: new THREE.Color(pal.band) }, uFogCol: shared.uFogCol, uLow: { value: pal.low || 0 }, uFwd: shared.uFwd,
  },
  depthWrite: false, depthTest: false, side: THREE.BackSide,
  vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
  fragmentShader: /* glsl */`${NOISE_GLSL}
    uniform float uTime; uniform mat3 uWinv; uniform vec3 uSunF; uniform vec3 uGlow; uniform vec3 uOpp; uniform vec3 uZen; uniform vec3 uBand; uniform vec3 uFogCol; uniform float uLow; uniform float uFwd;
    varying vec3 vDir;
    void main() {
      vec3 d = normalize(uWinv * vDir + vec3(0., 1e-6, 0.));
      float e = d.y, g = .5 + .5 * dot(normalize(d.xz + vec2(1e-5, 0.)), normalize(uSunF.xz));
      float g2 = g * g;
      float gf = g2 * g2 * g2 * g;                                              // the forward leg: dusk has come on, the glow keeps to its own side
      vec3 hor = mix(uOpp * mix(1., .80, uFwd), uGlow, mix(g2 * (3. - 2. * g), gf, uFwd));
      float up = smoothstep(0., mix(.62, .30, uFwd), max(e, 0.));
      vec3 c = mix(hor, uZen * mix(1., .70, uFwd), sqrt(up) * mix(1., mix(.78, 1. - .5 * gf, uFwd), g2));
      c += uBand * exp(-max(e, 0.) * 11.) * g2 * g * .32;
      float be = (e - .115) / .085; c = mix(c, uBand * .86, exp(-be * be) * (1. - .75 * g2) * .62);       // the arch of rose over the earth's shadow
      // a few high streaks still catching the light, drifting
      float de = max(e, 0.) + .12;
      vec2 q = vec2(d.x / de * 1.1 + uTime * .006, d.z / de * 3.4);
      float st = smoothstep(.56, .86, vn(q) * .65 + vn(q * 2.3 + 5.) * .35) * smoothstep(.03, .16, e) * (1. - smoothstep(.4, .7, e));
      c = mix(c, mix(uBand * .95, uGlow * 1.05, g2), st * .55 * mix(1., .25 + .75 * gf, uFwd));
      c = mix(c, uBand * .94, exp(-max(e, 0.) * 6.5) * uLow * .9);
      // THE ROAD AHEAD: long bars of cloud low over the land, slate above, their undersides still alight on the afterglow side
      float de2 = max(e, 0.) + .20;
      vec2 cq = vec2(d.x / de2 * .55 + uTime * .004, d.z / de2 * 2.9 + d.x * .35);
      float c0 = vn(cq) * .62 + vn(cq * 2.3 + 3.) * .38, c1 = vn(cq + vec2(.05, .30)) * .62 + vn((cq + vec2(.05, .30)) * 2.3 + 3.) * .38;
      float bar = smoothstep(.50, .68, c0) * smoothstep(.035, .085, e) * (1. - smoothstep(.20, .40, e)) * uFwd;
      float under = smoothstep(.02, .22, c0 - c1);
      vec3 body = mix(uZen * .52 + uOpp * .10, uBand * .70, g2 * .8), lit = mix(uBand * .86, uGlow * 1.18, g);
      c = mix(c, mix(body, lit, under * (.35 + .65 * g)), bar * .82);
      c += uGlow * .16 * exp(-max(e, 0.) * 9.) * g2 * uFwd;                      // and a last warm band along the land on that side
      // the afterglow's own quarter (never in the back window; the head turns through it): a deeper ember along the hills
      c = mix(c, uGlow * vec3(1.06, .86, .62), exp(-max(e, 0.) * 13.) * gf * .75);
      c = mix(uFogCol, c, smoothstep(-.03, .035, e));
      gl_FragColor = vec4(min(c, vec3(.85)), 1.);
    }`,
});

const PALETTES = {
  // A: ten minutes after sunset, late August
  A: { glow: '#F0B59B', opposite: '#7F96A6', zenith: '#56708C', band: '#F7C7A6', key: '#F0B59B', fillSky: '#8FA6B8', fillGround: '#3C4A44', fog: '#7F96A6',
    meadow: '#5F7355', dark: '#26332E', gravel: '#CFC6B4', verge: '#586B4C', wall: '#F4EFE2', wet: 0, seedhead: '#9C9468' },
  // B: first light, lemon low down, dew-dark lane
  B: { glow: '#EFE4A4', opposite: '#B9C8D2', zenith: '#7F9CB8', band: '#F8E27C', key: '#F8E69A', keyGain: 1.22, fillSky: '#9DB2C4', fillGround: '#404E48', fog: '#A9BAC5',
    meadow: '#657A5C', dark: '#2B3A34', gravel: '#9A978C', verge: '#52674A', wall: '#F4EFE2', wet: 0.15, seedhead: '#A3A27A', low: 1.0 },
  // C: dusk after rain, the wet lane a strip of sky
  C: { glow: '#EDA98F', opposite: '#6E8798', zenith: '#48607C', band: '#F6BE9C', key: '#EDAE96', fillSky: '#8098AC', fillGround: '#34423E', fog: '#72899A',
    meadow: '#506650', dark: '#222E2A', gravel: '#A9A69A', verge: '#4A5E46', wall: '#F4EFE2', wet: 0.8, seedhead: '#8A8A62' },
};

export default {
  id: 'still-waving',
  name: 'Still Waving',
  category: 'wilderness',
  weirdness: 0.2,
  media: ['open', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    // three looks by seed (the hour hint can ask for first light), and one rare event
    const pick = rng();
    const variant = vary.hour === 'dawn' ? 'B' : pick < 0.42 ? 'A' : pick < 0.70 ? 'B' : 'C';
    const rare = !!vary.rare;
    const pal = PALETTES[variant];
    const fic = makeFiction({ mirror: variant === 'B' });
    await ctx.yield();
    const shared = makeShared(pal);
    if (pal.keyGain) shared.uKeyCol.value.multiplyScalar(pal.keyGain);
    shared.uSinkA = { value: new THREE.Vector4(Math.sin(fic.hf), Math.cos(fic.hf), fic.gate.x, fic.gate.z) };
    shared.uSinkB = { value: new THREE.Vector4(0, fic.a300, 0, 0) };      // the car's place along the last line, where the cutting ends, metres of fall
    shared.uFwd = { value: 0 };       // 0 looking back, 1 once we face the road ahead
    shared.uRingL = { value: new THREE.Vector4(0, 0, 0, 0) };      // the exit ring's light: where it stands (the fiction's frame) and how strong
    shared.uRingC = { value: new THREE.Color('#CFE3F2') };
    shared.uBeck = { value: new THREE.Vector4(fic.a300 + 230, 0, 0, 0) };      // the beck is drawn from aF = a - this
    shared.uWind = { value: 1 };      // the wind drops as the valley comes into view: the white point is then the one thing moving
    await ctx.yield();
    const sunF = new THREE.Vector3(-Math.sin(55 * Math.PI / 180) * Math.cos(12 * Math.PI / 180), Math.sin(12 * Math.PI / 180), Math.cos(55 * Math.PI / 180) * Math.cos(12 * Math.PI / 180));
    // the lane gravel's tone, for the hedges' cap (CAP_GLSL): the lane shader's mean gravel (0.86 of the palette's) less what a
    // wet lane loses (0.30 of uWet, the lane shader's own line), and the sine of the afterglow's height for a level face
    { const g = new THREE.Color(pal.gravel).multiplyScalar(0.86 * (1 - 0.30 * (pal.wet || 0))); shared.uLane = { value: new THREE.Vector4(g.r, g.g, g.b, sunF.y) }; }
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(new THREE.Color(pal.fog), 0.0012);
    const path = makePath(fic.railPoints);

    // W: everything outdoors, set every frame from u alone
    const W = new THREE.Group(); W.matrixAutoUpdate = false; scene.add(W);
    const key = new THREE.DirectionalLight(new THREE.Color(pal.key), 1.1);
    key.position.copy(sunF).multiplyScalar(200); key.target.position.set(0, 0, 0);
    const fill = new THREE.HemisphereLight(new THREE.Color(pal.fillSky), new THREE.Color(pal.fillGround), 0.75);
    W.add(key, key.target, fill);

    await ctx.yield();
    const skyMat = skyMaterial(pal, shared);
    skyMat.uniforms.uSunF.value.copy(sunF);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 20), skyMat);
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // the land: a valley floor, the hill we climb (a ridge square across the last line of the road), a far rim
    const hx = 0, hz = -22, sf = Math.sin(fic.hf), cf = Math.cos(fic.hf), n2 = ctx.noise.n2;
    const RIDGE_C = [470, 840, 1290], RIDGE_H = [30, 72, 128], RIDGE_W = [190, 250, 330];
    // the hollow beside the lane past the crest: its floor lies 9 m below the lane, reached with a fall-off length of 24 m
    // (so from the lane the floor is in sight from about 55 m out, where the beck runs), and the hillside beyond it rises
    // 26 m, about the height of the hill we have just climbed (22 m), so it stands above the horizon and shows its fields
    const HOLLOW_D = 9, HOLLOW_E = 24, HOLLOW_RISE = 26;
    // the prevailing wind of the hilltop: up the lane and a little toward the afterglow side (0.8 along the last line of the
    // road, 0.6 to the car's right). It leans the thorn on the brow.
    const WIND = new THREE.Vector3(0.8 * Math.sin(fic.hf) - 0.6 * Math.cos(fic.hf), 0, 0.8 * Math.cos(fic.hf) + 0.6 * Math.sin(fic.hf));
    // THE BECK'S OWN LINE: the ground shader's g2 (the live version's, term for term): metres to the car's left of the
    // lane's axis, at aF metres beyond s 530. The water is drawn from aF 59.5 back to aF -118 (s 412), where its mask ends.
    const beckB = (aF) => -11 - 3 * Math.sin(aF * 0.13) - 45 * (1 - ss(-50, 10, aF)) - 130 * (1 - ss(-112, -50, aF));
    // THE BECK'S COMBE (second repair): water lies on the lowest line of its land. The floor under the beck is taken from
    // the beck's own line: beckZ is the land's height along it (as the land lies without the combe), less the 0.38 m of
    // the live beck's cleft, and never rising as the water runs on (aF falling, the way its ripples travel): it falls at
    // least 1 in 100 of its course. Either side of the line the floor is level for COMBE_HALF (8 m: the water is up to
    // 2.8 m from its middle to its edge and its rushes stand 2.6 m beyond that, 5.4 m, and half as much again), then the
    // sides rise at the slope the hollow's own bank begins with (HOLLOW_D / HOLLOW_E), eased over a 6 m toe; where the
    // side meets the land as it was the brink is rounded over 2 m of height. Filled once, below, before the ground is meshed.
    // Third repair: the floor is the lowest ground of its land. The table takes, at each station, the lowest of the land as
    // it lay across the beck's line, COMBE_LOW (40 m) to either side of it on the combe's own side of the fence (b under -7,
    // where the combe begins), less the cleft's 0.38 m; and the rounding of the brink never dips under the beck's own floor.
    const BECK_BED = 0.38, BECK_FALL = 0.01, COMBE_HALF = 8, COMBE_TOE = 6, COMBE_ROUND = 2, BECK_A0 = 10, BECK_A1 = -118, BECK_DA = 2, COMBE_LOW = 40;
    let beckZ = null;      // [aF, b, floor height] every BECK_DA of aF along the beck's line, from BECK_A0 to 32 m beyond the end of the water
    const combe = (nat0, aF, b) => {
      if (!beckZ || b > -7 || aF > BECK_A0 || aF < BECK_A1 - 32) return nat0;
      let d2 = Infinity, zb = 0;                                         // metres from the beck's line (the nearest point of it), and the floor there
      for (let i = 0; i + 5 < beckZ.length; i += 3) {
        const ex = beckZ[i + 3] - beckZ[i], ey = beckZ[i + 4] - beckZ[i + 1], px = aF - beckZ[i], py = b - beckZ[i + 1];
        const t = Math.min(Math.max((px * ex + py * ey) / (ex * ex + ey * ey), 0), 1), qx = px - ex * t, qy = py - ey * t, q = qx * qx + qy * qy;
        if (q < d2) { d2 = q; zb = beckZ[i + 2] + (beckZ[i + 5] - beckZ[i + 2]) * t; }
      }
      const e = Math.max(Math.sqrt(d2) - COMBE_HALF, 0), V = zb + (HOLLOW_D / HOLLOW_E) * e * e / (e + COMBE_TOE);
      const h = Math.min(Math.max(0.5 + 0.5 * (nat0 - V) / COMBE_ROUND, 0), 1), low = Math.max(nat0 + (V - nat0) * h - COMBE_ROUND * h * (1 - h), Math.min(zb, nat0));      // the lower of the two, the brink rounded, and the rounding never under the beck's own floor
      // it begins at the foot of the fence as the hollow does (7 m out, full by 13 m), dies into the live beck's own cleft
      // where the beck comes alongside the lane (aF -10 to 10), and its head closes over 32 m beyond the end of the water
      // (s 380 to 412, 130 m and more to the side: abreast of the car as the head starts to turn, never in the back window)
      return nat0 + (low - nat0) * ss(7, 13, -b) * (1 - ss(-10, BECK_A0, aF)) * ss(BECK_A1 - 32, BECK_A1, aF);
    };
    // where the valley floor stops being level (flight round 2 repair: these two stood typed in the roll's line below; the
    // same numbers, named, because the field hedges read them too): the ground is dead level to ROLL_B0 metres either
    // side of the lane's last line and rolls at its full 1.6 m from ROLL_B1 on
    const ROLL_B0 = 60, ROLL_B1 = 180;
    const heightAt = (x, z) => {
      const a = fic.aOf(x, z), b = fic.bOf(x, z), ab = Math.abs(b);
      const hill = fic.hillAt(a + 34 * Math.sin(b / 170 + 1.3) * ss(34, 170, ab)) * (1 - 0.25 * ss(120, 500, ab) * (0.5 + 0.5 * Math.sin(b / 260)));
      const dx = x - hx, dz = z - hz, r = Math.hypot(dx, dz) + 1e-6;
      const toward = (-dx * sf - dz * cf) / r;                       // +1 straight behind the house as seen from the crest
      const rimH = (60 - 26 * ss(0.3, 0.92, toward)) * (0.85 + 0.3 * n2(x * 0.0017, z * 0.0017));
      const rk = ss(400, 1180, r), rim = rimH * rk * rk;
      const roll = 1.6 * n2(x * 0.006, z * 0.006) * ss(ROLL_B0, ROLL_B1, ab) * ss(40, 140, Math.abs(a - 60) + ab);
      // three ridges behind the house, each higher and further: from the hilltop they are the receding bands of the valley
      let ridge = 0;
      if (a < -150) {
        for (let i = 0; i < 3; i++) {
          const c = RIDGE_C[i] + 90 * n2(b * 0.0011 + i * 7.3, i * 3.1) + 0.10 * ab * (i - 1), w = RIDGE_W[i], d = -a - c;      // d > 0: beyond the crest line
          const H = RIDGE_H[i] * (0.80 + 0.32 * n2(b * 0.0019 + i * 11.7, 5.5 + i)) * (1 - 0.35 * ss(500, 1500, ab));
          const prof = d < 0 ? ss(-w, 0, d) : 1 - 0.55 * ss(0, w * 1.6, d);
          ridge = Math.max(ridge, H * prof);
        }
      }
      // THE ROAD AHEAD (past the turn, aF metres beyond s 530): no flat moor. A knoll on the car's left, the land falling
      // away on the afterglow side so the far fields show in haze, and two folded ridges beyond the ring. Nothing within
      // 14 m of the lane's line, which stays level.
      const aF = a - (fic.a300 + 230);
      let ahead = 0, fold = 0;
      if (aF > -40) {
        const kA = ss(-40, 50, aF), off = ss(14, 60, ab);
        const kn = (ca, cb, r, hgt) => { const da = (aF - ca) / r, db = (b - cb) / r; return hgt * Math.exp(-(da * da + db * db)); };
        ahead = kA * off * (kn(105, 88, 62, 11.5) + kn(330, 120, 110, 15) - 7.5 * ss(22, 130, -b) * (1 - 0.6 * ss(190, 420, -b)) * (1 - 0.7 * ss(160, 420, aF)));
        ahead += kA * off * 1.1 * n2(x * 0.021 + 7, z * 0.021);
        if (ab > 3.6 && ab < 36 && aF < 150) {                         // the beck's cleft: under the bridge, and beside the lane before it (the lane itself stays level)
          const d1 = aF - (58 + ss(6, 40, b) * (14 * Math.sin(b * 0.031) + 9 * Math.sin(b * 0.0113)) - 0.30 * Math.max(b, 0));
          let cv = b > -15 ? Math.exp(-d1 * d1 / 16) : 0;
          if (aF < 59.5 && aF > -30 && b < 0) { const d2 = b - (-11 - 3 * Math.sin(aF * 0.13) - 45 * (1 - ss(-50, 10, aF))); cv = Math.max(cv, Math.exp(-d2 * d2 / 9)); }
          ahead -= 0.38 * cv * ss(3.6, 7, ab) * (1 - ss(24, 36, ab));
        }
        for (let i = 0; i < 2; i++) {
          const c = [470, 1020][i] + 110 * n2(b * 0.0013 + i * 5.1, 9.7 + i), w = [210, 300][i], d = aF - c;
          const H = [44, 132][i] * (0.62 + 0.55 * n2(b * 0.0021 + i * 3.3, 2.5 + i * 7)) * (1 - 0.30 * Math.exp(-b * b / (180 * 180)));   // a saddle where the lane is heading
          fold = Math.max(fold, H * (d < 0 ? ss(-w, 0, d) : 1 - 0.6 * ss(0, w * 1.5, d)));
        }
      }
      // THE HOLLOW on the afterglow side (the car's right), beside the lane from past the crest to the walls of the road
      // ahead: the lane runs along the lip of a bank, the land drops away from the foot of the fence into a shallow valley
      // and rises again beyond it as a hillside of hedged fields that faces the side windows. It begins at s 425, which is
      // 12 m (three car's lengths) past where the head starts to turn (s 413), so its bank lies ahead of the car for as
      // long as we look back. The drop starts 7 m out (the fence stands at 6.2 m, on the lip) and is steep first and then
      // flattens, because a child's eye 1.25 m up sees over a lip only into ground that falls away sharply below it.
      // Only its FLOOR closes again, between s 498 and s 540, before the pool and the walls of the road ahead (s 519 on),
      // which stand on the land as it was. The far hillside (the rise beyond 210 m) has no closing factor and is meant to
      // have none: once risen it stands along the whole of the road ahead, the afterglow side's skyline as far as the ring.
      // The beck's own combe is cut into this by combe() above: the hollow's floor runs under the beck's line.
      let hollow = 0;
      if (b < -7) {
        const kIn = ss(fic.a300 + 125, fic.a300 + 165, a);               // opens over 40 m of lane: two seconds of driving
        // the floor's closing ramp (flight round 2: its reasons, at the line). It BEGINS at s 498 (a300 + 198), where the
        // post-and-wire fence of the lip ends (that fence's loop below runs from s 396 in steps of 3.2 m to under 501, so
        // its last post stands at s 498.4; the fence has no constant of its own, so 198 stays a typed number). It is
        // CLOSED at s 540, where the beck comes alongside the lane: the beck's own constant, BECK_A0 metres past its
        // origin a300 + 230 (the same place the ground shader's g2 and the combe read), so the floor is whole land again
        // under the reach that runs beside the lane.
        hollow = -HOLLOW_D * (1 - Math.exp((b + 7) / HOLLOW_E)) * kIn * (1 - ss(fic.a300 + 198, fic.a300 + 230 + BECK_A0, a)) + HOLLOW_RISE * ss(210, 640, -b) * kIn;
      }
      const nat = combe(Math.max(hill, rim, ridge, fold) + roll + ahead + hollow, aF, b);
      if (noLake || aF < 150) return nat;
      const tl = Math.hypot((aF - 285) / 85, (b + 150) / 44), lakeK = 1 - ss(0.80, 1.25, tl);      // the tarn's bed lies level
      return nat + (lakeY - nat) * lakeK;
    };
    let lakeY = 0, noLake = true;
    { const lx = fic.gate.x + (fic.a300 + 230 + 285) * sf - 150 * cf, lz = fic.gate.z + (fic.a300 + 230 + 285) * cf + 150 * sf; lakeY = heightAt(lx, lz) - 0.4; noLake = false; }
    {     // the floor under the beck, from the land along the beck's own line (see combe above)
      const zt = []; let z0 = Infinity;
      for (let aF = BECK_A0; aF >= BECK_A1 - 32 - 1e-6; aF -= BECK_DA) {
        const a = fic.a300 + 230 + aF, b = beckB(aF), gp = beckB(aF + 0.5) - beckB(aF - 0.5);
        const nrm = Math.sqrt(1 + gp * gp); let lowN = heightAt(fic.gate.x + a * sf + b * cf, fic.gate.z + a * cf - b * sf);
        for (let d = -COMBE_LOW; d <= COMBE_LOW + 1e-6; d += 2) {            // across the line, every 2 m (the land as it lay: beckZ is not yet set)
          const a2 = a - gp / nrm * d, b2 = b + d / nrm; if (b2 > -7) continue;
          lowN = Math.min(lowN, heightAt(fic.gate.x + a2 * sf + b2 * cf, fic.gate.z + a2 * cf - b2 * sf));
        }
        z0 = Math.min(lowN - BECK_BED, z0 - BECK_FALL * BECK_DA * nrm);
        zt.push(aF, b, z0);
      }
      beckZ = zt;
    }
    const aList = [], bList = [];
    for (let a = -2060; a < -100; a += 35) aList.push(a);
    for (let a = -100; a < 196; a += 8) aList.push(a);
    for (let a = 196; a < 424; a += 1.5) aList.push(a);
    for (let a = 424; a < 680; a += 4) aList.push(a);
    for (let a = 680; a <= 2100; a += 70) aList.push(a);
    const half = [0, 2, 4, 7, 11, 16, 24, 36, 52, 75, 105, 150, 180, 210, 250, 290, 340, 400, 470, 550, 650, 750, 870, 1000, 1150, 1300, 1500, 1700];
    // Third repair: rows where the beck's water lies, on its side only, so the drawn ground carries the combe's floor under
    // the water. The floor is level for 8 m either side of the line: beside the lane's rows (52 and 75) one row between
    // them at 60, where the beck runs along at 56 m out; one row halfway in each wide gap the beck crosses on its way out
    // (90, 127.5, 165); and rows 6 m apart across the floor of its last reach, which runs along at 183 to 189 m out
    // (186, 192, 198: the floor there lies between 175 and 197 m out).
    const beckRows = [60, 90, 127.5, 165, 186, 192, 198], negB = half.slice(1).concat(beckRows).sort((p, q) => q - p);
    for (const b of negB) bList.push(-b);
    for (const b of half) bList.push(b);
    const na = aList.length, nb = bList.length, gpos = new Float32Array(na * nb * 3), gidx = [];
    for (let i = 0; i < na; i++) {
      for (let j = 0; j < nb; j++) {
        const a = aList[i], b = bList[j], x = fic.gate.x + a * sf + b * cf, z = fic.gate.z + a * cf - b * sf, o = (i * nb + j) * 3;
        gpos[o] = x; gpos[o + 1] = heightAt(x, z); gpos[o + 2] = z;
        if (i < na - 1 && j < nb - 1) { const p = i * nb + j; gidx.push(p, p + nb, p + 1, p + 1, p + nb, p + nb + 1); }
      }
      if (i % 12 === 11) await ctx.yield();
    }
    const groundGeo = new THREE.BufferGeometry();
    groundGeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3)); await ctx.yield(); groundGeo.setIndex(gidx); await ctx.yield(); groundGeo.computeVertexNormals(); await ctx.yield();
    const groundMat = groundMaterial(shared, pal); await ctx.yield();
    const ground = new THREE.Mesh(groundGeo, groundMat); ground.frustumCulled = false; W.add(ground);
    await ctx.yield();

    // a bag of vertex-coloured triangles (one draw call per bag)
    const makeBag = () => {
      const P = [], Nn = [], C = [], Sw = [], v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3(), col = new THREE.Color();
      const bag = {
        P, Nn, C, Sw, kind: 0,
        add(geo, m, hex, k = 1, sway = 0, warp = null) {
          const g = geo.index ? geo.toNonIndexed() : geo, pa = g.attributes.position, na2 = g.attributes.normal;
          nm.getNormalMatrix(m); col.set(hex).multiplyScalar(k);
          for (let i = 0; i < pa.count; i++) {
            v.fromBufferAttribute(pa, i); if (warp) warp(v);
            v.applyMatrix4(m); n.fromBufferAttribute(na2, i).applyMatrix3(nm).normalize();
            P.push(v.x, v.y, v.z); Nn.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b); Sw.push(sway || bag.kind);
          }
          if (g !== geo) g.dispose(); geo.dispose();
        },
        box(cx, cy, cz, sx, sy, sz, hex, k = 1, ry = 0, rz = 0) {
          bag.add(new THREE.BoxGeometry(sx, sy, sz), new THREE.Matrix4().makeTranslation(cx, cy, cz).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(new THREE.Matrix4().makeRotationZ(rz)), hex, k);
        },
        mesh(material) {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(Sw, 1));
          const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; return mesh;
        },
      };
      return bag;
    };
    const litMat = litMaterial(shared, { side: THREE.DoubleSide });
    const folMat = foliageMaterial(shared);
    const _v = new THREE.Vector3();

    // the lane, from the yard to well past the exit
    let laneU = null;
    {
      const lats = [-2.7, -1.35, 0, 1.35, 2.7], P = [], UV = [], IX = [];
      let row = 0;
      for (let s = -21; s <= 655; s += 1) {
        for (const l of lats) { fic.place(s, l, 0, _v); P.push(_v.x, heightAt(_v.x, _v.z) + 0.05, _v.z); UV.push(l, s); }
        if (row > 0) { const b = row * 5, a = b - 5; for (let j = 0; j < 4; j++) IX.push(a + j, b + j, a + j + 1, a + j + 1, b + j, b + j + 1); }
        row++;
        if (row % 220 === 0) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setIndex(IX); g.computeVertexNormals();
      const lane = new THREE.Mesh(g, laneMaterial(shared, pal)); lane.frustumCulled = false; lane.renderOrder = 1; W.add(lane);
      // where the exit ring stands, in the fiction's own frame (the outdoors is still from U_FREE on)
      laneU = lane.material.uniforms; laneU.uRingS.value.x = 513 + 278 * (1 - U_FREE);
    }
    await ctx.yield();

    // real grass along both edges of the lane and down its crown
    let tuftBlade = null, tuftMat = null;
    {
      const BL = 13, bp = [], lcg = (() => { let h = 0.4217; return () => { h = (h * 8121.13 + 0.3379) % 1; return h; }; })();
      for (let k = 0; k < BL; k++) {
        const ang = (k / BL) * Math.PI * 2 + lcg(), r0 = 0.015 + 0.10 * lcg(), w = 0.008 + 0.008 * lcg(), lean = 0.03 + 0.12 * lcg(), hk = 0.45 + 0.55 * lcg();
        const cx = Math.cos(ang), cz = Math.sin(ang), px = -cz * w, pz = cx * w;
        bp.push(cx * r0 + px, 0, cz * r0 + pz, cx * r0 - px, 0, cz * r0 - pz, cx * (r0 + lean), hk, cz * (r0 + lean));
      }
      const tg = new THREE.InstancedBufferGeometry();
      tg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
      const perM = (s) => (s < 155 ? 36 : s > 636 ? 0 : s > 255 && s < 305 ? 12 : s > 412 && s < 505 ? 15 : s < 255 ? 18 : 22) * detail * Math.min(1.2, density), aI = [], aJ = [];      // thinner in the cutting (its banks have their own), past the crest, and none beyond the ring
      let acc = 0, n = 0;
      for (let s = -7; s < 648; s += 0.5) {
        acc += perM(s) * 0.5;
        while (acc >= 1) {
          acc -= 1;
          const crown = lcg() < 0.012, side = lcg() < 0.5 ? -1 : 1, r = lcg();
          const lat = crown ? (lcg() - 0.5) * 0.5 : side * (1.72 + (s < 155 ? 4.6 : 2.3) * r * r);
          if (crown && s < -2) continue;
          fic.place(s + lcg() * 0.5, lat, 0, _v);
          const big = n2(_v.x * 0.045 + 20, _v.z * 0.045) * 0.5 + 0.5;
          aI.push(_v.x, heightAt(_v.x, _v.z) + 0.03, _v.z, lcg() * 6.283);
          aJ.push((crown ? 0.05 + 0.05 * lcg() : 0.20 + 0.34 * lcg() * (0.6 + 0.8 * big)), lcg(), lcg(), lcg() < 0.35 + 0.4 * big ? 1 : 0.15);
          if (++n % 1500 === 0) await ctx.yield();
        }
      }
      tg.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(aI), 4)); tg.setAttribute('aJ', new THREE.InstancedBufferAttribute(new Float32Array(aJ), 4));
      tg.instanceCount = n;
      const tufts = new THREE.Mesh(tg, tuftMaterial(shared, pal)); tufts.frustumCulled = false; W.add(tufts);
      tuftBlade = tg.getAttribute('position'); tuftMat = tufts.material;
    }
    const meadowTufts = async () => {
      const aI = [], aJ = [], n = Math.round(2400 * detail * Math.min(1.1, density));
      let h = 0.2931; const lc = () => { h = (h * 7919.37 + 0.2718) % 1; return h; };
      for (let i = 0; i < n; i++) {
        const r = lc(), sT = 388 + 150 * lc(), lat = -(2.6 + 34 * r * r);
        fic.place(sT, lat, 0, _v);
        const big = n2(_v.x * 0.045 + 20, _v.z * 0.045) * 0.5 + 0.5;
        aI.push(_v.x, heightAt(_v.x, _v.z) + 0.02, _v.z, lc() * 6.283);
        aJ.push(0.30 + 0.45 * lc() * (0.6 + 0.8 * big), lc(), lc(), lc() < 0.5 + 0.4 * big ? 1 : 0.15);
        if (i % 800 === 799) await ctx.yield();
      }
      W.add(tuftMesh(aI, aJ));
    };
    // THE BROW carries no real grass (second repair): the brief gives real blades within 10 m of the lane only to s 150, and
    // at the crest nothing but the hill's own ground may rise between the eye and the home group (the white point, the
    // amber window, the roof). The verges of the brow are the painted meadow of the ground shader, as in the live version.
    const tuftMesh = (aI, aJ) => {
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', tuftBlade);
      g.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(aI), 4)); g.setAttribute('aJ', new THREE.InstancedBufferAttribute(new Float32Array(aJ), 4));
      g.instanceCount = aI.length / 4;
      const m = new THREE.Mesh(g, tuftMat); m.frustumCulled = false; return m;
    };
    await ctx.yield();

    // the house (the size reference all the way to the crest), the gate, the garden wall
    const WALL = pal.wall, SLATE = '#4A5764', STONE = '#8A8F88', GATE = '#2E6DA4', DARKWIN = '#1E2A33', TRIM = '#E9E4D6', TAR = '#3B4448';
    const built = makeBag(), home = makeBag();
    {
      const built = home;      // everything in this block belongs to the home group
      const MT = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
      const HX = 1.5, x0 = 4 + HX, x1 = 15 + HX, zf = -22, zb = -29, eave = 4.4, ridge = 7, zm = (zf + zb) / 2, xm = (x0 + x1) / 2;
      built.kind = 1;
      built.box(xm, eave / 2, zm, x1 - x0, eave, zf - zb, WALL, 0.80);
      for (const gx of [x0, x1]) {                                   // gables
        const sh = new THREE.Shape(); sh.moveTo(zb - zm, 0); sh.lineTo(zf - zm, 0); sh.lineTo(0, ridge - eave); sh.closePath();
        built.add(new THREE.ShapeGeometry(sh), MT(gx, eave, zm).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2)), WALL, 0.86);
      }
      built.box(13.4 + HX, ridge + 0.35, zm, 0.9, 1.6, 0.8, WALL, 0.74);                      // the chimney stack
      built.kind = 0;
      built.box(xm, 0.22, zm, x1 - x0 + 0.08, 0.44, zf - zb + 0.08, TAR, 1);                  // the tarred foot of the wall
      built.box(13.4 + HX, ridge + 1.18, zm, 1.02, 0.10, 0.92, STONE, 0.9);
      for (const px of [-0.22, 0.22]) built.add(new THREE.CylinderGeometry(0.10, 0.13, 0.42, 10), MT(13.4 + HX + px, ridge + 1.42, zm), '#9A6248', 0.9);
      built.kind = 2;
      const slope = Math.atan2(ridge - eave, (zf - zb) / 2), rl = Math.hypot(ridge - eave, (zf - zb) / 2) + 0.5;
      for (const sgn of [1, -1]) {
        const m = MT(xm, (eave + ridge) / 2 - 0.10, zm + sgn * ((zf - zb) / 4 + 0.18)).multiply(new THREE.Matrix4().makeRotationX(sgn * slope));
        built.add(new THREE.BoxGeometry(x1 - x0 + 0.7, 0.12, rl), m, SLATE, 1);
      }
      built.kind = 0;
      built.box(xm, ridge + 0.03, zm, x1 - x0 + 0.74, 0.14, 0.24, '#5A6670', 1);              // ridge tiles
      for (const gx of [x0 - 0.36, x1 + 0.36]) for (const sgn of [1, -1])                     // barge boards
        built.add(new THREE.BoxGeometry(0.05, 0.20, rl), MT(gx, (eave + ridge) / 2 - 0.18, zm + sgn * ((zf - zb) / 4 + 0.18)).multiply(new THREE.Matrix4().makeRotationX(sgn * slope)), TRIM, 0.8);
      built.box(xm, eave - 0.14, zf + 0.42, x1 - x0 + 0.5, 0.10, 0.12, '#39434A', 1);         // gutter and downpipe
      built.box(x0 + 0.25, eave / 2 - 0.1, zf + 0.10, 0.09, eave - 0.2, 0.09, '#39434A', 1);
      await ctx.yield();
      // four sash windows: a dark reveal, pale frame and glazing bars, a stone sill. The bars stand proud of the lit pane.
      for (const [wx0, wy, ww, wh] of [[6.3, 1.62, 1.0, 1.4], [12.7, 1.62, 1.0, 1.4], [6.3, 3.5, 1.0, 1.1], [12.7, 3.5, 1.0, 1.1]]) {
        const wx = wx0 + HX;
        built.box(wx, wy, zf + 0.03, ww, wh, 0.04, DARKWIN, 1);
        built.box(wx, wy + wh * 0.22, zf + 0.035, ww, wh * 0.5, 0.045, '#33475A', 1);             // the upper sash holds a little sky
        for (const sx of [-1, 1]) built.box(wx + sx * (ww / 2 + 0.035), wy, zf + 0.13, 0.07, wh + 0.14, 0.05, TRIM, 0.9);
        built.box(wx, wy + wh / 2 + 0.035, zf + 0.13, ww + 0.14, 0.07, 0.05, TRIM, 0.9);
        built.box(wx, wy, zf + 0.135, ww, 0.05, 0.04, TRIM, 0.9); built.box(wx, wy, zf + 0.13, 0.035, wh, 0.035, TRIM, 0.9);
        for (const sx of [-0.25, 0.25]) built.box(wx + sx * ww, wy - wh * 0.25, zf + 0.128, 0.022, wh * 0.5, 0.025, TRIM, 0.85);
        built.box(wx, wy - wh / 2 - 0.05, zf + 0.16, ww + 0.26, 0.09, 0.22, STONE, 0.95);
      }
      // the door: blue, in a pale frame, a pane over it, a step, a small slated hood
      const dx = 9.5 + HX;
      built.box(dx, 1.03, zf + 0.04, 0.98, 2.06, 0.06, GATE, 0.78);
      for (const py of [0.55, 1.45]) for (const sx of [-0.22, 0.22]) built.box(dx + sx, py, zf + 0.08, 0.30, py < 1 ? 0.62 : 0.78, 0.02, GATE, 0.62);
      built.box(dx + 0.36, 1.05, zf + 0.10, 0.05, 0.05, 0.05, '#C9B37A', 1);
      built.box(dx, 2.24, zf + 0.05, 0.98, 0.30, 0.05, '#33475A', 1);
      for (const sx of [-1, 1]) built.box(dx + sx * 0.54, 1.2, zf + 0.10, 0.09, 2.44, 0.10, TRIM, 0.9);
      built.box(dx, 2.44, zf + 0.10, 1.17, 0.09, 0.10, TRIM, 0.9);
      built.box(dx, 0.07, zf + 0.42, 1.5, 0.14, 0.7, STONE, 0.95);
      built.kind = 2; built.box(dx, 2.66, zf + 0.34, 1.9, 0.08, 0.78, SLATE, 1, 0, 0); built.kind = 0;
      for (const sx of [-1, 1]) built.box(dx + sx * 0.82, 2.5, zf + 0.30, 0.06, 0.26, 0.6, TRIM, 0.8);
      await ctx.yield();
      // gate posts (stone, with a cap) and the two blue leaves folded back into the yard
      for (const sx of [-1, 1]) {
        built.kind = 3;
        built.box(sx * 2.05, 0.75, -8, 0.56, 1.5, 0.56, STONE, 0.95);
        built.kind = 0;
        built.box(sx * 2.05, 1.54, -8, 0.70, 0.10, 0.70, STONE, 1.08);
        built.add(new THREE.ConeGeometry(0.46, 0.26, 4), MT(sx * 2.05, 1.72, -8).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 4)), STONE, 1.0);
        const ang = sx * 0.42, L = 1.85, cx = sx * 2.05 + Math.sin(ang) * (L / 2 + 0.2), cz = -8.2 - Math.cos(ang) * (L / 2 + 0.2);
        for (const y of [0.22, 0.68, 1.14]) built.box(cx, y, cz, L, 0.09, 0.05, GATE, 1, Math.PI / 2 - ang);
        for (let t = -0.5; t <= 0.501; t += 0.125) built.box(cx + Math.sin(ang) * t * L * -1, 0.70 + 0.05 * Math.cos(t * 6.283), cz + Math.cos(ang) * t * L, 0.045, 1.02 + 0.10 * Math.cos(t * 6.283), 0.04, GATE, t === -0.5 || t === 0.5 ? 0.85 : 1, Math.PI / 2 - ang);
        built.box(cx, 0.68, cz, L * 1.08, 0.07, 0.03, GATE, 0.8, Math.PI / 2 - ang, 0.5 * sx);    // the brace
        // the garden wall running away from each post, with a cope of stones set on edge
        const len = sx < 0 ? 46 : 17;
        await ctx.yield();
        built.kind = 3;
        built.box(sx * (2.33 + len / 2), 0.5, -8, len, 1.0, 0.46, STONE, 0.78);
        built.kind = 0;
        let ci = 0, ch = 0.7311 + sx * 0.1;                             // cope stones set on edge, no two alike, leaning on each other
        for (let t = 0.12; t < len; ci++) {
          ch = (ch * 9973.7 + 0.371) % 1; const cw = 0.11 + 0.11 * ch, hh = 0.22 + 0.13 * ((ch * 7.3) % 1), tone = 0.86 + 0.34 * ((ch * 13.7) % 1);
          built.box(sx * (2.33 + t + cw / 2), 0.99 + hh / 2, -8, cw, hh, 0.44 + 0.10 * ((ch * 3.1) % 1), ((ch * 5.3) % 1) < 0.3 ? '#A39A84' : STONE, tone, 0.10 * (ch - 0.5), 0.34 * (((ch * 17.1) % 1) - 0.5));
          t += cw + 0.012;
          if (ci % 90 === 89) await ctx.yield();
        }
      }
    }
    await ctx.yield();

    // hedges. lat > 0 is the car's left. Each ring: a grass bank (if any) with the hawthorn on top.
    const leaves = makeBag(), cDark = new THREE.Color(pal.dark).lerp(new THREE.Color(pal.meadow), 0.66).multiplyScalar(1.3), cBank = new THREE.Color(pal.meadow).multiplyScalar(0.80);
    const BANK_SLOPE = 0.6;
    const sprays = makeSprays(), homeSprays = makeSprays(), DARKHEX = '#' + cDark.getHexString(), _c3 = new THREE.Vector3(), _n3 = new THREE.Vector3();
    let tjh = 0.6183; const tj = () => { tjh = (tjh * 7907.31 + 0.1931) % 1; return tjh; };      // layout only: where the bank's tufts stand
    const hedgeRun = async (s0, s1, step, sign, hFn, bankFn, ptFn, tone = 1, bag = leaves, sp = sprays, face = 0, tI = null, tJ = null, lead = 0, skyFn = null) => {
      const rings = [], cols = [], sway = [], idx = [];
      let r = 0;
      for (let s = s0; s <= s1 + 1e-6; s += step, r++) {
        if (r % 10 === 9) await ctx.yield();
        const endK = Math.sqrt(Math.min(1, Math.min(s - s0, s1 - s) / (step * 1.01))), eW = 0.55 + 0.45 * endK;      // ends square: a plain upright wall
        const h = hFn(s) * (0.95 + 0.10 * n2(s * 0.31, 7.7 * sign)) * endK, bk = bankFn(s) * endK, foot = 0.8 * eW + bk * BANK_SLOPE;
        const prof = [[-foot, 0, 0], [-0.8, bk, 0], [-0.72, bk + 0.25, 1], [-0.62, bk + h * 0.82, 1], [-0.26, bk + h, 1], [0.26, bk + h * 0.97, 1], [0.62, bk + h * 0.8, 1], [0.72, bk + 0.25, 1], [0.8, bk, 0], [0.8 * eW + bk * 1.1, 0, 0]];
        const c = ptFn(s);       // { x, z, lx, lz }: centre line point and the unit lateral
        const sky = skyFn ? skyFn(s) : 1;      // this ring's share of the hedge's sky light (1 everywhere but on a falling end)
        if (endK > 0.99) for (let q = 0; q < 8; q++) {             // sprays standing out of the top and hanging on the faces
          const top = q < 3, l = (top ? (q - 1) * 0.42 : (q === 4 ? 0.78 : -0.80)) * sign + 0.12 * n2(s * 2.1 + q, 4.4), yy = top ? h + 0.05 + 0.18 * n2(s * 1.7, q * 3.1) : h * (q < 5 ? 0.45 : [0.18, 0.62, 0.86][q - 5]) + h * 0.14 * n2(s * 1.3, q * 5.7);
          const x = c.x + c.lx * l, z = c.z + c.lz * l;
          _c3.set(x + 0.4 * n2(s * 3.7, q), heightAt(x, z) + bk + yy, z + 0.4 * n2(q, s * 3.1));
          if (top) _n3.set(c.lx * (q - 1) * 0.5 * sign, 1, c.lz * (q - 1) * 0.5 * sign).normalize(); else _n3.set(c.lx * (q === 4 ? 1 : -1) * sign, 0.35, c.lz * (q === 4 ? 1 : -1) * sign).normalize();
          sp.add(_c3, _n3, 0.95 + 0.3 * n2(s * 0.9, q * 2.3), DARKHEX, (top ? 1.25 : 1.0) * (0.55 + 0.45 * tone) * (1 + 0.25 * n2(s * 0.37, q + 2.2)), 0, sky);
        }
        // leaders: shoots 0.7 to 1.5 m long standing out of the top with sky between them (a hawthorn hedge cut last winter
        // carries a summer's growth by late August), so the top is a ragged line of twig and leaf and never a ruled edge
        if (endK > 0.99) for (let q = 0; q < lead; q++) {
          const ds = step * (q + 0.5 + 0.4 * n2(s * 3.3, q * 1.9)) / lead - step * 0.5, c2 = ptFn(Math.min(s1, Math.max(s0, s + ds)));
          const l = 0.34 * n2(s * 2.9 + q, 6.1) * sign, x = c2.x + c2.lx * l, z = c2.z + c2.lz * l, len = (1.1 + 0.4 * n2(s * 1.1 + q * 5.3, 2.7)) * Math.min(1, h / 2);
          _c3.set(x, heightAt(x, z) + bk + h * 0.96 + len * 0.30, z); _n3.set(c2.lx * sign, 0, c2.lz * sign);
          sp.add(_c3, _n3, len, DARKHEX, 1.2 * (0.55 + 0.45 * tone) * (1 + 0.25 * n2(s * 0.41 + q, 7.2)), 1, sky);
        }
        // the face toward the lane: sprays hanging all over it, so it is leaves with dark between and not a painted wall
        if (endK > 0.99) for (let q = 0; q < face; q++) {
          const fy = 0.06 + 0.9 * ((q + 0.5 + 0.45 * n2(s * 1.9, q * 7.7)) / face), ds = step * 0.5 * n2(s * 2.3 + 5, q * 4.1), c2 = ds ? ptFn(Math.min(s1, Math.max(s0, s + ds))) : c;
          const l = -(0.80 - 0.22 * fy * fy + 0.10 * n2(s * 2.7, q * 3.3)) * sign, x = c2.x + c2.lx * l, z = c2.z + c2.lz * l;
          _c3.set(x, heightAt(x, z) + bk + fy * h, z); _n3.set(-c2.lx * sign, 0.25 + 0.5 * fy, -c2.lz * sign).normalize();
          sp.add(_c3, _n3, 0.85 + 0.35 * n2(s * 0.9 + 3, q * 2.3), DARKHEX, (0.62 + 0.5 * fy) * (0.6 + 0.4 * tone) * (1 + 0.3 * n2(s * 0.37 + q, 2.2)), 0, sky);
        }
        // tussocks and seed heads on the bank's face
        if (tI && bk > 0.5 && endK > 0.99) for (let q = 0, nq = Math.round((5 + 6 * bk) * Math.max(0.6, detail)); q < nq; q++) {
          const t = tj(), ds = step * (tj() - 0.5), c2 = ptFn(Math.min(s1, Math.max(s0, s + ds)));
          const l = -(foot - (foot - 0.8) * t) * sign, x = c2.x + c2.lx * l, z = c2.z + c2.lz * l, big = 0.5 + 0.5 * n2(x * 0.3, z * 0.3);
          tI.push(x, heightAt(x, z) + bk * t - 0.03, z, 6.283 * Math.abs(n2(s * 5.1, q * 1.3)));
          tJ.push(0.22 + 0.34 * big * (0.5 + tj()), 0.55 + 0.45 * tj(), tj(), big > 0.72 && tj() < 0.5 ? 1 : 0.1);
        }
        for (let j = 0; j < prof.length; j++) {
          const q = prof[j], jit = q[2] * 0.16 * n2(s * 0.83 + j * 3.1, j * 1.7 + sign), l = (q[0] * (q[2] ? eW : 1) + jit * endK) * sign;
          const x = c.x + c.lx * l, z = c.z + c.lz * l;
          rings.push(x, heightAt(x, z) + q[1] + (q[2] && j > 2 && j < 7 ? 0.2 * n2(s * 1.3, j * 2.9) : 0), z);
          const k = q[2] ? (1.0 + 0.3 * n2(s * 0.17, j + 11.3)) * tone : 0.72 + 0.28 * tone;
          const cc = q[2] ? cDark : cBank; cols.push(cc.r * k, cc.g * k, cc.b * k); sway.push(q[2] ? (lead && j >= 3 && j <= 6 ? 0.8 + 0.08 * sky : 0.8) : 0);      // the cutting's hedges: the shoulders and top sway a tenth more than the foot, and the shader knows them by it; less along a falling end, down to the foot's own value where the hedge stops (the shader's smoothstep on this value is a second curve over skyEnd's square: see skyEnd)
          if (r > 0 && j > 0) { const b = r * 10 + j, a = b - 10; if (sign > 0) idx.push(a - 1, a, b - 1, a, b, b - 1); else idx.push(a - 1, b - 1, a, a, b - 1, b); }
        }
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(rings, 3)); g.setIndex(idx); g.computeVertexNormals();
      await ctx.yield();
      const pa = g.attributes.position, na2 = g.attributes.normal;
      for (const i of idx) { bag.P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); bag.Nn.push(na2.getX(i), na2.getY(i), na2.getZ(i)); bag.C.push(cols[i * 3], cols[i * 3 + 1], cols[i * 3 + 2]); bag.Sw.push(sway[i]); }
      g.dispose();
    };
    // The cutting ends at S_STOP. Over its last stretch (from S_FLARE, past the place where the sight line from the hill
    // crosses the right hedge) both hedges swing away from the lane like curtains and end square, so from the hill
    // the middle of the window holds only the lane, the valley and the house.
    const HEDGE_TONE = 0.58, SINK_U0 = 0.3315, SINK_U1 = 0.3395, SINK_T = 15, CLIMB_U0 = 0.3235, CLIMB_U1 = 0.3395, CLIMB_FALL = 6.6, BROW_U0 = 0.378, BROW_U1 = 0.401;
    const BANK_R = 2.0, BANK_CUT = 4.1, S_STOP = 299, S_FLARE = 271, FLARE = 30, S_HEDGE0 = 118;
    const flare = (s) => { const t = ss(S_FLARE, S_STOP, s); return FLARE * t * t; };
    const bankRight = (s) => BANK_R * ss(140, 153, s) + (BANK_CUT - BANK_R) * ss(246, 262, s) - (BANK_CUT - 0.5) * ss(S_FLARE, S_STOP - 6, s);
    const BANK_L = 2.2, bankLeft = (s) => BANK_L * ss(246, 262, s) - (BANK_L - 0.5) * ss(S_FLARE, S_STOP - 6, s);      // the far side need hide nothing: lower, so it is no tower from the hill
    const endLow = (s) => (1 - 0.74 * ss(S_FLARE + 1, S_STOP - 5, s)) * (1 + 0.34 * n2(s * 0.29, 7.7) * ss(S_FLARE - 8, S_FLARE + 6, s));      // ragged, and falling away to nothing          // the curtain ends fall away: no ramparts under the valley
    const hRight = (s) => (2.2 + 0.8 * ss(246, 260, s)) * endLow(s), hLeft = (s) => 3.0 * endLow(s);
    // the sky light on the cutting's hedges (upper leaves, sprays, leaders) goes out along each hedge's falling end, from
    // where the hedge begins to fall to where it stops. skyEnd is each ring's share: all of it at S_FLARE, none at S_STOP,
    // as the square of the share of the fall still to come (the curtain's own law: it swings away as the square, flare
    // above). THE SPRAYS AND LEADERS take that share as it is (aSky, times the light, in sprayMaterial): they begin to
    // lose it at the first metre of the fall and three quarters has gone halfway down. THE BODY (the upper rings of the
    // hawthorn) does not: its share is baked into aSway as 0.8 + 0.08 x share and foliageMaterial puts that through
    // smoothstep(0.81, 0.875), so the body's light is a second curve over the square: whole to a share of 0.94, half
    // at 0.53 (s 278.6), none from 0.125 down (s 289.1 on), ten metres short of S_STOP
    const skyEnd = (s) => { const t = Math.min(1, Math.max(0, (s - S_FLARE) / (S_STOP - S_FLARE))); return (1 - t) * (1 - t); };
    const _rd = {};
    const sidePt = (latFn) => (s) => { fic.road(s, _rd); const l = latFn(s); return { x: _rd.x + Math.cos(_rd.h) * l, z: _rd.z - Math.sin(_rd.h) * l, lx: Math.cos(_rd.h), lz: -Math.sin(_rd.h) }; };
    const latRight = (s) => -(3.7 + bankRight(s) * BANK_SLOPE + flare(s)), latLeft = (s) => 3.7 + bankLeft(s) * BANK_SLOPE + flare(s);
    // the right hedge begins at s 118: nearer the house the lane is open on that side, so from the hill it is one pale line to the gate
    // THE CLIMB OUT. As the car leaves the cutting (u CLIMB_U0 to CLIMB_U1) the land behind it falls away below the window:
    // lane, ground, banks, hedges and tufts are all lowered by one smooth field in their vertex shaders (swSink), more the
    // further behind the car they lie and nothing under or near the car, so no hedge moves against its own ground and
    // from the hill only a low dark hedge line lies under the valley. The two bank ashes far down the lane (sinkT) are
    // still plain stage flats. Pure functions of u, like the home group's scale.
    const leavesR = makeBag(), spraysR = makeSprays(), leavesL = makeBag(), spraysL = makeSprays(), leavesT = makeBag(), spraysT = makeSprays(), builtT = makeBag();
    await meadowTufts();
    const tIR = [], tJR = [], tIL = [], tJL = [];
    await hedgeRun(S_HEDGE0, S_STOP, 1.25, -1, hRight, bankRight, sidePt(latRight), HEDGE_TONE, leavesR, spraysR, 9, tIR, tJR, 3, skyEnd);
    await ctx.yield();
    await hedgeRun(216, S_STOP, 1.25, 1, hLeft, bankLeft, sidePt(latLeft), HEDGE_TONE * 0.85, leavesL, spraysL, 9, tIL, tJL, 3, skyEnd);
    await ctx.yield();
    // the yard hedge behind the gateway, tall and dark: what the cloth is read against from fifteen metres on
    const homeLeaves = makeBag();
    await hedgeRun(-52, 24, 1.5, 1, () => 4.6, () => 0, (t) => ({ x: t, z: -30.6, lx: 0, lz: 1 }), 0.32, homeLeaves, homeSprays);
    await ctx.yield();
    // a post-and-wire fence along the open side of the valley lane: low, streams in at that edge and hides nothing
    const fenceTops = [];
    built.kind = 4;
    for (let s = 14; s < S_HEDGE0 - 2; s += 3.5) {
      fic.place(s, -3.1, 0, _v);
      const y0 = heightAt(_v.x, _v.z), hgt = 1.08 + 0.10 * n2(s * 0.9, 3.3), lean = 0.07 * n2(s * 0.7, 9.1);
      built.box(_v.x, y0 + hgt / 2, _v.z, 0.12, hgt, 0.12, '#6A645A', 0.85 + 0.3 * Math.abs(n2(s * 1.9, 5.5)), 0.6 * n2(s, 1.1), lean);
      fenceTops.push([new THREE.Vector3(_v.x, y0 + hgt - 0.12, _v.z), new THREE.Vector3(_v.x, y0 + hgt * 0.52, _v.z)]);
    }
    const fenceTops2 = [];
    for (let s = 396; s < 501; s += 3.2) {
      fic.place(s, -6.2 - 0.5 * n2(s * 0.05, 2.2), 0, _v); fic.road(s, _rd);
      const y0 = heightAt(_v.x, _v.z), gate = s > 440 && s < 446.5, hgt = (gate ? 1.32 : 1.12) + 0.10 * n2(s * 0.9, 6.3);
      built.box(_v.x, y0 + hgt / 2, _v.z, gate ? 0.17 : 0.12, hgt, gate ? 0.17 : 0.12, '#6A645A', 0.85 + 0.3 * Math.abs(n2(s * 1.9, 8.5)), 0.6 * n2(s, 4.1), 0.06 * n2(s * 0.7, 2.1));
      if (gate && s < 443.3) {                                         // a five bar gate between the two stout posts
        const mid = fic.place(s + 1.6, -6.2 - 0.5 * n2((s + 1.6) * 0.05, 2.2), 0, new THREE.Vector3()), ym = heightAt(mid.x, mid.z);
        for (let b = 0; b < 5; b++) built.box(mid.x, ym + 0.22 + b * 0.235, mid.z, 3.0, 0.075, 0.035, '#7A7468', 0.9 + 0.08 * b, _rd.h - Math.PI / 2);
        built.box(mid.x, ym + 0.70, mid.z, 3.25, 0.06, 0.03, '#7A7468', 0.85, _rd.h - Math.PI / 2, 0.30);
      } else if (!gate || s > 443.3) fenceTops2.push([new THREE.Vector3(_v.x, y0 + hgt - 0.12, _v.z), new THREE.Vector3(_v.x, y0 + hgt * 0.52, _v.z), gate]);
      if (gate && s < 443.3) fenceTops2.push(null);
    }
    built.kind = 0;

    // THE VALLEY FLOOR IS FARMED (flight round 2; strangers: "long stretches of empty road and field"). Everything here
    // stands still on the valley floor, so in the backward view each thing comes in at an edge of the frame as the car
    // passes it and slides inward and shrinks; nothing is white or pale, nothing waves, no people, stock, lamps or water.
    // THE FIELD HEDGES stand on the ground shader's own hedgerow rows (its fA = fa / 37 + .22 vn + .5 draws a dark line
    // where fA is whole, so at fa = 37 (k - .5 - .22 vn); vn's mean is .5, hence ROW_PH .61): from the hill the real
    // hedge and the painted line are the same line (they lie within 4 m of one another along the eye's own line of
    // sight). WHICH ROWS ARE BUILT is a rule in the land's own metres (the lead's mend C; the two typed row numbers are
    // gone): a row is built when it crosses the lane BEYOND THE FIRST ASH (ashS[0], s 30, 38 m from the gate at s -8:
    // the brief's journey gives the lane as far as the first ash to the gateposts, the first pole and the first ash,
    // "she changes hands; the dog runs, falls behind, sits", so the fields' own boundaries begin beyond it) and SHORT OF
    // THE HILL'S FOOT (fic.a210, where the lane begins to climb: the rows are the level valley floor's). Rows fall where
    // they fall: today that is rows 2 to 6, crossing the lane at s 45, 83, 121, 159 and 197. Low laid hawthorn, FH 1.0 m
    // (1.15 m at its tallest: under the 1.25 m of the eye, so it can hide nothing
    // at home that stands above that), in the palette's dark. WHERE A ROW ENDS IS THE LAND'S (repair): it is laid across
    // the level floor of the valley and dies out up the first roll of the ground, at its full height as far as the floor
    // is level (ROLL_B0 from the lane's last line) and gone where the roll is whole (ROLL_B1), by the same ramp heightAt
    // gives the roll; its width goes with its last quarter of height, so it ends as a line of rough grass and not a slab.
    // Each stops GAPL 3.6 m short of the lane's middle (the fence line at 3.1 m and half a metre for the stoop), at a
    // stone stoop, so the lane to the gate runs through open gaps. The stoop is square to its own row (turned by fic.hf,
    // as the gate and the stile are) and the hedge begins STOOP_CLR beyond the stoop's middle (half the cap's 0.52 m,
    // the stoop's widest part, and 0.1 m of air, the play the stile's slab has to the hedge), so the stoop stands whole
    // and no leaf is laid through it. ONE END AT THE LANE (repair; the cast: things come in "never as a pair"): where the
    // lane has no hedge of its own yet (before S_HEDGE0) a row stands on the car's left only, so it has ONE end at the
    // lane and comes into the back window at one edge; built on both sides its two ends would come in at both edges at
    // once, a pair. (That side is also the side of the poles and of the ashes at s 30, 70 and 110: the rows at s 45 and
    // s 83 come in at the same edge as those, between them, one after another; the other edge has the fence.) From
    // S_HEDGE0 on the right-hand end of a row lies behind the lane's own hedge and never shows at the lane.
    // THE STONE of the stoops and the trough is the valley's wall stone in the wall's own tone and light:
    // WALL_K 0.78 is the tone the garden wall beside the gate is built in (kind 3, field stone), and a cap stands to
    // its stoop as the gateposts' cap stands to its post (1.08 to 0.95).
    const ashS = [30, 70, 110, 133, 160, 191, 233];      // the seven ashes' stations (read here by the rows and below by the ashes themselves)
    // THE FIELD HEDGES ARE LAID INTO THE RIGHT-HAND LANE HEDGE'S BAG (the lead's mends B4 and H): that bag is drawn with
    // the lane hedges' own capped material (uRim 1: CAP_GLSL holds every leaf under two thirds of the lane gravel's
    // tone), which is the material these hedges are to have, and it is complete by now (its hedgeRun ran above and
    // nothing reads its arrays again), so the field hedges cost no mesh and no draw call of their own. They carry no
    // sky light on their tops: that is each lane hedge ring's own (aSway 0.81 and up) and these are laid at 0.55.
    const fieldB = leavesR, hayCocks = [], ashFoot = [];
    {
      const ROW = 37, ROW_PH = 0.61, FH = 1.0, FSEG = 4, GAPL = 3.6, FTONE = 0.45, WALL_K = 0.78, CAP_K = WALL_K * 1.08 / 0.95, STOOP_CLR = 0.52 / 2 + 0.1;
      const ab = (a, b, out) => out.set(fic.gate.x + a * sf + b * cf, 0, fic.gate.z + a * cf - b * sf);
      const _p = new THREE.Vector3(), rowA = {}, rowB = {}, PROF = [[-0.6, 0], [-0.33, 0.82], [0.05, 1], [0.5, 0]];
      const stoopF = (a, b) => { ab(a, b, _p); const y0 = heightAt(_p.x, _p.z); built.kind = 3; built.box(_p.x, y0 + 0.55, _p.z, 0.44, 1.30, 0.44, STONE, WALL_K, fic.hf); built.kind = 0; built.box(_p.x, y0 + 1.24, _p.z, 0.52, 0.10, 0.52, STONE, CAP_K, fic.hf); };
      for (let k = 1; ROW * (k - ROW_PH) < fic.a210; k++) {
        const fa = ROW * (k - ROW_PH);
        let sK = 0; for (let sq = 0; sq < 260; sq += 0.5) { fic.road(sq, _rd); if (fic.aOf(_rd.x, _rd.z) >= fa) { sK = sq; break; } }      // where the lane crosses this row
        fic.road(sK, _rd); const bL = fic.bOf(_rd.x, _rd.z); rowA[k] = fa; rowB[k] = bL;
        if (sK <= ashS[0]) continue;      // the lane as far as the first ash is the gate's own (see above): this row is the ground shader's line only
        for (const side of [-1, 1]) {      // -1: the car's right of the lane (b falling), +1: its left
          if (side < 0 && sK < S_HEDGE0) continue;      // no hedge on the lane's right yet: the row stands on the left only
          // on the right the lane's own hedge stands from S_HEDGE0 on: the row stops 1.2 m outside that hedge's middle line
          let t0 = side < 0 && sK >= S_HEDGE0 ? Math.max(GAPL, -latRight(sK) + 1.2) : GAPL;
          const gateHere = k === 3 && side > 0;      // row 3, left: a field gate (3.2 m) and a stile between the stoop at the lane and the hedge
          if (side > 0) stoopF(fa, bL + side * t0);      // one stoop to a row, always on the left: on the right the row ends at the lane's hedge
          if (gateHere) t0 += 4.4;      // 3.4 m for the gate (3.2 m and 0.1 m of play at each end), 0.9 m for the stile's slab, 0.1 m to the hedge
          const pos = [], idx = [], clr = side > 0 && !gateHere ? STOOP_CLR : 0;      // a hedge that ends at a stoop begins clear of it; every other length stands where it stood
          for (let t = t0, r = 0; Math.abs(bL + side * t) <= ROLL_B1 + 1e-6; t += FSEG, r++) {
            const tb = r === 0 ? t + clr : t;
            const lie = 1 - ss(ROLL_B0, ROLL_B1, Math.abs(bL + side * t)), wK = Math.min(1, 4 * lie);      // how much of a hedge the ground still carries here
            const hK = FH * (0.80 + 0.35 * n2(t * 0.33, k * 3.7 + side)) * lie * (r === 0 ? 0.8 : 1), wob = 0.5 * n2(t * 0.05, k * 1.3 + side);
            for (let j = 0; j < 4; j++) { ab(fa + wob + (PROF[j][0] * (0.8 + 0.2 * hK) + 0.08 * n2(t * 0.9 + j, k)) * wK, bL + side * tb, _p); pos.push(_p.x, heightAt(_p.x, _p.z) + PROF[j][1] * hK, _p.z); }
            if (r > 0) for (let j = 1; j < 4; j++) { const b2 = r * 4 + j, a2 = b2 - 4; if (side > 0) idx.push(a2 - 1, a2, b2 - 1, a2, b2, b2 - 1); else idx.push(a2 - 1, b2 - 1, a2, a2, b2 - 1, b2); }
          }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
          const pa = g.attributes.position, na2 = g.attributes.normal;
          for (const i of idx) { const kc = FTONE * (1 + 0.25 * n2(i * 0.37, k + side)); fieldB.P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); fieldB.Nn.push(na2.getX(i), na2.getY(i), na2.getZ(i)); fieldB.C.push(cDark.r * kc, cDark.g * kc, cDark.b * kc); fieldB.Sw.push(0.55); }      // 0.55: leaf, not bank (the foliage shader tells them apart at 0.4 and opens the outline from 0.5 up; a value clear of both edges), and a low laid hedge trembles less than the 2.2 m lane hedge's 0.8
          g.dispose();
        }
        await ctx.yield();
      }
      // THE FIELD GATE AND THE STILE, where row 3 meets the lane on the left: a five-bar gate 3.2 m long hung on the row's
      // one stoop and shutting against the stile's slab (repair: a second stoop stood here, a pair of posts; the slab is
      // the gate's shutting post), the stile a stone slab 0.9 m long and 0.85 m high with a through-stone step each side.
      // The slab's middle is 3.85 m from the stoop: 3.4 m for the gate and its play, and half the slab's 0.9 m.
      {
        const fa = rowA[3], t0 = rowB[3] + GAPL, WOODF = '#7A7468';
        ab(fa, t0 + 1.7, _p); let y0 = heightAt(_p.x, _p.z); built.kind = 4;
        for (let b = 0; b < 5; b++) built.box(_p.x, y0 + 0.24 + b * 0.235, _p.z, 3.2, 0.08, 0.04, WOODF, 0.80 + 0.06 * b, fic.hf);
        for (const tt of [-1.5, 0, 1.5]) { ab(fa, t0 + 1.7 + tt, _p); built.box(_p.x, y0 + 0.72, _p.z, 0.09, 1.16, 0.05, WOODF, 0.75, fic.hf); }
        ab(fa, t0 + 1.7, _p); built.box(_p.x, y0 + 0.72, _p.z, 3.3, 0.07, 0.03, WOODF, 0.72, fic.hf, 0.23);
        built.kind = 3; ab(fa, t0 + 3.85, _p); y0 = heightAt(_p.x, _p.z); built.box(_p.x, y0 + 0.32, _p.z, 0.9, 1.06, 0.16, STONE, 0.52, fic.hf);
        built.kind = 0; for (const [da, hy] of [[-0.3, 0.30], [0.3, 0.30]]) { ab(fa + da, t0 + 3.85, _p); built.box(_p.x, y0 + hy, _p.z, 0.5, 0.08, 0.42, STONE, 0.60, fic.hf); }
      }
      // HAY COCKS in one field: the field between rows 3 and 4 on the left of the lane. Four lines of nine, 9 m apart both
      // ways (a cock is what a fork can carry in from about that far), the first line 5 m inside the hedge and the first
      // cock 9 m from the lane's middle; each stands within 1.5 m of its place and is 1.1 to 1.5 m tall. Hay at dusk
      // is the field's own grass, cocked the day it was mown and still green: two parts of the meadow's colour to one of
      // its seed-heads (repair: pure seed-head, and then the ground's mown-field mix of seven parts seed-head to three,
      // both read orange-brown under the afterglow, a tone the dusk palette does not have), at a quarter of its tone,
      // so a cock's lit side stays under half the lane gravel's tone. The cocks' places are only listed here; they are
      // set up after the ashes are built (below, "the hay cocks are set up"), because NO COCK STANDS UNDER A TREE.
      {
        for (let i = 0; i < 4; i++) for (let j = 0; j < 9; j++) {
          const a = rowA[3] + 5 + 9 * i + 1.5 * n2(i * 7.1 + j * 3.3, 1.9), bl = rowB[3] + (rowB[4] - rowB[3]) * (a - rowA[3]) / ROW;
          ab(a, bl + 9 + 9 * j + 1.5 * n2(j * 5.7 + i * 2.1, 8.4), _p);
          hayCocks.push({ x: _p.x, z: _p.z, ry: i + j * 1.9, sc: 0.85 + 0.15 * (1 + n2(i * 3.9 + j * 1.7, 5.2)), k: 0.26 + 0.04 * n2(i * 1.3, j * 2.9) });
        }
      }
      // A STONE TROUGH in the field on the right, just outside the fence, between rows 3 and 4 (s 100, 1.2 m beyond the
      // fence line): 1.9 m long, dry. Its faces are the wall stone in the wall's tone (WALL_K; they were built at 0.50
      // and drew near black: the brief's shade is #34454F and nothing outdoors goes under it) and its hollow, a dry
      // stone floor 0.25 m down that sees half the sky, is that stone at half the wall's tone (it was 0.16, under the
      // brief's 0.03 linear)
      { fic.place(100, -4.3, 0, _v); fic.road(100, _rd); const y0 = heightAt(_v.x, _v.z); built.kind = 3; built.box(_v.x, y0 + 0.20, _v.z, 1.9, 0.50, 0.62, STONE, WALL_K, _rd.h - Math.PI / 2); built.kind = 0; built.box(_v.x, y0 + 0.452, _v.z, 1.62, 0.01, 0.36, STONE, WALL_K / 2, _rd.h - Math.PI / 2); }
      // (repair: the far barn that stood here, 95 m out and level with the garden hedge, is taken out. Its place was two
      // typed distances; a place the land gives near home leaves a second building beside the house in the hilltop
      // view, and one among the rows would stand nearer the hill than the house and be drawn larger than it.)
    }
    // THE ROAD AHEAD (seen only after the head has turned, s 505 on; the outdoors stands still from u 0.561, so these
    // simply pass). The lane runs on between low dry-stone walls with copes set on edge, a field gateway with its gate
    // swung open, a finger post, a tumbled gap; telegraph poles carry on along the left. Low enough to hide nothing.
    const aheadTops = [], aheadB = makeBag(), leavesA = makeBag(), spraysA = makeSprays();      // their own bags: three more draw calls, no long step
    // places of the road ahead that more than one thing reads (flight round 2: these numbers stood typed in the lines below;
    // they are the same numbers, named): the right-hand wall's tumbled gap, whose fallen stones lie from GAP_S0 for GAP_LEN
    // metres; the field gateway's near stoop; and the finger post, which stands POST_BACK short of that stoop.
    const GAP_S0 = 526, GAP_LEN = 7, GATEWAY_S0 = 564.5, POST_BACK = 1.3;
    {
      let ch = 0.6173, nc = 0;
      const lc = () => { ch = (ch * 9973.7 + 0.371) % 1; return ch; };
      fic.road(560, _rd); const ryA = _rd.h - Math.PI / 2, WOOD = '#7A7468';
      const wallRun = async (s0, s1, lat, low) => {
        for (let s = s0; s < s1 - 0.2; s += 2.4) {
          const L = Math.min(2.4, s1 - s), kLow = low ? low(s + L / 2) : 1, hB = (0.78 + 0.10 * n2(s * 0.11, lat)) * kLow, wob = 0.14 * n2(s * 0.07, 3.1 + lat);
          fic.place(s + L / 2, lat + wob, 0, _v); const y0 = heightAt(_v.x, _v.z);
          aheadB.kind = 3.2;
          aheadB.box(_v.x, y0 + hB / 2 - 0.06, _v.z, L + 0.03, hB + 0.12, 0.52, STONE, 0.72 + 0.12 * lc(), ryA);
          aheadB.kind = 0;
          if (kLow < 0.8 || s > 641) continue;                          // where it has tumbled the cope has gone; far beyond the ring it is only a line
          for (let t = 0.02; t < L - 0.05; nc++) {
            const cw = Math.min(L - t, 0.17 + 0.20 * lc()), hh = 0.19 + 0.09 * lc();
            fic.place(s + t + cw / 2, lat + wob, 0, _v);
            aheadB.box(_v.x, y0 + hB + hh / 2 - 0.03, _v.z, cw, hh, 0.46 + 0.10 * lc(), lc() < 0.3 ? '#A39A84' : STONE, 0.84 + 0.36 * lc(), ryA + 0.14 * (lc() - 0.5), 0.62 * (lc() - 0.5));
            t += cw + 0.004;
            if (nc % 40 === 39) await ctx.yield();
          }
        }
      };
      const stoop = (s, lat) => { fic.place(s, lat, 0, _v); const y0 = heightAt(_v.x, _v.z); aheadB.kind = 3.2; aheadB.box(_v.x, y0 + 0.66, _v.z, 0.50, 1.42, 0.56, STONE, 0.9, ryA); aheadB.kind = 0; aheadB.box(_v.x, y0 + 1.42, _v.z, 0.60, 0.12, 0.66, '#A39A84', 0.95, ryA); };
      const GW0 = GATEWAY_S0, GW1 = 569.3, LATL = 4.25, LATR = -4.25;
            await wallRun(506, GW0, LATL); await ctx.yield();
      await wallRun(GW1, 716, LATL); await ctx.yield();
      await wallRun(519, 531, LATR, (sq) => 1 - 0.75 * ss(523, 530, sq)); await wallRun(580.6, 640, LATR); await ctx.yield();      // the right-hand wall breaks off: the beck runs beside the lane in the open, as far as the bridge
      stoop(GW0, LATL); stoop(GW1, LATL); stoop(519, LATR);
      // THE FIELD WALL of the hollow: one dry-stone wall leaving the lane's fence square on at s 466 (where the hollow is at
      // its full depth) and running down the bank and across the floor to the beck, 66 m out. It is what the side windows
      // look along as the head turns. Laid in 1.2 m lengths so it can step down the bank: each length is a level box and
      // its copes sit on that box's own top (the ground's height taken once, at the length's middle, for body and copes
      // alike), so no cope floats or sinks where the bank is steep. The copes run the wall's whole length except the
      // tumbled stretch (37 to 46 m out), where they have fallen with the wall.
      {
        const SW = 466, yaw = ryA + Math.PI / 2;
        let fh = 0.4409; const fc = () => { fh = (fh * 9973.7 + 0.371) % 1; return fh; };      // its own layout sequence: the stones of the walls, bridge and gap ahead are laid as they were
        for (let lat = -8.2, i = 0; lat > -66; lat -= 1.2, i++) {
          const wob = 0.5 * n2(lat * 0.06, 8.8), gap = 1 - 0.8 * ss(-46, -43, lat) * (1 - ss(-40, -37, lat));      // one tumbled stretch, 6 m long
          fic.place(SW + wob, lat - 0.6, 0, _v); const y0 = heightAt(_v.x, _v.z), hB = (0.86 + 0.10 * n2(lat * 0.2, 1.9)) * gap;
          aheadB.kind = 3; aheadB.box(_v.x, y0 + hB / 2 - 0.45, _v.z, 1.26, hB + 0.9, 0.52, STONE, 0.74 + 0.12 * fc(), yaw);
          aheadB.kind = 0;
          if (gap < 0.8) continue;
          const cx0 = _v.x, cz0 = _v.z, dxl = Math.cos(fic.hf), dzl = -Math.sin(fic.hf);      // the length's middle; one metre further to the car's left
          for (let t = 0.02; t < 1.15;) {
            const cw = Math.min(1.2 - t, 0.17 + 0.20 * fc()), hh = 0.19 + 0.09 * fc();
            const off = 0.6 - t - cw / 2;      // metres along the wall from the length's middle (which is at lat - 0.6)
            aheadB.box(cx0 + off * dxl, y0 + hB + hh / 2 - 0.05, cz0 + off * dzl, cw, hh, 0.46 + 0.10 * fc(), fc() < 0.3 ? '#A39A84' : STONE, 0.84 + 0.36 * fc(), yaw + 0.14 * (fc() - 0.5), 0.62 * (fc() - 0.5));
            t += cw + 0.004;
          }
          if (i % 6 === 5) await ctx.yield();
        }
      }
      // THE BRIDGE over the beck (s 582 to 594): parapets a head higher than the walls and humped, flat copes, four piers
      for (const lat of [LATL, LATR]) {
        const _rb = {};
        for (let i = 0; i < 10; i++) {
          const sB = 582.6 + 1.2 * i, top = 1.00 + 0.30 * Math.sin(Math.PI * (i + 0.5) / 10), yL = fic.road(sB, _rb).y;
          fic.place(sB, lat, 0, _v);
          aheadB.kind = 3.2; aheadB.box(_v.x, yL + top / 2 - 1.2, _v.z, 1.23, top + 2.4, 0.64, STONE, 0.76 + 0.12 * lc(), ryA);
          aheadB.kind = 0; aheadB.box(_v.x, yL + top + 0.05, _v.z, 1.14 + 0.06 * lc(), 0.10, 0.78, '#A39A84', 0.88 + 0.22 * lc(), ryA, 0.04 * (lc() - 0.5));
        }
        for (const sP of [581.7, 594.3]) {
          const yL = fic.road(sP, _rb).y; fic.place(sP, lat, 0, _v);
          aheadB.kind = 3.2; aheadB.box(_v.x, yL - 0.4, _v.z, 0.80, 3.6, 0.84, STONE, 0.9, ryA);
          aheadB.kind = 0; aheadB.box(_v.x, yL + 1.46, _v.z, 0.92, 0.12, 0.96, '#A39A84', 0.98, ryA);
        }
      }
      // the fallen stones of the gap, lying in the grass on the field side
      for (let i = 0; i < 16; i++) {
        fic.place(GAP_S0 + GAP_LEN * lc(), LATR - 0.2 - 1.2 * lc() * lc(), 0, _v); const y0 = heightAt(_v.x, _v.z), sz = 0.16 + 0.22 * lc();
        aheadB.kind = 3.2; aheadB.box(_v.x, y0 + sz * 0.3, _v.z, sz * 1.5, sz * 0.8, sz, lc() < 0.3 ? '#A39A84' : STONE, 0.8 + 0.3 * lc(), 6.28 * lc(), 0.5 * (lc() - 0.5)); aheadB.kind = 0;
      }
      // the field gate, swung open into the meadow on its far post
      {
        const ang = 1.18, hinge = fic.place(GW1 - 0.1, LATL + 0.1, 0, new THREE.Vector3()), y0 = heightAt(hinge.x, hinge.z);
        const dx = Math.sin(_rd.h + Math.PI - ang), dz = Math.cos(_rd.h + Math.PI - ang), GL = 4.1;      // along the gate, from the hinge
        const ry = Math.atan2(-dz, dx);
        aheadB.kind = 4;
        for (let b = 0; b < 5; b++) aheadB.box(hinge.x + dx * GL / 2, y0 + 0.24 + b * 0.235, hinge.z + dz * GL / 2, GL, 0.08, 0.04, WOOD, 0.95 + 0.07 * b, ry);
        for (const t of [0.02, 0.5, 0.98]) aheadB.box(hinge.x + dx * GL * t, y0 + 0.72, hinge.z + dz * GL * t, 0.09, 1.16, 0.05, WOOD, 0.9, ry);
        aheadB.box(hinge.x + dx * GL / 2, y0 + 0.72, hinge.z + dz * GL / 2, GL * 1.03, 0.07, 0.03, WOOD, 0.85, ry, 0.23);
        // the finger post at the gateway: white paint, two arms
        const fp = fic.place(GW0 - POST_BACK, LATL + 1.25, 0, new THREE.Vector3()), yf = heightAt(fp.x, fp.z);
        aheadB.box(fp.x, yf + 1.12, fp.z, 0.12, 2.24, 0.12, TRIM, 0.80, 0.3);
        aheadB.box(fp.x + Math.sin(_rd.h) * 0.42, yf + 2.12, fp.z + Math.cos(_rd.h) * 0.42, 0.95, 0.17, 0.035, TRIM, 0.92, ryA);
        aheadB.box(fp.x + Math.cos(_rd.h) * 0.40, yf + 1.88, fp.z - Math.sin(_rd.h) * 0.52, 0.98, 0.17, 0.035, TRIM, 0.86, ryA + Math.PI / 2);
        aheadB.box(fp.x, yf + 2.27, fp.z, 0.17, 0.06, 0.17, '#43484A', 1, 0.3);
        aheadB.kind = 0;
      }
      // poles and wires going on with us
      for (let k = 0; k < 6; k++) {
        const s = 513 + 40 * k, p = fic.place(s, 6.6, 0, new THREE.Vector3()), y0 = heightAt(p.x, p.z), lean = 0.025 * n2(s * 0.3, 1.7);
        aheadB.kind = 4;
        aheadB.add(new THREE.CylinderGeometry(0.085, 0.125, 7.5, 8, 1, true), new THREE.Matrix4().makeTranslation(p.x, y0 + 3.75, p.z).multiply(new THREE.Matrix4().makeRotationZ(lean)), '#43484A', 1);
        aheadB.box(p.x, y0 + 6.9, p.z, 1.7, 0.11, 0.11, '#43484A', 1, _rd.h);
        aheadB.kind = 0;
        for (const o of [-0.75, 0, 0.75]) aheadB.add(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 6), new THREE.Matrix4().makeTranslation(p.x + Math.cos(_rd.h) * o, y0 + 7.0, p.z - Math.sin(_rd.h) * o), '#C8CCC6', 0.8);
        aheadTops.push([-0.75, 0, 0.75].map((o) => new THREE.Vector3(p.x + Math.cos(_rd.h) * o, y0 + 6.98, p.z - Math.sin(_rd.h) * o)));
      }
    }
    await ctx.yield();

    // THE HEDGE BANK of the road ahead: a hawthorn hedge on a low bank stands behind the left-hand wall, so that side of the
    // lane is closed, then opens at the gateway onto the field and the knoll. BOTH ITS ENDS, s 526 AND s 562, ARE THE LIVE
    // VERSION'S OWN TYPED NUMBERS: inherited, not derived from any place of the lane, kept byte for byte by the lead's
    // ruling and named for a later round (the lead's amendment of 07:48 sets "s 526 to 562"). The near end is written
    // below as GAP_S0 only because that name holds the same typed 526; the name is not a reason for the number. Its
    // height rises over 7 m at the near end and falls over 7 m at the far end (live's 526 to 533 and 555 to 562, written
    // with GAP_LEN, which holds the same typed 7). 36 m of hedge. 2.6 m of hedge on 0.9 m of bank: its top is above a kneeling child's eye and the
    // 0.9 m wall, well under the 4 to 7 m walls of the cutting; it is a field hedge, not a second cutting. Its ends fall away.
    // Its sprays have a bag of their own (spraysBk: one more draw call), so the hedge deals nothing from the sequence
    // that lays the sprays of the trees of the road ahead (spraysA), which are built after it.
    const tIA = [], tJA = [], spraysBk = makeSprays();
    const HEDGE_BK_S0 = GAP_S0, HEDGE_BK_S1 = 562;
    await hedgeRun(HEDGE_BK_S0, HEDGE_BK_S1, 1.25, 1, (sq) => 2.6 * (0.25 + 0.75 * ss(HEDGE_BK_S0, HEDGE_BK_S0 + GAP_LEN, sq) * (1 - ss(HEDGE_BK_S1 - GAP_LEN, HEDGE_BK_S1, sq))), () => 0.9, sidePt(() => 8.2), 0.72, leavesA, spraysBk, 7, tIA, tJA);
    W.add(tuftMesh(tIA, tJA));
    await ctx.yield();
    // THE FARM BY THE BRIDGE: other people's place, and plainly not the house we left. One long low range of bare field
    // stone under slate (a dwelling of two rooms at its far end, 7 m, and a barn of 11 m under the same roof), a barn
    // behind it and a byre, on the right of the lane just past the bridge (the farm's own origin 78 m beyond s 530 and 17 m
    // from the lane's axis, the range's middle 2.5 m further on; its front 14 m out, so nothing solid is within 6 m of the path and the wall and its verge run
    // on in front). It differs from home in every part a stranger reads: SHAPE, one storey 18 m long with eaves at 2.8 m
    // and the ridge at 5 m, where home stands 11 m wide and 7 m to the ridge; WALL, the field walls' own stone, no
    // limewash and no tarred foot; DOOR, a cart doorway 3 m wide and 2.5 m high standing dark in the barn's front, and no
    // door in the gate's blue; WINDOWS, three small panes at the dwelling end (0.6 by 0.8 m where home's is 1.0 by 1.3),
    // lit, steady and dimmer than home's one amber window. Its chimney pot stands on the ridge, with nothing rising from it. It is 95 m off when we first face forward
    // (s 513 to s 608) and we pass it: it leaves the frame's right edge as we come onto the bridge.
    const farmWin = [], FARM_A = fic.a300 + 230 + 78, FARM_B = -17;
    {
      const c0 = new THREE.Vector3(fic.gate.x + FARM_A * sf + FARM_B * cf, 0, fic.gate.z + FARM_A * cf - FARM_B * sf);
      // local x points back down the lane toward us (the gable end we see first), local z toward the lane (the front)
      const MF = new THREE.Matrix4().makeTranslation(c0.x, heightAt(c0.x, c0.z), c0.z).multiply(new THREE.Matrix4().makeRotationY(fic.hf + Math.PI / 2));
      const TL = (x, y, z) => MF.clone().multiply(new THREE.Matrix4().makeTranslation(x, y, z));
      const shed = (x, z, w, d, eave, ridge, hex, kind, k) => {
        aheadB.kind = kind; aheadB.add(new THREE.BoxGeometry(w, eave + 2, d), TL(x, eave / 2 - 1, z), hex, k);      // 2 m of wall below the floor: the ground falls toward the tarn
        for (const gx of [-w / 2, w / 2]) { const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, ridge - eave); sh.closePath();
          aheadB.add(new THREE.ShapeGeometry(sh), TL(x + gx, eave, z).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2)), hex, k * 1.06); }
        // the roof (flight round 2): the same two slopes in the same place, of the farm's own slate (kind 2.3: the slate's
        // courses, and the dusk sky lying on it), and sagging a little along the ridge as an old roof does: FARM_SAG of
        // the building's length at mid-length, nothing at the gables, nothing at the eaves (eight lengths, so it curves)
        aheadB.kind = 2.3; const slope = Math.atan2(ridge - eave, d / 2), rl = Math.hypot(ridge - eave, d / 2) + 0.5;
        for (const sg of [1, -1]) aheadB.add(new THREE.BoxGeometry(w + 0.7, 0.14, rl, 8, 1, 1), TL(x, (eave + ridge) / 2 - 0.08, z + sg * (d / 4 + 0.16)).multiply(new THREE.Matrix4().makeRotationX(sg * slope)), SLATE, 1, 0,
          (v) => { v.y -= farmSag(v.x, w) * (0.5 - sg * v.z / rl); });
        aheadB.kind = 0;
      };
      const FARM_SAG = 0.006, farmSag = (xl, w) => FARM_SAG * w * Math.max(0, 1 - (2 * xl / w) * (2 * xl / w));
      shed(-2.5, 0, 18, 6, 2.8, 5.0, STONE, 3, 0.80);                                                 // the long range: dwelling at the far end, barn toward us
      shed(-3, -17, 15, 7, 3.6, 6.0, STONE, 3, 0.80); shed(9, -12, 7, 5, 2.6, 4.2, STONE, 3, 0.74);      // barn behind; byre nearer us
      aheadB.kind = 3; aheadB.add(new THREE.BoxGeometry(0.9, 1.4, 0.8), TL(-10.4, 5.3, 0), STONE, 0.74); aheadB.kind = 0;      // the chimney, in stone, on the ridge over the dwelling's far room
      aheadB.add(new THREE.BoxGeometry(1.02, 0.10, 0.92), TL(-10.4, 6.05, 0), STONE, 0.9);
      // the barn's cart doorway: an opening into the dark of the barn, 3 m wide and 2.5 m high, in the middle of the
      // barn's 11 m, under one long lintel stone. What shows in it is the barn's far wall, the same stone in a third of
      // the light (the brief's shade is "never grey or black": at the first tone tried, #34454F at 0.55, it rendered 0, 0, 0)
      aheadB.add(new THREE.BoxGeometry(3.0, 2.5, 0.06), TL(1.0, 1.25, 3.02), STONE, 0.30);
      aheadB.add(new THREE.BoxGeometry(3.7, 0.30, 0.10), TL(1.0, 2.65, 3.03), '#A39A84', 0.9);
      // windows: [x, y of the pane's middle] in the front wall of the dwelling, one to a room and one by the hearth; three,
      // every one lit. Panes 0.6 m by 0.8 m (home's window is 1.0 by 1.3), under a lintel stone each.
      const _w = new THREE.Vector3();
      for (const [wx, wy] of [[-5.9, 1.5], [-8.0, 1.5], [-10.1, 1.5]]) {
        for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { _w.set(wx + cx * 0.30, wy + cy * 0.40, 3.03).applyMatrix4(MF); farmWin.push(_w.x, _w.y, _w.z, cx, cy); }
        aheadB.add(new THREE.BoxGeometry(0.9, 0.16, 0.08), TL(wx, wy + 0.48, 3.02), '#A39A84', 0.9);
      }
      // WHAT A STONE FARM'S WALLS AND ROOFS HAVE (flight round 2; strangers called the three buildings dark flat blocks).
      // Nothing is moved or resized and the three lit panes are untouched; these are added, all in the dressed buff stone
      // of the walls' copes (BUFF), a little under the rubble's own light so nothing here is pale:
      const WOOD = '#7A7468';      // the weathered wood of the lane's gate and posts
      const BUFF = '#A39A84', RZm = (a) => new THREE.Matrix4().makeRotationZ(a), RYm = (a) => new THREE.Matrix4().makeRotationY(a);
      const FARM = [[-2.5, 0, 18, 6, 2.8, 5.0], [-3, -17, 15, 7, 3.6, 6.0], [9, -12, 7, 5, 2.6, 4.2]];      // the three sheds as built above: x, z, length, depth, eaves, ridge
      const gy = (x, z) => { _w.set(x, 0, z).applyMatrix4(MF); return heightAt(_w.x, _w.z) - MF.elements[13]; };      // the ground under a place of the farm, from the farm's own floor
      for (let bi = 0; bi < FARM.length; bi++) {
        const [x, z, w, d, eave, ridge] = FARM[bi], slope = Math.atan2(ridge - eave, d / 2), rl = Math.hypot(ridge - eave, d / 2) + 0.5;
        // a ridge of stone: saddle stones about 0.6 m long laid along the apex (a 2 cm joint between each), following the
        // sag. The ridge runs from the outer edge of one verge cope to the outer edge of the other (the copes' middles
        // stand 0.20 m beyond each gable and they are 0.32 m wide: RIDGE_L = w + 2 * (0.20 + 0.16)), and the COUNT of
        // stones is fitted to that length (the whole number nearest RIDGE_L / 0.62), so the last stone ends at the
        // verge and none overruns the gable (run c: stones were laid every 0.62 m from one end with no fitting, and the
        // last one hung past the gable that faces the car on all three roofs)
        const RIDGE_L = w + 2 * (0.20 + 0.16), ridgeN = Math.round(RIDGE_L / 0.62), ridgeP = RIDGE_L / ridgeN;
        for (let ri = 0; ri < ridgeN; ri++) {
          const xm = -RIDGE_L / 2 + (ri + 0.5) * ridgeP, hsh = n2(xm * 1.3 + bi * 9.1, 4.7);
          aheadB.add(new THREE.BoxGeometry(ridgeP - 0.02, 0.15, 0.32), TL(x + xm, ridge + 0.02 - farmSag(xm, w), z).multiply(RZm(0.03 * hsh)), BUFF, 0.62 + 0.08 * hsh);
        }
        // verges: a line of flat coping stones up each edge of each gable, 0.32 m wide, standing 4 cm proud of the slates
        for (const gx of [-(w / 2 + 0.20), w / 2 + 0.20]) for (const sg of [1, -1])
          aheadB.add(new THREE.BoxGeometry(0.32, 0.10, rl), TL(x + gx, (eave + ridge) / 2 - 0.08 + 0.11, z + sg * (d / 4 + 0.16)).multiply(new THREE.Matrix4().makeRotationX(sg * slope)), BUFF, 0.66);
        // quoins: larger dressed stones at the four corners, courses 0.42 m tall, long and short faces turn about, 3 cm proud
        for (const cxs of [-1, 1]) for (const czs of [-1, 1]) for (let j = 0, y = -0.4; y < eave - 0.05; j++, y += 0.42) {
          const lx = j % 2 ? 0.52 : 0.28, lz = j % 2 ? 0.28 : 0.52, hh = Math.min(0.41, eave - y), hsh = n2(j * 1.7 + bi * 5.3, cxs * 3.1 + czs * 1.3);
          aheadB.add(new THREE.BoxGeometry(lx, hh, lz), TL(x + cxs * (w / 2 + 0.03 - lx / 2), y + hh / 2, z + czs * (d / 2 + 0.03 - lz / 2)), BUFF, 0.66 + 0.10 * hsh);
        }
        if (bi === 0) await ctx.yield();
      }
      // the three windows: a sill stone that throws the wet clear of the wall (16 cm out) and a dressed jamb stone each
      // side, its face in the pane's own plane (3 cm out from the wall). Repair: the jambs stood 6 cm in front of the
      // panes, and the lane sees this wall at 8 to 18 degrees, so the near jamb covered most of each lit pane; flush,
      // a jamb covers nothing from anywhere, and the panes show as they did (the sill lies under the pane and under the eye).
      for (const [wx, wy] of [[-5.9, 1.5], [-8.0, 1.5], [-10.1, 1.5]]) {
        aheadB.add(new THREE.BoxGeometry(0.92, 0.09, 0.20), TL(wx, wy - 0.445, 3.07), BUFF, 0.80);
        for (const jx of [-1, 1]) aheadB.add(new THREE.BoxGeometry(0.13, 0.80, 0.06), TL(wx + jx * 0.365, wy, 3.00), BUFF, 0.70);
      }
      // the cart doorway: a pier of three dressed stones each side (wide and narrow turn about), and one plank leaf of its
      // door hooked back flat against the wall on the far jamb, its ledged inside face outward: the mouth beside it is an
      // opening. Repair: the leaf stood 105 degrees open, 1.4 m out from the wall, in the lane's sight line to all three
      // lit panes; folded back it stands 0.2 m out (outside the pier's 0.11 m), and a sight line from the lane to the
      // nearest pane passes 0.5 m out at the leaf's far edge, more from nearer by.
      for (const jx of [-1, 1]) for (let j = 0; j < 3; j++) { const wj = j % 2 ? 0.30 : 0.42; aheadB.add(new THREE.BoxGeometry(wj, 0.82, 0.14), TL(1.0 + jx * (1.5 + wj / 2), 0.42 + 0.835 * j, 3.04), BUFF, 0.66 + 0.05 * j); }
      {
        const LW = 1.45, hx = -0.5, hz = 3.145, ML = TL(hx - LW / 2, 1.17, hz);      // hz: the pier's face (3.11) and half the leaf's 0.05 m, with 1 cm of air
        aheadB.kind = 4; aheadB.add(new THREE.BoxGeometry(LW, 2.30, 0.05), ML, WOOD, 0.80);
        for (const ly of [-0.75, 0.75]) aheadB.add(new THREE.BoxGeometry(LW - 0.1, 0.13, 0.03), ML.clone().multiply(new THREE.Matrix4().makeTranslation(0, ly, 0.04)), WOOD, 0.95);
        aheadB.kind = 0;
      }
      // the yard wall: from the range's near front corner to its gateway, dry stone 0.9 m high in 1.2 m lengths with
      // copes on edge like the lane's walls; the gateway 3 m clear (a cart's width and a half: the 2.9 m gate and 0.05 m
      // of play at its hinge and at its latch) between two stone stoops 3.5 m apart middle to middle, so the gate that
      // hangs on the stoop nearer the lane could shut against the other (the lead's mend B5: the opening was 2.5 m clear
      // and the gate 2.9 m). The stoop nearer the lane stands where it stood, 1.5 m beyond the point halfway between
      // the range's front and the lane's own wall (Z1); the other stoop and the wall's end moved half a metre toward
      // the range. The five-bar gate stands open into the yard. Repair: the wall ran on from the gateway to the lane's wall, a built thing touching the lane; it ends
      // at the gateway now, and the stoop nearest the lane stands 7.75 m from the lane's middle, 3.5 m inside its wall
      // (the farm's own rule above: nothing solid within 6 m of the path). It stands 11 m beyond the last of the beck's
      // water (the reach beside the lane ends at the bridge), so it stands in front of no water.
      {
        const GL = 2.9, YX = 6.5 - 0.26, Z0 = 3.0, Z1 = 12.5, GZ1 = (Z0 + Z1) / 2 + 1.5, GZ0 = GZ1 - (GL + 2 * 0.05 + 0.50);      // the stoop nearer the lane stands where it stood; the other is set off from it by the gate's length, 0.05 m of play at the hinge and at the latch, and one stoop's depth (two halves, 0.50 m)
        for (const [za, zb] of [[Z0, GZ0]]) for (let zz = za, i = 0; zz < zb - 0.2; zz += 1.2, i++) {
          const L = Math.min(1.2, zb - zz), zm = zz + L / 2, y0 = gy(YX, zm), hB = 0.80 + 0.06 * n2(zm * 0.9, 6.6);
          aheadB.kind = 3; aheadB.add(new THREE.BoxGeometry(0.52, hB + 0.8, L + 0.03), TL(YX, y0 + hB / 2 - 0.4, zm), STONE, 0.74 + 0.06 * n2(zm * 2.3, 1.1)); aheadB.kind = 0;
          for (let t = 0.02, q = 0; t < L - 0.05; q++) {
            const hs = 0.5 + 0.5 * n2(zm * 3.1 + q * 1.7, 8.2), cw = Math.min(L - t, 0.19 + 0.16 * hs), ch = 0.20 + 0.07 * (1 - hs);
            aheadB.add(new THREE.BoxGeometry(0.48, ch, cw), TL(YX, y0 + hB + ch / 2 - 0.03, zz + t + cw / 2).multiply(RYm(0.12 * (hs - 0.5))), hs < 0.3 ? BUFF : STONE, 0.84 + 0.30 * hs);
            t += cw + 0.004;
          }
        }
        for (const zs of [GZ0, GZ1]) { const y0 = gy(YX, zs); aheadB.kind = 3; aheadB.add(new THREE.BoxGeometry(0.56, 1.42, 0.50), TL(YX, y0 + 0.66, zs), STONE, 0.9); aheadB.kind = 0; aheadB.add(new THREE.BoxGeometry(0.66, 0.12, 0.60), TL(YX, y0 + 1.42, zs), BUFF, 0.95); }
        const GA = 70 * Math.PI / 180, y0 = gy(YX, GZ1), MG = TL(YX - Math.sin(GA) * GL / 2, y0, GZ1 - 0.3 - Math.cos(GA) * GL / 2).multiply(RYm(Math.PI / 2 + GA));      // the bars lie along the line the gate's middle is placed on, from its hinge: (-sin GA, -cos GA)
        aheadB.kind = 4;
        for (let b = 0; b < 5; b++) aheadB.add(new THREE.BoxGeometry(GL, 0.08, 0.04), MG.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.24 + b * 0.235, 0)), WOOD, 0.95 + 0.07 * b);
        for (const t of [-0.48, 0, 0.48]) aheadB.add(new THREE.BoxGeometry(0.09, 1.16, 0.05), MG.clone().multiply(new THREE.Matrix4().makeTranslation(GL * t, 0.72, 0)), WOOD, 0.9);
        aheadB.kind = 0;
      }
    }
    await ctx.yield();

    // seven single ashes, one at a time: a trunk, a few limbs, and a tall open crown of leaf pads
    const treeRng = rng.fork ? rng.fork('ash') : rng;      // (the ashes' stations, ashS, are declared above the field rows, which read the first of them)
    const _qd = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _dv = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
    let limbBag = built;
    const limb = (A, B, r0, r1, hex, k) => {
      _dv.subVectors(B, A); const len = _dv.length(); _qd.setFromUnitVectors(_up, _dv.normalize());
      limbBag.add(new THREE.CylinderGeometry(r1, r0, len, 7, 1, true), new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), _qd, _one), hex, k);
    };
    built.kind = 4;
    // the road ahead: [s, metres to the car's left, height, pads, sprays per pad]. Four ashes that pass, thorns by the wall, a clump on the knoll.
    const AHEAD_TREES = [[541, -10.5, 10.2, 15, 26], [586, 11.5, 11.6, 15, 26], [629, -9.0, 9.4, 15, 26], [671, 8.5, 10.8, 10, 14],
      [557, 5.7, 4.2, 6, 14], [606, -5.9, 3.6, 6, 14], [652, -6.2, 4.4, 6, 12], [697, -7.5, 9.5, 9, 12],
      [628, 80, 9.5, 8, 12], [641, 94, 11.5, 8, 12], [620, 99, 8, 7, 10],
      [632, 5.3, 12.0, 15, 26, 0.62], [633.6, -5.4, 11.4, 15, 26, 0.62],      // these two arch over the lane at the ring
      // the hollow (seen through the side windows as the head turns): one hawthorn on the lip of the bank, 3 m beyond the
      // fence and 8 m short of where the field wall leaves it, 4.6 m tall as a field thorn is, twelve small pads so it is
      // a dense crown and not loose balls, thirty sprays to a pad (it passes 10 m from the glass, where a pad with fewer shows as a smooth lump), leaned 1.6 m by the wind the way a thorn on a brow grows; an ash 9 m tall on the beck's far bank at s 474: its place is the beck's own line there (beckB at aF -56) and 5.5 m beyond it, clear of the water (up to 2.8 m from its middle) and its rushes (2.6 m more)
      [458, -9.4, 4.6, 12, 30, 1, 1.6], [474, beckB(474 - 530) - 5.5, 9.0, 9, 12],
      // two ashes behind the farm by the bridge, 40 m off the lane: its slate is read against their dark
      [601, -40, 10.5, 10, 14], [615, -45, 11.5, 10, 14]];
    let xh = 0.3719; const xr = Object.assign(() => (xh = (xh * 9301.17 + 0.2113) % 1), { range: (a, b) => a + (b - a) * xr() });
    for (let i = 0; i < ashS.length + AHEAD_TREES.length; i++) {
      const ex = i >= ashS.length ? AHEAD_TREES[i - ashS.length] : null, tr = ex ? xr : treeRng, hs = ex ? Math.max(0.5, ex[2] / 10.5) : 1;
      const s = ex ? ex[0] : ashS[i], onBank = !ex && s >= S_HEDGE0 && s < 170, far = !!ex || s < S_HEDGE0 || !onBank;       // the last two stand across the lane, beyond the poles
      const H = ex ? ex[2] : treeRng.range(9, 12), p = fic.place(s, ex ? ex[1] : far ? (s < S_HEDGE0 ? 7.4 : 10.5) : -(3.9 + bankRight(s) * BANK_SLOPE), 0, new THREE.Vector3());
      const y0 = heightAt(p.x, p.z) + (far ? 0 : bankRight(s)), ph = tr.range(0, 50), R = H * 0.27;
      const lv = ex ? leavesA : onBank ? leavesT : leaves, spr = ex ? spraysA : onBank ? spraysT : sprays; limbBag = ex ? aheadB : onBank ? builtT : built; limbBag.kind = 4;
      const base = new THREE.Vector3(p.x, y0 - 0.2, p.z), fork = new THREE.Vector3(p.x + tr.range(-0.3, 0.3), y0 + H * 0.40, p.z + tr.range(-0.3, 0.3));
      limb(base, fork, 0.27 * hs, 0.17 * hs, '#4A4E4C', 1);
      if (!ex) ashFoot.push(base);      // where each of the seven ashes stands (read by the hay cocks below)
      const pads = ex ? ex[3] : 15, nSpr = ex ? ex[4] : 26;
      for (let b = 0; b < pads; b++) {
        const t = 0.40 + 0.60 * (b + tr()) / pads, ang = b * 2.4 + tr.range(-0.5, 0.5);
        const env = Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.30) / 0.72)), 0.75), rad = R * env * (b === pads - 1 ? 0.1 : tr.range(0.45, 1.0));
        const c = new THREE.Vector3(p.x + Math.cos(ang) * rad, y0 + H * t, p.z + Math.sin(ang) * rad);
        if (ex && ex[6]) { c.x += ex[6] * t * t * WIND.x; c.z += ex[6] * t * t * WIND.z; c.y -= 0.25 * ex[6] * t * t; }      // a wind-leaned crown: carried down the wind, more the higher
        const sz = (0.95 + 0.9 * env) * tr.range(0.8, 1.2) * (H / 10.5);
        if (b % 3 === 2) await ctx.yield();
        if (b % 3 === 0 || b === pads - 1) limb(fork, c, 0.12 * hs, 0.035, '#4A4E4C', 0.9);
        const m = new THREE.Matrix4().makeTranslation(c.x, c.y, c.z).multiply(new THREE.Matrix4().makeRotationY(ang)).multiply(new THREE.Matrix4().makeScale(sz * 1.15, sz * 0.72, sz));
        const n0 = lv.P.length;
        lv.add(new THREE.IcosahedronGeometry(1, 1), m, DARKHEX, (0.75 + 0.4 * t) * (0.9 + 0.2 * tr()) * (ex && ex[5] ? ex[5] : 1), 1,
          (v) => v.multiplyScalar(0.74 * (1 + 0.30 * n2(v.x * 1.9 + ph + b, v.y * 1.9 + v.z * 1.7))));
        for (let j = n0; j < lv.P.length; j += 3) {              // light the pad as part of one crown, not as a boulder
          _n3.set(lv.P[j] - p.x, (lv.P[j + 1] - (y0 + H * 0.62)) * 1.2 + 0.6, lv.P[j + 2] - p.z).normalize();
          _c3.set(lv.Nn[j], lv.Nn[j + 1], lv.Nn[j + 2]).multiplyScalar(0.45).addScaledVector(_n3, 0.55).normalize();
          lv.Nn[j] = _c3.x; lv.Nn[j + 1] = _c3.y; lv.Nn[j + 2] = _c3.z;
        }
        for (let q = 0; q < nSpr; q++) {                                // the leaves themselves: sprays all over the pad, thickest on top and outside
          const th = tr.range(0, Math.PI * 2), cy = tr.range(-0.55, 1), sr = Math.sqrt(1 - cy * cy * 0.9), rr = tr.range(0.85, 1.2);
          _n3.set(Math.cos(th) * sr, cy, Math.sin(th) * sr);
          _c3.set(_n3.x * sz * 1.15 * rr, _n3.y * sz * 0.72 * rr, _n3.z * sz * rr).applyAxisAngle(_up, -ang).add(c);
          _n3.set(_c3.x - p.x, (_c3.y - (y0 + H * 0.62)) * 1.2 + 0.6, _c3.z - p.z).normalize();
          spr.add(_c3, _n3, tr.range(1.1, 1.8) * Math.min(1, hs * 1.25), DARKHEX, (0.95 + 0.55 * t) * tr.range(0.85, 1.25));
        }
      }
      await ctx.yield();
    }
    built.kind = 0;
    // ===== FLIGHT3 (round "the brow and the turn"): TWO THINGS ADDED TO THE CAST, each in its own lines =====
    // Both are still geometry in live's own three bags of the road ahead (aheadB, leavesA, spraysA), built after live's
    // last tree: no new mesh, material, uniform or key. Their vertex stage is live's (VERT_TAIL), so on the brow they
    // move exactly as the ground under them moves and no other way. They read nothing of the eye, the lens or the clock.
    {
      // THE NEW TREES' OWN GENERATOR: a hash of the tree's own index k and of that tree's own count of draws j. No live
      // stream (xr, treeRng, rng, the walls' lc and fc, the spray bags' layout sequences) is read, moved or burnt.
      const ownRng = (k) => { let j = 0; const f = () => { const x = Math.sin(k * 127.1 + (j++) * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); }; return Object.assign(f, { range: (a, b) => a + (b - a) * f() }); };
      // one tree by live's own recipe (the loop above, term for term, as it runs for a tree of the road ahead), dealt
      // from tr: its foot (x, z; y is the ground's), height, pads, sprays to a pad, metres its top is carried down the wind
      const icoG = new THREE.IcosahedronGeometry(1, 1), icoP = Array.from(icoG.attributes.position.array), padN = new THREE.Matrix3(), padC = new THREE.Color(); icoG.dispose();
      // (the mend a2: "stout" is an ash grown in the open wind: its trunk H / 14 across at the foot where live's law
      // gives H / 19.5, live's own taper to the fork, limbs half the foot's radius at the fork, and a flared foot: one
      // more ring of the same mesh. Without it, as for the thorns, every term is live's.)
      const newTree = async (tr, px, pz, H, pads, nSpr, lean, stout = false) => {
        const hs = Math.max(0.5, H / 10.5), y0 = heightAt(px, pz), ph = tr.range(0, 50), R = H * 0.27;
        const rFoot = stout ? H / 28 : 0.27 * hs, rFork = stout ? rFoot * 0.17 / 0.27 : 0.17 * hs, rLimb = stout ? rFoot / 2 : 0.12 * hs;
        // a lower ash's pads are smaller (pad size x H / 10.5, card size x min(1, 1.25 hs)): it carries the sprays that
        // cover its smaller pad as thickly as the given figure covers the pad of a 10.5 m ash (a rule of the tree; reads no draw)
        if (stout) { const cs = Math.min(1, hs * 1.25), hp = H / 10.5; nSpr = Math.round(nSpr * hp * hp / (cs * cs)); }
        limbBag = aheadB; aheadB.kind = 4;
        const base = new THREE.Vector3(px, y0 - 0.2, pz), fork = new THREE.Vector3(px + tr.range(-0.3, 0.3) + lean * 0.16 * WIND.x, y0 + H * 0.40 - 0.25 * lean * 0.16, pz + tr.range(-0.3, 0.3) + lean * 0.16 * WIND.z);      // the fork rides the crown's own lean (t 0.40: 0.16 of it)
        limb(base, fork, rFoot, rFork, '#4A4E4C', 1);
        if (stout) {      // the flared foot: from 1.5 foot radii at the base to the trunk's own radius two trunk widths (4 foot radii) up it, where a buttress runs out
          const tf = Math.min(1, 4 * rFoot / base.distanceTo(fork));
          limb(base, base.clone().lerp(fork, tf), 1.5 * rFoot, rFoot + (rFork - rFoot) * tf, '#4A4E4C', 1);
        }
        for (let b = 0; b < pads; b++) {
          const t = 0.40 + 0.60 * (b + tr()) / pads, ang = b * 2.4 + tr.range(-0.5, 0.5);
          const env = Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.30) / 0.72)), 0.75), rad = R * env * (b === pads - 1 ? 0.1 : tr.range(0.45, 1.0));
          const c = new THREE.Vector3(px + Math.cos(ang) * rad + lean * t * t * WIND.x, y0 + H * t - 0.25 * lean * t * t, pz + Math.sin(ang) * rad + lean * t * t * WIND.z);
          const sz = (0.95 + 0.9 * env) * tr.range(0.8, 1.2) * (H / 10.5);
          if (b % 3 === 2) await ctx.yield();
          if (b % 3 === 0 || b === pads - 1) limb(fork, c, rLimb, 0.035, '#4A4E4C', 0.9);
          const m = new THREE.Matrix4().makeTranslation(c.x, c.y, c.z).multiply(new THREE.Matrix4().makeRotationY(ang)).multiply(new THREE.Matrix4().makeScale(sz * 1.15, sz * 0.72, sz));
          // (A COPY, named as one by the owner's word of 8 October 05:09: these lines copy the leaf bag's own add(), lines 792 to
          // 800 above, term for term over one kept unit icosahedron; the next round that touches these trees makes it a call)
          padN.getNormalMatrix(m); padC.set(DARKHEX).multiplyScalar((0.75 + 0.4 * t) * (0.9 + 0.2 * tr()));
          for (let j = 0; j < icoP.length; j += 3) {
            _c3.set(icoP[j], icoP[j + 1], icoP[j + 2]); _n3.copy(_c3).applyMatrix3(padN).normalize();
            _c3.multiplyScalar(0.74 * (1 + 0.30 * n2(_c3.x * 1.9 + ph + b, _c3.y * 1.9 + _c3.z * 1.7))).applyMatrix4(m);
            // lit as part of one crown, as live's pads are (0.45 of the pad's own normal, 0.55 of the crown's outward one), in the same pass
            _dv.set(_c3.x - px, (_c3.y - (y0 + H * 0.62)) * 1.2 + 0.6, _c3.z - pz).normalize();
            _n3.multiplyScalar(0.45).addScaledVector(_dv, 0.55).normalize();
            leavesA.P.push(_c3.x, _c3.y, _c3.z); leavesA.Nn.push(_n3.x, _n3.y, _n3.z); leavesA.C.push(padC.r, padC.g, padC.b); leavesA.Sw.push(1);
          }
          for (let q = 0; q < nSpr; q++) {
            const th = tr.range(0, Math.PI * 2), cy = tr.range(-0.55, 1), sr = Math.sqrt(1 - cy * cy * 0.9), rr = tr.range(0.85, 1.2);
            _n3.set(Math.cos(th) * sr, cy, Math.sin(th) * sr);
            _c3.set(_n3.x * sz * 1.15 * rr, _n3.y * sz * 0.72 * rr, _n3.z * sz * rr).applyAxisAngle(_up, -ang).add(c);
            _n3.set(_c3.x - px, (_c3.y - (y0 + H * 0.62)) * 1.2 + 0.6, _c3.z - pz).normalize();
            spraysA.add(_c3, _n3, tr.range(1.1, 1.8) * Math.min(1, hs * 1.25), DARKHEX, (0.95 + 0.55 * t) * tr.range(0.85, 1.25), 0, 1, tr);      // the card's tilt from the tree's own generator too
          }
        }
        aheadB.kind = 0;
        await ctx.yield();
      };
      // FLIGHT3-THING-ONE-BEGIN  THE CLUMP ON THE BROW: five wind-leaned ashes (a bare clump; no wall), on the car's
      // afterglow side abreast of the crest. It is part of the brow's ground (the lead's ruling): in live's bags, whose
      // vertex stage carries the ground's own field, and nowhere else.
      {
        // the crest station, read from the hill table through live's road(): the highest station of the lane (the table's own step, 0.5 m)
        let sC = 300, yC = -1e9;
        for (let s = 300; s <= 460; s += 0.5) { const y = fic.road(s, _rd).y; if (y > yC) { yC = y; sC = s; } }
        // 19 m to the car's right of the lane's middle (the mend a2: the ring wall that stood round it is taken out: a bare clump on the crest)
        const RING_LAT = -19, ringC = fic.place(sC, RING_LAT, 0, new THREE.Vector3());
        // five wind-cut ashes 7 to 10 m (the mend a2; they were 9 to 13: the same draw of each tree's own hash, so the
        // order of sizes is kept), stout (see newTree): feet on a circle of 3.4 m (72 degrees apart, turned up to 14
        // degrees and shifted up to 0.7 m by the tree's own hash); crowns 1.9 to 2.7 m in radius by live's 0.27 H; 15
        // pads as live's ashes that pass the car, and the sprays that cover them as live's 26 cover a 10.5 m ash's; each
        // leaned down live's WIND by the thorn's own lean per metre of height (the thorn: 1.6 m at 4.6 m)
        for (let k = 0; k < 5; k++) {
          const tr = ownRng(k), ang = k * 2 * Math.PI / 5 + tr.range(-0.245, 0.245), rad = 3.4 + tr.range(-0.7, 0.7), H = tr.range(7, 10);
          await newTree(tr, ringC.x + Math.cos(ang) * rad, ringC.z + Math.sin(ang) * rad, H, 15, 26, 1.6 * H / 4.6, true);
        }
      }
      // FLIGHT3-THING-ONE-END
      // FLIGHT3-THING-TWO-BEGIN  THE STAND ON THE HOLLOW'S BANK: five ashes and two thorns on the afterglow side, on the bank
      // between the fence and the beck, 28 to 45 m from the lane's middle, from where the hollow opens (s 425) to s 450.
      // Live's thorn (s 458), the ash at s 474, the field wall (s 466) and the beck's water stand clear of them.
      {
        const STAND_S0 = 425, STAND_S1 = 450, STAND_L0 = 28, STAND_L1 = 45, NS = 7, st = [], turn = ownRng(12)();
        for (let i = 0; i < NS; i++) {
          // one to each seventh of the 25 m, shifted inside its own seventh (no row); the golden step across the bank's
          // 17 m puts neighbours along the lane far apart across it (no pair)
          const tr = ownRng(5 + i), s = STAND_S0 + (STAND_S1 - STAND_S0) * (i + 0.5 + 0.6 * (tr() - 0.5)) / NS, f = i * 0.618 + turn;
          st.push({ tr, s, lat: STAND_L0 + (STAND_L1 - STAND_L0) * (f - Math.floor(f)) });
        }
        // the two whose feet are nearest the lane are the thorns: a thorn grows on the bank's upper edge, as live's does,
        // and a 4 m crown behind a 12 m one would not be seen. They lean as live's thorn leans; the ashes stand in the hollow's lee.
        const byLat = st.map((o) => o.lat).sort((p, q) => p - q), thornLat = byLat[1];
        for (const o of st) {
          const thorn = o.lat <= thornLat, H = thorn ? o.tr.range(3.6, 4.4) : o.tr.range(7, 10), p = fic.place(o.s, -o.lat, 0, _v);      // (the mend a2: the ashes 7 to 10 m and stout; they were 10 to 13; the thorns as they were)
          await newTree(o.tr, p.x, p.z, H, thorn ? 10 : 12, 16, thorn ? 1.6 * H / 4.6 : 0, !thorn);
        }
      }
      // FLIGHT3-THING-TWO-END
    }
    // ===== FLIGHT3 ends =====
    // the hay cocks are set up (their places were listed with the field rows): NO COCK STANDS UNDER A TREE. The mower
    // leaves the ground under a tree: an ash's roots stand proud of the turf to about 2 m from its trunk and the blade
    // is turned away there, and a cock's own foot is up to 0.9 m across the half (0.80 m at a scale of up to 1.15), so
    // a cock whose place lies within HAY_CLEAR 3 m of any of the seven ashes' feet is left out. Nothing is shifted and
    // nothing is dealt anew: the other cocks stand exactly where their places put them. One lathe is made and used for
    // every cock (the bag copies it out; it was made anew thirty-six times), and its top band runs to a point (it ran
    // to a 2 cm ring), so the six triangles that would close that ring have no area and are not built.
    {
      const HAY_CLEAR = 3, prof = [new THREE.Vector2(0.80, 0), new THREE.Vector2(0.72, 0.50), new THREE.Vector2(0.45, 0.98), new THREE.Vector2(0, 1.30)];
      const HAY = '#' + new THREE.Color(pal.seedhead).lerp(new THREE.Color(pal.meadow), 2 / 3).getHexString(), cockG = new THREE.BufferGeometry();
      {
        const L = new THREE.LatheGeometry(prof, 6).toNonIndexed(), lp = L.attributes.position.array, ln = L.attributes.normal.array, kp = [], kn = [], e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
        for (let t = 0; t < lp.length; t += 9) {
          e1.set(lp[t + 3] - lp[t], lp[t + 4] - lp[t + 1], lp[t + 5] - lp[t + 2]); e2.set(lp[t + 6] - lp[t], lp[t + 7] - lp[t + 1], lp[t + 8] - lp[t + 2]);
          if (e1.cross(e2).lengthSq() > 1e-10) for (let q = 0; q < 9; q++) { kp.push(lp[t + q]); kn.push(ln[t + q]); }
        }
        cockG.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); cockG.setAttribute('normal', new THREE.Float32BufferAttribute(kn, 3)); L.dispose();
      }
      for (const c of hayCocks) {
        if (ashFoot.some((f) => Math.hypot(f.x - c.x, f.z - c.z) < HAY_CLEAR)) continue;
        built.add(cockG, new THREE.Matrix4().makeTranslation(c.x, heightAt(c.x, c.z) - 0.04, c.z).multiply(new THREE.Matrix4().makeRotationY(c.ry)).multiply(new THREE.Matrix4().makeScale(c.sc, c.sc, c.sc)), HAY, c.k);
      }
      await ctx.yield();
    }

    // eight telegraph poles on the other side, and their three wires
    const wireP = [], wireO = [], wireUV = [], wireIX = [], tops = [];
    for (let k = 0; k < 6; k++) {
      const s = 10 + 40 * k, p = fic.place(s, 5.0 + bankLeft(s) * 0.2, 0, new THREE.Vector3()), y0 = heightAt(p.x, p.z);
      fic.road(s, _rd);
      built.kind = 4;
      built.add(new THREE.CylinderGeometry(0.085, 0.125, 7.5, 8, 1, true), new THREE.Matrix4().makeTranslation(p.x, y0 + 3.75, p.z), '#43484A', 1);
      built.kind = 4;
      built.box(p.x, y0 + 6.9, p.z, 1.7, 0.11, 0.11, '#43484A', 1, -_rd.h);
      built.kind = 0;
      for (const o of [-0.75, 0, 0.75]) built.add(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 6), new THREE.Matrix4().makeTranslation(p.x + Math.cos(_rd.h) * o, y0 + 7.0, p.z - Math.sin(_rd.h) * o), '#C8CCC6', 0.8);
      tops.push([-0.75, 0, 0.75].map((o) => new THREE.Vector3(p.x + Math.cos(_rd.h) * o, y0 + 6.98, p.z - Math.sin(_rd.h) * o)));
    }
    tops.unshift([new THREE.Vector3(-11.3, 6.3, -22.2), new THREE.Vector3(-11.0, 6.5, -22.2), new THREE.Vector3(-10.7, 6.3, -22.2)]);   // the house end
    const a3 = new THREE.Vector3(), b3 = new THREE.Vector3();
    for (const tp of [tops, aheadTops]) for (let k = 0; k < tp.length - 1; k++) for (let w = 0; w < 3; w++) {
      const A = tp[k][w], B = tp[k + 1][w], SEG = 10, sag = 0.022 * A.distanceTo(B);
      for (let i = 0; i < SEG; i++) {
        const t0 = i / SEG, t1 = (i + 1) / SEG;
        a3.lerpVectors(A, B, t0); a3.y -= sag * 4 * t0 * (1 - t0); b3.lerpVectors(A, B, t1); b3.y -= sag * 4 * t1 * (1 - t1);
        const base = wireP.length / 3;
        wireP.push(a3.x, a3.y, a3.z, a3.x, a3.y, a3.z, b3.x, b3.y, b3.z, b3.x, b3.y, b3.z);
        wireO.push(b3.x, b3.y, b3.z, b3.x, b3.y, b3.z, a3.x, a3.y, a3.z, a3.x, a3.y, a3.z);
        wireUV.push(1, 0, -1, 0, -1, 1, 1, 1);
        wireIX.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }
    const wireSeg = (A, B) => {
      const base = wireP.length / 3;
      wireP.push(A.x, A.y, A.z, A.x, A.y, A.z, B.x, B.y, B.z, B.x, B.y, B.z); wireO.push(B.x, B.y, B.z, B.x, B.y, B.z, A.x, A.y, A.z, A.x, A.y, A.z);
      wireUV.push(1, 0, -1, 0, -1, 1, 1, 1); wireIX.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    };
    for (let k = 0; k < fenceTops.length - 1; k++) for (let w = 0; w < 2; w++) wireSeg(fenceTops[k][w], fenceTops[k + 1][w]);
    for (let k = 0; k < fenceTops2.length - 1; k++) if (fenceTops2[k] && fenceTops2[k + 1]) for (let w = 0; w < 2; w++) wireSeg(fenceTops2[k][w], fenceTops2[k + 1][w]);
    await ctx.yield();
    W.add(leaves.mesh(folMat));
    await ctx.yield();
    const sprayMat = sprayMaterial(shared); W.add(sprays.mesh(sprayMat));
    await ctx.yield();
    W.add(leavesA.mesh(folMat)); await ctx.yield(); W.add(spraysA.mesh(sprayMat)); await ctx.yield(); W.add(spraysBk.mesh(sprayMat)); await ctx.yield(); aheadB.kind = 0; W.add(aheadB.mesh(litMat));
    await ctx.yield();
    const sinkR = new THREE.Group(), sinkL = new THREE.Group(), sinkT = new THREE.Group();
    const folMatCut = foliageMaterial(shared, 1), sprayMatCut = sprayMaterial(shared, 1);      // the cutting's own: the same programs, one uniform apart
    sinkR.add(leavesR.mesh(folMatCut)); await ctx.yield(); sinkR.add(spraysR.mesh(sprayMatCut)); await ctx.yield();
    sinkL.add(leavesL.mesh(folMatCut), spraysL.mesh(sprayMatCut)); await ctx.yield();
    sinkR.add(tuftMesh(tIR, tJR)); sinkL.add(tuftMesh(tIL, tJL));
    sinkT.add(leavesT.mesh(folMat), spraysT.mesh(sprayMat), builtT.mesh(litMat)); W.add(sinkR, sinkL, sinkT);
    await ctx.yield();
    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wireP, 3)); wireGeo.setAttribute('aOther', new THREE.Float32BufferAttribute(wireO, 3));
    wireGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wireUV, 2)); wireGeo.setIndex(wireIX);
    const uView = { value: new THREE.Vector2(800, 450) };
    const wires = new THREE.Mesh(wireGeo, new THREE.ShaderMaterial({
      uniforms: { ...shared, uView, uInk: { value: new THREE.Color('#2B3236') } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`uniform vec2 uView; uniform vec3 uCamW; attribute vec3 aOther; varying float vDist;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.);
          vec4 c0 = projectionMatrix * viewMatrix * wp, c1 = projectionMatrix * viewMatrix * modelMatrix * vec4(aOther, 1.);
          vec2 d = (c1.xy / max(abs(c1.w), 1e-3) - c0.xy / max(abs(c0.w), 1e-3)) * uView * (uv.y > .5 ? -1. : 1.);
          d = normalize(d + vec2(1e-5, 0.));
          float pxPerM = projectionMatrix[1][1] * uView.y * .5 / max(c0.w, .1);
          float wpx = max(.02 * pxPerM, 1.5 * uView.y / 450.);                 // never thinner than a pixel and a half
          c0.xy += vec2(-d.y, d.x) * uv.x * (uv.y > .5 ? -1. : 1.) * wpx / uView * c0.w;
          vDist = distance(wp.xyz, uCamW); gl_Position = c0; }`,
      fragmentShader: /* glsl */`${LIGHT_GLSL} uniform vec3 uInk; varying float vDist;
        void main() { gl_FragColor = vec4(swFog(uInk, vDist), 1.); }`,
    }));
    wires.frustumCulled = false; W.add(wires);

    // THE THREAD: the valley lane as one pale line, never thinner than 2.4 pixels, faded in beyond 130 m. From the hill it
    // is what leads the eye to the gate.
    {
      const tP = [], tO = [], tUV = [], tIX = [], A = new THREE.Vector3(), B = new THREE.Vector3();
      for (let s0 = -7; s0 < 293; s0 += 3) {
        fic.place(s0, 0, 0, A); A.y = heightAt(A.x, A.z) + 0.12; fic.place(s0 + 3, 0, 0, B); B.y = heightAt(B.x, B.z) + 0.12;
        const base = tP.length / 3;
        tP.push(A.x, A.y, A.z, A.x, A.y, A.z, B.x, B.y, B.z, B.x, B.y, B.z); tO.push(B.x, B.y, B.z, B.x, B.y, B.z, A.x, A.y, A.z, A.x, A.y, A.z);
        tUV.push(1, 0, -1, 0, -1, 1, 1, 1); tIX.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
      const tg = new THREE.BufferGeometry();
      tg.setAttribute('position', new THREE.Float32BufferAttribute(tP, 3)); tg.setAttribute('aOther', new THREE.Float32BufferAttribute(tO, 3));
      tg.setAttribute('uv', new THREE.Float32BufferAttribute(tUV, 2)); tg.setIndex(tIX);
      const thread = new THREE.Mesh(tg, new THREE.ShaderMaterial({
        uniforms: { ...shared, uView, uPale: { value: new THREE.Color(pal.gravel) } }, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`uniform vec2 uView; uniform vec3 uCamW; attribute vec3 aOther; varying float vDist;
          ${SINK_GLSL}
          void main() {
            vec3 pA = position, pB = aOther; pA.y -= swSink(pA.xz); pB.y -= swSink(pB.xz);
            vec4 wp = modelMatrix * vec4(pA, 1.);
            vec4 c0 = projectionMatrix * viewMatrix * wp, c1 = projectionMatrix * viewMatrix * modelMatrix * vec4(pB, 1.);
            vec2 d = (c1.xy / max(abs(c1.w), 1e-3) - c0.xy / max(abs(c0.w), 1e-3)) * uView * (uv.y > .5 ? -1. : 1.);
            d = normalize(d + vec2(1e-5, 0.));
            float pxPerM = projectionMatrix[1][1] * uView.y * .5 / max(c0.w, .1);
            float wpx = max(3.3 * pxPerM, 2.4 * uView.y / 450.);
            c0.xy += vec2(-d.y, d.x) * uv.x * (uv.y > .5 ? -1. : 1.) * wpx * .5 / uView * c0.w;
            vDist = distance(wp.xyz, uCamW);
            if (vDist < 110. || c0.w < .3) c0 = vec4(2., 2., 2., 1.);
            gl_Position = c0; }`,
        fragmentShader: /* glsl */`${LIGHT_GLSL} uniform vec3 uPale; varying float vDist;
          void main() { gl_FragColor = vec4(swFog(swLight(uPale * .98, vec3(0., 1., 0.)), vDist * .8), smoothstep(125., 190., vDist)); }`,
      }));
      thread.frustumCulled = false; thread.renderOrder = 2; W.add(thread);
    }

    // the washing line in the yard: it teaches what cloth does before the eye needs it at one pixel
    const wash = makeBag();
    {
      const A = new THREE.Vector3(-12.6, 2.05, -15.2), B = new THREE.Vector3(-3.8, 2.05, -17.0), dir = B.clone().sub(A), len = dir.length(); dir.normalize();
      const ry = Math.atan2(-dir.z, dir.x), tints = ['#F4EFE2', '#C9D6E2', '#F4EFE2', '#EBCDBE', '#DCE3E6'];
      for (const q of [A, B]) home.add(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 6, 1, true), new THREE.Matrix4().makeTranslation(q.x, 1.1, q.z), '#6A5E52', 1);
      home.box((A.x + B.x) / 2, 2.07, (A.z + B.z) / 2, len, 0.025, 0.025, '#D8D4C8', 1, ry);
      let t = 0.7;
      for (let i = 0; i < 5; i++) {
        const w = [1.5, 0.8, 1.7, 0.9, 1.2][i], h = [1.0, 0.7, 1.25, 0.75, 0.9][i], c = A.clone().addScaledVector(dir, t + w / 2);
        const m = new THREE.Matrix4().makeTranslation(c.x, 2.04 - h / 2, c.z).multiply(new THREE.Matrix4().makeRotationY(ry));
        const geo = new THREE.PlaneGeometry(w, h, 8, 8), uvA = geo.attributes.uv, n0 = wash.Sw.length;
        const g2 = geo.toNonIndexed(), uv2 = g2.attributes.uv;
        wash.add(g2, m, tints[i], 0.62, 0);
        for (let j = 0; j < uv2.count; j++) wash.Sw[n0 + j] = (1 - uv2.getY(j)) * h + i * 10;      // metres below the line, and a phase
        geo.dispose(); t += w + 0.22;
      }
    }
    const washU = { ...shared, uDim: { value: 1 } };
    const washMesh = wash.mesh(new THREE.ShaderMaterial({
      uniforms: washU, side: THREE.DoubleSide,
      vertexShader: /* glsl */`${VERT_HEAD} attribute vec3 color; attribute float aSway;
        void main() { vec3 p = position, n = normal; vCol = color;
          float ph = floor(aSway / 10.), d = aSway - ph * 10.;
          float a = sin(uTime * 2.3 + ph * 1.9 + p.x * 1.1) * .30 + sin(uTime * 5.3 + ph + d * 4. + p.x * 2.) * .10 + .22;
          p += n * a * d; p.y += abs(a) * d * .18;
          n = normalize(n + vec3(0., -a * .9, 0.) + .35 * cos(uTime * 5.3 + ph + d * 4.) * vec3(1., 0., 0.));
          ${VERT_TAIL} }`,
      fragmentShader: /* glsl */`${FRAG_HEAD} uniform float uDim;
        void main() { vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
          vec3 c = (swLight(vCol, n) + vCol * uKeyCol * .25 * max(dot(-n, uSunW), 0.)) * uDim;
          gl_FragColor = vec4(swFog(c, vDist), 1.); }`,
    }));
    await ctx.yield();
    W.add(built.mesh(litMat));
    await ctx.yield();
    // THE HOME GROUP: house, gate, walls, yard hedges, washing. Two pieces of staging, both pure functions of u:
    //  - it is laid out mirrored (x -> -x), so the house stands on the hedge side of the lane: the bend takes the house
    //    first and her last, and from the hill the whole width of the dark yard lies between the white point and the white wall;
    //  - while the banked hedge hides it (u 0.285 to 0.335) it grows about the gateway to HOME_K, a stage flat brought
    //    forward: from the hill the house is 24 px tall and the gap is real, and the eye has nothing to measure it by.
    const HOME_K = 2.4, homeK = (u) => 1 + (HOME_K - 1) * ss(0.285, 0.335, u);
    const homeMat = litMaterial(shared, { side: THREE.DoubleSide });
    const HG = new THREE.Group(); HG.add(home.mesh(homeMat)); await ctx.yield();
    HG.add(homeLeaves.mesh(folMat), homeSprays.mesh(sprayMat), washMesh); W.add(HG);
    {
      const wI = [], wJ = []; let wh = 0.3719; const wr = () => { wh = (wh * 8887.13 + 0.2171) % 1; return wh; };
      const nW = Math.round(520 * Math.max(0.6, detail));
      for (let i = 0; i < nW; i++) {
        const sx = wr() < 0.72 ? -1 : 1, len = sx < 0 ? 46 : 17, x = sx * (2.1 + len * wr() * wr()), z = -8 + 0.27 + 0.30 * wr() * wr();
        wI.push(x, 0.02, z, wr() * 6.283); wJ.push(0.16 + 0.30 * wr(), wr(), wr(), wr() < 0.3 ? 1 : 0.12);
      }
      HG.add(tuftMesh(wI, wJ));
    }
    const hp = (v, x, y, z, k) => v.set(-k * x, k * y, -8 + k * (z + 8));       // a home point -> W space
    await ctx.yield();

    // THE FIGURE in the gateway, her far forms, the lit window
    const figPos = new THREE.Vector3(0, 0, -8);
    const fig = await buildFigure(ctx, shared, {});
    fig.mesh.position.copy(figPos); W.add(fig.mesh);
    let fig2 = null; const fig2Home = new THREE.Vector3(-1.05, 0, -8.5), fig2Door = new THREE.Vector3(-11.0, 0, -21.6);
    if (variant === 'C') {
      fig2 = await buildFigure(ctx, shared, { scale: 0.74, dress: ['#6E86A6', '#3E4C66'] });
      fig2.mesh.position.copy(fig2Home); fig2.uniforms.uHand.value = 1; W.add(fig2.mesh);
    }
    const far = buildFarForms(shared); W.add(far.mesh);
    const winPos = new THREE.Vector3(14.2, 1.62, -21.9);
    const winMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
    const winQuad = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), winMat); winQuad.position.copy(winPos); HG.add(winQuad);
    const cCloth = new THREE.Color('#F4EFE2'), cAmber = new THREE.Color('#FFC56E'), cDress = new THREE.Color('#A8584C'), cDress2 = new THREE.Color('#6E86A6'), cDog = new THREE.Color('#2A2A28');
    far.uniforms.uSz.value[3].set(0.75, 0.6, rare ? 7.6 : 3.2);      // the floor is a diameter in pixels; the disc's solid heart is under half of it far.uniforms.uSz.value[4].set(0.36, 1.22, 0);
    await ctx.yield();

    // THE DOG: two flat tones. It runs after us and never gains; ordinarily it gives up and sits, rarely it follows to the bend.
    const toon = makeToonMaterial(shared);
    const dog = new THREE.Group(), dogBody = new THREE.Group(); dog.add(dogBody); W.add(dog);
    const DL = '#3A3936', DS = '#20201F', TM = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0) => new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationX(rx)).multiply(new THREE.Matrix4().makeScale(sx, sy, sz));
    {
      const acc = makeAcc();
      acc.add(new THREE.SphereGeometry(1, 16, 12), TM(0, 0.50, 0, 0.15, 0.165, 0.37), 0, 0, DL, DS);
      acc.add(new THREE.SphereGeometry(1, 14, 10), TM(0, 0.70, 0.40, 0.105, 0.11, 0.13), 0, 0, DL, DS);
      acc.add(new THREE.SphereGeometry(1, 10, 8), TM(0, 0.665, 0.53, 0.055, 0.05, 0.09), 0, 0, DL, DS);
      acc.add(new THREE.SphereGeometry(1, 12, 8), TM(0, 0.43, 0.27, 0.10, 0.13, 0.09), 0, 0, '#F1ECE0', '#B9C2CC');     // the white chest
      for (const sx of [-1, 1]) acc.add(new THREE.ConeGeometry(0.04, 0.10, 6), TM(sx * 0.07, 0.80, 0.37, 1, 1, 1, -0.3), 0, 0, DL, DS);
      const body = new THREE.Mesh(acc.build(), toon); body.frustumCulled = false; dogBody.add(body);
    }
    const dogLegs = [], dogTail = new THREE.Group();
    for (const [lx, lz] of [[-0.085, 0.24], [0.085, 0.24], [-0.085, -0.25], [0.085, -0.25]]) {
      const acc = makeAcc(); acc.add(new THREE.CylinderGeometry(0.045, 0.032, 0.42, 8, 1, false), TM(0, -0.21, 0), 0, 0, DL, DS);
      const leg = new THREE.Mesh(acc.build(), toon); leg.position.set(lx, 0.42, lz); leg.frustumCulled = false; dogBody.add(leg); dogLegs.push(leg);
    }
    { const acc = makeAcc(); acc.add(new THREE.CylinderGeometry(0.02, 0.035, 0.34, 6, 1, false), TM(0, 0.15, -0.06, 1, 1, 1, -0.5), 0, 0, DL, DS);
      const tail = new THREE.Mesh(acc.build(), toon); tail.frustumCulled = false; dogTail.add(tail); dogTail.position.set(0, 0.56, -0.34); dogBody.add(dogTail); }
    // where the dog is, from u alone: 0.8 of the car's speed and never over 3 m/s (rare: it follows, losing ground all the way)
    const DOG_U0 = 0.10, DOG_U1 = rare ? 0.253 : 0.15, DOG_N = 160, dogS = new Float32Array(DOG_N + 1);
    dogS[0] = -6;
    for (let i = 1; i <= DOG_N; i++) {
      const u = DOG_U0 + (DOG_U1 - DOG_U0) * (i - 0.5) / DOG_N, ramp = ss(DOG_U0, DOG_U0 + 0.012, u) * (1 - ss(DOG_U1 - 0.012, DOG_U1, u));
      const v = rare ? 0.70 * fic.speed(u) : Math.min(3 / 0.0115, 0.8 * fic.speed(u));
      dogS[i] = dogS[i - 1] + v * ramp * (DOG_U1 - DOG_U0) / DOG_N;
    }
    const dogAt = (u) => { const f = Math.min(DOG_N - 1e-3, Math.max(0, (u - DOG_U0) / (DOG_U1 - DOG_U0) * DOG_N)), i = f | 0; return dogS[i] + (dogS[i + 1] - dogS[i]) * (f - i); };
    await ctx.yield();

    // SWIFTS: each on an arc that starts outside a frame edge behind the car and recedes. They live in the car's frame.
    const nSwift = Math.max(6, Math.round(9 * Math.min(1, detail + 0.07)));
    const swP = [], swA = [], swB = [], swC = [];
    for (let i = 0; i < nSwift; i++) {
      const side = i % 2 ? 1 : -1, T = rng.range(4.5, 8), off = rng.range(0, 8);
      const st = [side * rng.range(16, 30), rng.range(1.5, 8), -rng.range(15, 40)], en = [-side * rng.range(1, 12), rng.range(3, 13), -rng.range(95, 160)];
      for (const q of [[-0.21, 0, -0.07, 1], [0, 0, 0.08, 0], [0, 0, -0.04, 0], [0.21, 0, -0.07, 1], [0, 0, -0.04, 0], [0, 0, 0.08, 0], [0, 0, 0.08, 0], [-0.035, 0, -0.14, 0], [0.035, 0, -0.14, 0]]) {
        swP.push(q[0], q[1], q[2]); swA.push(st[0], st[1], st[2], T); swB.push(en[0], en[1], en[2], off); swC.push(q[3]);
      }
    }
    const swGeo = new THREE.BufferGeometry();
    swGeo.setAttribute('position', new THREE.Float32BufferAttribute(swP, 3)); swGeo.setAttribute('aA', new THREE.Float32BufferAttribute(swA, 4));
    swGeo.setAttribute('aB', new THREE.Float32BufferAttribute(swB, 4)); swGeo.setAttribute('aTip', new THREE.Float32BufferAttribute(swC, 1));
    const swifts = new THREE.Mesh(swGeo, new THREE.ShaderMaterial({
      uniforms: { ...shared, uInk: { value: new THREE.Color(pal.dark).multiplyScalar(0.9) } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`uniform float uTime; uniform vec3 uCamW; attribute vec4 aA; attribute vec4 aB; attribute float aTip; varying float vDist;
        vec3 at(float k) { vec3 p = mix(aA.xyz, aB.xyz, k); p.y += 3. * sin(k * 3.1416) + .8 * sin(k * 17. + aB.w); p.x += 4. * sin(k * 5. + aB.w) * (1. - k); return p; }
        void main() {
          float k = fract((uTime + aB.w) / aA.w);
          vec3 c = at(k), f = normalize(at(k + .01) - c + vec3(0., 0., -1e-4));
          vec3 r = normalize(cross(vec3(0., 1., 0.), f) + vec3(1e-4, 0., 0.)), up = cross(f, r);
          float sc = max(1., length(c) / 34.);                                  // a swift never dwindles to nothing
          float glide = smoothstep(.2, .6, sin(uTime * 1.7 + aB.w * 3.));
          vec3 q = position * sc; q.y += aTip * sc * .11 * mix(sin(uTime * 26. + aB.w * 9.), -.3, glide);
          vec4 wp = modelMatrix * vec4(c + r * q.x + up * q.y + f * q.z, 1.);
          vDist = distance(wp.xyz, uCamW); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`${LIGHT_GLSL} uniform vec3 uInk; varying float vDist;
        void main() { gl_FragColor = vec4(swFog(uInk, vDist * .6), 1.); }`,
    }));
    swifts.frustumCulled = false; scene.add(swifts);

    // ROOKS going home across the road ahead, toward the trees on the knoll: one loose string of birds, placed by u
    // (they cross as we drive), each beating its wings in its own time. Seen only after the turn.
    const rookU = { ...shared, uM: { value: 0 }, uP0: { value: fic.place(704, -62, 31, new THREE.Vector3()) }, uDir: { value: new THREE.Vector3() }, uInk: { value: new THREE.Color(pal.dark).multiplyScalar(0.55) } };
    {
      rookU.uDir.value.copy(fic.place(676, 60, 23, new THREE.Vector3())).sub(rookU.uP0.value).normalize();
      const nR = Math.max(12, Math.round(24 * detail)), rp = [], ra = [], rt = [];
      let rh = 0.5127; const rl = () => (rh = (rh * 8121.13 + 0.3379) % 1);
      for (let i = 0; i < nR; i++) {
        const off = [(rl() - 0.5) * 16 + 3 * Math.sin(i * 1.7), (rl() - 0.5) * 9, -30 + 62 * (i + rl()) / nR, rl() * 6.283], sz = 0.8 + 0.4 * rl();
        for (const q of [[-0.78, 0, -0.10, 1], [0, 0, 0.24, 0], [0, 0, -0.20, 0], [0.78, 0, -0.10, 1], [0, 0, -0.20, 0], [0, 0, 0.24, 0], [-0.40, 0, 0.06, 0.5], [0.40, 0, 0.06, 0.5], [0, 0, -0.34, 0]]) {
          rp.push(q[0] * sz, q[1], q[2] * sz); ra.push(off[0], off[1], off[2], off[3]); rt.push(q[3]);
        }
      }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('aA', new THREE.Float32BufferAttribute(ra, 4)); rg.setAttribute('aTip', new THREE.Float32BufferAttribute(rt, 1));
      const rooks = new THREE.Mesh(rg, new THREE.ShaderMaterial({
        uniforms: rookU, side: THREE.DoubleSide,
        vertexShader: /* glsl */`uniform float uTime; uniform vec3 uCamW; uniform float uM; uniform vec3 uP0; uniform vec3 uDir; attribute vec4 aA; attribute float aTip; varying float vDist;
          void main() {
            vec3 f = uDir, r = normalize(cross(vec3(0., 1., 0.), f) + vec3(1e-5, 0., 0.)), up = cross(f, r);
            float ph = aA.w, beat = sin(uTime * 6.3 + ph * 5.), soar = smoothstep(.55, .9, sin(uTime * .9 + ph * 2.));
            vec3 c = uP0 + f * (uM + aA.z + .8 * sin(uTime * .7 + ph)) + r * (aA.x + 1.2 * sin(uTime * .5 + ph * 3.)) + up * (aA.y + .7 * sin(uTime * .8 + ph * 1.7));
            vec3 q = position; q.y += aTip * mix(.42 * beat, .12, soar) - .10 * beat * (1. - aTip);
            vec4 wp = modelMatrix * vec4(c + r * q.x + up * q.y + f * q.z, 1.);
            vDist = distance(wp.xyz, uCamW); gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`${LIGHT_GLSL} uniform vec3 uInk; varying float vDist;
          void main() { gl_FragColor = vec4(swFog(uInk, vDist * .5), 1.); }`,
      }));
      rooks.frustumCulled = false; W.add(rooks);
    }
    await ctx.yield();
    // THE FARM'S WINDOWS. Three small windows, all lit and steady for the whole flight: the farm ahead has its lamps
    // in at dusk and nothing about them changes as we come (the brief's light: "Nothing changes but the window", and that
    // window is the one at home). No pane is lit by the car's place, by u or by the clock, and none wavers.
    // Lit, a pane is amber and under 1.0 linear: the brief lets only the cloth and the window of the house we left glow,
    // and these do not.
    const farmU = { ...shared };
    {
      const fp = [], fuv = [], fi = [];
      for (let i = 0, v = 0; i < farmWin.length; i += 5, v++) {
        fp.push(farmWin[i], farmWin[i + 1], farmWin[i + 2]); fuv.push(farmWin[i + 3], farmWin[i + 4]);
        if (v % 4 === 3) fi.push(v - 3, v - 2, v - 1, v - 3, v - 1, v);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(fuv, 2));
      fg.setIndex(fi);
      const fw = new THREE.Mesh(fg, new THREE.ShaderMaterial({
        uniforms: farmU, side: THREE.DoubleSide,
        vertexShader: /* glsl */`uniform vec3 uCamW; varying float vOn; varying vec2 vUv; varying float vDist;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.); vUv = uv; vDist = distance(wp.xyz, uCamW);
            vOn = 1.;                                                                         // every pane lit, and steady, for the whole flight: the brief's light says nothing changes but the window of home
            gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`${LIGHT_GLSL} varying float vOn; varying vec2 vUv; varying float vDist;
          void main() {
            vec3 c = vec3(.60, .32, .10) * (.62 + .38 * (1. - dot(vUv, vUv) * .5));                 // lit, by one oil lamp behind the middle of it: a dull orange at two thirds of what it was, far under the 5.0 of home's window
            float bar = max(1. - smoothstep(.04, .10, abs(vUv.x)), 1. - smoothstep(.03, .08, abs(vUv.y)));   // the sash bars, pale
            c = mix(c, vec3(.42, .40, .34) * (uSkyCol + .25 * vOn), bar * .8);
            gl_FragColor = vec4(mix(swFog(c, vDist), c, vOn * .7), 1.); }`,      // a light keeps its hue through the haze
      }));
      fw.frustumCulled = false; W.add(fw);
    }
    await ctx.yield();
    // THE HERON: it stands in the beck below the bridge and, as the car comes up, lifts across the lane ahead of us toward
    // the knoll. Two flat tones like the dog; placed by u, its wings beaten by time.
    const heron = new THREE.Group(), heronW = []; W.add(heron);
    {
      const HL = '#8792A0', HS = '#3E4852', HD = '#2E363E', HW = '#D5D6D0', hMat = makeToonMaterial(shared); hMat.side = THREE.DoubleSide;
      const acc = makeAcc();
      acc.add(new THREE.SphereGeometry(1, 14, 10), TM(0, 0, 0, 0.13, 0.12, 0.34), 0, 0, HL, HS);
      acc.add(new THREE.SphereGeometry(1, 10, 8), TM(0, 0.05, 0.33, 0.06, 0.075, 0.13), 0, 0, HW, '#9AA4AE');       // the neck drawn back in an S
      acc.add(new THREE.SphereGeometry(1, 10, 8), TM(0, 0.10, 0.46, 0.045, 0.045, 0.075), 0, 0, HW, '#9AA4AE');
      acc.add(new THREE.ConeGeometry(0.018, 0.20, 6), TM(0, 0.09, 0.62, 1, 1, 1, Math.PI / 2), 0, 0, '#C9A04A', '#7A6238');
      acc.add(new THREE.BoxGeometry(0.05, 0.02, 0.62), TM(0, -0.05, -0.60), 0, 0, HD, '#23292F');                   // the legs trail behind
      acc.add(new THREE.ConeGeometry(0.09, 0.26, 6), TM(0, 0, -0.40, 1, 0.5, 1, -Math.PI / 2), 0, 0, HL, HS);
      const hb = new THREE.Mesh(acc.build(), hMat); hb.frustumCulled = false; heron.add(hb);
      const quad = (x0, x1, a0, b0, a1, b1, sx) => { const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([sx * x0, 0, a0, sx * x1, 0, a1, sx * x1, 0, b1, sx * x0, 0, b0], 3)); g.setIndex(sx > 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; };
      for (const sx of [-1, 1]) {
        const inner = new THREE.Group(), outer = new THREE.Group(); inner.position.set(sx * 0.10, 0.06, 0.05); outer.position.set(sx * 0.50, 0, 0); inner.add(outer); heron.add(inner);
        const a1 = makeAcc(); a1.add(quad(0, 0.50, 0.15, -0.22, 0.17, -0.19, sx), TM(0, 0, 0), 0, 0, HL, HS);
        const a2 = makeAcc(); a2.add(quad(0, 0.34, 0.17, -0.19, 0.13, -0.17, sx), TM(0, 0, 0), 0, 0, HL, HS); a2.add(quad(0.34, 0.60, 0.13, -0.17, 0.04, -0.10, sx), TM(0, 0, 0), 0, 0, HD, '#262C33');
        const m1 = new THREE.Mesh(a1.build(), hMat), m2 = new THREE.Mesh(a2.build(), hMat); m1.frustumCulled = false; m2.frustumCulled = false; inner.add(m1); outer.add(m2);
        heronW.push([inner, outer, sx]);
      }
      heron.visible = false; heron.scale.setScalar(1.15);
    }
    {
      const rI = [], rJ = []; let rh = 0.5179; const rl = () => { rh = (rh * 6791.31 + 0.1931) % 1; return rh; };
      const nR = Math.round(420 * detail);
      for (let i = 0; i < nR; i++) {
        const aFr = -34 + 92 * rl(), side = rl() < 0.5 ? -1 : 1, off = 2.7 + 1.5 * rl() * rl() + 3.0 * ss(14, 34, aFr) * (1 - ss(50, 58, aFr));
        const bR = -11 - 3 * Math.sin(aFr * 0.13) - 45 * (1 - ss(-50, 10, aFr)) + side * off;
        fic.place(530 + aFr, bR, 0, _v);
        rI.push(_v.x, heightAt(_v.x, _v.z) - 0.05, _v.z, rl() * 6.283); rJ.push(0.55 + 0.6 * rl(), 0.1 * rl(), rl(), rl() < 0.3 ? 1 : 0.1);
      }
      W.add(tuftMesh(rI, rJ));
    }
    const HER_U0 = 0.72, HER_U1 = 0.90, heronAt = (u, out) => { const k = Math.min(1, Math.max(0, (u - HER_U0) / (HER_U1 - HER_U0)));
      return fic.place(581 + 13 * k, -12 + 48 * Math.pow(k, 1.5), 0.70 + 4.2 * (1 - (1 - k) * (1 - k)), out); };
    await ctx.yield();

    // DUST left at the wheels: fixed to the lane, shown by how far behind the car it is
    const nDust = variant === 'B' ? 1 : Math.round(900 * detail * Math.min(1.15, density)), duP = [], duS = [];
    for (let i = 0; i < nDust; i++) {
      const s = 4 + (i + rng()) * (505 / nDust); fic.place(s, (i % 2 ? 0.78 : -0.78) + rng.range(-0.25, 0.25), 0, _v);
      duP.push(_v.x, heightAt(_v.x, _v.z) + 0.15, _v.z); duS.push(s, rng(), rng(), 0);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(duP, 3)); dustGeo.setAttribute('aS', new THREE.Float32BufferAttribute(duS, 4));
    const dustU = { ...shared, uView, uCarS: { value: 0 }, uLife: { value: 10 }, uAmt: { value: 0 }, uTint: { value: new THREE.Color(variant === 'C' ? '#B9C6D0' : '#D8C3B0') } };
    const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
      uniforms: dustU, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`uniform float uTime; uniform vec3 uCamW; uniform vec2 uView; uniform float uCarS; uniform float uLife; uniform float uAmt;
        ${SINK_GLSL}
        attribute vec4 aS; varying float vA; varying float vDist;
        void main() {
          float age = (uCarS - aS.x) / max(uLife, 1.);
          float on = step(0., age) * step(age, 1.);
          vec3 p = position; float ag = clamp(age, 0., 1.);
          p.y -= swSink(p.xz);
          p.y += ag * (.5 + .9 * aS.y) + .05 * sin(uTime * .9 + aS.z * 30.);
          p.x += (aS.z - .5) * 1.6 * ag + .18 * sin(uTime * .7 + aS.y * 40.); p.z += (aS.y - .5) * 1.2 * ag + .18 * cos(uTime * .6 + aS.z * 17.);
          vec4 wp = modelMatrix * vec4(p, 1.); vDist = distance(wp.xyz, uCamW);
          vec4 cp = projectionMatrix * viewMatrix * wp;
          float size = mix(.9, 3.4, sqrt(ag)) * (.7 + .6 * aS.y);
          gl_PointSize = min(size * projectionMatrix[1][1] * uView.y * .5 / max(cp.w, .5), uView.y * .5);
          // thickest just behind the wheels, thinning down the lane we have left
          vA = on * uAmt * smoothstep(0., .05, ag) * (1. - ag) * (1. - ag) * smoothstep(3., 9., vDist) * (1. - smoothstep(40., 95., vDist));
          if (vA < .002) cp = vec4(2., 2., 2., 1.);
          gl_Position = cp; }`,
      fragmentShader: /* glsl */`${LIGHT_GLSL} uniform vec3 uTint; varying float vA; varying float vDist;
        void main() { vec2 q = gl_PointCoord * 2. - 1.; float r = dot(q, q); float a = (1. - smoothstep(.0, 1., r)); a = a * a * vA;
          gl_FragColor = vec4(swFog(uTint * (uKeyCol * .24 + uSkyCol * .78 + .10), vDist), a); }`,
    }));
    dust.frustumCulled = false; dust.renderOrder = 5; W.add(dust);
    await ctx.yield();

    // THE GLASS and THE CAR: carried with the lens, absent while the world is seen through a portal (u is exactly 0 there)
    const glass = buildGlass({ beads: variant === 'C', breathGain: variant === 'B' ? 1.25 : 1, key: pal.key, side: fic.mirror });
    await ctx.yield();
    const car = await buildCar({ aspect: ctx.aspect || 16 / 9, fov: 44, paneTop: pal.fillSky, paneLow: pal.glow, time: shared.uTime, shared, yield: ctx.yield });
    const carried = new THREE.Group(); carried.add(car.group, glass.mesh); carried.visible = false; scene.add(carried);
    await ctx.yield();

    const rear = new THREE.Vector3(0, 0, -1), camW = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), bufSize = new THREE.Vector2(), m3 = new THREE.Matrix3();
    const WAVE = 9.42478, winOn = (u) => (variant === 'B' ? 1 : variant === 'C' ? ss(0.2, 0.23, u) : ss(0.26, 0.29, u));
    const distTo = (p) => tmp.copy(p).applyMatrix4(W.matrix).distanceTo(camW);
    const renderer = ctx.renderer;
    { const rp = fic.place(632.6, 0, 2.3, new THREE.Vector3()); shared.uRingL.value.set(rp.x, rp.y, rp.z, 0);
      shared.uBeck.value.y = 285; shared.uBeck.value.z = -150; }      // the tarn the beck runs down to: a long water in the low ground

    const update = (dt, time, camera, u) => {
      camera.getWorldPosition(camW);
      shared.uTime.value = time; shared.uCamW.value.copy(camW);
      if (renderer) { renderer.getDrawingBufferSize(bufSize); uView.value.copy(bufSize); far.uniforms.uView.value.copy(bufSize); }
      // 1. the carried world, from u alone
      const q = fic.setW(W, u, path), carS = fic.S(Math.min(u, U_FREE));
      shared.uSunW.value.copy(sunF).transformDirection(W.matrix);
      sky.position.copy(camW); skyMat.uniforms.uWinv.value.copy(m3.setFromMatrix4(W.matrix).invert());
      shared.uWind.value = 1 - 0.9 * (ss(0.325, 0.345, u) - ss(0.385, 0.41, u));
      const sink = ss(SINK_U0, SINK_U1, u);
      sinkT.position.y = -SINK_T * sink;
      ground.material.uniforms.uMist.value = ss(0.30, 0.33, u) * (1 - ss(0.40, 0.44, u));
      ground.material.uniforms.uHigh.value = ss(4, 11, q.y) * (1 - ss(0.40, 0.44, u));
      shared.uFwd.value = ss(0.44, 0.56, u);
      const ringK = ss(0.50, 0.62, u) * (0.45 + 0.55 * ss(0.56, 0.97, u));      // the ring's light grows until the crossing
      shared.uRingL.value.w = ringK * 3.2; laneU.uRingS.value.y = ringK * 1.15; car.uniforms.uRing.value = ringK; car.uniforms.uFwd.value = shared.uFwd.value;
      shared.uSinkB.value.x = fic.aOf(q.x, q.z); shared.uSinkB.value.z = CLIMB_FALL * ss(CLIMB_U0, CLIMB_U1, u) * (1 - ss(BROW_U0, BROW_U1, u));      // past the crest the sink is let go: the brow rises and takes the house
      // 2. the figure: hands, near and far forms
      const k = homeK(u);
      HG.scale.set(-k, k, k); HG.position.set(0, 0, 8 * (k - 1)); fig.mesh.scale.setScalar(k);
      homeMat.uniforms.uDim.value = 1 - 0.04 * (k - 1) / (HOME_K - 1); homeMat.uniforms.uWarm.value = (k - 1) / (HOME_K - 1); washU.uDim.value = 1 - 0.7 * (k - 1) / (HOME_K - 1);      // the washing must not be mistaken for her
      const hand = ss(0.065, 0.075, u) - ss(0.165, 0.175, u);
      fig.uniforms.uHand.value = hand;
      const dFig = distTo(tmp2.set(figPos.x, 1.4, figPos.z)), near = 1 - ss(60, 110, dFig), farA = 1 - near;
      fig.uniforms.uNear.value = near; fig.mesh.visible = near > 0.003;
      const sgn = -1 + 2 * ss(0.45, 0.55, hand), swing = Math.sin(WAVE * time + 1.2 - 0.9);
      const pulse = 0.18 + 0.82 * ss(-0.2, 0.9, Math.sin(WAVE * time + 1.2));          // on and off 1.5 times a second, eased, never out
      // the white point is taught early: it is already lit over the real cloth at 35 to 60 m, while the dress can still be seen under it
      const rad = (2.0 + 3.2 * ss(60, 300, dFig)) * pulse, U = far.uniforms;
      U.uP.value[0].set(k * (figPos.x + sgn * 0.3) + Math.max(0.45 * k, dFig * 0.0058) * swing, 2.3 * k, figPos.z);
      U.uC.value[0].set(cCloth.r * rad, cCloth.g * rad, cCloth.b * rad, ss(30, 56, dFig));
      U.uSz.value[0].set(0.62 * k, 0.62 * k, 5.2);
      U.uP.value[1].set(figPos.x, 0.83 * k, figPos.z); U.uSz.value[1].set(0.46 * k, 1.66 * k, 2.6);
      const dk = 1 + 0.9 * ss(110, 260, dFig);                      // far off the dress is a fleck of its own red under the point
      U.uC.value[1].set(cDress.r * dk, cDress.g * dk, cDress.b * dk, farA);
      // the lit window
      const win = winOn(u), dWin = distTo(hp(tmp2, winPos.x, winPos.y, winPos.z, k)), wI = win * (2.2 + 2.8 * ss(30, 200, dWin));
      winMat.color.setRGB(cAmber.r * wI + 0.012, cAmber.g * wI + 0.016, cAmber.b * wI + 0.018);
      hp(U.uP.value[2], winPos.x, winPos.y, -21.7, k); U.uSz.value[2].set(1.0 * k, 1.3 * k, 3.6);
      U.uC.value[2].set(3.4, 1.55, 0.36, win * ss(70, 150, dWin));
      // the second figure (after rain): goes indoors at u 0.2
      if (fig2) {
        const go = ss(0.185, 0.214, u), gone = ss(0.208, 0.216, u);
        fig2.mesh.position.lerpVectors(fig2Home, fig2Door, go); fig2.mesh.rotation.y = go > 0.001 && go < 0.999 ? 2.2 : 0;
        fig2.uniforms.uWave.value = 1 - ss(0.18, 0.19, u);
        const n2a = (1 - ss(60, 110, distTo(fig2.mesh.position))) * (1 - gone);
        fig2.uniforms.uNear.value = n2a; fig2.mesh.visible = n2a > 0.003;
        far.uniforms.uP.value[4].set(fig2.mesh.position.x, 0.62, fig2.mesh.position.z);
        far.uniforms.uC.value[4].set(cDress2.r, cDress2.g, cDress2.b, (1 - gone) * ss(60, 110, distTo(fig2.mesh.position)));
      }
      // 3. the dog
      const ds = dogAt(u), running = ss(DOG_U0, DOG_U0 + 0.006, u) * (1 - ss(DOG_U1 - 0.004, DOG_U1 + 0.004, u)), sit = ss(DOG_U1, DOG_U1 + 0.008, u);
      const ph = ds * 5.6;
      dog.position.set(0.95 - 0.6 * ss(DOG_U0, DOG_U0 + 0.03, u), 0, ds);
      dogBody.position.y = 0.05 * Math.abs(Math.sin(ph)) * running - 0.14 * sit;
      dogBody.rotation.x = -0.62 * sit + 0.08 * Math.sin(ph * 2) * running;
      dogLegs[0].rotation.x = 0.95 * Math.sin(ph) * running + 0.62 * sit; dogLegs[1].rotation.x = 0.95 * Math.sin(ph + 0.5) * running + 0.62 * sit;
      dogLegs[2].rotation.x = 0.95 * Math.sin(ph + 2.6) * running + 1.5 * sit; dogLegs[3].rotation.x = 0.95 * Math.sin(ph + 3.1) * running + 1.5 * sit;
      dogTail.rotation.y = 0.7 * Math.sin(time * 9) * (1 - running); dogTail.rotation.x = -0.9 * running;
      const dDog = distTo(tmp2.set(dog.position.x, 0.4, ds));
      dog.visible = dDog < 130;
      far.uniforms.uP.value[3].set(dog.position.x, 0.40, ds);
      const dkd = 1 - 0.45 * ss(110, 220, dDog);                     // far off it is one near-black dot on the pale lane
      far.uniforms.uC.value[3].set(cDog.r * dkd, cDog.g * dkd, cDog.b * dkd, ss(60, 110, dDog));
      // 4. dust, by how far behind the car it lies
      const vCar = fic.speed(Math.min(u, U_FREE - 0.001)) * (u < U_TURN ? 0.0115 : 0.0115 * fic.pace(u) / 0.39);
      dustU.uCarS.value = carS; dustU.uLife.value = Math.min(120, Math.max(4, 6 * vCar));
      dustU.uAmt.value = (variant === 'B' ? 0 : variant === 'C' ? 0.14 : 0.26) * ss(1.5, 8, vCar) * (1 - ss(288, 304, carS));
      // 5. swifts ride with the car; past the turn they are thrown ahead instead
      path.pointAt(Math.min(Math.max(u, 0), 1), tmp);
      swifts.position.copy(tmp); swifts.rotation.y = u > 0.47 ? Math.PI : 0;
      rookU.uM.value = 150 * (Math.min(Math.max(u, 0), 1) - 0.5);
      // 5b. the heron: still in the beck until the car is nearly on the bridge, then up and across
      {
        const kf = ss(HER_U0, HER_U0 + 0.02, u), wt = time * 17;
        heronAt(u, heron.position); heronAt(u + 0.004, tmp2);
        heron.rotation.set(-1.15 * (1 - kf) - 0.18 * kf, kf > 0 ? Math.atan2(tmp2.x - heron.position.x, tmp2.z - heron.position.z) : -0.9, 0, 'YXZ');
        heron.position.y += 0.06 * kf * Math.sin(wt - 1.6);
        for (const [inner, outer, sx] of heronW) {
          inner.rotation.z = sx * ((1 - kf) * -1.30 + kf * (0.12 + 0.72 * Math.sin(wt)));
          outer.rotation.z = sx * ((1 - kf) * 2.45 + kf * (0.05 + 0.62 * Math.sin(wt - 1.0)));
        }
        heron.visible = u > 0.5 && u < 0.93;
      }
      // 6. the car and the glass. Absent at u 0 (the portal picture), there within a few frames of the crossing.
      carried.visible = u > 0;
      car.group.position.copy(tmp); car.group.position.z -= 1.12 * ss(0.44, 0.53, u) + 0.45 * ss(0.60, 0.70, u) + 0.90 * ss(0.74, 0.90, u);      // the child leans forward between the seats, further all the way down the straight, and the car is behind us before the crossing
      // the car rides its springs over the gravel: a few millimetres, only once its body is in the picture
      const rk = ss(0.41, 0.47, u);
      car.group.position.y += rk * (0.0035 * Math.sin(time * 6.9) + 0.0022 * Math.sin(time * 11.3 + 1.0) + 0.0012 * Math.sin(time * 23.7));
      car.group.position.x += rk * (0.0022 * Math.sin(time * 5.3 + 2.0) + 0.0010 * Math.sin(time * 17.1));
      car.group.rotation.z = rk * 0.0035 * Math.sin(time * 4.1 + 0.5);    // the child leans forward between the seats, then further
      // the car is stretched to the lens of the moment, so its rear opening is always the glass's rectangle (phones, resizes)
      const pe = camera.projectionMatrix.elements, tanH = 1 / Math.max(pe[0], 1e-3), tanV = 1 / Math.max(pe[5], 1e-3);
      car.group.scale.set(fic.mirror * Math.max(0.2, tanH - 0.08 * tanV) * car.D / car.hw, 0.92 * tanV * car.D / car.hh, 1);
      const breath = ss(0.24, 0.265, u) - ss(0.31, 0.335, u);
      if (renderer) glass.update(camera, renderer, rear, u, time, breath);
    };
    update(0, 0, { getWorldPosition: (v) => v.set(0, 0, 0), matrixWorld: new THREE.Matrix4(), projectionMatrix: new THREE.Matrix4().makePerspective(-0.4, 0.4, 0.23, -0.23, 0.3, 3000) }, 0);

    return {
      scene, path, duration: 46, pace: fic.pace,
      title: variant === 'B' ? 'Still Waving, First Light' : variant === 'C' ? 'Still Waving, After Rain' : 'Still Waving',
      camera: { fov: 44, near: 0.3, far: 3000, lookAhead: 2, sway: 0.3, bank: 0, nearThrough: 0.3 },      // the lane before the gate is in the portal picture
      portal: { shape: 'circle', radius: 3.3, color: '#CFE3F2', glow: 0.8, revealDistance: 120 },
      post: { exposure: 1.0, bloom: { strength: 0.35, radius: 0.5, threshold: 0.92 }, grade: { saturation: 1.02, contrast: 1.03, vignette: 0.2, grain: 0.02 } },
      ride: 'none', style: 'none', companion: 'none',
      carried,
      update,
      dispose() {},
    };
  },
};
