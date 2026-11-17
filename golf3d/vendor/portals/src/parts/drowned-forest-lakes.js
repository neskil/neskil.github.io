// Hero set piece for "drowned-forest-lakes" (The Peacock Lakes): THE TOP LAKE, a mirror that becomes a window.
//
// What it is: a clear travertine lake (L-shaped, 380 x 405 m, 20 m deep, with a 0.3-4 m shelf in the west bay) whose
// surface is glass until a gust front crosses it; behind the front the mirror breaks into blue glitter and the floor
// shows: under the turn and pass two, sixty bone-white fallen trunks (root plates, the stumps of their limbs, crust)
// criss-crossed on white marl patched amber and jade, caustics crawling over them, three shoals of a hundred pale carp
// each hanging over one of the trunks with its shadows on the wood, weed streaming to the outlet.
// Fourteen-odd trunks break the surface carrying moss, sedge and spruce saplings; two 16 m bleached snags form the
// exit gate in front of a mossy, log-jammed sill over which the west inflow spills. THE STAND: forty-odd dead trunks still
// stand 12-26 m out of the water round the elbow of the lake (two groves, outliers, two sentinels; sagging limbs, moss
// collars at the waterline, gardens on the stumps), each with its image in the water (a mirrored twin slid onto the
// surface along the eye ray; whole on calm water, a broken streak under the gust) and a lee of mirror round the west
// grove (uLee) that the gust only breaks when the camera arrives. The flight path (lakePath, anchors.flyThrough) climbs to
// 11.5 m at the top of the right turn, not above the trunks, and threads them no nearer than 6.8 m; it is the one line
// both flown and placed against. anchors.stand / anchors.standPerches give tops and perching boughs.
//
// THE ARCH: one huge fallen tree sprung from the bed west of pass one to the bed east of it, 19 m over the water at
// x -100, z -1 (46 rings, crusted pale wood, fifteen snapped limbs, moss, saplings and hanging lichen on it, its image in the
// mirror; anchors.arch). THE ISLAND: a travertine islet at (-41, -35.5), 7.5 m across, built in rimstone steps above the
// water and all the way down (treads with white lips, draped risers, a white rim at the waterline), a mossy crown, nine
// bone-white trunks laid criss-cross on the bed beside it (opts.isleRock: its light by the hour); anchors.island = { x, z, r, heightAt, trees: [{ x, y, z, kind 0 birch | 1 maple | 2 spruce, h, out }] }
// for the world to plant living trees on. opts.lowSun (0..1) dims the mirrored shore belt outside the sun's band and
// opts.paleK (0..1) greys the wood seen close under the lens to crusted bone.
//
// Local frame: origin at the centre of the tangle ON THE WATER SURFACE (y = 0 is lake level; the bed goes to y = -21).
// The traveller of the brief flies toward -Z on pass one (heading 225 == local -Z; the snow peak is mirrored at -Z);
// +Z ("front") faces the outlet / shoal. Brief frame (a, c) -> local (x, z) = (c - 100, 225 - a).
//
// opts
//   palette   [peacock, deep, shallowTurquoise, bone, gold, spruce, scarlet] hex strings (brief palette by default)
//   hour      'morning' (default) | 'dawn' | 'afternoon' | 'night'     sun colour/strength and the mirrored sky
//   season    'peak' (default) | 'late' (leaf rafts x3, thinner crowns) | 'june' (greens, jade lake) | 'snow'
//   tint      'peacock' | 'emerald' | 'patched'   lake colour; picked by seed when absent
//   density   0..1 (default 0.6): trunks 45..70
//   sunDir    [x,y,z] local direction TOWARD the sun (default: brief, azimuth 128 / elevation 28 = [-0.877,0.469,0.108])
//   sunColor, skyColor (zenith), horizonColor   hex overrides for the lighting the piece shades itself with
//   backdrop  true (default): ~480 instanced autumn birch/maple and spruce on the shore, plus a far ring (radius 2.6 km)
//             and valley floor painted with the SAME skyline function the mirror uses (slopes with larch belts and
//             sliding cloud shadows, the snow peak at -Z), so the piece shows a doubled valley when seen alone.
//             Pass false when the world builds its own shore forest and terrain, and match `skyline` to them.
//   skyline   { treeHeight: 19, slopeTan: 0.62, axisTan: 0.1, peakTan: 0.27, peakWidth: 0.2 }  what the mirror shows:
//             shore trees of that height (parallax-corrected per pixel against the lake outline), valley slopes whose
//             skyline tangent is slopeTan at +-X and axisTan along +-Z, and the snow peak at -Z. Match your terrain.
//   progress  u used until setProgress is called (default 0.283: the gust front lies across the tangle, so the viewer
//             sees mirror on one side and window on the other)
//   gustU 0.37, healU 0.80   journey u at which the front reaches the camera on pass one / the mirror starts to heal
//   zMax 295, surfZ zMax     where the bank apron / the water surface end toward the outlet (+Z), so the world's own shoal can take over there
//                            (the surface thins out over its last 1.5 m; between the two the lake's level water lies over the world's ground)
//   approach                 [[x, y, z], ...] the points the world flies before the lake path, so that the journey's u is known here
//                            (the pheasant's log is set from the journey's u 0.885); none: the lake path alone is the journey
//   outletFill [r, g, b]     the sky fill the world gives its own travertine in shade; the outlet's travertine (within 62 m of
//                            (-100, 246)) takes the same, so the two meshes that meet at zMax are lit alike (default none)
//   snow 0..1, ambient       first-snow dusting on banks, gardens and dry wood; ambient strength override
//   scatter                  how much the water column glows with its own colour (default from the hour: 0.66 morning, 0.37 dawn)
//   ambientSky, ambientHorizon  colours of the sky LIGHT when they should differ from the sky the mirror shows (night: a dark sky, a readable fill)
//   dayK                     strength of the daylight constants in the mirrored valley (1; 0.2 at night)
//   shaft { perp: [x, z], offset, half, out, in }   a band of low sunlight across the lake: sun strength is `in` where
//             |dot(perp, xz) - offset| < half and `out` elsewhere (trunks, bed, glitter and the trunks' reflections)
//   slopeFill [r, g, b]      warm bounce added to the mirrored slopes (the world lights its own slopes the same way)
//   portalRadius 6.5, portalColor   the gate's ring, mirrored analytically in the still water in front of it
//   isleRock [sun, warm, ambient, albedo]   the island's stone by the hour: least direct sun it takes, how warm-grey its
//             sky fill is, the strength of that fill, its albedo (default [0.7, 0.8, 1.3, 1]; its shrubs and sedge follow)
// hero.makeLeaves(list) returns one more mesh of floating leaves ([x, z, rotation, size, colourPick, phase] each) for the world's other waters.
//
// Progress hook: hero.setProgress(u) with the journey's u (0..1): the water's beats only. The gust front is at
// z = 132 + (u - gustU) * 1500 (born off the head of the lake before the camera arrives, it crosses the outlet at u ~ 0.42);
// from healU the calm returns as one front from the head of the lake (-Z) at 2000 m per unit u. The stand's lee of still
// water lies round the west grove until u 0.525-0.565 (the lens comes in among its trunks); there is no second lee.
// hero.setGust(frontZ, healZ) overrides both fronts directly.
// hero.setLens(x, y, z, dx, dy, dz): the lens's place and unit gaze, each frame; leaves undrawn the sunk wood and the carp
// the lens cannot see, by height, distance and bearing only (see setLens). Never called: everything is drawn.
// Ambient motion (ripples, caustics, fish, weed, leaves, wind, spill) runs on `time`.
//
// anchors (local space)
//   portalSeat   { position (193.3, 4.5, -143.8), facing (unit, toward the arriving camera), radius 6.5, tiltDeg 3 }
//   gate         [left, right] bases of the two snags (15.6 m apart, 11 m before the portal), sill: crest centre
//   flyThrough   ordered points of the brief's lake path (pass one, right turn, left arc, exit; the climb to 11.5 m starts
//                60 m before the turn and is complete half-way round it); the build keeps every seeded
//                solid above water at least 7.5 m from it and everything under it at least 0.4 m below the surface,
//                except the sill crest (0.75 m high) which the last 3 m of the path cross 3.6 m above, the pheasant's log
//                (thin end 5 m off) and the moss gardens of the shelf (root plates 6.2-6.4 m off: the design's distance)
//   outlet       where the lake spills to the shoal (bank notched there), entry: start of pass one
//   viewpoints   { mirror, turnTop, shelf } camera positions with look-at targets for the brief's key frames
//   tangle       centre of the criss-cross (two clusters: under the top of the turn at (-10,-36) and under the start of
//                pass two at (42,-12)); pheasantPerch { position, from, radius, facing, abeam, log }: he stands on an awash
//                log 7 m to the right of the path's point at the journey's u 0.885 (abeam), the log running away from the
//                path (see THE PHEASANT'S LOG in the build); duckPerches [2] on the gate snags;
//   shoals       [3] centres of the carp shoals (turn, under the gate, pass two: each over a white trunk); emergent: tops of the trunks that break the surface
// Laid on purpose (own random stream 'peacock-laid', so the seeded forest never shifts): a jam of 8 logs hung up 1.5-4 m
// under the surface below pass one (z 105-128), and 14 trunks crossing the path 0.7-1.3 m under the water every 7-10 m
// along the shelf, from 62 m before the end of the left arc to 44 m after it; three of them lift a root plate with a moss
// garden and a spruce sapling 6.3 m off the path. Their stubs are cut off 0.3 m under the surface within 7.8 m of the path.
// hero.lake = { sdf(x,z) (<0 inside), bedAt(x,z), level: 0, sillLevel: 0.7 } for carving terrain round it.
//
// radius / height / center are FRAMING hints for the set-piece viewer (an orbit of the tangle that stays above the
// water); the real extent is hero.extent { minX,maxX,minZ,maxZ }, the bank apron reaches x -205..295, z -230..295 and
// is notched to water level along x = -100, z > 205 (the outlet tongue the shoal should cover).
// Cost: ~140k triangles with the backdrop (~87k without), 16 draw calls (13 without), no lights, no textures, ~200 ms.
// Lighting: self-shaded (sunDir/sunColor/sky uniforms, scene fog honoured); expects a clear cold morning, low warm key
// from the left of the pass-one heading. Exposure 1, bloom threshold ~0.9: only glitter and spill lace exceed 1.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed, makePath } from '../kit/core.js';

const DEF_PAL = ['#0E8FA8', '#0B4F6C', '#7FD6C8', '#EDE8D6', '#E3A82B', '#1F3A2C', '#C8421A'];
const HOURS = {
  morning: { sun: '#FFE9C4', sunI: 2.6, zen: '#2F6FC4', hor: '#CFE0EA', amb: 0.62 },
  dawn: { sun: '#FFB9A0', sunI: 1.1, zen: '#3B5C9E', hor: '#F2C9C2', amb: 0.5 },
  afternoon: { sun: '#FFC27A', sunI: 1.5, zen: '#3A6DB5', hor: '#E9D2B0', amb: 0.55 },
  night: { sun: '#A9C0FF', sunI: 0.5, zen: '#070D22', hor: '#18274A', amb: 0.16 },
};
const PORTAL = [193.3, 4.5, -143.8], HEAD = [0.423, -0.906], PERP = [0.906, 0.423];

// ---------- the brief's lake path in local space ----------
function lakePath() {
  const pts = [];
  // Pass one at 1.3 m along x = -100 (z 225 -> 5); the climb starts on its last 60 m and is done half-way round the right
  // turn (centre (-45, 5), radius 55), whose top is at 11.5 m: the felled forest is looked down on from there; the left arc
  // (centre (64.6, -104.6), radius 100) sinks back to 1.3 m, and the exit runs 90 m along HEAD, rising to the portal.
  // This one line is both the line flown (anchors.flyThrough) and the line everything in the lake is placed against.
  const TOP = 11.5, climb = (m) => 1.3 + (TOP - 1.3) * smoothstep(0, 125, m);
  for (let i = 0; i <= 11; i++) pts.push([-100, climb(60 - (225 - i * 20 - 5)), 225 - i * 20]);
  for (let i = 1; i <= 9; i++) { const f = (i / 9) * 2.356, k = i / 9; pts.push([-45 - 55 * Math.cos(f), climb(60 + k * 129.6), 5 - 55 * Math.sin(f)]); }
  for (let i = 1; i <= 16; i++) { const k = i / 16, ps = 2.356 - k * 1.92; pts.push([64.6 + 100 * Math.cos(ps), TOP - (TOP - 1.3) * smoothstep(0.08, 0.73, k), -104.6 + 100 * Math.sin(ps)]); }
  for (let i = 1; i <= 6; i++) { const d = i * 15; pts.push([155.2 + HEAD[0] * d, 1.3 + Math.max(0, d - 30) * 0.0533, -62.3 + HEAD[1] * d]); }
  return pts;
}
function distToPath(pts, x, z, maxY = 1e9) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]; if (Math.min(a[1], b[1]) > maxY) continue;
    const dx = b[0] - a[0], dz = b[2] - a[2], t = clamp(((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz), 0, 1);
    best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t));
  }
  return best;
}

// ---------- lake outline and bed ----------
const sdBox = (x, z, cx, cz, hx, hz, r) => { const qx = Math.abs(x - cx) - hx + r, qz = Math.abs(z - cz) - hz + r; return Math.min(Math.max(qx, qz), 0) + Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) - r; };
function makeLakeField(noise, wob) {
  const SX = PORTAL[0] - HEAD[0] * 3, SZ = PORTAL[2] - HEAD[1] * 3;       // sill crest centre
  const sill = (x, z) => ({ along: (x - SX) * HEAD[0] + (z - SZ) * HEAD[1], across: (x - SX) * PERP[0] + (z - SZ) * PERP[1] });
  function sdf(x, z) {
    const a = sdBox(x, z, -47.5, 80, 97.5, 155, 60), b = sdBox(x, z, 87.5, -67.5, 147.5, 102.5, 55);
    const h = clamp(0.5 + 0.5 * (b - a) / 30, 0, 1);
    let s = lerp(b, a, h) - 30 * h * (1 - h);
    s += wob * (8 * noise.n2(x * 0.011 + 3.1, z * 0.011) + 2.5 * noise.n2(x * 0.045, z * 0.045 + 7.7));
    const q = sill(x, z), w = 1 - smoothstep(45, 85, Math.abs(q.across));
    return lerp(s, Math.max(s, q.along), w);
  }
  function bedAt(x, z) {
    const s = sdf(x, z), d = -s, q = sill(x, z);
    let y;
    if (d <= 0) {
      const e = -d;
      y = 0.03 + 0.4 * smoothstep(0, 3.5, e) + 0.07 * e + (0.5 + 0.5 * noise.n2(x * 0.06, z * 0.06)) * 0.9 * smoothstep(1, 12, e);
      const om = Math.exp(-((x + 100) * (x + 100)) / 260) * smoothstep(205, 226, z);   // outlet notch toward the shoal
      y = lerp(y, -0.12, om);
    } else {
      const t = clamp(d / 82, 0, 1), deep = 20.6 * (1 - (1 - t) * (1 - t));
      const shelf = 0.25 + 3.5 * smoothstep(0, 14, d) + 0.5 * smoothstep(20, 60, d);
      const sm = smoothstep(84, 124, x + 0.12 * z);
      y = -lerp(deep, shelf, sm) + 0.55 * noise.n2(x * 0.035 + 9, z * 0.035) * smoothstep(0, 12, d) + 0.25 * noise.n2(x * 0.11, z * 0.11 + 4) * smoothstep(0, 6, d);
      y = Math.min(y, -0.05 - 0.02 * Math.min(d, 6));
    }
    const ch = 1 - smoothstep(15, 23, Math.abs(q.across));
    if (ch > 0 && q.along > -3) {
      y = lerp(y, 0.3 + 0.05 * noise.n2(x * 0.3, z * 0.3) + 0.012 * Math.max(0, q.along - 20), ch * smoothstep(-0.3, 1.6, q.along));
      const crest = (0.6 + 0.16 * noise.n2(q.across * 0.35, 5.5)) * Math.exp(-(q.along * q.along) / 1.7);
      y = Math.max(y, lerp(-9, crest, ch));
    }
    return y;
  }
  return { sdf, bedAt, sill, SX, SZ };
}

// ---------- geometry accumulator ----------
function makeAcc() { return { p: [], c: [], f: [], i: [] }; }
// loft: nR rings of nS points; pt(ir, is, out[3]); col(ir, is, out[3]); fx(ir, is) -> flex
function loft(acc, nR, nS, pt, col, fx, capA, capB) {
  const base = acc.p.length / 3, o = [0, 0, 0], cc = [0, 0, 0];
  for (let r = 0; r < nR; r++) for (let s = 0; s < nS; s++) { pt(r, s, o); acc.p.push(o[0], o[1], o[2]); col(r, s, cc); acc.c.push(cc[0], cc[1], cc[2]); acc.f.push(fx ? fx(r, s) : 0); }
  for (let r = 0; r < nR - 1; r++) for (let s = 0; s < nS; s++) { const a = base + r * nS + s, b = base + r * nS + (s + 1) % nS, c = a + nS, d = b + nS; acc.i.push(a, c, b, b, c, d); }
  for (const [cap, r, flip] of [[capA, 0, false], [capB, nR - 1, true]]) {
    if (!cap) continue;
    const ci = acc.p.length / 3; acc.p.push(cap[0], cap[1], cap[2]); col(r, 0, cc); acc.c.push(cc[0], cc[1], cc[2]); acc.f.push(fx ? fx(r, 0) : 0);
    for (let s = 0; s < nS; s++) { const a = base + r * nS + s, b = base + r * nS + (s + 1) % nS; if (flip) acc.i.push(a, ci, b); else acc.i.push(a, b, ci); }
  }
}
function accToGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(acc.c, 3));
  g.setAttribute('aFlex', new THREE.Float32BufferAttribute(acc.f, 1));
  g.setIndex(acc.i); g.computeVertexNormals();
  return g;
}
// Vertex normals worked out in steps (the same sums as BufferGeometry.computeVertexNormals: every face's normal, weighted by
// its area, added to its three corners, then each made unit), `step()` awaited every `chunk` triangles: the page gets its
// frames inside a big mesh instead of waiting 40-60 ms for it.
export async function normalsInSteps(geo, step, chunk = 16000) {
  const pos = geo.attributes.position.array, ix = geo.index.array, nv = pos.length / 3, n = new Float32Array(nv * 3);
  for (let k = 0, c = 0; k < ix.length; k += 3) {
    const a = ix[k] * 3, b = ix[k + 1] * 3, d = ix[k + 2] * 3;
    const cx = pos[d] - pos[b], cy = pos[d + 1] - pos[b + 1], cz = pos[d + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
    const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[d] += nx; n[d + 1] += ny; n[d + 2] += nz;
    if (++c === chunk) { c = 0; await step(); }
  }
  await step();
  for (let v = 0, c = 0; v < nv; v++) {
    const o = v * 3, l = Math.hypot(n[o], n[o + 1], n[o + 2]) || 1; n[o] /= l; n[o + 1] /= l; n[o + 2] /= l;
    if (++c === 60000) { c = 0; await step(); }
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(n, 3));
}
async function accToGeometryInSteps(acc, step) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); await step();
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(acc.c, 3)); await step();
  g.setAttribute('aFlex', new THREE.Float32BufferAttribute(acc.f, 1));
  g.setIndex(acc.i); await step();
  await normalsInSteps(g, step);
  return g;
}
const hex = (h) => new THREE.Color(h);

