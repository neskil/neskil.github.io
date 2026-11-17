// The One Standing Place: hero set piece "the lock" (after Emmanuel Maignan's anamorphic wall paintings).
//
// WHAT IT IS
//   The whole convent wing as one painted canvas, plus the three anamorphic grisaille pictures cast on it:
//   an armillary sphere (whole only from V1), a painted loggia (V2) and a laurel wreath round the portal (V3),
//   the two pivoting leaves that each carry part of a picture, and the cistern that holds the wreath a second
//   time, upside down. The pictures are not textures: every plaster, stone, tile and walnut fragment works
//   out where it lies in each picture's lantern cone and takes the paint if it is the first surface seen from
//   that vantage point (depth maps baked once in buildHero with ctx.renderer). From the
//   point the picture is seamless; from anywhere else parallax pulls it into long smears.
//   Four more pictures fill the stretches between: an astrolabe cast from the entry point over the cellar (whole in
//   the first frame only; drawn bold, in broad fields of the look's red, chalk and blue: limb, blue sea, zodiac ring of
//   twelve houses, star pointers, and inside them a plate of broad rings, a boss, a pin and a rule, which lie on the last
//   bays, stair A and the court's west wall. THE RULE OF THE SURFACE inside the cellar: the painter paints plaster and
//   tile, dressed stone stays stone. The vault webs, the plaster walls over the arches and the tiled floor carry the paint
//   in full colour, with the strips' joints, the tiles' joints and the cellar's sun and shade showing through it; piers,
//   bases, imposts, arch rings, soffits and jambs of travertine north of the mouth arch take none of it, so a stone arcade
//   stands clear in front of and between a painted vault and a painted pavement; the mouth arch itself, through which the
//   instrument is first seen, is painted. Outside the cellar it lies on every material alike), a doorcase round the gallery door cast from the
//   foot of stair B (not occlusion-tested: a region test), a glory of 32 rays round the wreath, cast from V3 onto the
//   window wall, the porch front, the north arcade screen, stacks and pergola, so that the roof terrace has paint that
//   resolves together with the wreath, and the glory's overspill: a fan of long rays and a ribbon on the court's north
//   and west walls and the landing behind the fountain wall, cast from where the flight comes out over the court
//   (u 0.77; a region test, kept west of x -13.5 so that none of it is in the sphere's frame at V1).
//
// SPACE (hero-local = the brief's coordinates: x east, y up, z south; the entry comes from +Z; garden at y 0;
//   place hero.object at the world origin unrotated). Wing x -54..54, z 8..-310, window wall top y 87.
//   radius 170, height 87, center (0, 30, -155).
//   - cellar arcade z 4..-124, floor y 0: piers at x -44,-4,4,44 every 31 m, barrel aisles, crown 16.5, open to the
//     garden on both long sides below y 17; it carries the astrolabe. The cellar has materials and a light of its own by
//     place (z 4.4..-124, below y 17.2; see cel and cellarSun in the shader): tiles with drawn joints and a worn sheen down
//     the lane, travertine a little darker and cooler than the plaster with its courses drawn, vaults floated in strips; and
//     a sun of its own, a painter's liberty: the world's sun reaches only the lane's first metres inside the mouth, so inside
//     the cellar the sun is taken lower and further west (uniforms.uCSun from CSUN: one direction for every look, seed and
//     moment) and comes in under the west arches. It is followed in the lane's own aisle only, as far east as the middle
//     row's west faces (x -6.5); east of them the cellar is held in shade, though the plan would let some of that sun on
//     through the middle arcade (a second liberty), and the east aisle takes sun only through its own south mouth. Its bars lie across the lane three to four times as light as the shade
//     beside them, with the piers' shadows between them; the sunlit tiles lift the vault above them and the piers beside
//     them; the shade deepens toward the vault's crown, and deepens and cools toward the far end, and the end arch stands in
//     shade before the bright court; leaf shade stirs in the bars. The baked sun's map is not read inside the cellar. The
//     astrolabe's paint lies on the cellar's plaster and tiles and on the mouth arch through which it is first seen
//     (with its proud rings and the front piers' bases and imposts: z 4.8..-1.05); north of z -1.1, as far as the end
//     arch's court side (z -127.1), never on travertine.
//   - cordonata court z -124..-230, x -40..50, open to the sky: stair A x -32..-16 rising north y 0 -> 9
//     (z -130..-186); landing y 9 (z -186..-230) with the fountain wall (x -16..16, z -203..-199, top y 24);
//     stair B x 16..32 rising south to y 18; two plain pylons on the landing's south edge (x -8 and x 3.5, z -185).
//   - gallery z -124..0, x -19.5..47, floor y 18, segmental vault with stone ribs (crown y 50); north end wall
//     with the doorway at the head of stair B (x 14.5..33.5) and its pivoting walnut leaf (hung on the room's face, hinge
//     x 34, opens into the room); a cross arcade of two arches at z -31 on a sill; two free-standing proof walls end-on to V2
//     (x 6.25, z -44.5 and x 16.75, z -69.5); a walnut door in the south wall that never opens; five embrasures
//     in the east wall; west arcade at x -22 (arches to y 38).
//   - west bay x -50..-24.5, open to the sky, roof stair x -44..-28 from y 18 (z -24) to y 52 (z -124).
//   - roofs at y 52. North terrace z -230..-310: sunk cistern (x -47..30, z -296..-242, water y 49.5, rim
//     53.5) with the pergola, two stacks and the well-head island standing in it, the window wall (z -300,
//     x -54..-8) with its 16 m arched opening centred (-36, 64), and before it the water porch: a barrel
//     vault of radius 11.5 about the portal's own axis (z -282..-300) on two flank walls, an arched front a
//     little narrower than the barrel and a sill across the mouth; the pivoting leaf sits in its east flank;
//     east of the window wall a screen of five open arches (x -8..52.6, z -302, top y 72) closes the terrace's end.
//
// WHERE THE PICTURES LIE (the reason for the plan). A far wall square to the eye shows a picture whole from
//   anywhere, so none of the three is cast on one. V1 stands half way up stair A and looks north-east and a
//   little up: the sphere lies on the two pylons 15 and 28 m off, on the fountain wall's south face behind and
//   beside them and on the east wall 73 m off; its wide horizon band runs from the fountain wall round onto the east
//   wall. The flight then goes on up the stair and east between the pylons and the fountain wall, 6 m from its
//   painted face. V2 stands at the south end of the gallery and looks north:
//   the flight has by then come the whole length of the room over the loggia's pavement (a wind rose 58 m off,
//   drawn out along the floor), under its sky (on the vault and ribs) and past its piers (on the proof walls'
//   flanks and the west arcade), gone out through the west arcade, round the bay and in again by the south arch, so
//   that it comes to V2 from the west with the cross arch already ahead; nothing nearer than 24.5 m takes paint, so
//   the real cross arcade and its sill frame it (the picture's left, right and bottom limits fall behind them); a
//   fourth arch and the west of the pavement fall through the west arcade onto the bay's wall and the roof stair.
//   Inside the room and the bay everything that faces V2 is painted, seen from V2 or not, so no pier leaves a bare
//   shadow behind it; outside them only the first surface seen takes paint.
//   V3 stands 57 m before the portal on its axis: the wreath lies inside the porch as bands along the barrel,
//   the flanks and the sill, hidden from far off by the porch's narrower mouth.
//
// ANCHORS (hero-local)
//   entry          [-24, 8, 26], heading -Z
//   portalSeat     { position [-36, 64, -300], facing [0, 0, 1] }: a 14 m circle inside the window arch
//   flyThrough     the whole camera line, entry to portal, 5 m clear of everything built here except the
//                  north door it passes through (open at that time)
//   vantage        [V1, V2, V3] = [-23,17,-176], [0,29,-11], [-36,64,-243]: the path MUST pass through them
//   vantageAxis    unit axis of each picture (V1 toward [18.7,22.2,-203.1]; V2 north; V3 north)
//   lockU          [0.24, 0.5754, 0.933]: u of the three points on flyThrough; doorU 0.379: u at the north doorway
//   pictureCenters a point in the middle of each picture (poi targets); the line of flight already points near them
//   closePass      [-10.2, 18, -186.3]: between the west pylon and the fountain wall, both painted, just after V1
//   doorPivot, leafPivot (pivot line and size of the two leaves), basin (water rectangle and level; rings: the middles of
//   the four bays of water between the pergola's posts, where the water's slow rings start), bay and gallery (the boxes of
//   the open west bay and of the gallery: x0, x1, z0, z1, y0, y1),
//   lane (the cellar's clear lane and its piers), westArcadeX, trestleSpots, potSpots, sheetSpots (floor / wall points for the
//   painter's gear, all outside the three cones; the world moves what stands in the lane out beside it), ringSpots, swiftCross (two points in the loggia's depth), parapetWalk (where the doves walk).
//   lightAt(x, y, z) (a named export): the baked shade light at a point, for gear that stands in the rooms.
//   sunDir (unit vector toward the sun), bakeSun(extra) (see HOOKS).
//
// OPTS
//   palette  [plaster, travertine, umber, sienna, chalk, slate blue, terracotta] (default: the brief's seven)
//   look     'umber' | 'verdaccio' | 'sanguine' (default: sanguine when ctx.vary.hour is dawn, golden or night,
//            else umber or verdaccio by seed). hero.look says which was used; verdaccio has cool plaster and
//            wet roof tiles with standing water, sanguine rose plaster a step dimmer.
//   rare     the north door is left standing wide (120 degrees) after the eye has come in: its dark back shows broad beside
//            a hole where the fourth arch should be, the court behind; it swings home over u 0.545..0.571 (default
//            ctx.vary.rare). Whenever the leaf stands open, daylight from the court lies in a bar on the gallery floor
//            from the west jamb as far east as the leaf lets it (uniforms.uGap).
//   bright   overall light scale (default 1)
//   cloud    depth of the drifting cloud bands, 0..0.3 (default 0.08; uniforms.uCloud)
//   Per seed: the look, the sphere's axis tilt, ecliptic and ring squash, the pavement's scale, the number of
//   leaf pairs in the wreath, cloud band, plaster patches, tile tones and the vignettes' layout.
//   deferSun the sun's map is not baked in buildHero; the world calls hero.bakeSun([its casters]) once in its build
//   ctx.quality.detail is not used: nothing here is plentiful (about 43k triangles in all).
// HOOKS
//   setProgress(u)   call every frame with the world's u: the north door stands wide until u 0.404 and is shut
//                    by 0.454 (rare: see above); the porch leaf stands open and swings shut over 0.86..0.925.
//                    Never called = both leaves shut (the piece shown alone). Once it is called, the wreath shows a third
//                    of its leaves from far off and all of them within about 65 m of the porch (uniforms.uLeafNear).
//   update(dt, time, camera)  water, drifting cloud bands, the trembling second wreath, the eye position.
//   materials.wing / uniforms  the shared uniform objects (uBright, uPaintOn, uSky, uWet and the paints). The water holds
//                    the sky: uSkyLo (low down), uSkyHi (overhead), uSkyCl (cloud bars) and uSkyCv (how much cloud, 0..1)
//                    start as the one tone uSky; a world with a sky of its own sets them to that sky's tones.
//   THE BASIN        an opaque sheet of the sky's tones, over it the y-mirrored copies (a step darker and cooler than the
//                    things, swaying with depth under the water, the second wreath pushed about by the ripples' slope),
//                    over them a clear sheet that carries only the ripples' streaks of sky and their glints.
//   THE WEST BAY     inside anchors.bay the same plaster and travertine are worked further (float sweeps, crazing drawn
//                    to fifty metres, coursed joints, voids along the beds) and a cloud's tone drifts over the wall.
//   rebake()         renders the three depth maps again; needed only if the world adds large occluders as
//                    children of hero.object. Small props need nothing: they take no paint and hide none.
//   bakeSun(extra)   async, build time only: draws the sun's depth map (the wing in strips, then each object of
//                    extra a part at a time, a build step each). uniforms uDS, uSunM, uSunPos, uSunDir, uSunCol, uAmb,
//                    uSunFar, uSunRes are shared objects: a world material that declares them reads the same map.
// COST   about 43k triangles, 8 draw calls (wing, terrace, two leaves, two mirrored copies, two water sheets),
//        two programs plus the water's, RGBA8 depth targets of 1024, 2048, 1024 and 2048 square and 2048 for the sun.
// LIGHT  no three.js lights. One low sun (per look: its bearing, height and colour) with shadows from an orthographic
//        depth map baked at build time (five taps, slope-scaled bias), so every block has a lit and a shade side and
//        columns and arches throw long shadows. The shade is baked per vertex: zone brightness (cellar deep grey away from its mouths, court and bay
//        grading from grey at the foot of the walls to full light at the cornice, gallery lit from its west
//        arcade and east windows, dimmer up in the vault), corner darkening that reaches 10 m, contact darkening
//        4 m, a warm cast on whatever is in shade (uShade), a soft hemisphere with a lean to the south
//        and the terracotta lift on the lower walls are baked per vertex; the paint keeps most of its own
//        value, so a picture is one tone across all its receivers (inside the cellar the astrolabe keeps half as much, so
//        that the sun's bars and the vault's shade lie across the painted floor and webs). Use post flat 1, bloom strength 0, no scene fog (fog is honoured if set).
//        Set uniforms.uSky to the sky's pearl tone for the cistern.
// STYLE (for whoever matches it)
//   One ShaderMaterial. Grounds by vertex attribute aDat.x: 0 lime plaster (float marks, day patches, crazing),
//   1 coursed travertine, 2 terracotta tiles 1.2 m laid diagonally, 3 walnut boards with iron studs; aDat.y
//   baked light, aDat.z floor bounce. Paint, for picture i: d = P - V_i, t = dot(d, axis_i),
//   q = (dot(d, right_i), dot(d, up_i)) / max(t, 1e-4); signed distances in q, antialiased with fwidth(q)
//   taken at the top of main; laid where t is within a slope-scaled bias of the depth stored from V_i (four
//   nearest taps) and the surface faces V_i. Flat steps only: umber line with a chalk line beside it, sienna
//   wash, opaque sienna, slate blue, chalk. The loggia is opaque and has no frame: its near pavement is a
//   wind rose laid out in floor metres, so it sits true on the real floor and carries the real tiles on.
//   Vignettes: 3.6 m jittered grid in the surface's own two axes, one of six motifs per cell, each its own
//   size and tilt, darkened toward umber, only on washes, gone by 40 m.
//   The leaves keep their paint because P is always the rest pose (the vertex shader turns them by uPiv).
//   The second wreath: the terrace geometry drawn again mirrored in y = 49.5 (BackSide, clipped to what is
//   seen through the water rectangle), painted so that it locks from V3 as well: V mirrored, q.y shifted by
//   2 (64 - 49.5) / 57, a small moving offset on q for the tremble.

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const V1 = [-23, 17, -176], AIM1 = [18.7, 22.2, -203.1], V2 = [0, 29, -11], V3 = [-36, 64, -243], SEAT = [-36, 64, -300];
// picture 2's rectangle in its own tangent coordinates (left, right, bottom, top) and the arcade's pitch
const LOG = { x0: 0.4234 - 4 * 0.3246, x1: 0.4234, y0: -0.5, y1: 0.47, W: 0.3246 };   // V2 looks north: +x of the picture is east
const WATER_Y = 49.5, BAS = { x0: -47, x1: 30, z0: -296, z1: -242 };
const DOOR = { x: 34, z: -121.3, x0: 14, x1: 34, y0: 18, y1: 41 }, SDOOR = { x: 4, hw: 6.5, y0: 18, y1: 46 }, LEAF = { x: -24.2, z: -291, hw: 6, y0: 53.6, y1: 63.9 };
const LOCK_U = [0.24, 0.5754, 0.933], DOOR_U = 0.379;
// the west bay (wall to arcade face, floor to parapet) and the gallery, as boxes; the pergola's post lines in the cistern
const BAY = { x0: -50, x1: -24.5, z0: -124, z1: 0, y0: 18, y1: 53.5 }, GAL = { x0: -19.5, x1: 47, z0: -124, z1: 0, y0: 18, y1: 50 }, ARC = { xa: -24.5, xb: -19.5 };
// the roof stair with its two parapets, which stands in the bay and is none of the bay's wall (steps and parapet in buildGallery)
const RSTAIR = { x0: -45.5, x1: -26.5, z0: -124, z1: -24 };
const POSTX = [-44.2, -26.1, -8], POSTZ = [-260, -266, -272];
// the four bays of open water between the pergola's posts: where fig leaves turn and the rings on the water start
const RINGS = [0, 1, 2, 3].map((i) => [(POSTX[i >> 1] + POSTX[(i >> 1) + 1]) / 2, (POSTZ[i & 1] + POSTZ[(i & 1) + 1]) / 2]);
const V6 = [-16.6, 60.3, -142.8];                          // where the flight comes out over the court (u 0.77): the fan of rays on the court walls is cast from here   // u of the three points and of the north doorway on the fly-through line
let CELLAR = 0.8;                                           // the cellar's light level (set per look in buildHero)
const ZC = 0, ZK = 1, ZG = 2, ZW = 3, ZT = 4, ZP = 5;          // light zones: cellar, court, gallery, west bay, terrace
const PL = 0, TR = 1, TC = 2, WN = 3;                  // materials: plaster, travertine, terracotta tiles, walnut

// ---------------------------------------------------------------- geometry accumulator
// for a wall: the distance along it to the next wall of its room; for a floor or soffit: the distance to the nearest wall
function nook(x, z, x0, x1, z0, z1, ny, k = 0.3, r = 6) {
  const dx = Math.min(x - x0, x1 - x), dz = Math.min(z - z0, z1 - z), d = Math.abs(ny) > 0.5 ? Math.min(dx, dz) : Math.max(dx, dz);
  const e = 1 - k * Math.exp(-Math.max(d, 0) / r);
  return e * e;
}
// light by place (linear): the cellar falls to a deep grey away from its mouths, the court and the bay grade from grey at the
// foot of their walls to full light at the cornice, the gallery is lit from its west arcade and east windows
function zoneE(zone, x, y, z, ny) {
  if (zone === ZC) { const d = Math.min(4.5 - z, z + 124, 56 - Math.abs(x)); return CELLAR * (0.36 + 0.5 * Math.max(Math.exp(-Math.max(d, 0) / 13), 0.9 * Math.exp(-Math.max(4.5 - z, 0) / 30))); }
  if (zone === ZK) return (ny > 0.5 ? 0.96 : 0.45 + 0.61 * smoothstep(-6, 40, y)) * nook(x, z, -40, 50, -230, -124, ny, 0.5, 11);
  if (zone === ZG) { const d = Math.min(x + 19.5, (47 - x) * 0.9); return (0.34 + 0.6 * Math.exp(-Math.max(d, 0) / 16) - 0.2 * smoothstep(32, 50, y)) * nook(x, z, -19.5, 47, -124, 0, ny, 0.42, 10); }
  if (zone === ZW) return (ny > 0.5 ? 0.94 : 0.4 + 0.66 * smoothstep(12, 48, y)) * nook(x, z, -50, -24.5, -124, 0, ny, 0.5, 10);
  if (zone === ZP) return 0.5 + 0.48 * Math.exp(-Math.max(-280 - z, 0) / 9);
  return y < 51 && ny < 0.5 ? 0.55 + 0.5 * smoothstep(-4, 40, y) : 1.04;
}
// the same light for things standing in the rooms (the world's gear): no corner term
export function lightAt(x, y, z) {
  if (z < 4.5 && z > -124 && y < 17 && Math.abs(x) < 54) return zoneE(ZC, x, y, z, 1);
  if (z <= -124 && z > -230 && y < 51) return 0.9;
  if (z < 0 && z > -124 && y >= 17 && y < 51 && x > -22) return zoneE(ZG, x, y, z, 0) / nook(x, z, -19.5, 47, -124, 0, 0, 0.3, 7) + 0.06;
  return y >= 51 ? 1.02 : 0.92;
}
const AOL = 4.2;   // reach of contact darkening along a face, metres
function makeAcc() {
  const A = { pos: [], nor: [], dat: [], idx: [], n: 0, mat: PL, zone: ZK, floorY: 0, cell: 7 };
  // baked light: sky exposure by zone, corner and contact darkening, a soft hemisphere and a lean toward the south
  A.light = (x, y, z, nx, ny, nz) => zoneE(A.zone, x, y, z, ny) * (ny > 0.5 ? 1 : ny < -0.5 ? 0.76 : 0.89 + 0.06 * ny + 0.1 * nz - 0.04 * nx);
  A.v = (x, y, z, nx, ny, nz, ao = 1) => {
    A.pos.push(x, y, z); A.nor.push(nx, ny, nz);
    const h = y - A.floorY, b = ny > 0.5 ? 0 : Math.exp(-Math.max(h, 0) / 9);
    A.dat.push(A.mat, A.light(x, y, z, nx, ny, nz) * Math.pow(ao, 2.6), b);
    return A.n++;
  };
  // bilinear quad a,b,c,d (a->b = u, a->d = v), oriented so its normal agrees with want; o.ao = [bottom, top, left, right] edge darkening 0..1
  A.quad = (a, b, c, d, want, o = {}) => {
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let flip = false;
    if (want && nx * want[0] + ny * want[1] + nz * want[2] < 0) { flip = true; nx = -nx; ny = -ny; nz = -nz; }
    const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz);
    const nu = o.nu || clamp(Math.round(lu / A.cell), 1, 24), nv = o.nv || clamp(Math.round(lv / A.cell), 1, 24);
    const ao = o.ao || null, base = A.n;
    for (let j = 0; j <= nv; j++) {
      const tv = j / nv;
      for (let i = 0; i <= nu; i++) {
        const tu = i / nu, w0 = (1 - tu) * (1 - tv), w1 = tu * (1 - tv), w2 = tu * tv, w3 = (1 - tu) * tv;
        let k = 1;
        if (ao) k = (1 - ao[0] * Math.exp(-tv * lv / AOL)) * (1 - ao[1] * Math.exp(-(1 - tv) * lv / AOL)) * (1 - ao[2] * Math.exp(-tu * lu / AOL)) * (1 - ao[3] * Math.exp(-(1 - tu) * lu / AOL));
        A.v(a[0] * w0 + b[0] * w1 + c[0] * w2 + d[0] * w3, a[1] * w0 + b[1] * w1 + c[1] * w2 + d[1] * w3, a[2] * w0 + b[2] * w1 + c[2] * w2 + d[2] * w3, nx, ny, nz, k);
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const p = base + j * (nu + 1) + i, q = p + 1, r = p + nu + 2, s = p + nu + 1;
      if (flip) A.idx.push(p, r, q, p, s, r); else A.idx.push(p, q, r, p, r, s);
    }
  };
  A.tri = (a, b, c, want) => {
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let fl = false;
    if (want && nx * want[0] + ny * want[1] + nz * want[2] < 0) { fl = true; nx = -nx; ny = -ny; nz = -nz; }
    const i0 = A.v(a[0], a[1], a[2], nx, ny, nz), i1 = A.v(b[0], b[1], b[2], nx, ny, nz), i2 = A.v(c[0], c[1], c[2], nx, ny, nz);
    if (fl) A.idx.push(i0, i2, i1); else A.idx.push(i0, i1, i2);
  };
  // axis-aligned box; faces: string of x X y Y z Z (min / max side of each axis) to build; side faces darken toward the floor
  A.box = (x0, x1, y0, y1, z0, z1, faces = 'xXyYzZ', o = {}) => {
    const ao = o.ao || [0.22, 0, 0, 0], f = (c) => faces.indexOf(c) >= 0;
    if (f('x')) A.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], { ao });
    if (f('X')) A.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], { ao });
    if (f('z')) A.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], { ao });
    if (f('Z')) A.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], { ao });
    if (f('y')) A.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    if (f('Y')) A.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], o.top || {});
  };
  // vertical prism over a convex plan polygon [[x,z],...] with optional top cap
  A.prism = (pl, y0, y1, cap = true, ao = [0.22, 0, 0, 0]) => {
    let cx = 0, cz = 0; for (const p of pl) { cx += p[0] / pl.length; cz += p[1] / pl.length; }
    for (let i = 0; i < pl.length; i++) {
      const p = pl[i], q = pl[(i + 1) % pl.length], mx = (p[0] + q[0]) / 2 - cx, mz = (p[1] + q[1]) / 2 - cz;
      A.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], [mx, 0, mz], { ao });
    }
    if (cap) for (let i = 1; i < pl.length - 1; i++) A.tri([pl[0][0], y1, pl[0][1]], [pl[i][0], y1, pl[i][1]], [pl[i + 1][0], y1, pl[i + 1][1]], [0, 1, 0]);
  };
  // chamfered rectangular plan
  A.cham = (x0, x1, z0, z1, c) => [[x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c], [x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c]];
  return A;
}

