// The Line Goes Through the Hill, after Martin Ramirez (1895 to 1963).
// A railway country drawn in pencil and wax crayon on pasted scrap paper. Everything is unlit ShaderMaterial from the
// hero's style routines (src/parts/line-through-the-hill.js); post.flat = 1, so a hex written is the hex shown.
// Course +Z. z 150-260 gate mound, 260-620 niche valley (the eye swings out beside tier one's train before the mountain),
// 620-1180 the viaduct mountain (the hero, flown through: tier one tunnel to 714, the hall to 1020 flown up its nave with the
// gaze held level, a train crossing the nave's bridge, the rider's niche in the far wall, tier two tunnel to 1100, then the
// balcony: a stage box of crayon arches open on the back country), 1180-1400 the falling viaduct over ranks of small hills,
// 1400-1500 level to the bridge at the last mound's foot: three arches side by side, the exit between the rider and the
// stag, a train crossing above; the exit's ribs end in the portal at z 1560. Tunnel floors are drawn, never black.
// No sky: a fixed shell 5 km out of bare pieced paper (fourteen sheets in the two tans, straight seams), and drawn on
// that paper the last rank: very tall mounds in close graphite hatching, two rows deep, arched outlines against the bare
// sheets. Pressed black is kept for mouths, tunnel grounds and the hall's own ground; scene.background is the tan.
// Variations (seeded once): stock (mixed scraps / the long roll / old stock; ctx.vary.hour picks the stock's age),
// wax (mauve+orange / orange+ochre with mauve for the express / a pencil day), cast (stags / hinds).
// Rare (ctx.vary.rare): at u 0.2 every mouth of the mountain sends out an engine and every arc field shivers together.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  buildHero, LH_PALETTE, STYLE_GLSL, LH_VERT, paperMaterial, waxMaterial, trackMaterial, trainMaterial,
  smokeMaterial, blackMaterial, arcadeMaterial, Geo, dOutline, addRib,
} from '../parts/line-through-the-hill.js';

const TAN14 = Math.tan(14 * Math.PI / 180);
// ZM: the face of the last mound; ZP: the portal, at the end of the exit arch's ribs
const ZM = 1504, ZP = 1560, HW0 = 714;   // HW0: the hall's entry wall (the hero's HZ0 + 900)
// a mouth: { p: [x, y, z] sill centre, n: [nx, nz] facing, r half width, leg }. Point at lateral a, height y, depth t inward.
const mpt = (m, a, y, t) => [m.p[0] + m.n[1] * a - m.n[0] * t, m.p[1] + y, m.p[2] - m.n[0] * a - m.n[1] * t];
// black D pocket or tunnel behind a mouth, depth t0..t1, optional cap, floor falling `drop` metres over its length
function pocket(G, m, t0, t1, cap, drop = 0) {
  const o = dOutline(m.r, m.leg, 14, 1);
  for (let i = 0; i < o.length - 1; i++) { const a = o[i], b = o[i + 1];
    G.quad(mpt(m, a[0], a[1], t0), mpt(m, b[0], b[1], t0), mpt(m, b[0], b[1] - drop, t1), mpt(m, a[0], a[1] - drop, t1)); }
  G.quad(mpt(m, -m.r, 0, t0), mpt(m, m.r, 0, t0), mpt(m, m.r, -drop, t1), mpt(m, -m.r, -drop, t1));
  if (cap) for (let i = 0; i < o.length - 1; i++) G.tri(mpt(m, 0, m.leg - drop, t1), mpt(m, o[i][0], o[i][1] - drop, t1), mpt(m, o[i + 1][0], o[i + 1][1] - drop, t1));
}
// instance matrix of a rib standing in a mouth's plane at depth t, scaled k across and kz along
function ribMatrix(m, t, k, kz, out) {
  const X = new THREE.Vector3(m.n[1] * k, 0, -m.n[0] * k), Y = new THREE.Vector3(0, k, 0), Z = new THREE.Vector3(m.n[0] * kz, 0, m.n[1] * kz);
  const p = mpt(m, 0, -0.05, t); return out.makeBasis(X, Y, Z).setPosition(p[0], p[1], p[2]);
}
// A mound: a thumbprint shell. Local frame: front face at z = -D/2 looking down -z, back at +D/2; placed by (x, z, rot).
// S = { pos, n, wax, idx }. With o.seed = { mx, r, leg } every vertex carries its distance from that arch (far mounds).
function addMound(S, o) {
  const hD = o.D / 2, W = o.W, H = o.H, f = o.face, bk = o.back ?? f * 0.6, bowA = o.bow ?? W * 0.14, sh = o.sh ?? 2.3;
  const prof = [];
  const seg = (z0, y0, z1, y1, n) => { for (let i = 0; i < n; i++) prof.push([lerp(z0, z1, i / n), lerp(y0, y1, i / n)]); };
  seg(-hD, -3.5, -hD, f, Math.max(2, Math.round((f + 3.5) / (o.fstep ?? 3))));
  const dome = new THREE.SplineCurve([[-hD, f], [-hD * 0.86, f + (H - f) * 0.5], [-hD * 0.5, H * 0.93], [-hD * 0.05, H], [hD * 0.4, H * 0.94], [hD * 0.8, bk + (H - bk) * 0.55], [hD, bk]].map((q) => new THREE.Vector2(q[0], q[1])));
  const nd = o.nd ?? 16; for (let i = 0; i < nd; i++) { const q = dome.getPoint(i / nd); prof.push([q.x, q.y]); }
  seg(hD, bk, hD, -3.5, 3); prof.push([hD, -3.5]);
  const NC = o.nc ?? 28, NR = prof.length, base = S.pos.length / 3, cs = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0);
  const sd = o.seed, zf = sd ? -hD + bowA * (sd.mx / W) * (sd.mx / W) : 0;
  const y0 = sd ? sd.y0 || 0 : 0;                                            // a seed arch may stand part way up the face
  const sc = sd ? [o.x + cs * sd.mx + sn * zf, y0, o.z - sn * sd.mx + cs * zf] : null;   // the seed arch's sill centre in the world
  for (let c = 0; c <= NC; c++) {
    const a = -1 + (2 * c) / NC, x = W * Math.sign(a) * Math.pow(Math.abs(a), 0.9);
    const e = H * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / W, sh)), 0.6);
    for (let r = 0; r < NR; r++) {
      const pz = prof[r][0], y = prof[r][1] <= 0 ? prof[r][1] : Math.min(prof[r][1], e), z = pz - bowA * (x / W) * (x / W) * (pz / hD);
      S.pos.push(o.x + cs * x + sn * z, y, o.z - sn * x + cs * z); S.wax.push((o.tint ?? 0) + 2 * (o.ink ?? 0) + 16 * (o.bands ?? 0));   // seeded mounds: sheet tan, rub step 0..4, crayon bands
      if (sd) { const dx = x - sd.mx, w = -(z - zf), v = y - y0 - sd.leg; let s;
        if (v > 0) s = Math.hypot(dx, v) - sd.r; else { const bx = Math.abs(dx) - sd.r, by = y0 - y; s = bx > 0 && by > 0 ? Math.hypot(bx, by) : Math.max(bx, by); }
        S.n.push(Math.hypot(Math.max(s, 0), w)); S.sc.push(sc[0], sc[1], sc[2]); S.sa.push(-sn, -cs, sd.r, sd.leg); } else S.n.push(0);
      if (c < NC && r < NR - 1) { const i0 = base + c * NR + r, i1 = i0 + NR; S.idx.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1); }
    }
  }
}
// the world mouth of a mound: lateral mx on its front (or back) face
function moundMouth(o, mx, r, leg, back) {
  const hD = o.D / 2, bowA = o.bow ?? o.W * 0.14, z = (back ? 1 : -1) * (hD - bowA * (mx / o.W) * (mx / o.W));
  const cs = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0), s = back ? -1 : 1;
  return { p: [o.x + cs * mx + sn * z, 0, o.z - sn * mx + cs * z], n: [-sn * s, -cs * s], r, leg };
}
function shellGeo(S) {
  const g = new THREE.BufferGeometry(), nv = S.pos.length / 3;
  g.setAttribute('position', new THREE.Float32BufferAttribute(S.pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nv * 2), 2));
  g.setAttribute('aN', new THREE.Float32BufferAttribute(S.n, 1));
  g.setAttribute('aWax', new THREE.Float32BufferAttribute(S.wax, 1));
  if (S.sc.length) { g.setAttribute('aSC', new THREE.Float32BufferAttribute(S.sc, 3)); g.setAttribute('aSA', new THREE.Float32BufferAttribute(S.sa, 4)); }
  g.setIndex(S.idx); return g;
}
const newShell = () => ({ pos: [], n: [], wax: [], idx: [], sc: [], sa: [] });
const FAR = [0, -500, -5000];                       // a dummy mouth far under the paper, to pad a list to twelve
const pad12 = (ms) => { const a = ms.slice(0, 12); while (a.length < 12) a.push({ p: FAR, n: [0, -1], r: 8, leg: 2 }); return a; };

