// THE HARVEST of the digging wheel: the three vehicles that stand in the half-cut home field north of the farm, where work
// stopped (the core's HARVEST types the places; the land's file makes the stubble, the windrows and the crop's edge).
// THE WAY OUT FLIES OVER THEM: the combine is seen from in front and above, from 60 m off down to 12 m as the lens's
// line crosses over its tail (6 m and more over its highest forms), the tractor and its trailer from above and the
// south-east, 55 to 26 m off: what is built and drawn is what a lens overhead sees.
//   THE COMBINE, in the pass in hand, heading south with its header in the standing barley: 8.5 m of body, 3.4 m broad at
//     its front tyres, 3.9 m high; a header as broad as the pass, open to the sky (its back frame with a cream rail on its
//     head, the feed auger lying in the trough, the table and the knife, an end sheet at each end whose nose parts the
//     crop, a six-sided REEL over and before the knife), the feeder's neck up to the body, a glazed cab forward with a
//     tread deck over each front wheel beside it, THE GRAIN TANK OPEN with the grain it holds heaped in it, the engine's
//     hood behind it with its screen, air cleaner and exhaust, the unloading spout folded back along the body's left
//     shoulder, the straw hood falling away aft, two great front wheels and two small rear ones. Paint OURS and no
//     maker's: a weathered blue-green (the body, the cab's frame, the tank, the header), with cream side panels, cab
//     roof, spout, header rail and hubs, and a dull red reel (the tractor's red: what reads against the gold before it).
//   THE TRACTOR, on the stubble west of it, heading south too: 4.6 m long, great rear wheels under mudguards bent round
//     their tops, small front ones, a bonnet with its grilles and the weights on its nose, a cab of dark glass, an upright
//     exhaust; dull brick red, cream hubs.
//   THE GRAIN TRAILER on the tractor's drawbar: two axles, 6 m by 2.4 m, grey boarded sides with their stakes, HEAPED
//     WITH GRAIN inside them (a ridge with three low peaks, lying at the grain's own slope, its crest half a metre over
//     the sides: what was saved).
// NOBODY IS THERE: the cabs' glass is dark, nothing is lettered or numbered, there is no plate and no maker's stripe.
// THE LAWS OF THIS FILE.
//   NOTHING MOVES. No corner leaves its place; nothing is read of a seed, the clock, a still or the lens to place, show or
//     hide a thing. Every figure is typed; the one draw of chance (the small unevenness of the grain in the trailer and
//     in the tank) comes from the core's fixed generator with typed seeds. The triangle count is the same on every seed.
//   EACH STANDS TRUE ON THE LAND AND LEANS WITH IT: the land file's fieldY is asked under each vehicle's own wheels (in
//     the build, and when the list of bodies is first read; never when this file loads), a plane is laid through those
//     heights and the whole vehicle is built in that plane's frame (frame(), below).
//   NOTHING THIN: no form of its own is under 0.3 m in its lesser measure (the two exhausts are 0.31 m through across
//     their flats, the combine's stands 0.32 m over its hood and the air cleaner 0.3 m, the steps' slab is 0.31 m through,
//     the drawbar and the axles 0.3 m and more); what is thinner is a plate lying on a body (a pane, a panel, a grille,
//     a hub, the cab's roof, a mudguard bent over its tyre), a plate standing out from a body (the header's table with
//     the knife at its lip: 6.6 m by 1.35 m, 0.13 m thick at the knife to 0.22 m at the trough) or a body's own wall
//     seen at its head (the tank's rim, the trailer's sides).
//     The reel is a six-sided prism with its bars, tines and spiders DRAWN on its faces; a ladder, mirrors, wipers and
//     rails are left out.
//   DRAWN BY THE PIXEL'S FOOTPRINT, as the machine file draws its coach and pickup (its GLSL_STEEL is taken in for the
//     line's filter stLine, the noise and the steel's light stLight): panel seams, the panes' seals, grilles' slats, the
//     decks' treads, the tyres' lugs, the hubs' dish, the reel's bars and tines, the auger's flighting, the trailer's
//     boards and stakes, rust and field dust low down, chaff and straw dust on what is level, the grain's speckle. A
//     pattern finer than the footprint goes to its mean.
//   LIGHT: the core's own sun, sky and shadeOnce, weighed as the coach's paint is (stLight at one half; the grain takes
//     the core's light plain). THE SHADERS READ OF THE LENS AND OF NEIGHBOURING PIXELS only what the core's own chunks
//     take for every mesh: faceNormal (the face's normal across neighbouring pixels, turned to the eye), footprint (the
//     pixel's footprint across neighbouring pixels) and haze (the air between the lens and the place). Nothing else.
//   SHADE: exactly FOUR boxes go into the core's shadow table (the combine's body, its header, the tractor, the trailer),
//     each upright and inside its mass (see shadowBoxes).
//   THEY ARE BODIES: HARVEST_BODIES holds each as upright boxes turned about y that CONTAIN it, lean and all.
//   ONE MESH, ONE MATERIAL, ONE DRAW CALL; everything is made in buildHarvest and goes with the scene.
//
// WHAT THE OTHER FILES USE: buildHarvest(ctx, uniforms) -> { group, triangles }   (async; group: a THREE.Group holding the
//   one mesh);  HARVEST_BODIES (a list worked the first time it is read; harvestBodies() works it afresh): each
//   { name, c: [x, y, z] its middle, h: [hx, hy, hz] its half sizes, yaw: its turn about y, radians, as the core's boxes }.
import * as THREE from 'three';
import { Geo, GLASS, HARVEST, fixedRng, addShadowBox } from './the-digging-wheel.js';
import { fieldY } from './the-digging-wheel-land.js';
import { GLSL_STEEL } from './the-digging-wheel-machine.js';

