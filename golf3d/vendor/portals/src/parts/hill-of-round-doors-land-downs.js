// hill-of-round-doors, the land builder's part: THE FAR DOWNS. Round, soft chalk downs standing all about the valley,
// beyond the plan's ground: one mesh (a ring of rows that widen with distance, one draw call), lit by the land's own
// law and sunk in the scene's haze by distance, with a patchwork of pasture, hay and corn, hedges between the fields
// and woods on the steeper ground painted on it by place. The stream's valley runs out through them to east and west.
// They begin before the ground mesh ends, a few metres under it, so no edge of the ground shows.
import { LAND_NOISE, LAND_PARS, LAND_FAR } from './hill-of-round-doors-land-glsl.js';
import { streamZ } from './hill-of-round-doors-plan.js';

export const DOWNS = { x: 32, z: 0, stretch: 1.45, r0: 380, rows: Array.from({ length: 25 }, (_, k) => Math.pow(1.066, k)), seg: 192 };
const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// The downs' own height at a place (metres over the plan's valley floor); it is nought inside the first row.
// Whalebacks lying east and west, one behind another, each a little higher than the one before it, so that from
// the valley they stand as ridge behind ridge, paler with each.
export function downsHeight(noise, x, z) {
  const r = Math.hypot((x - DOWNS.x) / DOWNS.stretch, z - DOWNS.z), env = ss(DOWNS.r0 * 1.02, DOWNS.r0 * 1.85, r);
  const valley = 0.1 + 0.9 * ss(60, 380, Math.abs(z - streamZ(Math.max(-500, Math.min(500, x)))));
  const broad = noise.fbm2(x * 0.0008 + 3.1, z * 0.0022 - 7.7, 3) * 0.5 + 0.5, fold = noise.fbm2(x * 0.0037 - 11, z * 0.0037 + 5, 2) * 0.5 + 0.5;
  const rise = Math.min(150, Math.max(0, r - DOWNS.r0) * 0.085);
  return -5 + env * valley * (22 + 105 * broad * broad + rise * (0.35 + 0.65 * broad) + 24 * fold);
}

// o: { THREE, noise, uniforms }
export async function makeDowns(ctx, o) {
  const { THREE, noise, uniforms } = o, N = DOWNS.seg, rows = DOWNS.rows, nr = rows.length;
  const pos = new Float32Array((N + 1) * nr * 3), nor = new Float32Array((N + 1) * nr * 3), idx = [];
  const at = (a, k, out) => { const r = DOWNS.r0 * rows[k]; out[0] = DOWNS.x + Math.cos(a) * r * DOWNS.stretch; out[2] = DOWNS.z + Math.sin(a) * r; out[1] = downsHeight(noise, out[0], out[2]); return out; };
  const p = [0, 0, 0];
  for (let k = 0; k < nr; k++) {
    for (let i = 0; i <= N; i++) {
      const a = (i % N) / N * Math.PI * 2, v = (k * (N + 1) + i) * 3; at(a, k, p);
      pos[v] = p[0]; pos[v + 1] = p[1]; pos[v + 2] = p[2];
      const e = 12, gx = (downsHeight(noise, p[0] + e, p[2]) - downsHeight(noise, p[0] - e, p[2])) / (2 * e), gz = (downsHeight(noise, p[0], p[2] + e) - downsHeight(noise, p[0], p[2] - e)) / (2 * e), l = 1 / Math.hypot(gx, 1, gz);
      nor[v] = -gx * l; nor[v + 1] = l; nor[v + 2] = -gz * l;
    }
    await ctx.yield();
  }
  for (let k = 0; k < nr - 1; k++) for (let i = 0; i < N; i++) { const a = k * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
  geo.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({ name: 'hill-downs', uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
varying vec3 vW; varying vec3 vN; varying float vDepth;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: LAND_NOISE + LAND_PARS + LAND_FAR + /* glsl */`
varying vec3 vW; varying vec3 vN; varying float vDepth;
void main(){
  vec3 N = normalize(vN); if (N.y < 0.) N = -N;
  float px = max(length(dFdx(vW.xz)), length(dFdy(vW.xz)));
  vec3 alb = landFar(vW.xz, 1. - N.y, px);
  vec3 c = landLight(alb, N, landCloud(vW.xz), 1.) + landSheen(N, normalize(cameraPosition - vW), 1.);
  gl_FragColor = vec4(landFog(c, vDepth, 1.), 1.);
}` });
  const mesh = new THREE.Mesh(geo, material); mesh.name = 'hill-downs'; mesh.frustumCulled = false;
  return { object: mesh, triangles: idx.length / 3, dispose() { geo.dispose(); material.dispose(); } };
}
