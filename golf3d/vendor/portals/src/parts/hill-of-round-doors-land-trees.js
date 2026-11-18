// hill-of-round-doors, the land builder's part: THE ORDINARY TREES. The hedgerow trees and the orchard are the kit's
// own broadleaves (src/kit/flora.js oakGeometry, drawn by its wind material under the scene's two lights, swaying in
// the wind), instanced: full trees where they stand within NEAR metres of the flown line in plan, the kit's lighter
// stand-ins beyond (a choice by place, made once). The far country's hedgerow trees are small round crowns of our
// own, one instanced mesh, lit by the land's law and paled by the air. Where each stands is land-fields.js's.
import * as Flora from '../kit/flora.js';
import { LAND_NOISE, LAND_PARS } from './hill-of-round-doors-land-glsl.js';

const NEAR = 36;

// o: { THREE, rng, trees, far, uniforms, material (the land's shared wind material) }
// (the six tree shapes are grown one at a time, the page drawing between them)
export async function makeTrees(ctx, o) {
  const { THREE, rng, trees, far, uniforms, material } = o, group = new THREE.Group(); group.name = 'hill-trees';
  // ---- three kinds: two hedgerow oaks and the orchard's small round tree; each full and as a stand-in
  const H = [15, 17, 9], pal = [{}, { leaf: '#4a7d30', leafLight: '#86a848' }, { leaf: '#5a8a36', leafLight: '#9bb654', leafDark: '#33561f', fullness: 1.25 }];
  const full = [], lite = [];
  for (let i = 0; i < H.length; i++) { full.push(Flora.oakGeometry({ rng: rng.fork('full' + i), height: H[i], detail: 1, ...pal[i] })); await ctx.yield(); }
  for (let i = 0; i < H.length; i++) { lite.push(Flora.oakGeometry({ rng: rng.fork('lite' + i), height: H[i], detail: 0, ...pal[i] })); await ctx.yield(); }
  const points = trees.map((t) => ({ x: t.x, y: t.y, z: t.z, s: t.h / H[t.kind], rot: rng.range(0, Math.PI * 2), d: t.d, u: 0, v: t.kind }));
  const stand = Flora.makeScatter({ rng: rng.fork('stand'), points, variants: full, farVariants: lite, farDistance: NEAR, material, tint: 0.14, hue: 0.05, sink: 0.02 });
  stand.object.name = 'hill-hedgerow-trees'; group.add(stand.object);
  // ---- the far country's trees: a crown of twelve triangles each
  const R = 4, bp = [0, 1, 0], bi = [];
  for (let k = 0; k < R; k++) { const a = k / R * Math.PI * 2; bp.push(Math.cos(a) * 0.78, 0.62, Math.sin(a) * 0.78); }
  for (let k = 0; k < R; k++) { const a = (k + 0.5) / R * Math.PI * 2; bp.push(Math.cos(a) * 0.86, 0.08, Math.sin(a) * 0.86); }
  for (let k = 0; k < R; k++) { const a = 1 + k, b = 1 + (k + 1) % R, c = 1 + R + k, d = 1 + R + (k + R - 1) % R; bi.push(0, b, a, a, b, c, a, c, d); }
  const blob = new THREE.BufferGeometry(); blob.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); blob.setIndex(bi); blob.computeVertexNormals();
  const tone = new Float32Array(far.length);
  const fmat = new THREE.ShaderMaterial({ name: 'hill-far-trees', uniforms,
    vertexShader: /* glsl */`
attribute float aTone; varying vec3 vW; varying vec3 vN; varying float vTone, vDepth, vUp;
void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal); vTone = aTone; vUp = position.y;
  vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: LAND_NOISE + LAND_PARS + /* glsl */`
varying vec3 vW; varying vec3 vN; varying float vTone, vDepth, vUp;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 alb = uTurf * mix(vec3(.38, .56, .42), vec3(.7, .86, .5), vTone) * (.55 + .6 * vUp);
  vec3 c = landLight(alb, N, landCloud(vW.xz), .6 + .4 * vUp);
  gl_FragColor = vec4(landFog(c, vDepth, 1.), 1.);
}` });
  const blobs = new THREE.InstancedMesh(blob, fmat, far.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  far.forEach((t, i) => { v.set(t.x, t.y - 0.3, t.z); s.set(t.h * 0.52, t.h, t.h * 0.52); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.tone * 6.283); blobs.setMatrixAt(i, m.compose(v, q, s)); tone[i] = t.tone; });
  blob.setAttribute('aTone', new THREE.InstancedBufferAttribute(tone, 1));
  blobs.instanceMatrix.needsUpdate = true; blobs.frustumCulled = false; blobs.name = 'hill-far-trees'; group.add(blobs);
  let tris = far.length * bi.length / 3 + (stand.triangles || 0);
  return { object: group, stand, triangles: tris,
    update(dt, time, u, camera) { stand.update(dt, time, camera); },
    dispose() { for (const g of [...full, ...lite, blob]) g.dispose(); fmat.dispose(); blobs.dispose(); } };
}