// ---------- the figures (metres in each vehicle's own frame: u toward its nose, v up from the ground under it, w to its left) ----------
const KNIFE = 6.5;                                            // the knife's u before the combine's middle as the header's outlines are typed (the build moves the header to where HARVEST has the knife; the drawbar is built to where the tractor's hitch stands)
const WHEELS = {                                              // where each stands on the land: [u, w] of its tyres' feet
  combine: [[2.6, 1.35], [2.6, -1.35], [-2.9, 1.25], [-2.9, -1.25]],
  tractor: [[1.45, 0.85], [1.45, -0.85], [-1.2, 0.88], [-1.2, -0.88]],
  trailer: [[1.95, 0.95], [1.95, -0.95], [-1.95, 0.95], [-1.95, -0.95]],
};
// the paints (linear): the combine's weathered blue-green and its cream; the tractor's dull brick red; the trailer's grey
// boards; the grain; rubber, cast iron, a grille's dark, a lamp's glass
const TEAL = [0.050, 0.254, 0.231], CREAM = [0.815, 0.738, 0.546], RED = [0.323, 0.042, 0.023], BOARD = [0.254, 0.266, 0.246], GRAINC = [0.723, 0.402, 0.068];
const RUBBER = [0.035, 0.035, 0.037], IRONC = [0.072, 0.068, 0.066], GRILLE = [0.12, 0.12, 0.125], LAMP = [0.9, 0.86, 0.7], MOUTH = [0.022, 0.022, 0.024], KNIFEC = [0.42, 0.42, 0.40];
const AUGERC = [0.40, 0.40, 0.38], REELC = [0.42, 0.06, 0.03];   // the auger's worn steel; the reel's red (the tractor's, a little brighter: it is to read against the gold before it and the pale stubble behind)
const tone = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ---------- this file's materials ----------
// Every corner is marked [9, material, A, B] and carries in aux its place on its own face: (u, v) in metres from the
// face's middle and the face's half sizes (a fan's blade: its place across the blade and out from the fan's middle, and
// 1000 with the blade's reach). KIND 9 is this file's own: it STANDS (the law of motion gives every corner back unmoved
// and hands the fragment its mark and aux).
const OWN = 9, PAINT = 0, PANE = 1, TYRE = 2, RIM = 3, LOUVRE = 4, REEL = 5, BOARDS = 6, GRAIN = 7, IRON = 8, AUGER = 9;
const OWN_MOTION = /* glsl */`
  varying vec4 vOwn; varying vec3 vKind;
  vec3 movedMore(vec3 p, vec4 mark, vec4 aux){ vOwn = aux; vKind = mark.yzw; return p; }
`;
const OWN_SURFACE = GLSL_STEEL + /* glsl */`
  varying vec4 vOwn; varying vec3 vKind;
  const vec3 HV_STRAW = vec3(0.60, 0.47, 0.24), HV_HOLLOW = vec3(0.030, 0.028, 0.024);
  // WHAT THE FIELD DOES TO A FACE. A: the ground's level under the vehicle (under -50: a part that takes none of it).
  // Rust in blotches low on the walls; the field's dust thick on the skirts with a ragged upper edge and thinning above
  // it; chaff and straw dust lying on what is level (chaff: how much); grime in the face's own edge
  vec3 hvWeather(vec3 col, vec3 p0, vec3 n, float foot, float edge, float A, float chaff){
    if (A < -50.) return col;
    float h = p0.y - A, wall = 1. - smoothstep(0.5, 0.8, abs(n.y)), top = smoothstep(0.6, 0.9, n.y);
    float rag = mix(vnoise(vec3(p0.x * 1.9, p0.y * 0.6, p0.z * 1.9)), 0.5, smoothstep(0.15, 0.5, foot)), up = 0.35 + 0.6 * rag;
    float rb = mix(smoothstep(0.50, 0.76, vnoise(p0 * 2.3 + 17.)), 0.24, smoothstep(0.25, 0.8, foot));
    col = mix(col, ST_RUST * 1.5, wall * 0.7 * rb * (1. - smoothstep(0.5, 1.9, h)));
    float dust = wall * (0.60 * (1. - smoothstep(0.3 * up, up, h)) + 0.16 * (1. - smoothstep(up, up + 1.1, h)));
    col = mix(col, ST_DUST * (0.8 + 0.12 * vnoise(p0 * 2.7)), dust);
    col = mix(col, HV_STRAW, top * chaff * (0.05 + 0.5 * mix(smoothstep(0.48, 0.74, fbm(p0 * 1.3)), 0.2, smoothstep(0.4, 1.2, foot))));   // (in drifts: the paint shows between them)
    return col * (1. - 0.14 * (1. - smoothstep(0., 0.07, edge)) * (1. - smoothstep(0.03, 0.14, foot)));
  }
  // PAINT. A: the ground's level; B: into how many panels the face is parted along its longer side (0 or 1: one sheet),
  // a dark seam between each two and a latch's dot beside each seam; B under 0: the same count, and little chaff lies on
  // it (the tractor, which stood out of the combine's dust: its red is to be seen from above)
  vec3 hvPaint(vec3 base, vec3 p0, vec3 n, float foot, vec2 uv, vec2 hf, float edge, float A, float B){
    vec3 col = base * (0.93 + 0.14 * vnoise(p0 * 1.3)); float nb = abs(B);
    col *= 1. + 0.16 * (fbm(p0 * 0.55 + 3.) - 0.5) * (1. - smoothstep(1., 3., foot));       // faded by the sun in patches
    if (nb > 1.5 && hf.x < 500.) { bool lu = hf.x >= hf.y; float along = lu ? uv.x : uv.y, half1 = lu ? hf.x : hf.y, across = lu ? uv.y : uv.x;
      float S = 2. * half1 / nb, d = stOff(along + half1, S);
      col *= 1. - 0.65 * stLine(d, 0.04, foot);
      vec2 dd = vec2(abs(d) - 0.14, across); col *= 1. - 0.5 * (1. - smoothstep(0.045 - 0.5 * foot, 0.045 + 0.5 * foot, length(dd))) * (1. - smoothstep(0.03, 0.09, foot)); }
    return hvWeather(col, p0, n, foot, edge, A, B < -0.5 ? 0.4 : 1.);
  }
  // PANE: dark glass holding a little of the sky, deeper below, in a rubber seal (the machine's own law for its panes)
  vec3 hvPane(vec3 base, float foot, vec2 uv, vec2 hf, float edge){
    float up = clamp(0.5 + 0.5 * uv.y / max(hf.y, 0.01), 0., 1.);
    vec3 col = mix(base, vec3(0.075, 0.10, 0.135), 0.2 + 0.6 * up * up);
    col = mix(col, ST_DUST * 0.4, 0.2 * (1. - up));
    return mix(col, vec3(0.015), stLine(edge, 0.07, foot));
  }
  // TYRE: on its round the tread's lugs, two to a facet, raked back either way from the tread's middle; on its wall a
  // line round it; the field's dust on all of it. A: the ground's level
  vec3 hvTyre(vec3 base, vec3 p0, float foot, vec2 uv, vec2 hf, float A){
    vec3 col = base * (0.8 + 0.4 * vnoise(p0 * 4.1));
    if (hf.x < 500.) col *= 1.3 * (1. - 0.6 * stLine(stOff(uv.x + 0.55 * abs(uv.y), hf.x), 0.42 * hf.x, foot));
    else col *= 1. - 0.35 * stLine(uv.y - 0.84 * hf.y, 0.05, foot);
    return mix(col, ST_DUST * 0.5, 0.12 + 0.24 * vnoise(p0 * 2.3) + 0.25 * (1. - smoothstep(0.1, 0.9, p0.y - A)));
  }
  // RIM: a wheel's painted disc: a dark hub in its middle, the dish's ring, dust
  vec3 hvRim(vec3 base, vec3 p0, float foot, vec2 uv, vec2 hf){
    vec3 col = base * (0.9 + 0.2 * vnoise(p0 * 3.1));
    if (hf.x > 500.) { float f = 0.5 * foot;
      col = mix(col, base * 0.25, 1. - smoothstep(0.26 * hf.y - f, 0.26 * hf.y + f, uv.y));
      col *= 1. - 0.4 * stLine(uv.y - 0.68 * hf.y, 0.05 * hf.y + 0.02, foot); }
    return mix(col, ST_DUST, 0.18 + 0.2 * vnoise(p0 * 2.1));
  }
  // LOUVRE: slats A apart in a frame (the machine's own law for its grilles)
  vec3 hvLouvre(vec3 base, float foot, vec2 uv, vec2 hf, float edge, float A){
    float f = fract(uv.y / A), k = 1. - smoothstep(0.3 * A, 0.7 * A, foot);
    vec3 col = base * mix(0.62, mix(0.26, 1.02, smoothstep(0.15, 0.8, f)), k);
    return mix(base * 1.5, col, smoothstep(0.05 - 0.5 * foot, 0.05 + 0.5 * foot, edge));
  }
  // REEL: the combine's reel, drawn on a six-sided prism (its ends lie against the end sheets). On a side (u across it, v along the reel): a bar along
  // each long edge (two faces' edges make one bar at each of the six corners), tines hanging in from one bar, three
  // spiders' arms across; between them the dark that is seen through a reel. On an end: a spider (a hub, an arm to each
  // side's middle, a rim)
  vec3 hvReel(vec3 base, vec3 p0, float foot, vec2 uv, vec2 hf, float edge){
    vec3 col = base * (0.9 + 0.2 * vnoise(p0 * 2.3)); float on;
    if (hf.x < 500.) { bool lu = hf.x < hf.y; float across = lu ? uv.x : uv.y, along = lu ? uv.y : uv.x, ha = lu ? hf.x : hf.y, hl = lu ? hf.y : hf.x;
      on = stLine(ha - abs(across), 0.30, foot);                                           // the bars (each face holds half of two)
      on = max(on, stLine(stOff(along + hl, 2. * hl / 3.), 0.12, foot));                   // the spiders' arms
      float tine = stLine(stOff(along, 0.16), 0.035, foot) * step(0., across) * (1. - smoothstep(0.26, 0.30, ha - across));
      on = max(on, 0.8 * tine); }
    else on = max(max(stLine(uv.x, 0.09, foot), stLine(edge, 0.12, foot)), 1. - smoothstep(0.14 - 0.5 * foot, 0.14 + 0.5 * foot, uv.y));
    return mix(HV_HOLLOW, mix(col, ST_DUST, 0.15), on);
  }
  // BOARDS: a trailer's side: boards 0.26 m deep, one over another, a dark joint between each two; a stake standing
  // proud every metre along it, its shade beside it; a rail along the head. A: the ground's level
  vec3 hvBoards(vec3 base, vec3 p0, vec3 n, float foot, vec2 uv, vec2 hf, float edge, float A){
    float row = floor((uv.y + hf.y) / 0.26);
    vec3 col = base * (0.9 + 0.2 * vnoise(p0 * 1.7)) * (1. + 0.16 * (stHash(vec2(row, floor(hf.x * 7.))) - 0.5) * (1. - smoothstep(0.1, 0.26, foot)));
    col *= 1. - 0.55 * stLine(stOff(uv.y + hf.y, 0.26), 0.03, foot);
    float span = 2. * hf.x - 0.24, ds = stOff(uv.x + hf.x - 0.12, span / max(1., floor(span / 0.96 + 0.5)));   // (a stake 0.12 m in from either end, the others evenly between, a metre apart or nearly)
    col *= (1. + 0.30 * stLine(ds, 0.13, foot)) * (1. - 0.45 * stLine(ds - 0.10, 0.06, foot));
    col *= 1. + 0.22 * stLine(hf.y - uv.y - 0.06, 0.12, foot);
    return hvWeather(col, p0, n, foot, edge, A, 0.6);
  }
  // GRAIN: the heap's gold, speckled, a little darker where it lies steep
  vec3 hvGrain(vec3 base, vec3 p0, vec3 n, float foot){
    float sp = mix(vnoise(p0 * 23.), 0.5, smoothstep(0.02, 0.09, foot));
    return base * (0.80 + 0.22 * fbm(p0 * 1.9) + 0.16 * (sp - 0.5)) * (0.86 + 0.14 * smoothstep(0.6, 0.95, n.y));
  }
  // IRON: a chassis, an axle, a drawbar, the exhaust: cast dark, rusted in patches, the field's dust on it. A: the ground's level
  vec3 hvIron(vec3 base, vec3 p0, vec3 n, float foot, float edge, float A){
    vec3 col = base * (0.8 + 0.4 * fbm(p0 * 2.3));
    col = mix(col, ST_RUST * 0.9, mix(0.3, 0.6 * smoothstep(0.3, 0.75, vnoise(p0 * 3.7 + 11.)), 1. - smoothstep(0.1, 0.4, foot)));
    return mix(col, ST_DUST * 0.7, A < -50. ? 0.08 : 0.2 + 0.3 * (1. - smoothstep(0.2, 1.2, p0.y - A)));
  }
  // AUGER: the header's feed auger: a tube whose flighting is drawn as a helix running to the middle from either end.
  // A: which of the tube's B facets this is (the helix goes on from facet to facet)
  vec3 hvAuger(vec3 base, vec3 p0, float foot, vec2 uv, vec2 hf, float A, float B){
    vec3 col = base * (0.85 + 0.3 * vnoise(p0 * 3.3));
    float turn = (A + 0.5 + 0.5 * uv.x / hf.x) / B, d = stOff(abs(uv.y) - 0.55 * turn, 0.55);
    col *= 0.5 + 0.8 * stLine(d, 0.17, foot);
    return mix(col, ST_DUST, 0.12);
  }
  vec3 surface(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot){
    float id = floor(vKind.x + 0.5), A = vKind.y, B = vKind.z;
    vec2 uv = vOwn.xy, hf = vOwn.zw; float edge = min(hf.x - abs(uv.x), hf.y - abs(uv.y));   // metres in from the face's nearest edge
    vec3 col; float k = 0.5;                                  // (k: how much of the steel's light the face takes: a vehicle's half, as the coach's; the grain none)
    if (id < 0.5) col = hvPaint(base, p0, n, foot, uv, hf, edge, A, B);
    else if (id < 1.5) col = hvPane(base, foot, uv, hf, edge);
    else if (id < 2.5) col = hvTyre(base, p0, foot, uv, hf, A);
    else if (id < 3.5) col = hvRim(base, p0, foot, uv, hf);
    else if (id < 4.5) col = hvLouvre(base, foot, uv, hf, edge, A);
    else if (id < 5.5) col = hvReel(base, p0, foot, uv, hf, edge);
    else if (id < 6.5) col = hvBoards(base, p0, n, foot, uv, hf, edge, A);
    else if (id < 7.5) { col = hvGrain(base, p0, n, foot); k = 0.; }
    else if (id < 8.5) col = hvIron(base, p0, n, foot, edge, A);
    else col = hvAuger(base, p0, foot, uv, hf, A, B);
    return stLight(col, n, wp, k);
  }
`;

