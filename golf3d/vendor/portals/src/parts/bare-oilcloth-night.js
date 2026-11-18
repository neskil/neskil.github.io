// bare-oilcloth-night: THE WHITE SHE-BEAR (after Niko Pirosmani). Hero set piece and the STYLE KIT of the world.
//
// What it is: a slab-bodied sign animal 60 m long, 27 m at the shoulder, 8 m thick with rounded edges, in strict
// profile in the plane x = 0 (tail z = -30, nose z = +30), her full-solid head turned 70 degrees out of the picture
// toward +X with two round eyes that follow the camera. The body is the bare cloth (#121212, unlit): she exists only
// as dry bristle strokes dragged in overlapping lanes along her forms: a full first coat, a sparse dry second coat that
// lands ahead of the camera, and a far coat of fewer, bigger strokes. The black shows as bristle streaks ALONG each
// stroke and as gaps only where forms part, so it is outline, shadow, fur parting and night at once. Her head alone turns
// (bear.look.yaw, bone 7) to whoever is looking. Local -> world of the brief: add WORLD_OFFSET (30, 0, 110). She never rotates.
//
// HOW THE STYLE IS MADE (shade the whole world with these; nothing else is needed):
//   PALETTE, PIG            the six pigments and their indices (CLOTH, CREAM, OCHRE, BLUE, BRICK, GREEN). Flat colour:
//                           use post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } };
//                           no inverse tone map anywhere. A stroke carries ONE pigment index; nothing mixes.
//   makeStyleAsync(ctx, palette) / makeStyle(ctx, palette)
//                           -> style { uniforms, strokeMaterial(o), bodyMaterial(o), eyeMaterial(o), atlas, palette, dispose }.
//                           Make one per world, pass it to buildHero as opts.style. style.uniforms: uU (path progress, the
//                           only clock: set it every frame, or call hero.setProgress(u) which sets it), uWet (1 = rare
//                           event, nothing dries), uPal, uAtlas, uLod (near coat ends at x over band y; mid coat ends at z
//                           over band w), uLift, uBones (8 mat4; a stroke or body vertex names its bone; bone 0 = identity). level 3 = running water, 4 = falling dab, 5 = a hem that ripples.
//   THE LADDER OF DISTANCE  (level 6..9; the world's, for the laid cloth and the brick forms on it ONLY: no animal is on it)
//                           such a form is laid four times, in strokes about 0.5, 1.3, 2.7 and 4 m wide; the eye's
//                           distance in metres to a stroke picks the coat (uniforms uLad, uLadF, or o.lad of
//                           strokeMaterial; MIDLAD for a form 10 to 20 m long), so far off it is a few dozen broad
//                           strokes with the cloth between them. A stroke of kind 6 is the near brush of such a form.
//                           Within 30 m of the eye only the finest coat is drawn. A coat gives way to the next stroke
//                           by stroke: each stroke has its own place in the band from its own rank (its seed) and runs
//                           out from, or draws back to, its loaded end over a fifth of the band's metres.
//                           In the vertex shader strokes of the kinds 0..5 (every animal's, and everything else) are placed
//                           and sized as they always were. The dry drag below (streak) is one value for a whole material,
//                           so in the cloth's and the feast's materials it also falls on their strokes of kinds 2 and 5
//                           (the hem, the border lines, the fringe, the melon's rings); no animal is in those materials.
//   THE LANDING, FAR OFF    the second coat lands 30 to 60 m ahead of the eye, where the broader coats are what is drawn:
//                           so a share of every broader coat is second coat too. landBroad(sb, q0, s0, rule) gives the
//                           strokes of kinds 7..9 their birth from the form's own birth rule, called at each stroke's
//                           middle; the rule's draws for them come from a stream of the form's own, lent to the rule by
//                           lendRng(stream).lent(other, fn). The landing goes by places: a broad stroke under broader
//                           plates is second coat only if they are, and a broad second-coat stroke lands with the last
//                           finer second-coat stroke under it.
//                           strokeMaterial({ streak }) gives broad strokes their dry tracks and parted ends at the
//                           middle sizes (6 to 40 px wide), where the bristle atlas is too fine to show.
//   StrokeBuffer(rng)       .add(p, d, n, width, pigment, { bone, birth, level, bend, variant, seed }) then .build(material)
//                           -> one or two instanced meshes (flat quads; 3-segment strips for strokes that bend to the form).
//                           p = loaded end, d = direction * length, n = surface normal. birth < 0: first coat (there at
//                           u 0, dry). birth = u: lands from its loaded end over 0.012 u with a ragged bristle front,
//                           sits wet, then the gaps open (cover 90 % -> about 70 %) with no change of colour. level 2/1/0
//                           = near/mid/far coat: distance is fewer, bigger strokes (uLod), never haze. Unlanded strokes
//                           are collapsed in the vertex shader; nothing is ever visible = false or created in update().
//   makeLoft(stations, R, B), loftGeometry(loft, ns, nq, bone)
//                           every body is a few lofted tubes of superellipse section; the geometry is the black body.
//   paintLoft(sb, loft, rng, o) / await paintLoftAsync(sb, loft, rng, o, ctx.yield), flickRow(sb, loft, rng, o)
//                           lay broad strokes in lanes along a loft (never crossing; o.pig(P, N, s, f) picks the pigment
//                           or -1 to leave the cloth bare; o.birth(P, s)); combed rows of fur flicks at 60 degrees.
//                           Use them for jars, loaves, fish, deer, giraffe, haystacks: same hand everywhere.
//   buildBeast(ctx, style, { k, cub, ... })   the bear at any scale; cubs: k 0.2, cub true (painted all round, own bones,
//                           .setPose(phase, lean, amp)). buildHero(ctx, { cubs: true }) seats two at anchors.cubSeats.
//   buildCub(ctx, style, { k, rng, birth })  the cubs buildHero seats: a short round body, a big round head built straight
//                           ahead that bone 7 turns (look.yaw, look.pitch), full eye rounds, round ears, thick closed legs
//                           with brick pads; setPose(phase, lean, amp, bound) walks (bound 0) or bounds (bound 1). The
//                           world places and turns cub.object (rotation order YXZ) every frame.
//   STROKE_VERT/FRAG, BODY_VERT/FRAG, EYE_VERT/FRAG   the raw GLSL. The atlas (8 bristle variants, R = paint height
//                           equalised so cover = 1 - threshold, G = per-bristle lag) is filtered with fwidth; far away
//                           its mips average to flat pigment, so nothing shimmers.
//   The oilcloth ground/sky, its sheen band, moon, hills are the world's (plain #121212 + sheen <= #23272B; no sheen on
//   bodies or paint). Eye rounds: eyeMaterial plates (aP, aN, aA = radius, bone, seed, 0) turn to the camera, max 35 degrees.
//
// buildHero(ctx, opts) -> { object, radius 34, height 28, center, anchors, style, bear, cubs, stats, setProgress(u),
//   update(dt, time, camera), dispose(), ground, groundY }.
//   opts: palette (6 hex), style (shared style), detail (accepted; the bear is never thinned), cubs (add the two cubs),
//         birth [u0,u1] (second coat of broad strokes, tail -> nose, default 0.08..0.26), flickBirth [0.187, 0.287]
//         (spine flicks land 20 m ahead of the camera on the flank run), second (share that is second coat, 0.4),
//         fans (grass fans at the paws, default true), lod (Vector4 for uLod).
//   setProgress(u): the world calls it every frame with the path u (also at u = 0 through the portal). It sets uU, the
//         walk on the spot (two strides over the flight, four rigid limbs), the head's nod and the lean of the fans.
//         Without it update() runs u = time / 40 so the viewer shows the paint landing.
//   anchors (local): worldOffset; flyThrough (the brief's glide from the entry, along the +X flank, out to port, at the
//         face, under the chin, through her picture plane ahead of the forelegs, out between the cubs; 6 m clear);
//         viewpoints { entry, flank, reveal, dive, lookBack }; face (point of interest), eyes[2], gaze (unit),
//         chin, shoulderTop, spine[11], paws[4] (seat grass or ground marks), cubSeats[2] { position, k },
//         portalSeat { position, facing } = the brief's signboard in hero space (it is not on the bear).
//   Cost: bear 30k triangles, 4 draw calls (body, quads, strips, eyes), no lights, no textures but the 128 x 512 atlas;
//         with cubs 57k triangles, 12 calls. Build about 180 ms, longest step about 30 ms.
//   Expects: black #121212 ground at y = 0 under her (bodies are that colour and must vanish into it), flat post.
import * as THREE from 'three';

export const PALETTE = ['#121212', '#EDE6D2', '#C89A3A', '#3A6690', '#A63A2A', '#3F5F34'];
// pigment indices into the palette (a stroke carries one, never a mix)
export const PIG = { CLOTH: 0, CREAM: 1, OCHRE: 2, BLUE: 3, BRICK: 4, GREEN: 5 };
export const WORLD_OFFSET = [30, 0, 110];   // hero local -> world of the brief (pure translation)