export default {
  id: 'line-through-the-hill',
  name: 'The Line Goes Through the Hill',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'Martín Ramírez, 1895 to 1963',
  weirdness: 0.6,
  media: ['rail', 'interior', 'air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- variations, drawn once and first
    const vr = rng.fork('edition');
    const stock = vr.pick(['mixed', 'mixed', 'roll', 'old']);
    // the wax day is paired with the stock (one draw each), so two visits that share a stock or a wax seldom share both
    const waxDay = ['pencil', 'mauve', 'mauve', 'ochre'][(vr.pick([0, 1, 2, 3]) + (stock === 'old' ? 1 : stock === 'roll' ? 2 : 0)) % 4];
    const hinds = vr.chance(0.22);
    const rare = !!vary.rare;
    const age = stock === 'old' ? 0.8 : vary.hour === 'night' ? 0.45 : vary.hour === 'golden' ? 0.3 : vary.hour === 'dawn' ? 0.0 : 0.12;
    const SCH = waxDay === 'ochre' ? 1 : waxDay === 'pencil' ? 2 : 0, SCH_EXPRESS = waxDay === 'pencil' ? 2 : 0;
    scene.background = new THREE.Color(LH_PALETTE[0]);

    // ---- the hero, seated: course coordinates are world x, y, z - 900
    const hero = await buildHero(ctx, { detail, rare, wax: waxDay === 'mauve' ? undefined : waxDay });
    const LU = hero.uniforms; LU.uOld.value = age;               // this build's own uniform set (time, age, pigments)
    hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, 900); scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    const W3 = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const hm = hero.mouths.map((m) => ({ p: [m.p[0], m.p[1], m.p[2] + 900], n: m.n, r: m.r, leg: m.leg, ink: m.ink, bands: m.bands, bw: m.bw, par: m.par }));   // world mouths
    const backM = hm[9], EXY = backM.p[1], EXZ = backM.p[2];                    // the back mouth, 54 m up
    await ctx.yield();

    // ---- the path
    const fly = hero.anchors.flyThrough.map(W3);
    const deckY = (z) => Math.max(0, EXY - (z - EXZ) * TAN14);                  // the falling viaduct's deck
    const ZFOOT = EXZ + EXY / TAN14;
    // The start stands 66 m before the gate mouth so the first frame is the mound to the top edge and its black D.
    // This world was first timed on a longer route (it began at z 0 and threaded an arch of the hall): every scripted cue
    // is still written in that route's u, and UO(u) gives the old u at which the eye stood at the same z, so every
    // meeting keeps its place in space. OLDZ is that route's z at u = i / 50.
    const OLDZ = [0, 32, 63.9, 95.8, 127.8, 159.7, 191.7, 223.7, 255.6, 287.6, 319.5, 351.5, 383.5, 415.4, 447.4, 479.4, 511.3, 543.3, 575.3, 607.2, 639.2, 671.2, 703.1, 735.1, 766.2, 789.5, 811.7, 841.5, 871.5, 901.5, 931.7, 961.9, 992.5, 1024.1, 1056, 1087.9, 1119.6, 1151.2, 1182.7, 1213.7, 1244.7, 1275.7, 1306.7, 1337.8, 1368.7, 1400.2, 1432.1, 1464.1, 1496.1, 1528, 1560];
    // before the mountain the eye swings out to the far side of the goods line (past its halted engine) and comes back
    // to the mouth at a slant, so tier one's train is seen along its striped side going in, the mouth off to one side
    const head = [[0, 4, 205], [0, 4, 262], [0, 4, 330], [0, 4, 420], [0, 4, 500], [0.3, 4, 532], [2.6, 4.3, 548], [7.5, 5, 565], [11, 5.5, 584], [8.6, 5.1, 601], [2.8, 4.1, 619], [0, 4, 641], [0, 4, HW0]];
    const tail = [];
    for (let i = 15; i < fly.length - 1; i++) tail.push([fly[i].x, fly[i].y, fly[i].z]);
    for (const z of [EXZ + 50, EXZ + 105, EXZ + 160]) tail.push([30, deckY(z) + 4, z]);
    tail.push([30, 7.4, ZFOOT - 12], [30, 5.1, ZFOOT + 22], [30, 4.75, 1460], [30, 4.75, 1510], [30, 4.75, ZP]);
    // the hall: off the rail and straight up the nave between the tier one and tier two viaducts, no arch threaded, level
    // with the tier two deck from z 890, then across that deck (behind its train) into the tier two mouth
    const pts = [[0, 5.2, 84], [0, 5, 112], [0, 4.3, 136], [0, 4, 152], ...head,
      [0, 4, 738], [-1.5, 6.5, 758], [-5, 15, 783], [-7, 28, 815], [-7, 43, 852], [-6.5, 57, 888], [-4, 69, 922], [3, 76.5, 950], [13, 78.3, 974], [23.5, 76.6, 998], [29.2, 74.9, 1012], [30, 74.4, 1024], [30, 74, 1045], ...tail];
    const path = makePath(pts);
    const NT = 200, camZ = new Float32Array(NT + 1), tv = new THREE.Vector3();
    for (let i = 0; i <= NT; i++) camZ[i] = path.pointAt(i / NT, tv).z;
    const zAt = (u) => { const f = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)); return lerp(camZ[i], camZ[i + 1], f - i); };
    const uOldAtZ = (z) => { let lo = 0, hi = 50; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (OLDZ[m] < z) lo = m; else hi = m; }
      return (lo + clamp((z - OLDZ[lo]) / (OLDZ[hi] - OLDZ[lo]), 0, 1)) / 50; };
    const UO = (u) => uOldAtZ(zAt(u));
    await ctx.yield();
    // ---- the near mounds and their mouths. Three paper sheets (A: gate and valley floor, C: valley flanks,
    // B: the country behind the mountain), each computing its arcs per fragment from twelve mouth arches.
    const HP = Math.PI / 2;
    const gate = { x: -2, z: 205, rot: 0, W: 135, D: 110, H: 82, face: 27, back: 23, bow: 10, nc: 56, nd: 22, fstep: 2 };
    const st1 = { x: -26.3, z: 373.1, rot: -HP / 2, W: 14, D: 23, H: 21.5, face: 14.2, back: 8, bow: 0.6, nc: 16, nd: 10, fstep: 2 };
    const st2 = { x: -35.2, z: 505.8, rot: -Math.PI / 3, W: 31, D: 23, H: 23, face: 13.4, back: 8, bow: 0.8, nc: 30, nd: 10, fstep: 2 };
    const st3 = { x: -26.3, z: 586.1, rot: -HP / 2, W: 14, D: 23, H: 21, face: 14.2, back: 8, bow: 0.6, nc: 18, nd: 10, fstep: 2 };
    const P1 = { x: -160, z: 362, rot: -HP, W: 150, D: 170, H: 72, face: 28, nc: 40, nd: 18 };
    const P2 = { x: -196, z: 548, rot: -HP, W: 140, D: 184, H: 62, face: 27, nc: 40, nd: 18 };
    const S1 = { x: 152, z: 335, rot: HP, W: 150, D: 160, H: 58, face: 26, nc: 40, nd: 18 };
    const S2 = { x: 204, z: 532, rot: HP, W: 150, D: 190, H: 54, face: 26, nc: 40, nd: 18 };
    const last = { x: 21, z: ZM + 75, rot: 0, W: 132, D: 150, H: 116, face: 62, back: 20, bow: 12, nc: 56, nd: 22, fstep: 2.5 };
    const Q1 = { x: -152, z: 1330, rot: -HP, W: 170, D: 180, H: 112, face: 30, nc: 40, nd: 18 };
    const Q2 = { x: 212, z: 1352, rot: HP, W: 170, D: 180, H: 122, face: 30, nc: 40, nd: 18 };
    const gateF = moundMouth(gate, 0, 10, 2.5), gateB = moundMouth(gate, 0, 10, 2.5, true);
    // a fourth stage beside the last straight, facing the line as it comes down off the viaduct
    const st4 = { x: 57, z: 1418, rot: HP / 2, W: 14, D: 23, H: 21.5, face: 14.2, back: 8, bow: 0.6, nc: 16, nd: 10, fstep: 2 }, st4M = moundMouth(st4, 0, 6, 4.5);
    // and a low hill of three tall black arches under the falling viaduct
    // a tower of a hill beside the falling viaduct, a great niche high in its face at the eye's own height: a second rider's stage
    const st5 = { x: 80, z: 1318, rot: 0.75, W: 30, D: 30, H: 62, face: 48, back: 20, bow: 1.5, nc: 30, nd: 12, fstep: 2.5 }, st5M = moundMouth(st5, 0, 11, 8); st5M.p[1] = 22;
    const nicheM = [moundMouth(st1, 0, 6, 4.5)];
    for (let i = -2; i <= 2; i++) nicheM.push(moundMouth(st2, i * 10.4, 4.6, 5.2));
    nicheM.push(moundMouth(st3, 0, 6, 4.5));
    const branchM = moundMouth(S1, 45, 8, 2);
    const flankM = [moundMouth(P1, -58, 12, 3), moundMouth(P1, 52, 12, 3), moundMouth(P2, -34, 12, 3), moundMouth(P2, 62, 12, 3), branchM, moundMouth(S1, -62, 12, 3), moundMouth(S2, 42, 12, 3), moundMouth(S2, -58, 12, 3)];
    // THE EXIT FRONT. A low bridge of round arches stands along the last mound's foot (its face at BRZ, its deck at BRY, a
    // cell every BRP metres, the eye's own arch on x 30). Three arches are a stage: the middle one is the exit, its ribs
    // running back to the portal; in the arch on one side stands the rider, on the other the stag; the next arch to
    // port swallows the express and the low line; the rest stand on pressed black. A train crosses the deck in profile.
    const BRZ = ZM - 4.6, BRY = 13.4, BRP = 19;
    const exitM = { p: [30, 0, BRZ], n: [0, -1], r: 8.5, leg: 2.1 }, portM = { p: [30 - 2 * BRP, 0, BRZ], n: [0, -1], r: 7, leg: 4.5 };
    const wingM = [{ p: [30 + BRP, 0, BRZ], n: [0, -1], r: 7, leg: 4.5 }, { p: [30 - BRP, 0, BRZ], n: [0, -1], r: 7, leg: 4.5 }];
    // the holes these make in the mound's own sheet behind the bridge
    const lastS = moundMouth(last, 9, 9.3, 2.1), lastP = moundMouth(last, 9 - 2 * BRP, 7.8, 4.5), wingH = [moundMouth(last, 9 + BRP, 7.8, 4.5), moundMouth(last, 9 - BRP, 7.8, 4.5)];
    // an upper tier of three tall Ds in the last mound's face, an engine waiting in each
    const lastU = [-47, 0, 47].map((mx) => { const m = moundMouth(last, mx, 16, 4); m.p[1] = 32; return m; });
    const backM2 = [moundMouth(Q1, -58, 12, 3), moundMouth(Q1, 56, 12, 3), moundMouth(Q2, 60, 12, 3), moundMouth(Q2, -62, 12, 3)];
    // every field's pressure and crayon: ink 0 bare .. 1 pressed, bands of wax round the D (bw metres each), par which wax first
    const fld = (m, ink, bands, bw, par) => Object.assign(m, { ink, bands, bw, par });
    fld(gateF, 0, 3, 2.5, 0); fld(gateB, 0, 3, 2.5, 1); fld(lastS, 0, 0, 2.5, 0); fld(lastP, 0.92, 0, 2.5, 1); fld(wingH[0], 0.9, 0, 2.5, 0); fld(wingH[1], 0.9, 0, 2.5, 1);
    flankM.forEach((m, i) => fld(m, [0.92, 0, 0, 0.92, 0.9, 0, 0.92, 0][i], 2, 5, i % 2));
    lastU.forEach((m, i) => fld(m, i === 1 ? 0 : 0.95, 2, 5, (i + 1) % 2));
    backM2.forEach((m, i) => fld(m, [0.95, 0, 0, 0.95][i], 2, 5, i % 2));
    fld(st5M, 0.95, 3, 2.5, 0); fld(nicheM[0], 0.92, 2, 2.5, 1); fld(nicheM[6], 0, 2, 2.5, 0); fld(st4M, 0.9, 2, 2.5, 1);
    const mouthsA = pad12([gateF, gateB, ...nicheM, hm[1], branchM, hm[2]]);
    const mouthsC = pad12(flankM);
    const mouthsB = pad12([lastS, lastP, hm[9], hm[10], hm[11], ...lastU, st4M, st5M, ...wingH]), mouthsD = pad12(backM2);
    const sheetBase = stock === 'roll' ? 150 : stock === 'old' ? 80 : 110;
    const matA = paperMaterial({ mouths: mouthsA, sheet: sheetBase, side: THREE.DoubleSide, un: LU });
    const matC = paperMaterial({ mouths: mouthsC, sheet: sheetBase * 1.3, side: THREE.DoubleSide, un: LU });
    const matB = paperMaterial({ mouths: mouthsB, sheet: sheetBase * 0.9, side: THREE.DoubleSide, un: LU });
    const matD = paperMaterial({ mouths: mouthsD, sheet: sheetBase * 1.1, side: THREE.DoubleSide, un: LU });
    const SA = newShell(), SC = newShell(), SB = newShell(), SD = newShell();
    for (const o of [gate, st1, st2, st3]) { addMound(SA, o); await ctx.yield(); }
    for (const o of [P1, P2, S1, S2]) { addMound(SC, o); await ctx.yield(); }
    for (const o of [last, st4, st5]) { addMound(SB, o); await ctx.yield(); }
    for (const o of [Q1, Q2]) { addMound(SD, o); await ctx.yield(); }

    // ---- the back valley's own small hills, each a field of echoes round a black D with its one rim band, in ranks down
    // both sides of the falling viaduct and the last straight (shaded from their own seed arch, like the far country)
    const MID = [[-37, 1262, 23, 27, 9], [-28, 1338, 18, 21, 7.5], [-46, 1398, 25, 31, 10], [-25, 1452, 16, 19, 6.5], [65, 1256, 23, 28, 9], [118, 1262, 23, 33, 10], [99, 1394, 22, 29, 9], [59, 1462, 16, 20, 6.5], [104, 1462, 22, 30, 9]]
      .map(([x, z, W, H, r]) => ({ x, z, rot: 0.3 * Math.sign(x - 30), W, D: W * 1.3, H, face: r * 1.25 + 4, back: 4, bow: W * 0.1, nc: 20, nd: 12, fstep: 2.5, sh: 2.4, seed: { mx: 0, r, leg: r / 4 }, ink: 0, bands: 2 }));
    MID.forEach((mo, i) => { mo.ink = [3, 0, 2, 0, 0, 3, 2, 3, 0][i]; });
    // a tower of a hill at each end of the bridge, a black D at deck height in its face: the crossing train comes out of one and goes into the other
    for (const [x, rot] of [[30 - 5.1 * BRP, -HP], [30 + 5.1 * BRP, HP]]) MID.push({ x, z: BRZ + 3, rot, W: 13, D: 16, H: 36, face: 27, back: 6, bow: 1, nc: 18, nd: 10, fstep: 2.5, sh: 2.4, seed: { mx: 0, r: 5.6, leg: 2.2, y0: BRY }, ink: 2, bands: 2 });
    const midM = MID.map((mo) => moundMouth(mo, 0, mo.seed.r, mo.seed.leg));
    midM[midM.length - 1].p[1] = BRY; midM[midM.length - 2].p[1] = BRY;
    // ---- pencil pressed to black: the gate tunnel, the last mound's two mouths, a pocket behind every other D
    const BK = new Geo();
    for (const m of midM) { const ol = dOutline(m.r, m.leg, 10, 1); for (let k = 0; k < ol.length - 1; k++) BK.tri(mpt(m, 0, 0, -0.3), mpt(m, ol[k][0], ol[k][1], -0.3), mpt(m, ol[k + 1][0], ol[k + 1][1], -0.3)); }
    pocket(BK, gateF, -0.5, 110.5, false);
    pocket(BK, exitM, 0.4, ZP - BRZ + 30, true); pocket(BK, portM, 0.4, 120, true);
    for (const m of lastU) pocket(BK, m, -0.5, 40, true);
    for (const m of [...flankM, ...backM2]) pocket(BK, m, -0.5, m === branchM ? 90 : 46, true);
    const black = blackMaterial({ side: THREE.DoubleSide, un: LU });
    const blackMesh = new THREE.Mesh(BK.build(), black); blackMesh.frustumCulled = false; scene.add(blackMesh);
    // ---- crayon ribs: the gate tunnel and the last port tunnel every 5 m in runs of three; one rim band per mouth
    const ribG = new Geo(); addRib(ribG, 8, 2, 0.5, 1.5, 16, 1, 0, 0, 0, 0, 0, 0);
    const ribM = [], ribW = [], m4 = new THREE.Matrix4(), flip = vr.chance(0.5) ? 1 : 0;
    // the gate tunnel's ribs are their own mesh: from outside the mouth is pressed black, and the crayon only begins to
    // show, nearest rib first, as the eye closes in (uShowD: how far into the dark the wax can be seen)
    const gM = [], gW = [];
    for (let i = 0; i < 21; i++) { gM.push(ribMatrix(gateF, 4.5 + i * 5, 1.25, 2, new THREE.Matrix4())); gW.push((Math.floor(i / 3) + flip) % 2);
      gM.push(ribMatrix(gateF, 7 + i * 5, 1.29, 1.2, new THREE.Matrix4())); gW.push(2); }       // a pencil rib in each gap between the wax
    for (let i = 0; i < 16; i++) { ribM.push(ribMatrix(portM, 36.5 + i * 5, 0.9, 1, new THREE.Matrix4())); ribW.push((Math.floor(i / 3) + flip + 1) % 2); }
    for (let i = 0; i < 12; i++) {          // the exit's own ribs, from the arch to the portal: wax, and a pencil rib in each gap
      ribM.push(ribMatrix(exitM, 1.95 + i * 5, 1.06, 1.9, new THREE.Matrix4())); ribW.push((Math.floor(i / 3) + flip) % 2);
      if (i < 11) { ribM.push(ribMatrix(exitM, 4.45 + i * 5, 1.1, 1.2, new THREE.Matrix4())); ribW.push(2); } }
    // the one rim band of each outdoor mouth: a bold crayon arch 1.3 m wide
    const rimM = [], rimW = [];
    [gateF, gateB, ...flankM, ...backM2, ...lastU, ...midM].forEach((m, i) => { rimM.push(ribMatrix(m, -0.25, 1.07 * m.r / 8, 0.7, new THREE.Matrix4())); rimW.push((i + flip) % 2); });
    const ribs = new THREE.InstancedMesh(ribG.build(), waxMaterial({ instanced: true, side: THREE.DoubleSide, un: LU }), ribM.length);
    ribM.forEach((m, i) => ribs.setMatrixAt(i, m));
    ribs.geometry.setAttribute('aWaxI', new THREE.InstancedBufferAttribute(new Float32Array(ribW), 1));
    ribs.frustumCulled = false; scene.add(ribs);
    const rimG = new Geo(); addRib(rimG, 8.75, 2, 1.25, 1.5, 16, 1, 0, 0, 0, 0, 0, 0);
    const rims = new THREE.InstancedMesh(rimG.build(), ribs.material, rimM.length);
    rimM.forEach((m, i) => rims.setMatrixAt(i, m));
    rims.geometry.setAttribute('aWaxI', new THREE.InstancedBufferAttribute(new Float32Array(rimW), 1));
    rims.frustumCulled = false; scene.add(rims);
    const gWax = waxMaterial({ instanced: true, side: THREE.DoubleSide, un: LU });
    const gribs = new THREE.InstancedMesh(ribs.geometry.clone(), gWax, gM.length);
    gM.forEach((m, i) => gribs.setMatrixAt(i, m));
    gribs.geometry.setAttribute('aWaxI', new THREE.InstancedBufferAttribute(new Float32Array(gW), 1));
    gribs.frustumCulled = false; scene.add(gribs);
    // a blind of pressed black across the tunnel's far end, let down into the floor as the eye comes to the mouth
    const blindG = new Geo(); { const ol = dOutline(10.4, 2.5, 14, 1);
      for (let i = 0; i < ol.length - 1; i++) { const a = mpt(gateF, ol[i][0], ol[i][1], 0), b = mpt(gateF, ol[i + 1][0], ol[i + 1][1], 0), c = mpt(gateF, 0, 0, 0); blindG.tri([c[0], 0, 0], [a[0], a[1], 0], [b[0], b[1], 0]); } }
    const blind = new THREE.Mesh(blindG.build(), black); blind.position.set(0, -0.2, gateF.p[2] + 108); blind.frustumCulled = false; scene.add(blind);
    // niche arches have their own proportions: a second rib shape, five bands being the paper's own arcs round it
    const nribG = new Geo(); addRib(nribG, 6, 4.5, 0.5, 1.2, 14, 2, 0, 0, 0, 0, 0, 0);
    const nribs = new THREE.InstancedMesh(nribG.build(), ribs.material, nicheM.length + 2);
    [...nicheM, st4M, st5M].forEach((m, i) => { const k = m.r / 6; ribMatrix(m, -0.2, 1.04 * k, 0.7, m4); if (m.r < 6) m4.multiply(new THREE.Matrix4().makeScale(1, (m.leg + m.r) / (10.5 * k), 1)); nribs.setMatrixAt(i, m4); });
    nribs.geometry.setAttribute('aWaxI', new THREE.InstancedBufferAttribute(new Float32Array([...nicheM, st4M, st5M].map((_, i) => (i + flip) % 2)), 1));
    nribs.frustumCulled = false; scene.add(nribs);
    await ctx.yield();
    // ---- the ground: pasted sheets with real seam steps (0.3 m, three of 2 m), a paste stain along every seam
    const gr = rng.fork('ground'), FORCED = [65, 386, 410];
    const seams = [];
    { let z = -1000;
      while (z < 2700) { z += stock === 'roll' ? 90 : stock === 'old' ? gr.range(70, 190) : gr.range(45, 150); if (FORCED.every((f) => Math.abs(z - f) > 24)) seams.push(z); }
      seams.push(...FORCED); seams.sort((a, b) => a - b); }
    const slopes = seams.map((z, i) => {                                        // crooked to one another, never crossing
      const gap = Math.min(i > 0 ? z - seams[i - 1] : 99, i < seams.length - 1 ? seams[i + 1] - z : 99), lim = Math.min(0.07, 0.4 * gap / 500);
      return FORCED.includes(z) ? gr.range(-0.5, 0.5) * lim : stock === 'roll' ? 0.012 : gr.range(-1, 1) * lim; });
    const xs = [-2400, -1500, -900, -520, -300, -180, -101, -40, -14, 14, 40, 101, 180, 300, 520, 900, 1500, 2400];
    const grp = [0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7, 8];
    const NS = seams.length - 1, NCOL = xs.length - 1, GH = [], GT = [];
    for (let i = 0; i < NS; i++) {
      const low = seams[i + 1] <= 65 || seams[i] === 386, rowH = [], rowT = []; let h = 0, t = 0;
      for (let c = 0; c < NCOL; c++) {
        if (c === 0 || (stock !== 'roll' && grp[c] !== grp[c - 1])) { h = gr.pick([-0.06, -0.36, -0.36, -0.66]); t = gr.chance(stock === 'old' ? 0.5 : 0.32) ? gr.range(0.45, 1) : 0; }
        rowH.push(low ? -2.3 + h * 0.5 : h); rowT.push(t);
      }
      GH.push(rowH); GT.push(rowT);
    }
    const sz = (i, x) => seams[i] + slopes[i] * clamp(x, -500, 500);
    const gq = (S, a, b, c, d, t) => { const k = S.pos.length / 3; S.pos.push(...a, ...b, ...c, ...d); S.n.push(0, 0, 0, 0); S.wax.push(t, t, t, t); S.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
    const stainW = stock === 'old' ? 1.7 : 0.6;
    const flat = (x0, x1, za0, za1, zb0, zb1, h, t) => {           // a piece of sheet between two z lines (given at x0 and x1)
      if (zb0 - za0 < 0.01 && zb1 - za1 < 0.01) return;
      gq((za0 + zb0) * 0.5 < 900 ? SA : SB, [x0, h, za0], [x1, h, za1], [x1, h, zb1], [x0, h, zb0], t);
    };
    for (let i = 0; i < NS; i++) {
      for (let c = 0; c < NCOL; c++) {
        const x0 = xs[c], x1 = xs[c + 1], h = GH[i][c], t = GT[i][c], hall = c >= 6 && c <= 10;
        const a0 = sz(i, x0), a1 = sz(i, x1), b0 = sz(i + 1, x0), b1 = sz(i + 1, x1);
        const parts = hall ? [[-1e5, HW0 - 1], [1021, 1e5]] : [[-1e5, 1e5]];
        for (const [lo, hi] of parts) {
          const k = (z) => clamp(z, lo, hi);
          flat(x0, x1, k(a0), k(a1), k(a0 + stainW), k(a1 + stainW), h, 1);
          flat(x0, x1, k(a0 + stainW), k(a1 + stainW), k(b0), k(b1), h, t);
        }
        const inHall = (z) => hall && z > HW0 - 1 && z < 1021;
        if (i > 0 && GH[i - 1][c] !== h && !inHall(a0)) gq(a0 < 900 ? SA : SB, [x0, GH[i - 1][c], a0], [x1, GH[i - 1][c], a1], [x1, h, a1], [x0, h, a0], 1);
        if (c > 0 && GH[i][c - 1] !== h && !(inHall((a0 + b0) / 2))) gq(a0 < 900 ? SA : SB, [x0, GH[i][c - 1], a0], [x0, GH[i][c - 1], b0], [x0, h, b0], [x0, h, a0], 1);
      }
      if (i % 12 === 11) await ctx.yield();
    }
    const geoA = shellGeo(SA); await ctx.yield();
    const geoB = shellGeo(SB); await ctx.yield();
    const meshA = new THREE.Mesh(geoA, matA), meshC = new THREE.Mesh(shellGeo(SC), matC), meshB = new THREE.Mesh(geoB, matB);
    const meshD = new THREE.Mesh(shellGeo(SD), matD);
    for (const m of [meshA, meshC, meshB, meshD]) { m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // ---- rails: ribbons of two ruled lines and a sleeper every metre (tan outside, tan lines on black inside a mouth)
    const TG = new Geo(), EG = new Geo();                                       // tracks; embankment sides and viaduct walls
    const ribbon = (pts, half, gauge, w, yf) => {
      let s = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], pa = pts[Math.max(0, i - 1)], nb = pts[Math.min(pts.length - 1, i + 2)];
        const ta = [b[0] - pa[0], b[1] - pa[1]], tb = [nb[0] - a[0], nb[1] - a[1]], la = Math.hypot(ta[0], ta[1]) || 1, lb = Math.hypot(tb[0], tb[1]) || 1;
        const na = [ta[1] / la * half, -ta[0] / la * half], nbv = [tb[1] / lb * half, -tb[0] / lb * half], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ya = yf(a[0], a[1]), yb = yf(b[0], b[1]);
        TG.quad([a[0] - na[0], ya, a[1] - na[1], s, -half, gauge, w], [b[0] - nbv[0], yb, b[1] - nbv[1], s + d, -half, gauge, w], [b[0] + nbv[0], yb, b[1] + nbv[1], s + d, half, gauge, w], [a[0] + na[0], ya, a[1] + na[1], s, half, gauge, w]);
        s += d;
      }
    };
    const straight = (x, z0, z1, n = 1) => { const p = []; for (let i = 0; i <= n; i++) p.push([x, lerp(z0, z1, i / n)]); return p; };
    const sCurve = (xa, xb, z0, z1, n = 14) => { const p = []; for (let i = 0; i <= n; i++) p.push([lerp(xa, xb, smoothstep(0, 1, i / n)), lerp(z0, z1, i / n)]); return p; };
    const y0 = () => 0.04, y1 = () => 0.16;
    ribbon(straight(-3, -320, 149.5, 8), 4.7, 3, 0, y0); ribbon(straight(-3, 149.5, 260.5, 4), 11.3, 3, 4, () => 0.12); ribbon(straight(-3, 260.5, hm[1].p[2] + 0.5, 8), 4.7, 3, 0, y0);
    // the branch: out of the starboard flank's mouth, a quarter turn, then 6 m to starboard of the eye
    const BR = branchM.p[0] - 6, BZ = branchM.p[2], BARC = BR * Math.PI / 2;
    const branchAt = (s, o) => {
      if (s < 0) { o.p.set(branchM.p[0] - s, 0, BZ); o.f.set(-1, 0, 0); }
      else if (s < BARC) { const a = s / BR; o.p.set(branchM.p[0] - BR * Math.sin(a), 0, BZ + BR * (1 - Math.cos(a))); o.f.set(-Math.cos(a), 0, Math.sin(a)); }
      else { const z = BZ + BR + (s - BARC), k = smoothstep(555, 612, z); o.p.set(6 - 6 * k, 0, z); o.f.set(-0.18 * k * (1 - k) * 4 * 0.5, 0, 1).normalize(); }
    };
    { const o = { p: new THREE.Vector3(), f: new THREE.Vector3() }, pin = [], pout = [];
      for (let s = -88; s <= 0; s += 22) { branchAt(s, o); pin.push([o.p.x, o.p.z]); }
      for (let s = 0; s <= BARC + (612 - BZ - BR); s += 6) { branchAt(s, o); pout.push([o.p.x, o.p.z]); }
      ribbon(pin, 7.6, 0, 4, () => 0.12); ribbon(pout, 1.75, 0, 0, y1); }
    // behind the mountain: the falling viaduct's deck, the level run, the two tracks parting to the twin mouth
    ribbon(straight(27, EXZ - 0.5, ZFOOT, 10), 8, 3, 0, (x, z) => deckY(z) + 0.06);
    ribbon(straight(27, ZFOOT, 1424, 2), 4.7, 3, 0, y1);
    ribbon(straight(30, 1424, BRZ, 4), 1.75, 0, 0, y1); ribbon(straight(30, BRZ, ZP + 30, 2), 8.8, 0, 4, () => 0.12);
    ribbon(sCurve(24, 30 - 2 * BRP + 3, 1410, ZM - 12, 18), 1.75, 0, 0, y1); ribbon(straight(30 - 2 * BRP + 3, ZM - 12, BRZ, 2), 1.75, 0, 0, y1); ribbon(straight(30 - 2 * BRP, BRZ, ZM + 128, 2), 7.2, 3, 4, () => 0.12);
    ribbon(straight(-3, hm[10].p[2] - 0.5, 1400, 6), 4.7, 3, 0, y0); ribbon(sCurve(-3, 30 - 2 * BRP, 1400, ZM - 15), 4.7, 3, 0, y0); ribbon(straight(30 - 2 * BRP, ZM - 15, BRZ, 2), 4.7, 3, 0, y0);
    ribbon([[30 + 4.6 * BRP, BRZ + 3], [30 - 4.6 * BRP, BRZ + 3]], 2.6, 0, 0, () => BRY + 0.04);   // the line across the bridge's deck
    // the last mound's ledge: a track across its face 32 m up, out of the first upper D and into the third (a train crosses it
    // in profile as the eye comes down the falling viaduct)
    const LEDGE = (() => {
      const A = lastU[0].p, B = lastU[2].p, LY = A[1], lz = (x) => ZM + 12 * ((x - 21) / 132) * ((x - 21) / 132) - 3.6, pts = [];
      for (let i = 0; i <= 6; i++) pts.push([A[0], A[2] + 42 - i * 7]);
      const xa = A[0] + 11, za = lz(xa), xb = B[0] - 11, zb = lz(xb);
      for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push([A[0] + 11 * (1 - Math.cos(a)), A[2] + (za - A[2]) * Math.sin(a)]); }
      const n = Math.ceil((xb - xa) / 4);
      for (let i = 1; i <= n; i++) { const x = lerp(xa, xb, i / n); pts.push([x, lz(x)]); }
      for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push([xb + 11 * Math.sin(a), zb + (B[2] - zb) * (1 - Math.cos(a))]); }
      for (let i = 1; i <= 6; i++) pts.push([B[0], B[2] + i * 7]);
      const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const S = cum[cum.length - 1];
      return { S, LY, pts, at(s, q) { const d = clamp(s, 0, S - 0.01); let i = 1; while (cum[i] < d) i++;
        const k = (d - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-4), a = pts[i - 1], b = pts[i];
        q.p.set(lerp(a[0], b[0], k), LY, lerp(a[1], b[1], k)); q.f.set(b[0] - a[0], 0, b[1] - a[1]).normalize(); } };
    })();
    ribbon(LEDGE.pts.slice(5, LEDGE.pts.length - 5), 3.5, 0, 0, () => LEDGE.LY + 0.03);
    { const A = lastU[0].p, B = lastU[2].p, lz = (x) => ZM + 12 * ((x - 21) / 132) * ((x - 21) / 132), Y = LEDGE.LY, x0 = A[0] - 19, x1 = B[0] + 19, n = 14;   // the shelf itself: a paper deck and a ruled front band
      for (let i = 0; i < n; i++) { const xa = lerp(x0, x1, i / n), xb = lerp(x0, x1, (i + 1) / n), fa = lz(xa) - 7.2, fb = lz(xb) - 7.2;
        EG.quad([xa, Y - 2.4, fa, xa, 0, 2.4, 2], [xb, Y - 2.4, fb, xb, 0, 2.4, 2], [xb, Y + 0.01, fb, xb, 1, 2.4, 2], [xa, Y + 0.01, fa, xa, 1, 2.4, 2]);
        EG.quad([xa, Y, fa, xa, 0, 7.6, 2], [xb, Y, fb, xb, 0, 7.6, 2], [xb, Y, fb + 7.6, xb, 1, 7.6, 2], [xa, Y, fa + 7.6, xa, 1, 7.6, 2]);
        EG.quad([xa, Y - 2.4, fa, xa, 0, 7.6, 2], [xb, Y - 2.4, fb, xb, 0, 7.6, 2], [xb, Y - 2.4, fb + 7.6, xb, 1, 7.6, 2], [xa, Y - 2.4, fa + 7.6, xa, 1, 7.6, 2]); } }

    await ctx.yield();
    // ---- embankment sides where the ground steps down 2 m (bare paper bands with pencil edges), and the falling viaduct
    for (const [za, zb] of [[-320, 68], [380, 416]]) {
      for (const x of [-7.7, 1.7]) EG.quad([x, -2.75, za, za, 0, 2.8, 2], [x, -2.75, zb, zb, 0, 2.8, 2], [x, 0.05, zb, zb, 1, 2.8, 2], [x, 0.05, za, za, 1, 2.8, 2]);
    }
    for (const x of [4.25, 7.75]) EG.quad([x, -2.75, 380, 380, 0, 2.8, 2], [x, -2.75, 416, 416, 0, 2.8, 2], [x, 0.15, 416, 416, 1, 2.8, 2], [x, 0.15, 380, 380, 1, 2.8, 2]);
    EG.quad([1.7, 0.03, 380, 380, 0, 2.6, 2], [1.7, 0.03, 416, 416, 0, 2.6, 2], [4.3, 0.03, 416, 416, 1, 2.6, 2], [4.3, 0.03, 380, 380, 1, 2.6, 2]);
    for (const x of [19.3, 34.7]) EG.quad([x, deckY(EXZ), EXZ, EXZ, 0, 1.1, 2], [x, 0, ZFOOT, ZFOOT, 0, 1.1, 2], [x, 1.1, ZFOOT, ZFOOT, 1, 1.1, 2], [x, deckY(EXZ) + 1.1, EXZ, EXZ, 1, 1.1, 2]);   // the falling deck's low parapets
    { // the exit front's crayon: two bands round the exit, one round each wing and the port arch; and the bridge's deck
      const w0 = flip, w1 = 1 - flip;
      addRib(EG, exitM.r + 0.95, exitM.leg, 0.95, 0.9, 24, 1, exitM.p[0], 0, BRZ - 0.5, w0, w0, w0);
      addRib(EG, exitM.r + 1.9, exitM.leg, 0.95, 0.7, 24, 1, exitM.p[0], 0, BRZ - 0.4, w1, w1, w1);
      for (const m of [...wingM, portM]) addRib(EG, m.r + 0.9, m.leg, 0.9, 0.8, 24, 1, m.p[0], 0, BRZ - 0.45, m === portM ? w0 : w1, m === portM ? w0 : w1, m === portM ? w0 : w1);
      const xa = 30 - 4.75 * BRP, xb = 30 + 4.75 * BRP;
      EG.quad([xa, BRY, BRZ - 0.3, xa, 0, 7.5, 2], [xb, BRY, BRZ - 0.3, xb, 0, 7.5, 2], [xb, BRY, BRZ + 7.2, xb, 1, 7.5, 2], [xa, BRY, BRZ + 7.2, xa, 1, 7.5, 2]);
      EG.quad([xa, BRY - 0.02, BRZ - 0.3, xa, 0, 1.2, 2], [xb, BRY - 0.02, BRZ - 0.3, xb, 0, 1.2, 2], [xb, BRY + 1.2, BRZ - 0.3, xb, 1, 1.2, 2], [xa, BRY + 1.2, BRZ - 0.3, xa, 1, 1.2, 2]);   // a low parapet
    }
    const embank = new THREE.Mesh(EG.build(), waxMaterial({ side: THREE.DoubleSide, un: LU })); embank.frustumCulled = false; scene.add(embank);
    const AG = new Geo();
    { const NB = 14, P = (ZFOOT - EXZ) / NB;
      for (let b = 0; b < NB; b++) {
        const z0 = EXZ + b * P, z1 = z0 + P, zc = (z0 + z1) / 2, yM = deckY(zc), R = clamp((yM - 2.6) * 0.5, 0, 6.2), ys = Math.max(0, yM - 2.9 - R);
        for (const x of [19, 35]) {
          const V = (z, y) => [x, y, z, z - zc, y - ys, Math.max(R, 0.01), 0];
          if (R < 1.2) { AG.quad([x, -3, z0, 0, 60, 1, 0], [x, -3, z1, 0, 60, 1, 0], [x, deckY(z1), z1, 0, 60, 1, 0], [x, deckY(z0), z0, 0, 60, 1, 0]); continue; }
          AG.quad(V(z0, -3), V(zc - R, -3), V(zc - R, ys), V(z0, ys)); AG.quad(V(zc + R, -3), V(z1, -3), V(z1, ys), V(zc + R, ys));
          AG.tri(V(z0, ys), V(zc - R, ys), V(z0, deckY(z0))); AG.tri(V(zc + R, ys), V(z1, ys), V(z1, deckY(z1)));
          for (let i = 0; i < 12; i++) { const a0 = Math.PI * (1 - i / 12), a1 = Math.PI * (1 - (i + 1) / 12);
            const o0 = zc + (P / 2) * clamp(Math.cos(a0) * 1.5, -1, 1), o1 = zc + (P / 2) * clamp(Math.cos(a1) * 1.5, -1, 1);
            AG.quad(V(zc + R * Math.cos(a0), ys + R * Math.sin(a0)), V(o0, deckY(o0)), V(o1, deckY(o1)), V(zc + R * Math.cos(a1), ys + R * Math.sin(a1))); }
        }
        if (R >= 1.2) for (let i = 0; i < 12; i++) { const a0 = Math.PI * (1 - i / 12), a1 = Math.PI * (1 - (i + 1) / 12);
          AG.quad([19, ys + R * Math.sin(a0), zc + R * Math.cos(a0), 0, 0, 0, 2], [35, ys + R * Math.sin(a0), zc + R * Math.cos(a0), 0, 1, 0, 2], [35, ys + R * Math.sin(a1), zc + R * Math.cos(a1), 0, 1, 0, 2], [19, ys + R * Math.sin(a1), zc + R * Math.cos(a1), 0, 0, 0, 2]); }
      }
    }
    // a wall of round arches: n cells of `pitch` from (x0, z0) along (dx, dz), arch radius R sprung ys above the foot yb, ruled
    // top at `top`; bk = [ox, oz]: pressed black standing that far behind every arch (omit for open arches)
    const arcadeRow = (x0, z0, dx, dz, n, pitch, R, ys, top, yb, bk, w = 0, ns = 12) => {
      for (let b = 0; b < n; b++) {
        const s0 = b * pitch, sc = s0 + pitch / 2, s1 = s0 + pitch;
        const V = (s, y) => [x0 + dx * s, yb + y, z0 + dz * s, s - sc, y - ys, R, w];
        AG.quad(V(s0, 0), V(sc - R, 0), V(sc - R, ys), V(s0, ys)); AG.quad(V(sc + R, 0), V(s1, 0), V(s1, ys), V(sc + R, ys));
        AG.tri(V(s0, ys), V(sc - R, ys), V(s0, top)); AG.tri(V(sc + R, ys), V(s1, ys), V(s1, top));
        for (let i = 0; i < ns; i++) { const a0 = Math.PI * (1 - i / ns), a1 = Math.PI * (1 - (i + 1) / ns);
          const o0 = sc + (pitch / 2) * clamp(Math.cos(a0) * 1.5, -1, 1), o1 = sc + (pitch / 2) * clamp(Math.cos(a1) * 1.5, -1, 1);
          AG.quad(V(sc + R * Math.cos(a0), ys + R * Math.sin(a0)), V(o0, top), V(o1, top), V(sc + R * Math.cos(a1), ys + R * Math.sin(a1))); }
        if (bk) { const K = (s, y) => [x0 + dx * s + bk[0], yb + y, z0 + dz * s + bk[1], 0, 0, 0, 3];
          AG.quad(K(sc - R - 0.3, 0), K(sc + R + 0.3, 0), K(sc + R + 0.3, ys + R + 0.3), K(sc - R - 0.3, ys + R + 0.3)); }
      }
    };
    // a row of small arches at the mountain's foot beside the line mouth, seen beyond tier one's train as the eye swings out
    arcadeRow(-15.5, 619.4, -1, 0.04, 6, 9, 3.2, 4.2, 10.2, -0.3, [0, 0.5]);
    for (let k = -4; k <= 4; k++) {           // the bridge along the last mound's foot: the exit, two wings and the port arch open, the rest on pressed black
      const open = k >= -2 && k <= 1, m = k === 0 ? exitM : wingM[0], xc = 30 + BRP * k;
      arcadeRow(xc + BRP / 2, BRZ, -1, 0, 1, BRP, m.r, m.leg, BRY, 0, open ? null : [0, 1.4], 1, 24);
      if (open) { const inn = [[-m.r, 0]]; for (let i = 0; i <= 24; i++) { const a = Math.PI * (1 - i / 24); inn.push([m.r * Math.cos(a), m.leg + m.r * Math.sin(a)]); } inn.push([m.r, 0]);   // the wall's thickness, ruled across
        for (let i = 0; i < inn.length - 1; i++) AG.quad([xc + inn[i][0], inn[i][1], BRZ, 0, 0, 0, 2], [xc + inn[i][0], inn[i][1], BRZ + 0.36, 0, 1, 0, 2], [xc + inn[i + 1][0], inn[i + 1][1], BRZ + 0.36, 0, 1, 0, 2], [xc + inn[i + 1][0], inn[i + 1][1], BRZ, 0, 0, 0, 2]); }
    }
    const viaduct = new THREE.Mesh(AG.build(), arcadeMaterial({ side: THREE.DoubleSide, un: LU })); viaduct.frustumCulled = false; scene.add(viaduct);
    const trackMesh = new THREE.Mesh(TG.build(), trackMaterial({ side: THREE.DoubleSide, un: LU })); trackMesh.frustumCulled = false; scene.add(trackMesh);
    await ctx.yield();

    // ---- the world's own trains (the hero runs nine more): engine distance along a route is a function of u
    const o = { p: new THREE.Vector3(), f: new THREE.Vector3() };
    const TAN8 = Math.tan(8 * Math.PI / 180);
    const expY = (z) => (z < 1070 ? 70 : z < EXZ ? 70 - (z - 1070) * TAN8 : deckY(z));
    const expX = (z) => 24 - (2 * BRP - 9) * smoothstep(1410, ZM - 12, z);
    const nCars = (n) => Math.max(4, Math.round(n * clamp(density, 0.8, 1.15)));
    const trains = [
      { cars: 14, sch: SCH, dir: -1, lo: -330, hi: 400, k: 1.35, at(s, q) { q.p.set(-6.5, 0, s); q.f.set(0, 0, -1); },
        s: (u, ez) => 153 - 0.565 * Math.max(0, ez - 84) },      // parked at the gate mouth's lip in the first frame, a size larger than the rest
      { cars: nCars(8), sch: SCH, dir: 1, lo: -86, hi: 1e5, at: branchAt,
        s: (u) => Math.min(116 + 984 * (u - 0.17), BARC + (536 - BZ - BR) + 30 * smoothstep(0.33, 0.45, u)) },
      { cars: 12, sch: SCH_EXPRESS, dir: 1, lo: 1022, hi: ZM + 112,
        at(s, q) { q.p.set(expX(s), expY(s), s); q.f.set(expX(s + 1) - expX(s - 1), expY(s + 1) - expY(s - 1), 2).normalize(); },
        s: (u, ez) => { const L = (u - 0.672) * 702; return ez + (L < 130 ? L : 130 + 30 * (1 - Math.exp(-(L - 130) / 30))) - 72 * smoothstep(1365, 1480, ez); } },   // we close on it at the last: its tail goes into the black beside us
      { cars: nCars(6), sch: SCH, dir: -1, lo: 1100, hi: 1404, at(s, q) { q.p.set(0, 0, s); q.f.set(0, 0, -1); },
        s: (u) => 1385 - (u - 0.755) * 2300 },
      { cars: nCars(7), sch: SCH, dir: 1, lo: 1179, hi: ZM + 110, k: 1.2,          // a goods train out of the mountain's back mouth, down the low line into the port mouth
        at(s, q) { q.p.set(lowX(s) - 3, 0, s); q.f.set(lowX(s + 1) - lowX(s - 1), 0, 2).normalize(); }, s: (u, ez) => 1300 + (ez - 1249) * 1.1 },
      { cars: 4, sch: SCH, dir: 1, lo: 6, hi: LEDGE.S - 6, k: 2.2, at: LEDGE.at, s: (u, ez) => 100 + (ez - 1249) * 0.345 },   // across the last mound's face on its ledge
      { cars: 7, sch: SCH, dir: 1, lo: 3, hi: 9.6 * BRP - 3, k: 1.45, smk: 70,                // across the bridge in profile as the eye comes up the last straight
        at(s, q) { q.p.set(30 + 4.8 * BRP - s, BRY + 0.05, BRZ + 3); q.f.set(-1, 0, 0); }, s: (u, ez) => 113 + (ez - 1470) * 1.5 },
      ...[lastU[1]].map((m) => ({ cars: 0, sch: SCH, dir: 1, lo: -1, hi: 1, k: 17 / 3.6, v: 0.12, s: () => 0,     // an engine's round face waiting in the middle upper D of the last mound
        at(s, q) { const d = -3.64 * (17 / 3.6) - 1.2; q.p.set(m.p[0] + m.n[0] * d, m.p[1], m.p[2] + m.n[1] * d); q.f.set(m.n[0], 0, m.n[1]); } })),
    ];
    const rareAt = [1, 3, 5, 6, 8];                                             // the hero rolls engines out of 0, 2, 4, 7; these make nine
    const nEng = trains.length + rareAt.length, nCar = trains.reduce((a, t) => a + t.cars, 0);
    const trainMat = trainMaterial({ side: THREE.DoubleSide, un: LU });
    const engines = new THREE.InstancedMesh(hero.geos.engine.clone(), trainMat, nEng), cars = new THREE.InstancedMesh(hero.geos.car.clone(), trainMat, nCar);
    const eAttr = new THREE.InstancedBufferAttribute(new Float32Array(nEng * 4), 4), cAttr = new THREE.InstancedBufferAttribute(new Float32Array(nCar * 4), 4);
    { let c = 0; const tr = rng.fork('trains');
      trains.forEach((T, i) => { eAttr.setXYZW(i, 0, T.sch, 0, tr()); T.c0 = c; for (let j = 0; j < T.cars; j++) cAttr.setXYZW(c++, 0, T.sch, 0, tr()); });
      rareAt.forEach((_, i) => eAttr.setXYZW(trains.length + i, 0, SCH, 0, tr())); }
    for (const im of [engines, cars]) {
      const at = im === engines ? eAttr : cAttr; at.setUsage(THREE.DynamicDrawUsage);
      im.geometry.setAttribute('aTrain', at); im.geometry.setAttribute('aWaxI', new THREE.InstancedBufferAttribute(new Float32Array(im.count), 1));
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; scene.add(im);
    }
    const NPUFF = Math.max(5, Math.round(9 * detail));
    // smoke left hanging: chains of scalloped puffs drifting along the crown of each flown tunnel and up the hall (clock loops)
    const drift = [];
    for (const [x, y, z0, z1, tip] of [[-5, 10.6, 152, 258, 0], [-5.2, 8.3, hm[1].p[2] + 2, HW0 - 2, 0], [25, 78.3, 1022, EXZ - 2, 1]]) {
      for (let i = 0; i < 12; i++) drift.push({ x, y, z0, z1, tip, ph: i / 12, kind: 0 }); }
    const NHALL = Math.round(18 * detail);
    for (let i = 0; i < NHALL; i++) drift.push({ x: i % 2 ? -22 : 62, z0: 790 + (i % 3) * 70, z1: 0, tip: 0, ph: i / NHALL, kind: 1 });
    const smoke = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), smokeMaterial({ un: LU }), nEng * NPUFF + drift.length);
    smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage); smoke.frustumCulled = false; scene.add(smoke);
    const engState = []; for (let i = 0; i < nEng; i++) engState.push({ p: new THREE.Vector3(), f: new THREE.Vector3(0, 0, 1), on: false, v: 1 });
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z3 = new THREE.Vector3();
    const place = (im, i, show, k = 1) => {
      if (!show) { im.setMatrixAt(i, ZERO); return; }
      X.crossVectors(UP, o.f).normalize(); Y.crossVectors(o.f, X); m4.makeBasis(X.multiplyScalar(k), Y.multiplyScalar(k), Z3.copy(o.f).multiplyScalar(k)).setPosition(o.p); im.setMatrixAt(i, m4);
    };
    await ctx.yield();
    // ---- the far country: ranks of mounds, each rank higher up the sheet, every one a field of echoes round a black D
    const SF = newShell(), FK = new Geo(), fr = rng.fork('far');
    const RINGS = [[410, 170, 260, 130, 190, 0.8], [770, 300, 380, 300, 400, 2], [1260, 520, 600, 650, 850, 5], [1920, 800, 800, 1200, 1500, 10]];
    for (const [d, W, D, h0, h1, off] of RINGS) {
      const L = 2 * 1560 + 2 * Math.PI * d, n = Math.ceil(L / (W * 1.25));
      for (let i = 0; i < n; i++) {
        let t = ((i + fr.range(-0.25, 0.25)) / n) * L, x, z, ix, iz;
        if (t < 1560) { x = d; z = t; ix = -1; iz = 0; }
        else if (t < 1560 + Math.PI * d) { const a = (t - 1560) / d; x = d * Math.cos(a); z = 1560 + d * Math.sin(a); ix = -Math.cos(a); iz = -Math.sin(a); }
        else if (t < 3120 + Math.PI * d) { x = -d; z = 1560 - (t - 1560 - Math.PI * d); ix = 1; iz = 0; }
        else { const a = (t - 3120 - Math.PI * d) / d; x = -d * Math.cos(a); z = -d * Math.sin(a); ix = Math.cos(a); iz = Math.sin(a); }
        const H = fr.range(h0, h1), face = H * 0.62, y0 = H * 0.34, r = W * fr.range(0.09, 0.135), mx = fr.range(-0.3, 0.3) * W, rot = Math.atan2(-ix, -iz) + fr.range(-0.2, 0.2);
        const jit = fr.range(-0.12, 0.12) * d;
        const mo = { x: x - ix * jit, z: z - iz * jit, rot, W, D, H, face, back: face * 0.5, nc: 30, nd: 20, fstep: face / 3, sh: fr.range(2, 2.8), tint: fr.chance(0.3) ? fr.range(0.3, 0.8) : 0, seed: { mx, r, leg: r / 4, y0 }, ink: Math.min(4, (off < 1 ? 0 : off < 3 ? 1 : off < 6 ? 2 : 3) + 2 * (i % 2)), bands: 3 };   // its D stands a third of the way up, over the rank in front
        addMound(SF, mo);
        const cs = Math.cos(rot), sn = Math.sin(rot), zf = -D / 2 + W * 0.14 * (mx / W) * (mx / W) - off, ol = dOutline(r, r / 4, 10, 1);
        const Wp = (a, y) => [mo.x + cs * (mx + a) + sn * zf, y + y0, mo.z - sn * (mx + a) + cs * zf];
        for (let k = 0; k < ol.length - 1; k++) FK.tri(Wp(0, 0), Wp(ol[k][0], ol[k][1]), Wp(ol[k + 1][0], ol[k + 1][1]));
        await ctx.yield();
      }
      await ctx.yield();
    }
    for (const mo of MID) addMound(SF, mo);
    await ctx.yield();
    const geoF = shellGeo(SF);
    await ctx.yield();
    const matF = paperMaterial({ sheet: sheetBase * 2.2, side: THREE.DoubleSide, un: LU, seed: true });
    const farMesh = new THREE.Mesh(geoF, matF); farMesh.frustumCulled = false; scene.add(farMesh);
    const farBlack = new THREE.Mesh(FK.build(), black); farBlack.frustumCulled = false; scene.add(farBlack);
    await ctx.yield();

    // ---- no sky: bare pieced paper on a fixed shell 5 km out, large sheets in the two tans, seams straight and crooked.
    // The shell's own paper carries THE LAST RANK: very tall mounds drawn on it in his closest hatching (nested arcs of
    // graphite round a seed arch at each mound's foot, every band pressed from its inner line with one narrow line of
    // paper spared), two rows deep, their arched outlines against the bare sheets above. World-fixed: a rule of the
    // shell's own coordinates (metres round it, metres up it), the same from every point of the flight.
    const sr = rng.fork('sky'), planes = [], offs = [];
    for (let i = 0; i < 5; i++) { const a = sr.range(0, 6.283), e = sr.range(-0.5, 0.5); planes.push(new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e))); offs.push(sr.range(-0.25, 0.45)); }
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { ...LU, uPl: { value: planes }, uOff: { value: offs } }, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`varying vec3 vD; uniform vec3 uPl[5]; uniform float uOff[5];` + STYLE_GLSL + /* glsl */`
      const float RS = 5200.0, NC = 14.0, CW = 6.2831853 * 5200.0 / 14.0;
      // one mound of the last rank. q = (metres round the shell, metres up it); cell = its place in the row; lay 0 the
      // front row, 1 the taller row behind. Returns x: metres inside its outline (below 0 outside), y: metres from its
      // seed arch (the echo's n), z: signed metres from the seed D itself.
      vec3 farMound(vec2 q, float cell, float lay){
        float ci = mod(cell, NC);
        float h1 = lhHash(vec2(ci * 0.713 + lay * 5.3 + 0.37, 2.9 + lay)), h2 = lhHash(vec2(ci * 0.291 + 1.7, 7.3 + lay * 3.1));
        float h3 = lhHash(vec2(ci * 0.137 + 4.1 + lay, 1.3));
        float H = RS * mix(mix(0.54, 0.74, h1), mix(0.70, 1.15, h1), lay);
        float Wm = CW * mix(0.70, 0.86, h2);
        float x = q.x - (cell + 0.5 + 0.5 * lay + (h3 - 0.5) * 0.28) * CW;
        float t = clamp(abs(x) / Wm, 1e-4, 1.0), ta = pow(t, 2.4), m = max(1.0 - ta, 1e-3);
        float e = H * pow(m, 0.6);
        float de = H * 0.6 * 2.4 * (ta / t) / (pow(m, 0.4) * Wm);              // the outline's slope
        float g = (e - q.y) / sqrt(1.0 + de * de);
        if (abs(x) >= Wm) g = -1.0;
        float r = Wm * mix(0.10, 0.15, h3), leg = r * 0.3;
        vec2 dq = vec2(x - (h2 - 0.5) * 0.3 * Wm, q.y - H * 0.08);
        float v = dq.y - leg, sd;
        if (v > 0.0) sd = length(vec2(dq.x, v)) - r;
        else { vec2 bb = vec2(abs(dq.x) - r, -dq.y); sd = (bb.x > 0.0 && bb.y > 0.0) ? length(bb) : max(bb.x, bb.y); }
        return vec3(g, max(sd, 0.0) + 137.0 * h1, sd);
      }
      // his closest hatching: the band pressed dark from its inner line, one narrow line of paper spared before the next
      float farBand(float n, float sp, float fw){
        float fr = fract(n / sp), w = clamp(fw / sp, 0.004, 0.25);
        float spare = smoothstep(0.74 - w, 0.80 + w, fr) * (1.0 - smoothstep(0.93 - w, 0.97 + w, fr));
        float line = 1.0 - smoothstep(0.0, 0.05 + w, min(fr, 1.0 - fr));
        return max(line * 0.9, (0.97 - 0.22 * fr) * (1.0 - 0.8 * spare));
      }
      void main(){
        vec3 d = normalize(vD + vec3(0.0, 1.0, 0.0));
        vec4 s = vec4(dot(d, uPl[0]) - uOff[0], dot(d, uPl[1]) - uOff[1], dot(d, uPl[2]) - uOff[2], dot(d, uPl[3]) - uOff[3]);
        float s4 = dot(d, uPl[4]) - uOff[4];
        vec4 fw = max(fwidth(s), vec4(1e-5)); float fw4 = max(fwidth(s4), 1e-5);
        vec4 e4 = abs(s) / fw; float e = min(min(min(e4.x, e4.y), min(e4.z, e4.w)), abs(s4) / fw4);
        float id = dot(step(vec4(0.0), s), vec4(1.0, 2.0, 4.0, 8.0)) + 16.0 * step(0.0, s4);
        float h = lhHash(vec2(id * 0.37 + 0.11, 3.7)), h2 = lhHash(vec2(id * 0.61 + 0.2, 9.1));
        // bare pieced paper: fourteen sheets in the two tans, a paste stain and a pencilled edge along every seam
        vec3 c = mix(uTan, uTan2, step(0.52, h) * (0.45 + 0.5 * h2));
        c = mix(c, uTan2, uOld * 0.55);
        c = mix(c, uTan2, 0.7 * (1.0 - smoothstep(2.0, 9.0, e)));
        c = mix(c, uGraph, 0.5 * (1.0 - smoothstep(0.6, 1.6, e)));
        // the last rank, drawn on the sheets
        float rr = max(length(d.xz), 0.05);
        float az = atan(d.x, (abs(d.x) + abs(d.z)) < 1e-5 ? 1.0 : d.z);
        vec2 q = vec2(az * RS, RS * d.y / rr);
        float fm = RS * max(length(fwidth(d)), 1e-6) * 0.75 / (rr * rr);           // metres of the shell to a pixel
        float ca = floor(q.x / CW), cb = floor(q.x / CW - 0.5);
        float na = ca + (fract(q.x / CW) > 0.5 ? 1.0 : -1.0), nb = cb + (fract(q.x / CW - 0.5) > 0.5 ? 1.0 : -1.0);
        float pa = mod(ca, 2.0), pb = mod(cb, 2.0);                               // even mounds stand in front of odd ones
        vec3 m0 = farMound(q, pa < 0.5 ? ca : na, 0.0), m1 = farMound(q, pa < 0.5 ? na : ca, 0.0);
        vec3 m2 = farMound(q, pb < 0.5 ? cb : nb, 1.0), m3 = farMound(q, pb < 0.5 ? nb : cb, 1.0);
        vec3 mm = m0.x > 0.0 ? m0 : (m1.x > 0.0 ? m1 : (m2.x > 0.0 ? m2 : m3));
        if (mm.x > 0.0 && d.y > -0.05) {
          float n = mm.y + 26.0 * (lhNoise(q * 0.0021) - 0.5) + 9.0 * (lhNoise(q * 0.011 + 3.0) - 0.5);
          float L = clamp(log2(fm * 6.5 / 45.0), 0.0, 3.0), l0 = min(floor(L), 2.0), k = smoothstep(0.2, 0.8, L - l0);
          float sp = 45.0 * exp2(l0);
          float cov = mix(farBand(n, sp, fm), farBand(n, sp * 2.0, fm), k);
          float run = smoothstep(0.1, 0.95, sin((n - uTime * 70.0) * 0.0041 + 1.7 * sin(n * 0.0009)));   // the rub still travelling out from the arch
          cov *= 0.93 + 0.07 * run;
          float fl = smoothstep(0.66, 0.84, lhNoise(q * 0.021) * 0.6 + lhNoise(q * 0.047 + 7.1) * 0.4);   // paper tooth through the graphite
          cov *= 1.0 - 0.36 * fl * (1.0 - smoothstep(9.0, 22.0, fm));
          float lw = max(7.0, 1.6 * fm);
          cov = max(cov, clamp((lw - mm.x) / fm + 0.5, 0.0, 1.0));                // the mound's own outline
          cov = mm.z < 0.0 ? 1.0 : cov;
          c = mix(c, mm.z < 0.0 ? uBlack : uGraph, cov);                          // its seed arch is a mouth: pressed black
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(5200, 32, 16), skyMat);
    sky.position.set(0, 0, 780); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();
    // ---- stages and stags: one material. aWax: 0 paper wall, 1 striped stage floor, 2 curtain of ruled lines,
    // 3 scalloped border, 4 ruled body (uv.y 1 = outline), 5 a ruled limb, 6 antler fan of scalloped arcs.
    // aPiv = (pivot y, pivot z, kind): 1 / 2 legs scissoring, 3 the neck, head and antlers, 4 a curtain swaying (x = amount).
    const figMat = (un) => new THREE.ShaderMaterial({
      uniforms: { ...LU, uLeg: { value: 0 }, uHead: { value: 0 }, ...un }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute float aN; attribute float aWax; attribute vec3 aPiv; uniform float uLeg, uHead, uTime;
        varying vec3 vP; varying vec2 vUv; varying float vN; varying float vWax;
        void main(){ vec3 p = position; float k = aPiv.z;
          float ang = k < 0.5 ? 0.0 : (k < 1.5 ? uLeg : (k < 2.5 ? -uLeg : (k < 3.5 ? uHead : 0.0)));
          if (k > 3.5) p.z += aPiv.x * sin(uTime * 1.3 + p.y * 0.7 + position.z * 0.3) * 0.3;
          else { vec2 d = vec2(p.z - aPiv.y, p.y - aPiv.x); float c = cos(ang), s = sin(ang); p.z = aPiv.y + d.x * c - d.y * s; p.y = aPiv.x + d.x * s + d.y * c; }
          vP = position; vUv = uv; vN = aN; vWax = aWax; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */`varying vec3 vP; varying vec2 vUv; varying float vN; varying float vWax;` + STYLE_GLSL + /* glsl */`
        float ln(float d, float w, float fw){ float lw = max(w, 0.8 * fw); return clamp((lw - d) / max(fw, 1e-4) + 0.5, 0.0, 1.0) * min(1.0, 1.5 * w / lw); }
        void main(){
          vec2 suv = lhSuv(vP); float fws = length(fwidth(suv)) * 0.7, tooth = lhTooth(suv, fws);
          vec3 c = uTan; float g = 0.0;
          if (vWax < 0.5) { float q = vUv.x / 0.6, fq = max(fwidth(q), 1e-4), f = fract(q);          // the niche's inside: ruled close and rubbed dark
            g = max(ln(min(f, 1.0 - f), 0.1, fq), 0.34 + 0.46 * (1.0 - f)); g = mix(g, 0.6, smoothstep(0.3, 0.6, fq)); }
          else if (vWax < 1.5) {
            float q = vUv.x / (1.0 - 0.5 * vUv.y) * vN, fq = max(fwidth(q), 1e-4), f = fract(q), m = mod(floor(q), 2.0);
            vec3 wx = lhWax(uOchre, uTan, f, 1.0, vUv.y * 9.0, suv, fq, fws);
            c = mix(m < 0.5 ? wx : uTan, mix(uTan, uOchre, 0.5), smoothstep(0.3, 0.6, fq));
            g = max(ln(min(f, 1.0 - f), 0.09, fq), m < 0.5 ? 0.0 : (1.0 - f) * (1.0 - f) * 0.4) * (1.0 - smoothstep(0.3, 0.6, fq)) + 0.2 * smoothstep(0.3, 0.6, fq);
          } else if (vWax < 2.5) {
            float q = vUv.x * vN, fq = max(fwidth(q), 1e-4), f = fract(q);
            g = max(ln(min(f, 1.0 - f), 0.1, fq), (1.0 - f) * (1.0 - f) * 0.5);
            g = mix(g, 0.3, smoothstep(0.3, 0.6, fq));
          } else if (vWax < 3.5) {
            vec2 q = vec2(fract(vUv.x / 1.1) - 0.5, (1.0 - vUv.y) * vN / 1.1); float d = 0.5 - length(q), fd = max(fwidth(vUv.x / 1.1), 1e-4);
            if (d < 0.0) discard;
            g = max(max(ln(d, 0.05, fd), ln(abs(d - 0.2), 0.035, fd) * 0.7), max(0.0, 1.0 - d / 0.2) * 0.4);
          } else if (vWax < 4.5) {
            float q = vUv.x / 0.42, fq = max(fwidth(q), 1e-4), f = fract(q), fo = max(fwidth(vUv.y), 1e-4);
            g = max(ln(min(f, 1.0 - f), 0.11, fq), (1.0 - f) * (1.0 - f) * 0.55);
            g = mix(g, 0.32, smoothstep(0.3, 0.6, fq));
            g = max(g, clamp((vUv.y - 0.9) / fo + 0.5, 0.0, 1.0));
          } else if (vWax < 5.5) {
            float e = min(vUv.y, 1.0 - vUv.y) * vN, fe = max(fwidth(vUv.y) * vN, 1e-4);
            g = max(ln(e, 0.085, fe), (1.0 - vUv.y) * (1.0 - vUv.y) * 0.5);
          } else {
            vec2 q = vUv - vec2(0.0, -1.0); float r = length(q) * 0.5 + 1e-4, a = atan(q.x, max(q.y, 1e-4)), fr = max(fwidth(r), 1e-4);
            float rs = r - 0.03 * abs(sin(a * 11.0));
            float arcs = max(max(ln(abs(rs - 0.42), 0.055, fr), ln(abs(rs - 0.66), 0.055, fr)), ln(abs(rs - 0.9), 0.06, fr)) * step(abs(a), 0.62);
            float beam = ln(abs(abs(a) - 0.62) * r, 0.05, fr) * step(r, 0.93);
            if (abs(a) > 0.66 || rs > 0.95) discard;                              // a fan of bare paper, its arcs and beams in pencil
            float bd = fract((rs - 0.18) / 0.24), rubA = (1.0 - bd) * (1.0 - bd) * 0.55 * step(0.18, rs);   // each band rubbed beside its inner arc
            g = max(max(arcs, beam), max(ln(0.95 - rs, 0.06, fr), rubA));
          }
          g *= mix(0.7, 1.0, smoothstep(0.2, 0.6, tooth + g * 0.5));
          gl_FragColor = vec4(mix(c, uGraph, clamp(g, 0.0, 1.0)), 1.0);
        }`,
    });
    const figGeo = () => { const G = new Geo(), piv = []; return { G, piv,
      quad(pv, a, b, c, d) { G.quad(a, b, c, d); for (let i = 0; i < 6; i++) piv.push(pv[0], pv[1], pv[2]); },
      tri(pv, a, b, c) { G.tri(a, b, c); for (let i = 0; i < 3; i++) piv.push(pv[0], pv[1], pv[2]); },
      build() { const g = G.build(); g.setAttribute('aPiv', new THREE.Float32BufferAttribute(piv, 3)); return g; } }; };
    // the three stage niches behind their arches: striped floor, paper walls, drawn curtains, a scalloped front
    const SG = figGeo(), N0 = [0, 0, 0];
    const stageF = [];                                             // each stage's frame: its face centre and facing
    const altarM = { p: [hero.altar.p[0], hero.altar.p[1], hero.altar.p[2] + 900], n: hero.altar.n, r: hero.altar.r, leg: hero.altar.leg };   // the rider's niche in the hall's far wall
    [[moundMouth(st1, 0, 5, 4), [nicheM[0]], 10.5, st1.face - 0.5, 6.6], [moundMouth(st2, 0, 5, 4), nicheM.slice(1, 6), 27, st2.face - 0.5, 6.6], [moundMouth(st3, 0, 5, 4), [nicheM[6]], 10.5, st3.face - 0.5, 6.6],
      [altarM, [altarM], 16.5, 28.5, 11], [moundMouth(st4, 0, 5, 4), [st4M], 10.5, st4.face - 0.5, 6.6], [st5M, [st5M], 12.5, 20.5, 9],
      [wingM[0], [wingM[0]], 7.7, 12.3, 8.5], [wingM[1], [wingM[1]], 7.7, 12.3, 8.5]].forEach(([F, ms, hw, top, D]) => {
      stageF.push(F);
      const P = (a, y, t, u, v, n, w) => { const q = mpt(F, a, y, t); return [q[0], q[1], q[2], u, v, n, w]; };
      SG.quad(N0, P(-hw, 0.03, -0.4, -1, 0, hw / 2.2, 1), P(hw, 0.03, -0.4, 1, 0, hw / 2.2, 1), P(hw, 0.03, D, 1, 1, hw / 2.2, 1), P(-hw, 0.03, D, -1, 1, hw / 2.2, 1));
      SG.quad(N0, P(-hw, 0, D, -hw, 0, 0, 0), P(hw, 0, D, hw, 0, 0, 0), P(hw, top, D, hw, 1, 0, 0), P(-hw, top, D, -hw, 1, 0, 0));
      for (const a of [-hw, hw]) SG.quad(N0, P(a, 0, 0.2, 0.2, 0, 0, 0), P(a, 0, D, D, 0, 0, 0), P(a, top, D, D, 1, 0, 0), P(a, top, 0.2, 0.2, 1, 0, 0));
      SG.quad(N0, P(-hw, top, 0.2, -hw, 0.6, 0, 0), P(hw, top, 0.2, hw, 0.6, 0, 0), P(hw, top, D, hw, 0.6, 0, 0), P(-hw, top, D, -hw, 0.6, 0, 0));
      SG.quad(N0, P(-hw, -0.8, -0.45, 0, 0, 0.95, 3), P(hw, -0.8, -0.45, 2 * hw, 0, 0.95, 3), P(hw, 0.15, -0.45, 2 * hw, 1, 0.95, 3), P(-hw, 0.15, -0.45, 0, 1, 0.95, 3));
      for (const m of ms) for (const sg of [-1, 1]) {               // a curtain each side, tied back at the foot
        const T = m.leg + m.r, NS2 = 8, oe = m.r + 0.8;
        const inner = (y) => m.r * (1 - 0.6 * Math.pow(y / T, 2.4)) - 0.5, wgt = (y) => 0.25 + 0.75 * Math.max(0, 1 - Math.abs(y / T - 0.55) * 1.8);
        const C = (a, y, u) => { const q = mpt(m, sg * a, y + 0.1, 0.7); return [q[0], q[1], q[2], u, y, 7, 2]; };
        for (let i = 0; i < NS2; i++) { const ya = (T * i) / NS2, yb = (T * (i + 1)) / NS2;
          SG.quad([0, 0, 4], C(oe, ya, 0), C(inner(ya), ya, 1), C(inner(yb), yb, 1), C(oe, yb, 0));
          const L = SG.piv.length; SG.piv[L - 15] = wgt(ya); SG.piv[L - 12] = wgt(yb); SG.piv[L - 6] = wgt(yb);   // only the free edge sways
        }
      }
    });
    for (const [xa, xb] of [[-5.6, 19], [35, 61.6]]) { const z = EXZ + 0.25, n = Math.round((xb - xa) / 3), wd = (xb - xa) / n;   // the balcony's lip: a scalloped border standing along it
      SG.quad(N0, [xa, EXY, z, 0, 1, 1.1 * 1.6 / wd, 3], [xb, EXY, z, n * 1.1, 1, 1.1 * 1.6 / wd, 3], [xb, EXY + 1.6, z, n * 1.1, 0, 1.1 * 1.6 / wd, 3], [xa, EXY + 1.6, z, 0, 0, 1.1 * 1.6 / wd, 3]); }
    const stageMesh = new THREE.Mesh(SG.build(), figMat({})); stageMesh.frustumCulled = false; scene.add(stageMesh);
    await ctx.yield();
    // a stag: profile cut-out, 5 m at the shoulder, body of ruled stripes, four stiff legs, antlers of scalloped arcs
    const stagGeo = (antlers) => {
      const F = figGeo(), NK = [4.4, 2.2, 3];
      const fan = (pv, cz, cy, poly) => { for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; F.tri(pv, [0, cy, cz, cz, 0, 0, 4], [0, a[1], a[0], a[0], 1, 0, 4], [0, b[1], b[0], b[0], 1, 0, 4]); } };
      fan(N0, -0.1, 3.9, [[-2.5, 3.9], [-2.68, 4.5], [-2.3, 5.0], [-1.2, 5.1], [0.2, 4.95], [1.6, 5.1], [2.5, 4.95], [2.8, 4.2], [2.55, 3.3], [1.8, 2.72], [0.6, 2.9], [-0.6, 3.15], [-1.6, 3.0], [-2.3, 3.2]]);
      [[-2.05, 1], [-1.5, 2], [1.55, 2], [2.05, 1]].forEach(([z, k]) => F.quad([3.0, z, k], [0.01 * k, 3.1, z - 0.26, 3.1, 0, 0.5, 5], [0.01 * k, 3.1, z + 0.26, 3.1, 1, 0.5, 5], [0.01 * k, 0, z + 0.22, 0, 1, 0.5, 5], [0.01 * k, 0, z - 0.22, 0, 0, 0.5, 5]));
      F.quad(NK, [0.02, 4.85, 1.7, 0, 0, 1.0, 5], [0.02, 3.8, 2.6, 0, 1, 1.0, 5], [0.02, 5.4, 3.7, 1.6, 1, 1.0, 5], [0.02, 6.05, 2.95, 1.6, 0, 1.0, 5]);
      fan(NK, 3.75, 5.75, [[2.85, 6.05], [3.35, 6.3], [4.1, 6.02], [4.95, 5.42], [4.9, 5.08], [4.0, 5.12], [3.1, 5.3]]);
      F.tri(NK, [0.03, 6.2, 3.0, 0, 0, 0.3, 5], [0.03, 6.25, 3.3, 0, 1, 0.3, 5], [0.03, 6.75, 2.85, 0.5, 0.5, 0.3, 5]);   // an ear
      F.quad(N0, [0.02, 4.7, -2.75, 0, 0, 0.26, 5], [0.02, 4.7, -2.49, 0, 1, 0.26, 5], [0.02, 3.8, -2.6, 0.9, 1, 0.26, 5], [0.02, 3.8, -2.86, 0.9, 0, 0.26, 5]);
      if (antlers) for (const [tilt, dx] of [[-0.5, -0.03], [0.32, 0.04]]) { const bz = 3.3, by = 6.1, s = 1.42, c = Math.cos(tilt), sn = Math.sin(tilt);
        const P = (u, v) => [dx, by + (v + 1) * s * c - u * s * sn, bz + u * s * c + (v + 1) * s * sn, u, v, 0, 6];
        F.quad(NK, P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)); }
      return F.build();
    };
    const stagMats = [figMat({}), figMat({}), figMat({}), figMat({})], stags = [];
    const stagAt = (i, a) => { const F = stageF[i], q = mpt(F, a, 0.03, 3.1); stags[i].position.set(q[0], q[1], q[2]); };
    [-1, 1, 1].forEach((dir, i) => { const m = new THREE.Mesh(stagGeo(!hinds), stagMats[i]), F = stageF[i];
      m.rotation.y = Math.atan2(-F.n[1], F.n[0]); m.scale.set(1, 1.08, 1.08 * dir); m.frustumCulled = false; scene.add(m); stags.push(m); });
    stagAt(0, -1.0); stagAt(1, 20.8); stagAt(2, 1.0);
    { const m = new THREE.Mesh(stags[0].geometry, stagMats[3]), F = stageF[4], q = mpt(F, 0.6, 0.03, 3.1);      // the stag of the fourth stage
      m.rotation.y = Math.atan2(-F.n[1], F.n[0]); m.scale.set(1, 1.08, 1.08); m.position.set(q[0], q[1], q[2]); m.frustumCulled = false; scene.add(m); }
    // the rider of the nave's altar: an original cut-out in his manner, horse and horseman in profile, ruled stripes, no face
    const riderGeo = () => {
      const F = figGeo(), NK = [4.4, 2.2, 3];
      const fan = (pv, x, cz, cy, poly) => { for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; F.tri(pv, [x, cy, cz, cz, 0, 0, 4], [x, a[1], a[0], a[0], 1, 0, 4], [x, b[1], b[0], b[0], 1, 0, 4]); } };
      const limb = (pv, x, z0, y0, z1, y1, w) => { const dz = z1 - z0, dy = y1 - y0, L = Math.hypot(dz, dy) || 1, nz = (-dy / L) * w / 2, ny = (dz / L) * w / 2;
        F.quad(pv, [x, y0 - ny, z0 - nz, 0, 0, w, 5], [x, y0 + ny, z0 + nz, 0, 1, w, 5], [x, y1 + ny, z1 + nz, L, 1, w, 5], [x, y1 - ny, z1 - nz, L, 0, w, 5]); };
      fan(N0, 0, -0.1, 3.9, [[-2.5, 3.6], [-2.75, 4.4], [-2.4, 5.0], [-1.2, 5.15], [0.2, 4.9], [1.5, 5.2], [2.5, 5.1], [2.85, 4.3], [2.6, 3.3], [1.8, 2.75], [0.6, 2.95], [-0.6, 3.1], [-1.6, 2.95], [-2.3, 3.1]]);
      [[-2.1, 1], [-1.5, 2], [1.6, 2], [2.15, 1]].forEach(([z, k]) => limb([3.0, z, k], 0.02 * k, z, 3.15, z, 0, 0.58));
      limb(N0, 0.02, -2.7, 4.75, -3.35, 2.3, 0.5);                                   // the tail
      F.quad(NK, [0.03, 4.95, 1.7, 0, 0, 1.0, 5], [0.03, 3.8, 2.7, 0, 1, 1.0, 5], [0.03, 5.45, 3.8, 1.6, 1, 1.0, 5], [0.03, 6.25, 2.95, 1.6, 0, 1.0, 5]);
      fan(NK, 0.04, 3.9, 5.7, [[2.9, 6.2], [3.4, 6.45], [4.0, 6.15], [5.0, 5.25], [5.1, 4.8], [4.6, 4.7], [3.9, 5.0], [3.1, 5.25]]);
      F.tri(NK, [0.05, 6.35, 3.0, 0, 0, 0.3, 5], [0.05, 6.4, 3.3, 0, 1, 0.3, 5], [0.05, 6.95, 2.9, 0.5, 0.5, 0.3, 5]);
      limb(N0, 0.05, 0.25, 5.2, 0.95, 2.95, 0.55); limb(N0, 0.06, 0.8, 2.95, 1.6, 2.9, 0.34);   // the rider's leg and foot
      fan(N0, 0.07, 0.1, 6.2, [[-0.75, 5.0], [0.8, 5.0], [0.95, 7.3], [0.1, 7.55], [-0.7, 7.3]]);
      limb(N0, 0.09, 0.45, 7.0, 1.95, 5.95, 0.36); limb(NK, 0.06, 1.95, 5.95, 4.4, 5.2, 0.13);  // arm and rein
      { const c = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.2832; c.push([0.15 + 0.52 * Math.cos(a), 8.05 + 0.52 * Math.sin(a)]); } fan(N0, 0.08, 0.15, 8.05, c); }
      limb(N0, 0.1, -1.0, 8.52, 1.35, 8.52, 0.22);                                    // the brim of his hat, and its crown
      fan(N0, 0.09, 0.15, 8.9, [[-0.42, 8.6], [0.72, 8.6], [0.5, 9.3], [-0.2, 9.3]]);
      return F.build();
    };
    const riderMat = figMat({}), rider = new THREE.Mesh(riderGeo(), riderMat);
    { const q = mpt(altarM, 0.5, 0.05, 4.6); rider.position.set(q[0], q[1], q[2]); rider.rotation.y = Math.atan2(-altarM.n[1], altarM.n[0]); rider.scale.set(2.4, 2.4, 2.4); rider.frustumCulled = false; scene.add(rider); }
    { const m = new THREE.Mesh(rider.geometry, riderMat), q = mpt(st5M, -0.6, 0.05, 4.4);                      // and the rider of the tower, riding the other way
      m.position.set(q[0], q[1], q[2]); m.rotation.y = Math.atan2(-st5M.n[1], st5M.n[0]); m.scale.set(1.8, 1.8, -1.8); m.frustumCulled = false; scene.add(m); }

    { const F = wingM[0], q = mpt(F, 0.3, 0.05, 4.2), m = new THREE.Mesh(rider.geometry, riderMat);            // the exit's rider, turned to the opening
      m.position.set(q[0], q[1], q[2]); m.rotation.y = Math.atan2(-F.n[1], F.n[0]); m.scale.set(1.12, 1.12, -1.12); m.frustumCulled = false; scene.add(m); }
    { const F = wingM[1], q = mpt(F, 0.4, 0.05, 4.2), m = new THREE.Mesh(stags[0].geometry, stagMats[3]);       // and its stag, turned to the opening from the other side
      m.position.set(q[0], q[1], q[2]); m.rotation.y = Math.atan2(-F.n[1], F.n[0]); m.scale.set(1, 1.36, 1.36); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();
    // ---- flora: tuft mounds (a hill in small: nested arcs round a black dot) and spade-leaf trees, thinned by detail
    const fl = rng.fork('flora');
    const colOf = (x) => { let c = 0; while (c < NCOL - 1 && xs[c + 1] <= x) c++; return c; };
    const groundH = (x, z) => { let i = 0; while (i < NS - 1 && sz(i + 1, x) <= z) i++; return GH[i][colOf(x)]; };
    const nearM = [gate, st1, st2, st3, st4, st5, P1, P2, S1, S2, last, Q1, Q2, ...MID];
    const lowX = (z) => -3 - (2 * BRP - 33) * smoothstep(1400, ZM - 15, z);
    const branchPts = []; for (let s = -10; s < BARC + 260; s += 5) { branchAt(s, o); branchPts.push([o.p.x, o.p.z]); }
    const blocked = (x, z, m) => {
      for (const q of nearM) { const cs = Math.cos(q.rot || 0), sn = Math.sin(q.rot || 0), dx = x - q.x, dz = z - q.z; if (Math.abs(cs * dx - sn * dz) < q.W + m && Math.abs(sn * dx + cs * dz) < q.D / 2 + m) return true; }
      const bw = 55 * (x / 350) * (x / 350);
      if (Math.abs(x) < 352 && z > 616 + bw && z < 1184 - bw) return true;
      if (z < 622 && Math.abs(x + 3) < 8.4 + m) return true;
      if (Math.abs(z - BRZ - 1) < 6 + m && Math.abs(x - 30) < 5.6 * BRP) return true;        // the bridge at the last mound's foot
      if (z > 1170 && z < 1432 && Math.abs(x - 27) < 10 + m) return true;
      if (z > 1404 && (Math.abs(x - 30) < 4 + m || Math.abs(x - expX(z)) < 4 + m)) return true;
      if (z > 1170 && Math.abs(x - lowX(z)) < 8.4 + m) return true;
      for (const b of branchPts) if (Math.abs(b[0] - x) < 3.6 + m && Math.abs(b[1] - z) < 3.6 + m) return true;
      return path.distanceTo(x, 2, z) < 7 + m;
    };
    const tufts = [], trees = [];
    const tuft = (x, z, s) => { if (!blocked(x, z, s * 0.8)) tufts.push([x, z, s, fl()]); };
    for (let z = -70; z < ZM - 4; z += fl.range(5, 9)) {                        // rows along the line, the nearest 7 m from the eye
      if (z > 600 && z < 1404) continue;
      const ex = z < 900 ? 0 : 30;
      tuft(ex + (z < 262 || z > 900 ? 7.6 : 10.6) + fl.range(-0.4, 0.4), z, fl.range(1, 2.1)); tuft(ex - (z > 900 ? 9 : 12.9) + fl.range(-0.4, 0.4), z + 3, fl.range(1, 2.1));
    }
    for (let i = 0; i < seams.length; i++) {                                  // rows along the seams
      if (seams[i] < -160 || seams[i] > 1800) continue;
      for (let x = -190 + fl.range(0, 8); x < 190; x += fl.range(6, 12)) tuft(x, sz(i, x) + 1.2, fl.range(1, 3));
      if (i % 6 === 5) await ctx.yield();
    }
    await ctx.yield();
    const tree = (x, z, h) => { if (!blocked(x, z, 1.5) && !(z > ZM - 40 && Math.abs(x - 30) < 1.6 * BRP)) trees.push([x, z, h, fl()]); };   // none before the exit's three arches
    const pairAt = (m, d) => { for (const sg of [-1, 1]) { const p = mpt(m, sg * (m.r + d), 0, -3.5); tree(p[0], p[2], fl.range(5.5, 9)); } };
    for (const m of [gateF, gateB, hm[1], hm[10]]) pairAt(m, 5.5);
    for (const m of [...flankM, ...backM2, hm[0], hm[2], hm[11]]) pairAt(m, 5);
    for (const m of [nicheM[0], nicheM[6], st4M]) pairAt(m, 3.4);
    for (const a of [-29.5, 29.5]) { const q = mpt(stageF[1], a, 0, -3.5); tree(q[0], q[2], fl.range(6.5, 9)); }
    for (let z = 1408; z < ZM - 8; z += 14) { tree(39.5, z, fl.range(8, 11)); tree((expX(z) + lowX(z) + 4.7) / 2, z + 5, fl.range(7, 10)); tree(-9 + lowX(z) - 3, z + 8, fl.range(7, 10)); }   // an avenue down the last straight
    for (let z = 20; z < 140; z += 24) { tree(11, z, fl.range(6, 9)); tree(-17, z + 10, fl.range(6, 9)); }
    for (let i = 0; i < 110; i++) { const z = fl.range(-120, 1700), x = fl.range(-150, 150); tree(x, z, fl.range(5.5, 10)); }
    for (const sg of [-1, 1]) { const p = mpt(hm[1], sg * 15, 0, -8); if (!blocked(p[0], p[2], 1.5)) trees.push([p[0], p[2], 12, 0.37]); }   // two tall leaf trees flank the mountain's line mouth
    const keep = clamp(detail * density, 0.5, 1.2);
    const tuftsK = tufts.filter((t) => path.distanceTo(t[0], 2, t[1]) < 30 || t[3] < 0.75 * keep).slice(0, Math.round(520 * keep));
    { const q = mpt(stageF[2], -4.1, 0.4, 3.1); tuftsK.push([q[0], q[2], 1.25, 0.5]); }      // the tuft stag three bends to
    const treesK = trees.filter((t, i) => i < 92 || t[3] < 0.8 * keep);
    const FLN = /* glsl */`float ln(float d, float w, float fw){ float lw = max(w, 0.8 * fw); return clamp((lw - d) / max(fw, 1e-4) + 0.5, 0.0, 1.0) * min(1.0, 1.5 * w / lw); }`;
    const tuftMat = new THREE.ShaderMaterial({ uniforms: LU,
      vertexShader: /* glsl */`varying vec3 vL; void main(){ vL = position; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`varying vec3 vL;` + STYLE_GLSL + FLN + /* glsl */`
        void main(){ float n = length(vL - vec3(0.0, 0.0, 1.0)), q = n * 2.7 + 0.35, fq = max(fwidth(q), 1e-4), f = fract(q);
          float run = 0.8 + 0.4 * smoothstep(0.1, 0.9, sin(uTime * 0.8 + vL.x * 3.0 + n * 4.0));
          float g = max(ln(min(f, 1.0 - f), 0.1, fq), (1.0 - f) * (1.0 - f) * 0.62 * run);
          g = mix(g, 0.32, smoothstep(0.3, 0.6, fq));
          vec3 c = mix(uTan, uGraph, clamp(g, 0.0, 1.0));
          if (n < 0.12) c = uBlack;
          gl_FragColor = vec4(c, 1.0); }` });
    const tuftMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2), tuftMat, Math.max(1, tuftsK.length));
    const q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    tuftsK.forEach((t, i) => { const ex = t[1] < 900 ? 0 : 30, sg = Math.sign(t[0] - ex) || 1;
      e3.set(0, Math.atan2(-sg * 0.75, -0.66) + (t[3] - 0.5) * 0.5, 0); q4.setFromEuler(e3);
      m4.compose(v3.set(t[0], groundH(t[0], t[1]) - 0.04, t[1]), q4, s3.set(t[2] * 1.3, t[2], t[2] * 1.05)); tuftMesh.setMatrixAt(i, m4); });
    tuftMesh.frustumCulled = false; scene.add(tuftMesh);
    const treeMat = new THREE.ShaderMaterial({ uniforms: LU, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute float aSeed; varying vec2 vUv; uniform float uTime;
        void main(){ vec3 c = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float s = length(instanceMatrix[0].xyz);
          vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
          float rock = sin(uTime * 0.9 + aSeed * 40.0) * 0.045 * position.y * position.y;
          vec3 p = c + right * (position.x + rock) * s + vec3(0.0, position.y * s, 0.0);
          vUv = position.xy; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */`varying vec2 vUv;` + STYLE_GLSL + FLN + /* glsl */`
        void main(){ float x = vUv.x, y = vUv.y, fw = max(fwidth(y), 1e-4);
          float t = clamp((y - 0.7) / 1.27, 1e-4, 1.0);
          float w = 0.45 * pow(max(sin(3.14159 * pow(t, 0.62)), 0.0), 0.85), e = w - abs(x), g = 0.0;
          if (e > 0.0 && y > 0.7) {
            float v = (y - 0.7 - abs(x) * 0.9) / 0.085, fv = max(fwidth(y) / 0.085, 1e-4), f = fract(v), side = x < 0.0 ? 0.62 : 0.14;
            g = max(ln(min(f, 1.0 - f), 0.11, fv), (1.0 - f) * (1.0 - f) * side);
            g = mix(g, side * 0.55 + 0.08, smoothstep(0.3, 0.6, fv));
            g = max(g, max(ln(e, 0.014, fw), ln(abs(x), 0.011, fw)));
          } else { if (y > 0.75 || abs(x) > max(0.02, 0.9 * fw)) discard; g = min(1.0, 0.03 / max(0.02, 0.9 * fw)); }
          gl_FragColor = vec4(mix(uTan, uGraph, clamp(g, 0.0, 1.0)), 1.0); }` });
    const treeG = new THREE.PlaneGeometry(1, 2); treeG.translate(0, 1, 0);
    const treeMesh = new THREE.InstancedMesh(treeG, treeMat, Math.max(1, treesK.length));
    treeG.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(treesK.map((t) => t[3])), 1));
    treesK.forEach((t, i) => { m4.makeScale(t[2] / 2, t[2] / 2, t[2] / 2).setPosition(t[0], groundH(t[0], t[1]) - 0.05, t[1]); treeMesh.setMatrixAt(i, m4); });
    treeMesh.frustumCulled = false; scene.add(treeMesh);
    await ctx.yield();