// ---------- a vehicle's frame on the land ----------
// P: its place in HARVEST ({ x, z, yaw }: its middle; it heads along (sin yaw, cos yaw) in (x, z): yaw 0 is south);
// wheels: where its tyres stand in its own frame, [u, w]. The land's height is asked under each tyre and a plane laid
// through the heights (least squares: u and w apart, as the wheels of a vehicle stand). Gives the frame: at(u, v, w) the
// place in the world of the vehicle's own (u toward its nose, v up off that plane, w to its left), y0 the ground's level
// under its middle, and its three unit axes U, N, W.
function frame(P, wheels) {
  const c = Math.cos(P.yaw), s = Math.sin(P.yaw), n = wheels.length, ys = wheels.map(([u, w]) => fieldY(P.x + w * c + u * s, P.z - w * s + u * c));
  let mu = 0, mw = 0, my = 0, suu = 0, suy = 0, sww = 0, swy = 0;
  wheels.forEach(([u, w], i) => { mu += u / n; mw += w / n; my += ys[i] / n; });
  wheels.forEach(([u, w], i) => { suu += (u - mu) * (u - mu); suy += (u - mu) * (ys[i] - my); sww += (w - mw) * (w - mw); swy += (w - mw) * (ys[i] - my); });
  const a = suy / suu, b = swy / sww, y0 = my - a * mu - b * mw;
  const U = new THREE.Vector3(s, a, c).normalize(), N = new THREE.Vector3().crossVectors(U, new THREE.Vector3(c, b, -s)).normalize(), W = new THREE.Vector3().crossVectors(N, U);
  const at = (u, v, w) => [P.x + u * U.x + v * N.x + w * W.x, y0 + u * U.y + v * N.y + w * W.y, P.z + u * U.z + v * N.z + w * W.z];
  return { at, y0, U, N, W, yaw: P.yaw, c, s };
}
// the three frames, and the two figures HARVEST gives the build: how far before the combine's middle the knife stands and
// half the header's breadth (the pass in hand); how far before the trailer's middle the tractor's hitch stands
function frames() {
  const H = HARVEST, C = frame(H.combine, WHEELS.combine), T = frame(H.tractor, WHEELS.tractor), R = frame(H.trailer, WHEELS.trailer);
  const along = (F, P, x, z) => (x - P.x) * F.s + (z - P.z) * F.c, across = (F, P, x, z) => (x - P.x) * F.c - (z - P.z) * F.s;
  const knife = along(C, H.combine, H.combine.x, H.pass.knife), half = Math.abs(across(C, H.combine, H.pass.x1, H.combine.z) - across(C, H.combine, H.pass.x0, H.combine.z)) / 2;
  const hitch = T.at(-2.3, 0.65, 0), reach = along(R, H.trailer, hitch[0], hitch[2]);
  return { C, T, R, knife, half, reach };
}
// an upright box (turned the frame's yaw about y, as the core's boxes) about the leaned box u0..u1, v0..v1, w0..w1 of a
// frame, on the same middle. hold true: the least that HOLDS it (a body); false: one that LIES IN it (a shadow box)
function upright(F, u0, u1, v0, v1, w0, w1, hold) {
  const hu = (u1 - u0) / 2, hv = (v1 - v0) / 2, hw = (w1 - w0) / 2, c = F.at((u0 + u1) / 2, (v0 + v1) / 2, (w0 + w1) / 2);
  const X = [F.c, 0, -F.s], Y = [0, 1, 0], Z = [F.s, 0, F.c], d = (A, B) => Math.abs(A.x * B[0] + A.y * B[1] + A.z * B[2]);
  if (hold) return { c, h: [X, Y, Z].map((K) => d(F.W, K) * hw + d(F.N, K) * hv + d(F.U, K) * hu), yaw: F.yaw };
  return { c, h: [(hw - d(F.W, Y) * hv - d(F.W, Z) * hu) / d(F.W, X), (hv - d(F.N, X) * hw - d(F.N, Z) * hu) / d(F.N, Y), (hu - d(F.U, X) * hw - d(F.U, Y) * hv) / d(F.U, Z)], yaw: F.yaw };
}