// ---------------------------------------------------------------------------------------------------------
// GLSL. One stroke routine for the whole world.
// A stroke is an instance: aP loaded end, aD direction*length, aN surface normal, aA (width, pigment, variant, bone),
// aB (birth u, level, bend sagitta in m, seed). Geometry: x 0..1 along the stroke, y -0.5..0.5 across.
export const STROKE_VERT = /* glsl */`
uniform float uU, uWet, uLift, uT, uRet, uRip; uniform vec4 uLod, uLad; uniform vec2 uLadF; uniform mat4 uBones[8]; uniform vec3 uPal[6];
attribute vec3 aP, aD, aN; attribute vec4 aA, aB;
varying vec2 vUv; varying vec3 vCol; varying vec4 vS; varying vec4 vR; varying vec3 vK;   // vK: loose dab 0/1, width over length, sideways curve; vS: variant, threshold, grow, seed; vR: old variant, new variant, retouch front, wet threshold
void main(){
  int bi = int(aA.w + .5); mat4 B = uBones[bi];
  vec3 P = aP, D = aD, N = aN;
  float len = max(length(D), 1e-4);
  vec3 W = cross(N, D); W = W / max(length(W), 1e-5);
  // landing: second-coat strokes run out from the loaded end over 0.012 of u
  float age = uU - aB.x;
  float grow = aB.x < 0. ? 1. : clamp(age / .012, 0., 1.);
  // distance = fewer, bigger strokes: level 2 near coat, level 1 mid coat, level 0 far coat
  vec3 mid0 = P + D * .5;
  float kind = aB.y, lv = min(aB.y, 2.), g = 1.;   // kind 3 = running water (near coat, retouched fast), 4 = falling dab
  // kinds 6..9: the ladder of distance. The same form is laid four times, in strokes about 0.5, 1.2, 2.7 and 4 m wide,
  // and the eye's distance in metres to a stroke says which of them is there (uLad, uLadF): so a form 150 m off is some
  // thirty strokes with the cloth between them and never a closed flat
  float rk = step(5.5, kind);
  if (rk > .5) lv = kind < 6.5 ? 2. : kind < 7.5 ? 1.4 : kind < 8.5 ? .8 : .3;
  if (kind > 3.5 && kind < 4.5) P.y = mod(P.y - uT * (1.1 + aB.w), 34.);
  vec3 mid = (modelMatrix * B * vec4(P + D * .5, 1.)).xyz;
  float dist = distance(mid, cameraPosition);
  if (rk > .5) {
    // a coat gives way to the next stroke by stroke, by rank: each stroke has its own place in the band, from its own
    // stored seed. A stroke of the broader coat comes at its own distance (their starts are spread over the first 45
    // hundredths of the band) and one of the finer coat goes at its own (spread from 35 to 80 hundredths), each running
    // out from, or drawing back to, its loaded end over a fifth of the band's metres. So inside a band some strokes are
    // whole, some part-grown and some gone, one by one; no coat moves as a whole, nothing fades, nothing is on the clock
    float rnk = fract(aB.w * 113.7);
    vec3 la = vec3(uLad.x, uLad.z, uLadF.x), lb = vec3(uLad.y, uLad.w, uLadF.y);
    vec3 cin = clamp((dist - la - lb * (.45 * rnk)) / (lb * .2), 0., 1.), cout = clamp((dist - la - lb * (.35 + .45 * rnk)) / (lb * .2), 0., 1.);
    if (kind < 6.5) g = 1. - cout.x;
    else if (kind < 7.5) g = cin.x * (1. - cout.y);
    else if (kind < 8.5) g = cin.y * (1. - cout.z);
    else g = cin.z;
  }
  else if (lv > 1.5) g = 1. - smoothstep(uLod.x, uLod.x + uLod.y, dist);
  else if (lv > .5) g = smoothstep(uLod.x - uLod.y, uLod.x, dist) * (1. - smoothstep(uLod.z, uLod.z + uLod.w, dist));
  else g = smoothstep(uLod.z - uLod.w, uLod.z, dist);
  grow *= g;
  float s = position.x;
  float dab = step(7.5, aA.z), var = aA.z - 8. * dab;       // variant 8..15: a loose dab (leaf, grape, grass flick, fur flick)
  float wd = aA.x * mix(1.1, 1.22, dab);                    // the mark is drawn inside its plate (round loaded end, curve, ragged end)
  vK = vec3(dab, clamp(wd / len, 0., 4.), (fract(aB.w * 7.31 + aA.z * .37) - .5) * mix(.07, .2, dab));
  float sh = step(.0005, grow);                       // not yet landed: collapsed to a point (never visible=false)
  // a ladder stroke stands proud by a sixteenth of its width (a broad flat plate on a round form would sink into it), so
  // the broader coat lies over the finer one and draws back off it as the eye comes near
  vec3 p = P + D * s * sh + W * (position.y * wd * sh) + N * (uLift * (1. + lv) + aB.w * .035 + rk * aA.x * .06 + aB.z * mix(4., 4.5, rk) * s * (1. - s) * sh);
  if (dab > .5) p += W * (s * s * wd * .32 * sh * sin(uT * 1.6 + aB.w * 31. + P.x * .3 + P.z * .23));   // a loose mark's dry end stirs: leaves, flicks of fur and hay, grass
  if (kind > 4.5 && kind < 5.5) { float rp = uRip * s * s * (.5 + .5 * sin(P.z * .21 + P.x * .37 + uT * 1.3)); p.y += rp; p += W * (rp * .3); }   // kind 5: a hem that lifts and sways in slow waves
  vUv = vec2(s, position.y + .5);
  vCol = uPal[int(aA.y + .5)];
  // wet at full cover for 0.02 of u, then the bristle gaps open: threshold .05 -> .30 (cover 95 % -> 70 %)
  float dry = aB.x < 0. ? 1. : smoothstep(.032, .09, age);
  // far off the coat closes: the dry streaks are for the near pass (about 15 % of bare cloth), a far form is nearly whole
  float thr = mix(.08 + .04 * uWet, (.15 + (aB.w - .5) * .2 - .05 * (2. - mix(lv, 2., rk))) * mix(1., .3, smoothstep(16., 64., dist) * (1. - rk)), dry * (1. - uWet));   // far coats are laid fuller (a ladder stroke keeps its dryness: it is as broad to the eye far off as a near one is near)
  // the painter is still at work: every few seconds the brush passes over a stroke again from its loaded end, the
  // bristle streaks fall differently, it sits wet a moment and dries (uT = world time, uRet = seconds between passes)
  float per = kind > 2.5 && kind < 3.5 ? 1.7 : uRet;
  float ph = uT / max(per, .1) + aB.w * 13.7 + dot(mid0, vec3(.031, .017, .023));
  float e = floor(ph), f = fract(ph) * per;
  vR = vec4(mod(var + (e - 1.) * 3., 8.), mod(var + e * 3., 8.), f / .7, mix(.10 - .08 * uWet, thr, smoothstep(.2 * per, .8 * per, f)));
  vS = vec4(var, thr, grow, aB.w);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * B * vec4(p, 1.);
}`;
// atlas: R = paint height (equalised, so cover = 1 - threshold), G = per-bristle lag of the landing front
export const STROKE_FRAG = /* glsl */`
uniform sampler2D uAtlas; uniform float uStreak;
varying vec2 vUv; varying vec3 vCol; varying vec4 vS; varying vec4 vR; varying vec3 vK;
float h11(float n){ return fract(sin(n * 127.1 + 1.7) * 43758.5453); }
void main(){
  float vy = clamp(vUv.y, .008, .992);
  vec4 t0 = texture2D(uAtlas, vec2(vUv.x, (floor(vR.x + .5) + vy) / 8.));
  vec4 t = texture2D(uAtlas, vec2(vUv.x, (floor(vR.y + .5) + vy) / 8.));
  float sel = step(vUv.x, vR.z * 1.15 - .15 * t.g);     // behind the brush: the new pass
  float h = mix(t0.r, t.r, sel);
  float w = max(max(fwidth(t0.r), fwidth(t.r)) * .75, .05);
  float fwy = max(fwidth(vUv.y), 1e-4), fwx = max(fwidth(vUv.x), 1e-4);
  // the bristle texture is for the near pass only (a stroke some 40 px wide or more); smaller, its coarse copies would
  // open square holes, so there the black is drawn by rule below: long tracks that run with the stroke, or nothing
  float nearK = 1. - smoothstep(.007, .018, fwy);
  float thrN = mix(vS.y, vR.w, sel);
  float a = clamp((h - thrN * nearK) / w + .5, 0., 1.);
  // the landing front: each bristle arrives a little after its neighbour
  float front = vS.z * 1.15 - .15 * t.g;
  a *= clamp((front - vUv.x) / fwx + .5, 0., 1.);
  // the mark: one pass of a loaded brush. A round loaded end, a body that leans in a slight curve and narrows as the
  // paint runs out, and a starving end where the bristle clumps stop one after another, each drawn out to a point.
  // each time the brush passes again (behind its front) the stroke falls a little differently: another length of dry
  // end, other clumps, other tracks. That is the picture's own life, at every size.
  float vsel = floor(mix(vR.x, vR.y, sel) + .5);
  float dab = vK.x, s = vUv.x, sd = fract(vS.w + vsel * .381), sq = floor(vS.w * 64.) + vsel * 17.;
  float y = vUv.y - .5 + vK.z * (4. * s * (1. - s) - .5) + .01 * sin(s * 9. + vS.w * 40.);
  float r0 = clamp(vK.y * .5, .02, .5), xr = clamp((r0 - s) / r0, 0., 1.);
  float rag = min(mix(.14, .3, dab) + .12 * sd + .1 * vK.y, .5);
  // a small mark cannot show its bristle ends: there the starving end is simply drawn out to a blunt point
  float smallK = smoothstep(.2, .5, fwy * 9.);
  // a dry stroke narrows toward its starving end, so between two lanes of a coat the cloth shows as a long thin wedge
  // (uStreak) a broad stroke of the middle sizes, 6 to 40 px wide, is no blunt lozenge: it narrows as it runs dry and
  // its end parts into three clumps of bristles that stop one after another, each drawn out to a point
  float pk = step(.01, uStreak) * (1. - dab) * smallK * (1. - smoothstep(.3, .6, fwy * 3.));
  float hw = mix(.455, .4, dab) * sqrt(max(1. - xr * xr, 0.)) * (1. - mix(mix((.06 + .22 * sd) * (1. - .6 * smallK), .08 + .2 * sd, pk), .42, dab) * s * s);
  hw *= mix(1., sqrt(clamp((1. - s) / (rag * mix(.45, 1., dab)), 0., 1.)), smallK * (1. - pk));
  a *= clamp((hw - abs(y)) / fwy + .5, 0., 1.);
  float q4 = (y + .5) * 3. + sd * 1.9, f4 = abs(fract(q4) - .5), h6 = h11(floor(q4) * 1.9 + sq * 4.3), e4 = 1. - (.02 + .34 * h6 * h6);
  a *= mix(1., clamp((.75 * clamp((e4 - s) / .16, 0., 1.) - f4) / (fwy * 3.) + .5, 0., 1.), pk);
  float q = (y + .5) * 9. + sd * 7.3, f = abs(fract(q) - .5);
  float e = 1. - rag * h11(floor(q) + sq * 3.1);
  float tooth = clamp((.56 * clamp((e - s) / (rag * .6), 0., 1.) - f) / (fwy * 9.) + .5, 0., 1.);
  a *= mix(tooth, 1., smallK);
  // where the brush starves, bare cloth shows as thin tracks (a twenty-sixth of the stroke wide) that open toward the
  // dry end and run with the stroke; a track finer than two pixels is not drawn
  float q2 = (y + .5) * 26. + sd * 13.1, j2 = floor(q2), f2 = abs(fract(q2) - .5);
  float h2 = h11(j2 * 1.3 + sq * 7.7), h3 = h11(j2 * 2.9 + sq * 5.3);
  float gw = step(.5, h2) * smoothstep(.07, .16, thrN) * .55 * h2 * smoothstep(.15 + .6 * h3, 1., s);
  a *= 1. - clamp((gw - f2) / (fwy * 26.) + .5, 0., 1.) * step(.01, gw) * (1. - smoothstep(.22, .5, fwy * 26.));
  // the dry drag at the middle sizes (uStreak, the big forms): of seven broad bristle tracks across the brush some starve
  // early and leave the cloth bare from there to the end of the stroke; a track under about a pixel and a half is not drawn
  float q3 = (y + .5) * 7. + sd * 3.7, j3 = floor(q3), f3 = abs(fract(q3) - .5);
  float h4 = h11(j3 * 1.7 + sq * 2.3), h5 = h11(j3 * 3.1 + sq * 9.1);
  float g3 = uStreak * (1. - dab) * step(.5, h4) * (.18 + .3 * h5) * smoothstep(.06 + .5 * h5, .4 + .55 * h5, s);
  a *= 1. - clamp((g3 - f3) / (fwy * 7.) + .5, 0., 1.) * step(.01, g3) * (1. - smoothstep(.3, .6, fwy * 7.));
  if (a < .3) discard;
  gl_FragColor = vec4(vCol, a);
}`;
// bodies: exactly the cloth colour, no sheen, so an unpainted part of an animal is the night
export const BODY_VERT = /* glsl */`
uniform mat4 uBones[8]; attribute float aBone;
void main(){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * uBones[int(aBone + .5)] * vec4(position, 1.); }`;
export const BODY_FRAG = /* glsl */`uniform vec3 uPal[6]; void main(){ gl_FragColor = vec4(uPal[0], 1.); }`;
// eye rounds: a plate that turns to the camera (clamped to 35 degrees off its rest normal).
// aP centre, aN rest normal, aA (radius, bone, seed, far gain: 1 = the round grows up to 2.3 x with distance so it reads at range). Drawn: bare black round, ochre rim (ragged, dry), one cream dab.
export const EYE_VERT = /* glsl */`
uniform mat4 uBones[8]; attribute vec3 aP, aN; attribute vec4 aA; varying vec2 vQ; varying vec3 vE;
void main(){
  mat4 M = modelMatrix * uBones[int(aA.y + .5)];
  vec3 c = (M * vec4(aP, 1.)).xyz;
  vec3 n0 = mat3(M) * aN; n0 = n0 / max(length(n0), 1e-5);
  vec3 tc = cameraPosition - c; float tl = length(tc); tc = tl > 1e-3 ? tc / tl : n0;
  float cs = clamp(dot(n0, tc), -1., 1.);
  float ang = acos(cs), lim = .611;                     // 35 degrees
  float k = ang > lim ? lim / max(ang, 1e-4) : 1.;
  vec3 ax = cross(n0, tc); float al = length(ax);
  vec3 n = n0;
  if (al > 1e-4) { ax /= al; float a = ang * k; n = n0 * cos(a) + cross(ax, n0) * sin(a); }
  vec3 up = vec3(0., 1., 0.); vec3 r = cross(up, n); r = r / max(length(r), 1e-4); vec3 u2 = cross(n, r);
  vQ = position.xy * 2.;                                // -1..1
  // the dab leans the way the eye is looking
  vE = vec3(dot(tc, r), dot(tc, u2), aA.z);
  vec3 p = c + (r * position.x + u2 * position.y) * aA.x * 2.6 * clamp(tl / 75., 1., 1. + 1.3 * aA.w) + n * .05;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
export const EYE_FRAG = /* glsl */`
uniform vec3 uPal[6]; uniform sampler2D uAtlas; varying vec2 vQ; varying vec3 vE;
void main(){
  vec2 q = vQ * 1.3; float r = length(q); float th = atan(q.y, abs(q.x) < 1e-4 ? 1e-4 : q.x);
  // rim: one dry ochre turn of the brush round the black, streaked along its length
  vec4 t = texture2D(uAtlas, vec2(fract(th / 6.2832 + vE.z), (floor(vE.z * 7.99) + clamp((r - .84) / .36, .03, .97)) / 8.));
  float rim = step(.84, r) * step(r, 1.2) * step(.2, t.r);
  vec2 dq = q - vec2(-.2, .26) - clamp(vE.xy, -1., 1.) * .16;
  float dab = 1. - smoothstep(.17, .2, length(dq * vec2(1., 1.25)));
  float disc = 1. - smoothstep(.9, .92, r);
  vec3 col = uPal[0];
  col = mix(col, uPal[2], rim); col = mix(col, uPal[1], dab);
  float a = max(max(disc, rim), dab);
  if (a < .3) discard;
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------------------
// The bristle atlas: 8 variants stacked in v, each 128 x 64. Loaded rounded start, ragged starving end.
function atlasMaker(rng, noise) {
  const W = 128, H = 64, V = 8, data = new Uint8Array(W * H * V * 4);
  const raw = new Float32Array(W * H), key = new Float64Array(W * H); let ph = 0;
  const br = new Float32Array(H), on = new Float32Array(H), lag = new Float32Array(H), s0 = new Float32Array(H), e1 = new Float32Array(H);
  // one variant in three short steps (part 0 draws all the random numbers, parts 1 and 2 draw none)
  const variant = (v, part = -1) => {
    const nb = 3 + v * 0.75;
    if (part <= 0) {
    ph = rng() * 100;   // nb: how many clumps of bristles across the brush
    for (let j = 0; j < H; j++) {
      const y = j / (H - 1);
      // br: how dry this bristle track runs (0 loaded .. 1 starved), a few clumps across the brush; on[j]: where it starts to starve
      // thin dry tracks, a hair to a few hairs wide, never a broad band
      { const a1 = Math.max(0, noise.n2(y * nb * 4.2 + ph, v * 7.3)), a2 = Math.max(0, noise.n2(y * nb * 1.4 + ph, v * 3.1 + 50)); br[j] = Math.min(1, 2.8 * a1 * a1 + 0.45 * a2 * a2); }
      lag[j] = rng();
      const c = (2 * y - 1) * (2 * y - 1);
      s0[j] = 0.004 + 0.035 * c * c + 0.03 * rng() * rng() + 0.05 * br[j] + 0.035 * rng();   // the bristles do not land in one line
      on[j] = 0.34 + 0.4 * Math.min(1, Math.max(0, 0.5 + noise.n2(y * nb * 2.3 + ph + 31, v * 4.7)));
      e1[j] = 1 - (0.01 + 0.1 * rng() * rng() + 0.16 * br[j] + 0.04 * c);
    }
    const starve = 0.1 + 0.3 * (v / (V - 1));
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = i / (W - 1), y = j / (H - 1);
      const rp = Math.min(1, Math.max(0, (x - on[j]) / (1.04 - on[j]))), ramp = rp * rp * (3 - 2 * rp);
      const fine = Math.max(0, noise.n2(y * 21 + ph * 3, v * 9.1 + 77 + x * 0.35)), r2 = Math.min(1, Math.max(0, (x - 0.12) / 0.9));
      const hair = 0.5 + 0.5 * noise.n2(x * 2.2 + v * 11, y * 30 + ph);
      raw[j * W + i] = -(br[j] * ramp * (0.8 + 0.4 * hair) + (0.2 + 0.6 * starve) * fine * fine * r2 * r2 * r2 * (0.85 + 0.3 * hair) + 0.3 * x * x * x * x * (0.35 + br[j]) + 0.02 * hair * x) + 0.004 * noise.n2(x * 23 + v, y * 31);
    }
    }
    if (part < 0 || part === 1) {
    for (let k = 0; k < W * H; k++) key[k] = Math.round((raw[k] + 4) * 1e6) * 8192 + k;   // native numeric sort, index in the low bits
    key.sort();
    for (let k = 0; k < W * H; k++) raw[key[k] % 8192] = (k + 0.5) / (W * H);   // rank: cover = 1 - threshold exactly
    }
    if (part < 0 || part === 2) {
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = i / (W - 1), y = j / (H - 1);
      const ex = 0.012 + 0.01 * noise.n2(x * 7 + v * 3, 0.5);
      const em = Math.min(1, Math.max(0, y / ex)) * Math.min(1, Math.max(0, (1 - y) / (0.012 + 0.01 * noise.n2(x * 7 + v * 3, 9.5))));
      const m = Math.min(1, Math.max(0, (x - s0[j]) / 0.04)) * Math.min(1, Math.max(0, (e1[j] - x) / 0.11)) * Math.min(1, em * 2.5);
      const o = ((v * H + j) * W + i) * 4;
      data[o] = Math.round(255 * raw[j * W + i] * m); data[o + 1] = Math.round(255 * lag[j]); data[o + 2] = 0; data[o + 3] = 255;
    }
    }
  };
  const finish = () => {
  const tex = new THREE.DataTexture(data, W, H * V, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true;
  tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
  };
  return { V, variant, finish };
}

