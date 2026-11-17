// THE SHOEBOX REEF: hero set piece. The manta and its shoal.
//
// WHAT IT IS  A manta 40 m across cut from one grey box lid (a body and four wing panels joined by eight brass fasteners, belly
// brushed white with five pencilled gill lines a side, a painted mouth and eyes, the cut edge brown and fluted all round), hung on
// four threads from a cross of dowels and beating once in 7 s: every panel stays dead flat and turns only at its fastener line, the
// tips sweep 20 m, a 28 m tail of plaited wool snakes behind (toward -Z). Round it turns a mobile of wire coat-hangers in five tiers,
// each tier turning against the next, with 2,000 kitchen-foil sardines each on its own thread; a band of white flashes goes round
// the shoal once in 8 s as the draught turns each fish to face the lid.
//
// SIZE / PLACE  Origin on the floor under the manta, +Y up, the course along +Z. Belly at y 82, cross of dowels at y 184, lid
// expected at y 190 (two threads run up to it). radius 72, height 190. The camera's turn is at r 36, y 66-74. Tier 0 (inner) hangs
// under the belly: fish r 12-22, y 47-59. Tier 1 hangs right over the turn: fish r 31-43, y 79.5-90 (6 m clear above the camera), so
// foil streams overhead and ahead all the way round. Tiers 2-4: fish r 44-70, at y 83-130 ONLY, so the level approach and the run
// out pass under them and no thread of theirs hangs through the ride's height. Put the coral head (to y 45) under it. No lights, no fog.
//
// OPTS  palette (the brief's seven hex strings: card, pink, orange, yellow, sky blue, ultramarine, white), detail 0.6-1 (thins only
// the tail's segments, never the shoal), style (a style object from createStyle() if the world made one first; otherwise the hero
// makes it and returns it as hero.style), spin (+1 default: the camera circles with increasing angle from +X toward +Z, as in
// anchors.flyThrough; the inner tier then turns against the camera and tier 1 with it; -1 mirrors every tier and the flash band),
// stage (default true: a plain sugar-paper floor disc for the set-piece viewer; THE WORLD PASSES stage: false).
// Previews: opts.view = 'in' (orbit at the journey's distance, from below), 'low', 'steps' (three demo sheets).
//
// RETURNS  { object, radius, height, center, anchors, style, update(dt, time, camera), setGust(0..1), setPose(yaw, leanX, leanZ), dispose, ground: false }.
// Tiers 1, 3 and 4 also carry a LOW FILE (SBR_TIER_DEFS[k].eye): every fifth / fourth fish of the tier hangs in a band 3 m deep just over the hole's sight
// (opts.overSight(radius) from the world; y 78 or more) on the straight (the shoal is still 2,000); tier 1's hang from a ring of longer arms at r 43.6.
// setPose turns the manta on its threads and leans its belly toward a horizontal direction (the world lets it swing a little by its own slow clock). opts.bandPhase offsets the flash band.
// setGust(g) is the only progress hook (the rare event: tiers spin up, every fish turns white at 1, the tail streams); drive it from u.
// Everything else is an ambient loop on `time`. update() also calls style.tick(time) and writes lid-shadow slots 0-4.
//
// ANCHORS (hero-local)  mantaCentre, bellyY, crossY, lidY; orbit { radius 36, yStart 66, yEnd 74, innerClear, outerClear, fishFreeY };
// flyThrough: the line as 17 points: in along x 36 at y 66, one full turn of radius 36 rising to y 74, level out along
// x 36 at y 74 to z 95; portalSeat { position (36, 74, 95), facing (0,0,-1), radius 7 }: the hole in the back wall; viewpoints.entry
// / belly / image { position, target }; wireArm { pivot, reach } for the arm that carries the turtle; shadowSlots [0..4] are taken.
//
// COST  about 42k triangles, 21 draw calls (5 manta flats + pencil, tail, rig, rig threads, 4 manta threads, 5 tiers, shoal, shoal
// threads, stage), one 512 canvas texture, about 60 ms of build in steps under 20 ms, no lights.
//
// THE STYLE AND ITS EXPORTS (shade the whole world with these; the world returns post { flat: 1, bloom { strength 0 }, grade
// { saturation 1, contrast 1, vignette 0, grain 0 } } and colours are written as plain display hex: NO inverse tone map anywhere)
//   createStyle(ctx, palette) -> style { pal, uniforms, paintMaterial(o), lineMaterial(o), foilMaterial(), celloMaterial(w,h),
//       celloSheet(desc), setSheets(list), setShadow(i, ...), setLid(...), tick(time) }. One set of uniforms is shared by every
//       material, so the world is lit, shadowed and counted into the blue by one routine.
//   STYLE_GLSL (both stages): sbrSheets(eye, p) counts the cellophane rectangles the eye-to-point line passes through (hard edged,
//       19 max; it also leaves the count in sbrCrossN for the paper's steps); sbrWater(c, n) is the counted water, every step DEEPER: paint goes a quarter of
//       the way to the film's colour per sheet (and the film's colour sinks toward the deep from the second on), dark sugar paper goes uVeil.x (a quarter) of the way
//       to uDeepK times itself per sheet, four steps at most, so nothing is ever paler than the bare paper and the bare wall is the most saturated tone;
//       (the steps are geometric: each sheet takes the same share of what is left, by the count of sheets on the line of sight alone and so the same from every
//       eye; bare paper is not dimmed outside the pools of daylight);
//       (slot 5 is the visitor's own shadow, drawn as a turtle: an oval shell, a head and two flippers that row with uTurtle.x; uTurtle.y its size, .z the length of the
//       manta's tail in its shadow, .w how far the manta's shadow is carried along the light's slant (0: straight below); it lies only on faces turned to the lid)
//       sbrShadow(p) the lid shadow (soft violet shapes lying almost straight below their casters; slots 0-4 are the manta's five flats and its tail, drawn
//       as five crisp cut flats of ONE violet with a seam of light (uHinge.x metres) at each hinge, leant along uShAnchor while the world looks down on it). STYLE_FRAG_GLSL adds
//       sbrCrinkleAt(p) (the cellophane's drifting net of thrown light) and sbrLight(pot, p, n, sheets), which does all of it.
//   PAINT (style.paintMaterial): attributes position, normal, color (pot colour), aPaint (brushU, brushV, edge, kind):
//       kind 0 poster paint (streaks along brushU, stops short of the rim: bare card where edge < ~0.25 m), 1 cut edge (flutes),
//       2 bare stock, 3 brass, 4 matte (tape, sugar paper), 5 wool; with o.cut also 6 crepe paper (ruffled, crinkled) and 7 punched card. Works with InstancedMesh (+ instanceColor). o.vertWater counts
//       sheets per vertex (small things); o.hook / o.hookDecl / o.uniforms inject GLSL that moves `pos` and `nrm` (hinges, ruffles).
//   cardGeometry(outline, o): any flat cut from card: both painted faces with an inset rim ring and the fluted side wall.
//   paintBuffers(), addCylinder(), addFastener(): the raw builders in the same attribute layout (dowels, tubes, fasteners).
//   LINE (style.lineMaterial + ribbonBuffers()): thread, wire and pencil as ribbons widened to 1.5 px, alpha = true width / drawn. uPale 1 (the mobile's wire):
//       dark where the line is seen against the lid, pale (uPaleCol) and fainter where it is seen against the deep.
//   FOIL (style.foilMaterial): white where a flat faces the lid, mirrored blue where it does not; only the hero uses it.
//   CELLOPHANE (style.celloSheet({ axis: 'z'|'x', at, lo, hi, y0, y1 })): the sheet's own skin, rippling from its top edge; pass
//       the same descriptors to style.setSheets() and every material steps one flat blue per sheet, with the edge on the sheet's edge.
//   SBR_PALETTE, SBR_EXTRA (the fixed non-brief colours: red, green, black, grey, pencil, shadow, brass, wire, tape, dowel).
import * as THREE from 'three';

export const SBR_PALETTE = ['#B98D5A', '#F2668B', '#F58A1F', '#FFD23F', '#43ABE2', '#2438A6', '#F6F3E8'];
// the eight pots plus the fixed stock colours that are not in the brief's seven (display hex, used as written under post.flat)
export const SBR_EXTRA = { red: '#E23B2E', green: '#3FA34D', darkGreen: '#1F7A46', black: '#26242B', grey: '#8E9299', pencil: '#5A5A66',
  shadow: '#8C86B5', brass: '#C79A2B', wire: '#3A3A44', tape: '#E9DDB4', wool: '#F6F3E8', dowel: '#D8B988' };
export const SBR_MAX_SHEETS = 19, SBR_MAX_SHADOWS = 17, SBR_TIERS = 5;

