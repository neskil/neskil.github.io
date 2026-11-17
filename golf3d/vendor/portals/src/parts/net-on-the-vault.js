// The Net on the Vault: hero set piece "The Hall of a Hundred Boats" + the whole style of the world.
//
// WHAT IT IS  A brick boat hall over the water, 240 m long and 47.6 m wide: three barrel vaults (centre span 16, crown 14;
//   sides span 12, crown 12) on two rows of 14 piers with arcade arches, 13 water arches in each outer wall, a gate wall
//   (z = +120) and an end wall (z = -120) with the eye, a 6 x 10 m hatch in the centre crown, the slab of sun on the water
//   under it, 96 moored skiffs, ferns, the water and the blank white of outdoors. No lights; flat pigments; everything
//   bright is the net: pale-gold cord, three to a white trefoil knot, drawn by ONE analytic function on every surface.
// FRAME  Hero-local = world: put hero.object at identity (the net's uniforms are in these coordinates). Water is y 0.
//   The hall runs along Z: gate at z = +120 ("front", +Z; the canal continues toward +Z), eye at z = -120, hatch/slab at z 0.
//   Travel is toward -Z, so "right of the axis" is +X. World post must be
//   { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } } (no inverse tone map here).
// HOW THE STYLE IS MADE
//   - Every surface is a "sheet": an unrolled coordinate in metres (aSheet.xy), a lattice coordinate q = sheet / mesh size
//     (aSheet.zw; graded along the hall with nvMesh/nvLat so the net is tight under the hatch and wide in the still ends),
//     a water foot F (aFoot.xy: the spot of water it looks at) with J = dF/dq (aFJ), the mesh size m and a tone code (aFoot.zw).
//   - nvNet(q, m, F, J, aa, mode) reads a honeycomb at q: three cords meet at every corner by construction. A cord lives
//     if either mesh beside it is lit (mask from F at the MESH CENTRE: reach of the slab with bare rays behind the piers,
//     reach of the arch waters, wake bands), so every shadow edge is a selvedge of whole meshes; a per-cord hash and slow
//     phase draw a cord back from its middle into its two knots (merge) and throw it again (split); a knot is drawn only
//     where all three of its cords are alive and shrinks with them; slack (wide) cord bellies, tight cord is straight;
//     one cord in thirty is doubled (mended: exactly two cords of the ordinary width a cord's width apart, from knot to knot, one
//     cord where the pair would be too small to show its gap); knots sit a little off the true corner.
//   - nvLight(base, sheet, q, m, F, J, gain) lays the net over a flat base colour: main net, the 2x tighter wake-band
//     net where uBoatA/uBoatB work the water (one band crosses hull, pier and vault because it depends on F alone),
//     fold B over the centre aisle (the brief's second fold: a honeycomb 1.7 times wider, turned 21 degrees, riding with
//     the first fold; where a cord of it crosses a drawn cord of the first well clear of the knots: a white lozenge), all
//     sliding with uTime and warped by the swell. A wake band is ONE stripe: a main mesh whose own centre lies in the band
//     is taken out whole and only the tight net is drawn inside it, a tight mesh is in if the main mesh under its middle
//     is a band mesh, and a dash of the far tier is kept or dropped whole by its own middle (none under about 5 px). Each cord is filtered across its own pixel footprint, so a
//     mesh seen at a slant stays a (long) mesh; under about 9 px long or 8 px wide the net becomes rows of staggered gold
//     dashes across the line of sight, with no white on a row of dashes anywhere (nvRows: a foreshortened honeycomb), never radial
//     strokes and never a tint. The change from mesh to dashes is made in WHOLE MESHES (nvNK / nvIn: each mesh is in or out by
//     the footprint at its own centre), and nothing is cross-faded: a cord is drawn in the cord colour or not at all. Cords never thin below about 2.1 px. A band edge is whole meshes; a knot lasts as long as
//     its cords. As the eye opens (uEye) the last 46 m of net is hauled taut toward it (uHaul, in the masonry shader).
//   - Value without lighting (the only shadow is the absence of net). In the centre aisle every pier stands proud of the
//     arcade wall and carries a rib over the vault: behind each, away from the hatch, a ray of plain brick, longer the
//     further from the slab, wider at the springing than at the crown, none round the hatch (nvReach; hulls, decks and
//     birds set nvRay = 0). The ribs are real: honey arches 0.38 m proud of each vault; the face of each that is turned from
//     the slab is umber, so from the gate they are dark arcs crowding with distance and from the hatch on they are honey.
//     The hatch is a hole through the roof: a honey curb, then the umber reveal of its thickness, then the white. In the side aisles the rays behind the piers are wide and the arch waters light only what lies
//     behind an arch. The pier faces that turn from the slab are umber. The rays lengthen steeply with distance from the
//     slab (a pointed wedge up to 7 m long behind a far pier) and the far tier's rows lie further apart out there: one
//     bright heart, quiet ends. Bare brick whose courses are too fine to draw keeps every 2nd, 4th, 8th... bed joint as a
//     broken umber line at least 6 px apart, so a ray is drawn brick and never a blank tone. The heart of each bare patch
//     that lies behind a pier is laid in umber with rose course lines (nvBehind, in the masonry shader): its edge is held
//     still on the brick, set back from the reach's edge by the selvedge's own reach, so a rim of plain rose brick lies
//     between the net and the umber and no cord lies on umber brick.
//   - Fold B (the doubled net and its lozenges) lies only within about 40 m of the slab, and only as near the eye as a mesh
//     of the first fold measures about 27 px (nvRg, cut in whole meshes): nearer, two folds and their lozenges; further off,
//     one clean foreshortened honeycomb. A crossing of the two folds is a slim white diamond lying along the second
//     fold's cord across the first fold's cord (9-30 px long, about a quarter as wide): no lobes. The second fold shows
//     no knots of its own, and a diamond is whole or absent: its length is cut to the room it has between the two knots
//     of the cord it crosses, the neighbouring crossings and its own fold's corners, and under about 4.5 px it is left out.
//   - A knot is never wider than a fifth of its mesh as the mesh measures on screen (a mesh under about 10 px has none; the
//     far rows are plain cord colour), and never more than about 8.5 px of radius against the lens (uPx scales that with the
//     frame). A mesh seen at a slant (long axis over about 25 px, short axis over 8) keeps a round knot a third of its short
//     axis across. |uBoat.z| under 1 narrows a wake's chevron (the canal), its sign is the heading. Each arm of a wake is a
//     stripe a few metres wide: a band crosses hull, pier and vault as one line and never covers a whole vault.
//     Mesh size is graded along the hall (nvMesh, L 35 m): about 0.4 m under the hatch (tight near the slab), 0.7 m 50 m
//     off, 1.2 m 100 m off, 1.45 m in the still ends; the side vaults carry a mesh 1.6 times wider than the centre. The cord is
//     3 cm wide everywhere; the second fold is laid in a slimmer cord (0.6 of it, never under 1.5 px) of the same colour.
//     Cords of the first fold are drawn back and thrown by one rule everywhere, near the slab and in the hauled net too (only
//     the second fold, which has no knots, draws none back); a crossing's diamond is at least two and a half cord widths across, three times as long as wide and
//     plainly longer than the cord is wide, or absent. uWall.w over .5 turns the big wake's wall into a ring about the slab (the
//     ordinary flight's tightening as the pace skiff cuts the cloth's corner). The rib soffits are brick and carry the net;
//     a rib face is umber unless at least 3 m of the slab lies on its side. The water arches' soffits and reveals are honey
//     stone under a bright 0.4 m net (they look down at the sunlit water outside); the end wall's eye sits in a blind arch:
//     an umber reveal and dressed honey voussoirs round it (masonry pattern 4).
//   - style.water() is the water material; anything below y 0 drawn with it is shaded as the water its ray met (the
//     world's skirt under the entry plane). The white of outdoors lies in it only as ladders of thin slivers (nvSliver):
//     under each water arch, whole at the sill and gone 13 m from the wall; under the hatch (pointed slivers of unequal length, no straight edge); under the open eye; a few along
//     a wake. Mid-aisle, away from an opening, the water is plain green. The slab is a cloth of whole 0.6 m meshes with green eyes along its selvedge.
//   - The cord is lifted a finger (3 cm) off the surface by a parallax shift in the masonry shader, so it slides against
//     the brick courses as the camera passes: the net is in each surface's material, there is no projector and no pass.
//   - Base colours are material tones only (honey / rose / umber / white / hull shade / green), with umber joints that
//     fade to the flat tone when a course is under 3 px, honey ribs every bay, a green weed line at the tide mark.
// EXPORTS (shade the whole world with these)
//   NV_PALETTE, NV_HALL                       brief palette; hall dimensions
//   NV_UNIFORMS_GLSL, NV_NET_GLSL, NV_LIGHT_GLSL   GLSL chunks: uniforms; nvHash/nvReach/nvWake/nvBand/nvMask/nvNet;
//                                             nvHatch/nvLight (takes derivatives: call at the top level of main, not in a loop)
//   makeNetStyle({ palette })                 -> { uniforms, palette, masonry(), shader(vert, frag, extra) }; the hero's own
//                                             style is hero.style (pass opts.style to share one), plus hero.style.hull()
//   NvSheets, nvCode(tone, pattern, gain)     geometry builder for style.masonry(): grid(nu, nv, fn, code) / plane(...)
//   nvMesh(dz, m0), nvLat(dz, m0)             mesh size and lattice coordinate at dz metres along the hall from the slab
//   nvSkiffGeometry()                         the 6.5 m skiff (use with hero.style.hull() and an 'iData' instanced attribute:
//                                             phase, rose 0/1, tilt 0/1, mesh size) for the ride and the pace skiff
//   nvFerns(list, rng, uniforms)              fern fans as one mesh
// RETURN  { object, radius, height, center (viewer framing only; true size in anchors.bounds), anchors, update, dispose,
//   style, setBoats(ax, az, aStrength, bx, bz, bStrength, heading), setEye(0..1) }: the world drives the two wakes and the eye.
// ANCHORS (local = world)  gate { position, facing, width, height } the 7 m water gate in the front wall;
//   portalSeat { position [0, 7.2, -119.9], facing +Z, radius 6.5 } the eye (wall plane is z = -120; uEye radius 6.6);
//   slab, hatch, moorings (every skiff's position), bounds, variant.
// OPTS  palette (7 hex: honey, rose, umber, green, cord, white, hull shade), detail 0.6..1 (thins ferns only, never the
//   net), hour 'noon'|'morning'|'afternoon', water 'slack'|'breeze'|'ebb', roseFleet, gate (false closes the front wall),
//   dome (false: the world brings its own white dome), waterZ0/waterZ1 (extent of the water plane), style.
// COST  about 77k triangles, 5 draw calls (masonry, water, fleet, ferns, dome), 5 programs, build about 125 ms, no step
//   over 50 ms, no lights, no textures. Expects around it: the canal, the ride, swallows and the portal (world's work).
import * as THREE from 'three';

export const NV_PALETTE = ['#C8A25E', '#B5705A', '#6B4838', '#1E5B49', '#FFE596', '#F5F2E8', '#B8C4B2'];

// Hall dimensions, metres, hero-local (= world: place the hero at identity, see header).
export const NV_HALL = { len: 240, z0: -120, z1: 120, pierX: 9.2, pierW: 2.4, bay: 16, pier0: -104, nPier: 14,
  spring: 6, rC: 8, rS: 6, sideX: 16.4, wallX: 22.4, wallT: 1.4, archR: 4.5, archSpring: 1.0, eyeY: 7.5, eyeR: 7.5 };

