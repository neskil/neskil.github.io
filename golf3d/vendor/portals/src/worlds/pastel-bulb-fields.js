// STRIPES OF APRIL (pastel-bulb-fields): bulb country in soft pastel on toothed black paper, seen from a flower
// barge on a raised canal. Everything visible is made from ONE makeStyle instance (src/parts/pastel-bulb-fields.js):
// side-strokes, dabs and smears on black paper meshes; nothing is lit, fogged or bloomed. World frame: entry at
// the origin heading +Z, water at y 0, eye 3.2 m above it, wind toward -Z. The hero (the polder under the cumulus)
// is placed with its origin at the 252 m point of the path, turned -130 degrees.
// Second polish (the flight leaves the canal): we ride the barge to the first mill; where the canal bends away we go straight on
// over its right bank and swoop down into the polder between the embankment and the mill dyke, fly a long passage 1.6 m over
// the floor along a ditch between rows of BIG SEPARATE TULIPS (stem, two leaves, a cup of two strokes and a pale one), past
// baskets, pickers and a cart, with the second mill and the row of dyke mills ahead, then lift past an avenue of poplars back
// over the embankment (the cream barge passing below) to the white bridge and the ring. `canal` is the canal's own line (the
// old path); `path` is the flight. Our barge's heap is a small bobbing thing at the foot of the frame and is gone after the mill.
// Polish round: the willow row ends at 60 m; at 84 m a lane crosses the canal on a yellow single-leaf drawbridge that we pass
// under (LANE), with a hand cart at the ramp foot and seven pickers bending in the stripes beyond it; the first mill's tower
// is drawn (hero opts millLit / millShade / millBrick by the hour); the band of bare paper is a bar 130 to 230 m ahead at
// the reveal, with the stripes resuming beyond it.
// Third polish (the picture, not the list): the low passage runs 2.6 m over the floor between tulips whose cups are notched eggs,
// planted wider beside the lens; the lift begins earlier and stands off the flank, so at u 0.79 we are level with the bank top
// looking at an avenue of five poplars on the far bank, the bridge and the ring (the flank beside it is stroked down its slope);
// each pier has one broad lavender stroke clear of its box; ducks are compact birds and lapwing small bent ticks low over the
// rows; the stripes of leg one bow with one slow wave of the arm (waver) instead of being ruled.
// Fourth polish (a change of event, and a value order). (1) NO CLOUD SHADOW ON THE BARGE: we enter in full colour and stay in
// full colour; cloud shadows are small patches of bare paper drifting on the far polder and nothing else. THE EVENT OF THE FIRST
// THIRD IS THE FIRST MILL: we pass close under its cloth sails, and the shadows of the four blades turn on the bank beside us
// (style.U.uBlade, set by the hero): BIG SINGLE TULIPS stand there (BANK, below), and each of their strokes goes to bare paper
// as a blade's bar crosses it and is stroked back as it passes, four bars in six and a half seconds. The rare visit is no
// longer a shadow over the whole polder: it is THE GREAT SKEIN, a hundred white geese in three chevrons that come over our
// heads at the mill and fly down the row of mills toward the cumulus. (2) THE SKY SITS BACK (parts: thin scumble, the hour's
// rose and orange kept to a low band, a cumulus of separate strokes), the flank of the lift is ragged grass (mesh rag 1), the
// yellow drawbridge is a stocky gate with a paper frame, pickers are bent figures and baskets hold bunches, the swoop is steeper, and two
// kites fly over the polder right of the second mill.
// Coverage round (the world as outside reviewers see it, twelve small stills): THE FIELDS ARE SOLID BANDS OF FLOWER COLOUR drawn
// by band floors (the hero's for the polder, one here for leg one), black paper only as ditch lines, the canal's edges and
// under things; the sky is one calm lay of blue with a pale low band; clouds are whole white bodies; dykes, banks and ramps
// are grassed green bodies with a rose verge; the canal is a solid band of water with white and lavender strokes sliding on
// it. Our own heap is out of the view. The yellow drawbridge stands at 108 m on the LEFT bank (whole in frame from the
// willows, clear of the mill); as the first mill comes abeam the gaze goes to the polder (no tower cut by the frame edge);
// pickers stand in the rows beside the lens with baskets at arm's length; the poplars are full trees; the cream barge is
// still ahead on its canal with its reflection as we come over the bank; the ring stands between two white towers (solid far off and at night; since the ninth drawn in boards near the gate).
// Sixth round (the picture is drawn, not filled): THE SKY HAS A TOP: a closed lay of blue low, then separate side-strokes leaning
// up to the right with black paper between them, widening to bare paper at the top (parts: SKY_FRAG). From the reveal ONE BAND
// OF BARE PAPER (cloud 1) lies across the polder right of the mill dyke and comes down the wind; it is keyed to the distance
// flown as well as to time, is stroked back in before the lane and struck again upwind after it. The heron rows across in front
// of it. The lane's tulips stand on paper and grow toward the eye; grassed bodies are strokes pulled down their slope; the kites
// are diamonds with a cross spar and a tail of presses; the bridge towers are white from the polder floor (ninth: in boards near the gate), and the cumulus
// draws away to the right over the last leg (hero.cumulus, keyed to the distance flown) so both towers stand on closed blue.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero } from '../parts/pastel-bulb-fields.js';

const D2R = Math.PI / 180, TH = -130 * D2R, CS = Math.cos(TH), SN = Math.sin(TH), OX = 35.7, OZ = 241.6;
const L2W = (x, z) => [OX + x * CS + z * SN, OZ - x * SN + z * CS];          // hero local xz -> world xz
// (improve round) THE EYE STANDS OVER THE LAND: the canal is 9 m wide between thin banks that fall sheer to the fields, and
// we ride on top of the heap 6 m above the water, so the stripes begin at the bank foot and fill the frame to its corners.
const UP = -5, BT = 0.3, EYE = 6, PY = 6, CW = 4.5;                         // upland level, bank top, eye (flat all the way), canal half-width
const ringZ = (x, lz = 106) => OZ + (-lz - 0.766 * (x - OX)) / 0.643;        // world z where hero-local z = lz at world x
const BASE = { paper: '#0E0D10', scarlet: '#E23A2C', rose: '#F4A0B5', cream: '#F5E08C', green: '#5FA356', cerulean: '#3F9BD8', white: '#F7F3EA',
  orange: '#F58B30', lilac: '#B48BD8', lavender: '#9E9CDA' };
