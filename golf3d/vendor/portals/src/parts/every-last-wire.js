// every-last-wire, the look: WIREWORK. Everything in this country is wire, as a wireworker makes things: skins of mesh
// (hills, fields, crowns of trees, walls and roofs), lengths of round wire (trunks, boughs, rods, fences, the taut
// lines), and paperclips. One law of light for all of it: a low sun, the sky's light from above, the ground's from
// below, a haze with distance. No texture and no picture anywhere; every pattern is worked out where it is drawn.
//
// WHAT READS THE PIXEL'S FOOTPRINT OR THE DIRECTION OF SIGHT, each named here (section 153):
//   1. FAR MESH GOES OVER INTO ITS OWN MEAN TONE. A skin's wires are drawn by how much of a pixel they cover (the
//      pixel's footprint on the skin, by derivatives); from about a fifth of a cell to a pixel the drawn wires go over
//      into the mean of wire and gap, and beyond that the skin is that mean alone. (On the land the square and the
//      diamond fields are drawn half as wire and half as that mean at every distance, and the fine infill between a
//      field's thick wires is its mean alone: so close a weave that from the way it is never seen as a net.) The same
//      for the frame of wide mesh over the fields, the hedges (a twisted rope, lighter along its middle, brighter
//      on its flank toward the sun, with its own short shadow beside it on the field; twist, flanks and shadow go
//      into the rope's mean as well), the river's strands, the mown swathes of the pasture (a soft wave of tone,
//      three and a half parts in a hundred either way), the planks, grain, furrows and peg holes of the bare board, the far rows of
//      clips (a pale band along each row where a clip's wire is under a pixel), the bed of the heaps and the great flat clips drawn in it far off,
//      and the shivers of the pull where a pixel is wider than a part of one. The same for each field's own
//      unevenness of tone, the ridges and the unevenness of the heaps' bed (which is also darker toward the eye, where
//      a pixel is small on it), the ragged edge of the unmaking (as soft as a pixel is wide), the band along which a
//      skin's wire turns to clips ahead of its wiping away (as soft as a pixel is wide), and the fibres of the steel
//      wool (which go into their mean from .015 to .09 of their own measure to a pixel). Near the eye the wide frame
//      is not drawn. The fields' glint is fainter far off: the mean of many. The glints that run down the river's
//      strands are drawn only where a strand is wider than a pixel.
//      A paperclip on a card (the multitude) is drawn by how much of each pixel its wire covers, and its wire is never
//      drawn thinner than the pixel is wide: the gauge grows, so that a far clip is a solid stroke of steel and not a
//      faint one. Where the clip itself is only a few pixels long it goes over into its row's pale band on the board
//      (the far rows above) and is not drawn. The same for the clips of wire that stand by the way. A clip lying on
//      a heap keeps its own gauge and goes over into the heap's bed where its wire is well under a pixel wide.
//   2. A LENGTH OF WIRE IS A RIBBON TURNED TO THE EYE. A round wire looks the same from every side, so each length
//      (and each paperclip of wire) is drawn as a flat ribbon along its own curve, turned about that curve to face
//      the eye, and shaded across as the round it is. The ribbon is a little wider than the wire (three quarters of a
//      pixel to either side; the pixel's size at the ribbon is worked out from its distance to the eye and the
//      picture's own scale, at the smallest window of 360 lines) and the wire is drawn inside it by how much of each
//      pixel it covers: a wire thinner than a pixel is drawn at its share of the pixel, never as broken dots. A great
//      clip's wire (the clips standing out of the heaps) is never drawn thinner than six tenths of a pixel, the
//      chain's never thinner than 0.85 of one, so that the chain is one line from afar (a clip that is not yet there,
//      or no longer, by place or by the clock, is not held to this and leaves no dot). (A row's clip of wire has a
//      ribbon a little wider, 1.1 pixels to either side, to hold its grown gauge: 1.)
//   3. THE GLINT AND THE STEEL: the highlight on wire and mesh is by the sun, the wire's own direction and the
//      direction to the eye; bright steel shows, by that same direction, the sky above it (warm toward the sun), the
//      ground below it, and at the sky's edge the dark and bright of what stands round it (on a clip of wire also on
//      down below the sky's edge, fainter; on a clip on a card at the sky's edge only). Where a clip's wire shows its
//      round, only the narrow line of its glint is brighter than white (a length of wire, a trunk or a rod or a taut
//      line, keeps its broad highlight). A wire too thin to show its round shows the mean of what its round would:
//      for a clip (of wire as on a card) the mean of what three directions across its round show, its middle and to
//      either side, so that a far clip or chain is darker or brighter by how it is turned to the eye. A clip of wire
//      goes over into that mean as its wire grows narrow in the picture, from some seven pixels across to two (its
//      footprint across the ribbon, by derivatives), so that a narrow wire with a bright and a dark half does not
//      break into dots along a slant. A skin of mesh is thin: it is lit on the side that faces
//      the eye, its back a little darker. Where a skin's wire is turned to clips ahead of its wiping away (by place) it
//      takes the mean light of thin steel and four tenths of the skin's glint.
//   4. THE HAZE: everything goes a little toward the sky's low colour with its distance from the eye, and a shadow
//      on the ground grows fainter with it.
//   5. A cloud's edge is soft by the angle between its surface and the direction to the eye.
//   6. THE HEAPS GLITTER by the place's clock: points of light in cells of four sizes; a point is never drawn smaller
//      than the pixel, and a size of cell is left out where its points would be under a pixel or its cells over a few
//      pixels. The heaps' own unevenness (two sizes) goes into its mean far off, by the footprint.
//   7. A SHADOW'S EDGE (a clip's own shadow on a card laid on the ground) is drawn by how much of each pixel it covers;
//      a far clip's shadow is a solid stroke as its clip is and goes out with it (1). A clip's shadow darkens what lies
//      under it seven tenths of the way to the sky's light alone (it multiplies the ground's colour: brown board stays
//      brown in its shade, also where two clips' shadows cross). The long shadows of trees, houses, reels, the hub and
//      the standing clip lie over the ground as a dark veil.
//
// BY PLACE (uS, the metres of route flown): what comes undone. A length draws back along its own curve toward its
// root from the route metre written on it, over the span written on it; a skin is wiped away along the number
// written at its corners; the country's skin goes from the ground out to the radius the unmaking has reached; a
// clip of the fields is there from the route metre written on it.
// BY THE PLACE'S OWN CLOCK (uTime): glints run along the taut lines and the river; strings of clips travel down the
// drawn-off wires; the chain's clips travel up its arc (a new one grows at the hub over the first three hundredths
// of the arc); the heaps glitter; the pull runs through the fields as shivers toward the middle.
import * as THREE from 'three';

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const COL = {
  zinc: lin('#B9C2C8'), steel: lin('#E6EBEE'), copper: lin('#C06A32'), brass: lin('#D8AE45'), straw: lin('#E8D58A'),
  green: lin('#3E9A4C'), sage: lin('#86AE6E'), kale: lin('#1F6B45'), hedge: lin('#1C5233'), red: lin('#C8382E'),
  cream: lin('#F3E9D2'), board: lin('#6E4E32'), strand: lin('#9CCBEA'), bark: lin('#8A4B25'), leaf: lin('#4FAE4A'),
  white: lin('#F4F2EA'), blue: lin('#4C7FC0'), wool: lin('#F2F4F6'),
};
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return (h2(xi, yi) * (1 - u) + h2(xi + 1, yi) * u) * (1 - v) + (h2(xi, yi + 1) * (1 - u) + h2(xi + 1, yi + 1) * u) * v; };
export const KIND = { hex: 0, square: 1, rows: 2, diamond: 3, plain: 4, clips: 5, land: 10 };

const COMMON = /* glsl */`
uniform vec3 uSun, uSunC, uSkyC, uGndC, uHazeC, uHaze; uniform float uS, uTime; uniform vec4 uCloud[11]; uniform vec3 uFlock;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
// how much of a pixel w wide, its middle d from a wire's middle line, a wire of half-width r covers
float boxcov(float d, float r, float w) { return clamp((min(d + .5 * w, r) - max(d - .5 * w, -r)) / max(w, 1e-4), 0., 1.); }
// the distance to the middle line of a paperclip one long (the plain wire oval of three bends, as clipPath lays it)
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
float harc(vec2 q, float r, float up) { return q.y * up >= 0. ? abs(length(q) - r) : 1e3; }
float clipd(vec2 p) { float d = min(min(seg(p, vec2(-.14, .22), vec2(-.14, -.36)), seg(p, vec2(.14, -.36), vec2(.14, .39))), min(seg(p, vec2(-.08, .39), vec2(-.08, -.24)), seg(p, vec2(.08, -.24), vec2(.08, .2))));
  return min(d, min(harc(p - vec2(0., -.36), .14, -1.), min(harc(p - vec2(.03, .39), .11, 1.), harc(p - vec2(0., -.24), .08, -1.)))); }
vec3 hazed(vec3 col, float far) { return mix(col, uHazeC, uHaze.z * smoothstep(uHaze.x, uHaze.y, far)); }
// the shade of the steel wool on what lies under it: from the place toward the sun up to each flock's height, and how
// near the flock's middle that is (uCloud: a flock's middle x, its height, its middle z, its half-length; uFlock: its drift)
float shade(vec3 P) { float s = 0.;
  for (int i = 0; i < 11; i++) { vec2 q = P.xz + uSun.xz * (uCloud[i].y - P.y) / uSun.y - uCloud[i].xz - uFlock.xz; q.x *= 300. / uCloud[i].w;
    s = max(s, 1. - smoothstep(170., 330., length(q))); }
  return 1. - .34 * s; }
`;

// ---------------------------------------------------------------- SKINS OF MESH ----
const SKIN_V = /* glsl */`
attribute vec3 aCol; attribute vec4 aK; attribute vec3 aU; attribute vec2 aUV;
#ifdef INST
attribute vec3 iCol; attribute vec4 iK; attribute vec2 iU;
#endif
varying vec3 vCol, vN, vW, vU; varying vec4 vK; varying vec2 vUV;
void main() { vec4 w = vec4(position, 1.); vec3 n = normal;
#ifdef INST
  w = instanceMatrix * w; n = mat3(instanceMatrix) * n; vCol = iCol; vK = iK; vU = vec3(iU, aU.z);
#else
  vCol = aCol; vK = aK; vU = aU;
#endif
  w = modelMatrix * w; vN = mat3(modelMatrix) * n; vW = w.xyz; vUV = aUV; gl_Position = projectionMatrix * viewMatrix * w; }`;