// ---------------------------------------------------------------- architectural helpers
// frame for walls: ax 'z' = wall across z (u is x, c is z); ax 'x' = wall across x (u is z, c is x)
const FR = (ax) => (ax === 'z' ? (u, y, c) => [u, y, c] : (u, y, c) => [c, y, u]);
const NRM = (ax, s) => (ax === 'z' ? [0, 0, s] : [s, 0, 0]);

// wall slab c0..c1 from uL..uR, yBase..yTop, pierced by an arch u0..u1 (springing ySpring, elliptical rise)
function archWall(A, ax, c0, c1, uL, uR, yBase, yTop, u0, u1, ySpring, rise, o = {}) {
  const P = FR(ax), RD = (du, dy) => (ax === 'z' ? [du, dy, 0] : [0, dy, du]), n = o.n || 14, uc = (u0 + u1) / 2, a = (u1 - u0) / 2, mf = o.mat ?? PL, ms = o.soffit ?? TR, rw = o.ring ?? 1.6;
  const arc = []; for (let i = 0; i <= n; i++) { const th = Math.PI * (1 - i / n); arc.push([uc + a * Math.cos(th), ySpring + rise * Math.sin(th)]); }
  const faces = o.faces || 'cC';
  for (const side of [0, 1]) {
    if (faces.indexOf(side ? 'C' : 'c') < 0) continue;
    const c = side ? c1 : c0, w = NRM(ax, side ? 1 : -1);
    A.mat = mf;
    if (u0 - uL > 0.01) A.quad(P(uL, yBase, c), P(u0, yBase, c), P(u0, yTop, c), P(uL, yTop, c), w, { ao: [0.22, 0, 0, 0] });
    if (uR - u1 > 0.01) A.quad(P(u1, yBase, c), P(uR, yBase, c), P(uR, yTop, c), P(u1, yTop, c), w, { ao: [0.22, 0, 0, 0] });
    for (let i = 0; i < n; i++) A.quad(P(arc[i][0], arc[i][1], c), P(arc[i + 1][0], arc[i + 1][1], c), P(arc[i + 1][0], yTop, c), P(arc[i][0], yTop, c), w, { nu: 1 });
    if (rw > 0) {   // proud archivolt ring and jamb strips in travertine
      A.mat = TR; const cp = c + (side ? 0.3 : -0.3), k = (p, s) => [uc + (p[0] - uc) * s, ySpring + (p[1] - ySpring) * (1 + (s - 1) * a / Math.max(rise, 0.1))];
      const s1 = 1 + rw / a;
      for (let i = 0; i < n; i++) {
        const p = arc[i], q = arc[i + 1], pp = k(p, s1), qq = k(q, s1);
        A.quad(P(p[0], p[1], cp), P(q[0], q[1], cp), P(qq[0], qq[1], cp), P(pp[0], pp[1], cp), w, { nu: 1, nv: 1 });
        A.quad(P(pp[0], pp[1], cp), P(qq[0], qq[1], cp), P(qq[0], qq[1], c), P(pp[0], pp[1], c), RD(pp[0] - uc, pp[1] - ySpring), { nu: 1, nv: 1 });
      }
      A.quad(P(u0 - rw, yBase, cp), P(u0, yBase, cp), P(u0, ySpring, cp), P(u0 - rw, ySpring, cp), w, { nu: 1, ao: [0.22, 0, 0, 0] });
      A.quad(P(u1, yBase, cp), P(u1 + rw, yBase, cp), P(u1 + rw, ySpring, cp), P(u1, ySpring, cp), w, { nu: 1, ao: [0.22, 0, 0, 0] });
    }
  }
  A.mat = ms;   // intrados and jambs
  const e0 = c0 - (rw > 0 && faces.indexOf('c') >= 0 ? 0.3 : 0), e1 = c1 + (rw > 0 && faces.indexOf('C') >= 0 ? 0.3 : 0);
  for (let i = 0; i < n; i++) {
    const p = arc[i], q = arc[i + 1], want = RD(uc - (p[0] + q[0]) / 2, ySpring - (p[1] + q[1]) / 2 - 0.01);
    A.quad(P(p[0], p[1], e0), P(q[0], q[1], e0), P(q[0], q[1], e1), P(p[0], p[1], e1), want, { nu: 1, ao: [0, 0, 0.12, 0.12] });
  }
  if (ySpring - yBase > 0.01) {
    A.quad(P(u0, yBase, e0), P(u0, yBase, e1), P(u0, ySpring, e1), P(u0, ySpring, e0), ax === 'z' ? [1, 0, 0] : [0, 0, 1], { ao: [0.22, 0, 0, 0] });
    A.quad(P(u1, yBase, e0), P(u1, yBase, e1), P(u1, ySpring, e1), P(u1, ySpring, e0), ax === 'z' ? [-1, 0, 0] : [0, 0, -1], { ao: [0.22, 0, 0, 0] });
  }
  A.mat = PL;
}

// barrel vault running along z: inner surface over xc-a..xc+a, springing ySpring, rise b
function barrel(A, xc, a, ySpring, b, z0, z1, n = 18) {
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI * (1 - i / n), t1 = Math.PI * (1 - (i + 1) / n);
    const p = [xc + a * Math.cos(t0), ySpring + b * Math.sin(t0)], q = [xc + a * Math.cos(t1), ySpring + b * Math.sin(t1)];
    A.quad([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], [xc - (p[0] + q[0]) / 2, ySpring - (p[1] + q[1]) / 2 - 0.01, 0], { nu: 1, ao: [0.1, 0.1, 0, 0] });
  }
}

// travertine pier: plinth, chamfered shaft, necking and impost block
function pier(A, x, z, w, y0, y1, d = w) {
  const hw = w / 2, hd = d / 2, m = A.mat; A.mat = TR;
  A.prism(A.cham(x - hw - 0.45, x + hw + 0.45, z - hd - 0.45, z + hd + 0.45, 0.3), y0, y0 + 1.5);
  A.prism(A.cham(x - hw - 0.2, x + hw + 0.2, z - hd - 0.2, z + hd + 0.2, 0.3), y0 + 1.5, y0 + 2.0, true, [0, 0, 0, 0]);
  A.prism(A.cham(x - hw, x + hw, z - hd, z + hd, 0.4), y0 + 2.0, y1 - 1.6, false, [0.18, 0.2, 0, 0]);
  A.prism(A.cham(x - hw - 0.25, x + hw + 0.25, z - hd - 0.25, z + hd + 0.25, 0.25), y1 - 1.6, y1 - 1.2, true, [0, 0, 0, 0]);
  A.box(x - hw - 0.25, x + hw + 0.25, y1 - 1.6, y1 - 1.6, z - hd - 0.25, z + hd + 0.25, 'y');
  A.prism(A.cham(x - hw - 0.55, x + hw + 0.55, z - hd - 0.55, z + hd + 0.55, 0.2), y1 - 1.2, y1, true, [0, 0, 0, 0]);
  A.box(x - hw - 0.55, x + hw + 0.55, y1 - 1.2, y1 - 1.2, z - hd - 0.55, z + hd + 0.55, 'y');
  A.mat = m;
}

// flight of steps x0..x1 running along z from (zA, yA) up to (zB, yB): terracotta treads, travertine risers
function steps(A, x0, x1, zA, yA, zB, yB, n) {
  const dz = (zB - zA) / n, dy = (yB - yA) / n, s = Math.sign(dz), m = A.mat;
  for (let i = 0; i < n; i++) {
    const z = zA + dz * i, y = yA + dy * (i + 1);
    A.mat = TR; A.quad([x0, y - dy, z], [x1, y - dy, z], [x1, y, z], [x0, y, z], [0, 0, -s], { nv: 1, ao: [0.3, 0, 0, 0] });
    A.quad([x0, y, z], [x1, y, z], [x1, y, z + s * 0.5], [x0, y, z + s * 0.5], [0, 1, 0], { nv: 1 });
    A.mat = TC; A.quad([x0, y, z + s * 0.5], [x1, y, z + s * 0.5], [x1, y, z + dz], [x0, y, z + dz], [0, 1, 0], { nv: 1, ao: [0, 0.25, 0, 0] });
  }
  A.mat = m;
}

// solid parapet following a slope: x0..x1 thick, from (zA, yA) to (zB, yB) base line, hgt high, travertine with a coping
function parapet(A, x0, x1, zA, yA, zB, yB, hgt, yFoot = null) {
  const m = A.mat; A.mat = TR;
  const fA = yFoot ?? yA, fB = yFoot ?? yB, n = Math.max(1, Math.round(Math.abs(zB - zA) / 9));
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, z0 = lerp(zA, zB, t0), z1 = lerp(zA, zB, t1), a0 = lerp(yA, yB, t0) + hgt, a1 = lerp(yA, yB, t1) + hgt, b0 = lerp(fA, fB, t0), b1 = lerp(fA, fB, t1);
    A.quad([x0, b0, z0], [x0, b1, z1], [x0, a1, z1], [x0, a0, z0], [-1, 0, 0], { nu: 1, ao: [0.2, 0, 0, 0] });
    A.quad([x1, b0, z0], [x1, b1, z1], [x1, a1, z1], [x1, a0, z0], [1, 0, 0], { nu: 1, ao: [0.2, 0, 0, 0] });
    // coping: a wider cap
    const c0 = x0 - 0.3, c1 = x1 + 0.3;
    A.quad([c0, a0 + 0.6, z0], [c1, a0 + 0.6, z0], [c1, a1 + 0.6, z1], [c0, a1 + 0.6, z1], [0, 1, 0], { nu: 1, nv: 1 });
    A.quad([c0, a0, z0], [c0, a1, z1], [c0, a1 + 0.6, z1], [c0, a0 + 0.6, z0], [-1, 0, 0], { nu: 1, nv: 1 });
    A.quad([c1, a0, z0], [c1, a1, z1], [c1, a1 + 0.6, z1], [c1, a0 + 0.6, z0], [1, 0, 0], { nu: 1, nv: 1 });
    A.quad([c0, a0, z0], [c1, a0, z0], [c1, a1, z1], [c0, a1, z1], [0, -1, 0], { nu: 1, nv: 1 });
  }
  for (const [z, y, s] of [[zA, yA, Math.sign(zA - zB)], [zB, yB, Math.sign(zB - zA)]]) {
    const f = yFoot ?? y;
    A.quad([x0, f, z], [x1, f, z], [x1, y + hgt, z], [x0, y + hgt, z], [0, 0, s], { nu: 1, ao: [0.2, 0, 0, 0] });
    A.quad([x0 - 0.3, y + hgt, z], [x1 + 0.3, y + hgt, z], [x1 + 0.3, y + hgt + 0.6, z], [x0 - 0.3, y + hgt + 0.6, z], [0, 0, s], { nu: 1, nv: 1 });
  }
  A.mat = m;
}

// cornice band along a wall face: ax, face coordinate c, outward sign s, u0..u1, at height y (three stepped fasciae)
function cornice(A, ax, c, s, u0, u1, y, proj = 1.4, hgt = 2.2) {
  const P = FR(ax), m = A.mat; A.mat = TR;
  const st = [[0.35, 0], [0.7, 0.35], [1, 0.7]];
  for (const [pf, hf] of st) {
    const cc = c + s * proj * pf, ya = y + hgt * hf, yb = y + hgt * (hf + (pf === 1 ? 0.3 : 0.35));
    A.quad(P(u0, ya, cc), P(u1, ya, cc), P(u1, yb, cc), P(u0, yb, cc), NRM(ax, s), { nv: 1 });
    A.quad(P(u0, ya, c), P(u1, ya, c), P(u1, ya, cc), P(u0, ya, cc), [0, -1, 0], { nv: 1, ao: [0.35, 0, 0, 0] });
  }
  const ct = c + s * proj;
  A.quad(P(u0, y + hgt, c), P(u1, y + hgt, c), P(u1, y + hgt, ct), P(u0, y + hgt, ct), [0, 1, 0], { nv: 1 });
  A.mat = m;
}

// box with a wider coping on top (parapets, stacks, rims)
function capped(A, x0, x1, y0, y1, z0, z1, faces = 'xXzZ', lip = 0.3) {
  A.box(x0, x1, y0, y1, z0, z1, faces);
  A.box(x0 - lip, x1 + lip, y1, y1 + 0.6, z0 - lip, z1 + lip, 'xXzZyY', { ao: [0, 0, 0, 0] });
}

// blind window: recessed plaster panel in a travertine surround with a sill, on a wall face (ax, c, outward sign s)
function blindWin(A, ax, c, s, u, y0, w, h) {
  const P = FR(ax), m = A.mat, n = NRM(ax, s), c1 = c + s * 0.06, cp = c + s * 0.45, lo = Math.min(c, cp), hi = Math.max(c, cp);
  A.mat = PL; A.quad(P(u - w / 2, y0, c1), P(u + w / 2, y0, c1), P(u + w / 2, y0 + h, c1), P(u - w / 2, y0 + h, c1), n, { ao: [0.3, 0.5, 0.38, 0.38], nu: 3, nv: 4 });
  A.mat = TR;
  const bars = [[u - w / 2 - 0.9, u - w / 2, y0 - 0.9, y0 + h + 0.9], [u + w / 2, u + w / 2 + 0.9, y0 - 0.9, y0 + h + 0.9], [u - w / 2, u + w / 2, y0 - 0.9, y0], [u - w / 2, u + w / 2, y0 + h, y0 + h + 0.9], [u - w / 2 - 1.3, u + w / 2 + 1.3, y0 - 1.5, y0 - 0.9], [u - w / 2 - 1.2, u + w / 2 + 1.2, y0 + h + 0.9, y0 + h + 1.5]];
  for (let i = 0; i < bars.length; i++) {
    const [a, b, ya, yb] = bars[i], e = i > 3 ? 0.35 : 0, l2 = Math.min(lo, c + s * (0.45 + e)), h2 = Math.max(hi, c + s * (0.45 + e));
    if (ax === 'z') A.box(a, b, ya, yb, l2, h2, 'xXyYzZ', { ao: [0, 0, 0, 0] }); else A.box(l2, h2, ya, yb, a, b, 'xXyYzZ', { ao: [0, 0, 0, 0] });
  }
  A.mat = m;
}

// free-standing plastered pylon with travertine quoins, a stepped cap and an obelisk point: centre (cx, cz), half sizes hx, hz
function pylon(A, cx, cz, hx, hz, y0, y1, plain = false, body = PL) {
  const x0 = cx - hx, x1 = cx + hx, z0 = cz - hz, z1 = cz + hz, m = A.mat, f = A.floorY; A.floorY = y0;
  A.mat = TR; A.prism(A.cham(x0 - 0.6, x1 + 0.6, z0 - 0.6, z1 + 0.6, 0.5), y0, y0 + 1.8);
  A.mat = body; A.prism(A.cham(x0, x1, z0, z1, 0.3), y0 + 1.8, y1, false, [0.15, 0.15, 0, 0]);
  A.mat = TR;
  for (const [qx, qz] of [[x0, z0], [x1 - 0.9, z0], [x0, z1 - 0.9], [x1 - 0.9, z1 - 0.9]]) A.prism(A.cham(qx - 0.12, qx + 1.02, qz - 0.12, qz + 1.02, 0.12), y0 + 1.8, y1, false, [0, 0, 0, 0]);
  A.prism(A.cham(x0 - 0.5, x1 + 0.5, z0 - 0.5, z1 + 0.5, 0.25), y1, y1 + 0.7); A.box(x0 - 0.5, x1 + 0.5, y1, y1, z0 - 0.5, z1 + 0.5, 'y');
  A.prism(A.cham(x0 - 1, x1 + 1, z0 - 1, z1 + 1, 0.25), y1 + 0.7, y1 + 1.6); A.box(x0 - 1, x1 + 1, y1 + 0.7, y1 + 0.7, z0 - 1, z1 + 1, 'y');
  if (plain) { A.mat = m; A.floorY = f; return; }
  // two stepped blocks and an obelisk point (its shadow on the wall behind is a spike, never a head on shoulders)
  for (const [k, yy, hh] of [[0.25, 1.6, 0.8], [0.8, 2.4, 0.7]]) A.prism(A.cham(x0 + k, x1 - k, z0 + k * hz / hx, z1 - k * hz / hx, 0.2), y1 + yy, y1 + yy + hh);
  const kz = hz / hx, ob = [[1.05, y1 + 3.1], [0.52, y1 + 8.4]], tip = [cx, y1 + 9.6, cz];
  const cr = (r, y) => [[cx - r, y, cz - r * kz], [cx + r, y, cz - r * kz], [cx + r, y, cz + r * kz], [cx - r, y, cz + r * kz]];
  const lo = cr(ob[0][0], ob[0][1]), hi = cr(ob[1][0], ob[1][1]);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4, want = [(lo[i][0] + lo[j][0]) / 2 - cx, 0.12, (lo[i][2] + lo[j][2]) / 2 - cz];
    A.quad(lo[i], lo[j], hi[j], hi[i], want, { nu: 1, nv: 2, ao: [0.2, 0, 0, 0] });
    A.tri(hi[i], hi[j], tip, [want[0], 0.5, want[2]]);
  }
  A.mat = m; A.floorY = f;
}

// a wall face in horizontal bands: f(u, y) gives the point, bands = [[y0, y1, foot, head], ...] (darkening at the band's
// lower and upper edge), ends = darkening toward the wall's two ends (inside corners)
function bandWall(A, f, u0, u1, bands, want, ends = [0.3, 0.3]) {
  for (const [y0, y1, a0, a1] of bands) A.quad(f(u0, y0), f(u1, y0), f(u1, y1), f(u0, y1), want, { ao: [a0, a1, ends[0], ends[1]], nv: Math.max(2, Math.round((y1 - y0) / 2.6)) });
}

// ---------------------------------------------------------------- cellar arcade (z 4..-124, floor y 0)
function* buildCellar(A) {
  A.zone = ZC; A.floorY = 0; A.mat = TC;
  A.quad([-47, 0, 4.5], [47, 0, 4.5], [47, 0, -124], [-47, 0, -124], [0, 1, 0]);
  const rows = [-44, -4, 4, 44], zs = [2, -31, -62, -93, -124];
  for (const x of rows) for (const z of zs) pier(A, x, z, 5, 0, 6.5);
  // longitudinal arcades over the pier rows
  for (const x of rows) for (let j = 0; j < 4; j++) {
    const zS = zs[j], zN = zs[j + 1];
    archWall(A, 'x', x - 2.5, x + 2.5, zN, zS, 6.5, 16.6, zN + 2.5, zS - 2.5, 6.5, 4.5, { ring: 1.4, n: 12 });
  }
  yield;
  // transverse arches at every pier line (the front one is the south facade, the last opens on the court)
  for (let k = 0; k < zs.length; k++) {
    const z = zs[k], th = k === 0 ? [-0.5, 4.5] : k === 4 ? [-126.5, -121.5] : [z - 1.5, z + 1.5];
    for (const xc of [-24, 24]) archWall(A, 'z', th[0], th[1], xc - 17.5, xc + 17.5, 6.5, 18, xc - 17.5, xc + 17.5, 6.5, 8, { ring: 1.4, n: 16 });
    archWall(A, 'z', th[0], th[1], -1.5, 1.5, 6.5, 18, -1.5, 1.5, 6.5, 1.5, { ring: 0, n: 6 });
  }
  yield;
  // aisle vaults and the slot between the middle rows
  A.mat = PL;
  for (const xc of [-24, 24]) barrel(A, xc, 17.5, 12.5, 4, 4.5, -124, 14);
  A.quad([-1.5, 14, 4.5], [1.5, 14, 4.5], [1.5, 14, -124], [-1.5, 14, -124], [0, -1, 0]);
  // travertine apron step in front
  A.mat = TR; A.box(-47, 47, -0.6, 0, 4.5, 8, 'YZ');
}

// ---------------------------------------------------------------- cordonata court (z -124..-230, x -40..50)
function* buildCourt(A) {
  A.zone = ZK; A.floorY = 0; A.mat = TC;
  A.quad([-40, 0, -124], [50, 0, -124], [50, 0, -186], [-40, 0, -186], [0, 1, 0]);
  // stair A (rises north) and stair B (rises south) with their solid parapets
  steps(A, -32, -16, -130, 0, -186, 9, 18);
  parapet(A, -33.5, -32, -130, 0, -186, 9, 4, 0); parapet(A, -16, -14.5, -130, 0, -186, 9, 4, 0);
  steps(A, 16, 32, -186, 9, -130, 18, 18);
  parapet(A, 14.5, 16, -186, 9, -130, 18, 4, 0); parapet(A, 32, 33.5, -186, 9, -130, 18, 4, 0);
  A.mat = TR; A.box(14.5, 33.5, 16.4, 18, -130, -124, 'zy'); A.mat = TC; A.box(16, 32, 18, 18, -130, -124, 'Y');
  A.mat = TR; capped(A, 14.5, 16, 18, 22, -130, -124, 'xXz'); capped(A, 32, 33.5, 18, 22, -130, -124, 'xXz');
  // landing platform y 9
  A.floorY = 0; A.mat = PL;
  for (const [a, b] of [[-40, -33.5], [-14.5, 14.5], [33.5, 50]]) {
    A.quad([a, 0, -186], [b, 0, -186], [b, 9, -186], [a, 9, -186], [0, 0, 1], { ao: [0.25, 0.1, 0, 0] });
    A.mat = TR; capped(A, a, b, 9, 13, -186, -184.5, 'xXzZ'); A.mat = PL;
  }
  A.mat = TR; A.quad([-14.5, 8.2, -185.6], [14.5, 8.2, -185.6], [14.5, 9, -185.6], [-14.5, 9, -185.6], [0, 0, 1], { nv: 1 });
  A.floorY = 9; A.mat = TC;
  A.quad([-40, 9, -186], [50, 9, -186], [50, 9, -230], [-40, 9, -230], [0, 1, 0]);
  yield;
  // free-standing fountain wall on the landing (x -16..16, z -203..-199)
  A.mat = PL; A.box(-16, 16, 9, 23, -203, -200.2, 'xXz');
  archWall(A, 'z', -200.2, -199, -16, 16, 10.5, 23, -3, 3, 16, 3, { faces: 'C', ring: 0.9, n: 12 });
  A.mat = PL; A.quad([-3, 10.5, -200.2], [3, 10.5, -200.2], [3, 19.2, -200.2], [-3, 19.2, -200.2], [0, 0, 1], { ao: [0.35, 0.35, 0.3, 0.3] });
  A.quad([-16, 9, -200.2], [-16, 9, -199], [-16, 23, -199], [-16, 23, -200.2], [-1, 0, 0], { nu: 1 });
  A.quad([16, 9, -200.2], [16, 9, -199], [16, 23, -199], [16, 23, -200.2], [1, 0, 0], { nu: 1 });
  A.mat = TR; A.box(-16.4, 16.4, 9, 10.5, -203.4, -198.6, 'xXzZY', { ao: [0.25, 0, 0, 0] });
  A.box(-16.6, 16.6, 23, 24.2, -203.6, -198.6, 'xXzZyY', { ao: [0, 0, 0, 0] });
  A.box(-16.2, 16.2, 21.6, 23, -199, -198.6, 'Zy');   // frieze strip under the coping
  A.prism(A.cham(-4.2, 4.2, -199, -196.2, 0.7), 9, 11.6);                 // fountain basin
  A.prism(A.cham(-3.5, 3.5, -198.9, -196.8, 0.5), 11.6, 11.9);            // its dry lip
  A.prism(A.cham(-0.9, 0.9, -200.2, -198.9, 0.3), 12.4, 15.2);            // spout block
  yield;
  // north wall of the court: plinth, pilasters, two cornices
  A.mat = PL; bandWall(A, (u, y) => [u, y, -230], -40, 50, [[9, 22, 0.34, 0], [22, 30, 0, 0.3], [30, 42, 0, 0], [42, 50, 0, 0.3], [50, 52, 0, 0]], [0, 0, 1]);
  A.mat = TR; A.box(-40, 50, 9, 11, -230, -229.5, 'ZY');
  for (const x of [-10, 20, 46]) { A.box(x - 1.6, x + 1.6, 11, 30, -230, -229.3, 'xXZ'); A.box(x - 1.6, x + 1.6, 32.2, 50, -230, -229.3, 'xXZ'); }
  cornice(A, 'z', -230, 1, -40, 50, 30); cornice(A, 'z', -230, 1, -40, 50, 50, 1.2, 2);
  for (const x of [-25, 5, 33]) blindWin(A, 'z', -230, 1, x, 36.5, 6, 9);
  // west wall (x -40) and east wall (x 50)
  for (const [x, s] of [[-40, 1], [50, -1]]) {
    A.floorY = 0; A.mat = PL;
    bandWall(A, (u, y) => [x, y, u], -124, -186, [[0, 12, 0.34, 0], [12, 22, 0, 0], [22, 30, 0, 0.3], [30, 42, 0, 0], [42, 50, 0, 0.3], [50, 52, 0, 0]], [s, 0, 0], [0.3, 0]);
    A.floorY = 9;
    bandWall(A, (u, y) => [x, y, u], -186, -230, [[9, 22, 0.34, 0], [22, 30, 0, 0.3], [30, 42, 0, 0], [42, 50, 0, 0.3], [50, 52, 0, 0]], [s, 0, 0], [0, 0.3]);
    A.mat = TR; A.box(x - (s > 0 ? 0 : 0.5), x + (s > 0 ? 0.5 : 0), 9, 11, -230, -186, s > 0 ? 'XY' : 'xY');
    cornice(A, 'x', x, s, -230, -124, 30); cornice(A, 'x', x, s, -230, -124, 50, 1.2, 2);
    for (const z of [-139, -172, -192, -221]) { blindWin(A, 'x', x, s, z, 36.5, 6, 9); blindWin(A, 'x', x, s, z, 15.5, 6, 9); }
    for (const z of [-155, -208]) { A.box(x - (s > 0 ? 0 : 0.7), x + (s > 0 ? 0.7 : 0), z < -186 ? 11 : 0, 30, z - 1.6, z + 1.6, s > 0 ? 'XzZ' : 'xzZ'); }
  }
  A.mat = PL;
}

