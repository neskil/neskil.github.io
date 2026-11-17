// hill-of-round-doors, the land builder's part: THE ANIMALS OF THE LAND. Sheep grazing on the hill, on the bank over the party field
// and in the south meadow (the kit's own walking quadruped, src/kit/fauna.js makeHerd, given a sheep's build: a deep woolly barrel on
// short dark legs, a short neck, a cream fleece); swallows hawking low over the pond and the meadow (the kit's swifts
// on closed courses of our own); butterflies over the gardens and verges of the two lanes (the kit's, on anchors of
// our own); ducks on the pond (ours: a few small bodies drifting on slow rounds by the world's clock).
// CLEAR AIR, by place: every sheep keeps SHEEP_CLEAR m from the flown line in plan (the kit's own corridor); the
// swallows' courses are laid at least 24 m from the line and the kit holds every bird SWALLOW_CLEAR m off it; the
// butterflies are small things of the air: the kit moves any anchor whose whole flutter would come within
// BUTTERFLY_CLEAR m of the line; the ducks swim on the pond above the weir, 12 m under the line where it crosses the
// bridge and at least 14 m from it in plan.
import * as Fauna from '../kit/fauna.js';
import { LAND_NOISE, LAND_PARS } from './hill-of-round-doors-land-glsl.js';
import { LANE1, LANE2, laneAt, WATER, streamZ } from './hill-of-round-doors-plan.js';

export const SHEEP_CLEAR = 14, SWALLOW_CLEAR = 9, BUTTERFLY_CLEAR = 3;
const SHEEP = { ...Fauna.HERD_PRESETS.deer, h: 2.1, bodyLen: 0.92, width: 0.44, depth: 0.58, hip: 0.9, leg: [0.05, 0.034, 0.026], neckLen: 0.24, neckAng: 38, neck: [0.2, 0.14],
  headLen: 0.25, headR: 0.09, headPitch: 28, ears: 0.12, tail: 0.1, antlers: 0, graze: 1.25, coat: '#e6dfcc', belly: '#d6cdb8', legs: '#3a342e', sock: '#2c2824', accent: '#eee8d8',
  pattern: 'none', speed: 0.45, stride: 0.8, varieties: 0 };

