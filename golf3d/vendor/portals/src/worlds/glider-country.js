// Glider Country: a ceramic-toy plain of bevelled pastel cubes that is one running game of Life.
// Everything standing is a cell of the rule (src/parts/glider-country.js runs it); this module lays out the plain
// (the Gun with its banded bastions, the walkers' street with a row of old banded towers either side and kerb gardens
// behind, a court of sixteen turnstiles and a pulsar plaza north-west of the Gun, ~300 still-life gardens, the eater,
// the portal garden and its moss hedge), draws the toy sky (flat dome, square sun, cube clouds), the far ring of
// towers, the ring the portal sits in, and keeps the rule in step with the flight.
//
// The journey (60 s, 1090 m) is out and back along the walkers' street. In low from the eater's end, up the street
// against the file of walkers (u 0.02; one passes close at 0.08), the Gun between the last towers (0.16), a climb over
// its two ramps (0.25), the turnstile court (0.34) and the pulsar plaza (0.43) from 54 m, a turn, then back: the
// whole pile-up with the street running to the ring (0.52, 0.61), down to 10 m to travel beside one walker on the
// starboard side (0.70-0.79), across the street behind it to the eater (0.87) and the ring (0.94).
// A timetable (PHI) says which step of the rule each u shows, so every fixed still catches the land part-way
// through a figure; pace() follows from it.
//
// Variations by seed: hour (sun at 36 degrees / at 17 with long shadows / shadowless overcast with deep occlusion
// pools), glaze set (sorbet / celadon / blue-and-white), soil (mixed / city / meadow). Rare event: a fleet of four
// nine-cube spaceships troops east past the plaza on long wakes; they are real lightweight spaceships in the rule.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, GLSL_COMMON, bevelBoxGeometry, parseRLE, orient, RLE } from '../parts/glider-country.js';