// makeStyle(ctx, palette): the shared uniforms and the three material factories. Make ONE per world and pass it to
// buildHero as opts.style (or take hero.style) so every stroke in the world lands, dries and thins by the same clock.
export async function makeStyleAsync(ctx, palette = PALETTE) {
  const mk = atlasMaker(ctx.rng.fork ? ctx.rng.fork('oilcloth-style') : ctx.rng, ctx.noise);
  await ctx.yield();
  for (let v = 0; v < mk.V; v++) for (let part = 0; part < 3; part++) { mk.variant(v, part); await ctx.yield(); }
  return makeStyle(ctx, palette, mk.finish());
}
export function makeStyle(ctx, palette = PALETTE, madeAtlas = null) {
  const pal = PALETTE.map((h, i) => new THREE.Color(palette[i] || h));
  const bones = []; for (let i = 0; i < 8; i++) bones.push(new THREE.Matrix4());
  let atlas = madeAtlas;
  if (!atlas) { const mk = atlasMaker(ctx.rng.fork ? ctx.rng.fork('oilcloth-style') : ctx.rng, ctx.noise); for (let v = 0; v < mk.V; v++) mk.variant(v); atlas = mk.finish(); }
  const uniforms = {
    uU: { value: 0 },                 // path progress 0..1: the only clock strokes read
    uWet: { value: 0 },               // 1 = rare event "the wet coat": nothing dries
    uPal: { value: pal },
    uAtlas: { value: atlas },
    uLod: { value: new THREE.Vector4(95, 30, 1e6, 100) },   // near coat ends at x (+y band); mid coat ends at z (+w band)
    uT: { value: 0 },                 // world time, seconds (ambient: the retouching brush, hem, falling dabs)
    uRet: { value: 7 },               // seconds between two passes of the brush over the same stroke
    uRip: { value: 0 },               // metres a bone-7 stroke's dry end lifts (the laid cloth's hem)
    uLift: { value: 0.04 },           // metres proud of the body per level
    uLad: { value: new THREE.Vector4(30, 12, 62, 28) },   // the ladder (kinds 6..9): 0.5 m strokes to x (+y band), 1.2 m strokes to z (+w band); within 30 m of the eye only the near brush shows
    uLadF: { value: new THREE.Vector2(128, 30) },         // 2.7 m strokes to x (+y band), 4 m strokes beyond
    // (those are the rungs of the laid cloth; a form a quarter that size takes each coat about twice
    // as far, o.lad of its material, so that at 150 m it too is twenty to forty strokes)
    uStreak: { value: 0 },            // 1 = broad dry tracks in every broad stroke (the laid cloth and the feast on it)
    uBones: { value: bones },         // identity unless a body is hinged; a stroke/body vertex names its bone
  };
  const sub = (own) => { const u = {}; for (const k in uniforms) u[k] = uniforms[k]; return Object.assign(u, own || {}); };
  return {
    uniforms, palette: pal, atlas, bones,
    // strokeMaterial({ bones, lod, lift, streak, lad: [six metres, as uLad then uLadF] }): alpha-tested, alpha-to-coverage, unlit, double-sided. No blending, no sorting.
    strokeMaterial(o = {}) {
      return new THREE.ShaderMaterial({
        uniforms: sub({ ...(o.bones ? { uBones: { value: o.bones } } : {}), ...(o.lod ? { uLod: { value: o.lod } } : {}), ...(o.lift ? { uLift: { value: o.lift } } : {}), ...(o.streak ? { uStreak: { value: o.streak } } : {}),
          ...(o.lad ? { uLad: { value: new THREE.Vector4(o.lad[0], o.lad[1], o.lad[2], o.lad[3]) }, uLadF: { value: new THREE.Vector2(o.lad[4], o.lad[5]) } } : {}) }),
        vertexShader: STROKE_VERT, fragmentShader: STROKE_FRAG, side: THREE.DoubleSide, alphaToCoverage: true, fog: false, toneMapped: false,
      });
    },
    bodyMaterial(o = {}) {
      return new THREE.ShaderMaterial({ uniforms: sub(o.bones ? { uBones: { value: o.bones } } : {}), vertexShader: BODY_VERT, fragmentShader: BODY_FRAG, side: o.side ?? THREE.DoubleSide, fog: false, toneMapped: false });
    },
    eyeMaterial(o = {}) {
      return new THREE.ShaderMaterial({ uniforms: sub(o.bones ? { uBones: { value: o.bones } } : {}), vertexShader: EYE_VERT, fragmentShader: EYE_FRAG, fog: false, toneMapped: false });
    },
    dispose() { atlas.dispose(); },
  };
}

// StrokeBuffer: collects strokes, then makes at most two instanced meshes (flat quads, and 3-segment strips that bend).
// add(p, d, n, width, pigment, o): p loaded end [x,y,z]; d direction*length; n unit normal; o = { bone, birth (<0 = first
// coat), level (2 near, 1 mid, 0 far), bend (m, >0 bulges along n), variant 0..7, seed }.
export class StrokeBuffer {
  constructor(rng) { this.rng = rng; this.q = []; this.s = []; }
  add(p, d, n, width, pig, o = {}) {
    const bend = o.bend || 0, len = Math.hypot(d[0], d[1], d[2]);
    const arr = Math.abs(bend) > 0.012 * len ? this.s : this.q;
    const rg = o.rng || this.rng;   // o.rng: a stroke of the ladder's broader coats draws its variant and seed from the marks' stream
    arr.push(p[0], p[1], p[2], d[0], d[1], d[2], n[0], n[1], n[2], width, pig, (o.variant ?? Math.floor(rg() * 8)) + (o.dab ? 8 : 0), o.bone || 0,
      o.birth ?? -1, o.level ?? 2, bend, o.seed ?? rg());
  }
  get count() { return (this.q.length + this.s.length) / 17; }
  _mesh(arr, segs, material) {
    const n = arr.length / 17; if (!n) return null;
    const base = new THREE.PlaneGeometry(1, 1, segs, 1); base.translate(0.5, 0, 0);
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
    const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(arr), 17);
    g.setAttribute('aP', new THREE.InterleavedBufferAttribute(ib, 3, 0)); g.setAttribute('aD', new THREE.InterleavedBufferAttribute(ib, 3, 3));
    g.setAttribute('aN', new THREE.InterleavedBufferAttribute(ib, 3, 6)); g.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 4, 9));
    g.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 4, 13));
    g.instanceCount = n;
    const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.userData.tris = n * segs * 2;
    return m;
  }
  build(material) { const out = [this._mesh(this.q, 1, material), this._mesh(this.s, 3, material)].filter(Boolean); this.q = []; this.s = []; return out; }
}

