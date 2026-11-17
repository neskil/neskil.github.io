// THE UNSPILLING: mid-morning in a pastry kitchen in old Istanbul, built twelve times life size, a moment after a
// disaster, with time running backwards. World space is the brief's room: x right, y up, the flight runs toward -z,
// floor y = 0; left (window) wall x = -30, right (oven) wall x = 48, z from 52 to -470. The hero (src/parts) sits at
// (0, 0, -115) and is driven by u.
//
// OUTLINE OF THIS FILE
//   helpers            rbox (bevelled box), lathe, loft (seamless ring loft with a shade per vertex), sackGeo (a tied,
//                      creased jute sack), colour mixing, the instanced-geometry helper, noNeg (a clamp added to the
//                      kit's materials), wareRouter (sends copper, brass and tin to the metal shader), consoleGeometry
//   LOOKS              three seeded looks: tea in clear morning sun / milk and eggs in honey dawn sun through mist /
//                      sherbet in low rose-amber sun; swaps: white or ginger cat, pistachios or hazelnuts, turquoise
//                      or cobalt tile. In all three the sun lies in long gold window shapes on the floor
//   floorPatch         added to the kit's floor: an inlaid border, corner lozenges and rosettes on the slabs, and the
//                      spilled sheet (amber, white or ruby) with rings running back toward the tray
//   buildShell         marble floor, window wall with dressed piers, bench and glazing bars, oven wall, vaults (plaster
//                      graded to blue-grey shade) on scrolled consoles and beams, the north wall with the serving hatch
//                      in a wide turquoise border, its copper sill and shutters. Kit light rig: the row of 4 windows,
//                      a fifth narrower window in the end bay (not in the brief; it puts sun on the laid trays), the
//                      hatch, and the door behind the entry (soft daylight only)
//   buildStreet        what is outside: far side of the street (ochre plaster, timber bay, plane-leaf shadow, a chimney
//                      whose smoke is drawn down), sky; one shader on two quads (windows, hatch)
//   buildIsland        walnut island with marble top (its south end at z -40, where the tray leans), pass shelf on
//                      brass posts, kettles, samovar, pans, mortar, pots, lemons, saucer stacks, sugar bowls; the low
//                      still lifes either side of the entry (sacks, oil tins, lemon basket, cauldron)
//   buildFittings      oven wall with hanging pans (copper shell, tinned inside, bright rolled rim), window-bench sacks
//                      and tins, apron, the walnut rack, serving counter, baklava under domes. Props leave soft contact
//                      shadows in a list that is drawn as one instanced mesh (BLOB_VERT)
//   makeNuts           11,000 instanced nuts on closed-form parabolas, two bounces and a roll, each a camera-facing card
//                      shaded as a rounded cream shell split over a green kernel; sackGeometry: the slumped pistachio
//                      sack with its rolled collar and heap, in its own jute shader
//   makeJars/makeLaid  44 instanced ribbed jars (two layers of rounded pieces behind fluted glass) that rock after the
//                      cat passes, two lids that fly home; four laid trays of glasses with the hero's clear tea
//   buildHanging       under every beam: herb bunches, strings of peppers, garlic and onion braids, copper pots
//   makeCat            one skinned mesh of sixteen bones set on the CPU from the cat clock (walk backwards on planted
//                      paws, hop, curl; the head keeps an eye on the camera), tabby bands and face painted in the
//                      shader, five instanced shells of loose fur; its wet prints dry up ahead of it; fruit rolls
//                      home to its bowl
//   makeAir            steam sinking into spouts and glasses, drops rising to the samovar tap, pigeons tail first
//   WARE / makeRays    copper and brass ware drawn with the hero's metal shader; the window beams, drawn as camera-
//                      facing slices of constant z that are shaded in world space (window mask, glazing-bar shadows,
//                      streaks, leaf dapple, dust) and hidden behind whatever is nearer
//   build              composes all of it, the path, pois, pace, post and update
//
// FLIGHT (u): 0-0.05 a clear view down the axis to the leaning tray on the island's end; 0.008-0.05 it heaves up, then
//   rolls away until 0.283, the camera swinging out to the window side so its sunlit face is seen three-quarter on;
//   0.283-0.38 THE RISE, filmed from above and behind the climbing tray: the load comes home late, so that at 0.33-0.36
//   the camera hangs 12 m off the half-laden tray with the last of the load in the air round it; seated by 0.385;
//   rare, 0.316-0.331: time catches (the clock runs forward again and the half-laden tray sags), made up by 0.357;
//   0.385-0.41 THE HOLD: the laid tray whole and still, 14 m off, for two seconds (the camera lags 7.5 m behind its
//   place on the route there: see HOLD); 0.41-0.432 the gaze
//   swings to the cat on the shelf with the room and the far hatch behind; 0.449-0.637 nuts stream up into the sack,
//   which lies on the shelf until 0.532 and is upright from 0.574 (0.50-0.54 THE STREAM: one arc of nuts from the floor
//   of the pier bay crosses the camera's way, single nuts close by); 0.605-0.62 THE PICTURE: the camera closes in on the
//   sack from the south-west, the sack a little right of centre in the third window's beam with the last nuts arcing
//   into its mouth, the cat standing clear beside it, the rack and the hatch to the left; 0.631-0.661 the cat hops
//   (backwards) round the rack's end post to its lower shelf; 0.66-0.80 the camera flies level with it and 8 m off
//   while it walks in the fourth window's beam, hops to the upper shelf at 0.743-0.772 and curls at 0.801-0.827;
//   0.807-0.832 the gaze leaves the curling cat (it slides out of the frame's right side as the camera passes it) for the
//   laid trays and the hatch, centred from 0.83; a long tray of full glasses stands before the sill; pigeons un-land 0.90-0.99. The clock of the hero is keyed to
//   legacyU(u), the nuts, sack and cat to refU(u) and tailU, so each is filmed from the places it was staged for.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import { buildHero, HERO_GLSL, makePchip } from '../parts/the-unspilling.js';

const PI = Math.PI, TAU = PI * 2, SC = 12, HZ = -115;          // HZ: the hero's origin in world z
const V3 = THREE.Vector3;
const XL = -30, XR = 48, Z0 = 52, Z1 = -470, TOP = 42;
// the brief's four street windows, and a fifth, narrower one in the end bay whose beam lies across the serving counter
const WIN = [[-40, -110], [-140, -210], [-240, -310], [-326, -410]], WIN5 = [-424, -460], ALLWIN = [...WIN, WIN5];
const MARBLE = '#ECE8DF', SHADE = '#8E9AA8', COPPER = '#B5673A', AMBER = '#C8791C', PIST = '#9DB24C', WALNUT = '#3A2A22', TURQ = '#2F8F8C';
// Kit fault worked around here: the kit's lit materials write a few strongly negative pixels (green and blue below zero on
// brass strips seen edge-on, for one). The light is clamped at zero just before it is written.
const noNeg = (m) => {
  const oc = m.onBeforeCompile, ok = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => { oc.call(m, sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = max(outgoingLight, vec3(0.));\n#include <opaque_fragment>'); };
  m.customProgramCacheKey = () => ok.call(m) + ':pos';
  return m;
};
// What is laid over the kit's marble floor, in its own shader (after the kit's pattern, before its light): every slab
// carries an inlaid border with corner lozenges, every other slab an eight-pointed rosette; and round the wreck lies the
// spilled load as one thin shining sheet whose ripples run inward, toward the place the tray left the floor. The sheet
// shrinks to nothing as the load climbs back (U.uSpill.w is set from the hero's clock).
const FLOOR_GLSL = /* glsl */`
{
  vec2 fp = vObjPos.xz, fc = floor(fp / 6.), ff = fract(fp / 6.) * 6. - 3., af = abs(ff);
  float fwp = length(fwidth(fp)), lodP = clamp(1.6 - fwp * 3.2, 0., 1.), m = max(af.x, af.y);
  float band = 1. - smoothstep(0., .05 + fwp, abs(m - 2.42) - .1), line = 1. - smoothstep(0., .04 + fwp, abs(m - 2.08) - .03);
  vec2 cq = af - vec2(2.42); float dia = 1. - smoothstep(.24, .28 + fwp, abs(cq.x) + abs(cq.y));
  float chk = mod(fc.x + fc.y, 2.), rr = length(ff), an = atan(ff.y, ff.x + (abs(ff.x) < 1e-4 ? 2e-4 : 0.));
  float pet = 1. - smoothstep(0., .08 + fwp, rr - (.72 + .58 * abs(cos(an * 4.)))), ring = 1. - smoothstep(0., .05 + fwp, abs(rr - 1.62) - .05), core = 1. - smoothstep(.3, .34 + fwp, rr);
  vec3 pc = diffuseColor.rgb;
  pc = mix(pc, uTileCol, band * .82 * lodP); pc = mix(pc, uTileCol * .55, line * .7 * lodP); pc = mix(pc, uAccCol, dia * .9 * lodP);
  pc = mix(pc, mix(uTileCol, pc, .3), chk * pet * .8 * lodP); pc = mix(pc, uTileCol * .6, chk * ring * .65 * lodP); pc = mix(pc, uAccCol, chk * core * .85 * lodP);
  // the spill
  vec2 sd = fp - uSpill.xy; float sl = length(sd), sr = sl / max(uSpill.z, 1.) + (i_fbm2(fp * .085 + 3.) - .5) * .85 + (i_n2(fp * .5) - .5) * .12;
  float sheet = (1. - smoothstep(uSpill.w - .07, uSpill.w, sr)) * step(.02, uSpill.w);
  float rim = sheet * (1. - sheet) * 4.;
  float rip = sin(sl * 2.6 + uSpillT * 2.2 + 2. * i_n2(fp * .2)) * (.5 + .5 * sin(sl * .7 - uSpillT * .6));
  pc = mix(pc, mix(pc * mix(vec3(1.), uSpillCol.rgb, .92), uSpillCol.rgb, uSpillCol.a) * (1. - .3 * rim), sheet);
  diffuseColor.rgb = pc;
  iGloss = mix(iGloss, .97, sheet); iH = mix(iH, rip * .0028, sheet * .9);
}
`;
const MARBLE_GLSL = /* glsl */`
{
  vec2 mp = vObjPos.xz; float mfw = length(fwidth(mp)), ml = clamp(1.5 - mfw * 4., 0., 1.);
  float cl = i_fbm2(mp * .07 + 11.), cl2 = i_fbm2(mp * .31 + 4.);
  vec2 wq = mp + 4.2 * vec2(i_fbm2(mp * .1 + 2.), i_fbm2(mp * .1 + 9.));
  float v1 = 1. - smoothstep(0., .028 + mfw * .5, abs(i_n2(wq * .17) - .5));                    // long veins: level lines of a warped field
  float v2 = 1. - smoothstep(0., .03 + mfw * .9, abs(i_n2(wq * .55 + 5.) - .5));                 // their branches
  float v3 = 1. - smoothstep(0., .045 + mfw * 1.6, abs(i_n2(wq * 1.7 + 13.) - .5));              // hairlines
  float vm = (.56 * v1 * (.3 + .7 * i_n2(mp * .23 + 3.)) + .3 * v2 * smoothstep(.3, .75, i_n2(mp * .13 + 7.)) + .1 * v3 * smoothstep(.45, .8, cl2)) * ml;
  vec3 mc = diffuseColor.rgb * (.88 + .2 * cl) * (.965 + .07 * cl2);
  mc = mix(mc, mc * vec3(.52, .55, .6), vm);
  mc = mix(mc, mc * vec3(1.06, 1.02, .94), smoothstep(.55, .9, i_fbm2(mp * .045 + 20.)) * .6);  // warm clouds
  diffuseColor.rgb = mc;
}
`;
// starch on the pass shelf and the island where the pastry is rolled: soft drifts, thicker in patches, matt
const DUST_GLSL = /* glsl */`
{
  vec2 dp = vObjPos.xz; float dn = i_fbm2(dp * .22 + 31.), dg = i_n2(dp * 2.6);
  float du = 0.;
  du += (1. - smoothstep(.45, 1., length((dp - vec2(19.5, -272.6)) / vec2(6.4, 5.8)) + (dn - .5) * .7));
  du += (1. - smoothstep(.45, 1., length((dp - vec2(14.2, -282.)) / vec2(3.2, 7.)) + (dn - .5) * .8)) * .7;
  du += (1. - smoothstep(.45, 1., length((dp - vec2(9., -247.)) / vec2(3.4, 6.5)) + (dn - .5) * .8)) * .8;
  du += (1. - smoothstep(.5, 1., length((dp - vec2(21.5, -166.)) / vec2(8., 16.)) + (dn - .5) * .7)) * .7;
  du += (1. - smoothstep(.45, 1., length((dp - vec2(-3.5, -391.)) / vec2(6., 4.5)) + (dn - .5) * .8)) * .8;
  du = clamp(du, 0., 1.) * (.55 + .45 * dg) * step(vObjPos.y, 20.);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.22 + vec3(.1, .095, .08), du * .8);
  iGloss = mix(iGloss, .05, du);
}
`;
// The lighting idea of the room, laid into the marble itself: where a window's sun falls the stone is a shade warmer and
// brighter, and between the beams it is a cooler, deeper blue-grey, so floor and tops read as alternating bands (the kit's
// own sun pools and glazing-bar shadows lie exactly on the bright bands). uBandK is the strength, by look.
const BAND_PARS = 'uniform vec3 uBandSun; uniform vec4 uBandWin[5]; uniform vec3 uBandShade; uniform vec3 uBandLit; uniform float uBandK;';
const BAND_GLSL = /* glsl */`
{
  vec3 bh = vObjPos + uBandSun * max((${(-30).toFixed(1)} - vObjPos.x) / min(uBandSun.x, -.05), 0.);
  float bm = 0.;
  for (int i = 0; i < 5; i++) { vec4 bw = uBandWin[i]; bm += smoothstep(bw.x - 1.3, bw.x + 1.3, bh.z) * (1. - smoothstep(bw.y - 1.3, bw.y + 1.3, bh.z)) * smoothstep(bw.z - 1.3, bw.z + 1.3, bh.y) * (1. - smoothstep(bw.w - 1.3, bw.w + 1.3, bh.y)); }
  diffuseColor.rgb *= mix(vec3(1.), mix(uBandShade, uBandLit, clamp(bm, 0., 1.)), uBandK);
}
`;
function topPatch(m, U) {
  const oc = m.onBeforeCompile, ok = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => {
    oc.call(m, sh, r); Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + BAND_PARS)
      .replace('#include <alphamap_fragment>', MARBLE_GLSL.replace('.3 * v2', '.12 * v2').replace('.1 * v3', '.03 * v3') + DUST_GLSL + BAND_GLSL + '\n#include <alphamap_fragment>');
  };
  m.customProgramCacheKey = () => ok.call(m) + ':veins';
  return m;
}
function floorPatch(m, U) {
  const oc = m.onBeforeCompile, ok = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => {
    oc.call(m, sh, r); Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uTileCol; uniform vec3 uAccCol; uniform vec4 uSpill; uniform vec4 uSpillCol; uniform float uSpillT; ' + BAND_PARS)
      .replace('#include <alphamap_fragment>', MARBLE_GLSL + FLOOR_GLSL + BAND_GLSL + '\n#include <alphamap_fragment>');
  };
  m.customProgramCacheKey = () => ok.call(m) + ':inlay';
  return m;
}
const hexMix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const S_MARBLE = INT.surf(INT.SURF.STONE, 0.55), S_PLASTER = INT.surf(INT.SURF.PLAIN, 0.05), S_WOOD = INT.surf(INT.SURF.WOOD, 0.45), S_WOODM = INT.surf(INT.SURF.WOOD, 0.2);
const S_COPPER = INT.surf(INT.SURF.PLAIN, 0.72, 1), S_BRASS = INT.surf(INT.SURF.PLAIN, 0.8, 1), S_IRON = INT.surf(INT.SURF.PLAIN, 0.4, 0.75), S_TILE = INT.surf(INT.SURF.PLAIN, 0.85);
const S_CLOTH = INT.surf(INT.SURF.FABRIC, 0.04), S_MATTE = INT.surf(INT.SURF.PLAIN, 0.1), S_GLAZE = INT.surf(INT.SURF.PLAIN, 0.9);
// copper and brass ware is not drawn by the kit material but by the hero's metal shader (a dark tinted mirror of the
// room): surf = (metal, gloss, pattern: 1 hammered, 1 - sway)
const M_COPPER = [1, 0.55, 1, 1], M_BRASS = [1, 0.78, 0, 1], M_TIN = [1, 0.5, 0, 1], S_TIN = INT.surf(INT.SURF.PLAIN, 0.6, 1);
// a builder that sends everything of copper or brass to the metal builder and the rest to the kit builder
function wareRouter(pb, mb) {
  const r = { add(geo, o = {}) { if (o.surf === S_COPPER) mb.add(geo, { ...o, surf: M_COPPER }); else if (o.surf === S_BRASS) mb.add(geo, { ...o, surf: M_BRASS }); else if (o.surf === S_TIN) mb.add(geo, { ...o, surf: M_TIN }); else pb.add(geo, o); return r; },
    quad(a, b, c, d, col, sf) { pb.quad(a, b, c, d, col, sf); return r; } };
  return r;
}

// a box with chamfered, smooth-shaded edges (108 triangles)
function rbox(w, h, d, r = 0.12) {
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3), p = g.attributes.position, n = g.attributes.normal;
  const hx = w / 2, hy = h / 2, hz = d / 2; r = Math.min(r, hx * 0.49, hy * 0.49, hz * 0.49);
  const fit = (v, hh) => (Math.abs(v) > hh * 0.5 ? Math.sign(v) * hh : Math.sign(v) * (hh - r));
  for (let i = 0; i < p.count; i++) {
    const x = fit(p.getX(i), hx), y = fit(p.getY(i), hy), z = fit(p.getZ(i), hz);
    const qx = clamp(x, -(hx - r), hx - r), qy = clamp(y, -(hy - r), hy - r), qz = clamp(z, -(hz - r), hz - r);
    const dx = x - qx, dy = y - qy, dz = z - qz, l = Math.hypot(dx, dy, dz) || 1;
    p.setXYZ(i, qx + dx / l * r, qy + dy / l * r, qz + dz / l * r); n.setXYZ(i, dx / l, dy / l, dz / l);
  }
  g.deleteAttribute('uv'); return g;
}
const tbox = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); g.deleteAttribute('uv'); return g; };       // a plain tile (12 triangles)
// a scrolled timber console under a beam end: profile in (out from the wall, down), extruded along the wall
function consoleGeometry(out = 5.4, drop = 6.6, wide = 2.3) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(out, 0); s.lineTo(out, -0.9); s.quadraticCurveTo(out * 0.86, -drop * 0.66, out * 0.34, -drop * 0.8);
  s.quadraticCurveTo(out * 0.2, -drop * 0.84, out * 0.2, -drop); s.lineTo(0, -drop); s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: wide, bevelEnabled: false, curveSegments: 5 }); g.translate(0, 0, -wide / 2); g.deleteAttribute('uv'); return g;
}
const lathe = (pts, seg = 14) => { const g = new THREE.LatheGeometry(pts.map((q) => new THREE.Vector2(Math.max(q[0], 1e-3), q[1])), seg); g.deleteAttribute('uv'); return g; };
const cyl = (rt, rb, h, seg = 10, open = false) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open); g.deleteAttribute('uv'); return g; };
const sph = (r, a = 10, b = 7) => { const g = new THREE.SphereGeometry(r, a, b); g.deleteAttribute('uv'); return g; };
const torus = (R, r, a = 6, b = 16, arc = TAU) => { const g = new THREE.TorusGeometry(R, r, a, b, arc); g.deleteAttribute('uv'); return g; };
// a loft of closed rings: nr rows of seg points from at(k, angle, out), which may return a shade (kept as a grey vertex
// colour: creases, hollows). Indexed with the ring closed on itself, so the smooth normals have no seam.
function loft(nr, seg, at, capBottom = true, capTop = true) {
  const P = [], C = [], I = [], v = new V3();
  for (let k = 0; k < nr; k++) for (let j = 0; j < seg; j++) { const sh = at(k, j / seg * TAU, v) ?? 1; P.push(v.x, v.y, v.z); C.push(sh, sh, sh); }
  for (let k = 0; k + 1 < nr; k++) for (let j = 0; j < seg; j++) { const a = k * seg + j, b = k * seg + (j + 1) % seg, c = a + seg, d = b + seg; I.push(a, c, b, b, c, d); }
  const cap = (k, flip, drop) => {
    let x = 0, y = 0, z = 0, sh = 0; for (let j = 0; j < seg; j++) { const i = (k * seg + j) * 3; x += P[i]; y += P[i + 1]; z += P[i + 2]; sh += C[i]; }
    const ci = P.length / 3; P.push(x / seg, y / seg + drop, z / seg); C.push(sh / seg, sh / seg, sh / seg);
    for (let j = 0; j < seg; j++) { const a = k * seg + j, b = k * seg + (j + 1) % seg; if (flip) I.push(ci, a, b); else I.push(ci, b, a); }
  };
  if (capBottom) cap(0, true, 0); if (capTop) cap(nr - 1, false, typeof capTop === 'number' ? capTop : 0);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
// A filled jute sack with a tied, gathered neck: slumped belly, a squarish foot, folds that deepen toward the twine and
// a ruff of cloth above it. Origin at the centre of its base. Rows are doubled at the edges of the woven bands so the
// stripes stay crisp (SACK_BAND tells a tint whether a height is in a band).
const SACK_T = [0, 0.02, 0.07, 0.15, 0.25, 0.33, 0.396, 0.40, 0.45, 0.454, 0.476, 0.48, 0.49, 0.494, 0.56, 0.64, 0.71, 0.77, 0.82, 0.855, 0.875, 0.9, 0.94, 1];
const SACK_BAND = (t) => (t > 0.398 && t < 0.452) || (t > 0.478 && t < 0.492);
const sackRad = makePchip([0, 0.02, 0.08, 0.22, 0.5, 0.7, 0.82, 0.865, 0.9, 0.94, 1], [0.7, 0.86, 0.96, 1.0, 0.93, 0.78, 0.5, 0.3, 0.36, 0.5, 0.6]);
function sackGeo(o = {}) {
  const h = o.h ?? 5, r = o.r ?? 1.9, seg = o.seg ?? 26, lean = o.lean ?? 0.3, ph = o.phase ?? 0, n = o.gathers ?? 9, ld = o.leanDir ?? 0;
  return loft(SACK_T.length, seg, (k, a, out) => {
    const t = SACK_T[k], d = 0.04 + 0.5 * smoothstep(0.5, 0.86, t), fold = Math.pow(0.5 + 0.5 * Math.cos(n * a + ph + 2.2 * t), 2);
    const sag = 1 + 0.09 * Math.cos(a - ld) * (1 - t) + 0.05 * Math.cos(4 * a + ph) * (1 - t) + 0.035 * Math.sin(3 * a - ph * 2 + t * 5) * smoothstep(0, 0.2, t);
    const rr = r * sackRad(t) * (1 - 0.6 * d * fold) * sag * (1 + 0.03 * Math.sin(t * 31 + a * 2 + ph) * smoothstep(0.05, 0.4, t) * (1 - smoothstep(0.6, 0.8, t)));
    const off = lean * t * t * h * 0.16;
    out.set(Math.cos(a) * rr + Math.cos(ld) * off, t * h + (t > 0.87 ? 0.035 * h * Math.sin(n * 0.5 * a + ph) * (t - 0.87) / 0.13 : 0) - 0.02 * h * smoothstep(0.3, 0, t) * Math.max(0, Math.cos(a - ld)) * 0, Math.sin(a) * rr + Math.sin(ld) * off);
    return (1 - 0.75 * d * fold) * (0.72 + 0.28 * smoothstep(0, 0.12, t)) * (t > 0.99 ? 0.5 : 1);
  }, true, -0.07 * h);
}
function instanced(base, count, attrs) {
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][0], attrs[k][1]));
  g.instanceCount = count; return g;
}
const QUAD = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };

// ------------------------------------------------------------------------------------------------ the three looks
// sunI / fill / amb / bounce feed the kit rig (irradiance); heroSun / heroSky / heroFill / heroBounce are the same light
// as radiance for the own shaders (shards, tea, copper, nuts, cat). wall / vault: plaster in shade, darker overhead.
// rays: gain of the slanting beams in the air.
const LOOKS = [
  { name: 'tea', load: 'tea', band: 1, sunDir: [-0.86, 0.34, -0.38], sunColor: '#ffdfab', sunI: 9.5, beams: 1, ambSky: '#94a3b8', ambGround: '#c4aa88', amb: 0.78, fill: 3.0, bounce: 2.0,
    fog: '#8f8e8c', fogD: 0.0013, skyTop: '#A9C4DC', skyLow: '#e6e6de', wallSun: 1, plaster: '#d9a654', accent: AMBER, lift: 0.85, exposure: 0.98, tint: '#fff8ee', shadowTint: '#0a1222', sat: 1.1, saucer: null,
    wall: '#c5c5c1', vault: '#aab2be', walnut: '#4c362b', copper: COPPER, ware: [1.0, 0.86, 0.74], heroSun: [2.25, 1.92, 1.46], heroSky: 0.62, heroFill: '#272f39', heroBounce: '#64503a', window: 9, rays: 1.15, rayCol: '#ffe6bd', raySoft: 1.3, street: 0.92,
    rug: ['#8c2a22', '#1d2f5c', '#e2d3ae', '#c08a2c'], fruit: '#e6c21c' },
  // dawn: a low honey sun through thin mist, soft-edged beams, pearl shade; the load is white on white with yolks
  { name: 'milk', load: 'milk', sunDir: [-0.88, 0.27, -0.38], sunColor: '#ffd29a', sunI: 8.6, beams: 0.9, ambSky: '#aebccf', ambGround: '#b2b4b8', amb: 0.66, fill: 3.4, bounce: 1.3,
    fog: '#a2a9b1', fogD: 0.0014, lift: 1, skyTop: '#cfd8e0', skyLow: '#eef0ee', wallSun: 0.6, plaster: '#d2b486', accent: '#e8b21c', exposure: 1.0, tint: '#f4f7ff', shadowTint: '#101a2e', sat: 0.98, saucer: '#6f8196',
    wall: '#c3c8ce', vault: '#b7bcc6', walnut: '#3a2e2a', copper: COPPER, ware: [0.8, 0.8, 0.83], heroSun: [2.1, 1.8, 1.36], heroSky: 0.68, heroFill: '#343f4e', heroBounce: '#4c4a48', window: 9.5, rays: 1.25, rayCol: '#ffe2b8', raySoft: 3.2, street: 1.0,
    rug: ['#3c4c68', '#6c727e', '#e6e3da', '#c9a23a'], fruit: '#e8c020' },
  { name: 'sherbet', load: 'sherbet', sunDir: [-0.91, 0.21, -0.37], sunColor: '#ffb884', sunI: 14.5, beams: 1, ambSky: '#6e73ac', ambGround: '#8c7482', amb: 0.5, fill: 2.0, bounce: 1.2,
    fog: '#655e7a', fogD: 0.0014, skyTop: '#b9b6cf', skyLow: '#f0cdb6', wallSun: 1, plaster: '#e09a5c', accent: '#c2283a', lift: 0.8, exposure: 1.02, tint: '#fff3ea', shadowTint: '#120c28', sat: 1.14, saucer: null,
    wall: '#b4adc2', vault: '#b6afc4', walnut: '#4a342b', copper: COPPER, ware: [1.0, 0.84, 0.74], heroSun: [2.7, 1.7, 1.1], heroSky: 0.46, heroFill: '#1f2238', heroBounce: '#4c3636', window: 8, rays: 0.8, rayCol: '#ffc296', raySoft: 1.3, street: 0.9,
    rug: ['#5a1c46', '#16305e', '#e8d2b8', '#c8862c'], fruit: '#a01c2c' },
];