// ---------------------------------------------------------------- shared GLSL (both stages) ----------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
#define SBR_SHEETS 19
#define SBR_SHADOWS 17
uniform float uTime;
uniform vec4 uSheetA[SBR_SHEETS];   // x: plane coordinate, y,z: lo,hi along the sheet, w: 0 = sheet across the course (plane z = x), 1 = lengthwise (plane x = x)
uniform vec2 uSheetB[SBR_SHEETS];   // bottom y, top y
uniform float uSheetN;
uniform vec4 uShA[SBR_SHADOWS];     // caster centre x, z, half-length, half-width (world)
uniform vec4 uShB[SBR_SHADOWS];     // cos, sin of the long axis, caster height y, strength 0..1
uniform vec3 uCard, uBlue, uDeep, uShadowCol, uCrinkleCol;
uniform vec4 uLid;                  // centre x, z, half-width x, half-depth z (world)
uniform float uLidY, uCrinkleAmt, uWaterStep, uRain;
uniform vec2 uSlant;                // horizontal drift of lid light per metre of drop (tan 12 deg)
uniform sampler2D uCrinkle;
uniform vec4 uPool[11];             // where daylight comes down: x, z at height w, radius (0: none). 0: the open lid over centre stage, 1: the daylight by the hole; 2-10: the nine shafts
uniform vec4 uPoolTint;             // what a shaft does to the dark sugar paper it lands on: rgb the hour's tint, w how much paler the paper is in its pool
uniform vec3 uPoolAmt;              // light outside the shafts, light inside them, warmth inside
uniform vec3 uDeepK;                // what the film does to dark paper: the sugar paper's own hue, deeper (blue box, green box)
uniform float uShShift;
uniform vec4 uShAnchor;              // the manta's lid shadow: lean x, z per metre of drop below the anchor height z; w: how far it is drawn out along the lean (0: not at all)
uniform vec3 uVeil;                 // what a sheet does to the dark paper behind it: x the step per sheet (of the way to uDeepK times itself), y the most, z the weight of a sheet far down the box
uniform vec3 uSpot;                 // x, z, radius: a place the manta's shadow never covers (the crab keeps its daylight)
uniform vec4 uTurtle;               // our turtle's lid shadow (slot 5): x how far each flipper is swept forward (radians), y its size, z the wool tail's length in the manta's shadow (metres), w how far the manta's shadow is carried along the light's slant (1: as the light falls, 0: straight below)
uniform vec4 uHinge;                // lid shadow of the manta: x seam of light at each hinge (metres), y size on the coral, z strength of the steps' own crescents under it, w reach of a hung tray's shadow at a low sun
float sbrHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float sbrNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sbrHash(i), sbrHash(i + vec2(1., 0.)), f.x), mix(sbrHash(i + vec2(0., 1.)), sbrHash(i + vec2(1., 1.)), f.x), f.y); }
// WATER: how many hung sheets of cellophane the straight line from eye e to point p passes through (hard edged, countable)
float sbrCrossN = -1.;              // (set by sbrSheets in the same stage: the sheets hung ACROSS the course among them; -1 where the count came in as a varying)
float sbrSheets(vec3 e, vec3 p){
  float n = 0., nc = 0.; vec3 d = p - e;
  for (int i = 0; i < SBR_SHEETS; i++) {
    vec4 a = uSheetA[i]; vec2 b = uSheetB[i];
    float along = a.w < 0.5 ? d.z : d.x, from = a.w < 0.5 ? e.z : e.x;
    float den = abs(along) < 1e-4 ? 1e-4 : along;
    float t = (a.x - from) / den;
    vec3 h = e + d * t;
    float s = a.w < 0.5 ? h.x : h.z;
    float hit = step(0., t) * step(t, 1.) * step(a.y, s) * step(s, a.z) * step(b.x, h.y) * step(h.y, b.y) * step(float(i) + 0.5, uSheetN);
    // (a sheet's veil on the paper is the same over the whole sheet and plainest for the sheets near the eye: the ones we are passing split the frame,
    // the ones far down the box lay a finer step, so the far wall keeps its depth)
    n += hit; nc += hit * (a.w < 0.5 ? mix(uVeil.z, 1., 1. - smoothstep(50., 110., abs(a.x - from))) : 1.);
  }
  sbrCrossN = min(nc, 7.);
  return min(n, 7.);
}
// one flat step per sheet, the same over the whole sheet and hard at its hem and border, and every step is DEEPER. Cellophane is a filter: bright paint behind it
// goes a quarter of the way to the film's colour per sheet, and from the second sheet on the film's colour itself sinks toward the deep (one tone after four); dark
// sugar paper behind it goes a step deeper in its own hue (uVeil.x of the way to uDeepK times itself) for every sheet, a full step for the sheets we are passing and a
// finer one for those far down the box, so the wall is nowhere paler than the bare paper and the bare paper round the hole is the most saturated tone in the box
vec3 sbrWaterB(vec3 c, float n, float bright){
  float nc = sbrCrossN < 0. ? n : sbrCrossN;
  vec3 dark = c * pow(max(uDeepK, vec3(1e-3)), vec3(min(uVeil.x * nc, uVeil.y)));   // (each sheet takes the same share of what is left: four even steps from the bare paper down to uDeepK times it)
  float k = min(0.25 * n, 0.76 + 0.03 * n);
  vec3 target = mix(uBlue, uDeep * 0.5, 0.72 * smoothstep(1.0, 4.6, n));
  // a sheet's step is plain on every edition: the paint goes a quarter of the way to the water's colour, and where that colour is nearly the paint's own value
  // (pink in pale water) the water it goes toward is taken deeper, six tenths of the paint's value, so each sheet takes a tenth of the value at the least
  float lc = dot(c, vec3(0.3, 0.55, 0.15)), lt = dot(target, vec3(0.3, 0.55, 0.15));
  target *= min(1., 0.6 * lc / max(lt, 1e-3));
  return mix(dark, mix(c, target, k), bright);
}
vec3 sbrWater(vec3 c, float n){ return sbrWaterB(c, n, smoothstep(0.27, 0.5, dot(c, vec3(0.3, 0.55, 0.15)))); }
// DAYLIGHT: the shafts that come down between the dowels; 1 inside one, 0 outside, soft over a few metres
float sbrPoolP = 0.;                 // (set by sbrPool: the same for the nine shafts alone, whose pools also show on the paper)
float sbrPool(vec3 p){
  float l = 0., lp = 0.;
  for (int i = 0; i < 11; i++) {
    vec4 a = uPool[i]; vec2 q = p.xz - a.xy - uSlant * (a.w - p.y); float r = max(a.z, 0.01);
    float e = (1. - smoothstep(r * 0.9, r * 1.04, sqrt(dot(q, q)))) * step(0.02, a.z);     // (a shaft's edge is firm, like cut paper)
    l = max(l, e); if (i > 1) lp = max(lp, e);
  }
  sbrPoolP = lp;
  return l;
}
// LID SHADOW: soft grey-violet ellipses lying almost straight below their casters; 0 = lit, 1 = full shadow
float sbrTurtleSh = 0.;              // our turtle's shadow (slot 5), kept apart: it lies only on what faces the lid
float sbrShadowSplit(vec3 p, out float others){
  float s = 0., so = 0., sl2 = dot(uSlant, uSlant), sl = sqrt(sl2); sbrTurtleSh = 0.;
  vec2 sd = sl2 > 1e-6 ? uSlant / max(sl, 1e-3) : vec2(1., 0.);
  float st = 1. + 2.6 * smoothstep(0.09, 0.6, sl2);             // a low sun draws the far half of a shadow out long, away from the light (noon's 12 degrees leaves it as it is)
  float offK = sl / (1. + 3. * sl2);                            // and it still falls where the eye can find it: under and a little beyond its caster
  float cap = 3.2 + 4.2 * smoothstep(0.25, 0.7, sl2);           // a low sun draws the steps' and the trays' shadows out two or three times as long
  vec2 c0 = uShA[0].xy;
  float lnl = dot(uShAnchor.xy, uShAnchor.xy); vec2 lnN = lnl > 1e-6 ? uShAnchor.xy * inversesqrt(lnl) : vec2(1., 0.);
  for (int i = 0; i < SBR_SHADOWS; i++) {
    vec4 a = uShA[i], b = uShB[i];
    float drop = b.z - p.y, panel = i < 5 ? 1. : 0.;            // slots 0-4 are the manta's five flats: cut shapes, not ovals
    // the lid is a wide light: the manta's shadow closes in a little as it falls (uHinge.y of its size on the coral 35 m below), and stays the animal's own shape:
    // a pointed body and two flats a side, lying across the top steps and over their edge
    float shr = mix(1., mix(1., uHinge.y, smoothstep(8., 36., drop)), panel);
    float reach = i > 12 ? max(cap, uHinge.w * smoothstep(0.25, 0.7, sl2)) : cap;   // (a hung tray's shadow is drawn out across the floor by a low sun)
    // (the manta's shadow is laid at the height of the coral head's top, uShAnchor.z, and leans from there by uShAnchor.xy per metre of drop: the world leans it
    // along our line of sight while we look down, so the steps do not break its outline and it is seen as the animal's own shape)
    vec2 q;
    if (i < 5) {
      vec2 Q = p.xz - c0 - sd * (0.8 * offK * (b.z - uShAnchor.z) * uTurtle.w) - uShAnchor.xy * (uShAnchor.z - p.y);
      Q -= lnN * (dot(Q, lnN) * uShAnchor.w + uShShift);         // (and drawn out along that line as a slanting light draws a shadow out, so we see it at its full length; uShShift: metres farther along it)
      q = Q - (a.xy - c0) * shr;
    } else q = p.xz - a.xy - sd * min(sl * drop, reach);
    if (i > 12) q -= sd * dot(q, sd) * (1. - 1. / (1. + 0.5 * (st - 1.)));   // (a hung tray's shadow is drawn out long by a low sun; the manta's keeps the animal's own shape at every hour)
    vec2 r = max(a.zw * shr, vec2(0.01));
    q = vec2(q.x * b.x + q.y * b.y, -q.x * b.y + q.y * b.x) / r;
    vec2 qa = abs(q);
    float qo = (i == 3 || i == 4) ? -q.x : q.x;                 // toward the wing tip
    float l = length(q);
    if (i == 0) {
      l = max(qa.y, qa.x + 0.42 * qa.y);                         // the body: straight sides, pointed at nose and tail
      float tx = -q.x * r.x - 0.8 * r.x, tt = tx / max(uTurtle.z, 0.5);          // and the wool tail trailing behind it: a thin line, snaking a little
      float ty = abs(q.y * r.y - 1.2 * tt * sin(tx * 0.3 + uTime * 0.9));
      if (tt > 0. && tt < 1.) l = min(l, ty / (0.8 * (1. - 0.6 * tt)));
    }
    else if (i == 1 || i == 3) l = max(qa.x, qa.y / max(1. - 0.2 * (qo + 1.), 0.2));   // the inner flat: a trapezoid, narrower where the outer one hinges on
    else if (i == 2 || i == 4) l = max(qa.x, abs(q.y + 0.3 * (qo + 1.)) * 0.84 + 0.42 * (qo + 1.));   // the outer flat: a triangle out to the tip, swept back a little
    if (i == 5) {
      vec2 m = q * r / max(uTurtle.y, 0.1);                      // metres in the turtle's own frame: x toward its nose, y to its side
      float lt = length(m / vec2(2.5, 1.85));                    // the shell: a card oval 5 m long
      lt = min(lt, length((m - vec2(3.05, 0.)) / vec2(0.85, 0.6)));   // the head
      float ca = cos(uTurtle.x), sa = sin(uTurtle.x);
      for (int f = 0; f < 2; f++) {                              // two flippers, 3.2 m, turning on their fasteners
        float sg = f == 0 ? 1. : -1.; vec2 a0 = vec2(1.35, sg * 1.45), ba = vec2(sa, sg * ca) * 3.2, pa = m - a0;
        float h = clamp(dot(pa, ba) / 10.24, 0., 1.); vec2 ev = pa - ba * h;
        lt = min(lt, sqrt(dot(ev, ev)) / (0.34 + 0.3 * sin(3.1416 * min(h * 1.25, 1.))));
      }
      l = lt; panel = 1.;
    }
    float soft = min(mix(clamp(drop * 0.03, 0.35, 1.6), 0.07, panel) / max(min(r.x, r.y), 0.5), 0.6);   // the edge is soft over a metre or two, whatever the size of the caster (the manta's panels: a firm half metre)
    float e = 1. - smoothstep(1. - soft, 1. + soft, l);
    // (the five flats are cut shapes with crisp edges; each wing flat stops uHinge.x metres short of its hinge, so a seam of lit paint parts it from its neighbour)
    if (i > 0 && i < 5) e *= smoothstep(uHinge.x - 0.07, uHinge.x + 0.07, (qo + 1.) * r.x);
    if (i == 5) sbrTurtleSh = e * b.w * step(0.5, drop);           // (our turtle's: the same flat violet as the manta's)
    else if (i < 5) s = max(s, e * b.w * smoothstep(24., 32., drop));   // (not on the manta's own wings as they dip under its body)
    else if (i > 5) so = max(so, e * b.w * step(0.5, drop) * ((i > 6 && i < 13) ? mix(1., uHinge.z, s) : 1.));   // (the steps' own crescents are lighter where the manta's shadow lies over them, so its outline is not lost in theirs)
  }
  { vec2 qs = p.xz - uSpot.xy; s *= smoothstep(uSpot.z * 0.7, uSpot.z * 1.05 + 0.01, sqrt(dot(qs, qs))); }
  others = so;
  return s;                                                     // the manta's five panels; others is the rest (the steps, the crab, the turtle)
}
float sbrShadow(vec3 p){ float o; float s = sbrShadowSplit(p, o); return max(max(s, o), sbrTurtleSh); }
`;
// fragment-only: the cellophane's net of thrown light (one baked crease texture, two layers drifting ~1 m/s, projected from above)
export const STYLE_FRAG_GLSL = /* glsl */`
float sbrCrinkleAt(vec3 p){
  vec2 u1 = p.xz * 0.013 + vec2(uTime * 0.019, uTime * 0.008) + p.y * 0.004;
  vec2 u2 = vec2(p.z, -p.x) * 0.017 + vec2(-uTime * 0.011, uTime * 0.021) + 0.37;
  float a = texture2D(uCrinkle, u1).r, b = texture2D(uCrinkle, u2).r;
  return clamp(max(a, b * 0.7) * 0.75 + a * b * 1.2, 0., 1.);
}
// rain on the window (uRain 1): the net of crinkle light gives way to slow streaks sliding down every face, a bright bead with a tail above it
float sbrRainAt(vec3 p, vec3 n){
  vec2 q = abs(n.y) > 0.6 ? vec2(p.x * 0.9 + 3.1, p.z + 0.3 * p.x) : vec2(p.x * 0.8 + p.z * 0.6, -p.y);
  float col = q.x * 1.1, fw = fwidth(col), id = floor(col), fx = abs(fract(col) - 0.5), h = sbrHash(vec2(id, 7.));
  float v = fract(q.y / 26. - uTime * (0.03 + 0.03 * h) + h * 13.);
  float streak = smoothstep(0.1, 0.5, v) * (1. - smoothstep(0.5, 0.53, v));
  float w = 0.09 + 0.07 * streak;
  float m = (1. - smoothstep(w, w + fw + 0.01, fx)) * streak * 1.3 * min(1., w / max(fw * 0.8, 1e-4));   // a streak thinner than a pixel and a half fades instead of being drawn wider than it is
  return clamp(mix(m, 0.05, smoothstep(0.22, 0.55, fw)), 0., 1.);
}
// everything the light does to a pot colour: lid facing, lid shadow, crinkle light, then the counted water
vec3 sbrLight(vec3 pot, vec3 p, vec3 n, float sheets){
  float up = smoothstep(-0.25, 0.7, n.y);
  // a fifth brighter where it faces the lid, the pot colour midway; a face turned right away from the lid (the underside of a flat) is a tone deeper the squarer it
  // looks down, so the flats of a hinged thing seen from below stand at different tones
  vec3 c = pot * mix(mix(0.83, 0.94, smoothstep(-1., -0.62, n.y)), 1.10, up);
  float potB = smoothstep(0.27, 0.5, dot(pot, vec3(0.3, 0.55, 0.15)));
  float lit = sbrPool(p) * mix(0.12, 1., potB);   // in a shaft of daylight paint is plainly paler and a little warm, outside it a step deeper; the dark sugar paper stays deep in or out of a shaft (the bare wall is the deepest tone in the box)
  c *= mix(vec3(mix(1., uPoolAmt.x, potB)), uPoolAmt.y * vec3(1., 1. - 0.5 * uPoolAmt.z, 1. - uPoolAmt.z), lit);   // (bare sugar paper is its own pot in or out of a shaft: only the sheets make it deeper)
  float dkp = 1. - dot(c, vec3(0.3, 0.55, 0.15)); c += mix(c * 2.6, vec3(1., 0.95, 0.8), 0.4) * (1.4 * uPoolAmt.z * dkp * dkp * lit);
  c = mix(c, c * (1. + uPoolTint.w) + uPoolTint.rgb * (0.07 * uPoolTint.w), sbrPoolP * (1. - potB));   // where one of the nine shafts lands on sugar paper the paper is a pale pool: its own hue, paler, leaning to the hour's light   // dark paper in the shaft is plainly paler, in its own hue; bright paint keeps its pot colour
  float so; float sp = sbrShadowSplit(p, so);
  sp = max(sp, sbrTurtleSh * smoothstep(0.45, 0.75, n.y));
  // under the manta every face is in its shadow (cup walls and risers too, so the five shapes hold together); a step's or the crab's shadow lies only on what faces the lid
  float sh = so * smoothstep(0.3, 0.7, n.y) * (1. - sp);
  // a step's, a tray's or the crab's shadow: pot colour times the shadow's violet, and nearly half of a stronger violet itself, so that it is violet on orange and card too
  // (never brown); on dark sugar paper it is the paper a step deeper. The manta's own shadow is ONE flat violet whatever it lies on: five pieces cut from sugar paper
  vec3 vio = uShadowCol * vec3(0.85, 0.75, 1.12);
  c = mix(c, mix(c * vec3(0.6, 0.58, 0.74), mix(c * uShadowCol * 1.25, vio, 0.45), potB), sh * 0.9);
  c = mix(c, mix(c * vec3(0.6, 0.58, 0.74), vio * (0.97 + 0.03 * smoothstep(-0.3, 0.25, n.y)), mix(0.6, 1., potB)), sp * 0.97);
  sh = max(sh, sp);
  float cr = mix(sbrCrinkleAt(p), sbrRainAt(p, n), uRain) * uCrinkleAmt * (0.45 + 0.55 * up) * (1. - 0.8 * sh) * (1. - sp) * (0.5 + 0.5 * dot(c, vec3(0.3, 0.5, 0.2)));
  // thrown light on dark sugar paper comes back in the paper's own hue (a brighter blue or green, never a grey); on paint it is the light's own colour
  c = mix(c, mix(min(c * 2.4 + 0.02, vec3(1.)), uCrinkleCol, smoothstep(0.22, 0.5, dot(c, vec3(0.3, 0.55, 0.15)))), cr);
  return sbrWaterB(c, sheets, potB);   // (what the film does to a thing goes by its pot: sugar paper is dark paper in or out of a shaft)
}
`;

// ---------------------------------------------------------------- PAINT: card, poster paint, cut edges, brass, tape, wool ----------------------------------------------------------------
// attributes: position, normal, color (pot colour, linear), aPaint = (brushU m, brushV m, edge m, kind)
//   kind 0 painted face: streaky along brushU, bare card where edge < ~0.25 m     kind 1 cut side: brown flutes, brushU = metres along the cut, brushV = 0..1 across the thickness
//   kind 2 bare stock (card, dowel wood): faint grain along brushU                 kind 3 brass: gleams toward the lid       kind 4 matte and even (tape, wool, sugar paper): fine fibre mottle only
const PAINT_VERT = /* glsl */`
attribute vec4 aPaint;
varying vec3 vWp, vWn, vCol; varying vec4 vPaint; varying float vSheets;
SBR_COMMON
SBR_HOOK_DECL
void main(){
  vec3 pos = position, nrm = normal; vec4 pnt = aPaint;
  SBR_HOOK
  vec4 wp = vec4(pos, 1.); vec3 wn = nrm;
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp; wn = mat3(instanceMatrix) * wn;
  #endif
  wp = modelMatrix * wp; wn = mat3(modelMatrix) * wn;
  vWp = wp.xyz; vWn = wn; vPaint = pnt;
  vCol = color;
  #ifdef USE_INSTANCING_COLOR
    vCol *= instanceColor;
  #endif
  vSheets = 0.;
  #ifdef SBR_VERT_WATER
    vSheets = sbrSheets(cameraPosition, wp.xyz);
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PAINT_FRAG = /* glsl */`
varying vec3 vWp, vWn, vCol; varying vec4 vPaint; varying float vSheets;
SBR_COMMON
SBR_FRAG
void main(){
  float l2 = dot(vWn, vWn);
  vec3 n = l2 > 1e-8 ? vWn * inversesqrt(l2) : vec3(0., 1., 0.);
  if (!gl_FrontFacing) n = -n;
  float kind = vPaint.w, bu = vPaint.x, bv = vPaint.y;
  vec3 pot = vCol;
  // derivatives first (nothing below sits in a loop, but keep them together)
  float fwV = fwidth(bv), fwU = fwidth(bu), fwE = fwidth(vPaint.z);
  float cut = 0.;
  // (how far across a round stem this fragment sits, 0 on its axis to 1 at its silhouette, and its derivative: taken here, outside any branch)
  vec3 ev = cameraPosition - vWp; ev = ev * inversesqrt(max(dot(ev, ev), 1e-6));
  float fx = abs(dot(n, ev)), xr = sqrt(max(1. - fx * fx, 0.)), fwX = fwidth(xr) + 1e-4;
  if (kind > 7.5) {                       // pipe cleaner: a chenille stem, bu = metres along it. Short bristles stand off both sides (the outer part of its width, cut out between
    float keepB = 1. - smoothstep(0.037, 0.055, fwU);
    // chenille: bristles of differing length, staggered from one side to the other, a few missing, slanting a little toward the tip (drawn while they are 3 px apart
    // or more, the flat tint when finer); the twisted wire a thin darker line down the middle
    float side = step(0., n.x + n.z), bq = (bu + side * 0.047 - xr * 0.05) / 0.094 + 0.35 * sbrNoise(vec2(bu * 5.3, side * 7.));
    float bi = floor(bq), bf = fract(bq), h1 = sbrHash(vec2(bi, 3. + side * 5.)), h2 = sbrHash(vec2(bi * 1.7 + 0.5, 11. + side * 3.));
    float reach = h2 < 0.16 ? 0.5 : 0.6 + 0.4 * h1, wid = 0.36 + 0.3 * h2;
    cut = step(0.52, xr) * max(step(wid, bf), step(reach, xr)) * step(0.5, keepB);
    pot *= mix(0.95, 0.88 + 0.14 * step(bf, wid), keepB);
    float lw = max(0.15, 1.5 * fwX), wire = (1. - smoothstep(lw, lw + fwX, xr)) * (0.72 + 0.28 * step(0.5, fract(bu * 4.5)));
    pot = mix(pot, pot * vec3(0.42, 0.4, 0.45), wire * (1. - smoothstep(0.22, 0.45, fwX)));
    kind = 4.;
  }
  #ifdef SBR_CUT
  if (kind > 6.5) {                       // card punched full of round holes (sea fans): a hex grid of holes 0.56 m across, none near the rim
    vec2 g = vec2(bu, bv) / 0.95; g.x += 0.5 * step(1., mod(floor(g.y), 2.));
    vec2 c = fract(g) - 0.5; float fwG = max(fwU, fwV) / 0.95;
    float keep = 1. - smoothstep(0.22, 0.4, fwG);                 // holes under about 3 px: the flat card, a little darker for the light they would let through
    float hole = (1. - smoothstep(0.30 - fwG, 0.30, length(c))) * smoothstep(0.5, 0.7, vPaint.z);
    cut = step(0.5, hole) * step(0.5, keep);
    pot *= mix(0.9, 1., keep);
    kind = 0.;
  }
  if (kind > 5.5) {                       // crepe paper: bu = metres along the streamer, bv = -1..1 across it, vPaint.z = half width in metres
    float fine = 1. - smoothstep(0.5, 1.5, fwU * 7.);            // the ruffle is drawn while a wave is wider than about 4 px
    float sgn = bv < 0. ? -1. : 1.;
    float ruf = sin(bu * 7.0 + sgn * 1.3 + 0.8 * sin(bu * 1.9)) * 0.6 + sin(bu * 15.5 + sgn * 4.1) * 0.4;
    float e = 1. - abs(bv);
    cut = step(e, (0.13 + 0.11 * ruf) * fine);                    // both edges cut in small waves
    float flute = smoothstep(0.35, 1., abs(bv)) * ruf * fine;     // the ruffle stands off the sheet: its waves catch and lose the lid
    float keepL = 1. - smoothstep(0.35, 1.1, fwU * 52.);          // crosswise crinkle, one line every 12 cm; the flat average once they fall under 3 px
    float cl = sin(bu * 52. + bv * 1.7 + 2.5 * sbrNoise(vec2(bu * 3.1, bv * 2.)));
    // and the coarse crinkle of the crepe itself, a darker line across the streamer every 0.8 m or so (wavering), which still reads when the fine one has gone to its average
    float cph = bu * 7.85 + bv * 0.9 + 2.2 * sbrNoise(vec2(bu * 0.9, bv * 1.3 + 4.));
    float keepC = 1. - smoothstep(0.5, 1.5, fwU * 7.85);
    float cw = clamp(fwU * 7.85 * 0.9, 0.0, 0.6);                 // never thinner than about a pixel and a half
    float cline = smoothstep(0.62 - cw, 0.96, sin(cph));
    pot *= (gl_FrontFacing ? 1.07 : 0.74) * (1. + 0.13 * flute) * (0.94 + 0.12 * cl * keepL) * (1. - 0.2 * cline * keepC);
    pot *= 0.96 + 0.08 * sbrNoise(vec2(bu * 0.6, bv * 1.5 + 9.));
  } else
  #endif
  if (kind < 0.5) {                       // poster paint, brushed flat and streaky along the stroke, stopping short of the rim
    float st = sbrNoise(vec2(bu * 0.33, bv * 4.6));
    float fine = sbrNoise(vec2(bu * 0.9 + 7., bv * 15.));
    float keep = 1. - smoothstep(0.25, 0.8, fwV * 15.);          // too fine to draw: fall back to the flat average
    pot *= 0.94 + 0.105 * mix(0.5, st, 1. - smoothstep(0.3, 1.0, fwV * 4.6)) + 0.03 * (fine - 0.5) * keep;
    pot = mix(pot, uCard, smoothstep(0.78, 0.97, fine) * 0.2 * keep);     // dry brush letting the card through
    float rim = 0.24 + 0.16 * (sbrNoise(vec2(bu * 0.7 + 3., bv * 0.7)) - 0.5);
    float aa = fwE * 0.8 + 0.004;
    pot = mix(uCard * (0.97 + 0.05 * st), pot, smoothstep(rim - aa, rim + aa, vPaint.z));
  } else if (kind < 1.5) {                // the cut edge: two liners and the flute between them
    float ph = bu * 11.4;                 // one flute every 0.55 m
    float fine = smoothstep(0.5, 1.6, fwU * 11.4);
    float wave = 0.5 + 0.27 * sin(ph);
    float aa = fwV * 1.2 + 0.01;
    float liner = 1. - smoothstep(0.17 - aa, 0.17 + aa, min(bv, 1. - bv));
    float flute = 1. - smoothstep(0.10 - aa, 0.10 + aa, abs(bv - wave));
    float tone = mix(0.56, 0.94, max(liner, flute * 0.92));
    pot = uCard * mix(tone, 0.78, fine);
  } else if (kind < 2.5) {                // bare stock
    float g = sbrNoise(vec2(bu * 0.5, bv * 9.));
    pot *= 0.95 + 0.08 * mix(0.5, g, 1. - smoothstep(0.3, 1.0, fwV * 9.));
  } else if (kind < 3.5) {                // brass fastener: a domed head that catches the lid
    vec3 v = cameraPosition - vWp; v = v * inversesqrt(max(dot(v, v), 1e-6));
    vec3 hv = v + vec3(0., 1., 0.); hv = hv * inversesqrt(max(dot(hv, hv), 1e-4));
    float g = max(dot(n, hv), 0.); g = g * g; g = g * g;
    pot = mix(pot * 0.8, vec3(1.0, 0.95, 0.72) * 1.5, smoothstep(0.35, 0.9, g));
  } else if (kind > 4.5) {                // wool: twisted fibres round the strand
    float tw = sin(bu * 9. + bv * 2.094) * 0.5 + 0.5;
    pot *= 0.9 + 0.13 * mix(0.5, tw, 1. - smoothstep(0.25, 0.9, fwU * 9. + fwV * 2.));
  } else {                                // tape, sugar paper
    float g = sbrNoise(vWp.xz * 2.3 + vWp.y * 1.7);
    pot *= 0.975 + 0.05 * mix(0.5, g, 1. - smoothstep(0.2, 0.8, fwU * 2.3 + fwV * 2.3));
  }
  float sheets = vSheets;
  #ifndef SBR_VERT_WATER
    sheets = sbrSheets(cameraPosition, vWp);
  #endif
  vec3 c = kind > 2.5 && kind < 3.5 ? sbrWater(pot, sheets) : sbrLight(pot, vWp, n, sheets);
  gl_FragColor = vec4(c, 1.);
  if (cut > 0.5) discard;
}`;
function fillGLSL(src, hookDecl = '', hook = '') {
  return src.replace('SBR_COMMON', STYLE_GLSL).replace('SBR_FRAG', STYLE_FRAG_GLSL).replace('SBR_FISHGLSL', FISH_GLSL).replace('SBR_HOOK_DECL', hookDecl).replace('SBR_HOOK', hook);
}

function lin(hex) { return new THREE.Color(hex); }           // display hex -> the linear value written to the screen under post.flat
// a seeded family's own stream, made from the world's seed and the family's name (in the set-piece viewer, which has no core, a fork by that name)
function sbrStream(ctx, name) { return ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)) : ctx.rng.fork(name); }

