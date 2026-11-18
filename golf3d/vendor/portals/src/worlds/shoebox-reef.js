// The Shoebox Reef: a school-shelf coral reef inside a cardboard box, flown at fish scale on a card turtle hauled along its string.
// Style: corrugated card, poster paint, tape, thread, kitchen foil and hung cellophane (all shading from ../parts/shoebox-reef.js).
// +Z is the course; floor y 0, lid y 190; the box is 300 m wide, its back wall at z 235 with the exit hole in it.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as PART from '../parts/shoebox-reef.js';

const { paintBuffers, cardGeometry, ribbonBuffers, addFastener, addCylinder } = PART;
const BOX = { x0: -150, x1: 150, z0: -44, z1: 235, top: 190 };
const HUB = { x: 0, z: 140 };                       // centre stage: the coral head, the manta over it
const TURN_R = 36, Y0 = 58, YA = 66, Y1 = 74;         // the turn: radius 36 m, rising from y 66 to y 74 under a manta whose belly is at y 82
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// a flat rectangle into paint buffers: corner o, edge vectors a and b, normal n; brush coordinates run along a
function rect(B, o, a, b, n, col, kind, edge = 9) {
  const la = Math.hypot(a[0], a[1], a[2]), lb = Math.hypot(b[0], b[1], b[2]);
  const bu0 = o[0] * 0.37 + o[2] * 0.61 + o[1] * 0.2, bv0 = o[1] * 0.53 + o[0] * 0.29;
  const v = (s, t) => B.v(o[0] + a[0] * s + b[0] * t, o[1] + a[1] * s + b[1] * t, o[2] + a[2] * s + b[2] * t, n[0], n[1], n[2], col, bu0 + la * s, bv0 + lb * t, edge, kind);
  const i0 = v(0, 0), i1 = v(1, 0), i2 = v(1, 1), i3 = v(0, 1);
  const cx = a[1] * b[2] - a[2] * b[1], cy = a[2] * b[0] - a[0] * b[2], cz = a[0] * b[1] - a[1] * b[0];
  if (cx * n[0] + cy * n[1] + cz * n[2] >= 0) B.idx.push(i0, i1, i2, i0, i2, i3); else B.idx.push(i0, i2, i1, i0, i3, i2);
}
// a closed outline of n points on an ellipse, each radius jittered a little (scissors, not compasses)
function finePaint(g, K) {
  const a = g.getAttribute('aPaint');
  for (let i = 0; i < a.count; i++) { const kind = a.getW(i); a.setX(i, a.getX(i) * K); if (kind < 0.5) a.setY(i, a.getY(i) * K); a.setZ(i, a.getZ(i) * K); }
  return g;
}
function blob(rng, rx, rz, n, jit = 0.08) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (rng() - 0.5) * 2 * jit; out.push([Math.cos(a) * rx * k, Math.sin(a) * rz * k]); }
  return out;
}