// ---------- THE WRIGHT: this file's builder (the machine's smith, with a vehicle's frame under it) ----------
// The core's Geo makes the corners; to each the wright gives the corner's place on its own face, written straight into
// the Geo's aux over the nought its tri has just laid there. Every place it is handed is in the CURRENT FRAME (this.at).
const QUAD_UV = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];   // a quad's six corners as its two triangles go (a, b, c, a, c, d), each as (u, v) in halves of its two sides
const UV = (a, b, c) => [a, b, c], WV = (a, b, c) => [c, b, a], UW = (a, b, c) => [a, c, b];   // a prism's outline in (u, v) pushed across w; in (w, v) pushed along u; in (u, w) pushed up v
class Wright {
  constructor(corners = 18000) { this.g = new Geo(corners); this.at = (u, v, w) => [u, v, w]; this.kind(PAINT); }
  kind(id, a = 0, b = 0) { this.g.mark = [OWN, id, a, b]; return this; }
  get triangles() { return this.g.triangles; }
  // a flat four-cornered face by its corners in the world, in order round it (u along its first edge, v along its last)
  quadW(a, b, c, d, col) {
    const hu = 0.5 * Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), hv = 0.5 * Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    let i = this.g.triangles * 12; this.g.quad(a, b, c, d, col); const L = this.g.A;
    for (let k = 0; k < 12; k += 2) { L[i++] = QUAD_UV[k] * hu; L[i++] = QUAD_UV[k + 1] * hv; L[i++] = hu; L[i++] = hv; }
  }
  // one blade of a fan about o, its edge p to q (world): each corner's place across the blade (from the line that goes
  // from o square to the edge) and out from o toward the edge
  fanW(o, p, q, col) {
    const ex = q[0] - p[0], ey = q[1] - p[1], ez = q[2] - p[2], ox = o[0] - p[0], oy = o[1] - p[1], oz = o[2] - p[2], el = Math.hypot(ex, ey, ez) || 1;
    const t = (ox * ex + oy * ey + oz * ez) / el, r = Math.hypot(oy * ez - oz * ey, oz * ex - ox * ez, ox * ey - oy * ex) / el;
    let i = this.g.triangles * 12; this.g.tri(o, p, q, col); const L = this.g.A, X = [0, -t, el - t];
    for (let k = 0; k < 3; k++) { L[i++] = X[k]; L[i++] = k ? r : 0; L[i++] = 1e3; L[i++] = r; }
  }
  quad(a, b, c, d, col) { const at = this.at; this.quadW(at(a[0], a[1], a[2]), at(b[0], b[1], b[2]), at(c[0], c[1], c[2]), at(d[0], d[1], d[2]), col); }
  fan(o, p, q, col) { const at = this.at; this.fanW(at(o[0], o[1], o[2]), at(p[0], p[1], p[2]), at(q[0], q[1], q[2]), col); }
  // a box in the frame (skip: faces left out, of F fore, A aft, L left, R right, T top, B bottom); on every wall v is up
  box(u0, u1, v0, v1, w0, w1, col, skip = '') {
    if (!skip.includes('F')) this.quad([u1, v0, w0], [u1, v0, w1], [u1, v1, w1], [u1, v1, w0], col);
    if (!skip.includes('A')) this.quad([u0, v0, w0], [u0, v0, w1], [u0, v1, w1], [u0, v1, w0], col);
    if (!skip.includes('L')) this.quad([u0, v0, w1], [u1, v0, w1], [u1, v1, w1], [u0, v1, w1], col);
    if (!skip.includes('R')) this.quad([u0, v0, w0], [u1, v0, w0], [u1, v1, w0], [u0, v1, w0], col);
    if (!skip.includes('T')) this.quad([u0, v1, w0], [u1, v1, w0], [u1, v1, w1], [u0, v1, w1], col);
    if (!skip.includes('B')) this.quad([u0, v0, w0], [u1, v0, w0], [u1, v0, w1], [u0, v0, w1], col);
  }
  // a flat outline (corners in order) pushed from lo to hi across it; map (UV, WV or UW) says how the outline lies in the frame
  prism(poly, lo, hi, map, col, capCol = col, ends = true) {
    const n = poly.length; let ca = 0, cb = 0; for (const [a, b] of poly) { ca += a / n; cb += b / n; }
    for (let i = 0; i < n; i++) {
      const [a0, b0] = poly[i], [a1, b1] = poly[(i + 1) % n];
      this.quad(map(a0, b0, lo), map(a1, b1, lo), map(a1, b1, hi), map(a0, b0, hi), col);
      if (ends) { this.fan(map(ca, cb, lo), map(a0, b0, lo), map(a1, b1, lo), capCol); this.fan(map(ca, cb, hi), map(a0, b0, hi), map(a1, b1, hi), capCol); }
    }
  }
  // a round bar from p to q in the frame (n sides); r1: its radius at q; caps: 0 none, 1 at p, 2 at q, 3 both
  cyl(p, q, r, n, col, capCol = col, r1 = r, caps = 3) {
    p = this.at(p[0], p[1], p[2]); q = this.at(q[0], q[1], q[2]);
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], len = Math.hypot(dx, dy, dz), d = [dx / len, dy / len, dz / len];
    let s = [d[2], 0, -d[0]]; const sl = Math.hypot(s[0], s[2]); s = sl < 1e-6 ? [1, 0, 0] : [s[0] / sl, 0, s[2] / sl];
    const t = [d[1] * s[2] - d[2] * s[1], d[2] * s[0] - d[0] * s[2], d[0] * s[1] - d[1] * s[0]];
    const ring = (c, rr) => { const o = new Array(n); for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2, cs = Math.cos(th) * rr, sn = Math.sin(th) * rr; o[i] = [c[0] + s[0] * cs + t[0] * sn, c[1] + s[1] * cs + t[1] * sn, c[2] + s[2] * cs + t[2] * sn]; } return o; };
    const A = ring(p, r), B = ring(q, r1);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.quadW(A[i], A[j], B[j], B[i], col); if (caps & 1) this.fanW(p, A[i], A[j], capCol); if (caps & 2) this.fanW(q, B[i], B[j], capCol); }
  }
  // a plate that stands proud of a wall: its face (four corners P in order round it) and its four edges, each going
  // `back` to the wall (0.04 m or more: no two faces fight for one depth from afar)
  plate(P, back, col) {
    this.quad(P[0], P[1], P[2], P[3], col);
    for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4]; this.quad(p, q, [q[0] + back[0], q[1] + back[1], q[2] + back[2]], [p[0] + back[0], p[1] + back[1], p[2] + back[2]], col); }
  }
  // a band of four faces between two four-cornered outlines O and I given in the same order (a rim between an outer
  // and an inner outline, or a wall between an upper and a lower one)
  band(O, I, col) { for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4; this.quad(O[j], O[j1], I[j1], I[j], col); } }
  // a sheet of nu by nw faces through the places at(i, j) (i: 0..nu, j: 0..nw), each face of the colour col(i, j)
  sheet(nu, nw, at, col) {
    const P = []; for (let i = 0; i <= nu; i++) { P.push([]); for (let j = 0; j <= nw; j++) P[i].push(at(i, j)); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nw; j++) this.quad(P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1], col(i, j));
  }
  mesh(uniforms) { return this.g.mesh(uniforms, { surface: OWN_SURFACE, motion: OWN_MOTION }); }
}
// a plate's corners on a flank (at w), given as an outline in (u, v)
const onFlank = (poly, w) => poly.map(([u, v]) => [u, v, w]);

