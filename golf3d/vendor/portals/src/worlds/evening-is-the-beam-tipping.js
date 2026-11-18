// Evening Is the Beam Tipping: a hanging mobile of painted ply, brass wire and waxed linen at dust-mote scale.
// The sun and the moon hang from the two ends of one brass beam; evening is that beam tipping. Everything is made
// from ONE makeStyle() instance (src/parts/evening-is-the-beam-tipping.js): the unlit two-value ply material, brass
// wire, linen thread, the room dome, one depth pass from the window for the shadows. Flat switch on: no tone map.
//
// Layout (world metres; hero-local + (40,0,208)): beam along (0.5,0,0.866), sun plumb line at (-80, z 0), balance
// loop at (40,400,208), a 30 m ring (the exit) just above it, the maker's 6 m hook 3 m over the ring's top under a darker ceiling.
// The path enters at z -535 heading +Z with the sun's authored limb hung to its right (west) and one swallow arm on
// its left, flies IN AMONG the near tier (u 0.14 to 0.45: two garlands of arms hung down both sides of the flight,
// the right-hand one finished by the moon's tree, which rises to the lens as the sun's sinks), comes down to the
// moth's cloud, passes the sun's red face (abeam at u 0.6), climbs past the sun's thread and loop (u 0.64: the loop
// in the right third, the rod running away to ring and hook), goes OVER the rod and rides a few metres above it (u 0.71 to 0.81: the beam running away under the lens to loop, ring and
// hook, the moon's two authored limbs falling away on either side), drifts to its right and turns into the ring with
// the crescent clear to the right of it and the moon's left limb stepping UP beside it on the left. The ring holds a round of flat rose paper that thins as the opening behind
// it opens, so the shut opening and its glow are never seen; the portal look is pinned to the plain ring.
// The moon's limbs are authored at the golden hour; at dawn and by day the moon rides lower and they hang far below.
// Fourth pass: the sun's first arm T0 reaches out to the RIGHT of the flight to a cloud D,
// and the limb arm T1 hangs from D, so no brass ever crosses the sun's disc (checked by probe at every hour). T0's
// other end carries cloud A, and under A hangs THE RACK: the sun's far tree, flat like a curtain across the line of
// the entry, so it is seen broadside from the first frame (a bank of six clouds, then four swallows, four hills,
// four waves, four boats, a slot of 100 m to a piece; its rows turn one after another, u 0.2 to 0.45). Swallow B
// hangs 40 m up the light from cloud E and lays its shadow on it (u 0.08, 0.16).
// Fifth pass: THE CORRIDOR OPENS. A piece the lens will not reach for a long while hangs edge-on to the lens, a
// sliver, and swings its painted face round as the lens comes within about two hundred metres, so from the entry
// the near tier is a few faces with the rack clear beneath it; the pieces about the entry and along both garlands
// are aimed at the lens where it meets them (never a striped plank); the sun makes its half-turn in the stretch of
// a cloud's (u 0.475 to 0.541), so its red face is in the window's light with its cream spiral from u 0.52. The sun's evening face carries a drawn cream spiral; the rod wears painted
// sleeves on the sun's half; a big cloud (L8) passes at u 0.52, a cloud (LA) and a boat (RA) flank the rod at
// u 0.70; the lens leaves the rod to its right at u 0.77, so the rod comes in from the left edge at 0.79 and 0.87.
// The wall shadow is DRAWN in the wall shader (rod, ring, hook, scalloped sun, crescent, two small arms) because
// the window light runs almost along the beam and the true shadow stacks into a blot; it tips with the beam.
// Sixth pass: THE ROOM IS A PLACE (one shader on the dome: far wall, side walls, ceiling, cornice, picture rail,
// dado, corner lines, the brush of the wall in two tones, the soft shadows of the mobile's own pieces on the walls,
// the window's patch and the drawn shadow in it). The rack is cut half as large again and hung wider, its rows
// splayed in depth. Each still has ONE large piece near the lens: the edge cloud with its bird's shadow (0.08, 0.16),
// the navy swallow whole over a white cloud (0.25), the moth cut larger on a larger cloud that goes on sinking under
// it (0.34), a boat with its sail (0.43). At the sun pass the gaze lifts so the red face stands as a setting sun cut
// by the bottom edge only (0.61); the lens keeps to the LEFT of the rod past the sun's loop (0.70: the sleeved rod
// seen from the side, running across the frame to the ring), goes over it looking away to the moon's right limb
// (0.745: a boat, a hill, a cloud), and comes round as before. The ring is 40 m with four small charms hung under it.
// Seventh pass: THE FIRST THIRD HAS ONE SUBJECT A STILL. The edge cloud is cut tall (a cumulus) and a swallow hung by its
// beak climbs its thread 42 m up the window's light from it: the cloud wears the bird's whole shadow (u 0.05 to 0.16,
// the gaze goes to the pair from u 0.03). The rack is two thirds as wide, hung 30 m further east (lower left of that
// picture), 8 m of rose between its rows, and nothing stands in it: far leaves hang shut and a hair thin until the
// lens is within about 170 m, far brass trades opacity for its least width, and a near leaf shuts again as the lens
// goes by (dep), so nothing leaves the frame as a cut face or a striped plank. Two garlands were taken down (GL0, MR:
// its hill stood on the sun's rim at u 0.475). The ring is 30 m, its paper carries the drawn shadows of rim, hook and
// one small arm, and its charms hang as two balanced arms of two loads each.
// The balance is a CPU tree of arms in closed form (no integration): ambient sway in time + damped impulses keyed to u.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath, makeRng } from '../kit/core.js';
import { makeStyle, buildHero } from '../parts/evening-is-the-beam-tipping.js';

const DEG = Math.PI / 180;
// alternative cast silhouettes are added here; everything else is the style's own thirteen
const ALT = { swallow: 'goose', boat: 'fish', hill: 'roof' };
const HOURS = {
  golden: { tilt: [14.5, -14.5], eve: [0, 1], elev: [17, 8], turn: 1 },
  dawn: { tilt: [-14.5, 14.5], eve: [1, 0], elev: [8, 17], turn: -1 },
  day: { tilt: [4.5, -4.5], eve: [0.02, 0.22], elev: [26, 21], turn: 0 },
  night: { tilt: [0, -14.5], eve: [0.62, 1], elev: [11, 6], turn: 2 },
};

