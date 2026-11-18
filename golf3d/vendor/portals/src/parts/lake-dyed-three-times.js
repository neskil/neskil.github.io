// THE MASSIF OF THE LAKE DYED THREE TIMES: hero set piece of "lake-dyed-three-times", and the style kit of that world.
//
// A mountain made of silk warp ikat: seven hanging sheets of taut vertical threads, one behind another, 2.6 km wide
// and 900 m tall, each thread running from -top to +top so the lake's mirror is the same thread folded at y = 0.
// It starts white on white (told only by thread density and sheen) and takes its colours in the dyer's order:
// saffron to the spruce line, madder crimson up the gullies and through the poplar flames at its feet, indigo over
// the slopes (green where it crosses yellow, aubergine where it crosses crimson). Above the stepped snowline the
// summit's threads are gathered in bundles and wound in white cotton, so no dye takes; from 33 s the bindings unwind
// from the top and fall as twisting ribbons. The bound peak stands 230 m to starboard of the course; the crests in
// front carry their peaks to alternate sides and dip along the line of sight, so it is seen down a nest of notches.
// The nearest flank carries the exit on the axis in a lancet (a great ikat flame 112 m wide and 340 m tall, razor
// sided, its tip bound in cotton from 240 m up and the first to unbind): a lens-shaped parting 15 m wide and 34 m tall,
// threads swagged aside and tied back with two cotton bindings.
// THE WINDOW. The crests' own tops stand out at the sides and every crest dips to a fifth of its height on the line from
// the lake to the peak, so the summit sheet (bound in cotton from 500 m up, hung nearly close-set) stands in bare air as
// one white mountain. SKY TAPES: bare warp above the three nearest crests, drawn only while the eye is within a few
// hundred metres (packSkyTape), so the climb looks up into hung silk. RIBBONS: narrow cotton tapes (never wider than a
// fiftieth of the frame's height) that hang from the lancet's tip paying out, then let go and fall twisting, always
// away from the parting.
// HOISTING. The lancet is not standing while the lake is in open view: its threads end at the height of the flank beside
// it (uLancet) and run up to the bound tip between 22 and 25.6 s (HOIST), each a little behind the next; a bobbin of cotton
// hangs over the place of the parting until then and unwinds at about 25 s. So the massif (peak 130 m to starboard, white
// from 450 m, two shoulders, about 1.1 km of white) is seen whole from the lake. The world's spur towers are hoisted the
// same way (uHoist, PARTING threads whose slit is over 4.2 m; the thousandths of the slit carry the resting height).
// COVER. Flats are hung nearly close-set (COVER_K), a thread about to be dropped hands its width to the survivors, and no
// bare sky thread hangs on the line from the lake to the peak: tiers are solid colour. Threads with a bath delay under
// -20 s were dyed before the valley (the world's willows, houses, green reeds) and take no tide mark.
// COLOUR. The far massif takes each bath early and all at once (uEarly), so the mountain stands in tiers under its
// white peak while the lake is in open view; along the waterline every thread takes the madder over its saffron up
// to a tide mark (uFoot), which is what draws the fold as a waterline. All colours are display colours (post.flat).
//
// POLISH PASS 4. THE MIRROR IS DYED: below the fold dye() takes the same dye set one depth deeper (undyed silk in its shade,
// POLISH PASS 5. THE BELT OF SATIN: uBelt (eye height, the gaze's slope, half height per metre, strength) replaces uSheenY/W:
// on every sheet the belt is centred where the gaze meets it and is a third of the frame tall at any distance; the stripe is
// uTint[set], a paler tint of the thread's own dye made in HSL (never a mix toward white); wide threads carry a stripe, fine
// ones take the tint whole in runs (vCell); only cloth within about 50 m shows it. A creature's resist gap is tied through
// every sheet in front of it as well as behind, and cut off at its own fold. Thread lists are growing arrays (no array per
// thread); the crest scan of each sheet yields.
// cotton as plain silk); uLow now only tones the air shell under the fold. (superseded: SHEEN: a level band at the eye's height (uSheenY,
// uSheenW, set by the world each frame), two flat steps; a thread over five pixels carries the stripe, a finer one within
// about 100 m takes it whole, one in five. PARTINGS: reed curtains (slit under 3.9) are tied back as an avenue, the further
// the wider; spur towers (slit over 4.2) hang open on the climb's line once hoisted; threads pushed together in a sheaf are
// drawn finer (vSq). THE LANCET is a tied motif in every dye round the lens. The shift drops 4.6 x on the far massif.
// LOCAL SPACE  origin on the fold (y 0) at the foot of the nearest flank, +Y up, front toward +Z: the camera comes
//              from +Z flying toward -Z, starboard is +X. Sheets at z 0 (300 m), -250 (420), -480 (540), -700 (660),
//              -920 (780), -1150 (summit, 900), -1400 (shoulder, 700); four bare backdrop sheets at z -1750..-3200,
//              6.4 to 8.2 km wide, 1600 m tall both ways (opts.backdrop = false removes them). In the world's
//              course (camera toward +Z, massif from z 1000) place it at z 1000 with rotation.y = PI.
// SIZE         radius 1300, height 900 (and the same again below the fold; sky threads to +-1600).
// COST         about 95k triangles at detail 1 (16k threads), 7 draw calls (lens strips, plain strips, bound strips,
//              sky tapes, bindings, ribbons, air shell), 4 shader programs, no textures, no lights. Build 70-250 ms, yielding
//              every 128 threads (longest step 8-20 ms warm). Nothing is created or switched after build: all stages are uniforms.
// EXPECTS      A world with NO fog and post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1,
//              vignette: 0, grain: 0 } }: every colour here is a display colour, shown as written. Background: this piece draws its own
//              air shell (raw silk in shade #E3D8C6) unless opts.air = false; then use style.dyes.air as the
//              scene background. camera.far must reach 3400 m beyond the foothill for the backdrop sheets.
//
// OPTS         palette   7 hex, brief order (silk, saffron, crimson, indigo, flame, green, aubergine)
//              detail    0.6..1: thread pitch is divided by it, bindings and ribbons scale with it
//              style     a makeStyle() result to share with the rest of the world (recommended: make it first)
//              season 'late' | 'early' | 'first-snow' (snowline 450), weather 'still' | 'breezy', shift true|false
//              (the rare 30 m drop of every other bundle at 24 s); all seeded when omitted. air, airRadius, backdrop.
// PROGRESS     hero.setProgress(u) each frame BEFORE hero.update(dt, time, camera): the journey clock is u * 40 s
//              and drives the baths, breaths (9, 20, 33 s), gust (26 s), storks (10-30 s) and unbinding (33 s on).
//              Without it the piece plays its 40 s on a loop (viewer). Retime with BATHS / style.uniforms.uBath.
// ANCHORS      portalSeat { position (0,215,0), normal (0,-0.5,0.866) back down the approach, tiltDeg 30, radius 7 }
//              lens { center, halfWidth 7.6, halfHeight 17, tieBacks[2] }   clear opening of the parting
//              flyThrough[10]  safe line, +Z to -Z: level over the lake, then 30 degrees up through the parting
//              spurCrossings[3] where that line passes the world's three spur sheets (local z 300, 200, 100)
//              viewpoints { entry, image (18 s), climb }, summit, lookAt, sheets[{ z, height, pitch }]
//
// HOW THE STYLE IS MADE (exports; shade the whole world with these)
//   makeStyle(opts)          -> { uniforms, dyes, threadMaterial(), setClock(tJ), update(time, camera, renderer) }
//   STYLE_GLSL.vertex/.fragment  the thread shader: instanced strips in sheets of constant local z. Per thread:
//                            x, z, tops, four band heights, a recipe per band (1 saffron + 2 crimson + 4 indigo +
//                            8 starboard shade), slip, wick lag, keep level, pitch, bath delay, gust arrival.
//                            Colour is flat across a thread (vertical edges razor clean); bands and bath fronts are
//                            tested against height + the thread's own slip (horizontal edges step thread by thread);
//                            x1.7 slip and a ripple below the fold. Distance: threads are dropped by keep level and
//                            the survivors widened, coverage 45 %, never under 1.5 px. Sheen: a stripe a fifth of
//                            the thread wide in a level band (uSheenY) that rides with the eye and the clock.
//   stripGeometry(rows), skyStripGeometry(), packSkyTape(), makeSheetMesh(style, Float32Array, count, geometry, material), packThread(), keepLevel(),
//   SKY_TOP                  build your own sheets (wings, spurs, valley walls, curtains) exactly as the massif is.
//   makeDyeTable()           the 24 flat colours (display colours; the world runs post.flat = 1, no tone map).
//   BATHS, bathFront(d, tJ), BREATHS, GUST, UNBIND_T           the morning's clock.
//   uniforms worth knowing: uClock, uBreath, uGustAmp, uShift, uUnbind, uLens (x, y, sheet z, open), uLensSize,
//   uStork[24] (x, y, sheet z, pose; 9 gaps above the fold and their 9 late twins below, then 3 gaps and their 3 twins), uStorkSize, uCover, uMinPx, uRipple.
//   Partings elsewhere (curtains, spurs) need their own bow in a copy of the vertex shader: only the exit lens is built in.
// ADDED WITH THE WORLD  threadMaterial(true) compiles the same shader with PARTING: aAux.y is then the half width of a slit
//              and the threads bow round uPart (the eye in sheet space x, y, z; w = its climb per metre flown): reed
//              curtains and spurs. uDuck[9] (x, sheet z, heading): a wedge of extra slip in the reflection behind a
//              mallard knot. uStork[24] is 9 gaps + 9 twins, then 3 gaps + 3 twins; a gap is tied through every sheet behind it along the
//              eye's line (so cloth beyond does not dye it shut); uCast picks the shape (0 stork, 1 horse, 2 swan);
//              uHorseGrow (1 by default) scales the first nine gaps and their twins only (the world's wing horses).
//              opts.cast other than 'storks' leaves uStork to the world. uSway (thread shiver, share of pitch),
//              uSettle (s before a band deepens), a pinch knot on every thread at the fold. opts.skyShare, opts.skyCover.
// VIEWER ONLY  ?heroT=<clock s>  ?heroCam=r,h,x,y,z  (and globalThis.__heroT) pose the piece for screenshots.
import * as THREE from 'three';

// ------------------------------------------------------------------------------------------------------------
// EXACT COLOUR. The world runs with post.flat = 1: the engine skips its tone map, so the linear colour written is
// the colour shown (new THREE.Color('#B8252E') lands on #B8252E). Every colour here is therefore a plain display
// colour; there is no inverse tone map and no pre-correction of any kind.
// ------------------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------------------
// THE DYE TABLE. Three dyes in the dyer's order (bit 1 saffron, bit 2 madder crimson, bit 4 indigo) give eight
// sets; each set exists in three depths: 0 first strike (pale), 1 full, 2 deep. Nothing else is ever drawn.
// ------------------------------------------------------------------------------------------------------------
export const DEFAULT_PALETTE = ['#F4ECDD', '#E9A81C', '#B8252E', '#1F3A6E', '#DB5A1E', '#4F7A3C', '#47213F'];
export const AIR_HEX = '#E3D8C6';                       // raw silk in shade: the nothing between the sheets

/** palette (brief order: silk, saffron, crimson, indigo, flame, green, aubergine) -> the colours of the style.
 *  Returns { table: Float32Array(72) rgb for set*3+depth (displayTable is the same array of values), silk, air, sheen, cotton: THREE.Color,
 *  display: the 8 full-depth display colours }. */