// ------------------------------------------------------------------------------------------------ the room shell
// Returns { floor, tops, wb, tb }. Everything is in world space = rig space. Plaster and vault are a blue-grey that
// darkens upward, so shade sits well under the sun patches and the ceiling is lost in haze; mb takes the copper.
const HATCH = { w: 22, y0: 10.8, y1: 28.8, r: 11 };
async function buildShell(ctx, rig, L, tile, mb, fxU) {
  const plaster = L.wall, marble = hexMix(MARBLE, '#000000', 0.2), marbleD = hexMix(marble, '#a09684', 0.5), beam = hexMix(L.walnut, '#9a6a3c', 0.5), consoleC = hexMix(L.walnut, '#b88a58', 0.62);
  const white = '#d8d5cd', tileL = hexMix(tile, '#ffffff', 0.2), tileD = hexMix(tile, '#000000', 0.25);
  // floor: white marble slabs 6 m square, grey veins, brass joint strips
  const fb = INT.makeBuilder();
  fb.quad([XL, 0, Z0], [XR, 0, Z0], [XR, 0, Z1], [XL, 0, Z1], '#ffffff');
  fb.tessellate(13);
  await ctx.yield();
  const floorMat = INT.interiorMaterial({ rig, pattern: 'floor', mode: 3, colors: [hexMix('#efe7d6', '#000000', 0.27), hexMix('#e2d2b4', '#000000', 0.27), hexMix('#8c8274', '#3a4048', 0.3), '#a8772c'],
    patA: [0.5, 0.0045, 0, 0.5], patB: [0.7, 0, 0, 0] });
  const floor = new THREE.Mesh(fb.build(), floorMat); floor.name = 'floor';
  await ctx.yield();
  // the marble tops (pass shelf, island, serving counter) carry the same slabs, veins and brass strips
  const tq = INT.makeBuilder(), top = (x0, x1, z0, z1, y) => tq.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], '#ffffff');
  top(12, 30, ISL.z0, ISL.z1, 18.008); top(5.4, 30.6, ISL.z0 + 0.6, ISL.z1 - 0.6, 10.808); top(-12.7, 12.7, -384.65, Z1, 10.808);
  tq.tessellate(11);
  await ctx.yield();
  const topMat = INT.interiorMaterial({ rig, pattern: 'floor', mode: 3, colors: [hexMix('#ece4d4', '#000000', 0.4), hexMix('#ddd0b8', '#000000', 0.42), hexMix('#8c8274', '#3a4048', 0.4), '#a8772c'], patA: [0.5, 0.0045, 0, 0.6], patB: [0.7, 0, 0, 0] });
  topMat.polygonOffset = true; topMat.polygonOffsetFactor = -2; topMat.polygonOffsetUnits = -2;
  noNeg(floorMat); noNeg(topMat); floorPatch(floorMat, fxU); topPatch(topMat, { uBandSun: fxU.uBandSun, uBandWin: fxU.uBandWin, uBandShade: fxU.uBandShade, uBandLit: fxU.uBandLit, uBandK: fxU.uBandK });
  const tops = new THREE.Mesh(tq.build(), topMat); tops.name = 'tops';
  await ctx.yield();

  const wb = INT.makeBuilder(), tb = INT.makeBuilder();   // wb: big flat faces (tessellated); tb: trim and mouldings
  const tone = (y) => hexMix(plaster, L.vault, 0.85 * smoothstep(9, 40, y));          // whitewashed plaster, a shade deeper toward the vault
  const wallX = (x, n, z0, z1, y0, y1, c, sf) => { const a = Math.max(z0, z1), b = Math.min(z0, z1); if (n > 0) wb.quad([x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a], c, sf); else wb.quad([x, y0, b], [x, y0, a], [x, y1, a], [x, y1, b], c, sf); };
  const wallG = (x, n, z0, z1, y0, y1) => { const cuts = [0, 8, 16, 24, 31, 38, TOP].filter((y) => y > y0 && y < y1); const ys = [y0, ...cuts, y1]; for (let i = 0; i + 1 < ys.length; i++) wallX(x, n, z0, z1, ys[i], ys[i + 1], tone((ys[i] + ys[i + 1]) / 2), S_PLASTER); };
  // window wall: plaster piers and bands; marble pilasters, sill, cornice; deep reveals
  const segs = [[Z0, ALLWIN[0][0]]]; for (let i = 0; i < ALLWIN.length; i++) segs.push([ALLWIN[i][1], i + 1 < ALLWIN.length ? ALLWIN[i + 1][0] : Z1]);
  for (const [a, b] of segs) {
    wallG(XL, 1, a, b, 0, TOP);
    const wd = Math.abs(a - b);
    if (wd < 40 && wd > 12) {                               // a pier between two windows: pilaster, base, capital
      const zc = (a + b) / 2, pw = Math.min(14, wd - 4);
      tb.add(rbox(1.6, 34, pw, 0.3), { p: [XL + 0.8, 21, zc], c: marble, surf: S_MARBLE, grad: [8, 38, 1, 0.62] });
      tb.add(rbox(2.6, 3.2, pw + 3, 0.4), { p: [XL + 1.3, 1.6, zc], c: marbleD, surf: S_MARBLE });
      tb.add(rbox(2.4, 1.4, pw + 2.4, 0.3), { p: [XL + 1.2, 37.4, zc], c: hexMix(marble, L.vault, 0.4), surf: S_MARBLE });
      tb.add(rbox(3.2, 1.0, pw + 4, 0.3), { p: [XL + 1.6, 38.6, zc], c: hexMix(marble, L.vault, 0.4), surf: S_MARBLE });
      await ctx.yield();
      if (wd > 20) {
        // what hangs on it: a tiled panel in a turquoise frame, a rail of copper ladles and sieves, a shelf of pots
        for (const [py, ph, pz, pd] of [[9.2, 0.7, 0, 11.4], [19.2, 0.7, 0, 11.4], [14.2, 9.3, -5.35, 0.7], [14.2, 9.3, 5.35, 0.7]]) tb.add(tbox(0.5, ph, pd), { p: [XL + 1.75, py, zc + pz], c: tile, surf: S_TILE });
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const dia = (i === 1 || i === 2) && (j === 1 || j === 2); tb.add(tbox(0.36, 2.2, 2.38), { p: [XL + 1.72, 10.75 + j * 2.3, zc - 3.75 + i * 2.5], c: dia ? tileL : hexMix('#000000', white, 0.82 + 0.18 * (((i * 3 + j * 5) % 4) / 3)), surf: S_TILE }); }
        tb.add(rbox(0.9, 0.9, 0.9, 0.2), { p: [XL + 1.9, 14.2, zc], r: [PI / 4, 0, 0], c: tileD, surf: S_TILE });
        await ctx.yield();
        mb.add(cyl(0.13, 0.13, 11, 6), { p: [XL + 2.5, 22.4, zc], r: [PI / 2, 0, 0], c: '#d2a84e', surf: M_BRASS });
        for (let i = 0; i < 5; i++) {
          const z = zc - 4.4 + i * 2.2, len = 1.6 + (i % 2) * 0.9, r = 0.75 + ((i * 7) % 3) * 0.22;
          mb.add(cyl(0.07, 0.07, len, 5), { p: [XL + 2.5, 22.4 - len / 2, z], c: COPPER, surf: M_COPPER });
          const bowl = lathe([[0.02, 0], [r * 0.7, 0.04], [r, 0.4], [r * 1.04, 0.5], [r * 0.94, 0.3], [r * 0.6, 0.14]], 12); bowl.rotateZ(-PI / 2);
          mb.add(bowl, { p: [XL + 2.2, 22.4 - len - r, z], c: i % 2 ? '#c9a24e' : COPPER, surf: i % 2 ? M_BRASS : M_COPPER });
        }
        await ctx.yield();
        tb.add(rbox(2.6, 0.5, 12, 0.15), { p: [XL + 2.4, 26.2, zc], c: marble, surf: S_MARBLE });
        for (const s of [-1, 1]) tb.add(consoleGeometry(2.2, 2.4, 0.7), { p: [XL + 1.6, 25.95, zc + s * 4.6], c: marbleD, surf: S_MARBLE });
        for (let i = 0; i < 4; i++) { const z = zc - 4.2 + i * 2.8, k = 0.85 + ((i * 5) % 3) * 0.14;
          if (i % 2) mb.add(lathe([[0.02, 0], [0.8, 0], [1.05, 0.5], [0.95, 1.5], [0.55, 2.1], [0.45, 2.5], [0.6, 2.62], [0.02, 2.66]], 12), { p: [XL + 2.5, 26.45, z], s: k, c: COPPER, surf: M_COPPER });
          else tb.add(lathe([[0.02, 0], [0.7, 0], [1.1, 0.7], [1.0, 1.7], [0.5, 2.2], [0.55, 2.5], [0.02, 2.5]], 12), { p: [XL + 2.5, 26.45, z], s: k, c: i ? '#e2ddd2' : tile, surf: S_GLAZE }); }
      } else for (let k = -1; k <= 1; k++) tb.add(rbox(0.7, 22, 1.0, 0.2), { p: [XL + 1.75, 20, zc + k * 2.8], c: hexMix(marble, '#ffffff', 0.2), surf: S_MARBLE });
    }
    await ctx.yield();
  }
  for (const [a, b] of ALLWIN) {
    const zc = (a + b) / 2, w = a - b, nl = Math.round(w / 14);
    wallG(XL, 1, a, b, 0, 8); wallG(XL, 1, a, b, 38, TOP);
    // reveals (3 m deep), sill slab, head
    wb.quad([XL, 8, a], [XL - 3, 8, a], [XL - 3, 38, a], [XL, 38, a], plaster, S_PLASTER); wb.quad([XL, 8, b], [XL, 38, b], [XL - 3, 38, b], [XL - 3, 8, b], plaster, S_PLASTER);
    wb.quad([XL, 38, a], [XL - 3, 38, a], [XL - 3, 38, b], [XL, 38, b], plaster, S_PLASTER); wb.quad([XL - 3, 8, a], [XL, 8, a], [XL, 8, b], [XL - 3, 8, b], marble, S_MARBLE);
    tb.add(rbox(2.6, 0.9, w + 3, 0.25), { p: [XL + 0.6, 7.75, zc], c: marble, surf: S_MARBLE });
    tb.add(rbox(1.4, 1.6, w + 2, 0.3), { p: [XL + 0.5, 38.9, zc], c: hexMix(marble, L.vault, 0.4), surf: S_MARBLE });
    await ctx.yield();
    // glazing bars: dark painted timber, lights 14 m wide and three up, with a heavier frame
    const bar = '#2c3a40';
    for (let i = 0; i <= nl; i++) tb.add(rbox(0.9, 30, i % nl ? 0.7 : 1.3, 0.12), { p: [XL - 1.5, 23, a - (i / nl) * w + (i === 0 ? -0.6 : i === nl ? 0.6 : 0)], c: bar, surf: S_MATTE });
    for (let j = 0; j <= 3; j++) tb.add(rbox(0.9, j % 3 ? 0.7 : 1.3, w, 0.12), { p: [XL - 1.5, 8 + j * 10 + (j === 0 ? 0.6 : j === 3 ? -0.6 : 0), zc], c: bar, surf: S_MATTE });
    // the marble bench under the window, on bracketed feet
    tb.add(rbox(6, 0.9, w - 4, 0.3), { p: [XL + 3.2, 4.6, zc], c: marble, surf: S_MARBLE });
    const nf = Math.max(2, Math.round(w / 18));
    for (let k = 0; k < nf; k++) tb.add(rbox(4.6, 4.2, 1.6, 0.35), { p: [XL + 2.6, 2.1, a - 5 - k * (w - 10) / (nf - 1)], c: marbleD, surf: S_MARBLE });
    await ctx.yield();
  }
  // skirting and a dado line the whole length
  tb.add(rbox(0.5, 0.5, Z0 - Z1, 0.15), { p: [XL + 0.3, 6.2, (Z0 + Z1) / 2], c: tile, surf: S_TILE });
  // oven wall: tile in courses of slightly varied slabs up to 24 m (the lowest course a grey-blue dado that takes
  // the low sun without glaring), a band of turquoise lozenges, plaster above
  wallG(XR, -1, Z0, Z1, 24, TOP);
  const cw = 9;
  for (let z = Z0, i = 0; z > Z1; z -= cw, i++) for (let j = 0; j < 4; j++) {
    const k = 0.8 + 0.2 * (((i * 7 + j * 13) % 5) / 4), base = j === 0 ? hexMix(SHADE, '#3c4650', 0.35) : hexMix(white, L.vault, j * 0.12);
    wb.quad([XR, j * 6, Math.max(z - cw, Z1)], [XR, j * 6, z], [XR, j * 6 + 6, z], [XR, j * 6 + 6, Math.max(z - cw, Z1)], hexMix('#000000', base, k), S_TILE);
  }
  await ctx.yield();
  tb.add(rbox(0.5, 1.4, Z0 - Z1, 0.15), { p: [XR - 0.2, 24.4, (Z0 + Z1) / 2], c: tile, surf: S_TILE });
  tb.add(rbox(0.4, 0.5, Z0 - Z1, 0.12), { p: [XR - 0.2, 12, (Z0 + Z1) / 2], c: tile, surf: S_TILE });
  tb.add(rbox(0.4, 0.5, Z0 - Z1, 0.12), { p: [XR - 0.2, 6.1, (Z0 + Z1) / 2], c: tileD, surf: S_TILE });
  for (let z = Z0 - 3, i = 0; z > Z1 + 2; z -= 4.5, i++) tb.add(tbox(0.3, 1.5, 1.5), { p: [XR - 0.12, 14.1, z], r: [PI / 4, 0, 0], c: i % 2 ? tile : tileL, surf: S_TILE });
  await ctx.yield();
  // south wall (behind the entry)
  for (const [y0, y1] of [[0, 14], [14, 28], [28, TOP]]) wb.quad([XR, y0, Z0], [XL, y0, Z0], [XL, y1, Z0], [XR, y1, Z0], tone((y0 + y1) / 2), S_PLASTER);
  // north wall with the arched hatch: a shape with a hole
  {
    const s = new THREE.Shape(); s.moveTo(XL, 0); s.lineTo(XR, 0); s.lineTo(XR, TOP); s.lineTo(XL, TOP); s.lineTo(XL, 0);
    const h = new THREE.Path(), yS = HATCH.y1 - HATCH.r; h.moveTo(-HATCH.r, HATCH.y0); h.lineTo(-HATCH.r, yS); h.absarc(0, yS, HATCH.r, PI, 0, true); h.lineTo(HATCH.r, HATCH.y0); h.lineTo(-HATCH.r, HATCH.y0);
    s.holes.push(h);
    const g = new THREE.ShapeGeometry(s, 20); g.deleteAttribute('uv');
    wb.add(g, { p: [0, 0, Z1], c: plaster, surf: S_PLASTER, tint: (X, Y, Z, col) => col.set(tone(Y)) });
    await ctx.yield();
    // the intrados of the arch (wall 4 m thick) in white tile, and the tiled frame: a white fillet, a wide turquoise
    // border of two tones with white joints, a white outer fillet
    const N = 26, pt = (i, r) => { const t = i / N; if (t < 0.2) return [-r, lerp(HATCH.y0, yS, t / 0.2)]; if (t > 0.8) return [r, lerp(yS, HATCH.y0, (t - 0.8) / 0.2)]; const a = PI - (t - 0.2) / 0.6 * PI; return [Math.cos(a) * r, yS + Math.sin(a) * r]; };
    for (let i = 0; i < N; i++) {
      const p0 = pt(i, HATCH.r), p1 = pt(i + 1, HATCH.r);
      wb.quad([p0[0], p0[1], Z1], [p1[0], p1[1], Z1], [p1[0], p1[1], Z1 - 4], [p0[0], p0[1], Z1 - 4], i % 2 ? '#e2dfd6' : '#d2d0c8', S_TILE);
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const o1 = pt(i + 0.5, HATCH.r + 0.75), o2 = pt(i + 0.5, HATCH.r + 3.2), o3 = pt(i + 0.5, HATCH.r + 5.55);
      tb.add(tbox(len * 1.03, 1.4, 0.5), { p: [o1[0], o1[1], Z1 + 0.25], r: [0, 0, ang], c: i % 2 ? '#e9e6dd' : '#dcd9d0', surf: S_TILE });
      tb.add(tbox(len * 1.2, 3.3, 0.8), { p: [o2[0], o2[1], Z1 + 0.4], r: [0, 0, ang], c: i % 2 ? tile : tileL, surf: S_TILE });
      tb.add(tbox(0.7, 0.7, 0.3), { p: [o2[0], o2[1], Z1 + 0.86], r: [0, 0, ang + PI / 4], c: '#e9e6dd', surf: S_TILE });
      tb.add(tbox(len * 1.4, 1.1, 0.5), { p: [o3[0], o3[1], Z1 + 0.25], r: [0, 0, ang], c: '#e9e6dd', surf: S_TILE });
      if ((i & 3) === 3) await ctx.yield();
    }
    // the tiled field round the arch (white tiles, a few turquoise) inside a turquoise fillet
    const R2 = HATCH.r + 6.3, tw = 2.6;
    for (let i = -8; i < 8; i++) for (let j = 0; j < 10; j++) {
      if (j === 0 && (i & 3) === 0) await ctx.yield();
      const x = (i + 0.5) * tw, y = 11.9 + (j + 0.5) * tw, dy = Math.max(y - yS, 0), inside = Math.abs(x) < R2 && (y < yS || Math.hypot(x, dy) < R2);
      if (inside) continue;
      const accent = ((i * 5 + j * 3) % 11 + 11) % 11 === 0;
      tb.add(tbox(tw - 0.14, tw - 0.14, 0.3), { p: [x, y, Z1 + 0.15], c: accent ? tileL : hexMix('#000000', white, 0.8 + 0.2 * ((((i * 7 + j * 13) % 5) + 5) % 5) / 4), surf: S_TILE });
    }
    tb.add(tbox(42.6, 0.8, 0.5), { p: [0, 38.3, Z1 + 0.25], c: tile, surf: S_TILE });
    for (const sx of [-1, 1]) tb.add(tbox(0.8, 27.2, 0.5), { p: [sx * 21.2, 25.1, Z1 + 0.25], c: tile, surf: S_TILE });
    await ctx.yield();
    // copper lip to the sill with a rolled edge, and a folded wooden shutter each side (three louvred leaves)
    mb.add(rbox(24, 0.6, 5.4, 0.25), { p: [0, HATCH.y0 + 0.1, Z1 - 1.6], c: COPPER, surf: M_COPPER });
    mb.add(cyl(0.5, 0.5, 24, 10), { p: [0, HATCH.y0 + 0.25, Z1 + 1.15], r: [0, 0, PI / 2], c: COPPER, surf: M_COPPER });
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x = sx * (17.5 + k * 1.1), ry = sx * (k % 2 ? 0.5 : -0.5);
      // (sun-bleached sage paint: a framed leaf with a mid rail, slats that catch the light on their upper faces, a brass ring)
      const zk = Z1 + 1.2 + k * 0.5, leaf = hexMix('#8fae9f', '#6f9186', 0.35 * k), frame = hexMix('#b4cdbd', '#93b3a4', 0.35 * k);
      tb.add(rbox(3.6, 17, 0.5, 0.15), { p: [x, 19.5, zk], r: [0, ry, 0], c: leaf, surf: S_MATTE });
      for (const dx of [-1.55, 1.55]) tb.add(tbox(0.5, 17, 0.3), { p: [x + dx * Math.cos(ry), 19.5, zk + 0.3 - dx * Math.sin(ry)], r: [0, ry, 0], c: frame, surf: S_MATTE });
      for (const y of [11.3, 19.5, 27.7]) tb.add(tbox(2.7, 0.6, 0.3), { p: [x, y, zk + 0.3], r: [0, ry, 0], c: frame, surf: S_MATTE });
      for (let j = 0; j < 9; j++) { if (j === 4) continue; tb.add(tbox(2.7, 1.0, 0.22), { p: [x, 12.6 + j * 1.72, zk + 0.32], r: [0.55, ry, 0], c: j % 2 ? '#a9c6b6' : '#9dbcad', surf: S_MATTE }); }
      if (k === 0) mb.add(torus(0.42, 0.09, 5, 12), { p: [x - sx * 1.1, 18.2, zk + 0.75], r: [0, ry, 0], c: '#c9a04a', surf: M_BRASS });
    }
  }
  await ctx.yield();
  // ceiling: segmental vaults springing from dark transverse beams every 30 m, wall plates, scrolled consoles
  const bays = Math.round((Z0 - Z1) / 29), bl = (Z0 - Z1) / bays, K = 8;
  for (let b = 0; b < bays; b++) {
    const za = Z0 - b * bl;
    for (let k = 0; k < K; k++) {
      const z0 = za - (k / K) * bl, z1 = za - ((k + 1) / K) * bl, y0 = 38.5 + 4.5 * Math.sin(PI * k / K), y1 = 38.5 + 4.5 * Math.sin(PI * (k + 1) / K);
      const c = hexMix('#000000', L.vault, 0.84 + 0.13 * Math.sin(PI * (k + 0.5) / K) + 0.03 * ((k + b) % 2));
      for (let i = 0; i < 3; i++) { const xa = XL + (i / 3) * (XR - XL), xb = XL + ((i + 1) / 3) * (XR - XL); wb.quad([xa, y0, z0], [xa, y1, z1], [xb, y1, z1], [xb, y0, z0], c, S_PLASTER); }
    }
    if (b) {
      tb.add(rbox(XR - XL, 3.4, 2.6, 0.4), { p: [(XL + XR) / 2, 38.2, za], c: beam, surf: S_WOODM });
      tb.add(rbox(XR - XL - 12, 0.7, 3.2, 0.2), { p: [(XL + XR) / 2, 36.4, za], c: hexMix(beam, '#c89a5c', 0.3), surf: S_WOODM });
      tb.add(consoleGeometry(), { p: [XL, 36.5, za], c: consoleC, surf: S_WOODM });
      tb.add(consoleGeometry(), { p: [XR, 36.5, za], r: [0, PI, 0], c: consoleC, surf: S_WOODM });
    }
    if ((b & 3) === 3) await ctx.yield();
  }
  await ctx.yield();
  wb.tessellate(14);
  await ctx.yield();
  tb.tessellate(16, 3.5);
  return { floor, tops, wb, tb };
}

// ------------------------------------------------------------------------------------------------ the street outside
// One shader on two big quads (beyond the four windows; beyond the hatch): the far side of a narrow street, ochre
// plaster with shuttered windows, a dark timber bay, a tiled eave, a chimney whose smoke is drawn back down, the
// moving shadow of a plane tree, and above it a pale sky that never clips.
const STREET_VERT = /* glsl */`
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const STREET_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uPlaster; uniform vec3 uSkyTop; uniform vec3 uSkyLow; uniform vec3 uSun; uniform vec4 uP;   // uP: axis (0 = z, 1 = x), wash, sun amount, gain
varying vec3 vW;
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p) { return .5 * vn(p) + .25 * vn(p * 2.03 + 7.) + .125 * vn(p * 4.1 + 13.) + .0625 * vn(p * 8.3 + 3.); }
float box(vec2 p, vec2 c, vec2 h, float s) { vec2 d = abs(p - c) - h; return 1. - smoothstep(0., s, max(d.x, d.y)); }
void main() {
  float a = mix(vW.z, vW.x, uP.x), y = vW.y;
  float eave = 58. + 3. * step(.5, fract(a / 190. + .2));
  // sky
  float sv = clamp((y - 40.) / 70., 0., 1.);
  vec3 sky = mix(uSkyLow, uSkyTop, smoothstep(0., .8, sv));
  sky = mix(sky, vec3(.95, .95, .93), .32 * smoothstep(.45, .8, fbm(vec2(a * .012 + uTime * .006, y * .03))));
  // plaster wall
  vec3 col = uPlaster * (.82 + .3 * fbm(vec2(a, y) * .07) + .08 * vn(vec2(a, y) * .9));
  col *= 1. - .25 * (1. - smoothstep(0., 8., y)) - .12 * smoothstep(50., 58., y);                      // damp foot, shade under the eave
  float house = floor(a / 95. + .3); col *= .9 + .2 * h21(vec2(house, 3.));                      // house fronts differ
  col = mix(col, col * vec3(.82, .9, 1.04), step(.6, h21(vec2(house, 9.))) * .5);
  // windows: shuttered, stone frames, three floors
  vec2 c = vec2((floor(a / 19.) + .5) * 19., 0.);
  for (int f = 0; f < 3; f++) {
    float cy = 14. + float(f) * 15.;
    float fr = box(vec2(a, y), vec2(c.x, cy), vec2(4.2, 5.6), .25), gl = box(vec2(a, y), vec2(c.x, cy), vec2(3.4, 4.8), .2);
    float lou = .75 + .25 * step(.5, fract(y * 1.3));
    vec3 sh = mix(vec3(.16, .25, .26), vec3(.05, .07, .09), step(.55, h21(vec2(floor(a / 19.), float(f)))));
    col = mix(col, vec3(.72, .68, .6), fr * .8); col = mix(col, sh * lou, gl);
    col *= 1. - .3 * box(vec2(a, y), vec2(c.x + 1., cy - 6.6), vec2(4.6, .9), 1.2);              // sill shadow
  }
  // the dark timber bay on brackets
  float bz = (floor(a / 152. + .35) + .5 - .35) * 152.;
  float bay = box(vec2(a, y), vec2(bz, 31.), vec2(13., 9.), .3);
  vec3 tim = vec3(.085, .06, .045) * (.8 + .5 * vn(vec2(a * 3., y * .3)));
  tim = mix(tim, vec3(.03, .05, .07), box(vec2(mod(a - bz + 13., 6.5), y), vec2(3.25, 32.), vec2(2., 4.8), .2));
  tim = mix(tim, vec3(.2, .13, .08), step(.9, fract(y * .45)) * .5);
  col = mix(col, tim, bay);
  col *= 1. - .45 * box(vec2(a, y), vec2(bz + 2., 19.5), vec2(14., 2.8), 2.5);                  // its shadow below
  // plane-tree shadow: big soft leaf masses that sway, with flickering gaps
  float sway = sin(uTime * .9 + a * .02) * 4.5 + sin(uTime * 1.4 + y * .05) * 2.;
  float leaf = fbm(vec2(a + sway, y - sway * .5) * .05 + vec2(0., uTime * .01));
  float fine = vn(vec2(a + sway * 1.6, y + sway) * .42 + uTime * .12);
  float shade = smoothstep(.42, .6, leaf + .16 * (fine - .5)) * (1. - smoothstep(30., 64., y)) * (.55 + .45 * sin(a * .011 + 1.));
  vec3 lit = col * (uSun * uP.z + vec3(.36, .42, .52));
  vec3 shd = col * vec3(.3, .36, .5);
  col = mix(lit, shd, clamp(shade, 0., 1.) * uP.z + (1. - uP.z) * .0);
  // tiled eave and roof, chimney
  float roof = smoothstep(eave - 1.2, eave - .6, y);
  vec3 tiles = vec3(.42, .2, .13) * (.7 + .5 * step(.5, fract(a * .55 + floor(y * .9) * .5))) * (uSun * .5 * uP.z + .45);
  col = mix(col, tiles, roof);
  float cz = (floor(a / 118.) + .5) * 118. + 21.;
  float chim = box(vec2(a, y), vec2(cz, eave + 9.), vec2(2.6, 6.), .3);
  float top = smoothstep(eave + 6.5 + 1.5 * sin(a * .08), eave + 7.5 + 1.5 * sin(a * .08), y);
  col = mix(col, sky, top);
  col = mix(col, vec3(.3, .2, .16) * (uSun * .6 * uP.z + .5), chim);
  // smoke drawn DOWN into the chimney: a plume whose pattern flows toward its root
  vec2 sp = vec2(a - cz - (y - eave - 15.) * .55, y - eave - 15.);
  float plume = smoothstep(0., 4., sp.y) * (1. - smoothstep(10., 42., sp.y)) * (1. - smoothstep(1.5 + sp.y * .32, 3.5 + sp.y * .42, abs(sp.x + 2.5 * sin(sp.y * .16 + uTime * .5))));
  plume *= .35 + .65 * fbm(vec2(sp.x * .2, sp.y * .13 + uTime * .55));
  col = mix(col, vec3(.74, .74, .76), plume * .55);
  float mist = fbm(vec2(a * .018 + uTime * .16, y * .05 - uTime * .035));
  col = mix(col, vec3(.8, .82, .84), (1. - uP.z) * .6 * smoothstep(.3, .68, mist));               // overcast: mist drifting down the street
  col = mix(col, vec3(.86, .88, .9), uP.y);                                                      // haze of the street
  gl_FragColor = vec4(max(col * uP.w, 0.), 1.);
}`;
function buildStreet(L, timeU) {
  const g = new THREE.Group(); g.name = 'street';
  const mk = (axis, wash, gain) => new THREE.ShaderMaterial({ vertexShader: STREET_VERT, fragmentShader: STREET_FRAG, side: THREE.DoubleSide, uniforms: { uTime: timeU,
    uPlaster: { value: new THREE.Color(L.plaster) }, uSkyTop: { value: new THREE.Color(L.skyTop) }, uSkyLow: { value: new THREE.Color(L.skyLow) },
    uSun: { value: new THREE.Color(L.sunColor).multiplyScalar(1.15) }, uP: { value: new THREE.Vector4(axis, wash, L.wallSun, gain) } } });
  const side = new THREE.Mesh(new THREE.PlaneGeometry(700, 190), mk(0, 0.1, L.street)); side.rotation.y = PI / 2; side.position.set(XL - 34, 65, -200);
  const end = new THREE.Mesh(new THREE.PlaneGeometry(420, 190), mk(1, 0.34, 0.8 * L.street)); end.position.set(0, 65, Z1 - 52);
  // the pavement and the street between, seen low through the windows and the hatch
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#8d8a84').multiplyScalar(0.55 + 0.25 * L.wallSun) }));
  pave.rotation.x = -PI / 2; pave.scale.set(160, 760, 1); pave.position.set(XL - 60, -1.5, -230);
  const pave2 = pave.clone(); pave2.scale.set(420, 70, 1); pave2.position.set(0, HATCH.y0 - 14, Z1 - 30);
  g.add(side, end, pave, pave2);
  return g;
}

