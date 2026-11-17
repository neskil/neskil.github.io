// STRIPES IN THE GRASS: the tiger, and the stencil-and-aerosol style kit for the whole world.
//
// THE PIECE. A tiger 4.6 m from nose to rump made of fifteen jointed cut cards, sprayed in four passes that are four
// separate meshes hung a hand apart (teal shadow slid forward and down, orange freehand fade, white islands, black
// islands). Her flank stripes are not drawn: they are stripeCard(), the same cut as the black shadow pass of the grass
// wall behind her, at the same scale and (at rest) the same coordinates, so at rest she is not there. Then one set of
// stripes slides forward: she walks and lopes along the port wall, swings a three-quarter head card in through a puff of
// white mist, gathers, goes across the trail in three bounds (orange first, white a hand behind, the black stripes
// hanging 0.9 m back as a tiger made only of stripes, snapping home on landing), stops against the far wall facing back,
// falls into register with it and is gone. With her: the two wall panels she is cut from (underspray, the card, plume
// flecks, card slips, drips), the ghost rectangle of her card, her halo, landing puffs, overspray dust on the wind.
//
// LOCAL SPACE. Origin = the point where she crosses the trail, on the ground. +Z = the camera's course along the trail,
// +X = port, -X = starboard. The trail is the line x = 0. She crosses along z = 0 from x = +crossFrom to the far wall.
// radius 5 / height 5 describe the tiger herself (what the viewer orbits); the whole stage is about 30 m either side
// (see anchors.portWall / farWall). Nothing solid: every surface is paint, transparent, depthWrite off, renderOrder 1..26;
// opaque grass in front of her occludes her by depth.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, style, timing, duration (8 s), setProgress(u),
//                           tigerAt(u, target), update(dt, time, camera), dispose(), ground:false }
//   opts.palette    five hex strings: black, white, orange, straw, teal (default PALETTE)
//   opts.style      a makeStyle() result to share (pass the world's own, so every material reads the same uniforms)
//   opts.detail     0.6..1: thins the dust and the drips only, never the tiger
//   opts.crossFrom  x where she leaves the port side (11);  opts.farWallX  the starboard wall she vanishes into (11.5)
//   opts.wallYaw    how far the port wall and her pacing line are turned across the camera's view, radians (0.6)
//   opts.wallHeight 4;  opts.walls false = leave both wall panels out (then build them from anchors with wallMaterial)
//   opts.ground     false = leave out the sprayed straw floor (a WORLD SHOULD PASS ground: false)
//   opts.white      true = the white tiger (her body sprayed in white through the same card, the patch card in straw)
//   opts.crossAngle heading of her bounds off the course, radians (pi/2 = square across; less = she crosses going forward);
//   opts.crossLead  metres from the start of the bounds to the trail (default crossFrom);  opts.stride  metres per bound
//   opts.endAhead   true = on the far side she turns to run on beside the starboard wall and stops facing the course
//   opts.wallBack   metres of port wall before her rest (16);
//   opts.wallAhead  metres of port wall beyond the end of her pacing line (9);  opts.runOn  metres she runs on beside the far wall with endAhead (5)
//   opts.cubs       true = the rare event: two half-size sets of the same cards break from the port wall and bound after her
//                   once setProgress() runs past 1 (it accepts up to 2: 8 more seconds for the cubs)
// PROGRESS. setProgress(u), u 0..1 = the 8 s act; advance it at about 1/8 per second of real time, from the world's own
// u (never wall-clock). timing gives the moments as u: stir .04, walk .1, lope .29, headSwing .43, firstBound .575,
// midSecondBound ~.69, landed .8, gone .99. Until setProgress() is first called the piece runs a turntable demo (below).
// ANCHORS (local): flyThrough (camera line along the trail, 1.7 m up, 7 m or more from every panel), cameraAtMidBound
// (be there at timing.midSecondBound and she is dead ahead, 28 m off; nearer is better), viewpoints.pacing/crossing/
// vanish ({pos, look}), restStart / restEnd (where she is hidden), crossing {from, to, stride}, portWall / farWall
// ({a, b, u0, front}: the panels and their stand-metre origin, so more wall can be added that stays in register),
// portalSeat null (the ring is elsewhere). tigerAt(u) gives her position for a poi.
// COST. 14 draw calls (13 without the floor), under 300 triangles and 900 points, one 1024 canvas atlas, 5 programs,
// no lights, build about 80 ms in small steps.
//
// THE STYLE KIT (exports; a world using post.flat = 1 gets the five cans exactly, no tone-map inverse anywhere):
//   PALETTE, CAN, CARD      the five cans and their indices; the card constants (repeat 2.4 m, columns, bridges, gap)
//   makeStyle(palette)      -> { uniforms, cans, update(time, renderer) }: uTime, uCan[5], uRes, uSlide (shadow slide),
//                           uWind (downwind xz + mist speed), uThin (150/300/500 m), uMist. Spread uniforms into every
//                           material and call style.update once a frame (the hero does it too).
//   STYLE_GLSL              prepend to shaders: sHash, sNoise, cutMask (knife edge from a blurred mask, with lift blur),
//                           cutDist (the same from metres), canAt(can, dist) (the distance rule: black gone by 150 m,
//                           white and teal by 300 m, straw silhouette by 500 m), stipple (aerosol grain that averages
//                           out below 3 px), stripeSd / stripeCard (THE CARD), mistBand / arrive (paint arriving
//                           behind the drifting mist bands, in spraying order).
//   cardMaterial            jointed atlas cards for animals (kinds: fade, white cut, black cut + card stripes, shadow)
//   wallMaterial + buildWallGeometry   a stand's shadow wall: underspray, the black card, flecks, card slips
//   sprayMaterial           soft quads: halo / mist puff (0), the ghost of a card as uneven overspray (1), sprayed floor (2)
//   dustMaterial            overspray specks on the wind, sized from the drawing buffer, fed by a 16-sample trail
//   dripMaterial + buildDripGeometry   ribbons >= 1.5 px creeping 2 cm/s to a bead
// Rule of the style: a form is 2 to 4 flat passes, each its own mesh a hand's breadth (CARD.layerGap) behind the last,
// drawn in spraying order by renderOrder; islands with bridges; crisp cut, soft halo of the same can at 8 to 14 percent.
import * as THREE from 'three';

// The five cans, in this order everywhere: 0 black, 1 white, 2 signal orange, 3 straw, 4 teal.
export const PALETTE = ['#14120F', '#F3EFE4', '#FF5A14', '#E2BE62', '#16787C'];
export const CAN = { black: 0, white: 1, orange: 2, straw: 3, teal: 4 };
// Stencil-card constants shared by the wall, the tiger and (please) the grass of the world.
export const CARD = { repeat: 2.4, column: 0.2, height: 4.0, bridge1: 1.15, bridge2: 2.45, layerGap: 0.12 };

/** One style object per world: the shared uniforms every material of the world points at. */
export function makeStyle(palette = PALETTE) {
  const pal = (palette && palette.length >= 5) ? palette : PALETTE;
  const cans = pal.slice(0, 5).map((h) => new THREE.Color(h));        // linear; the world runs post.flat = 1
  const uniforms = {
    uTime: { value: 0 },
    uCan: { value: cans },
    uRes: { value: new THREE.Vector2(800, 450) },                     // drawing buffer, refreshed in update()
    uSlide: { value: new THREE.Vector3(-0.22, -0.14, 0) },            // teal shadow pass: slid to starboard (-X) and down
    uWind: { value: new THREE.Vector3(-1, 0, 3) },                    // xy = downwind direction in xz, z = mist speed m/s
    uThin: { value: new THREE.Vector3(150, 300, 500) },               // black gone, white+teal gone, one straw silhouette
    uMist: { value: new THREE.Vector2(160, 120) },                    // band spacing m, distance beyond which things are "still being made"
  };
  return { palette: pal.slice(0, 5), cans, uniforms, update(time, renderer) {
    uniforms.uTime.value = time; if (renderer) renderer.getDrawingBufferSize(uniforms.uRes.value);
  } };
}

/** The whole look as GLSL: declare-once chunk for the top of any fragment (and vertex) shader of the world. */
export const STYLE_GLSL = /* glsl */`
uniform float uTime; uniform vec3 uCan[5]; uniform vec2 uRes; uniform vec3 uSlide; uniform vec3 uWind; uniform vec3 uThin; uniform vec2 uMist;
float sHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sHash(i), sHash(i + vec2(1., 0.)), f.x), mix(sHash(i + vec2(0., 1.)), sHash(i + vec2(1., 1.)), f.x), f.y); }
// A razor cut: m is a mask whose 0.5 level is the knife line; aa = fwidth(m) taken by the caller; lift > 0 where the card lifted (blur).
float cutMask(float m, float aa, float lift){ float w = max(aa, 1e-4) * 0.75 + lift; return smoothstep(0.5 - w, 0.5 + w, m) * smoothstep(0.0, 0.1, m); }
// The same from a signed distance in metres (+ inside); px = metres per pixel.
float cutDist(float d, float px, float lift){ return clamp(d / max(px + lift, 1e-5) + 0.5, 0., 1.); }
// Distance is paint thinning. Returns the can's colour and how much of the pass is left at dist metres.
vec4 canAt(int can, float dist){
  vec3 c = uCan[can]; float keep = 1.;
  if (can == 0) keep = 1. - smoothstep(uThin.x * 0.72, uThin.x, dist);
  else if (can == 1 || can == 4) keep = 1. - smoothstep(uThin.y * 0.75, uThin.y, dist);
  vec3 sil = uCan[3] * vec3(0.93, 0.88, 0.80);                              // straw, a shade deeper than the fade
  c = mix(c, sil, smoothstep(uThin.y, uThin.z, dist) * (can == 2 || can == 3 ? 1. : 0.));
  keep *= 1. - smoothstep(uThin.z * 1.6, uThin.z * 2.6, dist);
  return vec4(c, keep);
}
// Aerosol stipple for soft zones (fades, halos): 1 = solid. Finer than 3 px it returns its flat average.
float stipple(vec2 q, float px, float cover){
  float g = 0.011; float fine = smoothstep(g * 0.33, g * 0.8, px);
  float h = sHash(floor(q / g)) * 0.7 + sHash(floor(q / (g * 2.3)) + 9.) * 0.3;
  return mix(smoothstep(cover - 0.18, cover + 0.18, 1. - h + (cover - 0.5)), cover, fine);
}
// THE CARD. The black shadow pass of the grass and the tiger's stripes are this one cut: tapering slivers in
// columns CARD.column wide, broken into islands, with two bridge gaps at heights shared by the whole card;
// the card comes round every CARD.repeat metres, sometimes flipped, now and then upside down by mistake.
// p = metres (along the stand, above the ground); returns signed distance in metres (+ inside an island).
float stripeSd(vec2 p){
  float card = floor(p.x / 2.4); float xl = p.x - card * 2.4; float y = p.y;
  float hc = sHash(vec2(card, 3.7));
  if (hc > 0.55) xl = 2.4 - xl;
  if (hc < 0.07) y = 4.0 - y;
  float j0 = floor(xl / 0.2); float best = -1.;
  for (int k = -1; k <= 1; k++) {
    float j = j0 + float(k); if (j < 0. || j > 11.) continue;
    float h1 = sHash(vec2(j, 1.3)), h2 = sHash(vec2(j, 5.1)), h3 = sHash(vec2(j, 8.7));
    float L = 0.72 + 0.62 * h1; float t = (y + h2 * 3.) / L; float seg = floor(t); float f = t - seg;
    float hs = sHash(vec2(j * 7. + 1., seg));
    float s = sin(3.14159 * f);
    float hw = (0.030 + 0.044 * h3) * (0.55 + 0.6 * hs) * sqrt(max(s, 0.)) - 0.013;
    hw *= step(0.14, hs);                                              // some islands were never cut
    hw = min(hw, (4.0 - 0.9 * h1 - y) * 0.06);                         // every sliver comes to a point at the top
    float xc = (j + 0.5) * 0.2 + (h2 - 0.5) * 0.07 * (y - 1.8) + 0.022 * sin(y * 1.9 + j * 2.3);
    best = max(best, hw - abs(xl - xc));
  }
  best = min(best, abs(y - 1.15) - 0.032); best = min(best, abs(y - 2.45) - 0.028);   // the bridges
  return min(best, y - 0.02);
}
float stripeCard(vec2 p, float px, float lift){
  float c = cutDist(stripeSd(p), px, lift);
  return mix(c, 0.34 * step(0.02, p.y) * (1. - smoothstep(3.0, 4.0, p.y)), smoothstep(0.045, 0.09, px));   // too fine: flat tint
}
// Paint arrives. Bands of mist drift downwind; behind a band each pass comes crisp in spraying order
// (order 0 fade or shadow, 1 body, 2 white, 3 black). Only beyond uMist.y metres; nearer, everything is made.
float mistCoord(vec3 wp){ return fract((dot(wp.xz, uWind.xy) - uWind.z * uTime) / max(uMist.x, 1.)); }
float mistBand(vec3 wp){ float a = mistCoord(wp); return smoothstep(0.0, 0.1, a) * (1. - smoothstep(0.15, 0.27, a)); }
float arrive(vec3 wp, float order, float dist){
  float after = fract(1. - mistCoord(wp) + 0.82);                      // time since the band went over, 0..1 of a cycle
  float made = smoothstep(0.02 + 0.13 * order, 0.05 + 0.13 * order, after) * (1. - smoothstep(0.93, 0.99, after));
  return mix(1., made, smoothstep(uMist.y * 0.7, uMist.y, dist));
}
`;

