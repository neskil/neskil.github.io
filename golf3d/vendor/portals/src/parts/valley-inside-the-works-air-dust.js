// valley-inside-the-works: THE DUST IN THE BARS OF LIGHT (the world builder's). A little warm dust drifting in the
// hall's air: bright where a bar of light crosses it, unseen in the shade between the bars (the plan's own law of
// the bars), thickest low over the meadow, thinner over the river and up under the roof.
// ONE ENDLESS FIELD FIXED IN THE HALL: a mote's place is its own place in a 46 x 28 x 46 m cell that repeats through
// the hall, plus a slow drift and a slow wander that go by the world's clock alone. Of that field only the piece
// round the eye is drawn (a level of detail by where the eye is), fading out toward the piece's faces so that nothing
// pops. Where the dust lies thick is the world's: by the mote's height over the valley floor and its distance from
// the river's edge (the plan's floorLevel, riverX and riverHalfWidth, sampled along the hall into a small table at
// build), and it KEEPS A MARGIN FROM THE FLOWN LINE: none within 3 m of the plan's ROUTE, all of it from 6 m
// (measured across the hall at the mote's own z), so that no mote ever swells in front of the lens. Besides that it
// thins toward the eye in a medium's own law, by true distance: none within 0.6 m, all of it from 2.5 m.
// One draw call, two triangles a mote. A mote smaller than a pixel is filtered by the pixel's footprint: it is drawn
// about a pixel across (the drawing buffer's height is read each frame) with its light spread over that pixel.
// The scene's fog is not laid over the motes: none is drawn further off than 36 m, where that fog is under a 500th.
import * as P from './valley-inside-the-works-plan.js';

const TABLE = 256;      // samples of the plan along the hall, from the downstream wall to the head wall

const VERT = /* glsl */`
attribute vec2 aCorner; attribute vec3 aSeed; attribute vec4 aKind;
uniform vec3 uBox, uDrift, uLightDir; uniform float uTime, uViewH, uAmount;
uniform sampler2D uPlan; uniform vec2 uPlanZ;
varying vec2 vC; varying float vA; varying float vWarm;
${P.LIGHT_BAR_GLSL}
// the plan's table at z: row 0.25 holds (floor level, the river's middle x, its half width), row 0.75 the flown
// line's (x, y) at that z; read between its two nearest samples
vec4 planAt(float z, float row) {
  float f = clamp((uPlanZ.x - z) * uPlanZ.y, 0.0, ${(TABLE - 2).toFixed(1)}), i = floor(f);
  return mix(texture2D(uPlan, vec2((i + 0.5) / ${TABLE.toFixed(1)}, row)), texture2D(uPlan, vec2((i + 1.5) / ${TABLE.toFixed(1)}, row)), f - i);
}
void main() {
  float ph = aKind.y;
  // the mote's place in the endless field, by the clock alone
  vec3 p = aSeed * uBox + uDrift * (uTime * aKind.z)
    + 0.9 * vec3(sin(uTime * 0.21 + ph * 6.283), 0.6 * sin(uTime * 0.17 + ph * 9.1), cos(uTime * 0.19 + ph * 4.7));
  // the copy of it nearest the eye, and the fade toward the faces of the piece that is drawn
  vec3 rel = mod(p - cameraPosition + 0.5 * uBox, uBox) - 0.5 * uBox;
  vec3 wp = cameraPosition + rel;
  float dist = length(rel);
  vec3 q = abs(rel) / uBox;
  float edge = (1.0 - smoothstep(0.36, 0.5, q.x)) * (1.0 - smoothstep(0.36, 0.5, q.y)) * (1.0 - smoothstep(0.36, 0.5, q.z));
  // a medium thins toward the eye by true distance
  float nearFade = smoothstep(0.6, 2.5, dist);
  // where it is thick: low over the meadow; thinner over the river and high under the roof; none under the floor;
  // and none near the flown line
  vec4 ground = planAt(wp.z, 0.25), way = planAt(wp.z, 0.75);
  float h = wp.y - ground.x;
  float bank = abs(wp.x - ground.y) - ground.z;
  float thick = mix(1.0, 0.3, smoothstep(5.0, 24.0, h)) * mix(0.4, 1.0, smoothstep(-2.0, 5.0, bank)) * step(0.2, h);
  thick *= smoothstep(3.0, 6.0, length(wp.xy - way.xy));
  // lit by the bar it hangs in; dust throws the light on forward, so it glitters when we look toward the light
  float bar = lightBar(wp);
  float cg = dot(rel / max(dist, 1e-3), uLightDir);
  float fwd = 0.35 + 1.7 * max(cg, 0.0) * max(cg, 0.0) * max(cg, 0.0);
  float twinkle = 0.62 + 0.38 * sin(uTime * (1.3 + 2.2 * ph) + ph * 40.0);
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  float depth = max(-mv.z, 0.05);
  // the footprint filter: never drawn under 0.62 of a pixel in radius; a smaller mote's light is spread over that
  float r = aKind.x, rMin = 0.62 * 2.0 * depth / (projectionMatrix[1][1] * max(uViewH, 1.0)), rr = max(r, rMin);
  vA = uAmount * bar * edge * nearFade * thick * fwd * twinkle * (r * r) / (rr * rr);
  vWarm = aKind.w;
  vC = aCorner;
  mv.xy += aCorner * rr;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */`
