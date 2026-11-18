// CLOISONNE TYPHOON: hero set piece for "The Gold-Wire Harbour" (world id cloisonne-typhoon).
//
// WHAT IT IS
//   The storm front: a curved wall of ruyi cloud-scrolls 3 km long and 900 m tall in four overlapping
//   layers (white, celadon, lapis, navy cells outlined in raised gold wire), wound into one flattened
//   spiral around a navy hub that hangs 450 m up. Scroll heads ride the spiral arms and the crests and
//   roll forward; a curtain of slanting gold-wire rain hangs under the wall; one branching lightning
//   wire eases on inside the scrolls and leaves a pale crack; sixty junks with oxblood batten sails run
//   in a curving file from under the wall toward the harbour mouth; one cloud arm curls overhead from
//   the left (north-east) end and grows with progress.
//
// LOCAL SPACE
//   Origin at the base centre of the wall (sea level under the hub), +Y up, front = +Z (the side the
//   junk sees). The wall is an arc of radius 1500 m whose centre of curvature is (0,0,1500): the entry
//   viewpoint. Local -X is the brief's north-east end, +X the south end. To seat it in the brief's
//   world (X east, Z south, hub at (1530,450,330), entry at (-150,62)): position (1530,0,330) and
//   rotation.y = atan2(-1680, -268) (so local +Z points from the hub back to the entry).
//   The wall itself spans x -1260..1260, z 0..700; the returned radius (1080) frames the wall, while
//   the fleet reaches z 1576 and the overhead arm y 1050, z +2100. height ~950.
//
// EXPORTS
//   buildHero(ctx, opts)       the hero (contract below)
//   createEnamel(opts)         THE enamel-and-wire material system the whole world should use:
//       const en = createEnamel({ palette });              // shared uniforms in en.uniforms
//       const mat = en.material({ pattern, wire, patScale, coords, edge, instanced, side, ... });
//       en.update(time);  en.uniforms.uSun.value / uFront / uFlash / uGlint / uPale ... are shared.
//     pattern: 'none' | 'ruyi' | 'scales' | 'filler' | 'brick' | 'tile' | 'net' | 'volute' | 'bands' | 'eye'
//     coords : 'uv' (attribute uv, metres) | 'worldXZ' (sea) ; patScale = feature size in metres
//     edge   : true when the geometry went through enamelize() (attributes aEdge, aCell, aCol);
//              cellSize = typical cell size in metres (edge wires fade when cells get under ~4 px)
//     lay    : [headSize, crest, base, layer] for pattern 'ruyi' on a flat mesh (uv.y is 'up': heads
//              exist between base and crest, so the pattern cuts its own trefoil silhouette)
//     graze  : true for a sheet seen from below at a slant; grazeRange [lo, hi] = |N.V| range of its fade-in
//     Geometry colour comes from attribute aCol (vec3, linear). Wire width = max(wire metres, 1.5 px),
//     antialiased with fwidth taken once at the top of main; inner pattern wires fade below ~4 px.
//   enamelize(geometry, opts)  splits a mesh into flat cells (coplanar connected faces), writes aCol
//     (per cell, from opts.color(cellNormal, cellCentre, id) or existing colours), aEdge (metres to
//     the cell border) and aCell (cell centre xyz + id). Returns a new non-indexed geometry.
//   makeJunkGeometries(rng, palette)  { hull, sails, pennant } low junk parts (already enamelized).
//
// buildHero OPTS
//   palette   7 hex strings (brief order: turquoise, lapis, oxblood, white, gold, navy, brick)
//   fleet     true: include the sixty junks (set false if the world flies its own fleet)
//   rain      true, arm true, lightning true: the other sub-pieces
//   advance   300: metres the storm moves toward +Z over progress 0..1
//   fogAmount 0.06: share of scene fog applied (the brief has no fog; the wall is sky-scale)
//   sun       THREE.Vector3 toward the sun in WORLD space (default: behind-left of the entry view)
//   armEnd    0: the arm's yaw (radians) at progress 1; armHeight 1: scale of its altitude (800-1050 m)
//   armUnder  640: width (m) of the arm's underside shelf, from its face out over the viewer
//
// PROGRESS: hero.setProgress(u) (0..1 along the world's path). It drives the storm's advance, the
//   fleet's run along its file, the overhead arm's growth and the six lightning strikes (at u = 0.066,
//   0.155, 0.33, 0.585, 0.78, 0.90; 0.25 s ease in, 0.6 s ease out, crack lingering ~3 s of trip time).
//   Without setProgress the hero loops a 46 s trip from wall-clock time so the viewer shows it alive.
//   hero.setSun(vec3World) re-aims the key light; hero.enamel is the material system for the world.
//
// ANCHORS (local space)
//   hub            centre of the spiral (look-at for the entry frame)
//   entryView      { position, target }: where the brief's first frame stands and looks
//   fleetFile      ordered points of the fleet's lane, from under the wall to the harbour mouth end
//   fleetHead      point where the file ends (harbour mouth side); align it with the world's mouth
//   flyThrough     a safe line (>= 6 m clear of every junk lane) running beside the head of the file
//   portalSeat     { position, facing }: suggestion only; the brief seats the portal on the bridge,
//                  not on the hero, so this marks the open water at the file's head
//   viewpoints     three good stills: entry, low under the rain, three-quarter from the north arm
//   armTip         where the overhead arm ends at progress 1
//
// WORLD EXTENSIONS (used by src/worlds/cloisonne-typhoon.js, same shader):
//   patterns 'contour' (terrain bands by world height, patScale = metres per band) and 'line' (a single wire
//   along uv.y = 0, the rest cut away: cords and stays); 'scales' draws itself at three sizes that cross-fade
//   with distance. Vertex modes: vmode 4 the sea (swell from uSea, calm north of the harbour mouth), 5 critters,
//   6 beads (ballistic billboards), 7 lanterns (swinging billboards lit from a given progress); 5-7 take
//   instanced attributes iA, iB, iC (see the vertex shader). Shared uniforms: uCam (camera xz, progress),
//   uSea, uShaft + uShaftB (the stripe of storm sun that the dark front spares).
//   Critter kinds 5 and 6 are modelled birds (a percher whose wing cells, |x| > 0.2, stay tucked until the camera
//   nears; a paddler) that keep their own normals. Vertex mode 8 draws free scroll heads on plain quads (aLay = size,
//   seed, tone). With sway + edge, aSway -1 / -2 marks a shutter leaf hinged on the vertical through its cell centre:
//   it swings shut once the dark front (uFront) has passed. material({ graze: true }) fades a sheet's pattern to its
//   average and stills its wires when it is seen nearly edge-on (the overhead arm). The arm carries a face: a skirt
//   of scroll heads hanging from its crest line with free heads rolling on the lower rim in two rows, and an
//   underside shelf of navy cells from the face out over the viewer. Colour is clamped >= 0.
//   Wire-only patterns ('net', 'line') draw nothing but the wire; 'net' doubles its mesh with distance (period >= 12 px).
//   uFlood (shared): rgb tone and amount of the dark front's flood (default lapis, 0.78); uFloodB (x, y, 1): flood cell
//   by cell, by x or by y (blue-and-white).
//   Lightning: strike 0 beside the hub, strike 1 on the north-east end, strikes 2-4 in the arm's face (the wall if arm: false),
//   strike 5 (u = 0.155) on the north-east reach, behind the pagoda light as the junk turns toward it.
//   The arm is a bank, not a sheet: two leaning walls of ruyi heads (dark at the base, white at the crest) rise from its
//   crest line above the face (opts.armBank, default true), and its tip thins away and ends in one scroll head.
//   Under the shelf hang three billows (opts.armBillows, default true): curtains of ruyi heads parallel to the face, 250,
//   440 and 636 m out from it toward the viewer, navy at the shelf and white at their hanging rims. They swell down out
//   of the shelf one after another as the arm comes over (progress 0.36 to 0.74), each ahead of the shelf's own edge, so
//   that from below the arm is banked cloud in depth and the flat shelf and its edge are never what is seen. The
//   strikes in the arm (2-4) hang from under the first billow.
//
// COST: ~59k triangles, 16 draw calls (shells, spiral, hub, heads, rain, lightning x2, hulls, sails,
//   arm x4, billows x3), no lights, no textures. Build ~100 ms. Fragment cost: the wall pattern tests 15 heads per pixel.
// LIGHTING: self-lit flat enamel (two tones per cell by facing toward uSun), so it needs no scene
//   lights; wants a turquoise ground behind it and bloom on (wire glints, lightning ~4-6).

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#17A3A8', '#1C3F94', '#8C1D18', '#F4EFE0', '#E9B949', '#0C1A3A', '#C4502F'];
const RC = 1500;                 // wall arc radius
const HUB_Y = 450;
const PATTERNS = { none: 0, ruyi: 1, scales: 2, filler: 3, brick: 4, tile: 5, net: 6, volute: 7, bands: 8, eye: 9, contour: 10, line: 11 };
const STRIKES = [0.066, 0.33, 0.585, 0.78, 0.9, 0.155];   // the sixth (index 5) was added last: it stands behind the pagoda light
const TRIP = 46;                 // seconds in the brief's journey