export function makeDyeTable(palette = DEFAULT_PALETTE, exposure = 1, airHex = AIR_HEX) {
  const P = palette.map((h) => new THREE.Color(h));
  const silk = P[0];
  const full = [silk, P[1], P[2], P[4], P[3], P[5], P[6], P[6].clone().multiplyScalar(0.82)];   // index = dye set
  const table = new Float32Array(72), displayTable = new Float32Array(72), c = new THREE.Color(), o = new THREE.Color();
  for (let s = 0; s < 8; s++) {
    const top = s >= 4 ? 4 : s >= 2 ? 2 : s;            // the newest dye of the set
    const prev = full[s - top];                         // what was there before it struck
    for (let d = 0; d < 3; d++) {
      if (s === 0) c.copy(silk).multiplyScalar(d === 2 ? 0.93 : 1);
      else if (d === 0 && s === 4) {                    // indigo's first strike on bare silk: a pale blue of the indigo's own hue (a linear mix passes through grey)
        const hi = {}, hs = {}; full[4].getHSL(hi, THREE.SRGBColorSpace); silk.getHSL(hs, THREE.SRGBColorSpace);
        c.setHSL(hi.h, Math.min(1, hi.s * 0.82), hi.l + (hs.l - hi.l) * 0.5, THREE.SRGBColorSpace);
      }
      else if (d === 0) c.copy(prev).lerp(full[s], top === 2 ? 0.86 : 0.56);   // madder strikes strong at once; saffron and indigo strike pale
      else if (d === 1) c.copy(full[s]);
      else { c.copy(full[s]); c.setRGB(c.r * 0.66, c.g * 0.6, c.b * 0.62, THREE.LinearSRGBColorSpace); }   // one more dip
      displayTable.set([c.r, c.g, c.b], (s * 3 + d) * 3);
      table.set([c.r, c.g, c.b], (s * 3 + d) * 3);
    }
  }
  const sheenD = silk.clone().lerp(new THREE.Color(1, 1, 1), 0.75);
  // THE SATIN TINTS: the sheen on a dyed thread is a paler tint of that thread's own dye (same hue, made in HSL as indigo's
  // first strike is: a linear mix toward white takes the hue out of a dark dye and leaves grey): pale gold, rose, pale blue,
  // pale flame, leaf green, mauve. One per dye set; on undyed silk it is the cotton white.
  const tints = new Float32Array(24), hsl = {};
  for (let s = 0; s < 8; s++) {
    if (s === 0) c.copy(sheenD);
    else { full[s].getHSL(hsl, THREE.SRGBColorSpace); c.setHSL(hsl.h, Math.min(1, hsl.s * (hsl.l < 0.35 ? 0.9 : 1)), hsl.l + (0.93 - hsl.l) * 0.45, THREE.SRGBColorSpace); }
    tints.set([c.r, c.g, c.b], s * 3);
  }
  return {
    table, displayTable, display: full, sheenDisplay: sheenD, exposure, tints,
    silk: silk.clone(),
    air: new THREE.Color(airHex),
    cotton: silk.clone().lerp(new THREE.Color(1, 1, 1), 0.6),
  };
}

// ------------------------------------------------------------------------------------------------------------
// THE CLOCK OF THE MORNING. Everything scripted hangs on the journey clock tJ (seconds, 0..40 = u * 40).
// A bath front is a height above the fold:  front(tau) = rise*tau + accel*max(tau - knee, 0)^2,  tau = tJ - start
// - delay(sheet) - lag(thread). BATHS holds (start, rise, knee, accel) per dye; the same numbers go to the shader.
// ------------------------------------------------------------------------------------------------------------
export const BATHS = [
  [-27, 1.3, 36.7, 3.0],   // saffron: standing 35 m above the fold at the entry (the groves are gold from the first frame), creeping to the poplar tips by 10 s, then away up the banks and the massif
  [12.6, 4.2, 4.5, 11],      // madder crimson: a hairline at 13 to 14 s, through the lower third of the groves at 18 s
  [25, 6.0, 1, 15],        // indigo: enters at 25 s, passes the exit lens (215 m) at about 32 s, the snowline by 36 s
];
export const BREATHS = [9, 20, 33];                     // breaths of wind (s)
export const GUST = { t: 26, speed: 60, from: 2400 };    // the gust front: starts at course z 2400, runs toward -z
export const UNBIND_T = 33;                             // bindings let go from the top
export const HOIST = [22, 25.6];                      // the lancet that carries the exit is hoisted up out of the foothill flank (s)
/** height of bath `d` (0..2) at clock tau seconds on the journey clock, at a sheet with no delay. */
export function bathFront(d, tJ) {
  const b = BATHS[d], tau = tJ - b[0];
  if (tau <= 0) return -1;
  const k = Math.max(tau - b[2], 0);
  return b[1] * tau + b[3] * k * k;
}
// a pulse that rises, overshoots once and settles: 0 before, peak 1 at about 0.45 s, about -0.12 at 1.4 s
const pulse = (t) => (t <= 0 ? 0 : 2.05 * Math.exp(-1.75 * t) * Math.sin(2.35 * t));

