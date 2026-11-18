// doors-in-transit: THE FIVE SHAFTS OF SUN (the works builder's part). Four slanting beams through the sunny end's
// great fan screen and one down the tower from the lantern, each a clear beam of warm light with slow dust drifting
// in it, from its glass down to a bright patch where it lands.
// WHICH PANES, by rule. The fan is the joiner's (doors-in-transit-shed-sun.js): half-round, springing at the walls'
// top on the hall's axis, with a radial bar every 30 degrees and a ring every 12 m from 14 m out. The four beams
// come through the four panes, one in each ring, of ONE sector: the sector beside the crown on the side the sun's
// light falls toward. So the four run side by side in one slanting sheet, land in a row on the open floor of that
// side, and none goes through the bay or over the last leg to the way out (the sun stands a little to the other
// side of the hall's axis at every hour, and its light falls away from the axis). A beam ends where it meets the
// floor, or the side wall or the far end if it meets that first; only a beam that lands on the floor has a patch.
// The kit's rays (fx.makeGodRays) deal each ray's width, length and brightness by chance: here each ray's place,
// length and brightness are set by this plan instead, into the kit's own lists.
// THE SLOW DUST IN THEM: the kit's motes (fx.makeParticles), which the kit deals into a box; here every mote is
// dealt a place inside one of the five beams (within half the beam's width of its axis, evenly along its length)
// and only wavers slowly about that place: so the dust shows where the light is (at the slanted beams' feet a few
// motes in a hundred are dealt under the floor, where nothing shows them).
import { SHED, TOWER } from './doors-in-transit-plan.js';

export const FAN = { y: SHED.spring, first: 14, ring: 12, rings: 4, sector: 30 };      // the joiner's fan screen, in the plane of the sunny end
const HALF = [5, 6.5];                                                                 // a beam's half width at its pane and at its far end

// sunIn: the unit way the light travels. Returns the four beams: { from, length, lands: [x, z] or null }.
export function shaftPlan(sunIn) {
  const end = sunIn[2] > 0 ? SHED.z0 : SHED.z1, side = sunIn[0] < 0 ? 1 : -1, a = (90 + side * FAN.sector / 2) * Math.PI / 180, out = [];
  for (let k = 0; k < FAN.rings; k++) {
    const r = FAN.first + FAN.ring * (k + 0.5), from = [r * Math.cos(a), FAN.y + r * Math.sin(a), end + Math.sign(sunIn[2]) * 1.5];
    const toFloor = from[1] / -sunIn[1], toWall = sunIn[0] ? ((sunIn[0] < 0 ? SHED.x0 + 1 : SHED.x1 - 1) - from[0]) / sunIn[0] : Infinity;
    const toEnd = ((sunIn[2] > 0 ? SHED.z1 - 1 : SHED.z0 + 1) - from[2]) / sunIn[2], length = Math.min(toFloor, toWall, toEnd);
    out.push({ from, length, lands: length === toFloor ? [from[0] + sunIn[0] * length, from[2] + sunIn[2] * length] : null });
  }
  return out;
}