// ---------------------------------------------------------------------------------------------------------
// NV_NET_GLSL: the one net function. Every material of the world includes it (after NV_UNIFORMS_GLSL).
//   q   lattice coordinate (sheet metres already divided by the local mesh size), m mesh size in metres,
//   F   water foot (the spot of water this point looks at), J = dF/dq, aa = lattice units per pixel,
//   mode 0 main net, 1 wake-band net (2x tighter), 2 fold B (doubled net over the centre aisle).
//   returns x = cord coverage, y = knot coverage (a white trefoil where three live cords meet).
// ---------------------------------------------------------------------------------------------------------
export const NV_UNIFORMS_GLSL = /* glsl */`
uniform float uTime;        // world seconds: ambient sliding only
uniform vec4 uSlab;         // x,z centre of the slab of sun on the water, half sizes x,z
uniform vec4 uBoatA;        // wake 1: x, z, heading (+1 toward +z, -1 toward -z), strength 0..1
uniform vec4 uBoatB;        // wake 2
uniform vec4 uNetP;         // x slide speed (lattice/s), y merge rate, z belly, w net gain 0..1 (0 hides the net)
uniform vec4 uBoatC;       // wake 3 (small creatures, the launch): x, z, scale, strength; heads along uDirC
uniform vec4 uDirC;         // xy = unit heading of wake 3 in plan (x, z)
uniform vec4 uWall;         // the big wake: x = z centre, y = half length, z = strength; w over .5: a ring about the slab instead, w its radius, y its half width
uniform vec4 uVar;          // x lengthwise stretch of the lattice (1 none; under 1 draws meshes out along the hall), y extra slide along the hall (lattice/s),
                            // z metres the arch waters' net reaches further in (late afternoon), w how far the hatch's reach is cut back in the side aisles
uniform vec4 uHaul;         // lattice x (for a sheet graded with nvLat, k = 1) at the end wall and 46 m before it, m0, slab z: the haul toward the eye
uniform vec4 uEye;          // x,y centre of the eye on the end wall (sheet metres), z radius now, w full radius
uniform float uPx;         // the drawing's scale (its height over 450 dots): the thinnest cord, knot and joint that can be drawn are worked out from it, so they are the same marks on a larger drawing
uniform vec3 uHoney; uniform vec3 uRose; uniform vec3 uUmber; uniform vec3 uGreen;
uniform vec3 uCord; uniform vec3 uWhite; uniform vec3 uShade;
`;
export const NV_NET_GLSL = /* glsl */`
// set by the caller before nvNet (nvLight does it):
mat2 nvFp = mat2(0.);       // screen derivatives of the lattice coordinate handed to nvNet (columns d/dx, d/dy): each cord is filtered across its own footprint
vec2 nvKs = vec2(1.);       // knot metric: lattice units to knot metres, as a multiple of m (under 1 = larger knots)
float nvBelK = 1.;          // belly scale: 0 where the net is hauled taut
float nvFat = 0.;           // out: coverage of the same cords drawn a little wider (two folds crossing make a white lozenge of it)
mat2 nvG = mat2(1.);        // metric: sheet metres = m * nvG * (lattice step). Identity unless the lattice is drawn out (ebb, the haul, the eye)
mat2 nvGi = mat2(1.);       // its inverse: cords keep one true width and knots stay round however the lattice is stretched
float nvWk = 1.;            // cord width factor (the second fold is laid in a slimmer cord)
float nvGone = 1.;          // 0 for the second fold only (it has no knots to draw a cord back into); everywhere else, the hauled net included, cords are drawn back and thrown by the one rule
vec2 nvCn = vec2(1., 0.);   // out: the nearest cord's normal (lattice) and
float nvCs = 9.;            // out: the signed lattice distance from its centre line to this point, along that normal
float nvRay = 1.;           // 1: the rays of plain brick behind the piers and ribs of the centre aisle fall here (masonry); 0: a hull, a deck, a bird
float nvCd = 9.;            // (the nearest cord's distance so far)
float nvCt = 0.;            // out: this point's place along that cord (lattice; the cord runs from -.2887 to .2887)
float nvRg = 1e4;           // the second fold is drawn within this many metres of the eye (whole meshes: its edge is a selvedge too)
float nvY = 0.;             // height of the surface being drawn (the masonry sets it)
float nvNK = 0.;            // the net's footprint at this pixel (1 = a mesh too small to draw cord by cord) over the square of this pixel's distance:
                            // times the square of a MESH CENTRE's distance it says whether that whole mesh is drawn (nvIn), so mesh gives way to dashes in whole meshes
float nvCell = 1.;          // out: 1 if the mesh this pixel lies in is drawn cord by cord
float nvMb = 0.;            // out of nvMask: 1 if that mesh lies in a wake band (and in reach)
float nvCellB = 0.;         // out of nvNet: the same for the mesh this pixel lies in. The tight net of a wake band fills exactly those meshes of the main net
float nvCellM = 0.;         // out of nvNet: the mask of the mesh this pixel lies in (over .5: that mesh is drawn)
const float NVT = 2.;       // the wake band's net is this many times tighter than the main net
vec2 nvQ3o = vec2(0.);      // tight lattice = NVT * main lattice + nvQ3o (set by nvLight): a mesh of the tight net finds the main mesh under its middle
vec2 nvCq = vec2(0.), nvQp = vec2(0.), nvFq = vec2(0.); mat2 nvJq = mat2(1.);   // this call's mesh middle and pixel (lattice), the pixel's foot and dF/dq
vec2 nvRowC = vec2(0.);     // out of nvRows: the middle of the dash this pixel lies on or nearest (lattice), so a dash is in a band or out of it whole
float nvIn(vec2 F){ vec3 dv = vec3(F - cameraPosition.xz, nvY - cameraPosition.y); return step(nvNK * (dot(dv, dv) + 36.), 1.); }   // (+36: against the lens the two distances are not compared)
// the middle of the mesh a lattice point lies in
vec2 nvHexC(vec2 q){
  vec2 axq = vec2(q.x - q.y * .5773503, q.y * 1.1547005);
  vec3 cu = vec3(axq, -axq.x - axq.y); vec3 rc = floor(cu + .5); vec3 df = abs(rc - cu);
  if (df.x > df.y && df.x > df.z) rc.x = -rc.y - rc.z; else if (df.y > df.z) rc.y = -rc.x - rc.z;
  return vec2(rc.x + .5 * rc.y, .8660254 * rc.y);
}
float nvHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
// reach of sunlit water: x from the slab (bare rays behind the piers, pointing back at the hatch), y from the arch waters
vec2 nvReach(vec2 F){
  float ax = abs(F.x);
  float r1 = 1.;
  if (ax <= 10.5) {
    // the centre aisle. Every pier stands proud of the arcade wall and carries a rib across the vault: seen from the slab, far
    // down the hall, the light comes along the wall and the vault at a low angle, and behind each pier and its rib a ray of plain
    // brick runs up the vault away from the hatch, longer the further the pier is from the slab and wider at the springing
    // than at the crown. Round the hatch there is none. (As the far end's net is hauled toward the eye it is drawn over them.)
    float sd = F.y >= uSlab.y ? 1. : -1., rel = (F.y + 104.) / 16.;
    float zr = (sd > 0. ? floor(rel) : ceil(rel)) * 16. - 104.;
    float t = sd * (F.y - zr) - mix(.5, 1.2, step(7.9, ax)), Dr = abs(zr - uSlab.y);
    float ur = min(ax, 8.) / 8.;                          // 0 at the crown, 1 at the springing: the ray is a wedge rooted at the pier, its point at the crown,
    float Ls = min(min(.42 * max(Dr - 8., 0.), 4.2 + .025 * Dr) * (.22 + .9 * ur * ur * ur), 8.);   // so the net runs unbroken along the crown, a gold spine that leads to the hatch   // (every rib stands proud of the vault and throws its ray, none beside the hatch itself; at the springing the ray is up to 8 m of the 16 m bay, at the crown under 2 m, so each is a long wedge with net on both sides of it)
    float sh = smoothstep(-.15, .15, t) * (1. - smoothstep(Ls - .25, Ls + .25, t)) * step(abs(zr), 104.5) * step(.4, Ls);
    sh *= (1. - step(F.y, -70.) * clamp(uEye.z / max(uEye.w, 1e-3), 0., 1.)) * nvRay;
    r1 = 1. - sh;
  } else {
    float sx = F.x > 0. ? 9.2 : -9.2;
    float t = (sx - uSlab.x) / (F.x - uSlab.x);          // |F.x| > 10.5 and |uSlab.x| < 5: never zero
    float zs = uSlab.y + (F.y - uSlab.y) * t;
    float pz = abs(mod(zs + 112., 16.) - 8.);            // 0 at a pier centre
    float inRow = 1. - smoothstep(105.5, 107., abs(zs));
    r1 = mix(1., smoothstep(2.9, 4., pz), inRow);
    r1 *= 1. - smoothstep(19., 30., ax);
    r1 *= 1. - uVar.w * smoothstep(10.5, 13., ax);
  }
  float r2 = smoothstep(19.8 - uVar.z, 21.4 - uVar.z, ax + 1.1 * sin(F.y * .21 + 1.7) * sin(F.y * .057)) * (1. - smoothstep(118., 121., abs(F.y)));
  // (the arch waters light what lies behind an arch; behind each wall pier between two arches the wall and the vault are bare)
  r2 *= mix(1., 1. - smoothstep(4.8, 6., abs(mod(F.y + 104., 16.) - 8.)), step(abs(F.y), 104.) * step(13., ax));
  return vec2(r1, r2);
}
// wake bands: a chevron of worked water behind (and a little ahead of) each boat
float nvWake(vec2 F, vec4 B){
  float kw = clamp(abs(B.z), .2, 1.);                    // |B.z| under 1: narrower arms (the canal's wakes are stripes); its sign is the heading
  float s = (B.y - F.y) * (B.z < 0. ? -1. : 1.) + 7.;    // metres behind the bow wave's head
  float l = abs(F.x - B.x);
  float la = .36 * (.5 + .5 * smoothstep(.42, 1., kw)) * max(s, 0.);
  float arm = abs(l - la);   // (between the canal's walls the chevron is drawn narrow)
  // (each arm of a wake is a stripe a few metres wide, so a band crosses hull, pier and vault as one line and never covers a whole vault)
  float w = (.8 + .03 * max(s, 0.)) * mix(.6, 1., smoothstep(.42, 1., kw));
  if (l < la) arm *= smoothstep(1.5, 2.3, la - w);   // (inside the chevron near its apex the water is all worked: the two arms part only where three main meshes can lie between them)
  return B.w * (1. - smoothstep(w, w + .8 * kw, arm)) * smoothstep(-1.5, .5, s) * (1. - smoothstep(34., 52., s));
}
float nvWakeC(vec2 F){
  float k = max(uBoatC.z, .05); vec2 r = uBoatC.xy - F;
  float s = dot(r, uDirC.xy) / k + 7.;
  float l = abs(r.x * uDirC.y - r.y * uDirC.x) / k;
  float arm = abs(l - .36 * max(s, 0.));
  float w = 1.5 + .07 * max(s, 0.);
  if (l < .36 * max(s, 0.)) arm *= smoothstep(1.5, 2.3, (.36 * max(s, 0.) - w) * k);
  return uBoatC.w * (1. - smoothstep(w, w + 1.4, arm)) * smoothstep(-1.5, .5, s) * (1. - smoothstep(34., 52., s));
}
float nvBand(vec2 F){
  float wall = uWall.w > .5 ? uWall.z * (1. - smoothstep(uWall.y, uWall.y + 1.2, abs(length(F - uSlab.xy) - uWall.w)))
    : uWall.z * (1. - smoothstep(uWall.y, uWall.y + 8., abs(F.y - uWall.x)));
  return max(max(nvWake(F, uBoatA), nvWake(F, uBoatB)), max(nvWakeC(F), wall));
}
float nvMask(vec2 F, int mode){
  vec2 R = nvReach(F); float b = nvBand(F); float r = max(R.x, R.y);
  nvMb = step(.5, r) * step(.5, b);
  // (a wake band is one stripe: the main net stops at a selvedge of whole meshes, and the meshes it leaves, those whose middle
  // lies in the band, are filled with the tight net, tied to that selvedge; no pixel carries both)
  if (mode == 1) return r * nvIn(F);
  if (mode == 2) {
    // (the vault over this foot, and how squarely the eye looks at it: the same for every pixel of a mesh, so the fold ends in
    // whole meshes. The second fold lies only where a mesh of the first measures about 21 px face on and is not foreshortened
    // to under about 10 px: wherever it lies there is room on its cords for a crossing's diamond)
    float a = clamp(F.x, -8., 8.) * .19635; vec3 Nv = vec3(sin(a), cos(a), 0.);
    vec3 dv = vec3(8. * Nv.x, 6. + 8. * Nv.y, F.y) - cameraPosition; float dl = length(dv) + 1e-4;
    float cs = abs(dot(dv, Nv)) / dl;
    b = max(max(b, nvBand(F + nvJq * vec2(0., .5774))), max(nvBand(F + nvJq * vec2(.5, -.2887)), nvBand(F + nvJq * vec2(-.5, -.2887))));   // (a mesh of the second fold is out whole if a band touches its middle or its corners)
    return R.x * (1. - smoothstep(8.4, 9.6, abs(F.x))) * (1. - b) * (1. - smoothstep(40., 62., abs(F.y - uSlab.y)))
      * (1. - step(nvRg * min(1., cs * 2.2), dl));
  }
  return r * (1. - b) * nvIn(F);
}
// the mask of the mesh whose middle is at lattice cq (foot Fm). The tight net of a wake band (mode 1) fills the meshes of the
// main net that lie in the band: a tight mesh is in if the main mesh under its middle is one of those, so the stripe's edge is
// whole tight meshes where no cord of the main net is there to tie it to
float nvMaskAt(vec2 Fm, vec2 cq, int mode){
  if (mode != 1) return nvMask(Fm, mode);
  vec2 cm = nvHexC((cq - nvQ3o) / NVT);
  float keep = nvNK; nvNK = 0.;
  nvMask(nvFq + NVT * (nvJq * (cm - (nvQp - nvQ3o) / NVT)), 0);
  nvNK = keep;
  return nvMb * nvIn(Fm);
}
// one cord of a cell: d = p - cell centre, n = axis, off = axial offset of the neighbour on +n
// returns (coverage, liveness 0..1, |s|, sign)
vec4 nvEdge(vec2 d, vec2 n, vec2 ci, vec2 off, float mc, vec2 Fc, mat2 J, float wq, float aa, float bel, int mode, float seed){
  float s = dot(d, n); float sg = s < 0. ? -1. : 1.;
  float t = dot(d, vec2(-n.y, n.x));
  vec2 key = 2. * ci + sg * off;
  float mn = nvMaskAt(Fc + J * (sg * n), nvCq + sg * n, mode);
  float live = step(.5, max(mc, mn));                    // a mesh is in the net or out of it: an edge is whole meshes, no cord is left half drawn
  vec2 tv = vec2(-n.y, n.x);
  float aN = length(n * nvFp) * .75 + 1e-5, aT = length(tv * nvFp) * .75 + 1e-5;   // lattice units per pixel across and along this cord
  wq *= length(n * nvGi);                                               // one true width, whichever way the lattice is drawn out
  float pxc = clamp(uPx, 1., 2.5);
  float w0 = wq; wq = max(wq, mix(2.05, 2.85, step(.9, nvWk)) * aN * pxc); aa = aN * .8;            // the cord far down the hall is never drawn thinner than the thinnest line that holds (uPx)
  float h = nvHash(key + seed), h2 = nvHash(key.yx + 7.3 + seed);
  float ph = fract(h + uTime * uNetP.y * (.6 + .8 * h2));
  float gone = step(h2, .3) * smoothstep(0., .08, ph) * (1. - smoothstep(.14, .22, ph));   // a cord drawn back into its knots, then thrown again (about one cord in thirty is away at any moment: the net is whole, and never still)
  live *= 1. - gone * nvGone * step(.5, mc) * step(.5, mn);   // (a selvedge cord, one with a mesh on one side only, is never drawn back: an edge mesh is always closed)
  float hl = .288675;
  float tt = t / hl;
  float bend = bel * sg * (-n.y) * (1. - tt * tt);       // slack cord hangs in a slight belly (sheet -y is down)
  float dist = abs(.5 + bend - abs(s));
  float across = 1. - smoothstep(.5 * wq - aa, .5 * wq + aa, dist);
  // at arm's length the ribbon is laid twine: fine slits on the slant, a hand's detail that shows only where a cord is 6 px wide and more
  float cpw = wq / aN * .75, lp = 1.7 * wq, fl = abs(fract((t + .8 * (.5 + bend - abs(s)) * sg) / lp) - .5), el = aT / lp;
  across *= 1. - smoothstep(5.5, 8., cpw) * (1. - smoothstep(.08 - el, .08 + el, fl));
  float open = hl * (1. - live) * 1.04;
  float along = live > .995 ? 1. : smoothstep(-aT, aT, abs(t) - open) * smoothstep(.02, .12, live);   // a dead cord leaves nothing, not a dot at each end
  // the odd doubled cord where the net was mended
  // (two cords of the ordinary width a cord's width apart, from knot to knot: the second lies on the cord's +n side only, so it is
  // drawn by the one mesh that has the cord on its -n side; where the pair would be too small to show its gap it is one cord)
  float mend = nvGone * step(.965, h) * step(sg, 0.) * step(wq, .042) * (1. - smoothstep(.5 * wq - aa, .5 * wq + aa, abs(.5 + bend - abs(s) - 2. * wq)));
  float hw = max(5. * w0, 17. * aN * pxc);                    // the reach of a crossing's lozenge either side of the cord, never under about 13 px
  float fatv = (1. - smoothstep(hw - aa, hw + aa, dist)) * along;
  nvFat = max(nvFat, fatv);
  if (fatv > .01 && dist < nvCd) { nvCd = dist; nvCn = n; nvCs = s - sg * (.5 + bend); nvCt = t; }   // the nearest live cord, not the first within reach
  return vec4(max(across, mend) * along, live, abs(s), sg);
}
vec2 nvNet(vec2 q, float m, vec2 F, mat2 J, float aa, int mode){
  float seed = float(mode) * 19.;
  vec2 axq = vec2(q.x - q.y * .5773503, q.y * 1.1547005);
  vec3 cu = vec3(axq, -axq.x - axq.y); vec3 rc = floor(cu + .5); vec3 df = abs(rc - cu);
  if (df.x > df.y && df.x > df.z) rc.x = -rc.y - rc.z; else if (df.y > df.z) rc.y = -rc.x - rc.z;
  vec2 ci = rc.xy;
  vec2 c = vec2(ci.x + .5 * ci.y, .8660254 * ci.y);
  vec2 d = q - c;
  vec2 Fc = F - J * d;
  nvCq = c; nvQp = q; nvFq = F; nvJq = J;
  float mc = nvMaskAt(Fc, c, mode);
  nvCellB = nvMb; nvCellM = mc;
  nvCell = nvIn(Fc);
  float wq = .03 * nvWk / max(m, .02);
  float bel = nvBelK * uNetP.z * clamp((m - .5) * .03, 0., .024) * (mode == 0 ? 1. : 0.);   // a slight sag only: a slack mesh is still plainly six-sided
  nvFat = 0.; nvCd = 9.;
  vec2 n0 = vec2(1., 0.), n1 = vec2(.5, .8660254), n2 = vec2(-.5, .8660254);
  vec4 e0 = nvEdge(d, n0, ci, vec2(1., 0.), mc, Fc, J, wq, aa, bel, mode, seed);
  vec4 e1 = nvEdge(d, n1, ci, vec2(0., 1.), mc, Fc, J, wq, aa, bel, mode, seed);
  vec4 e2 = nvEdge(d, n2, ci, vec2(-1., 1.), mc, Fc, J, wq, aa, bel, mode, seed);
  float cord = max(e0.x, max(e1.x, e2.x));
  // knot: the corner between the two nearest cords; alive only if all three of its cords are
  vec2 ea, eb; float la, lb; vec2 oa, ob;
  if (e0.z <= e1.z && e0.z <= e2.z) { ea = n1 * e1.w; eb = n2 * e2.w; la = e1.y; lb = e2.y; oa = vec2(0., 1.) * e1.w; ob = vec2(-1., 1.) * e2.w; }
  else if (e1.z <= e2.z) { ea = n0 * e0.w; eb = n2 * e2.w; la = e0.y; lb = e2.y; oa = vec2(1., 0.) * e0.w; ob = vec2(-1., 1.) * e2.w; }
  else { ea = n0 * e0.w; eb = n1 * e1.w; la = e0.y; lb = e1.y; oa = vec2(1., 0.) * e0.w; ob = vec2(0., 1.) * e1.w; }
  vec2 vd = (ea + eb) * .3333333;                         // corner, relative to the cell centre (length .577)
  vec2 key3 = 2. * ci + oa + ob;
  float h3 = nvHash(key3 + seed), h4 = nvHash(key3.yx + 7.3 + seed);
  float ph3 = fract(h3 + uTime * uNetP.y * (.6 + .8 * h4));
  float m3a = nvMaskAt(Fc + J * ea, c + ea, mode), m3b = nvMaskAt(Fc + J * eb, c + eb, mode);
  float live3 = step(.5, max(m3a, m3b));
  live3 *= 1. - step(h4, .3) * smoothstep(0., .08, ph3) * (1. - smoothstep(.14, .22, ph3)) * nvGone * step(.5, m3a) * step(.5, m3b);
  float kl = min(live3, min(la, lb));
  vec2 kkey = 3. * ci + oa + ob;                          // the corner's own label (same from all three cells)
  vec2 jit = (vec2(nvHash(kkey * 3.1 + 1.), nvHash(kkey * 3.1 + 5.)) - .5) * .028 / max(m, .05);
  vec2 dk = d - vd - jit;
  float kls = smoothstep(.04, .5, kl), rad0 = min(.085, .2 * m);
  // the knot's short half axis in the drawing's dots; on a surface within arm's reach (the soffit, the vault of the skim) it is held to a fist's size, never a blot
  mat2 A = nvG * nvFp; float sa = dot(A[0], A[0]), sb = dot(A[1], A[1]), sc = dot(A[0], A[1]);
  float smax = sqrt(.5 * (sa + sb) + sqrt(.25 * (sa - sb) * (sa - sb) + sc * sc)) + 1e-6;     // sheet metres / m per pixel, most foreshortened way
  float bpx = rad0 * kls / (m * nvKs.x * smax);
  float pk0 = clamp(uPx, .5, 4.);
  float kmx = (5.8 + 8.5 * smoothstep(50., 130., 1. / (smax * pk0))) * pk0, kz = max(1., bpx / kmx); bpx = min(bpx, kmx);   // (on the bridge soffit 1.2 m over the eye and on the vault beside the skim a mesh carries a fist of a knot, a plain white trefoil)
  vec2 kd = (nvG * dk) * m * nvKs * kz;                   // metres from the knot
  float kr = length(kd) + 1e-5;
  vec2 vdir = nvG * vd; vdir /= max(length(vdir), 1e-4);
  float cph = dot(kd / kr, vdir);
  float c3 = 4. * cph * cph * cph - 3. * cph;             // cos 3phi: three lobes, set between the cords
  float rad = rad0 * (.7 - .3 * c3) * kls;                // the knot outlasts its cords: no stub without one
  // its edge is filtered along its own radius, so a knot seen at a slant is a hard-edged lens, never a grey smear;
  vec2 gl = ((kd / kr) * nvKs * m * kz) * nvG;
  float aK = length(gl * nvFp) * .7 + 1e-6;
  float knot = (1. - smoothstep(rad - aK, rad + aK, kr)) * step(.02, rad);
  // far off it is never much longer on screen than it is wide (a slanted knot is cut to a small round mark, not a streak
  // along the row). A knot is never wider than a fifth of its mesh as the mesh measures on screen along its short axis
  // (more where the mesh is large enough to show the trefoil), and a mesh under about 10 px has none: far off the net is
  // cord colour, not white
  float det = nvFp[0][0] * nvFp[1][1] - nvFp[1][0] * nvFp[0][1];
  if (abs(det) > 1e-12) {
    vec2 px = mat2(nvFp[1][1], -nvFp[0][1], -nvFp[1][0], nvFp[0][0]) * dk / det; float pr = length(px);
    float fa = sa, fb = sb, fc = sc;                        // (measured in sheet metres, nvG * nvFp: on a drawn-out lattice a lattice step is not a mesh's size on screen)
    float mpx = 1. / smax;                                  // the mesh's short axis in pixels
    // a mesh seen at a slant (a vault from the boat: 60 px long, 15 px tall) still shows its knots: where the long axis is over
    // about 25 px the knot is a round mark a third of the mesh's short axis across, at most about 5 px, so rows of knots
    // never touch
    float mpl = 1. / (sqrt(max(.5 * (fa + fb) - sqrt(.25 * (fa - fb) * (fa - fb) + fc * fc), 1e-12)) + 1e-6);   // the mesh's long axis in pixels
    // (a cord that is nearly the white of outdoors, the morning's lemon and the winter's silver, needs a larger knot to read as a separate mark)
    float kwh = mix(1.4, 1., smoothstep(.37, .46, length(uCord - uWhite)));   // (linear colour: morning .34, noon .51, amber .70, winter .16)
    float flo = min(2.3 * kwh * clamp(uPx, .5, 4.), .078 * kwh * mpx) * smoothstep(18., 26., mpl);   // (a small mesh has a small knot: white stays well under the cord)
    float pxk = clamp(uPx, .5, 4.);
    float capm = max(mix(.1, .4, smoothstep(22. * pxk, 64. * pxk, mpx)) * mpx, flo);   // (a fifth of the mesh until the mesh is large on screen; the full trefoil only at arm's length)
    float cap = min(max(2.15 * pxk, mix(1.35, 2.4, smoothstep(3., 8., bpx)) * bpx), capm);   // (a big knot at arm's length keeps its trefoil)
    float has = step(.5, max(smoothstep(9.5, 12., mpx), smoothstep(6.5, 8.5, mpx) * smoothstep(18., 26., mpl)));   // (a knot is white or absent)
    knot *= (1. - smoothstep(cap - .6, cap + .6, pr)) * has;
    float rd = min(max(1.5, flo), capm) * kls;
    knot = max(knot, (1. - smoothstep(rd - .45, rd + .45, pr)) * step(.6, rd) * has);
  }
  return vec2(cord, knot);
}
`;