// ------------------------------------------------------------------------------------------------------------
// THE STYLE: ONE THREAD SHADER. A thread is an instanced strip hanging in a sheet (a plane of constant local z),
// running from -top to +top, so its reflection is the same strip folded at y = 0.
// per-vertex   position = (side -0.5|+0.5, sign -1|+1, 0);  aRow = (a, b, c): |y| = min(a*geoTop + b*band4 + c, geoTop)
// per-instance aT0     = (x, z, geoTop, picTop)          picTop: where the picture ends (bare thread above it)
//              aBands  = (h1, h2, h3, h4)                tops of bands 0..3 in metres above the fold; band 4 is resist
//              aRecipe = (r0, r1, r2, r3)                per band: 1 saffron + 2 crimson + 4 indigo + 8 starboard shade (+ 16 dyed before the valley)
//              aRnd    = (slip metres, wick lag s, sheen phase 0..1, keep level: integer, higher survives further)
//              aAux    = (pitch m, dx to bundle centre m (0 = not bundled), bath delay s, gust arrival on the clock s)
// ------------------------------------------------------------------------------------------------------------
export const STYLE_GLSL = {
  vertex: /* glsl */`
  attribute vec3 aRow; attribute vec4 aT0, aBands, aRecipe, aRnd, aAux;
  uniform float uClock, uTime, uBreath, uViewH, uCover, uMinPx, uUnbind, uShift, uGustAmp, uSway, uSettle;
  uniform vec3 uEarly; uniform float uEarlyNear; uniform vec2 uFoot, uFarI; uniform float uSolid;   // uFarI: the far massif's indigo (m it stands at 0 s, m per s after); uSolid: how much wider a thread is drawn far off (a flat seen from afar is whole cloth)
  uniform vec3 uShiftK;                               // the rare shift on the far massif: (bundle width m, drop factor, unused)            // seconds by which each bath reaches the far massif early; the madder tide mark (m at the shore, m per m up the valley)
  uniform vec4 uBath[3]; uniform vec4 uLens; uniform vec2 uLensSize; uniform vec3 uLancet, uHoist;   // uHoist: (clock s the first spur's tower is hoisted, s per metre of sheet z after it, s it takes); the lancet that carries the exit: (half width, height it has been hoisted to, height it rests at)
  uniform vec4 uPart;                                 // the eye in sheet space (x, y, z) and its climb per metre flown (PARTING sheets bow round it)
  uniform vec3 uDuck[9];                              // mallard knots on the fold: (x, sheet z, heading +1|-1)
  flat varying vec4 vBands, vRecipe; flat varying vec3 vFront, vPale; flat varying vec4 vMisc; flat varying vec2 vSlip, vWedge; flat varying float vFoot, vBound, vCell;
  varying vec3 vP;                                    // (cross-thread -0.5..0.5, signed height, thread x after parting)
  varying vec2 vSq;                                   // (the thread's width here against its own: finer inside a sheaf, its distance from the eye in metres)
  float bathAt(vec4 b, float t){ float tau = t - b.x; float k = max(tau - b.z, 0.); return tau <= 0. ? -1. : b.y*tau + b.w*k*k; }
  float pulseAt(float t){ t = max(t, 0.); return 2.05*exp(-1.75*t)*sin(2.35*t); }
  void main(){
    float x = aT0.x, z = aT0.y, top = aT0.z;
    float ya = min(aRow.x*top + aRow.y*aBands.w + aRow.z, top);
  #ifndef PARTING
    // the lancet is hoisted late: until then its threads end at the height of the flank beside it (each a little behind the next: a combed top edge)
    if (abs(z - uLens.z) < 0.5 && abs(aT0.x - uLens.x) < uLancet.x) ya = min(ya, max(uLancet.y*(1. - 0.1*aRnd.y) - 4.*aRnd.z, uLancet.z*(0.8 + 0.25*aRnd.z)));
  #else
    // a spur's parted tower (slit over 4.2 m; the thousandths of the slit carry the height it rests at) is hoisted too, spur after spur
    if (aAux.y > 4.2) {
      float rest = (aAux.y - 4.5)*1000., hk = smoothstep(0., uHoist.z, uClock - uHoist.x - (300. - z)*uHoist.y - 0.6*aRnd.y);
      ya = min(ya, max(rest*(0.85 + 0.3*aRnd.z), mix(rest, top, hk)));
    }
  #endif
    float y = ya*position.y;
    // the bound summit: above its snowline a bundle's threads are gathered and wound
    float bound = 0.;
    float sq = 1.;                                    // how far a parting has pushed this thread's neighbours together (1 = at rest)
  #ifdef PARTING
    // a sheet the camera flies through (curtain, spur): aAux.y is the half width of its slit. Threads bow aside
    // round the eye as it comes, widest at the height where the eye will cross, and close again behind it.
    {
      float W = aAux.y, dz = z - uPart.z;             // ahead of the eye: dz < 0
      float behind = 1. - smoothstep(12., 44., dz);
      float open = (1. - smoothstep(W*3., W*3. + 30., -dz))*behind;
      float yc = uPart.y - uPart.w*dz, Rr = W*5., Wo = W;
      if (W < 4.2) {
        // THE REED CURTAINS ARE TIED BACK AS AN AVENUE: each hangs open before we reach it, the further the wider (a third of
        // its distance), so from the shore their sheaves stand one outside another at the sides of the frame and the lake
        // and the white mountain are clear between them; each closes to its slit as the eye comes and brushes past
        if (W < 3.9) {                                // (the mist's gauze, slit 3.95, only parts round the eye)
          open = max(open, 0.94*behind);
          if (W < 3.) Rr = W*8.;
          Wo = min(max(W*1.9, 0.42*(-dz)), Rr*0.8);
        }
      } else {
        // a spur's tower, once hoisted, hangs a little open on the line of the climb (y 41.8 at z 300, 30 degrees): from the foot
        // of the climb the three partings stand one inside another with the exit lens at the end of them
        float hk2 = smoothstep(0., uHoist.z, uClock - uHoist.x - (300. - z)*uHoist.y - 0.6);
        yc = mix(41.8 + 0.5774*(300. - z), yc, smoothstep(0.02, 0.3, abs(uPart.w))*(1. - smoothstep(30., 90., -dz)));
        open = max(open, (0.55 + 0.35*smoothstep(40., 160., -dz))*hk2*behind);
        Wo = min(max(W, 0.05*(-dz)), Rr*0.8);
      }
      float sp = clamp((ya - yc)/(W*4.5 + 2.), -1., 1.), kp = (1. - sp*sp); kp *= kp*open;
      float dp = x - uPart.x;
      if (abs(dp) < Rr && kp > 0.) {
        float pp = max(abs(dp)/Rr, 1e-4), wv = Wo*kp;
        x = uPart.x + (dp < 0. ? -1. : 1.)*(wv + (Rr - wv)*pow(pp, 1. + 1.7*kp));
        sq = (Rr - wv)/Rr*(1. + 1.7*kp)*pow(pp, 1.7*kp);
        if (W < 4.2) sq = max(sq, 0.35);
      }
    }
  #else
    bound = smoothstep(aBands.w - 4., aBands.w + 26., ya)*step(0.001, abs(aAux.y));
    float rel = clamp(uUnbind - (1. - ya/900.)*1.2 - aRnd.z*0.3, 0., 1.);
    x += aAux.y*0.55*bound*(1. - rel*rel*(3. - 2.*rel)*0.8);
  #endif
    // the exit lens: threads swagged aside and tied back
    float dl = x - uLens.x, R = uLensSize.y;
    if (abs(z - uLens.z) < 0.5 && abs(dl) < R) {
      float s = clamp((ya - uLens.y)/uLensSize.x, -1., 1.), k = (1. - s*s); k *= k*uLens.w;
      float w = 7.6*k, p = abs(dl)/R;
      x = uLens.x + (dl < 0. ? -1. : 1.)*(w + (R - w)*pow(max(p, 1e-4), 1. + 1.7*k));
      sq = min(sq, (R - w)/R*(1. + 1.7*k)*pow(max(p, 1e-4), 1.7*k));
    }
    // threads pushed together by a parting are drawn finer, so each still stands by itself (and carries its sheen) in the sheaf
    sq = clamp(sq*1.3, 0.28, 1.);
    // sparser with distance: drop threads by keep level and widen the survivors, never under uMinPx pixels
    vec3 lc = (cameraPosition - modelMatrix[3].xyz)*mat3(modelMatrix);   // camera in local space (no scale assumed)
    float dist = length(vec3(aT0.x, clamp(lc.y, -top, top), z) - lc);      // from the thread at rest: one value per thread
    float px = dist*2./max(projectionMatrix[1][1]*uViewH, 1.);
    float m = max(log2(max(uMinPx*px/uCover, 1e-4)/aAux.x), 0.), fl = floor(m), f = m - fl;
    float lv = aRnd.w, w0 = uCover*aAux.x*exp2(fl);
    // (a thread about to be dropped hands its width to the survivors before it falls under a pixel, so a sheet keeps its cover at every distance)
    float thin = w0*(1. - f), comp = thin*(1. - smoothstep(0.7*px, 1.4*px + 1e-5, thin));
    float wd = lv < fl - 0.5 ? 0. : (lv < fl + 0.5 ? thin : w0*(1. + f) + comp);
    if (wd < 0.7*px) wd = 0.;
    wd = min(wd, aAux.x*exp2(fl + 1.)*0.8);
    wd *= 1. + 0.12*(1. - smoothstep(-260., -60., z));   // the far massif is hung closer still: its tiers are solid colour, sub-pixel gaps closed
    // whole cloth from afar: beyond arm's length a thread is drawn wider than its spacing, so a flat owns its pixels and a
    // dyed shape is one shape; near the eye the threads stand apart and can be counted (the backdrop sky stays sparse)
  #ifdef PARTING
    if (aAux.x >= 0.08) wd *= 1. + uSolid*smoothstep(14., 70., dist);
  #else
    wd *= 1. + uSolid*smoothstep(14., 70., dist)*step(-1500., z)*step(aT0.z, aT0.w + 400.);   // (a bare sky thread keeps its own width)
  #endif
    float wd0 = wd;                                   // (the flat varyings take the thread's own width: one value per thread)
  #ifdef PARTING
    if (aAux.y < 4.2 && aAux.x < 0.08) wd *= 1. + (aAux.z > 50. ? 4.2 : 2.2)*(1. - smoothstep(8., aAux.z > 50. ? 46. : 30., abs(z - uPart.z)));   // a reed curtain: sheer from afar, substantial at arm's length (its dyed sheaf beside the slit is a solid body)
  #endif
    wd0 = wd;                                         // (still one value per thread: the widening hangs on the sheet's z and the eye)
    { float wq = max(wd*sq, min(wd, 1.3*px)); vSq = vec2(wq/max(wd, 1e-6), dist); wd = wq; }   // (never under a pixel and a third: a finer thread would break into dots)
    wd *= 1. + 0.9*bound;                             // gathered and wound, a bundle is nearly solid: the bound peak is plainly white
    // slip: rest + breath + the gust, more below the fold
    float g = pulseAt(uClock - aAux.w);
    // hung warp is never still: each thread shivers across its sheet by a fraction of the pitch, more in a breath or the gust
    x += aAux.x*uSway*(sin(uTime*1.3 + aT0.x*0.045 + z*0.71 + aRnd.z*2.) + 0.5*sin(uTime*2.9 + aRnd.z*40.))*(1. + 1.5*abs(uBreath) + 2.*abs(g));
    float br = 0.55*sin(uTime*0.9 + aT0.x*0.011 + z*0.004) + 0.3*sin(uTime*1.7 + aRnd.z*6.2832);   // the cloth is never quite still
    float sl = aRnd.x*(1. + br + 2.2*uBreath + 4.*g) + g*uGustAmp;        // each thread further, and the whole sheet thrown
    float farS = 1. - smoothstep(-260., -60., z);
    float sh = uShift*mix(clamp(aAux.x*0.6, 0.25, 1.), uShiftK.y, farS)*step(0.5, fract(floor(aT0.x/mix(clamp(aAux.x*40., 20., 110.), uShiftK.x, farS))*0.5));   // (a finer sheet drops less: its picture is smaller)   // the rare shift: every other bundle of forty threads drops
    vSlip = vec2(sl + sh, sl*1.7 + sh);
    float tl = uClock - aAux.z - 0.25*aRnd.y;
    // the far massif (the sheets behind the foothill flank) is dipped early and all at once, so the mountain stands in
    // its tiers while the lake is still in open view; down here each bath comes in its own time
    float farK = 1. - smoothstep(-260., -60., z);
    vec3 te = tl + farK*(uEarly + 0.00114*max(-z, 0.) + 0.25*aRnd.y);
    float st = uSettle*(1. - 0.6*farK);
    // madder comes down the valley from the mountain: the spurs and the foothill flank take it some seconds early too
    te.y = tl + farK*0.00114*max(-z, 0.) + mix(min(uEarlyNear, max(uEarlyNear*0.85 - z*0.01, 0.))*(1. - smoothstep(330., 400., z)), uEarly.y, farK);
    vFront = vec3(bathAt(uBath[0], te.x), bathAt(uBath[1], te.y), bathAt(uBath[2], te.z));
    vPale = vec3(bathAt(uBath[0], te.x - st), bathAt(uBath[1], te.y - st*0.3), bathAt(uBath[2], te.z - st));
    // the far massif was given its indigo before the valley: it stands dark under its bound peak from the first frame
    // (the subject of the opening, and of the picture in the previous portal) and the bath creeps on up its crests
    float fi = uFarI.x + uFarI.y*max(uClock, 0.);
    vFront.z = mix(vFront.z, fi, farK); vPale.z = mix(vPale.z, fi - 30., farK);
    // every thread wicks at its own rate: a comb a few metres deep at the front (never a barcode the height of a grove)
    vec3 comb = aRnd.y*clamp(vFront*0.1, vec3(1.5), vec3(9.));
    vFront -= comb; vPale -= comb;
  #ifdef PARTING
    // a reed curtain's threads beside its slit (bath delay over 50 s: never by the clock) take their first bath as the eye
    // comes: saffron climbs them over the last thirty metres, pale at its front, and stays
    if (aAux.y < 4.2 && aAux.z > 50.) {
      float pf = 16.*(1. - smoothstep(16., 52., uPart.z - z));
      vFront.x = pf - 2.*aRnd.y; vPale.x = pf - 2.6 - 2.*aRnd.y;
    }
  #endif   // a band deepens one step uSettle seconds after its bath passes (madder much sooner)
    vFoot = (uFoot.x + uFoot.y*clamp(700. - z, 0., 1900.))*(0.7 + 0.6*fract(aRnd.z*7.31 + aRnd.y*3.7));   // the madder tide mark of this thread
    vFoot *= mix(1., 0.32 + 0.68*smoothstep(12., 150., abs(aT0.x)), step(50., z));   // lower on the threads we brush past, so it is one band and not a wall
    vFoot *= mix(1., 0.4, smoothstep(60., 110., z)*(1. - smoothstep(330., 400., z)));   // low on the spurs: their silk and their lancets stay legible above it
    vFoot *= mix(1., 0.5, smoothstep(330., 400., z));  // and on the wings: one madder line along each fold, not a wall
    vFoot *= step(-20., aAux.z);                      // a thread dyed before the valley (houses, willows, green reeds) keeps its own colours
    vBands = aBands; vRecipe = aRecipe;
  #ifdef PARTING
    vBound = 0.;
  #else
    vBound = step(0.001, abs(aAux.y));
  #endif
    { float pc = max(aAux.x, 1e-3); vCell = fract(aT0.x/(3.2*pc) + 0.45*sin(aT0.x*0.9/pc + aT0.y) + aT0.y*0.37); }   // where this thread hangs in a run of three (one value per thread): fine threads take the satin tint in runs, one in three
    vWedge = vec2(0.);                                // a mallard drags a wedge of extra slip through the reflection behind it
    for (int i = 0; i < 9; i++) {
      vec3 dk = uDuck[i]; float bk = (aT0.x - dk.x)*-dk.z;
      if (abs(dk.y - z) < 0.5 && bk > 0. && bk < 46.) vWedge = vec2(2.6*(1. - bk/46.) + 0.5, bk*0.3 + 0.5);
    }
    vMisc = vec4(aT0.z > aT0.w + 400. ? -aT0.w : aT0.w, aRnd.z, z, wd0/max(px, 1e-5));   // x: picture top, negative on a sky thread
    vP = vec3(position.x, y, x);
    vec4 mv = modelViewMatrix*vec4(x + position.x*wd, y, z, 1.);
    gl_Position = wd > 0. ? projectionMatrix*mv : vec4(2., 2., 2., 1.);
  }`,
  // dye(): the whole rule of colour. hh = height along the thread after slip; returns the flat display colour.
  fragment: /* glsl */`
  uniform vec3 uDye[24]; uniform vec3 uTint[8]; uniform vec3 uSheenCol, uCotton, uKnot;
  uniform float uClock, uTime, uRipple; uniform vec4 uBelt;
  uniform vec4 uLow;                                  // raw silk in deeper shade, and how much of it veils the folded half (the lake)
  uniform vec4 uPart;                                 // the eye in sheet space (x, y, z)
  uniform vec4 uStork[24]; uniform float uStorkSize, uCast;      // 9 gaps above the fold + their 9 twins below, then 3 more gaps (18 to 20) + their 3 twins (21 to 23); uCast 0 stork, 1 horse, 2 swan
  uniform float uHorseGrow;                           // (round 13) the size of the nine band gaps and their nine twins (loop index under 9) is uStorkSize times this; 1 by default; gaps 18 to 23 are never scaled
  flat varying vec4 vBands, vRecipe; flat varying vec3 vFront, vPale; flat varying vec4 vMisc; flat varying vec2 vSlip, vWedge; flat varying float vFoot, vBound, vCell;
  varying vec3 vP; varying vec2 vSq;
  float bar(vec2 q, vec2 a, vec2 b, float w){          // a razor-sided bar from a to b (no soft edges in this cloth)
    vec2 d = b - a; float t = clamp(dot(q - a, d)/max(dot(d, d), 1e-5), 0., 1.);
    vec2 e = q - a - d*t; return step(dot(e, e), w*w);
  }
  float tbar(vec2 q, vec2 a, vec2 b, float wa, float wb){   // a tapering bar: half width wa at a, wb at b
    vec2 d = b - a; float t = clamp(dot(q - a, d)/max(dot(d, d), 1e-5), 0., 1.);
    vec2 e = q - a - d*t; float w = mix(wa, wb, t); return step(dot(e, e), w*w);
  }
  float storkGap(vec2 q, float pose){                 // q in wingspans; a white bird as a gap in the dye
    if (uCast > 1.5) {                                // a swan sitting on the fold, swimming toward -x; pose = how far the neck is raised
      float body = step(q.x*q.x*5.5 + q.y*q.y*30., 1.)*step(0., q.y) + bar(q, vec2(0.3, 0.1), vec2(0.5, 0.26), 0.05);
      float nk = 0.5 + 0.12*pose;
      float neck = bar(q, vec2(-0.3, 0.1), vec2(-0.42, nk*0.6), 0.045) + bar(q, vec2(-0.42, nk*0.6), vec2(-0.36, nk), 0.04) + bar(q, vec2(-0.36, nk), vec2(-0.52, nk - 0.05), 0.035);
      return min(body + neck, 1.);
    }
    if (uCast > 0.5) {                                // a white horse galloping toward -x (pose + 10: toward +x); q in horse lengths from the hooves, pose = stride -1..1
      if (pose > 5.) { pose -= 10.; q.x = -q.x; }
      float body = step((q.x*q.x)*7. + (q.y - 0.5)*(q.y - 0.5)*36., 1.);
      float neck = bar(q, vec2(-0.3, 0.56), vec2(-0.5, 0.82 + 0.03*pose), 0.085) + bar(q, vec2(-0.5, 0.83 + 0.03*pose), vec2(-0.66, 0.76 + 0.03*pose), 0.05);
      float tail = bar(q, vec2(0.36, 0.56), vec2(0.56, 0.5 - 0.08*pose), 0.035);
      float legs = bar(q, vec2(-0.27, 0.44), vec2(-0.3 - 0.24*pose, 0.02 + 0.1*max(pose, 0.)), 0.046) + bar(q, vec2(-0.2, 0.44), vec2(-0.2 - 0.12*pose, 0.0 + 0.16*max(-pose, 0.)), 0.046)
                 + bar(q, vec2(0.27, 0.44), vec2(0.3 + 0.26*pose, 0.02 + 0.1*max(pose, 0.)), 0.048) + bar(q, vec2(0.2, 0.44), vec2(0.22 + 0.1*pose, 0.0 + 0.16*max(-pose, 0.)), 0.048);
      return min(body + neck + tail + legs, 1.);
    }
    // a white stork side on, flying toward -x; q in body lengths (bill tip to toes is about one): a level body, neck and
    // bill stretched ahead, legs trailing, one bent wing raised, level or lowered (pose 1, 0, -1)
    float body = step(q.x*q.x*24. + q.y*q.y*120., 1.);
    float neck = tbar(q, vec2(-0.14, 0.014), vec2(-0.37, 0.04), 0.06, 0.044) + tbar(q, vec2(-0.37, 0.04), vec2(-0.55, 0.02), 0.036, 0.016);
    float legs = tbar(q, vec2(0.14, -0.014), vec2(0.5, -0.045), 0.04, 0.026);
    float wh = pose > 0. ? 0.15 + 0.35*pose : 0.15 + 0.6*pose;           // the wing is never edge on for long: raised, half raised, lowered
    vec2 elbow = vec2(0.03, 0.45*wh + 0.01), tip = vec2(0.12 + 0.07*(1. - abs(pose)), wh + 0.01);
    float wing = tbar(q, vec2(-0.04, 0.01), elbow, 0.11, 0.09) + tbar(q, elbow, tip, 0.09, 0.025);
    return min(body + neck + legs + wing, 1.);
  }
  float gSet = 0.;                                    // the dye set of the last dye() call (0 = undyed silk)
  vec3 dye(float hh, float hg, bool below, float pxm){  // hg: the height a resist gap is read at (a third of the slip); pxm: metres per pixel along the thread
    float code = hh < vBands.x ? vRecipe.x : hh < vBands.y ? vRecipe.y : hh < vBands.z ? vRecipe.z : hh < vBands.w ? vRecipe.w : 0.;
    if (hh > abs(vMisc.x)) { if (vMisc.x > 0.) discard; code = 0.; }      // past the picture: bare sky thread, or nothing
    float pre = step(15.5, code); code -= 16.*pre;                         // + 16: this band was dyed before the valley (the high woods and slopes): it stands in its colours from the first frame
    vec3 bits = vec3(mod(code, 2.), mod(floor(code*0.5), 2.), mod(floor(code*0.25), 2.));
    float shade = step(7.5, code);
    // the madder tide mark: along the waterline every thread takes the crimson bath, and takes it over its saffron
    bool foot = hh < vFoot; float nat = bits.y;
    if (foot) bits.y = 1.;
    vec3 has = bits*max(step(hh, vFront), vec3(pre));
    if (foot && has.y > 0.5) has.x = 0.;
    for (int i = 0; i < 12; i++) {
      vec4 s = uStork[i < 9 ? (below ? i + 9 : i) : (below ? i + 12 : i + 9)];
      // the resist was tied through every sheet behind the creature along the eye's line, so the gap is not dyed shut by the cloth beyond it
      // (pass 5) ... and through every sheet in front of it too: no nearer bank, flame or tide mark is dyed across a creature
      if (s.z < uPart.z - 1. && vMisc.z < uPart.z - 0.5) {
        float kq = (vMisc.z - uPart.z)/min(s.z - uPart.z, -1.);
        vec2 e = vec2(uPart.x, below ? -uPart.y : uPart.y), cq = e + (s.xy - e)*kq;
        // (only what stands above the creature's own fold: a horse wading up out of the lake is cut off at the waterline)
        has *= 1. - storkGap((vec2(vP.z, hg) - cq)/max(uStorkSize*(i < 9 ? uHorseGrow : 1.)*kq, 0.1), s.w)*step(0., e.y + (hg - e.y)/max(kq, 1e-3));
      }
    }
    float set = has.x + 2.*has.y + 4.*has.z;
    float newest = has.z > 0.5 ? vFront.z : has.y > 0.5 ? vFront.y : vFront.x;
    float settled = has.z > 0.5 ? vPale.z : has.y > 0.5 ? vPale.y : vPale.x;
    settled = max(settled, newest - 90.);
    float depth = (hh > settled || set < 0.5) ? 0. : 1. + shade;
    if (pre > 0.5 && set > 0.5) depth = 1. + shade;
    if (newest - hh < max(0.012*newest + 1.2, 2.6*pxm) && set > 0.5 && pre < 0.5) depth = 2.;      // the wet edge of the bath, never under two or three pixels
    if (foot && nat < 0.5 && has.y > 0.5 && vFoot - hh < max(1.1, 2.6*pxm)) depth = 2.;   // and the tide mark keeps its rim
    gSet = set;
    // THE MIRROR IS DYED: below the fold the same dyes hang one bath deeper (pale -> full -> deep; undyed silk in its shade),
    // so the lake is the valley again in whole colours of the dye table and never a veil over it
    if (below) depth = set > 0.5 ? min(depth + 1., 2.) : 2.;
    return uDye[int(set*3. + depth + 0.5)];
  }
  vec4 threadColour(){
    bool below = vP.y < 0.;
    float h = abs(vP.y);
    float sl = below ? vSlip.y + uRipple*sin(h*0.021 + uTime*0.9 + vP.z*0.004)*(1. + h*0.004) : vSlip.x;
    if (below && h < vWedge.y) sl += vWedge.x*(1. - h/max(vWedge.y, 0.01))*(0.75 + 0.25*sin(uTime*2.3 + vP.z*0.9));
    float hh = h + sl;
    float pxm = fwidth(vP.y);
    vec3 col = dye(max(hh, 0.), max(h + 0.3*sl, 0.), below, pxm);
    // the pinch knot where the thread turns back on itself: a flat darker tick on the fold, as tall as the thread is wide
    if (h < clamp(vMisc.w, 2.2, 9.)*pxm*0.8) col = gSet > 0.5 ? col*0.6 : uKnot;   // (on undyed silk the knot is raw silk in shade, never grey)
    if (vBound > 0.5 && hh > vBands.w + 8.) col = below ? uDye[0] : uCotton;   // wound in cotton above its snowline: whiter than silk (its twin in the fold: plain silk, one step down)
    // SATIN SHEEN, the one light effect: a paler stripe a fifth of the thread wide up its middle, in a level band at the
    // eye's own height that slides along the threads as the eye rises (two flat steps, its edges combed thread by thread).
    // A thread too fine to carry a stripe (under about five pixels) takes it whole or not at all, one thread in five: the same
    // share of pale, still crisp. Only near cloth shows it (within about 100 m): far flats keep their dyes exact.
    // THE BELT (polish pass 5): on every sheet a level band of light centred where the gaze meets the sheet (the eye's height
    // plus the gaze's slope times the sheet's distance down the course) and a third of the frame tall at any distance (its
    // half height grows with the distance), so on screen it is one level belt crossing every near stand, wing and sheaf, and
    // it slides along the threads as the eye moves and climbs. The stripe is a paler tint OF THE THREAD'S OWN DYE (uTint).
    float dz = max(abs(vMisc.z - uPart.z), 3.), bw = max(uBelt.z*dz, 0.9);
    float yb = uBelt.x + uBelt.y*dz;
    float band = ((below ? -h : h) - yb)/bw + (vMisc.y - 0.5)*0.5 + 0.1*sin(uTime*0.7 + vP.z*0.0052 + vMisc.z*0.003);
    band = exp(-band*band);
    // every thread wide enough carries the stripe up its middle: a fifth of its width, never under a pixel and a half (so a
    // thread of 3.5 to 7 px shows one clean pale line); a finer one takes the tint whole or not at all, one thread in four.
    // Only cloth at arm's length shows it (within about 50 m, cut off thread by thread): far flats keep their dyes exact.
    float wpx = 1./max(fwidth(vP.x), 1e-4);
    float stripe = 1. - step(max(0.1, 0.75/wpx), abs(vP.x));
    // no half tints: a thread carries the tint or it does not. In the heart of the belt every wide thread carries its stripe
    // and every other fine thread is pale; in the weaker step above and below, every other wide thread and one fine one in five
    // and a fine thread takes it whole, in runs: one drawn pitch in three in the heart of the belt, half as many in the rim,
    // so a sheaf of fine threads shows clean pale stripes side by side and never a scatter
    float hsh = fract(vMisc.y*7.13 + 0.31), core = step(0.62, band), rim = step(0.3, band) - core;
    float share = wpx > 5. ? stripe*(core + rim*step(hsh, 0.5)) : step(1., wpx)*(core*step(vCell, 0.55) + rim*step(vCell, 0.28));
    float sheen = share*step(vSq.y + (vMisc.y - 0.5)*24., 52.);
    if (vMisc.x < 0.) sheen = 0.;                                     // (a bare sky thread is silk already)
    int ts = int(gSet + 0.5); if (vBound > 0.5 && hh > vBands.w + 8.) ts = 0;
    col = mix(col, ts == 0 ? uSheenCol : uTint[ts], sheen*uBelt.w);
    return vec4(col, 1.);                                                      // flat post: the colour written is the colour shown
  }`,
};