// o: THREE, fx (the kit), rng, rngLantern and rngMotes (the world's own streams), time (the clock's uniform), sunIn,
// color, gain, motes (how many motes of dust)
export function makeShafts(o) {
  const { THREE, fx, sunIn, color, gain } = o, object = new THREE.Group(), plan = shaftPlan(sunIn);
  const longest = Math.max(...plan.map((b) => b.length)), mid = plan.reduce((m, b) => m.map((v, i) => v + b.from[i] / plan.length), [0, 0, 0]);
  const reach = Math.max(...plan.map((b) => Math.hypot(b.from[0] - mid[0], b.from[1] - mid[1], b.from[2] - mid[2])));
  const set = (rays, origins, params) => { const g = rays.object.geometry;
    g.attributes.aOrigin.array.set(origins); g.attributes.aOrigin.needsUpdate = true; g.attributes.aParam.array.set(params); g.attributes.aParam.needsUpdate = true; };
  // the four through the fan: [width's share, length's share, phase, brightness] to each
  const beams = fx.makeGodRays({ rng: o.rng, time: o.time, position: mid, direction: sunIn, radius: reach + 1, count: plan.length, length: longest,
    width: HALF, color, intensity: gain, falloff: 0.2, speed: 0.3 });
  set(beams, plan.flatMap((b) => [b.from[0] - mid[0], b.from[1] - mid[1], b.from[2] - mid[2]]), plan.flatMap((b, k) => [1, b.length / longest, o.rng(), 1 - 0.07 * k]));
  // the one down the tower: plumb from the lantern's glass to the floor at the tower's foot
  const top = SHED.crown - 2, lantern = fx.makeGodRays({ rng: o.rngLantern, time: o.time, position: [TOWER.x, top, TOWER.z], direction: [0, -1, 0], radius: 1, count: 1, length: top,
    width: [5, 7], color, intensity: gain * 1.6, falloff: 0.2, speed: 0.22 });      // (no near of ours: the kit's own near fade, as for the four)
  set(lantern, [0, 0, 0], [1, 1, o.rngLantern(), 1]);
  object.add(beams.object, lantern.object);
  // the slow dust: [from, way, length, half width at the glass, half width at the far end] of each beam
  const cols = [...plan.map((b) => [b.from, sunIn, b.length, HALF[0], HALF[1]]), [[TOWER.x, top, TOWER.z], [0, -1, 0], top, 5, 7]];
  const all = cols.reduce((sum, c) => sum + c[2], 0), n = Math.max(1, Math.round(o.motes ?? 1500)), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const c of cols) for (const t of [0, c[2]]) for (let i = 0; i < 3; i++) { const v = c[0][i] + c[1][i] * t; lo[i] = Math.min(lo[i], v - 6); hi[i] = Math.max(hi[i], v + 6); }
  const centre = lo.map((v, i) => (v + hi[i]) / 2), box = lo.map((v, i) => (hi[i] - v) * 1.7);      // (the kit fades motes near its box's faces: the box is that much wider than the beams)
  const dust = fx.makeParticles({ rng: o.rngMotes, preset: 'dust', time: o.time, follow: false, box, center: centre, count: n, velocity: [0, 0, 0], velocityRandom: [0, 0, 0],
    turbulence: [0.9, 0.6, 0.12], size: [0.14, 0.34], colors: ['#fff3d8', '#ffe9c0', '#ffffff'], intensity: 2 * gain, minAngle: 0.007, twinkle: 0.35 });
  const seed = dust.object.geometry.attributes.aSeed.array, R = o.rngMotes;
  for (let i = 0; i < n; i++) {
    let pick = R() * all, c = cols[0]; for (const q of cols) { c = q; if (pick < q[2]) break; pick -= q[2]; }
    const d = c[1], ex = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = [d[1] * ex[2] - d[2] * ex[1], d[2] * ex[0] - d[0] * ex[2], d[0] * ex[1] - d[1] * ex[0]];
    const l1 = Math.hypot(...e1), e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]], l2 = Math.hypot(...e2);
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.5 * (c[3] + (c[4] - c[3]) * pick / c[2]), ca = Math.cos(a) * r / l1, sa = Math.sin(a) * r / l2;
    for (let k = 0; k < 3; k++) seed[i * 4 + k] = (c[0][k] + d[k] * pick + e1[k] * ca + e2[k] * sa) / box[k];      // (the kit places a mote at its seed times the box)
  }
  dust.object.geometry.attributes.aSeed.needsUpdate = true; object.add(dust.object);
  // the bright patches: where each beam lands, a soft warm oval on the floor (its length the beam's width drawn out by the low sun)
  const P = [], C = [], I = [], col = new THREE.Color(color), SEG = 32, RINGS = [[0.55, 1], [0.8, 0.6], [0.93, 0.15], [1, 0]];
  const lx = Math.hypot(sunIn[0], sunIn[2]) || 1, ux = sunIn[0] / lx, uz = sunIn[2] / lx;
  const oval = (x, z, across, along, k) => {
    const base = P.length / 3; P.push(x, 0.06, z); C.push(col.r * k, col.g * k, col.b * k);
    RINGS.forEach(([r, f], j) => { for (let i = 0; i < SEG; i++) { const t = Math.PI * 2 * i / SEG, a = Math.cos(t) * along * r, b = Math.sin(t) * across * r;
      P.push(x + ux * a - uz * b, 0.06, z + uz * a + ux * b); C.push(col.r * k * f, col.g * k * f, col.b * k * f);
      const i1 = (i + 1) % SEG, q = base + 1 + j * SEG;
      if (j === 0) I.push(base, q + i1, q + i); else I.push(q - SEG + i, q - SEG + i1, q + i1, q - SEG + i, q + i1, q + i); } });
  };
  for (const b of plan) if (b.lands) oval(b.lands[0], b.lands[1], HALF[1], HALF[1] / -sunIn[1], 0.45 * gain);
  oval(TOWER.x, TOWER.z, 7, 7, 0.6 * gain);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const patches = new THREE.Mesh(g, m); patches.renderOrder = 2; object.add(patches);
  return { object, plan, update(dt, time) { beams.update(dt, time); lantern.update(dt, time); dust.update(dt, time); }, dispose() { g.dispose(); m.dispose(); } };
}
