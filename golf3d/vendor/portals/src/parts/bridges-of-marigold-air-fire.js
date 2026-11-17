// bridges-of-marigold, the air: MOTHS AT THE LAMPS, and THE FIREWORKS (design, sections 6 and 7).
// THE MOTHS: two pale moths wheel about each lamp that hangs within 38 m of the flown line (by the plan's
// measure; nearer lamps there are none than the lines' CLEAR). A moth is a small soft fleck that goes round its
// lamp on a tilted, wobbling ring less than a metre and a half wide, by the world's clock, and goes with the
// lamp's sway. It takes its lamp's colour, paled.
// THE FIREWORKS OF EVERY VISIT: the kit's slow bursts, gold and rose, high over the far towers in the south and in
// the east (the sky the last third of the flight looks into), by the world's clock: each opens 300 m and more up
// and 260 m and more from the flown line on the ground plan, never near it.
// THE RARE LOOK'S FIREWORKS (only on a visit whose rare look is dealt): bursts of gold, magenta and teal as well,
// high over the three ring towers on the city's far side from the entry (towers 3, 4 and 5) and the canyon between
// them. Every burst opens 85 m and more over the highest of those towers' roofs, and its rocket is first seen 45 m
// over them; the whole display keeps north of the great tower's crown, and 90 m and more over the flown line.
// NO FAST FLICKER in either: the kit's glitter (sparks blinking many times a second) and its crackle are taken out
// of the displays as they are built; a spark brightens once and fades.
// NO RING: every shell opens as a full round burst (a peony, a willow that droops, a chrysanthemum); the kit's flat
// ring is taken out of each display as it is built (see quiet below).
import { HANG, FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms, makeFireworks } from '../kit/fx.js';
import { LAMP_DROP } from './bridges-of-marigold-air-lamps.js';
import { TOWERS, HIGH_BRIDGE } from './bridges-of-marigold-plan.js';

//   aP (its lamp's place at rest; the moth's size)   aHang (the lamp's sway)   aM (ring radius, turns, phase, tilt)   aCol
const VERT = /* glsl */`
${FOG_VERT_PARS}${HANG}
attribute vec4 aP, aHang, aM, aCol; uniform float uTime, uPx, uDrop; varying vec2 vQ; varying vec3 vCol;
void main(){
  vec3 c = mgHang(aP.xyz, aHang, uTime); c.y -= uDrop;
  float a = uTime*aM.y + aM.z, r = aM.x*(0.72 + 0.28*sin(a*0.37 + aM.w));
  c += vec3(cos(a)*r, 0.5*r*sin(a*1.7 + aM.w*5.), sin(a)*r);
  vec4 mvPosition = viewMatrix*vec4(c, 1.); float dist = max(-mvPosition.z, 0.05), size = max(aP.w, uPx*dist*2.2);
  vCol = aCol.rgb*(0.7 + 0.3*sin(uTime*5.3 + aM.z*7.))*(aP.w/size); vQ = position.xy*2.;
  mvPosition.xy += position.xy*size; gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const FRAG = /* glsl */`