// ------------------------------------------------------------------------------------------------------------
// makeStyle(): the shared uniforms and the material factories. One call per world; every sheet, binding and
// ribbon in the world should be shaded through it so one clock, one dye table and one sheen run through all.
// ------------------------------------------------------------------------------------------------------------
export function makeStyle(opts = {}) {
  const palette = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const dyes = makeDyeTable(palette, opts.exposure ?? 1, opts.air ?? AIR_HEX);
  const table = []; for (let i = 0; i < 24; i++) table.push(new THREE.Vector3(dyes.displayTable[i * 3], dyes.displayTable[i * 3 + 1], dyes.displayTable[i * 3 + 2]));
  const storks = []; for (let i = 0; i < 24; i++) storks.push(new THREE.Vector4(0, -9999, -99999, 0));
  const tintV = []; for (let i = 0; i < 8; i++) tintV.push(new THREE.Vector3(dyes.tints[i * 3], dyes.tints[i * 3 + 1], dyes.tints[i * 3 + 2]));
  const ducks = []; for (let i = 0; i < 9; i++) ducks.push(new THREE.Vector3(0, -99999, 1));
  const uniforms = {
    uClock: { value: 0 }, uTime: { value: 0 }, uBreath: { value: 0 }, uViewH: { value: 720 },
    uCover: { value: 0.45 }, uMinPx: { value: 1.5 }, uSway: { value: 0.16 }, uSettle: { value: 4 }, uUnbind: { value: 0 }, uShift: { value: 0 }, uGustAmp: { value: 6 },
    uBath: { value: BATHS.map((b) => new THREE.Vector4(b[0], b[1], b[2], b[3])) },
    uLens: { value: new THREE.Vector4(0, 215, 99999, 1) },          // x, height, sheet z, open 0..1
    uLensSize: { value: new THREE.Vector2(19, 34) },                // half height of the swag, reach either side (m)
    uHoist: { value: new THREE.Vector3(20.5, 0.01, 2.4) },
    uLancet: { value: new THREE.Vector3(56.5, 9999, 60) },          // half width, hoisted height (9999 = standing), resting height
    uDye: { value: table },                                         // display colours (linear), shown as written under post.flat
    uSheenCol: { value: new THREE.Vector3(dyes.sheenDisplay.r, dyes.sheenDisplay.g, dyes.sheenDisplay.b) },
    uEarly: { value: new THREE.Vector3(23, 26, 18) }, uEarlyNear: { value: 11 }, uFoot: { value: new THREE.Vector2(13, 0.014) },
    uSilk: { value: dyes.silk }, uCotton: { value: dyes.cotton }, uKnot: { value: dyes.air.clone().multiplyScalar(0.9) },   // flats for cotton and anything plain
    uAir: { value: dyes.air },
    uSheenY: { value: 40 }, uSheenW: { value: 90 }, uRipple: { value: 1.5 },
    uTint: { value: tintV },                                        // the satin tint of each dye set
    uBelt: { value: new THREE.Vector4(5, 0, 0.2, 1) },              // the belt of light: eye height, the gaze's slope (rise per metre of course), half height per metre of distance, strength
    uSolid: { value: 0.55 }, uFarI: { value: new THREE.Vector2(300, 12.5) }, uShiftK: { value: new THREE.Vector3(124, 4.6, 0) },
    uLow: { value: new THREE.Vector4(dyes.air.r*0.86, dyes.air.g*0.87, dyes.air.b*0.9, 0.2) },
    uStork: { value: storks }, uStorkSize: { value: 40 }, uCast: { value: 0 }, uHorseGrow: { value: 1 },
    uPart: { value: new THREE.Vector4(0, 5, 99999, 0) }, uDuck: { value: ducks },
  };
  const size = new THREE.Vector2(), camPos = new THREE.Vector3(), camDir = new THREE.Vector3();
  const style = {
    uniforms, dyes, palette,
    /** the thread material: the one material for every sheet of warp. */
    threadMaterial(parting = false) {
      return new THREE.ShaderMaterial({
        uniforms, side: THREE.DoubleSide, fog: false, toneMapped: false, defines: parting ? { PARTING: 1 } : {},
        vertexShader: STYLE_GLSL.vertex,
        fragmentShader: STYLE_GLSL.fragment + /* glsl */`
        void main(){ gl_FragColor = threadColour(); }`,
      });
    },
    /** journey clock in seconds (u * 40). Baths, gust, breaths and the unbinding all follow it. */
    setClock(tJ) {
      uniforms.uClock.value = tJ;
      let b = 0; for (const t0 of BREATHS) b += pulse((tJ - t0) * 0.8);
      uniforms.uBreath.value = b;
      uniforms.uUnbind.value = (tJ - UNBIND_T) / 5;                 // 0 at 33 s, 1 at 38 s, runs on (negative before: the lancet's own bindings start below 0)
    },
    /** every frame: ambient time, the drawing-buffer height (thread width in pixels) and the sheen's level. */
    update(time, camera, renderer, localEyeY) {
      uniforms.uTime.value = time;
      if (renderer) uniforms.uViewH.value = renderer.getDrawingBufferSize(size).y;
      let ey = localEyeY;
      if (ey === undefined && camera) ey = camPos.setFromMatrixPosition(camera.matrixWorld).y;
      const tJ = uniforms.uClock.value;
      uniforms.uSheenY.value = (ey || 0) + 2.5 + Math.max(tJ, 0) * 0.1 + Math.sin(time * 0.23) * 1.5;   // at the eye's own height, creeping up as morning comes
      uniforms.uSheenW.value = 5;
      if (camera && camera.matrixWorld) {                           // (a world that flies the piece sets uBelt itself, in sheet space, after this)
        const e = camera.matrixWorld.elements; camDir.set(-e[8], -e[9], -e[10]);
        uniforms.uBelt.value.x = ey || 0;
        uniforms.uBelt.value.y = Math.min(0.8, Math.max(-0.3, camDir.y / Math.max(Math.hypot(camDir.x, camDir.z), 0.3))) + 0.02 * Math.sin(time * 0.23);
      }
    },
  };
  return style;
}

