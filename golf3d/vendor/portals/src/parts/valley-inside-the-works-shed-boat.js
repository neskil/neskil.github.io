// valley-inside-the-works, THE SHED: the boat. A long rowing boat of rose boiled sugar lies moored against the right-hand
// bank of the lower river, afloat, bow upstream, nobody aboard (plan: BOAT, boatX, liquidY). A clinker hull of eight
// lapped strakes a side, the top one striped cream and rose, between two posts: the stem rises and curls over to the
// bank's side in a plain scroll that faces along the river, the stern post in a smaller one curling aft; a rail,
// bottom boards, four thwarts, two pairs of oars laid along them, blades to the stern; a hemp line from the stem to an
// iron ring in a grey stone on the bank's bare first metre (stone and iron in the shed's solid mesh). It lies to the liquid's slope.
// ONE MESH, ONE MATERIAL: sugar is glossy and a little see-through, so it is blended, its triangles in the order boards,
// inside, fittings, outside, posts, line: what lies behind is laid first for a lens above the gunwale, where the flown
// line passes the whole way; for the same reason the laps' under-faces, which look down, are not drawn. Alpha is each
// part's own thickness, never the eye's place. WHAT READS THE LENS: the footprint filter; and the roof mirrored in the
// sugar (a reflection: the eye's own ray from cameraPosition). WHAT MOVES: the boat rolls (0.6 degrees at the most)
// and heaves 1.2 cm by the world's clock, in the vertex shader; the line's far end, at the ring, stays still.
import * as P from './valley-inside-the-works-plan.js';
import { makeMesh } from './valley-inside-the-works-shed-mesh.js';
import { KIND } from './valley-inside-the-works-shed-mats.js';
import { COMMON } from './valley-inside-the-works-shed-glsl.js';
import { GIRDER } from './valley-inside-the-works-shed-roof.js';

// THE HULL'S FORM in the boat's own frame (x to the bank, y up from the liquid's face, z to the stern; metres): along it
// s runs -1 (bow) .. 1 (stern), round a section u runs 0 (keel) .. 1 (sheer).
const SWEEP = 65 * Math.PI / 180, PLANK = 0.06, MID = 0.23;   // a section's sweep, a plank's thickness, where the widest section lies
const EDGE = [0, 0.2, 0.36, 0.49, 0.6, 0.7, 0.8, 0.9, 1];       // the strakes' edges round the section
const sheer = (s) => 1.2 + (s < 0 ? 0.85 : 0.6) * Math.pow(Math.abs(s), 2.4);
const keel = (s) => -0.5 + 0.3 * s * s * s * s;
const beam = (s) => 0.1 + (0.5 * P.BOAT.beam - 0.21) * Math.pow(Math.cos(0.5 * Math.PI * Math.pow(Math.abs(s), 1.45)), 0.9);
const across = (u) => Math.sin(SWEEP * u) / Math.sin(SWEEP), rise = (u) => Math.pow((1 - Math.cos(SWEEP * u)) / (1 - Math.cos(SWEEP)), 1.3);
// a point of the moulded surface (the planks' inner faces lie on it at their upper edges), or `out` metres outside it
function hull(s, u, out = 0) {
  const at = (v) => [beam(s) * across(v), keel(s) + (sheer(s) - keel(s)) * rise(v)];
  const a = at(Math.max(u - 0.01, 0)), b = at(Math.min(u + 0.01, 1)), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, c = at(u);
  return [c[0] + out * (b[1] - a[1]) / l, c[1] - out * (b[0] - a[0]) / l, MID + s * (5.0 + 0.4 * rise(u))];
}
// the moulded half breadth at (z, y) of that frame; 0 beyond the ends and above the sheer
function side(z, y) {
  let s = (z - MID) / 5.2, f = 0;
  for (let i = 0; i < 6; i++) {
    s = Math.min(Math.max(s, -1), 1); f = Math.min(Math.max((y - keel(s)) / (sheer(s) - keel(s)), 0), 1);
    s = (z - MID) / (5.0 + 0.4 * f);
  }
  if (Math.abs(s) > 1 || y > sheer(s)) return 0;
  return beam(s) * across(Math.acos(1 - Math.pow(f, 1 / 1.3) * (1 - Math.cos(SWEEP))) / SWEEP);
}
// For whoever rings the hull in the liquid: its outer skin's half breadth at the liquid's face at the world's z, about
// x = boatX() (0 where the hull is not). Along that whole line the hull is closed to the eye: skin, lining and floor
// meet, and a filler board shuts either end of the planking against its post from the keel up.
export function boatSide(z) { const h = side(z - P.BOAT.z, 0); return h > 0 ? h + 1.5 * PLANK : 0; }
// a post's middle line, [x, y, z] going up (end -1 the stem, 1 the stern post): along the hull's raked end in the
// boat's middle plane, then the scroll, which starts at height y0 with radius r0 and winds `turns` times: away from
// the hull in that plane (turn 0), or turned a quarter about the post's own line, over to the side `turn` (1 the bank's)
function postLine(end, y0, r0, turns, n, turn) {
  const rake = 0.4 / (sheer(end) - keel(end)), zOf = (y) => MID + end * (5.1 + rake * (y - keel(end))), p0 = Math.atan(rake);
  const line = [[0, -0.6, zOf(-0.6)], [0, 0.5, zOf(0.5)], [0, 1.5, zOf(1.5)]], c = Math.cos(p0), sn = Math.sin(p0), e = turn ? [turn, 0, 0] : [0, -sn, end * c];
  for (let i = 0; i <= n; i++) {
    const t = i / n, th = turns * 2 * Math.PI * t, r = r0 * (1 - 0.72 * t), a = r0 - r * Math.cos(th), b = r * Math.sin(th);
    line.push([a * e[0], y0 + a * e[1] + b * c, zOf(y0) + a * e[2] + b * end * sn]);
  }
  return line;
}