// a wheel: its axle at (u, r) over the ground, its tyre from w0 (its inner wall) to w1 (its outer), n sides, the tread's
// shoulders rounded off; on its outer wall a painted disc of radius rim, 0.05 m proud. y: the ground's level
function wheel(S, u, r, w0, w1, n, rim, rimCol, y) {
  const sd = Math.sign(w1 - w0), sh = Math.min(0.14, 0.3 * Math.abs(w1 - w0)), rs = r - 0.7 * sh;
  S.kind(TYRE, y);
  S.cyl([u, r, w0], [u, r, w0 + sd * sh], rs, n, RUBBER, RUBBER, r, 0);
  S.cyl([u, r, w0 + sd * sh], [u, r, w1 - sd * sh], r, n, RUBBER, RUBBER, r, 0);
  S.cyl([u, r, w1 - sd * sh], [u, r, w1], r, n, RUBBER, RUBBER, rs, 2);
  S.kind(RIM); S.cyl([u, r, w1 - sd * 0.02], [u, r, w1 + sd * 0.05], rim, 12, rimCol, rimCol, 0.94 * rim, 2);
}

// a mudguard: a band bent round a wheel's top (a plate lying over the tyre), from the angle a0 to a1 about the axle at
// (u, v), its outer face at the radius r1, its edges r1 - r0 deep, from w0 to w1; n faces round it
function fender(S, u, v, r0, r1, w0, w1, a0, a1, n, col) {
  const P = (r, a, w) => [u + r * Math.cos(a), v + r * Math.sin(a), w];
  for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n;
    S.quad(P(r1, a, w0), P(r1, b, w0), P(r1, b, w1), P(r1, a, w1), col);
    for (const w of [w0, w1]) S.quad(P(r0, a, w), P(r0, b, w), P(r1, b, w), P(r1, a, w), col); }
  for (const a of [a0, a1]) S.quad(P(r0, a, w0), P(r1, a, w0), P(r1, a, w1), P(r0, a, w1), col);
}

