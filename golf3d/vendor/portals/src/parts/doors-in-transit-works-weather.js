// doors-in-transit: THE LITTLE WEATHERS (the works builder's part). One door in twelve lets a little of what lies behind
// it out under its sill: a few snowflakes, a trickle of sand, blown leaves, a creep of mist, drips of rain, petals.
// Each fleck belongs to its door and rides with it: its place is the door's sill plus a small fall worked out from the
// clock alone, so a visit entered at any clock shows the same thing. Small soft eye-facing quads, one draw call.

// what each weather is: [colour, size, fall in metres, seconds of one fall, drift along the sill, flutter, opacity]
const KINDS = [
  null,
  { col: [1.0, 1.0, 1.0], size: 0.16, fall: 3.0, secs: 3.6, drift: 0.5, flutter: 0.35, a: 0.95 },      // snow
  { col: [0.93, 0.74, 0.42], size: 0.09, fall: 3.1, secs: 1.1, drift: 0.05, flutter: 0.03, a: 0.9 },     // sand
  { col: [0.62, 0.42, 0.14], size: 0.2, fall: 2.8, secs: 3.0, drift: 1.3, flutter: 0.6, a: 0.95 },       // leaves
  { col: [0.9, 0.93, 0.97], size: 1.5, fall: 1.2, secs: 6.5, drift: 0.9, flutter: 0.2, a: 0.16 },        // mist
  { col: [0.72, 0.84, 1.0], size: 0.08, fall: 3.1, secs: 0.85, drift: 0.0, flutter: 0.0, a: 0.9 },       // rain
  { col: [1.0, 0.68, 0.78], size: 0.15, fall: 2.9, secs: 4.2, drift: 1.0, flutter: 0.55, a: 0.95 },      // petals
];
const PER_DOOR = 12;
// EACH SILL'S FLECKS COME FROM THAT SILL'S OWN DEALT NUMBER (its wphase, dealt with its door): a fleck's four numbers
// are that number, times OWN, carried on fleck by fleck in the fixed steps STEP (the roots of 2, 3, 5 and 7 less
// their whole parts: a spread without clumps). No stream is drawn here, so a sill's weather is the same on every
// machine and whatever other sills the visit carries.
const OWN = [1, 7, 13, 29], STEP = [Math.SQRT2 - 1, Math.sqrt(3) - 1, Math.sqrt(5) - 2, Math.sqrt(7) - 2];
const frac = (v) => v - Math.floor(v);

// doors: the records of the works' doors that leak weather (each with weather 1..6, wphase, and x, y, z, tx, tz kept
// up to date by the works: the middle of its sill and the level heading of its rail). U: the works' own uniforms
// (uHeight: the drawing buffer's height in pixels, the one the slender iron is measured by)
export function makeWeather(THREE, doors, U) {
  const n = Math.max(1, doors.length * PER_DOOR);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(n * 4), aCol = new Float32Array(n * 4), seeds = new Float32Array(n * 4);
  doors.forEach((d, q) => { for (let i = 0; i < PER_DOOR; i++) for (let c = 0; c < 4; c++) seeds[(q * PER_DOOR + i) * 4 + c] = frac(d.wphase * OWN[c] + (i + 1) * STEP[c]); });
  const posAttr = new THREE.InstancedBufferAttribute(aPos, 4), colAttr = new THREE.InstancedBufferAttribute(aCol, 4);
  posAttr.setUsage(THREE.DynamicDrawUsage); colAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', posAttr); geo.setAttribute('aCol', colAttr);
  geo.instanceCount = doors.length * PER_DOOR;
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 0), 400);
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), { uHeight: U.uHeight }),
    vertexShader: /* glsl */`
      attribute vec4 aPos; attribute vec4 aCol; uniform float uHeight; varying vec2 vQ; varying vec4 vCol;
      #include <fog_pars_vertex>
      void main() {
        vQ = position.xy * 2.; vCol = aCol;
        vec4 mvPosition = modelViewMatrix * vec4(aPos.xyz, 1.);
        // a fleck narrower than a pixel and six tenths is drawn that wide and as much fainter: a filter by the
        // pixel's TRUE footprint at the fleck's own distance, measured as the works' slender iron is measured
        // (the same uniform, the same law: doors-in-transit-works-iron.js)
        float dist = max(0., -mvPosition.z), need = 1.6 * dist * 2. / (max(projectionMatrix[1][1], 0.05) * max(uHeight, 16.));
        float w = max(aPos.w, need);
        vCol.a *= clamp(aPos.w / w, 0., 1.) * clamp(aPos.w / w, 0., 1.);
        mvPosition.xy += position.xy * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec4 vCol;
      #include <fog_pars_fragment>
      void main() {
        float d = clamp(1. - dot(vQ, vQ), 0., 1.);
        float a = d * d * vCol.a;
        gl_FragColor = vec4(vCol.rgb, a);
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, fog: true,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  function update(time) {
    let j = 0;
    for (const d of doors) {
      const K = KINDS[d.weather];
      for (let i = 0; i < PER_DOOR; i++, j++) {
        const s0 = seeds[j * 4], s1 = seeds[j * 4 + 1], s2 = seeds[j * 4 + 2], s3 = seeds[j * 4 + 3];
        const t = frac(time / (K.secs * (0.8 + 0.4 * s1)) + s0 + d.wphase), along = (s2 - 0.5) * 3.0 + K.drift * t * (s3 - 0.3);
        const fl = K.flutter * Math.sin(time * (1.3 + s3) + s0 * 40) * t, out = (s3 - 0.5) * 0.5 + fl;
        aPos[j * 4] = d.x + d.tx * along - d.tz * out;
        aPos[j * 4 + 1] = d.y + 0.12 - K.fall * (K.secs < 1.5 ? t * t : t);
        aPos[j * 4 + 2] = d.z + d.tz * along + d.tx * out;
        aPos[j * 4 + 3] = K.size * (0.7 + 0.6 * s1);
        const a = Math.sin(Math.PI * Math.min(1, t * 1.02)) * K.a;
        aCol[j * 4] = K.col[0]; aCol[j * 4 + 1] = K.col[1]; aCol[j * 4 + 2] = K.col[2]; aCol[j * 4 + 3] = a;
      }
    }
    posAttr.needsUpdate = true; colAttr.needsUpdate = true;
  }
  return { object: mesh, update, count: doors.length * PER_DOOR, material: mat };
}
