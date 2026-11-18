// comet-over-the-lake-town, part RIDE: the brook that winds down the wooded ride under the terraces, and the mossy
// boulders. The brook is water, never a stair: still pools (mirrors by the paddies' law, made by the world), short runs, and thin falls drawn as wet
// dark rock with soft white threads sliding down it. Its whites show only near (they are filtered away by the
// pixel's footprint), so from the town and the lake it is a dark winding thread. All of it is made in build().
import * as THREE from 'three';

// (The world draws only this bed's boulders now: it frees the water sheets made here as soon as they are made.)
// a rounded, smooth-shaded boulder with moss gathered on its top (one form, instanced)
export function boulderGeometry() {
  const geo = new THREE.SphereGeometry(1, 9, 6), pos = geo.attributes.position, v = new THREE.Vector3(), col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 0.84 + 0.2 * Math.sin(v.x * 2.3 + v.y * 1.3) * Math.cos(v.z * 1.9 + v.x * 0.7) + 0.07 * Math.sin(v.y * 4.1 + v.z * 3.3);
    const m = Math.min(1, Math.max(0, (v.y - 0.05) / 0.5));
    pos.setXYZ(i, v.x * k, v.y * k * 0.72, v.z * k);
    col[i * 3] = 0.8 - 0.4 * m; col[i * 3 + 1] = 0.8 - 0.16 * m; col[i * 3 + 2] = 0.78 - 0.5 * m;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  return geo;
}
// stones: [x, y, z, r] each; one instanced mesh
export function placeStones(stones, name) {
  const mesh = new THREE.InstancedMesh(boulderGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), Math.max(1, stones.length));
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), v = new THREE.Vector3(), c = new THREE.Color();
  stones.forEach((t, i) => {
    e.set(0.25 * Math.sin(i * 1.7), i * 2.4, 0.25 * Math.cos(i * 2.9)); q.setFromEuler(e); v.set(t[0], t[1], t[2]); s.set(t[3] * (0.85 + 0.3 * ((i * 7) % 5) / 5), t[3] * 0.85, t[3]); mm.compose(v, q, s); mesh.setMatrixAt(i, mm);
    c.set(i % 3 === 0 ? '#8a8a72' : i % 3 === 1 ? '#94917c' : '#a09c8c').multiplyScalar(0.8 + 0.3 * ((i * 13) % 7) / 7); mesh.setColorAt(i, c);
  });
  mesh.count = stones.length; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.name = name; mesh.frustumCulled = false;
  return mesh;
}