//                 cream      coral      apricot    mint       moss       sky        indigo
const GLAZES = {
  sorbet: ['#F7EFE2', '#FF8E7A', '#FFC98A', '#9ED9C3', '#4FA58E', '#8FD3F0', '#2B3A67'],
  celadon: ['#F1EBDD', '#96607F', '#E9B7A6', '#B5D8C0', '#5E9C82', '#A9D6DA', '#3A2F5E'],
  blue: ['#F6F0E4', '#F08A4B', '#F9D7A8', '#A9C6EA', '#3F68B8', '#9CCBF2', '#1F2F6E'],
};
// The sun stands in the south-south-west, off the starboard beam of the walkers' street: the starboard row's shadows
// bar the street, the port row is lit, and flying either way along it the sun is never in frame or behind the ring.
// tone: lit sides mix to apricot, shade sides mix to indigo, shade tone, lit tone. ao: depth of the occlusion pools.
const HOURS = {
  high: { el: 36, az: 216, shadow: 1, sunSize: 1, veil: 0, tone: [0.22, 0.34, 0.44, 0.96], haze: 1700, cloud: 0.62, ao: 1 },
  low: { el: 17, az: 222, shadow: 1, sunSize: 1.25, veil: 0.25, tone: [0.42, 0.36, 0.4, 0.97], haze: 1500, cloud: 0.48, ao: 1 },
  overcast: { el: 52, az: 216, shadow: 0, sunSize: 0, veil: 0, tone: [0.0, 0.46, 0.33, 0.8], haze: 1400, cloud: 0.24, ao: 1.9 },
};
// ---------------------------------------------------------------------------------------------
// SKY: a flat toy dome. Sky blue overhead easing through sea-glass at 12 degrees to cream on the
// horizon; the sun is a soft-cornered apricot square.
// ---------------------------------------------------------------------------------------------
const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main() { vDir = position; vec4 p = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * p; }`;
const SKY_FRAG = /* glsl */`
  uniform vec3 uTop, uMid, uLow, uSunCol, uSunDir, uSunX, uSunY; uniform float uSunSize, uVeil;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
    float el = asin(clamp(d.y, -1., 1.)) * 57.2958;
    vec3 col = mix(uLow, uMid, smoothstep(0.5, 12., el));
    col = mix(col, uTop, smoothstep(7., 52., el));
    // two faint paler bands, as if the dome were glazed in three pours
    col *= 1. + 0.018 * (1. - smoothstep(0., 0.4, abs(el - 12.))) + 0.014 * (1. - smoothstep(0., 0.4, abs(el - 27.)));
    col = mix(col, uLow * 0.97, uVeil * 0.62);
    col = mix(col, uLow * 0.9, (1. - smoothstep(-6., 0., el)));
    // the square sun and its two soft square halos
    float fx = dot(d, uSunX), fy = dot(d, uSunY), fz = dot(d, uSunDir);
    vec2 q = abs(vec2(fx, fy)) / max(uSunSize, 1e-3);
    float r = 0.0524;                                         // 3 degrees of half-width
    vec2 e = q - (r - 0.014);
    float sd = length(max(e, 0.)) + min(max(e.x, e.y), 0.) - 0.014;
    float front = step(0., fz) * step(0.01, uSunSize);
    float disc = (1. - smoothstep(-0.002, 0.002, sd)) * front;
    float halo = (1. - smoothstep(0., 0.05, sd)) * front, halo2 = (1. - smoothstep(0., 0.2, sd)) * front;
    col = mix(col, uSunCol, 0.22 * halo2 * halo2 + 0.2 * halo);
    col = mix(col, uSunCol * 1.5, disc);
    gl_FragColor = vec4(col, 1.);
  }`;

// ---------------------------------------------------------------------------------------------
// CLOUDS of cream cubes and the FAR RING of towers: bevelled boxes shaded by the hero's face-tone table.
// A cloud cube's scale follows a slow hashed automaton: every 2 s it may be gained or lost, eased over
// the whole tick, so the clouds accrete and erode without a pop.
// ---------------------------------------------------------------------------------------------
const BOX_VERT = /* glsl */`
  attribute vec3 inset; attribute vec4 aPos, aTint;      // aPos: xyz centre-base + width; aTint: height, hash, flip threshold (clouds), roof
  uniform float uTime, uCloud; uniform vec2 uDrift;
  varying vec3 vN, vWorld, vLocal; varying vec4 vTint; varying float vH;
  float h11(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
  void main() {
    float tick = uTime * 0.5 * (0.3 + 0.7 * fract(aTint.y * 7.31)) + aTint.y * 13., t0 = floor(tick), f = fract(tick);
    float a = step(aTint.z, h11(aTint.y * 91.7 + t0 * 0.618)), b = step(aTint.z, h11(aTint.y * 91.7 + (t0 + 1.) * 0.618));
    float sc = mix(1., mix(a, b, f * f * (3. - 2. * f)), uCloud);
    float hw = aPos.w * 0.5 * sc, H = aTint.x * sc, bev = min(mix(0.6, 1.4, uCloud), hw * 0.4);
    vec3 p = vec3(position.x * (hw - inset.x * bev), position.y * (H - inset.y * bev) + (aTint.x - H) * 0.5 * uCloud, position.z * (hw - inset.z * bev));
    vLocal = p; vH = H; vTint = aTint;
    vec3 w = aPos.xyz + p; w.xz += uDrift * uCloud;
    w.y += uCloud * 1.5 * sin(uTime * 0.21 + aTint.y * 40.);
    if (sc < 0.02) w = vec3(0., -900., 0.);
    vN = normal;
    vec4 wp = modelMatrix * vec4(w, 1.); vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const BOX_FRAG = /* glsl */`
  uniform float uCloud, uVeil;
  varying vec3 vN, vWorld, vLocal; varying vec4 vTint; varying float vH;
  ${GLSL_COMMON}
  void main() {
    vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
    float d = distance(cameraPosition, vWorld);
    float topF = step(0.9, n.y), sideF = 1. - step(0.2, abs(n.y));
    // towers: cream glaze with a storey step, a moss roof under a mint lip, grooves that fade with distance
    float st = floor(vLocal.y / 6.);
    vec3 tower = uCream * (0.93 + 0.07 * hash21(vec2(st, floor(vTint.y * 97.))));
    tower = mix(tower, uApricot, 0.10 * hash21(vec2(floor(vTint.y * 53.), st + 3.)));
    // far towers carry the city's glaze bands too: every third storey coral, sky or mint, and the landmarks an apricot crown
    float bsel = hash21(vec2(floor(vTint.y * 97.), 5.)), bandOn = step(mod(st + floor(vTint.z * 3.), 3.), 0.5);
    vec3 bandC = mix(mix(mix(uApricot, uCoral, 0.45), mix(uSky, uMint, 0.3), step(0.4, bsel)), uMint * 0.92, step(0.75, bsel));
    tower = mix(tower, bandC, sideF * bandOn * 0.8);
    tower = mix(tower, mix(uApricot, uCoral, 0.3), sideF * step(vH - 12., vLocal.y) * step(0.5, vTint.z) * 0.85);
    float fy = fwidth(vLocal.y) + 1e-4;
    float gy = abs(fract(vLocal.y / 6. + 0.5) - 0.5) * 6.;
    tower *= 1. - sideF * 0.22 * (1. - smoothstep(0.2, 0.2 + fy, gy)) * (1. - smoothstep(0.3, 1.2, fy));
    tower = mix(tower, uMoss * (0.92 + 0.12 * vTint.y), topF * vTint.w);
    tower = mix(tower, uMint, step(0.3, n.y) * (1. - topF) * vTint.w);
    // clouds: cream cubes, a paler pooled top, undersides tinted by the sky
    vec3 cloud = mix(uCream, vec3(1.), 0.25) * (0.985 + 0.03 * vTint.y);
    vec3 col = faceTone(mix(tower, cloud, uCloud), n);
    vec3 under = mix(uCream, uSky, 0.42) * 0.86;
    vec3 cside = mix(mix(uCream, uSky, 0.3) * 0.9, uCream * 1.02, step(0., dot(n.xz, uSun.xz)));
    vec3 ccol = mix(mix(cside, cloud * 1.04, step(0.3, n.y)), under, step(n.y, -0.5));
    col = mix(col, ccol, uCloud);
    float haze = mix(1., 0.45, uCloud);
    float hx = d * haze / max(uHaze, 1.);
    col = mix(col, uHorizon, min(mix(0.42, 0.8, uCloud), 1. - exp(-hx * sqrt(hx))));
    gl_FragColor = vec4(col, 1.);
  }`;

// ---------------------------------------------------------------------------------------------
// THE PLAIN. Everything here is a stamp for the rule: still lifes with a three-cell moat, placed in cells
// counted from the Gun's north-west corner (lx east, lz south). Local metres: x = (lx - 18) * 6,
// z = (lz - 4.5) * 6 at a cell's corner. Returns the stamps plus the places the world needs.
// ---------------------------------------------------------------------------------------------
const STILL = ['block', 'beehive', 'loaf', 'boat', 'tub', 'pond', 'ship'];
const SQ = Math.SQRT1_2;
const RING_OFF = 22, RING_BACK = 12, PLAZA = [-275, 19], COURT = [-160, -52];                                   // the ring stands this far to starboard of the walkers' line, this far short of the eater
const glideXZ = (t) => [51 + SQ * t, 45 + SQ * t];                      // the gliders' own line, metres along it from the lane start
// THE ROUTE (t metres down the walkers' line from the Gun, off metres to starboard of it, height). In at the far end
// of the avenue, low, facing the whole file of walkers coming down it from the Gun on the axis; up the street against
// them (one passes close, head first), climbing as the rows of towers slide by; over the Gun as its two ramps meet;
// out over the pulsar plaza in the north forecourt and round to the left; back over the machine with the pile-up to
// port and the whole avenue running away to the ring; down the south side to walk beside the newest walker at its own
// height; then on down the street behind the older ones to the eater and the ring that stands beside it.
const sideXZ = (t, off) => [51 + SQ * t - SQ * off, 45 + SQ * t + SQ * off];   // t metres down the gliders' line, off metres to starboard of it
const R_OVER = 8, R_DOWN = 19, R_WALK1 = 22, WALK_OFF = 30;   // the route's named stations
function routePoints(L) {
  const s = (t, off, y) => { const q = sideXZ(t, off); return [q[0], y, q[1]]; };
  return [s(L - 36, -8, 13), s(L - 75, -7, 12.5), s(L - 120, -7, 11), s(L - 160, -6, 12), s(L - 200, -3, 16), s(100, -4, 30), s(50, -5, 49), s(0, -11, 54),
    s(-45, -17, 54), s(-95, -22, 54), s(-150, -24, 54), s(-195, -10, 54), s(-212, 4, 54), s(-203, 20, 53), s(-180, 26, 52), s(-150, 30, 50), s(-115, 36, 48),
    s(-85, 36, 45), s(-52, 32, 30), s(-20, 29, 12), s(10, WALK_OFF, 9), s(40, WALK_OFF, 10), s(110, WALK_OFF, 10), s(165, 16, 9), s(L - 125, 10, 9.5), s(L - 62, RING_OFF - 2, 10), s(L - RING_BACK, RING_OFF, 9)];
}
function distToLine(P, x, z) {
  let best = 1e9;
  for (let i = 1; i < P.length; i++) {
    const ax = P[i - 1][0], az = P[i - 1][1], bx = P[i][0] - ax, bz = P[i][1] - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
    const d = Math.hypot(x - ax - bx * t, z - az - bz * t); if (d < best) best = d;
  }
  return best;
}
async function layoutPlain(info, rng, V, ctx) {
  const N = 256, gx = info.gx, gz = info.gz, far = info.far, lane = info.lane;
  const occ = new Uint8Array(N * N), stamps = [];
  const e = info.eater || { x: lane.x + far, z: lane.z + far };
  const laneLen = (((e.x + 2 - 18) * 6 - 51) + ((e.z + 2 - 4.5) * 6 - 45)) * SQ;
  const seat = sideXZ(laneLen - RING_BACK, RING_OFF);
  const R = routePoints(laneLen), line = R.map((q) => [q[0], q[2]]), nl = line.length;
  line.unshift([2 * line[0][0] - line[1][0], 2 * line[0][1] - line[1][1]]);                                   // 38 m of clear air behind the entry
  line.push([line[nl][0] + (line[nl][0] - line[nl - 1][0]) * 0.3, line[nl][1] + (line[nl][1] - line[nl - 1][1]) * 0.3]);   // and 15 m beyond the ring
  const metres = (lx, lz) => [(lx - 17.5) * 6, (lz - 4) * 6];              // centre of a cell
  const cellOf = (x, z) => [Math.floor(x / 6 + 18), Math.floor(z / 6 + 4.5)];
  const dPath = (lx, lz) => { const m = metres(lx, lz); return distToLine(line, m[0], m[1]); };
  const mark = (lx, lz) => { const X = lx + gx, Z = lz + gz; if (X >= 0 && Z >= 0 && X < N && Z < N) occ[Z * N + X] = 2; };
  // keep-outs: the Gun and its moat, the gliders' lane (six cells either side of their diagonal), the camera's corridor, the fleet's lane
  for (let z = -10; z <= 14; z++) for (let x = -10; x <= 45; x++) mark(x, z);
  for (let k = -6; k <= far + 7; k++) for (let d = -6; d <= 6; d++) { mark(lane.x + k + d, lane.z + k); if (d > -6) mark(lane.x + k + d, lane.z + k + 1); }   // (to 7 cells past the eater: its bite throws sparks)
  const lowA = line.slice(0, 6), lowB = line.slice(R_DOWN + 1);
  for (let Z = 0; Z < N; Z++) {
    if (Z % 8 === 0) await ctx.yield();
    for (let X = 0; X < N; X++) {
      const m = metres(X - gx, Z - gz);
      // 10.6 m either side of the whole route; 11.5 m where the lens flies low in the street
      if (distToLine(line, m[0], m[1]) < 10.6 || distToLine(lowA, m[0], m[1]) < 11.5 || distToLine(lowB, m[0], m[1]) < 11.5) occ[Z * N + X] = 2;
    }
  }
  if (V.fleet) for (let z = V.fleet.z0 - 3; z <= V.fleet.z0 + 7; z++) for (let x = V.fleet.x0; x <= V.fleet.x1; x++) mark(x, z);
  if (V.fleet) for (let z = V.fleet.z0 + 2; z <= -8; z++) for (let x = V.fleet.cx - 3 * SHIP_PITCH - 4; x <= 8; x++) mark(x, z);   // and the open ground between the plaza and the fleet's row, so the whole file is seen
  const place = (cells, lx, lz, age, cap, extra) => {
    let x1 = 0, z1 = 0; for (const c of cells) { if (c[0] > x1) x1 = c[0]; if (c[1] > z1) z1 = c[1]; }
    const pad = extra?.pad || 0, X0 = lx + gx - pad, Z0 = lz + gz - pad, X1 = lx + gx + x1 + pad, Z1 = lz + gz + z1 + pad;
    if (X0 < 13 || Z0 < 13 || X1 > N - 14 || Z1 > N - 14) return false;
    const mo = extra?.moat ?? 3;
    for (let Z = Z0 - mo; Z <= Z1 + mo; Z++) for (let X = X0 - mo; X <= X1 + mo; X++) {
      if (occ[Z * N + X] === 1) return false;
    }
    if (!extra?.force) for (const c of cells) if (occ[(lz + gz + c[1]) * N + lx + gx + c[0]] === 2) return false;
    for (let Z = Z0; Z <= Z1; Z++) for (let X = X0; X <= X1; X++) occ[Z * N + X] = 1;
    stamps.push({ cells, cx: lx, cz: lz, age, cap, ivy: extra?.ivy });
    return true;
  };
  const pat = (name, o) => orient(parseRLE(RLE[name]), o ?? rng.int(0, 7));
  const block = parseRLE(RLE.block);
  const court = (lx, lz) => { const m = metres(lx, lz); return Math.abs(m[1]) < 215 && Math.abs(m[0]) < 150 + Math.abs(m[1]) * 0.2; };   // the forecourts north and south of the Gun
  const capAt = (d, r) => {                                               // storeys allowed by the soil, d metres from the path
    if (d < 42) return r < 0.6 ? 1 : 2;
    if (V.soil === 'city') return Math.min(d < 330 ? 10 : 14, Math.round(4 + (d - 42) / 16 + r * 4));
    if (V.soil === 'meadow') return 1 + Math.floor(r * 2.99);
    return Math.max(1, Math.min(14, Math.round(1 + r * 2.2 + Math.max(0, d - 42) * 0.021 * (0.25 + r))));
  };

  // the north forecourt, under the lens as it comes off the Gun: first the turnstile court, sixteen blinkers in step
  // (a post that never dies and two arms that are born north and south, then east and west), then the pulsar plaza
  // inside the turn, a figure of 48 to 72 cells that opens and closes in rings
  const courtM = sideXZ(COURT[0], COURT[1]), courtC = cellOf(courtM[0], courtM[1]), courtCells = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) for (let d = 0; d < 3; d++) courtCells.push([i * 4 + d, j * 4 + 1]);
  place(courtCells, courtC[0] - 7, courtC[1] - 7, 1, 1, { pad: 2, force: true });
  const plazaM = sideXZ(PLAZA[0], PLAZA[1]), plazaC = cellOf(plazaM[0], plazaM[1]);
  place(pat('pulsar', 0), plazaC[0] - 6, plazaC[1] - 6, 1, 1, { pad: 3, force: true });
  const plazas = [plazaC, courtC].map((c) => [c[0] - 8, c[1] - 8, c[0] + 8, c[1] + 8]);
  // the Gun's two ends as bastions: three more old blocks stepping down outside each ever-living end tower
  for (const [x, z, cap] of [[-3, 1, 8], [-3, 7, 6], [37, -1, 8], [37, 5, 6]]) place(block, x, z, 255, V.soil === 'meadow' ? cap - 1 : cap, { force: true, moat: 2, ivy: 0.5 });
  // THE AVENUE: two rows of old block towers, one every 25 m, 42 m either side of the walkers' line, corner to corner
  // so that each row reads as one wall from the Gun to the eater; every fourth one stands two storeys above its
  // neighbours.
  const avBase = V.soil === 'city' ? 7 : V.soil === 'meadow' ? 5 : 6;
  let rowsP = 0, rowsS = 0;
  for (let k = 8, n = 0; k + 3 < far; k += 3, n++) {
    const capP = avBase - (n % 2) + (n % 4 === 1 ? 2 : 0), capS = avBase - ((n + 1) % 2) + (n % 4 === 3 ? 2 : 0);
    if (place(block, lane.x + k + 4, lane.z + k - 5, 255, capP, { moat: 1, ivy: 0.2 })) rowsP++;
    if (k * 6 * Math.SQRT2 < laneLen - 78 && place(block, lane.x + k - 6, lane.z + k + 6, 255, capS, { moat: 1, ivy: 0.2 })) rowsS++;   // the starboard row stops short of the ring's forecourt
  }
  // kerb gardens behind the rows: low still lifes with their cube-trees
  for (let k = 7; k + 6 < far; k += 8) for (const sgn of [-1, 1]) {
    const kd = sgn > 0 ? 9 : 15, bx = lane.x + k + sgn * kd, bz = lane.z + k - sgn * kd;
    for (const [ox, oz, nm] of [[0, 0, 'beehive'], [3 * sgn, -3 * sgn, 'boat'], [5, 5, 'loaf'], [-4, -4, 'tub'], [7 * sgn, -6 * sgn, 'pond']]) {
      place(pat(nm), bx + ox, bz + oz, rng.chance(0.3) ? rng.int(30, 100) : rng.int(130, 255), rng.chance(0.55) ? 1 : 2, { moat: 2 });
    }
  }
  // the ring's garden: the ring stands in the street itself, beside the walkers' track and just short of the eater;
  // 90 m behind it a moss hedge closes the avenue, with beds of low still lifes in the forecourt and behind the eater
  const hm = sideXZ(laneLen + 78, RING_OFF + 4), hc = cellOf(hm[0], hm[1]);
  for (let j = -4; j <= 4; j++) place(block, hc[0] + 3 * j, hc[1] - 3 * j, 255, Math.abs(j) < 4 ? 8 : 7, { ivy: 1, moat: 1 });
  for (let j = -4; j <= 3; j++) place(block, hc[0] + 3 * j + 6, hc[1] - 3 * j + 3, 255, 9 + ((j + 4) % 2), { ivy: 1, moat: 1 });
  const beds = [['tub', -40, 48], ['beehive', -70, 50], ['boat', 4, 46], ['pond', 22, 44], ['tub', 44, 34], ['loaf', 26, 56], ['tub', 52, 12], ['beehive', 58, -8], ['loaf', 50, -30], ['pond', 62, 52]];
  for (const [nm, dt, off] of beds) {
    const c = sideXZ(laneLen - RING_BACK + dt, off), cc = cellOf(c[0], c[1]);
    place(pat(nm, 0), cc[0] - 1, cc[1] - 1, 190 + ((Math.abs(dt) * 7) % 60), 1);
  }
  // a blinker row along the south forecourt, where the lens comes down off the Gun: posts that breathe in turn
  for (let i = 0; i < 7; i++) {
    const c = sideXZ(-70 + 17 * i, 64), cc = cellOf(c[0], c[1]);
    place(i % 2 ? [[0, 0], [1, 0], [2, 0]] : [[1, -1], [1, 0], [1, 1]], cc[0] - 1, cc[1], 200, 1, { pad: 1, moat: 2 });
  }
  // far pulsars: low apricot pads that breathe, well away from the path
  for (let n = 0, t = 0; n < Math.round(7 * V.density) && t < 80; t++) {
    const lx = rng.int(-90, 120), lz = rng.int(-95, 110);
    if (dPath(lx + 6, lz + 6) > 170 && place(pat('pulsar', 0), lx, lz, 1, 2, { pad: 1 })) n++;
  }
  // about 300 still-life gardens on a jittered grid; taller with distance from the path, a third of them young
  let gardens = 0;
  for (let Z = -100; Z <= 118; Z += 11) for (let X = -98; X <= 120; X += 11) {
    if (X === -98) await ctx.yield();
    if (!rng.chance(Math.min(0.97, 0.8 * V.density))) continue;
    const lx = X + rng.int(-2, 2), lz = Z + rng.int(-2, 2), d = dPath(lx + 3, lz + 3);
    const young = rng.chance(0.36), n = d < 60 ? rng.int(2, 3) : rng.pick([2, 2, 3, 3, 4, 5]), r0 = rng();
    let ok = false;
    for (let j = 0; j < n; j++) {
      const name = rng.chance(0.08) && d > 120 ? 'honeyfarm' : rng.pick(STILL);
      const r = Math.min(1, Math.max(0, r0 + rng.range(-0.3, 0.3)));
      const age = young ? rng.int(2, 70) : rng.int(118, 255);
      const cells = pat(name), cap = court(lx + 3, lz + 3) ? Math.min(2, capAt(d, r)) : capAt(d, r);
      let done = false; for (let t = 0; t < 6 && !done; t++) done = place(cells, lx + rng.int(-1, 9), lz + rng.int(-1, 9), age, cap);
      ok = done || ok;
    }
    if (ok) gardens++;
  }
  return { stamps, laneLen, seat, line, gardens, dPath, rows: [rowsP, rowsS], plazas };
}

// the lightweight spaceship heading east (nine cubes; two cells every four steps), for the rare fleet
const LWSS = [[0, 0], [3, 0], [4, 1], [0, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3]];
const SHIPS = 4, SHIP_PITCH = 10, SHIP_ROW = -35, SHIP_LEAD = -4;   // the fleet's row and its leading ship at u 0.43, in cells from the Gun's corner
const STEP_RATE = 2.8, PHI_START = 23;                              // the rule's steps a second; the phase of the Gun's 30-step cycle the land shows when first seen                               // the walk beside a glider in metres a second; the rule's steps a second

export default {
  id: 'glider-country',
  name: 'Glider Country',
  category: 'bizarre',
  media: ['air', 'open'],
  weirdness: 0.85,
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const vr = ctx.rng.fork ? ctx.rng.fork('glider-country-vary') : ctx.rng;
    const lr = ctx.rng.fork ? ctx.rng.fork('glider-country-land') : ctx.rng;

    // ---- the three choices a visit makes: hour, glaze set, soil --------------------------------------
    const roll = [vr(), vr(), vr()];
    let hourName = roll[0] < 0.46 ? 'high' : roll[0] < 0.76 ? 'low' : 'overcast';
    if (vary.hour === 'day') hourName = 'high'; else if (vary.hour === 'golden' || vary.hour === 'dawn' || vary.hour === 'night') hourName = 'low';
    const g1 = (roll[1] * 5) % 1, g2 = (roll[2] * 3) % 1;
    const glazeName = g1 < 0.3 ? 'celadon' : g1 < 0.7 ? 'sorbet' : 'blue';
    const soil = g2 < 0.4 || g2 >= 0.8 ? 'mixed' : g2 < 0.6 ? 'meadow' : 'city';
    const hour = HOURS[hourName], pal = GLAZES[glazeName];
    const rare = !!vary.rare;

    // ---- the land: the hero runs the rule over the whole 256 x 256 plain -------------------------------
    let plan = null;
    const fleetAt = () => ({ cx: SHIP_LEAD, z0: SHIP_ROW, x0: SHIP_LEAD - 3 * SHIP_PITCH - 62, x1: SHIP_LEAD + 70 });   // the fleet's own row, in cells
    let fleet = null; const birdLine = [], birdHomes = [];
    const heroOpts = (rng) => ({
      palette: pal, detail, gridSize: 256, gardens: 0, avenue: false, autoRun: false, avenueCells: 42, pileUp: 30, gunStoreys: 10, eaterStoreys: 6, preRoll: 210, meetStep: (30 - PHI_START) % 30, eatStep: 88 - PHI_START,
      sunAzimuth: hour.az, sunElevation: hour.el, shadow: hour.shadow, haze: hour.haze, tone: hour.tone, cloudShade: hour.cloud, occlusion: hour.ao,
      horizon: (c) => (hourName === 'overcast' ? c[0].clone().lerp(c[5], 0.4).multiplyScalar(0.8) : c[0].clone().lerp(c[5], 0.52).multiplyScalar(0.84)),
      birds: Math.round(110 * (0.8 + 0.2 * density)), maxColumns: 7000, groundSize: 12000,
      birdSize: 1.0, birdOk: (cx, cy, cz, r) => {       // no loop may pass within 10 m of the lens
        for (const q of birdLine) if (Math.abs(cy - q[1]) < 12.5 && Math.hypot(cx - q[0], cz - q[2]) < r + 10) return false;
        return true;
      },
      birdHomes,
      stamps: async (info) => {
        fleet = rare ? fleetAt() : null; plan = await layoutPlain(info, rng, { soil, density: density * (0.7 + 0.3 * detail), fleet }, ctx);
        info.plazas = plan.plazas;
        birdLine.length = 0;                             // the camera's line, a point every 7 m or so, for the birds to keep clear of
        const R = routePoints(plan.laneLen);
        for (let i = 1; i < R.length; i++) { const a = R[i - 1], b = R[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 7); for (let j = 0; j < n; j++) { const t = j / n; birdLine.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } }
        birdLine.push(R[R.length - 1]);
        // where the cube-birds live: the roofs of the avenue, the bastions, the plaza, the hedge
        birdHomes.length = 0;
        for (const [t, off, y] of [[80, -34, 62], [150, 34, 62], [215, -34, 62], [280, 40, 58], [plan.laneLen + 70, 26, 58], [plan.laneLen, 0, 44], [-20, -60, 70], [-120, 70, 70], [-160, -52, 28], [-230, 20, 34], [40, 60, 30], [120, 0, 30], [200, 0, 32]]) {
          const q = sideXZ(t, off); birdHomes.push([q[0], y, q[1]]);
        }
        return plan.stamps;
      },
      roofDensity: (lx, lz) => { const d = plan.dPath(lx, lz); return (d < 75 ? 1 : d < 150 ? 0.6 : d < 280 ? 0.3 : 0.1) * (detail < 0.8 ? 0.7 : 1); },
    });
    let hero = await buildHero(ctx, heroOpts(lr));
    if (!hero.anchors.steps.ok) {                     // a garden broke the machine (never seen; kept as a safety net): lay it out again
      hero.dispose(); hero.object.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      hero = await buildHero(ctx, heroOpts(lr.fork ? lr.fork('again') : lr));
    }
    scene.add(hero.object);
    const A = hero.anchors, C = hero.glazes, L = hero.life, lay = hero.layout;
    await ctx.yield();

    // ---- the path (see routePoints) ---------------------------------------------------------------------------
    const lane = A.lane, laneLen = lane.length;
    const RP = routePoints(laneLen);
    const path = makePath(RP);
    const seat = new THREE.Vector3(RP[RP.length - 1][0], RP[RP.length - 1][1], RP[RP.length - 1][2]);
    const PL = path.length;
    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), gazeGlider = new THREE.Vector3();
    // u of each station: its share of the chord length, refined to the nearest point of the curve (the route passes
    // the same ground twice, so a plain nearest-point search would pick the wrong leg)
    const cum = [0]; for (let i = 1; i < RP.length; i++) cum.push(cum[i - 1] + Math.hypot(RP[i][0] - RP[i - 1][0], RP[i][1] - RP[i - 1][1], RP[i][2] - RP[i - 1][2]));
    const uNear = (x, y, z, u0, w) => { let best = u0, bd = 1e9; for (let k = -40; k <= 40; k++) { const u = Math.min(1, Math.max(0, u0 + k * w / 40)), d = path.pointAt(u, tmp).distanceToSquared(tmp2.set(x, y, z)); if (d < bd) { bd = d; best = u; } } return best; };
    const uSt = RP.map((q, i) => uNear(q[0], q[1], q[2], cum[i] / cum[cum.length - 1], 0.03));
    const uOver = uSt[R_OVER], uWalk1 = uSt[R_WALK1];
    const uLip = uNear(A.eaterLip.x, 9, A.eaterLip.z, 0.97, 0.06);
    // THE TIMETABLE. The rule keeps one rate through the whole flight (STEP_RATE steps a second) and the flight is
    // timed against it: PHI lists, at stations of u, the step the land must show (counted so that the two ramps of
    // the Gun close on every multiple of 30). From it come the pace (slow where many steps pass in few metres: over the
    // Gun, on the avenue, on the walk beside a glider at a little over its own speed; quick up the street and round the
    // turn), the duration, and where every walker stands at every u: the fixed places a visitor sees are all caught
    // mid-pattern, a walker close ahead at 0.08, the ramps closing at 0.25, the pile-up subsiding at 0.61, one walker
    // paced from 0.70 to 0.79, the next two filing to the eater at 0.87 and 0.94.
    const PHI = [[0, 51.5], [0.08, 60], [0.16, 69.1], [0.25, 80], [0.34, 94], [0.43, 104.5], [0.52, 119], [0.61, 128.5], [0.7, 139.2], [0.79, 163.4], [0.87, 195.6], [0.94, 208], [1, 219.6]];
    const nP = PHI.length, hP = [], dP = [], mP = new Array(nP).fill(0);
    for (let i = 0; i < nP - 1; i++) { hP.push(PHI[i + 1][0] - PHI[i][0]); dP.push((PHI[i + 1][1] - PHI[i][1]) / hP[i]); }
    mP[0] = dP[0]; mP[nP - 1] = dP[nP - 2];
    for (let i = 1; i < nP - 1; i++) { const w1 = 2 * hP[i] + hP[i - 1], w2 = hP[i] + 2 * hP[i - 1]; mP[i] = (w1 + w2) / (w1 / dP[i - 1] + w2 / dP[i]); }   // monotone cubic (Fritsch and Carlson): no overshoot, slope continuous
    const phiAt = (u, deriv) => {
      const x = Math.min(1, Math.max(0, u)); let i = 0; while (i < nP - 2 && x > PHI[i + 1][0]) i++;
      const h = hP[i], t = (x - PHI[i][0]) / h, y0 = PHI[i][1], y1 = PHI[i + 1][1], m0 = mP[i] * h, m1 = mP[i + 1] * h;
      if (deriv) return ((6 * t * t - 6 * t) * y0 + (3 * t * t - 4 * t + 1) * m0 + (-6 * t * t + 6 * t) * y1 + (3 * t * t - 2 * t) * m1) / h;
      return (2 * t * t * t - 3 * t * t + 1) * y0 + (t * t * t - 2 * t * t + t) * m0 + (-2 * t * t * t + 3 * t * t) * y1 + (t * t * t - t * t) * m1;
    };
    const phiSpan = PHI[nP - 1][1] - PHI[0][1];
    const pace = (u) => phiSpan / Math.max(1, phiAt(u, true));                // speed compared with the average
    const DURATION = Math.round(phiSpan / STEP_RATE);
    const timeOfU = (u) => (phiAt(u) - PHI[0][1]) / STEP_RATE;
    const stepOfU = (u) => phiAt(u) - PHI_START;                                // the flight step the hero shows (its step 0 is phase PHI_START)
    const stepRate = STEP_RATE;
    const TABLE = PHI.map((q) => [q[0], +stepOfU(q[0]).toFixed(1), +timeOfU(q[0]).toFixed(1)]);

    // ---- gaze: the walker coming down the street at us, the Gun, the plaza, the avenue, the walker beside us ----
    const alongOf = (p) => tmp.copy(p).sub(lane.start).dot(lane.dir);
    const gazeUp = (time, u) => {                      // flying up the street: the nearest walker still ahead of the lens
      const camAlong = alongOf(path.pointAt(u, tmp2)), G = hero.gliders(), n = hero.gliderCount();
      let best = null, bd = 1e9;
      for (let i = 0; i < n; i++) { const rel = camAlong - alongOf(G[i]); if (rel > 14 && rel < 130 && rel < bd) { bd = rel; best = G[i]; } }
      if (best) return gazeGlider.copy(best).setY(2);
      return path.pointAt(Math.min(1, u + 70 / PL), gazeGlider).setY(4);
    };
    const gazeAt = (time, u) => {                      // walking down it: the walker beside us or the next one ahead
      const camAlong = alongOf(path.pointAt(u, tmp2)), G = hero.gliders(), n = hero.gliderCount();
      let best = null, bd = 1e9;
      for (let i = 0; i < n; i++) { const rel = alongOf(G[i]) - camAlong; if (rel > -16 && rel < 110 && rel < bd) { bd = rel; best = G[i]; } }
      if (best) return gazeGlider.copy(best).addScaledVector(lane.dir, 2).setY(2);
      return path.pointAt(Math.min(1, u + 70 / PL), gazeGlider).setY(4);
    };
    const laneView = lane.start.clone().addScaledVector(lane.dir, 190).addScaledVector(lane.starboard, -30).setY(-30);                       // down the gliders' line, from over the Gun
    const gazeLane = new THREE.Vector3(), uTilt0 = 0.52, uTilt1 = 0.6;
    const laneAt = (time, u) => { const k = Math.min(1, Math.max(0, (u - uTilt0) / (uTilt1 - uTilt0))); return gazeLane.copy(laneView).setY(-95 + 65 * k * k * (3 - 2 * k)); };   // first the whole pile-up with its foot, then up to the ring
    const plazaAt = new THREE.Vector3(sideXZ(PLAZA[0], PLAZA[1])[0], 0, sideXZ(PLAZA[0], PLAZA[1])[1]);
    const courtAt = new THREE.Vector3(sideXZ(COURT[0], COURT[1])[0], 0, sideXZ(COURT[0], COURT[1])[1]);
    const pois = [
      { at: gazeUp, from: 0.0, to: uSt[3] + 0.01, weight: 0.75, fade: 0.25 },                         // the file of walkers, then the one that passes close
      { at: A.meet.clone().setY(8), from: uSt[3] - 0.01, to: uOver - 0.012, weight: 0.8, fade: 0.2 }, // the Gun and its two ramps
      { at: courtAt, from: uOver - 0.005, to: uSt[9] + 0.02, weight: 0.85, fade: 0.3 },                  // the turnstile court from above
      { at: plazaAt, from: uSt[9] + 0.015, to: uSt[11] + 0.012, weight: 0.85, fade: 0.25 },                 // the plaza from above
      { at: laneAt, from: uSt[13], to: uSt[18] + 0.01, weight: 0.8, fade: 0.3 },                     // the pile-up to port, the avenue to the ring
      { at: gazeAt, from: uSt[18], to: uWalk1 + 0.05, weight: 0.9, fade: 0.12 },                       // the newborn below, then the walker beside us
      { at: A.eaterLip.clone().setY(12), from: uWalk1 + 0.03, to: uLip - 0.05, weight: 0.5, fade: 0.3 },
    ];

    // ---- sky: the flat toy dome and its square sun ---------------------------------------------------------
    const az = THREE.MathUtils.degToRad(hour.az), el = THREE.MathUtils.degToRad(hour.el);
    const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    const sunX = new THREE.Vector3(0, 1, 0).cross(sunDir).normalize(), sunY = sunDir.clone().cross(sunX).normalize();
    const over = hourName === 'overcast';
    const horizonC = over ? C[0].clone().lerp(C[5], 0.4).multiplyScalar(0.8) : C[0].clone().lerp(C[5], 0.52).multiplyScalar(0.84);
    const skyTop = over ? C[5].clone().lerp(C[6], 0.45).multiplyScalar(0.4) : C[5].clone().lerp(C[6], 0.3).multiplyScalar(hourName === 'low' ? 0.66 : 0.74);
    const skyMid = over ? C[3].clone().lerp(C[5], 0.5).multiplyScalar(0.56) : C[3].clone().lerp(C[5], 0.5).multiplyScalar(0.94);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3400, 32, 18), new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: {
        uTop: { value: skyTop }, uMid: { value: skyMid }, uLow: { value: horizonC },
        uSunCol: { value: C[2] }, uSunDir: { value: sunDir }, uSunX: { value: sunX }, uSunY: { value: sunY },
        uSunSize: { value: hour.sunSize }, uVeil: { value: hour.veil },
      },
    }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    scene.background = new THREE.Color().copy(horizonC);

    // ---- cube clouds and the far ring of towers --------------------------------------------------------------
    const boxGeo = bevelBoxGeometry(true);
    const common = () => ({
      uCream: { value: C[0] }, uCoral: { value: C[1] }, uApricot: { value: C[2] }, uMint: { value: C[3] }, uMoss: { value: C[4] }, uSky: { value: C[5] }, uIndigo: { value: C[6] },
      uHorizon: { value: horizonC }, uSun: { value: sunDir }, uHaze: { value: hour.haze }, uTone: { value: new THREE.Vector4(...hour.tone) },
    });
    const timeU = { value: 0 }, driftU = { value: new THREE.Vector2() };
    const boxMesh = (pos, tint, cloud) => {
      const g = new THREE.InstancedBufferGeometry();
      for (const k of ['position', 'inset', 'normal']) g.setAttribute(k, boxGeo.getAttribute(k));
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 4));
      g.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(tint), 4));
      g.instanceCount = pos.length / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        vertexShader: BOX_VERT, fragmentShader: BOX_FRAG, fog: false,
        uniforms: { ...common(), uTime: timeU, uDrift: driftU, uCloud: { value: cloud }, uVeil: { value: hour.veil } },
      }));
      m.frustumCulled = false; scene.add(m); return m;
    };
    const cr = ctx.rng.fork ? ctx.rng.fork('glider-country-sky') : ctx.rng;
    {
      const pos = [], tint = [], nClouds = Math.round((hourName === 'overcast' ? 20 : 14) * (0.85 + 0.15 * density));
      for (let c = 0; c < nClouds; c++) {
        // the first few are placed in the entry view and over the avenue; the rest ring the plain
        const a = c < 3 ? cr.range(-0.5, 0.45) : c < 6 ? cr.range(0.45, 1.25) : cr.range(0, Math.PI * 2);
        const r = c < 6 ? cr.range(320, 900) : cr.range(350, 1500);
        const cx = (c < 3 ? -250 : 60) + Math.cos(a) * r, cz = 80 + Math.sin(a) * r, cy = cr.range(150, 220);
        const rx = cr.range(2.5, 5.5), rz = cr.range(1.6, 3.2), ry = cr.range(1, 1.9), want = Math.round(cr.range(20, 70) * detail);
        let made = 0;
        for (let y = 0; y <= 2 && made < want; y++) for (let z = -4; z <= 4; z++) for (let x = -6; x <= 6; x++) {
          const q = (x / rx) ** 2 + (z / rz) ** 2 + (y / ry) ** 2 * 1.4 + cr.range(-0.12, 0.12);
          if (q > 1.15 || made >= want) continue;
          pos.push(cx + x * 12, cy + y * 12, cz + z * 12, 12);
          tint.push(12, cr(), q < 0.5 ? 0 : Math.min(0.85, (q - 0.45) * 1.25), 0); made++;
        }
      }
      boxMesh(pos, tint, 1);
    }
    {
      const pos = [], tint = [], n = Math.round(240 * (0.6 + 0.4 * detail));
      for (let i = 0; i < n; i++) {
        const a = cr.range(0, Math.PI * 2), r = 900 + 1500 * Math.pow(cr(), 1.6);
        const tall = soil === 'meadow' ? 0.6 : soil === 'city' ? 1.3 : 1;
        const land = i % 9 === 4, w = land ? 30 : cr.pick([12, 12, 18, 24]), h = 6 * Math.round((5 + cr.range(0, 12) + (r - 900) / 110) * tall * (land ? 1.9 : 1));   // one in nine is a landmark: broad, nearly twice as tall
        const x = Math.round(Math.cos(a) * r / 6) * 6, z = Math.round(Math.sin(a) * r / 6) * 6;
        pos.push(x, -0.5, z, w); tint.push(h, cr(), land ? 0.9 : cr() * 0.45, 1);
      }
      boxMesh(pos, tint, 0);
    }
    await ctx.yield();

    // ---- the ring the portal sits in: the one round thing in the land ---------------------------------------
    const endDir = path.endTangent.clone().setY(0).normalize();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7.95, 0.85, 14, 56), new THREE.ShaderMaterial({
      uniforms: { ...common(), uTime: timeU },
      vertexShader: /* glsl */`varying vec3 vN, vWorld; varying vec2 vUv2;
        void main() { vN = normalize(mat3(modelMatrix) * normal); vUv2 = uv; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`uniform float uTime; varying vec3 vN, vWorld; varying vec2 vUv2;
        ${GLSL_COMMON}
        void main() {
          vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
          float seg = fract(vUv2.x * 28.), tile = smoothstep(0.03, 0.07, seg) * (1. - smoothstep(0.93, 0.97, seg));
          float k = floor(vUv2.x * 28.);
          vec3 col = mix(uCream, uApricot, 0.5 * step(0.5, mod(k, 2.))) * (0.92 + 0.08 * hash21(vec2(k, 3.)));
          col = mix(col * 0.78, col, tile);
          float lit = smoothstep(-0.5, 0.7, dot(n, uSun));
          col = mix(mix(col, uIndigo, 0.28) * 0.56, col, lit);
          // a slow pulse of warm light walking round the ring, one tile at a time
          float walk = 1. - smoothstep(0., 2.5, abs(mod(k - floor(uTime * 2.5), 14.) - 1.5));
          col += uApricot * 1.5 * walk * tile;
          gl_FragColor = vec4(col, 1.);
        }`,
    }));
    ring.position.copy(seat); ring.lookAt(seat.clone().sub(endDir)); scene.add(ring);

    // ---- keeping the rule in step with the flight ----------------------------------------------------------
    // The land runs on world time at 2.5 steps a second (so it is alive through the previous portal and while
    // the camera is held), and a slow phase lock slides it, never backward, until the step shown matches the
    // table for u modulo the Gun's period of 30: the shuttles meet under the lens at u 0.33 and the eater
    // bites at u 0.88 however long the world waited behind its portal.
    // The land starts at phase PHI_START when it is first drawn (through the previous portal) and runs at the rule's
    // own rate up to the phase the timetable gives for u 0, where it rests on a whole step (birds, clouds, trees and
    // the hedge go on moving): so at the crossing it is already in step and nothing has to catch up. If the crossing
    // comes sooner, the difference is slid away at no more than 1.4 steps a second. Only a jump in u (a still taken
    // by the test harness) lands on the timetable at once.
    let Sw = 0, t0 = -1, lastU = 0, lastTime = -1, crossed = false;
    const hold0 = PHI[0][1] - PHI_START;
    const drive = (dt, time, u) => {
      if (t0 < 0) { t0 = time; lastTime = time; }
      const step = Math.max(0, Math.min(0.25, time - lastTime)) * STEP_RATE;     // a held or jumped clock adds at most a quarter of a second
      const jumpU = Math.abs(u - lastU) > 0.02;
      if (u <= 0.002 && !crossed && !jumpU) Sw = Math.min(hold0, Sw + step);
      else {
        crossed = true;
        const want = stepOfU(u);
        if (jumpU) Sw = want + 30 * Math.max(0, Math.ceil((Sw - want) / 30 - 1e-6));
        else { const near = want + 30 * Math.round((Sw - want) / 30); Sw += step + Math.max(-1.4, Math.min(1.4, (near - Sw) * 1.2)) * Math.min(dt, 0.25); }
      }
      if (jumpU) hero.jumpStep(Sw); else hero.setStep(Sw);
      lastU = u; lastTime = time;
      return jumpU;
    };

    // ---- the rare event: four real lightweight spaceships troop east past the plaza -------------------------
    // They are laid on the board before the flight, far out to the west on a row of their own north of the plaza, and
    // the rule alone carries them (two cells every four steps, 3 m a step): at u 0.43 the file is passing behind the
    // plaza, each ship on a long warm wake. Their row never meets the walkers' street, so nothing is ever taken off
    // the board.
    if (fleet) {
      lay.shipBand = [fleet.z0, fleet.z0 + 4, fleet.x0, fleet.x1];
      const n = Math.round(phiAt(0.43) - PHI_START), G = L.G, Z0 = lay.gz + fleet.z0;
      for (let z = fleet.z0 - 1; z <= fleet.z0 + 4; z++) for (let x = fleet.x0; x <= fleet.x1; x++) { const X = lay.gx + x, Z = lay.gz + z; if (X >= 0 && X < G && Z >= 0 && Z < G) L.cool[Z * G + X] = 9; }
      for (let j = 0; j < SHIPS; j++) { const x = fleet.cx - j * SHIP_PITCH - Math.floor(n / 2); if (lay.gx + x > 6 && x >= fleet.x0 + 1) L.stamp(LWSS, lay.gx + x, Z0, 1, 1); }
    }

    return {
      scene, path, duration: DURATION, pace, title: 'Glider Country',
      camera: { fov: 56, near: 0.3, far: 4000, lookAhead: 26, sway: 0.4, bank: 0.1 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FFF4DC', glow: 1.5, revealDistance: 380 },
      post: {
        exposure: 1, bloom: { strength: 0.12, radius: 0.5, threshold: 0.96 },
        grade: { saturation: 1.1, contrast: 1.04, tint: '#ffffff', shadowTint: '#000000', vignette: 0.1, grain: 0, aberration: 0 },
      },
      ride: 'none', style: 'none', companion: 'none',
      info: { life: L, lay, plan, stepOfU, timeOfU, roll, hour: hourName, glaze: glazeName, soil, rare, gardens: plan.gardens, rows: plan.rows, ok: hero.anchors.steps.ok, table: TABLE, stepRate, uSt, uLip, laneLen, length: PL, duration: DURATION },
      update(dt, time, camera, u) {
        drive(dt, time, u);
        hero.update(dt, time);
        timeU.value = time; driftU.value.set(time * 8, time * 3);
        camera.getWorldPosition(sky.position);
      },
      dispose() { hero.dispose(); boxGeo.dispose(); },
    };
  },
};