// ---------------------------------------------------------------- gallery (floor y 18), west bay with the roof stair
function* buildGallery(A) {
  A.zone = ZG; A.floorY = 18; A.mat = TC;
  A.quad([-19.5, 18, 0], [47, 18, 0], [47, 18, -124], [-19.5, 18, -124], [0, 1, 0]);
  // south wall with a walnut door that stays shut (x -2.5..10.5, y 18..46), inside and outside faces, reveals
  const dx0 = SDOOR.x - SDOOR.hw, dx1 = SDOOR.x + SDOOR.hw;
  for (const [z, s, x0, x1] of [[0, -1, -19.5, 47], [4.5, 1, -54, 54]]) {
    if (s > 0) { A.zone = ZT; A.floorY = 0; }
    A.mat = PL;
    A.quad([x0, 18, z], [dx0, 18, z], [dx0, 53.5, z], [x0, 53.5, z], [0, 0, s], { ao: [s < 0 ? 0.25 : 0, 0, 0, 0] });
    A.quad([dx1, 18, z], [x1, 18, z], [x1, 53.5, z], [dx1, 53.5, z], [0, 0, s], { ao: [s < 0 ? 0.25 : 0, 0, 0, 0] });
    A.quad([dx0, SDOOR.y1, z], [dx1, SDOOR.y1, z], [dx1, 53.5, z], [dx0, 53.5, z], [0, 0, s]);
  }
  A.zone = ZG; A.floorY = 18; A.mat = TR;
  A.quad([dx0, 18, 0], [dx0, 18, 4.5], [dx0, SDOOR.y1, 4.5], [dx0, SDOOR.y1, 0], [1, 0, 0], { nu: 1 });
  A.quad([dx1, 18, 0], [dx1, 18, 4.5], [dx1, SDOOR.y1, 4.5], [dx1, SDOOR.y1, 0], [-1, 0, 0], { nu: 1 });
  A.quad([dx0, SDOOR.y1, 0], [dx1, SDOOR.y1, 0], [dx1, SDOOR.y1, 4.5], [dx0, SDOOR.y1, 4.5], [0, -1, 0], { nv: 1 });
  A.quad([dx0, 18, 0], [dx1, 18, 0], [dx1, 18, 4.5], [dx0, 18, 4.5], [0, 1, 0], { nv: 1 });
  walnutLeaf(A, dx0 + 0.06, dx1 - 0.06, 18.05, SDOOR.y1 - 0.05, 0.5, 1.1);
  // east wall (x 47..53) with five embrasures, sills and stone seats
  const wz = [-15.5, -46.5, -62, -77.5, -108.5], cut = [0, -31, -54.25, -69.75, -93, -124];
  for (let i = 0; i < 5; i++) {
    archWall(A, 'x', 47, 53, cut[i + 1], cut[i], 22, 53.5, wz[i] - 4, wz[i] + 4, 32, 4, { ring: 1.1, n: 10 });
    A.mat = TR; A.quad([47, 22, wz[i] - 4], [53, 22, wz[i] - 4], [53, 22, wz[i] + 4], [47, 22, wz[i] + 4], [0, 1, 0], { nu: 1, nv: 1 });
    A.box(45.4, 47, 18, 20.6, wz[i] - 5, wz[i] + 5, 'xzZY');
  }
  A.mat = PL; A.quad([47, 18, 0], [47, 18, -124], [47, 22, -124], [47, 22, 0], [-1, 0, 0], { nv: 1, ao: [0.3, 0, 0, 0] });
  A.zone = ZT; A.quad([53, 17, 4.5], [53, 17, -126], [53, 22, -126], [53, 22, 4.5], [1, 0, 0]); A.quad([46.5, 17, 4.5], [53, 17, 4.5], [53, 17, -126], [46.5, 17, -126], [0, -1, 0], { nu: 1 }); A.zone = ZG;
  cornice(A, 'x', 47, -1, -124, 0, 38.2, 1.1, 1.8);
  yield;
  // west arcade between gallery and west bay: piers, arches (crown y 38), wall above
  const pz = [-1.25, -31, -62, -93, -124];
  for (let j = 0; j < 5; j++) pier(A, -22, pz[j], 5, 18, 28, j === 0 ? 2.5 : 5);
  for (let j = 0; j < 4; j++) {
    const zS = j === 0 ? 0 : pz[j], zN = pz[j + 1];
    archWall(A, 'x', -24.5, -19.5, zN, zS, 28, 53.5, zN + 2.5, zS - 2.5, 28, 10, { ring: 1.5, n: 14 });
  }
  cornice(A, 'x', -19.5, 1, -124, 0, 38.2, 1.1, 1.8);
  A.mat = TR; A.quad([-24.5, 18, 0], [-19.5, 18, 0], [-19.5, 18, -124], [-24.5, 18, -124], [0, 1, 0], { nu: 1 });   // the arcade's threshold
  // diaphragm arch at z -31 and the open north end at z -124
  // cross arcade at z -31: two arches (crown y 37) on one free pier and a wall pier, diaphragm wall up to the vault
  archWall(A, 'z', -33, -29, -19.5, 10, 28, 52, -19.5, 7.5, 28, 9, { ring: 1.6, n: 18 });
  archWall(A, 'z', -33, -29, 10, 47, 28, 52, 12.5, 44, 28, 9, { ring: 1.6, n: 18 });
  pier(A, 10, -31, 5, 18, 28); pier(A, 45.6, -31, 2.8, 18, 28, 5);
  // the sill under the cross arcade: the painted pavement begins at its far edge (24.5 m from V2), so no paint ends in mid floor
  A.mat = TR; A.box(-19.5, 47, 18, 18.28, -35.5, -27.6, 'zZY', { ao: [0, 0, 0, 0] }); A.mat = PL;
  cornice(A, 'z', -33, -1, -19.5, 47, 39.4, 0.9, 1.4);
  // two proof walls: free-standing plastered slabs end-on to V2, whose long west flanks take the picture's east third
  pylon(A, 6.25, -44.5, 1.25, 4.5, 18, 36, true, TR); pylon(A, 16.75, -69.5, 1.25, 4.5, 18, 40, true, TR);
  // north end wall with the doorway at the head of stair B (x 14.5..33.5, crown y 40); its leaf hangs on the court face
  archWall(A, 'z', -126, -122, -19.5, 47, 18, 53.5, 14.5, 33.5, 32, 8, { ring: 1.6, n: 14 });
  yield;
  // the vault: segmental barrel springing at y 40 from the wall faces, crown y 50
  A.mat = PL; barrel(A, 13.75, 33.25, 40, 10, 0, -124, 26);
  A.mat = TR; for (const z of [-15.5, -46.5, -62, -77.5, -93, -108.5]) { barrel(A, 13.75, 32.6, 40, 9.45, z + 1.1, z - 1.1, 26); for (const zz of [z + 1.1, z - 1.1]) for (let i = 0; i < 26; i++) { const t0 = Math.PI * (1 - i / 26), t1 = Math.PI * (1 - (i + 1) / 26); A.quad([13.75 + 32.6 * Math.cos(t0), 40 + 9.45 * Math.sin(t0), zz], [13.75 + 32.6 * Math.cos(t1), 40 + 9.45 * Math.sin(t1), zz], [13.75 + 33.25 * Math.cos(t1), 40 + 10 * Math.sin(t1), zz], [13.75 + 33.25 * Math.cos(t0), 40 + 10 * Math.sin(t0), zz], [0, 0, zz - z], { nu: 1, nv: 1 }); } }
  A.mat = PL;
  // west bay, open to the sky
  A.zone = ZW; A.mat = TC;
  A.quad([-50, 18, 0], [-24.5, 18, 0], [-24.5, 18, -124], [-50, 18, -124], [0, 1, 0]);
  A.mat = PL;
  bandWall(A, (u, y) => [-50, y, u], 0, -124, [[18, 30, 0.34, 0], [30, 41, 0, 0], [41, 49.5, 0, 0.3], [49.5, 53.5, 0, 0]], [1, 0, 0]);
  bandWall(A, (u, y) => [u, y, 0], -50, -24.5, [[18, 30, 0.34, 0], [30, 53.5, 0, 0]], [0, 0, -1]);
  bandWall(A, (u, y) => [u, y, -124], -50, -24.5, [[18, 30, 0.34, 0], [30, 52, 0, 0]], [0, 0, 1]);
  cornice(A, 'x', -50, 1, -124, 0, 49.5, 1.2, 2);
  steps(A, -44, -28, -24, 18, -124, 52, 68);
  parapet(A, -45.5, -44, -24, 18, -124, 52, 4, 18); parapet(A, -28, -26.5, -24, 18, -124, 52, 4, 18);
  // the block's north face toward the court, west of the gallery arch
  A.zone = ZK; A.floorY = 18; A.mat = PL;
  bandWall(A, (u, y) => [u, y, -126], -40, -19.5, [[18, 30, 0.3, 0], [30, 44, 0, 0], [44, 53.5, 0, 0.12]], [0, 0, -1], [0.3, 0]);
  A.quad([47, 18, -126], [50, 18, -126], [50, 53.5, -126], [47, 53.5, -126], [0, 0, -1], { nu: 1 });
  yield;
  // roof terrace over the gallery (y 52): tiles, parapets, two stacks
  A.zone = ZT; A.floorY = 52; A.mat = TC;
  A.quad([-24.5, 52, 4.5], [53, 52, 4.5], [53, 52, -126], [-24.5, 52, -126], [0, 1, 0]);
  A.mat = TR;
  capped(A, -19.5, 53, 52, 53.5, -126, -124.6, 'zZ'); capped(A, -24.5, 53, 52, 53.5, 3.1, 4.5, 'zZ');
  capped(A, 51.6, 53, 52, 53.5, -124.6, 3.1, 'xX'); capped(A, -24.5, -23.1, 52, 53.5, -124.6, 3.1, 'xX');
  for (const [x, z] of [[22, -42], [34, -96]]) {
    A.mat = PL; A.prism(A.cham(x - 2.6, x + 2.6, z - 2, z + 2, 0.35), 52, 61, false);
    A.mat = TR; A.prism(A.cham(x - 3.1, x + 3.1, z - 2.5, z + 2.5, 0.3), 61, 62.2); A.box(x - 3.1, x + 3.1, 61, 61, z - 2.5, z + 2.5, 'y');
    A.prism(A.cham(x - 2.2, x + 2.2, z - 1.6, z + 1.6, 0.3), 62.2, 64);
  }
  // outer west wall of the wing and the west range beside the court (terrace walk at y 52)
  A.floorY = 0; A.mat = PL;
  A.quad([-54, 17, 4.5], [-54, 17, -126.5], [-54, 53.5, -126.5], [-54, 53.5, 4.5], [-1, 0, 0]);   // (open below: the cellar arcade stands free)
  A.quad([-54, 0, -126.5], [-54, 0, -310], [-54, 53.5, -310], [-54, 53.5, -126.5], [-1, 0, 0]);
  A.quad([-54, 17, 4.5], [-46.5, 17, 4.5], [-46.5, 17, -126.5], [-54, 17, -126.5], [0, -1, 0], { nu: 1 });
  A.quad([-54, 0, -126.5], [-46.5, 0, -126.5], [-46.5, 17, -126.5], [-54, 17, -126.5], [0, 0, 1], { nu: 1 });
  A.quad([-54, 53.5, 4.5], [-50, 53.5, 4.5], [-50, 53.5, -124], [-54, 53.5, -124], [0, 1, 0], { nu: 1 });
  A.floorY = 52; A.mat = TC;
  A.quad([-54, 52, -124], [-40, 52, -124], [-40, 52, -230], [-54, 52, -230], [0, 1, 0]);
  A.mat = TR; capped(A, -41.4, -40, 52, 53.5, -230, -126, 'xX');
  // ---- faces that close solids and walls typed above: ends, backs, tops, undersides and missing stretches of a wall's own face, each
  // within its solid's or wall's own extents, in its stone and light
  // the head of the roof stair: the top of the bay's north wall (x -40..-24.5, z -126..-124) is the walk's floor, tiled east of the court
  // cornice's top (x -38.8) up to the parapet's back (z -124.6); the wall's upper 1.5 m toward the court is the walk's parapet there, with its west end, its back and its own
  // top, from the end of the parapet over the court (x -41.4, z -126) to the end of the gallery roof's north parapet (x -19.5). It has no
  // coping: the wall's own top edge (y 53.5, z -126) casts the block's shadow into the court, and a coping would stand above and before it
  A.mat = TC; A.quad([-38.8, 52, -124], [-24.5, 52, -124], [-24.5, 52, -124.6], [-38.8, 52, -124.6], [0, 1, 0]);
  A.mat = TR; A.box(-41.4, -19.5, 52, 53.5, -126, -124.6, 'xZY');
  // the east range beside the court (x 50..54, z -126..-230): its roof at the walk's height, tiled up to its parapet; the outer east wall's upper 1.5 m is its
  // parapet, with its back, its south end and its own top. It has no coping: one would stand over the court's east wall in the sky
  A.mat = TC; A.quad([50, 52, -126], [52.6, 52, -126], [52.6, 52, -230], [50, 52, -230], [0, 1, 0]);
  A.mat = TR; A.box(52.6, 54, 52, 53.5, -230, -124, 'xZY');
  // the walk's west parapet (x -54..-52.6, z -124..-231.4): the outer west wall's upper 1.5 m is the walk's parapet, closed by its back toward the
  // walk and its own top, in the parapets' travertine, up to the terrace's west parapet; it has no coping. The back begins at y 52.06, 6 cm above the tile: the
  // fan's paint is laid by region, without a test of depth, up to y 52.05 west of x -39.2 (z -230.4..-186.2), and a back standing on the tile
  // would take its ink at its foot. Through that open strip the garden shows faintly for about 0.002 of the flight near u 0.697, while the eye
  // rises through the walk's level over the roof stair; with the page's samples the back's foot may be shaded as the fan's region just below it;
  // the solid parapet casts its own shadow on the walk's tile
  A.floorY = 52; A.mat = TR; A.box(-54, -52.6, 52.06, 53.5, -231.4, -124, 'XY');
  // the cellar's two fronts: over each front pier the 5 m that no arch wall covers (y 6.5..18; between two arch walls at the middle piers,
  // between one and the front's end at the outer ones) are closed in the front's own plane, in its plaster, with the foot shade an arch
  // wall gives its own strips (the north-west one lies inside the west range)
  A.zone = ZC; A.floorY = 0; A.mat = PL;
  for (const x of [-44, -4, 4, 44]) A.quad([x - 2.5, 6.5, 4.5], [x + 2.5, 6.5, 4.5], [x + 2.5, 18, 4.5], [x - 2.5, 18, 4.5], [0, 0, 1], { ao: [0.22, 0, 0, 0] });
  for (const x of [-4, 4, 44]) A.quad([x - 2.5, 6.5, -126.5], [x + 2.5, 6.5, -126.5], [x + 2.5, 18, -126.5], [x - 2.5, 18, -126.5], [0, 0, -1], { ao: [0.22, 0, 0, 0] });
  // the south wall's face between the wing's underside and the bay floor, west of the cellar's front (x -54..-46.5, y 17..18); the east
  // range's south face (x 50..54, z -124, y 0..17), as the west range has its own at z -126.5
  A.zone = ZT;
  A.quad([-54, 17, 4.5], [-46.5, 17, 4.5], [-46.5, 18, 4.5], [-54, 18, 4.5], [0, 0, 1], { nu: 1, nv: 1 });
  A.quad([50, 0, -124], [54, 0, -124], [54, 17, -124], [50, 17, -124], [0, 0, 1], { nu: 1 });
  // the block's north face between the wing's underside and the gallery floor, east of the cellar's end wall (x 46.5..50, y 17..18)
  A.zone = ZK; A.floorY = 18;
  A.quad([46.5, 17, -126], [50, 17, -126], [50, 18, -126], [46.5, 18, -126], [0, 0, -1], { nu: 1, nv: 1 });
  // the south wall's inner face behind the arcade's half pier (x -24.5..-19.5, up to the pier's impost)
  A.zone = ZG; A.floorY = 18;
  A.quad([-24.5, 18, 0], [-19.5, 18, 0], [-19.5, 28, 0], [-24.5, 28, 0], [0, 0, -1], { ao: [0.25, 0, 0, 0] });
  // the sill under the cross arcade: its west end
  A.mat = TR; A.box(-19.5, 47, 18, 18.28, -35.5, -27.6, 'x', { ao: [0, 0, 0, 0] });
  // in the court: the threshold slab's two ends, from stair B's head to the cellar's north front (z -126.5), into which the slab runs;
  // the east end of the fountain wall's frieze strip (its west end stands in the first picture at its standing point and stays as it is);
  // the undersides of the landing's middle and east parapets
  A.zone = ZK; A.floorY = 0;
  A.box(14.5, 33.5, 16.4, 18, -130, -126.5, 'xX');
  for (const [a, b] of [[-14.5, 14.5], [33.5, 50]]) A.box(a, b, 9, 13, -186, -184.5, 'y');
  A.floorY = 9;
  A.box(-16.2, 16.2, 21.6, 23, -199, -198.6, 'X');
  A.zone = ZT; A.floorY = 52;
  A.mat = PL;
}

// a walnut leaf x0..x1, y0..y1 between the faces za < zb: boards, stiles, rails and muntins proud on both faces
function walnutLeaf(A, x0, x1, y0, y1, za, zb) {
  const m = A.mat; A.mat = WN;
  A.box(x0, x1, y0, y1, za, zb, 'xXzZyY', { ao: [0.15, 0, 0, 0] });
  const xm = (x0 + x1) / 2, ym = y0 + (y1 - y0) * 0.45, bars = [[x0, x0 + 1.3, y0, y1], [x1 - 1.3, x1, y0, y1], [x0, x1, y0, y0 + 1.8], [x0, x1, y1 - 1.5, y1], [x0, x1, ym, ym + 1.4], [xm - 0.65, xm + 0.65, y0, y1]];
  if (x1 - x0 > 15) bars.push([x0 + (x1 - x0) * 0.25 - 0.5, x0 + (x1 - x0) * 0.25 + 0.5, y0, y1], [x0 + (x1 - x0) * 0.75 - 0.5, x0 + (x1 - x0) * 0.75 + 0.5, y0, y1]);
  for (const [a, b, c, d] of bars) { A.box(a, b, c, d, za - 0.14, za, 'xXyYz', { ao: [0, 0, 0, 0] }); A.box(a, b, c, d, zb, zb + 0.14, 'xXyYZ', { ao: [0, 0, 0, 0] }); }
  A.mat = m;
}
// the gallery's swinging door leaf (own geometry; rest pose = shut, across the north doorway on the room side; hinge at x 34)
function buildDoor(A) {
  A.zone = ZG; A.floorY = 18;
  walnutLeaf(A, DOOR.x0, DOOR.x1, DOOR.y0 + 0.05, DOOR.y1, DOOR.z - 0.3, DOOR.z + 0.3);
}

