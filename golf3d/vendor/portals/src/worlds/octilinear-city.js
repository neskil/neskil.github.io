// THE CITY THAT IS ONLY ITS MAP (octilinear-city)
// Morning rush in a city with no buildings, only its transit diagram ruled in the air over one white sheet: nine flat ink
// ribbons on nine levels, turning only at 45 degrees with one radius, stations as white ticks, interchanges as black-ringed
// capsules, trains as keylined dashes, all bound for the Grand Interchange (src/parts/octilinear-city.js), an octagonal well
// where the nine braid through each other at once. We ride our own line's dash (built here, ride 'none').
//
// STYLE. Everything is an unlit flat ink written as its own linear colour under post.flat = 1 (no tone map), so the sheet is
// the sheet's hex and each ink its hex. No lights, no fog, no bloom, no full-screen pass. Depth is overlap (white casings), three
// zone greys stepped on the ground, and the squeeze (lines 6 m apart in the bundle, 24 m by the well). The ground is one quad whose
// material draws zones, river, parks, correction patches and the two fold creases as octilinear signed-distance shapes; the dome is
// the same sheet white and carries the creases on up.
// SPACE. +Z is the course, about 1,020 m. The seven stripes are a VIADUCT: our line rides 104 m over the sheet (the stripes 5 m
// apart, each 1 m lower than the one inside it, every one with a white casing lip level with its deck on its outer side; they
// swing in at 45 degrees, the inner ones first, and turn on one centre), and the eye rides 14 m over our line with our own dash
// whole in frame ahead of it, so the map below is read in plan: the river and its ferries, the parks, and the lines of the sheet
// drawn at the map's bold weight (9 m ribbons with fat keylined dashes). North under the first interchange (a black-ringed
// capsule stood on edge across the stripes) and over the river, a 45 degree bend, the diagonal with the river alongside and the
// second interchange as a gate, north to the rim. Where the viaduct ends the six other stripes dive 45 degree ramps to the sheet
// (levels between the ruled ones) and run on below; ours tips over the rim and down one long 45 degree ramp (176 m of fall)
// into the well, the whole braid below it, round the inner octagon and dead straight to the terminus ring, where the portal
// sits. The giant capsule of the well stands 190 m over the sheet, so it is the destination from the first frame: nothing
// else reaches the horizon line ahead. One line crosses overhead while it is still being ruled (long plain dashes, one round
// black ruling point), and an extension rules itself on beside us. Every other end of a line at the well runs out across the
// sheet in an ordered fan (routes chosen together: none crossing another near the eye, no line crossing its own other end,
// none stacked). West of the course a trunk of three lines abreast runs with us on the sheet, with long interchange capsules
// lying across it, and one interchange stands on end from the sheet to the overhead line. Where two lines of the sheet cross a
// ringed interchange pins them; where one passes under our own line a ringed pin and stem tie the viaduct to the map. The
// floor of the well is map as well: a moat with ferries and white bridges, basins, greens, ringed interchanges; and every wall
// face carries two ringed interchanges. In the well the eye rides 8 m over our line and comes down toward the dash wherever a
// line crosses close overhead.
// VARIATIONS (seed): colourway (marigold / cool, ours coral / autumn, ours ochre, warmer sheet), edition (current / early, three
// lines still being ruled / planned, four pale open-cased extensions), service from ctx.vary.hour (rush with the inbound wave /
// midday, half the dashes and busy ferries / last trains, warmer sheet and few dashes), which lines share the bundle, parks.
// RARE (ctx.vary.rare): the correction. A yellowed patch slides across the well's north face, the plum line un-rules itself back
// to its ramp and is ruled again a level higher, its dashes released along it in a file.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, createStyle, filletLine, lineAt, setWidths, MarkBuffer, stadium, makeTrackYield, trainGeometry, setTrains, dotGeometry } from '../parts/octilinear-city.js';

const EXPOSURE = 1;
const RULE = 240, DASH = 40;              // a line being ruled: the length of its dashed end, and the dash period (half ink, half paper), sized for the fat lines of the sheet below
const RIDE = 104;                         // our line's height over the sheet in the suburbs: the bundle is a viaduct, the map lies below it in plan
const EYE = 14, EYEW = 8;               // the eye over our line: high over the viaduct in the suburbs (our own dash whole in frame ahead), nearer on the ramp and in the well (2.4 m at the terminus, where the portal sits)
const WELL = [230, 600];                 // the well's centre in plan
const S2 = Math.SQRT1_2;
// the eight ruled directions in plan: 0 north (+z), 1 north-east, 2 east ... 7 north-west
const DIRS = [[0, 1], [S2, S2], [1, 0], [S2, -S2], [0, -1], [-S2, -S2], [-1, 0], [-S2, S2]];
const dirIndex = (dx, dz) => { let b = 0, bd = -2; for (let k = 0; k < 8; k++) { const d = DIRS[k][0] * dx + DIRS[k][1] * dz; if (d > bd) { bd = d; b = k; } } return b; };
const oct8 = (x, z) => Math.max(Math.abs(x), Math.abs(z), (Math.abs(x) + Math.abs(z)) * S2);
const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// ---------------------------------------------------------------------------------------------------------
// THE SHEET: one quad. Zone steps, river, parks, patches and creases are flat tints with octilinear edges.
// ---------------------------------------------------------------------------------------------------------
const NRIV = 4, NPARK = 14, NPATCH = 6;
const GROUND_VS = /* glsl */`
  varying vec2 vP;
  void main(){ vec4 w = modelMatrix*vec4(position, 1.); vP = w.xz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const GROUND_FS = /* glsl */`
  uniform vec3 uPaper, uZ0, uZ1, uZ2, uRiver, uPark, uPatchCol, uCreaseCol;
  uniform vec2 uWell; uniform vec3 uZoneR; uniform float uRivW;
  uniform vec4 uRiv[${NRIV}];           // segment a.xz, b.xz
  uniform vec4 uParks[${NPARK}];        // centre xz, half sizes (a negative z half size: turned 45 degrees)
  uniform vec4 uPatch[${NPATCH}];       // centre xz, half size, turn in radians
  uniform vec3 uCrease[2];              // unit normal xz, offset
  varying vec2 vP;
  float oct(vec2 q, float r){ q = abs(q); return max(max(q.x, q.y), (q.x + q.y)*0.70710678) - r; }
  void main(){
    vec2 p = vP;
    float dw = oct(p - uWell, 200.);
    // Every edge is one pixel soft ACROSS ITSELF and nothing else: the softness is measured on each shape's own distance (taken
    // after the loops), so a river bank or a zone step seen at a grazing angle far off is still a crisp edge, never a smear.
    float dz0 = oct(p - uWell, uZoneR.z), dz1 = oct(p - uWell, uZoneR.y), dz2 = oct(p - uWell, uZoneR.x);
    float dp = 1e5;
    for (int i = 0; i < ${NPARK}; i++) {
      vec4 k = uParks[i]; vec2 q = p - k.xy;
      if (k.w < 0.) q = vec2(q.x + q.y, q.y - q.x)*0.70710678;
      q = abs(q) - vec2(k.z, abs(k.w));
      float cut = min(k.z, abs(k.w))*0.6;
      dp = min(dp, max(max(q.x, q.y), (q.x + q.y + cut)*0.70710678));
    }
    float dr = 1e5;
    for (int i = 0; i < ${NRIV}; i++) {
      vec2 a = uRiv[i].xy, b = uRiv[i].zw, t = b - a; float l = max(length(t), 1e-3); t /= l;
      vec2 q = p - a; float al = dot(q, t), cr = q.x*t.y - q.y*t.x;
      dr = min(dr, max(abs(al - 0.5*l) - 0.5*l - 0.2071*uRivW, abs(cr) - 0.5*uRivW));
    }
    float dc = 1e5;                                           // the fold creases: hairlines that never thin below a pixel and a half
    for (int i = 0; i < 2; i++) dc = min(dc, abs(dot(p, uCrease[i].xy) - uCrease[i].z));
    float dq = 1e5;                                           // pasted correction patches cover whatever they lie on
    for (int i = 0; i < ${NPATCH}; i++) {
      vec4 k = uPatch[i]; vec2 q = p - k.xy; float c = cos(k.w), s = sin(k.w);
      q = abs(vec2(c*q.x + s*q.y, c*q.y - s*q.x)) - k.z;
      dq = min(dq, k.z > 0.5 ? max(q.x, q.y) : 1e5);
    }
    float wz = max(fwidth(dz0), 1e-4), wp = max(fwidth(dp), 1e-4), wr = max(fwidth(dr), 1e-4), wc = max(fwidth(dc), 1e-4), wq = max(fwidth(dq), 1e-4);
    vec3 col = uPaper;
    col = mix(col, uZ0, clamp(0.5 - dz0/wz, 0., 1.));
    col = mix(col, uZ1, clamp(0.5 - dz1/wz, 0., 1.));
    col = mix(col, uZ2, clamp(0.5 - dz2/wz, 0., 1.));
    col = mix(col, uPark, clamp(0.5 - dp/wp, 0., 1.));
    col = mix(col, uRiver, clamp(0.5 - dr/wr, 0., 1.));
    // a crease shows across the printed zones only: on the blank margin a hairline running to the horizon read as a seam in the picture
    col = mix(col, uCreaseCol, clamp(0.5 - (dc - max(0.35, 0.75*wc))/wc, 0., 1.)*step(dz0, 0.));
    col = mix(col, uPatchCol, clamp(0.5 - dq/wq, 0., 1.));
    if (dw < 0.) discard;                                     // the well is a hole through the sheet
    gl_FragColor = vec4(col, 1.);
  }`;
const DOME_VS = /* glsl */`
  varying vec3 vDir;
  void main(){ vDir = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position, 1.);
    if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const DOME_FS = /* glsl */`
  uniform vec3 uPaper;
  varying vec3 vDir;
  void main(){
    vec3 col = uPaper;
    // the creases stop at the edge of the sheet: a hairline standing up the blank dome read as a seam in the picture, not as a fold
    gl_FragColor = vec4(col, 1.);
  }`;