const SUGAR = { plain: 0, striped: 1, boards: 2, hemp: 3 }, FLOOR = 0.1, SEAT = 0.78, THWARTS = [-3.1, -0.9, 1.3, 3.5];   // (the kinds of surface in the boat's material: aP.z)
const ROSE = [0.84, 0.12, 0.26], DEEP = [0.62, 0.04, 0.13], CREAM = [0.95, 0.86, 0.66], HEMP = [0.6, 0.47, 0.27];
const OARS = [[-0.52, -3.8, -0.027], [-0.2, -3.55, -0.006], [0.22, -3.75, 0.004], [0.5, -3.6, 0.028]];   // [x, z of the grip's end, yaw]
const POSTS = [[-1, 2.77, 0.59, 1.3, 30, 1, 0.14], [1, 2.2, 0.35, 1.25, 22, 0, 0.115]];   // [end, the scroll's foot, its radius, turns, pieces, its turn, the cane's radius]

// the sugar of the boat, drawn into m in the boat's own frame; frame(o, a1, a2, a3) sets a frame given in that frame
async function sugar(m, frame, pause) {
  const stations = [], whole = () => frame([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  for (let j = 0; j <= 24; j++) { const t = j / 12 - 1; stations.push(t * (1.25 - 0.25 * t * t)); }       // (closer at the ends)
  const row = (u, out) => stations.map((s) => hull(s, u, out));
  const band = (lo, up, to) => m.skin([lo, up], (i, j) => [lo[j][2], i ? Math.hypot(up[j][0] - lo[j][0], up[j][1] - lo[j][1]) : 0], { to });
  const both = (f) => { for (const sg of [1, -1]) { frame([0, 0, 0], [sg, 0, 0], [0, 1, 0], [0, 0, 1]); f(); } whole(); };
  const bothSlowly = async (f) => { for (const sg of [1, -1]) { frame([0, 0, 0], [sg, 0, 0], [0, 1, 0], [0, 0, 1]); await f(); } whole(); };   // (the same, with breaths)
  whole();
  // the bottom boards, a hand above the liquid's face, from end to end and let into the planking at their edges (no
  // liquid is drawn inside the hull's line: boards, lining and the end fillers shut the hull to the eye)
  m.set({ kind: SUGAR.boards, w: 0.5, col: ROSE });
  for (let i = 0; i < 14; i++) {
    const z0 = MID - 5.04 + 10.08 * i / 14, z1 = MID - 5.04 + 10.08 * (i + 1) / 14, h0 = side(z0, FLOOR) + PLANK, h1 = side(z1, FLOOR) + PLANK;
    m.quad([-h0, FLOOR, z0], [-h1, FLOOR, z1], [h1, FLOOR, z1], [h0, FLOOR, z0]);
  }
  // inside: the planks' inner faces from under the boards up, and on each one's upper edge the ledge where the next plank laps it
  await bothSlowly(async () => {
    for (let k = 2; k < 8; k++) {
      m.set({ kind: k === 7 ? SUGAR.striped : SUGAR.plain, w: 0.25, col: ROSE });
      band(row(EDGE[k], PLANK), row(EDGE[k + 1], 0), [0, 40, 0]);
      if (k < 7) { m.set({ kind: SUGAR.plain, w: 0.6, col: DEEP }); band(row(EDGE[k + 1], 0), row(EDGE[k + 1], PLANK), [0, 40, 0]); }
      await pause();
    }
  });
  await pause();
  // the four thwarts, let into the planking at their ends, their edges eased
  m.set({ kind: SUGAR.plain, w: 0.7, col: DEEP });
  for (const zt of THWARTS) {
    const section = [[0.3, -0.12], [0.3, -0.025], [0.27, 0], [-0.27, 0], [-0.3, -0.025], [-0.3, -0.12]];
    m.skin(section.map(([dz, dy]) => { const h = side(zt + dz, SEAT + dy) + 0.03; return [[-h, SEAT + dy, zt + dz], [h, SEAT + dy, zt + dz]]; }), null, { to: [0, 40, zt] });
  }
  // two pairs of oars laid along the thwarts, blades to the stern: a round loom with its grip, a flat blade
  m.set({ kind: SUGAR.plain, w: 0.85, col: CREAM });
  for (const [x, z, yaw] of OARS) {
    frame([x, SEAT + 0.09, z], [Math.cos(yaw), 0, -Math.sin(yaw)], [0, 1, 0], [Math.sin(yaw), 0, Math.cos(yaw)]);
    m.lathe([0, 0, 0], 2, [[0.055, 0], [0.055, 0.55], [0.09, 0.62], [0.09, 3.4], [0.065, 5.7]], 6, { cap: 'bottom' });
    m.prism([[-0.06, 5.5], [-0.21, 6.3], [-0.21, 7.65], [-0.12, 7.85], [0.12, 7.85], [0.21, 7.65], [0.21, 6.3], [0.06, 5.5]], -0.085, -0.035);
  }
  await pause();
  // the rail, a round bead over the top plank's edge; and a small deck from rail to rail at either end
  m.set({ kind: SUGAR.plain, w: 0.8, col: DEEP });
  both(() => {
    const rows = [0, 1, 2, 3, 4].map((i) => stations.map((s) => {
      const c = Math.cos(-0.5 + (Math.PI + 1) * i / 4), sn = Math.sin(-0.5 + (Math.PI + 1) * i / 4), p = hull(s, 1, PLANK / 2), q = hull(s, 1, 1 + PLANK / 2), nx = q[0] - p[0], ny = q[1] - p[1];
      return [p[0] + 0.085 * (c * nx - sn * ny), p[1] + 0.02 + 0.085 * (c * ny + sn * nx), p[2]];
    }));
    m.skin(rows, (i, j) => [rows[i][j][2], 0.07 * i], { to: [0, 40, 0] });
  });
  for (const end of [-1, 1]) m.skin([0.86 * end, end].map((s) => { const p = hull(s, 1, 0); return [[-p[0], p[1] - 0.05, p[2]], [p[0], p[1] - 0.05, p[2]]]; }), null, { to: [0, 40, 0] });
  await pause();                                                 // (a breath between the boat's inside and its outside)
  // outside: the planks' outer faces from keel to sheer, each one's lower edge a plank's thickness proud of the one below
  await bothSlowly(async () => {
    for (let k = 0; k < 8; k++) {
      m.set({ kind: k === 7 ? SUGAR.striped : SUGAR.plain, w: 0.25, col: ROSE });
      band(row(EDGE[k], 2 * PLANK), row(EDGE[k + 1], PLANK), [100, -60, 0]);
      await pause();
    }
  });
  await pause();
  // a filler board shuts either end of the planking against its post, from the keel to the sheer, faced without and within
  m.set({ kind: SUGAR.plain, w: 1, col: DEEP });
  for (const end of [-1, 1]) {
    const cut = EDGE.map((u, k) => hull(end, u, k < 8 ? 2 * PLANK : PLANK));                 // (the strakes' proud corners at that end)
    for (const to of [MID + 40 * end, MID]) m.skin([cut.map((p) => [-p[0], p[1], p[2]]), cut], null, { to: [0, 0.5, to] });
  }
  // the posts: a round cane of deep rose up each end (deeper fore and aft below the sheer), wound at its head into a
  // plain scroll that thins to its tip; `bn` is square to the scroll's plane, and the cane's section stands on it
  for (const [end, y0, r0, turns, n, turn, thick] of POSTS) {
    const line = postLine(end, y0, r0, turns, n, turn), rows = [], runs = [], p0 = Math.atan(0.4 / (sheer(end) - keel(end)));
    const bn = turn ? [0, end * turn * Math.sin(p0), -turn * Math.cos(p0)] : [1, 0, 0], step = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    line.forEach((p, i) => {
      const a = line[Math.max(i - 1, 0)], b = line[Math.min(i + 1, line.length - 1)], T = [0, 1, 2].map((c) => (b[c] - a[c]) / (step(a, b) || 1));
      const B = [T[1] * bn[2] - T[2] * bn[1], T[2] * bn[0] - T[0] * bn[2], T[0] * bn[1] - T[1] * bn[0]], r = thick * (1 - 0.62 * Math.max(i - 3, 0) / n);
      const deep = i < 3 ? 1.45 * r : r, r1 = turn ? deep : r, r2 = turn ? r : deep;
      runs.push(i ? runs[i - 1] + step(line[i - 1], p) : 0);
      rows.push([0, 1, 2, 3, 4, 5].map((j) => p.map((v, c) => v + r1 * Math.cos(j * Math.PI / 3) * bn[c] + r2 * Math.sin(j * Math.PI / 3) * B[c])));
    });
    m.skin(rows, (i, j) => [j / 6, runs[i]], { wrap: true });
    m.poly(rows[rows.length - 1]);
    await pause();
  }
}

// THE SUGAR'S MATERIAL: a standard material lit by the scene's lights under the plan's bars, with these blocks added.
const HEAD = 'varying vec4 vP;\nvarying vec3 vBoatW;\nuniform vec3 uShedSky, uShedBounce;\nuniform float uShedGlassGain;\nfloat boatRough = 0.15, boatSugar = 1.0;\n';
// (vertex) the boat rolls about the mesh's own z axis (its middle line at the liquid's face) and heaves, by the world's
// clock; the hemp line carries in aP.w each point's share of that: all at the stem, none at the ring. Normals stay as built.
const VERT = /* glsl */`
vP = aP;
{ float part = aP.z > 2.5 ? aP.w : 1.0;
  float roll = (0.0075 * sin(0.83 * uShedTime) + 0.003 * sin(1.31 * uShedTime + 1.0)) * part;
  transformed.xy += vec2(-roll * transformed.y, roll * transformed.x + 0.012 * part * sin(0.57 * uShedTime + 2.0)); }
vBoatW = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;
// (after the vertex colour) the kinds of surface, each fine pattern filtered by the footprint; alpha by the thickness
const KINDS = /* glsl */`
{ vec2 fw = fwidth(vP.xy);
  if (vP.z > 2.5) {                                                     // hemp: three strands laid up, matt, not see-through
    diffuseColor.rgb *= mix(0.7, 1.0, shPulse(3.0 * vP.x + 5.0 * vP.y, 0.5, 3.0 * fw.x + 5.0 * fw.y));
    boatRough = 0.92; boatSugar = 0.0;
  } else if (vP.z > 1.5) {                                              // the bottom boards' seams
    diffuseColor.rgb *= 1.0 - 0.5 * shPulse(vP.x / 0.33 + 0.5, 0.09, fw.x / 0.33);
  } else if (vP.z > 0.5) {                                              // the top plank: cream stripes slanting across it
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.88, 0.7), shPulse((vP.x + 0.9 * vP.y) / 1.1, 0.5, (fw.x + 0.9 * fw.y) / 1.1));
  }
  diffuseColor.a = mix(1.0, mix(0.82, 0.97, vP.w), boatSugar); }
