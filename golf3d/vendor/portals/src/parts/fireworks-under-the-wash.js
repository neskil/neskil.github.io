// FIRE PALACE: hero set piece of "Fireworks Under the Wash", and the wax-resist STYLE KIT for the whole world.
//
// WHAT IT IS. A garden front 121 m wide and 45-49 m high that is fire alone: seven arches, twelve columns, swags,
// entablature, balustrade, ten urns with redrawn flames and a pediment with a sunburst (or, by seed, a dome), all
// of it ~11,500 separate lemon and candle-white wax dabs with nothing between them. From its cornice (y 30) a fall
// of about 800 candle strokes (one in three a broad ribbon laid with the side of the candle, the rest fine), lemon at
// the lip with the side's colour among them, each laid from the top down and lifted again so they stand as separate ribbons
// (a parting as wide as the centre arch and its pairs of columns), pours into a basin of pooled ink scored with 400 wavering
// zigzag reflections (opts.zigN; the world passes 1 and draws its own chains under what stands over the ink). Three Catherine wheels a side turn on stepped terraces, and sixteen rockets
// (plus a rare 40-rocket bouquet) are drawn behind as one stroke up and a willow wept clockwise.
// Local space: origin at the foot of the centre arch, +Y up, front toward +Z (the basin and the approaching camera).
// Port is -X, starboard +X. radius 80 (palace), wheels reach x = +-108, basin z 0..130, rockets z -35..-120.
//
// HOW THE STYLE IS MADE (use these for everything else in the world; nothing here is a filter)
//   wash            shared uniform object. Every material below references the SAME uniforms, so set them once:
//                   uTime, uProg (journey u), uWashO/uWashD (axis: world point of s = 0 and unit travel direction),
//                   uFront (x: s of the dried edge of coat 1, y: front of coat 2, z: front of coat 3, w: wet depth),
//                   uPool, uDamp (1 damp .. 0 dry paper), uGran, uSepia, uPx (radians per pixel), uPal (9 colours).
//   WAX_PALETTE/PAL the nine pigments and their indices. setPalette(list) loads the brief's 7 (or all 9).
//   STYLE_GLSL      coats(worldPos, base) = (coat count, wetness, lip, metres behind the front); inkTone(count) =
//                   exact pigment; paperInk(...) = paper + coats + granulation + wet step + drawn sheen + fringe.
//   paperMaterial({ base, gloss })  ground (base 0), solids (base 1: one coat more), basin (gloss 1). Unlit.
//   skyMaterial() / makeSky()       the sky is the same paper: bands, pale foot, pooled zenith bands, ~1,200 candle
//                   stars with beads, three backruns (opts.backruns: Vector4(dir xyz, angular radius) in world space).
//   WaxBatch        .stroke(A, B|null, C, { w, col, kind, k0, k1, seed, n, zig, bead, pivot, spin }) then
//                   .build({ segs, fringe, margin, spacing, spinAxis }) -> Group (1 draw call, 2 with fringe).
//                   col = PAL index (+ fraction: candle white takes over along the stroke). kind 0 standing, 1 loop
//                   (k0 phase, k1 period s), 2 revealed as uProg runs k0..k1, 3 drawn at uProg k0 over k1, gone by
//                   k0 + 9 k1; 4 a loop laid only while the eye is within `hold` metres of its base; 5 standing only
//                   while the eye is farther than k0..k1 metres (the broad far stroke that stands for a crowd of dabs).
//                   n = surface normal for marks lying on a surface (they foreshorten), omit for marks
//                   in the air. hold (kind 1): the fraction of the loop at which the stroke is lifted; on a zigzag (zig > 0, kinds 0, 2, 3)
//                   hold is its period in metres (0: 0.85); a zigzag never draws thinner than 2.6 px and flattens to a band where its turns would be under a few px. build({ minPx })
//                   sets the least half width in pixels (default 0.75). fringe: true adds the pooled-ink / turquoise-and-sepia pass round each stroke; use
//                   margin 5 for ground strokes (y >= 0.05 above their surface), 2.2 for marks in the air.
//                   spacing (m) thins a crowd with distance so it stays separate marks, never a solid sheet.
//   waxMaterial     the material WaxBatch uses, if you need your own geometry.
//   addWheel / makeWheels, addScroll   the Catherine wheel and the broderie scroll, for the terraces and parterre.
//   drawRocket      one long stroke up and a willow wept clockwise; on uProg, or relaid on the clock with o.loop.
//   washSchedule(u) -> [front2 s, front3 s, pool]: the brief's journey as numbers (palace at s = 300).
// Rules kept: post { flat: 1, exposure 1, bloom 0 }: the colour written is the colour shown, no tone-map inverse.
// Bright = bare wax; dark = coats (#8091AD, #36476A, #131C33); no light, no shadow, no fog; distance = marks thin
// to their flat average and lose their pooled margin. Lines never under 1.5 px; no THREE.Line; no textures at all.
//
// buildHero(ctx, opts): opts.palette (7 or 9 hex), opts.detail 0.6..1, opts.front 'pediment' | 'dome',
//   opts.programme 'rose-turquoise' | 'turquoise-rose' | 'lemon', opts.bouquet (bool), opts.damp (0..1),
//   opts.ground (false if the world lays its own paper under it), opts.groundRadius, opts.driveWash (default true:
//   the hero sets wash.uFront/uPool from washSchedule(u) and the axis from its own world matrix; pass false to
//   drive the wash yourself), opts.preview (adds the sky; on by itself only in the set-piece viewer).
// Returns the contract plus setProgress(u): CALL IT EVERY FRAME with the journey u (fronts, pooling, zigzags and
//   rockets are functions of u; redrawn strokes, wheels and flames run on the clock). Without it the piece plays
//   u 0.3..0.92 on a 44 s loop (the viewer). Also variant, counts.
// anchors (local): portalSeat { position (0, 9, -80), facing +Z, radius 7 }: the hoop in the back court;
//   flyThrough: 8 points from the basin (14, 2.5, 112) through the fall and under the centre arch (16 m wide,
//   22.5 m high, vault 10.5 m deep: 8 m clear each side) to the portal; viewpoints.theImage / palaceWhole /
//   throughTheFall { position, lookAt }; arch; fallLip { y, z, halfWidth }; basin { min, max }; wheelHubs
//   [{ position, radius }]; rocketField (keep |x| > 26 clear behind the hoop); washOrigin, washDir.
// Cost: ~102k triangles (106k with the bouquet), 13 draw calls, 3 shader programs (paper, sky, wax), ~60 ms build,
//   no lights, no textures, no render targets. Expects: paper ground continuing around it (paperMaterial base 0),
//   the sky from makeSky(), exposure 1. Nothing bright is placed behind the portal seat.
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------
// PALETTE (display colours; the world runs post.flat = 1, so what is written is what is shown)
// index: 0 paper/candle, 1 one coat, 2 two coats, 3 three coats/pooled, 4 lemon, 5 rose,
//        6 turquoise, 7 scarlet, 8 sepia fringe
// ---------------------------------------------------------------------------------------------
export const WAX_PALETTE = ['#F6F1E4', '#8091AD', '#36476A', '#131C33', '#F4DC3C', '#EC6A94', '#27B7B4', '#DD2A1E', '#7A5230'];
export const PAL = { PAPER: 0, INK1: 1, INK2: 2, INK3: 3, LEMON: 4, ROSE: 5, TURQ: 6, SCARLET: 7, SEPIA: 8 };

// Shared uniforms: ONE object, referenced by every material made by the factories below, so the
// world sets the wash once and everything (ground, solids, sky, wax, basin, hero) answers together.
export const wash = {
  uTime: { value: 0 },
  uProg: { value: 0 },                                   // journey progress u, 0..1
  uWashO: { value: new THREE.Vector3(0, 0, 300) },       // world position of s = 0 on the wash axis
  uWashD: { value: new THREE.Vector3(0, 0, -1) },        // unit direction of travel of the wash (world)
  uFront: { value: new THREE.Vector4(90, -60, -60, 60) },// x: dried edge of coat 1 (s), y: front of coat 2, z: front of coat 3, w: wet band depth (m)
  uPool: { value: 0 },                                   // 0..1 how far the third coat has pooled in the basin
  uDamp: { value: 1 },                                   // paper weather: 1 damp (big beads, short fingers) .. 0 dry (long dry-brush fingers)
  uGran: { value: 1 },                                   // granulation strength (the two-coat "bluer" night uses ~1.6)
  uSepia: { value: 0 },                                  // 0..1: the heavier sepia fringe (an ink that separates as it dries)
  uSky2: { value: -300 },                               // the same for the second coat (it floods the sky over our heads as the lip passes under us)
  uSky3: { value: -900 },                               // how far ahead of the eye (m, in the sky's projection) the third coat has crossed the sky
  uSheen: { value: 0.86 },                              // grazing angle above which wet ink shows its drawn sheen (the back court lowers it)
  uPx: { value: 0.0025 },                                // radians per pixel (set from the camera in update)
  uPal: { value: WAX_PALETTE.map((h) => new THREE.Color(h)) },
};
export function setPalette(list) {                       // accepts the brief's 7 colours or the full 9
  if (!list || !list.length) return;
  const p = wash.uPal.value;
  if (list.length >= 9) { for (let i = 0; i < 9; i++) p[i].set(list[i]); return; }
  // brief order: paper, ink1, ink3, lemon, rose, turquoise, scarlet
  const map = [0, 1, 3, 4, 5, 6, 7];
  for (let i = 0; i < Math.min(7, list.length); i++) p[map[i]].set(list[i]);
  p[2].copy(p[1]).lerp(p[3], 0.68);                      // the middle depth sits between the two named inks (#36476A with the default palette)
  if (list.length === 7 && list[1].toUpperCase() === '#8091AD' && list[2].toUpperCase() === '#131C33') p[2].set('#36476A');
}

// ---------------------------------------------------------------------------------------------
// STYLE_GLSL: the one routine every shader in this world includes.
//   fwTooth(p)            paper tooth, 0..1, two scales, p in metres (world-anchored or stroke space)
//   coats(wp, base)       -> vec4(coat count 0..3, wetness 0..1, lip 0..1 (dry-brush zone), metres behind the newest front)
//   inkTone(c)            coat count -> exact pigment (paper, #8091AD, #36476A, #131C33), linear
//   paperInk(wp, base, viewDist, grazing, gloss) full paper shading: coats, granulation, wet step, sheen, drying fringe
// ---------------------------------------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
uniform float uTime; uniform float uProg; uniform vec3 uWashO; uniform vec3 uWashD; uniform vec4 uFront;
uniform float uPool; uniform float uDamp; uniform float uGran; uniform float uPx; uniform float uSepia; uniform float uSheen; uniform float uSky2; uniform float uSky3; uniform vec3 uPal[9];
float fwFace = 0.0;                                                    // 0 on level paper .. 1 on an upright face (set by the paper shader before paperInk)
float fwHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float fwVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(fwHash(i), fwHash(i + vec2(1., 0.)), f.x), mix(fwHash(i + vec2(0., 1.)), fwHash(i + vec2(1., 1.)), f.x), f.y); }
float fwTooth(vec2 p){ return 0.62 * fwVn(p * 9.0) + 0.38 * fwVn(p * 31.0 + 17.3); }
vec3 inkTone(float c){ c = clamp(c, 0.0, 3.0);
  vec3 a = mix(uPal[0], uPal[1], clamp(c, 0.0, 1.0)); a = mix(a, uPal[2], clamp(c - 1.0, 0.0, 1.0)); return mix(a, uPal[3], clamp(c - 2.0, 0.0, 1.0)); }
