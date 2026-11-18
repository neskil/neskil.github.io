// SET PIECE for "ten-past-ten": THE DIAL AND ITS HANDS, and the one dial that goes.
//
// This file holds three things.
//
// 1. THE CONSTANT  TEN_PAST_TEN = { minuteDeg: 60, hourDeg: 305 }  (degrees clockwise from twelve, as a dial is read).
//    It is written once, below. The small dials' shader, the great dial's starting pose and the dial of light all
//    read it. No hand angle is derived from the seed, the look, the quality setting, the clock or the camera.
//    No dial has a second hand.
//
// 2. THE DIAL KIT  makeDialKit(ctx, opts)  for the small dials. One face law in three weights, each a unit dial
//    (radius 1 to the bezel's outer edge, face radius 0.88) in its own xy plane, facing +z, twelve at +y, three at +x:
//      near    bezel ring with a moulded section, the face disc, two hands as real blades 0.035 off the face with a
//              pierced eye, a hub disc under their roots (166 triangles with its glass; the domed glass is a second, transparent geometry + material)
//      middle  a bevelled ring bezel standing on the face disc; the hands lie flat in the face and are drawn by its shader (48 triangles)
//      far     ONE disc of 16 triangles; face, hands and bezel are drawn by the shader
//    The face: twelve wedge strokes that narrow toward the centre, the four quarters heavier, a thin minute track, two
//    blade hands with a pierced round eye two thirds of the way out, a small hub. Nothing else is on a face.
//    The enamel's highlight is that of a slight dome (the normal leans outward 0.22 for each dial radius from the
//    hub); under a pixel wider than 0.35 of a dial radius it is the dome's own mean over the face, exact with the
//    half vector on the dial's axis and off the axis A FIT (a power of the angle's cosine) within 0.0041 of the
//    highlight's peak for the sun's highlight and 0.0020 for the sky's, counted by half degrees from 0 to 40.
//    Instance attributes the world must fill (InstancedBufferAttribute on the InstancedMesh's geometry clone):
//      aKind  float  0 white enamel, 1 ivory enamel, 2 clear glass against sky, 3 marble with brass hands (floor dial)
//    Scale an instance by its radius; the instance matrix carries place, facing and size.
//    The floor dial: instance the far disc lying flat, scale 50, aKind 3 (its twelve then points along the instance's
//    +y), or call the exported GLSL  tptFace(p, fw, kind)  from the floor's own shader with p = (place - centre) / 50
//    and fw = the pixel's footprint / 50.
//
// 3. THE GREAT DIAL  buildHero(ctx, opts): the shed's east gable. Radius 38. Origin at the base centre, +Y up, the dial's
//    centre at (0, 38, 0), the glass in the plane z = 0, the read side toward +Z (three o'clock is +X as it is read).
//    From the rim inward: an iron ring 2.4 wide with flanges, splice plates and bolts (the bolts square nuts of
//    fourteen triangles each: the ring is the dial's farthest iron from the flown line); a chapter ring of opal glass
//    5.5 wide (brightest along its middle, with a thin shade along both edges from its iron frame) carrying twelve
//    iron wedge strokes (the quarters 5 long and heavier); an iron minute ring; clear glass in a thin web of 24 radial
//    bars and three rings, each 0.30 wide: a bar is a channel with a flange along each edge, a ring is moulded and
//    riveted, and where a bar meets a ring a plate 0.68 square is bolted over the joint; the hub's boss ring (inner
//    radius 6.6, outer 9.5, 2.6 proud of the glass; dark iron, well under the web's tone, its bore darker with
//    depth, a bolt groove 0.45 deep round its face) with a clear bore; and the two hands on collars round the boss
//    (the minute hand's collar, which is the one seen, carries twenty-four radial gussets 1.4 long with a bolt
//    between each pair; the hour hand's lies behind it, between the same two radii, and is left bare)
//    (hour 1.3 and minute 2.4 in front of the glass: with its flanges, rivets and bolts the hour hand lies from 0.96
//    to 2.02 before the glass and the minute hand from 2.06 to 3.12, so the one passes behind the other at every
//    angle with 0.04 between them): iron plate girders painted vermilion, bold enough to be told
//    down the shed's whole length, each with flanged edges (they stop at the eye's bore, which is open air), rivet
//    lines, a raised rib down its middle, the pierced eye two thirds of the way out, a bold tip beyond a waist and a short counterpoise tail that stays outside radius 9.5.
//    The minute hand reaches radius 33.5: 3.4 wide at its root, 2.2 at radius 14.5, 1.6 at its waist, 3.2 across the
//    shoulders of its tip, its eye 5 across, five round piercings in its root. The hour hand reaches 23 and is the
//    broader: 5.2 at its root, 3.0 at its waist, 4.4 across its shoulders, its eye 6 across, its plate whole, and it
//    is painted a deeper shade of the same vermilion (0.62 of it). With both hands at twelve its blade shows either
//    side of the minute hand from its root out to radius 20.58, just past the shoulders of its tip: by 0.9 at the
//    root, 1.0 at radius 14.5, 0.5 at its waist and 1.2 at its shoulders; from 20.58 to its point at 23 it is no wider
//    than the minute hand's eye, which stands before it.
//
//    WHAT THE HANDS DO. They are moved by the metres flown and by nothing else. setMetres(s) is the only thing that
//    turns them; update() never does; there is no timer. With a 205, b 235, c 385, d 420 (metres of route): the speed
//    of turning is 0 up to a, rises on a straight ramp from a to b, is even from b to c, falls on a straight ramp from
//    c to d and is 0 after. E(s) is the integral of that trapezoid divided by its whole area,
//    (b-a)/2 + (c-b) + (d-c)/2 = 15 + 150 + 17.5 = 182.5, so E is 0 up to 205 m and 1 from 420 m. The minute hand
//    stands at 60 + 660 E degrees and the hour hand at 305 + 55 E degrees: at 0 m they stand at ten past ten, at 420 m
//    both stand straight up at twelve (720 and 360 degrees), and there they stay. A visitor who stopped would see the
//    hands stop.
//
//    THE DIAL OF LIGHT. DIAL_LIGHT_GLSL declares  float tptDialLight(vec3 worldPos, float footprint)  and its uniforms
//    (hero.lightUniforms, one shared object; merge it BY REFERENCE into any material: uniforms: { ...mine,
//    ...hero.lightUniforms }, and put DIAL_LIGHT_GLSL into the fragment shader before main). It carries the point's ray
//    toward the sun to the dial's plane and returns the share of sunlight that passes: 0.92 through clear glass, 0 behind
//    the iron ring, the strokes, the minute ring, the web, the boss (taken through its depth as it is built, from
//    0.9 behind the glass to its chamfered mouth 2.6 before it) and the two hands with their collars at their
//    present angles (each read where the ray meets its hand's own plane, 1.3 and 2.4 before the glass; a place
//    nearer the glass than a hand's plane is not shaded by that hand), one half behind the opal ring, uTptBore
//    through the bore (for a ray that clears the bore from its back to its mouth), uTptGable outside the dial's
//    circle.
//    It is filtered by the footprint given (metres on the lit surface) plus the sun's own width at that distance.
//    setMetres keeps uTptHands current. update() refreshes uTptC, uTptN and uTptR from the object's world matrix, so a
//    world that places the object once has them right from its first update().
//
//    THE BACK. The dial is built to be read from +Z only. Its ironwork has front faces, bevels and edge walls and no
//    back faces. The flown line ends in the bore 2 m before the glass, so the back is seen from nowhere on the route,
//    and it is left unbuilt.
//
// opts (all optional)
//   palette   the brief's eight hex strings [enamel white, black iron, green iron, brass, sky blue, vermilion, ivory, steel blue]
//   look      'sun' (default) | 'cloud' | 'rain'. rain: water runs down the glass in threads (0.12 wide) and sheets by
//             the time given to update(), the opal ring is a cooler silver. cloud: nothing differs but uSun.
//   iron      'green' (default) | 'prussian' | 'graphite': the ironwork's paint (IRON_PAINT, exported, so that a
//             world paints its own iron the same). The hands are vermilion always.
//   sunDir    direction to the sun in WORLD space, [x, y, z]. Default: the brief's sun as it stands to a dial facing
//             west, carried with the object, so a dial turned to face west gets exactly 0.7002, 0.7071, 0.0984.
//   demo      true adds a pale test floor that shows the dial of light and a board of small dials (viewer and tests only).
// The returned object also has: setMetres(s), setSun(x) (0..1: sets uSun, the sun term of the dial's own materials),
// handAngles(s) -> { minuteDeg, hourDeg, E }, lightUniforms, uniforms (uSkyCol, uGroundCol, uSunCol, uSun, uOpalCol,
// uOpalGlow, uRain of its own materials, free to set), syncLight() and info { triangles, drawCalls }.
//
// anchors (hero-local)
//   dialCenter  (0, 38, 0)         portalSeat  { position (0, 38, 2), normal (0, 0, 1), radius 6 }: the portal, 2 in
//   front of the glass inside the bore (bore radius 6.6; the boss's mouth is at z 2.6).
//   flyThrough  points on the dial's axis from 140 in front to the portal seat: nothing is within 6.6 of that line.
//   viewpoints  a few places on the read side looking at dialCenter.
//   lightCenter where the dial of light's centre falls for the default sun on a floor 44 below the dial's centre
//               (hero-local: -6.12, -6, 43.57); lightCenterAt(drop) gives it for another floor.
//   handPlanes  { hourZ: 1.3, minuteZ: 2.4 },  bossMouthZ 2.6,  collarOuter 11.3,  rim 38.
//
// Size: radius 38, height 76. Lighting it expects: it carries its own shading (ShaderMaterials with a hemisphere
// term, a sun term from behind and scene fog); it adds no light. Seen from the read side against a bright sky the
// iron stays dark and coloured, the hub's boss darker still, the opal ring glows (uOpalGlow, 1.3 unless a world sets it) and the hands are lit by
// a strong sky term and take the scene's haze at half (uHaze 0.5), so that they read vermilion from far off.
// Cost: 29,062 triangles in 5 draw calls (fixed iron 21,432, opal ring 240, panes 192, hour hand 2,451, minute hand
// 4,747) at full detail;
// about 100 ms to build. hero.info holds the counted figures.

import * as THREE from 'three';

// ------------------------------------------------------------------------------------------------------------------
// THE CONSTANT. Written once; read by every dial.
// ------------------------------------------------------------------------------------------------------------------
export const TEN_PAST_TEN = Object.freeze({ minuteDeg: 60, hourDeg: 305 });

const D2R = Math.PI / 180;
const f = (x) => { const s = Number(x).toFixed(6); return s.indexOf('.') < 0 ? s + '.0' : s; };   // a number as a GLSL float literal

// The great hands' law: E(s), by the metres flown alone (see the header).
export const HAND_LAW = Object.freeze({ a: 205, b: 235, c: 385, d: 420, minuteTurn: 660, hourTurn: 55 });
export function handAngles(s) {
  const { a, b, c, d } = HAND_LAW, area = (b - a) / 2 + (c - b) + (d - c) / 2;   // 15 + 150 + 17.5 = 182.5
  let I = 0;
  if (s <= a) I = 0;
  else if (s <= b) I = (s - a) * (s - a) / (2 * (b - a));
  else if (s <= c) I = (b - a) / 2 + (s - b);
  else if (s < d) I = (b - a) / 2 + (c - b) + (s - c) - (s - c) * (s - c) / (2 * (d - c));
  else I = area;
  const E = I / area;
  return { E, minuteDeg: TEN_PAST_TEN.minuteDeg + HAND_LAW.minuteTurn * E, hourDeg: TEN_PAST_TEN.hourDeg + HAND_LAW.hourTurn * E };
}

// ------------------------------------------------------------------------------------------------------------------
// THE SMALL DIAL'S LAW (unit dial). Every length is in dial radii; the same numbers build the near hands' geometry,
// draw the shader's face and give the typed means.
// ------------------------------------------------------------------------------------------------------------------
export const FACE = Object.freeze({
  rFace: 0.88,                                   // the face's circle; the bezel lies between it and the disc's edge
  hub: 0.11,                                     // hub disc radius
  // strokes: straight-sided wedges along their radius, half width hIn at uIn growing to hOut at uOut
  stroke: Object.freeze({ uIn: 0.62, uOut: 0.80, hIn: 0.016, hOut: 0.034 }),
  quarter: Object.freeze({ uIn: 0.54, uOut: 0.80, hIn: 0.026, hOut: 0.058 }),
  track: Object.freeze({ r: 0.84, h: 0.008 }),   // the minute track: a ring of half width h
  // hands: a blade of half width w0 from the centre to the hub's edge, tapering straight to a point at L; an eye
  // (ring of outer radius Re, bore Ri) centred two thirds of the way out
  minute: Object.freeze({ L: 0.60, w0: 0.040, ue: 0.40, Re: 0.070, Ri: 0.040 }),
  hour: Object.freeze({ L: 0.42, w0: 0.055, ue: 0.28, Re: 0.085, Ri: 0.048 }),
  T: 0.35,                                       // the face's period for going over to its mean: the strokes' spacing, 2 pi 0.67 / 12
});

// TYPED MEANS of the face: the share of the face disc (radius 0.88, area pi 0.88^2 = 2.432849) under each drawn thing.
// The code below is the arithmetic; the figures it yields are written beside it.
function faceShares() {
  const F = FACE, face = Math.PI * F.rFace * F.rFace;                                         // 2.432849
  // strokes are trapezoids: mean width times length. Eight ordinary, four quarters.
  const trap = (s) => (2 * s.hIn + 2 * s.hOut) / 2 * (s.uOut - s.uIn);
  const strokes = 8 * trap(F.stroke) + 4 * trap(F.quarter);                                   // 8 x 0.009000 + 4 x 0.021840 = 0.159360
  // the track is an annulus: pi ((r+h)^2 - (r-h)^2) = 4 pi r h
  const track = 4 * Math.PI * F.track.r * F.track.h;                                          // 0.084446
  // one hand outside the hub disc (radius rb):
  //   neck   the strip of half width w0 from u = 0 to rb, less its part inside the hub (half of strip-in-disc):
  //          2 w0 rb - (w0 sqrt(rb^2 - w0^2) + rb^2 asin(w0 / rb))
  //   taper  a triangle of base 2 w0 and height L - rb:  w0 (L - rb)
  //   ears   the eye's disc outside the blade: two circular segments cut by the blade's edges, each
  //          Re^2 acos(p / Re) - p sqrt(Re^2 - p^2), p = the edge's distance from the eye's centre = k (L - ue) / sqrt(1 + k^2),
  //          k = w0 / (L - rb) the edge's slope
  //   bore   less pi Ri^2 (the bore is wider than the blade there and lies wholly inside blade and ring)
  const hand = (h) => {
    const rb = F.hub, k = h.w0 / (h.L - rb), p = k * (h.L - h.ue) / Math.sqrt(1 + k * k);
    const neck = 2 * h.w0 * rb - (h.w0 * Math.sqrt(rb * rb - h.w0 * h.w0) + rb * rb * Math.asin(h.w0 / rb));
    const taper = h.w0 * (h.L - rb);
    const ears = 2 * (h.Re * h.Re * Math.acos(p / h.Re) - p * Math.sqrt(h.Re * h.Re - p * p));
    return neck + taper + ears - Math.PI * h.Ri * h.Ri;
  };
  // minute: 0.000198 + 0.019600 + 0.010879 - 0.005027 = 0.025650;  hour: 0.000525 + 0.017050 + 0.014499 - 0.007238 = 0.024836
  // The two necks cross only inside the hub (their crossing reaches 0.089 from the centre, the hub is 0.11), and at
  // ten past ten the hands are 115 degrees apart, so the three pieces add: hub pi 0.11^2 = 0.038013.
  const hands = Math.PI * F.hub * F.hub + hand(F.minute) + hand(F.hour);                      // 0.088499
  // The minute hand ends at 0.60, short of the strokes (from 0.62), and the strokes end at 0.802, short of the track
  // (from 0.832): nothing overlaps, so the shares add.
  return { strokes: strokes / face, track: track / face, hands: hands / face };              // 0.065503, 0.034711, 0.036377
}
export const FACE_MEANS = Object.freeze(faceShares());

