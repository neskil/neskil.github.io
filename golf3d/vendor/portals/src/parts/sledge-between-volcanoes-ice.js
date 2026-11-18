// THE SLEDGE BETWEEN THE VOLCANOES: the forms of ice and blown snow.
//   makeSeracs()     the icefall's towers and blocks: three geometries, instanced, one ice shader (blue in the body,
//                    frost on top, the fire's red on one side, ash on the snow caps of the fire side); a few of them are
//                    separate meshes that lean, break and come down (a seeded schedule on the world clock, and the one
//                    tower the brief keys to the climb, which the world drives with an amount 0..1).
//   makePuffs()      soft lit sprites on parabolas from a table of emitters: ice dust where a tower lands, snow banners
//                    streaming off ridges, serac tops and the lip. A pure function of the world clock (and of the ages
//                    the world hands in for keyed groups).
//   makeSpindrift()  ground streamers: long flat ribbons of scrolling snow lying over the whole plateau (they stand in
//                    the world; nothing of them follows the eye). Each sheet thins out over the last 0.3 m of its
//                    height over the land's own surface (opts.ground: the land's heights as a map).
//   Declared footprint fades: the streaks go over to their mean where a pixel covers 0.5 to 2.2 m across the wind
//   (a streak is about 1.5 m across); the wisps inside a streak go over to the streak's mean where a pixel covers
//   more than 0.05 to 0.16 m across the wind or 0.8 to 2.6 m along it.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import { sharedUniforms, SBV_NOISE, SBV_LIGHT } from './sledge-between-volcanoes-common.js';

// ---------------------------------------------------------------- seracs
// a block of broken ice from the kit's rock shapes (cut planes give the fracture faces), stood on its base at unit
// height; kind 0 tower, 1 squat block, 2 blade, 3 the same tower with four times the faces (for the ones beside the way)
const SERAC_KINDS = [
  { squash: [0.42, 1.5, 0.4], taper: 0.14, cuts: 8, detail: 1 }, { squash: [0.78, 0.85, 0.7], taper: 0.08, cuts: 9, detail: 1 },
  { squash: [0.27, 1.4, 0.62], taper: 0.2, cuts: 7, detail: 1 }, { squash: [0.46, 1.6, 0.44], taper: 0.14, cuts: 12, detail: 2 }];
const triCount = (g) => (g.index ? g.index.count : g.getAttribute('position').count) / 3;
function seracGeometry(rng, kind) {
  const K = SERAC_KINDS[kind], g = T.rockGeometry({ rng, kind: 'rock', radius: 1, detail: K.detail, cuts: K.cuts, cutDepth: [0.42, 0.85], roughness: 0.1, lumps: 0.22, squash: K.squash, taper: K.taper, crease: 0.4 });
  const p = g.getAttribute('position'); let lo = 1e9, hi = -1e9; for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
  const H = hi - lo, k = new Float32Array(p.count);
  g.translate(0, -lo - H * 0.1, 0); g.scale(1 / H, 1 / H, 1 / H);                // the lowest tenth goes into the snow
  // a broken block, not a blade: the top is a slanted break, each shape's at its own tilt
  { const tx = 0.3 - 0.2 * kind, tz = 0.12 * kind - 0.2, top = 0.72; for (let i = 0; i < p.count; i++) p.setY(i, Math.min(p.getY(i), top + tx * p.getX(i) + tz * p.getZ(i))); p.needsUpdate = true; g.computeVertexNormals(); }
  for (let i = 0; i < p.count; i++) k[i] = Math.min(1, Math.max(0, p.getY(i)));
  g.setAttribute('aK', new THREE.BufferAttribute(k, 1));
  return g;
}