const SKIN_F = /* glsl */`
uniform vec4 uC, uR; uniform vec3 uHeap[10]; uniform vec3 uZen, uMid, uHor, uBoard, uGreen, uCopper, uBrass, uStraw, uKale, uSage, uZinc, uHedge, uStrand, uSteel;
varying vec3 vCol, vN, vW, vU; varying vec4 vK; varying vec2 vUV;
${COMMON}
// the distance to the nearest edge of a tiling of hexagons one across (flat to flat)
float hexd(vec2 p) { const vec2 s = vec2(1., 1.7320508);
  vec4 c = floor(vec4(p, p - vec2(.5, 1.)) / s.xyxy) + .5, h = vec4(p - c.xy * s, p - (c.zw + .5) * s);
  vec2 q = abs(dot(h.xy, h.xy) < dot(h.zw, h.zw) ? h.xy : h.zw); return .5 - max(dot(q, s * .5), q.x); }
// one mesh of kind k, cell S, wire half-width r, at p (all in metres), the pixel w across: how much wire covers the
// pixel; c: the wire's light across its round (its middle bright, its edges dark), which goes into its own mean
// with the footprint as the wire does. The head, 1.
float across(float d, float r, float m) { float c = clamp(d / r, 0., 1.); return mix(.66 + .5 * sqrt(1. - c * c) + .5 * pow(1. - c, 4.), 1.15, m); }
float mesh(float k, vec2 p, float S, float r, float w, out float c) {
  float d, f = 4. * r / S;
  if (k < .5) d = hexd(p / S) * S;
  else if (k < 1.5) { vec2 g = (.5 - abs(fract(p / S) - .5)) * S; d = min(g.x, g.y); }
  else if (k < 2.5) { d = (.5 - abs(fract(p.x / S) - .5)) * S; f = 2. * r / S; }
  else { vec2 g = (.5 - abs(fract(vec2(p.x * .5 + p.y * .866, p.x * .5 - p.y * .866) / S) - .5)) * S; d = min(g.x, g.y); }
  float m = smoothstep(.18 * S, .6 * S, w); c = across(d, r, max(m, smoothstep(.5 * r, 2. * r, w)));
  return mix(boxcov(d, r, w), min(f, 1.), m); }
// a drift of paperclips lying flat: two layers of cells S across, in each cell one clip turned by its own angle
float clips(vec2 p, float S, float r, float w, float lo, float hi, out float c) { float d = 1e3;
  for (int l = 0; l < 2; l++) { vec2 q = rot(p, float(l) * .9) / S + float(l) * vec2(.37, .61), id = floor(q) + float(l) * 17.;
    d = min(d, clipd(rot(fract(q) - .5, hash(id) * 6.2832) / .9) * .9 * S); }
  // (lo, hi: the shares of a cell the pixel is across between which the clips go over into their mean)
  float m = smoothstep(lo * S, hi * S, w); c = across(d, r, max(m, smoothstep(.5 * r, 2. * r, w)));
  return mix(boxcov(d, r, w), min(14. * r / S, .8), m); }
float riverX(float z) { return 220. * sin(z / 900. + .5); }
vec3 skyc(vec3 d) { vec3 c = mix(uHor, uMid, smoothstep(-.02, .2, d.y)); return mix(c, uZen, smoothstep(.12, .8, d.y)); }
// the long shadow of each heap over the ground, away from the low sun (uHeap: a heap's middle x and z, its height;
// a heap stands at its angle of rest, 1.6 out for 1 up): 1 in its shadow
float heapShade(vec2 p) { vec2 d = -normalize(uSun.xz), n = vec2(-d.y, d.x); float k = length(uSun.xz) / uSun.y, sd = 0.;
  for (int i = 0; i < 10; i++) { vec2 v = p - uHeap[i].xy; float hh = uHeap[i].z, R = 1.6 * hh, a = dot(v, d), b = abs(dot(v, n));
    sd = max(sd, smoothstep(0., 10., R * 1.1 * (1. - a / (k * hh)) - b) * smoothstep(0., .4 * R, a)); }
  return sd; }
// BY THE PLACE'S CLOCK: the heaps glitter. In cells s across, about one in two holds a point that flashes now and
// then, each by its own beat; the point is never drawn smaller than the pixel, and a size of cell is left out where
// its points would be under a pixel or its cells over a few pixels (the head, 6)
float spark(vec2 p, float s, float w, float least) { vec2 q = p / s, id = floor(q); float h1 = hash(id);
  float tw = pow(.5 + .5 * sin(uTime * (1.2 + 2.2 * hash(id + 5.3)) + h1 * 6.2832), 24.);
  vec2 f = (fract(q) - .5 - .5 * (vec2(hash(id + 1.7), hash(id + 9.1)) - .5)) * s; float rr = clamp(1.1 * w, .05 * s, .22 * s);
  return tw * step(.4, hash(id + 2.9)) * (1. - smoothstep(.5 * rr, rr, length(f))) * (1. - smoothstep(.2 * s, .32 * s, w)) * mix(1., smoothstep(.02 * s, .05 * s, w), least); }
void main() {
  float kind = floor(vK.x + .5), far = length(cameraPosition - vW), c = 0., cov = 0., sh = 0.;
  vec3 N = normalize(vN) * (gl_FrontFacing ? 1. : -1.), V = (cameraPosition - vW) / far, wire = vCol, gap = vCol * .36;      // a skin is thin: it is lit on the side we see
  float prog = clamp((uS - vU.x) / max(vU.y, 1.), 0., 1.);
  if (vU.z > 1.0001 - prog) discard;                    // BY PLACE: a skin wiped away as it comes undone
  if (kind > 9.5) {
    // ---- THE LAND: fields on the valley's floor, pasture on the hills, bare zinc on the ridges; the middle unmade ----
    vec2 p = vW.xz; float w = max(length(dFdx(p)), length(dFdy(p))), h = vW.y;
    vec2 q = rot(p, .35) / 250.; q += .16 * vec2(sin(q.y * 1.9 + 1.3), sin(q.x * 1.6 + .4));
    vec2 id = floor(q), f = fract(q); float hs = hash(id), ang = floor(hash(id + 7.3) * 6.) * .5236;
    float border = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)) * 250., k, S, r;
    if (hs < .34) { k = 0.; S = 1.6; r = .15; wire = uGreen; } else if (hs < .55) { k = 2.; S = 9.; r = 1.3; wire = uCopper; }
    else if (hs < .7) { k = 2.; S = 6.5; r = .9; wire = uBrass; } else if (hs < .84) { k = 1.; S = 11.; r = .85; wire = uStraw; }
    else { k = 3.; S = 12.; r = 1.; wire = uKale; }
    // on the hills the fields are pasture: the same meshes in greens, a little of the floor's colour left in some; zinc toward the ridges
    float hl = smoothstep(55., 95., h), pg = hash(id + 3.1); vec3 pas = pg < .4 ? uSage : (pg < .75 ? uGreen : uKale);
    wire = mix(wire, mix(pas, wire, hs > .34 && hs < .84 ? .25 : 0.), hl); wire = mix(wire, uZinc, smoothstep(280., 400., h) * .35);
    // the pasture is mown in swathes 13 m wide, and no field is one flat tone (both go into their mean far off)
    float mow = k < .5 ? mix(.5 + .5 * sin(rot(p, ang).x * .2417), .5, smoothstep(4., 12., w)) : .5;
    wire *= (.965 + .07 * mow) * (.93 + .14 * mix(noise(p / 80.), .5, smoothstep(20., 60., w)));
    // BY THE PLACE'S CLOCK: THE PULL. The country's wire is being drawn in, and the pull runs through its fields as
    // shivers toward the middle, 30 m a second: where one passes, a field's wire stands up into the low sun and
    // catches it. Soft fronts some 250 m apart, bent, uneven and broken; where a pixel is wider than a part of a
    // front they go into their mean, 0.196 of a front's light, patch by patch (the head, 1)
    vec2 pm = p - uC.xy; float rm = length(pm), am = atan(pm.y, pm.x), ph = (rm + uTime * 30.) / 40. + 1.3 * sin(3. * am + rm / 600.) + .9 * sin(5. * am - rm / 330. + 2.);
    float pull = mix(pow(.5 + .5 * sin(ph), 8.), .196, smoothstep(18., 55., w)) * smoothstep(.25, .75, noise(p / 310. + 5.));
    cov = mesh(k, rot(p, ang), S, r, w, c);
    // the square and the diamond mesh are drawn half as wire and half as their own mean (wire, board shadow and frame alike)
    float grid = (k > .5 && k < 1.5) || k > 2.5 ? .5 : 0., gM = min(4. * r / S, 1.); cov = mix(cov, gM, grid); c = mix(c, 1.15, grid);
    // THE BOARD UNDER THE SKIN: on the floor the skin of mesh stands a little way over a dark board, and its shadow
    // falls on the board beside it, along the sun's way; a hill is hollow, and what shows through its skin is its dark inside
    float c2, c3; sh = mix(mesh(k, rot(p - uSun.xz * 4.4, ang), S, r, w, c2), gM, grid) * (1. - hl);
    // between the thick wires an infill of fine mesh of the same wire, so close a weave that from the way it is its own mean
    float fine = min(5.714 * r / S, 1.), catchS = cov + (1. - cov) * fine * .5; c3 = 1.15;
    fine = mix(fine, 1., mix(.4, .6, hl));                  // the infill is close (closer on the hills: pasture)
    vec3 under = uBoard * (.92 + .16 * noise(p / 60.)) * mix(1. - .6 * sh, .5, hl);
    gap = mix(under, wire * (k < .5 ? .86 : .7) * c3 * (1. - .35 * sh), fine);      // (the thick wires' shadow lies on the infill too)
    vec3 col = mix(gap, wire * c, cov);
    // and over all a frame of the same mesh four times as wide, in thick wire: what one still sees of it from far off
    // (near the eye it is not drawn: there one sees the mesh itself; on the hills it is fainter)
    float frameK = smoothstep(.5, 1.6, w) * (1. - .75 * hl) * (1. - .7 * smoothstep(2.5, 7., w));
    frameK *= k < .5 ? 0. : 1.;      // (the fine net of the pasture has no wide frame: far off it is its own mean)
    float cB, covB = mesh(k, rot(p, ang), S * 4., r * 2.8, w, cB), shB = mesh(k, rot(p - uSun.xz * 4.4, ang), S * 4., r * 2.8, w, c2), gB = min(2.8 * r / S, 1.); covB = mix(covB, gB, grid) * frameK; shB = mix(shB, gB, grid) * (1. - hl) * frameK; cB = mix(cB, 1.15, grid);
    col = mix(col * (1. - .45 * shB * (1. - cov)), wire * .9 * cB, covB * .65); catchS = max(catchS, covB);
    // the hedges along the fields' borders: a rope of dark green wire lying along each border, twisted of strands (a
    // strand comes round every 7 m), some 6 m across, lighter along its middle, brighter on its flank toward the sun and
    // darker on the other; and beside it on the field lies its own shadow, away from the sun, as long as a rope 2 m high
    // throws it (far off all of this is the rope's mean, and the rope is never thinner than the pixel is wide: the head, 1)
    float hm = smoothstep(.9, 3.2, w), hx = min(f.x, 1. - f.x), hy = min(f.y, 1. - f.y);
    // (hax: the way across this border over the ground, the fields being turned by .35; hsd: how far across, with its side; hal: how far along)
    vec2 hax = hx < hy ? vec2(.9394, -.3429) : vec2(.3429, .9394);
    float hsd = (hx < hy ? (f.x < .5 ? f.x : f.x - 1.) : (f.y < .5 ? f.y : f.y - 1.)) * 250., hal = (hx < hy ? f.y : f.x) * 250.;
    float tw = mix(.5 + .5 * sin(hal * .9 + hsd * .8), .5, smoothstep(.6, 1.8, w)), hwd = 2.5 + .7 * tw, hr = clamp(border / hwd, 0., 1.);
    float sunx = dot(hax, normalize(uSun.xz)), flank = clamp(hsd / hwd, -1., 1.) * sunx;
    float hd = mix(.9 * boxcov(border, hwd, max(w, .8)), .55 * boxcov(border, max(3., .8 * w), w), hm);
    col *= 1. - .4 * boxcov(border - hwd - 3. * abs(sunx), 3. * abs(sunx), max(w, 1.)) * step(hsd * sunx, 0.) * (1. - hm);
    col = mix(col, uHedge * mix((.75 + 1.05 * (1. - hr * hr)) * (.72 + .56 * tw) * (1. + .3 * flank), 1.5, hm), hd);
    // the river: bright strands along its course; glints run down them by the place's clock
    float rx = p.x - riverX(p.y), rw = boxcov(abs(rx), 24., w), cr;
    float rc = mesh(2., vec2(rx, 0.), 5., 1.2, w, cr), gl = pow(.5 + .5 * sin(p.y / 13. - uTime * 1.7 + hash(vec2(floor(rx / 5.), 3.)) * 6.2832), 8.) * (1. - smoothstep(4., 14., w));
    col = mix(col, mix(uStrand * .34, uStrand * cr + gl * .7, rc), rw);
    // THE MIDDLE, UNMADE (BY PLACE): out to where the unmaking stands the skin is gone; heaps of paperclips lie on the
    // board (vCol.x: how high the heap), and round the pegs the board is bare
    // (its edge is ragged: three sizes of unevenness)
    float RU = clamp(uR.x + uR.y * (uS - uR.z), uR.x, uR.w), dC = length(p - uC.xy) + (noise(p / 420.) - .5) * 70. + (noise(p / 90.) - .5) * 44. + (noise(p / 27.) - .5) * 20.;
    // (the clips' own footprint: between the pixel's short and its long reach over the ground, so that clips near the
    // eye stay clips at a low angle; the head, 1)
    float wn = min(length(dFdx(p)), length(dFdy(p))), wc = mix(wn, w, .5), front = dC - RU, made = smoothstep(-wc, wc, front);
    // (no clip is drawn flat in the skin near the eye: there the clips are real ones, standing at their own angles, and
    // the skin is the bed under them, darker toward the eye; only far off, where they are small in the picture, great
    // flat clips of 56 m to a cell are drawn in it; the head, 1)
    float ccB, ccBs, wB = mix(wn, w, .3), nearB = smoothstep(1.1, 2.4, wB), clB = clips(p + 77.7, 56., 2., wB, .1, .4, ccB) * nearB, clBs = clips(p + 77.7 - uSun.xz * 6., 56., 2., wB, .1, .4, ccBs) * nearB, tB = mix(.2, 1., smoothstep(.66, 1.5, ccB));
    float cl = 0.;
    vec2 hq = (fract(p / 24.) - .5) * 24.; float hole = boxcov(length(hq), 1.6, w) * (1. - smoothstep(4., 14., w));
    // the board is of planks 30 m wide, each its own tone, with a seam between
    float plank = (.5 - abs(fract(p.x / 30.) - .5)) * 30.;
    // (and its grain runs along the planks: streaks of two sizes, lighter and darker, no two alike; they go into their mean with the footprint)
    float grain = mix(.6 * noise(vec2(p.x * 1.1, p.y / 26.)) + .4 * noise(vec2(p.x / 3.5 + 9., p.y / 70.)), .5, smoothstep(.6, 2.5, w));
    vec3 board = uBoard * (.86 + .28 * hash(vec2(floor(p.x / 30.), 7.))) * (.95 + .1 * noise(p / 11.)) * (.86 + .28 * grain) * (1. - .16 * hole) * (1. - .4 * boxcov(plank, .4, w) * (1. - smoothstep(3., 12., w)));
    // THE FIELDS OF CLIPS, far off: where a clip is only a few pixels long the rows go over into their mean on the
    // board, a pale band along each row (the same fields, ways and sizes as the clips themselves stand in; the head, 1)
    float fa = mod(id.x * 2. + id.y * 3., 6.), fm = mod(id.x + 2. * id.y, 3.), sz = fm < .5 ? 22. : (fm < 1.5 ? 28. : 36.);
    float rowD = abs(fract(rot(p, fa * .5236).y / (1.1 * sz)) - .5) * 1.1 * sz, radM = length(p - uC.xy);
    float rows = boxcov(rowD, .2 * sz, w) * smoothstep(.2 * sz, .3 * sz, wn) * smoothstep(10., 14., border) * step(258., radM) * step(radM, 965.) * step(radM + 70., RU);
    // each field's board has its own tone, and a furrow runs midway between its rows
    float inRows = smoothstep(10., 14., border) * step(258., radM) * step(radM, 965.);
    board *= mix(1., .86 + .28 * hash(id + 11.3), inRows) * (1. - .28 * boxcov(1.1 * sz * .5 - rowD, .7, w) * (1. - smoothstep(2., 6., w)) * inRows);
    board = mix(board, vec3(.6, .63, .68), rows * .7);
    // THE SILVER: paperclips lying on paperclips: the top ones bright steel, round (dark at their edges, bright along
    // their middle), their shadow on a finer, darker lot under them, and between those the dark. It catches the low
    // sun hard, it shows a little of the sky it faces, and it glitters (the head, 6)
    // the bed: the mean of clips lying on clips, uneven (two sizes, which go into their mean far off), darker toward the eye
    float deep = mix(.3, 1., smoothstep(.3, 2., wc));
    vec3 heap = vec3(.3, .315, .34) * deep * (.86 + .28 * mix(noise(p / 2.3), .5, smoothstep(.5, 2., wc))) * (.9 + .2 * mix(noise(p / 9. + 4.), .5, smoothstep(2., 8., wc)));
    // (near the eye the bed shows its own clips, small and dim: the deeper lot; they go into their mean with the footprint)
    float cf, clf = clips(p + 5.3, 7., .26, wc, .03, .1, cf); heap *= mix(.6, 1.55, clf);
    heap = mix(heap * (1. - .6 * clBs * (1. - clB)), vec3(.88, .9, .93) * tB, clB) * (.9 + .2 * noise(p / 170.));
    // the heaps' face is never flat: it tips this way and that (two sizes of unevenness, which go into their mean far off)
    // and the clips lie in swathes, ring within ring about the middle, one for every 55 m the unmaking has gone out:
    // each a low ridge, bright toward the sun and dark away from it (they go into their mean far off)
    vec2 outw = normalize(p - uC.xy + vec2(1e-3, 0.)); float ridge = -.3 * sin(6.2832 * dC / 55.) * (1. - smoothstep(12., 30., w));
    vec3 Nt = normalize(N + vec3(outw.x, 0., outw.y) * ridge + vec3(noise(p / 17.) - .5, 0., noise(p / 17. + 37.) - .5) * .3 * (1. - smoothstep(8., 30., w)) + vec3(noise(p / 4.5 + 11.) - .5, 0., noise(p / 4.5 + 71.) - .5) * .15 * (1. - smoothstep(2., 8., w)));
    vec3 Rf = reflect(-V, Nt), env = mix(vec3(.2, .21, .24), skyc(vec3(Rf.x, max(Rf.y, 0.), Rf.z)), smoothstep(-.25, .05, Rf.y));
    float rad = length(p - uC.xy), bare = 1. - smoothstep(.004, .03, vCol.x), sunny = 1. - .85 * heapShade(p);
    float kd = clamp(dot(N, uSun) * .9 + .1, 0., 1.), spec = max(dot(reflect(-uSun, N), V), 0.), kdT = clamp(dot(Nt, uSun) * .9 + .1, 0., 1.), specT = max(dot(reflect(-uSun, Nt), V), 0.);
    vec3 lightG = (mix(uGndC, uSkyC, .5 + .5 * N.y) * .55 + uSunC * kd * sunny) * shade(vW);
    // the glint (the head, 3): the country's wire catches the low sun
    vec3 madeC = col * lightG + uSunC * wire * catchS * pow(spec, 7.) * .5 * mix(1., .15, smoothstep(.8, 3., w)) * shade(vW) * sunny;      // (far off the glint is the mean of many: fainter)
    madeC += uSunC * mix(wire, vec3(1.), .4) * pull * .18 * shade(vW) * sunny;      // the pull's shiver catches the sun
    env = mix(vec3(dot(env, vec3(.3, .5, .2))), env, .4);                // steel shows the sky's light more than its colour
    vec3 fill = mix(vec3(.2, .19, .17), vec3(.5, .62, .85), .5 + .5 * Nt.y) * .42;
    float spk = (spark(p, 6., wc, 0.) + spark(p + 13.1, 24., wc, 1.) + spark(p + 57.3, 96., wc, 1.) + spark(p + 211.7, 384., wc, 1.)) * (.3 + .7 * sunny) * .5;
    vec3 silvC = (heap * (fill + uSunC * kdT * 1.25 * sunny) + max(cl, clB) * env * .22 + uSunC * ((.3 + .7 * max(cl, clB)) * (pow(specT, 12.) * .11 + pow(specT, 80.) * .5) * sunny * deep + spk * 2.2)) * shade(vW);
    col = mix(mix(silvC, board * lightG, bare), madeC, made);
    gl_FragColor = vec4(hazed(col, far), 1.); return; }
  vec2 p = vUV; float w = max(length(dFdx(p)), length(dFdy(p)));
  if (kind < 3.5) cov = mesh(kind, rot(p, vK.w), vK.y, vK.z, w, c);
  else if (kind < 4.5) { cov = 1.; c = 1.; }
  else cov = clips(p, vK.y, vK.z, w, .1, .4, c);
  // BY PLACE: ahead of where it is being wiped away, a skin's wire is already bent into paperclips
  float fz = 1. - prog, band = min(.45, prog * 3.), tz = fwidth(vU.z) + 1e-4, turn = prog > 0. ? smoothstep(fz - band - tz, fz - band + tz, vU.z) : 0.;
  vec3 wcol = wire * c;
  if (turn > 0.) { float ct, cv = clips(p, vK.y * 1.3, vK.y * .06, w, .1, .4, ct); wcol = mix(wcol, uSteel * .85 * ct, turn); gap = mix(gap, uSteel * vec3(.13, .17, .24), turn); wire = mix(wire, uSteel, turn); cov = mix(cov, cv, turn); }
  float kd = clamp(dot(N, uSun) * .9 + .1, 0., 1.), back = gl_FrontFacing ? 1. : .6;
  vec3 light = mix(mix(uGndC, uSkyC, .5 + .5 * N.y) * .55 + uSunC * kd, vec3(.5, .54, .6) * .9 + uSunC * kd * .16, turn) * shade(vW) * back;      // (a skin's wire turned to clips is steel: one plain mean of what thin steel shows, whichever way it is turned)
  vec3 glint = uSunC * wire * pow(max(dot(reflect(-uSun, N), V), 0.), 14.) * .45 * (1. - .6 * turn) * shade(vW);      // the glint (the head, 3)
#ifdef INST
  // a crown of mesh is open: only its wire is drawn, by how much of the pixel it covers, and one sees through it
  if (cov < .01) discard;
  gl_FragColor = vec4(hazed(wcol * light + glint, far), cov);
#else
  gl_FragColor = vec4(hazed(mix(gap, wcol, cov) * light + glint * cov, far), 1.);
#endif
}`;

