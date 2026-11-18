// Bells Before Breakfast, part BELOW STAIRS: the back lobby, the great kitchen, the white passage and the bell hall.
// One part of three; the world file joins it at the library's north door plane z0. Every place here is written from
// z0: d = metres north of the door plane (world z = z0 - d), x east, y up. Lobby floor y 3, basement floor y -13.
// The part adds no three.js light and sets no fog or background: its rooms are lit by the kit's light rigs (shader
// lights), three rigs for three rooms' worth of lamps. Everything moves on the world's clock; nothing reads metres flown.
// The world sets neither drawWithin nor drawIn: the arch of the way out is whole at every metre.
import * as THREE from 'three';
import * as INT from '../kit/interior.js';

const SF = INT.surf, SURF = INT.SURF;
const S_WHITE = SF(SURF.STONE, 0.06), S_STONE = SF(SURF.STONE, 0.14), S_DEAL = SF(SURF.WOOD, 0.22), S_OAK = SF(SURF.WOOD, 0.42);
const S_IRON = SF(SURF.PLAIN, 0.5, 0.85), S_COPPER = SF(SURF.PLAIN, 0.82, 1), S_BRASS = SF(SURF.PLAIN, 0.8, 1), S_STEEL = SF(SURF.PLAIN, 0.7, 0.9);
const S_CHINA = SF(SURF.PLAIN, 0.86), S_MATTE = SF(SURF.PLAIN, 0.06), S_BREAD = SF(SURF.PLAIN, 0.14);
const C = {
  white: '#e6e0d2', whiteShade: '#b9b4ae', flag: '#9a938a', deal: '#d9b98a', copper: '#f0a27a', brass: '#d6b25a', iron: '#2a2a2e',
  cobalt: '#1c3f9e', china: '#ece8de', oak: '#4a2c1c', soot: '#3a322c', tile: '#9c4a34', stone: '#b9ae9c', steel: '#9aa0a8',
};
// levels and the kitchen's box
const FL = 3, BF = -13, KX0 = -24, KX1 = 9, KD0 = 8, KD1 = 86, KCX = (KX0 + KX1) / 2, KHW = (KX1 - KX0) / 2, BAY = 26, VS = 4, VR = 11;
// the passage ends and the bell hall begins PE metres north of the door: the passage is 18 m long for what stands
// along it (2.4 m of plain wall from the arch, 8.2 m of shelves, a gap of 1 m, a china dresser of 5.8 m, 0.6 m to the
// hall); the hall is as wide as its board of bells (26 m: half width HW), 22 m high (ceiling at HT) and 30 m deep
const PE = 104, HW = 13, HT = 9;
// the vault: a barrel across the width crossed by one barrel a bay; the ceiling is the higher of the two
const vaultX = (x) => VS + VR * Math.sqrt(Math.max(0, 1 - ((x - KCX) / KHW) ** 2));
const vaultZ = (d) => { const s = (((d - KD0) % BAY) + BAY) % BAY / (BAY / 2) - 1; return VS + VR * Math.sqrt(Math.max(0, 1 - s * s)); };
const ceilAt = (x, d) => Math.max(vaultX(x), vaultZ(d));

// the route through this part, as the brief gives it (the clear air is counted against the path through these)
export function belowRoute(z0) {
  return [[0, 9.3, z0], [0, 9, z0 - 4], [0, 8.8, z0 - 8], [0, 5.5, z0 - 26], [0, -1, z0 - 50], [0, -5.5, z0 - 68], [0, -7, z0 - 74],
    [0, -7, z0 - 86], [0, -7.567, z0 - 102], [0, -8.133, z0 - 118], [0, -8.7, z0 - 134]];
}