// ---------------------------------------------------------------- north terrace (y 52): cistern, pergola, stacks, well-head, window wall
// Everything here goes into its own geometry because the cistern shows it a second time, upside down.
function buildTerrace(A) {
  A.zone = ZT; A.floorY = 52; A.mat = TC;
  const ox0 = BAS.x0 - 2.5, ox1 = BAS.x1 + 2.5, oz0 = BAS.z0 - 2.5, oz1 = BAS.z1 + 2.5;
  A.quad([-54, 52, -230], [54, 52, -230], [54, 52, oz1], [-54, 52, oz1], [0, 1, 0]);
  A.quad([ox1, 52, oz1], [54, 52, oz1], [54, 52, -310], [ox1, 52, -310], [0, 1, 0]);
  A.quad([-54, 52, oz1], [ox0, 52, oz1], [ox0, 52, -310], [-54, 52, -310], [0, 1, 0], { nu: 1 });
  A.quad([ox0, 52, oz0], [ox1, 52, oz0], [ox1, 52, -310], [ox0, 52, -310], [0, 1, 0], { nv: 2 });
  // rim: outer faces, top, inner faces down into the water
  A.mat = TR;
  A.box(ox0, ox1, 52, 53.5, oz0, oz1, 'xXzZ', { ao: [0.3, 0, 0, 0] });
  A.quad([ox0, 53.5, oz1], [ox1, 53.5, oz1], [ox1, 53.5, BAS.z1], [ox0, 53.5, BAS.z1], [0, 1, 0], { nv: 1 });
  A.quad([ox0, 53.5, BAS.z0], [ox1, 53.5, BAS.z0], [ox1, 53.5, oz0], [ox0, 53.5, oz0], [0, 1, 0], { nv: 1 });
  A.quad([ox0, 53.5, BAS.z1], [BAS.x0, 53.5, BAS.z1], [BAS.x0, 53.5, BAS.z0], [ox0, 53.5, BAS.z0], [0, 1, 0], { nu: 1 });
  A.quad([BAS.x1, 53.5, BAS.z1], [ox1, 53.5, BAS.z1], [ox1, 53.5, BAS.z0], [BAS.x1, 53.5, BAS.z0], [0, 1, 0], { nu: 1 });
  const wy = WATER_Y - 0.6, io = { ao: [0.45, 0, 0, 0], nv: 2 };
  A.floorY = wy - 30;
  A.quad([BAS.x0, wy, BAS.z1], [BAS.x1, wy, BAS.z1], [BAS.x1, 53.5, BAS.z1], [BAS.x0, 53.5, BAS.z1], [0, 0, -1], io);
  A.quad([BAS.x0, wy, BAS.z0], [BAS.x1, wy, BAS.z0], [BAS.x1, 53.5, BAS.z0], [BAS.x0, 53.5, BAS.z0], [0, 0, 1], io);
  A.quad([BAS.x0, wy, BAS.z0], [BAS.x0, wy, BAS.z1], [BAS.x0, 53.5, BAS.z1], [BAS.x0, 53.5, BAS.z0], [1, 0, 0], io);
  A.quad([BAS.x1, wy, BAS.z0], [BAS.x1, wy, BAS.z1], [BAS.x1, 53.5, BAS.z1], [BAS.x1, 53.5, BAS.z0], [-1, 0, 0], io);
  // window wall (z -304..-300, x -50..-8, to y 86) with the 16 m arch round the portal
  archWall(A, 'z', -304, -300, -54, -8, 56, 86, -44, -28, 64, 8, { ring: 1.7, n: 20 });
  A.mat = PL; A.floorY = 52;
  A.quad([-54, 52, -300], [-8, 52, -300], [-8, 56, -300], [-54, 56, -300], [0, 0, 1], { nv: 1, ao: [0.3, 0, 0, 0] });
  A.quad([-54, 52, -304], [-8, 52, -304], [-8, 56, -304], [-54, 56, -304], [0, 0, -1], { nv: 1 });
  A.quad([-8, 52, -304], [-8, 52, -300], [-8, 86, -300], [-8, 86, -304], [1, 0, 0], { nu: 1 });
  A.mat = TR;
  A.quad([-44, 56, -304.3], [-28, 56, -304.3], [-28, 56, -299.7], [-44, 56, -299.7], [0, 1, 0], { nu: 2, nv: 1 });
  A.box(-54, -7.6, 52, 53.6, -300, -299.5, 'ZYX'); A.box(-8.4, -7.6, 53.6, 86, -304.4, -299.6, 'xXzZ');
  cornice(A, 'z', -300, 1, -54, -8, 80, 1.2, 2);
  A.box(-54.4, -7.4, 86, 87.2, -304.6, -299.4, 'xXzZyY', { ao: [0, 0, 0, 0] });
  // the north screen east of the window wall: five open arches across the end of the terrace, the hills showing through;
  // it takes the east side of the glory, and from the roof stair the whole north end reads as one front
  A.zone = ZT; A.floorY = 52; A.mat = PL;
  for (let i = 0; i < 5; i++) { const u0 = -8 + i * 12.12; archWall(A, 'z', -303.4, -300.6, u0, u0 + 12.12, 52, 71, u0 + 1.1, u0 + 11.02, 61.5, 5, { ring: 1.0, n: 12 }); }
  A.mat = PL; A.quad([52.6, 52, -303.4], [52.6, 52, -300.6], [52.6, 71, -300.6], [52.6, 71, -303.4], [1, 0, 0], { nu: 1 });
  A.mat = TR; A.box(-8, 53, 71, 72.3, -303.9, -300.1, 'xXzZyY', { ao: [0, 0, 0, 0] });
  for (let i = 1; i < 5; i++) { const x = -8 + i * 12.12; A.box(x - 1.3, x + 1.3, 52, 53.6, -304, -300, 'xXzZY'); A.box(x - 1.25, x + 1.25, 60.6, 61.5, -303.9, -300.1, 'xXzZyY', { ao: [0, 0, 0, 0] }); }
  // pergola: three rows of stone posts standing in the water, three plates, six chestnut beams
  for (const z of POSTZ) for (const x of POSTX) {
    A.floorY = wy; A.mat = TR;
    A.prism(A.cham(x - 1.15, x + 1.15, z - 1.15, z + 1.15, 0.3), wy, 54.4);
    A.prism(A.cham(x - 0.8, x + 0.8, z - 0.8, z + 0.8, 0.22), 54.4, 69.4, false, [0.12, 0.12, 0, 0]);
    A.prism(A.cham(x - 1.1, x + 1.1, z - 1.1, z + 1.1, 0.2), 69.4, 70.2); A.box(x - 1.1, x + 1.1, 69.4, 69.4, z - 1.1, z + 1.1, 'y');
  }
  A.mat = WN; A.floorY = 52;
  for (const x of POSTX) A.box(x - 0.55, x + 0.55, 70.2, 71, -276, -256, 'xXyYzZ', { ao: [0, 0, 0, 0] });
  for (let i = 0; i < 6; i++) { const z = -258.5 - i * 3; A.box(-47.6, -4.6, 71, 72.5, z - 0.6, z + 0.6, 'xXyYzZ', { ao: [0, 0, 0, 0] }); }
  // two stacks on plinths in the cistern
  for (const [x, z, top] of [[-13, -258, 70], [2, -291, 76]]) {
    A.floorY = wy; A.mat = TR; A.prism(A.cham(x - 2.5, x + 2.5, z - 2.5, z + 2.5, 0.4), wy, 54.6);
    A.mat = PL; A.prism(A.cham(x - 2, x + 2, z - 2, z + 2, 0.3), 54.6, top, false, [0.15, 0.12, 0, 0]);
    A.mat = TR; A.prism(A.cham(x - 2.5, x + 2.5, z - 2.5, z + 2.5, 0.25), top, top + 1.1); A.box(x - 2.5, x + 2.5, top, top, z - 2.5, z + 2.5, 'y');
    A.prism(A.cham(x - 1.7, x + 1.7, z - 1.7, z + 1.7, 0.3), top + 1.1, top + 2.8);
  }
  // well-head on its island, in the east half of the cistern
  const wx = 12, wz = -268;
  A.floorY = wy; A.mat = TR; A.prism(A.cham(wx - 3.5, wx + 3.5, wz - 3.5, wz + 3.5, 0.8), wy, 53.2);
  A.floorY = 53.2;
  const ring = (r, n = 12) => { const p = []; for (let i = 0; i < n; i++) { const a = -i / n * Math.PI * 2; p.push([wx + r * Math.cos(a), wz + r * Math.sin(a)]); } return p; };
  A.prism(ring(2.3), 53.2, 53.7); A.prism(ring(1.9), 53.7, 55.1, false, [0.2, 0.15, 0, 0]); A.prism(ring(2.15), 55.1, 55.5);
  A.box(wx - 1.95, wx - 1.45, 55.5, 57, wz - 0.3, wz + 0.3, 'xXzZ'); A.box(wx + 1.45, wx + 1.95, 55.5, 57, wz - 0.3, wz + 0.3, 'xXzZ');
  A.box(wx - 2.2, wx + 2.2, 57, 57.55, wz - 0.35, wz + 0.35, 'xXyYzZ', { ao: [0, 0, 0, 0] });
  // causeway and low screen wall at z -284, east of the porch
  A.floorY = wy; A.mat = TR; A.box(-22.5, BAS.x1, wy, 53.5, -285.5, -282.5, 'zZY', { ao: [0.4, 0, 0, 0] });
  A.floorY = 53.5; A.mat = PL; A.box(-22.5, 12, 53.5, 62, -284.8, -283.2, 'XzZ'); A.mat = TR; A.box(-22.5, 12.3, 62, 62.7, -285.1, -282.9, 'XzZyY', { ao: [0, 0, 0, 0] });
  // the water porch before the window wall: a barrel vault of radius 11.5 about the portal's own axis (crown y 75.5)
  // on two flank walls standing in the cistern, with an arched front. The wreath's cone meets the barrel and the
  // flanks as long bands; the east flank holds the pivoting leaf (z -297..-285).
  A.zone = ZP; A.floorY = wy; A.mat = PL;
  barrel(A, -36, 11.5, 64, 11.5, -282, -300, 22);
  A.quad([-47.5, wy, -280], [-47.5, wy, -300], [-47.5, 64, -300], [-47.5, 64, -280], [1, 0, 0], { ao: [0.3, 0, 0, 0] });
  for (const [z0, z1] of [[-285, -280], [-300, -297]]) A.quad([-24.5, wy, z0], [-24.5, wy, z1], [-24.5, 64, z1], [-24.5, 64, z0], [-1, 0, 0], { ao: [0.3, 0, 0, 0] });
  A.mat = TR;
  for (const z of [-285, -297]) A.quad([-24.5, LEAF.y0 - 0.1, z], [-22.5, LEAF.y0 - 0.1, z], [-22.5, 64, z], [-24.5, 64, z], [0, 0, z > -290 ? -1 : 1], { nu: 1 });
  A.quad([-24.5, 64, -297], [-22.5, 64, -297], [-22.5, 64, -285], [-24.5, 64, -285], [0, -1, 0], { nu: 1, nv: 1 });
  A.box(-24.5, -22.5, wy, LEAF.y0 - 0.1, -297, -285, 'xXY', { ao: [0.3, 0, 0, 0] });
  cornice(A, 'x', -47.5, 1, -300, -280, 62.4, 0.5, 1.6); cornice(A, 'x', -24.5, -1, -285, -280, 62.4, 0.5, 1.6);
  A.zone = ZT; A.mat = PL;
  A.quad([-49.5, 52, -280], [-49.5, 52, -300], [-49.5, 79, -300], [-49.5, 79, -280], [-1, 0, 0]);
  for (const [z0, z1, y0] of [[-285, -280, wy], [-300, -297, wy], [-297, -285, 64]]) A.quad([-22.5, y0, z0], [-22.5, y0, z1], [-22.5, 79, z1], [-22.5, 79, z0], [1, 0, 0]);
  A.mat = TC; A.quad([-49.5, 79, -280], [-22.5, 79, -280], [-22.5, 79, -300], [-49.5, 79, -300], [0, 1, 0]);
  // the front: a round arch a little narrower than the barrel, so that from far off the band inside stays hidden
  // behind its rim, and a sill across the mouth that takes the wreath's lowest arc
  archWall(A, 'z', -282, -280, -49.5, -22.5, wy, 79, -46.6, -25.4, 64, 10.6, { ring: 1.5, n: 22 });
  A.floorY = wy; A.mat = PL; A.box(-46.6, -25.4, wy, 56.4, -281.6, -280.4, 'zZ', { ao: [0.3, 0, 0, 0] });
  A.mat = TR; A.box(-46.6, -25.4, 56.4, 57, -281.9, -280.1, 'zZyY', { ao: [0, 0, 0, 0] });
  A.mat = TR; cornice(A, 'z', -280, 1, -49.9, -22.1, 79, 1.2, 2); cornice(A, 'x', -22.5, 1, -300, -280, 79, 1.2, 2); cornice(A, 'x', -49.5, -1, -300, -280, 79, 1.2, 2);
  for (const x of [-49.5, -22.5]) A.prism(A.cham(x - 1.2, x + 1.2, -281.2, -278.8, 0.3), wy, 54.6);
  // parapet over the court, outer faces of the north block
  A.floorY = 52; A.mat = TR; capped(A, -40, 54, 52, 53.5, -231.4, -230, 'zZ');
  capped(A, 52.6, 54, 52, 53.5, -310, -231.4, 'xX'); capped(A, -7.4, 52.6, 52, 53.5, -310, -308.6, 'zZ'); capped(A, -54, -52.6, 52, 53.5, -300, -231.4, 'xX');
  A.zone = ZT; A.floorY = 0; A.mat = PL;
  A.quad([-54, 0, -310], [54, 0, -310], [54, 53.5, -310], [-54, 53.5, -310], [0, 0, -1]);
  A.quad([54, 0, -124], [54, 0, -310], [54, 53.5, -310], [54, 53.5, -124], [1, 0, 0]);
  // the north wall's upper 1.5 m behind the window wall (x -54..-7.4) is the terrace's parapet: its back and its own top (no coping: one
  // would stand above the wall's own top edge); the west parapet's south end (z -231.4)
  A.floorY = 52; A.mat = TR; A.box(-54, -7.4, 52, 53.5, -310, -308.6, 'ZY'); A.box(-54, -52.6, 52, 53.5, -300, -231.4, 'Z');
  A.floorY = 0;
  A.mat = PL;
}

// the porch's pivoting leaf (own geometry; rest pose = shut, in the east flank wall of the water porch)
function buildLeaf(A) {
  A.zone = ZP; A.floorY = LEAF.y0; A.mat = WN;
  const z0 = LEAF.z - LEAF.hw + 0.08, z1 = LEAF.z + LEAF.hw - 0.08, y0 = LEAF.y0, y1 = LEAF.y1, xa = LEAF.x - 0.3, xb = LEAF.x + 0.3;
  A.box(xa, xb, y0, y1, z0, z1, 'xXzZyY', { ao: [0.12, 0, 0, 0] });
  const bars = [[z0, z0 + 1.1, y0, y1], [z1 - 1.1, z1, y0, y1], [z0, z1, y0, y0 + 1.3], [z0, z1, y1 - 1.1, y1], [LEAF.z - 0.5, LEAF.z + 0.5, y0, y1]];
  for (const [a, b, c, d] of bars) A.box(xb, xb + 0.14, c, d, a, b, 'XyYzZ', { ao: [0, 0, 0, 0] });
}

function accToGeometry(A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nor, 3));
  g.setAttribute('aDat', new THREE.Float32BufferAttribute(A.dat, 3));
  g.setIndex(A.n > 65535 ? new THREE.Uint32BufferAttribute(A.idx, 1) : new THREE.Uint16BufferAttribute(A.idx, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// ---------------------------------------------------------------- shaders
const VERT = /* glsl */`
attribute vec3 aDat;
uniform vec3 uPiv; uniform float uMir, uWater, uTime;
varying vec3 vP, vN, vD, vL;
#include <fog_pars_vertex>
void main() {
  vP = position; vN = normal; vD = aDat;
  vec3 p = position;
  float c = cos(uPiv.z), s = sin(uPiv.z);
  vec2 r = p.xz - uPiv.xy; p.xz = uPiv.xy + vec2(c * r.x - s * r.y, s * r.x + c * r.y);
  p.y = mix(p.y, 2. * uWater - p.y, uMir);
  // the copy under the water trembles: it sways sideways, more the deeper it lies (the taller the thing above), and not at
  // all at the waterline, where a thing and its image meet (1.2 cm of sway for each metre of depth)
  float dep = uMir * max(uWater - p.y, 0.);
  p.xz += dep * 0.012 * vec2(sin(p.y * 0.61 + uTime * 1.7 + position.z * 0.23), sin(p.y * 0.53 - uTime * 1.3 + position.x * 0.29));
  vL = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// depth from a vantage point: axial distance / uFar packed into RGBA8
const FRAG_DEPTH = /* glsl */`
uniform vec3 uBV, uBAx; uniform float uFar;
varying vec3 vL;
void main() {
  float t = clamp(dot(vL - uBV, uBAx) / uFar, 0., 0.9999);
  vec4 e = fract(t * vec4(1., 255., 65025., 16581375.));
  e -= e.yzww * vec4(1. / 255., 1. / 255., 1. / 255., 0.);
  gl_FragColor = e;
}`;

// The cistern's ripples: three trains of long crests that cross one another and wander (3.9 m, 3.5 m and 1.95 m from crest to
// crest: breeze ripples of about a metre, a half-metre chop, at four times life size); the slope of the water at p, about -1..1.
// Needs vn() and uSeed; no derivatives and no texture inside, so it may be called from anywhere.
const RIPPLE = /* glsl */`
vec2 ripSlope(vec2 p, float t) {
  float w = vn(p * 0.19 + uSeed.xy) * 5.;
  vec2 k1 = vec2(0.62, 1.48), k2 = vec2(-1.71, 0.52), k3 = vec2(1.9, -2.6);
  return 0.31 * k1 * cos(dot(p, k1) + t * 1.3 + w + uSeed.z) + 0.21 * k2 * cos(dot(p, k2) - t * 1.7 + w * 0.7 + uSeed.w) + 0.075 * k3 * cos(dot(p, k3) + t * 2.6 - w * 1.3 + uSeed.x);
}
`;

const FRAG_HEAD = /* glsl */`
uniform vec3 uV[3]; uniform vec3 uAx[3]; uniform vec3 uRt[3]; uniform vec3 uUp[3];
uniform vec3 uVm;
uniform sampler2D uD0, uD1, uD2;
uniform float uFar, uTan, uMir, uWater, uTime, uBright, uPaintOn;
uniform vec3 uPlaster, uStone, uTile, uWood, uUmber, uSienna, uChalk, uBlue, uEye;
uniform vec4 uBasin, uSeed, uArm, uLog;
uniform vec3 uLog2, uRes, uNear, uRose;
uniform float uCells, uChk, uWr, uEyeH, uGap, uLeafNear;
uniform vec3 uV6, uAx6, uRt6, uUp6, uCSun;
uniform sampler2D uD3, uDS; uniform mat4 uSunM; uniform vec3 uSunPos, uSunDir, uSunCol, uAmb, uV0; uniform float uSunFar, uSunRes, uTan0, uFar0;
varying vec3 vP, vN, vD, vL;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n + 17.1)); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p) { return 0.5 * vn(p) + 0.3 * vn(p * 2.13 + 7.1) + 0.2 * vn(p * 4.37 + 3.7); }
${RIPPLE}
float unpack(vec4 e) { return dot(e, vec4(1., 1. / 255., 1. / 65025., 1. / 16581375.)); }
float seen(sampler2D m, vec2 q, float t, float res, float cs, float near, float slack, float tn, float far) {
  vec2 uv = q / (2. * tn) + 0.5; float tx = 0.5 / res;
  float d = max(max(unpack(textureLod(m, uv + vec2(-tx, -tx), 0.)), unpack(textureLod(m, uv + vec2(tx, -tx), 0.))),
                max(unpack(textureLod(m, uv + vec2(-tx, tx), 0.)), unpack(textureLod(m, uv + vec2(tx, tx), 0.))));
  float c = clamp(cs, 0.04, 1.);
  float b = 0.1 + slack + 0.006 * t + t * (2.4 * tn / res) * sqrt(max(1. - c * c, 0.)) / c;
  float inside = step(max(abs(q.x), abs(q.y)), tn * 0.985) * step(near, t);
  return inside * (1. - smoothstep(b, b * 1.7, t - d * far));
}
// the same test with the four taps weighed by their distance (for the astrolabe, which lies on vaults and floors at a very
// low angle from its point, where one texel of the map is metres long on the surface): edges come out soft, not stepped
float seenSoft(sampler2D m, vec2 q, float t, float res, float cs, float near, float tn, float far) {
  vec2 st = (q / (2. * tn) + 0.5) * res - 0.5, i0 = floor(st), f = st - i0, b0 = (i0 + 0.5) / res; float tx = 1. / res;
  vec4 d = vec4(unpack(textureLod(m, b0, 0.)), unpack(textureLod(m, b0 + vec2(tx, 0.), 0.)), unpack(textureLod(m, b0 + vec2(0., tx), 0.)), unpack(textureLod(m, b0 + vec2(tx, tx), 0.))) * far;
  float c = clamp(cs, 0.04, 1.), b = 0.1 + 0.006 * t + t * (2.4 * tn / res) * sqrt(max(1. - c * c, 0.)) / c;
  vec4 s = 1. - smoothstep(vec4(b), vec4(b * 1.7), vec4(t) - d);
  float inside = step(max(abs(q.x), abs(q.y)), tn * 0.985) * step(near, t);
  return inside * mix(mix(s.x, s.y, f.x), mix(s.z, s.w, f.x), f.y);
}
// the sun: 1 where the point sees it (one depth map baked along the sun's rays, five taps), 0 in cast shadow
float sunVis(vec3 p, float ndl) {
  vec4 c = uSunM * vec4(p, 1.);
  if (c.x < 0.002 || c.x > 0.998 || c.y < 0.002 || c.y > 0.998) return 1.;
  float t = dot(p - uSunPos, -uSunDir) / uSunFar, tx = 1.3 / uSunRes;
  float b = (0.3 + 0.35 * min(sqrt(max(1. - ndl * ndl, 0.)) / max(ndl, 0.12), 4.)) / uSunFar;
  float s = step(t - b, unpack(textureLod(uDS, c.xy, 0.)));
  s += step(t - b, unpack(textureLod(uDS, c.xy + vec2(tx, tx * 0.4), 0.))) + step(t - b, unpack(textureLod(uDS, c.xy + vec2(-tx * 0.4, tx), 0.)));
  s += step(t - b, unpack(textureLod(uDS, c.xy + vec2(-tx, -tx * 0.4), 0.))) + step(t - b, unpack(textureLod(uDS, c.xy + vec2(tx * 0.4, -tx), 0.)));
  return s * 0.2;
}
// an arch opening seen square on (a rectangle below the springing ys, half an ellipse of rise b above it, half span a):
// 1 inside, 0 outside, soft over w metres
float archIn(float du, float y, float a, float ys, float b, float w) {
  float dy = max(y - ys, 0.), e = length(vec2(du / a, dy / b));
  float d = dy < 1e-3 ? a - abs(du) : (1. - e) * e / max(length(vec2(du / (a * a), dy / (b * b))), 1e-4);
  return smoothstep(-w, w, d);
}
// The cellar's sun: 1 where a point of the cellar sees the low sun uCSun (unit, toward the sun: from the south west), 0 in
// shade. Worked out from the plan itself, no map: in the west aisle the ray to the sun must pass the west arcade's two faces
// inside ONE opening (between the piers, under the arch: the opening it is in at the arcade's middle plane x -44, so a ray
// that would enter by one opening and leave by the next is stopped by the pier between them; a point within the arcade's
// own thickness must itself stand in that opening) and every cross arch south of it under its arch. The sun is followed
// as far east as the middle row's west faces (x -6.5: the fade lies just inside those piers, x -6.4 .. -6.2); east of them the
// law gives shade, and the east aisle is reached only through its south mouth; soft = the edge's softness in metres.
float cellarSun(vec3 p, float soft) {
  vec3 L = uCSun; float east = step(1.5, p.x), xc = mix(-24., 24., east);
  float vis = mix(1. - smoothstep(-6.4, -6.2, p.x), smoothstep(6.5, 8.5, p.x), east);
  if (vis <= 0.) return 0.;
  if (east < 0.5 && p.x > -46.45) {
    float x1 = p.x > -41.45 ? -41.5 : -46.5; vec3 h1 = p + L * ((x1 - p.x) / min(L.x, -1e-3));   // the first face met on the way west
    if (h1.z < 4.5) {
      vec3 hm = p + L * (max(p.x + 44., 0.) / max(-L.x, 1e-3));
      float far = step(hm.z, -31.), zc = mix(-14.5, -46.5 - 31. * clamp(floor((-hm.z - 31.) / 31.), 0., 2.), far);
      if (p.x < -41.45) vis *= archIn(p.z - zc, p.y, mix(14., 13., far), 6.5, 4.5, soft);
      for (int i = 0; i < 2; i++) {
        float xf = i == 0 ? -41.5 : -46.5;
        if (p.x > xf + 0.05) {
          float sx = (xf - p.x) / min(L.x, -1e-3); vec3 h = p + L * sx;
          vis *= archIn(h.z - zc, h.y, mix(14., 13., far), 6.5, 4.5, soft + 0.012 * sx);
        }
      }
    } else if (p.x < -41.45) return 0.;   // from within the arcade's thickness the way south is through the corner pier
  }
  for (int k = 0; k < 5; k++) {
    float zk = k == 0 ? 2. : -31. * float(k), hw = (k == 0 || k == 4) ? 2.5 : 1.5;
    for (int j = 0; j < 2; j++) {
      float zf = zk + (j == 0 ? -hw : hw);
      if (p.z < zf - 0.05) {
        float sz = (zf - p.z) / max(L.z, 1e-3); vec3 h = p + L * sz;
        if (east > 0.5 || h.x > -41.5) vis *= archIn(h.x - xc, h.y, 17.5, 6.5, 8., soft + 0.012 * sz);
      }
    }
  }
  return vis;
}
float lineA(float d, float w, float fw) { return 1. - smoothstep(w - fw * 0.5, w + fw * 0.5, d); }
float fillA(float d, float fw) { return 1. - smoothstep(-fw * 0.5, fw * 0.5, d); }
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0., 1.); return length(pa - ba * h); }
// distance to an ellipse outline: radius r along x, r*s along y
float sdEl(vec2 p, float r, float s) {
  vec2 e = vec2(p.x, p.y / s); float l = max(length(e), 1e-5);
  float g = max(length(vec2(p.x, p.y / (s * s))) / l, 1e-3);
  return (l - r) / g;
}