const LANE = 108;   // (coverage round) moved on from 84 m and its gate to the LEFT bank: from the willows the whole bridge stands clear of the mill;                                                            // world z of the lane and the yellow drawbridge of leg one
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  id: 'pastel-bulb-fields', name: 'Stripes of April', category: 'wilderness', weirdness: 0.25, media: ['water', 'open'],
  async build(ctx) {
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, vr = ctx.rng.fork('pb-vary');
    // ---- the visit: hour, crop, weather, sailcloth, paper
    const hourPick = vr.pick(['day', 'day', 'day', 'day', 'golden', 'golden', 'dawn', 'night']);
    const hour = ['day', 'golden', 'dawn', 'night'].includes(vary.hour) ? vary.hour : hourPick;
    const cropPick = vr.pick(['tulip', 'tulip', 'tulip', 'hyacinth', 'daffodil']), crop = hour === 'day' || hour === 'golden' ? cropPick : 'tulip';
    const clear = vr.chance(0.3), sailcloth = vr.pick(['scarlet', 'scarlet', 'white', 'orange']), plum = vr.chance(0.2);
    const rare = !!vary.rare, dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const B = { ...BASE };
    if (hour === 'golden') B.lavender = BASE.orange;
    if (hour === 'dawn') Object.assign(B, { scarlet: BASE.rose, green: BASE.lavender, cerulean: BASE.lavender, white: BASE.cream, orange: BASE.rose, lilac: BASE.lavender });
    if (hour === 'night') Object.assign(B, { scarlet: BASE.cerulean, rose: BASE.lavender, cream: BASE.white, green: BASE.cerulean, orange: BASE.lavender, lilac: BASE.lavender });
    if (plum) B.paper = '#1C1220';
    const EXPO = 2;
    const style = await makeStyle(ctx, { palette: [B.paper, B.scarlet, B.rose, B.cream, B.green, B.cerulean, B.white], extra: { orange: B.orange, lilac: B.lilac, lavender: B.lavender },
      exposure: EXPO, wind: [0, -1], finger: hour === 'dawn' ? 250 : 900 });
    const pal = style.pal;
    await ctx.yield();
    const scene = new THREE.Scene();
    scene.background = pal.paper.clone();
    const ticks = [], trash = [];                    // per-frame jobs (dt, time, camera, u, s); things to dispose

    // ---- the canal's line (what the first builders called the path): 165 m straight, 50 degrees left on a 100 m radius,
    // 173 m straight along the embankment. The canal strokes, reeds, bank grass and the yellow barge keep to it.
    const cpts = [];
    for (let z = 0; z <= 150; z += 30) cpts.push([0, EYE, z]);
    for (let i = 0; i <= 10; i++) { const a = i * 5 * D2R; cpts.push([100 - 100 * Math.cos(a), EYE, 165 + 100 * Math.sin(a)]); }
    const HX = 0.766, HZ = 0.643, endX = OX + HX * 173, endZ = OZ + HZ * 173;
    for (let d = 30; d <= 173; d += 28.6) cpts.push([OX + HX * d, PY, OZ + HZ * d]);
    cpts[cpts.length - 1] = [endX, PY, endZ];
    const canal = makePath(cpts);
    // ---- the flight (second polish): we ride the barge to the first mill, then LEAVE the canal where it bends away, swoop down
    // over the right bank into the polder between the embankment and the mill dyke, fly a long passage 1.6 m over the floor
    // between rows of big tulips (the lane, hero-local x = LX), and lift back over the embankment to the bridge and the ring.
    const LX = 25, LOWY = -11.4;                                             // (third polish) 2.6 m over the floor: rows seen from above stay separate flowers
    const pts = [];
    for (let z = 0; z <= 150; z += 30) pts.push([0, EYE, z]);
    for (let i = 0; i <= 3; i++) { const a = i * 5 * D2R; pts.push([100 - 100 * Math.cos(a), EYE, 165 + 100 * Math.sin(a)]); }
    for (const [lx, lz, y] of [[-5, 41, 5.2], [10.5, 24.5, 2.0], [20, 8, -5.2], [24.4, -9, -10.1], [LX - 0.4, -27, LOWY - 0.1], [LX, -42, LOWY], [LX + 0.3, -54, -10.6], [LX + 1.8, -66, -6.6],
      [LX + 3, -77, -2.2], [LX + 2.6, -88, 1.0], [24, -99, 3.2], [18.5, -108.5, 4.7], [11, -117, 5.5], [4.2, -126.5, 5.9], [0.7, -137, PY], [0, -152, PY]]) { const [wx, wz] = L2W(lx, lz); pts.push([wx, y, wz]); }
    pts.push([endX, PY, endZ]);
    const path = makePath(pts), LEN = path.length;
    const sAtZ = (lz) => { let best = 0, bd = 1e9; const v = new THREE.Vector3(); for (let d = 190; d <= LEN; d += 1) { path.posAtDist(d, v); const zz = (v.x - OX) * SN + (v.z - OZ) * CS, e = Math.abs(zz - lz); if (e < bd) { bd = e; best = d; } } return best; };
    const S_BANK = sAtZ(-116);                                                // where we come back over the bank of the embankment

    // ---- the hero: the polder under the cumulus, with the seven mills
    const hero = await buildHero(ctx, { style, detail, sky: false, sailcloth: hour === 'dawn' ? 'white' : sailcloth, crop,   // (at dawn the sky is rose: cream cloth)
      bandCloud: 1, exposure: EXPO, upland: UP, lane: [LX - 12.6, LX + 12.6, 34, -150], bladeSun: [0.136, -0.771, -0.621], bladeGround: UP + 1.2,
      millLit: hour === 'dawn' ? pal.cream : pal.lavender, millShade: hour === 'night' ? pal.cerulean : hour === 'dawn' ? pal.lavender : pal.lilac, millBrick: hour === 'night' ? pal.lavender : pal.rose });
    hero.object.position.set(OX, 0, OZ); hero.object.rotation.y = TH; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();

    // ---- the sky: scumble on the paper dome, restruck by the hour
    const skyOpt = hour === 'golden' ? { blue: pal.cerulean, drag: pal.cream, band: [pal.rose, pal.orange], low: [pal.rose, pal.orange] }
      : hour === 'dawn' ? { blue: pal.rose, drag: pal.cream, band: [pal.lavender, pal.cream], low: [pal.lavender, pal.cream] }   // (coverage round) a rose sky at dawn: the lavender of dykes and leaf rows stands against it
        : hour === 'night' ? { blue: pal.cerulean, drag: pal.lavender, band: [pal.lavender, pal.cerulean], density: 0.34 } : { low: [pal.rose, pal.orange], band: [pal.rose, pal.orange] };
    scene.add(style.sky(skyOpt));
    await ctx.yield();

    // ---- the upland of leg one: paper ground, the canal trough and its banks (black is geometry)
    const pp = [], quad = (a, b, c, d) => pp.push(...a, ...b, ...c, ...a, ...c, ...d);
    const ZB = -260, XL = (-106 - 0.643 * (ZB - OZ)) / 0.766 + OX;             // far left corner where the ring dyke meets z = ZB
    const UPP = UP - 0.8;                                                      // the paper lies well under the strokes, so it never wins the depth test
    quad([-3200, UPP, ZB], [-5.3, UPP, ZB], [-5.3, UPP, ringZ(-5.3)], [-3200, UPP, ringZ(-3200)]);
    quad([5.3, UPP, ZB], [XL, UPP, ZB], [XL, UPP, ZB], [5.3, UPP, ringZ(5.3)]);
    quad([-5.5, UPP, 112], [-18.5, UPP, 126], [-18.5, UPP, 153], [-5.5, UPP, 153]);   // (fourth polish) the tulip bank reaches to the foot of the mill's mound
    const prof = [[-5.7, -14.3], [-5.1, BT], [-CW - 0.1, BT], [-CW, -0.8], [CW, -0.8], [CW + 0.1, BT], [5.1, BT], [5.7, -14.3]];
    // (coverage round) the banks are grassed dykes: solid leaf green bodies (flank and top); the trough between them stays paper,
    // the black line round the water; and THE WATER IS A SOLID BAND of cerulean all along the canal, the white strokes sliding on it
    const gq = [], wq = [], q4 = (T, a, b, c, d) => T.push(...a, ...b, ...c, ...a, ...c, ...d);
    for (let k = 0; k < prof.length - 1; k++) (k < 2 || k > 4 ? (a, b, c, d) => q4(gq, a, b, c, d) : quad)([prof[k][0], prof[k][1], ZB], [prof[k + 1][0], prof[k + 1][1], ZB], [prof[k + 1][0], prof[k + 1][1], 134], [prof[k][0], prof[k][1], 134]);
    q4(wq, [-CW + 0.05, 0, ZB], [CW - 0.05, 0, ZB], [CW - 0.05, 0, 0], [-CW + 0.05, 0, 0]);
    for (let d = 0, a = null, wp1 = new THREE.Vector3(), wt1 = new THREE.Vector3(); d <= canal.length + 2800; d += d < canal.length - 4 ? 4 : 400) {
      const dd = Math.min(d, canal.length); canal.posAtDist(dd, wp1); canal.tangentAtDist(dd, wt1); wt1.y = 0; wt1.normalize();
      const ex = d - dd, cx = wp1.x + wt1.x * ex, cz = wp1.z + wt1.z * ex, b = [[cx + wt1.z * (CW - 0.05), 0, cz - wt1.x * (CW - 0.05)], [cx - wt1.z * (CW - 0.05), 0, cz + wt1.x * (CW - 0.05)]];
      if (a) q4(wq, a[0], a[1], b[1], b[0]); a = b;
    }
    const mkBody = (arr, color, grain, o = {}) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      const mt = style.paper({ side: THREE.DoubleSide, color: color.clone().multiplyScalar(0.87), grain, ...o }), m = new THREE.Mesh(g, mt); m.frustumCulled = false; scene.add(m); trash.push(mt, g); return m; };
    const rq = [];                                                             // the lane: a sandy track (cream), built further on

    // ---- sixty stripes a side, parallel to the canal: side-strokes laid heel (far) to tip (near), joins showing
    const srng = ctx.rng.fork('pb-upland');
    const sticks = crop === 'hyacinth' ? [pal.lilac, pal.rose, pal.white, pal.cerulean, pal.lilac]
      : crop === 'daffodil' ? [pal.cream, pal.white, pal.cream, pal.orange, pal.white]
        : [pal.scarlet, pal.cream, pal.lilac, pal.rose, pal.white, pal.scarlet, pal.cream, pal.orange];
    // (third polish) THE HAND WAVERS: beyond the plants every stripe of leg one bows with one slow wave of the arm, wider the
    // further out it is ruled (a few pixels at any distance), so the far stripes are no longer ruler lines; neighbours bow
    // together and the gaps are widened by as much as the fit can miss, so no two strokes overlap
    const waverA = (ax) => { const t = Math.max(0, ax - 45); return t * t / 1300; };
    const waver = (x, z) => 0.62 * Math.sin(z * 0.021 + x * 0.004 + 0.8) + 0.38 * Math.sin(z * 0.033 + 1.3 - x * 0.003);
    const wS = crop === 'hyacinth' ? 0.72 : 1, upl = [], ground = style.batch(), groundFar = style.batch();   // (second polish) far to the side the stick is pressed hard: crisp bands, no dry streaks
    for (const sg of [-1, 1]) {
      let x = 6.3, last = null, last2 = null, sinceGreen = srng.int(2, 6), sinceDitch = srng.int(7, 14);
      while (x < (sg < 0 ? 620 : 130)) {
        const farOut = Math.max(0, (x - 200) / 300);
        // far to the side a stripe is a whole parcel (about x squared / 900 m wide), so nothing is ever ruled thinner than a stick
        let w = Math.max(srng.range(3.6, 4.4) * wS * (1 + farOut * 1.4), x * x / 900 * srng.range(0.8, 1.2)), c, kind = 'bloom';
        if (--sinceDitch <= 0) { c = pal.cerulean; w = Math.max(srng.range(1.6, 2.2), w * (x > 60 ? 0.55 : 0.3)); kind = 'ditch'; sinceDitch = srng.int(14, 24); }
        else if (--sinceGreen <= 0) { c = pal.green; kind = 'green'; sinceGreen = srng.int(6, 11) - (crop === 'daffodil' ? 3 : 0); }
        else { do { c = srng.pick(sticks); } while (c === last || (c === last2 && srng.chance(0.7))); }
        last2 = last; last = c;
        const cx = sg * (x + w / 2), shy = srng.chance(0.25) ? srng.range(5, 22) : srng.range(0, 3);
        upl.push({ x: cx, w, c, kind, off: srng.range(-12, 12), z1: Math.min(ringZ(cx, 111) - 2.5 - shy, 900), z0: -34 - srng.range(0, 12) });
        x += w + Math.max(srng.range(0.5, 1.0) * (1 + farOut), w * 0.07) + waverA(x) * 0.14;
      }
    }
    let nst = 0; const BANKX = 44, BANKZ = 88.5, VOID0 = { add() {} }, bankG = style.batch();   // bankG: the bank's stripes, kept as a dusting
    for (const st of upl) {
      if (++nst % 50 === 0) await ctx.yield();
      let z = st.z1; const A = waverA(Math.abs(st.x)), wv = (zz) => A * waver(st.x, zz);
      while (z > st.z0 + 12) {
        const len = Math.min(z - st.z0, Math.abs(st.x) < 260 ? srng.range(70, 130) : srng.range(110, 190)), miss = srng.range(-0.25, 0.25) * (1 + A * 0.4);
        const da = wv(z), db = wv(z - len), dm = wv(z - len * 0.5) - (da + db) * 0.5;      // the stroke bows with the hand (bow > 0 is toward -x)
        // (fourth polish) on THE TULIP BANK (right of the canal, from the lane to the mill) no stripe is laid: big single tulips
        // stand there on bare paper. A stroke that would run into it starts at the lane instead (every random draw is kept)
        const onBank = st.x < 0 && st.x > -BANKX && st.kind !== 'ditch', zh = onBank ? Math.min(z, BANKZ - 1.5) : z, tgt = VOID0;   // (coverage round) the stripes of leg one are solid bands drawn by the upland's band floor (below); the draws are kept
        tgt.add([st.x + miss + da, UP + 0.05, zh], [st.x + miss + srng.range(-0.2, 0.2) + db, UP + 0.05, z - len], st.w, st.c,
          { lay: 1, bow: srng.range(-0.35, 0.35) - dm, off: st.off, strength: srng.range(0.84, 1) });
        if (onBank && z > BANKZ) VOID0.add([st.x + miss, UP + 0.04, z], [st.x - miss, UP + 0.04, Math.max(z - len, BANKZ - 1.5)], st.w, st.c, { lay: 1, bow: miss, off: st.off, strength: 0.95 });
        z -= len + (srng.chance(0.6) ? -srng.range(2, 4) : srng.range(1, 3));
      }
    }
    // the canal of leg one: strokes of reflected sky that slide and are laid again
    for (let i = 0; i < 46; i++) {
      const z = -24 + i * 3.6 + srng.range(-3, 3), len = srng.range(14, 34), wh = srng.chance(0.22);
      ground.add([srng.range(-3.4, 3.4), 0.02, z + len], [srng.range(-3.4, 3.4), 0.02, z], srng.range(0.9, 2.0), wh ? pal.white : i % 3 ? pal.cerulean : pal.lavender,
        { lay: 1, strength: wh ? 0.6 : srng.range(0.7, 0.95), bow: srng.range(-0.3, 0.3), phase: srng(), period: srng.range(5, 10), off: srng.range(-8, 8) });
    }
    for (let i = 0, cp1 = new THREE.Vector3(), cp2 = new THREE.Vector3(); i < 70; i++) {
      const d0 = 128 + i * 6.4 + srng.range(-3, 3), len = srng.range(12, 30), o = srng.range(-3.4, 3.4), wh = srng.chance(0.22);
      canal.posAtDist(d0 + len, cp1); canal.tangentAtDist(d0 + len, cp2); const a = [cp1.x + cp2.z * o, 0.03, cp1.z - cp2.x * o];
      canal.posAtDist(d0, cp1); canal.tangentAtDist(d0, cp2);
      ground.add(a, [cp1.x + cp2.z * o, 0.03, cp1.z - cp2.x * o], srng.range(0.9, 2.0), wh ? pal.white : i % 3 ? pal.cerulean : pal.lavender,
        { lay: 1, strength: wh ? 0.6 : srng.range(0.7, 0.95), phase: srng(), period: srng.range(5, 10), off: srng.range(-8, 8) });
    }
    for (const st of upl) if (st.x < 0 && st.x > -16 && st.kind !== 'ditch') VOID0.add([st.x, UP + 0.04, 152], [st.x + 0.3, UP + 0.04, st.z1 - 3], st.w, st.c, { lay: 1, bow: 0.3, off: st.off, strength: 0.95 });
    // a dusting of each stripe's stick lies under the big tulips of the bank (pressure 0.4), so the turning bars of the sails'
    // shadow show as bare paper between them
    // (coverage round) THE BAND FLOOR OF LEG ONE: every stripe one solid band of its stick from behind us to the ring dyke (the
    // slow wave of the arm is kept, in the shader); black paper remains as the thin line between two bands. On the tulip bank
    // (right of the canal, from BANKZ to the mill) the band is the leaves of the big tulips: leaf green flecked with the stick,
    // and the turning bars of the sails' shadow lie on it as bare paper.
    {
      const urg = ctx.core.makeRng(ctx.core.hashSeed('pb-uplfar:' + ctx.seed)), all = upl.slice(); let lastC = null;
      for (let x = 640; x < 3250;) { const w = x * x / 900 * urg.range(0.8, 1.1); let c; do { c = urg.pick(sticks); } while (c === lastC); lastC = c; all.push({ x: -(x + w / 2), w, c, kind: 'bloom' }); x += w + x * 0.03; }
      const bm = style.bandMap(all, -3300, 140, 200, 1), yb = UP - 0.03, bq = [], q4 = (a, b, c, d) => bq.push(...a, ...b, ...c, ...a, ...c, ...d);
      q4([-3200, yb, ZB], [-5.3, yb, ZB], [-5.3, yb, ringZ(-5.3)], [-3200, yb, ringZ(-3200)]);
      q4([5.3, yb, ZB], [XL, yb, ZB], [XL, yb, ZB], [5.3, yb, ringZ(5.3)]);
      q4([-5.5, yb, 112], [-18.5, yb, 126], [-18.5, yb, 153], [-5.5, yb, 153]);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bq, 3));
      const bandMat = style.paper({ side: THREE.DoubleSide, stripes: bm.tex, near: bm.tex, nearMap: bm.map, far: false, rowBox: new THREE.Vector4(-BANKX, -5.2, BANKZ - 1.5, 190) });
      const bandMesh = new THREE.Mesh(bg, bandMat); bandMesh.frustumCulled = false; scene.add(bandMesh); trash.push(bm.tex, bandMat);
    }
    const groundMesh = ground.mesh({ cap: 0.5 });
    scene.add(groundMesh);
    if (groundFar.count) scene.add(groundFar.mesh({ cap: 0.5, grain: 0.2 }));
    await ctx.yield();

    // ---- within 64 m of the canal each stripe breaks into its plants: a dab a head, a green flick a leaf
    const heads = [], stepZ = 0.85 / Math.max(0.5, detail * Math.sqrt(dens));
    let nd = 0;
    for (const st of upl) {
      if (Math.abs(st.x) > 64 || st.kind === 'ditch') continue;
      const rows = Math.max(2, Math.floor((st.w - 0.5) / 0.95));
      for (let r = 0; r < rows; r++) {
        const rx0 = st.x - (rows - 1) * 0.475 + r * 0.95;
        for (let z = Math.min(st.z1, 240) - srng() * stepZ; z > -6; z -= stepZ) {
          const j1 = srng(), j2 = srng(), x = rx0 + (j1 - 0.5) * 0.25, zz = z + (j2 - 0.5) * 0.3;
          if (Math.abs(zz - LANE) < 2.3) continue;                            // the lane to the drawbridge
          if (st.x < 0 && st.x > -BANKX && zz > BANKZ - 1.5) continue;         // the tulip bank: big single tulips stand there
          if (st.kind === 'green') style.dab(heads, x, UP + 0.05, zz, 0.55 + j1 * 0.2, 0.2, pal.green, st.off);
          else {
            style.dab(heads, x, UP + 0.32, zz, 0.5 + j2 * 0.14, 0.27, st.c, st.off);
            if (j1 < 0.62) style.dab(heads, x + 0.22, UP + 0.03, zz + 0.3, 0.42, 0.15, pal.green, st.off);
          }
          if (++nd % 2000 === 0) await ctx.yield();
        }
      }
    }
    scene.add(await style.dabs(heads, { far: 74 }));
    await ctx.yield();

    // ---- the shadow field (fourth polish): NO SHADOW EVER LIES ON THE BARGE OR ON THE NEAR FIELDS. Cloud shadows are small
    // patches of bare paper drifting downwind on the far polder, well to the side of everything we fly over; the one shadow
    // that reaches us is the turning cross of the first mill's sails on the tulip bank (the hero sets it). Everything scripted
    // is keyed to s (metres flown).
    const WLX = -0.766, WLZ = 0.643;
    for (const st of upl) {                              // (the draws the entry shadow's dust took, kept so that nothing laid after it moves)
      if (Math.abs(st.x) > 170 || st.kind === 'ditch') continue;
      const n = Math.max(2, Math.round((Math.abs(st.x) < 70 ? 9 : 5) * detail));
      for (let i = 0; i < n; i++) srng.range(-0.4, 0.4);
    }
    style.home.set(300, 700); style.range = 1500;
    style.setCloud(0, 0, 1e6);
    {
      const [p1x, p1z] = L2W(420, -640), [p2x, p2z] = L2W(-520, -420), [p3x, p3z] = L2W(760, -1500), [p4x, p4z] = L2W(-900, -1300);
      style.setCloud(1, p1x, p1z, 70, 110, true);
      if (!clear) { style.setCloud(2, p2x, p2z, 80, 130, true); style.setCloud(3, p3x, p3z, 110, 170, true); }
      style.setCloud(4, p4x, p4z, 100, 150, true);
    }
    ticks.push((dt, time, camera, u, s) => {
      // the hero places its band (cloud 1) every frame: it is taken back here, a small patch drifting beyond the dyke mills
      // (sixth round) THE BAND OF BARE PAPER lies across the polder right of the mill dyke, between the second and the fourth
      // mill, with the third standing in it as paper. It comes down the wind 0.6 m for every metre we fly from the reveal on
      // (so two stills are two pictures) and 4 m a second on the clock; every twelve seconds it has been stroked back in at
      // its downwind end and is rubbed out again 48 m upwind (it grows and closes over two seconds, never at once). It never
      // reaches the lane, the canal or anything we fly over.
      // On the reveal its downwind tip comes as far as the second mill; before the swoop it has been stroked back in there
      // (the second mill is drawn whole for the low passage), and a new one is rubbed out 110 m further upwind.
      const tl = (time * 4 + 24) % 48, ph = tl / 48, k2 = sstep(240, 266, s), env = sstep(0, 0.14, ph) * (1 - sstep(0.86, 1, ph)) * Math.max(1 - sstep(206, 232, s), k2);
      const bd = 0.45 * Math.min(90, Math.max(0, s - 140)) + tl - (k2 > 0 ? 110 : 0), [bx, bz] = L2W(267 + WLX * bd, -191 + WLZ * bd);
      style.setCloud(1, bx, bz, 170 * (0.3 + 0.7 * env), 150 * env + 0.5);
      // the thumb-smear: gusts cross the polder for ever, none beside the lens on leg one (seen close it read as a blur)
      if (s < 150) style.setGust(0, 1e6, 34, 0);
      else {
        const per = clear ? 6 : 10, g = (time % per) / per, k = Math.floor(time / per) % 2;
        const [gx, gz] = L2W((k ? -120 : 150) + WLX * (g * 420 - 60), -260 + WLZ * (g * 420 - 60));
        style.setGust(gx, gz, clear ? 75 : 46, Math.sin(Math.PI * g) * sstep(150, 175, s));
      }
    });

    // ---- the barges. Ours is built round the eye and placed from camera.matrixWorld every frame (never parented to the
    // camera); a like one, loaded with cream yellow, comes the other way along the embankment.
    const paperBoat = style.paper({ side: THREE.DoubleSide }), brng = ctx.rng.fork('pb-barge');
    async function makeBarge(cols, full) {
      const g = new THREE.Group(), q = [], hq = (a, b, c, d) => q.push(...a, ...b, ...c, ...a, ...c, ...d);
      const DK = -2.5, WL = -EYE;                                             // deck and waterline, metres below the eye
      const st = full ? [[-7, 1.2], [-6.2, 1.75], [-4.5, 2], [6.5, 2], [8.2, 1.75], [9, 1.2]] : [[-1.5, 2], [6.5, 2], [8.2, 1.75], [9, 1.2]];
      for (let i = 0; i < st.length - 1; i++) {
        const [z0, w0] = st[i], [z1, w1] = st[i + 1];
        hq([-w0, DK, z0], [w0, DK, z0], [w1, DK, z1], [-w1, DK, z1]);
        for (const sg of [-1, 1]) hq([sg * w0, DK, z0], [sg * w1, DK, z1], [sg * w1, WL, z1], [sg * w0, WL, z0]);
      }
      const e0 = st[0], e1 = st[st.length - 1];
      hq([-e1[1], DK, e1[0]], [e1[1], DK, e1[0]], [e1[1], WL, e1[0]], [-e1[1], WL, e1[0]]); hq([-e0[1], DK, e0[0]], [e0[1], DK, e0[0]], [e0[1], WL, e0[0]], [-e0[1], WL, e0[0]]);
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(q, 3));
      const hull = new THREE.Mesh(hg, paperBoat); hull.frustumCulled = false; g.add(hull);
      const b = style.batch();
      b.add([-1.75, DK + 0.06, 8.45], [1.75, DK + 0.06, 8.45], 0.24, pal.white, { bow: 0.34, strength: 1 });          // the blunt bow, edged with one white stroke
      if (full) {
        b.add([1.7, DK + 0.06, -6.5], [-1.7, DK + 0.06, -6.5], 0.24, pal.white, { bow: -0.3 });
        for (const sg of [-1, 1]) {                                            // (coverage round) the hull is drawn: a broad band along its side under a white gunwale, and the load's reflection laid on the water beside it
          b.add([sg * 2.06, DK - 1.75, 8], [sg * 2.06, DK - 1.75, -6.2], 1.25, pal.lavender, { strength: 0.95 });
          b.add([sg * 2.08, DK + 0.02, 8.3], [sg * 2.08, DK + 0.02, -6.5], 0.3, pal.white, { strength: 1 });
          for (let k = 0; k < 4; k++) b.add([sg * (2.7 + 0.45 * k), WL + 0.12, 6.5 - 3.4 * k], [sg * (2.9 + 0.45 * k), WL + 0.12, 3.6 - 3.4 * k], 0.85, k % 2 ? pal.white : pal.cream, { lay: 1, period: 2.2 + 0.4 * k, phase: k * 0.27 + (sg > 0 ? 0 : 0.4), strength: 0.9 });
        }
      }
      for (const sg of [-1, 1]) {                                              // two white wake strokes peeling off the bow, laid again and again
        b.add([sg * 1.3, WL + 0.08, 9.4], [sg * (full ? 2.4 : 4.1), WL + 0.08, 0.5], 0.75, pal.white, { lay: 1, bow: sg * 0.5, period: 1.9, phase: sg > 0 ? 0 : 0.5, strength: 0.9 });
        b.add([sg * 1.9, WL + 0.08, 8.2], [sg * (full ? 2.3 : 3.8), WL + 0.08, -4.5], 0.5, pal.white, { lay: 1, bow: sg * 0.4, period: 2.6, phase: sg > 0 ? 0.3 : 0.75, strength: 0.6 });
      }
      const sm = b.mesh({ shade: false, finger: false }); g.add(sm);
      const list = [], n = Math.round((full ? 1500 : 700) * (0.5 + 0.5 * detail)), zA = full ? -5.4 : 1.2;
      for (let i = 0; i < n; i++) {
        const z = zA + ((full ? 8.3 : 7.4) - zA) * brng(), xk = brng.range(-1, 1), x = xk * 1.8, r = brng();
        const hz = full ? 0.85 * sstep(8.4, 6, z) * sstep(-5.6, -3.5, z) + 0.1 : 0.95 * (1 - sstep(3.4, 7.4, z)) + 0.04;
        const h = hz * Math.pow(Math.max(0, 1 - xk * xk), 0.6) * (1 - 0.3 * r * r);
        const c = brng.chance(0.14) ? pal.green : cols[Math.floor(brng() * cols.length)];
        style.dab(list, x, DK + h, z, brng.range(0.26, 0.4), brng.range(0.12, 0.17), c, 1e5);
        if (i % 1000 === 999) await ctx.yield();
      }
      g.add(await style.dabs(list, { far: 300, local: true }));
      return g;
    }
    const boat = await makeBarge(hour === 'dawn' || hour === 'night' ? style.sticks : [pal.scarlet, pal.rose, pal.orange, pal.cream, pal.lilac, pal.white, pal.scarlet, pal.cream], false);
    const boat2 = await makeBarge([pal.cream, pal.cream, pal.cream, pal.cream, pal.white], true);
    scene.add(boat, boat2); trash.push(paperBoat);
    boat2.scale.y = 0.5;                                                       // (second polish) the cream barge rides low: its tarred side is a narrow band of paper, not a slab
    // (second polish) OUR BARGE IS A SMALL THING AT THE FOOT OF THE FRAME: half size, low, bobbing against the frame, under the
    // edge for long stretches, and gone (one visible flag) once we leave the canal at the first mill.
    boat.scale.setScalar(0.36);
    const bp = new THREE.Vector3(), bt = new THREE.Vector3(), S_BARGE = canal.length - 173 + 116;   // the canal distance where we come back over the bank
    ticks.push((dt, time, camera, u, s, cp) => {
      const e = camera.matrixWorld.elements; path.tangentAt(u, bt);
      const at = Math.atan2(bt.x, bt.z); let df = Math.atan2(-e[8], -e[10]) - at; df = Math.atan2(Math.sin(df), Math.cos(df));
      // up in frame at the entry and again at the mill, under the edge between; it sinks away for good as the canal bends off
      const up = Math.max(1 - sstep(38, 62, s), sstep(96, 118, s)) * (1 - sstep(150, 172, s)), bob = Math.sin(time * 0.9) * 0.1 + Math.sin(time * 0.53 + 1.3) * 0.07;
      boat.visible = false;                                                    // (coverage round) our own heap is out of the view: outside reviewers read it as a thing on the lens
      boat.position.set(cp.x + Math.sin(at) * 2.9, cp.y - 1.75 - 1.6 * (1 - up) + bob, cp.z + Math.cos(at) * 2.9);
      boat.rotation.set(0, at + 0.5 * df + Math.sin(time * 0.37) * 0.035, Math.sin(time * 0.7 + 0.5) * 0.03);
      // the cream barge lies under the white bridge until we are in the low passage, then comes down the embankment and passes
      // beneath us as we lift back over the bank
      const pB = Math.min(canal.length - 9, S_BARGE + 30 + 0.9 * (S_BANK - s));   // (coverage round) it is still ahead of us as we come over the bank: whole in frame on its canal
      canal.posAtDist(pB, bp); canal.tangentAtDist(pB, bt);
      boat2.visible = s < S_BANK + 30;
      boat2.position.set(bp.x + bt.z * 1.6, EYE * 0.5, bp.z - bt.x * 1.6); boat2.rotation.y = Math.atan2(-bt.x, -bt.z);
    });
    await ctx.yield();

    // ---- pollard willows on the banks of leg one: a paper trunk, two strokes down its sunlit side, a burst of whips
    const wrng = ctx.rng.fork('pb-willow'), near = style.batch();
    const box = (x0, x1, y0, y1, z0, z1, T) => {                               // T: another body's triangles (gq: grassed) instead of paper
      const qd = T ? (a, b, c, d) => q4(T, a, b, c, d) : quad;
      qd([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]); qd([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      qd([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]); qd([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]);
      qd([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]);
    };
    // (improve round) each willow is a tree even as a paper cut-out: a trunk that leans and tapers up from the field at the
    // bank foot, a knuckled head of a few lumps, no two alike, and a fan of whips streaming downwind over the bank
    const lump = (cx, cy, cz, r) => {                                          // an irregular eight-faced knuckle
      const v = [[1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]].map(([ax, , az]) => { const k = r * wrng.range(0.7, 1.25); return [cx + ax * k, cy + wrng.range(-0.3, 0.3) * r, cz + az * k]; });
      const t = [cx + wrng.range(-0.3, 0.3) * r, cy + r * wrng.range(0.7, 1.1), cz], u0 = [cx, cy - r * wrng.range(0.6, 0.9), cz];
      for (let k = 0; k < 4; k++) { pp.push(...v[k], ...v[(k + 1) % 4], ...t); pp.push(...v[(k + 1) % 4], ...v[k], ...u0); }
    };
    for (const sg of [-1, 1]) for (let z = 9 + (sg > 0 ? 7 : 0); z < 62; z += 17 + wrng.range(-2, 2)) {   // (polish round) the willow row ends at 60 m: beyond it the canal leads to the drawbridge, the pickers and the mill
      const x = sg * (7.7 + wrng.range(-0.4, 0.6)), top = wrng.range(1.0, 2.6), lx = wrng.range(-0.9, 0.9) - sg * 0.3, lz = -wrng.range(0.2, 1.3);
      const r0 = wrng.range(0.5, 0.68), r1 = r0 * 0.5, hx = x + lx, hz = z + lz;
      for (let k = 0; k < 5; k++) {                                            // the trunk: five tapering, leaning faces
        const a0 = k / 5 * 6.2832 + 0.3, a1 = (k + 1) / 5 * 6.2832 + 0.3;
        quad([x + Math.cos(a0) * r0, UP, z + Math.sin(a0) * r0], [x + Math.cos(a1) * r0, UP, z + Math.sin(a1) * r0], [hx + Math.cos(a1) * r1, top, hz + Math.sin(a1) * r1], [hx + Math.cos(a0) * r1, top, hz + Math.sin(a0) * r1]);
      }
      lump(hx, top + 0.25, hz, wrng.range(0.75, 1.0));
      for (let k = 0, n = wrng.int(2, 4); k < n; k++) lump(hx + wrng.range(-0.8, 0.8), top + wrng.range(0.1, 0.8), hz + wrng.range(-0.5, 0.5), wrng.range(0.4, 0.7));
      near.add([hx - 0.2, top + 0.7, hz - 1.0], [x + lx * 0.45 - 0.28, top - wrng.range(2.6, 3.8), z + lz * 0.45 - 0.7], 0.42, pal.lavender, { bow: 0.1, strength: 0.9 });
      near.add([hx + 0.25, top + 0.2, hz - 1.0], [x + lx * 0.7 + 0.2, top - wrng.range(1.2, 2.0), z + lz * 0.7 - 0.7], 0.24, pal.lavender, { bow: -0.06, strength: 0.65 });
      const nw = Math.max(12, Math.round(20 * detail)), a0 = wrng.range(-0.25, 0.25);
      for (let k = 0; k < nw; k++) {
        const a = a0 + (k + wrng()) / nw * Math.PI, r = wrng.range(3.4, 5.6), dx0 = Math.cos(a) * r * 0.9, dy = 0.4 + Math.sin(a) * r * 0.95, dz = -wrng.range(0.4, 2.6);
        let tx = hx + dx0; if (Math.abs(tx) < 5.0) tx = sg * (5.0 + wrng() * 0.6);
        near.add([hx + Math.cos(a) * 0.6, top + 0.6 + Math.sin(a) * 0.35, hz + dz * 0.2], [tx, top + 0.5 + dy, hz + dz], wrng.range(0.18, 0.3), wrng.chance(0.3) ? pal.cream : pal.green,
          { bow: wrng.range(-0.45, 0.45), off: wrng.range(0.6, 1.3), strength: wrng.range(0.8, 1) });
      }
    }
    // (polish round) WHAT THE CANAL LEADS TO CHANGES: at 84 m a lane crosses it on a yellow drawbridge that we pass under.
    // One gate frame on the left bank, its single leaf lifted to 80 degrees, the balance beams tipped back over our heads;
    // the lane ramps down to the fields on the right, where a hand cart stands heaped with cut tulips.
    const lrng = ctx.core.makeRng(ctx.core.hashSeed('pb-lane:' + ctx.seed)), LZ = LANE, LY = UP + 0.14, timber = pal.cream;
    const laneRun = (xa, ya, xb, yb, n) => {                                    // paper strip with skirts, two dry ruts and a grass verge
      q4(rq, [xa, ya, LZ - 2.2], [xb, yb, LZ - 2.2], [xb, yb, LZ + 2.2], [xa, ya, LZ + 2.2]);                     // (coverage round) a sandy track on a grassed ramp
      for (const zz of [LZ - 2.2, LZ + 2.2]) q4(gq, [xa, ya, zz], [xb, yb, zz], [xb, UP - 0.8, zz], [xa, UP - 0.8, zz]);
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n + 0.02, X = (t) => xa + (xb - xa) * t, Y = (t) => ya + (yb - ya) * t + 0.07;
        for (const o of [-0.85, 0.85]) near.add([X(t0), Y(t0), LZ + o + lrng.range(-0.15, 0.15)], [X(t1), Y(t1), LZ + o + lrng.range(-0.15, 0.15)], lrng.range(0.5, 0.75), lrng.chance(0.3) ? pal.white : timber,
          { lay: 1, strength: lrng.range(0.5, 0.75), bow: lrng.range(-0.15, 0.15), off: lrng.range(-6, 6) });
        for (const o of [-2.5, 2.5]) near.add([X(t0), Y(t0) - 0.02, LZ + o], [X(t1), Y(t1) - 0.02, LZ + o], lrng.range(0.7, 1.1), pal.green, { lay: 1, strength: lrng.range(0.5, 0.8), bow: lrng.range(-0.2, 0.2), off: lrng.range(-6, 6) });
      }
    };
    laneRun(-5.6, BT + 0.02, -22, LY, 2); laneRun(-22, LY, -150, LY, 5); laneRun(5.6, BT + 0.02, 13.5, UP + 1.05, 2);   // on the left the lane runs up onto the ring dyke
    for (const sg of [-1, 1]) {                                                 // brick abutments: three courses of rose on the face we see
      box(sg > 0 ? 5.0 : -7.2, sg > 0 ? 7.2 : -5.0, UP, BT + 0.5, LZ - 2.9, LZ + 2.9, gq);   // (coverage round) grassed, not a block of paper
      for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) {
        const xa = sg * (5.2 + j * 1.05 + (k % 2) * 0.3), y = BT + 0.1 - k * 1.25;
        near.add([xa, y, LZ - 3.1], [xa + sg * 0.9, y + lrng.range(-0.05, 0.05), LZ - 3.1], 0.9, pal.rose, { strength: lrng.range(0.75, 0.95) });
      }
    }
    // (fourth polish) THE GATE IS A THING WITH PARTS, low and stocky, on the RIGHT bank (the lane's long side), so it never
    // stands across the cumulus and its posts barely clear the horizon: two posts and a lintel, each ONE heavy cream stroke
    // (the heaviest marks of the gate, three times a stay or a chain); a slatted leaf lifted to 80 degrees beside it; a
    // pair of short balance beams tipped back, the orange counterweight the one chunky block at their tail; chains and stays a
    // third of a post. Nothing reaches over the canal, so no mark crosses the view.
    const GS = 1, HG = GS * 5.5, LEAF = 5.6, tipX = HG - GS * LEAF * Math.cos(80 * D2R), tipY = 0.6 + LEAF * Math.sin(80 * D2R), jb = () => lrng.range(-0.06, 0.06), PX = GS * 6.75, PT = 7.0;
    const gate = style.batch();                                                 // its own batch: a heavy hand, no dry streaks (mesh grain 0.35, streak 0.1)
    for (const dz of [-2.4, 2.4]) {
      gate.add([PX - GS * 0.1 + jb(), BT + 0.6, LZ + dz - 0.46], [PX - GS * 0.1 + jb(), PT + 0.25, LZ + dz - 0.46], 0.95, timber, { strength: 1, bow: jb() });   // gate post: one heavy stroke
      gate.add([PX + GS * 3.0, PT - 1.3, LZ + dz], [PX - GS * 3.0, PT + 1.15, LZ + dz], 0.5, timber, { strength: 1, bow: 0.08 });                    // balance beam, tipped back
      gate.add([PX - GS * 2.95, PT + 1.1, LZ + dz], [tipX, tipY, LZ + dz], 0.16, pal.lavender, { strength: 1 });                                     // chain
      gate.add([HG, 0.6, LZ + dz * 0.92], [tipX, tipY, LZ + dz * 0.92], 0.36, timber, { strength: 1 });                                             // the leaf's side beam
      near.add([-GS * 5.5, BT + 0.5, LZ + dz], [-GS * 5.5, BT + 1.75, LZ + dz], 0.3, pal.white, {});                                                // rail post on the far abutment
    }
    gate.add([PX - GS * 0.1, PT - 0.3, LZ - 2.9], [PX - GS * 0.1, PT - 0.3, LZ + 2.9], 0.85, timber, { strength: 1 });                              // lintel
    gate.add([PX + GS * 3.0, PT - 1.55, LZ - 1.9], [PX + GS * 3.0, PT - 1.55, LZ + 1.9], 1.25, hour === 'night' ? pal.lavender : pal.orange, { strength: 1 }); // counterweight
    for (let k = 1; k <= 4; k++) { const t = k / 4.5; gate.add([HG + (tipX - HG) * t, 0.6 + (tipY - 0.6) * t, LZ - 2.1], [HG + (tipX - HG) * t, 0.6 + (tipY - 0.6) * t, LZ + 2.1], 0.5, pal.white, { strength: 0.9 }); }   // the leaf's slats
    near.add([-GS * 5.5, BT + 1.7, LZ - 2.5], [-GS * 5.5, BT + 1.7, LZ + 2.5], 0.3, pal.white, { strength: 0.9 });
    scene.add(gate.mesh({ grain: 0.35, streak: 0.1 }));
    // the hand cart at the foot of the ramp: a paper box on two cream wheels, heaped with dabs in every stick
    const CX = -27.5, CZ = LZ - 0.2, cartCols = hour === 'dawn' || hour === 'night' ? style.sticks : [pal.scarlet, pal.rose, pal.orange, pal.cream, pal.lilac, pal.white];
    box(CX - 1.7, CX + 1.7, UP + 0.75, UP + 1.5, CZ - 0.9, CZ + 0.9);
    for (const o of [-1.0, 1.0]) near.add([CX + o, UP + 0.35, CZ - 1.05], [CX + o, UP + 1.25, CZ - 1.05], 0.95, timber, { kind: 2 });
    near.add([CX - 1.7, UP + 1.15, CZ - 1.0], [CX + 1.7, UP + 1.15, CZ - 1.0], 0.5, pal.lavender, { strength: 0.85 });
    near.add([CX + 1.7, UP + 1.3, CZ], [CX + 3.6, UP + 1.0, CZ], 0.22, pal.lavender, {});                                           // the shaft
    for (let i = 0; i < 30; i++) {
      const hx = lrng.range(-1.5, 1.5), hz = lrng.range(-0.8, 0.8), hy = UP + 1.5 + 0.7 * (1 - hx * hx / 2.4) * lrng.range(0.5, 1);
      near.add([CX + hx, hy, CZ + hz], [CX + hx + lrng.range(-0.1, 0.1), hy + 0.55, CZ + hz], lrng.range(0.4, 0.55), lrng.pick(cartCols), { kind: 2, off: 0.12 });
    }
    await ctx.yield();
    // the farmhouse: a pyramid of orange roof strokes over one white line, its tarred walls left as paper
    const FX = -118, FZ = 118;
    box(FX - 7, FX + 7, UP, UP + 4.6, FZ - 4, FZ + 4);
    for (let k = 0; k < 7; k++) {
      const y = UP + 5.0 + k * 0.95, hw = 7.6 - k * 1.05;
      quad([FX - hw, y - 0.5, FZ - 4.3 + k * 0.5], [FX + hw, y - 0.5, FZ - 4.3 + k * 0.5], [FX + hw - 1, y + 0.5, FZ - 3.8 + k * 0.5], [FX - hw + 1, y + 0.5, FZ - 3.8 + k * 0.5]);
      near.add([FX - hw + wrng.range(-0.3, 0.3), y, FZ - 4.6 + k * 0.5], [FX + hw + wrng.range(-0.3, 0.3), y + wrng.range(-0.1, 0.1), FZ - 4.6 + k * 0.5], 0.92, pal.orange, { strength: wrng.range(0.85, 1), bow: wrng.range(-0.1, 0.1) });
    }
    near.add([FX - 6.6, UP + 3.4, FZ - 4.4], [FX + 6.4, UP + 3.3, FZ - 4.4], 0.5, pal.white, {});
    const VOID = { add() {} };
    for (let d0 = 150, fp = new THREE.Vector3(), ft = new THREE.Vector3(); d0 < 640;) {
      const len = wrng.range(26, 52);
      for (const sg of [-1, 1]) for (let r = 0; r < 6; r++) {                // (second polish) the flank is grassed to its foot: seen from the polder it is a green dyke
        const o = sg * (r ? 5.75 + 0.1 * r : 4.85), y = [BT + 0.2, -1.5, -4.5, -7.5, -10.4, -12.9][r], dd = d0 + wrng.range(-8, 8);   // a fringe on the bank top, a hatch down its sheer flank
        if (sg < 0 && dd < 160) continue;                                        // the first mill stands there
        canal.posAtDist(dd + len, fp); canal.tangentAtDist(dd + len, ft); const a = [fp.x + ft.z * o, y, fp.z - ft.x * o];
        canal.posAtDist(dd, fp); canal.tangentAtDist(dd, ft);
        // (third polish) beside the lane of the lift the flank is not hatched along its length: it is stroked DOWN the slope
        // (in the low batch, below), so the long strokes whose middle falls there are left out (their random draws are kept)
        const tgt = sg < 0 && r && dd + len * 0.5 > 176 && dd + len * 0.5 < 404 ? VOID : near;   // (fourth polish) from the mill on: the whole right flank is pulled down its slope
        tgt.add(a, [fp.x + ft.z * o, y - 0.1, fp.z - ft.x * o], r ? wrng.range(2.3, 3.0) : wrng.range(0.5, 0.8), wrng.chance(0.12) ? pal.cream : pal.green, { strength: r ? wrng.range(0.66, 0.95) : wrng.range(0.5, 0.8), bow: wrng.range(-0.3, 0.3) });
        if (r) {                                                               // a second pass, half a stroke on, so the grass has no bare panels
          const d2 = dd + len * wrng.range(0.4, 0.6), l2 = len * wrng.range(0.7, 1), y2 = y - 1.5;
          canal.posAtDist(d2 + l2, fp); canal.tangentAtDist(d2 + l2, ft); const a2 = [fp.x + ft.z * (o + sg * 0.06), y2, fp.z - ft.x * (o + sg * 0.06)];
          canal.posAtDist(d2, fp); canal.tangentAtDist(d2, ft);
          tgt.add(a2, [fp.x + ft.z * (o + sg * 0.06), y2 - 0.1, fp.z - ft.x * (o + sg * 0.06)], wrng.range(1.3, 2.2), wrng.chance(0.3) ? pal.cream : pal.green, { strength: wrng.range(0.62, 0.92), bow: wrng.range(-0.3, 0.3) });
        }
      }
      d0 += len + wrng.range(-6, 3);
    }
    scene.add(near.mesh({}));
    await ctx.yield();

    // ---- reeds at the water's edge all along the canal, and the hatch of grass on the banks of leg one
    const reeds = [], rrng = ctx.rng.fork('pb-reeds'), rp = new THREE.Vector3(), rt = new THREE.Vector3();
    for (let i = 0, n = Math.round(6000 * detail); i < n; i++) {
      const d = -6 + rrng() * 436, sg = rrng.sign(), o = sg * rrng.range(3.85, 4.45);
      canal.posAtDist(d, rp); canal.tangentAtDist(d, rt);
      style.dab(reeds, rp.x + rt.z * o, 0, rp.z - rt.x * o, rrng.range(0.5, 1.0) * (d > 170 ? 0.75 : 1), rrng.range(0.09, 0.14), rrng.chance(0.28) ? pal.cream : pal.green, 0);
      if (i % 1500 === 1499) await ctx.yield();
    }
    for (let i = 0, n = Math.round(2600 * detail); i < n; i++) {
      const z = -6 + rrng() * 138, sg = rrng.sign(), o = sg * rrng.range(4.6, 5.15);
      style.dab(reeds, o, BT, z, rrng.range(0.3, 0.55), rrng.range(0.14, 0.22), rrng.chance(0.1) ? pal.cream : pal.green, 0);
    }
    scene.add(await style.dabs(reeds, { far: 130, lean: 0.4 }));
    await ctx.yield();

    // ---- the small cumulus: heaped strokes on paper, drifting toward us on the wind
    const crng = ctx.rng.fork('pb-clouds'), cb = style.batch(), discs = [], nC = clear ? 2 : 9;
    for (let i = 0; i < nC; i++) {
      const az = (-58 + (i + crng.range(0.1, 0.9)) * (150 / nC)) * D2R, dist = crng.range(800, 1900), w = crng.range(120, 200) * (dist / 1000);
      const cx = -Math.sin(az) * dist + 100, cz = Math.cos(az) * dist + 500, base = crng.range(0.2, 0.36) * dist;
      const dc = Math.atan2(cx - 100, cz - 150) - Math.atan2(972, 2202);
      if (Math.abs(dc) < 0.4) continue;                      // never in front of the great cumulus
      const h = style.heap(cb, { center: [cx, base, cz], width: w, height: w * crng.range(0.36, 0.5), toward: [60, 250], lumps: 7, strokes: 34, rng: crng, open: 1, under: pal.orange });
      discs.push(...h.discs);
    }
    const cloudG = new THREE.Group(), cm = cb.mesh({ shade: false, finger: false, grain: 0.35, cap: 0.5 }); cm.renderOrder = 2;
    const cloudBody = style.paper({ side: THREE.DoubleSide, color: pal.white.clone().multiplyScalar(0.87), grain: 0.1 }); trash.push(cloudBody);
    const cd = new THREE.Mesh(style.paperDiscs(discs), cloudBody); cd.frustumCulled = false; cloudG.add(cd, cm); scene.add(cloudG);
    ticks.push((dt, time) => { cloudG.position.z = 300 - ((time * style.windSpeed) % 2200); });
    await ctx.yield();

    // ---- the drawbridge: a white double bascule, both leaves lifted, and the ring between them (one stroke, ends overlapping)
    const NX = HZ, NZ = -HX, br = style.batch(), rim = style.batch(), brng2 = ctx.rng.fork('pb-bridge'), tq = [];
    const bp3 = (lat, y, al) => [endX + NX * lat + HX * al, y, endZ + NZ * lat + HZ * al];
    for (const sg of [-1, 1]) {
      // the piers: slim paper pylons standing on the polder floor, each with one lavender stroke down its sunlit face
      box(endX + NX * sg * 9.6 - 1.5, endX + NX * sg * 9.6 + 1.5, -14.3, 1.3, endZ + NZ * sg * 9.6 - 1.7, endZ + NZ * sg * 9.6 + 1.7, tq);   // (sixth round) the pier is the tower's own foot, in the white stick: seen from the side it is no black post
      // (third polish) the box is square to the world and the bridge is not, so the stroke stands clear of its nearest corner,
      // on the side we come from: one broad press of lavender a third of the pier wide, top to floor, paper either side of it
      br.add(bp3(sg * 9.6 - 0.25, 1.0, -3.1), bp3(sg * 9.6 - 0.1 + brng2.range(-1, 1) * 0.15, -13.4, -3.1), 1.7, pal.lavender, { strength: 1, bow: 0.12 });
      // (coverage round) THE RING'S SURROUND IS SOLID: each side one broad white tower (gate posts and the lifted leaf laid side by
      // side as heavy strokes), one thick balance beam tipped back over it, a lintel and a cream counterweight. No thin stays, slats or back stays: nothing pokes round the ring.
      for (const al of [-2.6, 2.6]) {
        const j = () => brng2.range(-0.08, 0.08);
        br.add(bp3(sg * 9.7 + j(), 1.3, al), bp3(sg * 9.7 + j(), 16.2, al), 1.5, pal.white, { strength: 1 });                        // gate post
        br.add(bp3(sg * 8.75, 1.5, al), bp3(sg * 8.45, 9.6, al), 0.95, pal.white, { strength: 1 });                                 // the leaf, lifted against the post
        br.add(bp3(sg * 13.8, 13.0, al), bp3(sg * 4.4, 20.4, al), 1.15, pal.white, { strength: 1, bow: 0.1 });                      // balance beam, tipped back
      }
      br.add(bp3(sg * 9.7, 15.9, -3.0), bp3(sg * 9.7, 15.9, 3.0), 1.3, pal.white, { strength: 1 });
      br.add(bp3(sg * 13.9, 12.7, -2.8), bp3(sg * 13.9, 12.7, 2.8), 1.7, pal.cream, { strength: 1 });                               // counterweight
    }
    for (let k = 0; k < 20; k++) {
      const a0 = (95 + k * 18.5) * D2R, a1 = (95 + (k + 1) * 18.5 + 2) * D2R, R = 7.35 + (k / 20) * 0.22;
      rim.add(bp3(Math.cos(a0) * R, PY + Math.sin(a0) * R, -0.2), bp3(Math.cos(a1) * R, PY + Math.sin(a1) * R, -0.2), 0.62 - k * 0.012, pal.white, { kind: k === 19 ? 0 : 4, strength: 1 - k * 0.012 });
    }
    // (sixth round) each tower is a BUILT THING: a white upright (a body in the white stick; the strokes of its posts and lintels
    // lie inside it and are not seen; the lifted leaf's stroke runs beside it on the ring's side and is seen).
    // (ninth round) NEAR THE GATE THE TOWERS ARE DRAWN, NOT FILLED: their faces go into a body of their own (tw) in which the white
    // stick is pulled DOWN each face in separate boards with paper between them, by the body's own drawn mode (paper({ dir }),
    // live's for the grassed dyke). The shader's cell is 1.15 of its across measure and the measure here runs 1.15 / 0.5 to the
    // metre along the heading and along its normal both, so a CELL is half a metre on every wall face (a board fills 0.74 to all of
    // its cell, 7 in 100 are left out). open (1, 2): the paper between boards shows only where a gap of the mean width would be
    // a pixel of a 1080-line frame, and fully where it would be two; farther off the tower is the filled white stick as before
    // (gaps under a pixel were broken dashes that changed from frame to frame; on frames under 1080 lines some remain). The level
    // tops, never seen, are hatched on a cell of 0.35 m. The piers stay filled, in live's body (tq).
    // NOT IN THE NIGHT HOUR: there the faces go into live's body and the towers are filled as before (hour is the world's own
    // look: its first draw, or the hour a visitor asks); against a night sky of open paper the gaps opened the towers' outline.
    const tw = hour === 'night' ? tq : [];
    for (const sg of [-1, 1]) {
      const c8 = (la, y, al) => bp3(sg * la, y, al), A = [8.95, 10.45], Y = [1.3, 16.5], Z = [-3.35, 3.35];
      for (const al of Z) q4(tw, c8(A[0], Y[0], al), c8(A[1], Y[0], al), c8(A[1], Y[1], al), c8(A[0], Y[1], al));
      for (const la of A) q4(tw, c8(la, Y[0], Z[0]), c8(la, Y[0], Z[1]), c8(la, Y[1], Z[1]), c8(la, Y[1], Z[0]));
      q4(tw, c8(A[0], Y[1], Z[0]), c8(A[1], Y[1], Z[0]), c8(A[1], Y[1], Z[1]), c8(A[0], Y[1], Z[1]));
    }
    mkBody(tq, pal.white, 0.05);
    if (tw !== tq) mkBody(tw, pal.white, 0.05, { dir: new THREE.Vector4(1.15 / 0.5 * (HX + NX), 1.15 / 0.5 * (HZ + NZ), 0.45, 1), open: new THREE.Vector2(1, 2) });
    scene.add(br.mesh({ grain: 0.35, streak: 0.1 }), rim.mesh({ shade: false, finger: false }));
    await ctx.yield();

    // ---- (second polish) THE LOW PASSAGE: rows of big separate tulips either side of the lane, drawn as flowers. A stem, a leaf
    // and a cup of two or three strokes of the row's own stick, heads at different heights, largest beside the lens.
    const low = style.batch(), wrl = ctx.core.makeRng(ctx.core.hashSeed('pb-low:' + ctx.seed)), FL = -14 + 0.06, wrl0 = wrl, FL0 = FL;
    const stripeAt = (x) => { for (const q of hero.stripes) if (Math.abs(x - q.x) < q.w / 2 - 0.25) return q; return null; };
    // the pale stick where the sun strikes a cup (form takes three sticks at most: the pale one, the local one, paper)
    const paleOf = (c) => { for (const k of c === pal.scarlet ? [pal.orange, pal.rose, pal.white] : c === pal.white ? [pal.cream, pal.rose] : [pal.white, pal.cream, pal.rose]) if (!k.equals(c)) return k; return c; };
    // (fourth polish) W = { x, z, fl, R }: the same flower planted at a world point on another floor with its own generator (the tulip bank)
    const tulip = (lx, lz, k, q, W) => {
      const wrl = W ? W.R : wrl0, FL = W ? W.fl : FL0, cxA = W ? 1 : -0.643, czA = W ? 0 : 0.766;
      const [x, z] = W ? [W.x, W.z] : L2W(lx, lz), h = 1.3 * k, sw = wrl.range(0.04, 0.1), jx = wrl.range(-0.12, 0.12) * k, sg = wrl.sign();
      const tx = x + cxA * jx, tz = z + czA * jx, ty = FL + h * 0.68, ax = cxA * k, az = czA * k;   // (ax, az): across the lane
      low.add([x, FL, z], [tx, ty + 0.05, tz], 0.09 * k + 0.02, pal.green, { off: sw, strength: 1 });
      for (const e of [sg, -sg]) low.add([x, FL, z], [x + e * ax * wrl.range(0.3, 0.46), FL + h * wrl.range(0.4, 0.62), z + e * az * 0.4], wrl.range(0.22, 0.3) * k, pal.green, { bow: e * 0.1 * k, off: sw, strength: 1 });
      if (q.kind === 'green') { low.add([tx, ty - 0.1, tz], [tx, ty + 0.2 * k, tz], 0.13 * k, pal.cream, { off: sw * 1.3 }); return; }   // already headed: a bud
      const open = wrl.range(0.13, 0.25), ph = wrl.range(0.36, 0.46) * k;
      if (crop === 'hyacinth') {                                               // a spike: four presses of the stick up the stem, the top one pale
        for (let j = 0; j < 4; j++) { const y = ty - 0.22 * k + j * 0.17 * k; low.add([tx, y, tz], [tx, y + 0.22 * k, tz], (0.25 - 0.03 * j) * k, j === 3 ? q.pale : q.c, { kind: 2, off: sw * 1.3 }); }
        return;
      }
      if (crop === 'daffodil') {                                               // a star laid open, an orange trumpet pressed in the middle
        for (const e of [-1, 1]) low.add([tx, ty, tz], [tx + e * ax * 0.3, ty + 0.16 * k * (0.4 + wrl()), tz + e * az * 0.3], 0.2 * k, q.c, { bow: e * 0.05 * k, off: sw * 1.3 });
        low.add([tx, ty - 0.02, tz], [tx, ty + 0.3 * k, tz], 0.18 * k, q.c, { off: sw * 1.3 });
        low.add([tx, ty - 0.03, tz], [tx, ty + 0.13 * k, tz], 0.15 * k, q.c === pal.orange ? pal.cream : pal.orange, { kind: 2, off: sw * 1.3 });
        return;
      }
      // (third polish) the cup is an egg with a notched top: two outer petals in the row's stick that part at the hip and close
      // again at the tip round one pale petal, half as wide as it is tall, so a cup never touches its neighbour's
      const hip = 0.035 + open * 0.12;
      for (const e of [-1, 1]) low.add([tx + e * ax * 0.03, ty - 0.03, tz + e * az * 0.03], [tx + e * ax * 0.045, ty + ph, tz + e * az * 0.045], 0.135 * k, q.c, { bow: e * hip * k, off: sw * 1.3, strength: 1 });
      if (k > 0.72) low.add([tx, ty + 0.03, tz], [tx + wrl.range(-0.02, 0.02), ty + ph * 0.9, tz], 0.1 * k, q.pale, { off: sw * 1.3, strength: 1 });
    };
    {
      const rowsN = Math.max(6, Math.round(10 * detail)); let nt = 0;
      for (const sg of [-1, 1]) for (let r = 0; r < rowsN; r++) {
        const o = sg * (1.6 + r * 1.2), lx = LX + o, q0 = stripeAt(lx);
        if (!q0 || q0.kind === 'ditch') continue;
        const q = { c: q0.c, kind: q0.kind, pale: paleOf(q0.c) }, kr = 1.16 - 0.045 * Math.abs(o), step = (r < 2 ? 1.22 : r < 4 ? 1.0 : 0.86) + 0.05 * Math.abs(o);   // the rows beside the lens are planted wider: paper between the cups
        for (let lz = 14 - wrl() * step; lz > -104; lz -= step * wrl.range(0.7, 1.35)) {
          tulip(lx + wrl.range(-0.22, 0.22), lz, kr * wrl.range(0.72, 1.2) * (1 + 0.55 * sstep(-12, 14, lz)), q);   // (sixth round) larger toward the head, where the eye is high
          if (++nt % 250 === 0) await ctx.yield();
        }
      }
      // (sixth round) THE WEDGE IS FLOWERS FROM END TO END. At the head of the lane (where we swoop in from 16 m up) and beyond its
      // old end (where we lift past the poplars and look down on it) the rows go on as big single tulips, drawn twice and one
      // and a half times the size and planted that much wider, wherever the wedge between the embankment and the mill dyke has floor
      const xrl = ctx.core.makeRng(ctx.core.hashSeed('pb-low2:' + ctx.seed)), dykeX = (lz) => -22.8 + 102.8 * (91.9 - lz) / 151.9;
      for (const [za, zb, ks] of [[33, 14, 2.0], [-104, -149, 1.5]]) for (const sg of [-1, 1]) for (let r = 0; r < rowsN; r += 2) {
        const o = sg * (1.6 + r * 1.2), lx = LX + o, q0 = stripeAt(lx);
        if (!q0 || q0.kind === 'ditch') continue;
        const q = { c: q0.c, kind: q0.kind, pale: paleOf(q0.c) }, step = 1.15 * ks;
        for (let lz = za - xrl() * step; lz > zb; lz -= step * xrl.range(0.75, 1.3)) {
          const jx = xrl.range(-0.3, 0.3), kk = ks * xrl.range(0.78, 1.18);
          if (lx > dykeX(lz) - 10.5 || lx < 8 || (za < 0 && Math.abs(lx - LX - 10.5) < 2.2)) continue;   // the dyke's foot, the embankment's, the poplars of the lift
          tulip(lx + jx, lz, kk, q);
          if (++nt % 250 === 0) await ctx.yield();
        }
      }
    }
    // ---- (fourth polish) THE TULIP BANK: big single tulips on bare paper right of the canal, from the lane to the first mill,
    // drawn well over life size because we see them from 11 m up. The turning shadow of the sails goes over them: every stroke
    // is taken whole (the shader works the blade out at the stroke's own foot), so a flower goes to paper petal by petal.
    {
      const brg = ctx.core.makeRng(ctx.core.hashSeed('pb-bank:' + ctx.seed)), W = { x: 0, z: 0, fl: UP + 0.05, R: brg }; let nb = 0;
      for (const st of upl) {
        if (!(st.x < 0 && st.x > -BANKX) || st.kind === 'ditch') continue;
        const rows = Math.max(1, Math.round(st.w / 2.1)), q = { c: st.c, kind: st.kind, pale: paleOf(st.c) }, far = Math.min(1, Math.max(0, (-st.x - 8) / 34));
        for (let r = 0; r < rows; r++) {
          const x0 = st.x + (rows > 1 ? (r / (rows - 1) - 0.5) * (st.w - 1.5) : 0), step = (2.0 + 0.5 * far) / Math.sqrt(Math.max(0.6, detail));
          for (let z = BANKZ + brg() * step; z < (st.x > -16 ? 152 : Math.min(st.z1, 178)) - 1; z += step * brg.range(0.75, 1.3)) {
            if (Math.hypot(x0 + 20, z - 165) < 11.5 || Math.abs(z - LANE) < 3.6) continue;   // the mill's mound; the lane
            W.x = x0 + brg.range(-0.35, 0.35); W.z = z;
            tulip(0, 0, (2.35 - 0.5 * far) * brg.range(0.78, 1.22), q, W);
            if (++nb % 120 === 0) await ctx.yield();
          }
        }
      }
    }
    // the ditch down the middle of the lane: strokes of reflected sky between the rows, sliding and laid again
    for (let i = 0; i < 46; i++) {
      const lz = 12 - i * 2.5 + wrl.range(-2, 2), len = wrl.range(7, 16), o = wrl.range(-0.45, 0.45), wh = wrl.chance(0.28);
      const [x0, z0] = L2W(LX + o, lz - len), [x1, z1] = L2W(LX + o + wrl.range(-0.15, 0.15), lz);
      low.add([x0, FL + 0.16, z0], [x1, FL + 0.16, z1], wrl.range(0.7, 1.25), wh ? pal.white : pal.cerulean, { lay: 1, strength: wh ? 0.75 : wrl.range(0.85, 1), bow: wrl.range(-0.12, 0.12), phase: wrl(), period: wrl.range(5, 10), off: wrl.range(-8, 8) });
    }
    // the canal in the bend and on the embankment: more strokes of reflected sky, laid again and again
    for (let i = 0, cp1 = new THREE.Vector3(), cp2 = new THREE.Vector3(); i < 96; i++) {
      const d0 = 150 + i * 2.85 + wrl.range(-2, 2), len = wrl.range(10, 24), o = wrl.range(-3.5, 3.5), wh = wrl.chance(0.3);
      canal.posAtDist(d0 + len, cp1); canal.tangentAtDist(d0 + len, cp2); const a = [cp1.x + cp2.z * o, 0.05, cp1.z - cp2.x * o];
      canal.posAtDist(d0, cp1);
      low.add(a, [cp1.x + cp2.z * o, 0.05, cp1.z - cp2.x * o], wrl.range(1.1, 2.2), wh ? pal.white : i % 3 ? pal.cerulean : pal.lavender, { lay: 1, strength: wh ? 0.7 : wrl.range(0.8, 1), phase: wrl(), period: wrl.range(5, 10), off: wrl.range(-8, 8) });
    }
    await ctx.yield();
    // the pickers' baskets and their cart beside the lane, and a row of poplars beyond it where we lift
    const lowCols = hour === 'dawn' || hour === 'night' ? style.sticks : [pal.scarlet, pal.rose, pal.orange, pal.cream, pal.lilac, pal.white];
    // (fourth polish) a basket is ONE squat orange shape with a cream rim and a bunch of six cut tulips standing in it (a green
    // stroke below, a narrow cup above), clearly smaller than a picker; none stands nearer the lane than 4.6 m
    const krg = ctx.core.makeRng(ctx.core.hashSeed('pb-basket:' + ctx.seed));
    const basket = (lx, lz, k = 1) => {
      const [x, z] = L2W(lx, lz), ax = -0.643 * k, az = 0.766 * k;
      for (let i = 0; i < 7; i++) { wrl.range(-0.45, 0.45); wrl.range(0.5, 0.85); wrl.pick(lowCols); }      // (the draws the old heap took)
      low.add([x - ax * 0.5, FL + 0.26 * k, z - az * 0.5], [x + ax * 0.5, FL + 0.26 * k, z + az * 0.5], 0.52 * k, hour === 'night' ? pal.lavender : pal.orange, { strength: 1, bow: -0.06 * k });
      low.add([x - ax * 0.56, FL + 0.56 * k, z - az * 0.56], [x + ax * 0.56, FL + 0.56 * k, z + az * 0.56], 0.13 * k, pal.cream, { strength: 1 });
      for (let i = 0; i < 6; i++) {
        const a = ((i - 2.5) / 2.5) * 0.4 + krg.range(-0.05, 0.05), lean = a * 0.35 + krg.range(-0.05, 0.05), h0 = FL + 0.58 * k, h1 = h0 + krg.range(0.5, 0.75) * k;
        low.add([x + ax * a, h0, z + az * a], [x + ax * (a + lean * 0.5), h1, z + az * (a + lean * 0.5)], 0.07 * k, pal.green, { strength: 1, off: 0.03 });
        low.add([x + ax * (a + lean * 0.5), h1 - 0.03 * k, z + az * (a + lean * 0.5)], [x + ax * (a + lean * 0.75), h1 + 0.3 * k, z + az * (a + lean * 0.75)], 0.15 * k, krg.pick(lowCols), { strength: 1, off: 0.04 });
      }
    };
    for (const [bx, bz, bk] of [[-3.5, -44, 1.1], [3.7, -57, 1.15], [-3.9, -62, 1.1], [3.5, -71, 1.15], [5.9, -64, 1.0], [-4.9, -79, 1.0], [-3.4, -33, 1.0], [3.6, -88, 1.0]]) basket(LX + bx, bz, bk);   // (coverage round) one at arm's length before each picker
    {
      const [cx, cz] = L2W(LX + 5.2, -68.5);                                   // the cart: a paper box on two cream wheels, heaped with dabs
      box(cx - 1.5, cx + 1.5, FL + 0.7, FL + 1.45, cz - 1.0, cz + 1.0);
      for (const o of [-1.0, 1.0]) low.add([cx - 0.643 * o - 0.9, FL + 0.3, cz + 0.766 * o - 0.7], [cx - 0.643 * o - 0.9, FL + 1.25, cz + 0.766 * o - 0.7], 1.0, pal.cream, { kind: 2 });
      low.add([cx - 1.3, FL + 1.1, cz + 0.6], [cx + 0.2, FL + 1.1, cz - 1.5], 0.5, pal.lavender, { strength: 0.9 });
      for (let i = 0; i < 34; i++) {
        const a = wrl.range(-1.3, 1.3), b = wrl.range(-0.8, 0.8), hy = FL + 1.45 + 0.75 * (1 - a * a / 1.9) * wrl.range(0.4, 1);
        low.add([cx + a, hy, cz + b], [cx + a + wrl.range(-0.1, 0.1), hy + 0.5, cz + b], wrl.range(0.36, 0.5), wrl.pick(lowCols), { kind: 2, off: 0.1 });
      }
    }
    // poplars: tall flames of upward strokes, every one leaning a little downwind. An avenue of eight stands at the foot of the
    // embankment beside the low passage (we lift over the dyke just past the last of them), six more line the lane beyond
    // (small round) THE LEE FLANK IN PAPER. Form takes a pale stick, the local one and paper, and a full poplar had the first two. Each
    // bough that reaches more than a quarter of wd (0.25 m; 0.425 m on the lift avenue) to the side away from the sun gets two narrow
    // presses of the paper's own colour, laid firm, so that side is hatched with paper. The two presses of a bough have its two ends, moved
    // 0.3 m off the flame's plane to either face, and run straight between them (the bough bows up to 0.3 m to one side of that line): so,
    // square on and at rest, a press lies inside its bough's ribbon from heel to tip but for an edge on about three presses in a hundred
    // (by 0.075 m at most); in the gust its tip can pass its bough's edge by up to 0.19 m. NOT IN THE NIGHT HOUR (the bough loop says why). The sun is the
    // land's own (0.75 of the wind's axis less 0.66 of its right hand, in hero space: the part file's two numbers, typed here again)
    const pShade = [], psr = ctx.core.makeRng(ctx.core.hashSeed('pb-poplar-shade:' + ctx.seed)), pSunH = [WLX * 0.75 - WLZ * 0.66, WLZ * 0.75 + WLX * 0.66], pPaper = pal.paper.clone().multiplyScalar(1 / 0.87),   // (the stroke shader writes 0.87 of a colour: what is shown is the paper's colour itself)
      pLee = (pSunH[0] * CS + pSunH[1] * SN) * -0.643 + (-pSunH[0] * SN + pSunH[1] * CS) * 0.766 > 0 ? -1 : 1;   // which way along the flame's axis that sun does NOT stand
    const poplar = (lx, lz, H, young = 0.2, FL = -14 + 0.06, wd = 1) => {      // young: the share of cream strokes (April leaf); FL: where it stands
      const [x, z] = L2W(lx, lz), n = Math.max(20, Math.round(34 * detail));   // (coverage round) a full tree: a flame of heavy strokes over three long ones up its middle
      for (const e of [-0.55, 0, 0.55]) low.add([x + e * wd * 1.5 * -0.643, FL + H * (0.13 + 0.05 * Math.abs(e)), z + e * wd * 1.5 * 0.766], [x + e * wd * 0.4 * -0.643, FL + H * (0.96 - 0.12 * Math.abs(e)), z + e * wd * 0.4 * 0.766], wd * (e ? 1.9 : 2.5), pal.green, { strength: 1, off: 0.5, bow: e * 0.5 });
      low.add([x + 0.25, FL, z], [x + 0.1, FL + H * 0.3, z], 0.5, pal.lavender, { strength: 0.9, off: 0.1 });
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1), y0 = FL + H * (0.1 + 0.62 * t) + wrl.range(-0.6, 0.6), spread = wd * (0.9 + 2.1 * Math.sin(Math.PI * Math.min(1, t * 1.25))) * wrl.range(-1, 1), len = H * wrl.range(0.2, 0.3) * (1 - 0.3 * t);
        low.add([x + spread * 0.4 * -0.643, y0, z + spread * 0.4 * 0.766], [x + spread * -0.643, y0 + len, z + spread * 0.766], wrl.range(1.0, 1.7), wrl.chance(young) ? pal.cream : pal.green,
          { bow: wrl.range(-0.3, 0.3), off: wrl.range(0.3, 1.0) * (0.4 + t), strength: wrl.range(0.8, 1) });
        if (hour !== 'night' && spread * pLee > wd * 0.25) {                                         // a bough of the lee flank: its presses sway on its bough's own beat (the batch's seed of the stroke just laid; the beat only: a press's reach at the tip is 0.65 (0.4 + t), its bough's is 0.3 to 1.0 times (0.4 + t)), 0.3 m off the flame's plane on both of its faces; NOT IN THE NIGHT HOUR, whose sky is three parts in four open paper: paper hatched on a flank against it reads as the tree torn away (four strangers of four, in the run with neutral paths, took live's night; a run of the same sheet that I had said beforehand would not be used said two and two), so at night the poplars stand as they did
          const o = { off: 0.65 * (0.4 + t), strength: psr.range(0.85, 1), seed: ((low.count - 1) * 0.618034 + 0.137) % 1 };   // (0.618034 and 0.137 are the batch's own law for a stroke's default seed, the part file's, typed here again)
          for (const f of [-0.3, 0.3]) pShade.push([[x + spread * 0.4 * -0.643 + f * 0.766, y0, z + spread * 0.4 * 0.766 + f * 0.643], [x + spread * -0.643 + f * 0.766, y0 + len, z + spread * 0.766 + f * 0.643], 0.55, o]);
        }
      }
    };
    // (third polish) the foot avenue stops where we begin to lift (six trees), and THE AVENUE OF THE LIFT stands on the far bank
    // of the embankment canal, against the sky: five whole trees stepping away toward the bridge, seen over the canal as we rise
    for (let i = 0; i < 6; i++) poplar(8.6 + wrl.range(-0.5, 0.5), -30 - i * 9.6 + wrl.range(-1.5, 1.5), wrl.range(14, 18.5), 0.7);
    for (let i = 0; i < 5; i++) poplar(-5.8 + wrl.range(-0.2, 0.2), -99 - i * 10.2 + wrl.range(-1, 1), wrl.range(16.5, 19), 0.45, BT, 1.7);
    // the outer flank of the bend: short strokes that keep to the curve (a long chord there lies buried in the bank)
    for (let d = 158, fp = new THREE.Vector3(), ft = new THREE.Vector3(); d < 262; d += 9) for (let r = 1; r < 6; r++) {
      const o = -(6.0 + 0.1 * r), y = [-1.5, -4.5, -7.5, -10.4, -12.9][r - 1] + wrl.range(-0.6, 0.6), dd = d + wrl.range(-3, 3);
      canal.posAtDist(dd + 13, fp); canal.tangentAtDist(dd + 13, ft); const a = [fp.x + ft.z * o, y, fp.z - ft.x * o];
      canal.posAtDist(dd, fp); canal.tangentAtDist(dd, ft);
      VOID.add(a, [fp.x + ft.z * o, y - 0.1, fp.z - ft.x * o], wrl.range(3.2, 4.2), wrl.chance(0.05) ? pal.cream : pal.green, { strength: wrl.range(0.66, 0.95), bow: 0.2 });   // (fourth polish) left out: see the flank below (the draws are kept)
    }
    for (let i = 0; i < 6; i++) poplar(LX + 10.5 + wrl.range(-0.6, 0.6), -104 - i * 12.5 + wrl.range(-2, 2), wrl.range(17, 23));
    // (small adding round) THE EIGHTH MILL stands on a mound of its own in the wedge between the embankment and the mill dyke, beyond
    // the white bridge: its axis MIDWAY between the embankment's foot and the mill dyke's foot, 100 m past the bridge's line. Tarred
    // black like the seven, so it is bare paper: a hole in the sky drawn by lavender strokes down the sunlit flank and under the rail, a white
    // gallery rail and its posts, a cream stroke on the cap, the white lattice of the stocks and the visit's own sailcloth, an arc
    // of smeared sky behind each tip. Its sails face down the wind and turn on the land's own sail clock (the hero's spin material
    // and axle). RULE OF THE PLACE: no part of it nearer the course's line than 100 m and none inside the embankment, the dyke or
    // the lane (on this route the rule holds on every seed; were it to fail, the mill would not be built). Stream 'pb-mill8' (the strokes' seeds, the sails' speed).
    await ctx.yield();
    await (async () => {                                                      // a function of its own, called here once: it is compiled when it is called, in a step of its own, and not with build()
      const mr = ctx.core.makeRng(ctx.core.hashSeed('pb-mill8:' + ctx.seed)), d2 = hero.mills[2].base, d3 = hero.mills[3].base;   // the dyke runs from its second mill to its third past this place
      const MZ = -173 - 100, slope = Math.hypot(d3[0] - d2[0], d3[2] - d2[2]) / Math.abs(d3[2] - d2[2]);
      const bankFoot = prof[prof.length - 1][0], dykeFoot = d2[0] + (d3[0] - d2[0]) * (MZ - d2[2]) / (d3[2] - d2[2]) - 9 * slope, MX = (bankFoot + dykeFoot) / 2;   // the two feet at that z (hero-local x), and the middle
      const y0 = -8, H = 30, L = 17, rb = H * 0.15, rt = H * 0.072, yb = y0 + H * 0.8, rAt = (y) => rb + (rt - rb) * (y - y0) / (H * 0.8), yg = y0 + H * 0.34, rg = rAt(yg) * 1.55;
      const AX = [style.wind.x * CS - style.wind.y * SN, 0, style.wind.x * SN + style.wind.y * CS], RX = [AX[2], 0, -AX[0]];   // the wind in hero-local metres; RX = up x AX
      const on = (a, r, y) => [MX + AX[0] * a + RX[0] * r, y, MZ + AX[2] * a + RX[2] * r], W = (p) => { const [x, z] = L2W(p[0], p[2]); return [x, p[1], z]; };
      const hub = on(rt * 1.25 + 1.6, 0, y0 + H * 0.86), bw = L * 0.115 * 1.22, sweep = L + bw * 0.45;   // the cloth as broad as the second dyke mill's rule; the arcs' outer reach
      // the clearance, counted: the mound's foot, the cap's tip and the whole circle the sails and their arcs sweep
      let least = 1e9;
      const probe = (p) => { const q = W(p); least = Math.min(least, path.distanceTo(q[0], q[1], q[2])); };
      for (let k = 0; k < 24; k++) { const a = k / 24 * 6.2832; probe([MX + Math.cos(a) * 10, -14, MZ + Math.sin(a) * 10]); probe([hub[0] + RX[0] * Math.cos(a) * sweep, hub[1] + Math.sin(a) * sweep, hub[2] + RX[2] * Math.cos(a) * sweep]); }
      probe([MX, y0 + H, MZ]);
      const stands = least >= 100 && MX - 10 - sweep > Math.max(bankFoot, 14) && MX + 10 + sweep < dykeFoot && MZ + 10 + sweep < -150;   // clear of the course, the embankment (and the bridge's beams, to local x 14), the dyke's foot, the lane's end
      await ctx.yield();
      if (stands) {
        const ring = (r, y, n, rot) => { const o = []; for (let k = 0; k < n; k++) { const a = rot + k / n * 6.2832; o.push(W([MX + Math.cos(a) * r, y, MZ + Math.sin(a) * r])); } return o; };
        const cone = (T, ya, yc, ra, rc, n, rot = 0) => { const a = ring(ra, ya, n, rot), c = ring(rc, yc, n, rot); for (let k = 0; k < n; k++) q4(T, a[k], a[(k + 1) % n], c[(k + 1) % n], c[k]); };
        cone(gq, -14.3, y0, 10, 6.5, 10); cone(gq, y0, y0 + 0.02, 6.5, 0.1, 10);          // the mound: ten sides, grassed, its top level
        cone(pp, y0 - 1, yb, rb, rt, 8, 0.39); cone(pp, yb, y0 + H * 0.93, rt * 1.25, rt, 8); cone(pp, y0 + H * 0.93, y0 + H, rt, rt * 0.2, 8);   // the tower and its cap: paper
        cone(pp, yg - 0.5, yg, rAt(yg), rg, 8, 0.39); cone(pp, yg, yg + 0.01, rg, 0.1, 8, 0.39);                                               // the gallery
        const r2 = rAt(yb - 1), sd = () => mr();
        low.add(W(on(r2 * 0.95, -r2 * 0.42, yb - 0.6)), W(on(rb * 1.0, -rb * 0.46, y0 + 0.6)), rb * 0.42, pal.lavender, { bow: 0.25, strength: 0.92, seed: sd() });
        low.add(W(on(r2 * 1.0, r2 * 0.12, yb - 2.5)), W(on(rb * 1.05, rb * 0.1, y0 + H * 0.12)), rb * 0.26, pal.lavender, { bow: -0.2, strength: 0.7, seed: sd() });
        low.add(W(on(rg * 1.02, -rg * 1.12, yg + 1.15)), W(on(rg * 1.02, rg * 1.12, yg + 1.05)), 0.42, pal.white, { seed: sd() });
        low.add(W(on(rg * 1.02, -rg * 1.05, yg + 0.15)), W(on(rg * 1.02, rg * 1.02, yg + 0.2)), 0.3, pal.lavender, { strength: 0.6, seed: sd() });
        for (let k = -2; k <= 2; k++) low.add(W(on(rg * 1.03, k * rg * 0.5, yg + 1.2)), W(on(rg * 1.03, k * rg * 0.5, yg + 0.1)), 0.2, pal.white, { strength: 0.8, seed: sd() });
        low.add(W(on(rt * 1.3, -rt * 1.25, y0 + H * 0.87)), W(on(rt * 1.3, rt * 1.2, y0 + H * 0.88)), H * 0.035, pal.cream, { bow: -rt * 0.35, seed: sd() });
        // the sail cross and its arcs, in the sail plane about the hub (hero-local), as the seven are laid
        const cross = style.batch(), smear = style.batch(), piv = [hub[0], hub[1], hub[2], mr.range(0.8, 1.25)], cloth = pal[hour === 'dawn' ? 'white' : sailcloth] || pal.scarlet;
        for (let k = 0; k < 4; k++) {
          const ca = Math.cos(k * Math.PI / 2 + 0.3 * 7), sa = Math.sin(k * Math.PI / 2 + 0.3 * 7), P2 = (px, py, pz) => [px * ca - py * sa, px * sa + py * ca, pz];
          cross.add(P2(bw * 0.52, L * 0.2, 0.05), P2(bw * 0.5, L * 0.99, 0.05), bw * 0.86, cloth, { pivot: piv, strength: 0.95, bow: 0.1, seed: sd() });
          cross.add(P2(0, -L * 0.04, 0.2), P2(0, L, 0.2), Math.max(0.42, L * 0.022), pal.white, { pivot: piv, seed: sd() });
          cross.add(P2(bw, L * 0.2, 0.2), P2(bw, L * 0.995, 0.2), Math.max(0.3, L * 0.014), pal.white, { pivot: piv, strength: 0.9, seed: sd(), off: 1 });
          for (let j = 0; j < 7; j++) { const yy = L * (0.2 + 0.8 * j / 6); cross.add(P2(-0.1, yy, 0.25), P2(bw + 0.15, yy, 0.25), Math.max(0.26, L * 0.012), pal.white, { pivot: piv, strength: 0.85, seed: sd(), off: 1 }); }
          const R2 = L - bw * 0.2, s50 = Math.sin(50 * D2R), c50 = Math.cos(50 * D2R);
          smear.add(P2(bw * 0.5, R2, 0.1), P2(R2 * s50, R2 * c50, 0.1), bw * 1.25, pal.white, { pivot: piv, kind: 3, strength: 0.8, bow: R2 * 0.094, seed: sd() });
        }
        const crossMesh = cross.mesh({ spin: true }), smearMesh = smear.mesh({ spin: true, add: true, shade: false });   // the hero's own two spin materials (one for each kind of mesh): its axle, its turn
        smearMesh.renderOrder = 5; hero.object.add(crossMesh, smearMesh); trash.push(crossMesh.geometry, smearMesh.geometry);
      }
      await ctx.yield();
    })();
    // (fourth polish) THE FLANK BESIDE THE LIFT IS A GRASSED BANK, not a fence: three passes of narrow strokes pulled down the
    // slope (top, middle, foot), every one a different length, bowed, leaning downwind, overlapping its neighbours, ragged along
    // both sides and running dry for its last third (mesh rag 1), cream flecks among the green; and along the bank top a
    // fringe of short upright grass tips that stand against the sky, so the top is never a ruled line
    const flank = style.batch(), frg = ctx.core.makeRng(ctx.core.hashSeed('pb-flank:' + ctx.seed)), fq = new THREE.Vector3(), fu = new THREE.Vector3();
    const onFlank = (d, o, y) => { canal.posAtDist(d, fq); canal.tangentAtDist(d, fu); return [fq.x - fu.z * o, y, fq.z + fu.x * o]; };   // o metres to the right of the canal's axis
    // it runs from the first mill round the outside of the bend (the wedge under the swoop) to the bridge
    for (let pass = 0; pass < 3; pass++) for (let d = 178; d < 410; d += frg.range(0.6, 1.45)) {
      const yT = pass === 0 ? BT + frg.range(-0.5, 0.25) : pass === 1 ? frg.range(-6.5, -2.5) : frg.range(-11, -7.5);
      const yB = pass === 0 ? frg.range(-7.5, -3) : pass === 1 ? frg.range(-12.5, -8.5) : -13.9 + frg.range(0, 0.5);
      const xa = 5.45 + (BT - yT) * 0.045, xb = 5.5 + (BT - yB) * 0.06, lean = frg.range(-0.5, 2.3) * (yT - yB) / 7;
      (pass === 2 ? VOID : flank).add(onFlank(d, xa, yT), onFlank(d - lean, xb, yB), frg.range(0.4, 0.8), frg.chance(0.13) ? pal.cream : pal.green, { strength: frg.range(0.8, 1) - 0.12 * pass, bow: frg.range(-0.8, 0.8), off: 0.04, seed: frg() });
    }
    for (let d = 176; d < 412; d += frg.range(0.35, 0.9)) {
      const h = frg.range(0.7, 1.7), q0 = onFlank(d, 5.3 + frg.range(-0.25, 0.2), BT - 0.25);
      flank.add(q0, [q0[0], BT + h, q0[2]], frg.range(0.2, 0.34), frg.chance(0.2) ? pal.cream : pal.green, { strength: frg.range(0.85, 1), bow: frg.range(-0.1, 0.1), off: 0.3 * h, seed: frg() });
    }
    // the ring dyke where it leaves the canal beside the first mill (we look along it from the barge): its top is combed with
    // short ragged strokes and tufted along both edges, so it runs away as a grassed dyke and not as a wedge of bare paper
    for (let lx = -46; lx < 60; lx += frg.range(1.6, 3.2)) {
      const far = Math.max(0, lx) / 60, lz = 105.6 + frg() * 5, len = frg.range(3.5, 7) * (1 + far), [x0, z0] = L2W(lx, lz), [x1, z1] = L2W(lx + len, lz + frg.range(-0.5, 0.5));
      flank.add([x0, UP + 1.07, z0], [x1, UP + 1.07, z1], frg.range(0.8, 1.5), frg.chance(0.15) ? pal.cream : pal.green, { lay: 1, strength: frg.range(0.8, 1), bow: frg.range(-0.3, 0.3), seed: frg() });
      for (const ez of [111.2, 104.9]) { const [tx, tz] = L2W(lx + frg.range(0, 2), ez + frg.range(-0.2, 0.2)), h = frg.range(0.8, 1.7);
        flank.add([tx, UP + (ez > 108 ? 0.1 : 0.7), tz], [tx, UP + 1 + h, tz], frg.range(0.22, 0.36), frg.chance(0.2) ? pal.cream : pal.green, { strength: frg.range(0.85, 1), bow: frg.range(-0.1, 0.1), off: 0.3 * h, seed: frg() }); }
    }
    scene.add(flank.mesh({ cap: 0.5, rag: 1 }));
    for (const s of pShade) low.add(s[0], s[1], s[2], pPaper, s[3]);        // the poplars' shade goes into the batch last, so every stroke before it keeps its place in the batch
    const lowMesh = low.mesh({}); scene.add(lowMesh);
    await ctx.yield();

    // ---- fauna: handfuls of dabs moved by hand every frame (one draw call): mallard, the heron, the lapwing
    const frng = ctx.rng.fork('pb-fauna'), fb = style.batch();
    const pup = (w, c, kind = 0, strength = 1) => { fb.add([0, -9999, 0], [0, -9999, 0.1], w, c, { kind, strength, seed: frng() }); return fb.count - 1; };
    const ducks = [], laps = [];
    for (let i = 0; i < 14; i++) ducks.push({ i: [pup(0.26, pal.white), pup(0.26, pal.white), pup(0.25, pal.green, 2), pup(0.2, pal.orange, 2)], x: frng.range(-3.6, 3.6), z: frng.range(4, 13), r: frng(), ph: frng() * 6.28, h: (i * 5 % 14) / 13 });
    const herC = hour === 'golden' ? pal.lilac : pal.lavender;                 // (at the golden hour lavender is restruck as orange, and an orange bird is lost on the low sky)
    const hI = [pup(0.6, herC), pup(0.5, herC), pup(0.55, herC), pup(0.5, pal.white, 2), pup(0.3, pal.cream), pup(0.34, pal.white), pup(0.3, pal.white)];   // (sixth round) the neck and the hands of the wings are white: the bird stands out on the water and on the bands
    for (let i = 0; i < 40; i++) laps.push({ i: [pup(0.26, pal.white), pup(0.26, pal.white)], a: frng() * 6.28, b: frng() * 6.28, r: frng.range(3, 11), f: frng.range(0.5, 1.1), ph: frng() });
    // (fourth polish) A PICKER IS A BENT FIGURE: two leg strokes, a smock stroke that folds forward at the hip, an arm reaching
    // down into the row and a small white cap, bending and straightening. Seven work the small rows right of the canal before
    // the lane (each with a squat orange basket); six more work the rows of the low passage, none nearer the lane than 6.4 m.
    const pickers = [], fig = (c, K = 1) => [pup(0.2 * K, pal.lavender), pup(0.2 * K, pal.lavender), pup(0.52 * K, c), pup(0.15 * K, pal.cream), pup(0.27 * K, pal.white, 2)];
    for (let i = 0; i < 7; i++) pickers.push({ i: [...fig([pal.cerulean, pal.white, pal.lavender][i % 3]), pup(0.5, pal.orange)],
      x: -(11 + ((i * 5.3) % 13)), z: 60 + ((i * 9.7) % 21), y: UP, bx: 1, bz: 0, s0: -1, s1: 120, ph: frng() * 6.28, f: frng.range(0.7, 1.2), sg: frng.sign() });
    // (coverage round) the pickers of the low passage stand in the rows beside the lens, a third larger, each with a basket at arm's length
    [[-5.2, -44], [5.4, -57], [-5.6, -62], [5.2, -71], [7.6, -64], [-6.6, -79]].forEach(([ox, lz], i) => { const [x, z] = L2W(LX + ox, lz);
      pickers.push({ i: fig([pal.cerulean, pal.scarlet, pal.lilac][i % 3], 1.35), K: 1.35, x, z, y: -14, bx: -0.643, bz: 0.766, s0: 190, s1: S_BANK, ph: i * 1.7, f: 0.7 + 0.09 * i, sg: ox > 0 ? -1 : 1 }); });
    // (fourth polish) THE RARE VISIT, THE GREAT SKEIN: a hundred white geese in three chevrons come over our heads from behind as
    // we reach the first mill and fly on down the row of mills toward the cumulus, each a pair of wing strokes beating 1.6 times
    // a second. They keep to a track of four points (TRACK) and their distance along it is keyed to s (GD): they come over us
    // at the lane, stream ahead through the sky left of the sails while we pass the mill, and then draw away
    const geese = [], TRACK = [[12, 17, 30], [14, 22, 200], [315, 56, 857], [811, 82, 1665]], GD = [[60, -15], [90, 125], [111, 191], [150, 262], [190, 335], [250, 450], [460, 930]];
    if (rare) [41, 33, 27].forEach((n, c) => { for (let j = 0; j < n; j++) { const r = Math.ceil(j / 2), sd = j % 2 ? 1 : -1;
      geese.push({ i: [pup(0.55, pal.white), pup(0.55, pal.white)], lag: c * 20 + r * 2.2 + frng.range(-0.5, 0.5), lat: [0, -14, 8][c] - (sd > 0 ? r * 2.6 : -r * 1.3) + frng.range(-0.3, 0.3), dy: [0, 5, -3][c] + frng.range(-0.6, 0.6), ph: frng() * 6.28 }); } });   // the longer arm of each chevron is on the left, away from the sails
    // (fourth polish) TWO KITES over the mill dyke, right of the second mill as we swoop (a breezy April afternoon): each a diamond of two
    // strokes of one stick with a cream spar, a tail of five small presses that snakes downwind, and a line to the ground
    // (sixth round) A KITE IS PLAINLY A KITE: a diamond of its stick (a real quadrilateral with the paper's grain), a pale cross spar
    // and a long one, and a tail of five separate presses that snakes below it. No line is drawn (a line that thin breaks into dots).
    const kiteGeo = new THREE.BufferGeometry(); kiteGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.42, 0, -0.3, 0.12, 0, 0.3, 0.12, 0, -0.3, 0.12, 0, 0, -0.58, 0, 0.3, 0.12, 0], 3)); trash.push(kiteGeo);
    const kites = [[66, 20, -8, 6.2, pal.scarlet, pal.cream], [88, 31, -14, 7.4, pal.cream, pal.white]].map(([lx, ky, lz, hk, c, pale], i) => { const [x, z] = L2W(lx, lz);
      const mt = style.paper({ side: THREE.DoubleSide, color: c.clone().multiplyScalar(0.87), grain: 0.08 }), m = new THREE.Mesh(kiteGeo, mt); m.frustumCulled = false; m.scale.setScalar(hk); scene.add(m); trash.push(mt);
      return { x, y: ky, z, h: hk, ph: i * 2.1, m, i: [pup(hk * 0.05, pale), pup(hk * 0.05, pale), ...[0, 1, 2, 3, 4].map((j) => pup(hk * 0.17, j % 2 ? pale : c, 2))] }; });
    const hW = [pup(0.5, pal.white), pup(0.44, pal.white)];              // (sixth round) the heron's two hand strokes
    const trackAt = (d, o, t) => {
      for (let k = 0; k < 3; k++) {
        const a = TRACK[k], b = TRACK[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        if (d <= l || k === 2) { const q = d / l; o[0] = a[0] + (b[0] - a[0]) * q; o[1] = a[1] + (b[1] - a[1]) * q; o[2] = a[2] + (b[2] - a[2]) * q; const h = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; t[0] = (b[0] - a[0]) / h; t[1] = (b[2] - a[2]) / h; return; }
        d -= l;
      }
    };
    const fm = fb.mesh({ shade: false, finger: false }), fA = fm.geometry.attributes.aA, fB = fm.geometry.attributes.aB;
    fA.setUsage(THREE.DynamicDrawUsage); fB.setUsage(THREE.DynamicDrawUsage); fm.renderOrder = 4; scene.add(fm);
    const put0 = (i, ax, ay, az, bx, by, bz) => { const A = fA.array, Bq = fB.array, k = i * 3; A[k] = ax; A[k + 1] = ay; A[k + 2] = az; Bq[k] = bx; Bq[k + 1] = by; Bq[k + 2] = bz; };
    const put = put0, gP = [0, 0, 0], gT = [0, 1];
    const hide = (i) => put(i, 0, -9999, 0, 0, -9999, 0.1), lp = new THREE.Vector3(), lt = new THREE.Vector3(), hA = [0, 0, 0], hB = [0, 0, 0];
    const HK = 1.8, hput = (i, ax, ay, az, bx, by, bz) => put(i, hA[0] + (ax - hA[0]) * HK, hA[1] + (ay - hA[1]) * HK, hA[2] + (az - hA[2]) * HK, hA[0] + (bx - hA[0]) * HK, hA[1] + (by - hA[1]) * HK, hA[2] + (bz - hA[2]) * HK);   // the heron, a third over life size
    ticks.push((dt, time, camera, u, s, camPos) => {
      const q = s - 66;                                                        // mallard: up from under the bow at 66 m, wheeling off left
      for (const d of ducks) {
        if (q < 0 || q > 75) { for (const i of d.i) hide(i); continue; }
        // they scatter as they rise: each to its own height between the bank and well over the horizon, the near ones held close
        const x = d.x * 0.8 + 0.0075 * q * q * (0.6 + d.r), z = 71 + d.z * 1.35 + (1.03 + 0.26 * d.r) * q + 0.004 * q * q, y = 0.3 + (2.6 + 5.4 * d.h) * (1 - Math.exp(-q / (4 + 5 * d.r))) + 0.0022 * q * q * (1 + d.r);
        const vx = 0.015 * q * (0.6 + d.r), vl = Math.hypot(vx, 1.3), fx = vx / vl, fz = 1.3 / vl, fl = 0.12 + Math.sin(time * 24 + d.ph) * 0.55;
        // (third polish) one compact bird: two narrow wing strokes in a shallow V from the body, a small green press touching
        // the front and a small orange one touching the rear (each a third of a wing), so the fourteen read as a flock, not confetti
        const fv = 0.16 + 0.3 * Math.sin(time * 24 + d.ph);
        put(d.i[0], x - fz * 0.03, y, z + fx * 0.03, x + fz * 0.72, y + fv, z - fx * 0.72); put(d.i[1], x + fz * 0.03, y, z - fx * 0.03, x - fz * 0.72, y + fv, z + fx * 0.72);
        put(d.i[2], x + fx * 0.04, y + 0.02, z + fz * 0.04, x + fx * 0.36, y + 0.07, z + fz * 0.36); put(d.i[3], x - fx * 0.04, y - 0.03, z - fz * 0.04, x - fx * 0.3, y - 0.1, z - fz * 0.3);
      }
      // (sixth round) THE HERON IS A BIRD: it stands on the right bank some 33 m ahead of us at the bend, unfolds at 138 m and rows
      // across the canal ahead of us just under the horizon, seen side-on: two bent wings (an arm and a hand stroke each) beating
      // slowly, a kinked neck with the white head leading, cream legs trailing. It keeps to the canal as we leave it, and is
      // gone to the left before the swoop.
      const h = sstep(138, 146, s), g = Math.min(4.3, Math.max(0, (s - 143) / 22));
      // (it leaves the right bank and rows away over the polder to the right of the canal, just under the horizon, so that from the reveal it is seen whole against the band of bare paper; then it draws far ahead along the embankment)
      const hAt = (gg, o) => { const ex = Math.max(0, gg - 2.2), dC = Math.min(415, 178 + 22 * gg + 45 * ex * Math.sqrt(ex)), oL = -5.2 - 14 * sstep(0.05, 1.2, gg); canal.posAtDist(dC, lp); canal.tangentAtDist(dC, lt);
        o[0] = lp.x + lt.z * oL; o[1] = BT + 1.0 + 0.7 * h + 2.6 * sstep(0, 0.5, gg); o[2] = lp.z - lt.x * oL; return o; };
      if (s < 90 || s > 236) { for (const i of hI) hide(i); for (const i of hW) hide(i); }
      else {
        const [hx, hy, hz] = hAt(g, hA), [qx, , qz] = hAt(g + 0.03, hB), dl = Math.hypot(qx - hx, qz - hz) || 1, fx = g > 0 ? (qx - hx) / dl : -0.5, fz = g > 0 ? (qz - hz) / dl : 0.866;
        const fl = Math.sin(time * 6.2) * h, f2 = Math.sin(time * 6.2 - 0.9) * h, up = 1 - h, sx = -fz, sz = fx;   // up: folded, standing; (sx, sz): across the bird
        for (let w = 0; w < 2; w++) {                                          // a wing: the arm rises from the shoulder, the hand bends over and down
          const e = w ? -1 : 1, ex = hx + sx * e * 0.55 * h - fx * 0.2 * h, ey = hy + 0.2 + (0.55 + 0.75 * fl) * h - 0.75 * up, ez = hz + sz * e * 0.55 * h - fz * 0.2 * h;
          hput(hI[w], hx + fx * 0.1, hy + 0.12, hz + fz * 0.1, ex, ey, ez);
          if (h > 0.05) hput(hW[w], ex, ey, ez, ex + sx * e * 0.75 - fx * 0.55, ey + (0.9 * f2 - 0.45) * h, ez + sz * e * 0.75 - fz * 0.55); else hide(hW[w]);
        }
        hput(hI[2], hx + fx * 0.75 * h, hy + 0.05 + 0.35 * up, hz + fz * 0.75 * h, hx - fx * 0.95 * h, hy - 0.1 * h - 0.75 * up, hz - fz * 0.95 * h);                    // body
        const kx = hx + fx * (0.75 * h + 0.5), ky = hy + 0.5 + 0.5 * up, kz = hz + fz * (0.75 * h + 0.5);                                                                 // the kink of the neck
        hput(hI[5], hx + fx * 0.7 * h, hy + 0.08 + 0.35 * up, hz + fz * 0.7 * h, kx, ky, kz); hput(hI[6], kx, ky, kz, kx + fx * 0.5, ky - 0.22 + 0.5 * up, kz + fz * 0.5);
        hput(hI[3], kx + fx * 0.45, ky - 0.2 + 0.5 * up, kz + fz * 0.45, kx + fx * 1.1, ky - 0.3 + 0.5 * up, kz + fz * 1.1);                                               // the white head, leading
        hput(hI[4], hx - fx * 0.9 * h, hy - 0.12 * h - 0.75 * up, hz - fz * 0.9 * h, hx - fx * (0.9 + 1.5 * h), hy - 0.3 * h - 2.0 * up, hz - fz * (0.9 + 1.5 * h));     // legs, trailing
      }
      for (const k of pickers) {
        if (s < k.s0 || s > k.s1) { for (const i of k.i) hide(i); continue; }
        const K = k.K || 1, put = (i, ax, ay, az, bx, by, bz) => put0(i, k.x + (ax - k.x) * K, k.y + (ay - k.y) * K, k.z + (az - k.z) * K, k.x + (bx - k.x) * K, k.y + (by - k.y) * K, k.z + (bz - k.z) * K);
        const bend = 0.5 + 0.5 * Math.sin(time * k.f + k.ph), fx = k.bx * k.sg, fz = k.bz * k.sg, hy = k.y + 1.15;          // drawn a little over life size
        const sx = k.x + fx * (0.2 + 0.72 * bend), sy = hy + 0.98 - 0.62 * bend, sz = k.z + fz * (0.2 + 0.72 * bend);        // the shoulder
        put(k.i[0], k.x - fx * 0.26, k.y + 0.05, k.z - fz * 0.26, k.x - fx * 0.05, hy, k.z - fz * 0.05); put(k.i[1], k.x + fx * 0.22, k.y + 0.05, k.z + fz * 0.22, k.x + fx * 0.05, hy, k.z + fz * 0.05);   // legs
        put(k.i[2], k.x, hy - 0.12, k.z, sx, sy, sz);                                                                              // the smock, folding at the hip
        put(k.i[3], sx + fx * 0.05, sy - 0.08, sz + fz * 0.05, sx + fx * (0.3 + 0.1 * bend), sy - 0.5 - 0.35 * bend, sz + fz * (0.3 + 0.1 * bend));   // the arm, reaching into the row
        put(k.i[4], sx + fx * 0.1, sy + 0.04, sz + fz * 0.1, sx + fx * 0.24, sy + 0.34, sz + fz * 0.24);                        // the white cap
        if (k.i.length > 5) put(k.i[5], k.x + fx * 0.95 - 0.36, k.y + 0.28, k.z + fz * 0.95 + 0.3, k.x + fx * 0.95 + 0.36, k.y + 0.28, k.z + fz * 0.95 + 0.3);   // a squat basket at the feet
      }
      for (const k of kites) {
        const sw = Math.sin(time * 0.6 + k.ph), x = k.x + sw * 5 + Math.sin(time * 1.7 + k.ph) * 1.2, y = k.y + Math.sin(time * 0.83 + k.ph * 2) * 3, z = k.z - 3 * Math.cos(time * 0.6 + k.ph), h = k.h, tl = 0.3 * sw;
        const yaw = Math.atan2(camPos.x - x, camPos.z - z), rx = Math.cos(yaw), rz = -Math.sin(yaw), nx = Math.sin(yaw) * 0.08, nz = Math.cos(yaw) * 0.08, ct = Math.cos(tl), st = Math.sin(tl);
        k.m.position.set(x, y, z); k.m.rotation.set(0, yaw, tl);
        const P = (px, py, o, j) => { const qx = (px * ct - py * st) * h, qy = (px * st + py * ct) * h; o[j] = x + rx * qx + nx; o[j + 1] = y + qy; o[j + 2] = z + rz * qx + nz; };
        const kq = k.q || (k.q = new Float64Array(6));
        P(-0.3, 0.12, kq, 0); P(0.3, 0.12, kq, 3); put(k.i[0], kq[0], kq[1], kq[2], kq[3], kq[4], kq[5]);                    // the cross spar
        P(0, 0.42, kq, 0); P(0, -0.58, kq, 3); put(k.i[1], kq[0], kq[1], kq[2], kq[3], kq[4], kq[5]);                         // the long spar
        for (let j = 0; j < 5; j++) { const q = 0.16 + j * 0.36, wv = Math.sin(time * 2.2 - j * 0.9 + k.ph) * h * (0.08 + 0.05 * j) + st * h * q * 0.6, tx = kq[3] + rx * wv, tz = kq[5] + rz * wv; put(k.i[2 + j], tx, kq[4] - q * h, tz, tx, kq[4] - (q + 0.2) * h, tz); }
      }
      // the great skein (rare): wings up and down, three chevrons strung along the track
      let gd = -1e3; for (let k = 0; k < GD.length - 1; k++) if (s >= GD[k][0] && s <= GD[k + 1][0]) gd = GD[k][1] + (GD[k + 1][1] - GD[k][1]) * (s - GD[k][0]) / (GD[k + 1][0] - GD[k][0]);
      for (const b of geese) {
        const d = gd - b.lag;
        if (d < -90) { hide(b.i[0]); hide(b.i[1]); continue; }
        trackAt(d, gP, gT);
        const x = gP[0] - gT[1] * b.lat, y = gP[1] + b.dy + 0.5 * Math.sin(time * 0.7 + b.ph), z = gP[2] + gT[0] * b.lat, fl = 0.2 + 1.1 * Math.sin(time * 10 + b.ph);
        put(b.i[0], x, y, z, x - gT[1] * 2.5, y + fl, z + gT[0] * 2.5 - gT[1] * 0.0); put(b.i[1], x, y, z, x + gT[1] * 2.5, y + fl, z - gT[0] * 2.5);
      }
      // lapwing (third polish): forty small bent ticks, two narrow strokes meeting at an angle, tumbling low over the rows
      // between the lane and the foot avenue some 60 m ahead of us (never beside the lens, never high in the sky); the bend
      // of each tick opens and closes 2.5 times a second, and as we lift the flop slides away to the right over the fields
      const on = s > 205 && s < S_BANK + 30;
      const clx = (camPos.x - OX) * CS - (camPos.z - OZ) * SN, clz = (camPos.x - OX) * SN + (camPos.z - OZ) * CS;
      const away = Math.max(0, -58 - clz), fcx = 15 + away * 1.5, fcz = Math.min(20, clz) - 60 + away * 0.25, fcy = -14 + 5.6 + away * 0.1;
      for (const b of laps) {
        if (!on) { hide(b.i[0]); hide(b.i[1]); continue; }
        const t = time * b.f, lx = fcx + Math.cos(t * 0.9 + b.a) * b.r * 0.62 + Math.sin(t * 0.37 + b.b) * 2.4, lz = fcz + Math.sin(t * 0.8 + b.b) * b.r * 1.5;
        const y = fcy + 2.3 * Math.sin(t * 1.3 + b.a) + 1.2 * Math.sin(t * 0.5 + b.b), [x, z] = L2W(lx, lz);
        const cr = Math.cos(t * 0.8 + b.a), sr = Math.sin(t * 0.8 + b.a), dn = 0.14 + 0.42 * Math.sin((time * 2.5 + b.ph) * 6.2832);
        put(b.i[0], x, y, z, x + cr * 0.9, y + dn, z + sr * 0.9); put(b.i[1], x, y, z, x - cr * 0.9, y + dn, z - sr * 0.9);
      }
      fA.needsUpdate = true; fB.needsUpdate = true;
    });
    await ctx.yield();

    // ---- all the paper bodies of the world in one mesh
    mkBody(gq, pal.green, 0.12, { dir: new THREE.Vector4(0.5, 0.866, 0.45, 1) }); mkBody(wq, hour === 'dawn' ? pal.white : hour === 'night' ? pal.lavender : pal.cerulean, 0.14);   // (sixth round) at dawn the sky is rose, so the water is the cream stick: the canal is told from the sky   // at dawn the water takes the low sky's rose, so it parts from the lavender of sky and dyke mkBody(rq, pal.cream, 0.16);
    const paperGeo = new THREE.BufferGeometry(); paperGeo.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    const paperMat = style.paper({ side: THREE.DoubleSide });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat); paperMesh.frustumCulled = false; scene.add(paperMesh);
    await ctx.yield();

    const nearU = hero.field.material.uniforms.uNear;
    const camPos = new THREE.Vector3(), poiP = new THREE.Vector3(), poiV = new THREE.Vector3();
    return {
      scene, path, duration: 41, title: 'Stripes of April',
      pace: (u) => 1 - 0.2 * sstep(0.26, 0.31, u) * (1 - sstep(0.4, 0.45, u)) - 0.24 * sstep(0.56, 0.62, u) * (1 - sstep(0.76, 0.82, u)) + 0.12 * sstep(0.46, 0.5, u) * (1 - sstep(0.54, 0.58, u)),
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 26, sway: 0.25, bank: 0.08 },
      pois: [
        // the lingering pass: the gaze is held so that the first mill's tower stands in the right third, scumble on both sides of it
        { at: (time, u) => {
          path.pointAt(u, poiP); const beta = Math.atan2(poiP.x + 20, Math.max(1, 165 - poiP.z)), g = Math.max(0, beta - 0.44) * (1 - sstep(0.95, 1.14, beta));   // released as the tower comes abeam
          return poiV.set(poiP.x - Math.sin(g) * 60, EYE + 5, poiP.z + Math.cos(g) * 60);
        }, from: 0.2, to: 0.335, weight: 0.88, fade: 0.3 },
        // (coverage round) THE REVEAL: as the first mill comes abeam the gaze leaves it for the polder, down the row of dyke
        // mills toward the cumulus, so no part of the tower stands cut off at the frame's edge
        { at: (() => { const [x, z] = L2W(251, -534); return [x, 12, z]; })(), from: 0.3, to: 0.455, weight: 0.8, fade: 0.3 },
        // the swoop: the gaze goes to the second mill on its dyke, then down the row of mills as we level out among the tulips
        { at: (() => { const h = hero.mills[1].hub, [x, z] = L2W(h[0], h[2]); return [x, h[1] - 8, z]; })(), from: 0.44, to: 0.66, weight: 0.5, fade: 0.25 },
        { at: (() => { const [x, z] = L2W(150, -330); return [x, -2, z]; })(), from: 0.63, to: 0.74, weight: 0.35, fade: 0.3 },
        // the lift: the gaze stays on the avenue of poplars at the dyke's foot and the canal beyond, not on the empty zenith
        { at: (() => { const [x, z] = L2W(9, -168); return [x, 3, z]; })(), from: 0.72, to: 0.86, weight: 0.75, fade: 0.3 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#F7F3EA', glow: 0, revealDistance: 240 },
      post: { exposure: EXPO, bloom: { strength: 0, radius: 0.1, threshold: 1.5 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        const s = u * LEN;
        camPos.setFromMatrixPosition(camera.matrixWorld);
        hero.update(dt, time, camera);
        hero.cumulus.position.x = 1100 * sstep(318, 394, s);                    // (sixth round) the great cumulus has drawn clear of the bridge by the time we come back over the bank: nothing white stands behind the white towers
      nearU.value = 0.92 - 0.6 * sstep(-3, -10.5, camPos.y);                  // low among the big tulips the field strokes near the lens thin to a dusting on paper
        for (let i = 0; i < ticks.length; i++) ticks[i](dt, time, camera, u, s, camPos);
        style.update(dt, time, camera);
      },
      dispose() { hero.dispose(); style.tooth.dispose(); for (const t of trash) t.dispose(); },
    };
  },
};