${FOG_FRAG_PARS}
varying vec2 vQ; varying vec3 vCol;
void main(){ float d = min(length(vQ*vec2(1., 1.7)), 1.), k = 1. - d; gl_FragColor = vec4(vCol*k*k*(1. - 0.7*fxFog()), 1.); }`;

export async function buildFire(ctx, o) {
  const { THREE, look, U, rngMoths, rngFireworks, near } = o, group = new THREE.Group(), made = [];
  const P = [], H = [], M = [], C = [], pale = new THREE.Color('#fff0d0');
  for (const l of near) for (let i = 0; i < 2; i++) {
    const rad = rngMoths.range(0.35, 0.72), turns = rngMoths.range(2.2, 4.6) * (rngMoths() < 0.5 ? -1 : 1), ph = rngMoths() * 6.2832, tilt = rngMoths() * 6.2832, size = rngMoths.range(0.13, 0.2);
    const c = l.col.clone().lerp(pale, 0.7);
    P.push(l.p[0], l.p[1], l.p[2], size); H.push(l.hang[0], l.hang[1], l.hang[2], l.hang[3]); M.push(rad, turns, ph, tilt); C.push(c.r * 1.3, c.g * 1.3, c.b * 1.3, 0);
  }
  const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry(); made.push(quad, g);
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  for (const [name, arr] of [['aP', P], ['aHang', H], ['aM', M], ['aCol', C]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), 4));
  const n = P.length / 4; g.instanceCount = n;
  const m = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { ...fogUniforms(), uTime: U.uTime, uPx: U.uPx, uDrop: { value: LAMP_DROP } } });
  made.push(m);
  let triangles = n * 2, drawCalls = 0;
  if (n) { const moths = new THREE.Mesh(g, m); moths.frustumCulled = false; moths.renderOrder = 7; group.add(moths); drawCalls++; }
  await ctx.yield();
  // (the kit marks the sparks that glitter by the third number of aBurst, over a half: none is left over a half)
  // NO SHELL OPENS AS A RING: the kit deals each shell's kind in its shader, and one kind in four is a flat ring. In
  // each display's own copy of that shader's text the ring is put out, so that a shell dealt as a ring opens as a
  // full round one (a peony); no other die of the display moves. (Were the kit's text to differ, nothing is replaced.)
  const RING = 'step(.5, type)*step(type, 1.5)';
  const quiet = (f) => {
    const a = f.object.geometry.attributes.aBurst; for (let i = 2; i < a.array.length; i += 4) a.array[i] *= 0.49; a.needsUpdate = true;
    f.material.vertexShader = f.material.vertexShader.replace(RING, '0.');
    return f;
  };
  const shows = [quiet(makeFireworks({ rng: rngFireworks, time: U.uTime, position: [HIGH_BRIDGE.x, 335, HIGH_BRIDGE.z1 + 400], area: [900, 70, 260], bursts: 6, sparks: 200, period: 8.5, rise: 1.6, launchHeight: 110,
    radius: 78, gravity: 2.4, size: 1.8, trail: 0.6, flash: 0.05, crackle: 0, colors: ['#ffb02e', '#ff4f8e', '#ffd070', '#ff7a5a', '#ffc24a'], intensity: 1.6, fogAmount: 0.35 })),
    quiet(makeFireworks({ rng: rngFireworks, time: U.uTime, position: [HIGH_BRIDGE.x + 400, 345, HIGH_BRIDGE.z0 + 190], area: [240, 80, 620], bursts: 5, sparks: 200, period: 9.5, rise: 1.6, launchHeight: 110,
      radius: 70, gravity: 2.4, size: 1.6, trail: 0.6, flash: 0.05, crackle: 0, colors: ['#ffc24a', '#ff4f8e', '#ffb02e', '#ffd070', '#ff7a5a'], intensity: 1.5, fogAmount: 0.35 }))];
  if (look.fireworks) {
    const far = [TOWERS[3], TOWERS[4], TOWERS[5]], cx = (far[0].x + far[1].x + far[2].x) / 3, cz = (far[0].z + far[1].z + far[2].z) / 3, top = Math.max(far[0].top, far[1].top, far[2].top);
    shows.push(quiet(makeFireworks({ rng: rngFireworks, time: U.uTime, position: [cx, top + 115, cz - 15], area: [230, 60, 100], bursts: 5, sparks: 240, period: 6.4, rise: 1.5, launchHeight: 40,
      radius: 46, gravity: 3, size: 0.8, trail: 0.5, flash: 0.1, crackle: 0, colors: ['#ffb02e', '#ff2a96', '#14d2c2'], intensity: 1.5, fogAmount: 0.4 })));
  }
  for (const f of shows) { group.add(f.object); triangles += f.triangles || 0; drawCalls++; }
  return {
    object: group, triangles, drawCalls, moths: n,
    update(dt, time, camera) { for (const f of shows) f.update(dt, time, camera); },
    dispose() { for (const x of made) x.dispose(); for (const f of shows) { f.object.geometry.dispose(); f.material.dispose(); } },
  };
}