// ---- the four grounds (plaster, travertine, terracotta, walnut); s = surface coordinates in metres
// bk = 1 in the open west bay, whose wall and piers the eye rounds at ten to twenty-five metres in plain daylight with no
// picture on them: there the same plaster and the same stone are worked further (their mean tone is not changed: every
// term added swings about nothing, and the crazing and the joints are hairlines)
vec3 ground(float m, vec2 s, float fs, float up, float bk) {
  vec3 c;
  if (m < 0.5) {            // trowelled lime plaster: float marks, long stains, hairline crazing
    float f = fbm(s * 0.11 + uSeed.xy), tr = vn(vec2(s.x * 0.5 + f * 2., s.y * 2.2) + uSeed.yx);
    float st = fbm(vec2(s.x * 0.21, s.y * 0.035) + 11.3);
    float cz = abs(vn(s * 1.15 + 31.7) - 0.5) + abs(vn(s * 0.63 - 9.2) - 0.5) * 0.8;
    float craze = (1. - smoothstep(0.004, 0.012 + fs * 0.6, cz)) * (1. - smoothstep(0.02, 0.07, fs));
    // (bay) the crazing stays a hairline, never wider than a pixel, and is not lost before fifty metres
    craze = mix(craze, (1. - smoothstep(0.004, 0.012 + fs * 0.6, cz)) * (1. - smoothstep(0.05, 0.14, fs)), bk);
    vec2 sd = vec2(s.x * 0.866 + s.y * 0.5, s.y * 0.866 - s.x * 0.5);
    float t2 = vn(vec2(sd.x * 0.3 + f * 3., sd.y * 1.5) + uSeed.zw), far = 1. - smoothstep(0.25, 0.9, fs);
    // float marks: short arcs of the trowel, one sweep per cell, at very low contrast
    vec2 tc = s / 2.7, ti = floor(tc), tf = fract(tc) - 0.5 + (h22(ti + uSeed.xy) - 0.5) * 0.7;
    float sw = sin(length(tf + vec2(1.1, -0.8) * (0.6 + 0.8 * h21(ti + 5.3))) * 23.) * (1. - smoothstep(0.3, 0.75, length(tf)));
    c = uPlaster * (0.93 + 0.1 * f + far * (0.05 * (tr - 0.5) + 0.04 * (t2 - 0.5) + 0.028 * sw) - 0.13 * smoothstep(0.5, 0.85, st)) * (1. - (0.12 + 0.07 * bk) * craze);
    if (bk > 0.) {
      // (bay) the float's broad sweeps: one fan of arcs to each stretch of wall a man works from one stance (5.4 m at four
      // times life), arcs a float's width apart (1.6 m); the trowel's streaks and short arcs are left standing a little prouder
      vec2 bc = s / 5.4, bi = floor(bc), bf = fract(bc) - 0.5 + (h22(bi + uSeed.zw) - 0.5) * 0.6;
      float bl = length(bf + vec2(-0.9, 1.3) * (0.7 + 0.6 * h21(bi + 2.7))), bw = sin(bl * 21.2) * (1. - smoothstep(0.35, 0.8, length(bf)));
      float keep = 1. - smoothstep(0.5, 1.6, fs);
      c *= 1. + bk * keep * (0.065 * bw + 0.045 * (tr - 0.5) + 0.04 * (t2 - 0.5) + 0.04 * sw + 0.02 * (vn(s * 0.9 + uSeed.yx) - 0.5));
    }
    c = mix(c, c * vec3(1.03, 0.98, 0.9), smoothstep(0.45, 0.85, st) * 0.6);
    vec2 gp = floor((s + 1.6 * vec2(vn(s * 0.21 + 3.), vn(s * 0.21 + 19.))) / vec2(7.5, 5.5));
    c *= 0.93 + 0.14 * h21(gp + uSeed.zw);   // the day's patches of the plasterer
  } else if (m < 1.5) {     // travertine in coursed blocks: joints, per-block tone, bedding streaks and pits
    vec2 g = vec2(s.x / 3.4, s.y / 1.55); g.x += 0.5 * mod(floor(g.y), 2.) + 0.13 * h21(vec2(floor(g.y), 3.));
    vec2 id = floor(g), f = fract(g);
    vec2 e = min(f, 1. - f) * vec2(3.4, 1.55);
    float j = 1. - smoothstep(0.03, 0.05 + fs, min(e.x, e.y)); j *= 0.03 / max(fs * 0.7, 0.03);
    float bed = vn(vec2(s.x * 0.35 + id.y * 3.1, s.y * 5.5)) * 0.6 + vn(vec2(s.x * 1.7, s.y * 14.) + id * 5.) * 0.4;
    float pit = smoothstep(0.62, 0.78, vn(vec2(s.x * 2.6, s.y * 9.) + id * 7.3)) * (1. - smoothstep(0.02, 0.06, fs));
    c = uStone * (0.9 + 0.14 * h21(id + uSeed.xy) + 0.08 * (bed - 0.5)) * (1. - 0.2 * j) * (1. - 0.16 * pit);
    if (bk > 0.) {
      // (bay) coursed travertine seen close: the joints stay drawn however far off, each block has its own tone, the bedding
      // shows as streaks, and along the beds lie the stone's open voids (about a metre by a quarter, four times life)
      float jb = (1. - smoothstep(0.03, 0.05 + fs * 1.2, min(e.x, e.y))) * (1. - smoothstep(0.25, 0.7, fs));
      float vd = smoothstep(0.64, 0.8, vn(vec2(s.x * 1.1 + id.y * 2.3, s.y * 5.2) + id * 3.1)) * (1. - smoothstep(0.08, 0.28, fs));
      c *= (1. + bk * (0.1 * (h21(id + uSeed.zw) - 0.5) + 0.11 * (bed - 0.5))) * (1. - bk * 0.24 * max(jb - 0.2 * j, 0.)) * (1. - bk * 0.2 * vd);
    }
  } else if (m < 2.5) {     // terracotta tiles 1.2 m square laid diagonally
    vec2 g = vec2(s.x + s.y, s.x - s.y) * (0.7071 / 1.2); vec2 id = floor(g), f = fract(g);
    vec2 e = min(f, 1. - f) * 1.2;
    float j = 1. - smoothstep(0.025, 0.04 + fs, min(e.x, e.y)); j *= 0.03 / max(fs * 0.6, 0.03);
    float w = fbm(s * 0.09 + 5.), hh = h21(id + uSeed.zw);
    c = uTile * (0.8 + 0.3 * hh + 0.12 * (w - 0.5) + 0.05 * (vn(s * 3.) - 0.5));
    c = mix(c, c * vec3(0.9, 0.93, 1.0), smoothstep(0.6, 0.95, hh) * 0.5);
    c = mix(c, uStone * 0.86, j * 0.75);
    c = mix(c, uPlaster * 0.8, smoothstep(0.62, 0.9, w) * 0.16);
    c = mix(c, uStone * 0.8, 0.1);
  } else {                   // dark walnut boards with iron studs
    float b = s.x / 1.05, id = floor(b), f = fract(b);
    float gr = vn(vec2(s.x * 7. + id * 9., s.y * 0.45 + id * 3.)) * 0.6 + vn(vec2(s.x * 19., s.y * 1.3)) * 0.4;
    float j = (1. - smoothstep(0.02, 0.035 + fs, min(f, 1. - f) * 1.05)) * 0.03 / max(fs * 0.6, 0.03);
    c = uWood * (0.75 + 0.3 * h21(vec2(id, 7.)) + 0.3 * (gr - 0.5)) * (1. - 0.5 * j);
    vec2 sg = fract(s / 1.6) - 0.5; float sd = length(sg) * 1.6;
    float stud = fillA(sd - 0.13, fs) * (1. - smoothstep(0.03, 0.09, fs));
    c = mix(c, vec3(0.045, 0.043, 0.045) + 0.09 * fillA(length(sg * 1.6 - vec2(-0.03, 0.04)) - 0.045, fs), stud);
  }
  return c;
}
`;

const FRAG_PICS = /* glsl */`
void lay(inout vec3 c, vec3 p, float a) { c = mix(c, p, clamp(a, 0., 1.)); }

// one ring of the armillary: front half umber with a chalk line beside it, back half thin sienna
void ringP(inout vec3 c, vec2 pp, float r, float s, float bk, float fw, float v) {
  float d = sdEl(pp, r, s), back = bk * fillA(-pp.y, fw);
  lay(c, uChalk, v * (1. - back) * lineA(abs(d + 0.0095), 0.0028, fw));
  lay(c, mix(uUmber, uSienna, back), v * lineA(abs(d), mix(0.0052, 0.0026, back), fw));
}
// picture 1: armillary sphere. uArm = (axis tilt, ecliptic angle, ring squash, radius)
float sphereP(inout vec3 c, vec2 q, float fw, float v) {
  float R = uArm.w, sq = uArm.z, l = length(q);
  vec2 ax = vec2(sin(uArm.x), cos(uArm.x)), ex = vec2(ax.y, -ax.x);
  vec2 p = vec2(dot(q, ex), dot(q, ax));
  float disc = fillA(l - R, fw);
  // the horizon band: a broad graduated ring far wider than the sphere, its far half passing behind the globe
  vec2 hp = vec2(q.x + 0.06 * q.y, q.y - 0.06 * q.x + 0.05 * R);
  float hs = 0.21, e1 = sdEl(hp, R * 1.66, hs), e2 = sdEl(hp, R * 1.43, hs), hb = fillA(e1, fw) * (1. - fillA(e2, fw)) * (1. - disc * fillA(-hp.y, fw));
  float ha = atan(hp.y / hs, hp.x + (abs(hp.x) + abs(hp.y) < 1e-5 ? 1e-4 : 0.)) * 28.6479, hfw = max(fwidth(ha), 1e-3);
  float hr = length(vec2(hp.x, hp.y / hs)) / R, hrw = max(fwidth(hr), 1e-4), hl = 1.49 + 0.055 * step(abs(fract(ha / 6. + 0.4167) - 0.5), 0.0834);
  float tick = (1. - smoothstep(0.1 - hfw, 0.1 + hfw, abs(fract(ha) - 0.5))) * (1. - smoothstep(hl - hrw, hl + hrw, hr));
  lay(c, mix(uSienna, uChalk, 0.3), v * hb * 0.86);
  lay(c, uUmber, v * hb * tick * (1. - smoothstep(0.35, 0.8, hfw)));
  lay(c, uUmber, v * hb * max(lineA(abs(e1 + 0.004), 0.0042, fw), lineA(abs(e2 - 0.004), 0.0036, fw)));
  lay(c, uChalk, v * (1. - disc * fillA(-hp.y, fw)) * lineA(abs(e1 - 0.0075), 0.0026, fw));
  lay(c, uSienna, v * disc * 0.3);
  lay(c, uSienna, v * disc * 0.42 * (1. - fillA(length(q - R * vec2(-0.2, 0.22)) - R * 0.97, fw)));
  float st = min(sdSeg(q, vec2(0., -R), vec2(0., -R * 1.13)) - 0.0065, sdSeg(q, vec2(-R * 0.24, -R * 1.16), vec2(R * 0.24, -R * 1.16)) - 0.005);
  lay(c, uUmber, v * fillA(st, fw));
  lay(c, uChalk, v * lineA(sdSeg(q, vec2(-R * 0.2, -R * 1.135), vec2(R * 0.2, -R * 1.135)), 0.0022, fw));
  float ce = cos(uArm.y), se = sin(uArm.y);
  ringP(c, p.yx * vec2(1., -1.), R * 0.985, 0.42, 1., fw, v);                       // colure
  ringP(c, vec2(ce * p.x + se * p.y, -se * p.x + ce * p.y), R * 0.985, sq * 0.8, 1., fw, v);   // ecliptic
  ringP(c, p - vec2(0., 0.43 * R), R * 0.9, sq, 1., fw, v);                          // tropics
  ringP(c, p + vec2(0., 0.43 * R), R * 0.9, sq, 1., fw, v);
  ringP(c, p, R * 0.985, sq, 1., fw, v);                                             // equator
  ringP(c, q, R, 1., 0., fw, v);                                                     // meridian
  lay(c, uUmber, v * lineA(sdSeg(p, vec2(0., -1.1 * R), vec2(0., 1.1 * R)), 0.004, fw));
  for (int i = 0; i < 2; i++) {
    vec2 e = p - vec2(0., (i == 0 ? 1.1 : -1.1) * R);
    lay(c, uSienna, v * fillA(length(e) - 0.0105, fw)); lay(c, uUmber, v * lineA(abs(length(e) - 0.0105), 0.002, fw));
  }
  float gr = R * 0.2;
  lay(c, uSienna, v * fillA(l - gr, fw));
  lay(c, uUmber, v * fillA(l - gr, fw) * (1. - fillA(length(q - gr * vec2(-0.22, 0.24)) - gr * 0.93, fw)));
  lay(c, uChalk, v * fillA(length(q - gr * vec2(-0.36, 0.36)) - gr * 0.22, fw));
  lay(c, uUmber, v * lineA(abs(l - gr), 0.0026, fw));
  return v * max(disc, hb * 0.7);
}

// picture 2: the loggia, opaque and unframed. uLog = its rectangle (left, right, bottom, top); uLog2 = (arch pitch,
// threshold line, springing line). g = floor coordinates in metres from the eye's foot point (perspective division
// by the eye's height above the floor), gF = fwidth(g). Below the threshold lies a wind-rose pavement, true on the
// real floor; above it four arches, through them a chequer running to the horizon, sea, sky and cloud bands.
float loggiaP(inout vec3 c, vec2 q, vec2 g, vec2 gF, float fw, float v) {
  float W = uLog2.x, yb = uLog2.y, ys = uLog2.z, pw = 0.03, ow = W * 0.5 - pw, top = ys + ow;
  float rg = (fbm(q * vec2(38., 90.) + uSeed.xy) - 0.5) * 0.02;
  float mask = v * fillA(uLog.x - q.x, fw) * fillA(q.x - uLog.y + rg, fw) * fillA(q.y - uLog.w, fw) * fillA(uLog.z - q.y, fw);
  float gw = max(gF.x, gF.y);
  // far pavement: a chequer of uChk metre squares, eased to its mean where a square falls under a pixel
  vec2 gc = g / uChk;
  float sx = clamp((abs(fract(gc.x * 0.5) - 0.5) - 0.25) / max(gF.x / uChk * 0.5, 1e-4), -0.5, 0.5) * 2.;
  float sy = clamp((abs(fract(gc.y * 0.5) - 0.5) - 0.25) / max(gF.y / uChk * 0.5, 1e-4), -0.5, 0.5) * 2.;
  float chk = mix(0.5 + 0.5 * sx * sy, 0.5, smoothstep(0.45, 1.3, gw / uChk));
  vec3 pave = mix(uUmber, uChalk, chk);
  // near pavement: a wind rose of rings and wedges about a point on the floor
  vec2 rp = g - uRose.xy; float rr = length(rp), ra = atan(rp.y, rp.x + (rr < 1e-4 ? 1. : 0.));
  float wa = ra * uRose.z / 6.2831853, wf = max(gw / max(rr, 1.) * uRose.z / 6.2831853, 1e-4);
  float w1 = clamp((abs(fract(wa) - 0.5) - 0.25) / wf, -0.5, 0.5) + 0.5;                    // wedges
  float w2 = clamp((abs(fract(wa * 2. + 0.25) - 0.5) - 0.25) / (wf * 2.), -0.5, 0.5) + 0.5;  // finer wedges, turned
  float pt = fillA(abs(fract(wa) - 0.5) * 2. - (1. - (rr - 6.) / 26.), max(wf * 2., 0.02));  // star points that taper outward
  vec3 rose = mix(uSienna, uChalk, pt);
  rose = mix(rose, uUmber, fillA(abs(rr - 6.) - 0.9, gw));
  rose = mix(rose, mix(uUmber, uChalk, w1), fillA(rr - 5.1, gw));
  rose = mix(rose, uUmber, fillA(abs(rr - 33.) - 1.1, gw));
  vec3 outer = mix(mix(uChalk, uSienna, w2), mix(uSienna, uChalk, 0.5), smoothstep(0.5, 1.5, wf * 2.));
  rose = mix(outer, rose, fillA(rr - 31.9, gw));
  rose = mix(rose, uChalk, fillA(abs(rr - 44.) - 0.7, gw));
  rose = mix(rose, uUmber, fillA(abs(rr - 46.2) - 1.5, gw));
  rose = mix(pave, rose, fillA(rr - 47.7, gw));
  float xc = mod(q.x - uLog.x, W) - W * 0.5, px = W * 0.5 - abs(xc), pc = xc - (xc < 0. ? -1. : 1.) * W * 0.5;
  float ar = length(vec2(xc, max(q.y - ys, 0.)));
  float below = fillA(q.y - yb, fw), low = fillA(q.y - ys, fw), gnd = fillA(q.y, fw);
  float open = fillA(ar - ow, fw) * (1. - below);
  // sky: slate blue, a paler band of sea on the horizon, chalk cloud bands
  vec3 sky = mix(uBlue, mix(uBlue, uChalk, 0.42), fillA(q.y - 0.022 - 0.006 * sin(q.x * 23. + uSeed.y), fw));
  float cb = abs(q.y - 0.075 - 0.014 * sin(q.x * 17. + uSeed.x * 6.)) - 0.009 * (0.55 + 0.45 * sin(q.x * 37. + 1.3));
  cb = min(cb, abs(q.y - 0.17 - 0.01 * sin(q.x * 11. + uSeed.z)) - 0.006 * (0.5 + 0.5 * sin(q.x * 29. + 4.)));
  cb = min(cb, abs(q.y - 0.355 - 0.02 * sin(q.x * 7. + uSeed.w)) - 0.014 * (0.45 + 0.55 * sin(q.x * 19. + 2.)));
  cb = min(cb, abs(q.y - 0.43 - 0.012 * sin(q.x * 9. + 1.)) - 0.008 * (0.5 + 0.5 * sin(q.x * 23.)));
  sky = mix(sky, uChalk, fillA(cb, fw));
  sky = mix(sky, uChalk, lineA(abs(q.y - 0.003), 0.0028, fw));
  vec3 inside = mix(sky, pave, gnd);
  float jamb = 1. - fillA(ar - (ow - 0.013), fw);                      // the arch's own thickness, one side in shade
  inside = mix(inside, mix(mix(uSienna, uChalk, 0.35), uUmber, fillA(-xc, fw)), jamb);
  // the wall: piers in sienna with an umber shade side, pale spandrels, chalk mouldings, an attic, then open sky
  vec3 wall = mix(mix(uSienna, uChalk, 0.5), uSienna, low);
  wall = mix(wall, uUmber, low * fillA(pc + pw * 0.15, fw));
  wall = mix(wall, uUmber, low * fillA(abs(q.y - (yb + 0.009)) - 0.009, fw));
  float mo = max(low * fillA(abs(q.y - (yb + 0.022)) - 0.0035, fw), fillA(abs(q.y - ys) - 0.006, fw));
  mo = max(mo, (1. - low) * lineA(abs(ar - (ow + 0.01)), 0.0052, fw));
  mo = max(mo, max(fillA(abs(q.y - (top + 0.018)) - 0.0048, fw), fillA(abs(q.y - (top + 0.046)) - 0.0045, fw)));
  float um = max((1. - low) * lineA(abs(ar - (ow + 0.019)), 0.002, fw), max(fillA(abs(q.y - (top + 0.0105)) - 0.0026, fw), fillA(abs(q.y - (ys - 0.0085)) - 0.0022, fw)));
  um = max(um, (1. - low) * fillA(max(abs(xc) - 0.011, abs(q.y - (top + 0.004)) - 0.014), fw));          // keystones
  um = max(um, fillA(abs(q.y - (top + 0.053)) - 0.0025, fw));
  wall = mix(wall, uSienna, fillA(top + 0.024 - q.y, fw) * (1. - mo));
  wall = mix(wall, uChalk, mo);
  wall = mix(wall, uUmber, um * (1. - mo));
  float roof = fillA(top + 0.0555 - q.y, fw);                           // above the cornice
  vec3 pic = mix(mix(wall, sky, roof), inside, open);
  pic = mix(pic, rose, below);
  pic = mix(pic, uChalk, fillA(abs(q.y - (yb - 0.0035)) - 0.0035, fw));   // the threshold
  lay(c, pic, mask);
  return mask * max(max(open * (1. - gnd), roof) * 0.8, max(below, open * gnd) * 0.5);
}

// one leaf of the wreath in cell coordinates p = (along the ring, outward)
void leafP(inout vec3 c, vec2 p, vec2 ctr, float ang, float a, float b, vec3 top, vec3 bot, float fw, float v) {
  vec2 d = p - ctr; float cs = cos(ang), sn = sin(ang);
  vec2 u = vec2(cs * d.x + sn * d.y, -sn * d.x + cs * d.y);
  float t = u.x / a, sd = abs(u.y) - b * (1. - t * t);
  lay(c, mix(bot, top, fillA(-u.y, fw)), v * fillA(sd, fw));
  lay(c, uUmber, v * 0.9 * max(lineA(abs(u.y), 0.0011, fw) * (1. - smoothstep(0.78, 0.86, abs(t))), lineA(abs(sd), 0.0009, fw)));
}
void cellP(inout vec3 c, vec2 q, float idx, float R, float fw, float v) {
  v *= mix(uLeafNear, 1., step(0.64, h21(vec2(mod(idx, uCells), 1.3) + uSeed.zw)));
  float N = uCells, ac = (idx + 0.5) * 6.2831853 / N, L = 6.2831853 * R / N;
  vec2 er = vec2(cos(ac), sin(ac)), et = vec2(-er.y, er.x);
  float dir = er.x < 0. ? -1. : 1.;
  vec2 p = vec2(dot(q, et) * dir, dot(q, er) - R);
  float h = h21(vec2(mod(idx, N), 3.7) + uSeed.xy), k = mod(idx, 2.);
  lay(c, uUmber, v * fillA(length(p - vec2(-0.5 * L, 0.004 * (h - 0.5))) - 0.0034, fw));
  leafP(c, p, vec2(0.12 * L, -0.0105), -0.40 + 0.16 * (h - 0.5), 0.98 * L, 0.0086, mix(uSienna, uChalk, k), mix(uUmber, uSienna, k), fw, v);
  leafP(c, p, vec2(0.12 * L, 0.0105), 0.40 - 0.16 * (h - 0.5), 0.98 * L, 0.0086, mix(uChalk, uSienna, k), mix(uSienna, uUmber, k), fw, v);
}
// picture 3: laurel wreath round the portal
float wreathP(inout vec3 c, vec2 q, float fw, float v) {
  float R = uWr, l = length(q);
  float band = fillA(abs(l - R) - 0.027, fw);
  if (l < 1e-4) return 0.;
  lay(c, uSienna, v * band * 0.16);
  lay(c, uUmber, v * lineA(abs(l - R), 0.0015, fw));
  float f = floor(atan(q.y, q.x) * uCells / 6.2831853);
  cellP(c, q, f - 1., R, fw, v); cellP(c, q, f + 1., R, fw, v); cellP(c, q, f, R, fw, v);
  return v * band;
}