// THE COMBINE. F: its frame; knife: how far before its middle the knife stands; half: half its header's breadth
function buildCombine(S, F, knife, half) {
  const y = F.y0, k = knife - KNIFE, T2 = tone(TEAL, 0.78), rng = fixedRng(20261013); S.at = F.at;
  // its underframe between the wheels; the block under the cab
  S.kind(IRON, y); S.box(-3.6, 3.7, 0.5, 1.35, -1.0, 1.0, tone(IRONC, 1.5), 'T');
  S.box(-3.1, -2.7, 0.42, 0.78, -1.03, 1.03, IRONC);                                               // the rear axle
  S.kind(PAINT, y); S.box(1.6, 3.7, 1.35, 2.05, -0.95, 0.95, T2, 'BT');
  S.box(-4.2, -3.6, 0.85, 1.52, -1.2, 1.2, T2);                                                    // the straw chopper, hung under the hood's mouth
  // its body: one section from flank to flank: the threshing house, the straw hood falling away aft
  S.prism([[-3.7, 1.3], [1.6, 1.3], [1.6, 3.0], [-3.0, 3.0], [-4.25, 2.3], [-4.25, 1.75]], -1.6, 1.6, UV, TEAL);
  for (const sd of [-1, 1]) { const w = sd * 1.64, back = [0, 0, -sd * 0.04];
    S.kind(PAINT, y, 3); S.plate(onFlank([[-2.3, 1.5], [1.35, 1.5], [1.35, 2.72], [-2.3, 2.72]], w), back, CREAM);          // the cream side panels: three doors a side
    S.kind(LOUVRE, 0.12); S.plate(onFlank([[-3.65, 1.72], [-2.5, 1.72], [-2.5, 2.5], [-3.65, 2.5]], w), back, GRILLE); }    // the engine's screens
  S.kind(PAINT, -99); S.plate([[-4.29, 1.8, -1.25], [-4.29, 1.8, 1.25], [-4.29, 2.3, 1.25], [-4.29, 2.3, -1.25]], [0.04, 0, 0], MOUTH);   // the straw hood's mouth
  // the cab: its windscreen leaning out over the header, a cream roof that oversails it; dark glass between pillars of the body's paint
  const rk = (v) => 3.45 + (v - 2.05) * 0.35 / 1.5;                                                // the windscreen's u at the height v
  S.kind(PAINT, y); S.prism([[1.6, 2.05], [3.45, 2.05], [3.8, 3.55], [3.8, 3.7], [1.6, 3.7]], -1.05, 1.05, UV, TEAL);
  S.kind(PAINT, y, 2); S.box(1.5, 3.98, 3.7, 3.84, -1.15, 1.15, CREAM, 'B');
  S.kind(LOUVRE, 0.1); S.plate([[1.75, 3.9, -0.7], [2.85, 3.9, -0.7], [2.85, 3.9, 0.7], [1.75, 3.9, 0.7]], [0, -0.06, 0], tone(CREAM, 0.7));   // the cooler lying on the roof, its ribbed lid
  // a deck over each front wheel beside the cab (its mudguard; on the left the driver's way in): 0.3 m deep, its top a tread plate
  for (const sd of [-1, 1]) { const w0 = sd > 0 ? 0.95 : -1.74, w1 = sd > 0 ? 1.74 : -0.95;
    S.kind(PAINT, y); S.box(1.62, 3.6, 1.93, 2.23, w0, w1, T2, 'T');
    S.kind(LOUVRE, 0.14); S.quad([1.62, 2.23, w0], [3.6, 2.23, w0], [3.6, 2.23, w1], [1.62, 2.23, w1], tone(GRILLE, 1.5)); }
  // the steps down from the left deck before the wheel: one slanting slab 0.31 m through (0.32 m along the level), the treads drawn on its face
  S.kind(PAINT, y); S.prism([[3.6, 1.93], [3.92, 1.93], [4.32, 0.55], [4.0, 0.55]], 1.12, 1.62, UV, T2);
  S.kind(LOUVRE, 0.3); S.plate([[3.958, 1.941, 1.12], [3.958, 1.941, 1.62], [4.358, 0.561, 1.62], [4.358, 0.561, 1.12]], [-0.038, -0.011, 0], tone(GRILLE, 1.8));
  S.kind(PANE);
  S.plate([[rk(2.22) + 0.039, 2.211, -0.93], [rk(2.22) + 0.039, 2.211, 0.93], [rk(3.5) + 0.039, 3.491, 0.93], [rk(3.5) + 0.039, 3.491, -0.93]], [-0.039, 0.009, 0], GLASS);
  for (const sd of [-1, 1]) { const w = sd * 1.09, back = [0, 0, -sd * 0.04];
    S.plate(onFlank([[2.7, 2.25], [rk(2.25) - 0.1, 2.25], [rk(3.5) - 0.1, 3.5], [2.7, 3.5]], w), back, GLASS);
    S.plate(onFlank([[1.75, 2.25], [2.55, 2.25], [2.55, 3.5], [1.75, 3.5]], w), back, GLASS); }
  S.kind(PAINT, -99); for (const sd of [-1, 1]) S.plate([[4.02, 3.72, sd * 0.55], [4.02, 3.72, sd * 0.95], [4.02, 3.82, sd * 0.95], [4.02, 3.82, sd * 0.55]], [-0.04, 0, 0], LAMP);   // work lamps under the roof's brow (unlit)
  // the feeder's neck, down to the header's back
  S.kind(PAINT, y, 2); S.prism([[3.7, 0.9], [k + 4.7, 0.3], [k + 4.7, 1.3], [3.7, 2.0]], -0.75, 0.75, UV, T2);
  { const nu = k + 1.0, nl = Math.hypot(nu, 0.7), n0 = 0.04 * 0.7 / nl, n1 = 0.04 * nu / nl, NP = (t, w) => [3.7 + t * nu + n0, 2.0 - 0.7 * t + n1, w];   // the cream cover on the neck's top (two leaves)
    S.plate([NP(0.2, -0.52), NP(0.2, 0.52), NP(0.82, 0.52), NP(0.82, -0.52)], [-n0, -n1, 0], CREAM); }
  // THE HEADER, open to the sky (the lens looks down into it): its back frame half a metre deep with a cream rail on its
  // head, the trough's floor, the table falling to the knife, the feed auger lying across the trough; an end sheet at
  // each end whose nose (the divider) parts the crop and whose head carries the reel
  const hw = half - 0.3, HEAD = [[4.65, 0.2], [6.5, 0.13], [6.5, 0.26], [5.95, 0.36], [5.15, 0.4], [5.15, 1.45], [4.65, 1.45]];
  const yh = y - 0.5;                                                                              // (the header's paint takes the field's dust as if it stood half a metre higher: all of it is low down, and its colour is to hold against the pale stubble)
  const FACES = [[IRON, IRONC, y, 0], [PAINT, KNIFEC, -99, 0], [IRON, tone(IRONC, 2.6), -99, 0], [PAINT, MOUTH, -99, 0], [PAINT, TEAL, yh, 6], [PAINT, CREAM, -99, 6], [PAINT, TEAL, yh, 6]];   // its underside, the knife, the table, the trough's floor, the back sheet, the rail on its head, its back
  for (let i = 0; i < 7; i++) { const [u0, v0] = HEAD[i], [u1, v1] = HEAD[(i + 1) % 7], F = FACES[i]; S.kind(F[0], F[2], F[3]);
    S.quad([k + u0, v0, -hw], [k + u0, v0, hw], [k + u1, v1, hw], [k + u1, v1, -hw], F[1]); }
  for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4, a1 = a0 + Math.PI / 4, P = (a, w) => [k + 5.52 + 0.3 * Math.cos(a), 0.74 + 0.3 * Math.sin(a), w];   // the auger: eight facets, each told which it is
    S.kind(AUGER, i, 8); S.quad(P(a0, -hw), P(a1, -hw), P(a1, hw), P(a0, hw), AUGERC); }
  S.kind(PAINT, yh);
  for (const sd of [-1, 1]) S.prism([[4.65, 0.2], [6.5, 0.13], [7.55, 0.28], [7.05, 0.8], [6.95, 1.25], [6.95, 1.6], [6.25, 1.6], [5.15, 1.5], [4.65, 1.5]].map(([u, v]) => [k + u, v]), sd * hw, sd * half, UV, TEAL);
  // the reel, over and before the knife (the trough behind it lies open to the lens): six-sided, 1.3 m through
  S.kind(REEL); S.prism(Array.from({ length: 6 }, (_, i) => [k + 6.62 + 0.66 * Math.cos(i * Math.PI / 3), 1.36 + 0.66 * Math.sin(i * Math.PI / 3)]), -hw + 0.03, hw - 0.03, UV, REELC, REELC, false);
  // THE GRAIN TANK, OPEN: its walls flaring up from the body's top to a rim (0.13 m broad: the tank's own wall, no member
  // of its own), and the grain it holds, heaped where the elevator lets it fall
  const TB = [[-1.95, 3.0, -1.2], [1.3, 3.0, -1.2], [1.3, 3.0, 1.2], [-1.95, 3.0, 1.2]], TO = [[-2.1, 3.56, -1.4], [1.42, 3.56, -1.4], [1.42, 3.56, 1.4], [-2.1, 3.56, 1.4]];
  const TI = [[-1.97, 3.56, -1.27], [1.29, 3.56, -1.27], [1.29, 3.56, 1.27], [-1.97, 3.56, 1.27]], TG = [[-1.92, 3.38, -1.21], [1.25, 3.38, -1.21], [1.25, 3.38, 1.21], [-1.92, 3.38, 1.21]];
  S.kind(PAINT, y, 3); S.band(TB, TO, TEAL); S.kind(PAINT, -99); S.band(TO, TI, tone(TEAL, 1.5)); S.band(TI, TG, tone(TEAL, 0.5));
  S.kind(GRAIN); S.sheet(14, 10, (i, j) => { const u = -1.92 + 3.17 * i / 14, w = -1.21 + 2.42 * j / 10, r = Math.hypot((u + 0.3) / 1.5, w / 1.1);
    return [u, 3.38 + (i % 14 && j % 10 ? 0.42 * Math.pow(Math.max(0, 1 - r), 0.8) + rng.range(-0.012, 0.012) : 0), w]; }, () => tone(GRAINC, 0.95 + 0.1 * rng()));
  // the engine's hood behind the tank, its top the radiator's screen; the air cleaner and the exhaust standing on it
  S.kind(PAINT, y); S.box(-2.98, -2.18, 3.0, 3.36, -1.3, 1.1, T2, 'TB');
  S.kind(LOUVRE, 0.11); S.quad([-2.98, 3.36, -1.3], [-2.18, 3.36, -1.3], [-2.18, 3.36, 1.1], [-2.98, 3.36, 1.1], GRILLE);
  S.kind(PAINT, -99); S.cyl([-2.58, 3.36, -0.8], [-2.58, 3.66, -0.8], 0.2, 8, CREAM);
  S.kind(IRON, -99); S.cyl([-2.58, 3.36, 0.55], [-2.58, 3.68, 0.55], 0.17, 8, IRONC, MOUTH);
  // the unloading spout, folded back along the left shoulder: its turret, the tube, its down-turned mouth, the rest it lies
  // in. (It ends over the hood and the stacks stand low: as the combine leaves the picture by its foot, the last of it
  // seen is the hood's whole top, not the tips of a tube and two pipes.)
  S.kind(PAINT, y); S.cyl([1.05, 2.95, 1.52], [1.05, 3.5, 1.52], 0.27, 8, TEAL);
  S.cyl([1.05, 3.24, 1.6], [-3.45, 3.34, 1.6], 0.2, 8, CREAM);
  S.cyl([-3.45, 3.34, 1.6], [-3.75, 3.06, 1.6], 0.2, 8, CREAM, MOUTH);
  S.box(-2.6, -2.3, 2.8, 3.2, 1.42, 1.78, TEAL, 'B');
  for (const sd of [-1, 1]) { wheel(S, 2.6, 0.95, sd * 1.0, sd * 1.7, 20, 0.55, CREAM, y); wheel(S, -2.9, 0.6, sd * 1.03, sd * 1.475, 14, 0.34, CREAM, y); }
}

