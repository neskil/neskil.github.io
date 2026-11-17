// hill-of-round-doors, the homes: WHAT MOVES besides the green door and what the wind stirs. CHIMNEY SMOKE: one
// mesh of soft puffs that rise from every pot, bend with the land's wind and thin away (each pot's smoke is cut
// short of the flown line's clear air, measured at the building). HENS: one instanced mesh, every hen placed, each
// pecking in its own time by the clock. A puff is turned to face the eye in its shader, as any sprite is; nothing
// here asks where the lens is.
import { GLSL_FOG_PARS_VERT, GLSL_FOG_VERT, GLSL_FOG_PARS_FRAG } from '../kit/fx.js';
import { makeGeo, KIND, mul } from './hill-of-round-doors-homes-geo.js';

export const WIND = [0.94, 0.34];                             // the land's wind heading over the ground (x, z)
const RISE = 7, SINK = 1.2, DRIFT = 6, PUFFS = 7;
// a puff's place at a (0..1) of its whole way from the pot p (the shader goes the same way)
const track = (p, a, k) => [p[0] + WIND[0] * DRIFT * k * a * a, p[1] + RISE * a - SINK * a * a, p[2] + WIND[1] * DRIFT * k * a * a];

export function makeSmoke(THREE, look, pots, path, rng) {
  const pos = [], seed = [], corner = [], idx = [];
  let n = 0;
  for (const p of pots) {
    const phase = rng(), rate = 0.06 + 0.03 * rng(), wob = rng();
    // by its own place: where the wind would carry a plume within 12 m of the flown line it bends less (down to
    // straight up), and what would still come so near is cut short
    let bend = 1, reach = 0;
    for (const k of [1, 0.55, 0.25, 0]) {
      let far = 1;
      for (let a = 0.1; a < 1.05; a += 0.1) { const q = track(p, a, k); if (path.distanceTo(q[0], q[1], q[2]) < 12.35 + 1.5 * a) { far = a - 0.1; break; } }
      if (far > reach + 1e-6) { reach = far; bend = k; }
      if (far >= 1) break;
    }
    if (reach < 0.25) continue;
    for (let k = 0; k < PUFFS; k++) {
      for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(p[0], p[1], p[2]); seed.push((k + phase) / PUFFS, rate, reach, (wob + k * 0.37) % 1); corner.push(c[0], c[1], bend); }
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 4));
  geometry.setAttribute('corner', new THREE.Float32BufferAttribute(corner, 3));
  geometry.setIndex(idx);
  if (n) { geometry.computeBoundingSphere(); geometry.boundingSphere.radius += RISE + DRIFT + 3; }
  else geometry.boundingSphere = new THREE.Sphere();
  const tint = look.sunColor.clone().multiplyScalar(0.6).add(look.skyColor.clone().multiplyScalar(1.0)).multiplyScalar(1 - 0.5 * look.lit);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uWind: { value: new THREE.Vector2(WIND[0], WIND[1]) }, uCol: { value: tint } }]);
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 seed; attribute vec3 corner; uniform float uTime; uniform vec2 uWind; varying vec2 vC; varying float vA;
      ${GLSL_FOG_PARS_VERT}
      void main(){
        float age = fract(uTime * seed.y + seed.x), a = age * seed.z;
        float d = ${DRIFT.toFixed(1)} * corner.z * a * a;
        vec3 c = position + vec3(uWind.x * d, ${RISE.toFixed(1)} * a - ${SINK.toFixed(1)} * a * a, uWind.y * d);
        c.x += sin(uTime * .7 + seed.w * 40.) * .25 * a; c.z += cos(uTime * .6 + seed.w * 23.) * .25 * a;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.); mvPosition.xy += corner.xy * (.3 + 1.35 * a);
        gl_Position = projectionMatrix * mvPosition;
        vC = corner.xy; vA = smoothstep(0., .1, age) * (1. - smoothstep(.4, 1., age));
        ${GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; varying vec2 vC; varying float vA;
      ${GLSL_FOG_PARS_FRAG}
      void main(){
        float soft = 1. - smoothstep(.2, 1., length(vC));
        gl_FragColor = vec4(fxApplyFog(uCol * (.86 + .16 * vC.y)), soft * soft * vA * .4); }`,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.name = 'homes-smoke'; mesh.renderOrder = 2;
  return { mesh, uniforms, triangles: n / 2, dispose() { geometry.dispose(); material.dispose(); } };
}

// HENS. places: [x, y, z, yaw] in the world, each a place the garden kept free for a hen to peck forward about its
// own feet; material: the homes' one lit material. Returns null where no garden keeps hens.
export function makeHens(THREE, material, places, rng) {
  if (!places.length) return null;
  const G = makeGeo(THREE), body = [0.78, 0.74, 0.66], dark = mul(body, 0.6), red = [0.6, 0.04, 0.03], horn = [0.75, 0.45, 0.08];
  G.ball(0, 0.3, 0, 0.2, 8, 6, body, KIND.PAINT, 0, 0.8, 0.85, 1.25, dark);
  G.tube([0, 0.36, 0.14], [0, 0.5, 0.2], 0.085, 0.07, 6, body, KIND.PAINT);
  G.ball(0, 0.53, 0.21, 0.085, 7, 5, body, KIND.PAINT, 0, 1, 1, 1.1, dark);
  G.poly([[-0.03, 0.53, 0.29], [0.03, 0.53, 0.29], [0, 0.5, 0.38]], horn, KIND.PAINT, 0, { out: [0, 1, 0.3] });
  G.poly([[0, 0.6, 0.15], [0, 0.6, 0.28], [0, 0.68, 0.24], [0, 0.69, 0.17]], red, KIND.PAINT, 0, { out: [1, 0, 0] });
  G.poly([[0, 0.5, 0.27], [0, 0.44, 0.3], [0, 0.44, 0.24]], red, KIND.PAINT, 0, { out: [1, 0, 0] });
  for (const s of [-1, 1]) {
    G.poly([[s * 0.02, 0.36, -0.2], [s * 0.1, 0.3, -0.18], [s * 0.05, 0.58, -0.4], [0, 0.62, -0.36]], dark, KIND.PAINT, 0, { out: [s, 0.3, -0.3] });
    G.tube([s * 0.07, 0.16, 0], [s * 0.07, 0, 0.02], 0.016, 0.016, 4, horn, KIND.PAINT);
    G.poly([[s * 0.07 - 0.05, 0.005, 0.1], [s * 0.07 + 0.05, 0.005, 0.1], [s * 0.07, 0.005, -0.03]], horn, KIND.PAINT, 0, { out: [0, 1, 0] });
  }
  const geometry = G.build(), mesh = new THREE.InstancedMesh(geometry, material, places.length); mesh.name = 'homes-hens';
  const tints = [[1, 1, 1], [0.8, 0.42, 0.2], [0.45, 0.42, 0.4], [1, 0.9, 0.7]], dice = places.map(() => [rng(), rng(), rng()]);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), v = new THREE.Vector3(), s = new THREE.Vector3(1.8, 1.8, 1.8), c = new THREE.Color();
  places.forEach((p, i) => { const t = tints[Math.floor(dice[i][0] * tints.length)]; mesh.setColorAt(i, c.setRGB(t[0], t[1], t[2])); });
  // two quick pecks, then a while standing: each hen in its own time, by the world's clock
  const update = (time) => {
    for (let i = 0; i < places.length; i++) {
      const p = places[i], d = dice[i], cyc = (time / (3.2 + 2.6 * d[1]) + d[2]) % 1, peck = cyc < 0.3 ? Math.pow(Math.sin(cyc / 0.3 * Math.PI * 2), 2) : 0;
      e.set(0.7 * peck, p[3], 0); q.setFromEuler(e); m.compose(v.set(p[0], p[1], p[2]), q, s); mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0); mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 2;
  return { mesh, update, triangles: G.triangles * places.length, dispose() { geometry.dispose(); mesh.dispose(); } };
}