// ---------------------------------------------------------------------------------------------------------
// Loft: every body in this world is a few lofted tubes of superellipse section (a slab with rounded edges is one with
// a small half-width and exponent 4). makeLoft(stations, R, B): stations = [[cx,cy,cz, a, b, n], ...] where a is the
// half-extent along unit R, b along unit B and n the exponent (2 = ellipse, 4+ = rounded slab). at(s, q) gives the
// point and outward normal; s 0..1 along, q 0..1 round.
const cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
export function makeLoft(st, R = [1, 0, 0], B = [0, 1, 0]) {
  const n = st.length, tmp = new Float64Array(6);
  const sta = (s) => {
    const f = Math.min(Math.max(s, 0), 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)), t = f - i;
    const a = st[Math.max(0, i - 1)], b = st[i], c = st[i + 1], d = st[Math.min(n - 1, i + 2)];
    for (let k = 0; k < 6; k++) tmp[k] = cr(a[k], b[k], c[k], d[k], t);
    tmp[3] = Math.max(tmp[3], 0.01); tmp[4] = Math.max(tmp[4], 0.01); tmp[5] = Math.max(tmp[5], 1.5);
    return tmp;
  };
  const pt = (s, q, o) => {
    const v = sta(s), th = q * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
    const r = Math.pow(Math.pow(Math.abs(cs) / v[3], v[5]) + Math.pow(Math.abs(sn) / v[4], v[5]), -1 / v[5]), x = r * cs, y = r * sn;
    o[0] = v[0] + R[0] * x + B[0] * y; o[1] = v[1] + R[1] * x + B[1] * y; o[2] = v[2] + R[2] * x + B[2] * y; return o;
  };
  const a0 = [0, 0, 0], a1 = [0, 0, 0], a2 = [0, 0, 0], a3 = [0, 0, 0];
  // arc-length table round the middle section, so lanes are evenly spaced on the surface
  const QT = 96, qt = new Float64Array(QT + 1); let acc = 0; pt(0.5, 0, a0);
  for (let i = 1; i <= QT; i++) { pt(0.5, i / QT, a1); acc += Math.hypot(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]); qt[i] = acc; a0[0] = a1[0]; a0[1] = a1[1]; a0[2] = a1[2]; }
  const perim = acc;
  const qAt = (f) => { const t = (f - Math.floor(f)) * perim; let i = 1; while (i < QT && qt[i] < t) i++; const d = qt[i] - qt[i - 1]; return (i - 1 + (d > 1e-9 ? (t - qt[i - 1]) / d : 0)) / QT; };
  const at = (s, q, P, N) => {
    pt(s, q, P);
    if (N) {
      const ds = 0.004, dq = 0.004, s0 = Math.max(0, s - ds), s1 = Math.min(1, s + ds);
      pt(s0, q, a0); pt(s1, q, a1); pt(s, q - dq, a2); pt(s, q + dq, a3);
      const ux = a1[0] - a0[0], uy = a1[1] - a0[1], uz = a1[2] - a0[2], vx = a3[0] - a2[0], vy = a3[1] - a2[1], vz = a3[2] - a2[2];
      let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux; const v = sta(s);
      if (nx * (P[0] - v[0]) + ny * (P[1] - v[1]) + nz * (P[2] - v[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz) || 1; N[0] = nx / l; N[1] = ny / l; N[2] = nz / l;
    }
    return P;
  };
  return { at, qAt, perim, stations: st, R, B };
}
// loftGeometry(loft, ns, nq, bone): the black body mesh (position + aBone), ends closed by the first/last station.
export function loftGeometry(L, ns, nq, bone = 0) {
  const pos = new Float32Array((ns + 1) * nq * 3), bn = new Float32Array((ns + 1) * nq).fill(bone), idx = [], P = [0, 0, 0];
  for (let i = 0; i <= ns; i++) for (let j = 0; j < nq; j++) { L.at(i / ns, j / nq, P); pos.set(P, (i * nq + j) * 3); }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nq; j++) { const a = i * nq + j, b = i * nq + (j + 1) % nq, c = a + nq, d = b + nq; idx.push(a, c, b, b, c, d); }
  for (let j = 1; j < nq - 1; j++) { idx.push(0, j, j + 1); const e = ns * nq; idx.push(e, e + j + 1, e + j); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aBone', new THREE.BufferAttribute(bn, 1)); g.setIndex(idx);
  return g;
}
// paintLoft(sb, loft, rng, o): lays strokes in lanes along the loft, never crossing. o: { width, len:[a,b], gap, pig(P,N,s,f)
// -> pigment index or -1 to leave the cloth bare, bone, level, birth(P,s) -> u or -1, own (true: the strokes take their
// variant from rng too, not from the buffer's stream), s0, s1 (span), f0, f1 (lanes round,
// fractions of the perimeter), reverse (loaded end at s1), wobble }. Returns the number laid.
function lanePainter(sb, L, rng, o = {}) {
  // A coat, not a wall: lanes overlap their neighbours by about a tenth (o.side), strokes are of clearly unequal length
  // (most short, a few three or four times longer), each is laid over the starving end of the one before (o.adv = the
  // share of its length a stroke advances) and the starts are staggered lane by lane, so no course lines appear. The
  // black shows along the bristles (the atlas) and where forms part, not round every stroke. o.skip: share left out
  // (a sparse dry second coat); o.seed [lo, hi]: dryness range (0 fullest, 1 driest); o.dry: share of strokes that run
  // out before the next one starts (a ragged end left showing).
  const width = o.width ?? 0.45, lr = o.len || [1.2, 2], f0 = o.f0 ?? 0, f1 = o.f1 ?? 1, s0 = o.s0 ?? 0.02, s1 = o.s1 ?? 0.98;
  const side = o.side ?? 1.16, adv = o.adv || [0.68, 0.88], skip = o.skip || 0, sd = o.seed || [0.1, 0.9], dryEnd = o.dry ?? 0.05;
  const lanes = Math.max(1, Math.round(L.perim * (f1 - f0) / width + (o.lane0 || 0))), NS = 40;
  const P0 = [0, 0, 0], P1 = [0, 0, 0], Pm = [0, 0, 0], Pn = [0, 0, 0], N = [0, 0, 0], cum = new Float64Array(NS + 1);
  let laid = 0;
  const fbd = [0]; for (let j = 0; j < lanes; j++) fbd.push(fbd[j] + 0.7 + 0.6 * rng());
  const fo = (o.lane0 || 0) / lanes, flow = o.flow || (() => 0);
  const lane = (j) => {
    const df = (f1 - f0) * (fbd[j + 1] - fbd[j]) / fbd[lanes], f = f0 + fo + (f1 - f0) * fbd[j] / fbd[lanes] + df * 0.5, qs = (s) => L.qAt(f + flow(s));
    L.at(s0, qs(s0), P0); cum[0] = 0;
    for (let i = 1; i <= NS; i++) { const si = s0 + (s1 - s0) * i / NS; L.at(si, qs(si), P1); cum[i] = cum[i - 1] + Math.hypot(P1[0] - P0[0], P1[1] - P0[1], P1[2] - P0[2]); P0[0] = P1[0]; P0[1] = P1[1]; P0[2] = P1[2]; }
    const tot = cum[NS], inv = (t) => { let i = 1; while (i < NS && cum[i] < t) i++; const d = cum[i] - cum[i - 1]; return s0 + (s1 - s0) * (i - 1 + (d > 1e-9 ? (t - cum[i - 1]) / d : 0)) / NS; };
    let t = -rng() * lr[1] * 0.9;
    while (t < tot - 0.2) {
      const rl = rng(); let full = lr[0] + (lr[1] * 1.7 - lr[0]) * rl * rl * rl + (lr[1] - lr[0]) * 0.45 * rng();
      let ta = Math.max(0, t), tb, len, sa = inv(ta), sb2, sm;
      for (let it = 0; it < 4; it++) {
        tb = Math.min(tot, t + full); len = tb - ta; sb2 = inv(tb); sm = inv((ta + tb) * 0.5);
        if (it === 3 || len < lr[0] * 0.75) break;
        L.at(sa, qs(sa), P0); L.at(sb2, qs(sb2), P1); L.at(sm, qs(sm), Pm);
        if (Math.hypot(Pm[0] - (P0[0] + P1[0]) * 0.5, Pm[1] - (P0[1] + P1[1]) * 0.5, Pm[2] - (P0[2] + P1[2]) * 0.5) < 0.07 * len + 0.04) break;
        full = Math.max(lr[0] * 0.6, (tb - t) * 0.55);
      }
      t += full * (rng() < dryEnd ? 0.97 : adv[0] + (adv[1] - adv[0]) * rng());
      if (len < 0.2 * lr[0]) continue;
      const q = qs(sm); L.at(sm, q, Pm, N); L.at(sm, L.qAt(f + flow(sm) + df), Pn);
      const wl = Math.hypot(Pn[0] - Pm[0], Pn[1] - Pm[1], Pn[2] - Pm[2]);   // room in this lane here
      let every = 1; while (wl * every < width * 0.42 && every < 16) every *= 2;
      if (j % every) continue;
      if (skip && rng() < skip) continue;
      const w = Math.min(width * 1.8, wl * every * side) * (0.96 + 0.1 * rng());
      if (w < 0.08) continue;
      const pig = o.pig ? o.pig(Pm, N, sm, f) : PIG.CREAM; if (pig < 0) continue;
      L.at(o.reverse ? sb2 : sa, qs(o.reverse ? sb2 : sa), P0); L.at(o.reverse ? sa : sb2, qs(o.reverse ? sa : sb2), P1);
      const wob = (o.wobble ?? 0.03) * Math.min(len, 2.5);
      const d = [P1[0] - P0[0] + rng.range(-wob, wob), P1[1] - P0[1] + rng.range(-wob, wob), P1[2] - P0[2] + rng.range(-wob, wob)];
      const bend = (Pm[0] - (P0[0] + P1[0]) * 0.5) * N[0] + (Pm[1] - (P0[1] + P1[1]) * 0.5) * N[1] + (Pm[2] - (P0[2] + P1[2]) * 0.5) * N[2];
      sb.add(P0, d, N, w, pig, { bone: o.bone || 0, level: o.level ?? 2, birth: o.birth ? o.birth(Pm, sm) : -1, bend, seed: sd[0] + (sd[1] - sd[0]) * rng(), rng: o.own ? rng : null });
      laid++;
    }
  };
  return { lanes, lane, laid: () => laid };
}
export function paintLoft(sb, L, rng, o = {}) { const lp = lanePainter(sb, L, rng, o); for (let j = 0; j < lp.lanes; j++) lp.lane(j); return lp.laid(); }
// the same, in short steps: awaits yieldFn every few lanes (same strokes, same rng draws)
export async function paintLoftAsync(sb, L, rng, o = {}, yieldFn = null, every = 4) {
  const lp = lanePainter(sb, L, rng, o);
  for (let j = 0; j < lp.lanes; j++) { lp.lane(j); if (yieldFn && j % every === every - 1) await yieldFn(); }
  return lp.laid();
}

// flickRow(sb, loft, rng, o): fur flicks in a combed row along a loft at round-position q, each standing at 60 degrees
// to the row. o: { q, s0, s1, step, len, width, pig, mode: 'fin' (stands off the surface in the plane of the row) or
// 'lie' (lies on the surface, pointing toward side), side: +1/-1, bone, birth(P, s), level }
export function flickRow(sb, L, rng, o) {
  const P = [0, 0, 0], N = [0, 0, 0], A = [0, 0, 0], Bq = [0, 0, 0], s0 = o.s0 ?? 0.03, s1 = o.s1 ?? 0.97, step = o.step ?? 0.4;
  let total = 0; L.at(s0, o.q, A); const M = 60, cum = [0];
  for (let i = 1; i <= M; i++) { L.at(s0 + (s1 - s0) * i / M, o.q, Bq); total += Math.hypot(Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]); cum.push(total); A[0] = Bq[0]; A[1] = Bq[1]; A[2] = Bq[2]; }
  let k = 1, n = 0;
  for (let t = step * 0.5; t < total; t += step * (0.85 + 0.3 * rng())) {
    while (k < M && cum[k] < t) k++;
    const s = s0 + (s1 - s0) * (k - 1 + (t - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1])) / M;
    L.at(s, o.q, P, N); L.at(Math.max(0, s - 0.01), o.q, A); L.at(Math.min(1, s + 0.01), o.q, Bq);
    let tx = Bq[0] - A[0], ty = Bq[1] - A[1], tz = Bq[2] - A[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    // U: across the row, in the surface
    let ux = N[1] * tz - N[2] * ty, uy = N[2] * tx - N[0] * tz, uz = N[0] * ty - N[1] * tx; const sg = o.side ?? 1;
    const len = (o.len ?? 1.2) * (0.8 + 0.4 * rng()), c = o.lean ?? 0.5, sn = 0.866;   // o.lean: + leans back along the row, - forward
    let d, nn, p;
    if (o.mode === 'lie') { d = [(-tx * c + ux * sg * sn) * len, (-ty * c + uy * sg * sn) * len, (-tz * c + uz * sg * sn) * len]; nn = [N[0], N[1], N[2]]; p = [P[0], P[1], P[2]]; }
    else { d = [(-tx * c + N[0] * sn) * len, (-ty * c + N[1] * sn) * len, (-tz * c + N[2] * sn) * len]; nn = [ux, uy, uz]; const back = 0.3 * len; p = [P[0] - d[0] / len * back, P[1] - d[1] / len * back, P[2] - d[2] / len * back]; }
    sb.add(p, d, nn, (o.width ?? 0.3) * (0.8 + 0.4 * rng()), o.pig ?? PIG.CREAM, { bone: o.bone || 0, level: o.level ?? 2, birth: o.birth ? o.birth(P, s) : -1, dab: 1 });
    n++;
  }
  return n;
}

