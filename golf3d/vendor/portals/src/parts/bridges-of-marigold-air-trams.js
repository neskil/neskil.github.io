// bridges-of-marigold, the air: THE CORDS AND THE TRAMS (design, section 3).
// THE CORDS: every line of the lines' deal (strings of lamps, flag lines, plain cables, the trams' cables) is drawn
// as a ribbon that faces the eye, never thinner than a pixel and a half; it sways as its lamps and flags do, and
// runs on INSET metres inside the plan's tower face at each end, so that a line is seen to be carried.
// THE TRAMS: three small lit cars, each hung by an iron arm under its own cable between two ring towers on the
// canyon's outer side, 28 m and more from the flown line (the lines' deal lays those cables first; they do not sway).
// A car keeps to the middle four fifths of its cable, so it never comes to a tower's face.
//   CAR 0 (the west side, towers 3 and 2) is the design's "tram gliding by at our own height": its place on its
//     cable goes by the route flown (o.westShare(u), which the world file gives by two places of the route), so
//     that it meets us on every visit.
//   CARS 1 AND 2 go to and fro by the world's clock, easing at each end.
import { HANG, FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';
import { linePoint, CAR_DROP } from './bridges-of-marigold-air-lines.js';

const CORD_VERT = /* glsl */`
${FOG_VERT_PARS}${HANG}
attribute vec3 aTan; attribute vec4 aHang; attribute vec2 aW; uniform float uTime, uPx;
void main(){
  vec3 c = mgHang(position, aHang, uTime), toEye = cameraPosition - c; float dist = max(length(toEye), 1e-3);
  vec3 s = cross(aTan, toEye/dist); s /= max(length(s), 1e-4);
  vec4 mvPosition = viewMatrix*vec4(c + s*(aW.x*max(aW.y, uPx*dist*0.75)), 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const CORD_FRAG = /* glsl */`
${FOG_FRAG_PARS}
uniform vec3 uCord; void main(){ gl_FragColor = vec4(fxApplyFog(uCord), 1.); }`;
const CAR_VERT = /* glsl */`
${FOG_VERT_PARS}
attribute vec4 aTint; varying vec4 vTint; varying vec3 vN;
void main(){ vTint = aTint; vN = normalize(mat3(modelMatrix)*normal); vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const CAR_FRAG = /* glsl */`
${FOG_FRAG_PARS}
uniform vec3 uSky, uWarm, uLamp; varying vec4 vTint; varying vec3 vN;
void main(){
  vec3 n = normalize(vN); float up = n.y*0.5 + 0.5;
  vec3 col = vTint.rgb*(mix(uWarm, uSky, up)*0.9 + 0.05) + uLamp*vTint.a;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;

function cordGeometry(THREE, lines) {
  const N = 16, pos = [], tan = [], hang = [], wd = [], idx = [];
  for (const l of lines) {
    const base = pos.length / 3, hw = l.kind === 'tram' ? 0.05 : l.kind === 'cable' ? 0.03 : 0.018;
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = linePoint(l, t), q0 = linePoint(l, Math.max(0, t - 0.02)), q1 = linePoint(l, Math.min(1, t + 0.02));
      const tx = q1[0] - q0[0], ty = q1[1] - q0[1], tz = q1[2] - q0[2], tl = Math.hypot(tx, ty, tz) || 1;
      for (const s of [-1, 1]) { pos.push(p[0], p[1], p[2]); tan.push(tx / tl, ty / tl, tz / tl); hang.push(l.px, l.pz, l.sway * 4 * t * (1 - t), l.phase); wd.push(s, hw); }
      if (i < N) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('aHang', new THREE.Float32BufferAttribute(hang, 4)); g.setAttribute('aW', new THREE.Float32BufferAttribute(wd, 2)); g.setIndex(idx);
  return g;
}
// One car, about its own middle: x along the cable, y up, z across. tint.a is how brightly a face glows.
function carGeometry(THREE, body) {
  const pos = [], nor = [], tint = [], idx = [];
  const box = (x0, x1, y0, y1, z0, z1, c, glow) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), b = pos.length / 3;
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]); tint.push(c[0], c[1], c[2], glow); }
    for (let i = 0; i < g.index.count; i++) idx.push(b + g.index.getX(i));
    g.dispose();
  };
  const cream = [0.62, 0.54, 0.4], iron = [0.05, 0.045, 0.06], pane = [0.9, 0.62, 0.3];
  box(-1.8, 1.8, -1.15, 0.75, -1.0, 1.0, body, 0); box(-1.95, 1.95, 0.75, 0.97, -1.15, 1.15, cream, 0);
  for (const z of [-1.02, 0.98]) box(-1.5, 1.5, -0.15, 0.6, z, z + 0.04, pane, 1.0);
  for (const z of [-1.05, 1.0]) for (const x of [-0.75, 0, 0.75]) box(x - 0.05, x + 0.05, -0.2, 0.65, z, z + 0.05, body, 0);
  for (const x of [-1.83, 1.79]) box(x, x + 0.04, -0.15, 0.6, -0.7, 0.7, pane, 1.0);
  box(-0.08, 0.08, 0.97, CAR_DROP - 0.1, -0.08, 0.08, iron, 0); box(-0.6, 0.6, CAR_DROP - 0.16, CAR_DROP + 0.14, -0.18, 0.18, iron, 0);
  for (const x of [-1.9, 1.78]) box(x, x + 0.12, -1.0, -0.78, -0.12, 0.12, pane, 2.2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 4)); g.setIndex(idx); g.computeBoundingSphere();
  return g;
}

export async function buildTrams(ctx, o) {
  const { THREE, U, H, lines, westShare } = o, group = new THREE.Group(), made = [];
  const cg = cordGeometry(THREE, lines); made.push(cg);
  const cm = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: CORD_VERT, fragmentShader: CORD_FRAG,
    uniforms: { ...fogUniforms(), uTime: U.uTime, uPx: U.uPx, uCord: { value: new THREE.Color('#2a2036') } } });
  made.push(cm);
  const cords = new THREE.Mesh(cg, cm); cords.frustumCulled = false; group.add(cords);
  await ctx.yield();
  const carMat = new THREE.ShaderMaterial({ fog: true, vertexShader: CAR_VERT, fragmentShader: CAR_FRAG,
    uniforms: { ...fogUniforms(), uSky: { value: new THREE.Color(H.fillSky).multiplyScalar(0.55) }, uWarm: { value: new THREE.Color('#ff9a4a').multiplyScalar(0.5) }, uLamp: { value: new THREE.Color('#ffb060').multiplyScalar(2.4) } } });
  made.push(carMat);
  const bodies = [[0.05, 0.42, 0.4], [0.62, 0.09, 0.05], [0.6, 0.38, 0.04]];      // teal, vermilion, ochre
  const cables = lines.filter((l) => l.kind === 'tram'), cars = [];
  cables.forEach((l, i) => {
    const g = carGeometry(THREE, bodies[i % 3]); made.push(g);
    const m = new THREE.Mesh(g, carMat); m.rotation.y = Math.atan2(-(l.b[2] - l.a[2]), l.b[0] - l.a[0]); group.add(m);
    cars.push({ l, m, period: 2 * 0.8 * l.len / 2.1, phase: i * 2.4 });
  });
  // where car i is on its cable (a share of the span) at this clock and this share of the route flown
  const shareOf = (i, time, u) => (i === 0 ? westShare(u) : 0.5 - 0.4 * Math.cos(6.2832 * time / cars[i].period + cars[i].phase));
  const carAt = (i, time, u, out) => { const p = linePoint(cars[i].l, shareOf(i, time, u)); return out.set(p[0], p[1] - CAR_DROP, p[2]); };
  return {
    object: group, triangles: cg.index.count / 3 + cars.length * 192, drawCalls: 1 + cars.length, carAt, cables,
    update(dt, time, camera, u) { for (let i = 0; i < cars.length; i++) carAt(i, time, u, cars[i].m.position); },
    dispose() { for (const x of made) x.dispose(); },
  };
}