// ---------------------------------------------------------------------------------------------------------
// RULING: octilinear routes in plan
// ---------------------------------------------------------------------------------------------------------
// From pose (A, direction da) to pose (P, arriving in direction dp): at most four ruled segments, each turn 45 degrees.
// Returns the corner list [[x,z]...] (A first, P last) of the cheapest feasible route, or null. bad(x, z) rejects a point.
async function connect(A, da, P, dp, min1, bad, ctx) {
  const LMIN = 34, LAST = 18; let best = null, bestCost = 1e9;
  const tryRoute = (dirs, lens) => {
    let cost = 0; for (let i = 0; i < lens.length; i++) { if (lens[i] < (i === 0 ? min1 : i === lens.length - 1 ? LAST : LMIN)) return; cost += lens[i]; }
    cost += 160 * (lens.length - 1);
    if (cost >= bestCost) return;
    const pts = [A.slice()]; let x = A[0], z = A[1];
    for (let i = 0; i < lens.length; i++) {
      const d = DIRS[dirs[i]], n = Math.ceil(lens[i] / 4);
      if (bad) for (let k = 1; k <= n; k++) if (bad(x + d[0] * lens[i] * k / n, z + d[1] * lens[i] * k / n)) return;
      x += d[0] * lens[i]; z += d[1] * lens[i]; pts.push([x, z]);
    }
    pts[pts.length - 1] = P.slice(); best = pts; bestCost = cost;
  };
  // two unknown lengths along directions e and f that close the gap g
  const solve2 = (g, e, f) => { const det = e[0] * f[1] - e[1] * f[0]; if (Math.abs(det) < 1e-6) return null; return [(g[0] * f[1] - g[1] * f[0]) / det, (e[0] * g[1] - e[1] * g[0]) / det]; };
  const turn = (a, b) => { const d = ((b - a) % 8 + 8) % 8; return d === 1 || d === 7; };
  const G = [P[0] - A[0], P[1] - A[1]];
  if (da === dp) { const al = G[0] * DIRS[da][0] + G[1] * DIRS[da][1], cr = Math.abs(G[0] * DIRS[da][1] - G[1] * DIRS[da][0]); if (cr < 0.01 && al > 0) tryRoute([da], [al]); }
  if (turn(da, dp)) { const s = solve2(G, DIRS[da], DIRS[dp]); if (s) tryRoute([da, dp], s); }
  for (const m of [(da + 1) % 8, (da + 7) % 8]) {
    if (turn(m, dp)) for (let l1 = min1; l1 <= 1300; l1 += 8) {
      const s = solve2([G[0] - DIRS[da][0] * l1, G[1] - DIRS[da][1] * l1], DIRS[m], DIRS[dp]); if (s) tryRoute([da, m, dp], [l1, s[0], s[1]]);
      if (l1 % 64 < 8) await ctx.yield();
    }
    for (const m2 of [(m + 1) % 8, (m + 7) % 8]) {
      if (m2 === da || !turn(m2, dp)) continue;
      for (let l1 = min1; l1 <= 700; l1 += 12) { for (let l4 = LAST; l4 <= 500; l4 += 10) {
        const s = solve2([G[0] - DIRS[da][0] * l1 - DIRS[dp][0] * l4, G[1] - DIRS[da][1] * l1 - DIRS[dp][1] * l4], DIRS[m], DIRS[m2]);
        if (s) tryRoute([da, m, m2, dp], [l1, s[0], s[1], l4]);
      } await ctx.yield(); }
    }
  }
  return best;
}

// colourways: sheet, key black, nine inks (0 is ours and always the brightest; 3 is the line the rare correction re-rules), tints
const COLOURWAYS = {
  marigold: { paper: '#F7F6F1', key: '#17181A', zones: ['#ECECE9', '#E1E2E0', '#D5D7D7'], river: '#BFE1EE', ferry: '#6FB4D6', park: '#DCEBCB', patch: '#F3EDD3',
    inks: ['#F2B50C', '#E8553D', '#0E8C86', '#7B2D6E', '#6FAE3B', '#2C56C6', '#E98BAB', '#9B5B2F', '#9A8FD6'] },
  cool: { paper: '#F5F6F4', key: '#17181A', zones: ['#EAECEC', '#DFE2E3', '#D2D6D9'], river: '#C4E2EC', ferry: '#73B3D2', park: '#D9EBD3', patch: '#F1EDD6',
    inks: ['#E8553D', '#0E8C86', '#9A8FD6', '#2C56C6', '#2F9E5B', '#35408F', '#6B2A5E', '#44586E', '#C46FB0'] },
  autumn: { paper: '#F7F2E6', key: '#1B1917', zones: ['#EDE8DC', '#E2DDD0', '#D6D0C2'], river: '#C3DEE2', ferry: '#77AFC0', park: '#DFE6C3', patch: '#F2E7C4',
    inks: ['#F0A818', '#9B5B2F', '#6FAE3B', '#7B2D6E', '#C8442B', '#4E6B3A', '#D98E6A', '#5A3A2E', '#B7A13C'] },
};
const mixHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