// ---------------------------------------------------------------------------------------------------------
// NV_LIGHT_GLSL: lays the net over a flat base colour. sh = sheet metres, q = lattice coordinate (already
// lifted off the surface by the caller), m = mesh size, F/J = water foot and dF/dq, gain 0..1.
// Near: main net + wake-band net + fold B (white lozenges where two folds cross). Far (a mesh under about
// 6 px): parallel gold strokes at the net's average coverage. Call it outside loops (it takes derivatives).
// ---------------------------------------------------------------------------------------------------------
export const NV_LIGHT_GLSL = /* glsl */`
// parallel gold strokes along the sheet's long axis, 7..14 px apart (divided by dens; dens over 1.5 = unbroken, for wake bands),
// every other one fading as they crowd
float nvHatch(vec2 sh, float fpy, float dens){
  float lvl = log2(max(fpy, 1e-4) * 7. / dens); float f = fract(lvl); float S = exp2(floor(lvl) + 1.);
  float u = sh.y / S + .5; float idx = floor(u); float dS = abs(fract(u) - .5) * S;
  float line = 1. - smoothstep(.2 * fpy, 1.2 * fpy, dS);
  float od = mod(idx, 2.), sn = sin(sh.x * .32 / max(S, 1e-3) + idx * 2.4 + uTime * .5);
  float thr = mix(mix(-.4, -1.1, step(1.5, dens)), 1.1, od * f);   // (a stroke is cord colour or absent: as they crowd, every other one draws its dashes in to nothing)
  return line * smoothstep(thr - .04, thr + .04, sn);
}
// The far tier. A net too small or too foreshortened to draw mesh by mesh is drawn as what a foreshortened honeycomb looks
// like: rows of staggered gold dashes across the line of sight (each a mesh's cross cord). Rows stay 9 px or more apart and
// dashes 10 px or more long: as they crowd, every other row fades out and the dashes double in length. Returns (cord, 0).
// one level of dashes: x = coverage, y = pixels along the row from this point to the nearer end of its dash
vec3 nvDash(float qy, float par, float Sy, float ayS, float hl){
  float row = floor(qy / (.8660254 * Sy) + .5), dy = abs(qy / Sy - .8660254 * row);
  float onr = 1. - mod(row + par, 2.);
  return vec3(onr * (1. - smoothstep(hl - ayS, hl + ayS, dy)) * step(.03, hl), mix(99., (dy - hl) / max(ayS, 1e-5), onr), .8660254 * row * Sy);
}
// a row of dashes carries no white, anywhere: white belongs to a mesh that is drawn cord by cord (nvNet)
vec2 nvRows(vec2 q, float ax, float ay, float dens){
  float lvl = max(log2(max(ax, 1e-5) * 9. / dens) + 1., 0.);
  float n = floor(lvl), f = lvl - n, S = .5 * exp2(n);
  float u = q.x / S, idx = floor(u + .5), dpx = abs(u - idx) * S / ax;          // pixels from the row
  float o = abs(idx);                                                            // the row's odd part: the same at every level, so no dash jumps
  for (int i = 0; i < 7; i++) { if (o > .5 && mod(o, 2.) < .5) o *= .5; }
  float par = mod(floor(o * .5), 2.);
  // as the rows crowd, every other row draws its dashes in to nothing: a mark is whole or absent, never half faded
  float hl = .2887 * mix(1., 1. - smoothstep(.15, .85, f), mod(idx, 2.));
  float line = 1. - smoothstep(.45, 1.35, dpx);
  float ly = max(log2(max(ay, 1e-5) / .06), 0.), ny = floor(ly), Sy = exp2(ny);
  // (a dash drawing in to nothing is never left as a tick: under about 5 px long it is gone)
  vec3 d0 = nvDash(q.y, par, Sy, ay / Sy, hl * step(2.5 * ay / Sy, hl)), d1 = nvDash(q.y + 1.3 * Sy, par, 2. * Sy, .5 * ay / Sy, hl * step(1.25 * ay / Sy, hl));
  d1.z -= 1.3 * Sy;
  vec3 dd = ly - ny > .6 ? d1 : d0;
  nvRowC = vec2(idx * S, dd.z);
  return vec2(line * dd.x, 0.);
}
const float KB = 1.7;      // the second fold's honeycomb is this many times wider than the first and turned 21 degrees (the brief's numbers); it slides the
                            // other way, so the crossings and their white diamonds travel along the cords
float nvHatchK = 1.;        // density of the lengthwise strokes (over 1.5: unbroken, for the hauled net running into the eye)
vec3 nvLight(vec3 base, vec2 sh, vec2 q, float m, vec2 F, mat2 J, float gain){
  gain *= uNetP.w;
  float vx = max(uVar.x, .2);
  q.x *= vx; J[0] /= vx;
  mat2 G0 = nvG, Gi0 = nvGi;
  nvG = nvG * mat2(1. / vx, 0., 0., 1.); nvGi = mat2(vx, 0., 0., 1.) * nvGi;
  vec2 dqx = dFdx(q), dqy = dFdy(q);
  float ax = length(vec2(dqx.x, dqy.x)) + 1e-5, ay = length(vec2(dqx.y, dqy.y)) + 1e-5;   // lattice x and y per pixel
  float fpy = length(vec2(dFdx(sh.y), dFdy(sh.y))) + 1e-5;
  float fpx = length(vec2(dFdx(sh.x), dFdy(sh.x))) + 1e-5;
  if (gain < .004) { nvG = G0; nvGi = Gi0; return base; }
  // two tiers. near: real mesh, each cord filtered across its own footprint, so a mesh seen at a slant is drawn as a long
  // lozenge until it is under about 7 px long or 8 px wide (hauled meshes, long and narrow, until about 5 px wide); far: rows
  // of dashes across the line of sight (nvRows), or, on a surface foreshortened across the lattice, strokes along it (nvHatch)
  float hk = 1. + .8 * (1. - nvBelK);
  // (the change from one tier to the other is made in whole meshes: s0 is the footprint at this pixel, and each mesh is in or out
  // by the footprint at its own centre, nvIn; a cord is drawn in the cord colour or not at all, nothing is cross-faded)
  float s0 = max(ax / .145, ay / (.122 * hk));
  float yDom = step(1.7, ay / (ax * hk));
  vec3 dvp = vec3(F - cameraPosition.xz, nvY - cameraPosition.y); float Dp2 = dot(dvp, dvp) + 36.;
  float cellIn = 0.;
  vec2 Rr = nvReach(F); float reach = max(Rr.x, Rr.y);
  float band = nvBand(F), any = reach * (1. - band), anyAll = max(any, reach * band);
  vec2 sl = uTime * (uNetP.x * vec2(.8, .33) + vec2(uVar.y, 0.));
  vec2 W = .15 * vec2(sin(F.x * .31 + F.y * .17 + uTime * .9) + .6 * sin(F.y * .53 - uTime * 1.3),
                      sin(F.x * .23 - F.y * .37 + uTime * 1.1) + .6 * sin(F.x * .61 + uTime * .7));
  float cord = 0., knot = 0., loz = 0., bandDrawn = 0.;
  if (s0 < 1.6) {
    mat2 Fp = mat2(dqx, dqy); float amax = max(ax, ay) * .75;
    nvFp = Fp; nvNK = s0 / Dp2;
    vec2 A = nvNet(q + sl + W, m, F, J, amax, 0);
    cellIn = nvCell;
    float c = A.x, k = A.y, cbA = nvCellB, ownA = 1. - step(.5, nvCellM);   // (ownA: 0 where this pixel lies in a drawn mesh of the main net)
    if (band > .002 || cbA > .5) {
      // the wake-band net, NVT times tighter; too tight to draw as mesh it is drawn as close rows of dashes, never as a tint
      float s1 = max(NVT * ax / .078, NVT * ay / .092), inC = 0.;   // (the tight net is drawn mesh by mesh only where a mesh of it measures 13 px and more: nearer than that a stripe of small bright honeycomb, further off close rows of dashes, so a band never stands out as a patch of solid gold)
      vec2 q3 = q * NVT + sl * (NVT + 2.) + W * NVT + 11.3, C = vec2(0.), Rw = vec2(0.);
      nvQ3o = 2. * sl + 11.3;
      if (s1 < 1.6) { nvFp = NVT * Fp; nvKs = vec2(1.6); nvNK = s1 / Dp2; C = nvNet(q3, m / NVT, F, J / NVT, amax * NVT, 1); inC = nvCell; nvKs = vec2(1.); }   // small knots, a fifth of the mesh: the tight net is gold on the wall, never white
      C *= ownA;
      if (inC < .5 || s1 > .8) {
        // (too small to draw as mesh: close rows of dashes. A dash is drawn or not WHOLE, by its own middle: it must lie in a
        // mesh of the main net that is in the band and in reach, and in a tight mesh that is not drawn cord by cord; where the
        // main net is drawn cord by cord the dashes end on its selvedge cord. So none is cut to a tick in the open.)
        Rw = nvRows(q3, NVT * ax, NVT * ay, 1.4);
        vec2 qA = q + sl + W, cD = nvHexC(qA + (nvRowC - q3) / NVT);              // the main net's mesh under this dash's middle
        float outD = 1.;
        if (s1 < 1.6) { nvNK = s1 / Dp2; outD = 1. - nvIn(F + J * ((nvHexC(nvRowC) - q3) / NVT)); }
        nvNK = 0.; nvMask(F + J * (cD - qA), 0);
        Rw *= nvMb * outD * ownA;
      }
      bandDrawn = 1.;
      c = max(c, max(Rw.x, C.x)); k = max(k, C.y * (1. - step(.06, NVT * ax)));   // knots only while the tight mesh is long enough to hold them apart
      nvNK = 0.;
    }
    float dF = Fp[0][0] * Fp[1][1] - Fp[1][0] * Fp[0][1], gB = 0., gm = 0., mpxA = 0.;
    if (abs(F.x) < 11.5) {
    float fa = dot(Fp[0], Fp[0]), fb = dot(Fp[1], Fp[1]), fc = dot(Fp[0], Fp[1]);
    float mpx = 1. / (sqrt(.5 * (fa + fb) + sqrt(.25 * (fa - fb) * (fa - fb) + fc * fc)) + 1e-6);   // the first fold's mesh on screen: short axis,
    mpxA = mpx; gm = 1. / sqrt(max(abs(dF), 1e-12));                                                    // mean size
    // the second fold lies only where a mesh is large enough on screen to hold a crossing's diamond: nearer than that the
    // vault is two folds and their white lozenges, further off one clean foreshortened honeycomb
    // (the fold itself is cut in whole meshes by its distance from the eye, nvRg: about where a mesh of the first fold measures
    // 27 px; this gate only keeps it off surfaces seen so nearly edge-on that nothing could be read)
    gB = smoothstep(11., 13., gm) * smoothstep(4.5, 6., mpx);
    }
    if (gB > .001) {
      // fold B: the second fold laid over the first:
      // a honeycomb 1.7 times wider (plainly a second, wider net), turned 21 degrees (the brief's numbers): its cords cross the
      // first fold's wherever they fall, and a lozenge is drawn only at a crossing that has room for one. It rides with the first fold (the net slides over the brick, so
      // the white lozenges travel); a fold sliding against the other would carry most crossings into the knots
      mat2 Rb = mat2(.9335804, .3583679, -.3583679, .9335804), Rt = mat2(.9335804, -.3583679, .3583679, .9335804);
      vec2 slB = -.5 * sl;                               // (the first fold's lattice is q + sl + W, the second's q + slB + W: they slide opposite ways)
      vec2 qb = Rb * (q + slB + W) / KB;
      mat2 Jb = KB * J * Rt;
      nvFp = Rb * Fp / KB;
      mat2 Gs = nvG, Gis = nvGi; nvG = nvG * Rt; nvGi = Rb * nvGi;
      nvKs = vec2(KB);                                     // fold B's own knots are small: the crossing is the white mark of the second fold
      nvRg = m * 374. * clamp(uPx, .5, 4.) / 20.5;
      float gone0 = nvGone; nvGone = 0.; nvWk = .6;                    // (the second fold has no knots to draw a cord back into: its cords are whole, none doubled)
      vec2 Bf = nvNet(qb, m * KB, F, Jb, amax / KB, 2);
      nvKs = vec2(1.); nvG = Gs; nvGi = Gis; nvRg = 1e4; nvGone = gone0; nvWk = 1.;
      // The lozenge is the crossing itself: a slim white diamond lying along the second fold's cord (which carries no knots, so
      // there is room on it) where that cord crosses a cord of the first fold. It is worked out for the crossing, not for the
      // pixel: the second fold's cord is followed through the mesh of the first fold it lies in, the nearer of the two cords
      // it crosses there carries the diamond, and the diamond's length is cut to the room it has: under half of the way to the
      // next crossing on either side, clear of every knot of the two meshes (their drawn radius and a gap) and of the second
      // fold's own corners. Under 10 px long it is not drawn. So a diamond is whole or absent, none touches a knot or another.
      if (nvFat > .01 && abs(dF) > 1e-12) {
        float px1 = clamp(uPx, .5, 4.);
        mat2 Mi = mat2(Fp[1][1], -Fp[0][1], -Fp[1][0], Fp[0][0]) / dF;
        vec2 nb = (nvCn * Rb) / KB, bd = KB * vec2(-nb.y, nb.x), P0 = -KB * KB * nvCs * nb;   // (first-fold lattice: the cord's direction, and from this pixel to its foot on the cord)
        vec2 qf = q + sl + W + P0;
        vec2 axq = vec2(qf.x - qf.y * .5773503, qf.y * 1.1547005);
        vec3 cu = vec3(axq, -axq.x - axq.y); vec3 rc = floor(cu + .5); vec3 df = abs(rc - cu);
        if (df.x > df.y && df.x > df.z) rc.x = -rc.y - rc.z; else if (df.y > df.z) rc.y = -rc.x - rc.z;
        vec2 ci = rc.xy, d0 = qf - vec2(ci.x + .5 * ci.y, .8660254 * ci.y);
        vec2 n0 = vec2(1., 0.), n1 = vec2(.5, .8660254), n2 = vec2(-.5, .8660254);
        vec3 dn = vec3(dot(d0, n0), dot(d0, n1), dot(d0, n2)), bn = vec3(dot(bd, n0), dot(bd, n1), dot(bd, n2));
        float muE = 9., muN = -9., kE = 0., kN = 0., sE = 1., sN = 1.;
        for (int k = 0; k < 3; k++) {
          float bk = k == 0 ? bn.x : k == 1 ? bn.y : bn.z, dk = k == 0 ? dn.x : k == 1 ? dn.y : dn.z;
          if (abs(bk) > 1e-4) {
            float sg = bk > 0. ? 1. : -1., m1 = (sg * .5 - dk) / bk, m0 = (-sg * .5 - dk) / bk;
            if (m1 < muE) { muE = m1; kE = float(k); sE = sg; }
            if (m0 > muN) { muN = m0; kN = float(k); sN = -sg; }
          }
        }
        float useE = step(muE, -muN), mu = mix(muN, muE, useE), kk = mix(kN, kE, useE), sgk = mix(sN, sE, useE);
        vec2 nk = kk < .5 ? n0 : kk < 1.5 ? n1 : n2, offk = kk < .5 ? vec2(1., 0.) : kk < 1.5 ? vec2(0., 1.) : vec2(-1., 1.);
        vec2 Xl = d0 + mu * bd, d1 = Xl - sgk * nk, bo = bd * (2. * useE - 1.);
        float D1 = 9.;
        for (int k = 0; k < 3; k++) {
          vec2 nn = k == 0 ? n0 : k == 1 ? n1 : n2; float bk = dot(bo, nn);
          if (abs(bk) > 1e-4) D1 = min(D1, ((bk > 0. ? .5 : -.5) - dot(d1, nn)) / bk);
        }
        float sB = length(Mi * bd);                                                  // pixels per lattice step along the second fold's cord
        vec2 dbn = Mi * bd; dbn /= max(length(dbn), 1e-6);
        vec2 dan = Mi * vec2(-nk.y, nk.x); dan /= max(length(dan), 1e-6);
        float par = step(abs(dot(dan, dbn)), .975);            // two cords lying within 13 degrees of each other on screen make no diamond (it would be a white run)
        // the crossed cord must be there: not drawn back into its knots just now, and in the net
        vec2 key = 2. * ci + sgk * offk; float h = nvHash(key), h2 = nvHash(key.yx + 7.3);
        float ph = fract(h + uTime * uNetP.y * (.6 + .8 * h2));
        float gone = step(h2, .3) * smoothstep(0., .08, ph) * (1. - smoothstep(.14, .22, ph)) * nvGone;
        float onA = step(gone, .01) * step(.5, nvMask(F + J * (P0 + mu * bd), 0));
        float cpx = max(1.8, .03 / max(m * sqrt(abs(dF)), 1e-5));                    // the cord's width in pixels
        float rk = clamp(max(mix(.1, .4, smoothstep(22. * px1, 64. * px1, mpxA)) * mpxA, min(2.6 * px1, .2 * mpxA)), 2. * px1, 11. * px1) + .8 * px1;
        float Wm = max(1.9 * px1, .5 * cpx + 1.6 * px1), Lmin = max(6. * px1, 2.2 * Wm);   // (a diamond stands a little wider than the cord it lies on, and is at least twice as long as wide)
        float Lh = min(clamp(max(.22 * sB, 3. * Wm), 8.8 * px1, 70. * px1), .4 * sB * min(muE - muN, D1));
        Lh = min(Lh, .8 * KB * (.2887 - abs(nvCt + mu / KB)) * sB - px1);
        float Wc = max(.3 * Lh, Wm);
        for (int j = 0; j < 12; j++) {
          float a6 = (float(j) + .5) * 1.0471976;
          vec2 v = Mi * (.57735 * vec2(cos(a6), sin(a6)) + (j < 6 ? vec2(0.) : sgk * nk) - Xl);
          float al = abs(dot(v, dbn)), g = abs(v.x * dbn.y - v.y * dbn.x) - rk;
          if (g < Wc) Lh = min(Lh, g <= 0. ? al - rk : al / max(1. - g / Wc, 1e-3));
        }
        float clr = smoothstep(.55 * Lmin, Lmin, Lh); Lh = max(Lh, 1.);   // (a travelling crossing that runs out of room draws its diamond in to nothing; it does not blink)
        float Wh = max(.3 * Lh, Wm) * clr; Lh *= clr; clr = step(.02, clr); Wh = max(Wh, .01); Lh = max(Lh, .01);
        vec2 pp = Mi * (P0 + mu * bd);                                               // from this pixel to the crossing
        float dm = abs(dot(pp, dbn)) / Lh + abs(pp.x * dbn.y - pp.y * dbn.x) / Wh;
        loz = (1. - smoothstep(1. - .6 / Wh, 1. + .6 / Wh, dm)) * onA * par * clr * step(.5, gB);
      }
      c = max(c, Bf.x * step(.5, gB) * (1. - cbA));          // (the second fold shows no knots of its own: its cords and its diamonds say it is there; no cord of it lies on a band's mesh)
      loz *= 1. - cbA;
    }
    cord = c; knot = k;
  }
  nvNK = 0.;
  if (cellIn < .5) {
    // the far tier, drawn only in meshes that are out: on one side closed hexagons, on the other dashes
    float on = step(.5, anyAll);
    if (yDom > .5) {
      float thin = min(1., 1.5 * fpy / max(fpx, 1e-4));           // strokes seen end-on would crowd: fewer of them, never fainter
      cord = max(cord, nvHatch(sh, fpy, nvHatchK * mix(.55, 1., thin)) * on);
    } else {
      // (a wake band: rows twice as close)
      float quiet = mix(1., .55, smoothstep(45., 95., abs(F.y - uSlab.y)) * step(abs(F.y), 121.));   // far from the slab the rows lie further apart: the gold falls away from the heart
      // (a dash belongs to the band or to the main net by its own middle: whole on either side of the band's edge, none cut to a tick)
      vec2 qA = q + sl + W; float dn = max(clamp(1.45 / m, .6, 2.2) * quiet, 1.);
      // (and it is in the net or in a bare ray whole, by the reach at its own middle: a ray's edge cuts no dash)
      vec2 Rw = nvRows(qA, ax, ay, dn);
      vec2 Fd = F + J * (nvRowC - qA), Rd = nvReach(Fd); float bd = step(.5, nvBand(Fd));
      Rw *= step(.5, max(Rd.x, Rd.y)) * (1. - bd);
      if (band > .002 && bandDrawn < .5) {
        vec2 R2 = nvRows(qA, ax, ay, max(dn, 2.)); Fd = F + J * (nvRowC - qA); Rd = nvReach(Fd);
        Rw = max(Rw, vec2(R2.x * step(.5, max(Rd.x, Rd.y)) * step(.5, nvBand(Fd)), 0.));
      }
      cord = max(cord, Rw.x);
    }
  }
  nvG = G0; nvGi = Gi0;
  vec3 col = mix(base, uCord, cord * gain);
  col = mix(col, uWhite, max(knot, loz) * gain);
  return col;
}
`;