// the two strip geometries: plain (one quad, 2 triangles) and rows (rows of (a, b, c), mirrored below the fold)
export function stripGeometry(rows = null) {
  const pos = [], row = [], idx = [];
  const list = rows || [[1, 0, 0]];                    // ascending height
  const all = [];
  for (let i = list.length - 1; i >= 0; i--) all.push([-1, list[i]]);
  for (let i = 0; i < list.length; i++) all.push([1, list[i]]);
  for (const [sg, r] of all) for (const sd of [-0.5, 0.5]) { pos.push(sd, sg, 0); row.push(r[0], r[1], r[2]); }
  for (let i = 0; i < all.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRow', new THREE.Float32BufferAttribute(row, 3));
  g.setIndex(idx);
  return g;
}

/** the strip of a SKY TAPE: a bare thread that hangs only from its sheet's crest (aBands.w) up to the top bar, and the
 *  same below the fold; nothing between, so it never shows inside the picture. Used with the plain thread material. */
export function skyStripGeometry() {
  const g = new THREE.BufferGeometry(), pos = [], row = [];
  for (const [sg, r] of [[-1, [1, 0, 0]], [-1, [0, 1, 0]], [1, [0, 1, 0]], [1, [1, 0, 0]]]) for (const sd of [-0.5, 0.5]) { pos.push(sd, sg, 0); row.push(r[0], r[1], r[2]); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aRow', new THREE.Float32BufferAttribute(row, 3));
  g.setIndex([0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6]);
  return g;
}
/** one sky tape into a thread array: x, sheet z, the crest height it hangs from, its drawn pitch (width = 0.45 * pitch).
 *  Keep level 0: the tape is only drawn while it is wider than about a pixel and a half, so it widens out of nothing as
 *  the eye comes within about pitch * 115 m and never veils the far view. */
export function packSkyTape(arr, i, x, z, crest, pitch, phase) {
  const o = i * 20; arr.fill(0, o, o + 20);
  arr[o] = x; arr[o + 1] = z; arr[o + 2] = SKY_TOP; arr[o + 3] = crest;
  arr[o + 4] = crest; arr[o + 5] = crest; arr[o + 6] = crest; arr[o + 7] = crest;
  arr[o + 13] = 0.3; arr[o + 14] = phase; arr[o + 15] = 0; arr[o + 16] = pitch; arr[o + 18] = 9; arr[o + 19] = 99;
}
/** A sheet of warp from a flat list of threads. threads: Float32Array, 20 floats each, in the attribute order
 *  aT0(4) aBands(4) aRecipe(4) aRnd(4) aAux(4). Returns a Mesh (InstancedBufferGeometry), frustum culling off. */
export function makeSheetMesh(style, threads, count, geometry, material) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geometry.index; g.setAttribute('position', geometry.getAttribute('position')); g.setAttribute('aRow', geometry.getAttribute('aRow'));
  const ib = new THREE.InstancedInterleavedBuffer(threads, 20);
  ['aT0', 'aBands', 'aRecipe', 'aRnd', 'aAux'].forEach((n, i) => g.setAttribute(n, new THREE.InterleavedBufferAttribute(ib, 4, i * 4)));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, material || style.threadMaterial());
  m.frustumCulled = false; m.matrixAutoUpdate = true;
  return m;
}
/** keep level of thread i in a sheet: the number of times i divides by two (odd threads go first). */
export const keepLevel = (i) => { let l = 0; i = i | 0; if (i === 0) return 12; while ((i & 1) === 0 && l < 12) { i >>= 1; l++; } return l; };
/** write one thread into a sheet array (20 floats per thread, see STYLE_GLSL). */
export function packThread(arr, i, t) {
  const o = i * 20;
  arr[o] = t.x; arr[o + 1] = t.z; arr[o + 2] = t.geoTop; arr[o + 3] = t.picTop;
  arr[o + 4] = t.h[0]; arr[o + 5] = t.h[1]; arr[o + 6] = t.h[2]; arr[o + 7] = t.h[3];
  arr[o + 8] = t.r[0]; arr[o + 9] = t.r[1]; arr[o + 10] = t.r[2]; arr[o + 11] = t.r[3];
  arr[o + 12] = t.slip; arr[o + 13] = t.lag; arr[o + 14] = t.phase; arr[o + 15] = t.level;
  arr[o + 16] = t.pitch; arr[o + 17] = t.bundleDx; arr[o + 18] = t.delay; arr[o + 19] = t.gustAt;
}
export const SKY_TOP = 1600;                            // the top bar, out of sight
const Y = 1, C = 2, I = 4, SH = 8;                      // recipe bits

// ------------------------------------------------------------------------------------------------------------
// THE MASSIF. Seven flats; local z 0 is the foothill flank (the nearest), the summit sheet stands 1150 m behind.
// ------------------------------------------------------------------------------------------------------------
const SHEETS = [
  // z, peak height, pitch, rest slip, spruce line, upper line
  { z: 0, H: 300, pitch: 0.6, slip: 2.6, spruce: 120, upper: 225 },
  { z: -250, H: 420, pitch: 0.9, slip: 4, spruce: 160, upper: 320 },
  { z: -480, H: 540, pitch: 1.2, slip: 5.5, spruce: 180, upper: 410 },
  { z: -700, H: 660, pitch: 1.5, slip: 7, spruce: 190, upper: 490 },
  { z: -920, H: 780, pitch: 1.9, slip: 9, spruce: 180, upper: 550 },
  { z: -1150, H: 900, pitch: 2.5, slip: 12, spruce: 165, upper: 580 },
  { z: -1400, H: 700, pitch: 2.5, slip: 12, spruce: 150, upper: 510 },
];
const HALF_W = 1300;
const COVER_K = [1.6, 1.6, 1.7, 1.7, 1.8, 1.95, 1.7];   // drawn width of a thread against its spacing, flat by flat
const SUMMIT_X = 130;                                   // the bound peak stands a little to starboard of the course, clear of the lancet that carries the exit
const LANCET = { half: 56, top: 340, drop: 84, snow: 240 };   // the white-tipped lancet on the axis: dead-straight sides, the exit lens at 215 m

