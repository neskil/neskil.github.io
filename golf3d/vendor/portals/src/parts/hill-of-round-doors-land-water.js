// hill-of-round-doors, the land builder's part: THE STREAM AND THE MILL POND. Clear slow water at the plan's level
// along the plan's stream, from one end of the ground to the other, on a ribbon of our own that follows the stream
// and is finest at its banks. Its material is ours (the kit's waters lend only their reading of the sky's colours):
// it holds the sky by the angle of view, shows its bed through the shallows and goes dark over the deep middle,
// carries slow low waves downstream, to the west, glitters toward the sun and is churned white below the mill's
// wheel. THE WEIR is a sill across the pond's foot, from the low wall of the mill's race to the south bank: a glassy
// lip, white water streaming from it, foam trailing away downstream by the world's clock.
import * as Water from '../kit/water.js';
import { LAND_NOISE, LAND_PARS } from './hill-of-round-doors-land-glsl.js';
import { streamZ, streamHalf, WATER, MILL } from './hill-of-round-doors-plan.js';

// the weir's line: from the west end of the race's low wall (the field builder's, by the plan's MILL) to the south bank
export const WEIR = { x0: MILL.wheel.x - MILL.wheel.r - 5, z0: MILL.wheel.z + MILL.wheel.thick / 2 + 1.75, x1: MILL.wheel.x - MILL.wheel.r - 9, run: 11 };
WEIR.z1 = streamZ(WEIR.x1) + streamHalf(WEIR.x1) + 2.5;