// ---------- trunks: fallen (lying) and standing (gate snags) ----------
// o: { x,y,z butt centre, ax,ay,az unit axis, L, r0, near, flare, nRoots, nStubs, stubLen:[a,b], stubLift, bone:[r,g,b] }
// nStubs: how many snapped limbs it keeps (every one of them is built); stubK: their length scaled; blunt: a snapped limb
// ends in a broken face nearly as wide as its foot, not in a point.
// Returns samples along the axis [{x,y,z,r,t}] for clearance, gardens and shadows.
function addTrunk(acc, rng, noise, o) {
  const sides = o.sides || (o.near ? 12 : 7), rings = o.rings || (o.near ? 26 : 9), ex = [o.ax, o.ay, o.az];
  const up = Math.abs(ex[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let ez = [ex[1] * up[2] - ex[2] * up[1], ex[2] * up[0] - ex[0] * up[2], ex[0] * up[1] - ex[1] * up[0]];
  const el = Math.hypot(ez[0], ez[1], ez[2]) || 1; ez = [ez[0] / el, ez[1] / el, ez[2] / el];
  const ey = [ez[1] * ex[2] - ez[2] * ex[1], ez[2] * ex[0] - ez[0] * ex[2], ez[0] * ex[1] - ez[1] * ex[0]];
  const bk = o.bend ?? 1, tap = o.taper ?? 0.6, sd = rng() * 100, bendA = rng.range(-1, 1) * o.L * 0.03 * bk, bendB = rng.range(-1, 1) * o.L * 0.022 * bk, ph = rng() * 6.28, nb = rng.int(4, 7);
  const cen = (t, out) => {
    const oy = bendA * Math.sin(t * Math.PI), oz = bendB * Math.sin(t * 4 + ph) * t, d = t * o.L;
    out[0] = o.x + ex[0] * d + ey[0] * oy + ez[0] * oz; out[1] = o.y + ex[1] * d + ey[1] * oy + ez[1] * oz; out[2] = o.z + ex[2] * d + ey[2] * oy + ez[2] * oz; return out;
  };
  const rad = (t, th) => {
    const tl = t * o.L, cs = Math.cos(th), sn = Math.sin(th);
    let r = o.r0 * (1 - tap * t) * (1 + 0.17 * noise.n3(cs * 1.3 + sd, sn * 1.3, tl * 0.5));
    if (o.near) r *= 1 + 0.07 * noise.n3(cs * 4 + sd, sn * 4, tl * 2.1);
    // crusted wood (o.crust: the trunks the lens skims): travertine has grown on it in lobes that wind along the trunk and
    // swell into knuckles, so its outline is never a pipe's
    if (o.crust) r *= 1 + 0.12 * Math.sin(th * 3 + tl * 0.8 + ph) * (0.6 + 0.4 * noise.n3(tl * 0.4, sd, 1.7)) + 0.07 * Math.sin(th * 5 - tl * 1.9 + sd) + 0.2 * Math.max(0, noise.n3(cs * 1.1 + sd * 1.3, sn * 1.1, tl * 0.75));
    return r * (1 + o.flare * Math.exp(-tl / (o.r0 * 2.4)) * (0.5 + 0.5 * Math.abs(Math.sin(th * nb * 0.5 + ph))));
  };
  const b = o.bone, c0 = [0, 0, 0];
  const colAt = (x, y, z, out, k = 1) => { const n = 0.84 + 0.16 * noise.n3(x * 0.9 + sd, y * 0.9, z * 0.9), w = 0.03 * noise.n3(x * 0.3, z * 0.3, sd); out[0] = b[0] * n * k + w; out[1] = b[1] * n * k; out[2] = b[2] * n * k - w; };
  const tOf = (r) => Math.pow(r / (rings - 1), 1.45);
  let lp = [0, 0, 0];
  loft(acc, rings, sides, (r, s, out) => {
    const t = tOf(r), th = (s / sides) * 6.2832; cen(t, c0);
    let rr = rad(t, th); if (r === rings - 1) rr *= 0.5 + 0.5 * ((s * 7 + nb) % 3 === 0 ? 1 : 0.35);
    const cs = Math.cos(th) * rr, sn = Math.sin(th) * rr, sp = r === rings - 1 ? ((s * 5 + nb) % 4) * 0.12 * o.r0 * 3 : 0;
    out[0] = c0[0] + ey[0] * cs + ez[0] * sn + ex[0] * sp; out[1] = c0[1] + ey[1] * cs + ez[1] * sn + ex[1] * sp; out[2] = c0[2] + ey[2] * cs + ez[2] * sn + ex[2] * sp;
    lp = out;
  }, (r, s, out) => colAt(lp[0], lp[1], lp[2], out, r === rings - 1 ? 0.8 : 1), null,
  [o.x - ex[0] * o.r0 * 0.3, o.y - ex[1] * o.r0 * 0.3, o.z - ex[2] * o.r0 * 0.3],
  [o.x + ex[0] * (o.L - 0.1) + ey[0] * o.r0 * 0.1, o.y + ex[1] * (o.L - 0.1) + ey[1] * o.r0 * 0.1, o.z + ex[2] * (o.L - 0.1) + ey[2] * o.r0 * 0.1]);
  // root plate: arms radiating in the plane across the axis
  const rS = o.near ? 4 : 3, rR = o.near ? 5 : 3;
  for (let k = 0; k < o.nRoots; k++) {
    const th0 = (k + rng.range(-0.3, 0.3)) / o.nRoots * 6.2832, len = o.r0 * (o.near ? rng.range(3.4, 7.4) : rng.range(2.4, 4.6)) * (o.rootLen ?? 1), curl = rng.range(-0.55, 0.25), wan = rng.range(-0.5, 0.5), rb = o.r0 * (o.near ? rng.range(0.38, 0.58) : rng.range(0.5, 0.78));
    const armC = (s, out) => {
      const th = th0 + wan * s * s, rho = o.r0 * 1.15 + s * len, ax = o.r0 * 0.35 + curl * s * s * len, cs = Math.cos(th), sn = Math.sin(th);
      out[0] = o.x + ex[0] * ax + (ey[0] * cs + ez[0] * sn) * rho; out[1] = o.y + ex[1] * ax + (ey[1] * cs + ez[1] * sn) * rho; out[2] = o.z + ex[2] * ax + (ey[2] * cs + ez[2] * sn) * rho; return th;
    };
    const tip = [0, 0, 0]; armC(1.08, tip);
    loft(acc, rR, rS, (r, s, out) => {
      const sv = r / (rR - 1), th = armC(sv, c0), ra = rb * Math.pow(1 - sv * 0.93, 0.8) + 0.015, ph2 = (s / rS) * 6.2832, ca = Math.cos(ph2) * ra, sa = Math.sin(ph2) * ra * 1.25;
      const tx = -Math.sin(th), tz = Math.cos(th);
      out[0] = c0[0] + ex[0] * ca + (ey[0] * tx + ez[0] * tz) * sa; out[1] = c0[1] + ex[1] * ca + (ey[1] * tx + ez[1] * tz) * sa; out[2] = c0[2] + ex[2] * ca + (ey[2] * tx + ez[2] * tz) * sa; lp = out;
    }, (r, s, out) => colAt(lp[0], lp[1], lp[2], out, 0.94), null, null, tip);
  }
  if (!o.near && o.nRoots) {                                    // the far trunks: a root plate about three trunk-widths across
    const pS = 8, irr = [], prof = [[0.9, 1.15], [0.2, 2.6], [-0.3, 2.3]];
    for (let s = 0; s < pS; s++) irr.push(rng.range(0.7, 1.25));
    loft(acc, 3, pS, (r, s, out) => {
      const th = (s / pS) * 6.2832 + ph, rho = o.r0 * prof[r][1] * (r ? irr[s] : 1), ax = o.r0 * prof[r][0], cs = Math.cos(th), sn = Math.sin(th);
      out[0] = o.x + ex[0] * ax + (ey[0] * cs + ez[0] * sn) * rho; out[1] = o.y + ex[1] * ax + (ey[1] * cs + ez[1] * sn) * rho; out[2] = o.z + ex[2] * ax + (ey[2] * cs + ez[2] * sn) * rho; lp = out;
    }, (r, s, out) => colAt(lp[0], lp[1], lp[2], out, r === 1 ? 1 : 0.84), null, null, [o.x - ex[0] * o.r0 * 0.55, o.y - ex[1] * o.r0 * 0.55, o.z - ex[2] * o.r0 * 0.55]);
  }
  // branch stubs
  const sS = o.crust ? 6 : o.near ? 5 : o.stubFat ? 4 : 3, sR = o.crust ? 4 : o.near ? 3 : 2;
  for (let k = 0; k < o.nStubs; k++) {
    const t = rng.range(0.14, 0.96), th = rng() * 6.2832; let len = rng.range(o.stubLen[0], o.stubLen[1]) * (1 - 0.45 * t) * (o.stubK ?? 1); const br = rad(t, th) * rng.range(0.24, 0.36) * (o.stubFat || 1);
    if (o.crust) len *= [1, 0.5, 1.55, 0.75][k & 3];            // (snapped limbs of every length)
    const cs = Math.cos(th), sn = Math.sin(th), rx = ey[0] * cs + ez[0] * sn, ry = ey[1] * cs + ez[1] * sn, rz = ey[2] * cs + ez[2] * sn;
    let dx = rx + ex[0] * o.stubLift, dy = ry + ex[1] * o.stubLift, dz = rz + ex[2] * o.stubLift; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
    const q = [0, 0, 0]; cen(t, q); const r0 = rad(t, th) * 0.75, bx = q[0] + rx * r0, by = q[1] + ry * r0, bz = q[2] + rz * r0;
    if (o.ceilAt && dy > 0.05) len = Math.max(0.12, Math.min(len, (o.ceilAt(bx + dx * len, bz + dz * len) - by) / dy));   // a stub that would break the surface under the path is cut short
    // two axes across the stub
    const ux = ex[0] - dx * (ex[0] * dx + ex[1] * dy + ex[2] * dz), uy = ex[1] - dy * (ex[0] * dx + ex[1] * dy + ex[2] * dz), uz = ex[2] - dz * (ex[0] * dx + ex[1] * dy + ex[2] * dz);
    const ul = Math.hypot(ux, uy, uz) || 1, u = [ux / ul, uy / ul, uz / ul], v = [dy * u[2] - dz * u[1], dz * u[0] - dx * u[2], dx * u[1] - dy * u[0]];
    const kink = rng.range(-0.25, 0.25) * len;
    loft(acc, sR, sS, (r, s, out) => {
      const sv = r / (sR - 1) * 0.93, last = r === sR - 1, a2 = (s / sS) * 6.2832, kk = kink * sv * sv;   // (a snapped limb: nearly its full girth to a ragged end)
      let ra = br * (1 - (o.blunt ? 0.2 : o.near ? 0.3 : 0.5) * sv) * (last && (o.near || o.blunt) ? 0.8 + 0.3 * (s % 2) : 1), adv = sv * len;
      // (crusted: a swollen collar where it leaves the trunk, and a splintered end, its fibres broken off at different lengths)
      if (o.crust) { ra = br * (r === 0 ? 1.55 : 1 - 0.3 * sv) * (last ? 0.45 + 0.6 * ((s * 3 + k) % 2) : 1); if (last) adv += (((s * 2 + k) % 3) - 1) * 0.11 * len; }
      const ca = Math.cos(a2) * ra, sa = Math.sin(a2) * ra;
      out[0] = bx + dx * adv + u[0] * (ca + kk) + v[0] * sa; out[1] = by + dy * adv + u[1] * (ca + kk) + v[1] * sa; out[2] = bz + dz * adv + u[2] * (ca + kk) + v[2] * sa; lp = out;
    }, (r, s, out) => colAt(lp[0], lp[1], lp[2], out, r === sR - 1 ? 0.62 : 0.9), null, null, o.crust ? [bx + dx * len * 0.78 + u[0] * kink * 0.6, by + dy * len * 0.78 + u[1] * kink * 0.6, bz + dz * len * 0.78 + u[2] * kink * 0.6]
      : o.blunt ? [bx + dx * len * 0.96 + u[0] * kink * 0.86, by + dy * len * 0.96 + u[1] * kink * 0.86, bz + dz * len * 0.96 + u[2] * kink * 0.86]
      : [bx + dx * len + u[0] * (kink + br * 0.3), by + dy * len + u[1] * (kink + br * 0.3), bz + dz * len + u[2] * (kink + br * 0.3)]);
  }
  const samples = [], n = Math.max(6, Math.round(o.L / 0.7));
  for (let i = 0; i <= n; i++) { const t = i / n, q = cen(t, [0, 0, 0]); samples.push({ x: q[0], y: q[1], z: q[2], r: o.r0 * (1 - tap * t), t }); }
  return samples;
}
// quick straight-axis test before building: is everything that reaches above `ceil` at least `clear` m from the path?
function trunkClear(o, pts, clear, ceil) {
  const plate = o.r0 * (1.2 + (o.nRoots ? 6.3 : o.flare));
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, x = o.x + o.ax * t * o.L, y = o.y + o.ay * t * o.L, z = o.z + o.az * t * o.L, r = i === 0 ? plate : o.r0 * (1 - 0.6 * t) + o.stubLen[1] * 0.8;
    if (y + r > ceil && distToPath(pts, x, z, 9) < clear + (i === 0 ? plate : 0)) return false;
  }
  return true;
}

// ---------- shaders ----------
const GL_COMMON = /* glsl */`
uniform float uTime; uniform vec3 uSun, uSunU, uSunCol, uZen, uHor, uAmbZ, uAmbH; uniform float uAmb, uScat, uSnow, uDayK, uMoon, uPaleK;
uniform vec3 uW1, uW2, uW3, uSlopeFill, uOutFill; uniform vec4 uGate, uIsle; uniform vec2 uGateK; uniform float uLowT;
// late light: the sun reaches the lake only in a band that comes down the side valley (uGate: unit vector across the band,
// its offset, its half-width; uGateK: the sun's strength outside and inside it). Without a band both strengths are 1.
float sunGateH(vec2 q){ return mix(uGateK.x, uGateK.y, step(1., uGate.w) * (1. - smoothstep(.55, 1., abs(dot(q, uGate.xy) - uGate.z) / max(uGate.w, 1.)))); }
float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= .5; } return s / .9375; }
// colour of the water column by path length, and what it does to a lit surface seen through it
vec3 waterCol(float d){ return mix(mix(uW1, uW2, smoothstep(.5, 8., d)), uW3, smoothstep(8., 22., d)); }
vec3 uwAbsorb(vec3 lit, float depth, float vy){
  float pl = depth * (.6 + .4 / max(vy, .14)), k = 1. - exp(-pl * .026);       // looked at along the water, a sunk thing lies behind a long reach of it
  vec3 wc = waterCol(pl);
  return lit * exp(-pl * vec3(.065, .015, .0105)) * (1. - k * .7) + wc * k * uScat;
}`;
const GL_CAUSTIC = /* glsl */`
float cnet(vec2 p){ float a = vn(p), b = vn(p * 1.83 + vec2(5.2, 1.3)); float r = 1. - abs(2. * a - 1.), q = 1. - abs(2. * b - 1.);
  r *= r; r *= r * r; q *= q; q *= q * q; return r + .6 * q; }
float caust(vec2 p, float t){ vec2 w = vec2(vn(p * .31 + t * .12), vn(p * .31 + 7.3 - t * .1)) * 1.5;
  return cnet(p * .62 + w + vec2(t * .13, t * .07)) + .8 * cnet(p * .95 - w * 1.2 + vec2(-t * .11, t * .14) + 9.1); }`;

// the state of the surface at a point: 1 behind the gust front (glitter, a window), 0 where the water is still glass.
// The standing trunks of the stand keep a lee of still water round them (uLee.xy centre, uLee.z strength) until the camera
// reaches them, so from pass one they stand doubled in a pool of mirror out in the glitter.
const GL_GUST = /* glsl */`
uniform float uFrontZ, uHealZ, uTilt; uniform vec3 uLee; uniform vec2 uLeeR;
float gustAt(vec2 q, out float behind, out float heal, out float lee){
  float wob = (fbm(vec2(q.x * .021, uFrontZ * .004)) - .5) * 44. + (vn(vec2(q.x * .12, 2.)) - .5) * 7.;
  behind = uFrontZ + wob + uTilt * q.x - q.y;
  heal = 1. - smoothstep(-45., 45., q.y - uHealZ + (fbm(q * .016) - .5) * 70.);
  lee = uLee.z * (1. - smoothstep(.5, 1., length((q - uLee.xy) / uLeeR) + .22 * (vn(q * .045) - .5)));
  return smoothstep(-1.5, 2.5, behind) * (1. - heal) * (1. - lee);
}`;
const UW_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aCol; attribute float aFlex;
uniform float uTime;
varying vec3 vL, vN, vC, vV; varying float vFlex;
void main(){
  vec3 p = position, n = normal, c = aCol;
  #ifdef K_WOOD
    // far off a standing trunk is thinner than a pixel and a half and would shimmer as a hairline: it is held to about two
    if (p.y > .6) {
      vec4 wq = modelMatrix * vec4(p, 1.); float hn = length(n.xz);
      p.xz += n.xz / max(hn, 1e-3) * (step(.35, hn) * max(0., distance(wq.xyz, cameraPosition) * .0042 - .4) * smoothstep(.6, 2., p.y));
    }
  #endif
  #ifdef K_TREE
    p = (instanceMatrix * vec4(p, 1.)).xyz; n = mat3(instanceMatrix) * n; c *= instanceColor;
    float ph = p.x * .31 + p.z * .27;
    p.x += aFlex * (sin(uTime * 1.6 + ph) * .14 + sin(uTime * 5.3 + p.y * 2.1 + p.x * 1.7) * .04);
    p.z += aFlex * (sin(uTime * 1.25 + ph * 1.3) * .11 + cos(uTime * 4.7 + p.y * 1.9 + p.z * 1.3) * .04);
  #endif
  #ifdef K_GARDEN
    float under = step(p.y, 0.), ph = p.x * 1.3 + p.z * 1.7;
    p.x += aFlex * mix(sin(uTime * 6. + ph * 3.) * .025 + sin(uTime * 1.9 + ph) * .05, sin(uTime * 1.1 + ph * .6 - aFlex * 3.) * .2 - aFlex * .25, under);
    p.z += aFlex * mix(cos(uTime * 5. + ph * 2.) * .025, cos(uTime * .9 + ph * .5 - aFlex * 2.) * .15 + aFlex * .5, under);
  #endif
  vL = p; vN = n; vC = c; vFlex = aFlex;
  if (p.y < 0.) p.y *= .75;                                   // apparent depth
  vec4 wp = modelMatrix * vec4(p, 1.);
  vV = (cameraPosition - wp.xyz) * mat3(modelMatrix);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const UW_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GL_COMMON}
${GL_CAUSTIC}
uniform vec3 uBone, uAmber, uJade, uGold, uScar, uMoss, uAlgae;
varying vec3 vL, vN, vC, vV; varying float vFlex;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  #ifdef K_ISLE
    // (the islet's steps are cut square: the face's own normal, not the rounded one of its vertices, tells tread from riser)
    vec3 Nf = normalize(cross(dFdx(vL), dFdy(vL)) + vec3(0., 1e-6, 0.)); if (Nf.y < 0.) Nf = -Nf;
    N = normalize(mix(N, Nf, .45) + vec3(0., .5, 0.));      // the islet's steep skirt takes some of its crown's light (a pale pedestal, not a dark plug), and its steps still read
  #endif
  vec3 V = normalize(vV + vec3(0., 1e-5, 0.));
  float depth = max(-vL.y, 0.), under = step(vL.y, 0.), wl = exp(-abs(vL.y) * 7.);
  vec3 alb = vC;
  #ifdef K_BED
    float n1 = fbm(vL.xz * .043), n2 = fbm(vL.xz * .11 + 31.), n3 = fbm(vL.xz * .85), sp = vn(vL.xz * 4.3);
    vec3 marl = uBone * (.3 + .26 * n3) * vec3(.94, 1., .97);
    marl = mix(marl, uAmber * mix(1., 1.5, smoothstep(5., 17., depth)), smoothstep(.5, .64, n1) * .8);
    marl = mix(marl, uJade, smoothstep(.53, .68, n2) * .75);
    marl *= (.8 + .4 * sp) * mix(1., 1.4, smoothstep(4., 13., depth));     // (round 12) the deep floor is WHITE marl: under the felled forest it stays pale enough to carry the trunks' shadows and its amber and jade
    vec2 lc = floor(vL.xz * 1.6); float lr = h21(lc);                    // sunken leaves
    float ld = length(fract(vL.xz * 1.6) - .5 - .25 * (vec2(h21(lc + 5.), h21(lc + 9.)) - .5));
    marl = mix(marl, mix(uGold, uScar, step(.5, h21(lc + 2.))) * .7, step(.955, lr) * smoothstep(.22, .16, ld));
    // (round 11) THE OUTLET (world: within 60 m of the rim that holds the lake, at (-100, 246)) is travertine, never mud:
    // cream and gold rimstone terraces under clear water, a white lip on every one, and the bank beside it the same stone
    float outK = 1. - smoothstep(24., 62., length(vL.xz - vec2(-100., 246.)));
    // (round 12) ITS FLOOR IS THE SHOAL'S OWN RIMSTONE, pool for pool: the same cells the world paints on the outlet tongue
    // (the same warp and hash in world coordinates, so a pool that lies across the join of the two meshes at z = 242 is one
    // pool), each 3 m by 1.5 m, turquoise over pale marl, held by a pale dam. (It was the level lines of a noise: from
    // 1.3 m up one long mauve swirl, 'a stretched texture'.)
    vec3 travO = marl;
    if (outK > .002) {
      vec2 rpO = vL.xz * vec2(.3, .62) + vec2(vn(vL.xz * .33), vn(vL.xz * .33 + 5.)) * 1.2, riO = floor(rpO), rfO = fract(rpO); float O1 = 9., O2 = 9.;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j)), r = g + vec2(h21(riO + g + 3.), h21(riO + g + 19.)) * .76 + .12 - rfO; float dd = dot(r, r);
        if (dd < O1) { O2 = O1; O1 = dd; } else if (dd < O2) O2 = dd;
      }
      float rdO = sqrt(O2) - sqrt(O1), dO = length(vV), wdO = .05 + dO * .004;                // (the dams widen and dim with distance: never a net of dots)
      float damO = smoothstep(wdO, wdO * .4, rdO) * min(1., .16 / wdO), poolO = smoothstep(.14, .5, rdO);
      float knO = vn(vL.xz * 15.) * .55 + vn(vL.xz * 37. + 9.) * .45, nrO = 1. - smoothstep(5., 16., dO);
      travO = uBone * vec3(.62, .57, .42) * (.74 + .2 * n3 + .5 * (knO - .5) * nrO) * mix(vec3(1.), vec3(1.06, .9, .6), smoothstep(.4, .7, n1 * .5 + .5 * vn(vL.xz * .6 + 5.)));
      travO = mix(travO, uW1 * .7 + uBone * .14, poolO * .6);                                // the pools are turquoise, as on the shoal above them
      travO *= 1. - .25 * smoothstep(wdO * 1.6, wdO, rdO) * (1. - damO);                      // a dark seam under each dam
      travO = mix(travO, uBone * .9, damO * .9);
    }
    marl = mix(marl, travO, outK);
    vec3 bank = mix(vC * (.7 + .6 * n3), travO, outK * .8);
    // (round 12) the banks of the outlet are the same mossed travertine as the shoulders of the shoal they run into: moss in
    // drifts from a hand above the water, the stone showing between them (they were one flat cream either side of the water)
    bank = mix(bank, uMoss * (.55 + .7 * n2) * mix(vec3(1.), vec3(1.25, 1.1, .7), smoothstep(.45, .7, vn(vL.xz * .31 + 2.))), outK * smoothstep(.1, .45, vL.y) * smoothstep(.3, .52, n3 * .45 + .55 * vn(vL.xz * .23 + 17.)) * .85);
    float lit2 = step(.72, h21(floor(vL.xz * 3.1))) * smoothstep(.3, .2, length(fract(vL.xz * 3.1) - .5));   // leaf litter
    float bfar = smoothstep(40., 140., length(vV));                      // far off the litter is no red band: moss and pale sedge in patches, a wider pale hair
    bank = mix(bank, mix(uGold, uScar, h21(floor(vL.xz * 3.1) + 4.)) * .8, lit2 * smoothstep(.15, .6, vL.y) * .85 * (1. - .85 * bfar));
    bank = mix(bank, mix(uMoss * .8, uBone * vec3(.66, .6, .42), smoothstep(.4, .62, n1)) * (.7 + .6 * n2), bfar * .75 * smoothstep(.05, .5, vL.y));
    bank = mix(bank, uBone * (.62 + .3 * n3) * vec3(1., .97, .9), exp(-max(vL.y, 0.) * mix(8., 3., bfar)) * .8);         // the white hair of shoreline
    bank = mix(bank, vec3(.8, .84, .9), uSnow * smoothstep(.2, .7, vL.y) * (.55 + .45 * n3));
    alb = mix(bank, marl, under);
    #ifdef K_ISLE
      // The islet is travertine, rimstone all the way down: every built step is a tread holding a shallow pool behind a white
      // lip over a riser draped cream and amber, and fine terracettes follow the contours between the steps. Dry, it is cream
      // with a white rim at the waterline and moss on its crown. (uIsle.w: its brightness by the hour.)
      float iw = vn(vL.xz * .8 + 3.), trI = fract(vL.y * mix(4.6, 1.5, under) + .8 * iw + .25 * vn(vL.xz * 3.7 + 9.));
      float lipI = smoothstep(0., .1, trI) * (1. - smoothstep(.1, .32, trI)), creI = 1. - smoothstep(0., .45, trI);
      // (vFlex: 1 along the outer edge of a tread, the lip its pool stands behind, and at the top of the riser under it)
      float flatI = smoothstep(.55, .8, Nf.y), edgeI = flatI * smoothstep(.66, .93, vFlex + .16 * (iw - .5)), drapI = (1. - flatI) * (.4 + .6 * vFlex);
      float pitI = 1. - smoothstep(.2, .38, vn(vL.xz * 8. + vL.y * 6.) * .6 + vn(vL.xz * 21. + 5.) * .4);
      vec3 travI = uBone * (.5 + .16 * n3 + .1 * sp) * mix(vec3(1.), vec3(1.04, .9, .68), smoothstep(.42, .7, n1 * .6 + .5 * iw));
      travI = mix(travI, uBone * vec3(.52, .39, .22) * (.66 + .34 * sp + .5 * vn(vL.xz * 5.3)), drapI * mix(.6, .85, under));            // drapery on the risers, in streaks, darkest under each lip
      travI *= (1. - .35 * pitI) * (1. + flatI * (.3 * lipI - .22 * creI));
      travI = mix(travI, uBone * .86, max(lipI * .4 * flatI, edgeI * .92));                                             // the white lips
      vec3 poolI = mix(travI, uW1 * .8 + .1, .5 * flatI * (1. - lipI) * (1. - edgeI));                                 // the pools on the treads: pale turquoise over white
      vec2 lcI = floor(vL.xz * 3.1);
      vec3 crownI = vC * (.7 + .6 * n3);
      crownI = mix(crownI, mix(uGold, uScar, h21(lcI + 4.)) * .8, lit2 * step(.62, h21(lcI + 7.)) * .85);              // a few fallen leaves, not a speckle
      crownI = mix(crownI, vec3(.8, .84, .9), uSnow * (.55 + .45 * n3));
      vec3 dryI = mix(travI, uW1 * .5 + .32, .34 * flatI * (1. - edgeI) * smoothstep(.3, .6, iw + .3 * n3));              // a film of water stands behind some of the dry lips too
      dryI = mix(dryI, crownI, smoothstep(.74, 1., vL.y + .2 * n3) * .9);
      dryI = mix(dryI, uBone * .86, exp(-max(vL.y, 0.) * 4.) * .9 * (1. - .45 * flatI));                               // the white rim at the waterline
      // (round 11) seen from the turn, 17 m off, the islet is rimstone you could count: every terracette a pale lip over a
      // dark crease, amber and umber drapery down the risers with a shadow under each lip, cushions of moss and a scatter of
      // fallen leaves on the treads, and the wet treads shining (wetI, below)
      float nrI = 1. - smoothstep(45., 110., length(vV));
      dryI *= 1. + nrI * (.34 * lipI - .3 * creI) * (1. - flatI * .5);
      dryI *= 1. - nrI * .42 * (1. - flatI) * smoothstep(.55, 1., vFlex);
      dryI = mix(dryI, uBone * vec3(.4, .27, .13) * (.7 + .6 * sp), nrI * (1. - flatI) * smoothstep(.5, .72, vn(vL.xz * 2.3 + 11.)) * .55);
      float mossI = flatI * (1. - edgeI) * smoothstep(.5, .58, vn(vL.xz * 1.3 + 7.) * .6 + vn(vL.xz * 3.7 + 2.) * .4) * (1. - smoothstep(.74, 1., vL.y + .2 * n3));
      dryI = mix(dryI, uMoss * (.55 + .7 * vn(vL.xz * 9.)) * (.8 + .4 * n3), mossI * .85 * nrI);
      float leafI = lit2 * flatI * (1. - edgeI) * step(.3, h21(lcI + 7.)) * (1. - mossI);
      dryI = mix(dryI, mix(uGold, uScar, step(.6, h21(lcI + 4.))) * .85, leafI * .9 * nrI);
      float wetI = flatI * (1. - edgeI) * smoothstep(.3, .6, iw + .3 * n3) * (1. - mossI) * (1. - under) * nrI;
      float i1 = vn(vL.xz * 1.7 + 13.), netI = smoothstep(.86, .98, 1. - abs(2. * i1 - 1.)) * flatI * (1. - edgeI) * nrI;      // small dams on every tread, a pool behind each
      dryI = mix(dryI, uBone * .9, netI * .5 * (1. - mossI));
      poolI = mix(poolI, uW1 * .62 + uBone * .12, .34 * flatI * (1. - edgeI) * nrI * smoothstep(.3, .9, abs(2. * i1 - 1.)));
      poolI = mix(poolI, uBone * .92, netI * .7);
      poolI *= 1. - nrI * .3 * (1. - flatI) * smoothstep(.55, 1., vFlex);
      alb = mix(dryI, poolI, under) * uIsle.w;
    #endif
  #endif
  #ifdef K_WOOD
    float g = fbm(vec2(vL.x * 2.3 + vL.y * 3.1, vL.z * 2.3 - vL.y * 1.7)), g2 = vn(vL.xz * 9. + vL.y * 7.);
    float ndW = (1. - smoothstep(5., 22., length(vV))) * uPaleK;      // within a stone's throw of the lens sunk wood is bone, not mint
    vec3 crust = alb * (.8 + .32 * g) * (.9 + .15 * g2);
    float algK = smoothstep(.2, .9, N.y) * (.3 + .5 * g) * .86 * (.3 + .7 * smoothstep(.4, .62, fbm(vec2(vL.x * .9 - vL.z * .6, vL.z * .9 + vL.x * .6) + 3.))) * (1. - .5 * ndW);
    crust = mix(crust, uAlgae * 1.15, algK) * mix(.74, 1., smoothstep(3., 9., depth));   // (algae in drifts along the upper side, bone between them)   // wood near the surface is not paper white
    float nd = 1. - smoothstep(3., 10., length(vV));          // under the lens: crust lobes with dark seams, and algae in the hollows
    vec3 wv = vL + vec3(sin(uTime * 1.9 + vL.z * 2.7 + vL.x * 1.1), 0., cos(uTime * 1.5 + vL.x * 3.1 - vL.z * .9)) * (.035 * nd * under);   // (the pattern swims a little: it is seen through rippled water)
    float lobe = fbm(vec2(wv.x * 6.5 + wv.y * 4., wv.z * 6.5 - wv.y * 3.)), pit = vn(wv.xz * 27. + wv.y * 21.), lobe2 = vn(vec2(wv.x * 15. - wv.y * 9., wv.z * 15. + wv.y * 8.));
    float seam = max(smoothstep(.05, .0, abs(lobe - .5)), .7 * smoothstep(.06, .0, abs(lobe2 - .5)));
    crust *= mix(1., (.6 + .7 * pit) * (1. - .55 * seam) * (.82 + .36 * smoothstep(.35, .7, lobe2)), nd);
    crust = mix(crust, mix(vec3(dot(crust, vec3(.3, .5, .2))), crust, .55) * vec3(1.06, 1., 1.02), nd * .7 * uPaleK);          // (under the lens the algae's green gives way to grey bone)
    crust = mix(crust, uAlgae * (.6 + .5 * pit), nd * smoothstep(.56, .68, lobe) * .4);
    crust = mix(crust, crust * vec3(.5, .42, .3), nd * smoothstep(.62, .8, vn(wv.xz * 3.1 + wv.y * 2.3 + 7.)) * .5);          // patches where the crust has flaked to dark wood
    {                                                           // the crust's lobes stand out of the wood: their relief takes the light
      float hb = (lobe * .62 + lobe2 * .38) * nd * under, hbx = dFdx(hb), hby = dFdy(hb);
      vec3 dpx = dFdx(vL), dpy = dFdy(vL), r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
      N = normalize(N * max(abs(det), 1e-7) - (hbx * r1 + hby * r2) * (sign(det) * .11) + vec3(0., 1e-7, 0.));
    }
    vec3 dry = alb * vec3(.66, .65, .63) * (.7 + .5 * g) * (.82 + .3 * g2);
    dry = mix(dry, uMoss * (.7 + .6 * g2), smoothstep(.25, .8, N.y + .5 * g - .25) * max(smoothstep(2.6, .2, vL.y), vFlex * .8) * .9);   // (vFlex 1: the arch, mossed along its whole upper side)
    float stand0 = 1. - smoothstep(.3, .65, abs(N.y)), stand = max(stand0, vFlex), ndd = 1. - smoothstep(14., 42., length(vV)), al = mix(vL.y, vL.x * .8 + vL.y * .45, vFlex);
    float cq = mix(N.x * 3.7 + N.z * 2.3 + vL.x * .9 + vL.z * .6 + vL.y * .2, N.y * 3.7 + N.z * 3.1 + vL.z * .9 + vL.y * .25, vFlex);   // (the grain winds round the shaft)
    float ck = vn(vec2(cq * 1.6, al * .33)), ck2 = vn(vec2(cq * 6.5 + 3., al * 1.1));   // weathered standing wood: long cracks, fine grain, lost bark in plates
    dry *= mix(1., (1. - .5 * smoothstep(.07, .0, abs(ck - .5))) * (.86 + .28 * ck2) * (.9 + .2 * smoothstep(.45, .62, vn(vec2(cq * .7 + 9., al * .22)))), stand * ndd);
    dry = mix(dry, dry * vec3(.5, .41, .34), smoothstep(.5, .62, vn(vec2(cq * .8 + 9., al * .21))) * stand * .7 * (1. - smoothstep(60., 140., length(vV))));   // plates of bark not yet fallen
    float spir = fract(atan(N.z, N.x + 1e-5) * .15915 + vL.y * .085 + vL.x * .013 + .05 * (ck - .5));   // one deep check winds up every shaft the lens passes
    dry *= 1. - (.62 * smoothstep(.022, .004, abs(spir - .5)) + .25 * smoothstep(.34, .5, vn(vec2(cq * 2.3, al * 3.1))) * smoothstep(.75, .9, vn(vec2(cq * .9 + 5., al * .5)))) * stand0 * (1. - smoothstep(12., 30., length(vV)));
    dry *= 1. - .3 * smoothstep(1.5, .35, vL.y) * stand;                  // damp wood over the water
    dry = mix(dry, alb, exp(-max(vL.y, 0.) * 4.) * .85);                  // crust to the waterline
    dry = mix(dry, vec3(.82, .86, .92), uSnow * smoothstep(.45, .85, N.y) * smoothstep(.15, .5, vL.y) * .85);
    alb = mix(dry, crust, under);
  #endif
  #ifdef K_GARDEN
    alb *= .8 + .4 * vn(vL.xz * 7. + vL.y * 5.);
    {   // (round 11) moss is tufts, not a smooth green lump: bright star tips over dark crevices at the scale of a finger,
        // coarser clumps over them; the cushion's skin takes the light tuft by tuft. Within 30 m of the lens, out of the water
      float gnk = (1. - smoothstep(9., 34., length(vV))) * (1. - smoothstep(.03, .25, vFlex)) * (1. - under);
      float tfA = vn(vL.xz * 19. + vL.y * 13.), tfB = vn(vL.xz * 47. + vL.y * 31. + 3.), tfC = vn(vL.xz * 5.3 + vL.y * 4.1 + 9.);
      alb *= mix(1., (.5 + .62 * tfA) * (.72 + .5 * tfB) * (.8 + .4 * tfC) * 1.12, gnk);
      alb = mix(alb, alb * vec3(1.3, 1.25, .7), gnk * smoothstep(.6, .8, tfB) * .6);
      N = normalize(N + vec3(tfA - .5, 0., vn(vL.zx * 19. + 7.) - .5) * (.9 * gnk));
    }
    // (the island's own shrubs and sedge, at (-41, -35.5), keep the hour's key with its trees and its stone: uIsle.w)
    float isG = (1. - smoothstep(8.5, 11., length(vL.xz - vec2(-41., -35.5)))) * (1. - uIsle.w);
    alb = mix(alb, vec3(dot(alb, vec3(.3, .55, .15))) * vec3(.7, .85, 1.25), min(1., isG * 1.3)) * (1. - .5 * isG);
    alb = mix(alb, vec3(.82, .86, .92), uSnow * (1. - under) * smoothstep(.1, .75, N.y) * .8);
  #endif
  #ifdef K_TREE
    alb *= (.6 + .75 * vn(vL.xz * 1.3 + vL.y * 1.9) * vn(vL.zx * 3.7 - vL.y * 2.3) * 1.6) * (.6 + .4 * smoothstep(-.7, .4, N.y));
  #endif
  float sd = dot(N, mix(uSun, uSunU, under)), ndl = max(sd, 0.);
  #if defined(K_GARDEN) || defined(K_TREE)
    ndl = ndl * .65 + .35 * max(sd * .5 + .5, 0.) + .3 * max(-sd, 0.) * max(dot(-V, uSun), 0.);   // leaves pass light
  #endif
  vec3 amb = mix(uAmbH * .45, uAmbZ, N.y * .5 + .5) * uAmb;
  #ifdef K_GARDEN
    // moss and sedge out of the water glow in raking and back light (a garden is never a dark hull on the lake)
    ndl = mix(ndl, ndl * .5 + .34 + .5 * max(-sd, 0.), 1. - under); amb *= mix(2.1, 1., under);
  #endif
  #ifdef K_ISLE
    // the island's pale ground takes the sky's fill as warm grey (not a blue slab under a low sun), and a low sun still grazes it
    amb = mix(amb, vec3(dot(amb, vec3(.3, .5, .2))) * vec3(1.08, 1., .9), uIsle.y * (1. - under)) * mix(1., uIsle.z, 1. - under);   // (by the hour: under the moon and in dawn's shade it stays the blue of the sky's light)
    ndl = mix(ndl, ndl * .55 + .45 * smoothstep(-.2, .5, sd), 1. - under);
  #endif
  #ifdef K_WOOD
    ndl = mix(ndl * .75 + .25 * (sd * .5 + .5), ndl, under); amb *= mix(2.5, 1., under);   // (dry wood in shade is still bone: a root plate against the bright mist is never a dark hull)
    amb = mix(amb, vec3(dot(amb, vec3(.3, .5, .2))) * vec3(1.04, 1., .97), .62 * (1. - under));   // dry bone wood takes the sky's fill as grey: a limb's upper side is not a blue ribbon
  #endif
  float cf = under * mix(.45, 1., 1. - smoothstep(4.5, 11., depth)) * (1. - smoothstep(18., 24., depth)) * smoothstep(0., .5, depth);
  float ca = caust((vL.xz + uSunU.xz / max(uSunU.y, .2) * depth) * mix(1., .62, smoothstep(6., 18., depth)), uTime);   // a wider, softer net on the deep wood
  #ifdef K_WOOD
    // Sunk wood is bone gone aqua, paler than the water round it. Only the trunks hung up 1.5-5 m under pass one (x -100, z 30-120),
    // seen along the water from a few metres off, are dimmer and waterlogged: pale and level they read as panes lying on the surface.
    float hung = under * (1. - smoothstep(16., 24., abs(vL.x + 100.))) * smoothstep(30., 40., vL.z) * (1. - smoothstep(112., 122., vL.z))
      * smoothstep(1., 1.8, depth) * (1. - smoothstep(4.5, 7., depth));
    float cnetK = mix(1., mix(.36 + 1.6 * ca, .3 + 1.15 * ca, hung), cf);   // the caustic net shows on the wood
  #else
    float cnetK = mix(1., .68 + .85 * ca, cf);
  #endif
  float sgate = sunGateH(vL.xz);
  #ifdef K_ISLE
    sgate = max(sgate, uIsle.x);     // the islet stands in the open: by day the low sun reaches it over the stand
  #endif
  vec3 sunL = uSunCol * ndl * mix(1., exp(-depth * .015) * cnetK, under) * sgate;
  #ifdef K_TREE
    sunL *= .55 + .45 * smoothstep(-.2, .9, vFlex + vn(vL.xz * .08));       // crowns shade their own insides
  #endif
  vec3 col = alb * (sunL + amb * mix(1., 1.25 + .5 * ca * cf, under));
  #ifdef K_BED
    // (round 12) the travertine of the outlet, floor and banks, takes the same fill of sky light as the travertine of the
    // shoal it runs into (uOutFill: the world's own term for its travertine in shade). In a look whose lake lies in shade
    // the two were lit by different sums: the shoal pale, the outlet beside it one flat violet band.
    col += alb * uOutFill * outK;
  #endif
  #ifdef K_ISLE
    {                                                             // the wet treads of the islet shine: the sky lies on them, and the sun where it reaches
      float fI = 1. - max(V.y, 0.), sI = max(dot(reflect(-V, vec3(0., 1., 0.)), uSun), 0.); fI *= fI; sI *= sI; sI *= sI; sI *= sI; sI *= sI;
      col = mix(col, mix(uHor, uZen, .6) * (.55 + .45 * uDayK), wetI * (.12 + .5 * fI));
      col += uSunCol * (sI * sI * wetI * sgate * .6);
    }
  #endif
  #ifdef K_WOOD
    float rnd = mix(mix(.3, 1., smoothstep(-.45, .5, N.y)), mix(.3, 1., smoothstep(-.3, .8, N.y)), nd);        // a sunk log is round: light comes down the water, so its top is pale, its flanks fall off and its underside is dark
    col += alb * waterCol(depth * .5 + .5) * min(uScat, .7) * (.6 * rnd * under) * mix(1., .4, max(nd * uPaleK, ndW));                       // the glow of the water column itself falls on it from above
    float edge = 1. - abs(dot(N, V)), rim = 1. - .34 * smoothstep(.72, 1., edge);   // a thin dark rim only (the top of a log seen along the water stays pale); under the lens its flanks fall off sooner (rnd): a round thing
    col *= mix(1., rnd * mix(rim, (1. - .5 * edge - .25 * edge * edge) * .68, hung), under);
    col += alb * (uW1 * .16 * uDayK + uSunCol * .07 * sunGateH(vL.xz)) * (vFlex * max(-N.y, 0.) * (1. - under));   // the water's light on the underside of the arch
  #endif
  float dEff = depth;
  #ifdef K_WOOD
    // deep wood is seen through a shorter, clearer reach than the floor it lies on (the tangle stays bone-pale from the turn); the hung trunks keep the long reach
    dEff *= mix(.6 * (.75 + .25 / max(V.y, .3)) / (.6 + .4 / max(V.y, .14)), .82, hung);
  #endif
  #ifdef K_BED
    dEff *= mix(1., .7, smoothstep(5., 17., depth));              // the deep floor keeps its marl and its patches
  #endif
  col = mix(col, uwAbsorb(col, dEff, V.y), under);
  #ifdef K_WOOD
    // never darker than the water: in the low-sun and moon looks, and on every shaded flank, sunk wood keeps about twice the glow of the water round it
    float plF = depth * (.6 + .4 / max(V.y, .14));
    // (round 12: twice the water's glow on its upper side only; its flanks fall to the water's own tone and its underside below it: a round, solid thing, not a pane of pale glass)
    col = max(col, (waterCol(plF) * .6 + uW1 * .25) * ((1. - exp(-plF * .026)) * min(uScat, .66) * 2.1 * mix(1., .5, nd * uPaleK) * mix(.24, 1., smoothstep(-.2, .6, N.y)) * under * (1. - .7 * hung)));
  #endif
  #if defined(K_WOOD) || defined(K_GARDEN)
    float ndl2 = 1. - smoothstep(5., 22., length(vV));
    col *= mix(vec3(1.), mix(vec3(1.), uW1 * 1.55, .5 - .4 * ndl2 * uPaleK), under * smoothstep(0., 1.1, depth) * (1. - .85 * smoothstep(4., 11., depth)));   // the first metre of water already casts shallow wood turquoise
    { float lw = dot(col, vec3(.3, .55, .15)); col = mix(col, lw * vec3(1.1, 1.02, .9), .7 * ndl2 * uPaleK * under * (1. - smoothstep(2.5, 6., depth))); }   // under the lens it is bone: warm grey-white crusted wood, not mint
    #ifdef K_WOOD
      // (round 12) and from the turn, 11 m up: the upper side of every sunk trunk within ten metres of the surface is bone white
      // where the algae has not dusted it green-gold (the water tints it, it does not turn it to mint glass)
      { float lw2 = dot(col, vec3(.3, .55, .15)); col = mix(col, lw2 * vec3(1.12, 1.05, .93) * 1.08, .5 * uPaleK * under * smoothstep(.05, .7, N.y) * (1. - algK) * (1. - smoothstep(6., 12., depth)) * (1. - hung)); }
    #endif
  #endif
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// the far scenery by direction, shared by the mirror and the backdrop ring so the two always agree
const GL_SKYLINE = /* glsl */`
float gSoft = 0.;     // how soft the far skylines are drawn: 0 for the backdrop ring, a little in the water (round 11: the image of a mountain in the lake has a soft, wavering edge)
vec3 skyCol(vec3 R){
  float h = max(R.y, 0.), md = max(dot(R, uSun), 0.); vec3 c = mix(uHor, uZen, pow(h, .38)) + uSunCol * uMoon * (5. * smoothstep(.9978, .9988, md) + .25 * pow(md, 300.));   // the moon rides in the mirror
  float ci = fbm(vec2(atan(R.x, -R.z + 1e-5) * 1.4 + h * 2., h * 26.));
  return mix(c, uHor * 1.1 + .05 * uDayK, smoothstep(.55, .95, ci) * .14 * smoothstep(.06, .3, h));
}
vec3 farLand(vec2 d, float ty, float az, out float cov){
  float sf = .5 + .5 * dot(-d, normalize(uSun.xz + vec2(1e-5, 0.)));
  vec3 lightS = mix((vec3(.22, .3, .46) + uZen * .25) * uDayK, uSunCol * .95 + .05 * uDayK, smoothstep(.3, .75, sf));
  float pk = max(uSky.w * max(0., 1. - pow(abs(az) / uPeakW, .85)), uSky.w * .62 * max(0., 1. - pow(abs(az + uPeakW * .7) / (uPeakW * .9), .9))) * (.9 + .2 * vn(vec2(az * 40., 2.)));
  vec3 snow = mix(uSunCol * .95 + .1 * uDayK, vec3(.45, .58, .85) * (uAmb + .35) * uDayK, smoothstep(-.03, .05, az + .06 * (vn(vec2(ty * 70., az * 30.)) - .5)));
  snow = mix(vec3(.3, .33, .4) * (.5 + uAmb) * uDayK, snow, smoothstep(.45, .7, ty / max(pk, 1e-3) + .25 * vn(vec2(az * 90., ty * 50.))));
  float cp = smoothstep(-gSoft, gSoft + .006, pk - ty);
  vec3 c = mix(snow, uHor, .2);
  float az2 = az - 1.64, nt = exp(-az2 * az2 / .05);                // the side valley that opens in the west slope, and the peak at its head
  float pk2 = uSky.w * .8 * max(0., 1. - pow(abs(az2) / (uPeakW * .62), .85)) * (.9 + .2 * vn(vec2(az * 40., 5.)));
  cp = max(cp, smoothstep(-gSoft, gSoft + .006, pk2 - ty));
  float sl = (uSky.z + (uSky.y - uSky.z) * pow(abs(d.x), 1.5)) * (.8 + .4 * fbm(vec2(az * 2.2 + 4., 1.7))) * (1. - .74 * nt);
  float f = ty / max(sl, 1e-3);
  float tex = vn(vec2(az * 260., ty * 330.)), mid = fbm(vec2(az * 55., ty * 80.)), big = fbm(vec2(az * 5. + 3., ty * 7.));
  vec3 sc = uSpruce * (1.5 + 1.4 * tex);
  float larch = smoothstep(.42, .6, f + .3 * (big - .5)) * (1. - smoothstep(.74, .86, f)) * smoothstep(.42, .6, mid * .6 + tex * .4);
  float birch = (1. - smoothstep(.04, .3, f)) * smoothstep(.45, .62, mid * .6 + tex * .4);
  sc = mix(sc, uGold * vec3(1., .82, .6) * (.5 + .45 * tex), max(larch * .9, birch * .75));
  sc = mix(sc, vec3(.36, .37, .41) * (.7 + .5 * mid), smoothstep(.78, .9, f + .12 * (mid - .5)));
  sc = mix(sc, vec3(.9, .93, 1.), smoothstep(.9, .98, f + .1 * (mid - .5)) * .8);
  float cl = 1. - .4 * smoothstep(.52, .68, fbm(vec2(az * 2.6 + uTime * .012, ty * 3.5 - uTime * .008)));
  sc = mix(sc * (lightS + uSlopeFill * 1.5) * cl * 1.15, uHor * .8, .16 + .2 * smoothstep(0., .9, f));
  float cs = smoothstep(-gSoft, gSoft + .006, sl - ty);
  c = mix(c, sc, cs); cov = max(cp, cs);
  return c;
}`;
const RING_FRAG = /* glsl */`
#include <common>
${GL_COMMON}
uniform vec4 uSky; uniform float uPeakW; uniform vec3 uSpruce, uGold;
${GL_SKYLINE}
varying vec3 vL;
void main(){
  float hl = max(length(vL.xz), 1e-3); vec2 d = vL.xz / hl; float ty = vL.y / hl, cov;
  vec3 c = farLand(d, ty, atan(d.x, -d.y + 1e-5), cov);
  if (cov < .01) discard;
  gl_FragColor = vec4(c, cov);
}`;