// lendRng(base): the stream base, draw for draw; but while f.lent(other, fn) runs, whoever reads it reads other. A form's
// birth rule reads its painter's stream; lent, the same rule (not a copy of it) deals the landing of the form's broader
// coats from the form's own landing stream, and the painter's stream is not read once more.
export const lendRng = (base) => {
  const f = () => f.src(); f.src = base;
  for (const k of ['range', 'int', 'pick', 'chance', 'sign', 'gauss', 'shuffle', 'fork']) f[k] = (...a) => f.src[k](...a);
  f.lent = (other, fn) => { f.src = other; try { return fn(other); } finally { f.src = base; } };
  return f;
};
// landBroad(sb, q0, s0, rule, isFine): the landing of the broader coats (kinds 7..9) of one form, the strokes added to sb
// since its two lists were q0 and s0 long. rule(M, dab), the form's own birth rule asked at a stroke's own middle point M,
// answers a u (second coat: the stroke lands then, running out from its loaded end, and is not there before) or -1
// (first coat, there from the start). The landing goes by PLACES, so that what is painted stays painted and what has
// landed stays landed through every change of coat:
//   which strokes: a stroke with no broader stroke over its middle takes the rule's answer (the rule's own share); a stroke
//     under broader plates goes with the strokes of the next broader coat that lie over its middle: it is second coat
//     if and only if every one of them is (then it takes the first u the rule answers when asked again and again). So a
//     place painted from the start on a broader coat is painted from the start on the finer broad coat under it: no
//     stroke is still to come where a broader one stood painted. (Where two plates of the broader coat overlap, both must
//     be second coat, so a finer broad coat has somewhat fewer second-coat strokes than the rule's share; never more.)
//     Every stroke's own values are drawn first, stroke by stroke in the order they were laid (the rule's first answer,
//     and the first u it answers), before any stroke is looked at against another: what a stroke is dealt does not
//     hang on what lies over it.
//   when: a second-coat stroke lands WITH the last of the second-coat strokes of the finer coats that lie under its own
//     plate (the latest of their births; only where none lies under it does it keep the u its rule gave). So no finer
//     stroke under a landed broad one is still to come, and none lands after it. No finer stroke's birth is touched.
// isFine(arr, i): the strokes of the finest coat (default: kind 6). Returns how many broad strokes land.
// landing(sb, q0, s0, isFine) is the same in short steps, for a big form: over(n) looks up n strokes at a call and says
// true when all are done; then which(rule) asks the rule (the only step that draws random numbers); then when(n).
export function landBroad(sb, q0, s0, rule, isFine) { const L = landing(sb, q0, s0, isFine); while (!L.over(1e9)); L.which(rule); while (!L.when(1e9)); return L.count(); }
export function landing(sb, q0, s0, isFine = (arr, i) => arr[i + 14] === 6) {
  const F = [], B = [[], [], []];   // F: the second-coat strokes of the finest coat; B: the broad strokes, by coat (7, 8, 9)
  const mid = (arr, i) => [arr[i] + arr[i + 3] * 0.5, arr[i + 1] + arr[i + 4] * 0.5, arr[i + 2] + arr[i + 5] * 0.5];
  for (const [arr, i0] of [[sb.q, q0], [sb.s, s0]]) {
    for (let i = 0; i < arr.length; i += 17) if (arr[i + 13] >= 0 && isFine(arr, i)) F.push({ m: mid(arr, i), bone: arr[i + 12], b: arr[i + 13], r2: 0 });
    for (let i = i0; i < arr.length; i += 17) {
      if (arr[i + 14] < 6.5) continue;
      const dx = arr[i + 3], dy = arr[i + 4], dz = arr[i + 5], nx = arr[i + 6], ny = arr[i + 7], nz = arr[i + 8], w = arr[i + 9], l2 = dx * dx + dy * dy + dz * dz, off = Math.max(0.5, 0.35 * w);
      let wx = ny * dz - nz * dy, wy = nz * dx - nx * dz, wz = nx * dy - ny * dx; const wl = Math.hypot(wx, wy, wz) || 1;
      B[Math.min(2, Math.round(arr[i + 14]) - 7)].push({ arr, i, bone: arr[i + 12], m: mid(arr, i), dab: arr[i + 11] > 7.5, l2, w, off, r2: w > 0 && l2 > 0 ? 0.25 * l2 + 0.25 * w * w + off * off : -1, wx: wx / wl, wy: wy / wl, wz: wz / wl, b: -1, a1: -1, au: -1, over: null });
    }
  }
  // under(T, f): the middle of f lies under the plate of T (within its length and width, and no farther off its face than a third of its width)
  const under = (T, f) => {
    const fm = f.m, tm = T.m, ex = fm[0] - tm[0], ey = fm[1] - tm[1], ez = fm[2] - tm[2];
    if (ex * ex + ey * ey + ez * ez > T.r2 || f.bone !== T.bone) return false;
    const a = T.arr, i = T.i, vx = fm[0] - a[i], vy = fm[1] - a[i + 1], vz = fm[2] - a[i + 2], t = (vx * a[i + 3] + vy * a[i + 4] + vz * a[i + 5]) / T.l2;
    return t >= 0 && t <= 1 && Math.abs(vx * T.wx + vy * T.wy + vz * T.wz) <= 0.5 * T.w && Math.abs(vx * a[i + 6] + vy * a[i + 7] + vz * a[i + 8]) <= T.off;
  };
  // (to keep the search short the strokes are looked up along the form's longest axis: by(list) sorts a copy by the
  // middle's place on it, near(L, x, r, fn) visits those within r of x)
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const L of B) for (const S of L) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], S.m[c]); hi[c] = Math.max(hi[c], S.m[c]); }
  const ax = hi[0] - lo[0] > hi[1] - lo[1] ? (hi[0] - lo[0] > hi[2] - lo[2] ? 0 : 2) : (hi[1] - lo[1] > hi[2] - lo[2] ? 1 : 2);
  const by = (list) => { const v = list.slice().sort((p, q) => p.m[ax] - q.m[ax]), key = new Float64Array(v.length); let r = 0; for (let i = 0; i < v.length; i++) { key[i] = v[i].m[ax]; if (v[i].r2 > r) r = v[i].r2; } return { v, key, r: Math.sqrt(r) }; };
  const near = (L, x, r, fn) => { const key = L.key; let a = 0, b = key.length; while (a < b) { const c = (a + b) >> 1; if (key[c] < x - r) a = c + 1; else b = c; } for (; a < key.length && key[a] <= x + r; a++) fn(L.v[a]); };
  const sorted = B.map(by);
  const all = B[0].concat(B[1], B[2]); let io = 0, n = 0, kw = 0, iw = 0, finer = F, Fk = null;
  return {
    // S.over = the strokes of the next broader coat that lie over its middle
    over(step) {
      for (const end = Math.min(all.length, io + step); io < end; io++) { const S = all[io], k = Math.min(2, Math.round(S.arr[S.i + 14]) - 7);
        for (let j = k + 1; j < 3 && !S.over; j++) near(sorted[j], S.m[ax], sorted[j].r, (T) => { if (under(T, S)) (S.over || (S.over = [])).push(T); }); }
      return io >= all.length;
    },
    // which strokes: first every stroke's own values, in the order the strokes were laid (a1: the rule's first answer; au:
    // the first u it answers, asked up to 64 times); then, from the broadest coat down, which of them is second coat
    which(rule) {
      for (const S of all) { S.a1 = S.au = rule(S.m, S.dab); for (let t = 1; t < 64 && S.au < 0; t++) S.au = rule(S.m, S.dab); }
      for (let k = 2; k >= 0; k--) for (const S of B[k]) {
        if (!S.over) S.b = S.a1;
        else if (S.over.every((T) => T.b >= 0)) S.b = S.au;
      }
    },
    // when, from the finest of the broad coats up: with the last second-coat stroke of the finer coats under its plate
    when(step) {
      for (let done = 0; kw < 3 && done < step;) {
        if (!Fk) Fk = by(finer);
        for (; iw < B[kw].length && done < step; iw++) { const S = B[kw][iw]; if (S.b < 0) continue;
          let last = -1; near(Fk, S.m[ax], Math.sqrt(Math.max(S.r2, 0)), (f) => { if (f.b > last && under(S, f)) last = f.b; });
          if (last >= 0) S.b = last;
          S.arr[S.i + 13] = S.b; n++; done++; }
        if (iw >= B[kw].length) { finer = finer.concat(B[kw].filter((S) => S.b >= 0)); Fk = null; kw++; iw = 0; }   // this coat's second-coat strokes are finer strokes for the next coat
      }
      return kw >= 3;
    },
    count: () => n,
  };
}
export const MIDLAD = [34, 16, 165, 50, 330, 90];   // the rungs of a form 10 to 20 m long (jar, loaf, horn, melon)

// ---------------------------------------------------------------------------------------------------------
// The beast: bear or cub. Local frame: body in the plane x = 0, tail toward -Z, nose toward +Z, head turned to +X.
// k scales the whole animal (1 = the 60 m she-bear). Returns { lofts, eyes, bonesInfo } for painting.
function beastLofts(rng, k, cub) {
  const j = (a) => 1 + rng.range(-a, a);
  const hump = j(0.05), sag = j(0.06), hs = (cub ? 1.25 : 1) * j(0.05), legz = rng.range(-1, 1), th = cub ? 6.5 : 4;
  const S = (a) => a.map((r) => [r[0] * k, r[1] * k, r[2] * k, r[3] * k, r[4] * k, r[5]]);
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  const torso = makeLoft(S([[0, 17, -29.2, 0.5, 1, 2], [0, 17.6, -27.6, th * 0.75, 6 * sag, 3], [0, 18.2, -23, th, 8, 4], [0, 18, -12, th, 7.3 * sag, 4.5],
    [0, 18.5, 0, th, 7.5 * sag, 4.5], [0, 19.2 * hump, 9, th, 7.8, 4], [0, 19.6 * hump, 15.5, th * 0.95, 7, 4], [0, 19.6, 20, th * 0.75, 5.6, 3], [0, 19.6, 22, 0.6, 1.5, 2]]), X, Y);
  const neck = makeLoft(S([[0, 20, 14, th * 0.9, 6.4, 3.5], [0.5, 19.8, 19.5, th * 0.95, 6, 3], [1.2, 19.4, 23.5, th, 5.4, 2.6], [1.6, 19.2, 26.5, th * 0.5, 3, 2.2]]), X, Y);
  const ya = (cub ? 62 : 70) * Math.PI / 180, hd = [Math.sin(ya), 0, Math.cos(ya)], hr = [Math.cos(ya), 0, -Math.sin(ya)], hc = [1.5, 19, 25.5];
  const H = (rows) => S(rows.map(([t, y, a, b, n, dr]) => [hc[0] + hd[0] * t * hs + hr[0] * (dr || 0), hc[1] + (y - 19) * hs, hc[2] + hd[2] * t * hs + hr[2] * (dr || 0), a * hs, b * hs, n]));
  const head = makeLoft(H([[-5, 19.5, 0.8, 1, 2], [-4, 19.5, 4, 4.6, 2.4], [-1, 19.2, 5.6, 6, 2.6], [2, 19.1, 5.2, 5.5, 2.6], [4.5, 18.3, 3.5, 3.4, 2.4], [7, 17.9, 2.7, 2.6, 2.3], [8.8, 17.6, 1.95, 1.85, 2.2], [9.3, 17.5, 0.62, 0.55, 2]]), hr, Y);
  const jaw = makeLoft(H([[2.6, 13.9, 0.6, 0.4, 2], [3.6, 13.9, 2.1, 0.8, 2.5], [6, 14.1, 1.9, 0.8, 2.5], [8, 14.4, 1.5, 0.7, 2.3], [8.5, 14.5, 0.4, 0.3, 2]]), hr, Y);
  const tongue = makeLoft(H([[5, 15.2, 0.5, 0.3, 2], [6.5, 15.15, 1.25, 0.42, 2.4], [8.6, 14.95, 1.3, 0.42, 2.4], [9.7, 14.5, 1.1, 0.4, 2.2], [10.1, 14.1, 0.3, 0.2, 2]]), hr, Y);
  const ear = (sd) => makeLoft(H([[-1.6, 23, 1.2, 0.9, 2, sd * 3.6], [-1.7, 24.6, 1.35, 0.85, 2, sd * 3.9], [-1.75, 25.7, 1.2, 0.7, 2, sd * 4.05], [-1.8, 26.4, 0.75, 0.45, 2, sd * 4.1], [-1.8, 26.7, 0.2, 0.15, 2, sd * 4.1]]), hr, hd);
  const leg = (x, z) => makeLoft(S([[x, 15.5, z, 1.9 * th / 4, 3, 3], [x, 10.5, z, 1.9 * th / 4, 2.75, 3.5], [x, 5, z, 1.8 * th / 4, 2.35, 3.5], [x, 2, z + 0.2, 1.8 * th / 4, 2.4, 3.2],
    [x, 0.95, z + 1, 1.9 * th / 4, 3.1, 3], [x, 0.12, z + 1, 1.5 * th / 4, 2.7, 3]]), X, Z);
  const lx = 2.1 * th / 4, legs = [leg(-lx, -24.6 + legz), leg(lx, -19 + legz * 0.6), leg(lx, 9.4 - legz * 0.5), leg(-lx, 15 - legz * 0.3)];
  const pivots = [[-lx, 14.5, -24.6 + legz], [lx, 14.5, -19 + legz * 0.6], [lx, 14.5, 9.4 - legz * 0.5], [-lx, 14.5, 15 - legz * 0.3]].map((p) => p.map((v) => v * k));
  const tail = makeLoft(S([[0, 20.6, -27.6, 1.2, 1.4, 2], [0, 19.5, -29.9, 1.3, 1.5, 2], [0, 18, -30.7, 1, 1.1, 2], [0, 17, -30.7, 0.3, 0.3, 2]]), X, Z);
  // eye rounds on the front of the skull
  const eyes = [], P = [0, 0, 0], N = [0, 0, 0];
  for (const q of [0.15, 0.35]) { head.at(0.57, q, P, N); const n = [N[0] + hd[0] * 1.2, N[1] + 0.1, N[2] + hd[2] * 1.2], l = Math.hypot(n[0], n[1], n[2]); eyes.push({ p: [P[0], P[1], P[2]], n: [n[0] / l, n[1] / l, n[2] / l], r: 0.95 * k * hs * (cub ? 1.3 : 1) }); }
  return { torso, neck, head, jaw, tongue, ears: [ear(1), ear(-1)], legs, pivots, tail, eyes, hd, hr, hc: hc.map((v) => v * k), hs };
}