//@@NEXT

    // ---- every frame. Scripted things follow u; only rub runs, smoke loops and sway follow the clock.
    const ring = (r) => (r > 0 && r < 130 ? r : -1);
    let stagEye2 = null;
    const shA = matA.userData.shiver, shB = matB.userData.shiver, shC = matC.userData.shiver;
    function update(dt, time, camera, uNow) {
      const u = UO(uNow), ez = zAt(uNow);                 // u: the first route's u at this place (see the path); ez: the eye's z
      hero.setProgress(u, ez - 900); hero.update(dt, time, camera);
      trains.forEach((T, i) => {
        const s = T.s(u, ez), on = s > T.lo && s < T.hi, k = T.k || 1;
        T.at(s, o); place(engines, i, on, k);
        const E = engState[i]; E.p.copy(o.p); E.f.copy(o.f); E.on = on || (!!T.smk && s >= T.hi && s < T.hi + T.smk); E.v = T.v ?? 1; E.k = k * (T.v ? 0.8 : 1);
        eAttr.setX(i, s / (0.95 * k));
        for (let j = 0; j < T.cars; j++) { const sj = s - T.dir * (9 + j * 7.9) * k; T.at(sj, o); place(cars, T.c0 + j, sj > T.lo && sj < T.hi, k); cAttr.setX(T.c0 + j, sj / (0.78 * k)); }
      });
      const rr = rare ? (u - 0.2) * 672 : -1, e = rare ? smoothstep(0.195, 0.225, u) * (1 - smoothstep(0.31, 0.35, u)) : 0;
      rareAt.forEach((mi, i) => {
        const m = hm[mi], K = mi === 1 ? 1.5 : (m.leg + m.r) / 3.6, k = -3.64 * K + lerp(-5, mi === 1 ? 26 : 2.5, e), idx = trains.length + i;   // each fills its mouth
        o.p.set(m.p[0] + (mi === 1 ? -4 : 0) + m.n[0] * k, m.p[1], m.p[2] + m.n[1] * k); o.f.set(m.n[0], 0, m.n[1]);
        place(engines, idx, e > 0.001, K); eAttr.setX(idx, k / (0.95 * K));
        const E = engState[idx]; E.p.copy(o.p); E.f.copy(o.f); E.on = e > 0.001; E.v = 0.12; E.k = K * 0.8;
      });
      for (let ei = 0; ei < nEng; ei++) { const E = engState[ei];
        for (let k = 0; k < NPUFF; k++) { const a = (k / NPUFF + time * 0.2 + ei * 0.37) % 1, idx = ei * NPUFF + k;
          if (!E.on) { smoke.setMatrixAt(idx, ZERO); continue; }
          const K = E.k || 1, sc = K * (0.7 + 4.6 * a) * Math.min(1, (1 - a) / 0.2, a / 0.06), back = K * (a * 30 * E.v - 2.6);
          m4.makeScale(sc, sc, sc).setPosition(E.p.x - E.f.x * back + Math.sin(a * 9 + ei) * 0.8 * a * K, E.p.y + K * (4.6 + a * (8 + 14 * a) + (1 - E.v) * a * 10), E.p.z - E.f.z * back);
          smoke.setMatrixAt(idx, m4); } }
      const inGate = smoothstep(118, 150, ez);                 // nothing pale hangs in the gate mouth while it is seen from outside
      gWax.uniforms.uEyeZ.value = ez; gWax.uniforms.uShowD.value = lerp(30, 420, smoothstep(96, 150, ez));
      trackMesh.material.uniforms.uEyeZ.value = ez; trackMesh.material.uniforms.uShowD.value = gWax.uniforms.uShowD.value;   // the gate tunnel's drawn floor comes up with its ribs
      blind.scale.y = Math.max(1e-3, 1 - smoothstep(102, 142, ez));
      drift.forEach((d, i) => {
        const a = (d.ph + time * (d.kind ? 0.045 : 0.085)) % 1, env = Math.min(1, a / 0.12, (1 - a) / 0.2);
        if (d.kind) { const sc = (2.2 + 5.5 * a) * env; m4.makeScale(sc, sc, sc).setPosition(d.x + Math.sin(a * 7 + i) * 3, 8 + a * 135, d.z0 + a * 40); }
        else { const z = lerp(d.z1, d.z0, a), sc = (1.0 + 0.9 * Math.sin(a * 3.14159)) * env * (d.z0 < 300 ? inGate : 1); m4.makeScale(sc, sc, sc).setPosition(d.x + Math.sin(a * 11 + i) * 0.8, d.y - (d.tip && z > 1070 ? (z - 1070) * TAN8 : 0), z); }
        smoke.setMatrixAt(nEng * NPUFF + i, m4);
      });
      engines.instanceMatrix.needsUpdate = true; cars.instanceMatrix.needsUpdate = true; smoke.instanceMatrix.needsUpdate = true;
      eAttr.needsUpdate = true; cAttr.needsUpdate = true;
      // the stags: one lifts its head as the gate mound shivers, one paces its five arches beside us, one bends to a tuft
      stagMats[0].uniforms.uHead.value = -0.8 * (1 - smoothstep(0.17, 0.195, u));
      const sz2 = lerp(20.8, -20.8, smoothstep(0.2, 0.297, u));   // across its five arches, to stand in the nearest as we come level
      stagAt(1, sz2); if (stagEye2) stagEye2.copy(stags[1].position).setY(4.6); stagMats[1].uniforms.uLeg.value = 0.42 * Math.sin(sz2 * 2.1 + 1.27);
      stagMats[1].uniforms.uHead.value = 0.05 * Math.sin(sz2 * 4.2);
      stagMats[2].uniforms.uHead.value = -0.85 * smoothstep(0.318, 0.346, u) + 0.03 * Math.sin(time * 1.4);
      stagMats[3].uniforms.uHead.value = -0.25 + 0.25 * Math.sin(time * 0.7); stagMats[3].uniforms.uLeg.value = 0.05 * Math.sin(time * 0.9);
      riderMat.uniforms.uLeg.value = 0.1 * Math.sin(time * 1.1); riderMat.uniforms.uHead.value = 0.07 * Math.sin(time * 0.8 + 1);
      // the shiver: one travelling ripple across a mouth's nine arcs when a train leaves or enters it
      shA(0, ez < 86 ? ring((time * 34) % 190) : ring((ez - 86) * 1.6));
      shA(1, ring((u - 0.166) * 1500)); shA(10, ring((u - 0.165) * 1400)); shC(4, ring((u - 0.165) * 1400));
      hero.shiver(1, rare ? ring(rr) : ring((u - 0.335) * 1400));
      hero.shiver(9, ring((u - 0.72) * 1400)); hero.shiver(10, ring((u - 0.84) * 1400)); hero.shiver(11, rare ? ring(rr) : -1);
      shB(2, ring((u - 0.72) * 1400)); shB(3, ring((u - 0.84) * 1400));
      shB(1, ring((ez - 1350) * 1.25)); shB(0, ring((ez - 1430) * 1.5));
      { const sL = 100 + (ez - 1249) * 0.345; shB(5, ring((sL - 42) * 1.4)); shB(7, ring((sL - (LEDGE.S - 42)) * 1.4)); }
      if (rare) { for (let i = 2; i < 12; i++) if (i !== 10) shA(i, ring(rr)); for (let i = 0; i < 8; i++) if (i !== 4) shC(i, ring(rr)); matF.userData.shiver(0, ring(rr * 3)); }
    }
    update(0, 0, null, 0);
    const stagEye = stags.map((m) => m.position.clone().setY(4.6));   // where the gaze rests on a stag (stag two's follows it)
    stagEye2 = stagEye[1];
    return {
      scene, path, duration: 42,
      pace: (u) => 1.2 - 0.5 * (smoothstep(0.415, 0.465, u) - smoothstep(0.605, 0.655, u)) - 0.2 * smoothstep(0.85, 0.91, u),
      camera: { fov: 62, near: 0.3, far: 7200, lookAhead: 26, sway: 0.25, bank: 0 },
      pois: [
        { at: [0, 150, 790], from: 0.125, to: 0.33, weight: 0.3 },              // the mountain over the valley
        { at: () => stagEye[0], from: 0.13, to: 0.2, weight: 0.32, fade: 0.25 },           // stag one in its arch
        { at: (t, uNow) => { const q = mpt(stageF[1], lerp(20.8, -20.8, smoothstep(0.2, 0.297, UO(uNow))), 0.03, 3.1); return stagEye[1].set(q[0], 4.6, q[2]); }, from: 0.236, to: 0.286, weight: 0.4 },   // stag two, pacing to the nearest arch of its stage: its place is worked out here from u by update's own rule, so the look never waits a frame for update
        { at: [-19, 5, 612], from: 0.303, to: 0.36, weight: 0.7, fade: 0.3 },      // along tier one's train to the arcade at the mountain's foot
        { at: [-7, 128, 1200], from: 0.395, to: 0.575, weight: 0.86, fade: 0.16 },
        { at: [-2, 74, 1022], from: 0.56, to: 0.632, weight: 0.55, fade: 0.3 },   // the rider in the altar niche as we come level with it   // the nave: the gaze held level on the far wall while the eye climbs, so piers stand upright
        { at: [21, 5, ZM], from: 0.64, to: 0.89, weight: 0.3 },
        { at: [24, 70, ZM + 40], from: 0.735, to: 0.865, weight: 0.5, fade: 0.3 },   // down the falling viaduct the gaze is lifted to the country and the last mound, off the deck                 // the twin mouth, down the tipping tunnel
      ],
      portal: { shape: 'arch', width: 13, height: 9.5, color: '#D8C39B', glow: 0.15, revealDistance: 520, blendDistance: 30, veil: '#DCAA3C' },   // until the next world shows, the opening is one flat disc of lamp ochre
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() {},
    };
  },
};