// o: { THREE, R (streams: sheep, swallows, butterflies, ducks), look, path, heightAt, uniforms, density }
// (made a flock at a time, the page drawing between them)
export async function makeLife(ctx, o) {
  const { THREE, R, look, path, heightAt, uniforms } = o, group = new THREE.Group(), parts = []; group.name = 'hill-life';
  const light = { sunDir: look.sun, sunColor: look.sunLight, sky: look.skyLight, ground: look.groundLight }, d = o.density ?? 1;
  const add = (p) => { parts.push(p); group.add(p.object); return p; };
  // ---- sheep: one flock on the slope between the two lanes, one on the hill's west shoulder, a few in the south
  // meadow, one on the bank north of the party field, one on the hill's slope above the bend and the last lane
  for (const [name, x, z, r, n] of [['slope', 22, -38, 17, 8], ['shoulder', -108, -72, 20, 6], ['meadow', 74, 218, 16, 4], ['bank', 118, 30, 15, 9], ['top', -45, -118, 21, 12]]) {
    add(Fauna.makeHerd({ rng: R.sheep.fork(name), preset: SHEEP, count: Math.max(2, Math.round(n * d)), center: [x, heightAt(x, z), z], radius: r, heightAt, path, clear: SHEEP_CLEAR, light, fill: 0.4, sizes: [1, 0.92, 1.04, 0.66, 0.96, 0.7] }));
    await ctx.yield();
  }
  // ---- swallows: two small parties on closed courses low over the pond and over the west meadow
  const course = (pts) => pts.map(([x, up, z]) => [x, Math.max(WATER, heightAt(x, z)) + up, z]);
  for (const [name, pts] of [['pond', [[-96, 5, 160], [-62, 4, 186], [-30, 6, 208], [-66, 9, 226], [-118, 7, 204]]], ['west', [[-150, 9, 60], [-112, 7, 96], [-140, 11, 128], [-186, 9, 104]]]]) {
    add(Fauna.makeFlock({ rng: R.swallows.fork(name), species: 'swifts', count: Math.max(3, Math.round(6 * d)), size: 2.6, speed: 15, route: course(pts), closed: true, spread: [5, 1.5, 9], wander: [2.5, 1, 2.5, 0.5],
      maxSigma: 2.5, keepClear: { path, dist: SWALLOW_CLEAR }, light, body: '#1c2440', belly: '#efe6d6' }));
    await ctx.yield();
  }
  // ---- butterflies: over the gardens and the verges on the hill side of both lanes
  const anchors = [], q = { x: 0, y: 0, z: 0 };
  for (const [L, side, n] of [[LANE1, 1, 16], [LANE2, -1, 12]]) for (let i = 0; i < Math.round(n * d); i++) {
    const s = R.butterflies.range(6, L.length - 6), off = R.butterflies.range(4.5, 10) * (R.butterflies() < 0.8 ? 1 : -0.6), up = R.butterflies.range(1, 2.6), c = laneAt(L, s);
    const x = c[0] + L.uphill[0] * off, z = c[2] + L.uphill[1] * off; anchors.push([x, heightAt(x, z) + up, z]);
  }
  add(Fauna.makeButterflies({ rng: R.butterflies.fork('wings'), positions: anchors, count: anchors.length, size: 5, roam: [1.6, 0.8, 0.5, 0.35], keepClear: { path, dist: BUTTERFLY_CLEAR }, light }));
  await ctx.yield();
  // ---- ducks on the pond: a body, a head and a bill, drifting on slow rounds
  const P = [], Nn = [], C = [], sph = (cx, cy, cz, rx, ry, rz, ws, hs, col) => {
    const g = new THREE.SphereGeometry(1, ws, hs).toNonIndexed(), p = g.attributes.position.array, nn = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) { P.push(cx + p[i] * rx, cy + p[i + 1] * ry, cz + p[i + 2] * rz); Nn.push(nn[i], nn[i + 1], nn[i + 2]); C.push(col); }
    g.dispose();
  };
  sph(0, 0.2, 0, 0.62, 0.3, 0.34, 8, 5, 0); sph(-0.6, 0.34, 0, 0.2, 0.1, 0.13, 5, 3, 0); sph(0.5, 0.62, 0, 0.17, 0.2, 0.15, 6, 4, 1); sph(0.72, 0.6, 0, 0.14, 0.045, 0.075, 5, 3, 2);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); dg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); dg.setAttribute('aPart', new THREE.Float32BufferAttribute(C, 1));
  const nd = Math.max(3, Math.round(7 * d)), home = new Float32Array(nd * 4), tint = new Float32Array(nd);
  for (let i = 0; i < nd; i++) {
    const x = R.ducks.range(-46, -20), z = streamZ(x) + R.ducks.range(1, 13), r = R.ducks.range(2.5, 6), ph = R.ducks.range(0, 6.283), drake = R.ducks() < 0.5 ? 1 : 0;
    home[i * 4] = x; home[i * 4 + 1] = z; home[i * 4 + 2] = r * (R.ducks() < 0.5 ? 1 : -1); home[i * 4 + 3] = ph; tint[i] = drake;
  }
  dg.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4)); dg.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1));
  const dm = new THREE.ShaderMaterial({ name: 'hill-ducks', uniforms,
    vertexShader: /* glsl */`
attribute float aPart, aTint; attribute vec4 aHome; uniform float uTime; varying vec3 vN; varying vec3 vC; varying float vDepth;
void main(){
  float r = aHome.z, a = aHome.w + uTime * .5 / r, c = cos(a), s = sin(a);
  vec2 at = aHome.xy + abs(r) * vec2(c, s), fw = vec2(-s, c);                       // on its round; it swims along the round's tangent
  vec3 p = position * 1.5; p.y += .03 * sin(uTime * 1.7 + aHome.w * 5.) - .08;
  vec3 w = vec3(at.x + fw.x * p.x - fw.y * p.z, ${WATER.toFixed(2)} + p.y, at.y + fw.y * p.x + fw.x * p.z);
  vN = vec3(fw.x * normal.x - fw.y * normal.z, normal.y, fw.y * normal.x + fw.x * normal.z);
  vec3 body = mix(vec3(.3, .22, .15), vec3(.52, .5, .47), aTint), head = mix(vec3(.3, .22, .14), vec3(.03, .16, .1), aTint);
  vC = aPart < .5 ? body * (.8 + .4 * step(.25, position.y)) : (aPart < 1.5 ? head : vec3(.75, .55, .08));
  vec4 mv = viewMatrix * vec4(w, 1.); vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: LAND_NOISE + LAND_PARS + /* glsl */`
varying vec3 vN; varying vec3 vC; varying float vDepth;
void main(){ vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); gl_FragColor = vec4(landFog(landLight(vC, N, 1., 1.), vDepth, 0.), 1.); }` });
  const ducks = new THREE.InstancedMesh(dg, dm, nd); ducks.frustumCulled = false; ducks.name = 'hill-ducks'; group.add(ducks);
  let triangles = P.length / 9 * nd; for (const p of parts) triangles += p.triangles || 0;
  return { object: group, triangles, parts,
    update(dt, time, u, camera) { for (const p of parts) p.update(dt, time, camera, u); },
    dispose() { for (const p of parts) { if (p.dispose) p.dispose(); else { if (p.geometry) p.geometry.dispose(); if (p.material) p.material.dispose(); } } dg.dispose(); dm.dispose(); ducks.dispose(); } };
}