uniform vec3 uColor, uColor2;
varying vec2 vC; varying float vA; varying float vWarm;
void main() {
  float d = length(vC);
  float k = 1.0 - smoothstep(0.0, 1.0, d);
  float a = k * k * vA;
  gl_FragColor = vec4(mix(uColor, uColor2, vWarm) * a, 1.0);
}`;

// The plan along the hall, as a table the shader can read: for each of TABLE places from the downstream wall to the
// head wall, the valley floor's level, the river's middle and half width, and the flown line's x and y there (the
// plan's ROUTE, straight between its points; behind the entry and past the ring it keeps their heights).
function planTable(THREE) {
  const z0 = P.SHED.zDown, z1 = P.SHED.zHead, data = new Uint16Array(TABLE * 2 * 4), R = P.ROUTE, half = THREE.DataUtils.toHalfFloat;
  for (let i = 0; i < TABLE; i++) {
    const z = z0 + (z1 - z0) * i / (TABLE - 1);
    let k = 0;
    while (k + 2 < R.length && R[k + 1][2] > z) k++;
    const a = R[k], b = R[k + 1], t = Math.min(1, Math.max(0, (a[2] - z) / (a[2] - b[2])));
    data.set([half(P.floorLevel(z)), half(P.riverX(z)), half(P.riverHalfWidth(z)), 0], i * 4);
    data.set([half(a[0] + (b[0] - a[0]) * t), half(a[1] + (b[1] - a[1]) * t), 0, 0], (TABLE + i) * 4);
  }
  const tex = new THREE.DataTexture(data, TABLE, 2, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { tex, zed: new THREE.Vector2(z0, (TABLE - 1) / (z0 - z1)) };
}

export function makeDust(THREE, L, lightDir, rng, detail) {
  const count = Math.max(200, Math.round(2600 * detail));
  const seed = new Float32Array(count * 3), kind = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seed[i * 3] = rng(); seed[i * 3 + 1] = rng(); seed[i * 3 + 2] = rng();
    kind[i * 4] = 0.022 + 0.05 * rng() * rng(); kind[i * 4 + 1] = rng(); kind[i * 4 + 2] = 0.5 + rng(); kind[i * 4 + 3] = rng();
  }
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geometry.setAttribute('aCorner', new THREE.Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 3));
  geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 4));
  geometry.instanceCount = count;
  const sun = new THREE.Color(L.sun), plan = planTable(THREE);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uBox: { value: new THREE.Vector3(46, 28, 46) }, uDrift: { value: new THREE.Vector3(0.1, 0.045, 0.2) }, uLightDir: { value: lightDir },
      uTime: { value: 0 }, uViewH: { value: 720 }, uAmount: { value: L.motes }, uPlan: { value: plan.tex }, uPlanZ: { value: plan.zed },
      uColor: { value: sun.clone().lerp(new THREE.Color('#ffe2b0'), 0.4).multiplyScalar(2.4) }, uColor2: { value: sun.clone().lerp(new THREE.Color('#ffc46a'), 0.7).multiplyScalar(2.4) },
    },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, geometry, material, table: plan.tex };
}