// ---------------------------------------------------------------------------------------------------------
// Materials. All unlit, all transparent with depthWrite off: a pass is paint on air, ordered by renderOrder
// in spraying order (fade/shadow 0, body 1, white 2, black 3), occluded by any opaque thing in front of it.
// ---------------------------------------------------------------------------------------------------------
const CARD_VERT = /* glsl */`
attribute float aPart; attribute vec2 aWall; attribute float aStripe;
uniform vec4 uPart[20];
varying vec2 vUv, vWall; varying float vVis, vStripe, vDist;
void main(){
  vec4 P = uPart[int(aPart + 0.5)]; float c = cos(P.z), s = sin(P.z);
  vec2 q = vec2(c * position.x - s * position.y, s * position.x + c * position.y) + P.xy;
  vec4 wp = modelMatrix * vec4(position.z, q.y, q.x, 1.);            // the card plane: local z forward, y up, x = depth of the layer
  vUv = uv; vWall = aWall; vVis = P.w; vStripe = aStripe; vDist = distance(wp.xyz, cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CARD_FRAG = /* glsl */`
${'' /* style chunk is prepended by the factory */}
uniform sampler2D uAtlas; uniform float uKind, uReg, uLift, uAlpha; uniform int uCanId;
varying vec2 vUv, vWall; varying float vVis, vStripe, vDist;
void main(){
  vec4 t = texture2D(uAtlas, vUv);
  vec3 aa = fwidth(t.rgb); float px = length(fwidth(vWall)) * 0.7; float fu = fwidth(vUv.x);
  float liftN = uLift * smoothstep(0.5, 0.9, sNoise(vWall * 1.3 + 7.));
  float a = 0.;
  if (uKind < 0.5) {                                                  // the freehand fade: no knife line at all
    float core = smoothstep(0.30, 0.54, t.r);
    float sweep = 0.93 + 0.07 * sNoise(vWall * vec2(0.9, 2.1) + 3.);
    a = max(core * sweep, 0.14 * smoothstep(0.02, 0.42, t.r));
    float g = sHash(floor(vWall / 0.013)) - 0.5;
    a = clamp(a + g * 0.55 * (1. - smoothstep(0.004, 0.013, px)) * (1. - core) * smoothstep(0.03, 0.2, a), 0., 1.);
    a *= uReg;
  } else if (uKind < 1.5) {
    float br = abs(fract(vUv.x / 0.082) - 0.5) * 0.082;                 // the bridges that held the white card together
    a = cutMask(t.g, aa.g, 0.3 * liftN) * clamp((br - 0.0022) / max(fu, 1e-5) + 0.5, 0., 1.) * uReg;
  } else if (uKind > 2.5) {                                           // the shadow pass: the same cut, whole, in teal
    a = cutMask(t.r, aa.r, 0.25 * liftN) * uReg;
  } else {
    float sil = cutMask(t.r, aa.r, 0.);
    // her own stripes stay cut to a smaller size than the wall's do (never thinner than about 1.5 px, flat only below 2 px a column)
    float st = cutDist(stripeSd(vWall) + 0.25 * px, px, 0.018 * liftN) * (1. - smoothstep(0.08, 0.15, px)) * sil * vStripe;   // too fine to cut: left out, never a flat sixth colour
    a = max(cutMask(t.b, aa.b, 0.3 * liftN) * uReg, st * smoothstep(0., 0.25, uReg));
  }
  vec4 c = canAt(uCanId, vDist);
  gl_FragColor = vec4(c.rgb, a * c.a * vVis * uAlpha);
  if (gl_FragColor.a < 0.004) discard;
}`;

/** A jointed layer card (animals). kind: 0 freehand fade (atlas R, soft), 1 white cut (atlas G), 2 black cut
 *  (atlas B) plus THE CARD's stripes inside the R silhouette where aStripe = 1. can = CAN index.
 *  Geometry attributes: position (x,y in the part's frame about its pivot, z = layer depth), uv (atlas),
 *  aPart (index into uPart), aWall (stand metres at rest: the stripe coordinates), aStripe (0/1).
 *  uPart[i] = (x, y, angle, visibility) of part i in the animal's plane. */
export function cardMaterial(style, { kind = 0, can = CAN.orange, atlas = null, order = 0 } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, uAtlas: { value: atlas }, uKind: { value: kind }, uCanId: { value: can }, uReg: { value: 1 },
      uLift: { value: 1 }, uAlpha: { value: 1 }, uPart: { value: Array.from({ length: 20 }, () => new THREE.Vector4(0, 0, 0, 1)) } },
    vertexShader: CARD_VERT, fragmentShader: STYLE_GLSL + CARD_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide });
  m.userData.order = order; return m;
}

const WALL_VERT = /* glsl */`
attribute float aLayer; attribute vec2 aEnd;
varying vec2 vP, vEnd; varying float vLayer, vDist; varying vec3 vWp;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = uv; vLayer = aLayer; vWp = wp.xyz; vEnd = aEnd;
  vDist = distance(wp.xyz, cameraPosition); gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WALL_FRAG = /* glsl */`
uniform float uSlip, uShow; uniform vec2 uHold;
varying vec2 vP, vEnd; varying float vLayer, vDist; varying vec3 vWp;
void main(){
  float px = length(fwidth(vP)) * 0.7; vec2 p = vP; float a = 0.; vec4 c;
  float card = floor(p.x / 2.4); float hc = sHash(vec2(card, 11.3));
  // card slip: now and then a stand is sprayed again a hand to one side, and its ghost fades over a second
  float per = 6. + 3. * hc; float ph = uTime / per + hc * 7.; float n = floor(ph); float since = (ph - n) * per;
  float slips = step(0.45, hc) * uSlip;
  float off = 0.10 * mod(n, 2.) * slips, offOld = 0.10 * mod(n + 1., 2.) * slips;
  float liftN = smoothstep(0.55, 0.9, sNoise(p * 0.8 + 2.));
  if (vLayer < -0.5) {                                                 // the teal shadow pass, sprayed first: THE CARD cut wide and slid to starboard,
    // so the stand is dark (teal with the black islands over it) and the late sun leaks through it only in slivers
    float fineK = step(max(px, fwidth(p.x) * 0.8), 0.075);
    float dT = stripeSd(p + vec2(0.11, 0.07)) + 0.052;
    dT = min(dT, 4.05 - 0.5 * sHash(vec2(floor(p.x / 0.2), 4.4)) - p.y);  // every blade its own height
    a = mix(0.78 * step(0.02, p.y) * step(p.y, 3.7), cutDist(dT, px, 0.03 * liftN), fineK) * smoothstep(0., 1.6, min(vEnd.x, vEnd.y) + 1.2 * (sNoise(vec2(p.x * 0.7, p.y * 0.5 + 3.)) - 0.5));
    c = canAt(4, 0.);
  } else if (vLayer < 0.5) {                                           // orange underspray: late sun leaking through
    float f = sNoise(p * vec2(0.55, 0.42) + 5.) * 0.65 + sNoise(p * vec2(1.7, 0.9) + 1.) * 0.35;
    float h = smoothstep(4.4, 1.9, p.y) * smoothstep(-0.1, 0.5, p.y);
    // a freehand fade, as underspray is: no knife line, no seam, no bridge; it thins out to nothing over two metres at the ends of the
    // stand and toward the plumes, in uneven sweeps, and its fringe is aerosol grain (flat average where the grain is under 3 px)
    float v = f * (0.30 + 0.85 * h) * smoothstep(0., 2.4, min(vEnd.x, vEnd.y) + 1.6 * (f - 0.5));
    float dens = smoothstep(0.40, 0.66, v) * (0.62 + 0.38 * smoothstep(0.35, 0.7, sNoise(p * vec2(0.23, 0.6) + 11.)));
    // laid through the gaps between stems: cut islands of the can in upright streaks a hand wide, flat, never a blur (soft is only a
    // halo); where a streak is too fine to cut (under 3 px) the stand shows its flat average
    // (one tapering sliver of light to a gap between two columns of the card, so the orange lies between the black islands)
    float cj = floor(p.x / 0.2 + 0.5), xo = p.x - cj * 0.2, o1 = sHash(vec2(cj, 2.9)), o2 = sHash(vec2(cj, 6.3));
    float to = (p.y + o2 * 2.) / (1.1 + 1.3 * o1), os = sHash(vec2(cj * 3. + 2., floor(to)));
    float dO = ((0.022 + 0.04 * o2) * sqrt(max(sin(3.14159 * fract(to)), 0.)) - 0.008) * step(0.3, os) - abs(xo - 0.03 * (o1 - 0.5));
    a = cutDist(min(dO, (dens - 0.3) * 0.5), px, 0.);
    a = mix(a, 0.3 * dens, smoothstep(0.05, 0.1, px));
    c = canAt(2, vDist);
  } else if (vLayer < 1.5) {                                           // THE CARD, in black
    // a card too fine to cut (far off, or seen along its own face) is left out: no flat tint over the orange, which would be a sixth colour
    float fineK = step(max(px, fwidth(p.x) * 0.8), 0.075);
    a = cutDist(stripeSd(p - vec2(off, 0.)), px, 0.02 * liftN) * fineK;
    a = max(a, cutDist(stripeSd(p - vec2(offOld, 0.)), px, 0.03) * fineK * 0.55 * (1. - smoothstep(0., 1.1, since)) * slips);
    c = canAt(0, vDist);
  } else {                                                             // white plume flecks on the tallest slivers
    vec2 q = vec2(p.x / 0.2, (p.y - 3.05) / 0.5); vec2 id = floor(q); vec2 f = fract(q) - 0.5;
    float hh = sHash(id + 31.); f.x += (hh - 0.5) * 0.4;
    float d = 0.33 - length(f * vec2(2.6, 1.0)) - 0.25 * step(hh, 0.62);
    a = cutDist(d * 0.2, px, 0.) * step(3.05, p.y) * step(p.y, 4.05);
    a *= 1. - smoothstep(0.045, 0.09, px);
    c = canAt(1, vDist);
  }
  a *= arrive(vWp, vLayer < 0.5 ? 0. : (vLayer < 1.5 ? 3. : 2.), vLayer < -0.5 ? 0. : vDist);
  // sprayed in strip by strip, in spraying order; over the stretch uHold (centre, half length in stand metres) the black card comes last of all
  float gen = step(vLayer < 0.5 ? 0.001 : (vLayer < 1.5 ? 0.3 : 0.2), uShow * 1.5 - 0.5 * sNoise(vec2(p.x * 0.9, 3.) + 9.));
  // her own stretch uHold stays bare (a pale, quiet ground behind her) until she has stood there as stripes alone; then the card comes
  // down over her in strips 0.6 m wide from the starboard end: underspray, flecks, the black last, each a strip behind the one before
  float hasH = step(0., uHold.y), hd = abs(p.x - uHold.x) - uHold.y, kL = clamp((uShow - 0.55) / 0.45, 0., 1.);
  float strip = floor((p.x - uHold.x + uHold.y) / 0.6) * 0.6 / max(2. * uHold.y, 1e-3);
  float land = step(strip * 0.78 + (vLayer < 0.5 ? 0.015 : (vLayer < 1.5 ? 0.2 : 0.11)), kL);
  a *= mix(gen, land, hasH * step(hd, 0.));
  // (and beside her stretch the underspray thins out in streaks until then: no slab with a ruled edge)
  if (vLayer < 0.5) a *= mix(1., max(step(0.999, kL), smoothstep(0.2, 2.6, hd + 2.2 * (sNoise(vec2(p.x * 3.1, p.y * 0.35 + 7.)) - 0.5))), hasH * step(0., hd));
  gl_FragColor = vec4(c.rgb, a * c.a);
  if (gl_FragColor.a < 0.004) discard;
}`;
/** The shadow wall of a grass stand: quads whose uv is stand metres (x along, y up) and whose aLayer is
 *  0 orange underspray, 1 the black card, 2 white plume flecks. Use buildWallGeometry() to make them. */