// ---------------------------------------------------------------- LENGTHS OF WIRE AND PAPERCLIPS ----
// a ribbon along a curve, turned to the eye (the head, 2). LENGTH: a curve of three points for each instance.
// CLIP: the path of a paperclip (position: its point; aTan: its direction), placed by each instance's matrix.
// CHAIN: the same path, placed along the chain's arc by the place's clock.
const CLIP_LEN = (() => { const q = clipPath(1); let l = 0; for (let i = 1; i < q.length; i++) l += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); return l; })();
const WIRE_V = /* glsl */`
attribute vec2 aT;
#ifdef LENGTH
attribute vec4 iA, iB, iC, iD; attribute vec3 iCol;
#else
attribute vec3 aTan;
#ifdef STREAM
attribute vec4 iA, iB, iC, iD;
#else
attribute vec4 iK;
#endif
#endif
#ifdef CHAIN
uniform vec4 uChain, uChain2; uniform vec3 uAxis; uniform float uArc[9];
#endif
uniform float uS, uTime;
varying float vX, vT, vRun, vFade, vEnd, vGa; varying vec3 vTan, vW, vCol;
void main() {
  vec3 p, dir; float r, fat = 0., sc = 1., there = 1.; vFade = 1.; vRun = 0.; vT = aT.x; vGa = 0.;      // (there: how much of a clip is there, by place or by the clock; a clip that is not there leaves no dot)
#ifdef LENGTH
  float t = aT.x * (1. - clamp((uS - iD.x) / max(iD.y, 1.), 0., 1.));      // BY PLACE: the length draws back toward its root
  p = mix(mix(iA.xyz, iB.xyz, t), mix(iB.xyz, iC.xyz, t), t); dir = mix(iB.xyz - iA.xyz, iC.xyz - iB.xyz, t); r = iA.w; vCol = iCol;
  vRun = iD.z; vT = t * iD.w + iC.w * 97.;
#else
  vec4 P = vec4(position, 1.); vec3 T = aTan;
#ifdef CHAIN
  // the chain's clip number iK.z travels up the chain by the place's clock: u its share of the way. The chain rises
  // from the hub (uAxis) in one arc, straight up at first and level at last, into the way out (uChain: how many clips,
  // clips a second, how far the arc goes along the ground, how high; uChain2: its direction along the ground, a clip's
  // length; uArc: the arc's angle at every eighth of its length, so that the clips keep their distance). Each clip is
  // turned a quarter against the next, as links hang in a chain
  r = iK.x; vCol = vec3(iK.y); fat = 1.;
  float n = uChain.x, s = mod(iK.z + uTime * uChain.y, n), u = s / n, f8 = u * 8.; int i8 = int(min(floor(f8), 7.));
  float th = mix(uArc[i8], uArc[i8 + 1], f8 - float(i8)), kn = floor(iK.z + .5);
  // (and it bows out to one side on its way, uChain2.w at the most, so that from no place it stands as one line with the standing clip)
  vec3 e = vec3(uChain2.x, 0., uChain2.y), bowS = vec3(-e.z, 0., e.x), c0 = uAxis + e * (uChain.z * (1. - cos(th))) + vec3(0., uChain.w * sin(th), 0.) + bowS * (uChain2.w * sin(2. * th) * sin(2. * th));
  vec3 tg = normalize(e * (uChain.z * sin(th)) + vec3(0., uChain.w * cos(th), 0.) + bowS * (2. * uChain2.w * sin(4. * th))), out1 = normalize(cross(vec3(0., 1., 0.), tg) + vec3(1e-5, 0., 0.)), bn = cross(tg, out1);
  float L = uChain2.z, grow = smoothstep(0., .03, u), roll = (mod(kn, 2.) < .5 ? .785 : -.785) + .2 * sin(kn * 2.4);
  vec3 ax = cos(roll) * out1 + sin(roll) * bn;
  p = c0 + (ax * P.x + tg * P.y) * L * grow; dir = ax * T.x + tg * T.y; sc = L * grow; r *= sc; vFade = 1.; there = grow;
#else
#ifdef STREAM
  // a string of clips travelling down a drawn-off wire by the place's clock, from its far end (the thing coming
  // undone) to its root (the peg). iA, iB, iC: the wire's curve (iA.w the clip's gauge, iB.w its length, iC.w how
  // many on the wire); iD: the route metres between which the string runs (BY PLACE), this clip's number, clips a second
  r = iA.w; vCol = vec3(1.);
  float n = iC.w, t = 1. - fract((iD.z + uTime * iD.w) / n), on = smoothstep(iD.x, iD.x + 30., uS) * (1. - smoothstep(iD.y, iD.y + 30., uS));
  float k = on * smoothstep(0., .05, t) * (1. - smoothstep(.95, 1., t));
  vec3 c0 = mix(mix(iA.xyz, iB.xyz, t), mix(iB.xyz, iC.xyz, t), t), tg = normalize(mix(iA.xyz - iB.xyz, iB.xyz - iC.xyz, t)), ax = normalize(cross(vec3(0., 1., 0.), tg) + vec3(1e-5, 0., 0.));
  float roll = .5 * sin(iD.z * 1.7); vec3 up = cross(tg, ax); ax = cos(roll) * ax + sin(roll) * up;
  p = c0 + (ax * P.x + tg * P.y) * iB.w * k + vec3(0., .5 * iB.w * .3, 0.); dir = ax * T.x + tg * T.y; sc = iB.w * k; r *= sc;
#else
  // a clip placed by its matrix; iK.z to iK.w: the route metres between which it is there (BY PLACE), none: always.
  // (a tone written below nought marks a great clip: it is drawn at every distance. Any other is one of a field's rows:
  // vGa, its gauge, lets the pixel be measured in clip lengths, and it goes into its row's band far off as a card does; the head, 1)
  r = iK.x; vCol = vec3(abs(iK.y)); fat = iK.y < 0. ? 1. : 0.; vGa = fat > .5 ? 0. : iK.x;
  float k = iK.w > iK.z ? smoothstep(iK.z, iK.z + 14., uS) * (1. - smoothstep(iK.w, iK.w + 14., uS)) : 1.;
  p = (modelMatrix * instanceMatrix * vec4(P.xyz * k, 1.)).xyz; dir = mat3(modelMatrix) * mat3(instanceMatrix) * T; sc = length(mat3(instanceMatrix)[1]) * k; r *= sc; there = k;
#endif
#endif
#endif
  dir = normalize(dir + vec3(1e-6, 0., 0.));
  vec3 eye = cameraPosition - p; float dist = length(eye);
  vec3 side = normalize(cross(dir, eye) + vec3(0., 1e-6, 0.));
  float pix = dist * 2. / (projectionMatrix[1][1] * 360.);
#ifdef CHAIN
  r = max(r, .85 * pix * there);      // the chain is one line from afar: its wire never thinner than a pixel (the head, 2)
#else
  r = mix(r, max(r, .6 * pix * there), fat);
#endif
  float hw = r + (vGa > 0. ? 1.1 : .75) * pix;      // the head, 2
  p += side * aT.y * hw; vX = aT.y * hw / max(r, 1e-5); vTan = dir; vW = p;
#ifdef LENGTH
  vEnd = 1e3;
#else
  vEnd = min(aT.x, 1. - aT.x) * ${CLIP_LEN.toFixed(4)} * sc / max(r, 1e-5);      // how far from the clip's cut end, in half-widths of its wire
#endif
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const WIRE_F = /* glsl */`
varying float vX, vT, vRun, vFade, vEnd, vGa; varying vec3 vTan, vW, vCol;
uniform vec3 uSteel; uniform vec4 uGate;
${COMMON}
#ifndef LENGTH
// what bright steel shows along a direction (the head, 3): the sky, warm and bright toward the sun and blue above; from
// below the board's brown and the far hills' dark under the sky's edge; and at the sky's edge what stands round it,
// dark hills and heaps and the bright gaps between (bands down an upright wire), and on down below the sky's edge, fainter
vec3 envW(vec3 Rr) { float az = dot(normalize(Rr.xz + vec2(1e-4, 0.)), normalize(uSun.xz));
  vec3 skyR = mix(vec3(.95, .8, .58), vec3(.28, .47, .78), smoothstep(0., .6, Rr.y)) * (.72 + .4 * az);
  vec3 gndR = mix(vec3(.3, .24, .19), vec3(.06, .07, .08), smoothstep(-.8, -.05, Rr.y));
  vec3 envc = mix(gndR, skyR, smoothstep(-.03, .05, Rr.y));
  float aa = atan(Rr.z, Rr.x), edge = mix(.75 * smoothstep(-.98, -.75, Rr.y), 1., smoothstep(-.22, -.02, Rr.y)) * (1. - smoothstep(.02, .3, Rr.y)), st = smoothstep(-.3, .3, sin(aa * 2. + 1.3) + .5 * sin(aa * 5. + .4));
  return mix(envc, mix(vec3(.08, .1, .1), vec3(.98, .93, .84), st), edge * .8); }