// ------------------------------------------------------------------------------------------------------------------
// GLSL shared by everything: the filtering forms.
//   tptBox   a band of half width h whose centre is d from the pixel's centre, under a pixel of width w: the box
//            integral of the band over the pixel (its true cover, for any w)
//   tptEdge  the cover of the half plane d < 0 under a pixel of width w (the same box integral for one edge)
//   tptDisc  a disc of radius R0 whose centre is r from the pixel's centre, under a pixel of width w: tptEdge about
//            an edge drawn in to rho, so that the cover summed over the plane is the disc's area pi R0^2 FOR ANY w.
//            While w / 2 <= rho the edge's ramp adds pi w^2 / 12 to pi rho^2 (the ramp is odd about rho and the
//            ring at rho + d is 2 pi (rho + d) long: 2 pi x 2 x (w^2/16 - w^2/24)), so rho = sqrt(R0^2 - w^2 / 12).
//            Wider than that (w > sqrt(3) R0) the cover is a cone of base radius a = rho + w / 2 and height a / w,
//            of volume pi a^3 / (3 w), so a = cbrt(3 w R0^2) and rho = a - w / 2. The two meet at w = sqrt(3) R0.
// A band along a closed line keeps its area under tptBox as long as the box stays clear of the line's centre; a
// straight band or bar keeps it always.
// ------------------------------------------------------------------------------------------------------------------
export const FILTER_GLSL = /* glsl */`
#ifndef TPT_FILTER_GLSL
#define TPT_FILTER_GLSL
float tptBox(float d, float h, float w){ return clamp((min(d + h, w * 0.5) - max(d - h, -w * 0.5)) / w, 0.0, 1.0); }
float tptEdge(float d, float w){ return clamp(0.5 - d / w, 0.0, 1.0); }
float tptDisc(float r, float R0, float w){
  float rho = w < 1.7320508 * R0 ? sqrt(R0 * R0 - w * w / 12.0) : pow(3.0 * w * R0 * R0, 0.33333333) - 0.5 * w;
  return clamp(0.5 - (r - rho) / w, 0.0, 1.0);
}
#endif
`;

// The face law as GLSL. p is the place on the unit dial (twelve at +y, three at +x), fw the pixel's width on the
// face in the same units. tptFaceCov returns the cover of (strokes, minute track, hands with hub) at p; under a wide
// pixel each goes over to its typed mean, the share worked out in faceShares() above:
//   strokes 0.159360 / 2.432849 = 0.065503,  track 0.084446 / 2.432849 = 0.034711,  hands and hub 0.088499 / 2.432849 = 0.036377
// so a far dial is its face's mean colour: enamel less those shares, each share in its own colour.
// hands = 0 leaves the hands and hub out (the near weight, whose hands are blades and a hub disc of their own).
function handGLSL(name, h, deg) {
  const F = FACE, t = deg * D2R, k = h.w0 / (h.L - F.hub);
  // The hand is drawn OUTSIDE THE HUB only (the hub's disc is drawn by itself and the three covers add, as their
  // typed shares do). The hub's round cut across the neck is drawn as a straight cut at uc, the one that leaves the
  // same area of neck outside the hub: 2 w0 (rb - uc) = 2 w0 rb - (w0 sqrt(rb^2 - w0^2) + rb^2 asin(w0 / rb)).
  // The straight cut and the round one part by two slivers of one area: about the neck's middle line the drawn
  // neck laps the hub's disc (0.000077 for the minute hand, 0.000205 for the hour hand), and by its two edges as
  // much bare face is left between hub and neck. Where neck and hub lap, the summed cover is held to 1; so under a
  // fine pixel the drawn cover of hands and hub is 0.000282 short of the typed area, 0.036261 of the face where
  // the typed share is 0.036377 (three parts in a thousand of it). A wider pixel does not mend that: where the
  // hub's falling edge and a neck's rising edge lap, their sum stands over 1 by the lap's depth whatever the
  // pixel's width, so the drawn share stays short as the pixel widens (0.036262 at a width of 0.01, 0.036284 at
  // 0.04, 0.036354 at 0.0875: at most 0.32 per cent under the typed share) until the typed mean takes over (from
  // a width of 0.0875 to 0.35).
  const rb = F.hub, uc = (h.w0 * Math.sqrt(rb * rb - h.w0 * h.w0) + rb * rb * Math.asin(h.w0 / rb)) / (2 * h.w0);
  return /* glsl */`
float ${name}(vec2 p, float w){
  float u = p.x * ${f(Math.sin(t))} + p.y * ${f(Math.cos(t))};
  float v = abs(p.x * ${f(Math.cos(t))} - p.y * ${f(Math.sin(t))});
  float H = min(${f(h.w0)}, ${f(k)} * (${f(h.L)} - u));                                  // neck, then the straight taper to the point
  float du = u - ${f(h.ue)};
  H = max(max(H, 0.0), sqrt(max(${f(h.Re * h.Re)} - du * du, 0.0)));                     // the eye's ring swells the outline
  // across the hand the box over the outline's width, along it the box over its length: the two together keep the
  // outline's area for any w (the first sums to 2 H(u) across, the second is odd about each end, where H is level)
  float c = tptBox(v, H, w) * tptBox(u - ${f((h.L + uc) / 2)}, ${f((h.L - uc) / 2)}, w);
  float bore = tptDisc(length(vec2(du, v)), ${f(h.Ri)}, w);
  return max(c - bore, 0.0);
}`;
}
function strokeGLSL() {
  const s = FACE.stroke, q = FACE.quarter;
  return /* glsl */`
float tptStrokes(vec2 p, float w){
  float r = length(p);
  if (r < 0.2) return 0.0;
  float k = floor(atan(p.x, p.y) / 0.5235988 + 0.5);                                      // the nearest of the twelve
  float a = k * 0.5235988, sa = sin(a), ca = cos(a);
  float u = p.x * sa + p.y * ca, v = abs(p.x * ca - p.y * sa);
  float qt = 1.0 - step(0.5, abs(mod(k + 12.0, 3.0)));                                     // 1 at twelve, three, six, nine
  float uIn = mix(${f(s.uIn)}, ${f(q.uIn)}, qt), uOut = mix(${f(s.uOut)}, ${f(q.uOut)}, qt);
  float hIn = mix(${f(s.hIn)}, ${f(q.hIn)}, qt), hOut = mix(${f(s.hOut)}, ${f(q.hOut)}, qt);
  float h = mix(hIn, hOut, clamp((u - uIn) / (uOut - uIn), 0.0, 1.0));                     // the wedge narrows toward the centre
  return tptBox(v, h, w) * tptBox(u - 0.5 * (uIn + uOut), 0.5 * (uOut - uIn), w);
}`;
}
// the far disc as built: sixteen sides, corners at radius 1; and the bezel's share of it
export const FAR_DISC_AREA = 8 * Math.sin(Math.PI / 8), FAR_BEZEL_SHARE = 1 - Math.PI * FACE.rFace * FACE.rFace / FAR_DISC_AREA;
export const FACE_GLSL = FILTER_GLSL + strokeGLSL()
  + handGLSL('tptHandMinute', FACE.minute, TEN_PAST_TEN.minuteDeg) + handGLSL('tptHandHour', FACE.hour, TEN_PAST_TEN.hourDeg) + /* glsl */`
uniform vec3 uTptFaceCol[4];     // by kind: white enamel, ivory enamel, glass against sky, marble
uniform vec3 uTptStrokeCol[4];   // strokes and minute track
uniform vec3 uTptHandCol[4];     // hands and hub: blued steel; brass on the marble floor
// share: the face disc's own cover of the pixel (1 on a face that fills it; on the far disc, 1 less the bezel's cover),
// which the typed means are shares of.
vec3 tptFaceCov(vec2 p, float fw, float hands, float share){
  float w = max(fw, 1e-5), r = length(p);
  float cs = tptStrokes(p, w);
  // THE MINUTE TRACK lies 0.04 inside the face's edge. Its box cover runs past that edge once w / 2 + h > 0.04; the
  // part that would fall outside is laid back inside as its mirror image in the edge, weighed by r' / r (r' = 2 rFace
  // - r, the mirrored radius: a ring at r' is that much longer than the ring at r it is laid on), so that the cover
  // summed over the face stays the track's whole area 4 pi r h for any w. Nothing of it is drawn beyond the edge.
  float rm = ${f(2 * FACE.rFace)} - r;
  float ct = (tptBox(r - ${f(FACE.track.r)}, ${f(FACE.track.h)}, w) + tptBox(rm - ${f(FACE.track.r)}, ${f(FACE.track.h)}, w) * rm / max(r, 0.2)) * step(r, ${f(FACE.rFace)});
  // hub, minute hand and hour hand: their covers add, held to 1 (the necks' straight cuts lap the hub by two slivers: see handGLSL)
  float ch = min(tptDisc(r, ${f(FACE.hub)}, w) + tptHandMinute(p, w) + tptHandHour(p, w), 1.0);
  float toMean = 1.0 - smoothstep(${f(0.25 * FACE.T)}, ${f(FACE.T)}, w);                   // period T = ${f(FACE.T)}: the strokes' spacing
  // typed means: the shares of the face disc, from faceShares()
  cs = mix(${f(FACE_MEANS.strokes)} * share, cs, toMean);
  ct = mix(${f(FACE_MEANS.track)} * share, ct, toMean);
  ch = mix(${f(FACE_MEANS.hands)} * share, ch, toMean) * hands;
  return vec3(cs, ct, ch);
}
vec3 tptFaceCov(vec2 p, float fw, float hands){ return tptFaceCov(p, fw, hands, 1.0); }
// THE FAR DISC'S BEZEL: what lies between the face's edge (the circle rFace) and the disc's own edge. THE DISC IS
// BUILT AS A FIGURE OF SIXTEEN SIDES with its corners at radius 1: its area is 8 sin(pi / 8) = ${f(FAR_DISC_AREA)} and its
// sides come in to ${f(Math.cos(Math.PI / 16))} at their middles. The bezel's cover of the pixel is 1 less the enamel disc's, whose edge
// is drawn in as in tptDisc so that the enamel keeps its whole area pi rFace^2; the edge's ramp ends inside the
// sixteen sides while w <= 0.2 (rho + w / 2 <= 0.8781 + 0.1). A wider pixel uses the form at 0.2 and goes over to
// the typed mean by w = 0.48: the bezel's share of the built figure, 1 - pi rFace^2 / ${f(FAR_DISC_AREA)} = ${f(FAR_BEZEL_SHARE)}.
float tptFarBezel(float r, float fw){
  float w = min(max(fw, 1e-5), 0.2);
  float enamel = tptEdge(r - sqrt(${f(FACE.rFace * FACE.rFace)} - w * w / 12.0), w);
  return mix(${f(FAR_BEZEL_SHARE)}, 1.0 - enamel, 1.0 - smoothstep(0.2, 0.48, fw));
}
// THE SHARES OF THE PIXEL on a dial's disc at p: (strokes and track, hands and hub, bezel, bare face); they add to
// one. onFar: 1 on the far disc, which carries its bezel; 0 on a face disc. The bezel gives way where a stroke's or a
// hand's cover overlaps its own.
vec4 tptDialShares(vec2 p, float fw, float hands, float onFar){
  float bz = onFar * tptFarBezel(length(p), fw);
  vec3 cov = tptFaceCov(p, fw, hands, 1.0 - bz);
  float marks = min(cov.x + cov.y + cov.z, 1.0);
  bz = min(bz, 1.0 - marks);
  return vec4(cov.x + cov.y, cov.z, bz, 1.0 - marks - bz);
}
// the face's colour at p for a kind (0..3): the ground less the covers, each cover in its own colour
vec3 tptFace(vec2 p, float fw, float kind, float hands){
  int ki = int(clamp(kind, 0.0, 3.0) + 0.5);
  vec3 c = tptFaceCov(p, fw, hands);
  return uTptFaceCol[ki] * (1.0 - c.x - c.y - c.z) + uTptStrokeCol[ki] * (c.x + c.y) + uTptHandCol[ki] * c.z;
}
vec3 tptFace(vec2 p, float fw, float kind){ return tptFace(p, fw, kind, 1.0); }
`;

// The small dials' material: one shader for the three weights. aPart: 0 the face disc (and, on the far disc, the
// bezel drawn beyond the face), 1 a modelled bezel, 2 a modelled hand. The world's sun shadow is plugged in as
// opts.sunGLSL, which must declare  float worldSun(vec3 worldPos, vec3 normal, float footprint)  (default: 1). It may
// also define TPT_FILL and declare  vec3 tptFill(vec3 worldPos, vec3 normal)  : light added to the sky light there,
// and TPT_SKY_LIFT with  float tptSkyLift(vec3 worldPos)  : a factor on the sky light there.
const DIAL_VERT = (moveGLSL) => /* glsl */`
attribute float aPart;
attribute float aKind;
varying vec2 vP; varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vW; varying float vPart; varying float vKind;
#include <common>
#include <fog_pars_vertex>
${moveGLSL}
void main(){
  #ifdef USE_INSTANCING
    mat4 mm = modelMatrix * instanceMatrix;
  #else
    mat4 mm = modelMatrix;
  #endif
  mm = tptMove(mm);                                                   // the whole dial moves as one body (a watch on its chain); the face law is untouched
  vP = position.xy; vPart = aPart; vKind = aKind;
  mat3 m3 = mat3(mm);
  vN = m3 * normal; vT = m3[0]; vB = m3[1];
  vec4 wp = mm * vec4(position, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DIAL_FRAG = (sunGLSL) => /* glsl */`