const MASONRY_VERT = /* glsl */`
attribute vec4 aSheet; attribute vec4 aFoot; attribute vec4 aFJ;
varying vec3 vW; varying vec4 vSheet; varying vec4 vFoot; varying vec4 vFJ;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vSheet = aSheet; vFoot = aFoot; vFJ = aFJ;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// tone code = tone + 8 * pattern + 64 * round(gain * 3)
//   tone: 0 honey stone, 1 rose brick, 2 umber, 3 milk white, 4 hull shade, 5 bottle green
//   pattern: 0 flat, 1 brick courses, 2 ashlar, 3 vault brick with honey ribs every bay, 4 end wall with the eye
const MASONRY_FRAG = /* glsl */`
varying vec3 vW; varying vec4 vSheet; varying vec4 vFoot; varying vec4 vFJ;
vec3 nvTone(float t){
  if (t < .5) return uHoney; if (t < 1.5) return uRose; if (t < 2.5) return uUmber;
  if (t < 3.5) return uWhite; if (t < 4.5) return uShade; return uGreen;
}
// THE BARE PATCH BEHIND A PIER IS LAID IN UMBER: the absence of net made one tone deeper, flat and hard edged. No light, no
// gradient, no fourth tone: rose brick that stands behind a pier, where no sunlit water reaches, is drawn with its two tones
// changed over (umber brick, rose course lines). Its edge is held still on the brick: it is worked out from the pixel's own
// water foot F and from nothing else of the picture (no clock, no slide, no swell, no lens). nvBehind says how far inside such a
// patch F lies (over 0: inside) once the patch is drawn in on every side by the selvedge's reach M (what one such reach
// measures in metres of foot across the hall, x, and along it, y: the reach is a round of the lattice, an oval on the water).
// The patch is the one nvReach leaves bare, by nvReach's own numbers:
//   centre aisle (|F.x| up to 10.5): the wedge behind a pier and its rib, t from 0 to Ls along the hall, Ls growing from the
//     crown to the springing; it ends, as the reach's own ray does, when the far end's net is hauled over it (uEye half open);
//   side aisles: the ray of a pier of the arcade seen from the slab (within 3.45 m of the pier's middle where the line from the
//     slab crosses the pier row), or the strip behind a wall pier between two water arches where the slab's own reach is cut
//     back (late afternoon), and in both only where the arch waters do not reach.
// Brick that is bare for another reason (a sheet baked without net, the slab's reach cut back in the open) is not a pier's
// shadow and stays as it was.
float nvBehind(vec2 F, vec2 M){
  float ax = abs(F.x);
  if (ax <= 10.5) {
    float sd = F.y >= uSlab.y ? 1. : -1., rel = (F.y + 104.) / 16.;
    float zr = (sd > 0. ? floor(rel) : ceil(rel)) * 16. - 104.;
    float t = sd * (F.y - zr) - mix(.5, 1.2, step(7.9, ax)), Dr = abs(zr - uSlab.y);
    float ur = min(ax, 8.) / 8., Lb = min(.42 * max(Dr - 8., 0.), 4.2 + .025 * Dr);
    float Ls = min(Lb * (.22 + .9 * ur * ur * ur), 8.);
    float on = step(abs(zr), 104.5) * (1. - step(F.y, -70.) * step(.5, clamp(uEye.z / max(uEye.w, 1e-3), 0., 1.)));
    // (the wedge's slant edge t = Ls is drawn in along its own normal: Ls rises by Lb * .3375 * ur * ur a metre of foot toward the
    // springing and never falls, so the tangent's count errs to the rose side. Behind the pier the umber never begins nearer
    // than 0.9 m past the ray's root, 0.2 m past the pier's own far face: a rose arris)
    return mix(-1., min(t - max(M.y, .9), Ls - t - length(vec2(Lb * .3375 * ur * ur * M.x, M.y))), on);
  }
  float den = F.x - uSlab.x, tt = ((F.x > 0. ? 9.2 : -9.2) - uSlab.x) / den;
  float zs = uSlab.y + (F.y - uSlab.y) * tt;
  vec2 dzs = tt * vec2((F.y - uSlab.y) / den, 1.);                         // how fast the crossing runs with the foot, across and along
  float gRay = (min(3.45 - abs(mod(zs + 112., 16.) - 8.), 106.25 - abs(zs)) - length(dzs * M)) / length(dzs);   // (in metres of foot, as the others are)
  float gPier = min(abs(mod(F.y + 104., 16.) - 8.) - 5.4 - M.y, min(ax - M.x - 13., 104. - abs(F.y) - M.y));
  float gNil = 2. * (uVar.w * smoothstep(10.5, 13., ax - M.x) - .5);
  float gIn = 20.6 - uVar.z - ax - 1.1 * sin(F.y * .21 + 1.7) * sin(F.y * .057) - length(vec2(M.x, .3 * M.y));
  float gDry = max(max(gIn, abs(F.y) - M.y - 119.5), gPier);
  return min(gDry, max(gRay, min(gNil, gPier)));
}
void main(){
  float code = floor(vFoot.w + .5);
  float tone = mod(code, 8.), pat = mod(floor(code / 8.), 8.), gain = floor(code / 64.) / 3.;
  vec2 sh = vSheet.xy; vec2 q = vSheet.zw; float m = max(vFoot.z, .05);
  vec3 dPx = dFdx(vW), dPy = dFdy(vW); vec2 dsx = dFdx(sh), dsy = dFdy(sh);
  float fp = max(length(dsx), length(dsy)) + 1e-5;
  float fjx = length(vec2(dsx.x, dsy.x)) + 1e-5, fjy = length(vec2(dsx.y, dsy.y)) + 1e-5;   // (each joint is filtered across its own width: a surface seen at a slant keeps the joints that can still be drawn)
  vec3 col = nvTone(tone);
  float bk = step(.5, tone) * step(tone, 1.5) * step(.5, pat) * step(.5, gain);   // rose brick that can carry the net (not a rib, not dressed stone, not a sheet baked without net)
  float joint = 0.;
  if (pat > .5 && pat < 1.5 || pat > 2.5) {                    // brick: 0.42 x 0.14 m, umber joints
    vec2 b = sh / vec2(.32, .105); b.x += .5 * mod(floor(b.y), 2.);
    vec2 fb = abs(fract(b) - .5) * vec2(.32, .105);
    joint = max((1. - smoothstep(.007 - .5 * fjx, .007 + fjx, .16 - fb.x)) * (1. - smoothstep(.016, .035, fjx)) * (1. - smoothstep(.03, .06, fjy)),
                (1. - smoothstep(.007 - .5 * fjy, .007 + fjy, .0525 - fb.y)) * (1. - smoothstep(.016, .035, fjy)));
  }
  if (pat > 1.5 && pat < 2.5) {                                // ashlar: 0.9 x 0.45 m
    vec2 b = sh / vec2(.9, .45); b.x += .5 * mod(floor(b.y), 2.);
    vec2 fb = abs(fract(b) - .5) * vec2(.9, .45);
    joint = max((1. - smoothstep(.011 - .5 * fjx, .011 + fjx, .45 - fb.x)) * (1. - smoothstep(.05, .12, fjx)) * (1. - smoothstep(.08, .16, fjy)),
                (1. - smoothstep(.011 - .5 * fjy, .011 + fjy, .225 - fb.y)) * (1. - smoothstep(.05, .12, fjy)));
  }
  if (pat > 2.5 && pat < 3.5) {                                // honey rib over every pier pair
    float rz = abs(mod(sh.x, 16.) - 8.);
    float rib = 1. - smoothstep(.5 - fp, .5 + fp, rz);
    float vj = abs(fract(sh.y / .7) - .5) * .7;
    float rj = max(1. - smoothstep(.012 - .5 * fp, .012 + fp, abs(rz - .5)), rib * (1. - smoothstep(.011 - .5 * fp, .011 + fp, vj)));
    joint = mix(joint, 0., rib);
    col = mix(col, uHoney, rib);
    bk *= 1. - rib;
    joint = max(joint, rj * (1. - smoothstep(.05, .12, fp)));
  }
  // Bare brick (a ray behind a rib or a pier, a wall that sees no sunlit water) is still drawn when its courses are too fine to
  // draw one by one: every second, fourth, eighth bed joint, 6 px or more apart, as thin umber lines that run with the courses
  // (down the hall on a vault), every other one drawing in to nothing as they crowd. So a shadow is plain brick, never a blank.
  if (pat > .5 && pat < 1.5 || pat > 2.5 && pat < 3.5) {
    vec2 Rb0 = nvReach(vFoot.xy);
    float bare = 1. - step(.5, gain) * step(.5, max(Rb0.x, Rb0.y));
    float fy = length(vec2(dsx.y, dsy.y)) + 1e-5;
    float lv = log2(fy * 6. / .105);
    if (bare > .5 && lv > 0.) {
      float fl = fract(lv), Sj = .105 * exp2(floor(lv) + 1.);
      float uj = sh.y / Sj + .5, ij = floor(uj), dj = abs(fract(uj) - .5) * Sj;
      float ln = 1. - smoothstep(.45 * fy, 1.25 * fy, dj);
      float sn = sin(sh.x * .9 / Sj + ij * 2.4);
      float thr = mix(-1.1, 1.1, mod(ij, 2.) * fl);
      float fx = length(vec2(dsx.x, dsy.x)) + 1e-5;
      ln *= smoothstep(thr - .04, thr + .04, sn) * (1. - smoothstep(.25, .6, fx / Sj));   // (seen end-on the breaks would crowd: no lines there)
      joint = max(joint, ln * (pat > 2.5 ? 1. - (1. - smoothstep(.5 - fp, .5 + fp, abs(mod(sh.x, 16.) - 8.))) : 1.));
    }
  }
  if (pat > 3.5 && abs(sh.x) < 8.) {
    // the blind arch that closes the centre aisle: beyond the eye's rim a recess in umber (the reveal), then dressed stone laid as
    // voussoirs round it down to the water; the net lies over all of it
    vec2 rb = sh - uEye.xy; float r0 = length(rb), ro = uEye.w + .82;
    if (r0 > ro) {
      float ang = atan(rb.x, -rb.y + 1e-4), ring = floor((r0 - ro - .28) / .62);
      vec2 vb = vec2(ang * 9. + .5 * mod(ring, 2.), (r0 - ro - .28) / .62);
      vec2 fv = abs(fract(vb) - .5) * vec2((r0 + 1e-3) / 9., .62);
      float jd = min(.5 * r0 / 9. - fv.x, .31 - fv.y);
      float jv = (1. - smoothstep(.011 - .5 * fp, .011 + fp, jd)) * (1. - smoothstep(.05, .12, fp));
      float rev = 1. - smoothstep(.28 - fp, .28 + fp, r0 - ro);
      col = mix(uHoney, uUmber, rev); joint = jv * (1. - rev);
      bk = 0.;
    }
  }
  col = mix(col, uUmber, joint);
  // The bare patch behind a pier, in umber (nvBehind). Its edge is set back from the reach's own edge by as far as the net's
  // selvedge can ever lie past it, so no cord lies on umber brick and no umber shows between cords; the rim of plain rose brick
  // between the selvedge and the umber is the brief's bare patch. The count, in meshes of the main net (lattice units):
  //   the corner of a mesh of the second fold whose middle is in reach, KB / sqrt(3) = 0.98 (a mesh of the main net 0.58, the
  //   tight net of a wake band in an edge mesh 0.87: the slide brings every mesh to every place, so the whole of it counts)
  //   + 0.06 for half a cord and a small knot + 0.1 m for the swell's warp between a mesh's middle and its corner (the warp's
  //   slope is under 0.16 a metre of foot) + 0.14 / m for the finger's lift of the cord seen at the lowest slant (0.03 / 0.22 m);
  // carried to the foot by dF/dq, with the ebb's stretch, and with the haul's full stretch where the far end's net is hauled.
  mat2 Jm = mat2(vFJ.xy, vFJ.zw);
  Jm[0] /= max(uVar.x, .2) * (1. - .31 * (1. - smoothstep(-120., -74., vW.z)));
  float Mq = KB * .57735 + .06 + .1 * m + .14 / m;
  float gU = nvBehind(vFoot.xy, Mq * vec2(length(vec2(Jm[0].x, Jm[1].x)), length(vec2(Jm[0].y, Jm[1].y))));
  // (a hard edge, met over one pixel. nvBehind is counted in metres of foot and rises by 2.5 a metre at the most, so its step
  // over a pixel is held to that: where it jumps from one pier's bay to the next, both sides far outside, nothing is tinted)
  float fF = max(length(dFdx(vFoot.xy)), length(dFdy(vFoot.xy)));
  float dk = bk * clamp(gU / max(min(fwidth(gU), 2.5 * fF), 1e-4) + .5, 0., 1.);
  // A flat umber face must not sink into umber brick: where the brick runs up to one, a rose arris line is left along the
  // meeting, a tenth of a metre and never under a course line's width, laid by the place on the masonry: on a vault beside each
  // rib's band (the rib's umber face stands on it); on the arcade (its two walls and the piers' side faces) at the plane of a
  // pier's end face, 1.2 m from the pier line, and under the string course's soffit line at 5.4 m.
  float dzp = abs(mod(vW.z + 112., 16.) - 8.), dA = 9.;
  if (pat > 2.5 && pat < 3.5) dA = dzp - .5;
  else if (pat < 1.5 && abs(vW.x) < 12. && abs(vW.z) < 119.5) dA = min(abs(dzp - 1.2), dzp < 1.2 ? 9. : 5.4 - vW.y);
  dk *= clamp((dA - max(.1, 1.4 * fp)) / fp + .5, 0., 1.);
  col = mix(col, mix(uUmber, uRose, joint), dk);
  col = mix(col, uGreen, 1. - smoothstep(.17 - fp, .17 + fp, vW.y - .05 * sin(sh.x * 2.7) - .03 * sin(sh.x * 7.1)));   // a hand-wide weed line at the tide mark
  // the cord lies a finger off the surface: shift the net against the courses by the view
  float det = dsx.x * dsy.y - dsx.y * dsy.x;
  vec2 lift = vec2(0.);
  if (abs(det) > 1e-12) {
    vec3 T = (dPx * dsy.y - dPy * dsx.y) / det, B = (dPy * dsx.x - dPx * dsy.x) / det;
    vec3 N = cross(dPx, dPy); float nl = length(N);
    vec3 V = cameraPosition - vW; float vl = length(V);
    if (nl > 1e-12 && vl > 1e-4) {
      N /= nl; V /= vl;
      float vn = max(abs(dot(V, N)), .22);
      lift = .03 * vec2(dot(V, T) / max(dot(T, T), 1e-4), dot(V, B) / max(dot(B, B), 1e-4)) / vn;
    }
  }
  mat2 J = mat2(vFJ.xy, vFJ.zw);
  vec2 rr = sh - uEye.xy; float r = length(rr) + 1e-4; float Re = uEye.z; float e = smoothstep(0., 1.5, Re);
  float isEye = step(3.5, pat); bool hole = false;
  nvBelK = 1.;
  // the haul: as the eye opens the far end's net is drawn toward it like a purse net: over the last 46 m the meshes
  // lengthen along the hall (the net running into the eye) and narrow to under a third, pulled taut
  float eo = clamp(uEye.z / max(uEye.w, 1e-3), 0., 1.);
  if (isEye < .5 && eo > .001 && abs(sh.x - vW.z) < .02 && vW.z < -70.) {
    float dzs = vW.z - uHaul.w, kq = m / max(uHaul.z * sqrt(1. + dzs * dzs / 1225.), .05);
    float qa = uHaul.y / kq, qe = uHaul.x / kq;
    float tq0 = (qa - q.x) / max(qa - qe, 1e-3), tq = clamp(tq0, 0., 1.), s1 = 1. / (1. + .45 * eo);
    float st = tq * tq * (3. - 2. * tq), g = tq - (1. - s1) * (tq * tq * tq - .5 * tq * tq * tq * tq);
    float ks = 1. - (1. - s1) * st, ky = 1. + 2.4 * eo * st;
    float dq = tq0 > 0. ? qa + (qe - qa) * g - q.x : 0.;
    q.x += dq; q.y *= ky; J[0] /= ks; J[1] /= ky;
    nvBelK = 1. - eo * st;
    // the drawn-out lattice keeps its true metric: cords of one width, round knots; cords are drawn back and thrown here as everywhere
    nvG = mat2(1. / ks, 0., 0., 1. / ky); nvGi = mat2(ks, 0., 0., ky);
    nvHatchK = 1. + .7 * step(nvBelK, .6);
  }
  if (isEye > .5) {                                            // the eye: one mesh hauled open, the wall's meshes drawn toward it
    nvBelK = 1. - e;
    hole = r < Re - .02;   // (inside the eye. Not cut here: the pixels on the rim take the net's footprint across it, so it runs on to nvLight's derivatives)
    float xr = r - Re, wr = 2.2 * Re + 1e-3, tr = clamp(xr / wr, 0., 1.), Sr = tr * tr * (3. - 2. * tr);
    // (the haul is made hand over hand: wave after wave runs out from the rim over the wall, each one drawing the meshes in toward
    // the eye and letting them ease again, strongest at the rim and gone where the haul's reach ends; ambient, on world time)
    float hp = 6.2831853 * (xr / 5.5 - uTime / 1.9), hw = .42 * e * (1. - Sr) * smoothstep(0., 1.2, xr);
    float rp = .6 * m * e + xr * mix(.42, 1., Sr) + hw * sin(hp);
    // the metric of the radial remap (radial and tangential stretch), so the cords that meet the rim keep their width
    float krr = max(mix(.42, 1., Sr) + xr * 3.48 * tr * (1. - tr) / wr + hw * 1.1424 * cos(hp), .22), kt = clamp(rp / r, .04, 1.);
    vec2 er = rr / r; float exx = er.x * er.x, exy = er.x * er.y, eyy = er.y * er.y;
    nvGi = mat2(krr * exx + kt * eyy, (krr - kt) * exy, (krr - kt) * exy, krr * eyy + kt * exx);
    nvG = mat2(exx / krr + eyy / kt, (1. / krr - 1. / kt) * exy, (1. / krr - 1. / kt) * exy, eyy / krr + exx / kt);
    q = uEye.xy / m + rr / r * rp / m + (q - sh / m);
  }
  nvY = vW.y;
  col = nvLight(col, sh, q + lift / m, m, vFoot.xy, J, hole ? 0. : gain); if (hole) discard;   // (the eye is cut here, after the last derivative: with no gain nvLight takes its derivatives and returns, so a pixel in the eye pays for no net)
  if (isEye > .5) {                                            // its rim: a gold cord set with white knots
    float ring = (1. - smoothstep(.09, .09 + 1.5 * fp, abs(r - Re - .16))) * e;
    float ang = atan(rr.y, rr.x + (abs(rr.x) + abs(rr.y) < 1e-4 ? 1e-4 : 0.));
    float ka = abs(fract(ang * 18. / 6.2831853 + .5) - .5) * 6.2831853 / 18. * r;
    float kn = (1. - smoothstep(.36, .36 + 1.5 * fp, length(vec2(ka, r - Re - .3)))) * e;
    col = mix(col, uCord, ring); col = mix(col, uWhite, kn);
  }
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------------------
// makeNetStyle(opts): the shared uniforms and the material factories. One style object per world.
//   style.uniforms            shared by every material (uTime, uSlab, uBoatA/B, uNetP, uEye, the seven colours)
//   style.masonry()           unlit ShaderMaterial for anything built with NvSheets (walls, vaults, piers, soffits)
//   style.shader(vert, frag)  any other material that wants the net: frag gets the uniforms + nvNet + nvLight
// ---------------------------------------------------------------------------------------------------------
export function makeNetStyle(opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : NV_PALETTE).map((h) => new THREE.Color(h));
  const uniforms = {
    uTime: { value: 0 }, uSlab: { value: new THREE.Vector4(1.5, 0, 3, 5) },
    uBoatA: { value: new THREE.Vector4(0, 200, -1, 0) }, uBoatB: { value: new THREE.Vector4(5, 200, -1, 0) },
    uNetP: { value: new THREE.Vector4(0.2, 0.045, 1, 1) },
    uBoatC: { value: new THREE.Vector4(0, 300, 1, 0) }, uDirC: { value: new THREE.Vector4(0, -1, 0, 0) },
    uWall: { value: new THREE.Vector4(0, 10, 0, 0) }, uVar: { value: new THREE.Vector4(1, 0, 0, 0) }, uEye: { value: new THREE.Vector4(0, 7.2, 0, 6.6) },
    uHaul: { value: new THREE.Vector4(-100, -60, 0.7, 0) }, uPx: { value: 1 },
    uHoney: { value: pal[0] }, uRose: { value: pal[1] }, uUmber: { value: pal[2] }, uGreen: { value: pal[3] },
    uCord: { value: pal[4] }, uWhite: { value: pal[5] }, uShade: { value: pal[6] },
  };
  const shader = (vertexShader, frag, extra = {}) => new THREE.ShaderMaterial({
    uniforms: extra.uniforms ? { ...uniforms, ...extra.uniforms } : uniforms, vertexShader,
    fragmentShader: NV_UNIFORMS_GLSL + NV_NET_GLSL + NV_LIGHT_GLSL + frag,
    side: extra.side ?? THREE.DoubleSide, fog: false, toneMapped: false,
    transparent: !!extra.transparent, depthWrite: extra.depthWrite ?? true,
  });
  return { uniforms, palette: pal, shader, masonry: () => shader(MASONRY_VERT, MASONRY_FRAG) };
}
export const nvCode = (tone, pat = 0, gain = 1) => tone + 8 * pat + 64 * Math.round(gain * 3);

