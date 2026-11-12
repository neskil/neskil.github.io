// THE WORLD TURTLE: a small lit world rides through a nebula on the shell of a star-turtle.
// The hero (src/parts/world-turtle.js) carries the shell-world, Rimfall, head, flippers, sun hoop and the
// portal's ice ring. This file adds deep space around it (baked nebula sky, an edge-on galaxy, other
// turtles far away), the stardust stream that sells its swimming, comet-fish schools, birds, clouds and
// lanterns over the shell-world, shooting stars and stardust currents, and composes the flight.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, flightRoute } from '../parts/world-turtle.js';

const PALETTE = ['#05030f', '#2a1a5a', '#c94f9a', '#2fb8a8', '#3f8a4a', '#c9a86a', '#ffe9a8'];
const V3 = THREE.Vector3;

// ---------------------------------------------------------------- comet-fish
// Instanced ribbons. Every fish follows a closed loop in the object's local XZ plane; a vertex at tail
// fraction s sits where the head was s * uTail seconds ago, so tails trail along the real trajectory.
const FISH_VERT = /* glsl */`
attribute vec4 iA;   // phase 0..1, cross-section radius, cross-section angle, speed multiplier
attribute vec4 iB;   // size, hue 0..1, wobble, seed
uniform float uTime, uSpeed, uTail, uE, uAvoid;
uniform vec3 uAx, uCam;
varying float vS, vSide, vFade, vSeed;
varying vec3 vCol;
uniform vec3 uColA, uColB, uColC;
// No comet-fish swims nearer to the route of the flight than uKeep metres (one and a half lengths of its own ribbon). uRt is
// the route near this school, in the school's own frame, at even steps of metres. A fish whose loop would pass within twice
// that margin of the route is carried out, smoothly, to between one and two margins from it: the school parts round the
// line the visitor flies and closes again beyond it. The same rule for every school, the whole flight long.
uniform vec3 uRt[24]; uniform float uKeep;
vec3 keepOff(vec3 c){
  vec3 q = vec3(0.); float ws = 0.;
  for(int i = 0; i < 24; i++){ vec3 d = c - uRt[i]; float w = 1./(dot(d, d) + 4.); w *= w; w *= w; q += uRt[i]*w; ws += w; }
  if(ws < 1e-30) return c;
  q /= ws;                                   // the nearest place of the route, taken smoothly over its samples
  vec3 d = c - q; float l = length(d);
  float l2 = l < 2.*uKeep ? uKeep + l*l/(4.*uKeep) : l;
  return q + (l > 1e-3 ? d/l : vec3(0., 1., 0.))*l2;
}
vec3 traj(float tt){
  float th = iA.x*6.2831853 + tt*uSpeed*iA.w;
  float ph = th - uE*sin(2.*th);
  vec3 c = vec3(cos(ph)*uAx.x, 0., sin(ph)*uAx.z);
  vec3 radial = normalize(vec3(cos(ph)*uAx.z, 0., sin(ph)*uAx.x));
  float r = iA.y*(1. + .35*sin(ph*3. + iB.w*6.28));
  float ang = iA.z + .7*cos(ph*2. + iB.w*11.) + tt*.07*iB.z;
  c += radial*cos(ang)*r + vec3(0., sin(ang)*r*.8, 0.);
  c.y += uAx.y*sin(ph*2. + iB.w*3.1);
  float wig = tt*(2.2 + iB.z*1.6) + iB.w*40.;
  c += radial*sin(wig)*.55*iB.x + vec3(0., cos(wig*.8)*.4*iB.x, 0.);
  return c;
}
void main(){
  float s = position.x + .5; s *= s;
  float tt = uTime - s*uTail;
  vec3 p0 = traj(tt), q0 = traj(tt - .05), p = keepOff(p0), q = keepOff(q0);
  float whip = length(p - q)/max(length(p0 - q0), 1e-4);   // how hard the margin bends the ribbon here (1 = not at all)
  vec3 T = p - q; T = dot(T,T) > 1e-10 ? normalize(T) : vec3(0.,0.,1.);
  vec3 toCam = uCam - p; float dist = length(toCam);
  vec3 sd = cross(T, toCam); sd = dot(sd,sd) > 1e-10 ? normalize(sd) : vec3(0.,1.,0.);
  // teardrop head, a pair of fin flares behind it, then a ribbon tail that widens before it tapers
  float hb = .32*pow(max(sin(3.14159265*clamp(s/.12, 0., 1.)), 0.), .7);
  float fin = .2*exp(-pow((s - .085)/.03, 2.));
  float rib = .45*smoothstep(.07, .3, s)*pow(clamp((1. - s)/.7, 0., 1.), 1.25);
  float w = iB.x*max(max(hb + fin, rib), .07*(1. - s));
  w = max(w, dist*.0019*(1. - s*.7));
  // ribbon flutter grows toward the tail tip
  p += sd*sin(s*13. - uTime*5.5 + iB.w*20.)*.55*iB.x*s;
  p += sd*position.y*w;
  vS = s; vSide = position.y; vSeed = iB.w;
  vCol = mix(mix(uColA, uColB, smoothstep(.0, .55, iB.y)), uColC, smoothstep(.55, 1., iB.y));
  vFade = smoothstep(uAvoid*.35, uAvoid*.9, dist)*(1. - smoothstep(1400., 2600., dist))*mix(.42, 1., smoothstep(18., 95., dist));   // calmer up close: no blown heads
  vFade *= 1. - smoothstep(2., 4.5, whip);     // a ribbon whipped round the margin's tube (its loop ran through the route itself) dims while it is drawn out
  gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(p, 1.);
}`;
const FISH_FRAG = /* glsl */`
uniform float uTime, uGain;
uniform vec3 uHead;
varying float vS, vSide, vFade, vSeed;
varying vec3 vCol;
void main(){
  // A ribbon thinner than a pixel is sampled past its own edges when the picture is antialiased: the across and along
  // coordinates and the fade are held to the ribbon's own range, or 1 - side*side runs to a large negative and its square glows.
  float side = clamp(vSide, -1., 1.), sv = clamp(vS, 0., 1.), fade = clamp(vFade, 0., 1.);
  float ac = 1. - side*side;
  float head = smoothstep(.1, .02, sv);
  float tail = (1. - sv);
  float pulse = .7 + .3*sin(sv*38. - uTime*7. + vSeed*30.);
  vec3 col = vCol*ac*(.25 + .75*ac)*tail*tail*pulse*1.15*(.55 + .45*smoothstep(.0, .5, abs(side)));   // brighter ribbon edges, like a fin
  col += uHead*head*ac*ac*1.5;
  col += vCol*head*ac*.9;
  gl_FragColor = vec4(col*fade*uGain, 1.);
}`;
function makeCometFish(rng, o) {
  const n = o.count, SEG = 14;
  const base = new THREE.PlaneGeometry(1, 2, SEG, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position);
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    A.set([rng(), Math.sqrt(rng()) * o.spread, rng() * 6.283, rng.range(0.82, 1.22)], i * 4);
    B.set([rng.range(o.size[0], o.size[1]) * (rng.chance(0.06) ? 1.3 : 1), rng(), rng(), rng()], i * 4);
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.instanceCount = n;
  const uniforms = {
    uTime: { value: 0 }, uSpeed: { value: o.speed }, uTail: { value: o.tail }, uE: { value: o.e ?? 0 }, uAvoid: { value: o.avoid ?? 16 },
    uAx: { value: new V3(o.ax[0], o.ax[1], o.ax[2]) }, uCam: { value: new V3(0, 1e5, 0) }, uGain: { value: o.gain ?? 1 },
    uColA: { value: new THREE.Color(o.colors[0]) }, uColB: { value: new THREE.Color(o.colors[1]) }, uColC: { value: new THREE.Color(o.colors[2]) },
    uHead: { value: new THREE.Color(o.head || '#fff1c8') },
    uKeep: { value: 0 }, uRt: { value: Array.from({ length: 24 }, () => new V3(0, 1e5, 0)) },
  };
  // the usual length of one of this school's ribbons (metres), and how far from its centre the school and its margin reach
  const ribbon = o.tail * o.speed * Math.max(o.ax[0], o.ax[2]), keep = 1.5 * ribbon;
  const reach = Math.max(o.ax[0], o.ax[2]) + Math.abs(o.ax[1]) + o.spread * 1.35 + 2 * keep;
  uniforms.uKeep.value = keep;
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 5;
  const tmp = new V3();
  return { object: mesh, uniforms, count: n, triangles: n * SEG * 2,
    // once the school stands in the world: the stretch of the route that passes within its reach, at even steps of metres, in its own frame
    keepFrom(path) {
      mesh.updateMatrixWorld(); const p = new V3(); let d0 = null, d1 = 0;
      for (let d = -200; d <= path.length + 200; d += 10) if (path.posAtDist(d, p).distanceTo(mesh.position) < reach) { if (d0 === null) d0 = d; d1 = d; }
      if (d0 !== null) uniforms.uRt.value.forEach((v, i) => mesh.worldToLocal(path.posAtDist(d0 + (d1 - d0) * i / 23, v)));
    },
    update(dt, time, camera) {
      uniforms.uTime.value = time;
      if (camera) { mesh.updateMatrixWorld(); tmp.setFromMatrixPosition(camera.matrixWorld); mesh.worldToLocal(tmp); uniforms.uCam.value.copy(tmp); }
    } };
}