export function wallMaterial(style, { slip = 1, show = 1 } = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uSlip: { value: slip }, uShow: { value: show }, uHold: { value: new THREE.Vector2(0, -1) } },
    vertexShader: WALL_VERT, fragmentShader: STYLE_GLSL + WALL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}

const SPRAY_VERT = /* glsl */`
varying vec2 vUv; varying float vDist; varying vec3 vWp;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vUv = uv; vWp = wp.xyz; vDist = distance(wp.xyz, cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SPRAY_FRAG = /* glsl */`
uniform float uShape, uAlpha, uSeed, uFloor, uSoft, uNear; uniform vec2 uInner; uniform int uCanId;
uniform vec2 uLane; uniform float uReach;
varying vec2 vUv; varying float vDist; varying vec3 vWp;
void main(){
  vec2 q = abs(vUv - 0.5) * 2.; float a; vec2 fw = fwidth(vUv);
  float n = sNoise(vUv * 3.1 + uSeed + uTime * 0.11), n2 = sNoise(vUv * 9. + uSeed * 1.7 - uTime * 0.07);
  if (uShape < 0.5) {                                                  // halo, puff of mist
    float r = length(vUv - 0.5) * 2. + (n - 0.5) * 0.55 + (n2 - 0.5) * 0.18;
    a = 1. - smoothstep(0.05, 0.95, r); a *= a * (1. - smoothstep(0.70, 0.98, length(vUv - 0.5) * 2.));
  } else if (uShape > 2.5) {                                           // a veil of mist: even in the middle, thinning away over its outer half, no rim
    float r = length(vUv - 0.5) * 2. + (n - 0.5) * 0.4 + (n2 - 0.5) * 0.14;
    a = (1. - smoothstep(0.3, 1.0, r)) * (1. - smoothstep(0.75, 0.98, length(vUv - 0.5) * 2.)) * (0.86 + 0.14 * n2);
    if (uLane.y > 0.) a *= smoothstep(uLane.x, uLane.y, abs(vWp.x));
  } else if (uShape > 1.5) {                                           // a sprayed floor: solid, torn soft at its rim
    a = 1. - smoothstep(0.72, 1.0, length(vUv - 0.5) * 2. + (n - 0.5) * 0.3);
  } else {                                                             // the ghost of a card: overspray that got past its edge
    // a breath of the can, never a ruled frame: densest toward one corner (where the hand started), thinning round the card, broken where
    // the card was lifted, soft over a metre and more outward; its inner side follows the card's edge but is only as sharp as the card lay flat
    vec2 d2 = (q - uInner) / max(vec2(1.) - uInner, vec2(1e-3));
    float dOut = max(d2.x, d2.y);
    vec2 cd = vec2(fract(uSeed * 0.37) < 0.5 ? -1. : 1., fract(uSeed * 0.73) < 0.5 ? -1. : 1.);
    vec2 rv = (vUv - 0.5) * 2.;
    float corner = clamp(0.5 + 0.5 * dot(rv, cd) / max(abs(rv.x) + abs(rv.y), 1e-3), 0., 1.);
    float lift = smoothstep(0.38, 0.72, sNoise(vUv * 4.3 + uSeed * 2.1));
    float w = uSoft * (0.35 + 1.9 * lift);
    float edge = smoothstep(-0.3 * w, w, dOut + (n2 - 0.5) * 0.5 * w);
    float fall = 1. - smoothstep(0., 1., dOut + (n - 0.5) * 0.5);
    float around = mix(uFloor, 1., smoothstep(0.38, 0.74, n * 0.75 + n2 * 0.45)) * mix(mix(0.16, 0.6, uFloor), 1., corner * corner);
    if (uReach > 0.) around *= 1. - smoothstep(0.45 * uReach, uReach, max(abs(rv.x - cd.x * uInner.x), abs(rv.y - cd.y * uInner.y)));
    a = edge * fall * (0.4 + 0.6 * fall) * around;                        // a broad breath, not a line along the edge
  }
  float px = max(fw.x, fw.y);
  float g = sHash(floor(vUv / 0.004 + uSeed)) - 0.5;
  a = clamp(a + g * 0.5 * a * (1. - smoothstep(0.0015, 0.004, px)), 0., 1.);
  vec4 c = canAt(uCanId, vDist);
  a *= smoothstep(uNear * 0.5, max(uNear, 1e-3), vDist);                // (near > 0: a band of mist thins to nothing round the lens, so we never fly through white)
  gl_FragColor = vec4(c.rgb, min(a * uAlpha * c.a, 1.));               // never more than the can itself: an alpha above 1 would subtract what is behind it (a sixth colour)
  if (gl_FragColor.a < 0.003) discard;
}`;
/** Soft quads: shape 0 = halo or puff of mist (round, torn by noise, drifting inside itself), 1 = the ghost of a card: overspray past
 *  its edge at uInner (an uneven breath, densest toward one corner picked by seed, broken where the card lifted; soft = how soft its
 *  inner side is, floor = how much of it is left where it is thinnest), 2 = sprayed floor. alpha is the can at 8 to 14 percent for halos. */
export function sprayMaterial(style, { can = CAN.orange, shape = 0, alpha = 0.12, seed = 0, inner = [0.8, 0.7], floor = 0, soft = 0.3, near = 0 } = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uShape: { value: shape }, uAlpha: { value: alpha }, uSeed: { value: seed },
    uInner: { value: new THREE.Vector2(inner[0], inner[1]) }, uCanId: { value: can }, uFloor: { value: floor }, uSoft: { value: soft }, uNear: { value: near },
    uLane: { value: new THREE.Vector2(0, 0) }, uReach: { value: 0 } },
    vertexShader: SPRAY_VERT, fragmentShader: STYLE_GLSL + SPRAY_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}

const DUST_VERT = /* glsl */`
attribute vec4 aSeed;                                                   // can 0..1, size 0..1, trail slot, drift 0..1
uniform float uNow, uThread; uniform vec4 uTrail[16];                   // x, z, birth time, strength of each trail sample; uThread 1 = one unbroken thread of specks (the wind's ribbons)
varying float vCan, vA;
void main(){
  vec4 tr = uTrail[int(aSeed.z + 0.5)];
  float wv = mix(aSeed.w, 0.5, uThread);                                 // (a thread's specks all ride at one speed, so it stays one line)
  float age = uNow - tr.z - wv * 0.14; float life = mix(1.8 + wv * 2.2, 3.7, uThread);
  vec3 p = vec3(tr.x, 0., tr.y) + position + vec3(uWind.x, 0., uWind.y) * (0.5 + wv) * age * 0.9 + vec3(0., (aSeed.x - 0.6) * 0.25 * age * (1. - uThread), 0.);
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
  float sizePx = (0.012 + 0.03 * aSeed.y * (1. - 0.6 * uThread) + 0.012 * uThread) * projectionMatrix[1][1] * uRes.y * 0.5 / max(gl_Position.w, 0.1);
  gl_PointSize = clamp(sizePx, 1.5 + 0.4 * uThread, 9. - 5.6 * uThread);
  vA = smoothstep(0., 0.15, age) * (1. - smoothstep(life * 0.5, life, age)) * step(0., age) * min(1., sizePx / 1.5);
  vA *= step(fract(aSeed.y * 7.31), tr.w);
  vA = mix(vA, step(fract(aSeed.x * 37.7) * 0.8 + 0.1, vA) / 0.85, uThread);   // a thread's specks are each the solid can, there or not
  vCan = aSeed.x;
}`;
const DUST_FRAG = /* glsl */`
varying float vCan, vA;
void main(){ vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25 || vA < 0.01) discard;
  int k = int(clamp(vCan * 5., 0., 4.)); gl_FragColor = vec4(uCan[k], vA * 0.85); }`;
/** Overspray dust: THREE.Points whose position is a scatter about a trail sample and aSeed = (can 0..1, size 0..1, trail slot 0..15,
 *  drift 0..1). Write uTrail[slot] = (x, z, time, strength 0..1) as the thing moves; the specks ride the wind from there. */
export function dustMaterial(style) {
  return new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uNow: { value: 0 }, uThread: { value: 0 }, uTrail: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, -99, 0)) } },
    vertexShader: STYLE_GLSL + DUST_VERT, fragmentShader: STYLE_GLSL + DUST_FRAG, transparent: true, depthWrite: false });
}

const DRIP_VERT = /* glsl */`
attribute vec3 aOff; attribute vec3 aInfo;                              // side offset (unit tangent, signed); phase, max length m, speed mult
uniform float uRun, uWide;
varying float vT, vDist;
void main(){
  float t = mod(uTime * uRun + aInfo.x * 140., 140.);
  float len = min(aInfo.y, 0.02 * aInfo.z * t) * (1. - smoothstep(128., 140., t));
  vec4 wp = modelMatrix * vec4(position - vec3(0., len * uv.y, 0.), 1.);
  float dist = distance(wp.xyz, cameraPosition);
  float mpp = 2. * dist / max(projectionMatrix[1][1] * uRes.y, 1.);     // metres per pixel here
  float bead = 1. + 1.3 * smoothstep(0.86, 0.97, uv.y) * (1. - smoothstep(0.985, 1., uv.y));
  float w = max(0.011 * uWide * bead, 0.8 * mpp);
  wp.xyz += normalize(mat3(modelMatrix) * aOff) * w * sign(uv.x - 0.5);
  vT = uv.y; vDist = dist; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DRIP_FRAG = /* glsl */`
uniform int uCanId; varying float vT, vDist;
void main(){ vec4 c = canAt(uCanId, vDist); gl_FragColor = vec4(c.rgb, c.a * (1. - smoothstep(280., 400., vDist))); if (gl_FragColor.a < 0.01) discard; }`;
/** Drips: ribbons never thinner than 1.5 px, creeping 2 cm a second (times uRun) to their length and stopping in a bead. */
export function dripMaterial(style, { can = CAN.black, run = 1, wide = 1 } = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uCanId: { value: can }, uRun: { value: run }, uWide: { value: wide } },
    vertexShader: STYLE_GLSL + DRIP_VERT, fragmentShader: STYLE_GLSL + DRIP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}