// THE TRACTOR. F: its frame
function buildTractor(S, F) {
  const y = F.y0, R2 = tone(RED, 1.25); S.at = F.at;
  S.kind(IRON, y); S.box(-1.9, 2.2, 0.5, 1.02, -0.38, 0.38, IRONC);                                // its engine and gearbox, one dark casting from nose to hitch
  S.box(1.3, 1.6, 0.34, 0.66, -0.68, 0.68, IRONC); S.box(-1.42, -0.98, 0.62, 1.08, -0.6, 0.6, IRONC);   // the front axle; the rear
  S.box(-2.35, -1.9, 0.45, 0.85, -0.2, 0.2, IRONC);                                                // the hitch
  S.kind(PAINT, y, -1);
  S.prism([[0.3, 1.0], [2.25, 1.0], [2.25, 1.55], [2.05, 1.7], [0.3, 1.8]], -0.48, 0.48, UV, RED);                          // the bonnet
  S.prism([[-1.95, 1.2], [0.3, 1.2], [0.3, 1.8], [0.1, 2.72], [-1.85, 2.72], [-1.95, 2.0]], -0.78, 0.78, UV, RED);          // the cab
  S.kind(PAINT, y, -2); S.box(-2.02, 0.42, 2.72, 2.9, -0.86, 0.86, R2, 'B');                       // its roof
  S.kind(PAINT, y, -1); for (const sd of [-1, 1]) fender(S, -1.2, 0.85, 0.87, 1.0, sd * 0.78, sd * 1.2, 0.3, 3.3, 8, RED);   // the mudguards, bent round the rear wheels' tops
  S.kind(IRON, y); S.box(2.25, 2.6, 0.55, 1.0, -0.42, 0.42, IRONC);                                // the weights on its nose
  S.kind(LOUVRE, 0.09); S.plate([[2.29, 1.06, -0.38], [2.29, 1.06, 0.38], [2.29, 1.38, 0.38], [2.29, 1.38, -0.38]], [-0.04, 0, 0], GRILLE);   // the nose grille
  for (const sd of [-1, 1]) S.plate(onFlank([[0.95, 1.1], [2.0, 1.1], [2.0, 1.48], [0.95, 1.48]], sd * 0.52), [0, 0, -sd * 0.04], GRILLE);    // the bonnet's side grilles
  S.plate([[1.05, 1.797, -0.3], [1.85, 1.751, -0.3], [1.85, 1.751, 0.3], [1.05, 1.797, 0.3]], [0, -0.04, 0], GRILLE);                         // the grille on the bonnet's top
  S.kind(PAINT, -99); for (const sd of [-1, 1]) S.plate([[2.29, 1.41, sd * 0.18], [2.29, 1.41, sd * 0.4], [2.29, 1.52, sd * 0.4], [2.29, 1.52, sd * 0.18]], [-0.04, 0, 0], LAMP);
  S.kind(PANE);
  const rk = (v) => 0.3 - (v - 1.8) * 0.2 / 0.92, rr = (v) => -1.95 + (v - 2.0) * 0.1 / 0.72;      // the windscreen's u at the height v; the rear pane's
  S.plate([[rk(1.86) + 0.039, 1.8685, -0.68], [rk(1.86) + 0.039, 1.8685, 0.68], [rk(2.66) + 0.039, 2.6685, 0.68], [rk(2.66) + 0.039, 2.6685, -0.68]], [-0.039, -0.0085, 0], GLASS);
  S.plate([[rr(2.06) - 0.04, 2.0655, 0.66], [rr(2.06) - 0.04, 2.0655, -0.66], [rr(2.66) - 0.04, 2.6655, -0.66], [rr(2.66) - 0.04, 2.6655, 0.66]], [0.04, -0.0055, 0], GLASS);
  for (const sd of [-1, 1]) { const w = sd * 0.82, back = [0, 0, -sd * 0.04];
    S.plate(onFlank([[-0.82, 1.4], [0.2, 1.4], [rk(2.64) - 0.08, 2.64], [-0.82, 2.64]], w), back, GLASS);                    // the door's glass
    S.plate(onFlank([[-1.84, 1.9], [-0.98, 1.9], [-0.98, 2.64], [-1.8, 2.64]], w), back, GLASS); }                           // the rear quarter's
  S.kind(IRON, -99); S.cyl([0.72, 1.7, 0.3], [0.72, 2.3, 0.3], 0.2, 8, tone(IRONC, 1.3)); S.cyl([0.72, 2.3, 0.3], [0.72, 2.98, 0.3], 0.17, 8, IRONC, MOUTH);   // the exhaust: its silencer and its pipe, 0.31 m through across its flats
  for (const sd of [-1, 1]) { wheel(S, -1.2, 0.85, sd * 0.6, sd * 1.15, 20, 0.5, CREAM, y); wheel(S, 1.45, 0.5, sd * 0.68, sd * 1.02, 14, 0.28, CREAM, y); }
}