export default {
  id: 'shoebox-reef', name: 'The Shoebox Reef', category: 'ocean', weirdness: 0.2,
  media: ['underwater', 'tiny', 'cable'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    // Every seeded family has a stream of its own, made from the world's seed and the family's name: none draws from another, and ctx.rng makes only the visit's own
    // draws (the edition: colourway, hour, cast, weather), which stay first.
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const density = (vary.density ?? 1) * detail;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PART.SBR_PALETTE[5]);        // set to the edition's wall colour below

    // ---------------------------------------------------------------- seeded edition: colourway, hour, cast
    const cold = rng.chance(0.3);                                  // a cold sea of green cellophane to a bottle-green wall
    const hourPick = rng.pick(['noon', 'noon', 'golden', 'dawn', 'night']);
    const hourName = vary.hour === 'day' ? 'noon' : (vary.hour === 'dawn' || vary.hour === 'golden' || vary.hour === 'night') ? vary.hour : hourPick;
    // each hour changes the lid, the thrown light, the gloss on the film, the light on the paint (pot colour times the hour's light, never greyed) and the cellophane and sugar paper themselves
    const HOURS = {
      noon: { lid: [1.0, 0.99, 0.965], crinkle: [0.80, 0.93, 1.0], gloss: [0.93, 0.98, 1.0], paint: [1, 1, 1], slant: [-0.21, 0], amt: 0.42, gain: 1.6, shadow: '#8C86B5', step: 0.8 },
      golden: { lid: [1.0, 0.80, 0.56], crinkle: [1.0, 0.80, 0.56], gloss: [1.0, 0.86, 0.68], paint: [1.0, 0.92, 0.78], blue: ['#F0A070', 0.13], deep: ['#5A2A8A', 0.34], slant: [-0.84, 0], amt: 0.5, gain: 1.5, shadow: '#7E64B4' },
      dawn: { lid: [1.0, 0.80, 0.86], crinkle: [1.0, 0.80, 0.88], gloss: [1.0, 0.88, 0.93], paint: [1.0, 0.88, 0.92], blue: cold ? ['#BFEBD2', 0.5] : ['#E4EEFA', 0.42], deep: cold ? null : ['#7C8AD8', 0.2], slant: [-0.36, 0.1], amt: 0.38, gain: 1.5, shadow: '#9390BE' },
      night: { lid: [0.30, 0.38, 0.60], crinkle: [0.50, 0.62, 0.95], gloss: [0.42, 0.52, 0.82], paint: [0.48, 0.54, 0.78], blue: ['#0E1A5E', 0.7], deep: ['#0A0A3A', 0.55], slant: [-0.21, 0.05], amt: 0.2, gain: 1.9, shadow: '#6A6AA6' },
    };
    const hour = HOURS[hourName] || HOURS.noon;
    const spottedCast = rng.chance(0.4);                           // cast: striped and spotted card fish (default), or an all-spotted shoal with pipe-cleaner seahorses and a paper-chain octopus
    const rain = rng.chance(0.25);                                 // weather: rain on the window, slow streaks sliding down every face instead of the crinkle light
    const rare = !!vary.rare;                                      // the gust
    const palette = PART.SBR_PALETTE.slice();
    if (cold) { palette[4] = '#5FC59A'; palette[5] = '#1C5A45'; palette[1] = '#C9A6E8'; palette[2] = '#F6F3E8'; }
    await ctx.yield();
    const style = PART.createStyle(ctx, palette);
    await ctx.yield();
    const pal = style.pal, SU = style.uniforms;
    const hourLight = new THREE.Color(...hour.paint);
    const hk = cold && hourName !== 'night' ? 0.45 : 1;                                   // (the green sea keeps its hue: a lighter touch of the hour)
    if (hour.blue) pal.blue.lerp(new THREE.Color(hour.blue[0]), hour.blue[1] * hk);          // the film itself takes the hour (pal.blue and pal.deep are the shared uniforms' own colours)
    if (hour.deep) pal.deep.lerp(new THREE.Color(hour.deep[0]), hour.deep[1] * hk);
    SU.uGloss = { value: new THREE.Color(...hour.gloss) };                                // what a fold of film or a bubble throws back: the lid
    scene.background.copy(pal.deep);
    SU.uDeepK.value.set(0.224, 0.252, 0.333); if (cold) SU.uDeepK.value.set(0.233, 0.265, 0.258);
    SU.uVeil.value.set(0.31, 1.24, 1);                   // each sheet takes the sugar paper behind it a plain step deeper: four even steps
    // the warm pots stay in every edition: whatever the colourway does to the water and the paper, anemones, fans, fish and the crab keep orange, pink, red and yellow
    pal.hot = new THREE.Color(PART.SBR_PALETTE[2]); pal.rose = new THREE.Color(PART.SBR_PALETTE[1]);
    const crepeA = new THREE.Color(cold ? '#8A6A3A' : PART.SBR_EXTRA.green), crepeB = new THREE.Color(cold ? '#6B4E2A' : PART.SBR_EXTRA.darkGreen);   // kelp-brown crepe in the cold sea
    SU.uCrinkleCol.value.setRGB(...hour.crinkle); SU.uSlant.value.set(...hour.slant); SU.uCrinkleAmt.value = hour.amt;
    SU.uFoilGain.value = hour.gain; SU.uShadowCol.value.set(hour.shadow); if (cold) SU.uShadowCol.value.lerp(new THREE.Color('#5B4E9E'), 0.6);   // on white and lilac coral the shadow must be clearly deeper than the lilac pot
    SU.uRain.value = rain ? 1 : 0; if (rain) SU.uCrinkleAmt.value *= 1.25;
    const night = hourName === 'night';
    for (const k of [crepeA, crepeB]) k.multiply(hourLight);
    for (const k of ['card', 'pink', 'orange', 'yellow', 'white', 'red', 'green', 'darkGreen', 'grey', 'tape', 'dowel', 'wool', 'black', 'pencil', 'wire', 'hot', 'rose']) pal[k].multiply(hourLight);
    style.setLid(0, (BOX.z0 + BOX.z1) / 2, BOX.x1 - BOX.x0, BOX.z1 - BOX.z0, BOX.top);
    // THE LID'S DOWELS (dealt here, built with the lid below): fourteen across the box, and between them thirteen gaps that the daylight comes down through.
    const DOWEL_Z = [];
    { const rdw = stream('sbr-dowels'), dz = (BOX.z1 - BOX.z0 - 20) / 13; for (let i = 0; i < 14; i++) DOWEL_Z.push([BOX.z0 + 10 + i * dz + (rdw() - 0.5) * 3, (rdw() - 0.5) * 4]); }
    // DAYLIGHT. Nine shafts come down through the gaps between the dowels and each lands as a pool on what it meets and stays there. Each has something of the box to
    // light: the coral head with the manta over it (the largest), the cups to starboard of the stage, the eel's egg cup, the bays of the run in, the garden's floor,
    // the hung things of the link, the floor to port of the stage, the floor beside the run in, and the wall round the hole (the bare paper there is the palest in
    // the box, and each sheet hung before it takes it a counted step deeper: the four partings stand as four frames, one inside another). A shaft stands where the
    // lid lets it: it leaves the lid on the middle line of the gap between two dowels that brings it down nearest its thing at this hour's slant, and its place
    // along the gap and its width are dealt from the shafts' own stream. Paint in a shaft is at its brightest, a clear step over paint outside, and a little warm;
    // sugar paper in a shaft is a pale pool in its own hue (not under the first two, which light paint only).
    // [x, z of the landing, its height, radius, half width of the bar of light drawn in the air, how far down the bar is drawn: the coral head's ends over the mobile]
    const LIT = [[HUB.x, 46, HUB.z, 38, 6.5, 0.535], [78, 0, 170, 8.5, 4.4, 1], [17, 57, 34, 13, 3.6, 1], [TURN_R, 74, 198, 24, 6, 1], [-36, 0, 18, 8, 4.2, 1],
      [56, 40, 96, 8, 4, 1], [-64, 0, 126, 9.5, 5, 1], [TURN_R + 24, 0, 181, 7.5, 3.8, 1], [TURN_R, 74, BOX.z1 - 3, 16, 4, 1]];
    const rsh = stream('sbr-shafts'), GAPS = DOWEL_Z.slice(1).map((d, i) => (d[0] + DOWEL_Z[i][0]) * 0.5);
    const SHAFTS = LIT.map(([x, h, z, r, hw, far], i) => { const zs = hour.slant[1] * (BOX.top - h); let g = GAPS[0];
      for (const q of GAPS) if (Math.abs(q + zs - z) < Math.abs(g + zs - z)) g = q;
      const k = i ? rsh.range(0.88, 1.12) : 1; return [x + (i ? rsh.range(-3, 3) : 0), g + zs, h, r * k, hw * k, far]; });
    SHAFTS.forEach((S, i) => SU.uPool.value[i].set(S[0], S[1], S[3], S[2]));
    SU.uPoolAmt.value.set(0.74, night ? 1.14 : 1.1, night ? 0 : hourName === 'golden' ? 0.16 : 0.07);   // (what is not in the daylight is a tone deeper; in it the pots are bright, clean and a little warm: peach at the golden hour)
    { const ht = hourName === 'golden' ? [1.0, 0.72, 0.42] : hourName === 'dawn' ? (cold ? [0.84, 1.0, 0.7] : [1.0, 0.8, 0.9]) : hour.crinkle; SU.uPoolTint.value.set(ht[0], ht[1], ht[2], night ? 0.22 : 0.42); }
    SU.uShAnchor.value.set(0, 0, 45, 0); SU.uShShift.value = 0;
    SU.uHinge.value.set(0.6, 0.38, 0.5, 26); SU.uTurtle.value.set(0.5, 1.25, 2.2, 0);   // (w 0: the manta's shadow lies straight below it, whole on the top step)   // (x: the seam of light at each hinge of the manta's shadow, metres)

    // ---------------------------------------------------------------- the flight
    const pts = [[0, Y0, 0], [0, Y0, 20], [1, Y0, 36], [4, 58.4, 44], [9, 59.4, 56], [14, 60.4, 66], [20, 61.8, 78], [27, 63, 88], [32, 64.2, 104], [35, 65.2, 122]];
    const NT = 16;
    for (let i = 0; i <= NT; i++) {                                // one full turn round the hub, rising 8 m
      const a = (i / NT) * Math.PI * 2, y = YA + (Y1 - YA) * ss(0.04, 0.96, i / NT);
      pts.push([HUB.x + Math.cos(a) * TURN_R, y, HUB.z + Math.sin(a) * TURN_R]);
    }
    const EXIT = [TURN_R, Y1, BOX.z1];
    pts.push([TURN_R, Y1, 160], [TURN_R, Y1, 180], [TURN_R, Y1, 200], [TURN_R, Y1, 218], EXIT);
    pts.unshift([0, Y0, -14]);                                     // (the flight begins a little way back up the lane: it is wide open there, and the eel's egg cup is ahead of us when the eel comes out)
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    // ---------------------------------------------------------------- ONE CLOCK. The brief gives its beats in seconds of flight: 0-6 s the weed garden, 6-15 s the link,
    // 15-34 s the turn (slowing from 29 s, as 10 m/s is to 8), 34-43 s the straight. The three places are the path's own: where the lane ends (z 36), where the turn
    // begins and where it ends (the first and last point of the circle). pace(u) is one level in each stretch, eased between them, and the levels are solved so that
    // those places are reached at 6, 15 and 34 s. U(seconds) is then the place of any moment of the brief: every timed thing below is written in seconds through it.
    const DUR = 43; let U_LANE = 0, U_T0 = 0, U_T1 = 0;
    { const pv = new THREE.Vector3(); let zPrev = -99;               // the three places, found on the path itself
      for (let i = 0; i <= 2400; i++) { const u = i / 2400; path.pointAt(u, pv);
        if (!U_LANE && pv.z >= 36) U_LANE = u;
        if (zPrev < HUB.z && pv.z >= HUB.z) { if (!U_T0) U_T0 = u; else U_T1 = u; }
        zPrev = pv.z; if (i % 600 === 599) await ctx.yield(); } }
    // (U_IM: where 29 s falls in a turn flown 14 s at one speed and 5 s at four fifths of it. PW: each pace step eases over 10 m of route either side of its place)
    const U_IM = U_T0 + (U_T1 - U_T0) * (140 / 180), PV = [1, 1, 1, 0.8, 1], PW = 10 / path.length;
    const paceRaw = (u) => PV[0] + (PV[1] - PV[0]) * ss(U_LANE - PW, U_LANE + PW, u) + (PV[2] - PV[1]) * ss(U_T0 - PW, U_T0 + PW, u) + (PV[3] * PV[2] - PV[2]) * ss(U_IM - 2 * PW, U_IM + 2 * PW, u) + (PV[4] - PV[3] * PV[2]) * ss(U_T1 - PW, U_T1 + PW, u);
    const CN = 860, CT = new Float32Array(CN + 1);
    const clock = () => { CT[0] = 0; for (let i = 1; i <= CN; i++) CT[i] = CT[i - 1] + 1 / paceRaw((i - 0.5) / CN); const k = DUR / CT[CN]; for (let i = 1; i <= CN; i++) CT[i] *= k; };
    const secAt = (u) => { const x = Math.min(Math.max(u, 0), 1) * CN, i = Math.min(CN - 1, Math.floor(x)); return CT[i] + (CT[i + 1] - CT[i]) * (x - i); };
    for (let it = 0; it < 8; it++) {                               // solve the levels: each stretch's speed is its length over the brief's seconds for it
      clock(); const t1 = secAt(U_LANE), t2 = secAt(U_T0), t3 = secAt(U_T1);
      PV[0] *= t1 / 6; PV[1] *= (t2 - t1) / 9; PV[2] *= (t3 - t2) / 19; PV[4] *= (DUR - t3) / 9;
    }
    clock(); await ctx.yield();
    const U = (sec) => { let lo = 0, hi = CN; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CT[m] <= sec) lo = m; else hi = m; } return Math.min(1, Math.max(0, (lo + (sec - CT[lo]) / Math.max(CT[hi] - CT[lo], 1e-6)) / CN)); };
    const beat = (s0, s1, s2, s3, u) => { const s = secAt(u); return ss(s0, s1, s) * (1 - ss(s2, s3, s)); };   // up between s0 and s1 seconds, down between s2 and s3
    // ---------------------------------------------------------------- RULES OF THE PLACE (they hold for everything built, on every seed; none knows the camera)
    // (1) THE RIDE'S WAY. Nothing stands nearer than 2.5 m to the eye's track or to the shell that hangs under it: measured against the course itself in space, a point
    // every metre of route, the shell as the box from 1.2 to 3.4 m below each point and 1.9 m to either side of it. Only the ride is exempt: the haul string, our own threads, the
    // wire arm that carries us. A hung thing is measured with its thread (the plumb line above it).
    const HOLE = new THREE.Vector3(TURN_R, Y1, BOX.z1), LEN = path.length, NTR = Math.ceil(LEN), TRK = new Float32Array((NTR + 1) * 3), CLEAR = 2.5, SHELL = 3.4;
    { const pT = new THREE.Vector3(); for (let i = 0; i <= NTR; i++) { path.posAtDist((i / NTR) * LEN, pT); TRK[i * 3] = pT.x; TRK[i * 3 + 1] = pT.y; TRK[i * 3 + 2] = pT.z; } }
    const trackGap = (x, y, z, hung) => {                            // metres from a point (and the thread above it, if hung) to the eye's track and to the shell under it
      let best = 1e9;
      for (let i = 0; i <= NTR; i++) { const dx = x - TRK[i * 3], dz = z - TRK[i * 3 + 2], h2 = dx * dx + dz * dz; if (h2 > 3600) continue;
        const h = Math.sqrt(h2), ty = TRK[i * 3 + 1], top = ty - 1.2, foot = ty - SHELL, ve = y > ty ? y - ty : hung ? 0 : ty - y, hs = Math.max(0, h - 1.9), vs = y > top ? y - top : hung ? 0 : y < foot ? foot - y : 0;
        const d2 = Math.min(h2 + ve * ve, hs * hs + vs * vs);
        if (d2 < best) best = d2; }
      return best > 1e8 ? 60 : Math.sqrt(best);     // (60: farther than that from every point of the course)
    };
    // (2) THE SIGHTS. Two volumes of the box are kept free of everything stood or hung. THE HOLE'S: the hole is seen through the four partings of the run in, so the
    // prism through their openings to the hole is free, with 3 m to spare, and before it the wedge from the first of them back to the stretch of the turn from which the
    // back wall is faced (from where the course's heading first comes within 60 degrees of the haul line, all the way round to where the arm lets go) and the straight
    // itself. THE STAGE'S: through each parting of the link the coral head and the manta stand ahead, so the prism from the lane and from each of those openings to them
    // is free. Each is tested from eyes on the course every 2.5 m of route along the whole stretch, as the cone from the eye to a disc (the hole and 3 m more; the
    // coral head and the manta): a thing of radius r is inside if from any of those eyes it lies in the cone or within 3 m of its axis. What would stand inside is
    // refused and dealt again from its own stream; nothing is slid aside.
    const eyesAlong = (d0, d1) => { const out = []; for (let d = d0; d <= d1; d += 2.5) out.push(path.posAtDist(d, new THREE.Vector3())); return out; };
    let D_FACE = LEN * 0.5, D_LINK = 0;
    { const tv = new THREE.Vector3(), pv = new THREE.Vector3(), dMid = (U_T0 + U_T1) * 0.5 * LEN;
      for (let d = dMid; d < LEN; d += 0.5) { path.tangentAtDist(d, tv); if (tv.z / (Math.hypot(tv.x, tv.z) || 1) >= 0.5) { D_FACE = d; break; } }
      for (let d = 0; d < LEN; d += 0.5) { path.posAtDist(d, pv); if (pv.z >= 114) { D_LINK = d; break; } } }
    const EYES_HOLE = eyesAlong(D_FACE, LEN - 8), EYES_STAGE = eyesAlong(0, D_LINK), STAGE = new THREE.Vector3(HUB.x, 56, HUB.z);
    const coneGap = (EYES, T, R, x, y, z, r, hung) => {             // metres to spare (negative: inside the sight from somewhere on the stretch)
      let gap = 1e9;
      for (const E of EYES) { const dx = T.x - E.x, dy = T.y - E.y, dz = T.z - E.z, t = ((x - E.x) * dx + (y - E.y) * dy + (z - E.z) * dz) / (dx * dx + dy * dy + dz * dz);
        if (t < 0.02 || t > 1.02) continue;
        const ly = E.y + dy * t, py = hung && y < ly ? ly : y, ox = x - E.x - dx * t, oy = py - ly, oz = z - E.z - dz * t;
        gap = Math.min(gap, Math.sqrt(ox * ox + oy * oy + oz * oz) - (Math.max(3, t * R) + r)); }
      return gap;
    };
    const holeGap = (x, y, z, r, hung) => coneGap(EYES_HOLE, HOLE, 10.5, x, y, z, r, hung), stageGap = (x, y, z, r, hung) => coneGap(EYES_STAGE, STAGE, 33, x, y, z, r, hung);
    // the two rules together: may a thing of radius r stand (or hang, by a thread) with its middle here?
    const freeAt = (x, y, z, r, hung) => trackGap(x, y, z, hung) - r >= CLEAR && holeGap(x, y, z, r, hung) >= 0 && stageGap(x, y, z, r, hung) >= 0;
    // a place dealt by its family's own stream round the spot where its kind belongs: a refused place is dealt again, a little wider each time; after 24 refusals the thing is left out
    const dealNear = (rs, x, y, z, r, hung, sx = 2.5, sy = 2, sz = 2.5, also = null) => {
      for (let k = 0; k < 24; k++) { const g = 1 + k * 0.25, px = x + rs.range(-sx, sx) * g, py = y + rs.range(-sy, sy) * g, pz = Math.min(BOX.z1 - 3.5, z + rs.range(-sz, sz) * g); if (freeAt(px, py, pz, r, hung) && (!also || also(px, py, pz))) return [px, py, pz]; }
      return null;
    };
    // the top of the hole's sight at a radius from the hub (and 2.5 m over the ride's way where a ring of that radius crosses the straight): the mobile hangs its low file over it
    const overSight = (rad) => { let top = 0;
      for (const E of EYES_HOLE) { const ex = E.x - HUB.x, ez = E.z - HUB.z, dx = HOLE.x - E.x, dz = HOLE.z - E.z, A = dx * dx + dz * dz, Bq = 2 * (ex * dx + ez * dz), C = ex * ex + ez * ez - rad * rad, q = Bq * Bq - 4 * A * C; if (q <= 0) continue;
        const t = (-Bq + Math.sqrt(q)) / (2 * A); if (t > 0 && t < 1) top = Math.max(top, E.y + (HOLE.y - E.y) * t + Math.max(3, t * 10.5)); }
      return Math.max(top, Y1 + CLEAR);
    };

    await ctx.yield();
    // ---------------------------------------------------------------- the water: eighteen hung pieces of cellophane (eight sheets across the box, six of them in two pieces with a parting; four lengthwise)
    const sheets = [];
    // [z, the parting's port edge, its starboard edge] (x; null: no piece on that side). The sheets of the link hang with a parting where the haul string passes
    // ("right, right, right"). The port piece's hem is the one we pass. The starboard piece begins 3 m outside the stage's sight (stageEdge: the widest the cone
    // from any eye of the lane and the link to the coral head and the manta stands at that sheet), so through each parting the coral head and the manta stand ahead
    // with no film over them; and it hangs only where it stands clear of the mobile's outer ring (73 m and more from the hub), which leaves the sheets at z 88 and
    // z 114 with their port pieces only. The four of the run in are four frames one inside another, each parting centred on the string and narrower than the one before.
    const stageEdge = (z) => { let m = 0;
      for (const E of EYES_STAGE) { if (E.z >= z - 1) break; const t = (z - E.z) / (STAGE.z - E.z); m = Math.min(m, E.x + (STAGE.x - E.x) * t - Math.max(3, 33 * t) - 3); }
      return m; };
    const CROSS = [[44, 18, 0], [66, 23, 0], [88, 36, 0], [114, 40, 0], [186, TURN_R + 33, TURN_R - 33], [200, TURN_R + 25, TURN_R - 25], [213, TURN_R + 17, TURN_R - 17], [225, TURN_R + 9, TURN_R - 9]];
    for (let i = 0; i < 4; i++) CROSS[i][2] = HUB.z - CROSS[i][0] >= 73 ? stageEdge(CROSS[i][0]) : null;
    { const rsh = stream('sbr-sheets');
      CROSS.forEach(([z, hiX, loX], ci) => {
        const tilt = (rsh() - 0.5) * 1.2;                            // partings not quite square
        if (loX !== null) sheets.push({ axis: 'z', at: z, lo: BOX.x0, hi: loX + tilt, y0: 0, y1: 184, ci });
        sheets.push({ axis: 'z', at: z, lo: hiX + tilt * 0.4, hi: BOX.x1, y0: 0, y1: 184, ci });
      }); }
    for (const x of [-105, -75, 75, 105]) sheets.push({ axis: 'x', at: x, lo: BOX.z0, hi: BOX.z1, y0: 0, y1: 184, ci: 9 });
    style.setSheets(sheets);
    await ctx.yield();
    // (3) THE BAYS. The cross sheets and the two end walls cut the box into nine bays along the course, in metres of z: -44 to 44 (the garden), 44 to 66, 66 to 88
    // and 88 to 114 (the link), 114 to 186 (the stage), 186 to 200, 200 to 213 and 213 to 225 (the run in), 225 to 235 (the hole's). Every fan, roll, bubble strip
    // and fish slot of the three typed tables below has a spot where its kind belongs. Where that spot as typed is free by the two rules above, the place is dealt
    // round it (dealNear). Where the spot as typed is not free, nothing is searched outward from it: the thing is dealt by its family's own stream anywhere in the
    // bay its spot lies in, each try uniform over the whole bay (the full width of the box, the bay's whole depth, the family's own band of heights; the thing kept
    // whole inside the bay and off the lengthwise sheets), until a try is free; after 24 tries it is left out. No try is made nearer a sight than anywhere else.
    const BAYS = [BOX.z0, ...CROSS.map((c) => c[0]), BOX.z1], SIDE_X = sheets.filter((s) => s.axis === 'x').map((s) => s.at);
    const bayOf = (z) => { let i = 0; while (i < BAYS.length - 2 && z >= BAYS[i + 1]) i++; return [BAYS[i], BAYS[i + 1]]; };
    // band: the family's heights [lowest, highest], or null for a thing that stands on the floor; mx, mz: the metres the thing itself takes up across the box and along it
    const dealBay = (rs, z, band, mx, mz, free) => {
      const [z0, z1] = bayOf(z), ez = Math.min(mz, (z1 - z0) * 0.5);
      for (let k = 0; k < 24; k++) { const px = rs.range(BOX.x0 + mx, BOX.x1 - mx), py = band ? rs.range(band[0], band[1]) : 0, pz = rs.range(z0 + ez, z1 - ez);
        if (SIDE_X.every((sx) => Math.abs(px - sx) > mx) && free(px, py, pz)) return [px, py, pz]; }
      return null;
    };
    // ---------------------------------------------------------------- the ranks: behind every hung sheet the reef goes on at eye height, so the blue can be counted wherever the eye looks.
    // A row stands a few metres behind each cross sheet (trays of cups on tall card tubes, fans and rolls on stands, crepe streamers, a slot of card fish) and a row hangs
    // between and beyond the lengthwise sheets (streamers, trays and fans on threads). Laid out here with its own random stream; the builders below each take their share.
    const ranks = [];                                              // { kind, x, y, z, yaw, sc, pot }
    {
      const rr = stream('sbr-ranks'), pv = new THREE.Vector3();
      const okAt = (x, z, clr = 13) => Math.abs(x) < 143 && z > BOX.z0 + 6 && z < BOX.z1 - 4.5 && Math.hypot(x - HUB.x, z - HUB.z) > 76 && path.nearestXZ(x, z).dist > clr
        && !(x > 34 && x < 92 && Math.abs(z - 34) < 7) && !(Math.abs(x) < 40 && z < 44);          // the eel's housing; the weed garden has its own planting
      // what a stand or a hung thing of each kind takes up (its radius), for the two rules of the place
      const RAD = { tray: 11, hungTray: 11, fan: 6, hungFan: 6, roll: 6, weed: 2, fish: 3 };
      let nFish = 0, nHung = 0;
      const put = (x, z, side) => {
        if (!okAt(x, z) || ranks.some((r) => Math.hypot(r.x - x, r.z - z) < 7.5) || rr() > Math.min(1, 0.35 + 0.65 * density)) return;
        path.pointAt(path.nearestXZ(x, z).u, pv);
        const yaw = Math.atan2(pv.x - x, -(pv.z - z)) + rr.range(-0.35, 0.35), k = rr(), pot = rr.int(0, 4), add = [];
        if (side) {                                                // hung: nothing here stands in the way of the hauled fish
          if (k < 0.5) add.push({ kind: 'weed', x, z, y: rr.range(70, 140), sc: rr.range(1.6, 2.7) });
          else if (k < 0.84 || nHung >= 8) add.push({ kind: 'hungTray', x, z, y: rr.range(40, 92), yaw, pot });
          else add.push({ kind: 'hungFan', x, z, y: rr.range(60, 100), yaw, sc: rr.range(1.3, 1.9), pot });
        } else if (k < 0.36) add.push({ kind: 'weed', x, z, y: rr.range(70, 140), sc: rr.range(1.6, 2.7) });
        else if (k < 0.66) add.push({ kind: 'tray', x, z, y: rr.range(38, 90), yaw, pot });
        else if (k < 0.79) add.push({ kind: 'fan', x, z, y: rr.range(56, 98), yaw, sc: rr.range(1.3, 1.9), pot });
        else if (k < 0.90) add.push({ kind: 'roll', x, z, y: rr.range(46, 88), yaw, sc: rr.range(1.25, 1.7), pot });
        else if (nFish < 8 && okAt(x - 17, z, 15) && okAt(x + 17, z, 15)) add.push({ kind: 'fish', x, z, y: rr.range(52, 86), sc: rr.range(12, 16) });
        else add.push({ kind: 'tray', x, z, y: rr.range(38, 90), yaw, pot });
        // along the run in, between the lengthwise sheets and the string, trays and fans hang (nothing there stands on the floor between the eye and the wall's foot);
        // beside the hole, within 36 m of it, trays are low and stand on card tubes (y 44 or less: no thread of theirs rises past the hole); elsewhere one tray in
        // three stands on a tube and the others hang by their corners
        for (const r of add) {
          if (r.kind === 'tray') r.tube = rr() < 0.34;
          if (r.z > 150 && r.x > 40 && r.x < 100 && (r.kind === 'tray' || r.kind === 'fan')) { r.kind = r.kind === 'fan' ? 'hungFan' : 'hungTray'; r.y = Math.max(r.y, 62); }
          if (r.z > 211 && (r.kind === 'tray' || r.kind === 'hungTray') && ((r.z < 226 && Math.abs(r.x - TURN_R) < 21) || (r.x > TURN_R && r.x - TURN_R < 36))) { r.y = Math.min(r.y, 44); if (r.kind === 'tray') r.tube = true; }
          const hung = r.kind === 'hungTray' || r.kind === 'hungFan' || r.kind === 'weed' || r.kind === 'fish' || (r.kind === 'tray' && !r.tube), span = r.kind === 'fish' ? [-r.sc, 0, r.sc] : [0];
          if (span.some((q) => !freeAt(r.x + q, r.kind === 'weed' ? r.y * 0.5 : r.y, r.z, RAD[r.kind], hung))) return;   // (a refused place stays empty: the row's next place is dealt afresh)
        }
        for (const r of add) { if (r.kind === 'fish') nFish++; if (r.kind === 'hungFan') nHung++; ranks.push(r); }
      };
      let np = 0;
      for (const [z] of CROSS) for (let x = -138; x <= 138; x += 11.5) { put(x + rr.range(-3, 3), Math.min(z + rr.range(3.6, 7.6), BOX.z1 - 5), false); if (++np % 6 === 0) await ctx.yield(); }
      for (const xs of [-121, -90, 90, 121]) for (let z = -32; z <= 228; z += 14) { put(xs + rr.range(-5, 5), z + rr.range(-4, 4), true); if (++np % 6 === 0) await ctx.yield(); }
      // hierarchy: far shelves are fewer (every second stand more than 40 m from our way is left out), and crepe weed belongs to the weed garden and the box's edges
      { let nFar = 0; for (const r of ranks) { const far = path.nearestXZ(r.x, r.z).dist > 40;
        if (r.kind === 'weed') { if (!(r.z < 60 || Math.abs(r.x) > 112) || Math.abs(r.x) < (r.z + 14) * 0.45 + 3) r.kind = 'none'; }
        else if (far && (nFar++ % 2 === 1)) r.kind = 'none'; } }
    }

    // ---------------------------------------------------------------- the box: floor of bare card, walls of sugar paper, a fluted rim, the lid's daylight and its dowels
    await ctx.yield();
    const paint = style.paintMaterial();                           // per-fragment water: floor, walls, coral, big flats
    const paintSmall = style.paintMaterial({ vertWater: true, side: THREE.DoubleSide });   // per-vertex water: small things
    const disposables = [], updaters = [], HAUL = 1.6;
    const EEL = { x: 27, y: 57, z: 34 };                 // the mouth of the eel's egg cup, by the garden's last metres
    const eelOut = (sec) => 0.5 - 0.5 * Math.cos(6.2832 * Math.min(Math.max((sec + 1) / 8, 0), 1));   // the eel's draw: eased out of the cup and back over eight seconds round the brief's third
    const threadMat = style.lineMaterial({ uniforms: { uMinA: { value: 0.008 }, uFade: { value: 1 }, uMaxA: { value: 0.42 }, uDist: { value: new THREE.Vector2(10, 21) }, uFarA: { value: 0.07 } } });
    // a thread from the thing it holds (a) up to the lid (b), in three lengths, so that only the stretch near the eye is a plain line and the rest sinks into the water behind it
    const cotton = (R, a, b, w, col) => {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1, at = (d) => { const t = Math.min(1, d / L); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
      R.add(a, at(9), w, col); if (L > 9) R.add(at(9), at(26), w, col); if (L > 26) R.add(at(26), b, w, col);
    };
    pal.thread = pal.white.clone().lerp(new THREE.Color().copy(SU.uBlue.value), 0.4).multiplyScalar(0.86);   // cotton: pale, never the brightest thing near it (only our own haul string is white)
    const tubeCol = pal.card.clone().multiplyScalar(0.7);          // the stands: bare brown card tube, a clear tone darker than tape, so the only cream uprights in the box are hems   // cotton: a clear white line within about 20 m of the eye, fainter with distance (the same program as every other line)
    {
      const B = paintBuffers(), W = BOX.x1 - BOX.x0, L = BOX.z1 - BOX.z0, deep = pal.deep, card = pal.card, floorDeep = pal.deep.clone().multiplyScalar(0.68);   // (the floor's paper lies 60 m under the eye, out of the daylight: a tone deeper than the walls' own)
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++)      // floor in panels so the water count has vertices to hang on
        rect(B, [BOX.x0 + (W * i) / 6, 0, BOX.z0 + (L * j) / 6], [0, 0, L / 6], [W / 6, 0, 0], [0, 1, 0], floorDeep, 4);   // the floor is lined with the same sugar paper as the walls (everything that is not lid is blue)
      const T = BOX.top - 14;                                      // sugar paper to 14 m below the rim, bare card above it
      rect(B, [BOX.x0, 0, BOX.z0], [0, 0, L], [0, T, 0], [1, 0, 0], deep, 4); rect(B, [BOX.x1, 0, BOX.z1], [0, 0, -L], [0, T, 0], [-1, 0, 0], deep, 4);
      rect(B, [BOX.x1, 0, BOX.z0], [-W, 0, 0], [0, T, 0], [0, 0, 1], deep, 4);
      rect(B, [BOX.x0, T, BOX.z0], [0, 0, L], [0, 14, 0], [1, 0, 0], card, 2); rect(B, [BOX.x1, T, BOX.z1], [0, 0, -L], [0, 14, 0], [-1, 0, 0], card, 2);
      rect(B, [BOX.x1, T, BOX.z0], [-W, 0, 0], [0, 14, 0], [0, 0, 1], card, 2); rect(B, [BOX.x0, T, BOX.z1], [W, 0, 0], [0, 14, 0], [0, 0, -1], card, 2);
      // back wall with the hole: four panels round a 15 m square opening (the snipped edge is added with the exit)
      const hx = EXIT[0], hy = EXIT[1], h = 7.6, zb = BOX.z1;
      rect(B, [BOX.x0, 0, zb], [hx - h - BOX.x0, 0, 0], [0, T, 0], [0, 0, -1], deep, 4); rect(B, [hx + h, 0, zb], [BOX.x1 - hx - h, 0, 0], [0, T, 0], [0, 0, -1], deep, 4);
      rect(B, [hx - h, 0, zb], [2 * h, 0, 0], [0, hy - h, 0], [0, 0, -1], deep, 4); rect(B, [hx - h, hy + h, zb], [2 * h, 0, 0], [0, T - hy - h, 0], [0, 0, -1], deep, 4);
      await ctx.yield();
      const box = new THREE.Mesh(B.build(), style.paintMaterial({ side: THREE.DoubleSide })); box.frustumCulled = false; scene.add(box);
    }
    await ctx.yield();
    // the lid: a plain rectangle of daylight (counted through the sheets like everything else), crossed by fourteen dowels
    const lidMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SU, { uLidCol: { value: new THREE.Color(...hour.lid) } }), side: THREE.DoubleSide,
      vertexShader: `varying vec3 vWp; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `varying vec3 vWp; uniform vec3 uLidCol;\n${PART.STYLE_GLSL}\nvoid main(){ gl_FragColor = vec4(sbrWater(uLidCol, sbrSheets(cameraPosition, vWp)), 1.); }`,
    });
    {
      const g = new THREE.PlaneGeometry(BOX.x1 - BOX.x0, BOX.z1 - BOX.z0, 1, 1); g.rotateX(Math.PI / 2); g.translate(0, BOX.top, (BOX.z0 + BOX.z1) / 2);
      const lid = new THREE.Mesh(g, lidMat); lid.frustumCulled = false; scene.add(lid);
      await ctx.yield();
      const B = paintBuffers(), lidDark = pal.card.clone().multiplyScalar(0.5), wireDark = pal.wire.clone();
      for (let i = 0; i < 14; i++) {
        const z = DOWEL_Z[i][0], sk = DOWEL_Z[i][1];
        addCylinder(B, [BOX.x0, 186.5, z - sk], [BOX.x1, 186.5, z + sk], 1.7, 8, lidDark, 2, false);
      }
      // the cotton reel our threads come from, on its own short dowel over the hub, and the two heavy wires of the mobile's cross: drawn things, dark against the lid
      { const rx = HUB.x - 6, rz = HUB.z + 9, ry = 180;
        addCylinder(B, [rx, ry - 2.2, rz], [rx, ry + 2.2, rz], 1.5, 10, lidDark, 2, true);
        for (const e of [-1, 1]) addCylinder(B, [rx, ry + e * 2.2, rz], [rx, ry + e * 2.75, rz], 3.0, 12, lidDark, 2, true);
        addCylinder(B, [rx, ry + 2.7, rz], [rx, 186.5, rz], 0.45, 6, lidDark, 2, false);
        addCylinder(B, [HUB.x - 21, 176.5, HUB.z - 2], [HUB.x + 21, 176.5, HUB.z + 2], 0.4, 6, wireDark, 4, false); addCylinder(B, [HUB.x + 2, 177.3, HUB.z - 21], [HUB.x - 2, 177.3, HUB.z + 21], 0.4, 6, wireDark, 4, false); }
      for (const [z] of CROSS) addCylinder(B, [BOX.x0, 184, z], [BOX.x1, 184, z], 0.7, 6, lidDark, 2, false);   // each sheet's own top rod
      scene.add(new THREE.Mesh(B.build(), paintSmall));
    }

    // ---------------------------------------------------------------- cellophane: faint blue, rippling from the top dowel down, creases catching and losing the light
    const uBelly = { value: 0 };
    const celloMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SU, { uBelly, uTapeCol: { value: pal.tape } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 aUv;     // metres along, metres down from the dowel, distance to the nearest free edge
        uniform float uBelly;
        varying vec3 vWp, vUv;
        ${PART.STYLE_GLSL}
        void main(){
          vec3 p = position; float d = aUv.y;
          float r = sin(d * 0.21 - uTime * 1.1 + aUv.x * 0.05) * 0.6 + sin(d * 0.083 - uTime * 0.6 + aUv.x * 0.13 + 1.7) * 0.5;
          float hang = clamp(d / 30., 0., 1.);
          p += normal * (r * hang + uBelly * 8. * sin(clamp(d / 184., 0., 1.) * 3.1416) * hang);
          vec4 wp = modelMatrix * vec4(p, 1.); vWp = wp.xyz; vUv = aUv;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vWp, vUv; uniform vec3 uGloss, uTapeCol;
        ${PART.STYLE_GLSL}
        float sbrSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); vec2 e = pa - ba * h; return sqrt(dot(e, e)); }
        float sbrSliver(vec2 p, vec2 a, vec2 b, float fw){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); vec2 e = pa - ba * h;
          float w = 0.02 + 0.13 * sin(3.1416 * h); return 1. - smoothstep(w - 0.6 * fw, w + 0.6 * fw + 1e-4, sqrt(dot(e, e))); }
        // the creases of crumpled film: in each cell of the sheet one sharp kinked line of three straight runs, angular like the creases of a sweet wrapper,
        // white where it catches the lid; each flashes as the ripple from the dowel runs down through it, and dies (m in metres: along, down from the dowel)
        float sbrCrease(vec2 m, vec2 cell, float k, float fw){
          vec2 g = m / cell + vec2(k * 0.37, k * 0.61), id = floor(g), p = fract(g) * cell;
          float h1 = sbrHash(id + k), h2 = sbrHash(id * 1.7 + 3.1 + k), h3 = sbrHash(id * 2.3 + 7.7 + k), h4 = sbrHash(id * 3.1 + 1.3 + k);
          vec2 c = cell * (0.38 + 0.24 * vec2(h1, h2));
          float a0 = h3 * 6.2832, a1 = a0 + 3.1416 + (h4 - 0.5) * 1.7, a2 = a1 + (h1 > 0.5 ? 1. : -1.) * (0.7 + 0.8 * h2);
          vec2 p0 = c + vec2(cos(a0), sin(a0)) * (2.0 + 2.4 * h2), p2 = c + vec2(cos(a1), sin(a1)) * (1.6 + 2.2 * h4), p3 = p2 + vec2(cos(a2), sin(a2)) * (1.0 + 1.2 * h3);
          // each run is a sliver, widest in its middle and pointed at both ends (a facet of the film catching the lid), seen only while it flashes: a glint, never an outline
          float line = max(max(sbrSliver(p, p0, c, fw), sbrSliver(p, c, p2, fw)), sbrSliver(p, p2, p3, fw)) * (1. - smoothstep(0.1, 0.2, fw));    // only the nearer sheets show their creases: far off the film is its flat tint
          float flash = smoothstep(0.35, 0.9, sin(m.y * 0.21 - uTime * 1.1 + m.x * 0.05 + h3 * 2.5));
          return line * flash * step(0.4, h4);
        }
        // film off a roll hangs in a few broad folds running its whole height: each shows as a pale glossy band on one flank, soft at both edges,
        // that brightens and dims as the ripple runs down it from the dowel (the band is 2 to 5 m wide: never a hairline)
        float sbrBroad(vec2 m){
          float P = 34.;
          float cell = m.x / P + 0.10 * sin(m.y * 0.031 + m.x * 0.011) + 0.22 * (sbrNoise(vec2(m.y * 0.013, m.x * 0.004 + 5.)) - 0.5);
          float id = floor(cell), at = 0.27 + 0.46 * sbrHash(vec2(id, 3.7)), W = 2.2 + 2.6 * sbrHash(vec2(id, 9.1));
          float d = (fract(cell) - at) * P;
          float band = smoothstep(-0.7, 0.5, d) * (1. - smoothstep(W * 0.3, W, d));
          float back = smoothstep(-W * 0.9, -W * 0.25, d) * (1. - smoothstep(-W * 0.25, -0.5, d));        // the fold's other flank: it loses the lid and goes a little deeper
          float run = 0.5 + 0.5 * sin(uTime * 0.9 - m.y * 0.065 + id * 2.1);
          float keep = 1. - smoothstep(0.28, 0.7, fwidth(m.x));        // a band under about 6 px wide gives way to its flat average
          return mix(0.03, band * (0.3 + 0.7 * run) - 0.35 * back * (0.4 + 0.6 * run), keep);
        }
        void main(){
          vec2 m = vUv.xy;
          float fwm = max(length(dFdx(m)), length(dFdy(m))) + 1e-4;
          float cr = max(sbrCrease(m, vec2(11., 15.), 0., fwm), sbrCrease(m + vec2(3.1, 4.4), vec2(17., 12.), 5., fwm));
          float broad = sbrBroad(m), gl = max(broad, 0.), dk = max(-broad, 0.);
          float fw = fwidth(vUv.z) + 1e-4;
          float hemD = vUv.z + 0.3 * sin(vUv.y * 0.09 + vUv.x * 0.7) + 0.6 * (sbrNoise(vec2(vUv.y * 0.035, vUv.x * 0.1)) - 0.5);   // the hem: one strip of masking tape down the free edge, stuck on crooked
          float eh = min(fw, 0.35) * 0.75 + 0.01;                    // (seen edge-on the tape keeps its own width: it must never spread into a wash over the film)
          vec3 hv = vWp - cameraPosition; float hd = sqrt(dot(hv, hv));
          // every hem is the same strip of cream masking tape, 0.45 m showing on each face: a firm cream band where we pass it, a thin line from far down the
          // box; a hem seen through other sheets takes their counted steps like everything else (below)
          float hw = 0.45;
          float hem = (1. - smoothstep(hw - eh, hw + eh, hemD)) * min(1., 1.3 / fw);
          float join = (1. - smoothstep(0.05, 0.05 + fwm, abs(fract(m.y / 13.7 + 0.31) - 0.5) * 13.7)) * (1. - smoothstep(0.08, 0.2, fwm));       // where one length of tape ends and the next begins
          float n = sbrSheets(cameraPosition, mix(cameraPosition, vWp, 0.985));
          vec3 col = mix(mix(uBlue * 1.08, uDeep, dk * 0.5), uGloss, clamp(gl * 0.6 + cr, 0., 1.));
          float nearF = 1. - smoothstep(30., 70., hd);               // the broad gloss bands belong to the sheet we are passing; farther off they sink to a thin tint
          float a = 0.004 + 0.065 * gl * (0.2 + 0.8 * nearF) + 0.92 * cr + 0.06 * dk * nearF;       // between its creases the film is clear: what hangs behind keeps its pot colour, one counted step bluer
          col = mix(col, uTapeCol * (1. - 0.14 * join), hem); a = mix(a, 0.97, hem);
          gl_FragColor = vec4(mix(col, sbrWater(col, n), step(0.5, n)), a);
        }`,
    });
    for (const s of sheets) {
      const len = s.hi - s.lo, H = s.y1 - s.y0, nu = Math.max(4, Math.round(len / 9)), nv = 20;
      const pos = [], nrm = [], auv = [], idx = [], isZ = s.axis === 'z', mid = (s.lo + s.hi) / 2;
      const freeLo = isZ && s.lo > BOX.x0 + 1, freeHi = isZ && s.hi < BOX.x1 - 1;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const a = -len / 2 + (len * i) / nu, d = (H * j) / nv, y = s.y1 - d - 100;
        if (isZ) { pos.push(a, y, 0); nrm.push(0, 0, 1); } else { pos.push(0, y, a); nrm.push(1, 0, 0); }
        auv.push(a + mid + s.at * 3.1, d, Math.min(freeLo ? a + len / 2 : 99, freeHi ? len / 2 - a : 99));
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = j * (nu + 1) + i; idx.push(k, k + 1, k + nu + 2, k, k + nu + 2, k + nu + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      g.setAttribute('aUv', new THREE.Float32BufferAttribute(auv, 3)); g.setIndex(idx);
      if (sheets.indexOf(s) % 6 === 5) await ctx.yield();
      const m = new THREE.Mesh(g, celloMat); m.renderOrder = 5;
      if (isZ) m.position.set(mid, 100, s.at); else m.position.set(s.at, 100, mid);
      scene.add(m);
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the coral head: six slabs of card stepped like a contour model, egg-box cups on every step
    const rowCups = [], dressWeed = [], trayAt = [], floorRules = [], linkShelves = [];              // (the dressing: its cups, anemones and weed have their own meshes, and each list is dealt from a stream of its own)
    // the typed spots of the fans and rolls of the link and the stage (the table's own words stand where the family is built, below): typed here because the link's
    // long cup shelves are hung before the fans are dealt, and each shelf hangs clear of the large bright thing that stands in its bay
    const SPOTS_LINK = [[0, -32, 64, 55, null, 0.9, 0, 0], [0, 27, 69.5, 60, null, 1.5, 1, 1, 4.5], [1, 41, 64.5, 82.5, null, 1.5, 1, 1, 4.5], [0, 50, 71.5, 105, null, 1.5, 1, 2, 4.5],
      [0, 46, 74, 122, null, 1.0, 0, 0], [1, -47, 70, 152, 0.4, 1.1, 1, 1], [0, -44, 75, 118, 2.7, 1.05, 0, 2], [0, -8, 78, 190, 1.57, 1.1, 0, 0], [0, -30, 76, 100, 0.25, 0.95, 0, 2]];
    const cupList = [], shelfCups = [];                            // [x, y, z, scale, pot]; the shelves inside the turn keep their own list (and their own random stream)
    const pots = cold ? [pal.white, pal.pink, pal.white, pal.pink, pal.yellow] : [pal.orange, pal.pink, pal.orange, pal.pink, pal.yellow];
    const TRAY_DEG = [24, 64, 104];                               // the three trays hung inside the turn: where each hangs, in degrees round the hub from the turn's first point, the way we fly
    const CRAB = { x: HUB.x + 1.5, z: HUB.z - 17.3, y: 36.6, sc: 1.75 };   // on the rim of the third step down, on the lane's side: large, whole and clear as we look down (the manta's shadow lies whole on the top step, our turtle's on the bare arc of the step under it)
    {
      const B = paintBuffers(), LAY = 6, TH = 7.5, rng = stream('sbr-steps');
      for (let i = 0; i < LAY; i++) {
        const r = 35 - 5.5 * i, o = blob(rng, r, r * rng.range(0.93, 1.04), 30, 0.035);
        cardGeometry(o, { buf: B, thick: TH, y: TH * (i + 0.5), top: i === LAY - 1 && cold ? pal.white : pots[i % 2], rim: 0.9, brush: rng() * 3, ox: rng() * 50, oz: rng() * 50 });
        const rr = r - 2.9, n = i === LAY - 1 ? 0 : Math.floor((Math.PI * 2 * rr) / 5.9), a0 = rng() * 6;   // (the top step is bare card and paint: the manta's shadow lies on it)
        for (let k = 0; k < n; k++) {
          const a = a0 + (k / n) * Math.PI * 2, rk = rr + rng.range(-0.25, 0.25);
          const cx = HUB.x + Math.cos(a) * rk, cz = HUB.z + Math.sin(a) * rk, csc = rng.range(0.86, 1.0), cpot = pots[(i + 1 + (rng.chance(0.2) ? 1 : 0)) % 2];
          cupList.push([cx, TH * (i + 1) + 0.15, cz, csc,
            (i === 3 || i === 2) && Math.hypot(cx - CRAB.x, cz - CRAB.z) < 9.5 ? (cold ? pal.white : i === 3 ? pal.white : pal.orange) : cpot]);
        }
      }
      // the coral head stands on a round of bare card laid on the sugar-paper floor, cut by hand: the one place the daylight lands on, an island of light in the deep
      { const fr = stream('sbr-floor'); cardGeometry(blob(fr, 45, 44, 40, 0.03), { buf: B, thick: 0.5, y: 0.3, top: pal.card, topKind: 2, rim: 0.6, ox: fr() * 30, oz: fr() * 30 }); }
      const head = new THREE.Mesh(B.build(), paint); head.position.set(HUB.x, 0, HUB.z); scene.add(head);
      style.setShadow(12, HUB.x, HUB.z, 35.5, 35.5, 0, TH - 0.4, hour.step ?? 0.9);            // the lowest slab on the floor
      for (let i = 0; i < 5; i++) style.setShadow(7 + i, HUB.x, HUB.z, 35.5 - 5.5 * (i + 1), 35.5 - 5.5 * (i + 1), 0, TH * (i + 2) - 0.4, (hour.step ?? 0.9) * 0.8);   // slab i+1 (radius 35 - 5.5 (i+1)) on the step below it
    }
    await ctx.yield();
    // egg-box trays on the floor: grids of cups on a card tray, painted in rows
    {
      const B = paintBuffers(), nTray = Math.round(46 * Math.min(density, 1.3)), rng = stream('sbr-trays'), rcu = stream('sbr-cups');
      for (let t = 0, tries = 0; t < nTray && tries < 900; tries++) {
        const x = rng.range(BOX.x0 + 14, BOX.x1 - 14), z = rng.range(BOX.z0 + 10, BOX.z1 - 10);
        if (Math.hypot(x - HUB.x, z - HUB.z) < 46) continue;
        if (t % 8 === 7) await ctx.yield();
        t++; trayAt.push([x, z]);
        const nx = rng.int(2, 4), nz = rng.int(3, 5), yaw = rng() * Math.PI, c = Math.cos(yaw), s = Math.sin(yaw), y = rng.chance(0.35) ? rng.range(4, 16) : 0.4;
        const hw = nx * 3.1 + 0.8, hl = nz * 3.1 + 0.8, o = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([u, v]) => [x + u * c - v * s, z + u * s + v * c]);
        cardGeometry(o, { buf: B, thick: 0.6, y: y, top: pal.card, topKind: 2, rim: 0.5, ox: rng() * 30 });
        if (y > 1) for (const p of o) addCylinder(B, [p[0] * 0.97 + x * 0.03, 0, p[1] * 0.97 + z * 0.03], [p[0] * 0.97 + x * 0.03, y, p[1] * 0.97 + z * 0.03], 0.8, 6, tubeCol, 2, false);   // stood on card-tube legs
        const pot = rng.pick(pots);
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
          const u = (i - (nx - 1) / 2) * 6.2, v = (j - (nz - 1) / 2) * 6.2;
          cupList.push([x + u * c - v * s, y + 0.3, z + u * s + v * c, 1, (i + j) % 3 === 2 && rng.chance(0.6) ? rng.pick(pots) : pot]);
        }
      }
      await ctx.yield();
      const HT = ribbonBuffers();
      for (const deg of TRAY_DEG) {
        const th = (deg * Math.PI) / 180, R0 = 25.6, x = HUB.x + Math.cos(th) * R0, z = HUB.z + Math.sin(th) * R0, y = YA + (Y1 - YA) * ss(0.04, 0.96, deg / 360) - 4.6, c = Math.cos(th), sn = Math.sin(th), hw = 3.3, hl = 6.4;
        const o = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([u, v]) => [x + u * c - v * sn, z + u * sn + v * c]);
        cardGeometry(o, { buf: B, thick: 0.6, y, top: pal.card, topKind: 2, rim: 0.5, ox: x * 0.3 });
        for (const e of [-1, 1]) cotton(HT, [x - e * hl * 0.94 * sn, y + 0.3, z + e * hl * 0.94 * c], [x - e * 2 * sn, 186, z + e * 2 * c], 0.05, pal.thread);   // hung by its two ends
        for (const v of [-3.1, 3.1]) shelfCups.push([x - v * sn, y + 0.3, z + v * c, 0.9, cold ? pots[(deg / 2 + (v > 0 ? 1 : 0)) % 2 | 0] : [pal.pink, pal.orange][(deg / 2 + (v > 0 ? 1 : 0)) % 2 | 0]]);
        style.setShadow(13 + [24, 64, 104, 146].indexOf(deg), x, z, 6.6, 3.5, th + Math.PI / 2, y, 0.85);                // each hung tray lays its own lid shadow on the steps and the floor below
      }
      // one more hung tray, to port of the hub: at the golden hour its shadow lies long across the floor beside the coral head, where we see it as we look down
      ranks.push({ kind: 'hungTray', x: HUB.x + 61, z: HUB.z - 35, y: 64, yaw: Math.PI / 2, pot: 1 }); style.setShadow(16, HUB.x + 61, HUB.z - 35, 9.5, 6.4, 0, 64, 0.85);
      let nTall = 0;
      for (const r of ranks) if (r.kind === 'tray' || r.kind === 'hungTray') {
        if (++nTall % 10 === 0) await ctx.yield();
        const c = Math.cos(r.yaw), s = Math.sin(r.yaw), hw = 6.4, hl = 9.5, pot = pots[r.pot % pots.length], pot2 = pots[(r.pot + 1) % pots.length];
        const o = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([u, v]) => [r.x + u * c - v * s, r.z + u * s + v * c]);
        cardGeometry(o, { buf: B, thick: 0.6, y: r.y, top: pal.card, topKind: 2, rim: 0.5, ox: r.x * 0.3 });
        if (r.tube) {                                               // on a tall card tube, taped in sections
          addCylinder(B, [r.x, 0, r.z], [r.x, r.y - 0.3, r.z], 0.85, 8, tubeCol, 2, false);
          for (let ty = 13; ty < r.y - 4; ty += 13.5) addCylinder(B, [r.x, ty, r.z], [r.x, ty + 1.2, r.z], 0.9, 8, pal.tape, 4, false);
        } else { const nearUs = path.nearestXZ(r.x, r.z).dist < 34;                                                  // or hung by its four corners (far off: by two)
          o.forEach((p, pi) => { if (nearUs || pi % 2 === 0) cotton(HT, [p[0] * 0.94 + r.x * 0.06, r.y + 0.3, p[1] * 0.94 + r.z * 0.06], [r.x + (p[0] - r.x) * 0.2, 186, r.z + (p[1] - r.z) * 0.2], 0.05, pal.thread); }); }
        for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { const u = (i - 0.5) * 6.2, v = (j - 1) * 6.2; cupList.push([r.x + u * c - v * s, r.y + 0.3, r.z + u * s + v * c, 1, (i + j) % 2 ? pot2 : pot]); }
      }
      await ctx.yield();
      // ---- DRESSING from its own stream ('sbr-dress'): (1) a long shelf of big cups hung behind each sheet of the link; (2) the back wall's foot: trays of
      // cups on tall card tubes standing against the sugar paper on both sides of the hole and under it (never in its sight), with weed taped to the floor between them;
      // (3) round the coral head's card round: fields of cups glued straight to the floor and short tufts of weed taped down
      {
        const dr = stream('sbr-dress'), pv = new THREE.Vector3();
        const shelf = (x, y, z, hl, hw, yaw, nx, nz, sc, host, tube) => {       // a card shelf with nx by nz cups; on a tall tube, or hung by threads
          const c = Math.cos(yaw), sn = Math.sin(yaw), o = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([u, v]) => [x + u * c - v * sn, z + u * sn + v * c]);
          cardGeometry(o, { buf: B, thick: 0.6, y, top: pal.card, topKind: 2, rim: 0.5, ox: x * 0.3 });
          if (tube) { addCylinder(B, [x, 0, z], [x, y - 0.3, z], 0.9, 8, tubeCol, 2, false); for (let ty = 13; ty < y - 4; ty += 13.5) addCylinder(B, [x, ty, z], [x, ty + 1.2, z], 0.96, 8, pal.tape, 4, false); }
          else for (let k = 0; k < (hl > 12 ? 3 : 2); k++) for (const e of [-1, 1]) { const u = hl > 12 ? (k - 1) * hl * 0.9 : (k - 0.5) * hl * 1.8, px = x + u * c - e * hw * 0.9 * sn, pz = z + u * sn + e * hw * 0.9 * c; cotton(HT, [px, y + 0.3, pz], [px + dr.range(-0.5, 0.5), 186, pz], 0.05, pal.thread); }
          const p0 = dr.int(0, 1);
          for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const u = (i - (nx - 1) / 2) * 6.3 * sc + dr.range(-0.2, 0.2), v = (j - (nz - 1) / 2) * 6.2 * sc; rowCups.push([x + u * c - v * sn, y + 0.3, z + u * sn + v * c, sc * dr.range(0.92, 1.04), pots[(i + j + p0) % 2], host]); }
        };
        // (1) the link: behind each of its four sheets, to port of the parting, a long shelf of big cups hangs across the line of the taped hem at the height we pass
        // at, 12 m behind the sheet, its middle 21 m and more to port of the hem (the same row of pots is seen past the hem and, a counted step bluer, through the film)
        const shelfFree = (x, y, z, hl, hw) => { for (let u = -hl; u <= hl + 0.01; u += hl / 4) if (!freeAt(x + u, y + 2, z, hw + 1.5, true)) return false; return true; };
        // Its far end hangs where it always did; its near end hangs 4 m to port of the hem, or, where a typed fan or roll of its bay would stand or hang in its plan,
        // 1 m clear of where that thing may be dealt (its own radius and the 2.5 m its place is dealt round the spot): there the shelf is that much shorter and
        // carries the cups that fit, so a stand or a thread never passes through the card.
        for (const [zs, hx] of CROSS.slice(0, 4)) { path.pointAt(path.nearestXZ(hx - 12, zs + 12).u, pv);
          const rOf = (S) => (S[0] ? 3.8 : 4.4) * S[5], end = Math.max(hx + 4, ...SPOTS_LINK.filter((S) => S[1] > hx && Math.abs(S[3] - zs - 12.5) < 3.9 + 1 + rOf(S) + 2.5).map((S) => S[1] + rOf(S) + 3.5));
          for (let k = 0, done = false; k < 24 && !done; k++) { const far = hx + 38 + dr.range(0, 3) * (1 + k * 0.3), y = pv.y + 1.5 + dr.range(-1, 1), z = zs + 12.5 + dr.range(-1, 1) * (1 + k * 0.2);
            const near = Math.max(far - 34, end), hl = (far - near) / 2, x = near + hl, nx = Math.max(1, 1 + Math.floor((2 * hl - 3.3) / (6.3 * 1.22)));
            if (shelfFree(x, y, z, hl, 3.9)) { shelf(x, y, z, hl, 3.9, dr.range(-0.05, 0.05), nx, 1, 1.22, 1, false); linkShelves.push([x, z, hl, 3.9, y]); done = true; } } }
        await ctx.yield();
        const WALL = [[TURN_R + 25, 58], [TURN_R + 43, 67], [TURN_R + 63, 52], [TURN_R + 84, 63], [TURN_R - 26, 61], [TURN_R - 45, 50], [TURN_R - 64, 65], [TURN_R - 84, 56], [TURN_R - 7, 44], [TURN_R + 9, 40]];
        for (const [wx, wy] of WALL) { const p = dealNear(dr, wx, wy + 4, BOX.z1 - 7.2, 9, false, 2, 0, 1.2); if (p) shelf(p[0], wy, p[2], 6.6, 4.3, dr.range(-0.12, 0.12), 2, 1, 1, 1, true); }
        for (let i = 0; i < 22; i++) {                                    // (2) weed against the wall: tall crepe either side of the hole, shorter under it (its top below the hole's sight)
          const x = BOX.x0 + 12 + (i + dr()) * ((BOX.x1 - BOX.x0 - 24) / 22), dxh = Math.abs(x - TURN_R), h = dxh < 20 ? dr.range(20, 42) : dr.range(48, 112);
          dressWeed.push([x, BOX.z1 - 2.2 - dr.range(0, 3.5), h, dr.range(1.3, 2.0), dr()]); }
        const FR = 46;                                                    // (3) the floor round the card round (radius 45): cup fields and short weed, clear of the trays that stand there
        for (let i = 0, tries = 0; i < 16 && tries < 200; tries++) {
          const a = dr() * 6.2832, r = FR + 5 + dr() * 34, x = HUB.x + Math.cos(a) * r, z = HUB.z + Math.sin(a) * r, n = dr.int(5, 9), yaw = dr() * 3.14, p0 = dr.pick(pots);
          if (trayAt.some((t) => Math.hypot(t[0] - x, t[1] - z) < 19) || Math.abs(x - TURN_R) < 9 && z > HUB.z) continue;
          i++;
          for (let k = 0; k < n; k++) { const u = ((k % 3) - 1) * 6.1 + (Math.floor(k / 3) % 2) * 3, v = (Math.floor(k / 3) - 1) * 5.4; rowCups.push([x + u * Math.cos(yaw) - v * Math.sin(yaw), 0.15, z + u * Math.sin(yaw) + v * Math.cos(yaw), dr.range(0.8, 1.0), k % 4 === 3 ? dr.pick(pots) : p0, 0]); }
          for (let k = 0; k < 2; k++) dressWeed.push([x + dr.range(-9, 9), z + dr.range(-9, 9), dr.range(9, 19), dr.range(1.0, 1.5), dr()]);
          // the pencil lines the field was set out on: one ruled along each row of cups and running on past its ends where the paint never reached, one squared across them
          const cy = Math.cos(yaw), sy = Math.sin(yaw), rows = Math.ceil(n / 3), at = (u, v) => [x + u * cy - v * sy, z + u * sy + v * cy];
          for (let r = 0; r < rows; r++) floorRules.push([at(-13 - 2 * r, (r - 1) * 5.4 + 0.25), at(15 + 3 * (r % 2), (r - 1) * 5.4 - 0.2)]);
          floorRules.push([at(-9.4, -10), at(-9.1, (rows - 1) * 5.4 + 3)]);
        }
        // and the maker's circle for the coral head's round, drawn on the sugar paper a little larger than the card that was then cut: wobbly, not closed
        for (let k = 0; k < 44; k++) { const q = (j) => { const a = 0.5 + j * 0.127, r = 47.6 + 0.7 * Math.sin(a * 3 + 1) + 0.3 * Math.sin(a * 7); return [HUB.x + Math.cos(a) * r, HUB.z + Math.sin(a) * r]; }; floorRules.push([q(k), q(k + 1)]); }
        for (const t of trayAt) { const a = t[0] * 0.37 + t[1] * 0.11, c = Math.cos(a), sn = Math.sin(a);                 // a pencilled cross where each tray was to stand
          floorRules.push([[t[0] - c * 15, t[1] - sn * 15], [t[0] + c * 16, t[1] + sn * 16]], [[t[0] + sn * 12, t[1] - c * 12], [t[0] - sn * 13, t[1] + c * 13]]); }
      }
      await ctx.yield();
      { const ht = new THREE.Mesh(HT.build(), threadMat); ht.frustumCulled = false; ht.renderOrder = 3; scene.add(ht); }
      scene.add(new THREE.Mesh(B.build(), paintSmall));
      await ctx.yield();
      // the cup: a carton cone, painted outside and in, its cut rim left bare and fluted
      const C = paintBuffers(), SEG = 8, R0 = 1.5, R1 = 2.9, H = 3.4, wh = new THREE.Color(1, 1, 1), dk = new THREE.Color(0.8, 0.8, 0.8);
      for (let k = 0; k <= SEG; k++) {
        const a = (k / SEG) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), arc = a * R1;
        C.v(ca * R0, 0, sa * R0, ca * 0.92, -0.38, sa * 0.92, wh, 3.7, arc, 3.7, 0); C.v(ca * R1, H, sa * R1, ca * 0.92, -0.38, sa * 0.92, wh, 0, arc, 0.0, 0);              // outer wall 0,1
        C.v(ca * R1, H, sa * R1, 0, 1, 0, wh, arc, 0, 0, 1); C.v(ca * (R1 - 0.34), H, sa * (R1 - 0.34), 0, 1, 0, wh, arc, 1, 0, 1);                                      // rim 2,3
        C.v(ca * (R1 - 0.34), H, sa * (R1 - 0.34), -ca * 0.92, 0.38, -sa * 0.92, dk, 0, arc, 0.5, 0); C.v(ca * (R0 - 0.3), 0.4, sa * (R0 - 0.3), -ca * 0.5, 0.86, -sa * 0.5, dk, 3.4, arc, 3.4, 0);   // inner wall 4,5
      }
      const cb = C.v(0, 0.4, 0, 0, 1, 0, dk, 0, 0, 3, 0);
      for (let k = 0; k < SEG; k++) {
        const a = k * 6, b = a + 6;
        C.tri(a, a + 1, b + 1); C.tri(a, b + 1, b); C.tri(a + 2, a + 3, b + 3); C.tri(a + 2, b + 3, b + 2); C.tri(a + 4, a + 5, b + 5); C.tri(a + 4, b + 5, b + 4); C.tri(a + 5, cb, b + 5);
      }
      const cups = new THREE.InstancedMesh(C.build(), paintSmall, cupList.length), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      cupList.forEach((c, i) => {
        e.set((rcu() - 0.5) * 0.12, rcu() * 6.28, (rcu() - 0.5) * 0.12); q4.setFromEuler(e);
        m4.compose(v3.set(c[0], c[1], c[2]), q4, s3.setScalar(c[3])); cups.setMatrixAt(i, m4); cups.setColorAt(i, c[4]);
      });
      cups.frustumCulled = false; scene.add(cups);
      await ctx.yield();
      { const rs = stream('sbr-shelf'), sc = new THREE.InstancedMesh(cups.geometry, paintSmall, shelfCups.length);
        shelfCups.forEach((c, i) => { e.set((rs() - 0.5) * 0.12, rs() * 6.28, (rs() - 0.5) * 0.12); q4.setFromEuler(e); m4.compose(v3.set(c[0], c[1], c[2]), q4, s3.setScalar(c[3])); sc.setMatrixAt(i, m4); sc.setColorAt(i, c[4]); });
        sc.frustumCulled = false; scene.add(sc); }
      { const rs = stream('sbr-row'), rc = new THREE.InstancedMesh(cups.geometry, paintSmall, Math.max(1, rowCups.length));   // the dressing's cups
        rowCups.forEach((c, i) => { e.set((rs() - 0.5) * 0.12, rs() * 6.28, (rs() - 0.5) * 0.12); q4.setFromEuler(e); m4.compose(v3.set(c[0], c[1], c[2]), q4, s3.setScalar(c[3])); rc.setMatrixAt(i, m4); rc.setColorAt(i, c[4]); });
        rc.frustumCulled = false; scene.add(rc); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- weed: crepe streamers taped to the floor, held up by thread, ruffled along both edges and twisting in the draught
    const uWeedGust = { value: 0 };
    const crepeMat = style.paintMaterial({ side: THREE.DoubleSide, vertWater: true, cut: true, uniforms: { uWeedGust }, hookDecl: 'uniform float uWeedGust;', hook: /* glsl */`
      #ifdef USE_INSTANCING
      { float h = pos.y, ph = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.23;
        float len = length(instanceMatrix[1].xyz), wid = length(instanceMatrix[0].xyz);
        float turns = 1.1 + 1.4 * fract(ph * 0.37);                                            // every streamer makes at least one full twist: lighter face, edge-on, darker back
        float tw = ph + h * turns * 6.2832 + 0.7 * sin(uTime * 0.45 + ph + h * 3.) * (1. - uWeedGust);
        float x = pos.x * (1. - 0.85 * smoothstep(0.95, 1.0, h));                              // gathered to a point where the thread ties on
        float c = cos(tw), s = sin(tw); pos = vec3(c * x, pos.y, -s * x); nrm = vec3(s, 0., c);
        float sway = sin(uTime * 0.62 + ph + h * 2.4) * 1.8 + sin(uTime * 0.23 + ph * 0.6) * 1.2;
        float bow = h * (1. - h) * 2.2;
        pos.x += (sway * (1. - uWeedGust) + 12. * uWeedGust) * bow; pos.z += (cos(uTime * 0.5 + ph * 1.3 + h * 2.) * 1.9 * (1. - uWeedGust) + 18. * uWeedGust) * bow;
        pnt = vec4(h * len, aPaint.y, wid * 0.5, 6.); }
      #endif` });
    {
      const B = paintBuffers(), NS = 72, wh = new THREE.Color(1, 1, 1), rng = stream('sbr-weed');
      for (let j = 0; j <= NS; j++) { const t = j / NS; B.v(-0.5, t, 0, 0, 0, 1, wh, t, -1, 0.5, 6); B.v(0.5, t, 0, 0, 0, 1, wh, t, 1, 0.5, 6); }
      for (let j = 0; j < NS; j++) { const k = j * 2; B.tri(k, k + 1, k + 3); B.tri(k, k + 3, k + 2); }
      const nW = Math.round(260 * Math.min(density, 1.3)), rankWeed = ranks.filter((r) => r.kind === 'weed'), weed = new THREE.InstancedMesh(B.build(), crepeMat, nW + rankWeed.length + dressWeed.length); let wN = 0;
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      const TR = ribbonBuffers(), TB = paintBuffers(), qL = new THREE.Quaternion(), vL = new THREE.Vector3();
      // THE GARDEN (130 streamers at full density: the garden's own half of the brief's 260; the ranks and the dressing hang the rest). Seven in ten stand about the
      // lane in clumps (a dozen clump places dealt on both sides of it, each streamer dealt round one of them), the others along the box's two long edges. A streamer
      // is a column from the floor up, and those near the lane hang on a thread to the lid, so each is tested as a column by the two rules of the place: none within
      // 2.5 m of the ride's way, none in the stage's sight (which keeps the garden open from the entry to the coral head) or the hole's. Nor may one stand in the
      // eel's reach or between the lane and the eel, or in the octopus's room. A refused place is dealt again; after twelve refusals the streamer is left out.
      const clumps = []; for (let k = 0; k < 12; k++) clumps.push([(k % 2 ? 1 : -1) * rng.range(11, 58), rng.range(BOX.z0 + 8, 41)]);
      for (let i = 0; i < nW; i += 2) {
        const lane = i < nW * 0.7; let x = 0, z = 0, side = 1, near = false, hgt = 0, ok = false;
        for (let k = 0; k < 12 && !ok; k++) {
          if (lane) { const c = clumps[rng.int(0, clumps.length - 1)]; x = c[0] + rng.gauss() * 4.2; z = c[1] + rng.gauss() * 4.2; }
          else { x = (rng.chance(0.5) ? 1 : -1) * rng.range(112, 144); z = rng.range(BOX.z0 + 3, BOX.z1 - 6); }
          side = x < 0 ? -1 : 1; near = lane && Math.abs(x) < 30; hgt = near ? rng.range(72, 120) : rng.range(34, 105);
          const eelRoom = (x > 3 && x < 86 && z > 30.5 && z < 37.6) || (x > 3 && x < 24 && z > 18.5 + 0.64 * x && z < 37.6), octRoom = spottedCast && Math.abs(x + 28) < 7 && Math.abs(z - 31) < 7;
          ok = Math.abs(x) < BOX.x1 - 4 && z > BOX.z0 + 3 && z < BOX.z1 - 6 && !eelRoom && !octRoom && freeAt(x, 1, z, 1.5, true);
        }
        if (!ok) continue;
        const leanW = lane ? Math.max(-0.03, (((i * 13) % 7) - 3) * 0.05 * (i % 3 === 0 ? 2.2 : 1)) : 0, wid = near ? rng.range(0.9, 1.3) : rng.range(1.2, 1.9);   // some lean
        const yawW = rng() * 6.28, colW = rng.chance(0.5) ? crepeA : crepeB, txW = (near || i % 3 === 0) ? rng.range(-1, 1) : 0;
        const ta = rng() * 3.14, tc = Math.cos(ta), ts = Math.sin(ta);
        if (i % 60 === 58) await ctx.yield();
        q4.setFromAxisAngle(up, yawW); if (leanW) q4.premultiply(qL.setFromAxisAngle(vL.set(0, 0, 1), -leanW * side));      // (leaning out from the lane)
        m4.compose(v3.set(x, 0, z), q4, s3.set(wid, hgt, wid)); weed.setMatrixAt(wN, m4);
        weed.setColorAt(wN++, colW);
        if (near && i % 8 === 0) cotton(TR, [x + Math.sin(leanW * side) * hgt, Math.cos(leanW) * hgt, z], [x + Math.sin(leanW * side) * hgt + txW, 186, z], 0.05, pal.thread);              // the thread that holds it up
        rect(TB, [x - tc * 1.6 + ts * 0.6, 0.12, z - ts * 1.6 - tc * 0.6], [tc * 3.2, 0, ts * 3.2], [-ts * 1.2, 0, tc * 1.2], [0, 1, 0], pal.tape, 4);   // taped to the floor
      }
      rankWeed.forEach((r, k) => {                                   // the ranks' streamers: taller and broader, to read through a sheet or two
        m4.compose(v3.set(r.x, 0, r.z), q4.setFromAxisAngle(up, r.x * 1.7 + r.z), s3.set(r.sc, r.y, r.sc)); weed.setMatrixAt(wN, m4);
        weed.setColorAt(wN++, k % 4 ? crepeA : crepeB);
        cotton(TR, [r.x, r.y, r.z], [r.x + 0.5, 186, r.z], 0.05, pal.thread);
        const tc = Math.cos(r.x), ts = Math.sin(r.x);
        rect(TB, [r.x - tc * 1.9 + ts * 0.6, 0.12, r.z - ts * 1.9 - tc * 0.6], [tc * 3.8, 0, ts * 3.8], [-ts * 1.2, 0, tc * 1.2], [0, 1, 0], pal.tape, 4);
      });
      for (const [x, z, h, w, q] of dressWeed) {                      // the dressing's streamers (against the back wall, round the coral head's floor): taped down, the tall ones on a thread
        m4.compose(v3.set(x, 0, z), q4.setFromAxisAngle(up, q * 6.28), s3.set(w, h, w)); weed.setMatrixAt(wN, m4); weed.setColorAt(wN++, q > 0.5 ? crepeA : crepeB);
        if (h > 40 && q > 0.3) cotton(TR, [x, h, z], [x + q - 0.5, 186, z], 0.05, pal.thread);
        const tc = Math.cos(q * 9), ts = Math.sin(q * 9); rect(TB, [x - tc * 1.7 + ts * 0.6, 0.12, z - ts * 1.7 - tc * 0.6], [tc * 3.4, 0, ts * 3.4], [-ts * 1.2, 0, tc * 1.2], [0, 1, 0], pal.tape, 4);
      }
      weed.count = wN; weed.instanceMatrix.needsUpdate = true; if (weed.instanceColor) weed.instanceColor.needsUpdate = true;
      weed.frustumCulled = false; scene.add(weed);
      const th = new THREE.Mesh(TR.build(), threadMat); th.frustumCulled = false; th.renderOrder = 3; scene.add(th);
      scene.add(new THREE.Mesh(TB.build(), paintSmall));
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the hero: the box-lid manta and its mobile of foil sardines
    // (the flash band's place on the clock, the beat's and the manta's own swing are drawn from the seed, on their own stream)
    const phR = stream('sbr-phase'), swingPh = phR() * 6.2832;
    const hero = PART.buildHero ? await PART.buildHero(ctx, { style, stage: false, spin: 1, bandPhase: phR() * 6.2832, beatPhase: phR() * 6.2832, overSight: (r) => overSight(r) }) : null;
    const haulPh = phR() * 6.2832, strokePh = phR() * 6.2832;      // (the hand's pull and the turtle's stroke each begin where the seed deals them)
    const ARM_PIVOT = new THREE.Vector3(HUB.x, 152, HUB.z); if (hero && hero.anchors && hero.anchors.wireArm) ARM_PIVOT.copy(hero.anchors.wireArm.pivot).add(new THREE.Vector3(HUB.x, 0, HUB.z));
    if (hero) { hero.object.position.set(HUB.x, 0, HUB.z); scene.add(hero.object); }
    await ctx.yield();

    // ---------------------------------------------------------------- the ride: a card turtle on its haul string (built by the world, carried with the camera)
    const turtle = new THREE.Group(); turtle.matrixAutoUpdate = false; turtle.userData.ride = true; scene.add(turtle);
    const rig = new THREE.Group(); turtle.add(rig);               // surges on the haul clock
    const SHY = -1.6, RIGY = -1.5, RIGZ = -2.9, lineMat = style.lineMaterial();   // the rig hangs 3.1 m under the eye and 2.9 m ahead: by the lens (62 degrees) the whole head and both whole flippers are then inside the frame, and the shell's front in its lower fifth
    const flip = [], headPiv = new THREE.Group();
    {
      // a round dab of paint laid on a flat (a fan of nine corners, a little out of true), from the turtle's own random stream
      const tr = stream('sbr-turtle'), tDab = pal.green.clone().lerp(pal.yellow, 0.42);
      const tdab = (Bf, cx, cz, r, col, y) => { const e = Bf.v(cx, y, cz, 0, 1, 0, col, 0, 0, 1, 4), i0 = Bf.pos.length / 3, a0 = tr() * 6.2832;
        for (let k = 0; k < 9; k++) { const a = a0 + (k / 9) * 6.2832, rk = r * (0.82 + 0.3 * tr()); Bf.v(cx + Math.cos(a) * rk, y, cz + Math.sin(a) * rk * 1.15, 0, 1, 0, col, 0, 0, 1, 4); }
        for (let k = 0; k < 9; k++) Bf.tri(e, i0 + (k + 1) % 9, i0 + k); };
      const B = paintBuffers(), sh = blob(tr, 1.85, 2.5, 22, 0.02).map((p) => [p[0], p[1] - 1.5]);
      cardGeometry(sh, { buf: B, thick: 0.14, y: SHY + 0.08, top: pal.green, bottom: pal.card, bottomKind: 2, rim: 0.34, brush: 1.57, ox: 3 });
      rect(B, [-0.6, SHY + 0.17, -4.25], [1.2, 0, 0.1], [0, 0, 0.5], [0, 1, 0], pal.tape, 4);                       // the taped loop the string pulls on
      addFastener(B, 0, SHY + 0.15, -3.7, 0.16, 1, pal.brass, 0.4);
      for (const s of [-1, 1]) addFastener(B, s * 1.45, SHY + 0.15, -2.75, 0.16, 1, pal.brass, s);
      rig.add(new THREE.Mesh(finePaint(B.build(), 2.6), paintSmall));
      const R = ribbonBuffers(), yp = SHY + 0.17, pc = pal.pencil;      // pencilled scutes
      const hex = (cx, cz, r) => { const o = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * 6.2832 + 0.52; o.push([cx + Math.cos(a) * r * 0.9 + (tr() - 0.5) * 0.05, yp, cz + Math.sin(a) * r + (tr() - 0.5) * 0.05]); } return o; };
      for (const [cx, cz, r] of [[0, -2.9, 0.52], [0, -1.8, 0.56], [0, -0.6, 0.56], [-0.98, -2.35, 0.5], [0.98, -2.35, 0.5], [-1.02, -1.2, 0.52], [1.02, -1.2, 0.52]]) { R.path(hex(cx, cz, r), 0.06, pc); tdab(B, cx + (tr() - 0.5) * 0.12, cz + (tr() - 0.5) * 0.12, 0.2 + 0.08 * tr(), tDab, SHY + 0.16); }
      const pen = new THREE.Mesh(R.build(), lineMat); pen.frustumCulled = false; pen.renderOrder = 6; rig.add(pen);
      // head: one flat on one fastener, nodding
      const H = paintBuffers(), ho = [[-0.42, 0.25], [-0.62, -0.75], [-0.4, -1.5], [0, -1.78], [0.4, -1.5], [0.62, -0.75], [0.42, 0.25]];
      cardGeometry(ho, { buf: H, thick: 0.14, y: -0.08, top: pal.green, bottom: pal.card, rim: 0.2, brush: 1.57, ox: 9 });
      for (const [cx, cz, r] of [[0.02, -0.3, 0.11], [-0.2, -0.66, 0.09], [0.21, -0.6, 0.1], [0.0, -0.93, 0.085], [-0.13, -1.3, 0.07], [0.14, -1.24, 0.075]]) tdab(H, cx, cz, r, tDab, 0.0);
      for (const s of [-1, 1]) { tdab(H, s * 0.31, -1.07, 0.16, pal.white, 0.012); tdab(H, s * 0.33, -1.1, 0.075, pal.black, 0.024); }   // each eye a white dab with a black dot
      { const Rh = ribbonBuffers(); Rh.path([[-0.33, 0.02, -1.4], [-0.17, 0.02, -1.52], [0.02, 0.02, -1.57], [0.19, 0.02, -1.51], [0.33, 0.02, -1.41]], 0.05, pal.pencil);   // a pencilled mouth line
        Rh.path([[-0.3, 0.02, -0.02], [-0.1, 0.02, -0.1], [0.12, 0.02, -0.09], [0.3, 0.02, -0.01]], 0.045, pal.pencil);                                                // and the crease of the neck
        const m = new THREE.Mesh(Rh.build(), lineMat); m.frustumCulled = false; m.renderOrder = 6; headPiv.add(m); }
      headPiv.position.set(0, SHY + 0.24, -3.7); headPiv.add(new THREE.Mesh(finePaint(H.build(), 2.6), paintSmall)); rig.add(headPiv);
      for (const s of [-1, 1]) {                                   // front flippers, 3.2 m, rowing on brass fasteners
        const F = paintBuffers(), fo = [[-0.3, 0.3], [1.0, 0.42], [2.4, 0.36], [3.2, -0.08], [2.6, -0.46], [1.2, -0.5], [-0.3, -0.3]].map((p) => [p[0] * s, p[1]]);
        cardGeometry(fo, { buf: F, thick: 0.14, y: -0.08, top: pal.green, bottom: pal.card, rim: 0.2, brush: 0.2 * s, ox: 14 + s * 5 });
        for (const [cx, cz, r] of [[0.75, 0.0, 0.14], [1.38, -0.06, 0.12], [1.95, 0.02, 0.13], [2.5, -0.06, 0.1]]) tdab(F, cx * s, cz + (tr() - 0.5) * 0.08, r, tDab, 0.0);
        const Rf = ribbonBuffers();                                // a few pencilled scale arcs across the blade
        for (const x0 of [1.05, 1.66, 2.24]) { const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6 - 0.5; pts.push([(x0 + 0.2 * (1 - 4 * t * t) + (tr() - 0.5) * 0.03) * s, 0.02, t * (0.62 - 0.1 * (x0 - 1)) - 0.04]); } Rf.path(pts, 0.045, pal.pencil); }
        const pv = new THREE.Group(); pv.position.set(s * 1.5, SHY + 0.24, -2.75); pv.add(new THREE.Mesh(finePaint(F.build(), 2.6), paintSmall)); rig.add(pv); flip.push({ pv, s });
        { const m = new THREE.Mesh(Rf.build(), lineMat); m.frustumCulled = false; m.renderOrder = 6; pv.add(m); }
      }
    }
    // the white haul string, in three lengths that are one line: (A) from behind us along the course to where the turn begins and straight on, rising to the run in's line;
    // (C) the stretch we come back onto as the turn ends; (D) on through the last partings to the hole. For the turn it goes slack: A, C and D fade out and a short
    // sagging loop hangs from the taped loop on the turtle's nose (always there, drawn in to nothing outside the turn), so no line crosses the picture while we circle.
    const strA = style.lineMaterial({ uniforms: { uMaxA: { value: 1 } } }), strC = style.lineMaterial({ uniforms: { uMaxA: { value: 0 } } }), strD = style.lineMaterial({ uniforms: { uMaxA: { value: 1 } } }), strS = style.lineMaterial({ uniforms: { uMaxA: { value: 0 } } });
    const slack = new THREE.Group();
    {
      const SY = SHY + RIGY - 0.12, N = 220, PA = [], yRun = Y1 + SY, pv = new THREE.Vector3();
      for (let i = 0; i <= N; i++) { path.pointAt(i / N, pv); if (i > 8 && pv.z >= HUB.z - 0.01) break; PA.push([pv.x, pv.y + SY, pv.z]); }
      for (let i = 0; i <= 12; i++) { const t = i / 12; PA.push([TURN_R, YA + SY + (yRun - (YA + SY)) * ss(0, 1, t), HUB.z + 32 * t]); }
      const mk = (pts, mat) => { const R = ribbonBuffers(); R.path(pts, 0.11, pal.white); const m = new THREE.Mesh(R.build(), mat); m.frustumCulled = false; m.renderOrder = 4; m.userData.ride = true; scene.add(m); return m; };
      const run = (z0, z1) => { const o = []; for (let z = z0; z < z1 - 0.01; z += 2.5) o.push([TURN_R, yRun, z]); o.push([TURN_R, yRun, z1]); return o; };
      mk(PA, strA); mk(run(HUB.z - 12, HUB.z + 32), strC); mk(run(HUB.z + 32, BOX.z1 + 6), strD);
      // (S) while the arm carries us the length beyond the turn hangs slack: out of the hole, down in a sag to the floor and along it toward where the turn ends
      { const PS = [[TURN_R, yRun, BOX.z1 + 6], [TURN_R, yRun, BOX.z1]];
        for (let i = 1; i <= 34; i++) { const d = i * 2.6, drop = 1 - Math.exp(-d / 11); PS.push([TURN_R + 1.6 * Math.sin(d * 0.07) * drop, Math.max(0.35, yRun - (yRun - 0.35) * drop * (1 + 0.12 * Math.min(1, d / 30))), BOX.z1 - d]); }
        mk(PS, strS); }
      const R = ribbonBuffers(), P = [];
      for (let i = 0; i <= 28; i++) { const t = i / 28, sw = Math.sin(Math.PI * Math.pow(t, 0.8));                       // out to one side of the head in a sagging loop and back toward the nose: all of it in the bottom fifth of the frame
        P.push([2.9 * sw + 0.5 * t + 0.12 * Math.sin(t * 11), -0.75 * Math.sin(Math.PI * t) - 0.5 * t, 0.5 - 2.4 * Math.sin(Math.PI * 0.5 * t) - 1.9 * t * t]); }
      R.path(P, 0.1, pal.white);
      const m = new THREE.Mesh(R.build(), lineMat); m.frustumCulled = false; m.renderOrder = 6; slack.add(m);
      slack.position.set(0, SHY + 0.2, -4.3); slack.scale.setScalar(0.001); rig.add(slack);
    }
    // the two hang threads: cotton in the world, not lines on the picture. On the straights each rises a degree or two off the vertical (not the same two) and sways a little,
    // out of step with the haul; for the turn their tops are drawn together onto the hooked end of the mobile's wire arm above us. Thinner, so fainter, toward the top.
    const hangMat = style.lineMaterial({ uniforms: { uMinA: { value: 0.1 }, uMaxA: { value: 1 } } }), HANG_D = [0, 1.5, 3, 4.5, 7, 14, 70], HANG_W = [0.016, 0.014, 0.011, 0.0055, 0.004, 0.003, 0.003];
    const hangs = (() => {
      const R = ribbonBuffers();
      for (let s = 0; s < 2; s++) for (let j = 0; j < 6; j++) { R.add([0, j, 0], [0, j + 1, 0], 0.01, pal.thread); const o = (s * 6 + j) * 12; R.lin[o + 1] = R.lin[o + 4] = HANG_W[j]; R.lin[o + 7] = R.lin[o + 10] = HANG_W[j + 1]; }
      const g = R.build(); g.getAttribute('position').setUsage(THREE.DynamicDrawUsage); g.getAttribute('aOther').setUsage(THREE.DynamicDrawUsage);
      const m = new THREE.Mesh(g, hangMat); m.frustumCulled = false; m.renderOrder = 6; m.userData.ride = true; scene.add(m); return m;
    })();
    // the wire arm of the mobile that takes our threads and carries us once round: from the hub above the manta out to an elbow ahead of us and back to the hook over our heads
    const armMesh = (() => {
      const R = ribbonBuffers(); for (let j = 0; j < 5; j++) R.add([0, j, 0], [0, j + 1, 0], j < 2 ? 0.1 : 0.085, pal.wire);       // hub to elbow, elbow to hook, and the hook itself: a J of three short lengths
      const g = R.build(); g.getAttribute('position').setUsage(THREE.DynamicDrawUsage); g.getAttribute('aOther').setUsage(THREE.DynamicDrawUsage);
      const m = new THREE.Mesh(g, lineMat); m.frustumCulled = false; m.renderOrder = 6; m.userData.ride = true; scene.add(m); return m;
    })();
    const setSeg = (g, j, a, b) => { const p = g.getAttribute('position'), o = g.getAttribute('aOther'), k = j * 4;
      p.setXYZ(k, a.x, a.y, a.z); p.setXYZ(k + 1, a.x, a.y, a.z); p.setXYZ(k + 2, b.x, b.y, b.z); p.setXYZ(k + 3, b.x, b.y, b.z);
      o.setXYZ(k, b.x, b.y, b.z); o.setXYZ(k + 1, b.x, b.y, b.z); o.setXYZ(k + 2, a.x, a.y, a.z); o.setXYZ(k + 3, a.x, a.y, a.z); };
    await ctx.yield();

    // ---------------------------------------------------------------- the exit: a hole snipped in the sugar paper in short straight cuts, taped, a pencil circle the scissors did not follow
    {
      const B = paintBuffers(), R = ribbonBuffers(), n = 15, z = BOX.z1 - 0.06, ring = [], rri = stream('sbr-ring');
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832 + 0.2, r = 7.75 + rri.range(0, 0.75); ring.push([EXIT[0] + Math.cos(a) * r, EXIT[1] + Math.sin(a) * r]); }
      for (let i = 0; i < n; i++) {
        const a = ring[i], b = ring[(i + 1) % n], a1 = (i / n) * 6.2832 + 0.2, a2 = ((i + 1) / n) * 6.2832 + 0.2;
        const oa = [EXIT[0] + Math.cos(a1) * 12.5, EXIT[1] + Math.sin(a1) * 12.5], ob = [EXIT[0] + Math.cos(a2) * 12.5, EXIT[1] + Math.sin(a2) * 12.5];
        const i0 = B.v(a[0], a[1], z, 0, 0, -1, pal.deep, a[0], a[1], 9, 4), i1 = B.v(b[0], b[1], z, 0, 0, -1, pal.deep, b[0], b[1], 9, 4);
        const i2 = B.v(ob[0], ob[1], z, 0, 0, -1, pal.deep, ob[0], ob[1], 9, 4), i3 = B.v(oa[0], oa[1], z, 0, 0, -1, pal.deep, oa[0], oa[1], 9, 4);
        B.idx.push(i0, i1, i2, i0, i2, i3);
        // the cut edge of the wall behind the paper: brown and fluted, 0.3 m deep
        const c0 = B.v(a[0], a[1], z, 0, 0, -1, pal.card, i * 3.2, 0, 0, 1), c1 = B.v(b[0], b[1], z, 0, 0, -1, pal.card, i * 3.2 + 3.2, 0, 0, 1);
        const c2 = B.v(b[0] * 0.955 + EXIT[0] * 0.045, b[1] * 0.955 + EXIT[1] * 0.045, z + 0.3, 0, 0, -1, pal.card, i * 3.2 + 3.2, 1, 0, 1), c3 = B.v(a[0] * 0.955 + EXIT[0] * 0.045, a[1] * 0.955 + EXIT[1] * 0.045, z + 0.3, 0, 0, -1, pal.card, i * 3.2, 1, 0, 1);
        B.idx.push(c0, c1, c2, c0, c2, c3);
        if (i % 4 === 1) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = (b[0] - a[0]) * 0.55, dy = (b[1] - a[1]) * 0.55, px = -dy * 0.36, py = dx * 0.36;   // a strip of masking tape over the join
          const t0 = B.v(mx - dx - px, my - dy - py, z - 0.05, 0, 0, -1, pal.tape, 0, 0, 9, 4), t1 = B.v(mx + dx - px, my + dy - py, z - 0.05, 0, 0, -1, pal.tape, 3, 0, 9, 4);
          const t2 = B.v(mx + dx + px, my + dy + py, z - 0.05, 0, 0, -1, pal.tape, 3, 1, 9, 4), t3 = B.v(mx - dx + px, my - dy + py, z - 0.05, 0, 0, -1, pal.tape, 0, 1, 9, 4);
          B.idx.push(t0, t1, t2, t0, t2, t3); }
      }
      // a thick hoop of brown card glued round the cut, in three layers of 0.3 m card stepping back to the wall: every cut edge brown, its flutes showing
      for (let L = 0; L < 3; L++) {
        const zf = z - 0.3 * (3 - L), wOut = 0.75 + 0.5 * L, tw = 0.07 * (L - 1);
        const pt = (i, w) => { const q = ring[((i % n) + n) % n], ax = q[0] - EXIT[0], ay = q[1] - EXIT[1], l = Math.hypot(ax, ay), c = Math.cos(tw), sn = Math.sin(tw), k = (l + w) / l; return [EXIT[0] + (ax * c - ay * sn) * k, EXIT[1] + (ax * sn + ay * c) * k]; };
        for (let i = 0; i < n; i++) {
          const a0 = pt(i, 0.02 * L), a1 = pt(i + 1, 0.02 * L), b0 = pt(i, wOut), b1 = pt(i + 1, wOut), bu = i * 3.3 + L * 1.7;
          const f = [[a0, 0], [a1, 3.3], [b1, 3.3], [b0, 0]].map(([q, u]) => B.v(q[0], q[1], zf, 0, 0, -1, pal.card, bu + u, q[1] * 0.3, 9, 2)); B.idx.push(f[0], f[1], f[2], f[0], f[2], f[3]);          // its face: bare card
          const o = [[b0, 0, zf, 0], [b1, 3.3, zf, 0], [b1, 3.3, zf + 0.3, 1], [b0, 0, zf + 0.3, 1]].map(([q, u, zz, v]) => B.v(q[0], q[1], zz, 0, 0, -1, pal.card, bu + u, v, 0, 1)); B.idx.push(o[0], o[1], o[2], o[0], o[2], o[3]);   // outer cut edge
          const ii = [[a0, 0, zf, 0], [a1, 3.3, zf, 0], [a1, 3.3, zf + 0.3, 1], [a0, 0, zf + 0.3, 1]].map(([q, u, zz, v]) => B.v(q[0], q[1], zz, 0, 0, -1, pal.card, bu + u, v, 0, 1)); B.idx.push(ii[0], ii[1], ii[2], ii[0], ii[2], ii[3]);   // inner cut edge
        }
      }
      // the maker's pencil circle: drawn freehand round where the hole was to be, a little larger than the hole the scissors then cut and not quite on its centre, wobbly,
      // not closed, a faint graphite line on the sugar paper, lost under two strips of tape
      const TAPES = [0.95, 4.05], graphite = pal.pencil.clone().lerp(new THREE.Color(1, 1, 1), 0.38); let seg = [];
      for (let i = 0; i <= 90; i++) { const a = 0.5 + (i / 90) * 5.95, r = 9.25 + 0.22 * Math.sin(a * 2.3 + 1) + 0.12 * Math.sin(a * 5.1) + 0.3 * (i / 90);      // (freehand: it does not quite close)
        const hid = TAPES.some((t) => Math.abs(Math.atan2(Math.sin(a - t), Math.cos(a - t))) < 0.075);
        if (hid) { if (seg.length > 1) R.path(seg, 0.1, graphite); seg = []; } else seg.push([EXIT[0] + 0.9 + Math.cos(a) * r * 0.97, EXIT[1] - 0.7 + Math.sin(a) * r * 1.03, z - 0.13]); }
      if (seg.length > 1) R.path(seg, 0.1, graphite);
      for (const t of TAPES) { const c = Math.cos(t), sn = Math.sin(t), q = (r, w) => [EXIT[0] + 0.9 + c * r - sn * w, EXIT[1] - 0.7 + sn * r + c * w];
        const pts = [q(8.3, -0.62), q(11.7, -0.55), q(11.6, 0.66), q(8.4, 0.6)], ids = pts.map(([x, y], k) => B.v(x, y, z - 0.07, 0, 0, -1, pal.tape, k % 3, k > 1 ? 1 : 0, 9, 4)); B.idx.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]); }
      const pencil = pal.deep.clone().multiplyScalar(0.34), X = EXIT[0], Y = EXIT[1], zb = BOX.z1, T = BOX.top - 14;
      // the sugar paper was pasted up by hand in sheets: each a slightly different blue from its place in the packet, a hard and not quite level edge where one laps the next
      // (the paper a touch deeper where it is double), one corner come away beside its strip of tape, and the ruled pencil lines the hole was set out on
      const tone = (k) => pal.deep.clone().multiplyScalar(k);
      const Q = (pts, col, zz, kind = 4) => { const i = pts.map(([x, y]) => B.v(x, y, zz, 0, 0, -1, col, x * 0.6 + y * 0.3, y * 0.5 - x * 0.2, 9, kind)); B.idx.push(i[0], i[1], i[2], i[0], i[2], i[3]); };
      const xl0 = X - 18.9, xl1 = X - 17.6, xr0 = X + 18.4, xr1 = X + 17.5, ys0 = Y + 9.2, ys1 = Y + 10.1;      // the left lap (bottom, top), the right lap, the level lap (left end, right end)
      Q([[BOX.x0, 0], [xl0, 0], [xl1, T], [BOX.x0, T]], tone(1.1), zb - 0.075);
      Q([[xr0 + 2.4, 0], [BOX.x1, 0], [BOX.x1, T], [xr1 + 2.4, T]], tone(0.92), zb - 0.075);
      Q([[xl1 + 2.3, ys0 + 2.3], [xr1, ys1 + 2.3], [xr1, T], [xl1 + 2.3, T]], tone(1.05), zb - 0.075);
      Q([[xl0, 0], [xl0 + 2.3, 0], [xl1 + 2.3, T], [xl1, T]], tone(0.78), zb - 0.085);
      Q([[xr0, 0], [xr0 + 2.4, 0], [xr1 + 2.4, T], [xr1, T]], tone(0.78), zb - 0.085);
      Q([[xl0 + 2.3, ys0], [xr0 - 3.6, ys1 - 0.1], [xr0 - 3.6, ys1 + 2.2], [xl0 + 2.3, ys0 + 2.3]], tone(0.78), zb - 0.085);
      { const cx = xr0 - 0.1, cy = ys1, a = [cx - 3.6, cy - 0.1], b = [cx + 0.1, cy + 4.1];                           // the level sheet's corner, lifted: bare card under it, the paper's paler back curling out
        const i0 = B.v(cx, cy, zb - 0.095, 0, 0, -1, pal.card, 0, 0, 9, 2), i1 = B.v(a[0], a[1], zb - 0.095, 0, 0, -1, pal.card, 3, 0, 9, 2), i2 = B.v(b[0], b[1], zb - 0.095, 0, 0, -1, pal.card, 0, 3, 9, 2); B.idx.push(i0, i1, i2);
        const back = tone(1.5), j0 = B.v(a[0], a[1], zb - 0.1, 0, 0.5, -0.8, back, 0, 0, 9, 4), j1 = B.v(b[0], b[1], zb - 0.1, 0, 0.5, -0.8, back, 4, 0, 9, 4), j2 = B.v(cx - 1.5, cy + 1.6, zb - 1.7, 0, 0.5, -0.8, back, 2, 2, 9, 4); B.idx.push(j0, j1, j2);
        const mx = (a[0] + b[0]) / 2 - 1.3, my = (a[1] + b[1]) / 2 + 1.3, px = 0.69, py = -0.72;                         // tape across the fold, half peeled with it
        Q([[mx - px * 2.6 - py * 0.6, my - py * 2.6 + px * 0.6], [mx + px * 1.9 - py * 0.6, my + py * 1.9 + px * 0.6], [mx + px * 1.9 + py * 0.6, my + py * 1.9 - px * 0.6], [mx - px * 2.6 + py * 0.6, my - py * 2.6 - px * 0.6]], pal.tape, zb - 0.12); }
      const rule = (x0, y0, x1, y1) => R.add([x0, y0, zb - 0.14], [x1, y1, zb - 0.14], 0.12, graphite);
      { const fg = pal.pencil.clone().lerp(new THREE.Color(1, 1, 1), 0.62); for (const [p0, p1] of floorRules) R.add([p0[0], 0.09, p0[1]], [p1[0], 0.09, p1[1]], 0.3, fg); }   // the floor's pencil lines (set out in the dressing above)
      const tapeAt = (cx, cy, sk) => Q([[cx - 2.3, cy - 0.6 + sk], [cx + 2.3, cy - 0.6 - sk], [cx + 2.3, cy + 0.6 - sk], [cx - 2.3, cy + 0.6 + sk]], pal.tape, zb - 0.12);
      for (const [ty, sk] of [[Y - 17, 0.25], [Y + 1.5, -0.2], [Y + 22, 0.3]]) tapeAt(xr0 + 1.2 - (ty / T) * 0.9, ty, sk);      // strips of tape across the starboard lap
      for (const [ty, sk] of [[Y - 12, -0.3], [Y + 13.5, 0.2]]) tapeAt(xl0 + 1.15 + (ty / T) * 1.3, ty, sk);                    // and the port lap
      rule(xr0 - 1.5, Y - 30, xr1 - 1.2, Y + 34); rule(X + 12.2, Y - 14.6, X + 14.4, Y - 12.9); rule(X + 14.1, Y - 14.9, X + 12.5, Y - 12.6);   // the pencil line the starboard sheet was hung to, and a pencilled cross where a corner was to come
      rule(xl0 + 3.4, ys0 + 2.78, xr0 - 9, ys1 + 2.62);                                                                     // one ruled pencil line the paper was squared up on, low and off to starboard: nothing is centred on the hole
      scene.add(new THREE.Mesh(B.build(), style.paintMaterial({ side: THREE.DoubleSide })));
      const pc = new THREE.Mesh(R.build(), lineMat); pc.renderOrder = 4; scene.add(pc);
      // THE HOLE'S LIGHT takes the counted steps like everything else in the box: a film of the water's own colour lies over the opening, a step deeper for every
      // sheet that hangs between the eye and it (the same count and the same steps as paint: sbrSheets, sbrWater), and nothing at all once no sheet is between.
      const veil = new THREE.Mesh(new THREE.CircleGeometry(7.7, 40), new THREE.ShaderMaterial({
        uniforms: Object.assign({}, SU), transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
        vertexShader: `varying vec3 vWp; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: `varying vec3 vWp;\n${PART.STYLE_GLSL}\nvoid main(){ float n = sbrSheets(cameraPosition, vWp), k = min(0.25 * n, 0.76 + 0.03 * n);
          gl_FragColor = vec4(mix(uBlue, uDeep * 0.5, 0.72 * smoothstep(1.0, 4.6, n)) * k, k); }`,
      }));
      veil.position.set(EXIT[0], EXIT[1], BOX.z1 - 0.3); veil.renderOrder = 2.5; veil.frustumCulled = false; scene.add(veil);
    }
    await ctx.yield();
    // ---------------------------------------------------------------- sea fans (flat red card punched full of round holes) and brain coral (corrugated card rolled into spirals, stood on edge so the flutes show)
    {
      const cutMat = style.paintMaterial({ side: THREE.DoubleSide, vertWater: true, cut: true });
      const fanPots = cold ? [pal.red, pal.yellow, pal.hot] : [pal.red, pal.red, pal.orange], rollPots = cold ? [pal.white, pal.pink, pal.yellow] : [pal.pink, pal.orange, pal.yellow];
      const m4 = new THREE.Matrix4(), vx = new THREE.Vector3(), vy = new THREE.Vector3(), vz = new THREE.Vector3(), v3 = new THREE.Vector3();
      // append paint buffers S to B through the matrix M (positions and normals)
      const stamp = (B, S, M) => {
        const base = B.pos.length / 3;
        for (let i = 0; i < S.pos.length; i += 3) {
          v3.set(S.pos[i], S.pos[i + 1], S.pos[i + 2]).applyMatrix4(M); B.pos.push(v3.x, v3.y, v3.z);
          v3.set(S.nrm[i], S.nrm[i + 1], S.nrm[i + 2]).transformDirection(M); B.nrm.push(v3.x, v3.y, v3.z);
        }
        for (const c of S.col) B.col.push(c); for (const c of S.pnt) B.pnt.push(c); for (const k of S.idx) B.idx.push(base + k);
      };
      // a flat standing upright: the outline's x runs along yaw, its second coordinate is height
      const upright = (yaw) => m4.makeBasis(vx.set(Math.cos(yaw), 0, Math.sin(yaw)), vy.set(Math.sin(yaw), 0, -Math.cos(yaw)), vz.set(0, 1, 0));
      const FAN = [[-0.5, 0], [0.5, 0], [0.7, 1.6], [2.6, 2.4], [3.6, 4.2], [3.3, 6.3], [2.0, 7.6], [0.9, 7.1], [0, 8.2], [-1.1, 7.3], [-2.2, 7.8], [-3.4, 6.2], [-3.7, 4.0], [-2.5, 2.3], [-0.7, 1.6]];
      const fanBuf = (sc, pot, rng) => {
        const S = paintBuffers(), o = FAN.map((p) => [p[0] * sc * (1 + (rng() - 0.5) * 0.16), (p[1] - 8.2) * sc * (1 + (rng() - 0.5) * 0.08)]);     // hangs from its top point
        cardGeometry(o, { buf: S, thick: 0.3, y: 0, top: pot, bottom: pot, topKind: 7, bottomKind: 7, rim: 0.9, brush: 1.2 + rng() * 0.6, ox: rng() * 40, oz: rng() * 40 });
        return S;
      };
      // a roll: a strip of card 0.3 m thick wound 4.5 turns, its two spiral edges showing the flutes, the outside painted
      const rollBuf = (sc, pot, W) => {
        const S = paintBuffers(), N = 96, TURNS = 4.5; let arc = 0, pr = null;
        for (let i = 0; i <= N; i++) {
          const t = i / N, a = t * TURNS * 6.2832, r = (0.45 + 2.9 * t) * sc * (1 + 0.03 * Math.sin(a * 3.1)), ro = r + 0.3 * sc, c = Math.cos(a), s = Math.sin(a);
          if (pr !== null) arc += (r + pr) * 0.5 * (TURNS * 6.2832 / N); pr = r;
          for (const e of [-1, 1]) {
            S.v(c * ro, s * ro, e * W / 2, c, s, 0, pot, arc, e * W / 2 + 7, 9, 0);                                                                 // outer wall (painted)
            S.v(c * r, s * r, e * W / 2, 0, 0, e, pal.card, arc, 0, 0, 1); S.v(c * ro, s * ro, e * W / 2, 0, 0, e, pal.card, arc, 1, 0, 1);           // the spiral edge: liners and flutes
          }
        }
        for (let i = 0; i < N; i++) { const k = i * 6, n = k + 6; S.quad(k, n, n + 3, k + 3); S.quad(k + 1, k + 2, n + 2, n + 1); S.quad(k + 4, n + 4, n + 5, k + 5); }
        return S;
      };
      const B = paintBuffers(), TR = ribbonBuffers(), swingers = [], X = TURN_R;
      const stand = (x, y, z) => {                                       // a tall card tube from the floor, taped in sections
        addCylinder(B, [x, 0, z], [x, y, z], 0.72, 8, tubeCol, 2, false);
        for (let ty = 13; ty < y - 3; ty += 13.5) addCylinder(B, [x, ty, z], [x, ty + 1.2, z], 0.78, 8, pal.tape, 4, false);
      };
      // [kind 0 fan | 1 roll, x, y (top of a fan, centre of a roll), z, yaw (null: turned to the course where it passes nearest), scale, how it is held (0 hung on a
      // thread, swinging; 1 on a stand), pot, metres more than the rule's 2.5 that it keeps from the ride's way]. On the near side of each sheet of the link stands
      // one large bright thing, 7 m and more from our way: the eel before the first, a big fan before the second, a big roll before the third, a big fan before the last.
      // Each typed spot is a place of the box where its kind belongs. Along the run in each bay between two partings has its own kind: before the first parting a fan
      // to port and one under the string; between the first and second two big punched fans; between the second and third two brain-coral rolls on their stands (the
      // third bay is the bubble wrap's, the fourth the hole's own: a small fan high, a small roll low). The place itself is dealt from the fans' own stream by the rule
      // of the bays: round the spot where the spot as typed is free by the two rules of the place (the ride's way, the sights), anywhere in the spot's bay where it
      // is not (as typed, four of them stand in a sight or in the ride's way: those four stand wherever their bay takes them, turned to the course). The family's
      // band of heights is that of its own table, from its lowest typed middle to its highest. A thing on a stand is tested with its stand, floor to lid.
      // A third rule of the place for this family: no fan or roll stands or hangs in the plan of one of the link's long cup shelves (a stand or a thread would pass
      // through the card). The shelves hang clear of every typed spot, so the rule only tells where a place has to be dealt again or is dealt by the bay.
      const offShelf = (px, pz, r) => linkShelves.every(([sx, sz, hl, hw]) => Math.abs(px - sx) > hl + r || Math.abs(pz - sz) > hw + r);
      const rfa = stream('sbr-fans');
      const SPOTS = [[0, X + 12, 81, 160, null, 1.0, 0, 0], [0, X - 1.5, 65, 184, 0.06, 1.2, 1, 0],
        [0, X + 12.5, 84, 192, null, 1.5, 0, 1], [0, X - 13.5, 81, 195, null, 1.3, 0, 2], [1, X + 12.5, 73, 206, null, 1.45, 1, 0], [1, X - 13, 75, 207.5, null, 1.25, 1, 1],
        [0, X - 12.5, 84.5, 229.6, 0.35, 0.7, 0, 1], [1, X + 12.5, 67, 229.9, 2.75, 0.75, 1, 0], [0, X + 16, 89, 231.2, 2.85, 0.75, 0, 2],
        ...SPOTS_LINK];
      const LIST = [], midOf = (S) => (S[0] ? S[2] : S[2] - 4 * S[5]), FAN_BAND = [Math.min(...SPOTS.map(midOf)), Math.max(...SPOTS.map(midOf))];
      for (const S of SPOTS) {
        const [kind, x, y, z, yaw, sc, held, pot, off] = S, r = (kind ? 3.8 : 4.4) * sc, R = r + (off || 0), hung = kind === 0 && held === 0, typed = freeAt(x, midOf(S), z, R, hung);
        const inPlace = (px, py, pz) => offShelf(px, pz, r);
        const p = typed ? dealNear(rfa, x, midOf(S), z, R, hung, 2.5, 2, 2.5, inPlace) : dealBay(rfa, z, FAN_BAND, r, r, (px, py, pz) => freeAt(px, py, pz, R, hung) && (hung || freeAt(px, 0, pz, 0.9, true)) && offShelf(px, pz, r));
        if (p) LIST.push([kind, p[0], kind ? p[1] : p[1] + 4 * sc, p[2], typed ? yaw : null, sc, held, pot]);
      }
      for (const r of ranks) {
        if (r.kind === 'fan' || r.kind === 'hungFan') LIST.push([0, r.x, r.y, r.z, r.yaw, r.sc, r.kind === 'fan' ? 2 : 0, r.pot]);   // (2: a rank's fan, held still on a thread)
        else if (r.kind === 'roll') LIST.push([1, r.x, r.y, r.z, r.yaw, r.sc, 1, r.pot]);
      }
      for (const L of LIST) if (L[4] === null) { const nu = path.nearestXZ(L[1], L[3]).u; path.pointAt(nu, v3); L[4] = (L[1] > v3.x ? 2.6 : 0.5) + rfa.range(-0.2, 0.2); }
      const place1 = ([kind, x, y, z, yaw, sc, held, pot]) => {
        if (kind === 0) {
          const S = fanBuf(sc, fanPots[pot % 3], rfa), top = y;
          if (held) { stamp(B, S, upright(yaw).setPosition(x, top, z)); if (held === 2) cotton(TR, [x, top, z], [x + 0.4, 186, z], 0.05, pal.thread); else stand(x, top - 8.2 * sc + 0.4, z); return; }
          const g = new THREE.Group(); g.position.set(x, top + 0.6, z); g.rotation.y = -yaw;                                                           // hung on two threads from one knot: it swings as one flat
          const mesh = new THREE.Mesh(finePaint((() => { const G = paintBuffers(); stamp(G, S, upright(0).setPosition(0, -0.6, 0)); return G.build(); })(), 1), cutMat);
          g.add(mesh); scene.add(g); swingers.push({ g, ph: rfa() * 6.28, yaw: -yaw, amp: rfa.range(0.05, 0.09) });
          cotton(TR, [x, top + 0.6, z], [x + rfa.range(-0.6, 0.6), 186, z], 0.05, pal.thread);
        } else {
          const W = 2.6 * sc; stamp(B, rollBuf(sc, rollPots[pot % 3], W), m4.makeRotationY(-yaw).setPosition(x, y, z));
          stand(x, y - 3.3 * sc, z);
          const c = Math.cos(yaw), s = Math.sin(yaw);
          cardGeometry([[-3.5, -1.5], [3.5, -1.5], [3.5, 1.5], [-3.5, 1.5]].map(([u, v]) => [x + (u * c - v * s) * sc, z + (u * s + v * c) * sc]), { buf: B, thick: 0.3, y: y - 3.45 * sc, top: pal.card, topKind: 2, rim: 0.4 });   // the tray it stands on
        }
      };
      for (let li = 0; li < LIST.length; li++) { place1(LIST[li]); await ctx.yield(); }
      await ctx.yield();
      scene.add(new THREE.Mesh(B.build(), cutMat));
      const th = new THREE.Mesh(TR.build(), threadMat); th.frustumCulled = false; th.renderOrder = 3; scene.add(th);
      updaters.push((dt, time) => { for (const w of swingers) { w.g.rotation.z = w.amp * Math.sin(time * 0.9 + w.ph); w.g.rotation.y = w.yaw + 0.22 * Math.sin(time * 0.37 + w.ph * 1.7); } });
    }
    await ctx.yield();
    // ---------------------------------------------------------------- bubbles: strips of bubble wrap drawn slowly up to the lid
    {
      const bubMat = new THREE.ShaderMaterial({
        uniforms: SU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aRise;    // x, z, phase, speed
          varying vec2 vUv; varying float vSheets;
          ${PART.STYLE_GLSL}
          void main(){
            float y = mod(aRise.z + uTime * aRise.w * (1. + 0.25 * sin(uTime * 3.927 + aRise.z)), 176.);
            float sw = sin(uTime * 0.8 + aRise.z) * 0.5, tw = aRise.z * 3.7 + 0.3 * sin(uTime * 0.5 + aRise.z);
            vec3 p = vec3(aRise.x + (position.x * cos(tw)) + sw, y + position.y, aRise.y + position.x * sin(tw));
            vUv = position.xy; vSheets = sbrSheets(cameraPosition, p);
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying float vSheets; uniform vec3 uGloss;
          ${PART.STYLE_GLSL}
          void main(){
            vec2 g = vUv / 0.8; float fw = max(max(fwidth(g.x), fwidth(g.y)), 1e-4);
            vec2 c = fract(g + vec2(0.5 * step(1., mod(floor(g.y), 2.)), 0.)) - 0.5;
            // each blister: a clear dome with a bright ring where the film turns, a crescent of the lid on its upper left and a small glint; the flat film between is milky
            float d = length(c), dome = 1. - smoothstep(0.4 - fw, 0.4, d), rimL = 1. - smoothstep(0.045, 0.045 + fw, abs(d - 0.37));
            float cres = (1. - smoothstep(0.05, 0.05 + fw, abs(length(c - vec2(0.06, -0.06)) - 0.27))) * step(0., dot(c, vec2(-0.7, 0.7)) - 0.08), spark = 1. - smoothstep(0.07, 0.07 + fw, length(c - vec2(-0.14, 0.16)));
            float fine = smoothstep(0.22, 0.5, fw), edge = 1. - smoothstep(1.16 - max(fwidth(vUv.x), 1e-4), 1.16, abs(vUv.x));
            float a = mix(mix(0.5, 0.16, dome) + 0.5 * max(rimL, max(cres, spark)), 0.4, fine) * edge;
            float thr = 1. - smoothstep(0.03, 0.03 + max(fwidth(vUv.x), 1e-4), abs(vUv.x));          // the thread it is pulled by, sewn down the middle
            vec3 col = mix(uGloss * 0.9, min(uGloss * 1.1, vec3(1.)), max(max(spark, cres), thr));
            gl_FragColor = vec4(sbrWater(col, vSheets), max(a, thr * 0.9 * (1. - fine)));
          }`,
      });
      const nB = Math.round(70 * Math.min(density, 1.3)), g = new THREE.InstancedBufferGeometry(), ar = [];
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1.2, 0, 0, 1.2, 0, 0, 1.2, 13, 0, -1.2, 13, 0, -0.04, 13, 0, 0.04, 13, 0, 0.04, 190, 0, -0.04, 190, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const pv = new THREE.Vector3(), tv = new THREE.Vector3();
      const rng = stream('sbr-bubbles'), dLane = U_LANE * LEN;
      for (let i = 0; i < nB; i++) {                                // two fifths rise in the weed garden beside the lane (7 m and more off it), the rest along the box's edges: each place dealt again if it is refused
        const garden = i < nB * 0.4; let p = null;
        for (let k = 0; k < 24 && !p; k++) {
          let bx, bz;
          if (garden) { const sd = rng.chance(0.5) ? 1 : -1, off = Math.max(rng.range(4.5, 13), 7); path.posAtDist(rng.range(0, dLane), pv); const need = 6.5 + (pv.z + 16) * 0.47; bx = pv.x + sd * Math.max(off, need); bz = pv.z + rng.range(-0.6, 0.6); }
          else { bx = (rng.chance(0.5) ? 1 : -1) * rng.range(116, 142); bz = rng.range(BOX.z0 + 8, BOX.z1 - 6); }
          if (freeAt(bx, 0, bz, 1.8, true)) p = [bx, bz];
        }
        if (p) ar.push(p[0], p[1], rng() * 176, rng.range(1.1, 2.2));
        if (i % 4 === 3) await ctx.yield();
      }
      // and strips at places of their own: two by the hole, four at the mouth of the lane, three about the turn's end, and the third bay of the run in, which is the
      // bubble wrap's: six places of five lengths each, rising one after another, evenly spaced. Each typed spot is dealt by the rule of the bays: round the spot
      // where the spot as typed is free; where it is not (as typed, six of them stand in the hole's sight or in the ride's way) the strip rises wherever its own bay
      // takes it, anywhere across the box. A strip that is left out takes no phase and no speed.
      const BUB2 = [[TURN_R + 12.6, 227.5], [TURN_R - 14.2, 231], [8.8, -9], [-9.4, -5], [10.8, 1], [-12, 5], [TURN_R + 6.5, 150], [TURN_R + 9, 169], [TURN_R - 16, 176],
        [TURN_R + 9.5, 216], [TURN_R + 11.5, 219.5], [TURN_R + 10, 222.5], [TURN_R - 9.5, 215.5], [TURN_R - 11.5, 218.5], [TURN_R - 10, 222]];
      for (let i = 0; i < BUB2.length; i++) { const [tx, tz] = BUB2[i];
        const p = freeAt(tx, 0, tz, 1.8, true) ? dealNear(rng, tx, 0, tz, 1.8, true, 1.2, 0, 1.2) : dealBay(rng, tz, null, 1.8, 1.8, (px, py, pz) => freeAt(px, 0, pz, 1.8, true));
        if (p) { const ph = rng() * 176, sp = rng.range(1.1, 1.9); for (let q = 0; q < (i > 8 ? 5 : 1); q++) ar.push(p[0], p[2], ph + q * 35.2, sp); }
        if (i % 3 === 2) await ctx.yield(); }
      g.setAttribute('aRise', new THREE.InstancedBufferAttribute(new Float32Array(ar), 4)); g.instanceCount = Math.max(1, ar.length / 4);
      const bub = new THREE.Mesh(g, bubMat); bub.frustumCulled = false; bub.renderOrder = 6; scene.add(bub);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- card fish, hauled in pairs along slots in opposite directions, tails wagging on brass fasteners
    {
      const TAIL = /* glsl */`
        #ifdef USE_INSTANCING
        if (pos.x < -1.55) { float a = sin(uTime * 2.7 + instanceMatrix[3].y * 0.9) * 0.42, dx = pos.x + 1.55, c = cos(a), s = sin(a); pos = vec3(-1.55 + dx * c - pos.y * s, dx * s + pos.y * c, pos.z); }
        #endif`;
      const fishMat = style.paintMaterial({ side: THREE.DoubleSide, vertWater: true, hook: TAIL });
      const wh = new THREE.Color(1, 1, 1), dk = new THREE.Color(0.22, 0.2, 0.26), lt = new THREE.Color(1.5, 1.5, 1.4);
      const dot = (B, x, y, z, r, ny, col) => { const c = B.v(x, y, z, 0, ny, 0, col, x, z, 9, 4), i0 = B.pos.length / 3; for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.2832; B.v(x + Math.cos(a) * r, y, z + Math.sin(a) * r * (0.9 + 0.2 * rng()), 0, ny, 0, col, x, z, 9, 4); } for (let k = 0; k < 9; k++) { if (ny > 0) B.tri(c, i0 + (k + 1) % 9, i0 + k); else B.tri(c, i0 + k, i0 + (k + 1) % 9); } };
      const design = (spotted) => {
        const B = paintBuffers(), body = [[2.3, 0], [1.8, 0.55], [0.9, 0.95], [-0.2, 0.9], [-1.1, 0.5], [-1.75, 0.24], [-1.75, -0.24], [-1.1, -0.5], [-0.2, -0.9], [0.9, -0.95], [1.8, -0.55]];
        cardGeometry(body, { buf: B, thick: 0.3, y: 0, top: wh, rim: 0.3, brush: 0.05, ox: spotted ? 21 : 5 });
        cardGeometry([[-1.4, 0.2], [-2.9, 1.05], [-2.55, 0], [-2.9, -1.05], [-1.4, -0.2]], { buf: B, thick: 0.3, y: 0.31, top: wh, rim: 0.22, brush: 0.05, ox: 40 });
        addFastener(B, -1.55, 0.31, 0, 0.2, 1, pal.brass, 0.6);
        for (const ny of [1, -1]) {
          const y = ny * 0.17;
          if (spotted) for (const [x, z, r] of [[0.9, 0.3, 0.3], [0.2, -0.35, 0.26], [-0.5, 0.25, 0.22], [1.2, -0.4, 0.2], [-0.2, 0.5, 0.17]]) dot(B, x, y, z, r, ny, lt);
          else for (const [x, w, h] of [[1.05, 0.42, 0.62], [0.2, 0.3, 0.68], [-0.55, 0.5, 0.5]]) rect(B, [x, y, -h], [w, 0, 0.08], [0.05, 0, 2 * h], [0, ny, 0], dk, 0, 9);      // stripes of uneven width
          dot(B, 1.72, y * 1.06, 0.2, 0.13, ny, pal.black);
        }
        const g = finePaint(B.build(), 1.9); g.rotateX(-Math.PI / 2); return g;
      };
      // SLOTS. Every pair is hauled to and fro along a slot: [centre x, y, z], the slot's direction, half its travel, and a size (1: 4.6 to 6 m fish). Each is a place
      // of the box where a pair belongs: three beside the weed lane (above and below our height, never across the open wedge), one in the link, slots over the string
      // and beside it along the run in (one lengthwise at arm's length to port before the first parting: its pair passes us nose to tail), four small ones by the
      // hole. A slot is free where its whole travel is free by the two rules of the place and, if it runs across the box, lies 3.2 m and more from every cross
      // sheet. The slot's place is dealt from the fishes' own stream by the rule of the bays: round the typed spot where the spot as typed is free, anywhere in the
      // spot's bay where it is not (as typed, four of them are not), its whole travel inside the bay and the box. The family's band of heights is that of its own
      // table, from its lowest typed slot to its highest.
      const rng = stream('sbr-fish'), XD = [1, 0, 0], X = TURN_R;
      const SLOTS = [[[47, 49, 24], XD, 13, 1], [[-46, 62, 33], XD, 13, 1], [[47, 75, 42], XD, 13, 1], [[55, 67.5, 97], XD, 11, 1],
        [[57, 80.5, 150], XD, 12, 1], [[X, 82.5, 158], XD, 13, 1], [[58, 72, 165], XD, 12, 1], [[X + 21, 72, 168], XD, 9, 1], [[52, 64.5, 176], XD, 12, 1],
        [[X + 10.5, 75.5, 180], [0, 0, 1], 9, 1.15], [[X + 2, 85.5, 181], XD, 15, 1], [[X, 86.5, 196.5], XD, 19, 1], [[X - 2, 89, 206], XD, 14, 1], [[54, 64.5, 209.5], XD, 9, 1], [[X, 89, 216.5], XD, 14, 1],
        [[22.5, 67.5, 228.3], XD, 5.5, 0.62], [[61, 83, 230.6], XD, 7, 0.7], [[9, 62.5, 231.2], XD, 6.5, 0.75], [[52, 89, 232.4], XD, 5.5, 0.7]];
      const FISH_BAND = [Math.min(...SLOTS.map((s) => s[0][1])), Math.max(...SLOTS.map((s) => s[0][1]))];
      for (const r of ranks) if (r.kind === 'fish') SLOTS.push([[r.x, r.y, r.z], XD, r.sc, 1, true]);
      const slotFree = (c, u3, half) => { for (let q = -1; q <= 1.001; q += 0.25) if (!freeAt(c[0] + u3[0] * q * half, c[1] + u3[1] * q * half, c[2] + u3[2] * q * half, 2.6, true)) return false; return true; };
      const slotOk = (c, u3, half) => CROSS.every((s) => Math.abs(c[2] - s[0]) > 3.2 || u3[2] !== 0) && slotFree(c, u3, half);
      const nFree = Math.max(3, Math.round(9 * Math.min(density, 1.2))), nAll = SLOTS.length + nFree, fish = [];
      await ctx.yield();
      const meshes = [0, 1].map((k) => { const m = new THREE.InstancedMesh(design(k === 1 || spottedCast), fishMat, nAll); m.frustumCulled = false; scene.add(m); return m; });
      await ctx.yield();
      const fpots = cold ? [pal.white, pal.yellow, pal.hot, pal.rose, pal.pink] : [pal.yellow, pal.orange, pal.red, pal.pink, pal.white];
      const TR = ribbonBuffers(); let nP = 0;
      const pair = (c, u3, half, size, free) => {                   // two fish, one a little above the other, hauled in opposite directions
        const i = nP++, v = rng.range(4.5, free ? 8 : 7) * (rng.chance(0.5) ? 1 : -1), ph = rng() * 300, sc = (free ? rng.range(0.7, 1.3) : rng.range(1.0, 1.3)) * size;
        for (let k = 0; k < 2; k++) {
          const off = k * rng.range(2.4, 3.6), f = { c3: [c[0] - u3[2] * k * 1.4, c[1] + off, c[2] + u3[0] * k * 1.4], u3, free, v: k ? -v : v, ph: ph + k * 97, sc: sc * (k ? rng.range(0.75, 1.0) : 1), mesh: meshes[(i + k) % 2], idx: i, slot: half * 4, tilt: rng.chance(0.08) ? -0.2 : rng.range(-0.03, 0.03) };
          meshes[(i + k) % 2].setColorAt(i, rng.pick(fpots)); fish.push(f);
          TR.add([f.c3[0], f.c3[1] + 0.8, f.c3[2]], [f.c3[0], 184, f.c3[2]], 0.045, pal.thread);
        }
      };
      for (let e = 0; e < SLOTS.length; e++) { const [c, d, half, size, tested] = SLOTS[e];
        const dl = Math.hypot(d[0], d[1], d[2]), u3 = [d[0] / dl, d[1] / dl, d[2] / dl]; let p = tested ? c : null;
        if (!p && slotOk(c, u3, half)) { for (let k = 0; k < 24 && !p; k++) { const g = 1 + k * 0.25, q = [c[0] + rng.range(-2, 2) * g, c[1] + rng.range(-1.5, 1.5) * g, Math.min(BOX.z1 - 2.6, c[2] + rng.range(-1.5, 1.5) * g)]; if (slotOk(q, u3, half)) p = q; } }
        else if (!p) p = dealBay(rng, c[2], FISH_BAND, Math.abs(u3[0]) * half + 2.6, Math.abs(u3[2]) * half + 3.2, (px, py, pz) => slotFree([px, py, pz], u3, half));
        if (p) pair(p, u3, half, size, false);
        await ctx.yield();
      }
      // and the pairs hauled right across the box: each runs over the course (y 86 to 118: no thread of a hauled fish ever crosses the ride's way), never through a sheet
      for (let i = 0; i < nFree; i++) for (let k = 0; k < 24; k++) {
        const z = rng.range(-10, 228), y = rng.range(86, 118); let ok = CROSS.every((s) => Math.abs(z - s[0]) > 3.2 && !(z > s[0] + 2.4 && z < s[0] + 9));   // (the ranks' stands are in the strips behind the sheets)
        for (let x = -144; x <= 144 && ok; x += 8) ok = freeAt(x, y, z, 2.6, true);
        if (ok) { pair([0, y, z], XD, 0, 1, true); break; }
        await ctx.yield();
      }
      await ctx.yield();
      const tg = TR.build(), tp = tg.getAttribute('position'), to = tg.getAttribute('aOther'); tp.setUsage(THREE.DynamicDrawUsage); to.setUsage(THREE.DynamicDrawUsage);
      const fth = new THREE.Mesh(tg, threadMat); fth.frustumCulled = false; fth.renderOrder = 3; scene.add(fth);
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), SPAN = 290;
      const place = (dt, time) => {
        fish.forEach((f, i) => {
          const tt = time + f.ph, s = f.v * (tt + 0.2 * Math.sin((tt * Math.PI * 2) / 1.6));
          let x = ((((s % SPAN) + SPAN) % SPAN) - SPAN / 2), dir = f.v > 0 ? 1 : -1, turn = 0;
          if (f.slot) {                                                 // to and fro: out along the slot, turned round on its thread, and back
            const c = Math.abs(s) / f.slot, t = c - Math.floor(c), back = t >= 0.5, q = back ? t - 0.5 : t;
            x = f.slot * (back ? 0.75 - t : t - 0.25) * (f.v > 0 ? 1 : -1); dir = (back ? -1 : 1) * (f.v > 0 ? 1 : -1);
            turn = (1 - ss(0, 0.05, q)) * Math.PI;
          }
          {                                                             // along its slot, nose first, its thread rising from wherever it is
            const u3 = f.u3, px = f.c3[0] + u3[0] * x, py = f.c3[1] + u3[1] * x, pz = f.c3[2] + u3[2] * x;
            e.set(0, Math.atan2(-u3[2], u3[0]) + (dir > 0 ? 0 : Math.PI) + turn, dir * (Math.asin(u3[1]) + f.tilt + 0.04 * Math.sin(tt * 1.3)));
            m4.compose(v3.set(px, py, pz), q4.setFromEuler(e), s3.setScalar(f.sc)); f.mesh.setMatrixAt(f.idx, m4);
            for (let k = 0; k < 4; k++) { const top = k < 2 ? py + 0.8 : 184, oth = k < 2 ? 184 : py + 0.8; tp.setXYZ(i * 4 + k, px, top, pz); to.setXYZ(i * 4 + k, px, oth, pz); }
          }
        });
        meshes[0].instanceMatrix.needsUpdate = true; meshes[1].instanceMatrix.needsUpdate = true; tp.needsUpdate = true; to.needsUpdate = true;
      };
      place(0, 0); updaters.push(place);
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the tube eel: nine card tubes threaded on one string, drawn out of its egg cup at arm's length and back
    {
      const EZ = EEL.z, EY = EEL.y, ESC = 1.25, EX = EEL.x, uEelAmp = { value: 0 };
      const eelMat = style.paintMaterial({ side: THREE.DoubleSide, vertWater: true, uniforms: { uEelAmp }, hookDecl: 'uniform float uEelAmp;', hook: /* glsl */`
        { float wx = modelMatrix[3].x + pos.x * 1.25, amp = clamp((24. - wx) / 6., 0., 1.), k = floor(pos.x / 3.9 + 0.06);
          pos.x += sin(uTime * 1.3 - k * 1.7) * 0.2 * amp * uEelAmp * step(0.5, k);                                                   // each tube slides a little on the string as it is drawn out
          if (pos.y < -1.08 && pos.x < 3.3) pos.y -= (3.2 - pos.x) * (0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * 4.4))) * 0.34 * uEelAmp;        // the jaw: a flap on a hinge
          pos.z += sin(uTime * 1.5 - k * 0.8) * 0.5 * amp * uEelAmp; pos.y += cos(uTime * 1.1 - k * 0.9) * 0.22 * amp * uEelAmp; }` });
      const B = paintBuffers(), eg = cold ? pal.darkGreen : pal.green, PITCH = 3.9, TL = 2.9, NT = 8;
      const er = stream('sbr-eel'), ev = new THREE.Vector3(), en = new THREE.Vector3(), eq = new THREE.Quaternion(), ee = new THREE.Euler();
      const rimCol = pal.card, holeCol = pal.card.clone().multiplyScalar(0.36), ends = [];
      // eight separate card tubes on one string: each brushed green along its length (the paint stopping short of both ends), each end a brown cut rim with its flutes
      // round a dark mouth, each a little out of line with the next, a hand's width of white string showing in every gap
      for (let k = 0; k < NT; k++) {
        const x0 = k * PITCH, r1 = k === NT - 1 ? 0.8 : 0.98, r0 = k === 0 ? 0.84 : r1, oy = k ? er.range(-0.2, 0.2) : 0, oz = k ? er.range(-0.26, 0.26) : 0;
        ee.set(0, k ? er.range(-0.09, 0.09) : 0, k ? er.range(-0.07, 0.07) : 0); eq.setFromEuler(ee);
        const tone = 0.9 + 0.2 * er(), col = eg.clone().multiplyScalar(tone), br = er() * 9, SEG = 14;
        // a point of this tube: t metres along it, angle a round it, radius r
        const P = (t, a, r) => { ev.set(t - TL / 2, Math.cos(a) * r, Math.sin(a) * r).applyQuaternion(eq); return [x0 + TL / 2 + ev.x, oy + ev.y, oz + ev.z]; };
        const N = (nx, a) => { en.set(nx, Math.cos(a), Math.sin(a)).applyQuaternion(eq); return [en.x, en.y, en.z]; };
        const NR = 4, base = B.pos.length / 3;
        for (let j = 0; j <= NR; j++) for (let i = 0; i <= SEG; i++) {          // the painted wall
          const t = (j / NR) * TL, a = (i / SEG) * 6.2832, r = r0 + (r1 - r0) * (j / NR), p = P(t, a, r), n = N(0, a);
          B.v(p[0], p[1], p[2], n[0], n[1], n[2], col, (t + br) * 2.4, a * r * 2.4, Math.min(t, TL - t) * 1.25, 0);
        }
        for (let j = 0; j < NR; j++) for (let i = 0; i < SEG; i++) { const a = base + j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1; B.tri(a, b, c); B.tri(b, d, c); }
        for (const e of [0, 1]) {                                                // the two cut ends
          const t = e ? TL : 0, r = e ? r1 : r0, sg = e ? 1 : -1, b0 = B.pos.length / 3, n = N(sg, 0); en.set(sg, 0, 0).applyQuaternion(eq);
          for (let i = 0; i <= SEG; i++) { const a = (i / SEG) * 6.2832, po = P(t, a, r), pi = P(t, a, r - 0.25);
            B.v(po[0], po[1], po[2], en.x, en.y, en.z, rimCol, a * r, 1, 0, 1); B.v(pi[0], pi[1], pi[2], en.x, en.y, en.z, rimCol, a * r, 0, 0, 1); }
          for (let i = 0; i < SEG; i++) { const a = b0 + i * 2; B.quad(a, a + 2, a + 3, a + 1); }
          const hc = k === 0 && e === 0 ? pal.red : holeCol, pc = P(t + sg * -0.03, 0, 0), c = B.v(pc[0], pc[1], pc[2], en.x, en.y, en.z, hc, 0, 0, 9, 4), i0 = B.pos.length / 3;   // (the head's mouth is painted red inside)
          for (let i = 0; i < SEG; i++) { const a = (i / SEG) * 6.2832, p = P(t + sg * -0.03, a, r - 0.24); B.v(p[0], p[1], p[2], en.x, en.y, en.z, hc, 0, 0, 9, 4); }
          for (let i = 0; i < SEG; i++) B.tri(c, i0 + i, i0 + (i + 1) % SEG);
          ends.push(P(t + sg * -0.2, 0, 0));
        }
        // a dab of paint on the wall: a round patch lying on the tube (t along, a0 round, radius s, squashed q)
        const dab = (t, a0, s, pot, lift, q = 1) => {
          const rr = r0 + (r1 - r0) * (t / TL) + lift, pc = P(t, a0, rr), nc = N(0, a0), c = B.v(pc[0], pc[1], pc[2], nc[0], nc[1], nc[2], pot, t, a0, 9, 4), i0 = B.pos.length / 3, M = 10;
          for (let i = 0; i < M; i++) { const w = (i / M) * 6.2832, wob = 1 + 0.12 * Math.sin(w * 3 + t * 5), a = a0 + (Math.sin(w) * s * q * wob) / rr, p = P(t + Math.cos(w) * s * wob, a, rr - 0.02), n = N(0, a);
            B.v(p[0], p[1], p[2], n[0], n[1], n[2], pot, t, a, 9, 4); }
          for (let i = 0; i < M; i++) B.tri(c, i0 + (i + 1) % M, i0 + i);
        };
        const nSpot = k === 0 ? 4 : 6;                              // round yellow spots of uneven size, dabbed on
        for (let j = 0; j < nSpot; j++) { const big = er() < 0.35, s = big ? er.range(0.42, 0.56) : er.range(0.2, 0.33), a = (j / nSpot) * 6.2832 + er.range(-0.35, 0.35) + k;
          dab(k === 0 ? er.range(1.75, 2.35) : er.range(0.75, TL - 0.75), a, s, pal.yellow, 0.07); }
        if (k === 0) for (const s of [-1, 1]) { dab(0.95, s * 1.02, 0.44, pal.white, 0.07, 0.9); dab(0.86, s * 1.04, 0.2, pal.black, 0.11); }   // a painted eye on each side of the head: a white dab, a black dot
      }
      // the string: out of the head's mouth, through every tube and on into the cup (each end rides with its own tube)
      for (let k = 0; k + 1 < NT; k++) addCylinder(B, ends[k * 2 + 1], ends[k * 2 + 2], 0.085, 5, pal.white, 4, false);
      addCylinder(B, [NT * PITCH - 1.2, 0, 0], [NT * PITCH + 1.5, 0, 0], 0.085, 5, pal.white, 4, false);
      cardGeometry([[3.2, -0.95], [0.3, -1.1], [-0.95, -0.5], [-0.95, 0.5], [0.3, 1.1], [3.2, 0.95]], { buf: B, thick: 0.2, y: -1.2, top: pal.red, bottom: eg, rim: 0.42 });
      const eel = new THREE.Mesh(B.build(), eelMat); eel.scale.setScalar(ESC); eel.position.set(EX, EY, EZ); eel.frustumCulled = false; scene.add(eel);
      // its housing: a long card tube on two legs with an egg cup for a mouth
      const Hh = paintBuffers();
      addCylinder(Hh, [EX + 0.5, EY, EZ], [EX + 41, EY, EZ], 1.85, 12, pal.card, 2, false);
      addCylinder(Hh, [EX + 1.4, EY, EZ], [EX - 1.9, EY, EZ], 1.9, 12, cold ? pal.hot : pots[0], 0, false, 3.9);                 // the egg cup it lives in: a carton cone, its mouth toward the lane
      for (const x of [EX + 5, EX + 36]) addCylinder(Hh, [x, 0, EZ + 0.4], [x, EY - 1.8, EZ], 1.1, 8, tubeCol, 2, false);
      scene.add(new THREE.Mesh(Hh.build(), paintSmall));
      updaters.push((dt, time, u) => {
        // "At 3 s the tube eel is drawn out of its egg cup ... and back": one draw out and back with no rest in it, furthest out at 3 s (eelOut), and the hand that
        // draws it pulls every 1.6 s, so it comes by surges and never stops (the string runs between half and one and a half times its even speed)
        const out = eelOut(secAt(u) + 0.5 * (HAUL / 6.2832) * Math.sin(6.2832 * (time / HAUL) + haulPh));
        eel.position.x = EX - 19 * out; uEelAmp.value = Math.min(1, out * 3);
      });
    }
    await ctx.yield();
    // ---------------------------------------------------------------- on the coral head: a card crab with pipe-cleaner legs, claws opening on fasteners; anemones of pipe cleaners nodding in the cups
    {
      // (the crab sits toward the port rim of the top step: the manta's shadow lies across the other side, its wing tip opening and closing over the crab)
      const rng = stream('sbr-crab'), ran = stream('sbr-anemones'), CY = CRAB.y, CRX = CRAB.x, crab = new THREE.Group(); crab.position.set(CRX, CY, CRAB.z); crab.rotation.y = Math.atan2(CRAB.x - HUB.x, CRAB.z - HUB.z) + rng.range(-0.5, 0.5) * 0.5; crab.scale.setScalar(CRAB.sc); scene.add(crab);
      const B = paintBuffers(), cr = pal.red;
      cardGeometry(blob(rng, 2.7, 1.9, 16, 0.04), { buf: B, thick: 0.3, y: 0, top: cr, bottom: pal.card, bottomKind: 2, rim: 0.3, brush: 0.1, ox: 61 });
      for (const s of [-1, 1]) {
        for (let k = 0; k < 4; k++) {                               // legs: two bends of pipe cleaner each
          const a = (0.5 + k * 0.42) * s, x0 = Math.sin(a) * 2.2, z0 = -Math.cos(a) * 1.5 + 0.4, x1 = Math.sin(a) * 4.3, z1 = -Math.cos(a) * 3.3 + 0.4;
          addCylinder(B, [x0, -0.1, z0], [x1, 1.3, z1], 0.16, 5, k % 2 ? pal.white : cr, 4, false); addCylinder(B, [x1, 1.3, z1], [x1 * 1.25, -1.9, z1 * 1.25], 0.16, 5, k % 2 ? pal.white : cr, 4, false);
        }
        addCylinder(B, [s * 0.7, 0.1, 1.5], [s * 0.8, 1.3, 1.9], 0.12, 5, cr, 4, false);                            // eye stalks
        addCylinder(B, [s * 0.8, 1.3, 1.9], [s * 0.82, 1.75, 2.0], 0.3, 6, pal.black, 4, true);
        addFastener(B, s * 2.2, 0.16, 1.2, 0.26, 1, pal.brass, s);
      }
      crab.add(new THREE.Mesh(finePaint(B.build(), 1.8), paintSmall));
      const claws = [];
      for (const s of [-1, 1]) {
        const arm = new THREE.Group(); arm.position.set(s * 2.2, 0.32, 1.2); crab.add(arm);
        const A = paintBuffers();
        cardGeometry([[-0.4, -0.3], [0.4, -0.3], [0.5, 2.3], [1.1, 3.9], [0.2, 3.3], [-0.5, 2.4]].map((p) => [p[0] * s, p[1]]), { buf: A, thick: 0.3, y: 0, top: cr, bottom: pal.card, rim: 0.24, brush: 1.5, ox: 70 });
        addFastener(A, 0, 0.47, 2.4, 0.22, 1, pal.brass, 1);
        arm.add(new THREE.Mesh(finePaint(A.build(), 1.8), paintSmall));
        const pin = new THREE.Group(); pin.position.set(0, 0.31, 2.4); arm.add(pin);
        pin.add(new THREE.Mesh(finePaint(cardGeometry([[-0.3, -0.2], [0.3, -0.25], [-0.5, 1.7], [-0.75, 0.6]].map((p) => [p[0] * s, p[1]]), { thick: 0.3, y: 0, top: cr, bottom: pal.card, rim: 0.2, brush: 1.5, ox: 77 }), 1.8), paintSmall));
        claws.push({ arm, pin, s });
      }
      updaters.push((dt, time) => {
        for (const c of claws) { const o = 0.5 + 0.5 * Math.sin(time * 1.7 + c.s); c.pin.rotation.y = c.s * (0.1 + 0.75 * o * o); c.arm.rotation.y = c.s * (0.35 + 0.2 * Math.sin(time * 0.6 + c.s * 2)); }
        crab.position.y = CY + 0.12 * Math.sin(time * 2.1);
      });
      style.setShadow(6, CRX, CRAB.z, 3.2 * CRAB.sc, 2.4 * CRAB.sc, 0, CY, 0.8); SU.uSpot.value.set(CRX, CRAB.z, 4.0);
      // anemones
      const hook = /* glsl */`
        #ifdef USE_INSTANCING
        { float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3, b = pos.y * pos.y * 0.055;
          float hs = fract(ph * 0.618), th = (hs < 0.5 ? 0. : (hs < 0.8 ? 1.25 : 2.7)) * clamp((pos.y - 2.4) / 1.0, 0., 1.);     // about half of them have the tip bent over at an elbow or curled right round
          if (th > 0.001) { float R = 1.0 / (hs < 0.8 ? 1.25 : 2.7), c = cos(th), sn = sin(th), ex = pos.y - min(pos.y, 3.4);
            pos = vec3(R * (1. - c) + pos.x * c + ex * sn, 2.4 + R * sn - pos.x * sn + ex * c, pos.z); nrm = vec3(nrm.x * c + nrm.y * sn, -nrm.x * sn + nrm.y * c, nrm.z); }
          pos.x += (sin(uTime * 1.3 + ph) + 0.5 * sin(uTime * 0.37 + ph * 0.3)) * b; pos.z += cos(uTime * 1.1 + ph * 1.7) * b; }
        #endif`;
      const anMat = style.paintMaterial({ vertWater: true, hook, side: THREE.DoubleSide }), S = paintBuffers(), wh = new THREE.Color(1, 1, 1);
      // a pipe cleaner: a stem of chenille (paint kind 8: bristled edge, wire core), bu = metres along it. The far ones on the coral head are four-sided with five rings,
      // the ones in the hung cups at arm's length six-sided with nine (closer at the top, where the tip bends over)
      const stem = (B, ys, sides, r0) => {
        const n = ys.length;
        for (let j = 0; j < n; j++) for (let k = 0; k < sides; k++) { const a = (k / sides) * 6.2832, r = r0 * (j === n - 1 ? 0.55 : 1); B.v(Math.cos(a) * r, ys[j], Math.sin(a) * r, Math.cos(a), j === n - 1 ? 0.7 : 0, Math.sin(a), wh, ys[j], k, 1, 8); }
        for (let j = 0; j < n - 1; j++) for (let k = 0; k < sides; k++) { const a = j * sides + k, b = j * sides + (k + 1) % sides; B.tri(a, a + sides, b); B.tri(b, a + sides, b + sides); }
        const tip = B.v(0, ys[n - 1] + r0 * 0.5, 0, 0, 1, 0, wh, ys[n - 1] + r0 * 0.5, 0, 1, 8); for (let k = 0; k < sides; k++) B.tri((n - 1) * sides + k, tip, (n - 1) * sides + (k + 1) % sides);
        return B;
      };
      stem(S, [0, 0.8, 1.6, 2.4, 3.1], 4, 0.17);
      await ctx.yield();
      const hosts = cupList.filter((c, i) => c[1] > 7 && Math.hypot(c[0] - HUB.x, c[2] - HUB.z) < 36 && i % 3 === 0 && Math.hypot(c[0] - CRAB.x, c[2] - CRAB.z) >= 4.8 * CRAB.sc), PER   // (every third cup of the coral head holds anemones; none within the reach of the crab's legs)
      = Math.round(22 * Math.min(1, detail + 0.2));
      const an = new THREE.InstancedMesh(S.build(), anMat, Math.max(1, hosts.length * PER)), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
      const apots = [pal.pink, pal.white, pal.white, pal.yellow];   // pink and white: white in a pink cup, pink in a white one (the cold sea's lilac and white cups hold the warm pots: pink and orange)
      const apot = (c, h) => cold ? (c[4] === pal.white ? (h % 2 ? pal.rose : pal.hot) : h % 3 === 0 ? pal.hot : pal.white) : (c[4] === pal.white ? pal.pink : c[4] === pal.pink ? pal.white : apots[h % 3]);
      hosts.forEach((c, h) => { const pot = apot(c, h); for (let k = 0; k < PER; k++) {
        const a = ran() * 6.2832, r = Math.sqrt(ran()) * 0.92 * c[3];      // (rooted on the cup's floor, leaning out to its rim: none through the wall)
        e.set(Math.sin(a) * r * 0.36, ran() * 6, -Math.cos(a) * r * 0.36); m4.compose(v3.set(c[0] + Math.cos(a) * r, c[1] + 0.5, c[2] + Math.sin(a) * r), q4.setFromEuler(e), s3.set(1, ran.range(1.15, 1.6), 1));
        an.setMatrixAt(h * PER + k, m4); an.setColorAt(h * PER + k, pot); } });
      an.frustumCulled = false; scene.add(an);
      await ctx.yield();
      { const rs = stream('sbr-shelf-an'), P2 = Math.round(34 * Math.min(1, detail + 0.2)), a2 = new THREE.InstancedMesh(stem(paintBuffers(), [0, 0.7, 1.4, 2.0, 2.3, 2.6, 2.9, 3.15, 3.4], 6, 0.2).build(), anMat, Math.max(1, shelfCups.length * P2));
        shelfCups.forEach((c, h) => { const pot = apot(c, h + 1); for (let k = 0; k < P2; k++) {
          const a = rs() * 6.2832, r = Math.sqrt(rs()) * 0.92 * c[3];
          e.set(Math.sin(a) * r * 0.36, rs() * 6, -Math.cos(a) * r * 0.36); m4.compose(v3.set(c[0] + Math.cos(a) * r, c[1] + 0.5, c[2] + Math.sin(a) * r), q4.setFromEuler(e), s3.set(1, rs.range(1.25, 1.7), 1));
          a2.setMatrixAt(h * P2 + k, m4); a2.setColorAt(h * P2 + k, pot); } });
        a2.frustumCulled = false; scene.add(a2); }
      await ctx.yield();
      { const rs = stream('sbr-row-an'), hostsR = rowCups.filter((c) => c[5]), P3 = Math.round(20 * Math.min(1, detail + 0.2)), a3 = new THREE.InstancedMesh(an.geometry, anMat, Math.max(1, hostsR.length * P3));
        hostsR.forEach((c, h) => { const pot = apot(c, h); for (let k = 0; k < P3; k++) {
          const a = rs() * 6.2832, r = Math.sqrt(rs()) * 0.92 * c[3];
          e.set(Math.sin(a) * r * 0.36, rs() * 6, -Math.cos(a) * r * 0.36); m4.compose(v3.set(c[0] + Math.cos(a) * r, c[1] + 0.5, c[2] + Math.sin(a) * r), q4.setFromEuler(e), s3.set(c[3], rs.range(1.2, 1.65) * c[3], c[3]));
          a3.setMatrixAt(h * P3 + k, m4); a3.setColorAt(h * P3 + k, pot); } });
        a3.frustumCulled = false; scene.add(a3); }
    }
    await ctx.yield();
    // ---------------------------------------------------------------- a few soft beams of daylight from the gaps between the dowels, slanting with the hour.
    // Each is a round bar of lit air, drawn as one narrow ribbon turned about the bar's own axis (a round bar has no edge-on side), soft across, fading at both ends
    // and thin close to (there is little lit air between); a bar is drawn in the air only where it stands 15 m and more from our way all the way down.
    {
      // blended as light on what is behind it (dst * (1 + beam)): whatever it crosses keeps its own colour, a fifth brighter at the beam's core at most, so a beam can never lay a white veil
      const crk = new THREE.Color(...hour.crinkle), shaftTint = new THREE.Color(Math.min(1, crk.r * 1.08), Math.min(1, crk.g * 1.08), Math.min(1, crk.b * 1.08));
      // at the golden hour and at dawn a shaft is laid on as light in what it crosses (dst * (1 + beam)): the paper behind it comes back in its own hue, paler and leaning to the
      // colour of the hour (peach; at dawn pale rose, lemon-green in the green sea), never the grey that a pale screen over dark paper makes; and there are three at most
      const warmHour = hourName === 'golden' || hourName === 'dawn', hourTint = hourName === 'golden' ? new THREE.Color(1.0, 0.76, 0.46) : cold ? new THREE.Color(0.84, 1.0, 0.7) : new THREE.Color(1.0, 0.8, 0.9);
      if (warmHour) shaftTint.copy(hourTint);
      const poolTint = warmHour ? hourTint.clone() : cold ? new THREE.Color(crk.r * 0.42, crk.g * 0.62, crk.b * 0.5) : shaftTint.clone();   // (a pale shaft laid over bottle green would grey it: there it is a dimmer, greener light)
      const shaftMat = new THREE.ShaderMaterial({
        uniforms: Object.assign({}, SU, { uShaftTint: { value: cold && !warmHour ? poolTint : shaftTint }, uShaftAmt: { value: night ? 0.5 : warmHour ? 1.0 : 0.75 } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
        vertexShader: /* glsl */`
          attribute vec4 aBeam;    // t down the beam 0..1, side -1|+1, half width (m), phase
          varying vec2 vUv; varying float vSheets; varying vec3 vWp;
          ${PART.STYLE_GLSL}
          void main(){
            float drop = aBeam.x * uLidY;
            vec3 p = vec3(position.x + uSlant.x * drop, uLidY - drop, position.z + uSlant.y * drop);
            p.xz += vec2(sin(uTime * 0.21 + aBeam.w), cos(uTime * 0.17 + aBeam.w * 1.7)) * drop * 0.006;
            vec3 ax = vec3(uSlant.x, -1., uSlant.y); ax = ax * inversesqrt(dot(ax, ax));
            vec3 sd = cross(ax, p - cameraPosition); float sl = dot(sd, sd);
            sd = sl > 1e-6 ? sd * inversesqrt(sl) : vec3(1., 0., 0.);
            p += sd * aBeam.y * aBeam.z * (0.7 + 0.9 * aBeam.x);                       // a little wider toward the floor
            vUv = vec2(aBeam.y, aBeam.x); vWp = p; vSheets = sbrSheets(cameraPosition, p);
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying float vSheets; varying vec3 vWp; uniform vec3 uShaftTint; uniform float uShaftAmt;
          ${PART.STYLE_GLSL}
          void main(){
            float ax = abs(vUv.x);                                                     // a bar of light: brightest down its middle, soft to nothing at both sides (never a pane with two edges)
            float e = 1. - smoothstep(0.15, 1.0, ax); e *= e;
            float ends = smoothstep(0.0, 0.05, vUv.y);
            vec3 dv = vWp - cameraPosition; float near = smoothstep(18., 46., sqrt(dot(dv, dv)));
            float a = e * ends * near * uShaftAmt * exp2(-0.25 * vSheets);
            gl_FragColor = vec4(uShaftTint * a, 1.);
          }`,
      });
      // the bars of daylight in the air, each over its own pool (SHAFTS): one ribbon each, soft across
      const pos = [], ab = [], idx = [], NSEG = 10, sx = hour.slant[0], sz = hour.slant[1];
      SHAFTS.forEach((S, k) => {
        const x = S[0] - sx * (BOX.top - S[2]), z = S[1] - sz * (BOX.top - S[2]), b = pos.length / 3;
        // (a bar is drawn in the air only where it stands 15 m and more from our way and clear of the manta, all the way down: the others are pools only, as are those
        // that a low sun would start outside the lid. The coral head's bar is the one exception to the manta: it ends over the mobile.)
        let ok = Math.abs(x) < 146 && z > BOX.z0 + 4 && z < BOX.z1 - 4;
        if (k > 0) for (let j = 0; j <= 19 && ok; j++) { const d = j * 10, px = x + sx * d, py = BOX.top - d, pz = z + sz * d; if (py < S[2]) break;
          if (path.distanceTo(px, py, pz) < 15 || Math.hypot(px - HUB.x, (py - 82) * 0.7, pz - HUB.z) < 30) ok = false; }
        if (!ok) return;
        for (let j = 0; j <= NSEG; j++) for (const sd of [-1, 1]) { pos.push(x, BOX.top, z); ab.push((j / NSEG) * (S[5] < 1 ? S[5] : 1 - S[2] / BOX.top), sd, S[4], k * 2.1); }
        for (let j = 0; j < NSEG; j++) { const q = b + j * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBeam', new THREE.Float32BufferAttribute(ab, 4)); g.setIndex(idx);
      // laid on twice: as light in what the bar crosses (dst x (1 + beam): the paper and the paint behind it come back in their own colours, paler), and a small share
      // of the hour's own tint on top (peach at the golden hour, rose or lemon-green at dawn, pale blue-white at noon), so the light itself has the hour's colour
      const lift = new THREE.Mesh(g, shaftMat); lift.frustumCulled = false; lift.renderOrder = 7; scene.add(lift);
      const tintMat = shaftMat.clone(); tintMat.uniforms = Object.assign({}, SU, { uShaftTint: { value: cold && !warmHour ? poolTint : shaftTint }, uShaftAmt: { value: night ? 0.05 : warmHour ? 0.15 : 0.1 } }); tintMat.blendSrc = THREE.OneMinusDstColorFactor;
      const tint = new THREE.Mesh(g, tintMat); tint.frustumCulled = false; tint.renderOrder = 7; scene.add(tint);
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the second cast (seeded): pipe-cleaner seahorses turning on their threads, and an octopus with paper-chain arms
    if (spottedCast) {
      const SWING = /* glsl */`
        #ifdef USE_INSTANCING
        { float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;
          float yw = 0.9 * sin(uTime * 0.5 + ph), sw = 0.12 * sin(uTime * 0.9 + ph * 1.3);
          float c = cos(yw), s = sin(yw); pos = vec3(c * pos.x + s * pos.z, pos.y, -s * pos.x + c * pos.z); nrm = vec3(c * nrm.x + s * nrm.z, nrm.y, -s * nrm.x + c * nrm.z);
          c = cos(sw); s = sin(sw); pos = vec3(c * pos.x - s * pos.y, s * pos.x + c * pos.y, pos.z); }
        #endif`;
      const B = paintBuffers(), wh = new THREE.Color(1, 1, 1), TR = ribbonBuffers();
      const body = [[-1.3, -0.9], [-0.3, -0.6], [0.15, 0], [0.5, -0.7], [0.25, -1.4], [-0.45, -2.1], [-0.6, -2.9], [-0.2, -3.6], [0.3, -4.2], [0.45, -4.8], [0.1, -5.2], [-0.3, -5.0], [-0.3, -4.6], [0, -4.55]];
      const fin = [[0.3, -1.9], [1.0, -2.2], [0.55, -2.5], [1.05, -2.8], [0.5, -3.1], [0.9, -3.4], [0.1, -3.5]];
      for (const line of [body, fin]) for (let i = 0; i + 1 < line.length; i++) addCylinder(B, [line[i][0], line[i][1], 0], [line[i + 1][0], line[i + 1][1], 0], line === fin ? 0.09 : 0.15, 5, wh, 5, i === 0 || i + 2 === line.length);
      for (const s of [-1, 1]) addCylinder(B, [-0.25, -0.5, s * 0.1], [-0.25, -0.5, s * 0.2], 0.1, 5, new THREE.Color(0.02, 0.02, 0.03), 4, true);       // a bead for an eye
      const nS = Math.round(26 * Math.min(density, 1.2)), sea = new THREE.InstancedMesh(B.build(), style.paintMaterial({ side: THREE.DoubleSide, vertWater: true, hook: SWING }), nS);
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), spots = [pal.pink, pal.white, pal.yellow, cold ? pal.hot : pal.orange];
      const rng = stream('sbr-seahorses'); let nSea = 0;
      for (let tries = 0; nSea < nS && tries < 1200; tries++) {      // hung 8.5 to 18 m beside the course, anywhere along it: a place refused by the rules of the place is dealt again
        const d = rng.range(14, LEN - 14), sd = rng.chance(0.5) ? 1 : -1, off = rng.range(8.5, 18), dy = rng.range(-5, 8), sc = rng.range(1.0, 1.5), yaw = rng() * 6.28;
        path.posAtDist(d, pv); path.tangentAtDist(d, v3);
        const x = pv.x - v3.z * sd * off, z = pv.z + v3.x * sd * off, y = pv.y + dy;
        if (path.distanceTo(x, y - 2.5 * sc, z) < 8 || Math.hypot(x - HUB.x, z - HUB.z) < 31 || CROSS.some((c) => Math.abs(z - c[0]) < 2.6) || (Math.abs(x - 16) < 12 && Math.abs(z - 34) < 5) || !freeAt(x, y - 2.5 * sc, z, 3.2 * sc, true)) continue;
        m4.compose(v3.set(x, y, z), q4.setFromAxisAngle(up, yaw), s3.setScalar(sc)); sea.setMatrixAt(nSea, m4); sea.setColorAt(nSea, spots[nSea % 4]);
        cotton(TR, [x, y, z], [x + rng.range(-0.4, 0.4), 186, z], 0.045, pal.thread); nSea++;
      }
      sea.count = Math.max(1, nSea);
      sea.frustumCulled = false; scene.add(sea);
      // the octopus: an upturned carton cup for a head, two painted eyes, eight arms of paper chain swaying from its rim; it hangs to starboard of the weed lane
      const O = paintBuffers(), OX = -28, OY = 67, OZ = 31, potA = pots[0], potB = cold ? pal.yellow : pal.yellow;
      addCylinder(O, [0, 0, 0], [0, 3.2, 0], 2.3, 12, potA, 0, true, 1.3);
      for (const s of [-1, 1]) { rect(O, [s * 0.75 - 0.42, 1.15, 2.0], [0.84, 0, -0.1], [0, 0.9, -0.3], [0, 0.3, 1], pal.white, 4); rect(O, [s * 0.75 - 0.16, 1.3, 2.05], [0.32, 0, -0.03], [0, 0.4, -0.13], [0, 0.3, 1], pal.black, 4); }
      for (let k = 0; k < 8; k++) {
        const th = (k / 8) * 6.2832 + 0.2, ct = Math.cos(th), st = Math.sin(th);
        for (let j = 0; j < 9; j++) {                                  // one link: a loop of paper strip, each turned a quarter to the last
          const r = 1.9 + 0.75 * Math.pow(j, 0.85), cy = -0.5 - j * 1.02, cx = ct * r, cz = st * r, flat = j % 2 === 0, col = (j + k) % 2 ? potB : potA, base = O.pos.length / 3, SEG = 10;
          const ax = flat ? [ct, st] : [-st, ct], wx = flat ? [-st, ct] : [ct, st];                                // loop plane direction, strip width direction
          for (let i = 0; i <= SEG; i++) {
            const a = (i / SEG) * 6.2832, lx = Math.cos(a) * 0.42, ly = Math.sin(a) * 0.68;
            for (const e of [-1, 1]) O.v(cx + ax[0] * lx + wx[0] * e * 0.24, cy + ly, cz + ax[1] * lx + wx[1] * e * 0.24, ax[0] * Math.cos(a), Math.sin(a), ax[1] * Math.cos(a), col, a * 0.6 + j, e * 0.24 + k * 2.1, 9, 4);
          }
          for (let i = 0; i < SEG; i++) { const q = base + i * 2; O.quad(q, q + 2, q + 3, q + 1); }
        }
      }
      const octMat = style.paintMaterial({ side: THREE.DoubleSide, vertWater: true, hook: /* glsl */`
        { float d = max(-pos.y - 0.6, 0.), ph = pos.x * 1.3 + pos.z * 1.7;
          pos.xz += vec2(sin(uTime * 0.8 + ph - d * 0.35), cos(uTime * 0.66 + ph * 1.3 - d * 0.3)) * d * 0.1;
          pos.xz *= 1. + 0.05 * d * sin(uTime * 0.5); }` });
      const oct = new THREE.Mesh(O.build(), octMat); oct.position.set(OX, OY, OZ); oct.frustumCulled = false; scene.add(oct);
      TR.add([OX, OY + 3.2, OZ], [OX + 0.4, 186, OZ], 0.06, pal.white);
      const th = new THREE.Mesh(TR.build(), threadMat); th.frustumCulled = false; th.renderOrder = 3; scene.add(th);
      updaters.push((dt, time) => { oct.position.y = OY + 0.5 * Math.sin(time * (Math.PI * 2 / HAUL) * 0.5 + haulPh); oct.rotation.y = 0.5 * Math.sin(time * 0.31 + swingPh); });
    }
    await ctx.yield();
    // ---------------------------------------------------------------- motes: dust and flecks of dry paint turning in the daylight, sized from the drawing buffer
    {
      const moteMat = new THREE.ShaderMaterial({
        uniforms: SU, transparent: true, depthWrite: false, vertexColors: true,
        vertexShader: /* glsl */`
          attribute vec2 aMote;    // phase, size in metres
          uniform vec2 uRes;
          varying vec3 vCol; varying float vA;
          ${PART.STYLE_GLSL}
          void main(){
            float ph = aMote.x;
            vec3 p = position + vec3(sin(uTime * 0.21 + ph) * 1.6, sin(uTime * 0.13 + ph * 1.7) * 1.2, cos(uTime * 0.17 + ph * 2.3) * 1.6);
            vec4 mv = viewMatrix * vec4(p, 1.); float dist = max(-mv.z, 0.5);
            gl_Position = projectionMatrix * mv;
            float px = aMote.y * projectionMatrix[1][1] * uRes.y * 0.5 / dist;
            gl_PointSize = max(px, 1.5);
            float turn = 0.5 + 0.5 * sin(uTime * (0.7 + fract(ph * 0.37) * 0.8) + ph * 5.);        // a fleck turns and catches the lid, slowly
            vA = clamp(px / 1.5, 0.3, 1.) * (0.25 + 0.75 * turn * turn) * smoothstep(2., 6., dist) * (1. - smoothstep(45., 90., dist)) * (0.22 + 0.78 * sbrPool(p));   // dust shows where it turns in a shaft of daylight
            vCol = sbrWater(color, sbrSheets(cameraPosition, p));
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vCol; varying float vA;
          void main(){ gl_FragColor = vec4(vCol, vA); }`,
      });
      const n = Math.round(3000 * detail), pos = [], col = [], am = [], pv = new THREE.Vector3(), rng = stream('sbr-motes');
      const flecks = [pal.white, pal.white, pal.white, new THREE.Color(...hour.crinkle), pots[0], pots[1], pal.yellow, pal.card];
      // dust hangs in the air about the course, 6.5 to 28 m out from it. It drifts 1.6 m, so a fleck dealt nearer than 2.5 m and that drift to the ride's way (anywhere
      // on the course, not only where it was dealt from) or inside the hole's sight is refused and dealt again; after six refusals it is left out
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < 6; k++) {
          path.pointAt(rng(), pv); const a = rng() * 6.2832, r = 6.5 + Math.sqrt(rng()) * 22, x = pv.x + Math.cos(a) * r, y = pv.y + rng.range(-13, 16), z = pv.z + Math.sin(a) * r;
          if (trackGap(x, y, z, false) < CLEAR + 1.7 || holeGap(x, y, z, 1.7, false) < 0) continue;
          const c = flecks[Math.floor(rng() * flecks.length)]; pos.push(x, y, z); col.push(c.r, c.g, c.b); am.push(rng() * 100, rng.range(0.04, 0.1));
          break;
        }
        if (i % 40 === 39) await ctx.yield();
      }
      if (!pos.length) { pos.push(0, -50, 0); col.push(0, 0, 0); am.push(0, 0.04); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aMote', new THREE.Float32BufferAttribute(am, 2));
      const motes = new THREE.Points(g, moteMat); motes.frustumCulled = false; motes.renderOrder = 8; scene.add(motes);
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the gust's loose sardines: thirty foil flats that come off their threads and flutter down past us (rare seeds only; nothing shows while uFall is 0)
    const uFall = { value: 0 };
    {
      const o = [[0.81, 0.0], [0.56, 0.125], [0.2, 0.2], [0.02, 0.2], [-0.1, 0.3], [-0.24, 0.17], [-0.6, 0.05], [-0.82, 0.21], [-0.71, 0.0], [-0.82, -0.2], [-0.6, -0.05], [-0.3, -0.135], [0.15, -0.19], [0.56, -0.13]];
      const tris = THREE.ShapeUtils.triangulateShape(o.map((p) => new THREE.Vector2(p[0], p[1])), []), g = new THREE.InstancedBufferGeometry(), ps = [], ad = [];
      for (const p of o) ps.push(p[0], p[1], 0);
      g.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3)); g.setIndex(tris.flat());
      const N = 30, rng = stream('sbr-loose');
      for (let i = 0; i < N; i++) {
        // each comes down between us and the coral head, timed (in gust progress) to pass through our downward gaze as we come level with it
        const t = (i + rng()) / N, a = (0.94 + 0.56 * t) * Math.PI, r = rng.range(22, 31);
        ad.push(HUB.x + Math.cos(a) * r, HUB.z + Math.sin(a) * r, 0.02 + 0.795 * t, rng());
      }
      g.setAttribute('aDrop', new THREE.InstancedBufferAttribute(new Float32Array(ad), 4)); g.instanceCount = N;
      const fallMat = new THREE.ShaderMaterial({
        uniforms: Object.assign({}, SU, { uFall }), side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aDrop;    // x, z, start (gust progress), seed
          uniform float uFall;
          varying vec3 vWn; varying float vSheets, vSeed;
          ${PART.STYLE_GLSL}
          void main(){
            float f = clamp((uFall - aDrop.z) / 0.42, 0., 1.), ph = aDrop.w * 40.;
            float on = step(0.002, f) * (1. - step(0.998, f));
            vec3 c = vec3(aDrop.x + sin(uTime * 1.1 + ph) * 2.2 * f, 92. - 64. * f * (0.35 + 0.65 * f), aDrop.y + cos(uTime * 0.9 + ph * 1.3) * 2.2 * f);
            float roll = uTime * 2.1 + ph, yaw = uTime * 0.8 + ph * 2., pit = 0.5 * sin(uTime * 1.7 + ph);
            vec3 p = vec3(position.xy, 0.) * 1.15 * on, n = vec3(0., 0., 1.);
            float cs = cos(pit), sn = sin(pit); p = vec3(cs * p.x - sn * p.y, sn * p.x + cs * p.y, p.z);
            cs = cos(roll); sn = sin(roll); p = vec3(p.x, cs * p.y - sn * p.z, sn * p.y + cs * p.z); n = vec3(0., -sn, cs);
            cs = cos(yaw); sn = sin(yaw); p = vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z); n = vec3(sn * n.z, n.y, cs * n.z);
            vec3 wp = c + p; vWn = n; vSeed = aDrop.w; vSheets = sbrSheets(cameraPosition, wp);
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform float uFoilGain;
          varying vec3 vWn; varying float vSheets, vSeed;
          ${PART.STYLE_GLSL}
          void main(){
            float white = smoothstep(0.24, 0.62, abs(vWn.y));                                    // foil: white when it faces the lid, blue when it does not
            vec3 c = mix(mix(uDeep, uBlue, 0.62) * (0.86 + 0.28 * vSeed), vec3(1.0, 0.99, 0.965) * uFoilGain, white);
            gl_FragColor = vec4(sbrWater(c, vSheets), 1.);
          }`,
      });
      const loose = new THREE.Mesh(g, fallMat); loose.frustumCulled = false; scene.add(loose);
    }
    await ctx.yield();
    // ---------------------------------------------------------------- the journey, in the brief's seconds
    const pace = (u) => paceRaw(u);
    // The gaze is one point of interest for the whole flight after the garden. Each look is a direction; the directions are blended, never the points. There are
    // five looks and four swings between them, each swing an ease between two marks, and every mark is where our lens comes level with a named thing of the box or,
    // for the image, where we are at the brief's own second. On the link the measure is the eye's own z against a cross sheet's plane; on the turn it is the eye's
    // bearing round the hub against the bearing at which the thing hangs or stands (degrees from the turn's first point, the way we fly: 0 where the wire arm takes
    // our threads, 360 where it lets go).
    //   the link    along the course to where the turn begins; the coral head and the manta stand ahead to starboard of it and grow
    //   (up)        from the plane of the link's last sheet but one (z 88) to the plane of its last (z 114): past that one no film hangs between us and the manta
    //   the belly   "the wing panels beat overhead": up at the manta's middle, as the arm takes us and into the turn
    //   (back)      from level with the first tray hung inside the turn (24 degrees) to level with the second (64)
    //   back        "we look back up the box through three sheets": from the far side of the turn, under the belly and across the hub toward where the lane ended
    //   (down)      from level with the third hung tray (104 degrees) to level with the tip of the manta's starboard wing (180: it hangs with its wings across the box)
    //   down        "then down on the crab and the anemone cups": one aim, the manta's shadow opening and closing over the top step
    //   (image)     from where the turn carries us back through the plane of the link's last sheet (z 114: 226 degrees) to where we are at the brief's 29 s
    //   the image   "29-34 s ... the image": coming round to face the back wall, the direction midway between the manta and the hole, until the gaze lets go and
    //               the course itself faces the hole
    const TM = new THREE.Vector3(HUB.x, 86, HUB.z), gP = new THREE.Vector3(), TC = new THREE.Vector3(CRAB.x * 0.5 + HUB.x * 0.5, 39, CRAB.z * 0.5 + HUB.z * 0.5), gazeAt = new THREE.Vector3(), eelAt = new THREE.Vector3(), hubAt = new THREE.Vector3(TURN_R - 6, 66, HUB.z);   // (the link's aim: where the course itself goes, the point where the arm will take us, drawn a little toward the hub)
    const TK = path.pointAt(U(6), new THREE.Vector3()), gAcc = new THREE.Vector3(), gDv = new THREE.Vector3(), gD2 = new THREE.Vector3();
    { const dx = TK.x - HUB.x, dz = TK.z - HUB.z, l = Math.hypot(dx, dz) || 1; TK.set(HUB.x + (dx / l) * TURN_R * 0.6, TK.y + 4, HUB.z + (dz / l) * TURN_R * 0.6); }   // back up the box: from the hub toward where the lane ended and the link began (6 s), six tenths of the turn's radius out, four metres over the lane's own height
    const DEG = 180 / Math.PI, bearing = (x, z) => (Math.atan2(z - HUB.z, x - HUB.x) * DEG + 360) % 360, gL = new THREE.Vector3();
    const planeBack = (z) => 180 + Math.asin((HUB.z - z) / TURN_R) * DEG;     // the bearing at which the turn's circle comes back through a cross sheet's plane
    const P29 = path.pointAt(U(29), new THREE.Vector3());                    // where we are at the brief's 29 s
    const M_UP = [CROSS[2][0], CROSS[3][0]], M_BACK = [TRAY_DEG[0], TRAY_DEG[1]], M_DOWN = [TRAY_DEG[2], bearing(HUB.x - 20, HUB.z)], M_IMG = [planeBack(CROSS[3][0]), bearing(P29.x, P29.z)];
    const lookW = (u) => {
      const uc = Math.min(Math.max(u, 0), 1); path.pointAt(uc, gL);
      const b0 = bearing(gL.x, gL.z), firstHalf = uc < (U_T0 + U_T1) * 0.5;
      // where we are: before the turn the eye's z (it only grows along the link); on the turn the eye's bearing round the hub, 0 to 360; after the turn 360
      const b = uc <= U_T0 ? 0 : uc >= U_T1 ? 360 : firstHalf ? (b0 > 270 ? 0 : b0) : (b0 < 90 ? 360 : b0);
      const up = uc <= U_T0 ? ss(M_UP[0], M_UP[1], gL.z) : 1, bk = ss(M_BACK[0], M_BACK[1], b), dn = ss(M_DOWN[0], M_DOWN[1], b), im = ss(M_IMG[0], M_IMG[1], b);
      // link, belly, back, down, image: they sum to 1
      return [(1 - up), up * (1 - bk), bk * (1 - dn), dn * (1 - im), im];
    };
    const gaze = (time, uN) => {
      const w = lookW(uN);
      path.pointAt(Math.min(Math.max(uN, 0), 1), gP);
      gAcc.set(0, 0, 0);
      if (w[0] > 0) gAcc.addScaledVector(gDv.copy(hubAt).sub(gP).normalize(), w[0]);
      if (w[1] > 0) gAcc.addScaledVector(gDv.copy(TM).sub(gP).normalize(), w[1]);
      if (w[2] > 0) gAcc.addScaledVector(gDv.copy(TK).sub(gP).normalize(), w[2]);
      if (w[3] > 0) gAcc.addScaledVector(gDv.copy(TC).sub(gP).normalize(), w[3]);
      // the image: midway between the manta and the hole, wherever we are
      if (w[4] > 0) { gDv.copy(TM).sub(gP).normalize(); gAcc.addScaledVector(gDv.add(gD2.copy(HOLE).sub(gP).normalize()).normalize(), w[4]); }
      if (gAcc.lengthSq() < 1e-8) gAcc.set(0, 0, 1);
      return gazeAt.copy(gP).addScaledVector(gAcc.normalize(), 60);
    };
    // the look at the eel follows its head, and is on it only while the eel is more than half out of its cup (1 to 5 s): eased a second, held two, eased a second
    const eelLook = (time, uN) => eelAt.set(EEL.x - 19 * eelOut(secAt(uN)), EEL.y, EEL.z);
    const camP = new THREE.Vector3(), camD = new THREE.Vector3(), hS = new THREE.Vector3(), hB = new THREE.Vector3(), hT = new THREE.Vector3(), hP = new THREE.Vector3(), hQ = new THREE.Vector3(), hook = new THREE.Vector3(), tanV = new THREE.Vector3();
    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 62, near: 0.3, far: 900, lookAhead: 18, sway: 0.4, bank: 0.25 },
      // the eel as it is drawn out at 3 s (a small pull); then one gaze from the link (6 s) to the end of the image (34 s), eased in and out over about two seconds
      pois: [{ at: eelLook, from: U(1), to: U(5), weight: 0.55, fade: 0.25 }, { at: gaze, from: U(5.2), to: U(34.4), weight: 0.9, fade: 0.07 }],
      portal: { shape: 'circle', radius: 7, color: '#F6F3E8', veil: '#F6F3E8', frame: 0, glow: 0, revealDistance: 240, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, uN) {
        const u = uN, sec = secAt(uN);
        camera.getWorldPosition(camP); camera.getWorldDirection(camD);
        const gust = rare ? beat(24, 25.6, 30, 32.5, u) : 0;         // the rare event: "at 24 s a draught goes through the box"
        if (hero) {
          // the manta hangs on its four threads and swings a little on them by its own slow clock (a phase drawn from the seed), whoever is looking
          if (hero.setPose) hero.setPose(0.16 * Math.sin(time * 0.27 + swingPh) + 0.07 * Math.sin(time * 0.11 + swingPh * 2.3), 0.03 * Math.sin(time * 0.19 + swingPh), 0.03 * Math.cos(time * 0.23 + swingPh));
          if (hero.setGust) hero.setGust(gust); hero.update(dt, time, camera, u);
          // (the manta's shadow lies where the lid's light puts it, by the hour's slant; the flash band goes round on its own clock, its phase dealt from the seed)
        } else style.tick(time);
        uBelly.value = gust; uWeedGust.value = gust;
        uFall.value = rare ? Math.min(1.2, Math.max(0, (sec - 24) / 7.5) * 1.05) : 0;
        // THE TURTLE: carried with the camera, under the lens, for the whole flight. What moves it is the hand on the string (a surge of half a metre with each pull,
        // a pull every 1.6 s, easing back between pulls), the sway of a thing on threads (swung wider by each pull and coming to rest before the next), its own nod and
        // stroke (one stroke every 2.4 s), and the wire arm, on which it banks into the turn. Every phase is dealt from the seed. As the gaze tips down the ride sinks a
        // little under the lens, by the gaze's pitch alone.
        turtle.matrix.copy(camera.matrixWorld); turtle.matrixWorldNeedsUpdate = true;
        const hp = (time / HAUL + haulPh / 6.2832) % 1, pull = Math.sin(Math.min(hp / 0.3, 1) * Math.PI * 0.5) * (1 - ss(0.3, 1, hp)), rest = 0.45 + 0.55 * (1 - ss(0.1, 0.95, hp));
        const rise = ss(0.05, 0.7, sec);                             // the entry: seen through the previous portal the guide is not in the lane; it comes up under us in the first seven tenths of a second
        // it is hauled along the string, not along our gaze: where we look aside the shell keeps a little of its heading (a tenth of a radian at most), the head turned back
        path.tangentAt(Math.min(Math.max(uN, 0), 1), tanV);
        const tr = -tanV.x * camD.z + tanV.z * camD.x, tf = tanV.x * camD.x + tanV.z * camD.z, aside = Math.max(-1.3, Math.min(1.3, Math.atan2(tr, tf)));
        const yawT = Math.max(-0.1, Math.min(0.1, -aside * 0.1)), sink = 0.3 * ss(0.12, 0.7, -camD.y), taut = beat(33.9, 34.3, 34.6, 36.2, u);   // (taut: the one long pull as the string comes taut at 34 s)
        const onArm = beat(14.3, 16.3, 32.6, 34.4, u), sw = Math.sin(time * 0.78 + strokePh * 1.7) * rest;
        rig.position.set(0.2 * sw, RIGY + Math.sin(time * 0.9 + haulPh) * 0.07 - 6 * (1 - rise) - sink, RIGZ - 0.5 * pull - 0.9 * taut);
        rig.rotation.y = yawT + 0.03 * sw; rig.rotation.z = 0.075 * sw - 0.15 * onArm; rig.rotation.x = 0.03 * Math.sin(time * 0.37 + haulPh) - 0.05 * pull;
        headPiv.rotation.x = 0.1 + 0.17 * Math.sin(time * 0.95 + strokePh) + 0.12 * pull; headPiv.rotation.y = 0.14 * Math.sin(time * 0.33 + haulPh) - yawT * 0.7;
        const rp = time * (Math.PI * 2 / 2.4) + strokePh;            // one stroke every 2.4 s, begun where the seed deals it
        for (const f of flip) { f.pv.rotation.y = f.s * (0.5 + 0.45 * Math.sin(rp)); f.pv.rotation.z = f.s * (0.02 + 0.12 * Math.cos(rp)); }
        { // our turtle's lid shadow: a card oval with a head and two rowing flippers, lying where the lid's light puts it: almost straight below the turtle, sliding beside us
          rig.updateMatrix(); hS.set(0, SHY, -1.5).applyMatrix4(rig.matrix).applyMatrix4(camera.matrixWorld);
          style.setShadow(5, hS.x, hS.z, 2.6 * SU.uTurtle.value.y, 1.9 * SU.uTurtle.value.y, Math.atan2(camD.z, camD.x) - yawT, hS.y - 7, 0.9 * rise);   // (cast from under its lowest edge: it lies on the reef below, never on the turtle itself)
          SU.uTurtle.value.x = 0.5 + 0.45 * Math.sin(rp); }
        {
          // "15 s: the string slackens, a wire arm takes our threads" ... "34 s: the arm lets go, the string comes taut". k: how far the arm holds us. At 34 s the arm
          // swings up and away with nothing on it, the slack loop at the nose and the slack length that hung from the hole are drawn straight in a third of a second
          // (the taut string is one line from the nose to the hole), and the ride surges on the long pull.
          const k = beat(14.3, 15.7, 33.7, 34.5, u), tautK = ss(33.9, 34.25, sec), away = ss(33.7, 35.6, sec);
          strA.uniforms.uMaxA.value = 1 - ss(14.3, 15.7, sec); strC.uniforms.uMaxA.value = tautK; strD.uniforms.uMaxA.value = Math.max(1 - ss(14.3, 15.7, sec), tautK); strS.uniforms.uMaxA.value = ss(14.3, 15.7, sec) * (1 - tautK);
          slack.scale.setScalar(Math.max(0.001, ss(14.3, 15.7, sec) * (1 - tautK))); slack.rotation.y = -yawT * 0.8 + 0.2 * Math.sin(time * 0.7); slack.rotation.x = 0.06 * Math.sin(time * 1.1 + 1); hangMat.uniforms.uMinA.value = 0.1 + 0.34 * k;
          hS.set(0, SHY + 0.1, -1.9).applyMatrix4(rig.matrix).applyMatrix4(camera.matrixWorld);                 // over the middle of the shell
          // the arm comes from the mobile's own pivot high over the manta (the hero's anchor), out to an elbow that leads us round the turn, and down to the hook over our heads.
          // Its place is a sight rule that holds all round the turn: the hook hangs to the side we travel toward, more than 35 degrees off the line from our eye to the manta's
          // middle, and pivot and elbow stand higher above the eye than the belly's nearest edge does, so no part of the arm lies over the belly from anywhere on the turn
          const hx = HUB.x - hS.x, hz = HUB.z - hS.z, hl = Math.hypot(hx, hz) || 1, th = Math.atan2(-hz, -hx) + 0.62 + 0.9 * away;
          const elev = Math.max(0.42, Math.min(0.85, Math.asin(Math.max(-1, Math.min(1, camD.y))) + 0.45)), hd = 7.5, hlat = 8.5;
          hook.set(hS.x + (hx / hl) * hd + (hz / hl) * hlat, camP.y + Math.tan(elev) * (hd + 3.5) + 0.2 * Math.sin(time * 0.8) + 16 * away, hS.z + (hz / hl) * hd - (hx / hl) * hlat);
          for (let sI = 0; sI < 2; sI++) {
            const sg = sI ? 1 : -1, ph = time * 1.3 + sI * 2.1;
            hB.set(sg * 1.75, SHY + 0.1, -1.6).applyMatrix4(rig.matrix).applyMatrix4(camera.matrixWorld);
            hT.set(hB.x + (sI ? -2.2 : 1.3) + 0.7 * Math.sin(ph), hB.y + 70, hB.z + (sI ? 0.8 : -1.9) + 0.6 * Math.cos(ph * 0.83)).lerp(hook, k);
            let len = hT.distanceTo(hB); hT.sub(hB).divideScalar(Math.max(len, 1e-3));
            { const dn = hT.dot(camD), d0 = hP.copy(hB).sub(camP).dot(camD); if (dn < -1e-4) len = Math.min(len, Math.max((d0 - 0.4) / -dn, 0)); }   // a ribbon may not run on behind the eye
            for (let j = 0; j < 6; j++) { hP.copy(hB).addScaledVector(hT, Math.min(HANG_D[j], len)); hQ.copy(hB).addScaledVector(hT, j === 5 ? len : Math.min(HANG_D[j + 1], len)); setSeg(hangs.geometry, sI * 6 + j, hP, hQ); }
          }
          hangs.geometry.getAttribute('position').needsUpdate = true; hangs.geometry.getAttribute('aOther').needsUpdate = true;
          const ka = ss(14.3, 15.7, sec);                              // (the arm is the mobile's: once it has come out to us it stays out, and swings away empty at 34 s)
          hP.copy(ARM_PIVOT); hQ.set(HUB.x + Math.cos(th) * 30, camP.y + 34 + 10 * away, HUB.z + Math.sin(th) * 30).lerp(hP, 1 - ka); hT.copy(hook).lerp(hP, 1 - ka);
          const front = (a, b) => { const da = hB.copy(a).sub(camP).dot(camD), db = hB.copy(b).sub(camP).dot(camD); if (db < 0.5) b.lerp(a, da > 0.5 ? Math.min(1, (0.5 - db) / (da - db)) : 1); };
          front(hQ, hT); front(hQ, hP);
          setSeg(armMesh.geometry, 0, hP, hQ); setSeg(armMesh.geometry, 1, hQ, hT);
          hP.copy(hT); hP.y -= 0.8 * ka; setSeg(armMesh.geometry, 2, hT, hP);                                             // the hook: down, round and up again
          hQ.copy(hP).add(hB.set(-(hz / hl) * 0.42 * ka, -0.34 * ka, (hx / hl) * 0.42 * ka)); setSeg(armMesh.geometry, 3, hP, hQ);
          hP.copy(hQ).add(hB.set(-(hz / hl) * 0.26 * ka, 0.4 * ka, (hx / hl) * 0.26 * ka)); setSeg(armMesh.geometry, 4, hQ, hP);
          armMesh.geometry.getAttribute('position').needsUpdate = true; armMesh.geometry.getAttribute('aOther').needsUpdate = true;
        }
        for (const fn of updaters) fn(dt, time, u, gust);
      },
      dispose() { for (const d of disposables) d.dispose(); if (hero && hero.dispose) hero.dispose(); },
    };
  },
};
