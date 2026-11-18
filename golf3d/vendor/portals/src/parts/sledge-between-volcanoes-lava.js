// THE SLEDGE BETWEEN THE VOLCANOES: the lava front on the fire side of the pass. It is weather beside the route, never
// under the camera: three crusted tongues come down the black wall and stop on the ice 110 m and more from the ramp.
//   makeLavaFront()  the tongues (one mesh, own shader: dark crust, cracks that glow and creep, hot snouts, blocks),
//                    the steam towers where lava meets ice (sprites of the ice part's makePuffs), and the bursts:
//                    every few seconds one snout throws glowing fragments on arcs that land 30 to 90 m out, away from
//                    the route, each landing with a puff. The bursts are a seeded schedule on the world clock; every
//                    fragment's place is a pure function of that clock.
import * as THREE from 'three';
import { lerp, smoothstep } from '../kit/core.js';
import { sharedUniforms, SBV_NOISE, SBV_LIGHT } from './sledge-between-volcanoes-common.js';
import { makePuffs } from './sledge-between-volcanoes-ice.js';

const LAVA_VS = /* glsl */`
attribute vec2 aUv; attribute float aHot;
varying vec3 vW, vN; varying vec2 vUv; varying float vHot;
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vUv = aUv; vHot = aHot; gl_Position = projectionMatrix*viewMatrix*w; }`;
const LAVA_FS = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec2 vUv; varying float vHot;
uniform vec3 uCrust, uLavaA, uLavaB; uniform float uTime, uLavaLevel;
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  vec3 n = normalize(vN); float hot = clamp(vHot, 0., 1.);
  // plates of crust carried down the flow: the cracks between them open where it is hot
  vec2 p = vec2(vUv.x - uTime*(.25 + .5*hot), vUv.y*14.);
  float a = sN2(p*.42), b = sN2(p*.95 + 7.3), c2 = sN2(p*2.3 + 3.1);
  float ridge = 1. - abs(2.*(a*.6 + b*.3 + c2*.1) - 1.);
  float open = clamp(.05 + .15*hot, 0., 1.);
  float crack = smoothstep(1. - open, 1. - open*.3, ridge);
  float breathe = .75 + .25*sin(uTime*1.3 + a*9.) ;
  vec3 col = uCrust*(.6 + .8*b)*sbvSky(n)*(1. - crack);
  float glow = crack*(.45 + 1.5*hot) + hot*hot*hot*.6*(.5 + .5*c2);
  col += mix(uLavaA, uLavaB, clamp(glow*.4 - .15, 0., 1.))*glow*breathe*uLavaLevel;
  gl_FragColor = vec4(sbvFog(col, length(cameraPosition - vW), 1.), 1.);
}`;

// one tongue: a ribbon draped on the ground from src to snout [x, z], rounded across, thick and steep at the snout
function addTongue(G, ground, noise, rng, src, snout, w0, w1, H) {
  const NA = 34, NC = 10, base = G.pos.length / 3, dx = snout[0] - src[0], dz = snout[1] - src[1], len = Math.hypot(dx, dz), tx = dx / len, tz = dz / len, px = -tz, pz = tx;
  const ph = rng.range(0, 6.28), key = rng.range(0, 50);
  for (let i = 0; i <= NA; i++) {
    const t = i / NA, me = Math.sin(t * 5.2 + ph) * 16 * t * (1 - t) * 2.2, cx = src[0] + dx * t + px * me, cz = src[1] + dz * t + pz * me;
    const end = t > 0.88 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.88) / 0.12, 2))) : 1;
    const w = lerp(w0, w1, t * t) * (1 + 0.22 * noise.n2(t * 4.3 + key, key)) * (0.25 + 0.75 * end), h = H * (0.4 + 0.6 * smoothstep(0.3, 0.9, t)) * (0.35 + 0.65 * end);
    for (let j = 0; j <= NC; j++) {
      const c = (j / NC) * 2 - 1, x = cx + px * c * w * 0.5, z = cz + pz * c * w * 0.5, lump = 0.75 + 0.5 * noise.n2(x / 9 + key, z / 9);
      const y = ground(x, z) - 1.2 + (h * lump + 1.2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(c), 3.2)), 0.6);
      G.pos.push(x, y, z); G.uv.push(t * len * 0.16, c); G.hot.push(0.12 + 0.88 * smoothstep(0.5, 1, t) * (1 - 0.45 * Math.abs(c)) * (0.7 + 0.3 * lump));
    }
  }
  for (let i = 0; i < NA; i++) for (let j = 0; j < NC; j++) { const a = base + i * (NC + 1) + j, b = a + 1, c = a + NC + 1, d = c + 1; G.idx.push(a, b, c, b, d, c); }
}
// a broken block of crust: a skewed box
function addBlock(G, x, y, z, s, rng, hot, ground) {
  // an irregular lump: two rings of five corners and a top and a bottom, every corner pushed in or out on its own
  // (never a box); it sits a third sunk in the ice, on a ragged apron of its own ash that follows the ground
  const base = G.pos.length / 3, tw = rng.range(0, 6.28), u0 = rng.range(0, 30);
  G.pos.push(x + s * rng.range(-0.2, 0.2), y + s * rng.range(0.85, 1.2), z + s * rng.range(-0.2, 0.2)); G.uv.push(u0, 0); G.hot.push(hot * rng.range(0.6, 1));
  for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 5; k++) { const a = tw + (k + ring * 0.5) * 1.2566, rr = s * rng.range(0.6, 1.25) * (ring ? 1 : 0.8), yy = y + s * (ring ? rng.range(-0.3, 0.1) : rng.range(0.35, 0.75));
    G.pos.push(x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr); G.uv.push(u0 + rng.range(0, 3), rng.range(-1, 1)); G.hot.push(hot * rng.range(0.6, 1)); }
  G.pos.push(x, y - s * 0.45, z); G.uv.push(u0, 0); G.hot.push(0);
  for (let k = 0; k < 5; k++) { const k1 = (k + 1) % 5, a = base + 1 + k, b = base + 1 + k1, c = base + 6 + k, d = base + 6 + k1;
    G.idx.push(base, b, a, a, b, c, b, d, c, c, d, base + 11); }
  if (ground) { const ab = G.pos.length / 3, n = 9; G.pos.push(x, ground(x, z) + 0.12, z); G.uv.push(u0, -1); G.hot.push(0);
    for (let k = 0; k < n; k++) { const a = tw + k / n * 6.2832, rr = s * rng.range(1.5, 2.9), px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; G.pos.push(px, ground(px, pz) + 0.06, pz); G.uv.push(u0 + k, -1); G.hot.push(0); }
    for (let k = 0; k < n; k++) G.idx.push(ab, ab + 1 + (k + 1) % n, ab + 1 + k); }
}

// opts: rng (the tongues), burstsRng, rollersRng, steamRng (each kind from its own stream), noise, ground (x, z) => y,
//       wind [x, z], gap (x, y0, y1, z) => metres from the route: a fragment whose arc would come within 40 m of it is
//       thrown the other way across the front; a block that would roll that near stays where it broke off
// where the tongues' snouts lie on the ice (in a surge two of them have run far out); the world tests its road against these
export const snoutsOf = (surge) => (surge ? [[150, -290], [90, -402], [126, -514], [178, -600]] : [[152, -292], [120, -396], [166, -506], [178, -600]]);
// where each tongue comes off the fire side's wall (x, z), in order with the snouts: one text for the lava and for the world
export const TONGUE_SOURCES = [[430, -330], [440, -430], [430, -560], [430, -655]];
export async function makeLavaFront(ctx, S, o) {
  const rng = o.rng, noise = o.noise || ctx.noise, ground = o.ground, object = new THREE.Group(); object.name = 'lava-front';
  // every stream is in hand before anything is dealt
  const burstsRng = o.burstsRng || rng.fork('bursts'), rollersRng = o.rollersRng || rng.fork('rollers'), steamRng = o.steamRng || rng.fork('steam');
  // the crust creeps and its cracks breathe on a clock of their own that starts where the seed puts it
  const lavaClock = { value: 0 }, lavaPhase = rng.range(0, 600);
  // in a surge two of the tongues have run far out on the ice (still 80 m and more from the route)
  // (the fourth tongue, new in fix round 2, comes down beside the icefall: it keeps the fire in sight on the climb)
  const SNOUTS = o.snouts || snoutsOf(o.surge), SRC = o.sources || TONGUE_SOURCES;
  const steamK = o.steam ?? 1;
  const G = { pos: [], uv: [], hot: [], idx: [] };
  for (let i = 0; i < SNOUTS.length; i++) {
    addTongue(G, ground, noise, rng, SRC[i], SNOUTS[i], 22, (i === 1 ? 46 : 36) + (o.surge && i > 0 ? 12 : 0), i === 1 ? 13 : 10);
    for (let k = 0; k < 9; k++) { const a = rng.range(0, 6.28), d = rng.range(8, 30), x = SNOUTS[i][0] - Math.abs(Math.cos(a)) * d * 0.6 + rng.range(-6, 6), z = SNOUTS[i][1] + Math.sin(a) * d; addBlock(G, x, ground(x, z), z, rng.range(0.8, 2.6), rng, rng.range(0.25, 0.9), ground); }
    await ctx.yield();
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); geo.setAttribute('aUv', new THREE.Float32BufferAttribute(G.uv, 2));
  geo.setAttribute('aHot', new THREE.Float32BufferAttribute(G.hot, 1)); geo.setIndex(G.idx); geo.computeVertexNormals();
  const uniforms = { ...sharedUniforms(S), uCrust: { value: new THREE.Color('#1a1618') }, uLavaA: { value: new THREE.Color('#FF3A0C').multiplyScalar(1.0) }, uLavaB: { value: new THREE.Color('#FF9A40').multiplyScalar(1.5) }, uLavaLevel: { value: 1 } };
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: LAVA_VS, fragmentShader: LAVA_FS, side: THREE.DoubleSide })); mesh.name = 'lava-tongues'; object.add(mesh);
  // steam where the lava meets the ice: a tower at each snout, leaning with the wind, lit from inside at its foot
  const W = o.wind || [-1, 0], em = [];
  // three towers, 100, 140 and 60 m tall: each a column of many small puffs that climb for twelve seconds and lean down
  // the wind more the higher they are; each card's edge is eaten well inward (the ice part's shader), so the body of a
  // puff is no wider than about a sixth of its tower's height and neighbours run together
  const TOWER = [100, 140, 60, 85], LIFE = 12, DRAG = 0.05, RISE = (1 - Math.exp(-DRAG * LIFE)) / DRAG;
  for (let i = 0; i < SNOUTS.length; i++) { const [x, z] = SNOUTS[i], y = ground(x, z) + 2, H = TOWER[i % 4];
    em.push({ p: [x - 4, y, z], v: [0, H / RISE, 0], spread: 3 + H / 22, vr: 1 + H / 110, n: Math.round((80 + H * 0.7) * steamK), life: LIFE, size: [H / 7.4, H / 5.7], tone: 2, alpha: 0.9, drag: DRAG, flat: 0.3 });
    em.push({ p: [x - 2, y - 1, z + rng.range(-10, 10)], v: [W[0] * 2, 3, W[1] * 2], spread: 9, vr: 1.6, n: 10, life: 5, size: [3, 9], tone: 2, alpha: 0.4, drag: 0.3, flat: 0.2 }); }
  uniforms.uTime = lavaClock;
  const bursts = makeBursts(S, { rng: burstsRng, rollers: rollersRng, ground, snouts: SNOUTS, gap: o.gap });
  const steam = makePuffs(S, { rng: steamRng, emitters: em, wind: [W[0] * 11, 0, W[1] * 11], name: 'lava-steam', hot: 1.6, renderOrder: 5 });
  object.add(steam.object, bursts.object);
  return { object, uniforms, steam, bursts, snouts: SNOUTS, triangles: G.idx.length / 3 + steam.triangles + bursts.triangles,
    update(time, level = 1) { uniforms.uLavaLevel.value = 0.35 + 0.65 * level; lavaClock.value = time + lavaPhase; bursts.update(time); } };
}

// ---------------------------------------------------------------- bursts
// Steam bursts at the snouts: a seeded list of burst times that repeats every `period` seconds of the world clock.
// One instanced draw holds every burst's fragments (kind 0: a hot point on a ballistic arc), their landing puffs
// (kind 1) and the cloud of the burst itself (kind 2). Where each is depends on the clock alone.
const BURST_VS = /* glsl */`
attribute vec3 aP0, aV; attribute vec4 aT; attribute vec2 aS;      // aT: burst time, landing time (or life), kind, seed
uniform float uTime, uPeriod; uniform vec3 uBurstWind;
varying vec2 vUv; varying vec4 vI; varying vec3 vW, vR, vU;
void main(){
  float age = mod(uTime - aT.x, uPeriod), tl = max(aT.y, .05), kind = aT.z, k, vis, size; vec3 p;
  if (kind < .5) { float a = min(age, tl); p = aP0 + aV*a + vec3(0., -4.9*a*a, 0.); k = age/tl; vis = 1.; size = aS.x*(1. - .3*min(k, 1.)); }      // a thrown rock: it lies where it lands until it is thrown again
  else if (kind > 3.5) { float a = clamp(age - .45, 0., tl); p = aP0 + aV*a + vec3(0., -4.9*a*a + .6, 0.) + uBurstWind*.4; k = clamp(age/tl, 0., 1.); vis = step(.45, age)*step(age, tl + .6); size = aS.x*(1.6 + 2.2*k); }      // its smoke, a little behind it on the same arc
  else if (kind < 1.5) { float a = age - tl; p = aP0 + aV*tl + vec3(0., -4.9*tl*tl + .8 + 1.5*max(a, 0.), 0.) + uBurstWind*max(a, 0.); k = clamp(a/4., 0., 1.); vis = step(0., a)*step(a, 4.); size = mix(aS.x, aS.y, sqrt(k)); }
  else if (kind > 2.5) { float a = min(age, tl); p = aP0 + aV*a + vec3(0., .25*abs(sin(a*4.5 + aT.w*20.))*(1. - a/tl), 0.); k = clamp(age/(tl + 3.), 0., 1.); vis = step(age, tl + 3.); size = aS.x; }      // a rolling block: it bounces a little, stops, and cools
  else { float a = age; p = aP0 + aV*(1. - exp(-a*.7))/.7 + uBurstWind*a*.6; k = clamp(a/tl, 0., 1.); vis = step(a, tl); size = mix(aS.x, aS.y, sqrt(k)); }
  vec4 w = modelMatrix*vec4(p, 1.);
  // the card faces the eye's place (not the lens): its axes come from the line to where the eye stands
  vec3 toEye = normalize(cameraPosition - w.xyz); vR = normalize(cross(vec3(0., 1., 0.), toEye) + vec3(1e-4, 0., 0.)); vU = cross(toEye, vR);
  vec2 c = position.xy*2.; vUv = c; w.xyz += (vR*c.x + vU*c.y)*size*.5; vW = w.xyz;
  vI = vec4(kind, k, aT.w, vis);
  gl_Position = vis > .5 ? projectionMatrix*viewMatrix*w : vec4(2., 2., 2., 1.);
}`;
const BURST_FS = /* glsl */`
precision highp float;
varying vec2 vUv; varying vec4 vI; varying vec3 vW, vR, vU;
uniform vec3 uHotA, uHotB;
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
  float dist = length(cameraPosition - vW), k = vI.y;
  if (vI.x < .5 || (vI.x > 2.5 && vI.x < 3.5)) {
    // a thrown rock or a rolling block: an irregular dark lump that tumbles as it goes, dull red on the side that was
    // in the lava, white-orange only as it leaves; at rest it cools to black
    float fly = min(k, 1.), spin = vI.z*6.2832 + fly*(9. + 7.*vI.z), ang = atan(vUv.y, vUv.x) + spin;
    float rim = .64 + .17*sin(ang*3. + vI.z*9.) + .1*sin(ang*5. + vI.z*31.) + .05*sin(ang*9. + vI.z*17.);
    if (r2 > rim*rim) discard;
    float cool = exp(-max(k - 1., 0.)*1.4);
    float sideK = smoothstep(-.25, .55, dot(vUv, vec2(cos(spin), sin(spin)))/max(rim, .2));
    vec3 rock = vec3(.035, .032, .036)*(sbvSky(vec3(0., 1., 0.)) + sbvFire(vW, vec3(0., 1., 0.)));
    vec3 c = rock + uHotA*sideK*(.55 - .3*fly)*cool*(.6 + .4*sF2(vUv*3. + vI.z*40.)) + uHotB*exp(-fly*9.)*exp(-r2*4.)*.8;
    gl_FragColor = vec4(sbvFog(c, dist, 1.), 1.);
    return;
  }
  if (vI.x > 3.5) {                                                   // the smoke behind a thrown rock
    float nz = sF2(vUv*1.8 + vI.z*23.);
    float a = clamp(exp(-r2*3.2) - .04, 0., 1.)*smoothstep(.2, .75, nz + .5*(1. - r2))*(1. - smoothstep(.55, 1., k))*.4;
    vec3 c = vec3(.1, .095, .1)*(sbvSky(vec3(0., 1., 0.)) + sbvFire(vW, vec3(0., 1., 0.))) + uHotA*.06*exp(-k*5.);
    c = sbvFog(c, dist, 1.);
    gl_FragColor = vec4(c*a, a);
    return;
  }
  float nz = sF2(vUv*1.6 + vI.z*23.);
  float a = clamp(exp(-r2*3.) - .04, 0., 1.)*smoothstep(.15, .75, nz + .55*(1. - r2))*smoothstep(0., .1, k)*(1. - smoothstep(.4, 1., k))*(vI.x > 1.5 ? .6 : .45);
  vec3 f = normalize(cross(vR, vU)); vec3 n = normalize(vR*vUv.x + vU*vUv.y + f*sqrt(max(1. - r2, .05)));
  vec3 c = vec3(.6, .6, .62)*(sbvSky(n) + sbvFire(vW, n) + sbvFire(vW, -n)*.4) + uHotA*(vI.x > 1.5 ? .5 : .25)*exp(-k*6.);
  c = sbvFog(c, dist, 1.);
  gl_FragColor = vec4(c*a, a);
}`;
function makeBursts(S, o) {
  const rng = o.rng, P0 = [], V = [], Tt = [], Sz = [], times = [];
  let t = rng.range(2, 5); const PERIOD = 64;
  while (t < PERIOD - 3) { times.push(t); t += rng.range(5, 8); }
  let turned = 0;
  const arcClear = (x0, y0, z0, vx, vy, vz, tl) => { for (let k = 0; k <= 1.001; k += 0.1) { const tt = tl * k, y = y0 + vy * tt - 4.9 * tt * tt; if (o.gap(x0 + vx * tt, y, y, z0 + vz * tt) < 40) return false; } return true; };
  for (const t0 of times) {
    const sn = o.snouts[rng.int(0, o.snouts.length - 1)], x0 = sn[0] - rng.range(0, 6), z0 = sn[1] + rng.range(-8, 8), y0 = o.ground(x0, z0) + 3;
    const nf = rng.int(6, 10);
    for (let i = 0; i < nf; i++) {
      // a steam burst throws all round
      const az = rng.range(0, Math.PI * 2), el = rng.range(0.87, 1.22), R = rng.range(30, 90), sp = Math.sqrt(R * 9.8 / Math.sin(2 * el));
      let vx = Math.cos(az) * Math.cos(el) * sp, vz = Math.sin(az) * Math.cos(el) * sp; const vy = Math.sin(el) * sp;
      const flight = () => { let tt = 0.3; for (; tt < 9; tt += 0.06) { if (y0 + vy * tt - 4.9 * tt * tt < o.ground(x0 + vx * tt, z0 + vz * tt) + 0.3) break; } return tt; };
      let tl = flight();
      // the clearance test chooses the throw: an arc that would come within 40 m of the route is thrown the other way
      // across the front instead (its sideways speed reversed)
      if (o.gap && !arcClear(x0, y0, z0, vx, vy, vz, tl)) { vx = -vx; tl = flight(); turned++; }
      const seed = rng(), size = rng.range(1.1, 2.4), delay = rng.range(0, 0.25);
      P0.push(x0, y0, z0); V.push(vx, vy, vz); Tt.push(t0 + delay, tl, 0, seed); Sz.push(size, size);
      P0.push(x0, y0, z0); V.push(vx, vy, vz); Tt.push(t0 + delay, tl, 1, rng()); Sz.push(1.5, rng.range(5, 9));
      P0.push(x0, y0, z0); V.push(vx, vy, vz); Tt.push(t0 + delay, tl, 4, (seed * 7.13) % 1); Sz.push(size, size);
    }
    for (let i = 0; i < 5; i++) { P0.push(x0 + rng.range(-3, 3), y0, z0 + rng.range(-3, 3)); V.push(rng.range(-4, 6), rng.range(9, 17), rng.range(-5, 5)); Tt.push(t0 + rng.range(0, 0.3), rng.range(4, 6), 2, rng()); Sz.push(4, rng.range(16, 30)); }
  }
  // blocks that break off a snout's front and roll down the slope they stand on (the ground's own fall line, a little
  // to either side of it), from their own stream
  const rr = o.rollers || rng.fork('rollers');
  for (const t0 of times) for (let i = 0; i < 2; i++) {
    const sn = o.snouts[rr.int(0, o.snouts.length - 1)], xs = sn[0] + rr.range(-4, 4), zs = sn[1] + rr.range(-12, 12);
    const gx = o.ground(xs + 3, zs) - o.ground(xs - 3, zs), gz = o.ground(xs, zs + 3) - o.ground(xs, zs - 3), az = Math.atan2(-gz, -gx) + rr.range(-0.5, 0.5);
    const x0 = xs + Math.cos(az) * 5, z0 = zs + Math.sin(az) * 5, sp = rr.range(1.8, 3.4), tl = rr.range(2.5, 4.5);
    let x1 = x0 + Math.cos(az) * sp * tl, z1 = z0 + Math.sin(az) * sp * tl; const y0 = o.ground(x0, z0) + 2.2;
    // a block that would roll to within 40 m of the route stays where it broke off
    if (o.gap && o.gap(x1, o.ground(x1, z1), o.ground(x1, z1) + 2, z1) < 40) { x1 = x0; z1 = z0; turned++; }
    const y1 = o.ground(x1, z1) + 0.5;
    P0.push(x0, y0, z0); V.push((x1 - x0) / tl, (y1 - y0) / tl, (z1 - z0) / tl); Tt.push(t0 + rr.range(0.5, 4), tl, 3, rr()); Sz.push(rr.range(1.2, 2.2), 0);
  }
  const g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(1, 1); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('aP0', new THREE.InstancedBufferAttribute(new Float32Array(P0), 3)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(V), 3));
  g.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(Tt), 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(Sz), 2)); g.instanceCount = P0.length / 3;
  const uniforms = { ...sharedUniforms(S), uPeriod: { value: PERIOD }, uBurstWind: { value: new THREE.Vector3(-2.5, 0, 0.4) }, uHotA: { value: new THREE.Color('#FF4A12').multiplyScalar(2.2) }, uHotB: { value: new THREE.Color('#FFD890').multiplyScalar(3.2) } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: BURST_VS, fragmentShader: BURST_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
  mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.name = 'lava-bursts';
  const api = { object: mesh, uniforms, times, period: PERIOD, triangles: (P0.length / 3) * 2, glow: 0, clearance: { turned },
    // the light a burst throws: eased up in 0.15 s, gone in about 2 s
    update(time) { let gl = 0; for (const t0 of times) { const a = (((time - t0) % PERIOD) + PERIOD) % PERIOD; if (a < 3) gl = Math.max(gl, smoothstep(0, 0.15, a) * Math.exp(-a * 1.6)); } api.glow = gl; } };
  return api;
}
