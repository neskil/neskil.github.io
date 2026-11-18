// valley-inside-the-works: THE GREAT PIPE (the world builder's; the plan's GREAT_PIPE: the thing this hall is known
// by). ONE WIDE GLASS PIPE, 3.4 m across, comes down plumb from the roof into the lower river on our right, 80 m up
// the valley from the entry, and the river's liquid climbs inside it. From the entry on it is the first big thing
// ahead on the right, and the flown line passes it close (counted in build, see greatClear at the foot of this file).
// GLASS AND LIQUID are the rank's own, scaled up, and THE PIPE IS SEEN TO BE GLASS: the liquid does not fill it but
// is drawn up in SLUGS, each with a rounded top and a ragged, dripping tail, with CLEAR LENGTHS between them through
// which the hall behind is seen; they climb 1.8 m a second by the world's clock, from a start the seed deals (the
// law of the slugs and all the shaders: …-pipes-great-glsl.js). TWO MESHES, two draw calls (buildGreat, below): the liquid
// (the bore's wall, on which the shader says where a slug stands, and the slugs' rounded tops, which the vertex
// shader carries up); and the glass, drawn after everything with both its sides, so that its far wall is seen
// through the pipe in the clear lengths: the same thick clear glass as the rank's, the grey-green band of its wall
// along both edges (0.17 m thick here), its rim and its cut ends at the joints lit, and the long highlight. The
// glass goes down to its mouth, the plan's GREAT_PIPE.under below the river's level (the plan's liquidY), where
// the river hides it; the liquid's mesh begins a hand under the river's level. The froth round its foot is the
// chocolate part's.
// IRON, in the shed's green, in the rank's iron mesh:
//   A FLANGED JOINT every 6 m of glass, the lowest at height 7, a little under the flown line where it passes: two
//   rings clasped together, the dark seam between them, sixteen square-headed bolts standing through both, and a
//   short hub either side in which the glass is seated.
//   A STAY at each height of the plan's GREAT_PIPE.stays (22 and 40, each midway between two joints): a riveted
//   hoop round the glass, and from it two flat riveted bars, one to each of the two columns of the row x = 14 that
//   stand either side of the pipe (z 60 and z 80), each ending in a hoop round the column's shaft, which it meets
//   on the nave side, clear of the column's rain pipe.
//   THE COLLAR in which it goes out through the roof: a plain iron drum round the pipe, from the level of the
//   roof's valleys (52) up through the boarded slope, closed underneath by a ring, with a flashing plate lapping
//   the boards round it. The drum is as deep as the roof's own ironwork there: the light truss at x = 10 and two
//   purlins cross the pipe's place and are seen to run into the drum, never through the glass.
// Nothing here is cut, sized or shown by the eye's place (what its shaders read of the eye is said at their places),
// and it has no light of its own.
import * as P from './valley-inside-the-works-plan.js';
import { IRON } from './valley-inside-the-works-pipes-iron.js';
import { SLUG, GREAT_VERT, GREAT_LIQUID_FRAG, GREAT_GLASS_FRAG } from './valley-inside-the-works-pipes-great-glsl.js';

const G = P.GREAT_PIPE, R = G.across / 2;            // the glass's outer radius
const SIDES = 32;                                    // faces round the pipe and round its rings
// the bore's radius as a share of the glass's (the wall is the rest, seen as a band), and the liquid's speed up the
// pipe, metres a second
const GREAT = { share: 0.9, speed: 1.8 };
// a joint: the lowest one's height, metres from one to the next, its rings' outer radius, one ring's thickness,
// its bolts, a hub's height; a stay: its hoop's radius and half height, the rivets round it, the radius of a
// column's hoop, and how far to the nave side of a column's axis a bar is aimed; the collar: its drum's radius,
// its flashing plate's width
const JOINT = { first: 7, step: 6, r: R + 0.35, half: 0.25, bolts: 16, hub: 0.32 };
const STAY = { r: R + 0.14, half: 0.3, rivets: 26, hoop: 0.9, aim: 0.5 };
const DRUM = { r: R + 0.35, lap: 0.45 };