// the glory: straight and flaming rays standing out from the wreath, and two ribbons flying from it (cast from V3 like the wreath)
float gloryP(inout vec3 c, vec2 q, float fw, float v) {
  float l = length(q); if (l < 0.27) return 0.;
  float N = 32., a = atan(q.y, q.x) * N / 6.2831853, id = floor(a), f = fract(a) - 0.5, k = mod(id, 2.);
  float r0 = uWr + 0.05, r1 = mix(0.66, 0.5, k) + 0.04 * (h21(vec2(id, 5.) + uSeed.xy) - 0.5);
  float tt = clamp((l - r0) / (r1 - r0), 0., 1.), wob = k * 0.07 * sin(tt * 11. + id) * tt;
  float hw = mix(0.22, 0.15, k) * (1. - tt * 0.92), af = max(fw * N / (6.2831853 * l), 1e-4), d = abs(f - wob) - hw;
  float ray = fillA(d, af) * step(r0, l) * (1. - smoothstep(r1 - fw, r1, l)), wash = 0.;
  lay(c, mix(mix(uSienna, uChalk, 0.25 + 0.4 * k), uChalk, fillA(f - wob, af)), v * ray);
  lay(c, mix(uUmber, uSienna, 0.35), v * step(r0, l) * (1. - smoothstep(r1 - fw, r1, l)) * lineA(abs(d) * 6.2831853 * l / N, 0.0014, fw) * (1. - smoothstep(0.92, 1., tt)));
  wash = ray;
  for (int i = 0; i < 2; i++) {      // ribbons: one east and low, one west and high
    float sg = i == 0 ? 1. : -1., x = sg * q.x - 0.27;
    float yc = (i == 0 ? -0.2 : 0.2) + 0.085 * sin(x * 9. + uSeed.x + float(i) * 2.) + 0.16 * x, sl = 0.085 * 9. * cos(x * 9. + uSeed.x + float(i) * 2.) + 0.16;
    float rd = abs(q.y - yc) / sqrt(1. + sl * sl) - 0.02 * (1. - smoothstep(0.42, 0.6, x));
    float on = fillA(rd, fw) * smoothstep(0., 0.02, x);
    lay(c, mix(uBlue, mix(uChalk, uBlue, 0.25), step(0., sl * sg)), v * on);
    lay(c, uUmber, v * smoothstep(0., 0.02, x) * lineA(abs(rd), 0.002, fw));
    wash = max(wash, on);
  }
  return v * wash * 0.6;
}

// the glory's overspill: long rays and a ribbon falling from the porch down the court's north and west walls and over the
// landing behind the fountain wall, cast from the point where the flight comes out over the court (u 0.77); a region test,
// like the doorcase. On the north wall they fan from a point above its parapet, under the porch.
float fanP(inout vec3 c, vec2 q, float fw, float v) {
  float l = length(q); if (l < 0.1 || l > 1.12 || v <= 0.) return 0.;
  float ang = atan(q.y, q.x), N = 32., a = ang * N / 6.2831853, id = floor(a), f = fract(a) - 0.5, k = mod(id, 2.);
  float r1 = mix(1.04, 0.74, k) + 0.1 * (h21(vec2(id, 9.) + uSeed.zw) - 0.5);
  float tt = clamp((l - 0.1) / (r1 - 0.1), 0., 1.), wob = k * 0.11 * sin(tt * 17. + id);
  float hw = mix(0.24, 0.18, k) * (1. - 0.5 * tt), af = max(fw * N / (6.2831853 * l), 1e-4), d = abs(f - wob) - hw;
  float end = 1. - smoothstep(r1 - 0.03, r1, l), ray = fillA(d, af) * end;
  lay(c, mix(mix(uSienna, uChalk, 0.15 + 0.5 * k), uChalk, fillA(f - wob, af)), v * ray);
  lay(c, mix(uUmber, uSienna, 0.3), v * end * lineA(abs(d) * 6.2831853 * l / N, 0.0022, fw));
  float wv = ang * 7. + uSeed.x, rr = 0.34 + 0.045 * sin(wv), rd = abs(l - rr) / sqrt(1. + 0.1 * cos(wv) * cos(wv)) - 0.021;
  float on = fillA(rd, fw);
  lay(c, mix(uBlue, mix(uChalk, uBlue, 0.25), step(0., cos(wv))), v * on);
  lay(c, uUmber, v * lineA(abs(rd), 0.002, fw));
  return v * max(ray, on) * 0.6;
}

// picture 0: an astrolabe in the mouth of the cellar, whole only from the entry point, drawn BOLD in broad fields of the
// look's own paints: a limb of sienna and chalk with degree ticks and a blue quarter in every other house; a blue sea with a
// pale wave line between the limb and an eccentric zodiac ring of twelve houses, alternately chalk and sienna; almucantar
// arcs on the bare ground inside that ring; eight star pointers standing in from the limb, the two on the upright long (they
// run far down the vault and the floor); and at its heart the mater's plate. Nothing lettered.
// It is worked out as a LAYER OF ITS OWN (c.rgb the paint, c.a how much of the surface still shows through it), which main
// lays by THE RULE OF THE SURFACE: inside the cellar the painter paints plaster and tile and leaves dressed stone alone
// (see where main calls it); everywhere else the layer goes straight onto whatever it meets.
void lay(inout vec4 c, vec3 p, float a) { a = clamp(a, 0., 1.); c = vec4(mix(c.rgb, p, a), c.a * (1. - a)); }
float astroP(inout vec4 c, vec2 q, float fw, float v) {
  float R = 0.33; vec2 p = q - vec2(0., -0.015); float l = length(p);
  if (l > R + 0.02) return 0.;
  float hole = fillA(l - 0.118, fw), wash = 0.;
  float a = atan(p.y, p.x + (l < 1e-5 ? 1e-3 : 0.)) * 57.29578, afw = max(fw * 57.29578 / max(l, 0.02), 1e-3);
  // the sea between the zodiac ring and the limb
  vec2 pe = p - vec2(0.05 * R, 0.2 * R); float le = length(pe), ecl = le - 0.6 * R;
  float limb = fillA(abs(l - 0.93 * R) - 0.07 * R, fw), inner = fillA(l - 0.86 * R, fw);
  lay(c, uBlue, v * inner * (1. - fillA(ecl, fw)) * (1. - hole) * 0.92);
  lay(c, mix(uBlue, uChalk, 0.75), v * inner * (1. - hole) * fillA(abs(p.y + 0.05 * R - 0.03 * sin(p.x * 40. + uSeed.x)) - 0.012, fw) * (1. - fillA(ecl, fw)));
  // almucantars: nested arcs about a low centre, in umber on the bare plaster inside the zodiac ring
  vec2 pa = p + vec2(0., 0.3 * R);
  for (int i = 0; i < 3; i++) { float ra = (0.3 + 0.2 * float(i)) * R; lay(c, mix(uUmber, uSienna, 0.3), v * inner * (1. - hole) * fillA(ecl, fw) * lineA(abs(length(pa) - ra), 0.0034, fw)); }
  // zodiac ring: an opaque band, twelve houses alternately chalk and sienna
  float eb = fillA(abs(ecl) - 0.055 * R, fw), ea = atan(pe.y, pe.x + (le < 1e-5 ? 1e-3 : 0.)) * 57.29578, ef = max(fw * 57.29578 / max(le, 0.02), 1e-3);
  float house = clamp((abs(fract(ea / 60.) - 0.5) - 0.25) * 60. / ef, -0.5, 0.5) + 0.5;
  lay(c, mix(uSienna, uChalk, house), v * eb * (1. - hole));
  lay(c, uUmber, v * (1. - hole) * lineA(abs(abs(ecl) - 0.055 * R), 0.0022, fw));
  // limb: sienna and chalk, degree ticks, a blue quarter in every other house
  float tick = 1. - smoothstep(0.9 - afw, 0.9 + afw, abs(fract(a / 5.) - 0.5) * 5.), seg = clamp((abs(fract(a / 60. + 0.25) - 0.5) - 0.25) * 60. / afw, -0.5, 0.5) + 0.5;
  lay(c, mix(mix(uSienna, uChalk, 0.45), uBlue, seg * fillA(0.93 * R - l, fw)), v * limb);
  lay(c, uUmber, v * limb * tick * fillA(l - 0.93 * R, fw) * (1. - smoothstep(0.5, 1.2, afw)));
  lay(c, uUmber, v * max(lineA(abs(l - R), 0.003, fw), max(lineA(abs(l - 0.86 * R), 0.0026, fw), lineA(abs(l - 0.93 * R), 0.0016, fw))));
  lay(c, uChalk, v * lineA(abs(l - 1.03 * R), 0.0022, fw));
  // star pointers standing in from the limb; the two on the upright run on to the middle
  float sa = fract(a / 45. + 0.5) - 0.5, up = step(abs(abs(a) - 90.), 22.5), len = mix(0.42, 0.8, up) * R;
  float st = clamp((0.86 * R - l) / len, 0., 1.), sd = abs(sa) * 45. - mix(5.5, 4., up) * (1. - st) * (0.86 * R) / max(l, 0.03);
  float star = fillA(sd, afw) * fillA(l - 0.86 * R, fw) * step(l, 0.86 * R) * (1. - smoothstep(0.985, 1., st));
  lay(c, mix(uSienna, uChalk, fillA(sa * 45., afw)), v * star);
  lay(c, uUmber, v * fillA(l - 0.86 * R, fw) * (1. - smoothstep(0.96, 1., st)) * lineA(abs(sd) * l / 57.29578, 0.002, fw));
  wash = max(max(limb, eb * (1. - hole)), max(star, inner * (1. - fillA(ecl, fw)) * (1. - hole)));
  // the mater's plate inside the rete: broad rings that fall on the last bays of the cellar (their floor and vaults; main
  // keeps them off the piers and the end arch, which are stone) and, at its heart, on stair A: a scale ring, a blue ring of star points, a compass ring, a quartered boss
  // and the pin; over all of it the rule, a long bar from limb to limb
  if (l < 0.3) {
    float a12 = clamp((abs(fract(a / 30. + 0.25) - 0.5) - 0.25) * 30. / afw, -0.5, 0.5) + 0.5;
    float a16 = clamp((abs(fract(a / 45.) - 0.5) - 0.25) * 45. / afw, -0.5, 0.5) + 0.5;
    float a8 = clamp((abs(fract(a / 90.) - 0.5) - 0.25) * 90. / afw, -0.5, 0.5) + 0.5;
    vec3 pc = mix(mix(uSienna, uChalk, 0.5), uChalk, a12);                                   // scale ring
    float z2 = fillA(l - 0.09, fw), z1 = fillA(l - 0.058, fw), z0 = fillA(l - 0.04, fw);
    float pa2 = fract(a / 45.) - 0.5, tp = clamp((l - 0.058) / 0.03, 0., 1.);
    float pt = fillA(abs(pa2) * 45. - 10.5 * (1. - tp), afw) * (1. - smoothstep(0.93, 1., tp));
    pc = mix(pc, mix(uBlue, mix(uChalk, uSienna, fillA(pa2 * 45., afw)), pt), z2);            // blue ring, eight star points
    pc = mix(pc, mix(uSienna, uChalk, a16), z1);                                              // compass ring
    pc = mix(pc, mix(mix(uSienna, uUmber, 0.22), mix(uChalk, uSienna, 0.1), a8), z0);         // quartered boss
    float rims = max(max(lineA(abs(l - 0.118), 0.0024, fw), lineA(abs(l - 0.09), 0.002, fw)), max(lineA(abs(l - 0.058), 0.002, fw), lineA(abs(l - 0.04), 0.0024, fw)));
    pc = mix(pc, uUmber, rims);
    pc = mix(pc, uChalk, max(lineA(abs(l - 0.1125), 0.0016, fw), lineA(abs(l - 0.0455), 0.0014, fw)) * (1. - rims));
    lay(c, pc, v * hole);
    // the rule
    vec2 re = vec2(0.8829, 0.4695); float ru = dot(p, re), rv = abs(dot(p, vec2(-re.y, re.x)));
    float rw = 0.0105 * (1. - smoothstep(0.2, 0.283, abs(ru))), rule = fillA(rv - rw, fw) * step(abs(ru), 0.283);
    lay(c, mix(uChalk, mix(uSienna, uChalk, 0.25), fillA(dot(p, vec2(-re.y, re.x)), fw)), v * rule);
    lay(c, uUmber, v * step(abs(ru), 0.283) * max(lineA(abs(rv - rw), 0.0017, fw), lineA(rv, 0.0011, fw) * step(0.03, abs(ru))));
    // the pin
    lay(c, mix(uSienna, uChalk, 0.3), v * fillA(l - 0.0135, fw)); lay(c, uSienna, v * fillA(l - 0.0135, fw) * (1. - fillA(length(p - vec2(-0.003, 0.0032)) - 0.0125, fw)));
    lay(c, uUmber, v * max(lineA(abs(l - 0.0135), 0.002, fw), fillA(l - 0.0036, fw)));
    wash = max(wash, max(hole, rule));
  }
  return v * wash * 0.7;
}
// the doorcase: columns on pedestals, an entablature with a blue frieze and a pediment round the door at the head of
// stair B, cast from the stair's foot; its pedestals and steps run down the treads and along the parapets as long stripes
float doorP(inout vec3 c, vec2 q, float fw, float v) {
  float sx = q.x + 0.0125; vec2 p = vec2(abs(sx), q.y);
  if (p.x > 0.56 || p.y > 0.8) return 0.;
  float u = (p.x - 0.375) / 0.045 * (sx < 0. ? -1. : 1.), w = 0.;
  float shaft = fillA(abs(p.x - 0.375) - 0.045, fw) * fillA(p.y - 0.47, fw);
  vec3 sc = mix(mix(mix(uSienna, uChalk, 0.55), uSienna, fillA(-0.35 - u, fw * 22.)), uUmber, fillA(0.42 - u, fw * 22.));
  sc = mix(sc, mix(uSienna, uChalk, 0.3), fillA(p.y + 0.125, fw) * 0.6);                       // the pedestal and its long run below
  lay(c, sc, v * shaft); w = shaft;
  float blocks = fillA(abs(p.x - 0.375) - 0.058, fw) * max(fillA(abs(p.y + 0.105) - 0.02, fw), fillA(abs(p.y - 0.485) - 0.02, fw));
  lay(c, uChalk, v * blocks); lay(c, uUmber, v * fillA(abs(p.x - 0.375) - 0.058, fw) * max(lineA(abs(p.y + 0.125), 0.003, fw), lineA(abs(p.y - 0.465), 0.003, fw)));
  float ent = fillA(p.x - 0.47, fw) * fillA(abs(p.y - 0.553) - 0.048, fw);
  vec3 ec = mix(uChalk, uBlue, fillA(abs(p.y - 0.555) - 0.022, fw)); ec = mix(ec, uSienna, fillA(0.578 - p.y, fw));
  lay(c, ec, v * ent); lay(c, uUmber, v * fillA(p.x - 0.47, fw) * max(lineA(abs(p.y - 0.505), 0.0028, fw), lineA(abs(p.y - 0.601), 0.0028, fw)));
  float ped = 0.601 + 0.3 * (0.5 - p.x), tri = fillA(p.y - ped, fw) * fillA(0.601 - p.y, fw) * fillA(p.x - 0.5, fw);
  float rim = 1. - fillA(p.y - ped + 0.028, fw) * fillA(0.625 - p.y, fw);
  lay(c, mix(uBlue, mix(uSienna, uChalk, 0.35), rim), v * tri); lay(c, uUmber, v * fillA(p.x - 0.5, fw) * fillA(0.601 - p.y, fw) * lineA(abs(p.y - ped) * 0.958, 0.003, fw));
  lay(c, uChalk, v * tri * fillA(length(vec2(sx, q.y - 0.668)) - 0.034, fw)); lay(c, uUmber, v * lineA(abs(length(vec2(sx, q.y - 0.668)) - 0.034), 0.0022, fw));
  float pod = fillA(p.x - 0.31, fw) * fillA(abs(p.y + 0.168) - 0.034, fw);
  lay(c, mix(uSienna, uChalk, fillA(-0.15 - p.y, fw)), v * pod); lay(c, uUmber, v * fillA(p.x - 0.31, fw) * lineA(abs(p.y + 0.2), 0.0028, fw));
  return v * max(max(w, ent), max(tri, pod)) * 0.6;
}