// crease texture for the thrown light: bright thin kinked lines on black, tiling
function crinkleTexture(rng) {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  // drawn in small steps (the strokes are the slow part): await bake(yieldFn) before build() returns
  const bake = async (yieldFn) => {
    const g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    await yieldFn();
    const N = 54, P = []; for (let i = 0; i < N; i++) P.push([rng() * S, rng() * S]);
    const wrap = (d) => d - S * Math.round(d / S), segs = [];
    for (let i = 0; i < N; i++) {
      const near = [];
      for (let j = 0; j < N; j++) if (j !== i) { const dx = wrap(P[j][0] - P[i][0]), dy = wrap(P[j][1] - P[i][1]); near.push([dx * dx + dy * dy, j, dx, dy]); }
      near.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < 3; k++) if (near[k][1] > i || k === 2) segs.push([P[i][0], P[i][1], near[k][2], near[k][3], 1.6 + rng() * 2.6, Math.floor(80 + rng() * 150), (rng() - 0.5) * 0.35]);
    }
    let n = 0;
    for (let pass = 0; pass < 2; pass++) for (const [x, y, dx, dy, w, b, bend] of segs) {
      if (++n % 6 === 0) await yieldFn();
      g.strokeStyle = pass ? `rgb(${b},${b},${b})` : `rgba(${b},${b},${b},0.28)`; g.lineWidth = pass ? w : w * 5;
      for (let ox = -S; ox <= S; ox += S) for (let oy = -S; oy <= S; oy += S) {
        if (x + ox + Math.min(dx, 0) > S + 20 || x + ox + Math.max(dx, 0) < -20 || y + oy + Math.min(dy, 0) > S + 20 || y + oy + Math.max(dy, 0) < -20) continue;
        g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + dx / 2 - dy * bend, y + oy + dy / 2 + dx * bend, x + ox + dx, y + oy + dy); g.stroke();
      }
    }
    tex.needsUpdate = true;
  };
  return { tex, bake };
}

