// bridges-of-marigold, the air: THE LINES OF CUT-PAPER FLAGS (design, sections 2 and 3). Small oblongs of
// coloured tissue paper hung edge to edge along a sagging line by the hundred; each hangs from its top edge and
// flutters about it by the world's clock, and goes with its line's sway.
// WHAT IS CUT IN THE PAPER (the owner's list): a scalloped lower edge, a row of round holes under the top edge and
// one over the scallops, and in the middle ONE of three cuts: a flower (eight petals round a small middle), a sun
// (a disc and twelve rays) or leaves (three pairs on no stem). Nothing else is cut: no figure, no skull, no face,
// no letter, no numeral. Far off, where a pixel covers more than the cuts, the paper is drawn whole.
import { HANG, FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';
import { linePoint } from './bridges-of-marigold-air-lines.js';

//   aP (the top edge's middle at rest; width)   aHang (the line's sway)   aF (the line's heading x, z; phase; which cut)
//   aC (the paper's colour; how brightly the lamps near it light it)
const VERT = /* glsl */`
${FOG_VERT_PARS}${HANG}
attribute vec4 aP, aHang, aF, aC; uniform float uTime; varying vec2 vQ; varying vec4 vC; varying float vCut;
void main(){
  vec3 top = mgHang(aP.xyz, aHang, uTime);
  vec3 D = vec3(aF.x, 0., aF.y), Nn = vec3(-aF.y, 0., aF.x);
  float th = 0.08 + 0.36*(0.5 + 0.5*sin(uTime*1.9 + aF.z)) + 0.13*sin(uTime*4.3 + aF.z*1.7);
  float yy = 0.5 - position.y, w = aP.w;
  vec3 pos = top + D*(position.x*w) + (vec3(0., -cos(th), 0.) + Nn*sin(th))*(yy*w*1.3);
  vQ = vec2(position.x, yy*1.3); vCut = aF.w; vC = vec4(aC.rgb*aC.w*(0.8 + 0.25*cos(th*2.2)), 1.);
  vec4 mvPosition = viewMatrix*vec4(pos, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const FRAG = /* glsl */`
${FOG_FRAG_PARS}
varying vec2 vQ; varying vec4 vC; varying float vCut;
void main(){
  vec2 m = vQ; vec2 fwv = fwidth(m); float fine = 1. - smoothstep(0.035, 0.09, max(fwv.x, fwv.y));
  float scallop = 1.21 - 0.09*abs(sin(m.x*15.708));
  float hole = 0.;
  float hx = (fract(m.x/0.143 + 0.5) - 0.5)*0.143;
  hole = max(hole, step(length(vec2(hx, m.y - 0.13)), 0.036));
  hole = max(hole, step(length(vec2(hx, m.y - 1.03)), 0.036));
  vec2 d = m - vec2(0., 0.58); float rr = length(d), ang = rr > 1e-4 ? atan(d.y, d.x) : 0.;
  if(vCut < 0.34){ float pet = abs(cos(ang*4.)); hole = max(hole, max(step(rr, 0.05), step(0.11, rr)*step(rr, 0.15 + 0.2*pet)*step(0.3, pet))); }
  else if(vCut < 0.67){ hole = max(hole, max(step(rr, 0.13), step(0.19, rr)*step(rr, 0.37)*step(0.5 + (rr - 0.19)*2.4, abs(sin(ang*6.))))); }
  else {
    for(int i = 0; i < 3; i++) for(int s = 0; s < 2; s++){
      float sg = s == 0 ? -1. : 1.; vec2 v = d - vec2(sg*0.17, -0.2 + 0.2*float(i));
      float cs = cos(0.6*sg), sn = sin(0.6*sg); vec2 r = vec2(cs*v.x - sn*v.y, sn*v.x + cs*v.y)/vec2(0.15, 0.055);
      hole = max(hole, step(dot(r, r), 1.));
    }
  }
  gl_FragColor = vec4(fxApplyFog(vC.rgb), 1.);
  if(m.y > scallop || hole*fine > 0.5) discard;
}`;

export async function buildFlags(ctx, o) {
  const { THREE, look, U, rng, lines } = o;
  const papers = ['#ff2f92', '#12c8c0', '#ffc81e', '#9be024', '#8a4cff', '#ff4a24', '#f4efe6', '#ff8a1e'].map((h) => new THREE.Color(h));
  const P = [], H = [], F = [], C = [];
  const pitch = 1.08 / Math.min(1, 0.6 + 0.4 * look.detail);           // metres from flag to flag (the visit's density deals the count of lines)
  let done = 0;
  for (const l of lines) {
    if (l.kind !== 'flags') continue;
    const first = Math.floor(rng() * 8), stride = 1 + Math.floor(rng() * 3), n = Math.max(4, Math.round(l.len * (l.t1 - l.t0) / pitch));
    const hx = (l.b[0] - l.a[0]), hz = (l.b[2] - l.a[2]), hl = Math.hypot(hx, hz) || 1;
    for (let i = 0; i < n; i++) {
      const t = l.t0 + (l.t1 - l.t0) * (i + 0.5) / n, p = linePoint(l, t), ph = rng() * 6.2832, cut = rng(), w = 0.66 + 0.2 * rng(), lit = 0.5 + 0.3 * rng();
      const col = papers[(first + i * stride) % 8];
      P.push(p[0], p[1] - 0.02, p[2], w); H.push(l.px, l.pz, l.sway * 4 * t * (1 - t), l.phase); F.push(hx / hl, hz / hl, ph, cut); C.push(col.r, col.g, col.b, lit);
    }
    if (++done % 10 === 0) await ctx.yield();
  }
  const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  for (const [name, arr] of [['aP', P], ['aHang', H], ['aF', F], ['aC', C]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), 4));
  const n = P.length / 4; g.instanceCount = n;
  const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: VERT, fragmentShader: FRAG, uniforms: { ...fogUniforms(), uTime: U.uTime } });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return { object: mesh, triangles: n * 2, drawCalls: 1, count: n, update() {}, dispose() { quad.dispose(); g.dispose(); m.dispose(); } };
}