// tiny true pictures painted flat on the surface: ship, tower, tree, harbour mole (one per 5 m cell)
float vignette(vec2 s, float fs) {
  vec2 g = s / 3.6, id = floor(g); vec2 jt = h22(id + uSeed.zw);
  vec2 p = ((fract(g) - 0.5) * 3.6 - (jt - 0.5) * 0.9) * 1.25; fs *= 1.25;
  float sc = mix(0.55, 1.2, h21(id + 9.1 + uSeed.xy)), ra = (h21(id + 3.3 + uSeed.yx) - 0.5) * 1.1, cr = cos(ra), sr = sin(ra);
  p = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y) / sc; fs /= sc;      // each its own size and tilt
  float k = floor(fract(jt.x * 13.7 + jt.y * 7.3 + id.x * 0.37 + id.y * 0.61) * 6.), d = 1e3;
  if (k < 0.5) {            // ship under sail
    d = max(abs(p.x) - (1.15 + (p.y + 0.5) * 0.7), abs(p.y + 0.72) - 0.2);
    d = min(d, max(abs(p.x) - 0.05, abs(p.y - 0.3) - 0.85));
    d = min(d, max(max(p.x + 0.12, -0.38 - p.y), (p.y + 0.38) - (p.x + 0.95) * 1.6) * 0.6);
    d = min(d, max(max(0.12 - p.x, -0.38 - p.y), (p.y + 0.38) - (0.85 - p.x) * 1.96) * 0.5);
    d = min(d, sdSeg(p, vec2(0.05, 1.12), vec2(0.5, 1.02)) - 0.05);
  } else if (k < 1.5) {     // tower
    d = max(abs(p.x) - 0.42, abs(p.y + 0.2) - 0.75);
    d = min(d, max(abs(p.x) - 0.56, abs(p.y - 0.62) - 0.08));
    d = min(d, max(max(abs(p.x) - 0.56, abs(p.y - 0.82) - 0.13), 0.22 - abs(fract(p.x * 2.6 + 0.5) - 0.5)));
    d = max(d, -max(abs(p.x) - 0.1, abs(p.y - 0.1) - 0.18));
  } else if (k < 2.5) {     // tree
    d = max(abs(p.x) - 0.08, abs(p.y + 0.5) - 0.48);
    d = min(d, min(length(p - vec2(0., 0.42)) - 0.52, min(length(p - vec2(-0.42, 0.05)) - 0.36, length(p - vec2(0.42, 0.08)) - 0.36)));
  } else if (k < 3.5) {     // harbour mole with its beacon
    d = max(abs(p.x + 0.2) - 1.25, abs(p.y + 0.78) - 0.16);
    d = min(d, max(abs(p.x - 0.85) - 0.14, abs(p.y + 0.2) - 0.45));
    d = min(d, length(p - vec2(0.85, 0.42)) - 0.15);
    d = min(d, abs(p.y + 1.15 - 0.05 * sin(p.x * 7.)) - 0.035 + max(abs(p.x) - 1.3, 0.));
  } else if (k < 4.5) {     // wind star of eight points
    float r = length(p), a = atan(p.y, p.x + (r < 1e-4 ? 1e-3 : 0.));
    d = (r - 0.3 - 0.75 * pow(abs(cos(a * 4.)), 7.) * (0.6 + 0.4 * step(0.5, abs(cos(a * 2.))))) * 0.5;
    d = max(d, 0.1 - r);
  } else {                   // bridge of three arches over a line of water
    d = max(abs(p.x) - 1.35, abs(p.y + 0.25) - 0.5);
    d = max(d, -(length(vec2(mod(p.x + 1.35, 0.9) - 0.45, p.y + 0.75)) - 0.33));
    d = min(d, abs(p.y + 0.95 - 0.04 * sin(p.x * 8.)) - 0.03 + max(abs(p.x) - 1.5, 0.));
  }
  float sea = abs(p.y + 1.02 - 0.04 * sin(p.x * 6. + id.x)) - 0.03 + max(abs(p.x) - 1.5, 0.);
  if (k < 0.5) d = min(d, sea);
  return fillA(d, fs);
}
`;

const FRAG_MAIN = /* glsl */`
uniform float uWet, uMirOff, uCloud; uniform vec3 uSky, uShade;
void main() {
  // picture coordinates and every derivative first
  vec3 d0 = vP - uV[0], d1 = vP - uV[1], d2 = vP - mix(uV[2], uVm, uMir);
  float t0 = dot(d0, uAx[0]), t1 = dot(d1, uAx[1]), t2 = dot(d2, uAx[2]);
  vec2 q0 = vec2(dot(d0, uRt[0]), dot(d0, uUp[0])) / max(t0, 1e-4);
  vec2 q1 = vec2(dot(d1, uRt[1]), dot(d1, uUp[1])) / max(t1, 1e-4);
  vec2 q2 = vec2(dot(d2, uRt[2]), dot(d2, uUp[2])) / max(t2, 1e-4);
  q2.y -= uMir * uMirOff;
  // the second wreath trembles with the water: its picture is pushed about by the slope of the ripples at the place where
  // the line of sight meets the water, so the ripples are seen to cross it (0.013: a ripple at its steepest moves a leaf of
  // the wreath by about a quarter of the wreath band's width)
  if (uMir > 0.5) {
    vec3 rdm = vL - uEye; vec2 hm = uEye.xz + rdm.xz * ((uWater - uEye.y) / min(rdm.y, -1e-4));
    q2 += 0.013 * ripSlope(clamp(hm, vec2(-400.), vec2(400.)), uTime);
  }
  float f0 = clamp(length(fwidth(q0)) * 0.75, 1e-5, 1.), f1 = clamp(length(fwidth(q1)) * 0.75, 1e-5, 1.), f2 = clamp(length(fwidth(q2)) * 0.75, 1e-5, 1.);
  vec2 q5d = (vP.xy - vec2(24.5, 23.)) / max(vP.z + 166., 1e-4); float f5 = clamp(length(fwidth(q5d)) * 0.75, 1e-5, 1.);
  vec3 d3 = vP - uV0; float t3 = -d3.z; vec2 q3 = d3.xy / max(t3, 1e-4); float f3 = clamp(length(fwidth(q3)) * 0.75, 1e-5, 1.);
  vec2 g = vec2(q1.x, 1.) / max(-q1.y, 1e-3) * uEyeH; vec2 gF = fwidth(g);
  vec3 d6 = vP - uV6; float t6 = dot(d6, uAx6); vec2 q6 = vec2(dot(d6, uRt6), dot(d6, uUp6)) / max(t6, 1e-4); float f6 = clamp(length(fwidth(q6)) * 0.75, 1e-5, 1.);
  vec3 an = abs(vN);
  vec2 s = an.y > 0.7 ? vP.xz : (an.x > an.z ? vP.zy : vP.xy);
  float fs = clamp(max(fwidth(s).x, fwidth(s).y), 1e-4, 4.), fv = clamp(max(fwidth(vP.x), fwidth(vP.z)), 1e-4, 4.);
  if (uMir > 0.5) {          // the copy under the water: only what is seen through the water rectangle
    vec3 rd = vL - uEye;
    if (vP.y < uWater + 0.05 || uEye.y < uWater + 0.1) discard;
    float k = (uWater - uEye.y) / min(rd.y, -1e-4);
    vec2 h = uEye.xz + rd.xz * k;
    if (h.x < uBasin.x || h.x > uBasin.y || h.y < uBasin.z || h.y > uBasin.w) discard;
  }
  float m = floor(vD.x + 0.5);
  // the open west bay: its wall, floor edge to parapet, and the arcade's piers and arches, fading out through the arcade's
  // thickness to nothing on the gallery's face; the roof stair and its parapets, which stand in the bay, are left as they were
  float bay = step(${(BAY.x0 - 0.4).toFixed(1)}, vP.x) * (1. - smoothstep(${ARC.xa.toFixed(1)}, ${ARC.xb.toFixed(1)}, vP.x)) * step(${(BAY.z0 - 0.6).toFixed(1)}, vP.z) * step(vP.z, ${(BAY.z1 + 0.6).toFixed(1)}) * step(${(BAY.y0 - 0.1).toFixed(1)}, vP.y) * step(vP.y, ${(BAY.y1 + 0.1).toFixed(1)}) * (1. - uMir)
    * (1. - step(${(RSTAIR.x0 - 0.1).toFixed(1)}, vP.x) * step(vP.x, ${(RSTAIR.x1 + 0.1).toFixed(1)}) * step(${(RSTAIR.z0 + 0.3).toFixed(1)}, vP.z) * step(vP.z, ${(RSTAIR.z1 + 0.1).toFixed(1)}));
  vec3 col = ground(m, s, fs, an.y, bay);
  // THE CELLAR BY PLACE (z 4.4 .. -124, below y 17.2; it fades out through the thickness of its two end arches, so the south
  // front and the court's side of the end arch are as they were). Three materials told apart at a glance: lime plaster with
  // a broad figure on the vault webs, travertine a little darker and cooler than the plaster with its courses drawn, tiles
  // with their joints and each tile's own tone. pA and pB say how plaster and tile figure a paint laid on them (a paint p
  // shows as p * pA + pB): the same strips, hair joints, tile tones and tile joints as on the bare surface.
  float cel = (1. - smoothstep(1.5, 4.4, vP.z)) * smoothstep(-126.4, -122., vP.z) * step(vP.y, 17.2) * (1. - uMir);
  float pA = 1.; vec3 pB = vec3(0.);
  if (cel > 0.) {
    if (m < 0.5) {
      vec2 sv = vN.y < -0.05 ? vP.xz : s;
      float fg = fbm(sv * 0.045 + uSeed.zw) - 0.5, sk = vn(vec2(sv.x * 0.55 + 3., sv.y * 0.06) + uSeed.xy) - 0.5;
      pA = 1. + cel * (0.2 * fg + 0.1 * sk); col *= pA;
      if (vN.y < -0.05) {   // the vault was floated in strips along the barrel, a day's work at a time: each strip its own tone, a hair joint between
        float bx = vP.x / 4.4 + 0.3, bi = floor(bx), bz = vP.z / 7.75 + h21(vec2(bi, 5.1));
        float jd = min(min(fract(bx), 1. - fract(bx)) * 4.4, min(fract(bz), 1. - fract(bz)) * 7.75);
        float st = 1. + cel * (0.11 * (h21(vec2(bi, floor(bz)) + uSeed.xy) - 0.5) - 0.13 * (1. - smoothstep(0.03, 0.09 + fv, jd)) * (1. - smoothstep(0.4, 1.2, fv)));
        col *= st; pA *= st;
      }
    } else if (m < 1.5) {
      vec2 cg = vec2(s.x / 3.4, s.y / 1.55); cg.x += 0.5 * mod(floor(cg.y), 2.) + 0.13 * h21(vec2(floor(cg.y), 3.));
      vec2 ci = floor(cg), cf = fract(cg), ce = min(cf, 1. - cf) * vec2(3.4, 1.55);
      float cj = (1. - smoothstep(0.035, 0.085 + fs * 1.1, min(ce.x, ce.y))) * (1. - smoothstep(0.3, 0.9, fs));
      col *= mix(vec3(1.), vec3(0.88, 0.9, 0.93) * (1. + 0.16 * (h21(ci + uSeed.zw) - 0.5)) * (1. - 0.24 * cj), cel);
    } else if (m < 2.5) {
      vec2 tg = vec2(s.x + s.y, s.x - s.y) * (0.7071 / 1.2), ti = floor(tg), tf = fract(tg), te = min(tf, 1. - tf) * 1.2;
      float tj = (1. - smoothstep(0.03, 0.06 + fs * 1.2, min(te.x, te.y))) * (1. - smoothstep(0.25, 0.8, fs));
      float tt = 0.88 + 0.24 * h21(ti + 7.7);
      col = mix(col, mix(col * tt, uStone * 0.62, 0.5 * tj), cel);
      pA = mix(1., tt * (1. - 0.5 * tj), cel); pB = uStone * (0.31 * tj * cel);
    }
  }
  // a cloud's tone drifting over the bay's wall: the plaster's own tone a little lighter, then a little darker, in soft
  // fields some twenty metres across that slide along the wall and down it at walking pace (nine parts in a hundred each way)
  float bcl = vn(vec2(vP.z * 0.045 + uTime * 0.11, vP.y * 0.06 - uTime * 0.05) + uSeed.xy) + 0.5 * vn(vec2(vP.z * 0.11 - uTime * 0.07, (vP.x + vP.y) * 0.09 + uTime * 0.04) + uSeed.zw);
  col *= 1. + bay * step(m, 1.5) * 0.18 * (smoothstep(0.3, 1.2, bcl) - 0.5);
  // drifting cloud tone: soft-edged bands that only ever darken, sliding over the plan; weaker where little sky reaches
  float cl = vn(vP.xz * 0.016 + vec2(uTime * 0.3, uTime * 0.1)) + 0.5 * vn(vP.xz * 0.04 + vec2(uTime * 0.42, -uTime * 0.13) + 7.3);
  float amb = vD.y * (1. - uCloud * 0.5 * (0.45 + 0.55 * smoothstep(0.2, 0.75, vD.y)) * (0.2 * cl + smoothstep(0.66, 0.96, cl)));
  // the low sun: a lit side and a shade side on every block, cast shadows from the baked map, a warm lift from sunlit floors
  vec3 nn = vN / max(length(vN), 1e-4); float ndl = dot(nn, uSunDir);
  float sun = sunVis(vP + nn * 0.12, ndl) * smoothstep(0.02, 0.3, ndl) * (0.62 + 0.38 * ndl) * (1. - uCloud * smoothstep(0.6, 0.95, cl));
  vec3 light = (amb * uAmb * mix(uShade, vec3(1.), smoothstep(0.2, 0.85, amb)) + sun * uSunCol) * uBright; float lit = dot(light, vec3(0.3, 0.5, 0.2));
  // THE CELLAR'S OWN LIGHT, by place. A painter's liberty, said plainly: the world's sun stands too high and too far south to
  // reach more than the lane's first metres, so inside the cellar the sun is taken lower and further west (uCSun, one
  // direction for every look) and comes in under the west arches.
  // Its bars lie across the lane, warm and clear-edged, three to four times the light of the shade beside them, with the piers'
  // shadows between them cool; the sunward faces of the lane's piers carry the same light. Each sunlit patch of tiles throws a warm lift
  // onto the vault above it and the pier faces beside it, so the bars are read overhead too. The shade deepens toward
  // the crown of the vault, and deepens and cools toward the lane's far end; the end arch (soffit, jambs and the face it
  // turns to the lane: from the middle of the last bay, z -108.5, to the arch's lane face, z -121.5) stands in shade, so
  // that the court beyond it is the brightest thing on the axis, and whatever there is not floor and is not turned back
  // to the lane takes a warm lift from the sunlit court floor beyond it (crt: from z -116 northward, strongest low down);
  // the tiles keep the daylight that spills in over them. Leaf shade from the garden's trees stirs in the bars. The
  // cellar's zone fades out through the end arch, so the first 2.4 m of the court's floor and side walls beyond it still
  // take a falling share of the cellar's light.
  float bar = 0.;
  if (cel > 0.) {
    float ndc = dot(nn, uCSun);
    bar = cellarSun(vP + nn * 0.1, 0.1) * smoothstep(0.02, 0.15, ndc) * (0.95 + 0.4 * ndc) * (1. - uCloud * smoothstep(0.6, 0.95, cl));
    // the garden's trees stand in the low sun before the arches: their leaves' shade stirs in the bars (hd = where the ray
    // to the sun leaves the arcade's outer face: broad masses that sway, small flecks that flicker)
    float sxd = max((-46.5 - vP.x) / min(uCSun.x, -1e-3), 0.); vec2 hd = vP.zy + uCSun.zy * sxd;
    float lfA = vn(vec2(hd.x * 0.2 + 0.7 * sin(uTime * 0.9 + hd.x * 0.07), hd.y * 0.28 + 0.4 * sin(uTime * 1.2 + hd.x * 0.13)) + uSeed.xy);
    float lfB = vn(vec2(hd.x * 0.75 + 0.5 * sin(uTime * 2.1 + hd.x * 0.31), hd.y * 0.9 + 0.4 * sin(uTime * 2.6 + hd.y * 0.4)) + uSeed.zw);
    float dap = smoothstep(0.44, 0.7, 0.68 * lfA + 0.32 * lfB) * smoothstep(0.28, 0.5, vn(vec2(hd.x * 0.03, 7.3) + uSeed.zw));
    bar *= 1. - 0.85 * dap;
    float bnc = cellarSun(vec3(vP.x, 0.1, vP.z), 5.) * (1. - 0.6 * dap) * (nn.y > 0.5 ? 0. : (nn.y < -0.2 ? 0.5 : 0.55 * exp(-vP.y / 8.)));
    float dzp = vP.z > -14.5 ? abs(vP.z - 2.) : abs(mod(-(vP.z + 15.5), 31.) - 15.5), dxa = min(abs(vP.x + 41.5), abs(vP.x + 6.5));
    float pool = smoothstep(2.5, 4.5 + 0.5 * dxa, dzp) * exp(-dxa / 15.);
    float flr = step(0.5, nn.y), deep = 1. - smoothstep(-116., -24., vP.z), crown = smoothstep(9., 16.5, vP.y) * step(nn.y, -0.05);
    float endA = (1. - smoothstep(-121.5, -108.5, vP.z)) * (1. - flr);
    float ambC = max(amb, 0.) * (0.8 + 0.45 * pool) * (1. - 0.22 * crown) * (1. - 0.16 * deep * (1. - flr)) * (1. - 0.3 * endA);
    vec3 shd = mix(vec3(0.88, 0.96, 1.1), vec3(0.8, 0.93, 1.14), max(deep * (1. - flr), endA));
    float crt = (1. - smoothstep(-124., -116., vP.z)) * (1. - flr) * step(nn.z, 0.3) * (1. - smoothstep(4., 17., vP.y) * 0.6);   // the sunlit court floor's lift near the end arch
    vec3 lc = (ambC * uAmb * shd + bar * uSunCol * vec3(1.06, 0.98, 0.88) + (bnc + 0.3 * crt) * uSunCol * (uTile * 1.1 + 0.25)) * uBright;
    light = mix(light, lc, cel);
  }
  if (m > 1.5 && m < 2.5 && vP.y > 51. && an.y > 0.7 && uWet > 0.5) {   // after rain: dark tiles, standing water that takes the sky at a low angle
    float pud = smoothstep(0.42, 0.62, fbm(s * 0.07 + 3.1)), fr = pow(1. - clamp(normalize(uEye - vL).y, 0., 1.), 4.);
    col = mix(col * mix(0.56, 0.4, pud), uSky * 1.04, clamp(0.05 + 0.2 * pud + fr * (0.3 + 0.5 * pud), 0., 0.9));
  }
  col = mix(col, uTile * (0.9 + 0.2 * step(1.5, m)), 0.5 * vD.z * (1. - step(2.5, m)) * (1. - 0.6 * step(1.5, m)));
  // the three pictures, each laid only where this is the first surface seen from its point
  float c0 = -dot(vN, d0) / max(length(d0), 1e-3), c1 = -dot(vN, d1) / max(length(d1), 1e-3), c2 = -dot(vN, d2) / max(length(d2), 1e-3);
  // inside the gallery and its west bay, north of the cross arcade, everything that faces V2 takes the loggia whether or not a
  // pier stands in front of it: a pier then throws no bare shadow on the stair and wall behind it when the eye is off the point
  float room = step(-124.3, vP.z) * step(vP.z, -33.2) * step(17.9, vP.y) * step(vP.y, 51.6) * step(-50.3, vP.x) * step(vP.x, 47.3);
  // the vault behind each rib is hidden from V2 by the rib: the sky is carried on there, so no bare arc opens beside a rib from below
  float v0 = seen(uD0, q0, t0, uRes.x, c0, uNear.x, 0., uTan, uFar) * uPaintOn, v1 = seen(uD1, q1, t1, uRes.y, c1, uNear.y, 3.2 * step(vN.y, -0.15) * step(40., vP.y) + 400. * room, uTan, uFar) * uPaintOn;
  float all2 = step(1., t2) * step(max(abs(q2.x), abs(q2.y)), uTan * 0.985);
  float v2 = mix(seen(uD2, q2, t2, uRes.z, c2, uNear.z, 0., uTan, uFar), all2, uMir) * uPaintOn;
  // the glory also lies on the porch's front and the window wall where the pergola hides them from V3, so it shows from far off
  float back = max(step(vP.z, -299.3), step(vP.z, -279.) * step(-282.2, vP.z));
  float v2g = max(v2, all2 * back * (1. - uMir) * uPaintOn);
  float c3 = -dot(vN, d3) / max(length(d3), 1e-3);
  float v3 = seenSoft(uD3, q3, t3, 2048., c3, 3., uTan0, uFar0) * max(step(t3, 151.5), step(t3, 212.45) * step(vP.x, -13.9)) * step(vP.y, 17.6) * uPaintOn * (1. - uMir);   // the cellar, and beyond it stair A and the court's west side
  v0 *= smoothstep(0., 0.03, c0); v1 *= smoothstep(0., 0.03, c1); v2 *= smoothstep(0., 0.03, c2); v2g *= smoothstep(0., 0.03, c2); v3 *= smoothstep(0., 0.03, c3);
  vec3 d5 = vP - vec3(24.5, 23., -166.); float t5 = d5.z; vec2 q5 = d5.xy / max(t5, 1e-4);
  float v5 = step(3., t5) * step(t5, 40.6) * step(0., vP.x) * step(vP.x, 50.3) * step(9.05, vP.y) * smoothstep(0., 0.03, dot(vN, -d5) / max(length(d5), 1e-3)) * uPaintOn * (1. - uMir);
  float v6 = step(1., t6) * max(step(vP.x, -39.2) * step(vP.z, -186.2), step(vP.z, -203.6)) * step(vP.x, -13.5) * step(-230.4, vP.z) * step(8.9, vP.y) * step(vP.y, 52.05)
    * smoothstep(0., 0.03, -dot(vN, d6) / max(length(d6), 1e-3)) * uPaintOn * (1. - uMir);
  // PICTURE 0 BY THE RULE OF THE SURFACE: THE PAINTER PAINTS PLASTER AND TILE; DRESSED STONE STAYS STONE. Inside the cellar
  // north of its mouth arch (z between -1.1 and -127.1, below y 17.2: from just north of the front piers' imposts to
  // just beyond the court side of the end arch's piers; the mouth arch itself, through which the
  // instrument is first seen, takes the paint like a surface outside the cellar, so the limb closes over the top from the
  // entry point) travertine takes none of the astrolabe, not a line of it: piers, bases, imposts, arch
  // rings, soffits and jambs keep their stone, its courses and the cellar's light, and the paint ends at the stone's edge
  // (hair outlines on the stone were tried and left out: on faces that lie along the rays from the entry point one line
  // spreads into a brown band). The switch is the surface's own material and the cellar's own bounds, nothing else: no
  // distance, no angle, no eye. On the cellar's plaster and tiles the layer is laid in full, and the surface's own figure
  // comes through it (pA, pB from the cellar's block above: the vault's float strips and their hair joints, each tile's
  // tone and the tiles' joints). Outside the cellar pA is 1 and pB nothing, and the layer lies on every material alike.
  vec4 pa = vec4(0., 0., 0., 1.); float washA = astroP(pa, q3, f3, v3);
  float stn = step(vP.z, -1.1) * step(-127.1, vP.z) * step(vP.y, 17.2) * (1. - uMir) * step(0.5, m) * step(m, 1.5);
  pa = mix(pa, vec4(0., 0., 0., 1.), stn); washA *= 1. - stn;
  col = col * pa.a + pa.rgb * pA + (1. - pa.a) * pB;
  float wash = washA;
  wash += fanP(col, q6, f6, v6);
  wash += doorP(col, q5, f5, v5);
  wash += sphereP(col, q0, f0, v0);
  wash += loggiaP(col, q1, g, gF, f1, v1);
  wash += gloryP(col, q2, f2, v2g);
  wash += wreathP(col, q2, f2, v2);
  float near = 1. - smoothstep(24., 40., length(vL - uEye));
  col = mix(col, col * uUmber * 1.6, 0.5 * vignette(s, fs) * clamp(wash * 1.5, 0., 1.) * near);
  // paint keeps most of its own value against the light, so a picture is one tone across its receivers; inside the cellar the
  // astrolabe's paint keeps half as much, so painted plaster and painted tiles stay plaster and tiles in the cellar's light:
  // the sun's bars lie across the painted floor, the painted vault deepens toward its crown and lifts over the bars
  col = max(col, 0.) * max(mix(light, mix(light, vec3(0.93), 0.66), clamp(clamp((wash - washA) * 2., 0., 1.) + clamp(washA * 2., 0., 1.) * (1. - 0.5 * cel), 0., 1.)), 0.);
  // the cellar's tiles are worn smooth down the lane (most on its axis, x -24): at a low angle they hold a sheen of the daylight, most in the sun's bars
  if (cel > 0. && m > 1.5 && m < 2.5 && an.y > 0.7) {
    vec3 ev = uEye - vL; float gz2 = 1. - clamp(ev.y / max(length(ev), 1e-3), 0., 1.), g4 = gz2 * gz2 * gz2 * gz2;
    float worn = (0.3 + 0.7 * exp(-(vP.x + 24.) * (vP.x + 24.) / 150.)) * (0.55 + 0.45 * fbm(s * 0.07 + uSeed.yx));
    col += cel * g4 * worn * (0.04 + 0.05 * bar) * uSunCol * vec3(1.25, 1.2, 1.15);
  }
  // daylight from the court through the north door while its leaf stands open: a pale bar on the gallery floor from the
  // west jamb as far east as the leaf lets it, narrowing as the leaf swings home
  float gz = vP.z + 121.6, ge = 0.5 + 0.022 * max(gz, 0.), gxr = 14.5 + 19. * uGap + 0.03 * gz, gxl = 14.5 - 0.1 * gz;
  float pool = step(0.004, uGap) * step(17.9, vP.y) * step(vP.y, 18.5) * step(0.7, nn.y) * smoothstep(0., 3., gz) * (1. - smoothstep(16., 66., gz))
    * smoothstep(gxl - ge, gxl + ge, vP.x) * (1. - smoothstep(gxr - ge, gxr + ge, vP.x)) * (1. - uMir);
  col = mix(col, min(col * 1.45 + vec3(0.07, 0.065, 0.05), vec3(0.99, 0.97, 0.9)), 0.9 * pool);
  col = mix(col, col * vec3(0.8, 0.83, 0.87) + uSky * 0.03, uMir);   // the image in the water: a step darker and cooler than the thing
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

const WATER_VERT = /* glsl */`
varying vec3 vL;
#include <fog_pars_vertex>
void main() { vL = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform vec3 uSky, uSkyLo, uSkyHi, uSkyCl, uChalk, uEye; uniform vec4 uSeed; uniform float uTime, uGlaze, uBright, uSkyCv;
varying vec3 vL;
#include <fog_pars_fragment>
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
${RIPPLE}
// The water holds the sky where nothing stands over it: the sky's own tone at the height the mirrored line of sight climbs to
// (e: 0 level, 1 straight up), warm low down and cool overhead, with long level bars of cloud; a step darker than the sky.
// With uSkyLo = uSkyHi = uSkyCl (the piece shown alone) it is one flat tone, as before.
// (eb: the same height with a third of the ripples' push, so that a bar of cloud wavers in the water and is not broken up by it)
vec3 skyIn(float e, float eb, vec2 b) {
  vec3 c = mix(uSkyLo, uSkyHi, smoothstep(0., 0.62, e));
  float bars = 0.62 * vn(vec2(dot(b, vec2(1.9, 0.8)) + uTime * 0.004, eb * 13.) + uSeed.xy) + 0.38 * vn(vec2(dot(b, vec2(-1.1, 4.4)), eb * 31.) + uSeed.zw);
  float lo = 0.7 - uSkyCv * 0.3;
  return mix(c, uSkyCl, 0.5 * smoothstep(lo, lo + 0.17, bars) * (1. - smoothstep(0.5, 0.85, eb))) * 0.86;
}
void main() {
  vec2 p = vL.xz; float fs = clamp(max(fwidth(p).x, fwidth(p).y), 1e-4, 4.);
  vec3 ev = uEye - vL + vec3(0., 1e-3, 0.), eye = ev / max(length(ev), 1e-4);
  vec2 b = eye.xz / max(length(eye.xz), 1e-4);
  // ripples: where the water tilts toward the eye or away from it the mirrored line of sight climbs lower or higher, so the
  // sky's tone in it shifts, and whatever stands mirrored there gives way to a streak of sky; ripples too fine for a pixel
  // are taken at their mean
  float near = 1. - smoothstep(0.5, 2.2, fs);
  vec2 sl = ripSlope(p, uTime) * near; float tilt = dot(sl, b);
  float e = clamp(eye.y + 0.3 * tilt, 0.02, 1.);
  vec3 base = skyIn(e, clamp(eye.y + 0.1 * tilt, 0.02, 1.), b);
  // slow rings from where the leaves turn (the four bays of water between the pergola's posts)
  float rings = 0.;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 c = vec2(mix(${RINGS[0][0].toFixed(2)}, ${RINGS[2][0].toFixed(2)}, step(1.5, fi)), mix(${RINGS[0][1].toFixed(2)}, ${RINGS[1][1].toFixed(2)}, mod(fi, 2.)));
    float d = length(p - c), ph = fract(uTime * 0.11 + fi * 0.27 + uSeed.x);
    rings += (1. - smoothstep(0.0, 0.5 + fs, abs(d - ph * 9.))) * (1. - ph) * smoothstep(0.3, 1.5, d);
  }
  float glint = smoothstep(0.55, 0.95, tilt) * near * 0.3 + rings * 0.3;
  if (uGlaze < 0.5) { gl_FragColor = vec4(mix(base, uChalk * 0.97, clamp(glint, 0., 1.) * 0.5), 1.); }
  else {
    // over the mirrored things: clear water, crossed by the streaks of sky and the glints; far off, where the ripples run
    // together, a thin even veil of the sky (0.16: the share of the water the streaks cover near by)
    float streak = smoothstep(0.3, 0.72, abs(tilt)) * 0.62;
    gl_FragColor = vec4(mix(base, uChalk * 0.97, clamp(glint, 0., 1.) * 0.5), clamp(mix(0.16, streak, near) + 0.3 * glint, 0., 0.9));
  }
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the hero
// sun = [azimuth south of west in degrees, elevation], its colour, and the colour of the shade (sky and bounce light)
const CSUN = [48, 11.5];   // the cellar's own sun, the same on every look: [azimuth south of west in degrees, elevation]
const LOOKS = {
  umber: { sun: [65, 37], sunCol: [0.6, 0.54, 0.44], amb: [0.56, 0.52, 0.47], shade: [1.1, 0.97, 0.84] },
  verdaccio: { umber: '#474B3A', sienna: '#8A8E6E', plaster: '#DCE1DB', stone: '#BBBEB0', wet: 1, bright: 0.95, shade: [1.0, 1.0, 0.9], sun: [62, 40], sunCol: [0.52, 0.53, 0.43], amb: [0.5, 0.54, 0.52] },
  sanguine: { umber: '#7C2F23', sienna: '#BC5C44', chalk: '#F7EFE2', plaster: '#F0D8C4', stone: '#D8BEA0', bright: 0.94, shade: [1.12, 0.92, 0.84], sun: [66, 33], sunCol: [0.7, 0.5, 0.36], amb: [0.56, 0.47, 0.48] },
};
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, vary = ctx.vary || {};
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : ['#EDE6D6', '#CFC3A8', '#5A3A22', '#B0703A', '#F8F4EA', '#6F8296', '#B4664A']).slice();
  // every random draw first, in a fixed order
  const lookRoll = rng(), armTilt = rng.range(0.3, 0.52) * rng.sign(), armEcl = rng.range(0.34, 0.5), armSq = rng.range(0.26, 0.36);
  const cells = rng.pick([32, 36, 40]), chk = rng.range(5, 7), seed4 = [rng() * 40, rng() * 40, rng() * 40, rng() * 40];
  const hour = vary.hour;
  const lookName = opts.look || (hour === 'dawn' || hour === 'golden' || hour === 'night' ? 'sanguine' : lookRoll < 0.55 ? 'umber' : 'verdaccio');
  const look = LOOKS[lookName] || LOOKS.umber, rare = opts.rare ?? !!vary.rare;
  const C = (h) => new THREE.Color(h);
  const cPlaster = C(look.plaster || pal[0]), cStone = C(look.stone || pal[1]), cUmber = C(look.umber || pal[2]), cSienna = C(look.sienna || pal[3]);
  const cChalk = C(look.chalk || pal[4]), cBlue = C(pal[5]), cTile = C(pal[6]);
  const cWood = cUmber.clone().lerp(C('#4A3826'), 0.5).multiplyScalar(1.25), cSky = C(lookName === 'sanguine' ? '#D9CFC0' : lookName === 'verdaccio' ? '#CDD1CF' : '#D6D5CF');

  CELLAR = lookName === 'sanguine' ? 1.08 : lookName === 'verdaccio' ? 0.96 : 0.96;
  // ---- geometry (four accumulators: wing, north terrace, door leaf, terrace leaf)
  const A = makeAcc(), AT = makeAcc(), AD = makeAcc(), AL = makeAcc();
  await ctx.yield();
  for (const step of buildCellar(A)) await ctx.yield();   // (the three big builders pause part way: step is unused)
  await ctx.yield();
  for (const step of buildCourt(A)) await ctx.yield();
  // two plain pylons in the court between the stairs: each takes a strip of the sphere close to V1
  A.zone = ZK; A.floorY = 9; pylon(A, -8, -184.9, 2.2, 1.4, 9, 25); pylon(A, 3.5, -184.9, 2.2, 1.4, 9, 25);
  await ctx.yield();
  for (const step of buildGallery(A)) await ctx.yield();
  await ctx.yield();
  buildTerrace(AT); await ctx.yield();
  buildDoor(AD); buildLeaf(AL);
  const gWing = accToGeometry(A); await ctx.yield();
  const gTerr = accToGeometry(AT), gDoor = accToGeometry(AD), gLeaf = accToGeometry(AL);
  await ctx.yield();

  // ---- pictures: vantage points and axes
  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const ax0 = new THREE.Vector3(AIM1[0] - V1[0], AIM1[1] - V1[1], AIM1[2] - V1[2]).normalize();
  const ax2 = new THREE.Vector3(SEAT[0] - V3[0], 0, SEAT[2] - V3[2]), d3 = ax2.length(); ax2.normalize();
  const axes = [ax0, new THREE.Vector3(0, 0, -1), ax2];
  const rts = axes.map((a) => new THREE.Vector3().crossVectors(a, new THREE.Vector3(0, 1, 0)).normalize());
  const ups = axes.map((a, i) => new THREE.Vector3().crossVectors(rts[i], a).normalize());
  const ax6 = new THREE.Vector3(SEAT[0] - V6[0], SEAT[1] - V6[1], SEAT[2] - V6[2]).normalize(), rt6 = new THREE.Vector3().crossVectors(ax6, new THREE.Vector3(0, 1, 0)).normalize(), up6 = new THREE.Vector3().crossVectors(rt6, ax6).normalize();
  const FAR = 130, TAN = 0.9, RES = [1024, 2048, 1024, 2048], TAN0 = 0.42, FAR0 = 230, SUNRES = 2048, SUNFAR = 760;
  const V0 = [-24, 8, 26];                                // the entry point: the astrolabe in the cellar mouth is whole from here
  const mkRT = (n) => {
    const rt = new THREE.WebGLRenderTarget(n, n, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, generateMipmaps: false, type: THREE.UnsignedByteType, format: THREE.RGBAFormat });
    rt.texture.colorSpace = THREE.NoColorSpace; return rt;
  };
  const rts3 = RES.map(mkRT), rtSun = mkRT(SUNRES);
  // the sun: an orthographic depth map along its rays over the whole wing
  const sa = THREE.MathUtils.degToRad((look.sun || [65, 37])[0]), se = THREE.MathUtils.degToRad((look.sun || [65, 37])[1]);
  const sunDir = new THREE.Vector3(-Math.cos(se) * Math.cos(sa), Math.sin(se), Math.cos(se) * Math.sin(sa)).normalize();
  // the cellar's sun (see cellarSun in the shader), a painter's liberty: the world's sun reaches only the first metres of
  // the lane inside its mouth, so inside the cellar the sun is taken from the same quarter of the sky but lower and further
  // round to the west. ONE direction, typed once (CSUN): the same on every look, every seed and at every moment.
  const ca = THREE.MathUtils.degToRad(CSUN[0]), ce = THREE.MathUtils.degToRad(CSUN[1]);
  const cSun = new THREE.Vector3(-Math.cos(ce) * Math.cos(ca), Math.sin(ce), Math.cos(ce) * Math.sin(ca)).normalize();
  const sunCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, SUNFAR), sunMid = new THREE.Vector3(0, 40, -151);
  sunCam.position.copy(sunMid).addScaledVector(sunDir, 380); sunCam.up.set(0, 1, 0); sunCam.lookAt(sunMid); sunCam.updateMatrixWorld(true);
  {
    const inv = sunCam.matrixWorld.clone().invert(), c = new THREE.Vector3(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const x of [-58, 58]) for (const y of [-2, 90]) for (const z of [-314, 12]) { c.set(x, y, z).applyMatrix4(inv); x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); }
    sunCam.left = x0; sunCam.right = x1; sunCam.bottom = y0; sunCam.top = y1; sunCam.updateProjectionMatrix();
  }
  const sunM = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(sunCam.projectionMatrix).multiply(sunCam.matrixWorldInverse);

  const shared = {
    uV: { value: [v3(V1), v3(V2), v3(V3)] }, uAx: { value: axes }, uRt: { value: rts }, uUp: { value: ups },
    uVm: { value: new THREE.Vector3(V3[0], 2 * WATER_Y - V3[1], V3[2]) },
    uD0: { value: rts3[0].texture }, uD1: { value: rts3[1].texture }, uD2: { value: rts3[2].texture },
    uFar: { value: FAR }, uTan: { value: TAN }, uWater: { value: WATER_Y }, uTime: { value: 0 },
    uBright: { value: (opts.bright ?? 1) * (look.bright ?? 1) }, uPaintOn: { value: 1 }, uWet: { value: look.wet ? 1 : 0 }, uMirOff: { value: 2 * (V3[1] - WATER_Y) / d3 },
    uPlaster: { value: cPlaster }, uStone: { value: cStone }, uTile: { value: cTile }, uWood: { value: cWood },
    uUmber: { value: cUmber }, uSienna: { value: cSienna }, uChalk: { value: cChalk }, uBlue: { value: cBlue }, uSky: { value: cSky },
    uEye: { value: new THREE.Vector3(0, 80, 100) }, uBasin: { value: new THREE.Vector4(BAS.x0, BAS.x1, BAS.z0, BAS.z1) },
    uSeed: { value: new THREE.Vector4(seed4[0], seed4[1], seed4[2], seed4[3]) }, uArm: { value: new THREE.Vector4(armTilt, armEcl, armSq, 0.35) },
    uCells: { value: cells }, uChk: { value: chk }, uWr: { value: 13.5 / d3 }, uRes: { value: new THREE.Vector3(RES[0], RES[1], RES[2]) },
    uLog: { value: new THREE.Vector4(LOG.x0, LOG.x1, LOG.y0, LOG.y1) }, uLog2: { value: new THREE.Vector3(LOG.W, (18 - V2[1]) / (V2[2] + 122), 0.1) }, uNear: { value: new THREE.Vector3(1, 24.5, 1) },
    uD3: { value: rts3[3].texture }, uDS: { value: rtSun.texture }, uSunM: { value: sunM }, uSunPos: { value: sunCam.position.clone() }, uSunDir: { value: sunDir },
    uSunCol: { value: new THREE.Vector3(...(look.sunCol || [0.6, 0.55, 0.47])) }, uAmb: { value: new THREE.Vector3(...(look.amb || [0.5, 0.49, 0.5])) },
    uSunFar: { value: SUNFAR }, uSunRes: { value: SUNRES }, uV0: { value: v3(V0) }, uTan0: { value: TAN0 }, uFar0: { value: FAR0 },
    uShade: { value: new THREE.Vector3(...(look.shade || [1.05, 0.95, 0.84])) }, uRose: { value: new THREE.Vector3(-8, 58, 16) }, uEyeH: { value: V2[1] - 18 }, uCloud: { value: opts.cloud ?? 0.08 },
    uCSun: { value: cSun }, uV6: { value: v3(V6) }, uAx6: { value: ax6 }, uRt6: { value: rt6 }, uUp6: { value: up6 }, uGap: { value: 0 }, uLeafNear: { value: 1 },
    // the sky as the cistern holds it: its tone low down, overhead and in its cloud bars, and how much of it the bars cover
    // (all one tone until a world sets them: the flat sheet of the piece shown alone)
    uSkyLo: { value: cSky.clone() }, uSkyHi: { value: cSky.clone() }, uSkyCl: { value: cSky.clone() }, uSkyCv: { value: 0.4 },
  };
  const FRAG = FRAG_HEAD + FRAG_PICS + FRAG_MAIN;
  const mkMat = (mir, side) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uPiv: { value: new THREE.Vector3(0, 0, 0) }, uMir: { value: mir } },
    vertexShader: VERT, fragmentShader: FRAG, fog: true, side,
  });
  const mWing = mkMat(0, THREE.FrontSide), mDoor = mkMat(0, THREE.FrontSide), mLeaf = mkMat(0, THREE.FrontSide);
  const mMirror = mkMat(1, THREE.BackSide), mLeafMirror = mkMat(1, THREE.BackSide);
  mDoor.uniforms.uPiv.value.set(DOOR.x, DOOR.z, 0); mLeaf.uniforms.uPiv.value.set(LEAF.x, LEAF.z, 0); mLeafMirror.uniforms.uPiv.value.set(LEAF.x, LEAF.z, 0);
  const mDepth = new THREE.ShaderMaterial({
    uniforms: { uPiv: { value: new THREE.Vector3() }, uMir: { value: 0 }, uWater: { value: WATER_Y }, uBV: { value: new THREE.Vector3() }, uBAx: { value: new THREE.Vector3() }, uFar: { value: FAR } },
    vertexShader: VERT, fragmentShader: FRAG_DEPTH, side: THREE.DoubleSide,
  });
  const waterU = { uSky: shared.uSky, uChalk: shared.uChalk, uEye: shared.uEye, uTime: shared.uTime, uBright: shared.uBright,
    uSkyLo: shared.uSkyLo, uSkyHi: shared.uSkyHi, uSkyCl: shared.uSkyCl, uSkyCv: shared.uSkyCv, uSeed: shared.uSeed };
  const mkWater = (glaze) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...waterU, uGlaze: { value: glaze } },
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, fog: true, depthWrite: false, transparent: glaze > 0,
  });
  await ctx.yield();

  // ---- meshes
  const root = new THREE.Group(); root.name = 'one-standing-place';
  const wing = new THREE.Mesh(gWing, mWing), terr = new THREE.Mesh(gTerr, mWing), door = new THREE.Mesh(gDoor, mDoor), leaf = new THREE.Mesh(gLeaf, mLeaf);
  const terrM = new THREE.Mesh(gTerr, mMirror), leafM = new THREE.Mesh(gLeaf, mLeafMirror);
  terrM.renderOrder = 2; leafM.renderOrder = 2; terrM.frustumCulled = false; leafM.frustumCulled = false;
  const gWater = new THREE.BufferGeometry();
  gWater.setAttribute('position', new THREE.Float32BufferAttribute([BAS.x0, WATER_Y, BAS.z1, BAS.x1, WATER_Y, BAS.z1, BAS.x1, WATER_Y, BAS.z0, BAS.x0, WATER_Y, BAS.z0], 3));
  gWater.setIndex([0, 1, 2, 0, 2, 3]); gWater.computeBoundingSphere();
  const waterBase = new THREE.Mesh(gWater, mkWater(0)), waterGlaze = new THREE.Mesh(gWater, mkWater(1));
  waterBase.renderOrder = 1; waterGlaze.renderOrder = 3;
  root.add(wing, terr, door, leaf, waterBase, terrM, leafM, waterGlaze);

  // ---- depth maps from the three points (leaves shut: the override material carries no pivot angle)
  const bakeCam = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(2 * Math.atan(TAN)), 1, 0.5, FAR + 30), bakeScene = new THREE.Scene(), keepCol = new THREE.Color();
  // band of nb: only that horizontal strip of the map is drawn, so that one map can be spread over several build steps
  const ax3 = new THREE.Vector3(0, 0, -1), up3 = new THREE.Vector3(0, 1, 0), axSun = sunDir.clone().negate();
  // i = 0..2 the three pictures, 3 the astrolabe from the entry, 4 the sun (extra: objects of the world that should cast shadows)
  const bakeOne = (i, band = 0, nb = 1, extra = [], only = false) => {
    const r = ctx.renderer; if (!r) return;
    const parent = root.parent, pm = root.matrix.clone(), auto = root.matrixAutoUpdate;
    root.matrixAutoUpdate = false; root.matrix.identity(); bakeScene.add(root); root.updateMatrixWorld(true);
    const hid = [terrM, leafM, waterBase, waterGlaze], was = hid.map((o) => o.visible); for (const o of hid) o.visible = false;
    bakeScene.overrideMaterial = mDepth;
    const sun = i === 4, V = sun ? sunCam.position : i === 3 ? shared.uV0.value : shared.uV.value[i], ax = sun ? axSun : i === 3 ? ax3 : axes[i], cam = sun ? sunCam : bakeCam;
    mDepth.uniforms.uBV.value.copy(V); mDepth.uniforms.uBAx.value.copy(ax); mDepth.uniforms.uFar.value = sun ? SUNFAR : i === 3 ? FAR0 : FAR;
    if (!sun) {
      bakeCam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(i === 3 ? TAN0 : TAN)); bakeCam.far = (i === 3 ? FAR0 : FAR) + 30; bakeCam.updateProjectionMatrix();
      bakeCam.position.copy(V); bakeCam.up.copy(i === 3 ? up3 : ups[i]); bakeCam.lookAt(V.x + ax.x, V.y + ax.y, V.z + ax.z); bakeCam.updateMatrixWorld(true);
    }
    const exP = extra.map((o) => o.parent); for (const o of extra) bakeScene.add(o);
    const prevRT = r.getRenderTarget(), prevAuto = r.autoClear, prevA = r.getClearAlpha(); r.getClearColor(keepCol);
    const rt = sun ? rtSun : rts3[i], y0 = Math.round(rt.height * band / nb), y1 = Math.round(rt.height * (band + 1) / nb);
    rt.scissorTest = nb > 1; rt.scissor.set(0, y0, rt.width, y1 - y0);
    const rootVis = root.visible; root.visible = !only;       // only: just the extra objects, drawn over what the map already holds
    try { r.autoClear = !only; r.setClearColor(0xffffff, 1); r.setRenderTarget(rt); if (!only) r.clear(); r.render(bakeScene, cam); }
    finally {
      rt.scissorTest = false; rt.scissor.set(0, 0, rt.width, rt.height); root.visible = rootVis;
      r.setRenderTarget(prevRT); r.autoClear = prevAuto; r.setClearColor(keepCol, prevA);
      bakeScene.overrideMaterial = null; hid.forEach((o, k) => { o.visible = was[k]; });
      extra.forEach((o, k) => { bakeScene.remove(o); if (exP[k]) exP[k].add(o); });
      bakeScene.remove(root); root.matrix.copy(pm); root.matrixAutoUpdate = auto; if (parent) parent.add(root); root.updateMatrixWorld(true);
    }
  };
  // the depth program is compiled in a step of its own, against the same kind of target it will draw into, and without
  // holding the page where the browser can compile in the background
  const r0 = ctx.renderer;
  if (r0 && r0.compileAsync) {
    const ws = new THREE.Scene(), wg = new THREE.BufferGeometry(), prevRT = r0.getRenderTarget();
    wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3)); ws.add(new THREE.Mesh(wg, mDepth));
    let done = null;
    try { r0.setRenderTarget(rts3[0]); done = r0.compileAsync(ws, bakeCam); } catch (e) { done = null; }
    r0.setRenderTarget(prevRT);
    if (done) await done;
    wg.dispose();
  }
  await ctx.yield();
  // the vertex buffers go to the card in a step of their own (three triangles drawn, everything uploaded)
  { const gs = [wing, terr, door, leaf].map((o) => o.geometry); for (const g of gs) g.setDrawRange(0, 3); bakeOne(0, 0, 2); for (const g of gs) g.setDrawRange(0, Infinity); }
  await ctx.yield();
  for (let i = 0; i < 4; i++) { const nb = i === 1 || i === 3 ? 6 : 3; for (let b = 0; b < nb; b++) { bakeOne(i, b, nb); await ctx.yield(); } }
  // the sun's map: here for the piece shown alone; a world that has things of its own to cast shadows asks again with bakeSun
  // (the wing in strips; then each object of the world a part of its triangles at a time, so that no step is long)
  const bakeSun = async (extra = []) => {
    for (let b = 0; b < 8; b++) { bakeOne(4, b, 8); await ctx.yield(); }
    for (const o of extra) {
      const g = o.geometry, n = g.index ? g.index.count : g.attributes.position.count, parts = Math.max(1, Math.ceil(n / 60000));
      for (let k = 0; k < parts; k++) { const a = Math.floor(n * k / parts / 3) * 3, e = k === parts - 1 ? n : Math.floor(n * (k + 1) / parts / 3) * 3; g.setDrawRange(a, e - a); bakeOne(4, 0, 1, [o], true); await ctx.yield(); }
      g.setDrawRange(0, Infinity);
    }
  };
  if (!opts.deferSun) await bakeSun();

  // ---- leaves and time
  let prog = -1;
  const eyeTmp = new THREE.Vector3();
  const applyLeaves = (time) => {
    let dA = 0, lA = 0;
    if (prog >= 0) {
      // the north door hangs on the gallery face of the end wall, hinged on its east jamb: it stands wide inside the room
      // while the eye comes in through it and swings shut behind it. On a rare visit it is left standing wide, its dark
      // walnut back turned to the approach, the real court showing through the hole where the fourth arch should be,
      // and swings home with its slab of the loggia over the last 25 m before the lock
      const open = rare ? -2.1 : -1.75, uD = DOOR_U, uL = LOCK_U[1];
      dA = open * (1 - (rare ? smoothstep(uL - 0.03, uL - 0.004, prog) : smoothstep(uD + 0.025, uD + 0.075, prog)));
      if (dA < -0.03) dA += 0.02 * Math.sin(time * 0.7);
      lA = (1 - smoothstep(0.86, 0.925, prog)) * 1.15 + (1 - smoothstep(0.82, 0.9, prog)) * 0.04 * Math.sin(time * 0.5 + 1);
    }
    mDoor.uniforms.uPiv.value.z = dA; mLeaf.uniforms.uPiv.value.z = lA; mLeafMirror.uniforms.uPiv.value.z = lA;
    shared.uGap.value = clamp(1 - Math.cos(Math.min(-dA, Math.PI / 2)), 0, 1);   // how much of the doorway the leaf leaves clear to light from the north
  };
  applyLeaves(0);

  const fly = [[-24, 8, 26], [-24, 8, 0], [-22, 8, -62], [-17, 8, -104], [-17, 9.4, -130], [-20.5, 13.2, -156], V1, [-15.5, 19.4, -187.5], [-5, 20.2, -192.5], [8, 20.6, -192.8],
    [18.5, 21, -190], [24, 21.8, -180], [24.5, 23, -166], [24.5, 26, -143], [24.5, 27, -124], [19, 27, -108], [9, 27, -95], [2, 27.5, -80], [-5, 29.5, -66], [-14, 32.5, -55],
    [-23.5, 33.9, -47], [-32, 34.5, -37], [-35, 32, -24], [-32, 30, -12], [-22, 29.2, -7.5], [-11, 29, -7.5], V2, [2, 29.3, -21], [0.5, 29.8, -31], [-5, 31, -41], [-22, 33.6, -46.5], [-31, 37.6, -56],
    [-36, 44, -72], [-36, 51, -88], [-36, 57, -104],
    [-36, 61, -125], [-8.03, 59.8, -150], [14.86, 59.2, -176], [12.31, 59.6, -200], [-8.03, 61.4, -220], [-24.81, 63.2, -230.5], [-35.2, 64, -237], V3, [-36, 64, -262], SEAT];
  const anchors = {
    entry: [-24, 8, 26],
    portalSeat: { position: SEAT, facing: [0, 0, 1] },
    flyThrough: fly,
    vantage: [V1, V2, V3], vantageAxis: axes.map((a) => a.toArray()), lockU: LOCK_U.slice(), doorU: DOOR_U,
    pictureCenters: [AIM1, [-25.3, 29, -122], SEAT],
    closePass: [-10.2, 18, -186.3],
    doorPivot: { x: DOOR.x, z: DOOR.z, y0: DOOR.y0, y1: DOOR.y1, width: DOOR.x1 - DOOR.x0 }, leafPivot: { x: LEAF.x, z: LEAF.z, y0: LEAF.y0, y1: LEAF.y1, halfWidth: LEAF.hw },
    // the cellar's lane of piers on the flight's axis: its axis, the clearance the painter's things keep from it, its two ends, the
    // four pier rows (x), the pier lines (z) and the piers' size; westArcadeX: the plane of the gallery's west arcade
    lane: { x: -24, clear: 7, z0: 4, z1: -124, rows: [-44, -4, 4, 44], piers: [2, -31, -62, -93, -124], pier: 5 }, westArcadeX: -22,
    trestleSpots: [[-33, 0, -20], [-14, 0, -76], [40, 9, -203], [-35, 9, -207]],
    potSpots: [[-34, 0, -24], [-31, 0, -17], [-15, 0, -72], [-12, 0, -80], [26, 9, -226], [36, 9, -216], [-34, 9, -194], [40, 18, -40]],
    ringSpots: [[-15, 13.3, -124], [38, 46.4, -62], [-41.5, 71, -258.5]],
    sheetSpots: [[-6.5, 12, -45], [-41.5, 12, -77], [47, 34, -46.5], [47, 34, -77.5], [28, 30, -229.5], [24, 44, 0], [-37, 45, 0]],
    basin: { x0: BAS.x0, x1: BAS.x1, z0: BAS.z0, z1: BAS.z1, y: WATER_Y, rings: RINGS.map((r) => r.slice()) },
    bay: { ...BAY }, gallery: { ...GAL },
    swiftCross: [[-17, 32.5, -57], [41, 32.5, -57]],
    parapetWalk: [[-30, 53.5, -230.7], [40, 53.5, -230.7]],
  };

  return {
    object: root, radius: 170, height: 86, center: new THREE.Vector3(0, 30, -155), anchors,
    ground: false, groundY: 0, look: lookName, rare,
    materials: { wing: mWing, door: mDoor, leaf: mLeaf, mirror: mMirror, water: waterGlaze.material }, uniforms: shared,
    setProgress(u) { prog = u; },
    rebake() { for (let i = 0; i < 5; i++) bakeOne(i); }, bakeSun, sunDir,
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (camera) {
        eyeTmp.setFromMatrixPosition(camera.matrixWorld); root.worldToLocal(eyeTmp); shared.uEye.value.copy(eyeTmp);
        shared.uLeafNear.value = prog < 0 ? 1 : 1 - smoothstep(64, 96, Math.hypot(eyeTmp.x - SEAT[0], eyeTmp.y - SEAT[1], eyeTmp.z + 290));   // the wreath's far leaves, by the eye's distance from the porch
      }
      applyLeaves(time);
    },
    dispose() { for (const rt of rts3) rt.dispose(); rtSun.dispose(); mDepth.dispose(); },
  };
}
