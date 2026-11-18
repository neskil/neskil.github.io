// bridges-of-marigold, the air: THE FAR HILLS (design, section 3): far off all round, a low rim of dark hills with
// scattered points of candle light. One ring of hill wall HILLS_RADIUS metres out, its crest dealt by its own noise, the dark
// of it only a little under the haze it stands in; and on its face some hundreds of candle points gathered in
// hamlets, each a point of light with a halo that never falls under three pixels, twinkling by the world's clock.
import { FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';
import { sparkMaterial, sparkMesh } from './bridges-of-marigold-air-lamps.js';

const VERT = /* glsl */`
${FOG_VERT_PARS}
varying float vH;
void main(){ vH = uv.y; vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const FRAG = /* glsl */`
${FOG_FRAG_PARS}
uniform vec3 uHill; varying float vH;
void main(){ vec3 col = uHill*(0.55 + 0.45*vH); gl_FragColor = vec4(mix(col, fxApplyFog(col), 0.86), 1.); }`;

export const HILLS_RADIUS = 1150;       // metres from the great tower's axis to the hills' foot

export async function buildHills(ctx, o) {
  const { THREE, look, U, H, noise, rngCandles } = o, group = new THREE.Group(), RAD = HILLS_RADIUS, N = 120;
  const crest = (a) => 70 + 62 * noise.n2(Math.cos(a) * 2.1 + 5, Math.sin(a) * 2.1) + 26 * noise.n2(Math.cos(a) * 6.3, Math.sin(a) * 6.3 + 9);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), h = Math.max(24, crest(a));
    pos.push(c * RAD, -6, s * RAD, c * (RAD + 60), h, s * (RAD + 60)); uv.push(0, 0, 0, 1);
    if (i < N) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: VERT, fragmentShader: FRAG, uniforms: { ...fogUniforms(), uHill: { value: new THREE.Color(H.zenith).multiplyScalar(0.7) } } });
  const hills = new THREE.Mesh(g, m); hills.frustumCulled = false; group.add(hills);
  await ctx.yield();
  // ---- the candle points: hamlets on the hills' face
  const P = [], HG = [], C = [], hamlets = Math.round(34 * look.density), warm = [new THREE.Color('#ffb25a'), new THREE.Color('#ff8e3c'), new THREE.Color('#ffd28a')];
  for (let k = 0; k < hamlets; k++) {
    const a0 = rngCandles() * Math.PI * 2, up0 = rngCandles.range(0.12, 0.7), n = 6 + Math.floor(rngCandles() * 16);
    for (let i = 0; i < n; i++) {
      const a = a0 + (rngCandles() - 0.5) * 0.09, up = Math.min(0.9, Math.max(0.04, up0 + (rngCandles() - 0.5) * 0.3)), sz = rngCandles.range(4.5, 8), tw = rngCandles(), col = warm[Math.floor(rngCandles() * 3)];
      const h = Math.max(24, crest(a)), r = RAD + 60 * up - 3;
      P.push(Math.cos(a) * r, -6 + (h + 6) * up + 1.5, Math.sin(a) * r, sz); HG.push(0, 0, 0, 0); C.push(col.r, col.g, col.b, tw);
    }
  }
  const cm = sparkMaterial(THREE, U, { drop: 0, core: 2.6, halo: 0.4 }), set = sparkMesh(THREE, cm, P, HG, C);
  group.add(set.mesh);
  return { object: group, triangles: idx.length / 3 + set.count * 2, drawCalls: 2, candles: set.count, update() {}, dispose() { g.dispose(); m.dispose(); set.dispose(); cm.dispose(); } };
}