// ---------------------------------------------------------------- distant turtles (specks with their own glow)
const FAR_VERT = /* glsl */`
attribute vec3 color; attribute vec2 aFlap;
uniform float uTime, uPhase;
varying vec3 vC, vN, vW;
void main(){
  vec3 p = position;
  float a = sin(uTime*.7 + uPhase - aFlap.x*1.4)*aFlap.x*.55;
  p.y += a*abs(p.x)*aFlap.y;
  vec4 wp = modelMatrix*vec4(p, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vC = color;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const FAR_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uFillA, uFillB, uGlow;
varying vec3 vC, vN, vW;
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float d = clamp(dot(N, uSun)*.6 + .4, 0., 1.);
  vec3 fill = mix(uFillA, uFillB, N.x*.5 + .5);
  float fr = pow(1. - abs(dot(N, V)), 2.5);
  vec3 col = vC*(uSunCol*d + fill) + uGlow*fr*.4;
  gl_FragColor = vec4(col, 1.);
}`;
function farTurtleGeometry() {
  const parts = [];
  const add = (geo, sx, sy, sz, x, y, z, col, flap, rotY = 0) => {
    geo.scale(sx, sy, sz); if (rotY) geo.rotateY(rotY); geo.translate(x, y, z);
    const n = geo.attributes.position.count, C = new Float32Array(n * 3), Fl = new Float32Array(n * 2), P = geo.attributes.position;
    for (let i = 0; i < n; i++) {
      const k = typeof col === 'function' ? col(P.getX(i), P.getY(i), P.getZ(i)) : col;
      C.set(k, i * 3); Fl.set([flap ? clamp((Math.abs(P.getX(i)) - 0.55) / 0.9, 0, 1) : 0, flap], i * 2);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.setAttribute('aFlap', new THREE.BufferAttribute(Fl, 2));
    parts.push(geo);
  };
  const sph = (w, h) => new THREE.SphereGeometry(1, w, h);
  // shell-world: green land, teal ring sea at the rim, a pale peak
  add(sph(20, 10), 1, 0.42, 1, 0, 0.1, 0, (x, y, z) => { const r = Math.hypot(x, z); return y > 0.42 ? [0.45, 0.43, 0.48] : r > 0.8 ? [0.06, 0.3, 0.3] : [0.1, 0.2 + 0.06 * Math.sin(x * 9 + z * 7), 0.1]; }, 0);
  add(sph(14, 6), 0.95, 0.3, 0.95, 0, -0.12, 0, [0.28, 0.2, 0.3], 0);                 // plastron
  add(sph(10, 6), 0.2, 0.17, 0.5, 0, -0.1, 1.25, [0.22, 0.14, 0.34], 0);             // neck
  add(sph(10, 6), 0.25, 0.2, 0.3, 0, -0.08, 1.82, [0.26, 0.17, 0.38], 0);            // head
  for (const sx of [-1, 1]) {
    add(sph(8, 5), 0.95, 0.05, 0.22, sx * 1.3, -0.1, 0.42, [0.2, 0.13, 0.32], 1, sx * 0.62);    // front flippers, long and swept back
    add(sph(8, 5), 0.46, 0.05, 0.17, sx * 0.88, -0.1, -0.85, [0.2, 0.13, 0.32], -0.7, sx * 0.75);  // rear flippers
  }
  // merge
  let nv = 0, ni = 0; for (const p of parts) { nv += p.attributes.position.count; ni += p.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), fl = new Float32Array(nv * 2), idx = new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const p of parts) {
    p.computeVertexNormals();
    pos.set(p.attributes.position.array, vo * 3); nor.set(p.attributes.normal.array, vo * 3); col.set(p.attributes.color.array, vo * 3); fl.set(p.attributes.aFlap.array, vo * 2);
    for (let i = 0; i < p.index.count; i++) idx[io + i] = p.index.array[i] + vo;
    vo += p.attributes.position.count; io += p.index.count; p.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aFlap', new THREE.BufferAttribute(fl, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ---------------------------------------------------------------- edge-on spiral galaxy (one additive quad)
const GAL_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv*2. - 1.; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const GAL_FRAG = /* glsl */`
uniform vec3 uCore, uArm, uDust; uniform float uTime, uSeed, uGain;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec2 p = vUv; float edge = smoothstep(1., .7, length(p));
  // the disc is seen 9 degrees from edge-on: squash y, then read spiral arms in the disc plane
  vec2 d = vec2(p.x, p.y/.16);
  float r = length(d), a = atan(d.y, d.x);
  float arms = .5 + .5*cos(2.*a - 7.*log(r + .06) + uSeed + uTime*.01);
  float n = vn(d*7. + uSeed)*.6 + vn(d*19. + uSeed*2.)*.4;
  float disc = exp(-r*3.6)*(.35 + .9*arms*smoothstep(.05, .3, r))*(.6 + .7*n);
  float bulge = exp(-dot(p*vec2(1., 2.6), p*vec2(1., 2.6))*42.);
  float lane = exp(-pow((p.y + .012 + .01*sin(p.x*9. + uSeed))/.016, 2.))*smoothstep(.75, .1, abs(p.x))*(.55 + .45*vn(p*vec2(30., 6.) + uSeed));
  vec3 col = uArm*disc*1.7 + uCore*(bulge*3.2 + exp(-r*9.)*.9);
  col *= 1. - .82*lane;
  col += uDust*lane*disc*.5;
  float tw = .85 + .15*vn(p*90. + uTime*.6);
  gl_FragColor = vec4(col*edge*uGain*tw, 1.);
}`;

// smooth interpolation through [u, value] keys
function keyCurve(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t <= b[0]) return lerp(a[1], b[1], smoothstep(0, 1, (t - a[0]) / (b[0] - a[0])) * 0.6 + 0.4 * (t - a[0]) / (b[0] - a[0]));
    }
    return keys[keys.length - 1][1];
  };
}