const SURF_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vL, vV;
void main(){
  vL = position; vec4 wp = modelMatrix * vec4(position, 1.);
  vV = (cameraPosition - wp.xyz) * mat3(modelMatrix);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SURF_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GL_COMMON}
${GL_GUST}
uniform float uPeakW, uEndZ; uniform vec4 uSky, uPortal; uniform vec3 uSnagA, uSnagB, uPortalCol; uniform vec2 uPortalN;
uniform vec3 uBone, uGold, uScar, uSpruce, uGreen;
varying vec3 vL, vV;
float boxExit(vec2 p, vec2 d, vec2 c, vec2 h){
  vec2 q = p - c, s = vec2(d.x >= 0. ? 1. : -1., d.y >= 0. ? 1. : -1.);
  vec2 t = (h - s * q) / max(abs(d), vec2(1e-4));
  return max(min(t.x, t.y), 0.);
}
bool inBox(vec2 p, vec2 c, vec2 h){ vec2 q = abs(p - c); return q.x < h.x && q.y < h.y; }
float shoreDist(vec2 p, vec2 d){
  vec2 ca = vec2(-47.5, 80.), ha = vec2(97.5, 155.), cb = vec2(87.5, -67.5), hb = vec2(147.5, 102.5);
  float t = 0.;
  if (inBox(p, ca, ha)) { t = boxExit(p, d, ca, ha); vec2 p1 = p + d * (t + .5); if (inBox(p1, cb, hb)) t += .5 + boxExit(p1, d, cb, hb); }
  else if (inBox(p, cb, hb)) { t = boxExit(p, d, cb, hb); vec2 p1 = p + d * (t + .5); if (inBox(p1, ca, ha)) t += .5 + boxExit(p1, d, ca, ha); }
  return t;
}
${GL_SKYLINE}
// what still water shows: shore trees (parallax-correct against the lake outline), valley slopes, the peak, sky
vec3 mirror(vec3 R, vec2 P){
  float hl = max(length(R.xz), 1e-4); vec2 d = R.xz / hl; float ty = R.y / hl;
  float az = atan(d.x, -d.y + 1e-5), sf = .5 + .5 * dot(-d, normalize(uSun.xz + vec2(1e-5, 0.))), cov;
  vec3 lightS = mix((vec3(.22, .3, .46) + uZen * .25) * uDayK, uSunCol * .95 + .05 * uDayK, smoothstep(.3, .75, sf));
  gSoft = .012;
  vec3 c = skyCol(R) * .9, fl = farLand(d, ty + (vn(vec2(az * 36., ty * 16.)) - .5) * .022, az, cov);
  c = mix(c, fl, cov);
  // (round 12: over the outlet tongue, north of the lake's own outline, the shore is measured from the lake's edge: looking
  // down the lake from the shoal's crest the far shore is 400 m off, not 13)
  float t = shoreDist(vec2(P.x, min(P.y, 233.)), d) + 13.; vec2 hit = P + d * t;
  // the shore trees' image: a ragged line of separate crowns (never a level band), lit like the trees themselves: where the
  // low sun does not reach the shore they are in shade, and so is their image
  float Ht = uSky.x * (.42 + .5 * vn(hit * .13) + .55 * vn(hit * .37 + 3.)) * (.66 + .34 * vn(hit * 1.1 + 8.)), tyT = Ht / t, k = vn(hit * .1 + 11.) * .7 + vn(hit * .47 + 2.) * .3, k2 = vn(hit * .23 + 5.) * .65 + vn(hit * .61 + 9.) * .35;
  vec3 tc = mix(uGold, uScar, smoothstep(.56, .68, k2) * step(k, .7));
  tc = mix(tc, uGreen, smoothstep(.68, .8, k2)) * (.55 + .5 * vn(hit * .8 + 4.));
  tc = mix(tc, uSpruce * 1.3, smoothstep(.42, .66, k) * .9);
  tc = mix(tc, mix(uGold * .7, uSpruce * 1.5, .5), .35);
  float inB = step(1., uGate.w) * (1. - smoothstep(.55, 1., abs(dot(hit, uGate.xy) - uGate.z) / max(uGate.w, 1.))), bs = mix(uLowT, 1., inB);
  vec3 shadeS = (vec3(.22, .3, .46) + uZen * .25) * uDayK + uSlopeFill * .8;
  tc = mix(tc, uSpruce * 1.6 + vec3(.01, .025, .04), .5 * (1. - bs));      // (in shade the image is spruce-dark and blue, crown by crown: never a flat red band)
  tc *= (mix(shadeS * 1.15, lightS, bs) * .8 + uGold * .25 * uDayK * (1. - smoothstep(.3, .75, sf)) * bs) * (.5 + .5 * clamp(ty / max(tyT, 1e-3), 0., 1.)) * (.5 + 1. * vn(hit * 1.1));
  float rag = vn(vec2(az * 330., ty * 90.)) * .6 + vn(vec2(az * 900., ty * 260.)) * .4;       // leaf-sized breaks along the crown line
  c = mix(c, tc, smoothstep(-.06 * tyT, .32 * tyT + .003, tyT - ty + (rag - .5) * .3 * tyT));
  return mix(c, uBone * (.5 + uAmb) * (uSunCol * .5 + .5 * uDayK), smoothstep(.75 / t, .4 / t, ty));
}
float snag(vec3 S, vec2 P, vec2 d, float ty){
  vec2 w = S.xy - P; float al = dot(w, d), pe = abs(w.x * d.y - w.y * d.x), h = ty * al;
  float r = S.z * (1. - .6 * clamp(h / 16., 0., 1.)) + .04 + al * .0015;
  return step(0., al) * step(h, 16.3) * smoothstep(r, r * .7, pe);
}
float spark(vec2 q, float f){ vec2 w = vec2(uTime * .19, -uTime * .43) * f; q.x *= .5; return vn(q * f + w) * vn(q * f * .44 - w * .6 + 3.7); }   // glints lie along the wavelets, across the wind
float hgt(vec2 q, float gust, float lod, float calm){
  float h = .07 * vn(q * .2 + vec2(uTime * .05, uTime * .03)) + .018 * vn(q * .95 - uTime * .1);
  h += gust * lod * (.1 * vn(q * vec2(2.3, 1.1) + vec2(0., -uTime * 1.7)) + .045 * vn(q * vec2(5.3, 2.7) + vec2(uTime * .3, -uTime * 2.4)));
  for (int i = 0; i < 4; i++) {                                // rings where fish rise
    float tt = uTime * .22 + float(i) * .37, id = floor(tt), ph = fract(tt);
    vec2 c = (vec2(h21(vec2(id, float(i) + .5)), h21(vec2(float(i) + 7.5, id))) - .5) * vec2(190., 170.) + vec2(10., -20.);
    float r = length(q - c) - ph * 6.;
    h += calm * .035 * sin(r * 7.) * exp(-abs(r) * 1.1) * (1. - ph) * (1. - ph);
  }
  return h;
}
void main(){
  float dist = length(vV); vec3 V = vV / max(dist, 1e-3); vec2 q = vL.xz;
  float behind, heal, lee, gust = gustAt(q, behind, heal, lee);
  // (pass two: the calm returns as ONE front that travels from the head of the lake, heal in gustAt; nothing stills by the clock)
  float calm = 1. - gust;
  float lod = 1. - smoothstep(50., 240., dist), e = .16;
  float h0 = hgt(q, gust, lod, calm), hx = hgt(q + vec2(e, 0.), gust, lod, calm), hz = hgt(q + vec2(0., e), gust, lod, calm);
  vec3 N = normalize(vec3(h0 - hx, e, h0 - hz));
  float cosv = clamp(dot(N, V), .02, 1.), om = 1. - cosv, F = .02 + .98 * om * om * om * om * om;
  vec3 R = reflect(-V, N); R.y = abs(R.y) + .004; R = normalize(R);
  vec3 mir = mirror(R, q);
  float hl = max(length(R.xz), 1e-4); vec2 d = R.xz / hl; float ty = R.y / hl;
  float sg = max(snag(uSnagA, q, d, ty), snag(uSnagB, q, d, ty));
  mir = mix(mir, uBone * (.45 + .5 * uAmb) * (uSunCol * .5 + .5 * uDayK), sg);
  float pd = dot(uPortal.xz - q, uPortalN), pr = dot(R.xz, uPortalN);     // the gate's ring of light, doubled in the water
  if (pd > 1. && pr > 1e-3) {
    float sH = pd / pr; vec3 H = vec3(q.x, 0., q.y) + R * sH;
    float rr = length(vec2(dot(H.xz - uPortal.xz, vec2(-uPortalN.y, uPortalN.x)), H.y - uPortal.y)) / uPortal.w;
    mir += uPortalCol * ((1. - smoothstep(.8, 1.08, rr)) * .75 + .5 * exp(-max(rr - 1., 0.) * 2.2)) * smoothstep(.5, 1.5, H.y) * (1. - smoothstep(150., 320., sH));
  }
  vec3 skyG = skyCol(normalize(vec3(R.x, R.y + .3, R.z)));
  // (round 11: behind the gust the water is a window at a level gaze too, not a sheen: less of the sky lies on it)
  float ov = 1. - max(V.y, 0.), ov2 = ov * ov, Fg = .03 + .5 * ov2 * ov2 * ov2;
  float Ac = max(F, mix(.55, .8, smoothstep(10., 45., dist)) * smoothstep(4., 9., dist));
  // (round 12) THE OUTLET SHELF (world: within 20-34 m of the rim at (-100, 246); a hand of water over cream travertine): the
  // pale floor shone through the mirror and washed the doubled peak and forest out of it. There the water is a window for
  // the first three metres under the nose and a full mirror from six.
  Ac = mix(Ac, max(F, .92 * smoothstep(2.6, 6., dist)), 1. - smoothstep(20., 34., length(q - vec2(-100., 246.))));
  // over the shallow shelf the pale bed outshines the mirror near the lens: the window stays open under the nose, the mirror holds further out
  // (round 11: they are wavelets lying across the way to the gate, long and narrow, coming from the sill: in world
  // coordinates, along and across the gate's own axis; never round patches of sky)
  vec2 rq = vec2(dot(q, vec2(-uPortalN.y, uPortalN.x)), dot(q, uPortalN));
  float rpl = smoothstep(.47, .72, vn(vec2(rq.x * .5, rq.y * 2.1) + vec2(uTime * .15, uTime * .8)) * .55 + vn(vec2(rq.x * 1.4, rq.y * 5.6) + vec2(-uTime * .25, uTime * 1.5)) * .3 + vn(q * 1.3 + vec2(uTime * .35, -uTime * .5)) * .15);   // (but ripples still cross it: patches of sky slide over the sunk logs)
  float gateK = smoothstep(30., 70., length(q - uPortal.xz));
  float shelfW = smoothstep(96., 122., q.x + .12 * q.y) * (1. - smoothstep(mix(7., 12., gateK), mix(24., 44., gateK), dist));
  Ac = mix(Ac, max(F * mix(.4, .25, gateK), rpl * mix(.3, .16, gateK)), shelfW);
  float A = mix(Fg, Ac, calm);
  vec3 refl = mix(mix(skyG, mir, .18), mir, calm);
  float g1 = smoothstep(.5, .75, spark(q, 24.)) * (1. - smoothstep(10., 40., dist));
  float g2 = smoothstep(.5, .75, spark(q, 8.)) * smoothstep(8., 36., dist) * (1. - smoothstep(55., 150., dist));
  float g3 = smoothstep(.5, .75, spark(q, 2.6)) * smoothstep(50., 140., dist) * .6;
  float steep = smoothstep(.16, .5, V.y), sp = g1 * (1. - .7 * smoothstep(.1, .3, V.y)) + (g2 + g3) * (1. - .85 * steep), gl = gust * sp * (.02 + .34 * ov * ov * ov);
  float sr = max(dot(reflect(-V, N), uSun), 0.), s2 = sr * sr; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;
  // the glitter behind the gust is blue (the sky's, never a pale sheet); the sun's own is a narrow path under the sun
  float saz = max(dot(d, normalize(uSun.xz + vec2(1e-5, 0.))), 0.), sunPath = smoothstep(.955, .9985, saz);
  vec3 add = (uHor * .22 + uZen * 1.05 + uSunCol * .55 * (1. - uDayK)) * gl * (.62 + .38 * steep) + uSunCol * s2 * s2 * (.25 + gust * 2.5 * sp) * sunGateH(q) * (1. - .7 * gust * smoothstep(.12, .34, V.y)) * mix(1., .25 + .75 * sunPath, gust) * (1. - .7 * shelfW);   // (and the sun's image is no pale smear over the shelf's window)   // (looked down into, the window is not hidden behind the sun's glitter)
  float line = exp(-max(behind, 0.) / 9.) * smoothstep(-2., 1., behind) * (1. - heal) * (1. - lee);
  refl = mix(refl, uW3 * .3, line * .9); A = mix(A, .9, line * .85); add *= 1. - line * .9;
  // (round 12) at its outlet end the level water thins out over the last metre and a half: the mirror dissolves into the
  // sheet that breaks over the shoal's crest, it is not cut off by a line
  float endK = 1. - smoothstep(uEndZ - 1.6, uEndZ - .1, q.y); A *= endK; add *= endK;
  vec3 col = refl * A + add;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col = mix(col, fogColor * A, ff);
  #endif
  gl_FragColor = vec4(col, A);
}`;

// The image of the standing trunks in the water. No second render: every vertex of a trunk's twin is mirrored in the
// surface and then slid along the ray from the eye to that mirror point until it meets the water, so the image lies on the
// surface exactly where a true reflection would, with the right perspective from any height, hidden by whatever stands in
// front of it and never by the bed. Still water shows it whole; behind the gust it breaks into dashes across the view.
const REFL_VERT = /* glsl */`
#include <common>
attribute vec3 aCol; uniform float uTime;
varying vec3 vC, vS, vN; varying float vAb, vH;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  float hn = length(normal.xz);                                 // (held to two pixels far off, like the trunk it mirrors)
  float dcam = distance(wp.xyz, cameraPosition);
  wp.xz += normal.xz / max(hn, 1e-3) * (step(.35, hn) * max(0., dcam * .0042 - .4));
  float y = max(wp.y, 0.), cy = max(cameraPosition.y, .3), t = cy / (cy + y);
  vec3 S = cameraPosition + (vec3(wp.x, -y, wp.z) - cameraPosition) * t;
  float w = min(y, 16.) * .014 * (1. - .75 * smoothstep(50., 150., dcam));   // the image wanders more the higher the thing it mirrors; far off it holds still, a clean double
  S.x += w * sin(uTime * 1.3 + wp.z * .9 + y * 1.7); S.z += w * cos(uTime * 1.1 + wp.x * .8 + y * 1.3);
  S.y = .02;
  vAb = wp.y; vH = y; vS = S; vC = aCol; vN = mat3(modelMatrix) * normal;
  gl_Position = cameraPosition.y > .3 ? projectionMatrix * viewMatrix * vec4(S, 1.) : vec4(2., 2., 2., 1.);
}`;
const REFL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GL_COMMON}
${GL_GUST}
varying vec3 vC, vS, vN; varying float vAb, vH;
void main(){
  if (vAb < .02) discard;
  vec3 Vv = cameraPosition - vS; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  float behind, heal, lee, gust = gustAt(vS.xz, behind, heal, lee);
  float calm = 1. - gust;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float sd = dot(N, uSun), ndl = max(sd, 0.) * .75 + .25 * (sd * .5 + .5);
  vec3 col = vC * vec3(.66, .65, .63) * (uSunCol * ndl * sunGateH(vS.xz) + mix(uAmbH * .45, uAmbZ, N.y * .5 + .5) * uAmb * 1.7);
  col = mix(col, col * uW1 * 1.5, .3) * .92;                  // the water keeps a little of the light
  float ov = 1. - max(V.y, 0.), F = .02 + .98 * ov * ov * ov * ov * ov;
  float aC = max(F, .76 * smoothstep(4., 9., dist));
  vec2 rel = vS.xz - cameraPosition.xz; float rad = length(rel), acr = atan(rel.y, rel.x + 1e-5) * rad;
  float streak = smoothstep(.3, .62, vn(vec2(acr * .9, rad * 4.5 - uTime * 1.4)) * .7 + vn(vec2(acr * 2.3, rad * 11. + uTime * 2.)) * .3);
  float aG = (.1 + .62 * ov * ov * ov) * streak * exp(-vH * .05);
  float A = mix(aG, aC, calm) * smoothstep(.02, .3, vAb);
  if (A < .01) discard;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * dist * dist));
    #else
      col = mix(col, fogColor, smoothstep(fogNear, fogFar, dist));
    #endif
  #endif
  gl_FragColor = vec4(col * A, A);
}`;

// carp shoals: every fish rides its shoal's loop with a small lag, so the shoal turns as one
const GL_SHOAL = /* glsl */`
attribute vec4 aFish;    // shoal index, lag (m), side (m), up (m)
attribute vec2 aFish2;   // phase, length (m)
uniform vec4 uShoal[3];  // centre xyz, rotation
uniform vec4 uShoalR[3]; // half the loop's length (m), the trunk's slope along it (rise per metre), angular speed, y of the trunk's upper side at its middle
void fishFrame(out vec3 c, out vec3 tg, out vec3 nr, out float shY){
  int i = int(aFish.x + .5); vec4 S = uShoal[i], Q = uShoalR[i];
  // the loop is long and narrow (half a metre either side of the trunk's line) and tilted as the trunk is tilted, so the
  // shoal hangs over the wood from end to end and every fish's shadow falls on the trunk's upper side
  float th = uTime * Q.z + aFish.y / (.5 * (Q.x + .55)) + .25 * sin(uTime * .31 + aFish2.x) * aFish.z / Q.x, rise = Q.y * Q.x * cos(th);
  float cr = cos(S.w), sr = sin(S.w); vec2 e = vec2(Q.x * cos(th), .55 * sin(th)), t2 = normalize(vec2(-Q.x * sin(th), .55 * cos(th)));
  e = vec2(e.x * cr - e.y * sr, e.x * sr + e.y * cr); t2 = vec2(t2.x * cr - t2.y * sr, t2.x * sr + t2.y * cr);
  tg = vec3(t2.x, 0., t2.y); nr = vec3(-t2.y, 0., t2.x); shY = Q.w + rise;
  c = S.xyz + vec3(e.x, 0., e.y) + nr * aFish.z + vec3(0., rise + aFish.w + .12 * sin(uTime * .7 + aFish2.x * 3.), 0.);
  c.y = min(max(c.y, shY + .1), -.14);     // (never in the wood it hangs over, never out of the water)
}`;
const FISH_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime;
${GL_SHOAL}
varying vec3 vL, vN, vV; varying float vBelly;
void main(){
  vec3 c, tg, nr; float shY; fishFrame(c, tg, nr, shY);
  vec3 q = position; float tail = .5 - q.x;
  q.z += sin(uTime * 9. + aFish2.x * 6.28 - q.x * 5.) * .09 * tail * tail * 2.;
  vec3 p = c + aFish2.y * (tg * q.x + vec3(0., q.y, 0.) + nr * q.z);
  vN = tg * normal.x + vec3(0., normal.y, 0.) + nr * normal.z; vBelly = position.y; vL = p;
  if (p.y < 0.) p.y *= .75;
  vec4 wp = modelMatrix * vec4(p, 1.); vV = (cameraPosition - wp.xyz) * mat3(modelMatrix);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FISH_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GL_COMMON}
