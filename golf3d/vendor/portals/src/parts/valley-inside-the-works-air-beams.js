// valley-inside-the-works: THE SHAFTS OF LIGHT IN THE AIR (the world builder's). Where the roof's bars of light
// come down through the hall's dusty air they are seen as slanting shafts of warm light, from each glazed tooth of
// the roof down to the floor along the sun's own direction.
// WHAT IS LIT. Along the hall the lit air is the plan's own bars (slabs across the hall, lit 12.2 m of every 20 m
// along z + 0.7009 y, with the plan's 1.2 m soft edges, and nothing beyond the right-hand wall's own shade), so a
// shaft stands where its bar lies on the grass, the brick and the chocolate. The plan gives that law as a shader
// function of one point; the shafts need its SUM along a line, so its numbers are written out again here and must
// follow the plan's if those change. Across the hall the shafts' own law cuts each bar into shafts (lit 6.4 m of
// every 9.33 m, three to the nave): that cut is OURS and is in the air only; the plan lays no such shade on the ground.
// HOW THEY ARE DRAWN: on thin SHEETS that stand fixed in the hall, each of which adds, at every pixel, the light
// scattered toward the eye by the lit air of ITS OWN LAYER on the straight line from the eye to that point: the last
// `depth` metres of air before the sheet, measured square to it (or the air from the eye, if the eye is nearer).
//   TEN SHEETS ACROSS THE NAVE, 40 m apart in the middle of a bay (so no column is cut by one), each with the 40 m
//   of air before it: together all the nave's air, in layers, so that whatever stands in the nave is veiled by the
//   shafts before it and hides those behind it. A nave sheet fades out toward its own edges (6 m in from either
//   side, above the ground, under the roof), so it meets nothing with a line.
//   ONE SHEET JUST INSIDE EACH WALL: the side walls with the last 26 m of air before them (the outer aisles), the
//   head wall with the last 40 m.
// AIR BY DISTANCE. The lit metres are summed exactly from the two laws, each stretch weighed by how much of its
// light still reaches the eye through uReach metres of the same dusty air, so near shafts stand clear and far ones
// sink. Toward the eye the air thins in a medium's own law, by true distance: none within 0.6 m, all of it from
// 2.5 m (a straight ramp, whose sum over even air is a clean start at 1.55 m; that is how it is counted). The
// scene's own haze is not laid over the shafts a second time.
// What reads the eye: where the eye is (the sum along the line of sight), and the direction of the look to the light
// (dust scatters forward: a sheen). Nothing is placed, sized or faded by the eye. One draw call, 186 triangles.
import * as P from './valley-inside-the-works-plan.js';