// a grid surface from a function (u, v) -> [x, y, z], its normals turned towards `want`; `skip(i, j)` leaves a cell
// out (an opening), after the normals are made
function gridGeo(nu, nv, fn, want, skip) {
  const P = new Float32Array((nu + 1) * (nv + 1) * 3), I = [], o = [0, 0, 0];
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { fn(i / nu, j / nv, o); P[k++] = o[0]; P[k++] = o[1]; P[k++] = o[2]; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  const N = g.attributes.normal, m = Math.floor((nv + 1) * (nu + 1) / 2);
  if (N.getX(m) * want[0] + N.getY(m) * want[1] + N.getZ(m) * want[2] < 0) {
    const ix = g.index.array;
    for (let t = 0; t < ix.length; t += 3) { const s = ix[t + 1]; ix[t + 1] = ix[t + 2]; ix[t + 2] = s; }
    g.computeVertexNormals();
  }
  if (skip) { const ix = g.index.array, keep = []; for (let j = 0, q = 0; j < nv; j++) for (let i = 0; i < nu; i++, q += 6) if (!skip(i, j)) for (let k = 0; k < 6; k++) keep.push(ix[q + k]); g.setIndex(keep); }
  return g;
}

export async function buildBelow(ctx, opts = {}) {
  const z0 = opts.z0 ?? -152;
  const Z = (d) => z0 - d;
  const detail = ctx.quality?.detail ?? 1, dens = ctx.core.clamp(ctx.vary?.density ?? 1, 0.7, 1.3);
  // every stream of this part, taken here in one list, each from a name of its own
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('bbb-below-' + name + ':' + ctx.seed));
  const R = { copper: stream('copper'), tables: stream('tables'), racks: stream('racks'), 
    wires: stream('wires'), light: stream('light'), flames: stream('flames'), passage: stream('passage'), range: stream('range'), dress: stream('dress'),
    crocks: stream('crocks'), loaves: stream('loaves'), clock: stream('clock'), planks: stream('planks'), timetable: stream('timetable'), hangings: stream('hangings') };
  const group = new THREE.Group(); group.name = 'below-stairs';
  // two child groups hold every mesh of the part. 'below-far': what a straight line can reach through the library's
  // north doorway from the route south of the drawing room's south door plane; it is drawn from the entry on.
  // 'below-near': all the rest; the world shows it from that door plane on. The part itself switches neither.
  const far = new THREE.Group(); far.name = 'below-far'; const near = new THREE.Group(); near.name = 'below-near'; group.add(far, near);
  // WHAT A LINE CAN REACH, as a count in node on seeds 1 to 40 found it (every lens place of the route south of the
  // drawing room's south door plane, 0.25 m apart; the library's north doorway grown by 0.3 m, the part's own
  // openings by 0.1 m). All of the lobby's depth can be reached. Farther in, a line has cleared the lobby's floor and
  // the landing's north edge and passed the high arch: past the edge none falls faster than REACH.fall; past the
  // arch none runs east faster than REACH.east or west faster than REACH.west. Beyond the kitchen's north wall a line
  // has also passed under the north arch's head, so it has fallen at least as fast as from the landing's edge to that
  // head (DIP); it leaves the arch between REACH.archW and REACH.archE and strikes the hall's north wall between
  // REACH.hallW and REACH.hallE. What touches that volume goes to 'below-far' (a triangle, an instance or a piece of
  // wire, each by its own box); all the rest goes to 'below-near'.
  const REACH = { lobby: 6.5, lip: FL - 0.3, edge: 14.2, fall: 0.1005, jamb: 4.1, east: 0.195, west: 0.062, head: BF + 6 + 4.1,
    arch: KD1 + 1.5, archW: -2.15, archE: 3.2, north: 134, hallW: -1, hallE: 6.8, sway: 0.25, wire: 0.9 };
  const DIP = (FL - 0.1 - REACH.head) / (KD1 - REACH.edge);
  // a box by its least and greatest x, y and d (metres north of the door plane), grown by m all round
  const inReach = (x0, x1, y0, y1, dA, dB, m = 0) => {
    x0 -= m; x1 += m; y0 -= m; y1 += m; dA -= m; dB += m;
    if (dA <= REACH.lobby) return true;
    if (dA <= REACH.arch) return y1 >= REACH.lip - REACH.fall * Math.max(0, dB - REACH.edge)
      && x1 >= -REACH.jamb - REACH.west * Math.max(0, dB - KD0) && x0 <= REACH.jamb + REACH.east * Math.max(0, dB - KD0);
    if (y1 < FL - 0.1 - REACH.fall * (dB - REACH.edge) || y0 > REACH.head - DIP * (dA - KD1)) return false;
    const ka = (dA - REACH.arch) / (REACH.north - REACH.arch), kb = (Math.min(dB, REACH.north) - REACH.arch) / (REACH.north - REACH.arch);
    return x1 >= Math.min(REACH.archW + (REACH.hallW - REACH.archW) * ka, REACH.archW + (REACH.hallW - REACH.archW) * kb)
      && x0 <= Math.max(REACH.archE + (REACH.hallE - REACH.archE) * ka, REACH.archE + (REACH.hallE - REACH.archE) * kb);
  };
  // the same for a shape's own box where a matrix puts it (its eight corners)
  const _bv = new THREE.Vector3();
  const boxReach = (bb, mat, m = 0) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, za = 1e9, zb = -1e9;
    for (let k = 0; k < 8; k++) { _bv.set(k & 1 ? bb.max.x : bb.min.x, k & 2 ? bb.max.y : bb.min.y, k & 4 ? bb.max.z : bb.min.z).applyMatrix4(mat);
      x0 = Math.min(x0, _bv.x); x1 = Math.max(x1, _bv.x); y0 = Math.min(y0, _bv.y); y1 = Math.max(y1, _bv.y); za = Math.min(za, _bv.z); zb = Math.max(zb, _bv.z); }
    return inReach(x0, x1, y0, y1, z0 - zb, z0 - za, m);
  };
  // a built geometry in two parts over its one set of vertices: [the triangles no line reaches, the triangles whose
  // own box a line can reach]; either may be null
  const splitGeo = (geo, m = 0) => {
    const P = geo.attributes.position.array, I = geo.index.array, N = [], F = [];
    for (let q = 0; q < I.length; q += 3) {
      const a = I[q] * 3, b = I[q + 1] * 3, c = I[q + 2] * 3;
      (inReach(Math.min(P[a], P[b], P[c]), Math.max(P[a], P[b], P[c]), Math.min(P[a + 1], P[b + 1], P[c + 1]), Math.max(P[a + 1], P[b + 1], P[c + 1]),
        z0 - Math.max(P[a + 2], P[b + 2], P[c + 2]), z0 - Math.min(P[a + 2], P[b + 2], P[c + 2]), m) ? F : N).push(I[q], I[q + 1], I[q + 2]);
    }
    const part = (L) => { if (!L.length) return null; if (L.length === I.length) return geo;
      const g = new THREE.BufferGeometry(); for (const k of Object.keys(geo.attributes)) g.setAttribute(k, geo.attributes[k]); g.setIndex(L); return g; };
    return [part(N), part(F)];
  };
  const updates = [];
  // how far a place stands from the route's line, taken as the straight lines between the route's own points
  const RT = belowRoute(z0);
  const routeDist = (x, y, z) => { let m = 1e9;
    for (let i = 0; i + 1 < RT.length; i++) { const p0 = RT[i], p1 = RT[i + 1], dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2];
      const t = ctx.core.clamp(((x - p0[0]) * dx + (y - p0[1]) * dy + (z - p0[2]) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
      m = Math.min(m, Math.hypot(x - p0[0] - dx * t, y - p0[1] - dy * t, z - p0[2] - dz * t)); }
    return m; };
  let triangles = 0, drawCalls = 0;
  const addMesh = (geo, mat, name, where = near) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; where.add(m); triangles += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; drawCalls++; return m; };
  // a built geometry goes to the two groups triangle by triangle: `name` in the near group, `name`-far in the far one
  const addSplit = (geo, mat, name, m = 0) => { const [gn, gf] = splitGeo(geo, m); if (gn) addMesh(gn, mat, name, near); if (gf) addMesh(gf, mat, name + '-far', far); };

  // ---- the three light rigs (rig space is world space: the group stays at the origin) ----
  // the kitchen's sun follows the world's hour (opts.hour): low and warm at dawn and at the golden hour, paler and
  // steeper by day, none at night (lamps and fires only). Its bearing is the outside's where the world gives one
  // (opts.sunDir) and it stands in the east; else 20 degrees north of east, so that each window's shaft crosses the
  // kitchen's width inside its own bay (33 m across for 12 m along; the windows stand 17.5 m apart).
  const HOURS = {
    dawn: { el: 15, sun: '#ffe9cf', sunI: 12, sky: '#bcd4ff', skyI: 5, shaft: 0.2, mote: 0.9, pane: 0.55, louvre: ['#bfd4ee', 1.3], out: { zenith: '#9fc0e8', horizon: '#f4c9a4', ground: '#6f8f6a', cloud: '#f29a8c' } },
    day: { el: 31, sun: '#f4f7ff', sunI: 10, sky: '#cfe0ff', skyI: 6, shaft: 0.12, mote: 0.7, pane: 0.6, louvre: ['#d4e4ff', 1.5], out: { zenith: '#8fb4e8', horizon: '#dfeaf6', ground: '#5a7a52', cloud: '#ffffff' } },
    golden: { el: 14, sun: '#ffd29a', sunI: 12, sky: '#f0cfa8', skyI: 5, shaft: 0.2, mote: 0.9, pane: 0.55, louvre: ['#f0d2ac', 1.2], out: { zenith: '#9aa8d0', horizon: '#ffcf96', ground: '#4c5c44', cloud: '#ffc890' } },
    night: { el: 22, sun: '#000000', sunI: 0, sky: '#5870b0', skyI: 1.2, shaft: 0, mote: 0, pane: 0.2, louvre: ['#1a2850', 0.25], out: { zenith: '#0c1430', horizon: '#243460', ground: '#101820', cloud: '#40507a' } },
  };
  const HR = HOURS[opts.hour] ?? HOURS.dawn;
  const sd = opts.sunDir, sdx = sd ? (sd.x ?? sd[0] ?? 0) : 0, sdz = sd ? (sd.z ?? sd[2] ?? 0) : 0;
  const sunAz = sdx > 0.15 ? ctx.core.clamp(Math.atan2(-sdz, sdx), 0.25, 0.8) : 0.35, sunEl = HR.el * Math.PI / 180;
  const sunDir = [Math.cos(sunEl) * Math.cos(sunAz), Math.sin(sunEl), -Math.cos(sunEl) * Math.sin(sunAz)];
  const rigL = INT.makeLightRig({ scale: 4, sunIntensity: 0, ambient: 0.42, ambientSky: '#d6d4d0', ambientGround: '#c4a688', aoRadius: 0.9, aoStrength: 0.8, envBoost: 3.0 });
  const rigK = INT.makeLightRig({ scale: 4, sunDir, sunColor: HR.sun, sunIntensity: HR.sunI, ambient: 0.42, ambientSky: '#d2d2d6', ambientGround: '#f0cfae', bounce: 4.4, aoRadius: 1.4, aoStrength: 0.95, envBoost: 4.3 });
  const rigP = INT.makeLightRig({ scale: 4, sunIntensity: 0, ambient: 0.46, ambientSky: '#d6d4d0', ambientGround: '#c4a688', aoRadius: 0.9, aoStrength: 0.7, envBoost: 4.0 });
  rigL.setBounds([-5, FL, Z(6.5)], [5, FL + 11, Z(0) + 0.5], FL);
  rigK.setBounds([KX0, BF, Z(KD1)], [KX1, 15.5, Z(KD0)], BF);
  rigP.setBounds([-HW, BF, Z(134)], [HW, HT, Z(86)], BF);
  const WIN = { n: 4, sp: 17.5, w: 5, h: 7, cy: 2, d0: 47 - 1.5 * 17.5 };
  rigK.addWindowRow({ origin: [KX1 - 0.08, WIN.cy, Z(WIN.d0)], axis: [0, 0, -1], normal: [-1, 0, 0], up: [0, 1, 0], width: WIN.w, height: WIN.h, spacing: WIN.sp, count: WIN.n,
    arch: 1, mullions: [3, 5], sky: HR.sky, skyIntensity: HR.skyI });
  // THE LANTERN in the crown of the middle bay: an eight-sided drum of small panes over an eight-sided stone curb (R:
  // the drum's corner radius, inside the opening left in the vault; the curb from y0 to y1; glass from sill to
  // head; boards from the eave to the top). It lights the kitchen as the east windows do: a window row of the rig
  // that faces down, lit by the hour's sky and by no sun. Its opening is the drum's own; its strength is the
  // hour's sky times the glass of its eight sides over that opening.
  // VAULT: the cells of one bay's vault, closest together at the walls. The opening left for the lantern is the four
  // cells round the crown's own point of the middle bay (hx by hd either side of it). The lantern's flats face the
  // four walls and the four diagonals: the drum's stand `lap` inside the opening's nearest edge, the curb's outer
  // ones `lap` outside its farthest corner, so the curb closes the vault all round.
  const VAULT = { nu: 22, nv: 16 };
  const LAN = { x: KCX, z: Z(KD0 + 1.5 * BAY), lap: 0.25, y0: 14.2, y1: 15.1, sill: 15.4, head: 17.5, eave: 18, top: 19.1, bar: 0.07, post: 0.08 };
  { const hx = (KX1 - KX0) / 2 * Math.cos(Math.PI * (VAULT.nu / 2 - 1) / VAULT.nu), hd = BAY / 2 * Math.cos(Math.PI * (VAULT.nv / 2 - 1) / VAULT.nv);
    LAN.R = (Math.min(hx, hd) - LAN.lap) / Math.cos(Math.PI / 8);                                 // the drum's corner radius
    LAN.curb = (Math.max(hx, hd, (hx + hd) * Math.SQRT1_2) + LAN.lap) / Math.cos(Math.PI / 8); }   // the curb's outer corner radius
  LAN.ap = LAN.R * Math.cos(Math.PI / 8); LAN.side = 2 * LAN.ap * Math.tan(Math.PI / 8);
  LAN.open = 8 * LAN.ap * LAN.ap * Math.tan(Math.PI / 8); LAN.gain = 8 * (LAN.side - 2 * LAN.post) * (LAN.head - LAN.sill) / LAN.open;
  { const w = Math.sqrt(LAN.open), row = rigK.addWindowRow({ origin: [LAN.x, LAN.y1, LAN.z], axis: [0, 0, -1], normal: [0, -1, 0], up: [1, 0, 0], width: w, height: w, count: 1, mullions: [1, 1],
      sky: HR.sky, skyIntensity: HR.skyI * LAN.gain, sun: false });
    if (row) row.noPane = true; }   // its panes are made with the lantern itself, not by the kit's window light
  // fires and lamps (the lights are live objects of the rig; they flicker on the world's clock)
  const FIRE = '#ff9448', LAMP = '#ffdcae';
  const LK = {
    rangeS: rigK.addLight({ position: [-18.5, -9, Z(41)], color: FIRE, intensity: 6.5, range: 46, flicker: 0.5 }),
    rangeN: rigK.addLight({ position: [-18.5, -9, Z(53)], color: FIRE, intensity: 6.5, range: 46, flicker: 0.5 }),
    hearth: rigK.addLight({ position: [-18.6, -9, Z(72.5)], color: '#ff8438', intensity: 11, range: 54, flicker: 0.6 }),
    oven: rigK.addLight({ position: [-20, -9, Z(17.75)], color: '#ff9a50', intensity: 4, range: 22, flicker: 0.2 }),
    north: rigK.addLight({ position: [-7, -3, Z(83)], color: LAMP, intensity: 5, range: 26, flicker: 0.4 }),
    northE: rigK.addLight({ position: [7, -3, Z(83)], color: LAMP, intensity: 5, range: 26, flicker: 0.4 }),
    east: rigK.addLight({ position: [6.2, -0.8, Z(60)], color: LAMP, intensity: 5, range: 30, flicker: 0.12 }),
    stair: rigK.addLight({ position: [-4.3, -7.4, Z(44.8)], color: LAMP, intensity: 4, range: 24, flicker: 0.12 }),
  };
  const LL = {
    w: rigL.addLight({ position: [-4.1, 9.3, Z(3.2)], color: LAMP, intensity: 4.5, range: 16, flicker: 0.3 }),
    e: rigL.addLight({ position: [4.1, 9.3, Z(3.2)], color: LAMP, intensity: 4.5, range: 16, flicker: 0.3 }),
    glow: rigL.addLight({ position: [0, 6.2, Z(8.6)], color: '#ffb070', intensity: 8.5, range: 26, flicker: 0.7 }),
  };
  const LP = {
    p1: rigP.addLight({ position: [0, -4.4, Z(95)], color: LAMP, intensity: 8, range: 24, flicker: 0.4 }),
    lanW: rigP.addLight({ position: [-6.5, 1.2, Z(117)], color: '#ffdca8', intensity: 8, range: 36, flicker: 0.4 }),
    lanE: rigP.addLight({ position: [6.5, 1.2, Z(117)], color: '#ffdca8', intensity: 8, range: 36, flicker: 0.4 }),
    rakeLW: rigP.addLight({ position: [-12.1, -6.2, Z(131.3)], color: LAMP, intensity: 7, range: 30, flicker: 0.45 }),
    rakeLE: rigP.addLight({ position: [12.1, -6.2, Z(131.3)], color: LAMP, intensity: 7, range: 30, flicker: 0.45 }),
    rakeHW: rigP.addLight({ position: [-12.1, 0.8, Z(131.3)], color: LAMP, intensity: 7, range: 30, flicker: 0.45 }),
    rakeHE: rigP.addLight({ position: [12.1, 0.8, Z(131.3)], color: LAMP, intensity: 7, range: 30, flicker: 0.45 }),
    portal: rigP.addLight({ position: [0, -8.4, Z(130.6)], color: '#ffe2b8', intensity: 11, range: 30, flicker: 0 }),
  };
  // ---- materials: for each rig a floor, a wall and one for everything that carries its colour per vertex ----
  const matL = { floor: INT.interiorMaterial({ rig: rigL, pattern: 'floor', mode: 4, colors: ['#a59c90', '#8f877c', '#9a938a', '#5c554c'], patA: [0.5, 0.008, 0, 0], patB: [0.22, 0, 0, 0] }),
    wall: INT.interiorMaterial({ rig: rigL, pattern: 'wall', mode: 4, colors: ['#ece8df', '#e0dbd0', '#888888', '#cfc9bc'], patA: [0, 0.66, 0.6, 0], patB: [0.08, 0.3, 0, 0] }),
    prop: INT.propMaterial({ rig: rigL }) };
  const matK = { floor: INT.interiorMaterial({ rig: rigK, pattern: 'floor', mode: 4, colors: ['#a8a094', '#8d867b', '#9a938a', '#57514a'], patA: [0.55, 0.008, 0, 0], patB: [0.3, 0, 0, 0] }),
    wall: INT.interiorMaterial({ rig: rigK, pattern: 'wall', mode: 0, colors: ['#e8e2d4', '#d6cfc0', '#888888', '#c2baa9'], patA: [0, 0.66, 1, 0], patB: [0.07, 0.3, 0, 0] }),
    prop: INT.propMaterial({ rig: rigK }) };
  const matP = { floor: INT.interiorMaterial({ rig: rigP, pattern: 'floor', mode: 3, colors: ['#b8664c', '#a4553e', '#c9a080', '#5c4a40'], patA: [0.5, 0.006, 0, 0.5], patB: [0.42, 0, 0, 0] }),
    wall: INT.interiorMaterial({ rig: rigP, pattern: 'wall', mode: 4, colors: ['#ece8df', '#e0dbd0', '#888888', '#cfc9bc'], patA: [0, 0.66, 0.6, 0], patB: [0.08, 0.3, 0, 0] }),
    prop: INT.propMaterial({ rig: rigP }) };
  const UB = new THREE.BoxGeometry(1, 1, 1);
  const cyls = new Map();
  const cylG = (n) => { let g = cyls.get(n); if (!g) { g = new THREE.CylinderGeometry(1, 1, 1, n, 1); cyls.set(n, g); } return g; };
  // box by its two corners; cylinder by centre, radius and height
  const box = (b, x0, x1, y0, y1, za, zb, c, surf, o = {}) => b.add(UB, { p: [(x0 + x1) / 2, (y0 + y1) / 2, (za + zb) / 2], s: [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(zb - za)], c, surf, ...o });
  const cyl = (b, x, y, z, r, h, c, surf, n = 10, o = {}) => b.add(cylG(n), { p: [x, y, z], s: [r, h, r], c, surf, ...o });
  await ctx.yield();
  // ---- shells: floors, walls and vaults of the four rooms ----
  const flat = (b, x0, x1, da, db, y, n = [0, 1, 0], nu = 4, nv = 4) => b.add(gridGeo(nu, nv, (u, v, o) => { o[0] = x0 + (x1 - x0) * u; o[1] = y; o[2] = Z(da + (db - da) * v); }, n));
  // a wall across the room at depth d, from x0 to x1, between two height rules; it faces `nz` (+1 south, -1 north)
  const wallX = (b, d, x0, x1, yLo, yHi, nz, nu, nv = 4, o = {}) => b.add(gridGeo(nu, nv, (u, v, p) => { const x = x0 + (x1 - x0) * u, a = typeof yLo === 'function' ? yLo(x) : yLo, t = typeof yHi === 'function' ? yHi(x) : yHi; p[0] = x; p[1] = a + (t - a) * v; p[2] = Z(d); }, [0, 0, nz]), o);
  // a wall along the room at x, from depth da to db; it faces `nx`
  const wallZ = (b, x, da, db, yLo, yHi, nx, nu, nv = 4, o = {}) => b.add(gridGeo(nu, nv, (u, v, p) => { const d = da + (db - da) * u, t = typeof yHi === 'function' ? yHi(d) : yHi; p[0] = x; p[1] = yLo + (t - yLo) * v; p[2] = Z(d); }, [nx, 0, 0]), o);
  // the inside of a round arch through a wall: head (radius r about cy) and two jambs down to yFoot
  const archReveal = (b, da, db, r, cy, yFoot, o = {}) => {
    b.add(gridGeo(12, 1, (u, v, p) => { const a = Math.PI * u; p[0] = -r * Math.cos(a); p[1] = cy + r * Math.sin(a); p[2] = Z(da + (db - da) * v); }, [0, -1, 0]), o);
    b.add(gridGeo(1, 3, (u, v, p) => { p[0] = -r; p[1] = yFoot + (cy - yFoot) * v; p[2] = Z(da + (db - da) * u); }, [1, 0, 0]), o);
    b.add(gridGeo(1, 3, (u, v, p) => { p[0] = r; p[1] = yFoot + (cy - yFoot) * v; p[2] = Z(da + (db - da) * u); }, [-1, 0, 0]), o);
  };
  const cosU = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);
  const shade = { grad: [0, 1, 1, 1] };
  // the two great fires of the west wall, by their own make: the range in the middle bay, the roasting hearth in the north
  const RNG = { d0: KD0 + BAY + 1.3, d1: KD0 + 2 * BAY - 1.3, x1: KX0 + 3.4, top: BF + 3.8 };
  const HEARTH = { d0: 63.5, d1: 81.5, x1: KX0 + 3.6, oa: 65.5, ob: 79.5, top: BF + 8.2 };
  // SMOKE ON THE WHITEWASH, one law by place for every wall and vault of the kitchen: darkest over each fire (from
  // its own top upward), thinning along the wall away from it and across the vault to just east of the crown; the
  // wash is palest by the east windows
  const smoke = (x, y, z, c) => {
    const d = z0 - z; let s = 0;
    for (const f of [RNG, HEARTH]) { const mid = (f.d0 + f.d1) / 2, half = (f.d1 - f.d0) / 2;
      s = Math.max(s, (1 - ctx.core.smoothstep(half * 0.5, half * 1.6, Math.abs(d - mid))) * ctx.core.smoothstep(f.top, f.top + 9, y)); }
    s *= 1 - ctx.core.smoothstep(KX0, KCX + 4, x);
    const k = (1 + 0.06 * ctx.core.smoothstep(KCX, KX1, x)) * (1 - 0.4 * s);
    c.r *= k; c.g *= k * (1 - 0.04 * s); c.b *= k * (1 - 0.1 * s);
  };
  {
    // THE BACK LOBBY: d 0 to 6.5 inside, x -5 to 5, floor y 3, a low brick vault (springing y 12, crown y 14)
    const lv = (x) => FL + 9 + 2 * Math.sqrt(Math.max(0, 1 - (x / 5) ** 2));
    const f = INT.makeBuilder(); flat(f, -5, 5, 0, 8, FL, [0, 1, 0], 3, 3); addMesh(f.build(), matL.floor, 'lobby-floor', far);
    const w = INT.makeBuilder();
    const dado = { c: '#6a4a40' }, up = { grad: [FL + 4.2, FL + 9, 0.9, 1] };
    for (const sx of [-1, 1]) {
      wallZ(w, 5 * sx, 0, 6.5, FL, FL + 4.2, -sx, 3, 2, dado);
      wallZ(w, 5 * sx, 0, 6.5, FL + 4.2, FL + 9, -sx, 3, 2, up);
    }
    w.add(gridGeo(12, 3, (u, v, p) => { const x = -5 + 10 * cosU(u); p[0] = x; p[1] = lv(x); p[2] = Z(6.5 * v); }, [0, -1, 0]));
    // south wall round the library's doorway (8 by 10 m), north wall round the high arch
    for (const sx of [-1, 1]) { wallX(w, 0.06, 4 * sx, 5 * sx, FL, lv, -1, 1, 4); wallX(w, 6.5, 4 * sx, 5 * sx, FL, lv, 1, 1, 4); }
    wallX(w, 0.06, -4, 4, FL + 10, lv, -1, 8, 1);
    wallX(w, 6.5, -4, 4, (x) => FL + 6 + Math.sqrt(Math.max(0, 16 - x * x)), lv, 1, 12, 1);
    archReveal(w, 6.5, 8, 4, FL + 6, FL);
    addMesh(w.build(), matL.wall, 'lobby-walls', far);
  }
  await ctx.yield();
  {
    // THE GREAT KITCHEN: d 8 to 86, x -24 to 9, floor y -13, a rib vault in three bays (springing y 4, crown y 15)
    const f = INT.makeBuilder(); flat(f, KX0, KX1, KD0, KD1, BF, [0, 1, 0], 8, 18); addMesh(f.build(), matK.floor, 'kitchen-floor', near);
    const w = INT.makeBuilder();
    const low = { grad: [BF, BF + 5, 0.84, 1], tint: smoke };
    wallZ(w, KX0, KD0, KD1, BF, vaultZ, 1, 78, 5, low);
    wallZ(w, KX1, KD0, KD1, BF, vaultZ, -1, 78, 5, low);
    await ctx.yield();
    // south wall: whole either side of the high arch, and over its head; north wall the same round the low arch
    wallX(w, KD0, KX0, -4, BF, vaultX, -1, 20, 5, low); wallX(w, KD0, 4, KX1, BF, vaultX, -1, 5, 5, low);
    wallX(w, KD0, -4, 4, (x) => FL + 6 + Math.sqrt(Math.max(0, 16 - x * x)), vaultX, -1, 12, 1);
    wallX(w, KD1, KX0, -4, BF, vaultX, 1, 20, 5, low); wallX(w, KD1, 4, KX1, BF, vaultX, 1, 5, 5, low);
    wallX(w, KD1, -4, 4, (x) => BF + 6 + Math.sqrt(Math.max(0, 16 - x * x)), vaultX, 1, 12, 3);
    archReveal(w, KD1, KD1 + 1.5, 4, BF + 6, BF);
    await ctx.yield();
    for (let bay = 0; bay < 3; bay++) {
      const da = KD0 + bay * BAY;
      // the middle bay's crown is open under the lantern: the four cells round the crown's own point are left out
      const NU = VAULT.nu, NV = VAULT.nv, open = bay === 1 ? (i, j) => (i === NU / 2 - 1 || i === NU / 2) && (j === NV / 2 - 1 || j === NV / 2) : null;
      w.add(gridGeo(NU, NV, (u, v, p) => { const x = KX0 + (KX1 - KX0) * cosU(u), d = da + BAY * cosU(v); p[0] = x; p[1] = ceilAt(x, d); p[2] = Z(d); }, [0, -1, 0], open), { grad: [VS, 15, 1.3, 1.6], tint: smoke });
      await ctx.yield();
    }
    addSplit(w.build(), matK.wall, 'kitchen-walls');
  }
  await ctx.yield();
  {
    // THE WHITE PASSAGE (d 86 to 104, x -5 to 5, barrel vault to y -2) and THE BELL HALL (d 104 to 134, x -13 to 13, 22 m high)
    const f = INT.makeBuilder(); flat(f, -5, 5, KD1, PE, BF, [0, 1, 0], 3, 5); flat(f, -HW, HW, PE, 134, BF, [0, 1, 0], 7, 8); addMesh(f.build(), matP.floor, 'passage-floor', near);
    const w = INT.makeBuilder();
    const low = { grad: [BF, BF + 4, 0.86, 1] };
    for (const sx of [-1, 1]) {
      wallZ(w, 5 * sx, KD1, PE, BF, BF + 6, -sx, 5, 3, low);
      wallZ(w, HW * sx, PE, 134, BF, HT, -sx, 8, 7, low);
      // the hall's own south wall either side of the passage's mouth (it faces north)
      wallX(w, PE, 5 * sx, HW * sx, BF, HT, -1, 3, 6, low);
    }
    w.add(gridGeo(14, 9, (u, v, p) => { const a = Math.PI * u; p[0] = -5 * Math.cos(a); p[1] = BF + 6 + 5 * Math.sin(a); p[2] = Z(KD1 + (PE - KD1) * v); }, [0, -1, 0]));
    wallX(w, PE, -5, 5, BF + 11, HT, -1, 3, 3);
    // the hall's ceiling
    flat(w, -HW, HW, PE, 134, HT, [0, -1, 0], 7, 8);
    addSplit(w.build(), matP.wall, 'passage-walls');
  }
  await ctx.yield();
  // ---- the kitchen's standing structure: landing, stair and rail, piers and ribs, window surrounds ----
  const K = INT.makeBuilder();
  const tube = (b, pts, r, c, surf, seg = 20, rad = 4, o = {}) => b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, rad, false), { c, surf, ...o });
  // a bar between two points (a box turned along it)
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  const bar = (b, p0, p1, w, h, c, surf, geo = UB) => {
    _a.set(p0[0], p0[1], p0[2]); _b.set(p1[0], p1[1], p1[2]); const len = _a.distanceTo(_b);
    _q.setFromUnitVectors(_up, _b.clone().sub(_a).normalize()); _s.set(w, len, h);
    _m.compose(_a.clone().add(_b).multiplyScalar(0.5), _q, _s); b.add(geo, { m: _m, c, surf });
  };
  {
    // the landing (d 8 to 14, x -5 to 5, top y 3) and one broad straight flight: 22 steps, 30 m of run for 16 m of fall
    box(K, -5, 5, BF, FL - 0.3, Z(8), Z(14), C.white, S_WHITE, { grad: [BF, BF + 5, 0.8, 1] });
    box(K, -5.15, 5.15, FL - 0.3, FL, Z(8), Z(14.2), '#efe6d4', S_STONE, { tint: (x, y, z, c) => { const q = (Math.floor(x / 1.7 + 40) + Math.floor(z / 1.7 + 400)) & 1; c.multiplyScalar(q ? 0.88 : 1); } });
    const NS = 22, run = 30 / NS, rise = 16 / NS;
    for (let i = 0; i < NS; i++) {
      const top = FL - (i + 1) * rise, da = 14 + i * run;
      box(K, -4, 4, BF, top - 0.22, Z(da), Z(da + run), C.white, S_WHITE, { grad: [BF, BF + 5, 0.8, 1] });
      box(K, -4.12, 4.12, top - 0.22, top, Z(da - 0.12), Z(da + run), i % 2 ? '#b3a896' : '#beb3a0', S_STONE);
    }
    // a plain iron rail: posts every second step, a top rail and a mid rail down each side, and round the landing
    const RH = 2.9, yAt = (d) => (d <= 14 ? FL : FL - (d - 14) * 16 / 30);
    for (const sx of [-1, 1]) {
      const x = 4.02 * sx, xl = 4.9 * sx;
      for (let d = 14.6; d < 44.2; d += run * 2) cyl(K, x, yAt(d) + RH / 2 - 0.3, Z(d), 0.055, RH + 0.6, '#3c3c42', S_IRON, 6);
      for (const h of [RH, RH * 0.52]) { const w = h === RH ? 0.12 : 0.07; bar(K, [x, yAt(14.6) + h, Z(14.6)], [x, yAt(44) + h, Z(44)], w, 0.09, '#3c3c42', S_IRON); bar(K, [xl, FL + h, Z(8.2)], [xl, FL + h, Z(14)], w, 0.09, '#3c3c42', S_IRON); bar(K, [xl, FL + h, Z(14)], [x, FL + h, Z(14)], w, 0.09, '#3c3c42', S_IRON); }
      for (let d = 8.4; d < 14.3; d += 1.86) cyl(K, xl, FL + RH / 2, Z(d), 0.055, RH, '#3c3c42', S_IRON, 6);
      // newel posts with brass knobs at the stair's foot
      cyl(K, x, BF + 2.1, Z(44.4), 0.22, 4.2, C.iron, S_IRON, 8); K.add(new THREE.SphereGeometry(0.36, 10, 8), { p: [x, BF + 4.45, Z(44.4)], c: C.brass, surf: S_BRASS });
    }
  }
  await ctx.yield();
  {
    // wall piers at the bay lines and corners, stone caps at the springing, and the ribs of the vault
    const ribC = '#a99c86';
    for (const d of [KD0 + 0.9, KD0 + BAY, KD0 + 2 * BAY, KD1 - 0.9]) for (const sx of [-1, 1]) {
      const xw = sx < 0 ? KX0 : KX1, x1 = xw - sx * 1.3;
      box(K, xw, x1, BF, VS - 0.6, Z(d - 1.25), Z(d + 1.25), C.white, S_WHITE, { grad: [BF, BF + 5, 0.82, 1] });
      box(K, xw, x1 - sx * 0.25, VS - 0.6, VS + 0.2, Z(d - 1.5), Z(d + 1.5), ribC, S_STONE);
      box(K, xw, x1 - sx * 0.12, BF, BF + 1.1, Z(d - 1.37), Z(d + 1.37), '#a39a8c', S_STONE);
    }
    // THE RIBS, one on every line of the vault, each springing from inside a pier's cap: across at the bay lines and
    // the end walls; along every groin, corner to corner of its bay; along the crown of the long vault and across
    // every bay at its own crown (the ridges); along every lunette of the side walls. Where the lantern stands they
    // stop at its curb. `prof` gives points from one springing to the other, closest together where the curve turns.
    const prof = (n, fn, i0 = 0, i1 = n) => Array.from({ length: i1 - i0 + 1 }, (_, k) => fn(-Math.cos(Math.PI * (i0 + k) / n)));
    const lanD = z0 - LAN.z, lanA = LAN.curb * Math.cos(Math.PI / 8), atLan = (d) => Math.abs(d - lanD) < 1e-6;
    for (const d of [KD0 + 0.5, KD0 + BAY, KD0 + 2 * BAY, KD1 - 0.5]) tube(K, prof(18, (s) => [KCX + s * (KHW - 0.3), VS + VR * Math.sqrt(1 - s * s) - 0.25, Z(d)]), 0.55, ribC, S_STONE, 30, 4);
    await ctx.yield();
    const bayMid = [0, 1, 2].map((bay) => KD0 + (bay + 0.5) * BAY);
    for (const dc of bayMid) for (const sg of [-1, 1]) {
      const groin = (s) => [KCX + s * (KHW - 0.3), VS + VR * Math.sqrt(1 - s * s) - 0.2, Z(dc + sg * s * (BAY / 2 - 0.3))];
      // under the lantern each groin rib is two halves that end at the curb (the points nearest the crown left out)
      if (atLan(dc)) { tube(K, prof(18, groin, 0, 8), 0.42, ribC, S_STONE, 15, 4); tube(K, prof(18, groin, 10, 18), 0.42, ribC, S_STONE, 15, 4); }
      else tube(K, prof(18, groin), 0.42, ribC, S_STONE, 30, 4);
    }
    await ctx.yield();
    // the ridges: square ribs RW either side of the crown line and 0.55 m deep under it; pieces run from boss to boss
    { const RW = 0.3, y0 = VS + VR - 0.55, y1 = VS + VR + 0.05, stops = [KD0, ...bayMid.flatMap((dc) => [dc, dc + BAY / 2])];
      const cut = (d, to) => (atLan(d) ? d + Math.sign(to - d) * lanA : d);
      for (let i = 0; i + 1 < stops.length; i++) box(K, KCX - RW, KCX + RW, y0, y1, Z(cut(stops[i], stops[i + 1])), Z(cut(stops[i + 1], stops[i])), ribC, S_STONE);
      for (const dc of bayMid) { const gap = atLan(dc) ? lanA : 0;
        box(K, KX0, KCX - gap, y0, y1, Z(dc - RW), Z(dc + RW), ribC, S_STONE); box(K, KCX + gap, KX1, y0, y1, Z(dc - RW), Z(dc + RW), ribC, S_STONE); } }
    // the wall ribs: a roll along the lunette of every bay on both side walls
    for (const dc of bayMid) for (const sx of [-1, 1]) { const xw = (sx < 0 ? KX0 : KX1) - sx * 0.22;
      tube(K, prof(12, (s) => [xw, VS + VR * Math.sqrt(1 - s * s) - 0.28, Z(dc + s * (BAY / 2 - 0.35))]), 0.3, ribC, S_STONE, 12, 3); }
    await ctx.yield();
    // a carved boss wherever ribs meet at a crown: at the middle of every bay but the lantern's, and under the two
    // bay lines' ribs where the long ridge crosses them. One shape: a rosette of eight lobes, darker in its hollows.
    { const G_BOSS = new THREE.LatheGeometry([[0, -0.62], [0.45, -0.55], [0.85, -0.3], [1, 0.05], [0.75, 0.3]].map((p) => new THREE.Vector2(p[0], p[1])), 16), P = G_BOSS.attributes.position;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), f = 1 + 0.13 * Math.cos(8 * Math.atan2(z, x)); P.setX(i, x * f); P.setZ(i, z * f); }
      G_BOSS.computeVertexNormals();
      const lobes = (X, Y, Zw, c, x, y, z) => { c.multiplyScalar(0.7 + 0.36 * (0.5 + 0.5 * Math.cos(8 * Math.atan2(z, x))) * Math.min(1, 0.3 + 2 * Math.hypot(x, z))); };
      for (const dc of bayMid) if (!atLan(dc)) K.add(G_BOSS, { p: [KCX, VS + VR - 0.5, Z(dc)], s: 1.05, c: '#d8cdb6', surf: S_STONE, tint: lobes });
      for (const d of [KD0 + BAY, KD0 + 2 * BAY]) K.add(G_BOSS, { p: [KCX, VS + VR - 0.75, Z(d)], s: 0.9, c: '#d8cdb6', surf: S_STONE, tint: lobes }); }
    await ctx.yield();
    // the four high east windows: stone surrounds, sills and glazing bars proud of the wall
    for (let i = 0; i < WIN.n; i++) {
      const d = WIN.d0 + i * WIN.sp, x = KX1, yb = WIN.cy - WIN.h / 2, ys = WIN.cy + WIN.h / 2 - WIN.w / 2, r = WIN.w / 2 + 0.3;
      for (const s of [-1, 1]) box(K, x, x - 0.5, yb, ys, Z(d + s * r - 0.3), Z(d + s * r + 0.3), ribC, S_STONE);
      box(K, x, x - 0.9, yb - 0.6, yb, Z(d - r - 0.6), Z(d + r + 0.6), ribC, S_STONE);
      tube(K, Array.from({ length: 11 }, (_, k) => { const a = Math.PI * k / 10; return [x - 0.25, ys + r * Math.sin(a), Z(d - r * Math.cos(a))]; }), 0.34, ribC, S_STONE, 14, 4);
    }
  }
  await ctx.yield();
  // ---- the west wall: bread oven (south bay), the range in its chimney arch (middle bay), the roasting hearth (north bay) ----
  const fires = [], lampFlames = [], glowPts = [], halos = [], pools = [];
  // every thing that steams gives its mouth's place and radius here, where it is made: [x, y, z, r]
  const steamers = [];
  const grateD = [0.14, 0.38, 0.62, 0.86].map((t) => RNG.d0 + (RNG.d1 - RNG.d0) * t);
  {
    const rr = R.range;
    // the black iron range: body, overhanging top plate, a brass rail, four fire grates, oven doors between them
    box(K, KX0, RNG.x1, BF, RNG.top - 0.25, Z(RNG.d0), Z(RNG.d1), C.iron, S_IRON);
    box(K, KX0, RNG.x1 + 0.35, RNG.top - 0.25, RNG.top, Z(RNG.d0 - 0.1), Z(RNG.d1 + 0.1), '#34343a', S_IRON);
    bar(K, [RNG.x1 + 0.75, RNG.top - 0.7, Z(RNG.d0 + 0.3)], [RNG.x1 + 0.75, RNG.top - 0.7, Z(RNG.d1 - 0.3)], 0.14, 0.14, C.brass, S_BRASS, cylG(8));
    for (let d = RNG.d0 + 0.3; d < RNG.d1; d += 2.8) bar(K, [RNG.x1, RNG.top - 0.7, Z(d)], [RNG.x1 + 0.75, RNG.top - 0.7, Z(d)], 0.1, 0.1, C.brass, S_BRASS);
    grateD.forEach((d, i) => {
      box(K, RNG.x1 - 0.5, RNG.x1 + 0.04, BF + 0.9, BF + 2.5, Z(d - 1.3), Z(d + 1.3), '#ff7a2a', SF(SURF.PLAIN, 0.1, 0, 2.6));
      for (let k = -2; k <= 2; k++) box(K, RNG.x1 + 0.02, RNG.x1 + 0.16, BF + 0.8, BF + 2.6, Z(d + k * 0.52 - 0.07), Z(d + k * 0.52 + 0.07), '#1c1c20', S_IRON);
      box(K, RNG.x1, RNG.x1 + 0.5, BF + 0.45, BF + 0.8, Z(d - 1.5), Z(d + 1.5), '#26262a', S_IRON);
      fires.push({ position: [RNG.x1 + 0.1, BF + 1.0, Z(d)], width: 2.2, height: 1.9, tongues: 5, embers: 5 });
      glowPts.push([RNG.x1 + 0.5, BF + 1.7, Z(d), 5.5]);
      // an oven door with brass hinges and a handle between this grate and the next
      const dd = d + (RNG.d1 - RNG.d0) * 0.12;
      if (i < 3) { box(K, RNG.x1, RNG.x1 + 0.12, BF + 0.7, BF + 3.0, Z(dd - 1.0), Z(dd + 1.0), '#303036', S_IRON); box(K, RNG.x1 + 0.12, RNG.x1 + 0.3, BF + 1.75, BF + 1.95, Z(dd - 0.6), Z(dd + 0.6), C.brass, S_BRASS);
        for (const s of [-1, 1]) box(K, RNG.x1 + 0.1, RNG.x1 + 0.2, BF + 1.0 + (s > 0 ? 1.4 : 0), BF + 1.25 + (s > 0 ? 1.4 : 0), Z(dd - 1.0), Z(dd - 0.55), C.brass, S_BRASS); }
    });
    // hot plates on the top, a tiled splash back, a plate shelf and the iron hood from pier to pier
    for (let d = RNG.d0 + 1.6; d < RNG.d1 - 1; d += 2.7) { cyl(K, KX0 + 1.9, RNG.top + 0.02, Z(d), 0.95, 0.06, '#1e1e22', S_IRON, 14); steamers.push([KX0 + 1.9, RNG.top + 1.5, Z(d), 0.8]); }   // a stockpot or a kettle stands on every hot plate
    box(K, KX0, KX0 + 0.12, RNG.top, BF + 9, Z(RNG.d0), Z(RNG.d1), '#d9d4c8', S_CHINA, { tint: (x, y, z, c) => { const q = (Math.floor(y * 1.1) + Math.floor(z * 1.1)) & 1; c.multiplyScalar(q ? 0.86 : 1); } });
    box(K, KX0, KX0 + 1.1, BF + 7.2, BF + 7.45, Z(RNG.d0), Z(RNG.d1), '#33333a', S_IRON);
    K.add(gridGeo(1, 10, (u, v, p) => { p[0] = KX0 + 0.1 + 3.9 * u; p[1] = BF + 12.6 - 2.6 * u; p[2] = Z(RNG.d0 - 1.2 + (RNG.d1 - RNG.d0 + 2.4) * v); }, [0.5, -1, 0]), { c: '#2c2c31', surf: S_IRON });
    box(K, KX0 + 3.9, KX0 + 4.05, BF + 9.3, BF + 10.1, Z(RNG.d0 - 1.2), Z(RNG.d1 + 1.2), '#35353b', S_IRON);
    box(K, KX0, KX0 + 4, BF + 9.3, BF + 12.5, Z(RNG.d0 - 1.3), Z(RNG.d0 - 1.2), '#2c2c31', S_IRON); box(K, KX0, KX0 + 4, BF + 9.3, BF + 12.5, Z(RNG.d1 + 1.2), Z(RNG.d1 + 1.3), '#2c2c31', S_IRON);
    await ctx.yield();
    // THE ROASTING HEARTH: a chimney breast with a great arched opening, a sooty back, an iron fire basket
    const H = HEARTH;
    for (const [a, b2] of [[H.d0, H.oa], [H.ob, H.d1]]) box(K, KX0, H.x1, BF, VS + 2, Z(a), Z(b2), C.white, S_WHITE, { grad: [BF, BF + 6, 0.8, 1] });
    box(K, KX0, H.x1, H.top, VS + 2, Z(H.oa), Z(H.ob), C.white, S_WHITE, { tint: (x, y, z, c) => { c.multiplyScalar(0.62 + 0.38 * ctx.core.smoothstep(H.top, H.top + 7, y)); } });
    tube(K, Array.from({ length: 13 }, (_, k) => { const a = Math.PI * k / 12; return [H.x1 + 0.05, H.top - 1.6 + 1.9 * Math.sin(a), Z((H.oa + H.ob) / 2 - (H.ob - H.oa) / 2 * Math.cos(a))]; }), 0.5, '#bdb3a2', S_STONE, 16, 4);
    box(K, KX0 + 0.15, KX0 + 0.3, BF, H.top, Z(H.oa), Z(H.ob), '#241d19', S_MATTE);
    box(K, KX0, H.x1 + 1.4, BF, BF + 0.35, Z(H.d0 - 0.4), Z(H.d1 + 0.4), '#8f877c', S_STONE);
    const fd = (H.oa + H.ob) / 2;
    for (let k = -5; k <= 5; k++) box(K, KX0 + 1.0, KX0 + 2.5, BF + 0.35, BF + 2.0, Z(fd + k * 0.9 - 0.07), Z(fd + k * 0.9 + 0.07), '#18181c', S_IRON);
    box(K, KX0 + 0.9, KX0 + 2.6, BF + 1.0, BF + 1.2, Z(fd - 4.8), Z(fd + 4.8), '#18181c', S_IRON);
    box(K, KX0 + 0.9, KX0 + 2.4, BF + 0.5, BF + 1.5, Z(fd - 4.5), Z(fd + 4.5), '#ff6a20', SF(SURF.PLAIN, 0.1, 0, 3.2));
    fires.push({ position: [KX0 + 1.7, BF + 1.3, Z(fd)], width: 7.2, height: 3.4, tongues: 9, embers: 22 });
    glowPts.push([KX0 + 2.6, BF + 3, Z(fd), 11]);
    // a copper dripping pan under the spits, and a smoke-jack bracket over the arch
    box(K, KX0 + 3.0, KX0 + 5.2, BF + 0.35, BF + 0.75, Z(fd - 5.2), Z(fd + 5.2), C.copper, S_COPPER);
    await ctx.yield();
    // THE BREAD OVEN: a whitewashed mass with a brick arch and an iron door, peels leaning beside it, racks of loaves
    const O = { d0: 12.5, d1: 23, x1: KX0 + 3.2 };
    box(K, KX0, O.x1, BF, BF + 9.5, Z(O.d0), Z(O.d1), C.white, S_WHITE, { grad: [BF, BF + 6, 0.82, 1] });
    box(K, KX0, O.x1 + 0.2, BF + 9.5, BF + 10, Z(O.d0 - 0.2), Z(O.d1 + 0.2), '#cfc5b2', S_STONE);
    const od = (O.d0 + O.d1) / 2;
    tube(K, Array.from({ length: 11 }, (_, k) => { const a = Math.PI * k / 10; return [O.x1 + 0.05, BF + 4.3 + 1.7 * Math.sin(a), Z(od - 1.9 * Math.cos(a))]; }), 0.34, '#a8553c', SF(SURF.STONE, 0.1), 12, 4);
    box(K, O.x1, O.x1 + 0.14, BF + 2.6, BF + 5.6, Z(od - 1.6), Z(od + 1.6), '#232327', S_IRON);
    box(K, O.x1 + 0.14, O.x1 + 0.34, BF + 4.0, BF + 4.2, Z(od - 0.9), Z(od + 0.9), C.brass, S_BRASS);
    box(K, O.x1, O.x1 + 0.1, BF + 0.8, BF + 1.8, Z(od - 1.0), Z(od + 1.0), '#232327', S_IRON);
    box(K, O.x1 - 0.2, O.x1 + 0.02, BF + 2.7, BF + 2.95, Z(od - 1.4), Z(od + 1.4), '#ff8a40', SF(SURF.PLAIN, 0.1, 0, 2.2));
    steamers.push([O.x1 + 0.45, BF + 5.6, Z(od), 1]);   // the oven's mouth: the head of its iron door
    for (let k = 0; k < 3; k++) { const d = O.d1 + 0.7 + k * 0.5, len = 9 + rr.range(-1, 1.5); bar(K, [KX0 + 2.2 + k * 0.25, BF, Z(d)], [KX0 + 0.25, BF + len, Z(d + 0.2)], 0.14, 0.14, C.deal, S_DEAL, cylG(6)); bar(K, [KX0 + 0.42, BF + len - 1.9, Z(d + 0.18)], [KX0 + 0.2, BF + len + 0.1, Z(d + 0.2)], 1.1, 0.07, '#cfa878', S_DEAL); }
  }
  await ctx.yield();
  // ---- small shapes shared by everything that stands on a table or a shelf ----
  const SPH8 = new THREE.SphereGeometry(1, 8, 6), SPH6 = new THREE.SphereGeometry(1, 6, 4);
  const lathe = (pts, seg = 10) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  const G_BOWL = lathe([[0, 0], [0.55, 0], [0.95, 0.5], [1, 0.62], [0.9, 0.6], [0, 0.42]], 10);
  const G_CROCK = lathe([[0, 0], [0.8, 0], [1, 0.5], [1, 1.6], [0.8, 1.9], [0.62, 2], [0, 1.96]], 10);
  const G_LOAF = new THREE.SphereGeometry(1, 8, 5);
  const G_POT = lathe([[0, 0], [0.5, 0], [0.9, 0.35], [1, 0.8], [0.8, 1.25], [0.42, 1.42], [0.32, 1.5], [0, 1.52]], 10);
  const G_DOME = lathe([[1, 0], [0.96, 0.3], [0.75, 0.62], [0.4, 0.82], [0, 0.88]], 10);
  const LOAF_C = ['#c98a48', '#b87838', '#d69a58', '#a86a30'];
  const loafV = (b, x, y, z, s, ry, w, c) => b.add(G_LOAF, { p: [x, y + s * 0.42, z], r: [0, ry, 0], s: [s * (0.9 + w * 0.5), s * 0.5, s * 0.62], c, surf: S_BREAD, grad: [y, y + s * 0.8, 0.8, 1.12] });
  const loaf = (b, x, y, z, s, ry, rr) => { const w = rr(), c = rr.pick(LOAF_C); return loafV(b, x, y, z, s, ry, w, c); };
  const teapot = (b, x, y, z, s, ry, band) => {
    b.add(G_POT, { p: [x, y, z], s: [s, s, s], c: C.china, surf: S_CHINA });
    b.add(cylG(10), { p: [x, y + s * 0.82, z], s: [s * 1.01, s * 0.16, s * 1.01], c: band, surf: S_CHINA });
    const cx = Math.cos(ry), sz = Math.sin(ry);
    bar(b, [x + cx * s * 0.85, y + s * 0.55, z + sz * s * 0.85], [x + cx * s * 1.65, y + s * 1.15, z + sz * s * 1.65], s * 0.13, s * 0.13, C.china, S_CHINA, cylG(6));
    b.add(new THREE.TorusGeometry(0.42, 0.09, 5, 8), { p: [x - cx * s * 1.0, y + s * 0.78, z - sz * s * 1.0], r: [0, -ry, 0], s: [s, s, s], c: C.china, surf: S_CHINA });
    b.add(SPH6, { p: [x, y + s * 1.56, z], s: [s * 0.14, s * 0.14, s * 0.14], c: band, surf: S_CHINA });
  };
  const table = (b, dc, top, legC) => {
    const x0 = -13.5, x1 = -8.5, da = dc - 8, db = dc + 8, yt = BF + 3.6;
    box(b, x0, x1, yt - 0.34, yt, Z(da), Z(db), top.c, top.surf);
    box(b, x0 + 0.3, x1 - 0.3, yt - 1.05, yt - 0.34, Z(da + 0.3), Z(db - 0.3), legC, S_DEAL);
    for (const x of [x0 + 0.55, x1 - 0.55]) for (const d of [da + 0.6, dc, db - 0.6]) box(b, x - 0.3, x + 0.3, BF, yt - 1.05, Z(d - 0.3), Z(d + 0.3), legC, S_DEAL);
    box(b, x0 + 0.5, x1 - 0.5, BF + 0.75, BF + 0.95, Z(da + 0.5), Z(db - 0.5), legC, S_DEAL);
    for (let d = da + 2; d < db - 1; d += 4) { box(b, x1 - 0.32, x1 - 0.26, yt - 0.95, yt - 0.45, Z(d - 1.5), Z(d + 1.5), '#c9a878', S_DEAL); b.add(SPH6, { p: [x1 - 0.2, yt - 0.7, Z(d)], s: [0.12, 0.12, 0.12], c: C.brass, surf: S_BRASS }); }
    return yt;
  };
  const TB = [KD0 + BAY / 2, KD0 + 1.5 * BAY, KD0 + 2.5 * BAY];
  {
    const rt = R.tables, n6 = () => rt.range(-1, 1);
    // TABLE ONE (south): scrubbed deal: loaves just out, a pyramid of oranges, bowls of eggs, baskets, a brass scale
    let yt = table(K, TB[0], { c: C.deal, surf: S_DEAL }, '#c4a070');
    for (let i = 0; i < Math.round(9 * dens); i++) loaf(K, -11 + n6() * 1.7, yt, Z(TB[0] - 6.6 + i * 0.62 + n6() * 0.1), 0.95 + rt() * 0.35, rt() * 3, rt);
    const oz = TB[0] + 0.6 + n6() * 0.8, ox = -11.2;
    box(K, ox - 1.5, ox + 1.5, yt, yt + 0.12, Z(oz - 1.5), Z(oz + 1.5), '#8a5a34', S_OAK);
    for (let l = 0; l < 4; l++) for (let i = 0; i < 4 - l; i++) for (let j = 0; j < 4 - l; j++) K.add(SPH6, { p: [ox + (i - (3 - l) / 2) * 0.66, yt + 0.42 + l * 0.5, Z(oz + (j - (3 - l) / 2) * 0.66)], s: [0.34, 0.33, 0.34], c: rt.pick(['#ff9a2a', '#f58a1c', '#ffa63a']), surf: SF(SURF.PLAIN, 0.3) });
    for (let k = 0; k < 2; k++) { const bx = -12 + k * 2.2, bz = TB[0] + 3.4 + k * 1.1; K.add(G_BOWL, { p: [bx, yt, Z(bz)], s: [0.95, 0.95, 0.95], c: k ? C.china : '#d9c9a8', surf: S_CHINA });
      for (let e = 0; e < 9; e++) K.add(SPH6, { p: [bx + Math.cos(e * 2.4) * 0.45 * (e % 3) * 0.5, yt + 0.5 + (e % 2) * 0.1, Z(bz + Math.sin(e * 2.4) * 0.45 * (e % 3) * 0.5)], s: [0.17, 0.22, 0.17], c: e % 3 ? '#e9d9bf' : '#d9b890', surf: S_BREAD }); }
    for (let k = 0; k < 2; k++) { const bx = -10.3 - k * 1.9, bz = TB[0] + 6.2 - k * 0.4; K.add(G_BOWL, { p: [bx, yt, Z(bz)], s: [1.15, 1.5, 0.9], c: '#a9824c', surf: SF(SURF.FABRIC, 0.05) }); for (let e = 0; e < 5; e++) loaf(K, bx + n6() * 0.4, yt + 0.6, Z(bz + n6() * 0.3), 0.42, rt() * 3, rt); }
    // a brass scale: a pillar, a beam and two pans
    { const sx = -9.6, sz = Z(TB[0] - 1.6); cyl(K, sx, yt + 0.12, sz, 0.55, 0.24, C.brass, S_BRASS, 10); cyl(K, sx, yt + 1.0, sz, 0.09, 1.6, C.brass, S_BRASS, 6); bar(K, [sx, yt + 1.75, sz - 1.15], [sx, yt + 1.75, sz + 1.15], 0.08, 0.08, C.brass, S_BRASS);
      for (const s of [-1, 1]) { K.add(G_BOWL, { p: [sx, yt + 0.72, sz + s * 1.1], s: [0.55, 0.45, 0.55], c: C.brass, surf: S_BRASS }); bar(K, [sx, yt + 1.75, sz + s * 1.1], [sx, yt + 1.0, sz + s * 1.1], 0.03, 0.03, C.brass, S_BRASS); } }
    await ctx.yield();
    // TABLE TWO (middle): a marble pastry slab: rolling pins, a floured board, bowls; the copper moulds are dealt with the copper
    yt = table(K, TB[1], { c: '#d9d6d0', surf: SF(SURF.STONE, 0.6) }, '#c4a070');
    for (let k = 0; k < 3; k++) { const d = TB[1] - 5.5 + k * 1.3, x = -11.5 + n6() * 0.8, a = n6() * 0.5; bar(K, [x - 1.3 * Math.cos(a), yt + 0.2, Z(d - 1.3 * Math.sin(a))], [x + 1.3 * Math.cos(a), yt + 0.2, Z(d + 1.3 * Math.sin(a))], 0.2, 0.2, '#c79a62', S_DEAL, cylG(8));
      bar(K, [x - 1.8 * Math.cos(a), yt + 0.2, Z(d - 1.8 * Math.sin(a))], [x + 1.8 * Math.cos(a), yt + 0.2, Z(d + 1.8 * Math.sin(a))], 0.08, 0.08, '#a87a48', S_DEAL, cylG(6)); }
    box(K, -12.8, -9.4, yt, yt + 0.1, Z(TB[1] + 1.2), Z(TB[1] + 4.0), '#e6dccb', S_MATTE);
    K.add(G_LOAF, { p: [-11.1, yt + 0.3, Z(TB[1] + 2.6)], s: [1.2, 0.3, 0.95], c: '#ead9b5', surf: S_BREAD });
    for (let k = 0; k < 3; k++) K.add(G_BOWL, { p: [-12.2 + k * 1.45, yt, Z(TB[1] + 5.8 + n6() * 0.4)], s: [0.8, 0.85, 0.8], c: k === 1 ? '#d8c39a' : C.china, surf: S_CHINA });
    await ctx.yield();
    // TABLE THREE (north): a rank of tea trays ready to go up: teapots, covered dishes, toast racks, white and cobalt china
    yt = table(K, TB[2], { c: C.deal, surf: S_DEAL }, '#c4a070');
    for (let k = 0; k < 6; k++) {
      const d = TB[2] - 6.6 + k * 2.64, x = -11 + n6() * 0.25, zc = Z(d), band = k % 3 === 2 ? '#2a58b8' : C.cobalt;
      box(K, x - 2.0, x + 2.0, yt, yt + 0.1, zc - 1.12, zc + 1.12, k % 2 ? '#3a2418' : '#b9bcc2', k % 2 ? S_OAK : S_STEEL);
      teapot(K, x - 1.05, yt + 0.1, zc + 0.35, 0.52, 0.6 + n6() * 0.5, band); steamers.push([x - 1.05, yt + 0.1 + 0.52 * 1.5, zc + 0.35, 0.22]);
      K.add(cylG(10), { p: [x + 0.5, yt + 0.14, zc + 0.35], s: [0.62, 0.07, 0.62], c: C.china, surf: S_CHINA }); K.add(G_DOME, { p: [x + 0.5, yt + 0.17, zc + 0.35], s: [0.5, 0.5, 0.5], c: '#c9ccd2', surf: S_STEEL });
      K.add(SPH6, { p: [x + 0.5, yt + 0.64, zc + 0.35], s: [0.08, 0.08, 0.08], c: C.brass, surf: S_BRASS });
      for (let c2 = 0; c2 < 2; c2++) { const cx = x - 0.4 + c2 * 1.6, cz = zc - 0.5; K.add(cylG(10), { p: [cx, yt + 0.13, cz], s: [0.4, 0.05, 0.4], c: C.china, surf: S_CHINA }); K.add(G_BOWL, { p: [cx, yt + 0.15, cz], s: [0.27, 0.42, 0.27], c: C.china, surf: S_CHINA }); K.add(cylG(10), { p: [cx, yt + 0.33, cz], s: [0.275, 0.07, 0.275], c: band, surf: S_CHINA }); }
      // a toast rack: silver hoops on a base
      box(K, x + 1.1, x + 1.8, yt + 0.1, yt + 0.16, zc + 0.05, zc + 0.75, '#c9ccd2', S_STEEL);
      for (let h = 0; h < 4; h++) { const hz = zc + 0.14 + h * 0.18; box(K, x + 1.16, x + 1.74, yt + 0.16, yt + 0.62, hz, hz + 0.035, '#d9dce2', S_STEEL); box(K, x + 1.2, x + 1.7, yt + 0.18, yt + 0.56, hz + 0.05, hz + 0.13, '#c99a58', S_BREAD); }
    }
  }
  await ctx.yield();
  // an oil lamp on an iron bracket: wall plate, arm, brass font, a glowing glass chimney, a flame; (dx, dz) points off the wall
  const lamp = (b, x, y, z, dx, dz, s = 1) => {
    const k = 0.6 * s, lx = x + dx * 0.8 * k, lz = z + dz * 0.8 * k;
    box(b, x - 0.04 - Math.abs(dz) * 0.14 * k, x + 0.04 + Math.abs(dz) * 0.14 * k, y - 0.7 * k, y + 0.1 * k, z - 0.04 - Math.abs(dx) * 0.14 * k, z + 0.04 + Math.abs(dx) * 0.14 * k, '#4a3a22', S_BRASS);
    bar(b, [x, y - 0.5 * k, z], [lx, y - 0.2 * k, lz], 0.05 * k, 0.05 * k, C.brass, S_BRASS);
    b.add(SPH8, { p: [lx, y - 0.02 * k, lz], s: [0.24 * k, 0.17 * k, 0.24 * k], c: C.brass, surf: S_BRASS });
    b.add(cylG(8), { p: [lx, y + 0.19 * k, lz], s: [0.13 * k, 0.07 * k, 0.13 * k], c: C.brass, surf: S_BRASS });
    b.add(cylG(8), { p: [lx, y + 0.6 * k, lz], s: [0.1 * k, 0.78 * k, 0.1 * k], c: '#ffe6b8', surf: SF(SURF.PLAIN, 0.7, 0, 1.3) });
    lampFlames.push([lx, y + 0.42 * k, lz, 0.42 * k]); glowPts.push([lx, y + 0.5 * k, lz, 2.6 * s]); halos.push([x, y + 0.45 * k, z, dx, dz, 1.3 + 1.5 * k]);
  };
  const DR = { x0: 7, xs: 7.7, x1: KX1, y0: BF + 3.2, top: BF + 10, halves: [[38, KD0 + 2 * BAY - 1.25], [KD0 + 2 * BAY + 1.25, 82]], sh: [BF + 3.2, BF + 4.7, BF + 6.0, BF + 7.15, BF + 8.15, BF + 9.1] };
  {
    const rcr = R.crocks, rl = R.loaves, deal = '#d6b888', dark = '#3a261a';
    // THE DRESSER on the east wall: two halves either side of the pier, 44 m in all and 10 m tall: a pot board with crocks,
    // a band of drawers, a worktop, five shelves over it on a dark back, a cornice
    for (const [da, db] of DR.halves) {
      box(K, 8.8, DR.x1, DR.y0, DR.top, Z(da), Z(db), dark, S_OAK);
      box(K, DR.x0 - 0.15, DR.x1, DR.y0 - 0.26, DR.y0, Z(da - 0.15), Z(db + 0.15), deal, S_DEAL);
      box(K, DR.x0, DR.x1, BF + 2.0, DR.y0 - 0.26, Z(da), Z(db), '#c9a676', S_DEAL);
      box(K, DR.x0, DR.x1, BF + 0.55, BF + 0.75, Z(da), Z(db), deal, S_DEAL);
      box(K, DR.xs - 0.35, DR.x1, DR.top - 0.3, DR.top + 0.1, Z(da - 0.2), Z(db + 0.2), deal, S_DEAL);
      for (let k = 1; k < DR.sh.length; k++) box(K, DR.xs, DR.x1, DR.sh[k] - 0.14, DR.sh[k], Z(da), Z(db), deal, S_DEAL);
      const nb = 3, bw = (db - da) / nb;
      for (let i = 0; i <= nb; i++) { const d = da + i * bw; box(K, DR.xs - 0.05, DR.x1, DR.y0, DR.top, Z(d - 0.11), Z(d + 0.11), deal, S_DEAL); box(K, DR.x0, DR.x0 + 0.3, BF, BF + 2.0, Z(d - 0.15), Z(d + 0.15), '#c9a676', S_DEAL); }
      for (let d = da + 1.15; d < db - 0.5; d += 2.3) { box(K, DR.x0 - 0.05, DR.x0, BF + 2.15, DR.y0 - 0.42, Z(d - 1.0), Z(d + 1.0), '#d9bb8c', S_DEAL); K.add(SPH6, { p: [DR.x0 - 0.12, BF + 2.55, Z(d)], s: [0.13, 0.13, 0.13], c: C.brass, surf: S_BRASS }); }
      // stoneware crocks on the pot board
      for (let d = da + 1.0; d < db - 0.6; d += 1.55) { const s = 0.42 + rcr() * 0.2, keep = rcr() < 0.86, ox = rcr() * 0.5, oz = rcr() * 0.3, hk = 0.62 + rcr() * 0.25, cc = rcr.pick(['#c9b48c', '#b89a6a', '#d6c8a8', '#8a6444']); if (keep) K.add(G_CROCK, { p: [DR.x0 + 0.9 + ox, BF + 0.75, Z(d + oz)], s: [s, s * hk, s], c: cc, surf: SF(SURF.PLAIN, 0.55), grad: [BF + 0.75, BF + 2, 1, 0.78] }); }
      await ctx.yield();
    }
    // racks of loaves just out, on the west wall north of the oven
    { const da = 24.4, db = 32, x0 = KX0, x1 = KX0 + 1.5;
      for (const d of [da, (da + db) / 2, db]) box(K, x0, x1, BF, BF + 6.2, Z(d - 0.1), Z(d + 0.1), deal, S_DEAL);
      for (let k = 0; k < 4; k++) { const y = BF + 1.3 + k * 1.4; box(K, x0, x1, y - 0.1, y, Z(da), Z(db), deal, S_DEAL);
        for (let d = da + 0.7; d < db - 0.4; d += 1.05) { const keep = rl() < 0.88 * Math.min(1, dens), ox = rl() * 0.12, s = 0.5 + rl() * 0.14, ry = 1.57 + rl() * 0.3, w = rl(), cc = rl.pick(LOAF_C); if (keep) loafV(K, x0 + 0.75 + ox, y, Z(d), s, ry, w, cc); } } }
    // the wall clock: a plain white dial with ticks only, two hands, a trunk below for the pendulum
    { const cx = -10.5, cy = BF + 9.4, cz = Z(KD1) + 0.2;
      box(K, cx - 0.75, cx + 0.75, cy - 4.6, cy - 1.4, cz, cz + 0.5, '#4a2a1a', S_OAK);
      K.add(cylG(20), { p: [cx, cy, cz + 0.2], r: [Math.PI / 2, 0, 0], s: [1.95, 0.5, 1.95], c: '#4a2a1a', surf: S_OAK });
      K.add(cylG(20), { p: [cx, cy, cz + 0.42], r: [Math.PI / 2, 0, 0], s: [1.65, 0.1, 1.65], c: '#efe9da', surf: S_CHINA });
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, r0 = k % 3 ? 1.38 : 1.25; bar(K, [cx + Math.sin(a) * r0, cy + Math.cos(a) * r0, cz + 0.49], [cx + Math.sin(a) * 1.55, cy + Math.cos(a) * 1.55, cz + 0.49], k % 3 ? 0.06 : 0.11, 0.03, '#1c1c20', S_MATTE); }
      const ha = R.clock() * 6.28, hb = R.clock() * 6.28;
      bar(K, [cx, cy, cz + 0.53], [cx + Math.sin(ha) * 0.95, cy + Math.cos(ha) * 0.95, cz + 0.53], 0.13, 0.03, '#1c1c20', S_IRON); bar(K, [cx, cy, cz + 0.56], [cx + Math.sin(hb) * 1.4, cy + Math.cos(hb) * 1.4, cz + 0.56], 0.08, 0.03, '#1c1c20', S_IRON);
    }
    // lamps: either side of the north arch, on the east pier, and on the newels at the stair's foot
    lamp(K, -8.3, BF + 12.2, Z(KD1) + 0.02, 0, 1, 1.3); lamp(K, 8.2, BF + 12.2, Z(KD1) + 0.02, 0, 1, 1.3);
    lamp(K, KX1 - 1.3, BF + 11.6, Z(KD0 + 2 * BAY), -1, 0, 1.3);
    for (const sx of [-1, 1]) { K.add(cylG(8), { p: [4.02 * sx, BF + 5.5, Z(44.4)], s: [0.2, 1.0, 0.2], c: '#ffd9a0', surf: SF(SURF.PLAIN, 0.6, 0, 1.6) }); lampFlames.push([4.02 * sx, BF + 5.05, Z(44.4), 0.5]); glowPts.push([4.02 * sx, BF + 5.4, Z(44.4), 2.6]); }
  }
  addSplit(K.build(), matK.prop, 'kitchen-props');
  await ctx.yield();
  // ---- COPPER BY THE HUNDRED: five shapes, each one instanced mesh; a seed deals their order, sizes and tones ----
  const S_HANDLE = SF(SURF.PLAIN, 0.45, 0.85, -1);
  const copperShape = (pts, seg, innerFrom, extra, flute = 0, metal = C.copper, surf = S_COPPER) => {
    const g = lathe(pts, seg), n = pts.length, cnt = g.attributes.position.count, col = new Float32Array(cnt * 3), P = g.attributes.position;
    let y0 = 1e9, y1 = -1e9; for (const q of pts) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    // polished metal, baked: dark hollows, a rich mid and two hot streaks down each piece (one broad, one narrow), since a
    // round of metal shows the fire and the windows as streaks wherever it stands
    const DK = [0.4, 0.26, 0.24], MD = [0.95, 0.85, 0.78], HT = [1.1, 1.3, 1.46], RIM = [0.96, 1.14, 1.4];
    for (let i = 0; i < cnt; i++) { const inner = innerFrom < 0 ? i % n < -innerFrom : i % n >= innerFrom, h = (P.getY(i) - y0) / (y1 - y0), a = Math.atan2(P.getZ(i), P.getX(i));
      const hot = Math.pow(Math.max(0, Math.cos(a - 0.7)), 10) + 0.55 * Math.pow(Math.max(0, Math.cos(a + 2.5)), 6);
      const t = Math.min(1, Math.max(0, (0.5 + 0.3 * h + 0.24 * Math.cos(2 * (a - 0.7)) - 0.45) / 0.5)), u = Math.min(1, hot);
      for (let k = 0; k < 3; k++) { const m = DK[k] + (MD[k] - DK[k]) * t; col[i * 3 + k] = inner ? DK[k] * (0.75 + 0.5 * u) : (m + (HT[k] - m) * u) * (h > 0.9 ? RIM[k] : 1); } }
    if (flute) { for (let i = 0; i < cnt; i++) { const x = P.getX(i), z = P.getZ(i); if (P.getY(i) > 0.05) { const f = 1 + 0.08 * Math.cos(Math.atan2(z, x) * flute); P.setX(i, x * f); P.setZ(i, z * f); } } g.computeVertexNormals(); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const b = INT.makeBuilder(); b.add(g, { c: metal, surf }); if (extra) extra(b);
    // the glint: the hot streaks glow a little of themselves, so every piece shows one sharp highlight in any light
    const out = b.build(), S = out.attributes.surf, Q = out.attributes.position, Cq = out.attributes.color;
    for (let i = 0; i < S.count; i++) { if (S.getZ(i) < -0.5 || Cq.getX(i) < 0.62) continue; const a = Math.atan2(Q.getZ(i), Q.getX(i));
      const u = Math.pow(Math.max(0, Math.cos(a - 0.7)), 10) + 0.55 * Math.pow(Math.max(0, Math.cos(a + 2.5)), 6); if (u > 0.5 && Math.hypot(Q.getX(i), Q.getZ(i)) > 0.05) S.setZ(i, 0.4 * Math.min(1, u)); }
    return out;
  };
  const SHAPES = {
    pan: copperShape([[0, 0], [0.92, 0], [1, 0.08], [1, 0.92], [0.95, 0.97], [0.88, 0.92], [0.86, 0.3], [0, 0.26]], 10, 5, (b) => { box(b, 0.9, 2.9, 0.74, 0.84, -0.09, 0.09, '#4a4a52', S_HANDLE); box(b, 0.86, 1.1, 0.6, 0.84, -0.13, 0.13, '#4a4a52', S_HANDLE); }),
    pot: copperShape([[0, 0], [1, 0.03], [1, 1.5], [1.05, 1.56], [0.6, 1.74], [0.14, 1.8], [0.13, 1.94], [0, 1.96]], 10, 99, (b) => { for (const s of [-1, 1]) box(b, s * 1.0, s * 1.2, 1.1, 1.3, -0.3, 0.3, '#4a4a52', S_HANDLE); }),
    mould: copperShape([[1, 0], [0.97, 0.3], [0.8, 0.42], [0.72, 0.76], [0.42, 0.86], [0.3, 1.05], [0, 1.08]], 10, 99, null, 5),
    fish: copperShape([[0, 0], [0.95, 0], [1, 0.05], [1, 0.62], [1.05, 0.64], [1.05, 0.72], [0.5, 0.82], [0, 0.84]], 12, 99, (b) => { for (const s of [-1, 1]) box(b, s * 1.0, s * 1.22, 0.36, 0.5, -0.4, 0.4, '#4a4a52', S_HANDLE); box(b, -0.3, 0.3, 0.84, 0.96, -0.12, 0.12, '#4a4a52', S_HANDLE); }),
    lid: copperShape([[1, 0], [0.98, 0.07], [0.6, 0.2], [0.15, 0.27], [0, 0.28]], 10, 99, (b) => { box(b, -0.3, 0.3, 0.27, 0.4, -0.07, 0.07, '#4a4a52', S_HANDLE); }),
  };
  const LITE = {
    pan: copperShape([[0, 0], [0.95, 0], [1, 0.9], [0.9, 0.9], [0.86, 0.28], [0, 0.26]], 8, 3, (b) => { box(b, 0.9, 2.9, 0.74, 0.84, -0.09, 0.09, '#4a4a52', S_HANDLE); }, 0, '#d98a5c', SF(SURF.PLAIN, 0.58, 0.9)),
    lid: copperShape([[1, 0], [0.9, 0.12], [0.3, 0.26], [0, 0.28]], 8, 99, null, 0, '#d98a5c', SF(SURF.PLAIN, 0.58, 0.9)),
  };
  const INST = { pan: [], pot: [], mould: [], fish: [], lid: [] };
  const TONES = [[1, 1, 1], [0.94, 0.9, 0.86], [1.1, 1.02, 0.92], [0.88, 0.8, 0.78], [1.05, 1.12, 0.86], [1, 0.95, 1]];
  // one piece: kind, place of its foot, turn about y, size, stretch across (fish kettles are long), lie (1 = standing on edge facing -x)
  const put = (kind, x, y, z, ry, s, sz = 1, lie = 0, tone = 0) => INST[kind].push([x, y, z, ry, s, sz, lie, tone]);
  {
    const rc = R.copper, gap = 0.1 + 0.5 * (1.3 - dens);
    // the dresser's shelves: runs of pieces graded from large to small; the largest low, the smallest high
    const kinds = [['pot', 'fish', 'pot', 'pan'], ['pan', 'pan', 'pot', 'mould'], ['pan', 'mould', 'pan'], ['mould', 'pan', 'mould'], ['pan', 'mould'], ['lid']];
    const size = [[0.52, 0.68], [0.5, 0.66], [0.44, 0.58], [0.38, 0.5], [0.33, 0.42], [0.34, 0.37]];
    for (const [da, db] of DR.halves) for (let k = 0; k < DR.sh.length; k++) {
      let d = da + 0.5 + rc() * 0.4, run = 0, kind = rc.pick(kinds[k]), runLen = 4 + Math.floor(rc() * 4), tone = Math.floor(rc() * TONES.length);
      while (d < db - 0.9) {
        if (run >= runLen) { run = 0; kind = rc.pick(kinds[k]); runLen = 3 + Math.floor(rc() * 5); tone = Math.floor(rc() * TONES.length); d += gap; }
        const t = run / Math.max(1, runLen - 1), s0 = size[k][1] + (size[k][0] - size[k][1]) * t, jit = 0.96 + rc() * 0.08, ry = rc.range(-0.6, 0.6), dx = rc() * 0.2;
        const s = (kind === 'pot' ? s0 * 0.86 : kind === 'fish' ? s0 * 1.5 : kind === 'mould' && k < 2 ? s0 * 0.9 : s0) * jit;
        const half = kind === 'fish' ? s : kind === 'lid' ? s : s * (kind === 'pot' ? 1.2 : 1.02);
        d += half;
        if (kind === 'lid') put('lid', 8.62, DR.sh[k] + s, Z(d), 0, s, 1, 1, tone);
        else if (kind === 'fish') put('fish', 8.15 - dx, DR.sh[k], Z(d), Math.PI / 2, s, 0.4, 0, tone);
        else put(kind, (k === 0 ? 7.95 : 8.2) - dx, DR.sh[k], Z(d), Math.PI + ry, s, 1, 0, tone);
        d += half + gap; run++;
      }
    }
    // a rank of stockpots on the range, copper moulds on the marble slab, two fish kettles on the hearth stone
    for (let d = RNG.d0 + 1.6, i = 0; d < RNG.d1 - 1; d += 2.7, i++) if (i % 3 !== 1) put('pot', KX0 + 1.9, RNG.top + 0.06, Z(d), rc() * 3, 0.78 + rc() * 0.16, 1, 0, Math.floor(rc() * 4));
    for (let i = 0; i < Math.round(8 * dens); i++) put('mould', -10.2 - (i % 2) * 1.5 + rc() * 0.3, BF + 3.6, Z(TB[1] - 2.6 + i * 0.5 + rc() * 0.2), rc() * 3, 0.42 + rc() * 0.22, 1, 0, Math.floor(rc() * TONES.length));
    put('fish', KX0 + 4.6, BF + 0.35, Z(83.4), 0.1, 1.2, 0.42, 0, 0); put('pan', KX0 + 5.2, BF + 0.35, Z(62.3), 2.4, 0.8, 1, 0, 2);
    // lids hung in rows: an arc of them, graded from the middle, on the west wall over the range's hood, over the oven
    // and on the hearth's breast; two rows on the north wall either side of the arch
    const arcRow = (x, dc, half, yb, rise, n, big, lie) => { for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) * 2 - 1 : 0, r = big * (1 - 0.45 * Math.abs(t)) * (0.97 + rc() * 0.06); put('lid', x, yb + rise * (1 - t * t), Z(dc + t * half), 0, r, 1, lie, Math.floor(rc() * TONES.length)); } };
    arcRow(KX0 + 0.12, KD0 + 1.5 * BAY, 10.4, BF + 16.6, 3.4, Math.round(13 * Math.min(1.15, dens)), 0.95, 2);
    arcRow(KX0 + 0.12, KD0 + 0.5 * BAY, 8.6, BF + 15.9, 2.6, Math.round(9 * Math.min(1.15, dens)), 0.8, 2);
    arcRow(KX0 + 3.72, 71.6, 5.8, BF + 10.6, 2.2, Math.round(11 * Math.min(1.15, dens)), 0.78, 2);
    for (let i = 0; i < 6; i++) { put('lid', -16 - i * 1.25, BF + 6.4, Z(KD1) + 0.12, 0, 0.56 - i * 0.04, 1, 3, i % TONES.length); }
    // three fans of lids and moulds on the north wall round the head of the north arch (its centre x 0, y -7, radius 4),
    // clear of the two lamps at its shoulders and of the clock
    for (const [r, n, sz, a0, kind] of [[4.66, 17, 0.36, 0.2, 'lid'], [5.75, 7, 0.7, 0.74, 'lid'], [7.55, 9, 0.8, 0.86, 'lid'], [9.35, 11, 0.62, 0.72, 'mould']]) for (let i = 0; i < n; i++) { const a = a0 + (Math.PI - 2 * a0) * i / (n - 1);
      put(kind, r * Math.cos(a), BF + 6 + r * Math.sin(a), Z(KD1) + 0.12, 0, sz * (0.94 + rc() * 0.12), 1, 3, Math.floor(rc() * TONES.length)); }
    // copper moulds on two shelves of the dressers either side of the north arch; a pot simmering on the side table;
    // a rank of lids high on the east wall by the stair
    for (const sx of [-1, 1]) for (const [y, sz] of [[BF + 7.3, 0.36], [BF + 9.7, 0.3]]) for (let x = 5.85; x < (sx < 0 ? 8.5 : 8.6); x += 0.82) put('mould', x * sx, y, Z(KD1) + 0.5, rc() * 6.28, sz * (0.94 + rc() * 0.12), 1, 0, Math.floor(rc() * TONES.length));
    put('pot', -6.75, BF + 1.25, Z(82.9), 0.5, 0.55, 1, 0, 2); steamers.push([-6.75, BF + 1.25 + 0.55 * 1.56, Z(82.9), 0.55]);
    for (let i = 0; i < 10; i++) put('lid', KX1 - 0.12, BF + 9.2 + 0.5 * Math.sin(i / 9 * Math.PI), Z(11.5 + i * 2.3), 0, 0.85 - 0.03 * Math.abs(i - 4.5), 1, 1, i % TONES.length);
  }
  await ctx.yield();
  {
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
    for (const kind of Object.keys(INST)) {
      // each piece goes with the far or the near set of its kind by the box of its own shape where it stands
      const all = INST[kind], geo = SHAPES[kind], lists = [[], []];
      if (!geo.boundingBox) geo.computeBoundingBox();
      for (const it of all) {
        if (it[6] === 1) e.set(0, 0, Math.PI / 2, 'YXZ'); else if (it[6] === 2) e.set(0, 0, -Math.PI / 2, 'YXZ'); else if (it[6] === 3) e.set(Math.PI / 2, 0, 0, 'YXZ'); else e.set(0, it[3], 0, 'YXZ');
        q.setFromEuler(e); v.set(it[0], it[1], it[2]); sc.set(it[4], it[4], it[4] * it[5]);
        const mi = new THREE.Matrix4().compose(v, q, sc); lists[boxReach(geo.boundingBox, mi) ? 1 : 0].push([mi, it[7]]);
      }
      for (const [list, where, tag] of [[lists[0], near, ''], [lists[1], far, '-far']]) {
        if (!list.length) continue;
        const im = new THREE.InstancedMesh(geo, matK.prop, list.length); im.name = 'copper-' + kind + tag; im.frustumCulled = false;
        list.forEach(([mi, tone], i) => { im.setMatrixAt(i, mi); const t = TONES[tone % TONES.length]; im.setColorAt(i, col.setRGB(t[0], t[1], t[2])); });
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        where.add(im); triangles += geo.index.count / 3 * list.length; drawCalls++;
      }
      await ctx.yield();
    }
  }
  // ---- the hour's light from the four east windows: glowing panes, shafts across the room, dust (no shaft at night) ----
  {
    const wl = INT.makeWindowLight({ rig: rigK, rng: R.light, shaftGain: HR.shaft, shaftDensity: 0.06, motesPerWindow: Math.round(120 * detail), maxMotes: 600, moteSize: 0.016, moteGain: HR.mote,
      paneGain: HR.pane, frost: 0.5, glare: 0.7, outdoor: HR.out });
    far.add(wl.object); triangles += wl.triangles; wl.object.traverse((o) => { if (o.isMesh || o.isPoints || o.isLine) drawCalls++; }); updates.push((dt, t, cam) => wl.update(dt, t, cam));
  }
  await ctx.yield();
  // ---- three hanging racks over the tables: iron rails on chains, dense with copper, ladles and bunches of herbs; they sway ----
  {
    const rk = R.racks, B = INT.makeBuilder(), RY = BF + 11.2, M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    const hang = (geo, x, y, z, rx, ry, rz, s, c) => { e.set(rx, ry, rz, 'YXZ'); q.setFromEuler(e); v.set(x, y, z); sc.set(s, s, s); B.add(geo, { m: M.compose(v, q, sc), c }); };
    const G_HERB = lathe([[0, 0], [0.5, 0.25], [0.62, 0.8], [0.3, 1.5], [0.08, 1.9], [0, 1.92]], 6);
    for (const dc of TB) {
      const x0 = -14, x1 = -8, da = dc - 7, db = dc + 7;
      for (const x of [x0, x1, (x0 + x1) / 2]) bar(B, [x, RY, Z(da)], [x, RY, Z(db)], 0.09, 0.09, C.iron, S_IRON, cylG(6));
      for (let d = da; d <= db + 0.01; d += 3.5) bar(B, [x0, RY, Z(d)], [x1, RY, Z(d)], 0.08, 0.08, C.iron, S_IRON, cylG(6));
      for (const d of [dc - 4.4, dc + 4.4]) { const xm = (x0 + x1) / 2; bar(B, [xm, RY, Z(d)], [xm, ceilAt(xm, d) - 0.2, Z(d)], 0.028, 0.028, '#77777e', S_IRON, cylG(5)); for (const x of [x0, x1]) bar(B, [x, RY, Z(d)], [xm, RY + 2.2, Z(d)], 0.024, 0.024, '#77777e', S_IRON, cylG(5)); }
      // along each rail: pans hung by their handles, lids, ladles, herbs; sizes run down along the rail
      for (const [x, face] of [[x0, -1], [x1, 1]]) {
        let d = da + 0.5 + rk() * 0.5, i = 0;
        while (d < db - 0.5) {
          const pick = rk(), s = 0.62 - 0.26 * ((d - da) / 14) + rk() * 0.08, tone = rk.pick(['#c2b2a6', '#b6a69a', '#c8b6a6', '#ae9c92']);
          if (pick < 0.5 * dens) { hang(LITE.pan, x, RY - 0.12 - 2.9 * s, Z(d), 0, face > 0 ? 0 : Math.PI, Math.PI / 2, s, tone); d += 0.58 + s * 0.3; }
          else if (pick < 0.68) { hang(LITE.lid, x, RY - 0.5 - s, Z(d), 0, face > 0 ? 0 : Math.PI, Math.PI / 2, s * 1.1, tone); bar(B, [x, RY, Z(d)], [x, RY - 0.5, Z(d)], 0.025, 0.025, C.iron, S_IRON); d += 0.72; }
          else if (pick < 0.84) { const L = 1.5 + rk() * 0.8; bar(B, [x, RY - 0.1, Z(d)], [x, RY - L, Z(d)], 0.045, 0.045, C.copper, S_COPPER, cylG(5)); B.add(G_BOWL, { p: [x, RY - L - 0.2, Z(d)], r: [0, 0, face * 1.2], s: [0.3, 0.42, 0.3], c: C.copper, surf: S_COPPER }); d += 0.6; }
          else { const hs = 0.5 + rk() * 0.35; bar(B, [x, RY, Z(d)], [x, RY - 0.4, Z(d)], 0.02, 0.02, '#c9b48c', S_MATTE); B.add(G_HERB, { p: [x, RY - 0.4 - 1.92 * hs, Z(d)], s: [hs, hs, hs], c: rk.pick(['#4f6a3a', '#5a7040', '#486034', '#6a7a44']), surf: SF(SURF.FABRIC, 0.04), grad: [RY - 2, RY - 0.4, 1.1, 0.6] }); d += 0.75; }
          i++;
        }
      }
      await ctx.yield();
    }
    const swayMat = INT.propMaterial({ rig: rigK, sway: { dir: [1, 0, 0.35], amp: 0.03, freq: 1.0, k: 1.5 } });
    { const geo = B.build(), S4 = geo.attributes.surf, P = geo.attributes.position;
      // sway weight by how far a thing hangs under its rail (the rack itself does not sway)
      for (let i = 0; i < S4.count; i++) S4.setW(i, 1 - ctx.core.clamp((RY - 0.15 - P.getY(i)) / 2.6, 0, 1));
      // the split is taken REACH.sway wide of the reach: more than the widest swing of a hanging thing
      addSplit(geo, swayMat, 'kitchen-racks', REACH.sway); }
    await ctx.yield();
    // ---- THE TIE RODS AND WHAT HANGS FROM THEM ----
    // An iron rod crosses the kitchen at the springing wherever a rack's chains rise (CHAIN.off either side of each
    // table's middle), so every rack hangs by a rod as well as by the vault. A rod runs whole, from the east wall to
    // the west wall (or the hearth's breast), with a plate at either end and a hanger from the crown's ridge rib,
    // only where it clears the stair's treads by twice the rail's height and the route's line by the law's 2.6 m
    // and LINE_M more (the line is taken straight between the route's points; its curve runs up to 0.16 m from
    // that). Where it cannot (the bay the stair comes down through), it is a half rod: from the west wall to the
    // racks' east edge, its free end hung by a chain from the vault. Hooks stand along every rod HOOK apart either
    // side of the rack's chain: none over the walk (WALK either side of the axis), none nearer the bell wires of the
    // west side than 1 m. West of the racks' east edge the hooks carry what a kitchen hangs, in runs of a kind as on
    // a larder's rail: copper pans in rows, graded; hams in cloth; strings of onions; bunches of herbs. East of it
    // (the walk and the dresser's side) the hooks hang bare. What hangs sways as the racks' things sway.
    {
      const rh = R.hangings, V = INT.makeBuilder(), RODY = VS, RODR = 0.07, HOOKY = RODY - 0.3, IRON = '#2e2e33';
      // the racks' own numbers: their chains' x, how far either side of a table's middle the chains rise, their east edge
      const CHAIN = { x: -11, off: 4.4, east: -8 };
      const HOOK = 1.25, WALK = 5.5, LINE_LAW = 2.6, LINE_M = 0.2, RAIL = 2.9;
      // the top of the landing and of the stair's flight under a depth (the stair's own run: 30 m from d 14, 16 m of fall)
      const stairTop = (d) => (d <= 14 ? FL : d >= 44 ? BF : FL - (d - 14) * 16 / 30);
      const G_HOOK = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, RODR + 0.03, 0], [0.02, -0.16, 0], [0.09, -0.33, 0], [0.19, -0.24, 0]].map((p) => new THREE.Vector3(p[0], p[1], p[2]))), 3, 0.022, 3, false);
      // an onion: a six-sided spindle, pointed at neck and root (twelve triangles); the same shape ties a ham's neck
      const G_ONION = new THREE.SphereGeometry(1, 6, 2), CLOTH_S = SF(SURF.FABRIC, 0.03), SKIN_S = SF(SURF.PLAIN, 0.28);
      const PANS = ['#c2b2a6', '#b6a69a', '#c8b6a6', '#ae9c92'], CLOTH = ['#d9ceb4', '#cfc3a6', '#e2d8c0'], SKIN = ['#c98a3c', '#b8742e', '#d49a4a', '#a8642a'], GREEN = ['#4f6a3a', '#5a7040', '#486034', '#6a7a44'];
      const pickU = (list, u) => list[Math.min(list.length - 1, Math.floor(u * list.length))];
      const twine = (x, z, yTop, yFoot) => box(V, x - 0.012, x + 0.012, yFoot, yTop, z - 0.012, z + 0.012, '#c9b48c', S_MATTE);
      // one hung thing under a hook: kind, its number in its run, the hook's place, the hook's six dealt numbers
      const thing = (kind, n, x, z, u) => {
        if (kind === 0) { const s = Math.max(0.3, 0.56 - 0.065 * n) + 0.04 * u[1];   // a copper pan by its handle, the row graded down
          V.add(LITE.pan, { p: [x, HOOKY - 2.9 * s, z], r: [0, (u[2] < 0.5 ? 1 : -1) * Math.PI / 2 + (u[2] - 0.5) * 0.5, Math.PI / 2], s, c: pickU(PANS, u[3]) }); }
        else if (kind === 1) { const hs = 0.9 + 0.3 * u[1], top = HOOKY - 0.35, cy = top - 0.85 * hs, c = pickU(CLOTH, u[3]);   // a ham sewn in cloth, tied at the neck
          twine(x, z, HOOKY, top);
          V.add(SPH8, { p: [x, cy, z], r: [0, u[2] * Math.PI, 0], s: [0.42 * hs, 0.85 * hs, 0.5 * hs], c, surf: CLOTH_S, grad: [cy - 0.85 * hs, cy + 0.85 * hs, 0.8, 1.06] });
          V.add(G_ONION, { p: [x, top + 0.04, z], s: [0.16 * hs, 0.17 * hs, 0.16 * hs], c, surf: CLOTH_S }); }
        else if (kind === 2) { const L = 1.8 + 0.4 * u[1], a0 = u[2] * 6.28, c = pickU(SKIN, u[3]);   // a string of nine onions, plaited close
          twine(x, z, HOOKY, HOOKY - L);
          for (let i = 0; i < 9; i++) { const a = a0 + i * 2.4, y = HOOKY - 0.4 - (L - 0.5) * i / 8, r = 0.19 + 0.025 * (i % 3);
            V.add(G_ONION, { p: [x + Math.cos(a) * 0.15, y, z + Math.sin(a) * 0.15], r: [0, a, 0], s: [r, r * 1.05, r], c, surf: SKIN_S, grad: [y - r, y + r, 0.85, 1.1] }); } }
        else { const hs = 0.55 + 0.35 * u[1];   // a bunch of herbs, heads down
          twine(x, z, HOOKY, HOOKY - 0.3);
          V.add(G_HERB, { p: [x, HOOKY - 0.3 - 1.92 * hs, z], r: [0, u[2] * 6.28, 0], s: hs, c: pickU(GREEN, u[3]), surf: SF(SURF.FABRIC, 0.04), grad: [HOOKY - 2.2, HOOKY - 0.3, 1.1, 0.6] }); }
      };
      for (const dc of TB) for (const sg of [-1, 1]) {
        const d = dc + sg * CHAIN.off, z = Z(d), inH = d > HEARTH.d0 && d < HEARTH.d1, west = inH ? HEARTH.x1 : KX0, wires = inH ? HEARTH.x1 + 0.2 : KX0 + 1.5;
        const whole = RODY - stairTop(d) >= 2 * RAIL && routeDist(0, RODY, z) - RODR >= LINE_LAW + LINE_M, east = whole ? KX1 : CHAIN.east;
        // the rod in two pieces that meet a metre west of what a line can reach at this depth, so that its west piece
        // goes with the near group
        const xe = Math.min(east, -REACH.jamb - REACH.west * (d + 1 - KD0) - 1);
        bar(V, [west, RODY, z], [xe, RODY, z], RODR, RODR, IRON, S_IRON, cylG(6)); if (east > xe) bar(V, [xe, RODY, z], [east, RODY, z], RODR, RODR, IRON, S_IRON, cylG(6));
        box(V, west, west + 0.08, RODY - 0.3, RODY + 0.3, z - 0.3, z + 0.3, IRON, S_IRON);
        if (whole) { box(V, KX1 - 0.08, KX1, RODY - 0.3, RODY + 0.3, z - 0.3, z + 0.3, IRON, S_IRON); bar(V, [KCX, RODY, z], [KCX, VS + VR - 0.55, z], 0.05, 0.05, IRON, S_IRON); }
        else bar(V, [east, RODY, z], [east, ceilAt(east, d) - 0.2, z], 0.03, 0.03, '#77777e', S_IRON);
        const xs = []; for (let k = 0; CHAIN.x - HOOK / 2 - k * HOOK >= wires + 1; k++) xs.unshift(CHAIN.x - HOOK / 2 - k * HOOK);
        for (let k = 0; CHAIN.x + HOOK / 2 + k * HOOK <= east - 0.6; k++) xs.push(CHAIN.x + HOOK / 2 + k * HOOK);
        // every hook takes its six numbers, whatever it then carries
        let run = 0, kind = 0, n = 0;
        for (const x of xs) {
          const u = [rh(), rh(), rh(), rh(), rh(), rh()];
          if (Math.abs(x) < WALK) continue;
          V.add(G_HOOK, { p: [x, RODY, z], c: IRON, surf: S_IRON });
          if (x > CHAIN.east) continue;
          if (run <= 0) { kind = u[0] < 0.3 ? 0 : u[0] < 0.55 ? 1 : u[0] < 0.8 ? 2 : 3; run = (kind ? 2 : 3) + Math.floor(u[5] * 3); n = 0; }
          run--; if (u[4] < 0.95 * Math.min(1, dens)) thing(kind, n, x, z, u); n++;
        }
      }
      const geo = V.build(), S4 = geo.attributes.surf, P = geo.attributes.position;
      // sway weight by how far a thing hangs under its hook, as for the racks (rods, plates, hangers and hooks do not sway)
      for (let i = 0; i < S4.count; i++) S4.setW(i, 1 - ctx.core.clamp((HOOKY - P.getY(i)) / 2.6, 0, 1));
      addSplit(geo, swayMat, 'kitchen-hangings', REACH.sway);
    }
  }
  await ctx.yield();
  // ---- the floor's dress: sacks of flour, baskets of garden stuff, barrels, a log pile, a block, a stone sink; all low,
  // none nearer the route's line than 3.4 m (the line runs 6 m and more over this floor) ----
  {
    const rd = R.dress, F = INT.makeBuilder(), sack = SF(SURF.FABRIC, 0.03), wick = SF(SURF.FABRIC, 0.06);
    const sacks = (x, d, n) => { for (let i = 0; i < n; i++) { const a = rd() * 6.28, r = i ? 0.7 + rd() * 0.5 : 0, s = 0.8 + rd() * 0.3, lying = rd() < 0.25;
      F.add(SPH8, { p: [x + Math.cos(a) * r, BF + (lying ? 0.5 : 1.0) * s, Z(d + Math.sin(a) * r)], r: [0, rd() * 3, 0], s: lying ? [s * 1.2, s * 0.5, s * 0.75] : [s * 0.78, s * 1.05, s * 0.66], c: rd.pick(['#c2ae88', '#b8a47c', '#cdbb98']), surf: sack, grad: [BF, BF + 2, 0.6, 1.0] });
      if (!lying) F.add(SPH6, { p: [x + Math.cos(a) * r, BF + 2.0 * s, Z(d + Math.sin(a) * r)], s: [0.28 * s, 0.2 * s, 0.24 * s], c: '#cfc2a4', surf: sack }); } };
    const VEG = [['#6f9a4a', 0.34, 0.3], ['#c23a2a', 0.2, 0.2], ['#b88a4a', 0.22, 0.17], ['#e07a1c', 0.14, 0.14], ['#8aa858', 0.3, 0.26], ['#d9c04a', 0.2, 0.19]];
    const basket = (x, d, s, kind, yb = BF + 1.25) => { const z = Z(d);
      F.add(G_BOWL, { p: [x, yb, z], s: [s, s * 1.5, s], c: rd.pick(['#a9824c', '#96703e', '#b8905a']), surf: wick, grad: [yb, yb + s, 0.75, 1.05] });
      const v = VEG[kind % VEG.length];
      for (let i = 0; i < 4; i++) { const a = i * 2.4 + rd(), r = (i ? 0.25 + 0.4 * (i % 3) / 2 : 0) * s; F.add(SPH6, { p: [x + Math.cos(a) * r, yb + s * 0.86 + (i < 3 ? 0.2 * s : 0), z + Math.sin(a) * r], s: [v[1] * s * 1.6, v[2] * s * 1.6, v[1] * s * 1.6], c: v[0], surf: SF(SURF.PLAIN, 0.3) }); } };
    const barrel = (x, d, s) => { const z = Z(d);
      F.add(lathe([[0, 0], [0.8, 0], [1, 1.1], [0.8, 2.2], [0.7, 2.2], [0, 2.1]], 10), { p: [x, BF, z], s: [s, s, s], c: '#8a6038', surf: S_OAK, grad: [BF, BF + 2.2 * s, 0.8, 1.05] });
      for (const h of [0.35, 1.85]) F.add(cylG(10), { p: [x, BF + h * s, z], s: [s * (h < 1 ? 0.88 : 0.9), 0.1 * s, s * (h < 1 ? 0.88 : 0.9)], c: '#3a3a40', surf: S_IRON }); };
    // beside the stair's west flank and by the oven: flour and barrels
    sacks(-6.6, 22.5, 4); sacks(-6.9, 33.5, 3); sacks(-18.6, 26.8, 4); barrel(-6.5, 27.8, 0.95); barrel(-6.7, 30, 0.8); barrel(-6.4, 38.8, 0.9);
    // the aisle side of the tables and the foot of the stair: baskets of garden stuff
    let kind = Math.floor(rd() * 6);
    for (const [x, d, s0] of [[-7.2, 41.5, 1.0], [-7.0, 43.6, 0.8], [-6.6, 47.8, 1.05], [-7.1, 50.2, 0.85], [-6.8, 56.5, 0.95], [-7.2, 62.6, 0.9], [-6.9, 66.4, 1.0], [-7.1, 75.5, 0.85], [5.3, 47.2, 0.9], [5.5, 49.4, 0.75], [5.2, 70.5, 0.9], [-15.3, 30.5, 0.9], [-15.6, 57.5, 0.95], [-15.4, 62.5, 0.8]]) basket(x + rd() * 0.3, d + rd() * 0.4, s0 * (0.92 + rd() * 0.16), kind++);
    sacks(4.9, 52.4, 3); sacks(-4.9, 58.2, 3); sacks(5.1, 76.6, 2);
    // deal benches: four flanking the middle walk north of the stair, and short ones under every basket by the tables
    const bench = (xa, xb, da, db) => { box(F, xa, xb, BF + 1.1, BF + 1.25, Z(da), Z(db), '#d2b88c', S_DEAL); box(F, xa + 0.1, xb - 0.1, BF + 0.35, BF + 0.45, Z(da + 0.15), Z(db - 0.15), '#c4a878', S_DEAL);
      for (const x of [xa + 0.12, xb - 0.12]) for (const d of [da + 0.15, db - 0.15]) box(F, x - 0.09, x + 0.09, BF, BF + 1.1, Z(d - 0.09), Z(d + 0.09), '#b89a6a', S_DEAL); };
    for (const [xa, da] of [[-3.7, 62.4], [2.0, 65.6], [-3.7, 72.6], [2.0, 75.6]]) { bench(xa, xa + 1.7, da, da + 5.6);
      for (let k = 0; k < 3; k++) basket(xa + 0.85, da + 0.95 + k * 1.85, 0.72 + rd() * 0.1, kind++); }
    for (const [xa, da, db] of [[-7.9, 40.5, 51.3], [-7.9, 55.5, 67.5], [-7.9, 74.5, 76.6], [4.5, 46.2, 50.5], [4.5, 69.5, 71.6], [-16.4, 29.5, 31.5], [-16.4, 56.5, 58.5], [-16.4, 61.5, 63.5]]) bench(xa, xa + 1.7, da, db);
    for (const [x, d, s] of [[-2.85, 68.9, 0.6], [2.85, 72.1, 0.62], [-2.85, 79.1, 0.55]]) F.add(G_CROCK, { p: [x, BF, Z(d)], s: [s, s * 0.9, s], c: rd.pick(['#c9b48c', '#b89a6a', '#8a6444', '#e9e2d0']), surf: SF(SURF.PLAIN, 0.55), grad: [BF, BF + 1.4, 1, 0.75] });
    barrel(-15.5, 83.6, 1.0); barrel(-13.2, 83.9, 0.85); barrel(-18, 83.5, 0.9);
    // the west wall round the range: a plate rack of blue and white china over the hood; hams and bunches of herbs on
    // a rail and a shelf of crocks over the loaf racks; a row of ladles and skimmers on the splash back; a salt box
    { const xw = KX0 + 0.12;
      box(F, KX0, xw + 0.5, BF + 14.72, BF + 14.84, Z(38.8), Z(55.2), '#d2b88c', S_DEAL); box(F, xw + 0.42, xw + 0.5, BF + 15.5, BF + 15.58, Z(38.8), Z(55.2), '#b89a6a', S_DEAL);
      for (let d = 39.6, i = 0; d < 54.8; d += 1.36, i++) { const r = 0.62 + 0.06 * (i % 2);
        F.add(cylG(10), { p: [xw + 0.2, BF + 14.84 + r, Z(d)], r: [0, 0, Math.PI / 2 - 0.14], s: [r, 0.05, r], c: i % 3 ? C.cobalt : '#2a58b8', surf: S_CHINA });
        F.add(cylG(10), { p: [xw + 0.25, BF + 14.84 + r, Z(d)], r: [0, 0, Math.PI / 2 - 0.14], s: [r * 0.78, 0.05, r * 0.78], c: C.china, surf: S_CHINA }); }
      for (const [da, db, n] of [[24.6, 33.2, 7], [61.0, 63.2, 2]]) { const yr = BF + 9.8;
        bar(F, [xw + 0.45, yr, Z(da)], [xw + 0.45, yr, Z(db)], 0.07, 0.07, '#3a3a40', S_IRON);
        for (let i = 0; i < n; i++) { const d = da + 0.6 + (db - da - 1.2) * i / Math.max(1, n - 1);
          if (i % 2 === 0) { const hs = 0.85 + rd() * 0.25; F.add(SPH8, { p: [xw + 0.5, yr - 0.5 - 0.8 * hs, Z(d)], s: [0.4 * hs, 0.8 * hs, 0.5 * hs], c: rd.pick(['#8a4630', '#9a5236', '#7a3c2a']), surf: SF(SURF.PLAIN, 0.35) }); }
          else { const hs = 0.7 + rd() * 0.3; F.add(SPH6, { p: [xw + 0.5, yr - 0.4 - 0.8 * hs, Z(d)], s: [0.34 * hs, 0.8 * hs, 0.34 * hs], c: rd.pick(['#566e3c', '#627844', '#4a6236']), surf: sack }); } } }
      for (let i = 0; i < 14; i++) { const d = 37.4 + i * 1.45, L = 1.0 + 0.15 * (i % 3), m = i % 2 ? C.brass : C.copper; bar(F, [xw + 0.14, BF + 8.9, Z(d)], [xw + 0.14, BF + 8.9 - L, Z(d)], 0.05, 0.05, m, S_COPPER);
        F.add(cylG(8), { p: [xw + 0.16, BF + 8.9 - L - 0.22, Z(d)], r: [0, 0, Math.PI / 2], s: [0.25, 0.07, 0.25], c: m, surf: S_COPPER }); }
      box(F, KX0, xw + 0.7, BF + 4.4, BF + 5.5, Z(61.6), Z(62.7), '#c9a66a', S_DEAL); box(F, KX0, xw + 0.76, BF + 5.5, BF + 5.6, Z(61.5), Z(62.8), '#a8844e', S_DEAL);
      box(F, KX0, xw + 0.8, BF + 11.2, BF + 11.32, Z(24.6), Z(33.2), '#d2b88c', S_DEAL);
      for (let i = 0; i < 4; i++) { const sc = 0.36 + 0.07 * (i % 3); F.add(G_CROCK, { p: [xw + 0.42, BF + 11.32, Z(25.8 + i * 2.1)], s: [sc, sc, sc], c: rd.pick(['#c9b48c', '#e9e2d0', '#8a6444']), surf: SF(SURF.PLAIN, 0.55) }); } }
    // either side of the north arch: a tall deal dresser (west) and a plate rack over the sink
    // (east): tin meat covers, crocks, blue and white china (the copper moulds on two shelves are instanced above)
    for (const sx of [-1, 1]) { const xa = 5.35 * sx, xb = (sx < 0 ? 8.8 : 8.9) * sx, zw = Z(KD1), y0 = sx < 0 ? BF : BF + 5.6, SHN = sx < 0 ? [BF + 4.4, BF + 5.9, BF + 7.3, BF + 8.6, BF + 9.7] : [BF + 5.9, BF + 7.3, BF + 8.6, BF + 9.7];
      box(F, xa, xb, y0, BF + 10.7, zw + 0.02, zw + 0.1, '#bfa57a', S_DEAL);
      for (const x of [xa, xb]) box(F, x - 0.07, x + 0.07, y0, BF + 10.7, zw + 0.02, zw + 1.0, '#d2b88c', S_DEAL);
      box(F, xa - 0.12 * sx, xb + 0.12 * sx, BF + 10.7, BF + 10.95, zw + 0.02, zw + 1.1, '#c4a878', S_DEAL);
      if (sx < 0) { box(F, xa, xb, BF, BF + 4.25, zw + 0.02, zw + 1.0, '#d2b88c', S_DEAL); for (let k = 0; k < 3; k++) F.add(SPH6, { p: [xa - (0.6 + k * 1.15), BF + 2.4, zw + 1.05], s: [0.1, 0.1, 0.1], c: C.brass, surf: S_BRASS }); }
      for (let k = 0; k < SHN.length; k++) { const y = SHN[k], kk = k + (sx < 0 ? 0 : 1); box(F, xa, xb, y - 0.12, y, zw + 0.02, zw + 1.0, '#d2b88c', S_DEAL);
        for (let x = 5.85, i = 0; x < (sx < 0 ? 8.5 : 8.6); x += 0.82, i++) {
          if (kk === 0 || kk === 3) { if (i % 2) F.add(G_DOME, { p: [x * sx, y, zw + 0.5], s: [0.34, 0.6, 0.34], c: '#cdd3da', surf: S_STEEL }); else F.add(G_CROCK, { p: [x * sx, y, zw + 0.5], s: [0.3, 0.32, 0.3], c: rd.pick(['#c9b48c', '#e9e2d0', '#8a6444']), surf: SF(SURF.PLAIN, 0.55) }); }
          else if (kk === 1) { const r = 0.5; F.add(cylG(10), { p: [x * sx, y + r + 0.02, zw + 0.22], r: [Math.PI / 2 - 0.16, 0, 0], s: [r, 0.05, r], c: i % 3 ? C.cobalt : '#2a58b8', surf: S_CHINA }); F.add(cylG(10), { p: [x * sx, y + r + 0.02, zw + 0.27], r: [Math.PI / 2 - 0.16, 0, 0], s: [r * 0.78, 0.05, r * 0.78], c: C.china, surf: S_CHINA }); } } } }
    // the side table west of the arch (its pot simmers); hams and herbs on a rail on the east wall by the stair
    bench(-7.6, -5.9, 82, 83.8);
    bar(F, [KX1 - 0.5, BF + 7.4, Z(12)], [KX1 - 0.5, BF + 7.4, Z(33)], 0.07, 0.07, '#3a3a40', S_IRON);
    // the east wall right of the stair's head, north of the first window: a rail of ladles and a small rack of china
    bar(F, [KX1 - 0.3, BF + 15, Z(24.6)], [KX1 - 0.3, BF + 15, Z(33.2)], 0.06, 0.06, '#3a3a40', S_IRON);
    for (let i = 0; i < 9; i++) { const d = 25 + i * 0.9, L = 1.2 + 0.2 * (i % 3), m = i % 2 ? C.brass : C.copper; bar(F, [KX1 - 0.32, BF + 15, Z(d)], [KX1 - 0.32, BF + 15 - L, Z(d)], 0.05, 0.05, m, S_COPPER);
      F.add(cylG(8), { p: [KX1 - 0.34, BF + 15 - L - 0.24, Z(d)], r: [0, 0, Math.PI / 2], s: [0.27, 0.07, 0.27], c: m, surf: S_COPPER }); }
    box(F, KX1 - 0.5, KX1, BF + 16.1, BF + 16.22, Z(24.8), Z(33), '#d2b88c', S_DEAL);
    for (let i = 0; i < 6; i++) { const r = 0.56; F.add(cylG(10), { p: [KX1 - 0.22, BF + 16.22 + r, Z(25.6 + i * 1.3)], r: [0, 0, Math.PI / 2 + 0.14], s: [r, 0.05, r], c: i % 2 ? C.cobalt : C.china, surf: S_CHINA }); }
    for (let i = 0; i < 9; i++) { const d = 13 + i * 2.4;
      if (i % 2 === 0) { const hs = 0.85 + rd() * 0.25; F.add(SPH8, { p: [KX1 - 0.55, BF + 6.9 - 0.8 * hs, Z(d)], s: [0.4 * hs, 0.8 * hs, 0.5 * hs], c: rd.pick(['#8a4630', '#9a5236', '#7a3c2a']), surf: SF(SURF.PLAIN, 0.35) }); }
      else { const hs = 0.7 + rd() * 0.3; F.add(SPH6, { p: [KX1 - 0.55, BF + 7.0 - 0.8 * hs, Z(d)], s: [0.34 * hs, 0.8 * hs, 0.34 * hs], c: rd.pick(['#566e3c', '#627844', '#4a6236']), surf: sack }); } }
    // a log pile by the hearth
    for (let i = 0; i < 9; i++) { const row = i < 4 ? 0 : i < 7 ? 1 : 2, k = i - [0, 4, 7][row]; bar(F, [-16.2 + k * 0.62 + row * 0.31, BF + 0.3 + row * 0.52, Z(60.4)], [-16.2 + k * 0.62 + row * 0.31, BF + 0.3 + row * 0.52, Z(63.0)], 0.3, 0.3, rd.pick(['#8a6844', '#7a5a3a', '#96724c']), S_OAK, cylG(7)); }
    // a chopping block on legs, a stone sink on brick piers with a brass tap and copper cans, east of the north arch
    box(F, -5.9, -4.3, BF + 1.5, BF + 2.5, Z(70.2), Z(72.0), '#b98a56', S_DEAL); for (const [ax, ad] of [[-5.7, 70.4], [-4.5, 70.4], [-5.7, 71.8], [-4.5, 71.8]]) box(F, ax - 0.12, ax + 0.12, BF, BF + 1.5, Z(ad - 0.12), Z(ad + 0.12), '#a87a48', S_DEAL);
    F.add(G_LOAF, { p: [-5.1, BF + 2.85, Z(71.1)], s: [0.6, 0.36, 0.45], c: '#e9d08a', surf: SF(SURF.PLAIN, 0.3) });
    box(F, 4.6, 8.7, BF + 2.2, BF + 3.4, Z(83.2), Z(85.6), '#b3aa9c', S_STONE); box(F, 4.9, 8.4, BF + 3.0, BF + 3.42, Z(83.5), Z(85.3), '#6f7a80', SF(SURF.PLAIN, 0.8)); steamers.push([6.65, BF + 3.42, Z(84.4), 0.9]);   // the sink's hot water: the middle of its surface
    for (const x of [4.9, 8.4]) box(F, x - 0.3, x + 0.3, BF, BF + 2.2, Z(83.4), Z(85.4), '#a8553c', SF(SURF.STONE, 0.1));
    bar(F, [6.65, BF + 3.4, Z(85.5)], [6.65, BF + 5.0, Z(85.5)], 0.09, 0.09, C.brass, S_BRASS, cylG(6)); bar(F, [6.65, BF + 4.8, Z(85.5)], [6.65, BF + 4.6, Z(84.6)], 0.07, 0.07, C.brass, S_BRASS, cylG(6));
    for (const [x, d, s0] of [[5.2, 81.9, 0.75], [6.6, 81.6, 0.6]]) { F.add(G_POT, { p: [x, BF, Z(d)], s: [s0, s0 * 1.2, s0], c: C.copper, surf: S_COPPER }); steamers.push([x, BF + 1.52 * 1.2 * s0, Z(d), 0.32 * s0]); F.add(new THREE.TorusGeometry(0.7, 0.05, 4, 8, Math.PI), { p: [x, BF + 1.5 * s0, Z(d)], r: [0, 0.6, 0], s: [s0, s0, s0], c: C.brass, surf: S_BRASS }); }
    addSplit(F.build(), matK.prop, 'kitchen-dress');
  }
  await ctx.yield();
  // ---- the roasting hearth's three spits, turned by the smoke jack's wheel and chain; the clock's pendulum ----
  {
    const rr = R.range, xs = KX0 + 4.5, zs = Z(72.5), zn = Z(79.9), ys = [BF + 2.6, BF + 4.1, BF + 5.6], yw = BF + 10.3, rw = 1.25, rp = 0.55;
    for (let k = -1; k <= 1; k++) steamers.push([xs, ys[2] + 0.7, zs + k * 3.6, 0.6]);   // the three roasts on the top spit
    const X = INT.makeBuilder();
    // fixed parts: the spit stands (cob irons), the jack's bracket and vane box
    for (const d of [65.6, 79.4]) { box(X, xs - 0.12, xs + 0.12, BF + 0.35, BF + 6.4, Z(d - 0.1), Z(d + 0.1), '#1e1e22', S_IRON); box(X, xs - 0.5, xs + 0.5, BF + 0.35, BF + 0.6, Z(d - 0.3), Z(d + 0.3), '#1e1e22', S_IRON); for (const y of ys) box(X, xs - 0.3, xs + 0.12, y - 0.22, y - 0.1, Z(d - 0.08), Z(d + 0.08), '#1e1e22', S_IRON); }
    box(X, KX0 + 3.6, xs + 0.3, yw - 0.2, yw + 0.2, zn + 0.15, zn + 0.5, '#1e1e22', S_IRON);
    // kettles on the boil between the stockpots: body, spout, bail handle
    for (let d = RNG.d0 + 1.6, i = 0; d < RNG.d1 - 1; d += 2.7, i++) if (i % 3 === 1) {
      const x = KX0 + 1.9, y = RNG.top + 0.06, z = Z(d), s = 0.85;
      X.add(G_POT, { p: [x, y, z], s: [s, s * 0.85, s], c: C.copper, surf: S_COPPER });
      bar(X, [x + 0.6 * s, y + 0.5 * s, z], [x + 1.5 * s, y + 1.1 * s, z], 0.1 * s, 0.1 * s, C.copper, S_COPPER, cylG(6));
      X.add(new THREE.TorusGeometry(0.8, 0.06, 5, 10, Math.PI), { p: [x, y + 1.0 * s, z], r: [0, Math.PI / 2, 0], s: [s, s, s], c: C.brass, surf: S_BRASS });
    }
    // THE LANTERN over the crown of the middle bay (see LAN): its stone curb round the vault's opening, its oak drum
    // and boarded roof as they show from below, and on each of the eight sides six small panes that glow with the
    // hour's sky between the drum's own posts and bars
    { const V2 = (p) => new THREE.Vector2(p[0], p[1]), flats = [0, Math.PI / 8, 0], at = [LAN.x, 0, LAN.z];
      X.add(new THREE.LatheGeometry([[LAN.R, LAN.y1], [LAN.R, LAN.y0], [LAN.curb, LAN.y0], [LAN.curb, LAN.y1]].map(V2), 8), { p: at, r: flats, c: '#b9ae9c', surf: S_STONE });
      X.add(new THREE.LatheGeometry([[0, LAN.top], [LAN.R, LAN.eave], [LAN.R, LAN.y1]].map(V2), 8), { p: at, r: flats, c: '#3a2a1e', surf: S_OAK });
      const glass = SF(SURF.PLAIN, 0.1, 0, HR.louvre[1]), NP = 3, pw = (LAN.side - 2 * LAN.post - (NP - 1) * LAN.bar) / NP, ph = (LAN.head - LAN.sill - LAN.bar) / 2, ap = LAN.ap - 0.03;
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, nx = Math.cos(a), nz = Math.sin(a), tx = -nz, tz = nx, P = (u, y) => [LAN.x + nx * ap + tx * u, y, LAN.z + nz * ap + tz * u];
        for (let i = 0; i < NP; i++) for (let j = 0; j < 2; j++) { const u0 = -LAN.side / 2 + LAN.post + i * (pw + LAN.bar), y0 = LAN.sill + j * (ph + LAN.bar);
          X.quad(P(u0, y0), P(u0 + pw, y0), P(u0 + pw, y0 + ph), P(u0, y0 + ph), HR.louvre[0], glass); } } }
    addSplit(X.build(), matK.prop, 'kitchen-extras');
    // one spit: a rod along x, three joints of meat with trussed ends, a pulley wheel with spokes at its north end
    const sb = INT.makeBuilder(), meat = SF(SURF.PLAIN, 0.42);
    sb.add(cylG(6), { p: [0, 0, 0], r: [0, 0, Math.PI / 2], s: [0.07, 15.2, 0.07], c: '#2a2a2e', surf: S_IRON });
    for (let k = -1; k <= 1; k++) { sb.add(SPH8, { p: [k * 3.6, 0.06, 0], s: [1.35, 0.66, 0.6], c: '#a8642c', surf: meat }); sb.add(SPH6, { p: [k * 3.6 + 1.2, -0.3, 0.2], s: [0.4, 0.26, 0.24], c: '#b8742e', surf: meat }); sb.add(SPH6, { p: [k * 3.6 - 1.1, 0.34, -0.2], s: [0.42, 0.26, 0.24], c: '#96581e', surf: meat }); }
    sb.add(new THREE.TorusGeometry(rp, 0.08, 5, 14), { p: [7.4, 0, 0], r: [0, Math.PI / 2, 0], c: '#2a2a2e', surf: S_IRON });
    for (let k = 0; k < 3; k++) sb.add(UB, { p: [7.4, 0, 0], r: [k * Math.PI / 3, 0, 0], s: [0.06, 1.1, 0.08], c: '#2a2a2e', surf: S_IRON });
    const sg = sb.build(), spits = new THREE.InstancedMesh(sg, matK.prop, 3); spits.name = 'spits'; spits.frustumCulled = false; near.add(spits); triangles += sg.index.count / 3 * 3; drawCalls++;
    const wb = INT.makeBuilder();
    wb.add(new THREE.TorusGeometry(rw, 0.09, 5, 20), { c: '#2a2a2e', surf: S_IRON }); wb.add(cylG(8), { r: [Math.PI / 2, 0, 0], s: [0.22, 0.3, 0.22], c: C.brass, surf: S_BRASS });
    for (let k = 0; k < 4; k++) wb.add(UB, { r: [0, 0, k * Math.PI / 4], s: [0.07, rw * 2, 0.07], c: '#2a2a2e', surf: S_IRON });
    const wheel = addMesh(wb.build(), matK.prop, 'jack-wheel', near); wheel.position.set(xs, yw, zn);
    // the chain: links that travel a closed loop round the jack's wheel and the lowest spit's pulley
    const yl = ys[0], loop = [], NA = 10;
    for (let i = 0; i <= NA; i++) { const a = Math.PI * i / NA; loop.push([xs - rw * Math.cos(a), yw + rw * Math.sin(a)]); }
    for (let i = 0; i <= NA; i++) { const a = Math.PI * i / NA; loop.push([xs + rp * Math.cos(a), yl - rp * Math.sin(a)]); }
    loop.push(loop[0]);
    const cum = [0]; for (let i = 1; i < loop.length; i++) cum.push(cum[i - 1] + Math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]));
    const LEN = cum[cum.length - 1], NL = Math.round(LEN / 0.42), links = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.13, 0.06), INT.propMaterial({ rig: rigK, color: '#3a3a40', surf: S_IRON }), NL);
    links.name = 'jack-chain'; links.frustumCulled = false; near.add(links); triangles += 12 * NL; drawCalls++;
    const speeds = [0.8 + rr() * 0.3, 0.7 + rr() * 0.3, 0.9 + rr() * 0.3], ph = [rr() * 6, rr() * 6, rr() * 6], M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    // the pendulum of the wall clock: a rod and a brass bob about a pivot under the dial
    const pb = INT.makeBuilder(); box(pb, -0.04, 0.04, -2.6, 0, -0.03, 0.03, C.brass, S_BRASS); pb.add(cylG(12), { p: [0, -2.6, 0], r: [Math.PI / 2, 0, 0], s: [0.42, 0.12, 0.42], c: C.brass, surf: S_BRASS });
    const pend = addMesh(pb.build(), matK.prop, 'clock-pendulum', near); pend.position.set(-10.5, BF + 9.4 - 1.5, Z(KD1) + 0.78);
    updates.push((dt, t) => {
      if (!near.visible) return;   // spits, wheel, chain and pendulum are all of the near group: a pure function of the clock, nothing to keep
      for (let i = 0; i < 3; i++) { e.set(t * speeds[i] + ph[i], Math.PI / 2, 0, 'YXZ'); q.setFromEuler(e); v.set(xs, ys[i], zs); spits.setMatrixAt(i, M.compose(v, q, one)); }
      spits.instanceMatrix.needsUpdate = true;
      wheel.rotation.z = -t * speeds[0] * rp / rw;
      const off = (t * speeds[0] * rp) % LEN;
      for (let i = 0, k = 1; i < NL; i++) {
        let s = (i / NL * LEN + off) % LEN; if (s < cum[k - 1]) k = 1; while (k < cum.length - 1 && cum[k] < s) k++;
        const a = loop[k - 1], b2 = loop[k], f = (s - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
        e.set(0, 0, Math.atan2(b2[1] - a[1], b2[0] - a[0]), 'YXZ'); q.setFromEuler(e); v.set(a[0] + (b2[0] - a[0]) * f, a[1] + (b2[1] - a[1]) * f, zn);
        links.setMatrixAt(i, M.compose(v, q, one));
      }
      links.instanceMatrix.needsUpdate = true;
      pend.rotation.z = 0.3 * Math.sin(t * 3.9);
    });
  }
  await ctx.yield();
  // ---- THE WHITE PASSAGE: copper hot-water cans, a dresser of white and cobalt china, coal scuttles (east);
  // a shelf of lit lamps and candlesticks, plank doors, stoneware jars (west); six oil lamps on brackets, staggered ----
  const Pb = INT.makeBuilder();
  const BOARD = { z: Z(134) + 0.14, cy: BF + 5.1, rIn: 3.56 }, XR = HW - 0.75;
  {
    const rp = R.passage, deal = '#cdb690', PY = BF + 4.6;
    const G_CAN = lathe([[0, 0], [0.62, 0], [0.66, 0.1], [0.56, 1.25], [0.3, 1.6], [0.3, 1.75], [0.36, 1.78], [0, 1.8]], 10);
    const shelfLamp = (x, y, z) => { Pb.add(SPH8, { p: [x, y + 0.2, z], s: [0.22, 0.18, 0.22], c: C.brass, surf: S_BRASS }); Pb.add(cylG(8), { p: [x, y + 0.7, z], s: [0.085, 0.62, 0.085], c: '#ffe6b8', surf: SF(SURF.PLAIN, 0.7, 0, 1.3) }); lampFlames.push([x, y + 0.56, z, 0.28]); };
    for (const sx of [-1, 1]) {
      const xw = 5 * sx, xi = 3.85 * sx;
      box(Pb, xi, xw, PY - 0.16, PY, Z(88.4), Z(96.6), deal, S_DEAL);
      for (let d = 89; d < 96.5; d += 3.4) bar(Pb, [xw - 0.02 * sx, PY - 1.0, Z(d)], [xi + 0.3 * sx, PY - 0.16, Z(d)], 0.05, 0.08, '#3a3a40', S_IRON);
      box(Pb, xw, xw - 0.12 * sx, BF, BF + 0.9, Z(87.6), Z(PE), '#a59c8e', S_STONE);
    }
    // east shelf: polished copper hot-water cans, graded
    for (let d = 89.2, i = 0; d < 96; i++) { const s = 0.62 + 0.3 * (1 - (d - 88.4) / 8) + rp() * 0.05, x = 4.35, y = PY, z = Z(d), ry = rp.range(-0.5, 0.5);
      Pb.add(G_CAN, { p: [x, y, z], s: [s, s, s], c: i % 4 === 3 ? C.brass : C.copper, surf: S_COPPER });
      bar(Pb, [x - Math.cos(ry) * 0.5 * s, y + 1.0 * s, z + Math.sin(ry) * 0.5 * s], [x - Math.cos(ry) * 1.15 * s, y + 1.75 * s, z + Math.sin(ry) * 1.15 * s], 0.08 * s, 0.08 * s, C.copper, S_COPPER, cylG(6));
      Pb.add(new THREE.TorusGeometry(0.42, 0.05, 4, 8, Math.PI), { p: [x, y + 1.72 * s, z], r: [0, ry, 0], s: [s, s, s], c: C.brass, surf: S_BRASS });
      d += s * 1.45 + 0.12 / dens; }
    // west shelf: lit lamps and brass candlesticks
    for (let d = 89, i = 0; d < 96.3; d += 1.25, i++) { const x = -4.35, z = Z(d);
      if (i % 3 === 1) shelfLamp(x, PY, z);
      else { const h = 0.9 + rp() * 0.7; cyl(Pb, x, PY + 0.05, z, 0.2, 0.1, C.brass, S_BRASS, 8); cyl(Pb, x, PY + h / 2, z, 0.045, h, C.brass, S_BRASS, 6); cyl(Pb, x, PY + h, z, 0.1, 0.06, C.brass, S_BRASS, 8); cyl(Pb, x, PY + h + 0.3, z, 0.04, 0.6, '#efe6cf', S_MATTE, 6); lampFlames.push([x, PY + h + 0.68, z, 0.2]); } }
    // the dresser of white and cobalt china (east), d 97.6 to 103.4
    { const da = 97.6, db = 103.4, x0 = 3.8, x1 = 5, sh = [BF + 3.1, BF + 4.6, BF + 6.0, BF + 7.3];
      box(Pb, 4.85, x1, BF, BF + 8.7, Z(da), Z(db), '#2c3a52', S_MATTE); box(Pb, x0, x1, BF, BF + 3.1, Z(da), Z(db), deal, S_DEAL); box(Pb, x0 - 0.12, x1, BF + 2.95, BF + 3.1, Z(da - 0.1), Z(db + 0.1), '#d9c49c', S_DEAL);
      for (let d = da + 1.4; d < db; d += 2.75) { box(Pb, x0 - 0.04, x0, BF + 0.5, BF + 2.7, Z(d - 1.2), Z(d + 1.2), '#d9c49c', S_DEAL); Pb.add(SPH6, { p: [x0 - 0.1, BF + 1.7, Z(d + 0.9)], s: [0.11, 0.11, 0.11], c: C.brass, surf: S_BRASS }); }
      for (const d of [da, db]) box(Pb, x0 + 0.5, x1, BF + 3.1, BF + 8.7, Z(d - 0.1), Z(d + 0.1), deal, S_DEAL);
      box(Pb, x0 + 0.3, x1, BF + 8.55, BF + 8.85, Z(da - 0.2), Z(db + 0.2), deal, S_DEAL);
      for (let k = 0; k < sh.length; k++) { if (k) box(Pb, x0 + 0.5, x1, sh[k] - 0.12, sh[k], Z(da), Z(db), deal, S_DEAL);
        for (let d = da + 0.75; d < db - 0.5; d += 1.18) { const r = 0.5 - k * 0.04, z = Z(d), band = rp() < 0.3 ? '#2a58b8' : C.cobalt;
          if ((k + Math.round(d)) % 4 === 0) { Pb.add(G_POT, { p: [4.35, sh[k], z], s: [0.42, 0.5, 0.42], c: C.china, surf: S_CHINA }); Pb.add(cylG(10), { p: [4.35, sh[k] + 0.4, z], s: [0.43, 0.1, 0.43], c: band, surf: S_CHINA }); }
          else { Pb.add(cylG(12), { p: [4.72, sh[k] + r + 0.02, z], r: [0, 0, Math.PI / 2 - 0.16], s: [r, 0.05, r], c: band, surf: S_CHINA }); Pb.add(cylG(12), { p: [4.68, sh[k] + r + 0.02, z], r: [0, 0, Math.PI / 2 - 0.16], s: [r * 0.8, 0.05, r * 0.8], c: C.china, surf: S_CHINA }); } } } }
    // one plank door, shut, in the west wall; jars and a coal scuttle on the floor
    for (const d of [100.2]) { const x = -5; box(Pb, x, x + 0.1, BF, BF + 6.3, Z(d - 1.5), Z(d + 1.5), '#5a3c26', S_OAK);
      for (let k = -2; k <= 2; k++) box(Pb, x + 0.1, x + 0.13, BF, BF + 6.3, Z(d + k * 0.6 - 0.02), Z(d + k * 0.6 + 0.02), '#2c1c12', S_MATTE);
      for (const y of [BF + 1.2, BF + 5.0]) box(Pb, x + 0.1, x + 0.18, y, y + 0.22, Z(d - 1.4), Z(d + 0.9), '#1e1e22', S_IRON);
      Pb.add(SPH6, { p: [x + 0.22, BF + 3.1, Z(d + 1.1)], s: [0.14, 0.14, 0.14], c: C.brass, surf: S_BRASS });
      box(Pb, x, x + 0.3, BF + 6.3, BF + 6.9, Z(d - 1.9), Z(d + 1.9), '#b9ae9c', S_STONE); for (const s of [-1, 1]) box(Pb, x, x + 0.22, BF, BF + 6.3, Z(d + s * 1.7 - 0.2), Z(d + s * 1.7 + 0.2), '#b9ae9c', S_STONE); }
    for (const [x, d, s] of [[-4.2, 97.3, 0.62], [-4.3, 103.1, 0.5], [4.2, 96.9, 0.5]]) Pb.add(G_CROCK, { p: [x, BF, Z(d)], s: [s, s * 0.85, s], c: rp.pick(['#c9b48c', '#b89a6a', '#8a6444']), surf: SF(SURF.PLAIN, 0.55), grad: [BF, BF + 1.4, 1, 0.75] });
    for (const [x, d] of [[4.15, 87.9]]) { Pb.add(G_BOWL, { p: [x, BF, Z(d)], r: [0, 0, -0.25], s: [0.75, 1.5, 0.6], c: C.copper, surf: S_COPPER }); for (let k = 0; k < 6; k++) Pb.add(SPH6, { p: [x - 0.1 + rp() * 0.5 - 0.25, BF + 0.8 + rp() * 0.2, Z(d + rp() * 0.5 - 0.25)], s: [0.2, 0.16, 0.2], c: '#17171a', surf: SF(SURF.PLAIN, 0.5) }); }
    // four lit oil lamps on brackets, staggered west and east
    for (let i = 0; i < 4; i++) { const sx = i % 2 ? 1 : -1, d = 89.6 + i * 4.3; lamp(Pb, 4.56 * sx, BF + 7.9, Z(d), -sx, 0, 0.8); }
    // the bell hall's floor: a border of dark tile, lozenges of dark and cream tile in a chequer, pools of lantern light
    { const TILE = SF(SURF.PLAIN, 0.5), dk = '#4e2a22', cr = '#d6c09c', y0 = BF + 0.005, y1 = BF + 0.02;
      for (const sx of [-1, 1]) { box(Pb, (HW - 2.0) * sx, (HW - 1.4) * sx, y0, y1, Z(PE + 1.4), Z(132.6), dk, TILE); box(Pb, (HW - 2.35) * sx, (HW - 2.2) * sx, y0, y1, Z(PE + 2.2), Z(131.8), cr, TILE); }
      for (const d of [PE + 1.7, 132.3]) box(Pb, -(HW - 2.0), HW - 2.0, y0, y1, Z(d - 0.3), Z(d + 0.3), dk, TILE);
      for (let i = 0; i < 7; i++) for (let j = 0; j < 8; j++) { const x = -9 + i * 3, d = PE + 4.6 + j * 3.1; if (Math.abs(x) < 3.2 && d > 130.4) continue;
        Pb.add(cylG(4), { p: [x, BF + 0.012, Z(d)], s: [(i + j) % 2 ? 0.95 : 0.6, 0.016, (i + j) % 2 ? 0.95 : 0.6], c: (i + j) % 2 ? dk : cr, surf: TILE }); }
      pools.push([-6.5, BF + 0.05, Z(117), 7], [6.5, BF + 0.05, Z(117), 7], [0, BF + 0.05, Z(129.6), 6.5], [-10.6, BF + 0.05, Z(130.4), 3.4], [10.6, BF + 0.05, Z(130.4), 3.4]); }
    // low things stood out from both side walls toward the middle (all under 2 m, 5 m or more from the line): rows of
    // hot-water cans, a coal scuttle and a log basket, a trolley of lamps being trimmed
    for (const sx of [-1, 1]) {
      for (const [d, n] of [[110.6, 5], [127, 4]]) for (let i = 0; i < n; i++) { const s2 = 0.74 - 0.06 * i, x = (11.5 - i * 1.3) * sx, z = Z(d + 0.2 * (i % 2));
        Pb.add(G_CAN, { p: [x, BF, z], s: [s2, s2, s2], c: i % 3 === 1 ? C.brass : C.copper, surf: S_COPPER });
        Pb.add(new THREE.TorusGeometry(0.42, 0.05, 3, 6, Math.PI), { p: [x, BF + 1.72 * s2, z], r: [0, 0.6 * sx, 0], s: [s2, s2, s2], c: C.brass, surf: S_BRASS }); }
      { const x = 10.8 * sx, d = 115.4; Pb.add(G_BOWL, { p: [x, BF, Z(d)], r: [0, 0, -0.25 * sx], s: [0.75, 1.5, 0.6], c: C.copper, surf: S_COPPER }); for (let k = 0; k < 5; k++) Pb.add(SPH6, { p: [x + rp() * 0.5 - 0.25, BF + 0.8 + rp() * 0.2, Z(d + rp() * 0.5 - 0.25)], s: [0.2, 0.16, 0.2], c: '#17171a', surf: SF(SURF.PLAIN, 0.5) });
        const xb = 9.3 * sx, db = 116.3; Pb.add(G_BOWL, { p: [xb, BF, Z(db)], s: [0.95, 1.5, 0.95], c: '#a9824c', surf: SF(SURF.FABRIC, 0.06) }); for (let k = 0; k < 5; k++) Pb.add(cylG(6), { p: [xb + (k - 2) * 0.28, BF + 1.0 + (k % 2) * 0.22, Z(db)], r: [Math.PI / 2, 0, 0.2 * (k - 2)], s: [0.16, 1.5, 0.16], c: k % 2 ? '#7a5636' : '#8f6a44', surf: S_OAK }); }
      { const xa = 5.4 * sx, xb = 8.2 * sx, da = 121.4, db = 122.9, ty = BF + 1.3;
        box(Pb, xa, xb, ty - 0.12, ty, Z(da), Z(db), deal, S_DEAL); box(Pb, xa, xb, BF + 0.5, BF + 0.58, Z(da + 0.1), Z(db - 0.1), deal, S_DEAL);
        for (const x of [xa + 0.15 * sx, xb - 0.15 * sx]) for (const d of [da + 0.15, db - 0.15]) { box(Pb, x - 0.06, x + 0.06, BF + 0.3, ty - 0.12, Z(d - 0.06), Z(d + 0.06), '#b89a6a', S_DEAL); Pb.add(cylG(8), { p: [x, BF + 0.2, Z(d)], r: [Math.PI / 2, 0, 0], s: [0.2, 0.1, 0.2], c: '#3a3a40', surf: S_IRON }); }
        for (let k = 0; k < 5; k++) { const x = (5.9 + k * 0.5) * sx, z = Z(da + 0.45 + (k % 2) * 0.6);
          if (k % 2 === 0) shelfLamp(x, ty, z); else { Pb.add(SPH8, { p: [x, ty + 0.2, z], s: [0.22, 0.18, 0.22], c: C.brass, surf: S_BRASS }); Pb.add(cylG(8), { p: [x, ty + 0.7, z], s: [0.085, 0.62, 0.085], c: '#cfd6d8', surf: SF(SURF.PLAIN, 0.8) }); } } }
    }
    // the bell hall's side walls: a deal wainscot with a rail, a long shelf of lit lamps and polished cans, a row of hung pails
    for (const sx of [-1, 1]) { const xw = HW * sx, SY = BF + 5.3;
      box(Pb, xw, xw - 0.1 * sx, BF + 0.9, BF + 3.7, Z(PE + 0.3), Z(133.8), '#8f6e4a', S_DEAL); box(Pb, xw, xw - 0.22 * sx, BF + 3.7, BF + 3.92, Z(PE + 0.3), Z(133.8), '#6a4c30', S_DEAL);
      for (let d = PE + 1; d < 133.6; d += 1.5) box(Pb, xw - 0.1 * sx, xw - 0.14 * sx, BF + 0.9, BF + 3.7, Z(d - 0.04), Z(d + 0.04), '#5c4228', S_MATTE);
      box(Pb, xw, xw - 1.0 * sx, SY - 0.15, SY, Z(PE + 1.2), Z(129.2), deal, S_DEAL);
      for (let d = PE + 1.8; d < 129; d += 3.8) bar(Pb, [xw - 0.02 * sx, SY - 0.95, Z(d)], [xw - 0.8 * sx, SY - 0.15, Z(d)], 0.05, 0.08, '#3a3a40', S_IRON);
      for (let d = PE + 2, i = 0; d < 128.8; d += 2.1, i++) { const x = xw - 0.55 * sx, z = Z(d);
        if (i % 3 === 2) { const s2 = 0.5 + 0.2 * rp(); Pb.add(G_CAN, { p: [x, SY, z], s: [s2, s2, s2], c: i % 2 ? C.brass : C.copper, surf: S_COPPER }); }
        else shelfLamp(x, SY, z); }
      for (let k = 0; k < 9; k++) { const z = Z(PE + 2.6 + k * 2.8), x = xw - 0.62 * sx, yb = BF + 1.75, s2 = 0.9 + 0.2 * rp();
        Pb.add(cylG(8), { p: [x, yb + 0.45 * s2, z], s: [0.44 * s2, 0.9 * s2, 0.44 * s2], c: k % 3 === 2 ? '#8a3a22' : '#7a2a1e', surf: SF(SURF.PLAIN, 0.4), grad: [yb, yb + 0.9, 0.7, 1.05] });
        Pb.add(cylG(8), { p: [x, yb + 0.88 * s2, z], s: [0.46 * s2, 0.07, 0.46 * s2], c: C.brass, surf: S_BRASS });
        Pb.add(new THREE.TorusGeometry(0.4, 0.035, 3, 6, Math.PI), { p: [x, yb + 0.9 * s2, z], r: [0, Math.PI / 2, 0], s: [s2, 1.5, s2], c: '#3a3a40', surf: S_IRON });
        bar(Pb, [xw - 0.1 * sx, yb + 0.9 * s2 + 0.62, z], [x, yb + 0.9 * s2 + 0.58, z], 0.04, 0.04, '#3a3a40', S_IRON); } }
  }
  await ctx.yield();
  // ---- THE BELL HALL (d 104 to 134, x -13 to 13, 22 m high): the black oak board over the whole north wall, the plain
  // stone doorcase of the way out, two hanging lanterns and four lamps that rake the board ----
  const bells = [];
  {
    const rpl = R.planks, oak = '#1f120a', S_BOARD = SF(SURF.WOOD, 0.14), zb = BOARD.z, cy = BOARD.cy;
    for (let x = -HW; x < HW - 0.1; x += 1.5) { if (x + 1.5 <= -3.6 + 1e-6 || x >= 3.6 - 1e-6) box(Pb, x + 0.02, Math.min(x + 1.48, HW), BF, HT, zb - 0.14, zb, rpl.pick(['#1f120a', '#24150d', '#1a0f08', '#27170e']), S_BOARD); }
    for (const sx of [-1, 1]) box(Pb, 3.6 * sx, 5.05 * sx, BF, HT, zb - 0.14, zb - 0.004, oak, S_BOARD);
    Pb.add(gridGeo(12, 3, (u, v, p) => { const x = -3.6 + 7.2 * u, a = cy + Math.sqrt(Math.max(0, 3.6 * 3.6 - x * x)); p[0] = x; p[1] = a + (HT - a) * v; p[2] = zb; }, [0, 0, 1]), { c: oak, surf: S_BOARD });
    box(Pb, -HW, HW, HT - 0.5, HT, zb, zb + 0.3, '#140b06', S_OAK); for (const sx of [-1, 1]) box(Pb, (HW - 0.3) * sx, HW * sx, BF, HT, zb, zb + 0.3, '#140b06', S_OAK);
    // the stone doorcase: jambs, plinths, an arch ring and a keystone, all outside the opening's 3.5 m
    const st = '#c9bfad';
    for (const sx of [-1, 1]) { box(Pb, BOARD.rIn * sx, (BOARD.rIn + 0.65) * sx, BF, cy, zb, zb + 0.42, st, S_STONE); box(Pb, (BOARD.rIn - 0.0) * sx, (BOARD.rIn + 0.8) * sx, BF, BF + 1.2, zb, zb + 0.55, '#b3a999', S_STONE); box(Pb, BOARD.rIn * sx, (BOARD.rIn + 0.8) * sx, cy - 0.5, cy, zb, zb + 0.52, '#b3a999', S_STONE); }
    Pb.add(gridGeo(16, 1, (u, v, p) => { const a = Math.PI * u, r = BOARD.rIn + 0.65 * v; p[0] = -r * Math.cos(a); p[1] = cy + r * Math.sin(a); p[2] = zb + 0.42; }, [0, 0, 1]), { c: st, surf: S_STONE });
    Pb.add(gridGeo(16, 1, (u, v, p) => { const a = Math.PI * u, r = BOARD.rIn + 0.65; p[0] = -r * Math.cos(a); p[1] = cy + r * Math.sin(a); p[2] = zb + 0.42 * v; }, [0, 1, 0]), { c: '#b3a999', surf: S_STONE });
    Pb.add(gridGeo(16, 1, (u, v, p) => { const a = Math.PI * u, r = BOARD.rIn; p[0] = -r * Math.cos(a); p[1] = cy + r * Math.sin(a); p[2] = zb - 0.3 + 0.72 * v; }, [0, -1, 0]), { c: '#d6ccb9', surf: S_STONE });
    for (const sx of [-1, 1]) Pb.add(gridGeo(1, 2, (u, v, p) => { p[0] = BOARD.rIn * sx; p[1] = BF + (cy - BF) * v; p[2] = zb - 0.3 + 0.72 * u; }, [-sx, 0, 0]), { c: '#d6ccb9', surf: S_STONE });
    box(Pb, -0.45, 0.45, cy + BOARD.rIn - 0.1, cy + BOARD.rIn + 0.72, zb, zb + 0.5, '#d6ccb9', S_STONE);
    // ceiling beams, a stone skirting, two hanging lanterns, and two lamps a side close by the board that rake it
    for (let d = PE + 2.5; d < 134; d += 4.5) box(Pb, -HW, HW, HT - 0.7, HT, Z(d - 0.3), Z(d + 0.3), '#4a3020', S_OAK);
    for (const sx of [-1, 1]) { box(Pb, HW * sx, (HW - 0.14) * sx, BF, BF + 0.9, Z(PE), Z(134), '#a59c8e', S_STONE);
      const lx = 6.5 * sx, lz = Z(117), ly = 1.2;
      bar(Pb, [lx, HT - 0.7, lz], [lx, ly + 1.3, lz], 0.04, 0.04, C.iron, S_IRON);
      Pb.add(cylG(6), { p: [lx, ly + 1.2, lz], s: [0.5, 0.12, 0.5], c: C.brass, surf: S_BRASS }); Pb.add(cylG(6), { p: [lx, ly - 0.55, lz], s: [0.42, 0.12, 0.42], c: C.brass, surf: S_BRASS });
      Pb.add(cylG(6), { p: [lx, ly + 0.32, lz], s: [0.32, 1.6, 0.32], c: '#ffdca8', surf: SF(SURF.PLAIN, 0.6, 0, 1.5) });
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bar(Pb, [lx + Math.cos(a) * 0.42, ly - 0.5, lz + Math.sin(a) * 0.42], [lx + Math.cos(a) * 0.48, ly + 1.2, lz + Math.sin(a) * 0.48], 0.035, 0.035, C.brass, S_BRASS); }
      lampFlames.push([lx, ly - 0.3, lz, 0.7]); glowPts.push([lx, ly + 0.2, lz, 4]);
      lamp(Pb, (HW - 0.02) * sx, BF + 6.6, Z(131.2), -sx, 0, 1.6); lamp(Pb, (HW - 0.02) * sx, BF + 13.6, Z(131.2), -sx, 0, 1.6); }
    // THE BELLS: six arcs (four whole, two over the head) fanned round the head of the way out and down both its sides, graded by size from the
    // largest low at either side to the smallest at the top. Each has its own place, size, colour mark and timetable.
    const AX = [5.3, 7.2, 9.1, 11.0, 13.0, 15.0], BY = [5.6, 7.2, 8.8, 10.4, 12.0, 13.6], LOW = [BF + 3.9, BF + 3.4, BF + 3.0, BF + 2.8, cy + 4.6, cy + 8.5], yTop = cy + BY[5], yLo = LOW[3];
    const sizeAt = (y) => 0.68 + 1.32 * Math.pow(ctx.core.clamp((yTop - y) / (yTop - yLo), 0, 1), 2);
    const MARKS = ['#1f4fd6', '#d42a2a', '#2a9a4e', '#f0aa1e', '#f4eee0'];
    for (let a = 0; a < 6; a++) {
      const rb = stream('bells-arc-' + a);   // a stream for each arc: the number of its bells follows their sizes
      // walk down the right half from the apex; the left half mirrors it
      const pt = (s) => { const q = 0.5 * Math.PI * AX[a]; let acc = 0, px = 0, py = cy + BY[a]; const n = 80;
        for (let i = 1; i <= n; i++) { const f = i / n * Math.PI / 2, x = AX[a] * Math.sin(f), y = cy + BY[a] * Math.cos(f), seg = Math.hypot(x - px, y - py); if (acc + seg >= s) { const t = (s - acc) / seg; return [px + (x - px) * t, py + (y - py) * t]; } acc += seg; px = x; py = y; }
        return [AX[a], cy - (s - acc)]; };
      // how upright the arc runs at s (0 over the head, 1 down the sides): a bell needs its whole height there
      const steep = (s) => { const p0 = pt(Math.max(0, s - 0.2)), p1 = pt(s + 0.2); return Math.abs(p1[1] - p0[1]) / Math.max(1e-4, Math.hypot(p1[0] - p0[0], p1[1] - p0[1])); };
      let s = a % 2 ? 0 : 0.56;
      for (let guard = 0; guard < 70; guard++) {
        const [x, y] = pt(s); if (y < LOW[a]) break;
        const D = sizeAt(y) * rb.range(0.94, 1.06);
        for (const sx of (x < 0.05 ? [1] : [1, -1])) bells.push({ x: x * sx, y, D, arc: a, mark: rb.pick(MARKS), jit: rb(), amp: rb.range(0.85, 1.1) * (x > 10.4 ? 0.6 : 1) * (a === 0 && x > 4.3 ? 0.45 : 1), f: rb.range(0.92, 1.1) });
        s += D * (1.1 + 0.78 * steep(s)) + 0.34;
      }
    }
  }
  await ctx.yield();
  {
    // one bell, one coil and one tab, each an instanced mesh; the matrices are a pure function of the world's clock
    const G_BELL = copperShape([[0, -0.55], [0.3, -0.76], [0.46, -1.01], [0.5, -1], [0.33, -0.78], [0.24, -0.5], [0.19, -0.14], [0.1, 0.02], [0, 0.04]], 10, -2, null, 0, C.brass, S_BRASS);
    // the coiled spring: a flat spiral of steel strip in the board's plane, wound out from the mount to a hook at its foot
    const spi = []; for (let i = 0; i <= 18; i++) { const f = i / 18, a = -Math.PI / 2 - (1 - f) * Math.PI * 2 * 1.9, r = 0.2 + 0.8 * f; spi.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    const sb = INT.makeBuilder(); sb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spi), 18, 0.12, 3, false), { c: '#e6ecf2', surf: S_STEEL });
    const tb = INT.makeBuilder(); box(tb, -0.022, 0.022, -1.28, 0, -0.022, 0.022, '#8a8f96', S_STEEL); tb.add(cylG(8), { p: [0, -1.4, 0], r: [Math.PI / 2, 0, 0], s: [0.2, 0.05, 0.2], c: '#f0cf78', surf: S_BRASS });
    // a bell's body, its coil and its tab each go with the far or the near set of their kind by the box of their own
    // swing at its widest, in bell sizes D about the mount: the body 1.55 either side and 1.75 down, the coil 0.7 all
    // round, the tab 2.05 either side and 2.3 down. b.bell, b.coil, b.tab = [set (0 far, 1 near), place in that set]
    const cnt = { bell: [0, 0], coil: [0, 0], tab: [0, 0] };
    for (const b of bells) { const D = b.D, dA = z0 - (BOARD.z + 0.36 + 0.75 * D);
      const kind = (key, w, down, up) => { const k = inReach(b.x - w * D, b.x + w * D, b.y - down * D, b.y + up * D, dA, REACH.north) ? 0 : 1; b[key] = [k, cnt[key][k]++]; };
      kind('bell', 1.55, 1.75, 0.1); kind('coil', 0.7, 0.7, 0.7); kind('tab', 2.05, 2.3, 0.25); b.far = !(b.bell[0] && b.coil[0] && b.tab[0]); }
    const NB = bells.length, mk = (geo, name, where, n) => { const im = new THREE.InstancedMesh(geo, matP.prop, n); im.name = name; im.frustumCulled = false; where.add(im); triangles += geo.index.count / 3 * n; drawCalls++; return im; };
    const sets = (geo, name, key) => [cnt[key][0] ? mk(geo, name + '-far', far, cnt[key][0]) : null, cnt[key][1] ? mk(geo, name, near, cnt[key][1]) : null];
    const imBell = sets(G_BELL, 'bells', 'bell'), imCoil = sets(sb.build(), 'bell-springs', 'coil'), imTab = sets(tb.build(), 'bell-tabs', 'tab');
    // a brass bell-crank for every bell at the board's side rim, where its wire turns; it rocks when its bell is pulled
    const cb = INT.makeBuilder(); box(cb, -0.05, 0.05, -0.05, 0.5, -0.03, 0.03, C.brass, S_BRASS); box(cb, -0.5, 0.05, -0.05, 0.05, -0.03, 0.03, C.brass, S_BRASS);
    const crankFar = bells.some((b) => [-1, 1].some((sx) => inReach(sx * XR - 0.6, sx * XR + 0.6, b.y - 0.6, b.y + 0.6, 133, REACH.north)));
    const imCrank = mk(cb.build(), 'bell-cranks', crankFar ? far : near, NB), MY = new THREE.Matrix4().makeRotationY(Math.PI);
    bells.forEach((b, i) => { b.sx = b.x < -0.05 ? -1 : b.x > 0.05 ? 1 : (i % 2 ? 1 : -1); });
    // the timetable: three sets of bells on three cycles; within a set the pulls are spread over the cycle in a dealt
    // order, so 7 to 11 ring at every moment and no ring passes from a bell to its neighbour
    const rtt = R.timetable, CYC = [rtt.range(11.5, 12.7), rtt.range(14, 15.2), rtt.range(16.6, 18)], order = rtt.shuffle(bells.map((_, i) => i)), per = Math.ceil(NB / 3);
    order.forEach((bi, k) => { const b = bells[bi], g = k % 3, slot = Math.floor(k / 3); b.cyc = CYC[g]; b.off = (slot + 0.15 + 0.7 * b.jit) / per * CYC[g]; });
    // no ring passes to a neighbour: two bells that hang side by side on one cycle are never pulled within a second
    for (let pass = 0; pass < 5; pass++) for (let i = 0; i < NB; i++) for (let j = i + 1; j < NB; j++) { const p = bells[i], q = bells[j];
      if (p.cyc !== q.cyc || Math.hypot(p.x - q.x, p.y - q.y) > 2.6) continue;
      const dd = Math.abs(p.off - q.off), gap = Math.min(dd, p.cyc - dd); if (gap < 1.0) q.off = (q.off + 0.37 * q.cyc) % q.cyc; }
    for (const b of bells) {
      b.out = 0.36 + 0.2 * b.D; b.hs = 0.48 * b.D; b.z = BOARD.z + b.out;
      // the mark of colour: an enamel disc in a brass ring on the spring's boss, in the middle of the coil
      const mr = 0.13 + 0.13 * b.D, mz = b.z + 0.06;
      Pb.add(cylG(8), { p: [b.x, b.y, mz + 0.05], r: [Math.PI / 2, 0, 0], s: [mr * 1.2, 0.06, mr * 1.2], c: b.mark, surf: SF(SURF.PLAIN, 0.55, 0, 0.1) });
    }
    const M = new THREE.Matrix4(), sv = new THREE.Vector3(), hash = (x) => { const v = Math.sin(x) * 43758.5453; return v - Math.floor(v); };
    // where bell b stands at clock t: swing of the bell, bounce of its coil, swing of its tab (all dying away)
    const state = (b, t, out) => {
      const tt = t - b.off, ring = Math.floor(tt / b.cyc), tau = tt - ring * b.cyc, a = b.amp * (0.8 + 0.4 * hash(b.off * 17.3 + ring * 7.13));
      const th = tau < 6 ? 0.62 * a * Math.sin(tau * 6.283 * 1.55 * b.f) * Math.exp(-tau / 1.8) * (1 - tau / 6) : 0;
      const bo = tau < 3.2 ? 0.26 * a * Math.sin(tau * 6.283 * 3.3) * Math.exp(-tau / 0.6) : 0;
      const rel = tau < 12 ? 0.58 * a * Math.sin(tau * 6.283 * 1.05 * b.f + 0.6) * Math.exp(-tau / 5) * Math.min(1, tau * 4) * Math.min(1, (12 - tau) * 0.5) : 0;
      out.th = th; out.bo = bo; out.rel = rel; out.tau = tau; return out;
    };
    const st = { th: 0, bo: 0, rel: 0, tau: 0 };
    // while the near group is not shown only what hangs in the far sets is set (the state is a pure function of the clock)
    const setBells = (t, nearOn) => {
      const crankOn = crankFar || nearOn;
      for (let i = 0; i < NB; i++) {
        const b = bells[i], on = b.far || nearOn; if (!on && !crankOn) continue;
        state(b, t, st);
        if (on) { const L = b.hs * (1 + 0.5 * st.bo), sn = Math.sin(st.th * 0.85), cs = Math.cos(st.th * 0.85), bx = b.x + sn * L, by = b.y - cs * L;
          if (nearOn || !b.coil[0]) imCoil[b.coil[0]].setMatrixAt(b.coil[1], M.makeRotationZ(st.th * 0.85).scale(sv.set(L, L, b.D)).setPosition(b.x, b.y, b.z));
          if (nearOn || !b.bell[0]) imBell[b.bell[0]].setMatrixAt(b.bell[1], M.makeRotationZ(st.th * 1.25).scale(sv.set(b.D, b.D, b.D)).setPosition(bx, by, b.z));
          if (nearOn || !b.tab[0]) imTab[b.tab[0]].setMatrixAt(b.tab[1], M.makeRotationZ(st.th * 1.25 + st.rel).scale(sv.set(b.D, b.D, b.D)).setPosition(bx, by - 0.02, b.z)); }
        if (crankOn) { M.makeRotationZ(st.tau < 0.7 ? 0.45 * b.sx * Math.sin(st.tau / 0.7 * Math.PI) : 0); if (b.sx < 0) M.multiply(MY);
          imCrank.setMatrixAt(i, M.setPosition(b.sx * XR, b.y + 0.03, BOARD.z + 0.1)); }
      }
      for (const im of [imBell, imCoil, imTab]) { if (im[0]) im[0].instanceMatrix.needsUpdate = true; if (nearOn && im[1]) im[1].instanceMatrix.needsUpdate = true; }
      if (crankOn) imCrank.instanceMatrix.needsUpdate = true;
    };
    setBells(0, true); updates.push((dt, t) => setBells(t, near.visible));
  }
  addSplit(Pb.build(), matP.prop, 'passage-props');
  await ctx.yield();
  // ---- THE BELL WIRES: a dozen a side from the back lobby, down the kitchen's walls, along the passage and the bell
  // hall to the board's rim, and one along the board to every bell. Ribbons with a least width and the opacity that
  // matches it; each wire jerks
  // and trembles when a bell of its own is pulled (the bells' timetable, on the world's clock). ----
  {
    const rw = R.wires, POS = [], DIR = [], DSP = [], PUL = [], MSC = [], IDX = [], IDXF = [];
    let nv = 0;
    const vert = (p, d, disp, pul, side, shade) => { POS.push(p[0], p[1], p[2]); DIR.push(d[0], d[1], d[2]); DSP.push(disp[0], disp[1], disp[2]); PUL.push(pul[0], pul[1], pul[2], pul[3]); MSC.push(side, shade); return nv++; };
    const NO = [0, 0, 0], REST = [-1000, 1e6, -1000, 1e6];
    // one straight piece from a to b: two quads with a middle that can move by `disp`
    const piece = (a, b, disp, pul, shade = 0) => {
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1; d[0] /= l; d[1] /= l; d[2] /= l;
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], row = [];
      for (const [p, ds] of [[a, NO], [m, disp], [b, NO]]) { row.push(vert(p, d, ds, pul, -1, shade), vert(p, d, ds, pul, 1, shade)); }
      // the piece's triangles go to the far or the near wires by its own box, grown by REACH.wire: its jerk (0.3 m at
      // the most) and the ribbon's half width where the count's farthest lens place draws it (0.0013 of 420 m)
      const T = inReach(Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), z0 - Math.max(a[2], b[2]), z0 - Math.min(a[2], b[2]), REACH.wire) ? IDXF : IDX;
      for (let k = 0; k < 2; k++) { const i = row[k * 2], j = row[k * 2 + 1], i2 = row[k * 2 + 2], j2 = row[k * 2 + 3]; T.push(i, j, j2, i, j2, i2); }
    };
    const NB = bells.length, pullOf = () => { const b1 = bells[Math.floor(rw() * NB)], b2 = bells[Math.floor(rw() * NB)]; return [b1.off, b1.cyc, b2.off, b2.cyc]; };
    // a run of twelve wires along a polyline; `stack` is the step from wire to wire; guides (brass) stand every `gap` metres
    const run = (pts, stack, pulls, gap = 3.4) => {
      for (let w = 0; w < 12; w++) {
        const off = [stack[0] * w, stack[1] * w, stack[2] * w];
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.round(l / gap));
          const horiz = Math.abs(b[1] - a[1]) < 0.5 * l, disp = horiz ? [0, 0.16, 0] : [0.11, 0, 0.11];
          for (let k = 0; k < n; k++) { const f0 = k / n, f1 = (k + 1) / n;
            piece([a[0] + (b[0] - a[0]) * f0 + off[0], a[1] + (b[1] - a[1]) * f0 + off[1], a[2] + (b[2] - a[2]) * f0 + off[2]], [a[0] + (b[0] - a[0]) * f1 + off[0], a[1] + (b[1] - a[1]) * f1 + off[1], a[2] + (b[2] - a[2]) * f1 + off[2]], disp, pulls[w]);
            // the guide: a short brass strip across the stack at this joint (drawn once, with the first wire)
            if (w === 0) { const g = [a[0] + (b[0] - a[0]) * f0, a[1] + (b[1] - a[1]) * f0, a[2] + (b[2] - a[2]) * f0]; piece([g[0] - stack[0] * 1.5, g[1] - stack[1] * 1.5, g[2] - stack[2] * 1.5], [g[0] + stack[0] * 12.5, g[1] + stack[1] * 12.5, g[2] + stack[2] * 12.5], NO, REST, 1); }
          }
        }
      }
    };
    const UPS = [0, 0.09, 0];
    for (const sx of [-1, 1]) {
      const pulls = Array.from({ length: 12 }, pullOf), yb = FL + 7.1;
      run([[4.9 * sx, yb, Z(0.3)], [4.9 * sx, yb, Z(8.12)]], UPS, pulls, 3.1);
      if (sx > 0) run([[4.9, yb, Z(8.12)], [7.55, BF + 10.3, Z(9.6)], [7.55, BF + 10.3, Z(85.5)], [4.62, BF + 7.4, Z(85.9)]], UPS, pulls);
      else run([[-4.9, yb, Z(8.12)], [-22.5, BF + 14.2, Z(9.2)], [-22.5, BF + 14.2, Z(63.2)], [-20.2, BF + 14.2, Z(63.2)], [-20.2, BF + 14.2, Z(81.8)], [-22.5, BF + 14.2, Z(81.8)], [-22.5, BF + 14.2, Z(85.88)], [-7.2, BF + 14.2, Z(85.88)], [-4.62, BF + 7.4, Z(85.9)]], UPS, pulls);
      run([[4.62 * sx, BF + 7.4, Z(86.3)], [4.62 * sx, BF + 7.4, Z(PE - 0.1)]], [-0.036 * sx, 0.085, 0], pulls);
      run([[4.62 * sx, BF + 7.4, Z(PE + 0.06)], [(HW - 0.1) * sx, BF + 9.5, Z(PE + 0.1)], [(HW - 0.1) * sx, BF + 9.5, Z(133.5)]], UPS, pulls);
    }
    // on the board: a rail of wire under the rim, and one wire down to every bell's mount
    for (let i = 0; i < bells.length; i++) { const b = bells[i], sx = b.sx;
      piece([XR * sx, b.y + 0.03, BOARD.z + 0.05], [b.x + 0.14 * sx, b.y + 0.03, BOARD.z + 0.05], [0, 0.05, 0], [b.off, b.cyc, -1000, 1e6], 0.45); }
    for (const sx of [-1, 1]) for (const dx of [0.04, 0.12, 0.2]) piece([(XR + dx) * sx, 6.2, BOARD.z + 0.05], [(XR + dx) * sx, BF + 2.7, BOARD.z + 0.05], NO, REST, 0.45);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(POS, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(DIR, 3)); g.setAttribute('aDisp', new THREE.Float32BufferAttribute(DSP, 3));
    g.setAttribute('aPull', new THREE.Float32BufferAttribute(PUL, 4)); g.setAttribute('aMisc', new THREE.Float32BufferAttribute(MSC, 2)); g.setIndex(IDX);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-7, 0, Z(67)), 90);
    const gF = new THREE.BufferGeometry(); for (const k of ['position', 'aDir', 'aDisp', 'aPull', 'aMisc']) gF.setAttribute(k, g.attributes[k]); gF.setIndex(IDXF); gF.boundingSphere = g.boundingSphere;
    const uni = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]);
    const mat = new THREE.ShaderMaterial({ uniforms: uni, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        attribute vec3 aDir, aDisp; attribute vec4 aPull; attribute vec2 aMisc; uniform float uTime; varying float vEdge, vShade, vAlpha;
        #include <fog_pars_vertex>
        float pull(float off, float cyc){ float tau=mod(uTime-off, max(cyc,1.)); return exp(-tau*2.2)*sin(tau*36.)*step(tau,3.5); }
        void main(){
          vec3 p=position+aDisp*(pull(aPull.x,aPull.y)+pull(aPull.z,aPull.w));
          vec3 toCam=cameraPosition-p; float dist=length(toCam);
          vec3 perp=cross(aDir,toCam); perp=perp/max(length(perp),1e-4);
          float w0=0.016+0.03*aMisc.y, hw=max(w0, dist*0.0013);
          p+=perp*aMisc.x*hw; vEdge=aMisc.x; vShade=aMisc.y; vAlpha=(w0/hw)*(aMisc.y>.2&&aMisc.y<.5?.5:1.);
          vec4 mvPosition=viewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`precision highp float;
        varying float vEdge, vShade, vAlpha;
        #include <fog_pars_fragment>
        void main(){
          vec3 col=mix(vec3(.26,.22,.15),vec3(.5,.38,.16),vShade)*(.75+.5*(1.-abs(clamp(vEdge,-1.,1.))));
          gl_FragColor=vec4(col,clamp(vAlpha,0.,1.));
          #include <fog_fragment>
        }` });
    for (const [gg, name, where] of [[g, 'wires', near], [gF, 'wires-far', far]]) { if (!gg.index.count) continue;
      const mesh = new THREE.Mesh(gg, mat); mesh.name = name; mesh.frustumCulled = false; mesh.renderOrder = 3; where.add(mesh); triangles += gg.index.count / 3; drawCalls++; }
    updates.push((dt, t) => { uni.uTime.value = t; });
  }
  await ctx.yield();
  // ---- the back lobby's dress: a dado rail, a stone ring round the high arch, two oil lamps on iron brackets ----
  {
    const Lb = INT.makeBuilder(), st = '#cfc5b2';
    for (const sx of [-1, 1]) {
      box(Lb, 5 * sx, 4.86 * sx, FL + 4.1, FL + 4.4, Z(0.1), Z(6.5), '#4a2a20', S_OAK);
      box(Lb, 5 * sx, 4.88 * sx, FL, FL + 0.8, Z(0.1), Z(6.5), '#8f877c', S_STONE);
      lamp(Lb, 4.97 * sx, FL + 6.1, Z(3.2), -sx, 0, 0.9);
      // the arch's stone jambs towards the lobby
      box(Lb, 4 * sx, 4.5 * sx, FL, FL + 6, Z(6.3), Z(6.5), st, S_STONE);
    }
    Lb.add(gridGeo(14, 1, (u, v, p) => { const a = Math.PI * u, r = 4 + 0.5 * v; p[0] = -r * Math.cos(a); p[1] = FL + 6 + r * Math.sin(a); p[2] = Z(6.3); }, [0, 0, 1]), { c: st, surf: S_STONE });
    box(Lb, -0.45, 0.45, FL + 9.95, FL + 10.8, Z(6.2), Z(6.5), '#d8cdb6', S_STONE);
    addMesh(Lb.build(), matL.prop, 'lobby-props', far);
  }
  // ---- steam: a medium, soft and rising only from things that steam (the range's pots and kettles, the teapots, the
  // roasts on the spit, the sink's hot water and its cans, the side table's pot, the oven's mouth); lit warm by
  // the fires in the west and cut by the window shafts. No term of it reads how far the lens stands: every puff is
  // born STEAM_CLEAR and more from the route's line, by place. ----
  {
    const SRC = [], PAR = [], DRF = [];
    const louvre = [KCX, 14, Z(KD0 + 1.5 * BAY)];
    // no puff is born nearer the route's line than this margin: more than twice the half width of the largest puff
    // when it has come to its full strength (2.3 m x (0.5 + 2.3 x 0.14) = 1.9 m), so that none at its densest lies
    // across the line
    const STEAM_CLEAR = 4.5;
    // ONE law for every source: the thing gives its mouth's place and radius r (metres); from r alone follow the number
    // of its puffs, their size and their rise, and each puff leans to the louvre by the share of the way its rise covers
    const per = Math.max(4, Math.round(9 * detail));
    const source = (rs, x, y, z, r) => {
      if (routeDist(x, y, z) < STEAM_CLEAR) return;
      const q = ctx.core.clamp(r, 0.2, 1), n = Math.max(2, Math.round(per * 1.15 * q)), size = 0.5 + 1.25 * q, rise = 3 + 15 * q, pull = 0.5 * Math.min(1, rise / Math.max(1, louvre[1] - y));
      for (let i = 0; i < n; i++) { SRC.push(x + rs.range(-0.35, 0.35) * q, y, z + rs.range(-0.35, 0.35) * q); PAR.push(rs(), size * rs.range(0.7, 1.3), rise * rs.range(0.75, 1.2), rs.range(0.045, 0.075)); DRF.push((louvre[0] - x) * pull * rs.range(0.5, 1), 0, (louvre[2] - z) * pull * rs.range(0.5, 1)); }
    };
    // a stream for each source, by its number in the order the things are made
    steamers.forEach((st, k) => source(stream('steam-' + k), st[0], st[1], st[2], st[3]));
    const n = PAR.length / 4, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aSrc', new THREE.InstancedBufferAttribute(new Float32Array(SRC), 3)); g.setAttribute('aPar', new THREE.InstancedBufferAttribute(new Float32Array(PAR), 4)); g.setAttribute('aDrift', new THREE.InstancedBufferAttribute(new Float32Array(DRF), 3));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(KCX, 0, Z(47)), 70);
    const uni = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uOpacity: { value: 0.33 }, uSunDir: { value: new THREE.Vector3(...sunDir) }, uSunCol: { value: new THREE.Color(HR.sun) },
      uWarm: { value: new THREE.Color('#ffc890') }, uCool: { value: new THREE.Color('#dfe6f2') }, uWin: { value: new THREE.Vector4(KX1, WIN.cy, Z(WIN.d0), WIN.sp) }, uWin2: { value: new THREE.Vector4(WIN.w / 2, WIN.h / 2, WIN.n, KX1 - KX0) },
      // the lantern's light on what steam comes under it: its opening's place and area, and the hour's sky at the
      // hour's strength (as a share of the brightest hour's), by the share the window shafts light steam with (0.85)
      uLan: { value: new THREE.Vector4(LAN.x, LAN.y1, LAN.z, LAN.open) },
      uLanCol: { value: new THREE.Color(HR.sky).multiplyScalar(0.85 * LAN.gain * HR.skyI / Math.max(...Object.values(HOURS).map((h) => h.skyI))) } }]);
    const mat = new THREE.ShaderMaterial({ uniforms: uni, fog: true, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        attribute vec3 aSrc, aDrift; attribute vec4 aPar; uniform float uTime; varying vec2 vUv; varying vec3 vW; varying float vFade, vSeed;
        #include <fog_pars_vertex>
        void main(){
          float seed=aPar.x, life=fract(uTime*aPar.w+seed), e=1.-(1.-life)*(1.-life);
          vec3 c=aSrc+vec3(0.,aPar.z*e,0.)+aDrift*(life*life);
          c.x+=sin(life*5.+seed*40.)*.4*aPar.y*life; c.z+=cos(life*4.+seed*23.)*.4*aPar.y*life;
          float sz=aPar.y*(.5+2.3*life);
          vec3 toCam=cameraPosition-c; float dist=length(toCam); toCam/=max(dist,1e-3);
          vec3 right=normalize(cross(vec3(0.,1.,0.),toCam)+vec3(1e-4,0.,0.)); vec3 upv=cross(toCam,right);
          vec3 wp=c+(right*position.x+upv*position.y)*sz;
          vFade=smoothstep(0.,.14,life)*(1.-smoothstep(.5,1.,life));
          vUv=position.xy; vW=wp; vSeed=seed;
          vec4 mvPosition=viewMatrix*vec4(wp,1.); gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`precision highp float;
        uniform float uTime, uOpacity; uniform vec3 uSunDir, uSunCol, uWarm, uCool, uLanCol; uniform vec4 uWin, uWin2, uLan; varying vec2 vUv; varying vec3 vW; varying float vFade, vSeed;
        #include <fog_pars_fragment>
        float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
        float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
        void main(){
          float r=length(vUv);
          vec2 q=vUv*1.7+vSeed*37.+vec2(0.,-uTime*.13);
          float n=vn(q)*.6+vn(q*2.3+7.)*.4;
          float a=smoothstep(1.,.1,r); a=a*a*(.2+.8*n);
          a=clamp(a*clamp(vFade,0.,1.)*uOpacity,0.,1.);
          float t=(uWin.x-vW.x)/max(uSunDir.x,.05); vec3 hit=vW+uSunDir*t;
          float kz=clamp(floor((uWin.z-hit.z)/uWin.w+.5),0.,uWin2.z-1.), dz=abs(hit.z-(uWin.z-kz*uWin.w)), dy=abs(hit.y-uWin.y);
          float beam=(1.-smoothstep(uWin2.x*.75,uWin2.x*1.1,dz))*(1.-smoothstep(uWin2.y*.75,uWin2.y*1.1,dy));
          float west=clamp((uWin.x-vW.x)/uWin2.w,0.,1.);
          vec3 col=mix(uCool,uWarm,west*west)*(.5+.3*n)+uSunCol*(beam*.85);
          // under the lantern: the law of the rig's window rows (the opening's area seen from this place, by place alone)
          vec3 lv=vW-uLan.xyz; float lq=dot(lv,lv);
          col+=uLanCol*(uLan.w*max(-lv.y,0.)*inversesqrt(lq+1e-4)/(lq+uLan.w));
          gl_FragColor=vec4(col,a);
          #include <fog_fragment>
        }` });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'steam'; mesh.frustumCulled = false; mesh.renderOrder = 5; far.add(mesh);
    triangles += n * 2; drawCalls++; updates.push((dt, t) => { uni.uTime.value = t; });
  }
  await ctx.yield();
  // ---- every flame of the part in one mesh: the range's grates, the hearth, the lamps and candles ----
  {
    const fl = INT.makeFlames({ flames: lampFlames, fires, rng: R.flames, gain: 0.8 });
    fl.object.frustumCulled = false; far.add(fl.object); triangles += fl.triangles; drawCalls++; updates.push((dt, t) => fl.update(dt, t));
  }
  await ctx.yield();
  // ---- a soft halo on the wall behind every bracket lamp: wall-aligned discs of added light (a medium, like the flames) ----
  {
    const g = new THREE.BufferGeometry(), P = [], U = [], I = [];
    halos.forEach((h, k) => { const [x, y, z, nx, nz, r] = h, tx = -nz, tz = nx, o = k * 4;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(x + nx * 0.06 + tx * a * r, y + b * r, z + nz * 0.06 + tz * a * r); U.push(a, b); }
      I.push(o, o + 1, o + 2, o, o + 2, o + 3); });
    pools.forEach((h) => { const [x, y, z, r] = h, o = P.length / 3;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(x + a * r, y, z + b * r); U.push(a, b); }
      I.push(o, o + 2, o + 1, o, o + 3, o + 2); });
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
    const mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){
          vUv=uv; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`precision highp float;
        uniform float uTime; varying vec2 vUv;
        #include <fog_pars_fragment>
        void main(){
          float d=clamp(length(vUv),0.,1.), a=(1.-d)*(1.-d)*(.5+.05*sin(uTime*7.+vUv.y*2.));
          vec3 col=vec3(1.,.72,.4)*a*.55;
          #ifdef USE_FOG
          col*=1.-clamp((vFogDepth-fogNear)/max(fogFar-fogNear,1e-3),0.,1.);
          #endif
          gl_FragColor=vec4(col,1.);
        }` });
    const m = new THREE.Mesh(g, mat); m.name = 'lamp-glow'; m.frustumCulled = false; m.renderOrder = 2; far.add(m); triangles += I.length / 3; drawCalls++;
    updates.push((dt, t) => { mat.uniforms.uTime.value = t; });
  }
  await ctx.yield();
  const routePoints = belowRoute(z0);
  // where the passage opens into the hall: on the axis, at the route's own height there (on the line between its two
  // points either side of that place)
  const mouthY = (() => { const zq = Z(PE);
    for (let i = 0; i + 1 < routePoints.length; i++) { const a = routePoints[i], b = routePoints[i + 1]; if (a[2] >= zq && b[2] <= zq) return a[1] + (b[1] - a[1]) * (a[2] - zq) / (a[2] - b[2]); }
    return routePoints[routePoints.length - 1][1]; })();
  const anchors = { door: [0, 9.3, z0], highArch: [0, 8.8, Z(8)], range: [-21, -9.5, Z(47)], dresser: [8, -8, Z(60)],
    kitchenArchNorth: [0, -7, Z(86)], hallMouth: [0, mouthY, Z(PE)], board: [0, -4, Z(134)], portal: [0, -8.7, Z(134)] };
  return {
    object: group, far: far, near: near, anchors, routePoints,
    update(dt, time, camera) {
      rigL.update(time, group); rigK.update(time, group); rigP.update(time, group);
      for (let i = 0; i < updates.length; i++) updates[i](dt, time, camera);
    },
    dispose() {},
    get triangles() { return Math.round(triangles); },
    get drawCalls() { return drawCalls; },
  };
}
