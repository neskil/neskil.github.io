// bridges-of-marigold, the air: THE SHED PETALS. Each bridge crumbles at its ragged edges into streams of petals
// that drift down and away (design, sections 3 and 6). A stream leaves one place of an edge; its petals follow one
// another out from the bridge and down on the same slow wind, tumbling and spreading as they fall, and are gone
// before they reach the water (they fade through the mist's top). Each petal's course is a loop of the world's
// clock with its own phase, so a stream is full at any clock.
// A MEDIUM: the streams off the canyon bridge fall through the flown line; every petal thins by its true distance
// from the eye (whole at 2.5 m, gone at 0.6 m). Every petal is dealt under half a metre long (0.3 to 0.48 m), so
// that the whole stream is a medium. A far petal is never drawn smaller than two pixels.
import { PETAL, FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';
import { MIST } from './bridges-of-marigold-plan.js';

//   aS (x, y, z of the place it leaves the edge, seed)   aV (metres a second x, y, z; seconds of its course)
//   aT (phase 0..1, length, tumble in radians a second, how wide it wanders)
const VERT = /* glsl */`
${FOG_VERT_PARS}
attribute vec4 aS, aV, aT; uniform float uTime, uPx, uMistY, uGain; varying vec2 vQ; varying float vHue, vShade;
void main(){
  float t = fract(uTime/aV.w + aT.x)*aV.w, life = t/aV.w, sd = aS.w;
  vec3 c = aS.xyz + aV.xyz*t;
  float sw = (0.35 + 0.07*t)*aT.w;
  c.x += sw*sin(t*0.63 + sd*31.); c.z += sw*cos(t*0.51 + sd*17.); c.y += 0.3*sin(t*1.3 + sd*5.);
  float dist = max(length(c - cameraPosition), 1e-3);
  float keep = smoothstep(0., 0.04, life)*(1. - smoothstep(0.8, 1., life))*smoothstep(uMistY - 7., uMistY + 3., c.y)*smoothstep(0.6, 2.5, dist);
  float yaw = sd*50. + t*aT.z, pit = sd*13. + t*aT.z*0.83, rol = 0.7*sin(t*aT.z*1.3 + sd*9.);
  vec3 Y = vec3(cos(yaw), 0., sin(yaw)), X = vec3(-Y.z, 0., Y.x), N = vec3(0., 1., 0.);
  vec3 Yp = Y*cos(pit) + N*sin(pit), Np = N*cos(pit) - Y*sin(pit), Xp = X*cos(rol) + Np*sin(rol);
  float len = max(aT.y, uPx*dist*2.6)*keep;
  vec3 w = c + Xp*(position.x*len*0.66) + Yp*((position.y - 0.5)*len);
  vQ = vec2(position.x*2., position.y); vHue = fract(sd*7.77);
  vShade = (0.62 + 0.4*fract(sd*3.3))*(1. - 0.45*life)*uGain;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const FRAG = /* glsl */`
${PETAL}${FOG_FRAG_PARS}
varying vec2 vQ; varying float vHue, vShade;
void main(){
  float s = mgPetal(vQ);
  vec3 col = mgPetalHue(vHue)*(1.3 - 0.45*smoothstep(0., 0.22, s))*(0.82 + 0.3*vQ.y)*vShade;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
  if(s < 0.) discard;
}`;

export async function buildShed(ctx, o) {
  const { THREE, look, U, rng, bridges, shapes } = o;
  const S = [], V = [], T = [];
  const wind = [0.45, 0, 0.3];
  for (let k = 0; k < bridges.length; k++) {
    const b = bridges[k], sh = shapes[k], per = Math.max(8, Math.round((b.under ? 96 : 26) * Math.min(1, 0.35 + 0.65 * look.detail)));
    for (const side of [-1, 1]) {
      let a = -b.pre + 2;
      while (a < b.L + b.post - 2) {
        const step = rng.range(4.5, 8.5), out = rng.range(0.55, 1.5), fall = rng.range(1.0, 2.0), wide = rng.range(0.6, 1.5);
        const c = side * sh.half(a) * 1.04, y = sh.top(a, c) - 0.2;
        const above = y > MIST + 4;                                   // an edge already down in the mist sheds nothing
        for (let i = 0; i < per; i++) {
          const da = rng.range(-1.4, 1.4), ph = rng(), len = rng.range(0.3, 0.48), spin = rng.range(0.7, 2.3), life = rng.range(26, 42), sd = rng(), jo = rng.range(0.75, 1.3), jf = rng.range(0.8, 1.25);
          if (!above) continue;
          const p = sh.point(a + da, c, y);
          S.push(p[0], p[1], p[2], sd);
          V.push(-b.dz * side * out * jo + wind[0], -fall * jf, b.dx * side * out * jo + wind[2], life);
          T.push(ph, len, spin, wide);
        }
        a += step;
      }
    }
    await ctx.yield();
  }
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(S), 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(V), 4));
  g.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(T), 4));
  const n = S.length / 4; g.instanceCount = n;
  const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { ...fogUniforms(), uTime: U.uTime, uPx: U.uPx, uMistY: { value: MIST }, uGain: { value: 0.95 } } });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return { object: mesh, triangles: n * 2, drawCalls: 1, count: n, update() {}, dispose() { quad.dispose(); g.dispose(); m.dispose(); } };
}