// one front: d = metres behind the lip (negative ahead). Returns (cover, wet, lip)
vec3 fwFront(float d, vec2 sl){
  float finger = mix(4.2, 1.3, uDamp);                               // dry-brush fingers 1 to 3 m long
  float streak = fwVn(vec2(sl.y * 2.3, sl.x * 0.22)) * 0.75 + fwVn(vec2(sl.y * 7.0, sl.x * 0.6)) * 0.25; // long along the travel, narrow across
  float zone = clamp(-d / finger, 0.0, 1.0);                         // 0 at the solid lip, 1 at the finger tips
  float cover = d > 0.0 ? 1.0 : step(zone * 0.9 + 0.12, streak) * step(zone, 0.999);
  cover *= mix(1.0, step(0.34, fwTooth(sl * 0.6)), zone);            // fingers skip the paper's tooth
  float wet = cover * (1.0 - smoothstep(uFront.w * 0.55, uFront.w, d));
  return vec3(cover, wet, cover * (1.0 - clamp(d / 1.5, 0.0, 1.0)));
}
vec4 coats(vec3 wp, float base){
  vec3 r = wp - uWashO; float s = dot(r, uWashD);
  vec3 lat = cross(uWashD, vec3(0., 1., 0.)); float l = dot(r, lat) + r.y * 0.35;
  vec2 sl = vec2(s, l);
  float wob = (fwVn(vec2(l * 0.06, 3.1)) - 0.5) * 9.0 + (fwVn(vec2(l * 0.31, 9.7)) - 0.5) * 2.4;   // the lip is a hand's line, never straight
  // coat 1: dry from the first frame, everything beyond its fringed edge
  float d1 = s - uFront.x + wob * 0.6;
  float c1 = d1 > 0.0 ? 1.0 : step(clamp(-d1 / 2.2, 0.0, 1.0) * 0.9 + 0.15, fwVn(vec2(l * 2.6, s * 0.2))) * step(-2.2, d1);
  vec3 f2 = fwFront(uFront.y + wob - s, sl + 40.0);
  vec3 f3 = fwFront(uFront.z + wob * 1.3 - s, sl + 91.0);
  float c = base + c1 + f2.x + f3.x;
  float back = max(uFront.z + wob * 1.3 - s, 0.0) * f3.x + (1.0 - f3.x) * max(uFront.y + wob - s, 0.0);
  return vec4(min(c, 3.0), max(f2.y, f3.y), max(f2.z, f3.z), back);
}
// the drying-edge fringe of coat 1: a turquoise line and a sepia line (returns rgb, a)
vec4 fwEdgeFringe(vec3 wp, float lw){
  vec3 r = wp - uWashO; float s = dot(r, uWashD); float l = dot(r, cross(uWashD, vec3(0., 1., 0.))) + r.y * 0.35;
  float wob = (fwVn(vec2(l * 0.06, 3.1)) - 0.5) * 9.0 + (fwVn(vec2(l * 0.31, 9.7)) - 0.5) * 2.4;
  float d1 = s - uFront.x + wob * 0.6;
  // lw >= 1 widens both lines so that the dried edge stays a drawn line of a few pixels however far off and however flat it lies
  float brk = step(0.22, fwVn(vec2(l * 0.55, 1.7))) * mix(1.0, step(0.3, fwVn(vec2(l * 3.1, s * 0.4))), step(lw, 1.5));
  float t = 1.0 - smoothstep(0.05 * lw, 0.16 * lw, abs(d1 - 0.12 * lw)); float sp = 1.0 - smoothstep(0.04 * lw, 0.13 * lw, abs(d1 - 0.42 * lw));
  if (lw > 1.5) { t = step(0.5, t); sp = step(0.5, sp); }
  return vec4(mix(uPal[6], uPal[8], max(step(t, sp), uSepia)), max(t, sp) * brk * (0.75 + 0.25 * uSepia));
}
vec3 paperInk(vec3 wp, float base, float viewDist, float grazing, float gloss){
  vec4 k = coats(wp, base);
  float pooled = gloss * step(2.5, k.x);                             // pooled ink never dries: no tooth, all sheen
  k.y = max(k.y, pooled);
  float near = 1.0 - smoothstep(18.0, 60.0, viewDist);               // granulation is gone (its flat average) by 60 m
  vec2 tp = wp.xz + wp.y * vec2(0.37, 0.71);
  float fineA = 1.0 - smoothstep(0.008, 0.03, viewDist * uPx);      // the tooth itself, only while a pixel is finer than it
  float spk = smoothstep(0.38, 0.62, fwTooth(tp * 2.3)) - 0.5;
  float inked = min(k.x, 1.0);
  float sAx = dot(wp - uWashO, uWashD);
  float lAx = dot(wp - uWashO, cross(uWashD, vec3(0., 1., 0.)));
  float soft = (fwVn(tp * vec2(0.5, 1.1)) - 0.5) * 0.2 * near;
  // an upright face is washed in level bands that overlap with a hard, hand-uneven edge (never a soft streak)
  float hb = wp.y * 0.45 + 0.8 * fwVn(vec2(sAx * 0.13, lAx * 0.13 + 4.0)) + 0.35 * fwVn(vec2(sAx * 0.55 + 9.0, lAx * 0.55));
  float hard = (step(0.5, fract(hb)) - 0.5) * 0.22 * (1.0 - smoothstep(70.0, 150.0, viewDist));
  float gran = (spk * 0.55 * fineA + mix(soft, hard, fwFace)) * uGran * inked * (1.0 - 0.75 * k.y);   // dry: pigment settles in the tooth; wet: smooth
  float c = k.x + gran + 0.5 * k.y * inked;                          // wet ink is a step darker than it dries
  // wash bands overlap: level brush bands a few metres wide, a tenth of a coat apart
  c += (step(0.5, fwVn(vec2(sAx / 8.0, lAx / 95.0))) - 0.5) * 0.07 * inked * (1.0 - k.y) * (1.0 - smoothstep(70.0, 200.0, viewDist));   // overlapping level brush bands
  vec3 col = inkTone(c);
  // the drawn sheen: one hard pale band at grazing angles while wet
  float band = step(0.55, fwVn(vec2(sAx * 0.9, dot(wp, cross(uWashD, vec3(0., 1., 0.))) * 0.07) + vec2(-uTime * 0.16, uTime * 0.05)));   // the sheen creeps on downhill with the wash
  float shEdge = uSheen + 0.045 + (fwVn(vec2(lAx * 0.33, sAx * 1.7 + 5.0)) - 0.5) * 0.085 + (fwVn(vec2(lAx * 1.9 + 3.0, sAx * 6.0)) - 0.5) * 0.02;   // the lip of the sheen: a hand's edge, hard
  col = mix(col, uPal[1], 0.55 * step(0.3, k.y) * band * step(shEdge, grazing) * inked * (1.0 - pooled));
  float rip = fwVn(vec2(sAx * 0.16 + uTime * 0.07, dot(wp, cross(uWashD, vec3(0., 1., 0.))) * 1.1 + sin(sAx * 0.8 + uTime * 0.9) * 0.25));
  col = mix(col, uPal[2], pooled * step(0.74, rip) * step(0.945 + (fwVn(vec2(lAx * 0.21, sAx * 0.9 + 2.0)) - 0.5) * 0.05, grazing));   // gloss: thin level strokes of the paler coat, wavering
  vec4 fr = fwEdgeFringe(wp, clamp(6.0 * viewDist * uPx / (0.6 * max(1.0 - grazing, 0.03)), 1.0, 34.0));
  col = mix(col, fr.rgb, fr.a * (1.0 - min(k.x - base - 1.0, 1.0) * 0.6) * step(k.x - base, 1.5) * (1.0 - fwFace));
  return col;
}
`;

// ---------------------------------------------------------------------------------------------
// PAPER: ground, solids (hedges, piers, steps: base = 1, one coat more than the ground), basin
// (gloss = 1). Unlit. Any geometry with normals works; no UVs needed (the tooth is world-anchored).
// ---------------------------------------------------------------------------------------------
const PAPER_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0);
#ifdef USE_INSTANCING
  w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.));
#else
  vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
#endif
  vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const PAPER_FRAG = /* glsl */`
