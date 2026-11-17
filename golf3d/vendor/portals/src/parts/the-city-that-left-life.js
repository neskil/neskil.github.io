// THE CITY THAT LEFT, what lives and moves: the people at the rim, on the roofs and on the belvedere; the watchers the
// town left behind at the fence; stones and sleepers that work loose and fall; birds; cows; dust in the air by the rock.
// Everything ambient runs on the world clock in closed form (a still at any time shows what the film shows).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { HERO, RIM, STREET, GRID_ANGLE, TOWER, fromGrid, toGrid, PITCH, sharedU, GLSL_COMMON, Acc, makePropMaterial } from './the-city-that-left-common.js';
import { MILL } from './the-city-that-left-town.js';
import { roadX } from './the-city-that-left-land.js';
import { FENCE_Z } from './the-city-that-left-landprops.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- people: one instanced draw
// A figure is five boxes: body, head, two arms that can be raised, a lantern in one hand. Per instance: place (world
// x, z and a height that is either the town's or, flagged, the land's own, so those sink with the land), heading, coat
// colour, and what it is doing (waving, holding a lamp).
function figureGeometry() {
  const P = [], N = [], Q = [];                       // position, normal, part (0 body, 1 left arm, 2 right arm, 3 lantern)
  const box = (x0, y0, z0, x1, y1, z1, part, taper = 1) => {
    const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, t = (v, m) => m + (v - m) * taper;
    const v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [t(x0, xm), y1, t(z0, zm)], [t(x1, xm), y1, t(z0, zm)], [t(x1, xm), y1, t(z1, zm)], [t(x0, xm), y1, t(z1, zm)]];
    const quad = (a, b, c, d, n) => { for (const i of [a, b, c, a, c, d]) { P.push(...v[i]); N.push(...n); Q.push(part); } };
    quad(3, 2, 6, 7, [0, 0, 1]); quad(1, 0, 4, 5, [0, 0, -1]); quad(2, 1, 5, 6, [1, 0, 0]); quad(0, 3, 7, 4, [-1, 0, 0]); quad(7, 6, 5, 4, [0, 1, 0]);
  };
  box(-0.2, 0, -0.12, 0.2, 1.42, 0.12, 0, 0.92);                              // legs and coat, one tapered block
  box(-0.1, 1.45, -0.1, 0.1, 1.72, 0.1, 0);                                   // head
  box(-0.31, 0.72, -0.07, -0.21, 1.4, 0.07, 1); box(0.21, 0.72, -0.07, 0.31, 1.4, 0.07, 2);   // arms, hanging
  box(0.2, 0.42, 0.02, 0.34, 0.66, 0.16, 3);                                  // lantern
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Q, 1));
  return g;
}
function buildFigures(S, list) {
  const base = figureGeometry(), ig = new THREE.InstancedBufferGeometry(), n = list.length;
  for (const k of ['position', 'normal', 'aPart']) ig.setAttribute(k, base.attributes[k]);
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4);
  list.forEach((f, i) => {
    A.set([f.x, f.y, f.z, f.yaw], i * 4); B.set([f.col[0], f.col[1], f.col[2], f.land ? 1 : 0], i * 4); C.set([f.wave ? 1 : 0, f.phase, f.lamp ? 1 : 0, f.size], i * 4);
  });
  ig.setAttribute('aLamp', new THREE.InstancedBufferAttribute(new Float32Array(list.map((f) => f.lit || 0)), 1));
  ig.setAttribute('aPlace', new THREE.InstancedBufferAttribute(A, 4)); ig.setAttribute('aCoat', new THREE.InstancedBufferAttribute(B, 4)); ig.setAttribute('aDo', new THREE.InstancedBufferAttribute(C, 4));
  ig.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: sharedU(S, {}),
    vertexShader: /* glsl */`
      attribute float aPart, aLamp; attribute vec4 aPlace, aCoat, aDo;
      uniform float uTime, uLandY;
      varying vec3 vWorld, vN, vCol; varying float vGlow, vTown, vLamp;
      void main(){
        vec3 p = position*aDo.w, n = normal;
        float arm = step(.5, aPart)*step(aPart, 2.5), side = aPart < 1.5 ? -1. : 1.;
        // a raised arm swings from the shoulder: some wave with one arm, a few with both
        float up = aDo.x*(aPart < 1.5 ? step(.6, fract(aDo.y*3.7)) : 1.)*arm;
        float ang = up*(2.5 + .45*sin(uTime*(3. + 2.*fract(aDo.y*7.3)) + aDo.y*40.))*side;
        vec2 sh = vec2(side*.26, 1.38)*aDo.w, d = p.xy - sh;
        float ca = cos(ang), sa = sin(ang);
        p.xy = mix(p.xy, sh + vec2(d.x*ca - d.y*sa, d.x*sa + d.y*ca), arm);
        n.xy = mix(n.xy, vec2(n.x*ca - n.y*sa, n.x*sa + n.y*ca), arm);
        p *= 1. - step(2.5, aPart)*(1. - aDo.z);                       // no lantern: it shrinks into the hand
        float cy = cos(aPlace.w), sy = sin(aPlace.w);
        p.xz = vec2(p.x*cy + p.z*sy, -p.x*sy + p.z*cy); n.xz = vec2(n.x*cy + n.z*sy, -n.x*sy + n.z*cy);
        vec3 w = aPlace.xyz + p; w.y += aCoat.w*uLandY;
        vWorld = w; vN = n; vTown = 1. - aCoat.w; vLamp = aLamp;
        float head = step(1.44*aDo.w, position.y*aDo.w)*(1. - step(.5, aPart));
        vCol = mix(aCoat.rgb, vec3(.34, .24, .19), head*.8);
        vGlow = step(2.5, aPart)*aDo.z;
        gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.);
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vWorld, vN, vCol; varying float vGlow, vTown, vLamp;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
        // the town's people stand in its lamplight; the ones left behind have only the dusk
        vec3 col = vCol*(ctlLight(n) + uGold*.5*vTown*(.4 + .6*clamp(-n.y + .6, 0., 1.)));
        col += uGold*vGlow*1.6;
        // the ones at the fence who stand in the lorries' headlamps: lit from behind and low (the lamps look north)
        col += vCol*vec3(1., .86, .6)*vLamp*7.*clamp(n.z*.8 + .45, 0., 1.);
        gl_FragColor = vec4(ctlFog(col, vWorld - cameraPosition), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false;
  return { mesh, triangles: n * 50 };
}

// where the people are. o: { hero (the hero part's result), land (the land part's result), forks (the visit's streams) }
function placeFigures(o) {
  // each group has a stream of its own; nobody stands where the route passes within 6 m (tested in the frame the
  // group stands in: the town's, or the land's, which is lower the further along the route the eye is)
  const probe = o.hero.probe, R = { rim: o.forks.rimPeople, roofs: o.forks.roofPeople, belvedere: o.forks.belvedere, kerbs: o.forks.kerbs, fence: o.forks.fencePeople, road: o.forks.roadPeople };
  let rng = R.rim;
  // how much of the two lorries' headlamps reaches a spot on the land (they stand on the old road behind the fence,
  // 16 and 31 m back, lamps toward the hole): the same cone the land is lit with
  const lorryLamp = (x, z) => { let k = 0; for (const dz of [16, 31]) { const zL = FENCE_Z + dz, dy = zL - 2.4 - z, dx = x - (roadX(zL) + 1.4); if (dy > 0.4) k += Math.exp(-dy * 0.085) * (1 - smoothstep(0.2, 0.5, Math.abs(dx) / Math.max(dy, 1.5))); } return k; };
  const list = [], coats = [[0.05, 0.05, 0.06], [0.09, 0.07, 0.06], [0.06, 0.07, 0.09], [0.11, 0.1, 0.09], [0.1, 0.05, 0.045], [0.05, 0.07, 0.06], [0.14, 0.13, 0.12]];
  const add = (x, y, z, yaw, land, pWave, pLamp) => {
    const fig = { x, y, z, yaw: yaw + rng.range(-0.5, 0.5), land, col: rng.pick(coats), wave: rng.chance(pWave), lamp: rng.chance(pLamp), phase: rng(), size: rng.range(0.92, 1.08) * (land ? 1.3 : 1), lit: land ? lorryLamp(x, z) : 0 };
    if (land ? probe.land([x, y + 1, z], 6) : probe.world([x, y + 1, z], 6)) list.push(fig);
  };
  const shape = o.hero.shape, inYard = (x, z) => x < -118 && Math.abs(z) < 92;
  // at the rim, in knots, looking out and down
  for (let k = 0; k < 44; k++) {
    const a0 = rng.range(0, TAU), m = rng.int(3, 11);
    for (let i = 0; i < m; i++) {
      const a = a0 + rng.range(-0.035, 0.035), r = shape.wallR(a, STREET) - rng.range(1.6, 5.5), x = Math.cos(a) * r, z = Math.sin(a) * r, g = toGrid(x, z);
      if (Math.abs(g[0]) < 14 || (inYard(x, z) && rng.chance(0.7))) continue;
      add(x + HERO.x, HERO.y + STREET - 0.3, z + HERO.z, Math.atan2(Math.cos(a), Math.sin(a)), false, 0.2, 0.22);
    }
  }
  rng = R.roofs;
  // on the flat roofs of the warehouses by the edge
  for (const L of o.hero.town.lots.lots) {
    if (!L.warehouse || !rng.chance(0.4)) continue;
    const m = rng.int(2, 6), a = Math.atan2(L.z, L.x);
    for (let i = 0; i < m; i++) add(L.x + Math.cos(a) * (Math.min(L.w, L.d) * 0.36) + rng.range(-2.5, 2.5) + HERO.x, HERO.y + STREET - 0.3 + L.h + 0.45, L.z + Math.sin(a) * (Math.min(L.w, L.d) * 0.36) + rng.range(-2.5, 2.5) + HERO.z, Math.atan2(Math.cos(a), Math.sin(a)), false, 0.3, 0.2);
  }
  rng = R.belvedere;
  // on the belvedere of the tower, at the parapet
  for (let i = 0; i < 40; i++) {
    const s = rng.int(0, 3), t = rng.range(-12.4, 12.4), lx = s === 0 ? 12.9 : s === 1 ? -12.9 : t, lz = s === 2 ? 12.9 : s === 3 ? -12.9 : t, ca = Math.cos(GRID_ANGLE), sa = Math.sin(GRID_ANGLE);
    const x = TOWER.x + lx * ca + lz * sa, z = TOWER.z - lx * sa + lz * ca;
    add(x + HERO.x, HERO.y + STREET + 96.4, z + HERO.z, Math.atan2(x - TOWER.x, z - TOWER.z), false, 0.25, 0.3);
  }
  rng = R.kerbs;
  // along the avenue's kerbs and at the crossings
  for (let i = 0; i < 110; i++) {
    const a = rng.range(-170, 120), c = rng.pick([-1, 1]) * rng.range(11.6, 12.6) + rng.pick([0, 0, -PITCH[1], PITCH[1]]), w = fromGrid(a, c);
    if (Math.hypot(w[0], w[1]) > RIM - 8) continue;
    add(w[0] + HERO.x, HERO.y + STREET + 0.2, w[1] + HERO.z, rng.range(0, TAU), false, 0.04, 0.12);
  }
  rng = R.fence;
  // the ones left behind: at the fence across the old road, and a few coming up it
  const gy = (x, z) => o.land.shape.ground(x, z);
  for (let i = 0; i < 60; i++) { const x = roadX(-121) + rng.range(-34, 44), z = -121 + rng.range(0, 5) + Math.abs(rng.range(-1, 1)) * 5; add(x, gy(x, z), z, Math.PI, true, 0.45, 0.12); }
  rng = R.road;
  for (let i = 0; i < 14; i++) { const z = rng.range(-100, -10), x = roadX(z) + rng.range(-3, 3); add(x, gy(x, z), z, Math.PI, true, 0.05, 0.3); }
  return list;
}

// ---------------------------------------------------------------- stones and sleepers that work loose
// A pool of six. Each slot runs its own cycle on the world clock (17 to 34 s long, so one lets go every few seconds
// somewhere); which ledge it drops from is drawn afresh from the cycle's number. Free fall, a slow tumble: closed form.
function buildStones(S, o) {
  const rng = o.rng, acc = new Acc(), n = 6, shape = o.hero.shape;
  // one lump of rock, corners knocked off
  const c = [0.13, 0.12, 0.11], k = () => rng.range(0.35, 0.5);
  const v = [[-k(), -k() * 0.7, -k()], [k(), -k() * 0.7, -k()], [k(), -k() * 0.7, k()], [-k(), -k() * 0.7, k()], [-k(), k() * 0.7, -k()], [k(), k() * 0.7, -k()], [k(), k() * 0.7, k()], [-k(), k() * 0.7, k()]];
  for (const [a, b, d, e] of [[3, 2, 6, 7], [1, 0, 4, 5], [2, 1, 5, 6], [0, 3, 7, 4], [7, 6, 5, 4], [0, 1, 2, 3]]) acc.quad(v[a], v[b], v[d], v[e], c);
  const mesh = new THREE.InstancedMesh(acc.build(), makePropMaterial(S), n); mesh.frustumCulled = false;
  // ledges it can come from: anywhere round the cut wall and the edge of the belly, but for those whose fall the
  // route would pass within 13 m of
  // (the six slots' numbers are drawn first: how many ledges the route's test throws away must not move them)
  const slots = []; for (let i = 0; i < n; i++) slots.push({ period: rng.range(17, 34), off: rng.range(0, 40), salt: rng.range(1, 99) });
  const spots = [];
  for (let i = 0; i < 400 && spots.length < 40; i++) {
    const a = rng.range(0, TAU), wall = rng.chance(0.6), y = wall ? STREET - rng.range(2, 26) : 0, r = wall ? shape.wallR(a, y) + 0.8 : RIM * rng.range(0.82, 0.97);
    const p = [Math.cos(a) * r, wall ? y : shape.under(Math.cos(a) * r, Math.sin(a) * r) - 0.8, Math.sin(a) * r];
    const spot = { p, out: [Math.cos(a), Math.sin(a)], size: rng.range(0.9, 2.4), sleeper: wall && rng.chance(0.3), spin: [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)] };
    // its whole fall (8 m out, 160 m down) is tested
    if (!o.hero.probe.fall('hero', p, spot.out, 8, 160, 13, 1)) continue;
    spots.push(spot);
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  const hash = (x) => { const t = Math.sin(x * 127.1 + 311.7) * 43758.5453; return t - Math.floor(t); };
  return {
    mesh, triangles: n * 12, spots,
    update(time) {
      for (let i = 0; i < n; i++) {
        const sl = slots[i], tt = time + sl.off, cyc = Math.floor(tt / sl.period), tau = tt - cyc * sl.period;
        const sp = spots.length ? spots[Math.floor(hash(cyc * 7.13 + sl.salt) * spots.length) % spots.length] : null;
        if (!sp || tau > 6.2) { m.makeScale(0, 0, 0); mesh.setMatrixAt(i, m); continue; }
        // it teeters for half a second, then goes
        const f = Math.max(0, tau - 0.5), drop = 4.9 * f * f, outw = 1.4 * f;
        pos.set(HERO.x + sp.p[0] + sp.out[0] * outw, HERO.y + sp.p[1] - drop, HERO.z + sp.p[2] + sp.out[1] * outw);
        e.set(sp.spin[0] * f * 1.7, sp.spin[1] * f * 1.3, sp.spin[2] * f * 1.9 + 0.2 * Math.sin(tau * 9) * (tau < 0.5 ? 1 : 0)); q.setFromEuler(e);
        const grow = smoothstep(0, 0.25, tau);
        if (sp.sleeper) sc.set(2.6 * grow, 0.3 * grow, 0.36 * grow); else sc.set(sp.size * grow, sp.size * 0.8 * grow, sp.size * grow);
        m.compose(pos, q, sc); mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- the whole of it
// o: { scene, path, duration, hero, land (the land part: group, shape), birds: 'pigeons' | 'gulls' | 'starlings' }
export async function buildLife(ctx, S, o) {
  const K = o.forks, group = new THREE.Group();                 // the visit's streams (the list is in -common.js)
  const figs = buildFigures(S, placeFigures({ forks: K, hero: o.hero, land: o.land }));
  group.add(figs.mesh);
  await ctx.yield();
  const stones = buildStones(S, { rng: K.stones, hero: o.hero });
  group.add(stones.mesh);
  await ctx.yield();
  // birds and cattle: the kit's, lit with the scene's own lights
  const light = F.lightFrom(o.scene), air = F.makeFauna(group, { light }), field = F.makeFauna(o.land.group, { light });
  // M: places on the route (as the kit takes them, in u): the watchers' fence, out under the west lip, level with
  // the streets, 60 m past the portal. Three meetings the design names are keyed to the flight at those places, with
  // the kit's own crossing and pacing flocks: the geese, the crows, the pigeons that keep pace.
  const path = o.path, DUR = o.duration, top = HERO.y + STREET, M = o.at;
  // geese in a V, low across the route as it passes the watchers' fence, the town filling the sky ahead
  air.add(F.makeFlock({ rng: K.geese, species: 'geese', count: 17, cross: { path, u: M.fence, lead: 70, angle: 68, side: 1, height: 26, span: 520, duration: DUR } }));
  await ctx.yield();
  // A flock that wheels on a loop is a bystander, on the world clock, and is tested against the route like
  // everything else: it wheels at a place of its own choosing, and only if the route keeps `tube` metres (the
  // flock's own width and a margin) from its whole loop; if not, it tries its next place, or does not fly.
  const probe = o.hero.probe;
  const loopClear = (c, R, tube) => { for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; if (!probe.world([c[0] + Math.cos(a) * R, c[1], c[2] + Math.sin(a) * R], tube)) return false; } return true; };
  const wheelAt = (cands, R, tube) => cands.find((c) => loopClear(c, R, tube)) || null;
  // swifts hunting along the cut wall, in three parties a third of the way round from each other; where round the
  // town the first one hunts is drawn; each party has a stream of its own (a party the route's test leaves out
  // takes nothing from another's)
  const swift0 = K.swifts.range(0, TAU);
  for (let k = 0; k < 3; k++) {
    const b = swift0 + k * TAU / 3, c = [HERO.x + Math.cos(b) * (RIM + 12), top - 14, HERO.z + Math.sin(b) * (RIM + 12)];
    if (loopClear(c, 28, 30)) air.add(F.makeFlock({ rng: [K.swifts, K.swifts1, K.swifts2][k], species: 'swifts', count: 14, center: c, radius: 28, height: 12 }));
  }
  // the town's own flock, wheeling over the roofs of one quarter beside the avenue (which quarter, and how high, is
  // drawn); another keeps pace with the route from the rim to the tower
  const kind = o.birds || 'pigeons';
  const pigeon = kind === 'gulls' ? { species: 'gulls', size: 1.3 } : { species: 'gulls', size: 0.95, flap: 5.5, glide: 0.15, palette: { body: '#6a6e78', belly: '#8a8c92', wingC: '#585c66', tip: '#2a2c30', head: '#4a5058', beak: '#3a3430', tailC: '#3a3c42' } };
  const roofAt = [], flockRng = K.roofFlock;
  for (const up of [58, 95, 130]) for (const [ga, gc] of [[-50, -120], [-50, 120], [40, -125], [40, 125], [-110, -110], [-110, 110]]) { const w = fromGrid(ga, gc); roofAt.push([HERO.x + w[0], top + up, HERO.z + w[1]]); }
  for (let i = roofAt.length - 1; i > 0; i--) { const j = flockRng.int(0, i), t = roofAt[i]; roofAt[i] = roofAt[j]; roofAt[j] = t; }
  const flockC = wheelAt(roofAt, 70, kind === 'starlings' ? 52 : 42);
  if (flockC && kind === 'starlings') air.add(F.makeFlock({ rng: flockRng, species: 'starlings', count: 1400, center: flockC, radius: 70 }));
  else if (flockC) air.add(F.makeFlock({ rng: flockRng, ...pigeon, count: 120, spread: [30, 10, 30], center: flockC, radius: 70, height: 10 }));
  // a party of the town's birds wheels round the tower's crown, just above its cap (stream 'crownFlock'; left out
  // if the route passes within 14 m of its round)
  const crownC = [HERO.x + TOWER.x, top + 142, HERO.z + TOWER.z];
  if (loopClear(crownC, 26, 14)) air.add(F.makeFlock({ rng: K.crownFlock, ...pigeon, count: 40, spread: [10, 5, 10], center: crownC, radius: 26, height: 6 }));
  await ctx.yield();
  air.add(F.makeFlock({ rng: K.paceFlock, ...pigeon, count: kind === 'starlings' ? 60 : 120, spread: [18, 7, 30], along: { path, side: -16, up: 8, lead: 46, from: M.top, to: M.past, drift: 10 } }));
  // crows off the lip as the route comes out from under it
  air.add(F.makeFlock({ rng: K.crows, species: 'crows', count: 8, cross: { path, u: M.out, lead: 42, angle: 110, side: -1, height: 12, span: 260, rise: 30, duration: DUR } }));
  await ctx.yield();
  // cattle in the pasture west of the old river, backs to the hole
  // (the pasture nearest the old river that the route keeps 46 m from, herd and all)
  const cowsC = [[-78, 0, -168], [-108, 0, -168], [-138, 0, -168], [-168, 0, -168]].find((c) => probe.land([c[0], 2, c[2]], 46)) || [-198, 0, -168];
  const cow = { ...F.HERD_PRESETS.bison, h: 1.45, hump: 0.02, horns: 0.07, neck: [0.27, 0.2], headR: 0.12, bodyLen: 1.0, depth: 0.56 };
  field.add(F.makeHerd({ rng: K.cows, preset: cow, count: 12, coat: '#2b2622', belly: '#d9d2c4', pattern: 'patches', accent: '#e6dfd0', center: cowsC, radius: 34, heightAt: (x, z) => o.land.shape.ground(x, z), fill: 0.45 }));
  await ctx.yield();
  // dust in the air wherever the rock is near: it falls past the eye, the plainest sign that the town is going up
  const dust = fx.makeParticles({ rng: K.dust, preset: 'dust', count: 3200, box: [46, 30, 46], velocity: [0.3, -3.4, 0.2], velocityRandom: [0.6, 1.2, 0.6], colors: ['#c9b49a', '#e0c8a8', '#9a8f94'], intensity: 1.3, size: [0.035, 0.1], twinkle: 0.2 });
  group.add(dust.object);
  // and inside the field, over the town, the air is still: motes hang weightless round the eye and glitter in the lamplight
  const motes = fx.makeParticles({ rng: K.motes, preset: 'dust', count: 4200, box: [40, 26, 40], velocity: [0.05, 0.02, 0.04], velocityRandom: [0.25, 0.15, 0.25], turbulence: [0.6, 0.3, 0.2], colors: ['#ffd9a0', '#ffc56b', '#e8b070'], intensity: 2.2, size: [0.035, 0.11], twinkle: 0.85 });
  group.add(motes.object);
  // the motes hang inside the field: they thin out over the last 60 m to its skin (its radius is the hero's own)
  const eye = new THREE.Vector3(), fieldR = o.hero.fieldR;
  return {
    object: group, figures: figs, stones, air, field, dust, motes,
    triangles: figs.triangles + stones.triangles + air.triangles + field.triangles + 3000,
    update(dt, time, camera, u) {
      stones.update(time);
      air.update(dt, time, camera, u); field.update(dt, time, camera, u);
      // how near the rock is: under the belly, beside the cut wall
      eye.setFromMatrixPosition(camera.matrixWorld);
      const r = Math.hypot(eye.x - HERO.x, eye.z - HERO.z), nearRock = (1 - smoothstep(RIM + 30, RIM + 150, r)) * (1 - smoothstep(top + 6, top + 40, eye.y));
      const inField = 1 - smoothstep(fieldR - 60, fieldR - 10, Math.hypot(eye.x - HERO.x, eye.y - HERO.y - 85, eye.z - HERO.z));
      // (the grit the rising rock sheds is thick beside it and thin over the whole valley outside the field)
      dust.setOpacity(ctx.through ? 0 : Math.max(nearRock, 0.45 * (1 - inField))); dust.update(dt, time, camera);
      motes.setOpacity(ctx.through ? 0 : inField * (1 - nearRock)); motes.update(dt, time, camera);
    },
  };
}