export function makeBrook(path, heightAt, rng, fog, skyCol, o = {}) {
  const P = [], A = [], I = [], sparks = [], stones = [], v = new THREE.Vector3(), STEP = 1.5;
  const row = (x, z, y, hw, m, fall, calm) => { P.push(x - hw, y, z, x + hw, y, z); A.push(-1, m, fall, calm, 1, m, fall, calm); };
  let level = 0, pooling = false, run = 2, rows = 0, cur = [];
  // the still pools above the falls are sheets of their own too (the paddies' own attributes), so that the world can give them the paddies' mirror law
  const poolP = [], poolA = [], poolI = [], poolMid = [0, 0, 0, 0];
  const endPool = () => {
    if (cur.length > 1) { const i0 = poolP.length / 3, zl = cur[cur.length - 1][1];
      for (const [x, z, hw] of cur) { poolP.push(x - hw, level + 0.03, z, x + hw, level + 0.03, z); poolA.push(z - zl, z - zl); poolMid[0] += x; poolMid[1] += level; poolMid[2] += z; poolMid[3]++; }
      for (let i = 0; i < cur.length - 1; i++) { const a = i0 + i * 2; poolI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    cur = [];
  };
  for (let m = o.from; m < o.to; m += STEP) {
    const rise = rng.range(0.7, 2.4), next = rng.int(1, 5), hw = rng.range(1.2, 2.3), rs = [rng(), rng(), rng(), rng()];   // every draw before any test
    path.posAtDist(m, v);
    const x = v.x + 6 + 8 * Math.sin(m * 0.07 + 1.1) + 2.5 * Math.sin(m * 0.19), z = v.z, yg = heightAt(x, z);   // it winds across the ride
    if (yg > (o.top ?? 120.4)) break;
    if (pooling) { if (yg + 0.22 >= level) { pooling = false; endPool(); } else cur.push([x, z, hw]); row(x, z, Math.max(level, yg + 0.22), hw, m, 0, pooling ? 1 : 0.4); rows++; }
    else if (--run >= 0) { row(x, z, yg + 0.22, hw * 0.8, m, 0, 0); rows++; }
    else {                                                       // a thin fall: the water stands up by its rise, and a pool lies above it
      const hf = 0.4 + 0.5 * rs[0];
      row(x, z, yg + 0.22, hf, m, 1, 0); level = yg + 0.22 + rise; row(x, z - 0.3, level, hf, m, 1, 0.6); rows += 2; pooling = true; run = next; cur = [[x, z - 0.3, hf]];
      if (Math.abs(x - v.x) > 7) {                               // (no boulder where the brook passes within 7 m of the route's line)
        for (const sg of [-1, 1]) stones.push([x + sg * (hf + 0.9 + rs[sg > 0 ? 0 : 1]), yg + rise * 0.4, z + rs[2] - 0.5, 0.9 + rise * 0.6 * (0.7 + 0.6 * rs[sg > 0 ? 3 : 2])]);
        stones.push([x + (rs[0] - 0.5) * 1.6, yg + 0.15, z + 1.8 + rs[1], 0.5 + 0.5 * rs[3]]);
      }
    }
    for (const sx of [-9, -3, 4, 10]) sparks.push([x + sx, yg + 0.6, z]);
  }
  endPool();
  for (let i = 0; i < rows - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(poolP, 3)); pg.setAttribute('aBack', new THREE.Float32BufferAttribute(poolA, 1)); pg.setIndex(poolI);
  const pk = Math.max(1, poolMid[3]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  const uniforms = { uTime: { value: 0 }, uSky: { value: skyCol }, uDeep: { value: new THREE.Color('#0a161c') }, uFogColor: { value: fog.color }, uFogDensity: { value: fog.density } };
  const mat = new THREE.ShaderMaterial({ name: 'LakeTownBrook', uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aW; varying vec4 vA; varying vec3 vW; void main() { vA = aW; vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime, uFogDensity; uniform vec3 uSky, uDeep, uFogColor; varying vec4 vA; varying vec3 vW;
      void main() {
        float fall = clamp(vA.z, 0.0, 1.0), calm = clamp(vA.w, 0.0, 1.0);
        vec3 E = cameraPosition - vW; float dist = max(length(E), 1e-3);
        float fr = 1.0 - clamp(E.y/dist, 0.0, 1.0); fr = 0.26 + 0.74*fr*fr*fr;
        float near = 1.0 - smoothstep(0.02, 0.09, fwidth(vA.x));                    // the whites show only near
        float flow = vA.y*2.4 + uTime*2.6, rip = 0.5 + 0.5*sin(flow*1.7 + vA.x*3.0);
        vec3 pool = mix(uDeep, uSky*0.8, fr);                                        // a pool: dark, holding the sky
        vec3 run = mix(uDeep*1.3, uSky*0.55, 0.22 + 0.2*rip*near);
        vec3 col = mix(run, pool, calm);
        float th = 0.5 + 0.5*sin(vA.x*17.0 + 2.5*sin(vA.x*5.0 + vA.y));              // a fall: wet dark rock, soft white threads sliding down it
        float slide = 0.5 + 0.5*sin(vW.y*7.0 + uTime*8.0 + vA.x*11.0);
        float lum = 0.5 + 0.5*dot(uSky, vec3(0.3, 0.5, 0.2));
        vec3 fcol = mix(vec3(0.045, 0.055, 0.06), vec3(0.75, 0.82, 0.9)*lum, smoothstep(0.45, 0.9, th)*(0.55 + 0.45*slide)*near*0.85);
        col = mix(col, fcol, smoothstep(0.3, 0.9, fall));
        col = mix(col, vec3(0.7, 0.78, 0.85)*lum*0.8, near*0.35*(1.0 - calm)*(1.0 - fall)*rip*rip);   // a little foam where the run breaks
        col *= 0.72 + 0.28*(1.0 - smoothstep(0.6, 1.0, abs(vA.x)));
        float f = uFogDensity*dist;
        gl_FragColor = vec4(mix(col, uFogColor, 1.0 - exp(-f*f)), 1.0);
      }` });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'brook';
  // boulders: at the falls, and an odd number more lying about the ride (every draw before the tests; a bounded search)
  const extra = o.boulders ?? 41;
  for (let i = 0, n = 0; i < extra * 6 && n < extra; i++) {
    const m = rng.range(o.from - 12, o.to), side = rng.range(-30, 34), r = rng.range(0.6, 2.2), up = rng();
    path.posAtDist(m, v); const x = v.x + side, z = v.z, yg = heightAt(x, z);
    if (Math.abs(side) < 6 + r || yg > (o.top ?? 120.4) || yg < 58 || (o.keepOff && o.keepOff(x, z, r))) continue;   // (none within 6 m of the route's line)
    stones.push([x, yg + r * 0.15, z, r * (0.7 + 0.5 * up)]); n++;
  }
  return { mesh, rocks: placeStones(stones, 'ride boulders'), sparks, stones: stones.length, pools: pg, poolAt: { x: poolMid[0] / pk, y: poolMid[1] / pk, z: poolMid[2] / pk }, poolCount: poolI.length / 6, update(time) { uniforms.uTime.value = time; } };
}