// buildBeast(ctx, style, o): a painted bear (or cub with o.cub) as { object, bones, pivots, eyes, lofts, strokes, tris, setPose }.
// o: { k scale, cub, rng, birth [u0,u1] second coat of broad strokes tail->nose, flickBirth [u0,u1], second (share of the
// near coat that is second coat, default 0.4), fans (grass fans at the paws), lod Vector4 }.
export async function buildBeast(ctx, style, o = {}) {
  const rng = o.rng || ctx.rng, k = o.k ?? 1, cub = !!o.cub, Lf = beastLofts(rng, k, cub);
  const bones = []; for (let i = 0; i < 8; i++) bones.push(new THREE.Matrix4());
  const group = new THREE.Group();
  const parts = [[Lf.torso, 44, 40, 0], [Lf.neck, 10, 24, 5], [Lf.head, 26, 28, 7], [Lf.jaw, 8, 12, 7], [Lf.tongue, 8, 12, 7], [Lf.ears[0], 8, 14, 7], [Lf.ears[1], 8, 14, 7],
    [Lf.legs[0], 14, 20, 1], [Lf.legs[1], 14, 20, 2], [Lf.legs[2], 14, 20, 3], [Lf.legs[3], 14, 20, 4], [Lf.tail, 8, 12, 0]];
  const geos = []; for (const [L, ns, nq, b] of parts) { geos.push(loftGeometry(L, ns, nq, b)); if (geos.length % 3 === 0) await ctx.yield(); }
  // merge by hand (position + aBone + index)
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), bn = new Float32Array(nv), idx = new Uint32Array(ni); let ov = 0, oi = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, ov * 3); bn.set(g.attributes.aBone.array, ov); const a = g.index.array; for (let i = 0; i < a.length; i++) idx[oi + i] = a[i] + ov; ov += g.attributes.position.count; oi += a.length; g.dispose(); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('aBone', new THREE.BufferAttribute(bn, 1)); bg.setIndex(new THREE.BufferAttribute(idx, 1));
  const body = new THREE.Mesh(bg, style.bodyMaterial({ bones })); body.frustumCulled = false; group.add(body);
  await ctx.yield();

  const sb = new StrokeBuffer(rng), b0 = o.birth || [0.08, 0.26], fb = o.flickBirth || [0.187, 0.287], second = o.second ?? 0.4;
  const zf = (P) => Math.min(1, Math.max(0, (P[2] / k + 30) / 60));
  const birth = (P) => b0[0] + (b0[1] - b0[0]) * zf(P) + rng.range(-0.012, 0.012);
  const fbirth = (P) => fb[0] + (fb[1] - fb[0]) * zf(P) + rng.range(-0.004, 0.004);
  const bellyY = 12.6 * k, w = (cub ? 0.3 : 0.46), ln = cub ? [0.5, 1.5] : [1.1, 3.2], gap = cub ? 0.02 : 0.03;
  const eyeHole = (P) => { for (const e of Lf.eyes) if (Math.hypot(P[0] - e.p[0], P[1] - e.p[1], P[2] - e.p[2]) < e.r * 1.22) return true; return false; };
  const pigTorso = (P, N) => (N[1] < -0.5 || P[1] < bellyY + 0.9 * k * ctx.noise.n2(P[2] * 0.11 / k, 3.3) ? PIG.OCHRE : PIG.CREAM);
  const pigHead = (P, N, s) => (eyeHole(P) || s > 0.968 ? -1 : (N[1] < -0.55 ? PIG.OCHRE : PIG.CREAM));
  const pigLeg = (P, N) => (P[1] < 0.75 * k ? (N[2] > 0.1 && rng() < 0.8 ? PIG.BRICK : -1) : (N[2] < -0.45 ? PIG.OCHRE : PIG.CREAM));
  const pigEar = (P, N) => (N[0] * Lf.hd[0] + N[2] * Lf.hd[2] > 0.5 && P[1] < Lf.hc[1] + 6.3 * k * Lf.hs && P[1] > Lf.hc[1] + 5.2 * k * Lf.hs ? -1 : PIG.CREAM);
  // three coats: A the first coat, whole at u 0, laid full; B the sparse dry second coat that lands ahead of the camera
  // over it (its lanes fall between A's, so the bristle streaks of one are half closed by the other: a scumble, about
  // 85 % cover, the cloth showing as long thin streaks); M the far coat of fewer, bigger strokes.
  const coats = cub ? [[2, 1, 1, 'A'], [2, 1.2, 1.4, 'B']] : [[2, 1, 1, 'A'], [2, 1.2, 1.5, 'B'], [1, 3.0, 2.2, 'M']];   // [level, width x, length x]
  for (const [lv, wx, lx, ct] of coats) {
    const B2 = ct === 'B', near = lv === 2;
    const o2 = (pig, bone, extra) => ({ width: w * wx, len: [ln[0] * lx, ln[1] * lx * (near ? 1 : 0.6)], pig, bone, level: lv, birth: B2 ? birth : null,
      skip: B2 ? 0.66 : 0, seed: B2 ? [0.5, 1] : ct === 'A' ? [0.3, 0.9] : [0.1, 0.9], lane0: B2 ? 0.5 : 0, dry: B2 ? 0.3 : 0.1, ...extra });
    await paintLoftAsync(sb, Lf.torso, rng, o2(pigTorso, 0, { reverse: true, s0: 0.03, s1: 0.97, flow: (s) => 0.03 * ctx.noise.n2(s * 3.4, 1.7) + 0.008 * ctx.noise.n2(s * 11, 5.1) }), ctx.yield); await ctx.yield();
    await paintLoftAsync(sb, Lf.neck, rng, o2(pigTorso, 5, { reverse: true, s0: 0.04, s1: 0.8 }), ctx.yield); await ctx.yield();
    await paintLoftAsync(sb, Lf.head, rng, o2(pigHead, 7, { reverse: true, s0: 0.04, s1: 0.995, len: [ln[0] * lx * 0.7, ln[1] * lx * 0.6] }), ctx.yield); await ctx.yield();
    for (let i = 0; i < 4; i++) await paintLoftAsync(sb, Lf.legs[i], rng, o2(pigLeg, i + 1, { s0: 0.03, s1: 0.99 }), ctx.yield);
    await ctx.yield();
    if (ct === 'A') {
      paintLoft(sb, Lf.jaw, rng, o2(() => PIG.OCHRE, 7, { width: w * 0.8, len: [1 * k, 2.2 * k], reverse: true }));
      paintLoft(sb, Lf.tongue, rng, o2(() => PIG.BRICK, 7, { width: w * 0.7, len: [0.6 * k, 1.4 * k], reverse: true }));
      for (const e of Lf.ears) paintLoft(sb, e, rng, o2(pigEar, 7, { width: w * 0.75, len: [0.5, 1.1] }));
      paintLoft(sb, Lf.tail, rng, o2(() => PIG.CREAM, 0, { width: w * 0.8, len: [0.6, 1.2] }));
    }
  }
  // the rump: drags round the rounded hind end, from its tip outward (the lanes thin out there and would leave a hole)
  {
    const T = Lf.torso, A0 = [0, 0, 0], A1 = [0, 0, 0], Am = [0, 0, 0], An = [0, 0, 0], NR = 16;
    for (let i = 0; i < NR; i++) for (const [ta, tb] of [[0.004, 0.075], [0.06, 0.15]]) {
      const q = T.qAt((i + 0.5) / NR); T.at(ta, q, A0); T.at(tb, q, A1); T.at((ta + tb) / 2, q, Am, An);
      const bend = (Am[0] - (A0[0] + A1[0]) / 2) * An[0] + (Am[1] - (A0[1] + A1[1]) / 2) * An[1] + (Am[2] - (A0[2] + A1[2]) / 2) * An[2];
      sb.add([A0[0], A0[1], A0[2]], [A1[0] - A0[0], A1[1] - A0[1], A1[2] - A0[2]], [An[0], An[1], An[2]], T.perim / NR * (ta < 0.01 ? 0.7 : 1.0), pigTorso(Am, An), { bend, seed: rng.range(0.2, 0.6) });
    }
  }
  {   // the tail stub, painted all round along its own curve
    const T = Lf.tail, A0 = [0, 0, 0], A1 = [0, 0, 0], Am = [0, 0, 0], An = [0, 0, 0];
    for (let i = 0; i < 8; i++) for (const [ta, tb] of [[0.02, 0.56], [0.44, 0.985]]) {
      const q = (i + 0.5) / 8; T.at(ta, q, A0); T.at(tb, q, A1); T.at((ta + tb) / 2, q, Am, An);
      const bend = (Am[0] - (A0[0] + A1[0]) / 2) * An[0] + (Am[1] - (A0[1] + A1[1]) / 2) * An[1] + (Am[2] - (A0[2] + A1[2]) / 2) * An[2];
      sb.add([A0[0], A0[1], A0[2]], [A1[0] - A0[0], A1[1] - A0[1], A1[2] - A0[2]], [An[0], An[1], An[2]], T.perim / 8 * 1.3, PIG.CREAM, { bend, seed: rng.range(0.2, 0.6) });
    }
  }
  await ctx.yield();
  // fur flicks: combed rows along the back, neck and skull, 60 degrees to the row, standing past the silhouette
  const fl = cub ? 0.7 : 1.2, fw = cub ? 0.22 : 0.3, fst = cub ? 0.3 : 0.42;
  const rows = [[Lf.torso, 0.02, 0.9, 0], [Lf.neck, 0.35, 0.85, 5], [Lf.head, 0.1, 0.5, 7]];
  for (const [L, s0, s1, bone] of rows) {
    await ctx.yield();
    flickRow(sb, L, rng, { q: 0.25, s0, s1, step: fst, len: fl, width: fw, bone, birth: fbirth, mode: 'fin' });
    for (const [q, side] of [[0.085, 1], [0.415, -1]]) for (const dq of [0, 0.022]) {
      flickRow(sb, L, rng, { q: q + (q < 0.25 ? dq : -dq) + 0.05 * (q < 0.25 ? 1 : -1), s0, s1, step: fst * 1.1, len: fl * 0.9, width: fw, bone, birth: fbirth, mode: 'lie', side });
    }
  }
  // ochre flicks down the back of each leg, brick claws
  for (let i = 0; i < 4; i++) flickRow(sb, Lf.legs[i], rng, { q: 0.75, s0: 0.2, s1: 0.8, step: fst * 1.6, len: fl * 0.7, width: fw, pig: PIG.OCHRE, bone: i + 1, birth: fbirth, mode: 'fin' });
  // grass fans: seven green flicks from one point at each paw, in place of a shadow (bone 6 leans them)
  if (o.fans !== false) {
    for (let i = 0; i < 4; i++) for (let f = 0; f < 3; f++) {
      const pv = Lf.pivots[i], bx = pv[0] + rng.range(-3, 3) * k * (cub ? 0.5 : 1), bz = pv[2] + (f - 1) * 3.2 * k + rng.range(-0.8, 0.8), hh = rng.range(1, 2) * (cub ? 0.6 : 1);
      const sx = Math.sign(bx) || 1, x0 = sx * (Math.abs(bx) * 0.3 + (cub ? 2.2 : 4.4) * k + 0.3);
      for (let t = 0; t < 7; t++) { const a = (t - 3) * 0.3 + rng.range(-0.05, 0.05); sb.add([x0, 0, bz], [sx * 0.25 * hh, Math.cos(a) * hh, Math.sin(a) * hh], [sx, 0.25, 0], 0.17 * (cub ? 0.7 : 1), PIG.GREEN, { bone: 6, level: 2, birth: rng() < 0.5 ? b0[0] - 0.06 + 0.2 * zf([0, 0, bz]) : -1 }); }
    }
  }
  const fb2 = (P) => (rng() < 0.6 ? -1 : fbirth(P));
  // dry stroke ends crossing every contour: hanging belly and chest fur, flicks down the front and back of each leg,
  // a ruff round the cheeks and the rump, so no edge of her is a clean cut
  await ctx.yield();
  flickRow(sb, Lf.torso, rng, { q: 0.75, s0: 0.07, s1: 0.93, step: fst * 1.25, len: fl * 1.15, width: fw * 1.2, pig: PIG.OCHRE, bone: 0, birth: fb2, mode: 'fin' });
  flickRow(sb, Lf.torso, rng, { q: 0.75, s0: 0.1, s1: 0.9, step: fst * 2.2, len: fl * 0.8, width: fw, pig: PIG.CREAM, bone: 0, birth: fb2, mode: 'fin', lean: 0.2 });
  flickRow(sb, Lf.neck, rng, { q: 0.75, s0: 0.1, s1: 0.9, step: fst * 1.3, len: fl, width: fw * 1.1, pig: PIG.OCHRE, bone: 5, birth: fb2, mode: 'fin' });
  for (let i = 0; i < 4; i++) {
    flickRow(sb, Lf.legs[i], rng, { q: 0.25, s0: 0.06, s1: 0.82, step: fst * 1.5, len: fl * 0.75, width: fw, pig: PIG.CREAM, bone: i + 1, birth: fb2, mode: 'fin', lean: -0.55 });
    flickRow(sb, Lf.legs[i], rng, { q: 0.75, s0: 0.06, s1: 0.82, step: fst * 1.7, len: fl * 0.8, width: fw, pig: PIG.CREAM, bone: i + 1, birth: fb2, mode: 'fin', lean: -0.55 });
  }
  await ctx.yield();
  for (const q of [0.02, 0.48, 0.6, 0.9]) flickRow(sb, Lf.head, rng, { q, s0: 0.12, s1: 0.5, step: fst * 1.2, len: fl * 0.85, width: fw, pig: q > 0.5 ? PIG.OCHRE : PIG.CREAM, bone: 7, birth: fb2, mode: 'fin' });
  flickRow(sb, Lf.tail, rng, { q: 0.75, s0: 0.05, s1: 0.95, step: fst, len: fl * 0.8, width: fw, pig: PIG.CREAM, bone: 0, birth: fb2, mode: 'fin', lean: -0.4 });
  flickRow(sb, Lf.torso, rng, { q: 0.25, s0: 0.0, s1: 0.06, step: fst * 0.8, len: fl, width: fw, pig: PIG.CREAM, bone: 0, birth: fb2, mode: 'fin', lean: 0.8 });
  // the legs are closed: a last coat between the lanes of the first, each stroke laid well over the one before, so a leg
  // reads as one painted limb (cream, an ochre back edge); the dry gaps stay on the flank and the back
  if (!cub) {
    const lr = rng.fork ? rng.fork('legs') : rng;
    for (let i = 0; i < 4; i++) {
      paintLoft(sb, Lf.legs[i], lr, { width: w, len: [1.4, 3.0], bone: i + 1, level: 2, s0: 0.03, s1: 0.99, adv: [0.5, 0.68], seed: [0, 0.25], dry: 0, lane0: 0.5, side: 1.3,
        pig: (P, N) => (P[1] < 0.75 * k ? -1 : N[2] < -0.45 ? PIG.OCHRE : PIG.CREAM) });
      await ctx.yield();
    }
  }
  const strokes = sb.count, meshes = sb.build(style.strokeMaterial({ bones, lod: o.lod || (cub ? new THREE.Vector4(1e6, 30, 2e6, 100) : null) }));
  let tris = bg.index.count / 3; for (const m of meshes) { group.add(m); tris += m.userData.tris; }
  await ctx.yield();
  // eye rounds
  const eg = new THREE.InstancedBufferGeometry(), pl = new THREE.PlaneGeometry(1, 1); eg.index = pl.index; eg.setAttribute('position', pl.getAttribute('position'));
  const ea = new Float32Array(Lf.eyes.length * 10); Lf.eyes.forEach((e, i) => ea.set([e.p[0], e.p[1], e.p[2], e.n[0], e.n[1], e.n[2], e.r, 7, rng(), 1], i * 10));
  const eb = new THREE.InstancedInterleavedBuffer(ea, 10); eg.setAttribute('aP', new THREE.InterleavedBufferAttribute(eb, 3, 0)); eg.setAttribute('aN', new THREE.InterleavedBufferAttribute(eb, 3, 3)); eg.setAttribute('aA', new THREE.InterleavedBufferAttribute(eb, 4, 6));
  eg.instanceCount = Lf.eyes.length;
  const eyes = new THREE.Mesh(eg, style.eyeMaterial({ bones })); eyes.frustumCulled = false; group.add(eyes);
  const m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), look = { yaw: 0 };   // look.yaw: the head alone turns (radians, + toward the tail side of +X)
  // setPose(phase, lean): phase in radians (2 pi = one stride), lean = grass shear
  const setPose = (phase, lean = 0, amp = 0.15) => {
    for (let i = 0; i < 4; i++) {
      const pv = Lf.pivots[i], a = amp * Math.sin(phase + (i === 0 || i === 2 ? 0 : Math.PI));
      bones[i + 1].makeTranslation(pv[0], pv[1], pv[2]).multiply(m1.makeRotationX(a)).multiply(m2.makeTranslation(-pv[0], -pv[1], -pv[2]));
    }
    const nod = 0.014 * Math.sin(phase * 2 + 0.7), hy = 19 * k, hz = 19 * k;
    bones[5].makeTranslation(0, hy, hz).multiply(m1.makeRotationX(nod)).multiply(m2.makeTranslation(0, -hy, -hz));
    const px = Lf.hc[0], pz = Lf.hc[2] - 1 * k;
    bones[7].copy(bones[5]).multiply(m1.makeTranslation(px + Math.max(0, look.yaw) * 2.6 * k, 0, pz)).multiply(m2.makeRotationY(look.yaw)).multiply(m1.makeTranslation(-px, 0, -pz));   // turning back, the head also cranes out past her shoulder
    bones[6].identity(); bones[6].elements[6] = lean; bones[6].elements[4] = lean * 0.3;   // z and x sheared by y
  };
  setPose(0, 0);
  return { object: group, bones, pivots: Lf.pivots, eyes: Lf.eyes, lofts: Lf, strokes, tris, calls: 2 + meshes.length, setPose, look };
}

