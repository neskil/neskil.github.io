// The Shore without a Horizon: THE RISING (hero set piece) and the world's STYLE KIT.
//
// WHAT IT IS. The mother-form (a pierced ivory ring, 58 m, swelling below into a hanging drop with a coral tip) hangs with her
// hole at y 118, and under her stands her colony: 420 lathe-smooth bodies of nine types from 2 to 40 m, balanced on needle
// points and on one another, rigged with black threads (a fan to the mother, neighbour to neighbour, one line from each
// body to its shadow), pearls sliding on the threads, one hard black shadow blade per body, the mother's own huge shadow,
// and every body's double in the mirror tide. setProgress(0..1) is THE RISING: 0 = all standing, outer bodies let go
// first, 1 = all hung between 15 and 105 m with the fan taut. Shadows never rise: they stay on the flat and keep swinging.
//
// LOCAL SPACE. Origin = centre of the mound on the flat (the brief's z 400), +Y up, front = +Z: the flight ARRIVES FROM +Z.
// In the world: hero.object.position.set(0, 0, 400); hero.object.rotation.y = Math.PI. Yaw and translation only (no scale, no
// tilt, flat at world y = style.uniforms.uGroundY = 0): shadows, tide and mirror are computed in world space.
// radius 62 (mound 56 + sway), height 126 (ring top), about 147k triangles and 9 draw calls (10 with the stand-alone
// backdrop; one more since the tenth round, the shade's lay), build about 60 ms in steps under 30 ms, one 64x9 half-float texture, no lights.
//
// opts: palette (the brief's 7 hex strings; optional 8th..10th = opal, dove, lemon), detail 0.6..1 (thins small bodies,
// riders and the 40 high-detail bodies), style (the world's shared makeStyle instance; without it the hero makes its own,
// adds its own backdrop dome and plays a demonstration of tide and rising for the part viewer), backdrop (force the dome).
//
// RETURNS { object, radius, height, center, anchors, update, dispose, ground:false, setProgress(u), progress (the uniform),
// style, counts }. anchors (local):
//   portalSeat { position (0,118,-15) = centre of the hole, axis = direction of flight through it (50 deg up, toward -Z),
//                facing = -axis, radius 7, pitch }: seat the 14 m portal here, tilt: true. The hole is 15 m across.
//   flyThrough  four points: lift-off, the knee from the steep lift-off (35 deg) to the shallow approach (14 deg), the start of the last straight 60 m, the hole. No body comes
//                within 8 m of this line in x (aisleHalfWidth) at any stage of the rising; no thread within 5 m.
//   holeCenter, holeRadius, motherTip (the coral tip), motherTop, shadowFoot (where her shadow and her one thread begin),
//   viewpoints { entry, lift, threeQuarter, under }.
// update(dt, time, camera): if the world passed its own style it must call style.update(dt, time, camera) itself, once.
//
// THE STYLE KIT: makeStyle(ctx, { palette, shadowAz }) ->
//   palette     { petrol, violet, opal, apricot, ivory, dove, black, coral, lemon, turquoise }: THREE.Color, already
//               corrected through ink() so that ACES at exposure 1 with a neutral grade shows the brief's hex.
//   uniforms    shared by every material. The world drives: uShadowAz (radians; the two great swings; a 4 degree drift is
//               added in the shader), uTide (dirX, dirZ, distance, exists), uProg (rising progress for the world's own
//               bodies), uGroundY. update(dt, time, camera) drives uTime and uPix (pixel size, for the 1.6 px line floor).
//   formMaterial({ mirror, prog })   instanced lathe bodies; meshMaterial({ accent, dip, mirror }) any smooth mesh;
//   bladeMaterial() / meshShadowMaterial({ footY })   THE SHADOW; threadMaterial({ prog, width }) THE LINE;
//   beadMaterial({ prog, radius }) pearls; backdropMaterial() / makeBackdrop() THE GRADIENT (ground, air, tide, front).
//   gridGeometry(around, along), stripGeometry(n), quadGeometry(), instanced(base, material, count, attrs),
//   formAttrs(bodies), threadAttrs(threads), pointOn(body, t), profiles.at(type, t), bodySample(type, t), MIRROR_ORDER,
//   dispose() (the profile texture; the world calls it in its own dispose).
//   A body = instanced(gridGeometry(8, 12), formMaterial(), n, formAttrs(list)) (sides: a multiple of 4); its shadow = instanced(stripGeometry(10),
//   bladeMaterial(), n, same attrs); its double = formMaterial({ mirror: true }) with renderOrder MIRROR_ORDER. Already
//   risen bodies (the tiers): rel -1, hang = their height.
// HOW EACH RULE IS KEPT. Stuff: every body is a lathe of a stored profile with analytic normals (never faceted); no
//   textures. Colours: only the ten inks. Line: camera-facing ribbon, straight or one parabola of sag. Shadow: geometry on
//   the flat, colour black, 3 x height, hard edge, ignores the rising. Sky: there is none, one ramp(elevation) (the fourteenth round: from its top stop, 40 degrees up, the pale hours' air goes on, deeper, to the zenith: air()) on a dome that
//   also ray-casts the flat, so there is no ground mesh and no horizon. Distance: no fog term exists in any shader. The hand:
//   the modelling light is uModelSkew (0.55 rad) off the shadows, and every profile ends in a needle foot.
// ASSUMED POST: exposure 1, bloom threshold >= 2.4 (ivory and apricot are about 1.5 linear; only the pinpoint, uGlint 7, and
//   nothing else may bloom), strength about 0.3, radius small; grade saturation 1, contrast 1, vignette 0, no tint.
// ADDED BY THE WORLD BUILDER: uniforms uShLen (shadow length in heights; golden hour = 4), uMirror / uMirrorForm (how bright
//   the tide shows the gradient and the doubles; night = oil), uUnderWet (undersides take the mirror's colour once the tide is
//   in), uPeel (the rare event: blades peel off the flat foot first and trail under their risen forms as kite tails);
//   bladeMaterial({ prog }), beadMaterial({ color }), and style.glsl / style.U so the world can write its own materials
//   (far cards, far shadow dashes, hair gardens, free-ended lines) from the same GLSL.
// FIX ROUND 0 (world builder). NO FACET: lathe() now puts ring vertices exactly on the two points where the surface turns
//   away from the eye (solved per ring, perspective included; three quarters of each ring faces the eye), and rings are
//   spaced along the body by outline length plus turning (table in the profile texture's alpha, ringT()), so every body
//   has its true turned outline at any number of sides. Colony levels are chosen by how large a body ever stands beside
//   the line of flight (16x36, 8x18, 8x10). THREADS are designed, not all drawn: fan about 35, neighbours a quarter,
//   tethers only from tall needles; each thread stops being drawn beyond its own distance (tkeep) so a far fan is a few
//   hairs. BLADES are slimmer (uBladeW); seen from the air the needles of the small close and those of the tall widen.
//   Rare tails are tapered pennants facing the eye. Six ESCORT bodies hang beside the last 20 m. Dips scaled by DIPK so
//   the dipped surface stays under a twentieth. FLY follows the world's new course (35 deg lift-off, 14 deg approach).
// FIX ROUND 1 (world builder). THE TURN: shadeForm now models every body as a lathed bone for the eye (ivory on the lit
//   flank, one slide across the middle, dove over the far third, undersides a step darker with the colour of the flat). The
//   light is the PAINTER'S LIGHT: uModelView = 1 lights every body from the right of the eye that looks at it (uModelLean =
//   how far toward the eye), so the turn reads the same anywhere in a wide picture; uModelView = 0 is the old single light
//   at uModelSkew off the shadows (the world blends to it for the last climb). THE MIRROR: mirrorK(e) makes the tide the air
//   itself at level and uMirror only looking down, so no horizon edge appears at night; mirrorInk() greys a double toward
//   dove instead of dimming ivory to khaki. NEEDLES FROM THE AIR: only bodies of uAirKeep metres and over keep their needle,
//   slimmed by uAirSlim (no widening). BUDDING: formMaterial({ bud }) / bladeMaterial({ bud }) with the extra instance
//   attribute iE (see G_LATHE): a bud swells on a flank, slides off, stands, sinks.
// FIX ROUND 2 (world builder). THE RULED MIRROR: makeRuler() chooses, on the screen of the approach, which needles are drawn
//   from the air; bladeMaterial({ pick }) takes them as the instance attribute iK and draws each uAirPx pixels across with
//   a clean taper (all others close as the eye rises); the hero rules up to opts.ruledMax (14) of the colony's own needles
//   into opts.ruler and gives each a line to its shadow; meshShadowMaterial({ axis, airSlim }) closes the mother's shadow to
//   a bold bar from the air; the tide's hairline front thins and is gone before it comes near level.
// FIX ROUND 3 (world builder). THE TURN: uTurn (where the slide from dove to ivory begins and ends), uLimb (the unlit outline
//   a step darker), uUnder (how much of the pale mirror an underside takes); makeStyle opts turn, limb, under. THE SHADOW:
//   bladeMaterial scales the whole profile to the needle (uRmax per type) and never clips it; a needle is a line or nothing
//   (needM, capH: the breadth that shows as a hairline, and the most a needle may be given); it grows from its foot when
//   it first can be drawn. THE RULED MIRROR: a ruled needle is a bold silhouette uAirPx pixels a side at its widest
//   (foreshortening = eye height over distance, over how much of its length is seen); makeRuler gap grows toward the eye
//   (gapNear), feet stay inside the frame. THE FRONT: one pixel, only where the ray looks more than five degrees down.
// JOURNEY ROUND (fix round 4, world builder). THE SHADE: uniform uShade (makeStyle opts.shade, a hex): every shadow on the flat
//   (blades, mesh shadows, and the world's far dashes; the combs lay nothing since the tenth round) is laid in the deep colour of the hour; threads stay uBlack.
//   NEVER A HAIRLINE BAR: a blade whose widest swelling would show under two hairs' breadth is not drawn; blades stay on the
//   flat until the eye is 20-38 m up (was 6-30), so the climbing turn looks down on a ruled flat. meshShadowMaterial({ slim }):
//   a great body's shadow closed toward the line through its foot at any height. THE GIANTS: giantGeometry(kind, H, ns, na)
//   at the end of this file (horn, lens, column, hook, arch), for meshMaterial / meshShadowMaterial. makeProfilesStepped(ctx)
//   builds the profile strip with a yield after each body type (pass it to makeStyle as opts.profiles). The hero's colony
//   is turned in 16x24, 8x14 and 8x9 (a few rings fewer, to pay for the giants).
// FIX ROUND 7 (world builder). DOUBLES: dblK() two fifths from the air, dblKeep(H) (only bodies of 12 m and over are doubled from
//   the air), formMaterial({ sink }) (a double draws back into its foot as its body rises). TAILS (rare): at most 3.5 px a
//   side, and only under shadows that were bold or ruled (iK); the rest are drawn up into their feet. THE FLAT: stepTo() (a
//   drawn mark is one small step from the tone it lies on, so the night flat has no scribbles), no ripple marks and only the
//   broad bars once the eye is off the flat. THE FAN: black hairs, a small bead of colour on each. meshMaterial({ lean }):
//   uLeanAdd, the painter's light brought round toward the eye for one body (the lens). The lens is a rounder ring (0.58).
// FIX ROUND 8 (world builder). makeStyle({ flat }) / uFlat: how much of the pooled wet flat is drawn before the tide (0.1 = the
//   plain violet ground; wetAt() follows it). threadMaterial: a HAIRLINE: 0.36-0.62 px half width, antialiased in the fragment
//   (transparent, no depth write), alpha shaped so that a thin black line stays black on the bright ground; options floor, cap,
//   fine [from m, to m, alpha far]. beadMaterial({ floorPx, at }): a bead held at one end of a hair. formMaterial({ mirror,
//   whole: true | [depth, size] }): a WHOLE double (not squashed, not thinned from the air), hung depth x its body's rise under
//   the mirror at size x its height (uDbl). bladeMaterial: a bold shadow is at least 5.5 px broad at its root (a needle clearly
//   wider than its hair). buildHero({ adjust }): a hook on the forms before they are built; the capped bodies of the mobile
//   keep whole doubles and a bead at the foot of each plumb hair.
// ROUND PENUMBRA BY HEIGHT (world builder). THE SHADE BY HEIGHT: PEN, penD(), penE(), penLeft() (G_PEN, style.glsl.G_PEN) and
//   shadeCurv(geometry) below this header; in makeStyle laid(material), SHADE_ORDER, makeShadeLay() (makeBackdrop() carries it)
//   and meshShadow(geometry, o). A shadow's material (bladeMaterial, meshShadowMaterial, and the world's dashes and combs
//   through laid()) no longer draws uShade: it leaves in the picture's alpha how much of the ground its shadow leaves, the
//   least where shadows overlap, and the lay draws uShade once by that alpha. Every word in this file that calls a shadow
//   black, hard or razor-edged speaks of what is cast from under PEN.h0 metres by a part PEN.b1 metres broad or more; higher
//   parts and slender parts (penB(), penK(): penumbra by breadth) cast a thinner, softer shade, a part PEN.bz broad or less none.
// THE THIRTEENTH ROUND (world builder). THE DOUBLE SOFTENED TO A FLOOR, at dawn alone: DAWN, dblFade(), dblWave() (G_COMMON, under the
//   define DAWNDBL) and, in makeStyle, opts.dawnDouble, asDouble(material, on), atDraw(mesh), topY(geometry), meshMaterial({ top }), shoreGlsl()
//   (shoreAt(): the backdrop's whole drawing as a function of a ray) and F_TONE (dblTone()): see DAWN below this header.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const PN = 128, PTYPES = 9;                // profile texture: 128 samples along each of nine body types
// ROUND RINGS ON THE TIDE (polish, from live's seventh). THE TIDE: for the eye that skims it a drop falls now and then (one
//   place in every 30 m square of the flat) and sends out three thin rings in the tone and by the limit of a pool's rim;
//   none far off, none near the level line, none from the air. In backdropMaterial() alone (the thirteenth round: in shoreGlsl(), which backdropMaterial() draws); no object, uniform or draw call.
// how much of a body's length is dipped, by type, so that the dipped SURFACE stays under a twentieth of the form (a wide
// crown takes a shallower dip than a point)
// FIX ROUND 9 (world builder). THE TIDE near the eye lies in two flat tones: broad bands along the tide's edge, one every 34 m (for
// the eye that skims it; from the air the two broad tones of the great bars alone), and no pale line is drawn on the water at
// any hour (but, since round rings on the tide, the rings of falling drops). THE NEAR RANK: three capped bodies of the innermost ring (escort: true) that hang near the eye of u 0.94. TAILS:
// iK = 0.3 on the capped bodies and the escort: not ruled, but their shadows go up as tails on the rare tide.
export const DIPK = [0.5, 0.36, 0.7, 0.3, 0.36, 0.36, 0.34, 0.6, 0.6];
const FAN_KEEP = [62, 2.4];               // (polish round) the fan from afar: half its threads at 190 m, two thirds at 130 m, all of them within 75 m
export const SHADOW_LEN = 3;               // a shadow is three times as long as its form is tall
const DEF_PALETTE = ['#1E4854', '#8C86A6', '#F3CDB0', '#EEE6D3', '#060606', '#E8674F', '#35B6B0'];

// ---------- colour: hex -> the linear value that comes out of ACES (exposure 1, neutral grade) as that hex ----------
const IN_M = [0.59719, 0.35458, 0.04823, 0.07600, 0.90834, 0.01566, 0.02840, 0.13383, 0.83777];
const OUT_M = [1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.00605, -0.00327, -0.07276, 1.07602];
const m3 = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
function acesOut(c) {
  const v = m3(IN_M, c.map((x) => Math.max(x, 0) / 0.6));
  const f = v.map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.4329510) + 0.238081));
  return m3(OUT_M, f).map((x) => Math.min(1, Math.max(0, x)));
}
// ink('#hex'): THREE.Color holding the scene-linear value to write so the screen shows that hex.
export function ink(hex) {
  const t = new THREE.Color(hex), target = [t.r, t.g, t.b];
  let x = target.slice();
  for (let i = 0; i < 60; i++) {
    const o = acesOut(x);
    x = x.map((v, k) => Math.min(6, Math.max(0, v + (target[k] - o[k]) * (0.9 + 1.6 * v))));
  }
  return new THREE.Color().setRGB(x[0], x[1], x[2], THREE.LinearSRGBColorSpace);
}