// ---------------------------------------------------------------------------------------------------------
// NvSheets: collects "sheets" (unrolled surfaces) into one BufferGeometry for style.masonry().
//   grid(nu, nv, fn, code, skip?)  fn(u, v, o) fills o.x,o.y,o.z (position), o.sx,o.sy (sheet metres),
//     o.m (mesh size in metres), and optionally o.qx,o.qy (lattice coordinate, default sheet / m) and
//     o.fx,o.fz (water foot; default: plan position). dF/dq is worked out here by differences.
// ---------------------------------------------------------------------------------------------------------
export class NvSheets {
  // typed arrays that double when full (JS arrays grown by push to hundreds of thousands of numbers are re-allocated again and
  // again in the collector's large-object space, and the collection that provokes is one long pause in the middle of a build)
  constructor(cap = 4096) { this.cap = cap; this.pos = new Float32Array(cap * 3); this.sheet = new Float32Array(cap * 4); this.foot = new Float32Array(cap * 4); this.fj = new Float32Array(cap * 4);
    this.idx = new Uint32Array(cap * 6); this.ni = 0; this.n = 0; this.tmp = new Float64Array(1024); }
  _room(nv, ni) {
    if (this.n + nv > this.cap) {
      let c = this.cap; while (this.n + nv > c) c *= 2; this.cap = c;
      for (const [k, w] of [['pos', 3], ['sheet', 4], ['foot', 4], ['fj', 4]]) { const a = new Float32Array(c * w); a.set(this[k].subarray(0, this.n * w)); this[k] = a; }
    }
    if (this.ni + ni > this.idx.length) { let c = this.idx.length; while (this.ni + ni > c) c *= 2; const a = new Uint32Array(c); a.set(this.idx.subarray(0, this.ni)); this.idx = a; }
  }
  grid(nu, nv, fn, code, skip) {
    const W = nu + 1, o = {}, base = this.n, nvt = W * (nv + 1);
    this._room(nvt, nu * nv * 6);
    if (this.tmp.length < nvt * 4) this.tmp = new Float64Array(nvt * 8);
    const tmp = this.tmp, pos = this.pos, sheet = this.sheet, foot = this.foot, fj = this.fj, idx = this.idx;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      o.qx = undefined; o.fx = undefined;
      fn(i / nu, j / nv, o);
      const m = o.m || 1.2, qx = o.qx === undefined ? o.sx / m : o.qx, qy = o.qx === undefined ? o.sy / m : o.qy;
      const fx = o.fx === undefined ? o.x : o.fx, fz = o.fx === undefined ? o.z : o.fz;
      const l = j * W + i, n = base + l, p3 = n * 3, p4 = n * 4, t4 = l * 4;
      pos[p3] = o.x; pos[p3 + 1] = o.y; pos[p3 + 2] = o.z;
      sheet[p4] = o.sx; sheet[p4 + 1] = o.sy; sheet[p4 + 2] = qx; sheet[p4 + 3] = qy;
      foot[p4] = fx; foot[p4 + 1] = fz; foot[p4 + 2] = m; foot[p4 + 3] = code;
      tmp[t4] = qx; tmp[t4 + 1] = qy; tmp[t4 + 2] = fx; tmp[t4 + 3] = fz;
    }
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const a = (j * W + Math.max(i - 1, 0)) * 4, b = (j * W + Math.min(i + 1, nu)) * 4;
      const c = (Math.max(j - 1, 0) * W + i) * 4, d = (Math.min(j + 1, nv) * W + i) * 4;
      const qux = tmp[b] - tmp[a], quy = tmp[b + 1] - tmp[a + 1], qvx = tmp[d] - tmp[c], qvy = tmp[d + 1] - tmp[c + 1];
      const fux = tmp[b + 2] - tmp[a + 2], fuz = tmp[b + 3] - tmp[a + 3], fvx = tmp[d + 2] - tmp[c + 2], fvz = tmp[d + 3] - tmp[c + 3];
      let det = qux * qvy - quy * qvx; if (Math.abs(det) < 1e-9) det = 1e-9;
      // J = [dF/du dF/dv] * inverse([dq/du dq/dv]); stored by columns (dF/dqx, dF/dqy)
      const p4 = (base + j * W + i) * 4;
      fj[p4] = (fux * qvy - fvx * quy) / det; fj[p4 + 1] = (fuz * qvy - fvz * quy) / det; fj[p4 + 2] = (fvx * qux - fux * qvx) / det; fj[p4 + 3] = (fvz * qux - fuz * qvx) / det;
    }
    let ni = this.ni;
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      if (skip && skip((i + 0.5) / nu, (j + 0.5) / nv)) continue;
      const a = base + j * W + i, b = a + 1, c = a + W, d = c + 1;
      idx[ni] = a; idx[ni + 1] = b; idx[ni + 2] = d; idx[ni + 3] = a; idx[ni + 4] = d; idx[ni + 5] = c; ni += 6;
    }
    this.ni = ni; this.n += nvt;
  }
  // a flat rectangle: origin O, unit vectors T and B, size w x h, sheet origin (s0, t0), mesh m, horizontal normal (nx, nz) for the foot
  plane(O, T, B, w, h, code, m, s0 = 0, t0 = 0, nx = 0, nz = 0, nu = 1, nv = 1) {
    this.grid(nu, nv, (u, v, o) => {
      o.x = O[0] + T[0] * w * u + B[0] * h * v; o.y = O[1] + T[1] * w * u + B[1] * h * v; o.z = O[2] + T[2] * w * u + B[2] * h * v;
      o.sx = s0 + w * u; o.sy = t0 + h * v; o.m = m; o.fx = o.x + nx * o.y * 0.6; o.fz = o.z + nz * o.y * 0.6;
    }, code);
  }
  build() {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, n * 3), 3));
    g.setAttribute('aSheet', new THREE.BufferAttribute(this.sheet.slice(0, n * 4), 4));
    g.setAttribute('aFoot', new THREE.BufferAttribute(this.foot.slice(0, n * 4), 4));
    g.setAttribute('aFJ', new THREE.BufferAttribute(this.fj.slice(0, n * 4), 4));
    g.setIndex(new THREE.BufferAttribute(n > 65535 ? this.idx.slice(0, this.ni) : new Uint16Array(this.idx.subarray(0, this.ni)), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 40), 260);   // (the mesh is never culled; nothing reads a tighter one)
    return g;
  }
}
// mesh size along the hall: a hand's breadth is kept for the slab; the vault net is tight under the hatch and wide in the still ends
export const nvMesh = (dz, m0 = 0.42, L = 35) => m0 * Math.sqrt(1 + (dz / L) * (dz / L));
export const nvLat = (dz, m0 = 0.42, L = 35) => (L / m0) * Math.asinh(dz / L);