export default {
  id: 'world-turtle',
  name: 'The World Turtle',
  category: 'bizarre',
  weirdness: 1,
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality && ctx.quality.detail > 0 ? ctx.quality.detail : 1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#010006');
    const time = { value: 0 };

    // ---- per-seed choices (drawn first so later kit calls cannot reshuffle them)
    const S = {
      nebula: rng.pick([['#3b2a9c', '#c94f9a', '#2fd0bc'], ['#4a2aa6', '#d2568f', '#38d4c8'], ['#2a34a0', '#b84fb4', '#2fd0bc'], ['#5a2896', '#e0607a', '#3ac0d8']]),
      nebulaSeed: rng.range(0, 60), nebulaCover: rng.range(0.7, 0.8), milkyAngle: rng.range(0, 360),
      dayOffset: clamp(rng.range(-14, 9), -8, 4),                      // earlier or later dusk
      fishCount: rng.int(240, 360), fishHue: rng.pick(['teal', 'rose', 'gold']),
      birds: rng.pick(['geese', 'flamingos', 'geese']), birdSide: rng.chance(0.5) ? 1 : -1, gulls: rng.int(10, 26),
      lanterns: true, lanternCount: rng.int(45, 95), clouds: rng.int(5, 9),
      farTurtles: rng.int(2, 4), meteors: rng.int(8, 18), dust: rng.range(0.8, 1.25), ribbons: rng.int(3, 5),
      galaxySeed: rng.range(0, 20), galaxyRoll: rng.range(-0.5, 0.5),
    };
    const rFish = rng.fork('fish'), rFar = rng.fork('far'), rCloud = rng.fork('cloud'), rRib = rng.fork('ribbon');

    // ---- the hero
    const hero = await buildHero(ctx, { palette: PALETTE, progress: 0 });
    scene.add(hero.object);
    const A = hero.anchors, SEA = hero.seaY;
    await ctx.yield();

    // ---- flight path: the artist's route (behind and above -> across the shell -> over the Rimfall -> flank -> neck -> portal)
    // The opening is moved back and down to the height of the peak: portals are level (yaw only), so the view through
    // the previous portal must hold the world dead ahead: a small glowing disc, edge-on, with flippers stroking beneath
    // it. The camera then rises over the rim onto the artist's route.
    // The route itself is written once, as rules in the hero's coordinates (flightRoute in the part): the dive slants down beside
    // the Rimfall, outside the front flipper's tip and below its root, and the flight ends with a loop ahead of the beak so the last straight faces the turtle.
    const tipX = A.flipperTips[0].x;
    const FR = flightRoute(A), pts = FR.pts, IX = FR.index;
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    // The flight is as long as its route: flown at 42 m/s, the speed it had before the ending was drawn out round the beak
    // (2390 to 2450 m in 58 s), so a longer route takes longer and is not flown faster.
    const SPEED = 42, DUR = Math.round(path.length / SPEED);
    // Where the flight is over each place of the world (the fraction of the route nearest to it): every later key hangs on these.
    const uAt = (q) => path.nearestXZ(q[0], q[2]).u, uNear = (v) => path.nearestXZ(v.x, v.z).u;
    const uEntry = uNear(A.viewpoints.entry), uTail = uAt(pts[IX.tail]);                                                  // the artist's entry point 600 m astern; high over the tail
    const uAft = uAt(pts[IX.aft]), uPeak = uNear(A.peak), uCity = uNear(A.city);                                           // over the aft shell; abeam the peak; over the city
    const uRim = uAt(pts[IX.rim]), uOut = uAt(pts[IX.out]), uFlank = uAt(pts[IX.flank]), uTurn = uAt(pts[IX.turn]), uNeck = uAt(pts[IX.neck]), uEye = uAt(pts[IX.eye]);
    const uBeak = uAt(pts[IX.beak]), uLeg = uAt(pts[IX.leg]), uLoop = uAt(pts[IX.loop]), uLoopEnd = uAt(pts[IX.loopEnd]);
    const portalPos = A.portalSeat.position, facing = A.portalSeat.facing;
    await ctx.yield();

    // ---- sky: deep space, nebula in the brief's three colours, baked once
    const sky = makeSky({ rng, preset: 'space', bake: true, renderer: ctx.renderer, nebula: 0.8, nebulaColors: S.nebula, nebulaCoverage: S.nebulaCover - 0.08,
      nebulaScale: 0.9, nebulaSeed: S.nebulaSeed, milkyWay: 0.34, milkyAngle: S.milkyAngle, milkyColor: '#2a8f9c', milkyCore: '#58c8c0',
      stars: 1.0, starDensity: 0.85, twinkle: 0.35, sunIntensity: 0, sunGlow: 0 });
    scene.add(sky.object);
    await ctx.yield();

    const set = fx.fxGroup(); scene.add(set.object);

    // ---- galaxy, behind and above the portal's direction so it backs both the opening view and the approach
    const galDir = new V3(-0.42, 0.2, 0.88).normalize();
    const galaxy = new THREE.Mesh(new THREE.PlaneGeometry(2100, 2100), new THREE.ShaderMaterial({
      uniforms: { uCore: { value: new THREE.Color(1.0, 0.82, 0.55) }, uArm: { value: new THREE.Color(0.42, 0.5, 1.0) }, uDust: { value: new THREE.Color(0.9, 0.3, 0.5) },
        uTime: time, uSeed: { value: S.galaxySeed }, uGain: { value: 0.85 } },
      vertexShader: GAL_VERT, fragmentShader: GAL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    galaxy.frustumCulled = false; galaxy.renderOrder = 0;
    galaxy.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(galDir, new V3(), new V3(0, 1, 0)));
    galaxy.rotateZ(0.42 + S.galaxyRoll);
    scene.add(galaxy);
    await ctx.yield();

    // ---- other turtles, far away, each with its own little glow
    const farGeo = farTurtleGeometry(), farList = [], farGlowPos = [], farGlowCol = [], farSizes = [];
    const farDirs = rFar.shuffle([[0.78, 0.04, 0.62], [-0.72, 0.1, 0.68], [-0.9, 0.1, 0.35], [0.35, -0.28, 0.9], [-0.25, -0.2, 0.95], [0.9, 0.2, -0.2]]);
    for (let i = 0; i < S.farTurtles; i++) {
      const d = new V3(...farDirs[i]).normalize(), dist = rFar.range(2400, 4200), sc = rFar.range(16, 28), gs = 60;
      const glow = new THREE.Color(rFar.pick(['#2fb8a8', '#c94f9a', '#ffe9a8'])).multiplyScalar(0.7);
      const mat = new THREE.ShaderMaterial({ uniforms: { uTime: time, uPhase: { value: rFar.range(0, 6) }, uSun: hero.uniforms.uSunDir, uSunCol: { value: new THREE.Color(1.3, 1.0, 0.7) },
        uFillA: { value: new THREE.Color('#c94f9a').multiplyScalar(0.5) }, uFillB: { value: new THREE.Color('#2fb8a8').multiplyScalar(0.5) }, uGlow: { value: glow } },
        vertexShader: FAR_VERT, fragmentShader: FAR_FRAG });
      const m = new THREE.Mesh(farGeo, mat);
      m.position.copy(d).multiplyScalar(dist); m.position.y += SEA; m.scale.setScalar(sc);
      // always seen three-quarters from above: lean its back toward the flight, then turn it about its own axis
      const tiltAxis = new V3(0, 1, 0).cross(d.clone().negate()).normalize();
      m.quaternion.setFromAxisAngle(tiltAxis, rFar.range(0.45, 0.8)); m.rotateY(rFar.range(0, 6.28));
      scene.add(m); farList.push({ m, spin: rFar.range(-0.01, 0.01) });
      farGlowPos.push([m.position.x, m.position.y + sc * 0.3, m.position.z]); farGlowCol.push(glow.clone().multiplyScalar(1.4)); farSizes.push(gs * 3.6);
      // its own small sun
      const sp = new V3(rFar.range(-1, 1), 0.9, rFar.range(-1, 1)).normalize().multiplyScalar(sc * 2.6).applyQuaternion(m.quaternion).add(m.position);
      farGlowPos.push([sp.x, sp.y, sp.z]); farGlowCol.push(new THREE.Color(1.6, 1.1, 0.55)); farSizes.push(gs * 0.9);
    }
    set.add(fx.makeGlows({ positions: farGlowPos, colors: farGlowCol, sizes: farSizes, size: 1, intensity: 0.7, halo: 1.2, core: 0.4, flicker: 0.15, fog: false, time }));
    await ctx.yield();

    // ---- stardust streaming backward past the swimming turtle (it faces +Z)
    const warm = '#ffe9a8', teal = '#2fb8a8', mag = '#c94f9a';
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', count: Math.round(3200 * S.dust * detail), box: [280, 190, 300], velocity: [-1.5, 0.4, -26], velocityRandom: [3, 2, 9],
      turbulence: [2.5, 2, 0.02], size: [0.22, 0.85], colors: [warm, '#bfeee6', '#f3a6d2'], intensity: 2.4, twinkle: 0.6, fog: false, time, near: [3, 14] }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('dust2'), preset: 'dust', count: 700, box: [90, 60, 110], velocity: [-1, 0.2, -20], velocityRandom: [2, 1.5, 6],
      turbulence: [1.2, 1, 0.05], size: [0.06, 0.2], colors: ['#ffffff', warm, '#c8f4ff'], intensity: 2.2, twinkle: 0.8, fog: false, time, near: [2, 8] }));
    await ctx.yield();
    set.add(fx.makeShootingStars({ rng: rng.fork('met'), count: S.meteors, period: [3, 10], minElevation: -0.55, radius: 3000, color: '#fff3d8', tailColor: '#7fd8ff', intensity: 4, time }));
    await ctx.yield();

    // ---- stardust currents: long ribbons of light flowing back along the turtle's line of travel
    const curves = [];
    for (let i = 0; i < S.ribbons; i++) {
      const side = i % 2 ? -1 : 1, x0 = side * rRib.range(470, 640) + (side > 0 ? 60 : 0), y0 = SEA + rRib.range(-190, 40), amp = rRib.range(25, 70), ph = rRib.range(0, 6);
      const pts = [];
      for (let k = 0; k <= 9; k++) { const t = k / 9; pts.push(new V3(x0 + Math.sin(t * 5 + ph) * amp - side * 80 * Math.sin(t * Math.PI), y0 + Math.cos(t * 4 + ph) * amp * 0.5, 900 - t * 1800)); }
      curves.push(pts);   // point arrays: fx.makeRibbon tests cv.isCurve, which THREE.Curve does not have
    }
    // one current passes under the camera on the flank and runs up to the portal
    curves.push([portalPos.clone().add(new V3(-40, -46, 120)), portalPos.clone().add(new V3(30, -38, -60)), new V3(190, SEA - 80, 470), new V3(520, SEA - 135, 300),
      new V3(585, SEA - 130, 80), new V3(520, SEA - 155, -160), new V3(400, SEA - 170, -520)]);
    set.add(fx.makeRibbon({ rng: rRib, curves, width: 5, segments: 140, wave: 0.2, speed: 0.55, frequency: 7, intensity: 0.4, colors: [teal, mag], trail: 0.3, heads: 3, near: [40, 120], maxAngle: 0.02, fog: false, time }));
    await ctx.yield();

    // ---- comet-fish: the big school beside the right flank and a wheel of them round the portal. The school's loop lies over the
    // ring of ice, inside the line the flight takes round the paddle's tip and below it: seen from that line it streams between
    // the visitor and the turtle. Every school keeps its margin from the route (keepOff in the fish shader).
    const hues = { teal: ['#2fb8a8', '#59d6ff', '#c94f9a'], rose: ['#c94f9a', '#ff8fb8', '#59d6ff'], gold: ['#ffb45a', '#ffe9a8', '#2fb8a8'] }[S.fishHue];
    const school = makeCometFish(rFish, { count: S.fishCount, spread: 26, size: [0.8, 1.6], speed: 0.2, tail: 1.7, e: 0.3, ax: [30, 9, 170], avoid: 22, colors: hues, gain: 0.7 });
    school.object.position.set(tipX - 40, SEA - 118, 80);
    const wheel = makeCometFish(rFish, { count: 96, spread: 6, size: [0.7, 1.4], speed: 0.27, tail: 1.5, e: 0, ax: [33, 1.5, 33], avoid: 10, colors: hues, gain: 0.9 });
    wheel.object.position.copy(portalPos).addScaledVector(facing, 16);
    wheel.object.quaternion.setFromUnitVectors(new V3(0, 1, 0), facing);
    // a few strays that swim up over the rim and across the shell-world's dusk sky
    const strays = makeCometFish(rFish, { count: 26, spread: 14, size: [0.5, 0.9], speed: 0.12, tail: 1.6, e: 0.1, ax: [150, 14, 250], avoid: 14, colors: hues });
    strays.object.position.set(60, SEA + 150, 40); strays.object.rotation.z = 0.5;
    scene.add(school.object, wheel.object, strays.object);
    for (const s of [school, wheel, strays]) s.keepFrom(path);
    await ctx.yield();
    // glittering ice shed by the Rimfall drifts through the last approach
    const ic = portalPos.clone().addScaledVector(facing, 150);
    set.add(fx.makeParticles({ rng: rng.fork('ice'), preset: 'snow', follow: false, center: [ic.x, ic.y, ic.z], box: [170, 90, 360], count: Math.round(1500 * detail), velocity: [-0.6, -0.5, -7], velocityRandom: [1.5, 1, 3],
      size: [0.14, 0.5], colors: ['#ffffff', '#bfe9ff', '#9fd8ff'], intensity: 2.3, twinkle: 1, shape: 'sparkle', fog: false, time }));
    await ctx.yield();
    set.add(fx.makeGlow({ position: [portalPos.x, portalPos.y, portalPos.z], size: 70, color: '#9fdcff', intensity: 0.5, halo: 1, core: 0.2, fog: false, time }));

    // ---- life over the shell-world: clouds round the peak, birds, lanterns over the city
    const cloudList = [];
    for (let i = 0, tries = 0; i < S.clouds && tries < 200; tries++) {
      const a = rCloud.range(0, 6.283), d = rCloud.range(55, 150), x = A.peak.x + Math.sin(a) * d, z = A.peak.z + Math.cos(a) * d;
      const y = Math.max(hero.heightAt(x, z) + 22, SEA + rCloud.range(48, 105));
      if (path.distanceTo(x, y, z) < 75) continue;
      cloudList.push({ position: [x, y, z], scale: rCloud.range(0.42, 0.7) }); i++;
    }
    const clouds = fx.makeCloudPuffs({ rng: rCloud, time, clouds: cloudList, puffs: 16, sunDir: hero.sun.direction.clone(), sunColor: '#ffd9a8', color: '#f6e6e0', shadowColor: '#4b3a86',
      ambient: '#1c1640', rim: 0.9, scatter: 0.25, opacity: 0.9, drift: [0, 0, 0], veil: 0, fog: false });
    set.add(clouds);
    await ctx.yield();
    const L = { _resolved: true, sunDir: new V3(0.4, 0.6, -0.4).normalize(), sunColor: new THREE.Color(1.6, 1.3, 1.0), sky: new THREE.Color(0.55, 0.45, 0.9), ground: new THREE.Color(0.2, 0.45, 0.45) };
    const fauna = F.makeFauna(scene, { light: L });
    await ctx.yield();
    // the flock crosses the flight line 170 m ahead of the place over the aft shell
    fauna.add(F.makeFlock({ rng: rng.fork('birds'), species: S.birds, size: 1.5, count: S.birds === 'geese' ? 17 : 21, cross: { path, u: uAft, lead: 170, height: -8, angle: 60, side: S.birdSide, span: 520, duration: DUR } }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: Math.round(S.gulls * 1.5), size: 2, center: [A.peak.x - 30, A.peak.y - 55, A.peak.z + 10], radius: 95, height: 26, speed: 9 }));
    await ctx.yield();
    set.add(fx.makeLanterns({ rng: rng.fork('lan'), time, count: S.lanternCount, center: [A.city.x, A.city.y + 22, A.city.z], area: [130, 38, 130], rise: 0.9, sway: 1.2,
      wind: [-0.4, 0, -0.3], size: 1.1, colors: ['#ffb45a', '#ff7a9a'], intensity: 2.4, glow: 1.1, glowSize: 5, floor: SEA + 2, heightAt: hero.heightAt, fog: false }));
    await ctx.yield();
    // spray boiling off the rim lip where the camera goes over the edge
    const cbw = A.lipBearing, rMist = rng.fork('lipmist'), lip = [];
    for (let i = 0; i < 14; i++) { const a = cbw + rMist.range(-0.3, 0.22), r = hero.anchors.rimRadius + rMist.range(6, 26); lip.push([Math.sin(a) * r, SEA - rMist.range(4, 46), Math.cos(a) * r]); }
    set.add(fx.makeMist({ rng: rMist, time, positions: lip, size: [14, 30], color: '#6fb4bc', opacity: 0.13, flatten: 0.8, floorFade: 0, fog: false }));
    await ctx.yield();

    // ---- time of day: the hero's sun runs from day through dusk to night along the flight; the seed shifts the start
    const o = S.dayOffset;
    // Each key of the sun's height (degrees above the shell plane) hangs on a place of the route: full day as far as the
    // artist's entry point astern, afternoon high over the tail, a low sun over the aft shell, dusk abeam the peak and over
    // the city, and the sun on the rim of the world as the flight leaves the lip: the land is crossed while the sun still
    // lights it, and the lamps are on by the time the flight is over the city.
    // The sun then waits just under the rim of the world while the camera holds the whole turtle, so the
    // flank, brow and beak keep a low warm key against the nebula, and only sinks on the way to the portal.
    const sunAng = keyCurve([[uEntry, 46 + o], [uTail, 27 + o * 0.5], [uAft, 14.5 + o * 0.15], [uPeak, 8.5], [uCity, 4.5], [uRim, -0.8],
      [uFlank, -1.2], [uNeck, -2.2], [uEye, -3.0], [uLoop, -3.6], [1, -5.5]]);
    const rimR = A.rimRadius, onRim = (a, k, y) => new V3(Math.sin(a) * rimR * k, y, Math.cos(a) * rimR * k);
    const mu = (metres) => metres / path.length;                         // a run of route metres, as a share of the route
    // Leaving the island: one aim that moves between two places of the rim. First the fall's upper face forward of the paddle's
    // root (12 m under its crest), far along the rim beyond the domes, so that from over the city the look goes across them to where the sea falls
    // off; then, from the lip to the knot outside the paddle, it slides to the paddle's shoulder under the rim, where curtain,
    // paddle and neck meet: the fall stays a wall at one side and the flank opens beyond the paddle.
    const fallFar = onRim(Math.atan2(A.flipperRoot.x, A.flipperRoot.z) - 0.3, 1.0, SEA - 12), shoulder = A.flipperRoot.clone(), leaveV = new V3();
    const leaving = (t, u) => leaveV.lerpVectors(fallFar, shoulder, smoothstep(uRim, uOut, u));
    // shell, Rimfall, flipper, neck and head as one animal; the aim then slides forward along the neck to the head
    const wholeA = new V3(25, SEA - 4, 10), wholeB = new V3(30, SEA - 28, 360), wholeV = new V3();
    const whole = (t, u) => wholeV.lerpVectors(wholeA, wholeB, smoothstep(uTurn - 0.03, uNeck - 0.03, u));
    const linger = (u) => smoothstep(uOut - 0.02, uOut + 0.04, u) * (1 - smoothstep(uTurn, uTurn + 0.07, u));
    const hurry = (u) => smoothstep(uEye + 0.012, uLeg, u) * (1 - smoothstep(uLoop - 0.035, uLoop + 0.02, u));     // the run out to the loop
    // After the eye the gaze stays on the animal while the flight rounds the beak, runs out and loops back ahead of it. Its
    // aim moves between the hero's own anchors: from the right eye to the muzzle (halfway from the head's centre to the tip of
    // the beak) by the end of the run-out, then to the head's centre (the shell rises behind it) by the end of the loop, and
    // rests there down the last straight.
    const muzzle = A.head.clone().lerp(A.beakTip, 0.5), faceV = new V3();
    const face = (t, u) => { faceV.lerpVectors(A.eyeRight, muzzle, smoothstep(uEye, uLeg, u)); return faceV.lerp(A.head, smoothstep(uLeg, uLoopEnd, u)); };

    // The blink runs on the world's clock for the whole flight: once every 9 to 13 s, from a phase, both drawn for the visit.
    // The lid closes in 0.43 s, stays shut 0.29 s and opens in 0.43 s: what its former keys along the neck came to at the
    // speed of the pass. The pass by the eye meets whatever the clock gives.
    const rBlink = rng.fork('blink'), blinkEvery = rBlink.range(9, 13), blinkPhase = rBlink() * blinkEvery;
    const LID_CLOSE = 0.43, LID_SHUT = 0.29, LID_OPEN = 0.43;
    const blinkAt = (t) => { const x = (t + blinkPhase) % blinkEvery; return smoothstep(0, LID_CLOSE, x) * (1 - smoothstep(LID_CLOSE + LID_SHUT, LID_CLOSE + LID_SHUT + LID_OPEN, x)); };

    const cloudSunCol = new THREE.Color();
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR,
      camera: { fov: 62, near: 1, far: 6000, lookAhead: 60, sway: 0.7, bank: 0.7 },
      pois: [
        { at: A.lookAt.world, from: 0.0, to: uAft, weight: 0.55 },                          // the whole shell-world, from the start until the flight is over the aft shell
        { at: A.peak.clone().setY(A.peak.y - 35), from: uTail, to: uPeak, weight: 0.35 },   // the peak, from high over the tail until the flight is abeam it
        { at: A.lookAt.city, from: uAft, to: uCity, weight: 0.45 },                         // the city, from the aft shell until the flight is over it
        { at: leaving, from: uCity - mu(120), to: uOut + mu(80), weight: 0.7, fade: 0.25 },   // from the city's groves to the knot outside the paddle: across the domes to the fall, then the paddle's shoulder
        { at: whole, from: uOut - 0.03, to: uNeck - 0.01, weight: 0.8, fade: 0.26 },   // the held three-quarter view of the whole turtle
        { at: A.eyeRight, from: uNeck - 0.04, to: uEye + 0.02, weight: 0.7 },
        { at: face, from: uEye - 0.012, to: 1, weight: 0.86, fade: 0.1 },
      ],
      pace: (u) => 1 - 0.45 * linger(u) + 0.6 * hurry(u),
      portal: { shape: 'circle', radius: 10, color: '#bfe9ff', glow: 1.1, revealDistance: 420 },
      post: { exposure: 1.0, bloom: { strength: 0.6, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#ffffff', shadowTint: '#05020e', vignette: 0.36, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        hero.setProgress(u); hero.setSunAngle((sunAng(u) * Math.PI) / 180);
        hero.setBlink(blinkAt(t));
        hero.update(dt, t, camera);
        sky.update(dt, t, camera); sky.object.rotation.y = t * 0.003;          // slow nebula drift
        galaxy.position.copy(camera.position).addScaledVector(galDir, 5000);
        // kit objects take the hero's moving sun
        const night = hero.sun.night;
        L.sunDir.copy(hero.sun.direction); L.sunColor.copy(hero.sun.color).multiplyScalar(0.75);
        fauna.setLight(L); fauna.update(dt, t, camera, u);
        clouds.uniforms.uSunDir.value.copy(hero.sun.direction);
        clouds.uniforms.uSunColor.value.copy(cloudSunCol.copy(hero.sun.color).multiplyScalar(lerp(0.62, 0.4, night)));
        set.update(dt, t, camera);
        school.update(dt, t, camera); wheel.update(dt, t, camera); strays.update(dt, t, camera);
        for (const f of farList) f.m.rotateY(f.spin * dt);
      },
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