#endif
void main() {
#ifdef CHAIN
  if (dot(vW, uGate.xyz) > uGate.w) discard;      // BY PLACE: beyond the way out's own plane the chain is in the next world
#endif
  // (a row's clip of wire: never drawn thinner than the pixel is wide, and into its row's band where it is a few pixels long)
  float w = fwidth(vX), cov = boxcov(abs(vX), vGa > 0. ? max(1., .5 * w) : 1., w) * vFade * (1. - smoothstep(.2, .3, length(vec2(dFdx(vX), dFdy(vX))) * vGa));
  if (vEnd < 1.) cov *= 1. - smoothstep(1. - w, 1. + w, length(vec2(vX, 1. - vEnd)));      // a clip's wire ends round
  if (cov < .012) discard;
  vec3 col = vCol.y < -.5 ? uSteel : vCol;
#ifndef LENGTH
  col = uSteel * vCol.x;
#endif
  float far = length(cameraPosition - vW), x = clamp(vX, -1., 1.), thin = smoothstep(.7, 2.2, w);
  vec3 V = (cameraPosition - vW) / far, T = normalize(vTan), S = normalize(cross(T, V) + vec3(0., 1e-6, 0.)), F = cross(S, T);
  vec3 N = normalize(S * x + F * sqrt(1. - x * x)), H = normalize(V + uSun);
  // a round wire: by its own curve where it is some pixels wide; by its direction alone where it is thin (the mean of the round)
  float sT = sqrt(max(1. - dot(T, uSun) * dot(T, uSun), 0.)), kd = mix(clamp(dot(N, uSun) * .8 + .2, 0., 1.), .62 * sT + .1, thin);
  float sp = mix(pow(max(dot(N, H), 0.), 26.), .35 * pow(sqrt(max(1. - dot(T, H) * dot(T, H), 0.)), 26.), thin);
  vec3 lit = (col * (mix(uGndC, uSkyC, .5 + .5 * mix(N.y, 0., thin)) * .55 + uSunC * kd) + uSunC * mix(col, vec3(1.), .5) * sp * .9) * shade(vW);      // the glint (the head, 3)
  // BY THE PLACE'S CLOCK: glints run along a taut line (vRun: how fast, in metres a second)
#ifndef LENGTH
  // a paperclip is bright steel: across its round it shows the sky above and the ground below (the head, 3: envW).
  // What it shows goes over into the mean of its round as the wire grows narrow in the picture, from some seven pixels
  // across to two: a narrow wire with a bright and a dark half breaks into dots along a slant. The mean is of three
  // directions across the round (its middle and to either side), as a clip on a card has it
  { vec3 envc = envW(reflect(-V, N)); float nar = max(thin, smoothstep(.3, 1.1, w));
    if (nar > 0.) envc = mix(envc, (envW(reflect(-V, F)) + envW(reflect(-V, normalize(F * .66 + S * .75))) + envW(reflect(-V, normalize(F * .66 - S * .75)))) / 3., nar);
    lit = (col * (envc * .9 + uSunC * kd * .16) + uSunC * (sp * 1.4 + (1. - thin) * (2.2 * pow(max(dot(N, H), 0.), 140.) - .98 * pow(max(dot(N, H), 0.), 26.)))) * shade(vW); }
#endif
  if (vRun != 0.) lit += uSunC * .8 * pow(.5 + .5 * sin((vT - uTime * vRun) / 9.), 10.);
  gl_FragColor = vec4(hazed(lit, far), cov);
}`;

// ---------------------------------------------------------------- THE MULTITUDE: CLIPS ON CARDS ----
// a paperclip standing in the silver, one of very many: a flat card placed by its matrix, the clip worked out on it by
// the distance to its middle line and drawn by how much of each pixel its wire covers (the head, 1), shaded across
// as the round wire it is, toward the eye (the head, 2 and 3). SHADOW: the same card laid on the ground along the sun.
// iK: the wire's half-width (the clip one long), its tone, the route metre from which it is there (BY PLACE), the
// ground's height where it stands
const CARD_V = /* glsl */`
attribute vec4 iK; uniform float uS; varying vec2 vUV; varying vec3 vN, vTx, vTy, vW; varying vec4 vK; varying float vH;
void main() { float k = smoothstep(iK.z, iK.z + 14., uS); mat4 M = modelMatrix * instanceMatrix; vec4 w = M * vec4(position * k, 1.);
  vTx = mat3(M)[0]; vTy = mat3(M)[1]; vN = cross(vTx, vTy); vW = w.xyz; vUV = position.xy; vK = iK; vH = w.y - iK.w; gl_Position = projectionMatrix * viewMatrix * w; }`;
const CARD_F = /* glsl */`
varying vec2 vUV; varying vec3 vN, vTx, vTy, vW; varying vec4 vK; varying float vH; uniform vec3 uSteel, uHeap[10];
${COMMON}
float heapShade(vec2 p) { vec2 d = -normalize(uSun.xz), n = vec2(-d.y, d.x); float k = length(uSun.xz) / uSun.y, sd = 0.;
  for (int i = 0; i < 10; i++) { vec2 v = p - uHeap[i].xy; float hh = uHeap[i].z, R = 1.6 * hh, a = dot(v, d), b = abs(dot(v, n));
    sd = max(sd, smoothstep(0., 10., R * 1.1 * (1. - a / (k * hh)) - b) * smoothstep(0., .4 * R, a)); }
  return sd; }