// ------------------------------------------------------------------------------------------------ island, shelf, props
// The island's south end, and the tray leaning on it, stand 26 m nearer the entry than the brief has them (z -40, not
// -66), so the disc is half as large again in the first view; the sack sits 16 m further north (z -278), so that it
// is seen three-quarter on, down the shelf, while its nuts arrive.
const ISL = { x0: 6, x1: 30, z0: -40, z1: -290, top: 10.8 }, SHELF = { x0: 12, x1: 30, top: 18 }, SACK_Z = -280;
// the sack: it stands at (18, 18, SACK_Z) and, tipped, lies along the shelf to the south, its mouth to the oncoming camera
const SACK = { x: 18, h: 7.6, r: 3.2, off: 3.1, hm: 7.5 };
const sackMouth = (th, out) => out.set(SACK.x, SHELF.top + SACK.hm * Math.cos(th) + SACK.off * Math.sin(th), SACK_Z + SACK.off + SACK.hm * Math.sin(th) - SACK.off * Math.cos(th));
// the nut clock: 9 s of forward time played back over refU 0.447-0.636; the sack lies until 0.531 and is upright from 0.573
const SACK_DOWN = PI / 2 - 0.1, nutTau = (u) => 9 * (1 - clamp((u - 0.447) / 0.189, 0, 1)), nutTauS = (u) => 9 * (1 - clamp((u - 0.447) / 0.189, -0.28, 1)), sackTilt = (tau) => SACK_DOWN * smoothstep(3.0, 5.0, tau);
function kettleInto(b, x, y, z, ry, s, c, sh, glows) {
  const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), S = [s, s, s], dark = hexMix(c, '#1a0f0a', 0.62), lit = hexMix(c, '#ffd0a0', 0.28), brass = '#c9a24e';
  // a foot ring, a full belly, the shoulder, a stepped lid on its seam; sooty below, worn bright where hands and cloths go
  b.add(lathe([[0.05, 0], [0.98, 0], [1.08, 0.05], [1.1, 0.14], [1.2, 0.22], [1.31, 0.55], [1.27, 1.05], [1.08, 1.5], [0.8, 1.78], [0.7, 1.86], [0.7, 1.9]], 16), { s: S, pre: m, c, surf: S_COPPER,
    tint: (X, Y, Z, col, lx, ly) => col.multiplyScalar(ly < 0.3 ? 0.36 + 1.7 * ly : 0.9 + 0.22 * Math.sin((ly - 0.3) * 2.1)) });
  b.add(lathe([[0.72, 1.9], [0.74, 1.96], [0.6, 2.02], [0.3, 2.12], [0.1, 2.16], [0.02, 2.16]], 16), { s: S, pre: m, c: lit, surf: S_COPPER });
  b.add(torus(0.71, 0.035, 3, 14), { p: [0, 1.9 * s, 0], r: [PI / 2, 0, 0], s: S, pre: m, c: dark, surf: S_COPPER });
  b.add(torus(1.3, 0.04, 3, 14), { p: [0, 0.62 * s, 0], r: [PI / 2, 0, 0], s: S, pre: m, c: lit, surf: S_COPPER });
  b.add(lathe([[0.02, 0], [0.1, 0.02], [0.17, 0.12], [0.2, 0.2], [0.1, 0.3], [0.02, 0.32]], 8), { p: [0, 2.14 * s, 0], s: S, pre: m, c: brass, surf: S_BRASS });
  const sp = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new V3(1.1, 0.72, 0), new V3(1.78, 0.86, 0), new V3(2.04, 1.78, 0)), 7, 0.17, 7, false); sp.deleteAttribute('uv');
  b.add(sp, { s: S, pre: m, c, surf: S_COPPER, tint: (X, Y, Z, col, lx, ly) => col.multiplyScalar(ly > 1.66 ? 0.5 : 1) });
  b.add(torus(0.24, 0.05, 3, 8), { p: [1.2 * s, 0.76 * s, 0], r: [0, PI / 2, 0.25], s: S, pre: m, c: dark, surf: S_COPPER });    // the collar where the spout is brazed on
  b.add(torus(0.85, 0.075, 5, 12, PI * 1.15), { p: [-0.25 * s, 1.9 * s, 0], r: [0, 0, -0.08], s: S, pre: m, c: '#2a211c', surf: S_IRON });
  for (const [lx, ly] of [[0.6, 1.9], [-1.0, 1.52]]) for (const dz of [-0.11, 0.11]) b.add(sph(0.085, 5, 3), { p: [lx * s, ly * s, dz * s], s: S, pre: m, c: brass, surf: S_BRASS });   // rivets
  if (sh) sh.push([x, y + 0.04, z, 2.3 * s, 0.62]);
  if (glows) glows.push([x, y + 0.06, z, 3.6 * s, 0.5]);
}
// the samovar: aged brass on a plinth with ball feet, engraved bands, a waist, handles with turned grips, a tap with its
// key, the chimney and its crown
function samovarInto(b, P, sh, glows) {
  const [x, y, z] = P, br = '#a4843a', brD = '#6a5122', brL = '#d0ae5a';
  const band = (X, Y, Z, col, lx, ly, lz) => { const eng = (ly > 2.0 && ly < 2.26) || (ly > 4.14 && ly < 4.4) || (ly > 1.18 && ly < 1.3); col.multiplyScalar(eng ? 0.5 : 0.84 + 0.24 * Math.sin(ly * 2.2 + 1)); if (eng && Math.sin(Math.atan2(lz, lx) * 14) > 0.15) col.multiplyScalar(1.7); };
  b.add(rbox(3.3, 0.5, 3.3, 0.14), { p: [x, y + 0.25, z], c: brD, surf: S_BRASS });
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.add(sph(0.3, 6, 4), { p: [x + sx * 1.3, y + 0.2, z + sz * 1.3], c: brL, surf: S_BRASS });
  b.add(lathe([[0.02, 0.5], [1.25, 0.5], [1.25, 0.72], [0.8, 0.9], [0.62, 1.25], [0.9, 1.5], [1.5, 1.8], [1.74, 2.7], [1.78, 4.0], [1.6, 4.7], [1.15, 5.15], [1.2, 5.3], [1.0, 5.42], [0.72, 5.55], [0.62, 6.1], [0.8, 6.2], [0.8, 6.32], [0.3, 6.5], [0.02, 6.52]], 20),
    { p: [x, y, z], c: br, surf: S_BRASS, tint: band });
  b.add(torus(1.2, 0.07, 4, 18), { p: [x, y + 5.3, z], r: [PI / 2, 0, 0], c: brL, surf: S_BRASS });
  b.add(torus(1.79, 0.06, 4, 18), { p: [x, y + 3.25, z], r: [PI / 2, 0, 0], c: brL, surf: S_BRASS });
  for (const sg of [-1, 1]) {
    const g = torus(0.62, 0.085, 5, 10, PI); g.rotateZ(PI / 2); g.rotateY(sg * PI / 2);
    b.add(g, { p: [x, y + 3.7, z + sg * 1.72], c: brD, surf: S_BRASS });
    b.add(cyl(0.15, 0.15, 0.72, 7), { p: [x, y + 3.7, z + sg * 2.34], c: '#24170f', surf: S_WOODM });
  }
  b.add(cyl(0.13, 0.17, 1.2, 7), { p: [x - 2.1, y + 2.0, z], r: [0, 0, PI / 2], c: brL, surf: S_BRASS });
  b.add(cyl(0.11, 0.08, 0.5, 6), { p: [x - 2.55, y + 1.8, z], c: brL, surf: S_BRASS });
  b.add(cyl(0.05, 0.05, 0.5, 5), { p: [x - 2.3, y + 2.3, z], c: brD, surf: S_BRASS });
  b.add(torus(0.2, 0.05, 4, 8), { p: [x - 2.3, y + 2.7, z], c: brD, surf: S_BRASS });
  if (sh) sh.push([x, y + 0.04, z, 3.4, 0.66]);
  if (glows) glows.push([x, y + 0.06, z, 5.2, 0.45]);
}
function panInto(b, x, y, z, r, top, dots, rng, sh) {
  b.add(lathe([[0.02, 0], [r * 0.96, 0], [r, 0.08], [r * 1.03, 0.42], [r * 1.07, 0.46], [r * 1.0, 0.5], [r * 0.96, 0.4]], 22), { p: [x, y, z], c: COPPER, surf: S_COPPER });
  b.add(cyl(r * 0.965, r * 0.965, 0.06, 16), { p: [x, y + 0.36, z], c: top, surf: INT.surf(0, 0.55), tint: (X, Y, Z, col) => { const u = (X - x) * 1.6 + (Z - z) * 0.9, v = (X - x) * -0.9 + (Z - z) * 1.6; const k = (Math.abs(((u % 1) + 1) % 1 - 0.5) < 0.08 || Math.abs(((v % 1) + 1) % 1 - 0.5) < 0.08) ? 0.5 : 1; col.multiplyScalar(k * (0.85 + 0.3 * Math.sin(X * 3.1 + Z * 1.7) * 0.5)); } });
  for (let i = 0; i < dots; i++) { const a = rng() * TAU, q = Math.sqrt(rng()) * r * 0.86; b.add(sph(0.16, 5, 3), { p: [x + Math.cos(a) * q, y + 0.41, z + Math.sin(a) * q], s: [1, 0.45, 1], c: PIST, surf: S_MATTE }); }
  sh.push([x, y + 0.04, z, r * 1.5, 0.6]);
}
async function buildIsland(ctx, b, rng, L, tile, shadows, glows) {
  const wal = L.walnut, walL = hexMix(L.walnut, '#8a5a34', 0.3), walD = hexMix(L.walnut, '#000000', 0.3), marble = hexMix(MARBLE, '#000000', 0.3), brass = '#d2a84e';
  const xc = (ISL.x0 + ISL.x1) / 2, zc = (ISL.z0 + ISL.z1) / 2, len = ISL.z0 - ISL.z1, wid = ISL.x1 - ISL.x0;
  // carcass, plinth, marble top
  b.add(rbox(wid + 0.4, 0.9, len + 0.4, 0.15), { p: [xc, 0.45, zc], c: walD, surf: S_WOODM });
  b.add(rbox(wid, 8.9, len, 0.2), { p: [xc, 5.3, zc], c: wal, surf: S_WOOD });
  b.add(rbox(wid + 0.5, 0.35, len + 0.5, 0.1), { p: [xc, 9.78, zc], c: walL, surf: S_WOOD });
  b.add(rbox(wid + 1.2, 0.9, len + 1.2, 0.3), { p: [xc, 10.35, zc], c: marble, surf: S_MARBLE });
  // aisle face: bays of raised door panels and a drawer over, brass pulls, pilaster strips; some bays open with baskets
  const nb = Math.round(len / 8), bw = len / nb;
  for (let i = 0; i < nb; i++) {
    if (i && (i & 3) === 0) await ctx.yield();
    const z = ISL.z0 - (i + 0.5) * bw, x = ISL.x0 - 0.12, tone = 0.1 + 0.16 * rng();
    b.add(tbox(0.5, 9.1, 0.7), { p: [x - 0.05, 5.3, z + bw / 2], c: walD, surf: S_WOOD });
    b.add(rbox(0.36, 1.9, bw - 1.3, 0.12), { p: [x, 8.3, z], c: hexMix(wal, '#8a5a34', tone + 0.12), surf: S_WOOD });
    b.add(lathe([[0.02, 0], [0.26, 0.04], [0.3, 0.18], [0.14, 0.3], [0.1, 0.42], [0.02, 0.44]], 6), { p: [x - 0.1, 8.3, z], r: [0, 0, PI / 2], c: brass, surf: S_BRASS });
    if (i % 5 === 2) {                                   // an open bay: a dark recess with a round copper basin on a slat shelf
      b.add(rbox(0.3, 5.4, bw - 1.3, 0.1), { p: [x + 0.5, 4.0, z], c: hexMix(wal, '#000000', 0.22), surf: S_WOODM });
      for (const y of [2.5, 4.4]) b.add(tbox(0.3, 0.22, bw - 1.5), { p: [x + 0.32, y, z], c: walL, surf: S_WOOD });       // its slat shelves
      b.add(lathe([[0.02, 0], [1.6, 0], [2.3, 0.6], [2.5, 1.5], [2.6, 1.55], [2.4, 0.5], [1.6, 0.12]], 14), { p: [x - 1.4, 0.95, z], c: COPPER, surf: S_COPPER });
    } else {
      for (const s of [-1, 1]) {
        const pz = z + s * (bw - 1.3) / 4;
        b.add(rbox(0.36, 5.4, (bw - 1.6) / 2, 0.12), { p: [x, 4.0, pz], c: hexMix(wal, '#8a5a34', tone), surf: S_WOOD });
        b.add(tbox(0.3, 3.8, (bw - 1.6) / 2 - 1.3), { p: [x - 0.16, 4.0, pz], c: hexMix(wal, '#8a5a34', tone + 0.2), surf: S_WOOD });
        b.add(sph(0.2, 5, 3), { p: [x - 0.35, 5.2, z + s * 0.4], c: brass, surf: S_BRASS });
      }
    }
  }
  await ctx.yield();
  // a brass towel rail on the aisle face with linen cloths (they stir)
  b.add(cyl(0.11, 0.11, len - 6, 6), { p: [ISL.x0 - 1.0, 9.1, zc], r: [PI / 2, 0, 0], c: brass, surf: S_BRASS });
  for (let i = 0; i < 9; i++) {
    const z = ISL.z0 - 12 - i * (len - 24) / 8; if (z < -122 && z > -150) continue;
    b.add(cyl(0.09, 0.09, 1.0, 5), { p: [ISL.x0 - 0.5, 9.1, z - 3.5], r: [0, 0, PI / 2], c: brass, surf: S_BRASS });
    const g = new THREE.PlaneGeometry(2.6, 3.4, 4, 6); g.deleteAttribute('uv'); g.rotateY(PI / 2);
    const stripe = i % 2 ? '#a23a34' : tile;
    b.add(g, { p: [ISL.x0 - 1.12, 7.4, z], c: '#b9b3a4', surf: S_CLOTH, sway: [5.7, 9.1, 1, 0], tint: (X, Y, Z, col) => { const f = Y - 5.7; if ((f > 0.3 && f < 0.5) || (f > 0.7 && f < 0.8)) col.set(stripe); col.multiplyScalar(0.9 + 0.1 * Math.sin(Z * 5)); } });
  }
  // south end face (the tray leans here): four panels with drawers; north end the same
  for (const [zf, sg] of [[ISL.z0, 1], [ISL.z1, -1]]) for (let i = 0; i < 4; i++) {
    const x = ISL.x0 + 3 + i * 6;
    b.add(rbox(5.0, 5.4, 0.36, 0.12), { p: [x, 4.0, zf + sg * 0.12], c: hexMix(wal, '#8a5a34', 0.14 + 0.08 * (i & 1)), surf: S_WOOD });
    b.add(rbox(3.6, 3.9, 0.3, 0.14), { p: [x, 4.0, zf + sg * 0.26], c: hexMix(wal, '#8a5a34', 0.3), surf: S_WOOD });
    b.add(rbox(5.0, 1.9, 0.36, 0.1), { p: [x, 8.3, zf + sg * 0.12], c: hexMix(wal, '#8a5a34', 0.24), surf: S_WOOD });
    b.add(lathe([[0.02, 0], [0.26, 0.04], [0.3, 0.18], [0.14, 0.3], [0.1, 0.42], [0.02, 0.44]], 8), { p: [x, 8.3, zf + sg * 0.3], r: [sg * PI / 2, 0, 0], c: brass, surf: S_BRASS });
  }
  await ctx.yield();
  // the pass shelf: marble on turned brass posts, a low brass gallery along the back
  const sx = (SHELF.x0 + SHELF.x1) / 2;
  b.add(rbox(SHELF.x1 - SHELF.x0, 0.8, len, 0.2), { p: [sx, SHELF.top - 0.4, zc], c: marble, surf: S_MARBLE });
  b.add(rbox(0.3, 0.3, len, 0.1), { p: [SHELF.x0 + 0.2, SHELF.top - 0.95, zc], c: '#9a7a3a', surf: S_BRASS });
  const post = [[0.02, 0], [0.5, 0], [0.5, 0.3], [0.3, 0.5], [0.22, 0.9], [0.3, 1.2], [0.2, 1.5], [0.2, 4.6], [0.3, 4.9], [0.22, 5.2], [0.3, 5.5], [0.48, 5.75], [0.48, 5.9], [0.02, 5.9]];
  for (let i = 0; i <= 14; i++) for (const x of [SHELF.x0 + 0.8, SHELF.x1 - 0.8]) b.add(lathe(post, 7), { p: [x, ISL.top, ISL.z0 - (i / 14) * len], s: [1, 6.4 / 5.9, 1], c: brass, surf: S_BRASS });
  b.add(cyl(0.1, 0.1, len, 6), { p: [SHELF.x1 - 0.5, SHELF.top + 1.3, zc], r: [PI / 2, 0, 0], c: brass, surf: S_BRASS });
  for (let i = 0; i <= 28; i++) b.add(cyl(0.07, 0.07, 1.3, 5), { p: [SHELF.x1 - 0.5, SHELF.top + 0.65, ISL.z0 - (i / 28) * len], c: brass, surf: S_BRASS });
  await ctx.yield();
  // on the shelf, along its back rail (clear of the tray's seat at z -165): stacked saucers, sugar bowls
  for (let i = 0; i < 26; i++) {
    const z = ISL.z0 - 6 - rng() * (len - 12), x = 26.3 + rng() * 2.4; if (Math.abs(z + 165) < 14 || Math.abs(z - SACK_Z) < 12) continue;
    if (rng() < 0.6) { const n = 3 + Math.floor(rng() * 7); for (let k = 0; k < n; k++) b.add(lathe([[0.02, 0], [0.5, 0], [0.82, 0.1], [0.86, 0.15], [0.5, 0.07]], 9), { p: [x + (rng() - 0.5) * 0.06, SHELF.top + k * 0.11, z + (rng() - 0.5) * 0.06], c: k % 3 ? '#e8e3d8' : L.accent === AMBER ? '#a23a34' : L.accent, surf: S_GLAZE }); }
    else { b.add(lathe([[0.02, 0], [0.5, 0], [0.56, 0.1], [0.9, 0.5], [0.95, 0.95], [0.88, 1.0], [0.8, 0.6], [0.4, 0.2]], 12), { p: [x, SHELF.top, z], c: '#e8e3d8', surf: S_GLAZE }); b.add(lathe([[0.02, 0], [0.86, 0], [0.6, 0.3], [0.14, 0.42], [0.16, 0.56], [0.02, 0.6]], 12), { p: [x, SHELF.top + 0.98, z], c: tile, surf: S_GLAZE }); }
  }
  await ctx.yield();
  // The tops along the nut stretch, which the flight looks down on: saucer stacks, sugar bowls, nut bowls, small pans
  // and folded cloths on the pass shelf behind the cat's lane (x 12-14.6 stays clear, and so does the place the sack
  // lies down on), a starch-dusted pastry slab with its sheet and wand right where the sack tips over, and a row of low
  // things along the island's open strip between the kettles. Placed by a fixed sequence of its own, so the seeded
  // stream of the other props is untouched.
  {
    let q = 0.4137; const dr = () => { q = (q * 7919.31 + 0.2137) % 1; return q; };
    const acc = L.accent === AMBER ? '#a23a34' : L.accent, cream = '#e8e3d8';
    const stack = (x, y, z, n) => {
      const pts = [[0.02, 0], [0.5, 0]]; for (let k = 0; k < n; k++) pts.push([0.84, k * 0.11 + 0.1], [0.87, k * 0.11 + 0.16], [0.58, k * 0.11 + 0.14]); pts.push([0.02, n * 0.11 + 0.05]);
      b.add(lathe(pts, 10), { p: [x, y, z], c: cream, surf: S_GLAZE, tint: (X, Y, Z, col) => { const k = Math.floor((Y - y - 0.05) / 0.11); if (k >= 0 && k % 3 === 1) col.set(acc); } });
      shadows.push([x, y + 0.04, z, 1.4, 0.5]);
    };
    const bowl = (x, y, z, fill) => {
      b.add(lathe([[0.02, 0], [0.5, 0], [0.56, 0.1], [0.9, 0.5], [0.95, 0.95], [0.88, 1.0], [0.8, 0.6], [0.4, 0.2]], 12), { p: [x, y, z], c: cream, surf: S_GLAZE, tint: (X, Y, Z, col) => { if (Math.abs(Y - y - 0.72) < 0.07) col.set(tile); } });
      if (fill) b.add(lathe([[0.84, 0.78], [0.6, 0.98], [0.3, 1.1], [0.02, 1.14]], 9), { p: [x, y, z], c: fill, surf: S_MATTE, tint: (X, Y, Z, col) => col.multiplyScalar(0.75 + 0.5 * Math.abs(Math.sin(X * 23.1 + Z * 17.7))) });
      else b.add(lathe([[0.02, 0], [0.86, 0], [0.6, 0.3], [0.14, 0.42], [0.16, 0.56], [0.02, 0.6]], 10), { p: [x, y + 0.98, z], c: tile, surf: S_GLAZE });
      shadows.push([x, y + 0.04, z, 1.5, 0.5]);
    };
    const cloth = (x, y, z, ry) => b.add(rbox(2.6, 0.3, 1.9, 0.12), { p: [x, y + 0.15, z], r: [0, ry, 0], c: '#d9d2c0', surf: S_CLOTH, tint: (X, Y, Z, col, lx) => { if (Math.abs(Math.abs(lx) - 0.8) < 0.14) col.set(acc); } });
    const slab = (x, y, z, w, d, ry) => {
      b.add(rbox(w, 0.3, d, 0.1), { p: [x, y + 0.15, z], r: [0, ry, 0], c: hexMix(MARBLE, '#000000', 0.16), surf: INT.surf(INT.SURF.STONE, 0.12) });
      const sheet = new THREE.PlaneGeometry(w * 0.72, d * 0.7, 6, 6); sheet.deleteAttribute('uv'); sheet.rotateX(-PI / 2);
      b.add(sheet, { p: [x + 0.2, y + 0.33, z - 0.2], r: [0, ry + 0.08, 0], c: '#eadfb9', surf: S_MATTE, tint: (X, Y, Z, col) => col.multiplyScalar(0.9 + 0.1 * Math.sin(X * 2.1) * Math.sin(Z * 1.7)) });
      b.add(cyl(0.12, 0.12, Math.max(w, d) * 1.08, 6), { p: [x - 0.3, y + 0.5, z + 0.3], r: [PI / 2, ry + 0.55, 0], c: '#7a5232', surf: S_WOOD });
    };
    const T = SHELF.top, I = ISL.top;
    // the pass shelf round the sack
    slab(19.5, T, -272.6, 7.4, 6.4, 0); shadows.push([SACK.x, T + 0.04, SACK_Z, 4.3, 0.7]);
    for (const [x, z, n] of [[15.2, -284, 6], [19.3, -286.3, 8], [22.6, -284.2, 5], [23.4, -279.6, 7], [24.6, -270.6, 4], [16.2, -264.6, 6], [21.2, -262.8, 3]]) stack(x, T, z, n);
    for (const [x, z, f] of [[16.7, -285.8, 0], [21.5, -287.8, PIST], [24.5, -276.6, 0], [23.9, -266.5, PIST], [15.0, -262.2, 0]]) bowl(x, T, z, f);
    cloth(24.6, T, -283.2, 0.3);
    // and along it to the south, behind the cat's lane
    for (let z = -184; z > -259; z -= 6.2) {
      const x = 16 + dr() * 7.5, k = dr(), zz = z - dr() * 2.5;
      if (k < 0.4) stack(x, T, zz, 3 + Math.floor(dr() * 6)); else if (k < 0.66) bowl(x, T, zz, dr() < 0.4 ? PIST : 0); else if (k < 0.82) cloth(x, T, zz, dr() * 3); else panInto(b, x, T, zz, 1.5 + dr() * 0.5, '#c98a2c', 7, dr, shadows);
      if (dr() < 0.55) { const x2 = x + (x > 20 ? -3 : 3) + dr(); if (dr() < 0.6) stack(x2, T, zz - 1.2, 2 + Math.floor(dr() * 5)); else bowl(x2, T, zz - 1.4, 0); }
    }
    await ctx.yield();
    // the island's open strip
    slab(9, I, -247, 4.2, 7, 0.06);
    panInto(b, 9, I, -186, 1.9, '#c98a2c', 8, dr, shadows); panInto(b, 9.2, I, -263.5, 2.0, '#d2a04a', 8, dr, shadows); panInto(b, 8.9, I, -283, 2.2, '#c98a2c', 9, dr, shadows);
    for (const [x, z, n] of [[8.2, -193.5, 5], [8.4, -211, 7], [10.3, -210.2, 4], [8.3, -269.5, 6], [10.4, -270.6, 3], [10.3, -288.2, 5], [8.6, -226.6, 4]]) stack(x, I, z, n);
    for (const [x, z, f] of [[10.2, -195.6, 0], [9.4, -276.2, PIST], [7.9, -287.4, 0], [10.2, -224.5, PIST], [9.6, -172.5, 0]]) bowl(x, I, z, f);
    cloth(8.6, I, -199.5, 1.3); cloth(9.3, I, -253.3, 0.2); cloth(10.1, I, -150.5, 0.25); stack(8.2, I, -157, 4); stack(10.3, I, -163.6, 3); stack(8.4, I, -179.5, 5);
    // round the tray's seat (14, -165), clear of the tray, its slide and the cat's lane: the service laid out ready on the
    // shelf behind it and to the north of it, and a few more low things on the island's strip in front
    for (const [x, z, n] of [[22.6, -160.5, 5], [24.3, -158.2, 3], [22.4, -168.3, 6], [27.2, -156.3, 7], [27.5, -161, 4], [27.4, -172.6, 5], [26.8, -176.4, 3], [16.4, -150.2, 6], [18.6, -148.6, 4], [25.2, -152.4, 5], [21.6, -173.4, 4], [15.4, -144.2, 3]]) stack(x, T, z, n);
    for (const [x, z, f] of [[23.2, -163.8, 0], [24.6, -170.4, PIST], [27.0, -167.2, 0], [20.6, -150.8, 0], [17.2, -146.4, PIST], [21.8, -155.6, 0]]) bowl(x, T, z, f);
    cloth(25.6, T, -164.6, 0.4); cloth(23.4, T, -149.5, 0.5);
    stack(7.6, I, -160.4, 4); stack(8.9, I, -167.4, 6); bowl(10.4, I, -169.6, 0); bowl(7.8, I, -153.2, PIST); stack(9.9, I, -154.8, 3);
  }
  await ctx.yield();
  // on the island: six copper kettles and a tall brass samovar (kept out of the tray's and the nuts' air)
  const kz = [-47, -60, -92, -108, -204, -232, -256];
  const spouts = [];
  kz.forEach((z, i) => {
    const x = 8.8 + (i % 2) * 0.5, ry = 2.4 + rng() * 1.2, s = 1.5 + 0.2 * rng();
    kettleInto(b, x, ISL.top, z, ry, s, hexMix(COPPER, '#e08a50', rng() * 0.4), shadows, glows);
    spouts.push([x + Math.cos(ry) * 2.0 * s, ISL.top + 1.8 * s, z - Math.sin(ry) * 2.0 * s, i < 3 ? 2.4 : 1.2]);
  });
  const SAM = [9.0, ISL.top, -218];
  samovarInto(b, SAM, shadows, glows);
  b.add(lathe([[0.02, 0], [0.5, 0], [0.9, 0.3], [1.0, 0.7], [1.05, 0.75], [0.9, 0.3], [0.5, 0.08]], 12), { p: [SAM[0] - 2.7, SAM[1], SAM[2]], c: '#e8e3d8', surf: S_GLAZE });    // drip bowl
  b.add(lathe([[0.02, 0], [0.55, 0], [0.75, 0.4], [0.6, 0.9], [0.3, 1.05], [0.1, 1.2], [0.02, 1.22]], 12), { p: [SAM[0], SAM[1] + 6.45, SAM[2]], c: '#e8e3d8', surf: S_GLAZE, tint: (X, Y, Z, col) => { if (Math.abs(Y - SAM[1] - 6.9) < 0.12) col.set(tile); } });
  await ctx.yield();
  // baklava pans, syrup pots with ladles, a brass mortar, starch-dusted slabs with the rolling wand and a pastry sheet, lemons
  const gold = '#c98a2c';
  const pans = [[-74, 20], [-100, 17], [-118, 24], [-200, 19], [-232, 23], [-276, 18], [-86, 26], [-212, 26]];
  for (let i = 0; i < pans.length; i++) {
    const [z, x] = pans[i];
    panInto(b, x, ISL.top, z, 3.0 + (i % 3) * 0.5, i % 2 ? gold : hexMix(gold, '#e0b060', 0.5), Math.round(22 * L.density), rng, shadows);
    if (i & 1) await ctx.yield();
  }
  for (const [z, x] of [[-126, 26], [-184, 25], [-246, 25], [-270, 26]]) {
    b.add(lathe([[0.02, 0], [1.4, 0], [1.5, 0.15], [1.5, 2.0], [1.62, 2.1], [1.45, 2.1], [1.4, 0.2]], 14), { p: [x, ISL.top, z], c: COPPER, surf: S_COPPER });
    b.add(cyl(1.42, 1.42, 0.05, 14), { p: [x, ISL.top + 1.75, z], c: L.accent, surf: INT.surf(0, 0.9, 0, 0.15) });
    b.add(cyl(0.07, 0.07, 3.6, 5), { p: [x - 0.9, ISL.top + 2.7, z], r: [0, 0, 0.45], c: brass, surf: S_BRASS });
    shadows.push([x, ISL.top + 0.04, z, 2.6, 0.6]);
  }
  b.add(lathe([[0.02, 0], [0.9, 0], [1.0, 0.2], [0.7, 0.5], [0.8, 0.8], [1.2, 2.0], [1.3, 2.1], [1.1, 2.0], [0.7, 0.9]], 14), { p: [9.2, ISL.top, -238], c: brass, surf: S_BRASS });
  b.add(cyl(0.16, 0.24, 3.0, 7), { p: [9.5, ISL.top + 2.4, -238], r: [0, 0, -0.3], c: brass, surf: S_BRASS });
  await ctx.yield();
  for (const z of [-156, -176]) {
    b.add(rbox(8, 0.5, 11, 0.15), { p: [21.5, ISL.top + 0.25, z], c: hexMix(MARBLE, '#000000', 0.18), surf: INT.surf(INT.SURF.STONE, 0.15) });
    b.add(cyl(0.12, 0.12, 12.5, 6), { p: [21, ISL.top + 0.75, z + 1], r: [PI / 2, 0.5, 0], c: walL, surf: S_WOOD });
    const sheet = new THREE.PlaneGeometry(6.4, 8.6, 6, 8); sheet.deleteAttribute('uv'); sheet.rotateX(-PI / 2);
    b.add(sheet, { p: [21.6, ISL.top + 0.56, z - 0.5], c: '#e9dcb4', surf: S_MATTE, tint: (X, Y, Z, col) => col.multiplyScalar(0.9 + 0.1 * Math.sin(X * 2.1) * Math.sin(Z * 1.7)) });
  }
  b.add(lathe([[0.02, 0], [0.9, 0], [1.1, 0.2], [2.0, 0.8], [2.2, 1.3], [2.1, 1.3], [1.8, 0.8], [0.9, 0.25]], 14), { p: [9.5, ISL.top, -124], c: '#e8e3d8', surf: S_GLAZE, tint: (X, Y, Z, col) => { if (Y > ISL.top + 1.05) col.set(tile); } });
  for (let i = 0; i < 9; i++) { const a = i * 2.4, q = i < 6 ? 1.0 : 0.3; b.add(sph(0.62, 9, 7), { p: [9.5 + Math.cos(a) * q, ISL.top + (i < 6 ? 1.3 : 2.1), -124 + Math.sin(a) * q], s: [1, 0.86, 1.2], r: [0, a, 0], c: hexMix('#e9c81c', '#f0d860', rng()), surf: INT.surf(0, 0.45) }); }
  await ctx.yield();
  {
    // The entry: low still lifes well out to either side of the axis, nothing in front of the disc. Left: two jute sacks
    // and two oil tins. Right: a basket of lemons, a sack, a copper cauldron with its ladle, and nearer the island a
    // kettle on the island's end whose steam sinks through the first beam.
    const sackAt = (x, z, h, r, lean, stripe) => {
      const jute = new THREE.Color(hexMix('#c9a56c', '#a98a58', rng())), band = new THREE.Color(stripe), ld = rng() * TAU, ry = rng() * TAU;
      b.add(sackGeo({ h, r, lean, leanDir: ld, phase: rng() * 6, gathers: 8 + Math.floor(rng() * 4) }), { p: [x, 0, z], r: [0, ry, 0], surf: S_CLOTH,
        tint: (X, Y, Z, col, lx, ly) => { const sh = col.r; col.copy(SACK_BAND(ly / h) ? band : jute).multiplyScalar(sh * (0.93 + 0.07 * Math.sin(ly * 23 + lx * 3))); } });
      b.add(torus(r * 0.33, 0.07, 5, 14), { p: [x + Math.cos(ld - ry) * lean * h * 0.12, h * 0.866, z - Math.sin(ld - ry) * lean * h * 0.12], r: [PI / 2, 0, 0], c: '#7a6a4a', surf: S_MATTE });
      shadows.push([x, 0.05, z, r * 1.5, 0.6]);
    };
    sackAt(-6, -3, 5.4, 2.05, 0.5, '#3d5a8a'); sackAt(-10, -8.5, 4.5, 1.85, 0.9, '#a23a34');
    await ctx.yield();
    sackAt(39.5, -12, 5.0, 1.95, 0.6, '#a23a34'); sackAt(42, -5.5, 4.2, 1.7, 1.0, '#3d5a8a');
    await ctx.yield();
    for (const [x, z, tc, ry] of [[-13.5, -13.5, '#4f6a2c', 0.3], [-15.6, -16.2, '#b98a24', -0.2]]) {                 // two oil tins behind the sacks
      b.add(rbox(1.7, 2.5, 1.7, 0.14), { p: [x, 1.25, z], r: [0, ry, 0], c: tc, surf: INT.surf(0, 0.6, 0.6), tint: (X, Y, Z, col) => { if (Y > 0.8 && Y < 1.9) col.set('#d9cfa8'); if (Math.abs(Y - 1.35) < 0.18) col.set('#7a2a22'); } });
      b.add(cyl(0.22, 0.22, 0.24, 8), { p: [x + 0.45, 2.6, z + 0.45], c: brass, surf: S_BRASS });
      b.add(torus(0.4, 0.05, 4, 10, PI), { p: [x - 0.15, 2.5, z - 0.15], r: [0, ry, 0], c: brass, surf: S_BRASS });
      shadows.push([x, 0.05, z, 1.7, 0.6]);
    }
    {
      const bx = 35, bz = -6;                              // a wide basket of lemons: a coiled wall, a rolled rim
      b.add(lathe([[0.02, 0], [2.0, 0], [2.5, 0.35], [2.85, 0.9], [3.0, 1.5], [3.12, 1.62], [3.0, 1.72], [2.8, 1.5], [2.5, 0.6], [2.0, 0.25]], 20), { p: [bx, 0, bz], c: '#9a7440', surf: S_CLOTH,
        tint: (X, Y, Z, col) => col.multiplyScalar(0.72 + 0.34 * Math.abs(Math.sin(Y * 11)) * (0.8 + 0.2 * Math.sin(Math.atan2(Z - bz, X - bx) * 22 + Math.floor(Y * 3.5) * 1.6))) });
      for (let i = 0; i < 13; i++) { const a = i * 2.4, q = i < 8 ? 1.75 : i < 12 ? 0.8 : 0; b.add(sph(0.66, 10, 8), { p: [bx + Math.cos(a) * q, i < 8 ? 1.0 : i < 12 ? 1.75 : 2.35, bz + Math.sin(a) * q], s: [1, 0.86, 1.22], r: [0.3 * Math.sin(i), a, 0], c: hexMix('#e9c81c', '#f0d860', rng()), surf: INT.surf(0, 0.45) }); }
      shadows.push([bx, 0.05, bz, 4.2, 0.6]);
    }
    await ctx.yield();
    b.add(lathe([[0.02, 0], [2.2, 0], [2.9, 0.5], [3.3, 1.4], [3.45, 2.6], [3.4, 3.05], [3.6, 3.2], [3.66, 3.32], [3.5, 3.36], [3.3, 3.0], [3.1, 1.2], [2.3, 0.3], [0.02, 0.26]], 24), { p: [37.5, 0, 1], c: hexMix(COPPER, '#e08a50', 0.3), surf: S_COPPER });
    b.add(cyl(0.12, 0.12, 6.4, 6), { p: [39.5, 3.6, 1], r: [0, 0, -0.5], c: brass, surf: S_BRASS });
    for (const sg of [-1, 1]) b.add(torus(0.55, 0.1, 5, 10), { p: [37.5, 2.9, 1 + sg * 3.55], r: [0, PI / 2, 0], c: '#2a211c', surf: S_IRON });
    shadows.push([37.5, 0.05, 1, 4.6, 0.65]);
    kettleInto(b, 24.5, ISL.top, -47.5, 0.4, 1.7, hexMix(COPPER, '#e08a50', 0.3), shadows, glows);
    spouts.push([24.5 + Math.cos(0.4) * 3.4, ISL.top + 3.06, -47.5 - Math.sin(0.4) * 3.4, 2.4]);
    spouts.push([37.2, 3.3, 1.4, 2.2]);
  }
  kettleInto(b, -26.4, 5.05, -52, 0.5, 1.7, hexMix(COPPER, '#e08a50', 0.3), shadows, glows);
  spouts.push([-26.4 + Math.cos(0.5) * 3.4, 5.05 + 3.06, -52 - Math.sin(0.5) * 3.4, 2.3]);
  spouts.push([SAM[0], SAM[1] + 7.7, SAM[2], 1.3]);                 // the little teapot on the samovar
  return { SAM, spouts };
}