// ---------- the nine bodies: a centreline (cx, cy) in the form's own plane and a radius r, all in units of height ----------
// lobes: a sum of swellings [centre, width, amount, hold]; a held swelling keeps its full girth above its centre, so that
// the round crown of ends() closes it as a dome and not as a cone
const lobes = (t, L) => { let s = 0; for (const [c, w, a, hold] of L) { const d = hold && t > c ? 0 : (t - c) / w; s += a * Math.exp(-d * d); } return s; };
const ends = (t, a, b) => { const k = Math.min(1, (1 - t) / b); return Math.pow(Math.min(1, t / a), 0.8) * Math.sqrt(Math.max(0, k * (2 - k))); };   // needle foot, round crown
function bodySample(type, t) {
  let r = 0.05, cx = 0, cy = t;
  const sp = Math.sin(Math.PI * t), cp = Math.cos(Math.PI * t);
  switch (type) {
    case 0: r = (0.30 * Math.pow(Math.max(sp, 0), 0.72) * (1.12 - 0.34 * t)) * Math.min(1, t / 0.02 + 0.08); break;          // egg, standing on its sharp end
    case 1: r = (0.016 + lobes(t, [[0.895, 0.05, 0.09, 1], [0.30, 0.2, 0.012]])) * ends(t, 0.02, 0.105); break;                     // pin
    case 2: r = (0.006 + lobes(t, [[0.56, 0.24, 0.115]])) * ends(t, 0.01, 0.02); break;                                         // spindle
    case 3: r = (0.03 + lobes(t, [[0.23, 0.13, 0.15], [0.8, 0.15, 0.19, 1]])) * ends(t, 0.03, 0.2); break;                       // hourglass
    case 4: r = (0.035 + lobes(t, [[0.18, 0.1, 0.12], [0.5, 0.11, 0.17], [0.86, 0.09, 0.11, 1]])) * ends(t, 0.03, 0.14);             // knuckle
      cx = 0.07 * Math.sin(TAU * t * 1.02) * t; break;
    case 5: { // hooked bud: a stem that curls over and carries a bud
      r = (0.028 + lobes(t, [[0.22, 0.16, 0.06], [0.89, 0.07, 0.095, 1]])) * ends(t, 0.03, 0.11);
      let x = 0, y = 0; const n = 48, tt = Math.min(t, 1);
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n * tt; const k = Math.max(0, (u - 0.5) / 0.5); const a = 2.7 * k * k * (3 - 2 * k); x += Math.sin(a) * tt / n; y += Math.cos(a) * tt / n; }
      cx = x * 1.22; cy = y * 1.22; break; }
    case 6: r = (0.012 + lobes(t, [[0.29, 0.19, 0.2], [0.84, 0.1, 0.115, 1]])) * ends(t, 0.015, 0.16); break;                       // stacked pair
    case 7: r = (0.012 + 0.07 * sp * sp + lobes(t, [[0.33, 0.1, 0.05]])) * Math.min(1, sp / 0.06 + 0.05);                         // arch on two feet
      cx = -0.34 * cp; cy = Math.pow(Math.max(sp, 0), 0.62); break;
    default: r = (0.01 + 0.026 * sp + lobes(t, [[0.26, 0.085, 0.15], [0.74, 0.085, 0.13]])) * Math.min(1, sp / 0.05 + 0.05);       // dumbbell bridge
      cx = -0.46 * Math.sign(cp) * Math.pow(Math.abs(cp), 0.55); cy = Math.pow(Math.max(sp, 0), 0.5); break;
  }
  return [Math.max(r, 0), cx, cy];
}
// (a generator, so that the world can build the nine profiles a few at a time with a yield between: makeProfilesStepped)
function* profileSteps() {
  const data = new Uint16Array(PN * PTYPES * 4), samples = [];
  for (let ty = 0; ty < PTYPES; ty++) {
    if (ty) yield null;
    const s = new Float32Array(PN * 3);
    for (let i = 0; i < PN; i++) {
      const [r, cx, cy] = bodySample(ty, i / (PN - 1)), o = (ty * PN + i) * 4;
      s[i * 3] = r; s[i * 3 + 1] = cx; s[i * 3 + 2] = cy;
      data[o] = THREE.DataUtils.toHalfFloat(r); data[o + 1] = THREE.DataUtils.toHalfFloat(cx);
      data[o + 2] = THREE.DataUtils.toHalfFloat(cy);
    }
    // alpha: WHERE THE RINGS GO. A table y (0..1, even) -> t along the body, spaced by outline length plus turning, so the
    // rings of a turned body crowd where its outline curves (shoulders, waists, crowns) and a dozen do the work of thirty.
    const M = 224, W = new Float32Array(M + 1); let L = 0, TH = 0; const seg = [];
    let pa = null, pc = null, q0 = bodySample(ty, 0);
    for (let i = 1; i <= M; i++) {
      const q1 = bodySample(ty, i / M), ds = Math.hypot(q1[1] - q0[1], q1[2] - q0[2]), dr = q1[0] - q0[0];
      const ao = Math.atan2(dr, Math.max(ds, 1e-6)), ac = Math.atan2(q1[1] - q0[1], q1[2] - q0[2]);
      let turn = 0; if (pa !== null) { let dcn = Math.abs(ac - pc); if (dcn > Math.PI) dcn = TAU - dcn; turn = Math.min(0.6, Math.abs(ao - pa)) + Math.min(0.6, dcn); }
      seg.push([Math.hypot(ds, dr), turn]); L += Math.hypot(ds, dr); TH += turn; pa = ao; pc = ac; q0 = q1;
    }
    const al = 1.6 * L / Math.max(TH, 1e-3);
    for (let i = 0; i < M; i++) W[i + 1] = W[i] + seg[i][0] + al * seg[i][1];
    for (let j = 0, k = 0; j < PN; j++) {
      const want = (j / (PN - 1)) * W[M]; while (k < M - 1 && W[k + 1] < want) k++;
      const tt = j === PN - 1 ? 1 : (k + (want - W[k]) / Math.max(W[k + 1] - W[k], 1e-9)) / M;
      data[(ty * PN + j) * 4 + 3] = THREE.DataUtils.toHalfFloat(Math.min(1, Math.max(0, tt)));
    }
    samples.push(s);
  }
  const tex = new THREE.DataTexture(data, PN, PTYPES, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  const at = (type, t) => { const s = samples[type], f = Math.min(Math.max(t, 0), 1) * (PN - 1), i = Math.min(PN - 2, Math.floor(f)), k = f - i;
    return [0, 1, 2].map((c) => s[i * 3 + c] * (1 - k) + s[(i + 1) * 3 + c] * k); };
  return { tex, at };
}
function makeProfiles() { const g = profileSteps(); let r = g.next(); while (!r.done) r = g.next(); return r.value; }
// the same, with a yield after each body type: pass the result to makeStyle as opts.profiles
export async function makeProfilesStepped(ctx) { const g = profileSteps(); let r = g.next(); while (!r.done) { await ctx.yield(); r = g.next(); } return r.value; }

// ---------- THE DOUBLE AT DAWN (the thirteenth round: the double softened to a floor) ----------
// At dawn alone (makeStyle({ dawnDouble: true }), which the world passes by the hour it deals; asDouble() then gives a double's
// material the define DAWNDBL; at no other hour is the define set or a line under it compiled) a double is painted by the
// three laws below. It is WRITTEN as at every other hour: solid, in the same order of drawing (MIRROR_ORDER), by the same
// depth test and depth write, with no blend; so its outline against every other double and every real thing is the one it
// has without these laws (but for the ripple). Its colour alone is other.
// THE FADE. x = how deep under the tide the IMAGE of a point of the body truly lies (the height of the body's foot over the
// tide as the body itself is drawn, plus the point's height within the body) over how high the body's top stands over the
// tide (vDb: those two, from the vertex): for a body that stands on the flat, the depth below its foot line over its height.
// One law for every kind: a double drawn shallower or smaller than the true image (a whole double's kept hang and size, uDbl;
// a double drawn back into its foot, sink and dblKeep; the foreshortening from the air) is read by the true figures all the
// same. K(x) = 1 - (1 - DAWN.floor) * s(x / end), s(t) = t*t*(3 - 2t) held at 1 from t = 1 on: 1 at the foot line, never
// rising with the depth, DAWN.floor from x = end on and never under it; end is reckoned from the two typed figures so that K
// is a half at x = DAWN.half (dawnEnd; with the floor at a half, end is DAWN.half itself). The double of a body that has
// risen begins under 1 (its image begins under the tide) and rests wholly on the floor once the body's foot stands end of
// its top's height over the tide; no double is ever left out by this law.
// THE TONE. The double's own colour (its body's inks, as mirrorInk leaves them) is kept by K and the rest, 1 - K, is the
// tide's own tone at that pixel: dblTone() = shoreAt() on the eye's ray through the pixel, the very function the
// backdrop draws (shoreGlsl(): the gradient, the tide's broad tone, its bars, the rings of falling drops, the front, the
// grain), so where K is small a bar or a ring of the tide passes through the double.
// THE RIPPLE. A point of a double drawn d metres under the tide (d as it is drawn: after the foreshortening from the air and
// a whole double's kept hang and size) at world (x, z) is moved level, along world x and z, never up or
// down, by DAWN.reach * s(d / DAWN.full) / sqrt(2) * (sin(2 PI (d / DAWN.l1 - t / DAWN.t1) + .9 x + .5 z),
// sin(2 PI (d / DAWN.l2 + t / DAWN.t2) + .4 x - .8 z + 1.3)) metres: nothing at the foot line, DAWN.reach at the most from
// DAWN.full metres down, periods DAWN.t1 and DAWN.t2 seconds of the world's clock (uTime), the same law for every body.
// None of the three is a NEW law of where on the route the eye is, of a seed's number, of where the lens looks or of the wall's
// clock: the fade reads the body and its rise; the tone is the backdrop's own function of the eye's place and of the ray
// through the pixel (and of the world's time, for the rings; filtered by the pixel's footprint; its grain is by the pixel,
// as the backdrop's), the same whichever way the lens is turned; the ripple reads the place of the point and the world's time.
// The tone reads besides, AS THE BACKDROP READS THEM and through the backdrop's own uniforms, the tide's own state (uTide: the
// front, which live's score moves with the place on the route) and the hour's inks (uRampC, uMirror, uFlat, uIvory; the level
// ink too is set by live's score): so the tone follows the tide's front and the level ink exactly as the tide beside it does.
export const DAWN = { floor: 1 / 3, half: 1 / 3, reach: 0.1, full: 1.5, l1: 3.5, l2: 6, t1: 6, t2: 9.5 };
const dawnF = (x) => x.toFixed(6);
// dawnFloor: DAWN.floor as the shader is given it (to six places, rounded up: never under the typed figure). dawnEnd: the x
// from which K rests on the floor, so that K(DAWN.half) is a half: s(DAWN.half / end) = 1 / (2 (1 - floor)), found by halving
const dawnFloor = Math.ceil(DAWN.floor * 1e6 - 1e-9) / 1e6;
const dawnEnd = (() => { const g = 0.5 / (1 - DAWN.floor); if (!(g < 1)) return DAWN.half;
  let a = 0, b = 1; for (let i = 0; i < 40; i++) { const t = (a + b) / 2; if (t * t * (3 - 2 * t) < g) a = t; else b = t; } return DAWN.half / ((a + b) / 2); })();
// ---------- GLSL shared by every material of the style ----------
const G_COMMON = /* glsl */`
  uniform float uTime, uShadowAz, uModelSkew, uModelView, uModelLean, uLeanAdd, uGroundY, uGlint, uShLen, uPeel, uMirror, uMirrorForm, uUnderWet, uBladeW, uLimb, uUnder, uFlat;
  uniform vec2 uDbl;                        // (fix round 8) a WHOLE double: how much of its body's hang it keeps under the tide, and its size beside its body
  uniform vec2 uTurn;
  uniform vec4 uTide;                       // xy = unit direction the tide travels (world xz), z = how far it has come, w = 0|1 tide exists
  uniform vec3 uRampC[4], uIvory, uDove, uBlack, uShade;
  vec3 hseg(vec3 a, vec3 b, vec3 ma, vec3 mb, float u){ float u2=u*u, u3=u2*u;
    return (2.*u3-3.*u2+1.)*a + (u3-2.*u2+u)*ma + (3.*u2-2.*u3)*b + (u3-u2)*mb; }
  // THE GRADIENT. e = elevation of the view ray in radians (-PI/2 straight down .. +PI/2 zenith). One C1 curve through
  // petrol (-90 deg), smoke violet (-30), opal (0), apricot (+40 and up); nothing happens at e = 0.
  const float RAMP_TOP = .44444;      // the gradient's top stop, as a share of the way from level to the zenith: 40 degrees up. ramp()'s clamp and air() both read it
  vec3 ramp(float e){
    float x = clamp(e/1.5707963, -1., RAMP_TOP);
    vec3 s01=(uRampC[1]-uRampC[0])*1.5, s12=(uRampC[2]-uRampC[1])*3., s23=(uRampC[3]-uRampC[2])*2.25;
    vec3 m1=.5*(s01+s12), m2=.5*(s12+s23);
    if (x < -.33333) return hseg(uRampC[0], uRampC[1], s01*.66667, m1*.66667, (x+1.)*1.5);
    if (x < 0.) return hseg(uRampC[1], uRampC[2], m1*.33333, m2*.33333, (x+.33333)*3.);
    return hseg(uRampC[2], uRampC[3], m2*.44444, vec3(0.), x*2.25);
  }
  // (the fourteenth round) THE AIR IS DEEP WHERE THE BODIES HANG. air(e) = the tone of the air on a ray, as the backdrop's one text
  // (shoreAt) draws it: ramp(e) itself up to the gradient's own top stop (RAMP_TOP: 40 degrees over level, where ramp() reaches its
  // last ink and from where it is flat) and, from that stop to the zenith, ramp's ink mixed toward the hour's own violet
  // (uRampC[1], the ink 30 degrees under level) by z*s(u), u = t*(2 - t), t = how far e has come from the stop to the zenith
  // (0 to 1), s(u) = u*u*(3 - 2u): 0 with no slope at the stop, where ramp() too arrives with no slope (so the tone and its slope
  // are continuous there: the air is palest 40 degrees up and turns over smoothly), z with no slope at the zenith, never falling
  // between; half of z at 54.6 degrees, nine tenths at 67.9.
  // z, THE ZENITH'S SHARE, comes from the hour's inks by one rule: the share of the violet that brings the top ink's light
  // (.3 r + .6 g + .1 b of the ink as it is written, the weights of mirrorInk and stepTo) down to .42; a top ink whose light is
  // already under .42 keeps it, z = 0. By the world's four hours, in L as the screen
  // shows the inks: dawn z .56, the zenith 73.0 (ivory 93.5, dove 56.5); day .68, 75.7 (95.1, 55.6); the golden hour .73, 73.8
  // (93.1, 54.1): 19 to 20.5 under the hour's ivory, within 2 of midway between its ivory and its dove; night z 0 (its top ink's
  // light is .14), so there air(e) is ramp(e) to the last bit.
  // THE START IS THE GRADIENT'S TOP STOP (the fourteenth round b; it was a typed 48.2 degrees): that stop is a thing of the world,
  // the place from which the air was one flat ink, and from there it deepens. air() reads the stop from the constant that
  // ramp()'s clamp reads, so the two cannot part.
  // ramp() draws as it drew, flat from 40 degrees up (its clamp reads RAMP_TOP, the figure it held typed): besides the backdrop's
  // air it is read by the tide's film (the air a quarter as high, so never over 22.5 degrees), by the ground under level and by
  // every body's underside (ramp of 60 degrees up, in shadeForm), and this law moves none of them.
  vec3 air(float e){
    float y3 = dot(uRampC[3], vec3(.3, .6, .1)), y1 = dot(uRampC[1], vec3(.3, .6, .1));
    float z = clamp((y3-.42)/max(y3-y1, 1e-4), 0., 1.), t = clamp((e/1.5707963-RAMP_TOP)/(1.-RAMP_TOP), 0., 1.), u = t*(2.-t);
    return mix(ramp(e), uRampC[1], z*u*u*(3.-2.*u));
  }
  float elevOf(vec3 d){ return asin(clamp(d.y/max(length(d),1e-4), -1., 1.)); }
  // 1 where the mirror tide has arrived at ground point xz, 0 ahead of the front (a few centimetres of soft edge)
  float tideWet(vec2 xz){ return uTide.w*(1.-smoothstep(-.06, .06, dot(xz, uTide.xy)-uTide.z)); }
  // THE TIDAL FLAT (ground round). The flat is a real surface: bars of drying sand lying along the tide's edge with sheets
  // and pools of standing water between them. flatH(xz, fd) = height of the sand over the water there, in its own units
  // (above 0 sand, below 0 water); fd = how much of each of its three scales can be drawn at that distance (1,1,1 near).
  const vec2 FQ0 = vec2(.0028, .0083), FQ1 = vec2(.015, .045), FQ2 = vec2(.05, .14);      // three scales of bar: 360 by 120 m, 66 by 22, 20 by 7
  float fhash(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
  float fnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(fhash(i), fhash(i+vec2(1., 0.)), f.x), mix(fhash(i+vec2(0., 1.)), fhash(i+vec2(1., 1.)), f.x), f.y); }
  vec2 shoreQ(vec2 xz){ return vec2(dot(xz, vec2(uTide.y, -uTide.x)), dot(xz, uTide.xy)); }      // (along the tide's edge, the way it travels)
  float flatH(vec2 xz, vec3 fd){ vec2 q = shoreQ(xz);
    return .4*fd.x*(fnoise(q*FQ0+3.7)-.5) + .85*fd.y*(fnoise(q*FQ1+11.3)-.5) + .5*fd.z*(fnoise(q*FQ2+5.1)-.5) + .03; }
  // 1 where a double can be seen at ground point xz: where the tide has come, and before it in every pool of the flat
  // (fix round 8) before the tide the flat is the gradient's own deep ground (uFlat under a half): no pool, so no double
  float wetAt(vec2 xz){ return max(tideWet(xz), step(flatH(xz, vec3(1.)), -.03)*step(.5, uFlat)); }
  // A DOUBLE SEEN FROM THE AIR is drawn short (wet sand shows a body's double foreshortened): full height from the flat,
  // a fifth of it from 34 m up, so the hung colony and the mother are doubled inside the picture under themselves
  // (fix round 7) two fifths, not a fifth: at a fifth a double was a squashed patch. And from the air ONLY THE GREAT ARE DOUBLED:
  // dblKeep(H) = how much of the double of a body H tall is drawn (under 12 m it draws back into its foot as the eye rises),
  // so the mirror seen from 40 m holds the mother, her largest and the giants upside down and no debris
  // (fix round 8) WHOLE: the double of a body that hangs over the tide is drawn whole and in its true proportions at any height
  // of the eye (never squashed, never left out), hung under the tide a part (uDbl.x) as deep as its body hangs over it and
  // drawn uDbl.y the size of its body (so the double of a riser beside the eye still stands whole inside the picture)
  #ifdef WHOLE
    float dblK(){ return 1.; }
    float dblKeep(float H){ return 1.; }
  #else
    float dblK(){ return mix(1., .42, smoothstep(10., 34., cameraPosition.y-uGroundY)); }
    float dblKeep(float H){ return 1.-smoothstep(13., 27., cameraPosition.y-uGroundY)*(1.-smoothstep(10.5, 13., H)); }
  #endif
  // THE MIRROR. How bright the tide shows the gradient at view elevation e (e < 0 looking down): at level it IS the air
  // (so ground and air still meet with nothing to see), and it falls to uMirror looking down (night: oil)
  float mirrorK(float e){ return mix(1., uMirror, smoothstep(0., .5, -e)); }
  // a double in the tide: the form's own modelling greyed toward dove (m = uMirrorForm; 1 = a perfect mirror)
  vec3 mirrorInk(vec3 col, float m){ vec3 lw = vec3(.3, .6, .1);
    float rel = clamp(dot(col, lw)/max(dot(uIvory, lw), 1e-4), 0., 1.);
    return mix(uDove*(.62+.38*rel), col, smoothstep(.5, .9, m)); }
  #ifdef DAWNDBL
    // (the thirteenth round, see DAWN) dblFade(x) = K: how much of a double's own colour is left at x = the image's true depth
    // under the tide over the height of the body's top over the tide; dblWave(w): the level offset in metres of a point of a
    // double drawn at world w
    float dblFade(float x){ float s = smoothstep(0., ${dawnF(dawnEnd)}, x); return (1.-s)+${dawnF(dawnFloor)}*s; }
    vec2 dblWave(vec3 w){ float d = max(uGroundY-w.y, 0.);
      return ${dawnF(DAWN.reach * Math.SQRT1_2)}*smoothstep(0., ${dawnF(DAWN.full)}, d)*vec2(sin(6.28319*(d/${dawnF(DAWN.l1)}-uTime/${dawnF(DAWN.t1)})+.9*w.x+.5*w.z),
        sin(6.28319*(d/${dawnF(DAWN.l2)}+uTime/${dawnF(DAWN.t2)})+.4*w.x-.8*w.z+1.3)); }
  #endif
  float shadowAz(){ return uShadowAz + .07*sin(uTime*.45); }              // the needles drift 4 degrees to and fro on their own
  vec2 shadowDir(){ float a = shadowAz(); return vec2(sin(a), cos(a)); }   // world xz direction every shadow points
`;
// ---------- THE SHADE BY HEIGHT (round penumbra by height) ----------
// One law for every shadow on the flat. h = the height in metres above the flat of the part that casts a point of a shadow:
// the height its own shader multiplies by uShLen to lay that point (a body's shadow is laid as if it stood on the flat, so a
// body that has risen, and the mother, whose shadow is laid from her tip, cast by their own heights). With x = how far h has
// come from PEN.h0 to PEN.hc, 0 to 1 (PEN.hc: the arch's crown, the highest point of any giant, measured 76.2 m), and
// s(t) = t*t*(3 - 2t): penD(h) = how deep the hour's shade is laid at that point = 1 - (1 - PEN.dc) * s(x to the power PEN.p):
// 1 up to PEN.h0, PEN.dc from PEN.hc up, falling all the way between. It is the weight uShade is mixed with over what lies
// there, in the picture's own linear light. penE(h) = how broad the soft edge is there, in metres on the flat = PEN.w * s(x):
// nothing up to PEN.h0, PEN.w from PEN.hc up. By the height alone a point d metres inside the outline is left all of the
// ground on the outline and 1 - penD of it from the soft edge's breadth in (the edge never broader than cap).
// PENUMBRA BY BREADTH (the second term of the same law). b = the breadth in metres of the part that casts the point, as the
// body is built: for a blade or a far dash twice the lathe profile's radius at the station that casts it, times the
// body's fatness and height (its instance attributes; the profile at rest, not as it breathes; a dash reads it in its
// fragment, a blade at its vertex); for a comb's tooth its hair, twice sC.w times the hair's length; for a flattened mesh
// 2 over the sum of the surface's two curvatures at the vertex (shadeCurv's aS0), which is a round limb's breadth
// (measured on the giants' low meshes: the arch's feet 0.22 m against 0.22, the eye's pin 0.03-1.27 m against the same,
// the horn's foot 0.26 against 0.23; on their swellings it is off by up to three times, where both are many metres).
// penB(b) = how much of penD a part of that breadth lays: nothing up to PEN.bz, PEN.bd at PEN.b0, 1 from PEN.b1 up, s()
// over each of the two stretches (level where they meet: one curve, never rising as b falls). A garden's hair, 0.024 m,
// a point and a pin under PEN.bz lay nothing.
// penK(b) = how slender it is, 1 up to PEN.b0, 0 from PEN.b1: the soft edge is at least penK times the shadow's own half
// breadth on the flat there (hb), and may be as broad as that. penLeft(h, b, d, hb, cap) = how much of the ground is
// left = 1 - penD(h) * penB(b) * (how far through its soft edge the point d metres inside the outline lies). These read
// h, b and the place in the shadow's own outline, and nothing else.
export const PEN = { h0: 6, hc: 76, dc: 0.44, p: 0.55, w: 5, b0: 0.34, b1: 1, bd: 0.5, bz: 0.05 };
const penF = (x) => x.toFixed(4);
const G_PEN = /* glsl */`
  float penX(float h){ return clamp((h-${penF(PEN.h0)})/${penF(PEN.hc - PEN.h0)}, 0., 1.); }
  float penD(float h){ float x = pow(penX(h), ${penF(PEN.p)}); return 1.-${penF(1 - PEN.dc)}*x*x*(3.-2.*x); }
  float penE(float h){ float x = penX(h); return ${penF(PEN.w)}*x*x*(3.-2.*x); }
  float penB(float b){ float t = clamp((b-${penF(PEN.b0)})/${penF(PEN.b1 - PEN.b0)}, 0., 1.), u = clamp((b-${penF(PEN.bz)})/${penF(PEN.b0 - PEN.bz)}, 0., 1.);
    return ${penF(PEN.bd)}*u*u*(3.-2.*u)+${penF(1 - PEN.bd)}*t*t*(3.-2.*t); }
  float penK(float b){ return min((1.-penB(b))/${penF(1 - PEN.bd)}, 1.); }
  float penLeft(float h, float b, float d, float hb, float cap){ float k = penK(b);
    return 1.-penD(h)*penB(b)*smoothstep(0., max(min(max(penE(h), k*hb), mix(cap, hb, k)), 1e-4), d); }
`;
// shadeCurv(geometry): gives a smooth indexed mesh (position, normal) the two attributes the soft edge of its shadow reads:
// aS0 = (Sxx, Syy, Szz) and aS1 = (Sxy, Syz, Szx) of S, the symmetric matrix that turns a step along the surface into the
// change of the normal over that step (the surface's curvature in every direction), fitted at each vertex by least squares
// over the vertices it shares a triangle with; vertices standing at one place (a pole, a seam) share their neighbours.
// Where no fit can be made S is 0.
export function shadeCurv(g) {
  if (g.getAttribute('aS0')) return g;
  const P = g.getAttribute('position').array, N = g.getAttribute('normal').array, I = g.index.array, n = P.length / 3;
  const id = new Int32Array(n), at = new Map(), nb = new Array(n);
  for (let i = 0; i < n; i++) { const k = Math.round(P[i * 3] * 1e3) + ',' + Math.round(P[i * 3 + 1] * 1e3) + ',' + Math.round(P[i * 3 + 2] * 1e3); if (!at.has(k)) at.set(k, i); id[i] = at.get(k); }
  const link = (a, b) => { if (id[a] !== id[b]) (nb[id[a]] || (nb[id[a]] = new Set())).add(b); };
  for (let t = 0; t < I.length; t += 3) for (let e = 0; e < 3; e++) { link(I[t + e], I[t + (e + 1) % 3]); link(I[t + (e + 1) % 3], I[t + e]); }
  const S0 = new Float32Array(n * 3), S1 = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const set = nb[id[i]]; if (!set) continue;
    const nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2];
    let ux = Math.abs(ny) < 0.9 ? -nz : 0, uy = Math.abs(ny) < 0.9 ? 0 : nz, uz = Math.abs(ny) < 0.9 ? nx : -ny; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux;
    let m00 = 0, m01 = 0, m11 = 0, m12 = 0, m22 = 0, y0 = 0, y1 = 0, y2 = 0;
    for (const j of set) {
      const px = P[j * 3] - P[i * 3], py = P[j * 3 + 1] - P[i * 3 + 1], pz = P[j * 3 + 2] - P[i * 3 + 2], du = px * ux + py * uy + pz * uz, dv = px * vx + py * vy + pz * vz, l2 = du * du + dv * dv;
      if (l2 < 1e-10) continue;
      const qx = N[j * 3] - nx, qy = N[j * 3 + 1] - ny, qz = N[j * 3 + 2] - nz, a = qx * ux + qy * uy + qz * uz, b = qx * vx + qy * vy + qz * vz, w = 1 / l2;
      m00 += w * du * du; m01 += w * du * dv; m11 += w * l2; m12 += w * du * dv; m22 += w * dv * dv; y0 += w * du * a; y1 += w * (dv * a + du * b); y2 += w * dv * b;
    }
    const det = m00 * (m11 * m22 - m12 * m12) - m01 * m01 * m22; if (!(det > 1e-4)) continue;
    const sa = (y0 * (m11 * m22 - m12 * m12) - m01 * (y1 * m22 - m12 * y2)) / det, sb = (m00 * (y1 * m22 - m12 * y2) - y0 * m01 * m22) / det, sc = (m00 * (m11 * y2 - m12 * y1) - m01 * (m01 * y2) + y0 * m01 * m12) / det;
    S0[i * 3] = sa * ux * ux + 2 * sb * ux * vx + sc * vx * vx; S0[i * 3 + 1] = sa * uy * uy + 2 * sb * uy * vy + sc * vy * vy; S0[i * 3 + 2] = sa * uz * uz + 2 * sb * uz * vz + sc * vz * vz;
    S1[i * 3] = sa * ux * uy + sb * (ux * vy + uy * vx) + sc * vx * vy; S1[i * 3 + 1] = sa * uy * uz + sb * (uy * vz + uz * vy) + sc * vy * vz; S1[i * 3 + 2] = sa * uz * ux + sb * (uz * vx + ux * vz) + sc * vz * vx;
  }
  g.setAttribute('aS0', new THREE.BufferAttribute(S0, 3)); g.setAttribute('aS1', new THREE.BufferAttribute(S1, 3)); return g;
}
const G_RISE = /* glsl */`
  uniform float uProg;
  // rise: rp = (release, hang, phase). Returns the offset of a body that has let go of the ground: up, with a kite's sway.
  vec3 riseOff(vec3 rp){
    float k = clamp((uProg-rp.x)/(.2+.0022*rp.y), 0., 1.); k = k*k*(3.-2.*k);
    float a = k*(.5+.012*rp.y);
    return vec3(a*sin(uTime*.43+rp.z*6.), rp.y*k + a*.35*sin(uTime*.61+rp.z*9.), a*cos(uTime*.34+rp.z*4.));
  }
`;
// the lathe: position and analytic normal of body (type, t along the centreline, angle th round it)
const G_LATHE = G_RISE + /* glsl */`
  uniform sampler2D uProf;
  attribute vec4 iA;   // foot x y z (local), height H
  attribute vec4 iB;   // yaw, body type 0..8, fatness, accent index 0..2
  attribute vec4 iC;   // release (0..1 of progress), hang height, phase, dip (fraction of the body from the tip that is dipped)
  attribute vec3 iD;   // sway inherited from the body it stands on: x, z amplitude (m) and that body's phase
  #ifdef BUD
    // BUDDING. A bud swells out of its parent's flank, slides off as a small egg, stands beside the parent, and sinks
    // back into the flat as the next one starts. iA.xyz = where it will stand; iE.xyz = from there back to the place on
    // the flank where it swells; iE.w = where in its cycle it is at time 0.
    attribute vec4 iE;
    float budCyc(){ return fract(uTime*(.075+.03*iC.z)+iE.w); }
  #endif
  #ifdef DAWNDBL
    vec2 lDb;      // (the thirteenth round) lathe() leaves here, over its group's own ground: how high the point's true image stands (the body's own foot, with all of its rise, and the point's height in a body of its own size) and how high the body's top
  #endif
  float ringT(float ty, float y){ return textureLod(uProf, vec2((clamp(y,0.,1.)*${PN - 1}.+.5)/${PN}., (ty+.5)/${PTYPES}.), 0.).w; }
  vec3 prof(float ty, float t){ return textureLod(uProf, vec2((clamp(t,0.,1.)*${PN - 1}.+.5)/${PN}., (ty+.5)/${PTYPES}.), 0.).xyz; }
  // medium: mercury. Radius multiplier (travelling bulges, breathing waists) and centreline sag for the tall ones.
  float bulge(float t, float ph, float H){
    float e = sin(3.14159*clamp(t,0.,1.));
    return 1. + e*(.17*sin(t*9.-uTime*.8+ph*20.) + .10*sin(t*3.5+uTime*.47+ph*11.));
  }
  vec3 centre(float ty, float t, float ph, float H){
    vec3 p = prof(ty, t);
    p.y += t*t*(.03+.02*smoothstep(4.,25.,H))*sin(uTime*.31+ph*14.);
    p.x *= bulge(t, ph, H);
    float nk = (t-.5)/.15;                         // the dumbbell bridge necks down almost to parting, then thickens until two are one
    p.x *= 1. + step(7.5, ty)*exp(-nk*nk)*(.9+1.5*sin(uTime*.27+ph*31.));
    return p;
  }
  vec3 yawed(vec3 v, float a){ float c=cos(a), s=sin(a); return vec3(c*v.x+s*v.z, v.y, -s*v.x+c*v.z); }
  // THE TURNING. a01 = 0..1 round the body, t along it. The ring is not divided evenly: for every ring the two points where
  // the surface turns away from the eye (n.(P-eye) = 0, solved exactly, perspective included) are found, and vertices are
  // put ON them: three quarters of the ring's vertices span the arc that faces the eye, one quarter the arc that does not.
  // So the outline of every body is its true turned outline at every ring whatever the number of sides: no facet.
  void lathe(float a01, float t, out vec3 pos, out vec3 nor){
    float ty=iB.y, ph=iC.z, H=iA.w, d=1./${PN - 1}.;
    vec3 budOff = vec3(0.);
    #ifdef MIRROR
      H *= max(dblKeep(iA.w), 1e-3);
      #ifdef WHOLE
        H *= uDbl.y;
      #endif
      #ifdef SINK
        // (fix round 7) A DOUBLE LETS GO WITH ITS BODY: as a body of the field rises its double draws back into the place it
        // stood (a risen body beside the eye left its double at the bottom of the frame, a grey thing with no owner above it)
        { float kr = clamp((uProg-iC.x)/(.2+.0022*iC.y), 0., 1.); H *= max(1.-smoothstep(.08, .5, kr)*step(.5, iC.y), 1e-3); }
      #endif
    #endif
    #ifdef DAWNDBL
      float dSz = H/max(iA.w, 1e-4);      // how much smaller than its body the double is drawn (dblKeep, uDbl.y, sink)
    #endif
    #ifdef BUD
      float cy = budCyc(), sl = smoothstep(.3, .6, cy);
      H *= max(smoothstep(0., .3, cy)*(1.-smoothstep(.93, 1., cy)), 1e-3);
      budOff = iE.xyz*vec3(1.-sl, 1.-sl*sl, 1.-sl);
      budOff.y += iA.w*.12*sin(3.14159*smoothstep(.6, .74, cy))*(1.-smoothstep(.6, .74, cy));   // it lands, dips and stands up
    #endif
    vec3 p=centre(ty,t,ph,H), a=centre(ty,t-d,ph,H), b=centre(ty,t+d,ph,H);
    vec2 dc=b.yz-a.yz; float dl=max(length(dc),1e-4); vec2 T=dc/dl, N=vec2(T.y,-T.x);
    float drds=(b.x-a.x)*iB.z/dl, r=p.x*iB.z;
    vec3 rise=riseOff(iC.xyw*vec3(1.,1.,0.)+vec3(0.,0.,ph));
    #ifdef DAWNDBL
      float dRise = rise.y;      // the body's own rise, before a whole double keeps a part of it
    #endif
    #ifdef WHOLE
      rise.y *= uDbl.x;
    #endif
    vec3 off=iA.xyz+budOff+vec3(iD.x,0.,iD.y)*sin(uTime*.31+iD.z*14.)+rise;
    vec3 eye=cameraPosition;
    #ifdef MIRROR
      eye.y = uGroundY-(eye.y-uGroundY)/dblK();
    #endif
    eye = (eye-modelMatrix[3].xyz)*mat3(modelMatrix);              // into the group's frame (yaw and translation only)
    vec3 vb = yawed(off-eye, -iB.x)+vec3(p.y, p.z, 0.)*H;           // eye -> ring centre, in the body's own frame
    float A=dot(N, vb.xy), B=vb.z, R=max(length(vec2(A, B)), 1e-4);
    float phi = R > 2e-4 ? atan(B, A) : 0.;
    float dlt = acos(clamp((drds*dot(T, vb.xy)-r*H)/R, -1., 1.));
    float th = a01 < .7501 ? phi+dlt+(a01/.75)*(6.2831853-2.*dlt) : phi-dlt+(a01-.75)*8.*dlt;
    float c=cos(th), s=sin(th);
    vec3 P=vec3(p.y+r*c*N.x, p.z+r*c*N.y, r*s)*H;
    vec3 n=vec3(c*N.x-drds*T.x, c*N.y-drds*T.y, s);
    pos=off+yawed(P,iB.x);
    #ifdef DAWNDBL
      { float ft = off.y+dRise-rise.y; lDb = vec2(ft+P.y/dSz, ft+H/dSz); }
    #endif
    nor=yawed(n/max(length(n),1e-4), iB.x);
  }
`;
// one soft gradient, a dipped tip, one pinpoint: the whole of the modelling. n = world normal, w = world position.
const G_SHADE = /* glsl */`
  vec3 shadeForm(vec3 n, vec3 w, vec3 cam, float tip, float dipAt, vec3 accent){
    float az = shadowAz() + 3.14159 + uModelSkew;       // the modelling light disagrees with the shadows on purpose
    vec3 L = vec3(sin(az)*.9487, .3162, cos(az)*.9487);
    vec3 V = cam - w; V /= max(length(V), 1e-4);
    // THE PAINTER'S LIGHT (uModelView = 1): every body is lit from the right of the eye that looks at it, a little toward
    // the eye (uModelLean), so the turn of every form reads the same wherever it stands in the picture: clear light
    // with no source. uModelView = 0 is one light in the world at az.
    vec2 vh = V.xz; float vl = length(vh); vh = vl > 1e-3 ? vh/vl : vec2(0., -1.);
    float ln = uModelLean + uLeanAdd + .07*sin(uTime*.45), cl = cos(ln), sl = sin(ln);      // (uLeanAdd: a great body may have the light come round toward the eye, meshMaterial({ lean }))
    vec3 Lv = vec3((vh.y*cl+vh.x*sl)*.9487, .3162, (-vh.x*cl+vh.y*sl)*.9487);
    L = mix(L, Lv, uModelView); L /= max(length(L), 1e-4);
    // THE TURN OF A LATHED BONE: ivory on the lit flank, one smooth slide across the middle of the body, dove grey over the
    // far third; the terminator lies well inside the outline so every body shows both inks whatever its size
    // (the slide is drawn for the eye, not for the light meter: ivory is five times dove in light, so the mix is bent
    // until the middle of the slide is the middle grey between the two inks on the screen)
    // (fix round 3) uTurn = where the slide begins and ends (the pale hours turn sooner, so a full third of every body is
    // dove); uLimb: where a body is not in the light its outline turns away a step darker, so the contour of a pale body
    // can be followed the whole way round against pale air
    float k = smoothstep(uTurn.x, uTurn.y, dot(n, L)+.1*n.y);
    vec3 col = mix(uDove, uIvory, k*k*sqrt(k));
    float rim = 1.-abs(dot(n, V));
    col = mix(col, uDove*.9, uLimb*smoothstep(.45, 1., rim)*(1.-k*k));
    // the underside of every swelling: a step darker, with the colour of the flat (or of the tide) beneath it
    float under = 1.-smoothstep(-.8, .05, n.y);
    // (fix round 3) once the tide is in, the mirror below is as pale as the air: an underside that took a third of it melted
    // into the air when seen from below (the whole last climb), so then it takes only uUnder of it and stays a step darker
    col = mix(col, mix(ramp(-1.0472), ramp(1.0472)*mix(1., uMirror, .6), uUnderWet), mix(.34, uUnder, uUnderWet)*under)*(1.-.1*under);
    float aa = fwidth(tip)+1e-5;
    col = mix(col, accent*(.62+.38*k), smoothstep(-aa, aa, tip-dipAt));
    vec3 Hh = L+V; Hh /= max(length(Hh), 1e-4);
    float g = max(dot(n, Hh), 0.); g *= g; g *= g; g *= g; g *= g;        // ^16
    return col + uGlint*pow(g, 100.);
  }
`;