const SERAC_VS = /* glsl */`
attribute float aK;
varying vec3 vW, vN, vL; varying float vK, vSeed;
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix*instanceMatrix;
  #endif
  vec4 w = m*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(m)*normal); vL = position; vK = aK;
  vSeed = fract(m[3].x*.137 + m[3].z*.291);
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const SERAC_FS = /* glsl */`
precision highp float;
varying vec3 vW, vN, vL; varying float vK, vSeed;
uniform vec3 uIceA, uIceB, uFrost, uAshCol, uGlowIce; uniform vec2 uSeracP;      // uSeracP: mirror sign, ash amount
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  // the faces are rough, not cut glass
  // sharp facets: each face's own normal (from the change of its position across the picture's cells), a little grain on it
  vec3 fc = cross(dFdx(vW), dFdy(vW)); vec3 fn = dot(fc, fc) > 1e-14 ? normalize(fc) : normalize(vN + vec3(0., 1e-4, 0.)); if (dot(fn, v) < 0.) fn = -fn;
  vec3 n = normalize(fn + (vec3(sN3(vW*3.1), sN3(vW*3.1 + 5.), sN3(vW*3.1 + 9.)) - .5)*.12
    + (vec3(sN3(vW*.8 + 20.), sN3(vW*.8 + 25.), sN3(vW*.8 + 31.)) - .5)*.3);      // (polish 1, fourth part, E3a: a broken face is uneven over a metre or so too: no side of a block is lit as one flat plane)
  float k = clamp(vK, 0., 1.);
  // the body: blue ice with bands and fracture planes; bluer toward the foot and the inside
  float band = sN2(vec2(vW.y*.55 + vSeed*17., (vW.x + vW.z)*.08)), frac = sF2(vec2(dot(vW.xz, vec2(.8, .6))*.5, vW.y*.18) + vSeed*9.);
  vec3 alb = mix(uIceB, uIceA, clamp(.5 + .45*k + .5*(frac - .5), 0., 1.))*(.85 + .25*band);
  // frost and old snow on what faces up; ash on it toward the fire
  // (fourth part, E3a: the snow's edge on a slanted face is ragged, from fine broken noise; it was one slow noise, which
  //  left a round bare spot like a bored hole in the snow on a face near the limit)
  float up = smoothstep(.22, .46, fn.y + .06*(frac - .5) + .16*(sF2(vW.xz*1.9 + vW.y*1.3 + vSeed*7.) - .5));      // snow lies on whatever faces up, even on a slant
  float ashK = uSeracP.y*smoothstep(-.2, .6, sN2(vW.xz*.11 + 3.) + .5*smoothstep(-60., 120., vW.x*uSeracP.x));
  { float fl = 1. - smoothstep(.0, .028, abs(sN2(vec2(dot(vW.xz, vec2(.8, .6))*.8, vW.y*.3) + vSeed*5.) - .5)); alb *= 1. - .4*fl; }      // fracture lines across the faces
  alb = mix(alb, mix(vec3(.66, .72, .8), uAshCol, .6*ashK), up);
  alb = mix(alb, uFrost, .35*smoothstep(.55, .8, frac)*(1. - up));                 // frost feathers on the faces
  // soot on the faces that look toward the fire, heavier on the fire side of the fall
  alb = mix(alb, uAshCol*1.5, uSeracP.y*.8*clamp(fn.x*uSeracP.x*1.3, 0., 1.)*smoothstep(-70., 110., vW.x*uSeracP.x)*(.45 + .55*frac));
  // the faces turned to the fire take an orange light (the lava front, and the tongue beside the fall); those turned away stay blue
  vec3 c = alb*(sbvSky(n) + (.35*sbvFire(vW, n) + 1.5*sbvFire2(vW, n))*vec3(1., .6, .46) + sbvRing(vW, n));      // (firelight on sooted ice is red, not salmon)
  // light inside the ice: a soft blue where we look into a face, stronger low down
  float fres = clamp(dot(n, v), 0., 1.);
  c += uGlowIce*.5*(.25 + .75*fres*fres)*(1. - up)*(1. - .55*k);
  // ice in the light is pale, never white: a soft shoulder on the brightest channel
  { float m = max(c.r, max(c.g, c.b)); c *= .9/(.9 + 1.3*max(m - .55, 0.)); }
  gl_FragColor = vec4(sbvFog(c, length(cameraPosition - vW), 1.), 1.);
}`;

// opts: rng, noise, ground (x, z) => y, zone { up(x, z) (distance up the glacier), from, to (in that distance), half, gully },
//       count, mx, keyed [x, z] (the tower by the climb), shapes, falls (the streams that deal the four shapes and the
//       towers that go over; rng deals the standing loop),
//       gap (x, y0, y1, z) => metres from the route to an upright thing standing there, margin (m): a serac nearer the
//       route than its own radius plus the margin is not stood; a tower whose fallen length would lie that near falls
//       another way, or stays standing
export async function makeSeracs(ctx, S, o) {
  const rng = o.rng, object = new THREE.Group(); object.name = 'seracs';
  // every stream is in hand before anything is dealt: the shapes, the standing loop (rng: it reads the land and the
  // route and refuses places, so it has a stream to itself), the towers that go over
  const sh = o.shapes || rng.fork('shapes'), fr = o.falls || rng.fork('fallers');
  const geos = []; for (let k = 0; k < 4; k++) { geos.push(seracGeometry(sh, k)); await ctx.yield(); }
  const uniforms = { ...sharedUniforms(S), uIceA: { value: new THREE.Color(0.6, 0.67, 0.74) }, uIceB: { value: new THREE.Color(0.22, 0.42, 0.62) }, uFrost: { value: new THREE.Color(0.62, 0.67, 0.72) },
    uAshCol: { value: new THREE.Color('#1c1a1f') }, uGlowIce: { value: new THREE.Color('#3FA9D9').multiplyScalar(0.045) }, uSeracP: { value: new THREE.Vector2(o.mx ?? 1, o.ash ?? 1) } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: SERAC_VS, fragmentShader: SERAC_FS });
  const lists = [[], [], [], []], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), placed = [];
  const Z = o.zone, count = o.count ?? 420, margin = typeof o.margin === 'number' ? o.margin : 4, api0 = { refused: 0, turned: 0, held: 0 };
  let tries = 0;
  while (placed.length < count && tries < count * 14) {
    tries++; if (tries % 24 === 0) await ctx.yield();      // (every 24 tries, stood or refused: a refused try costs as much as a stood one)
    // more of them, and taller, beside the gully and in the middle of the fall
    const side = rng.sign(), ax = Z.gully + 4 + Math.pow(rng(), 1.5) * (Z.half - Z.gully - 6), x = side * ax, z = -rng.range(Z.from, Z.to + 40);
    const d = Z.up(x, z); if (d < Z.from || d > Z.to) continue;
    const mid = Math.sin(Math.PI * clamp((d - Z.from) / (Z.to - Z.from), 0, 1)), nearGully = 1 - smoothstep(Z.gully, Z.gully + 70, ax);
    let kind = rng() < 0.45 ? 0 : rng() < 0.6 ? 1 : 2;
    let h = lerp(5, 16, Math.pow(rng(), 1.7)) * (0.6 + 0.4 * mid) * (0.8 + 0.25 * nearGully); if (kind === 1) h *= 0.6;
    if (kind === 0 && h > 8 && nearGully > 0.35) kind = 3;
    const wide = kind === 1 ? 1.25 : 1.7, r = h * (kind === 1 ? 0.56 : 0.37);
    if (ax - r < Z.gully) continue;
    let ok = true; for (const p of placed) { const dx = p[0] - x, dz = p[1] - z; if (dx * dx + dz * dz < (p[2] + r) * (p[2] + r) * 0.55) { ok = false; break; } } if (!ok) continue;
    if (o.keyed && Math.hypot(x - o.keyed[0], z - o.keyed[1]) < 14) continue;
    const y = Math.min(o.ground(x, z), o.ground(x + r * 0.6, z), o.ground(x - r * 0.6, z), o.ground(x, z + r * 0.6));
    if (o.gap && o.gap(x, y, y + h, z) < r * 1.35 + (typeof o.margin === 'function' ? o.margin(x, z) : margin)) { api0.refused++; continue; }
    if (o.avoid && o.avoid.some((a) => Math.hypot(x - a[0], z - a[1]) < a[2] + r)) continue;
    placed.push([x, z, r, h]);
    // one in seven lies fallen, on its side
    const fallen = rng() < 0.14;
    e.set(rng.range(-0.2, 0.2) * 1.5 + (fallen ? 1.25 : 0), rng.range(0, Math.PI * 2), rng.range(-0.2, 0.2) * 1.5); q.setFromEuler(e);
    sv.set(h * wide * rng.range(0.8, 1.35), h, h * wide * rng.range(0.8, 1.35)); pv.set(x, y, z);
    lists[kind].push(m4.compose(pv, q, sv).clone());
  }
  let triangles = 0;
  for (let i = 0; i < 4; i++) { if (!lists[i].length) continue; const im = new THREE.InstancedMesh(geos[i], mat, lists[i].length); lists[i].forEach((m, j) => im.setMatrixAt(j, m)); im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere(); im.name = 'seracs-' + i; object.add(im); triangles += lists[i].length * triCount(geos[i]); }
  await ctx.yield();
  // the fallers: the tower by the climb and a few more. Each is a tower hinged at its foot; when each goes over is
  // the world's to say (update takes the seconds since each began to lean). They are dealt from a stream of their own.
  // A tower goes over down the slope it stands on: its heading is the ground's own fall line at its foot, a little to
  // either side of it.
  const fallers = [];
  const downhill = (x, z) => { const gx = o.ground(x + 4, z) - o.ground(x - 4, z), gz = o.ground(x, z + 4) - o.ground(x, z - 4); return Math.atan2(gz, -gx); };
  // would the tower, lying where it falls on this heading, keep clear of the route?
  const fallsClear = (x, z, h, yaw) => { if (!o.gap) return true; const dx = Math.cos(yaw), dz = -Math.sin(yaw);
    for (let k = 0; k <= 1.001; k += 0.125) { const px = x + dx * h * k, pz = z + dz * h * k, py = o.ground(px, pz); if (o.gap(px, py - 1, py + h * 0.5, pz) < h * 0.4 + 8) return false; } return true; };
  const addFaller = (x, z, h, yaw0, keyed) => {
    // the clearance test chooses the heading: the dealt one, or the first quarter turn from it that lies clear; if none
    // does, the tower is stood but never goes over
    let yaw = yaw0, falls = false; for (let q4 = 0; q4 < 4 && !falls; q4++) { yaw = yaw0 + q4 * Math.PI / 2; falls = fallsClear(x, z, h, yaw); if (falls && q4 > 0) api0.turned++; }
    if (!falls) { yaw = yaw0; api0.held++; }
    const mesh = new THREE.Mesh(geos[3], mat), pivot = new THREE.Group(); pivot.position.set(x, o.ground(x, z) - 0.2, z); pivot.rotation.y = yaw; mesh.scale.set(h * 1.1, h, h * 1.1); pivot.add(mesh); object.add(pivot);
    const f = { pivot, mesh, x, z, h, yaw, keyed, falls, amount: 0, dir: new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2)) }; fallers.push(f); return f;
  };
  if (o.keyed) addFaller(o.keyed[0], o.keyed[1], 20, downhill(o.keyed[0], o.keyed[1]) + fr.range(-0.5, 0.5), true);
  for (let i = 0; i < 5; i++) { const side = fr.sign(), x = side * fr.range(Z.gully + 45, Z.half - 30), z = -fr.range(Z.from + 25, Z.to - 30); addFaller(x, z, fr.range(11, 17), downhill(x, z) + fr.range(-0.5, 0.5), false); }
  // a number dealt for each tower that nothing reads (an older rule paced each fall by it; the one declared fall is
  // paced by the world, by metres flown). These six draws are live's, the last on their stream: they hold nothing, and
  // are left as they are only so that this file's text of live stays the same.
  for (const f of fallers) f.reach = fr.range(1.1, 2.4);
  const api = {
    object, uniforms, triangles: triangles + fallers.length * triCount(geos[3]), fallers, placed, clearance: api0,
    fallSeconds: 4.5,
    // how far a faller has gone (0 standing, 1 down) from a time since its start
    fallAt(age) { return age <= 0 ? 0 : age < 2.6 ? 0.05 * smoothstep(0, 2.6, age) : Math.min(1, 0.05 + 0.95 * Math.pow((age - 2.6) / 1.9, 2.2)); },
    // ages: seconds since each faller began to lean (negative: still standing)
    update(dt, time, ages) {
      for (let i = 0; i < fallers.length; i++) {
        const f = fallers[i], a = f.falls ? api.fallAt(ages ? ages[i] : -1) : 0;
        f.amount = a;
        // it leans, then goes over and breaks: the fall ends flat, sunk into its own rubble
        f.mesh.rotation.z = -a * 1.48; f.mesh.position.y = -a * a * f.h * 0.11;
        f.mesh.scale.y = f.h * (1 - 0.3 * smoothstep(0.9, 1, a));
      }
    },
  };
  api.update(0, 0, null);
  return api;
}

// ---------------------------------------------------------------- puffs
// One instanced draw of soft lit sprites. Each emitter throws `n` sprites on drag-slowed arcs; a continuous emitter
// (group -1) loops them on the world clock, a burst emitter (group 0..7) reads its age from uAges[group].
const PUFF_VS = /* glsl */`
attribute vec3 aP, aV; attribute vec4 aA, aB; attribute vec2 aC;      // aA: phase or delay, life, size0, size1   aB: group, tone, seed, alpha   aC: gravity, drag
uniform float uTime; uniform float uAges[8]; uniform vec3 uPuffWind;
varying vec2 vUv; varying vec4 vI; varying vec3 vW, vR, vU; varying float vS;
void main(){
  float life = max(aA.y, .05), age;
  if (aB.x < -.5) age = mod(uTime + aA.x*life, life);
  else { int g = int(clamp(aB.x + .5, 0., 7.)); age = uAges[g] - aA.x; }
  float k = clamp(age/life, 0., 1.), vis = step(0., age)*step(age, life);
  float dr = max(aC.y, .05), tt = (1. - exp(-dr*max(age, 0.)))/dr;
  vec3 p = aP + aV*tt + uPuffWind*(max(age, 0.) - tt) + vec3(0., -.5*aC.x*age*age, 0.);
  vec4 w = modelMatrix*vec4(p, 1.);
  // the card faces the eye's place (not the lens): its axes come from the line to where the eye stands
  vec3 toEye = normalize(cameraPosition - w.xyz); vR = normalize(cross(vec3(0., 1., 0.), toEye) + vec3(1e-4, 0., 0.)); vU = cross(toEye, vR);
  float s = mix(aA.z, aA.w, sqrt(k));
  float rot = aB.z*40. + age*(.15 + .3*fract(aB.z*7.3))*(fract(aB.z*3.1) > .5 ? 1. : -1.), cr = cos(rot), sr = sin(rot);
  vec2 c = position.xy*2.; vUv = c; c = vec2(c.x*cr - c.y*sr, c.x*sr + c.y*cr);
  w.xyz += (vR*c.x + vU*c.y)*s*.5;
  vW = w.xyz; vS = s;
  float a = aB.w*smoothstep(0., .12, k)*(1. - smoothstep(aB.y > 1.5 ? .72 : .45, 1., k))*vis;      // steam holds together higher up its tower
  vI = vec4(a, aB.y, aB.z, k);
  gl_Position = vis > .5 ? projectionMatrix*viewMatrix*w : vec4(2., 2., 2., 1.);
}`;
const PUFF_FS = /* glsl */`
precision highp float;
varying vec2 vUv; varying vec4 vI; varying vec3 vW, vR, vU; varying float vS;
uniform vec3 uSnowTone, uAshTone, uHot, uGlowCol2, uFlashCol, uPuffWind; uniform float uPuffClock, uSoft, uFogK, uBellyK; uniform vec4 uGlowAt, uFlashAt, uNearFade;      // uSoft 1: smoke (soft torn edges, one slow field through all its cards)
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
  float tone = clamp(vI.y, 0., 2.), steam = clamp(tone - 1., 0., 1.);
  // each card is eaten by its own noise; the cards of a steam tower by one field in the tower's own space, which rises with it
  float nz = sF2(vUv*1.7 + vI.z*31.);
  if (steam > 0.) nz = mix(nz, sF2(vec2(vW.x*.8 + vW.z*.6, vW.y - uPuffClock*5.)/16.) + .2*(sF2(vec2(vW.x*.8 + vW.z*.6, vW.y - uPuffClock*5.)/4. + 4.) - .5), steam*.6);
  if (uSoft > 0.) { vec2 sp = vec2(vW.x*.8 + vW.z*.6, vW.y*1.1)/max(vS*.42, 1.); nz = mix(nz, sF2(sp + vec2(uPuffClock*.011, -uPuffClock*.017)) + .25*(sF2(sp*3.1 + 7.) - .5), .65*uSoft); }
  float soft = max(steam, uSoft);
  // (smoke's outline is ragged: the card's own edge is pushed in and out by a finer field, so no round rim is left)
  // (steam's outline too: its card's edge is eaten inward by two fields of its own, unevenly, and its density runs out
  //  to nothing before the card's rim, so no clean round is left and neighbours run into one body)
  float re = r2*(1. + uSoft*(1.5*(sF2(vUv*3.3 + vI.z*17.) - .42) + .7*(sF2(vUv*7.9 + vI.z*5.) - .5)) + steam*(1.5*sF2(vUv*2.7 + vI.z*17.) + .9*sF2(vUv*6.9 + vI.z*5.)));
  float a = clamp(exp(-re*mix(3.2, 1.9, soft)) - .04 - .05*uSoft - .11*steam, 0., 1.)*smoothstep(.15 - .25*steam - .03*uSoft, .75 - .12*steam + .12*uSoft, nz + .55*(1. - re))*vI.x;
  float dist = length(cameraPosition - vW);
  // one near fade in plain metres for every card whatever its size: gone at 2 m from the eye's place, whole from 12 m
  // (a large card is kept from the eye by where its emitter stands, which the world tests against the road)
  a *= smoothstep(uNearFade.x, uNearFade.y, dist);
  vec3 f = normalize(cross(vR, vU)); vec3 n = normalize(vR*vUv.x + vU*vUv.y + f*sqrt(max(1. - r2, .05)));
  vec3 alb = mix(uSnowTone, uAshTone, clamp(tone, 0., 1.));
  alb = mix(alb, vec3(.6, .61, .64), steam);
  alb *= mix(1., .5 + .5*smoothstep(-.4, .5, n.y), uSoft);                         // smoke is dark on its under and lee sides; only the sky's side is grey
  // steam: one body, not a heap of balls: its cards are lit almost flat (the ball's own normal is kept only to tell
  // under from over and lee from windward); dark ash hangs in its lee; the fire's colour is on its underside only
  vec3 n0 = n; float under = 1.;
  if (steam > 0.) { n = normalize(n0 + f*1.3*steam); under = mix(1., smoothstep(.0, -.6, n0.y), steam);
    float lee = smoothstep(-.1, .8, dot(n0, normalize(uPuffWind + vec3(1e-4, 0., 0.))));
    alb = mix(alb, vec3(.2, .19, .2), .6*lee*steam); }
  // steam is grey-white; the fire reddens only its foot, where it leaves the lava
  vec3 c = alb*(sbvSky(n)*.85 + sbvSky(vec3(0., 1., 0.))*.3 + ((sbvFire(vW, n0) + sbvFire(vW, -n0)*.35)*(1. - steam*(.5 + .5*smoothstep(.1, .45, vI.w))) + 1.6*sbvFire2(vW, n0))*under + .35*sbvRing(vW, n) + uBellyK*sbvBelly(vW, n));
  c += uHot*steam*exp(-vI.w*12.)*under;
  // a light at a place (the crater under its smoke; the ring by the way out): on what faces down at it, falling off with metres
  { vec3 gd = uGlowAt.xyz - vW; float gl = uGlowAt.w*uGlowAt.w/(dot(gd, gd) + uGlowAt.w*uGlowAt.w);
    c += uGlowCol2*gl*mix(.25 + .75*clamp(dot(n, normalize(gd))*.8 + .3, 0., 1.), clamp(dot(n, normalize(gd))*1.4 - .2, 0., 1.), uSoft)*(1. - steam); }
  // a flash deep in the smoke: a light at the flash's own place, on whatever cards stand round it
  { vec3 fd = uFlashAt.xyz - vW; c += uFlashCol*(uFlashAt.w*uFlashAt.w/(dot(fd, fd) + uFlashAt.w*uFlashAt.w)); }
  c = sbvFog(c, dist, uFogK);
  gl_FragColor = vec4(c*a, a);
}`;
// emitters: [{ p, v, spread, vr, n, life, size: [s0, s1], tone (0 snow, 1 ash, 2 steam), group (-1 loops), delay, grav, drag, alpha }]
export function makePuffs(S, o) {
  const rng = o.rng, P = [], V = [], A = [], B = [], C = [];
  for (const e of o.emitters) {
    const n = e.n ?? 8, sp = e.spread ?? 0.5, vr = e.vr ?? 0.5, life = e.life ?? 4, group = e.group ?? -1;
    for (let i = 0; i < n; i++) {
      P.push(e.p[0] + rng.range(-sp, sp), e.p[1] + rng.range(-sp, sp) * (e.flat ?? 0.5), e.p[2] + rng.range(-sp, sp));
      V.push(e.v[0] + rng.range(-vr, vr), e.v[1] + rng.range(-vr, vr) * 0.6, e.v[2] + rng.range(-vr, vr));
      A.push(group < 0 ? (i + rng()) / n : rng.range(0, e.delay ?? 0.4), life * rng.range(0.8, 1.2), e.size[0] * rng.range(0.8, 1.25), e.size[1] * rng.range(0.75, 1.3));
      B.push(group, e.tone ?? 0, rng(), (e.alpha ?? 0.4) * rng.range(0.7, 1));
      C.push(e.grav ?? 0, e.drag ?? 0.6);
    }
  }
  const g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(1, 1); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 3)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(V), 3));
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(C), 2)); g.instanceCount = P.length / 3;
  const ages = new Float32Array(8).fill(-1);
  const uniforms = { ...sharedUniforms(S), uAges: { value: ages }, uPuffWind: { value: new THREE.Vector3(...(o.wind ?? [0, 0, 0])) }, uSnowTone: { value: new THREE.Color(0.78, 0.82, 0.9) },
    uPuffClock: S.uTime, uGlowAt: { value: new THREE.Vector4(...(o.glowAt ?? [0, 0, 0, 0])) }, uGlowCol2: { value: new THREE.Color(o.glowCol ?? '#000000').multiplyScalar(o.glowK ?? 1) },
    uNearFade: { value: new THREE.Vector4(2, 12, 0, 0) }, uFogK: { value: o.fogK ?? 1 }, uBellyK: { value: o.belly ?? 0 }, uSoft: { value: o.soft ?? 0 }, uFlashAt: { value: new THREE.Vector4(0, 0, 0, 1) }, uFlashCol: { value: new THREE.Color(0, 0, 0) }, uAshTone: { value: new THREE.Color(o.ashTone ?? '#17161a') }, uHot: { value: new THREE.Color('#FF6A22').multiplyScalar(o.hot ?? 1.2) } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: PUFF_VS, fragmentShader: PUFF_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = o.renderOrder ?? 6; mesh.name = o.name ?? 'puffs';
  return { object: mesh, uniforms, count: P.length / 3, triangles: (P.length / 3) * 2, setAge(i, age) { ages[i] = age; } };
}

// ---------------------------------------------------------------- spindrift
// Snow snaking over the plateau: thin sheets just above the snow, lying over the whole plateau (they stand in the
// world; nothing of them follows the eye), with long streaks that run downwind inside slower gusts. Seen at a grazing angle they are the ground streamers of a cold wind.
const DRIFT_VS = /* glsl */`
uniform vec4 uDrift;        // the sheet's middle x, z (stage space), its height, its half size
varying vec3 vW; varying vec2 vL, vS;
void main(){
  vec3 p = vec3(position.x*uDrift.w + uDrift.x, uDrift.z, position.z*uDrift.w + uDrift.y); vL = position.xz; vS = p.xz;
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w;
}`;
const DRIFT_FS = /* glsl */`
precision highp float;
varying vec3 vW; varying vec2 vL, vS;
uniform vec4 uDrift, uDriftLee; uniform sampler2D tDriftG; uniform vec4 uDriftG; uniform vec2 uDriftH;      // the land's height under the sheet: a map, its box (x0, z0, 1/w, 1/d), and (lowest height, span)
uniform vec4 uDriftP;       // wind x, wind z (world), amount, layer seed (a seeded number, different for each sheet)
uniform vec2 uDriftZ;       // plateau begins between these world z (far, near)
uniform float uTime;
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  vec2 wd = uDriftP.xy; vec2 q = vec2(dot(vW.xz, wd), dot(vW.xz, vec2(-wd.y, wd.x))) + uDriftP.w*37.;
  float sp = 11. + 3.*uDriftP.w;
  float gust = smoothstep(.38, .7, sF2(vec2((q.x - uTime*sp*.8)/90., q.y/34.)));
  float st = sF2(vec2((q.x - uTime*sp)/26., q.y/1.5 + .35*sin(q.x*.05 + uDriftP.w)));
  float fine = sN2(vec2((q.x - uTime*sp*1.3)/5., q.y/.35));
  float a = min(smoothstep(.5, .78, st)*(.55 + .45*fine)*(.25 + .75*gust)*uDriftP.z, .9);
  float dist = length(cameraPosition - vW);
  // the streaks lie over the whole plateau. Where one cell of the picture covers more than a streak's own width
  // (about 1.5 m across the wind) they cannot be drawn singly: there they go over to their mean, by the cell's footprint
  // in metres (a declared least width, so they do not shimmer far off)
  { float fw = fwidth(q.y); a = mix(a, min(.16*(.25 + .75*gust)*uDriftP.z, .9), smoothstep(.5, 2.2, fw)); }
  a *= smoothstep(1., .9, max(abs(vL.x), abs(vL.y)))*smoothstep(uDriftZ.x, uDriftZ.y, -vW.z);
  // (fourth part, E2) THE SHEET IS NO PLATE. Inside a streak the snow runs in wisps, a hand's breadth to a forearm
  // across the wind and a few metres along it, faster than the streak, so the snow under the sheet shows between
  // them; the wisps keep the streak's mean and go over to it by the pixel's footprint alone (declared in the header).
  { vec2 qw = vec2((q.x - uTime*sp*1.6)/2.6, q.y/.16 + 1.7*sN2(vec2(q.x/3.1, q.y/.9)));
    float wk = 1. - smoothstep(.3, 1., max(fwidth(qw.x), fwidth(qw.y)));
    a = min(a*mix(1., 2.*smoothstep(.25, .75, .65*sN2(qw) + .35*sN2(qw*2.03 + 17.3)), wk), .9); }
  // AND IT COMES DOWN TO THE SNOW SOFTLY: it thins out over the last 0.3 m of its own height over the land's surface
  // (the land's own heights, from the map the world hands in), so it does not end at the straight cut where a 2 m
  // cell of the land rises through it. Rules of the sheet and the land; the eye's place is not read.
  a *= smoothstep(0., .3, uDrift.z - (texture2D(tDriftG, (vS - uDriftG.xy)*uDriftG.zw).r*uDriftH.y + uDriftH.x));
  // AND NONE BLOWS THROUGH THE TENT: the camp stands in its own lee (opts.lee: its place and two distances from it,
  // none inside the first, whole beyond the second)
  a *= smoothstep(uDriftLee.z, uDriftLee.w, length(vS - uDriftLee.xy));
  if (a < .003) discard;
  vec3 v = normalize(cameraPosition - vW);
  // blown snow is brighter than the packed snow under it, and it takes the afterglow when we look toward it
  vec3 c = vec3(1., 1.03, 1.08)*(sbvSky(vec3(0., 1., 0.))*1.25 + uGlowCol*(.25 + 2.2*pow(clamp(dot(-v, uGlowDir), 0., 1.), 3.)));
  c = sbvFog(c, dist, 1.);
  gl_FragColor = vec4(c*a, a);
}`;
export function makeSpindrift(S, o) {
  const object = new THREE.Group(); object.name = 'spindrift'; const sheets = [];
  const geo = new THREE.PlaneGeometry(2, 2, 1, 1).rotateX(-Math.PI / 2);
  const G = o.ground || { texture: new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1), box: [0, 0, 1, 1], lo: -1e4, span: 0 }; G.texture.needsUpdate = true;
  const layers = o.layers || [0.3, 0.75], amt = (i) => (o.amount ?? 0.5) / (1 + 0.65 * i);      // thinner with height
  for (let i = 0; i < layers.length; i++) {
    const uniforms = { ...sharedUniforms(S), uDrift: { value: new THREE.Vector4(o.centre ? o.centre[0] : 0, o.centre ? o.centre[1] : 0, o.y + layers[i], o.half ?? 150) }, uDriftP: { value: new THREE.Vector4(o.wind[0], o.wind[1], amt(i), o.rng ? i + o.rng.range(0, 1) * 6 : i) },
      uDriftZ: { value: new THREE.Vector2(o.from ?? 690, o.to ?? 740) }, tDriftG: { value: G.texture }, uDriftG: { value: new THREE.Vector4(G.box[0], G.box[1], G.box[2], G.box[3]) }, uDriftH: { value: new THREE.Vector2(G.lo, G.span) }, uDriftLee: { value: o.lee ? new THREE.Vector4(o.lee[0], o.lee[1], o.lee[2], o.lee[3]) : new THREE.Vector4(0, 0, -2, -1) } };
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: DRIFT_VS, fragmentShader: DRIFT_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
    m.frustumCulled = false; m.renderOrder = 4 + i; object.add(m); sheets.push(uniforms);
  }
  return { object, sheets, triangles: 2 * layers.length,
    setAmount(a) { sheets.forEach((u, i) => { u.uDriftP.value.z = a / (1 + 0.65 * i); }); } };
}

// ---------------------------------------------------------------- moraine
// Dark rock carried on the ice: bands along both margins, a medial stripe, and a few boulders beside the way in. Kit
// rock shapes, instanced, in the seracs' shader with rock colours (old snow on top, ash on the fire side, the red light).
// opts: rng, ground, half (the ice's half width), blocked (x, z) => true where nothing may stand, mx, count,
//       gap (x, y0, y1, z) => metres from the route, margin (m): a boulder nearer the route than its size plus the margin is not laid
export async function makeMoraine(ctx, S, o) {
  const rng = o.rng, object = new THREE.Group(); object.name = 'moraine';
  // the shapes come from a stream of their own; rng deals the laying loop alone (it reads the land and the route and
  // refuses places)
  const sh = o.shapes || rng.fork('shapes'), shapeRng = [sh.fork('g0'), sh.fork('g1'), sh.fork('g2')];
  const geos = ['boulder', 'rock', 'slab'].map((kind, i) => { const g = T.rockGeometry({ rng: shapeRng[i], kind, detail: 1, radius: 1 });
    const p = g.getAttribute('position'), k = new Float32Array(p.count); let lo = 1e9, hi = -1e9; for (let j = 0; j < p.count; j++) { lo = Math.min(lo, p.getY(j)); hi = Math.max(hi, p.getY(j)); }
    for (let j = 0; j < p.count; j++) k[j] = (p.getY(j) - lo) / Math.max(1e-3, hi - lo); g.setAttribute('aK', new THREE.BufferAttribute(k, 1)); return g; });
  await ctx.yield();
  const uniforms = { ...sharedUniforms(S), uIceA: { value: new THREE.Color('#3b3942') }, uIceB: { value: new THREE.Color('#15141a') }, uFrost: { value: new THREE.Color(0.6, 0.66, 0.75) },
    uAshCol: { value: new THREE.Color('#1c1a1f') }, uGlowIce: { value: new THREE.Color(0, 0, 0) }, uSeracP: { value: new THREE.Vector2(o.mx ?? 1, 0.8) } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: SERAC_VS, fragmentShader: SERAC_FS });
  const lists = [[], [], []], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), H = o.half, count = o.count ?? 320;
  let refused = 0;
  const put = (x, z, sc) => { if (o.blocked && o.blocked(x, z)) return false;
    if (o.gap) { const gy = o.ground(x, z); if (o.gap(x, gy - sc, gy + sc, z) < sc * 1.3 + (o.margin ?? 3)) { refused++; return false; } }
    const kind = rng.int(0, 2);
    e.set(rng.range(-0.5, 0.5), rng.range(0, 6.28), rng.range(-0.5, 0.5)); q.setFromEuler(e); sv.set(sc * rng.range(0.8, 1.3), sc * rng.range(0.6, 1), sc * rng.range(0.8, 1.3)); pv.set(x, o.ground(x, z) - sc * 0.22, z);
    lists[kind].push(m4.compose(pv, q, sv).clone()); return true; };
  let n = 0, tries = 0;
  while (n < count && tries < count * 8) {
    tries++;
    const r = rng(), size = lerp(0.25, 2.6, Math.pow(rng(), 3));
    let x, z;
    if (r < 0.62) { const sx = rng.sign(); z = rng.range(-520, 215); x = sx * (H - 34 + 60 * Math.pow(rng(), 0.8) + 14 * Math.sin(z / 47)); }                    // the lateral moraines
    else if (r < 0.9) { z = rng.range(-215, 205); x = -62 + 10 * Math.sin(z / 60) + rng.range(-1, 1) * rng.range(0, 9); }                                        // the medial stripe
    else { z = rng.range(-95, 20); x = rng.sign() * rng.range(7, 30); }                                                                                             // strays by the way in
    if (put(x, z, size)) n++;
    if (tries % 40 === 0) await ctx.yield();
  }
  let triangles = 0;
  for (let i = 0; i < 3; i++) { if (!lists[i].length) continue; const im = new THREE.InstancedMesh(geos[i], mat, lists[i].length); lists[i].forEach((m, j) => im.setMatrixAt(j, m)); im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere(); im.name = 'moraine-' + i; object.add(im); triangles += lists[i].length * triCount(geos[i]); }
  return { object, uniforms, triangles, count: n, clearance: { refused } };
}