// ---------------------------------------------------------------------------------------------------------
// The hall's masonry: three barrel vaults, two rows of piers with arcade arches, outer walls with water
// arches, both end walls, the hatch. All of it goes into one NvSheets geometry (one draw call).
// ---------------------------------------------------------------------------------------------------------
const H = NV_HALL;
const NV_VIEW = [10, 14, 0, 5.5, 10];   // set-piece viewer framing (radius, height, centre): the viewer orbits inside the hall
async function buildMasonry(ctx, S, P) {
  const sz = P.slabZ, HONEY = nvCode(0, 2, 1), BRICK = nvCode(1, 1, 1), UMBER = nvCode(2, 0, 0);
  // a point on a wall plane x = const (sheet = z, y; mesh graded along the hall)
  const zy = (o, x, nx, z, y, k = 1) => {
    o.x = x; o.y = y; o.z = z; o.sx = z; o.sy = y; o.m = k * nvMesh(z - sz, P.m0);
    o.qx = nvLat(z - sz, P.m0) / k; o.qy = y / o.m; o.fx = x + nx * y * 0.6; o.fz = z;
  };
  const vault = (cx, r, k, nu, angles, code, skip) => S.grid(nu, angles.length - 1, (u, v, o) => {
    const a = angles[Math.round(v * (angles.length - 1))], z = H.z0 + H.len * u;
    o.x = cx + r * Math.sin(a); o.y = H.spring + r * Math.cos(a); o.z = z; o.sx = z; o.sy = r * a;
    o.m = k * nvMesh(z - sz, P.m0); o.qx = nvLat(z - sz, P.m0) / k; o.qy = o.sy / o.m;
    o.fx = cx + r * a * (2 / Math.PI); o.fz = z;
  }, code, skip);
  const ha = Math.asin(3 / H.rC), angC = [], angS = [];
  for (let i = 0; i <= 8; i++) angC.push(-Math.PI / 2 + (Math.PI / 2 - ha) * i / 8);
  for (let i = 1; i <= 4; i++) angC.push(-ha + 2 * ha * i / 4);
  for (let i = 1; i <= 8; i++) angC.push(ha + (Math.PI / 2 - ha) * i / 8);
  for (let i = 0; i <= 16; i++) angS.push(-Math.PI / 2 + Math.PI * i / 16);
  const VAULT = nvCode(1, 3, 1);
  vault(0, H.rC, 1, 96, angC, VAULT, (u, v) => Math.abs(H.z0 + H.len * u) < 5 && Math.abs(v - 0.5) < 0.1);
  await ctx.yield();
  vault(H.sideX, H.rS, 1.6, 96, angS, VAULT);
  await ctx.yield();
  vault(-H.sideX, H.rS, 1.6, 96, angS, VAULT);
  await ctx.yield();
  // the ribs: over every pier pair a honey arch stands a forearm proud of each vault. Its soffit and the face that looks at the
  // slab carry the net; the face turned from the slab is umber (it cannot see sunlit water), so from the gate the ribs are a
  // rhythm of dark arcs that crowd with distance, and from the hatch on they are honey. Behind each one runs its bare ray.
  const RD = 0.38, RW = 0.42, RIBF = nvCode(0, 0, 1);
  for (let kp = 0; kp < H.nPier; kp++) {
    const zr = H.pier0 + H.bay * kp, sd = zr >= sz ? 1 : -1;
    for (const [cx, r, k, n] of [[0, H.rC, 1, 18], [H.sideX, H.rS, 1.6, 12], [-H.sideX, H.rS, 1.6, 12]]) {
      const a0 = -Math.PI / 2, da = Math.PI, m = k * nvMesh(zr - sz, P.m0);
      S.grid(1, n, (u, v, o) => {
        const a = a0 + da * v, z = zr - RW + 2 * RW * u, rr = r - RD;
        o.x = cx + rr * Math.sin(a); o.y = H.spring + rr * Math.cos(a); o.z = z; o.sx = z; o.sy = r * a; o.m = m;
        o.qx = nvLat(z - sz, P.m0) / k; o.qy = o.sy / m; o.fx = cx + r * a * (2 / Math.PI); o.fz = z;
      }, HONEY);
      for (const e of [-1, 1]) S.grid(1, n, (u, v, o) => {
        const a = a0 + da * v, rr = r - RD * (1 - u), z = zr + e * RW;
        o.x = cx + rr * Math.sin(a); o.y = H.spring + rr * Math.cos(a); o.z = z; o.sx = r * a; o.sy = RD * u; o.m = m;
        o.fx = cx + r * a * (2 / Math.PI); o.fz = z - e * 0.6;
      }, (e > 0 ? sz + P.slabH - zr : zr - sz + P.slabH) > 3 ? RIBF : UMBER);   // (a face is lit if at least 3 m of the slab lies on its side: a rib that stands over the slab has no umber face)
    }
    await ctx.yield();
  }
  // hatch shaft, honey stone, up to the white
  const yh = H.spring + Math.sqrt(H.rC * H.rC - 9), mh = nvMesh(0, P.m0);
  const yc = yh + 0.42, yt = 15.3;
  for (const sx of [-1, 1]) {
    S.plane([sx * 3, yh, -5], [0, 0, 1], [0, 1, 0], 10, yc - yh, HONEY, mh, 0, 0, -sx, 0, 4, 1);
    S.plane([sx * 3, yc, -5], [0, 0, 1], [0, 1, 0], 10, yt - yc, UMBER, mh, 0, 0, -sx, 0, 1, 1);
    S.grid(6, 1, (u, v, o) => {
      const x = -3 + 6 * u, yb = H.spring + Math.sqrt(H.rC * H.rC - x * x);
      o.x = x; o.y = yb + (yb + 0.42 - yb) * v; o.z = sx * 5; o.sx = x; o.sy = o.y; o.m = mh; o.fx = x; o.fz = sx * (5 - 0.6 * (o.y - 13));
    }, HONEY);
    S.grid(6, 1, (u, v, o) => {
      const x = -3 + 6 * u, yb = H.spring + Math.sqrt(H.rC * H.rC - x * x) + 0.42;
      o.x = x; o.y = yb + (yt - yb) * v; o.z = sx * 5; o.sx = x; o.sy = o.y; o.m = mh; o.fx = x; o.fz = sx * 5;
    }, UMBER);
  }
  // piers: plinth, chamfer, brick shaft, chamfer, impost
  const frustum = (cx, cz, h0, y0, h1, y1, codeOf, m) => {
    for (let f = 0; f < 4; f++) {
      const nx = [1, 0, -1, 0][f], nz = [0, 1, 0, -1][f], tx = -nz, tz = nx, sl = Math.hypot(y1 - y0, h1 - h0);
      S.grid(1, 1, (u, v, o) => {
        const h = h0 + (h1 - h0) * v, w = (u * 2 - 1) * h;
        o.x = cx + nx * h + tx * w; o.z = cz + nz * h + tz * w; o.y = y0 + (y1 - y0) * v;
        o.sx = f * 3 + 1.5 + w; o.sy = y0 + sl * v; o.m = m; o.fx = o.x + nx * o.y * 0.6; o.fz = o.z + nz * o.y * 0.6;
      }, codeOf(nx, nz));
    }
  };
  await ctx.yield();
  const pierAt = (cx, cz) => {
    const m = Math.min(nvMesh(cz - sz, P.m0), 1.5);
    const lit = (nx, nz) => (nz !== 0 && nz * (sz - cz) < -4 ? 0 : 1);
    frustum(cx, cz, 1.5, -1.6, 1.5, 0.95, (nx, nz) => nvCode(0, 2, lit(nx, nz)), m);
    // (the face that turns from the slab is umber, the picture's dark: from the gate every pier shows one, past the hatch none)
    const bk = (tone, pat) => (nx, nz) => (lit(nx, nz) ? nvCode(tone, pat, 1) : nvCode(2, 0, 0));
    frustum(cx, cz, 1.5, 0.95, 1.2, 1.25, (nx, nz) => nvCode(0, 0, lit(nx, nz)), m);
    frustum(cx, cz, 1.2, 1.25, 1.2, 5.12, bk(1, 1), m);
    frustum(cx, cz, 1.2, 5.12, 1.42, 5.4, bk(0, 0), m);
    frustum(cx, cz, 1.42, 5.4, 1.42, 6.0, bk(0, 2), m);
  };
  for (let k = 0; k < H.nPier; k++) { if (k % 3 === 2) await ctx.yield(); for (const sx of [-1, 1]) pierAt(sx * H.pierX, H.pier0 + H.bay * k); }
  // the end wall's architecture: a respond (half a pier, the other half is in the wall) at the foot of each arcade, where the last
  // arch lands, and between the responds and the blind arch's ring a plinth course of dressed stone standing in the water
  for (const sx of [-1, 1]) {
    pierAt(sx * H.pierX, H.z0);
    const zf = H.z0 + 0.16, mp = Math.min(nvMesh(H.z0 - sz, P.m0), 1.5);
    S.grid(2, 2, (u, v, o) => { o.x = sx * (4.9 + 2.8 * u); o.y = -1.6 + 2.55 * v; o.z = zf; o.sx = o.x; o.sy = o.y; o.m = mp; o.fx = o.x; o.fz = zf + 0.6 * Math.max(o.y, 0); }, HONEY);
    S.grid(2, 1, (u, v, o) => { o.x = sx * (4.9 + 2.8 * u); o.y = 0.95; o.z = zf - 0.16 * v; o.sx = o.x; o.sy = v; o.m = mp; o.fx = o.x; o.fz = zf; }, UMBER);
    S.grid(1, 2, (u, v, o) => { o.x = sx * 4.9; o.y = -1.6 + 2.55 * v; o.z = zf - 0.16 * u; o.sx = o.z; o.sy = o.y; o.m = mp; o.fx = o.x; o.fz = zf; }, UMBER);
  }
  await ctx.yield();
  // arcade: an elliptical arch from pier to pier, honey ring, brick spandrel, umber soffit; honey string course above
  const edges = [H.z0];
  for (let k = 0; k < H.nPier; k++) edges.push(H.pier0 + H.bay * k - 1.2, H.pier0 + H.bay * k + 1.2);
  edges.push(H.z1);
  for (const sx of [-1, 1]) {
    for (const [xf, nx] of [[sx * 8.35, -sx], [sx * 10.05, sx]]) {
      for (let b = 0; b < edges.length; b += 2) {
        if (b % 8 === 6) await ctx.yield();
        const z0 = edges[b], z1 = edges[b + 1], zc = (z0 + z1) / 2, a = (z1 - z0) / 2, N = 14;
        const pt = (u, ring, o) => {
          const th = Math.PI * (1 - u), c = Math.cos(th), s = Math.sin(th);
          const z = Math.min(z1, Math.max(z0, zc + (a + ring) * c)), y = 3.0 + (1.9 + ring) * s;
          zy(o, xf, nx, z, y);
        };
        S.grid(N, 1, (u, v, o) => pt(u, v * 0.42, o), HONEY);
        S.grid(N, 1, (u, v, o) => { pt(u, 0.42, o); if (v > 0.5) zy(o, xf, nx, o.z, 5.4); }, BRICK);
        if (nx === sx) S.grid(N, 1, (u, v, o) => { pt(u, 0, o); o.x = sx * (8.35 + 1.7 * v); o.sx = o.z; o.sy = v; o.fx = o.x; }, UMBER);
      }
    }
    for (const [xf, nx, xin] of [[sx * 8, -sx, sx * 8.35], [sx * 10.4, sx, sx * 10.05]]) {
      S.grid(96, 1, (u, v, o) => zy(o, xf, nx, H.z0 + H.len * u, 5.4 + 0.6 * v), HONEY);
      S.grid(1, 1, (u, v, o) => { zy(o, xf + (xin - xf) * v, 0, H.z0 + H.len * u, 5.4); }, UMBER);
    }
    await ctx.yield();
  }
  // outer walls: thirteen water arches a side, honey ring, umber reveal; solid ends
  for (const sx of [-1, 1]) {
    const xw = sx * H.wallX, k = 1.35;
    for (let b = 0; b < 13; b++) {
      const zc = H.pier0 + H.bay * b + 8, R = H.archR, y0 = H.archSpring;
      const pt = (u, ring, o, x = xw) => {
        const i = Math.round(u * 18);
        if (i === 0 || i === 18) { zy(o, x, -sx, zc + (i ? 1 : -1) * (R + ring), -1.6, k); return; }
        const th = Math.PI * (1 - (i - 1) / 16);
        zy(o, x, -sx, zc + (R + ring) * Math.cos(th), y0 + (R + ring) * Math.sin(th), k);
      };
      const edge = (u, o) => {
        const i = Math.round(u * 18);
        if (i === 0 || i === 18) { zy(o, xw, -sx, zc + (i ? 8 : -8), -1.6, k); return; }
        const th = Math.PI * (1 - (i - 1) / 16), c = Math.cos(th), s = Math.sin(th);
        const t = Math.min(8 / Math.max(Math.abs(c), 1e-6), (5.4 - y0) / Math.max(s, 1e-6));
        zy(o, xw, -sx, zc + t * c, y0 + t * s, k);
      };
      S.grid(18, 1, (u, v, o) => pt(u, v * 0.45, o), HONEY);
      S.grid(18, 1, (u, v, o) => { if (v < 0.5) pt(u, 0.45, o); else edge(u, o); }, BRICK);
      // (soffit and reveals sit in a recess: umber, as the brief has it, under the bright 0.4 m net of the sunlit water they look down at)
      S.grid(18, 2, (u, v, o) => {
        pt(u, 0, o, xw + sx * H.wallT * v); const i = Math.round(u * 18);
        o.sx = i === 0 ? 0 : i === 18 ? 5.2 + Math.PI * R : 2.6 + R * Math.PI * (i - 1) / 16; o.sy = H.wallT * v; o.m = 0.4;
        o.qx = o.sx / o.m; o.qy = o.sy / o.m; o.fx = sx * (H.wallX + 1.6 + 0.4 * v); o.fz = zc + (o.z - zc) * 0.8;
      }, nvCode(2, 0, 1));
      if (b % 4 === 3) await ctx.yield();
    }
    S.grid(4, 1, (u, v, o) => zy(o, xw, -sx, H.z0 + 16 * u, -1.6 + 7 * v, k), BRICK);
    S.grid(4, 1, (u, v, o) => zy(o, xw, -sx, H.z1 - 16 * u, -1.6 + 7 * v, k), BRICK);
    S.grid(96, 1, (u, v, o) => zy(o, xw - sx * 0.03, -sx, H.z0 + H.len * u, 5.4 + 0.6 * v, k), HONEY);
    await ctx.yield();
  }
}