// ------------------------------------------------------------------------------------------------ fittings: oven wall, bench clutter, rack, counter
const RACK = { x0: 10, x1: 18, z0: -300, z1: -385, lo: 8, hi: 16, top: 24 }, CTR = { x0: -12, x1: 12, z0: -385, z1: Z1, top: 10.8 };
const TRAYS_Z = [-398, -413.5, -429, -444.5];
// the long tray before the hatch and the places of its glasses
const LAST = { z: -458.2, at: [...Array(8).keys()].map((k) => [-6.3 + 1.8 * k, -456.8]).concat([...Array(7).keys()].map((k) => [-5.4 + 1.8 * k, -459.6])) };
async function buildFittings(ctx, b, sw, rng, L, tile, shadows, glows) {
  const wal = L.walnut, walL = hexMix(L.walnut, '#8a5a34', 0.3), marble = hexMix(MARBLE, '#000000', 0.3), brass = '#d2a84e', iron = '#15171a', doorC = '#4d545e', strapC = '#6c747f', S_DOOR = INT.surf(INT.SURF.PLAIN, 0.55, 0.3);
  // oven wall: tiled breasts with arched iron doors (shut and unlit; strapped, riveted, a brass boss on each leaf); an iron rail of hanging copper pans between
  const ovens = [-18, -112, -206, -300, -394];
  for (const [i, z] of ovens.entries()) {
    b.add(rbox(4.5, 30, 24, 0.5), { p: [XR - 2.2, 15, z], c: '#d3d0c8', surf: S_TILE, grad: [2, 30, 1, 0.68] });
    b.add(rbox(5.5, 1.6, 26, 0.4), { p: [XR - 2.6, 30.4, z], c: marble, surf: S_MARBLE });
    b.add(rbox(3.4, 12, 16, 0.6), { p: [XR - 1.6, 37, z], c: hexMix(L.wall, L.vault, 0.7), surf: S_PLASTER });
    for (let k = 0; k < 9; k++) { const a = PI * (k + 0.5) / 9; b.add(tbox(0.7, 2.6, 2.75), { p: [XR - 4.5, 9.5 + Math.sin(a) * 8.2, z + Math.cos(a) * 8.2], r: [PI / 2 - a, 0, 0], c: k % 2 ? tile : '#e9e6dd', surf: S_TILE }); }
    const door = cyl(7, 7, 0.7, 24, false); door.rotateZ(PI / 2);
    b.add(door, { p: [XR - 4.5, 9.5, z], c: doorC, surf: S_DOOR, tint: (X, Y, Z, col) => col.multiplyScalar(0.8 + 0.035 * (Y - 2.5)) });
    b.add(rbox(0.8, 9.5, 14, 0.2), { p: [XR - 4.5, 4.75, z], c: doorC, surf: S_DOOR, tint: (X, Y, Z, col) => col.multiplyScalar(0.8 + 0.035 * Math.max(Y - 2.5, 0)) });
    for (const [y, w] of [[2.6, 13.4], [6.4, 13.4], [12.2, 12.6]]) b.add(rbox(0.5, 0.6, w, 0.15), { p: [XR - 5.1, y, z], c: strapC, surf: S_DOOR });
    b.add(rbox(0.45, 15.6, 0.55, 0.15), { p: [XR - 5.08, 8.3, z], c: strapC, surf: S_DOOR });                 // where the two leaves meet
    b.add(torus(3.3, 0.2, 5, 24, PI), { p: [XR - 5.0, 12.5, z], r: [0, PI / 2, 0], c: strapC, surf: S_DOOR });   // the arch of the fire door proper
    for (const sg of [-1, 1]) b.add(lathe([[0.02, 0.42], [0.45, 0.36], [0.8, 0.14], [0.9, 0]], 10), { p: [XR - 4.86, 9.3, z + sg * 3.3], r: [0, 0, PI / 2], c: '#c9a24e', surf: S_BRASS });
    for (let k = 0; k < 10; k++) b.add(sph(0.3, 6, 4), { p: [XR - 5.0, 2 + (k % 5) * 3.1, z + (k < 5 ? -6 : 6)], c: '#7d848e', surf: S_DOOR });
    b.add(cyl(0.22, 0.22, 4.4, 7), { p: [XR - 5.6, 8.6, z + 3.2], c: brass, surf: S_BRASS });
    b.add(rbox(6.5, 0.8, 20, 0.25), { p: [XR - 3.2, 0.4, z], c: marble, surf: S_MARBLE });
    await ctx.yield();
    {
      const last = i === ovens.length - 1, zc = last ? -438 : z - 47, rl = last ? 50 : 62, np = last ? 6 : 7;
      b.add(cyl(0.16, 0.16, rl, 6), { p: [XR - 1.6, 22, zc], r: [PI / 2, 0, 0], c: iron, surf: S_IRON });
      for (let k = 0; k < np; k++) {
        const pz = zc + (rl / 2 - 4) - k * (rl - 8) / (np - 1) + rng() * 2, r = 2.0 + rng() * 1.6, y = 21.6 - r - 1.4;
        // a tinned copper pan hung by its strap, inside to the room: dark tin within, worn in rings, and a bright rolled rim
        const sway = [y - r, 22, 1, 0], cop = hexMix(COPPER, '#e08a50', rng() * 0.5), X0 = XR - 1.25;
        const shell = lathe([[0.02, 0], [r * 0.8, 0], [r * 0.88, 0.07], [r * 0.99, 0.6], [r * 1.02, 0.72]], 16); shell.rotateZ(PI / 2);
        sw.add(shell, { p: [X0, y, pz], c: cop, surf: S_COPPER, sway });
        const inner = lathe([[0.02, 0.1], [r * 0.25, 0.1], [r * 0.5, 0.1], [r * 0.72, 0.11], [r * 0.8, 0.16], [r * 0.9, 0.5], [r * 0.985, 0.72]], 16); inner.rotateZ(PI / 2);
        sw.add(inner, { p: [X0, y, pz], c: '#6a6460', surf: S_TIN, sway, tint: (X, Y, Z, col) => { const q = Math.hypot(Y - y, Z - pz) / r; col.multiplyScalar(q < 0.2 ? 0.75 : q < 0.4 ? 1.15 : q < 0.6 ? 0.8 : q < 0.76 ? 1.1 : 0.6); } });
        const rim = torus(r * 1.01, 0.085 + r * 0.012, 4, 18); rim.rotateY(PI / 2);
        sw.add(rim, { p: [X0 - 0.74, y, pz], c: hexMix(cop, '#ffd0a0', 0.45), surf: S_COPPER, sway });
        sw.add(tbox(0.12, 2.3, 0.55), { p: [X0 - 0.5, y + r + 0.95, pz], c: iron, surf: S_IRON, sway });
        sw.add(torus(0.3, 0.07, 5, 10), { p: [X0 - 0.5, y + r + 2.15, pz], r: [0, PI / 2, 0], c: iron, surf: S_IRON, sway });
        shadows.push([XR - 0.07, y - 0.5, pz + 0.75, r * 1.45, -0.5]); glows.push([XR - 0.1, y, pz, r * 2.7, -0.55]);
        if (k & 1) await ctx.yield();
      }
      await ctx.yield();
      // a marble shelf of copper jugs and glazed crocks under the rail
      b.add(rbox(2.8, 0.5, rl - 6, 0.15), { p: [XR - 1.5, 9.2, zc], c: marble, surf: S_MARBLE });
      for (let k = 0; k < 4; k++) b.add(consoleGeometry(2.4, 2.6, 0.7), { p: [XR, 8.95, zc + (rl / 2 - 6) - k * (rl - 12) / 3], r: [0, PI, 0], c: hexMix(marble, SHADE, 0.5), surf: S_MARBLE });
      for (let k = 0; k < 9; k++) {
        const pz = zc + (rl / 2 - 5) - k * (rl - 10) / 8 + rng() * 1.2, q = 0.9 + rng() * 0.5;
        if (k % 3 === 1) b.add(lathe([[0.02, 0], [0.8, 0], [1.2, 0.8], [1.1, 1.9], [0.6, 2.4], [0.6, 2.7], [0.02, 2.7]], 10), { p: [XR - 1.6, 9.45, pz], s: q, c: k % 2 ? '#e2ddd2' : tile, surf: S_GLAZE });
        else b.add(lathe([[0.02, 0], [0.9, 0], [1.25, 0.5], [1.15, 1.6], [0.7, 2.2], [0.5, 2.8], [0.68, 2.95], [0.02, 3.0]], 10), { p: [XR - 1.6, 9.45, pz], s: q, c: hexMix(COPPER, '#e08a50', rng() * 0.5), surf: S_COPPER });
      }
    }
    await ctx.yield();
  }
  // under the windows: flour sacks, olive-oil tins, a pair of slippers; and the apron on its hook (it still swings)
  for (const [wi, [a, bz]] of ALLWIN.entries()) {
    const n = Math.round(6 * L.density * (a - bz) / 70);
    for (let i = 0; i < n; i++) {
      const z = a - 6 - (i + rng() * 0.6) * (a - bz - 12) / n, x = XL + 3.2 + (rng() - 0.5) * 1.6;
      if (rng() < 0.55) {
        const h = 3.6 + rng() * 1.2, jute = new THREE.Color(hexMix('#b3a88e', '#9c8f72', rng())), band = new THREE.Color(wi % 2 ? '#a23a34' : '#3d5a8a');
        b.add(sackGeo({ h, r: 1.75, seg: 12, lean: 0.3 + rng() * 0.6, leanDir: rng() * TAU, phase: rng() * 6, gathers: 7 + Math.floor(rng() * 3) }), { p: [x, 5.05, z], r: [0, rng() * 3, 0], surf: S_CLOTH,
          tint: (X, Y, Z, col, lx, ly) => { const sh = col.r; col.copy(SACK_BAND(ly / h) ? band : jute).multiplyScalar(sh * (0.93 + 0.07 * Math.sin(ly * 23 + lx * 3))); } });
      } else {
        const tc = rng() < 0.5 ? '#4f6a2c' : '#b98a24';
        b.add(rbox(2.0, 3.0, 2.0, 0.14), { p: [x, 6.55, z], r: [0, rng() * 0.6, 0], c: tc, surf: INT.surf(0, 0.6, 0.6), tint: (X, Y, Z, col) => { if (Y > 6.2 && Y < 7.3) col.set('#d9cfa8'); } });
        b.add(cyl(0.3, 0.3, 0.4, 8), { p: [x + 0.5, 8.2, z + 0.5], c: brass, surf: S_BRASS });
      }
    }
    await ctx.yield();
  }
  for (const s of [-1, 1]) {                             // slippers, toes to the wall
    const g = sph(1, 10, 6); g.scale(0.75, 0.42, 1.7);
    b.add(g, { p: [XL + 9, 0.4, -128 + s * 1.1], r: [0, PI / 2 + s * 0.12, 0], c: '#7a2630', surf: S_CLOTH });
    b.add(cyl(0.72, 0.8, 0.14, 10), { p: [XL + 10.2, 0.5, -128 + s * 1.1], s: [1.1, 1, 1], c: '#d9cfb8', surf: S_CLOTH });
  }
  {
    const hz = -225, g = new THREE.PlaneGeometry(5.2, 9, 6, 10); g.deleteAttribute('uv'); g.rotateY(PI / 2);
    sw.add(g, { p: [XL + 2.5, 15.5, hz], c: '#bdb7a8', surf: S_CLOTH, sway: [11, 20, 1, 0], tint: (X, Y, Z, col) => { const w = 1.3 + (20 - Y) * 0.16; void w; if (Math.abs(Y - 12.2) < 0.25) col.set(tile); col.multiplyScalar(0.92 + 0.08 * Math.sin(Z * 4 + Y)); } });
    b.add(cyl(0.14, 0.14, 1.6, 6), { p: [XL + 2.2, 20, hz], r: [0, 0, PI / 2], c: brass, surf: S_BRASS });
  }
  await ctx.yield();
  // the rack of jars: walnut uprights, three shelves, a low shelf of copper cauldrons, cross braces at the back
  const rl = RACK.z0 - RACK.z1, rz = (RACK.z0 + RACK.z1) / 2, rx = (RACK.x0 + RACK.x1) / 2, rackW = hexMix(L.walnut, '#8a5a34', 0.42), rackL = hexMix(L.walnut, '#a06c40', 0.62);
  for (let i = 0; i <= 5; i++) {
    const z = RACK.z0 - (i / 5) * rl;
    // uprights at the back in every bay; at the front only at the two ends and the middle (the cat walks behind them),
    // the shelves between carried on brackets from the back
    const front = i === 0 || i === 5;
    b.add(rbox(1.0, 25.4, 1.0, 0.16), { p: [RACK.x1 - 0.5, 12.7, z], c: rackW, surf: S_WOOD });
    if (front) {
      b.add(rbox(1.0, 25.4, 1.0, 0.16), { p: [RACK.x0 + 0.5, 12.7, z], c: rackW, surf: S_WOOD });
      for (const y of [3.4, 11.6, 19.6]) b.add(rbox(7, 0.7, 0.7, 0.12), { p: [rx, y, z], c: rackL, surf: S_WOOD });
      b.add(sph(0.75, 8, 6), { p: [RACK.x0 + 0.5, 25.8, z], c: brass, surf: S_BRASS });
    } else for (const y of [RACK.lo, RACK.hi, RACK.top]) b.add(rbox(7.6, 0.7, 0.6, 0.12), { p: [rx + 0.2, y - 0.95, z], c: rackW, surf: S_WOOD });
    if (i < 5) for (const s of [-1, 1]) b.add(rbox(0.3, 0.6, 19.5, 0.1), { p: [RACK.x1 - 0.3, 12, z - rl / 10], r: [s * 0.44, 0, 0], c: rackW, surf: S_WOODM });
  }
  b.add(rbox(1.0, 25.4, 1.0, 0.16), { p: [RACK.x0 + 0.5, 12.7, rz], c: rackW, surf: S_WOOD });
  b.add(sph(0.75, 8, 6), { p: [RACK.x0 + 0.5, 25.8, rz], c: brass, surf: S_BRASS });
  // a boarded back of dark walnut behind the two jar shelves: the jars glow and the cat stands out against it
  for (let i = 0; i < 10; i++) b.add(rbox(0.3, 16.9, rl / 10 - 0.12, 0.08), { p: [RACK.x1 - 0.2, 15.55, RACK.z0 - (i + 0.5) * rl / 10], c: hexMix(L.walnut, '#140b07', 0.5 + 0.08 * (i % 3)), surf: S_WOODM });
  await ctx.yield();
  for (const y of [1.2, RACK.lo - 0.3, RACK.hi - 0.3, RACK.top - 0.3]) {
    b.add(rbox(8.4, 0.6, rl + 1.4, 0.15), { p: [rx, y, rz], c: rackL, surf: S_WOOD });
    b.add(rbox(0.2, 0.3, rl + 1.4, 0.06), { p: [RACK.x0 - 0.3, y + 0.1, rz], c: '#9a7a3a', surf: S_BRASS });
  }
  await ctx.yield();
  for (let i = 0; i < 8; i++) { const z = RACK.z0 - 6 - i * 10.5; glows.push([RACK.x0 - 2.5, 0.07, z, 5.5, 0.4]); b.add(lathe([[0.02, 0], [2.0, 0], [2.7, 0.8], [2.9, 2.6], [3.1, 2.7], [2.8, 2.4], [2.6, 0.9], [2.0, 0.2]], 14), { p: [rx, 1.5, z], s: 0.8 + rng() * 0.35, c: hexMix(COPPER, '#e08a50', rng() * 0.5), surf: S_COPPER }); }
  for (let i = 0; i < 12; i++) { const z = RACK.z0 - 4 - i * 7; b.add(lathe([[0.02, 0], [1.4, 0], [1.8, 0.4], [1.7, 1.9], [1.9, 2.0], [1.6, 1.9], [1.5, 0.4]], 10), { p: [rx + rng() - 0.5, RACK.top, z], s: [1, 0.7 + rng() * 0.6, 1], c: i % 3 ? '#b99a62' : hexMix(COPPER, '#e08a50', 0.3), surf: i % 3 ? S_CLOTH : S_COPPER }); }
  await ctx.yield();
  // the serving counter on the axis: marble with a tiled front, running into the hatch
  const cl = CTR.z0 - CTR.z1, cz = (CTR.z0 + CTR.z1) / 2;
  b.add(rbox(24, 9.8, cl, 0.3), { p: [0, 4.9, cz], c: marble, surf: S_MARBLE });
  b.add(rbox(25.4, 1.0, cl + 0.7, 0.3), { p: [0, CTR.top - 0.5, cz + 0.35], c: hexMix(MARBLE, '#000000', 0.26), surf: S_MARBLE });
  b.add(rbox(24.8, 1.2, cl + 0.4, 0.2), { p: [0, 0.6, cz + 0.2], c: hexMix(marble, SHADE, 0.5), surf: S_MARBLE });
  for (let i = 0; i < 6; i++) {                          // south front: panels with a tile lozenge
    const x = -10 + i * 4;
    b.add(rbox(3.4, 6.4, 0.3, 0.14), { p: [x, 5.2, CTR.z0 + 0.12], c: hexMix(MARBLE, '#000000', 0.22), surf: S_MARBLE });
    b.add(tbox(1.5, 1.5, 0.3), { p: [x, 5.2, CTR.z0 + 0.3], r: [0, 0, PI / 4], c: i % 2 ? tile : hexMix(tile, '#ffffff', 0.25), surf: S_TILE });
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 10; i++) {
    const z = CTR.z0 - 4.2 - i * 8.4;
    b.add(tbox(0.3, 6.4, 7), { p: [sx * 12.12, 5.2, z], c: hexMix(MARBLE, '#000000', 0.22), surf: S_MARBLE });
    b.add(tbox(0.3, 1.5, 1.5), { p: [sx * 12.3, 5.2, z], r: [PI / 4, 0, 0], c: i % 2 ? tile : hexMix(tile, '#ffffff', 0.25), surf: S_TILE });
  }
  await ctx.yield();
  // four laid trays: hammered copper with a scalloped rim; baklava plates between them, to the sides of the flight
  for (const z of TRAYS_Z) {
    const g = lathe([[0.02, 0.1], [5.4, 0.1], [5.7, 0.2], [6.0, 0.55], [6.1, 0.6], [5.9, 0.3], [5.4, 0.22], [0.02, 0.22]], 48), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), zz = p.getZ(i), r = Math.hypot(x, zz); if (r > 5.5) { const k = 1 + 0.035 * Math.cos(Math.atan2(zz, x) * 16); p.setX(i, x * k); p.setZ(i, zz * k); } }
    b.add(g, { p: [0, CTR.top, z], c: COPPER, surf: S_COPPER, tint: (X, Y, Z, col) => { const r = Math.hypot(X, Z - z); col.multiplyScalar(0.8 + 0.25 * Math.sin(r * 3.9) * (r < 5.3 ? 1 : 0) + 0.12 * Math.sin(X * 7 + Z * 5)); } });
    shadows.push([0, CTR.top + 0.05, z, 8.6, 0.72]);
  }
  // and before the hatch, ready to go out: a long copper tray with two rows of full glasses, the last thing on the way to the sill
  b.add(rbox(15.4, 0.22, 6.4, 0.1), { p: [0, CTR.top + 0.11, LAST.z], c: COPPER, surf: S_COPPER, tint: (X, Y, Z, col) => col.multiplyScalar(0.82 + 0.2 * Math.sin(X * 2.6) * Math.sin(Z * 2.9) + 0.1 * Math.sin(X * 9 + Z * 7)) });
  for (const dz of [-3.2, 3.2]) b.add(cyl(0.2, 0.2, 15.4, 8), { p: [0, CTR.top + 0.32, LAST.z + dz], r: [0, 0, PI / 2], c: COPPER, surf: S_COPPER });
  for (const dx of [-7.7, 7.7]) { b.add(cyl(0.2, 0.2, 6.4, 8), { p: [dx, CTR.top + 0.32, LAST.z], r: [PI / 2, 0, 0], c: COPPER, surf: S_COPPER }); b.add(torus(0.7, 0.12, 5, 12), { p: [dx + Math.sign(dx) * 0.75, CTR.top + 0.36, LAST.z], r: [PI / 2, 0, 0], c: '#c9a04a', surf: S_BRASS }); }
  shadows.push([0, CTR.top + 0.05, LAST.z, 7.4, 0.6]); glows.push([0, CTR.top + 0.06, LAST.z + 4.4, 5.5, 0.5]);
  const domes = [];
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
    const z = TRAYS_Z[0] + 7.75 - i * 15.5, x = sx * 8.9; if (i === 0 && sx > 0) continue;
    b.add(lathe([[0.02, 0], [1.2, 0], [1.3, 0.5], [2.3, 0.75], [2.45, 0.9], [2.3, 0.86], [1.2, 0.62]], 16), { p: [x, CTR.top, z], c: '#e8e3d8', surf: S_GLAZE, tint: (X, Y, Z, col) => { if (Math.hypot(X - x, Z - z) > 2.2) col.set(tile); } });
    for (let k = 0; k < 9; k++) { const a = k * 0.7, q = k < 6 ? 1.1 : 0.4; b.add(tbox(1.0, 0.5, 0.7), { p: [x + Math.cos(a * 1.5) * q, CTR.top + 1.05 + (k < 6 ? 0 : 0.5), z + Math.sin(a * 1.5) * q], r: [0, a + PI / 4, 0], c: hexMix('#c98a2c', '#e0b060', rng()), surf: INT.surf(0, 0.6) }); b.add(sph(0.14, 5, 3), { p: [x + Math.cos(a * 1.5) * q, CTR.top + 1.34 + (k < 6 ? 0 : 0.5), z + Math.sin(a * 1.5) * q], c: PIST, surf: S_MATTE }); }
    shadows.push([x, CTR.top + 0.05, z, 3.6, 0.6]);
    domes.push([x, CTR.top + 0.85, z]);
  }
  await ctx.yield();
  // the north wall either side of the hatch: a tiled dado, shelves of copper moulds, a rail of ladles
  for (const [xa, xb] of [[XL, -21.5], [21.5, XR]]) {
    const n = Math.round((xb - xa) / 3.2), w = (xb - xa) / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) b.add(tbox(w - 0.12, 3.4, 0.35), { p: [xa + (i + 0.5) * w, 1.9 + j * 3.52, Z1 + 0.18], c: hexMix('#000000', '#e2dfd6', 0.84 + 0.16 * (((i * 5 + j * 3) % 4) / 3)), surf: S_TILE });
    b.add(rbox(xb - xa, 0.9, 0.6, 0.15), { p: [(xa + xb) / 2, 11.2, Z1 + 0.3], c: tile, surf: S_TILE });
  }
  for (const y of [15.5, 23.5]) {
    b.add(rbox(21, 0.5, 3.0, 0.15), { p: [35, y, Z1 + 1.6], c: walL, surf: S_WOOD });
    for (const x of [26, 35, 44]) b.add(rbox(0.5, 2.2, 2.4, 0.15), { p: [x, y - 1.3, Z1 + 1.3], r: [0.5, 0, 0], c: wal, surf: S_WOOD });
    for (let i = 0; i < 6; i++) { const x = 26.5 + i * 3.4 + rng() * 0.6, k = 0.8 + rng() * 0.5;
      if (i % 2) b.add(lathe([[0.02, 0], [1.2, 0], [1.5, 0.5], [1.3, 1.5], [0.9, 2.0], [0.5, 2.1], [0.02, 2.1]], 14), { p: [x, y + 0.25, Z1 + 1.7], s: k, c: hexMix(COPPER, '#e08a50', rng() * 0.5), surf: S_COPPER, tint: (X, Y, Z, col) => col.multiplyScalar(0.85 + 0.2 * Math.sin(Math.atan2(Z - Z1 - 1.7, X - x) * 10)) });
      else b.add(lathe([[0.02, 0], [0.9, 0], [1.3, 0.6], [1.2, 1.6], [0.6, 2.2], [0.5, 2.6], [0.7, 2.7], [0.02, 2.75]], 12), { p: [x, y + 0.25, Z1 + 1.7], s: k, c: i % 4 ? '#e8e3d8' : tile, surf: S_GLAZE }); }
  }
  b.add(cyl(0.12, 0.12, 7.5, 6), { p: [-25.5, 21, Z1 + 0.9], r: [0, 0, PI / 2], c: iron, surf: S_IRON });
  for (let i = 0; i < 4; i++) { const x = -28.4 + i * 1.9, len = 5 + (i % 2) * 1.2;
    sw.add(cyl(0.09, 0.09, len, 5), { p: [x, 21 - len / 2, Z1 + 0.9], c: brass, surf: S_BRASS, sway: [21 - len - 1, 21, 1, 0] });
    sw.add(lathe([[0.02, 0], [0.5, 0.05], [0.75, 0.4], [0.8, 0.7], [0.72, 0.45], [0.45, 0.14]], 10), { p: [x, 21 - len - 0.6, Z1 + 0.9], r: [1.2, 0, 0], c: i % 2 ? COPPER : brass, surf: S_COPPER, sway: [21 - len - 1, 21, 1, 0] }); }
  return { domes };
}

// ------------------------------------------------------------------------------------------------ own shaders: common parts
// All of these bind the hero's light uniforms (sun, sky shade, floor bounce, the four window beams) so that nuts, jars,
// cat and laid glasses sit in exactly the light the shards do. vL is the point in the hero's local space (world z + 115).
const FOG_V = '#include <fog_pars_vertex>', FOG_F = '#include <fog_pars_fragment>';
const V_END = /* glsl */`
  vec4 wp = modelMatrix * vec4(P, 1.); vL = wp.xyz + vec3(0., 0., ${(-HZ).toFixed(1)}); vN = N; vView = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>`;
const V_ROT = /* glsl */`
vec3 rod(vec3 k, float a, vec3 v) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }`;