/** drips: [{ at:[x,y,z] (top), tangent:[x,y,z] (unit, in the surface, horizontal), length, phase 0..1, speed }] -> ribbon geometry. */
export function buildDripGeometry(drips) {
  const n = drips.length, pos = new Float32Array(n * 12), off = new Float32Array(n * 12), info = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = [];
  drips.forEach((d, i) => {
    for (let k = 0; k < 4; k++) {
      pos.set(d.at, i * 12 + k * 3); off.set(d.tangent, i * 12 + k * 3); info.set([d.phase ?? 0, d.length ?? 0.5, d.speed ?? 1], i * 12 + k * 3);
      uv.set([k & 1, k >> 1], i * 8 + k * 2);
    }
    idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aOff', new THREE.BufferAttribute(off, 3));
  g.setAttribute('aInfo', new THREE.BufferAttribute(info, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
/** panels: [{ a:[x,z], b:[x,z] (ends on the ground), front:[x,z] (unit, toward the viewer), u0 (stand metres at a), height }]
 *  -> one geometry for wallMaterial: underspray CARD.layerGap behind, the black card on the line, flecks a little in front. */
export function buildWallGeometry(panels) {
  const pos = [], uv = [], lay = [], end = [], idx = [];
  for (let layer = -1; layer < 3; layer++) for (const p of panels) {
    if (layer < 0 && !p.teal) continue;                                  // (a panel with teal: true gets the teal shadow pass, a hand further back)
    const o = layer < 0 ? -2 * CARD.layerGap : layer === 0 ? -CARD.layerGap : layer === 1 ? 0 : 0.05, H = (p.height ?? CARD.height) + 0.1;
    const L = Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]), b = pos.length / 3, pad = layer === 0 ? 0.6 : 0;
    const dx = (p.b[0] - p.a[0]) / L, dz = (p.b[1] - p.a[1]) / L;
    for (let k = 0; k < 4; k++) {
      const s = (k & 1) ? L + pad : -pad, y = (k >> 1) ? H + pad : -0.05;
      pos.push(p.a[0] + dx * s + p.front[0] * o, y, p.a[1] + dz * s + p.front[1] * o); uv.push((p.u0 ?? 0) + s, y); lay.push(layer); end.push(s, L - s);
    }
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aLayer', new THREE.Float32BufferAttribute(lay, 1)); g.setAttribute('aEnd', new THREE.Float32BufferAttribute(end, 2)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// The tiger's cards, as the cutter drew them. Units are drawn metres about each part's pivot, nose toward +x,
// y up. R = where the orange fade goes, G = white islands, B = black islands cut by hand (eye, face, bars);
// the flank stripes are not drawn here: they are THE CARD, showing through the R silhouette.
// A shape is a closed curve through its points; isl() is one tapering island between two ends.
// ---------------------------------------------------------------------------------------------------------
const isl = (x0, y0, x1, y1, w, bend = 0) => {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return [[x0, y0], [mx + nx * (w / 2 + bend), my + ny * (w / 2 + bend)], [x1, y1], [mx - nx * (w / 2 - bend), my - ny * (w / 2 - bend)]];
};
const oval = (cx, cy, rx, ry) => [[cx - rx, cy], [cx, cy + ry], [cx + rx, cy], [cx, cy - ry]];
const TIGER_SCALE = 1.12;      // drawn metres -> world metres: 4.6 m from nose to rump
const PARTS = {
  torso: { b: [-1.85, 1.85, -0.80, 0.78],
    R: [[[-1.5, 0.30], [-1.25, 0.47], [-0.6, 0.44], [0.1, 0.42], [0.75, 0.50], [1.1, 0.56], [1.42, 0.42], [1.6, 0.12], [1.52, -0.25], [1.2, -0.52],
      [0.7, -0.58], [0.1, -0.50], [-0.5, -0.40], [-0.95, -0.38], [-1.3, -0.45], [-1.6, -0.2], [-1.63, 0.08]]],
    G: [[[1.42, -0.10], [1.30, -0.28], [0.85, -0.36], [0.3, -0.36], [-0.3, -0.30], [-0.85, -0.26], [-1.25, -0.30], [-1.38, -0.40], [-1.0, -0.47], [-0.5, -0.46],
      [0.1, -0.55], [0.7, -0.63], [1.2, -0.58], [1.5, -0.36], [1.58, -0.12]]],
    B: [] },
  headA: { b: [-0.56, 1.32, -0.60, 0.90],
    R: [[[-0.25, 0.36], [0.10, 0.44], [0.30, 0.50], [0.36, 0.64], [0.44, 0.72], [0.53, 0.66], [0.56, 0.56], [0.70, 0.56], [0.84, 0.50], [0.95, 0.40], [1.06, 0.33],
      [1.13, 0.24], [1.14, 0.14], [1.10, 0.04], [1.03, -0.05], [0.92, -0.10], [0.78, -0.12], [0.66, -0.22], [0.52, -0.30], [0.40, -0.26], [0.22, -0.34], [-0.05, -0.42], [-0.30, -0.40], [-0.38, 0.0]]],
    G: [[[0.96, 0.20], [1.06, 0.24], [1.12, 0.12], [1.08, 0.03], [0.98, -0.04], [0.90, 0.02], [0.90, 0.12]],                 // muzzle
      [[0.52, 0.10], [0.66, 0.14], [0.78, 0.06], [0.76, -0.08], [0.66, -0.18], [0.52, -0.26], [0.42, -0.20], [0.44, -0.04]],  // cheek ruff
      [[0.78, 0.44], [0.86, 0.49], [0.95, 0.43], [0.86, 0.42]],                                                               // brow
      [[0.0, -0.24], [0.2, -0.22], [0.34, -0.28], [0.2, -0.34], [-0.04, -0.38]]],                                             // throat
    B: [[[0.775, 0.34], [0.855, 0.42], [0.945, 0.385], [0.86, 0.32]],                                                        // the eye
      [[1.085, 0.255], [1.14, 0.235], [1.148, 0.15], [1.10, 0.175]], isl(1.085, 0.04, 0.88, -0.035, 0.032, 0.012),            // nose, mouth
      [[0.38, 0.60], [0.44, 0.695], [0.52, 0.64], [0.47, 0.575]],                                                             // ear
      isl(0.74, 0.30, 0.56, 0.14, 0.06, 0.03), isl(0.72, 0.16, 0.62, -0.12, 0.05, -0.02), isl(0.56, 0.26, 0.42, -0.04, 0.055, 0.02),
      isl(0.50, -0.06, 0.58, -0.24, 0.04, 0.0), isl(0.80, 0.33, 0.69, 0.26, 0.032, 0.0),
      isl(0.60, 0.535, 0.70, 0.38, 0.045, 0.0), isl(0.72, 0.53, 0.78, 0.44, 0.035, 0.0), isl(0.50, 0.52, 0.56, 0.34, 0.05, 0.01),
      isl(0.28, 0.46, 0.24, 0.0, 0.08, 0.03), isl(0.10, 0.42, 0.04, -0.12, 0.085, -0.02), isl(-0.10, 0.37, -0.17, -0.22, 0.09, 0.02),
      isl(0.28, -0.08, 0.32, -0.26, 0.05, 0.0)] },
  headB: { b: [-0.56, 1.28, -0.60, 0.96],
    R: [[[-0.25, 0.32], [0.05, 0.44], [0.20, 0.56], [0.24, 0.72], [0.34, 0.78], [0.44, 0.70], [0.48, 0.62], [0.62, 0.64], [0.76, 0.64], [0.82, 0.76], [0.93, 0.78],
      [0.99, 0.68], [0.98, 0.56], [1.06, 0.40], [1.10, 0.20], [1.06, 0.02], [0.96, -0.12], [0.84, -0.22], [0.68, -0.28], [0.52, -0.26], [0.36, -0.20], [0.24, -0.30],
      [0.05, -0.40], [-0.28, -0.38], [-0.38, 0.0]]],
    G: [[[0.50, 0.08], [0.60, 0.12], [0.66, 0.04], [0.64, -0.08], [0.54, -0.12], [0.46, -0.04]], [[0.68, 0.04], [0.74, 0.12], [0.84, 0.08], [0.88, -0.04], [0.80, -0.12], [0.70, -0.08]],
      [[0.58, -0.14], [0.67, -0.11], [0.76, -0.14], [0.67, -0.22]],
      [[0.40, 0.40], [0.51, 0.475], [0.62, 0.395], [0.51, 0.385]], [[0.72, 0.395], [0.83, 0.475], [0.94, 0.40], [0.83, 0.385]],           // brows
      [[0.43, 0.225], [0.50, 0.238], [0.58, 0.222], [0.50, 0.17]], [[0.76, 0.222], [0.84, 0.238], [0.91, 0.225], [0.84, 0.17]],             // under the eyes
      [[0.24, 0.14], [0.36, 0.12], [0.42, -0.04], [0.36, -0.16], [0.24, -0.22], [0.20, -0.04]], [[0.94, 0.12], [1.04, 0.14], [1.07, 0.0], [0.98, -0.10], [0.92, -0.02]]],
    B: [[[0.415, 0.30], [0.50, 0.37], [0.59, 0.288], [0.50, 0.243]], [[0.75, 0.288], [0.84, 0.37], [0.925, 0.30], [0.84, 0.243]],          // both eyes, on us
      [[0.60, 0.14], [0.74, 0.14], [0.67, 0.04]], isl(0.67, 0.05, 0.67, -0.02, 0.03), isl(0.54, -0.07, 0.67, -0.02, 0.036, 0.012), isl(0.67, -0.02, 0.80, -0.07, 0.036, 0.012),
      [[0.25, 0.62], [0.30, 0.735], [0.39, 0.70], [0.35, 0.62]], [[0.82, 0.64], [0.86, 0.745], [0.94, 0.73], [0.93, 0.64]],
      isl(0.61, 0.64, 0.62, 0.45, 0.062), isl(0.72, 0.64, 0.71, 0.45, 0.062), isl(0.50, 0.60, 0.545, 0.48, 0.05), isl(0.83, 0.60, 0.79, 0.48, 0.05),
      isl(0.39, 0.25, 0.25, 0.15, 0.07, 0.02), isl(0.41, 0.07, 0.31, -0.10, 0.062, 0.02),
      isl(0.95, 0.25, 1.06, 0.17, 0.062, -0.02), isl(0.93, 0.07, 1.0, -0.08, 0.056, -0.02),
      isl(0.08, 0.40, 0.03, -0.14, 0.085, -0.02), isl(-0.12, 0.35, -0.18, -0.22, 0.09, 0.02)] },
  foreU: { b: [-0.40, 0.40, -1.02, 0.40],
    R: [[[-0.22, 0.15], [0.0, 0.22], [0.22, 0.12], [0.21, -0.35], [0.14, -0.78], [0.0, -0.85], [-0.13, -0.78], [-0.19, -0.35]]],
    G: [isl(-0.13, -0.18, -0.08, -0.76, 0.07, 0.0)], B: [] },
  foreL: { b: [-0.34, 0.54, -1.00, 0.28],
    R: [[[-0.13, 0.10], [0.13, 0.10], [0.12, -0.30], [0.09, -0.56], [0.14, -0.66], [0.32, -0.70], [0.36, -0.79], [0.20, -0.83], [-0.08, -0.82], [-0.15, -0.74], [-0.10, -0.56], [-0.13, -0.30]]],
    G: [isl(-0.08, -0.05, -0.08, -0.62, 0.05, 0.0), [[0.06, -0.70], [0.2, -0.68], [0.29, -0.74], [0.1, -0.78]]],
    B: [isl(-0.11, -0.10, 0.10, -0.14, 0.055, 0.01), isl(-0.11, -0.27, 0.10, -0.30, 0.05, -0.01), isl(-0.10, -0.43, 0.10, -0.46, 0.045, 0.01),
      isl(0.20, -0.70, 0.215, -0.78, 0.02), isl(0.11, -0.71, 0.12, -0.79, 0.02)] },
  hindU: { b: [-0.54, 0.64, -1.00, 0.48],
    R: [[[-0.35, 0.18], [0.0, 0.30], [0.36, 0.15], [0.45, -0.25], [0.36, -0.62], [0.2, -0.80], [0.02, -0.78], [-0.12, -0.5], [-0.3, -0.2]]],
    G: [isl(-0.06, -0.42, 0.06, -0.74, 0.08, 0.0)], B: [] },
  hindL: { b: [-0.58, 0.40, -1.12, 0.32],
    R: [[[-0.12, 0.14], [0.16, 0.08], [0.12, -0.16], [-0.08, -0.40], [-0.10, -0.66], [0.02, -0.78], [0.20, -0.82], [0.22, -0.91], [-0.14, -0.94], [-0.30, -0.84], [-0.36, -0.62], [-0.40, -0.40], [-0.28, -0.14]]],
    G: [isl(-0.02, -0.06, -0.26, -0.40, 0.05, 0.0), [[-0.16, -0.84], [-0.02, -0.82], [0.07, -0.87], [-0.12, -0.9]]],
    B: [isl(-0.2, -0.08, 0.10, -0.06, 0.05, 0.01), isl(-0.30, -0.26, -0.03, -0.30, 0.05, 0.0), isl(-0.34, -0.50, -0.14, -0.50, 0.045, 0.01),
      isl(-0.30, -0.66, -0.12, -0.64, 0.04, 0.0), isl(-0.02, -0.83, -0.01, -0.91, 0.02)] },
  tail: { b: [-0.80, 0.24, -0.26, 0.26],
    R: [[[0.08, 0.0], [0.0, 0.09], [-0.3, 0.085], [-0.6, 0.075], [-0.66, 0.0], [-0.6, -0.075], [-0.3, -0.085], [0.0, -0.09]]],
    G: [], B: [isl(-0.16, 0.085, -0.19, -0.085, 0.07, 0.0), isl(-0.42, 0.08, -0.44, -0.08, 0.065, 0.0)] },
  tailTip: { b: [-0.80, 0.24, -0.26, 0.26],
    R: [[[0.08, 0.0], [0.0, 0.08], [-0.3, 0.085], [-0.56, 0.08], [-0.66, 0.0], [-0.56, -0.08], [-0.3, -0.085], [0.0, -0.08]]],
    G: [], B: [isl(-0.14, 0.08, -0.17, -0.08, 0.07, 0.0), [[-0.36, 0.0], [-0.42, 0.085], [-0.57, 0.08], [-0.665, 0.0], [-0.57, -0.08], [-0.42, -0.085]]] },
};

const ATLAS_PX = 1024, ATLAS_S = 180;                                  // pixels per drawn metre
function traceShape(c, pts) {                                           // closed Catmull-Rom through the points
  const n = pts.length; c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  c.closePath();
}
/** Paints the cut cards into one canvas atlas: R wide-blurred (the fade and its halo; its 0.5 level is the silhouette),
 *  G and B lightly blurred so the knife line can be re-cut at any size. Returns { texture, cells }. */
async function buildTigerAtlas(ctx) {
  const cv = document.createElement('canvas'); cv.width = cv.height = ATLAS_PX;
  const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, ATLAS_PX, ATLAS_PX);
  let x = 0, y = 0, rowH = 0; const cells = {}, S = ATLAS_S, FAR = 3000;
  for (const name of Object.keys(PARTS)) {
    const P = PARTS[name], w = Math.ceil((P.b[1] - P.b[0]) * S), h = Math.ceil((P.b[3] - P.b[2]) * S);
    if (x + w > ATLAS_PX) { x = 0; y += rowH + 2; rowH = 0; }
    cells[name] = { x, y, w, h, b: P.b };
    for (const [ch, col, blur] of [['R', '#ff0000', 15], ['G', '#00ff00', 2.4], ['B', '#0000ff', 2.4]]) {
      if (!P[ch].length) continue;
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.globalCompositeOperation = 'lighter'; c.fillStyle = col;
      c.shadowColor = col; c.shadowBlur = blur; c.shadowOffsetX = FAR; c.shadowOffsetY = 0;   // only the blurred shadow lands in the cell
      c.setTransform(S, 0, 0, -S, x - P.b[0] * S - FAR, y + P.b[3] * S);
      for (const shape of P[ch]) { c.beginPath(); traceShape(c, shape); c.fill(); }
      c.restore();
      await ctx.yield();
    }
    x += w + 2; rowH = Math.max(rowH, h);
    await ctx.yield();
  }
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.NoColorSpace; texture.generateMipmaps = true; texture.minFilter = THREE.LinearMipmapLinear;
  texture.magFilter = THREE.LinearFilter; texture.anisotropy = 4;
  return { texture, cells };
}

// The rig: 15 cards in drawing order (far legs, tail, torso, near legs, the two heads). depth = metres toward
// the far side of the animal (+) or the near side (-), so the cards of one pass part in parallax too.
const RIG = [
  { name: 'fHindU', cell: 'hindU', depth: 0.06, stripe: 1 }, { name: 'fHindL', cell: 'hindL', depth: 0.06, stripe: 0 },
  { name: 'fForeU', cell: 'foreU', depth: 0.06, stripe: 1 }, { name: 'fForeL', cell: 'foreL', depth: 0.06, stripe: 0 },
  { name: 'tail1', cell: 'tail', depth: 0.02, stripe: 0 }, { name: 'tail2', cell: 'tail', depth: 0.02, stripe: 0 },
  { name: 'tail3', cell: 'tail', depth: 0.02, stripe: 0 }, { name: 'tail4', cell: 'tailTip', depth: 0.02, stripe: 0 },
  { name: 'torso', cell: 'torso', depth: 0, stripe: 1 },
  { name: 'nHindU', cell: 'hindU', depth: -0.06, stripe: 1 }, { name: 'nHindL', cell: 'hindL', depth: -0.06, stripe: 0 },
  { name: 'nForeU', cell: 'foreU', depth: -0.06, stripe: 1 }, { name: 'nForeL', cell: 'foreL', depth: -0.06, stripe: 0 },
  { name: 'headA', cell: 'headA', depth: -0.08, stripe: 0 }, { name: 'headB', cell: 'headB', depth: -0.08, stripe: 0, k: 1.28 },   // the face turned to us is cut a size larger
];
const RI = Object.fromEntries(RIG.map((r, i) => [r.name, i]));
// joints, in drawn metres: on the torso card, and from each upper limb to its lower
const J = { shoulder: [1.02, -0.08], hip: [-1.12, -0.02], neck: [1.36, 0.16], tail: [-1.56, 0.16], elbow: [0.0, -0.72], stifle: [0.16, -0.66], tailLen: 0.52, stand: 1.50 };

/** One geometry for all three passes: a quad per card. rest = uPart values of the standing pose, u0 = stand
 *  metres of the body's origin, so aWall puts THE CARD on the animal exactly where the wall has it. */
function buildRigGeometry(cells, rest, u0) {
  const n = RIG.length, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), part = new Float32Array(n * 4), wall = new Float32Array(n * 8), str = new Float32Array(n * 4), idx = [];
  RIG.forEach((r, i) => {
    const ce = cells[r.cell], b = ce.b, P = rest[i], cs = Math.cos(P.z), sn = Math.sin(P.z);
    for (let k = 0; k < 4; k++) {
      const fx = k & 1, fy = k >> 1, ks = TIGER_SCALE * (r.k || 1), lx = (fx ? b[1] : b[0]) * ks, ly = (fy ? b[3] : b[2]) * ks;
      pos.set([lx, ly, r.depth], i * 12 + k * 3);
      uv.set([(ce.x + fx * ce.w) / ATLAS_PX, 1 - (ce.y + (1 - fy) * ce.h) / ATLAS_PX], i * 8 + k * 2);
      part[i * 4 + k] = i; str[i * 4 + k] = r.stripe;
      wall.set([u0 + cs * lx - sn * ly + P.x, sn * lx + cs * ly + P.y], i * 8 + k * 2);
    }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); g.setAttribute('aWall', new THREE.BufferAttribute(wall, 2));
  g.setAttribute('aStripe', new THREE.BufferAttribute(str, 1)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 9);
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// The performance, as pure functions of T (seconds, 0..DUR): any pass may be asked for any moment, which is
// how a pass lags. s = metres along the track; the track is: along the port wall (+Z), a turn to starboard,
// straight across the trail in three bounds, a second turn, and a stop against the far wall facing back.
// ---------------------------------------------------------------------------------------------------------
const DUR = 8, sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const V_KEYS = [[0.3, 0], [0.8, 1.8], [1.5, 2.4], [2.3, 5.8], [3.5, 6.0], [3.9, 5.2], [4.25, 4.0], [4.6, 9], [4.9, 11], [6.2, 11], [6.4, 8], [6.62, 3.5], [6.9, 0]];
const PH = [0.3, 3.9, 4.6, 6.4, 6.9];                                    // phase boundaries: pace, turn, bounds, stop
function makeTimeline(geo) {
  const N = 800, dt = DUR / N, vt = new Float32Array(N + 1), st = new Float32Array(N + 1);
  const Lb = geo.Lb ?? geo.L2, need = [null, geo.arc1, Lb, geo.arc2 + geo.L3 - (Lb - geo.L2)];
  const vKey = (T) => { for (let i = 0; i < V_KEYS.length - 1; i++) { const a = V_KEYS[i], b = V_KEYS[i + 1]; if (T >= a[0] && T < b[0]) return a[1] + (b[1] - a[1]) * sm(a[0], b[0], T); } return 0; };
  const raw = [0, 0, 0, 0]; for (let i = 0; i < N; i++) { const T = (i + 0.5) * dt; for (let p = 0; p < 4; p++) if (T >= PH[p] && T < PH[p + 1]) raw[p] += vKey(T) * dt; }
  const scale = raw.map((r, p) => (need[p] ? need[p] / Math.max(r, 1e-3) : 1));
  for (let i = 0; i < N; i++) { const T = (i + 0.5) * dt; let k = 0; for (let p = 0; p < 4; p++) if (T >= PH[p] && T < PH[p + 1]) k = scale[p]; vt[i] = vKey(T) * k; st[i + 1] = st[i] + vt[i] * dt; }
  vt[N] = 0;
  const look = (tab, T) => { const x = Math.min(N - 1e-3, Math.max(0, T / dt)), i = Math.floor(x), f = x - i; return tab[i] + (tab[i + 1] - tab[i]) * f; };
  const L1 = look(st, PH[1]);
  return { L1, total: st[N], s: (T) => look(st, T), v: (T) => look(vt, Math.max(0, T - dt * 0.5)) };
}
const tFwd = (h) => [Math.sin(h), Math.cos(h)], tRight = (h) => [-Math.cos(h), Math.sin(h)];   // +X is port, so her right hand at heading 0 is -X
/** Lays the track out from its angles and lengths: pacing line (heading -beta), a right turn onto the crossing line
 *  (heading -gamma, through the origin d0 metres on), three bounds, then either a right turn to face back (the old act)
 *  or, with endFwd, a left turn to run on beside the far wall and stop facing the course. */
function layTrack(g) {
  const f2 = tFwd(-g.gamma), r2v = tRight(-g.gamma), f1 = tFwd(-g.beta), r1v = tRight(-g.beta);
  g.P2 = [g.d0 * Math.sin(g.gamma), -g.d0 * Math.cos(g.gamma)];
  g.C1 = [g.P2[0] + g.r1 * r2v[0], g.P2[1] + g.r1 * r2v[1]];
  g.P1 = [g.C1[0] - g.r1 * r1v[0], g.C1[1] - g.r1 * r1v[1]];
  g.S = [g.P1[0] - g.L1 * f1[0], g.P1[1] - g.L1 * f1[1]];
  g.P3 = [g.P2[0] + g.L2 * f2[0], g.P2[1] + g.L2 * f2[1]];
  if (g.endFwd) { g.C2 = [g.P3[0] - g.r2 * r2v[0], g.P3[1] - g.r2 * r2v[1]]; g.hEnd = g.hook || 0; g.P4 = [g.C2[0] - g.r2 * Math.cos(g.hEnd), g.C2[1] + g.r2 * Math.sin(g.hEnd)]; }
  else { g.C2 = [g.P3[0] + g.r2 * r2v[0], g.P3[1] + g.r2 * r2v[1]]; g.hEnd = -Math.PI; g.P4 = [g.C2[0] - g.r2, g.C2[1]]; }
  return g;
}
function trackAt(g, s, out) {                                           // -> out.x, out.z, out.h (heading: forward = (sin h, cos h))
  const s1 = g.L1, s2 = s1 + g.arc1, s3 = s2 + g.L2, s4 = s3 + g.arc2;
  if (s < s1) { out.x = g.S[0] - Math.sin(g.beta) * s; out.z = g.S[1] + Math.cos(g.beta) * s; out.h = -g.beta; }
  else if (s < s2) { const h = -g.beta - (s - s1) / g.r1; out.x = g.C1[0] + g.r1 * Math.cos(h); out.z = g.C1[1] - g.r1 * Math.sin(h); out.h = h; }
  else if (s < s3) { out.x = g.P2[0] - Math.sin(g.gamma) * (s - s2); out.z = g.P2[1] + Math.cos(g.gamma) * (s - s2); out.h = -g.gamma; }
  else if (s < s4) {
    if (g.endFwd) { const h = -g.gamma + (s - s3) / g.r2; out.x = g.C2[0] - g.r2 * Math.cos(h); out.z = g.C2[1] + g.r2 * Math.sin(h); out.h = h; }
    else { const h = -g.gamma - (s - s3) / g.r2; out.x = g.C2[0] + g.r2 * Math.cos(h); out.z = g.C2[1] - g.r2 * Math.sin(h); out.h = h; }
  } else { out.x = g.P4[0] + Math.sin(g.hEnd) * (s - s4); out.z = g.P4[1] + Math.cos(g.hEnd) * (s - s4); out.h = g.hEnd; }
  return out;
}
const TAU = Math.PI * 2;
/** Fills parts[15] (Vector4: x, y, angle, visibility; world metres in the animal's plane) for moment T. */
function poseAt(tl, g, T, parts, jit, sOff = 0) {
  const s = tl.s(T) + sOff, K = TIGER_SCALE;
  const move = sm(0.3, 0.8, T) * (1 - sm(6.6, 6.9, T));
  const wB = sm(4.45, 4.65, T) * (1 - sm(6.38, 6.6, T)), wL = sm(1.5, 2.3, T) * (1 - sm(3.75, 4.2, T));
  const wW = Math.max(0, move - wB - wL), wS = 1 - move;
  const cr = sm(3.8, 4.3, T) * (1 - sm(4.45, 4.7, T)) + 0.6 * sm(6.4, 6.6, T) * (1 - sm(6.7, 7.0, T));
  const pW = s / 1.9, pL = s / 3.3, pB = (s - (g.L1 + g.arc1)) / g.stride;
  // angles: [nearFore upper, lower, farFore upper, lower, nearHind upper, lower, farHind upper, lower]
  const A = [0, 0, 0, 0, 0, 0, 0, 0];
  const add = (w, i, up, lo) => { A[i] += w * up; A[i + 1] += w * lo; };
  if (wS > 0) { add(wS, 0, 0.04, 0.0); add(wS, 2, -0.08, -0.02); add(wS, 4, 0.10, 0.05); add(wS, 6, 0.0, 0.0); }
  if (wW > 0) [[0.25, 0, 0], [0.75, 2, 0], [0.0, 4, 1], [0.5, 6, 1]].forEach(([o, i, hind]) => {
    const c = TAU * (pW + o), sn = Math.sin(c), fold = Math.max(0, Math.cos(c));
    if (hind) { const a = 0.12 + 0.36 * sn; add(wW, i, a, 0.5 * a - 0.45 * fold); } else { const a = 0.05 + 0.40 * sn; add(wW, i, a, a - 0.75 * fold); }
  });
  let y = 0.03 * wW * Math.sin(2 * TAU * pW), pitch = 0.02 * wW * Math.sin(2 * TAU * pW + 1);
  const gallop = (w, f, amp) => { if (w <= 0) return;
    [[0.0, 0], [0.07, 2], [0.0, 4], [0.06, 6]].forEach(([o, i]) => {
      const c = TAU * (f - o), st = Math.cos(c - TAU * 0.25);
      if (i < 4) { const a = 0.25 + 0.95 * amp * st; add(w, i, a, a - 1.1 * amp * Math.max(0, Math.cos(c))); }
      else { const a = -0.1 - 1.0 * amp * st; add(w, i, a, 0.6 * a - 0.5 * amp * Math.max(0, -Math.cos(c))); }
    });
    const sp = Math.sin(Math.PI * f); y += w * 1.0 * amp * amp * sp * sp; pitch += w * 0.22 * amp * Math.cos(TAU * (f - 0.08));
  };
  gallop(wL, pL, 0.6); gallop(wB, pB, 1.0);
  add(cr, 0, -0.35, 0.45); add(cr, 2, -0.3, 0.4); add(cr, 4, 0.42, -0.2); add(cr, 6, 0.36, -0.16);
  y -= 0.24 * cr; pitch += 0.09 * cr;
  const cp = Math.cos(pitch), sp = Math.sin(pitch), ty = J.stand + y;
  const at = (j) => [cp * j[0] - sp * j[1], ty + sp * j[0] + cp * j[1]];
  const set = (name, x, yy, a, v = 1) => parts[RI[name]].set(x * K, yy * K, a, v);
  set('torso', 0, ty, pitch);
  const leg = (up, lo, joint, knee, a, b) => { const p = at(joint), ca = Math.cos(a), sa = Math.sin(a);
    set(up, p[0], p[1], a); set(lo, p[0] + ca * knee[0] - sa * knee[1], p[1] + sa * knee[0] + ca * knee[1], b); };
  leg('nForeU', 'nForeL', J.shoulder, J.elbow, A[0], A[1]); leg('fForeU', 'fForeL', [J.shoulder[0] + 0.07, J.shoulder[1]], J.elbow, A[2], A[3]);
  leg('nHindU', 'nHindL', J.hip, J.stifle, A[4], A[5]); leg('fHindU', 'fHindL', [J.hip[0] + 0.09, J.hip[1]], J.stifle, A[6], A[7]);
  const hb = sm(3.3, 3.52, T) * (1 - sm(4.5, 4.68, T)), np = at(J.neck);
  const ha = -0.55 * pitch - 0.16 * wW - 0.05 * wL + 0.10 * wB + 0.03 * Math.sin(TAU * pW * 2 + 0.5) * wW - 0.12 * cr + jit * 0.03;
  set('headA', np[0], np[1], ha, 1 - hb); set('headB', np[0] - 0.02, np[1] + 0.02, ha + 0.05, hb);
  let tp = at(J.tail), ta = pitch;
  const droop = [0.55, 0.28, -0.12, -0.42], fly = [0.12, -0.02, -0.14, -0.2], fast = Math.min(1, wL + wB), ph = wB > 0.5 ? pB : (wL > 0.3 ? pL : pW);
  for (let i = 0; i < 4; i++) {
    ta += droop[i] + (fly[i] - droop[i]) * fast + (0.10 + 0.22 * fast + 0.1 * cr) * Math.sin(TAU * (ph - 0.16 * i) + 1.0) * move + 0.05 * Math.sin(T * 1.3 + i) * wS;
    ta = Math.max(0.07 - 0.4 * wB, ta);                                 // the tail streams below the line of her back; only a bound lifts it
    set('tail' + (i + 1), tp[0], tp[1], ta);
    tp = [tp[0] - Math.cos(ta) * J.tailLen, tp[1] - Math.sin(ta) * J.tailLen];
  }
  return { s, y: ty * K, hb, wB, pB, move };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('tiger') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const style = opts.style || makeStyle(opts.palette || PALETTE);
  const crossFrom = opts.crossFrom ?? 11, farWallIn = opts.farWallX ?? 11.5, wallH = opts.wallHeight ?? CARD.height;
  const beta = Math.min(1.2, Math.max(0, opts.wallYaw ?? 0.6));           // how far the port wall is turned across the view (0 = parallel to the trail)
  const object = new THREE.Group(); object.name = 'stripes-in-the-grass:tiger';
  const root = new THREE.Group(); root.add(object);
  // The turntable: until setProgress() is first called (the set-piece viewer never calls it) the stage is turned and slid
  // every frame so that she is side-on to the camera at the origin, and the act plays on a loop offset by the camera's
  // azimuth, so an orbit shows the lope, the head swing and a bound. opts.sweep / &tigerSweep=<zoom> enlarges the stage and
  // opts.sweepT / &tigerT=<seconds> holds one moment (art-direction aids). A world calls setProgress() and none of this runs.
  let sweep = opts.sweep ?? 0;
  let fixT = opts.sweepT ?? -1;
  // (the page-query form of this aid was removed at hand-in: worlds may not read the URL; pass opts.sweep / opts.sweepT)

  // ---- the track and the clock
  const gamma = Math.min(Math.PI / 2, Math.max(beta + 0.3, opts.crossAngle ?? Math.PI / 2));   // heading of the bounds off the course (pi/2 = square across)
  // opts.hook (radians, with endAhead): on the far side she hooks on round to port by this much past the course and stops flat against a
  // return of the starboard wall that is turned toward the lens; opts.straight = how many of the three bounds run straight (the rest follow the hook)
  const hook = opts.endAhead ? Math.max(0, opts.hook ?? 0) : 0;
  const g = { beta, gamma, r1: 2.5, r2: opts.endAhead ? (opts.hookRadius ?? 3.2) : 2.0, L3: opts.endAhead ? (opts.runOn ?? 5.0) : 1.0, endFwd: !!opts.endAhead, d0: opts.crossLead ?? crossFrom, hook };
  g.Lb = opts.stride ? 3 * opts.stride : g.d0 + (farWallIn - 0.7 - g.r2 * (1 + Math.cos(gamma))) / Math.sin(gamma);
  g.L2 = g.Lb * Math.min(3, Math.max(1.5, hook > 0 ? (opts.straight ?? 3) : 3)) / 3;
  g.arc1 = g.r1 * (gamma - beta); g.arc2 = g.endFwd ? g.r2 * (gamma + hook) : g.r2 * (Math.PI - gamma); g.stride = g.Lb / 3;
  const tl = makeTimeline(g); g.L1 = tl.L1; layTrack(g);
  const cb = Math.cos(beta), sb = Math.sin(beta), A1 = g.P1;                                         // where the pacing line meets the turn
  g.sx = g.S[0]; g.sz = g.S[1]; g.xS = g.P2[0];                                                      // where she stands at rest
  const farWallX = hook > 0 ? farWallIn : 0.7 - g.P4[0];                                             // the starboard wall (with a hook she vanishes into its return)
  const uOff = Math.floor(rng.range(0, 40)) * CARD.column + rng.range(0, CARD.column);   // which stripes of the card she is
  const jit = rng.range(-1, 1);
  const hE = g.hEnd, sE = Math.sin(hE), cE = Math.cos(hE), sLeft = g.L3;      // metres from the end of the last turn to her stop
  const xEnd = g.P4[0] + sE * sLeft, zEnd = g.P4[1] + cE * sLeft;                    // where she stops, flat against the far wall or its return
  await ctx.yield();

  // ---- the cards
  const { texture, cells } = await buildTigerAtlas(ctx);
  const rest = RIG.map(() => new THREE.Vector4());
  poseAt(tl, g, 0, rest, jit);
  const u0body = uOff + 16, rigGeo = buildRigGeometry(cells, rest, u0body);
  await ctx.yield();

  // passes in spraying order: teal shadow, orange fade, white, black. delay = how far behind the pass runs (s).
  const PASS = [
    { key: 'shadow', kind: 3, can: CAN.teal, delay: 0.06, gap: -1.3 },
    { key: 'fade', kind: 0, can: CAN.orange, delay: 0, gap: 0 },
    { key: 'white', kind: 1, can: CAN.white, delay: 0.12, gap: 1 },
    { key: 'black', kind: 2, can: CAN.black, delay: 0.25, gap: 2 },
  ];
  // the white tiger: her body is sprayed in white through the same card, and the patch card (belly, cheek, legs) in straw
  if (opts.white) { PASS[1].can = CAN.white; PASS[2].can = CAN.straw; }
  const mkSet = (set, k, ro) => set.forEach((p, i) => {
    p.mat = cardMaterial(style, { kind: p.kind, can: p.can, atlas: texture, order: i });
    p.mesh = new THREE.Mesh(rigGeo, p.mat); p.mesh.frustumCulled = false; p.mesh.renderOrder = ro + i; p.mesh.rotation.order = 'YXZ'; p.mesh.scale.setScalar(k); object.add(p.mesh);
    p.tr = { x: 0, z: 0, h: 0 }; p.mis = i < 2 ? [0, 0] : [rng.range(-0.06, 0.06), rng.range(-0.035, 0.035)];   // a pass a hand out of place
  });
  mkSet(PASS, 1, 20);
  // when her colours have drained she stands as stripes alone: for that second the white mist behind her lies thickest inside her own
  // outline (the fade card again, in the white can), so the stripes stand on a pale tiger and not on a panel of the wall
  const pale = new THREE.Mesh(rigGeo, cardMaterial(style, { kind: 0, can: CAN.white, atlas: texture, order: 0 }));
  pale.material.uniforms.uPart = PASS[1].mat.uniforms.uPart; pale.material.uniforms.uReg.value = 0; pale.frustumCulled = false; pale.renderOrder = 20.5; pale.rotation.order = 'YXZ'; object.add(pale);
  // the rare event: two cubs, the same cards at half size, waiting in the port wall further along (opts.cubs). They share her
  // programs and are in the scene from build, unsprayed (uReg 0) until setProgress() runs past the end of her act.
  const CUBS = [];
  if (opts.cubs) for (let c = 0; c < 2; c++) {
    const set = PASS.map((p) => ({ key: p.key, kind: p.kind, can: p.can, delay: p.delay * 1.5, gap: p.gap }));
    mkSet(set, 0.5, 12 + c * 4);
    CUBS.push({ set, start: c ? 5.45 : 4.7, along: c ? 15.5 : 12, tum: c ? -1 : 1, ph: rng.range(0, 6) });
  }
  await ctx.yield();

  // ---- the two walls she is cut from (the world's grass stands in front of and around them)
  const wl = (d) => [g.sx - sb * d + cb * 0.7, g.sz + cb * d + sb * 0.7];                           // the port wall's line, d metres on from her rest
  const wAhead = opts.wallAhead ?? 9, wBack = opts.wallBack ?? 16;
  const panels = [
    { a: wl(-wBack), b: wl(g.L1 + wAhead), front: [-cb, -sb], u0: uOff + 16 - wBack, height: wallH, teal: opts.darkWall !== false },
    hook > 0 ? { a: [-farWallX, -26], b: [-farWallX, 2], front: [1, 0], u0: u0body - 40, height: wallH }
      : g.endFwd ? { a: [-farWallX, zEnd - 20], b: [-farWallX, zEnd + wAhead + 6], front: [1, 0], u0: u0body - 20, height: wallH }
      : { a: [-farWallX, 10], b: [-farWallX, zEnd - 18], front: [1, 0], u0: u0body + zEnd - 10, height: wallH },
  ];
  // the return: a stretch of the starboard stand turned toward the lens, in her own plane and stand metres, so its islands are hers
  let ret = null;
  if (hook > 0) { const wx = xEnd - cE * 0.7, wz = zEnd + sE * 0.7, la = Math.min(opts.returnBack ?? 12, (wx + farWallX) / Math.max(sE, 0.2)), lb = opts.returnAhead ?? 3.1;
    ret = { a: [wx - sE * la, wz - cE * la], b: [wx + sE * lb, wz + cE * lb], front: [cE, -sE], u0: u0body - la, height: wallH }; }
  let wall = null, retWall = null, drips = [];
  if (opts.walls !== false) {
    wall = new THREE.Mesh(buildWallGeometry(panels), wallMaterial(style, { slip: 1 })); wall.renderOrder = 4; wall.frustumCulled = false; object.add(wall);
    if (ret) { retWall = new THREE.Mesh(buildWallGeometry([ret]), wallMaterial(style, { slip: 0, show: 0 })); retWall.renderOrder = 17; retWall.frustumCulled = false; retWall.material.uniforms.uHold.value.set(u0body + 0.6, 3.9); object.add(retWall); }
    const mk = (n, yLo, yHi, len) => { const list = [];
      for (let i = 0; i < n; i++) { const p = panels[i % 2], f = rng(), x = p.a[0] + (p.b[0] - p.a[0]) * f + p.front[0] * 0.02, z = p.a[1] + (p.b[1] - p.a[1]) * f + p.front[1] * 0.02;
        list.push({ at: [x, rng.range(yLo, yHi), z], tangent: [-p.front[1], 0, p.front[0]], length: rng.range(len * 0.4, len), phase: rng(), speed: rng.range(0.7, 1.4) }); }
      return list; };
    const dB = new THREE.Mesh(buildDripGeometry(mk(Math.round(22 * detail), 0.5, 2.3, 0.7)), dripMaterial(style, { can: CAN.black }));
    const dO = new THREE.Mesh(buildDripGeometry(mk(Math.round(10 * detail), 0.4, 1.6, 0.5)), dripMaterial(style, { can: CAN.orange }));
    dB.renderOrder = 6; dO.renderOrder = 3; dB.frustumCulled = dO.frustumCulled = false; object.add(dB, dO); drips = [dB, dO];
  }
  await ctx.yield();

  // ---- soft quads: the sprayed floor, the ghost rectangle of her card, her halo, the stripes' own halo, the puff of mist
  const quad = new THREE.PlaneGeometry(1, 1);
  const soft = (o, sx, sy, ro) => { const m = new THREE.Mesh(quad, sprayMaterial(style, o)); m.scale.set(sx, sy, 1); m.renderOrder = ro; m.frustumCulled = false; object.add(m); return m; };
  let floor = null;
  if (opts.ground !== false) { floor = soft({ can: CAN.straw, shape: 2, alpha: 1, seed: rng.range(0, 9) }, 110, 110, 1); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.02, -8); }
  const bodyCan = opts.white ? CAN.white : CAN.orange;
  const ghost = soft({ can: bodyCan, shape: 1, alpha: 0.42, seed: rng.range(0, 9), inner: [0.86, 0.78] }, 7.5, 4.5, 18);
  const halo = soft({ can: bodyCan, shape: 0, alpha: 0.11, seed: rng.range(0, 9) }, 6.6, 3.4, 19);
  const backA = opts.white ? 0.72 : 0.66, back = soft({ can: opts.white ? CAN.straw : CAN.white, shape: 3, alpha: 0.0, seed: rng.range(0, 9) }, 15, 4.0, 16);
  const haloK = soft({ can: CAN.black, shape: 0, alpha: 0.0, seed: rng.range(0, 9) }, 6.4, 3.4, 22);
  const puff = soft({ can: CAN.white, shape: 0, alpha: 0.0, seed: rng.range(0, 9) }, 3.4, 3.2, 19.5);   // sprayed before her passes: a halo behind the head, never across the face
  const puffS = soft({ can: CAN.white, shape: 0, alpha: 0.0, seed: rng.range(0, 9) }, 5.5, 2.2, 17);       // dust where she lands
  await ctx.yield();

  // ---- overspray dust: specks of all five cans, born along her trail, riding the wind to starboard
  const ND = Math.round(900 * detail), dPos = new Float32Array(ND * 3), dSeed = new Float32Array(ND * 4);
  for (let i = 0; i < ND; i++) { dPos.set([rng.range(-1.6, 1.6), rng.range(0.1, 2.9), rng.range(-1.6, 1.6)], i * 3); dSeed.set([rng(), rng(), i % 16, rng()], i * 4); }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 4));
  const dustMat = dustMaterial(style), dust = new THREE.Points(dGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 26; object.add(dust);
  let dHead = 0, dAcc = 0; const ghostTilt = rng.range(-0.05, 0.05);
  await ctx.yield();

  // ---- the performance
  let progress = -1, lastNow = 0, leadM = 0, showK = 1; const camL = new THREE.Vector3(0, 0, -1e4);
  const sC = g.L1 + g.arc1, total = tl.total, o = { x: 0, z: 0, h: 0 };
  const tigerAt = (u, target = new THREE.Vector3(), lead = 0) => { const T = Math.min(1, Math.max(0, u)) * DUR; trackAt(g, Math.min(total, tl.s(T) - lead), o);
    const l0 = 0.67 * (1 - sm(0.3, 1.6, T)), e0 = 0.67 * sm(6.45, 6.95, T); return target.set(o.x + cb * l0 - cE * e0, 1.7, o.z + sb * l0 + sE * e0); };
  // one animal's passes at moment T: each pass on its own delay, unpicked by the leap. off = [x, z] shift of the whole track,
  // k = size, tum = how hard it tumbles in its own plane while in the air (the cubs)
  function drive(set, T, off, k, tum, vis, Tx = T, sOff = 0) {
    // she stops, her orange and white drain first, and for a second she stands as stripes only, in the wall's own rows; then nothing (Tx runs on past the act)
    const reg = sm(0.3, 1.0, T) * (1 - sm(7.2, 7.5, Tx)) * vis, regK = sm(0.22, 0.5, T) * (1 - sm(8.3, 8.65, Tx)) * vis;
    const l0 = 0.67 * (1 - sm(0.3, 1.6, T)), e0 = 0.67 * sm(6.45, 6.95, T), latX = cb * l0 - cE * e0, latZ = sb * l0 + sE * e0;
    let fade = null, fl0 = 0, lag = 0; const sq = progress >= 0 ? sm(0.4, 1.0, T) * (1 - sm(6.5, 6.85, T)) : 0;   // held until she stops; she swings flat to the wall as she falls into register
    for (const p of set) {
      const Tp = Math.max(0, T - p.delay), info = poseAt(tl, g, Math.max(0, T - p.delay * 0.2), p.mat.uniforms.uPart.value, jit, sOff);
      const fb = info.pB - Math.floor(info.pB), sb2 = Math.sin(Math.PI * fb), fl = info.wB * sb2 * sb2;        // 0 on the ground, 1 at the top of a bound
      let sP = tl.s(Tp) + tl.v(Tp) * p.delay + sOff;
      if (p.key === 'black') sP -= 0.9 * fl * k; else if (p.key === 'white') sP -= 0.12 * fl * k;
      trackAt(g, Math.min(total, Math.max(-60, sP)), p.tr);
      // a card seen along its own edge is a line: while she runs, the hand turns each card to keep at least 50 degrees of it toward the lens
      let h = p.tr.h;
      if (sq > 0) { let dl = Math.atan2(camL.x - off[0] - p.tr.x, camL.z - off[1] - p.tr.z) - h; dl -= TAU * Math.round(dl / TAU);
        // (on either side of her; where she turns through our line of sight the card swings through its edge in a few frames, in the air)
        const ad = Math.abs(dl), want = Math.max(0.9, Math.min(Math.PI - 0.9, ad)); h += Math.sign(dl) * (ad - want) * sq * (1 - sm(2.75, 3.1, ad)) * sm(0.02, 0.3, ad); }
      p.hC = h;
      const d = -p.gap * 0.1 * reg * k, sl = p.key === 'shadow' ? reg : 0;
      const al = (0.11 * sl + p.mis[0] * reg) * k;
      p.mesh.position.set(off[0] + p.tr.x + latX + Math.cos(h) * d + Math.sin(h) * al, (-0.085 * sl + p.mis[1] * reg) * k, off[1] + p.tr.z + latZ - Math.sin(h) * d + Math.cos(h) * al);
      p.mesh.rotation.y = h; p.mesh.rotation.x = tum ? tum * 0.35 * fl * Math.sin(TAU * (info.pB - 4 * p.delay)) : 0;
      p.mat.uniforms.uReg.value = p.key === 'black' ? regK : reg; p.mat.uniforms.uLift.value = 1 + 2.5 * fl;
      if (p.key === 'fade') { fade = info; fl0 = fl; p.s = sP; } else if (p.key === 'black') lag = Math.abs(sP - set[1].s);
    }
    return { fade, fl0, lag, reg, regK };
  }
  const cubOff = [0, 0], noOff = [0, 0];
  function perform(T, now, Tx = T) {
    for (const c of CUBS) {                                              // the cubs join the act at a lope, when she has crossed
      const Tc = Math.min(DUR, 2.2 + Math.max(0, Tx - c.start));
      cubOff[0] = -sb * c.along; cubOff[1] = cb * c.along;
      drive(c.set, Tc, cubOff, 0.5, c.tum, sm(0.0, 0.5, Tx - c.start), 2.2 + Math.max(0, Tx - c.start));
    }
    const { fade, lag, reg, regK } = drive(PASS, T, noOff, 1, 0, showK, Math.max(T, Tx), -leadM);
    // the return is sprayed as she comes down on it; the black card of her own stretch only when she has stood there a while as stripes alone: it lands on her stripes, row for row, and she is gone
    { const Tm = Math.max(T, Tx), f0 = PASS[1].mesh; pale.position.copy(f0.position); pale.rotation.copy(f0.rotation); pale.material.uniforms.uReg.value = 0.72 * showK * sm(7.1, 7.45, Tm) * (1 - sm(8.25, 8.6, Tm)); }
    if (retWall) { const Tm = Math.max(T, Tx); retWall.material.uniforms.uShow.value = 0.55 * sm(5.55, 6.3, T) + 0.45 * Math.min(1, Math.max(0, (Tm - 7.65) / 0.65)); }
    const f = PASS[1], h = f.hC, fx = Math.sin(h), fz = Math.cos(h), nx = Math.cos(h), nz = -Math.sin(h), breathe = 1 + 0.2 * Math.sin(now * 1.9);
    const seat = (m, along, up, depth, src = f) => { m.position.set(src.mesh.position.x + fx * along + nx * depth, up, src.mesh.position.z + fz * along + nz * depth); m.rotation.y = h + Math.PI / 2; };
    seat(ghost, 0.5, fade.y + 0.05, 0.16); ghost.material.uniforms.uAlpha.value = 0.30 * reg; ghost.rotation.z = ghostTilt;
    seat(halo, 0.4, fade.y, 0.10); halo.material.uniforms.uAlpha.value = 0.11 * reg * breathe;
    seat(back, 0.3, 1.75, 0.42); back.material.uniforms.uAlpha.value = backA * showK * sm(0.3, 1.0, T) * (1 - sm(7.7, 8.3, Math.max(T, Tx))) * Math.max((opts.darkWall !== false ? 0.2 + 0.65 * sm(3.9, 4.6, T) : 0.85) * fade.move, sm(6.3, 6.8, T)) * (0.9 + 0.1 * breathe);   // overspray hanging behind her while she moves, and while she stands in her colours against the return
    seat(haloK, 0.3, fade.y, -0.14, PASS[3]); haloK.material.uniforms.uAlpha.value = regK * Math.min(0.09, 0.02 + 0.08 * lag) * breathe;
    const pf = sm(3.1, 3.38, T) * (1 - sm(3.7, 4.4, T)), grow = 1 + 0.5 * sm(3.1, 4.4, T);
    seat(puff, 2.15 * TIGER_SCALE, fade.y + 0.85, 0.3); puff.scale.set(3.4 * grow, 3.2 * grow, 1); puff.material.uniforms.uAlpha.value = 0.95 * pf;
    const lb = fade.pB - Math.floor(fade.pB), landed = fade.pB > 0.5 && fade.pB < 3.3 ? Math.exp(-lb * 5) * (fade.pB >= 1 ? 1 : 0) : 0;   // just after each landing
    trackAt(g, Math.min(total, sC + Math.floor(Math.max(0, fade.pB)) * g.stride), o);
    puffS.position.set(o.x, 0.9, o.z + 0.2); puffS.rotation.y = h + Math.PI / 2; puffS.scale.set(5.5 * (1 + lb), 2.2 * (1 + 0.6 * lb), 1);
    puffS.material.uniforms.uAlpha.value = 0.20 * landed;
    return { v: tl.v(T), reg };
  }
  function update(dt, time, camera) {
    style.update(time, ctx.renderer);
    if (camera && progress >= 0) { object.updateWorldMatrix(true, false); object.worldToLocal(camL.setFromMatrixPosition(camera.matrixWorld)); }
    let T;
    if (progress >= 0) T = Math.min(1, progress) * DUR;
    else if (camera) {                                                    // nobody set the progress: the turntable (see header)
      const e = camera.matrixWorld.elements; let az = Math.atan2(e[12], e[14]); if (az < -0.4) az += TAU;
      const loop = (((time - 12) + 2.75 + 0.92 * az) % (DUR + 2) + DUR + 2) % (DUR + 2);
      T = fixT >= 0 ? fixT : Math.min(DUR, loop);
      perform(T, time);
      const f = PASS[1].mesh.position, ph = az + Math.PI / 2 - PASS[1].tr.h, c = Math.cos(ph), sn = Math.sin(ph), zoom = sweep || 1;
      object.rotation.y = ph; object.scale.setScalar(zoom);
      object.position.set(-(f.x * c + f.z * sn) * zoom, 0, -(-f.x * sn + f.z * c) * zoom);
    } else T = 0;
    const r = perform(T, time, progress >= 0 ? progress * DUR : T);
    // lay the dust trail: one sample every 0.14 s while she moves
    dustMat.uniforms.uNow.value = time; dAcc += Math.min(0.1, Math.abs(time - lastNow)); lastNow = time;
    if (dAcc > 0.14) { dAcc = 0; const f = PASS[1].mesh.position; dHead = (dHead + 1) % 16;
      dustMat.uniforms.uTrail.value[dHead].set(f.x, f.z, time, Math.min(1, r.v / 9) * r.reg); }
  }
  perform(0, 0);

  // moments of the performance as progress values (T / DUR), for the world's choreography
  let Tmid = 5.5; for (let T = 4.6; T < 6.4; T += 0.01) if (tl.s(T) >= sC + 1.5 * g.stride) { Tmid = T; break; }
  const timing = { duration: DUR, stir: 0.3 / DUR, walk: 0.8 / DUR, lope: 2.3 / DUR, headSwing: 3.45 / DUR, firstBound: 4.6 / DUR, midSecondBound: Tmid / DUR,
    landed: 6.4 / DUR, gone: 7.95 / DUR };
  const anchors = {
    // the trail: the camera's line through the piece, 1.7 m up, at least 11 m from either wall
    flyThrough: [[0, 1.7, -70], [0, 1.7, -48], [0, 1.7, -28], [0, 1.7, -8], [0, 1.7, 14], [0, 1.7, 34]],
    cameraAtMidBound: [0, 1.7, -28],                     // be here at timing.midSecondBound and she is dead ahead, 28 m off
    viewpoints: { pacing: { pos: [0, 1.7, -46], look: [(g.sx + A1[0]) / 2, 1.9, (g.sz + A1[1]) / 2] }, crossing: { pos: [0, 1.7, -28], look: [0, 2.6, 0] },
      vanish: { pos: [0, 1.7, -16], look: [xEnd - cE * 0.67, 1.9, zEnd + sE * 0.67] } },
    restStart: [g.sx + cb * 0.67, 0, g.sz + sb * 0.67], restEnd: [xEnd - cE * 0.67, 0, zEnd + sE * 0.67],
    crossing: { from: [g.P2[0], 0, g.P2[1]], to: [g.P3[0], 0, g.P3[1]], stride: g.stride },
    track: { rest: g.S, paceEnd: g.P1, boundFrom: g.P2, boundTo: g.P3, turnEnd: g.P4, stop: [xEnd, zEnd], hEnd: hE, farWallX, ret: ret ? { a: ret.a, b: ret.b } : null },
    portWall: { a: [panels[0].a[0], 0, panels[0].a[1]], b: [panels[0].b[0], 0, panels[0].b[1]], u0: panels[0].u0, front: [-cb, 0, -sb] },
    farWall: { a: [panels[1].a[0], 0, panels[1].a[1]], b: [panels[1].b[0], 0, panels[1].b[1]], u0: panels[1].u0, front: [1, 0, 0] },
    portalSeat: null,                                    // the ring is not here: it stands on the sandbank, 240 m on
    timing,
  };
  return {
    object: root, radius: 5, height: 5, center: new THREE.Vector3(0, 2.0, 0), anchors, style, duration: DUR, timing,
    /** u = 0..1 over the 8 s performance (0 = not there yet, 1 = gone again). Advance it at about 1/8 per second. */
    /** lead (metres, optional): she walks the wall this far short of where the clock has her (hold u at the walk and run lead down to 0 for a long stalk); show 0..1 fades her passes in. */
    setProgress(u, lead = 0, show = 1) { if (progress < 0) { object.position.set(0, 0, 0); object.rotation.set(0, 0, 0); object.scale.setScalar(1); } progress = Math.min(2, Math.max(0, u)); leadM = Math.max(0, lead); showK = Math.min(1, Math.max(0, show)); },
    /** where she is (local space, 1.7 m up) at progress u: for a poi. */
    tigerAt,
    update,
    dispose() { texture.dispose(); },
    ground: false, groundY: 0,
  };
}
