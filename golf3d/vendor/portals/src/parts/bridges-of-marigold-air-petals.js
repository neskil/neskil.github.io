// bridges-of-marigold, the air: THE PETALS ADRIFT. Marigold petals ride the night air about the bridges: they lift
// off the beds and go with a slow wind toward the south, rising a little, tumbling.
// A MEDIUM, passed through. Every petal has its own place in an endless lattice that drifts with the wind (a box of
// 84 x 52 x 84 m repeated through the whole air); the copy of each petal nearest the eye is the one drawn, and a
// petal shrinks away toward the box's faces, so none appears or goes in view. Where they are is the world's doing:
// they are thick within some tens of metres of a bridge's bed (the plan's three lines) and few far from one.
// They thin by true distance near the lens: whole at 2.5 m, gone at 0.6 m.
// And one stream of them runs along the high bridge to the ring (see STREAM_VERT).
import { PETAL, PLACE, FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';
import { HIGH_BRIDGE, EXIT } from './bridges-of-marigold-plan.js';

//   aB (the petal's place in the box, 0..1 each way; seed)   aC (length, tumble in radians a second, rank, sway)
const VERT = /* glsl */`
${FOG_VERT_PARS}${PLACE}
attribute vec4 aB, aC; uniform float uTime, uGain; uniform vec3 uBox, uEye, uWind; varying vec2 vQ; varying float vHue, vShade;
void main(){
  float sd = aB.w;
  vec3 p = aB.xyz*uBox + uWind*uTime;
  p.x += aC.w*sin(uTime*0.31 + sd*40.); p.y += 0.6*aC.w*sin(uTime*0.47 + sd*23.); p.z += aC.w*cos(uTime*0.27 + sd*11.);
  vec3 rel = mod(p - uEye + 0.5*uBox, uBox) - 0.5*uBox, c = uEye + rel;
  vec3 edge = smoothstep(vec3(0.5), vec3(0.38), abs(rel)/uBox);
  // how near a bridge's bed this place is (the nearest of the three)
  float near = 0.;
  for(int k = 0; k < 3; k++){ vec3 g = mgBridge(k, c.xz); float d = length(vec2(max(g.x - g.z, 0.), c.y - g.y)); near = max(near, exp(-d/34.)); }
  float share = 0.16 + 0.84*near;
  float keep = clamp((share - aC.z)/0.12, 0., 1.)*edge.x*edge.y*edge.z*smoothstep(0.6, 2.5, length(rel));
  float t = uTime*aC.y, yaw = sd*50. + t, pit = sd*13. + t*0.8, rol = 0.7*sin(t*1.3 + sd*9.);
  vec3 Y = vec3(cos(yaw), 0., sin(yaw)), X = vec3(-Y.z, 0., Y.x), N = vec3(0., 1., 0.);
  vec3 Yp = Y*cos(pit) + N*sin(pit), Np = N*cos(pit) - Y*sin(pit), Xp = X*cos(rol) + Np*sin(rol);
  float len = aC.x*keep;
  vec3 w = c + Xp*(position.x*len*0.66) + Yp*((position.y - 0.5)*len);
  vQ = vec2(position.x*2., position.y); vHue = fract(sd*7.77);
  vShade = (0.5 + 0.5*near)*(0.7 + 0.45*fract(sd*3.3))*uGain;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
// THE STREAM TO THE RING: over the high bridge's first stretch the wind gathers the petals into one stream, which
// runs from the bridge's root on tower 7's roof, low over the bed, to the ring on the bridge's crown and through it.
//   aB (metres across from the bridge's middle; metres over the bed; where along the stream it starts, 0..1; seed)
//   aC (length; tumble in radians a second; metres a second along the stream; sway in metres)
const STREAM_VERT = /* glsl */`
${FOG_VERT_PARS}${PLACE}
attribute vec4 aB, aC; uniform float uTime, uGain; uniform vec3 uRun, uEye; varying vec2 vQ; varying float vHue, vShade;
void main(){
  float sd = aB.w, s = mod(aB.z*uRun.z + aC.z*uTime, uRun.z), z = uRun.y + s;
  vec3 c = vec3(uRun.x + aB.x + aC.w*sin(uTime*0.4 + sd*40.), mgHighDeck(z) + aB.y + 0.5*aC.w*sin(uTime*0.6 + sd*23.), z);
  float keep = smoothstep(0., 6., s)*(1. - smoothstep(uRun.z - 10., uRun.z, s))*smoothstep(0.6, 2.5, length(c - uEye));
  float t = uTime*aC.y, yaw = sd*50. + t, pit = sd*13. + t*0.8, rol = 0.7*sin(t*1.3 + sd*9.);
  vec3 Y = vec3(cos(yaw), 0., sin(yaw)), X = vec3(-Y.z, 0., Y.x), N = vec3(0., 1., 0.);
  vec3 Yp = Y*cos(pit) + N*sin(pit), Np = N*cos(pit) - Y*sin(pit), Xp = X*cos(rol) + Np*sin(rol);
  float len = aC.x*keep;
  vec3 w = c + Xp*(position.x*len*0.66) + Yp*((position.y - 0.5)*len);
  vQ = vec2(position.x*2., position.y); vHue = fract(sd*7.77); vShade = (0.75 + 0.4*fract(sd*3.3))*uGain;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const FRAG = /* glsl */`
${PETAL}${FOG_FRAG_PARS}
varying vec2 vQ; varying float vHue, vShade;
void main(){
  float s = mgPetal(vQ);
  // a petal's own ribs, lengthwise, and the roll of its blade from one side to the other
  float rib = abs(fract(vQ.x*2.2 + 0.5) - 0.5), ribs = 1. - 0.16*(1. - smoothstep(0.03, 0.12, rib))*smoothstep(0.1, 0.4, vQ.y);
  vec3 col = mgPetalHue(vHue)*(1.3 - 0.45*smoothstep(0., 0.22, s))*(0.82 + 0.3*vQ.y)*(0.9 + 0.16*vQ.x)*ribs*vShade;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
  if(s < 0.) discard;
}`;

export async function buildAdrift(ctx, o) {
  const { THREE, look, U, rng, rngStream } = o;
  const n = Math.round(3200 * Math.min(1, 0.3 + 0.7 * look.detail)), B = new Float32Array(n * 4), C = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    B[i * 4] = rng(); B[i * 4 + 1] = rng(); B[i * 4 + 2] = rng(); B[i * 4 + 3] = rng();
    C[i * 4] = rng.range(0.26, 0.5); C[i * 4 + 1] = rng.range(0.6, 2.2); C[i * 4 + 2] = rng(); C[i * 4 + 3] = rng.range(0.5, 2.2);
  }
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 4)); g.instanceCount = n;
  const eye = { value: new THREE.Vector3() };
  const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { ...fogUniforms(), uTime: U.uTime, uGain: { value: 0.95 }, uBox: { value: new THREE.Vector3(84, 52, 84) }, uEye: eye, uWind: { value: new THREE.Vector3(0.35, 0.3, 2.1) } } });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  const group = new THREE.Group(); group.add(mesh);
  await ctx.yield();
  // ---- the stream to the ring: from the high bridge's root to 30 m past the ring
  const ns = Math.round(700 * Math.min(1, 0.3 + 0.7 * look.detail)), SB = new Float32Array(ns * 4), SC = new Float32Array(ns * 4);
  for (let i = 0; i < ns; i++) {
    const across = (rngStream() + rngStream() + rngStream() - 1.5) * 0.62 * HIGH_BRIDGE.width;
    SB[i * 4] = across; SB[i * 4 + 1] = 0.8 + 5.2 * rngStream() * rngStream(); SB[i * 4 + 2] = rngStream(); SB[i * 4 + 3] = rngStream();
    SC[i * 4] = rngStream.range(0.26, 0.5); SC[i * 4 + 1] = rngStream.range(0.8, 2.6); SC[i * 4 + 2] = rngStream.range(3, 5.5); SC[i * 4 + 3] = rngStream.range(0.4, 1.6);
  }
  const sg = new THREE.InstancedBufferGeometry(); sg.index = quad.index; sg.setAttribute('position', quad.attributes.position);
  sg.setAttribute('aB', new THREE.InstancedBufferAttribute(SB, 4)); sg.setAttribute('aC', new THREE.InstancedBufferAttribute(SC, 4)); sg.instanceCount = ns;
  const sm = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: STREAM_VERT, fragmentShader: FRAG,
    uniforms: { ...fogUniforms(), uTime: U.uTime, uGain: { value: 0.95 }, uEye: eye, uRun: { value: new THREE.Vector3(HIGH_BRIDGE.x, HIGH_BRIDGE.z0, EXIT.z - HIGH_BRIDGE.z0 + 30) } } });
  const stream = new THREE.Mesh(sg, sm); stream.frustumCulled = false; group.add(stream);
  return {
    object: group, triangles: (n + ns) * 2, drawCalls: 2, count: n + ns,
    update(dt, time, camera) { eye.value.setFromMatrixPosition(camera.matrixWorld); },
    dispose() { quad.dispose(); g.dispose(); m.dispose(); sg.dispose(); sm.dispose(); },
  };
}