function buildEnds(S, P) {
  const top = (x) => (Math.abs(x) < 10.4 ? 14.5 : 12.5);   // carried up past the vaults (hidden above them): no chord of the wall's top can fall inside a vault's curve and show the white
  const gateTop = (x) => 4.3 + 1.1 * Math.sqrt(Math.max(1 - (x / 3.5) * (x / 3.5), 0));
  const parts = [[-22.4, -10.4, 12], [-10.4, -8, 1], [-8, -3.5, 5], [-3.5, 3.5, 8], [3.5, 8, 5], [8, 10.4, 1], [10.4, 22.4, 12]];
  const wall = (z, nz, m, pat, gate) => {
    parts.forEach(([x0, x1, n], pi) => {
      const fill = (o, x, y) => { o.x = x; o.y = y; o.z = z; o.sx = x; o.sy = y; o.m = m; o.fx = x; o.fz = z + nz * 0.6 * y; };
      if (gate && pi === 3) {
        S.grid(n, 1, (u, v, o) => { const x = x0 + (x1 - x0) * u; fill(o, x, gateTop(x) + 0.45 * v); }, nvCode(0, 2, 1));
        S.grid(n, 5, (u, v, o) => { const x = x0 + (x1 - x0) * u, yb = gateTop(x) + 0.45; fill(o, x, yb + (top(x) - yb) * v); }, nvCode(1, pat, 1));
      } else S.grid(n, 6, (u, v, o) => { const x = x0 + (x1 - x0) * u; fill(o, x, -1.6 + (top(x) + 1.6) * v); }, nvCode(1, pat, 1));
    });
  };
  wall(H.z1, -1, 1.6, 1, P.gate);
  wall(H.z0, 1, 1.3, 4, false);
}