// what bright steel shows along a direction: the sky (warm and bright toward the sun, blue above) or the dark of the pile
vec3 envOf(vec3 Rr) { float az = dot(normalize(Rr.xz + vec2(1e-4, 0.)), normalize(uSun.xz));
  vec3 skyR = mix(vec3(.95, .8, .58), vec3(.22, .37, .64), smoothstep(0., .6, Rr.y)) * (.72 + .4 * az);
  vec3 gndR = mix(vec3(.3, .24, .19), vec3(.06, .07, .08), smoothstep(-.8, -.05, Rr.y));
  vec3 envc = mix(gndR, skyR, smoothstep(-.03, .05, Rr.y));
  float aa = atan(Rr.z, Rr.x), edge = smoothstep(-.22, -.02, Rr.y) * (1. - smoothstep(.02, .3, Rr.y)), st = smoothstep(-.3, .3, sin(aa * 2. + 1.3) + .5 * sin(aa * 5. + .4));
  return mix(envc, mix(vec3(.08, .1, .1), vec3(.98, .93, .84), st), edge * .8); }
void main() {
  vec2 p = vUV; float wx = length(dFdx(p)), wy = length(dFdy(p)), w = max(wx, wy), wi = min(wx, wy), d = clipd(p), far = length(cameraPosition - vW);
  // the wire is never drawn thinner than the pixel is wide (the gauge grows); a clip only a few pixels long goes into
  // its row's band on the board, which the land draws from the same measure (the head, 1). Along its legs the pixel is
  // measured across them (wl), so that a clip seen from above keeps its legs as lines; at its bends, the pixel's widest reach
  float wl = mix(length(vec2(dFdx(p.x), dFdy(p.x))), w, max(smoothstep(.16, .3, p.y), 1. - smoothstep(-.34, -.2, p.y)));
  // (a tone written below nought marks a clip lying on a heap: that one keeps its own gauge and goes into the heap's
  // bed where its wire is well under a pixel wide, so that a far heap is its bed and its great clips and not a noise of strokes)
  bool heap = vK.y < 0.;
  float r = heap ? vK.x : min(max(vK.x, .5 * wl), .2), cov = heap ? boxcov(d, r, w) * (1. - smoothstep(2.2, 4.5, w / r)) : boxcov(d, r, wl) * (1. - smoothstep(.2, .3, wi));
  if (cov < .012) discard;
#ifdef SHADOW
  gl_FragColor = vec4(mix(vec3(1.), vec3(.375, .558, .8), .7 * cov * (1. - uHaze.z * smoothstep(uHaze.x, uHaze.y, far)) * (1. - .8 * heapShade(vW.xz))), 1.);
#else
  float e = max(.5 * w, .004); vec2 g = normalize(vec2(clipd(p + vec2(e, 0.)) - clipd(p - vec2(e, 0.)), clipd(p + vec2(0., e)) - clipd(p - vec2(0., e))) + vec2(1e-5, 0.));
  vec3 V = (cameraPosition - vW) / far, Tx = normalize(vTx), Ty = normalize(vTy), G = Tx * g.x + Ty * g.y, T = normalize(Ty * g.x - Tx * g.y);
  vec3 S = normalize(cross(T, V) + vec3(0., 1e-6, 0.)), F = cross(S, T);
  float x = clamp(d / r, 0., 1.) * (dot(G, S) < 0. ? -1. : 1.), thin = smoothstep(.7, 2.2, w / r);
  vec3 N = normalize(S * x + F * sqrt(1. - x * x)), H = normalize(V + uSun), col = uSteel * abs(vK.y);
  float sT = sqrt(max(1. - dot(T, uSun) * dot(T, uSun), 0.)), kd = mix(clamp(dot(N, uSun) * .8 + .2, 0., 1.), .62 * sT + .1, thin);
  float sp = mix(pow(max(dot(N, H), 0.), 26.), .35 * pow(sqrt(max(1. - dot(T, H) * dot(T, H), 0.)), 26.), thin), sunny = 1. - .7 * heapShade(vW.xz);
  // deep in the pile a clip stands among the others: it is darker toward its foot, and what it shows from below is the
  // dark of the pile, not the fields (vH: how high over the ground; iK.w)
  float occ = mix(.5, 1., smoothstep(.5, 9., vH));
  // (a wire too thin to show its round shows the mean of what its round would: the head, 1)
  vec3 envc = envOf(reflect(-V, N));
  if (thin > 0.) envc = mix(envc, (envOf(reflect(-V, F)) + envOf(reflect(-V, normalize(F * .66 + S * .75))) + envOf(reflect(-V, normalize(F * .66 - S * .75)))) / 3., thin);
  vec3 lit = (col * (envc * mix(.5, 1., sunny) + uSunC * kd * .35 * sunny) * occ + uSunC * (sp * 2.4 + (1. - thin) * (2.2 * pow(max(dot(N, H), 0.), 140.) - 1.68 * pow(max(dot(N, H), 0.), 26.))) * sunny * mix(.5, 1., occ)) * shade(vW);
  gl_FragColor = vec4(hazed(lit, far), cov);
#endif
}`;

// ---------------------------------------------------------------- THE SKY AND ITS STEEL WOOL ----
const SKY_V = /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SKY_F = /* glsl */`
uniform vec3 uSun, uZen, uMid, uHor, uGlow; varying vec3 vD;
void main() { vec3 d = normalize(vD); float y = d.y;
  vec3 c = mix(uHor, uMid, smoothstep(-.02, .2, y)); c = mix(c, uZen, smoothstep(.12, .8, y));
  float s = max(dot(d, uSun), 0.); c += uGlow * (pow(s, 6.) * .12 + pow(s, 80.) * .28 + pow(s, 1500.) * .9 + smoothstep(.99982, .99992, s) * .8);
  gl_FragColor = vec4(c, 1.); }`;
const WOOL_V = /* glsl */`
attribute vec2 iW; varying vec3 vN, vW, vP; varying vec2 vI;
void main() { vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vN = mat3(modelMatrix) * mat3(instanceMatrix) * normal; vW = w.xyz; vP = position; vI = iW; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WOOL_F = /* glsl */`
varying vec3 vN, vW, vP; varying vec2 vI; uniform vec3 uWool;
${COMMON}
void main() { vec3 N = normalize(vN); float far = length(cameraPosition - vW); vec3 V = (cameraPosition - vW) / far;
  float rim = clamp(dot(N, V), 0., 1.), a = smoothstep(.0, .75, rim);                     // the head, 5
  vec2 p = vP.xy * 4. + vP.z * 2.6 + vI.x * 40.; float w = max(length(dFdx(p)), length(dFdy(p)));
  // the wool's fibres: curls of fine wire, going into their mean with the footprint
  float curl = abs(sin(p.x * 3. + 2.6 * noise(p * 1.4)) * sin(p.y * 3.3 + 2.6 * noise(p * 1.4 + 5.))), fib = mix(1. - smoothstep(.03, .12 + w, curl), .2, smoothstep(.015, .09, w));
  float kd = clamp(dot(N, uSun) * .55 + .45, 0., 1.), under = smoothstep(-.7, .5, N.y);
  vec3 col = uWool * (.8 + .2 * noise(p * .3)) * (mix(uSkyC * vec3(.66, .7, .8), uSkyC, under) * .78 + uSunC * kd * .5) + uSunC * fib * (.03 + .08 * kd);
  gl_FragColor = vec4(hazed(col, far * .12), a * vI.y); }`;

// ---------------------------------------------------------------- SHADOWS ON THE GROUND ----
// a long shadow away from the low sun, lying on the land: aQ.x along it (0 at the foot of what casts it), aQ.y across;
// aS: the route metres at which what casts it comes undone and over how many (BY PLACE), how dark, and where along
// it the crown's round shadow begins (0: a block's shadow, from the foot)
const SHADE_V = /* glsl */`
attribute vec4 aS; attribute vec2 aQ; uniform float uS; varying vec2 vQ; varying float vA, vK; varying vec3 vW;
void main() { vQ = aQ; vA = aS.z * (1. - clamp((uS - aS.x) / max(aS.y, 1.), 0., 1.)); vK = aS.w; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const SHADE_F = /* glsl */`
varying vec2 vQ; varying float vA, vK; varying vec3 vW; uniform vec3 uHaze;
void main() { float a = vQ.x, b = vQ.y, sd, mid = (vK + 1.) * .5;
  if (vK > 0.) sd = max(1. - smoothstep(.7, 1., length(vec2((a - mid) / max((1. - vK) * .5, 1e-3), b))), (1. - smoothstep(.05, .13, abs(b))) * (1. - step(mid, a)));
  else sd = (1. - smoothstep(.82, 1., abs(b))) * (1. - smoothstep(.88, 1., a));
  float al = sd * vA * (1. - uHaze.z * smoothstep(uHaze.x, uHaze.y, length(cameraPosition - vW)));
  if (al < .01) discard; gl_FragColor = vec4(.008, .012, .016, al * .8); }`;      // (dark enough to keep the ground's own colour under it)

// the path of a paperclip one long, lying in x and y (y along it): the plain wire oval of three bends
export function clipPath(f = 1) {
  const P = [], arc = (cx, cy, r, a0, a1, n) => { n = Math.max(3, Math.round(n * f)); for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } }, PI = Math.PI;
  P.push([-0.14, 0.22], [-0.14, -0.36]); arc(0, -0.36, 0.14, PI, 2 * PI, 10);
  P.push([0.14, 0.39]); arc(0.03, 0.39, 0.11, 0, PI, 9);
  P.push([-0.08, -0.24]); arc(0, -0.24, 0.08, PI, 2 * PI, 7);
  P.push([0.08, 0.2]);
  return P;
}

export function makeWirework(o = {}) {
  const v3 = (c) => new THREE.Vector3(c[0], c[1], c[2]), sun = new THREE.Vector3(...(o.sun || [-0.85, 0.4, 0.3])).normalize();
  const U = { uS: { value: 0 }, uTime: { value: 0 }, uSun: { value: sun }, uSunC: { value: v3(lin('#FFCB8A')).multiplyScalar(1.2) }, uSkyC: { value: v3(lin('#BCD0EE')) }, uGndC: { value: v3(lin('#B9A98A')) },
    uHazeC: { value: v3(lin('#EFE4CF')) }, uHaze: { value: new THREE.Vector3(900, 9000, 0.55) },
    uZen: { value: v3(lin('#5A88CC')) }, uMid: { value: v3(lin('#CFE0E6')) }, uHor: { value: v3(lin('#F8CF94')) },
    uC: { value: new THREE.Vector4(0, 3000, 0, 0) }, uR: { value: new THREE.Vector4(620, 0.2, 500, 1050) },
    uChain: { value: new THREE.Vector4(120, 0.5, 4, 1800) }, uChain2: { value: new THREE.Vector4(110, 60, 46, 0) }, uAxis: { value: new THREE.Vector3(0, 0, 3000) },
    uArc: { value: [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.5708] }, uGate: { value: new THREE.Vector4(0, 0, 1, 1e9) },
    uCloud: { value: Array.from({ length: 11 }, () => new THREE.Vector4(0, 1e7, 0, 1)) }, uFlock: { value: new THREE.Vector3() },
    uHeap: { value: Array.from({ length: 10 }, () => new THREE.Vector3(0, 0, 0.001)) } };
  for (const k of ['board', 'green', 'copper', 'brass', 'straw', 'kale', 'sage', 'zinc', 'hedge', 'strand', 'steel', 'wool']) U['u' + k[0].toUpperCase() + k.slice(1)] = { value: v3(COL[k]) };
  const skinMat = (inst) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKIN_V, fragmentShader: SKIN_F, side: THREE.DoubleSide, defines: inst ? { INST: 1 } : {}, transparent: !!inst, depthWrite: !inst });
  const skinPlain = skinMat(false), skinInst = skinMat(true);
  const wireMat = (def) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: WIRE_V, fragmentShader: WIRE_F, side: THREE.DoubleSide, transparent: true, depthWrite: true, defines: def });
  const lenMat = wireMat({ LENGTH: 1 }), clipMat = wireMat({ CLIPS: 1 }), chainMat = wireMat({ CHAIN: 1 }), streamMat = wireMat({ STREAM: 1 });
  const A = (arr, k) => new THREE.BufferAttribute(new Float32Array(arr), k);

  // a sheet of skins: add(verts, tris, o): o.col, o.kind, o.cell, o.wire (half-width), o.ang, o.uv (one [u, v] for each
  // vertex, metres), o.s0, o.span and o.wipe (one for each vertex, 0 to 1: the order in which the skin is wiped away)
  const sheet = () => {
    const P = [], N = [], C = [], K = [], Uu = [], UV = [], IX = []; let n = 0, tri = 0;
    // (q.norms: the corners' own normals, given where one skin is added in parts, so that no seam shows between them)
    const add = (verts, tris, q = {}) => { const m = verts.length, own = !q.norms, nn = q.norms || new Float64Array(m * 3), col = q.col || [1, 1, 1];
      for (let t = 0; t < tris.length; t += 3) { const a = tris[t], b = tris[t + 1], c = tris[t + 2], Av = verts[a], Bv = verts[b], Cv = verts[c];
        const x = (Bv[1] - Av[1]) * (Cv[2] - Av[2]) - (Bv[2] - Av[2]) * (Cv[1] - Av[1]), y = (Bv[2] - Av[2]) * (Cv[0] - Av[0]) - (Bv[0] - Av[0]) * (Cv[2] - Av[2]), z = (Bv[0] - Av[0]) * (Cv[1] - Av[1]) - (Bv[1] - Av[1]) * (Cv[0] - Av[0]);
        if (x * x + y * y + z * z < 1e-12) continue;
        if (own) for (const i of [a, b, c]) { nn[i * 3] += x; nn[i * 3 + 1] += y; nn[i * 3 + 2] += z; } IX.push(n + a, n + b, n + c); tri++; }
      for (let i = 0; i < m; i++) { const l = Math.hypot(nn[i * 3], nn[i * 3 + 1], nn[i * 3 + 2]) || 1, c = q.cols ? q.cols[i] : col, uv = q.uv ? q.uv[i] : [0, 0];
        P.push(verts[i][0], verts[i][1], verts[i][2]); N.push(nn[i * 3] / l, nn[i * 3 + 1] / l, nn[i * 3 + 2] / l); C.push(c[0], c[1], c[2]);
        K.push(q.kind ?? KIND.hex, q.cell ?? 3, q.wire ?? 0.2, q.ang ?? 0); Uu.push(q.s0 ?? 1e9, q.span ?? 1, q.wipe ? q.wipe[i] : 0); UV.push(uv[0], uv[1]); }
      n += m; };
    const geometry = () => { const g = new THREE.BufferGeometry();
      g.setAttribute('position', A(P, 3)); g.setAttribute('normal', A(N, 3)); g.setAttribute('aCol', A(C, 3)); g.setAttribute('aK', A(K, 4)); g.setAttribute('aU', A(Uu, 3)); g.setAttribute('aUV', A(UV, 2));
      g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(IX), 1) : new THREE.BufferAttribute(new Uint16Array(IX), 1)); g.computeBoundingSphere(); return g; };
    return { add, geometry, tris: () => tri };
  };
  const mesh = (sh, name) => { const m = new THREE.Mesh(sh.geometry(), skinPlain); m.name = name || 'skin'; m.frustumCulled = false; return m; };
  // many of one skin (a crown of mesh): set(i, matrix, col, kind, cell, wire, ang, s0, span)
  const many = (sh, count, name) => { const g = sh.geometry(), col = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3), k = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), u = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
    g.setAttribute('iCol', col); g.setAttribute('iK', k); g.setAttribute('iU', u);
    const m = new THREE.InstancedMesh(g, skinInst, count); m.name = name || 'skins'; m.frustumCulled = false; m.renderOrder = 2;
    const set = (i, matrix, c, kind, cell, wire, ang, s0, span) => { m.setMatrixAt(i, matrix); col.setXYZ(i, c[0], c[1], c[2]); k.setXYZW(i, kind, cell, wire, ang); u.setXY(i, s0 ?? 1e9, span ?? 1); };
    return { mesh: m, set, tris: sh.tris() * count }; };

  // LENGTHS: add(p0, p1, p2, r, col, q): a curve from p0 by p1 to p2 (p0 its root), half-width r; q.s0 and q.span: the
  // route metres at which it draws back; q.run: glints along it, metres a second. done(): the mesh, far ones first.
  const NS = 4, ribbon = (pts) => { const t = [], ix = []; for (let i = 0; i <= pts; i++) t.push(i / pts, -1, i / pts, 1); for (let i = 0; i < pts; i++) { const a = i * 2; ix.push(a, a + 1, a + 3, a, a + 3, a + 2); } return { t, ix }; };
  const lengths = (name) => { const L = [];
    const add = (p0, p1, p2, r, col, q = {}) => { L.push({ p0, p1, p2, r, col, s0: q.s0 ?? 1e9, span: q.span ?? 1, run: q.run || 0, seed: q.seed ?? ((p0[0] * 0.013 + p2[2] * 0.007) % 1) }); };
    const line = (a, b, r, col, q) => add(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], b, r, col, q);
    const done = () => { L.sort((a, b) => (b.p0[2] + b.p2[2]) - (a.p0[2] + a.p2[2])); const n = L.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n * 4), d = new Float32Array(n * 4), col = new Float32Array(n * 3);
      L.forEach((q, i) => { const len = Math.hypot(q.p1[0] - q.p0[0], q.p1[1] - q.p0[1], q.p1[2] - q.p0[2]) + Math.hypot(q.p2[0] - q.p1[0], q.p2[1] - q.p1[1], q.p2[2] - q.p1[2]);
        a.set([q.p0[0], q.p0[1], q.p0[2], q.r], i * 4); b.set([q.p1[0], q.p1[1], q.p1[2], 0], i * 4); c.set([q.p2[0], q.p2[1], q.p2[2], q.seed], i * 4); d.set([q.s0, q.span, q.run, len], i * 4); col.set(q.col, i * 3); });
      const rb = ribbon(NS), g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', A(new Array((NS + 1) * 6).fill(0), 3)); g.setAttribute('aT', A(rb.t, 2)); g.setIndex(rb.ix);
      for (const [nm, arr, k] of [['iA', a, 4], ['iB', b, 4], ['iC', c, 4], ['iD', d, 4], ['iCol', col, 3]]) g.setAttribute(nm, new THREE.InstancedBufferAttribute(arr, k));
      g.instanceCount = n; const m = new THREE.Mesh(g, lenMat); m.name = name || 'lengths'; m.frustumCulled = false; m.renderOrder = 5; return { mesh: m, count: n, tris: n * NS * 2 }; };
    return { add, line, done, list: L };
  };
  // PAPERCLIPS: the clip's path as a ribbon; many(count): placed by matrices (a unit clip is 1 long); chain(count): along the chain's arc
  const clipGeo = (f) => { const pth = clipPath(f), n = pth.length, pos = [], tan = [], t = [], ix = [], cum = [0];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pth[i][0] - pth[i - 1][0], pth[i][1] - pth[i - 1][1]));
    for (let i = 0; i < n; i++) { const a = pth[Math.max(0, i - 1)], b = pth[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      for (const s of [-1, 1]) { pos.push(pth[i][0], pth[i][1], 0); tan.push((b[0] - a[0]) / l, (b[1] - a[1]) / l, 0); t.push(cum[i] / cum[n - 1], s); } }
    for (let i = 0; i < n - 1; i++) { const a = i * 2; ix.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', A(pos, 3)); g.setAttribute('aTan', A(tan, 3)); g.setAttribute('aT', A(t, 2)); g.setIndex(ix); return { g, tris: (n - 1) * 2 }; };
  // f: how fine the bends are drawn (1: 31 points; the great standing clip takes more, the small ones fewer)
  const clipsMany = (count, name, f = 1) => { const { g, tris } = clipGeo(f), k = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); g.setAttribute('iK', k);
    const m = new THREE.InstancedMesh(g, clipMat, count); m.name = name || 'clips'; m.frustumCulled = false; m.renderOrder = 6;
    const set = (i, matrix, gauge, tone, sOn, sOff) => { m.setMatrixAt(i, matrix); k.setXYZW(i, gauge, tone ?? 1, sOn ?? 0, sOff ?? 0); };
    return { mesh: m, set, tris: tris * count }; };
  // STREAMS: strings of clips travelling down drawn-off wires. add(p0, p1, p2, q): the wire's curve from its root p0;
  // q.n clips on it, each q.len long, q.rate clips a second, between the route metres q.s0 and q.s1. done(): the mesh.
  const streams = (name, f = 0.5) => { const Sx = [];
    const add = (p0, p1, p2, q) => { for (let j = 0; j < q.n; j++) Sx.push({ p0, p1, p2, q, j }); };
    const done = () => { const { g: base, tris } = clipGeo(f), g = new THREE.InstancedBufferGeometry(), n = Sx.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n * 4), d = new Float32Array(n * 4);
      g.index = base.index; for (const nm of ['position', 'aTan', 'aT']) g.setAttribute(nm, base.getAttribute(nm));
      Sx.forEach((e, i) => { a.set([e.p0[0], e.p0[1], e.p0[2], e.q.gauge ?? 0.028], i * 4); b.set([e.p1[0], e.p1[1], e.p1[2], e.q.len], i * 4); c.set([e.p2[0], e.p2[1], e.p2[2], e.q.n], i * 4); d.set([e.q.s0, e.q.s1, e.j, e.q.rate ?? 0.4], i * 4); });
      for (const [nm, arr] of [['iA', a], ['iB', b], ['iC', c], ['iD', d]]) g.setAttribute(nm, new THREE.InstancedBufferAttribute(arr, 4));
      g.instanceCount = n; const m = new THREE.Mesh(g, streamMat); m.name = name || 'streams'; m.frustumCulled = false; m.renderOrder = 6; return { mesh: m, count: n, tris: tris * n }; };
    return { add, done };
  };
  const chain = (count, name) => { const { g: base, tris } = clipGeo(1), g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const nm of ['position', 'aTan', 'aT']) g.setAttribute(nm, base.getAttribute(nm));
    const k = new Float32Array(count * 4); for (let i = 0; i < count; i++) k.set([0.042, 1, i, 0], i * 4); g.setAttribute('iK', new THREE.InstancedBufferAttribute(k, 4)); g.instanceCount = count;
    const m = new THREE.Mesh(g, chainMat); m.name = name || 'chain'; m.frustumCulled = false; m.renderOrder = 4; return { mesh: m, tris: tris * count }; };

  // CARDS: many(count): clips on cards, placed by matrices (the card's x and y are the clip's own; a unit clip is 1 long);
  // shadow: the same laid on the ground. shadowOf(m, g, n, out): a clip's matrix thrown along the sun onto the plane
  // through g with the normal n (nothing where the ground is turned from the sun)
  const cardMat = (shadow) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: CARD_V, fragmentShader: CARD_F, side: THREE.DoubleSide, transparent: true, depthWrite: !shadow, defines: shadow ? { SHADOW: 1 } : {},
    polygonOffset: !!shadow, polygonOffsetFactor: shadow ? -2 : 0, polygonOffsetUnits: shadow ? -2 : 0, ...(shadow ? { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor } : {}) });
  const cardClip = cardMat(false), cardShade = cardMat(true);
  const cards = (count, name, shadow) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', A([-0.4, -0.76, 0, 0.4, -0.76, 0, 0.4, 0.76, 0, -0.4, 0.76, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);      // (wide enough to hold a far clip's grown stroke)
    const k = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); g.setAttribute('iK', k);
    const m = new THREE.InstancedMesh(g, shadow ? cardShade : cardClip, count); m.name = name; m.frustumCulled = false; m.renderOrder = shadow ? 1 : 6;
    return { mesh: m, set: (i, matrix, gauge, tone, sOn, gy) => { m.setMatrixAt(i, matrix); k.setXYZW(i, gauge, tone ?? 1, sOn ?? -1e9, gy ?? -1e9); }, tris: 2 * count }; };
  const PM = new THREE.Matrix4(), shadowOf = (m, g, n, out) => { const sn = sun.x * n[0] + sun.y * n[1] + sun.z * n[2]; if (sn < 0.15) return null; const gd = (g[0] * n[0] + g[1] * n[1] + g[2] * n[2]) / sn, a = n[0] / sn, b = n[1] / sn, c = n[2] / sn;
    PM.set(1 - sun.x * a, -sun.x * b, -sun.x * c, sun.x * gd, -sun.y * a, 1 - sun.y * b, -sun.y * c, sun.y * gd, -sun.z * a, -sun.z * b, 1 - sun.z * c, sun.z * gd, 0, 0, 0, 1);
    return out.multiplyMatrices(PM, m); };

  // SHADOWS: add(x, z, len, hw, K, alpha, s0, span, yOf): from the foot at (x, z) away from the sun, len long, hw to
  // either side, lying on the land (yOf: the land's own height). reach: a shadow's length for one metre of height
  const shadeMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHADE_V, fragmentShader: SHADE_F, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const shadows = (name) => { const P = [], Q = [], Sx = [], IX = []; let n = 0; const hz = Math.hypot(sun.x, sun.z), dx = -sun.x / hz, dz = -sun.z / hz;
    const add = (x, z, len, hw, K, alpha, s0, span, yOf) => { const ns = Math.max(2, Math.ceil(len / 45));
      for (let i = 0; i <= ns; i++) for (const sg of [-1, 1]) { const a = i / ns, px = x + dx * len * a - dz * hw * sg, pz = z + dz * len * a + dx * hw * sg; P.push(px, yOf(px, pz) + 0.7, pz); Q.push(a, sg); Sx.push(s0 ?? 1e9, span ?? 1, alpha, K); }
      for (let i = 0; i < ns; i++) { const a = n + i * 2; IX.push(a, a + 1, a + 3, a, a + 3, a + 2); } n += (ns + 1) * 2; };
    const done = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', A(P, 3)); g.setAttribute('aQ', A(Q, 2)); g.setAttribute('aS', A(Sx, 4));
      g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(IX), 1) : new THREE.BufferAttribute(new Uint16Array(IX), 1));
      const m = new THREE.Mesh(g, shadeMat); m.name = name || 'shadows'; m.frustumCulled = false; m.renderOrder = 1; return { mesh: m, tris: IX.length / 3 }; };
    return { add, done, reach: hz / sun.y }; };

  const skyMat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: sun }, uZen: { value: v3(lin('#5A88CC')) }, uMid: { value: v3(lin('#CFE0E6')) }, uHor: { value: v3(lin('#F8CF94')) }, uGlow: { value: v3(lin('#FFE2A8')) } },
    vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, depthTest: false });
  const sky = (r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), skyMat); m.name = 'sky'; m.frustumCulled = false; m.renderOrder = -10; return m; };
  const woolMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: WOOL_V, fragmentShader: WOOL_F, transparent: true, depthWrite: false });
  const wool = (count) => { const g = new THREE.IcosahedronGeometry(1, 2), iw = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2); g.setAttribute('iW', iw);
    const m = new THREE.InstancedMesh(g, woolMat, count); m.name = 'wool'; m.frustumCulled = false; m.renderOrder = 1;
    return { mesh: m, set: (i, matrix, seed, alpha) => { m.setMatrixAt(i, matrix); iw.setXY(i, seed, alpha ?? 1); }, tris: 320 * count }; };
  return { uniforms: U, sun, sheet, mesh, many, lengths, clipsMany, streams, chain, sky, wool, shadows, cards, shadowOf };
}

// ---------------------------------------------------------------- SHAPES ----
// a ball of mesh (a crown): a sphere of nu by nv, its uv in metres on a ball of radius 1 (the instance's size scales the cell with it)
export function ball(sh, nu = 8, nv = 5) { const V = [], I = [], uv = [], wipe = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const a = i / nu * Math.PI * 2, b = (j / nv - 0.5) * Math.PI; V.push([Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)]); uv.push([a, b * 1.2]); wipe.push(0.5 + 0.5 * Math.cos(b) * Math.cos(a)); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, c, d, a, d, b); }
  sh.add(V, I, { uv, wipe }); return sh; }

// a wire tree at (x, y, z), h tall: a trunk of twisted wires that leave it as boughs, fork, and end in loops of leaf.
// W: the lengths; q.s0, q.span: the route metres over which it comes undone (twigs first, the trunk last, from its top)
export function wireTree(W, x, y, z, h, rnd, q = {}) {
  const bark = q.bark || COL.bark, leaf = q.leaf || COL.leaf, nT = q.wires || 5, g = (q.gauge || 0.011) * h, s0 = q.s0 ?? 1e9, span = q.span ?? 1, TAU = Math.PI * 2;
  const und = (order, dur = 0.07) => (s0 > 1e8 ? {} : { s0: s0 + order * span, span: span * dur });
  const th = 0.42 * h, tw = TAU * (0.7 + 0.5 * rnd()), ph = rnd() * TAU, rr = 0.028 * h;
  const tp = (k, t) => { const a = ph + k / nT * TAU + tw * t, r = rr * (1 - 0.35 * t); return [x + r * Math.cos(a), y + th * t, z + r * Math.sin(a)]; };
  for (let k = 0; k < nT; k++) {
    for (let s = 0; s < 3; s++) { const t0 = s / 3, t1 = (s + 1) / 3, a = tp(k, t0), b = tp(k, t1), m = tp(k, (t0 + t1) / 2); W.add(a, [2 * m[0] - (a[0] + b[0]) / 2, m[1], 2 * m[2] - (a[2] + b[2]) / 2], b, g, bark, und(0.90 + 0.03 * (2 - s), 0.035)); }
    // the bough: out and up from the trunk's top
    const top = tp(k, 1), a = ph + k / nT * TAU + tw + 0.5 * (rnd() - 0.5), out = (0.2 + 0.16 * rnd()) * h, up = (0.2 + 0.2 * rnd()) * h;
    const e = [top[0] + out * Math.cos(a), top[1] + up, top[2] + out * Math.sin(a)]; W.add(top, [top[0] + 0.25 * out * Math.cos(a), top[1] + 0.75 * up, top[2] + 0.25 * out * Math.sin(a)], e, g * 0.9, bark, und(0.84, 0.05));
    for (let f = 0; f < 3; f++) { const a2 = a + (f - 1) * 0.9 + 0.4 * (rnd() - 0.5), o2 = (0.12 + 0.12 * rnd()) * h, u2 = (0.08 + 0.16 * rnd()) * h, e2 = [e[0] + o2 * Math.cos(a2), e[1] + u2, e[2] + o2 * Math.sin(a2)];
      W.add(e, [e[0] + 0.3 * o2 * Math.cos(a2), e[1] + 0.8 * u2, e[2] + 0.3 * o2 * Math.sin(a2)], e2, g * 0.75, bark, und(0.76 + 0.03 * rnd(), 0.05));
      // twigs from the fork's end, and loops of leaf at each twig's end: each loop a wire bent round and back
      // (q.toward: the unit direction over the ground from which the unmaking comes: that side's leaves go first)
      const nt = q.twigs ?? 1; for (let w = 0; w < nt; w++) { let e3 = e2, ord = 0.04 + 0.36 * rnd(), tw = null;
        if (nt > 1) { const a3 = a2 + (w - (nt - 1) / 2) * 1.1 + 0.5 * (rnd() - 0.5), o3 = (0.07 + 0.08 * rnd()) * h, u3 = (0.02 + 0.12 * rnd()) * h; e3 = [e2[0] + o3 * Math.cos(a3), e2[1] + u3, e2[2] + o3 * Math.sin(a3)];
          tw = [e2[0] + 0.4 * o3 * Math.cos(a3), e2[1] + 0.9 * u3, e2[2] + 0.4 * o3 * Math.sin(a3)]; }
        if (q.toward) ord = 0.04 + 0.36 * Math.min(1, Math.max(0, 0.5 - ((e3[0] - x) * q.toward[0] + (e3[2] - z) * q.toward[1]) / (0.8 * h) + 0.12 * (ord - 0.24)));
        if (tw) W.add(e2, tw, e3, g * 0.6, bark, und(ord + 0.3, 0.05));
        for (let l = 0; l < (q.loops ?? 3); l++) { const b1 = rnd() * TAU, b2 = rnd() * 2 - 0.6, R = (0.04 + 0.035 * rnd()) * h, d = [Math.cos(b1), b2 * 0.6, Math.sin(b1)], m = [e3[0] + d[0] * R * 2, e3[1] + d[1] * R * 2 + R, e3[2] + d[2] * R * 2], sx = -d[2] * R * 1.6, sz = d[0] * R * 1.6;
          W.add(e3, [e3[0] + sx + d[0] * R, e3[1] + d[1] * R, e3[2] + sz + d[2] * R], m, g * 0.55, leaf, und(ord, 0.04)); W.add(m, [e3[0] - sx + d[0] * R, e3[1] + d[1] * R + R * 0.4, e3[2] - sz + d[2] * R], e3, g * 0.55, leaf, und(ord + 0.04, 0.04));
          if (q.onClip && s0 < 1e8) q.onClip(e3, [d[0] * 2, d[1] * 2 + 1, d[2] * 2], 2.3 * R, s0 + (ord + 0.03) * span, s0 + (tw ? ord + 0.3 : 0.72) * span); } } } }
}