// ---------- THE RULED MIRROR (fix round 2) ----------
// Seen from the air the flat is drawn, not recorded: of all the needles lying on it only a few dozen are drawn, chosen so
// that on the screen of the approach (an eye 46 m up at z 275, looking down the course) each is a long bar and no two lie
// within `gap` pixels of one another, with the mirror showing between every pair. makeRuler({ az, len, cam, gap }) keeps
// the ones accepted so far; tryNeedle(x, z, H, { minLen, far }) asks for the needle of a body H tall standing at world x, z
// (shadows pointing along az, len heights long) and answers whether it is one of the drawn (bladeMaterial({ pick }), iK).
export function makeRuler(o = {}) {
  const az = o.az ?? 1.2, len = o.len ?? 3, cam = o.cam || [0, 46, 275], F = 374, gap = o.gap ?? 6.5, dx = Math.sin(az), dz = Math.cos(az), kept = [];
  const scr = (x, z) => { const d = Math.max(z - cam[2], 20); return [-x * F / d, cam[1] * F / d]; };      // pixels right of centre, pixels below level
  const segD = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], t = Math.min(1, Math.max(0, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / Math.max(vx * vx + vy * vy, 1e-6)));
    return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vy * t); };
  const near = (A, B, g) => { for (const p of A) for (let j = 0; j < B.length - 1; j++) if (segD(p, B[j], B[j + 1]) < g) return true; return false; };
  function line(x, z, L) { const pts = []; for (let i = 0; i <= 8; i++) { const s = i / 8, pz = z + dz * L * s; if (pz - cam[2] < 55) return null; pts.push(scr(x + dx * L * s, pz)); } return pts; }
  function tryNeedle(x, z, H, q = {}) {
    const pts = line(x, z, len * H); if (!pts) return false;
    if (Math.hypot(pts[8][0] - pts[0][0], pts[8][1] - pts[0][1]) < (q.minLen ?? o.minLen ?? 105)) return false;
    if (pts[0][1] < (q.far ?? 26) || pts[0][1] > 175 || Math.abs(pts[0][0]) > 385) return false;                    // its foot: from the bottom of the frame up to near level
    let inside = 0; for (const p of pts) if (Math.abs(p[0]) < 395 && p[1] < 150) inside++;
    if (inside < 5) return false;
    // (fix round 3) the needles are bold silhouettes now, widest near the eye: the clear mirror asked between two of them
    // grows from `gap` near level to gap + 15 px at the bottom of the frame
    const g = gap + (o.gapNear ?? 0.1) * pts[0][1];
    for (const k of kept) if (near(pts, k.pts, Math.max(g, k.gap)) || near(k.pts, pts, Math.max(g, k.gap))) return false;
    kept.push({ pts, gap: g }); return true;
  }
  // block(x, z, L, g): something else black lies there (the mother's shadow); needles keep g pixels away from it
  function block(x, z, L, g) { const pts = line(x, z, L); if (pts) kept.push({ pts, gap: g }); }
  return { tryNeedle, block, get count() { return kept.length; }, az, len, cam };
}