// the underside of the roof's boarded slope over a place z, by the plan's SHED numbers: it climbs from the valley
// gutter next downstream (they lie every SHED.bay) to the ridge, SHED.ridgeBack up the valley from that gutter
function roofY(z) {
  const S = P.SHED, v = Math.ceil(z / S.bay) * S.bay;
  return S.roofValley + (S.roofRidge - S.roofValley) * (v - z) / S.ridgeBack;
}
// the pipe's heights: the river's level, the glass's mouth, the drum's underside, where glass and liquid end
// (just inside the drum), and the joints (none within 2.5 m of the drum)
function levels() {
  const yS = P.liquidY(G.z), yDrum = P.SHED.roofValley, joints = [];
  for (let y = JOINT.first; y <= yDrum - 2.5; y += JOINT.step) joints.push(y);
  return { yS, yMouth: yS - G.under, yDrum, yTop: yDrum + 0.3, joints };
}

// The points of a round about the pipe's axis: radius r, at height y (a number, or for a round that lies in the
// roof's slope a function of the point's z), going from +z toward +x; the last repeats the first. OUT: the outward
// direction at each of them.
function round(r, y) {
  const out = [];
  for (let j = 0; j <= SIDES; j++) {
    const f = (j / SIDES) * Math.PI * 2, z = G.z + r * Math.cos(f);
    out.push([G.x + r * Math.sin(f), typeof y === 'function' ? y(z) : y, z]);
  }
  return out;
}
const OUT = round(1, 0).map((p) => [p[0] - G.x, 0, p[2] - G.z]);
// A band of iron between two rounds a and b, lit along nrm (one direction for all, or one for each point). Its
// front is on the side on which, going round, b lies to the left of a's way: outward when a is under b, downward
// when a is inside b, upward when a is outside b. paint(j, end) gives what is painted at point j of a (end 0) or of
// b (end 1), as the iron's shader reads it (u, v, kind); without it the band is plain.
function band(M, a, b, nrm, colr, paint) {
  const first = M.pos.length / 3, each = typeof nrm[0] !== 'number';
  for (let j = 0; j < a.length; j++) {
    const n = each ? nrm[j] : nrm, pa = paint ? paint(j, 0) : [0, 0, 0], pb = paint ? paint(j, 1) : [0, 0, 0];
    M.v(a[j], n, colr, pa[0], pa[1], pa[2]);
    M.v(b[j], n, colr, pb[0], pb[1], pb[2]);
  }
  for (let j = 0; j + 1 < a.length; j++) { const q = first + 2 * j; M.idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
}

// A FLANGED JOINT at height y: two rings clasped together round the glass (their rim painted with the dark seam
// between them), JOINT.bolts square-headed bolts standing through both, a head above and a nut below, and on
// either side a short hub in which a glass length is seated.
function greatJoint(M, y) {
  const r = JOINT.r, h = JOINT.half, rc = R + 0.19, rh = R + 0.07;
  band(M, round(r, y - h), round(r, y + h), OUT, IRON.sage, (j, end) => [end ? 1 : -1, j / SIDES, 1]);
  band(M, round(r, y + h), round(R + 0.02, y + h), [0, 1, 0], IRON.sage);
  band(M, round(R + 0.02, y - h), round(r, y - h), [0, -1, 0], IRON.sage);
  band(M, round(rh, y + h), round(rh, y + h + JOINT.hub), OUT, IRON.sageDark);
  band(M, round(rh, y - h - JOINT.hub), round(rh, y - h), OUT, IRON.sageDark);
  for (let k = 0; k < JOINT.bolts; k++) {
    const f = (k + 0.5) / JOINT.bolts * Math.PI * 2, d = [Math.sin(f), 0, Math.cos(f)];
    M.box([G.x + rc * d[0], y, G.z + rc * d[2]], [0, 1, 0], d, [d[2], 0, -d[0]], h + 0.12, 0.085, 0.085, IRON.sageDark);
  }
}
// A STAY at height y: a hoop of riveted iron round the glass (two rows of rivets), and from a lug on it a flat bar
// on edge, riveted, to each of the two columns of the row x = COLUMN_X[2] that stand either side of the pipe (the
// rows next up and next down the valley from it). A bar is aimed STAY.aim to the nave side of its column's axis,
// which keeps it off the rain pipe down the column's downstream side, and ends inside a hoop round the column's
// shaft, behind a lug.
function greatStay(M, y) {
  const h = STAY.half, up = [0, 1, 0], down = [0, -1, 0], cx = P.COLUMN_X[2], bay = P.SHED.bay;
  band(M, round(STAY.r, y - h), round(STAY.r, y + h), OUT, IRON.sage, (j, end) => [0.44 * STAY.rivets * j / SIDES, end ? h : -h, 3 + h - 0.11]);
  band(M, round(STAY.r, y + h), round(R + 0.02, y + h), up, IRON.sage);
  band(M, round(R + 0.02, y - h), round(STAY.r, y - h), down, IRON.sage);
  for (const cz of [Math.floor(G.z / bay) * bay, Math.ceil(G.z / bay) * bay]) {
    const qx = cx - STAY.aim - G.x, qz = cz - G.z, len = Math.hypot(qx, qz), d = [qx / len, 0, qz / len], side = [-d[2], 0, d[0]];
    const at = (t) => [G.x + t * d[0], y, G.z + t * d[2]];
    // where the bar goes into the column's hoop: the near crossing of its line with the hoop's round
    const along = (cx - G.x) * d[0] + (cz - G.z) * d[2], off = (cx - G.x) * d[2] - (cz - G.z) * d[0];
    const hit = along - Math.sqrt(Math.max(STAY.hoop * STAY.hoop - off * off, 0));
    M.box(at((STAY.r + len) / 2), d, up, side, (len - STAY.r) / 2, 0.13, 0.05, IRON.sageDark, 'YyZz', 'Zz');
    M.box(at(STAY.r + 0.2), d, up, side, 0.3, 0.22, 0.11, IRON.sage);
    M.box(at(hit - 0.1), d, up, side, 0.25, 0.2, 0.1, IRON.sage);
    M.sleeve([cx, y - 0.25, cz], [cx, y + 0.25, cz], STAY.hoop, STAY.hoop, 12, IRON.sage);
    M.ring([cx, y + 0.25, cz], up, 0.68, STAY.hoop, 12, IRON.sage);
    M.ring([cx, y - 0.25, cz], down, 0.68, STAY.hoop, 12, IRON.sage);
  }
}
// THE COLLAR: the drum from the level of the roof's valleys up through the boards (its top lies in the slope, a
// hand over the boards' underside), the ring that closes it underneath against the glass, and the flashing plate
// that laps the boards round it (it lies in the slope, a finger under the boards, and faces down into the hall).
function greatCollar(M, yDrum) {
  const S = P.SHED, rise = S.roofRidge - S.roofValley, sl = Math.hypot(S.ridgeBack, rise), under = (z) => roofY(z) - 0.03;
  band(M, round(DRUM.r, yDrum), round(DRUM.r, (z) => roofY(z) + 0.1), OUT, IRON.sage);
  band(M, round(R + 0.02, yDrum), round(DRUM.r, yDrum), [0, -1, 0], IRON.sage);
  band(M, round(DRUM.r, under), round(DRUM.r + DRUM.lap, under), [0, -S.ridgeBack / sl, -rise / sl], IRON.sageDark);
}

// ALL THE GREAT PIPE'S IRON, into the pipes' one iron mesh M (the maker of …-pipes-iron.js)
export function addGreatIron(M) {
  const h = levels();
  for (const y of h.joints) greatJoint(M, y);
  for (const y of G.stays) greatStay(M, y);
  greatCollar(M, h.yDrum);
}
// CLEAR AIR, counted with the plan's routeDistance on the skin as drawn: the glass at every half metre of its
// height above the river, and the rims of its joints (with their bolts' heads) and of its stays' hoops, all round
// the pipe. (The bars, the columns' hoops and the collar lie on the pipe's far side or far overhead.)
export function greatClear() {
  const h = levels();
  let clear = 1e9;
  const ring = (y, r) => { for (let j = 0; j < SIDES; j++) clear = Math.min(clear, P.routeDistance(G.x + r * OUT[j][0], y, G.z + r * OUT[j][2])); };
  for (let y = h.yS; y <= h.yTop; y += 0.5) ring(y, R);
  for (const y of h.joints) for (const e of [-1, 1]) ring(y + e * (JOINT.half + 0.12), JOINT.r);
  for (const y of G.stays) for (const e of [-1, 1]) ring(y + e * STAY.half, STAY.r);
  return clear;
}

// ---- THE GREAT PIPE'S TWO MESHES (their shaders: …-pipes-great-glsl.js).
// A plumb tube about the pipe's axis, radius r, from height y0 to y1: position, normal and aFlow (metres above the
// river's level yS, cos and sin of the place round the pipe, and the pipes' count, which says: the great pipe)
function tubeArrays(r, y0, y1, yS) {
  const pos = [], nor = [], flow = [], idx = [];
  for (const y of [y0, y1]) for (let j = 0; j <= SIDES; j++) {
    const f = (j / SIDES) * Math.PI * 2, cf = Math.cos(f), sf = Math.sin(f);
    pos.push(G.x + r * cf, y, G.z - r * sf); nor.push(cf, 0, -sf); flow.push(y - yS, cf, sf, P.PIPES.count);
  }
  for (let j = 0; j < SIDES; j++) { const a = j, b = j + 1, c = j + SIDES + 1; idx.push(a, b, c, b, c + 1, c); }
  return { pos, nor, flow, idx };
}
function geometryOf(THREE, A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nor, 3));
  g.setAttribute('aFlow', new THREE.Float32BufferAttribute(A.flow, 4));
  g.setIndex(A.idx);
  g.computeBoundingSphere();
  return g;
}
// THE LIQUID'S MESH: the bore's wall over its whole length, from a hand under the river's level to the glass's end
// (the shader says where on it a slug stands), and SLUG.slots ROUNDED TOPS: each a dome of DOME sides, in rings at
// these shares of the bore's radius, whose heights the vertex shader sets by the world's clock (aFlow: the share,
// cos and sin, the pipes' count + 1 + the slot). A dome's rim stands just outside the wall's facets, so that no gap
// shows between the two.
const DOME = 16, DOME_RINGS = [1, 0.8, 0.55, 0.28, 0];
function liquidArrays(h, rb) {
  const A = tubeArrays(rb, h.yS - 0.3, h.yTop, h.yS), out = rb / Math.cos(Math.PI / DOME);
  for (let slot = 0; slot < SLUG.slots; slot++) {
    const first = A.pos.length / 3;
    for (const rho of DOME_RINGS) for (let j = 0; j <= DOME; j++) {
      const f = ((j + (rho ? 0 : 0.5)) / DOME) * Math.PI * 2, cf = Math.cos(f), sf = Math.sin(f);
      A.pos.push(G.x + out * rho * cf, h.yS, G.z - out * rho * sf); A.nor.push(0, 1, 0); A.flow.push(rho, cf, sf, P.PIPES.count + 1 + slot);
    }
    for (let m = 0; m + 1 < DOME_RINGS.length; m++) for (let j = 0; j < DOME; j++) {
      const a = first + m * (DOME + 1) + j, c = a + DOME + 1;
      A.idx.push(a, a + 1, c); if (DOME_RINGS[m + 1]) A.idx.push(a + 1, c + 1, c);
    }
  }
  return A;
}
// The two meshes: the liquid (solid, both its sides) and the glass (both its sides in one pass, blended, drawn after
// everything; see its shader for why the order of its two walls does not matter). U is what the pipes part hands
// in: fog() and lit() (fresh uniforms of the scene's fog and of the hall's light), liquid (the liquid's uniforms,
// the rank's own), time (the world's clock) and glass (the glass's tint).
export function buildGreat(THREE, U) {
  const h = levels(), rb = R * GREAT.share;
  const liquidG = geometryOf(THREE, liquidArrays(h, rb)), glassG = geometryOf(THREE, tubeArrays(R, h.yMouth, h.yTop, h.yS));
  const uniforms = () => ({
    ...U.fog(), ...U.lit(), ...U.liquid, uSpeed: { value: GREAT.speed }, uTime: U.time,
    uPipe: { value: new THREE.Vector3(h.yS, h.yTop - h.yS, rb) },
  });
  const liquidM = new THREE.ShaderMaterial({
    uniforms: uniforms(), vertexShader: GREAT_VERT, fragmentShader: GREAT_LIQUID_FRAG, fog: true, side: THREE.DoubleSide, alphaToCoverage: true,
  });
  const glassM = new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms(), uGlass: { value: U.glass }, uTube: { value: new THREE.Vector2(R, GREAT.share) },
      uJoint: { value: new THREE.Vector3(JOINT.first, JOINT.step, JOINT.half + JOINT.hub) },
    },
    vertexShader: GREAT_VERT, fragmentShader: GREAT_GLASS_FRAG, fog: true, side: THREE.DoubleSide, forceSinglePass: true,
    transparent: true, depthWrite: false, premultipliedAlpha: true,
  });
  const liquid = new THREE.Mesh(liquidG, liquidM), glass = new THREE.Mesh(glassG, glassM);
  glass.renderOrder = 3;
  return {
    meshes: [liquid, glass], drawCalls: 2, triangles: (liquidG.index.count + glassG.index.count) / 3,
    dispose() { for (const made of [liquidG, glassG, liquidM, glassM]) made.dispose(); },
  };
}