varying vec3 vL, vN, vV; varying float vBelly;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(vV + vec3(0., 1e-5, 0.));
  // (round 13: in the top half metre of water a carp's back is dark olive: a dark stroke over white wood, as the deep ones are once the water has taken their light)
  vec3 alb = mix(vec3(.78, .76, .66), mix(vec3(.3, .33, .27), vec3(.07, .085, .075), 1. - smoothstep(.45, .85, -vL.y)), smoothstep(-.02, .09, vBelly));
  vec3 col = alb * (uSunCol * max(dot(N, uSun), 0.) + mix(uAmbH * .45, uAmbZ, N.y * .5 + .5) * uAmb * 1.3);
  gl_FragColor = vec4(uwAbsorb(col, max(-vL.y, 0.), V.y), 1.);
  #include <fog_fragment>
}`;
// soft dark blobs multiplied onto the bed and the wood: fish (instanced, K_INST) and trunks (strips)
const SHADOW_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime; uniform vec3 uSunU;
varying vec2 vUv; varying float vStr;
#ifdef K_INST
${GL_SHOAL}
#else
attribute float aStr;
#endif
void main(){
  vec3 p = position; vUv = uv; vStr = 1.;
  #ifdef K_INST
    vec3 c, tg, nr; float shY; fishFrame(c, tg, nr, shY);
    c -= uSunU * (c.y - shY) / max(uSunU.y, .2);
    p = c + aFish2.y * (tg * position.x * 1.25 + nr * position.z * .6); vStr = .8;
  #else
    vStr = aStr;
  #endif
  if (p.y < 0.) p.y *= .75;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHADOW_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec2 vUv; varying float vStr;
void main(){
  vec2 q = vUv * 2. - 1.; float a = (1. - smoothstep(.25, 1., abs(q.y))) * (1. - smoothstep(.8, 1., abs(q.x))) * vStr;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      a *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      a *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(mix(vec3(1.), vec3(.4, .52, .6), a), 1.);
}`;
// floating leaves: instanced quads that ride the ripples and scud when the gust passes over them
const LEAF_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aLeaf;    // x, z, rotation, size
attribute vec2 aLeaf2;   // colour pick, phase
uniform float uTime, uFrontZ, uHealZ, uTilt;
varying vec2 vUv; varying float vPick;
void main(){
  vec2 c = aLeaf.xy; float ph = aLeaf2.y * 6.28;
  float push = smoothstep(0., 40., uFrontZ + uTilt * c.x - c.y) * smoothstep(-40., 60., c.y - uHealZ + 90.);
  c += vec2(sin(uTime * .05 + ph), cos(uTime * .043 + ph * 1.7)) * .7 + vec2(-.3, 1.) * (4.5 + 3. * aLeaf2.x) * push;
  float rot = aLeaf.z + uTime * .03 * (aLeaf2.x - .5) + push * 2.5 * (aLeaf2.y - .5), cr = cos(rot), sr = sin(rot);
  vec4 wp0 = modelMatrix * vec4(c.x, 0., c.y, 1.);
  float dc = distance(cameraPosition, wp0.xyz), sz = aLeaf.w * min(1. + dc * .012, .3 + dc * .06);   // (under the lens a leaf is a leaf: a hand's breadth, not a plate)
  vec2 o = vec2(position.x * cr - position.z * sr, position.x * sr + position.z * cr) * sz;
  vec3 p = vec3(c.x + o.x, .015 + .012 * sin(uTime * 1.3 + ph * 5.) + position.y * sz, c.y + o.y);
  vUv = uv; vPick = aLeaf2.x;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LEAF_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSun, uSunCol, uAmbZ; uniform float uAmb; uniform vec3 uGold, uScar, uGreen;
varying vec2 vUv; varying float vPick;
void main(){
  vec2 q = vUv * 2. - 1.; float r = length(q), an = atan(q.y, q.x + 1e-5), ca = cos(an);
  // a maple leaf (five pointed lobes, the middle one longest) or a birch leaf (an oval drawn out to a point), each with a stalk
  float mp = abs(cos(an * 2.5)), maple = (.3 + .68 * mp * mp * mp) * (.62 + .38 * smoothstep(-1., .6, ca));
  float birch = .5 * (1. - .16 * ca) / max(.52, sqrt(max(1. - .72 * ca * ca, .05))) * (1. + .42 * smoothstep(.75, 1., ca));
  float lobe = mix(maple, min(birch, .98), step(.55, vPick)), stalk = step(abs(q.y), .045) * step(q.x, 0.) * step(-.95, q.x);
  if (r > lobe && stalk < .5) discard;
  vec3 alb = vPick < .3 ? uScar : (vPick < .82 ? uGold : uGreen);
  alb *= (.75 + .5 * fract(vPick * 7.3)) * (.72 + .28 * smoothstep(.0, .09, abs(q.y))) * (.8 + .3 * smoothstep(.2, 1., r / max(lobe, .05)) * step(.5, fract(vPick * 3.7)));   // a dark midrib; some curl pale at the edge
  gl_FragColor = vec4(alb * (uSunCol * (uSun.y * .8 + .25) + uAmbZ * uAmb), 1.);
  #include <fog_fragment>
}`;
// the inflow: a still pool behind the sill, a lip of white lace in threads, foam at its foot
const SPILL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec2 vUv; varying vec3 vV;
void main(){
  vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vV = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SPILL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GL_COMMON}
varying vec2 vUv; varying vec3 vV;   // uv.x = metres across the sill, uv.y = metres along (pool > 0, lip ~0, lake < 0)
void main(){
  float ac = vUv.x, al = vUv.y; vec3 V = normalize(vV + vec3(0., 1e-5, 0.));
  float thread = smoothstep(.16, .42, vn(vec2(ac * .7, 3.3)) + .25 * vn(vec2(ac * 2.6, 8.)));
  float lip = 1. - smoothstep(.1, .9, al), foot = smoothstep(-1.3, -1.9, al);
  float lace = vn(vec2(ac * 5., al * 2.2 + uTime * 3.4)) * .6 + vn(vec2(ac * 13., al * 5. + uTime * 5.5)) * .4;
  float w = lip * (1. - foot) * thread * smoothstep(.2, .55, lace + .3 * thread);
  float foam = foot * (1. - smoothstep(-4.2, -2., al) * 0. ) * smoothstep(-4.6, -2.2, al) * smoothstep(.35, .7, vn(vec2(ac * 2.3 + uTime * .2, al * 2.3 - uTime * .9)) + .3 * thread);
  float ov = 1. - max(V.y, 0.), fr = .04 + .7 * ov * ov * ov;
  float flow = vn(vec2(ac * 1.3, al * .5 + uTime * .45));
  // (round 11: the pool behind the sill lies in the shade of the spruces behind the gate and carries their dark image, the
  // sky only in slips along its ripples: never one flat pale band under the ring)
  float slip = smoothstep(.4, .72, vn(vec2(ac * .55 + uTime * .08, al * 5.5 + uTime * .35)) * .65 + vn(vec2(ac * 1.7 - uTime * .1, al * 13. - uTime * .5)) * .35);
  vec3 pool = mix(uW1 * .5, mix(uHor, uZen, .45) * mix(.34, .82, slip), fr) * (.85 + .3 * flow);
  float edge = 1. - smoothstep(17., 21., abs(ac));
  float ap = (1. - lip) * (.45 + .45 * fr) * edge;
  vec3 white = (uSunCol * (.5 + .5 * uSun.y) + uAmbZ * uAmb) * 1.4;
  float a = clamp(ap + w + foam * .8, 0., 1.) * edge;
  vec3 col = mix(pool, white, clamp((w + foam * .8) / max(a, 1e-3), 0., 1.));
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------- build ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('peacock-lake') : ctx.rng, noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map(hex);
  const [P0, P1, P2, P3, P4, P5, P6] = pal;
  const hour = HOURS[opts.hour] || HOURS.morning, season = opts.season || 'peak';
  const tint = opts.tint || (season === 'june' ? 'emerald' : rng.pick(['peacock', 'peacock', 'emerald', 'patched']));
  const density = clamp(opts.density ?? 0.6, 0, 1);
  const sunDir = new THREE.Vector3(...(opts.sunDir || [-0.877, 0.469, 0.108])).normalize();
  const sunCol = hex(opts.sunColor || hour.sun).multiplyScalar((opts.sunIntensity ?? hour.sunI) / Math.PI);
  const sunH = Math.hypot(sunDir.x, sunDir.z) || 1e-4, sT = sunH / 1.33, sunU = new THREE.Vector3(sunDir.x / sunH * sT, Math.sqrt(1 - sT * sT), sunDir.z / sunH * sT);
  const zen = hex(opts.skyColor || hour.zen), hor = hex(opts.horizonColor || hour.hor);
  const sk = { treeHeight: 19, slopeTan: 0.62, axisTan: 0.1, peakTan: 0.27, peakWidth: 0.2, ...(opts.skyline || {}) };
  const gustU = opts.gustU ?? 0.37, healU = opts.healU ?? 0.8;
  const mixc = (a, b, t) => a.clone().lerp(b, t);
  const W1 = P2.clone(), W2 = P0.clone(), W3 = P1.clone();
  if (tint === 'emerald') { W1.offsetHSL(-0.035, 0, 0.02); W2.offsetHSL(-0.07, 0, 0); W3.offsetHSL(-0.05, 0, 0); }
  if (tint === 'patched') { W2.offsetHSL(0.035, 0, 0); W3.offsetHSL(0.03, 0, 0); }
  const green = season === 'june' ? hex('#4F8A2E') : mixc(P4, hex('#7FA02C'), 0.6);
  const gold = season === 'june' ? hex('#6FA23A') : P4, scar = season === 'june' ? hex('#D77FA0') : P6;
  const moss = mixc(P5, hex('#8FA32B'), 0.62), algae = mixc(P4, hex('#5F8F3A'), 0.55).multiplyScalar(0.7);
  const shared = {
    uTime: { value: 0 }, uSun: { value: sunDir }, uSunU: { value: sunU }, uSunCol: { value: sunCol }, uZen: { value: zen }, uHor: { value: hor },
    uAmbZ: { value: opts.ambientSky ? hex(opts.ambientSky) : zen }, uAmbH: { value: opts.ambientHorizon ? hex(opts.ambientHorizon) : hor }, uDayK: { value: opts.dayK ?? (opts.hour === 'night' ? 0.2 : 1) }, uMoon: { value: opts.hour === 'night' ? 1 : 0 },
    uAmb: { value: (opts.ambient ?? hour.amb) / Math.PI * 1.6 }, uSnow: { value: opts.snow ?? (season === 'snow' ? 1 : 0) }, uScat: { value: opts.scatter ?? (hour.sunI * 0.22 + hour.amb * 0.5) * 0.75 },
    uW1: { value: W1 }, uW2: { value: W2 }, uW3: { value: W3 },
    uBone: { value: P3 }, uGold: { value: gold }, uScar: { value: scar }, uSpruce: { value: P5 }, uGreen: { value: green },
    uAmber: { value: mixc(P4, P6, 0.25).multiplyScalar(tint === 'patched' ? 0.75 : 0.5) }, uJade: { value: mixc(P2, P5, 0.5).multiplyScalar(tint === 'patched' ? 1.0 : 0.75) },
    uMoss: { value: moss }, uAlgae: { value: algae },
    uFrontZ: { value: 0 }, uHealZ: { value: -400 }, uTilt: { value: rng.range(0.12, 0.34) * rng.sign() }, uLee: { value: new THREE.Vector3(-62, -4, 1) }, uLeeR: { value: new THREE.Vector2(66, 80) },
    uGate: { value: new THREE.Vector4(...(opts.shaft ? [opts.shaft.perp[0], opts.shaft.perp[1], opts.shaft.offset, opts.shaft.half] : [1, 0, 0, 0])) },
    uOutFill: { value: new THREE.Color(...(opts.outletFill || [0, 0, 0])) },
    uGateK: { value: new THREE.Vector2(opts.shaft ? opts.shaft.out : 1, opts.shaft ? opts.shaft.in : 1) }, uLowT: { value: opts.lowSun ?? 1 }, uPaleK: { value: opts.paleK ?? 0.8 }, uIsle: { value: new THREE.Vector4(...(opts.isleRock || [0.7, 0.8, 1.3, 1])) }, uSlopeFill: { value: new THREE.Color(...(opts.slopeFill || [0, 0, 0])) },
  };
  const mk = (vs, fs, defines = {}, extra = {}, params = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...extra }, vertexShader: vs, fragmentShader: fs, defines, fog: true, ...params });
  await ctx.yield();
  const root = new THREE.Group(); root.name = 'peacock-lake';
  const add = (mesh, order = 0) => { mesh.frustumCulled = false; mesh.renderOrder = order; root.add(mesh); return mesh; };
  const field = makeLakeField(noise, rng.range(0.75, 1.15)), path = lakePath(), flyPath = path;   // (the line flown is the line the lake is placed against: 11.5 m at the top of the turn)
  await ctx.yield();

  // --- bed, shelf, sill and the bank apron: one grid ---
  const X0 = -205, X1 = 295, Z0 = -230, Z1 = opts.zMax ?? 295, NX = 120, NZ = Math.round((Z1 - Z0) / 4.1667), cx = (X1 - X0) / NX, cz = (Z1 - Z0) / NZ;
  const gy = new Float32Array((NX + 1) * (NZ + 1)), gs = new Float32Array((NX + 1) * (NZ + 1));
  const bp = new Float32Array((NX + 1) * (NZ + 1) * 3), bc = new Float32Array((NX + 1) * (NZ + 1) * 3);
  const cTrav = P3.clone().multiplyScalar(0.8), cMoss = moss.clone().multiplyScalar(0.8), cSoil = mixc(P5, P4, 0.3).multiplyScalar(0.7), tmpC = new THREE.Color();
  for (let j = 0; j <= NZ; j++) {
    for (let i = 0; i <= NX; i++) {
      const k = j * (NX + 1) + i, x = X0 + i * cx, z = Z0 + j * cz, y = field.bedAt(x, z);
      gy[k] = y; gs[k] = field.sdf(x, z); bp[k * 3] = x; bp[k * 3 + 1] = y; bp[k * 3 + 2] = z;
      const m = smoothstep(0.1, 0.7, y + 0.3 * noise.n2(x * 0.09, z * 0.09)), s2 = smoothstep(1.2, 3.2, y + 0.8 * noise.n2(x * 0.05 + 5, z * 0.05));
      tmpC.copy(cTrav).lerp(cMoss, m).lerp(cSoil, s2);
      bc[k * 3] = tmpC.r; bc[k * 3 + 1] = tmpC.g; bc[k * 3 + 2] = tmpC.b;
    }
    if ((j & 1) === 0) await ctx.yield();
  }
  await ctx.yield();
  const bi = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
    bi.push(a, c, b, b, c, d);
  }
  await ctx.yield();
  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bedGeo.setAttribute('aCol', new THREE.BufferAttribute(bc, 3));
  bedGeo.setAttribute('aFlex', new THREE.BufferAttribute(new Float32Array((NX + 1) * (NZ + 1)), 1));
  bedGeo.setIndex(bi); await ctx.yield(); await normalsInSteps(bedGeo, ctx.yield); await ctx.yield();
  const bedMesh = add(new THREE.Mesh(bedGeo, mk(UW_VERT, UW_FRAG, { K_BED: 1 })));
  const bedGrid = (x, z) => {
    const fx = clamp((x - X0) / cx, 0, NX - 1e-3), fz = clamp((z - Z0) / cz, 0, NZ - 1e-3), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * (NX + 1) + i;
    return lerp(lerp(gy[k], gy[k + 1], u), lerp(gy[k + NX + 1], gy[k + NX + 2], u), v);
  };
  await ctx.yield();

  // --- the fallen forest ---
  // (rr: the random stream a trunk is dealt from, the lake's own unless the family has one; o.nStubs: a number of snapped
  // limbs asked for outright)
  const wood = makeAcc(), trunks = [], emergent = [], boneRGB = (rr = rng) => { const k = rr.range(0.88, 1.04), w = rr.range(-0.03, 0.03); return [P3.r * k + w, P3.g * k, P3.b * k - w * 1.5]; };
  const lying = (cxx, czz, yaw, L, r0, o = {}, rr = rng) => {
    const dx = Math.cos(yaw), dz = Math.sin(yaw), ax = cxx - dx * L / 2, az = czz - dz * L / 2, bx = cxx + dx * L / 2, bz = czz + dz * L / 2;
    if (field.sdf(ax, az) > -1.5 || field.sdf(bx, bz) > -1.5) return null;
    const ya = o.buttY ?? (bedGrid(ax, az) + r0 * (o.near ? 1.25 : 1.1)), yb = o.topY ?? (bedGrid(bx, bz) + r0 * 0.45 + (o.prop || 0));
    const len = Math.hypot(L, yb - ya);
    return { x: ax, y: ya, z: az, ax: (bx - ax) / len, ay: (yb - ya) / len, az: (bz - az) / len, L: len, r0, near: !!o.near, flare: o.near ? 1.0 : 0.85,
      nRoots: o.near ? rr.int(7, 9) : 5, nStubs: o.nStubs ?? (o.near ? rr.int(9, 13) : rr.int(6, 10)), stubLen: [0.7, 3.0], stubLift: 0.45, bone: boneRGB(rr) };
  };
  // (every trunk that is dealt is built: `rs` is the stream it was dealt from, from which its garden and weed are dealt too)
  const commit = (o, rr = rng) => { const s = addTrunk(wood, rr, noise, o); trunks.push({ o, s, rs: rr }); return s; };
  const tryPlace = (gen, tries = 40, rr = rng) => { for (let t = 0; t < tries; t++) { const o = gen(); if (o && trunkClear(o, path, 7.5, -0.4)) return commit(o, rr); } return null; };
  // (the tangle: seventeen trunks at the middle density, fifteen to nineteen)
  const N = Math.round(45 + 25 * density), nShelf = Math.round(N * 0.24), nLean = 5, nMargin = Math.round(N * 0.14), nTangle = Math.round(15 + 4 * density), nPass = 9;
  // THE PHEASANT'S LOG (round 12: set from the journey's own beat, "at u 0.885 the pheasant on his log 7 m to the right").
  // The journey's u is the fraction of the whole line flown: the world's approach (opts.approach: the points it flies before
  // the lake; none when the piece is shown alone) and then this lake path, made into one line exactly as the world makes it.
  //   J  = that line's point at u 0.885, T its heading there (level), right = T turned a quarter turn clockwise (-T.z, T.x)
  //   he stands at J + 7 m * right
  //   the log runs away from the path: along `right` swung 15 degrees toward the heading, so that from the whole approach
  //   along the shelf it is seen side-on, ahead and to the right, with open water behind him; its thin end lies 2.1 m nearer
  //   the path than he stands (5 m off: abeam it leaves the frame by its right edge, whole), its root plate 16.5 m out, awash.
  // (PB is the log's own origin, 1.22 m down the log from his feet; the lines after it are the log as it always was built.)
  const journey = makePath((opts.approach || []).map((q) => [q[0], q[1], q[2]]).concat(path)), J885 = journey.pointAt(0.885), T885 = journey.tangentAt(0.885);
  await ctx.yield();
  const tl885 = Math.hypot(T885.x, T885.z) || 1, fwd = [T885.x / tl885, T885.z / tl885], rgt = [-fwd[1], fwd[0]], ca15 = Math.cos(0.2618), sa15 = Math.sin(0.2618);
  const pDir = [rgt[0] * ca15 + fwd[0] * sa15, rgt[1] * ca15 + fwd[1] * sa15], birdAt = [J885.x + rgt[0] * 7, J885.z + rgt[1] * 7], PB = [birdAt[0] - pDir[0] * 1.22, birdAt[1] - pDir[1] * 1.22];
  // (What the log gives to later deals, its saplings' places in `emergent`, which seed leaf rafts, is reckoned where the log
  // lies: its rafts are dealt beside it and each leaf is tested for water where it floats.)
  const pO = { ...lying(PB[0] + pDir[0] * 5.1, PB[1] + pDir[1] * 5.1, Math.atan2(-pDir[1], -pDir[0]), 12, 0.5, { near: true, buttY: -0.02, topY: 0.24 }), nStubs: 5 };
  const pLog = commit(pO);
  await ctx.yield();
  let pIdx2 = 0; { const qx = PB[0] + pDir[0] * 1.22, qz = PB[1] + pDir[1] * 1.22; for (let i = 0; i < pLog.length; i++) if (Math.hypot(pLog[i].x - qx, pLog[i].z - qz) < Math.hypot(pLog[pIdx2].x - qx, pLog[pIdx2].z - qz)) pIdx2 = i; }
  pIdx2 = clamp(pIdx2, 2, pLog.length - 2); pO.perch = pIdx2;   // where he stands: from the sample before it (toward the butt) to the thin end the seeded garden grows nothing (see gardenOn)
  // the tangle: under the top of the turn and the start of pass two, stout trunks lying on each other
  // (round 12) THE FELLED FOREST IS SIXTY TRUNKS, bone white and solid. Each keeps six snapped limbs (asked for: nStubs 6),
  // stout (two thirds of the trunk's girth where they leave it) and 0.6-1.9 m long with a broken end: from 11 m up a
  // trunk is a trunk with its limbs' stumps and its root plate, not a spar bristling with needles. (stubLen is the limbs'
  // reach before they snapped: stubK is what is left of it, and the clearance test still allows for the whole reach.)
  const fat = (o, lift) => { if (!o) return o; o.y += lift; o.stubLen = [1.4, 4.6]; o.stubFat = 1.9; o.stubK = 0.42; o.blunt = true; return o; };
  // Under the turn and pass two the count is: the tangle (15-19, dealt here from its own stream, 'peacock-tangle': by
  // turns one under the top of the turn and one under the start of pass two), the islet's nine, the raft's two layers
  // (20) and the turn's layer (11): 55 to 59. Every one of them is built; none is dealt that is not laid.
  const tg = makeRng(hashSeed('peacock-tangle:' + (ctx.seed ?? 0)));
  for (let i = 0; i < nTangle; i++) {
    tryPlace(() => {
      const second = i % 2 === 1;
      const x = (second ? 42 : -10) + tg.gauss() * (second ? 22 : 24), z = (second ? -12 : -36) + tg.gauss() * (second ? 13 : 17); if (field.sdf(x, z) > -16 || x + 0.12 * z > 82) return null;
      const o = lying(x, z, tg() * 6.283, tg.range(16, 30), tg.range(0.5, 0.78), { prop: tg.chance(0.4) ? tg.range(0.6, 2.6) : 0, nStubs: 6 }, tg);
      return o && fat(o, tg.chance(0.3) ? tg.range(0.8, 2.4) : 0);
    }, 40, tg);
    await ctx.yield();
  }
  for (let i = 0; i < nPass; i++) {                             // and a few on the bed either side of pass one, for the window opening at the nose
    tryPlace(() => {
      const z = 28 + (i + rng()) * 19, x = -100 + rng.sign() * rng.range(7, 34); if (field.sdf(x, z) > -14) return null;
      return fat(lying(x, z, rng() * 6.283, rng.range(14, 26), rng.range(0.45, 0.66), { prop: rng.chance(0.4) ? rng.range(0.5, 2) : 0, nStubs: 6 }), 0);
    });
    await ctx.yield();
  }
  await ctx.yield();
  let nearLeft = 9;
  for (let i = 0; i < nShelf; i++) {
    const up = i < 7;                                           // these lift their root plates out of the water
    const gen = () => {
      const x = rng.range(95, 225), z = rng.range(-165, 25), s = field.sdf(x, z); if (x + 0.12 * z < 100 || s > -7) return null;
      const dp = distToPath(path, x, z), near = nearLeft > 0 && dp < 22, L = rng.range(14, 24), r0 = rng.range(0.32, 0.5), yaw = rng() * 6.283;
      const o = lying(x, z, yaw, L, r0, { near, buttY: up ? rng.range(-0.45, 0.1) : undefined, prop: rng.chance(0.3) ? rng.range(0.3, 0.9) : 0 });
      if (o && near && trunkClear(o, path, 7.5, -0.4)) nearLeft--;
      return o;
    };
    for (let a = 0, s = null; a < 6 && !s; a++) { s = tryPlace(gen, 10); await ctx.yield(); }   // (the same sixty tries, ten at a time: the page gets its frames while a place is looked for)
  }
  for (let i = 0; i < nLean; i++) {                             // leaners whose tips break the surface beside pass one
    tryPlace(() => {
      const side = rng.sign(), z = 196 - i * 36 + rng.range(-10, 10), x = -100 + side * rng.range(9.5, 15), L = rng.range(25, 30), r0 = rng.range(0.36, 0.45);
      const yaw = (rng.chance(0.5) ? 1.5708 : -1.5708) + rng.range(-0.3, 0.3), hz = Math.cos(Math.asin(clamp(17 / L, 0, 0.9))) * L;
      const bx = x - Math.cos(yaw) * hz, bz = z - Math.sin(yaw) * hz; if (field.sdf(bx, bz) > -20) return null;
      return lying((x + bx) / 2, (z + bz) / 2, yaw, hz, r0, { topY: rng.range(0.5, 1.7) });
    }, 60);
    await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < nMargin; i++) {
    await ctx.yield();
    tryPlace(() => {
      const x = rng.range(-140, 230), z = rng.range(-165, 228), s = field.sdf(x, z); if (s > -6 || s < -34) return null;
      return lying(x, z, rng() * 6.283, rng.range(14, 26), rng.range(0.3, 0.48), { buttY: rng.chance(0.3) ? rng.range(-0.4, 0.1) : undefined });
    });
  }
  await ctx.yield();

  // --- gate snags and the logs jammed on the sill ---
  const gateBase = [1, -1].map((sgn) => [PORTAL[0] - HEAD[0] * 11 + PERP[0] * 7.8 * sgn, PORTAL[2] - HEAD[1] * 11 + PERP[1] * 7.8 * sgn]);
  // The gate: two dead bleached spruces. Each keeps a dozen broken boughs that sag from its upper half (drawn as curved,
  // tapering limbs with snapped twigs, 1.4-3.2 m long), a broken second leader forking off at 9 m, and one stout bough on
  // its inner side at 7 m for a mandarin to stand on. They are built from their own random stream; the seeded stream is
  // advanced exactly as the plain poles they replace advanced it, so nothing else in the lake moves.
  const xg = makeRng(hashSeed('peacock-gate:' + (ctx.seed ?? 0))), gatePerch = [], gateFork = [];
  const bough = (s, hy, ang, len, rb, bone, twigs = 2) => {
    let q = s[0]; for (const e of s) if (Math.abs(e.y - hy) < Math.abs(q.y - hy)) q = e;
    const dx = Math.cos(ang), dz = Math.sin(ang), px = -dz, pz = dx, x0 = q.x + dx * q.r * 0.55, z0 = q.z + dz * q.r * 0.55;
    const droop = xg.range(0.3, 0.55) * len, lift = xg.range(0.08, 0.3) * len, sw = xg.range(-0.25, 0.25) * len, kc = xg.range(0.8, 0.98), c = [0, 0, 0];
    const cen = (t, out) => { out[0] = x0 + dx * len * t + px * sw * t * t; out[1] = q.y - droop * Math.sin(t * 2.36) + lift * t * t * t; out[2] = z0 + dz * len * t + pz * sw * t * t; return out; };
    const rAt = (t) => rb * (1 - 0.78 * t) + 0.018, nR = 6, nS = 5;
    loft(wood, nR, nS, (r, sI, out) => {
      const t = r / (nR - 1), a = (sI / nS) * 6.2832, ra = rAt(t) * (1 + 0.18 * Math.sin(a * 2 + r)); cen(t, c);
      out[0] = c[0] + px * Math.cos(a) * ra; out[1] = c[1] + Math.sin(a) * ra; out[2] = c[2] + pz * Math.cos(a) * ra;
    }, (r, sI, out) => { const k = kc * (0.86 + 0.14 * ((r * 3 + sI) % 2)); out[0] = bone[0] * k; out[1] = bone[1] * k; out[2] = bone[2] * k; }, null, null, cen(1.04, [0, 0, 0]));
    for (let w = 0; w < twigs; w++) {                            // snapped twigs: short spikes off the limb, most of them hanging
      const t = xg.range(0.3, 0.85), b = cen(t, [0, 0, 0]), tl = xg.range(0.35, 0.9) * (1 - 0.4 * t), side = xg.sign(), down = xg.range(-0.9, 0.25), fw = xg.range(0.1, 0.6), tr = rAt(t) * 0.6;
      const ex = px * side * 0.7 + dx * fw, ey = down, ez = pz * side * 0.7 + dz * fw, el = Math.hypot(ex, ey, ez), tip = [b[0] + ex / el * tl, b[1] + ey / el * tl, b[2] + ez / el * tl];
      loft(wood, 2, 3, (r, sI, out) => { const a = (sI / 3) * 6.2832, ra = tr * (r ? 0.5 : 1), m = r * 0.55; out[0] = b[0] + (tip[0] - b[0]) * m + dx * Math.cos(a) * ra; out[1] = b[1] + (tip[1] - b[1]) * m + Math.sin(a) * ra; out[2] = b[2] + (tip[2] - b[2]) * m + dz * Math.cos(a) * ra; },
        (r, sI, out) => { out[0] = bone[0] * kc * 0.9; out[1] = bone[1] * kc * 0.9; out[2] = bone[2] * kc * 0.9; }, null, null, tip);
    }
    const m = cen(0.42, [0, 0, 0]); m[1] += rAt(0.42); return m;
  };
  const snags = [];
  for (let k = 0; k < gateBase.length; k++) {                    // (one snag, then the page gets a frame)
    const [gx, gz] = gateBase[k];
    const y0 = bedGrid(gx, gz) - 0.3, lx = rng.range(-0.035, 0.035), lz = rng.range(-0.035, 0.035), ll = Math.hypot(lx, 1, lz), L = (16 + rng.range(-0.8, 1.2) - y0) * ll;
    const o0 = { x: gx, y: y0, z: gz, ax: lx / ll, ay: 1 / ll, az: lz / ll, L, r0: 0.62 + 0.06 * k, near: true, flare: 0.9, nRoots: 6, nStubs: 30, stubLen: [0.5, 1.4], stubLift: -0.32, bone: boneRGB() };
    addTrunk(makeAcc(), rng, noise, o0);                        // (the plain pole: only its random draws are kept)
    const o = { ...o0, nStubs: 8, stubLen: [0.5, 1.3], stubFat: 1.3 }, s = addTrunk(wood, xg, noise, o), sgn = k === 0 ? 1 : -1;
    const inA = Math.atan2(-PERP[1] * sgn * 0.8 - HEAD[1] * 0.6, -PERP[0] * sgn * 0.8 - HEAD[0] * 0.6), outA = Math.atan2(PERP[1] * sgn, PERP[0] * sgn);
    gatePerch.push(bough(s, 7.0 + 0.5 * k, inA, 2.05, 0.26, o.bone, 1));
    for (let b = 0; b < 11; b++) {
      const f = b / 10, hy = 7.6 + 7.4 * f + xg.range(-0.3, 0.3);
      let ang = b * 2.4 + xg.range(-0.5, 0.5) + k;                // golden-angle spiral, kept off the line to the portal on the inner side
      const inward = Math.cos(ang - Math.atan2(-PERP[1] * sgn, -PERP[0] * sgn));
      bough(s, hy, ang, lerp(3.2, 1.4, f) * xg.range(0.8, 1.1) * (inward > 0.3 ? 0.55 : 1), lerp(0.24, 0.13, f), o.bone, f < 0.7 ? 2 : 1);
    }
    // the broken second leader: forks off outward at about 9 m
    let q = s[0]; for (const e of s) if (Math.abs(e.y - 9.2) < Math.abs(q.y - 9.2)) q = e;
    const tx = Math.cos(outA) * 0.45 - HEAD[0] * 0.12, tz = Math.sin(outA) * 0.45 - HEAD[1] * 0.12, tl = Math.hypot(tx, 1, tz);
    const fo = { x: q.x + Math.cos(outA) * q.r * 0.35, y: q.y - 0.5, z: q.z + Math.sin(outA) * q.r * 0.35, ax: tx / tl, ay: 1 / tl, az: tz / tl, L: xg.range(4.4, 5.6), r0: q.r * 0.62, near: true, flare: 0.3, nRoots: 0, nStubs: 4, stubLen: [0.5, 1.2], stubFat: 1.3, stubLift: -0.3, bone: o.bone, sides: 7, rings: 9, bend: 1.6 };
    addTrunk(wood, xg, noise, fo);
    gateFork.push([q.x + Math.cos(outA) * (q.r * 0.9 + 0.12), q.y + 0.25, q.z + Math.sin(outA) * (q.r * 0.9 + 0.12), outA]);
    snags.push({ o, s }); await ctx.yield();
  }
  await ctx.yield();
  const perpYaw = Math.atan2(PERP[1], PERP[0]), sillLogs = [];
  for (let i = 0; i < 8; i++) {
    const sgn = i % 2 ? 1 : -1, acr = sgn * rng.range(12.8, 21), alo = rng.range(-1.0, 0.5), L = rng.range(4.5, 7.5), r0 = rng.range(0.2, 0.3), yaw = perpYaw + rng.range(-0.45, 0.45) + (rng.chance(0.5) ? Math.PI : 0);
    const cxx = field.SX + PERP[0] * acr + HEAD[0] * alo, czz = field.SZ + PERP[1] * acr + HEAD[1] * alo, cy = rng.range(0.55, 0.8) + (i > 5 ? 0.35 : 0), pit = rng.range(-0.06, 0.06);
    const o = { x: cxx - Math.cos(yaw) * L / 2, y: cy - pit * L / 2, z: czz - Math.sin(yaw) * L / 2, ax: Math.cos(yaw) * Math.cos(pit), ay: Math.sin(pit), az: Math.sin(yaw) * Math.cos(pit), L, r0, near: false, flare: 0.7, nRoots: i % 3 === 0 ? 5 : 0, nStubs: rng.int(2, 5), stubLen: [0.2, 0.8], stubLift: 0.4, bone: boneRGB() };
    sillLogs.push({ o, s: addTrunk(wood, rng, noise, o) });
  }
  await ctx.yield();
  // THE JAM on the sill (own stream): eight big crusted trunks, 7-11 m long and 0.6-0.85 m through, hung up on the crest
  // either side of the spill, lying across one another, three of them tipped up on the logs under them. Nothing nearer the
  // gate's axis than 8 m. The first lies level 14.5 m to the right.
  const xj = makeRng(hashSeed('peacock-jam:' + (ctx.seed ?? 0))), sillJam = [];
  for (const [acr, alo, L, r0, dyaw, cy, pit, roots] of [[14.5, -1.2, 9, 0.38, 0.15, 1.0, 0.03, 0], [10.6, -2.2, 8, 0.34, 0.9, 1.15, 0.16, 5], [-13.5, -1.5, 10, 0.4, -0.25, 0.95, -0.02, 0], [-15.5, -2.6, 8.5, 0.33, 1.1, 1.3, -0.2, 5],
    [-19, -0.6, 7.5, 0.36, 3.44, 1.3, 0.05, 0], [19.5, -0.5, 8, 0.35, -0.5, 1.25, -0.08, 0], [17, -3.4, 11, 0.42, 0.5, 0.85, 0.12, 6], [-9.3, -3.2, 7, 0.3, 1.35, 1.0, -0.22, 0]]) {
    const yaw = perpYaw + dyaw + xj.range(-0.06, 0.06), k = xj.range(0.9, 1.04), w = xj.range(-0.03, 0.03), cxx = field.SX + PERP[0] * acr + HEAD[0] * alo, czz = field.SZ + PERP[1] * acr + HEAD[1] * alo;
    const o = { x: cxx - Math.cos(yaw) * Math.cos(pit) * L / 2, y: cy - Math.sin(pit) * L / 2, z: czz - Math.sin(yaw) * Math.cos(pit) * L / 2, ax: Math.cos(yaw) * Math.cos(pit), ay: Math.sin(pit), az: Math.sin(yaw) * Math.cos(pit), L, r0, near: false, flare: 0.8,
      nRoots: roots, nStubs: xj.int(4, 7), stubLen: [0.3, 1.1], stubLift: 0.4, stubFat: 1.3, bone: [P3.r * k + w, P3.g * k, P3.b * k - w * 1.5], crust: true, sides: 9, rings: 12, taper: 0.7, bend: 0.4 };
    sillJam.push({ o, s: addTrunk(wood, xj, noise, o), cx: cxx, cy: cy + r0 * 0.95, cz: czz });
    if (sillJam.length % 3 === 0) await ctx.yield();
  }
  await ctx.yield();

  // --- trunks laid on purpose (own random stream, so the seeded forest above is untouched): a jam of logs hung up under the
  // nose on pass one, and the shelf skim, where bone-white trunks cross 0.7-1.3 m under the water all the way from the
  // foot of the arc to the gate, three of them lifting their root plates out as gardens 9-11 m off the path ---
  const xr = makeRng(hashSeed('peacock-laid:' + (ctx.seed ?? 0))), extra = []; let xl = xr, ownK = false;
  const ceilAt = (x, z) => (distToPath(path, x, z, 9) < 7.8 ? -0.3 : 9);
  const laid = (b, t, r0, o = {}) => {
    const L = Math.hypot(t[0] - b[0], t[1] - b[1], t[2] - b[2]), k = xl.range(0.9, 1.05), w = xl.range(-0.03, 0.03);
    const tr = { x: b[0], y: b[1], z: b[2], ax: (t[0] - b[0]) / L, ay: (t[1] - b[1]) / L, az: (t[2] - b[2]) / L, L, r0, near: !!o.near, flare: o.near ? 1.0 : 0.85, nRoots: o.near ? xl.int(6, 8) : 5,
      nStubs: o.nStubs ?? xl.int(8, 11), stubLen: o.stubLen || [0.7, 2.4], stubLift: 0.45, stubFat: o.stubFat ?? (o.near ? undefined : 1.4), bone: [P3.r * k + w, P3.g * k, P3.b * k - w * 1.5],
      bend: 0.3, rootLen: o.rootLen ?? 0.6, ceilAt, sap: !!o.sap, sapK: o.sapK, sides: o.near ? 12 : 7, rings: o.near ? 22 : 9, crust: !!o.near, taper: o.near ? 0.7 : 0.6, garden: o.garden, own: ownK,
      stubK: o.stubK, blunt: o.blunt };
    extra.push({ o: tr, s: addTrunk(wood, xl, noise, tr) });
  };
  const FELL = { nStubs: 6, stubK: 0.45, stubFat: 1.9, blunt: true };   // a trunk of the felled forest (see `fat` above): six stout stumps of limbs
  // the jam under pass one (the path runs along x = -100 toward -Z; the camera of u 0.40 is at z = 129)
  const J = (dx, y, z) => [-100 + dx, y, z];
  // (round 11) A RULE IN WORLD COORDINATES for pass one (x = -100, z 225 .. 0): no laid trunk shallower than 6 m comes within
  // 6.2 m of the line. The shallow ones lie along it on either side, butt toward the lens and top running away, so each
  // leaves the frame by its side and none is cut off large by its bottom edge; what crosses under the line lies 7 m down
  // or deeper (Jb: never below the bed).
  const Jb = (dx, y, z) => [-100 + dx, Math.max(y, field.bedAt(-100 + dx, z) + 0.7), z];
  laid(J(-7.5, -2.6, 134), J(-12, -1.6, 112), 0.6, { near: true, rootLen: 0.4 });
  laid(J(8, -2.9, 127), J(13.5, -1.7, 104), 0.56, { near: true, rootLen: 0.4 });
  laid(Jb(-13, -9.5, 118), Jb(10, -7.2, 110), 0.6, { rootLen: 0.5 });
  laid(J(7, -4.6, 108), J(16, -2.8, 88), 0.58, { rootLen: 0.5 });
  laid(Jb(14, -10.5, 101), Jb(-9, -7.8, 93), 0.62, { rootLen: 0.5 });
  laid(Jb(-18, -15.3, 136), J(-7, -6.2, 121), 0.66, { rootLen: 1 });
  laid(Jb(20, -15.3, 108), J(7.5, -6.0, 117), 0.64, { rootLen: 1 });
  laid(Jb(-6, -15.5, 96), Jb(1, -9.5, 113), 0.6, { rootLen: 1 });
  await ctx.yield();
  // the shelf: positions are metres along the path from the end of the left arc (journey u = 0.8997 + s / 898) and metres to its right.
  // (round 12: the three raised butts of this table stand 6.3 m off the path, the design's distance for the moss gardens)
  const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][2] - path[i - 1][2]));
  const onPath = (sm, a, b, y) => {
    const d = cum[36] + sm; let i = 1; while (i < path.length - 1 && cum[i] < d) i++;
    const p0 = path[i - 1], p1 = path[i], sl = cum[i] - cum[i - 1], f = (d - cum[i - 1]) / sl, tx = (p1[0] - p0[0]) / sl, tz = (p1[2] - p0[2]) / sl;
    return [lerp(p0[0], p1[0], f) + tx * a - tz * b, y, lerp(p0[2], p1[2], f) + tz * a + tx * b];
  };
  const SH = [   // s, butt [along, right, y], top [along, right, y], r0, near, raised butt with a sapling
    [-62, [-5, -10, -2.6], [5, 9, -1.3], 0.5, 0, 0], [-54.5, [3, 6.3, -0.3], [-4, -9, -1.55], 0.5, 1, 1], [-47.5, [-6, -12, -1.9], [7, 8, -1.0], 0.55, 1, 0],
    [-40.5, [6, 9.5, -1.8], [-5, -10, -1.05], 0.5, 1, 0], [-33, [1, -6.3, -0.15], [-3, 9.5, -2.6], 0.46, 1, 1], [-26, [5, 10, -2.0], [-4, -9, -1.4], 0.5, 1, 0],
    [-19.5, [-5, -11, -2.0], [5, 8, -1.35], 0.52, 1, 0], [-10, [1, -6.3, -0.1], [-2, 7, -2.4], 0.45, 1, 1], [-2, [6, 8.5, -1.9], [-5, -10, -1.0], 0.5, 1, 0],
    [6, [-5, -11, -1.8], [6, 9, -1.1], 0.54, 1, 0], [14, [5, 10, -1.9], [-5, -9, -1.2], 0.5, 0, 0], [23, [-4, -10, -2.0], [6, 9, -1.3], 0.52, 0, 0], [33, [6, 9, -2.1], [-5, -9.5, -1.5], 0.5, 0, 0], [44, [-5, -9, -2.2], [5, 8.5, -1.7], 0.48, 0, 0]];
  for (let i = 0; i < SH.length; i++) {
    const [sm, b, t, r0, near, sap] = SH[i];
    laid(onPath(sm, b[0], b[1], b[2]), onPath(sm, t[0], t[1], t[2]), r0, { near: !!near, sap: !!sap, garden: !!sap, stubLen: near ? [0.6, 2.0] : [0.7, 2.4] });
    await ctx.yield();
  }
  await ctx.yield();
  // Laid later, from the gate's stream (so the trunks above keep their every stub). The window stays furnished after the
  // jam (u 0.42-0.50: the camera runs z 111 -> 40 along x = -100): four trunks hung up 1.5-3 m under the lens, and two
  // leaners whose lifted root plates stand out of the water with a moss garden and a sapling 9.3 m either side.
  xl = xg;
  laid(J(-7, -1.8, 84), J(-12, -3.0, 66), 0.62, { near: true, rootLen: 0.45 });       // (each runs away from the lens beside the line: thick end, taper and stubs read from 30 m off)
  laid(J(7.5, -4.4, 96), J(12, -2.2, 72), 0.6, { rootLen: 0.5 });
  laid(J(-7.5, -1.9, 56), J(-11.5, -3.2, 37), 0.6, { near: true, rootLen: 0.45 });
  await ctx.yield();
  laid(Jb(10, -9.0, 52), Jb(-7, -7.0, 36), 0.58, { rootLen: 0.5 });
  laid(J(-9.4, 0.0, 91), J(-27, -10.5, 82), 0.52, { near: true, sap: true, sapK: 1.25, rootLen: 0.62, garden: true });
  laid(J(9.5, -0.05, 62), J(28, -11, 68), 0.5, { near: true, sap: true, sapK: 1.25, rootLen: 0.62, garden: true });
  await ctx.yield();
  laid(J(8, -2.4, 46), J(12, -3.6, 24), 0.6, { near: true, rootLen: 0.45 });      // and on beside the start of the climb (u 0.49-0.52)
  laid(Jb(9, -8.5, 24), Jb(-5, -7.0, 2), 0.6, { rootLen: 0.5 });
  laid(J(-10.6, 0.0, 27), J(-29, -11, 20), 0.5, { near: true, sap: true, sapK: 1.2, rootLen: 0.6, garden: true });
  await ctx.yield();
  // and the last frame of the brief: four more crusted logs under the nose between the shelf trunks and the gate (u 0.957-0.981)
  const GT = [[52, [-4, -11, -1.9], [5, 9.5, -1.15], 0.52, 1], [59.5, [5, 10.5, -1.7], [-4, -10, -1.0], 0.5, 1], [66.5, [-3, -11.5, -1.6], [4, 9, -0.95], 0.5, 1], [72.5, [3, 12.5, -1.5], [-3, -10.5, -0.9], 0.46, 0]];
  // (round 13: gateTops, these four logs' upper sides, as raftTops below: the gate's shoal of carp hangs over one of them)
  const gateTops = [];
  for (const [sm, b, t, r0, near] of GT) {
    const gb = onPath(sm, b[0], b[1], b[2]), gt = onPath(sm, t[0], t[1], t[2]), gl = Math.hypot(gt[0] - gb[0], gt[1] - gb[1], gt[2] - gb[2]);
    laid(gb, gt, r0, { near: !!near, stubLen: near ? [0.6, 2.0] : [0.7, 2.4] });
    gateTops.push([(gb[0] + gt[0]) / 2, (gb[1] + gt[1]) / 2 + r0 * 0.8, (gb[2] + gt[2]) / 2, Math.atan2(gt[2] - gb[2], gt[0] - gb[0]), gl, (gt[1] - gb[1]) / gl]);
    await ctx.yield();
  }
  // THE MOSS GARDENS of the shelf skim (own stream): seven more trunks lie with their root plates lifted out of the water
  // 6.2-6.4 m either side of the path (the design: 'moss gardens passing 6 m off') from 66 m before the end of the arc to
  // 39 m after it, their tops running away from it into deeper water; with the three above, a garden passes on one side or
  // the other every ten or twelve metres. And four leaners whose bleached tops break the surface 8.6-9.5 m off, each with
  // moss, sedge and a sapling of its own. The table is [metres along the path from the end of the arc, metres to its right].
  // (round 12: the fourth stood at [-12, 8.4], which is where the journey puts the pheasant's log (13 m before the end of
  // the arc, 5-16.5 m to the right). That one trunk is moved by this table's own rule to [-2, 6.2], 11 m further on.)
  xl = makeRng(hashSeed('peacock-moss:' + (ctx.seed ?? 0))); ownK = true;
  for (const [sm, lat] of [[-66, -6.2], [-44, -6.4], [-29, 6.2], [-2, 6.2], [15, -6.2], [26.5, 6.2], [39, -6.4]]) {
    laid(onPath(sm, 0, lat, -0.12), onPath(sm + xl.range(3, 7), 0, lat * xl.range(2.3, 2.8) * 1.3, -3.4), xl.range(0.46, 0.54), { near: true, sap: true, garden: true, rootLen: 0.7, stubLen: [0.5, 1.6] });
    await ctx.yield();
  }
  for (const [sm, lat, top] of [[-40, 8.8, 0.75], [-16, -9.4, 0.6], [4, 9.2, 0.8], [31, -9.0, 0.65]]) {
    laid(onPath(sm - 4, 0, lat * 2.7, -4.4), onPath(sm, 0, lat, top), xl.range(0.42, 0.5), { near: true, rootLen: 0.6, stubLen: [0.5, 1.5] });
    await ctx.yield();
  }
  xl = xg; ownK = false;
  // and under the top of the turn, where the island now stands in the middle of the tangle (own stream): nine more trunks
  // criss-crossed on the bed in 8-13 m of water south and west of it, under the lens and on its left at u 0.60-0.66, so
  // the felled forest still fills the water beside the island
  xl = makeRng(hashSeed('peacock-isle:' + (ctx.seed ?? 0)));
  {
    const B = (x, z, lift = 0) => [x, field.bedAt(x, z) + 0.6 + lift, z];
    const IL = [[-46, -61, 0, -19, -45, 0.2, 0.64], [-21, -65, 0, -37, -45, 1.5, 0.58], [-13, -59, 0, 9, -45, 0.3, 0.62], [3, -63, 0.2, -13, -42, 1.7, 0.56], [-50, -51, 0, -27, -59, 1.1, 0.56],
      [-31, -67, 0, -5, -61, 0.9, 0.6], [-7, -51, 2.2, -29, -53, 0.4, 0.54], [15, -57, 0, -1, -48, 1.3, 0.54], [-58, -62, 0, -40, -52, 2.0, 0.5]];
    for (let i = 0; i < IL.length; i++) { const q = IL[i]; laid(B(q[0], q[1], q[2]), B(q[3], q[4], q[5]), q[6], { rootLen: 0.9, stubLen: [1.2, 4], ...FELL }); if (i % 3 === 2) await ctx.yield(); }
  }
  xl = xg;
  // --- THE STAND: the part of the drowned forest that still stands. Forty-odd bleached spruce trunks rise 12-26 m out of
  // 5-20 m of water round the head of the lake and across its elbow, over the felled trunks: two groves (inside and outside
  // the turn; either side of the start of pass two), outliers either side of the end of pass one, two sentinels on the lip
  // of the shelf. The flight threads them (nothing nearer than 6.8 m). Each is a tapering shaft with a splintered top,
  // drooping stubs and a few sagging limbs; four are leaners, four are broken stumps that carry a garden. Hand-placed so the
  // views along the path are composed; the seed jitters places and heights and the stream is the stand's own.
  // kind: 0 far (plain), 1 near the path (detailed), 2 stump with a garden, 3 leaner
  const xs = makeRng(hashSeed('peacock-stand:' + (ctx.seed ?? 0))), refl = makeAcc(), stand = [], standPerches = [];
  const STAND = [[-113, 76, 19, 1, 0], [-87, 52, 22, 1, 1], [-112.5, 30, 16, 1, 0], [-108.5, 6, 21, 1, 0], [-91.5, 5, 24, 1, 2],
    [-83.4, -18.5, 22, 1, 0], [-72.3, -33.2, 25, 1, 0], [-57, -38.4, 23, 1, 3], [-22.3, -33.8, 21, 1, 0],
    [-104.2, -16.6, 17, 1, 0], [-89.6, -40.9, 22, 1, 0], [-72, -55.2, 16, 1, 0], [-49.5, -57.8, 24, 1, 0], [-38, -57.5, 18, 1, 0], [-24, -56.5, 19, 1, 0], [-4.8, -44.8, 21, 1, 0],
    [-60, -12, 20, 0, 0], [-48, -22, 4, 2, 0], [-35, -12, 22, 0, 0], [-66, 3, 16, 0, 0], [-52, 8, 19, 3, 0], [-40, -28, 13, 0, 0], [-28, -6, 17, 0, 0], [-58, 22, 15, 0, 0], [-42, 24, 3.2, 2, 0], [-74, -12, 12, 0, 0], [-30, 14, 16, 0, 0], [-20, -18, 20, 3, 0], [-12, 2, 14, 0, 0], [-70, 20, 18, 0, 0],
    // (round 11: the row inside the arc of pass two stands 15-16 m off the line, not 8: the level gaze looks down the inside
    // of the arc, and a shaft there passes beside the lens, never across it. World coordinates.)
    [21.7, -31.2, 20, 1, 0], [41.1, -22.9, 23, 1, 4], [62.1, -19.6, 17, 1, 0], [86.2, -23.4, 20, 1, 0],
    [4.4, -12.6, 22, 1, 0], [23.9, -2.4, 18, 1, 0], [45, 3.6, 24, 1, 0], [66.9, 5.4, 19, 1, 0], [85.5, 3.4, 21, 1, 0],
    [30, 12, 15, 0, 0], [48, 18, 19, 3, 0], [62, 24, 13, 0, 0], [20, 22, 17, 0, 0], [75, 16, 3.5, 2, 0], [38, 30, 12, 0, 0], [56, 9, 4.5, 2, 0],
    [108, 3, 18, 1, 5], [119.3, -9.2, 15, 1, 0],
    // the way out: trunks either side of the arc down to the shelf and of the run to the gate (those on the left stand well
    // clear of every line from the lens to the gate from u 0.79 on), doubled in the healed mirror
    [136.5, -14, 17, 1, 0], [154, -27, 20, 1, 0], [176, -47, 15, 0, 0], [94.3, -51.9, 19, 0, 0], [118.5, -78.3, 22, 0, 0], [139.2, -100.4, 16, 0, 0],
    [160.3, -124.6, 18, 0, 0], [190.9, -100.8, 17, 0, 0], [202.7, -109.7, 13, 0, 0], [106, -64, 13, 0, 0], [128, -90, 17, 3, 0]];
  const x2 = makeRng(hashSeed('peacock-stand2:' + (ctx.seed ?? 0)));     // later detail draws from its own stream, so the stand stays where it was
  // a sagging dead limb: a curved, tapering tube with snapped twigs; its simple twin goes to the mirror image
  const limb = (q, ang, len, rb, bone, nS, nR, twigs) => {
    const dx = Math.cos(ang), dz = Math.sin(ang), px = -dz, pz = dx, x0 = q.x + dx * q.r * 0.55, z0 = q.z + dz * q.r * 0.55;
    const droop = xs.range(0.28, 0.6) * len, lift = xs.range(0.05, 0.3) * len, sw = xs.range(-0.25, 0.25) * len, kc = xs.range(0.8, 0.98), c = [0, 0, 0];
    const cen = (t, out) => { out[0] = x0 + dx * len * t + px * sw * t * t; out[1] = q.y - droop * Math.sin(t * 2.36) + lift * t * t * t; out[2] = z0 + dz * len * t + pz * sw * t * t; return out; };
    const rAt = (t) => rb * (1 - 0.78 * t) + 0.018, col = (r, sI, out) => { const k = kc * (0.86 + 0.14 * ((r * 3 + sI) % 2)); out[0] = bone[0] * k; out[1] = bone[1] * k; out[2] = bone[2] * k; };
    loft(wood, nR, nS, (r, sI, out) => { const t = r / (nR - 1), a = (sI / nS) * 6.2832, ra = rAt(t) * (1 + 0.18 * Math.sin(a * 2 + r)); cen(t, c); out[0] = c[0] + px * Math.cos(a) * ra; out[1] = c[1] + Math.sin(a) * ra; out[2] = c[2] + pz * Math.cos(a) * ra; }, col, null, null, cen(1.04, [0, 0, 0]));
    loft(refl, 3, 3, (r, sI, out) => { const t = r / 2, a = (sI / 3) * 6.2832, ra = rAt(t) * 1.15; cen(t, c); out[0] = c[0] + px * Math.cos(a) * ra; out[1] = c[1] + Math.sin(a) * ra; out[2] = c[2] + pz * Math.cos(a) * ra; }, col, null, null, cen(1.04, [0, 0, 0]));
    for (let w = 0; w < twigs; w++) {
      const t = xs.range(0.3, 0.85), b = cen(t, [0, 0, 0]), tl = xs.range(0.35, 0.9) * (1 - 0.4 * t), side = xs.sign(), down = xs.range(-0.9, 0.25), fw = xs.range(0.1, 0.6), tr = rAt(t) * 0.6;
      const ex = px * side * 0.7 + dx * fw, ey = down, ez = pz * side * 0.7 + dz * fw, el = Math.hypot(ex, ey, ez), tip = [b[0] + ex / el * tl, b[1] + ey / el * tl, b[2] + ez / el * tl];
      loft(wood, 2, 3, (r, sI, out) => { const a = (sI / 3) * 6.2832, ra = tr * (r ? 0.5 : 1), m = r * 0.55; out[0] = b[0] + (tip[0] - b[0]) * m + dx * Math.cos(a) * ra; out[1] = b[1] + (tip[1] - b[1]) * m + Math.sin(a) * ra; out[2] = b[2] + (tip[2] - b[2]) * m + dz * Math.cos(a) * ra; },
        (r, sI, out) => { out[0] = bone[0] * kc * 0.9; out[1] = bone[1] * kc * 0.9; out[2] = bone[2] * kc * 0.9; }, null, null, tip);
    }
    const m = cen(0.45, [0, 0, 0]); m[1] += rAt(0.45); return m;
  };
  for (let i = 0; i < STAND.length; i++) {
    const [sx0, sz0, H0, kind, perch] = STAND[i], jit = kind === 1 ? 0.7 : 2.2;
    let x = sx0 + xs.range(-jit, jit), z = sz0 + xs.range(-jit, jit); const hk = xs.range(0.9, 1.12), kb = xs.range(0.9, 1.05), wb = xs.range(-0.03, 0.03), la = xs() * 6.283, lt = xs.range(0, 1);
    if (distToPath(path, x, z) < 6.8) { x = sx0; z = sz0; }
    if (field.sdf(x, z) > -4.5 || distToPath(path, x, z) < 6.8) continue;
    const H = H0 * (kind === 2 ? 1 : hk), y0 = bedGrid(x, z) - 0.5, dep = -y0, tw = dep / (H + dep);
    let lean = kind === 3 ? 0.2 + 0.16 * lt : 0.012 + 0.05 * lt * lt, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
    if (distToPath(path, x + lx * (H + dep), z + lz * (H + dep)) < 7.2 || field.sdf(x + lx * (H + dep), z + lz * (H + dep)) > -2) { lx = -lx; lz = -lz; }
    if (distToPath(path, x + lx * (H + dep), z + lz * (H + dep)) < 7.2) { lx *= 0.1; lz *= 0.1; }
    const ll = Math.hypot(lx, 1, lz), near = kind === 1, rw = kind === 2 ? 0.62 + 0.3 * lt : near ? 0.5 + 0.26 * xs() : 0.36 + 0.2 * xs(), bone = [P3.r * kb + wb, P3.g * kb, P3.b * kb - wb * 1.5];
    const o = { x: x - lx * dep, y: y0, z: z - lz * dep, ax: lx / ll, ay: 1 / ll, az: lz / ll, L: (H + dep) * ll, r0: rw / (1 - 0.6 * tw), near, flare: 0.5, nRoots: 0, nStubs: kind === 2 ? 4 : near ? 9 : 5,
      stubLen: near ? [0.5, 1.7] : [0.5, 1.4], stubLift: -0.28, stubFat: near ? undefined : 1.3, bone, sides: near ? 8 : 6, rings: near ? 13 : 8, bend: 0.55 };
    const sm = addTrunk(wood, xs, noise, o), at = (hy) => { let q = sm[0]; for (const e of sm) if (Math.abs(e.y - hy) < Math.abs(q.y - hy)) q = e; return q; };
    if (near) {                                                  // the near ones are plainly dead trees: a splintered top, and one in three keeps a broken second leader
      const tq = sm[sm.length - 1], nsp = 2 + Math.floor(x2() * 2);
      for (let w = 0; w < nsp; w++) {
        const a0 = x2() * 6.283, bx = tq.x + Math.cos(a0) * tq.r * 0.5, bz = tq.z + Math.sin(a0) * tq.r * 0.5, hl = x2.range(0.5, 1.5), br2 = tq.r * x2.range(0.3, 0.45), tip = [bx + Math.cos(a0) * 0.12 * hl, tq.y + hl, bz + Math.sin(a0) * 0.12 * hl];
        loft(wood, 2, 4, (r, sI, out) => { const a = (sI / 4) * 6.2832, ra = br2 * (r ? 0.55 : 1); out[0] = bx + (tip[0] - bx) * r * 0.5 + Math.cos(a) * ra; out[1] = tq.y - 0.6 + (hl + 0.6) * r * 0.5; out[2] = bz + (tip[2] - bz) * r * 0.5 + Math.sin(a) * ra; },
          (r, sI, out) => { const k = 0.8 + 0.15 * r; out[0] = bone[0] * k; out[1] = bone[1] * k; out[2] = bone[2] * k; }, null, null, tip);
      }
      if (x2() < 0.34 && H > 15) {
        const q = at(H * x2.range(0.5, 0.62)), fa = x2() * 6.283, tx = Math.cos(fa) * 0.42, tz = Math.sin(fa) * 0.42, tl2 = Math.hypot(tx, 1, tz), fl = x2.range(3.6, 5.6);
        const fo = { x: q.x + Math.cos(fa) * q.r * 0.35, y: q.y - 0.5, z: q.z + Math.sin(fa) * q.r * 0.35, ax: tx / tl2, ay: 1 / tl2, az: tz / tl2, L: fl, r0: q.r * 0.6, near: true, flare: 0.3, nRoots: 0, nStubs: 3, stubLen: [0.4, 1.1], stubFat: 1.3, stubLift: -0.3, bone, sides: 6, rings: 7, bend: 1.6 };
        if (distToPath(path, fo.x + fo.ax * fl, fo.z + fo.az * fl) > 7) addTrunk(wood, x2, noise, fo);
      }
      if (distToPath(path, x, z) < 15) {                         // those the lens passes keep the snapped butts of their lower limbs: six to eight, of mixed length
        const ns = 6 + Math.floor(x2() * 3);
        for (let w = 0; w < ns; w++) {
          const q = at(1.3 + (w + x2()) / ns * Math.min(H * 0.6, 9)), a0 = x2() * 6.283, len = x2() < 0.3 ? x2.range(1.1, 1.9) : x2.range(0.3, 0.8), rb = q.r * x2.range(0.17, 0.3), upk = x2.range(-0.3, 0.45);
          const dl = Math.hypot(1, upk), dx = Math.cos(a0) / dl, dy = upk / dl, dz = Math.sin(a0) / dl, bx = q.x + Math.cos(a0) * q.r * 0.8, bz = q.z + Math.sin(a0) * q.r * 0.8, tip = [bx + dx * len, q.y + dy * len, bz + dz * len];
          if (distToPath(path, tip[0], tip[2]) < 6.9) continue;
          const ux = -Math.sin(a0), uz = Math.cos(a0), vx = dy * uz, vy = dz * ux - dx * uz, vz = -dy * ux, kc = x2.range(0.78, 0.98);
          loft(wood, 3, 5, (r, sI, out) => { const t = r * 0.46, a = (sI / 5) * 6.2832, ra = rb * (1 - 0.45 * t) * (1 + 0.2 * Math.sin(a * 2 + w)), ca = Math.cos(a) * ra, sa = Math.sin(a) * ra; out[0] = bx + dx * len * t + ux * ca + vx * sa; out[1] = q.y + dy * len * t + vy * sa; out[2] = bz + dz * len * t + uz * ca + vz * sa; },
            (r, sI, out) => { const k = kc * (0.84 + 0.16 * ((r + sI) % 2)); out[0] = bone[0] * k; out[1] = bone[1] * k; out[2] = bone[2] * k; }, null, null, tip);
        }
      }
    }
    // the mirror twin of the shaft: six sides, a ring every three metres or so, from the waterline up
    const pk = []; for (let k = 0; k < sm.length; k++) if (sm[k].y > -0.4 && (pk.length === 0 || sm[k].y - pk[pk.length - 1].y > 2.6 || k === sm.length - 1)) pk.push(sm[k]);
    if (pk.length > 1) loft(refl, pk.length, 6, (r, sI, out) => { const q = pk[r], a = (sI / 6) * 6.2832, rr = q.r * (r === pk.length - 1 ? 0.6 : 1.05); out[0] = q.x + Math.cos(a) * rr; out[1] = Math.max(q.y, 0); out[2] = q.z + Math.sin(a) * rr; },
      (r, sI, out) => { out[0] = bone[0]; out[1] = bone[1]; out[2] = bone[2]; }, null, null, null);
    const nL = kind === 2 ? 0 : near ? 4 : 2; let pp = null;
    for (let b = 0; b < nL; b++) {
      const f = (b + xs.range(0.1, 0.9)) / nL, hy = H * (0.36 + 0.6 * f), ang = b * 2.4 + la + xs.range(-0.5, 0.5), q = at(hy);
      const m = limb(q, ang, lerp(3.4, 1.3, f) * xs.range(0.75, 1.15) * (near ? 1 : 0.8), q.r * xs.range(0.3, 0.42), bone, near ? 4 : 3, near ? 5 : 3, near ? 2 : 1);
      if (b === 0) pp = m;
    }
    if (perch) {                                                 // a stout low bough toward the path for a mandarin to stand on
      const q = at(Math.min(H * 0.42, 7.5)), n = (() => { let bd = 1e9, bx = 0, bz = 0; for (let k = 0; k < path.length; k++) { const d = Math.hypot(path[k][0] - x, path[k][2] - z); if (d < bd) { bd = d; bx = path[k][0]; bz = path[k][2]; } } return [bx, bz]; })();
      const m = limb(q, Math.atan2(n[1] - z, n[0] - x) + xs.range(-0.5, 0.5), 2.1, 0.2, bone, 4, 5, 1); standPerches.push(new THREE.Vector3(m[0], m[1] + 0.06, m[2]));
    }
    stand.push({ o, s: sm, x, z, H, kind, near, top: sm[sm.length - 1], wl: at(0) });
    await ctx.yield();
  }
  await ctx.yield();
  // --- THE WINDOW OF PASS TWO: the lens comes round the turn at 11.5 m and sinks to the shelf along z = -25 .. -5,
  // x = 0 .. 115, looking down the arc. Under that line the felled forest is laid as a raft two deep: a layer propped
  // 7-9.5 m down and a top layer hung 3-6 m under the surface, bone white, every one at its own angle, root plates and
  // the stumps of their limbs intact; where the bed climbs to the shelf (x 85-125) they lie on the marl in 2-5 m of water.
  // Own random stream. The loop runs over the twenty that are laid, a propped one and a hung one by turns (k: the pair):
  // within a layer each trunk is turned 7.2 rad from the last (52.5 degrees, as lines) and the hung one of a pair 2.4 rad
  // from the propped one; the two of a pair lie 5 m to either side of the raft's line and change sides from pair to pair.
  // One whose ends do not both lie in nine metres of water is passed over and takes no more numbers.
  xl = makeRng(hashSeed('peacock-raft:' + (ctx.seed ?? 0))); ownK = true;
  const raftTops = [], turnTops = [];   // the top layers: [x, y of the trunk's upper side at its middle, z, yaw, length, rise per metre from butt to top]
  {
    const RN = 20;
    for (let i = 0; i < RN; i++) {
      const f = (i + xl.range(0.1, 0.9)) / RN, top = i % 2 === 1, k = i >> 1, cx0 = lerp(14, 124, f), cz0 = lerp(-16, -9, f) + xl.gauss() * (top ? 9 : 14) + ((k + i) % 2 ? -5 : 5);
      const yaw = (k * 7.2 + (top ? 4.8 : 2.4) + xl.range(-0.5, 0.5)) % 6.283, L = xl.range(17, 29), r0 = top ? xl.range(0.62, 0.9) : xl.range(0.52, 0.74), dx = Math.cos(yaw) * L / 2, dz = Math.sin(yaw) * L / 2;
      const bx = cx0 - dx, bz = cz0 - dz, tx = cx0 + dx, tz = cz0 + dz;
      if (field.sdf(bx, bz) > -9 || field.sdf(tx, tz) > -9) continue;
      const want = top ? xl.range(-5.6, -3.1) : xl.range(-9.5, -6.8), tilt = xl.range(-1.3, 1.3);
      const by = Math.min(-2.2, Math.max(want - tilt, bedGrid(bx, bz) + r0 * 1.15)), ty = Math.min(-2.2, Math.max(want + tilt, bedGrid(tx, tz) + r0 * 0.8));
      laid([bx, by, bz], [tx, ty, tz], r0, { rootLen: top ? 1.25 : 1, stubLen: [1.4, 4.4], ...FELL });
      if (top) raftTops.push([cx0, (by + ty) / 2 + r0, cz0, yaw, L, (ty - by) / L]);
      if (top) await ctx.yield();
    }
  }
  // --- UNDER THE TOP OF THE TURN: from 11.5 m the lens looks down the outside of the turn onto x -70 .. 0, z -92 .. -52.
  // The trunks on the bed there lie 9-13 m down and read blue; so more of the felled forest is hung over them, bone white
  // at 3-5.4 m, every one at its own angle (own stream; the loop runs over the eleven that are laid, two to one side of
  // the turn's line and two to the other by turns; one that cannot lie where it is dealt takes no more numbers).
  xl = makeRng(hashSeed('peacock-turn:' + (ctx.seed ?? 0)));
  {
    const TN = 11;
    for (let i = 0; i < TN; i++) {
      const f = (i + xl.range(0.1, 0.9)) / TN, cx0 = lerp(-70, 2, f) + xl.gauss() * 4, cz0 = lerp(-62, -72, Math.sin(f * 3.1416)) + xl.gauss() * 6 + ((i >> 1) % 2 ? 7 : -7);
      const yaw = (i * 2.4 + xl.range(-0.5, 0.5)) % 6.283, L = xl.range(17, 28), r0 = xl.range(0.6, 0.86), dx = Math.cos(yaw) * L / 2, dz = Math.sin(yaw) * L / 2;
      const bx = cx0 - dx, bz = cz0 - dz, tx = cx0 + dx, tz = cz0 + dz;
      if (field.sdf(bx, bz) > -9 || field.sdf(tx, tz) > -9 || Math.hypot(cx0 + 41, cz0 + 35.5) < 21) continue;
      const want = xl.range(-5.4, -3.0), tilt = xl.range(-1.2, 1.2);
      const by = Math.min(-2.4, Math.max(want - tilt, bedGrid(bx, bz) + r0 * 1.15)), ty = Math.min(-2.4, Math.max(want + tilt, bedGrid(tx, tz) + r0 * 0.8));
      laid([bx, by, bz], [tx, ty, tz], r0, { rootLen: 1.2, stubLen: [1.4, 4.4], ...FELL });
      turnTops.push([cx0, (by + ty) / 2 + r0, cz0, yaw, L, (ty - by) / L]);
      if (i % 3 === 2) await ctx.yield();
    }
  }
  xl = xs; ownK = false;
  // --- (round 12) DRIFTWOOD AT THE OUTLET (own stream 'peacock-drift', made here after every other stream of the piece;
  // these six are not in `extra`: no garden, weed or shadow is dealt for them, so nothing else's numbers move).
  // The lake's level water lies a hand deep over the cream shelf from the shoal's crest (z 256.6) to the drop at z 232.
  // Three bleached trunks lie awash on that shelf 3-7 m either side of the line (x = -100), two more lie with their butts
  // on its edge and their tops gone down the drop, and one lies down the floor of the drop itself 8.5-10.5 m left of the
  // line, butt up at the shelf's edge and top 9 m down, running away from the lens as the others do: pale trunks under
  // the nose as the lens comes off the shoal. (round 13: NOTHING SUNK CROSSES UNDER THE LINE AT THE DROP. That sixth log
  // crossed under it five metres down, at 38 degrees: from the shoal's crest to z 225 it stood as a dark bar with a ruled
  // lower edge across the lower frame, where the pale shelf gives way to deep water: the 'seam'. It keeps its girth, its
  // length and every number of its stream.) [butt x, z, top x, z, radius, what the top rests on: 0 the shelf, 1 the bed]
  {
    const keep = xl; xl = makeRng(hashSeed('peacock-drift:' + (ctx.seed ?? 0)));
    for (const [bx, bz, tx, tz, r0, deep] of [[-106.5, 253, -103.3, 246, 0.26, 0], [-93.2, 249.5, -96.4, 241, 0.3, 0], [-105.6, 243.5, -103.6, 236, 0.24, 0],
      [-96, 236.5, -97.4, 225, 0.32, 1], [-104.8, 235.5, -101.8, 223.5, 0.3, 1], [-108.5, 231, -110.5, 214, 0.34, 2]]) {
      const by = deep === 2 ? bedGrid(bx, bz) + r0 * 1.1 : r0 - 0.13, ty = deep ? bedGrid(tx, tz) + r0 * 0.8 : r0 * 0.8 - 0.13;
      laid([bx, by, bz], [tx, ty, tz], r0, { near: deep === 0, rootLen: 0.2, stubLen: [0.3, 0.9], nStubs: 4, blunt: true });   // (snapped logs: no root plate)
      extra.pop();
    }
    xl = keep;
    await ctx.yield();
  }
  // --- THE ARCH: one huge windthrown spruce hung up across the end of pass one. Its butt lies on the bed left of the path,
  // the trunk climbs out of the water, arches 19 m over the line of flight (the camera passes under it at u 0.548, with
  // 11 m to spare; from u 0.52 the snow peak stands framed in it) and comes down 40 m to the right, where its broken top goes back under. Bone-pale below, mossed on
  // top (vertex flex 1 tells the wood shader: grain along the trunk, moss the whole length), snapped limbs, its simple twin
  // in the mirror; moss cushions, saplings and hanging lichen are added with the gardens. Own random stream.
  const xa = makeRng(hashSeed('peacock-arch:' + (ctx.seed ?? 0))), archS = [], archL = [];
  {
    const AP = [[-126.6, Math.min(-9, bedGrid(-126.6, 4.0) + 0.9), 4.0], [-122.6, -1.8, 3.3], [-118.6, 7.5, 2.5], [-112.5, 15, 1.2], [-105, 18.8, -0.2], [-97, 18.9, -1.4], [-89.5, 15.2, -2.2], [-84, 8.6, -2.6], [-80.6, 1.8, -2.7], [-78.6, -3.6, -2.4], [-77.6, -8.5, -2.0]];
    const nA = AP.length, cr = (t, out) => {
      const f = clamp(t, 0, 1) * (nA - 1), i = Math.min(nA - 2, Math.floor(f)), u = f - i, p0 = AP[Math.max(i - 1, 0)], p1 = AP[i], p2 = AP[i + 1], p3 = AP[Math.min(i + 2, nA - 1)];
      for (let c = 0; c < 3; c++) out[c] = 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u * u + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * u * u * u);
      return out;
    };
    const sdA = xa() * 100, kb = xa.range(1.02, 1.1), bone = [P3.r * kb, P3.g * kb, P3.b * kb * 0.97], qa = [0, 0, 0], qb = [0, 0, 0];
    const frame = (t) => {                                       // centre, and two unit vectors across the trunk (n: out of the arch, b: across it)
      cr(t - 0.004, qa); cr(t + 0.004, qb); let tx = qb[0] - qa[0], ty = qb[1] - qa[1], tz = qb[2] - qa[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let nx = -ty, ny = tx, nz = 0; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const c = cr(t, [0, 0, 0]);
      return { c, t: [tx, ty, tz], n: [nx, ny, nz], b: [ty * nz - tz * ny, tz * nx - tx * nz, tx * ny - ty * nx] };
    };
    const rA = (t) => lerp(1.28, 0.4, Math.pow(t, 0.85)) * (1 + 0.5 * Math.exp(-t * 40));
    const NRA = 46, NSA = 12, fr = []; for (let r = 0; r < NRA; r++) fr.push(frame(r / (NRA - 1)));
    let lp = [0, 0, 0];
    loft(wood, NRA, NSA, (r, s, out) => {
      const F = fr[r], t = r / (NRA - 1), a = (s / NSA) * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
      const rr = rA(t) * (1 + 0.16 * noise.n3(ca * 1.2 + sdA, sa * 1.2, t * 22) + 0.06 * noise.n3(ca * 3.5 + sdA, sa * 3.5, t * 70)) * (1 + 0.1 * Math.abs(Math.sin(a * 2.5 + t * 9)));
      out[0] = F.c[0] + (F.n[0] * ca + F.b[0] * sa) * rr; out[1] = F.c[1] + (F.n[1] * ca + F.b[1] * sa) * rr; out[2] = F.c[2] + (F.n[2] * ca + F.b[2] * sa) * rr; lp = out;
    }, (r, s, out) => { const k = 0.86 + 0.16 * noise.n3(lp[0] * 0.8 + sdA, lp[1] * 0.8, lp[2] * 0.8); out[0] = bone[0] * k; out[1] = bone[1] * k; out[2] = bone[2] * k; }, () => 1, fr[0].c, fr[NRA - 1].c);
    for (let r = 0; r < NRA; r++) { const F = fr[r], t = r / (NRA - 1); archS.push({ x: F.c[0], y: F.c[1], z: F.c[2], r: rA(t), t, n: F.n, b: F.b, tg: F.t }); }
    await ctx.yield();
    // snapped limbs: blunt, broken-ended, a few long ones sagging; those near the top of the tree are the longest
    const limbA = (t, ang, len, rb, sag, twin) => {
      const F = frame(t), ca = Math.cos(ang), sa = Math.sin(ang), dx0 = F.n[0] * ca + F.b[0] * sa + F.t[0] * 0.35, dy0 = F.n[1] * ca + F.b[1] * sa + F.t[1] * 0.35, dz0 = F.n[2] * ca + F.b[2] * sa + F.t[2] * 0.35;
      const dl = Math.hypot(dx0, dy0, dz0) || 1, dx = dx0 / dl, dy = dy0 / dl, dz = dz0 / dl, r0 = rA(t) * 0.7, bx = F.c[0] + dx * r0, by = F.c[1] + dy * r0, bz = F.c[2] + dz * r0;
      const hl = Math.hypot(dx, dz) || 1, ux = -dz / hl, uz = dx / hl, vx = -dy * uz, vy = dz * ux - dx * uz, vz = dy * ux, kc = xa.range(0.82, 1.0), nR = len > 3 ? 6 : 4, c = [0, 0, 0];
      const cen = (s, out) => { out[0] = bx + dx * len * s; out[1] = by + dy * len * s - sag * len * s * s; out[2] = bz + dz * len * s; return out; };
      const col = (r, s, out) => { const k = kc * (0.84 + 0.16 * ((r + s) % 2)) * (r === nR - 1 ? 0.7 : 1); out[0] = bone[0] * k; out[1] = bone[1] * k; out[2] = bone[2] * k; };
      loft(wood, nR, 5, (r, s, out) => { const sv = r / (nR - 1), a = (s / 5) * 6.2832, ra = rb * (1 - 0.5 * sv) * (1 + 0.2 * Math.sin(a * 2 + r)) * (r === nR - 1 ? 0.55 + 0.45 * ((s * 3) % 2) : 1), cs = Math.cos(a) * ra, sn = Math.sin(a) * ra, jag = r === nR - 1 ? ((s * 2) % 3) * 0.1 * rb * 3 : 0;
        cen(sv + jag / len, c); out[0] = c[0] + ux * cs + vx * sn; out[1] = c[1] + vy * sn; out[2] = c[2] + uz * cs + vz * sn; }, col, () => 1, null, cen(0.98, [0, 0, 0]));
      if (twin) loft(refl, 3, 3, (r, s, out) => { const a = (s / 3) * 6.2832, ra = rb * (1 - 0.25 * r) * 1.1; cen(r / 2, c); out[0] = c[0] + ux * Math.cos(a) * ra; out[1] = Math.max(0, c[1] + Math.sin(a) * ra); out[2] = c[2] + uz * Math.cos(a) * ra; }, col, null, null, null);
      archL.push({ t, tip: cen(1, [0, 0, 0]), mid: cen(0.5, [0, 0, 0]), rb });
    };
    for (let k = 0; k < 15; k++) {
      const t = 0.13 + 0.05 * k + xa.range(-0.015, 0.015), top = t > 0.62, ang = (k % 2 ? 1 : -1) * xa.range(0.5, 1.5) + (k % 5 === 4 ? 3.14 : 0);
      limbA(t, ang, top ? xa.range(2.6, 5.2) : k % 4 === 1 ? xa.range(2.2, 3.4) : xa.range(0.7, 1.6), rA(t) * xa.range(0.2, 0.3), top ? xa.range(0.18, 0.4) : xa.range(0, 0.15), top || k % 4 === 1);
    }
    // its twin in the mirror: eight sides, a ring every 1.2 m or so, from the waterline up
    const pk = archS.filter((q) => q.y > -0.6);
    loft(refl, pk.length, 8, (r, s, out) => { const q = pk[r], a = (s / 8) * 6.2832, ca = Math.cos(a), sa = Math.sin(a), rr = q.r * 1.04; out[0] = q.x + (q.n[0] * ca + q.b[0] * sa) * rr; out[1] = Math.max(q.y + (q.n[1] * ca + q.b[1] * sa) * rr, 0); out[2] = q.z + (q.n[2] * ca + q.b[2] * sa) * rr; },
      (r, s, out) => { out[0] = bone[0]; out[1] = bone[1]; out[2] = bone[2]; }, null, null, null);
  }
  await ctx.yield();
  const woodGeo = new THREE.BufferGeometry();                 // built in steps: it is the largest mesh of the piece
  woodGeo.setAttribute('position', new THREE.Float32BufferAttribute(wood.p, 3));
  await ctx.yield();
  woodGeo.setAttribute('aCol', new THREE.Float32BufferAttribute(wood.c, 3));
  await ctx.yield();
  woodGeo.setAttribute('aFlex', new THREE.Float32BufferAttribute(wood.f, 1));
  await ctx.yield();
  woodGeo.setIndex(wood.i);
  await ctx.yield();
  await normalsInSteps(woodGeo, ctx.yield);                   // (round 12: in steps; in one piece it was the build's longest own step)
  await ctx.yield();
  // The wood is drawn as five meshes over the same vertices: what stands in the air or breaks the surface, and what lies
  // wholly under water north and south of z = 60, each of those two split again at x = -62 (below). Sunk wood is not drawn
  // while the lens is too low or too far off to see into the water over it, or has it astern (setLens: rules of height,
  // distance and bearing).
  const woodMat = mk(UW_VERT, UW_FRAG, { K_WOOD: 1 }, {}, { side: THREE.DoubleSide }), wi = wood.i, wp = wood.p, iDry = [], iNorth = [], iSouth = [], iNorthW = [], iAft = [];
  for (let k = 0; k < wi.length; k += 3) {
    if (k % 12000 === 11997) await ctx.yield();                 // (every four thousand triangles the page gets its frames)
    const a = wi[k] * 3, b = wi[k + 1] * 3, c = wi[k + 2] * 3;
    // (each of the two is split again at x = -62: what lies sunk under pass one itself, north of z = 12 and west of
    // x = -62, is left undrawn while that whole box lies behind the plane of the lens (see setLens))
    const zM = Math.max(wp[a + 2], wp[b + 2], wp[c + 2]), west = Math.max(wp[a], wp[b], wp[c]) < -62 && Math.min(wp[a + 2], wp[b + 2], wp[c + 2]) > 12;
    const to = Math.max(wp[a + 1], wp[b + 1], wp[c + 1]) > -0.45 ? iDry : zM > 60 ? (west ? iNorthW : iNorth) : west ? iAft : iSouth;
    to.push(wi[k], wi[k + 1], wi[k + 2]);
  }
  await ctx.yield();
  const sunkGeo = (ix) => { const g = new THREE.BufferGeometry(); for (const k in woodGeo.attributes) g.setAttribute(k, woodGeo.attributes[k]); g.setIndex(ix); return g; };
  woodGeo.setIndex(iDry);
  add(new THREE.Mesh(woodGeo, woodMat));
  const sunkNorth = add(new THREE.Mesh(sunkGeo(iNorth), woodMat)), sunkSouth = add(new THREE.Mesh(sunkGeo(iSouth), woodMat));
  const sunkNorthW = add(new THREE.Mesh(sunkGeo(iNorthW), woodMat)), sunkAft = add(new THREE.Mesh(sunkGeo(iAft), woodMat));
  await ctx.yield();

  // --- shadows of the trunks on the bed (multiplied; strips that follow the floor) ---
  const sp = [], su = [], ss = [], si = [], sxk = sunU.x / sunU.y, szk = sunU.z / sunU.y;
  for (const { o, s } of trunks.concat(extra)) {
    const hl = Math.hypot(o.ax, o.az) || 1, nx = -o.az / hl, nz = o.ax / hl; let prev = -1;
    for (let i = 0; i < s.length; i += 2) {
      const q = s[i]; if (q.y > -0.3) { prev = -1; continue; }
      const h = Math.max(0, q.y - bedGrid(q.x, q.z)), mx = q.x - sxk * h, mz = q.z - szk * h, w = q.r * (i === 0 ? 3.2 : 1.35) + 0.2 + h * 0.15, str = clamp(1 - h * 0.07, 0.42, 1);
      const b = sp.length / 3;
      for (const e of [-1, 1]) { const vx = mx + nx * w * e, vz = mz + nz * w * e; sp.push(vx, bedGrid(vx, vz) + 0.13, vz); su.push(i / (s.length - 1), e * 0.5 + 0.5); ss.push(str); }
      if (prev >= 0) si.push(prev, prev + 1, b, prev + 1, b + 1, b);
      prev = b;
    }
  }
  const shGeo = new THREE.BufferGeometry();
  shGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); shGeo.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
  shGeo.setAttribute('aStr', new THREE.Float32BufferAttribute(ss, 1)); shGeo.setIndex(si);
  const shadowParams = { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor };
  add(new THREE.Mesh(shGeo, mk(SHADOW_VERT, SHADOW_FRAG, {}, {}, shadowParams)), 1);
  await ctx.yield();

  // --- gardens on everything that breaks the surface; weed on what does not ---
  let G = makeAcc(), gr = rng;                               // the random stream the gardens draw from
  const gv = (x, y, z, c, k, f) => { G.p.push(x, y, z); G.c.push(c.r * k, c.g * k, c.b * k); G.f.push(f); return G.p.length / 3 - 1; };
  const cMossA = moss.clone().multiplyScalar(0.95), cMossB = mixc(moss, P4, 0.35), cSedge = mixc(P4, hex('#A8B45A'), 0.55).multiplyScalar(0.85), cSap = mixc(P5, hex('#3E7A3A'), 0.55), cSapTip = mixc(P5, hex('#7FB04A'), 0.6), cWeed = mixc(algae, hex('#7FA83A'), 0.5), cStem = hex('#4A3A2A');
  const cushion = (x, y, z, R, h, km = 1, cc = null) => {
    const pick = gr.chance(0.5) ? cMossA : cMossB, col = cc || pick, k0 = gr.range(0.75, 1.1) * km, sq = gr.range(0.7, 1.3), a0 = gr() * 6.28;
    loft(G, 3, 6, (r, s, out) => { const a = a0 + s / 6 * 6.2832, e = r * 0.5, rr = R * Math.cos(e) * (1 + 0.2 * Math.sin(s * 2.3 + a0)); out[0] = x + Math.cos(a) * rr * sq; out[1] = y - 0.06 + h * Math.sin(e); out[2] = z + Math.sin(a) * rr / sq; },
      (r, s, out) => { const k = k0 * (0.7 + 0.2 * r); out[0] = col.r * k; out[1] = col.g * k; out[2] = col.b * k; }, null, null, [x, y - 0.06 + h * 0.95, z]);
  };
  // (round 11) a shrub's foliage: every cluster on its twig is a spray of nine small leaves (a hand long, each at its own
  // angle and tilt, lighter toward its tip), not one big facet. Own random stream: no other draw moves.
  const lfR = makeRng(hashSeed('peacock-sprays:' + (ctx.seed ?? 0)));
  const spray = (cx, cy, cz, sz, col, k) => {
    for (let j = 0; j < 9; j++) {
      const a = lfR() * 6.283, rad = sz * 1.15 * Math.sqrt(lfR()), px = cx + Math.cos(a) * rad, pz = cz + Math.sin(a) * rad, py = cy + sz * lfR.range(-0.4, 0.95);
      const d = lfR() * 6.283, ll = clamp(sz * 0.44, 0.09, 0.17) * lfR.range(0.8, 1.25), lw = ll * 0.3, dx = Math.cos(d), dz = Math.sin(d), tilt = lfR.range(-0.6, 0.35), kk = k * lfR.range(0.7, 1.25);
      const v0 = gv(px - dz * lw, py, pz + dx * lw, col, kk * 0.78, 0.8), v1 = gv(px + dz * lw, py, pz - dx * lw, col, kk * 0.78, 0.8), v2 = gv(px + dx * ll, py + tilt * ll, pz + dz * ll, col, kk * 1.18, 1.1);
      G.i.push(v0, v1, v2);
    }
  };
  const sedge = (x, y, z, n, H) => {
    for (let b = 0; b < n; b++) {
      const a = gr() * 6.283, lean = gr.range(0.25, 1), h = H * gr.range(0.6, 1), w = 0.022 + h * 0.02, ca = Math.cos(a), sa = Math.sin(a), k = gr.range(0.8, 1.15);
      const b0 = gv(x - sa * w, y, z + ca * w, cSedge, k * 0.7, 0), b1 = gv(x + sa * w, y, z - ca * w, cSedge, k * 0.7, 0);
      const mxx = x + ca * h * 0.16 * lean, mzz = z + sa * h * 0.16 * lean, m0 = gv(mxx - sa * w * 0.7, y + h * 0.58, mzz + ca * w * 0.7, cSedge, k, 0.5), m1 = gv(mxx + sa * w * 0.7, y + h * 0.58, mzz - ca * w * 0.7, cSedge, k, 0.5);
      const t = gv(x + ca * h * 0.55 * lean, y + h * (1 - 0.25 * lean), z + sa * h * 0.55 * lean, cSedge, k * 1.2, 1.2);
      G.i.push(b0, b1, m0, b1, m1, m0, m0, m1, t);
    }
  };
  const sapling = (x, y, z, H) => {
    const lx = gr.range(-0.08, 0.08) * H, lz = gr.range(-0.08, 0.08) * H, tiers = Math.max(3, Math.round(H * 3.4)), a0 = gr() * 6.28, kk = gr.range(0.85, 1.15);
    const s0 = gv(x - 0.025, y - 0.1, z, cStem, 1, 0), s1 = gv(x + 0.025, y - 0.1, z + 0.02, cStem, 1, 0), s2 = gv(x, y - 0.1, z - 0.03, cStem, 1, 0), st = gv(x + lx, y + H, z + lz, cSapTip, 1, 1);
    G.i.push(s0, s1, st, s1, s2, st, s2, s0, st);
    for (let t = 0; t < tiers; t++) {
      const f = (t + 0.4) / tiers, yy = y + H * (0.14 + 0.8 * f), R = H * 0.34 * (1 - f * 0.82) + 0.03, ox = x + lx * f, oz = z + lz * f, drop = R * 0.5;
      const ap = gv(ox, yy + R * 0.42, oz, cSap, 0.6 * kk, 0.3 + 0.5 * f); let first = -1, prev = -1;
      for (let s = 0; s < 10; s++) {
        const a = a0 + t * 0.7 + s / 10 * 6.2832, rr = R * (s % 2 ? 0.5 : 1) * gr.range(0.85, 1.15);
        const v = gv(ox + Math.cos(a) * rr, yy - (s % 2 ? drop * 0.3 : drop), oz + Math.sin(a) * rr, s % 2 ? cSap : cSapTip, kk * (s % 2 ? 0.7 : 1.05), 0.5 + 0.7 * f);
        if (prev >= 0) G.i.push(ap, prev, v); else first = v; prev = v;
      }
      G.i.push(ap, prev, first);
    }
  };
  const flowX = -0.37, flowZ = 0.93;
  const weed = (x, y, z, len) => {
    const side = gr() * 6.283, w = gr.range(0.05, 0.11), k = gr.range(0.7, 1.15), px = Math.cos(side) * w, pz = Math.sin(side) * w; let prev = -1;
    for (let s = 0; s <= 4; s++) {
      const f = s / 4, xx = x + flowX * len * f * f * 0.9, yy = y + len * (0.75 * f - 0.3 * f * f), zz = z + flowZ * len * f * f * 0.9, ww = 1 - 0.7 * f;
      const a = gv(xx - px * ww, yy, zz - pz * ww, cWeed, k * (0.6 + 0.6 * f), f), b = gv(xx + px * ww, yy, zz + pz * ww, cWeed, k * (0.6 + 0.6 * f), f);
      if (prev >= 0) G.i.push(prev, prev + 1, a, prev + 1, b, a); prev = a;
    }
  };
  const gardenOn = ({ o, s }) => {
    const up = Math.hypot(o.ax, o.az) < 0.2 ? 0 : 1; let saps = gr.int(2, 3), any = false;
    for (let i = 0; i < s.length; i++) {
      const q = s[i], top = q.y + q.r * 0.92;
      if (top > 0.07 && up) {
        // (the pheasant's log: from the sample before his feet to the thin end nothing is dealt here: he stands there, and
        // the moss of that stretch is the log's own, laid below from 'peacock-perch')
        any = true; if (o.perch !== undefined && i >= o.perch - 1) continue;
        if (gr.chance(0.85)) cushion(q.x + gr.range(-0.1, 0.1), top, q.z + gr.range(-0.1, 0.1), q.r * gr.range(0.7, 1.15) + 0.12, gr.range(0.08, 0.2));
        if (gr.chance(0.5)) sedge(q.x + gr.range(-0.15, 0.15), top + 0.03, q.z + gr.range(-0.15, 0.15), gr.int(4, 7), gr.range(0.35, 0.8));
        if (saps > 0 && gr.chance(0.2)) { sapling(q.x, top + 0.08, q.z, gr.range(0.7, 1.5)); saps--; emergent.push(new THREE.Vector3(q.x, top, q.z)); }
      } else if (top < -0.5 && top > -8.5 && i % 3 === 1 && gr.chance(0.75)) {
        for (let w = 0; w < 2; w++) weed(q.x + gr.range(-0.2, 0.2), top - 0.1, q.z + gr.range(-0.2, 0.2), Math.min(gr.range(1.0, 2.6), (-top - 0.12) / 0.47));   // never long enough to reach the surface
      }
    }
    if (o.y + o.r0 * 2 > 0.1 && o.nRoots) {                      // a root plate standing out of the water: its own garden
      any = true;
      for (let m = 0; m < 4; m++) { const a = gr() * 6.283, r = o.r0 * gr.range(0.3, 1.6); cushion(o.x + Math.cos(a) * r * 0.5, Math.max(0.1, o.y + o.r0 * gr.range(1.0, 1.9)), o.z + Math.sin(a) * r * 0.5, gr.range(0.25, 0.5), gr.range(0.1, 0.22)); }
      sedge(o.x, Math.max(0.12, o.y + o.r0 * 1.7), o.z, 7, gr.range(0.5, 0.9));
      if (gr.chance(0.7) || o.sap) sapling(o.x + gr.range(-0.2, 0.2), Math.max(0.15, o.y + o.r0 * 1.8), o.z + gr.range(-0.2, 0.2), (o.sap ? gr.range(1.3, 1.7) : gr.range(0.8, 1.5)) * (o.sapK || 1));
    }
    if (any && !emergent.some((e) => Math.hypot(e.x - o.x, e.z - o.z) < 3)) emergent.push(new THREE.Vector3(o.x + o.ax * o.L * (o.ay > 0.2 ? 1 : 0), 0.3, o.z + o.az * o.L * (o.ay > 0.2 ? 1 : 0)));
  };
  // (each trunk's garden and weed from the stream the trunk was dealt from: the tangle's from 'peacock-tangle')
  for (const tr of trunks.concat(sillLogs)) { gr = tr.rs || rng; gardenOn(tr); }
  gr = rng;
  await ctx.yield();
  {   // the pheasant's log is a MOSSY log: cushions along its thin end too (own stream), and one spruce sapling two metres
      // up the log from the bird, more than twice his height
    const gp = gr; gr = makeRng(hashSeed('peacock-perch:' + (ctx.seed ?? 0)));
    for (let i = 0; i < pLog.length; i++) {
      const q = pLog[i], top = q.y + q.r * 0.92; if (top < 0.07 || i === pIdx2 || i === pIdx2 - 1) continue;
      if (i > pIdx2) cushion(q.x + gr.range(-0.08, 0.08), top, q.z + gr.range(-0.08, 0.08), q.r * gr.range(0.75, 1.1) + 0.1, gr.range(0.07, 0.15));
      else if (i === pIdx2 - 3) { cushion(q.x, top, q.z, q.r * 1.1 + 0.12, 0.16); sapling(q.x, top + 0.1, q.z, 1.45); }
    }
    gr = gp;
  }
  const nEm = emergent.length, xo = makeRng(hashSeed('peacock-own:' + (ctx.seed ?? 0))); for (const tr of extra) { gr = tr.o.own ? xo : xr; gardenOn(tr); } gr = rng;
  const laidGardens = emergent.splice(nEm);                     // kept apart: the leaf rafts below are seeded from `emergent`
  // the stand: a ragged collar of moss and sedge on the white crust at every waterline; each broken stump carries a garden
  // (moss, sedge, a spruce sapling and one small gold or scarlet shrub: the living colour on the dead wood)
  gr = xs;
  const cDarkS = hex('#2c5a27'), cGoldL = P4.clone().multiplyScalar(0.95), cScarL = P6.clone().multiplyScalar(0.95);
  const bush = (x, y, z, Hb, col) => {
    for (let b = 0; b < 10; b++) {
      const a = xs() * 6.283, r = Hb * xs.range(0.08, 0.5), h = Hb * xs.range(0.35, 1), sz = Hb * xs.range(0.16, 0.25), k = xs.range(0.75, 1.2), ca = Math.cos(a), sa = Math.sin(a), cx = x + ca * r, cz = z + sa * r, cy = y + h;
      const s0 = gv(x - 0.02, y - 0.05, z, cStem, 1, 0), s1 = gv(x + 0.02, y - 0.05, z + 0.02, cStem, 1, 0), c = gv(cx, cy - sz * 0.6, cz, cStem, 1, 0.5);
      G.i.push(s0, s1, c); spray(cx, cy, cz, sz, col, k);
    }
  };
  for (let i = 0; i < stand.length; i++) {
    const t = stand[i], w = t.wl, n = t.near || t.kind === 2 ? 5 : 2;
    for (let m = 0; m < n; m++) { const a = (m + xs.range(-0.4, 0.4)) / n * 6.283, r = w.r * xs.range(0.95, 1.2); cushion(w.x + Math.cos(a) * r, xs.range(0.03, 0.55), w.z + Math.sin(a) * r, xs.range(0.3, 0.55), xs.range(0.14, 0.26), xs.range(0.7, 1.1), m % 2 ? cDarkS : null); }
    if (n > 3) for (let m = 0; m < 2; m++) { const a = xs() * 6.283; sedge(w.x + Math.cos(a) * w.r * 1.25, 0.1, w.z + Math.sin(a) * w.r * 1.25, 6, xs.range(0.5, 1.0)); }
    if (t.kind === 2) {
      const q = t.top, r = q.r * 1.2;
      for (let m = 0; m < 4; m++) { const a = xs() * 6.283, d = r * xs.range(0, 0.7); cushion(q.x + Math.cos(a) * d, q.y - 0.15, q.z + Math.sin(a) * d, r * xs.range(0.55, 0.9), xs.range(0.2, 0.34), xs.range(0.8, 1.15), m === 1 ? cDarkS : null); }
      sedge(q.x, q.y + 0.05, q.z, 7, xs.range(0.6, 0.95)); sapling(q.x - 0.15, q.y + 0.1, q.z + 0.1, xs.range(1.3, 1.9));
      bush(q.x + r * 0.5, q.y + 0.1, q.z - r * 0.3, xs.range(1.0, 1.4), i % 3 === 0 ? cScarL : cGoldL);
    }
    if (i % 12 === 11) await ctx.yield();
  }
  // THE MOSS GARDENS: every lifted root plate marked `garden` is a mound of moss cushions, bright and dark, with a fringe of
  // sedge and a pale collar of travertine crust at the waterline, three spruce saplings and one small gold or scarlet shrub:
  // it sits IN the lake, never on it.
  gr = makeRng(hashSeed('peacock-moss2:' + (ctx.seed ?? 0)));
  {
    const shrub = (x, y, z, Hb, col) => {
      for (let b = 0; b < 10; b++) {
        const a = gr() * 6.283, r = Hb * gr.range(0.08, 0.5), h = Hb * gr.range(0.35, 1), sz = Hb * gr.range(0.16, 0.25), k = gr.range(0.75, 1.2), ca = Math.cos(a), sa = Math.sin(a), cx2 = x + ca * r, cz2 = z + sa * r, cy2 = y + h;
        const s0 = gv(x - 0.02, y - 0.05, z, cStem, 1, 0), s1 = gv(x + 0.02, y - 0.05, z + 0.02, cStem, 1, 0), c = gv(cx2, cy2 - sz * 0.6, cz2, cStem, 1, 0.5);
        G.i.push(s0, s1, c); spray(cx2, cy2, cz2, sz, col, k);
      }
    };
    const cCrust = P3.clone().multiplyScalar(0.82);
    for (const { o } of extra) {
      if (!o.garden) continue;
      // (round 12: half as large again, 3.4 m across and up to 1.3 m high under saplings of 1.5-2.6 m: passing 6 m off, a garden is the subject of the frame)
      const R = o.r0 * 3.4, top = Math.max(0.6, o.y + o.r0 * 2.3), x0 = o.x + o.ax * o.r0 * 0.4, z0 = o.z + o.az * o.r0 * 0.4;
      // (a hummock, higher than it is wide at the middle and ragged at its edge: never a flat plate on the water)
      for (let m = 0; m < 14; m++) { const a = gr() * 6.283, r = R * Math.sqrt(gr()) * 0.92, h = top * 1.3 * (1 - 0.72 * r / R); cushion(x0 + Math.cos(a) * r, Math.max(0.05, h * gr.range(0.6, 1)), z0 + Math.sin(a) * r, gr.range(0.5, 0.9) * 1.3, gr.range(0.3, 0.55) * 1.2, gr.range(0.8, 1.2), m % 4 === 0 ? cDarkS : null); }
      for (let m = 0; m < 5; m++) { const a = m / 5 * 6.283 + gr.range(-0.5, 0.5); sedge(x0 + Math.cos(a) * R * 0.95, 0.04, z0 + Math.sin(a) * R * 0.95, 6, gr.range(0.5, 0.9)); }
      for (let m = 0; m < 3; m++) { const a = gr() * 6.283, r = R * gr.range(0.1, 0.5), h = (m === 0 ? gr.range(1.5, 1.9) : gr.range(0.9, 1.4)) * 1.35, x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r; sapling(x, top * 0.82, z, h); }
      shrub(x0 + gr.range(-0.5, 0.5) * R, top * 0.6, z0 + gr.range(-0.5, 0.5) * R, gr.range(1.0, 1.4) * 1.3, gr.chance(0.5) ? cScarL : cGoldL);
      for (let m = 0; m < 7; m++) { const a = m / 7 * 6.283 + gr.range(-0.35, 0.35), rr = R * gr.range(1.0, 1.18); cushion(x0 + Math.cos(a) * rr, 0.02, z0 + Math.sin(a) * rr, gr.range(0.3, 0.55), gr.range(0.07, 0.13), 1, cCrust); }   // a pale collar of crust where it meets the water
      await ctx.yield();
    }
  }
  await ctx.yield();
  // the sill: moss on the jam (a cushion on every log, sedge between them) and a broken line of cushions along the crest
  // itself, either side of the spill
  for (const tr of sillJam) {
    for (let i = 1; i < tr.s.length; i += 2) { const q = tr.s[i]; if (gr.chance(0.7)) cushion(q.x + gr.range(-0.1, 0.1), q.y + q.r * 0.9, q.z + gr.range(-0.1, 0.1), q.r * gr.range(0.9, 1.4) + 0.1, gr.range(0.12, 0.26), gr.range(0.8, 1.2), i % 4 === 1 ? cDarkS : null); }
    if (gr.chance(0.6)) sedge(tr.cx + gr.range(-1, 1), 0.7, tr.cz + gr.range(-1, 1), 7, gr.range(0.6, 1.0));
  }
  await ctx.yield();
  for (let a = -23; a <= 23; a += 1.3) {
    if (Math.abs(a) < 6.6 || !gr.chance(0.72)) continue;
    const al = gr.range(-0.5, 0.6), x = field.SX + PERP[0] * a + HEAD[0] * al, z = field.SZ + PERP[1] * a + HEAD[1] * al, y = Math.max(0.2, bedGrid(x, z));
    cushion(x, y + 0.02, z, gr.range(0.45, 0.95), gr.range(0.16, 0.34), gr.range(0.8, 1.2), gr.chance(0.35) ? cDarkS : null);
    if (gr.chance(0.3)) sedge(x + 0.3, y + 0.1, z, 6, gr.range(0.5, 0.9));
  }
  await ctx.yield();
  // the arch's garden: moss cushions (bright and dark) all along its upper side, sedge, three spruce saplings and two small
  // shrubs near the crown of the arch, a collar where it leaves and re-enters the water, and beards of pale lichen hanging
  // from its underside and its limbs (they sway)
  gr = xa;
  {
    const cLich = hex('#b4c2a0'), cLichD = hex('#6f8a4a');
    const topOf = (q, off) => [q.x + q.n[0] * q.r * 0.88 + q.b[0] * off, q.y + q.n[1] * q.r * 0.88 + q.b[1] * off, q.z + q.n[2] * q.r * 0.88 + q.b[2] * off];
    for (let i = 2; i < archS.length - 2; i++) {
      const q = archS[i]; if (q.y < 0.5) continue;
      const flat = clamp(q.n[1], 0, 1);
      for (let m = 0; m < 2; m++) if (xa() < 0.25 + 0.6 * flat) { const p = topOf(q, xa.range(-0.55, 0.55) * q.r); cushion(p[0] + xa.range(-0.3, 0.3), p[1], p[2], q.r * xa.range(0.4, 0.75), xa.range(0.14, 0.3), xa.range(0.8, 1.2), xa() < 0.35 ? cDarkS : null); }
      if (flat > 0.6 && xa() < 0.3) { const p = topOf(q, xa.range(-0.3, 0.3) * q.r); sedge(p[0], p[1] + 0.04, p[2], 6, xa.range(0.5, 0.95)); }
    }
    for (const t of [0.34, 0.45, 0.58]) { const q = archS[Math.round(t * (archS.length - 1))], p = topOf(q, xa.range(-0.2, 0.2)); sapling(p[0], p[1] + 0.05, p[2], xa.range(1.5, 2.6)); }
    for (const [t, col] of [[0.4, cGoldL], [0.52, cScarL]]) {
      const q = archS[Math.round(t * (archS.length - 1))], p = topOf(q, xa.range(-0.4, 0.4) * q.r), Hb = xa.range(1.1, 1.6);
      for (let b = 0; b < 10; b++) {
        const a = xa() * 6.283, r = Hb * xa.range(0.08, 0.5), h = Hb * xa.range(0.35, 1), sz = Hb * xa.range(0.16, 0.25), k = xa.range(0.75, 1.2), ca = Math.cos(a), sa = Math.sin(a), cx2 = p[0] + ca * r, cz2 = p[2] + sa * r, cy2 = p[1] + h;
        const s0 = gv(p[0] - 0.02, p[1] - 0.05, p[2], cStem, 1, 0), s1 = gv(p[0] + 0.02, p[1] - 0.05, p[2] + 0.02, cStem, 1, 0), c = gv(cx2, cy2 - sz * 0.6, cz2, cStem, 1, 0.5);
        G.i.push(s0, s1, c); spray(cx2, cy2, cz2, sz, col, k);
      }
    }
    for (let i = 1; i < archS.length; i++) {                      // the two waterlines
      const a = archS[i - 1], b = archS[i]; if ((a.y > 0) === (b.y > 0)) continue;
      const f = a.y / (a.y - b.y), wx = lerp(a.x, b.x, f), wz = lerp(a.z, b.z, f), wr = lerp(a.r, b.r, f) * 1.15;
      for (let m = 0; m < 7; m++) { const an = (m + xa.range(-0.4, 0.4)) / 7 * 6.283; cushion(wx + Math.cos(an) * wr, xa.range(0.03, 0.5), wz + Math.sin(an) * wr, xa.range(0.3, 0.6), xa.range(0.14, 0.26), xa.range(0.7, 1.1), m % 2 ? cDarkS : null); }
      for (let m = 0; m < 3; m++) { const an = xa() * 6.283; sedge(wx + Math.cos(an) * wr * 1.2, 0.1, wz + Math.sin(an) * wr * 1.2, 6, xa.range(0.6, 1.1)); }
    }
    const beard = (x, y, z, len, w0) => {                         // a hanging beard of lichen: a tapering ribbon, loose at its end
      const an = xa() * 6.283, px = Math.cos(an) * w0, pz = Math.sin(an) * w0, k = xa.range(0.75, 1.15), col = xa() < 0.3 ? cLichD : cLich, dx = xa.range(-0.12, 0.12), dz = xa.range(-0.12, 0.12); let prev = -1;
      for (let s = 0; s <= 4; s++) {
        const f = s / 4, ww = 1 - 0.85 * f, xx = x + dx * len * f * f, yy = y - len * f, zz = z + dz * len * f * f, fl = f * f * 2.4;
        const a = gv(xx - px * ww, yy, zz - pz * ww, col, k * (0.7 + 0.45 * f), fl), b = gv(xx + px * ww, yy, zz + pz * ww, col, k * (0.7 + 0.45 * f), fl);
        if (prev >= 0) G.i.push(prev, prev + 1, a, prev + 1, b, a); prev = a;
      }
    };
    for (let i = 4; i < archS.length - 3; i++) {
      const q = archS[i]; if (q.y < 3.2) continue;
      const sg = q.n[1] >= 0 ? 1 : -1;
      for (let m = 0; m < 2; m++) if (xa() < 0.62) { const off = xa.range(-0.7, 0.7) * q.r, y0 = q.y - Math.abs(q.n[1]) * q.r * 0.8; beard(q.x - q.n[0] * sg * q.r * 0.8 + q.b[0] * off + xa.range(-0.4, 0.4), y0, q.z + q.b[2] * off, Math.min(xa.range(0.9, 3.8), y0 - 0.6), xa.range(0.09, 0.24)); }
    }
    for (const lb of archL) if (lb.mid[1] > 3 && lb.rb > 0.12) for (const p of [lb.mid, lb.tip]) if (p[1] > 2.5) beard(p[0], p[1] - lb.rb * 0.5, p[2], Math.min(xa.range(0.8, 2.6), p[1] - 0.6), xa.range(0.08, 0.18));
  }
  await ctx.yield();
  await ctx.yield();
  // --- THE ISLAND: a travertine islet inside the right turn (the path rounds it 17 m off at u 0.59-0.66): a pale pedestal
  // rising from the bed, a white rim at the waterline, a mossy crown under leaf litter. The world plants its living trees
  // (anchors.island.trees: gold birches, scarlet maples, two spruces); here are the mound, its moss, sedge and shrubs.
  const ISL = { x: -41, z: -35.5, r: 7.5, trees: [] };
  {
    const isd = xa() * 50, rimR = (a) => ISL.r * (1 + 0.13 * Math.sin(a * 2 + isd) + 0.08 * Math.sin(a * 5 + isd * 3) + 0.05 * Math.sin(a * 9 + isd * 7));
    // (the dry cap is built in rimstone steps like the skirt: three treads round the mossy crown, each a hand of wall above
    // the next, their edges scalloped; the lowest stands a foot out of the water: a ledge of white travertine)
    const TL = [1.04, 0.8, 0.56, 0.32], TE = [[0.42, 0.438], [0.62, 0.638], [0.82, 0.838]];
    const tLobe = (a, k) => 1 + 0.05 * Math.sin(a * 4 + k * 2.1 + isd) + 0.03 * Math.sin(a * 7 + k * 3.7 + isd * 2);
    const topY = (dx, dz) => {
      const a = Math.atan2(dz, dx), q = Math.hypot(dx, dz) / rimR(a); let y = TL[3];
      for (let k = 0; k < 3; k++) { const L = tLobe(a, k); if (q < TE[k][1] * L) { y = lerp(TL[k], TL[k + 1], smoothstep(TE[k][0] * L, TE[k][1] * L, q)); break; } }
      return y + 0.04 * noise.n2(dx * 0.3 + isd, dz * 0.3) + 0.12 * (1 - smoothstep(0, 0.4, q));
    };
    ISL.heightAt = (x, z) => topY(x - ISL.x, z - ISL.z);
    // (its skirt goes down in six rimstone steps: [radius, depth] of each ring, a tread then a riser, the edge of every
    // step scalloped in lobes; a riser's top and foot share their lobes, so it never overhangs)
    const isl = makeAcc(), RG = [[1.02, -0.22], [1.12, -0.36], [1.15, -1.2], [1.33, -1.38], [1.37, -2.6], [1.62, -2.82], [1.67, -4.5],
      [2.0, -4.8], [2.06, -7.4], [2.48, -7.8], [2.56, -11.6], [3.05, -12.2], [3.3, -21]], NT = 8, NSI = 40, cRim = P3.clone().multiplyScalar(0.95);
    let lq = [0, 0, 0];
    loft(isl, NT + RG.length, NSI, (r, s, out) => {
      const a = (s / NSI) * 6.2832; let fr, lobe = 1;
      if (r < NT) { const k = (r - 1) >> 1; fr = r === 0 ? 0.2 : r === NT - 1 ? 0.985 : TE[k][(r - 1) & 1] * tLobe(a, k); }
      else { const q = Math.floor((r - NT + 1) / 2); fr = RG[r - NT][0]; lobe = 1 + 0.07 * Math.sin(a * 5 + q * 1.9 + isd) + 0.045 * Math.sin(a * 8 + q * 3.3 + isd * 2); }
      const rr = rimR(a) * fr * lobe, dx = Math.cos(a) * rr, dz = Math.sin(a) * rr;
      out[0] = ISL.x + dx; out[2] = ISL.z + dz; out[1] = r < NT ? topY(dx, dz) : Math.max(RG[r - NT][1] + 0.3 * noise.n2(dx * 0.2, dz * 0.2 + isd), bedGrid(out[0], out[2]) - 0.3); lq = out;
    }, (r, s, out) => {
      const m = r < 3 ? smoothstep(0.78, 1.08, lq[1] + 0.12 * noise.n2(lq[0] * 0.5, lq[2] * 0.5)) : 0;
      tmpC.copy(cRim).lerp(cMossB, m * 0.75); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b;
    }, (r) => r & 1, [ISL.x, topY(0, 0), ISL.z], null);
    await ctx.yield();
    add(new THREE.Mesh(await accToGeometryInSteps(isl, ctx.yield), mk(UW_VERT, UW_FRAG, { K_BED: 1, K_ISLE: 1 }, {}, { side: THREE.DoubleSide })));
    await ctx.yield();
    // the living trees: [dx, dz, kind (0 gold birch, 1 scarlet maple, 2 spruce), height]
    for (const [dx, dz, kind, H] of [[-1.6, -2.4, 0, 12.5], [2.9, 0.8, 0, 11], [-3.7, 2.4, 0, 9.5], [0.9, -4.3, 1, 9], [-4.6, -1.0, 1, 7.6], [3.6, -2.9, 1, 8.4], [0.4, 3.7, 1, 7], [4.7, 2.9, 2, 8], [-1.6, 5.0, 2, 5.6]]) {
      const x = ISL.x + dx + xa.range(-0.4, 0.4), z = ISL.z + dz + xa.range(-0.4, 0.4), h = H * xa.range(0.92, 1.08), y = ISL.heightAt(x, z);
      const out = Math.atan2(z - ISL.z, x - ISL.x), tr = { x, y, z, kind, h, out, yaw: xa() * 6.283 }; ISL.trees.push(tr);
    }
    for (let m = 0; m < 16; m++) { const a = xa() * 6.283, r = ISL.r * xa.range(0.1, 0.86), x = ISL.x + Math.cos(a) * r, z = ISL.z + Math.sin(a) * r; cushion(x, ISL.heightAt(x, z) + 0.02, z, xa.range(0.4, 0.9), xa.range(0.14, 0.3), xa.range(0.8, 1.15), m % 3 === 0 ? cDarkS : null); }
    for (let m = 0; m < 14; m++) { const a = xa() * 6.283, r = ISL.r * xa.range(0.7, 0.98), x = ISL.x + Math.cos(a) * r, z = ISL.z + Math.sin(a) * r; sedge(x, ISL.heightAt(x, z), z, 7, xa.range(0.6, 1.2)); }
    for (let m = 0; m < 5; m++) {
      const a0 = xa() * 6.283, r0 = ISL.r * xa.range(0.55, 0.85), x0 = ISL.x + Math.cos(a0) * r0, z0 = ISL.z + Math.sin(a0) * r0, y0 = ISL.heightAt(x0, z0), Hb = xa.range(1.2, 1.9), col = m % 2 ? cScarL : cGoldL;
      for (let b = 0; b < 12; b++) {
        const a = xa() * 6.283, r = Hb * xa.range(0.08, 0.55), h = Hb * xa.range(0.35, 1), sz = Hb * xa.range(0.16, 0.25), k = xa.range(0.75, 1.2), ca = Math.cos(a), sa = Math.sin(a), cx2 = x0 + ca * r, cz2 = z0 + sa * r, cy2 = y0 + h;
        const s0 = gv(x0 - 0.02, y0 - 0.05, z0, cStem, 1, 0), s1 = gv(x0 + 0.02, y0 - 0.05, z0 + 0.02, cStem, 1, 0), c = gv(cx2, cy2 - sz * 0.6, cz2, cStem, 1, 0.5);
        G.i.push(s0, s1, c); spray(cx2, cy2, cz2, sz, col, k);
      }
    }
  }
  gr = rng;
  await ctx.yield();

  // gate snags: a deep collar of dark moss and sedge at the waterline, a spruce sapling and moss in the crotch of the fork.
  // (The first pass draws the old small collar into a scratch buffer: it only keeps the seeded stream where it was.)
  const duckPerches = [], Gkeep = G, cDark = hex('#2c5a27'); G = makeAcc();
  snags.forEach(({ o, s }, k) => {
    for (let m = 0; m < 11; m++) { const a = m / 11 * 6.283 + rng.range(-0.2, 0.2), r = o.r0 * rng.range(0.85, 1.15); cushion(o.x + Math.cos(a) * r, rng.range(0.1, 0.42), o.z + Math.sin(a) * r, rng.range(0.22, 0.4), rng.range(0.1, 0.2)); }
    for (let m = 0; m < 3; m++) { const a = rng() * 6.283; sedge(o.x + Math.cos(a) * o.r0 * 1.1, 0.25, o.z + Math.sin(a) * o.r0 * 1.1, 6, rng.range(0.4, 0.8)); }
    const want = rng.range(4.8, 6.6); let q = s[0]; for (const e of s) if (Math.abs(e.y - want) < Math.abs(q.y - want)) q = e;
    const out = k === 0 ? 1 : -1, fx = q.x + PERP[0] * out * q.r * 0.8, fz = q.z + PERP[1] * out * q.r * 0.8;
    cushion(fx, q.y, fz, 0.42, 0.2); cushion(fx - HEAD[0] * 0.3, q.y - 0.12, fz - HEAD[1] * 0.3, 0.3, 0.16);
    sapling(fx + PERP[0] * out * 0.12, q.y + 0.12, fz + PERP[1] * out * 0.12, rng.range(1.15, 1.5)); sedge(fx, q.y + 0.1, fz, 6, 0.55);
  });
  G = Gkeep; gr = xg;
  snags.forEach(({ o, s }, k) => {
    let wl = s[0]; for (const e of s) if (Math.abs(e.y) < Math.abs(wl.y)) wl = e;                    // the trunk at the waterline
    // a ragged garden at the waterline, like those of the stand: low cushions of bright and dark moss lapping the crust (a
    // few climbing its shaded side), sedge standing out of it, one small gold or scarlet shrub
    for (let m = 0; m < 22; m++) {
      const a = m / 22 * 6.283 * 2 + xg.range(-0.25, 0.25), climb = m % 5 === 0 ? xg.range(0.5, 1.25) : 0, h = xg.range(0.02, 0.4) + climb, r = wl.r * (climb ? 1.0 : xg.range(1.05, 1.75));
      cushion(wl.x + Math.cos(a) * r, h, wl.z + Math.sin(a) * r, (climb ? xg.range(0.22, 0.36) : xg.range(0.3, 0.62)), xg.range(0.12, 0.26), xg.range(0.75, 1.15), m % 3 === 0 ? cDark : null);
    }
    for (let m = 0; m < 9; m++) { const a = m / 9 * 6.283 + xg.range(-0.3, 0.3), rr = wl.r * xg.range(1.3, 1.9); sedge(wl.x + Math.cos(a) * rr, 0.1, wl.z + Math.sin(a) * rr, 7, xg.range(0.6, 1.2)); }
    { const a = xg() * 6.283; bush(wl.x + Math.cos(a) * wl.r * 1.5, 0.25, wl.z + Math.sin(a) * wl.r * 1.5, xg.range(0.9, 1.3), k ? cScarL : cGoldL); }
    const f = gateFork[k], ca = Math.cos(f[3]), sa = Math.sin(f[3]);
    cushion(f[0], f[1], f[2], 0.6, 0.3, 1, cDark); cushion(f[0] - sa * 0.35, f[1] - 0.15, f[2] + ca * 0.35, 0.42, 0.22, 0.85, cDark); cushion(f[0] + sa * 0.3, f[1] - 0.2, f[2] - ca * 0.3, 0.4, 0.2, 0.75);
    sapling(f[0], f[1] + 0.15, f[2], xg.range(2.3, 2.8)); sedge(f[0] + ca * 0.25, f[1] + 0.12, f[2] + sa * 0.25, 7, 0.7);
    const pp = gatePerch[k]; cushion(pp[0], pp[1] - 0.05, pp[2], 0.3, 0.1, 0.7);                     // a pad of moss under the bird
    duckPerches.push(new THREE.Vector3(pp[0], pp[1] + 0.06, pp[2]));
  });
  gr = rng;
  await ctx.yield();
  add(new THREE.Mesh(await accToGeometryInSteps(G, ctx.yield), mk(UW_VERT, UW_FRAG, { K_GARDEN: 1 }, {}, { side: THREE.DoubleSide })));
  await ctx.yield();

  // --- carp shoals and their shadows ---
  const fa = makeAcc(), prof = [[0.34, 0.05, 0.05], [0.1, 0.095, 0.105], [-0.2, 0.07, 0.07], [-0.4, 0.022, 0.02]];
  loft(fa, 4, 4, (r, s, out) => { const a = s / 4 * 6.2832; out[0] = prof[r][0]; out[1] = Math.cos(a) * prof[r][1] - 0.01; out[2] = Math.sin(a) * prof[r][2]; }, (r, s, out) => { out[0] = out[1] = out[2] = 1; }, null, [0.5, 0, 0], null);
  const fb = fa.p.length / 3; fa.p.push(-0.4, 0, 0, -0.52, 0.11, 0, -0.52, -0.1, 0, 0.05, 0.085, 0, -0.18, 0.06, 0, -0.1, 0.15, 0); fa.i.push(fb, fb + 1, fb + 2, fb + 3, fb + 4, fb + 5);
  const fishBase = new THREE.BufferGeometry(); fishBase.setAttribute('position', new THREE.Float32BufferAttribute(fa.p, 3)); fishBase.setIndex(fa.i); fishBase.computeVertexNormals();
  // THREE SHOALS OF A HUNDRED (the design's count). Each hangs over one trunk of a top layer of the felled forest, chosen by
  // a rule from the wood itself: the top-layer trunk whose middle is nearest the path at the shoal's distance along it.
  //   0  on the right turn, over the trunk of the turn's top layer that comes nearest the path anywhere round the turn
  //   1  (round 13) UNDER THE GATE: over the white log that crosses under the path last before the sill (of the four gate
  //      logs, gateTops, the one whose middle lies nearest the path where it meets the sill, 87 m down the exit run). That
  //      log lies 0.7-1.4 m under the surface: the shoal hangs 0.4 m over its upper side, a hand under the surface, its
  //      loop four fifths of the log's length across the path, shadows on the wood. (It hung 96 m into the left arc, over a
  //      raft trunk 4 m down seen from 4 m up: specks.)
  //   2  on the left arc of pass two, over the trunk of the raft's top layer that comes nearest the path anywhere along
  //      that arc (the same scan as the turn's, over the arc's own stretch)
  // The shoal's loop is four fifths as long as its trunk and lies along it, a metre over its upper side and tilted as the
  // trunk is tilted, half a metre to either side of its line; the fishes' shadows fall on that upper side: 'fish hanging
  // with their shadows on the wood'. A carp is 0.6-1 m long and a fifth as broad as it is long, dark-backed: from 4-11 m
  // up, over bone-white wood, each is a dark stroke with its shadow beside it (it was a sliver a hand wide: not to be seen).
  const nFish = Math.max(60, Math.round(300 * detail)), aF = new Float32Array(nFish * 4), aF2 = new Float32Array(nFish * 2);
  const shoalC = [[-12, -36], [141, -53], [PORTAL[0] - HEAD[0] * 13, PORTAL[2] - HEAD[1] * 13]].map(([x, z]) => [x + rng.range(-4, 4), z + rng.range(-4, 4)]);
  const uShoal = [], uShoalR = [], shoals = [];
  shoalC.forEach(([x, z], i) => {                               // (the seeded stream's numbers, taken as ever; the places come from the rule below)
    const bed = bedGrid(x, z), y = Math.max(bed + (i === 0 ? 3 : 1.7), i === 0 ? -6.5 : -3.4);
    uShoal.push(new THREE.Vector4(x, y, z, rng() * 6.283)); uShoalR.push(new THREE.Vector4(rng.range(6.5, 10) * (i === 2 ? 0.6 : 1), rng.range(3, 5) * (i === 2 ? 0.7 : 1), rng.range(0.1, 0.16) * rng.sign(), bed + 0.75));
    shoals.push(new THREE.Vector3(x, y, z));
  });
  {
    const along = (d) => { let i = 1; while (i < path.length - 1 && cum[i] < d) i++; const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1]); return [lerp(path[i - 1][0], path[i][0], f), lerp(path[i - 1][2], path[i][2], f)]; };
    const over = (tops, d) => { const q = along(d); let b = null, bd = 1e9; for (const t of tops) { const dd = Math.hypot(t[0] - q[0], t[2] - q[1]); if (dd < bd) { bd = dd; b = t; } } return b || [q[0], -4.5, q[1], 0, 20, 0]; };
    // the trunk of a top layer whose middle comes nearest the path anywhere between two of its distances (every 2 m of it)
    const nearest = (tops, d0, d1) => { let b = null, bd = 1e9; for (let d = d0; d <= d1; d += 2) { const q = along(d); for (const t of tops) { const dd = Math.hypot(t[0] - q[0], t[2] - q[1]); if (dd < bd) { bd = dd; b = t; } } } return b; };
    // (cum[11]: the end of pass one; cum[20]: the end of the right turn; cum[36]: the end of the left arc. If a layer is
    // empty the shoal hangs under the middle of its stretch)
    const s0 = nearest(turnTops, cum[11], cum[20]) || over(turnTops, 0.5 * (cum[11] + cum[20]));
    const s2 = nearest(raftTops, cum[20], cum[36]) || over(raftTops, 0.5 * (cum[20] + cum[36])), sGate = over(gateTops, cum[36] + 87);
    [s0, sGate, s2].forEach((t, i) => {
      // (the shoal hangs a metre over the trunk's upper side, moved toward the sun by as much as its shadows are thrown: they fall on the wood;
      // over the gate's shallow log 0.42 m over it, and never nearer the surface than 0.3 m)
      const y = i === 1 ? Math.min(-0.3, t[1] + 0.42) : Math.min(-1.2, t[1] + 1), kS = (y - t[1]) / Math.max(sunU.y, 0.2), cxS = t[0] + sunU.x * kS, czS = t[2] + sunU.z * kS;
      uShoal[i].set(cxS, y, czS, t[3]); uShoalR[i].set(Math.min(11, t[4] * 0.4), clamp(t[5], -0.12, 0.12), uShoalR[i].z, t[1] + 0.05); shoals[i].set(cxS, y, czS);
    });
  }
  const fishN = [0, 0, 0], fishAt = [0, 0, 0];
  for (let i = 0; i < nFish; i++) fishN[i % 3]++;
  fishAt[1] = fishN[0]; fishAt[2] = fishN[0] + fishN[1];
  const fishFrom = fishAt.slice();
  for (let i = 0; i < nFish; i++) {
    // (the same fish from the same draws in the same order; each is stored in its shoal's own run of the arrays, so that
    // each shoal is a mesh of its own and can be left undrawn while the lens is far from it: see setLens)
    const sh = i % 3, o = fishAt[sh]++;
    aF[o * 4] = sh; aF[o * 4 + 1] = rng.gauss() * 2.6; aF[o * 4 + 2] = rng.gauss() * 1.1 * 0.42; aF[o * 4 + 3] = clamp(rng.gauss() * 0.32, -0.7, 0.7);
    aF2[o * 2] = rng(); aF2[o * 2 + 1] = rng.range(0.24, 0.4) * 2.5;       // (carp drawn large enough to be seen from 4-11 m up)
    aF[o * 4 + 3] *= 0.5;
  }
  const instGeo = (base, sh) => {
    const g = new THREE.InstancedBufferGeometry(), a = aF.subarray(fishFrom[sh] * 4, (fishFrom[sh] + fishN[sh]) * 4), b = aF2.subarray(fishFrom[sh] * 2, (fishFrom[sh] + fishN[sh]) * 2);
    g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
    g.setAttribute('aFish', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aFish2', new THREE.InstancedBufferAttribute(b, 2)); g.instanceCount = fishN[sh]; return g;
  };
  const shoalU = { uShoal: { value: uShoal }, uShoalR: { value: uShoalR } };
  const quad = new THREE.BufferGeometry();
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5], 3));
  quad.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2)); quad.setIndex([0, 2, 1, 1, 2, 3]);
  const fishMat = mk(FISH_VERT, FISH_FRAG, {}, shoalU, { side: THREE.DoubleSide }), fishShMat = mk(SHADOW_VERT, SHADOW_FRAG, { K_INST: 1 }, shoalU, shadowParams), shoalMesh = [];
  for (let sh = 0; sh < 3; sh++) shoalMesh.push([add(new THREE.Mesh(instGeo(fishBase, sh), fishMat)), add(new THREE.Mesh(instGeo(quad, sh), fishShMat), 1)]);
  await ctx.yield();

  // --- the surface: mirror, gust, window ---
  const ZS1 = opts.surfZ ?? Z1, surf = new THREE.BufferGeometry(), SNX = 32, SNZ = Math.round((ZS1 - Z0) / 15.44), sfP = [], sfS = [], sfI = [];
  for (let j = 0; j <= SNZ; j++) for (let i = 0; i <= SNX; i++) { const x = X0 + (X1 - X0) * i / SNX, z = Z0 + (ZS1 - Z0) * j / SNZ; sfP.push(x, 0, z); sfS.push(Math.abs(x + 100) < 62 && z > 200 ? -1 : field.sdf(x, z)); }   // (the outlet: the lake's water lies level across the whole head of the shoal, to its crest (opts.surfZ); the world's ground stands out of it or lies under it)
  for (let j = 0; j < SNZ; j++) for (let i = 0; i < SNX; i++) { const a = j * (SNX + 1) + i, b = a + 1, c = a + SNX + 1, d = c + 1; if (Math.min(sfS[a], sfS[b], sfS[c], sfS[d]) < 13) sfI.push(a, c, b, b, c, d); }
  surf.setAttribute('position', new THREE.Float32BufferAttribute(sfP, 3)); surf.setIndex(sfI);
  const surfU = { uSky: { value: new THREE.Vector4(sk.treeHeight, sk.slopeTan, sk.axisTan, sk.peakTan) }, uPeakW: { value: sk.peakWidth },
    uSnagA: { value: new THREE.Vector3(gateBase[0][0], gateBase[0][1], 0.55) }, uSnagB: { value: new THREE.Vector3(gateBase[1][0], gateBase[1][1], 0.6) },
    uPortal: { value: new THREE.Vector4(PORTAL[0], PORTAL[1], PORTAL[2], opts.portalRadius ?? 6.5) }, uPortalN: { value: new THREE.Vector2(HEAD[0], HEAD[1]) }, uPortalCol: { value: hex(opts.portalColor || '#bfe6ff').multiplyScalar(1.1) }, uEndZ: { value: ZS1 } };
  const mirrorMesh = add(new THREE.Mesh(surf, mk(SURF_VERT, SURF_FRAG, {}, surfU, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide })), 2);
  await ctx.yield();
  // the stand's image in the water: its simple twins, mirrored and laid on the surface along the eye's own rays
  const reflMesh = add(new THREE.Mesh(await accToGeometryInSteps(refl, ctx.yield), mk(REFL_VERT, REFL_FRAG, {}, {}, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide })), 2.4);
  await ctx.yield();

  // --- leaves afloat: rafts by the shores and the snag gardens, strays everywhere ---
  const nLeaf = Math.round(1500 * (season === 'late' ? 2.2 : season === 'june' ? 0.3 : 1) * detail), aL = new Float32Array(nLeaf * 4), aL2 = new Float32Array(nLeaf * 2), rafts = [];
  for (let i = 0; i < 16; i++) {
    for (let t = 0; t < 30; t++) { const x = rng.range(-140, 230), z = rng.range(-165, 230), s = field.sdf(x, z); if (s < -3 && s > -45) { rafts.push([x, z, rng.range(2, 6.5)]); break; } }
  }
  for (const e of emergent) if (rng.chance(0.6)) rafts.push([e.x + rng.range(-2, 2), e.z + rng.range(1, 4), rng.range(1.2, 3)]);
  for (let i = 0; i < nLeaf; i++) {
    let x = 0, z = 0;
    for (let t = 0; t < 20; t++) {
      if (i % 5 < 3 && rafts.length) { const r = rafts[(i * 7 + t) % rafts.length]; x = r[0] + rng.gauss() * r[2]; z = r[1] + rng.gauss() * r[2] * 0.7; } else { x = rng.range(-145, 235); z = rng.range(-170, 235); }
      if (field.sdf(x, z) < -0.8) break;
    }
    aL[i * 4] = x; aL[i * 4 + 1] = z; aL[i * 4 + 2] = rng() * 6.283; aL[i * 4 + 3] = rng.range(0.16, 0.3); aL2[i * 2] = rng(); aL2[i * 2 + 1] = rng();
    if (i % 100 === 0) await ctx.yield();
  }
  const leafGeo = new THREE.InstancedBufferGeometry(); leafGeo.index = quad.index; leafGeo.setAttribute('position', quad.attributes.position); leafGeo.setAttribute('uv', quad.attributes.uv);
  leafGeo.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(aL, 4)); leafGeo.setAttribute('aLeaf2', new THREE.InstancedBufferAttribute(aL2, 2)); leafGeo.instanceCount = nLeaf;
  const leafMat = mk(LEAF_VERT, LEAF_FRAG, {}, {}, { side: THREE.DoubleSide });
  add(new THREE.Mesh(leafGeo, leafMat), 3);
  // more leaves afloat for the world's other waters: list of [x, z, rotation, size, colourPick, phase]; the mesh floats at local y = 0
  const makeLeaves = (list) => {
    const n = list.length, a = new Float32Array(n * 4), b = new Float32Array(n * 2), g = new THREE.InstancedBufferGeometry();
    for (let i = 0; i < n; i++) { const l = list[i]; a[i * 4] = l[0]; a[i * 4 + 1] = l[1]; a[i * 4 + 2] = l[2]; a[i * 4 + 3] = l[3]; b[i * 2] = l[4]; b[i * 2 + 1] = l[5]; }
    g.index = quad.index; g.setAttribute('position', quad.attributes.position); g.setAttribute('uv', quad.attributes.uv);
    g.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aLeaf2', new THREE.InstancedBufferAttribute(b, 2)); g.instanceCount = n;
    const m = new THREE.Mesh(g, leafMat); m.frustumCulled = false; m.renderOrder = 3; return m;
  };

  {                                                             // a raft of leaves on the line of pass one (the gust slides it under the lens at u 0.45), strays drifting through the gate
    const ll = [];
    for (let i = 0; i < 130; i++) ll.push([-100 + xg.gauss() * 2.6, 75 + xg.gauss() * 5, xg() * 6.283, xg.range(0.17, 0.3), xg(), xg()]);
    for (let i = 0; i < 70; i++) { const q = onPath(xg.range(34, 80), 0, xg.gauss() * 4.5, 0); ll.push([q[0], q[2], xg() * 6.283, xg.range(0.16, 0.28), xg(), xg()]); }
    add(makeLeaves(ll), 3);
  }

  // --- the inflow over the sill ---
  const spP = [], spU = [], spI = [], prf = [[40, 0.7], [26, 0.7], [14, 0.7], [6, 0.7], [2, 0.7], [0.9, 0.71], [0.3, 0.72], [-0.2, 0.66], [-0.7, 0.42], [-1.1, 0.18], [-1.5, 0.045], [-2.4, 0.03], [-4.6, 0.03]];
  for (let r = 0; r < prf.length; r++) for (let c = 0; c <= 42; c++) { const ac = c - 21, al = prf[r][0]; spP.push(field.SX + PERP[0] * ac + HEAD[0] * al, prf[r][1], field.SZ + PERP[1] * ac + HEAD[1] * al); spU.push(ac, al); }
  for (let r = 0; r < prf.length - 1; r++) for (let c = 0; c < 42; c++) { const a = r * 43 + c, b = a + 1, d = a + 43, e = d + 1; spI.push(a, d, b, b, d, e); }
  const spill = new THREE.BufferGeometry(); spill.setAttribute('position', new THREE.Float32BufferAttribute(spP, 3)); spill.setAttribute('uv', new THREE.Float32BufferAttribute(spU, 2)); spill.setIndex(spI);
  add(new THREE.Mesh(spill, mk(SPILL_VERT, SPILL_FRAG, {}, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide })), 3);
  await ctx.yield();

  // --- optional backdrop: the shore forest the mirror doubles ---
  if (opts.backdrop !== false) {
    const snow = season === 'snow' ? 0.35 : 0, white = hex('#E8EEF5');
    const soft = [], bAcc = makeAcc(), ico1 = new THREE.IcosahedronGeometry(1, 1), ico0 = new THREE.IcosahedronGeometry(1, 0);
    const blob = (geo, cx0, cy0, cz0, rx, ry, rz, sd) => {
      const p = geo.attributes.position, b = bAcc.p.length / 3;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.3 * noise.n3(x * 1.9 + sd, y * 1.9, z * 1.9), sh = (0.5 + 0.5 * y) * (0.85 + 0.3 * noise.n3(x * 3 + sd, y * 3, z * 3));
        bAcc.p.push(cx0 + x * rx * k, cy0 + y * ry * k, cz0 + z * rz * k); bAcc.c.push(0.5 + 0.55 * sh, 0.5 + 0.55 * sh, 0.5 + 0.55 * sh); bAcc.f.push(0.35 + 0.65 * (0.5 + 0.5 * y)); bAcc.i.push(b + i); soft.push(x, y / (ry / rx), z);
      }
    };
    loft(bAcc, 3, 5, (r, s, out) => { const a = s / 5 * 6.2832, rr = 0.02 - r * 0.006; out[0] = Math.cos(a) * rr + r * 0.012; out[1] = r * 0.24; out[2] = Math.sin(a) * rr; }, (r, s, out) => { out[0] = out[1] = out[2] = 0.3; }, () => 0);
    const nTrunk = bAcc.p.length / 3;
    blob(ico1, 0, 0.62, 0, 0.25, 0.4, 0.25, 3.1); blob(ico0, 0.17, 0.46, 0.08, 0.17, 0.2, 0.17, 7.7); blob(ico0, -0.13, 0.5, -0.14, 0.17, 0.22, 0.17, 12.3); blob(ico0, -0.05, 0.42, 0.17, 0.15, 0.17, 0.15, 21.9);
    const birchGeo = accToGeometry(bAcc), sAcc = makeAcc(), bn = birchGeo.attributes.normal;
    for (let i = 0; i < soft.length / 3; i++) { const l = Math.hypot(soft[i * 3], soft[i * 3 + 1], soft[i * 3 + 2]) || 1; bn.setXYZ(nTrunk + i, soft[i * 3] / l, soft[i * 3 + 1] / l, soft[i * 3 + 2] / l); }
    for (let t = 0; t < 7; t++) {
      const f = t / 7, yTop = 0.2 + 0.8 * Math.pow(f + 1 / 7, 0.85), yBot = 0.1 + 0.74 * f, R = 0.2 * (1 - f * 0.86), b = sAcc.p.length / 3;
      sAcc.p.push(0, yTop, 0); sAcc.c.push(0.45, 0.45, 0.45); sAcc.f.push(0.5 * f);
      for (let s = 0; s < 8; s++) { const a = s / 8 * 6.2832 + t * 0.5, rr = R * (s % 2 ? 0.72 : 1.08); sAcc.p.push(Math.cos(a) * rr, yBot - (s % 2 ? 0 : 0.035), Math.sin(a) * rr); const k = s % 2 ? 0.7 : 1.15; sAcc.c.push(k, k, k); sAcc.f.push(0.3 + 0.7 * f); sAcc.i.push(b, b + 1 + s, b + 1 + (s + 1) % 8); }
    }
    const spruceGeo = accToGeometry(sAcc), treeMat = mk(UW_VERT, UW_FRAG, { K_TREE: 1 }, {}, { side: THREE.DoubleSide });
    const nB = Math.round(250 * (0.6 + 0.4 * detail)), nS = Math.round(230 * (0.6 + 0.4 * detail)), birch = new THREE.InstancedMesh(birchGeo, treeMat, nB), spruce = new THREE.InstancedMesh(spruceGeo, treeMat, nS);
    const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), ps = new THREE.Vector3(), sc = new THREE.Vector3(), yAx = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    let ib = 0, is = 0;
    for (let t = 0; t < 9000 && (ib < nB || is < nS); t++) {
      const x = rng.range(X0 + 6, X1 - 6), z = rng.range(Z0 + 6, Z1 - 6), s = field.sdf(x, z); if (s < 3.5 || s > 43) continue;
      const q = field.sill(x, z); if ((Math.abs(x + 100) < 24 && z > 195) || (Math.abs(q.across) < 27 && q.along > -6)) continue;
      const isSpruce = s > 12 && rng.chance(s > 26 ? 0.8 : 0.4); if (isSpruce ? is >= nS : ib >= nB) continue;
      const h = isSpruce ? rng.range(15, 27) : rng.range(11, 19), w = h * rng.range(0.9, 1.3);
      ps.set(x, bedGrid(x, z) - 0.3, z); qt.setFromAxisAngle(yAx, rng() * 6.283); sc.set(w, h, w * rng.range(0.85, 1.15)); m4.compose(ps, qt, sc);
      if (isSpruce) { col.copy(P5).multiplyScalar(rng.range(1.6, 2.6)).lerp(white, snow * 1.4); spruce.setMatrixAt(is, m4); spruce.setColorAt(is++, col); } else {
        const r = rng(); col.copy(r < 0.56 ? gold : r < 0.78 ? scar : r < 0.9 ? green : mixc(gold, scar, 0.5)).multiplyScalar(rng.range(0.8, 1.2)).offsetHSL(rng.range(-0.015, 0.015), 0, 0).lerp(white, snow);
        birch.setMatrixAt(ib, m4); birch.setColorAt(ib++, col);
      }
      if (t % 1500 === 0) await ctx.yield();
    }
    birch.count = ib; spruce.count = is; birch.instanceMatrix.needsUpdate = true; spruce.instanceMatrix.needsUpdate = true;
    add(birch); add(spruce); ico1.dispose(); ico0.dispose();
    const rp = [], ri = [], RR = 2600;
    for (let i = 0; i <= 72; i++) { const a = i / 72 * 6.2832; rp.push(Math.cos(a) * RR, -40, Math.sin(a) * RR, Math.cos(a) * RR, 2080, Math.sin(a) * RR); if (i < 72) ri.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const f0 = rp.length / 3, fo = RR * 0.7;
    for (const [x, z] of [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1], [-fo, -fo], [fo, -fo], [fo, fo], [-fo, fo]]) rp.push(x, 2, z);
    for (let k = 0; k < 4; k++) { const a = f0 + k, b = f0 + (k + 1) % 4; ri.push(a, b, a + 4, b, b + 4, a + 4); }
    const ringGeo = new THREE.BufferGeometry(); ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); ringGeo.setIndex(ri);
    add(new THREE.Mesh(ringGeo, mk(SURF_VERT, RING_FRAG, {}, surfU, { side: THREE.DoubleSide, transparent: true, depthWrite: false })), -0.5);
  }
  await ctx.yield();

  // --- anchors, progress, hand-off ---
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V3(PORTAL[0], PORTAL[1], PORTAL[2]), facing: V3(-HEAD[0], 0, -HEAD[1]), radius: 6.5, tiltDeg: 3 },
    gate: gateBase.map(([x, z]) => V3(x, 0, z)), sill: V3(field.SX, 0.72, field.SZ),
    flyThrough: flyPath.map((p) => V3(p[0], p[1], p[2])),
    outlet: V3(-100, 0, 232), entry: V3(-100, 1.3, 225),
    viewpoints: {
      mirror: { position: V3(-100, 1.3, 150), target: V3(-100, 0.6, 60) },
      turnTop: { position: V3(-45, 16, -50), target: V3(5, -8, -8) },
      shelf: { position: V3(138, 1.3, -34), target: V3(157, 0.6, -56) },
    },
    tangle: V3(4, -19, -12),
    // (his place on the log; `from`: a pace up the log toward its butt; `facing`: down the log toward the path and a little
    // back along it, so the lens coming up the shelf sees him side-on, tail and all; `abeam`: the path's point at the
    // journey's u 0.885, from which he stands 7 m to the right; `log`: the way the log runs away from the path)
    pheasantPerch: { position: V3(pLog[pIdx2].x, pLog[pIdx2].y + pLog[pIdx2].r * 0.9, pLog[pIdx2].z), from: V3(pLog[pIdx2 - 1].x, pLog[pIdx2 - 1].y + pLog[pIdx2 - 1].r * 0.9, pLog[pIdx2 - 1].z),
      radius: pLog[pIdx2].r, facing: V3(-pDir[0] * 0.94 - fwd[0] * 0.34, 0, -pDir[1] * 0.94 - fwd[1] * 0.34), abeam: V3(J885.x, J885.y, J885.z), log: V3(pDir[0], 0, pDir[1]) },
    duckPerches, shoals, emergent: emergent.concat(laidGardens), standPerches, stand: stand.map((t) => V3(t.x, t.H, t.z)),
    island: ISL, arch: archS.map((q) => V3(q.x, q.y, q.z)),
  };
  const setGust = (frontZ, healZ) => { shared.uFrontZ.value = frontZ; shared.uHealZ.value = healZ; };
  // setProgress(u): the journey's beats on the water, and nothing else. The gust is ONE front: it crosses the lens on pass
  // one at gustU and runs on up the lake (+Z) at 1500 m per unit u. The calm returns as one front too, from the head of the
  // lake (-Z): it is born 90 m beyond the lake's head at healU and travels at 2000 m per unit u, so with the world's healU
  // (0.74) it comes onto the lake's water behind the gate at u 0.79-0.80 ('calm returns from the head of the lake after
  // u 0.80') and the mirror heals toward the lens from there; nothing else stills the far water.
  // The lee of still water round the west grove (centre (-66, -4), radii 56 x 80 m: drawn in to that grove alone, clear of
  // the felled forest under the turn) breaks over u 0.525-0.565. Those are the live round's own edges, put back (round 11
  // had them 0.01 earlier for no reason): the lens comes in among the grove's trunks at u 0.53-0.56, the last 30 m of pass
  // one, and the journey's window 'opens from the nose outward' there. There is no second lee: over the whole felled forest
  // the mirror stays broken until the calm's front heals it.
  const setProgress = (u) => {
    setGust(132 + (u - gustU) * 1500, u < healU ? -400 : -260 + (u - healU) * 2000);
    shared.uLee.value.set(-66, -4, 1 - smoothstep(0.525, 0.565, u)); shared.uLeeR.value.set(56, 80);
  };
  // setLens(x, y, z, dx, dy, dz): the lens's own place and the way it looks (unit vector), each frame. What it cannot see is
  // left undrawn, by rules of the world only (no u): nothing is made or compiled, only what is drawn changes. Until it is
  // called everything is drawn.
  //   sunk wood north of z = 60: drawn once the lens is higher than 0.45 m under the lake's level (lower than that, on the
  //     climb up the fall and the shoal, the lake is hidden by its own rim)
  //   sunk wood south of z = 60: drawn once the lens is also south of z = 145, within 85 m of the nearest of it (from 1.3 m
  //     over the water nothing under it shows further off than that)
  //   the wood sunk under pass one itself (the box x -150..-62, z 12..235, to the bed): not drawn while every corner of that
  //     box lies behind the plane of the lens (astern: no ray of the picture can reach it)
  //   each carp shoal: drawn while the lens is within 75 m of it over the ground (under three metres of water a carp
  //     further off than that is less than a pixel)
  //   (round 13) the mirror and the stand's image on it: drawn once the lens is higher than 0.45 m under the lake's level
  //     (the same rule as the sunk wood: from lower than the water's own plane, behind the crest that holds it, no ray
  //     reaches its upper side)
  //   (round 13) the lake's floor and banks (one mesh): not drawn while the lens is more than 14 m under the lake's level
  //     and north of z = 352 (down in the slot and on the lower lake: a ray from there over the fall's lip or up the slot
  //     clears the lake's rim by 9 m and more, and its banks stand under 9 m)
  const BOXW = [-160, -62, 12, 240, -21, 0];
  const setLens = (x, y, z, dx, dy, dz) => {
    const up = y > -0.45, south = up && z < 145;
    let ahead = false;
    for (let c = 0; c < 8 && !ahead; c++) ahead = (BOXW[c & 1] - x) * dx + (BOXW[4 + ((c >> 2) & 1)] - y) * dy + (BOXW[2 + ((c >> 1) & 1)] - z) * dz > 0;
    sunkNorth.visible = up; sunkNorthW.visible = up && ahead; sunkSouth.visible = south; sunkAft.visible = south && ahead;
    for (let i = 0; i < 3; i++) { const on = Math.hypot(shoals[i].x - x, shoals[i].z - z) < 75; shoalMesh[i][0].visible = on; shoalMesh[i][1].visible = on; }
    mirrorMesh.visible = up; reflMesh.visible = up; bedMesh.visible = !(y < -14 && z > 352);
  };
  setProgress(opts.progress ?? 0.283);
  return {
    object: root, radius: 14, height: 34, center: V3(8, 8.5, -14), anchors, ground: false, groundY: 0,
    extent: { minX: -150, maxX: 240, minZ: -175, maxZ: 240 }, lake: { sdf: field.sdf, bedAt: field.bedAt, level: 0, sillLevel: 0.7 },
    uniforms: shared, setProgress, setLens, setGust, makeLeaves, tint,
    update(dt, time) { shared.uTime.value = time; },
    dispose() {},
  };
}