`;
// (emissive) the roof mirrored in the sugar. Where the mirrored ray meets the level of the roof's valleys it stands at
// some share of a tooth; the bright glass begins at the share `cut`, set by the ray's own slope (all glass looking low
// up the valley, a fifth of a tooth straight up, none down the valley), the rest is boards; the lattice girder under
// each valley darkens the share `deep` that the ray passes behind it. The bands are filtered by the footprint and
// weighed by Schlick's rule from 0.06 head-on. Then the meadow's light thrown back, as on everything of the shed.
const ROOF = P.SHED, MIRROR = /* glsl */`
{ vec3 bn = inverseTransformDirection(normal, viewMatrix);
  vec3 be = cameraPosition - vBoatW; be /= max(length(be), 1e-3);
  float b1 = 1.0 - clamp(dot(bn, be), 0.0, 1.0), b2 = b1 * b1;
  vec3 br = reflect(-be, bn);
  float by = max(br.y, 0.05), cut = clamp(${(ROOF.ridgeBack / ROOF.bay).toFixed(3)} + ${((ROOF.roofRidge - ROOF.roofValley) / ROOF.bay).toFixed(3)} * br.z / by, 0.0, 1.0);
  float q = (${P.columnZ(0).toFixed(1)} - vBoatW.z - br.z * (${ROOF.roofValley.toFixed(1)} - vBoatW.y) / by) / ${ROOF.bay.toFixed(1)}, fq = fwidth(q);
  float deep = min(${(GIRDER.depth / ROOF.bay).toFixed(3)} * abs(br.z) / by, 1.0);
  float roof = mix(0.14, 1.0, shPulse(q - cut, 1.0 - cut, fq)) * (1.0 - 0.55 * shPulse(br.z < 0.0 ? q : q + deep, deep, fq));
  totalEmissiveRadiance += uShedSky * (uShedGlassGain * clamp(4.0 * br.y, 0.0, 1.0) * roof * (0.06 + 0.94 * b2 * b2 * b1) * boatSugar)
    + diffuseColor.rgb * uShedBounce * 0.5; }