// ---------- makeStyle: palette, shared uniforms, material factories, geometry helpers ----------
export function makeStyle(ctx, opts = {}) {
  const hex = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEF_PALETTE;
  const palette = {
    petrol: ink(hex[0]), violet: ink(hex[1]), opal: ink(hex[7] || '#DCD9D6'), apricot: ink(hex[2]),
    ivory: ink(hex[3]), dove: ink(hex[8] || '#9FA3A8'), black: ink(hex[4]),
    coral: ink(hex[5]), lemon: ink(hex[9] || '#EEDB5C'), turquoise: ink(hex[6]),
  };
  const prof = opts.profiles || makeProfiles();
  const rmaxOf = (P) => { const o = []; for (let ty = 0; ty < PTYPES; ty++) { let m = 0; for (let i = 0; i <= 80; i++) m = Math.max(m, P.at(ty, i / 80)[0]); o.push(m * 1.2); } return o; };   // (1.2: the mercury bulge)
  const uniforms = {
    uTime: { value: 0 },
    uShadowAz: { value: opts.shadowAz ?? 2.1 },   // radians; shadows point along world (sin a, 0, cos a). THE WORLD DRIVES THIS.
    uModelSkew: { value: 0.55 },                  // how far the modelling light disagrees with the shadows (radians)
    uModelView: { value: 1 },                     // 1 = the painter's light (from the right of the eye, for every body), 0 = one light at uModelSkew
    uModelLean: { value: 0.1 },                   // how far the painter's light leans toward the eye from side-on (radians)
    uLeanAdd: { value: 0 },                       // (fix round 7) and how much further for one material (meshMaterial({ lean }) gives it its own)
    uGroundY: { value: 0 },                       // world height of the flat (mirror plane, where blades lie)
    uGlint: { value: 7 },
    uShLen: { value: opts.shadowLen ?? SHADOW_LEN },   // a shadow is this many times as long as its form is tall
    uMirror: { value: opts.mirror ?? 0.94 },        // how bright the tide shows the gradient upside down (night: black as oil)
    uMirrorForm: { value: opts.mirrorForm ?? 0.94 }, // and how bright it shows the doubles of the forms
    uTurn: { value: new THREE.Vector2(opts.turn?.[0] ?? -0.6, opts.turn?.[1] ?? 0.4) },   // (fix round 3) the slide from dove to ivory, in n.L
    uLimb: { value: opts.limb ?? 0 },               // how far the unlit outline of a body turns toward dove
    uUnder: { value: opts.under ?? 0.34 },          // how much of the mirror's colour an underside takes once the tide is in
    uUnderWet: { value: 0 },                      // 0 = undersides take the petrol of the flat, 1 = the mirror tide is under them
    uFlat: { value: opts.flat ?? 0.1 },               // (fix round 8) how much of the wet tidal flat is drawn on the ground before the tide: 1 = bars, pools and rims, 0 = the gradient alone
    uDbl: { value: new THREE.Vector2(0.3, 1) },      // (fix round 8) a WHOLE double: (hang kept, size); formMaterial({ whole: [hang, size] }) gives a material its own
    uBladeW: { value: opts.bladeWidth ?? 0.6 },      // a shadow is a needle: this much of its form's girth
    uAirKeep: { value: opts.airKeep ?? 6.5 },       // seen from the air, only the needles of bodies this tall (m) and over are drawn
    uAirSlim: { value: opts.airSlim ?? 0.8 },      // and they are this much slimmer
    uAirPx: { value: opts.airPx ?? 5.5 },   // a ruled needle seen from the air is this many pixels a side at its widest, in the nearest row
    uAirBold: { value: opts.airBold ?? 1.7 },       // FIX ROUND 3: seen from the air a ruled needle is this many times its girth (a true silhouette, bold)
    uRmax: { value: rmaxOf(prof) },                 // widest radius of each body type, in heights          // FIX ROUND 2: a ruled needle seen from the air is this many pixels across at its foot
    uPeel: { value: 0 },                          // the rare event: 0 = shadows lie on the flat, 1 = all drawn up after their forms                         // the pinpoint: the only value above the bloom threshold
    uTide: { value: new THREE.Vector4(0, -1, -1e6, 0) },   // (dirX, dirZ, distance travelled, exists 0|1)
    uProg: { value: 0 },                          // default rising progress for forms whose material is given no other
    uRampC: { value: [palette.petrol, palette.violet, palette.opal, palette.apricot] },
    uIvory: { value: palette.ivory }, uDove: { value: palette.dove }, uBlack: { value: palette.black },
    uShade: { value: opts.shade ? ink(opts.shade) : palette.black },   // (journey round) the deep colour of the hour every shadow on the flat is laid in
    uAccent: { value: [palette.coral, palette.lemon, palette.turquoise] },
    uProf: { value: prof.tex },
    uPix: { value: new THREE.Vector2(0.0025, 450) },   // (view-space size of one pixel at depth 1, drawing-buffer height)
  };
  const U = (extra) => Object.assign({}, uniforms, extra);   // shares the uniform objects, so one update drives every material
  // (round penumbra by height) HOW A SHADOW IS LAID. laid(material): a shadow's material draws no colour. It writes to the
  // picture's alpha what its shadow leaves of the ground there (penLeft) and keeps the least where shadows lie over one another
  // (the MIN blend equation; the colour is left as it is), so the deeper shadow wins and none is added to another. It is
  // drawn after every body (transparent, order SHADE_ORDER, the depth test on, no depth written), in one pass though it
  // is two-sided. makeShadeLay(): one triangle over the whole picture, drawn once after all the shadows (SHADE_ORDER + 0.1,
  // before the threads), which lays uShade over the picture by one minus that alpha and sets the alpha back to 1. Where no
  // shadow lies the alpha is 1 as every other material writes it, and nothing is laid. makeBackdrop() carries it.
  const SHADE_ORDER = -0.3;
  const laid = (m) => Object.assign(m, { transparent: true, depthWrite: false, forceSinglePass: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.MinEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor, userData: { shade: 1 } });
  function makeShadeLay() {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U({}), side: THREE.DoubleSide, transparent: true, forceSinglePass: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstAlphaFactor, blendDst: THREE.DstAlphaFactor, blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.ZeroFactor,
      vertexShader: /* glsl */`void main(){ gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: /* glsl */`precision highp float; uniform vec3 uShade; void main(){ gl_FragColor = vec4(uShade, 1.); }` }));
    m.frustumCulled = false; m.renderOrder = SHADE_ORDER + 0.1; return m;
  }
  // (the thirteenth round, see DAWN) asDouble(material, on): at dawn a double's material is given the define DAWNDBL and the
  // uniform uDblView (one object for all of them) and nothing else: its blending, depth test, depth write, side and order
  // of drawing stay as they came. At every other hour, and for what is no double, the material is returned as it came.
  // atDraw(mesh): the mesh of such a material is given an onBeforeRender (seeView) that, at each draw of it, reads the
  // rectangle the renderer is then drawing into (renderer.getCurrentViewport: the viewport of the very target, in drawn
  // pixels, as three last gave it to GL; cut toward zero to whole pixels, as GL takes it) into uDblView and tells the
  // material to send its uniforms again: the screen's picture and a portal's are two draws and may be two sizes. instanced()
  // calls it; a double built as a plain mesh (the mother's, a giant's) is passed through it by its builder. At every other
  // hour, and for what is no double, the mesh is returned as it came. topY(geometry): the highest y of a mesh, for
  // meshMaterial({ mirror, top }) (read at dawn alone; 0 at the other hours, where nothing reads it).
  const dawnDbl = !!opts.dawnDouble, dblView = { value: new THREE.Vector4(0, 0, 1, 1) };
  const asDouble = (m, on) => { if (dawnDbl && on) { m.defines.DAWNDBL = 1; m.uniforms.uDblView = dblView; } return m; };
  function seeView(renderer, scene, camera, geometry, material) { renderer.getCurrentViewport(dblView.value).roundToZero(); material.uniformsNeedUpdate = true; }
  const atDraw = (mesh) => { if (mesh.material.defines && mesh.material.defines.DAWNDBL) mesh.onBeforeRender = seeView; return mesh; };
  const topY = (g) => { if (!dawnDbl) return 0; const a = g.getAttribute('position').array; let m = -1e9; for (let i = 1; i < a.length; i += 3) if (a[i] > m) m = a[i]; return m; };
  const V_OUT = /* glsl */`varying vec3 vN, vW, vAcc; varying float vTip, vDip;
    #ifdef DAWNDBL
      varying vec2 vDb;      // (the thirteenth round) how deep the point's true image lies under the tide, and how high the body's top stands over it
    #endif
    `;
  // (the thirteenth round, see DAWN, THE TONE) F_TONE, for a double's fragment shader alone: dblTone() = what the backdrop draws
  // at this pixel, shoreAt() on the eye's ray through the pixel. The ray is reckoned from the pixel's own place in the picture
  // (gl_FragCoord less the corner of the rectangle drawn into, over its breadth and over its height, uDblView, each by its
  // own figure; then the projection and the view turned back), not from the double's surface: so it is the same ray
  // whichever triangle covers the pixel, and the neighbours that shoreAt()'s fwidth is taken from are the picture's own
  // neighbours, as they are for the backdrop (a ray carried by the double's surface is not sure in the pixels beside an
  // edge-on sliver of an outline, which fwidth reads). The projection, the lens's turn and the rectangle drawn into are
  // read to find the ray and for nothing else: the tone is shoreAt() on that ray (what shoreAt() reads is said at
  // shoreGlsl()), at whatever size and into whatever target the picture is drawn.
  const F_TONE = /* glsl */`
    #ifdef DAWNDBL
      ${shoreGlsl()}
      uniform mat4 projectionMatrix; uniform vec4 uDblView;      // (uDblView: the rectangle drawn into, in drawn pixels: its corner x, y, its breadth, its height; see atDraw())
      vec3 dblTone(){ vec2 pj = vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
        vec3 v = vec3((2.*(gl_FragCoord.xy-uDblView.xy)/uDblView.zw-1.+projectionMatrix[2].xy)/pj, -1.);
        return shoreAt(normalize(v*mat3(viewMatrix))); }
    #endif
    `;
  const F_FORM = /* glsl */`precision highp float; ${V_OUT} ${G_COMMON} ${G_SHADE} ${F_TONE}
    void main(){
      vec3 n = vN/max(length(vN), 1e-4), w = vW, cam = cameraPosition; float dim = 1.;
      #ifdef DAWNDBL
        vec3 tone = dblTone();      // (the thirteenth round) read before anything is thrown away: it takes fwidth
      #endif
      #ifdef MIRROR
        if (w.y > uGroundY) discard;
        vec3 d = w-cam; float k = (uGroundY-cam.y)/min(d.y, -1e-4);
        if (wetAt(cam.xz+d.xz*k) < .5) discard;
        w.y = uGroundY+(uGroundY-w.y)/dblK(); n.y = -n.y; cam.y = 2.*uGroundY-cam.y; dim = uMirrorForm;
      #endif
      vec3 col = shadeForm(n, w, cam, vTip, vDip, vAcc);
      #ifdef MIRROR
        col = mirrorInk(col, dim);        // the double keeps to the inks: it greys toward dove, it is never dimmed to mud
      #endif
      #ifdef DAWNDBL
        { float fk = dblFade(vDb.x/max(vDb.y, 1e-3)); col = fk*col+(1.-fk)*tone; }      // (the thirteenth round) K of the double's own colour, the rest the tide's tone; written solid, as below
      #endif
      gl_FragColor = vec4(col, 1.);
    }`;
  const V_TAIL = /* glsl */`
      vec4 w = modelMatrix*vec4(p, 1.); vec3 wn = mat3(modelMatrix)*n;
      #ifdef MIRROR
        w.y = uGroundY-(w.y-uGroundY)*dblK(); wn.y = -wn.y;
        #ifdef DAWNDBL
          w.xz += dblWave(w.xyz);
        #endif
      #endif
      vW = w.xyz; vN = wn; gl_Position = projectionMatrix*viewMatrix*w; }`;
  // formMaterial({ mirror, prog }): instanced lathe bodies (geometry from latheGeometry + setForms). mirror: the double in the tide.
  function formMaterial(o = {}) {
    return asDouble(new THREE.ShaderMaterial({
      uniforms: U(Object.assign({ uProg: o.prog || uniforms.uProg }, Array.isArray(o.whole) ? { uDbl: { value: new THREE.Vector2(o.whole[0], o.whole[1]) } } : {})), defines: Object.assign(o.mirror ? { MIRROR: 1 } : {}, o.bud ? { BUD: 1 } : {}, o.sink ? { SINK: 1 } : {}, o.whole ? { WHOLE: 1 } : {}),
      side: o.mirror ? THREE.BackSide : THREE.FrontSide,
      vertexShader: /* glsl */`${V_OUT} ${G_COMMON} ${G_LATHE} uniform vec3 uAccent[3];
        void main(){ vec3 p, n; float tt = ringT(iB.y, position.y); lathe(position.x, tt, p, n);
          vTip = tt; vDip = 1.-iC.w; vAcc = iB.w < .5 ? uAccent[0] : (iB.w < 1.5 ? uAccent[1] : uAccent[2]);
          #ifdef DAWNDBL
            vDb = lDb+(modelMatrix[3].y-uGroundY);
          #endif
        ${V_TAIL}`,
      fragmentShader: F_FORM,
    }), o.mirror);
  }
  // meshMaterial({ accent, dip, soft, mirror, top }): any smooth mesh in the same hand (top: of a double, see topY()). Needs attributes normal and aTip (0..1, the
  // dip coordinate: the body is dipped where aTip > dip) and aSoft (metres of mercury bulge allowed at that vertex).
  function meshMaterial(o = {}) {
    return asDouble(new THREE.ShaderMaterial({
      uniforms: U(Object.assign({ uMeshAcc: { value: o.accent || palette.coral }, uMeshDip: { value: o.dip ?? 0.9 } }, o.lean ? { uLeanAdd: { value: o.lean } } : {}, dawnDbl && o.mirror ? { uDblTop: { value: o.top ?? 0 } } : {})),
      defines: o.mirror ? { MIRROR: 1 } : {}, side: o.mirror ? THREE.BackSide : THREE.FrontSide,
      vertexShader: /* glsl */`${V_OUT} ${G_COMMON} attribute float aTip, aSoft; uniform vec3 uMeshAcc; uniform float uMeshDip;
        #ifdef DAWNDBL
          uniform float uDblTop;      // (the thirteenth round) the mesh's own top over its group's ground (o.top: topY(geometry))
        #endif
        void main(){ vec3 n = normal;
          vec3 p = position + normal*aSoft*(.6*sin(position.y*.3-uTime*.8)+.4*sin(dot(position, vec3(.21,.13,.17))+uTime*.47));
          vTip = aTip; vDip = uMeshDip; vAcc = uMeshAcc;
          #ifdef DAWNDBL
            vDb = vec2((modelMatrix*vec4(p, 1.)).y, uDblTop+modelMatrix[3].y)-uGroundY;      // (a mesh's double is the true image)
          #endif
        ${V_TAIL}`,
      fragmentShader: F_FORM,
    }), o.mirror);
  }
  // bladeMaterial(): THE SHADOW. A flat black blade per body, lying on the flat, three heights long, pointing along uShadowAz.
  // (round penumbra by height: laid by the law of the shade, see laid(); vPen carries what penLeft() reads)
  // It belongs to the ground: it takes no part in the rising. Same instance attributes as the forms (setForms).
  function bladeMaterial(o = {}) {
    return laid(new THREE.ShaderMaterial({
      uniforms: U({ uProg: o.prog || uniforms.uProg }), defines: Object.assign(o.bud ? { BUD: 1 } : {}, o.pick ? { PICK: 1 } : {}), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: /* glsl */`${G_COMMON} ${G_LATHE}
        centroid varying vec4 vPen;      // the height that casts this point of the blade, where it lies across it (-1 .. 1), half its breadth there (m), the breadth of the body there (m)
        uniform float uAirKeep, uAirSlim, uAirPx, uAirBold, uRmax[${PTYPES}]; uniform vec2 uPix;
        #ifdef PICK
          attribute float iK;      // 1 = one of the few dozen needles that rule the mirror when it is seen from the air (makeRuler)
        #endif
        // a bud's shadow arrives when the bud has slid off its parent and stands on the flat
        float bladeH(){
          #ifdef BUD
            float cy = budCyc(); return iA.w*smoothstep(.57, .66, cy)*(1.-smoothstep(.93, 1., cy));
          #else
            return iA.w;
          #endif
        }
        float sGrow = 1.;         // how much of its length a needle has (it grows out from its foot when it first can be drawn)
        vec2 gpt(float t, out float r){ float bh = bladeH(); vec3 p = centre(iB.y, t, iC.z, iA.w); r = p.x*iB.z*bh;
          vec4 w = modelMatrix*vec4(iA.xyz+yawed(vec3(p.y*bh, 0., 0.), iB.x), 1.);
          return w.xz + shadowDir()*uShLen*sGrow*(w.y-uGroundY+p.z*bh); }
        void main(){ float r, r2, d = 1./${PN - 1}.;
          float bt = ringT(iB.y, position.x);
          float aloft = smoothstep(20., 38., cameraPosition.y-uGroundY), bh = bladeH();      // (journey round: in the climbing turn, 10-30 m up, the flat below is still ruled with every shadow) (the fourteenth round b: this float was named air, the name of G_COMMON's air(); the name alone is changed)
          // FIX ROUND 3, A NEEDLE IS A LINE OR IT IS NOTHING. Seen from near the flat a shadow is foreshortened in breadth by
          // (height of the eye over its distance) / (how much of its length the eye sees). Measured once, at the needle's
          // middle: needM = the breadth on the flat that shows as a hairline of 0.8 px a side. If that is more than capH
          // (an eighth of its length) it cannot be drawn as a line and is not drawn at all; nor is one shorter on the screen
          // than a couple of dozen pixels; from the air they go one by one (each at its own height) and only the ruled stay.
          vec3 footW = (modelMatrix*vec4(iA.xyz, 1.)).xyz; vec2 sdn = shadowDir();
          vec3 toM = vec3(footW.x+sdn.x*uShLen*bh*.6, uGroundY, footW.z+sdn.y*uShLen*bh*.6)-cameraPosition;
          float dM = max(length(toM), 1e-3), tvM = dot(vec3(sdn.x, 0., sdn.y), toM)/dM, seenM = sqrt(max(1.-tvM*tvM, 1e-4));
          float fracM = max(abs(toM.y)/dM/seenM, .02), needM = .8*uPix.x*dM/fracM, capH = .12*uShLen*bh+1e-4;
          float hsh = fract(iC.z*7.31+iA.x*.137+iA.z*.071), lenPx = uShLen*bh*seenM/max(uPix.x*dM, 1e-6);
          // (nothing pops: a needle that can no longer be drawn draws back into its foot, and grows out of it again)
          sGrow = clamp((capH/max(needM, 1e-5)-1.)*5., 0., 1.)*clamp((lenPx/(mix(22., 70., aloft)*(.75+.5*hsh))-1.)*4., 0., 1.)
            *clamp((hsh*.96+.02-aloft*1.04*(1.+dM/120.))*10., 0., 1.);     // (as the eye rises the far ones go first, so none pile up along level)
          // (journey round) NEVER A HAIRLINE BAR: a shadow whose widest swelling would show under two hairs' breadth is not drawn
          int ty = int(clamp(iB.y+.5, 0., ${PTYPES - 1}.));
          float rm = max(uRmax[ty]*iB.z*bh, 1e-4), cap = .4+.03*bh;
          sGrow *= clamp((min(uBladeW*rm, cap)/max(needM, 1e-5)-2.)*2., 0., 1.);
          #ifdef PICK
            float pk = step(.5, iK), pk2 = step(1.5, iK); sGrow = mix(sGrow, 1., max(pk*aloft, pk2));      // (journey round: ruled only from the air; lower down a ruled shadow obeys the rules of the rest)
            // (polish round) iK = 2: THE SHADOW A RISER LEAVES beside the line of flight is always drawn, whole, at any height of the eye
          #endif
          vec2 g = gpt(bt, r), tg = gpt(bt+d, r2)-gpt(bt-d, r2);
          tg = length(tg) > 1e-5 ? normalize(tg) : sdn;
          vec2 nW = vec2(tg.y, -tg.x);
          vec3 toP = vec3(g.x, uGroundY, g.y)-cameraPosition; float dC = max(length(toP), 1e-3);
          // A SHADOW IS THE STRETCHED SILHOUETTE OF ITS BODY. The whole profile is scaled until its widest swelling fits the
          // needle (it is never clipped to a slab of constant width), so a crown is a curve, a waist a waist, and both ends
          // close to points. Where the silhouette would be finer than a hair it is one unbroken hairline (0.8 px a side,
          // closing over its last sixth).
          float wd = r*min(uBladeW, cap/rm)*sGrow;
          #ifdef PICK
            // and bold: the true stretched silhouette of its body, pointed at both ends; seen from low over the mirror, where a
            // true shadow is foreshortened to a hair, it is given the breadth that shows as four pixels a side at its middle
            float bLo = min(rm, .5+.09*bh);
            // (fix round 8) and clearly wider than the hair that rises from its foot: five and a half pixels a side, tapering to its point
            wd = mix(wd, r/rm*max(bLo, min(5.5*uPix.x*dM/fracM, .16*uShLen*bh)), pk2);
          #endif
          float tv = dot(vec3(tg.x, 0., tg.y), toP)/dC, frac = max(abs(toP.y)/dC/sqrt(max(1.-tv*tv, 1e-4)), .02);
          float hair = min(.8*uPix.x*dC/frac, capH)*min(1., (1.-bt)*6.);
          #ifdef PICK
            // THE RULED MIRROR, from the air: the few dozen chosen needles (iK, see makeRuler) are DRAWN BOLD as the silhouettes
            // of their bodies. So low over the mirror a true shadow is foreshortened to a hairline, so each is given the
            // breadth on the flat that shows as uAirPx pixels a side at its widest in the nearest row (less with distance,
            // never under 1.5), measured once at its middle: along its length it is a real shape lying on a real plane, it
            // narrows away from the eye and ends in a point
            float wMax = min(clamp(uAirPx*150./dM, 2.4, uAirPx)*uPix.x*dM/fracM, .2*uShLen*bh);      // (fix round 8: never under 2.4 px a side, so a far needle is still a needle beside its hair)
            wd = mix(wd, r/rm*1.2*wMax, aloft*pk*(1.-pk2));
          #endif
          wd = max(wd, hair);
          g += nW*wd*step(1e-3, sGrow)*position.y;
          vec3 P = vec3(g.x, uGroundY+.02, g.y);
          { vec3 pc = centre(iB.y, bt, iC.z, iA.w);
            vPen = vec4((modelMatrix*vec4(iA.xyz+yawed(vec3(pc.y*bh, 0., 0.), iB.x), 1.)).y-uGroundY+pc.z*bh, position.y, wd, 2.*prof(iB.y, bt).x*iB.z*iA.w); }
          // the rare event: the needle peels off the flat foot first and is drawn up its thread like a kite's tail
          vec3 rp = vec3(iC.x, iC.y, iC.z);
          float up = clamp((uProg-rp.x)/(.2+.0022*rp.y), 0., 1.)*step(.5, rp.y)*step(rp.x, 5.);
          float q = clamp((uPeel*1.9-iC.z*.75-position.x*.4)*3., 0., 1.)*up; q = q*q*(3.-2.*q);
          if (q > 0.) {
            vec3 F = (modelMatrix*vec4(iA.xyz, 1.)).xyz + riseOff(rp);
            vec2 sdv = shadowDir(); float tt = position.x, L = min(iA.w*1.3, 22.);
            vec3 side = cross(vec3(0., 1., 0.), F-cameraPosition); float sl = length(side); side = sl > 1e-3 ? side/sl : vec3(sdv.y, 0., -sdv.x);
            // (fix round 7) A TAIL IS A HAIR THAT SWELLS ONCE: never more than three and a half pixels a side wherever it hangs
            // (they were blades as wide as leaves beside the hole), and only the shadows that were drawn bold or ruled go up
            // as tails; every other needle is simply drawn up into its foot and is gone, so no thicket hangs under the colony
            float tw = min(.02*iA.w+.05, 2.6*uPix.x*max(length(F-cameraPosition), .1))*pow(max(1.-tt, 0.), .7)*(tt/(tt+.04));
            #ifdef PICK
              float tk = step(.25, iK);      // (fix round 9: iK = 0.3 = not ruled, but its shadow goes up as a tail on the rare tide)
            #else
              float tk = 0.;
            #endif
            tw *= tk; L *= tk;
            vec3 tail = F + vec3(sdv.x*.12*L*tt*tt, -L*tt, sdv.y*.12*L*tt*tt)
              + side*(tw*position.y + .04*L*tt*sin(uTime*.9+tt*5.+iC.z*30.));
            P = mix(P, tail, q);
          }
          gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.); }`,
      // (the soft edge of a broad body's blade is never broader than half its half breadth: its middle half is laid as deep as its
      // height says; a slender body's may reach its middle line)
      fragmentShader: /* glsl */`precision highp float; ${G_PEN} centroid varying vec4 vPen;
        void main(){ gl_FragColor = vec4(0., 0., 0., penLeft(vPen.x, vPen.w, vPen.z*(1.-abs(vPen.y)), vPen.z, .5*vPen.z)); }`,
    }));
  }
  // THE LINE: a black thread, hair-thin (see threadMaterial), straight when taut and one shallow sag when slack.
  const G_THREAD = /* glsl */`${G_COMMON} ${G_RISE} uniform vec2 uPix, uKeep;
    attribute vec3 tA, tB;     // the two ends at rest (local)
    attribute vec3 rA, rB;     // rise parameters of what each end is tied to: (release, hang, phase); release 9 = fixed
    attribute vec4 sAB;        // xz sway of end A and of end B with their owners' sag (metres)
    attribute vec4 tS;         // sag in metres when slack, phase, progress at which it starts to tauten, progress when taut
    vec3 tpt(float s){
      vec3 a = tA + riseOff(rA) + vec3(sAB.x, 0., sAB.y)*sin(uTime*.31+rA.z*14.);
      vec3 b = tB + riseOff(rB) + vec3(sAB.z, 0., sAB.w)*sin(uTime*.31+rB.z*14.);
      float slack = mix(1., .03, smoothstep(tS.z, tS.w, uProg))*(.6+.4*sin(uTime*.37+tS.y*20.));
      vec3 p = mix(a, b, s); p.y -= tS.x*slack*4.*s*(1.-s); return p; }
    // how much of this thread is drawn at view distance d: thread by thread they stop being drawn with distance (its own
    // distance each, from tS.y), so far rigging is a few separate hairs and never a mass; a tether (tS.z > 1.5) is let go
    // when its shadow follows its form
    float tkeep(float d){ float D = uKeep.x*exp(uKeep.y*tS.y);
      return (1.-smoothstep(D, D*1.12, d))*(1.-step(1.5, tS.z)*clamp((uPeel*1.9-(tS.y-.3)*1.07)*3., 0., 1.)); }`;
  // (fix round 8) A THREAD IS A HAIR. It is drawn about one pixel across wherever it hangs (uFloor = half that, in pixels; never
  // more than uCap pixels a side however near), its edge antialiased in the fragment shader, and with distance it goes finer
  // still (a far hair covers less than its pixel). It is blended, so it is drawn after every body and writes no depth.
  function threadMaterial(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: U({ uProg: o.prog || uniforms.uProg, uWidth: { value: o.width ?? 0.035 }, uKeep: { value: new THREE.Vector2(...(o.keep || [150, 1.5])) }, uFloor: { value: o.floor ?? 0.36 }, uCap: { value: o.cap ?? 0.62 },
        uFine: { value: new THREE.Vector3(...(o.fine || [60, 300, 0.72])) }, uHide: o.hide || { value: 0 }, uLine: { value: o.color || palette.black } }),
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`${G_THREAD} uniform float uWidth, uFloor, uCap, uHide; uniform vec3 uFine; varying vec3 vS;
        void main(){ float s = position.x;
          vec3 v0 = (modelViewMatrix*vec4(tpt(s), 1.)).xyz, v1 = (modelViewMatrix*vec4(tpt(s+.02), 1.)).xyz;
          vec3 sd = cross(v1-v0, v0); sd /= max(length(sd), 1e-6);
          float px = uPix.x*max(-v0.z, .1), L = clamp(uWidth*.5/px, uFloor, uCap), G = L+.75;      // half the hair and half the ribbon, in pixels
          float keep = tkeep(length((modelViewMatrix*vec4(tpt(.5), 1.)).xyz))*(1.-uHide);
          vS = vec3(position.y*G, L, keep*mix(1., uFine.z, smoothstep(uFine.x, uFine.y, -v0.z)));
          gl_Position = projectionMatrix*vec4(v0+sd*G*px*step(.004, keep)*position.y, 1.); }`,
      fragmentShader: /* glsl */`precision highp float; uniform vec3 uLine; varying vec3 vS;
        void main(){ float c = clamp(vS.y-abs(vS.x)+.5, 0., 1.), a = (1.-(1.-c)*(1.-c)*(1.-c))*vS.z;      // (the air is several times brighter than paper white before the tone map: a hair that covers half a pixel must take most of it to read black)
          if (a < .004) discard; gl_FragColor = vec4(uLine, a); }`,
    });
  }
  // beadMaterial(): pearls that slide along threads. Thread attributes plus bP = (phase, speed in thread-lengths a second).
  function beadMaterial(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: U({ uProg: o.prog || uniforms.uProg, uBead: { value: o.radius ?? 0.16 }, uBeadCol: { value: o.color || palette.ivory }, uBeadPx: { value: o.floorPx ?? 1.1 }, uBeadS: { value: o.at ?? -1 }, uKeep: { value: new THREE.Vector2(...(o.keep || [150, 1.5])) }, uHide: o.hide || { value: 0 } }),
      vertexShader: /* glsl */`${G_THREAD} uniform float uBead, uBeadPx, uBeadS, uHide; attribute vec2 bP; varying vec2 vUv; varying vec3 vW;
        void main(){ float s = .5-.47*cos(3.14159*fract(bP.x+uTime*bP.y)*2.);
          if (uBeadS >= 0.) s = uBeadS;      // (fix round 8: o.at = a bead that does not slide: the knot at one end of a hair)
          vec3 c = tpt(s); vW = (modelMatrix*vec4(c, 1.)).xyz; vec3 v = (viewMatrix*vec4(vW, 1.)).xyz;
          float r = max(uBead, uBeadPx*uPix.x*max(-v.z, .1))*step(.5, tkeep(length((viewMatrix*modelMatrix*vec4(tpt(.5), 1.)).xyz)))*(1.-uHide); vUv = position.xy; v.xy += position.xy*r;
          gl_Position = projectionMatrix*vec4(v, 1.); }`,
      fragmentShader: /* glsl */`precision highp float; ${G_COMMON} ${G_SHADE} varying vec2 vUv; varying vec3 vW; uniform vec3 uBeadCol;
        void main(){ float q = dot(vUv, vUv); if (q > 1.) discard;
          vec3 n = (vec4(vUv, sqrt(max(1.-q, 0.)), 0.)*viewMatrix).xyz;
          gl_FragColor = vec4(shadeForm(n, vW, cameraPosition, 1., o_dip, uBeadCol), 1.); }`.replace('o_dip', o.color ? '-1.' : '2.'),
    });
  }
  // backdropMaterial(): ground and air as ONE function of view elevation, drawn on a single dome at the far plane. Below
  // level the same shader finds where the ray meets the flat, so the tide (mirror = the gradient upside down, times 0.94, and
  // the hairline front) is drawn here too. No ground mesh exists; nothing in the world writes depth for the ground.
  // (the thirteenth round) THAT FUNCTION IS shoreGlsl()'s shoreAt(d), for a fragment shader that has G_COMMON: what the backdrop
  // draws on the eye's ray of unit direction d (the gradient, the flat, the tide with its bars and rings, the front, the
  // grain), every line as it stood in backdropMaterial()'s main, which now calls it for the dome's ray. At dawn a double's
  // material calls the same function for the ray through its own pixel (F_TONE, dblTone(); see DAWN), so the tone a double
  // goes toward and the tide beside it are one text. It reads what it read: the eye's place, the ray, the pixel's footprint
  // on the flat (fwidth), the world's clock for the rings, the pixel's place for the grain, and the tide's own state and the
  // hour's inks (uTide, uGroundY, uRampC, uMirror, uFlat, uIvory), which live's score sets. shoreGlsl is a function and
  // not a constant only so that its lines can stay where they stood.
  function shoreGlsl() { return /* glsl */`
        float hash(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
        // stepTo(a, b, w, k): a moved toward b by w, but never by more than k times a's own light
        vec3 stepTo(vec3 a, vec3 b, float w, float k){ vec3 lw = vec3(.3, .6, .1); float dl = abs(dot(b-a, lw));
          return mix(a, b, w*min(1., k*dot(a, lw)/max(dl, 1e-4))); }
        vec3 shoreAt(vec3 d){
          float e = asin(clamp(d.y, -1., 1.));
          float k = max(cameraPosition.y-uGroundY, 0.)/max(-d.y, 1e-4);
          float dd = dot(cameraPosition.xz+d.xz*k, uTide.xy)-uTide.z, fw = min(fwidth(dd), 1e4);
          float below = step(d.y, -2e-4)*uTide.w;
          vec3 col = air(e);      // (the fourteenth round) the air: ramp(e) up to its top stop, 40 degrees over level, at the pale hours deeper from there to the zenith (air(), G_COMMON)
          // (polish round) NO BAND ON THE LEVEL LINE. A true mirror showed the whole gradient upside down, so the level stop,
          // a step deeper than the air above it, lay across the view as a soft dark band with pale air above AND below: a
          // horizon. The tide shows the air only a quarter as high as it is (it is a film of water, not glass): from level
          // down it holds the level tone and deepens a little, so the picture is still ONE gradient from top to bottom
          // (ground round) THE FLAT IS A WET TIDAL FLAT, drawn here in the gradient's own inks: bars of drying sand (the flat's
          // tone a step toward the level tone) lying along the tide's edge, a darker wet margin where each bar goes under,
          // sheets and pools of standing water that show the air (the same film the tide is), a bright rim round every
          // pool, long ripple lines that follow the edges, shells and worm casts near the eye. Every part of it goes to the
          // one level tone as the ray comes up to level and each scale is left out where it is too fine to draw, so there is
          // still nothing to see where ground and air meet.
          vec2 gp = cameraPosition.xz+d.xz*k, gq = shoreQ(gp), fq = min(fwidth(gq), vec2(1e4));
          float grd = step(d.y, -2e-4), tide = below*(1.-smoothstep(-fw*.5-.02, fw*.5+.02, dd));
          vec3 fd = 1.-smoothstep(.22, .75, vec3(max(fq.x*FQ0.x, fq.y*FQ0.y), max(fq.x*FQ1.x, fq.y*FQ1.y), max(fq.x*FQ2.x, fq.y*FQ2.y)));
          // (fix round 7) SEEN FROM THE AIR THE FLAT IS CALM: the two finer scales of bar are left out as the eye rises (from 40 m
          // they were a blotched camouflage), so the mirror under the reveal is two broad tones and a fine rim
          float hEye = cameraPosition.y-uGroundY;
          fd.z *= 1.-smoothstep(7., 18., hEye); fd.y *= 1.-.9*smoothstep(12., 30., hEye);
          float h = flatH(gp, fd), fh = min(fwidth(h), 10.)+1e-4, seen = max(fd.x, max(fd.y, fd.z));
          float water = (1.-smoothstep(-.03-fh, -.03+fh, h))*seen, dry = smoothstep(.0, .075, h)*seen;
          // (the tones part from the level tone only below three degrees under level, so ground and air still meet in one tone)
          float ge = smoothstep(0., .055, -e);
          vec3 base = ramp(e), lvl = ramp(0.), sky = mix(lvl, uRampC[3], .8);
          vec3 mir = mix(ramp(-e*.25)*mirrorK(e), sky*mix(1., uMirror, .5), .5*ge);
          vec3 sandWet = mix(base, uRampC[1]*.8, .45*ge*seen), sandDry = mix(mix(base, uRampC[1], .25*ge), mix(lvl, uRampC[3], .45), .34*ge*seen);
          vec3 land = mix(sandWet, sandDry, dry);
          // drawn ripple marks on the sand and long ripple lines on the water: contours of the same height, so they follow the edges
          float rc = (gq.y+9.*fnoise(gq*vec2(.006, .03)+2.)+3.5*h)/5.5, rw = min(fwidth(rc), 10.)+1e-4, rl = abs(fract(rc)-.5)*2.;
          float rip = (1.-smoothstep(.3, 2.2, (1.-rl)/rw*.5))*(1.-smoothstep(.2, .55, rw))*fd.z;
          rip *= smoothstep(.3, .55, fnoise(gq*vec2(.045, .35)+9.));      // (drawn marks, a few strides long each: never a ruled line)
          // (fix round 7) NO FIELD OF SCRIBBLES: a drawn mark is one small step paler than the tone it lies on (stepTo: never more
          // than a part of that tone's own light, so on the plum flat of night it is next to nothing), and none is drawn once
          // the eye is off the flat
          rip *= 1.-smoothstep(6., 14., hEye);
          land = stepTo(land, mix(lvl, uRampC[3], .7), .55*rip*dry*ge, .8);
          land = mix(land, mix(base, uRampC[1]*.7, ge), .35*rip*(1.-dry));
          vec3 pale = mix(mir, mix(sky, uIvory, .3), .6);      // (the lines on the water are a step paler than the air of the hour, never white on a night flat)
          vec3 pool = stepTo(mix(mir, sky, .45*ge), pale, .35*rip*smoothstep(-.3, -.06, h), .8);
          // the bright rim of a pool, a hair of ivory where the water meets the sand
          float rim = (1.-smoothstep(.6, 1.8, abs(h+.03)/fh))*(1.-smoothstep(.02, .09, fh))*seen;
          vec3 flat0 = mix(land, pool, water);
          flat0 = stepTo(flat0, mix(sky, uIvory, .5), .7*rim*(1.-tide), 1.6);
          // shells and worm casts: one small mark in every other stride of sand nearK the eye
          { vec2 cg = gp/1.7, ci = floor(cg), cf = fract(cg)-.5; float hs = fhash(ci+17.), hk = fhash(ci+71.);
            vec2 o = (vec2(fhash(ci+3.), fhash(ci+9.))-.5)*.6; float sz = (.05+.06*hk)/1.7, pxs = max(fq.x, fq.y)/1.7+1e-4;
            vec2 v = cf-o; float ca = cos(hk*6.28), sa = sin(hk*6.28); v = vec2(ca*v.x+sa*v.y, -sa*v.x+ca*v.y); v.y *= 1.7;
            float rr = length(v), nearK = (1.-smoothstep(.25, .6, pxs/max(sz, 1e-4)))*step(hs, .55)*dry;
            float shell = 1.-smoothstep(sz-pxs, sz+pxs, rr), coil = shell*smoothstep(sz*.35-pxs, sz*.35+pxs, rr);
            flat0 = mix(flat0, hs < .3 ? uIvory*.95 : sandWet*.6, nearK*(hs < .3 ? shell : coil)*(1.-.5*tide)); }
          // under the tide the bars are still there, a hand's depth down: the mirror keeps two tones going back
          // (fix round 7: and they show further back, to within a degree and a half of level, so from the float the tide is
          // two tones in bands and not one flat sheet)
          // (fix round 9) TWO CLEAR TONES AND NO DRAWN LINE: a bar under the tide is one flat second tone with a clean edge (it faded
          // in so softly that the mirror near the eye was one bare sheet), and the pale contour lines that were drawn on the water
          // are gone (on the night mirror they were a texture). (Round rings on the tide: the one pale line on the water now is
          // the ring of a falling drop, below, near the eye that skims it.)
          // The bars are drawn as broad bands that lie along the tide's edge, one every 34 m, each with its own wandering edge:
          // wherever the eye is there are two tones going back, none on the level line
          float bq = gq.y/34.+1.7*fnoise(gq*vec2(.011, .028)+7.3)+.45*h, bw = min(fwidth(bq), 10.)+1e-4;
          float bar = smoothstep(.5-bw, .5+bw, abs(fract(bq)-.5)*2.)*(1.-smoothstep(.14, .45, bw));
          // (the bands are for the eye that skims the mirror; as it climbs they go, and from the air the mirror is the two broad calm
          // tones of the great bars alone)
          bar = max(bar*(1.-smoothstep(8., 26., hEye)), smoothstep(.0, .1, h)*seen*smoothstep(8., 26., hEye));
          vec3 tided = mix(mir, mix(mir, uRampC[1], .45), bar*smoothstep(.004, .03, -e));
          // (round rings on the tide) THE BARE TIDE READS AS WATER, FOR THE EYE THAT SKIMS IT. The film of water is still, and a
          // drop falls on it now and then: one place in every thirty metres square of the flat, each with its own beat of five
          // to eight seconds, sends three thin rings out at walking pace (1.1 m a second, 1.7 m apart, to nine metres at
          // most); each ring comes up over its first half metre and all three fade from half the drop's life on. They are
          // drawn here, on the tide alone and under every double and every shadow (those are drawn after the backdrop, so no
          // double is touched; the thirteenth round: at dawn a double's colour goes toward this very tone by its depth, so
          // there a ring shows in a double by one less its K), in the tone and by the limit of a pool's bright rim (stepTo 1.6: on a night flat a ring adds
          // at most 1.6 times the tide's own light). A ring is left out, every arc of it alike, where one pixel covers more
          // of the flat than a third of a metre to 1.1 m in any direction (pf: so none is drawn far off, none near the level
          // line), and as the eye climbs off the flat, by the bands' own figures (whole to 8 m, none from 26 m: later than the
          // drawn marks of the land, which go from 6 to 14 m): from the air the mirror stays calm, as fix round 7 has it. A
          // place of the flat and the world's clock: no seed, no position on the route.
          { vec2 cg = gp/30., ci = floor(cg); float h1 = fhash(ci+31.), h2 = fhash(ci+57.), h3 = fhash(ci+83.);
            vec2 cc = (ci+.5+(vec2(h1, h2)-.5)*.3)*30.;      // (the drop falls in the middle three tenths of its square, so no ring reaches a square's edge)
            float per = mix(5., 8., h3), ph = fract(uTime/per+h1*7.3), age = ph*per, pf = max(fq.x, fq.y);
            // (the line's breadth and skirt are a pixel's reach along the ring's radius, and never more than the pixel's whole
            // footprint on the flat, fp: at a square's edge the drop measured from changes, the radius jumps with it, and a
            // breadth taken from that jump drew the squares' edges as dotted pale lines)
            vec2 fp = min(fwidth(gp), vec2(1e4)); float rr = length(gp-cc), fr = min(min(fwidth(rr), 10.), fp.x+fp.y)+1e-4, lw = .09+.5*fr;
            float r0 = 1.1*age, r1 = r0-1.7, r2 = r0-3.4;
            float ring = (1.-smoothstep(lw, lw+fr, abs(rr-r0)))*smoothstep(.2, .7, r0)
              +.7*(1.-smoothstep(lw, lw+fr, abs(rr-r1)))*smoothstep(.2, .7, r1)+.45*(1.-smoothstep(lw, lw+fr, abs(rr-r2)))*smoothstep(.2, .7, r2);
            ring *= (1.-smoothstep(.5, 1., ph))*(1.-smoothstep(.3, 1.1, pf))*(1.-smoothstep(8., 26., hEye));
            tided = stepTo(tided, mix(sky, uIvory, .5), min(ring, 1.), 1.6); }
          // (fix round 8) THE GROUND UNDER THE FORMS IS THE GRADIENT'S OWN SMOKE VIOLET until the tide comes: of the wet flat only a
          // breath is drawn (uFlat), so the ivory bodies and their black needles stand on a deep ground
          col = mix(col, mix(mix(base, flat0, uFlat), tided, tide), grd);
          // (fix round 3) the front is a hairline of light seen only near the eye: one pixel, thinning as it goes, and gone
          // before the ray comes within five degrees of level, so it never draws a line across the view where a horizon would be
          float hw = max(.04, .6*fw);
          col = mix(col, vec3(1.6), below*clamp((hw-abs(dd))/max(fw, 1e-4)+.5, 0., 1.)*smoothstep(.09, .22, -e));
          return col*(1.+(hash(gl_FragCoord.xy)-.5)*.008); }`; }
  function backdropMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: U({}), side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`varying vec3 vDir;
        void main(){ vDir = position; vec4 p = projectionMatrix*viewMatrix*vec4(cameraPosition+position*400., 1.);
          if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`precision highp float; ${G_COMMON} ${shoreGlsl()} varying vec3 vDir;
        void main(){ gl_FragColor = vec4(shoreAt(vDir/max(length(vDir), 1e-4)), 1.); }`,
    });
  }
  // meshShadowMaterial({ footY }): the shadow of a smooth mesh, flattened onto the flat by the same rule as the blades:
  // a vertex at height h above footY lands 3h along the shadow direction from where it stands.
  function meshShadowMaterial(o = {}) {
    return laid(new THREE.ShaderMaterial({
      uniforms: U({ uFootY: { value: o.footY ?? 0 }, uAxis: { value: o.axis || new THREE.Vector3() }, uSlim: { value: o.airSlim ?? 1 }, uSlimAll: { value: o.slim ?? 1 } }), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: /* glsl */`${G_COMMON} uniform float uFootY, uSlim, uSlimAll; uniform vec3 uAxis; attribute vec3 aS0, aS1; centroid varying vec3 vPen;
        void main(){ vec4 w = modelMatrix*vec4(position, 1.); vec2 sd = shadowDir(), g = w.xz+sd*uShLen*(w.y-uFootY);
          // HOW FAR INSIDE THE OUTLINE (for the soft edge). ll = the way the light goes, in the mesh's own frame; c = how the
          // surface faces it (0 on the line of the body that casts the outline); kap = how fast the surface curves along the
          // light there (shadeCurv). A point of the surface where the normal has turned c from that line lands about
          // c*c/(2 kap) from the outline, times the stretch of the flattening across the outline (sig): metres on the flat,
          // found at the vertex and carried across the triangle (vPen.y). vPen.x = the height that casts this point;
          // vPen.z = the limb's breadth there, 2 over the sum of its two curvatures in metres (carried no broader than 4 m:
          // penB is 1 from PEN.b1 up)
          vec3 ll = normalize(vec3(sd.x*uShLen, -1., sd.y*uShLen))*mat3(modelMatrix), nW = mat3(modelMatrix)*normal;
          float c = dot(normal, ll), kap = dot(ll, aS0*ll+aS1*ll.yzx+aS1.zxy*ll.zxy)/max(1.-c*c, 1e-3), sig = length(nW.xz+sd*uShLen*nW.y);
          vPen = vec3(w.y-uFootY, min(sig*c*c/(2.*max(abs(kap), 1e-4)), 500.), min(2.*length(modelMatrix[0].xyz)/max(abs(aS0.x+aS0.y+aS0.z), 1e-4), 4.));
          // (fix round 2) seen from the air a great shadow is drawn as the boldest of the ruled needles: it closes toward the
          // line through its own foot (o.axis, local) to o.airSlim of its breadth
          vec2 a0 = (modelMatrix*vec4(uAxis, 1.)).xz, pp = vec2(sd.y, -sd.x);
          g -= pp*dot(g-a0, pp)*(1.-uSlimAll);        // (journey round) o.slim: a great body's shadow is a slim stretched silhouette at any height
          g -= pp*dot(g-a0, pp)*(1.-uSlim)*smoothstep(6., 30., cameraPosition.y-uGroundY);
          gl_Position = projectionMatrix*viewMatrix*vec4(g.x, uGroundY+.02, g.y, 1.); }`,
      fragmentShader: /* glsl */`precision highp float; ${G_PEN} centroid varying vec3 vPen;
        void main(){ gl_FragColor = vec4(0., 0., 0., penLeft(vPen.x, vPen.z, vPen.y, .5*vPen.z, 1e3)); }`,
    }));
  }
  // meshShadow(geometry, o): the mesh that lays a smooth body's shadow: meshShadowMaterial(o) on the body's geometry, which is
  // given what the soft edge reads (shadeCurv)
  function meshShadow(geometry, o) { const m = new THREE.Mesh(shadeCurv(geometry), meshShadowMaterial(o)); m.renderOrder = SHADE_ORDER; m.frustumCulled = false; return m; }
  // ----- geometry helpers -----
  // gridGeometry(nx, ny): the unit sheet every lathe body is turned from (x = 0..1 round the body, y = 0..1 along it).
  // nx MUST be a multiple of 4 (three quarters of the columns face the eye; see lathe()).
  function gridGeometry(nx, ny) {
    const pos = new Float32Array((nx + 1) * (ny + 1) * 3), idx = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const o = (j * (nx + 1) + i) * 3; pos[o] = i / nx; pos[o + 1] = j / ny; }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }
  // stripGeometry(n): x = 0..1 along, y = -1 | +1 across: the blank for blades (n >= 10) and thread ribbons (n = 8)
  function stripGeometry(n) {
    const pos = new Float32Array((n + 1) * 2 * 3), idx = [];
    for (let i = 0; i <= n; i++) { pos[i * 6] = pos[i * 6 + 3] = i / n; pos[i * 6 + 1] = -1; pos[i * 6 + 4] = 1; }
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }
  const quadGeometry = () => { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3)); g.setIndex([0, 1, 2, 1, 3, 2]); return g; };
  // instanced(base, material, count, { name: [Float32Array, itemSize] }): one draw call of `count` copies of `base`
  function instanced(base, material, count, attrs) {
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
    for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][0], attrs[k][1]));
    g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const m = new THREE.Mesh(g, material); m.frustumCulled = false; if (material.userData.shade) m.renderOrder = SHADE_ORDER; return atDraw(m);      // (the thirteenth round: atDraw, for a double at dawn; else m as it is)
  }
  // formAttrs(list): instance attributes for bodies. A body is { x, y, z (foot), H, yaw, type 0..8, fat (1 = as drawn),
  // accent 0 coral | 1 lemon | 2 turquoise, rel (release, in progress units), hang (metres it rises), phase 0..1, dip 0..0.3,
  // sway: optional [x, z, phase] inherited from the body it is balanced on (pointOn(parent, t).sway and parent.phase) }.
  function formAttrs(list) {
    const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), iD = new Float32Array(n * 3);
    list.forEach((f, i) => { if (f.sway) iD.set(f.sway, i * 3); iA.set([f.x, f.y, f.z, f.H], i * 4); iB.set([f.yaw, f.type, f.fat, f.accent], i * 4); iC.set([f.rel, f.hang, f.phase, f.dip], i * 4); });
    return { iA: [iA, 4], iB: [iB, 4], iC: [iC, 4], iD: [iD, 3] };
  }
  // pointOn(body, t): local rest position of the centreline at t (1 = the tip), and its sag sway amplitude, for tying threads
  function pointOn(f, t) {
    const [, cx, cy] = prof.at(f.type, t), c = Math.cos(f.yaw), s = Math.sin(f.yaw);
    const amp = t * t * (0.03 + 0.02 * THREE.MathUtils.smoothstep(f.H, 4, 25)) * f.H;
    return { p: [f.x + c * cx * f.H, f.y + cy * f.H, f.z - s * cx * f.H], sway: [c * amp, -s * amp], rise: [f.rel, f.hang, f.phase] };
  }
  // threadAttrs(list): a thread is { a, b } (two pointOn results, or { p:[x,y,z] } for a fixed end), sag (m), t0, t1 (progress
  // between which it tautens; t0 > 1 = never), phase.
  function threadAttrs(list) {
    const n = list.length, tA = new Float32Array(n * 3), tB = new Float32Array(n * 3), rA = new Float32Array(n * 3), rB = new Float32Array(n * 3),
      sAB = new Float32Array(n * 4), tS = new Float32Array(n * 4);
    list.forEach((t, i) => {
      tA.set(t.a.p, i * 3); tB.set(t.b.p, i * 3); rA.set(t.a.rise || [9, 0, 0], i * 3); rB.set(t.b.rise || [9, 0, 0], i * 3);
      sAB.set([...(t.a.sway || [0, 0]), ...(t.b.sway || [0, 0])], i * 4); tS.set([t.sag, t.phase, t.t0, t.t1], i * 4);
    });
    return { tA: [tA, 3], tB: [tB, 3], rA: [rA, 3], rB: [rB, 3], sAB: [sAB, 4], tS: [tS, 4] };
  }
  // makeBackdrop(): the dome. Add it to the scene once; it follows whatever camera draws it.
  function makeBackdrop() {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), backdropMaterial());
    m.frustumCulled = false; m.renderOrder = -0.9; m.add(makeShadeLay()); return m;
  }
  const size = new THREE.Vector2();
  function update(dt, time, camera) {
    uniforms.uTime.value = time;
    if (camera && ctx.renderer) {
      ctx.renderer.getDrawingBufferSize(size);
      const h = Math.max(size.y, 1); uniforms.uPix.value.set(2 / (Math.max(camera.projectionMatrix.elements[5], 1e-3) * h), h);
    }
  }
  return { glsl: { G_COMMON, G_RISE, G_LATHE, G_SHADE, G_PEN, V_OUT, V_TAIL, F_FORM, F_TONE, G_THREAD, PN, PTYPES }, U, palette, uniforms, profiles: prof, formMaterial, meshMaterial, meshShadowMaterial, meshShadow, laid, SHADE_ORDER, bladeMaterial, threadMaterial, beadMaterial, backdropMaterial,
    asDouble, atDraw, topY, makeBackdrop, gridGeometry, stripGeometry, quadGeometry, instanced, formAttrs, threadAttrs, pointOn, bodySample, update, dispose() { prof.tex.dispose(); }, SHADOW_LEN,
    MIRROR_ORDER: -0.5 };   // renderOrder for mirrored doubles: after the backdrop, before everything real
}