// ------------------------------------------------------------------------------------------------ own shaders: ware and beams
// Copper and brass ware (kettles, pans, pots, posts, the laid trays): the hero's metal shader on world-space geometry.
// Hanging pans swing a little from their rail (surf.w = 1 - sway weight).
const WARE_VERT = /* glsl */`
uniform float uTime; uniform vec3 uWareTint;
attribute vec3 color; attribute vec4 surf;
varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying vec3 vColor; varying vec3 vSurf; varying vec3 vObj;
#include <fog_pars_vertex>
void main() {
  float sw = 1. - surf.w; vec3 P = position;
  P.z += sw * .16 * sin(uTime * .9 + position.z * .05); P.x -= sw * .04 * (1. + sin(uTime * 1.7 + position.z * .05));
  vColor = (color * mix(1.1, .95, surf.z) + vec3(.05, .015, 0.) * surf.z) * mix(vec3(1.), uWareTint, surf.z); vSurf = surf.xyz; vObj = position;
  vec4 wp = modelMatrix * vec4(P, 1.); vLocal = wp.xyz + vec3(0., 0., ${(-HZ).toFixed(1)}); vN = normal; vView = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// The slanting window beams in the air: slices of the room, carried with the camera (their spacing grows with distance)
// and shaded in world space, so the light stands still while the slices slide through it. Each slice shows the sun that
// comes through the five windows at that depth: long streaks with the shadows of the horizontal glazing bars, fine rays
// from the leaves outside, slow dust. Slices fade when seen edge-on and are hidden behind whatever is nearer.
const RAY_VERT = /* glsl */`
attribute vec2 aD;
uniform vec3 uCamP;
varying vec3 vW; varying float vWt;
void main() {
  vec3 P = vec3(position.x, position.y, uCamP.z - aD.x); vW = P; vWt = aD.y * step(${(Z1 + 0.6).toFixed(1)}, P.z) * step(P.z, ${(Z0 - 0.6).toFixed(1)});
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
}`;
const RAY_FRAG = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uRayCol; uniform vec3 uCamP; uniform vec4 uWinR[5]; uniform vec4 uRay;      // uRay: wall x, time, gain, softness of the beam's sides
varying vec3 vW; varying float vWt;
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main() {
  if (vWt < 1e-4) discard;
  float t = (vW.x - uRay.x) / max(-uSunDir.x, .05);
  vec3 h = vW + uSunDir * t;
  float s = uRay.w + vWt * .12, m = 0.;
  for (int i = 0; i < 5; i++) { vec4 w = uWinR[i]; m += smoothstep(w.x - s, w.x + s, h.z) * (1. - smoothstep(w.y - s, w.y + s, h.z)); }
  float e = uRay.w * .35;
  m *= smoothstep(8. - e, 8. + e, h.y) * (1. - smoothstep(38. - e, 38. + e, h.y));
  m *= (1. - .85 * (1. - smoothstep(.4, .4 + e, abs(h.y - 18.)))) * (1. - .85 * (1. - smoothstep(.4, .4 + e, abs(h.y - 28.))));
  float fine = .5 + vn(vec2(h.y * 1.3, h.z * .13)) * .7 + vn(vec2(h.y * .37 + 3., h.z * .05 + uRay.y * .03)) * .5;
  float leaf = .55 + .45 * smoothstep(.3, .7, vn(vec2(h.z * .06 + uRay.y * .1, h.y * .08 - uRay.y * .06)));
  float dust = .75 + .5 * vn(vW.xy * .11 + vec2(uRay.y * .13, vW.z * .07 - uRay.y * .05));
  vec3 rv = vW - uCamP; float dist = length(rv); vec3 rd = rv / max(dist, 1e-3);
  float cf = max(dot(rd, uSunDir), 0.), ph = 1. + .7 * cf * cf * cf;
  float face = smoothstep(.1, .5, abs(rd.z));
  float v = m * fine * leaf * dust * ph * exp(-t * .007) * exp(-dist * .021) * face * vWt;   // (the far slices fade fast: down the length of the room the beams are shafts, not a veil)
  gl_FragColor = vec4(uRayCol * (uRay.z * v), 1.);
}`;
function makeRays(L, timeU) {
  const ds = []; for (let d = 4; d < 440; d = d * 1.13 + 1.6) ds.push(d);
  const P = [], D = [], I = [];
  ds.forEach((d, k) => {
    const w = ((ds[k + 1] ?? d * 1.13 + 1.6) - (ds[k - 1] ?? 2.4)) / 2;
    P.push(XL, 0, 0, XR, 0, 0, XR, TOP, 0, XL, TOP, 0); for (let i = 0; i < 4; i++) D.push(d, w);
    I.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 2)); g.setIndex(I);
  const sd = new V3(L.sunDir[0], L.sunDir[1], L.sunDir[2]).normalize();
  const uniforms = { uSunDir: { value: sd }, uRayCol: { value: new THREE.Color(L.rayCol) }, uCamP: { value: new V3(0, 10, 0) },
    uWinR: { value: ALLWIN.map(([a, b]) => new THREE.Vector4(b, a, 0, 0)) }, uRay: { value: new THREE.Vector4(XL, 0, 0.0096 * L.rays, L.raySoft) } };
  void timeU;
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: RAY_VERT, fragmentShader: RAY_FRAG, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.name = 'beams';
  return { mesh, uniforms, triangles: ds.length * 2 };
}

// ------------------------------------------------------------------------------------------------ what hangs under the vault
// From every beam, to either side of the flight lane: bunches of dried herbs, strings of red peppers, braids of garlic
// and onions, small copper pots on their bails. Those over the window side hang in the beams. All of it swings a little.
async function buildHanging(ctx, b, rng, L, glows) {
  const bl = (Z0 - Z1) / 18, cordC = '#6e5a3c', iron = '#15171a';
  const herbs = ['#8c9a5e', '#6f7a44', '#9a9a6a', '#7d8f6c', '#a79a58'], heads = ['#817c96', '#a89a5c', '#8c9a5e', '#b5a468', '#93606a'];
  const hash = (x, y, z) => { const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return h - Math.floor(h); };
  for (let k = 1; k < 18; k++) {
    const za = Z0 - k * bl;
    for (const x of [-25.5, -21.5, -17.5, 10.5, 15.5, 21, 26.5, 33, 39.5]) {
      const near = (x === 10.5 || x === 15.5 || x === -17.5) && za < -92 && za > -188;          // over the rise: hung short, thinned
      const kind = rng(), z = za + (rng() - 0.5) * 1.0, top = 36.1, len = (4.4 + rng() * 2.4) * (near ? 0.55 : 1), y0 = top - len, sway = [y0 - 0.5, top, 1, 0], ph = rng() * TAU;
      if (rng() > (x > 30 ? 0.55 : 0.88) * clamp(L.density, 0.8, 1.2)) continue;
      b.add(cyl(0.05, 0.05, 0.9, 4), { p: [x, top + 0.2, z], c: cordC, surf: S_MATTE });
      if (kind < 0.36) {
        // a bunch of herbs, tied at the stalks, heads down
        const w = 0.7 + rng() * 0.4, R = [0.38, 1.0, 1.08, 0.82, 0.36, 0.2, 0.13], hc = new THREE.Color(herbs[Math.floor(rng() * herbs.length)]), fc = new THREE.Color(heads[Math.floor(rng() * heads.length)]);
        b.add(loft(7, 10, (r, a, out) => { const t = r / 6, lob = Math.sin(a * 5 + ph + r * 0.9), rad = R[r] * w * (1 + (0.36 - 0.3 * t) * lob); out.set(Math.cos(a) * rad, -len * (1 - t) - 0.5 * lob * (1 - t) * (1 - t), Math.sin(a) * rad); return 0.66 + 0.34 * lob; }, true, true),
          { p: [x, top, z], surf: S_CLOTH, sway, tint: (X, Y, Z, col, lx, ly, lz) => { const sh = col.r, h = hash(lx, ly, lz); col.copy(-ly / len > 0.62 + 0.25 * h ? fc : hc).multiplyScalar(sh * (0.75 + 0.5 * h)); } });
        b.add(cyl(0.32 * w, 0.32 * w, 0.3, 5, true), { p: [x, top - len * 0.25, z], c: '#c9b890', surf: S_MATTE, sway });
      } else if (kind < 0.62) {
        // a string of peppers
        b.add(cyl(0.05, 0.05, len, 4), { p: [x, top - len / 2, z], c: cordC, surf: S_MATTE, sway });
        const n = 9 + Math.floor(rng() * 4);
        for (let i = 0; i < n; i++) {
          if (near && i % 2) { rng(); continue; }
          const a = ph + i * 2.4, yy = top - 0.9 - i * (len - 1.3) / n, g = new THREE.ConeGeometry(0.33, 1.3, 5); g.deleteAttribute('uv'); g.rotateX(PI);
          b.add(g, { p: [x + Math.cos(a) * 0.3, yy, z + Math.sin(a) * 0.3], r: [Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55], c: hexMix('#a8221a', '#d6481a', rng()), surf: INT.surf(0, 0.75), sway });
        }
      } else if (kind < 0.8) {
        // a braid of garlic or of onions
        const onion = rng() < 0.45, n = 6 + Math.floor(rng() * 3);
        b.add(cyl(0.09, 0.09, len, 5), { p: [x, top - len / 2, z], c: '#b8a880', surf: S_MATTE, sway });
        for (let i = 0; i < n; i++) {
          if (near && i % 2) { rng(); continue; }
          const a = ph + i * PI * 0.75, yy = top - 1.1 - i * (len - 1.5) / n, g = sph(onion ? 0.55 : 0.46, 6, 4); g.scale(1, onion ? 0.9 : 0.82, 1);
          b.add(g, { p: [x + Math.cos(a) * 0.42, yy, z + Math.sin(a) * 0.42], c: onion ? hexMix('#c08a3a', '#a85e22', rng()) : hexMix('#e6dcc6', '#cfc2a6', rng()), surf: INT.surf(0, onion ? 0.55 : 0.2), sway });
        }
      } else {
        // a small copper pot on its bail
        const s = 0.8 + rng() * 0.5, cop = hexMix(COPPER, '#e08a50', rng() * 0.5);
        const lp = Math.max(len, 2.6 * s + 0.5), yp = top - lp;
        b.add(cyl(0.05, 0.05, lp - 2.6 * s, 4), { p: [x, top - (lp - 2.6 * s) / 2, z], c: iron, surf: S_IRON, sway });
        b.add(torus(1.0 * s, 0.07, 4, 10, PI), { p: [x, yp + 1.6 * s, z], r: [0, ph, 0], c: iron, surf: S_IRON, sway });
        b.add(lathe([[0.02, 0], [0.8, 0], [1.1, 0.35], [1.15, 1.2], [1.05, 1.55], [1.2, 1.62], [1.02, 1.5], [0.02, 0.2]], 10), { p: [x, yp, z], s: s, c: cop, surf: S_COPPER, sway });
      }
    }
    if ((k & 1) === 0) await ctx.yield();
  }
}