`;
// (after the lights and the plan's bars) the sun coming through the sugar from behind, tinted by it, under the same
// bars: we fly toward the light, so most of what the lens sees of the boat is lit through
const THROUGH = /* glsl */`
#if NUM_DIR_LIGHTS > 0
{ float back = clamp(-dot(geometryNormal, directionalLights[0].direction), 0.0, 1.0);
  reflectedLight.directDiffuse += directionalLights[0].color * material.diffuseColor * (RECIPROCAL_PI * 0.85 * back * boatSugar * lightBar(vBoatW)); }
#endif
`;
function sugarMaterial(THREE, U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0, transparent: true });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uShedTime: U.uShedTime, uShedSky: U.uShedSky, uShedBounce: U.uShedBounce, uShedGlassGain: U.uShedGlassGain });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aP;\nvarying vec4 vP;\nvarying vec3 vBoatW;\nuniform float uShedTime;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + HEAD + COMMON)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + KINDS)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = boatRough;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + MIRROR)
      .replace('#include <lights_fragment_begin>', '#include <lights_fragment_begin>\n' + THROUGH);
  };
  mat.customProgramCacheKey = () => 'valley-shed-boat'; return P.barMaterial(mat);
}

export async function buildBoat(kit) {
  const { THREE, solid, ctx, object, mats } = kit, m = makeMesh();
  // the boat's own frame: its origin (the mesh's place) on the plan's line at the liquid's face, its long axis laid to the liquid's own slope
  const tilt = Math.atan(0.5 * (P.liquidY(P.BOAT.z - 1) - P.liquidY(P.BOAT.z + 1))), E = [[1, 0, 0], [0, Math.cos(tilt), Math.sin(tilt)], [0, -Math.sin(tilt), Math.cos(tilt)]];
  const O = [P.boatX(), P.liquidY(P.BOAT.z), P.BOAT.z];
  const turn = (p) => [0, 1, 2].map((c) => p[0] * E[0][c] + p[1] * E[1][c] + p[2] * E[2][c]);
  const frame = (o, a1, a2, a3) => m.frame(turn(o), turn(a1), turn(a2), turn(a3));
  const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }, cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  await sugar(m, frame, () => ctx.yield());
  await ctx.yield();
  // THE MOORING. One grey stone, its top worn off all round, on the bank's bare first metre 3.5 m upstream of the bow,
  // square to the bank; an iron ring stands in its top, square to the bank's line, its foot let into the stone (solid mesh)
  const zs = P.BOAT.z - 0.5 * P.BOAT.length - 3.5, edge = (z) => P.riverX(z) + P.riverHalfWidth(z);
  const along = unit([edge(zs + 0.5) - edge(zs - 0.5), 0, 1]), land = [along[2], 0, -along[0]];
  const sx = edge(zs) + 0.55 * land[0], sz = zs + 0.55 * land[2], cap = (y, d) => [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([a, b]) => [a * (0.45 - d), y, b * (0.6 - d)]);
  const brim = cap(0.62, 0), crown = cap(0.75, 0.13), R = 0.24, torus = [0, 1, 2, 3, 4, 5, 6].map((i) => [R + 0.04 * Math.cos(i * Math.PI / 3), 0.04 * Math.sin(i * Math.PI / 3)]);
  solid.frame([sx, P.groundHeight(sx, sz), sz], land, [0, 1, 0], along).set({ kind: KIND.plain, w: 0, col: [0.5, 0.48, 0.45] }).box(-0.45, 0.45, -0.6, 0.62, -0.6, 0.6, 'du');
  solid.set({ col: [0.6, 0.58, 0.54] }).poly(crown); for (let i = 0; i < 4; i++) solid.quad(brim[i], brim[(i + 1) % 4], crown[(i + 1) % 4], crown[i]);
  solid.set({ kind: KIND.iron, w: 0, col: [0.5, 0.46, 0.42] }).lathe([0, 0.65 + R, 0], 2, torus, 16);
  await ctx.yield();
  // the line runs from a hitch round the stem, above the sheer, to the ring's river side (places below: from the boat's origin)
  const hold = solid.world([-R, 0.65 + R, 0]).map((v, c) => v - O[c]), stem = postLine(...POSTS[0]);
  solid.frame(null);
  const lean = unit([0, stem[3][1] - stem[2][1], stem[3][2] - stem[2][2]]), hy = 2.4, hz = stem[2][2] + (hy - stem[2][1]) * lean[2] / lean[1];
  const from = turn([0.2, hy, hz]), pull = unit(from.map((v, c) => v - hold[c]));
  // the hemp line: two turns round the stem, the line itself (a little slack), two turns round the ring's bar
  const turns = (r, h) => [[r, -h], [r + 0.055, -0.5 * h], [r, 0], [r + 0.055, 0.5 * h], [r, h]];
  m.set({ kind: SUGAR.hemp, w: 1, col: HEMP });
  frame([0, hy, hz], [1, 0, 0], lean, cross([1, 0, 0], lean)).lathe([0, 0, 0], 1, turns(0.17, 0.09), 8);
  m.set({ w: 0 }).frame(hold, [1, 0, 0], [0, 1, 0], [0, 0, 1]).lathe([0, 0, 0], 1, turns(0.05, 0.065), 6);
  m.frame(null);
  const to = hold.map((v, c) => v + 0.1 * pull[c]), a1 = unit(cross(pull, [0, 1, 0])), a2 = cross(a1, pull), rows = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, c = from.map((v, k) => v + (to[k] - v) * t - (k === 1 ? 0.32 * t * (1 - t) : 0));
    rows.push([0, 1, 2, 3, 4].map((j) => c.map((v, k) => v + 0.05 * (Math.cos(j * Math.PI * 0.4) * a1[k] + Math.sin(j * Math.PI * 0.4) * a2[k]))));
  }
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  m.skin(rows, (i, j) => [j / 5, length * i / 8, 1 - i / 8], { wrap: true });
  await ctx.yield();
  m.each((x, y, z) => kit.air(x + O[0], y + O[1], z + O[2], 'boat'));
  await ctx.yield();
  const g = m.build(THREE);
  await ctx.yield();
  const mat = sugarMaterial(THREE, mats.uniforms), mesh = new THREE.Mesh(g, mat);
  mesh.name = 'shed-boat'; mesh.position.set(O[0], O[1], O[2]);
  object.add(mesh); kit.owned.push(g, mat); kit.triangles += m.triangles; kit.calls++;
}
