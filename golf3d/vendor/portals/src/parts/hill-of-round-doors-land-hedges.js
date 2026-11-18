// hill-of-round-doors, the land builder's part: THE HEDGES AND THE DRYSTONE WALLS of the fields, one mesh and one
// draw call. Each run laid out by land-fields.js becomes a ribbon over the ground: a hedge is a rounded bank of
// leaves two to three metres high and about two wide (round-shouldered, one shrub after another in its own green,
// paler new growth on top, dark in its gaps, a ragged fringe of leaves at its foot),
// a wall a narrow course of dry stone a metre and a half high; both taper down at a run's ends. They are lit by the
// land's own law and by the baked shade at their feet. They stand still (a hedge's leaves only shimmer in the gust).
import { LAND_NOISE, LAND_PARS, LAND_STONE } from './hill-of-round-doors-land-glsl.js';

// o: { THREE, runs, uniforms, look }
export function makeHedges(ctx, o) {
  const { THREE, runs, uniforms, look } = o, pos = [], kind = [], uv = [], idx = [];
  for (const run of runs) {
    const P = run.pts, n = P.length; if (n < 2) continue;
    const base = pos.length / 3, per = run.wall ? 4 : 7; let s = 0;
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, tx = (b.x - a.x) / l, tz = (b.z - a.z) / l, nx = -tz, nz = tx;
      if (i > 0) s += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
      const end = i === 0 || i === n - 1 ? 0.45 : 1, h = P[i].h * end, w = P[i].w * (0.6 + 0.4 * end) * 0.5, x = P[i].x, y = P[i].y, z = P[i].z;
      // (a wall's section is a course of stone; a hedge's a round-shouldered arch that swells over its foot)
      const sec = run.wall ? [[-w, -0.25], [-w * 0.8, h], [w * 0.8, h], [w, -0.25]] : [[-w, -0.3], [-w * 1.06, h * 0.36], [-w * 0.76, h * 0.8], [0, h], [w * 0.76, h * 0.8], [w * 1.06, h * 0.36], [w, -0.3]];
      for (const [off, up] of sec) { pos.push(x + nx * off, y + up, z + nz * off); kind.push(run.wall ? 1 : 0); uv.push(s, Math.max(0, up) / Math.max(0.1, P[i].h)); }
      if (i < n - 1) for (let j = 0; j < per - 1; j++) { const q = base + i * per + j; idx.push(q, q + 1, q + per, q + 1, q + per + 1, q + per); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); geo.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({ name: 'hill-hedge', side: THREE.DoubleSide,
    uniforms: { ...uniforms, uStone: { value: look.stone.clone() }, uEarth: { value: look.earth.clone() } },
    vertexShader: /* glsl */`
attribute float aKind; varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vKind, vDepth;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vUv = uv; vKind = aKind;
  vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: LAND_NOISE + LAND_PARS + LAND_STONE + /* glsl */`
uniform vec3 uStone, uEarth;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vKind, vDepth;
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float px = max(length(dFdx(vW)), length(dFdy(vW))), fine = 1. - smoothstep(.05, .5, px);
  vec3 sh = landShade(vW.xz); sh.r *= landCloud(vW.xz);
  vec3 F = cross(dFdx(vW), dFdy(vW)); F /= max(length(F), 1e-7); if (dot(F, V) < 0.) F = -F;      // the face's own normal
  vec3 c;
  if (vKind > .5) {
    // a wall: its faces are flat (the face's own normal), its stones grey with ochre lichen, dark in the joints
    N = normalize(mix(N, F, .8) + vec3(0., 1e-4, 0.));
    vec2 st = stoneFace(vec2(vUv.x, vW.y), px);
    vec3 alb = uStone * (.62 + .55 * st.y) * mix(vec3(1.), vec3(1.12, 1.04, .78), smoothstep(.62, .9, st.y));
    alb = mix(uEarth * vec3(.16, .17, .12), alb, mix(.82, st.x, fine));
    alb = mix(alb, uTurf * vec3(.8, .9, .6), smoothstep(.55, .9, vnoise(vec2(vUv.x * .6, vW.y * 1.3) + 7.)) * .3 * smoothstep(.75, 1., vUv.y + .2));
    c = landLight(alb, N, sh.r, sh.g * (.55 + .45 * vUv.y));
  } else {
    // a hedge: clumps of leaves, lighter where they catch the light on top, dark in the gaps between its shrubs
    vec3 q = vW * vec3(1., 1.35, 1.);
    float n1 = vnoise(q.xz * .55 + q.y * .9), n2 = vnoise((q.xy + q.zx) * 2.3 + 3.), n3 = vnoise((q.xy + q.zy) * 7.5 + 9.);
    float leaf = n1 * .5 + n2 * .32 + n3 * .18 * fine;
    vec3 alb = uTurf * mix(vec3(.3, .46, .3), vec3(.62, .78, .4), smoothstep(.3, .75, leaf + (vUv.y - .5) * .35));      // (a deeper green than the meadow's)
    // (one shrub after another along the row: thorn in a yellower green, holly darker and bluer)
    alb *= mix(vec3(.74, .9, .9), vec3(1.2, 1.08, .74), smoothstep(.25, .75, vnoise(vec2(vUv.x * .21, 3.7))));
    alb *= mix(.4, 1., smoothstep(.2, .45, leaf + vUv.y * .25));
    N = normalize(N + (vec3(n2, n1, n3) - .5) * .9 * (.4 + .6 * fine));
    float gust = landGust(vW.xz);
    c = landLight(alb, N, sh.r, sh.g * (.45 + .55 * vUv.y)) * (1. + (gust - .45) * .12);
    float back = max(dot(-V, uSunDir), 0.);
    c += alb * uSunCol * (.3183 * sh.r * back * back * .22) * vec3(1.1, 1., .5) + landSheen(N, V, sh.g) * .5;
  }
  c += (vKind > .5 ? uStone : uTurf) * uLampCol * (sh.b * max(uLit * 2. - 1., 0.));      // lamplight, as on the turf: at night only
  gl_FragColor = vec4(landFog(c, vDepth, 0.), 1.);
  // a hedge's foot is a fringe of leaves, hanging lower here and higher there, with the grass seen under it
  if (vKind < .5 && vUv.y < .04 + .2 * vnoise(vec2(vUv.x * 2.9, 5.3)) * vnoise(vec2(vUv.x * 9.1, 1.7))) discard;
}` });
  const mesh = new THREE.Mesh(geo, material); mesh.name = 'hill-hedges';
  return { object: mesh, triangles: idx.length / 3, dispose() { geo.dispose(); material.dispose(); } };
}
