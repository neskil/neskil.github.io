// hill-of-round-doors, the land builder's part: THINGS OF THE FARMED LAND. Hay stooks stand in rows on every field
// that is just mown (the land's own lattice of fields says which), so that a pale mown field is a hayfield; kitchen
// plots of cabbages lie in rows on the valley side of both lanes, across the way from the homes. Two instanced
// meshes of our own (a stook: a bound sheaf, 49 triangles; a cabbage: a low round head, 20), lit by the land's law
// under the baked shade. Nothing stands within THING_CLEAR metres of the flown line in plan (they are under 2.5 m
// high and the line passes 8 m over the lanes), on a way, in a garden, on a mound, on the party lawn or in the wet.
import { LAND_NOISE, LAND_PARS, FAR, farPoint, farKind } from './hill-of-round-doors-land-glsl.js';
import { LANE1, LANE2, laneAt } from './hill-of-round-doors-plan.js';

export const THING_CLEAR = 9.5;

// o: { THREE, rng, kinds, routeField, heightAt, uniforms }
export async function makeThings(ctx, o) {
  const { THREE, rng, kinds, routeField, heightAt, uniforms } = o, k = {}, p = { x: 0, z: 0 }, stooks = [], heads = [];
  const free = (x, z, y) => { kinds.at(x, z, k, y); return k.grows && !k.water && k.wet < 0.3 && k.way > 6.5 && k.garden < 0.02 && k.mound < 0.02 && k.lawn < 0.3; };
  // ---- stooks: on each mown field within reach of the line, in rows nine metres apart
  for (let gx = -4; gx <= 4; gx++) {
    for (let gy = -4; gy <= 4; gy++) {
      if (farKind(gx, gy, kinds.farSeed) < FAR.mown) continue;
      for (let a = 0.13; a < 0.9; a += 0.098) for (let b = 0.13; b < 0.9; b += 0.098) {
        const ja = rng.range(-0.02, 0.02), jb = rng.range(-0.02, 0.02), rot = rng.range(0, 6.283), s = rng.range(0.85, 1.15);   // the stook's dice, before any test
        farPoint(gx + a + ja, gy + b + jb, p); const rd = routeField(p.x, p.z);
        if (rd < THING_CLEAR + 2 || rd > 190) continue;
        const y = heightAt(p.x, p.z); if (free(p.x, p.z, y)) stooks.push([p.x, y, p.z, rot, s]);
      }
    }
    await ctx.yield();
  }
  // ---- kitchen plots: every 24 m along each lane, 14 m to its valley side, four rows of eight heads
  for (const L of [LANE1, LANE2]) for (let s = 14; s < L.length - 8; s += 24) {
    const c = laneAt(L, s), cx = c[0] - L.uphill[0] * 14, cz = c[2] - L.uphill[1] * 14;
    for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) {
      const size = rng.range(0.8, 1.2), rot = rng.range(0, 6.283), jit = rng.range(-0.25, 0.25), along = (i - 3.5) * 1.7 + jit, across = (r - 1.5) * 2.1;   // the head's dice, before any test
      const x = cx + L.heading[0] * along - L.uphill[0] * across, z = cz + L.heading[1] * along - L.uphill[1] * across, y = heightAt(x, z);
      if (routeField(x, z) >= THING_CLEAR && free(x, z, y)) heads.push([x, y, z, rot, size]);
    }
    await ctx.yield();
  }
  // ---- the two shapes. A stook: a sheaf standing on its spread foot, bound at the waist, its ears flaring above
  const sheaf = () => {
    const P = [], C = [], I = [], ring = [[0.95, 0, 0.5], [0.6, 0.95, 0.72], [0.4, 1.5, 0.45], [0.72, 2.15, 1], [0.05, 2.3, 0.85]], S = 7;
    ring.forEach(([r, y, tone], j) => { for (let i = 0; i < S; i++) { const a = (i + (j & 1) * 0.5) / S * 6.2832; P.push(Math.cos(a) * r, y, Math.sin(a) * r); C.push(0.78 * tone, 0.6 * tone, 0.26 * tone); } });
    for (let j = 0; j < ring.length - 1; j++) for (let i = 0; i < S; i++) { const a = j * S + i, b = j * S + (i + 1) % S, c = a + S, d = b + S; if (j < ring.length - 2) I.push(a, c, b, b, c, d); else I.push(a, c, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
    return g;
  };
  // a cabbage: a low round head, paler on top
  const head = () => {
    const g = new THREE.IcosahedronGeometry(1, 0), hp = g.attributes.position, hc = new Float32Array(hp.count * 3);
    for (let i = 0; i < hp.count; i++) { const t = hp.getY(i) * 0.5 + 0.5; hc[i * 3] = 0.06 + 0.2 * t; hc[i * 3 + 1] = 0.19 + 0.3 * t; hc[i * 3 + 2] = 0.07 + 0.09 * t; }      // (a deep leaf green below, a pale heart)
    g.setAttribute('color', new THREE.BufferAttribute(hc, 3)); g.scale(0.62, 0.42, 0.62); g.translate(0, 0.3, 0);
    return g;
  };
  const group = new THREE.Group(), meshes = []; group.name = 'hill-things';
  if (!stooks.length && !heads.length) return { object: group, triangles: 0, counts: { stooks: 0, heads: 0 }, dispose() {} };
  const material = new THREE.ShaderMaterial({ name: 'hill-things', uniforms, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vDepth;
void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal); vC = color;
  vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: LAND_NOISE + LAND_PARS + /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vDepth;
void main(){ vec3 N = normalize(vN + vec3(0., 1e-4, 0.)) * (gl_FrontFacing ? 1. : -1.), sh = landShade(vW.xz);
  gl_FragColor = vec4(landFog(landLight(vC, N, sh.r * landCloud(vW.xz), .55 + .45 * sh.g), vDepth, 0.), 1.); }` });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let triangles = 0;
  for (const [make, list, name] of [[sheaf, stooks, 'hill-stooks'], [head, heads, 'hill-kitchen-plots']]) {
    if (!list.length) continue;
    const geo = make(), mesh = new THREE.InstancedMesh(geo, material, list.length);
    triangles += list.length * (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
    list.forEach(([x, y, z, rot, s], i) => { v.set(x, y - 0.04, z); sc.set(s, s, s); mesh.setMatrixAt(i, m.compose(v, q.setFromAxisAngle(up, rot), sc)); });
    mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = name; group.add(mesh); meshes.push(mesh);
  }
  return { object: group, triangles, counts: { stooks: stooks.length, heads: heads.length },
    dispose() { material.dispose(); for (const mesh of meshes) { mesh.geometry.dispose(); mesh.dispose(); } } };
}