// o: { THREE, sky, uniforms, heightAt (the ground mesh's own surface) }
export function makeWater(ctx, o) {
  const { THREE, sky, uniforms, heightAt } = o, group = new THREE.Group(); group.name = 'hill-water';
  // ---- the ribbon: columns along x (4 m apart by the village, wider beyond), thirteen stations across
  const xs = []; for (let x = -640; x < 704;) { xs.push(x); x += Math.abs(x - 20) < 250 ? 4 : 16; } xs.push(704);
  const pos = [], dep = [], idx = [], A = 13;
  for (const x of xs) {
    const zc = streamZ(x), h = streamHalf(x), offs = [h + 5.5, h + 3, h + 1.2, h - 1.5, h - 5, h * 0.45];
    const row = [...offs.map((v) => -v), 0, ...offs.slice().reverse()];
    for (const off of row) { const z = zc + off; pos.push(x, 0, z); dep.push(WATER - heightAt(x, z)); }
  }
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < A - 1; j++) { const a = i * A + j, b = a + 1, c = a + A, d = c + 1; idx.push(a, b, c, b, d, c); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(dep, 1));
  geo.setIndex(idx); geo.computeBoundingSphere();
  // ---- the water's own material. It holds the sky by the angle of view (the sky's own colours, as the kit's
  // waters read them from it), the far bank low in the mirror, and its own body under that: clear and pale over
  // the shallows, dark in the deep middle. Slow trains of low waves run downstream and show as bands of the sky's
  // blue and gold; the sun glitters on them; below the mill's wheel the water is churned white. At its edge it
  // thins to nothing over the bed, so the bank is soft.
  const L = Water.waterLight(sky), wheel = MILL.wheel;
  const material = new THREE.ShaderMaterial({ name: 'hill-stream', transparent: true, depthWrite: false,
    uniforms: { ...uniforms, uZen: { value: L.zenith.clone() }, uMid: { value: L.mid.clone() }, uHor: { value: L.horizon.clone() },
      uDeepC: { value: new THREE.Color('#123a34') }, uShalC: { value: new THREE.Color('#7aa890') }, uTimber: { value: new THREE.Color('#8a6644') },
      uWheel: { value: new THREE.Vector4(wheel.x, wheel.z, wheel.r, wheel.thick) } },
    vertexShader: /* glsl */`
attribute float aDepth; varying vec3 vW; varying float vDeep, vDepth;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vDeep = aDepth; vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: LAND_NOISE + LAND_PARS + /* glsl */`
uniform vec3 uZen, uMid, uHor, uDeepC, uShalC, uTimber; uniform vec4 uWheel;
varying vec3 vW; varying float vDeep, vDepth;
void main(){
  vec2 p = vW.xz; vec3 toCam = cameraPosition - vW; vec3 V = toCam / (length(toCam) + 1e-4);
  float px = max(length(dFdx(p)), length(dFdy(p))), t = uTime;
  // the wheel's wake: from under the wheel downstream along the race, widening
  float sx = uWheel.x - p.x, sz = abs(p.y - uWheel.y);
  float wake = smoothstep(-uWheel.z * .5, uWheel.z * .2, sx) * (1. - smoothstep(uWheel.z * 1.4, uWheel.z * 3.6, sx)) * (1. - smoothstep(uWheel.w * .8 + sx * .12, uWheel.w * 1.5 + sx * .2, sz));
  // four trains of low waves, their lines wandering; a train is left out as its waves grow finer than the pixel
  // (and each comes and goes in broad patches, so no two reaches of the water are ruled alike)
  vec2 q = p + (vec2(vnoise(p * .16 + 3.), vnoise(p * .16 + 9.)) - .5) * 3.6, g = vec2(0.);
  float e1 = .3 + 1.4 * vnoise(p * .11 + 17.), e2 = .3 + 1.4 * vnoise(p * .23 + 29.);
  g += vec2(-.94, .34) * (cos(dot(q, vec2(-.94, .34)) * 1.21 + t * .9) * .05 * e1 * (1. - smoothstep(1., 2.8, px)));
  g += vec2(-.71, -.71) * (cos(dot(q, vec2(-.71, -.71)) * 2.17 - t * 1.1) * .045 * e2 * (1. - smoothstep(.6, 1.6, px)));
  g += vec2(-.34, .94) * (cos(dot(q, vec2(-.34, .94)) * 4.8 + t * 1.6) * .04 * e1 * (1. - smoothstep(.26, .7, px)));
  g += vec2(-1., .1) * (cos(dot(q, vec2(-1., .1)) * 10.5 + t * 2.4) * .03 * e2 * (1. - smoothstep(.12, .32, px)));
  g *= 1. + 2.4 * wake;
  vec3 N = normalize(vec3(-g.x, 1., -g.y)), R = reflect(-V, N); R.y = abs(R.y);
  // the sky in the mirror: gold at the horizon, blue overhead, warmer toward the sun; low down, the far bank
  vec3 sky = mix(uHor, uMid, smoothstep(0., .3, R.y)); sky = mix(sky, uZen, smoothstep(.25, .95, R.y));
  float sd = max(dot(R, uSunDir), 0.); sd *= sd; sky += uHor * (sd * sd * .35);
  vec3 sh = landShade(p); float sun = sh.r * landCloud(p);
  vec3 irr = (uSunCol * (max(uSunDir.y, 0.) * sun) + uSkyCol) * .31831;
  float bank = 1. - smoothstep(.05, .17, R.y + g.x * .8);
  sky = mix(sky, uTurf * irr * 1.7, bank * .85);
  // the mill in the mirror: its south gable (the plan's box, its eaves and its ridge) where the mirrored ray meets it
  float tz = (${MILL.z1.toFixed(1)} - p.y) / min(R.z, -1e-3), mx = abs(p.x + R.x * tz - ${((MILL.x0 + MILL.x1) / 2).toFixed(1)}), mh = ${((MILL.x1 - MILL.x0) / 2).toFixed(1)};
  float roof = ${MILL.eaves.toFixed(1)} + ${(MILL.ridge - MILL.eaves).toFixed(1)} * (1. - mx / mh);
  float gable = step(0., tz) * (1. - smoothstep(mh - .8, mh, mx)) * (1. - smoothstep(roof - 1., roof, ${WATER.toFixed(2)} + R.y * tz));
  sky = mix(sky, uTimber * irr, gable * .8);
  float f1 = 1. - max(dot(N, V), 0.), f2 = f1 * f1, F = .03 + .97 * f2 * f2 * f1;
  float deep = max(vDeep, 0.), dk = 1. - exp(-deep * .85);
  vec3 col = mix(mix(uShalC, uDeepC, dk) * irr, sky, F);
  // the sun's glitter on the waves (the half vector's cosine to the 128th, by squaring)
  float hs = max(dot(N, normalize(V + uSunDir + vec3(0., 1e-3, 0.))), 0.); hs *= hs; hs *= hs; hs *= hs; hs *= hs; hs *= hs; hs *= hs; hs *= hs;
  col += uSunCol * (hs * .6 * (1. - bank) * sun);
  // the wake's foam, torn into streaks that drift downstream
  float foam = wake * smoothstep(.46, .74, vnoise(vec2((p.x + t * 1.3) * .5, p.y * 1.7)) * .6 + vnoise(vec2((p.x + t * 2.1) * 1.3, p.y * 3.3) + 5.) * .4);
  col = mix(col, vec3(.86, .9, .88) * irr, foam * .85);
  float a = smoothstep(0., .07, vDeep) * clamp(F + (1. - F) * (1. - exp(-deep * 2.4)) + foam, 0., 1.);
  gl_FragColor = vec4(landFog(col, vDepth, 0.), a);
  if (vDeep <= 0.) discard;
}` });
  const stream = new THREE.Mesh(geo, material); stream.position.y = WATER; stream.name = 'hill-stream'; stream.renderOrder = 2; group.add(stream);
  // ---- the weir: a strip from the sill downstream, drawn over the water
  const n = 20, wp = [], wu = [], wi = [], len = Math.hypot(WEIR.x1 - WEIR.x0, WEIR.z1 - WEIR.z0);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = WEIR.x0 + (WEIR.x1 - WEIR.x0) * t, z = WEIR.z0 + (WEIR.z1 - WEIR.z0) * t;
    wp.push(x + 1.2, WATER + 0.05, z, x - WEIR.run, WATER + 0.05, z - 1.5 * (t - 0.5)); wu.push(t * len, -0.11, t * len, 1);
    if (i < n) { const a = i * 2; wi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const wgeo = new THREE.BufferGeometry();
  wgeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wgeo.setAttribute('uv', new THREE.Float32BufferAttribute(wu, 2)); wgeo.setIndex(wi);
  const wmat = new THREE.ShaderMaterial({ name: 'hill-weir', uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
varying vec2 vUv; varying float vDepth; varying vec3 vW;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: LAND_NOISE + LAND_PARS + /* glsl */`
varying vec2 vUv; varying float vDepth; varying vec3 vW;
void main(){
  float s = vUv.x, v = vUv.y, run = v * ${WEIR.run.toFixed(1)};
  // the smooth lip over the sill, then the white sheet breaking into streaks, then foam drifting off in patches
  float lip = smoothstep(-.11, -.02, v) * (1. - smoothstep(-.02, .03, v));
  float streak = vnoise(vec2(s * 2.6, run * .5 - uTime * 2.4)) * .6 + vnoise(vec2(s * 7., run * 1.3 - uTime * 3.6) + 3.) * .4;
  float sheet = smoothstep(.0, .05, v) * (1. - smoothstep(.1, .38, v + (streak - .5) * .2));
  float patchy = smoothstep(.42, .7, vnoise(vec2(s * .55, run * .32 - uTime * .55) + 11.) * .65 + streak * .45);
  float foam = max(sheet * (.55 + .45 * streak), patchy * (1. - smoothstep(.3, 1., v)) * smoothstep(.04, .2, v));
  vec3 lit = (uSunCol * max(uSunDir.y, 0.) * landShade(vW.xz).r + uSkyCol) * .31831;
  vec3 c = mix(vec3(.05, .08, .07) * lit, vec3(.9, .93, .9) * lit, foam);
  float a = max(lip * .55, foam) * smoothstep(0., .04, min(s, ${len.toFixed(2)} - s) * .25);
  gl_FragColor = vec4(landFog(c, vDepth, 0.), a);
}` });
  const weir = new THREE.Mesh(wgeo, wmat); weir.name = 'hill-weir'; weir.renderOrder = 3; group.add(weir);
  return { object: group, triangles: idx.length / 3 + wi.length / 3,
    dispose() { geo.dispose(); material.dispose(); wgeo.dispose(); wmat.dispose(); } };
}