// water: one plane. Bottle green; the white of outdoors lies in it under each arch as a broken ladder (a true
// mirror of the arch openings, cut by the swell); the slab is the net woven shut; the eye's gold ring lies broken in it.
const WATER_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_FRAG = /* glsl */`
varying vec3 vW;
// The white of outdoors lies in the water as a broken ladder: thin slivers lying across the hall, a row every 0.55 m, bent and
// moved by the swell, each a pointed lens. th = a sliver's half thickness as a share of the row pitch (0.5: the rows close up),
// den = the share of each row that is there, a = pitch units per pixel. Never a round blob.
float nvSliver(vec2 p, float th, float den, float a){
  float l = max(log2(max(a, 1e-5) * 5.), 0.), n = floor(l), fl = l - n, P = exp2(n);          // rows stay 5 px or more apart
  float zr = p.y / (.55 * P) + (.3 * sin(p.x * .9 + uTime * 1.3) + .17 * sin(p.x * 2.3 - uTime * .9)) / P;
  float row = floor(zr), f = abs(fract(zr) - .5);
  float h1 = nvHash(vec2(row * P, 3.1)), h2 = nvHash(vec2(row * P, 7.7));   // (a row keeps its dashes from one level to the next)
  float xs = p.x / mix(1.5, 3.8, h1) + h2 * 13. + uTime * .1 * (h1 - .5);
  float e = abs(fract(xs) - .5) * 2. / max(den, .05);
  float aP = a / P;
  float tk = max(th * (1. - e * e) * mix(1., 1. - fl, mod(row, 2.)), 1.1 * aP) * step(e, 1.) * step(fl * mod(row, 2.), .8);
  return (1. - smoothstep(tk - aP, tk + aP, f)) * step(e, 1.) * step(.001, tk);
}
void main(){
  // a surface below the water line (the skirt under the entry) is shaded as the water its ray met on the way down
  vec3 Pw = vW; float sk = step(vW.y, -.001);
  if (sk > .5) Pw = cameraPosition + (vW - cameraPosition) * (cameraPosition.y / max(cameraPosition.y - vW.y, 1e-3));
  vec2 p = Pw.xz;
  vec3 V = Pw - cameraPosition; float vl = length(V); V /= max(vl, 1e-4);
  float fp = max(length(dFdx(p)), length(dFdy(p))) + 1e-5;
  float amp = 1. - .6 * smoothstep(.15, .7, fp);
  vec2 g = vec2(cos(p.x * 2.3 + p.y * 1.1 + uTime * 1.7) + .7 * cos(p.x * 4.9 - p.y * 2.1 - uTime * 2.3),
                1.2 * cos(p.y * 3.2 - p.x * 1.3 + uTime * 2.1) + .7 * cos(p.y * 6.7 + p.x * 2.9 - uTime * 2.9));
  vec3 n = normalize(vec3(g.x * .08 * amp, 1., g.y * .1 * amp));
  vec3 R = reflect(V, n); R.y = max(R.y, .015);
  vec3 Rf = vec3(V.x, max(-V.y, .015), V.z);                 // the still mirror: it says where an opening's white can lie; the swell cuts that into slivers
  float sa = (length(vec2(dFdx(p.y), dFdy(p.y))) + 1e-5) / .55;
  vec3 col = uGreen;
  float ax = abs(p.x);
  // mirror of the water arches of the outer wall
  float sx = Rf.x > 0. ? 1. : -1.;
  float rx = max(abs(Rf.x), 1e-3);
  float t = (22.4 - sx * p.x) / rx;
  vec3 hit = Pw + Rf * t;
  float dz = abs(mod(hit.z + 104., 16.) - 8.);
  float open = step(dz, 4.5) * step(abs(hit.z), 104.) * step(hit.y, 1. + sqrt(max(20.25 - dz * dz, 0.)));
  // the arcade is in the way if the ray starts in the centre aisle
  float tp = (9.2 - sx * p.x) / rx;
  if (tp > 0.) {
    vec3 hp = Pw + Rf * tp;
    float pz = abs(mod(hp.z + 112., 16.) - 8.);
    float tz = clamp((8. - pz) / 6.8, 0., 1.);
    float ya = 3. + 1.9 * sqrt(max(1. - tz * tz, 0.));
    open *= step(1.25, pz) * step(hp.y, ya);
  }
  open *= step(0., t) * step(ax, 22.4) * (1. - sk);
  // under each arch the white is whole at the sill and breaks into thinner, shorter slivers away from it: a ladder that narrows
  // and is gone 13 m from the wall, so mid-aisle, away from any opening, the water is plain green
  float wd = 22.4 - ax;
  float lad = nvSliver(p, mix(.3, .08, smoothstep(.3, 7., wd)), mix(.78, .26, smoothstep(.8, 9., wd)), sa);
  lad *= 1. - smoothstep(10., 13.5, wd);
  col = mix(col, uWhite, open * lad);
  // the hatch, mirrored: a broken white ladder on the aisle water
  if (ax < 8.) {
    vec3 hh = Pw + Rf * (13.4 / Rf.y);
    // (rows of unequal length that thin to a point at both ends and shorten away from the ladder's middle: no straight edge)
    float ez = abs(hh.z) / (5. + .07 * length(hh.xz - p));   // (seen from far down the aisle the ladder keeps a few slivers)
    float wx = 3. * (.62 + .38 * sin(p.y * 5.7) * sin(p.y * 2.3 + 1.)) * (1. - .45 * ez * ez);
    float ex = abs(hh.x) / max(wx, .05);
    float inH = step(ex, 1.) * step(ez, 1.);
    col = mix(col, uWhite, inH * nvSliver(p + 3.7, .3 * clamp(1. - ex * ex, 0., 1.) * (1. - .5 * ez), .7, sa));
  }
  // worked water: where a wake's band lies the swell throws up a few quick thin slivers of the white, never a patch
  float bw = nvBand(p);
  col = mix(col, uWhite, nvSliver(p * vec2(1.6, 1.) + 9.1, .1, .22, sa) * smoothstep(.6, .9, bw) * step(ax, 22.4));
  // outdoors: blank
  float inArch = step(22.4, ax) * step(abs(mod(p.y + 104., 16.) - 8.), 4.5) * step(abs(p.y), 104.);
  col = mix(col, uWhite, inArch * (1. - sk) * nvSliver(p + 5.3, .34, .9, sa));   // (the sill: green water under the arch's thickness, the ladder nearly closed)
  col = mix(col, uWhite, step(23.8, ax) * (1. - sk));
  // the eye's reflection
  if (R.z < -1e-3 && uEye.z > .05) {
    float te = (-120. - p.y) / R.z; vec3 he = Pw + R * te;
    float re = length(he.xy - uEye.xy);
    float ring = 1. - smoothstep(.3, .34, abs(re - uEye.z - .1));
    vec3 hf = Pw + Rf * ((-120. - p.y) / min(Rf.z, -1e-3));               // the eye is a cut-out of outdoors: its white lies under it as a ladder too
    float inE = step(length(hf.xy - uEye.xy), uEye.z - .3) * step(ax, 8.) * step(Rf.z, -1e-3);
    col = mix(col, uWhite, inE * nvSliver(p + 1.9, .26, .62, sa));
    col = mix(col, uCord, ring * step(ax, 8.));
  }
  // the slab: the net woven shut, a gold cloth. It is cut from whole 0.6 m meshes, so its edge is a selvedge; every mesh
  // keeps a small green eye that opens toward the selvedge (woven shut at the heart, paid out at the edge); white knots ride
  // on it; it heaves with the swell. Too far to draw the eyes, it is flat gold with its knots.
  float ms = .6;
  vec2 q2 = p / ms + .3 * g * amp + uTime * vec2(.31, .17);
  vec2 axq = vec2(q2.x - q2.y * .5773503, q2.y * 1.1547005);
  vec3 cu = vec3(axq, -axq.x - axq.y); vec3 rc = floor(cu + .5); vec3 df = abs(rc - cu);
  if (df.x > df.y && df.x > df.z) rc.x = -rc.y - rc.z; else if (df.y > df.z) rc.y = -rc.x - rc.z;
  vec2 dc = q2 - vec2(rc.x + .5 * rc.y, .8660254 * rc.y);
  vec2 pc = p - dc * ms;
  vec2 sd = abs(pc - uSlab.xy) - uSlab.zw;
  float wob = .3 * sin(pc.x * 1.1 + uTime * .8) * sin(pc.y * .9 - uTime * .6) + .2 * sin(pc.y * 2.1 + pc.x * 1.3 + uTime * 1.1);
  float ed = max(sd.x, sd.y) + wob;
  vec2 dq2x = dFdx(q2), dq2y = dFdy(q2);
  if (ed < 0.) {
    float a2 = max(length(dq2x), length(dq2y)) * .75 + 1e-5;                 // lattice units per pixel
    vec3 cloth = uCord;
    float hd = max(abs(dc.x), max(abs(dot(dc, vec2(.5, .8660254))), abs(dot(dc, vec2(-.5, .8660254)))));
    float hr = mix(.34, .09, smoothstep(0., 2.8, -ed)) + .03 * sin(uTime * 1.3 + pc.x * 2.1 + pc.y * 1.7);
    float eye = (1. - smoothstep(hr - a2, hr + a2, hd)) * (1. - smoothstep(.2, .32, a2));
    cloth = mix(cloth, uGreen, eye);
    nvFp = mat2(dq2x, dq2y); nvKs = vec2(.75); nvBelK = 0.;
    vec2 Ns = nvNet(q2, ms, p, mat2(ms, 0., 0., ms), a2, 0);
    nvKs = vec2(1.); nvBelK = 1.;
    cloth = mix(cloth, uWhite, Ns.y * (1. - smoothstep(.3, .45, a2)));
    col = mix(col, cloth, uNetP.w);
  }
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------------------
// Skiffs: one lofted clinker hull (white top strake, grey-green side, weed line, umber inside, honey thwarts
// and shipped oars, an optional rose canvas tilt), instanced; they rock in the vertex shader and nod to a wake.
// exported so the world can build its ride and its pace skiff from the same hull: nvSkiffGeometry(), style.hull()
// ---------------------------------------------------------------------------------------------------------
export function nvSkiffGeometry() {
  const pos = [], hull = [], h2 = [], idx = [];
  const quad = (a, b, c, d, tone, part, side, gain = 1) => {
    const n = pos.length / 3;
    for (const p of [a, b, c, d]) { pos.push(p[0], p[1], p[2]); hull.push(p[0] + 3.25, p[3] ?? p[1], tone, part); h2.push(side, gain); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  const NS = 12, bAt = (t) => Math.max(0.035, t > 0.42 ? 0.78 * Math.pow(Math.max(1 - Math.pow((t - 0.42) / 0.58, 2.2), 0), 0.75) : 0.78 - 0.26 * ((0.42 - t) / 0.42) ** 2);
  const ysAt = (t) => 0.4 + 0.22 * t * t * t + 0.05 * (1 - t) * (1 - t), ykAt = (t) => -0.26 + 0.2 * t ** 4;
  const prof = (t) => {                       // [z, y, girth] rows from keel to sheer, over the gunwale and down inside
    const b = bAt(t), ys = ysAt(t), yk = ykAt(t), bi = Math.max(b - 0.07, 0.01);
    const r = [[0, yk], [0.7 * b, yk + 0.05], [0.93 * b, -0.05], [0.97 * b, 0.06], [0.99 * b, ys - 0.17], [b, ys], [bi, ys], [0.88 * bi, -0.1], [0, -0.12]];
    let g = 0; r[0].push(0);
    for (let i = 1; i < r.length; i++) { g += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); r[i].push(g); }
    return r;
  };
  const tones = [4, 5, 4, 3, 3, 2, 2], parts = [0, 0, 0, 0, 0, 1, 1];
  for (let i = 0; i < NS; i++) {
    const t0 = i / NS, t1 = (i + 1) / NS, x0 = -3.25 + 6.5 * t0, x1 = -3.25 + 6.5 * t1, A = prof(t0), B = prof(t1);
    for (const sg of [-1, 1]) for (let k = 0; k < 8; k++) {
      quad([x0, A[k][1], sg * A[k][0], A[k][2]], [x1, B[k][1], sg * B[k][0], B[k][2]], [x1, B[k + 1][1], sg * B[k + 1][0], B[k + 1][2]], [x0, A[k + 1][1], sg * A[k + 1][0], A[k + 1][2]], tones[Math.min(k, 6)], parts[Math.min(k, 6)], sg, k < 5 ? 1 : 0);
    }
  }
  const T = prof(0);                           // transom
  for (let k = 0; k < 5; k++) quad([-3.25, T[k][1], -T[k][0], T[k][2]], [-3.25, T[k][1], T[k][0], T[k][2]], [-3.25, T[k + 1][1], T[k + 1][0], T[k + 1][2]], [-3.25, T[k + 1][1], -T[k + 1][0], T[k + 1][2]], k === 1 ? 5 : k > 2 ? 3 : 4, 1, 1, 0);
  for (const t of [0.22, 0.48, 0.72]) {        // thwarts
    const x = -3.25 + 6.5 * t, w = bAt(t) - 0.07, y = ysAt(t) - 0.13;
    quad([x - 0.12, y, -w], [x + 0.12, y, -w], [x + 0.12, y, w], [x - 0.12, y, w], 0, 1, 1, 0);
    quad([x + 0.12, y, -w], [x + 0.12, y - 0.05, -w], [x + 0.12, y - 0.05, w], [x + 0.12, y, w], 2, 1, 1, 0);
    quad([x - 0.12, y, -w], [x - 0.12, y - 0.05, -w], [x - 0.12, y - 0.05, w], [x - 0.12, y, w], 2, 1, 1, 0);
  }
  for (const sg of [-1, 1]) {                  // shipped oars: loom and blade, lying on the thwarts
    const z = sg * 0.3, y = 0.3;
    quad([-1.9, y, z - 0.035], [1.5, y + 0.04, z - 0.035], [1.5, y + 0.04, z + 0.035], [-1.9, y, z + 0.035], 0, 1, 1, 0);
    quad([-2.75, y - 0.01, z - 0.09], [-1.9, y, z - 0.05], [-1.9, y, z + 0.05], [-2.75, y - 0.01, z + 0.09], 0, 1, 1, 0);
    // stem post cheeks
    const ys = ysAt(1) + 0.14, yk = ykAt(1);
    quad([3.16, yk, sg * 0.045], [3.34, yk + 0.1, sg * 0.03], [3.36, ys, sg * 0.03], [3.2, ys, sg * 0.045], 3, 0, sg, 1);
  }
  quad([3.34, ykAt(1) + 0.1, -0.03], [3.34, ykAt(1) + 0.1, 0.03], [3.36, ysAt(1) + 0.14, 0.03], [3.36, ysAt(1) + 0.14, -0.03], 3, 1, 1, 0);
  // rose canvas tilt over the after half (part 2: folded away where an instance has none)
  // (the canvas is stretched over five hoops and sags a hand between them: the tilt is a row of four shallow scallops)
  const TS = 8, AS = 6, tp = (t, a, sag = 0) => { const b = bAt(t) + 0.02, ys = ysAt(t) - 0.02; return [-3.25 + 6.5 * t, ys + (0.78 - sag) * Math.sin(a), b * Math.cos(a), b * a]; };
  for (let i = 0; i < TS; i++) for (let j = 0; j < AS; j++) {
    const t0 = 0.03 + 0.45 * i / TS, t1 = 0.03 + 0.45 * (i + 1) / TS, a0 = Math.PI * j / AS, a1 = Math.PI * (j + 1) / AS, s0 = i % 2 ? 0.09 : 0, s1 = i % 2 ? 0 : 0.09;
    quad(tp(t0, a0, s0), tp(t1, a0, s1), tp(t1, a1, s1), tp(t0, a1, s0), 1, 2, j < AS / 2 ? 1 : -1, 1);
  }
  for (const t of [0.03, 0.48]) for (let j = 0; j < AS / 2; j++) {
    const a0 = Math.PI * j / AS, a1 = Math.PI * (j + 1) / AS;
    quad(tp(t, a0), tp(t, a1), tp(t, Math.PI - a1), tp(t, Math.PI - a0), j === 0 ? 2 : 1, 2, 1, j === 0 ? 0 : 1);   // the end: canvas drawn half down over the opening, umber below
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aHull', new THREE.Float32BufferAttribute(hull, 4));
  g.setAttribute('aHull2', new THREE.Float32BufferAttribute(h2, 2));
  g.setIndex(idx);
  return g;
}
// per instance: iData = (phase, tint 0 white / 1 rose, tilt 0/1, mesh size m)
const HULL_VERT = /* glsl */`
attribute vec4 aHull; attribute vec2 aHull2; attribute vec4 iData;
varying vec4 vHull; varying vec4 vFG; varying vec4 vJ; varying vec2 vTm;
void main(){
  vec3 p = position;
  if (aHull.w > 1.5) p *= step(.5, iData.z);
  mat4 M = modelMatrix * instanceMatrix;
  vec4 o = M * vec4(0., 0., 0., 1.);
  float band = nvBand(o.xz), ph = iData.x;
  float roll = .05 * sin(uTime * .9 + ph) + .1 * band * sin(uTime * 3.1 + ph);
  float pitch = .012 * sin(uTime * .7 + ph * 1.7) + .05 * band * sin(uTime * 2.6 + ph);
  float c = cos(roll), s = sin(roll); p.yz = vec2(c * p.y - s * p.z, s * p.y + c * p.z);
  c = cos(pitch); s = sin(pitch); p.xy = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  p.y += .03 * sin(uTime * 1.1 + ph * 2.3) + .05 * band * sin(uTime * 2.9 + ph);
  vec4 w = M * vec4(p, 1.);
  vec2 xa = (M * vec4(1., 0., 0., 0.)).xz, za = (M * vec4(0., 0., 1., 0.)).xz;
  vec2 nh = za * aHull2.x; float m = iData.w;
  float facing = dot(nh, uSlab.xy - o.xz);
  float gain = aHull2.y * max(step(0., facing), step(15., abs(o.x)));
  vHull = aHull; vFG = vec4(w.xz + nh * max(w.y, 0.) * .6, gain, m); vJ = vec4(xa * m, nh * m * .5); vTm = iData.yz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const HULL_FRAG = /* glsl */`
varying vec4 vHull; varying vec4 vFG; varying vec4 vJ; varying vec2 vTm;
void main(){
  float tone = floor(vHull.z + .5);
  vec3 col = tone < .5 ? uHoney : tone < 1.5 ? uRose : tone < 2.5 ? uUmber : tone < 3.5 ? uWhite : tone < 4.5 ? mix(uShade, uRose, step(.5, vTm.x)) : uGreen;
  float m = max(vFG.w, .05);
  nvRay = 0.;
  // a canvas tilt carries the net as cloth does: drawn in at each hoop and bellied between, in a mesh a third smaller than the
  // planking's, with an umber fold line over every hoop (the tilt is hull part 2; its hoops stand 0.73 m apart from 0.195 m)
  float tilt = step(1.5, vHull.w) * step(.5, tone) * step(tone, 1.5);
  float hp = (vHull.x - .195) / .73125, hd = abs(fract(hp + .5) - .5) * .73125, fh = fwidth(vHull.x) + 1e-5;
  vec2 shh = vHull.xy; float mt = mix(m, m * .68, tilt);
  shh.x += tilt * .085 * sin(6.2831853 * hp); shh.y *= 1. + tilt * .16 * cos(6.2831853 * hp);
  col = nvLight(col, shh, shh / mt, mt, vFG.xy, mat2(vJ.xy, vJ.zw) * (mt / m), step(.5, vFG.z));
  col = mix(col, uUmber, tilt * (1. - smoothstep(.012, .012 + fh, hd)) * (1. - smoothstep(.04, .09, fh)) * step(3e-5, fh));   // (not on the tilt's end, which stands square to the hull's length)
  gl_FragColor = vec4(col, 1.);
}`;

// Hart's-tongue ferns: fans of five flat bottle-green blades from the joints just above the waterline; they nod.
// await nvFerns(list of [x, y, z, nx, nz], rng, uniforms, ctx) -> Mesh (one draw call); exported for the canal walls.
export async function nvFerns(list, rng, U, ctx) {
  const pos = [], fa = [], idx = []; let nf = 0;
  for (const [px, py, pz, nx, nz] of list) {
    if (ctx && ++nf % 40 === 0) await ctx.yield();   // (loading without stalls: a breath every forty ferns)
    const tx = -nz, tz = nx, ph = rng.range(0, 6.28);
    for (let b = 0; b < 5; b++) {
      const ang = (b - 2) * 0.5 + rng.range(-0.12, 0.12), L = rng.range(0.5, 0.9) * (1 - 0.16 * Math.abs(b - 2)), w = rng.range(0.055, 0.08), out = rng.range(0.35, 0.75);
      const ax = [tx * Math.sin(ang) * Math.cos(out) + nx * Math.sin(out), Math.cos(ang) * Math.cos(out), tz * Math.sin(ang) * Math.cos(out) + nz * Math.sin(out)];
      const wd = [tx * Math.cos(ang), -Math.sin(ang), tz * Math.cos(ang)], n0 = pos.length / 3;
      for (const [f, ww] of [[0, 0.4], [0.3, 1], [0.72, 0.85], [1, 0.06]]) for (const sg of [-1, 1]) {
        const dr = f * f * 0.24 * L;
        pos.push(px + ax[0] * L * f + wd[0] * w * ww * sg + nx * dr * 0.6, py + ax[1] * L * f + wd[1] * w * ww * sg - dr * 0.5, pz + ax[2] * L * f + wd[2] * w * ww * sg + nz * dr * 0.6);
        fa.push(nx, nz, f, ph + b);
      }
      for (let r = 0; r < 3; r++) { const a = n0 + r * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  if (ctx) await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aFern', new THREE.Float32BufferAttribute(fa, 4));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uGreen: U.uGreen }, side: THREE.DoubleSide, fog: false, toneMapped: false,
    vertexShader: `attribute vec4 aFern; uniform float uTime;
      void main(){ vec3 p = position; float w = aFern.z * aFern.z;
        p.xz += aFern.xy * w * (.05 * sin(uTime * 1.4 + aFern.w) + .03 * sin(uTime * 2.3 + aFern.w * 1.7));
        p.y += w * .03 * sin(uTime * 1.9 + aFern.w * 2.1);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: 'uniform vec3 uGreen; void main(){ gl_FragColor = vec4(uGreen, 1.); }' });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return mesh;
}

// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));   // a family's own stream, from the visit's seed and its name
  // seeded variants, chosen once (all are uniforms and baked numbers: nothing is rebuilt in flight)
  const hour = opts.hour ?? rng.pick(['noon', 'noon', 'noon', 'morning', 'afternoon']);
  const waterKind = opts.water ?? rng.pick(['slack', 'breeze', 'ebb', 'breeze']);
  const roseFleet = opts.roseFleet ?? rng.chance(0.4);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : NV_PALETTE).slice();
  if (!opts.palette) { if (hour === 'morning') { pal[4] = '#FFF3B8'; pal[1] = '#B27064'; } else if (hour === 'afternoon') pal[4] = '#FFC47A'; }
  const style = opts.style ?? makeNetStyle({ palette: pal });
  const U = style.uniforms;
  const P = { slabZ: 0, m0: waterKind === 'slack' ? 0.46 : waterKind === 'breeze' ? 0.38 : 0.42, gate: opts.gate ?? true };
  const slabX = 1.2 + rng.range(0, 0.8);
  if (hour === 'morning') U.uSlab.value.set(slabX + 0.6, -9, 2.8, 9.5); else U.uSlab.value.set(slabX, 0, 3.4, 5.4);
  P.slabZ = U.uSlab.value.y; P.slabH = U.uSlab.value.w;
  U.uNetP.value.set(waterKind === 'slack' ? 0.13 : waterKind === 'breeze' ? 0.3 : 0.22, waterKind === 'slack' ? 0.035 : 0.055, waterKind === 'breeze' ? 0.5 : 1, 1);
  U.uEye.value.set(0, 7.2, 0, 6.6);
  U.uHaul.value.set(nvLat(H.z0 - P.slabZ, P.m0), nvLat(H.z0 + 46 - P.slabZ, P.m0), P.m0, P.slabZ);
  const group = new THREE.Group(); group.name = 'net-on-the-vault-hero';

  const S = new NvSheets(32768);
  await buildMasonry(ctx, S, P);
  buildEnds(S, P);
  await ctx.yield();
  const masonryGeo = S.build();
  await ctx.yield();
  const masonry = new THREE.Mesh(masonryGeo, style.masonry());
  masonry.frustumCulled = false; group.add(masonry);
  await ctx.yield();

  const waterMat = style.shader(WATER_VERT, WATER_FRAG, { side: THREE.FrontSide });
  const wz0 = opts.waterZ0 ?? -150, wz1 = opts.waterZ1 ?? 190;
  const wg = new THREE.PlaneGeometry(160, wz1 - wz0, 1, 1); wg.rotateX(-Math.PI / 2); wg.translate(0, 0, (wz0 + wz1) / 2);
  const water = new THREE.Mesh(wg, waterMat); water.frustumCulled = false; group.add(water);
  await ctx.yield();

  // the fleet: 96 skiffs, two by two: 26 pairs under the arcade arches, 22 pairs along the outer walls
  const hullMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: NV_UNIFORMS_GLSL + NV_NET_GLSL + HULL_VERT,
    fragmentShader: NV_UNIFORMS_GLSL + NV_NET_GLSL + NV_LIGHT_GLSL + HULL_FRAG, side: THREE.DoubleSide, fog: false, toneMapped: false });
  style.hull = () => hullMat;
  style.water = () => waterMat;
  await ctx.yield();
  const sg = nvSkiffGeometry();
  await ctx.yield();
  const spots = [];
  for (const sx of [-1, 1]) for (let k = 0; k < 13; k++) spots.push([sx, H.pier0 + H.bay * k + 8, 9.2, 0.87]);
  const wallSpots = [];
  for (const sx of [-1, 1]) for (let k = 0; k < H.nPier; k++) wallSpots.push([sx, H.pier0 + H.bay * k + (k < 13 ? 8 : 0), 20.6, 0.85]);   // before the water arches: a hull against the white of outdoors
  const mfr = stream('moored-fleet');
  mfr.shuffle(wallSpots);
  for (let i = 0; i < 22; i++) spots.push(wallSpots[i]);
  const nSk = spots.length * 2, fleet = new THREE.InstancedMesh(sg, hullMat, nSk), iData = new Float32Array(nSk * 4);
  const mat = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), moorings = [];
  spots.forEach(([sx, zc, xc, off], i) => {
    const turn = mfr.chance(0.5) ? 1 : -1, zj = mfr.range(-1.2, 1.2);
    for (let j = 0; j < 2; j++) {
      const x = sx * (xc + (j ? off : -off)) + mfr.range(-0.06, 0.06), z = zc + zj + mfr.range(-0.5, 0.5);
      eu.set(0, turn * Math.PI / 2 + mfr.range(-0.05, 0.05), 0); qt.setFromEuler(eu);
      mat.compose(new THREE.Vector3(x, 0.02, z), qt, new THREE.Vector3(1, 1, 1));
      const n = i * 2 + j; fleet.setMatrixAt(n, mat);
      iData.set([mfr.range(0, 6.28), roseFleet && n % 3 === 0 ? 1 : 0, mfr.chance(0.22) ? 1 : 0, Math.min(Math.max(nvMesh(z - P.slabZ, P.m0) * 0.45, 0.22), 0.5)], n * 4);
      moorings.push([x, 0, z]);
    }
  });
  sg.setAttribute('iData', new THREE.InstancedBufferAttribute(iData, 4));
  fleet.frustumCulled = false; group.add(fleet);
  await ctx.yield();

  // ferns on the plinths and at the feet of the outer walls
  const fr = stream('hall-ferns'), fl = [];
  for (let k = 0; k < H.nPier; k++) for (const sx of [-1, 1]) {
    const n = Math.round(fr.int(2, 4) * detail);
    for (let i = 0; i < n; i++) {
      const f = fr.int(0, 3), nx = [1, 0, -1, 0][f], nz = [0, 1, 0, -1][f], w = fr.range(-1.2, 1.2);
      fl.push([sx * H.pierX + nx * 1.5 - nz * w, fr.range(0.16, 0.6), H.pier0 + H.bay * k + nz * 1.5 + nx * w, nx, nz]);
    }
  }
  for (const sx of [-1, 1]) for (let k = 0; k < H.nPier; k++) for (let i = 0; i < Math.round(2 * detail); i++)
    fl.push([sx * (H.wallX - 0.01), fr.range(0.16, 0.7), H.pier0 + H.bay * k + fr.range(-3, 3), -sx, 0]);
  await ctx.yield();
  group.add(await nvFerns(fl, fr, U, ctx));
  await ctx.yield();

  // outdoors: one blank milk white, following the camera
  let dome = null;
  if (opts.dome !== false) {
    dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 16, 8), new THREE.ShaderMaterial({ uniforms: { uWhite: U.uWhite }, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: 'uniform vec3 uWhite; void main(){ gl_FragColor = vec4(uWhite, 1.); }' }));
    dome.renderOrder = -1; dome.frustumCulled = false; group.add(dome);
  }

  // staging: everything that happens once is driven by the world through setBoats / setEye
  const api = {
    setBoats(ax, az, aS, bx, bz, bS, heading = -1) { U.uBoatA.value.set(ax, az, heading, aS); U.uBoatB.value.set(bx, bz, heading, bS); },
    setEye(e) { U.uEye.value.z = U.uEye.value.w * Math.min(1, Math.max(0, e)); },
  };
  const clock0 = stream('water-clock').range(0, 240);   // the water's own phase for this visit: every clock term of the net and the water starts from it
  const camPos = new THREE.Vector3();
  return {
    object: group, radius: NV_VIEW[0], height: NV_VIEW[1], center: new THREE.Vector3(NV_VIEW[2], NV_VIEW[3], NV_VIEW[4]), ground: false, groundY: 0,
    style, ...api,
    anchors: {
      bounds: { min: [-23.8, -1.6, -120], max: [23.8, 16.2, 120] },
      gate: { position: [0, 0, 120], facing: [0, 0, 1], width: 7, height: 4.3 },
      portalSeat: { position: [0, 7.2, -119.9], facing: [0, 0, 1], radius: 6.5 },
      slab: [U.uSlab.value.x, 0, U.uSlab.value.y], hatch: [0, 14, 0], moorings,
      variant: { hour, water: waterKind, roseFleet },
    },
    update(dt, time, camera) {
      U.uTime.value = time + clock0;
      if (dome && camera) { camPos.setFromMatrixPosition(camera.matrixWorld); dome.position.copy(group.worldToLocal(camPos)); }
    },
    dispose() {},
  };
}