// ---------------------------------------------------------------- LINE: thread, wire, pencil (ribbons that never thin below 1.5 px) ----------------------------------------------------------------
// attributes: position (this end), aOther (the other end), aLine = (side -1|+1, width in metres, 0), color. Alpha is true width / drawn width, so far threads thin out instead of shimmering.
const FISH_GLSL = /* glsl */`
attribute vec4 aFish;    // ring radius, angle on the tier, y of the hanger bar, thread length
attribute vec4 aFish2;   // tier index, seed 0..1, resting tilt (rad), size
uniform float uTierAng[5]; uniform float uTierDir[5]; uniform vec3 uTierTilt[5]; uniform float uBandAng, uGust;
// where a sardine hangs now: top and bottom of its thread, its heading, roll (how far it faces the lid) and nose pitch
void sbrFish(out vec3 top, out vec3 bot, out vec3 ypr, out float band){
  int ti = int(clamp(aFish2.x, 0., 4.) + 0.5);
  float seed = aFish2.y, ang = aFish.y + uTierAng[ti], dir = uTierDir[ti];
  top = vec3(cos(ang) * aFish.x, aFish.z, sin(ang) * aFish.x);
  top.y += dot(uTierTilt[ti].xy, top.xz);
  float d = ang - uBandAng + (aFish.x - 40.) * 0.007 + (aFish.z - aFish.w) * 0.005;
  d = atan(sin(d), cos(d));                                    // wrapped to -pi..pi (never atan(0,0): sin and cos are not both zero)
  band = max(1. - smoothstep(0.0, 1.15, abs(d)), uGust);
  vec2 sw = vec2(sin(uTime * (0.7 + 0.5 * seed) + seed * 40.), sin(uTime * (0.55 + 0.4 * seed) + seed * 71.));
  float amp = min(0.3 + aFish.w * 0.03, 1.5) + 0.8 * band;      // a longer thread swings wider
  bot = top + vec3(sw.x * amp, -aFish.w, sw.y * amp);
  float yaw = -ang - dir * 1.5708 + 0.5 * sin(uTime * 0.6 + seed * 30.) + 0.8 * band * sin(seed * 90.);
  float roll = aFish2.z + 0.16 * sin(uTime * 0.43 + seed * 17.) + band * (0.95 + 0.25 * seed);
  float pitch = (seed > 0.95 ? -0.38 : 0.06 * sin(uTime * 0.8 + seed * 55.)) + 0.12 * (seed - 0.5);
  ypr = vec3(yaw, pitch, roll);
}`;
const LINE_VERT = /* glsl */`
attribute vec3 aOther; attribute vec3 aLine;
uniform vec2 uRes, uDist; uniform float uMinA, uMaxA, uFade, uFarA, uPale; uniform vec3 uPaleCol;
varying vec3 vCol; varying float vA, vSheets;
SBR_COMMON
#ifdef SBR_FISH
SBR_FISHGLSL
#endif
void main(){
  vec3 a = position, b = aOther;
  #ifdef SBR_FISH
    vec3 top, bot, ypr; float band; sbrFish(top, bot, ypr, band);
    a = mix(bot, top, position.y); b = mix(top, bot, position.y);
  #endif
  vec4 wa = modelMatrix * vec4(a, 1.), wb = modelMatrix * vec4(b, 1.);
  vec4 ca = projectionMatrix * viewMatrix * wa, cb = projectionMatrix * viewMatrix * wb;
  // a long thread whose far end is behind the eye (its top, when we look up a little beside it) is cut off at the eye's plane first:
  // widened from a point behind the eye it would be drawn hundreds of pixels wide, a milky slab over the picture
  bool gone = false;
  if (ca.w < 0.35) { if (cb.w > 0.36) { float t = (0.35 - ca.w) / (cb.w - ca.w); ca = mix(ca, cb, t); wa = mix(wa, wb, t); } else gone = true; }
  else if (cb.w < 0.35) { float t = (0.35 - cb.w) / (ca.w - cb.w); cb = mix(cb, ca, t); }
  vec2 d = (cb.xy * ca.w - ca.xy * cb.w) * uRes;               // screen direction toward the other end, right even when it is behind the eye
  float dl = length(d); d = dl > 1e-9 ? d / dl : vec2(1., 0.);
  float px = aLine.y * projectionMatrix[1][1] * uRes.y * 0.5 / max(ca.w, 0.05);
  float w = max(px, 1.5);
  float ta = clamp(px / 1.5, 0., 1.);
  vA = max(mix(ta, min(ta * ta * 1.7, 1.), uFade), uMinA) * uMaxA;      // uFade 1 (cotton thread): clear near the eye, fainter with distance faster than its width alone
  vec3 ev = wa.xyz - cameraPosition;                                    // cotton beyond arm's length sinks to a faint tint of the water behind it (uDist: plain to x m, faint from y m; uFarA: what is left)
  vA *= mix(uFarA, 1., 1. - smoothstep(uDist.x, uDist.y, sqrt(dot(ev, ev))));
  float sheetsA = sbrSheets(cameraPosition, wa.xyz);
  vA *= exp2(-0.55 * sheetsA) * mix(1., 0.45 + 0.55 * sbrPool(wa.xyz), uFade);   // a line fades with each sheet it is seen through; cotton is bright only where a shaft of daylight crosses it
  vec2 off = vec2(-d.y, d.x) * aLine.x * w / uRes;
  gl_Position = gone ? vec4(2., 2., 2., 1.) : ca + vec4(off * ca.w, 0., 0.);
  // wire (uPale 1): a dark-edged silhouette where it is seen against the lid's daylight, pale where it is seen against the deep (it catches the lid)
  vec2 hl = cameraPosition.xz + ev.xz * ((uLidY - cameraPosition.y) / max(ev.y, 0.5));
  float onLid = step(0.5, ev.y) * (1. - smoothstep(uLid.z - 6., uLid.z, abs(hl.x - uLid.x))) * (1. - smoothstep(uLid.w - 6., uLid.w, abs(hl.y - uLid.y)));
  vCol = mix(color, uPaleCol, uPale * (1. - onLid)); vA *= mix(1., 0.45, uPale * (1. - onLid)); vSheets = sheetsA;
}`;
const LINE_FRAG = /* glsl */`
varying vec3 vCol; varying float vA, vSheets;
SBR_COMMON
void main(){ gl_FragColor = vec4(sbrWater(vCol, vSheets), vA); }`;

// ---------------------------------------------------------------- FOIL: kitchen-foil sardines, a mirror of the lid and nothing else ----------------------------------------------------------------
const FOIL_VERT = /* glsl */`
varying vec3 vWp, vWn; varying vec2 vUv; varying float vSheets, vSeed;
SBR_COMMON
SBR_FISHGLSL
void main(){
  vec3 top, bot, ypr; float band; sbrFish(top, bot, ypr, band);
  float s = aFish2.w;
  vec3 p = vec3(position.x, position.y - 0.2, 0.) * s, n = vec3(0., 0., 1.);
  float c = cos(ypr.y), sn = sin(ypr.y);                        // pitch about z (nose up or down)
  p = vec3(c * p.x - sn * p.y, sn * p.x + c * p.y, p.z);
  c = cos(ypr.z); sn = sin(ypr.z);                              // roll about the fish's length: turns its face up to the lid
  p = vec3(p.x, c * p.y - sn * p.z, sn * p.y + c * p.z); n = vec3(0., -sn, c);
  c = cos(ypr.x); sn = sin(ypr.x);                              // yaw on the thread
  p = vec3(c * p.x + sn * p.z, p.y, -sn * p.x + c * p.z); n = vec3(sn * n.z, n.y, c * n.z);
  vec4 wp = modelMatrix * vec4(bot + p, 1.);
  vWp = wp.xyz; vWn = mat3(modelMatrix) * n; vUv = position.xy; vSeed = aFish2.y;
  vSheets = sbrSheets(cameraPosition, wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FOIL_FRAG = /* glsl */`