// the drawing of one sheet: peaks, ridge teeth (each split light | deep at its apex), gullies, spruce spires,
// a stepped snowline, poplars at the foot of the nearest flank. Everything is a function of x so any pitch can read it.
function makeSheetPicture(k, rng, noise, opt) {
  const S = SHEETS[k], r = rng.fork('sheet' + k);
  const peaks = [];
  // the summit stands on the axis; the crests in front of it carry their peaks to alternate sides and dip on the
  // axis, so the bound peak is seen down a nest of notches for the whole flight
  const mid = k <= 4 || k === 6, sideK = (k % 2 ? -1 : 1) * opt.flip;
  const main = k === 5 ? SUMMIT_X + r.range(-25, 25) : sideK * (k === 0 ? r.range(520, 800) : r.range(340, 620) + 400);   // the crests' own tops stand out at the sides of the view
  peaks.push({ x: main, h: 1, w: k === 5 ? 770 + (r.range(900, 1100) - 900) * 0.3 : r.range(620, 900), p: k === 5 ? 1.0 : 1.05 });   // the summit is one mountain, 1.2 km across its foot, standing in the window the crests leave for it
  if (k === 5) { const sx = r.sign(); peaks.push({ x: main + sx * r.range(340, 400), h: r.range(0.86, 0.93) * 0.93, w: 430, p: 1.0 }, { x: main - sx * r.range(400, 470), h: r.range(0.74, 0.84) * 0.98, w: 420, p: 1.0 }); }   // two shoulders, both above the binding line
  if (mid) peaks.push({ x: -sideK * (r.range(420, 760) + (k === 0 ? 0 : 340)), h: r.range(0.7, 0.85), w: r.range(420, 700), p: 1.1 });
  // the crests step well aside on the line from the lake to the peak (a broad U a quarter of the view wide), and the back
  // shoulder dips behind it, so the summit sheet stands in bare air as one whole mountain
  const notch = k === 6 ? 0.86 : k === 0 ? 0.72 : mid ? 0.86 : 0, notchW = k === 6 ? 900 : k === 0 ? 420 : 590 + 100 * (k - 1);
  const n = r.int(3, 5);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, off = r.range(260, 1150), x = main + side * (k === 5 ? 980 + (off - 260) * 0.4 : off);   // the summit's lesser tops stand well off: shoulders behind the crests, not in the window
    peaks.push({ x, h: r.range(0.5, 0.86) * (1 - 0.25 * Math.abs(x) / HALF_W), w: r.range(380, 760), p: r.range(0.95, 1.4) });
  }
  // ridge teeth: boundaries along x, an apex inside each
  const teeth = []; let x = -HALF_W - 40;
  while (x < HALF_W + 40) { const w = r.range(70, 190) * (0.8 + k * 0.09); teeth.push({ a: x, b: x + w, apex: x + w * r.range(0.3, 0.6), h: r.range(0.35, 1) }); x += w; }
  const big = []; x = -HALF_W - 80;
  while (x < HALF_W + 80) { const w = r.range(260, 520); big.push({ a: x, b: x + w, apex: x + w * r.range(0.35, 0.6) }); x += w; }
  const spW = 22 + k * 7, snowBase = opt.snowline + r.range(-10, 10) - (k === 5 ? Math.max(50, opt.snowline - 450) : 0), bw = Math.max(S.pitch * 8, 14);   // (the summit sheet is bound from 500 m: the white mountain is a whole peak, not a cap)
  const seed = k * 37.7 + r() * 100;
  const hash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7 + seed * 13.1) * 43758.5453; return v - Math.floor(v); };
  // poplars at the feet of the first two flanks
  const poplars = [];
  if (k <= 1) {
    const groves = k === 0 ? r.int(7, 9) : r.int(3, 5);
    for (let gI = 0; gI < groves; gI++) {
      const gx = r.range(-1150, 1150), cnt = r.int(14, 40), gw = cnt * r.range(7, 10), late = opt.flame;
      for (let i = 0; i < cnt; i++) {
        const q = r(), rec = q < 0.33 ? Y : q < 0.33 + late ? Y | C : C;
        poplars.push({ x: gx + r.range(-0.5, 0.5) * gw, w: r.range(3.6, 4.8) * (1 + k * 0.5), h: r.range(30, 45) * (1 + k * 0.35), rec });
      }
    }
    poplars.sort((p, q) => p.x - q.x);
  }
  let ti = 0, bi = 0, pi = 0, lastX = -1e9, gain = 1;
  const out = { T: 0, h: [0, 0, 0, 0], r: [0, 0, 0, 0], bundleDx: 0, snow: 0, bundleX: 0 };
  // threads must be asked for in ascending x
  function at(xx) {
    if (xx < lastX) { ti = 0; bi = 0; pi = 0; } lastX = xx;                                // (a new pass rewinds)
    let env = 0;
    for (const p of peaks) { const d = Math.max(0, 1 - Math.abs(xx - p.x) / p.w); env = Math.max(env, p.h * Math.pow(d, p.p)); }
    while (ti < teeth.length - 1 && xx >= teeth[ti].b) ti++;
    while (bi < big.length - 1 && xx >= big[bi].b) bi++;
    const t = teeth[ti], B = big[bi];
    const tent = xx < t.apex ? (xx - t.a) / (t.apex - t.a) : (t.b - xx) / (t.b - t.apex);       // 0 in the gully, 1 on the ridge
    const btent = xx < B.apex ? (xx - B.a) / (B.apex - B.a) : (B.b - xx) / (B.b - B.apex);
    const rough = noise.fbm2(xx * 0.004 + seed, k * 3.1, 4);
    const nx = xx - SUMMIT_X * (600 - S.z) / 1750;                                         // the notches line up from the lake toward the peak
    env *= 1 - notch * Math.exp(-(nx * nx) / (notchW * notchW));
    let T = S.H * gain * env * (0.8 + 0.1 * btent + 0.1 * tent * t.h) * (1 + 0.07 * rough) + 14;
    const lancet = k === 0 && Math.abs(xx) < LANCET.half;
    if (lancet) T = Math.max(T, LANCET.top - LANCET.drop * Math.pow(Math.abs(xx) / LANCET.half, 1.7));   // the lancet that carries the exit lens: a great ikat flame, razor sided
    const shadeS = xx > t.apex ? SH : 0, shadeB = xx > B.apex ? SH : 0;
    const gw = 0.09 + 0.07 * hash(ti, 1), gully = tent < gw ? 1 : 0, flank = tent < gw * 2.1 ? 1 : 0;   // gully core, and its stepped flank
    // spruce spires: stepped, split light | deep
    const sj = Math.floor(xx / spW), su = xx / spW - sj, steps = 3 + Math.floor(hash(sj, 2) * 2);
    const spire = (1 - Math.floor(Math.abs(su - 0.5) * 2 * steps) / steps) * (16 + 30 * hash(sj, 3)) * (1 + k * 0.3);
    const line = S.spruce * (0.82 + 0.18 * tent) * (1 + 0.16 * noise.n2(xx * 0.0031 + seed, 7.7)) * (hash(sj, 5) < 0.16 ? 0.72 : 1);
    let h1 = 0, r0 = 0;
    if (k <= 1) {
      h1 = (7 + 4 * noise.n2(xx * 0.01, seed)) * (1 + k * 0.6); r0 = Y;                      // the meadow band
      while (pi < poplars.length - 1 && poplars[pi].x + poplars[pi].w < xx) pi++;
      for (let j = pi; j < poplars.length && poplars[j].x - poplars[j].w <= xx; j++) {
        const P = poplars[j], dx = (xx - P.x) / P.w;
        if (Math.abs(dx) < 1) { const hp = P.h * (1 - 0.5 * Math.pow(Math.abs(dx), 1.7)); if (hp > h1) { h1 = hp; r0 = P.rec | (dx > 0 ? SH : 0); } }
      }
    }
    const h2 = Math.max(h1, line + spire);
    const h3 = Math.max(h2, S.upper * (0.8 + 0.2 * btent) * (1 + 0.1 * rough) + (gully ? -40 : 0));
    // the snowline steps bundle by bundle
    const bj = Math.floor(xx / bw), snow = lancet ? LANCET.snow + Math.round((hash(bj, 4) - 0.5) * 4) * 5 : snowBase + Math.round((hash(bj, 4) - 0.5) * 6) * 11 + (gully ? 34 : 0) - 26 * btent;
    out.T = T;
    out.h[0] = Math.min(h1, T); out.h[1] = Math.min(h2, T); out.h[2] = Math.min(h3, T); out.h[3] = Math.min(snow, T);
    out.r[0] = r0;
    const pre = k === 0 && !lancet ? 16 : 0;                                              // the foothill's woods and slopes were dyed before the valley (its lancet takes the baths with us)
    out.r[1] = pre | Y | I | (su > 0.5 ? SH : 0);
    out.r[2] = pre | (gully ? C | I : I | shadeS);
    out.r[3] = pre | (gully ? C | I | SH : flank ? C | I : I | (shadeB ? SH : 0));
    if (lancet) {
      // THE LANCET IS A TIED MOTIF IN EVERY DYE: round the lens a stepped pendant of whole dyes (indigo at the parting, then
      // madder, saffron, flame, aubergine, each step shorter) on stripes of green, indigo and aubergine, under the bound tip.
      // It takes the baths with us: gold and crimson when it is hoisted, the indigo passing the lens at about 32 s.
      const a = Math.abs(xx), zn = a < 8 ? 0 : a < 16 ? 1 : a < 26 ? 2 : a < 38 ? 3 : 4, sh = xx > 0 ? SH : 0;
      const loz = [I, C, Y, Y | C, C | I][zn], base = [Y | I, I, C | I, I, Y | I][zn];
      out.h[1] = Math.max(out.h[0], 215 - [100, 82, 62, 44, 26][zn]); out.h[2] = Math.max(out.h[1], Math.min(238, T));
      out.r[1] = base | sh; out.r[2] = loz | sh; out.r[3] = loz | sh;
    }
    out.snow = snow; out.bundleX = (bj + 0.5) * bw;
    out.bundleDx = T > snow + 12 ? out.bundleX - xx : 0;
    return out;
  }
  at.setGain = (top) => { gain = (S.H - 14) / Math.max(top - 14, 1); };   // (the caller scans the crest, yielding as it goes)
  return at;
}