export default {
  id: 'evening-is-the-beam-tipping',
  name: 'Evening Is the Beam Tipping',
  category: 'interior',
  weirdness: 0.6,
  media: ['air', 'interior', 'tiny'],
  after: 'Alexander Calder, 1898 to 1976',
  async build(ctx) {
    const rng = ctx.rng, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const scene = new THREE.Scene();

    // ---- the seeded look: hour, colourway, cast (all draws up front, fixed order) -------------------------------
    const hourRoll = rng(), wayRoll = rng(), castRoll = [rng(), rng(), rng()], rainRoll = rng();
    const treeSeed = rng.int(1, 1e6);
    let hourName = HOURS[vary.hour] ? vary.hour : (hourRoll < 0.7 ? 'golden' : hourRoll < 0.8 ? 'night' : hourRoll < 0.92 ? 'dawn' : 'day');
    const hour = HOURS[hourName];
    const colourway = wayRoll < 0.56 ? 'seven' : wayRoll < 0.78 ? 'chalk' : 'three';
    const cast = { geese: castRoll[0] < 0.3, fish: castRoll[1] < 0.3, roofs: castRoll[2] < 0.3, rain: rainRoll < 0.22 };

    const style = makeStyle(ctx, { tilt: hour.tilt, eve: hour.eve, elev: hour.elev });
    const pal = style.pal;
    // colourways repaint the same pots before anything is painted: no mixing on the pieces themselves
    if (colourway === 'chalk') {
      // chalk sticks, each still its own hue: the indigo stays a blue-violet two steps darker than the room
      pal.sun.set('#E8823C'); pal.bird.set('#7DA2DA'); pal.boat.set('#DD7466'); pal.hill.set('#9CC389'); pal.night.set('#474C8E');
      pal.room.set('#C7A2A0'); pal.roomEve.set('#9A86A6'); pal.patch.set('#F8D2AE');
    } else if (colourway === 'three') {
      pal.sun.copy(pal.boat); pal.bird.copy(pal.night); pal.hill.copy(pal.plyLight); pal.cloud.copy(pal.moon);
    }
    if (hourName === 'night') { pal.patch.set('#BFCBE6'); pal.room.set('#9A8FA6'); pal.roomEve.set('#4F4A70'); style.U.uAirWarm.value.set('#A9B6D6'); }
    if (hourName === 'day') { pal.room.set('#D9B4AA'); pal.roomEve.set('#B9929A'); }
    await ctx.yield();

    const O = V(40, 0, 208);                                            // hero-local -> world
    // The ring is 40 m across so that it stands a quarter of the frame high on the last straight, and the hook sits
    // 3 m over the ring's top, at the maker's own 6 m size (the brief's 640 can never be in frame from this path): the
    // last straight looks from under the ring (underRing) so that ring and hook sit in the upper third of the frame.
    // The sun's half-turn. The red face comes round to the lens with its back to the window: for about a quarter-turn
    // it shows in shadow (maroon, its spiral grey). The turn is made in a stretch as short as a cloud's, so that the
    // face is edge-on at u 0.5 and in the window's light, red and cream, from u 0.52.
    const SUN_TURN = [0.475, 0.541];
    const RING_R = 15, HOOK_K = 1, HOOK_UP = RING_R + 0.3 + 3, ringY0 = 400 + 12.5 + RING_R;
    const hero = await buildHero(ctx, { style, detail, sunTurn: SUN_TURN, ringYaw: 27 * DEG, ringR: RING_R, ringW: 0.6, moonR: 42, hookSize: HOOK_K, hookY: ringY0 + HOOK_UP - 3.7 * HOOK_K });
    hero.object.position.copy(O);
    scene.add(hero.object);
    if (colourway === 'three') style.paint(hero.pieces.sun, 0, { day: pal.boat, eve: pal.night, chip: 0.3, seed: hero.pieces.sunSeed, ...hero.pieces.sunHand });
    await ctx.yield();

    // ---- the path, derived from the tilt function ---------------------------------------------------------------
    const tmpA = V(0, 0, 0), tmpB = V(0, 0, 0);
    const sunBotY = (u) => hero.sunCentre(u, tmpA).y + hero.pieces.sunEnds.bot;
    const moonBotY = (u) => hero.moonCentre(u, tmpA).y + hero.pieces.moonEnds.bot;
    // beam coordinates: s metres along the rod from the balance point (sun end -240, moon end +360), r metres to the
    // right of it (toward -X), h metres above the rod where it is at that u
    const bxz = (s, r) => [O.x + 0.5 * s - 0.866 * r, O.z + 0.866 * s + 0.5 * r];
    const bp = (s, r, h, u) => { const q = hero.beamPoint(s, u, V(0, 0, 0)).add(O); q.x -= 0.866 * r; q.z += 0.5 * r; q.y += h; return q; };
    // the maker's silhouettes, one instanced mesh each (made once the tree has been counted)
    const shapes = new Map();
    const getShape = (kind0, k0, size) => {
      const alt = (kind0 === 'swallow' && cast.geese) || (kind0 === 'boat' && cast.fish) || (kind0 === 'hill' && cast.roofs);
      const kind = alt ? ALT[kind0] : kind0, k = alt ? 0 : k0, key = kind + k + (size || '');
      if (!shapes.has(key)) {
        const sh = style.shape(kind, k, size); let r = 0;
        for (const p of sh.outline) r = Math.max(r, Math.abs(p[0]));
        shapes.set(key, { key, sh, r: r + 0.5, h: sh.top - sh.bot, count: 0, mesh: null });
      }
      return shapes.get(key);
    };
    // the authored limb of the sun's tree hangs on short threads: sun -> T1 -> cloud C1 -> T2 -> small cloud S -> the
    // short-hung swallow arm, 10 m over the path; the edge cloud E is S's partner, the moth cloud M hangs under E.
    // T1 rides tipped: its long south end is T1RISE higher than its loop, which brings the sun down toward the entry axis.
    // The sun's first arm hangs on a long thread and rides steeply tipped, so that from the entry its wire climbs to the
    // clouds beside the disc and not across its face.
    const TP2X = 4;                 // extra thread under the high cloud C1, taken up again by T1's rise: the path keeps its height
    // The sun's first arm T0 (the brief's: 300 m class, two 60 m clouds, 30 m under the disc) runs from north-east to
    // south-west: under its near cloud D, out to the right of the flight, hangs T1, whose wire climbs south to the high
    // cloud C1 over the entry and so stays to the RIGHT of the sun's disc from every point of the flight; under its far
    // cloud A hangs the far tree, the five tiers.
    const shD = getShape('cloud', 1, 60), T0TP = 30;
    const AUTH = { tp1: T0TP + 3 + shD.h + 3, tC: 3, tp2: 3 + TP2X, tS: 2, tp4: 3, tW: 2 }, ZE = -535, T1RISE = 95 + TP2X;
    const shC1 = getShape('cloud', 1, 35), shS = getShape('cloud', 0, 22), shE = getShape('cumulus', 2, 66);
    const authDrop = AUTH.tp1 + AUTH.tC + shC1.h + AUTH.tp2 + AUTH.tS + shS.h + AUTH.tp4;
    const yE = sunBotY(0.1) - authDrop + T1RISE - 10, yM = yE - 4, c6 = hero.sunCentre(0.6, tmpA).y;
    const ring = hero.anchors.portalSeat.position.clone().add(O), axis = hero.anchors.ringAxis.clone();
    const lastStart = ring.clone().addScaledVector(axis, -62);
    // north with the sun's red face ahead on the right, round its rim, up and OVER the rod by the sun's loop, then along
    // the beam a few metres above it (the picture from above: the rod running away under the lens to loop, ring and
    // hook, the tiers falling away on both sides), drifting to its right and turning into the ring so that the
    // crescent stands clear to the right of it
    // (at dawn the beam tips the other way and its sun end comes UP under the lens: a few metres more room)
    const HUP = hourName === 'dawn' ? 6 : 0;
    // (the lens rides over the rod only from u 0.69 to 0.76; then it swings out 60 m to the rod's right and comes round
    // into the ring, so that from u 0.79 the rod is a slanting line seen from beside it, never a pole under the lens)
    const RUN = [[-206, -26, 8, 0.7], [-172, 14, 12, 0.745], [-146, 30, 10, 0.79], [-98, 38, 10, 0.86]].map((q) => bp(q[0], q[1], q[2] + HUP, q[3]));
    const path = makePath([
      [-41, yE - 6, ZE], [-45, yE, ZE + 62], [-58, yE - 6, ZE + 150], [-36, yM - 40, -236],
      [-27, lerp(yM - 22, c6 + 10, 0.5) - 17, -160], [-33, c6 + 10, -88], [-31, c6 + 15, -52], [-56, c6 + 44, -18],
      ...RUN.map((q) => [q.x, q.y, q.z]), [lastStart.x, lastStart.y, lastStart.z], [ring.x, ring.y, ring.z],
    ]);
    const duration = 41;
    const pace = (u) => 1.15 - 0.35 * (1 - smoothstep(0.06, 0.16, u)) - 0.42 * smoothstep(0.46, 0.54, u) * (1 - smoothstep(0.62, 0.7, u)) - 0.3 * smoothstep(0.76, 0.82, u) * (1 - smoothstep(0.86, 0.92, u));
    const NS = 48, pathS = [];
    for (let i = 0; i <= NS; i++) pathS.push(path.pointAt(i / NS, V(0, 0, 0)));
    const pathAt = (u, out) => { const f = clamp(u, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(f)); return out.lerpVectors(pathS[i], pathS[i + 1], f - i); };
    await ctx.yield();
    // ---- the two trees: data first (79 arms, 158 pieces), meshes after -------------------------------------------
    // node (arm): { tree, depth, parent (piece or null = sun/moon), tp, x, z, drop, yaw, a, b, loads[2], ph[4], sign }
    // piece: { node, end, S (shape entry), t (thread), x, z, dropTop, dropC, depth, child, yaw0, turnAt, flags }
    const nodes = [], pieces = [], trng = makeRng(treeSeed);
    const sunB = [], moonB = [];
    for (let i = 0; i <= NS; i++) { sunB.push(sunBotY(i / NS)); moonB.push(moonBotY(i / NS)); }
    const ARM = [0, 300, 150, 90, 55, 34, 22], TP = [0, 30, 16, 16, 4, 9, 10], TL = [0, 16, 16, 3.5, 9.5, 10, 8];
    const kindAt = (depth, end, r) => depth === 1 ? ['cloud', r.int(0, 1), 60] : depth === 2 ? ['cloud', r.int(0, 3), 35]
      : depth === 3 ? ['swallow', r.int(0, 1)] : depth === 4 ? ['hill', r.int(0, 2)] : depth === 5 ? ['wave', r.int(0, 1)]
        : (end === 0 ? ['boat', r.int(0, 1)] : ['wave', r.int(0, 1)]);
    const rootXZ = [[hero.anchors.sunPlumb.x + O.x, hero.anchors.sunPlumb.z + O.z], [hero.anchors.moonPlumb.x + O.x, hero.anchors.moonPlumb.z + O.z]];
    function clearOK(n) {
      const B = n.tree === 0 ? sunB : moonB, ext = 0.1 * Math.max(n.a, n.b) + 2;
      const lim = n.parent && n.parent.node.special ? 324 : 81;      // what hangs under the see-sawing swallow arm rides up and down with it
      const cy = Math.cos(n.yaw), sy = Math.sin(n.yaw);
      for (let i = 0; i <= NS; i++) {
        const P = pathS[i], yA = B[i] - n.drop;
        for (let k = 0; k <= 8; k++) {                                  // the wire
          const s = -n.a + (n.a + n.b) * k / 8, dx = n.x + cy * s - P.x, dz = n.z + sy * s - P.z;
          const dv = Math.max(0, Math.abs(yA - P.y) - ext * Math.abs(s) / Math.max(n.a, n.b));
          if (dx * dx + dz * dz + dv * dv < lim) return false;
        }
        for (const p of n.loads) {                                      // the load, its thread and its turning circle
          const dh = Math.max(0, Math.hypot(p.x - P.x, p.z - P.z) - p.S.r), lo = B[i] - p.dropC + p.S.sh.bot - ext, hi = yA + ext;
          const dv = P.y < lo ? lo - P.y : P.y > hi ? P.y - hi : 0;
          if (dh * dh + dv * dv < lim) return false;
        }
      }
      return true;
    }
    // 1 for each load that hangs 18..150 m down the light from an earlier piece of its tree, within that piece's width
    const LX = 0.518, LY = -0.208, LZ = 0.829;
    function shadeScore(loads) {
      let sc = 0;
      for (const p of loads) {
        for (let i = pieces.length - 1; i >= -1; i--) {
          const q = i >= 0 ? pieces[i] : null;
          if (q && q.tree !== p.tree) continue;
          const qx = q ? q.x : rootXZ[p.tree][0], qz = q ? q.z : rootXZ[p.tree][1], qd = q ? q.dropC : (p.tree ? hero.pieces.moonEnds.bot : hero.pieces.sunEnds.bot), qr = q ? q.S.r : (p.tree ? 20 : 40);
          const dx = p.x - qx, dz = p.z - qz, dy = qd - p.dropC, t = dx * LX + dy * LY + dz * LZ;
          if (t < 18 || t > 150) continue;
          const ex = dx - t * LX, ey = dy - t * LY, ez = dz - t * LZ, lim = 0.5 * qr + 2;
          if (ex * ex + ey * ey + ez * ez < lim * lim) { sc += 1; break; }
        }
      }
      return sc;
    }
    function spreadScore(loads, row) {
      let m = 1;
      for (const p of loads) for (const q of row) m = Math.min(m, Math.hypot(p.x - q.x, p.z - q.z) / 110);
      return m;
    }
    function addArm(tree, depth, parent, o = {}) {
      const r = trng, len = o.len ?? ARM[depth] * r.range(0.9, 1.1);
      const f = o.f ?? (r.chance(0.5) ? r.range(0.36, 0.45) : r.range(0.55, 0.64));
      const px = parent ? parent.x : rootXZ[tree][0], pz = parent ? parent.z : rootXZ[tree][1];
      const n = { id: nodes.length, tree, depth, parent, tp: o.tp ?? TP[depth], x: px, z: pz, yaw: 0, a: o.a ?? len * f, b: o.b ?? len * (1 - f),
        drop: (parent ? parent.dropC - parent.S.sh.bot : 0) + (o.tp ?? TP[depth]), loads: [], ph: [r.range(0, 6.28), r.range(0, 6.28), r.range(0, 6.28), r.range(0, 6.28)],
        sign: depth % 2 ? 1 : -1, auth: !!o.auth, special: o.special || 0, cd: parent ? parent.node.cd + 1 : 1, th0: o.tilt0 || 0, amp: 1 };
      const kinds = [0, 1].map((e) => (o.kinds && o.kinds[e]) || kindAt(depth, e, r));
      const tl = [0, 1].map((e) => (o.tl && o.tl[e]) ?? TL[depth] * r.range(0.85, 1.15));
      const pyaw = [r.range(-0.5, 0.5), r.range(-0.5, 0.5)], pph = [r.range(0, 6.28), r.range(0, 6.28)];
      const baseYaw = parent && parent.node ? parent.node.yaw + Math.PI / 2 : r.range(0, Math.PI);
      let best = null;
      for (let tries = 0; tries < 24; tries++) {
        // an arm that cannot swing clear of the flight at full length is hung short rather than left off
        if (tries >= 14) { if (best) break; if (tries === 14) { n.a *= 0.5; n.b *= 0.5; } }
        const yaw = o.yaw ?? baseYaw + (tries === 0 ? r.range(-0.6, 0.6) : r.range(-1.5, 1.5));
        n.yaw = yaw;
        n.loads = [0, 1].map((e) => {
          const S = getShape(...kinds[e]), s = e === 0 ? -n.a : n.b;
          return { node: n, end: e, S, t: tl[e], x: n.x + Math.cos(n.yaw) * s, z: n.z + Math.sin(n.yaw) * s, dropC: n.drop + tl[e] + S.sh.top - s * Math.sin(n.th0),
            depth, child: null, yaw0: Math.PI + pyaw[e], ph: pph[e], tree, kind: kinds[e][0], flags: 0 };
        });
        // a long authored arm sways as many METRES as a short one, not as many degrees: its far end carries a whole limb
        if (o.auth) { n.amp = Math.min(1, 40 / Math.max(n.a, n.b)); best = { yaw, loads: n.loads, sc: 0 }; break; }
        if (!clearOK(n)) continue;
        // shadows are the depth: of the yaws that clear the path, take the one that hangs a load in the long shadow of a
        // piece already hung (down the window's light from it), so pieces wear each other's shadows
        // (a tier of the far tree instead takes the yaw that hangs its loads furthest, in plan, from the rest of its row:
        // rose shows between neighbours)
        const sc = (o.tier ? spreadScore(n.loads, o.tier) : shadeScore(n.loads)) - tries * 0.02;
        if (!best || sc > best.sc) best = { yaw, loads: n.loads, sc };
        if (o.tier ? sc > 0.9 : (sc > 1.5 || (tries >= 5 && sc > 0.5))) break;
      }
      if (!best) return null;
      n.yaw = best.yaw; n.loads = best.loads; n.ok = true;
      nodes.push(n);
      for (const p of n.loads) { p.id = pieces.length; pieces.push(p); p.S.count++; }
      if (parent) parent.child = n;
      return n;
    }
    // the sun's tree: the authored limb first (moth cloud M, edge cloud E, cloud G with the short-hung swallow arm)
    const dirTo = (ax, az, bx, bz) => Math.atan2(bz - az, bx - ax);
    const sx0 = rootXZ[0][0], sz0 = rootXZ[0][1];
    const pxAt = (z) => { let bx = 0, bd = 1e9; for (const q of pathS) { const d = Math.abs(q.z - z); if (d < bd) { bd = d; bx = q.x; } } return bx; };
    // the whole limb hangs to the right of the path (west): the beam, the ring and the crescent stand clear on the left
    // at the other hours the beam leans differently and the limb rides a few metres off its golden-hour place: more room
    const SIDE = hourName === 'golden' ? 0 : 6;
    const Sxz = [-78, ZE + 55], Exz = [-93, ZE + 166], E_DROP = 14, MZ = -187, Mxz = [pxAt(MZ) - 30 - SIDE, MZ], Hxz = [Mxz[0] - 38, MZ + 12];
    const lenSE = Math.hypot(Exz[0] - Sxz[0], Exz[1] - Sxz[1]), fC = 0.25;
    const Cxz = [lerp(Sxz[0], Exz[0], fC), lerp(Sxz[1], Exz[1], fC)];
    // armTo: an authored arm from the loop over `from` whose b end hangs over `to`; rise lifts that end (the arm rides tipped)
    const armTo = (tree, depth, parent, from, to, a, rise, kinds, o = {}) => {
      const b = Math.hypot(to[0] - from[0], to[1] - from[1]) - 2.75;
      return addArm(tree, depth, parent, { auth: true, yaw: dirTo(from[0], from[1], to[0], to[1]), a, b, tilt0: Math.asin(clamp(rise / b, -(o.tip ?? 0.5), o.tip ?? 0.5)), kinds, ...o });
    };
    // (T1 is made as much longer as its steeper rise needs, so the high cloud still hangs over Cxz less the ten metres
    // the limb was laid out with)
    const DYAW = 33 * DEG, dxz = [sx0 - Math.sin(DYAW) * 130, sz0 - Math.cos(DYAW) * 130];
    const t1b = Math.hypot(Cxz[0] - dxz[0], Cxz[1] - dxz[1]) - 2.75, T1B = Math.sqrt(t1b * t1b - 90 * 90 + T1RISE * T1RISE);
    const T0 = addArm(0, 1, null, { auth: true, tp: T0TP, yaw: Math.atan2(-Math.cos(DYAW), -Math.sin(DYAW)), a: 70, b: 130, kinds: [['cloud', 0, 60], ['cloud', 1, 60]], tl: [3, 3] });
    const pD = T0.loads[1];
    pD.tag = 'D';
    const T1 = armTo(0, 2, pD, [pD.x, pD.z], Cxz, 26, T1RISE, [['cloud', 3, 35], ['cloud', 1, 35]], { tp: 3, tl: [AUTH.tC, AUTH.tC], b: T1B });
    T1.loads[0].leaf = true;
    const pC1 = T1.loads[1];
    // T2 rides tipped DOWN toward the edge cloud E (E_DROP metres), which brings E to the height of the lens; the small
    // cloud S at its other end rides that much higher (out of the top of the frame as the lens goes under it), and the
    // swallow arm hangs from S on a thread as much longer, so it keeps its place
    const t2a = lenSE * fC - 2.75, t2b = lenSE * (1 - fC) - 2.75, t2s = clamp(E_DROP / t2b, 0, 0.5);
    const T2 = addArm(0, 2, pC1, { auth: true, tp: AUTH.tp2, yaw: dirTo(Sxz[0], Sxz[1], Exz[0], Exz[1]), a: t2a, b: t2b, tilt0: -Math.asin(t2s), kinds: [['cloud', 0, 22], ['cumulus', 2, 66]], tl: [AUTH.tS, AUTH.tS] });
    const pS = T2.loads[0], pE = T2.loads[1];
    const T4 = addArm(0, 3, pS, { auth: true, special: 1, tp: AUTH.tp4 + t2a * t2s, yaw: Math.PI + 0.05, a: 70, b: 8, tilt0: -20 * DEG, kinds: [['swallow', 0, 0.85], ['swallow', 1]], tl: [AUTH.tW, AUTH.tW] });
    const T3 = armTo(0, 2, pE, Exz, Mxz, 30, (hourName === 'dawn' ? -20 : 38), [['cloud', 3, 22], ['cloud', 1, 52]], { tp: 2, tl: [2, 2] });
    const pM = T3.loads[1];
    // under the left-hand swallow a long arm reaches forward along the left of the flight, tipped up, to hang another
    // swallow close on the left where the lens comes down toward the moth's cloud (no wire crosses the flight)
    const pW = T4.loads[0], Lxz = [-12, -285];
    const T6 = armTo(0, 4, pW, [pW.x, pW.z], Lxz, 4, 4, [['wave', 1, 0.5], ['swallow', 1]], { tp: 3, tl: [2, 2] });
    const pL = T6.loads[1];
    pL.leaf = true;                                              // the two pieces hung closest to the flight carry nothing more
    // under the moth cloud its branch hangs ACROSS the line of sight: a hill out to the right at the cloud's own
    // height, a wave strip to the left a little lower, so the arm see-saws inside the frame when the moth lands
    const T5 = armTo(0, 4, pM, Mxz, Hxz, 22, 9, [['wave', 1], ['hill', 2]], { tp: 2, tl: [2, 2] });
    const pH5 = T5.loads[1];
    pH5.leaf = true;
    // from under the right-hand swallow of the short-hung arm a long wire reaches forward, tipped up, to hang another
    // swallow B up the window's light from the edge cloud E: E wears that bird's shadow, whole, from u 0.06 until it
    // has turned (the picture at u 0.08: a bird and its shadow on a cloud), and the shadow changes as bird and cloud turn
    const pR = T4.loads[1], BT = 42, Bxz = [Exz[0] - 0.53 * BT + 4.7, Exz[1] - 0.85 * BT + 1.8];
    const shB = getShape('climber', 0, 0.9), bRise = pR.dropC - pR.S.sh.bot + 3 + 2 + shB.sh.top - (pE.dropC - 0.29 * BT + 1.5);
    // (this arm rides steeply tipped: it is cut as long as its reach and its rise together need, so the bird hangs
    // on the window's light through the cloud's middle, 40 m up it, and stands clear of the cloud as the lens sees them)
    const hB = Math.hypot(Bxz[0] - pR.x, Bxz[1] - pR.z) - 2.75, bT7 = Math.hypot(hB, bRise);
    const T7 = armTo(0, 4, pR, [pR.x, pR.z], Bxz, 14, hB * bRise / bT7, [['wave', 0], ['climber', 0, 0.9]], { tp: 3, tl: [2, 2], tip: 0.75, b: bT7 });
    const pX = T7.loads[1];
    pX.tag = 'B'; pR.tag = 'R'; pX.leaf = true; T7.bRise = bRise;
    // The moon's authored limb reaches all the way back along the right of the beam, each arm riding tipped up toward
    // the lens, so the moon's rising half comes up beside the last third of the flight: a 60 m cloud right of the ring,
    // a 35 m cloud beside the run, a hill and a swallow under it, a boat and a wave under the hill.
    const mXZ = rootXZ[1], Q2 = bxz(58, -85), Q1 = bxz(150, 36), P2 = bxz(-110, 120), H3 = bxz(-126, 96), B4 = bxz(-112, 104);
    // the big cloud rides under the rod's moon arm (always well below it): low between ring and crescent on the last
    // straight; a smaller one steps back to its right, and from that one the limb reaches back along the beam
    const moonT1 = armTo(1, 1, null, mXZ, Q2, 120, 32 + 15, [['cloud', 0, 60], ['cloud', 1, 60]], { tp: 4, tl: [8, 3] });
    const pQ2 = moonT1.loads[1];
    const moonTq = armTo(1, 2, pQ2, Q2, Q1, 22, 32.5 - 15, [['cloud', 0, 22], ['cloud', 1, 60]], { tp: 3, tl: [2, 3] });
    const pQ1 = moonTq.loads[1];
    const moonT2 = armTo(1, 2, pQ1, Q1, P2, 30, 42.5, [['cloud', 1, 60], ['cloud', 0, 60]], { tp: 3, tl: [2, 3] });
    const pP2 = moonT2.loads[1], pA2 = moonT2.loads[0];
    const moonT3 = armTo(1, 3, pP2, P2, H3, 30, 25, [['swallow', 1], ['hill', 1]], { tp: 3, tl: [3, 2] });
    const pH3 = moonT3.loads[1];
    const moonT4 = armTo(1, 6, pH3, H3, B4, 13, 2, [['wave', 0], ['boat', 0]], { tp: 3, tl: [3, 2] });
    const pB4 = moonT4.loads[1];
    pQ2.tag = 'Q2'; pQ1.tag = 'Q1'; pP2.tag = 'P2'; pA2.tag = 'A2'; pH3.tag = 'H3'; pB4.tag = 'B4'; moonT1.loads[0].tag = 'Q0'; moonTq.loads[0].tag = 'Qs'; moonT3.loads[0].tag = 'S3'; moonT4.loads[0].tag = 'W4';
    // The LEFT limb: from the far cloud of that same arm a long wire comes back under the rod to its left, tipped up
    // toward the lens, and from its hill the lower tiers step away down the window's light (each hung a little
    // further along the beam and a little lower than the piece it hangs from, so it wears that piece's shadow).
    // Seen from over the rod this is the sea and the hills falling away beneath the beam.
    const limb = (par, depth, sr, a, rise, kinds, tag, o = {}) => {
      const n = armTo(1, depth, par, [par.x, par.z], bxz(sr[0], sr[1]), a, rise, kinds, { tp: 3, tl: [2, 2], ...o });
      n.loads[0].tag = tag + 'a'; n.loads[1].tag = tag + 'b';
      return n;
    };
    const LL = {};
    LL.L1 = limb(pA2, 3, [-96, -34], 56, 72, [['cloud', 2, 35], ['cloud', 0, 22]], 'L1');
    LL.L2 = limb(LL.L1.loads[1], 4, [-44, -15], 22, 29, [['wave', 0], ['hill', 2, 0.75]], 'L2', { tip: 0.62 });
    LL.L3 = limb(LL.L2.loads[1], 5, [-2, -40], 2, 16, [['boat', 1, 0.8], ['wave', 1, 0.8]], 'L3');
    LL.L4 = limb(LL.L2.loads[0], 5, [-126, -64], 12, 8, [['wave', 1], ['boat', 0]], 'L4', { tl: [34, 2] });
    LL.L5 = limb(LL.L3.loads[1], 5, [20, -54], 6, 11, [['boat', 0], ['hill', 1]], 'L5', { tl: [46, 2] });
    LL.L6 = limb(LL.L3.loads[0], 6, [-30, -48], 5, -18, [['cloud', 0, 22], ['boat', 1]], 'L6', { tl: [34, 2] });
    LL.L7 = limb(LL.L5.loads[1], 5, [25, -105], 12, 9, [['boat', 0], ['swallow', 1]], 'L7');
    // ... and reaches on, past the sun, on both sides of it. On the left a cloud hangs low beside the sun pass: the
    // foreground of the red face. On the right, from the boat, a long wire runs back to a cloud beyond the sun's end of
    // the beam, and from that cloud a last one hangs up the window's light from the disc: its shadow climbs the red
    // face as the moon's half rises and the sun's sinks. Every wire stays outside the disc's turning circle.
    LL.L8 = limb(LL.L4.loads[1], 6, [-225, -86], 14, 50, [['wave', 0], ['cloud', 1, 52]], 'L8');
    // (at night the beam starts half tipped and the moon's half rides 90 m higher: this cloud would stand across the
    // sun's disc from the entry, so its wire rides tipped down instead)
    LL.R9 = limb(pB4, 6, [-290, 56], 16, hourName === 'night' ? -34 : 27, [['wave', 1], ['cloud', 3, 35]], 'R9');
    LL.R10 = limb(LL.R9.loads[1], 6, [-303, -7], 12, hourName === 'night' ? 28 : 15, [['wave', 0], ['cloud', 0, 35]], 'R10');
    const pF = LL.L8.loads[1], pK9 = LL.R10.loads[1];
    pF.leaf = true; pK9.leaf = true; LL.R10.loads[0].leaf = true; LL.R9.loads[0].leaf = true;
    for (const k in LL) for (const q of LL[k].loads) q.limb = 1;
    // ---- THE GALLERY: the sun's tree comes down both sides of the flight (u 0.14 to 0.45). Two garlands of arms, one
    // to the right of the path and one to the left, each arm hung from the lower edge of the piece before it and riding
    // tipped up toward its far load, so the pieces of the near tier pass 25 to 45 m off at the height of the lens, a
    // fifth to a third of the frame wide. Their far loads are fertile: waves and boats are hung under them by the
    // seeded growth, each in the long shadow of a piece already hung where one can be found.
    // gal(parent, z, lat, dy, a, kinds): the far load hangs over the point `lat` metres to the left of the path at z,
    // its middle dy metres above the lens as the lens comes within 55 m of it; the rise of the arm follows from that.
    const uAtZ = (z) => { let bi = 0, bd = 1e9; for (let i = 0; i <= NS; i++) { const d = Math.abs(pathS[i].z - z); if (d < bd) { bd = d; bi = i; } } return bi; };
    const GAL = [], LH = [0.51, -0.27, 0.815];                    // the window's light while the lens is among them
    // unhang(arms): take arms down again (last hung first); their numbers go back into the box for the rack
    const freeIds = [];
    const unhang = (ns) => { for (const n of ns) { nodes.splice(nodes.indexOf(n), 1); for (const q of n.loads) { pieces.splice(pieces.indexOf(q), 1); q.S.count--; freeIds.push(q.id); } if (n.parent) n.parent.child = null; } };
    // o.under = [A, t]: instead, the far load hangs t metres down the window's light from the piece A, so it wears
    // A's shadow (same tree: they sink or rise together)
    const gal = (par, z, lat, dy, a, kinds0, tag, o = {}) => {
      // (the counterweight of a garland arm is a small white cloud, not one more blue strip: the near tier stays legible)
      const kinds = [kinds0[0][0] === 'wave' ? ['cloud', 0, 22] : kinds0[0], kinds0[1]];
      const S1 = getShape(...kinds[1]), tp = o.tp ?? 3, tl = o.tl ?? [2, 2], A = o.under && o.under[0], t = o.under && o.under[1];
      const to = o.to || (A ? [A.x + LH[0] * t, A.z + LH[2] * t] : [pxAt(z) + lat, z]), i = o.ui ?? uAtZ(to[1] - 40);
      const want = A ? A.dropC - LH[1] * t : (par.tree ? moonB[i] : sunB[i]) - pathS[i].y - dy;
      const rise = par.dropC - par.S.sh.bot + tp + tl[1] + S1.sh.top - want;
      const n = armTo(par.tree, o.depth ?? 4, par, [par.x, par.z], to, a, rise, kinds, { tp, tl, tip: o.tip });
      n.loads[0].tag = tag + 'a'; n.loads[1].tag = tag + 'b'; n.loads[0].leaf = true; n.loads[0].gal = 1; n.loads[1].gal = 1; n.gal = { rise, i };
      GAL.push(n);
      return n;
    };
    pL.leaf = false; pH5.leaf = false; pK9.leaf = false; pL.tag = 'L'; pH5.tag = 'H5'; pM.tag = 'M'; pE.tag = 'E'; T3.loads[0].tag = 'K3'; pK9.tag = 'K9';
    // left garland (the sun's tree): a hill out to the left before the swallow, a cloud beyond it, a hill in that
    // cloud's shadow, and a last cloud close on the left as the sun begins to turn
    const GL0 = gal(T6.loads[0], -345, 44, -4, 44, [['boat', 0], ['hill', 0]], 'GL0');   // (its boat hangs back abeam of the entry, out of the first frame)
    const GL1 = gal(pL, -278, 38, -5, 6, [['wave', 0], ['cloud', 1, 22]], 'GL1', { tl: [40, 2] });
    const GL2 = gal(GL1.loads[1], 0, 0, 0, 14, [['boat', 1], ['hill', 2]], 'GL2', { under: [GL1.loads[1], 14] });
    const GL3 = gal(GL2.loads[1], -95, 44, 6, 14, [['wave', 1], ['cloud', 3, 35]], 'GL3', { tip: 0.62 });
    GL3.loads[1].early = 0.34;                                   // (it rides high on the left as the whole sun comes into view, already cream and orange)
    // and from that hill's boat a green hill rides up close on the left as the moth's cloud sinks (u 0.32 to 0.37)
    const GL4 = gal(GL2.loads[0], -170, 48, 8, 12, [['wave', 0], ['hill', 0, 0.7]], 'GL4');
    // a boat comes up close on the left as the whole sun shows (u 0.43): hull and sail whole, face on, a fifth of the frame
    const GB = gal(GL4.loads[1], 0, 0, 27, 12, [['wave', 0], ['boat', 1, 1.5]], 'GB', { to: [0, -104], ui: Math.round(0.43 * NS), tip: 0.82 });
    GB.loads[1].leaf = true; GB.loads[1].early = 0.2;
    // beside the run over the rod (u 0.70): on the left a cloud at the height of the lens and, 30 m down the window's
    // light from it, a hill that wears its shadow; on the right a boat that has come up from the hill beside the beam
    if (hourName === 'golden' || hourName === 'night') {
      const uiR = Math.round(0.7 * NS);
      const LA = gal(LL.L4.loads[1], 0, 0, 6, 12, [['wave', 0], ['cloud', 0, 30]], 'LA', { to: bxz(-158, -18), ui: uiR, depth: 5, tl: [30, 2], tip: 0.75 });
      const LB = gal(LA.loads[1], 0, 0, 0, 10, [['wave', 1], ['hill', 1]], 'LB', { under: [LA.loads[1], 40], depth: 6 });
      const RA = gal(pP2, 0, 0, -18, 10, [['wave', 0], ['boat', 1, 1.8]], 'RA', { to: bxz(-148, 58), ui: Math.round(0.745 * NS), depth: 6 });
      LA.loads[1].leaf = LB.loads[1].leaf = RA.loads[1].leaf = true;
      LA.loads[1].early = 0.5; LB.loads[1].early = 0.56; RA.loads[1].early = 0.52;
      unhang([LB]);                                                // (the hill under that cloud was met edge-on from above at u 0.79: laid out, and taken down)     // turned to their evening faces before the lens is over the rod
    }
    // right garland, first half (the sun's tree), from the cloud that balances the edge cloud's arm: a hill out to
    // the right and a cloud nearer the flight in that hill's shadow (the first fifth of the flight)
    // (This pair hung low on the right through the first fifth of the flight, in front of the far rows, and its cloud
    // was cut by the frame's corner at u 0.25. It is laid out as before, so that every later arm keeps its place and
    // its numbers, and then taken down again.)
    const GR1 = gal(T3.loads[0], -330, -54, -14, 14, [['wave', 1], ['hill', 1]], 'GR1');
    const GR2 = gal(GR1.loads[1], 0, 0, 0, 14, [['boat', 0], ['cloud', 3, 35]], 'GR2', { under: [GR1.loads[1], 45] });
    unhang([GR2, GR1]);
    // right garland, second half: the MOON's tree reaches this far. From the cloud beyond the sun a garland comes back
    // south along the right of the flight; it hangs low at the entry (clear of the sun's disc) and RISES to the lens
    // (at dawn the moon's half SINKS through the flight: the garland would hang far overhead, so it is not hung)
    // the last picture's lower right: from the swallow beside the run a long wire reaches past the ring to a big cloud
    // that rides low on the right of the last straight, in front of the two that step back toward the crescent
    if (hourName === 'golden' || hourName === 'night') {
      const NR = gal(moonT3.loads[0], 0, 0, -10, 14, [['wave', 0], ['cloud', 1, 48]], 'NR', { to: bxz(92, 22), ui: Math.round(0.94 * NS), depth: 3 });
      NR.loads[1].leaf = true;
    }
    if (hourName === 'golden') {   // (by day and at night this garland would cross the sun's disc near u 0.4)
      const MR1 = gal(pK9, -124, -36, 3, 14, [['wave', 0], ['hill', 0]], 'MR1');
      const MR2 = gal(MR1.loads[1], -176, -78, 8, 14, [['boat', 0], ['cloud', 2, 35]], 'MR2');
      // (the swallow that hung on from here left the frame by its right edge at u 0.3 and 0.34: laid out, and taken down)
      unhang([gal(MR2.loads[1], -236, -74, -16, 14, [['wave', 1], ['swallow', 1]], 'MR3')]);
      // (seventh pass: its hill rose in front of the sun's right rim as the disc began to turn, u 0.43 to 0.5, and its
      // slivers and wires stood in the rack from the entry: the whole garland is laid out, and taken down)
      unhang([MR2, MR1]);
    }
    // (seventh pass: the hill before the left-hand swallow stood in the rack from the entry and was cut by the left
    // edge at u 0.2: laid out, and taken down)
    unhang([GL0]);
    await ctx.yield();
    // ---- THE FAR TREES. Under the big cloud that balances the MOON's authored limb hangs its far tree, grown by
    // seed and cut large: rows stepping down, one kind and one pot to a row (clouds, swallows, hills, waves), each
    // arm long enough to leave rose between its loads; its rows turn after the sun's. (The sun's far tree is the
    // rack, authored below: the same growth is run for it once, and taken down, to keep the seed's draws.)
    const TIERS = [null, null,
      { kind: 'cloud', n: 4, size: 54, arm: 190, tp: 14, tl: 8 }, { kind: 'swallow', n: 2, size: 1.9, arm: 150, tp: 10, tl: 5 },
      { kind: 'hill', n: 3, size: 1.9, arm: 128, tp: 10, tl: 8 }, { kind: 'wave', n: 2, size: 2, arm: 110, tp: 10, tl: 8 },
      { kind: 'boat', n: 2, size: 2.5, arm: 84, tp: 10, tl: 6 }];
    const TN = [0, 0, 1, 2, 3, 3, 3];
    const growTiers = async (root) => {
      let row = [root];
      // (the moon's far tree is 1,000 m from the entry: four rows of two arms, cut half as large again)
      const big = root.tree ? 1.5 : 1;
      for (let d = 2; d <= (root.tree ? 5 : 6); d++) {
        const T = TIERS[d], want0 = root.tree ? 0 : d >= 5 ? clamp(Math.round(TN[d] * density * detail), 2, 4) : TN[d];
        const cand = row.slice(), next = [];
        // (the seed's density is read off the moon's far tree: one, two or three arms in each of its two lowest rows)
        const wantM = d >= 4 ? clamp(Math.round(2 * density * detail), 1, 3) : Math.min(2, TN[d]);
        for (let i = cand.length - 1; i > 0; i--) { const j = trng.int(0, i), t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
        for (const p of cand) {
          if (next.length >= (root.tree ? wantM : want0) * 2) break;
          const kinds = [0, 1].map(() => [T.kind, trng.int(0, T.n - 1), T.size * big]);
          const n = addArm(root.tree, d, p, { len: T.arm * big * trng.range(0.93, 1.07), tp: T.tp * big, tl: [T.tl * trng.range(0.85, 1.15), T.tl * trng.range(0.85, 1.15)], kinds, tier: next });
          if (n) { n.tAt = (root.tree === 0 ? 0.2 : 0.36) + 0.055 * (d - 2); for (const q of n.loads) { q.tier = d; next.push(q); } }
          await ctx.yield();
        }
        row = next;
      }
    };
    T0.loads[0].tag = 'A';
    // (the sun's far tree was once grown by seed like the moon's: that growth is still run, and then taken down again,
    // so the moon's far tree keeps the very arms, ids and turns it has always had)
    const dn0 = nodes.length;
    await growTiers(T0.loads[0]);
    const dn1 = nodes.length;
    await growTiers(moonT1.loads[0]);
    unhang(nodes.slice(dn0, dn1).reverse());
    // ---- THE RACK: the sun's far tree, hung flat like a curtain across the line of the entry, so that it is seen
    // BROADSIDE from the first frame to the moth: under the cloud A two clouds and under those four more (a bank of
    // six), then four swallows, four hills, four waves, four boats. One kind and one pot to a row, a slot of 100 m to
    // a piece so rose shows between neighbours, every arm a short level bar in the rose between its row and the row
    // above, no wire across a piece. Each row makes its half-turn in turn (u 0.2 to 0.45, clouds first, boats last):
    // the day drains from the top.
    const RK = 90, rack = [];
    const rackArm = (par, d, half, kinds, pitch, lean, off = 0) => {
      const S0 = getShape(...kinds[0]), S1 = getShape(...kinds[1]), room = pitch + par.S.sh.bot, tp = Math.max(4, (room - Math.max(S0.sh.top, S1.sh.top)) * 0.5);
      const n = addArm(0, d, par, { auth: true, yaw: lean, a: half * (0.96 - off), b: half * (1.04 + off), tp, tl: [Math.max(4, room - S0.sh.top - tp), Math.max(4, room - S1.sh.top - tp)], kinds });
      n.tAt = 0.2 + 0.045 * (d - 2); n.rack = 1;
      for (const q of n.loads) { q.tier = d; q.rack = 1; q.sw = 0.3; q.yaw0 = Math.PI + (q.end ? 0.12 : -0.1); rack.push(q); }
      return n.loads;
    };
    const two = (pa, pb, d, k, ka, kb, pitch) => [...rackArm(pa, d, RK / 2, [[k, ka[0], ka[2]], [k, ka[1], ka[2]]], pitch, d % 2 ? -0.2 : 0.17), ...rackArm(pb, d, RK / 2, [[k, kb[0], kb[2]], [k, kb[1], kb[2]]], pitch, d % 2 ? 0.17 : -0.2)];
    const rC = rackArm(T0.loads[0], 2, RK, [['cloud', 0, 62], ['cloud', 3, 62]], 22, 0.1, 0.3);
    const rD = two(rC[0], rC[1], 3, 'cloud', [2, 0, 62], [3, 2, 62], 22);
    await ctx.yield();
    const rS = two(rD[0], rD[2], 4, 'swallow', [0, 1, 1.45], [1, 0, 1.45], 28);
    const rH = two(rS[1], rS[3], 5, 'hill', [0, 1, 1.65], [2, 0, 1.65], 28);
    await ctx.yield();
    const rW = two(rH[0], rH[2], 6, 'wave', [0, 1, 1.95], [1, 0, 1.95], 24);
    two(rW[1], rW[3], 7, 'boat', [0, 1, 2.2], [1, 0, 2.2], 24);
    for (const q of rack) q.id = freeIds.length ? freeIds.shift() : -1;
    let nPid = 0;
    for (const q of pieces) nPid = Math.max(nPid, q.id + 1);
    for (const q of rack) if (q.id < 0) q.id = nPid++;
    await ctx.yield();
    // ---- THE RING'S CHARMS. The ring itself is plain brass and never moves. From two points of its lower rim the maker
    // hung two small arms on linen thread, each balanced like every other arm of the sky: one loop, two loads (a wave
    // and a boat on the left, a cloud and a swallow on the right). They see-saw and turn a little; the ring does not.
    const upR = V(0, 1, 0).addScaledVector(axis, -axis.y).normalize(), rightR = V(0, 0, 0).crossVectors(upR, axis).normalize();
    const charms = [];
    for (const [phi, tp, a, b, kinds, tl] of [[-52, 3, 7, 5.5, [['wave', 1, 0.3], ['boat', 1, 0.42]], [2, 4]], [52, 3, 5.5, 7, [['cloud', 2, 11], ['swallow', 0, 0.3]], [4, 2]]]) {
      const rim = ring.clone().addScaledVector(rightR, (RING_R + 0.3) * Math.sin(phi * DEG)).addScaledVector(upR, -(RING_R + 0.3) * Math.cos(phi * DEG)).addScaledVector(axis, -1.6);
      // (the rim is the hanging point: it stands in for the piece an arm hangs from, and never moves)
      const hang = { px: rim.x, py: rim.y, pz: rim.z, x: rim.x, z: rim.z, dropC: 0, S: { sh: { bot: 0 } }, node: { cd: 0, yaw: 0, special: 0 }, child: null };
      const n = addArm(1, 6, hang, { auth: true, tp, yaw: Math.atan2(rightR.z, rightR.x), a, b, kinds, tl });
      n.tAt = 0.86;
      for (const q of n.loads) { q.id = nPid++; q.charm = 1; q.thinK = 0.45; charms.push(q); }
    }
    // ---- meshes: every painted slab from the one ply material, every wire from the one brass material --------------
    const nA = nodes.length, nP = nPid;                             // (ids are knot slots: one past the highest in use)
    for (const S of shapes.values()) {
      if (!S.count) continue;
      S.mesh = style.pieceMesh(style.slab(S.sh.outline, S.sh.slab), S.count);
      S.next = 0; scene.add(S.mesh);
      await ctx.yield();
    }
    for (const p of pieces) {
      p.inst = p.S.next++;
      style.paint(p.S.mesh, p.inst, { ...p.S.sh.paint, ...(p.rack && p.kind === 'swallow' && cast.geese ? { day: pal.bird } : {}), seed: (p.S.sh.paint.seed || 0) + (p.id % 23) * 0.61 });
      const base = (p.tree === 0 ? 0.15 : 0.25) + 0.085 * p.depth + (p.id % 5) * 0.012;
      p.turnAt = p.tier ? p.node.tAt + (p.id % 3) * 0.012 : base; p.turnW = p.tier ? 0.06 : 0.075;
    }
    for (const p of pieces) if (p.early) p.turnAt = p.early;
    // the pieces that hang round the entry show their painted faces to the first frame (each is aimed at the entry
    // point and sways little on its thread): the short-hung swallows turn to indigo as the lens goes between them
    const aim = (q, off = 0, sw = 0.3) => { q.yaw0 = Math.atan2(pathS[0].x - q.x, pathS[0].z + 12 - q.z) + off; q.sw = sw; };
    for (const p of T4.loads) { p.turnAt = 0.028; p.turnW = 0.085; aim(p, p.end ? 0.12 : -0.1); }
    aim(T6.loads[0], 0.1); aim(pC1, 0, 0.35); aim(pS, 0.1, 0.35); aim(T7.loads[0], 0.1);
    pC1.turnAt = 0.29; pS.turnAt = 0.3;                           // (turned and settled before the night's flight begins)
    pE.turnAt = 0.135; pE.turnW = 0.15; pE.yaw0 = Math.PI - 0.35; pE.sw = 0.35;
    pM.turnAt = 0.14; pM.yaw0 = Math.PI - 0.2; pM.sw = 0.45; pL.turnAt = 0.05; pL.turnW = 0.08; pL.sw = 0.25; pH5.turnAt = 0.36; pH5.turnW = 0.09; pH5.yaw0 = Math.PI - 0.35; pX.turnAt = 0.3; pX.yaw0 = Math.PI - 0.25; pX.sw = 0.2;
    // the moon's authored limb has turned to its evening faces by the time the lens comes up beside it; the hill turns as we pass
    pQ2.turnAt = 0.4; pQ2.yaw0 = Math.PI + 0.2; moonTq.loads[0].turnAt = 0.45;
    pQ1.turnAt = 0.4; pP2.turnAt = 0.5; pH3.turnAt = 0.6; pH3.turnW = 0.09; pB4.turnAt = 0.6; moonT4.loads[0].turnAt = 0.62; moonT3.loads[0].turnAt = 0.56;
    pQ1.yaw0 = Math.PI + 0.35; pP2.yaw0 = Math.PI + 0.55; pH3.yaw0 = Math.PI + 0.5; pB4.yaw0 = Math.PI + 0.45;
    // the left limb turns tier by tier as the lens comes over the rod (caught mid-turn from blue to indigo); the two
    // clouds by the sun have turned to cream and orange before the red face shows
    for (const k in LL) for (const q of LL[k].loads) { q.turnAt = 0.6 + 0.022 * (q.id % 9); q.turnW = 0.1; }
    LL.L1.loads[1].turnAt = 0.56; LL.L2.loads[1].turnAt = 0.6;
    pF.turnAt = 0.36; pK9.turnAt = 0.4; pF.yaw0 = Math.PI + 0.3; pF.sw = 0.4; pF.late = [0.54, 0.6, 1.27];
    // (it turns edge-on to the lens as the lens goes by: never a slab at the frame's edge)
    pK9.yaw0 = Math.PI + 0.56; LL.R9.loads[1].turnAt = 0.4;
    // the last picture: the pieces round the ring show their evening faces to the last straight (the lens looks along
    // the ring's axis there, 57 degrees round from the entry's heading), and sway less; the hill that passes close on
    // the left makes a slow quarter-turn more, so it is not met edge-on
    for (const [q, y0] of [[pQ2, 1.0], [pQ1, 0.85], [LL.L7.loads[1], 1.0], [LL.L7.loads[0], 0.8], [LL.L3.loads[1], 1.15], [LL.L5.loads[1], 0.7]]) { q.yaw0 = Math.PI + y0; q.sw = 0.5; }
    for (const q of pieces) if (q.tag === 'NRb') { q.yaw0 = Math.PI + 0.9; q.sw = 0.5; }
    LL.L6.loads[0].thinK = 0.5; LL.L5.loads[1].sw = 0.3; LL.L5.loads[1].yaw0 = Math.PI + 1.05;
    LL.L2.loads[1].late = [0.8, 0.875, 1.4];
    // (abeam: the u at which the lens is abeam of a piece)
    const abeam = (q) => { let bi = 0, bd = 1e9; for (let i = 0; i <= NS; i++) { const d = Math.hypot(pathS[i].x - q.x, pathS[i].z - q.z); if (d < bd) { bd = d; bi = i; } } return bi / NS; };
    // a garland piece shows its painted face to the lens as the lens comes up to it (aimed at where the lens is 70 m
    // short of it), and sways little: it is never met edge-on as a striped plank
    const lensAt = (u) => pathS[clamp(Math.round(u * NS), 0, NS)];
    const faceTo = (q, u, sw = 0.35) => { const P = lensAt(u); q.yaw0 = Math.atan2(P.x - q.x, P.z - q.z); q.sw = sw; };
    for (const q of pieces) if (q.gal && (q.tree === 0 || /^MR/.test(q.tag))) faceTo(q, abeam(q) - 0.08);
    // the stills' large pieces look at the lens where it meets them: the navy swallow at u 0.25, the small cloud
    // under the bird at 0.08, the boat at 0.43, the moth's cloud at 0.34
    faceTo(pL, 0.25, 0.22); faceTo(T3.loads[0], 0.08, 0.3); faceTo(pM, 0.34, 0.3);
    for (const q of pieces) if (q.tag === 'GBb') faceTo(q, 0.43, 0.25);
    // THE BIRD AND ITS SHADOW (u 0.05 to 0.12): the tall cloud looks at the lens of u 0.08; the climbing swallow, 42 m
    // up the window's light from it, stands turned between the lens and the window (30 degrees off the line of sight),
    // so the lens sees its blue face and the cloud wears its whole outline, two wings and a forked tail
    faceTo(pE, 0.08, 0.2);
    { const P = lensAt(0.08), lx = P.x - pX.x, lz = P.z - pX.z, ll = Math.hypot(lx, lz) || 1; pX.yaw0 = Math.atan2(0.866 * lx / ll - 0.5 * 0.53, 0.866 * lz / ll - 0.5 * 0.85); pX.sw = 0.12; }
    // the moon's right limb is met as the lens crosses the rod (u 0.745): boat, hill and cloud look at it there
    for (const q of pieces) if (q.tag === 'RAb' || q.tag === 'H3' || q.tag === 'P2') faceTo(q, 0.745, 0.3); else if (q.tag === 'L1b') faceTo(q, 0.79, 0.4);
    // the cream cloud left of the rod at u 0.70 has turned by then and shows its painted face in every seed
    for (const q of pieces) if (q.tag === 'LAb') { faceTo(q, 0.7, 0.3); q.turnAt = Math.min(q.turnAt, 0.58); }
    // the boats that pass on the left of the last climb (u 0.84 to 0.9) have turned by then and face it
    for (const q of [LL.L3.loads[0], LL.L6.loads[1], LL.L5.loads[0]]) { faceTo(q, 0.875, 0.4); q.turnAt = Math.min(q.turnAt, 0.7); }
    // THE CORRIDOR OPENS: a piece the lens will not reach for a long while hangs edge-on to the lens (a sliver of ply,
    // as the far leaves of a mobile are), and swings its painted face round as the lens comes within a couple of
    // hundred metres. From the entry the near tier is a few faces and the rack is seen clear beneath it; in flight the
    // turning runs ahead of the lens down both garlands, and the moon's whole limb opens while the moth lands.
    // (uP: where the lens is abeam of the piece. arr = [u it begins to open, u it is open, which edge-on way round].)
    for (const q of pieces) {
      if (q.rack) continue;
      const uP = abeam(q);
      if (q.tree === 0) { if (uP >= 0.28 && uP < (q.gal ? 0.56 : 0.5)) q.arr = [Math.max(0, uP - 0.2), uP - 0.12, 0]; }
      else q.arr = q.gal && uP < 0.5 ? [Math.max(0.04, uP - 0.3), Math.max(0.14, uP - 0.2), 0] : [0.2, 0.34, 0];
      if (q.arr) q.arr[2] = Math.round((q.yaw0 - Math.atan2(pathS[0].x - q.x, pathS[0].z - q.z) - Math.PI / 2) / Math.PI);
    }
    // (seventh pass: the left garland is seen end-on from the entry, a pole of sticks standing in the rack; its leaves
    // now stay shut, and a hair thin, until the lens is within about 170 m, the boat and the navy swallow too)
    const openAt = (q, u0, u1) => { if (q && q.arr) { q.arr[0] = u0; q.arr[1] = u1; } };
    for (const q of pieces) if (q.tag === 'GBb') openAt(q, 0.16, 0.24);
    openAt(pL, 0.035, 0.08); openAt(pM, 0.12, 0.2);
    pL.turnAt = 0; pL.turnW = 0.03;                              // (the left-hand swallow is navy by the time it opens, at the end of its wire)
    pX.thinK = 0.5;                                              // (the climbing swallow is cut from thinner ply)
    // THE CORRIDOR SHUTS BEHIND: a near leaf turns its edge to the lens again as the lens goes by it, and thins, so it
    // leaves the frame as a hair and never as a face or a striped plank cut by the frame's edge (dep = [from u, to u])
    const shut = (tag, u0, u1) => { for (const q of pieces) if (q.tag === tag) q.dep = [u0, u1]; };
    pC1.dep = [0.028, 0.05]; pS.dep = [0.028, 0.05]; pE.dep = [0.172, 0.2]; pF.dep = [0.535, 0.56]; T5.loads[0].dep = [0.312, 0.338];
    shut('GL1b', 0.262, 0.29); shut('GL2b', 0.262, 0.29); pL.dep = [0.264, 0.292]; shut('GL2a', 0.168, 0.198); shut('D', 0.33, 0.375); shut('L2b', 0.878, 0.902);
    shut('GL4b', 0.352, 0.38); pH5.dep = [0.35, 0.378]; shut('GBb', 0.445, 0.472); shut('GL3b', 0.445, 0.472);
    for (const q of charms) { q.arr = null; q.turnAt = 0; q.turnW = 0.02; q.yaw0 = Math.atan2(axis.x, axis.z) - Math.PI; q.sw = 0.5; }
    const arms = style.wireMesh(style.tubeGeo(), nA, style.farWireMaterial);
    // a light version of the maker's twisted loop (eye in XY, neck down -Y): three on every arm
    const LR = 1.15, LW = 0.26, lp = [];
    for (let k = 0; k < 3; k++) lp.push(V(LW * Math.cos(k * 2.1), -LR - 1.6 + k * 0.55, LW * Math.sin(k * 2.1)));
    for (let k = 0; k <= 11; k++) { const th = -Math.PI / 2 + 0.25 + (k / 11) * (Math.PI * 2 - 0.5); lp.push(V(LR * Math.cos(th), LR * Math.sin(th), 0)); }
    for (let k = 2; k >= 0; k--) lp.push(V(-LW * Math.cos(k * 2.1), -LR - 1.6 + k * 0.55, -LW * Math.sin(k * 2.1)));
    const loops = style.wireMesh(style.wireBuilder().sweep(lp, LW, 4).geo(), nA * 3, style.farWireMaterial);
    const nRain = cast.rain ? pieces.filter((p) => p.kind === 'cloud').length * 3 : 0;
    const threads = style.threadMesh(nA * 3 + nRain);
    const knots = style.wireMesh(style.knotGeo(1 + (treeSeed % 97)), nP + nA, style.linenMaterial, false);
    scene.add(arms, loops, threads, knots);
    // (a knot slot whose number no piece wears is tied to nothing: it is given no size)
    { const used = new Set(pieces.map((q) => q.id)), none = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < nP; i++) if (!used.has(i)) knots.setMatrixAt(i, none); }
    await ctx.yield();
    // rain (a seeded cast): three blue drops on threads under every cloud
    let drops = null;
    if (nRain) {
      const dp = [];
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; dp.push([1.9 * Math.sin(a) * Math.sin(a / 2), 2.8 * Math.cos(a)]); }
      drops = style.pieceMesh(style.slab(dp.reverse(), { long: 'y', seed: 77, inset: 0.6, wobble: 0.15 }), nRain);
      for (let i = 0; i < nRain; i++) style.paint(drops, i, { day: pal.bird, eve: pal.night, seed: i * 0.7 });
      scene.add(drops);
    }
    // ---- THE ROOM IS A PLACE: one shader on the dome that follows the lens. The view ray is carried to the inside of
    // a box (far wall z 1300, side walls, a ceiling 900 up, no floor) and painted as the maker's room: every surface
    // the pot colour in ONE flat value of its own (the wall that faces the window, the side walls a step down, the
    // ceiling another), a cornice, a picture rail and a dado rail as two flat strips each, a line down each corner,
    // the brush of the wall in two tones of the pot, deeper rose under the dado (there is no floor). On the walls lie
    // the shadows of the mobile's own pieces, each ONE soft shape hung from its arm (the pot times one tint), see-sawing
    // slowly; on the far wall the window's patch with its bars and the drawn shadow of the whole mobile.
    const ROOM = { xw: -1250, xe: 1450, zb: -2300, zf: 1300, cy: 900 };
    const wallU = { ...style.U, uRoom: { value: pal.room }, uRoomEve: { value: pal.roomEve }, uPatch: { value: pal.patch },
      uTiltR: { value: 0 }, uSunW: { value: 1 }, uPatchC: { value: new THREE.Vector2(-150, 300) }, uShOff: { value: new THREE.Vector2(40, -40) },
      uBox: { value: new THREE.Vector4(ROOM.xw, ROOM.xe, ROOM.zb, ROOM.zf) }, uCeil: { value: ROOM.cy } };
    const roomFrag = /* glsl */`
      uniform vec3 uRoom, uRoomEve, uPatch, uLightDir; uniform vec2 uPatchC, uShOff; uniform vec4 uBox;
      uniform float uEve, uTime, uShadowOn, uTiltR, uSunW, uCeil; varying vec3 vDir;
      float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.)); }
      float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      // the maker's silhouettes as black paper: cloud (three lobes on a flat bottom), swallow, boat (hull, one sail), hill
      float sCloud(vec2 c){ return max(min(min(length(c - vec2(-30., 2.)) - 20., length(c - vec2(0., 10.)) - 27.), length(c - vec2(30., 1.)) - 19.), -10. - c.y); }
      float sBird(vec2 c){ c.y = abs(c.y); return min(min(sdSeg(c, vec2(-20., 0.), vec2(22., 0.)) - 6., sdSeg(c, vec2(6., 0.), vec2(-14., 34.)) - 4.6), sdSeg(c, vec2(-20., 0.), vec2(-36., 8.)) - 2.6); }
      float sBoat(vec2 c){ return min(sdSeg(c, vec2(-26., 0.), vec2(26., 0.)) - 6., max(max(-4. - c.x, 9. - c.y), dot(c - vec2(-4., 54.), vec2(0.871, 0.492)))); }
      float sHill(vec2 c){ return max(min(length(c - vec2(-18., -6.)) - 34., length(c - vec2(22., -14.)) - 37.), -c.y - 2.); }
      float sKind(vec2 c, float k){ return k < 0.5 ? sCloud(c) : k < 1.5 ? sBird(c) : k < 2.5 ? sBoat(c + vec2(0., 24.)) : sHill(c + vec2(0., 12.)); }
      // the shadow of one arm with its two loads: pivot p, half-length L, see-saw angle, scale s of the loads
      float armSh(vec2 a, vec2 p, float L, float ang, float s, vec2 kind){
        vec2 d = vec2(cos(ang), sin(ang)), l = p - d * L, r = p + d * L * 0.78;
        vec2 cl = l - vec2(0., 46. * s), cr = r - vec2(0., 58. * s);
        float sd = min(sdSeg(a, l, r) - 4.5, min(min(sdSeg(a, l, cl), sdSeg(a, r, cr)), sdSeg(a, p, p + vec2(0., 2000.))) - 3.);
        return min(sd, min(sKind((a - cl) / s, kind.x), sKind((a - cr) / s, kind.y)) * s);
      }
      // the mobile's shadow in the window's patch, DRAWN as the maker would cut it from black paper and seen broadside
      // (the true one from this window is the whole sky stacked end-on: a blot): rod, ring and hook, the scalloped sun
      // on its thread, the crescent, and under each an arm with two loads. It tips with the beam (uTiltR), the sun's
      // disc narrows as it turns (uSunW), the small arms see-saw. One tint, one soft edge.
      float mobSh(vec2 a){
        float ct = cos(uTiltR), st = sin(uTiltR), sd = 1e4;
        vec2 P = vec2(0., 96.), Es = P + vec2(-215. * ct, 215. * st), Em = P + vec2(300. * ct, -300. * st);
        sd = min(sd, sdSeg(a, Es, Em) - 4.5);
        sd = min(sd, abs(length(a - P - vec2(0., 27.)) - 19.) - 3.6);
        sd = min(sd, sdSeg(a, P + vec2(0., 46.), P + vec2(0., 92.)) - 2.2);
        sd = min(sd, max(abs(length(a - P - vec2(-9., 92.)) - 9.) - 2.6, P.y + 90. - a.y));
        vec2 Cs = Es - vec2(0., 112.), Cm = Em - vec2(0., 86.);
        sd = min(sd, sdSeg(a, Es, Cs) - 2.2); sd = min(sd, sdSeg(a, Em, Cm) - 2.2);
        vec2 qs = (a - Cs) / vec2(uSunW, 1.); float rq = length(qs), th = rq > 0.01 ? atan(qs.y, qs.x) : 0.;
        sd = min(sd, (rq - 64. - 4. * cos(24. * th)) * mix(uSunW, 1., abs(sin(th))));
        vec2 m2 = a - Cm;
        sd = min(sd, max(length(m2) - 46., 40. - length(m2 - vec2(22., 10.))));
        float a1 = -0.9 * uTiltR + 0.07 * sin(uTime * 0.52), a2 = 0.8 * uTiltR + 0.06 * sin(uTime * 0.43 + 2.);
        vec2 Q1 = Cs - vec2(0., 104.), d1 = vec2(cos(a1), sin(a1)), Q2 = Cm - vec2(0., 84.), d2 = vec2(cos(a2), sin(a2));
        vec2 L1 = Q1 - d1 * 105., R1 = Q1 + d1 * 125., L2 = Q2 - d2 * 110., R2 = Q2 + d2 * 85.;
        sd = min(sd, min(sdSeg(a, Cs, Q1), sdSeg(a, Cm, Q2)) - 2.);
        sd = min(sd, min(sdSeg(a, L1, R1), sdSeg(a, L2, R2)) - 3.);
        sd = min(sd, min(min(sdSeg(a, L1, L1 - vec2(0., 20.)), sdSeg(a, R1, R1 - vec2(0., 16.))), min(sdSeg(a, L2, L2 - vec2(0., 16.)), sdSeg(a, R2, R2 - vec2(0., 20.)))) - 1.8);
        sd = min(sd, sCloud(a - (L1 - vec2(0., 48.))));
        sd = min(sd, sBird(a - (R1 - vec2(0., 50.))));
        sd = min(sd, sBoat(a - (L2 - vec2(0., 68.))));
        return min(sd, sHill(a - (R2 - vec2(0., 52.))));
      }
      void main(){
        vec3 d = vDir / max(length(vDir), 1e-4), o = cameraPosition;
        vec3 base = mix(uRoom, uRoomEve, uEve);
        float tx = abs((d.x > 0. ? uBox.y : uBox.x) - o.x) / max(abs(d.x), 1e-4);
        float tz = abs((d.z > 0. ? uBox.w : uBox.z) - o.z) / max(abs(d.z), 1e-4);
        float ty = d.y > 0. ? abs(uCeil - o.y) / max(d.y, 1e-4) : 1e9;
        float t = min(min(tx, tz), ty);
        vec3 h = o + d * t;
        float soft = max(3., t * 0.0022);                               // the room is out of focus: no hard edge in it
        float see = 0.05 * sin(uTime * 0.31), see2 = 0.06 * sin(uTime * 0.27 + 1.7), tip = 0.5 * uTiltR;
        float tone = 1., rf = 1., sd = 1e4, far = 0.;
        vec2 a = h.xz, nb = h.xz;
        vec3 deep = vec3(1.);
        if (ty <= min(tx, tz)) {                                        // the ceiling
          tone = 0.86;
          float cd = min(min(h.x - uBox.x, uBox.y - h.x), min(h.z - uBox.z, uBox.w - h.z));
          rf *= mix(0.86, 1., smoothstep(0., 34. + soft, cd));
        } else {
          bool zw = tz < tx;
          a = zw ? h.xy : h.zy;
          float cd = zw ? min(h.x - uBox.x, uBox.y - h.x) : min(h.z - uBox.z, uBox.w - h.z);
          if (zw && d.z > 0.) {                                         // the wall that faces the window
            far = 1.; nb = a;
            sd = min(armSh(a, vec2(560., 620.), 330., 0.06 + see - tip, 3.4, vec2(0., 1.)), armSh(a, vec2(-1010., 540.), 250., -0.05 + see2 + tip, 3., vec2(2., 3.)));
            sd = min(sd, armSh(a, vec2(1190., 360.), 190., 0.04 - see2 - tip, 2.6, vec2(1., 0.)));
          } else if (zw) { tone = 0.95; nb = a + vec2(517., 0.); }
          else if (d.x > 0.) {                                          // the side wall the light travels toward
            tone = 0.925; nb = a + vec2(1913., 0.);
            sd = min(armSh(a, vec2(420., 600.), 320., -0.05 + see + tip, 3.6, vec2(0., 2.)), armSh(a, vec2(-520., 500.), 260., 0.07 - see2 - tip, 3.2, vec2(3., 1.)));
            sd = min(sd, armSh(a, vec2(1080., 430.), 170., 0.03 + see2, 2.4, vec2(1., 3.)));
          } else {
            tone = 0.925; nb = a + vec2(3371., 0.);
            sd = min(armSh(a, vec2(520., 590.), 300., 0.05 - see - tip, 3.4, vec2(1., 0.)), armSh(a, vec2(-480., 520.), 270., -0.06 + see2 + tip, 3.2, vec2(2., 3.)));
          }
          float yR = uCeil - 210., yD = 120.;
          tone *= mix(1., 0.95, smoothstep(-soft, soft, a.y - yR));     // the frieze over the picture rail
          // each rail is a strip in light over a line of its own shadow; the cornice throws a band under the ceiling
          float lit1 = 1. - smoothstep(0., soft, abs(a.y - yR - 7.) - 7.), sh1 = 1. - smoothstep(0., soft, abs(a.y - yR + 5.) - 5.);
          float lit2 = 1. - smoothstep(0., soft, abs(a.y - yD - 7.) - 7.), sh2 = 1. - smoothstep(0., soft, abs(a.y - yD + 5.) - 5.);
          rf *= mix(1., 1.045, max(lit1, lit2)) * mix(1., 0.82, max(sh1, sh2));
          rf *= mix(0.8, 1., smoothstep(0., 2. * soft, uCeil - 40. - a.y));
          rf *= mix(0.84, 1., smoothstep(0., 10. + soft, cd));          // the line down the corner
          deep = mix(vec3(0.9, 0.8, 0.84), vec3(1.), smoothstep(-soft, soft, a.y - yD)) * mix(0.86, 1., smoothstep(-1300., 0., a.y));
        }
        // the brush of the wall: two tones of the pot, long strokes crossed by a slower weave
        float n = 0.6 * vnoise(nb * vec2(1. / 330., 1. / 46.)) + 0.4 * vnoise(nb * vec2(1. / 40., 1. / 290.) + 7.3);
        rf *= mix(1., 0.962, smoothstep(0.44, 0.56, n));
        float occ = 1. - smoothstep(-16., 20., sd);
        vec3 col = base * tone * rf * deep * mix(vec3(1.), vec3(0.85, 0.79, 0.88), occ);
        if (far > 0.5) {                                                // the window's patch, its bars, the mobile's shadow
          vec2 q = a - uPatchC; q.x += 0.42 * q.y;
          float m = (1. - smoothstep(380., 470., abs(q.x))) * (1. - smoothstep(262., 318., abs(q.y)));
          float bars = max(1. - smoothstep(10., 34., abs(q.x + 40.)), 1. - smoothstep(10., 34., abs(q.y - 70.)));
          float occP = max((1. - smoothstep(-5., 6., mobSh((a - uPatchC - uShOff) / 0.9))) * uShadowOn, occ);
          vec3 pcol = mix(uPatch, uPatch * vec3(0.96, 0.82, 0.8), uEve) * rf;
          col = mix(col, pcol, 0.8 * m * (1. - 0.3 * bars) * (1. - 0.92 * occP));
        }
        // the window itself, behind the shoulder: seen only on turning
        vec2 lh = uLightDir.xz / max(length(uLightDir.xz), 1e-3);
        float f = -(d.x * lh.x + d.z * lh.y);
        vec2 wq = vec2(d.x * lh.y - d.z * lh.x, d.y + uLightDir.y * 0.6) / max(f, 0.15);
        float win = smoothstep(0.15, 0.4, f) * (1. - smoothstep(0.2, 0.3, abs(wq.x))) * (1. - smoothstep(0.36, 0.48, abs(wq.y - 0.08)));
        float wbars = 1. - 0.28 * max(1. - smoothstep(0.012, 0.05, abs(wq.x)), 1. - smoothstep(0.012, 0.05, abs(wq.y - 0.1)));
        col = mix(col, mix(uPatch, uPatch * vec3(0.9, 0.78, 0.8), uEve) * wbars, win * 0.9);
        gl_FragColor = vec4(min(col, vec3(1.)), 1.);
      }`;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3600, 32, 16), new THREE.ShaderMaterial({
      uniforms: wallU, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: roomFrag,
    }));
    dome.renderOrder = -2; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();

    // ---- the ceiling's shadow over the hook: a real plane at the height the hook is screwed into, the room's own colour
    // at half value, feathered to nothing at its rim, so the hook and the ring stand against a darker band of ceiling
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(560, 48), new THREE.ShaderMaterial({
      uniforms: { uEve: style.U.uEve, uOn: { value: 0 }, uRoom: { value: pal.room }, uRoomEve: { value: pal.roomEve } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`uniform float uEve, uOn; uniform vec3 uRoom, uRoomEve; varying vec2 vP;
        void main(){ float r = length(vP) / 560.; gl_FragColor = vec4(mix(uRoom, uRoomEve, uEve) * 0.46, 0.8 * uOn * (1. - smoothstep(0.12, 1., r))); }`,
    }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(O.x, hero.anchors.ceilingY, O.z); ceil.renderOrder = -0.5; ceil.frustumCulled = false; scene.add(ceil);
    // the ring holds a round of paper until the next world shows through it: ONE flat colour (the room's own rose, the
    // paper the maker had), no light of its own. It faces the window, so it is in light: the pot itself, and the pot
    // times the one tint in a thin soft crescent inside the upper left of the rim (the brass ring's own shadow). It
    // thins exactly as the opening behind it opens (the opening's own reveal is read back each frame), so the shut
    // opening is never seen and nothing in the ring glows
    const PAPER_R = RING_R - 0.5;
    const paper = new THREE.Mesh(new THREE.CircleGeometry(PAPER_R, 48), new THREE.ShaderMaterial({
      uniforms: { uTint: style.U.uTint, uA: { value: 1 }, uC0: { value: pal.room } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      // The paper is the maker's too: the room's rose laid on in three laps of the brush, and on it, in the pot times
      // the one tint with one soft edge, the shadows the window throws: the upper rim's (a crescent inside the upper
      // left), the hook's stem and curl falling across the upper left quarter, and low down a thread from the curl to
      // one small arm with its two threads and one small swallow. Metres on the paper; no derivatives, no loops.
      fragmentShader: /* glsl */`uniform float uA; uniform vec3 uC0, uTint; varying vec2 vP;
        float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.)); }
        float sBird(vec2 c){ c.y = abs(c.y); return min(min(sdSeg(c, vec2(-20., 0.), vec2(22., 0.)) - 6., sdSeg(c, vec2(6., 0.), vec2(-14., 34.)) - 4.6), sdSeg(c, vec2(-20., 0.), vec2(-36., 8.)) - 2.6); }
        void main(){
          float R = ${PAPER_R.toFixed(2)}, k = R / 19.5;
          vec2 p = vP / k;                                              // drawn for a 39 m round, scaled to this one
          float sd = (19.5 - 0.3) - length(p - vec2(2.3, -1.9));        // the upper rim's own shadow
          vec2 hk = vec2(-5.4, 8.6), t = vec2(0.22, -0.975);
          sd = min(sd, sdSeg(p, vec2(-11.5, 20.5), hk + vec2(-2.5, 0.6)) - 0.5);                // the hook's stem
          sd = min(sd, max(abs(length(p - hk) - 2.5) - 0.5, p.y - hk.y - 1.0));                 // its curl
          vec2 pv = hk + vec2(0., -2.5) + t * 9.5, e1 = pv + vec2(-5.2, 0.65), e2 = pv + vec2(4.6, -0.57);
          sd = min(sd, sdSeg(p, hk + vec2(0., -2.5), pv) - 0.13);
          sd = min(sd, sdSeg(p, e1, e2) - 0.22);
          vec2 b1 = e1 + t * 2.4, c1 = b1 + vec2(1.9, -4.5);
          sd = min(sd, min(sdSeg(p, e1, b1), sdSeg(p, e2, e2 + t * 14.)) - 0.13);
          // one small swallow, hung by a wing tip
          vec2 q = (p - c1) / 0.135;
          sd = min(sd, sBird(q) * 0.135);
          float occ = 1. - smoothstep(-0.45, 0.6, sd);
          float bc = p.y + 0.1 * p.x + 0.55 * sin(p.x * 0.31 + 1.3), f = fract(bc / 12.6 + 0.37);
          float lap = 1. - 0.05 * smoothstep(0., 0.06, f) * (1. - smoothstep(0.46, 0.52, f));
          gl_FragColor = vec4(uC0 * lap * mix(vec3(1.), uTint, occ), uA); }`,
    }));
    paper.position.copy(ring).addScaledVector(axis, -0.08); paper.lookAt(tmpA.copy(ring).addScaledVector(axis, -40)); paper.renderOrder = 6; paper.frustumCulled = false; scene.add(paper);
    let revealU = null, revealTries = 0;
    await ctx.yield();

    // ---- motes: the lens is one of them; the others drift with it and catch the window's light ------------------------
    const nMote = Math.round(600 * detail * density), mp = new Float32Array(nMote * 3), ms = new Float32Array(nMote), mr = makeRng(treeSeed + 5);
    for (let i = 0; i < nMote; i++) { mp[i * 3] = mr.range(0, 96); mp[i * 3 + 1] = mr.range(0, 96); mp[i * 3 + 2] = mr.range(0, 96); ms[i] = mr(); }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3)); moteGeo.setAttribute('aSeed', new THREE.BufferAttribute(ms, 1));
    const motes = new THREE.Points(moteGeo, new THREE.ShaderMaterial({
      uniforms: { ...style.U, uColor: { value: pal.moon }, uCam: { value: V(0, 0, 0) } }, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        uniform float uTime, uViewH, uShadowOn, uShadowRange; uniform vec3 uCam; uniform sampler2D uShadowMap; uniform mat4 uShadowMat; uniform vec2 uShadeY;
        attribute float aSeed; varying float vA, vLit;
        void main(){
          vec3 p = position + vec3(sin(uTime * 0.31 + aSeed * 40.) * 3. + uTime * 0.9, sin(uTime * 0.27 + aSeed * 71.) * 2.2 - uTime * 0.5, cos(uTime * 0.29 + aSeed * 23.) * 3. + uTime * 0.6);
          p = mod(p - uCam + 48., 96.) - 48. + uCam;
          float dist = length(p - uCam);
          // dust, never a paper moon: no mote is drawn larger than 7 px of an 800 x 450 frame (1.6 % of the height)
          float px = min((0.1 + 0.16 * aSeed) * projectionMatrix[1][1] * uViewH / max(dist, 0.5), 0.0155 * uViewH);
          gl_PointSize = max(px, 1.6);
          vA = min(1., px / 1.6) * smoothstep(3.5, 7., dist) * (1. - smoothstep(34., 47., dist)) * (0.35 + 0.6 * abs(sin(uTime * (0.9 + aSeed) + aSeed * 50.)));
          vec4 s = uShadowMat * vec4(p, 1.);
          float inside = step(0.004, s.x) * step(s.x, 0.996) * step(0.004, s.y) * step(s.y, 0.996) * uShadowOn;
          vLit = 1. - inside * step(textureLod(uShadowMap, s.xy, 0.).r, s.z - 0.5 - 2.5 / max(uShadowRange, 1.));
          vLit *= 1. - smoothstep(uShadeY.x, uShadeY.y, p.y);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor, uTint; varying float vA, vLit;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float r = dot(c, c);
          gl_FragColor = vec4(uColor * mix(uTint, vec3(1.), vLit), vA * (1. - smoothstep(0.16, 0.25, r)) * (0.45 + 0.55 * vLit));
        }`,
    }));
    motes.frustumCulled = false; motes.renderOrder = 3; scene.add(motes);
    await ctx.yield();
    // ---- the moth: the only thing not made by the maker. 26 m, two pairs of dusty wings the colour of thread ----------
    const mothMat = new THREE.ShaderMaterial({
      uniforms: { ...style.U, uColor: { value: pal.thread }, uDark: { value: pal.plyDark } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec3 vWP; varying vec2 vUv; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWP = wp.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: style.GLSL + /* glsl */`
        uniform vec3 uColor, uDark; varying vec3 vWP; varying vec2 vUv;
        void main(){
          vec3 fx = dFdx(vWP), fy = dFdy(vWP), n = cross(fx, fy); n /= max(length(n), 1e-6);
          vec3 v = cameraPosition - vWP; if (dot(n, v) < 0.) n = -n;
          // a moth, drawn as plainly as the maker's birds: pale forewings with one dark bar across each and a dark tip,
          // darker hindwings each with one pale eye, a dark body and two dark feathered feelers (uv.x > 50 marks those)
          vec2 w = vec2(abs(vUv.x), vUv.y);
          float fw = max(fwidth(w.x), fwidth(w.y)) + 1e-4;
          float hind = 1. - smoothstep(-0.56 - fw, -0.56 + fw, w.y - 0.02 * w.x);
          vec3 pot = mix(uColor, mix(uColor, uDark, 0.55), hind);
          float bar = abs(w.x - 6.6 - 0.22 * w.y);
          pot = mix(pot, uDark, (1. - hind) * (1. - smoothstep(0.75 - fw, 0.75 + fw, bar)));
          pot = mix(pot, uDark, (1. - hind) * smoothstep(-fw, fw, w.x + 0.35 * w.y - 13.3));
          pot = mix(pot, uColor, hind * (1. - smoothstep(1.25 - fw, 1.25 + fw, length(w - vec2(5.6, -4.6)))));
          pot = mix(pot, uDark, step(50., vUv.x));
          float lit = smoothstep(0.0, 0.1, dot(n, -uLightDir)) * mobLit(vWP, n, 1., gl_FragCoord.xy);
          gl_FragColor = vec4(min(mobAir(mobValue(pot, lit), vWP, 1.), vec3(1.)), 1.);
        }`,
    });
    const fan = (pts, mirror) => {
      const pos = [], uv = [];
      for (let i = 1; i < pts.length - 1; i++) for (const q of [pts[0], pts[i], pts[i + 1]]) { pos.push(mirror * q[0], 0, q[1]); uv.push(mirror * q[0], q[1]); }
      return [pos, uv];
    };
    const FORE = [[0.8, 2], [6, 7.5], [11.5, 8.5], [13, 6], [11, 1.5], [5, -0.5], [0.8, -0.5]], HIND = [[0.8, -0.6], [5, -1], [9, -3.5], [9.5, -7], [6, -8.5], [2, -6], [0.8, -3]];
    const wingGeo = (mirror) => {
      const [p1, u1] = fan(FORE, mirror), [p2, u2] = fan(HIND, mirror), g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p1.concat(p2), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u1.concat(u2), 2));
      return g;
    };
    // body and feelers are painted dark: their uv is (100, 100) at every corner
    const dark = (g) => { const n = g.getAttribute('position').count, a = new Float32Array(n * 2).fill(100); g.setAttribute('uv', new THREE.BufferAttribute(a, 2)); return g; };
    const bodyGeo = dark(new THREE.OctahedronGeometry(1, 0).scale(1.5, 1.2, 5.6));
    // two feathered feelers: narrow leaves lying in the wings' plane, swept forward and out from the head
    const feel = [], leaf = [[0, 0], [1.0, 2.2], [0.9, 5.2], [0, 7.4], [-0.5, 5.0], [-0.4, 2.0]];
    for (const m of [-1, 1]) for (let i = 1; i < leaf.length - 1; i++) for (const q of [leaf[0], leaf[i], leaf[i + 1]]) { const c = Math.cos(0.5), sn = Math.sin(0.5); feel.push(m * (0.5 + q[0] * c + q[1] * sn), 0.5, 5.0 - q[0] * sn + q[1] * c); }
    const feelGeo = new THREE.BufferGeometry(); feelGeo.setAttribute('position', new THREE.Float32BufferAttribute(feel, 3)); dark(feelGeo);
    const moth = new THREE.Group(), wingL = new THREE.Mesh(wingGeo(-1), mothMat), wingR = new THREE.Mesh(wingGeo(1), mothMat), mothBody = new THREE.Mesh(bodyGeo, mothMat), mothFeel = new THREE.Mesh(feelGeo, mothMat);
    for (const m of [wingL, wingR, mothBody, mothFeel]) { m.frustumCulled = false; moth.add(m); }
    moth.scale.setScalar(1.6); moth.visible = false; scene.add(moth);
    await ctx.yield();

    // ---- the balance, in closed form: ambient sway in time + damped impulses keyed to u ----------------------------------
    const U_SWALLOW = 0.024, U_MOTH0 = 0.2, U_LAND = 0.27, U_DRAUGHT = 0.39, MOTH_SINK = 17, MOTH_MORE = 45, SINK_TAU = 1.2;
    const sinkAt = (ms) => ms <= 0 ? 0 : 1 - Math.exp(-ms / SINK_TAU) * Math.cos(1.9 * ms);
    const imp = (sec, A, tau, w) => sec <= 0 ? 0 : A * Math.exp(-sec / tau) * Math.sin(w * sec);
    const turnMap = (u) => hour.turn === 1 ? u : hour.turn === -1 ? 1 - u : hour.turn === 2 ? u * 0.6 + 0.4 : -1;
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), one = V(1, 1, 1), YUP = V(0, 1, 0);
    const pv = V(0, 0, 0), d3 = V(0, 0, 0), up3 = V(0, 0, 0), zz = V(0, 0, 0), e0 = V(0, 0, 0), e1 = V(0, 0, 0), ta = V(0, 0, 0), tb = V(0, 0, 0), bow = V(0, 0, 0), neg = V(0, 0, 0);
    const setRotY = (mesh, i, yaw, x, y, z, tz = 1) => { m4.makeRotationY(yaw); m4.elements[8] *= tz; m4.elements[10] *= tz; m4.elements[12] = x; m4.elements[13] = y; m4.elements[14] = z; mesh.setMatrixAt(i, m4); };
    const setBasis = (mesh, i, bx, by, c) => { zz.crossVectors(bx, by); m4.makeBasis(bx, by, zz).setPosition(c); mesh.setMatrixAt(i, m4); };
    let rainI = 0;
    const lensP = V(0, 0, 0);
    function poseTree(time, u) {
      const sec = u * duration, w = turnMap(u), sb = hero.state.sunBottom, mb = hero.state.moonBottom;
      const dSec = rare ? sec - U_DRAUGHT * duration : -1;
      const dTilt = imp(dSec, 25 * DEG, 3.3, 1.5), dYaw = imp(dSec, 0.3, 3.6, 1.1), dTurn = dSec > 0 ? Math.PI * 4 * smoothstep(0, 7, dSec) : 0;
      rainI = 0; pathAt(u, lensP);
      for (let i = 0; i < nA; i++) {
        const n = nodes[i], par = n.parent;
        // tilt: ambient + the cascade (each tier half a second later, the other way) + this arm's own events
        let th = ((2.0 + 0.55 * n.depth) * Math.sin(time * (0.55 + 0.06 * (n.id % 5)) + n.ph[0]) + 0.8 * Math.sin(time * 1.07 + n.ph[1])) * DEG * n.amp;
        const tierSec = (w - (n.tAt ?? ((n.tree === 0 ? 0.15 : 0.25) + 0.085 * n.depth))) * duration;
        if (w >= 0) th += imp(tierSec, 5 * DEG * n.sign * n.amp, 2.2, 2.3);
        if (n.tree === 0) {
          const ms = sec - U_LAND * duration - 0.5 * Math.max(0, n.cd - T3.cd);
          if (n === T3) th -= Math.asin(clamp((MOTH_SINK * sinkAt(ms) + MOTH_MORE * smoothstep(0.35, 0.4, u)) / n.b, -0.9, 0.9));
          else if (n.cd > T3.cd) th += imp(ms, 11 * DEG * Math.pow(0.85, n.cd - T3.cd - 1) * n.sign * n.amp, 2.4, 2.4);
          else if (!n.special) th += imp(ms, 2.5 * DEG * n.amp, 2.4, 2.4);
        }
        if (n.special) th += imp(sec - U_SWALLOW * duration, 17 * DEG, 2.6, 2.2) + 2.5 * DEG * Math.sin(time * 0.9 + n.ph[3]);
        th += dTilt * n.amp + n.th0;
        const yaw = n.yaw + (0.045 * Math.sin(time * 0.23 + n.ph[2]) + dYaw * (n.special ? 0.3 : 1)) * n.amp;
        if (par) pv.set(par.px, par.py + par.S.sh.bot, par.pz); else pv.copy(n.tree === 0 ? sb : mb).add(O);
        ta.copy(pv); pv.y -= n.tp; tb.copy(pv); tb.y += LR * 2;
        style.setThread(threads, i * 3, ta, tb, null);
        setRotY(knots, nP + i, n.ph[2] + yaw, tb.x, tb.y, tb.z);
        const ct = Math.cos(th), st = Math.sin(th), cy = Math.cos(yaw), sy = Math.sin(yaw);
        d3.set(cy * ct, st, sy * ct); up3.set(-cy * st, ct, -sy * st);
        e0.copy(pv).addScaledVector(d3, -n.a); e1.copy(pv).addScaledVector(d3, n.b);
        style.setTube(arms, i, e0, e1, 0.25);
        ta.copy(pv).addScaledVector(up3, LR + 0.2); setBasis(loops, i * 3, d3, up3, ta);
        for (let e = 0; e < 2; e++) {
          const p = n.loads[e], end = e ? e1 : e0, sh = p.S.sh;
          if (e) { ta.copy(end).addScaledVector(d3, LR + 1.6); setBasis(loops, i * 3 + 2, up3, d3, ta); }
          else { neg.copy(d3).multiplyScalar(-1); ta.copy(end).addScaledVector(neg, LR + 1.6); setBasis(loops, i * 3 + 1, up3, neg, ta); }
          ta.y -= LR; p.px = ta.x; p.pz = ta.z; p.py = ta.y - p.t - sh.top;
          tb.set(p.px, p.py + sh.top - 0.3, p.pz);
          bow.set(-sy, 0, cy).multiplyScalar(0.05 * p.t * Math.sin(time * 0.5 + p.ph));
          style.setThread(threads, i * 3 + 1 + e, ta, tb, bow);
          const tw = w < 0 ? 0 : smoothstep(p.turnAt, p.turnAt + p.turnW, n.special ? u : w);
          const sway = (p.sw ?? 1) * (0.5 * Math.sin(time * 0.47 + p.ph) + 0.1 * Math.sin(time * 1.03 + p.ph * 2.1));
          let py = p.yaw0 + sway + Math.PI * tw + dTurn + (p.late ? p.late[2] * smoothstep(p.late[0], p.late[1], u) : 0), thin = 1;
          if (p.arr && u < p.arr[1]) {                                // not yet open: held edge-on to the lens, then let go
            const edge = Math.atan2(lensP.x - p.px, lensP.z - p.pz) + Math.PI / 2 + Math.PI * p.arr[2], k = smoothstep(p.arr[0], p.arr[1], u);
            py = lerp(edge + dTurn, py, k);
            thin = lerp(0.22, 1, k);                                    // (a far leaf seen edge-on is a hair, not a stick: it comes to its 6 m as it opens)
          }
          if (p.dep && u > p.dep[0]) {                               // gone by: its edge to the lens again
            const e0y = Math.atan2(lensP.x - p.px, lensP.z - p.pz) + Math.PI / 2, k = smoothstep(p.dep[0], p.dep[1], u);
            py = lerp(py, e0y + Math.PI * Math.round((py - e0y) / Math.PI), k); thin = lerp(thin, 0.12, k);
          }
          if (p.thinK) thin *= p.thinK;                               // (the charms and the climbing swallow are cut from thinner ply)
          p.yaw = py;
          setRotY(p.S.mesh, p.inst, py, p.px, p.py, p.pz, thin);
          setRotY(knots, p.id, py - 0.6 * Math.cos(time * 0.47 + p.ph) + p.ph, tb.x, tb.y, tb.z);
          if (drops && p.kind === 'cloud') {
            const cw = Math.cos(py), sw = Math.sin(py), half = p.S.r * 0.5;
            for (let k = -1; k <= 1; k++) {
              const ox = k * half * cw, oz = -k * half * sw, len = 6 + 2.5 * ((p.id + k + 3) % 3);
              ta.set(p.px + ox, p.py + sh.bot + 0.3, p.pz + oz); tb.set(ta.x, ta.y - len, ta.z);
              style.setThread(threads, nA * 3 + rainI, ta, tb, null);
              setRotY(drops, rainI, py + k, tb.x, tb.y - 2.6, tb.z); rainI++;
            }
          }
        }
      }
      for (const S of shapes.values()) if (S.mesh) S.mesh.instanceMatrix.needsUpdate = true;
      loops.instanceMatrix.needsUpdate = true; knots.instanceMatrix.needsUpdate = true;
      if (drops) drops.instanceMatrix.needsUpdate = true;
    }
    // ---- first pose, shadow pass compiled for its own target, then the frame loop ---------------------------------------
    const pRA = pieces.find((q) => q.tag === 'RAb') || null;
    const camPos = V(0, 0, 0), focA = V(-60, 265, -110), focB = V(60, 330, 230), foc = V(0, 0, 0);
    const mothFrom = V(0, 0, 0), mothTo = V(0, 0, 0), eul = new THREE.Euler(), qFly = new THREE.Quaternion(), qLand = new THREE.Quaternion();
    // The last picture: the gaze rides BELOW the ring (a fixed angle under it, toward the moon's side), so the ring
    // stands in the upper third with its whole hook under the top edge and the moon's rising half fills the frame
    // beneath and beside it. The path itself ends dead on the ring's centre.
    // (at dawn the route comes down to the ring from above the beam: the gaze goes straight to the ring there)
    const poiUnder = V(0, 0, 0), lensU = V(0, 0, 0), UNDER = hourName === 'dawn' ? 0 : 0.36;
    const underRing = (time, u) => {
      const d = pathAt(u, lensU).distanceTo(ring);
      const side = UNDER * 0.2 * (1 - smoothstep(0.88, 0.94, u)) * d;      // a little to the left as well, until the last straight
      // (on the last straight the gaze lifts over the ring's centre, so the maker's hook stands whole under the top edge)
      return poiUnder.set(ring.x + side, ring.y - UNDER * (1 - 0.82 * smoothstep(0.88, 0.94, u)) * d + 0.15 * smoothstep(0.91, 0.95, u) * d, ring.z - side);
    };
    // The sun's half-turn at the golden hour and at night is made by the metres flown past the moth cloud's hang point
    // (the end of its arm as laid out, in plan): centred on that point's station (where the route passes nearest it in
    // plan), it lasts three quarters of the disc's diameter, three eighths before the station and three eighths after,
    // turning by the window's side. On a visit with the rare draught the half-turn stays the part's own
    // (hero.sunYawAt): the draught spins the disc two whole turns the other way and would run against this one.
    const SUN_R = 45, dHang = path.nearestXZ(pM.x, pM.z).u * path.length;
    const SUN_PASS = [(dHang - 0.375 * 2 * SUN_R) / path.length, (dHang + 0.375 * 2 * SUN_R) / path.length];
    const sunBase = (u) => hour.turn === 0 ? Math.PI - 0.15 + 0.9 * smoothstep(SUN_TURN[0], SUN_TURN[1], u)
      : hour.turn === -1 ? Math.PI - 0.15 + Math.PI * (1 - smoothstep(SUN_TURN[0], SUN_TURN[1], u)) : rare ? hero.sunYawAt(u) : Math.PI - 0.15 - Math.PI * smoothstep(SUN_PASS[0], SUN_PASS[1], u);
    let sunYawNow = Math.PI;
    function frame(dt, time, camera, u) {
      style.setProgress(u); hero.setProgress(u);
      const dSec = rare ? (u - U_DRAUGHT) * duration : -1;
      sunYawNow = sunBase(u) + 0.07 * Math.sin(time * 0.37 + 1.3) + 0.03 * Math.sin(time * 1.1) + (dSec > 0 ? Math.PI * 4 * smoothstep(0, 7, dSec) : 0);
      hero.setSunYaw(sunYawNow);
      // the crescent keeps its face roughly to the lens (both faces are the same pot), swaying on its thread
      if (camera) {
        camPos.setFromMatrixPosition(camera.matrixWorld);
        hero.moonCentre(u, tmpA).add(O);
        hero.setMoonYaw(Math.atan2(camPos.x - tmpA.x, camPos.z - tmpA.z) + Math.PI + 0.3 + 0.45 * Math.sin(time * 0.43 + 2.) + 0.1 * Math.sin(time * 0.97));
      }
      hero.update(dt, time, camera);
      poseTree(time, u);
      // the moth flies in from the window side and lands on the cloud M, which sinks under it
      const on = u >= U_MOTH0;
      moth.visible = on;
      if (on) {
        const mu = clamp((u - U_MOTH0) / (U_LAND - U_MOTH0), 0, 1), k = mu * mu * (3 - 2 * mu);
        // it lands flat on the cloud's evening face, head up, as a moth sits on a wall, and rides the cloud as it turns
        const nx = -Math.sin(pM.yaw), nz = -Math.cos(pM.yaw);
        mothTo.set(pM.px + nx * 4.2, pM.py + 1.5, pM.pz + nz * 4.2);
        mothFrom.set(pM.px - 165, pM.py + 62, pM.pz + 64);
        const landed = smoothstep(0, 1.6, (u - U_LAND) * duration), fl = 1 - landed;
        moth.position.lerpVectors(mothFrom, mothTo, k);
        moth.position.y += 24 * Math.sin(Math.PI * k) * (1 - k * 0.5) + 2.5 * Math.sin(time * 3.1) * fl * (1 - k);
        moth.position.x += 5 * Math.sin(time * 1.7) * fl * (1 - k);
        eul.set(-0.18, Math.atan2(mothTo.x - mothFrom.x, mothTo.z - mothFrom.z) + 0.25 * Math.sin(time * 1.3) * fl, 0);
        qFly.setFromEuler(eul);
        d3.set(nx, 0, nz); up3.crossVectors(d3, YUP); m4.makeBasis(up3, d3, YUP); qLand.setFromRotationMatrix(m4);
        moth.quaternion.slerpQuaternions(qFly, qLand, smoothstep(0.72, 1, k));
        const ang = lerp(0.95 * Math.sin(time * 7.2), 0.38 + 0.3 * Math.sin(time * 0.8), smoothstep(0.82, 1, k));
        wingR.rotation.z = ang; wingL.rotation.z = -ang;
      }
      hero.beamPoint(-150, u, poiDown).add(O); poiDown.y -= 36;
      hero.beamPoint(-40, u, poiMoon).add(O); poiMoon.x += 0.866 * 26; poiMoon.z -= 0.5 * 26; poiMoon.y -= 31 - 23 * smoothstep(0.74, 0.8, u);
      poiE.set(lerp(pE.px, pX.px, 0.3), lerp(pE.py, pX.py, 0.3) + 2, lerp(pE.pz, pX.pz, 0.3)); if (pRA) poiCross.set(pRA.px, pRA.py + 6, pRA.pz); else poiCross.copy(poiMoon); hero.sunCentre(u, poiSet).add(O); poiSet.x -= 22 - 17 * smoothstep(0.575, 0.61, u); poiSet.y += 56 + 10 * smoothstep(0.575, 0.61, u); poiSet.z += 35; hero.beamPoint(-240, u, poiLoop).add(O); poiLoop.y -= 7;
      poiEnd.set((pQ1.px + pQ2.px) * 0.5, pQ2.py - 4, (pQ1.pz + pQ2.pz) * 0.5); poiMoth.set(pM.px + 8, pM.py - 8 + 0.92 * MOTH_SINK * sinkAt((u - U_LAND) * duration) + MOTH_MORE * smoothstep(0.35, 0.4, u), pM.pz + 24);
      style.update(dt, time, camera);
      style.shadow.focus(foc.lerpVectors(focA, focB, smoothstep(0.35, 0.8, u)));
      style.shadow.render(ctx.renderer, scene);
      wallU.uTiltR.value = style.tiltAt(u); wallU.uSunW.value = Math.max(0.16, Math.abs(Math.cos(sunYawNow - Math.PI)));
      // as the sun goes down its patch climbs the wall and drifts along it, away from the window's side, so it is still
      // beside the mobile when the lens has turned onto the beam; the mobile's shadow lies in the part of it we see
      const drift = hour.turn === 1 || hour.turn === 2 ? smoothstep(0.72, 0.92, u) : 0;
      wallU.uPatchC.value.set(-290 - 40 * style.U.uEve.value + 520 * drift, 60 + 350 * smoothstep(0.02, 0.8, u));
      wallU.uShOff.value.set(40 + 230 * drift, -40);
      ceil.material.uniforms.uOn.value = smoothstep(0.2, 0.6, u);
      if (!revealU && revealTries < 240) { revealTries++; scene.traverse((o) => { const q = o.material && o.material.uniforms; if (q && q.uReveal && q.tNext) revealU = q.uReveal; }); }
      paper.material.uniforms.uA.value = revealU ? 1 - smoothstep(0, 0.85, revealU.value) : 1;
      if (camera) {
        camPos.setFromMatrixPosition(camera.matrixWorld);
        dome.position.copy(camPos); motes.material.uniforms.uCam.value.copy(camPos);
      }
    }
    await ctx.yield();
    poseTree(0, 0);
    await ctx.yield();
    const poiE = V(0, 0, 0), poiSet = V(0, 0, 0), poiLoop = V(0, 0, 0), poiCross = V(0, 0, 0), poiMoon = V(0, 0, 0), poiMoth = V(0, 0, 0), poiEnd = V(0, 0, 0), poiDown = V(0, 0, 0);
    style.shadow.compile(ctx.renderer);
    await ctx.yield();

    const poiSun = V(0, 0, 0), poiLow = V(0, 0, 0);
    const sunAt = (time, u) => hero.sunCentre(u, poiSun).add(O);
    // at the pass the route begins its climb toward the sun's loop; the gaze is held level on the red face by aiming
    // below and to the left of the disc's centre, so the face fills the right half and the ring and hook stay in frame
    const sunLow = (time, u) => { const k = smoothstep(0.53, 0.6, u), q = hero.sunCentre(u, poiLow).add(O); q.y -= 4 - 2 * k + 52 * (1 - smoothstep(0.41, 0.48, u)); q.x += 9 + 38 * k; q.z += 5; return q; };
    return {
      scene, path, duration, pace,
      ...(hourName === 'dawn' ? { title: 'Morning Is the Beam Tipping Back' } : {}),
      camera: { fov: 60, near: 0.5, far: 6000, lookAhead: 30, sway: 0.6, bank: 0.5 },
      pois: [
        { at: sunAt, from: 0.04, to: 0.31, weight: 0.5 },
        { at: () => poiMoth, from: 0.24, to: 0.41, weight: 0.65 },
        { at: sunLow, from: 0.4, to: 0.68, weight: 0.6 },
        { at: () => poiMoon, from: 0.6, to: 0.86, weight: 0.4 },
        { at: () => poiEnd, from: 0.82, to: 0.945, weight: 0.22 },
        { at: () => poiDown, from: 0.67, to: 0.73, weight: 0.25, fade: 0.25 },
        { at: underRing, from: 0.78, to: 1.06, weight: 0.6 },
        { at: () => poiE, from: 0.03, to: 0.2, weight: 0.5, fade: 0.35 },
        { at: () => poiSet, from: 0.56, to: 0.665, weight: 0.85, fade: 0.5 },
        { at: () => poiLoop, from: 0.615, to: 0.695, weight: 0.66, fade: 0.5 },
        { at: () => poiCross, from: 0.705, to: 0.785, weight: 0.75, fade: 0.35 },
      ],
      // no glow, no halo: nothing in this room shines but brass, and nothing bright sits in the ring
      // style 'ring' pins the plain ring: the engine's seeded looks (iris, film, lens, corona, flock) are not ply, brass or linen
      portal: { style: 'ring', shape: 'circle', radius: RING_R - 0.6, color: '#C9A3A2', glow: 0, halo: false, tilt: true, revealDistance: 240 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) { frame(dt, time, camera, u || 0); },
      dispose() { style.dispose(); hero.dispose(); },
    };
  },
};