// ---------- the mother-form: a pierced ring swelling below into a hanging drop ----------
const DEG = Math.PI / 180, PITCH = 50 * DEG;
const HOLE = new THREE.Vector3(0, 118, -15), HOLE_R = 7.5;
const AX = new THREE.Vector3(0, Math.sin(PITCH), -Math.cos(PITCH));     // the hole's axis = the last 60 m of the flight (local)
const UPV = new THREE.Vector3(0, Math.cos(PITCH), Math.sin(PITCH));     // "up" within the ring's plane
// shape = { swellAt, swell }: a second, smaller swelling somewhere round the ring (per seed)
function motherGeometry(shape, nu, nv, na, nl) {
  const X = new THREE.Vector3(1, 0, 0), pos = [], tip = [], soft = [], idx = [];
  const rt = (ph) => { const k = 0.5 + 0.5 * Math.cos(ph), d = Math.atan2(Math.sin(ph - shape.swellAt), Math.cos(ph - shape.swellAt));
    return 2.0 + 3.6 * Math.pow(k, 1.5) + shape.swell * Math.exp(-d * d / 0.18); };
  const e = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < nu; i++) {
    const ph = (i / nu) * TAU, r = rt(ph);
    e.copy(UPV).multiplyScalar(-Math.cos(ph)).addScaledVector(X, Math.sin(ph));
    for (let j = 0; j < nv; j++) {
      const th = (j / nv) * TAU;
      p.copy(HOLE).addScaledVector(e, HOLE_R + r + r * Math.cos(th)).addScaledVector(AX, r * Math.sin(th) * 0.92);
      pos.push(p.x, p.y, p.z); tip.push(0); soft.push(0.18);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * nv + j, b = ((i + 1) % nu) * nv + j, c = i * nv + (j + 1) % nv, d = ((i + 1) % nu) * nv + (j + 1) % nv;
    idx.push(a, c, b, c, d, b);
  }
  // the drop: leaves the ring's thick underside along the ring's own plane, then gravity takes it
  const r0 = rt(0), base = pos.length / 3, yTop = HOLE.y + UPV.y * (HOLE_R + 2 * rt(Math.PI)), yTip = yTop - 58;
  const c = new THREE.Vector3().copy(HOLE).addScaledVector(UPV, -(HOLE_R + r0 + 1.6)), line = [], step = 0.25;
  let l = 0;
  while (c.y > yTip && l < 80) { const k = THREE.MathUtils.smoothstep(l, 2, 20), al = PITCH * (1 - k);
    line.push([c.y, c.z, al]); c.y -= Math.cos(al) * step; c.z -= Math.sin(al) * step; l += step; }
  const Ld = l, R = (s) => (1.25 + 3.1 * Math.exp(-((s / 0.2) ** 2)) + 4.1 * Math.exp(-(((s - 0.7) / 0.165) ** 2))) * Math.pow(Math.min(1, (1 - s) / 0.13), 0.72);
  for (let i = 0; i <= nl; i++) {
    const s = Math.pow(i / nl, 0.9), q = line[Math.min(line.length - 1, Math.round(s * (line.length - 1)))], al = q[2], r = i === nl ? 0 : R(s);
    for (let j = 0; j < na; j++) {
      const ps = (j / na) * TAU, cs = Math.cos(ps) * r, sn = Math.sin(ps) * r;   // circle in the plane of X and (0, sin al, -cos al)
      pos.push(cs, q[0] + sn * Math.sin(al), q[1] - sn * Math.cos(al)); tip.push(s); soft.push(0.18 + 0.4 * THREE.MathUtils.smoothstep(s, 0.12, 0.4) * (1 - THREE.MathUtils.smoothstep(s, 0.85, 1)));
    }
  }
  for (let i = 0; i < nl; i++) for (let j = 0; j < na; j++) {
    const a = base + i * na + j, b = base + (i + 1) * na + j, cc = base + i * na + (j + 1) % na, d = base + (i + 1) * na + (j + 1) % na;
    idx.push(a, b, cc, cc, b, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
  g.setAttribute('aSoft', new THREE.Float32BufferAttribute(soft, 1)); g.setIndex(idx); g.computeVertexNormals();
  // at the root of the drop, shade with the ring's own normal so the join has no crease (the law: no facet, no seam)
  const nor = g.getAttribute('normal'), n = new THREE.Vector3(), nt = new THREE.Vector3(), rel = new THREE.Vector3();
  for (let v = base; v < pos.length / 3; v++) {
    p.fromArray(pos, v * 3); rel.copy(p).sub(HOLE);
    const ph = Math.atan2(rel.x, -rel.dot(UPV)), r = rt(ph);
    e.copy(UPV).multiplyScalar(-Math.cos(ph)).addScaledVector(X, Math.sin(ph));
    nt.copy(p).sub(HOLE).addScaledVector(e, -(HOLE_R + r)); const dist = nt.length() - r;
    const w = 1 - THREE.MathUtils.smoothstep(dist, 0.3, 7);
    n.fromBufferAttribute(nor, v).lerp(nt.normalize(), w).normalize(); nor.setXYZ(v, n.x, n.y, n.z);
  }
  g.userData = { tipPoint: new THREE.Vector3(0, c.y, c.z), yTop, Ld, rt, dropTop: new THREE.Vector3().copy(HOLE).addScaledVector(UPV, -(HOLE_R + r0)) };
  return g;
}

// the reference line of flight in local space (front = +Z, so the camera arrives from +Z): 35 deg up to 43 m, 14 deg over the
// mirror, then 50 deg into the hole
const FLY = [[0, 0, 200], [0, 43, 138], [0, 72, 23.6], [0, 118, -15]];
function distToFly(x, y, z) {
  let best = 1e9;
  for (let i = 0; i < FLY.length - 1; i++) {
    const a = FLY[i], b = FLY[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / (dx * dx + dy * dy + dz * dz)));
    best = Math.min(best, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t, z - a[2] - dz * t));
  }
  return best;
}