uniform vec3 uSkyCol; uniform vec3 uGroundCol; uniform vec3 uSunCol; uniform vec3 uSunDir; uniform float uSun;
uniform vec3 uBezelCol; uniform float uHands; uniform float uFar;
varying vec2 vP; varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vW; varying float vPart; varying float vKind;
#include <common>
#include <fog_pars_fragment>
${FACE_GLSL}
${sunGLSL}
void main(){
  float lenN = max(length(vN), 1e-6), sc = max(length(vT), 1e-6);
  vec3 N = vN / lenN;
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  float fw = max(length(dFdx(vP)), length(dFdy(vP)));                 // the pixel's width on the face, in dial radii
  float fpW = fw * sc;                                                // and in metres
  float r = length(vP);
  int ki = int(clamp(vKind, 0.0, 3.0) + 0.5);
  float isFace = 1.0 - step(0.5, vPart), isHand = step(1.5, vPart);
  float toMean = 1.0 - smoothstep(${f(0.25 * FACE.T)}, ${f(FACE.T)}, fw);
  // the face and (far disc) the bezel beyond it: every share of the pixel in its own colour, the shares adding to
  // one (the bezel gives way where a stroke's or a hand's cover overlaps its own). A modelled bezel or hand takes
  // its own colour.
  vec4 sh = tptDialShares(vP, fw, uHands, uFar);
  float bz = sh.z, ground = sh.w;                                      // the bezel's share and the bare face's
  vec3 alb = uTptFaceCol[ki] * ground + uTptStrokeCol[ki] * sh.x + uTptHandCol[ki] * sh.y + uBezelCol * bz;
  alb = mix(alb, uBezelCol, (1.0 - isFace) * (1.0 - isHand));
  alb = mix(alb, uTptHandCol[ki], isHand);
  // enamel has a slight dome: the highlight's normal leans outward 0.22 for each dial radius from the hub. Under a
  // pixel wider than 0.35 of a dial radius the highlight is the dome's own mean over the face (radius 0.88): with the
  // half vector on the dial's axis exactly A_n = (1 - (1 + c R^2)^(1 - n/2)) / (c R^2 (n/2 - 1)), c R^2 = 0.0484 x
  // 0.88^2 = 0.037481: A_48 = 0.662366, A_14 = 0.880900. Off the axis the fall with the angle is A FIT, A_n cos^M
  // (M 31.1 for the sun's power 48, 12.3 for the sky's 14): within 0.0041 and 0.0020 of the highlight's peak (1),
  // counted by half degrees from 0 to 40 degrees between the axis and the half vector.
  float domed = isFace * (1.0 - bz);
  vec3 Nd = N + (vT * vP.x + vB * vP.y) / sc * (0.22 * domed);
  Nd /= max(length(Nd), 1e-4);
  float sunShare = uSun * worldSun(vW, N, fpW);
  float through = isFace * (1.0 - bz) * step(1.5, vKind) * step(vKind, 2.5);   // kind 2: glass against the sky, written as it is
  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
  #ifdef TPT_SKY_LIFT
    hemi *= tptSkyLift(vW);                                           // a world's own rise and fall of the sky light, by place and time
  #endif
  #ifdef TPT_FILL
    hemi += tptFill(vW, N);                                           // a world's own fill light, by place (see above)
  #endif
  vec3 col = alb * (hemi + uSunCol * sunShare * max(dot(N, uSunDir), 0.0));
  vec3 Hs = uSunDir + V; Hs /= max(length(Hs), 1e-4);
  vec3 Hz = vec3(0.0, 1.0, 0.0) + V; Hz /= max(length(Hz), 1e-4);
  float gloss = mix(0.5, 1.0, isFace);
  float axS = max(dot(N, Hs), 0.0), axZ = max(dot(N, Hz), 0.0);
  float hs = mix(mix(pow(axS, 48.0), 0.662366 * pow(axS, 31.1), domed), pow(max(dot(Nd, Hs), 0.0), 48.0), toMean);
  float hz = mix(mix(pow(axZ, 14.0), 0.880900 * pow(axZ, 12.3), domed), pow(max(dot(Nd, Hz), 0.0), 14.0), toMean);
  col += gloss * (uSunCol * sunShare * 0.55 * hs + uSkyCol * 0.16 * hz);
  // kind 2: the bare glass shows the sky as it is (unlit); its strokes and hands are lit like any other
  col = mix(col, uTptFaceCol[2] * ground + (alb - uTptFaceCol[2] * ground) * hemi, through);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const DIAL_GLASS_FRAG = (sunGLSL) => /* glsl */`
uniform vec3 uSkyCol; uniform vec3 uSunCol; uniform vec3 uSunDir; uniform float uSun;
varying vec3 vN; varying vec3 vT; varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
${sunGLSL}
void main(){
  vec3 N = vN / max(length(vN), 1e-6);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  float fpW = max(length(dFdx(vW)), length(dFdy(vW)));
  float g = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  vec3 Hs = uSunDir + V; Hs /= max(length(Hs), 1e-4);
  float sunShare = uSun * worldSun(vW, N, fpW);
  // a domed glass: a soft sheen of sky toward its edge and the sun's soft flash where it mirrors
  vec3 col = uSkyCol * (0.03 + 0.5 * g * g * g) + uSunCol * sunShare * 1.2 * pow(max(dot(N, Hs), 0.0), 90.0);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col *= 1.0 - ff;
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// a little geometry writer: positions, normals and one float per vertex (aPart, or a colour index elsewhere)
function makeWriter() {
  const P = [], N = [], A = [];
  const w = {
    P, N, A,
    tri(a, b, c, n, part) { P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let i = 0; i < 3; i++) { N.push(n[0], n[1], n[2]); A.push(part); } },
    quad(a, b, c, d, n, part) { w.tri(a, b, c, n, part); w.tri(a, c, d, n, part); },
    // a band of a ring about the z axis from (r0, z0) to (r1, z1): seg quads with the band's own normal
    band(r0, z0, r1, z1, seg, part, phase = 0) {
      const dr = r1 - r0, dz = z1 - z0, l = Math.hypot(dr, dz) || 1, nr = -dz / l, nz = dr / l;
      for (let i = 0; i < seg; i++) {
        const a0 = phase + i / seg * Math.PI * 2, a1 = phase + (i + 1) / seg * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const p00 = [r0 * c0, r0 * s0, z0], p01 = [r0 * c1, r0 * s1, z0], p10 = [r1 * c0, r1 * s0, z1], p11 = [r1 * c1, r1 * s1, z1];
        const n0 = [nr * c0, nr * s0, nz], n1 = [nr * c1, nr * s1, nz];
        P.push(...p00, ...p10, ...p11, ...p00, ...p11, ...p01);
        N.push(...n0, ...n0, ...n1, ...n0, ...n1, ...n1);
        for (let k = 0; k < 6; k++) A.push(part);
      }
    },
    geometry(attr = 'aPart') {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute(attr, new THREE.Float32BufferAttribute(A, 1));
      return g;
    },
  };
  return w;
}

// one small hand as a flat blade at height z, standing at deg clockwise from twelve: neck, taper, eight-sided eye, point
function writeSmallHand(w, h, deg, z) {
  const F = FACE, t = deg * D2R, ax = [Math.sin(t), Math.cos(t)], pv = [Math.cos(t), -Math.sin(t)], n = [0, 0, 1];
  const at = (u, v) => [ax[0] * u + pv[0] * v, ax[1] * u + pv[1] * v, z];
  const hw = (u) => Math.max(0, Math.min(h.w0, h.w0 * (h.L - u) / (h.L - F.hub)));
  const u1 = h.ue - h.Ri, u2 = h.ue + h.Ri;                              // the blade stops at the eye's bore and goes on beyond it
  w.quad(at(0, -h.w0), at(F.hub, -h.w0), at(F.hub, h.w0), at(0, h.w0), n, 2);
  w.quad(at(F.hub, -h.w0), at(u1, -hw(u1)), at(u1, hw(u1)), at(F.hub, h.w0), n, 2);
  w.tri(at(u2, -hw(u2)), at(h.L, 0), at(u2, hw(u2)), n, 2);
  const ro = h.Re / Math.cos(Math.PI / 8), ri = h.Ri / Math.cos(Math.PI / 8);   // eight sides about the true circles
  for (let i = 0; i < 8; i++) {
    const a0 = (i + 0.5) * Math.PI / 4, a1 = (i + 1.5) * Math.PI / 4;
    w.quad(at(h.ue + ri * Math.cos(a0), ri * Math.sin(a0)), at(h.ue + ro * Math.cos(a0), ro * Math.sin(a0)),
      at(h.ue + ro * Math.cos(a1), ro * Math.sin(a1)), at(h.ue + ri * Math.cos(a1), ri * Math.sin(a1)), n, 2);
  }
}

// THE DIAL KIT. opts: palette (the brief's eight), sunGLSL (declares float worldSun(vec3 worldPos, vec3 normal,
// float footprint); default returns 1), sunUniforms (merged by reference into every kit material).
// moveGLSL (optional) declares  mat4 tptMove(mat4 mm)  with its own attributes and uniforms (put the uniforms into
// sunUniforms): it is given the dial's placing matrix and returns the matrix the dial is drawn with, so that a dial
// carried by something that swings (a watch on its chain) swings with it as one rigid body. Default: no movement.
// It moves the body only: the hands stay where the face law puts them.
// Returns { near, middle, far, uniforms, setSun, FACE }: near = { geometry, material, glassGeometry, glassMaterial,
// triangles }, middle and far = { geometry, material, triangles }. Make InstancedMeshes from them and add the
// instance attribute aKind (see the header). uniforms is shared by all the kit's materials: uSkyCol, uGroundCol,
// uSunCol, uSunDir (world), uSun, uBezelCol and the three colour tables by kind.
export function makeDialKit(ctx, opts = {}) {
  const pal = (opts.palette || ['#F3F0E6', '#15191C', '#2F6B62', '#C8A545', '#8FC3EA', '#D8432B', '#D9D2C0', '#1E2F5C']).map((h) => new THREE.Color(h));
  const sunGLSL = opts.sunGLSL || 'float worldSun(vec3 wp, vec3 n, float fp){ return 1.0; }';
  const moveGLSL = opts.moveGLSL || 'mat4 tptMove(mat4 mm){ return mm; }';
  const col = (c, k = 1) => new THREE.Vector3(c.r * k, c.g * k, c.b * k);
  const shared = {
    uSkyCol: { value: new THREE.Vector3(0.78, 0.90, 1.08) }, uGroundCol: { value: new THREE.Vector3(0.46, 0.47, 0.50) },
    uSunCol: { value: new THREE.Vector3(2.6, 2.45, 2.0) }, uSunDir: { value: new THREE.Vector3(0.7002, 0.7071, 0.0984) }, uSun: { value: 1 },
    uBezelCol: { value: col(pal[3], 0.8) },
    uTptFaceCol: { value: [col(pal[0], 0.86), col(pal[6], 0.95), new THREE.Vector3(0.62, 0.80, 1.0), new THREE.Vector3(0.74, 0.73, 0.69)] },
    uTptStrokeCol: { value: [col(pal[1]), col(pal[1]), col(pal[1]), new THREE.Vector3(0.05, 0.06, 0.075)] },
    uTptHandCol: { value: [col(pal[7]), col(pal[7]), col(pal[7]), col(pal[3], 0.9)] },
    ...(opts.sunUniforms || {}),
  };
  const mat = (hands, far) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), ...shared, uHands: { value: hands }, uFar: { value: far } },
    vertexShader: DIAL_VERT(moveGLSL), fragmentShader: DIAL_FRAG(sunGLSL), fog: true, side: THREE.DoubleSide,
  });
  const F = FACE, SEG = 16, ph = Math.PI / 2;      // a vertex at twelve
  // THE FACE AS IT IS SEEN: the bezel's inner edge has sixteen sides, and its sides' middles stand on the face's
  // circle (corners at rFace / cos(pi / 16) = 0.8972), so the whole circle the face law is written for shows inside the
  // bezel: the track, laid back in the circle's edge, with it. Between the circle and the corners the face disc
  // shows as bare enamel: sixteen slivers, 1.3 per cent of the circle's area together. The face disc runs on under
  // the bezel as far as it can and still stand inside every mouth and lip a dial is set in:
  //   NEAR: its corners at 1.0, the bezel's own outer corners, where the bezel's outer band comes down to the disc's
  //   plane. The two meet edge to edge all round, so the space under the bezel is closed: the inner edge stands
  //   0.012 over the disc, and a view that enters there from any angle falls on the disc or on the bezel's underside.
  //   MIDDLE: its corners at 0.951 (its sides' middles at 0.951 cos(pi / 16) = 0.9327), which stands inside a
  //   watch's ten-sided mouth (sides' middles at cos 18 degrees = 0.951057) and inside every other mouth and lip a
  //   middle dial is set in but the narrowest, the eight-sided lip of the passage's drop clocks (row C): that
  //   lip's sides' middles stand at 0.7853 m about a dial of radius 0.83 (0.946 of the radius), the dial is set
  //   0.01 m behind the lip's inner edge, and eight of the disc's corners (0.7893 m out, at the lip's sides'
  //   middles) run on 0.004 m past that edge, 0.0085 m behind the lip's own face: they are hidden behind the lip,
  //   and the disc that shows is cut by the lip's edge. The ring is bevelled: its inner edge (corners at 0.8972,
  //   sides' middles at 0.88) stands ON the disc and its outer edge (corners at 1.0, sides' middles at 0.9808)
  //   0.03 over the disc's plane. It laps the disc by 0.9327 - 0.88 = 0.0527 at the sides' middles (0.951 - 0.8972
  //   = 0.0538 at the corners) and stands 0.0157 over the disc's edge. Inside the ring no view passes: the ring
  //   and the disc meet. Under the ring's outer edge (0.049 and 0.0481 beyond the disc's) a view from the side
  //   falls on the disc or on the ring's underside; a view that comes past the outer edge on the eye's own side
  //   falls on the disc from atan(0.0481 / 0.03) = 58.0 degrees off the axis (58.5 at the corners), and nearer the
  //   axis than that it goes by the disc's edge to whatever the ring overhangs (the lip or the mouth the dial is
  //   set in).
  const rIn = F.rFace / Math.cos(Math.PI / SEG);

  // near: face disc, moulded bezel (two bands), two blades standing off the face and the hub under their roots.
  // The hub is an eight-sided disc of the area of the hub's circle (radius 0.11): its corners at
  // 0.11 sqrt(pi / (2 sqrt 2)) = 0.11593, 0.025 off the face, 0.01 under the hour blade. Blades and hub together cover
  // 0.0368 of the face's circle (counted on a grid of 2400 by 2400 over it) where the typed share of hands and hub
  // is 0.036377; the blades alone cover 0.0290. The 0.0005 over is for the most part the eyes' eight sides, which
  // stand about their circles.
  let w = makeWriter();
  for (let i = 0; i < SEG; i++) { const a0 = i / SEG * 6.2831853, a1 = (i + 1) / SEG * 6.2831853; w.tri([0, 0, 0], [Math.cos(a0), Math.sin(a0), 0], [Math.cos(a1), Math.sin(a1), 0], [0, 0, 1], 0); }
  w.band(rIn, 0.012, 0.945, 0.085, SEG, 1, ph); w.band(0.945, 0.085, 1.0, 0.0, SEG, 1, ph);
  { const rh = F.hub * Math.sqrt(Math.PI / (2 * Math.SQRT2));
    for (let i = 0; i < 8; i++) { const a0 = (i + 0.5) * Math.PI / 4, a1 = (i + 1.5) * Math.PI / 4; w.tri([0, 0, 0.025], [rh * Math.cos(a0), rh * Math.sin(a0), 0.025], [rh * Math.cos(a1), rh * Math.sin(a1), 0.025], [0, 0, 1], 2); } }
  writeSmallHand(w, F.hour, TEN_PAST_TEN.hourDeg, 0.035); writeSmallHand(w, F.minute, TEN_PAST_TEN.minuteDeg, 0.05);
  const nearGeo = w.geometry(), nearTris = w.P.length / 9;
  // its domed glass: a shallow cap over the face, 12 sides. Its rim (corners at 0.95, 0.04 over the disc) is seated
  // in the bezel: all round it lies under the bezel's surface, 0.003 to 0.045 under it, so the glass comes out of
  // the bezel's inner band and no edge of it stands free.
  w = makeWriter();
  { const G = 12, rim = 0.95, z0 = 0.04, zc = 0.19, rm = 0.52, zm = z0 + (zc - z0) * 0.72;
    for (let i = 0; i < G; i++) {
      const a0 = i / G * 6.2831853, a1 = (i + 1) / G * 6.2831853, nn = (a, r, t) => { const v = [Math.cos(a) * t, Math.sin(a) * t, 1], l = Math.hypot(v[0], v[1], 1); return [v[0] / l, v[1] / l, 1 / l]; };
      const c = [0, 0, zc], m0 = [rm * Math.cos(a0), rm * Math.sin(a0), zm], m1 = [rm * Math.cos(a1), rm * Math.sin(a1), zm], e0 = [rim * Math.cos(a0), rim * Math.sin(a0), z0], e1 = [rim * Math.cos(a1), rim * Math.sin(a1), z0];
      w.P.push(...c, ...m0, ...m1, ...m0, ...e0, ...e1, ...m0, ...e1, ...m1);
      w.N.push(0, 0, 1, ...nn(a0, rm, 0.25), ...nn(a1, rm, 0.25), ...nn(a0, rm, 0.25), ...nn(a0, rim, 0.6), ...nn(a1, rim, 0.6), ...nn(a0, rm, 0.25), ...nn(a1, rim, 0.6), ...nn(a1, rm, 0.25));
      for (let k = 0; k < 9; k++) w.A.push(3);
    } }
  const glassGeo = w.geometry(), glassTris = w.P.length / 9;
  const glassMat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), ...shared },
    vertexShader: DIAL_VERT(moveGLSL), fragmentShader: DIAL_GLASS_FRAG(sunGLSL), fog: true, side: THREE.DoubleSide,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  // middle: the face disc and a bevelled ring bezel that stands on the disc with its inner edge and rises to 0.03 at its outer edge; hands lie in the face
  w = makeWriter();
  for (let i = 0; i < SEG; i++) { const a0 = ph + i / SEG * 6.2831853, a1 = ph + (i + 1) / SEG * 6.2831853; w.tri([0, 0, 0], [0.951 * Math.cos(a0), 0.951 * Math.sin(a0), 0], [0.951 * Math.cos(a1), 0.951 * Math.sin(a1), 0], [0, 0, 1], 0); }
  w.band(rIn, 0.0, 1.0, 0.03, SEG, 1, ph);
  const midGeo = w.geometry(), midTris = w.P.length / 9;

  // far: one disc; the shader draws face, hands and bezel
  w = makeWriter();
  for (let i = 0; i < SEG; i++) { const a0 = ph + i / SEG * 6.2831853, a1 = ph + (i + 1) / SEG * 6.2831853; w.tri([0, 0, 0], [Math.cos(a0), Math.sin(a0), 0], [Math.cos(a1), Math.sin(a1), 0], [0, 0, 1], 0); }
  const farGeo = w.geometry(), farTris = w.P.length / 9;

  return {
    near: { geometry: nearGeo, material: mat(0, 0), glassGeometry: glassGeo, glassMaterial: glassMat, triangles: nearTris + glassTris },
    middle: { geometry: midGeo, material: mat(1, 0), triangles: midTris },
    far: { geometry: farGeo, material: mat(1, 1), triangles: farTris },
    uniforms: shared, FACE,
    setSun(x) { shared.uSun.value = x; },
  };
}

// ------------------------------------------------------------------------------------------------------------------
// THE GREAT DIAL'S PLAN (metres, in the dial's plane; u along a hand from the centre, v across it). The same
// numbers build the ironwork and draw the dial of light.
// ------------------------------------------------------------------------------------------------------------------
function piercings(h, spans) {
  // round piercings along a blade: each of radius four tenths of the blade's half width there, set 0.45 radii apart
  const out = [];
  for (const [a, b] of spans) {
    let u = a;
    for (let i = 0; i < 8; i++) {
      let r = 0.4 * bladeHalf(h, u); r = 0.4 * bladeHalf(h, u + r);
      if (u + 2 * r > b || r < 0.25) break;
      out.push(Object.freeze({ u: u + r, r }));
      u += 2.45 * r;
    }
  }
  return Object.freeze(out);
}
// half width of a great hand's blade at u (u0 .. tip), straight between the stations of its outline (h.prof):
// w0 at the collar's edge (u0); where a hand has one, wa at ua (the foot of its root's flare); w1 at u1 (the blade's
// waist); out again to w2 at u2 (the shoulders of its bold tip); then straight to the point
function bladeHalf(h, u) {
  const P = h.prof;
  if (u <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) if (u <= P[i][0]) return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * (u - P[i - 1][0]) / (P[i][0] - P[i - 1][0]);
  return 0;
}
function greatHand(h) {
  h.prof = Object.freeze([[h.u0, h.w0], ...(h.ua ? [[h.ua, h.wa]] : []), [h.u1, h.w1], [h.u2, h.w2], [h.tip, 0]]);
  h.holes = piercings(h, h.spans);
  return Object.freeze(h);
}
export const GREAT = Object.freeze({
  R: 38, ringIn: 35.6, opalIn: 30.1, minuteIn: 29.5, collarOut: 11.3, collarIn: 9.56, bossOut: 9.5, bossIn: 6.6, bossProud: 2.6, bossBack: 0.9,
  // (the boss ring's mouth: bore and outer side keep their radius from the back to bossThroat before the glass and are chamfered from there to the mouth)
  bossThroat: 2.3, bossMouthIn: 6.9, bossMouthOut: 9.2,
  stroke: Object.freeze({ uIn: 31.2, uOut: 35.2, hIn: 0.42, hOut: 0.95 }),        // 4 long
  quarter: Object.freeze({ uIn: 30.35, uOut: 35.35, hIn: 0.62, hOut: 1.55 }),     // 5 long and heavier
  // the web behind the hands, as built and as the dial of light draws it: 24 radial bars and three rings, each 0.30 wide
  bars: 24, barH: 0.15, rings: Object.freeze([14.5, 19.5, 24.5]), ringH: 0.15,
  // minute hand: to 33.5; 3.4 wide at its root, flaring in to 2.2 at 14.5, 1.6 at its waist (29.0), a bold tip 3.2
  // across its shoulders (30.4); eye two thirds of the way out (22.33), 5 across with a bore of 3; round piercings
  // in its root
  minute: greatHand({ tip: 33.5, u0: 11.3, w0: 1.7, ua: 14.5, wa: 1.1, u1: 29.0, w1: 0.8, u2: 30.4, w2: 1.6, ue: 22.33, Re: 2.5, Ri: 1.5, z: 2.4,
    tailU: 14.2, tw0: 1.5, tw1: 1.15, cu: 15.3, cr: 2.0, spans: [[12.3, 14.35], [14.65, 18.9]] }),
  // hour hand: to 23, the broader: 5.2 wide at its root, 3.0 at its waist (18.8), its tip 4.4 across its shoulders
  // (20.0); eye two thirds of the way out (15.33), 6 across with a bore of 3.6. At twelve it shows beyond the minute
  // hand on both sides out to radius 20.58: by 0.9 either side at the root, 1.03 at 14.5, 0.49 at its waist (the
  // minute hand's half width there is 1.01), 1.2 at its shoulders; from 20.58 to its point it is no wider than the
  // minute hand's eye (2.5 about 22.33) and lies behind it.
  hour: greatHand({ tip: 23, u0: 11.3, w0: 2.6, u1: 18.8, w1: 1.5, u2: 20.0, w2: 2.2, ue: 15.33, Re: 3.0, Ri: 1.8, z: 1.3,
    tailU: 14.0, tw0: 2.0, tw1: 1.5, cu: 15.1, cr: 2.4, spans: [] }),
});

// one great hand's cover at q (dial metres) for an angle a (radians clockwise from twelve) under a pixel of width w:
// its blade, eye and tail, and its collar round the boss (a whole ring from radius 9.56 to 11.3, the same at every angle).
// THE HAND IS DRAWN OUTSIDE ITS COLLAR ONLY, and the two covers ADD (as a small face's hub and hands do): under a
// wide pixel a joined figure (the greater of the two covers) falls short of its own mean. The collar's round edge
// across the blade's root, and across the tail's, is drawn as a straight cut (collarCut): the one that leaves the
// same area of blade outside the collar. About the hand's middle line the drawn blade laps the collar's ring a
// little, by its two edges as much is left bare, and where they lap the summed cover is held to 1: the minute
// hand's cuts stand 11.257 (blade) and 11.267 (tail) from the centre and lap the ring over 0.056 and 0.038 square
// metres; the hour hand's 11.199 and 11.241, over 0.202 and 0.091; the ring is 114.03.
// Summed over the plane, a hand's cover with its collar keeps its own figure under the finest footprint (the
// minute hand 177.62, the hour hand 176.46) within 0.1 per cent for a footprint w up to 8 (minute) and within
// 0.2 per cent up to 12 (hour); at 20 the minute hand's stands 0.87 per cent over it and the hour hand's 0.42.
// Along the hand each cut is the half plane's own box integral (tptEdge), and short of the cut the outline's half
// width is read at its mirror place beyond it: so the half width is even about the cut, the edge's ramp is odd
// about it, and the blade's cover summed over the plane is its area beyond the cut for any w.
const collarCut = (w0) => (w0 * Math.sqrt(GREAT.collarOut * GREAT.collarOut - w0 * w0) + GREAT.collarOut * GREAT.collarOut * Math.asin(w0 / GREAT.collarOut)) / (2 * w0);
function greatHandGLSL(name, h) {
  // the blade's half width, straight between the outline's stations (h.prof), as nested choices from the root outward
  const P = h.prof; let Hb = '0.0';
  for (let i = P.length - 1; i >= 1; i--) Hb = `(ub <= ${f(P[i][0])} ? mix(${f(P[i - 1][1])}, ${f(P[i][1])}, clamp((ub - ${f(P[i - 1][0])}) / ${f(P[i][0] - P[i - 1][0])}, 0.0, 1.0)) : ${Hb})`;
  const holes = h.holes.map((o) => `  open += tptDisc(length(vec2(u - ${f(o.u)}, v)), ${f(o.r)}, w);`).join('\n');
  const ucB = collarCut(h.w0), ucT = collarCut(h.tw0);
  return /* glsl */`
float ${name}(vec2 q, float a, float w){
  float sa = sin(a), ca = cos(a);
  float u = q.x * sa + q.y * ca, v = abs(q.x * ca - q.y * sa), t = -u;
  // blade and tail begin at their straight cuts (see above); short of a cut the outline is read at its mirror place
  float ub = ${f(ucB)} + abs(u - ${f(ucB)}), tb = ${f(ucT)} + abs(t - ${f(ucT)});
  // the outline's half width: blade (cut to the point), the eye's ring, the tail's stub and its weight
  float Hb = ${Hb};
  float He = sqrt(max(${f(h.Re * h.Re)} - (ub - ${f(h.ue)}) * (ub - ${f(h.ue)}), 0.0));
  float Ht = mix(${f(h.tw0)}, ${f(h.tw1)}, clamp((tb - ${f(h.u0)}) / ${f(h.tailU - h.u0)}, 0.0, 1.0)) * step(tb, ${f(h.tailU)});
  float Hc = sqrt(max(${f(h.cr * h.cr)} - (tb - ${f(h.cu)}) * (tb - ${f(h.cu)}), 0.0));
  float solid = tptBox(v, max(Hb, He), w) * tptEdge(${f(ucB)} - u, w) + tptBox(v, max(Ht, Hc), w) * tptEdge(${f(ucT)} - t, w);
  // what is pierced: the eye's bore and the round piercings of the web
  float open = tptDisc(length(vec2(u - ${f(h.ue)}, v)), ${f(h.Ri)}, w);
${holes}
  float collar = tptBox(length(q) - ${f((G.collarIn + G.collarOut) / 2)}, ${f((G.collarOut - G.collarIn) / 2)}, w);
  return min(max(solid - open, 0.0) + collar, 1.0);
}`;
}

// THE DIAL OF LIGHT (see the header). All lengths below are metres on a dial of radius 38; a dial of another size
// is scaled to it. The typed mean used here is one figure, the strokes' share of the opal ring:
//   eight strokes of (0.84 + 1.90) / 2 x 4 = 5.48 and four quarters of (1.24 + 3.10) / 2 x 5 = 10.85 make 87.24;
//   the opal ring is pi (35.6^2 - 30.1^2) = pi x 361.35 = 1135.21;  87.24 / 1135.21 = 0.076849.
// The strokes lie wholly on the opal ring, so their cover is taken off the ring's own (the two are not multiplied):
// what passes the ring is 0.5 x (ring - strokes), and summed over the ring that is half its area less the strokes'.
// A stroke's cover keeps its area for any w that leaves it clear of its neighbours (they stand 2 pi 30.35 / 12 =
// 15.9 apart at their roots; the cover is worked with w held to 12 at most), and from w = 4.3 to 17.3 it goes over
// to the typed mean, that share of the ring's cover at the place.
// The web needs none: tptLines is the exact box mean of a set of evenly spaced bars for any pixel (it tends to
// 2 h / T by itself), and the three rings, the zones and the hands are box integrals of single things. The web's
// clear glass passes GLASS_PASS; the bore is open air.
const G = GREAT;
// CLEAR GLASS passes this share of the light, here and in every roof and wall of a world that reads it
export const GLASS_PASS = 0.92;
const trapArea = (s) => (2 * s.hIn + 2 * s.hOut) / 2 * (s.uOut - s.uIn);
export const GREAT_STROKE_SHARE = (8 * trapArea(G.stroke) + 4 * trapArea(G.quarter)) / (Math.PI * (G.ringIn * G.ringIn - G.opalIn * G.opalIn));   // 0.076849
export const DIAL_LIGHT_GLSL = FILTER_GLSL + greatHandGLSL('tptGreatMinute', G.minute) + greatHandGLSL('tptGreatHour', G.hour) + /* glsl */`
uniform vec3 uTptC;        // the dial's centre, world
uniform vec3 uTptN;        // its facing (unit, toward the read side), world
uniform float uTptR;       // its radius, world metres
uniform vec3 uTptSun;      // direction to the sun, world
uniform vec2 uTptHands;    // the two hands' present angles, radians clockwise from twelve: (minute, hour)
uniform float uTptGable;   // the open share of the gable outside the dial's circle
uniform float uTptBore;    // the share that passes the hub's bore
uniform float uTptPen;     // the sun's width: metres of blur for each metre between the dial and the lit place
// bars of half width h, one every T, centred on the multiples of T: the box mean over [x - w/2, x + w/2]
float tptLinesF(float y, float T, float h){ float k = floor(y / T); return k * 2.0 * h + min(y - k * T, 2.0 * h); }
float tptLines(float x, float T, float h, float w){ return clamp((tptLinesF(x + 0.5 * w + h, T, h) - tptLinesF(x - 0.5 * w + h, T, h)) / w, 0.0, 1.0); }
float tptGreatStrokes(vec2 q, float w){
  float k = floor(atan(q.x, q.y) / 0.5235988 + 0.5);
  float a = k * 0.5235988, sa = sin(a), ca = cos(a);
  float u = q.x * sa + q.y * ca, v = abs(q.x * ca - q.y * sa);
  float qt = 1.0 - step(0.5, abs(mod(k + 12.0, 3.0)));
  float uIn = mix(${f(G.stroke.uIn)}, ${f(G.quarter.uIn)}, qt), uOut = mix(${f(G.stroke.uOut)}, ${f(G.quarter.uOut)}, qt);
  float hIn = mix(${f(G.stroke.hIn)}, ${f(G.quarter.hIn)}, qt), hOut = mix(${f(G.stroke.hOut)}, ${f(G.quarter.hOut)}, qt);
  float h = mix(hIn, hOut, clamp((u - uIn) / (uOut - uIn), 0.0, 1.0));
  return tptBox(v, h, w) * tptBox(u - 0.5 * (uIn + uOut), 0.5 * (uOut - uIn), w);
}
// the light that passes the opal ring with its strokes at q: half of what the strokes leave of the ring's cover
float tptOpalLight(vec2 q, float w){
  float opal = tptBox(length(q) - ${f((G.ringIn + G.opalIn) / 2)}, ${f((G.ringIn - G.opalIn) / 2)}, w);
  // strokes: period, their spacing, 2 pi 33 / 12 = 17.3
  float cs = mix(${f(GREAT_STROKE_SHARE)} * opal, tptGreatStrokes(q, min(w, 12.0)), 1.0 - smoothstep(${f(0.25 * 17.3)}, 17.3, w));
  return 0.5 * max(opal - cs, 0.0);
}
// the share of light that passes the dial's glass and fixed iron (rim, opal ring, web, boss and bore; the hands and
// their collars stand before the glass and are no part of this) for a ray that meets the glass's plane at q (dial
// metres from the centre) under a pixel of width w. d is the ray's drift across the dial for each metre before
// the glass: z before the glass the ray stands at q + d z, z behind it at q - d z. dep: how far before the glass
// the ray begins.
// THE BOSS IS TAKEN THROUGH ITS DEPTH, AS IT IS BUILT. The boss ring stands from ${f(G.bossBack)} behind the glass to its
// mouth ${f(G.bossProud)} before it. Its bore keeps the radius ${f(G.bossIn)} from its back to ${f(G.bossThroat)} before the glass and opens from
// there to ${f(G.bossMouthIn)} at the mouth; its outer side keeps ${f(G.bossOut)} as far and comes in to ${f(G.bossMouthOut)} at the mouth. The ray
// passes the bore only if it stands inside ${f(G.bossIn)} at the back and at ${f(G.bossThroat)}, and inside ${f(G.bossMouthIn)} at the mouth; the boss
// stops it wherever it comes within ${f(G.bossOut)} of the axis between the back and ${f(G.bossThroat)}, or within ${f(G.bossMouthOut)} at the mouth; the
// web's glass begins where the boss ends.
// THE ROUNDS KEEP THEIR AREAS. The rim and the bore's three rounds are filtered by tptDisc, which keeps each round's
// area under any footprint (the area, not the shape of the round's mean under a footprint wider than the round).
// The bore's cover is the least of the three: exact where the ray is square on to the dial; under the world's sun
// (the ray drifts 0.14 and 1.01 m across the dial for each metre before the glass) the three stand apart, the lit
// shape is a lens of 94.21 square metres, and the least of the three stands over the lens's own area by 1.0005,
// 1.0042, 1.0117, 1.0305 and 1.0720 at footprints of 1, 3, 5, 8 and 12 m; its exact form would be the lens's own
// closed mean. The web's glass is the ring between the boss and the minute ring less its three rings, which lie
// wholly inside it, times the open share between the bars.
float tptDialGlass(vec2 q, vec2 d, float dep, float w){
  float r = length(q);
  float outside = 1.0 - tptDisc(r, ${f(G.R)}, w);
  vec2 qa = q + d * min(${f(G.bossThroat)}, dep), qm = q + d * min(${f(G.bossProud)}, dep), qb = q - d * ${f(G.bossBack)}, e = qb - qa;
  float bore = min(min(tptDisc(length(qa), ${f(G.bossIn)}, w), tptDisc(length(qb), ${f(G.bossIn)}, w)), tptDisc(length(qm), ${f(G.bossMouthIn)}, w));
  float boss = max(tptEdge(length(qa + e * clamp(-dot(qa, e) / max(dot(e, e), 1e-6), 0.0, 1.0)) - ${f(G.bossOut)}, w), tptEdge(length(qm) - ${f(G.bossMouthOut)}, w));
  float web = tptEdge(r - ${f(G.minuteIn)}, w) * (1.0 - boss);
  float light = uTptGable * outside + uTptBore * bore;
  if (r > 1.0) {
    light += tptOpalLight(q, w);
    // the web: 24 radial bars measured along the arc, and three rings that lie wholly inside the web's ring: the
    // glass is the ring less its rings, times the open share between the bars
    float arc = (atan(q.x, q.y) + 3.14159265) * r;
    float bars = tptLines(arc, r * ${f(2 * Math.PI / G.bars)}, ${f(G.barH)}, w);
    float rings = min(tptBox(r - ${f(G.rings[0])}, ${f(G.ringH)}, w) + tptBox(r - ${f(G.rings[1])}, ${f(G.ringH)}, w) + tptBox(r - ${f(G.rings[2])}, ${f(G.ringH)}, w), 1.0);
    light += ${f(GLASS_PASS)} * max(web - rings, 0.0) * (1.0 - bars);
  }
  return light;
}
// THE BOSS BEFORE A HAND, for an eye on the read side (a mirror's): the share of a hand's figure, read in its plane
// z before the glass, that the boss hides. The eye's ray (at q + d z' at z' before the glass, begun dep before it)
// has passed the boss's body between its mouth and the hand's plane if it stands inside the boss's outer side at
// ${f(G.bossThroat)} or at the mouth and outside it in the hand's own plane.
float tptBossBefore(vec2 q, vec2 d, float z, float dep, float w){
  float far = max(tptEdge(length(q + d * clamp(dep, z, max(z, ${f(G.bossThroat)}))) - ${f(G.bossOut)}, w), tptEdge(length(q + d * clamp(dep, z, max(z, ${f(G.bossProud)}))) - ${f(G.bossMouthOut)}, w));
  return max(far - tptEdge(length(q + d * z) - ${f(G.bossOut)}, w), 0.0);
}
// EACH HAND IN ITS OWN PLANE: the ray toward the sun meets the minute hand's plane ${f(G.minute.z)} and the hour hand's ${f(G.hour.z)}
// (dial metres) before it meets the glass, so on the dial each hand, with its collar, is read at the glass's point
// q moved by that depth times d, d = (the sun's direction across the dial) / (its direction through it). So a
// hand's shadow lies that much FURTHER from the dial's foot than its figure in the glass's plane would (on a
// level floor by the hand's own depth, 2.4 m and 1.3 m), and higher on the dial. A hand shades only a place whose
// ray toward the sun meets the hand's plane: a place that stands between that plane and the glass (dep less than
// the hand's depth) is not shaded by it; the change is taken by the same footprint as the rest.
float tptDialLight(vec3 wp, float fp){
  float dn = min(dot(uTptSun, uTptN), -1e-4);                  // the sun stands behind the dial
  float t = dot(uTptC - wp, uTptN) / dn;                       // metres along the ray to the dial's plane
  if (t <= 0.0) return 1.0;                                    // the place is not on the read side
  vec3 Q = wp + uTptSun * t - uTptC;
  vec3 X = cross(vec3(0.0, 1.0, 0.0), uTptN); X /= max(length(X), 1e-4);   // three o'clock, as the dial is read
  vec3 Y = cross(uTptN, X);
  float k = 38.0 / max(uTptR, 1e-3);
  vec2 q = vec2(dot(Q, X), dot(Q, Y)) * k, d = vec2(dot(uTptSun, X), dot(uTptSun, Y)) / dn;
  float w = max((fp + uTptPen * t) * k, 1e-4), dep = -t * dn * k;      // dep: the place's own depth before the glass, dial metres
  return tptDialGlass(q, d, dep, w) * (1.0 - tptGreatMinute(q + d * ${f(G.minute.z)}, uTptHands.x, w) * tptEdge(${f(G.minute.z)} - dep, w))
    * (1.0 - tptGreatHour(q + d * ${f(G.hour.z)}, uTptHands.y, w) * tptEdge(${f(G.hour.z)} - dep, w));
}
`;

// ------------------------------------------------------------------------------------------------------------------
// IRONWORK WRITER: positions, flat or turned normals and a colour per vertex. Shapes are written in the xy plane of
// the dial (or of a hand) with z toward the eye. The shader turns every normal to face the eye, so winding is free.
// ------------------------------------------------------------------------------------------------------------------
function makeIron() {
  const P = [], N = [], C = [];
  const put = (p, n, c) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); };
  const w = {
    P, N, C,
    get triangles() { return P.length / 9; },
    tri(a, b, c, col) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
      put(a, n, col); put(b, n, col); put(c, n, col);
    },
    quad(a, b, c, d, col) { w.tri(a, b, c, col); w.tri(a, c, d, col); },
    // a turned ring about an axis parallel to z through (cx, cy): profile [[r, z], ...], one band between each pair of
    // points (flat across the band, round about the axis). col: a colour or a function of the band's index.
    lathe(profile, seg, col, cx = 0, cy = 0) {
      for (let j = 0; j < profile.length - 1; j++) {
        const [r0, z0] = profile[j], [r1, z1] = profile[j + 1], dr = r1 - r0, dz = z1 - z0, l = Math.hypot(dr, dz) || 1, nr = -dz / l, nz = dr / l;
        const cj = typeof col === 'function' ? col(j) : col;
        for (let i = 0; i < seg; i++) {
          const a0 = i / seg * 6.283185307, a1 = (i + 1) / seg * 6.283185307, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          const p00 = [cx + r0 * c0, cy + r0 * s0, z0], p01 = [cx + r0 * c1, cy + r0 * s1, z0], p10 = [cx + r1 * c0, cy + r1 * s0, z1], p11 = [cx + r1 * c1, cy + r1 * s1, z1];
          const n0 = [nr * c0, nr * s0, nz], n1 = [nr * c1, nr * s1, nz];
          if (r0 > 1e-6) { put(p00, n0, cj); put(p10, n0, cj); put(p01, n1, cj); }
          if (r1 > 1e-6) { put(p01, n1, cj); put(p10, n0, cj); put(p11, n1, cj); }
        }
      }
    },
    // a convex outline pts [[x, y], ...] raised from z0 to z1 with a bevel b round its front face; tf maps (x, y, z)
    // to its place. Front face, bevel and walls; no back.
    prism(pts, z0, z1, b, col, tf = (x, y, z) => [x, y, z], colTop = col) {
      const n = pts.length, top = [];
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + n - 1) % n], s = pts[(i + 1) % n];
        let e0 = [p[0] - q[0], p[1] - q[1]], e1 = [s[0] - p[0], s[1] - p[1]];
        const l0 = Math.hypot(e0[0], e0[1]) || 1, l1 = Math.hypot(e1[0], e1[1]) || 1; e0 = [e0[0] / l0, e0[1] / l0]; e1 = [e1[0] / l1, e1[1] / l1];
        const n0 = [-e0[1], e0[0]], n1 = [-e1[1], e1[0]], k = b / Math.max(0.35, 1 + n0[0] * n1[0] + n0[1] * n1[1]);
        top.push([p[0] + (n0[0] + n1[0]) * k, p[1] + (n0[1] + n1[1]) * k]);
      }
      // which way is inward? the outline may be given either way round: test with the centroid
      let cx = 0, cy = 0; for (const p of pts) { cx += p[0] / n; cy += p[1] / n; }
      const d0 = Math.hypot(pts[0][0] - cx, pts[0][1] - cy), d1 = Math.hypot(top[0][0] - cx, top[0][1] - cy);
      if (d1 > d0) for (let i = 0; i < n; i++) { top[i] = [2 * pts[i][0] - top[i][0], 2 * pts[i][1] - top[i][1]]; }
      const zb = z1 - b;
      for (let i = 1; i < n - 1; i++) w.tri(tf(top[0][0], top[0][1], z1), tf(top[i][0], top[i][1], z1), tf(top[i + 1][0], top[i + 1][1], z1), colTop);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        w.quad(tf(pts[i][0], pts[i][1], zb), tf(pts[j][0], pts[j][1], zb), tf(top[j][0], top[j][1], z1), tf(top[i][0], top[i][1], z1), col);
        w.quad(tf(pts[i][0], pts[i][1], z0), tf(pts[j][0], pts[j][1], z0), tf(pts[j][0], pts[j][1], zb), tf(pts[i][0], pts[i][1], zb), col);
      }
    },
    // a six-sided bolt head of radius r standing h from z at (x, y), turned by rot, chamfered at the top
    bolt(x, y, z, r, h, col, rot = 0, tf = (X, Y, Z) => [X, Y, Z]) {
      const ring = (rr, zz) => { const o = []; for (let i = 0; i < 6; i++) { const a = rot + i * 1.0471976; o.push(tf(x + rr * Math.cos(a), y + rr * Math.sin(a), zz)); } return o; };
      const lo = ring(r, z), mid = ring(r, z + h * 0.7), hi = ring(r * 0.72, z + h);
      for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; w.quad(lo[i], lo[j], mid[j], mid[i], col); w.quad(mid[i], mid[j], hi[j], hi[i], col); }
      for (let i = 1; i < 5; i++) w.tri(hi[0], hi[i], hi[i + 1], col);
    },
    // a square nut of half diagonal r standing 0.7 h from z at (x, y), turned by rot, its sides leaning in to 0.8 of
    // it, with the bolt's pointed end standing from its top to h: fourteen triangles, for bolts seen from far off
    nut(x, y, z, r, h, col, rot = 0, tf = (X, Y, Z) => [X, Y, Z]) {
      const ring = (rr, zz) => { const o = []; for (let i = 0; i < 4; i++) { const a = rot + i * 1.5707963; o.push(tf(x + rr * Math.cos(a), y + rr * Math.sin(a), zz)); } return o; };
      const lo = ring(r, z), hi = ring(r * 0.8, z + h * 0.7), end = ring(r * 0.42, z + h * 0.7), tip = tf(x, y, z + h);
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; w.quad(lo[i], lo[j], hi[j], hi[i], col); w.tri(end[i], end[j], tip, col); }
      w.quad(hi[0], hi[1], hi[2], hi[3], col);
    },
    // a gusset: a rib that tapers along u from half width h0 at u0 to h1 at u1, its foot at zb, its flat crest (half
    // width t0, then t1; set e in from each end) at za over u0 and zc over u1: two flanks, the crest and two ends,
    // ten triangles
    gusset(u0, u1, h0, h1, t0, t1, e, zb, za, zc, col, colTop, tf = (X, Y, Z) => [X, Y, Z]) {
      const A = tf(u0, -h0, zb), B = tf(u1, -h1, zb), C = tf(u1, h1, zb), D = tf(u0, h0, zb);
      const a = tf(u0 + e, -t0, za), b = tf(u1 - e, -t1, zc), c = tf(u1 - e, t1, zc), d = tf(u0 + e, t0, za);
      w.quad(A, B, b, a, col); w.quad(D, C, c, d, col); w.quad(a, b, c, d, colTop); w.quad(A, a, d, D, col); w.quad(B, C, c, b, col);
    },
    // a rivet: a low six-sided dome with turned normals
    rivet(x, y, z, r, h, col, tf = (X, Y, Z) => [X, Y, Z]) {
      const top = tf(x, y, z + h), nt = tf(0, 0, 1), o = tf(0, 0, 0), nz = [nt[0] - o[0], nt[1] - o[1], nt[2] - o[2]];
      for (let i = 0; i < 6; i++) {
        const a0 = i * 1.0471976, a1 = (i + 1) * 1.0471976;
        const p0 = tf(x + r * Math.cos(a0), y + r * Math.sin(a0), z), p1 = tf(x + r * Math.cos(a1), y + r * Math.sin(a1), z), c = tf(x, y, z);
        const m = (p) => { const v = [p[0] - c[0] + nz[0] * r * 0.6, p[1] - c[1] + nz[1] * r * 0.6, p[2] - c[2] + nz[2] * r * 0.6], l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
        put(p0, m(p0), col); put(p1, m(p1), col); put(top, nz, col);
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      return g;
    },
  };
  return w;
}
// place (u along the radius at deg clockwise from twelve, v across it to the right, z) in the dial's plane, centre at (0, 0)
const polar = (deg) => { const t = deg * D2R, s = Math.sin(t), c = Math.cos(t); return (u, v, z) => [u * s + v * c, u * c - v * s, z]; };

// ------------------------------------------------------------------------------------------------------------------
// THE GREAT DIAL'S SHADERS. Iron and hands share one program (the hands with a stronger sky term); the opal ring
// glows; the panes are clear with a soft sheen and, in the rain look, running water.
// ------------------------------------------------------------------------------------------------------------------
const HERO_VERT = /* glsl */`
attribute vec3 aCol;
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vO;
#include <common>
#include <fog_pars_vertex>
void main(){
  vCol = aCol; vO = position; vN = mat3(modelMatrix) * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const NOISE_GLSL = /* glsl */`
float tptHash3(vec3 p){ return fract(sin(dot(p, vec3(99.7, 287.9, 73.1))) * 46210.1010); }
float tptHash1(float x){ return fract(sin(x * 97.0113) * 45210.3581); }
// value noise: a blend, with weights that sum to one, of values spread evenly over 0..1, so its mean is one half by
// its form. Counted in single precision: the three-number hash's mean over every whole-number point to 40 either way
// is 0.4987, the one-number hash's over the whole numbers -700 to 699 is 0.4989, and the noise's over 8,000,000 places
// at random (x, y in -30..30, z in 0..20) is 0.4983.
float tptNoise3(vec3 p){
  vec3 i = floor(p), u = fract(p); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(mix(tptHash3(i), tptHash3(i + vec3(1.0, 0.0, 0.0)), u.x), mix(tptHash3(i + vec3(0.0, 1.0, 0.0)), tptHash3(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
             mix(mix(tptHash3(i + vec3(0.0, 0.0, 1.0)), tptHash3(i + vec3(1.0, 0.0, 1.0)), u.x), mix(tptHash3(i + vec3(0.0, 1.0, 1.0)), tptHash3(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}`;
const IRON_FRAG = /* glsl */`
uniform vec3 uSkyCol; uniform vec3 uGroundCol; uniform vec3 uSunCol; uniform vec3 uSunDir; uniform float uSun;
uniform float uHemiGain; uniform float uSelf; uniform float uSheen; uniform float uSunGain; uniform float uSeed; uniform float uHaze; uniform float uBore;
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vO;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  vec3 N = vN / max(length(vN), 1e-6);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  float fp = max(length(dFdx(vO)), length(dFdy(vO)));                 // the pixel's width on the iron, metres
  // paint: a breakup of period 1.6 m, 9 per cent either way about the plain colour. The noise's mean counts 0.497 to
  // 0.499 by the region, so the factor's mean is 0.9995 to 0.9998: a wide pixel's plain colour is at most 0.0005 over.
  float toMean = 1.0 - smoothstep(0.4, 1.6, fp);
  vec3 alb = vCol * (1.0 + 0.18 * (tptNoise3(vO / 1.6 + uSeed) - 0.5) * toMean);
  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5) * uHemiGain;
  // the boss's bore (the fixed iron alone, uBore 1; all that stands within 6.76 of the dial's centre): the sky's
  // light falls with depth into it, whole at the mouth (${f(G.bossProud)} before the glass) and 0.35 of it at the back (${f(G.bossBack)} behind)
  vec2 qb = vO.xy - vec2(0.0, ${f(G.R)});
  hemi *= mix(1.0, 0.35 + 0.65 * clamp((vO.z + ${f(G.bossBack)}) / ${f(G.bossProud + G.bossBack)}, 0.0, 1.0), uBore * step(dot(qb, qb), 6.76 * 6.76));
  vec3 col = alb * (hemi + uSunCol * (uSun * uSunGain * max(dot(N, uSunDir), 0.0)) + uSelf);
  float g = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  col += uSkyCol * (uSheen * g * g * g * g);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
  gl_FragColor.rgb = mix(col, gl_FragColor.rgb, uHaze);               // uHaze 1: the scene's haze whole; the hands take half
}`;
const OPAL_FRAG = /* glsl */`
uniform vec3 uOpalCol; uniform float uOpalGlow; uniform float uSun; uniform float uTime;
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vO;
#include <common>
#include <fog_pars_fragment>
void main(){
  vec2 q = vO.xy - vec2(0.0, ${f(G.R)});
  float t = clamp((length(q) - ${f(G.opalIn)}) / ${f(G.ringIn - G.opalIn)}, 0.0, 1.0);
  float band = 4.0 * t * (1.0 - t);                                   // a soft depth: the opal is brightest along its middle (mean of the band 2/3)
  // its iron frame (the rim ring outside, the minute ring inside) casts a thin shade on its two edges, 0.33 wide
  // (0.06 of the ring's width) and four tenths deep at the edge: 2.4 per cent of the ring. It is never drawn
  // narrower than the pixel; where it is drawn wider it is shallower by the same factor (and no wider than the
  // ring), so that it takes the same 2.4 per cent at every distance.
  float fp = max(length(dFdx(vO.xy)), length(dFdy(vO.xy))) / ${f(G.ringIn - G.opalIn)};
  float ew = min(max(0.06, fp), 1.0);
  float shade = 1.0 - (0.4 * 0.06 / ew) * ((1.0 - smoothstep(0.0, ew, t)) + (1.0 - smoothstep(0.0, ew, 1.0 - t)));
  float lift = 0.94 + 0.06 * clamp(q.y / ${f(G.R)}, -1.0, 1.0);       // a little more sky behind its upper half
  float milk = 0.96 + 0.04 * sin(q.x * 0.21 + 1.3 + uTime * 0.11) * sin(q.y * 0.17 + 0.4 - uTime * 0.07);   // the light behind the opal drifts, 4 per cent either way
  vec3 col = uOpalCol * (uOpalGlow * (0.50 + 0.56 * band) * shade * lift * milk * mix(0.86, 1.0, uSun));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
// The panes. Rain, in the rain look: sheets (a smooth noise of mean 0.5 sliding down) and threads. THREADS: one
// in every column of width T = 0.8 m, a line of half width 0.06 m that stays inside its column, broken along its
// length by 0.5 + 0.5 sin(..), whose mean is 0.5. Typed mean of the threads: (2 x 0.06 / 0.8) x 0.5 = 0.075.
const GLASS_FRAG = /* glsl */`
uniform vec3 uSkyCol; uniform float uTime; uniform float uRain;
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vO;
#include <common>
#include <fog_pars_fragment>
${FILTER_GLSL}
${NOISE_GLSL}
void main(){
  vec3 N = vN / max(length(vN), 1e-6);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  float g = 1.0 - abs(dot(N, V));
  vec2 q = vO.xy - vec2(0.0, ${f(G.R)});
  float fp = max(max(length(dFdx(vO.xy)), length(dFdy(vO.xy))), 1e-4);
  float sheen = 0.5 + 0.5 * sin((q.x * 0.6 + q.y) * 0.085 + 0.7 + uTime * 0.12);   // one broad soft band of sky sheen, drifting slowly across the whole dial
  float a = 0.03 + 0.05 * sheen * sheen + 0.30 * g * g * g;
  // sheets: period 4.5 m, mean 0.5
  float sheet = mix(0.5, tptNoise3(vec3(q.x * 0.22, q.y * 0.10 + uTime * 0.55, 3.7)), 1.0 - smoothstep(1.125, 4.5, fp));
  // threads: period 0.8 m, typed mean 0.075 (worked out above)
  float ci = floor(q.x / 0.8), h1 = tptHash1(ci), h2 = tptHash1(ci + 17.3), h3 = tptHash1(ci + 51.9);
  float xl = q.x - (ci + 0.5) * 0.8 - (h1 - 0.5) * 0.4 - 0.04 * sin(q.y * 1.7 + h2 * 40.0);
  float dash = 0.5 + 0.5 * sin(q.y * (0.9 + 0.6 * h2) + uTime * (2.2 + 1.5 * h3) + h1 * 6.2831853);
  float thread = mix(0.075, tptBox(xl, 0.06, fp) * dash, 1.0 - smoothstep(0.2, 0.8, fp));
  // The water lies on the glass in layers, each linear in its own pattern, so a wide pixel holds the layers' means.
  // A sheet is a film that dims what lies behind it to a deep blue-grey (0.55 of it at its thickest); a thread, over
  // both, catches the sky's light (0.9 of it, brighter than the sky behind). The sheet's shape is sharpened about its
  // mean: smoothstep(0.3, 0.7, n) is odd about 0.5, as the noise is, so its mean stays 0.5.
  float sh = smoothstep(0.30, 0.70, sheet), aS = uRain * 0.55 * sh, aT = uRain * 0.9 * thread;
  vec3 pre = uSkyCol * (0.95 * a + 0.5 * aS);                         // sheen and sheet, colour times cover
  a += aS;
  pre = pre * (1.0 - aT) + uSkyCol * (1.6 * aT);                      // the thread over both
  a += (1.0 - a) * aT;
  gl_FragColor = vec4(pre / max(a, 1e-4), clamp(a, 0.0, 1.0));
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------------------------------
// THE GREAT DIAL
// ------------------------------------------------------------------------------------------------------------------
// the three paints (green: the palette's own iron colour). Prussian and graphite are kept light enough to read as a
// colour, not as black, against the sky. The dial's own iron takes the paint as it stands here; a world may grey or
// scale it for its building's iron.
export const IRON_PAINT = { green: null, prussian: '#35609C', graphite: '#55606B' };

// the fixed ironwork: rim ring, strokes, minute ring, web, boss. Centre of the dial at (0, R, 0). A generator: it
// stops between its parts (and inside the web) so that the builder can hand the page back (the order of the random draws is unchanged).
function* writeFixedIron(w, cols, rng, detail) {
  const R = G.R, at = (deg) => { const p = polar(deg); return (u, v, z) => { const q = p(u, v, z); return [q[0], q[1] + R, q[2]]; }; };
  const { base, light, dark, bolt, black, blackLight, hub, hubDark, hubLight } = cols;
  // 1. the iron ring, 2.4 wide: inner flange, bolt channel, outer flange; its 192 bolts are square nuts (see nut)
  w.lathe([[35.6, 0.0], [35.6, 0.8], [35.9, 1.05], [36.45, 1.05], [36.6, 0.6], [37.15, 0.6], [37.3, 1.3], [37.75, 1.3], [38.0, 1.05], [38.0, -0.9], [35.6, -0.9], [35.6, 0.0]],
    120, (j) => [dark, light, base, dark, dark, base, light, base, base, dark, dark][j], 0, R);
  for (let i = 0; i < 96; i++) w.nut(36.875, 0, 0.6, 0.2, 0.24, bolt, rng() * 1.05, at(i * 3.75 + 1.875));
  for (let i = 0; i < 24; i++) {      // splice plates over the channel, one between each pair of web bars
    const tf = at(i * 15 + 7.5);
    w.prism([[35.75, -0.75], [37.9, -0.75], [37.9, 0.75], [35.75, 0.75]], 0.6, 1.52, 0.1, base, tf, light);
    for (const [u, v] of [[36.2, -0.42], [36.2, 0.42], [37.5, -0.42], [37.5, 0.42]]) w.nut(u, v, 1.52, 0.15, 0.17, bolt, rng() * 1.05, tf);
  }
  yield;
  // 2. the twelve strokes: black iron wedges on the opal ring, each with a raised rib and four rivets
  for (let k = 0; k < 12; k++) {
    const s = k % 3 === 0 ? G.quarter : G.stroke, tf = at(k * 30);
    w.prism([[s.uIn, -s.hIn], [s.uOut, -s.hOut], [s.uOut, s.hOut], [s.uIn, s.hIn]], 0.1, 0.7, 0.14, black, tf, blackLight);
    w.prism([[s.uIn + 0.5, -s.hIn * 0.42], [s.uOut - 0.5, -s.hOut * 0.5], [s.uOut - 0.5, s.hOut * 0.5], [s.uIn + 0.5, s.hIn * 0.42]], 0.7, 0.94, 0.08, black, tf, blackLight);
    for (const [u, v] of [[s.uIn + 0.26, -s.hIn * 0.6], [s.uIn + 0.26, s.hIn * 0.6], [s.uOut - 0.28, -s.hOut * 0.74], [s.uOut - 0.28, s.hOut * 0.74]]) w.rivet(u, v, 0.7, 0.09, 0.07, blackLight, tf);
  }
  yield;
  // 3. the minute ring, with sixty studs
  w.lathe([[29.5, 0.0], [29.5, 0.48], [29.62, 0.6], [29.98, 0.6], [30.1, 0.48], [30.1, 0.0]], 120, (j) => [dark, light, base, light, dark][j], 0, R);
  for (let i = 0; i < 60; i++) w.rivet(29.8, 0, 0.6, 0.13, 0.1, bolt, at(i * 6));
  yield;
  // 4. the web: 24 radial bars, each a channel (a web 0.30 wide with a flange 0.08 wide standing 0.14 proud along
  // each edge); three moulded rings with rivets along their faces; where a bar meets a ring a plate 0.68 square with
  // a bolt through it (the dial of light draws bars and rings and leaves these 72 plates out: 0.46 square metres each)
  const fl = G.barH - 0.08;
  for (let i = 0; i < G.bars; i++) {
    const tf = at(i * 15);
    w.prism([[9.45, -G.barH], [29.55, -G.barH], [29.55, G.barH], [9.45, G.barH]], -0.25, 0.2, 0.03, base, tf, dark);
    for (const sg of [-1, 1]) w.prism([[9.45, sg * fl], [29.55, sg * fl], [29.55, sg * G.barH], [9.45, sg * G.barH]], 0.2, 0.34, 0.03, base, tf, light);
  }
  yield;
  const perBay = Math.max(2, Math.round(3 * detail));
  for (const r of G.rings) {
    w.lathe([[r - G.ringH, -0.25], [r - G.ringH, 0.26], [r - 0.08, 0.34], [r + 0.08, 0.34], [r + G.ringH, 0.26], [r + G.ringH, -0.25]], 96, (j) => [dark, base, light, base, dark][j], 0, R);
    for (let i = 0; i < G.bars; i++) {
      const tf = at(i * 15);
      w.prism([[r - 0.34, -0.34], [r + 0.34, -0.34], [r + 0.34, 0.34], [r - 0.34, 0.34]], 0.3, 0.46, 0.06, base, tf, light);
      w.bolt(r, 0, 0.46, 0.15, 0.18, bolt, rng() * 1.05, tf);
      for (let k = 1; k <= perBay; k++) w.rivet(r, 0, 0.34, 0.07, 0.06, bolt, at(i * 15 + 15 * k / (perBay + 1)));
    }
    yield;
  }
  yield;
  // 5. the hub's boss ring: bore 6.6, outer 9.5, 2.6 proud; a bolt groove 0.45 deep on its face (1.1 wide at the
  // face, 0.66 at its floor), a sunk band in its bore
  w.lathe([[G.bossIn, -G.bossBack], [6.6, 0.6], [6.75, 0.75], [6.75, 1.5], [6.6, 1.65], [G.bossIn, G.bossThroat], [G.bossMouthIn, G.bossProud], [7.4, 2.6], [7.62, 2.15], [8.28, 2.15], [8.5, 2.6], [G.bossMouthOut, G.bossProud], [G.bossOut, G.bossThroat], [G.bossOut, -G.bossBack], [G.bossIn, -G.bossBack]],
    96, (j) => [hubDark, hubDark, hubDark, hubDark, hubDark, hubDark, hub, hubDark, hubDark, hubDark, hub, hubLight, hub, hubDark][j], 0, R);
  for (let i = 0; i < 24; i++) {
    const tf = at(i * 15 + 7.5), rot = rng() * 1.05;
    w.bolt(7.95, 0, 2.15, 0.33, 0.09, hubLight, rot + 0.5, tf); w.bolt(7.95, 0, 2.24, 0.27, 0.55, bolt, rot, tf);   // (washer and bolt stand from the groove's floor; the bolt's top is 0.19 before the boss's face)
  }
  const nRiv = Math.max(24, Math.round(48 * detail));
  for (let i = 0; i < nRiv; i++) { w.rivet(8.84, 0, 2.6, 0.1, 0.08, bolt, at(i * 360 / nRiv)); w.rivet(7.18, 0, 2.6, 0.085, 0.07, bolt, at((i + 0.5) * 360 / nRiv)); }
}

// a flat plate cell at height z: a convex outline (hand coordinates [u, v]) with, perhaps, one round opening.
// The opening's rim is sampled at sixteen directions and at the outline's corners, so the outline is kept whole.
function plateCell(w, poly, hole, z, col, tf) {
  const n = poly.length;
  if (!hole) { for (let i = 1; i < n - 1; i++) w.tri(tf(poly[0][0], poly[0][1], z), tf(poly[i][0], poly[i][1], z), tf(poly[i + 1][0], poly[i + 1][1], z), col); return; }
  const [hu, hv, hr] = hole, angs = [];
  for (let i = 0; i < 16; i++) angs.push(i / 16 * 6.283185307 + 0.01);
  for (const p of poly) angs.push(Math.atan2(p[1] - hv, p[0] - hu));
  angs.sort((a, b) => ((a % 6.283185307) + 6.283185307) % 6.283185307 - ((b % 6.283185307) + 6.283185307) % 6.283185307);
  const hit = (a) => {            // where the ray from the opening's centre meets the outline
    const dx = Math.cos(a), dy = Math.sin(a); let best = 1e9;
    for (let i = 0; i < n; i++) {
      const p = poly[i], q = poly[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1], den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((p[0] - hu) * ey - (p[1] - hv) * ex) / den, s = ((p[0] - hu) * dy - (p[1] - hv) * dx) / den;
      if (t > 0 && s >= -1e-6 && s <= 1 + 1e-6 && t < best) best = t;
    }
    return [hu + dx * best, hv + dy * best];
  };
  for (let i = 0; i < angs.length; i++) {
    const a0 = angs[i], a1 = angs[(i + 1) % angs.length], o0 = hit(a0), o1 = hit(a1);
    w.quad(tf(hu + hr * Math.cos(a0), hv + hr * Math.sin(a0), z), tf(o0[0], o0[1], z), tf(o1[0], o1[1], z), tf(hu + hr * Math.cos(a1), hv + hr * Math.sin(a1), z), col);
  }
}

// one great hand, written about the dial's centre and pointing to twelve (u along +y, v along +x): collar, flanged
// edges, the web plate with its round piercings, the eye, the point, and the tail with its counterpoise.
function writeGreatHand(w, h, cols, detail, seen = true) {
  const tf = (u, v, z) => [v, u, z], z0 = h.z, { verm, vermLight, vermDark } = cols;
  const plate = [verm[0] * 0.85, verm[1] * 0.85, verm[2] * 0.85];      // the web plate lies 0.3 back between its flanges: a shade deeper
  const hw = (u) => (u <= h.u0 ? h.w0 : bladeHalf(h, u));
  const cw = (u) => Math.min(0.55, Math.max(0.2, 0.28 * hw(u)));
  const uS = 10.5;
  // the collar round the boss
  w.lathe([[G.collarIn, z0 - 0.3], [G.collarIn, z0 + 0.3], [9.8, z0 + 0.36], [10.5, z0 + 0.36], [10.62, z0 + 0.24], [11.1, z0 + 0.24], [11.3, z0 + 0.1], [11.3, z0 - 0.3], [G.collarIn, z0 - 0.3]],
    72, (j) => [vermDark, vermLight, verm, vermDark, verm, vermLight, verm, vermDark][j]);
  // on the collar that is seen (the minute hand's: the hour hand's lies 0.44 behind it with the same two radii, and
  // carries none of this): twenty-four radial gussets, each 1.4 long from radius 9.78 to 11.18, a ridge 0.68 wide
  // at its foot by the boss and 0.4 at the rim, its crest 0.34 over the collar's inner band at the boss and 0.12
  // over its outer band at the rim (light on the crest, dark down the flanks); a bolt between each pair; and a row
  // of rivets on its inner band
  if (seen) {
    for (let i = 0; i < 24; i++) {
      const a = (i * 15) * D2R;
      w.gusset(9.78, 11.18, 0.34, 0.2, 0.07, 0.05, 0.06, z0 + 0.1, z0 + 0.7, z0 + 0.36, vermDark, vermLight, polar(i * 15 + 7.5));
      w.bolt(10.88 * Math.sin(a), 10.88 * Math.cos(a), z0 + 0.24, 0.23, 0.26, vermLight, a);
    }
    const nR = Math.max(24, Math.round(48 * detail));
    for (let i = 0; i < nR; i++) w.rivet(10.15, 0, z0 + 0.36, 0.08, 0.065, vermLight, polar((i + 0.5) * 360 / nR));
  }
  // a doubler plate where the blade springs from the collar, six bolts on it
  w.prism([[11.0, -(h.w0 - 0.62)], [12.0, -(hw(12.0) - 0.66)], [12.0, hw(12.0) - 0.66], [11.0, h.w0 - 0.62]], z0, z0 + 0.2, 0.06, verm, tf, vermLight);
  for (const v of [-0.55, 0, 0.55]) for (const u of [11.42, 11.78]) w.bolt(v * (h.w0 - 0.9) / 0.55, u, z0 + 0.2, 0.11, 0.14, vermLight, 0.4);
  // flanged edges: bars along both sides of the blade, meeting at the point
  const stations = [uS, ...h.prof.slice(0, -1).map((q) => q[0])];
  // A flange stops where its inner edge meets the eye's bore (the bore is open air: nothing of the hand crosses
  // it; the flange's end lies under the eye's ring). gap(sgn): how far from the eye's centre that is, down the
  // hand (-1) and up it (+1), found by stepping to the place where (u - ue)^2 + (hw - cw)^2 = Ri^2.
  const gap = (sgn) => { let g = h.Ri; for (let i = 0; i < 8; i++) { const vi = hw(h.ue + sgn * g) - cw(h.ue + sgn * g); g = vi < h.Ri ? Math.sqrt(h.Ri * h.Ri - vi * vi) : 0; } return g; };
  const gLo = gap(-1), gHi = gap(1);
  for (const s of [-1, 1]) {
    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i], b = stations[i + 1];
      const runs = a < h.ue && b > h.ue && (gLo > 0 || gHi > 0) ? [[a, h.ue - gLo], [h.ue + gHi, b]] : [[a, b]];
      for (const [p, q] of runs) w.prism([[p, s * hw(p)], [q, s * hw(q)], [q, s * (hw(q) - cw(q))], [p, s * (hw(p) - cw(p))]], z0 - 0.3, z0 + 0.3, 0.07, verm, tf, vermLight);
    }
    w.prism([[h.u2, s * h.w2], [h.tip, 0], [h.u2, s * (h.w2 - cw(h.u2))]], z0 - 0.3, z0 + 0.3, 0.07, verm, tf, vermLight);
    // rivets along the flange
    const step = 0.75 / Math.max(0.6, detail);
    for (let u = h.u0 + 0.35; u < h.u1 - 0.2; u += step) {
      if (Math.abs(u - h.ue) < h.Re + 0.1) continue;
      w.rivet(u, s * (hw(u) - cw(u) * 0.5), z0 + 0.3, 0.075, 0.06, vermLight, tf);
    }
  }
  // the web plate, in cells; it is left out under the eye, whose ring hides its two ends
  const rm = (h.Re + h.Ri) / 2, inset = 0.04;
  const spansU = [[uS, h.ue - rm], [h.ue + rm, h.tip]];
  for (const [ua, ub] of spansU) {
    const holes = h.holes.filter((o) => o.u > ua && o.u < ub), cuts = [ua];
    for (let i = 0; i < holes.length - 1; i++) cuts.push((holes[i].u + holes[i].r + holes[i + 1].u - holes[i + 1].r) / 2);
    if (holes.length && ub - (holes[holes.length - 1].u + holes[holes.length - 1].r) > 0.6) cuts.push(holes[holes.length - 1].u + holes[holes.length - 1].r + 0.3);
    cuts.push(ub);
    // a cell ends at each station of the outline, so that every cell's outline is convex
    for (const k of h.prof.slice(1, -1).map((q) => q[0])) if (k > ua + 1e-3 && k < ub - 1e-3 && !cuts.some((c) => Math.abs(c - k) < 1e-3)) cuts.push(k);
    cuts.sort((p, q) => p - q);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i], b = cuts[i + 1], us = [a];
      for (const k of [h.u0]) if (k > a + 1e-3 && k < b - 1e-3) us.push(k);
      us.push(b);
      const poly = [];
      for (const u of us) poly.push([u, -Math.max(0, hw(u) - inset)]);
      for (let j = us.length - 1; j >= 0; j--) { const v = Math.max(0, hw(us[j]) - inset); if (v > 1e-4) poly.push([us[j], v]); }
      const o = holes.find((q) => q.u > a && q.u < b);
      plateCell(w, poly, o ? [o.u, 0, o.r + 0.08] : null, z0, plate, tf);
    }
  }
  // a raised rib down the blade's middle, from clear of the piercings (or the doubler) to the waist, broken at the eye
  { const lastHole = h.holes.length ? h.holes[h.holes.length - 1].u + h.holes[h.holes.length - 1].r + 0.45 : 12.3;
    for (const [a, b] of [[lastHole, h.ue - h.Re - 0.1], [h.ue + h.Re + 0.1, h.u1 - 0.1]]) if (b - a > 0.6)
      w.prism([[a, -0.16], [b, -0.13], [b, 0.13], [a, 0.16]], z0, z0 + 0.22, 0.07, verm, tf, vermLight); }
  // a moulded lip round each piercing
  for (const o of h.holes) w.lathe([[o.r, z0 - 0.14], [o.r, z0 + 0.14], [o.r + 0.08, z0 + 0.2], [o.r + 0.17, z0 + 0.2], [o.r + 0.24, z0 + 0.02]], 16, (j) => [vermDark, vermLight, verm, verm][j], 0, o.u);
  // the eye: a heavy ring two thirds of the way out, sixteen rivets on its face
  w.lathe([[h.Ri, z0 - 0.34], [h.Ri, z0 + 0.34], [h.Ri + 0.16, z0 + 0.48], [h.Re - 0.16, z0 + 0.48], [h.Re, z0 + 0.34], [h.Re, z0 - 0.34]], 48, (j) => [vermDark, vermLight, verm, vermLight, verm][j], 0, h.ue);
  for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * 6.283185307; w.rivet(h.ue + rm * Math.cos(a), rm * Math.sin(a), z0 + 0.48, 0.09, 0.07, vermLight, tf); }
  // the tail: a short slab with a rib, and the counterpoise, a lens of iron; all of it outside radius 9.5
  w.prism([[-uS, -h.tw0], [-h.u0, -h.tw0], [-h.tailU, -h.tw1], [-h.tailU, h.tw1], [-h.u0, h.tw0], [-uS, h.tw0]], z0 - 0.22, z0 + 0.22, 0.08, verm, tf, vermDark);
  w.prism([[-uS, -0.3], [-h.tailU, -0.24], [-h.tailU, 0.24], [-uS, 0.3]], z0 + 0.22, z0 + 0.36, 0.06, verm, tf, vermLight);
  w.lathe([[0, z0 + 0.5], [h.cr * 0.5, z0 + 0.5], [h.cr - 0.28, z0 + 0.32], [h.cr, z0 + 0.14], [h.cr, z0 - 0.3]], 32, (j) => [vermLight, verm, vermLight, vermDark][j], 0, -h.cu);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283185307; w.rivet(-h.cu + h.cr * 0.74 * Math.cos(a), h.cr * 0.74 * Math.sin(a), z0 + 0.34, 0.1, 0.08, vermLight, tf); }
  w.bolt(0, -h.cu, z0 + 0.5, 0.3, 0.22, vermLight, 0.3);
}