// ---------------------------------------------------------------------------------------------
// GLSL: shared helpers and the wire pattern library. Every pattern sets the globals and returns
// nothing; distances are in pattern units (metres). No derivatives are taken in here.
// ---------------------------------------------------------------------------------------------
const GLSL_LIB = /* glsl */`
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y);
}
float satan(float y, float x){ return atan(y, abs(x) < 1e-5 ? 1e-5 : x); }

vec3 gCol;        // cell colour chosen by the pattern (used when gUse > 0.5)
float gUse;       // 1: gCol replaces the vertex colour, 0: gCol multiplies it
float gOut;       // distance to the nearest outline wire (never faded)
float gIn;        // distance to the nearest inner wire (faded when finer than a few pixels)
float gPeriod;    // spacing of the inner wires, for the footprint fade
float gFill;      // wire brightness (1 outline, 0.4 filler)
float gCid;       // cell id 0..1
float gAlpha;     // 0 = cut away
vec2 gCell;       // cell centre in pattern space
vec3 gAvg;        // average colour of the motif (x < 0: none), used when its bands get finer than a pixel
float gSize;      // size of the outlined motif, for fading outlines that get too small

// one ruyi head, q in head units (about -1..1). Returns the outline sdf (negative inside).
float ruyiSdf(vec2 q, float tail){
  vec2 a = vec2(abs(q.x), q.y);
  float d = length(q - vec2(0., .40)) - .52;
  d = min(d, length(a - vec2(.52, -.02)) - .43);
  d = min(d, length(q - vec2(0., -.50)) - .66);
  d = min(d, length(q - vec2(0., -1.05)) - .50 + (1. - tail) * 2.);
  return d;
}
// interior of a head: nested lines, then a volute in each side lobe. Sets gIn (head units) and a band index.
float ruyiInner(vec2 q, float d, float spin){
  float g = .105, dep = -d;
  float band = min(floor(dep / g), 3.);
  float w = dep < 3.5 * g ? abs(fract(dep / g + .5) - .5) * g : dep - 3. * g;
  if (dep < .5 * g) w = g - dep;                       // the outline itself is handled by gOut
  vec2 v = vec2(abs(q.x), q.y) - vec2(.52, -.02);
  float rr = length(v), rc = .43 - 2. * g;
  if (rr < rc) {
    float pitch = .105;
    float sp = rr / pitch + satan(v.y, v.x) / 6.2831853 + spin;
    w = min(rc - rr, abs(fract(sp) - .5) * pitch);
    band = 4. + mod(floor(sp + .5), 2.);
    gPeriod = pitch;
  } else gPeriod = g;
  gIn = w;
  return band;
}
vec3 stormBand(float band, float tone, float hs){
  // tone 1 = crest (white), 0 = underside (navy); stepped, never a gradient
  vec3 c;
  float st = floor(clamp(1. - tone + (hs - .5) * .5, 0., .999) * 4.) / 4.;
  if (band < .5) c = uWhite;
  else if (band < 1.5) c = st < .2 ? uWhite * .9 : uCeladon;
  else if (band < 2.5) c = mix(uTurq, uCeladon, st < .2 ? .75 : .4);
  else if (band < 3.5) c = uTurq;
  else if (band < 4.5) c = uWhite;
  else c = mix(uCeladon, uTurq, .45);
  if (st > .7) c = mix(uNavy, uLapis, band < .5 ? .85 : (band > 3.5 ? .6 : .3));
  else if (st > .45) c = mix(c, uLapis, band < .5 ? .3 : .8);
  else if (st > .2) c = mix(c, mix(uTurq, uLapis, .3), band < .5 ? .0 : (band > 3.5 ? .25 : .45));
  return c;
}
// (1) the storm wall: overlapping ruyi heads banked like scales; heads above the crest line or below
// the base line do not exist, so the silhouette is real trefoil heads. vLay = (headSize, crest, base, layer).
void patRuyi(vec2 p, vec4 lay){
  // the layer index arrives as an interpolated constant: round it, or the hashes flicker per pixel
  // (flat sheets carry a fractional index below -1: snapped to tenths for the same reason)
  float lw = lay.w < -1. ? floor(lay.w * 10. + .5) * .1 : floor(lay.w + .5);
  float S = lay.x, cw = S * 1.46, rh = S * .60;
  float jr = floor(p.y / rh);
  float minOut = 1e4; gAlpha = 0.; gOut = 1e4; gIn = 1e4; gPeriod = 1e4; gUse = 1.;
  bool found = false;
  for (int jj = -1; jj <= 3; jj++) {
    float j = jr + float(jj);
    float off = mod(j, 2.) * .5 + lw * .31;
    float i0 = floor(p.x / cw - off);
    for (int ii = -1; ii <= 1; ii++) {
      if (found) continue;
      float i = i0 + float(ii);
      vec2 id = vec2(i, j + lw * 57.);
      float hs = h21(id + uSeed);
      vec2 c = vec2((i + off + .5 + (hs - .5) * .16) * cw, (j + (h21(id + 7.3) - .5) * .3) * rh);
      float crest = lay.y * (.70 + .17 * sin(c.x * .0041 + lw * 1.9 + uSeed * 6.) + .13 * sin(c.x * .0113 + lw * 4.3 + uSeed * 11.));
      float sT = c.x - uDrift * (1. + lw * .4);
      crest *= (1. - .78 * smoothstep(700., 1500., sT)) * smoothstep(-1570., -1400., sT) * (1. - smoothstep(1330., 1540., sT));
      // a base line far up the sheet (the arm's underside while it is still growing) keeps a ragged edge of constant depth
      float hb = h11(i * .37 + lw + floor(uSeed * 50.));
      float base = lay.z > 200. ? lay.z + (hb - .5) * 100. : lay.z * (.75 + .5 * hb);
      if (c.y > crest || c.y < base || crest < 30.) continue;
      float sz = S * (.92 + .16 * h21(id + 3.1));
      vec2 q = (p - c) / sz;
      float d = ruyiSdf(q, 0.);
      if (d < 0.) {
        found = true;
        float spin = hs * 7. + uTime * (.035 + .03 * hs) * uRoll;
        float band = ruyiInner(q, d, spin);
        gIn *= sz; gPeriod *= sz; gOut = min(minOut, -d * sz);
        float tone = clamp((c.y - base) / max(crest - base, 1.), 0., 1.);
        vec2 hd = (c - vec2(uDrift * (1. + lw * .4), ${HUB_Y}.0)) * vec2(.52, 1.);
        if (lw >= 0.) tone *= .25 + .75 * smoothstep(150., 520., length(hd) + (hs - .5) * 160.);
        gCol = stormBand(band, tone, hs);
        gCid = hs; gCell = c; gAlpha = 1.;
        gAvg = stormBand(1., tone, hs); gSize = sz;
      } else minOut = min(minOut, d * sz);
    }
  }
}
// (7) one free head filling uv -1..1 (the instanced scroll heads); vAux.x = spin, vAux.y = tone, vAux.z = id
void patVolute(vec2 q, vec3 aux){
  float d = ruyiSdf(q, 1.);
  float S = max(vScl.x, 1e-3);
  gUse = 1.; gCid = aux.z; gCell = vec2(0.);
  if (d > 0.) { gAlpha = 0.; return; }
  float band = ruyiInner(q, d, aux.x);
  gIn *= S; gPeriod *= S; gOut = -d * S;
  gCol = stormBand(band, aux.y, aux.z);
  gAvg = stormBand(1., aux.y, aux.z); gSize = S;
}
// (8) the spiral arm: p.x runs along the arm (metres), p.y across (-1..1). Nested bands with gold wires.
void patBands(vec2 p, vec3 aux){
  float a = abs(p.y), hw = max(aux.x, 1.);           // half width in metres
  float n = 3.;
  float e = (1. - a) * n;                             // 0 at the edge, n at the spine
  float band = min(floor(e), n - 1.);
  gOut = min(1. - a, abs(a - (1. - 1. / n))) * hw;
  gIn = abs(a - (1. - 2. / n)) * hw;
  // comma-shaped scallops along the spine band
  float L = hw * 1.3, k = p.x, kf = fract(k) - .5;
  if (band > 1.5) { float r = length(vec2(kf * L, (p.y) * hw + hw * .34 * sign(p.y + 1e-4))); gIn = min(gIn, abs(r - hw * .30)); }
  gPeriod = hw / n; gUse = 1.; gCid = h11(floor(k) + band * 3.); gCell = vec2((floor(k) + .5) * L, 0.);
  gCol = band < .5 ? uWhite : (band < 1.5 ? uCeladon : mix(uLapis, uNavy, step(.5, gCid) * .6));
  if (aux.y < .5) gCol = mix(gCol, uLapis, band < .5 ? .2 : .55);
  gAvg = mix(uCeladon, uLapis, .3); gSize = hw;
}
// (9) the hub: navy eye, concentric lapis rings and a three-armed wire spiral that turns
void patEye(vec2 q){
  float r = length(q), th = satan(q.y, q.x);
  gUse = 1.; gCell = vec2(0.);
  if (r > 1.) { gAlpha = 0.; return; }
  float rings = abs(fract(r * 3. + .5) - .5) / 3.;
  float sp = r * 1.6 - th * 3. / 6.2831853 + uTime * .05;
  float sw = abs(fract(sp) - .5) / 1.6 * (.3 + r);
  gOut = min(1. - r, rings) * uPatScale; gIn = (r > .34 ? sw : rings) * uPatScale; gPeriod = uPatScale * .3;
  float band = floor(r * 3.), par = mod(floor(sp + .5), 2.);
  gCid = h11(band + par * 5.);
  gCol = band < .5 ? mix(uNavy, uLapis, .15) : mix(uNavy, uLapis, .3 + par * (.3 + .2 * band));
  if (band > 1.5) gCol = mix(gCol, uCeladon, par * .6);
  gSize = uPatScale;
}
// (2) scale-arcs (seigaiha) for the sea: concentric arcs in overlapping fans, radius uPatScale
void patScales(vec2 p, float R){
  float rh = R * .5, jr = floor(p.y / rh), minOut = 1e4, n = 4.;
  bool found = false; gOut = 1e4; gIn = 1e4; gPeriod = R / n; gUse = 0.; gCol = vec3(1.); gSize = R;
  for (int jj = -2; jj <= 2; jj++) {
    if (found) continue;
    float j = jr + float(jj);
    float off = mod(j, 2.) * R;
    vec2 c = vec2(floor((p.x - off) / (2. * R) + .5) * 2. * R + off, j * rh);
    float r = length(p - c);
    if (r < R) {
      found = true;
      float band = floor(r / R * n);
      gIn = abs(fract(r / R * n + .5) - .5) * R / n; gOut = min(minOut, R - r);
      gCid = h21(c * .13 + 1.7); gCell = c;
      gCol = band > 2.5 ? vec3(1.) : (band > 1.5 ? vec3(.80, .86, .90) : (band > .5 ? vec3(.62, .72, .86) : vec3(.86, .93, .95)));
      if (band > 2.5 && gCid > 1. - uCrestFoam) { gUse = 1.; gCol = uWhite; }
    } else minOut = min(minOut, r - R);
  }
}
// (3) filler: one small C-scroll per cell, drawn at 40 percent
void patFiller(vec2 p){
  float G = uPatScale; vec2 id = floor(p / G), f = fract(p / G) - .5;
  float hs = h21(id + 2.2); f -= (vec2(hs, h21(id + 9.1)) - .5) * .18;
  float r = length(f), pitch = .13, hand = hs > .5 ? 1. : -1.;
  float sp = r / pitch + hand * satan(f.y, f.x) / 6.2831853 + hs * 5.;
  gOut = 1e4; gIn = (r < .40 ? abs(fract(sp) - .5) * pitch : r - .40 + pitch * .5) * G;
  gPeriod = pitch * G; gFill = .4; gUse = 0.; gCol = vec3(1.); gCid = hs; gCell = (id + .5) * G;
}
// (4) brick: running bond, uPatScale = brick length
void patBrick(vec2 p){
  float L = uPatScale, H = L * .32, row = floor(p.y / H);
  float x = p.x + mod(row, 2.) * L * .5, col = floor(x / L);
  vec2 f = vec2(x - col * L, p.y - row * H);
  gOut = 1e4; gIn = min(min(f.x, L - f.x), min(f.y, H - f.y)); gPeriod = H; gFill = .7; gUse = 0.;
  gCid = h21(vec2(col, row)); gCell = vec2((col + .5) * L, (row + .5) * H);
  gCol = vec3(.82 + .3 * gCid, .84 + .22 * h11(gCid * 9.), .9 + .15 * gCid);
}
// (5) round roof tile: columns with scalloped ends, uPatScale = tile width
void patTile(vec2 p){
  float W = uPatScale, L = W * 1.6, col = floor(p.x / W), row = floor(p.y / L);
  vec2 f = vec2(p.x - (col + .5) * W, p.y - row * L);
  float arc = abs(length(f) - W * .5);
  gOut = 1e4; gIn = min(.5 * W - abs(f.x), f.y < W * .5 ? arc : f.y - W * .5 + .02 * W); gPeriod = W; gFill = .7; gUse = 0.;
  gCid = h21(vec2(col, row)); gCell = vec2((col + .5) * W, (row + .5) * L);
  gCol = vec3(.86 + .22 * gCid);
}
// (6) net: diamond lattice of wire, cells cut away; uPatScale = mesh size close to (px = metres per pixel)
void patNet(vec2 p, float px){
  // a size ladder like the sea's: the mesh doubles with distance so its period never drops under ~12 pixels
  // (every wire of a coarser step is also a wire of the finer one, so the change only drops alternate wires)
  float mesh = uPatScale * exp2(ceil(log2(max(12. * px / max(uPatScale, 1e-4), 1.))));
  vec2 k = vec2(p.x + p.y * .6, p.x - p.y * .6) / mesh;
  vec2 f = abs(fract(k + .5) - .5);
  gOut = min(f.x, f.y) * mesh * .7; gIn = 1e4; gPeriod = mesh; gUse = 0.; gCol = vec3(1.); gSize = mesh;
  gCid = h21(floor(k)); gCell = p; gAlpha = -1.;      // -1: keep only the wire
}
`;