// ---------------------------------------------------------------------------------------------------------
// The cub, as he drew a cub: a short round body about one and a half heads long, a big round head built straight ahead
// (+Z) that bone 7 turns to whoever is looking, two full eye rounds, round ears, four thick legs with brick pads, an
// ochre underside. Local metres: 10.5 long, 8.6 to the crown; o.k scales the whole animal. Strokes run nose to tail
// and bend round the barrel; the legs are closed limbs (overlapping strokes, an ochre back edge).
// Returns { object, bones, look { yaw, pitch }, setPose(phase, lean, amp, bound), strokes, tris, calls }.
//   setPose: phase in radians (2 pi = one stride); bound 0 = walk (diagonal pairs), 1 = bounding (fore pair and hind
//   pair gathered at phase 3 pi / 2 and flung at pi / 2); look.yaw (+ toward local +X) and look.pitch (+ = muzzle down).
export async function buildCub(ctx, style, o = {}) {
  const rng = o.rng || ctx.rng, k = o.k ?? 1, X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  const bones = []; for (let i = 0; i < 8; i++) bones.push(new THREE.Matrix4());
  const group = new THREE.Group(); group.scale.setScalar(k); group.rotation.order = 'YXZ';
  const j = (a) => 1 + rng.range(-a, a), fat = j(0.05), hs = j(0.04);
  const torso = makeLoft([[0, 4.7, -4.5, 0.5, 0.6, 2], [0, 4.6, -3.9, 1.7, 2.0 * fat, 2.4], [0, 4.45, -1.8, 2.25, 2.65 * fat, 2.6], [0, 4.5, 0.8, 2.3, 2.7 * fat, 2.6],
    [0, 4.8, 3.0, 2.05, 2.45, 2.5], [0, 5.1, 4.3, 1.2, 1.5, 2.2], [0, 5.2, 4.7, 0.4, 0.5, 2]], X, Y);
  const hc = [0, 6.1, 4.4];                                    // the head turns and nods about this point
  const H = (rows) => rows.map(([t, y, a, b, n, dr]) => [hc[0] + (dr || 0) * hs, hc[1] + y * hs, hc[2] + t * hs, a * hs, b * hs, n]);
  const head = makeLoft(H([[-2.5, 0.1, 0.5, 0.5, 2], [-2.0, 0.1, 1.9, 1.9, 2.2], [-0.6, 0.15, 2.65, 2.55, 2.3], [0.9, 0.05, 2.6, 2.45, 2.3], [2.0, -0.45, 1.75, 1.6, 2.2],
    [2.9, -0.75, 1.2, 1.05, 2.2], [3.45, -0.85, 0.85, 0.75, 2.1], [3.7, -0.9, 0.25, 0.2, 2]]), X, Y);
  const ear = (sd) => makeLoft(H([[-0.5, 1.9, 0.55, 0.35, 2, sd * 1.75], [-0.55, 2.55, 1.0, 0.42, 2, sd * 1.95], [-0.6, 3.15, 1.0, 0.4, 2, sd * 2.05], [-0.6, 3.6, 0.55, 0.28, 2, sd * 2.05], [-0.6, 3.75, 0.15, 0.12, 2, sd * 2.05]]), X, Z);
  const leg = (x, z) => makeLoft([[x, 4.0, z, 0.95, 1.25, 2.6], [x, 2.6, z, 0.92, 1.12, 2.8], [x, 1.2, z, 0.9, 1.05, 2.8], [x, 0.55, z + 0.25, 0.95, 1.3, 2.6], [x, 0.08, z + 0.3, 0.8, 1.15, 2.6]], X, Z);
  const lx = 1.15, lz = [-2.7, -2.5, 2.3, 2.5], legs = [leg(-lx, lz[0]), leg(lx, lz[1]), leg(lx, lz[2]), leg(-lx, lz[3])];
  const pivots = [[-lx, 3.7, lz[0]], [lx, 3.7, lz[1]], [lx, 3.7, lz[2]], [-lx, 3.7, lz[3]]];
  const tail = makeLoft([[0, 5.6, -4.1, 0.6, 0.7, 2], [0, 5.3, -4.9, 0.65, 0.75, 2], [0, 4.7, -5.2, 0.4, 0.45, 2]], X, Z);
  const P = [0, 0, 0], N = [0, 0, 0], eyes = [];
  for (const q of [0.11, 0.39]) { head.at(0.6, q, P, N); const n = [N[0] * 0.6, N[1] * 0.5 + 0.08, N[2] + 1.1], l = Math.hypot(n[0], n[1], n[2]); eyes.push({ p: [P[0], P[1], P[2]], n: [n[0] / l, n[1] / l, n[2] / l], r: 0.5 * hs }); }
  const parts = [[torso, 20, 26, 0], [head, 18, 24, 7], [ear(1), 6, 12, 7], [ear(-1), 6, 12, 7], [legs[0], 8, 16, 1], [legs[1], 8, 16, 2], [legs[2], 8, 16, 3], [legs[3], 8, 16, 4], [tail, 5, 10, 0]];
  const geos = parts.map(([L, ns, nq, b]) => loftGeometry(L, ns, nq, b));
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), bn = new Float32Array(nv), idx = new Uint32Array(ni); let ov = 0, oi = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, ov * 3); bn.set(g.attributes.aBone.array, ov); const a = g.index.array; for (let i = 0; i < a.length; i++) idx[oi + i] = a[i] + ov; ov += g.attributes.position.count; oi += a.length; g.dispose(); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('aBone', new THREE.BufferAttribute(bn, 1)); bg.setIndex(new THREE.BufferAttribute(idx, 1));
  const body = new THREE.Mesh(bg, style.bodyMaterial({ bones })); body.frustumCulled = false; group.add(body);
  await ctx.yield();
  const sb = new StrokeBuffer(rng), bth = o.birth || (() => -1);
  const eyeHole = (Q) => eyes.some((e) => Math.hypot(Q[0] - e.p[0], Q[1] - e.p[1], Q[2] - e.p[2]) < e.r * 1.3 * 1.25);
  // first coat whole and full; a thin dry second coat between its lanes lands as we come
  for (const [B2, wx] of [[false, 1], [true, 1.15]]) {
    const o2 = (pig, bone, extra) => ({ width: 0.5 * wx, len: [0.9, 2.1], pig, bone, level: 2, birth: B2 ? bth : null, skip: B2 ? 0.6 : 0, seed: B2 ? [0.4, 0.9] : [0.1, 0.6], lane0: B2 ? 0.5 : 0, dry: B2 ? 0.25 : 0.06, ...extra });
    await paintLoftAsync(sb, torso, rng, o2((Q, Nn) => (Nn[1] < -0.42 ? PIG.OCHRE : PIG.CREAM), 0, { reverse: true, s0: 0.02, s1: 0.985 }), ctx.yield);
    await paintLoftAsync(sb, head, rng, o2((Q, Nn, s) => (eyeHole(Q) || s > 0.94 ? -1 : Nn[1] < -0.62 ? PIG.OCHRE : PIG.CREAM), 7, { reverse: true, s0: 0.03, s1: 0.995, len: [0.8, 1.7] }), ctx.yield);
    await ctx.yield();
    // legs: strokes down the limb, each well over the last, so the leg is one painted limb; ochre down its back, a brick pad
    for (let i = 0; i < 4; i++) paintLoft(sb, legs[i], rng, o2((Q, Nn) => (Q[1] < 0.62 ? PIG.BRICK : Nn[2] < -0.5 ? PIG.OCHRE : PIG.CREAM), i + 1, { s0: 0.02, s1: 0.99, adv: [0.5, 0.68], seed: B2 ? [0.2, 0.5] : [0, 0.25], dry: 0, skip: B2 ? 0.5 : 0, side: 1.3 }));
    await ctx.yield();
  }
  for (const sd of [0, 1]) paintLoft(sb, sd ? ear(-1) : ear(1), rng, { width: 0.4, len: [0.6, 1.3], bone: 7, pig: (Q, Nn) => (Nn[2] > 0.6 && Q[1] > hc[1] + 2.3 * hs && Q[1] < hc[1] + 3.3 * hs ? PIG.OCHRE : PIG.CREAM), seed: [0, 0.3] });
  paintLoft(sb, tail, rng, { width: 0.4, len: [0.6, 1.2], pig: () => PIG.CREAM, seed: [0, 0.3] });
  return cubFinish(ctx, style, { group, bones, sb, rng, torso, head, legs, pivots, hc, eyes, bg, k, bth });
}
async function cubFinish(ctx, style, c) {
  const { group, bones, sb, rng, torso, head, legs, pivots, hc, eyes, bg, k, bth } = c;
  // short fur flicks: one combed row along the spine and one over the crown, a ruff under the chin and the belly
  flickRow(sb, torso, rng, { q: 0.25, s0: 0.05, s1: 0.8, step: 0.42, len: 0.6, width: 0.26, bone: 0, birth: bth, mode: 'fin' });
  flickRow(sb, torso, rng, { q: 0.75, s0: 0.12, s1: 0.85, step: 0.6, len: 0.55, width: 0.28, pig: PIG.OCHRE, bone: 0, mode: 'fin' });
  flickRow(sb, head, rng, { q: 0.25, s0: 0.1, s1: 0.5, step: 0.45, len: 0.5, width: 0.24, bone: 7, mode: 'fin' });
  for (const q of [0.03, 0.47]) flickRow(sb, head, rng, { q, s0: 0.12, s1: 0.45, step: 0.5, len: 0.5, width: 0.24, bone: 7, mode: 'fin' });
  for (let i = 0; i < 4; i++) flickRow(sb, legs[i], rng, { q: 0.75, s0: 0.1, s1: 0.75, step: 0.6, len: 0.45, width: 0.26, pig: PIG.OCHRE, bone: i + 1, mode: 'fin' });
  // the mouth: one brick dab under the bare black nose
  { const Q = [0, 0, 0], Nn = [0, 0, 0]; head.at(0.9, 0.75, Q, Nn); sb.add([Q[0] - 0.02, Q[1] + 0.25, Q[2] + 0.05], [0, -0.75, -0.12], [0, -0.3, 1], 0.62, PIG.BRICK, { bone: 7, seed: 0.05, variant: 1 }); }
  await ctx.yield();
  const strokes = sb.count, meshes = sb.build(style.strokeMaterial({ bones, lod: new THREE.Vector4(1e6, 30, 2e6, 100) }));
  let tris = bg.index.count / 3; for (const m of meshes) { group.add(m); tris += m.userData.tris; }
  const eg = new THREE.InstancedBufferGeometry(), pl = new THREE.PlaneGeometry(1, 1); eg.index = pl.index; eg.setAttribute('position', pl.getAttribute('position'));
  const ea = new Float32Array(eyes.length * 10); eyes.forEach((e, i) => ea.set([e.p[0] + e.n[0] * 0.3, e.p[1] + e.n[1] * 0.3, e.p[2] + e.n[2] * 0.3, e.n[0], e.n[1], e.n[2], e.r * k, 7, rng(), 1], i * 10));   // proud of the coat: a whole round, no stroke across it
  const eb = new THREE.InstancedInterleavedBuffer(ea, 10); eg.setAttribute('aP', new THREE.InterleavedBufferAttribute(eb, 3, 0)); eg.setAttribute('aN', new THREE.InterleavedBufferAttribute(eb, 3, 3)); eg.setAttribute('aA', new THREE.InterleavedBufferAttribute(eb, 4, 6));
  eg.instanceCount = eyes.length;
  const em = new THREE.Mesh(eg, style.eyeMaterial({ bones })); em.frustumCulled = false; group.add(em);
  const m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), look = { yaw: 0, pitch: 0 };
  const setPose = (phase, lean = 0, amp = 0.15, bound = 0) => {
    const sn = Math.sin(phase);
    for (let i = 0; i < 4; i++) {
      const pv = pivots[i], walk = amp * Math.sin(phase + (i === 0 || i === 2 ? 0 : Math.PI)), fling = (i >= 2 ? -1 : 1) * amp * 1.7 * sn;
      bones[i + 1].makeTranslation(pv[0], pv[1], pv[2]).multiply(m1.makeRotationX(walk + (fling - walk) * bound)).multiply(m2.makeTranslation(-pv[0], -pv[1], -pv[2]));
    }
    bones[7].makeTranslation(hc[0], hc[1], hc[2]).multiply(m1.makeRotationY(look.yaw)).multiply(m2.makeRotationX(look.pitch)).multiply(m1.makeTranslation(-hc[0], -hc[1], -hc[2]));
    bones[6].identity(); bones[6].elements[6] = lean; bones[6].elements[4] = lean * 0.3;
  };
  setPose(0, 0);
  return { object: group, bones, pivots, eyes, strokes, tris, calls: 2 + meshes.length, setPose, look };
}

// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {

  const rng = ctx.rng.fork ? ctx.rng.fork('she-bear') : ctx.rng;
  const ownStyle = !opts.style, style = opts.style || await makeStyleAsync(ctx, opts.palette || PALETTE);
  const zoom = opts.zoom || 1, fixU = opts.fixU ?? null;
  const object = new THREE.Group();
  await ctx.yield();
  const bear = await buildBeast(ctx, style, { k: 1, rng, birth: opts.birth, flickBirth: opts.flickBirth, second: opts.second, fans: opts.fans, lod: opts.lod });
  object.add(bear.object);
  let tris = bear.tris, calls = bear.calls; const cubs = [];
  if (opts.cubs) {
    for (const z of [10, 34]) {
      await ctx.yield();
      const cr2 = rng.fork ? rng.fork('cub' + z) : rng;
      const c = await buildCub(ctx, style, { k: opts.cubK ?? 1, rng: cr2, birth: () => (cr2() < 0.5 ? -1 : 0.3 + 0.1 * cr2()) });
      c.object.position.set(-8, 0, z); object.add(c.object); cubs.push(c); tris += c.tris; calls += c.calls;
    }
  }
  const E = bear.eyes, L = bear.lofts, P = [0, 0, 0];
  const spine = []; for (let i = 0; i <= 10; i++) { L.torso.at(0.04 + 0.9 * i / 10, 0.25, P); spine.push(new THREE.Vector3(P[0], P[1], P[2])); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    worldOffset: V(...WORLD_OFFSET),
    // the brief's glide, in local space, with 6 m clear of every stroke (the walk swings a paw 2.2 m fore and aft)
    flyThrough: [V(90, 4, -110), V(52, 4, -72), V(13, 6, -34), V(12, 11, -8), V(12, 16, 16), V(26, 21, 24), V(18, 14.5, 30), V(10.5, 7, 29.5), V(0, 5.4, 27), V(-8, 4, 23.5), V(-22, 4.5, 34), V(-28, 5, 42)],
    viewpoints: { entry: V(90, 4, -110), flank: V(12, 11, -8), reveal: V(26, 21, 24), dive: V(10.5, 7, 29.5), lookBack: V(-28, 6, 60) },
    face: V(L.hc[0] + L.hd[0] * 5, L.hc[1], L.hc[2] + L.hd[2] * 5),
    eyes: E.map((e) => V(e.p[0], e.p[1], e.p[2])), gaze: V(L.hd[0], 0, L.hd[2]),
    chin: V(L.hc[0] + L.hd[0] * 7, 13.2, L.hc[2] + L.hd[2] * 7),
    shoulderTop: V(0, 27, 10), spine, paws: bear.pivots.map((p) => V(p[0], 0, p[2] + 1)),
    cubSeats: [{ position: V(-8, 0, 10), k: 0.2 }, { position: V(-8, 0, 34), k: 0.2 }],
    portalSeat: { position: V(-26, 40, 276), facing: V(0, -0.5, -0.866) },   // the brief's signboard, in hero space (not on the bear)
  };
  let prog = -1;
  const apply = (u) => {
    style.uniforms.uU.value = u;
    bear.setPose(u * Math.PI * 4, 0.1 * Math.sin(u * 70));          // two strides in the flight
  };
  apply(0);
  return {
    object, radius: 34 * zoom, height: 28, center: V(2, 14, 0), anchors, style, bear, cubs,
    stats: { strokes: bear.strokes, tris, calls },
    setProgress(u) { prog = u; apply(u); },
    update(dt, time) { style.uniforms.uT.value = time; if (prog < 0) apply(fixU !== null ? parseFloat(fixU) : (time / 40) % 1); },
    dispose() { if (ownStyle) style.dispose(); },
    ground: true, groundY: -0.02,
  };
}