// ------------------------------------------------------------------------------------------------ own shaders: ware, glow, prints, fruit
// Copper, brass and tin ware: worn metal with a coloured satin body, the room mirrored in it (the floor's glow below, the
// windows to the left as a long bright line broken by the glazing bars, the vault above), hammer facets on the copper
// that each tilt their own way, lathe lines on the brass, patina, and a hot highlight that keeps the metal's colour.
const WARE_FRAG = /* glsl */`
${HERO_GLSL.light}
varying vec3 vLocal; varying vec3 vN; varying vec3 vView; varying vec3 vColor; varying vec3 vSurf; varying vec3 vObj;
#include <fog_pars_fragment>
vec3 cell(vec2 p) {
  vec2 ip = floor(p), fp = fract(p); float best = 9.; vec2 off = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 o = g + vec2(hash21(ip + g), hash21(ip + g + 17.3)) - fp; float d = dot(o, o);
    if (d < best) { best = d; off = o; }
  }
  return vec3(sqrt(best), off);
}
void main() {
  vec3 V = normalize(vView + vec3(1e-5)), N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  vec3 alb = vColor; float gloss = vSurf.y, cop = step(.5, vSurf.z) * step(vSurf.z, 1.5);
  vec3 an = abs(N); vec2 hq = (an.y > .62 ? vObj.xz : (an.x > an.z ? vObj.zy : vObj.xy)) * 4.2;
  float hf = clamp(1.5 - 1.3 * length(fwidth(hq)), 0., 1.) * cop;
  vec3 c = cell(hq);
  vec3 t1 = normalize(cross(N, vec3(.31, .2, .93)) + vec3(1e-4)), t2 = cross(N, t1);
  float fac = hash21(floor((hq + c.yz) * 4. + .5));
  N = normalize(N + (t1 * c.y + t2 * c.z) * .17 * hf + (t1 * (fac - .5) + t2 * (fract(fac * 7.3) - .5)) * .07 * hf);
  alb *= 1. + hf * (.12 * (fac - .5) - .1 * smoothstep(.36, .52, c.x));
  alb *= (.84 + .3 * vnoise(vObj.xz * .9 + vObj.y * .7 + 3.)) * (1. - (1. - cop) * .12 * (.5 + .5 * sin(vObj.y * 31.)));
  float beam = beamMask(vLocal); vec3 L = normalize(uSunDir), R = reflect(-V, N);
  float nv = max(dot(N, V), 0.), f1 = 1. - nv, fres = f1 * f1 * f1 * f1, nl = dot(N, L), wrap = max(nl * .55 + .45, 0.);
  vec3 env = envLight(R, beam), F0 = min(alb * 1.25, vec3(1.));
  vec3 col = alb * (uSunCol * beam * wrap * wrap * .55 + ambient(N) * 1.5 + ambient(R) * .6);
  col += mix(F0, vec3(1.), fres * .7) * env * (.26 + .34 * gloss) / (1. + env * .45);
  float rl = max(dot(R, L), 0.);
  col += F0 * uSunCol * beam * (.45 * pow(rl, 16.) + 3.2 * gloss * pow(rl, 160.));
  col += F0 * (uBounceCol * 1.3 + uSunCol * beam * vec3(.32, .26, .18)) * .55 * clamp(.6 - N.y, 0., 1.);
  if (dot(vView, vView) < 4.) discard;
  gl_FragColor = vec4(clamp(col, 0., 20.), 1.);
  #include <fog_fragment>
}`;
// the warm light copper throws on what is behind and under it: soft additive patches (on a wall when the radius is negative)
const GLOW_FRAG = /* glsl */`
${HERO_GLSL.light}
uniform vec3 uGlowCol;
varying vec2 vUv; varying float vA; varying vec3 vL;
void main() {
  float d = dot(vUv, vUv), a = 1. - smoothstep(0., 1., d); a *= a * vA;
  gl_FragColor = vec4(uGlowCol * (ambient(vec3(-.7, .3, 0.)) * 1.6 + uSunCol * beamMask(vL) * .55) * a, 1.);
}`;
// the cat's wet prints on the pass shelf: each is there until the paw that made it comes back for it
const PRINT_VERT = /* glsl */`
attribute vec4 iPr;                                           // x, z, turn, the cat's z when this paw stands on it
uniform float uCatZ;
varying vec2 vUv; varying float vA; varying vec3 vL;
${FOG_V}
void main() {
  float c = cos(iPr.z), s = sin(iPr.z); vec2 q = position.xy * 1.7;
  vec3 P = vec3(iPr.x + q.x * c - q.y * s, ${(SHELF.top + 0.035).toFixed(3)}, iPr.y + q.x * s + q.y * c);
  vUv = position.xy * 2.; vA = smoothstep(0., .4, uCatZ - iPr.w) * mix(1., .45, clamp((-178. - iPr.y) / 110., 0., 1.));
  vec4 wp = modelMatrix * vec4(P, 1.); vL = wp.xyz + vec3(0., 0., ${(-HZ).toFixed(1)});
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PRINT_FRAG = /* glsl */`
${HERO_GLSL.light}
uniform vec3 uPrintCol;
varying vec2 vUv; varying float vA; varying vec3 vL;
${FOG_F}
float dot2(vec2 p, vec2 c, vec2 r) { vec2 q = (p - c) / r; return 1. - smoothstep(.75, 1., dot(q, q)); }
void main() {
  float m = dot2(vUv, vec2(0., -.22), vec2(.46, .38));
  m = max(m, dot2(vUv, vec2(-.46, .22), vec2(.17, .2))); m = max(m, dot2(vUv, vec2(-.17, .5), vec2(.17, .21)));
  m = max(m, dot2(vUv, vec2(.17, .5), vec2(.17, .21))); m = max(m, dot2(vUv, vec2(.46, .22), vec2(.17, .2)));
  float a = m * vA; if (a < .02) discard;
  gl_FragColor = vec4(uPrintCol * (ambient(vec3(0., 1., 0.)) * 1.3 + uSunCol * beamMask(vL) * .4), a * .62);
  #include <fog_fragment>
}`;
// fruit that rolled off down the aisle: on the hero's clock each one rolls back, faster and faster, hops, and flies up
// into its bowl on the island (forward: it leaves the bowl at iF1.x, lands after iF1.y, bounces and rolls to rest)
const FRUIT_VERT = /* glsl */`
uniform float uT;
attribute vec4 iF0; attribute vec4 iF1; attribute vec4 iF2;   // rest xz, landing xz | leaves at, flight time, radius, seed | its place in the bowl
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj;
${V_ROT}
${FOG_V}
void main() {
  float r = iF1.z, T1 = iF1.y, tl = iF1.x + T1, dt = uT - iF1.x, roll = 0.;
  vec2 dv = iF0.xy - iF0.zw; float len = length(dv); vec2 dir = dv / max(len, 1e-3); vec3 C;
  if (dt <= 0.) C = iF2.xyz;
  else if (uT < tl) { vec2 vh = (iF0.zw - iF2.xz) / T1; float vy = (r - iF2.y + 4.9 * T1 * T1) / T1; C = vec3(iF2.x + vh.x * dt, iF2.y + vy * dt - 4.9 * dt * dt, iF2.z + vh.y * dt); roll = dt * 2.2; }
  else { float s = uT - tl, f = 1. - exp(-.5 * s); C = vec3(iF0.z + dv.x * f, r + 1.1 * abs(sin(s * 3.3)) * exp(-1.5 * s), iF0.w + dv.y * f); roll = T1 * 2.2 + len * f / r; }
  vec3 ax = normalize(vec3(dir.y, 0., -dir.x) + vec3(1e-4, 0., 0.));
  float a = roll + iF1.w * 6.;
  vec3 p = rod(ax, a, position * vec3(1., .9, 1.24) * r), N = normalize(rod(ax, a, normal * vec3(1., 1.1, .82)));
  vec3 P = C + p; vObj = position;
  ${V_END}
}`;
const FRUIT_FRAG = /* glsl */`
${HERO_GLSL.light}
uniform vec3 uFruit;
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj;
${FOG_F}
void main() {
  vec3 V = normalize(vView + vec3(1e-5)), N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  float beam = beamMask(vL); vec3 Ls = normalize(uSunDir);
  float nl = dot(N, Ls), nv = clamp(dot(N, V), 0., 1.), tip = smoothstep(.86, 1., abs(vObj.z));
  vec3 alb = uFruit * (.86 + .25 * vnoise(vObj.xy * 9. + vObj.z * 5.)) * mix(vec3(1.), vec3(.62, .7, .4), tip);
  vec3 col = alb * (uSunCol * max(nl * .75 + .25, 0.) * beam * .7 + ambient(N) * 1.35);
  col += alb * uSunCol * beam * .35 * pow(1. - nv, 2.5) + uSunCol * beam * .5 * pow(max(dot(reflect(-V, N), Ls), 0.), 26.) + uSkyCol * .25 * pow(1. - nv, 3.);
  col *= .55 + .45 * smoothstep(-.9, .2, N.y);
  gl_FragColor = vec4(clamp(col, 0., 24.), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------------ the nuts and their sack
// the stream that crosses the camera's way (see makeNuts): where its nuts lie, when they leave the sack, how long they fly
const STREAM = { n: 2200, x: -23.4, dx: 5, z: -231, dz: 11, t0: 2.4, dt: 2.8, T1: 3.15, dT: 0.5 };
// Forward in time the sack tips and pours: each kernel leaves the mouth at t0, flies a parabola to its landing point,
// bounces twice with fixed restitution and rolls to a stop. All of it is one formula of uTauN (6 s .. 0 over u 0.455-0.60).
const NUT_PARS = /* glsl */`
uniform float uTauN; uniform float uTauS; uniform vec3 uMouth; uniform vec3 uCam;
attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
vec3 nutPos(out float dtOut, out float grow) {
  float dt = mix(uTauN, uTauS, iC.w) - iA.z; dtOut = dt; grow = smoothstep(0., .12, dt);       // (the stream has a clock of its own that runs on past 9 s: all of it lies still before its turn)
  vec2 L1 = iA.xy; float T1 = iA.w; vec2 dir = vec2(cos(iB.x), sin(iB.x));
  if (dt <= T1) { float t = max(dt, 0.); vec2 vh = (L1 - uMouth.xz) / T1; float vy = (.16 - uMouth.y + 4.9 * T1 * T1) / T1; return vec3(uMouth.x + vh.x * t, uMouth.y + vy * t - 4.9 * t * t, uMouth.z + vh.y * t); }
  float s = dt - T1, vy1 = iB.z, d1 = vy1 / 4.9, h1 = iB.y;
  if (s < d1) return vec3(L1.x + dir.x * h1 * s, .16 + vy1 * s - 4.9 * s * s, L1.y + dir.y * h1 * s);
  float s2 = s - d1, vy2 = vy1 * .45, d2 = vy2 / 4.9, h2 = h1 * .6; vec2 q = L1 + dir * h1 * d1;
  if (s2 < d2) return vec3(q.x + dir.x * h2 * s2, .16 + vy2 * s2 - 4.9 * s2 * s2, q.y + dir.y * h2 * s2);
  q += dir * (h2 * d2 + iB.w * (1. - exp(-3.2 * (s2 - d2))));
  return vec3(q.x, .16, q.y);
}`;
// Each nut is a camera-facing card shaded as a small rounded shell: an ellipsoid whose long axis tumbles with the nut,
// cream, split along one side so the green kernel shows (a hazelnut is rounder, with a pale cap and no split).
const NUT_VERT = /* glsl */`
${NUT_PARS}
${V_ROT}
uniform vec3 uNutK;                                           // x: 1 pistachio, 0 hazelnut; y: size
varying vec3 vL; varying vec3 vE1; varying vec3 vE2; varying vec3 vTo; varying vec4 vNut; varying vec2 vUv;
${FOG_V}
void main() {
  float dt, grow; vec3 C = nutPos(dt, grow);
  vec3 ax = normalize(vec3(sin(iC.x * 91.), cos(iC.x * 57.), sin(iC.x * 23.) + .2));
  float ang = iC.x * 40. + iC.z * (min(max(dt, 0.), iA.w + 1.2) + 1.2 * (1. - exp(-2. * max(dt - iA.w - 1.2, 0.))));
  vec3 la = rod(ax, ang, normalize(vec3(cos(iC.x * 13.), .25 * sin(iC.x * 29.), sin(iC.x * 13.))));      // the long axis
  vec3 away = C - uCam; float ad = length(away); C += away / max(ad, 1e-3) * max(0., 5. - ad) * vec3(1., .6, 1.);   // never through the lens
  vec3 toC = cameraPosition - C; toC = toC / max(length(toC), 1e-3);
  vec3 lp = la - toC * dot(la, toC); float fl = length(lp);
  vec3 e1 = fl > .02 ? lp / fl : normalize(cross(toC, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), e2 = cross(toC, e1);
  float R = uNutK.y * iC.y * grow, Lh = R * mix(1., mix(1.25, 1.75, uNutK.x), fl);
  vec3 P = C + e1 * (position.x * 2. * Lh) + e2 * (position.y * 2. * R);
  vUv = position.xy * 2.; vE1 = e1; vE2 = e2; vTo = toC; vNut = vec4(fl, iC.x, ang * .6 + iC.x * 50., dot(la, toC));
  vec4 wp = modelMatrix * vec4(P, 1.); vL = wp.xyz + vec3(0., 0., ${(-HZ).toFixed(1)});
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const NUT_FRAG = /* glsl */`
${HERO_GLSL.light}
uniform vec3 uKernel; uniform vec3 uShell; uniform vec3 uNutK;
varying vec3 vL; varying vec3 vE1; varying vec3 vE2; varying vec3 vTo; varying vec4 vNut; varying vec2 vUv;
${FOG_F}
void main() {
  float d = dot(vUv, vUv); if (d > 1.) discard;
  float zc = sqrt(1. - d), seed = vNut.y;
  vec3 N = normalize(vE1 * vUv.x * mix(1., .55, vNut.x) + vE2 * vUv.y + vTo * zc);
  // the split runs along the nut, wide at one end; it faces the camera for part of each turn
  float roll = vNut.z, face = .3 + .7 * max(cos(roll), 0.), gc = sin(roll) * .7 * sqrt(max(1. - vUv.x * vUv.x, 0.));
  float gw = (.15 + .32 * smoothstep(-.9, .7, vUv.x)) * sqrt(face) * uNutK.x;
  float gap = (1. - smoothstep(gw * .55, gw, abs(vUv.y - gc))) * step(.02, gw) * smoothstep(-1., -.75, vUv.x);
  float lip = (1. - smoothstep(gw, gw * 1.5 + .05, abs(vUv.y - gc))) * step(.02, gw) * (1. - gap);
  float cap = (1. - uNutK.x) * (1. - smoothstep(-.62, -.45, vUv.x + .25 * sin(roll)));                 // the hazelnut's pale cap
  vec3 shell = uShell * (.86 + .22 * fract(seed * 7.3)) * (.9 + .1 * sin(vUv.y * 9. + seed * 20.));
  shell = mix(shell, uShell * vec3(1.25, 1.2, 1.05) + .04, cap);
  vec3 kern = uKernel * (1.05 + .4 * fract(seed * 3.7)) * mix(vec3(1.), vec3(.75, .55, .6), smoothstep(.4, 1., abs(vUv.y - gc) / max(gw, .02)));
  vec3 alb = mix(shell * (1. - .45 * lip), kern, gap);
  float beam = beamMask(vec3(vL.x, vL.y - .85 * max(vL.y - 17., 0.), vL.z)); vec3 Ls = normalize(uSunDir), V = vTo;
  float nl = dot(N, Ls), wrap = max(nl * .6 + .4, 0.), up = smoothstep(4., 14., vL.y);
  vec3 col = alb * (uSunCol * wrap * beam * (.6 + .25 * up) + ambient(N) * 1.3);
  col += uKernel * uSunCol * beam * gap * (.2 + .3 * up + .45 * pow(max(dot(-V, Ls), 0.), 2.));           // the kernel glows green with the sun in it
  col += alb * uSunCol * beam * .3 * up * (1. - zc);                                                      // and the thin shell cream at its edge
  col += uSunCol * beam * .3 * pow(1. - zc, 3.) * max(-dot(V, Ls) * .5 + .5, 0.);                         // rim
  col += uSunCol * beam * .5 * pow(max(dot(reflect(-V, N), Ls), 0.), 24.) * (1. - gap);                    // the shell is smooth: a small highlight
  gl_FragColor = vec4(clamp(col, 0., 24.), 1.);
  #include <fog_fragment>
}`;
// soft contact shadows under the props: one draw call of flat blobs (on floors and tops; on the oven wall when the
// strength is negative), deeper where the sun is on the surface
const BLOB_VERT = /* glsl */`
attribute vec4 iPos; attribute vec2 iRad;
varying vec2 vUv; varying float vA; varying vec3 vL;
${FOG_V}
void main() {
  float wall = step(iRad.x, 0.);
  vec3 P = iPos.xyz + mix(vec3(position.x, 0., position.y), vec3(0., position.y, position.x), wall) * 2. * iPos.w;
  vUv = position.xy * 2.; vA = abs(iRad.x);
  vec4 wp = modelMatrix * vec4(P, 1.); vL = wp.xyz + vec3(0., 0., ${(-HZ).toFixed(1)});
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const NUTSH_VERT = /* glsl */`
${NUT_PARS}
varying vec2 vUv; varying float vA; varying vec3 vL;
${FOG_V}
void main() {
  float dt, grow; vec3 C = nutPos(dt, grow);
  float h = max(C.y - .16, 0.), r = iC.y * (1.5 + h * .2);
  vec3 P = vec3(C.x + position.x * r + h * .5, .05, C.z + position.y * r);
  vUv = position.xy * 2.; vA = grow * .24 / (1. + h * .8);
  vec4 wp = modelMatrix * vec4(P, 1.); vL = wp.xyz + vec3(0., 0., ${(-HZ).toFixed(1)});
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const NUTSH_FRAG = /* glsl */`
${HERO_GLSL.light}
varying vec2 vUv; varying float vA; varying vec3 vL;
${FOG_F}
void main() {
  float d = dot(vUv, vUv); float a = vA * (1. - smoothstep(.15, 1., d)) * (.55 + .45 * beamMask(vL));
  gl_FragColor = vec4(vec3(.03, .045, .09), a);
  #include <fog_fragment>
}`;
async function makeNuts(ctx, rng, mk, L, kind) {
  const N0 = Math.round(9000 * clamp(ctx.quality?.detail ?? 1, 0.5, 1) * clamp(L.density, 0.8, 1.15)), NS = Math.round(STREAM.n * clamp(ctx.quality?.detail ?? 1, 0.6, 1)), N = N0 + NS;
  const M = new V3(), MS = sackMouth(SACK_DOWN, new V3()), MN = sackMouth(0, new V3()), iA = new Float32Array(N * 4), iB = new Float32Array(N * 4), iC = new Float32Array(N * 4);
  M.copy(MS);
  for (let i = 0; i < N0; i++) {
    if (i && i % 3000 === 0) await ctx.yield();
    // Two fields on the aisle floor. The southern one, which the camera crosses, goes home first, into the mouth of the
    // lying sack; the northern one lifts while the sack stands up and pours in over its lip. Its nuts lie north-west of
    // the sack, so their last arc crosses the picture well clear of the lens.
    const south = rng() < 0.42, Mq = south ? MS : MN; let rx, rz;
    for (let k = 0; k < 8; k++) {
      const a = rng() * TAU, r = (south ? 26 : 25) * Math.pow(rng(), 0.75); rx = -10 + Math.cos(a) * r; rz = (south ? -238 : -296) + Math.sin(a) * r * (south ? 0.95 : 0.9);
      if (rx > -23.5 && rx < 1.5 && (south ? rz > -263 : rz < -274 - 0.25 * (rx + 10))) break;
      rx = clamp(rx, -23.5, 1.5); rz = south ? Math.max(rz, -263) : Math.min(rz, -274 - 0.25 * (rx + 10));
    }
    const out = Math.atan2(rz - Mq.z, rx - Mq.x) + (rng() - 0.5) * 1.1;
    const vy1 = 2.2 + rng() * 3.2, h1 = 1.5 + rng() * 3.5, roll = 0.6 + rng() * 3.0, d1 = vy1 / 4.9, d2 = vy1 * 0.45 / 4.9;
    const travel = h1 * d1 + h1 * 0.6 * d2 + roll;
    const lx = rx - Math.cos(out) * travel, lz = rz - Math.sin(out) * travel, dM = Math.hypot(lx - Mq.x, lz - Mq.z);
    // every flight is lofted: it clears the shelf's edge and the island's, and comes down into the mouth from above
    const t0 = south ? 4.3 + rng() * 1.1 : rng() * rng() * 2.6 + rng() * 0.6, T1 = south ? lerp(2.6, 2.1, clamp((dM - 14) / 25, 0, 1)) + rng() * 0.3 : 2.5 + rng() * 0.4;
    iA.set([lx, lz, t0, T1], i * 4);
    iB.set([out, h1, vy1, roll], i * 4);
    iC.set([rng(), 0.62 + rng() * 0.34, (rng() - 0.5) * 9, 0], i * 4);
  }
  await ctx.yield();
  // THE STREAM. A third lot lies on the open floor of the bay between the second and third windows, by the pier. It goes
  // home in one long lofted arc that crosses the aisle where the camera flies at u 0.50-0.54: at 0.52 it runs from the
  // lower left of the picture, single nuts large and close, up and away to the mouth of the lying sack; a moment later
  // the camera passes through it. Its flights are longer than the others' (3.15-3.65 s), so they pass at eye level.
  for (let i = N0; i < N; i++) {
    const rx = STREAM.x + (rng() - 0.5) * STREAM.dx, rz = STREAM.z + (rng() - 0.5) * STREAM.dz;
    const out = Math.atan2(rz - MS.z, rx - MS.x) + (rng() - 0.5) * 0.8;
    const vy1 = 2.0 + rng() * 1.8, h1 = 1.2 + rng() * 2.4, roll = 0.4 + rng() * 1.6, d1 = vy1 / 4.9, d2 = vy1 * 0.45 / 4.9, travel = h1 * d1 + h1 * 0.6 * d2 + roll;
    iA.set([rx - Math.cos(out) * travel, rz - Math.sin(out) * travel, STREAM.t0 + rng() * STREAM.dt, STREAM.T1 + rng() * STREAM.dT], i * 4);
    iB.set([out, h1, vy1, roll], i * 4);
    iC.set([rng(), 0.78 + rng() * 0.3, (rng() - 0.5) * 7, 1], i * 4);
  }
  const own = { uTauN: { value: 9 }, uTauS: { value: 11.5 }, uMouth: { value: M }, uCam: { value: new V3(0, 1e4, 0) }, uKernel: { value: new THREE.Color(kind === 'hazel' ? '#c08a44' : '#a9c24a') }, uShell: { value: new THREE.Color(kind === 'hazel' ? '#8a5a2c' : '#d8c59a') }, uNutK: { value: new V3(kind === 'hazel' ? 0 : 1, kind === 'hazel' ? 0.17 : 0.135, 0) } };
  const attrs = { iA: [iA, 4], iB: [iB, 4], iC: [iC, 4] };
  const nuts = new THREE.Mesh(instanced(QUAD(), N, attrs), mk(NUT_VERT, NUT_FRAG, own)); nuts.frustumCulled = false;
  const shadows = new THREE.Mesh(instanced(QUAD(), Math.ceil(N0 * 0.5), attrs), mk(NUTSH_VERT, NUTSH_FRAG, own, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); shadows.frustumCulled = false; shadows.renderOrder = 1;
  return { nuts, shadows, uniforms: own, mouth: M, triangles: N * 4 };
}
// The pistachio sack: stands on the shelf at (18, 18, SACK_Z) and lies tipped over to the south while the nuts are out.
// Slumped jute, open at the top with the cloth rolled down into a thick collar, creased round the belly, two woven
// blue stripes, and a heaped, lumpy fill of nuts inside the collar.
function sackGeometry(heapColor, shell) {
  const b = INT.makeBuilder(), jute = new THREE.Color('#ae9462'), band = new THREE.Color('#2f5f9a'), h = SACK.h, r = SACK.r, seg = 30;
  const T = [...SACK_T.slice(0, 14), 0.57, 0.66, 0.75, 0.83, 0.9, 0.96, 1];
  const rad = makePchip([0, 0.02, 0.08, 0.2, 0.45, 0.7, 0.9, 1], [0.74, 0.9, 0.99, 1.05, 0.98, 0.91, 0.89, 0.91]);
  const foldAt = (a, t) => Math.pow(0.5 + 0.5 * Math.cos(7 * a + 1.3 + 1.6 * t), 3), wave = (a) => 0.12 * Math.sin(3 * a + 1) + 0.05 * Math.sin(5 * a);
  b.add(loft(T.length, seg, (k, a, out) => {
    const t = T[k], d = 0.045 + 0.1 * smoothstep(0.45, 1, t), fold = foldAt(a, t), cr = Math.sin(t * 27 + 2 * Math.sin(a * 2 + 1)) * smoothstep(0.03, 0.2, t) * (1 - 0.6 * smoothstep(0.38, 0.5, t) * (1 - smoothstep(0.5, 0.6, t)));
    const sag = 1 + 0.1 * Math.cos(a - 0.6) * (1 - t) * smoothstep(0, 0.1, t) + 0.045 * Math.cos(4 * a + 0.5) * (1 - t) + 0.03 * Math.sin(3 * a + t * 6);
    const rr = r * rad(t) * (1 - d * fold) * (sag + 0.03 * cr);
    out.set(Math.cos(a) * rr, t * h + wave(a) * t, Math.sin(a) * rr);
    return (1 - 1.7 * d * fold) * (0.7 + 0.3 * smoothstep(0, 0.1, t)) * (1 - 0.3 * Math.max(0, -cr));
  }, true, false), { surf: S_CLOTH, tint: (X, Y, Z, col, lx, ly, lz) => { const sh = col.r, w = 0.9 + 0.1 * Math.sin(ly * 26) * Math.sin(Math.atan2(lz, lx) * 40); col.copy(jute).multiplyScalar(sh * w); } });
  void band;
  // the rolled collar
  b.add(loft(9, seg, (k, a, out) => {
    const th = k / 8 * TAU, fold = foldAt(a, 1), R0 = r * 0.91 * (1 - 0.145 * fold) * (1 + 0.03 * Math.sin(3 * a + 6)), rt = 0.34 * (1 + 0.22 * Math.sin(5 * a + 2) + 0.12 * Math.sin(11 * a));
    const rr = R0 + 0.12 + rt * Math.cos(th);
    out.set(Math.cos(a) * rr, h + wave(a) - 0.1 + rt * 0.85 * Math.sin(th), Math.sin(a) * rr);
    return (0.78 + 0.22 * Math.sin(th)) * (0.9 + 0.1 * Math.sin(9 * a + th * 2));
  }, false, false), { surf: S_CLOTH, tint: (X, Y, Z, col) => { const sh = col.r; col.copy(jute).multiplyScalar(sh * 1.08); } });
  // the nuts heaped inside it
  const cream = new THREE.Color(shell), kern = new THREE.Color(heapColor), dark = new THREE.Color('#3a2c1c');
  b.add(loft(7, 26, (k, a, out) => {
    const q = k / 6, rr = r * 0.86 * Math.cos(q * PI / 2) + 0.02, lump = 0.11 * Math.sin(a * 9 + k * 2.3) * Math.sin(k * 1.9 + a * 4) * (0.3 + q);
    out.set(Math.cos(a) * rr * (1 + 0.04 * Math.sin(a * 13 + k)), h - 0.55 + wave(a) * 0.8 + 0.95 * Math.sin(q * PI / 2) + lump, Math.sin(a) * rr * (1 + 0.04 * Math.cos(a * 11 + k)));
    return 0.6 + 0.4 * q;
  }, false, true), { surf: S_MATTE, tint: (X, Y, Z, col, lx, ly, lz) => { const sh = col.r, hq = Math.abs(Math.sin(lx * 51.7 + lz * 37.3 + ly * 13.1) * 43758.5) % 1; col.copy(hq < 0.55 ? cream : hq < 0.82 ? kern : dark).multiplyScalar(sh * (0.8 + 0.4 * ((hq * 7) % 1))); } });
  return b.build();
}

// jute in the hero's light: a coarse weave that fades with distance, blotches, a soft fuzz of light along the edge
const SACK_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying vec3 vColor;
${FOG_V}
void main() {
  vec3 P = position, N = normalize(mat3(modelMatrix) * normal);
  vObj = position; vColor = color;
  ${V_END}
}`;
const SACK_FRAG = /* glsl */`
${HERO_GLSL.light}
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying vec3 vColor;
${FOG_F}
void main() {
  vec3 V = normalize(vView + vec3(1e-5)), N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  float ang = atan(vObj.z, vObj.x + (abs(vObj.x) < 1e-4 ? 2e-4 : 0.));
  // a coarse plain weave: every thread a rounded ridge passing over and under, dark in the gaps
  vec2 w = vec2(ang * 21., vObj.y * 7.4 + .35 * sin(ang * 9.)); float fw = clamp(1.35 - 1.3 * length(fwidth(w)), 0., 1.);
  vec2 wc = fract(w) - .5; float over = mod(floor(w.x) + floor(w.y), 2.);
  float across = over > .5 ? abs(wc.x) : abs(wc.y), along = over > .5 ? wc.y : wc.x;
  float wv = cos(across * 3.1416) * (.72 + .28 * cos(along * 6.2832)) * (.8 + .4 * hash21(floor(w)));
  vec3 alb = vColor * mix(1., .6 + .64 * wv, fw) * (.86 + .28 * vnoise(vec2(ang * 3., vObj.y * .9)));
  // the two woven stripes follow the cloth: t is the height along it, as the sack was lofted (creases and slump included)
  float st = vObj.y / (${SACK.h.toFixed(2)} + .12 * sin(3. * ang + 1.) + .05 * sin(5. * ang)), sfw = fwidth(st) * 1.2 + 1e-4;
  float stripe = max(smoothstep(.398 - sfw, .398 + sfw, st) * (1. - smoothstep(.452 - sfw, .452 + sfw, st)), smoothstep(.478 - sfw, .478 + sfw, st) * (1. - smoothstep(.492 - sfw, .492 + sfw, st)));
  stripe *= step(vObj.y, ${(SACK.h * 0.6).toFixed(2)});
  float shadeV = clamp(vColor.r / .42, 0., 1.4);
  alb = mix(alb, vec3(.03, .12, .36) * shadeV * mix(1., .62 + .7 * wv, fw) * (1. + .5 * step(.5, over) * fw), stripe);
  float beam = beamMask(vec3(vL.x, vL.y - .85 * max(vL.y - 17., 0.), vL.z)), nl = dot(N, normalize(uSunDir)), nv = clamp(dot(N, V), 0., 1.);
  vec3 sun = mix(vec3(dot(uSunCol, vec3(.3333))), uSunCol, .6);                 // jute is a dull cloth: the sun on it is paler than on brass
  vec3 col = alb * (sun * max(nl * .86 + .14, 0.) * beam * .68 + ambient(N) * mix(1.25, 1.02, beam));
  col += alb * (sun * beam * .45 + uSkyCol * .5) * pow(1. - nv, 3.);
  gl_FragColor = vec4(clamp(col, 0., 24.), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------------ vessels: jars and laid glasses
// One instanced shader. surf.x = part: 0 clear glass (color.r = 1 where there is something inside), 1 glazed, 2 metal lid.
// Jars rock after the cat has passed them (forward time; seen reversed they rock harder and harder and stop dead as it
// passes), and two lids that were knocked off fly back up onto their jars.
const VESSEL_VERT = /* glsl */`
uniform float uTauC;
attribute vec3 color; attribute vec4 surf; attribute vec4 iPos; attribute vec4 iCol; attribute vec4 iLid;
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying vec3 vColor; varying vec4 vCol; varying float vPart;
${V_ROT}
${FOG_V}
void main() {
  vec3 p = position, n = normal; float part = surf.x, dt = uTauC - iPos.w;
  float fly = step(1.5, part) * step(.5, iLid.w) * step(0., dt);
  if (fly > .5) {
    float Tf = iLid.z, s = min(dt, Tf), a = 12.566 * s / Tf, vy = (.25 - iPos.y - 2.85 + 4.9 * Tf * Tf) / Tf;
    vec3 c = vec3(0., 3.05, 0.);
    float rat = exp(-3. * max(dt - Tf, 0.)) * step(Tf, dt) * .5 * sin((dt - Tf) * 9.);
    p = c + rod(vec3(0., 0., 1.), a + rat, p - c); n = rod(vec3(0., 0., 1.), a + rat, n);
    p += vec3(iLid.x * s / Tf, vy * s - 4.9 * s * s, iLid.y * s / Tf);
  } else {
    float ang = .2 * exp(-.42 * max(dt, 0.)) * step(0., dt) * step(iPos.w, 900.) * sin(dt * 5.2 + iCol.w * 6.);
    p = rod(vec3(1., 0., 0.), ang, p); n = rod(vec3(1., 0., 0.), ang, n);
  }
  vec3 P = iPos.xyz + p, N = n;
  vObj = position; vColor = color; vCol = iCol; vPart = part;
  ${V_END}
}`;
const VESSEL_FRAG = /* glsl */`
${HERO_GLSL.light}
${HERO_GLSL.tea}
uniform vec3 uVes;                                            // ribs, cell size, glass tint gain
// one layer of the pieces in a jar: tone, cover and the piece's own number. kp: pieces round, rows per metre, 0 cube | 1 oval, size
vec3 pieces(vec2 cp, vec4 kp, float kind, float seed) {
  cp.x += hash21(vec2(floor(cp.y), seed * 91.));
  vec2 ci = vec2(mod(floor(cp.x), kp.x), floor(cp.y)); float cell = hash21(ci + seed * 31.), c2 = fract(cell * 7.31), c3 = fract(cell * 13.7);
  vec2 q = fract(cp) - .5 + (vec2(c2, c3) - .5) * .3;
  float ra = (c2 - .5) * (kind < .5 ? 1.2 : 3.1), cr = cos(ra), sr = sin(ra); q = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
  float sz = kp.w * (.85 + .3 * c3);
  float dq = kp.z < .5 ? (length(max(abs(q) - sz, 0.)) - .1) * 3. + 1. : length(q / vec2(sz, sz * (kind > 2.5 ? .92 : .62)));
  float rnd = sqrt(max(1. - dq * dq * .8, 0.));
  float tone = (.7 + .45 * cell) * (.5 + .6 * rnd) + .3 * smoothstep(.3, .0, length(q - vec2(-.1, .11)));
  return vec3(tone, 1. - smoothstep(.88, 1.06, dq), cell);
}
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying vec3 vColor; varying vec4 vCol; varying float vPart;
${FOG_F}
void main() {
  vec3 V = normalize(vView + vec3(1e-5)), N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  float beam = beamMask(vL); vec3 Ls = normalize(uSunDir), R = reflect(-V, N);
  float nv = clamp(dot(N, V), 0., 1.), fres = (1. - nv) * (1. - nv) * (1. - nv), nl = dot(N, Ls);
  vec3 col;
  if (vPart < .5) {
    float ang = atan(vObj.z, vObj.x + (abs(vObj.x) < 1e-4 ? 2e-4 : 0.));
    float rib = .5 + .5 * cos(ang * uVes.x), jar = step(.5, uVes.y), kind = floor(vCol.w + 1e-3), seed = fract(vCol.w);
    vec3 clear = envLight(-V, beam) * .42 + uSkyCol * .2, lit;
    if (jar > .5) {
      // what is in the jar: two layers of pieces heaped behind the glass - cubes of lokum under sugar, sugared almonds,
      // rose petals, whole lemons - every row slid by its own amount, every piece its own size, turn and tone
      vec4 kp = kind < .5 ? vec4(16., 2.3, .1, .25) : kind < 1.5 ? vec4(22., 3.1, 1., .34) : kind < 2.5 ? vec4(30., 4.2, 1., .4) : vec4(10., 1.5, 1., .44);
      vec2 cp = vec2(ang * .15915 * kp.x, vObj.y * kp.y + seed * 9.);
      vec3 A = pieces(cp, kp, kind, seed), B = pieces(cp + vec2(.5, .53), kp, kind, seed + .37);
      vec3 pcA = vCol.rgb, pcB = vCol.rgb;
      if (kind > 1.5 && kind < 2.5) { pcA *= mix(vec3(.55, .45, .55), vec3(1.25, 1., 1.05), A.z); pcB *= mix(vec3(.55, .45, .55), vec3(1.25, 1., 1.05), B.z); }
      if (kind < .5) pcA = mix(pcA, vec3(1.), .3 * smoothstep(.45, .8, vnoise(cp * 7.)));                           // icing sugar
      vec3 inside = mix(mix(vCol.rgb * .34, pcB * B.x * .6, B.y), pcA * A.x, A.y);
      lit = inside * (uSunCol * max(nl * .5 + .5, 0.) * beam * .7 + ambient(N) * 1.35);
      lit += inside * uSunCol * beam * (.5 * pow(max(dot(-V, Ls), 0.), 1.5) + .3 + .25 * (1. - nv));        // sun-filled: the light comes through it
      lit = mix(lit, clear * .9 + vCol.rgb * .1, 1. - smoothstep(-.2, .08, 2.26 - vObj.y - .06 * sin(ang * 5. + seed * 40.)));   // heaped, not level
    } else {
      // a laid glass: the same clear tea as the hero's, its level a finger under the gold rim
      float top = vColor.g, rr = length(vObj.xz) / .39, core = mix(nv, .35 + .65 * smoothstep(.55, .98, rr), top);
      lit = teaShadeK(N, V, vL, core, 220.);
      lit = mix(lit, lit * .8 + uTea * uSkyCol * 1.2, top * (1. - smoothstep(.3, .9, rr)) * (1. - uTeaP.x));
    }
    col = mix(clear, lit, vColor.r);
    col *= 1. - uVes.z * .22 * rib;
    col += envLight(R, beam) * (.08 + .55 * fres) * (.55 + .45 * rib) * (1. - vColor.g);
    // the windows, as one long light down the glass, broken by the flutes
    vec2 Nh = normalize(N.xz + vec2(1e-4, 0.)), Hh = normalize((vec3(-.85, .4, -.15) + V).xz + vec2(1e-4, 0.));
    col += uSkyCol * uFill.a * mix(.2, .34, jar) * pow(max(dot(Nh, Hh), 0.), mix(60., 34., jar)) * (1. - uVes.z * .6 * (1. - rib)) * (1. - vColor.g) * smoothstep(1., .6, abs(N.y));
    col += uSunCol * beam * 1.2 * pow(max(dot(R, Ls), 0.), 60.);
  } else {
    float metal = step(1.5, vPart);
    vec3 alb = vColor;
    col = alb * ((1. - metal * .5) * uSunCol * max(nl, 0.) * beam + (1. - metal * .5) * ambient(N) * 1.15);
    col += mix(vec3(.05), alb, metal) * envLight(R, beam) * mix(.25, 1.2, metal) + fres * .2 * envLight(R, beam);
    col += mix(vec3(.6), alb, metal) * uSunCol * beam * pow(max(dot(R, Ls), 0.), 40.) * 1.2;
  }
  gl_FragColor = vec4(clamp(col, 0., 24.), 1.);
  #include <fog_fragment>
}`;
function vesselMesh(base, inst, mk, own) {
  const n = inst.length, iPos = new Float32Array(n * 4), iCol = new Float32Array(n * 4), iLid = new Float32Array(n * 4);
  inst.forEach((q, i) => { iPos.set(q.pos, i * 4); iCol.set(q.col, i * 4); iLid.set(q.lid || [0, 0, 1, 0], i * 4); });
  const m = new THREE.Mesh(instanced(base, n, { iPos: [iPos, 4], iCol: [iCol, 4], iLid: [iLid, 4] }), mk(VESSEL_VERT, VESSEL_FRAG, own)); m.frustumCulled = false; return m;
}
const PART = (k) => [k, 0, 0, 1], FILL = (yTop) => (X, Y, Z, col) => col.setRGB(Y < yTop ? 1 : 0, 0, 0);
function makeJars(rng, mk, tauU, passTau, L) {
  const b = INT.makeBuilder();
  b.add(lathe([[0.02, 0.03], [1.0, 0.03], [1.15, 0.28], [1.17, 1.2], [1.15, 2.2], [0.97, 2.55], [0.8, 2.7], [0.8, 2.86]], 20), { surf: PART(0), tint: FILL(2.6) });
  b.add(lathe([[0.02, 2.86], [0.9, 2.86], [0.93, 3.02], [0.55, 3.1], [0.16, 3.14], [0.2, 3.3], [0.02, 3.36]], 16), { c: COPPER, surf: PART(2) });
  b.add(lathe([[0.02, 0], [1.02, 0], [1.02, 0.05]], 14), { c: '#0a0c10', surf: PART(1) });
  const kinds = [['#eda4b8', 0], ['#bfe0b0', 0], ['#ead9b4', 1], ['#c2304e', 2], ['#e9c41c', 3], ['#f3c9d2', 1], ['#d8e4f2', 1]];   // 0 cubes of lokum, 1 sugared almonds, 2 petals, 3 lemons
  const inst = [], per = 22, pitch = (RACK.z0 - RACK.z1 - 5) / (per - 1);
  for (let lev = 0; lev < 2; lev++) for (let k = 0; k < per; k++) {
    const z = RACK.z0 - 2.5 - k * pitch + (rng() - 0.5) * 0.5, x = 15.3 + (rng() - 0.5) * 0.8, y = lev ? RACK.hi : RACK.lo, kd = kinds[(k * 3 + lev * 2 + Math.floor(rng() * 2)) % kinds.length];
    const c = new THREE.Color(kd[0]);
    const lid = lev === 0 && (k === 3 || k === 7) ? [-13 - k, 3.5 - k, 1.25, 1] : null;
    inst.push({ pos: [x, y, z, passTau(lev, z)], col: [c.r, c.g, c.b, kd[1] + rng() * 0.98], lid });
  }
  void L;
  const mesh = vesselMesh(b.build(), inst, mk, { uTauC: tauU, uVes: { value: new V3(18, 3.4, 1) }, uTea: { value: new THREE.Color('#C8791C') }, uTeaP: { value: new V3(0, 1, 0.4) } });
  return { mesh, triangles: b.triangles * inst.length };
}
function makeLaid(rng, mk, L, liquid, saucer) {
  const V = { vs: [0, 0.07, 0.2, 0.36, 0.5, 0.62, 0.78, 0.92, 1], rs: [0.3, 0.365, 0.39, 0.34, 0.27, 0.275, 0.35, 0.425, 0.47] }, h = 1.5;
  const b = INT.makeBuilder();
  b.add(lathe(V.vs.map((v, i) => [V.rs[i], 0.1 + v * h]), 9), { surf: PART(0), tint: FILL(0.1 + 0.86 * h) });
  b.add(lathe([[0.02, 0.1 + 0.86 * h], [0.385, 0.1 + 0.86 * h]], 9), { surf: PART(0), tint: (X, Y, Z, col) => col.setRGB(1, 1, 0) });      // the surface of the tea
  b.add(lathe([[0.455, 0.1 + 0.93 * h], [0.49, 0.1 + h], [0.45, 0.1 + h]], 9), { c: '#e2b85a', surf: PART(2) });
  b.add(lathe([[0.02, 0], [0.5, 0], [0.86, 0.1], [0.9, 0.16], [0.5, 0.08], [0.02, 0.08]], 10), { c: '#ebe6da', surf: PART(1), tint: (X, Y, Z, col) => { const r = Math.hypot(X, Z); if (r > 0.6 && r < 0.88) col.set(saucer); } });
  const c = new THREE.Color(liquid), inst = [];
  for (const z of TRAYS_Z) for (const [r, n] of [[1.7, 5], [3.3, 8], [4.75, 11]]) for (let k = 0; k < n; k++) {
    const a = (k + rng() * 0.2) / n * TAU + r;
    inst.push({ pos: [Math.cos(a) * r, CTR.top + 0.22, z + Math.sin(a) * r, 1e3], col: [c.r, c.g, c.b, rng() * 0.98] });
  }
  for (const [x, z] of LAST.at) inst.push({ pos: [x, CTR.top + 0.22, z, 1e3], col: [c.r, c.g, c.b, rng() * 0.98] });
  const mesh = vesselMesh(b.build(), inst, mk, { uTauC: { value: 0 }, uVes: { value: new V3(0, 0.01, 0) }, uTea: { value: c }, uTeaP: { value: new V3(L.load === 'milk' ? 1 : 0, 1, L.load === 'milk' ? 0.3 : 0.45) } });
  return { mesh, sources: inst.map((q) => [q.pos[0], q.pos[1] + 1.5, q.pos[2], 0.95]), triangles: b.triangles * inst.length };
}

// ------------------------------------------------------------------------------------------------ the cat
// One skinned mesh: sixteen bones (hips, mid, chest, head, four upper and four lower legs, three of tail), every vertex
// blended between two of them, so the back arches, the knees bend and the tail curves. The CPU sets the bones each
// frame from the cat's distance along its route; the legs are solved to footfalls that stay where they were put, so
// no paw slips. The coat is five shells of the same mesh pushed out along the normal and combed back, each thinned by
// a strand pattern: tufts at the outline instead of an edge, lit along the side the sun is on.
const CAT_NB = 16, CAT_K = 1.1, CAT_LS = 4.2, CAT_HEAD = [0, 3.22, 3.05];
const CAT_VERT = /* glsl */`
uniform mat4 uBone[${CAT_NB}]; uniform vec4 uShellP;        // fur length, comb back along the body, droop, -
attribute vec3 color; attribute vec4 skin; attribute vec2 furA; attribute float aShell;
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying vec3 vColor; varying vec3 vFur;
${FOG_V}
void main() {
  mat4 A = uBone[int(skin.x + .5)], Bm = uBone[int(skin.y + .5)];
  vec3 P = mix((A * vec4(position, 1.)).xyz, (Bm * vec4(position, 1.)).xyz, skin.z);
  vec3 N = normalize(mix(mat3(A) * normal, mat3(Bm) * normal, skin.z) + vec3(0., 1e-5, 0.));
  vec3 back = normalize(mat3(A) * vec3(0., -.3, -1.) + vec3(0., 1e-5, 0.));
  float h = aShell * furA.x * uShellP.x;
  P += (N + back * (uShellP.y * aShell)) * h; P.y -= uShellP.z * h * aShell;
  vObj = position; vColor = color; vFur = vec3(aShell, furA.x, skin.w);
  ${V_END}
}`;
const CAT_FRAG = /* glsl */`
${HERO_GLSL.light}
uniform vec4 uFur; uniform vec3 uEye;                         // uFur: rgb stripe colour, a how tabby; uEye: the iris
varying vec3 vL; varying vec3 vN; varying vec3 vView; varying vec3 vObj; varying vec3 vColor; varying vec3 vFur;
${FOG_F}
float h1(float n) { return fract(sin(n) * 43758.5453); }
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float n = i.x + i.y * 57. + i.z * 113.;
  return mix(mix(mix(h1(n), h1(n + 1.), f.x), mix(h1(n + 57.), h1(n + 58.), f.x), f.y), mix(mix(h1(n + 113.), h1(n + 114.), f.x), mix(h1(n + 170.), h1(n + 171.), f.x), f.y), f.z);
}
void main() {
  vec3 V = normalize(vView + vec3(1e-5)), N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  float sh = vFur.x, coat = vFur.y, head = step(.5, vFur.z), furry = step(.02, coat);
  vec3 alb = vColor;
  // tabby: bands across the back and round the tail, rings on the legs, darker along the spine
  float wob = n3(vObj * 1.4) * 1.6, band = smoothstep(.15, .6, sin(vObj.z * 4.6 + wob)) * smoothstep(1.5, 2.6, vObj.y) * (1. - head);
  band = max(band, smoothstep(.2, .6, sin(vObj.y * 7.5 + wob)) * (1. - smoothstep(1.3, 1.9, vObj.y)) * step(.25, vObj.y));
  band = max(band, .7 * smoothstep(.35, .0, abs(vObj.x)) * smoothstep(2.9, 3.25, vObj.y) * (1. - head));
  float tone = .86 + .24 * n3(vObj * vec3(7., 7., 3.));
  alb = mix(alb * tone, uFur.rgb * tone, band * uFur.a * furry);
  // the face, in the head's own space: almond eyes set in dark rims with a slit pupil and a catch light, the nose, the mouth
  vec3 hp = vObj - vec3(${CAT_HEAD[0].toFixed(2)}, ${CAT_HEAD[1].toFixed(2)}, ${CAT_HEAD[2].toFixed(2)});
  vec2 e = vec2(abs(hp.x) - .36, hp.y - .1); e = vec2(e.x * .978 + e.y * .208, -e.x * .208 + e.y * .978);
  float al = pow(abs(e.x) / .235, 1.6) + (e.y * e.y) / .0155, front = head * step(.2, hp.z);
  float eye = (1. - smoothstep(.8, 1., al)) * front * (1. - smoothstep(.062, .09, e.y)), rimE = (1. - smoothstep(1.05, 1.24, al)) * front;
  vec2 nq = vec2(hp.x, hp.y + .2);
  float nose = (1. - smoothstep(.075, .1, max(abs(nq.x) + nq.y * .7, -nq.y * 1.5 - .03))) * head * step(.82, hp.z);
  float mouth = (1. - smoothstep(.012, .03, abs(abs(hp.x) - .1 * smoothstep(-.3, -.42, hp.y)))) * step(hp.y, -.27) * step(-.42, hp.y) * head * step(.7, hp.z);
  float paint = max(max(rimE, nose), mouth);
  if (sh > .01 && paint > .3) discard;                          // no fur over the eyes and the nose
  float beam = beamMask(vL); vec3 Ls = normalize(uSunDir);
  float nl = dot(N, Ls), nv = clamp(dot(N, V), 0., 1.);
  alb = mix(alb, vec3(.03, .025, .02), rimE * .9); alb = mix(alb, vec3(.42, .2, .19), nose); alb = mix(alb, vec3(.12, .07, .06), mouth * .8);
  float pupil = 1. - smoothstep(.8, 1.15, length(e / vec2(.056, .11)));
  vec3 iris = mix(uEye * 1.12, uEye * .34, smoothstep(.3, 1., al)) * (1. - .93 * pupil);
  // coat: a soft wrapped light, shade from sky and floor, and the sun caught along the edge of the fur
  float wrap = max(nl * .62 + .38, 0.);
  vec3 col = alb * (uSunCol * wrap * beam * .56 + ambient(N) * 1.25) * mix(1., mix(.66, 1.1, sh), furry);
  col += alb * uSunCol * beam * (.55 + .12 * sh) * pow(1. - nv, 2.5) * max(nl * .5 + .5, 0.) * furry;
  col += alb * (ambient(-N) * .5 + uSkyCol * .3) * (1. - nv) * (1. - nv) * furry * (1. - .7 * sh);
  col = mix(col, iris * (uSunCol * beam * .35 + ambient(vec3(0., 1., 0.)) * 2.2) + vec3(1.6) * (1. - smoothstep(.02, .045, length(e - vec2(-.06, .04)))), eye);
  col += (nose + rimE * (1. - eye)) * uSunCol * beam * .25 * pow(max(dot(reflect(-V, N), Ls), 0.), 20.);
  float a = 1.;
  if (sh > .01) {
    float strand = .4 * n3(vObj * vec3(8.5, 8.5, 4.)) + .3 * n3(vObj * vec3(27., 27., 12.) + 7.) + .3 * n3(vObj * vec3(2.7, 2.7, 1.5) + 3.);
    a = smoothstep(sh * .8, sh * .8 + .28, strand + .16) * furry * (1. - .62 * sh);       // the outer shells are thin: tufts, not a halo
    if (a < .05) discard;
  }
  gl_FragColor = vec4(clamp(col, 0., 24.), a);
  #include <fog_fragment>
}`;
// the cat's mesh, in its rest pose: standing, legs straight down, tail straight back. Space: origin on the ground under
// the middle of the body, +z to the head. fn(x, y, z, shade, colour, o) gives every vertex its colour, its two bones
// and how long the coat is there.
function catMesher() {
  const P = [], N = [], C = [], S = [], F = [], I = [], col = new THREE.Color(), o = { skin: [0, 0, 0, 0], fur: 1 }; let n = 0;
  return {
    add(g, fn) {
      const p = g.attributes.position, nn = g.attributes.normal, c = g.attributes.color, idx = g.index;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i); col.setRGB(1, 1, 1); o.fur = 1; fn(x, y, z, c ? c.getX(i) : 1, col, o);
        P.push(x, y, z); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); C.push(col.r, col.g, col.b); S.push(o.skin[0], o.skin[1], o.skin[2], o.skin[3]); F.push(o.fur, 0);
      }
      for (let i = 0; i < idx.count; i++) I.push(idx.getX(i) + n);
      n += p.count;
    },
    build(shells) {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('skin', new THREE.Float32BufferAttribute(S, 4)); g.setAttribute('furA', new THREE.Float32BufferAttribute(F, 2)); g.setIndex(I);
      g.setAttribute('aShell', new THREE.InstancedBufferAttribute(new Float32Array(shells), 1)); g.instanceCount = shells.length;
      return g;
    },
    get triangles() { return I.length / 3; },
  };
}
const CAT_PIV = [[0, 2.5, -1.3], [0, 2.45, 0], [0, 2.4, 1.3], [0, 3.05, 2.55], [0.5, 2.3, 1.45], [-0.5, 2.3, 1.45], [0.56, 2.4, -1.5], [-0.56, 2.4, -1.5],
  [0.5, 1.15, 1.45], [-0.5, 1.15, 1.45], [0.56, 1.2, -1.5], [-0.56, 1.2, -1.5], [0, 2.72, -2.15], [0, 2.72, -3.4], [0, 2.72, -4.6], [0, 0, 0]];
const CAT_LEGS = [{ up: 4, lo: 8, body: 2, l1: 1.15, l2: 1.3, bend: -1, ph: 0 }, { up: 5, lo: 9, body: 2, l1: 1.15, l2: 1.3, bend: -1, ph: 0.5 },
  { up: 6, lo: 10, body: 0, l1: 1.2, l2: 1.45, bend: 1, ph: 0.55 }, { up: 7, lo: 11, body: 0, l1: 1.2, l2: 1.45, bend: 1, ph: 0.05 }];
function makeCat(mk, ginger) {
  const coat = new THREE.Color(ginger ? '#c06c26' : '#e9e6df'), belly = new THREE.Color(ginger ? '#ecd2a4' : '#f2f0ea'), pinkC = new THREE.Color('#c98f88');
  const M = catMesher(), ss = smoothstep, HC = CAT_HEAD;
  // torso and neck: rump, haunch, tucked waist, deep chest, shoulder blades, the neck rising into the skull
  const TR = [[-2.3, 0.22, 0.26, 2.62], [-2.1, 0.6, 0.68, 2.52], [-1.7, 0.84, 0.9, 2.42], [-1.2, 0.9, 0.96, 2.38], [-0.6, 0.8, 0.84, 2.42], [0, 0.74, 0.78, 2.46], [0.6, 0.8, 0.86, 2.42],
    [1.1, 0.88, 0.98, 2.36], [1.5, 0.84, 1.0, 2.38], [1.85, 0.7, 0.9, 2.5], [2.1, 0.56, 0.74, 2.66], [2.3, 0.5, 0.62, 2.82], [2.5, 0.47, 0.56, 2.98], [2.7, 0.5, 0.56, 3.1]];
  M.add(loft(TR.length, 18, (k, a, out) => {
    const [z, rx, ry, yc] = TR[k], sn = Math.sin(a), cs = Math.cos(a);
    const bl = Math.exp(-(((z - 1.4) / 0.38) ** 2)) * Math.max(sn, 0) ** 2 * Math.abs(cs) * 0.5 + Math.exp(-(((z + 1.45) / 0.5) ** 2)) * Math.abs(cs) ** 1.5 * 0.13;
    out.set(-rx * cs * (1 + bl), yc + ry * sn * (sn < 0 ? 0.9 : 1 + 0.4 * bl), z); return 1;
  }, true, true), (x, y, z, sh, col, o) => {
    const low = ss(2.2, 1.75, y) * (z > 1.3 ? 1 : 0.8), front = ss(1.7, 2.2, z) * ss(2.9, 2.3, y);
    col.copy(coat).lerp(belly, Math.max(low, front)); o.fur = 1 + 0.35 * front + 0.15 * low;
    if (z < 0) { o.skin[0] = 0; o.skin[1] = 1; o.skin[2] = ss(-1.6, 0, z); } else if (z < 1.6) { o.skin[0] = 1; o.skin[1] = 2; o.skin[2] = ss(0, 1.5, z); } else { o.skin[0] = 2; o.skin[1] = 3; o.skin[2] = ss(1.9, 2.7, z); }
    o.skin[3] = 0;
  });
  // head: skull, broad cheeks, the stop, a short wedge of muzzle; the face is painted in the shader
  const HR = [[-0.78, 0.2, 0.2, 0], [-0.6, 0.56, 0.52, 0.02], [-0.3, 0.76, 0.68, 0.04], [0.05, 0.86, 0.72, 0.02], [0.32, 0.84, 0.68, -0.02], [0.5, 0.7, 0.56, -0.08], [0.64, 0.5, 0.42, -0.16], [0.8, 0.4, 0.33, -0.2], [0.92, 0.3, 0.25, -0.22], [1.0, 0.16, 0.14, -0.2]];
  M.add(loft(HR.length, 20, (k, a, out) => {
    const [z, rx, ry, yc] = HR[k], sn = Math.sin(a), cs = Math.cos(a), cheek = k >= 2 && k <= 5 ? 0.16 * Math.sqrt(Math.max(-sn, 0)) * Math.abs(cs) : 0;
    out.set(HC[0] - rx * cs * (1 + cheek), HC[1] + yc + ry * sn * (sn > 0 ? 0.92 : 1), HC[2] + z); return 1;
  }, true, true), (x, y, z, sh, col, o) => {
    const hz = z - HC[2], hy = y - HC[1], muz = ss(0.5, 0.72, hz);
    col.copy(coat).lerp(belly, Math.max(muz, ss(-0.2, -0.5, hy)));
    o.fur = lerp(0.55 + 0.45 * ss(0.1, -0.4, hy) * ss(0.6, 0.2, hz), 0.2, muz);
    o.skin[0] = 3; o.skin[1] = 3; o.skin[2] = 0; o.skin[3] = 1;
  });
  // ears: a cupped triangle, pink within, coat behind
  for (const s of [-1, 1]) for (const back of [0, 1]) {
    const g = new THREE.PlaneGeometry(1, 1, 4, 4), p = g.attributes.position, rot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.12, s * 0.5, -s * 0.3, 'YXZ')), v = new V3();
    const flag = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i), t = p.getY(i) + 0.5;
      v.set(u * 0.7 * (1 - 0.9 * Math.pow(t, 1.3)), t * 0.84, -0.17 * (1 - 4 * u * u) * (1 - t) - (back ? 0.04 : 0)).applyMatrix4(rot);
      p.setXYZ(i, HC[0] + s * 0.5 + v.x, HC[1] + 0.46 + v.y, HC[2] - 0.08 + v.z);
      flag[i] = !back && Math.abs(u) < 0.3 * (1 - t) + 0.06 && t < 0.82 ? 1 : 0;
    }
    if (back) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const q = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = q; } }
    g.computeVertexNormals(); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(p.count * 3), 3));
    for (let i = 0; i < p.count; i++) g.attributes.color.setX(i, flag[i]);
    M.add(g, (x, y, z, fl, col, o) => { col.copy(coat).lerp(pinkC, fl); o.fur = fl > 0.5 ? 0.1 : back ? 0.4 : 0.3; o.skin[0] = 3; o.skin[1] = 3; o.skin[2] = 0; o.skin[3] = 0; });
  }
  // legs: an upper and a lower length each; the hind ones have the long thigh and the hock set back
  const FU = [[-1.15, 0.24, 0.26], [-0.8, 0.26, 0.29], [-0.45, 0.31, 0.36], [-0.1, 0.38, 0.45], [0.25, 0.42, 0.5]];
  const FL = [[-1.3, 0.14, 0.2, 0.27], [-1.22, 0.13, 0.27, 0.36], [-1.04, 0.03, 0.19, 0.21], [-0.6, 0, 0.2, 0.21], [-0.2, 0, 0.225, 0.24], [0.1, 0, 0.24, 0.26]];
  const HU = [[-1.2, 0.26, 0.3, 0], [-0.85, 0.34, 0.48, -0.05], [-0.45, 0.44, 0.66, -0.1], [-0.05, 0.5, 0.78, -0.1], [0.3, 0.46, 0.7, -0.05]];
  const HL = [[-1.45, 0.16, 0.2, 0.3], [-1.36, 0.14, 0.27, 0.38], [-1.2, 0.02, 0.19, 0.22], [-0.95, -0.25, 0.17, 0.2], [-0.72, -0.42, 0.2, 0.24], [-0.45, -0.3, 0.21, 0.27], [-0.15, -0.08, 0.25, 0.32], [0.1, 0, 0.27, 0.34]];
  CAT_LEGS.forEach((Lg) => {
    const hind = Lg.bend > 0, pu = CAT_PIV[Lg.up], pl = CAT_PIV[Lg.lo], U = hind ? HU : FU, Lw = hind ? HL : FL;
    M.add(loft(U.length, 10, (k, a, out) => { const r = U[k]; out.set(pu[0] + Math.cos(a) * r[1], pu[1] + r[0], pu[2] + (r[3] || 0) + Math.sin(a) * r[2]); return 1; }, false, true),
      (x, y, z, sh, col, o) => { const t = (y - pu[1] + U[0][0] * -1) / (U[U.length - 1][0] - U[0][0]); col.copy(coat); o.fur = 0.8; o.skin[0] = Lg.up; o.skin[1] = Lg.body; o.skin[2] = 0.7 * ss(0.5, 1, t); o.skin[3] = 0; });
    M.add(loft(Lw.length, 10, (k, a, out) => { const r = Lw[k], toe = k < 2 ? 1 + 0.07 * Math.cos(3 * a - PI / 2) * Math.max(Math.sin(a), 0) : 1; out.set(pl[0] + Math.cos(a) * r[2] * toe, pl[1] + r[0], pl[2] + r[1] + Math.sin(a) * r[3] * toe); return 1; }, true, true),
      (x, y, z, sh, col, o) => { const ly = y - pl[1]; col.copy(coat).lerp(belly, ss(-0.9, -1.15, ly)); o.fur = lerp(0.5, 0.26, ss(-0.9, -1.15, ly)); o.skin[0] = Lg.lo; o.skin[1] = Lg.up; o.skin[2] = 0.5 * ss(-0.35, 0.1, ly); o.skin[3] = 0; });
  });
  // tail: from the tip to the root
  const NT = 12, tz0 = -5.85, tz1 = -2.05;
  M.add(loft(NT, 10, (k, a, out) => { const t = k / (NT - 1), r = k === 0 ? 0.1 : lerp(0.21, 0.31, t) * (1 - 0.12 * Math.sin(t * 9)); out.set(-Math.cos(a) * r, 2.72 + Math.sin(a) * r, lerp(tz0, tz1, t)); return 1; }, true, true),
    (x, y, z, sh, col, o) => { col.copy(coat).lerp(belly, ss(-5.4, -5.85, z) * 0.7); o.fur = 1.5 - 0.3 * ss(-5.0, -5.85, z); o.skin[3] = 0;
      if (z > -3.7) { o.skin[0] = 12; o.skin[1] = 13; o.skin[2] = ss(-2.7, -3.7, z); } else { o.skin[0] = 13; o.skin[1] = 14; o.skin[2] = ss(-3.9, -4.9, z); } });

  const bones = [], W = []; for (let i = 0; i < CAT_NB; i++) { bones.push(new THREE.Matrix4()); W.push(new THREE.Matrix4()); }
  const own = { uBone: { value: bones }, uFur: { value: new THREE.Vector4(0.2, 0.065, 0.02, ginger ? 1 : 0) }, uEye: { value: new THREE.Color(ginger ? '#7ea83a' : '#d79a1e') }, uShellP: { value: new THREE.Vector4(0.3, 0.55, 0.22, 0) } };
  const mesh = new THREE.Mesh(M.build([0]), mk(CAT_VERT, CAT_FRAG, own)); mesh.frustumCulled = false; mesh.name = 'cat';
  const fur = new THREE.Mesh(M.build([0.2, 0.4, 0.6, 0.8, 1]), mk(CAT_VERT, CAT_FRAG, own, { transparent: true, depthWrite: false })); fur.frustumCulled = false; fur.renderOrder = 3; fur.name = 'cat-coat';
  const root = new THREE.Matrix4(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new V3(), one = new V3(1, 1, 1), v = new V3(), kv = new V3(CAT_K, CAT_K, CAT_K);
  const frame = (out, parent, px, py, pz, rx, ry, rz) => { e.set(rx, ry, rz, 'YXZ'); q.setFromEuler(e); p.set(px, py, pz); m.compose(p, q, one); if (parent) out.multiplyMatrices(parent, m); else out.copy(m); };
  // st: { x, y, z, s (distance walked), air (0..1 through a hop, or -1), hopSign, curl 0..1, look (head yaw), time }
  function pose(st) {
    const lie = st.curl, w = 1 - lie, cyc = st.s / (CAT_LS * CAT_K), ph = cyc * TAU, air = st.air >= 0 ? Math.sin(st.air * PI) : 0, t = st.time;
    e.set(st.air >= 0 ? 0.36 * Math.cos(st.air * PI) * st.hopSign : 0, st.yaw || 0, 0, 'YXZ'); q.setFromEuler(e); p.set(st.x, st.y, st.z); root.compose(p, q, kv);
    const bob = 0.045 * Math.sin(ph * 2) * w, breath = 0.035 * Math.sin(t * 1.6) * lie;
    frame(W[1], null, 0.2 * lie, 2.28 + bob - 1.33 * lie + breath, 0, 0, 0, 0);          // carried a little low: wrists and hocks stay bent
    frame(W[0], W[1], 0, 0.05, -1.3, -0.05 * Math.sin(ph + 0.6) * w + 0.2 * air * st.hopSign, 0.08 * Math.sin(ph) * w + 0.75 * lie, 0);
    frame(W[2], W[1], 0, -0.05, 1.3, 0.04 * Math.sin(ph) * w - 0.18 * air * st.hopSign, -0.08 * Math.sin(ph) * w - 0.8 * lie, 0);
    frame(W[3], W[2], 0, 0.65, 1.25, 0.08 * w + 0.05 * Math.sin(ph * 2 + 1) * w + 0.42 * lie + 0.1 * air, (st.look || 0) * w + 0.08 * Math.sin(t * 0.9) * w - 0.95 * lie, 0.22 * lie);
    const sw = 0.28 * Math.sin(t * 1.3) * w + 0.1 * Math.sin(ph);
    frame(W[12], W[0], 0, 0.22, -0.85, lerp(0.8 - 0.45 * air, -0.12, lie), sw * 0.6 + 0.95 * lie, 0);
    frame(W[13], W[12], 0, 0, -1.25, lerp(0.25, 0, lie), sw * 0.8 + 0.95 * lie, 0);
    frame(W[14], W[13], 0, 0, -1.2, lerp(-0.8, 0, lie), 0.4 * Math.sin(t * 2.1 + 1) * (0.3 + 0.7 * w) + 0.85 * lie, 0);
    for (const Lg of CAT_LEGS) {
      const bp = CAT_PIV[Lg.body], up = CAT_PIV[Lg.up], hind = Lg.bend > 0;
      v.set(up[0] - bp[0], up[1] - bp[1], up[2] - bp[2]).applyMatrix4(W[Lg.body]);                 // the shoulder or hip, carried by the body
      const f = ((cyc + Lg.ph) % 1 + 1) % 1; let fz, fy;
      if (f < 0.62) { fz = up[2] + CAT_LS * (f - 0.31); fy = 0; } else { const qq = (f - 0.62) / 0.38; fz = up[2] + CAT_LS * (0.31 - 0.62 * qq * qq * (3 - 2 * qq)); fy = 0.55 * Math.sin(PI * qq); }
      fz = lerp(fz, v.z + (hind ? -0.9 : 0.9), air); fy = lerp(fy, v.y - 1.95, air);              // in the air the forelegs reach and the hind legs trail
      fz = lerp(fz, v.z + (hind ? 0.8 : 0.9), lie); fy = lerp(fy, v.y - 0.5, lie);                // asleep, all four are folded under
      const dz = fz - v.z, dy = v.y - fy, D = clamp(Math.hypot(dz, dy), Math.abs(Lg.l1 - Lg.l2) + 0.05, Lg.l1 + Lg.l2 - 0.02), al = Math.atan2(dz, dy);
      const a1 = al + Lg.bend * Math.acos(clamp((Lg.l1 * Lg.l1 + D * D - Lg.l2 * Lg.l2) / (2 * Lg.l1 * D), -1, 1)), ky = v.y - Lg.l1 * Math.cos(a1), kz = v.z + Lg.l1 * Math.sin(a1);
      frame(W[Lg.up], null, v.x, v.y, v.z, -a1, 0, 0);
      frame(W[Lg.lo], null, v.x, ky, kz, -Math.atan2(fz - kz, Math.max(ky - fy, 0.05)), 0, 0);
    }
    for (let k = 0; k < CAT_NB - 1; k++) { const pv = CAT_PIV[k]; m.makeTranslation(-pv[0], -pv[1], -pv[2]); bones[k].multiplyMatrices(root, W[k]).multiply(m); }
    bones[CAT_NB - 1].copy(root);
  }
  return { mesh, fur, pose, triangles: M.triangles * 6 };
}

// ------------------------------------------------------------------------------------------------ air: steam, drops, pigeons
// Steam runs backwards: each puff's age falls with time, so it sinks and shrinks into its spout or glass. Drops rise
// from the drip bowl to the samovar tap. Both are camera-facing quads in one draw call.
const STEAM_VERT = /* glsl */`
uniform float uTime;
attribute vec4 iS; attribute vec4 iR;
varying vec2 vUv; varying vec2 vA; varying vec3 vL;
${FOG_V}
void main() {
  float age = fract(iR.x - uTime * iR.y); vec3 C; float size;
  if (iR.z < .5) {
    float w = iS.w, wob = sin(age * 5. + iR.x * 40.);
    vec2 d = vec2(cos(iR.w), sin(iR.w)) * (age * 1.5 + .45 * wob) * w * age;
    C = iS.xyz + vec3(d.x, (age * age * 6.5 + age * 2.2) * w, d.y); size = w * (.55 + 3.4 * age);
    vA = vec2(smoothstep(0., .1, age) * (1. - age) * (1. - age) * .5, 0.);
  } else {
    float f = 1. - age, g = 1. - (1. - f) * (1. - f);
    C = iS.xyz + vec3(0., iS.w * g, 0.); size = .3; vA = vec2(.95 * smoothstep(0., .08, f) * (1. - smoothstep(.93, 1., f)), 1.);
  }
  vUv = position.xy * 2.;
  vec4 wp = modelMatrix * vec4(C, 1.); vL = wp.xyz + vec3(0., 0., ${(-HZ).toFixed(1)});
  vec4 mvPosition = viewMatrix * wp; mvPosition.xy += position.xy * size; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STEAM_FRAG = /* glsl */`
${HERO_GLSL.light}
uniform vec3 uDrop;
varying vec2 vUv; varying vec2 vA; varying vec3 vL;
${FOG_F}
void main() {
  float d = dot(vUv, vUv), beam = beamMask(vL);
  float soft = 1. - smoothstep(.1, 1., d);
  vec3 steam = uSunCol * beam * .3 + uSkyCol * 1.5 + uFill.rgb * 1.2 + uBounceCol * .3;
  vec3 col = mix(steam, uDrop * (uSunCol * beam + uSkyCol) * 1.4, vA.y);
  float a = vA.x * mix(soft * soft, 1. - smoothstep(.5, .8, d), vA.y);
  gl_FragColor = vec4(clamp(col, 0., 24.), a);
  #include <fog_fragment>
}`;
function makeAir(rng, mk, timeU, spouts, glasses, SAM, liquid, detail) {
  const S = [], R = [];
  for (const sp of spouts) { const n = Math.round(22 * detail); for (let k = 0; k < n; k++) { S.push(sp[0], sp[1], sp[2], sp[3] * (0.8 + rng() * 0.5)); R.push(rng(), 0.1 + rng() * 0.06, 0, rng() * TAU); } }
  for (const g of glasses) { if (rng() > 0.85 * detail) continue; S.push(g[0], g[1], g[2], g[3] * (0.7 + rng() * 0.5)); R.push(rng(), 0.16 + rng() * 0.1, 0, rng() * TAU); }
  for (let k = 0; k < 4; k++) { S.push(SAM[0] - 2.62, SAM[1] + 0.75, SAM[2], 1.6); R.push(k / 4 + rng() * 0.1, 0.42, 1, 0); }
  const n = R.length / 4;
  const mesh = new THREE.Mesh(instanced(QUAD(), n, { iS: [new Float32Array(S), 4], iR: [new Float32Array(R), 4] }),
    mk(STEAM_VERT, STEAM_FRAG, { uTime: timeU, uDrop: { value: new THREE.Color(liquid) } }, { transparent: true, depthWrite: false }));
  mesh.frustumCulled = false; mesh.renderOrder = 9;
  return { mesh, triangles: n * 2 };
}
// Pigeons, flying tail first: they face one way and travel the other. Outside the four windows they pass along the
// street; beyond the hatch they cross it; two sit on the hatch sill and un-land (u 0.86-0.97).
const PIGEON_VERT = /* glsl */`
uniform float uTime; uniform float uU;
attribute vec3 color; attribute vec4 surf; attribute vec4 iP; attribute vec4 iQ;
varying vec3 vN; varying vec3 vColor; varying vec3 vView;
${FOG_V}
void main() {
  float sit = step(.5, iQ.w), k = smoothstep(.9, .99, uU) * sit, flying = mix(1., smoothstep(0., .08, k), sit);
  vec3 p = position, n = normal; float side = surf.x < .5 ? 0. : (surf.x < 1.5 ? 1. : -1.);
  float flap = sin(uTime * (9. + 3. * fract(iQ.x * 7.)) + iQ.x * 30.) * .85 * flying + (1. - flying) * 1.25;
  if (side != 0.) {                                             // wings hinge on the shoulder; folded down the flanks when sitting
    float a = flap * side, c = cos(a), s = sin(a); vec2 h = vec2(.3 * side, .2);
    vec2 q = p.xy - h; q.x *= mix(1., .35, 1. - flying); p.xy = h + vec2(q.x * c - q.y * s, q.x * s + q.y * c); n.xy = vec2(n.x * c - n.y * s, n.x * s + n.y * c);
  }
  float dir = iP.w < 0. ? -1. : 1.;                             // facing; travel is the opposite way
  p.z *= dir; p.x *= dir; n.z *= dir; n.x *= dir;
  vec3 C;
  if (iQ.y < .5) { C = vec3(iP.x, iP.y + iQ.z * sin(uTime * .7 + iQ.x * 20.), -492. + mod(iP.z - iP.w * uTime + 5500., 560.)); }
  else { p = vec3(p.z, p.y, -p.x); n = vec3(n.z, n.y, -n.x); C = vec3(-150. + mod(iP.x - iP.w * uTime + 3000., 300.), iP.y + iQ.z * sin(uTime * .7 + iQ.x * 20.), iP.z); }
  if (sit > .5) { p = vec3(position.x, position.y, position.z); n = normal; if (side != 0.) { float a = flap * side, c = cos(a), s = sin(a); vec2 h = vec2(.3 * side, .2); vec2 q = p.xy - h; q.x *= mix(.35, 1., flying); p.xy = h + vec2(q.x * c - q.y * s, q.x * s + q.y * c); }
    C = iP.xyz + k * k * vec3(iQ.z * 9., 15., -34.) + vec3(0., .5 * flying * sin(uTime * 3.), 0.); }
  vec3 P = C + p * 1.9;
  vec4 wp = modelMatrix * vec4(P, 1.); vN = n; vColor = color; vView = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PIGEON_FRAG = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform float uOut;
varying vec3 vN; varying vec3 vColor; varying vec3 vView;
${FOG_F}
void main() {
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(vView + vec3(1e-5)); if (dot(N, V) < 0.) N = -N;
  vec3 col = vColor * (uSunCol * uOut * .45 * max(dot(N, normalize(uSunDir)) * .6 + .4, 0.) + uSkyCol * (2.2 + N.y));
  gl_FragColor = vec4(clamp(col, 0., 24.), 1.);
  #include <fog_fragment>
}`;
function makePigeons(rng, mk, timeU, uU, L) {
  const b = INT.makeBuilder(), grey = '#7f8a98', dk = '#3d4654';
  const body = sph(1, 10, 7); body.scale(0.42, 0.42, 1.0);
  b.add(body, { c: grey, surf: [0, 0, 0, 1], tint: (X, Y, Z, col) => { if (Z > 0.55) col.set('#3f6a5c'); if (Y < -0.2) col.multiplyScalar(1.25); } });
  b.add(sph(0.26, 8, 6), { p: [0, 0.3, 1.0], c: dk, surf: [0, 0, 0, 1] });
  b.add(new THREE.ConeGeometry(0.07, 0.3, 5), { p: [0, 0.27, 1.32], r: [PI / 2, 0, 0], c: '#d8b060', surf: [0, 0, 0, 1] });
  const fan = (pts, part, c) => { for (let i = 1; i + 1 < pts.length; i++) b.quad(pts[0], pts[i], pts[i + 1], pts[i + 1], c, [part, 0, 0, 1]); };
  fan([[0, 0.05, -0.7], [0.5, 0.05, -1.75], [0.2, 0.05, -1.9], [-0.2, 0.05, -1.9], [-0.5, 0.05, -1.75]], 0, dk);
  for (const s of [1, -1]) {
    fan([[s * 0.3, 0.2, 0.55], [s * 1.5, 0.2, 0.6], [s * 2.5, 0.2, 0.15], [s * 2.6, 0.2, -0.35], [s * 1.4, 0.2, -0.5], [s * 0.3, 0.2, -0.45]], s > 0 ? 1 : 2, grey);
    fan([[s * 1.3, 0.22, 0.1], [s * 2.5, 0.22, 0.05], [s * 2.6, 0.22, -0.35], [s * 1.4, 0.22, -0.5]], s > 0 ? 1 : 2, dk);
  }
  const P = [], Q = [], n = 24;
  for (let i = 0; i < n; i++) {
    const grp = Math.floor(i / 3), v = (7 + (grp * 37 % 5)) * (grp % 2 ? 1 : -1);
    if (i < 18) { P.push(XL - 12 - (grp % 3) * 5 - rng() * 3, 14 + (grp * 5.3 % 17) + rng() * 4, grp * 117 + (i % 3) * 7 + rng() * 3, v); Q.push(rng(), 0, 0.8 + rng(), 0); }
    else if (i < 22) { P.push(grp * 70 + (i % 3) * 7, 16 + (i % 3) * 3.5 + rng() * 3, Z1 - 26 - rng() * 12, v * 0.8); Q.push(rng(), 1, 0.6 + rng(), 0); }
    else { const s = i === 22 ? -1 : 1; P.push(s * 9.6, HATCH.y0 + 1.2, Z1 + 3.2, 1); Q.push(rng(), 0, s, 1); }
  }
  const mesh = new THREE.Mesh(instanced(b.build(), n, { iP: [new Float32Array(P), 4], iQ: [new Float32Array(Q), 4] }), mk(PIGEON_VERT, PIGEON_FRAG, { uTime: timeU, uU, uOut: { value: L.wallSun } }));
  mesh.frustumCulled = false;
  return { mesh, triangles: b.triangles * n };
}

// ------------------------------------------------------------------------------------------------ the world
// Low down the axis to the leaning tray, left into the aisle behind it as it rolls, then up and round to the left of
// the rising tray, so that the climb is seen from above its rim, over the top of it and down to pass it abreast.
const PATH = [[16, 7, 18.5], [16, 7, 0], [2, 7.3, -24], [-14, 7.8, -50], [-19.5, 8.6, -80], [-9.5, 12.5, -104], [-10.5, 18.5, -117.5], [-7.2, 27, -130], [-1, 28.5, -142], [2, 26, -152], [1, 23, -168],
  [-13, 14.8, -214], [-14.5, 15.2, -237], [4.5, 18.8, -257.5], [11.4, 21, -267], [9.7, 21.3, -274.4], [3, 19.5, -282],
  [-2, 15, -293], [3.8, 11.9, -320], [4.1, 12.3, -345], [3.6, 19.6, -366], [0.8, 17.4, -389], [0, 18.8, -408], [0, 18.8, -468]];
const PATH_CAM = makePath(PATH);
// THE HOLD. The route as drawn comes abreast of the laid tray at u 0.386 and is 13 m past it by 0.41. So that the tray
// can be held whole and close for two seconds (u 0.385 to 0.41), the camera flies this route with a lag: from u 0.338
// it falls behind its place on the curve, 7.5 m behind by u 0.395, and makes that up between u 0.408 and 0.462 (the
// tray is then 13.7 m off at the nearest: 47% of a wide frame, 89% of a tall one). pace() divides the lag out again,
// so the camera's true speed has no dip and no lurch. The length, and with it the u of everything else on the route,
// is unchanged.
const HOLD = { lag: 7.5, a: [0.3376, 0.3945], b: [0.408, 0.462] };
function makeFly(base) {
  const L = base.length, tmp = new THREE.Vector3();
  const lag = (d) => HOLD.lag * smoothstep(HOLD.a[0] * L, HOLD.a[1] * L, d) * (1 - smoothstep(HOLD.b[0] * L, HOLD.b[1] * L, d));
  const fly = {
    base, length: L, points: base.points, curve: base.curve, start: base.start, end: base.end, startTangent: base.startTangent, endTangent: base.endTangent,
    lagSlope: (u) => (lag(u * L + 0.5) - lag(u * L - 0.5)),
    posAtDist(d, out = new THREE.Vector3()) { return base.posAtDist(d - lag(d), out); },
    tangentAtDist(d, out = new THREE.Vector3()) { fly.posAtDist(d + 0.3, out); fly.posAtDist(d - 0.3, tmp); return out.sub(tmp).normalize(); },
    pointAt(u, out = new THREE.Vector3()) { return fly.posAtDist(u * L, out); },
    tangentAt(u, out = new THREE.Vector3()) { return fly.tangentAtDist(u * L, out); },
    nearestXZ: (x, z) => base.nearestXZ(x, z), distanceTo: (x, y, z) => base.distanceTo(x, y, z), isClear: (x, y, z, r, m) => base.isClear(x, y, z, r, m),
    frameAt: (end, out, tilt) => base.frameAt(end, out, tilt),
  };
  return fly;
}
const PATH_FLY = makeFly(PATH_CAM);
// From (-2, 15, -293) to the portal the route is the one the rack and the exit were staged on, when the whole flight was
// 511.19 m long. What happens there is keyed to that older u: tailU(u) gives it (the same metres short of the portal).
// Everything from the laid tray on is staged in refU(u): the u of the route as it was (525.69 m) before the approach
// to the sack was re-laid, measured by the metres left to the portal, so nothing downstream moved.
const L_REF = 525.6925, refU = (u) => 1 - (1 - u) * PATH_CAM.length / L_REF;
const TAIL_K = L_REF / 511.187, tailU = (u) => 1 - (1 - u) * TAIL_K, fromTail = (ut) => 1 - (1 - ut) / TAIL_K;
// The cat's route (it faces +z and goes backwards toward -z; yaw turns it): north along the front of the pass shelf and
// past the sack; at the shelf's end it stands turned to the room while the sack rights itself and the nuts come home
// (u 0.588-0.618); a leap out round the rack's end post and down to its lower shelf (0.63-0.66); backwards along that
// shelf into the fourth window's beam with the camera drawing level, a spring to the upper shelf, and the place it was
// asleep. From the leap's landing on, its times are in tailU.
const CAT = { walk: 0.572, hold: [0.588, 0.618], hop1: [0.63, 0.66], hop2: [0.735, 0.765], curl: [0.795, 0.822], lane: 11.6, stand: [13.6, -287.2], off: [13.6, -287.3] };
const CAT_T0 = tailU(CAT.hop1[1]);
const catZA = makePchip([0.36, 0.40, 0.45, 0.51, CAT.walk], [-180, -187.5, -212, -247, -285.5]), catZB = makePchip([CAT_T0, 0.70, CAT.hop2[0]], [-313, -327.5, -350.5]);
function catAt(u, st) {
  const ss = smoothstep;
  st.air = -1; st.hopSign = 1; st.x = CAT.lane; st.yaw = 0;
  if (u <= CAT.walk) { st.z = catZA(u); st.y = SHELF.top; st.x = lerp(14.4, 13, ss(0.37, 0.41, u)); st.s = -st.z; st.curl = 0; return st; }
  if (u <= CAT.hop1[0]) {                                   // the turn at the shelf's end, the look, the turn back
    const a = ss(CAT.walk, CAT.hold[0], u), b = ss(CAT.hold[1], CAT.hop1[0], u);
    st.x = lerp(lerp(13, CAT.stand[0], a), CAT.off[0], b); st.z = lerp(lerp(-285.5, CAT.stand[1], a), CAT.off[1], b); st.y = SHELF.top;
    st.yaw = -1.2 * a * (1 - b) - 0.12 * b; st.s = 285.5 + 4.2 * a - 3.7 * b; st.curl = 0; return st;
  }
  if (u < CAT.hop1[1]) {
    const t = (u - CAT.hop1[0]) / (CAT.hop1[1] - CAT.hop1[0]);
    st.z = lerp(CAT.off[1], -313, t); st.x = lerp(CAT.off[0], CAT.lane, t) - 4.4 * Math.sin(PI * Math.pow(t, 0.85));
    st.y = lerp(SHELF.top, RACK.lo, Math.pow(t, 1.2)) + 2.0 * Math.sin(PI * t); st.air = t; st.hopSign = -1; st.yaw = -0.12 * (1 - t);
    st.s = lerp(286, 313, t); st.curl = 0; return st;
  }
  const ut = tailU(u);
  if (ut <= CAT.hop2[0]) { st.z = catZB(ut); st.y = RACK.lo; }
  else if (ut < CAT.hop2[1]) { const t = (ut - CAT.hop2[0]) / (CAT.hop2[1] - CAT.hop2[0]); st.z = lerp(-350.5, -364.5, t); st.y = lerp(RACK.lo, RACK.hi, t) + 4.4 * Math.sin(PI * t); st.air = t; }
  else { const t = clamp((ut - CAT.hop2[1]) / (0.8 - CAT.hop2[1]), 0, 1); st.z = lerp(-364.5, -382.6, t * (2 - t)); st.y = RACK.hi; }
  st.s = -st.z; st.curl = ss(CAT.curl[0], CAT.curl[1], ut);
  return st;
}
const GZ = { mouth: 0.12, sack: 0.09 }, RAY_THIN = 0.55, HOLD_AIM = 0.3;
const tauCat = (u) => Math.max((CAT.curl[1] - tailU(u)) * 46, 0);

// The hero's clock, the nuts and the gaze up to the sack were set on an earlier route of 506.99 m. Both routes share
// their knots from (-10.5, 18.5, -117.5) to (-4, 15, -225), so legacyU(u) is the u at which the old route had the camera
// where this one has it: the rise is filmed from exactly the places it was.
const LEG = (() => {
  const L0 = 506.99, sA0 = 147.81, A = new V3(-10.5, 18.5, -117.5), q = new V3(); let best = 1e9, uA = 0.29;
  for (let i = 0; i <= 3000; i++) { const u = 0.22 + 0.14 * i / 3000, d = PATH_CAM.pointAt(u, q).distanceTo(A); if (d < best) { best = d; uA = u; } }
  return { L0, sA0, uA0: sA0 / L0, uA, sA1: uA * PATH_CAM.length, L1: PATH_CAM.length };
})();
const legacyU = (u) => (u < LEG.uA ? u * LEG.uA0 / LEG.uA : (u * LEG.L1 - LEG.sA1 + LEG.sA0) / LEG.L0);
const fromLegacy = (ul) => (ul < LEG.uA0 ? ul * LEG.uA / LEG.uA0 : (ul * LEG.L0 - LEG.sA0 + LEG.sA1) / LEG.L1);

export default {
  id: 'the-unspilling',
  name: 'The Unspilling',
  category: 'interior',
  weirdness: 0.35,
  media: ['interior', 'air'],
  async build(ctx) {
    const { rng } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();
    // ---------------------------------------------------------------- per-seed look
    const hour = vary.hour || 'any';
    const li = hour === 'dawn' ? 1 : hour === 'night' ? 2 : (hour === 'day' || hour === 'golden') ? 0 : Math.floor(rng.fork('look76')() * 3) % 3;
    const SW = rng.fork('swaps'), gingerDraw = SW(), nutKind = SW() < 0.35 ? 'hazel' : 'pist', cobalt = SW() < 0.35;
    const tile0 = cobalt ? (li === 2 ? '#2552c8' : '#2a4f9c') : (li === 2 ? '#10a59e' : TURQ), tile = li === 1 ? hexMix(tile0, '#98a4ac', 0.62) : tile0;      // under the rose sun the tile is laid in stronger, so it stays the ruby's cool partner
    const L = { ...LOOKS[li], density: clamp(vary.density ?? 1, 0.7, 1.3) }, rare = !!vary.rare;
    const ginger = li === 2 && gingerDraw < 0.5;             // white on walnut by default; in the milk look yolk is the only colour
    const liquid = li === 0 ? AMBER : li === 1 ? '#efeadf' : '#a01428', saucer = L.saucer || (li === 2 ? '#7a1f3a' : '#a23a34');
    const fogCol = new THREE.Color(L.fog);
    scene.background = fogCol.clone(); scene.fog = new THREE.FogExp2(fogCol, L.fogD);
    const timeU = { value: 0 }, uU = { value: 0 }, tauCU = { value: 99 };

    // ---------------------------------------------------------------- light rig: the four windows, the end window, the hatch
    const rig = INT.makeLightRig({ scale: SC, sunDir: L.sunDir, sunColor: L.sunColor, sunIntensity: L.sunI, ambient: L.amb, ambientSky: L.ambSky, ambientGround: L.ambGround,
      bounceColor: '#f0d2a4', bounce: L.bounce, aoStrength: 0.9, dapple: { amount: li === 1 ? 0.45 : 0.6, size: 1.1, speed: 1.5 } });
    rig.addWindowRow({ origin: [XL, 23, -75], axis: [0, 0, -1], normal: [1, 0, 0], width: 70, height: 30, spacing: 100, count: 3, mullions: [5, 3], bar: 0.45, sky: L.skyTop, skyIntensity: L.fill });
    // the fourth window is a bay wider than the others: its beam reaches the near end of the rack, where the cat lands
    rig.addWindowRow({ origin: [XL, 23, (WIN[3][0] + WIN[3][1]) / 2], axis: [0, 0, -1], normal: [1, 0, 0], width: WIN[3][0] - WIN[3][1], height: 30, count: 1, mullions: [6, 3], bar: 0.45, sky: L.skyTop, skyIntensity: L.fill });
    rig.addWindowRow({ origin: [XL, 23, (WIN5[0] + WIN5[1]) / 2], axis: [0, 0, -1], normal: [1, 0, 0], width: WIN5[0] - WIN5[1], height: 30, count: 1, mullions: [3, 3], bar: 0.45, sky: L.skyTop, skyIntensity: L.fill });
    const hrow = rig.addWindowRow({ origin: [0, 19.8, Z1], axis: [1, 0, 0], normal: [0, 0, 1], width: 22, height: 18, count: 1, arch: 1, mullions: [1, 1], bar: 0, sky: L.skyLow, skyIntensity: L.fill * 0.75 });
    const drow = rig.addWindowRow({ origin: [9, 15, Z0], axis: [1, 0, 0], normal: [0, 0, -1], width: 44, height: 28, count: 1, sun: false, sky: L.skyLow, skyIntensity: L.fill * 1.5 });
    if (drow) drow.noShaft = true;                             // the door we came in by: soft daylight on whatever faces the entry
    if (hrow) hrow.noShaft = true;                             // the sun comes in at the hatch too, low and from the left; no beam is drawn across the portal
    rig.setBounds([XL, 0, Z1], [XR, TOP, Z0], 0);
    const occTray = rig.addOccluder([14, 18, -165], 6.6), occCat = rig.addOccluder([14, 20, -178], 2.6);
    rig.addOccluder([SACK.x, 21, SACK_Z], 3.6); rig.addOccluder([9, 13, -218], 2.4);
    // The light the sunlit floor throws back up at the walnut fronts that stand out of the sun: the island's end, which
    // faces the door, and the stretch of its aisle face in the shadow of the pier between the first two windows (the tray
    // rolls past the one and rises in front of the other). They sit under the floor, so the floor itself takes nothing.
    for (const [x, y, z, k, r] of [[15, -6, -31, 30, 40], [1, -5, -102, 32, 30], [1, -5, -117, 32, 30]]) rig.addLight({ position: [x, y, z], color: '#ffdcb4', intensity: k * L.lift, range: r });
    await ctx.yield();

    // ---------------------------------------------------------------- shell and street
    const mb = INT.makeBuilder();                              // copper and brass, for the metal shader
    // what is laid over the floor: the inlay's colours and the spilled sheet round the wreck (its reach is set from the hero's clock)
    const spillC = li === 0 ? [1.0, 0.6, 0.2, 0.1] : li === 1 ? [0.93, 0.92, 0.88, 0.56] : [0.86, 0.1, 0.17, 0.22];
    const fxU = { uTileCol: { value: new THREE.Color(tile) }, uAccCol: { value: new THREE.Color(li === 1 ? '#c8922c' : '#b5582e') }, uSpill: { value: new THREE.Vector4(-5, -114, 27, 0) },
      uSpillCol: { value: new THREE.Vector4().fromArray(spillC) }, uSpillT: { value: 0 },
      uBandSun: { value: new V3().fromArray(L.sunDir).normalize() }, uBandWin: { value: ALLWIN.map(([a, b]) => new THREE.Vector4(b, a, 8, 38)) },
      uBandShade: { value: new V3(0.7, 0.77, 0.92) }, uBandLit: { value: new V3(1.1, 1.05, 0.96) }, uBandK: { value: L.band ?? 0 } };
    const shell = await buildShell(ctx, rig, L, tile, mb, fxU);
    await ctx.yield();
    const propMat = noNeg(INT.propMaterial({ rig, side: THREE.DoubleSide, sway: { dir: [0.3, 0, 1], amp: 0.045, freq: 0.9 } }));
    const wallMat = noNeg(INT.propMaterial({ rig, side: THREE.DoubleSide, highlights: false }));
    const room = new THREE.Group(); room.name = 'room'; scene.add(room);
    room.add(shell.floor, shell.tops);
    for (const g of shell.wb.buildChunks(4, 480)) room.add(new THREE.Mesh(g, wallMat));
    await ctx.yield();
    for (const g of shell.tb.buildChunks(4, 480)) room.add(new THREE.Mesh(g, propMat));
    await ctx.yield();
    room.add(buildStreet(L, timeU));
    // two kilims: one under the first view, one along the aisle beside the rack
    const rugs = INT.makeRugs({ rig, rng: rng.fork('rugs'), scale: SC, colors: L.rug, rugs: [{ position: [16, 0, -15.5], width: 14, length: 23, seed: 0.37, fringe: 1.1 }, { position: [-10.5, 0, -350], width: 15, length: 56, seed: 0.81, fringe: 1.3 }] });
    noNeg(rugs.object.material); room.add(rugs.object);
    const wl = INT.makeWindowLight({ rig, rng: rng.fork('wl'), panes: false, shafts: false, motesPerWindow: Math.round(190 * detail), maxMotes: 1100, moteSize: 0.014, moteGain: 0.75 });
    room.add(wl.object);
    const rays = makeRays(L, timeU); scene.add(rays.mesh);
    await ctx.yield();

    // ---------------------------------------------------------------- the hero
    const hero = await buildHero(ctx, { load: L.load, stage: false, rare, palette: [MARBLE, SHADE, L.copper, AMBER, PIST, L.walnut, tile], saucerColor: L.saucer || undefined,
      windows: { wallX: XL, y0: 8, y1: 38, z: ALLWIN.map(([a, b]) => [a - HZ, b - HZ]) },
      sunDir: L.sunDir, sunColor: new THREE.Color(L.heroSun[0], L.heroSun[1], L.heroSun[2]), skyColor: new THREE.Color(SHADE).multiplyScalar(L.heroSky), bounceColor: new THREE.Color(L.heroBounce),
      fillColor: L.heroFill, windowGain: L.window, beams: L.beams, restZ: ISL.z0 + 4 - HZ, camAt: (ul, out) => { PATH_FLY.pointAt(fromLegacy(ul), out); out.z -= HZ; return out; } });
    hero.object.position.set(0, 0, HZ); hero.object.updateMatrixWorld(true); scene.add(hero.object);
    const HU = hero.uniforms, lightU = { uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uBounceCol: HU.uBounceCol, uWin: HU.uWin, uWall: HU.uWall, uFill: HU.uFill };
    const mk = (vs, fs, own = {}, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), ...lightU, ...own }, vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, ...extra });
    await ctx.yield();

    // ---------------------------------------------------------------- furniture and props (kit materials; copper and brass to mb)
    const pb = INT.makeBuilder(), ware = wareRouter(pb, mb), R2 = rng.fork('props');
    const shadows = [], glows = [];                           // soft contact shadows and the warm light off copper: [x, y, z, radius, strength] on a floor or top; a negative strength lies on the oven wall
    const isl = await buildIsland(ctx, ware, R2, L, tile, shadows, glows);
    await ctx.yield();
    const fit = await buildFittings(ctx, ware, ware, R2, L, tile, shadows, glows);
    await ctx.yield();
    await buildHanging(ctx, ware, rng.fork('hang'), L, glows);
    await ctx.yield();
    for (const g of pb.buildChunks(5, 480)) room.add(new THREE.Mesh(g, propMat));
    await ctx.yield();
    const wareMat = mk(WARE_VERT, WARE_FRAG, { uTime: timeU, uWareTint: { value: new V3().fromArray(L.ware || [1, 1, 1]) } });
    for (const g of mb.buildChunks(3, 480)) { const m = new THREE.Mesh(g, wareMat); m.frustumCulled = false; room.add(m); }
    await ctx.yield();
    {
      const db = INT.makeBuilder();
      for (const d of fit.domes) { const g = new THREE.SphereGeometry(2.25, 16, 8, 0, TAU, 0, PI / 2); g.deleteAttribute('uv'); db.add(g, { p: d, s: [1, 1.05, 1], c: '#dfeef2' }); db.add(sph(0.3, 8, 6), { p: [d[0], d[1] + 2.5, d[2]], c: '#dfeef2' }); }
      const dm = new THREE.Mesh(db.build(), noNeg(INT.glassMaterial({ rig, opacity: 0.2, side: THREE.DoubleSide }))); dm.renderOrder = 5; room.add(dm);
    }
    {
      const n = shadows.length, iPos = new Float32Array(n * 4), iRad = new Float32Array(n * 2);
      shadows.forEach((q, i) => { iPos.set([q[0], q[1], q[2], q[3]], i * 4); iRad[i * 2] = q[4]; });
      const bm = new THREE.Mesh(instanced(QUAD(), n, { iPos: [iPos, 4], iRad: [iRad, 2] }), mk(BLOB_VERT, NUTSH_FRAG, {}, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      bm.frustumCulled = false; bm.renderOrder = 1; bm.name = 'contact-shadows'; scene.add(bm);
      const ng = glows.length, gPos = new Float32Array(ng * 4), gRad = new Float32Array(ng * 2);
      glows.forEach((q, i) => { gPos.set([q[0], q[1], q[2], q[3]], i * 4); gRad[i * 2] = q[4]; });
      const gm = new THREE.Mesh(instanced(QUAD(), ng, { iPos: [gPos, 4], iRad: [gRad, 2] }), mk(BLOB_VERT, GLOW_FRAG, { uGlowCol: { value: new THREE.Color(0.95, 0.4, 0.13) } },
        { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      gm.frustumCulled = false; gm.renderOrder = 2; gm.name = 'copper-glow'; scene.add(gm);
    }
    // the sack: a pivot on the shelf, tipped toward the aisle while its nuts are out
    const sackPivot = new THREE.Group(); sackPivot.position.set(SACK.x, SHELF.top, SACK_Z + SACK.off); room.add(sackPivot);
    const sack = new THREE.Mesh(sackGeometry(nutKind === 'hazel' ? '#c08a44' : '#a9c24a', nutKind === 'hazel' ? '#8a5a2c' : '#d8c59a'), mk(SACK_VERT, SACK_FRAG)); sack.position.set(0, 0, -SACK.off); sackPivot.add(sack);
    await ctx.yield();

    // ---------------------------------------------------------------- the movers (own shaders, the hero's light)
    const nuts = await makeNuts(ctx, rng.fork('nuts'), mk, L, nutKind);
    scene.add(nuts.shadows, nuts.nuts);
    await ctx.yield();
    const cst = { x: 0, y: 0, z: 0, s: 0, air: -1, curl: 0, hopSign: 1, look: 0, time: 0, yaw: 0 };
    const passTau = (lev, z) => {                              // the cat clock at which it walks past a jar at z on that shelf (1e3: never)
      const y = lev ? RACK.hi : RACK.lo;
      for (let i = 0; i <= 400; i++) { const u = CAT.hop1[1] + (fromTail(CAT.curl[1]) - CAT.hop1[1]) * i / 400; catAt(u, cst); if (cst.air < 0 && Math.abs(cst.y - y) < 0.1 && cst.z <= z) return cst.z < z - 1.5 ? 1e3 : tauCat(u); }
      return 1e3;
    };
    const jars = makeJars(rng.fork('jars'), mk, tauCU, passTau, L); scene.add(jars.mesh);
    await ctx.yield();
    const laid = makeLaid(rng.fork('laid'), mk, L, liquid, saucer); scene.add(laid.mesh);
    await ctx.yield();
    const cat = makeCat(mk, ginger); scene.add(cat.mesh, cat.fur);
    // its wet prints along the pass shelf, one for every footfall of the walk
    const printU = { uCatZ: { value: 0 }, uPrintCol: { value: new THREE.Color(li === 0 ? '#7a420e' : li === 1 ? '#6e7680' : '#7c1422') } };
    {
      const tab = []; for (let i = 0; i <= 300; i++) { catAt(0.36 + (CAT.walk - 0.36) * i / 300, cst); tab.push([cst.z, cst.x]); }
      const xAt = (z) => { for (let i = 1; i < tab.length; i++) if (tab[i][0] <= z) return tab[i][1]; return tab[tab.length - 1][1]; };
      const pr = [], PR = rng.fork('prints');
      for (const Lg of CAT_LEGS) {
        const up = CAT_PIV[Lg.up];
        for (let n = -80; n < 80; n++) {
          const z = CAT_K * (up[2] + CAT_LS * (Lg.ph - n - 0.31)), zc = z - CAT_K * up[2];
          if (zc > -181 || zc < -283) continue;
          pr.push(xAt(zc) + CAT_K * up[0] * 1.05 + (PR() - 0.5) * 0.15, z + 0.12, (PR() - 0.5) * 0.3, zc - CAT_K * CAT_LS * 0.31);   // gone when that paw lifts
        }
      }
      const pm = new THREE.Mesh(instanced(QUAD(), pr.length / 4, { iPr: [new Float32Array(pr), 4] }), mk(PRINT_VERT, PRINT_FRAG, printU, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
      pm.frustumCulled = false; pm.renderOrder = 2; pm.name = 'paw-prints'; scene.add(pm);
    }
    // fruit that rolled away down the aisle and rolls back to its bowl on the island (on the hero's clock)
    {
      const FR = rng.fork('fruit'), nf = 10, F0 = [], F1 = [], F2 = [], bowl = [9.5, ISL.top + 2.3, -124];
      for (let i = 0; i < nf; i++) {
        const lx = -5.5 + FR() * 6.5, lz = bowl[2] + (FR() - 0.5) * 18, a = (FR() < 0.5 ? 1 : -1) * (PI / 2 + (FR() - 0.5) * 0.9), len = 14 + FR() * 30;
        const rx = clamp(lx + Math.cos(a) * len * 0.45 - 4 - FR() * 8, -22, 1), rz = clamp(lz + Math.sin(a) * len, -182, -58), ba = i * 2.4;
        F0.push(rx, rz, lx, lz); F1.push(1.9 + FR() * 1.2, 1.5 + FR() * 0.3, 0.6 + FR() * 0.14, FR());
        F2.push(bowl[0] + Math.cos(ba) * 0.7, bowl[1] + 0.35 * (i % 3), bowl[2] + Math.sin(ba) * 0.7, 0);
      }
      const g = sph(1, 12, 9), fm = new THREE.Mesh(instanced(g, nf, { iF0: [new Float32Array(F0), 4], iF1: [new Float32Array(F1), 4], iF2: [new Float32Array(F2), 4] }), mk(FRUIT_VERT, FRUIT_FRAG, { uT: HU.uT, uFruit: { value: new THREE.Color(L.fruit) } }));
      fm.frustumCulled = false; fm.name = 'fruit'; scene.add(fm);
    }
    const air = makeAir(rng.fork('air'), mk, timeU, isl.spouts, laid.sources, isl.SAM, liquid, detail); scene.add(air.mesh);
    const pigeons = makePigeons(rng.fork('pigeons'), mk, timeU, uU, L); scene.add(pigeons.mesh);
    await ctx.yield();

    // ---------------------------------------------------------------- flight
    const path = PATH_FLY;
    const ss = smoothstep, tp = new V3(), tgt = new V3(), catW = new V3(), camP = new V3(), dA = new V3(), dB = new V3();
    const fanS = new V3(-8, 3, -262), sackC = new V3(SACK.x, 22.2, SACK_Z), exitP = new V3(0, 19, Z1 + 2);
    const trayAt = (ul, out) => { hero.trayPose(hero.clockAt(ul, rare), tp); return out.set(tp.x, tp.y, tp.z + HZ); };
    const catPoint = (u, out) => { catAt(Math.max(u, 0.36), cst); return out.set(cst.x + 0.6 * Math.sin(cst.yaw), cst.y + 2.5 - 1.3 * cst.curl, cst.z + 0.6 * Math.cos(cst.yaw)); };
    // a point turned about the camera by yaw (positive: to the left), so that the subject sits to one side of the centre
    const aimOff = (pt, yaw, out) => { out.copy(pt).sub(camP); const c = Math.cos(yaw), sn = Math.sin(yaw), x = out.x, z = out.z; out.x = x * c + z * sn; out.z = -x * sn + z * c; return out.add(camP); };
    // The engine lays 0.86 of the gaze on the target and leaves 0.14 straight ahead. Where the subject must sit exactly
    // (the laid tray abreast, the cat on the rack) the target is pushed past it by just as much.
    const overAim = (u, amt) => {
      if (amt < 0.002) return;
      path.posAtDist(u * path.length + 22, dA).sub(camP).normalize();
      dB.copy(tgt).sub(camP); const dist = Math.max(dB.length(), 1e-3); dB.multiplyScalar(1 / dist);
      const w = 0.86, ad = dA.dot(dB), lam = (1 - w) * ad + Math.sqrt(Math.max((1 - w) * (1 - w) * (ad * ad - 1) + w * w, 0));
      dB.multiplyScalar(lam).addScaledVector(dA, -(1 - w)).normalize();
      catW.copy(camP).addScaledVector(dB, dist); tgt.lerp(catW, amt);
    };
    // One gaze for the whole flight, a chain of blends: the tray (held a little below centre through the rise), the cat
    // on the shelf with the room and the far hatch behind it, the green field ahead, the mouth of the lying sack as the
    // first nuts go in, the sack as it stands up (a little right of centre, the cat beside it, the rack and the hatch to
    // the left), the cat's leap, the cat on the rack with the hatch kept in the left of the frame, the cat curled up, and
    // at last the laid trays.
    const gaze = (time, u) => {
      const ul = legacyU(u), uo = refU(u), ut = tailU(uo);
      path.pointAt(u, camP);
      // the tray; through the rise the aim sits a little above it, so the disc lies just below the centre of the frame
      // (while the camera hangs close over the half-laden tray the aim drops to the disc itself: the whole of it stays
      // in the frame, and so does the cat on the shelf beyond)
      // (the laid tray is then held exactly, its copper a little below the centre and its ring handle above, until u 0.41)
      trayAt(Math.min(ul, 0.44), tgt); tgt.y += (1.2 + 0.6 * ss(0.31, 0.35, ul) - 2.1 * ss(0.3, 0.33, ul) * (1 - ss(0.35, 0.378, ul))) * ss(0.27, 0.3, ul) * (1 - HOLD_AIM * ss(0.385, 0.405, ul));
      if (ul > 0.36) overAim(u, ss(0.365, 0.385, ul) * (1 - ss(0.4095, 0.4325, u)));
      if (ul > 0.38) {
        catPoint(uo, catW);
        dA.copy(catW).sub(camP).normalize(); dB.copy(exitP).sub(camP).normalize();
        catW.copy(camP).addScaledVector(dA, 30).addScaledVector(dB, 15);
        // (the swing is made between two points equally far off, so it turns at an even rate)
        if (u < 0.44) { dA.copy(tgt).sub(camP); tgt.copy(camP).addScaledVector(dA, lerp(1, catW.distanceTo(camP) / Math.max(dA.length(), 1e-3), ss(0.4095, 0.421, u))); }
        { const x = clamp((u - 0.4095) / 0.023, 0, 1); tgt.lerp(catW, 0.5 * (x + x * x * (3 - 2 * x))); }                  // the laid tray is held for two seconds (u 0.385-0.41) before the cat takes over
        tgt.lerp(fanS, ss(0.455, 0.495, uo));
        sackMouth(sackTilt(nutTau(uo)), catW); tgt.lerp(aimOff(catW, GZ.mouth, dA), ss(0.5, 0.545, uo));
        // (as the camera closes in and swings round it the aim climbs a little and slides further left of the sack, so
        // the mouth, the cat, the rack and the hatch all stay in the frame)
        dB.copy(sackC); dB.y += 1.4 * ss(0.596, 0.612, uo) * (1 - ss(0.628, 0.645, uo));
        tgt.lerp(aimOff(dB, GZ.sack + 0.17 * ss(0.611, 0.624, uo), dA), ss(0.555, 0.59, uo));   // the sack, the cat beside it, the rack and the hatch to the left
        if (uo > 0.6) {
          catPoint(uo, catW); tgt.lerp(catW, ss(0.622, 0.644, uo));                        // the leap, seen whole
          if (uo > 0.64) {
            dA.copy(catW).sub(camP).normalize(); dB.copy(exitP).sub(camP).normalize();
            catW.copy(camP).addScaledVector(dA, 30).addScaledVector(dB, 12.5 + 8 * ss(0.775, 0.8, ut));
            tgt.lerp(catW, ss(0.648, 0.68, uo));
          }
          overAim(u, ss(0.63, 0.68, uo) * (1 - ss(0.796, 0.822, ut)));
        }
        if (ut > 0.8) { catW.set(0, 12.5, Math.max(camP.z - 30, Z1 + 4)); tgt.lerp(catW, ss(0.801, 0.8265, ut)); }
      }
      return tgt;
    };
    const pois = [{ at: gaze, from: 0, to: 0.975, fade: 0.04, weight: 0.86 }];
    // lingering: the rise and the laid tray; the sack standing up with the cat beside it; the rack
    // (the first line is the camera's true speed; dividing by 1 - the slope of the hold's lag gives the speed along u)
    const pace = (u) => {
      const o = refU(u), real = 1.15 - 0.6 * ss(0.2, 0.275, o) - 0.13 * ss(0.365, 0.386, u) + 0.63 * ss(0.427, 0.47, o) - 0.42 * ss(0.555, 0.6, o) + 0.12 * ss(0.625, 0.66, o) + 0.3 * ss(0.82, 0.89, o);
      return real / Math.max(1 - path.lagSlope(u), 0.5);
    };
    const camW = new V3(), rayGain = rays.uniforms.uRay.value.z;

    return {
      scene, path, duration: 46, pace,
      camera: { fov: 62, near: 0.3, far: 1600, lookAhead: 22, sway: 0.6, bank: 0.4 },
      pois,
      portal: { shape: 'arch', width: 16, height: 15.5, color: '#ffe6bd', glow: 0.6, revealDistance: 300 },
      post: { exposure: L.exposure, bloom: { strength: 0.22, radius: 0.6, threshold: 1.15 },
        grade: { saturation: L.sat, contrast: 1.05, tint: L.tint, shadowTint: L.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        const ul = legacyU(u), uo = refU(u);
        timeU.value = time; uU.value = u;
        hero.setProgress(ul, rare); hero.update(dt, time, camera);
        // the spilled sheet lies whole until the load starts back up, and is gone when the last of it has left the floor
        fxU.uSpill.value.w = 1.06 * ss(0.95, 3.2, hero.clockAt(ul, rare)); fxU.uSpillT.value = time;
        // nuts and sack: 9 s of forward time played back; the southern field goes into the lying sack, which stands up
        // while the northern field pours in over its lip
        const tauN = nutTau(uo);
        nuts.uniforms.uTauN.value = tauN; nuts.uniforms.uTauS.value = nutTauS(uo);
        const th = sackTilt(tauN) + 0.012 * Math.sin(time * 1.9) * ss(0, 0.3, tauN);
        sackPivot.rotation.x = th; sackMouth(th, nuts.mouth);
        camW.setFromMatrixPosition(camera.matrixWorld); nuts.uniforms.uCam.value.copy(camW);
        // the beams in the air are thinned while the gaze runs down the room past the sack, so the rack and the hatch keep their darks
        rays.uniforms.uCamP.value.copy(camW); rays.uniforms.uRay.value.y = time; rays.uniforms.uRay.value.z = rayGain * (1 - RAY_THIN * ss(0.4, 0.47, uo) * (1 - ss(0.67, 0.74, uo)));
        // the cat (it keeps an eye on us as we pass), its prints and its jars
        const ub = uo + 0.0015 * Math.sin(time * 1.25) * ss(0.36, 0.4, uo) * (1 - ss(0.8, 0.845, uo));
        catAt(clamp(ub, 0.3, 1), cst); cst.time = time;
        let lk = Math.atan2(camW.x - cst.x, camW.z - cst.z) - cst.yaw; lk -= TAU * Math.round(lk / TAU);
        cst.look = clamp(lk, -1.1, 1.1) * 0.75 * ss(0.4, 0.45, uo);
        cat.pose(cst); printU.uCatZ.value = cst.z;
        tauCU.value = tauCat(ub);
        trayAt(ul, occTray.position); occCat.position.set(cst.x, cst.y + 1.6, cst.z);
        rig.update(time, null); wl.update(dt, time, camera);
      },
      dispose() {},
    };
  },
};