const GLSL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime, uSpin, uDrift, uPatScale;
uniform vec2 uPatOffset;
uniform vec4 uLay;
attribute vec3 aCol;
#ifdef HAS_EDGE
attribute vec3 aEdge; attribute vec4 aCell;
#endif
#ifdef HAS_SWAY
attribute float aSway;
#endif
#if VMODE == 1 || VMODE == 3 || VMODE == 8
attribute vec4 aLay;
#endif
#if VMODE == 2 || VMODE >= 5
attribute vec4 iA, iB;
#endif
#if VMODE >= 5
attribute vec4 iC;
#endif
uniform vec4 uCam;        // xy = camera world xz, z = trip progress, w = spare
uniform vec4 uSea;        // x = swell amplitude, y = z of the harbour mouth (calm beyond), z = calm share
uniform vec4 uFront;      // the dark front (as in the fragment shader): shutters swing shut behind it
varying vec3 vW, vN, vCol, vCellW;
varying vec2 vUv, vScl;
varying vec3 vEdge3; varying float vCellId;
varying vec4 vLay;
varying vec3 vAux;
const float RC = ${RC}.0;
vec3 wallMap(vec2 sy, float depth){ float a = sy.x / RC, r = RC + depth; return vec3(r * sin(a), sy.y, RC - r * cos(a)); }
vec3 wallNrm(float s){ float a = s / RC; return vec3(-sin(a), 0., cos(a)); }
vec2 spiralP(float t, float arm){
  float ph = uSpin + arm * 3.14159265 + t * 8.6;
  float r = 75. * exp(1.9 * t), sx = mix(1.25, 2.7, smoothstep(0., 1., t));
  return vec2(r * cos(ph) * sx, r * sin(ph)) + vec2(0., ${HUB_Y}.0);
}
void main(){
  vec3 pos = position, nrm = normal;
  vCol = aCol; vEdge3 = vec3(1e3); vCellId = 0.; vLay = uLay; vAux = vec3(0.); vScl = vec2(1.);
  vec2 puv = uv;
  vec3 cellL = position;
#ifdef HAS_EDGE
  vEdge3 = aEdge; cellL = aCell.xyz; vCellId = aCell.w;
#endif
#if VMODE == 1
  vLay = aLay;
  puv = position.xy + vec2(uDrift * (1. + aLay.w * .4), 0.);
  pos = wallMap(position.xy, position.z); nrm = wallNrm(position.x); cellL = pos;
#elif VMODE == 3
  float t = position.x, arm = aLay.x;
  vec2 c0 = spiralP(t, arm), c1 = spiralP(t + .004, arm);
  vec2 tg = c1 - c0; tg /= max(length(tg), 1e-4);
  vec2 nn = vec2(-tg.y, tg.x);
  float hw = (75. * exp(1.9 * t)) * .29 + 12.;
  hw *= smoothstep(0., .05, t) * (1. - .7 * smoothstep(.8, 1., t));
  vec2 sy = c0 + nn * position.y * hw;
  pos = wallMap(sy, position.z - 14. * (1. - position.y * position.y)); nrm = wallNrm(sy.x); cellL = pos;
  puv = vec2(t * 45., position.y); vAux = vec3(hw, aLay.y, 0.); vScl = vec2(hw * 1.3, hw);
#elif VMODE == 2
  vec2 cen = iA.xy; float roll = iB.x, sd = iB.y, size = iA.w;
  if (iB.z >= 0.) {
    vec2 c0 = spiralP(iB.z, iB.w), c1 = spiralP(iB.z + .004, iB.w);
    vec2 tg = c1 - c0; tg /= max(length(tg), 1e-4);
    vec2 nn = vec2(-tg.y, tg.x);
    float rr = 75. * exp(1.9 * iB.z);
    size *= (rr * .29 + 12.) * smoothstep(0., .05, iB.z) * (1. - .45 * smoothstep(.8, 1., iB.z));
    float side = clamp(roll, -1., 1.);
    cen = c0 + nn * side * size * .55;
    vec2 up = nn * side + tg * .55;
    roll = atan(-up.x, up.y);
  }
  roll += sin(uTime * .45 + sd * 40.) * .16;
  float lean = .22 + .2 * sin(uTime * .33 + sd * 23.);
  float cr = cos(roll), sr = sin(roll);
  vec2 lp = position.xy * size;
  vec2 sy = cen + vec2(cr * lp.x - sr * lp.y, sr * lp.x + cr * lp.y);
  pos = wallMap(sy, iA.z - position.z * size - max(position.y, -.3) * size * lean);
  vec3 wn = wallNrm(cen.x), wt = vec3(wn.z, 0., -wn.x);
  nrm = normalize(wn + wt * (fract(sd * 7.13) - .42) * 2.6 + vec3(0., lean - .1, 0.));
  cellL = wallMap(cen, iA.z);
  puv = position.xy; vScl = vec2(size);
  vAux = vec3(sd * 7. + uTime * (.09 + .08 * fract(sd * 3.7)), clamp(.35 + cen.y / 1100. + (fract(sd * 5.3) - .5) * .5, 0., 1.), sd);
  vCellId = sd;
#endif
#if VMODE == 5
  // critters. iA = anchor xyz + heading, iB = speed, range, phase, kind, iC = size, flap rate, flap amplitude, spare.
  // kind 0 streaming flyer, 1 circling hunter, 2 percher that opens its wings as the camera nears, 3 paddler, 4 leaper
  {
    float kind = iB.w, ph = iB.z, hd = iA.w, show = 1., fold = 1., tiltB = 0.;
    vec3 c = iA.xyz;
    float flap = sin(uTime * iC.y + ph * 40.) * iC.z;
    if (kind < .5) {
      float sK = mod(iB.x * uTime + ph * iB.y, max(iB.y, 1.)) - .5 * iB.y;
      c.xz += vec2(sin(hd), cos(hd)) * sK + vec2(cos(hd), -sin(hd)) * sin(uTime * .31 + ph * 20.) * 4.;
      c.y += sin(uTime * .7 + ph * 9.) * 1.5;
    } else if (kind < 1.5) {
      float a = uTime * iB.x / max(iB.y, 1.) + ph * 6.2831853;
      c.xz += vec2(sin(a), .6 * cos(a)) * iB.y; c.y += sin(a * 3.) * .9;
      hd += atan(cos(a), -.6 * sin(a) + 1e-4);
    } else if (kind < 2.5) {
      float nearK = 1. - smoothstep(14., 44., distance(uCam.xy, c.xz));
      flap = nearK * (1.0 + .14 * sin(uTime * 2.3 + ph * 30.)); tiltB = 1.15;
    } else if (kind < 3.5) {
      float sK = mod(iB.x * uTime + ph * iB.y, max(iB.y, 1.));
      c.xz += vec2(sin(hd), cos(hd)) * sK; c.y += sin(uTime * 1.9 + ph * 30.) * .04; fold = .25; flap = .0;
    } else if (kind < 4.5) {
      float sK = fract(uTime * iB.x + ph); show = step(sK, .34); sK /= .34;
      c.xz += vec2(sin(hd), cos(hd)) * sK * iB.y; c.y += sin(sK * 3.14159) * 1.5 - .25; tiltB = -cos(sK * 3.14159) * .7; flap = .3;
    } else if (kind < 5.5) {
      // 5: a modelled percher (cormorant): wings tucked until the camera nears, then spread wide to dry
      float nearK = 1. - smoothstep(14., 46., distance(uCam.xy, c.xz));
      fold = mix(.1, 1., nearK); flap = nearK * (.2 + .12 * sin(uTime * 2.3 + ph * 30.)) - (1. - nearK) * .55;
    } else {
      // 6: a modelled paddler (duck)
      float sK = mod(iB.x * uTime + ph * iB.y, max(iB.y, 1.));
      c.xz += vec2(sin(hd), cos(hd)) * sK; c.y += sin(uTime * 1.9 + ph * 30.) * .03; flap = 0.;
      tiltB = sin(uTime * 1.3 + ph * 50.) * .06;
    }
    float szK = max(iC.x, distance(c, cameraPosition) * .0021) * show;
    float solid = step(4.5, kind), axK = abs(position.x), wingK = mix(axK, max(axK - .2, 0.), solid);
    vec3 q = vec3(sign(position.x) * (axK - wingK + wingK * fold), position.y + wingK * flap, position.z);
    q.x *= 1. - .25 * min(flap * flap, 1.) * (1. - solid);
    float ct = cos(tiltB), st = sin(tiltB);
    q = vec3(q.x, q.y * ct + q.z * st, q.z * ct - q.y * st);
    float ch = cos(hd), sh = sin(hd);
    pos = c + vec3(q.x * ch + q.z * sh, q.y, -q.x * sh + q.z * ch) * szK;
    nrm = normalize(vec3(-sign(position.x) * flap * ch, 1., sign(position.x) * flap * sh));
    if (solid > .5) nrm = normalize(vec3(normal.x * ch + normal.z * sh, normal.y + 1e-4, -normal.x * sh + normal.z * ch));
    cellL = c; vCellId = fract(ph * 7.31);
    vCol = aCol * (iC.w < .5 ? vec3(1.) : (iC.w < 1.5 ? vec3(.10, .14, .28) : vec3(.55, .40, .22)));
#ifdef HAS_EDGE
    vEdge3 = aEdge * szK;
#endif
  }
#elif VMODE == 6
  // beads: a ballistic loop. iA = origin xyz + phase, iB = velocity xyz + life, iC = size, gravity, duty, spare
  float bS = 1.;
  vec3 bC = iA.xyz;
  {
    float life = max(iB.w, .1), sK = fract(uTime / life + iA.w), duty = clamp(iC.z, .05, 1.);
    float on = step(sK, duty); sK /= duty; float tl = sK * life * duty;
    bC += iB.xyz * tl + vec3(0., -.5 * iC.y * tl * tl, 0.);
    bS = iC.x * on * (1. - sK * sK * sK);
    pos = bC; cellL = bC; vCellId = fract(iA.w * 5.7);
  }
#elif VMODE == 7
  // lanterns: upright billboards hung from iA.xyz, swinging. iA.w = phase, iB = lit-from progress, swing, size, glow
  float bS = 1.;
  vec3 bC = iA.xyz;
  pos = bC; cellL = bC; vCellId = fract(iA.w * 5.7);
  vAux.z = smoothstep(iB.x, iB.x + .02, uCam.z + 1e-4) * iB.w * (.86 + .14 * sin(uTime * 5.3 + iA.w * 50.));
#elif VMODE == 8
  // free scroll heads on plain quads (uv spans the head, about -1..1). aLay = size m, seed, tone, spare
  vScl = vec2(max(aLay.x, 1e-3)); vCellId = aLay.y;
  vAux = vec3(aLay.y * 7. + uTime * (.09 + .08 * fract(aLay.y * 3.7)), aLay.z, aLay.y);
#endif
  vec4 lp4 = vec4(pos, 1.), lc4 = vec4(cellL, 1.);
#ifdef USE_INSTANCING
  lp4 = instanceMatrix * lp4; lc4 = instanceMatrix * lc4; nrm = mat3(instanceMatrix) * nrm;
#endif
  vec4 wp = modelMatrix * lp4;
#ifdef HAS_SWAY
  float ph = uTime * 3.1 + wp.x * .31 + wp.z * .27 + position.y * .9;
  wp.xyz += vec3(sin(ph), .25 * sin(ph * 1.7), cos(ph * .8)) * max(aSway, 0.);
#ifdef HAS_EDGE
  if (aSway < -.5) {
    // a shutter leaf hinged on the vertical through its cell centre (aSway -1 / -2 = which way it swings):
    // open until the dark front reaches it, then it swings shut
    vec3 hgK = (modelMatrix * lc4).xyz;
    float sFK = dot(hgK.xz, uFront.xy) - uFront.z + (aCell.w - .5) * 26.;
    float shutK = uFront.w * (1. - smoothstep(-42., 4., sFK));
    float angK = (aSway < -1.5 ? -1. : 1.) * (1.2 + .8 * fract(aCell.w * 7.3)) * (1. - shutK);
    vec2 dK = wp.xz - hgK.xz; float cK = cos(angK), sK2 = sin(angK);
    wp.xz = hgK.xz + vec2(dK.x * cK + dK.y * sK2, -dK.x * sK2 + dK.y * cK);
  }
#endif
#endif
#if VMODE == 4
  // the sea: three swell waves running north, calm inside the harbour; the normal follows the swell
  {
    float amp = uSea.x * mix(uSea.z, 1., smoothstep(uSea.y - 45., uSea.y + 30., wp.z));
    float p1 = wp.z * .105 + uTime * 1.0, p2 = (wp.z * .95 - wp.x * .3) * .19 + uTime * 1.35 + 1.7, p3 = (wp.z * .9 + wp.x * .44) * .41 + uTime * 2.0 + 4.1;
    wp.y += amp * (.55 * sin(p1) + .3 * sin(p2) + .12 * sin(p3));
    float dz = amp * (.55 * .105 * cos(p1) + .3 * .19 * .95 * cos(p2) + .12 * .41 * .9 * cos(p3));
    float dx = amp * (-.3 * .19 * .3 * cos(p2) + .12 * .41 * .44 * cos(p3));
    nrm = normalize(vec3(-dx, 1., -dz));
  }
#endif
#if VMODE == 6 || VMODE == 7
  {
    vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    float dK = distance(wp.xyz, cameraPosition);
#if VMODE == 6
    float szK = max(bS, dK * .0016 * step(1e-4, bS));
    wp.xyz += (cr * position.x + cu * position.y) * szK;
#else
    float szK = max(iB.z, dK * .0030), aK = sin(uTime * 1.7 + iA.w * 30.) * iB.y;
    vec2 qK = vec2(position.x * cos(aK) - position.y * sin(aK), position.x * sin(aK) + position.y * cos(aK)) * szK;
    cr = normalize(vec3(cr.x, 0., cr.z) + vec3(1e-5, 0., 0.));
    wp.xyz += cr * qK.x + vec3(0., qK.y, 0.);
#endif
#ifdef HAS_EDGE
    vEdge3 = aEdge * szK;
#endif
    nrm = normalize(cameraPosition - wp.xyz + vec3(0., .35 * dK, 0.));
  }
#endif
  vW = wp.xyz; vCellW = (modelMatrix * lc4).xyz;
  vN = normalize(mat3(modelMatrix) * nrm + vec3(0., 1e-5, 0.));
#ifdef COORDS_WORLD
  puv = wp.xz;
#endif
#if VMODE == 4
  puv = vec2(wp.x, -wp.z);
#endif
  vUv = puv + uPatOffset;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const GLSL_FRAG_HEAD = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime, uSeed, uPatScale, uWire, uRoll, uDrift, uCrestFoam, uFogAmt, uSpec, uEmis, uCellSize;
uniform vec2 uGraze;      // GRAZE_FADE: |N.V| range over which a sheet's wires and pattern come in
uniform vec3 uSun, uWhite, uCeladon, uTurq, uLapis, uNavy, uGold, uRed;
uniform vec4 uGlint;      // xy = sweep direction (world xz), z = speed m/s, w = spacing m
uniform vec4 uFront;      // xy = direction (world xz), z = offset m, w = 1 on: cells behind the line flood to lapis
uniform vec4 uFlash;      // xyz = world position of the lightning, w = intensity 0..1
uniform vec3 uFlashUv;    // the same in wall coordinates (s, y, radius)
uniform vec4 uPale;       // rgb = pale distance tone, w = metres per step (0 = off)
uniform vec4 uShaft;      // xy = unit normal of the sun stripe (world xz), z = strength, w = half width m (0 = off)
uniform vec4 uShaftB;     // xy = centre of the stripe (world xz), z = reach m
uniform vec4 uCam;
uniform vec4 uFlood;      // rgb = the tone cool cells flood to behind the dark front, w = how far (0..1)
uniform vec4 uFloodB;     // z = 1: blue-and-white flood, cell by cell: each cell floods by x or by y (w is then unused)
varying vec3 vW, vN, vCol, vCellW;
varying vec2 vUv, vScl;
varying vec3 vEdge3; varying float vCellId;
varying vec4 vLay;
varying vec3 vAux;
`;
const GLSL_FRAG_MAIN = /* glsl */`
void main(){
  // derivatives once, before any loop
  float vEdge = min(vEdge3.x, min(vEdge3.y, vEdge3.z));
  vec2 fw = fwidth(vUv) * vScl;
  float px = max(max(fw.x, fw.y), 1e-5);
  float ePx = max(fwidth(vEdge), 1e-5);
  vec3 dpx = dFdx(vW), dpy = dFdy(vW);

  gCol = vec3(1.); gUse = 0.; gOut = 1e4; gIn = 1e4; gPeriod = 1e4; gFill = 1.; gCid = vCellId; gAlpha = 1.; gCell = vUv;
  gAvg = vec3(-1.); gSize = 1e4;
#if PATTERN == 1
  patRuyi(vUv, vLay);
#elif PATTERN == 2
  // the sea: the same scale-arcs at three sizes, each drawn only where it is between ~3 and ~35 pixels, so the
  // near water has small arcs, the far water large ones, and the change is a cross-fade of wire width
  float seaW = 0., seaT = 4., seaCid = 0., seaAcc = 0., seaBi = 0.; vec3 seaC = vec3(0.); vec2 seaCell = vUv;
  {
    float R = uPatScale;
    vec3 avg = vCol * vec3(.80, .86, .90);
    for (int k = 0; k < 3; k++) {
      patScales(vUv, R);
      float v = smoothstep(2.5, 7., R / px);
      if (k > 0) v *= 1. - smoothstep(12.5, 35., R / px);
      float hw = max(uWire * .5 * (1. + 1.5 * float(k)), .75 * px), aa = px / hw * .7;
      float vi = smoothstep(3.5, 7.5, gPeriod / px) * v;
      float mo = (1. - smoothstep(1. - aa, 1. + aa, gOut / hw)) * v;
      float mi = (1. - smoothstep(1. - aa, 1. + aa, gIn / (hw * .8))) * vi * .75;
      seaW = max(seaW, max(mo, mi));
      seaT = min(seaT, min(mix(4., gOut / hw, v), mix(4., gIn / (hw * .8), vi)));
      vec3 ck = mix(vCol * gCol, gCol, gUse);
      ck = mix(ck, mix(ck, uLapis, .35), step(.82, gCid) * (1. - gUse));
      ck = mix(avg, ck, max(vi, gUse * v));
      float wK = v * (1. - seaAcc);
      seaC += ck * wK; seaBi += step(.45, fract(gCid * 7.31 + .13)) * wK; seaAcc += wK;
      if (k == 0) { seaCid = gCid; seaCell = gCell; }
      R *= 5.;
    }
    seaC += avg * (1. - seaAcc); seaBi += .68 * (1. - seaAcc);
    gOut = 1e4; gIn = 1e4; gPeriod = 1e4; gUse = 1.; gCol = seaC; gCid = seaCid; gCell = seaCell; gSize = 1e4;
  }
#elif PATTERN == 10
  // contour bands on terrain: a wire along every uPatScale metres of height, a tint per band
  {
    float e = vW.y / uPatScale, gK = max(length(vec2(dpx.y, dpy.y)) / uPatScale, 1e-6);
    float bandK = floor(e);
    gIn = abs(fract(e + .5) - .5) / gK * px; gPeriod = px / gK; gFill = .75; gUse = 0.;
    gCid = h11(bandK * .37 + 3.1); gCell = vec2(bandK * 7., 0.);
    gCol = vec3(.80 + .34 * gCid, .84 + .28 * h11(bandK * 1.7 + .3), .84 + .30 * gCid);
    float tK = mod(bandK, 3.);
    gCol *= tK < .5 ? vec3(1.) : (tK < 1.5 ? vec3(.84, 1.02, 1.08) : vec3(.66, .84, 1.16));
  }
#elif PATTERN == 11
  // a single wire along uv.y = 0 (cords, stays, sheets): uv.y is metres from the centre line
  gOut = abs(vUv.y); gAlpha = -1.; gUse = 0.;
#elif PATTERN == 3
  patFiller(vUv);
#elif PATTERN == 4
  patBrick(vUv);
#elif PATTERN == 5
  patTile(vUv);
#elif PATTERN == 6
  patNet(vUv, px);
#elif PATTERN == 7
  patVolute(vUv, vAux);
#elif PATTERN == 8
  patBands(vUv, vAux);
#elif PATTERN == 9
  patEye(vUv / max(uPatScale, 1e-3));
#endif
  if (gAlpha == 0.) discard;

  // wires: normalised coordinate t (0 on the centre line, 1 at the bead's edge)
  float hwP = max(uWire * .5, .75 * px), hwE = max(uWire * .5, .75 * ePx);
  float vis = smoothstep(3.5, 7.5, gPeriod / px);
  float visE = smoothstep(2.5, 6., uCellSize / ePx);
  float tO = gOut / hwP, tI = gIn / (hwP * .8), tE = vEdge / hwE;
  float aaP = px / hwP * .7, aaE = ePx / hwE * .7;
  float visO = smoothstep(2.5, 7., gSize / px);
  float mO = (1. - smoothstep(1. - aaP, 1. + aaP, tO)) * visO;
  float mI = (1. - smoothstep(1. - aaP, 1. + aaP, tI)) * vis * gFill;
  float mE = (1. - smoothstep(1. - aaE, 1. + aaE, tE)) * visE;
  float wire = max(max(mO, mI), mE);
  float t = min(min(mix(4., tO, visO), mix(4., tE, visE)), mix(4., tI, vis));
#if PATTERN == 2
  wire = seaW; t = seaT;
#endif
  if (gAlpha < 0. && wire < .5) discard;        // nets, cords: only the wire itself is ever drawn

  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  vec3 L = uSun, H = normalize(L + V + vec3(0., 1e-4, 0.));

  // round bead: bend the normal across the wire along the surface gradient of t
  float gx = dFdx(t), gy = dFdy(t);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  vec3 grad = gx * r1 + gy * r2; grad *= sign(dot(dpx, r1) + 1e-12);
  float gl2 = length(grad);
  vec3 T = gl2 > 1e-9 ? grad / gl2 : vec3(0.);
  float tc = clamp(t, 0., 1.);
  vec3 Nb = normalize(N * sqrt(max(1. - tc * tc, 0.)) + T * tc + N * 1e-3);

  // enamel cell: flat, two tones by facing, broad gloss, pooled mottling, pinprick pits
  if (gAvg.x >= 0.) {
#ifdef GRAZE_FADE
    // sheets seen from below at a slant: their nested bands settle to the average well before they alias
    gCol = mix(gAvg, gCol, smoothstep(2.2, 5., gPeriod / px));
#else
    gCol = mix(gAvg, gCol, smoothstep(.8, 2.4, gPeriod / px));
#endif
    gCol = mix(mix(uCeladon, uLapis, .3), gCol, smoothstep(.7, 2.2, gSize / px));
  }
  vec3 cell = mix(vCol * gCol, gCol, gUse);
  vec2 cellP = gCell;
  float fl = uFlash.w * (1. - smoothstep(.25, 1., distance(vCellW, uFlash.xyz) / max(uFlashUv.z, 1.) + (gCid - .5) * .35));
#if PATTERN == 9
  fl *= .2;
#endif
#if PATTERN == 1
  if (vLay.w >= 0.) fl = uFlash.w * (1. - smoothstep(.25, 1., distance(gCell - vec2(uDrift * (1. + floor(vLay.w + .5) * .4), 0.), uFlashUv.xy) / max(uFlashUv.z, 1.) + (gCid - .5) * .35));
#endif
  float shaft = 0.;
  if (uShaft.w > 0.) {
    vec2 dq = vCellW.xz - uShaftB.xy;
    shaft = step(abs(dot(dq, uShaft.xy)) + (gCid - .5) * 6., uShaft.w) * step(length(dq) + (gCid - .5) * 30., uShaftB.z) * uShaft.z;
  }
  if (uFront.w > .5) {
    float sF = dot(vCellW.xz, uFront.xy) - uFront.z + (gCid - .5) * 26.;
    // only the cool cells flood to lapis; reds (sails, lanterns, brick) just sink a little
    float redK = smoothstep(.06, .3, cell.r - max(cell.g, cell.b));
    float fAmt = uFlood.w;
    if (uFloodB.z > .5) {
      // porcelain: a cell floods nearly all the way or hardly at all (the sea by scale-fan, plain cells by cell id;
      // fine patterns take the mean, so nothing speckles at distance)
      float bi = .68;
#if PATTERN == 0
      bi = step(.45, fract(gCid * 7.31 + .13));
#elif PATTERN == 2
      bi = seaBi;
#endif
      fAmt = mix(uFloodB.x, uFloodB.y, bi);
    }
    if (sF < 0.) cell = mix(cell, mix(uFlood.rgb * (.45 + dot(cell, vec3(.3, .5, .2))), cell * .8, redK), fAmt * uFront.w * (1. - shaft));
  }
  cell *= 1. + .3 * shaft; cell += vec3(.07, .05, .0) * shaft;
  float lit = step(-.05, dot(N, L));
  cell *= mix(vec3(.50, .58, .74), vec3(1.), lit);
  float mott = vnoise(vUv * vScl * .021 + gCid * 31.) + .5 * vnoise(vUv * vScl * .09 + 7.);
  cell *= .93 + .09 * mott;
  float pitF = 1. - smoothstep(.15, .5, px);
  cell *= 1. - .22 * pitF * step(.988, h21(floor(vUv * vScl * 2.3) + .5));
  float gloss = pow(max(dot(N, H), 0.), 14.) * .13 + pow(1. - max(dot(N, V), 0.), 3.) * .05;
  cell += vec3(gloss) * lit;
  cell = mix(cell, uWhite * 1.3, clamp(fl, 0., 1.) * .8);
  if (uPale.w > 0.) cell = mix(cell, uPale.rgb, floor(min(dist / uPale.w, 3.)) / 3. * .55);

  // gold wire: lit bead, tight highlight, travelling glint band
  float band = mod(dot(vW.xz, uGlint.xy) - uTime * uGlint.z, max(uGlint.w, 1.)) - .5 * uGlint.w;
  float glint = exp(-band * band / 3600.);
  float kd = .20 + .58 * max(dot(Nb, L), 0.);
  float spec = pow(max(dot(Nb, H), 0.), 200.) * uSpec;
  float fillB = mix(gFill, 1., max(mO, mE));
  vec3 wcol = uGold * (kd + 1.6 * glint) * fillB + vec3(1., .86, .55) * spec * (1. + 3. * glint) * fillB;
  wcol += vec3(1., .9, .7) * fl * .8;
  // inner wires fading below the footprint leave a trace of their average colour in the cell
  cell *= 1. + uGold * .22 * max((1. - vis) * step(gPeriod, 9e3), (1. - visE) * step(vEdge, 9e2) * .6);
#ifdef GRAZE_FADE
  // a sheet seen nearly edge-on (the overhead arm from far off): its pattern settles to the average colour
  // and its wires stop glittering
  {
    float gzK = smoothstep(uGraze.x, uGraze.y, abs(dot(N, V)));
    wire *= gzK;
    if (gAvg.x >= 0.) cell = mix(gAvg * mix(vec3(.50, .58, .74), vec3(1.), lit), cell, gzK);
  }
#endif
#if VMODE == 7
  vec3 col = mix(cell, wcol, wire) + vCol * uEmis * vAux.z;
#else
  vec3 col = mix(cell, wcol, wire) + vCol * uEmis;
#endif
  if (gAlpha < 0.) col = wcol;                     // wire-only patterns never show a cell colour

  gl_FragColor = vec4(max(col, 0.), 1.);
  vec3 pre = gl_FragColor.rgb;
  #include <fog_fragment>
  gl_FragColor.rgb = max(mix(pre, gl_FragColor.rgb, uFogAmt), 0.);
}
`;

// ---------------------------------------------------------------------------------------------
// The material system. One set of shared uniforms, one shader, compiled per pattern / vertex mode.
// ---------------------------------------------------------------------------------------------
export function createEnamel(opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const v3 = (c) => new THREE.Vector3(c.r, c.g, c.b);
  const celadon = pal[0].clone().lerp(pal[3], 0.5);
  const shared = {
    uTime: { value: 0 }, uSeed: { value: opts.seed ?? 0.37 }, uSpin: { value: 0 }, uDrift: { value: 0 },
    uSun: { value: (opts.sun ? opts.sun.clone() : new THREE.Vector3(-0.52, 0.31, 0.8)).normalize() },
    uWhite: { value: v3(pal[3]).multiplyScalar(0.8) }, uCeladon: { value: v3(celadon).multiplyScalar(0.9) }, uTurq: { value: v3(pal[0]) },
    uLapis: { value: v3(pal[1]) }, uNavy: { value: v3(pal[5]) }, uGold: { value: v3(pal[4]) }, uRed: { value: v3(pal[2]) },
    uGlint: { value: new THREE.Vector4(1, 0, 900 / 7, 900) },
    uFront: { value: new THREE.Vector4(1, 0, 0, 0) },
    uFlash: { value: new THREE.Vector4(0, 0, 0, 0) }, uFlashUv: { value: new THREE.Vector3(0, 0, 420) },
    uPale: { value: new THREE.Vector4(0.8, 0.92, 0.9, 0) },
    uShaft: { value: new THREE.Vector4(0, 1, 1, 0) }, uShaftB: { value: new THREE.Vector4(0, 0, 200, 0) },
    uFlood: { value: new THREE.Vector4(pal[1].r, pal[1].g, pal[1].b, 0.78) }, uFloodB: { value: new THREE.Vector4(0, 0, 0, 0) },
    uCam: { value: new THREE.Vector4(0, 0, 0, 0) }, uSea: { value: new THREE.Vector4(1, -50, 0.12, 0) },
    uFogAmt: { value: opts.fogAmount ?? 0.06 },
  };
  const mats = [];
  function material(o = {}) {
    const defines = { PATTERN: PATTERNS[o.pattern ?? 'none'] ?? 0, VMODE: o.vmode ?? 0 };
    if (o.edge) defines.HAS_EDGE = 1;
    if (o.sway) defines.HAS_SWAY = 1;
    if (o.coords === 'worldXZ') defines.COORDS_WORLD = 1;
    if (o.graze) defines.GRAZE_FADE = 1;
    const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uPatScale: { value: o.patScale ?? 1 }, uPatOffset: { value: new THREE.Vector2() }, uWire: { value: o.wire ?? 0.06 },
      uRoll: { value: o.roll ?? 1 }, uCrestFoam: { value: o.foam ?? 0.12 }, uSpec: { value: o.spec ?? 5 }, uEmis: { value: o.emissive ?? 0 }, uCellSize: { value: o.cellSize ?? 3 }, uGraze: { value: new THREE.Vector2(...(o.grazeRange ?? [0.10, 0.28])) }, uLay: { value: o.lay ? new THREE.Vector4(...o.lay) : new THREE.Vector4(100, 400, 0, 0) },
    }]);
    for (const k in shared) uniforms[k] = shared[k];          // shared by reference
    const m = new THREE.ShaderMaterial({
      defines, uniforms, fog: true, side: o.side ?? THREE.DoubleSide,
      vertexShader: GLSL_VERT, fragmentShader: GLSL_FRAG_HEAD + GLSL_LIB + GLSL_FRAG_MAIN,
    });
    mats.push(m);
    return m;
  }
  return { uniforms: shared, palette: pal, celadon, material, update(time) { shared.uTime.value = time; } };
}

// ---------------------------------------------------------------------------------------------
// enamelize: split a mesh into flat cells and write the attributes the enamel shader wants.
//   opts.angle    max angle (radians) between neighbouring faces of one cell (default 0.15)
//   opts.cellKey  (centre, normal, tri) => key : faces only join when their keys match
//   opts.color    (normal, centre, id, key) => THREE.Color for the cell (default: mean of 'color', or white)
//   opts.smooth   keep the mesh's own normals instead of one flat normal per cell
// Returns a new non-indexed geometry with position, normal, uv (if present), aCol, aEdge (vec3:
// distance to each of the triangle's edges that lies on the cell border) and aCell (centre, id).
// ---------------------------------------------------------------------------------------------
export function enamelize(geometry, opts = {}) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const P = g.attributes.position.array, nT = P.length / 9;
  const cosTol = Math.cos(opts.angle ?? 0.15);
  const srcCol = g.attributes.color ? g.attributes.color.array : null;
  const vid = new Int32Array(nT * 3), vmap = new Map();
  for (let i = 0; i < nT * 3; i++) {
    const k = Math.round(P[i * 3] * 500) + ',' + Math.round(P[i * 3 + 1] * 500) + ',' + Math.round(P[i * 3 + 2] * 500);
    let id = vmap.get(k); if (id === undefined) { id = vmap.size; vmap.set(k, id); } vid[i] = id;
  }
  const fn = new Float32Array(nT * 3), fc = new Float32Array(nT * 3), fa = new Float32Array(nT), keys = new Array(nT);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), ce = new THREE.Vector3();
  for (let t = 0; t < nT; t++) {
    a.fromArray(P, t * 9); b.fromArray(P, t * 9 + 3); c.fromArray(P, t * 9 + 6);
    n.subVectors(b, a).cross(ce.subVectors(c, a)); const ar = n.length() * 0.5; fa[t] = ar;
    if (ar > 1e-12) n.multiplyScalar(0.5 / ar); n.toArray(fn, t * 3);
    ce.copy(a).add(b).add(c).multiplyScalar(1 / 3); ce.toArray(fc, t * 3);
    keys[t] = opts.cellKey ? opts.cellKey(ce, n, t) : 0;
  }
  const parent = new Int32Array(nT); for (let t = 0; t < nT; t++) parent[t] = t;
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const emap = new Map(), VN = vmap.size + 1;
  const ekey = (t, e) => { const i = vid[t * 3 + e], j = vid[t * 3 + (e + 1) % 3]; return i < j ? i * VN + j : j * VN + i; };
  for (let t = 0; t < nT; t++) for (let e = 0; e < 3; e++) {
    const k = ekey(t, e), o = emap.get(k);
    if (o === undefined) { emap.set(k, [t]); continue; }
    for (const u of o) {
      if (keys[u] !== keys[t]) continue;
      const d = fn[u * 3] * fn[t * 3] + fn[u * 3 + 1] * fn[t * 3 + 1] + fn[u * 3 + 2] * fn[t * 3 + 2];
      if (d >= cosTol) { const ra = find(u), rb = find(t); if (ra !== rb) parent[ra] = rb; }
    }
    o.push(t);
  }
  // per cell: area-weighted centre, normal, colour
  const cells = new Map();
  for (let t = 0; t < nT; t++) {
    const r = find(t); let cl = cells.get(r);
    if (!cl) { cl = { id: cells.size, n: new THREE.Vector3(), c: new THREE.Vector3(), a: 0, col: new THREE.Color(0, 0, 0), key: keys[t] }; cells.set(r, cl); }
    const w = fa[t]; cl.a += w;
    cl.n.x += fn[t * 3] * w; cl.n.y += fn[t * 3 + 1] * w; cl.n.z += fn[t * 3 + 2] * w;
    cl.c.x += fc[t * 3] * w; cl.c.y += fc[t * 3 + 1] * w; cl.c.z += fc[t * 3 + 2] * w;
    if (srcCol) for (let v = 0; v < 3; v++) { cl.col.r += srcCol[(t * 3 + v) * 3] * w / 3; cl.col.g += srcCol[(t * 3 + v) * 3 + 1] * w / 3; cl.col.b += srcCol[(t * 3 + v) * 3 + 2] * w / 3; }
  }
  for (const cl of cells.values()) {
    const w = Math.max(cl.a, 1e-9); cl.c.multiplyScalar(1 / w); cl.n.normalize();
    if (srcCol) cl.col.multiplyScalar(1 / w); else cl.col.setRGB(1, 1, 1);
    if (opts.color) cl.col.copy(opts.color(cl.n, cl.c, cl.id, cl.key));
  }
  const aCol = new Float32Array(nT * 9), aEdge = new Float32Array(nT * 9).fill(1e3), aCell = new Float32Array(nT * 12);
  const N = g.attributes.normal ? g.attributes.normal.array : new Float32Array(nT * 9);
  for (let t = 0; t < nT; t++) {
    const r = find(t), cl = cells.get(r), hid = ((cl.id * 0.6180339) % 1);
    for (let e = 0; e < 3; e++) {
      const o = emap.get(ekey(t, e)); let border = true;
      for (const u of o) if (u !== t && find(u) === r) border = false;
      if (border) {
        const i0 = t * 9 + e * 3, i1 = t * 9 + ((e + 1) % 3) * 3, opp = (e + 2) % 3;
        const len = Math.hypot(P[i1] - P[i0], P[i1 + 1] - P[i0 + 1], P[i1 + 2] - P[i0 + 2]);
        const h = 2 * fa[t] / Math.max(len, 1e-9);
        for (let v = 0; v < 3; v++) aEdge[(t * 3 + v) * 3 + e] = v === opp ? h : 0;
      }
    }
    for (let v = 0; v < 3; v++) {
      const i = t * 3 + v;
      aCol[i * 3] = cl.col.r; aCol[i * 3 + 1] = cl.col.g; aCol[i * 3 + 2] = cl.col.b;
      aCell[i * 4] = cl.c.x; aCell[i * 4 + 1] = cl.c.y; aCell[i * 4 + 2] = cl.c.z; aCell[i * 4 + 3] = hid;
      if (!opts.smooth || !g.attributes.normal) { N[i * 3] = cl.n.x; N[i * 3 + 1] = cl.n.y; N[i * 3 + 2] = cl.n.z; }
    }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(aCol, 3));
  g.setAttribute('aEdge', new THREE.BufferAttribute(aEdge, 3));
  g.setAttribute('aCell', new THREE.BufferAttribute(aCell, 4));
  if (g.attributes.color) g.deleteAttribute('color');
  return g;
}

// tiny triangle-soup builder used for the junks (position + a cell key per triangle)
function soup() {
  const pos = [], keys = [];
  const tri = (a, b, c, key) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); keys.push(key); };
  const quad = (a, b, c, d, key) => { tri(a, b, c, key); tri(a, c, d, key); };
  const box = (cx, cy, cz, sx, sy, sz, key, taper = 1) => {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    const tx = sx / 2 * taper, tz = sz / 2 * taper;
    const A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1];
    const E = [cx - tx, y1, cz - tz], F = [cx + tx, y1, cz - tz], G = [cx + tx, y1, cz + tz], H = [cx - tx, y1, cz + tz];
    quad(A, E, F, B, key + ':a'); quad(B, F, G, C, key + ':b'); quad(C, G, H, D, key + ':c'); quad(D, H, E, A, key + ':d'); quad(E, H, G, F, key + ':t');
  };
  const geometry = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g; };
  return { tri, quad, box, keys, geometry };
}

// ---------------------------------------------------------------------------------------------
// Junk parts for the fleet: bow toward +Z, waterline at y = 0, 24 m long. ~330 triangles.
// Returns enamelized geometries: hull (hull, deck, cabin, masts, bow eyes) and sails (three batten
// sails and three pennants, with aSway for the material's sway option).
// ---------------------------------------------------------------------------------------------
export function makeJunkGeometries(rng, palette = DEFAULT_PALETTE) {
  const pal = palette.map((h) => new THREE.Color(h));
  const [turq, lapis, red, white, gold, navy] = pal;
  const hullS = soup(), NS = 8, HL = 12;
  const sec = (i) => {
    const zn = -1 + 2 * i / NS, z = zn * HL;
    const hb = 3.25 * (1 - 0.72 * Math.pow(Math.max(zn, 0), 2.2) - 0.28 * Math.pow(Math.max(-zn, 0), 2.6));
    const gy = 2.0 + 1.2 * zn * zn + (zn < 0 ? 2.0 : 0.9) * zn * zn;
    const ky = -0.7 + 1.5 * Math.abs(zn * zn * zn);
    return { z, hb, gy, ky, pts: [[hb, gy], [hb * 0.97, lerp(ky, gy, 0.62)], [hb * 0.8, lerp(ky, gy, 0.26)], [hb * 0.3, ky]] };
  };
  const S = []; for (let i = 0; i <= NS; i++) S.push(sec(i));
  for (let i = 0; i < NS; i++) {
    const a = S[i], b = S[i + 1];
    for (let k = 0; k < 3; k++) {
      for (const sd of [1, -1]) {
        const p0 = [a.pts[k][0] * sd, a.pts[k][1], a.z], p1 = [b.pts[k][0] * sd, b.pts[k][1], b.z];
        const p2 = [b.pts[k + 1][0] * sd, b.pts[k + 1][1], b.z], p3 = [a.pts[k + 1][0] * sd, a.pts[k + 1][1], a.z];
        const key = 'h' + k + ':' + sd + ':' + (k === 1 ? (i >> 1) : i);
        if (sd > 0) hullS.quad(p0, p1, p2, p3, key); else hullS.quad(p0, p3, p2, p1, key);
      }
    }
    hullS.quad([-a.pts[3][0], a.ky, a.z], [a.pts[3][0], a.ky, a.z], [b.pts[3][0], b.ky, b.z], [-b.pts[3][0], b.ky, b.z], 'k');
    hullS.quad([-a.hb * 0.97, a.gy - 0.3, a.z], [-b.hb * 0.97, b.gy - 0.3, b.z], [b.hb * 0.97, b.gy - 0.3, b.z], [a.hb * 0.97, a.gy - 0.3, a.z], 'd' + (i >> 1));
  }
  for (const [s, key] of [[S[0], 'ts'], [S[NS], 'tb']]) {
    const f = s === S[0] ? -1 : 1, P = s.pts;
    for (let k = 0; k < 3; k++) {
      const q = [[-P[k][0], P[k][1], s.z], [P[k][0], P[k][1], s.z], [P[k + 1][0], P[k + 1][1], s.z], [-P[k + 1][0], P[k + 1][1], s.z]];
      if (f > 0) hullS.quad(q[0], q[3], q[2], q[1], key + k); else hullS.quad(q[0], q[1], q[2], q[3], key + k);
    }
  }
  // stem post, rudder, poop cabin with a turquoise roof, deck house, three masts
  hullS.box(0, S[NS].gy + 0.9, HL - 0.1, 0.5, 2.4, 0.6, 'stem', 0.6);
  hullS.box(0, 0.6, -HL - 0.5, 0.3, 3.4, 1.6, 'rud');
  hullS.box(0, S[1].gy + 0.7, -8.6, 4.2, 2.0, 5.2, 'cab', 0.92);
  hullS.box(0, S[1].gy + 1.95, -8.6, 5.0, 0.5, 6.0, 'roof', 0.55);
  hullS.box(0, S[4].gy + 0.3, -2.6, 2.6, 1.2, 3.0, 'hse', 0.85);
  const masts = [{ z: 7.4, h: 12.5, w: 7.5, yaw: 0.42 }, { z: 0.6, h: 18.5, w: 11, yaw: -0.3 }, { z: -8.4, h: 11.5, w: 6.5, yaw: 0.36 }];
  for (const m of masts) hullS.box(0, m.h / 2 + 1.5, m.z, 0.5, m.h + 1, 0.5, 'mast' + m.z, 0.5);
  // painted bow eyes
  for (const sd of [1, -1]) {
    const s = S[NS - 1], ex = (s.hb + 0.06) * sd, ey = lerp(s.pts[1][1], s.gy, 0.45), ez = s.z + 0.4;
    for (const [r, key, off] of [[0.62, 'eyeW', 0], [0.3, 'eyeP', 0.03]]) for (let q = 0; q < 8; q++) {
      const a0 = q / 8 * Math.PI * 2, a1 = (q + 1) / 8 * Math.PI * 2, x = ex + off * sd;
      const A = [x, ey, ez], B = [x, ey + Math.sin(a0) * r, ez + Math.cos(a0) * r * 1.3], C = [x, ey + Math.sin(a1) * r, ez + Math.cos(a1) * r * 1.3];
      if (sd > 0) hullS.tri(A, B, C, key + sd); else hullS.tri(A, C, B, key + sd);
    }
  }
  const hk = hullS.keys;
  const deckC = white.clone().lerp(gold, 0.35).multiplyScalar(0.62), wood = gold.clone().lerp(red, 0.45).multiplyScalar(0.5);
  const hull = enamelize(hullS.geometry(), {
    angle: Math.PI, cellKey: (c, n, t) => hk[t],
    color: (n, c, id, key) => {
      if (key.startsWith('h0')) return white.clone().multiplyScalar(0.85);
      if (key.startsWith('h1')) return lapis.clone().lerp(turq, (id * 7 % 3) * 0.12);
      if (key.startsWith('h2') || key === 'k') return navy.clone().multiplyScalar(1.2);
      if (key.startsWith('d')) return deckC;
      if (key.startsWith('tb') || key.startsWith('ts')) return key.endsWith('0') ? white.clone().multiplyScalar(0.85) : lapis;
      if (key.startsWith('roof')) return key.endsWith(':t') ? turq.clone().multiplyScalar(0.8) : turq;
      if (key.startsWith('cab') || key.startsWith('hse')) return key.endsWith(':t') ? deckC : white.clone().multiplyScalar(0.8);
      if (key.startsWith('eyeW')) return white; if (key.startsWith('eyeP')) return navy;
      if (key.startsWith('stem')) return red; return wood;
    },
  });
  // sails: batten lug sails, each panel one cell; pennants at the mastheads
  const sl = soup(), sway = [];
  const pushSway = (vals) => { for (const v of vals) sway.push(v); };
  masts.forEach((m, mi) => {
    const nP = mi === 1 ? 6 : 5, cy = Math.cos(m.yaw), sy = Math.sin(m.yaw), y0 = 3.2 + (mi === 1 ? 0 : 0.6), H = m.h - y0 + 1.2;
    const P = (xl, y, bel) => [xl * cy + bel * sy, y, m.z - xl * sy + bel * cy];
    for (let k = 0; k < nP; k++) {
      const row = (kk) => {
        const f = kk / nP, xr = m.w * 0.66 * (0.82 + 0.2 * Math.sin(f * 2.6)), xL = -m.w * 0.34;
        const yl = y0 + H * f * 0.84, yr = y0 + H * (f * 0.84 + 0.16 * f * f) + 0.3 * f;
        const out = [];
        for (let c2 = 0; c2 <= 3; c2++) { const g = c2 / 3, x = lerp(xL, xr, g); out.push({ p: P(x, lerp(yl, yr, g), Math.sin(g * Math.PI) * m.w * 0.13 + 0.25), dx: Math.abs(x) }); }
        return out;
      };
      const r0 = row(k), r1 = row(k + 1);
      for (let c2 = 0; c2 < 3; c2++) {
        sl.quad(r0[c2].p, r0[c2 + 1].p, r1[c2 + 1].p, r1[c2].p, 's' + mi + ':' + k);
        const s0 = r0[c2].dx * 0.03, s1 = r0[c2 + 1].dx * 0.03, s2 = r1[c2 + 1].dx * 0.03, s3 = r1[c2].dx * 0.03;
        pushSway([s0, s1, s2, s0, s2, s3]);
      }
    }
    const top = m.h + 2.0, L = 4.2 + mi % 2;
    for (let q = 0; q < 3; q++) {
      const f0 = q / 3, f1 = (q + 1) / 3, w0 = 0.7 * (1 - f0 * 0.8), w1 = 0.7 * (1 - f1 * 0.8);
      sl.quad([0, top - w0, m.z + 0.3 + f0 * L], [0, top - w1, m.z + 0.3 + f1 * L], [0, top + w1, m.z + 0.3 + f1 * L], [0, top + w0, m.z + 0.3 + f0 * L], 'p' + mi + ':' + q);
      pushSway([f0 * 0.5, f1 * 0.5, f1 * 0.5, f0 * 0.5, f1 * 0.5, f0 * 0.5]);
    }
  });
  const sk = sl.keys;
  const sails = enamelize(sl.geometry(), {
    angle: Math.PI, cellKey: (c, n, t) => sk[t],
    color: (n, c, id, key) => key[0] === 'p' ? red.clone().multiplyScalar(1.7) : red.clone().multiplyScalar(id % 2 ? 1.25 : 1.0),
  });
  sails.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
  return { hull, sails };
}

// outline of one ruyi head (same shape as ruyiSdf in the shader) as a domed fan mesh in head units
function ruyiSdfJS(x, y) {
  const ax = Math.abs(x);
  return Math.min(Math.hypot(x, y - 0.40) - 0.52, Math.hypot(ax - 0.52, y + 0.02) - 0.43, Math.hypot(x, y + 0.50) - 0.66, Math.hypot(x, y + 1.05) - 0.50);
}
function makeHeadGeometry(seg = 44) {
  const cx = 0, cy = -0.15, rad = [];
  for (let i = 0; i < seg; i++) {
    const a = i / seg * Math.PI * 2, dx = Math.sin(a), dy = Math.cos(a);
    let r = 2.2; while (r > 0.05 && ruyiSdfJS(cx + dx * r, cy + dy * r) > 0) r -= 0.01;
    rad.push(r + 0.045);
  }
  const pos = [], idx = [], rings = [0.5, 1.0];
  pos.push(cx, cy, 0.16);
  for (const f of rings) for (let i = 0; i < seg; i++) {
    const a = i / seg * Math.PI * 2;
    pos.push(cx + Math.sin(a) * rad[i] * f, cy + Math.cos(a) * rad[i] * f, 0.16 * (1 - f * f));
  }
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    idx.push(0, 1 + j, 1 + i);
    idx.push(1 + i, 1 + j, 1 + seg + j, 1 + i, 1 + seg + j, 1 + seg + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(0), 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  g.setIndex(idx);
  return g;
}

// wall coordinates (s along the arc, y up, depth behind the face) to local space, as in the shader
function wallMap(s, y, depth, out = new THREE.Vector3()) {
  const a = s / RC, r = RC + depth;
  return out.set(r * Math.sin(a), y, RC - r * Math.cos(a));
}
function spiralP(t, arm, spin) {
  const ph = spin + arm * Math.PI + t * 8.6, r = 75 * Math.exp(1.9 * t), sx = lerp(1.25, 2.7, smoothstep(0, 1, t));
  return [r * Math.cos(ph) * sx, r * Math.sin(ph) + HUB_Y];
}

// =============================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('cloisonne-typhoon') : ctx.rng;
  const palette = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const detail = ctx.quality?.detail ?? 1;
  const seed = rng();
  const enamel = createEnamel({ palette, seed, sun: opts.sun, fogAmount: opts.fogAmount ?? 0.06 });
  const U = enamel.uniforms;
  const spinDir = rng.chance(0.5) ? 1 : -1, spin0 = rng.range(0, Math.PI * 2);
  const object = new THREE.Group(); object.name = 'cloisonne-typhoon';
  const storm = new THREE.Group(); object.add(storm);
  const advance = opts.advance ?? 300;

  // ---- 1. the four shells: one draw call, the ruyi pattern cuts its own silhouette ----
  const layers = [
    { depth: 0, S: 95, crest: 400, base: 95 },
    { depth: 75, S: 130, crest: 590, base: 70 },
    { depth: 160, S: 175, crest: 790, base: 45 },
    { depth: 255, S: 235, crest: 960, base: 0 },
  ];
  layers.forEach((L, l) => { L.S *= rng.range(0.9, 1.12); L.crest *= rng.range(0.93, 1.04); L.l = l; });
  const crestJS = (s, L) => L.crest * (0.70 + 0.17 * Math.sin(s * 0.0041 + L.l * 1.9 + seed * 6) + 0.13 * Math.sin(s * 0.0113 + L.l * 4.3 + seed * 11))
    * (1 - 0.78 * smoothstep(700, 1500, s)) * smoothstep(-1570, -1400, s);
  {
    const pos = [], lay = [], idx = [], nS = 72, nY = 8;
    for (const L of layers) {
      const v0 = pos.length / 3, top = L.crest + L.S * 1.15;
      for (let j = 0; j <= nY; j++) for (let i = 0; i <= nS; i++) {
        pos.push(-1580 + 3160 * i / nS, -L.S * 1.7 * (j === 0 ? 1 : 0) + top * j / nY, L.depth);
        lay.push(L.S, L.crest, L.base, L.l);
      }
      for (let j = 0; j < nY; j++) for (let i = 0; i < nS; i++) {
        const a = v0 + j * (nS + 1) + i, b = a + 1, c = a + nS + 1, d = c + 1;
        idx.push(a, b, d, a, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aLay', new THREE.Float32BufferAttribute(lay, 4));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1), 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, enamel.material({ pattern: 'ruyi', vmode: 1, wire: 2.2, spec: 4 }));
    m.frustumCulled = false; m.name = 'storm-shells'; storm.add(m);
  }
  await ctx.yield?.();

  // ---- 2. the spiral: two banded arms winding out of a navy hub ----
  {
    const pos = [], lay = [], idx = [], nT = 230, nW = 4;
    for (let arm = 0; arm < 2; arm++) {
      const v0 = pos.length / 3;
      for (let i = 0; i <= nT; i++) for (let j = 0; j <= nW; j++) {
        pos.push(i / nT, -1 + 2 * j / nW, -42 - arm * 6); lay.push(arm, 1 - arm * 0.0, 0, 0);
      }
      for (let i = 0; i < nT; i++) for (let j = 0; j < nW; j++) {
        const a = v0 + i * (nW + 1) + j, b = a + 1, c = a + nW + 1, d = c + 1;
        idx.push(a, c, d, a, d, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aLay', new THREE.Float32BufferAttribute(lay, 4));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1), 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, enamel.material({ pattern: 'bands', vmode: 3, wire: 2.4, spec: 5 }));
    m.frustumCulled = false; m.name = 'storm-spiral'; storm.add(m);

    // hub: a disc in wall coordinates, 115 m radius, in front of everything
    const hubR = 150 * rng.range(0.92, 1.1), hp = [0, HUB_Y, -78], hi = [], hl = [0, 0, 0, -2.5], seg = 40;
    for (let i = 0; i < seg; i++) {
      const a = i / seg * Math.PI * 2;
      hp.push(Math.cos(a) * hubR * 1.02, HUB_Y + Math.sin(a) * hubR * 1.02, -60); hl.push(0, 0, 0, -2.5);
      hi.push(0, 1 + i, 1 + (i + 1) % seg);
    }
    const hg = new THREE.BufferGeometry();
    hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
    hg.setAttribute('aLay', new THREE.Float32BufferAttribute(hl, 4));
    hg.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(hp.length).fill(1), 3));
    hg.setIndex(hi);
    const hm = enamel.material({ pattern: 'eye', vmode: 1, wire: 2.4, patScale: hubR, spec: 6 });
    hm.uniforms.uPatOffset.value.set(0, -HUB_Y);
    const hub = new THREE.Mesh(hg, hm); hub.frustumCulled = false; hub.name = 'storm-hub'; storm.add(hub);
  }

  // ---- 3. scroll heads: riders on the spiral arms, puffs on the crests, breakers at the foot ----
  {
    const iA = [], iB = [];
    const nRide = Math.round(46 * detail);
    for (let arm = 0; arm < 2; arm++) for (let k = 0; k < nRide; k++) {
      const t = 0.1 + 0.88 * (k + rng.range(0.1, 0.9)) / nRide;
      const outer = rng.chance(0.78);
      iA.push(0, 0, -52 - rng.range(0, 26), rng.range(0.5, 0.95) * (outer ? 1 : 0.7));
      iB.push(outer ? -1 : 1, rng(), t, arm);
    }
    for (let arm = 0; arm < 2; arm++) { iA.push(0, 0, -64, 1.9); iB.push(-0.12, rng(), 0.992, arm); }   // the curled tip of each arm
    for (const L of layers) {
      const n = Math.round((L.l === 3 ? 20 : 16) * detail);
      for (let k = 0; k < n; k++) {
        const s = -1450 + 2800 * (k + rng.range(0.15, 0.85)) / n, cr = crestJS(s, L);
        if (cr < L.base + 60) continue;
        iA.push(s, cr * rng.range(0.78, 1.06), L.depth - rng.range(18, 40), L.S * rng.range(0.6, 1.0));
        iB.push(rng.range(-0.55, 0.55), rng(), -1, 0);
      }
    }
    const nFoot = Math.round(18 * detail);
    for (let k = 0; k < nFoot; k++) {
      const s = -1350 + 2600 * (k + rng.range(0.1, 0.9)) / nFoot;
      iA.push(s, rng.range(70, 190), -rng.range(50, 130), rng.range(48, 85));
      iB.push(rng.range(-0.9, 0.9), rng(), -1, 0);
    }
    const hg = makeHeadGeometry(44);
    const g = new THREE.InstancedBufferGeometry();
    g.index = hg.index; for (const k in hg.attributes) g.setAttribute(k, hg.attributes[k]);
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4));
    g.instanceCount = iA.length / 4;
    const m = new THREE.Mesh(g, enamel.material({ pattern: 'volute', vmode: 2, wire: 2.0, spec: 5 }));
    m.frustumCulled = false; m.name = 'storm-heads'; storm.add(m);
  }
  await ctx.yield?.();

  // ---- 4. the rain curtain: slanting gold wires under the wall (instanced ribbons, dashes falling) ----
  const wireUniforms = { uTime: U.uTime, uDrift: U.uDrift, uGold: U.uGold, uGlint: U.uGlint, uFogAmt: U.uFogAmt };
  const WIRE_VERT_HEAD = /* glsl */`
    #include <common>
    #include <fog_pars_vertex>
    uniform float uTime, uDrift;
    const float RC = ${RC}.0;
    vec3 wallMap(vec2 sy, float depth){ float a = sy.x / RC, r = RC + depth; return vec3(r * sin(a), sy.y, RC - r * cos(a)); }
  `;
  if (opts.rain !== false) {
    const n = Math.round(600 * detail), iR = [];
    const slant = rng.range(0.3, 0.44) * (rng.chance(0.5) ? 1 : -1);
    for (let i = 0; i < n; i++) {
      const depth = rng.range(-95, 215);
      iR.push(rng.range(-1420, 1380), depth < 20 ? rng.range(95, 210) : rng.range(120, 330), depth, rng());
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(iR), 4));
    g.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSlant: { value: slant } }]),
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      vertexShader: WIRE_VERT_HEAD + /* glsl */`
        attribute vec4 iR; uniform float uSlant;
        varying vec3 vA; varying vec3 vWp; varying float vHalf;
        void main(){
          float top = iR.y, y = mix(-4., top, position.y);
          float sw = sin(uTime * .23 + iR.x * .004) * 30.;
          float s = iR.x + uDrift * .6 + sw + (top - y) * uSlant;
          s = mod(s + 1450., 2850.) - 1450.;
          vec3 pc = (modelMatrix * vec4(wallMap(vec2(s, y), iR.z), 1.)).xyz;
          vHalf = max(3.2, distance(pc, cameraPosition) * .004);
          vec3 p = wallMap(vec2(s + position.x * vHalf, y), iR.z);
          vA = vec3(position.x, position.y * top, iR.w);
          vec4 wp = modelMatrix * vec4(p, 1.); vWp = wp.xyz;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        uniform float uTime, uFogAmt; uniform vec3 uGold; uniform vec4 uGlint;
        varying vec3 vA; varying vec3 vWp; varying float vHalf;
        void main(){
          float fa = max(fwidth(vA.x), 1e-5);
          float hw = max(.4 / max(vHalf, 1.), .75 * fa);
          float m = (1. - smoothstep(hw - .6 * fa, hw + .6 * fa, abs(vA.x))) * clamp(1. / hw, 0., 1.);
          float d = fract(vA.y / 85. + vA.z * 7. + uTime * (.42 + .3 * vA.z));
          m *= smoothstep(0., .06, d) * (1. - smoothstep(.5, .66, d));
          m *= .45 + .55 * smoothstep(-.2, .5, sin(vWp.x * .0047 + vWp.z * .003 - uTime * .31 + vA.z));
          if (m < .01) discard;
          float band = mod(dot(vWp.xz, uGlint.xy) - uTime * uGlint.z, max(uGlint.w, 1.)) - .5 * uGlint.w;
          float glint = exp(-band * band / 3600.);
          gl_FragColor = vec4(uGold * (1.15 + 1.3 * glint) + vec3(.3, .25, .15) * glint, m * .85);
          vec3 pre = gl_FragColor.rgb;
          #include <fog_fragment>
          gl_FragColor.rgb = mix(pre, gl_FragColor.rgb, uFogAmt);
        }`,
    });
    for (const k in wireUniforms) mat.uniforms[k] = wireUniforms[k];
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2; m.name = 'storm-rain'; storm.add(m);
  }

  // ---- 5. lightning: five branching wires in wall space, one lit at a time, keyed to progress ----
  // The strikes are placed where the journey looks: strike 0 beside the hub, strike 1 on the north-east reach (beside
  // the pagoda light as the junk passes it), strikes 2-4 in the face of the overhead arm (built with the arm, below). Without the arm all
  // five stand on the wall.
  const bolts = [];
  let boltMat = null, boltFrag = '';
  // one bolt in a plane (x along, y up): a zigzag trunk from (x, y) down to yEnd with four short branches.
  // map(px, py) gives the 3D position of a plane point; the ribbon quads go into the arrays of dst
  const boltInto = (dst, map, b, x, y, yEnd, w, sc = 1, rr = rng) => {
    const seg = (x0, y0, x1, y1, hw, f0, f1) => {
      const dx = x1 - x0, dy = y1 - y0, l = Math.max(Math.hypot(dx, dy), 1e-3), nx = -dy / l * hw, ny = dx / l * hw, v = dst.pos.length / 3;
      const ex = dx / l * hw * 0.5, ey = dy / l * hw * 0.5;
      dst.pos.push(...map(x0 - ex - nx, y0 - ey - ny), ...map(x0 - ex + nx, y0 - ey + ny), ...map(x1 + ex + nx, y1 + ey + ny), ...map(x1 + ex - nx, y1 + ey - ny));
      dst.aux.push(-1, b, f0, 1, b, f0, 1, b, f1, -1, b, f1);
      dst.idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
    };
    const n = 11, lean = rr.range(-0.5, 0.5), start = { x, y }, pts = [[x, y]];
    for (let i = 1; i <= n; i++) {
      const ny = lerp(start.y, yEnd, i / n), nx = x + (start.y - yEnd) / n * (lean + rr.range(-1.1, 1.1));
      seg(x, y, nx, ny, w, (i - 1) / n, i / n); x = nx; y = ny; pts.push([x, y]);
    }
    for (let k = 0; k < 4; k++) {
      const i0 = rr.int(2, n - 3); let [bx, by] = pts[i0]; const dir = rr.sign(), bn = rr.int(3, 5);
      for (let i = 0; i < bn; i++) {
        const nx = bx + dir * rr.range(18, 70) * sc, ny = by - rr.range(18, 48) * sc;
        seg(bx, by, nx, ny, w * 0.75, (i0 + i) / n, (i0 + i + 1) / n); bx = nx; by = ny;
      }
    }
    return { s: lerp(start.x, x, 0.45), y: lerp(start.y, yEnd, 0.45) };
  };
  if (opts.lightning !== false) {
    // (the wall bolts stand in front of the spiral arms, the hub and every scroll head: depth -140)
    const dst = { pos: [], aux: [], idx: [] }, onWall = (px, py) => [px, py, -140];
    const pos = dst.pos, aux = dst.aux, idx = dst.idx;
    const wallS = [[150, 340], [-780, -640], [-360, -180], [660, 860], [-1100, -940]];   // strike 1 stands just right of the pagoda light as the junk passes it
    for (let b = 0; b < 5; b++) {
      if (b >= 2 && opts.arm !== false) { bolts.push(null); continue; }
      bolts.push(boltInto(dst, onWall, b, rng.range(wallS[b][0], wallS[b][1]), rng.range(560, 720), rng.range(130, 230), 12));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aAux', new THREE.Float32BufferAttribute(aux, 3));
    g.setIndex(idx);
    boltMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uStrike: { value: 0 }, uI: { value: 0 }, uCrack: { value: 0 } }]),
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      vertexShader: WIRE_VERT_HEAD + /* glsl */`
        attribute vec3 aAux; varying vec3 vA;
        void main(){
          vA = aAux;
          vec4 wp = modelMatrix * vec4(wallMap(position.xy, position.z), 1.);
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: boltFrag = /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        uniform float uStrike, uI, uCrack, uFogAmt;
        varying vec3 vA;
        void main(){
          float fa = max(fwidth(vA.x), 1e-5);
          if (abs(vA.y - uStrike) > .5) discard;
          float hw = max(.22, .75 * fa);
          float core = (1. - smoothstep(hw - .6 * fa, hw + .6 * fa, abs(vA.x))) * clamp(1. / hw, 0., 1.);
          float halo = (1. - abs(vA.x)); halo *= halo;
          float grow = smoothstep(vA.z - .25, vA.z, uI * 1.3 + uCrack * 2.);
          float a = clamp(core * (uI * 1.6 + uCrack * .85) + halo * uI * .35, 0., 1.) * grow;
          if (a < .01) discard;
          gl_FragColor = vec4(mix(vec3(.93, .9, .78), vec3(1., .93, .7) * 7., uI) * core + vec3(1., .85, .5) * halo * uI * 2., a);
          vec3 pre = gl_FragColor.rgb;
          #include <fog_fragment>
          gl_FragColor.rgb = mix(pre, gl_FragColor.rgb, uFogAmt);
        }`,
    });
    boltMat.uniforms.uTime = U.uTime; boltMat.uniforms.uDrift = U.uDrift; boltMat.uniforms.uFogAmt = U.uFogAmt;
    const m = new THREE.Mesh(g, boltMat); m.frustumCulled = false; m.renderOrder = 3; m.name = 'storm-lightning'; storm.add(m);
  }
  await ctx.yield?.();

  // ---- 6. the fleet: sixty junks in a curving file from under the wall to the harbour mouth ----
  const lanePts = [[520, 0, 130], [400, 0, 420], [190, 0, 760], [-40, 0, 1080], [-165, 0, 1350], [-133, 0, 1576]].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const lane = new THREE.CatmullRomCurve3(lanePts, false, 'centripetal');
  const laneLen = lane.getLength(), runLen = 430;
  const junks = [];
  let hullMesh = null, sailMesh = null;
  if (opts.fleet !== false) {
    const jg = makeJunkGeometries(rng, palette), N = 60;
    hullMesh = new THREE.InstancedMesh(jg.hull, enamel.material({ edge: true, wire: 0.14, spec: 4 }), N);
    sailMesh = new THREE.InstancedMesh(jg.sails, enamel.material({ edge: true, sway: true, wire: 0.14, spec: 4, emissive: 0.12 }), N);
    for (const m of [hullMesh, sailMesh]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); object.add(m); }
    hullMesh.name = 'fleet-hulls'; sailMesh.name = 'fleet-sails';
    for (let i = 0; i < N; i++) {
      const f = (i + rng.range(0.1, 0.9)) / N;
      junks.push({
        s0: 30 + f * (laneLen - runLen - 60), lat: (i % 2 ? 1 : -1) * rng.range(7, 30) * (0.5 + f), speed: rng.range(0.9, 1.06),
        scale: rng.range(1.15, 1.6), ph: rng.range(0, 6.28), yaw: rng.range(-0.08, 0.08), heave: rng.range(0.35, 0.7),
      });
    }
  }

  // ---- 7. the overhead arm: a bank of cloud that swings out from the north-east end and over the town. Three parts:
  //      the upper sheet (its ruyi pattern cuts its own crest line), the face (a skirt of scroll heads hanging from the
  //      crest line, free heads rolling on its rim in two staggered rows) and the underside, a shelf of navy cells that
  //      runs from the face out over the viewer, so that from below the sky above the head row is the storm ----
  let armPivot = null, underLay = null, armBills = []; const armTip = new THREE.Vector3(), armUW = opts.armUnder ?? 640;
  const armEnd = opts.armEnd ?? 0, armH = opts.armHeight ?? 1;
  const armA0 = -rng.range(1.0, 1.3) + armEnd * 0.5;
  if (opts.arm !== false) {
    const nSeg = 72, nW = 3, pos = [], uvs = [], idx = [], W = 520;
    const fPos = [], fUv = [], fIdx = [], hPos = [], hUv = [], hLay = [], hIdx = [], SK = 150;
    const UW = armUW, nU = 4, uPos = [], uUv = [], uNr = [], uIdx = [], frames = [];
    // the bank: two leaning walls of heads that rise from the crest line above the face (front: low; rear: tall)
    const nB = 5, BANK = opts.armBank === false ? [] : [
      { back: 24, lean: 0.3, S: 80, crest: 300, layer: -5.5, pos: [], uv: [], idx: [] },
      { back: 160, lean: 0.36, S: 120, crest: 520, layer: -6.5, pos: [], uv: [], idx: [] },
    ];
    // the billows under the shelf: off = metres out from the face, Hm = full hang (uv metres), S = head size,
    // u0..u1 = the stretch of progress over which the billow swells down out of the shelf. Their heads are twice the
    // size of the face's, so that from the harbour they are as large on screen as the heads of the storm wall; the
    // layers are near -2.5, where the pattern's crest envelope does not drift with time (uv.x stays inside it)
    const BILL = opts.armBillows === false ? [] : [
      { off: 250, Hm: 200, S: 84, layer: -2.3, u0: 0.36, u1: 0.50 },
      { off: 440, Hm: 215, S: 96, layer: -2.7, u0: 0.46, u1: 0.62 },
      { off: 636, Hm: 230, S: 108, layer: -2.4, u0: 0.56, u1: 0.74 },
    ];
    for (const B of BILL) { B.pos = []; B.uv = []; B.idx = []; B.top = []; B.drop = []; B.g = -1; }
    const BROW = [-0.6, 0, 0.5, 1];
    const freeHead = (cx0, cy0, cz0, tx, tz, ox, oz, size, lean, sd, tone) => {
      // head space: +y is the trefoil top, which points down and a little outward; +x runs along the edge
      const ux = Math.cos(lean), uy = Math.sin(lean), v0 = hPos.length / 3;
      for (const [qx, qy] of [[-1.15, -1.7], [1.15, -1.7], [1.15, 1.05], [-1.15, 1.05]]) {
        const along = (qx * ux - qy * uy) * size, down = (qx * uy + qy * ux) * size;
        hPos.push(cx0 + tx * along + ox * down * 0.3, cy0 - down * 0.95, cz0 + tz * along + oz * down * 0.3);
        hUv.push(qx, qy); hLay.push(size, sd, tone, 0);
      }
      hIdx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    };
    let x = 0, z = 0;
    for (let i = 0; i <= nSeg; i++) {
      const f = i / nSeg, psi = 0.25 + 1.5 * Math.pow(f, 1.5), y = (800 + 250 * Math.sin(f * Math.PI * 0.8)) * armH;
      const tipK = 1 - smoothstep(0.84, 1, f);            // the arm thins away over its last sixth and ends in one curl
      for (let j = 0; j <= nW; j++) {
        const w = j / nW, off = (w - 0.4) * W * (0.3 + 0.7 * tipK);   // uv.y = 0 trailing edge .. W leading edge (toward -psi normal)
        pos.push(x + Math.cos(psi) * off, y - (70 * (1 - Math.pow(2 * w - 1, 2)) + 40 * w) * armH, z - Math.sin(psi) * off);
        uvs.push(-900 + 2000 * f, w * W);
      }
      {
        // the sheet's pattern cuts its own leading silhouette near the middle of its width (the crest line), so the face hangs there
        const ox = Math.cos(psi), oz = -Math.sin(psi), ex = x + ox * 0.12 * W, ez = z + oz * 0.12 * W, ey = y - 92 * armH;
        const tx = Math.sin(psi), tz = Math.cos(psi);
        const tk = smoothstep(0, 0.06, f) * (1 - 0.45 * smoothstep(0.7, 1, f)) * tipK;
        const fr = { ex, ey, ez, tx, tz, ox, oz, uk: 0 }; frames.push(fr);
        // the underside: from the crest line out toward the leading side; uv.y runs from its free edge to the face.
        // Wound to face up with normals pointing down, so that seen from below it takes the lit tone of its cells
        const uk = smoothstep(0, 0.1, f) * (1 - 0.5 * smoothstep(0.72, 1, f)) * tipK;
        const bk = smoothstep(0, 0.07, f) * (0.08 + 0.92 * (1 - smoothstep(0.84, 1, f)));
        fr.uk = uk;
        for (const B of BANK) {
          const top = B.crest + B.S * 1.25, v0 = B.pos.length / 3;
          for (let j = 0; j <= nB; j++) {
            const v = j / nB, hgt = v * top * bk, bo = B.back + B.lean * hgt - 20 * Math.sin(v * Math.PI) * bk;
            B.pos.push(ex - ox * bo, ey - 14 + hgt, ez - oz * bo); B.uv.push(-1350 + 1900 * f + B.back * 0.4, v * top);   // (the pattern lowers its crest beyond 700 m along a sheet)
          }
          if (i < nSeg) for (let j = 0; j < nB; j++) { const a = v0 + j, c = a + nB + 1; B.idx.push(a, c, c + 1, a, c + 1, a + 1); }
        }
        for (const B of BILL) {
          const v0 = B.pos.length / 3, vs = Math.min(1, B.off / UW), offk = B.off * uk;
          const top = ey + 14 + (Math.sin(vs * Math.PI) * 26 + vs * 14) * armH;
          for (let j = 0; j < 4; j++) {
            const vv = BROW[j], bulge = vv > 0 ? Math.sin(vv * Math.PI) * 20 + vv * 16 : 0;
            B.pos.push(ex + ox * (offk + bulge), top - vv * B.Hm * tk, ez + oz * (offk + bulge)); B.uv.push(-900 + 2000 * f - B.off * 0.9, vv * B.Hm);
            B.top.push(top); B.drop.push(vv * B.Hm * tk);
          }
          if (i < nSeg) for (let j = 0; j < 3; j++) { const a = v0 + j, c = a + 4; B.idx.push(a, c, c + 1, a, c + 1, a + 1); }
        }
        for (let j = 0; j <= nU; j++) {
          const v = j / nU, off = v * UW * uk;
          uPos.push(ex + ox * off, ey + 6 + (Math.sin(v * Math.PI) * 26 + v * 14) * armH, ez + oz * off);
          uUv.push(-900 + 2000 * f, (1 - v) * UW); uNr.push(0, -1, 0);
        }
        for (let j = 0; j <= 2; j++) {
          const v = j / 2, bulge = Math.sin(v * Math.PI) * 26 + v * 22;
          fPos.push(ex + ox * (bulge - 14), ey + 10 - v * SK * tk, ez + oz * (bulge - 14)); fUv.push(-900 + 2000 * f, v * 165);
        }
        if (i < nSeg) { const a = i * 3; fIdx.push(a, a + 3, a + 4, a, a + 4, a + 1, a + 1, a + 4, a + 5, a + 1, a + 5, a + 2); }
        if (i % 4 === 2 && i < nSeg - 2) {
          const size = rng.range(34, 48) * (0.75 + 0.25 * tk) * (0.5 + 0.5 * tipK), drop = SK * tk * rng.range(0.5, 0.74), sd = rng(), lean = rng.range(-0.35, 0.35);
          freeHead(ex + ox * 34, ey - drop, ez + oz * 34, tx, tz, ox, oz, size, lean, sd, rng.range(0.72, 1));
        }
        if (i % 4 === 0 && i >= 4 && i < nSeg - 2) {       // the second row: smaller, higher, in the gaps of the first
          const size = rng.range(24, 33) * (0.75 + 0.25 * tk) * (0.5 + 0.5 * tipK), drop = SK * tk * rng.range(0.16, 0.34), sd = rng(), lean = rng.range(-0.3, 0.3);
          freeHead(ex + ox * 25, ey - drop, ez + oz * 25, tx, tz, ox, oz, size, lean, sd, rng.range(0.6, 0.9));
        }
      }
      if (i < nSeg) { x += Math.sin(psi) * 2000 / nSeg; z += Math.cos(psi) * 2000 / nSeg; }
    }
    armTip.set(x, 900 * armH, z);
    {                                                    // the curl that ends the arm: one scroll head lying along it, top outward
      const F = frames[nSeg];
      freeHead(F.ex + F.tx * 12, F.ey + 4, F.ez + F.tz * 12, F.tx, F.tz, F.ox, F.oz, 62, -Math.PI / 2, 0.37, 0.95);
    }
    for (let i = 0; i < nSeg; i++) for (let j = 0; j < nW; j++) {
      const a = i * (nW + 1) + j, b = a + 1, c = a + nW + 1, d = c + 1;
      idx.push(a, c, d, a, d, b);
    }
    for (let i = 0; i < nSeg; i++) for (let j = 0; j < nU; j++) {
      const a = i * (nU + 1) + j, b = a + 1, c = a + nU + 1, d = c + 1;
      uIdx.push(a, c, d, a, d, b);
    }
    const ag = new THREE.BufferGeometry();
    ag.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    ag.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    ag.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1), 3));
    ag.setIndex(idx); ag.computeVertexNormals();
    const arm = new THREE.Mesh(ag, enamel.material({ pattern: 'ruyi', wire: 2.2, spec: 4, graze: true, lay: [82 * rng.range(0.9, 1.15), 400, 40, -2.5] }));
    arm.frustumCulled = false; arm.name = 'storm-arm';
    armPivot = new THREE.Group(); wallMap(-1380, 0, 130, armPivot.position); armPivot.add(arm); storm.add(armPivot);
    {
      const ug = new THREE.BufferGeometry();
      ug.setAttribute('position', new THREE.Float32BufferAttribute(uPos, 3)); ug.setAttribute('uv', new THREE.Float32BufferAttribute(uUv, 2));
      ug.setAttribute('normal', new THREE.Float32BufferAttribute(uNr, 3));
      ug.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(uPos.length).fill(1), 3));
      ug.setIndex(uIdx);
      const under = new THREE.Mesh(ug, enamel.material({ pattern: 'ruyi', wire: 1.8, spec: 3, graze: true, grazeRange: [0.5, 0.8], lay: [66, 3200, 84, -2.6] }));
      // (grazeRange: from the harbour the shelf is always seen at a slant, and at a slant it is one flat navy tone with
      // still wires: the dark belly between the billows, not a tiled sheet. Its scales show only from right underneath)
      underLay = under.material.uniforms.uLay.value;
      under.frustumCulled = false; under.name = 'storm-arm-underside'; armPivot.add(under);
      const fg = new THREE.BufferGeometry();
      fg.setAttribute('position', new THREE.Float32BufferAttribute(fPos, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(fUv, 2));
      fg.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(fPos.length).fill(1), 3));
      fg.setIndex(fIdx); fg.computeVertexNormals();
      const face = new THREE.Mesh(fg, enamel.material({ pattern: 'ruyi', wire: 1.6, spec: 4, graze: true, lay: [42, 120, -60, -3.5] }));
      face.frustumCulled = false; face.name = 'storm-arm-face'; armPivot.add(face);
      const hg = new THREE.BufferGeometry();
      hg.setAttribute('position', new THREE.Float32BufferAttribute(hPos, 3)); hg.setAttribute('uv', new THREE.Float32BufferAttribute(hUv, 2));
      hg.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(hPos.length).fill(1), 3));
      hg.setAttribute('aLay', new THREE.Float32BufferAttribute(hLay, 4));
      hg.setIndex(hIdx); hg.computeVertexNormals();
      const heads = new THREE.Mesh(hg, enamel.material({ pattern: 'volute', vmode: 8, wire: 1.6, spec: 4 }));
      heads.frustumCulled = false; heads.name = 'storm-arm-heads'; armPivot.add(heads);
      for (const B of BANK) {                            // the same material family as the face (one shader program)
        const bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
        bg.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(B.pos.length).fill(1), 3));
        bg.setIndex(B.idx); bg.computeVertexNormals();
        const bank = new THREE.Mesh(bg, enamel.material({ pattern: 'ruyi', wire: 1.8, spec: 4, graze: true, lay: [B.S, B.crest, -34, B.layer] }));
        bank.frustumCulled = false; bank.name = 'storm-arm-bank'; armPivot.add(bank);
      }
      for (const B of BILL) {                            // the billows: the same shader program again, one lay each
        const bg = new THREE.BufferGeometry();
        B.attr = new THREE.Float32BufferAttribute(B.pos, 3); B.attr.setUsage(THREE.DynamicDrawUsage);
        bg.setAttribute('position', B.attr); bg.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
        bg.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(B.pos.length).fill(1), 3));
        bg.setIndex(B.idx); bg.computeVertexNormals();
        const bill = new THREE.Mesh(bg, enamel.material({ pattern: 'ruyi', wire: 1.8, spec: 4, graze: true, lay: [B.S, B.Hm - 1.1 * B.S, -0.35 * B.S, B.layer] }));
        bill.frustumCulled = false; bill.name = 'storm-arm-billow'; armPivot.add(bill);
      }
      armBills = BILL;
    }
    // strikes 2-4: short bolts in the arm's face, where the journey is looking by then (north, over the bridge)
    if (boltMat) {
      const dst = { pos: [], aux: [], idx: [] };
      const hung = BILL.length > 0;                      // with the billows the strikes hang from under the first of them
      (hung ? [60, 46, 43] : [36, 29, 43]).forEach((fi, k) => {
        const F = frames[fi], bo = hung ? BILL[0].off * F.uk + 46 : 54, by = hung ? -100 : 0;
        const map = (px, py) => [F.ex + F.tx * px + F.ox * bo, F.ey + by + py, F.ez + F.tz * px + F.oz * bo];
        const c = boltInto(dst, map, 2 + k, rng.range(-90, 90), 4, -rng.range(175, 225), 8, 0.7);
        bolts[2 + k] = { arm: true, p: new THREE.Vector3(...map(c.s, c.y)) };
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(dst.pos, 3));
      g.setAttribute('aAux', new THREE.Float32BufferAttribute(dst.aux, 3));
      g.setIndex(dst.idx);
      const am = new THREE.ShaderMaterial({
        uniforms: boltMat.uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute vec3 aAux; varying vec3 vA;
          void main(){
            vA = aAux;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: boltFrag,
      });
      const m = new THREE.Mesh(g, am); m.frustumCulled = false; m.renderOrder = 3; m.name = 'storm-arm-lightning'; armPivot.add(m);
    }
    armTip.add(armPivot.position);
  }
  // strike 5 (u = 0.155): a wall bolt on the north-east reach, behind the pagoda light as the junk turns toward it.
  // Built last, from its own fork, so that no earlier random draw moves.
  if (boltMat) {
    const r5 = rng.fork ? rng.fork('ct-strike5') : rng, dst = { pos: [], aux: [], idx: [] };
    bolts[5] = boltInto(dst, (px, py) => [px, py, -140], 5, r5.range(-1185, -1150), r5.range(600, 680), r5.range(150, 210), 12, 1, r5);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(dst.pos, 3));
    g.setAttribute('aAux', new THREE.Float32BufferAttribute(dst.aux, 3));
    g.setIndex(dst.idx);
    const m = new THREE.Mesh(g, boltMat); m.frustumCulled = false; m.renderOrder = 3; m.name = 'storm-lightning-5'; storm.add(m);
  }

  // ---- progress, update ----
  let progress = -1;
  const dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
  const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), tmpV = new THREE.Vector3();
  const ease = (x) => x * x * (3 - 2 * x);
  function update(dt, time, camera) {
    const u = progress >= 0 ? progress : (time % TRIP) / TRIP;
    enamel.update(time);
    U.uSpin.value = spin0 + spinDir * time * 0.012;
    U.uDrift.value = spinDir * time * 2.2;
    storm.position.z = advance * u;
    if (armPivot) armPivot.rotation.y = lerp(armA0, armEnd, smoothstep(0, 1, u));
    // the underside grows out from the face as the arm comes over: a dark lip at first, the whole shelf by 80 percent
    if (underLay) underLay.z = 84 + armUW - lerp(Math.min(120, armUW), armUW, smoothstep(0.45, 0.8, u));
    // the billows swell down out of the shelf, one after another (positions rewritten only while one is moving)
    for (let b = 0; b < armBills.length; b++) {
      const B = armBills[b], g = smoothstep(B.u0, B.u1, u);
      if (g === B.g) continue;
      B.g = g;
      const A = B.attr.array, n = B.top.length;
      for (let v = 0; v < n; v++) A[v * 3 + 1] = B.top[v] - B.drop[v] * g;
      B.attr.needsUpdate = true;
    }
    // lightning: 0.25 s ease in, 0.6 s ease out, a crack that lingers 3 s (trip seconds, from progress)
    let I = 0, crack = 0, active = 0;
    for (let k = 0; k < STRIKES.length; k++) {
      const ts = (u - STRIKES[k]) * TRIP;
      if (ts < 0 || ts > 4) continue;
      active = k;
      I = ts < 0.25 ? ease(ts / 0.25) : ts < 0.85 ? 1 - ease((ts - 0.25) / 0.6) : 0;
      crack = smoothstep(0.1, 0.3, ts) * (1 - smoothstep(0.85, 3.85, ts));
    }
    if (boltMat) {
      boltMat.uniforms.uStrike.value = active; boltMat.uniforms.uI.value = I; boltMat.uniforms.uCrack.value = crack;
      const b = bolts[active];
      U.uFlash.value.w = b ? I * 0.9 + crack * 0.08 : 0;
      if (b && b.arm) { U.uFlashUv.value.set(-1e5, 0, 300); tmpV.copy(b.p).applyMatrix4(armPivot.matrixWorld); }
      else if (b) { U.uFlashUv.value.set(b.s, b.y, 250); wallMap(b.s, b.y, -140, tmpV).applyMatrix4(storm.matrixWorld); }
      U.uFlash.value.x = tmpV.x; U.uFlash.value.y = tmpV.y; U.uFlash.value.z = tmpV.z;
    }
    if (hullMesh) {
      for (let i = 0; i < junks.length; i++) {
        const j = junks[i], s = Math.min(j.s0 + u * runLen * j.speed, laneLen - 1), f = s / laneLen;
        lane.getPointAt(f, tmpP); lane.getTangentAt(f, tmpT);
        dummy.position.set(tmpP.x + tmpT.z * j.lat, Math.sin(time * 0.8 + j.ph) * j.heave - 0.2, tmpP.z - tmpT.x * j.lat);
        dummy.rotation.set(Math.sin(time * 0.8 + j.ph + 1.3) * 0.05, Math.atan2(tmpT.x, tmpT.z) + j.yaw + Math.sin(time * 0.21 + j.ph) * 0.05, 0);
        dummy.scale.setScalar(j.scale); dummy.updateMatrix();
        hullMesh.setMatrixAt(i, dummy.matrix); sailMesh.setMatrixAt(i, dummy.matrix);
      }
      hullMesh.instanceMatrix.needsUpdate = true; sailMesh.instanceMatrix.needsUpdate = true;
    }
  }
  update(0, 0, null);

  const hubPos = wallMap(0, HUB_Y, -70);
  const head = lanePts[lanePts.length - 1];
  const fly = [[430, 3.2, 330], [330, 3.2, 600], [130, 3.2, 900], [-90, 3.2, 1180], [-215, 3.2, 1400], [-190, 3.2, 1600]].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const anchors = {
    hub: hubPos,
    entryView: { position: new THREE.Vector3(0, 3.2, 1701), target: new THREE.Vector3(-420, 180, 600) },
    fleetFile: lanePts.map((p) => p.clone()),
    fleetHead: head.clone(),
    flyThrough: fly,
    portalSeat: { position: new THREE.Vector3(head.x, 8, head.z + 60), facing: new THREE.Vector3(0.2, 0, -0.98).normalize() },
    viewpoints: [
      { position: new THREE.Vector3(0, 3.2, 1701), target: hubPos.clone() },
      { position: new THREE.Vector3(260, 6, 520), target: new THREE.Vector3(-200, 330, 60) },
      { position: new THREE.Vector3(-900, 40, 1500), target: new THREE.Vector3(200, 420, 100) },
    ],
    armTip,
  };
  return {
    object, radius: 1080, height: 950, center: new THREE.Vector3(0, 400, 250), anchors,
    enamel, setProgress(v) { progress = v == null || v < 0 ? -1 : clamp(v, 0, 1); },
    setSun(v) { U.uSun.value.copy(v).normalize(); },
    update, dispose() {}, ground: true, groundY: -1.5,
  };
}