export default {
  id: 'octilinear-city',
  name: 'The City That Is Only Its Map',
  category: 'bizarre',
  weirdness: 0.65,
  media: ['rail', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------------- the visit: colourway, edition, service ----------------
    const colourway = ['marigold', 'cool', 'autumn', 'marigold'][rng.int(0, 3)];
    const edition = ['current', 'early', 'planned'][rng.int(0, 2)];
    const hour = vary.hour || 'any', pickS = rng();
    const service = (hour === 'golden' || hour === 'night') ? 'last' : hour === 'dawn' ? 'rush' : hour === 'day' ? (pickS < 0.5 ? 'midday' : 'rush') : (pickS < 0.58 ? 'rush' : pickS < 0.85 ? 'midday' : 'last');
    const rare = !!vary.rare;
    const cw = COLOURWAYS[colourway], warm = service === 'last' ? 0.55 : 0;
    const paperHex = mixHex(cw.paper, '#F8F0DC', warm), zonesHex = cw.zones.map((z) => mixHex(z, '#E3D8C0', warm * 0.5));
    const style = createStyle({ palette: [paperHex, cw.key, cw.inks[0], cw.inks[1], cw.inks[2], cw.inks[5], zonesHex[2]], inks: cw.inks, exposure: EXPOSURE });
    const C = style.colors; style.uniforms.uRule.value.set(170, 34, 0, 10);      // the hero's ruled line: bolder dashes for its 7.5 m ribbon, and the world's round ruling point at the tip
    C.zone[0].copy(style.ink(zonesHex[0])); C.zone[1].copy(style.ink(zonesHex[1])); C.river.copy(style.ink(cw.river)); C.park.copy(style.ink(cw.park));
    C.patch.copy(style.ink(cw.patch)); C.crease.copy(style.ink(zonesHex[1]));
    const ferryCol = style.ink(cw.ferry);
    // (on the fat lines of the sheet a dash is drawn only where it is longer than it is wide on screen: uRule.w)
    // the suburbs have more lines than one style's sixteen ruling slots: two further styles share the colours
    const subStyles = [0, 1, 2, 3].map(() => createStyle({ palette: style.palette, inks: cw.inks, exposure: EXPOSURE }));
    for (const s of subStyles) { s.uniforms.uTT.value.set(3.3, 0.3); s.uniforms.uRule.value.set(RULE, DASH, 0, s === subStyles[0] ? 3 : 16); s.uniforms.uFront.value.set(WELL[0], WELL[1], 1e5); }
    await ctx.yield();

    // ---------------- the hero: the Grand Interchange ----------------
    const hero = await buildHero(ctx, { style, detail, exposure: EXPOSURE, standalone: false, ownTrains: false, wellWidth: 9, ourWidth: 7, dashPeriod: 34, ourY: RIDE, capsuleTop: 190, clearOver: 17, correction: rare, trains: service === 'rush' ? 1.6 : 1 });
    hero.object.position.set(WELL[0], 0, WELL[1]);
    scene.add(hero.object);
    await ctx.yield();
    const HA = hero.anchors, W3 = (p) => [p[0] + WELL[0], p[1], p[2] + WELL[1]];
    const ends = HA.lineEnds;

    // ---------------- our line through the suburbs, and the camera's path 2.4 m over it ----------------
    const in0 = W3(ends[0].in.p), Y0 = in0[1];
    const B2 = [in0[0], in0[2] - 17], B1 = [0, B2[1] - in0[0]];
    const ourCorners = [[0, Y0, -90], [0, Y0, B1[1]], [B2[0], Y0, B2[1]], in0];
    const ourLine = filletLine(ourCorners);
    const pathPts = [], deckPts = [];                          // the eye's path, and the same path lying on our line (our own dash rides it)
    const rimZ = W3(HA.rampTop)[2], eyeSub = (z) => EYEW + (EYE - EYEW) * ease((rimZ - 14 - z) / 96);     // the eye swoops down to the dash as the rim comes up
    for (let s = 90; s < ourLine.length - 4; s += 10) { const p = lineAt(ourLine, s).p; pathPts.push([p[0], p[1] + eyeSub(p[2]), p[2]]); deckPts.push(p); }
    const term = W3(HA.portalSeat.position);
    // In the well the eye keeps its height only where there is room for it: under a line that crosses close over ours it comes down
    // toward the dash, eased over a few lengths, so no ribbon ever passes at the lens.
    const others = [];
    for (let i = 1; i < hero.lines.length + (hero.correction ? 1 : 0); i++) { const ln = hero.lines[i] || hero.correction.alt;
      for (let s2 = 0; s2 <= ln.length; s2 += 4) { const p = lineAt(ln, s2).p; others.push(p[0] + WELL[0], p[1], p[2] + WELL[1]); }
      await ctx.yield(); }
    const flyW = HA.flyThrough.map(W3), room = [];
    for (let j = 0; j < flyW.length; j++) { const q = flyW[j]; let m = 1e9;
      for (let k = 0; k < others.length; k += 3) { const dy = others[k + 1] - (q[1] - 2.4); if (dy > 1 && dy < 40 && dy < m && Math.hypot(others[k] - q[0], others[k + 2] - q[2]) < 12) m = dy; }
      room.push(clamp(m - 14, 3.4, EYEW));
      if (j % 8 === 7) await ctx.yield(); }
    await ctx.yield();
    flyW.forEach((q, k) => {
      let lo = 0, n = 0; for (let j = -3; j <= 3; j++) { let m = 1e9; for (let i = -2; i <= 2; i++) m = Math.min(m, room[clamp(k + j + i, 0, room.length - 1)]); lo += m; n++; }
      const e0 = q[1] > Y0 ? eyeSub(q[2]) : lo / n, e = 2.4 + (e0 - 2.4) * ease((Math.abs(q[0] - term[0]) + Math.abs(q[2] - term[2])) / 70);
      if (q[2] > in0[2] + 6 || q[1] < Y0) { pathPts.push([q[0], q[1] - 2.4 + e, q[2]]); deckPts.push([q[0], q[1] - 2.4, q[2]]); }
    });
    await ctx.yield();
    const path = makePath(pathPts);
    await ctx.yield();
    const deck = makePath(deckPts);
    await ctx.yield();
    // the level part of the path, for clearance tests in plan: its straights thinned to their two ends (same distances, a tenth of the work)
    const subAll = pathPts.filter((p) => p[1] > Y0 - 2);
    const subPath = subAll.filter((p, k) => { const a = subAll[k - 1], c = subAll[k + 1]; return !a || !c || Math.abs((p[0] - a[0]) * (c[2] - p[2]) - (p[2] - a[2]) * (c[0] - p[0])) > 1e-3; });
    const planDist = (x, z) => { let b = 1e9; for (let k = 1; k < subPath.length; k++) { const a = subPath[k - 1], c = subPath[k], dx = c[0] - a[0], dz = c[2] - a[2], t = clamp(((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t); if (d < b) b = d; } return b; };
    await ctx.yield();

    // ---------------- the other eight lines: the bundle ----------------
    // Seven stripes abreast: ours on the ridge and three a side, 4.5 m apart, each 1.6 m lower than the one inside it (a stepped
    // roof, so every deck shows from the ridge). A stripe swings in at 45 degrees (the inner ones first), runs the north leg and
    // the diagonal over the river with us, then leaves: a line bound for the well by its own ruled route to its face, a branch
    // (the same nine inks, no tenth) by fanning away from the rim, off the sheet.
    const inWell = (x, z) => oct8(x - WELL[0], z - WELL[1]) < 224;
    const LANE = 5, STEP = 1.0, SLOTS = 3, JZ = [6, 52, 98], T = 16.6, LIP = 0.9;
    const net = [];                                            // { hl (hero line index), lvl, corners [[x,z]...], corners3, kind }
    const cands = [], OFFS = [LANE, 2 * LANE, 3 * LANE, 26, 32, 38, 44, 50, 56, 62];
    const laneStart = (o) => [o, B1[1] - 0.4142 * o];              // where the lane at offset o (+ = south-east of ours) starts its diagonal
    const laneY = (om) => Y0 - STEP * om / LANE;
    const badFor = () => inWell;                                 // every other level lies well under the viaduct
    for (let i = 1; i < ends.length; i++) {
      const e = ends[i], lvl = e.suburbLevel, bad = badFor(lvl);
      let best = null;
      for (const end of ['in', 'out']) {
        if (!e[end]) continue;
        const P = W3(e[end].p), d = e[end].dir, dp = end === 'in' ? dirIndex(d[0], d[2]) : dirIndex(-d[0], -d[2]);
        for (const side of [-1, 1]) for (const om of OFFS) {
          const r = await connect(laneStart(side * om), 1, [P[0], P[2]], dp, 108, bad, ctx);
          await ctx.yield();
          if (!r) continue;
          const first = Math.hypot(r[1][0] - r[0][0], r[1][1] - r[0][1]);
          if (!best || om < best.om) best = { i, end, P, dp, om, first, side, lvl };
          break;
        }
        await ctx.yield();
      }
      if (best) cands.push(best);
    }
    // a stripe keeps its lane level to the end of its first straight where there is room, then takes one 45 degree ramp to its suburb level
    const withRamp = (corners, nr, yLane, yStub, late) => {
      const dy = Math.abs(yStub - yLane), i1 = corners.length - nr + 1;      // i1: the corner that ends the diagonal
      const c3 = corners.map((q, k) => [q[0], k < i1 ? yLane : yStub, q[1]]);
      if (dy < 0.5) return c3;
      const ramp = (k, from) => {
        const a = corners[k], b = corners[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
        for (let q = 0; q < c3.length; q++) c3[q][1] = q <= k ? yLane : yStub;
        c3.splice(k + 1, 0, [a[0] + ux * from, yLane, a[1] + uz * from], [a[0] + ux * (from + dy), yStub, a[1] + uz * (from + dy)]);
      };
      const dl = Math.hypot(corners[i1][0] - corners[i1 - 1][0], corners[i1][1] - corners[i1 - 1][1]);
      for (const from of [150, 130, 108 + T]) if (!late && dl - from >= dy + 2 * T) { ramp(i1 - 1, from); return c3; }
      for (let k = corners.length - 2; k >= i1; k--) {
        const l = Math.hypot(corners[k + 1][0] - corners[k][0], corners[k + 1][1] - corners[k][1]);
        if (l >= dy + 4 * T + 1) { ramp(k, 2 * T); return c3; }
      }
      return null;
    };
    const offsetCorners = (cs, o) => cs.map((c, k) => {
      const a = cs[Math.max(k - 1, 0)], b = cs[Math.min(k + 1, cs.length - 1)];
      const n1 = k > 0 ? [c[1] - a[1], a[0] - c[0]] : null, n2 = k < cs.length - 1 ? [b[1] - c[1], c[0] - b[0]] : null;
      const nm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
      const u1 = nm(n1 || n2), u2 = nm(n2 || n1), m = nm([u1[0] + u2[0], u1[1] + u2[1]]), cs2 = Math.max(0.5, m[0] * u1[0] + m[1] * u1[1]);
      return [c[0] + m[0] * o / cs2, c[1] + m[1] * o / cs2];
    });
    // the two ways a branch leaves the bundle, as centre lines for a lane at offset 0: west side north-west round the well,
    // east side straight on past our left turn and then east along the well's south face
    const PL = [B1[0] + 156 * S2, B1[1] + 156 * S2], PR = [B1[0] + 222 * S2, B1[1] + 222 * S2];
    const refL = [[0, -100], B1, PL, [PL[0], PL[1] + 44], [-24, PL[1] + 44 + PL[0] + 24], [-24, PL[1] + 1700]];
    const refR = [[0, -100], B1, PR, [PR[0] + 330, PR[1]], [PR[0] + 330 + 1500 * S2, PR[1] + 1500 * S2]];
    const joined = (cs, o, jz) => { const d = o < 0 ? DIRS[1] : DIRS[7], J = [o, jz]; return [[J[0] - d[0] * 900, J[1] - d[1] * 900], J].concat(cs.slice(1)); };
    const usedEnd = new Map(), taken = new Set();
    const slots = { '-1': [null, null, null], '1': [null, null, null] };
    for (const side of [-1, 1]) {
      const list = cands.filter((c) => c.side === side).sort((a, b) => (a.om - b.om) || (b.first - a.first));
      let feeder = false;
      for (const c of list) {
        let done = false;
        for (let k = 0; k < SLOTS && !done; k++) {
          const om = LANE * (k + 1);
          if (slots[side][k] || om < c.om - 0.01) continue;
          const r = await connect(laneStart(side * om), 1, [c.P[0], c.P[2]], c.dp, 108, badFor(c.lvl), ctx);
          await ctx.yield();
          if (!r) continue;
          const corners = joined([[0, 0]].concat(r), side * om, JZ[k]);
          const c3 = withRamp(corners, r.length, laneY(om), 8 * c.lvl, 8 * c.lvl > Y0 - 4 && k < 2);
          if (!c3) continue;
          slots[side][k] = { hl: c.i, lvl: c.lvl, corners, corners3: c3, yLane: laneY(om), kind: 'bundle', lane: side * om, slot: k, nest: side * om, nest0: 2 };
          net.push(slots[side][k]); usedEnd.set(c.i, c.end); taken.add(c.i); done = true;
        }
        // a line that can only reach its face from further out feeds in along the diagonal on its own suburb level
        if (!done && !feeder && c.om > SLOTS * LANE) {
          const r = await connect(laneStart(side * c.om), 1, [c.P[0], c.P[2]], c.dp, 108, badFor(c.lvl), ctx);
          await ctx.yield();
          if (r) { net.push({ hl: c.i, lvl: c.lvl, corners: [[r[0][0] - S2 * 900, r[0][1] - S2 * 900]].concat(r.slice(1)), kind: 'feeder' }); usedEnd.set(c.i, c.end); taken.add(c.i); feeder = true; }
        }
      }
      await ctx.yield();
    }
    // A branch rides the viaduct only as far as the rim: where the stripes part it dives a 45 degree ramp to the sheet (levels between
    // the ruled ones, so it is never coplanar with a line of the fan) and runs on below, in plan, clear of the view to the well.
    const dive = (cs, k, from, yTop, yLow) => {
      const a = cs[k], b = cs[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, dy = yTop - yLow;
      const c3 = cs.map((q, i) => [q[0], i <= k ? yTop : yLow, q[1]]);
      c3.splice(k + 1, 0, [a[0] + ux * from, yTop, a[1] + uz * from], [a[0] + ux * (from + dy), yLow, a[1] + uz * (from + dy)]);
      return c3;
    };
    // (the three of a side dive one after another, so from the side they are three separate strokes)
    // branches fill the lanes no line could take, in inks the bundle does not have yet; then the lines overhead
    const pool = []; for (let i = 1; i < ends.length; i++) if (!taken.has(i)) pool.push(i);
    for (let i = 1; i < ends.length; i++) if (taken.has(i)) pool.push(i);
    let nextInk = 0; const branchInk = () => pool[(nextInk++) % pool.length];
    for (const side of [-1, 1]) for (let k = 0; k < SLOTS; k++) {
      if (slots[side][k]) continue;
      const om = LANE * (k + 1), o = side * om, corners = joined(offsetCorners(side < 0 ? refL : refR, o), o, JZ[k]);
      slots[side][k] = { hl: branchInk(), lvl: 6, corners, corners3: dive(corners, side < 0 ? 4 : 3, side < 0 ? 22 + 28 * k : 70 + 38 * k, laneY(om), 12 + 8 * k), yLane: laneY(om), kind: 'bundle', branch: true, lane: o, slot: k, nest: o, nest0: 2 };
      net.push(slots[side][k]);
    }
    // overhead: one line swings in a level above the west stripes and rides with the bundle, undersides showing; one crosses
    // the north leg two levels up at 45 degrees. Neither level is a multiple of 8 m, so no routed line is ever coplanar with them.
    const YO2 = Y0 + 39, TOWER = [-124, 292];           // the west interchange stands under the line that is being ruled two levels up
    { const c2 = [[640, -548], [-124, 216], [-124, 1900]];                 // it is still being ruled: its dashes and black point cross the entry frame
      net.push({ hl: branchInk(), lvl: 8, corners: c2, corners3: c2.map((q) => [q[0], YO2, q[1]]), kind: 'over', ruled: true, rulePhase: 0, cross: true });
      // the extension: a line a level down, west of the bundle, that rules itself on just ahead of us
      const c4 = [[-52, -100], [-52, 2000]];                               // it runs dead straight north beside the viaduct, a level down, dives to the sheet before the bend and rules on past the well
      net.push({ hl: branchInk(), lvl: 5, corners: c4, corners3: dive(c4, 0, 246, Y0 - 10.4, 36), kind: 'ext', ruled: true, rulePhase: 0, lead: true }); }
    // the west trunk: three lines abreast on the sheet (one level, never crossing each other), running with the course on its west
    // side and stepping aside round the well on two diagonals; one long interchange capsule lies across them at the foot of the
    // west interchange. Whatever the seed has ruled, the sheet west of the viaduct holds this one clear subject.
    const TRUNK = [[-236, -800], [-236, 20], [-162, 94], [-162, 566], [-262, 666], [-262, 1600]], TRUNKY = 12;
    for (let k = 0; k < 3; k++) { const o = 13 * (k - 1), cs = offsetCorners(TRUNK, o);
      net.push({ hl: branchInk(), lvl: 0, corners: cs, corners3: cs.map((q) => [q[0], TRUNKY, q[1]]), kind: 'trunk', nest: o, nest0: 1, nestLast: 99 }); }
    await ctx.yield();
    // free ends: an ordered fan. Every line that leaves the well and no stripe of the bundle carries on out across the sheet by
    // one or two 45 degree turns, and the routes are chosen together, as a draughtsman would: no two of them cross where the eye
    // is, none runs stacked over another or along under the bundle, nothing above eye level lies along or across our own course,
    // they prefer to run with the course or on a diagonal (a line that lies across the entry view is one more thread at the
    // horizon), both sides of the course get their share, and the far ends leave by different ways.
    const segDist = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
    const polyDist = (x, z, cs) => { let b = 1e9; for (let k = 1; k < cs.length; k++) b = Math.min(b, segDist(x, z, cs[k - 1], cs[k])); return b; };
    // plan segments with their bounding boxes: [ax, az, bx, bz, minx, maxx, minz, maxz]
    const segsOf = (cs, into) => { for (let k = 1; k < cs.length; k++) { const a = cs[k - 1], b = cs[k]; into.push([a[0], a[1], b[0], b[1], Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1])]); } return into; };
    const nearSegs = (x, z, list, lim) => { let m = 1e9; for (const g of list) { if (x < g[4] - lim || x > g[5] + lim || z < g[6] - lim || z > g[7] + lim) continue;
      const dx = g[2] - g[0], dz = g[3] - g[1], t = clamp(((x - g[0]) * dx + (z - g[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(x - g[0] - dx * t, z - g[1] - dz * t); if (d < m) m = d; } return m; };
    const crossSegs = (cs, list) => { let n = 0; for (let k = 1; k < cs.length; k++) { const a = cs[k - 1], b = cs[k], x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), z0 = Math.min(a[1], b[1]), z1 = Math.max(a[1], b[1]);
      for (const g of list) { if (x1 < g[4] || x0 > g[5] || z1 < g[6] || z0 > g[7]) continue;
        const rx = b[0] - a[0], rz = b[1] - a[1], sx = g[2] - g[0], sz = g[3] - g[1], den = rx * sz - rz * sx; if (Math.abs(den) < 1e-6) continue;
        const t = ((g[0] - a[0]) * sz - (g[1] - a[1]) * sx) / den, v = ((g[0] - a[0]) * rz - (g[1] - a[1]) * rx) / den;
        if (t > 0 && t < 1 && v > 0 && v < 1 && oct8(a[0] + rx * t - WELL[0], a[1] + rz * t - WELL[1]) < 760) n++; } } return n; };
    const ourSegs = segsOf(ourCorners.map((c) => [c[0], c[2]]), []), fixedSegs = ourSegs.slice(); for (const n of net) segsOf(n.corners, fixedSegs);
    const placedSegs = [], placed = [], frng = rng.fork ? rng.fork('fan') : rng;
    const freeEnds = [];
    for (let i = 1; i < ends.length; i++) for (const end of ['in', 'out']) {
      const e = ends[i]; if (!e[end] || usedEnd.get(i) === end) continue;
      const P3 = W3(e[end].p), d = e[end].dir;
      freeEnds.push({ i, end, lvl: e.suburbLevel, P: [P3[0], P3[2]], d0: end === 'out' ? dirIndex(d[0], d[2]) : dirIndex(-d[0], -d[2]) });
    }
    freeEnds.sort((a, b) => (a.P[0] - a.P[1] * 0.3) - (b.P[0] - b.P[1] * 0.3));
    for (const fe of freeEnds) {
      const { i, end, lvl, P, d0 } = fe;
      const same = net.filter((n) => n.lvl === lvl);
      const bad = (x, z) => inWell(x, z) || Math.hypot(x - TOWER[0], z - TOWER[1]) < 22 || same.some((n) => polyDist(x, z, n.corners) < 13);
      const cands = [];
      for (let a = -2; a < 9; a++) for (const t1 of [1, 7]) {
        const l1 = a < -1 ? 34 : 34 + 30 * (a + 2), d1 = (d0 + t1) % 8, c1 = [P[0] + DIRS[d0][0] * l1, P[1] + DIRS[d0][1] * l1];
        cands.push({ cs: [P, c1, [c1[0] + DIRS[d1][0] * 1500, c1[1] + DIRS[d1][1] * 1500]], last: d1 });
        for (let b = 0; b < 6; b++) for (const t2 of [t1, 8 - t1]) {
          const l2 = 90 + 62 * b, d2 = (d1 + t2) % 8, c2 = [c1[0] + DIRS[d1][0] * l2, c1[1] + DIRS[d1][1] * l2];
          cands.push({ cs: [P, c1, c2, [c2[0] + DIRS[d2][0] * 1500, c2[1] + DIRS[d2][1] * 1500]], last: d2, turns: t2 === t1 ? 100 : 40 });
        }
      }
      let nc = 0;
      for (const c of cands) {
        const west = c.cs[c.cs.length - 1][0] < 0; c.west = west;
        let ns = 0, no = 0, nl = 0; for (const p of placed) { if (p.west === west) ns++; else no++; if (p.last === c.last) nl++; }
        let cost = frng() * 22 + (c.turns || 0) + (c.cs[1] && Math.hypot(c.cs[1][0] - P[0], c.cs[1][1] - P[1]) < 40 ? 30 : 0) + (c.last === 2 || c.last === 6 ? 90 : c.last & 1 ? 25 : 0) + 12 * nl + 60 * Math.max(0, ns - no);
        cost += 130 * crossSegs(c.cs, placedSegs);
        for (const p of placed) if (p.hl === i) cost += 500 * crossSegs(c.cs, p.segs);       // a line never crosses its own other end: an X of one ink reads as a mistake
        let run = 0;
        for (let k = 1; k < c.cs.length && run < 640; k++) {
          const a = c.cs[k - 1], b = c.cs[k], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ew = k < 2 ? 0 : Math.abs(b[1] - a[1]) < 1 ? 9 : Math.abs(b[0] - a[0]) > 1 ? 3 : 0;
          let along = 0;
          for (let s = 15; s < l && run + s < 640; s += 30) {
            const x = a[0] + (b[0] - a[0]) * s / l, z = a[1] + (b[1] - a[1]) * s / l;
            const dm = nearSegs(x, z, placedSegs, 24), df = nearSegs(x, z, fixedSegs, 13);
            cost += ew + (dm < 13 ? 44 : dm < 24 ? 7 : 0) + (df < 13 ? 12 : 0);
            if (planDist(x, z) < 30 && ++along > 2) cost += 60;        // under the viaduct a line is hidden: cross it square or on the diagonal, never run along beneath it
          }
          run += l;
        }
        c.cost = cost;
        if (++nc % 24 === 0) await ctx.yield();
      }
      await ctx.yield();
      cands.sort((a, b) => a.cost - b.cost);
      let got = null, clean = true;
      for (let q = 0; q < cands.length && !got; q++) {
        const cs = cands[q].cs; let ok = true;
        for (let k = 1; k < cs.length && ok; k++) { const n = Math.ceil(Math.hypot(cs[k][0] - cs[k - 1][0], cs[k][1] - cs[k - 1][1]) / (lvl === 7 ? 3 : 12));
          for (let s = 1; s <= n && ok; s++) if (bad(lerp(cs[k - 1][0], cs[k][0], s / n), lerp(cs[k - 1][1], cs[k][1], s / n))) ok = false; }
        if (ok) got = cands[q];
        if (q % 12 === 11) await ctx.yield();
      }
      if (!got) { got = cands[0]; clean = false; }
      got.hl = i; got.segs = segsOf(got.cs, []); placed.push(got); segsOf(got.cs, placedSegs);
      net.push({ hl: i, lvl, corners: got.cs, kind: 'free', end, outward: true });
      await ctx.yield();
    }

    // ---------------- every suburb line as a filleted centre line; sixteen to a style ----------------
    const FREEW = 9;                                             // the lines of the sheet below are drawn at the map's bold weight: they are read from the viaduct, a hundred metres up
    const subs = [{ hl: 0, lvl: 6, line: ourLine, kind: 'ours', ink: C.inks[0] }];
    for (const n of net) {
      const y = n.yLane ?? 8 * n.lvl, c3 = n.corners3 || n.corners.map((c) => [c[0], y, c[1]]);
      // stripes that turn abreast share one centre: a lane at offset o turns with radius 40 - o on its own side, 40 + o on the other
      const nest = n.nest || 0, last = n.nestLast || (n.branch || n.kind === 'over' || n.kind === 'ext' ? c3.length : 3);
      const rad = (i) => { if (!nest || i < n.nest0 || i >= last) return 40;
        const a = c3[i - 1], b = c3[i], c = c3[i + 1], tr = (c[0] - b[0]) * (b[2] - a[2]) - (c[2] - b[2]) * (b[0] - a[0]);
        return Math.abs(tr) < 1e-3 ? 40 : 40 - nest * Math.sign(tr); };
      const line = filletLine(c3, rad);
      if (n.kind === 'free') setWidths(line, (p, i) => 3 + (FREEW - 3) * ease((line.arc[i] - 24) / 90));
      if (n.kind === 'trunk') setWidths(line, () => FREEW);
      subs.push({ ...n, y, line, ink: C.inks[hero.inkOf[n.hl]] });
    }
    await ctx.yield();
    // which free lines are still being ruled: two in every edition, five in the early edition; the planned edition adds four
    // pale open-cased extensions on the last straight of four others
    const frees = subs.filter((s) => s.kind === 'free');
    for (const s of frees) { let along = 0, near = 1e9;
      for (let a = 40; a < Math.min(s.line.length, 760); a += 12) { const q = lineAt(s.line, a).p, d = planDist(q[0], q[2]); if (d < 18) along += 12; near = Math.min(near, d); }
      s.rank = (s.lvl >= 7 || along > 50 ? 1e4 : 0) + Math.abs(near - 60); }
    await ctx.yield();
    const byNear = frees.slice().sort((a, b) => a.rank - b.rank);
    const nRuled = Math.min(byNear.length, edition === 'early' ? 5 : service === 'last' ? 4 : 2);   // after the last trains the draughtsman extends the lines
    for (let k = 0; k < nRuled; k++) { if (byNear[k].rank < 1e4) byNear[k].ruled = true; byNear[k].rulePhase = rng(); }
    if (edition === 'planned') for (let k = nRuled; k < Math.min(byNear.length, nRuled + 4); k++) byNear[k].planned = true;
    // style groups (sixteen ruling slots each): 0 the viaduct (ours, the stripes, the lines overhead), 1 the fan on the sheet, 2 the ferry lanes
    { let nA = 0, nB = 0; for (const s of subs) { if (s.kind === 'free' || s.kind === 'trunk') { s.group = 1 + (nB >> 4); s.slot = nB & 15; nB++; } else { s.group = 0; s.slot = nA++; } } }
    const gRiver = 1 + Math.max(1, Math.ceil((frees.length + 3) / 16)); let nRiver = 0;

    // ---------------- the river: a pale band that bends at 45 degrees, with two ferry lanes ----------------
    // The river crosses the north leg square-on under the first interchange (z 112 to 212), bends 45 degrees to run beside the
    // diagonal on its south-east side, where it lies open to the eye from the ridge, and bends again east below the well.
    const RIVW = 100, RC = 162, river = [[-1500, RC], [58, RC], [58 + 150, RC + 150], [1700, RC + 150]];
    for (const o of [-20, 20]) {
      const line = setWidths(filletLine(offsetCorners(river, o).map((c) => [c[0], 0.9, c[1]])), () => 6.4);
      subs.push({ hl: -1, lvl: 0, line, kind: 'river', ink: ferryCol, group: gRiver, slot: nRiver++, bank: o });
    }
    // the moat on the floor of the well: one more ferry lane, a closed octagon between two files of the concourse
    { const c8 = Math.cos(Math.PI / 8), oc = (k) => { const a = (k + 0.5) * Math.PI / 4; return [WELL[0] + Math.cos(a) * 102.5 / c8, HA.floorY + 0.9, WELL[1] + Math.sin(a) * 102.5 / c8]; };
      const m0 = oc(-1), m1 = oc(0), mid = [(m0[0] + m1[0]) / 2, m0[1], (m0[2] + m1[2]) / 2], cs = [mid];
      for (let k = 0; k < 8; k++) cs.push(oc(k)); cs.push(mid);
      subs.push({ hl: -1, lvl: 0, line: setWidths(filletLine(cs), () => 5.4), kind: 'river', basin: true, ink: ferryCol, group: gRiver, slot: nRiver++, bank: 1 }); }
    const nGroups = gRiver + 1;

    // ---------------- marks: ribbons, ticks, capsules, stems (one mesh per style group), dashes and dots ----------------
    const UP = [0, 1, 0];
    const MB = [], trainsG = [], dotsG = [], infoG = [];
    for (let g = 0; g < nGroups; g++) { MB.push(new MarkBuffer()); trainsG.push([]); dotsG.push([]); infoG.push([]); }
    const keepP = (service === 'rush' ? 0.9 : service === 'midday' ? 0.6 : 0.5) * Math.min(1.15, density) * (0.5 + 0.5 * detail);
    const rushP = service === 'rush' ? 0.95 * detail * density : 0;
    const farOf = (p) => oct8(p[0] - WELL[0], p[2] - WELL[1]);
    const offsetLine = (line, o) => {
      const n = line.pts.length, pts = line.pts.map((p, i) => { const a = line.pts[Math.max(i - 1, 0)], b = line.pts[Math.min(i + 1, n - 1)], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1; return [p[0] + dz / l * o, p[1], p[2] - dx / l * o]; });
      const arc = [0]; for (let i = 1; i < n; i++) arc.push(arc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
      return { pts, arc, length: arc[n - 1] };
    };
    let nTicks = 0;
    for (let n = 0; n < subs.length; n++) {
      const sb = subs[n], ln = sb.line, M = MB[sb.group], idx = sb.ruled ? sb.slot : -1, L = ln.length;
      // the ribbon (a planned extension: ink up to the last straight, then only its open casing in the palest key grey)
      let sEnd = Infinity;
      if (sb.planned) { sEnd = ln.arc[ln.pts.length - 2] + 60;
        for (const o of [-(FREEW / 2 + 0.25), FREEW / 2 + 0.25]) { const e = setWidths(offsetLine(ln, o), () => 0.5); M.ribbon(e, -1, C.zone[2], sEnd + 14, Math.min(L, sEnd + 1100)); }
        M.prism(stadium(9, 5, 6), lineAt(ln, sEnd).p, [1, 0, 0], [0, 0, 1], UP, 0.8, C.paper); }
      if (sb.kind !== 'river') M.ribbon(ln, idx, sb.ink, 0, sEnd);
      if (sb.ruled) M.caps(ln, idx, sb.ink, sb.cross ? 700 : 0, sb.cross ? 1460 : Math.min(L, 1500), DASH);     // end faces for its dashes
      if (sb.kind === 'ours' || (sb.kind === 'bundle' && sb.lane)) {
        let s1 = L; if (sb.kind === 'bundle') { s1 = 900; while (s1 < L - 6) { const q = lineAt(ln, s1).p; if (planDist(q[0], q[2]) > SLOTS * LANE + 9) break; s1 += 6; } }
        for (const sd of sb.kind === 'ours' ? [-1, 1] : [Math.sign(sb.lane)]) {
          const n0 = M.n; M.ribbon(setWidths(offsetLine(ln, sd * (1.5 + LIP / 2)), () => LIP), -1, C.paper, 0, s1);
          for (let q = n0 * 4; q < M.n * 4; q++) M.grow[q] = 0;                 // a lip keeps its true size: far off it is gone, not a white band
        }
      }
      // stations: a white tick each, a file of waiting dots, and the dashes of the timetable
      const spacing = sb.kind === 'river' ? 46 : 60, stops = Math.max(1, Math.round(L / spacing)), D = L / stops, sSt = D * 0.5;
      const dir = sb.kind === 'river' ? (sb.bank > 0 ? 1 : -1) : sb.kind === 'ours' ? 1 : (rng.chance(0.5) ? 1 : -1), clock = rng();
      infoG[sb.group][sb.slot] = { spacing, dir, clock };
      const base = dir > 0 ? sSt : ((L - sSt) % D + D) % D;
      for (let m = 0; m < stops; m++) {
        const s = sSt + m * D, f = lineAt(ln, s), far = farOf(f.p), keep = rng(), q1 = rng(), q2 = rng();
        if (far > 1050 || s > sEnd) continue;
        const T = f.t; let R = [T[2], 0, -T[0]]; if ((m & 1) && sb.kind !== 'ours') R = [-R[0], 0, -R[2]];
        if (sb.kind === 'river') {
          // a white pier tick on the bank beside each ferry stop; ferries are few, one lane each way
          const side = sb.bank > 0 ? 1 : -1, Rb = [T[2] * side, 0, -T[0] * side], o = [f.p[0] + Rb[0] * (RIVW / 2 - 20 + 1), 0.25, f.p[2] + Rb[2] * (RIVW / 2 - 20 + 1)];
          if (m % 2 === 0 && !sb.basin) M.prism([[-1.5, -9], [1.5, -9], [1.5, 6], [-1.5, 6]], o, T, Rb, UP, 0.3, C.paper);
          if (far < 1000) trainsG[sb.group].push({ line: sb.slot, start: base + m * D, lag: 0, rush: 0, color: sb.ink });
          continue;
        }
        if (sb.kind !== 'ours') {
          const hw = f.w / 2; M.prism([[-0.5, -hw], [0.5, -hw], [0.5, hw + 1.5], [-0.5, hw + 1.5]], f.p, T, R, UP, 0.74, C.paper, [idx, s, 2]); nTicks++;
          if (keep < keepP) {
            trainsG[sb.group].push({ line: sb.slot, start: base + m * D, lag: 0, rush: 0, color: sb.ink });
            if (q1 < rushP) trainsG[sb.group].push({ line: sb.slot, start: base + m * D - 21, lag: 0.4, rush: 1, color: sb.ink });
            if (q1 < rushP && q2 < 0.6) trainsG[sb.group].push({ line: sb.slot, start: base + m * D - 42, lag: 0.8, rush: 1, color: sb.ink });
          }
          const nd = (sb.ruled || planDist(f.p[0], f.p[2]) > 420) ? 0 : Math.round(6 * detail);
          for (let q = 0; q < nd; q++) dotsG[sb.group].push({ p: [f.p[0] + R[0] * (f.w / 2 + 1.25) + T[0] * (1.3 + q * 1.05), f.p[1] + 0.34, f.p[2] + R[2] * (f.w / 2 + 1.25) + T[2] * (1.3 + q * 1.05)], d: [0, 0, 1], run: 1, gate: 1 + 0.99 * q / nd, clock, n: UP });
        }
      }
      await ctx.yield();
    }
    // our own line's ticks follow the squeeze: 30 m apart at the entry, wider toward the well; a waiting file at each
    { const M = MB[0]; let s = 96, k = 0;
      while (s < ourLine.length - 8) {
        const f = lineAt(ourLine, s), T = f.t, sd = (k & 1) ? 1 : -1, R = [T[2] * sd, 0, -T[0] * sd];
        M.prism([[-0.5, -1.5], [0.5, -1.5], [0.5, 3], [-0.5, 3]], f.p, T, R, UP, 0.66, C.paper); nTicks++;
        // and its upright edge, which never thins below a band: the ticks down our own ribbon read to the first interchange
        { const a = [f.p[0] - R[0] * 1.5, f.p[1] + 0.33, f.p[2] - R[2] * 1.5], b = [f.p[0] + R[0] * 3, f.p[1] + 0.33, f.p[2] + R[2] * 3], g = [0, 1, 0, 0.4];
          const i0 = M.v(a, C.paper), i1 = M.v(b, C.paper), i2 = M.v([b[0], b[1] + 0.4, b[2]], C.paper, g), i3 = M.v([a[0], a[1] + 0.4, a[2]], C.paper, g);
          M.idx.push(i0, i1, i2, i0, i2, i3); }
        const nd = Math.round(6 * detail);
        for (let q = 0; q < nd; q++) dotsG[0].push({ p: [f.p[0] + R[0] * 2.75 + T[0] * (1.3 + q * 1.05), f.p[1] + 0.34, f.p[2] + R[2] * 2.75 + T[2] * (1.3 + q * 1.05)], d: [0, 0, 1], run: 1, gate: 1 + 0.99 * q / nd, clock: k * 0.37, n: UP });
        s += lerp(30, 64, ease((s - 150) / 300)); k++;
      }
    }
    await ctx.yield();

    // ---------------- interchanges: black-ringed white capsules pinned through the levels by keylined stems ----------------
    const disc = (r, n = 18) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; };
    const stemAt = (M, x, z, y0, y1, dots, k = 1) => {
      const mid = [x, (y0 + y1) / 2, z], h = (y1 - y0) / 2 - 0.3, rect = (w) => [[-h, -w], [h, -w], [h, w], [-h, w]];
      if (h < 1) return;
      for (const ey of [[1, 0, 0], [0, 0, 1]]) { const ez = ey[0] ? [0, 0, 1] : [1, 0, 0];
        M.prism(rect(0.5 * k), mid, UP, ey, ez, 0.3, C.paper); M.band(rect(0.85 * k), rect(0.5 * k), mid, UP, ey, ez, 0.34, C.key);
        if (dots && ey[0]) for (const sd of [1, -1]) for (let s2 = 0; s2 < 2 * h - 2; s2 += 3.2 / detail)
          dots.push({ p: [mid[0] + ez[0] * sd * 0.19, mid[1] - h + 1, mid[2] + ez[2] * sd * 0.19], d: UP, run: 2 * h - 2, phase: s2, speed: sd * (ey[0] ? 3 : -3), n: ez }); }
    };
    // A bundle interchange: a black-ringed white capsule stood on edge across the stripes, high enough to pass under, held by a
    // keylined stem at each end from the outermost stripes, with two counter-flowing files of passengers on the face we meet.
    const gantry = (M, c, Tv, dots, yOver) => {
      const Rv = [Tv[1], -Tv[0]], ex = [Rv[0], 0, Rv[1]], ez = [Tv[0], 0, Tv[1]], half = SLOTS * LANE + 3, len = 2 * half + 7, yc = Y0 + 26;
      const o = [c[0], yc, c[1]];
      M.prism(stadium(len - 2.4, 4.6, 10), o, ex, UP, ez, 0.5, C.paper); M.band(stadium(len, 7, 10), stadium(len - 2.4, 4.6, 10), o, ex, UP, ez, 0.56, C.key);
      for (const sd of [-1, 1]) {
        const q = [c[0] + Rv[0] * half * sd, c[1] + Rv[1] * half * sd], yl = laneY(SLOTS * LANE) - 0.9;
        stemAt(M, q[0], q[1], yl, yc - 3.4, dots);
        const od = [q[0], yl, q[1]];
        M.prism(disc(2.1), od, [1, 0, 0], [0, 0, 1], UP, 0.5, C.paper); M.band(disc(3), disc(2.1), od, [1, 0, 0], [0, 0, 1], UP, 0.56, C.key);
      }
      const run = len - 9, nd = Math.round(run / (3.6 / detail));
      for (const [dy, v] of [[0.95, 3.2], [-0.95, -3.2]]) for (let q = 0; q < nd; q++)
        dots.push({ p: [o[0] - ex[0] * run / 2 - ez[0] * 0.33, yc + dy, o[2] - ex[2] * run / 2 - ez[2] * 0.33], d: ex, run, phase: q * run / nd, speed: v, n: [-ez[0], 0, -ez[2]], size: 1.9 });
    };
    const PIN1 = [0, 150], PIN2 = [B1[0] + S2 * 130, B1[1] + S2 * 130], PATCH2 = [B1[0] + S2 * 172, B1[1] + S2 * 172];
    gantry(MB[0], PIN1, [0, 1], dotsG[0], 0);
    gantry(MB[0], PIN2, [S2, S2], dotsG[0], 0);
    // the west interchange: a capsule stood on end from the sheet up to the line that is being ruled overhead, on a ringed foot, with a
    // file of passengers streaming each way: the one tall thing on the west side, and the line rules itself on to it
    { const M = MB[0], y0 = 1.2, y1 = YO2 + 4.4, len = y1 - y0, o = [TOWER[0], (y0 + y1) / 2, TOWER[1]], EX = [1, 0, 0], EZ = [0, 0, 1];
      M.prism(stadium(len - 2.8, 8.2, 10), o, UP, EX, EZ, 0.5, C.paper); M.band(stadium(len, 11, 10), stadium(len - 2.8, 8.2, 10), o, UP, EX, EZ, 0.56, C.key);
      const foot = [TOWER[0], 0.5, TOWER[1]];
      M.prism(disc(8.6, 24), foot, EX, EZ, UP, 0.3, C.paper); M.band(disc(11, 24), disc(8.6, 24), foot, EX, EZ, UP, 0.36, C.key);
      const run = len - 11, nd = Math.round(run / (3.3 / detail));
      for (const [dx, v] of [[1.5, 3.4], [-1.5, -3.4]]) for (let q = 0; q < nd; q++)
        dotsG[0].push({ p: [TOWER[0] + dx, y0 + 5.5, TOWER[1] - 0.34], d: UP, run, phase: q * run / nd, speed: v, n: [0, 0, -1], size: 2.5 });
      // the interchanges of the west trunk: black-ringed capsules lying across its three lines, the first reaching the foot of the tower
      for (const [cx, cz, cl] of [[(TOWER[0] - 187) / 2 + 2, TOWER[1], 187 + TOWER[0] + 8], [-236, -150, 50], [-262, 760, 50]]) {
        const c = [cx, TRUNKY + 0.9, cz];
        M.prism(stadium(cl - 3.6, 10.4, 10), c, EX, EZ, UP, 0.5, C.paper); M.band(stadium(cl, 14, 10), stadium(cl - 3.6, 10.4, 10), c, EX, EZ, UP, 0.56, C.key);
        const r2 = cl - 16, n2 = Math.round(r2 / (5 / detail));
        for (const [dz, v] of [[2.2, 3.4], [-2.2, -3.4]]) for (let q = 0; q < n2; q++)
          dotsG[0].push({ p: [cx - r2 / 2, TRUNKY + 1.2, cz + dz], d: EX, run: r2, phase: q * r2 / n2, speed: v, n: UP, size: 3.4 });
      }
    }
    await ctx.yield();
    // pins where two suburb lines cross in plan one to three levels apart
    const pins = [];
    { const grid = new Map(), cand = []; let nstep = 0;
      for (let n = 0; n < subs.length; n++) {
        const sb = subs[n]; if (sb.kind === 'river' || sb.ruled || sb.planned) continue;
        for (let s = 20; s < Math.min(sb.line.length - 20, 1300); s += 2.5) {
          const f = lineAt(sb.line, s), p = f.p; if (farOf(p) > 950 || farOf(p) < 290) continue;
          // where a line of the sheet passes under our own line the viaduct is pinned to the map: a ringed interchange on the line below, a keylined stem up to the deck
          if (n === 0) continue;
          if (p[1] > 80) continue;
          if (sb.kind !== 'bundle' && planDist(p[0], p[2]) < 1.6) cand.push({ x: p[0], z: p[2], y0: p[1], y1: Y0 - 4.6, w: f.w || 3, via: true });
          const key = Math.floor(p[0] / 5) * 4096 + Math.floor(p[2] / 5);
          const cell = grid.get(key);
          if (cell) { for (const q of cell) if (q[0] !== n && Math.hypot(q[1] - p[0], q[3] - p[2]) < 2.6) { const dy = Math.abs(q[2] - p[1]); if (dy > 7 && dy < 70) cand.push({ x: p[0], z: p[2], y0: Math.min(q[2], p[1]), y1: Math.max(q[2], p[1]), w: Math.max(q[4], f.w || 3), ours: false }); } cell.push([n, p[0], p[1], p[2], f.w || 3]); }
          else grid.set(key, [[n, p[0], p[1], p[2], f.w || 3]]);
          if (++nstep % 160 === 0) await ctx.yield();
        }
        await ctx.yield();
      }
      rng.shuffle(cand);
      const maxPins = Math.round(34 * density);
      let nq = 0;
      for (const c of cand) {
        if (pins.length >= maxPins) break;
        if (++nq % 16 === 0) await ctx.yield();
        const pd = planDist(c.x, c.z);
        if (!c.via && (pd < 30 || Math.hypot(c.x - TOWER[0], c.z - TOWER[1]) < 40)) continue;
        if (pins.some((p) => Math.hypot(p.x - c.x, p.z - c.z) < (c.via ? 30 : 70)) || Math.hypot(c.x, c.z - 150) < 16 || Math.hypot(c.x - PIN2[0], c.z - PIN2[1]) < 16) continue;
        pins.push(c);
        // a ringed interchange on each of the two lines (as wide as the line and a ring more, lying over it), a keylined stem between
        const r = c.w / 2 + 1.6;
        for (const y of c.via ? [c.y0] : [c.y0, c.y1]) { const o = [c.x, y + 0.75, c.z];
          MB[0].prism(disc(r, 22), o, [1, 0, 0], [0, 0, 1], UP, 0.5, C.paper); MB[0].band(disc(r + 1.9, 22), disc(r, 22), o, [1, 0, 0], [0, 0, 1], UP, 0.56, C.key); }
        stemAt(MB[0], c.x, c.z, c.y0 + 0.75, c.y1 + 0.5, null, 2);
      }
    }
    await ctx.yield();

    // ---------------- the floor of the well is map too ----------------
    // Between the files of the concourse: a pale blue moat with its ferries and white bridges, two basins, greens with clipped
    // corners, and a black-ringed interchange wherever a ring of files crosses one of the eight axes. All flat tints and symbols.
    { const M = MB[0], FY = HA.floorY, c8 = Math.cos(Math.PI / 8);
      const oP = (j, r, y) => { const a = (j + 0.5) * Math.PI / 4, rr = r / c8; return [WELL[0] + Math.cos(a) * rr, y, WELL[1] + Math.sin(a) * rr]; };
      for (let j = 0; j < 8; j++) M.quad(oP(j, 97, FY + 0.1), oP(j + 1, 97, FY + 0.1), oP(j + 1, 108, FY + 0.1), oP(j, 108, FY + 0.1), C.river);
      const frame = (j, rc, y) => { const a = j * Math.PI / 4, n = [Math.cos(a), 0, Math.sin(a)]; return { n, t: [-n[2], 0, n[0]], o: [WELL[0] + n[0] * rc, y, WELL[1] + n[2] * rc] }; };
      const block = (j, r0, r1, hw, col, y = 0.1) => { const f = frame(j, (r0 + r1) / 2, FY + y), hr = (r1 - r0) / 2, cut = Math.min(hr, hw) * 0.6;
        M.prism([[-hw + cut, -hr], [hw - cut, -hr], [hw, -hr + cut], [hw, hr - cut], [hw - cut, hr], [-hw + cut, hr], [-hw, hr - cut], [-hw, -hr + cut]], f.o, f.t, f.n, UP, 0.02, col); };
      const cap = (j, rc, len) => { const f = frame(j, rc, FY + 0.2);
        M.prism(stadium(len - 2.4, 7.6, 8), f.o, f.n, f.t, UP, 0.04, C.paper); M.band(stadium(len, 10, 8), stadium(len - 2.4, 7.6, 8), f.o, f.n, f.t, UP, 0.06, C.key); };
      for (let j = 0; j < 8; j++) {
        if (j & 1) { block(j, 33, 54, 13, C.park); block(j, 137, 147.5, 27, C.park); }
        else block(j, 119.5, 131, j % 4 === 0 ? 34 : 30, j % 4 === 0 ? C.river : C.park);
        { const f = frame(j, 102.5, FY + 0.16); M.prism([[-3.6, -6.6], [3.6, -6.6], [3.6, 6.6], [-3.6, 6.6]], f.o, f.t, f.n, UP, 0.03, C.paper); }      // a white bridge carries the axis over the moat
        cap(j, 66.6, 26); cap(j, 154.6, 22);
      }
      // on the walls: a black-ringed interchange on two bands of every face, passengers filing through it both ways
      for (let j = 0; j < 8; j++) for (const [off, y] of j === 2 ? [[-44, -96]] : [[-44, j & 1 ? -96 : -48], [44, j & 1 ? -24 : -72]]) {
        const f = frame(j, 199.5, y), o = [f.o[0] + f.t[0] * off, y, f.o[2] + f.t[2] * off], ni = [-f.n[0], 0, -f.n[2]], len = 46, run = len - 10;
        M.prism(stadium(len - 2.6, 7.4, 8), o, f.t, UP, ni, 0.3, C.paper); M.band(stadium(len, 10, 8), stadium(len - 2.6, 7.4, 8), o, f.t, UP, ni, 0.36, C.key);
        const nd = Math.round(run / (3.4 / detail));
        for (const [dy, v] of [[1.3, 3.2], [-1.3, -3.2]]) for (let q = 0; q < nd; q++)
          dotsG[0].push({ p: [o[0] - f.t[0] * run / 2 + ni[0] * 0.3, y + dy, o[2] - f.t[2] * run / 2 + ni[2] * 0.3], d: f.t, run, phase: q * run / nd, speed: v, n: ni, size: 2.7 });
      }
      M.prism([0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = (k + 0.5) * Math.PI / 4; return [Math.cos(a) * 18 / c8, Math.sin(a) * 18 / c8]; }), [WELL[0], FY + 0.1, WELL[1]], [1, 0, 0], [0, 0, 1], UP, 0.02, C.park);
    }
    await ctx.yield();

    // ---------------- the sheet and the dome ----------------
    const parks = [];
    { const t = [river[1][0] - river[0][0], river[1][1] - river[0][1]], l = Math.hypot(t[0], t[1]), mid = [lerp(river[0][0], river[1][0], 0.86), lerp(river[0][1], river[1][1], 0.86)];
      parks.push(new THREE.Vector4(mid[0] - t[1] / l * (RIVW / 2 + 46), mid[1] + t[0] / l * (RIVW / 2 + 46), 150, -38));      // the long park beside the river
      const nP = Math.round(clamp(13 * density, 8, 13));
      for (let k = 0; k < NPARK - 1; k++) {
        const x = rng.range(-620, 900), z = rng.range(-80, 1250), hx = rng.range(26, 105), hz = rng.range(22, 70), rot = rng.chance(0.4);
        if (k >= nP || oct8(x - WELL[0], z - WELL[1]) < 250 + hx) parks.push(new THREE.Vector4(1e6, 1e6, 1, 1));
        else parks.push(new THREE.Vector4(x, z, hx, rot ? -hz : hz));
      }
    }
    const patches = [new THREE.Vector4(1.5, 91, 25, 0.035), new THREE.Vector4(PATCH2[0] + 30, PATCH2[1] - 30, 0, -0.05)];
    for (let k = 0; k < 4; k++) { const p = pins[k]; patches.push(p ? new THREE.Vector4(p.x + rng.range(-4, 4), p.z + rng.range(-4, 4), rng.range(16, 24), rng.range(-0.07, 0.07)) : new THREE.Vector4(1e6, 1e6, 0, 0)); }
    const c12 = Math.cos(12 * Math.PI / 180), s12 = Math.sin(12 * Math.PI / 180), c4 = Math.cos(0.07), s4 = Math.sin(0.07);
    const creases = [new THREE.Vector3(c12, -s12, c12 * 34), new THREE.Vector3(s4, c4, c4 * 388)];
    const groundU = {
      uPaper: { value: C.paper }, uZ0: { value: C.zone[0] }, uZ1: { value: C.zone[1] }, uZ2: { value: C.zone[2] }, uRiver: { value: C.river }, uPark: { value: C.park },
      uPatchCol: { value: C.patch }, uCreaseCol: { value: C.crease }, uWell: { value: new THREE.Vector2(WELL[0], WELL[1]) }, uZoneR: { value: new THREE.Vector3(330, 520, 900) },
      uRivW: { value: RIVW }, uRiv: { value: [0, 1, 2, 2].map((k, i) => (i < 3 ? new THREE.Vector4(river[k][0], river[k][1], river[k + 1][0], river[k + 1][1]) : new THREE.Vector4(1e6, 1e6, 1e6 + 1, 1e6))) },
      uParks: { value: parks }, uPatch: { value: patches }, uCrease: { value: creases },
    };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.ShaderMaterial({ vertexShader: GROUND_VS, fragmentShader: GROUND_FS, uniforms: groundU }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(WELL[0], 0, WELL[1]); ground.frustumCulled = false; scene.add(ground);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2000, 24, 12), new THREE.ShaderMaterial({ vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: false,
      uniforms: { uPaper: { value: C.paper }, uCreaseCol: { value: C.crease }, uCrease: { value: creases } } }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();

    // ---------------- meshes: per style group one mesh of marks, one of dashes, one of dots ----------------
    const tracks = [], trainGeo = trainGeometry(16, 4.3, 0.8, 3, 3);
    for (let g = 0; g < nGroups; g++) {
      const st = subStyles[g], lines = subs.filter((s) => s.group === g).map((s) => s.line);
      await ctx.yield();
      const marks = new THREE.Mesh(await MB[g].geometryYield(ctx), st.flatMaterial()); marks.frustumCulled = false; scene.add(marks);
      await ctx.yield();
      const track = await makeTrackYield(lines, infoG[g], ctx); tracks.push(track);
      await ctx.yield();
      const tg = g === 0 ? trainGeo : trainGeo.clone();
      const tm = new THREE.Mesh(setTrains(tg, trainsG[g]), st.trainMaterial(track)); tm.frustumCulled = false; scene.add(tm);
      await ctx.yield();
      const dm = new THREE.Mesh(dotGeometry(dotsG[g].length ? dotsG[g] : [{ p: [0, -500, 0], d: UP, run: 1, n: UP }]), st.dotMaterial()); dm.frustumCulled = false; scene.add(dm);
      await ctx.yield();
    }

    // ---------------- our own dash: a marigold lozenge with a white keyline and two passenger dots on its deck ----------------
    const dash = new THREE.Group(); scene.add(dash);
    { const M = new MarkBuffer(), ex = [0, 0, 1], ey = [1, 0, 0];
      M.prism(stadium(16, 4, 10), [0, 0, 0], ex, ey, UP, 0.5, C.inks[0]);
      M.band(stadium(16.7, 4.7, 10), stadium(16, 4, 10), [0, 0.2, 0], ex, ey, UP, 0.06, C.paper);       // the keyline: a flat white rim, never a wall
      const m = new THREE.Mesh(M.geometry(), style.flatMaterial()); m.frustumCulled = false; dash.add(m); }
    // the file ahead of us on our own line: three more dashes that close up and release in step, a ripple running back to us
    const file = [0, 1, 2].map(() => { const g = new THREE.Group(), m = new THREE.Mesh(dash.children[0].geometry, dash.children[0].material); m.frustumCulled = false; g.add(m); scene.add(g); return g; });
    const riders = new THREE.Group(); dash.add(riders);
    { const M = new MarkBuffer();
      for (const [x, z] of [[-0.6, 5.6], [0.55, 4.5]]) M.prism(disc(0.5, 14), [x, 0.27, z], [1, 0, 0], [0, 0, 1], UP, 0.06, C.key);
      const m = new THREE.Mesh(M.geometry(), style.flatMaterial()); m.frustumCulled = false; riders.add(m); }

    // ---------------- the rare correction's pasted slip on the well's north face (drawn out from its east edge) ----------------
    const corr = hero.correction;
    let slip = null;
    if (corr) {
      const M = new MarkBuffer(), yL = -120 + 24 * (corr.level - 1);
      M.quad([-64, yL - 26, 0], [0, yL - 26, 0], [0, yL + 22, 0], [-64, yL + 22, 0], C.patch);
      // what the slip corrects is printed on it: the junction as it was first ruled, in the palest key grey, and its interchange
      for (const dy of [-13, 9]) M.quad([-64, yL + dy - 1.5, -0.12], [0, yL + dy - 1.5, -0.12], [0, yL + dy + 1.5, -0.12], [-64, yL + dy + 1.5, -0.12], C.zone[2]);
      M.prism(stadium(30, 5.2, 8), [-32, yL - 2, -0.2], [0, 1, 0], [1, 0, 0], [0, 0, 1], 0.1, C.paper); M.band(stadium(32.4, 7.6, 8), stadium(30, 5.2, 8), [-32, yL - 2, -0.2], [0, 1, 0], [1, 0, 0], [0, 0, 1], 0.14, C.key);
      slip = new THREE.Mesh(M.geometry(), style.flatMaterial()); slip.frustumCulled = false;
      slip.position.set(WELL[0] + 70, 0, WELL[1] + 199.2); slip.scale.x = 0.0001; scene.add(slip);
    }
    await ctx.yield();

    // ---------------- the flight ----------------
    const L = path.length, _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t0 = new THREE.Vector3(), _t1 = new THREE.Vector3();
    const wellPoi = new THREE.Vector3(WELL[0], HA.wellCenter[1], WELL[1]), wellY = HA.wellCenter[1];
    const wellAt = (time, u) => { wellPoi.y = wellY + 56 * ease(((u || 0) - 0.52) / 0.12); return wellPoi; };   // on the ramp the gaze lifts across the hollow: every level is in frame
    const capPoi = new THREE.Vector3(HA.capsule.position[0] + WELL[0], -40, HA.capsule.position[2] + WELL[1]);
    const ruledSubs = subs.filter((s) => s.ruled), heroRuled = HA.ruledLine ?? -1;
    // the ruling point: one round key-black dot riding the tip of every line that is being ruled, round from above, below and end-on
    const tipGeo = new THREE.IcosahedronGeometry(1, 2), tipMat = style.flatMaterial();
    { const n = tipGeo.attributes.position.count, col = new Float32Array(n * 3), gr = new Float32Array(n * 4), ru = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { col[k * 3] = C.key.r; col[k * 3 + 1] = C.key.g; col[k * 3 + 2] = C.key.b; ru[k * 3] = -1; ru[k * 3 + 2] = 1; }
      tipGeo.setAttribute('color', new THREE.BufferAttribute(col, 3)); tipGeo.setAttribute('aGrow', new THREE.BufferAttribute(gr, 4)); tipGeo.setAttribute('aRule', new THREE.BufferAttribute(ru, 3)); }
    const mkTip = () => { const m = new THREE.Mesh(tipGeo, tipMat); m.frustumCulled = false; m.scale.setScalar(0.001); scene.add(m); return m; };
    for (const s of ruledSubs) s.tip = mkTip();
    const heroTips = [mkTip(), mkTip()];
    const setTip = (m, line, drawn, ox, oz, camera) => {
      if (!(drawn < line.length) || drawn < 2) { m.scale.setScalar(0.001); return; }
      const f = lineAt(line, drawn - 1), q = f.p, e = camera.matrixWorld.elements;
      m.position.set(q[0] + ox, q[1], q[2] + oz);
      const dist = Math.hypot(m.position.x - e[12], m.position.y - e[13], m.position.z - e[14]);
      // a round dot about as wide as its line (never under a few pixels, so it still reads far off)
      m.scale.setScalar(Math.max(0.6 * (f.w || 3), 2.4 * dist * 1.2 / Math.max(style.uniforms.uRes.value.y, 100)));
    };
    {
      const list = [];
      // the concourse on the floor of the well: passengers filing round octagons and along the four ruled axes, in counter-flowing pairs
      const fy = HA.floorY + 0.3, gap = 4 / (detail * (service === 'last' ? 0.7 : service === 'midday' ? 0.85 : 1) * Math.min(1.15, density));
      for (const [a, v] of [[24, 3.4], [28.6, -3.4], [62, 4.2], [66.6, -4.2], [71.2, 4.2], [88, 4.4], [92.6, -4.4], [112, -4.6], [116.6, 4.6], [134, -4.8], [150, 5], [154.6, -5], [159.2, 5], [172, 5.2], [186, -5.2], [190.6, 5.2]]) {
        for (let j = 0; j < 8; j++) {
          const an = j * Math.PI / 4, nx = Math.cos(an), nz = Math.sin(an), hx = -nz, hz = nx, half = a * Math.tan(Math.PI / 8), sg = v > 0 ? 1 : -1;
          const p0 = [nx * a - hx * half * sg, fy, nz * a - hz * half * sg], run = 2 * half;
          for (let q = 0; q < run - 0.1; q += gap) list.push({ p: p0, d: [hx * sg, 0, hz * sg], run, phase: q + j * 0.7, speed: Math.abs(v), n: UP, size: 2.6 });
        }
      }
      for (let j = 0; j < 8; j++) {
        const an = j * Math.PI / 4, dx = Math.cos(an), dz = Math.sin(an), run = 150;
        for (const [off, sg] of [[-2.3, 1], [2.3, -1]]) {
          const p0 = [dx * (sg > 0 ? 30 : 180) - dz * off, fy, dz * (sg > 0 ? 30 : 180) + dx * off];
          for (let q = 0; q < run - 0.1; q += gap * 1.2) list.push({ p: p0, d: [dx * sg, 0, dz * sg], run, phase: q + j * 1.3, speed: 4.4, n: UP, size: 2.6 });
        }
      }
      await ctx.yield();
      const m = new THREE.Mesh(dotGeometry(list), style.dotMaterial()); m.frustumCulled = false; hero.object.add(m);
    }
    await ctx.yield();
    let riderShift = 0, noseLead = 0;
    const DL = deck.length, KD = DL / L;
    const placeDash = (g, dd) => {                             // a dash on our own line, its centre at path distance dd
      deck.posAtDist((dd - 7.8) * KD, _a); deck.posAtDist((dd + 8.2) * KD, _b);
      g.position.copy(_a).add(_b).multiplyScalar(0.5); g.position.y += 0.58;
      _c.copy(_b); _c.y += 0.58; g.lookAt(_c);
    };
    const overAt = (d) => { path.posAtDist(d, _a); deck.posAtDist(d * KD, _b); return _a.y - _b.y; };      // the eye's height over our line
    function update(dt, time, camera, u) {
      u = clamp(u || 0, 0, 1);
      hero.setProgress(u);
      if (service !== 'rush') hero.setRush(service === 'midday' ? 0.52 : 0.42);       // midday: three quarters of the rush dashes; last trains: a quarter
      hero.update(dt, time, camera);
      for (const s of subStyles) s.update(time, ctx.renderer);
      if (!corr && heroRuled >= 0) {
        const c = (time / 30 + u * 1.4 + 0.2) % 1, f = c < 0.74 ? c / 0.74 : c < 0.9 ? 1 : 1 - ease((c - 0.9) / 0.1), Lr = hero.lines[heroRuled].length;
        hero.style.setDrawn(heroRuled, f >= 1 ? 1e6 : 84 + (Lr - 80) * f);
        setTip(heroTips[0], hero.lines[heroRuled], f >= 1 ? 1e6 : 84 + (Lr - 80) * f, WELL[0], WELL[1], camera);
      }
      // the sheet's dome follows whichever camera draws us
      dome.position.setFromMatrixPosition(camera.matrixWorld);
      // the rush: a front closing on the well just ahead of us
      path.posAtDist(Math.min(L, u * L + 110), _a);
      const front = service === 'rush' ? Math.max(0, Math.hypot(_a.x - WELL[0], _a.z - WELL[1]) - 215) * (1 - ease((u - 0.36) / 0.12)) : 1e5;
      for (const s of subStyles) s.uniforms.uFront.value.z = front;
      // lines ruling themselves on across the white, tick by tick, then lifted and ruled again
      for (const s of ruledSubs) {
        if (s.cross) { const c = (time / 12 + 0.2) % 1, f = c < 0.66 ? c / 0.66 : c < 0.84 ? 1 : 1 - ease((c - 0.84) / 0.16);
          subStyles[s.group].setDrawn(s.slot, 860 + 560 * f); setTip(s.tip, s.line, 860 + 560 * f, 0, 0, camera); continue; }
        if (s.lead) { const c = (time / 8) % 1, f = c < 0.8 ? c / 0.8 : 1 - ease((c - 0.8) / 0.2);
          const dr = Math.min(s.line.length + 4, Math.max(40, u * L + 430 + 110 * f)); subStyles[s.group].setDrawn(s.slot, dr); setTip(s.tip, s.line, dr, 0, 0, camera); continue; }
        const c = (time / 34 + u * 1.2 + s.rulePhase) % 1, f = c < 0.74 ? c / 0.74 : c < 0.9 ? 1 : 1 - ease((c - 0.9) / 0.1);
        const dr = 330 + (Math.min(s.line.length, 1040) - 330) * f;
        subStyles[s.group].setDrawn(s.slot, dr); setTip(s.tip, s.line, dr, 0, 0, camera);
      }
      // a correction patch slides in under the bundle where the stripes part
      { const k = ease((u - 0.1) / 0.1), p = patches[1]; p.set(PATCH2[0] + 2 + (1 - k) * 60, PATCH2[1] - 2 - (1 - k) * 60, 30 * Math.min(1, k * 6), -0.05); }
      // the rare correction: the plum line un-rules back to its ramp and is ruled again a level higher, corner by corner
      if (corr) {
        const a = ease((u - 0.5) / 0.09), b = clamp((u - 0.6) / 0.27, 0, 1), fb = (Math.floor(b * 5) + ease((b * 5) % 1)) / 5;
        const d1 = a <= 0 ? 1e6 : lerp(corr.length + 4, corr.keep, a), d2 = b <= 0 ? 0 : b >= 1 ? 1e6 : lerp(corr.keep, corr.altLength + 4, fb);
        hero.style.setDrawn(corr.line, d1); hero.style.setDrawn(corr.index, d2);
        setTip(heroTips[0], hero.lines[corr.line], d1, WELL[0], WELL[1], camera); setTip(heroTips[1], corr.alt, d2, WELL[0], WELL[1], camera);
        slip.scale.x = Math.max(0.0001, ease((u - 0.5) / 0.08));
      }
      // our dash: nose 7 m ahead of the eye, on the ribbon, yawed and pitched by the path, never rolled
      const d = u * L, ov = overAt(d), lead0 = 2.6 + 2.35 * ov;       // our dash runs ahead of the eye, whole in frame: the higher the eye, the further ahead
      let dd = Math.min(d + lead0, L - 13.5);
      // The nose stays in frame whichever camera draws us: where the gaze is held up off the ramp (the steady camera), our dash
      // runs a little further ahead of the eye, until its nose is within 25 degrees of the line of sight.
      { const e = camera.matrixWorld.elements; let lead = 0;
        if (u > 0.01) for (let i = 0; i < 8; i++) {
          deck.posAtDist(Math.min(dd + 8.2 + lead, L) * KD, _a); _a.y += 0.58; _a.x -= e[12]; _a.y -= e[13]; _a.z -= e[14];
          const l = _a.length() || 1, cs = -(_a.x * e[8] + _a.y * e[9] + _a.z * e[10]) / l, dn = -(_a.x * e[4] + _a.y * e[5] + _a.z * e[6]) / l;   // along the gaze, and below it
          if (cs > 0.92 || dn < 0.2) break;
          lead += 5;
        }
        noseLead += (lead - noseLead) * Math.min(1, dt * 3 + (dt <= 0 ? 1 : 0));
        dd = Math.min(dd + noseLead, L - 13.5); }
      placeDash(dash, dd);
      dash.scale.setScalar(1 + 0.3 * ease((Y0 - 30 - dash.position.y) / 60));        // in the well the lines are drawn larger, and our dash with them
      for (let k = 0; k < 3; k++) {
        const dk = dd + lerp(46, 30, ease((u - 0.1) / 0.2)) + 27 * k + 8 * Math.sin(time * 1.15 - k * 1.5) + 4 * Math.sin(time * 0.47 + k * 2.1);
        placeDash(file[k], Math.min(dk, L - 13.5)); file[k].scale.setScalar(Math.max(0.001, ease((L - 16 - dk) / 22)) * dash.scale.x);
      }
      path.tangentAtDist(Math.min(dd - 7.8, L), _t0); path.tangentAtDist(Math.min(dd + 8.2, L), _t1);
      const turn = clamp((_t0.z * _t1.x - _t0.x * _t1.z) * 3, -1, 1);
      riderShift += (turn - riderShift) * Math.min(1, dt * 2.5);
      riders.position.x = -riderShift * 0.55; riders.position.z = Math.sin(time * 0.7) * 0.12;
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.start) }, 0);

    const SS = (a, b, x) => ease((x - a) / (b - a));
    return {
      scene, path, duration: 42,
      pace: (u) => 1.25 - 0.15 * SS(0.42, 0.5, u) - 0.5 * SS(0.64, 0.72, u) + 0.4 * SS(0.84, 0.91, u),
      title: rare ? 'The City That Is Only Its Map: The Correction' : edition === 'early' ? 'The City That Is Only Its Map: Early Edition' : edition === 'planned' ? 'The City That Is Only Its Map: Planned Edition' : 'The City That Is Only Its Map',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 24, sway: 0, bank: 0 },
      pois: [
        { at: new THREE.Vector3(WELL[0], -110, WELL[1]), from: 0.05, to: 0.36, weight: 0.55 },   // from the viaduct the gaze leans toward the well: its top rings and the giant capsule are the destination from the first quarter
        { at: wellAt, from: 0.3, to: 0.72, weight: 0.6 },
        { at: capPoi, from: 0.66, to: 0.83, weight: 0.65 },
        { at: new THREE.Vector3(term[0], term[1], term[2]), from: 0.79, to: 0.95, weight: 0.6 },
      ],
      // the terminus holds the portal: a plain ring, and while the next world is not there yet one flat disc of our own ink (no swirl, no gradient)
      portal: { shape: 'circle', radius: 7, color: paperHex, veil: cw.inks[0], style: 'ring', glow: 0, halo: false, revealDistance: 300, blendDistance: 25 },
      post: { flat: 1, exposure: EXPOSURE, bloom: { strength: 0, radius: 0.1, threshold: 2 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      update,
      dispose() { hero.dispose(); for (const s of subStyles) s.dispose(); for (const t of tracks) t.texture.dispose(); },
    };
  },
};