uniform float uBase; uniform float uGloss; varying vec3 vW; varying vec3 vN;
void main(){ vec3 v = cameraPosition - vW; float d = length(v); vec3 vd = v / max(d, 1e-4);
  vec3 nn = normalize(vN); float graz = 1.0 - abs(dot(nn, vd)); fwFace = 1.0 - smoothstep(0.3, 0.6, abs(nn.y));
  gl_FragColor = vec4(paperInk(vW, uBase, d, graz, uGloss), 1.0); }`;
export function paperMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...wash, uBase: { value: o.base ?? 0 }, uGloss: { value: o.gloss ?? 0 } },
    vertexShader: PAPER_VERT, fragmentShader: STYLE_GLSL + PAPER_FRAG,
    side: o.side ?? THREE.FrontSide,
  });
}

// ---------------------------------------------------------------------------------------------
// SKY: the same paper under the same wash. A back-faced sphere that follows the camera
// (mesh.position = camera world position each frame; the hero's preview does this itself).
// Direction stands for position: the wash crosses the sky in step with the ground front.
// Level brush bands, one coat paler in the lowest 10 degrees, the third coat pooled in two long
// bands near the zenith, ~1,200 candle-dot stars each with a dark bead, three hard-edged backruns.
// ---------------------------------------------------------------------------------------------
const SKY_FRAG = /* glsl */`
uniform vec4 uBackrun[3]; varying vec3 vDir;
void main(){ vec3 dir = vDir / max(length(vDir), 1e-4);
  float el = clamp(dir.y, -1.0, 1.0);
  vec3 lat = cross(uWashD, vec3(0., 1., 0.));
  float along = dot(dir, uWashD), across = dot(dir, lat);
  float k = 70.0 / (max(el, 0.0) + 0.28);
  vec3 wp = vec3(0.); wp = uWashO + uWashD * (dot(cameraPosition - uWashO, uWashD) + along * k) + lat * (dot(cameraPosition - uWashO, lat) + across * k);
  // the second and third coats cross the sky ahead of the ground fronts (uSky2, uSky3: metres ahead of the eye in this
  // projection): overhead as the lip passes under us, down to the far horizon soon after, so the fountains leap out
  // against two coats and the night ends blue-black above its paler foot. Their lips are fingered like the ground's.
  vec2 skl = vec2(along * k, across * k) / 7.0; float swob = (fwVn(vec2(across * 2.6, 7.7)) - 0.5) * 46.0;
  vec3 f2s = fwFront((uSky2 - along * k + swob) / 7.0, skl + 47.0), f3s = fwFront((uSky3 - along * k - swob * 0.8) / 7.0, skl + 13.0);
  float s3 = f3s.x; vec4 c4 = vec4(1.0 + f2s.x + f3s.x, max(f2s.y, f3s.y), 0.0, 0.0);
  float c = c4.x;                                                     // the sky has its first coat from the first frame
  float bandN = fwVn(vec2(across * 1.5, el * 40.0));
  c += (step(0.5, fract(el * 11.0 + bandN * 0.6)) - 0.5) * 0.09;      // wide level brush bands, overlapping
  c -= 0.85 * (1.0 - smoothstep(0.02, 0.17, el + (bandN - 0.5) * 0.03)) * step(1.5, c);   // one coat paler near the horizon
  c -= 0.18 * (1.0 - smoothstep(0.0, 0.2, el)) * (1.0 - step(1.5, c));                    // the first coat thins toward the horizon
  float zb = 2.0 - smoothstep(0.0, 0.035, abs(el - 0.80 - (bandN - 0.5) * 0.05)) - smoothstep(0.0, 0.03, abs(el - 0.66 - (fwVn(vec2(across * 2.3, 5.)) - 0.5) * 0.06));
  c += 0.9 * min(zb, 1.0) * s3;                                       // third coat pooled in two long bands
  c += 0.4 * c4.y;
  // backruns: where fresh wash met damp. Paler inside, a dark crinkled hard edge. They stand for smoke.
  float px = max(fwidth(el), 1e-5);
  for (int i = 0; i < 3; i++){
    vec3 bd = uBackrun[i].xyz; vec3 q = dir - bd; float rr = uBackrun[i].w;
    vec3 bu = normalize(cross(bd, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)); vec3 bv = cross(bu, bd); vec2 q2 = vec2(dot(q, bu), dot(q, bv) * 1.5) / max(rr, 1e-4);
    float rad = length(q2); vec2 qd = q2 / max(rad, 1e-4);
    float ang = atan(q2.y, q2.x + sign(q2.x + 1e-6) * 1e-5), wv = fwVn(qd * 1.3 + float(i) * 9.1 + 4.0);
    float lobe = sqrt(abs(sin(ang * 2.5 + float(i) * 2.1 + 5.5 * wv))), lobe2 = sqrt(abs(sin(ang * 8.0 + 7.0 * fwVn(qd * 3.1 + float(i) * 3.3))));
    float cr = 0.42 + 0.34 * wv + 0.2 * lobe + 0.07 * lobe2;
    float inside = step(rad, cr);
    float edge = inside * step(cr - 0.045 - 0.03 * lobe2, rad);                     // the pigment line the bloom pushed out: dark, hard
    float inner = step(cr * (0.5 + 0.16 * lobe2 + 0.12 * wv), rad);                 // a second, smaller bloom inside: two flat steps, no gradient
    c += (edge * 0.75 - inside * (1.0 - edge) * (0.42 + 0.4 * inner)) * step(1.5, c4.x) * step(1e-4, rr);
  }
  vec3 col = inkTone(c);
  // stars: candle dots the ink could not wet, each with a dark bead beside it
  vec2 sp = dir.xz / (1.0 + max(el, -0.5)) * 34.0; vec2 ci = floor(sp), cf = fract(sp);
  float h = fwHash(ci), h2 = fwHash(ci + 7.7);
  vec2 sc = vec2(0.25 + 0.5 * h2, 0.25 + 0.5 * fwHash(ci + 3.1));
  float spx = max(fwidth(sp.x), 1e-5);
  float sr = max(0.035 + 0.05 * h2, 1.1 * spx);
  float star = step(0.52, h) * (1.0 - smoothstep(sr - spx, sr, length(cf - sc) + (fwVn(sp * 9.0) - 0.5) * 0.03));
  float bead = step(0.52, h) * (1.0 - smoothstep(sr * 0.55 - spx, sr * 0.55, length(cf - sc - vec2(sr * 1.25, -sr * 0.9))));
  float vis = smoothstep(0.03, 0.12, el);
  col = mix(col, uPal[3], bead * vis * step(1.5, c4.x));
  col = mix(col, uPal[0], star * vis);
  gl_FragColor = vec4(col, 1.0); }`;
export function skyMaterial(o = {}) {
  const br = o.backruns ?? [new THREE.Vector4(-0.33, 0.42, -0.84, 0.16), new THREE.Vector4(0.1, 0.55, -0.83, 0.12), new THREE.Vector4(0.42, 0.36, -0.83, 0.2)];
  return new THREE.ShaderMaterial({
    uniforms: { ...wash, uBackrun: { value: br } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }',
    fragmentShader: STYLE_GLSL + SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false,
  });
}

// ---------------------------------------------------------------------------------------------
// WAX: every stroke and dab is one instance of a ribbon whose spine is a quadratic curve
// A -> (B) -> C. Coverage is pressure against a tooth noise in STROKE SPACE (metres along and
// across), so edges are broken and flecked and the marks foreshorten with their surface.
//   iN   xyz fixed surface normal (0,0,0 = turn about the spine to face the eye), w = half width (m)
//   iK   x palette index (+ fraction f: fades to candle white along the stroke, white at t = 1/(4f)),
//        y draw clock: 0 standing, 1 loop (z = phase 0..1, w = period s), 2 revealed as uProg runs z..w,
//          3 drawn from uProg z over w, erased from z+8w to z+9w
//        z,w clock values
//   iS   x seed 0..1, y zigzag amplitude (m, 0 = none), z bead amount 0..1, w hold (kinds 1, 4) or, on a zigzag, its period in metres (0: 0.85)
//   iSpin  xyz pivot, w radians per second about the material's uSpin axis (wheels)
// Two passes share geometry and program: uPass 0 = the pooled ink and drying fringe around the
// stroke (blended, behind), uPass 1 = the opaque wax with its beads.
// ---------------------------------------------------------------------------------------------
const WAX_VERT = /* glsl */`
attribute vec3 iA; attribute vec3 iB; attribute vec3 iC; attribute vec4 iN; attribute vec4 iK; attribute vec4 iS; attribute vec4 iSpin;
uniform float uPass; uniform vec4 uSpin; uniform float uMargin; uniform float uThin; uniform float uMinPx;
varying vec2 vUV; varying vec3 vCol; varying vec2 vRange; varying vec4 vDim; varying vec4 vMisc; varying vec3 vW; varying float vFade; varying float vFlat; varying float vFlat2; varying float vPer;
vec3 fwRot(vec3 p, vec3 piv, vec3 ax, float a){ vec3 r = p - piv; float c = cos(a), s = sin(a); return piv + r * c + cross(ax, r) * s + ax * dot(ax, r) * (1.0 - c); }
void main(){
  float t = position.x, side = position.y;
  vec3 A = iA, B = iB, C = iC;
  if (uSpin.w > 0.5) { float a = iSpin.w * uTime; A = fwRot(A, iSpin.xyz, uSpin.xyz, a); B = fwRot(B, iSpin.xyz, uSpin.xyz, a); C = fwRot(C, iSpin.xyz, uSpin.xyz, a); }
  A = (modelMatrix * vec4(A, 1.0)).xyz; B = (modelMatrix * vec4(B, 1.0)).xyz; C = (modelMatrix * vec4(C, 1.0)).xyz;
  float Lc = length(B - A) + length(C - B);
  float it = 1.0 - t;
  vec3 P = it * it * A + 2.0 * it * t * B + t * t * C;
  vec3 T = 2.0 * it * (B - A) + 2.0 * t * (C - B) + (C - A) * 1e-3;
  T = T / max(length(T), 1e-5);
  vec3 toEye = cameraPosition - P; float dist = length(toEye);
  float pxm = dist * uPx;
  P += T * (t - 0.5) * max(0.0, 1.6 * pxm - Lc);                        // never shorter than a pixel and a half either
  vec3 nrm = iN.xyz; float fixedN = step(0.25, dot(nrm, nrm));
  vec3 sv = cross(T, mix(toEye, mat3(modelMatrix) * nrm, fixedN));
  sv = sv / max(length(sv), 1e-5);
  // draw clock
  float kind = iK.y, e = 0.0, r = 1.0;
  if ((kind > 0.5 && kind < 1.5) || (kind > 3.5 && kind < 4.5)) { float per = max(iK.w, 0.2); float x = fract(uTime / per + iK.z); float lay = min(clamp(Lc / 13.0, 0.12, 0.7) / per, 0.45);          // laid at hand speed: 13 m a second, a dab pressed in an eighth
    float endAt = (iS.w > 0.0 && kind < 3.5) ? iS.w : 1.0;                               // iS.w: lifted early (a willow's strokes all go with their rocket)
    r = smoothstep(0.0, lay, x); e = smoothstep(endAt - lay, endAt, x); }
  else if (kind > 1.5 && kind < 2.5) { r = smoothstep(iK.z, max(iK.w, iK.z + 1e-3), uProg); }
  else if (kind > 2.5 && kind < 3.5) { float w = max(iK.w, 1e-3); r = smoothstep(iK.z, iK.z + w, uProg); e = smoothstep(iK.z + 8.0 * w, iK.z + 9.0 * w, uProg); }
  float gate = 1.0;
  if (kind > 3.5) { float dA = length(cameraPosition - A);
    if (kind < 4.5) r *= 1.0 - smoothstep(iS.w * 0.72, max(iS.w, 1.0), dA);      // laid base to tip as the eye comes within reach
    else gate = smoothstep(iK.z, max(iK.w, iK.z + 1.0), dA); }                  // a far mark: the bold stroke that stands for a crowd of fine ones
  float live = step(e + 0.002, r);
  // width: never under 1.5 pixels; the pooled margin shrinks to nothing once the stroke is a pixel wide
  float W = iN.w; float zig = iS.y;
  // a crowd of strokes thins with distance (by seed) so it stays separate marks about 2.5 px apart, never a solid sheet
  float keep = uThin > 0.0 ? clamp(uThin / max(pxm * 2.5, 1e-4), 0.0, 1.0) : 1.0;
  live *= 1.0 - smoothstep(keep * 0.85, keep * 1.15 + 0.01, fract(iS.x * 7.31 + 0.137));
  float far = clamp((0.75 * pxm - 0.5 * W) / max(W, 1e-4), 0.0, 1.0);
  // a mark lying flat is foreshortened at a grazing angle: a batch built with minPx over 1 widens it on its surface so
  // that it never shows thinner than that on screen (far rows of broderie merge to fewer, bolder strokes, not speckle)
  float fs = 1.0; if (fixedN > 0.5 && uMinPx > 1.01) fs = max(length(cross(sv, toEye / max(dist, 1e-4))), 0.06);
  float Wd = max(W, uMinPx * pxm / fs);
  float M = mix(uMargin, 1.08, far);
  float R = (Wd + zig) * M * live * gate * smoothstep(1.0, 1.7, dist);       // strokes within 1.2 m of the lens scale to zero
  vec3 wp = P + sv * side * R;
  wp -= toEye / max(dist, 1e-4) * (1.0 - uPass) * 0.012;              // the pooled pass sits a hair behind the wax
  float L = Lc;
  vUV = vec2(t, side); vRange = vec2(e, r); vDim = vec4(L, Wd, max(R, 1e-5), zig); vMisc = vec4(iS.x, pxm, far, iS.z); vW = wp; vPer = iS.w;
  float ci = floor(iK.x + 1e-3); float cf = iK.x - ci;
  vCol = uPal[int(ci)]; vFade = clamp(t * cf * 4.0, 0.0, 1.0); vFlat = fixedN * step(ci, 0.5); vFlat2 = fixedN;
  vec4 clip = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  gl_Position = clip; }`;
const WAX_FRAG = /* glsl */`
uniform float uPass; varying vec2 vUV; varying vec3 vCol; varying vec2 vRange; varying vec4 vDim; varying vec4 vMisc; varying vec3 vW; varying float vFade; varying float vFlat; varying float vFlat2; varying float vPer;
void main(){
  if (vUV.x < vRange.x || vUV.x > vRange.y) discard;
  float L = vDim.x, W = vDim.y, R = vDim.z, zig = vDim.w, seed = vMisc.x, pxm = vMisc.y, far = vMisc.z;
  float x = vUV.x * L, y = vUV.y * R, band = 0.0, zmin = 0.0;
  if (zig > 0.0) {                                                     // a hand's zigzag: uneven pitch and swing, wavering on the ink
    float per = (vPer > 0.05 ? vPer : 0.85) * (0.75 + 0.6 * fwVn(vec2(seed * 40.0, 1.0)));     // vPer: a lazier, broader wave where the hand asks for one
    float fx = max(fwidth(x), 1e-5), fy = max(pxm, 1e-5);              // metres to a pixel along the stroke (it lies flat: foreshortened) and across it
    float ph = x / per + seed * 7.0 + 0.55 * fwVn(vec2(x * 0.45, seed * 23.0));
    float tr0 = abs(fract(ph) - 0.5) * 4.0 - 1.0, tri = tr0 * (1.5 - 0.5 * tr0 * tr0);                    // the turns are round, not points
    // seen end-on a zigzag stays a lazy wave (its swing never more than 0.7 of the pitch it shows), and where its turns
    // would be finer than a few pixels it is its flat average: one narrow band of the wax, a column of light. No sawteeth.
    float fz = smoothstep(3.0, 9.0, per / fx);
    float amp = min(zig * (0.45 + 0.55 * fwVn(vec2(x * 0.3 + 3.0, seed * 71.0))), 0.7 * per * fy / fx) * (0.8 + 0.2 * sin(uTime * 1.3 + seed * 40.0 + x * 0.4));
    band = zig * (1.0 - fz) * (0.3 + 0.3 * fwVn(vec2(x * 0.5 + 9.0, seed * 53.0)));
    y += 0.07 * sin(uTime * 0.8 + x * 0.6 + seed * 20.0);
    float slope = 6.0 * amp / per * (1.0 - tr0 * tr0), c2 = 1.0 / (1.0 + slope * slope);
    zmin = 2.6 * sqrt(c2 * fy * fy + (1.0 - c2) * fx * fx);            // the line never under about 5 px, whichever way it runs across the ink
    y = (y - amp * tri) * sqrt(c2); }
  float fine = 1.0 - smoothstep(0.02, 0.07, pxm);                    // tooth finer than ~3 px becomes its flat average
  float press = 0.70 + 0.30 * fwVn(vec2(x * 1.4 + seed * 31.0, seed * 57.0));
  float cap = min(W * 1.6, L * 0.3);
  float ends = clamp(x / max(cap, 1e-4), 0.0, 1.0) * clamp((vRange.y * L - x) / max(cap, 1e-4) + 0.25, 0.0, 1.0) * clamp((L - x) / max(cap, 1e-4), 0.0, 1.0);
  float fat = mix(1.12, 0.78, clamp(x / max(min(L, 1.2), 1e-4), 0.0, 1.0));            // fat where it was pressed, thinner where it lifted
  float hw = (max(W * press * fat, zmin) + band) * sqrt(clamp(ends, 0.0, 1.0));
  float edgeN = (fwTooth(vec2(x, y) * 1.7 + seed * 13.0) - 0.5) * W * 0.9 * mix(0.25, 1.0, fine);
  float d = abs(y) - hw + edgeN;
  float tooth = fwTooth(vec2(x * 0.55, y * 3.4) + seed * 3.0);        // the crayon skips the tooth in streaks along the stroke
  float hole = step(0.55 + 0.36 * press, tooth + 0.5 * (1.0 - step(0.16, fwVn(vec2(x * 0.7 + seed * 17.0, seed * 91.0))))) * fine;
  float wax = step(d, 0.0) * (1.0 - hole);
  vec4 k = coats(vW, 0.0); float inked = min(k.x, 1.0);
  if (uPass > 0.5) {
    if (wax < 0.5) discard;
    // a second crayon over the first: candle white takes over through the tooth, never as a gradient
    vec3 col = mix(vCol, uPal[0], mix(vFade, step(fwTooth(vec2(x * 0.9, y * 2.0) * 1.3 + seed * 29.0) * 0.8 + 0.1, vFade), fine));
    // on bare paper a candle mark is seen only by its tooth: flecks of the palest wash caught along its edges
    // (all over it, densest along its edges; farther off than the tooth can be seen, their flat average)
    if (vFlat > 0.5 && inked < 0.5) col = mix(col, uPal[1], mix(0.4, step(0.5, fwTooth(vec2(x * 1.3, y * 2.2) * 2.4 + seed * 7.0)) * mix(0.6, 1.0, step(-W * 0.6, d)), fine));
    // beads: the ink stands on the wax in droplets, each with a paper-white window; they swell behind the lip and some roll
    float amt = vMisc.w * k.y * fine * smoothstep(0.3, 5.0, k.w);
    if (amt > 0.01) {
      for (int i = 0; i < 2; i++) {
        float fi = float(i); vec2 bp = vec2(x - fi * uTime * 0.11 * uDamp, y) / mix(0.12, 0.085, fi) + seed * 19.0 + fi * 5.3;
        vec2 id = floor(bp), f = fract(bp) - 0.5; float h = fwHash(id + fi * 3.7), h2 = fwHash(id + 11.1);
        float rad = (0.16 + 0.26 * h2) * amt * mix(0.6, 1.0, uDamp) * step(0.45 + 0.2 * fi, h);
        vec2 q = f - (vec2(h2, h) - 0.5) * 0.3; float bd = length(q);
        if (bd < rad) { col = uPal[3]; if (abs(q.x + rad * 0.32) < rad * 0.22 && abs(q.y - rad * 0.3) < rad * 0.2) col = uPal[0]; }
      }
    }
    gl_FragColor = vec4(col, 1.0);
  } else {
    if (wax > 0.5 || far > 0.98) discard;
    float F = max(R - W, 1e-4) * 0.85; float q = clamp(1.0 - d / F, 0.0, 1.0);
    float wet = k.y;
    float puddle = step(1.0 - q, 0.22 + 0.34 * fwVn(vec2(x, y) * 4.0 + seed * 5.0) + 0.1 * fwVn(vec2(x, y) * 13.0 + seed * 9.0));      // the pool has a hard crinkled shore
    float a = inked * puddle * step(0.25, wet + 0.5 * step(k.x, 1.5));
    vec3 col = inkTone(min(k.x + 1.0 + 0.5 * k.y, 3.0));                                   // one flat tone: a coat deeper than the wash it stands in
    // on bare paper the wax is seen by its tooth shadow: flecks of the palest wash caught against its edge, a flat tone, broken
    float shade = (1.0 - inked) * step(0.4, q) * mix(0.55, step(0.3, fwTooth(vec2(x * 1.3, y * 2.2) * 1.6 + seed * 7.0)), fine) * step(0.5, vFlat2);
    if (shade > 0.5) { a = 1.0; col = uPal[1]; }
    // dry: the pool leaves a turquoise line and a sepia line
    float tl = (1.0 - smoothstep(0.05, 0.14, abs(q - 0.72))) * fine * (1.0 - 0.7 * uSepia), sl = (1.0 - smoothstep(0.03, mix(0.16, 0.075, uSepia), abs(q - mix(0.4, 0.3, uSepia)))) * fine;
    float dry = (1.0 - wet) * inked * step(mix(0.4, 0.27, uSepia), fwVn(vec2(x * mix(0.9, 1.6, uSepia) + seed * 9.0, 2.0)));
    col = mix(col, uPal[6], tl * dry); a = max(a, tl * dry * 0.7);
    col = mix(col, uPal[8], sl * dry * (1.0 - tl)); a = max(a, sl * dry * (0.6 + 0.25 * uSepia));
    if (a < 0.03) discard;
    gl_FragColor = vec4(col * a, a);
  }
}`;
// waxMaterial({ pass: 1 | 0, margin, spinAxis }): pass 1 opaque wax, pass 0 the pooled fringe.
export function waxMaterial(o = {}) {
  const pass = o.pass ?? 1; const ax = o.spinAxis;
  const m = new THREE.ShaderMaterial({
    uniforms: { ...wash, uPass: { value: pass }, uMargin: { value: pass ? 1.12 : (o.margin ?? 2.4) }, uSpin: { value: ax ? new THREE.Vector4(ax.x, ax.y, ax.z, 1) : new THREE.Vector4(0, 0, 1, 0) }, uThin: { value: o.spacing ?? 0 }, uMinPx: { value: o.minPx ?? 0.75 } },
    vertexShader: STYLE_GLSL + WAX_VERT, fragmentShader: STYLE_GLSL + WAX_FRAG, side: THREE.DoubleSide,
  });
  if (!pass) { m.transparent = true; m.depthWrite = false; m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor; }
  return m;
}

// ---------------------------------------------------------------------------------------------
// WaxBatch: collect strokes, then make the meshes. One batch = one draw call (two with fringe).
//   const b = new WaxBatch(1000);
//   b.stroke(A, B, C, { w, col, kind, k0, k1, seed, n, zig, bead, pivot, spin })   // A,B,C: [x,y,z]; B = null for a straight dab
//   scene.add(b.build({ segs: 4, fringe: true }));
// ---------------------------------------------------------------------------------------------
function ribbonGeometry(segs) {
  const pos = new Float32Array((segs + 1) * 2 * 3), idx = [];
  for (let i = 0; i <= segs; i++) { pos[i * 6] = i / segs; pos[i * 6 + 1] = -1; pos[i * 6 + 3] = i / segs; pos[i * 6 + 4] = 1; }
  for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
export class WaxBatch {
  constructor(cap = 1024) { this.cap = cap; this.n = 0; this._alloc(cap); }
  _alloc(cap) {
    const old = this.A; const mk = (k, sz) => { const a = new Float32Array(cap * sz); if (old) a.set(this[k].subarray(0, this.n * sz)); this[k] = a; };
    mk('A', 3); mk('B', 3); mk('C', 3); mk('N', 4); mk('K', 4); mk('S', 4); mk('P', 4); this.cap = cap;
  }
  stroke(a, b, c, o) {
    if (this.n >= this.cap) this._alloc(this.cap * 2);
    const i = this.n++, i3 = i * 3, i4 = i * 4;
    this.A[i3] = a[0]; this.A[i3 + 1] = a[1]; this.A[i3 + 2] = a[2];
    this.C[i3] = c[0]; this.C[i3 + 1] = c[1]; this.C[i3 + 2] = c[2];
    if (b) { this.B[i3] = b[0]; this.B[i3 + 1] = b[1]; this.B[i3 + 2] = b[2]; }
    else { this.B[i3] = (a[0] + c[0]) / 2; this.B[i3 + 1] = (a[1] + c[1]) / 2; this.B[i3 + 2] = (a[2] + c[2]) / 2; }
    const n = o.n; if (n) { this.N[i4] = n[0]; this.N[i4 + 1] = n[1]; this.N[i4 + 2] = n[2]; }
    this.N[i4 + 3] = o.w ?? 0.08;
    this.K[i4] = o.col ?? 0; this.K[i4 + 1] = o.kind ?? 0; this.K[i4 + 2] = o.k0 ?? 0; this.K[i4 + 3] = o.k1 ?? 1;
    this.S[i4] = o.seed ?? 0.5; this.S[i4 + 1] = o.zig ?? 0; this.S[i4 + 2] = o.bead ?? 1; this.S[i4 + 3] = o.hold ?? 0;
    const p = o.pivot; if (p) { this.P[i4] = p[0]; this.P[i4 + 1] = p[1]; this.P[i4 + 2] = p[2]; this.P[i4 + 3] = o.spin ?? 0; }
    return i;
  }
  build(o = {}) {
    const n = this.n, g = new THREE.InstancedBufferGeometry(), base = ribbonGeometry(o.segs ?? 1);
    g.setAttribute('position', base.getAttribute('position')); g.setIndex(base.getIndex());
    const at = (name, arr, sz) => g.setAttribute(name, new THREE.InstancedBufferAttribute(arr.subarray(0, n * sz), sz));
    at('iA', this.A, 3); at('iB', this.B, 3); at('iC', this.C, 3); at('iN', this.N, 4); at('iK', this.K, 4); at('iS', this.S, 4); at('iSpin', this.P, 4);
    g.instanceCount = n;
    const bb = new THREE.Box3();
    for (let i = 0; i < n * 3; i += 3) { bb.expandByPoint(_v.set(this.A[i], this.A[i + 1], this.A[i + 2])); bb.expandByPoint(_v.set(this.C[i], this.C[i + 1], this.C[i + 2])); bb.expandByPoint(_v.set(this.B[i], this.B[i + 1], this.B[i + 2])); }
    g.boundingSphere = new THREE.Sphere(); bb.getBoundingSphere(g.boundingSphere); g.boundingSphere.radius += 2 + (o.pad ?? 0); g.boundingBox = bb;
    const grp = new THREE.Group();
    if (o.fringe) { const f = new THREE.Mesh(g, waxMaterial({ pass: 0, margin: o.margin, spinAxis: o.spinAxis, spacing: o.spacing, minPx: o.minPx })); f.renderOrder = (o.renderOrder ?? 2) - 1; grp.add(f); }
    const m = new THREE.Mesh(g, waxMaterial({ pass: 1, spinAxis: o.spinAxis, spacing: o.spacing, minPx: o.minPx })); m.renderOrder = o.renderOrder ?? 2; grp.add(m);
    grp.userData.count = n; return grp;
  }
}
const _v = new THREE.Vector3();

// ---------------------------------------------------------------------------------------------
// The dab pen: lays 25-40 cm dabs along a path, uneven and a little off the line, and gives them
// loop clocks whose phase runs along the path, so a hand is seen going over every line again.
// ---------------------------------------------------------------------------------------------
// a second hand's random numbers (so marks added later leave the first hand's draws as they were)
function hand2(seed) { let sd = seed % 2147483647 || 7; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  r.range = (a, c) => a + (c - a) * r(); r.chance = (p) => r() < p; r.sign = () => (r() < 0.5 ? -1 : 1); return r; }
function makePen(b, rng) {
  const P = [0, 0, 0], Q = [0, 0, 0];
  const pen = {
    count: 0, batch: b,
    // fn(s, out) -> point at arc length s; L total length
    run(fn, L, o = {}) {
      const pitch = (o.pitch ?? 0.38) / (pen.density ?? 1), n = Math.max(1, Math.round(L / pitch));
      const per = o.per ?? rng.range(2.3, 2.9), ph = o.ph ?? rng(), wl = per * (o.hand ?? 9), dir = rng.sign();
      const w = o.w ?? 0.115, jit = o.jit ?? 0.07, white = o.white ?? 0.25, col = o.col ?? PAL.LEMON;
      for (let i = 0; i < n; i++) {
        const s = (i + 0.5 + rng.range(-0.3, 0.3)) * (L / n), len = rng.range(0.25, 0.4) * (o.len ?? 1);
        if (o.turn && rng.chance(0.1)) continue;                                            // the hand skips one
        fn(Math.max(0, s - len * 0.5), P); fn(Math.min(L, s + len * 0.5), Q);
        let dx = Q[0] - P[0], dy = Q[1] - P[1], dz = Q[2] - P[2]; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
        // off the line: turn the dab a little and shift it sideways (in the plane of the path and up)
        const turn = rng.range(-0.5, 0.5) * (o.turn ?? 1), ox = -dy, oy = dx, off = rng.range(-jit, jit), h = len * 0.5;
        const mx = (P[0] + Q[0]) / 2 + ox * off, my = (P[1] + Q[1]) / 2 + oy * off, mz = (P[2] + Q[2]) / 2 + (Math.abs(dz) > 0.7 ? 0 : rng.range(-jit, jit));
        const ex = dx + ox * turn, ey = dy + oy * turn;
        const flip = rng.chance(0.5) ? 1 : -1;
        b.stroke([mx - ex * h * flip, my - ey * h * flip, mz - dz * h * flip], null, [mx + ex * h * flip, my + ey * h * flip, mz + dz * h * flip], {
          w: w * rng.range(0.75, 1.3), col: rng.chance(white) ? PAL.PAPER : col, kind: o.kind ?? 1, k0: (ph + dir * s / wl + 100) % 1, k1: per, seed: rng(), bead: o.bead ?? 1, hold: o.hold ?? 0 });
      }
      pen.count += n;
    },
    line(x0, y0, z0, x1, y1, z1, o) { const L = Math.hypot(x1 - x0, y1 - y0, z1 - z0); if (L < 0.05) return; pen.run((s, out) => { const t = s / L; out[0] = x0 + (x1 - x0) * t; out[1] = y0 + (y1 - y0) * t; out[2] = z0 + (z1 - z0) * t; }, L, o); },
    // arc in the XY plane at depth z, angles in radians from +X counter-clockwise; rx, ry radii
    arc(cx, cy, z, rx, ry, a0, a1, o) { const L = Math.abs(a1 - a0) * (rx + ry) * 0.5; if (L < 0.05) return; pen.run((s, out) => { const a = a0 + (a1 - a0) * (s / L); out[0] = cx + Math.cos(a) * rx; out[1] = cy + Math.sin(a) * ry; out[2] = z; }, L, o); },
    // spiral (volutes, rosettes)
    spiral(cx, cy, z, r0, r1, a0, a1, o) { const L = Math.abs(a1 - a0) * (r0 + r1) * 0.5; pen.run((s, out) => { const t = s / L, a = a0 + (a1 - a0) * t, r = r0 + (r1 - r0) * t; out[0] = cx + Math.cos(a) * r; out[1] = cy + Math.sin(a) * r; out[2] = z; }, L, o); },
  };
  return pen;
}

// The garden front. Local space: facade plane z = 0, x -60..60, y 0..45, columns stand proud at z = +2.2.
async function drawPalace(ctx, pen, rng, V) {
  const W = { white: 0.9 }, Y = { white: 0.12 }, MIX = { white: 0.35 };
  const arches = [[0, 8, 14]]; for (const s of [-1, 1]) for (const x of [18.5, 32.5, 46.5]) arches.push([s * x, 4.5, 10.5]);
  // plinth, broken at the openings
  const xs = arches.map((a) => [a[0] - a[1], a[0] + a[1]]).sort((p, q) => p[0] - q[0]); let x0 = -60;
  for (const [l, r] of xs.concat([[60, 60]])) { pen.line(x0, 0.45, 0, l, 0.45, 0, Y); pen.line(x0, 1.4, 0, l, 1.4, 0, MIX); x0 = r; }
  await ctx.yield();
  // arches: jambs, imposts, double archivolt, keystone, a ring behind for depth
  for (const [cx, hw, sp] of arches) {
    const big = hw > 6, BIG = { w: 0.074, len: 1.55, pitch: 0.47, jit: 0.09, turn: 1.15, hold: 0.8, hand: 3.2, per: undefined };
    const B = (o) => (big ? { ...o, ...BIG, per: 1.7 + 0.9 * rng() } : o);
    for (const s of [-1, 1]) {
      pen.line(cx + s * hw, 1.4, 0, cx + s * hw, sp, 0, B(W)); pen.line(cx + s * (hw + 0.95), 1.4, 0, cx + s * (hw + 0.95), sp, 0, B(Y));
      pen.line(cx + s * (hw - 0.3), sp, 0, cx + s * (hw + 1.7), sp, 0, Y); pen.line(cx + s * (hw - 0.2), sp + 0.55, 0, cx + s * (hw + 1.5), sp + 0.55, 0, W);
    }
    pen.arc(cx, sp + 0.55, 0, hw, hw, 0, Math.PI, B(W)); pen.arc(cx, sp + 0.55, 0, hw + 0.95, hw + 0.95, 0, Math.PI, B(Y));
    if (big) { pen.arc(cx, sp + 0.55, 0, hw + 1.9, hw + 1.9, 0.04, Math.PI - 0.04, B(Y)); pen.arc(cx, sp + 0.55, 0, hw - 0.9, hw - 0.9, 0.05, Math.PI - 0.05, B({ white: 0.5 })); }
    const top = sp + 0.55 + hw; for (const dx of [-0.55, 0, 0.55]) pen.line(cx + dx * 1.2, top - 0.3, 0, cx + dx * 1.7, top + (big ? 2.6 : 1.7), 0, dx === 0 ? W : Y);
    // the vault behind: rings going back, and lines along the springing and the crown
    const rings = big ? [-3.5, -7, -10.5] : [-5.5];
    for (const z of rings) { pen.arc(cx, sp + 0.55, z, hw, hw, 0, Math.PI, B({ white: big ? 0.3 : 0.7, pitch: 0.5 })); for (const s of [-1, 1]) pen.line(cx + s * hw, 1.0, z, cx + s * hw, sp + 0.55, z, B({ white: 0.6, pitch: 0.55 })); }
    const zb = rings[rings.length - 1];
    for (const s of [-1, 1]) pen.line(cx + s * hw, sp + 0.55, 0, cx + s * hw, sp + 0.55, zb, B({ white: 0.5, pitch: 0.5 }));
    if (big) { pen.line(cx, top, 0, cx, top, zb, B(W)); for (const s of [-1, 1]) pen.line(cx + s * hw * 0.71, sp + 0.55 + hw * 0.71, 0, cx + s * hw * 0.71, sp + 0.55 + hw * 0.71, zb, B({ white: 0.2 })); }
    await ctx.yield();
  }
  // spandrel rosettes between the arches
  for (const s of [-1, 1]) for (const x of [18.5, 32.5, 46.5]) { const cx = s * x, cy = 21.4;
    pen.arc(cx, cy, 0, 1.7, 1.7, 0, Math.PI * 2, Y); pen.arc(cx, cy, 0, 0.5, 0.5, 0, Math.PI * 2, W);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2; pen.line(cx + Math.cos(a) * 0.7, cy + Math.sin(a) * 0.7, 0, cx + Math.cos(a) * 1.45, cy + Math.sin(a) * 1.45, 0, { col: V.accent[s < 0 ? 0 : 1], white: 0.1, per: 1.6 }); } }
  // twelve columns, standing proud of the wall
  const cols = []; for (const s of [-1, 1]) for (const x of [10.4, 13.4, 25.5, 39.5, 53.6, 57.2]) cols.push(s * x);
  // (the pairs beside the centre arch are passed at arm's length: they are drawn as the arch is, in pressed dabs about twice
  // as long as wide lying along the shaft at uneven angles, a few skipped, lemon with candle among them, lifted and laid again)
  const spent = makePen(new WaxBatch(64), rng), r2 = hand2(90211), near2 = makePen(pen.batch, r2); spent.density = near2.density = pen.density;
  const Bm = (o) => ({ ...o, w: 0.074, len: 1.55, jit: 0.09, turn: 1.15, hold: 0.8, hand: 3.2, pitch: o.pitch ?? 0.47, per: 1.7 + 0.9 * r2() });
  for (const cx of cols) { const z = 2.2, near = Math.abs(cx) < 14, p1 = near ? spent : pen;
    p1.line(cx - 1.25, 1.4, z, cx + 1.25, 1.4, z, Y); p1.line(cx - 1.25, 1.4, z, cx - 1.25, 2.5, z, Y); p1.line(cx + 1.25, 1.4, z, cx + 1.25, 2.5, z, Y);
    p1.line(cx - 1.05, 2.5, z, cx + 1.05, 2.5, z, W); p1.arc(cx, 2.9, z, 0.95, 0.4, 0, Math.PI, Y);
    p1.line(cx - 0.82, 3.2, z, cx - 0.66, 23.9, z, Y); p1.line(cx + 0.82, 3.2, z, cx + 0.66, 23.9, z, Y);
    p1.line(cx - 0.27, 3.6, z, cx - 0.22, 23.5, z, { white: 1, pitch: 0.8 }); p1.line(cx + 0.27, 3.6, z, cx + 0.22, 23.5, z, { white: 1, pitch: 0.8 });
    p1.line(cx - 0.8, 24.0, z, cx + 0.8, 24.0, z, W);
    for (const s of [-1, 1]) p1.spiral(cx + s * 0.95, 24.85, z, 0.62, 0.12, s > 0 ? Math.PI * 0.5 : Math.PI * 0.5, s > 0 ? -Math.PI * 2.2 : Math.PI * 3.2, { white: 0.2, pitch: 0.3, len: 0.8 });
    p1.line(cx - 1.5, 25.8, z, cx + 1.5, 25.8, z, Y);
    if (near) { const q = near2;
      q.line(cx - 1.25, 1.4, z, cx + 1.25, 1.4, z, Bm(Y)); q.line(cx - 1.25, 1.5, z, cx - 1.25, 2.5, z, Bm(Y)); q.line(cx + 1.25, 1.5, z, cx + 1.25, 2.5, z, Bm(Y)); q.line(cx - 1.05, 2.55, z, cx + 1.05, 2.55, z, Bm(W));
      q.line(cx - 0.84, 3.1, z, cx - 0.68, 23.9, z, Bm({ white: 0.3 })); q.line(cx + 0.84, 3.1, z, cx + 0.68, 23.9, z, Bm({ white: 0.3 }));
      q.line(cx - 0.24 + r2.range(-0.1, 0.1), 3.6, z, cx - 0.2, 23.5, z, Bm({ white: 0.85, pitch: 0.95 })); q.line(cx + 0.24 + r2.range(-0.1, 0.1), 3.6, z, cx + 0.2, 23.5, z, Bm({ white: 0.85, pitch: 0.95 }));
      q.line(cx - 0.85, 24.0, z, cx + 0.85, 24.0, z, Bm(W));
      for (const s of [-1, 1]) q.spiral(cx + s * 0.95, 24.85, z, 0.62, 0.12, Math.PI * 0.5, s > 0 ? -Math.PI * 2.2 : Math.PI * 3.2, { white: 0.2, pitch: 0.3, len: 0.8 });
      q.line(cx - 1.5, 25.8, z, cx + 1.5, 25.8, z, Bm(Y)); }
    await ctx.yield();
  }
  // swags hung between the capitals, in the colour of their side
  const sc = cols.slice().sort((a, b) => a - b);
  for (let i = 0; i + 1 < sc.length; i++) { const xa = sc[i] + 1.5, xb = sc[i + 1] - 1.5, mid = (xa + xb) / 2, hw = (xb - xa) / 2; if (hw < 1.5 || Math.abs(mid) < 1) continue;
    const sag = Math.min(2.6, 0.9 + hw * 0.22), o = { col: V.accent[mid < 0 ? 0 : 1], white: 0.12, per: 2.0 };
    pen.run((t, out) => { const u = t / (hw * 2.15) * 2 - 1; out[0] = mid + u * hw; out[1] = 25.25 - sag * (1 - u * u); out[2] = 2.2; }, hw * 2.15, o);
    pen.run((t, out) => { const u = t / (hw * 2.05) * 2 - 1; out[0] = mid + u * hw; out[1] = 25.25 - sag * 0.55 * (1 - u * u); out[2] = 2.2; }, hw * 2.05, { white: 0.9, pitch: 0.55 });
    for (const e of [xa, xb]) pen.line(e, 25.2, 2.2, e + rng.range(-0.15, 0.15), 23.4, 2.2, o); }
  // rusticated piers: joint lines between the arches, pressed lightly
  const edges = arches.map((a) => [a[0] - a[1] - 1.3, a[0] + a[1] + 1.3]).sort((p, q) => p[0] - q[0]); let xl = -60;
  for (const [l, r] of edges.concat([[60, 60]])) { if (l - xl > 1.2) for (const y of [3.6, 5.8, 8.0, 10.2]) pen.line(xl + 0.3, y, 0, l - 0.3, y, 0, { white: 0.85, pitch: 0.62 }); xl = r; }
  // the garden front seen from behind: the back wall's lines, sparser
  for (const y of [26.2, 30.1]) pen.line(-60.6, y, -10.5, 60.6, y, -10.5, { white: 0.5, pitch: 0.6 });
  await ctx.yield();
  // entablature: architrave, triglyph frieze, dentils, cornice (the lip the fall pours from)
  for (const [y, o, z] of [[26.2, Y, 0.4], [26.95, W, 0.4], [28.7, Y, 0.6], [29.85, Y, 2.6], [30.3, MIX, 2.9]]) pen.line(-60.6, y, z, 60.6, y, z, o);
  await ctx.yield();
  for (let x = -59.2; x < 59.6; x += 1.62) { const g = (Math.round((x + 59.2) / 1.62) % 3) === 0; pen.line(x, 27.25, 0.5, x + rng.range(-0.05, 0.05), 28.45, 0.5, g ? { col: V.accent[x < 0 ? 0 : 1], white: 0.05 } : W); if (g) pen.line(x + 0.3, 27.25, 0.5, x + 0.3, 28.45, 0.5, { col: V.accent[x < 0 ? 0 : 1], white: 0.05 }); }
  pen.line(-60, 29.3, 1.4, 60, 29.3, 1.4, { white: 0.6, pitch: 0.62, jit: 0.02, len: 0.75 });      // dentils: a row of short presses
  for (const s of [-1, 1]) { pen.line(s * 60.6, 1.4, 0, s * 60.6, 26.2, 0, Y); pen.line(s * 60.6, 30.1, 2.6, s * 60.6, 30.1, -10.5, Y); pen.line(s * 60.6, 26.2, 0, s * 60.6, 26.2, -10.5, { white: 0.5, pitch: 0.6 }); pen.line(s * 60.6, 1.4, -10.5, s * 60.6, 30.1, -10.5, { white: 0.5, pitch: 0.6 }); }
  await ctx.yield();
  return cols;
}

// The front's own measures, for whoever draws its light elsewhere (its mirror in the basin):
// the six side arches [x, half width, springing] that are its windows, the half width of the fall and of its parting.
export const FRONT = { windows: [[18.5, 4.5, 10.5], [32.5, 4.5, 10.5], [46.5, 4.5, 10.5]], fallHalf: 45, parting: 12.6, half: 60.6 };
// a stream of its own for a thing added later: made from the world's seed and a name, it draws from no other stream
function namedStream(ctx, name) {
  if (ctx.core?.makeRng) return ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  let h = 2166136261 >>> 0; for (const ch of name + ':' + ctx.seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const r = hand2((h >>> 0) % 2147483646 + 1); r.int = (a, c) => Math.floor(a + (c - a + 1) * r()); return r;
}
// THE LIT ROOMS (stream palace-windows). The front is an outline of dabs with nothing behind it; here its six windows (the
// side arches) are lit: each a block of short lemon dabs in rows, a hand's breadth behind the wall's plane, with the
// mullion and the transom left bare, so a room is seen lit behind the drawn arch. The cornice the fall pours from and the
// edge of the pediment (or the dome) are gone over once more in a close row. Dabs of the palace's own kind in its own
// batch: no fill, no new colour, nothing in front of the wall's plane but the cornice's and the crown's own lines.
async function drawWindows(ctx, b, V, density) {
  const wr = namedStream(ctx, 'palace-windows'), pen = makePen(b, wr); pen.density = density;
  const LIT = { white: 0.16, pitch: 0.42, len: 1.0, jit: 0.05, w: 0.12, turn: 0.6 }, zw = -0.7;
  for (const s of [-1, 1]) for (const [x, hw, sp] of FRONT.windows) { const cx = s * x, yc = sp + 0.55;
    for (let y = 2.3 + wr.range(0, 0.2); y < yc + hw - 0.7; y += 0.5) { if (Math.abs(y - yc) < 0.36) continue;   // (the transom: one row left bare at the springing)
      const half = (y < yc ? hw : Math.sqrt(Math.max(hw * hw - (y - yc) * (y - yc), 0))) - 0.75; if (half < 0.9) continue;
      const dy = wr.range(-0.05, 0.05);
      pen.line(cx - half, y + dy, zw, cx - 0.4, y + dy, zw, LIT); pen.line(cx + 0.4, y + dy, zw, cx + half, y + dy, zw, LIT); }
    await ctx.yield(); }
  const ROW = { white: 0.3, pitch: 0.3, len: 0.8, jit: 0.035, w: 0.1 };
  pen.line(-FRONT.half, 30.06, 2.75, FRONT.half, 30.06, 2.75, ROW);                         // the cornice
  await ctx.yield();
  if (V.front === 'dome') { pen.arc(0, 36.9, 2.0, 12.15, 6.95, 0, Math.PI, ROW); pen.line(-13.4, 36.55, 2.0, 13.4, 36.55, 2.0, ROW); }
  else { for (const s of [-1, 1]) pen.line(s * 24.4, 34.27, 2.0, 0, 44.37, 2.0, ROW); pen.line(-23.4, 33.62, 2.0, 23.4, 33.62, 2.0, ROW); }
  await ctx.yield();
  return pen.count;
}

// The crown: balustrade, ten urns with redrawn flames, and a pediment (default) or a dome.
async function drawCrown(ctx, pen, air, rng, V) {
  const W = { white: 0.9 }, Y = { white: 0.12 }, z = 2.0, half = V.front === 'dome' ? 14.5 : 23;
  for (const s of [-1, 1]) {
    pen.line(s * half, 30.75, z, s * 60.4, 30.75, z, Y); pen.line(s * half, 33.1, z, s * 60.4, 33.1, z, Y); pen.line(s * half, 32.75, z, s * 60.4, 32.75, z, W);
    for (let x = half + 0.6; x < 60; x += 0.86) pen.line(s * x, 31.0, z, s * x + rng.range(-0.04, 0.04), 32.6, z, { white: 0.55, pitch: 0.55, jit: 0.03 });
  }
  await ctx.yield();
  // urns on pedestals; each carries a plume of three strokes relaid about every second and a half
  const prof = (h) => h < 0.4 ? 0.62 - h * 0.8 : h < 0.75 ? 0.3 : h < 1.7 ? 0.3 + 0.78 * Math.sin((h - 0.75) / 0.95 * Math.PI * 0.5) : h < 2.5 ? 1.08 - 0.6 * Math.pow((h - 1.7) / 0.8, 1.6) : 0.48 + (h - 2.5) * 0.75;
  const urnX = V.front === 'dome' ? [20, 30, 40, 50, 58.6] : [27, 35, 43, 51, 58.6];
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const cx = s * urnX[i], y0 = 33.5, sc = i === 4 ? 1.25 : 1;
    if (i === 0) await ctx.yield();
    for (const q of [-1, 1]) { pen.line(cx + q * 1.0, 30.75, z + 0.2, cx + q * 1.0, 33.4, z + 0.2, Y); pen.run((t, out) => { out[0] = cx + q * prof(t / sc) * sc; out[1] = y0 + t; out[2] = z + 0.2; }, 2.95 * sc, { white: 0.15, pitch: 0.34, len: 0.85 }); }
    pen.line(cx - 1.15, 33.4, z + 0.2, cx + 1.15, 33.4, z + 0.2, W); pen.arc(cx, y0 + 1.7 * sc, z + 0.2, 1.08 * sc, 0.22, Math.PI, Math.PI * 2, W); pen.line(cx - 0.82 * sc, y0 + 2.95 * sc, z + 0.2, cx + 0.82 * sc, y0 + 2.95 * sc, z + 0.2, Y);
    const ty = y0 + 2.95 * sc, per = rng.range(1.3, 1.9), ph = rng();
    for (let k = 0; k < 3; k++) { const lean = (k - 1) * 0.9 + rng.range(-0.3, 0.3), hgt = rng.range(3.2, 5.2) * (k === 1 ? 1.25 : 1);
      air.stroke([cx + lean * 0.25, ty, z + 0.2], [cx + lean * 1.3, ty + hgt * 0.55, z + 0.2], [cx + lean * 0.4 + rng.range(-0.5, 0.5), ty + hgt, z + 0.2], { w: 0.11, col: (k === 1 ? PAL.LEMON : V.accent[s < 0 ? 0 : 1]) + 0.3, kind: 1, k0: (ph + k * 0.33) % 1, k1: per, seed: rng() }); }
  }
  await ctx.yield();
  if (V.front === 'dome') {
    for (const s of [-1, 1]) { pen.line(s * 13.2, 30.75, z, s * 13.2, 36.2, z, Y); pen.line(s * 12.2, 31.2, z, s * 12.2, 35.8, z, W); }
    for (const y of [33.2, 36.2, 36.9]) pen.line(-13.6, y, z, 13.6, y, z, y > 36.5 ? W : Y);
    for (let x = -10.5; x <= 10.6; x += 3.5) pen.arc(x, 34.9, z, 0.95, 0.95, 0, Math.PI, W), pen.line(x - 0.95, 33.5, z, x - 0.95, 34.9, z, W), pen.line(x + 0.95, 33.5, z, x + 0.95, 34.9, z, W);
    pen.arc(0, 36.9, z, 12.6, 7.3, 0, Math.PI, Y); pen.arc(0, 36.9, z, 11.7, 6.6, 0.03, Math.PI - 0.03, W);
    for (const rx of [4.2, 8.4]) { pen.arc(0, 36.9, z, rx, 7.0, 0, Math.PI * 0.5, { white: 0.4 }); pen.arc(0, 36.9, z, rx, 7.0, Math.PI * 0.5, Math.PI, { white: 0.4 }); }
    pen.line(0, 37.2, z, 0, 43.8, z, { white: 0.4 });
    for (const s of [-1, 1]) pen.line(s * 1.3, 44.0, z, s * 1.1, 46.2, z, Y); pen.line(-1.7, 44.0, z, 1.7, 44.0, z, W); pen.arc(0, 46.2, z, 1.25, 1.25, 0, Math.PI, Y); pen.line(0, 47.4, z, 0, 49.0, z, W);
  } else {
    for (const y of [33.3, 33.95]) pen.line(-23.6, y, z, 23.6, y, z, Y);
    for (let x = -21; x <= 21.1; x += 3) pen.line(x, 31.0, z, x, 32.9, z, W), pen.line(x + 1.5, 31.4, z, x + 1.5, 32.5, z, { col: V.accent[x < 0 ? 0 : 1], white: 0.1 });
    pen.line(-23.6, 30.75, z, 23.6, 30.75, z, Y);
    for (const s of [-1, 1]) { pen.line(s * 24.2, 33.95, z, 0, 44.0, z, Y); pen.line(s * 24.6, 34.6, z, 0, 44.75, z, Y); pen.line(s * 19.6, 34.8, z, 0, 42.4, z, W); }
    // tympanum: a sunburst, rays drawn one after another clockwise
    const cy = 35.0; pen.arc(0, cy, z, 1.7, 1.7, 0, Math.PI, { col: PAL.SCARLET, white: 0, pitch: 0.36 }); pen.arc(0, cy, z, 2.5, 2.5, 0, Math.PI, W);
    const nr = V.rays; for (let k = 0; k < nr; k++) { const a = Math.PI * (0.06 + 0.88 * (k + 0.5) / nr), ca = Math.cos(a), sa = Math.sin(a), tmax = (42.4 - cy) / (sa + 0.388 * Math.abs(ca)) * (k % 2 ? 0.66 : 0.86);
      pen.line(ca * 3.1, cy + sa * 3.1, z, ca * tmax, cy + sa * tmax, z, { col: k % 2 ? V.accent[k < nr / 2 ? 1 : 0] : PAL.LEMON, white: k % 2 ? 0.1 : 0.3, per: 2.6, ph: 1 - k / nr, hand: 30 }); }
  }
  // acroteria: palmettes at the apex and the corners, strokes fanned from a point
  const ap = V.front === 'dome' ? [[0, 49.0, 0.7]] : [[0, 44.6, 1.25], [-24.4, 34.3, 0.8], [24.4, 34.3, 0.8]];
  for (const [px, py, sc] of ap) for (let k = -2; k <= 2; k++) { const a = Math.PI / 2 - k * 0.42, L = (2.6 - Math.abs(k) * 0.45) * sc;
    air.stroke([px, py, z], [px + Math.cos(a) * L * 0.6, py + Math.sin(a) * L * 0.75, z], [px + Math.cos(a - k * 0.35) * L, py + Math.sin(a - k * 0.35) * L, z], { w: 0.1, col: PAL.LEMON + (k === 0 ? 0.5 : 0), kind: 1, k0: (k + 2) / 5, k1: 2.2, seed: rng() }); }
  await ctx.yield();
}

// The front as it is drawn for the far end of the avenue: where the 25-40 cm dabs would be finer than a pixel the
// hand uses the side of the crayon instead, a few dozen broad pressed strokes (kind 5: they stand only while the
// eye is more than about 190 m off and narrow to nothing as the real dabs take over). Crown, cornice, columns,
// arches and the fall, in the same pigments.
function drawFar(b, V, d0 = 185, d1 = 262) {
  let sd = 12345; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }, rr = (a, c) => a + (c - a) * r();
  const S = (a, m, c, w, col) => b.stroke(a, m, c, { w: w * rr(0.85, 1.2), col, kind: 5, k0: d0, k1: d1, seed: r(), bead: 0 });
  // a hand's line: separate pressed strokes about `pitch` long, bowed, a little off the line
  const line = (x0, y0, x1, y1, z, w, col, pitch = 5, skip = 0.08) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / pitch));
    for (let i = 0; i < n; i++) { if (r() < skip) continue; const t0 = (i + rr(0.04, 0.16)) / n, t1 = (i + rr(0.8, 0.97)) / n, tm = (t0 + t1) / 2, j = rr(-0.25, 0.25), bw = rr(-0.3, 0.3);
      S([x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0 + j, z], [x0 + (x1 - x0) * tm - (y1 - y0) / L * bw, y0 + (y1 - y0) * tm + j + (x1 - x0) / L * bw, z], [x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1 + j, z], w, typeof col === 'function' ? col() : col); } };
  const Y = PAL.LEMON, Wh = PAL.PAPER, mix = () => (r() < 0.3 ? Wh : Y);
  line(-60.6, 30.4, 60.6, 30.4, 3, 0.62, mix, 6); line(-60.4, 33.2, 60.4, 33.2, 2.2, 0.4, Y, 5, 0.3);              // cornice and balustrade
  line(-60.6, 26.4, 60.6, 26.4, 0.6, 0.4, Y, 7, 0.25);
  for (const s of [-1, 1]) { line(s * 60.6, 1.5, s * 60.6, 30, 0.2, 0.55, Y, 7, 0);
    for (const x of [11.9, 25.5, 39.5, 55.4]) line(s * x, 2, s * x, 25.5, 2.4, x < 13 || x > 50 ? 0.62 : 0.45, mix, 8, 0);   // the columns (the paired ones as one stroke)
    for (const x of [18.5, 32.5, 46.5]) S([s * x - 4.5, 10.8, 0.2], [s * x, 20.6, 0.2], [s * x + 4.5, 10.8, 0.2], 0.42, Wh);
    for (const x of V.front === 'dome' ? [20, 30, 40, 50, 58.6] : [27, 35, 43, 51, 58.6]) { S([s * x, 33.6, 2.4], null, [s * x, 36.6, 2.4], 0.62, Y); S([s * x, 37, 2.4], [s * x + 0.5, 39.5, 2.4], [s * x - 0.3, 42, 2.4], 0.38, V.accent[s < 0 ? 0 : 1] + 0.3); } }
  S([-8.6, 14.4, 0.3], [0, 31.5, 0.3], [8.6, 14.4, 0.3], 0.6, Wh); for (const s of [-1, 1]) line(s * 8.6, 1.6, s * 8.6, 14, 0.3, 0.5, Wh, 7, 0);                   // the centre arch
  if (V.front === 'dome') {
    for (const s of [-1, 1]) { line(s * 13.3, 31, s * 13.3, 36.6, 2.2, 0.55, Y, 6, 0); S([s * 12.6, 37.1, 2.2], [s * 11.2, 43.4, 2.2], [0, 44.3, 2.2], 0.66, Y); S([s * 6.3, 37.4, 2.2], [s * 5.6, 42, 2.2], [0, 44, 2.2], 0.3, Wh); }
    line(-13.6, 36.9, 13.6, 36.9, 2.2, 0.5, mix, 5, 0); S([0, 44.2, 2.2], null, [0, 49.2, 2.2], 0.6, Y); S([-1.6, 46.4, 2.2], [0, 48.2, 2.2], [1.6, 46.4, 2.2], 0.4, Wh);
  } else {
    for (const s of [-1, 1]) { line(s * 24.4, 34.2, 0, 44.6, 2.2, 0.62, Y, 6.5, 0); }
    line(-23.6, 33.9, 23.6, 33.9, 2.2, 0.5, mix, 6, 0); S([-2.2, 35.2, 2.2], [0, 38.4, 2.2], [2.2, 35.2, 2.2], 0.6, PAL.SCARLET);
    for (let k = 0; k < 5; k++) { const a = Math.PI * (0.14 + 0.72 * k / 4), ca = Math.cos(a), sa = Math.sin(a), L = (42.4 - 35) / (sa + 0.388 * Math.abs(ca)) * 0.8; S([ca * 3.6, 35 + sa * 3.6, 2.2], null, [ca * L, 35 + sa * L, 2.2], 0.32, k % 2 ? V.accent[k < 2 ? 1 : 0] : Y); }
    S([0, 44.8, 2.2], null, [0, 48, 2.2], 0.45, Y + 0.5);
  }
  // the fall: broad strokes laid down from the lip, lemon where they leave it
  for (let i = 0; i < 46; i++) { const x = (i + rr(0.1, 0.9)) / 46 * 88 - 44; if (Math.abs(x) < 7.6 && r() < 0.6) continue; const y1 = rr(1.5, 12), dx = rr(-0.8, 0.8);
    S([x, 29.8 + rr(-0.2, 0.3), 3.6], [x + dx * 0.4, (30 + y1) / 2 + 1, 4.6], [x + dx, y1, 6.5], rr(0.34, 0.6), Y + rr(0.45, 0.9)); }
}

// The fall of fire: long candle strokes laid from the lip down, lemon at the lip and white below.
function drawFall(fall, air, rng, V, detail) {
  // Separate ribbons, not a sheet: each stroke is laid from its top down at hand speed and lifted again before the
  // next is laid (hold), so at any moment about a third of them stand and three coats of ink show dark between;
  // the side's colour and plain lemon go among the candle; over the centre arch the strokes are few and stop short,
  // a parting through which the arch and the court behind are seen.
  const n = Math.round(1500 * (0.6 + 0.4 * detail)), lipY = 30.15, lipZ = 3.4;
  for (let i = 0; i < n; i++) {
    const x = (i + rng()) / n * 90 - 45, ax = Math.abs(x), part = ax < 12.6 + 1.2 * Math.sin(x * 2.7), broad = i % 5 === 0, fromLip = rng.chance(0.6) || (broad && !part), keepIt = part ? rng.chance(ax < 9.5 ? 0.2 : 0.36) : (broad || i % 5 < 3);
    const y0 = fromLip || part ? lipY + rng.range(-0.15, 0.25) : rng.range(7, 26), len = part ? rng.range(3, 7.5) * (ax < 9.5 ? 1 : 1.3) : fromLip ? rng.range(10, 24) * (broad ? 1.2 : 1) : rng.range(5, 13);
    const y1 = Math.max(0.15, y0 - len), f0 = (lipY - y0) / lipY, f1 = (lipY - y1) / lipY;
    const zo = (f) => lipZ + 1.2 * f + 3.2 * f * f, bow = rng.range(-0.5, 0.5), dx = rng.range(-0.7, 0.7), deep = rng.range(0, 1.6);
    const q = rng(), acc = V.accent[x < 0 ? 0 : 1], lemon = PAL.LEMON + Math.min(0.9, 0.25 * 30 / len * rng.range(1.2, 2.4));
    const col = q < 0.13 ? acc + rng.range(0.15, 0.4) : q < 0.25 ? PAL.LEMON : fromLip || part ? lemon : PAL.PAPER;
    const w = broad && !part ? rng.range(0.2, 0.34) : rng.chance(0.2) ? rng.range(0.1, 0.135) : rng.range(0.06, 0.1), per = rng.range(2.2, 3.3) + (broad ? 1.2 : 0), hold = broad ? rng.range(0.8, 0.92) : rng.range(0.55, 0.86);
    if (!keepIt) continue;
    fall.stroke([x, y0, zo(f0) + bow * 0.2 + deep], [x + dx * 0.3, (y0 + y1) / 2 + 0.6, zo((f0 + f1) / 2) + bow + deep], [x + dx, y1, zo(f1) + bow * 0.4 + deep], {
      w, col, kind: 1, k0: (x / 37 + rng.range(0, 0.45) + 10) % 1, k1: per, hold, seed: rng(), bead: 0.55 });
  }
  // the foot of the fall: short strokes kicked up off the ink
  const ns = Math.round(240 * detail);
  for (let i = 0; i < ns; i++) { const x = rng.range(-45, 45), z0 = rng.range(6.5, 9), up = rng.range(0.7, 2.6), out = rng.range(0.6, 2.4), sx = rng.range(-0.8, 0.8);
    air.stroke([x, 0.1, z0], [x + sx * 0.5, up * 1.4, z0 + out * 0.5], [x + sx, up * 0.5, z0 + out], { w: 0.07, col: PAL.PAPER, kind: 1, k0: rng(), k1: rng.range(0.9, 1.5), seed: rng(), bead: 0 }); }
}

// ---------------------------------------------------------------------------------------------
// Catherine wheels. list: [{ c: [x, y, z], r, col: PAL index, dir: +1 | -1 }], drawn in the local
// XY plane (turn the returned group to face them where you like). A five-armed spiral of dabs that
// turns a quarter turn a second about its scarlet heart and sheds short strokes along its tangent.
// ---------------------------------------------------------------------------------------------
export function addWheel(b, rng, wdef) {
  const [cx, cy, cz] = wdef.c, R = wdef.r, dir = wdef.dir ?? 1, col = wdef.col ?? PAL.ROSE, spin = dir * Math.PI / 2, N = [0, 0, 1], piv = [cx, cy, cz];
  const plain = !!wdef.plain, turns = 0.85, th0 = rng() * 6.283, per = rng.range(2.2, 2.8), pt = (t, a0, out) => { const a = a0 - dir * turns * 6.283 * t, r = R * (0.13 + 0.87 * t); out[0] = cx + Math.cos(a) * r; out[1] = cy + Math.sin(a) * r; };
  const p = [0, 0], q = [0, 0];
  for (let arm = 0; arm < 5; arm++) { const a0 = th0 + arm * 6.283 / 5, n = Math.round(R * 3.3 / 0.4);
    for (let i = 0; i < n; i++) { const t = (i + 0.5 + rng.range(-0.2, 0.2)) / n, dt = rng.range(0.3, 0.46) / (R * 3.3) * 0.5;
      pt(Math.max(0, t - dt), a0, p); pt(Math.min(1, t + dt), a0, q); const o = rng.range(-0.07, 0.07);
      b.stroke([p[0] + o, p[1] - o, cz], null, [q[0] + o, q[1] - o, cz], { n: N, w: 0.1 * rng.range(0.8, 1.25), col: plain ? col : rng.chance(0.15 + t * 0.4) ? PAL.PAPER : (rng.chance(0.12) ? PAL.LEMON : col), kind: 1, k0: (arm / 5 + t * 0.55) % 1, k1: per, seed: rng(), pivot: piv, spin }); }
    // a second, broken line outside each arm
    for (let i = 0; i < (plain ? 0 : n * 0.45); i++) { const t = 0.35 + 0.65 * (i + rng()) / (n * 0.45); pt(t - 0.012, a0 + 0.2, p); pt(t + 0.012, a0 + 0.2, q);
      b.stroke([p[0], p[1], cz], null, [q[0], q[1], cz], { n: N, w: 0.075, col: PAL.PAPER, kind: 1, k0: (arm / 5 + t * 0.55 + 0.1) % 1, k1: per, seed: rng(), pivot: piv, spin }); }
  }
  // the scarlet heart: a tight coil, pressed hard
  for (let i = 0; i < 16; i++) { const t = i / 16, a = t * 6.283 * 2.2, r = R * (0.02 + 0.1 * t), a2 = a + 0.32 / Math.max(r, 0.15);
    b.stroke([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz + 0.02], null, [cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, cz + 0.02], { n: N, w: 0.12, col: PAL.SCARLET, kind: 0, seed: rng(), pivot: piv, spin, bead: 0.5 }); }
  // shed: short strokes thrown along the tangent, each relaid about once a second
  for (let i = 0; i < (plain ? 16 : 26); i++) { const a = rng() * 6.283, r = R * rng.range(0.9, 1.04), L = plain ? rng.range(0.45, 0.95) : rng.range(0.9, 2.6), tx = -Math.sin(a) * dir, ty = Math.cos(a) * dir, sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r, out = rng.range(0.1, 0.5);
    const am = a + dir * L * 0.5 / r, ae = a + dir * L / r, rm = r * 1.03 / Math.cos(L * 0.5 / r);                                      // plain: a short dab bent along the rim
    b.stroke([sx, sy, cz], plain ? [cx + Math.cos(am) * rm, cy + Math.sin(am) * rm, cz] : [sx + tx * L * 0.55 + Math.cos(a) * out * 0.3, sy + ty * L * 0.55 + Math.sin(a) * out * 0.3, cz], plain ? [cx + Math.cos(ae) * r * 1.04, cy + Math.sin(ae) * r * 1.04, cz] : [sx + tx * L + Math.cos(a) * out, sy + ty * L + Math.sin(a) * out - L * 0.12, cz],
      { n: N, w: plain ? 0.085 : 0.07, col: plain ? col : rng.chance(0.5) ? PAL.PAPER : col + 0.4, kind: 1, k0: rng(), k1: rng.range(0.8, 1.3), seed: rng(), bead: 0 }); }
}
export function makeWheels(rng, list, o = {}) {
  const b = new WaxBatch(256 * list.length); for (const w of list) addWheel(b, rng, w);
  return b.build({ segs: 2, fringe: o.fringe ?? false, spinAxis: new THREE.Vector3(0, 0, 1), pad: 8 });
}

// Zigzag reflections scored on the pooled basin from the palace toward the viewer; they appear
// from the near end toward the palace as uProg runs u0..u1, and waver on the clock.
function drawZigzags(b, rng, V, n, u0, u1, zigAt) {
  for (let i = 0; i < n; i++) {
    const near = rng() * rng(), z = 11 + near * 112, x = rng.range(-1, 1) * (58 - near * 6), L = rng.range(4, 9) + near * 8;
    const under = Math.abs(x) < 45, col = under ? (rng.chance(0.22) ? PAL.LEMON : PAL.PAPER) : (rng.chance(0.55) ? PAL.LEMON : V.accent[x < 0 ? 0 : 1]);
    const lean = x * 0.012 + rng.range(-0.04, 0.04), k = zigAt ? zigAt(z + L * 0.5) : u0 + (u1 - u0) * (1 - (z + L) / 135);
    b.stroke([x, 0.07, z], null, [x + lean * L, 0.07, z + L], { n: [0, 1, 0], w: rng.range(0.07, 0.1) * (1.15 + 1.5 * near), zig: rng.range(0.22, 0.5) * (1.0 + 0.7 * near), col, kind: 2, k0: k, k1: k + (zigAt ? 0.02 : 0.03), seed: rng(), bead: 0.6 });
  }
}

// Rockets behind the palace: one long stroke up, then a willow wept clockwise a stroke at a time.
// All on uProg (kind 3): launched at u0, drawn over w, gone by u0 + 9w.
// o.w = half width of the strokes (m); o.loop = { per, ph }: relaid on the clock instead (kind 1), the willow's
// strokes following the rocket one after another and all lifted together; o.n willow strokes; o.spread, o.drop.
export function drawRocket(b, rng, x, z, apexY, col, u0, w, wide, o = {}) {
  const lean = rng.range(-0.12, 0.12) * apexY, ax = x + lean, a = [ax, apexY, z], sw = o.w ?? 0.16, lp = o.loop, y0 = o.y0 ?? 1, st = o.step ?? 0.03, cy = Math.cos(o.yaw ?? 0), sy = Math.sin(o.yaw ?? 0);
  const clock = (j) => (lp ? { kind: 1, k0: (lp.ph - (j < 0 ? 0 : 0.08 + j * st) + 2) % 1, k1: lp.per, hold: 0.95 - (j < 0 ? 0 : 0.08 + j * st) } : { kind: 3, k0: j < 0 ? u0 : u0 + w * (0.9 + j * 0.28), k1: w });
  b.stroke([x, y0, z], [x + lean * 0.2, y0 + (apexY - y0) * 0.55, z], a, { w: sw, col: o.trunk ?? PAL.PAPER, seed: rng(), bead: 0, ...clock(-1) });
  const n = o.n ?? (wide ? 5 : rng.int(9, 12)), R = apexY * (o.spread ?? (wide ? 0.16 : rng.range(0.2, 0.3)));
  for (let j = 0; j < n; j++) { const t = (j + 0.5) / n, ang = Math.PI * (1.02 - t * 1.04) + rng.range(-0.06, 0.06), ox = Math.cos(ang), oy = Math.max(0.1, Math.sin(ang)), drop = apexY * rng.range(0.3, 0.5) * (o.drop ?? 1), zz = z + rng.range(-3, 3);
    const rr = R * rng.range(1.25, 1.6);                                                    // o.yaw turns the willow's fan about the upright (0: it faces +Z)
    b.stroke(a, [ax + ox * R * 0.9 * cy, apexY + oy * R * 0.75, zz + ox * R * 0.9 * sy], [ax + ox * rr * cy, apexY + oy * R * 0.3 - drop, zz + ox * rr * sy],
      { w: sw * 0.94, col: col + 0.27, seed: rng(), bead: 0, ...clock(j) }); }
}

// Broderie: one scroll motif lying on the ground (a C-curl, a counter-curl and two dabs). Exported
// so the parterre of the whole world is written by the same hand.
export function addScroll(b, rng, x, z, size, ang, col, y = 0.05, wmul = 1) {
  const c = Math.cos(ang), s = Math.sin(ang), N = [0, 1, 0], P = (u, v) => [x + (u * c - v * s) * size, y, z + (u * s + v * c) * size];
  const o = () => ({ n: N, w: rng.range(0.085, 0.125) * wmul, col: rng.chance(0.3) ? PAL.PAPER : col, kind: 0, seed: rng(), bead: 1 });
  b.stroke(P(-1, 0), P(-0.2, 1.1), P(0.75, 0.25), o()); b.stroke(P(0.75, 0.25), P(1.15, -0.2), P(0.55, -0.4), o());
  b.stroke(P(-1, 0), P(-1.3, -0.6), P(-0.6, -0.75), o());
  b.stroke(P(0.05, -0.15), null, P(0.3, -0.05), o()); b.stroke(P(-0.35, -0.9), null, P(0.0, -0.95), o());
}

// The sky mesh (follows the camera by itself: its vertex shader adds cameraPosition).
export function makeSky(o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), skyMaterial(o)); m.frustumCulled = false; m.renderOrder = -10; return m;
}

// Where the fronts are at journey progress u (s = metres along the axis from the entry; the palace
// stands at s = 300). Piecewise linear, from the brief's journey. Returns [front2, front3, pool].
const F2 = [[0, -60], [0.03, -30], [0.0625, 18], [0.1, 55], [0.2, 97], [0.28, 300], [0.36, 430], [1, 430]];
const F3 = [[0, -90], [0.28, -60], [0.34, 135], [0.45, 178], [0.6, 240], [0.79, 300], [0.85, 324], [0.95, 430], [1, 430]];
function key(tab, u) { for (let i = 1; i < tab.length; i++) if (u <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / Math.max(b[0] - a[0], 1e-6); } return tab[tab.length - 1][1]; }
export function washSchedule(u) { return [key(F2, u), key(F3, u), Math.min(1, Math.max(0, (u - 0.45) / 0.34))]; }

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  setPalette(opts.palette ?? WAX_PALETTE); wash.uGran.value = opts.gran ?? 1;
  const prog = opts.programme ?? rng.pick(['rose-turquoise', 'rose-turquoise', 'turquoise-rose', 'lemon']);
  const V = {
    front: opts.front ?? (rng.chance(0.3) ? 'dome' : 'pediment'),
    accent: prog === 'lemon' ? [PAL.LEMON, PAL.LEMON] : prog === 'turquoise-rose' ? [PAL.TURQ, PAL.ROSE] : [PAL.ROSE, PAL.TURQ],   // [port (-x), starboard (+x)]
    rays: rng.int(11, 17), bouquet: opts.bouquet ?? rng.chance(0.12),
  };
  wash.uDamp.value = opts.damp ?? (rng.chance(0.7) ? 1 : 0.25);
  const preview = opts.preview ?? (Object.keys(opts).length === 0);   // the set-piece viewer calls with no options at all: it gets the sky
  const root = new THREE.Group(); root.name = 'fire-palace';
  await ctx.yield();

  // paper: the ground the palace stands on, the basin of pooled ink, the flank terraces (one coat more)
  if (opts.ground ?? true) { const g = new THREE.Mesh(new THREE.CircleGeometry(opts.groundRadius ?? 320, 48), paperMaterial({ base: 0 })); g.rotation.x = -Math.PI / 2; g.position.y = -0.04; root.add(g); }
  const basin = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), paperMaterial({ base: 0, gloss: 1 })); basin.rotation.x = -Math.PI / 2; basin.position.set(0, 0, 65); root.add(basin);
  const tgeo = new THREE.BufferGeometry(); { const pos = [], nor = [], idx = [];
    const box = (x0, x1, y1, z0, z1) => { const b = pos.length / 3, P = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      const F = [[4, 7, 6, 5, 0, 1, 0], [3, 2, 6, 7, 0, 0, 1], [0, 4, 5, 1, 0, 0, -1], [0, 3, 7, 4, -1, 0, 0], [1, 5, 6, 2, 1, 0, 0]]; let k = 0;
      for (const f of F) { for (let j = 0; j < 4; j++) { pos.push(...P[f[j]]); nor.push(f[4], f[5], f[6]); } idx.push(b + k, b + k + 1, b + k + 2, b + k, b + k + 2, b + k + 3); k += 4; } };
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const xa = s * (67 + k * 5), xb = s * 112; box(Math.min(xa, xb), Math.max(xa, xb), (k + 1) * 1.05, -14 + k, 28 - k * 2.5); }
    tgeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tgeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); tgeo.setIndex(idx); }
  root.add(new THREE.Mesh(tgeo, paperMaterial({ base: 1 })));
  await ctx.yield();

  // wax on the ground: the candle line round the basin and along every step, and broderie on the flanks
  const gw = new WaxBatch(2048), up = [0, 1, 0];
  const flat = (x0, z0, x1, z1, y, col) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.6));
    for (let i = 0; i < n; i++) { if (rng.chance(0.12)) continue; const a = (i + rng.range(0.02, 0.12)) / n, b = (i + rng.range(0.85, 1.0)) / n, o = rng.range(-0.06, 0.06), bw = rng.range(-0.12, 0.12), dx = (z1 - z0) / L, dz = -(x1 - x0) / L;
      gw.stroke([x0 + (x1 - x0) * a + dx * o, y, z0 + (z1 - z0) * a + dz * o], [x0 + (x1 - x0) * (a + b) / 2 + dx * bw, y, z0 + (z1 - z0) * (a + b) / 2 + dz * bw], [x0 + (x1 - x0) * b + dx * o, y, z0 + (z1 - z0) * b + dz * o], { n: up, w: rng.range(0.07, 0.1), col, kind: 0, seed: rng() }); } };
  for (const o of [0.5, 1.5]) { flat(-65 - o, 130 + o, 65 + o, 130 + o, 0.05, PAL.PAPER); flat(-65 - o, 0, -65 - o, 130 + o, 0.05, PAL.PAPER); flat(65 + o, 0, 65 + o, 130 + o, 0.05, PAL.PAPER); }
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const xa = s * (67 + k * 5 + 0.25), y = (k + 1) * 1.05 + 0.05, z0 = -14 + k, z1 = 28 - k * 2.5;
    flat(xa, z0, xa, z1 - 0.25, y, PAL.PAPER); flat(xa, z1 - 0.25, s * 112, z1 - 0.25, y, PAL.PAPER);
    const ns = Math.round((k === 4 ? 16 : 3) * detail); for (let i = 0; i < ns; i++) addScroll(gw, rng, s * (67 + k * 5 + rng.range(1.8, k === 4 ? 22 : 3.4)), rng.range(z0 + 2, z1 - 2.5), rng.range(0.9, 1.5), rng() * 6.283, rng.chance(0.6) ? PAL.LEMON : PAL.PAPER, y); }
  const nsc = Math.round(150 * detail);
  for (let i = 0; i < nsc; i++) { const s = rng.sign(), x = s * rng.range(68, 125), z = rng.range(32, 150); if (Math.abs(x) < 112 && z < 30) continue;
    addScroll(gw, rng, x, z, rng.range(1.0, 1.9), rng() * 6.283, rng.chance(0.55) ? PAL.LEMON : PAL.PAPER); if (i % 60 === 0) await ctx.yield(); }
  const gwMesh = gw.build({ segs: 3, fringe: true, margin: 5 }); root.add(gwMesh);
  await ctx.yield();

  // the fire palace
  const pal = new WaxBatch(24000), air = new WaxBatch(1024), pen = makePen(pal, rng); pen.density = 0.8 + 0.2 * detail;
  await drawPalace(ctx, pen, rng, V); await drawCrown(ctx, pen, air, rng, V);
  await ctx.yield();
  const litDabs = await drawWindows(ctx, pal, V, pen.density);
  const palMesh = pal.build({ segs: 1, fringe: true, margin: 2.2, spacing: 0.4 }); root.add(palMesh);
  await ctx.yield();
  { const farB = new WaxBatch(256); drawFar(farB, V); root.add(farB.build({ segs: 4, minPx: 1.0 })); }
  const fall = new WaxBatch(2048); drawFall(fall, air, rng, V, detail);
  await ctx.yield();
  root.add(fall.build({ segs: 6, spacing: 0.3 }));
  await ctx.yield();
  const zig = new WaxBatch(512); drawZigzags(zig, rng, V, opts.zigN ?? Math.round(400 * (0.7 + 0.3 * detail)), 0.46, 0.78, opts.zigAt);   // opts.zigAt(z) -> the u at which the reflection at local z appears
  root.add(zig.build({ segs: 1, minPx: 1.15, spacing: 0.55 }));
  // wheels on the flank terraces: accent[0] to port (-x), accent[1] to starboard (+x)
  const hubs = [[78, 13.6, 13, 8.6], [93.5, 11.4, 8, 6.2], [106, 11.2, 3, 4.6]], wheelHubs = [];
  for (const s of [-1, 1]) { const list = hubs.map((h, i) => ({ c: [s * h[0], h[1] + (i === 1 ? rng.range(4, 6.5) : 0), h[2]], r: h[3] * rng.range(0.92, 1.08), col: V.accent[s < 0 ? 0 : 1] === PAL.LEMON ? (i % 2 ? PAL.PAPER : PAL.LEMON) : V.accent[s < 0 ? 0 : 1], plain: V.accent[s < 0 ? 0 : 1] === PAL.LEMON, dir: -s }));
    root.add(makeWheels(rng, list)); for (const w of list) wheelHubs.push({ position: new THREE.Vector3(...w.c), radius: w.r }); }
  await ctx.yield();
  // rockets behind: sixteen across the journey, never behind the hoop (|x| > 26); the rare bouquet
  const rk = new WaxBatch(512);
  for (let i = 0; i < 16; i++) { const s = i % 2 ? 1 : -1, x = s * rng.range(30, 105); drawRocket(rk, rng, x, rng.range(-95, -35), rng.range(68, 120), V.accent[s < 0 ? 0 : 1] === PAL.LEMON ? PAL.ROSE : V.accent[s < 0 ? 0 : 1], 0.25 + i * 0.045 + rng.range(-0.008, 0.008), 0.013, false); }
  if (V.bouquet) for (let i = 0; i < 40; i++) { const t = i / 39, a = Math.PI * (0.92 - 0.84 * t); let x = Math.cos(a) * 150; if (Math.abs(x) < 26) x = Math.sign(x || 1) * 26; drawRocket(rk, rng, x, -112 - 16 * Math.sin(a), 80 + 70 * Math.sin(a) + rng.range(-5, 5), PAL.ROSE, 0.42 + 0.1 * t, 0.03, true, { w: 0.55, n: 6, spread: 0.2, drop: 0.85, trunk: (i % 3 ? PAL.PAPER : PAL.ROSE + 0.5) }); }
  // the rockets as they stand, read off their own strokes (the one stroke up starts at y 1; its willow's strokes follow it):
  // foot, apex, the willow's colour, the u it is launched at and the span each stroke is drawn over
  const rockets = []; for (let i = 0; i + 1 < rk.n; i++) if (rk.A[i * 3 + 1] < 2) rockets.push({ x: rk.A[i * 3], z: rk.A[i * 3 + 2], apexX: rk.C[i * 3], apexY: rk.C[i * 3 + 1], col: Math.floor(rk.K[(i + 1) * 4] + 1e-3), u0: rk.K[i * 4 + 2], w: rk.K[i * 4 + 3] });
  root.add(rk.build({ segs: 10, minPx: 1.1 })); root.add(air.build({ segs: 6 }));
  const sky = preview ? makeSky() : null; if (sky) { sky.renderOrder = -0.5; root.add(sky); }
  const qn = (k, d) => (opts[k] !== undefined ? [].concat(opts[k]) : d);   // optional overrides: heroR, heroH, heroC [x,y,z], heroU
  await ctx.yield();

  let driven = false, uNow = 0; const drive = opts.driveWash ?? true, _o = new THREE.Vector3(), _d = new THREE.Vector3(), _sz = new THREE.Vector2();
  const apply = (u) => { uNow = u; wash.uProg.value = u; if (drive) { const f = washSchedule(u); wash.uFront.value.y = f[0]; wash.uFront.value.z = f[1]; wash.uPool.value = f[2]; wash.uSky3.value = (u - 0.37) * 3200; wash.uSky2.value = (u - 0.04) * 1500; } };
  apply(0);
  return {
    object: root, radius: qn('heroR', [80])[0], height: qn('heroH', [48])[0], center: new THREE.Vector3(...qn('heroC', [0, 20, 0])), ground: false, groundY: 0,
    variant: V, counts: { palaceDabs: pal.n, fall: fall.n, zigzags: zig.n, ground: gw.n, rockets: rk.n, air: air.n },
    rockets, front: FRONT, litDabs,
    anchors: {
      portalSeat: { position: new THREE.Vector3(0, 9, -80), facing: new THREE.Vector3(0, 0, 1), radius: 7 },
      flyThrough: [[14, 2.5, 112], [10, 2.5, 70], [3, 3, 34], [0, 4, 12], [0, 5, 0], [0, 6, -12], [0, 8, -44], [0, 9, -80]].map((p) => new THREE.Vector3(...p)),
      viewpoints: { theImage: { position: new THREE.Vector3(10, 2.5, 96), lookAt: new THREE.Vector3(0, 19, 0) }, palaceWhole: { position: new THREE.Vector3(0, 6, 190), lookAt: new THREE.Vector3(0, 18, 0) }, throughTheFall: { position: new THREE.Vector3(0, 4, 14), lookAt: new THREE.Vector3(0, 8, -20) } },
      arch: { center: new THREE.Vector3(0, 11, 0), width: 16, height: 22.5, depth: 10.5 },
      fallLip: { y: 30.15, z: 3.4, halfWidth: 45 }, basin: { min: new THREE.Vector3(-65, 0, 0), max: new THREE.Vector3(65, 0, 130) },
      wheelHubs, rocketField: { zMin: -95, zMax: -35, keepClearHalfWidth: 26 }, washOrigin: new THREE.Vector3(0, 0, 300), washDir: new THREE.Vector3(0, 0, -1),
    },
    setProgress(u) { driven = true; apply(Math.min(1, Math.max(0, u))); },
    update(dt, time, camera) {
      wash.uTime.value = time;
      if (!driven) apply(qn('heroU', [0.3 + 0.62 * ((time / 44) % 1)])[0]);               // on its own (the viewer) it plays the back two thirds of the journey on a loop
      if (drive) { root.updateWorldMatrix(true, false); wash.uWashO.value.copy(_o.set(0, 0, 300).applyMatrix4(root.matrixWorld)); wash.uWashD.value.copy(_d.set(0, 0, -1).transformDirection(root.matrixWorld)); }
      if (camera) { const h = ctx.renderer?.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(_sz).y : 720; wash.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(h, 64)); }
    },
    dispose() {},
  };
}