const DEBUG = (() => { try { return new URLSearchParams(globalThis.location?.search || ''); } catch (e) { return new URLSearchParams(''); } })();

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('massif'), noise = ctx.noise;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const style = opts.style || makeStyle({ palette: opts.palette, exposure: opts.exposure });
  const U = style.uniforms;
  // seeded choices, made once
  const season = opts.season || (rng.chance(0.16) ? 'first-snow' : rng.chance(0.3) ? 'early' : 'late');
  const weather = opts.weather || (rng.chance(0.25) ? 'breezy' : 'still');
  const shift = opts.shift ?? rng.chance(0.08);
  const pic = { snowline: season === 'first-snow' ? 450 : 700, flame: season === 'early' ? 0.2 : 0.5, flip: rng.sign() };
  const group = new THREE.Group(); group.name = 'massif-dyed-three-times';
  const mat = style.threadMaterial();
  const plainGeo = stripGeometry(), snowGeo = stripGeometry([[0, 1, -4], [0, 1, 26], [1, 0, 0]]);
  const LENS = { x: 0, y: 215, z: 0, reach: 34 };
  const lensRows = [[0, 0, 150], [0, 0, 178], [0, 0, 192], [0, 0, 200], [0, 0, 206], [0, 0, 211], [0, 0, 215], [0, 0, 219], [0, 0, 224], [0, 0, 230], [0, 0, 238], [0, 0, 252], [0, 0, 280], [1, 0, 0]];
  const lensGeo = stripGeometry(lensRows);
  U.uLens.value.set(LENS.x, LENS.y, LENS.z, 1); U.uLensSize.value.set(19, LENS.reach);

  // ---- the seven flats ----
  const growList = (cap) => ({ a: new Float32Array(cap * 20), length: 0 });
  const lists = { plain: growList(16384), snow: growList(4096), lens: growList(1024) };   // thread records (20 floats each, one growing array per list), nearest sheet first
  const bundles = [];                                       // bound bundles: { x, z, snow, top }
  const thread = { x: 0, z: 0, geoTop: 0, picTop: 0, h: null, r: null, slip: 0, lag: 0, phase: 0, level: 0, pitch: 0, bundleDx: 0, delay: 0, gustAt: 0 };
  const push = (list, t) => {
    if ((list.length + 1) * 20 > list.a.length) { const b = new Float32Array(list.a.length * 2); b.set(list.a); list.a = b; }
    packThread(list.a, list.length++, t);
  };
  let step = 0; const ats = [];
  for (let k = 0; k < SHEETS.length; k++) {
    const S = SHEETS[k], r = rng.fork('threads' + k);
    await ctx.yield();
    const at = makeSheetPicture(k, rng, noise, pic); ats.push(at);
    await ctx.yield();
    { let top = 0, q = 0; for (let xs = -HALF_W; xs <= HALF_W; xs += 10) { top = Math.max(top, at(xs).T); if ((++q & 31) === 0) await ctx.yield(); } at.setGain(top); }   // the crest stands at its stated height
    await ctx.yield();
    const snowy = S.H > pic.snowline - 40;
    const delay = 2.5 - S.z / 1400 * 1.6, gustAt = GUST.t - 0.7 + (1 + S.z / 1400) * 1.3;
    const seen = new Set();
    // two passes over x for the nearest flank: the sheet at its own pitch, and the lens zone at half pitch
    const passes = k === 0 ? [[S.pitch / detail, false], [0.3 / Math.sqrt(detail), true]] : [[S.pitch / detail, false]];
    for (const [pitch, lensPass] of passes) {
      const x0 = lensPass ? LENS.x - LANCET.half : -HALF_W, x1 = lensPass ? LENS.x + LANCET.half : HALF_W;   // the whole lancet is hung fine and bundled: its bound tip is one white flame
      const n = Math.floor((x1 - x0) / pitch);
      // a thread that survives to a sparser hanging is jittered by that hanging's spacing, so the survivors never
      // stand in a regular comb (two regular combs one behind the other beat into fringes)
      const cand = new Float64Array(n * 5), order = new Array(n);
      for (let i = 0; i < n; i++) {
        const lv = keepLevel(i + 1), jit = Math.min(Math.pow(2, lv), k >= 5 ? 2.2 : 14) * 0.9;   // (the summit and the shoulder behind it are hung almost evenly: their tiers are solid colour, and nothing hangs behind them to beat with)
        cand[i * 5] = Math.min(x1 - 0.01, Math.max(x0 + 0.01, x0 + (i + 0.5 + (r() - 0.5) * jit) * pitch));
        cand[i * 5 + 1] = r(); cand[i * 5 + 2] = r(); cand[i * 5 + 3] = r(); cand[i * 5 + 4] = r(); order[i] = i;
        if ((i & 255) === 255) await ctx.yield();
      }
      await ctx.yield();
      order.sort((a, b) => cand[a * 5] - cand[b * 5]);
      await ctx.yield();
      for (let oi = 0; oi < n; oi++) {
        const i = order[oi], x = cand[i * 5], lag = cand[i * 5 + 1], sl = cand[i * 5 + 2], ph = cand[i * 5 + 3], sky = cand[i * 5 + 4] < (opts.skyShare ?? 0.06);
        if (!lensPass && k === 0 && Math.abs(x - LENS.x) < LANCET.half) continue;
        const p = at(x);
        // no bare sky thread hangs on the line from the lake to the peak: the mountain stands in clear air, unveiled
        const clear = k <= 4 && Math.abs(x - SUMMIT_X * (600 - S.z) / 1750) < (k === 0 ? 260 : 480);
        thread.x = x; thread.z = S.z; thread.picTop = p.T; thread.h = p.h; thread.r = p.r;
        thread.slip = (sl - 0.5) * 2 * S.slip * (weather === 'breezy' ? 1.25 : 1);
        thread.geoTop = sky && !clear ? SKY_TOP : p.T + S.slip * 1.7 * 4 + 6;
        thread.lag = 0.1 + 0.7 * lag * lag + 0.25 * (0.5 + 0.5 * noise.n2(x * 0.02, k * 9.1));
        thread.phase = ph; thread.level = keepLevel(i + 1); thread.pitch = pitch * (lensPass ? 1.8 : COVER_K[k]);   // the far flats are hung closer: the white mountain is whiter than the air
        thread.bundleDx = snowy || lensPass ? p.bundleDx : 0; thread.delay = delay; thread.gustAt = gustAt;
        push(lensPass ? lists.lens : snowy ? lists.snow : lists.plain, thread);
        if ((snowy || lensPass) && p.bundleDx !== 0) {
          const key = Math.round(p.bundleX * 4);
          if (!seen.has(key)) { seen.add(key); bundles.push({ x: p.bundleX, z: S.z, snow: p.snow, top: p.T, k }); }
          else { const b = bundles[bundles.length - 1]; if (b.z === S.z && Math.abs(b.x - p.bundleX) < 0.01) b.top = Math.min(b.top, p.T); }
        }
        if ((++step & 31) === 0) await ctx.yield();
      }
    }
    await ctx.yield();
  }
  // ---- the sky: four backdrop sheets of bare thread behind the massif, hung sparse so air shows between ----
  if (opts.backdrop !== false) {
    const r = rng.fork('sky');
    const back = [[-1750, 6400, 15], [-2150, 7000, 19], [-2650, 7600, 24], [-3200, 8200, 30]];
    for (let b = 0; b < back.length; b++) {
      const [z, w, pitch] = back[b], n = Math.floor(w / pitch);
      for (let i = 0; i < n; i++) {
        thread.x = -w / 2 + (i + 0.5 + (r() - 0.5) * 0.7) * pitch; thread.z = z; thread.geoTop = SKY_TOP; thread.picTop = 0;
        thread.h = [0, 0, 0, 0]; thread.r = [0, 0, 0, 0]; thread.slip = 0; thread.lag = 0; thread.phase = r();
        thread.level = keepLevel(i + 1); thread.pitch = pitch * (opts.skyCover ?? 0.25); thread.bundleDx = 0; thread.delay = 9; thread.gustAt = 99;
        push(lists.plain, thread);
      }
    }
  }
  await ctx.yield();
  await ctx.yield();
  const flat = (list) => list.a.subarray(0, list.length * 20);
  const meshes = {};
  for (const [name, geo, order] of [['lens', lensGeo, 1], ['plain', plainGeo, 2], ['snow', snowGeo, 3]]) {
    const m = makeSheetMesh(style, flat(lists[name]), lists[name].length, geo, mat);
    m.renderOrder = order; m.name = 'threads-' + name; group.add(m); meshes[name] = m;
    await ctx.yield();
  }

  // ---- cotton: the bindings wound round the summit's bundles, the two tie-backs of the exit, and the ribbons ----
  const cottonU = { ...U };
  const bindMat = new THREE.ShaderMaterial({
    uniforms: cottonU, side: THREE.DoubleSide, fog: false, toneMapped: false,
    vertexShader: /* glsl */`
    attribute vec4 aB0, aB1;                              // (x, y, z, half width)  (half height, start 0..1, seed, fold sign)
    uniform float uUnbind, uViewH; uniform vec3 uLancet;
    varying vec3 vQ;
    void main(){
      float go = clamp((uUnbind - aB1.y)*5./1.3, 0., 1.);                 // unwinds in 1.3 s, from its top down
      float yy = min(position.y, 1. - 2.*go);
      float alive = step(go, 0.999);
      if (abs(aB0.z) < 0.5 && abs(aB0.x) < uLancet.x) alive *= step(aB0.y + aB1.x + 6., uLancet.y*0.9);   // on the lancet: not before it is hoisted past them
      vec3 lc = (cameraPosition - modelMatrix[3].xyz)*mat3(modelMatrix);
      float px = length(vec3(aB0.x, aB0.y*aB1.w, aB0.z) - lc)*2./max(projectionMatrix[1][1]*uViewH, 1.);
      float hw = max(aB0.w, 1.3*px)*alive;
      vec3 p = vec3(aB0.x + position.x*hw*(1. - 0.25*go), (aB0.y + yy*max(aB1.x, 1.6*px))*aB1.w, aB0.z + 0.06);
      vQ = vec3(position.x, yy*aB1.x/max(aB0.w, 1e-3), aB0.w/max(px, 1e-5));
      gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
    }`,
    fragmentShader: /* glsl */`
    uniform vec3 uCotton, uAir;
    varying vec3 vQ;
    void main(){
      float wind = abs(fract(vQ.y*1.6 + vQ.x*0.55) - 0.5)*2.;              // the winding, turn on turn
      float line = smoothstep(0.72, 0.9, wind);
      line = mix(0.22, line, clamp((vQ.z - 4.)/6., 0., 1.));               // too fine to draw: its flat average
      gl_FragColor = vec4(mix(uCotton, uAir, line*0.8), 1.);
    }`,
  });
  // binding shape: a wound spindle, flat in the sheet's plane like everything else here, edges stepped by the turns
  const bindGeo = (() => {
    const prof = [[-1, 0.55], [-0.86, 0.9], [-0.5, 1.04], [0, 1.1], [0.5, 1.04], [0.86, 0.9], [1, 0.55]];
    const pos = [], idx = [];
    for (const [y, w] of prof) pos.push(-w, y, 0, w, y, 0);
    for (let i = 0; i < prof.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  })();
  const rb = rng.fork('bind');
  const binds = [], lancetBinds = [];                     // x, y, z, hw, hh, start, seed
  for (const b of bundles) {
    const S = SHEETS[b.k], bw = Math.max(S.pitch * 8, 14), span = b.top - b.snow;
    if (span < 26) continue;
    const hh = bw * rb.range(0.5, 0.95), gap = hh * 2 + bw * rb.range(0.12, 0.5);
    for (let y = b.snow + 20 + rb.range(0, gap * 0.5); y < b.top - hh - 6; y += gap * rb.range(0.8, 1.25)) {
      (b.k === 0 ? lancetBinds : binds).push([b.x, y, b.z, bw * 0.3, hh, b.k === 0 ? rb.range(-0.3, 0.2) : Math.max(0, (1 - y / 900) * 1.2 + rb.range(0, 0.12)), rb()]);
    }
  }
  rb.shuffle(binds); binds.length = Math.min(binds.length, Math.round(600 * detail));
  const nSummit = binds.length;
  for (const b of lancetBinds) binds.push(b);              // the lancet's own bindings are always kept: they let go first, past the lens
  // the two tie-backs of the exit lens never let go (start 99)
  const tieX = 7.6 + 1.1;
  const ties = [[LENS.x - tieX, LENS.y, LENS.z, 1.0, 1.7, 99, 0.3], [LENS.x + tieX, LENS.y, LENS.z, 1.0, 1.7, 99, 0.7],
    [LENS.x - tieX - 0.5, LENS.y - 4.6, LENS.z, 0.22, 3.0, 99, 0.1], [LENS.x + tieX + 0.5, LENS.y - 4.4, LENS.z, 0.22, 2.8, 99, 0.9],
    [LENS.x - tieX + 0.4, LENS.y - 3.9, LENS.z, 0.2, 2.2, 99, 0.2], [LENS.x + tieX - 0.4, LENS.y - 4.1, LENS.z, 0.2, 2.4, 99, 0.8]];
  // a bobbin of cotton hangs over the place of the parting until the lancet has been hoisted round it; it unwinds at about 25 s
  ties.push([LENS.x, LENS.y - 1.6, LENS.z + 4.5, 9.2, 10.5, -1.64, 0.5]);
  const allB = binds.concat(ties), nB = allB.length * 2;
  {
    const a0 = new Float32Array(nB * 4), a1 = new Float32Array(nB * 4);
    for (let i = 0; i < nB; i++) {
      const b = allB[i >> 1], sg = i & 1 ? -1 : 1;
      a0.set([b[0], b[1], b[2], b[3]], i * 4); a1.set([b[4], b[5], b[6], sg], i * 4);
    }
    const g = new THREE.InstancedBufferGeometry(); g.index = bindGeo.index; g.setAttribute('position', bindGeo.getAttribute('position'));
    g.setAttribute('aB0', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aB1', new THREE.InstancedBufferAttribute(a1, 4));
    g.instanceCount = nB;
    const m = new THREE.Mesh(g, bindMat); m.frustumCulled = false; m.renderOrder = 0; m.name = 'bindings'; group.add(m); meshes.bind = m;
  }
  await ctx.yield();

  // ---- ribbons: each binding that lets go falls as a white ribbon, twisting; parked at zero size until its clock ----
  const ribMat = new THREE.ShaderMaterial({
    uniforms: cottonU, side: THREE.DoubleSide, fog: false, toneMapped: false,
    vertexShader: /* glsl */`
    attribute vec4 aR0, aR1;                              // (x, y, z, start 0..1)  (length, width, seed, fold sign * (1 + seconds it hangs before it lets go))
    uniform float uUnbind, uViewH;
    varying float vS; varying vec3 vR;
    void main(){
      float sg = aR1.w < 0. ? -1. : 1., hold = abs(aR1.w) - 1.;
      float t = (uUnbind - aR0.w)*5. - 0.5, tp = max(t, 0.);
      float len = aR1.x, V = 5. + sqrt(max(len, 0.));
      float s = position.y;                               // 0 the free end, 1 the end still wound on the bundle
      float pay = min(tp*5., (1. - s)*len);               // paying out: the free end runs down while the other is still wound on
      float t2 = max(t - hold - s*0.3, 0.);               // then it lets go and falls whole, twisting
      float fall = V*(t2 - (1. - exp(-1.6*t2))/1.6);
      float ph = aR1.z*6.2832, near = step(-1., aR0.z);
      float side = near > 0.5 ? (aR0.x < 0. ? -1. : 1.) : (aR1.z < 0.5 ? -1. : 1.);   // always away from the parting: nothing crosses the portal
      float A = 1.2 + len*0.06, k = (1. - s)*min(tp, 1.5)/1.5 + s*min(t2, 2.)*0.5;
      float paid = min(tp*5./max(len, 1.), 1.), slack = (1. - s)*(1. - s)*len*paid*(0.1 + 0.14*aR1.z);   // it hangs in a slack curve, the free end carried away from the parting
      vec3 c = vec3(aR0.x + A*k*sin(1.1*t + ph + s*2.6) + side*(slack + (0.5 + aR1.z*1.8)*t2),
                    max(aR0.y - pay - fall, 0.),
                    aR0.z + 1.5 + 0.8*A*k*(0.6 + 0.4*cos(1.9*t + ph*1.7 + s*2.)) + t2*mix(6. + len*0.3, 1.2, near));
      float th = 0.9*t + ph*2.3 + s*(5. + 3.5*aR1.z);      // the twist: two or three half turns along its length, turning slowly
      vec3 lc = (cameraPosition - modelMatrix[3].xyz)*mat3(modelMatrix);
      float dist = length(vec3(c.x, c.y*sg, c.z) - lc), px = dist*2./max(projectionMatrix[1][1]*uViewH, 1.);
      // a tape, never a slab: at least two pixels, at most a fiftieth of the frame's height, whatever its distance
      float w = min(max(aR1.y, 3.*px), 0.016*uViewH*px)*step(0., t)*smoothstep(0., 0.4, t)*smoothstep(0.5, 9., c.y)*(0.45 + 0.55*smoothstep(0., 0.1, s));
      w *= smoothstep(9., 24., dist);                     // nothing comes close: it tapers away before it could cross the lens
      float cx = cos(th); cx = (cx < 0. ? -1. : 1.)*max(abs(cx), 0.45);        // never quite edge-on: it must not vanish
      c += vec3(cx, 0.3*sin(th), 0.6*sin(th))*position.x*w;
      c.y *= sg; vS = sin(th); vR = vec3(position.x, s*len, w/max(px, 1e-5));
      gl_Position = w > 0. ? projectionMatrix*modelViewMatrix*vec4(c, 1.) : vec4(2., 2., 2., 1.);
    }`,
    fragmentShader: /* glsl */`
    uniform vec3 uCotton, uAir; varying float vS; varying vec3 vR;
    void main(){
      vec3 col = vS > 0. ? uCotton : uAir*0.88;                                 // its light face and its shaded face
      float line = step(0.78, fract(vR.y*0.8 + vR.x*0.6))*clamp((vR.z - 3.)/3., 0., 1.);   // the winding it came off, on tapes wide enough to draw it
      gl_FragColor = vec4(mix(col, uAir*0.8, line*0.55), 1.);
    }`,
  });
  {
    const SEG = 20, pos = [], idx = [];
    for (let i = 0; i <= SEG; i++) pos.push(-0.5, i / SEG, 0, 0.5, i / SEG, 0);
    for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const rr = rng.fork('ribbons'), nR = Math.round(170 * detail), recs = [];   // x, y, z, start, length, width, seed, seconds hanging
    for (let i = 0; i < nR && binds.length; i++) {
      if (i < nR * 0.22) {                                // off the lancet's bound tip, either side of the lens: narrow tapes that hang, then fall
        const x = LENS.x + rr.sign() * rr.range(11, LANCET.half - 2);
        recs.push([x, Math.min(LANCET.top - LANCET.drop * Math.pow(Math.min(Math.abs(x) / LANCET.half, 1), 1.7) - 2, 228 + (rr.range(4, 84) - 4) * 0.45), 0, rr.range(-0.8, 0.45), rr.range(16, 28), rr.range(1.2, 1.7), rr(), i % 5 === 0 ? rr.range(9, 14) : rr.range(2.5, 7)]);
      } else if (i < nR * 0.42) {                         // off the crests of the two nearest flanks
        const ti = rr.int(0, Math.min(lists.plain.length - 1, 7000)) * 20, th = lists.plain.a.subarray(ti, ti + 20);
        const q = [th[0], Math.max(th[3] - rr.range(0, 30), 20), th[1], rr.range(0.05, 0.85), rr.range(18, 32), rr.range(0.6, 1.0), rr(), rr.range(1, 4)];
        if (Math.abs(q[0]) > LANCET.half + 8) recs.push(q);
      } else {                                            // off the summit's bundles, far off (the lancet's own bindings are served above)
        const b = binds[rr.int(0, Math.max(nSummit - 1, 0))];
        recs.push([b[0], b[1], b[2], b[5] + 0.02, rr.range(60, 140), rr.range(3, 5), rr(), 0]);
      }
    }
    const a0 = new Float32Array(recs.length * 8), a1 = new Float32Array(recs.length * 8);
    recs.forEach((q, i) => { for (let m = 0; m < 2; m++) { a0.set([q[0], q[1], q[2], q[3]], (i * 2 + m) * 4); a1.set([q[4], q[5], q[6], (m ? -1 : 1) * (1 + q[7])], (i * 2 + m) * 4); } });
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.setAttribute('aR0', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aR1', new THREE.InstancedBufferAttribute(a1, 4));
    g.instanceCount = recs.length * 2;
    const m = new THREE.Mesh(g, ribMat); m.frustumCulled = false; m.renderOrder = 0; m.name = 'ribbons'; group.add(m); meshes.ribbons = m;
  }
  // ---- sky tapes: bare warp that carries on above the crests of the three nearest flanks to the top bar. Each is drawn
  //      only while the eye is near enough for it to be a tape with a sheen (see packSkyTape), so the climb's sky is hung
  //      silk in depths while the far view of the white peak stays clear ----
  const skyGeo = skyStripGeometry();
  {
    const rt = rng.fork('tapes'), TAPE = [[0, 620, 14, 0.8], [1, 900, 30, 1.2], [2, 1000, 50, 1.7]], arr = new Float32Array(600 * 20);
    let n = 0;
    for (const [k, half, gap, pitch] of TAPE) {
      for (let x = -half; x < half && n < 600; x += gap * rt.range(0.45, 1.6)) {
        const T = ats[k](x).T, lan = k === 0 && Math.abs(x) < LANCET.half + 2;
        packSkyTape(arr, n++, x, SHEETS[k].z - 1, lan ? T + 6 : Math.max(T - 3, 4), pitch * (1 + 0 * rt.range(0.7, 1.35)) * (lan ? 0.85 : 1), rt());
        arr[(n - 1) * 20 + 15] = 1;                       // (kept one level further: a fine even line from twice as far)
      }
      await ctx.yield();
    }
    const m = makeSheetMesh(style, arr.subarray(0, n * 20), n, skyGeo, mat);
    m.renderOrder = 2.5; m.name = 'sky-tapes'; group.add(m); meshes.tapes = m;
  }
  // ---- the air between sheets: raw silk in shade, a plain shell round the eye (opts.air = false to use your own) ----
  let air = null;
  if (opts.air !== false) {
    // two flat tones: raw silk in shade above the fold, one step deeper below it, meeting in a level line (the far shore of the lake)
    air = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), new THREE.ShaderMaterial({
      uniforms: { uAir: U.uAir, uLow: U.uLow }, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
      vertexShader: /* glsl */`varying float vY; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vY = w.y; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */`uniform vec3 uAir; uniform vec4 uLow; varying float vY; void main(){ gl_FragColor = vec4(vY < 0. ? mix(uAir, uLow.rgb, min(uLow.a*2.5, 1.)) : uAir, 1.); }`,
    }));
    air.scale.setScalar(opts.airRadius ?? 3000); air.renderOrder = -0.5; air.frustumCulled = false; air.name = 'air'; group.add(air);
  }
  await ctx.yield();

  // ---- storks: five travelling gaps of undyed thread over the middle flats, starboard to port, 10 to 30 s ----
  const rs = rng.fork('storks');
  const storks = []; for (let i = 0; i < 5; i++) storks.push({ k: i % 3, y: rs.range(60, 105) + (i % 3) * 24, lead: i * 0.055 + rs.range(-0.015, 0.015), ph: rs() * 3, bob: rs.range(6, 14) });
  const pose = (t) => { const c = ((t % 2.1) + 2.1) % 2.1, e = (a) => { const v = Math.min(1, Math.max(0, a)); return v * v * (3 - 2 * v); };   // up, level, down, eased
    return 1 - e((c - 0.35) / 0.3) - e((c - 1.0) / 0.3) + 2 * e((c - 1.7) / 0.35); };
  const setStorks = (tJ) => {
    for (let m = 0; m < 2; m++) for (let i = 0; i < 5; i++) {
      const s = storks[i], t = tJ - m * 0.45, u = (t - 10) / 20 - s.lead + 0.1, v = U.uStork.value[m * 9 + i];
      if (u < 0 || u > 1) { v.set(0, -9999, -99999, 0); continue; }
      v.set(880 - u * 1760, s.y + Math.sin(t * 0.5 + s.ph) * s.bob + 14 * Math.sin(u * 3.1), SHEETS[s.k].z, pose(t + s.ph));
    }
  };

  // ---- clock, update, anchors ----
  let progress = -1;                                      // set by the world; without it the piece plays its 40 s by itself
  const dbgT = DEBUG.get('heroT'), dbgCam = DEBUG.get('heroCam');
  const eye = new THREE.Vector3();
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function update(dt, time, camera) {
    const tJ = progress >= 0 ? progress * 40 : globalThis.__heroT !== undefined ? globalThis.__heroT : dbgT !== null ? parseFloat(dbgT) : time % 46;
    style.setClock(tJ);
    if (camera) { eye.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(eye); }
    style.update(time, camera, ctx.renderer, eye.y);
    if (weather === 'breezy') U.uBreath.value += 0.22 + 0.16 * Math.sin(time * 0.61) + 0.1 * Math.sin(time * 1.37);
    U.uShift.value = shift ? 30 * sm(13.4, 14.2, tJ) * (1 - sm(22, 25.5, tJ)) : 0;   // seen on the whole mountain from the lake, back in register on the climb
    U.uLancet.value.y = 60 + 380 * sm(HOIST[0], HOIST[1], tJ);   // the lancet is hoisted: its threads run up from the flank to the bound tip
    if (opts.cast === undefined || opts.cast === 'storks') setStorks(tJ);   // another cast (horses, swans) is driven by the world
    if (air) air.position.copy(eye);
  }
  group.updateMatrixWorld(true);
  update(0, 0, null);

  const summit = SHEETS[5];
  const anchors = {
    // the 14 m exit portal: centre of the lens parting in the nearest flank; normal points back down the 30 degree approach
    portalSeat: { position: new THREE.Vector3(LENS.x, LENS.y, LENS.z), normal: new THREE.Vector3(0, -0.5, 0.866), tiltDeg: 30, radius: 7 },
    lens: { center: new THREE.Vector3(LENS.x, LENS.y, LENS.z), halfWidth: 7.6, halfHeight: 17, tieBacks: [new THREE.Vector3(-tieX, LENS.y, 0), new THREE.Vector3(tieX, LENS.y, 0)] },
    // a safe camera line in local space (the camera flies toward -Z): level over the lake, then 30 degrees up into the lens
    flyThrough: [[0, 5, 1000], [0, 4, 760], [25, 9, 560], [0, 5, 400], [0, 12, 352], [0, 42, 300], [0, 99.5, 200], [0, 157, 100], [0, 180.4, 60], [0, 215, 0]].map((p) => new THREE.Vector3(...p)),
    spurCrossings: [new THREE.Vector3(0, 42, 300), new THREE.Vector3(0, 99.5, 200), new THREE.Vector3(0, 157, 100)],
    viewpoints: { entry: new THREE.Vector3(0, 5, 1000), image: new THREE.Vector3(25, 9, 560), climb: new THREE.Vector3(0, 99.5, 200) },
    summit: new THREE.Vector3(SUMMIT_X, summit.H, summit.z),
    lookAt: new THREE.Vector3(0, 300, -600),
    sheets: SHEETS.map((s) => ({ z: s.z, height: s.H, pitch: s.pitch })),
  };
  let radius = 1300, height = 900; const center = new THREE.Vector3(0, 300, -450);
  if (dbgCam) { const q = dbgCam.split(',').map(Number); radius = q[0]; height = q[1]; center.set(q[2], q[3], q[4]); }   // viewer only: heroCam=r,h,x,y,z
  return {
    object: group, radius, height, center, anchors, style, uniforms: U, meshes,
    variant: { season, weather, shift },
    setProgress(u) { progress = Math.min(1, Math.max(0, u)); },
    update,
    dispose() { plainGeo.dispose(); snowGeo.dispose(); lensGeo.dispose(); bindGeo.dispose(); skyGeo.dispose(); },
    ground: false, groundY: 0,
  };
}