const SUN_LOCAL = new THREE.Vector3(0.0984, 0.7071, -0.7002).normalize();   // the brief's sun (0.7002, 0.7071, 0.0984) as it stands to a dial that faces west

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const palette = opts.palette || ['#F3F0E6', '#15191C', '#2F6B62', '#C8A545', '#8FC3EA', '#D8432B', '#D9D2C0', '#1E2F5C'];
  const look = opts.look === 'rain' || opts.look === 'cloud' ? opts.look : 'sun';
  const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const paint = lin(IRON_PAINT[opts.iron] || palette[2]);
  const deep = look === 'rain' ? 0.82 : 1;                       // the ironwork's colour deepens in the rain
  const tone = 1 + (rng() - 0.5) * 0.08;                         // a small seeded shift of the paint's value
  const verm = lin(palette[5]), blk = lin(palette[1]);
  const cols = {
    base: mul(paint, deep * tone), light: mul(paint, 1.28 * deep * tone), dark: mul(paint, 0.7 * deep * tone), bolt: mul(paint, 1.45 * deep * tone),
    // the hub's boss is dark iron: its face and outer side 0.42 of the paint, its bore, bolt groove and back 0.28,
    // its outer chamfer and the washers under its bolts 0.62, so that its edges still tell its form
    hub: mul(paint, 0.42 * deep * tone), hubDark: mul(paint, 0.28 * deep * tone), hubLight: mul(paint, 0.62 * deep * tone),
    black: mul(blk, 1.0), blackLight: mul(blk, 1.9),
    verm, vermLight: [Math.min(1, verm[0] * 1.12), verm[1] * 1.05, verm[2]], vermDark: mul(verm, 0.74),
  };

  // shared uniforms of the dial's own materials
  const U = {
    uSkyCol: { value: look === 'rain' ? new THREE.Vector3(0.95, 0.98, 1.03) : new THREE.Vector3(0.78, 0.90, 1.08) },
    uGroundCol: { value: new THREE.Vector3(0.50, 0.52, 0.56) },
    uSunCol: { value: new THREE.Vector3(2.6, 2.45, 2.0) }, uSunDir: { value: SUN_LOCAL.clone() }, uSun: { value: look === 'rain' ? 0 : 1 },
    uTime: { value: 0 }, uRain: { value: look === 'rain' ? 1 : 0 },
    uOpalCol: { value: look === 'rain' ? new THREE.Vector3(0.84, 0.92, 1.0) : new THREE.Vector3(1.0, 0.955, 0.86) },
    uOpalGlow: { value: 1.3 },
    uSeed: { value: rng() * 40 },
  };
  // the dial of light's uniforms: one object, shared by reference with every material that includes DIAL_LIGHT_GLSL
  const lightUniforms = {
    uTptC: { value: new THREE.Vector3(0, G.R, 0) }, uTptN: { value: new THREE.Vector3(0, 0, 1) }, uTptR: { value: G.R },
    uTptSun: { value: SUN_LOCAL.clone() }, uTptHands: { value: new THREE.Vector2(TEN_PAST_TEN.minuteDeg * D2R, TEN_PAST_TEN.hourDeg * D2R) },
    uTptGable: { value: 0.6 }, uTptBore: { value: 1 }, uTptPen: { value: 0.0093 },   // 0.0093: the sun's disc is 0.53 degrees across
  };
  const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const ironMat = (hemi, self, sheen, sunGain, haze = 1, bore = 0) => new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uHemiGain: { value: hemi }, uSelf: { value: self }, uSheen: { value: sheen }, uSunGain: { value: sunGain }, uHaze: { value: haze }, uBore: { value: bore } },
    vertexShader: HERO_VERT, fragmentShader: IRON_FRAG, fog: true, side: THREE.DoubleSide,
  });

  const object = new THREE.Group(); object.name = 'ten-past-ten great dial';
  const info = { triangles: 0, drawCalls: 0 };
  const add = (geo, mat, parent = object) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = true; parent.add(m); info.triangles += geo.attributes.position.count / 3; info.drawCalls++; return m; };

  // the fixed ironwork
  let w = makeIron();
  for (const _ of writeFixedIron(w, cols, rng, detail)) await ctx.yield();
  await ctx.yield();
  add(w.geometry(), ironMat(0.8, 0.02, 0.20, 1.0, 1, 1));         // sky term 0.8, own light 0.02, sheen 0.20, the sun whole; the haze whole; the bore shaded
  await ctx.yield();

  // the opal chapter ring, a little proud of the glass
  w = makeIron();
  w.lathe([[G.opalIn, 0.08], [G.ringIn, 0.08]], 120, [1, 1, 1], 0, G.R);
  add(w.geometry(), new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: HERO_VERT, fragmentShader: OPAL_FRAG, fog: true, side: THREE.DoubleSide }));

  // the clear panes: one sheet behind the web, from the boss to 0.1 m under the minute ring (the sheet has 96 sides
  // and the ring 120: ended at the ring's own inner radius, the sheet's sides would leave up to 0.015 m open at the ring's foot)
  w = makeIron();
  w.lathe([[G.bossOut, 0.0], [G.minuteIn + 0.1, 0.0]], 96, [1, 1, 1], 0, G.R);
  const glass = add(w.geometry(), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U }, vertexShader: HERO_VERT, fragmentShader: GLASS_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
  }));
  glass.renderOrder = 2;
  await ctx.yield();

  // the two hands, each its own mesh turning about the dial's centre
  const handMat = ironMat(1.3, 0.10, 0.12, 1.0, 0.5);             // sky term 1.3, own light 0.10, sheen 0.12, the sun whole; half the haze
  const hands = {};
  for (const key of ['hour', 'minute']) {
    w = makeIron();
    // the hour hand, behind, is painted a deeper shade of the same vermilion (0.62 of it), so that the two are told
    // apart where they lie together: at twelve its broader blade is a dark margin either side of the minute hand
    writeGreatHand(w, G[key], key === 'hour' ? { ...cols, verm: mul(cols.verm, 0.62), vermLight: mul(cols.vermLight, 0.62), vermDark: mul(cols.vermDark, 0.62) } : cols, detail, key === 'minute');
    const pivot = new THREE.Group(); pivot.position.set(0, G.R, 0); object.add(pivot);
    add(w.geometry(), handMat, pivot);
    hands[key] = pivot;
    await ctx.yield();
  }

  // THE HANDS MOVE BY THE METRES FLOWN ALONE: this is the only place that turns them (and their shadows).
  let metres = 0;
  function setMetres(s) {
    metres = s;
    const a = handAngles(s);
    hands.minute.rotation.z = -a.minuteDeg * D2R;          // clockwise as read from +Z
    hands.hour.rotation.z = -a.hourDeg * D2R;
    lightUniforms.uTptHands.value.set((a.minuteDeg % 360) * D2R, (a.hourDeg % 360) * D2R);
    return a;
  }
  setMetres(0);

  // the dial's place in the world, for the dial of light and the sun's direction
  const _v = new THREE.Vector3();
  function syncLight() {
    object.updateWorldMatrix(true, false);
    const mw = object.matrixWorld;
    lightUniforms.uTptC.value.set(0, G.R, 0).applyMatrix4(mw);
    lightUniforms.uTptN.value.set(0, 0, 1).transformDirection(mw);
    lightUniforms.uTptR.value = G.R * _v.setFromMatrixColumn(mw, 0).length();
    if (opts.sunDir) _v.set(opts.sunDir[0] ?? opts.sunDir.x, opts.sunDir[1] ?? opts.sunDir.y, opts.sunDir[2] ?? opts.sunDir.z).normalize();
    else _v.copy(SUN_LOCAL).transformDirection(mw);
    lightUniforms.uTptSun.value.copy(_v); U.uSunDir.value.copy(_v);
  }
  syncLight();

  // opts.demo (off by default; for the part viewer and for tests only): a pale floor at y 0.03 in front of the
  // dial that shows the dial of light, and a board of small dials, every weight and every kind, in three sizes.
  if (opts.demo) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 150), new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...U, ...lightUniforms }, fog: true,
      vertexShader: /* glsl */`varying vec3 vW;
        #include <common>
        #include <fog_pars_vertex>
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`uniform vec3 uSkyCol; uniform vec3 uSunCol; uniform float uSun; varying vec3 vW;
        #include <common>
        #include <fog_pars_fragment>
        ${DIAL_LIGHT_GLSL}
        void main(){
          float fp = max(length(dFdx(vW)), length(dFdy(vW)));
          vec3 col = vec3(0.60, 0.58, 0.53) * (uSkyCol * 0.55 + uSunCol * (uSun * 0.7071 * tptDialLight(vW, fp)) * 0.45);
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.03, 75); object.add(floor); info.drawCalls++; info.triangles += 2;
    // the board's dials take the great dial's shadow through the kit's hook, as a world's dials would
    const kit = makeDialKit(ctx, { palette, sunUniforms: lightUniforms,
      sunGLSL: DIAL_LIGHT_GLSL + 'float worldSun(vec3 wp, vec3 n, float fp){ return tptDialLight(wp, fp); }' });
    const rows = [['near', 5.0, 10], ['middle', 5.0, 22], ['far', 5.0, 34], ['near', 1.2, 2.6], ['middle', 1.2, 2.6], ['far', 1.2, 2.6], ['far', 0.45, 0.4]];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    rows.forEach(([wt, rad, y], ri) => {
      const parts = wt === 'near' ? [[kit.near.geometry, kit.near.material], [kit.near.glassGeometry, kit.near.glassMaterial]] : [[kit[wt].geometry, kit[wt].material]];
      for (const [geo, mat] of parts) {
        const g = geo.clone(); g.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2, 3]), 1));
        const im = new THREE.InstancedMesh(g, mat, 4);
        for (let k = 0; k < 4; k++) {
          const x = rad > 2 ? (k - 1.5) * 12 : -52 + ri * 4 + k * 3.2 * (rad > 1 ? 1 : 0.5);
          im.setMatrixAt(k, m4.compose(p3.set(x, y, rad > 2 ? 48 : 60), q.identity(), s3.set(rad, rad, rad)));
        }
        object.add(im); info.drawCalls++;
      }
    });
  }

  const anchors = {
    dialCenter: new THREE.Vector3(0, G.R, 0),
    portalSeat: { position: new THREE.Vector3(0, G.R, 2), normal: new THREE.Vector3(0, 0, 1), radius: 6 },
    flyThrough: [[0, G.R, 140], [0, G.R, 100], [0, G.R, 66], [0, G.R, 30], [0, G.R, 12], [0, G.R, 2]].map((p) => new THREE.Vector3(...p)),
    viewpoints: [[-40, 30, 150], [10, 34, 96], [0, G.R, 66], [0, G.R, 24]].map((p) => new THREE.Vector3(...p)),
    // where the dial of light's centre falls for the default sun on a floor fy below the dial's centre (the world's
    // floor is 44 below: 43.6 in front of the glass and 6.1 toward nine o'clock)
    lightCenterAt: (fy = 44) => new THREE.Vector3(0, G.R, 0).addScaledVector(SUN_LOCAL, -fy / SUN_LOCAL.y),
    lightCenter: new THREE.Vector3(0, G.R, 0).addScaledVector(SUN_LOCAL, -44 / SUN_LOCAL.y),
    handPlanes: { hourZ: G.hour.z, minuteZ: G.minute.z }, bossMouthZ: G.bossProud, boreRadius: G.bossIn, bossOuter: G.bossOut, collarOuter: G.collarOut, rim: G.R,
  };

  return {
    object, radius: G.R, height: 2 * G.R, center: new THREE.Vector3(0, G.R, 0), anchors,
    ground: true, groundY: 0,
    lightUniforms, uniforms: U, info, look,
    setMetres, handAngles, syncLight,
    get metres() { return metres; },
    setSun(x) { const s = Math.min(1, Math.max(0, x)); U.uSun.value = s; },
    // update: the water's time and the dial's place. It does not move the hands.
    update(dt, time, camera) { U.uTime.value = time; syncLight(); },
    dispose() {},
  };
}