uniform float uFoilGain;
varying vec3 vWp, vWn; varying vec2 vUv; varying float vSheets, vSeed;
SBR_COMMON
void main(){
  float l2 = dot(vWn, vWn);
  vec3 n = l2 > 1e-8 ? vWn * inversesqrt(l2) : vec3(0., 1., 0.);
  vec3 v = cameraPosition - vWp; v = v * inversesqrt(max(dot(v, v), 1e-6));
  vec3 nf = dot(n, v) < 0. ? -n : n;
  vec3 r = reflect(-v, nf);
  float white = smoothstep(0.24, 0.62, abs(n.y));               // faces the lid: white. Otherwise it mirrors cellophane: blue
  vec3 blue = mix(uDeep, uBlue, smoothstep(-0.7, 0.55, r.y)) * (0.86 + 0.28 * vSeed);
  float fw = fwidth(vUv.x);
  // "the foil from blue glints to white": seen through a hung sheet a fish shows the blue it mirrors and only a glint of the lid; it is white in our own bay of the box.
  // And a fish drawn under about ten pixels long is a glint too, never a white scratch
  white *= (1. - 0.82 * clamp(vSheets, 0., 1.)) * (1. - 0.6 * smoothstep(0.1, 0.24, fw));
  vec3 c = mix(blue, vec3(1.0, 0.99, 0.965) * uFoilGain, white);
  float eye = 1. - smoothstep(0.04, 0.041 + fw * 1.5, length(vUv - vec2(0.56, 0.035)));
  c = mix(c, uDeep * 0.6, eye * (1. - smoothstep(0.02, 0.05, fw)) * 0.85);
  gl_FragColor = vec4(sbrWater(c, vSheets), 1.);
}`;

// ---------------------------------------------------------------- CELLOPHANE: the hung sheets (the water is counted in the other shaders; this is only the sheet's own skin) ----------------------------------------------------------------
const CELLO_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vWp; varying float vSheets, vCatch;
SBR_COMMON
void main(){
  vUv = uv;
  float hang = 1. - uv.y;                                       // 0 at the top dowel: the ripple starts there and runs down
  float ph = uv.y * 11. + uTime * 1.15 + sin(uv.x * 7. + uTime * 0.31) * 1.3;
  float rip = sin(ph) * 0.6 * sqrt(max(hang, 0.)) + sin(uv.x * 19. - uTime * 0.7 + uv.y * 5.) * 0.18 * hang;
  vec4 wp = modelMatrix * vec4(position + normal * rip, 1.);
  vCatch = cos(ph);                                             // the slope of the ripple: creases catch the lid on one flank and lose it on the other
  vWp = wp.xyz;
  vec3 e = cameraPosition - wp.xyz; float el = max(length(e), 1e-3);
  vSheets = sbrSheets(cameraPosition, wp.xyz + e / el * min(2.5, el * 0.5));     // pulled toward the eye so a sheet never counts itself
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CELLO_FRAG = /* glsl */`
uniform vec2 uCelloSize; uniform float uCelloGain;
varying vec2 vUv; varying vec3 vWp; varying float vSheets, vCatch;
SBR_COMMON
void main(){
  vec2 m = vUv * uCelloSize;                                    // metres across and up the sheet
  float cr = texture2D(uCrinkle, m * 0.016 + vec2(0.13, 0.41)).r;
  float cr2 = texture2D(uCrinkle, m.yx * 0.041 + vec2(0.7, 0.2)).r;
  float lit = smoothstep(-0.2, 0.9, vCatch + (cr2 - 0.3) * 1.2);
  float crease = clamp(cr * 0.9 + cr2 * 0.45, 0., 1.) * lit;
  vec2 edge = min(m, uCelloSize - m);
  float hem = 1. - smoothstep(0.25, 0.25 + fwidth(edge.x) + fwidth(edge.y) + 0.02, min(edge.x, edge.y));     // the cut border reads as a brighter line
  vec3 c = mix(uBlue * 1.05, vec3(0.86, 0.96, 1.0) * uCelloGain, clamp(crease + hem * 0.5, 0., 1.));
  float a = 0.07 + 0.46 * crease + 0.3 * hem;
  gl_FragColor = vec4(sbrWater(c, vSheets), clamp(a, 0., 0.9));
}`;

// ---------------------------------------------------------------- the style object: shared uniforms + material factories ----------------------------------------------------------------
export function createStyle(ctx, palette = SBR_PALETTE) {
  const crinkle = crinkleTexture(sbrStream(ctx, 'sbr-crinkle'));
  const P = palette && palette.length >= 7 ? palette : SBR_PALETTE;
  const pal = { card: lin(P[0]), pink: lin(P[1]), orange: lin(P[2]), yellow: lin(P[3]), blue: lin(P[4]), deep: lin(P[5]), white: lin(P[6]) };
  for (const k in SBR_EXTRA) pal[k] = lin(SBR_EXTRA[k]);
  const v4s = (n) => Array.from({ length: n }, () => new THREE.Vector4(0, 0, 1, 0));
  const U = {
    uTime: { value: 0 }, uSheetA: { value: v4s(SBR_MAX_SHEETS) }, uSheetB: { value: Array.from({ length: SBR_MAX_SHEETS }, () => new THREE.Vector2()) }, uSheetN: { value: 0 },
    uShA: { value: v4s(SBR_MAX_SHADOWS) }, uShB: { value: v4s(SBR_MAX_SHADOWS) },
    uCard: { value: pal.card }, uBlue: { value: pal.blue }, uDeep: { value: pal.deep }, uShadowCol: { value: pal.shadow }, uCrinkleCol: { value: new THREE.Color(0.80, 0.93, 1.0) },
    uLid: { value: new THREE.Vector4(0, 0, 210, 120) }, uLidY: { value: 190 }, uCrinkleAmt: { value: 0.36 }, uWaterStep: { value: 0.72 }, uRain: { value: 0 },
    uSlant: { value: new THREE.Vector2(0.21, 0) }, uCrinkle: { value: crinkle.tex }, uPool: { value: v4s(11).map((v) => v.set(0, 0, 0, 0)) }, uPoolTint: { value: new THREE.Vector4(1, 1, 1, 0) }, uPoolAmt: { value: new THREE.Vector3(1, 1, 0) }, uDeepK: { value: new THREE.Vector3(0.33, 0.37, 0.49) }, uHinge: { value: new THREE.Vector4(0.6, 0.85, 0.55, 26) }, uSpot: { value: new THREE.Vector3(0, 0, 0) }, uVeil: { value: new THREE.Vector3(0.25, 1.0, 1.0) }, uShAnchor: { value: new THREE.Vector4(0, 0, 45, 0) }, uShShift: { value: 0 }, uTurtle: { value: new THREE.Vector4(0.5, 1, 22, 1) },
    uRes: { value: new THREE.Vector2(1280, 720) }, uMinA: { value: 0.3 }, uMaxA: { value: 1 }, uFade: { value: 0 }, uPale: { value: 0 }, uPaleCol: { value: new THREE.Color('#7E8B99') }, uDist: { value: new THREE.Vector2(1e5, 2e5) }, uFarA: { value: 1 },
    uTierAng: { value: [0, 0, 0, 0, 0] }, uTierDir: { value: [1, -1, 1, -1, 1] }, uTierTilt: { value: Array.from({ length: 5 }, () => new THREE.Vector3()) }, uBandAng: { value: 0 }, uGust: { value: 0 }, uFoilGain: { value: 1.6 },
  };
  for (const v of U.uShB.value) v.set(1, 0, -1e4, 0);
  const share = (extra) => Object.assign({}, U, extra || {});
  const style = {
    pal, uniforms: U, baked: false,
    // draws the crease texture in small steps; buildHero() awaits it. A world that never builds the hero must: await style.bake(() => ctx.yield())
    async bake(yieldFn) { if (style.baked) return; style.baked = true; await crinkle.bake(yieldFn); },
    // o.cut: the variant that can cut holes (kind 6 crepe paper with ruffled edges, kind 7 card punched with round holes); the hook may also edit `pnt` (the aPaint passed on)
    // paint for anything cut from card: o.side, o.vertWater (count sheets per vertex: small things), o.hook / o.hookDecl (GLSL that may move `pos` and `nrm` in object space), o.uniforms
    paintMaterial(o = {}) {
      return new THREE.ShaderMaterial({ uniforms: share(o.uniforms), vertexColors: true, side: o.side ?? THREE.FrontSide,
        defines: Object.assign(o.vertWater ? { SBR_VERT_WATER: 1 } : {}, o.cut ? { SBR_CUT: 1 } : {}), vertexShader: fillGLSL(PAINT_VERT, o.hookDecl || '', o.hook || ''), fragmentShader: fillGLSL(PAINT_FRAG) });
    },
    // thread, wire, pencil: geometry from ribbonGeometry(); o.fish = instanced sardine threads (geometry from the hero)
    lineMaterial(o = {}) {
      return new THREE.ShaderMaterial({ uniforms: share(o.uniforms), vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        defines: o.fish ? { SBR_FISH: 1 } : {}, vertexShader: fillGLSL(LINE_VERT), fragmentShader: fillGLSL(LINE_FRAG) });
    },
    foilMaterial() {
      return new THREE.ShaderMaterial({ uniforms: share(), side: THREE.DoubleSide, vertexShader: fillGLSL(FOIL_VERT), fragmentShader: fillGLSL(FOIL_FRAG) });
    },
    // one hung sheet of cellophane as a mesh for a sheet descriptor (below): a 40 by 24 grid rippling from its top edge, blended, no depth write
    celloMaterial(w, h) {
      return new THREE.ShaderMaterial({ uniforms: share({ uCelloSize: { value: new THREE.Vector2(w, h) }, uCelloGain: { value: 1.5 } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: fillGLSL(CELLO_VERT), fragmentShader: fillGLSL(CELLO_FRAG) });
    },
    celloSheet(sh) {
      const w = sh.hi - sh.lo, h = sh.y1 - sh.y0, m = new THREE.Mesh(style.celloGeo || (style.celloGeo = new THREE.PlaneGeometry(1, 1, 40, 24)), style.celloMaterial(w, h));
      m.scale.set(w, h, 1); m.renderOrder = 5;
      if (sh.axis === 'x') { m.rotation.y = Math.PI / 2; m.position.set(sh.at, (sh.y0 + sh.y1) / 2, (sh.lo + sh.hi) / 2); } else m.position.set((sh.lo + sh.hi) / 2, (sh.y0 + sh.y1) / 2, sh.at);
      return m;
    },
    // sheets: [{ axis: 'z' | 'x', at, lo, hi, y0, y1 }] in world space ('z': a sheet across the course in the plane z = at, spanning x lo..hi)
    setSheets(list) {
      const n = Math.min(list.length, SBR_MAX_SHEETS);
      for (let i = 0; i < n; i++) { const s = list[i]; U.uSheetA.value[i].set(s.at, s.lo, s.hi, s.axis === 'x' ? 1 : 0); U.uSheetB.value[i].set(s.y0, s.y1); }
      U.uSheetN.value = n;
    },
    // lid shadow i (0..16): an ellipse under a caster at height y; the hero owns 0..4 (the manta's panels), the world has 5..16
    setShadow(i, x, z, halfLen, halfWid, angle, y, strength = 1) {
      U.uShA.value[i].set(x, z, halfLen, halfWid); U.uShB.value[i].set(Math.cos(angle), Math.sin(angle), y, strength);
    },
    setLid(cx, cz, width, depth, y) { U.uLid.value.set(cx, cz, width / 2, depth / 2); U.uLidY.value = y; },
    // once a frame (the hero's update() calls it): the clock and the drawing-buffer size that ribbons are widened against
    tick(time) { U.uTime.value = time; if (ctx.renderer) ctx.renderer.getDrawingBufferSize(U.uRes.value); },
  };
  return style;
}

// ---------------------------------------------------------------- geometry helpers (exported: the whole world is cut with these) ----------------------------------------------------------------
// growing buffers for the PAINT attribute layout
export function paintBuffers() {
  return { pos: [], nrm: [], col: [], pnt: [], idx: [],
    v(x, y, z, nx, ny, nz, c, bu, bv, edge, kind) { this.pos.push(x, y, z); this.nrm.push(nx, ny, nz); this.col.push(c.r, c.g, c.b); this.pnt.push(bu, bv, edge, kind); return this.pos.length / 3 - 1; },
    tri(a, b, c) { this.idx.push(a, b, c); },
    quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.setAttribute('aPaint', new THREE.Float32BufferAttribute(this.pnt, 4));
      g.setIndex(this.idx); return g;
    } };
}
// inset a closed outline (CCW seen from +Y, [x,z] pairs) by d metres toward its inside
function insetOutline(pts, d) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    let e1x = b[0] - a[0], e1z = b[1] - a[1], e2x = c[0] - b[0], e2z = c[1] - b[1];
    const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1; e1x /= l1; e1z /= l1; e2x /= l2; e2z /= l2;
    // inward normal of an edge (dx,dz) for a CCW-from-above outline in x,z: (dz,-dx) points right of travel; choose by signed area at the caller
    let nx = e1z + e2z, nz = -(e1x + e2x); const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const cosHalf = Math.max(0.35, nx * e1z - nz * e1x);
    out.push([b[0] + nx * d / cosHalf, b[1] + nz * d / cosHalf]);
  }
  return out;
}
function triFacing(B, a, b, c, nx, ny, nz) {      // add a triangle wound so that it faces (nx,ny,nz)
  const p = B.pos, ax = p[a * 3], ay = p[a * 3 + 1], az = p[a * 3 + 2];
  const ux = p[b * 3] - ax, uy = p[b * 3 + 1] - ay, uz = p[b * 3 + 2] - az, vx = p[c * 3] - ax, vy = p[c * 3 + 1] - ay, vz = p[c * 3 + 2] - az;
  const d = (uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz;
  if (d >= 0) B.tri(a, b, c); else B.tri(a, c, b);
}
// A flat cut from corrugated card, lying in the x,z plane with its thickness in y: painted faces that stop short of the rim, brown fluted cut edge.
// outline: [[x,z],...] closed, either winding. o: { thick 0.3, y 0 (mid-plane), top, bottom (THREE.Color pots), topKind 0, bottomKind 0, rim 0.55 (width of the inset ring; bare card shows in
// about its outer half), brush / brushBottom (radians: stroke direction in x,z), buf (append to these paintBuffers), ox, oz (offsets added to the brush coordinates so pieces differ) }
export function cardGeometry(outline, o = {}) {
  const B = o.buf || paintBuffers(), n = outline.length, th = o.thick ?? 0.3, y0 = o.y ?? 0, rim = o.rim ?? 0.55;
  let area = 0; for (let i = 0; i < n; i++) { const a = outline[i], b = outline[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const inner = insetOutline(outline, area > 0 ? -rim : rim);
  const tris = THREE.ShapeUtils.triangulateShape(inner.map((p) => new THREE.Vector2(p[0], p[1])), []);
  const face = (y, ny, col, kind, ang) => {
    const ca = Math.cos(ang), sa = Math.sin(ang), ox = o.ox ?? 0, oz = o.oz ?? 0;
    const vtx = (p, e) => B.v(p[0], y, p[1], 0, ny, 0, col, (p[0] + ox) * ca + (p[1] + oz) * sa, -(p[0] + ox) * sa + (p[1] + oz) * ca, e, kind);
    const o0 = B.pos.length / 3; for (let i = 0; i < n; i++) vtx(outline[i], 0);
    const i0 = B.pos.length / 3; for (let i = 0; i < n; i++) vtx(inner[i], rim);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; triFacing(B, o0 + i, o0 + j, i0 + j, 0, ny, 0); triFacing(B, o0 + i, i0 + j, i0 + i, 0, ny, 0); }
    for (const t of tris) triFacing(B, i0 + t[0], i0 + t[1], i0 + t[2], 0, ny, 0);
  };
  face(y0 + th / 2, 1, o.top, o.topKind ?? 0, o.brush ?? 0);
  face(y0 - th / 2, -1, o.bottom || o.top, o.bottomKind ?? 0, o.brushBottom ?? o.brush ?? 0);
  let arc = o.ox ?? 0; const sgn = area > 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const a = outline[i], b = outline[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1e-6;
    const nx = sgn * dz / l, nz = -sgn * dx / l, c = o.top;
    const v0 = B.v(a[0], y0 - th / 2, a[1], nx, 0, nz, c, arc, 0, 0, 1), v1 = B.v(b[0], y0 - th / 2, b[1], nx, 0, nz, c, arc + l, 0, 0, 1);
    const v2 = B.v(b[0], y0 + th / 2, b[1], nx, 0, nz, c, arc + l, 1, 0, 1), v3 = B.v(a[0], y0 + th / 2, a[1], nx, 0, nz, c, arc, 1, 0, 1);
    triFacing(B, v0, v1, v2, nx, 0, nz); triFacing(B, v0, v2, v3, nx, 0, nz); arc += l;
  }
  return o.buf ? B : B.build();
}
// ribbons for the LINE material. add(a, b, width, color) one straight piece; path(points, width, color) a polyline; build() -> BufferGeometry
export function ribbonBuffers() {
  return { pos: [], oth: [], lin: [], col: [], idx: [],
    add(a, b, w, c) {
      const i = this.pos.length / 3;
      this.pos.push(a[0], a[1], a[2], a[0], a[1], a[2], b[0], b[1], b[2], b[0], b[1], b[2]);
      this.oth.push(b[0], b[1], b[2], b[0], b[1], b[2], a[0], a[1], a[2], a[0], a[1], a[2]);
      this.lin.push(-1, w, 0, 1, w, 0, -1, w, 0, 1, w, 0);
      for (let k = 0; k < 4; k++) this.col.push(c.r, c.g, c.b);
      this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    },
    path(pts, w, c) { for (let i = 0; i + 1 < pts.length; i++) this.add(pts[i], pts[i + 1], w, c); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('aOther', new THREE.Float32BufferAttribute(this.oth, 3));
      g.setAttribute('aLine', new THREE.Float32BufferAttribute(this.lin, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
      g.setIndex(this.idx); return g;
    } };
}
// a brass paper fastener: a low domed head on the side `sy` (+1 top, -1 underside) of a card at height y, and its two splayed legs on the other side
export function addFastener(B, x, y, z, r, sy, brass, legAngle = 0) {
  const RINGS = 3, SEG = 10, base = B.pos.length / 3, h = r * 0.42, yb = y + sy * 0.16;
  for (let k = 0; k <= RINGS; k++) {
    const t = k / RINGS, rr = r * Math.cos(t * Math.PI / 2), yy = yb + sy * h * Math.sin(t * Math.PI / 2), ny = Math.sin(t * Math.PI / 2) * 0.8 + 0.2, nr = Math.cos(t * Math.PI / 2);
    for (let s = 0; s < SEG; s++) { const a = (s / SEG) * Math.PI * 2; B.v(x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr, Math.cos(a) * nr, sy * ny, Math.sin(a) * nr, brass, 0, 0, 1, 3); }
  }
  for (let k = 0; k < RINGS; k++) for (let s = 0; s < SEG; s++) {
    const a = base + k * SEG + s, b = base + k * SEG + (s + 1) % SEG, c = a + SEG, d = b + SEG;
    triFacing(B, a, b, d, 0, sy, 0); triFacing(B, a, d, c, 0, sy, 0);
  }
  const ca = Math.cos(legAngle), sa = Math.sin(legAngle), yl = y - sy * 0.17, L = r * 2.1, W = r * 0.36;
  for (const s of [-1, 1]) {
    const q = [[0.1 * s, -W], [L * s, -W * 0.7], [L * s, W * 0.7], [0.1 * s, W]].map(([u, v]) => B.v(x + u * ca - v * sa, yl, z + u * sa + v * ca, 0, -sy, 0, brass, 0, 0, 1, 3));
    triFacing(B, q[0], q[1], q[2], 0, -sy, 0); triFacing(B, q[0], q[2], q[3], 0, -sy, 0);
  }
}

// ---------------------------------------------------------------- the manta: one grey box lid, five flats, eight brass fasteners ----------------------------------------------------------------
const HINGE1 = 5.5, HINGE2 = 12.5;       // the two fastener lines of each wing (metres from the centre line)
function mantaOutlines(rng) {
  const j = (p, a = 0.14) => [p[0] + (rng() - 0.5) * a, p[1] + (rng() - 0.5) * a];
  const side = (s) => {
    const m = (pts) => pts.map((p) => j([p[0] * s, p[1]]));
    const lead = m([[9, 6.3], [16, 2.4], [19, 0.2], [20.2, -1.4], [19.6, -2.25], [17, -2.6], [9, -5.4]]);
    const hf = j([HINGE1 * s, 7.6], 0.1), ha = j([HINGE1 * s, -7.0], 0.1), mf = j([HINGE2 * s, 4.6], 0.1), ma = j([HINGE2 * s, -4.0], 0.1);
    const inner = [hf, lead[0], mf, [mf[0] + 0.9 * s, mf[1] - 0.9], [ma[0] + 0.9 * s, ma[1] + 0.7], ma, lead[6], ha].map((p) => [p[0] - HINGE1 * s, p[1]]);
    const outer = [[mf[0] - 0.95 * s, mf[1] + 0.2], mf, lead[1], lead[2], lead[3], lead[4], lead[5], ma, [ma[0] - 0.95 * s, ma[1] - 0.1]].map((p) => [p[0] - HINGE2 * s, p[1]]);
    const head = m([[1.25, 9.0], [1.9, 11.7], [2.95, 11.45], [3.45, 8.5]]);
    const tail = m([[3.1, -8.5], [1.3, -10.2], [0.55, -11.6]]);
    return { inner, outer, head, tail, tabF: [(HINGE1 + 0.95) * s, hf[1] - 0.45], tabA: [(HINGE1 + 0.95) * s, ha[1] + 0.35], hf, ha };
  };
  const R = side(1), L = side(-1);
  const body = [[0, 8.55], ...R.head, R.hf, R.tabF, R.tabA, R.ha, ...R.tail, ...L.tail.slice().reverse(), L.ha, L.tabA, L.tabF, L.hf, ...L.head.slice().reverse()];
  return { body, R, L };
}
function disc(B, x, y, z, r, ny, col, kind, seg = 12) {
  const c = B.v(x, y, z, 0, ny, 0, col, x, z, 1, kind), i0 = B.pos.length / 3;
  for (let s = 0; s < seg; s++) { const a = (s / seg) * Math.PI * 2; B.v(x + Math.cos(a) * r, y, z + Math.sin(a) * r * 0.86, 0, ny, 0, col, x, z, 1, kind); }
  for (let s = 0; s < seg; s++) triFacing(B, c, i0 + s, i0 + (s + 1) % seg, 0, ny, 0);
}
function strip(B, pts, w, y, ny, col, kind) {       // a flat band of width w along pts ([x,z]) lying on a face (tape, the painted mouth)
  let prev = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    const px = -dz / l * w / 2, pz = dx / l * w / 2, p = pts[i];
    const cur = [B.v(p[0] - px, y, p[1] - pz, 0, ny, 0, col, i, 0, 1, kind), B.v(p[0] + px, y, p[1] + pz, 0, ny, 0, col, i, 1, 1, kind)];
    if (prev) { triFacing(B, prev[0], prev[1], cur[1], 0, ny, 0); triFacing(B, prev[0], cur[1], cur[0], 0, ny, 0); }
    prev = cur;
  }
}
function buildManta(style, rng) {
  const pal = style.pal, mat = style.paintMaterial(), O = mantaOutlines(rng), TH = 0.3;
  const group = new THREE.Group();
  const grey = pal.grey, white = pal.white;
  // body
  const B = paintBuffers();
  cardGeometry(O.body, { buf: B, thick: TH, rim: 0.4, top: grey, bottom: white, brush: Math.PI / 2 + rng.range(-0.08, 0.08), brushBottom: Math.PI / 2 + rng.range(-0.1, 0.1), ox: rng() * 40, oz: rng() * 40 });
  for (const s of [-1, 1]) {
    const S = s > 0 ? O.R : O.L;
    addFastener(B, HINGE1 * s + 0.1 * s, -TH, S.hf[1] - 1.5, 0.5, -1, pal.brass, rng() * 3);     // heads on the belly, legs on the back, through body and wing
    addFastener(B, HINGE1 * s + 0.1 * s, -TH, S.ha[1] + 1.5, 0.5, -1, pal.brass, rng() * 3);
    disc(B, 3.75 * s, TH / 2 + 0.02, 8.0, 0.4, 1, pal.black, 4); disc(B, 3.95 * s, -TH / 2 - 0.02, 7.9, 0.46, -1, pal.black, 4);   // painted eyes
  }
  strip(B, [[-1.9, 7.55], [-1.0, 7.2], [0, 7.08], [1.0, 7.2], [1.9, 7.55]], 0.46, -TH / 2 - 0.02, -1, pal.black, 4);   // the mouth, one black brush stroke on the belly
  const tapes = [[0, 5.2], [0, -5.6]];
  for (const t of tapes) strip(B, [[t[0] - 0.9, t[1] - 0.2 + rng() * 0.4], [t[0] + 0.9, t[1] - 0.2 + rng() * 0.4]], 1.2, TH / 2 + 0.03, 1, pal.tape, 4);
  strip(B, [[-0.7, -10.6], [0.75, -10.4]], 1.2, TH / 2 + 0.03, 1, pal.tape, 4); strip(B, [[-0.7, -10.5], [0.75, -10.7]], 1.2, -TH / 2 - 0.03, -1, pal.tape, 4);   // the wool is taped on
  const body = new THREE.Mesh(B.build(), mat); group.add(body);
  // wings: inner pivots on the body's fastener line, outer pivots on the inner's
  const piv = {}, threads = [{ obj: group, p: new THREE.Vector3(0, TH / 2, 5.2) }, { obj: group, p: new THREE.Vector3(0, TH / 2, -5.6) }];
  for (const s of [-1, 1]) {
    const S = s > 0 ? O.R : O.L, key = s > 0 ? 'R' : 'L';
    const pin = new THREE.Group(); pin.position.set(HINGE1 * s, -TH - 0.02, 0); group.add(pin);
    const Bi = paintBuffers();
    cardGeometry(S.inner, { buf: Bi, thick: TH, rim: 0.4, top: grey, bottom: white, brush: rng.range(-0.12, 0.12), brushBottom: rng.range(-0.15, 0.15), ox: rng() * 40, oz: rng() * 40 });
    const hx = (HINGE2 - HINGE1) * s, zf = S.inner[2][1], za = S.inner[5][1];
    addFastener(Bi, hx + 0.15 * s, 0.02, zf - 1.3, 0.5, -1, pal.brass, rng() * 3); addFastener(Bi, hx + 0.15 * s, 0.02, za + 1.3, 0.5, -1, pal.brass, rng() * 3);
    strip(Bi, [[4.6 * s - 0.9, 0.6 + rng() * 0.3], [4.6 * s + 0.9, 0.4 + rng() * 0.3]], 1.2, TH / 2 + 0.03, 1, pal.tape, 4);
    pin.add(new THREE.Mesh(Bi.build(), mat));
    const pout = new THREE.Group(); pout.position.set(hx, TH + 0.02, 0); pin.add(pout);
    pout.add(new THREE.Mesh(cardGeometry(S.outer, { thick: TH, rim: 0.4, top: grey, bottom: white, brush: rng.range(-0.3, 0.1) * s, brushBottom: rng.range(-0.35, 0.1) * s, ox: rng() * 40, oz: rng() * 40 }), mat));
    piv[key] = { inner: pin, outer: pout, s };
    threads.push({ obj: pin, p: new THREE.Vector3(4.6 * s, TH / 2, 0.6) });
  }
  // pencil: five gill lines a side on the belly, the centre guide line and the two hinge guide lines the paint missed
  const Rb = ribbonBuffers(), yb = -TH / 2 - 0.035, pc = pal.pencil;
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const cx = s * (2.75 - 0.13 * i + rng.range(-0.05, 0.05)), cz = 5.3 - 1.12 * i + rng.range(-0.07, 0.07), len = 1.0 - 0.07 * i, pts = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5 - 0.5; pts.push([cx + s * t * 2 * len, yb, cz - 0.55 * t - 1.1 * t * t + 0.25]); }
    Rb.path(pts, 0.085, pc);
  }
  Rb.path([[0.12, yb, 6.6], [0.02, yb, 0.5], [-0.1, yb, -9.6]], 0.06, pc);
  for (const s of [-1, 1]) Rb.path([[(HINGE1 - 0.55) * s, yb, 6.9], [(HINGE1 - 0.5) * s, yb, -6.4]], 0.06, pc);
  const pencil = new THREE.Mesh(Rb.build(), style.lineMaterial()); pencil.renderOrder = 2; group.add(pencil);
  return { group, piv, threads, tail: new THREE.Vector3(0, 0, -10.9) };
}

// a round stick or tube between two points (dowels, the cotton reel, card tubes); brushU runs along it
export function addCylinder(B, p0, p1, r, seg, col, kind, caps = true, r1 = r) {
  const ax = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), len = ax.length() || 1e-6; ax.divideScalar(len);
  const u = new THREE.Vector3(0, 1, 0); if (Math.abs(ax.y) > 0.9) u.set(1, 0, 0);
  const s = new THREE.Vector3().crossVectors(ax, u).normalize(), t = new THREE.Vector3().crossVectors(ax, s);
  const base = B.pos.length / 3;
  for (let e = 0; e < 2; e++) for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, nx = Math.cos(a) * s.x + Math.sin(a) * t.x, ny = Math.cos(a) * s.y + Math.sin(a) * t.y, nz = Math.cos(a) * s.z + Math.sin(a) * t.z;
    const p = e ? p1 : p0, rr = e ? r1 : r;
    B.v(p[0] + nx * rr, p[1] + ny * rr, p[2] + nz * rr, nx, ny, nz, col, e * len, (i / seg) * r * 6.28, 1, kind);
  }
  for (let i = 0; i < seg; i++) { const a = base + i, b = a + 1, c = a + seg + 1, d = c + 1; B.tri(a, c, b); B.tri(b, c, d); }
  if (caps) for (let e = 0; e < 2; e++) {
    const p = e ? p1 : p0, sg = e ? 1 : -1, rr = e ? r1 : r, c = B.v(p[0], p[1], p[2], ax.x * sg, ax.y * sg, ax.z * sg, col, 0, 0, 1, kind), i0 = B.pos.length / 3;
    for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; B.v(p[0] + (Math.cos(a) * s.x + Math.sin(a) * t.x) * rr, p[1] + (Math.cos(a) * s.y + Math.sin(a) * t.y) * rr, p[2] + (Math.cos(a) * s.z + Math.sin(a) * t.z) * rr, ax.x * sg, ax.y * sg, ax.z * sg, col, Math.cos(a) * rr, Math.sin(a) * rr, 1, kind); }
    for (let i = 0; i < seg; i++) triFacing(B, c, i0 + i, i0 + (i + 1) % seg, ax.x * sg, ax.y * sg, ax.z * sg);
  }
}
// the tail: three strands of wool plaited, 30 m, taped to the body; it snakes in the vertex shader (WOOL_HOOK), brushU = metres from the root
const WOOL_HOOK_DECL = 'uniform float uTailAmp;';
const WOOL_HOOK = /* glsl */`
  { float t = aPaint.x; float k = t * uTailAmp;
    pos.x += sin(uTime * 0.9 - t * 0.31) * k * 0.085 + sin(uTime * 0.37 + t * 0.11) * k * 0.05;
    pos.y += -t * t * 0.0035 + sin(uTime * 1.25 - t * 0.42) * k * 0.028; }`;
function buildTail(style, rng, root, detail) {
  const B = paintBuffers(), pal = style.pal, LEN = 28, N = Math.round(100 * detail), SEG = 6;
  const cols = rng.shuffle([pal.white, pal.grey, rng.pick([pal.pink, pal.pink, pal.orange, pal.yellow])]);
  for (let k = 0; k < 3; k++) {
    const base = B.pos.length / 3, ph = (k / 3) * Math.PI * 2;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * LEN, fr = Math.max(0, (t - 25.4) / 2.6), f = t * 2.1;            // the last 3 m is the frayed tassel: strands part
      const amp = 0.2 + fr * 0.8, cx = root.x + Math.sin(f + ph) * amp + fr * Math.sin(ph * 2.3 + 1) * 0.5, cy = root.y + Math.sin(2 * f + 2 * ph) * 0.1 * (1 + fr * 2), cz = root.z - t;
      const r = 0.145 * (1 - 0.35 * fr) * (i === 0 ? 0.6 : 1);
      for (let s = 0; s < SEG; s++) { const a = (s / SEG) * Math.PI * 2 + i * 0.5; B.v(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz, Math.cos(a), Math.sin(a), 0, cols[k], t, s, 1, 5); }
    }
    for (let i = 0; i < N; i++) for (let s = 0; s < SEG; s++) {
      const a = base + i * SEG + s, b = base + i * SEG + (s + 1) % SEG, c = a + SEG, d = b + SEG; B.tri(a, b, c); B.tri(b, d, c);
    }
  }
  const uTailAmp = { value: 1 };
  const mesh = new THREE.Mesh(B.build(), style.paintMaterial({ hook: WOOL_HOOK, hookDecl: WOOL_HOOK_DECL, uniforms: { uTailAmp }, side: THREE.DoubleSide, vertWater: true }));
  mesh.frustumCulled = false;
  return { mesh, uTailAmp };
}
// a wire coat-hanger drawn into ribbon buffers R: hang point p (the top of its hook), bar direction yaw, bar width W. Returns the two ends and the middle of its bar.
function addHanger(R, p, yaw, W, wire, wCol, rng) {
  const cx = Math.cos(yaw), sx = Math.sin(yaw), s = W / 10, H = W * 0.21 + s * 1.1;
  const at = (u, v) => [p[0] + cx * u, p[1] + v, p[2] + sx * u];
  const k = 1 + (rng() - 0.5) * 0.25;                       // bent by hand: the shoulders never match
  const pts = [at(-0.12 * s, -1.5 * s), at(-W / 2, -H * k), at(-W / 2 - 0.25 * s, -H * k - 0.3 * s), at(-W / 2 + 0.3 * s, -H - 0.55 * s), at(W / 2 - 0.3 * s, -H - 0.55 * s),
    at(W / 2 + 0.25 * s, -H / k - 0.3 * s), at(W / 2, -H / k), at(0.12 * s, -1.5 * s), at(-0.1 * s, -1.25 * s), at(0.08 * s, -1.05 * s), at(0, -0.85 * s)];
  for (let i = 0; i <= 7; i++) { const a = -Math.PI / 2 + (i / 7) * Math.PI * 1.72, r = 0.42 * s; pts.push(at(Math.cos(a) * r, -0.43 * s + Math.sin(a) * r)); }
  R.path(pts, wire, wCol);
  const yb = -H - 0.55 * s;
  return { l: at(-W / 2 + 0.3 * s, yb), r: at(W / 2 - 0.3 * s, yb), m: at(0, yb), y: p[1] + yb, cx, sx };
}

// ---------------------------------------------------------------- the mobile: five tiers of wire coat-hangers, two thousand foil sardines ----------------------------------------------------------------
// r: ring radius, hub: the wire ring the arms start from, tipY: height of the arm tips, bands: [y lo, y hi, share] where the fish hang.
// The orbit is at r 36, y 66-74. Tier 1 hangs right over it (r 31-43, y 80-90) so foil streams overhead and ahead of the camera all the way round;
// tiers 2-4 (r 44-70) hang at y 83 and above ONLY: the approach (y 58-66) and the run out (y 74) pass under every fish, and no thread of the shoal hangs through
// the height the ride flies at anywhere outside the turn. The inner tier hangs under the belly inside r 22, below the turn.
export const SBR_TIER_DEFS = [
  { r: 17.0, hubR: 2.0, hubY: 74, tipY: 67, arms: 5, yokeW: 8.5, subW: 6.6, count: 260, bands: [[47, 59, 1]], speed: 0.115 },
  { r: 37.0, hubR: 9.5, hubY: 154, tipY: 112, arms: 11, yokeW: 13, subW: 10.5, count: 800, bands: [[79.5, 90, 1]], speed: 0.085, eye: { r: 43.6, tipY: 110, arms: 9, yokeW: 14, band: [78, 81], every: 5 } },
  { r: 50.0, hubR: 9.5, hubY: 160, tipY: 141, arms: 10, yokeW: 15, subW: 12, count: 240, bands: [[83, 102, 1]], speed: 0.075 },
  { r: 57.5, hubR: 9.5, hubY: 166, tipY: 148, arms: 12, yokeW: 15, subW: 12.5, count: 350, bands: [[86, 122, 1]], speed: 0.07, eye: { arms: 0, band: [78, 81], every: 4 } },
  { r: 65.5, hubR: 9.5, hubY: 172, tipY: 155, arms: 13, yokeW: 15.5, subW: 12.5, count: 350, bands: [[94, 130, 1]], speed: 0.064, eye: { arms: 0, band: [78, 81], every: 4 } },
];
function sardineGeometry() {
  const o = [[0.81, 0.0], [0.56, 0.125], [0.2, 0.2], [0.02, 0.2], [-0.1, 0.3], [-0.24, 0.17], [-0.6, 0.05], [-0.82, 0.21], [-0.71, 0.0], [-0.82, -0.2], [-0.6, -0.05], [-0.3, -0.135], [0.15, -0.19], [0.56, -0.13]];
  const tris = THREE.ShapeUtils.triangulateShape(o.map((p) => new THREE.Vector2(p[0], p[1])), []);
  const g = new THREE.InstancedBufferGeometry(), pos = [];
  for (const p of o) pos.push(p[0], p[1], 0);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(tris.flat());
  return g;
}
async function buildMobile(pause, style, rng, spin, eyeRng, overSight) {
  const pal = style.pal, tiers = [], fish = [], fish2 = [], lineMat = style.lineMaterial({ uniforms: { uMinA: { value: 0.3 }, uMaxA: { value: 1 } } });   // wire: dark and firm wherever it is seen (a dark-edged silhouette against the lid, like the dowels), thinning with distance
  const wc = pal.wire, tc = pal.white;
  for (let k = 0; k < SBR_TIERS; k++) {
    const T = SBR_TIER_DEFS[k], R = ribbonBuffers(), subs = [], a0 = rng() * 6.283, wireW = k ? 0.17 : 0.1;
    const ring = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; ring.push([Math.cos(a) * T.hubR, T.hubY + Math.sin(a * 3 + k) * 0.12, Math.sin(a) * T.hubR]); }
    R.path(ring, wireW * 1.3, wc);
    for (let a = 0; a < T.arms; a++) {
      const th = a0 + ((a + rng.range(-0.12, 0.12)) / T.arms) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), arm = [];
      const tipR = T.r + rng.range(-1.2, 1.2), tipY = T.tipY + rng.range(-1.5, 1.5), sag = rng.range(0.8, 2.2);
      for (let i = 0; i <= 5; i++) { const t = i / 5, rr = T.hubR + (tipR - T.hubR) * t, y = T.hubY + (tipY - T.hubY) * t - Math.sin(t * Math.PI) * sag; arm.push([c * rr, y, s * rr]); }
      arm.push([c * (tipR + 0.5), tipY + 0.55, s * (tipR + 0.5)], [c * (tipR + 0.1), tipY + 0.9, s * (tipR + 0.1)]);        // the end bent up into a hook
      R.path(arm, wireW + 0.03, wc);
      const yaw = th + Math.PI / 2 + rng.range(-0.28, 0.28);
      const yoke = addHanger(R, [c * tipR, tipY + 0.1, s * tipR], yaw, T.yokeW * rng.range(0.86, 1.1), wireW, wc, rng);
      for (const e of [yoke.l, yoke.r]) subs.push(addHanger(R, [e[0], e[1] + 0.05, e[2]], yaw + rng.range(-1.0, 1.0), T.subW * rng.range(0.8, 1.15), wireW * 0.9, wc, rng));
      if (k === 0) continue;                 // under the belly the mobile stays light: two hangers an arm
      const drop = rng.range(2.2, 4.6); R.add(yoke.m, [yoke.m[0], yoke.m[1] - drop, yoke.m[2]], 0.05, tc);
      subs.push(addHanger(R, [yoke.m[0], yoke.m[1] - drop, yoke.m[2]], yaw + Math.PI / 2 + rng.range(-0.5, 0.5), T.subW * rng.range(0.75, 1.0), wireW * 0.9, wc, rng));
    }
    // THE LOW FILE (tiers 1, 3 and 4: the three rings the straight passes under, at r 43.6, 57.5 and 65.5). "The outer rings with us on the right": every `every`-th
    // fish of the tier hangs in a low band three metres deep, from the band's foot (y 78: 2.5 m and a fish's length over the height the ride flies at) or from the top
    // of the hole's sight at its own radius, whichever is higher. That top comes from the world (opts.overSight(radius), worked out there from the course itself), so
    // for the first sixty metres of the straight we pass close under sardines on their threads and none of them hangs over the hole from the turn's last arc or from
    // the straight. The low file has a stream of its own: its arms, its places along the hangers and its heights. Tier 1 carries its file on a ring of longer arms,
    // each ending in one hanger whose bar lies along the ring, 7.5 m outside the turn; tiers 3 and 4 hang theirs from the hangers they have.
    // THE BELLY, all round the turn whatever the tiers' turning: nothing of the mobile hangs between the turn (r 36, y 66 to 74) and the manta's belly. The inner tier
    // is under 59 m, tier 1's fish are above 78 m at r 31 or more, and every wire arm starts at 154 m or higher over the hub.
    const eyes = [];
    if (T.eye && eyeRng && T.eye.arms) {                      // (only a low file that has arms of its own draws their turn: tiers 3 and 4 hang theirs from the hangers they have)
      const E = T.eye, e0 = eyeRng() * 6.283;
      for (let a = 0; a < E.arms; a++) {
        const th = e0 + ((a + eyeRng.range(-0.1, 0.1)) / E.arms) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), arm = [], tipY = E.tipY + eyeRng.range(-0.8, 0.8), sag = eyeRng.range(0.8, 1.8);
        for (let i = 0; i <= 5; i++) { const t = i / 5, rr = T.hubR + (E.r - T.hubR) * t; arm.push([c * rr, T.hubY + (tipY - T.hubY) * t - Math.sin(t * Math.PI) * sag, s * rr]); }
        arm.push([c * (E.r + 0.5), tipY + 0.55, s * (E.r + 0.5)], [c * (E.r + 0.1), tipY + 0.9, s * (E.r + 0.1)]);
        R.path(arm, wireW + 0.03, wc);
        eyes.push(addHanger(R, [c * E.r, tipY + 0.1, s * E.r], th + Math.PI / 2 + eyeRng.range(-0.06, 0.06), E.yokeW * eyeRng.range(0.92, 1.08), wireW, wc, eyeRng));
      }
    }
    for (let i = 0; i < T.count; i++) {
      const low = !!(T.eye && eyeRng) && i % T.eye.every === 0, rs = low ? eyeRng : rng;      // (a fish of the low file is dealt from the low file's stream, the others from the shoal's)
      const S = low && eyes.length ? eyes[((i / T.eye.every) | 0) % eyes.length] : subs[i % subs.length], u = 0.5 + rs.range(-0.5, 0.5), x = S.l[0] + (S.r[0] - S.l[0]) * u, z = S.l[2] + (S.r[2] - S.l[2]) * u;
      const b = T.bands[0], yR = rs(), y0 = low ? Math.max(T.eye.band[0], overSight ? overSight(Math.hypot(x, z)) + 1 : 0) : 0, yF = low ? y0 + (T.eye.band[1] - T.eye.band[0]) * yR : b[0] + (b[1] - b[0]) * yR, seed = rs();
      fish.push(Math.hypot(x, z), Math.atan2(z, x), S.y, Math.max(2, S.y - yF));
      fish2.push(k, seed, rs.range(-0.13, 0.13), rs.range(0.86, 1.18));
    }
    const mesh = new THREE.Mesh(R.build(), lineMat); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.position.y = -T.hubY;
    const nod = new THREE.Group(); nod.position.y = T.hubY; nod.add(mesh);
    tiers.push({ mesh, nod, ph: rng() * 6.283, amp: (k ? 0.008 : 0.02) * rng.range(0.8, 1.2), dir: (k % 2 ? 1 : -1) * spin, speed: T.speed * rng.range(0.92, 1.08) });
    await pause('tier' + k);
  }
  const n = fish.length / 4, aF = new THREE.InstancedBufferAttribute(new Float32Array(fish), 4), aF2 = new THREE.InstancedBufferAttribute(new Float32Array(fish2), 4);
  const fg = sardineGeometry(); fg.setAttribute('aFish', aF); fg.setAttribute('aFish2', aF2); fg.instanceCount = n;
  const shoal = new THREE.Mesh(fg, style.foilMaterial()); shoal.frustumCulled = false;
  const tg = new THREE.InstancedBufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0], 3));
  tg.setAttribute('aLine', new THREE.Float32BufferAttribute([-1, 0.024, 0, 1, 0.024, 0, -1, 0.024, 0, 1, 0.024, 0], 3));
  tg.setAttribute('aOther', new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  const w = pal.white; tg.setAttribute('color', new THREE.Float32BufferAttribute([w.r, w.g, w.b, w.r, w.g, w.b, w.r, w.g, w.b, w.r, w.g, w.b], 3));
  tg.setIndex([0, 1, 2, 0, 2, 3]); tg.setAttribute('aFish', aF); tg.setAttribute('aFish2', aF2); tg.instanceCount = n;
  const threads = new THREE.Mesh(tg, style.lineMaterial({ fish: true, uniforms: { uMinA: { value: 0.02 }, uMaxA: { value: 0.5 }, uFade: { value: 1 }, uDist: { value: new THREE.Vector2(11, 26) }, uFarA: { value: 0.07 } } })); threads.frustumCulled = false; threads.renderOrder = 4;
  return { tiers, shoal, threads, count: n, wire: lineMat };
}

// ---------------------------------------------------------------- the hero ----------------------------------------------------------------
const MANTA_Y = 82.3, CROSS_Y = 184, LID_Y = 190, BEAT = 7, UP = new THREE.Vector3(0, 1, 0);
export async function buildHero(ctx, opts = {}) {
  const rng = sbrStream(ctx, 'sbr-manta');                         // the manta, its tail and its rig; the shoal and its low file have streams of their own
  const style = opts.style || createStyle(ctx, opts.palette || SBR_PALETTE), pal = style.pal;
  const bandPhase = opts.bandPhase ?? 0, beatPhase = opts.beatPhase ?? 0;
  const spin = opts.spin === -1 ? -1 : 1, stage = opts.stage !== false, detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const q = typeof opts.view === 'string' ? opts.view : null;      // set-piece viewer only: sbr=in | sheets
  const object = new THREE.Group(); object.name = 'shoebox-reef-hero';
    const pause = async () => { await ctx.yield(); };
  await pause('style');
  await style.bake(() => pause('bake'));
  await pause('baked');
  // the manta and its tail
  const manta = buildManta(style, rng); manta.group.position.y = MANTA_Y; object.add(manta.group);
  await pause('manta');
  await pause('tail');
  const tail = buildTail(style, rng, manta.tail, detail); manta.group.add(tail.mesh);
  await pause('rig');
  // the cross of dowels it hangs from, the tape that lashes it, and the still threads of the rig
  const B = paintBuffers(), skew = rng.range(-0.14, 0.14), cs = Math.cos(skew), sn = Math.sin(skew), DL = 13.2;
  addCylinder(B, [-DL, CROSS_Y, 0], [DL + rng.range(-0.8, 0.8), CROSS_Y, 0], 0.42, 10, pal.dowel, 2);
  addCylinder(B, [-sn * DL, CROSS_Y + 0.84, -cs * DL], [sn * DL, CROSS_Y + 0.84, cs * (DL + rng.range(-0.8, 0.8))], 0.42, 10, pal.dowel, 2);
  addCylinder(B, [-0.75, CROSS_Y, 0.02], [0.75, CROSS_Y, -0.02], 0.5, 10, pal.tape, 4, false);
  addCylinder(B, [0.03, CROSS_Y + 0.84, -0.7], [-0.03, CROSS_Y + 0.84, 0.7], 0.5, 10, pal.tape, 4, false);
  const S = ribbonBuffers(), hang = [[9.5, CROSS_Y, 0], [-9.5, CROSS_Y, 0], [sn * 9.5, CROSS_Y + 0.84, cs * 9.5], [-sn * 9.5, CROSS_Y + 0.84, -cs * 9.5]];
  for (const h of hang) {
    S.add(h, [h[0], SBR_TIER_DEFS[1].hubY, h[2]], 0.05, pal.white);
    const ax = Math.abs(h[0]) > 5 ? [0.6, 0, 0] : [0, 0, 0.6];
    addCylinder(B, [h[0] - ax[0], h[1], h[2] - ax[2]], [h[0] + ax[0], h[1], h[2] + ax[2]], 0.47, 8, pal.tape, 4, false);
  }
  for (const x of [-5.5, 6.2]) S.add([x, CROSS_Y + 0.4, 0], [x + rng.range(-0.3, 0.3), LID_Y, 0], 0.06, pal.white);
  S.add([0, MANTA_Y - 0.2, 0], [0, SBR_TIER_DEFS[0].hubY, 0], 0.05, pal.white);
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; S.add([0, SBR_TIER_DEFS[0].hubY + 2.6, 0], [Math.cos(a) * 2, SBR_TIER_DEFS[0].hubY, Math.sin(a) * 2], 0.05, pal.white); }
  const paintMat = style.paintMaterial(), lineMat = style.lineMaterial();
  const rig = new THREE.Mesh(B.build(), paintMat); object.add(rig);
  const rigLines = new THREE.Mesh(S.build(), lineMat); rigLines.renderOrder = 3; rigLines.frustumCulled = false; object.add(rigLines);
  // the four threads the manta hangs and beats on: bottoms follow the panels every frame
  const tops = [[0.25, CROSS_Y + 0.84, 4.3], [-0.2, CROSS_Y + 0.84, -4.7], [-7.4, CROSS_Y, 0.3], [7.4, CROSS_Y, 0.3]];
  const Mt = ribbonBuffers(); Mt.add([0, 0, 0], [0, 1, 0], 0.07, pal.white);
  const mtGeo = Mt.build(), mantaThreads = tops.map((t) => { const m = new THREE.Mesh(mtGeo, lineMat); m.position.set(t[0], t[1], t[2]); m.frustumCulled = false; m.renderOrder = 3; object.add(m); return m; });
  await pause('shoal');
  const mobile = await buildMobile(pause, style, sbrStream(ctx, 'sbr-shoal'), spin, sbrStream(ctx, 'sbr-low'), typeof opts.overSight === 'function' ? opts.overSight : null);
  for (const t of mobile.tiers) object.add(t.nod);
  object.add(mobile.shoal, mobile.threads);
  await pause('x1');
  // viewer stand-in for the world's floor (sugar paper), so the lid shadow and the crinkle light can be judged; the world passes stage: false
  if (stage) {
    const F = paintBuffers(); disc(F, 0, 0, 0, 125, 1, pal.deep, 4, 48);
    const floor = new THREE.Mesh(F.build(), paintMat); floor.scale.z = 1 / 0.86; object.add(floor);
  }
  if (q && q.includes('steps')) {
    const demo = [{ axis: 'x', at: 8, lo: -110, hi: 110, y0: 0, y1: 118 }, { axis: 'z', at: -6, lo: -110, hi: 2, y0: 0, y1: 190 }, { axis: 'z', at: 30, lo: -60, hi: 110, y0: 40, y1: 190 }];
    style.setSheets(demo); for (const d of demo) object.add(style.celloSheet(d));
  }
  if (q && q.includes('sheets')) style.setSheets([{ axis: 'z', at: -34, lo: -150, hi: 21, y0: 0, y1: 190 }, { axis: 'z', at: -34, lo: 39, hi: 150, y0: 0, y1: 190 },
    { axis: 'z', at: 32, lo: -150, hi: 19, y0: 0, y1: 190 }, { axis: 'z', at: 50, lo: -150, hi: 20, y0: 0, y1: 190 }, { axis: 'x', at: -75, lo: -110, hi: 95, y0: 0, y1: 190 }]);
  // anchors, hero-local (origin on the floor under the manta, +Z = the course)
  const flyThrough = [[36, 66, -70], [36, 66, -34]];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 * spin; flyThrough.push([36 * Math.cos(a), 66 + 8 * (i / 12), 36 * Math.sin(a) * spin * spin]); }
  flyThrough.push([36, 74, 40], [36, 74, 95]);
  const anchors = {
    axis: new THREE.Vector3(0, 0, 0), mantaCentre: new THREE.Vector3(0, MANTA_Y, 0), bellyY: 82, crossY: CROSS_Y, lidY: LID_Y,
    orbit: { radius: 36, yStart: 66, yEnd: 74, innerClear: 22.5, outerClear: 44, fishFreeY: [60, 79] },
    flyThrough: flyThrough.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    portalSeat: { position: new THREE.Vector3(36, 74, 95), facing: new THREE.Vector3(0, 0, -1), radius: 7 },
    viewpoints: {
      entry: { position: new THREE.Vector3(4, 58, -140), target: new THREE.Vector3(0, 80, 0) },
      belly: { position: new THREE.Vector3(0, 67, 36), target: new THREE.Vector3(0, MANTA_Y, 0) },
      image: { position: new THREE.Vector3(19, 73.6, -30.5), target: new THREE.Vector3(6, 77, 50) },
    },
    wireArm: { pivot: new THREE.Vector3(0, 152, 0), reach: 36 },
    shadowSlots: [0, 1, 2, 3, 4],
  };
  // ---- motion ----
  let gust = 0, gustTurn = 0, lastT = null, poseYaw = 0, poseLx = 0, poseLz = 0;
  const qPose = new THREE.Quaternion(), qYaw = new THREE.Quaternion(), leanAxis = new THREE.Vector3();
  const inv = new THREE.Matrix4(), va = new THREE.Vector3(), vb = new THREE.Vector3();
  const U = style.uniforms;
  const toLocal = (obj, v) => v.applyMatrix4(obj.matrixWorld).applyMatrix4(inv);
  const vh = new THREE.Vector3();
  const shadow = (i, obj, cx, cz, alongX, hl, hw) => {
    va.set(cx, 0, cz).applyMatrix4(obj.matrixWorld); vb.set(cx + (alongX ? 1 : 0), 0, cz + (alongX ? 0 : 1)).applyMatrix4(obj.matrixWorld).sub(va);
    const h = Math.hypot(vb.x, vb.z), L = hl * Math.max(h * Math.sqrt(h), 0.06);
    if (alongX && h > 1e-4) { const sg = cx < 0 ? -1 : 1; vh.set(cx - sg * hl, 0, cz).applyMatrix4(obj.matrixWorld); va.x = vh.x + (sg * vb.x / h) * L; va.z = vh.z + (sg * vb.z / h) * L; }
    style.setShadow(i, va.x, va.z, L, hw, h > 1e-4 ? Math.atan2(vb.z, vb.x) : 0, va.y, 1);
  };
  function update(dt, time) {
    style.tick(time);
    const step = lastT === null ? 0 : Math.min(Math.max(time - lastT, 0), 0.1); lastT = time;
    gustTurn += step * gust * 2.5;
    const ph = (time / BEAT) * Math.PI * 2 + beatPhase, p2 = ph + 0.3 * Math.sin(ph);
    const a1 = 0.5 * Math.sin(p2) + 0.03, a2 = 1.0 * Math.sin(p2 - 0.7);        // each panel dead flat, turning only at its fasteners; the tips sweep 20 m
    for (const k of ['L', 'R']) { const P = manta.piv[k]; P.inner.rotation.z = P.s * a1; P.outer.rotation.z = P.s * (a2 - a1); }
    const g = manta.group;
    g.position.y = MANTA_Y - 0.9 * Math.sin(p2 + 0.2); g.position.x = 0.5 * Math.sin(time * 0.29); g.position.z = 0.6 * Math.sin(time * 0.21 + 1);
    g.rotation.set(0.035 * Math.sin(p2 + 1.2), 0.05 * Math.sin(time * 0.23), 0.02 * Math.sin(time * 0.31 + 1));
    // the pose the world asks for: turned on its threads (yaw) and leaning (the belly tipped toward a horizontal direction lx, lz; its length is the angle)
    const la = Math.hypot(poseLx, poseLz);
    qPose.identity(); if (la > 1e-5) qPose.setFromAxisAngle(leanAxis.set(-poseLz / la, 0, poseLx / la), la);
    g.quaternion.premultiply(qPose.multiply(qYaw.setFromAxisAngle(UP, poseYaw)));
    for (let k = 0; k < SBR_TIERS; k++) {
      const T = mobile.tiers[k], ang = T.dir * T.speed * (time + gustTurn);
      U.uTierAng.value[k] = ang; U.uTierDir.value[k] = T.dir; T.mesh.rotation.y = -ang;
      const tx = T.amp * Math.sin(time * (0.47 + 0.05 * k) + T.ph) * (1 + 2 * gust), tz = T.amp * Math.sin(time * (0.39 + 0.04 * k) + T.ph * 1.7) * (1 + 2 * gust);
      T.nod.rotation.z = tx; T.nod.rotation.x = -tz; U.uTierTilt.value[k].set(tx, tz, 0);
    }
    U.uBandAng.value = spin * (time * (Math.PI * 2 / 8) + bandPhase); U.uGust.value = gust; tail.uTailAmp.value = 1 + gust * 1.5;
    object.updateMatrixWorld(true); inv.copy(object.matrixWorld).invert();
    for (let i = 0; i < 4; i++) {                    // each thread is one unit ribbon stretched from its fixed top to the panel below
      const th = manta.threads[i], m = mantaThreads[i]; va.copy(th.p); toLocal(th.obj, va).sub(m.position);
      const len = Math.max(va.length(), 1e-3); m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(UP, va.divideScalar(len));
    }
    shadow(0, g, 0, -1, false, 10.4, 5.45);
    shadow(1, manta.piv.R.inner, 3.5, 0.3, true, 3.5, 7.3); shadow(2, manta.piv.R.outer, 3.75, 0.3, true, 3.75, 3.6);
    shadow(3, manta.piv.L.inner, -3.5, 0.3, true, 3.5, 7.3); shadow(4, manta.piv.L.outer, -3.75, 0.3, true, 3.75, 3.6);
  }
  update(0, 0);
  let radius = 72, height = LID_Y, center = new THREE.Vector3(0, MANTA_Y, 0);
  if (q && q.includes('in')) { radius = 14; height = -40; center = new THREE.Vector3(0, 74, 0); }           // viewer: orbit at the journey's 36-45 m, from below
  else if (q && q.includes('low')) { radius = 42; height = -70; center = new THREE.Vector3(0, 82, 0); }
  return { object, radius, height, center, anchors, style, update, dispose() {}, ground: false, groundY: 0,
    setGust(v) { gust = Math.min(Math.max(v, 0), 1); },
    setPose(yaw, lx, lz) { poseYaw = yaw; poseLx = lx; poseLz = lz; }, tierCount: SBR_TIERS, sardines: mobile.count };
}