// THE GRAIN TRAILER. F: its frame; reach: how far before its middle the tractor's hitch stands
function buildTrailer(S, F, reach) {
  const y = F.y0, rng = fixedRng(20261012); S.at = F.at;
  S.kind(IRON, y); S.box(-2.7, 2.7, 0.8, 1.15, -0.45, 0.45, IRONC);                                // its frame
  for (const u of [-1.95, 1.95]) S.box(u - 0.16, u + 0.16, 0.34, 0.66, -0.78, 0.78, IRONC);        // its two axles
  S.prism([[2.1, -0.6], [reach, -0.17], [reach, 0.17], [2.1, 0.6]], 0.48, 0.8, UW, tone(IRONC, 1.4));   // the drawbar, to the tractor's hitch
  // its boarded sides, 0.14 m through (the body's own walls): their outer faces, their heads, their inner faces down to the grain
  const RO = [[-3.0, 2.45, -1.2], [3.0, 2.45, -1.2], [3.0, 2.45, 1.2], [-3.0, 2.45, 1.2]], RI = [[-2.86, 2.45, -1.06], [2.86, 2.45, -1.06], [2.86, 2.45, 1.06], [-2.86, 2.45, 1.06]], RG = RI.map(([u, , w]) => [u, 2.2, w]);
  S.kind(BOARDS, y); S.box(-3.0, 3.0, 1.15, 2.45, -1.2, 1.2, BOARD, 'TB'); S.band(RI, RG, tone(BOARD, 0.7));
  S.kind(PAINT, y); S.quad([-3.0, 1.15, -1.2], [3.0, 1.15, -1.2], [3.0, 1.15, 1.2], [-3.0, 1.15, 1.2], tone(BOARD, 0.6)); S.band(RO, RI, tone(BOARD, 1.3));   // its floor's underside; the sides' heads
  // THE HEAP, as the spout left it: a ridge along the trailer, lying at the grain's own slope from the sides (where it
  // stands a quarter of a metre under their heads) up to a crest half a metre over them, three low peaks along the crest
  S.kind(GRAIN); S.sheet(28, 10, (i, j) => { const u = -2.86 + 5.72 * i / 28, w = -1.06 + 2.12 * j / 10, across = 1 - Math.abs(w) / 1.06, along = Math.min(1, (2.86 - Math.abs(u)) / 1.0);
    const peak = Math.max(0, ...[-1.75, 0, 1.75].map((c) => 1 - Math.abs(u - c) / 0.9));
    return [u, 2.2 + 0.74 * across * along * (0.8 + 0.2 * peak) + (i % 28 && j % 10 ? rng.range(-0.012, 0.012) : 0), w]; }, () => tone(GRAINC, 0.95 + 0.1 * rng()));
  for (const u of [-1.95, 1.95]) for (const sd of [-1, 1]) wheel(S, u, 0.5, sd * 0.775, sd * 1.125, 14, 0.27, tone(CREAM, 0.8), y);
}

// THE FOUR SHADOW BOXES: upright, each INSIDE its mass, 0.1 m and more under every sunlit face. The combine's body (its
// underframe, threshing house and cab's foot, under the tank), the tractor (its cab down to its axle) and the trailer
// (its body, under the grain, down to its axles) each as the upright box that lies in a leaned one; THE HEADER, which
// leans from end to end with the land (0.8 m where the field falls 0.11 in 1), as a level box in its back frame at its
// LOWER end (toward its upper end the box goes down through the frame's foot into the ground, where nothing is drawn
// but the header's underside, which the sun never sees).
function shadowBoxes(Q) {
  const { C, T, R, knife, half } = Q, k = knife - KNIFE, out = [upright(C, -2.6, 3.3, 0.55, 2.9, -0.9, 0.9, false)];
  const ua = k + 4.77, ub = k + 5.03, w = half - 0.45, top = Math.min(C.at(ua, 1.33, -w)[1], C.at(ua, 1.33, w)[1], C.at(ub, 1.33, -w)[1], C.at(ub, 1.33, w)[1]), bot = Math.min(C.at(ua, 0.32, -w)[1], C.at(ua, 0.32, w)[1], C.at(ub, 0.32, -w)[1], C.at(ub, 0.32, w)[1]);
  const m = C.at((ua + ub) / 2, 0.8, 0);
  out.push({ c: [m[0], (top + bot) / 2, m[2]], h: [w * Math.abs(C.W.x * C.c - C.W.z * C.s), (top - bot) / 2, (ub - ua) / 2 - 0.02], yaw: C.yaw });
  out.push(upright(T, -1.85, 0.2, 0.6, 2.62, -0.68, 0.68, false), upright(R, -2.9, 2.9, 0.5, 2.08, -1.0, 1.0, false));
  return out;
}

// THE THREE VEHICLES AS UPRIGHT BOXES THAT CONTAIN THEM (turned about y as the core's boxes; each holds its leaned box),
// for the script that proves clear air about the lens's line. harvestBodies() works the list; HARVEST_BODIES is that
// list, WORKED THE FIRST TIME IT IS READ (it asks the land for the field's level under the wheels: nothing is worked when
// this file loads). Read it as any list: for-of, length, map, an index.
export function harvestBodies() {
  const { C, T, R, knife, half, reach } = frames(), k = knife - KNIFE, B = [], box = (name, b) => B.push({ name, c: b.c, h: b.h, yaw: b.yaw });
  box('combine', upright(C, -4.32, 4.04, 0, 3.9, -1.76, 1.82, true));                              // its body, cab, tank, spout and wheels
  box('combine header', upright(C, 4.04, k + 7.57, 0, 1.96, -half, half, true));                   // the feeder's neck, the trough, the end sheets, the reel
  box('tractor', upright(T, -2.36, 2.62, 0, 3.0, -1.22, 1.22, true));
  box('trailer', upright(R, -3.0, 3.0, 0, 2.98, -1.2, 1.2, true));                                 // with its heap
  box('trailer drawbar', upright(R, 3.0, reach, 0.46, 0.82, -0.6, 0.6, true));
  return B;
}
export const HARVEST_BODIES = (() => {
  const list = []; let made = false;
  const read = () => { if (!made) { const B = harvestBodies(); for (const b of B) list.push(b); made = true; } return list; };   // (made only once the list is whole)
  return new Proxy(list, { get: (t, k, r) => Reflect.get(read(), k, r), has: (t, k) => Reflect.has(read(), k), ownKeys: () => Reflect.ownKeys(read()), getOwnPropertyDescriptor: (t, k) => Reflect.getOwnPropertyDescriptor(read(), k) });
})();

export async function buildHarvest(ctx, uniforms) {
  const Q = frames(), S = new Wright();
  buildCombine(S, Q.C, Q.knife, Q.half); await ctx.yield();
  buildTractor(S, Q.T); buildTrailer(S, Q.R, Q.reach); await ctx.yield();
  for (const b of shadowBoxes(Q)) addShadowBox(uniforms, b.c, b.h, b.yaw);                         // the harvest's four
  const group = new THREE.Group(); group.add(S.mesh(uniforms));
  return { group, triangles: S.triangles };
}