export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, opts), rng = ctx.rng, P = style.profiles;
  const detail = Math.min(1, Math.max(0.5, opts.detail ?? ctx.quality?.detail ?? 1));
  const prog = { value: 0 }, group = new THREE.Group(), ss = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp;
  const ext = [];                                        // widest half-extent of each body type, in heights
  for (let ty = 0; ty < PTYPES; ty++) { let m = 0; for (let i = 0; i <= 40; i++) { const [r, cx] = P.at(ty, i / 40); m = Math.max(m, Math.abs(cx) + r); } ext.push(m); }

  // ----- the colony: rings of bodies, tallest by the aisle, standing on needle points and on one another -----
  const wT = []; for (let i = 0; i < PTYPES; i++) wT.push(rng.range(0.4, 1.6));
  const pickType = (set) => { let s = 0; for (const t of set) s += wT[t]; let r = rng() * s; for (const t of set) { r -= wT[t]; if (r <= 0) return t; } return set[0]; };
  const accentBias = rng.int(0, 2), aisle = 8 + rng.range(0, 1.5), twist = rng.range(0, TAU), rings = 9;
  const pickAccent = () => (rng.chance(0.5) ? accentBias : rng.int(0, 2));
  const forms = [], ground = [];
  const hangFor = (f, total) => {
    const rho = Math.hypot(f.x, f.z + 8), shape = Math.pow(Math.sin(Math.PI * Math.min(1, rho / 60)), 0.8);
    let hf = 15 + Math.max(0, 86 - total) * shape * rng.range(0.7, 1);
    if (Math.abs(f.x) < 18 && f.z < 2 && f.z > -48) hf = Math.max(8, Math.min(hf, 58 - total));   // under the mother's drop
    return hf;
  };
  const crowded = (f) => { for (const g of ground) if (Math.hypot(g.x - f.x, g.z - f.z) < (g.w + f.w) * 0.92 + 0.15) return true; return false; };
  // height falls away from the choir under the mother's drop; the bodies flanking the aisle are the columns of the nave
  const tallAt = (x, z) => { const d = Math.hypot(x * 0.9, z + 15) / 60, nave = z > -24 && Math.abs(x) < 20 ? 0.2 : 0;
    return Math.pow(Math.max(0, Math.min(1, 1 - d + nave)), 1.15); };
  for (let k = 0; k < rings; k++) {
    const rho0 = 12.5 + k * 5.25;
    let ang = twist + k * 0.71, prevW = 0; const end = ang + TAU;
    while (ang < end) {
      const rho = rho0 + rng.range(-1.6, 1.6), gap = rng.range(0.4, 2.2 + k * 0.25), keep = rng() < detail || k < 5;
      ang += (prevW * 1.1 + gap) / rho;
      const x = Math.sin(ang) * rho, z = Math.cos(ang) * rho;
      const H = Math.min(40, Math.max(2, lerp(2.6, 36, tallAt(x, z)) * rng.range(0.62, 1.22)));
      const type = pickType(H >= 14 ? [1, 2, 3, 4, 5, 6] : (H >= 5 ? [1, 2, 3, 4, 5, 6, 7, 8, 0] : [0, 6, 5, 7, 8, 3, 2, 0]));
      const fat = rng.range(0.85, 1.2) * (H > 18 ? 0.9 : 1) * (type === 0 ? (H > 6 ? 0.6 : 0.9) : 1) * (type >= 7 ? 0.85 : 1), w = ext[type] * H * fat;
      const f = { x, y: 0, z, H, yaw: rng.range(0, TAU), type, fat, accent: pickAccent(),
        rel: 0, hang: 0, phase: rng(), dip: rng.range(0.04, 0.11) * (type === 7 || type === 8 ? 0.6 : 1) * DIPK[type], w, kids: 0, top: H };
      ang += (w * 1.1) / rho; prevW = 0;
      // (ground round) THE HUNG COLONY IS A FEW LARGE BODIES, not a thicket: of the ring bodies under 9 m two in three are left out
      if ((f.z > -24 && Math.abs(f.x) - w < aisle) || !keep || crowded(f) || (H < 9 && f.phase < 0.66)) continue;       // the aisle the flight comes up
      f.rel = 0.5 * (1 - Math.min(1, Math.hypot(f.x, f.z) / 56)) + rng.range(0, 0.06);
      forms.push(f); ground.push(f);
    }
    await ctx.yield();
  }
  // the small fry between the rings: knee-high to twice a head, wherever there is room
  for (let i = 0, want = Math.round(105 * detail); i < 900 && ground.length < want; i++) {
    const rho = 57 * Math.sqrt(rng()), a = rng.range(0, TAU), H = 2 + 5 * Math.pow(rng(), 2.2), type = pickType([0, 6, 5, 7, 8, 3, 2, 4, 1]);
    const fat = rng.range(0.9, 1.3) * (type === 0 ? 0.85 : 1), w = ext[type] * H * fat;
    const f = { x: Math.sin(a) * rho, y: 0, z: Math.cos(a) * rho, H, yaw: rng.range(0, TAU), type, fat, accent: pickAccent(),
      rel: 0, hang: 0, phase: rng(), dip: rng.range(0.05, 0.13) * (type >= 7 ? 0.6 : 1) * DIPK[type], w, kids: 0, top: H };
    if ((f.z > -24 && Math.abs(f.x) - w < aisle) || crowded(f)) continue;
    f.rel = 0.5 * (1 - Math.min(1, rho / 56)) + rng.range(0, 0.06);
    forms.push(f); ground.push(f);
    if (i % 100 === 99) await ctx.yield();
  }
  // bodies balanced on bodies: on a tip, or on the crown of an arch or a bridge
  const parents = ground.filter((f) => f.H >= 4.5 && f.type !== 5), nKids = Math.round(34 * detail);
  for (let i = 0, made = 0; i < 400 && made < nKids && parents.length; i++) {
    let par = rng.pick(parents); const again = rng.pick(parents), deep = rng.chance(0.3);
    if (par.kids > 0 && again.kids === 0) par = again;
    const host = deep && par.kid && par.kid.H >= 4 && par.kid.type < 5 && !par.kid.kid ? par.kid : par;
    const crown = host.type >= 7, at = style.pointOn(host, crown ? 0.5 : 1), H = Math.max(1.6, host.H * rng.range(0.2, 0.46));
    const type = pickType(H > 6 ? [0, 1, 2, 3, 6] : [0, 0, 2, 6, 3, 8]), fat = rng.range(0.8, 1.15) * (type === 0 && H > 5 ? 0.75 : 1);
    const lift = crown ? P.at(host.type, 0.5)[0] * host.H * host.fat : 0;
    const f = { x: at.p[0], y: at.p[1] + lift, z: at.p[2], H, yaw: rng.range(0, TAU), type, fat, accent: pickAccent(), rel: par.rel, hang: 0,
      phase: par.phase, dip: rng.range(0.05, 0.14) * DIPK[type], w: ext[type] * H * fat, kids: 0, top: 0,
      sway: host === par ? [at.sway[0], at.sway[1], par.phase] : (par.kidSway || [0, 0, 0]), parent: par };
    if (host.kid) continue;
    host.kid = f; if (host === par) par.kidSway = f.sway; par.kids++; par.top = Math.max(par.top, f.y + H); forms.push(f); made++;
  }
  for (const f of ground) f.hang = hangFor(f, f.top);
  // the fourteen largest wear deep caps of colour (coral, lemon, turquoise in turn), the rest of the tall ones a clear dip
  ground.filter((f) => f.H >= 12).sort((a, b) => b.H - a.H).forEach((f, i) => { f.dip = (i < 14 ? 0.26 : 0.16) * (f.type >= 7 ? 0.6 : 1); if (i < 14) { f.accent = i % 3; f.cap = true; f.fat *= 1.22; } });
  for (const f of forms) if (f.parent) f.hang = f.parent.hang;
  // the escort: six slim bodies that stand beside the foot of the aisle and, hung, flank the last 20 m of the flight just
  // under the mother's ring, so that the eye still has something near to pass when the ring fills the view
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, j = i >> 1, type = [3, 0, 6, 2, 0, 4][i], H = 8 + 0.7 * j + 0.5 * (i % 2), fat = type === 0 ? 0.62 : type === 2 ? 1.25 : 0.9;      // (ground round: with deep caps: coloured forms round the ring)
    const a = side * [10.2, 10.6, 9.9][j], sAlong = [8.6, 10.2, 11.8][j] + 0.5 * (i % 2), b = [-3.6, 0.7, 4.3][j] + 0.6 * (i % 2);
    const mid = new THREE.Vector3().copy(HOLE).addScaledVector(AX, -sAlong).addScaledVector(UPV, b);
    const fe = { x: a, y: 0, z: mid.z, H, yaw: i * 1.7 + twist, type, fat, accent: (accentBias + i) % 3, rel: 0.38 + 0.012 * i, hang: mid.y - H * 0.5,
      phase: (i * 0.618 + 0.21) % 1, dip: 0.26, w: ext[type] * H * fat, kids: 0, top: H, escort: true };
    for (let k = ground.length - 1; k >= 0; k--) {          // the small fry standing where an escort stands give way
      const g = ground[k]; if (g.escort || g.kids > 0 || Math.hypot(g.x - fe.x, g.z - fe.z) >= (g.w + fe.w) * 0.92 + 0.15) continue;
      ground.splice(k, 1); forms.splice(forms.indexOf(g), 1);
    }
    forms.push(fe); ground.push(fe);
  }
  // (fix round 9) THE NEAR RANK: three capped bodies of the innermost ring, the last to let go. They come up beside the line of
  // flight during the last climb and hang at the lower left and the lower right of the ring as it is seen from 38 m short of the
  // hole (u 0.94), 26-44 m from that eye (whole in the frame there and a hundredth of the course later), a quarter to a third of the frame tall and whole inside it: the near of that picture.
  // [screen x, screen y of its middle (640 by 360), metres from that eye, height, type, girth, release]
  [[165, 215, 26, 12, 6, 0.9, 0.62], [480, 220, 28, 13.5, 3, 0.9, 0.6], [520, 185, 44, 15, 4, 0.9, 0.58]].forEach(([px, py, D, H, type, fat, rel], i) => {
    const mid = new THREE.Vector3().copy(HOLE).addScaledVector(AX, D - 38).addScaledVector(UPV, (180 - py) * D / 300);
    const fe = { x: (px - 320) * D / 300, y: 0, z: mid.z, H, yaw: i * 2.3 + twist, type, fat, accent: (accentBias + i + 1) % 3, rel, hang: mid.y - H * 0.5,
      phase: (i * 0.618 + 0.47) % 1, dip: 0.26, w: ext[type] * H * fat, kids: 0, top: H, escort: true };
    for (let k = ground.length - 1; k >= 0; k--) {
      const g = ground[k]; if (g.escort || g.kids > 0 || Math.hypot(g.x - fe.x, g.z - fe.z) >= (g.w + fe.w) * 0.92 + 0.15) continue;
      ground.splice(k, 1); forms.splice(forms.indexOf(g), 1);
    }
    forms.push(fe); ground.push(fe);
  });
  await ctx.yield();

  // (fix round 8) opts.adjust(forms): the world may move bodies a little before anything is strung or ruled (a body and what stands on it)
  if (opts.adjust) opts.adjust(forms);
  // THE RULED MIRROR (fix round 2): which of the colony's needles are drawn from the air (world x = -x, world z = 400 - z)
  const ruler = opts.ruler || makeRuler();
  { const byH = ground.filter((f) => f.H >= 9).sort((a, b) => b.H - a.H); let n = 0;
    for (const f of byH) { if (n >= (opts.ruledMax ?? 14)) break; if (ruler.tryNeedle(-f.x, 400 - f.z, f.H)) { f.ruled = true; n++; } } }

  // ----- the mother -----
  const shape = { swellAt: rng.sign() * rng.range(1.5, 2.5), swell: rng.range(0.5, 1.3) };
  const motherG = motherGeometry(shape, 96, 28, 28, 40), ud = motherG.userData; await ctx.yield();
  const motherLow = motherGeometry(shape, 64, 16, 16, 24); await ctx.yield();
  const motherFlat = motherGeometry(shape, 48, 8, 12, 16); await ctx.yield();
  const mother = new THREE.Mesh(motherG, style.meshMaterial({ accent: style.palette.coral, dip: 0.5 }));
  const motherMirror = style.atDraw(new THREE.Mesh(motherLow, style.meshMaterial({ accent: style.palette.coral, dip: 0.5, mirror: true, top: style.topY(motherLow) })));      // (the thirteenth round: top = the mesh's own top, for the dawn fade; atDraw: the tone's rectangle is read at its draw)
  const motherShadow = style.meshShadow(motherFlat, { footY: ud.tipPoint.y, axis: ud.tipPoint, airSlim: 0.3 });
  motherMirror.renderOrder = style.MIRROR_ORDER;
  for (const m of [mother, motherMirror, motherShadow]) { m.frustumCulled = false; group.add(m); }

  // ----- threads: the fan to the mother, neighbour to neighbour, and each body's line to the shadow it leaves -----
  const X = new THREE.Vector3(1, 0, 0), v = new THREE.Vector3(), e = new THREE.Vector3();
  const onMother = (x) => { const ph = Math.max(-1, Math.min(1, x / 38)) * 1.9 + rng.range(-0.25, 0.25), r = ud.rt(ph);
    e.copy(UPV).multiplyScalar(-Math.cos(ph)).addScaledVector(X, Math.sin(ph));
    v.copy(HOLE).addScaledVector(e, HOLE_R + r * 1.85).addScaledVector(AX, -r * 0.3); return { p: [v.x, v.y, v.z] }; };
  const clear = (a, b) => { for (let h = 0; h < 2; h++) for (let i = 0; i <= 8; i++) { const s = i / 8, ha = h * (a.rise ? a.rise[1] : 0), hb = h * (b.rise ? b.rise[1] : 0);
    if (distToFly(lerp(a.p[0], b.p[0], s), lerp(a.p[1] + ha, b.p[1] + hb, s), lerp(a.p[2], b.p[2], s)) < 5) return false; } return true; };
  const topOf = (f) => (f.kid ? (f.kid.kid || f.kid) : f), tipOf = (f) => { const t = topOf(f); return style.pointOn(t, t.type >= 7 ? 0.5 : 1); };
  const threads = [], len = (a, b) => Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
  const span = (f) => 0.2 + 0.0022 * f.hang;
  // (ground round) THE FAN IS A FEW BOLD LINES: one taut thread from the mother to each of the capped bodies (a dozen and a
  // a half at most), each with one knot of colour sliding on it; the neighbour-to-neighbour hairs are one in six of what they were
  let fanI = 0; const fan = [];
  for (const f of ground) {                                  // the fan
    if (++fanI % 80 === 0) await ctx.yield();
    const want = f.H >= 9 && rng.chance(0.45), a = tipOf(f), b = onMother(f.x), ph = rng(), bd = rng.chance(0.5);
    if (!f.cap || !clear(a, b)) continue;
    fan.push({ a, b, sag: len(a, b) * 0.05, phase: ph, t0: f.rel + 0.03, t1: f.rel + span(f), acc: fan.length % 2 });
  }
  await ctx.yield();
  for (let i = 0; i < ground.length; i++) {                  // neighbour to neighbour, tip to tip and tip to waist
    if (i % 40 === 39) await ctx.yield();
    const f = ground[i]; let best = null, bd = 16;
    for (let j = 0; j < ground.length; j++) { const g = ground[j]; if (g === f) continue; const d = Math.hypot(g.x - f.x, g.z - f.z);
      if (d < bd && d > 2 && (j > i || d > 7)) { bd = d; best = g; } }
    const toTip = rng.chance(0.5), want = rng.chance(0.5);
    if (!best || !want || f.phase > 0.16 || Math.abs(f.hang - best.hang) > 6) continue;
    const a = tipOf(f), b = toTip ? tipOf(best) : style.pointOn(best, best.type >= 7 ? 0.25 : 0.45);
    if (!clear(a, b)) continue;
    const t0 = Math.max(f.rel, best.rel) + 0.05;
    threads.push({ a, b, sag: len(a, b) * 0.09, phase: rng(), t0, t1: t0 + 0.25, bead: rng.chance(0.45) });
    if (i % 60 === 0) await ctx.yield();
  }
  const strung = threads.length;
  for (const f of ground) { const c = rng.chance(0.3);      // paid out to the shadow (every ruled needle keeps its line, seen from any distance)
    if (f.cap) threads.push({ a: style.pointOn(f, 0), b: { p: [f.x, 0, f.z] }, sag: 0, phase: f.ruled ? 0.97 : 0.3 + 0.7 * f.phase, t0: 2, t1: 3 }); }
  threads.push({ a: { p: ud.tipPoint.toArray() }, b: { p: [ud.tipPoint.x, 0, ud.tipPoint.z] }, sag: 0, phase: 1.3, t0: 1.2, t1: 1.3 });   // the mother's one thread
  await ctx.yield();

  // ----- meshes: two levels of body, their doubles in the tide, their blades, the rigging and its pearls -----
  // how finely each body is turned is decided by how large it ever stands in the eye along the line of flight (its
  // height over its distance, with the rising played through), not by its size: three levels, all with exact outlines
  const flyAt = (q) => { const L = [75.5, 118, 60.2], d = q * 253.7; let i = 0, r = d; while (i < 2 && r > L[i]) { r -= L[i]; i++; } const k = Math.min(1, r / L[i]);
    return [0, lerp(FLY[i][1], FLY[i + 1][1], k), lerp(FLY[i][2], FLY[i + 1][2], k), FLY[i + 1][1] - FLY[i][1], FLY[i + 1][2] - FLY[i][2]]; };
  const flyS = []; for (let i = 0; i <= 28; i++) flyS.push(flyAt(i / 28));
  for (let n = 0; n < forms.length; n++) {
    const f = forms[n], g = f.parent || f; let m = 0;
    if (n % 120 === 119) await ctx.yield();
    for (let i = 0; i <= 28; i++) {
      const q = i / 28, c = flyS[i], u = 0.45 + 0.55 * q, pr = Math.min(1, Math.max(0, (u - 0.5) / 0.4));
      let k = Math.min(1, Math.max(0, (pr - g.rel) / (0.2 + 0.0022 * g.hang))); k = k * k * (3 - 2 * k);
      const dy = f.y + g.hang * k + f.H * 0.5 - c[1], dz = f.z - c[2], dist = Math.hypot(f.x, dy, dz), tl = Math.hypot(c[3], c[4]);
      const ahead = (dy * c[3] + dz * c[4]) / (tl * Math.max(dist, 1e-3));
      if (ahead > 0.25) m = Math.max(m, f.H / Math.max(dist - f.H * 0.4, 4));
    }
    f.seen = m;
  }
  const order = forms.slice().sort((a, b) => b.seen - a.seen), nHi = Math.round(44 * detail), nMd = Math.round(130 * detail);
  const hi = order.slice(0, nHi), md = order.slice(nHi, nHi + nMd), lo = order.slice(nHi + nMd);
  // (fix round 8) THE MOBILE DOUBLED IN THE TIDE: the capped bodies (and whatever is balanced on them) keep their doubles when they
  // have gone up, each WHOLE and upside down in dove under its own shadow; every other double lets go with its body (sink), so
  // the tide under the ring holds a dozen whole figures and not a heap of squashed ones
  const mat = style.formMaterial({ prog }), matMirror = style.formMaterial({ prog, mirror: true, sink: true }), matWhole = style.formMaterial({ prog, mirror: true, whole: true });
  await ctx.yield();
  const meshHi = style.instanced(style.gridGeometry(16, 24), mat, hi.length, style.formAttrs(hi));
  const meshMd = style.instanced(style.gridGeometry(8, 14), mat, md.length, style.formAttrs(md)); await ctx.yield();
  const meshLo = style.instanced(style.gridGeometry(8, 9), mat, lo.length, style.formAttrs(lo)); await ctx.yield();
  await ctx.yield();
  const all = style.formAttrs(forms);
  // (ground round) THE MOBILE IS DOUBLED IN THE WET SAND: the doubles of the bodies that stand large are turned as curves
  // (fix round 7) from the air only the doubles of bodies of 12 m and over are drawn (dblKeep): every one of those is turned as a curve
  const isCap = (f) => f.cap || (f.parent && f.parent.cap), capD = forms.filter(isCap);
  const loBig = lo.filter((f) => f.H >= 10.5 && !isCap(f)), loSmall = lo.filter((f) => f.H < 10.5 && !isCap(f));
  const doublesCap = style.instanced(style.gridGeometry(8, 16), matWhole, capD.length, style.formAttrs(capD)); doublesCap.renderOrder = style.MIRROR_ORDER;
  const bigD = hi.concat(md).filter((f) => !isCap(f)).concat(loBig), doubles = style.instanced(style.gridGeometry(4, 4), matMirror, loSmall.length, style.formAttrs(loSmall)); doubles.renderOrder = style.MIRROR_ORDER;
  const doublesBig = style.instanced(style.gridGeometry(8, 12), matMirror, bigD.length, style.formAttrs(bigD)); doublesBig.renderOrder = style.MIRROR_ORDER;
  const iK = new Float32Array(forms.length); forms.forEach((f, i) => { iK[i] = f.ruled ? 1 : (f.cap || f.escort) ? 0.3 : 0; });      // (fix round 9: on the rare tide the capped bodies and the escort beside the hole draw their shadows up too, so the tails are seen in the last climb)
  const blades = style.instanced(style.stripGeometry(12), style.bladeMaterial({ prog, pick: true }), forms.length, Object.assign({}, all, { iK: [iK, 1] })); await ctx.yield();
  const rig = style.instanced(style.stripGeometry(8), style.threadMaterial({ prog, keep: FAN_KEEP }), threads.length, style.threadAttrs(threads)); await ctx.yield();
  const beaded = threads.slice(0, strung).filter((t) => t.bead), bAttr = style.threadAttrs(beaded), bP = new Float32Array(beaded.length * 2);
  for (let i = 0; i < beaded.length; i++) { bP[i * 2] = rng(); bP[i * 2 + 1] = rng.range(0.025, 0.07) * rng.sign(); }
  const pearls = style.instanced(style.quadGeometry(), style.beadMaterial({ prog, keep: FAN_KEEP }), beaded.length, Object.assign(bAttr, { bP: [bP, 2] }));
  const fanHide = { value: 0 };
  // (fix round 7) HER FAN IS A DOZEN BLACK HAIRS, as every line of the world is; the colour is the one bead that slides on each
  const fanOf = (k) => { const L = fan.filter((t) => t.acc === k);
    return style.instanced(style.stripGeometry(8), style.threadMaterial({ prog, keep: [4000, 0], width: 0.045, hide: fanHide }), L.length, style.threadAttrs(L)); };
  const rigFan = fanOf(0), rigFan2 = fanOf(1); await ctx.yield();
  const knots = [0, 1].map((k) => { const L = fan.filter((t) => t.acc === k), kp = new Float32Array(L.length * 2);
    for (let i = 0; i < L.length; i++) { kp[i * 2] = (i * 0.37 + 0.2 * k) % 1; kp[i * 2 + 1] = 0.012 + 0.008 * ((i * 0.618) % 1); }
    return style.instanced(style.quadGeometry(), style.beadMaterial({ prog, keep: [4000, 0], radius: 0.62, color: k ? style.palette.turquoise : style.palette.coral, hide: fanHide }), L.length, Object.assign(style.threadAttrs(L), { bP: [kp, 2] })); });
  // (fix round 8) EVERY HAIR ENDS IN A BEAD at the foot of the body it is paid out from (a pearl, the bodies' own ivory)
  const hairs = threads.slice(strung, threads.length - 1), ends = style.instanced(style.quadGeometry(), style.beadMaterial({ prog, keep: FAN_KEEP, radius: 0.24, floorPx: 1.7, at: 0 }), hairs.length,
    Object.assign(style.threadAttrs(hairs), { bP: [new Float32Array(hairs.length * 2), 2] }));
  group.add(doubles, doublesBig, doublesCap, blades, meshLo, meshMd, meshHi, rig, pearls, ends, rigFan, rigFan2, knots[0], knots[1]);
  const standalone = !opts.style;
  if (standalone || opts.backdrop) group.add(style.makeBackdrop());
  await ctx.yield();

  let auto = standalone;
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  return {
    object: group, radius: 62, height: 126, center: new THREE.Vector3(0, 52, -8), ground: false, groundY: 0, style, progress: prog,
    counts: { forms: forms.length, ground: ground.length, threads: threads.length, beads: beaded.length }, ruler,
    anchors: {
      portalSeat: { position: HOLE.clone(), axis: AX.clone(), facing: AX.clone().negate(), radius: 7, pitch: PITCH },
      flyThrough: FLY.map(V3), holeCenter: HOLE.clone(), holeRadius: HOLE_R,
      motherTip: ud.tipPoint.clone(), motherTop: new THREE.Vector3(0, ud.yTop, HOLE.z + UPV.z * (HOLE_R + 4)),
      shadowFoot: new THREE.Vector3(ud.tipPoint.x, 0, ud.tipPoint.z), aisleHalfWidth: aisle,
      viewpoints: { entry: new THREE.Vector3(0, 1.7, 400), lift: new THREE.Vector3(0, 43, 138), threeQuarter: new THREE.Vector3(85, 34, 95), under: new THREE.Vector3(0, 72, 23.6) },
    },
    // (past 0.92 the fan lets go: by 1.02 no line lies in front of the ring)
    setProgress(u) { auto = false; prog.value = Math.min(1.2, Math.max(0, u)); fanHide.value = ss(prog.value, 0.92, 1.02); },
    update(dt, time, camera) {
      if (standalone) style.update(dt, time, camera);
      if (auto) {                                           // the viewer's demonstration: tide in, colony up, and back
        prog.value = 0.5 - 0.5 * Math.cos(time * TAU / 48);
        style.uniforms.uTide.value.set(0, -1, (time - 1) * 16 - 70, 1);
      }
    },
    dispose() { if (standalone) style.dispose(); },
  };
}

