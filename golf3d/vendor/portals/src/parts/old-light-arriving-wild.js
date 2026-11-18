// OLD LIGHT ARRIVING, the wild things: the white river birds of the reed island and the seed-down in the air. Unmirrored frame, under
// the world group. Both are laid by the place: the birds by the island, the down by the ground and water under each fleck.
import * as THREE from 'three';
import { LIGHT_GLSL, TOWN_LIT_GLSL, BOWL, groundH } from './old-light-arriving-common.js';

// ---- the white river birds. THEIR OWN ROUND, ON THE WORLD'S CLOCK, whether or not anyone comes: each RESTS on its own spot among the
// reeds of the island, then rises, wheels once round a loop of its own over the reeds and the pool beside them, and settles on its
// spot again; and so again and again. They go up in FLIGHTS: the island's birds are dealt among six flights, each with its own period
// (34 to 58 seconds), its own drawn phase and its own way of wheeling (a bearing, a breadth, a hand); a bird lifts within two and a
// half seconds of its flight's time, on a loop near its flight's. A bird's loop is an oval through its spot (2R long on its bearing,
// 2kR across); it flies it in its own time (8 to 11 m/s on the average, easing off the reeds and back on to them) and rests for the
// remainder of the period. A flight's bearing is dealt within 60 degrees of due west of the spot and a bird's own within 17 more
// (77 at the most), away from the road's side of the island: that is the island's lee and the pool's quiet water. A loop goes out
// westward, but its breadth can carry it some metres east of its spot. Nothing here reads the flight.
// opts: { R: the birds' stream, island: [x, z], rx, rz: the island's half sizes, n }
export function makeBirds(LU, opts) {
  const { R, island, n } = opts, P = [], K = [], I = [];
  // a body (a slim diamond) and two wings of two triangles each; K: 0 body, +-1 wing (its side)
  { const b = [[0, 0.02, -0.3], [0.07, 0, 0], [0, 0.07, 0.02], [-0.07, 0, 0], [0, -0.05, 0], [0, 0.01, 0.26]];
    for (const q of b) { P.push(...q); K.push(0); }
    for (const f of [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]]) I.push(...f);
    for (const sg of [-1, 1]) { const s = P.length / 3; for (const q of [[0.05, -0.1], [0.05, 0.09], [0.34, -0.14], [0.34, 0.07], [0.6, -0.02]]) { P.push(q[0], 0, q[1]); K.push(sg); }
      I.push(s, s + 1, s + 2, s + 1, s + 3, s + 2, s + 2, s + 3, s + 4); } }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); g.setIndex(I);
  const aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aC = new Float32Array(n * 4), course = [], FLIGHTS = 6, flights = [];
  for (let f = 0; f < FLIGHTS; f++) { const period = R.range(34, 58); flights.push({ period, phase: R() * period, bearing: R.range(-60, 60) * Math.PI / 180, r: R.range(14, 30), k: R.range(0.45, 0.8) * (R() < 0.5 ? -1 : 1) }); }
  for (let i = 0; i < n; i++) {
    const a = R() * 6.283, r = Math.sqrt(R()) * 0.9, x = island[0] + Math.cos(a) * r * opts.rx, z = island[1] + Math.sin(a) * r * opts.rz, F = flights[i % FLIGHTS];
    const th = F.bearing + R.range(-0.3, 0.3), dx = -Math.cos(th), dz = Math.sin(th), rr = F.r * R.range(0.75, 1.25), k = F.k * R.range(0.85, 1.15), h = R.range(5, 15);
    const round = 6.2832 * rr * Math.sqrt((1 + k * k) / 2), secs = round / R.range(8, 11);      // the loop's length round, and the seconds this bird takes over it
    aA.set([x, z, secs, F.period], i * 4); aB.set([dx, dz, rr, h], i * 4); aC.set([k, R.range(0.25, 1.3), F.phase - R() * 2.5, R() * 6.283], i * 4);
    course.push({ x, z, dx, dz, rr, k, h });
  }
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); g.instanceCount = n;
  const U = { ...LU };
  const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aK; attribute vec4 aA, aB, aC; varying vec3 vW; varying float vK; ${LIGHT_GLSL}
      void main(){ float tt = mod(uTime + aC.z, max(aA.w, 1.)), sr = clamp(tt / max(aA.z, 1.), 0., 1.), s = sr*sr*(3. - 2.*sr);      // its place in its round: 0 to 1 round the loop, then at rest till the period ends
        float fly = smoothstep(0., .05, sr) * (1. - smoothstep(.95, 1., sr));                          // 0 at rest on its spot
        vec2 dA = aB.xy, dB = vec2(-dA.y, dA.x); float a2 = 6.2831853*s;
        vec2 xz = aA.xy + aB.z * ((1. - cos(a2))*dA + aC.x*sin(a2)*dB);
        float y = aC.y * (1. - fly) + fly * (1.2 + aB.w * sin(3.14159265*s) + .5*sin(uTime*.9 + aC.w));
        // its heading: along its loop when it flies, as it happened to stand when it rests
        float h0 = aC.w * 3.; vec2 fw = normalize(mix(vec2(sin(h0), cos(h0)), sin(a2)*dA + aC.x*cos(a2)*dB, fly) + vec2(1e-4, 0.));      // (never the zero vector)
        vec2 rt = vec2(-fw.y, fw.x);
        float beat = sin(uTime*(7. + 2.*fract(aC.w*3.7)) + aC.w*5.), ang = mix(-1.25, .15 + .75*beat, fly), span = mix(.42, 1., fly);      // folded at rest
        vec3 p = position; float sg = aK, wing = abs(sg);
        float lat = mix(p.x, sg * p.x * span * cos(ang), wing), up = mix(p.y, p.x * span * sin(ang) + .02, wing);
        vec3 wp = vec3(xz.x, y, xz.y) + vec3(rt.x, 0., rt.y) * lat + vec3(0., up, 0.) - vec3(fw.x, 0., fw.y) * p.z;
        vK = wing; vec4 w = modelMatrix*vec4(wp, 1.); vW = olaW(w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec3 vW; varying float vK; ${LIGHT_GLSL} ${TOWN_LIT_GLSL}
      void main(){ vec3 c = mix(vec3(.80,.83,.88), vec3(.72,.75,.82), vK) * (olaLight(vec3(0., 1., 0.), olaTownLit(vW))*.7 + olaLight(vec3(0., -1., 0.), 0.)*.3);      // (the star's light on a bird by the bird's own place: the island lies in the town's hill's shade)
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  // the nearest any bird comes to the road AT ANY PHASE OF ITS ROUND, for the clearance test (dist: (x, y, z) -> metres from the road):
  // every bird's own loop at 49 places round it, at the height it flies there by the law above, less its rise and fall on the clock
  // (half a metre) and its wing (0.6 m); its rest is the loop's first and last place
  const nearest = (dist) => { let m = 1e9; for (const c of course) for (let j = 0; j <= 48; j++) { const s = j / 48, a2 = 6.2832 * s, u = c.rr * (1 - Math.cos(a2)), v = c.rr * c.k * Math.sin(a2);
    m = Math.min(m, dist(c.x + u * c.dx - v * c.dz, 1.2 + c.h * Math.sin(Math.PI * s), c.z + u * c.dz + v * c.dx) - 1.1); }
    return m; };
  return { object: mesh, uniforms: U, count: n, nearest };
}

// ---- seed-down: a layer of the evening's air over ground and water. Every fleck rides at its own height ABOVE THE SURFACE UNDER IT
// (ground or water at its own map point), thick in the first few metres and thinner aloft, whatever height the eye is at; it drifts on
// the wind and takes the light there is (grey, never a bright point; near the arch, the arch's own pale light). Inside the bowl, which is a
// hollow out of the river's wind, there is little of it: each fleck is thinned by its own place (inside the rim's radius and below the
// rim's height). A fleck is a thing of TRUE SIZE, two to three centimetres across:
//  - its far end is its FOOTPRINT: under a pixel and a half across it goes to its mean, which is nothing to see, and is not drawn;
//  - so the down is DRAWN ONLY NEAR THE EYE: the build lays ONE BLOCK of the evening's air, downBlock() metres square on the map (the
//    same for every lens and every picture), and every fleck keeps its own place in that block, which is repeated over the whole
//    country like a tile: the eye is always inside one copy of it. The fall is thin, DOWN_PER_M2 flecks over each square metre of
//    ground (a little under one over every two square metres, most of it within a few metres of the surface). THE BLOCK'S EDGE
//    STANDS BEYOND THE FOOTPRINT'S REACH on the largest picture the flight is watched at, so that no fleck is still to be seen
//    where the block ends: the footprint's law lets the largest fleck (three centimetres across) go at DOWN_GONE of a pixel,
//    which on a picture of DOWN_ROWS rows through this world's lens (62 degrees) is a depth of 72.2 m into the view; at the
//    corner of a picture of DOWN_ASPECT that depth lies 1.582 times as far from the eye (114.3 m), and a fleck wanders half a
//    metre: the block reaches 115 m to every side of the eye's map point, 230 m square, and holds 24,493 flecks (downBlock
//    below reckons it from those numbers; the down is not drawn while the world is seen through a portal);
//  - its near end is the distance from the fleck to the eye's PLACE: it thins away inside seven metres (a fleck against the lens is a
//    pale ball).
// opts.arch: [x, y, z] the arch's middle (the unmirrored frame).
// opts: { R: the down's stream, block: the block's width (downBlock), count, wind: [x, z] m/s, pause }
const HX0 = -330, HZ0 = -1010, HSTEP = 5, HNX = 179, HNZ = 275;      // the height map: 5 m cells over the whole country the road crosses
export const DOWN_R = 0.015;      // a fleck's radius at its largest, metres
export const DOWN_PER_M2 = 0.463;      // the down's thickness: flecks over a square metre of ground
// the largest picture the flight is watched at (the rows of the engine's highest tier, sixteen by nine), and the footprint's law: how
// many pixels across a fleck is when it is let go (the shader below reads the same number)
export const DOWN_ROWS = 2170, DOWN_ASPECT = 16 / 9, DOWN_GONE = 0.75;
// THE BLOCK OF AIR THE BUILD LAYS, metres square on the map, for a lens of fovDeg degrees: twice the reach reckoned above (the depth at
// which the largest fleck is gone on that picture, taken to the picture's corner, and the half metre a fleck wanders), to the whole metre
export const downBlock = (fovDeg) => { const t = Math.tan(fovDeg * Math.PI / 360), depth = 2 * DOWN_R / DOWN_GONE * DOWN_ROWS / 2 / t;
  return 2 * Math.ceil(depth * Math.sqrt(1 + DOWN_ASPECT * DOWN_ASPECT * t * t + t * t) + 0.5); };
export async function makeDown(LU, opts) {
  const { R, count } = opts, pause = opts.pause || (async () => {});
  const hd = new Float32Array(HNX * HNZ * 4);
  for (let j = 0; j < HNZ; j++) { if (j % 16 === 15) await pause(); for (let i = 0; i < HNX; i++) hd[(j * HNX + i) * 4] = groundH(HX0 + i * HSTEP, HZ0 + j * HSTEP); }
  const tex = new THREE.DataTexture(hd, HNX, HNZ, THREE.RGBAFormat, THREE.FloatType); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));      // (one triangle holds a fleck's round)
  const aS = new Float32Array(count * 4), aT = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { const low = R() < 0.75, lift = Math.min(0.4 - (low ? 6 : 45) * Math.log(1 - 0.98 * R()), 170);      // metres above the surface: most of it low
    aS.set([R(), R(), lift, R.range(DOWN_R * 0.65, DOWN_R)], i * 4); aT.set([R() * 6.283, R.range(0.6, 1.3), R(), R()], i * 4); }
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); g.instanceCount = count;
  const arch = opts.arch || [0, -1e4, 0];
  const U = { ...LU, uH: { value: tex }, uEye: { value: new THREE.Vector3() }, uWindV: { value: new THREE.Vector2(opts.wind[0], opts.wind[1]) }, uShow: { value: 1 }, uW: { value: opts.block }, uRes: opts.RU ? opts.RU.uRes : { value: new THREE.Vector2(1280, 720) }, uArch: { value: new THREE.Vector3(arch[0], arch[1], arch[2]) } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aS, aT; uniform sampler2D uH; uniform vec3 uEye; uniform vec2 uWindV, uRes; uniform float uShow, uW; varying vec2 vQ; varying float vA; varying vec3 vW; ${LIGHT_GLSL}
      float hAt(vec2 c){ return texture2D(uH, (clamp(c, vec2(0.), vec2(${HNX - 1}., ${HNZ - 1}.)) + .5) / vec2(${HNX}., ${HNZ}.)).r; }
      float surf(vec2 p){ vec2 c = (p - vec2(${HX0}., ${HZ0}.)) / ${HSTEP}., i = floor(c), f = c - i;
        return mix(mix(hAt(i), hAt(i + vec2(1., 0.)), f.x), mix(hAt(i + vec2(0., 1.)), hAt(i + vec2(1., 1.)), f.x), f.y); }
      void main(){ vec2 drift = uWindV * uTime * aT.y;
        float W = uW;                                                                                // (the block's one width, for every picture)
        vec2 xz = uEye.xz + (fract(aS.xy + (drift - uEye.xz)/W) - .5) * W;                           // its own place on the map (in the copy of the block the eye is in): it is carried by the wind, not by the eye
        xz += vec2(sin(uTime*.6 + aT.x), cos(uTime*.47 + aT.x*1.7)) * .5;
        float y = max(surf(xz), 0.) + aS.z + .35*sin(uTime*.7 + aT.x*2.3);
        vec4 w = modelMatrix*vec4(xz.x, y, xz.y, 1.); vW = olaW(w.xyz); vec4 mv = viewMatrix*w;
        // thinned by its own place: little down is carried into the bowl's hollow (inside the rim's radius, below the rim's height)
        float r = length(xz - vec2(${BOWL.c[0]}., ${BOWL.c[1]}.)), hollow = (1. - smoothstep(${BOWL.low}., ${BOWL.rim}., r)) * step(y, ${BOWL.yRim}.);
        float dEye = length(w.xyz - cameraPosition), px = max(-mv.z * 2. / (projectionMatrix[1][1] * max(uRes.y, 1.)), 1e-5);      // metres to the eye's place; metres under a pixel there
        vA = uShow * (1. - .85*hollow) * smoothstep(${DOWN_GONE.toFixed(2)}, 1.5, 2.*aS.w/px) * smoothstep(2., 7., dEye);
        vQ = position.xy; mv.xy += position.xy * aS.w; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`uniform vec3 uArch; varying vec2 vQ; varying float vA; varying vec3 vW; ${LIGHT_GLSL} ${TOWN_LIT_GLSL}
      void main(){ float r2 = dot(vQ, vQ), a = (1. - smoothstep(.25, 1., r2)) * vA * .7; if (a < .004) discard;
        vec3 c = mix(vec3(.42,.45,.53), vec3(.6,.63,.7), uSnow) * (olaLight(vec3(0., 1., 0.), olaTownLit(vW)) + vec3(.71,.80,1.) * 1.1 * exp(-min(length(vW - uArch), 400.)/26.));      // grey down (white flakes on a snow visit) in the light there is at the fleck's own place: dim under the lamps and in the town's hill's shade from the star, silver where the star's light falls, pale in the arch's own light
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), a); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { object: mesh, uniforms: U, count };
}

// ---- chimney smoke: a thin plume over a house that keeps a fire in. Each plume is a short string of soft puffs that rise SMOKE_RISE
// metres, lean away on the evening's wind as they rise, widen and thin to nothing: slow, pale blue-grey in the night's light, a little
// warm where it leaves the stack. A puff is a body of true size (a radius of 0.5 m at the stack, 3.8 m where it dies); under a pixel and a half
// across it thins by its footprint. Every plume starts at its own seeded phase.
// items: [{ p: [x, y, z] the stack's top, ph: 0..1 }]; wind: [x, z] the wind's direction on the map
export const SMOKE_RISE = 16, SMOKE_LEAN = 9;
export function makeSmoke(LU, RU, items, wind = [0.9, -0.44]) {
  const N = 6, n = items.length * N, g = new THREE.InstancedBufferGeometry(), aP = new Float32Array(n * 4), aI = new Float32Array(n);
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));      // (one triangle holds a puff's round)
  items.forEach((it, i) => { for (let k = 0; k < N; k++) { aP.set([it.p[0], it.p[1], it.p[2], it.ph], (i * N + k) * 4); aI[i * N + k] = k / N; } });
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 1)); g.instanceCount = n;
  const wl = Math.hypot(wind[0], wind[1]) || 1;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uRes: RU.uRes, uWindV: { value: new THREE.Vector2(wind[0] / wl, wind[1] / wl) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aP; attribute float aI; uniform vec2 uRes, uWindV; varying vec2 vQ; varying float vA, vAge; varying vec3 vW; ${LIGHT_GLSL}
      void main(){ float age = fract(uTime*(.06 + .02*fract(aP.w*7.3)) + aI + aP.w), size = .5 + 3.3*age;      // a puff lives twelve to seventeen seconds
        vec3 p = aP.xyz + vec3(0., ${SMOKE_RISE}.*age, 0.) + vec3(uWindV.x, 0., uWindV.y) * ${SMOKE_LEAN}.*age*age
               + vec3(sin(aP.w*40. + age*5. + aI*9.), 0., cos(aP.w*23. + age*4. + aI*7.)) * .6*age;
        vec4 w = modelMatrix*vec4(p, 1.); vW = olaW(w.xyz); vec4 mv = viewMatrix*w;
        float px = max(-mv.z * 2. / (projectionMatrix[1][1] * max(uRes.y, 1.)), 1e-5);
        vA = smoothstep(0., .06, age) * (1. - age)*(1. - age) * .7 * clamp(size/(1.5*px), 0., 1.); vAge = age;
        vQ = position.xy; mv.xy += position.xy * size; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`varying vec2 vQ; varying float vA, vAge; varying vec3 vW; ${LIGHT_GLSL} ${TOWN_LIT_GLSL}
      void main(){ float r2 = dot(vQ, vQ), a = vA * exp(-min(r2*2.6, 40.)) * (1. - smoothstep(.7, 1., r2)); if (a < .004) discard;
        vec3 c = vec3(.6,.62,.7) * (olaLight(vec3(0., 1., 0.), olaTownLit(vW)) + vec3(.07,.075,.09)) + vec3(1., .44, .095) * (.035 + .1 * (1. - vAge)*(1. - vAge));      // (pale in the night's light, warmed from below by the town's lamps)
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), a); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3.5;
  return { object: mesh, material: mat, count: items.length };
}