const VERT = /* glsl */`
attribute vec3 aLayer;
varying vec3 vWorld, vAxis, vLayer;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz; vAxis = normal; vLayer = aLayer;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */`
uniform vec3 uBeam, uLightDir; uniform float uDust, uReach;
varying vec3 vWorld, vAxis, vLayer;   // vAxis: the sheet's own direction; vLayer: its layer's depth, its strength, its fade
// A soft-edged strip that repeats: lit from 0 to on (rising and falling over e), dark to the period p. litTo: the
// lit metres between 0 and x; strip: the strip itself.
float ramp(float u, float e) { float t = clamp(u / e, 0.0, 1.0); return e * (t * t * t - 0.5 * t * t * t * t) + max(u - e, 0.0); }
float litTo(float x, float p, float on, float e) { float k = floor(x / p), m = x - k * p; return k * (on - e) + ramp(m, e) - ramp(m - (on - e), e); }
float strip(float x, float p, float on, float e) { float m = x - floor(x / p) * p; return smoothstep(0.0, e, m) - smoothstep(on - e, on, m); }
void main() {
  vec3 e = cameraPosition, d = vWorld - e;
  float len = length(d); d /= max(len, 1e-3);
  // this sheet's own layer of air: its last vLayer.x metres, square to the sheet; and the air's own thinning toward
  // the eye (0.6 to 2.5 m), summed
  float off = abs(dot(d, vAxis)) * len;
  float t0 = min(max(1.55, len * (1.0 - vLayer.x / max(off, 1e-3))), len), t1 = len;
  // the right-hand wall lays its own shade along its foot (the plan's law): a line that runs into it is lit no further
  float se = e.x + 0.578 * (52.0 - e.y), sd = d.x - 0.578 * d.y;
  if (sd > 1e-4) t1 = min(t1, max((78.5 - se) / sd, 0.0));
  float span = max(t1 - t0, 0.0);
  // ALONG THE HALL the light comes down in the plan's bars: w = z + 0.7009 y, lit 12.2 m of every 20.
  // ACROSS THE HALL the shafts' own law cuts each bar into shafts: s = where a ray of the sun crossed the roof's
  // valley level, lit 6.4 m of every 9.33 (three shafts to the nave). A shaft is where both are lit: a slanting
  // pillar of light.
  float w0 = e.z + 0.7009 * e.y - 16.45; w0 -= floor(w0 / 20.0) * 20.0;
  float dw = d.z + 0.7009 * d.y;
  float s0 = se - 15.47; s0 -= floor(s0 / 9.3333) * 9.3333;
  // The layer is taken in six stretches, short at its near end. In each: the lit share along the hall and the lit
  // share across it (both exact, from the strips' own laws), and how much of that light still reaches the eye
  // through the air between (uReach metres): the nearest shafts stand clear, far ones sink into the haze.
  float sum = 0.0, ta = t0;
  for (int i = 1; i <= 6; i++) {
    float fr = float(i) / 6.0, tb = t0 + span * fr * fr, seg = tb - ta;
    float wa = w0 + dw * ta, wb = w0 + dw * tb, sa = s0 + sd * ta, sb = s0 + sd * tb;
    float lw = abs(dw) * seg > 0.05 ? abs(litTo(wb, 20.0, 12.2, 1.2) - litTo(wa, 20.0, 12.2, 1.2)) / max(abs(dw) * seg, 1e-4) : strip(0.5 * (wa + wb), 20.0, 12.2, 1.2);
    float ls = abs(sd) * seg > 0.05 ? abs(litTo(sb, 9.3333, 6.4, 1.5) - litTo(sa, 9.3333, 6.4, 1.5)) / max(abs(sd) * seg, 1e-4) : strip(0.5 * (sa + sb), 9.3333, 6.4, 1.5);
    sum += seg * lw * ls * exp(-0.5 * (ta + tb) / uReach);
    ta = tb;
  }
  // dust scatters forward: the shafts are brightest looking toward the light (the Henyey-Greenstein phase law of
  // the literature with g = 0.55, written out: (1 - g g) / (1 + g g - 2 g cos)^1.5; a formula, not code brought in)
  float cg = clamp(dot(d, uLightDir), -1.0, 1.0);
  float phase = 0.6975 / pow(max(1.3025 - 1.1 * cg, 0.15), 1.5);
  float glow = 1.0 - exp(-sum * uDust * vLayer.y * min(phase, 3.2));
  gl_FragColor = vec4(uBeam * (glow * vLayer.z), 1.0);
}`;

// THE SHEETS (see the head). NAVE: the ten sheets' places along the hall, their half width and the metres over which
// one fades in from its sides, from the ground and from the roof's valley level; the strengths of the three kinds.
const NAVE = { first: 170, step: 40, count: 10, half: 16, soft: 6, lift: 0.5, strength: 1.6 };
const WALLS = { side: 26, sideStrength: 3, head: 40, headStrength: 2 };
function sheets(THREE) {
  const S = P.SHED, x0 = S.x0 + 0.7, x1 = S.x1 - 0.7, zh = S.zHead + 0.7, zd = S.zDown - 0.7, top = S.roofValley;
  const pos = [], nor = [], lay = [], idx = [];
  // a grid of points xs by ys in the plane given by at(x, y); fx, fy: the fade at each of its lines
  const grid = (xs, ys, fx, fy, at, axis, depth, strength) => {
    const first = pos.length / 3;
    for (let j = 0; j < ys.length; j++) for (let i = 0; i < xs.length; i++) { pos.push(...at(xs[i], ys[j])); nor.push(...axis); lay.push(depth, strength, fx[i] * fy[j]); }
    for (let j = 0; j + 1 < ys.length; j++) for (let i = 0; i + 1 < xs.length; i++) { const a = first + j * xs.length + i, b = a + xs.length; idx.push(a, a + 1, b + 1, a, b + 1, b); }
  };
  for (const x of [x1, x0]) grid([zd, zh], [-2, top], [1, 1], [1, 1], (z, y) => [x, y, z], [1, 0, 0], WALLS.side, WALLS.sideStrength);
  grid([x0, x1], [-2, top], [1, 1], [1, 1], (x, y) => [x, y, zh], [0, 0, 1], WALLS.head, WALLS.headStrength);
  for (let k = 0; k < NAVE.count; k++) {
    const z = NAVE.first - NAVE.step * k, h = NAVE.half;
    let ground = -1e9;
    for (let x = -h; x <= h; x += 2) ground = Math.max(ground, P.groundHeight(x, z));
    grid([-h, -h + NAVE.soft, h - NAVE.soft, h], [ground + NAVE.lift, ground + NAVE.lift + NAVE.soft, top - NAVE.soft, top], [0, 1, 1, 0], [0, 1, 1, 0],
      (x, y) => [x, y, z], [0, 0, 1], NAVE.step, NAVE.strength);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aLayer', new THREE.Float32BufferAttribute(lay, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

export function makeBeams(THREE, L, lightDir) {
  const geometry = sheets(THREE);
  const material = new THREE.ShaderMaterial({
    uniforms: { uBeam: { value: new THREE.Color(L.sun).multiplyScalar(L.beam) }, uLightDir: { value: lightDir }, uDust: { value: L.dust }, uReach: { value: 90 } },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;                 // before every other blended thing: whatever is nearer than a sheet is laid over it
  mesh.frustumCulled = false;
  return { mesh, geometry, material };
}