// ---------- THE GIANTS (journey round) ----------
// The course no longer runs straight at the mother: it swings round great bodies (five then, six since the mass round), each a
// different form turned in the same hand and carrying one strong ink (the five each their own; the sixth, the needle's eye,
// wears the horn's vermilion). giantGeometry(kind, H, ns, na) -> BufferGeometry with position,
// normal (exact for the turned surface), aTip (where the ink lies: see each kind) and aSoft (mercury bulge, metres), for
// style.meshMaterial / meshShadowMaterial. Foot at the origin, +Y up, the body leaning or opening in its own XY plane.
//   lens    a pierced lens standing on a pin (aTip = 1 on the lip of the hole: dip 0.78 = the lining of the hole)
// (mass round) THE GIANTS ARE BROAD. The horn, the column, the hook and the arch are turned again in the same hand with real
// mass (each at least 0.45 as wide as it is tall across its main mass, deeply waisted or pierced), and one more kind stands
// between the hook and the arch. The ink is a dipped cap, a band or a lining, of the surface: the column's band 1.8%, the eye's
// lining 4.2%, the hook's collar 4.3%, the horn's cap 7.4% and the arch's lining 8.1% (those two as the lead ruled); the ring's
// lining, which is as it was, about 16%:
//   horn    a leaning gourd on a needle foot: a great belly, a deep waist, a small head (aTip = across a slanted dip plane: dip 0.72 = the cap of the head)
//   column  two great swellings and a pinched waist (aTip = 1 at the waist: dip 0.5 = the waist band)
//   hook    a thick stem with a swelling low down that curls right over into a great bud, a quarter broader across its plane
//           (aTip = 1 along the inside of the curl: dip 0.75 = the collar under the bud)
//   arch    one span on two needle feet, its tube 1.7 to 2.2 times what it was (aTip = a band along the inside, foot to foot: dip 0.8 = the lining of the soffit)
//   eye     a needle's eye: a tall pierced slab with rounded shoulders on a pin (aTip = 1 on the lip of the slot: dip 0.97 = its lining)
export function giantGeometry(kind, H, ns = 96, na = 36) {
  const pos = [], nor = [], tip = [], soft = [], idx = [];
  const g = (s, c, w, hold) => { const d = hold && s > c ? 0 : (s - c) / w; return Math.exp(-d * d); };
  const foot = (s, a) => Math.min(1, s / a + 0.04), crown = (s, b) => { const k = Math.min(1, (1 - s) / b); return Math.sqrt(Math.max(0, k * (2 - k))); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // tube(C, r, tipOf, n1, closed, zk): a body turned round a centreline C(s) lying in the XY plane; zk flattens it across
  function tube(C, r, tipOf, n1 = ns, closed = false, zk = 1) {
    const base = pos.length / 3, e = 1e-3;
    for (let i = 0; i <= n1; i++) {
      const s = i / n1, sc = closed ? s : Math.min(1 - e, Math.max(e, s));
      const c = C(s), a = C(sc - e), b = C(sc + e); let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const rr = r(s), dr = (r(sc + e) - r(sc - e)) / tl, nx = -ty, ny = tx;
      for (let j = 0; j < na; j++) {
        const th = (j / na) * TAU, ct = Math.cos(th), st = Math.sin(th), qx = ct * nx, qy = ct * ny;
        pos.push(c[0] + qx * rr, c[1] + qy * rr, st * rr * zk);
        const mx = qx - tx * dr, my = qy - ty * dr, mz = st / zk, ml = Math.hypot(mx, my, mz) || 1;
        nor.push(mx / ml, my / ml, mz / ml); tip.push(tipOf(s, qx, qy, st, c)); soft.push(closed ? 0.004 * H : 0.0055 * H * Math.sin(Math.PI * s));
      }
    }
    for (let i = 0; i < n1; i++) for (let j = 0; j < na; j++) { const a = base + i * na + j, b = base + i * na + (j + 1) % na, c2 = a + na, d = b + na; idx.push(a, b, c2, b, d, c2); }
  }
  if (kind === 'horn') {
    // a leaning gourd: the belly half a height across, a waist a fourteenth, a head a fifth. Its cap is dipped at a slant: the ink
    // line lies in one plane, 20 degrees off level, so on the flank the horn leans away from (the flank turned to the course)
    // the vermilion comes down to the neck and the small head reads whole; on the other flank it only tops the crown
    const R = (s) => H * (0.036 + 0.222 * g(s, 0.3, 0.165) + 0.07 * g(s, 0.88, 0.07, 1)) * foot(s, 0.07) * crown(s, 0.11);
    tube((s) => [0.26 * H * Math.pow(s, 1.8), H * (s - 0.1 * s * s * s) / 0.9], R,
      (s, qx, qy, qz, c) => 0.72 + (((c[1] + qy * R(s)) * 0.94 - (c[0] + qx * R(s)) * 0.342) / H - 0.786) * 4);
  } else if (kind === 'column') {
    // two great swellings, each half a height across and more, and a waist a twelfth through between them
    tube((s) => [0.04 * H * Math.sin(TAU * s * 0.9) * s, H * s],
      (s) => H * (0.034 + 0.25 * g(s, 0.25, 0.125) + 0.275 * g(s, 0.775, 0.125, 1)) * foot(s, 0.05) * crown(s, 0.225), (s) => g(s, 0.512, 0.062));
  } else if (kind === 'hook') {
    // the stem stands straight for two fifths of its length and then curls right over (3.3 radians); the great bud closes the curl
    const N = 256, cx = [0], cy = [0];
    for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N, k = Math.max(0, (u - 0.42) / 0.58), a = 3.3 * k * k * (3 - 2 * k); cx.push(cx[i - 1] + Math.sin(a) / N); cy.push(cy[i - 1] + Math.cos(a) / N); }
    const rr = (s) => (0.066 + 0.08 * g(s, 0.17, 0.15) + 0.175 * g(s, 0.9, 0.09, 1)) * foot(s, 0.05) * crown(s, 0.11);      // its radius, in heights
    let top = 0; for (let i = 0; i <= N; i++) top = Math.max(top, cy[i] / (1 - rr(i / N)));      // (its highest point, tube and all, is H)
    const at = (s) => { const f = Math.min(N - 1e-6, Math.max(0, s * N)), i = Math.floor(f), t = f - i; return [(cx[i] + (cx[i + 1] - cx[i]) * t) * H / top, (cy[i] + (cy[i + 1] - cy[i]) * t) * H / top]; };
    tube(at, (s) => H * rr(s),
      (s, qx, qy, qz, c) => { const a = at(Math.max(0, s - 0.004)), b = at(Math.min(1, s + 0.004)), tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return sm(0.44, 0.52, s) * (1 - sm(0.79, 0.85, s)) * (0.5 + 0.5 * (qx * (b[1] - a[1]) - qy * (b[0] - a[0])) / tl); }, ns, false, 1.25);      // (a quarter as broad again across its plane: edge on it is a body, not a stem)
  } else if (kind === 'arch') {
    // one span on two needle feet: the tube is 1.7 times what it was at the crown and 2.2 times along the legs; the coral is the
    // lining of the whole soffit, a band on the inside of the tube from foot to foot, an eighth of the tube's girth, laid from
    // the middle of the inside toward the face of the arch that is turned to the course (its own -Z face)
    tube((s) => [-0.345 * H * Math.cos(Math.PI * s), 0.92 * H * Math.pow(Math.max(Math.sin(Math.PI * s), 0), 0.62)],
      (s) => { const sp = Math.max(Math.sin(Math.PI * s), 0); return H * (0.014 + 0.085 * sp * sp) * (2.2 - 0.5 * Math.pow(sp, 8)) * Math.min(1, sp / 0.06 + 0.05); },
      (s, qx, qy, qz, c) => { const sp = Math.max(Math.sin(Math.PI * s), 0), dx = -c[0], dy = 0.4 * H - c[1], dl = Math.hypot(dx, dy) || 1;
        return sm(0.02, 0.08, sp) * (0.8 + 0.5 * (Math.cos(Math.atan2(-qz, Math.hypot(qx, qy) * Math.sign(qx * dx + qy * dy)) - 0.32) - Math.cos(0.39))); });
  } else if (kind === 'eye') {
    // a needle's eye: a ring drawn out tall and squared at the shoulders, heavier above than below, half as thick as it is broad.
    // Its shoulders are eased (the power of its outline 2.6, was 3.2) and its tube is a fifth thinner at the four shoulders, so
    // that everywhere the centreline bends on more than the tube's half thickness in its plane (at the tightest 0.156 H against
    // 0.132 H: 8.3 m against 7.0 m at 53 m) and the wall of the slot nowhere crosses itself; the slot keeps its corners
    const cyc = 0.522 * H, P4 = 2.6, C = (s) => { const th = TAU * s - Math.PI / 2, c = Math.cos(th), n = Math.sin(th), q = Math.pow(Math.pow(Math.abs(c), P4) + Math.pow(Math.abs(n), P4), -1 / P4);
      return [0.225 * H * c * q * (1 + 0.15 * n * q), cyc + 0.31 * H * n * q]; };
    const R = (s) => { const th = TAU * s - Math.PI / 2, d = Math.sin(2 * th); return 0.14 * H * (1 + 0.2 * Math.sin(th)) * (1 - 0.2 * d * d); };
    tube(C, R, (s, qx, qy, qz, c) => 0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - qz * qz)) * Math.sign(-c[0] * qx + (cyc - c[1]) * qy), ns, true, 0.5);
    const y1 = cyc - 0.31 * H - 0.8 * 0.14 * H + 0.012 * H;      // the pin it stands on
    tube((s) => [0, y1 * s], (s) => H * 0.012 * foot(s, 0.2) * (0.5 + 0.5 * s), () => 0, 6, false);
  } else {      // lens
    // (fix round 7) its face is a real curve from lip to rim (0.58 of a round ring, was 0.36: a flat face took one tone of the
    // painter's light over a fifth of the frame) and its hole is a quarter wider
    const R0 = 0.325 * H, cyc = 0.55 * H, TR = 0.158;
    tube((s) => [R0 * Math.cos(TAU * s - Math.PI / 2), cyc + R0 * Math.sin(TAU * s - Math.PI / 2)], (s) => TR * H * (1 + 0.1 * Math.cos(TAU * s + 0.6)),
      (s, qx, qy, qz) => 0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - qz * qz)) * Math.sign(qx * Math.cos(TAU * s - Math.PI / 2) + qy * Math.sin(TAU * s - Math.PI / 2)) * -1, ns, true, 0.58);
    const y1 = cyc - R0 - TR * H * (1 + 0.1 * Math.cos(0.6)) + 0.012 * H;      // the pin it stands on
    tube((s) => [0, y1 * s], (s) => H * 0.011 * foot(s, 0.2) * (0.5 + 0.5 * s), () => 0, 6, false);
  }
  const G = new THREE.BufferGeometry();
  G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  G.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1)); G.setAttribute('aSoft', new THREE.Float32BufferAttribute(soft, 1)); G.setIndex(idx);
  return G;
}
