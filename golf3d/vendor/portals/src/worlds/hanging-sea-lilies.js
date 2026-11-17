// The Hanging Meadow: 182 million years ago (Toarcian), the open surface of a warm shelf sea, today Holzmaden.
// A drifting conifer trunk carries a colony of the sea lily Seirocrinus that grows DOWNWARD; we swim through it
// as one of a pod of Stenopterygius. Hero: src/parts/hanging-sea-lilies.js (placed at the origin, so its local
// space is world space: y 0 is the sea's ceiling). We never leave the water and there is no floor in any frame.
// The pod's places are a CARRIED STATE (buildPod): each begins at the place its law wishes at the world's first update and at every posed update, and swims after that wish in between.
//
// Everything here shades itself with the hero's WATER_GLSL / LIGHT_GLSL and shares hero.uniforms, so every animal
// fades to the same water (colour by view direction, contrast halves every 55 m). No three.js lights, no fog.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, buildSatellites, WATER_GLSL, LIGHT_GLSL } from '../parts/hanging-sea-lilies.js';

const PALETTE = ['#2A9478', '#5FC6A0', '#E9F6E4', '#F2B631', '#C9577A', '#3A2A1E', '#0A1F1E'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (h) => new THREE.Color(h);

// Seeded weather: bright morning, glassy high noon, or a warm rain squall (pearl-green and shadowless).
const WEATHER = {
  morning: { sun: [0.16, 0.819, -0.55], gain: 1.55, ambient: 0.58, sunK: 1.0, cloud: 0.3, calm: 1.0, rain: 0, shaft: 0.13, warm: 1, level: '#2A9478', up: '#5FC6A0', sky: '#E9F6E4' },
  noon: { sun: [0.05, 0.985, -0.16], gain: 1.68, ambient: 0.62, sunK: 1.12, cloud: 0.85, calm: 0.3, rain: 0, shaft: 0.06, warm: 0.7, level: '#27988A', up: '#62CDB4', sky: '#F1F8F0' },
  squall: { sun: [0.12, 0.93, -0.35], gain: 1.5, ambient: 1.05, sunK: 0.24, cloud: 1.0, calm: 1.25, rain: 1, shaft: 0.0, warm: 0.12, level: '#4FA68C', up: '#93D0B8', sky: '#DDEBE0' },
};

const DOME_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const DOME_FRAG = /* glsl */`
${WATER_GLSL}
varying vec3 vD;
void main(){ vec3 d = vD/max(length(vD), 1e-4); gl_FragColor = vec4(waterColor(d, uCamL.y + d.y*30.), 1.); }`;

// The sea's ceiling from below: Snell's window (sky, cloud blurs, the wobbling sun) inside 48.6 degrees, the
// rippling mirror of the water's own jade outside it. Analytic. uCalm scales the swell, uRain stipples it with rings.
const CEIL_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const CEIL_FRAG = /* glsl */`
${WATER_GLSL}
uniform vec3 uSkyCol; uniform float uCalm, uRain, uCloud, uSunK;
uniform vec4 uDimple;                                                // x, z, age (s), strength: a podmate breaking the surface
varying vec3 vP;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
vec2 ring(vec2 w, float cell, float rate, float seed){                // one expanding raindrop ring per cell: (slope, light)
  vec2 id = floor(w/cell), f = fract(w/cell) - .5;
  float h = h21(id + seed), t = fract(uTime*rate + h*7.), r = t*.42;
  vec2 o = (vec2(h21(id + seed + 3.1), h21(id + seed + 7.7)) - .5)*.3;
  float d = length(f - o), band = (d - r)/.05;
  float g = exp(-band*band)*(1. - t)*(1. - t);
  return vec2(g*sign(d - r + 1e-4), g);
}
float rnet(vec2 q, float t){                                         // the net of bright lines a rippled surface makes
  q += .45*sin(q.yx*1.3 + t*.6);
  float v = abs(sin(q.x) + sin(q.y) + sin((q.x + q.y)*.71 + 1.3 + t*.4));
  return 1. - smoothstep(0., .95, v);
}
void main(){
  vec3 d = vP - uCamL; float l = max(length(d), 1e-3); d /= l;
  vec2 w = vP.xz;                                                    // swell 9 m long moving with the wind, plus chop
  vec2 n = uCalm*vec2(.05*sin(w.x*.9 + uTime*.8) + .03*sin(dot(w, vec2(2.1, 1.7)) + uTime*1.7),
                .09*sin(w.y*.698 - uTime*1.6) + .03*sin(dot(w, vec2(-1.6, 2.4)) - uTime*1.3));
  n += .012*vec2(sin(dot(w, vec2(5.3, 3.1)) + uTime*2.3), sin(dot(w, vec2(-3.7, 4.9)) - uTime*2.0))*(.4 + .6*uCalm);
  float near = exp2(-l/26.), mid = exp2(-l/70.), rainL = 0.;
  if (uRain > 0.) {
    vec2 r1 = ring(w, .9, .9, 0.), r2 = ring(w + 13.7, 1.7, .6, 5.), r3 = ring(w*1.0 + 41.3, .45, 1.3, 9.);
    float rs = (r1.x + r2.x + .6*r3.x)*uRain; rainL = (r1.y + r2.y + .6*r3.y)*uRain*near;
    n += .08*rs*near*vec2(sin(w.x*3.), cos(w.y*3.));
  }
  vec2 dp = w - uDimple.xy; float dd = length(dp), da = uDimple.z;      // rings spreading from a breath
  float dw = sin(dd*5. - da*9.)*exp(-dd*.55)*exp(-da*.7)*smoothstep(0., .3, da)*step(dd, da*2.4 + .6)*uDimple.w;
  n += .16*dw*dp/max(dd, .05);
  // the surface read from below: facets of the swell gather the light into a slow net of bright lines (two sizes; the
  // fine one only while it resolves), stretched along the swell far off so it never turns to noise
  float calmK = .5 + .5*min(uCalm, 1.);
  float netA = rnet(w*vec2(1.25, .85) + vec2(uTime*.45, -uTime*.3), uTime);
  float netB = rnet(w*vec2(3.7, 2.9) + vec2(-uTime*.8, uTime*.55) + 3., uTime*1.3);
  float calmP = .45 + 1.1*vn(w*.19 + vec2(uTime*.03, 7.));               // calmer and busier patches
  float net = (netA*.8*mid + netB*.55*near)*calmK*calmP;
  float c = d.y + dot(n, d.xz)*1.2 + (netA - .3)*.07*mid*calmK;
  float win = smoothstep(.60, .70, c);                               // Snell's window: 48.6 degrees from straight up
  vec3 sd = d + vec3(n.x, 0., n.y)*.9; sd /= max(length(sd), 1e-4);
  float s = max(dot(sd, uSunDir), 0.); float s2 = s*s; s2 *= s2; s2 *= s2; s2 *= s2;
  vec2 cw = w*.085 + sd.xz*2.2 + vec2(uTime*.012, 0.);                // cloud blurs seen through the window
  float cl = smoothstep(.62 - .45*uCloud, .95 - .3*uCloud, vn(cw) *.6 + vn(cw*2.3 + 7.)*.4);
  vec3 sky = mix(mix(uWUp, uSkyCol, .42)*.6, uSkyCol*.8, cl*(.45 + .5*uCloud));   // kept under white: a sky, not a pane
  sky *= (.66 + .95*net)*mix(.62, 1., smoothstep(.64, .9, c));         // the net of light, and a darker rim to the window
  sky += vec3(1., .95, .8)*(2.4*s2*s2*(.3 + 1.6*net) + .13*s2)*uSunK*(1. - .6*cl);   // the sun broken into glitter
  sky += vec3(.9, 1., .95)*rainL*.35;
  vec3 mir = waterColor(vec3(d.x + n.x, -.25 - .5*d.y, d.z + n.y)/1.3, -4.)*(.82 + 1.6*abs(n.x + n.y) + 1.25*net) + uWSilver*(rainL*.22 + .5*net*net*mid);
  vec3 colr = mix(mir, sky, win);
  vec3 sl = uSunDir*vec3(1., .42, 1.); sl /= max(length(sl), 1e-4);     // the surface on the sunward side is gold-green
  float wg = max(dot(d, sl), 0.); wg = wg*wg*uWarm;
  // (fifth polish) clean and luminous, never olive: away from the sun the ceiling keeps its own aquamarine (only a
  // step brighter toward the light); the warm gold is a tight core round the sun, laid in at the ceiling's own
  // brightness so the net of light stays written in it
  float wc = wg*wg; wc *= wc;                                          // the 8th power of the cosine
  colr *= 1. + .16*clamp(wg, 0., 1.);
  colr = mix(colr, vec3(1.5, .93, .22)*(dot(colr, vec3(.3, .5, .2))*1.3 + .07), clamp(wc*1.7, 0., 1.)*.9);     // a clear warm GOLD, saturated enough to stay gold through the tone map
  colr = colr/(1. + .22*max(colr.g - .9, 0.));                        // a soft shoulder: the sunward ceiling keeps its net of light
  gl_FragColor = vec4(mix(waterColor(d, uCamL.y + d.y*30.), colr, exp2(-l/max(uHalf*1.3, 1.))), 1.);
}`;

// Sun shafts: soft additive ribbons hanging from the ceiling along the sun's refracted direction, wheeling slowly.
const SHAFT_VERT = /* glsl */`
uniform float uTime; uniform vec3 uSunDir, uCamL;
attribute vec4 aShaft;                                               // x, z at the surface, width, phase
varying vec2 vUv; varying float vA, vDeep;
void main(){
  float deepK = step(1.35, aShaft.z), len = mix(42., 66., deepK);   // (sixth polish) the widest shafts reach down into the blue under the open-water legs
  vDeep = deepK;
  vec2 o = aShaft.xy + vec2(sin(uTime*.11 + aShaft.w), cos(uTime*.09 + aShaft.w*1.7))*1.6;
  vec3 top = vec3(o.x, 0., o.y), p = top - uSunDir*(position.y*len);
  vec3 V = uCamL - p; vec3 S = cross(uSunDir, V); S /= max(length(S), 1e-4);
  p += S*position.x*aShaft.z*(1. + position.y*.6);
  vUv = vec2(position.x, position.y);
  float dist = length(V);
  vA = (.5 + .5*sin(uTime*.23 + aShaft.w*5.))*smoothstep(2., 9., dist)*exp2(-dist/70.);
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uShaftCol;
varying vec2 vUv; varying float vA, vDeep;
void main(){
  float x = 1. - vUv.x*vUv.x; x = max(x, 0.);
  float a = x*x*(1. - smoothstep(mix(.25, .45, clamp(vDeep, 0., 1.)), 1., vUv.y))*smoothstep(0., .03, vUv.y)*(.35 + .65*vA);
  gl_FragColor = vec4(uShaftCol*a, 1.);
}`;

function buildBackdrop(S) {
  const { U, scene, W, R } = S;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(320, 24, 16), new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
  dome.renderOrder = -1; dome.frustumCulled = false; dome.name = 'water-dome'; scene.add(dome);
  const cg = new THREE.PlaneGeometry(1400, 1400); cg.rotateX(Math.PI / 2);
  S.ceilU = { ...U, uSkyCol: { value: col(W.sky) }, uCalm: { value: W.calm }, uRain: { value: W.rain }, uCloud: { value: W.cloud }, uSunK: { value: W.sunK }, uDimple: { value: new THREE.Vector4(0, 0, 99, 0) } };
  const ceil = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: S.ceilU, vertexShader: CEIL_VERT, fragmentShader: CEIL_FRAG, side: THREE.DoubleSide }));
  ceil.frustumCulled = false; ceil.name = 'ceiling'; scene.add(ceil);
  if (W.shaft > 0) {
    const sg = new THREE.InstancedBufferGeometry(), sp = [], si = [], NQ = 6, NS = 44, NX = 24;
    for (let i = 0; i <= NQ; i++) sp.push(-1, i / NQ, 0, 1, i / NQ, 0);
    for (let i = 0; i < NQ; i++) { const a = i * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
    const sh = new Float32Array((NS + NX) * 4);
    for (let i = 0; i < NS; i++) {
      if (i < 16) { const side = i % 2 ? 1 : -1; sh.set([R.range(-17, 17), side * R.range(3.5, 16) - 3, R.range(0.25, 0.9), R.range(0, 6.28)], i * 4); continue; }
      const p = S.path.pointAt(R.range(0, 1)), side = R.chance(0.5) ? 1 : -1, t = S.path.tangentAt(0.5);   // beside the route
      S.path.tangentAt(clamp(S.path.nearestXZ(p.x, p.z).u, 0, 1), t);
      const off = side * R.range(7, 24);
      sh.set([p.x - t.z * off + S.sunDir.x / S.sunDir.y * p.y, p.z + t.x * off + S.sunDir.z / S.sunDir.y * p.y, R.range(0.4, 1.3), R.range(0, 6.28)], i * 4);
    }
    { const RD = S.ctx.core.makeRng(5150 + ((S.ctx.seed | 0) % 100000)), q = V3(0, 0, 0), t = V3(0, 0, 1);   // its own stream: no draw from R
      for (let i = 0; i < NX; i++) {                                 // wide, long shafts beside the open-water legs (out of the helix, the rose corridor, the north leg): light in the lower half
        const uu = RD.range(0.45, 0.78), side = i % 2 ? 1 : -1, off = side * RD.range(5, 15), ah = RD.range(6, 20), dp = RD.range(3, 8);
        S.path.pointAt(uu, q); S.path.tangentAt(uu, t);
        const px = q.x + t.x * ah - t.z * off, pz = q.z + t.z * ah + t.x * off, D = -q.y + dp;
        sh.set([px + S.sunDir.x / S.sunDir.y * D, pz + S.sunDir.z / S.sunDir.y * D, RD.range(1.4, 2.3), RD.range(0, 6.28)], (NS + i) * 4);
      } }
    sg.setAttribute('aShaft', new THREE.InstancedBufferAttribute(sh, 4)); sg.instanceCount = NS + NX;
    const shafts = new THREE.Mesh(sg, new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uCamL: U.uCamL, uShaftCol: { value: col(W.up).lerp(col('#FFE6A0'), 0.6).multiplyScalar(W.shaft * 1.25) } },
      vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    shafts.frustumCulled = false; shafts.renderOrder = 9; shafts.name = 'shafts'; scene.add(shafts);
  }
  S.updaters.push((dt, time, camera, u, camW) => { dome.position.copy(camW); });
}

// Until the turn for home nothing white may hang under the meadow ("below the last crown the water only darkens"),
// but the engine's ring is drawn unfaded from the first frame. So the world keeps a lens of plain water round it:
// a flattened ball that shows exactly what the dome shows behind it, drawn after the ring and its halo, and
// thinned away by a uniform as we come round to the broadside view. Nothing is created or switched in flight.
const COVER_VERT = /* glsl */`
varying vec3 vP; varying float vR;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vP = wp.xyz; vR = length(position.xy); gl_Position = projectionMatrix*viewMatrix*wp; }`;
const COVER_FRAG = /* glsl */`
${WATER_GLSL}
uniform float uCover; uniform vec3 uRingC, uRingN;
varying vec3 vP; varying float vR;
void main(){
  vec3 d = vP - uCamL; d /= max(length(d), 1e-4);
  float dn = dot(d, uRingN); dn = (dn < 0. ? -1. : 1.)*max(abs(dn), 1e-4);
  float t = dot(uRingC - uCamL, uRingN)/dn;                          // where this line of sight meets the ring's own plane
  float r = length(uCamL + d*t - uRingC);
  float a = t > 0. ? 1. - smoothstep(9.5, 14., r) : 0.;               // solid over the ring, feathered over its glow, from any side
  gl_FragColor = vec4(waterColor(d, uCamL.y + d.y*30.), uCover*a);
}`;
function buildCover(S) {
  const { A, M, scene, U } = S, seat = A.portalSeat;
  const CU = { ...U, uCover: { value: 1 }, uRingC: { value: seat.position.clone() }, uRingN: { value: seat.facing.clone().normalize() } };
  const g = new THREE.SphereGeometry(1, 28, 18);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: CU, vertexShader: COVER_VERT, fragmentShader: COVER_FRAG, transparent: true, depthWrite: false }));
  m.position.copy(seat.position); m.quaternion.setFromUnitVectors(V3(0, 0, 1), seat.facing.clone().normalize());
  m.scale.set(14.5, 14.5, 3.4); m.renderOrder = 8; m.frustumCulled = false; m.name = 'ring-cover'; scene.add(m);
  S.updaters.push((dt, time, camera, u) => {
    const k = 1 - smoothstep(M.east0 + 0.005, M.east0 + 0.05, u);       // gone while the ring is behind us on the east leg
    CU.uCover.value = k; m.visible = k > 0.002;
  });
}

export default {
  id: 'hanging-sea-lilies',
  name: 'The Hanging Meadow',
  category: 'prehistoric',
  weirdness: 0.5,
  media: ['underwater'],
  async build(ctx) {
    const R = ctx.rng.fork('hanging-meadow-world');
    const vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const wr = R(), mood = vary.mood ?? wr;
    let weather = mood < 0.2 || mood >= 0.5 ? 'morning' : mood < 0.33 ? 'squall' : 'noon';   // bright morning is the brief's default: the larger share of seeds
    if (vary.hour === 'day') weather = 'noon'; else if (vary.hour === 'dawn' || vary.hour === 'golden') weather = 'morning';
    const cr = (mood * 7.3) % 1, crowns = cr < 0.55 ? 'saffron' : cr < 0.8 ? 'coral' : 'lemon';
    const W = WEATHER[weather];
    const sunDir = V3(W.sun[0], W.sun[1], W.sun[2]).normalize();
    const scene = new THREE.Scene();
    scene.background = col(W.level);
    const palette = [W.level, W.up, W.sky, PALETTE[3], PALETTE[4], PALETTE[5], '#0A2C38'];   // the deep: darker and bluer than the brief's black-green

    const hero = await buildHero(ctx, { palette, backdrop: false, sunDir, detail, crowns });
    hero.setLight({ ambient: W.ambient, sun: W.sunK, gain: W.gain, half: 55 });
    hero.uniforms.uWarm.value = W.warm;                             // the gold-green of sunlit water toward the sun (none under the squall)
    scene.add(hero.object);
    await ctx.yield();

    // ---- the route. THE HERO'S LINE IS KEPT where the colony was built round it (the log run, the lead-in, the helix,
    // the way out and the last straight); the world flies its own two links in open water:
    //  entry: 49 m up-drift (+z, the sunlit side: the curtain is backlit) and only 30 degrees off broadside, on a
    //         straight line at the bell that bends once, to the right, under the log's root end;
    //  return: out down-drift, round to the left and straight back at the curtain BROADSIDE from 33 m, then east
    //         along its foot (the giant passes beneath) and round onto the last straight.
    const A = hero.anchors;
    const entryPts = [[-17.6, -6.5, 23], [-14.2, -6.0, 15.5], [-11.2, -5.2, 9.2], [-8.2, -4.3, 4.6]].map((q) => V3(q[0], q[1], q[2]));
    // The meadow is one raft of many. Out of the helix we go on DOWN-DRIFT, straight at a second bell (raft B) and
    // through a lane in its curtain; left along the inside of a third curtain (raft C: a tunnel of ropes for its whole
    // length); north over the giant, through a fourth (D) from behind, and round onto the last straight, which dives
    // under a fifth (E) at the main meadow and the ring.
    // (third polish: the link is a tight left-hand loop of 75 m instead of 120, so three review stills fall inside the
    // helix; it leaves through the deep bell A2 with the giant crossing beneath, runs east down a corridor of two
    // ROSE rafts, north beside the giant, and round onto the last straight.)
    const linkPts = [[9.5, -14.6, -24.5], [15, -12.6, -31.5], [22, -10.7, -35.5], [31, -9.7, -35.5], [39.5, -9.1, -32.5], [44.2, -8.6, -27], [45.6, -8.0, -20.5],
      [44.6, -7.2, -13.8], [42.0, -6.9, -8.7]].map((q) => V3(q[0], q[1], q[2]));
    const logRun = A.underLog.slice(2);
    const pts = [...entryPts, ...logRun, ...A.leadIn, ...A.helix, ...A.exit, ...linkPts, ...A.dive.slice(2)];
    const path = makePath(pts, { samples: 640 });
    await ctx.yield();
    // landmarks along the path, as u: one walk down the path finds the nearest sample to every one of them
    const marks = { log0: logRun[0], log1: A.underLog[A.underLog.length - 1], helix0: A.helix[0], helix1: A.helix[A.helix.length - 1],
      out: linkPts[0], turn: linkPts[1], side: linkPts[1], east0: linkPts[2], east1: linkPts[6], dive0: A.dive[2], under: A.viewpoints.underFoot };
    const M = {}, mk = Object.keys(marks), mbest = mk.map(() => 1e9), mq = V3(0, 0, 0);
    for (let i = 0; i <= 600; i++) {
      path.pointAt(i / 600, mq);
      for (let k = 0; k < mk.length; k++) { const d = mq.distanceToSquared(marks[mk[k]]); if (d < mbest[k]) { mbest[k] = d; M[mk[k]] = i / 600; } }
    }
    await ctx.yield();
    const S = { ctx, scene, hero, U: hero.uniforms, path, W, weather, R, sunDir, detail, density, vary, M, A, updaters: [], disposers: [], rare: !!vary.rare };
    S.frameAt = makeFramer(path);
    await buildRafts(S);
    await ctx.yield();
    buildBackdrop(S);
    await ctx.yield();
    buildCover(S);
    await ctx.yield();
    buildPod(S);
    await ctx.yield();
    buildGiant(S);
    await ctx.yield();
    await buildShoal(S);
    await ctx.yield();
    await buildAmmonites(S);
    await ctx.yield();
    buildDiscFish(S);
    await ctx.yield();
    buildSpecks(S);
    await ctx.yield();
    if (S.rare) buildPterosaur(S);
    await ctx.yield();

    const camW = V3(0, 0, 0), wp = V3(0, 0, 0), wt = V3(0, 0, -1), far = V3(0, 500, 0);
    const bellPoi = V3(0, -10, -3.6), upPoi = V3(5.2, -3.4, -13.0), footPoi = V3(-1.5, -16.5, -6.7);
    const heroC = V3(0, -8.5, -3.0), sideC = V3(10.6, -7.5, -47.5), bell = V3(0, -10, -3.6), logPoi = V3(0, 0, 0), giantPoi = V3(0, 0, 0), giantPoi2 = V3(0, 0, 0);
    const pace = (u) => {                                          // unhurried first sight, the linger in the helix, a pause on the broadside
      const a = smoothstep(M.log0 - 0.05, M.log0 + 0.01, u), b = smoothstep(M.log1 - 0.01, M.helix0 + 0.03, u), c = smoothstep(M.helix1 - 0.03, M.helix1 + 0.04, u), d = smoothstep(0.84, 0.97, u);
      const x = (u - S.giant1U) / 0.04, x2 = (u - S.giantU + 0.01) / 0.035, x3 = (u - M.east0 - 0.02) / 0.05;   // slower through rafts B and C, and over the giant
      return lerp(lerp(lerp(lerp(0.95, 0.8, a), 0.6, b), 1.15, c), 1.0, d) - 0.3 * Math.exp(-x * x) - 0.25 * Math.exp(-x2 * x2) - 0.3 * Math.exp(-x3 * x3);
    };
    return {
      scene, path, duration: 40, pace,
      title: 'The Hanging Meadow · 182 million years ago',
      ride: 'none', companion: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 400, lookAhead: 8, sway: 0.15, bank: 0.5 },
      pois: [
        { at: heroC, from: 0.0, to: M.log0 - 0.03, weight: 0.5 },
        { at: (time, u) => logPoi.set(clamp(path.pointAt(clamp(u, 0, 1), logPoi).x + 8.5, -8.5, 8.8), -2.6, -1.0), from: M.log0 - 0.03, to: M.log1 - 0.005, weight: 0.75 },
        // the helix is three pictures, not one curtain three times: the bell side-on (first turn); then, heading
        // sunward down the +x lane, a look UP through the deep raft A2 to its trunk and the sun in the window; then
        // the foot of the chandelier from beside it, its lowest lanterns against the blue deep
        { at: (time, u) => bellPoi.set(0, lerp(-10, -17.2, smoothstep(0.385, 0.44, u)), lerp(-3.6, -6.2, smoothstep(0.385, 0.44, u))), from: 0.25, to: M.helix1 + 0.01, weight: 0.6 },
        { at: (time, u) => { const k = smoothstep(0.338, 0.378, u); return upPoi.set(5.2, lerp(-5.0, -13.5, k), lerp(-13.0, -21, k)); }, from: 0.29, to: 0.385, weight: 0.9, fade: 0.25 },   // up at raft A2, levelling out as we come under it
        { at: footPoi, from: 0.885, to: 0.975, weight: 0.4 },          // the finale: the bell's foot hangs whole over the ring
        { at: (time, u) => S.giantAt(u, giantPoi), from: S.giant1U - 0.06, to: S.giant1U + 0.02, weight: 0.4 },   // the giant's first crossing, deep under the bell we leave through
        { at: (time, u) => S.giantAt(u, giantPoi2), from: S.giantU - 0.07, to: S.giantU + 0.03, weight: 0.5 },
        { at: A.viewpoints.underFoot, from: M.dive0 - 0.1, to: M.dive0 + 0.03, weight: 0.7 },
      ],
      portal: { shape: 'circle', radius: 5, color: '#ffab3a', glow: 1.05, revealDistance: 110, tilt: true, style: 'ring' },   // 'ring': the look the water lens was fitted to
      post: {
        exposure: 1.0, bloom: { strength: 0.35, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#ffffff', shadowTint: '#06231c', vignette: 0.15, grain: 0.012 },
      },
      update(dt, time, camera, u) {
        camera.getWorldPosition(camW);
        if (u > 0) { path.pointAt(u, wp); path.tangentAt(u, wt); hero.setWake(wp, wt); } else hero.setWake(far, wt);
        // the water is a little clearer for the two long views of the whole chandelier (entry, and side-on from the turn)
        hero.setLight({ half: 55 + 30 * (1 - smoothstep(0.02, M.log0, u)) + 22 * smoothstep(M.out, M.turn, u) * (1 - smoothstep(M.dive0, M.dive0 + 0.08, u)) });
        hero.update(dt, time, camera);
        for (let i = 0; i < S.updaters.length; i++) S.updaters[i](dt, time, camera, u, camW);
      },
      dispose() { for (const d of S.disposers) d(); if (hero.dispose) hero.dispose(); },
    };
  },
};

// ---------------------------------------------------------------------------------------------------------
// More rafts. The meadow is one of many: further waterlogged trunks ride the same swell, each with its own smaller
// bell of sea lilies hanging DOWN from it and trailing the same way (the part's buildSatellites). Four are threaded
// by the route (B a lane through the curtain, C along the inside of the curtain, D from behind, E over the last
// straight), a deep one (A2) hangs just down-drift of the meadow with a lane we leave the helix through, three stand
// beside the entry (one each side makes an avenue), and the rest are silhouettes at 25 to 90 m that fade into the haze.
// ---------------------------------------------------------------------------------------------------------
async function buildRafts(S) {
  const { path, R, scene, ctx, hero, M } = S, f = newFrame();
  const gatesFor = (u0, u1) => {                                   // crowns to hang 2 m to either side of our line, a little above it
    const out = []; let side = 1;
    for (let u = u0; u <= u1; u += 1.6 / path.length, side = -side) { S.frameAt(u, f); const g = f.p.clone().addScaledVector(f.r, side * R.range(1.95, 2.5)).add(V3(0, R.range(0.0, 1.2), 0)); g.u = u; out.push(g); }
    return out;
  };
  const near = [
    { x: 8, z: -46, yaw: 0.12, len: 15, n: 70, depth: 16, alt: 1 },                                              // a rose bell straight ahead as we leave the meadow
    { x: 22.5, z: -34.5, yaw: 0.0, len: 18, n: 104, depth: 17.5, alt: 1, gate: [M.east0 - 0.05, M.east0 + 0.04] },   // B: its curtain hangs 2.7 m to our right at our depth, its upper ropes cross overhead ...
    { x: 22.5, z: -29.1, yaw: -0.05, len: 15, n: 88, depth: 17, alt: 1, gate: [M.east0 - 0.05, M.east0 + 0.04] },     // C: ... and its neighbour's 2.7 m to our left: a corridor of ropes and ROSE crowns
    { x: 45.3, z: -20, yaw: -0.1, len: 13, n: 70, depth: 13, lanes: [-0.1], alt: 1, gate: [M.east1 - 0.02, M.east1 + 0.04] },   // D, threaded from behind on the north leg
    { x: 24, z: -2.2, yaw: 0.06, len: 12, n: 55, depth: 14, gate: [M.dive0 - 0.03, M.dive0 + 0.06], ghost: 1 },   // the old E and F (fifth polish): laid out as before so every later raft keeps its ropes, but not built: see E2, F2 below
    { x: 33, z: -13.6, yaw: -0.08, len: 11, n: 44, depth: 13.5, alt: 1, ghost: 1 },                                        // F: a rose bell on the right of the last straight, opposite E
    { x: -3.5, z: 19.5, yaw: -0.25, len: 9, n: 42, depth: 9.5 },
    { x: -39, z: 14, yaw: 0.5, len: 12, n: 50, depth: 12 },
    { x: -19.5, z: 9.5, yaw: -1.147, len: 12, n: 52, depth: 12.5, flip: 1 },                                     // its ROOT end is the one in the first frame (a tree's foot, not a bar)
    { x: 5.8, z: -13.2, yaw: 0.06, len: 15, n: 100, depth: 18.5, lanes: [1.3], gate: [M.helix1 + 0.012, M.out - 0.012] },   // A2, a deep bell just down-drift of the meadow: we leave the helix through a lane between its feet
  ];
  const specs = near.map((b) => ({ ...b, check: true, gates: b.gate ? gatesFor(b.gate[0], b.gate[1]) : [] }));
  specs[specs.length - 1].gates.forEach((g) => { if (g.u > 0.512) g.skip = true; });   // every draw is still made (buildSatellites), so nothing else moves
  // the look up at u 0.34 (second polish): the upper water under raft A2 is hung with crowns at every depth from 2.5
  // to 9 m, between us and the sun, so the raft seen from below is a chandelier of lit lanterns, not bare ropes
  { const a2 = specs[specs.length - 1], RD = ctx.core.makeRng(90173 + ((ctx.seed | 0) % 100000));   // its own stream: no draw from R, so the cast and the far rafts stay as they were
    for (let i = 0; i < 30; i++) { const y = -2.4 - 6.8 * Math.pow(RD(), 0.8), g = V3(a2.x + RD.range(-6.6, 6.6), y, a2.z + y * 0.364 + RD.range(-0.9, 0.9)); g.dress = true; a2.gates.push(g); } }
  const farSpots = [[36, 30], [-34, -34], [68, -22], [-18, -70], [72, -66], [8, -92], [-62, -12], [22, 62], [-58, 48], [40, -90], [-45, -62], [70, 18], [-12, 70], [34, -58], [64, -44]];
  const nFar = Math.round(farSpots.length * (S.detail < 0.8 ? 0.6 : 1));
  for (let i = 0; i < nFar; i++) {
    const q = farSpots[i], x = q[0] + R.range(-4, 4), z = q[1] + R.range(-4, 4), len = R.range(10, 16), yaw = R.range(-0.6, 0.6), depth = R.range(11, 17);
    if (path.nearestXZ(x, z).dist < 17) continue;
    specs.push({ x, z, yaw, len, n: Math.round(26 * clamp(S.density, 0.8, 1.2)), depth, check: false, alt: i % 3 === 1 ? 1 : 0 });   // fuller bells: a far raft is a hanging garden, not a plank with a few strands
  }
  // (fifth polish) THE AVENUE TO THE RING. Ropes of the old E hung across our line and across the ring (three bare
  // rods at u 0.83), and F's stood between us and the ring on the turn. Now E2 hangs its curtain 3 to 5 m to the left
  // of the last straight and F2 4 to 6 m to the right, the ring standing clear at the end of the lane between them,
  // and a rose bell (G) hangs beyond the ring, over its rim. own: laid out from a stream of their own.
  specs.push({ x: 24, z: 0.9, yaw: 0.06, len: 12, n: 47, depth: 14, check: true, own: 1, gates: [] },
    { x: 32.5, z: -8.7, yaw: -0.06, len: 11, n: 40, depth: 13.5, alt: 1, check: true, own: 1, gates: [] },
    { x: -35, z: -2.0, yaw: 0.1, len: 14, n: 30, depth: 17, alt: 1, check: true, own: 1, gates: [] });
  const rafts = await buildSatellites(ctx, hero, specs, (x, y, z) => path.distanceTo(x, y, z));
  scene.add(rafts.object); S.rafts = near;
}

// A moving frame on the path: position, tangent, level right and up, at any u (extrapolated beyond both ends).
function makeFramer(path) {
  const up = V3(0, 1, 0);
  return (u, f) => {
    path.posAtDist(u * path.length, f.p); path.tangentAtDist(u * path.length, f.t);
    f.r.crossVectors(f.t, up); const l = f.r.length(); if (l > 1e-4) f.r.multiplyScalar(1 / l); else f.r.set(1, 0, 0);
    f.n.crossVectors(f.r, f.t).normalize();
    return f;
  };
}
const newFrame = () => ({ p: V3(0, 0, 0), t: V3(0, 0, -1), r: V3(1, 0, 0), n: V3(0, 1, 0) });

// ---------------------------------------------------------------------------------------------------------
// Stenopterygius (and, with a longer jaw, Temnodontosaurus). Body-local metres, +Z forward, +Y up, length L.
// Side silhouette as fractions s of the length from the beak tip: thin straight beak to 0.11, skull ends 0.20 (no
// neck), deepest at 0.40, triangular back fin 0.40-0.52, front paddles at 0.27, hind paddles (half the size) at
// 0.60, tail stock thinnest at 0.90, then a tall VERTICAL crescent whose lower lobe carries the spine.
// aInfo = (part: 0 body, 1 fluke, 2 back fin, 3 paddle; half depth of the body there; span 0 root .. 1 tip).
// ---------------------------------------------------------------------------------------------------------
const ICH_ROWS = [   // s, top, bottom, half width (metres, for L = 3). The jaws taper evenly out of the skull: no step
  [0.00, 0.010, -0.014, 0.010], [0.035, 0.027, -0.031, 0.021], [0.075, 0.047, -0.051, 0.036], [0.115, 0.070, -0.072, 0.055],
  [0.15, 0.098, -0.094, 0.080], [0.18, 0.130, -0.118, 0.110], [0.21, 0.170, -0.150, 0.146], [0.26, 0.236, -0.220, 0.200],
  [0.33, 0.282, -0.280, 0.236], [0.40, 0.300, -0.300, 0.246], [0.48, 0.290, -0.290, 0.234], [0.56, 0.258, -0.256, 0.204],
  [0.64, 0.214, -0.210, 0.164], [0.72, 0.160, -0.156, 0.120], [0.79, 0.112, -0.106, 0.082], [0.85, 0.074, -0.072, 0.052],
  [0.90, 0.050, -0.056, 0.034], [0.935, 0.040, -0.052, 0.022],
];
function ichRow(rows, s) {                                      // Catmull-Rom through the table
  let i = 0; while (i < rows.length - 2 && rows[i + 1][0] < s) i++;
  const a = rows[Math.max(i - 1, 0)], b = rows[i], c = rows[i + 1], d = rows[Math.min(i + 2, rows.length - 1)];
  const t = clamp((s - b[0]) / (c[0] - b[0]), 0, 1), t2 = t * t, t3 = t2 * t, o = [s, 0, 0, 0];
  for (let k = 1; k < 4; k++) {
    const m1 = (c[k] - a[k]) / (c[0] - a[0]) * (c[0] - b[0]), m2 = (d[k] - b[k]) / (d[0] - b[0]) * (c[0] - b[0]);
    o[k] = (2 * t3 - 3 * t2 + 1) * b[k] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * c[k] + (t3 - t2) * m2;
  }
  o[3] = Math.max(o[3], 0.004); return o;
}
function ichGeometry(o = {}) {
  const L = 3, jaw = o.jaw ?? 1, NR = o.rings ?? 40, NS = o.sides ?? 20;
  // a longer jaw stretches the first 0.11 of the table (Temnodontosaurus)
  const rows = ICH_ROWS.map((r) => [r[0] < 0.21 ? r[0] * lerp(jaw, 1, r[0] / 0.21) : r[0], r[1], r[2], r[3]]);
  const P = [], F = [], idx = [], head = !!o.head;
  const zOf = (s) => L * (0.5 - s);
  const v = (x, y, z, part, hd, t) => { P.push(x, y, z); F.push(part, hd, t); return P.length / 3 - 1; };
  // body
  const ring = [];
  for (let i = 0; i <= NR; i++) {
    const f = head ? (i / NR) * 0.3 : i / NR, s = 0.935 * (f < 0.3 ? f * (0.22 / 0.3) : 0.22 + (f - 0.3) * (0.78 / 0.7));     // more rings in the head
    const r = ichRow(rows, s), yc = (r[1] + r[2]) * 0.5, hd = (r[1] - r[2]) * 0.5, row = [];
    for (let j = 0; j < NS; j++) {
      const th = (j / NS) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const y = yc + hd * Math.sign(cs) * Math.pow(Math.abs(cs), cs > 0 ? 1.12 : 1.0);   // a rounded back with a hint of a ridge: no flat top, no flat flank
      row.push(v(r[3] * Math.sign(sn) * Math.pow(Math.abs(sn), 1.0), y, zOf(s), 0, hd, 0));
    }
    ring.push(row);
  }
  const nose = v(0, -0.003, zOf(0) + 0.012, 0, 0.007, 0), end = v(0, -0.006, zOf(head ? 0.21 : 0.94), 0, 0.045, 0);
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const j1 = (j + 1) % NS; idx.push(ring[i][j], ring[i][j1], ring[i + 1][j1], ring[i][j], ring[i + 1][j1], ring[i + 1][j]); }
  for (let j = 0; j < NS; j++) { const j1 = (j + 1) % NS; idx.push(nose, ring[0][j1], ring[0][j], end, ring[NR][j], ring[NR][j1]); }
  // a blade: a thin lens-section loft from root along axis; chord(t) half width along cdir, sweep(t) shifts along cdir
  const blade = (part, root, axis, cdir, len, chord, sweep, thick, n = 10) => {
    const ax = V3(...axis).normalize(), cd = V3(...cdir).normalize(), nd = V3(0, 0, 0).crossVectors(ax, cd).normalize();
    const rws = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, c = Math.max(chord(t), 0.002), sw = sweep(t), row = [];
      const cx = root[0] + ax.x * len * t + cd.x * sw, cy = root[1] + ax.y * len * t + cd.y * sw, cz = root[2] + ax.z * len * t + cd.z * sw;
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2, u = Math.cos(a) * c, w = Math.sin(a) * c * thick * (0.6 + 0.4 * Math.cos(a));
        row.push(v(cx + cd.x * u + nd.x * w, cy + cd.y * u + nd.y * w, cz + cd.z * u + nd.z * w, part, Math.cos(a), t));
      }
      rws.push(row);
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < 6; j++) { const j1 = (j + 1) % 6; idx.push(rws[i][j], rws[i + 1][j1], rws[i + 1][j], rws[i][j], rws[i][j1], rws[i + 1][j1]); }
    const tip = v(root[0] + ax.x * len * 1.03 + cd.x * sweep(1), root[1] + ax.y * len * 1.03 + cd.y * sweep(1), root[2] + ax.z * len * 1.03 + cd.z * sweep(1), part, 0.1, 1);
    for (let j = 0; j < 6; j++) idx.push(rws[n][j], rws[n][(j + 1) % 6], tip);
  };
  const zt = zOf(0.925);
  if (!head) {
  // the crescent: upper lobe, and the longer lower lobe that carries the downturned spine
  blade(1, [0, -0.01, zt + 0.02], [0, 0.93, -0.36], [0, 0.36, 0.93], 0.37, (t) => 0.105 * Math.pow(1 - t, 0.75) + 0.008, (t) => -0.16 * t * t, 0.16, 12);
  blade(1, [0, -0.02, zt + 0.02], [0, -0.90, -0.44], [0, -0.44, 0.90], 0.40, (t) => 0.115 * Math.pow(1 - t, 0.7) + 0.008, (t) => -0.13 * t * t, 0.2, 12);
  // triangular back fin just ahead of mid-body, swept back
  const rb = ichRow(rows, 0.45);
  blade(2, [0, rb[1] - 0.03, zOf(0.45)], [0, 0.9, -0.42], [0, 0.42, 0.9], 0.34, (t) => 0.17 * (1 - t) + 0.01, (t) => -0.12 * t, 0.14);
  // four paddles: rounded, front pair 0.45 m, hind pair half that at three fifths of the length
  for (const sx of [-1, 1]) {
    const rf = ichRow(rows, 0.275), rh = ichRow(rows, 0.60);
    blade(3, [sx * rf[3] * 0.82, rf[2] * 0.62, zOf(0.275)], [sx * 0.62, -0.55, -0.56], [sx * 0.42, -0.2, 0.88], 0.46, (t) => 0.035 + 0.10 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.35 * t), (t) => -0.05 * t, 0.16);
    blade(3, [sx * rh[3] * 0.8, rh[2] * 0.7, zOf(0.60)], [sx * 0.55, -0.6, -0.58], [sx * 0.45, -0.2, 0.87], 0.23, (t) => 0.02 + 0.055 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.35 * t), (t) => -0.03 * t, 0.16, 6);
  }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(F, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const eyeS = 0.168 * lerp(jaw, 1, 0.168 / 0.21);
  g.userData.eye = new THREE.Vector3(zOf(eyeS), 0.034, 0.05);        // z, y, radius of the dark disc (0.1 m across; the bony ring is 0.17)
  g.userData.hinge = zOf(0.2 * 1.0);
  return g;
}

// Light for every animal of this world: the hero's sun (shadow blade, caustics, depth) and the green fill, a rim
// from the scattering water, then the fade to the water's own colour.
const ANIMAL_GLSL = /* glsl */`
${WATER_GLSL}
${LIGHT_GLSL}
vec3 litAnimal(vec3 alb, vec3 N, vec3 p, float gloss, float back){
  vec3 V = uCamL - p; V /= max(length(V), 1e-4);
  float nl = dot(N, uSunDir);
  float wr = clamp(nl*.62 + .38, 0., 1.); wr *= wr;                  // a soft terminator: round bodies turn slowly out of the light
  float dif = .7*wr + .3*(.5 + .5*N.y) + back*max(-nl, 0.);
  vec3 c = alb*(sunAt(p)*dif + ambAt(N, p.y));
  float f = 1. - max(dot(N, V), 0.); f = f*f*f;
  c += f*uWUp*.22*uAmbient;
  float f2 = 1. - max(dot(N, V), 0.); f2 *= f2; f2 *= f2;                     // (fifth polish) RIM LIGHT from the shafts: the edge of a body turned toward the sun catches gold
  c += f2*clamp(dot(N, uSunDir)*.75 + .45, 0., 1.)*sunAt(p)*vec3(.4, .4, .32)*(.35 + .65*uWarm);
  vec3 H = uSunDir + V; H /= max(length(H), 1e-4);
  float sp = max(dot(N, H), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  c += gloss*sp*sunAt(p)*.5;
  float sp2 = max(dot(N, H), 0.); sp2 *= sp2; sp2 *= sp2;             // the broad wet sheen under the tight glint
  c += gloss*sp2*sunAt(p)*.17;
  return waterFade(c, p);
}`;

const ICH_VERT = /* glsl */`
attribute vec3 aInfo; attribute vec4 aSwim;                      // per instance: tail phase, amplitude, paddle trim, seed
varying vec3 vL, vN, vP, vInfo; varying float vSeed;
void main(){
  vec3 p = position, n = normal;
  float s = clamp(.5 - p.z/3., 0., 1.);
  float w = smoothstep(.17, 1., s); w = w*w*(1. + .5*s);
  float ph = aSwim.x - s*5.2;
  float k = aSwim.y*.33;
  p.x += k*w*sin(ph) - k*.07*sin(aSwim.x - 1.)*(1. - s);         // the wave grows toward the tail; the head barely answers
  float qb = s - .45; p.x -= (aSwim.z*1.5 + (fract(aSwim.w*5.3) - .5)*.55)*qb*qb;   // (sixth polish) the whole body arcs into a turn, and no two hold the same line
  float slope = k*(w*cos(ph)*5.2/3. );                              // d(offset)/dz, to turn the normals with the body
  n = vec3(n.x - slope*n.z*.8, n.y, n.z + slope*n.x*.8); n /= max(length(n), 1e-4);
  if (aInfo.x > 2.5) { float t = aInfo.z*aInfo.z; p.y += t*(.05*sin(aSwim.x*.35 + aSwim.w*6.) + aSwim.z*.12); }
  vL = position; vInfo = aInfo; vSeed = aSwim.w;
  #ifdef USE_INSTANCING
  mat4 m = modelMatrix*instanceMatrix;
  #else
  mat4 m = modelMatrix;
  #endif
  vec4 wp = m*vec4(p, 1.);
  vP = wp.xyz; vN = mat3(m)*n;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const ICH_FRAG = /* glsl */`
${ANIMAL_GLSL}
uniform vec3 uTop, uBelly, uEye; uniform float uHinge, uPat;
varying vec3 vL, vN, vP, vInfo; varying float vSeed;
float ih(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float ivn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(ih(i), ih(i + vec2(1., 0.)), f.x), mix(ih(i + vec2(0., 1.)), ih(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  float dist = distance(vP, uCamL), fin = step(.5, vInfo.x), nearK = 1. - smoothstep(7., 20., dist);
  vec3 alb; float gloss = .22 + .3*nearK, shade = 1.;
  if (fin < .5) {
    float hd = max(vInfo.y, .01);
    // the wavy line between back and belly: long scallops, then finer ones; on the head it runs into the mouth line
    float wav = sin(vL.z*2.7 + vSeed*6.3)*.6 + sin(vL.z*6.3 + 1.3 + vSeed*11.)*.3 + (ivn(vec2(vL.z*5., vSeed*9.)) - .5)*.5;
    float f = clamp((vL.z - uHinge)/max(1.5 - uHinge, .01), 0., 1.);
    float mouthY = mix(-.052, -.006, f);
    float lineY = mix(-.16*hd + .42*hd*wav, mouthY, smoothstep(uHinge - .35, uHinge + .02, vL.z));
    float kTop = smoothstep(lineY - .012, lineY + .02, vL.y);
    float up = clamp((vL.y - lineY)/max(hd*1.2, .02), 0., 1.);       // 0 at the line, 1 on the spine
    // broad saddles down from the spine (dark on mid slate), a paler flank, then fine speckle
    float pS = 1. + .35*(uPat - 1.);
    float sn = ivn(vec2(vL.z*1.9*pS + vSeed*17., vSeed*3.));
    // (sixth polish) skin at two scales that READS at 10 m: a dark cape over the spine with a scalloped lower edge, a
    // paler slate flank, and on it a row of dark blotches thinning toward the belly line (colours are licence)
    float headK = smoothstep(uHinge - .3, uHinge + .05, vL.z);
    float cape = smoothstep(.36, .6, up + .15*sin(vL.z*7.5*pS + vSeed*20.) + .22*(sn - .5));
    vec3 top = mix(uTop*mix(1.95, 1.3, headK), uTop*.8, cape);
    vec2 bq = vec2(vL.z*3.3*uPat + vSeed*13., up*2.7 + .4*sn), bi = floor(bq), bf = fract(bq) - .5;
    bf += (vec2(ih(bi + 3.1), ih(bi + 9.7)) - .5)*.42;
    float bl = smoothstep(.36, .2, length(bf*vec2(1., 1.25)))*step(.3, ih(bi + vSeed*7.))*(1. - cape)*(1. - headK);
    top = mix(top, uTop*.5, bl*.8);
    float spk = ivn(vL.zy*vec2(46., 60.)*uPat + vL.x*31.)*ivn(vL.zy*vec2(19., 27.)*uPat + 7.);
    top *= 1. + nearK*(.32*smoothstep(.36, .62, spk) - .07);              // pale flecks, only just visible
    float under = smoothstep(.2, 1., -vL.y/hd);                         // 0 on the flank, 1 along the keel of the belly
    vec3 bel = mix(uBelly*(.9 + .1*ivn(vL.zx*30.)), uBelly*vec3(.6, .74, .7), under*.7);   // cream only on the flank: grey-green shadow below
    alb = mix(bel, top, kTop);
    shade = mix(.44, 1., smoothstep(-.7, .5, N.y));                    // the belly falls into its own shadow underneath
    if (abs(vL.x) > .012) {                                           // the huge eye: black disc in a pale ring of bony plates
      vec2 e = vec2(vL.z - uEye.x, vL.y - uEye.y); float de = length(e), r = uEye.z;
      float ang = (abs(e.x) + abs(e.y) > 1e-5) ? atan(e.y, e.x) : 0.;
      alb *= mix(1., .5, smoothstep(r*2.7, r*1.6, de));                 // a dark mask round the eye, so the pale ring reads from far off
      vec3 ringC = mix(alb, vec3(.66, .62, .45), uPat > 1.5 ? .34 : .74)*(.84 + .16*step(.5, fract(ang*2.228)));   // fourteen plates of pale bone: the huge ringed eye is this animal's face
      alb = mix(alb, ringC, smoothstep(r*1.5, r*1.3, de));
      alb = mix(alb, vec3(.004, .006, .008), smoothstep(r*1.06, r*.96, de));
      float hl = smoothstep(r*.22, r*.1, length(e - vec2(.3, .38)*r));
      alb += vec3(.5)*hl; gloss += 1.2*smoothstep(r*1.1, r*.9, de);
      float ml = 1. - smoothstep(.006, .013, abs(vL.y - mouthY));       // the mouth line, back to under the eye
      alb *= 1. - .78*ml*smoothstep(uHinge - .16, uHinge - .06, vL.z);
      if (de > r*1.5) alb = mix(alb, alb*vec3(.8, .62, .6) + vec3(.012, .004, .004), .5*smoothstep(uHinge, uHinge + .3, vL.z)*(1. - kTop));   // the lower jaw a warmer cream
    }
  } else {
    // fins: darker leading edge, pale trailing edge, and the rows of finger bones showing through the paddle skin
    float ch = vInfo.y, t = vInfo.z;
    vec3 base = uTop*(1.25 + .35*t);
    base *= mix(1.25, .45, smoothstep(-.2, .95, ch));
    if (vInfo.x > 2.5) { float bones = smoothstep(.1, .7, sin(t*34. - ch*2.)*sin(ch*8.5 + 1.2)); base *= 1. + .3*bones*nearK*(1. - .5*t); }
    else base *= .85 + .3*sin(ch*9. + t*5.);
    alb = base + uBelly*.04*smoothstep(-.5, -1., ch);
  }
  vec3 c = litAnimal(alb*shade, N, vP, gloss, 0.);
  // the slow net of light crawling over the back, bright enough to read on dark skin
  float T = exp2(-dist/max(uHalf, 1.));
  c += vec3(.62, .74, .6)*caust(vP)*logShade(vP)*uSun*smoothstep(.1, .75, N.y)*.22*T*(1. - .5*fin);
  gl_FragColor = vec4(c, 1.);
}`;
function ichMaterial(S, top, belly, geo, pat = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { ...S.U, uTop: { value: col(top) }, uBelly: { value: col(belly) }, uEye: { value: geo.userData.eye }, uHinge: { value: geo.userData.hinge }, uPat: { value: pat } },
    vertexShader: ICH_VERT, fragmentShader: ICH_FRAG, side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------------------------------------------------
// The pod. Each podmate keeps a station relative to OUR point on the path (metres ahead, to the right, above),
// one station per stretch of the journey; tails beat with time and distance. The station, its sway and the pushes
// that keep it off the eye, inside the picture and clear of the others give the place a podmate WISHES (a law of the
// share, the clock and the lens, read every update). Where it is DRAWN is a carried state that swims after that wish:
// (a) the state begins AT THE WISH at the world's first update and at every POSED update (one whose clock is not the
//     last clock plus its step to within SLACK, or whose step is not zero and whose share went back or on by more than
//     REACH, or a zero step straight after a posed one, or any update straight after such a zero step: a world held
//     still at a pose has nothing to carry on from): there the place, heading, bank, matrix, swim values and
//     S.pod.positions are the wish's own, so a posed still shows the wish; every other update is FLOWN (a zero step
//     straight after a flown one, the engine paused or the frame of a crossing, is flown and holds the state still);
// (b) flown, the place moves straight at the wish by no more than the step's reach: the metres its own bare station
//     (posOf) travelled in this update, plus CLOSE metres a second (more the further off its wish it stands, SPRINT at
//     most) (c) times ctx.flight.rate, times the step. Then the guards of the animal as drawn act once, each a rule of
//     the place: nobody is drawn through anybody (the separation from the places as drawn of the podmates before it);
//     nobody above the water's skin (the station's own clamp, y not over -0.32); nobody in the wood (its body's line
//     from tail to nose keeps KNOT metres from every log as built) nor in the giant (the same line keeps the two
//     girths from the giant's long axis): BY TIME, the step and these four together leave it no further from where it
//     stood than the reach and SPRINT metres a second; then the keep-off from the eye (its one line, called as it
//     stands) for the body's middle, for its tail's end and for its nose, and the skin once more;
// (d) the heading turns toward the wish's heading leaned toward the swim of its own (its pitch held inside the limits
//     the wish's own track keeps, 0.4 down and 0.5 up) by no more than TURN radians a second, and the bank eases by no
//     more than BANK, both times the rate; the side a pair gives way to in the picture is HELD from the update the pair
//     meets until it is clear.
// S.pod.positions holds the places as drawn; the wishes are kept beside them and are what a podmate's wish reads.
// ---------------------------------------------------------------------------------------------------------
function buildPod(S) {
  const { path, M, R, scene } = S, ss = smoothstep;
  const geo = ichGeometry();
  const nAd = 5 + Math.floor(R() * 4.999), calf = R.chance(0.45), N = nAd + (calf ? 1 : 0), NE = 2;   // NE: two that go down to look at the giant
  const mesh = new THREE.InstancedMesh(geo, ichMaterial(S, '#43595F', '#EFE8D6', geo), N + NE);
  mesh.frustumCulled = false; mesh.name = 'pod';
  const swim = new Float32Array((N + NE) * 4), swimAttr = new THREE.InstancedBufferAttribute(swim, 4);
  swimAttr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aSwim', swimAttr);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const uBreath = lerp(M.log0, M.log1, 0.78);
  const mates = [
    { E: [5.6, -2.3, -1.3], L: [8, 0.4, -0.5], H: [9, 0.3, -0.3], T: [6.5, -5.6, -2.2], D: [13, 0, -0.3], roll: -1, size: 1 },
    { E: [5.0, 2.5, -1.1], L: [7.5, 2.2, 0.1], H: [14.5, 0.2, 0.4], T: [4.5, 6.2, -1.6], D: [5.5, 3.6, -1.3], roll: lerp(M.log0, uBreath, 0.25), rollTo: lerp(M.log0, uBreath, 0.8), size: 1.04 },
  ];
  for (let i = 2; i < nAd; i++) {
    const sg = i % 2 ? 1 : -1;
    mates.push({ E: [R.range(9, 24), sg * R.range(4, 10), R.range(-3, 1.5)], L: [R.range(0, 14), R.range(4.5, 10), R.range(-2.5, 1.2)], H: [R.range(-1, 13), R.range(6.3, 8.6), R.range(-2.5, 2.5)],
      T: sg > 0 ? [R.range(5, 10), R.range(4.5, 8), R.range(-3.8, -2.7)] : [R.range(2, 10), -R.range(4.5, 9), R.range(-3.6, -1.2)], D: [R.range(3.5, 11), sg * R.range(3.2, 6), R.range(-3, -0.7)], roll: R.range(0.05, 0.9), size: R.range(0.9, 1.1) });
  }
  if (calf) { const m = mates[2 + Math.floor(R() * (nAd - 2))] || mates[1], d = (a) => [a[0] - 0.5, a[1] + (a[1] > 0 ? 0.55 : -0.55), a[2] - 0.35]; mates.push({ E: d(m.E), L: d(m.L), H: d(m.H), T: d(m.T), D: d(m.D), roll: -1, size: 0.27, par: m, dOf: d }); }
  mates[0].O = [9.5, -5.2, -2.2]; mates[1].O = [12.5, 6.4, -2.8]; mates[1].T = [9, 4.4, -2.4];   // (sixth polish) never dead ahead of us: an animal seen from straight behind is a blob
  // In the helix a podmate "ahead and to the right" is round the bend and behind the curtain. So the two leaders go
  // down the lane just ahead of and BELOW us, where no rope hangs (the colony was built round this line), and a third
  // rises ahead of us to breathe: a dark swimmer against the sunlit ceiling in the look up through the rafts.
  mates[0].H = [6.2, 0.9, -1.9]; mates[1].H = [10.5, -0.7, -3.1]; mates[2].H = [7, 1.5, -1.2];
  const uBreath2 = 0.337;
  for (const m of mates) { if (m.T[1] > 2.5) m.T = [m.T[0], -(m.T[1] + 1.5), m.T[2]]; if (m.T[1] < -7.5) m.T = [m.T[0] + 2, -7.5, m.T[2]]; }   // the loop turns left all the way: on its outside a podmate would be cut by the frame
  // (fifth polish) In open water the pod is a loose group IN DEPTH, not a string of beads down one bearing: near and
  // far, left and right of our line, above and below it (stations in metres ahead, right, up; no draw from R). On
  // the dive they close in beside us, so that we go into the ring among them.
  // (sixth polish) every one BELOW our eye and off our axis, none more than 14 m ahead: we look down on lit backs in
  // three-quarter view, the lower half of the picture is theirs, and nobody is seen belly-first from behind and below
  const TT = [[10.5, -5.0, -1.8], [15, 5.0, -1.0], [9.5, -6.4, -0.4], [16, -3.4, -4.6], [15, -8.8, -3.6], [10, 3.6, -2.8], [13.5, -6.2, -0.2]];   // a fan: each at its own bearing and depth, none within 20 degrees of the frame's lower edge
  const DD = [[5.7, -4.1, -1.1], [8.2, 7.4, 0.6], [14.1, 5.1, 2.1], [11.9, -5.3, -3.4], [8.4, -7.1, 1.3], [15.1, 9.8, -1.6], [16, -8.2, 0]];   // (sixth polish) beside the ring, never across its disc   // each 3.5 m or more from the next: nobody is shoved out of the frame
  mates.forEach((m, i) => { if (i >= 2 && !m.par) { m.T = TT[(i - 2) % 7]; m.D = DD[(i - 2) % 7]; if (m.roll < 0.5) m.roll = 0.5 + m.roll * 0.8; m.L = [Math.max(m.L[0], 9), m.L[1], -0.5 - 0.4 * Math.abs(m.L[2])]; } });   // they bank and flash in open water, where we look down on them; under the log we look up, and a banked animal there is a pale shape on end
  mates[0].E = [8.5, -2.6, -1.7]; mates[0].L = [13, -0.6, -1.8]; mates[1].L = [9, 1.6, -0.9];   // ahead of us and under our line on the log run: whole in the picture while the gaze is up at the trunk                                   // clear of the podmate beyond it in the first frame
  mates.forEach((m) => { if (m.par) { m.T = m.dOf(m.par.T); m.D = m.dOf(m.par.D); } });
  mates[1].D = [5.6, 3.3, -1.7]; mates[0].D = [16, -3.8, -0.8];      // the leader goes through the ring ahead of us, off its centre: seen three-quarter on, not as a tail on the rim
  mates.forEach((m, i) => { m.free = i >= 2; m.kf = 1.15 + 0.6 * ((i * 0.618) % 1); if (!m.O) m.O = m.T; m.seed = R(); m.rate = R.range(1.8, 2.3) * (m.size < 0.5 ? 1.8 : 1); if (m.rollTo === undefined) m.rollTo = m.roll + 0.05; swim[i * 4 + 3] = m.seed; swim[i * 4 + 1] = 1; });
  mates.forEach((m, i) => { m.sgE = []; m.sgT = []; for (let j = 0; j < i; j++) { m.sgE.push(-1); m.sgT.push(m.T[2] >= mates[j].T[2] ? 1 : -1); } });   // which of a pair rides higher in the picture
  const f = newFrame(), o = [0, 0, 0];
  const station = (m, u) => {
    const a = ss(M.log0 - 0.07, M.log0, u), b = ss(M.log1 - 0.01, M.helix0 + 0.015, u), c = ss(M.helix1 - 0.01, M.helix1 + 0.03, u), d = ss(M.dive0 - 0.03, M.dive0 + 0.05, u);
    const g = ss(M.turn - 0.05, M.turn - 0.005, u);                  // ... and out of the line of sight before the bell comes round                          // O: close ahead of us round the outbound turn
    const wE = 1 - a, wL = a * (1 - b), wH = b * (1 - c), wO = c * (1 - d) * (1 - g), wT = c * (1 - d) * g, wD = d;
    for (let k = 0; k < 3; k++) o[k] = wE * m.E[k] + wL * m.L[k] + wH * m.H[k] + wO * m.O[k] + wT * m.T[k] + wD * m.D[k];
    // a podmate swims far enough ahead of us to be seen whole, never as a head cut by the frame edge
    const need = lerp(Math.abs(o[1]) * m.kf + 2 + 5 * (m.kf - 1.15), (Math.abs(o[1]) * (1.02 + 0.12 * (m.kf - 1.15)) + 1.5) * (1 - 0.3 * d), c); if (m.free && o[0] < need) o[0] = need;   // (sixth polish) nearer in open water, where we look down on them; before the helix as it was   // each at its own bearing
    return o;
  };
  const posOf = (m, i, u, out) => {
    station(m, u);
    if (i === 1) { const x = (u - uBreath) / 0.022; o[2] += Math.exp(-x * x) * (3.15 - m.L[2]); }             // the breath: up to the ceiling and back
    if (i === 0) o[0] += 3 * ss(0.9, 1, u);
    S.frameAt(u + o[0] / path.length, f);
    out.copy(f.p).addScaledVector(f.r, o[1]).addScaledVector(V3u, o[2]);
    if (i === 2) { const x = (u - uBreath2) / 0.034; out.y = lerp(out.y, -0.36, Math.exp(-x * x)); }   // the second breath
    return out;
  };
  const crt = V3(1, 0, 0), cup = V3(0, 1, 0), cfw = V3(0, 0, -1);
  const V3u = V3(0, 1, 0), pa = V3(0, 0, 0), pb = V3(0, 0, 0), pc = V3(0, 0, 0), fw = V3(0, 0, 1), fw2 = V3(0, 0, 1), rt = V3(1, 0, 0), upv = V3(0, 1, 0), mtx = new THREE.Matrix4(), scl = V3(1, 1, 1);
  let hx = 1, hy = 0.6;
  const keepIn = (m, w, camW) => {
    if (w < 0.01) return;
    pa.subVectors(pc, camW); const z0 = pa.dot(cfw), k = w * ss(-4, 1, z0); if (k < 0.001) return;   // one well behind us is left alone: it comes into the picture from the side as it draws level
    const z = Math.max(z0, 5.5), x = pa.dot(crt), y = pa.dot(cup), mx = Math.max(z * hx * 0.84 - 1.8 * m.size, 0.8), my = Math.max(z * hy * 0.8 - 1.4 * m.size, 0.5);
    pc.addScaledVector(crt, (clamp(x, -mx, mx) - x) * k).addScaledVector(cup, (clamp(y, -my, my) - y) * k).addScaledVector(cfw, (z - z0) * k);
  };
  S.pod = { mates, positions: mates.map(() => V3(0, 0, 0)), uBreath, mesh };
  let tBreath = -99, lastU = 0;
  // THE CARRIED STATE (made here; the updater makes nothing). Metres and seconds of the animals, none of a place of the flight:
  // CLOSE 6 m/s, what a podmate swims on top of its station's own travel to reach its wish (the spread between the pod's
  //   linger of 4.3 and its hurry of 10.7 m/s), and 1 m/s more for each metre it stands off that wish, up to SPRINT 10 m/s
  //   (the pod's sprint); TURN 2 rad/s (a 3 m swimmer at the pod's mean speed on a circle of its own
  //   length; the helix asks 0.8); BANK 1.2 rad/s (the largest bank, 0.6, in half a second); WEIGHT 0.5, how far the heading
  //   leans toward the swim of its own (under 1: the aim cannot pass through zero); MARGIN 0.25 (of the ellipse's half width W:
  //   0.8 to 1.6 m in the picture, more than the clock's sway can carry a pair back across); SLACK 0.05 s (a tool may hand
  //   its last step with the clock a sixtieth further on than its step); REACH, metres a second: four times the route's
  //   length over the flight's 40 s (the duration this world returns at its end: the two are changed together), the
  //   furthest a flown step goes on at rate 1; GIRTH 0.8 m, how far a podmate's skin reaches from its line from tail to nose
  //   (its paddles 0.45 m, its tail's sweep 0.35 m); KNOT 1 m, what that line keeps from the wood as built (the girth, and
  //   0.2 m for the log's roll and heave at a stub's end).
  const CLOSE = 6, SPRINT = 10, TURN = 2, BANK = 1.2, WEIGHT = 0.5, MARGIN = 0.25, SLACK = 0.05, REACH = 4 * path.length / 40, GIRTH = 0.8, KNOT = 1;
  const wish = mates.map(() => V3(0, 0, 0)), ps = V3(0, 0, 0);       // where each wishes to be (what a later podmate's wish reads); this podmate's bare station in this update
  const body = mates.map(() => ({ p: V3(0, 0, 0), f: V3(0, 0, 1), s: V3(0, 0, 0), bank: 0 }));   // as drawn: place, heading, the bare station of the last update, bank
  const give = mates.map((m, i) => mates.slice(0, i).map(() => ({ on: 0, side: 1, way: 0, sx: 1, shut: 0 })));   // a pair in the picture: engaged, the held side (up 1, down -1), the way (0 up-or-down, 1 sideways), the sideways side (the picture's right 1, left -1), seconds its depth gate has stayed shut
  let first = true, wasPosed = false, held = false, clockLast = 0, shareLast = 0;   // held: the update before was a zero step straight after a posed one (the world stood still at a pose)
  // THE WOOD: every log as built (the meadow's trunk and each raft's, with its root plate and its stubs) as points: the mean of
  // its built vertices in each half-metre cell of the world, stood where the hero and the rafts stand it (read here; nothing of
  // them is changed); and with each log its axis (the mesh's own x axis, first vertex to last) and how far its points lie from it
  const wood = []; let woodLow = 0;
  { const tm = new THREE.Matrix4(), im = new THREE.Matrix4(), q3 = V3(0, 0, 0);
    const add = (o, inst) => {
      const wm = inst ? inst.clone() : new THREE.Matrix4(); for (let q = o; q; q = q.parent) wm.premultiply(tm.compose(q.position, q.quaternion, q.scale));
      const P = o.geometry.getAttribute('position'), cells = new Map(); let x0 = Infinity, x1 = -Infinity;
      for (let k = 0; k < P.count; k++) { const x = P.getX(k); if (x < x0) x0 = x; if (x > x1) x1 = x; }
      const a = V3(x0, 0, 0).applyMatrix4(wm), u = V3(x1, 0, 0).applyMatrix4(wm).sub(a), len = u.length(); if (len < 0.5 || a.y > 50) return;   // (a raft laid out but not built stands far overhead at no size: left out)
      u.multiplyScalar(1 / len);
      for (let k = 0; k < P.count; k++) { q3.fromBufferAttribute(P, k).applyMatrix4(wm); const key = Math.round(q3.x * 2) + ',' + Math.round(q3.y * 2) + ',' + Math.round(q3.z * 2), c = cells.get(key); if (c) { c[0] += q3.x; c[1] += q3.y; c[2] += q3.z; c[3]++; } else cells.set(key, [q3.x, q3.y, q3.z, 1]); }
      const pts = new Float32Array(cells.size * 3); let n = 0, far = 0;
      for (const c of cells.values()) { const x = c[0] / c[3], y = c[1] / c[3], z = c[2] / c[3]; pts[n++] = x; pts[n++] = y; pts[n++] = z; q3.set(x, y, z).sub(a); q3.addScaledVector(u, -clamp(q3.dot(u), 0, len)); far = Math.max(far, q3.length()); if (y < woodLow) woodLow = y; }
      wood.push({ a, u, len, far, pts });
    };
    const lm = S.hero.object.getObjectByName('log'), rl = scene.getObjectByName('raft-logs');
    if (lm) add(lm, null);
    if (rl) for (let q = 0; q < rl.count; q++) { rl.getMatrixAt(q, im); add(rl, im); } }
  // THE BODY'S WHOLE LINE KEEPS OFF A POINT: the nearest point of the line from tail to nose (h either way along the heading f
  // from the place pc) keeps the distance `keep` from the point `from`: a point of the wood, or of the giant's long axis
  const lineOff = (keep, h, f, from) => {
    const t = clamp(pa.subVectors(from, pc).dot(f), -h, h); pa.copy(pc).addScaledVector(f, t).sub(from); const dl = pa.length();
    if (dl < keep && dl > 1e-3) pc.addScaledVector(pa, (keep - dl) / dl);
  };
  S.updaters.push((dt, time, camera, u, camW) => {
    const du = 0.004, ce = camera.matrixWorld.elements; hy = Math.tan((camera.fov || 62) * Math.PI / 360); hx = hy * (camera.aspect || 1.78);
    crt.set(ce[0], ce[1], ce[2]).normalize(); cup.set(ce[4], ce[5], ce[6]).normalize(); cfw.set(-ce[8], -ce[9], -ce[10]).normalize();
    // POSED OR FLOWN, by what the update is handed alone (its step, its clock, the share) and the flight's rate as the engine hands it
    const fl = S.ctx.flight, rate = fl && fl.rate >= 0 ? fl.rate : 1;
    // (a ZERO STEP takes the kind of the update before it and its share is not asked: the engine paused hands the share again, the
    // frame of a crossing hands the share the crossing left, a little past the last; flown, the state is held through it)
    const posed = first || held || Math.abs(time - clockLast - dt) > SLACK || (dt > 0 ? u < shareLast || (u - shareLast) * path.length > REACH * rate * dt : wasPosed);
    first = false; held = dt === 0 && wasPosed; wasPosed = posed; clockLast = time; shareLast = u;
    for (let i = 0; i < N; i++) {
      const m = mates[i];
      posOf(m, i, u - du, pa); posOf(m, i, u + du, pb); posOf(m, i, u, pc);
      ps.copy(pc);                                                    // the bare station of this update
      fw.subVectors(pb, pa); const l = fw.length(); if (l > 1e-5) fw.multiplyScalar(1 / l); else fw.set(0, 0, 1);
      posOf(m, i, u + 3 * du, pa); fw2.subVectors(pa, pb).normalize();
      // nobody hangs nose-down or tail-down while changing station: a podmate swims the way the pod is going
      S.frameAt(u + station(m, u)[0] / path.length, f); fw.addScaledVector(f.t, 0.9).normalize(); fw.y = clamp(fw.y, -0.4, 0.5);
      const turn = clamp((fw.x * fw2.z - fw.z * fw2.x) * 6, -0.6, 0.6);                          // bank into the turn (of its own track, before the toe-in below)
      let o1 = 0;
      { const dv = ss(M.dive0 - 0.03, M.dive0 + 0.05, u), ow = ss(M.helix1 - 0.05, M.helix1 - 0.005, u) * (1 - dv);   // (sixth polish) in open water too each turns a little in toward our line
        const la = ss(M.log0 - 0.07, M.log0, u);
        fw.addScaledVector(f.r, -(0.46 * dv + 0.45 * ow + 0.4 * (1 - la) + (m.free ? 0.55 : 0.25) * la * (1 - ss(M.log1 - 0.01, M.helix0 + 0.015, u))) * clamp(o[1] / 1.5, -1, 1)).normalize(); o1 = o[1]; }   // never tail-on: from dead astern the tall tail reads as an animal standing on end   // on the dive they close on the ring: seen three-quarter on, never end-on
      const ph = i * 2.1 + m.seed * 9;
      pc.x += 0.35 * Math.sin(time * 0.5 + ph); pc.y += 0.22 * Math.sin(time * 0.37 + ph * 1.3); pc.z += 0.35 * Math.sin(time * 0.43 + ph * 0.7);
      pc.addScaledVector(fw, 0.5 * Math.sin(time * 0.23 + ph * 1.7));
      if (pc.y > -0.32) pc.y = -0.32;
      // in open water nobody hangs half out of the frame at arm's length: a podmate keeps 6.2 m from our eye (4 m as we leave the helix)
      const keep = Math.max(4.0 * ss(M.helix1 - 0.03, M.helix1 + 0.01, u) + 2.2 * ss(M.helix1 + 0.01, M.helix1 + 0.05, u), m.free ? 5.5 * (1 - ss(M.log1 - 0.03, M.log1, u)) : 0);
      const keepOff = () => { if (keep > 0.01) { pa.subVectors(pc, camW); const dl = pa.length(); if (dl < keep && dl > 1e-3) pc.addScaledVector(pa, (keep - dl) / dl); } };
      keepOff();
      // (sixth polish) ... and whole inside the picture: in open water, on the dive and at the entry a podmate that the gaze
      // would cut at the frame edge slides in until its whole length shows (the free ones beside the log run too; never in the helix)
      const wC = Math.max(1 - (m.free ? ss(M.log1 - 0.03, M.log1, u) : ss(M.log0 - 0.07, M.log0 - 0.03, u)), ss(M.helix1 + 0.005, M.helix1 + 0.04, u));
      const wS = 1 - ss(M.helix0 - 0.02, M.helix0 + 0.02, u) * (1 - ss(M.helix1 + 0.005, M.helix1 + 0.04, u)), early = u < M.helix0 + 0.1;
      keepIn(m, wC, camW);
      if (S.giantOn > 0.01) {                                         // well clear of the giant: 3.8 m from its long axis, and clear of it in the picture
        pa.subVectors(pc, S.giantPos); const al = clamp(pa.dot(S.giantDir), -5.5, 5.5); pa.addScaledVector(S.giantDir, -al); pa.addScaledVector(cfw, -0.6 * pa.dot(cfw));
        const dl = pa.length(); if (dl < 3.8) { if (dl > 1e-3) pc.addScaledVector(pa, (3.8 - dl) / dl * S.giantOn); else pc.y += 3.8 * S.giantOn; }
      }
      // nobody swims through anybody's wish (3.4 m apart; the calf less), and (sixth polish) nobody is DRAWN ACROSS anybody: each
      // keeps a long ellipse of the picture to itself (6.6 m by 2.5 m at its own depth). At a POSED update the three passes
      // are the law as it always was: the side is the pair's fixed one, the push ramps in for a podmate on the far side, the
      // way (up-or-down, or sideways where the picture has no room above or below) and the sideways side are chosen by where the
      // two stand; and what was chosen is noted for the pair. FLOWN, a pair's choice is HELD: (1) a pair is engaged in the first
      // update in which its gates are open and it stands inside the ellipse's width, on the side of its neighbour it stands on then
      // (the fixed side where level), up-or-down; (2) while engaged it is pushed toward the held side until the height H is kept
      // (the ramp taken as 1), or sideways toward the held side until the width is; (3) the way changes once, from up-or-down to
      // sideways, by the same test of room, to the side that test picks then, and never back; (4) it is released when, before the
      // passes (the pass -1, which only looks), it stands clear of the width by MARGIN, or the gate wS shuts, or its depth gate
      // has stayed shut for a second. The wish itself may still step where the picture asks; the place as drawn swims.
      for (let it = posed ? 0 : -1; it < 3; it++) {
        for (let j = 0; j < i; j++) {
          const q = wish[j], sep = m.size < 0.5 ? 1.1 : 3.4, g = give[i][j]; pa.subVectors(pc, q); const dl = pa.length();
          if (posed && it === 0) { g.on = 0; g.way = 0; g.shut = 0; }
          if (it >= 0 && dl < sep) { if (dl > 1e-3) pc.addScaledVector(pa, (sep - dl) / dl); else pc.y -= sep; }
          if (wS < 0.01 || m.par || mates[j].par) { g.on = 0; continue; }
          pb.subVectors(pc, camW); pa.subVectors(q, camW); const z = pb.dot(cfw), zq = pa.dot(cfw); if (z < 2 || zq < 2) { if (it < 0 && (g.shut += dt) >= 1) g.on = 0; continue; }
          const k = z / zq, kk = 0.5 * (1 + clamp(k, 0.6, 3)), x = pb.dot(crt), y = pb.dot(cup), dx = x - pa.dot(crt) * k, dy = y - pa.dot(cup) * k, W = 3.3 * kk, ex = Math.abs(dx) / W;   // kk: a nearer animal is larger in the picture
          if (it < 0) { g.shut = 0; if (ex >= 1 + MARGIN) g.on = 0; continue; }
          if (ex >= 1) continue;
          const H = 1.25 * kk * Math.sqrt(1 - ex * ex), sg = (early ? m.sgE : m.sgT)[j], my = Math.max(z * hy * 0.8 - 1.4 * m.size, 0.5);
          if (posed) {
            const sv = sg * dy; g.on = 1; g.side = sv >= 0 ? sg : -sg; if (sv >= H) continue;
            const push = (H - sv) * ss(-1.6 * H, -0.9 * H, sv);
            if (wC < 0.5 || Math.abs(y + sg * push) <= my) { pc.addScaledVector(cup, sg * push * wS); g.side = sv + push * wS >= 0 ? sg : -sg; }
            else { const mx = Math.max(z * hx * 0.84 - 1.8 * m.size, 0.8), sx = dx >= 0 ? 1 : -1, amt = (1 - ex) * W, near = Math.abs(x + sx * amt) <= mx; pc.addScaledVector(crt, (near ? sx * amt : -sx * (1 + ex) * W) * wS); g.way = 1; g.sx = near ? sx : -sx; }   // no room above or below: it gives way sideways
            continue;
          }
          if (!g.on) { g.on = 1; g.way = 0; g.shut = 0; g.side = sg * dy >= 0 ? sg : -sg; }
          if (g.way === 0) {
            const sv = g.side * dy; if (sv >= H) continue;
            if (wC < 0.5 || Math.abs(y + g.side * (H - sv)) <= my) { pc.addScaledVector(cup, g.side * (H - sv) * wS); continue; }
            const mx = Math.max(z * hx * 0.84 - 1.8 * m.size, 0.8), sx = dx >= 0 ? 1 : -1; g.way = 1; g.sx = Math.abs(x + sx * (1 - ex) * W) <= mx ? sx : -sx;   // no room above or below: sideways from now on
          }
          pc.addScaledVector(crt, g.sx * (W - g.sx * dx) * wS);
        }
        if (it >= 0 && wC > 0.01) keepIn(m, wC, camW);
      }
      if (!posed && pc.y > -0.32) pc.y = -0.32;                       // flown, the wish too stays under the water's skin after the give-way (the station's own clamp above, once more)
      keepOff();
      // (sixth polish) NEVER END-ON: an animal seen from dead astern (or head-on) is a blob, and from above it seems to stand
      // on its tail. Where the water is open each keeps at least 35 degrees between its heading and our line of sight to it,
      // turned in toward our line (a soft side, so it never flips).
      const wE = Math.max(wC, ss(M.helix1 - 0.04, M.helix1 - 0.005, u));
      if (wE > 0.01) {
        pa.subVectors(pc, camW); const dep = clamp(-pa.dot(cup) / Math.max(pa.length(), 1e-3) * 3.2, 0, 1), cm = 0.57 + 0.25 * dep; pa.y = 0; const hl = pa.length(), sdc = -clamp(o1 / 1.5, -1, 1), am = Math.abs(sdc);
        if (hl > 1e-3 && am > 1e-3) {
          const px = -pa.z / hl, pz = pa.x / hl, sgn = sdc > 0 ? 1 : -1, cc = sgn * (fw.x * px + fw.z * pz);
          if (cc < cm && cc > -cm) { const dlt = (lerp(-cm, cm, ss(-cm, -0.3, cc)) - cc) * sgn * am * wE; fw.x += px * dlt; fw.z += pz * dlt; fw.normalize(); }
        }
      }
      // pc and fw are the WISH here. From here on they are the animal AS DRAWN: at a posed update the wish itself; flown, the
      // carried place after its step toward the wish and the guards of the place as drawn, and the carried heading after its turn
      const b = body[i]; wish[i].copy(pc);
      if (posed) { b.p.copy(pc); b.f.copy(fw); b.bank = turn; }
      else if (dt > 0) {
        pb.subVectors(pc, b.p); const gap = pb.length(); rt.copy(b.p);   // rt (free until the matrix is made below): where it stood
        const reach = ps.distanceTo(b.s) + Math.min(CLOSE + gap, SPRINT) * rate * dt;   // THE STEP'S REACH: its own station's travel in this update, and its swim (faster the further off its wish it stands)
        if (gap <= reach) b.p.copy(pc); else b.p.addScaledVector(pb, reach / gap);
        pc.copy(b.p);
        for (let j = 0; j < i; j++) { const sep = m.size < 0.5 ? 1.1 : 3.4; pa.subVectors(pc, S.pod.positions[j]); const dl = pa.length(); if (dl < sep) { if (dl > 1e-3) pc.addScaledVector(pa, (sep - dl) / dl); else pc.y -= sep; } }   // nobody is drawn through anybody: the separation of the passes above, once, on the place as drawn against the places as drawn of the podmates before it
        if (pc.y > -0.32) pc.y = -0.32;                               // nobody above the water's skin (the station's own clamp)
        const hb = 1.5 * m.size; if (pc.y > woodLow - KNOT - hb) for (let k = 0; k < wood.length; k++) { const g = wood[k]; pa.subVectors(pc, g.a); pa.addScaledVector(g.u, -clamp(pa.dot(g.u), 0, g.len)); if (pa.length() > g.far + KNOT + hb) continue; const q = g.pts; for (let n = 0; n < q.length; n += 3) lineOff(KNOT, hb, b.f, upv.set(q[n], q[n + 1], q[n + 2])); }   // nobody in the wood: the body's line keeps KNOT from every point of a log it is near, and so goes round the log where its wish stands beyond it (upv, free until the matrix is made below: the point)
        if (S.giantOn > 0.01) { const on = S.giantOn * 3; for (let k = -3; k <= 3; k++) lineOff(GIRTH * (1 + on), hb, b.f, upv.copy(S.giantPos).addScaledVector(S.giantDir, 0.5 * k * on)); }   // nobody in the giant: it is the same build three times the size (buildGiant's 3; the two are changed together), so its long axis is seven points half its own unit apart, and the body's line keeps its girth and ours from each
        pb.subVectors(pc, rt); const sl = pb.length(), most = reach + SPRINT * rate * dt; if (sl > most) pc.copy(rt).addScaledVector(pb, most / sl); if (pc.y > -0.32) pc.y = -0.32;   // BY TIME: its step and these four together leave it no further from where it stood than its reach and the sprint, so two that stand too near part in a swim, not in a frame; and the skin once more (no further from where it stood: that was under the skin)
        if (keep > 0.01) for (let k = 0; k < 4; k++) {               // the keep-off from the eye (its one line above, called as it stands) guards the animal as drawn: its middle, then its tail's end and its nose
          keepOff(); for (let e = -1; e <= 1; e += 2) { upv.copy(pc); pb.copy(pc).addScaledVector(b.f, e * hb); pc.copy(pb); keepOff(); pc.sub(pb).add(upv); }   // (pc stands at the end for the call; what the call moved it by moves the place)
          if (pc.y > -0.32) pc.y = -0.32; else break;                 // the skin holds it down again, and what the skin took back is kept off again (to the fourth time)
        }
        b.p.copy(pc);
        // THE AIM: the wish's heading leaned toward the place's own travel in this update as drawn (less its station's; no longer than
        // the reach: the lean is under 1, so the aim cannot pass through zero). Its BEARING is taken in the level (the wish's level
        // heading and the travel's level part); its PITCH is the leaned heading's, held inside the limits the wish's own track keeps
        // (0.4 down, 0.5 up, as where fw is made above): a swim up or down toward its seat noses an animal up or down as far as the
        // pod's own track may and stands nobody on end. The heading as drawn turns its bearing (the short way round) and its pitch
        // toward that aim, the two together by no more than TURN: its pitch only ever moves toward the aim's, so it stands no
        // steeper than it stood or is aimed
        pb.subVectors(pc, rt).sub(ps).add(b.s); const lk = WEIGHT / Math.max(reach, pb.length(), 1e-9), hw = Math.max(Math.hypot(fw.x, fw.z), 1e-6), ax = fw.x / hw + pb.x * lk, az = fw.z / hw + pb.z * lk;
        const ay = clamp((fw.y + pb.y * lk) / Math.max(Math.hypot(fw.x + pb.x * lk, fw.y + pb.y * lk, fw.z + pb.z * lk), 1e-6), -0.4, 0.5);
        const dth = Math.atan2(ax * b.f.z - az * b.f.x, ax * b.f.x + az * b.f.z), p0 = Math.asin(clamp(b.f.y, -1, 1)), dp = Math.asin(ay) - p0, ang = Math.hypot(dth, dp), lim = TURN * rate * dt, kt = ang > lim ? lim / ang : 1;
        const th = b.f.x * b.f.x + b.f.z * b.f.z > 1e-12 ? Math.atan2(b.f.x, b.f.z) + dth * kt : Math.atan2(ax, az), p1 = p0 + dp * kt, ch = Math.cos(p1);   // (a heading that stood straight up or down has no bearing: it takes the aim's)
        b.f.set(Math.sin(th) * ch, Math.sin(p1), Math.cos(th) * ch);
        b.bank += clamp(turn - b.bank, -BANK * rate * dt, BANK * rate * dt);
      }
      pc.copy(b.p); fw.copy(b.f);                                     // (a zero step, the engine paused or the frame of a crossing, holds place, heading and bank as they stand)
      b.s.copy(ps);
      const roll = (m.roll >= 0 ? (i === 1 ? Math.PI * 2 * ss(m.roll, m.rollTo, u) : 0.3 * Math.sin(Math.PI * ss(m.roll, m.rollTo + 0.03, u))) : 0) + b.bank;
      rt.crossVectors(V3u, fw); if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0); rt.normalize(); upv.crossVectors(fw, rt);
      const cr = Math.cos(roll), sr = Math.sin(roll);
      pa.copy(rt).multiplyScalar(cr).addScaledVector(upv, sr); pb.copy(upv).multiplyScalar(cr).addScaledVector(rt, -sr);
      const gone = (u + (station(m, u)[0] + (i === 0 ? 3 * ss(0.9, 1, u) : 0)) / path.length) > 1.004 ? 0.001 : 1;   // through the ring ahead of us
      mtx.makeBasis(pa, pb, fw); scl.setScalar(m.size * gone); mtx.scale(scl); mtx.setPosition(pc);
      mesh.setMatrixAt(i, mtx); S.pod.positions[i].copy(pc);
      swim[i * 4] = time * 6.2832 * m.rate + u * path.length * 0.75 + m.seed * 20;
      swim[i * 4 + 2] = b.bank;
    }
    // the two escorts keep station over the giant's back and flank: a 3 m animal beside a 9 m one
    const gd = S.giantDir, gp = S.giantPos;
    rt.crossVectors(V3u, gd).normalize(); upv.crossVectors(gd, rt);
    for (let e = 0; e < NE; e++) {
      const i = N + e, sg = e ? -1 : (S.giantFar || 1), w = time * 0.6 + e * 2.4;
      pc.copy(gp).addScaledVector(gd, (e ? -4.4 : 4.8) + 0.4 * Math.sin(w)).addScaledVector(upv, (e ? 2.3 : 3.4) + 0.25 * Math.sin(w * 1.3)).addScaledVector(rt, sg * ((e ? 3.6 : 3.1) + 0.3 * Math.cos(w)));   // (fifth polish) further out: three animals, not one clump
      const roll = sg * 0.25 + 0.12 * Math.sin(w * 0.8), cr = Math.cos(roll), sr = Math.sin(roll);
      pa.copy(rt).multiplyScalar(cr).addScaledVector(upv, sr); pb.copy(upv).multiplyScalar(cr).addScaledVector(rt, -sr);
      mtx.makeBasis(pa, pb, gd); scl.setScalar(Math.max((e ? 0.94 : 1.03) * S.giantOn, 0.001)); mtx.scale(scl); mtx.setPosition(pc);
      mesh.setMatrixAt(i, mtx);
      swim[i * 4] = time * 6.2832 * 1.5 + e * 2.2; swim[i * 4 + 1] = 0.9; swim[i * 4 + 2] = 0.1 * Math.sin(w); swim[i * 4 + 3] = 0.23 + 0.5 * e;
    }
    mesh.instanceMatrix.needsUpdate = true; swimAttr.needsUpdate = true;
    if (u >= uBreath && lastU < uBreath) { tBreath = time; S.breathMate = 1; } if (u < uBreath) tBreath = -99;
    if (u >= uBreath2 && lastU < uBreath2) { tBreath = time; S.breathMate = 2; } lastU = u;
    const d = S.ceilU.uDimple.value, bp = S.pod.positions[S.breathMate || 1];
    if (tBreath > -90 && time - tBreath < 9) { if (time - tBreath < 0.1) { d.x = bp.x; d.y = bp.z; } d.z = time - tBreath; d.w = 1; } else { d.z = 99; d.w = 0; }
    S.breathAge = tBreath > -90 ? time - tBreath : 99;
  });
  scene.add(mesh);
}

// Temnodontosaurus: nine metres, the same build with a longer jaw, crossing far beneath us on the open turn.
function buildGiant(S) {
  const { path, M, scene } = S;
  const geo = ichGeometry({ jaw: 1.45 });
  geo.userData.eye.z *= 0.62;
  const swim = new Float32Array([0, 0.8, 0, 0.61]), swimAttr = new THREE.InstancedBufferAttribute(swim, 4);
  swimAttr.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aSwim', swimAttr);
  const mesh = new THREE.InstancedMesh(geo, ichMaterial(S, '#2A4A4C', '#93AD9F', geo, 2.6), 1);   // slate, a step greener than the pod; its markings and eye at the pod's own size, not blown up with the body
  mesh.frustumCulled = false; mesh.name = 'giant'; scene.add(mesh);
  // ONE animal, met twice. First it crosses left to right deep under the bell we leave the helix through (13 m ahead,
  // 7 m beneath: the large sight in the dark lower half); then, on the north leg, it crosses our line again from the
  // inside of the loop, 5 m beneath us and broadside on, and we overtake it. Between the two it is out of sight.
  const f = newFrame(), mkPass = (uc, ahead, down, right, kt, kr) => {
    S.frameAt(uc, f);
    return { uc, sp: 0.6, base: f.p.clone().addScaledVector(f.t, ahead).add(V3(0, -down, 0)).addScaledVector(f.r, right), dir: f.t.clone().multiplyScalar(kt).addScaledVector(f.r, kr).setY(0.02).normalize() };
  };
  const p1 = mkPass(M.helix1 + 0.05, 13, 4.4, -1, 0.3, 0.95), p2 = mkPass(M.east1 - 0.04, 13, 3.2, 5, 0.0, -1), uMid = (p1.uc + p2.uc) / 2; p2.sp = 0.7;
  for (const q of [p1, p2]) { const c = path.pointAt(q.uc), r = V3(0, 1, 0).cross(q.dir).normalize(); q.far = q.base.clone().sub(c).dot(r) >= 0 ? 1 : -1; }   // which side of it is the far one, from where we are when it passes   // (sixth polish) the second meeting is the other picture: it comes in from our right as we turn and crosses our bows from right to left, a little below us
  S.giant1U = p1.uc; S.giantU = p2.uc; S.giantDir = p1.dir.clone(); S.giantPos = V3(0, -99, 0); S.giantOn = 0;
  S.giantAt = (u, out) => { const q = u < uMid ? p1 : p2; return out.copy(q.base).addScaledVector(q.dir, (u - q.uc) * path.length * q.sp); };
  const pos = V3(0, 0, 0), rt = V3(1, 0, 0), upv = V3(0, 1, 0), mtx = new THREE.Matrix4(), scl = V3(3, 3, 3), up0 = V3(0, 1, 0);
  S.updaters.push((dt, time, camera, u) => {
    const q = u < uMid ? p1 : p2, dir = q.dir;
    S.giantAt(u, pos); pos.y += 0.4 * Math.sin(time * 0.4);
    const on = u < uMid ? smoothstep(p1.uc - 0.085, p1.uc - 0.05, u) * (1 - smoothstep(p1.uc + 0.05, p1.uc + 0.085, u))
      : smoothstep(p2.uc - 0.12, p2.uc - 0.085, u) * (1 - smoothstep(p2.uc + 0.07, p2.uc + 0.11, u));
    S.giantOn = on; S.giantPos.copy(pos); S.giantDir.copy(dir); S.giantFar = q.far;
    rt.crossVectors(up0, dir).normalize(); upv.crossVectors(dir, rt);
    scl.setScalar(Math.max(3 * on, 0.001));
    mtx.makeBasis(rt, upv, dir); mtx.scale(scl); mtx.setPosition(pos); mesh.setMatrixAt(0, mtx); mesh.instanceMatrix.needsUpdate = true;
    swim[0] = time * Math.PI + u * 40; swimAttr.needsUpdate = true;       // one beat in two seconds
  });
}

// ---------------------------------------------------------------------------------------------------------
// The belemnite shoal: 3,000 squid-like animals 0.3 m long, each a bullet with two small fins near its pointed
// rear and TEN equal arms held in a cone (no long tentacles). They travel point-first (which for the animal is
// backwards, arms trailing), all turning as one on a looping flow; they jet apart round our wake.
// Model space: +Z = direction of travel = the pointed rear. color = shade (r), part (g: 1 arms), eye (b).
// ---------------------------------------------------------------------------------------------------------
function belemniteGeometry() {
  const P = [], C = [], idx = [];
  const v = (x, y, z, sh, part, eye) => { P.push(x, y, z); C.push(sh, part, eye); return P.length / 3 - 1; };
  const NS = 6, ringAt = (z, r, sh, eye) => { const row = []; for (let j = 0; j < NS; j++) { const a = (j / NS) * 6.2832; row.push(v(Math.cos(a) * r, Math.sin(a) * r * 0.85, z, sh, 0, eye && (j === 0 || j === 3) ? 1 : 0)); } return row; };
  const tip = v(0, 0, 0.15, 0.75, 0, 0), r1 = ringAt(0.03, 0.03, 1, 0), r2 = ringAt(-0.065, 0.027, 1, 1);
  for (let j = 0; j < NS; j++) { const j1 = (j + 1) % NS; idx.push(tip, r1[j1], r1[j], r1[j], r1[j1], r2[j1], r1[j], r2[j1], r2[j]); }
  // the arm cone: five ribbons (ten arms read as a tapering fringe), 8 cm, converging behind the head
  for (let j = 0; j < 5; j++) {
    const a = (j / 5) * 6.2832 + 0.3, a2 = a + 0.75;
    const p0 = v(Math.cos(a) * 0.022, Math.sin(a) * 0.02, -0.065, 0.9, 1, 0), p1 = v(Math.cos(a2) * 0.022, Math.sin(a2) * 0.02, -0.065, 0.9, 1, 0);
    const p2 = v(Math.cos(a + 0.37) * 0.007, Math.sin(a + 0.37) * 0.007, -0.15, 1.25, 1, 0);
    idx.push(p0, p1, p2);
  }
  // two small fins near the pointed rear
  for (const sx of [-1, 1]) { const f0 = v(sx * 0.02, 0, 0.09, 1.1, 0, 0), f1 = v(sx * 0.02, 0, 0.035, 1.1, 0, 0), f2 = v(sx * 0.062, 0, 0.05, 1.3, 0, 0); idx.push(f0, f1, f2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const SHOAL_VERT = /* glsl */`
uniform float uTime; uniform vec3 uCamL, uWakePos, uWakeDir, uShoalC, uShoalAx; uniform float uShoalYaw, uShoalK, uShoalRing;
attribute vec3 color; attribute vec4 aFish;                         // loop angle, ring fraction, height fraction, seed
varying vec3 vP, vN, vC; varying float vSeed;
vec3 shoalAt(float a){
  float rr = mix(.3 + .7*aFish.y, .8 + .2*aFish.y, uShoalRing);     // a cloud, or (re-formed) a ribbon winding in a ring
  vec3 q = vec3(cos(a)*rr*uShoalAx.x, (aFish.z*.75 + .25*sin(2.*a + aFish.w*6.28))*uShoalAx.y*(1.15 - .4*rr), sin(a)*rr*uShoalAx.z);
  q.x += .7*sin(a*3. + aFish.w*20.); q.z += .6*cos(a*2. + aFish.w*31.); q.y += .3*sin(a*5. + aFish.w*11.);
  float cy = cos(uShoalYaw), sy = sin(uShoalYaw);
  return uShoalC + vec3(q.x*cy + q.z*sy, q.y, -q.x*sy + q.z*cy);
}
void main(){
  float a = aFish.x + uTime*.11 + .25*sin(uTime*.21 + aFish.x);      // the whole shoal turns as one
  vec3 c = shoalAt(a), T = shoalAt(a + .03) - c; T /= max(length(T), 1e-4);
  c += T*.06*sin(uTime*6.3 + aFish.w*40.);                          // each jet a small surge
  vec3 d = c - uCamL; float l = max(length(d), 1e-3);                // nobody nearer than a metre and a half
  c += d/l*1.8*(1. - smoothstep(.3, 4.5, l));
  vec3 w = c - uWakePos; float al = dot(w, uWakeDir);                // and a tunnel opens ahead of us
  vec3 rad = w - uWakeDir*al; float rl = max(length(rad), 1e-3);
  float open = (1. - smoothstep(.4, 3.2, rl))*smoothstep(-3., 1., al)*(1. - smoothstep(6., 16., al));
  c += rad/rl*1.9*open; T = T + rad/rl*open*1.2; T /= max(length(T), 1e-4);
  vec3 X = cross(vec3(0., 1., 0.), T); X /= max(length(X), 1e-4); vec3 Y = cross(T, X);
  float sc = .85 + .35*fract(aFish.w*7.3);
  vec3 lp = position*sc*uShoalK; lp.x += color.g*.012*sin(uTime*6.3 + aFish.w*40. + position.z*30.);
  vec3 p = c + X*lp.x + Y*lp.y + T*lp.z;
  vP = p; vN = X*normal.x + Y*normal.y + T*normal.z; vC = color; vSeed = aFish.w;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`;
const SHOAL_FRAG = /* glsl */`
${ANIMAL_GLSL}
uniform vec3 uBodyCol;
varying vec3 vP, vN, vC; varying float vSeed;
void main(){
  vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  vec3 alb = uBodyCol*vC.r*(.85 + .3*fract(vSeed*13.7));
  alb = mix(alb, vec3(.02, .015, .02), smoothstep(.55, .9, vC.b));  // the big dark eye
  vec3 c = litAnimal(alb, N, vP, .9, .75);                          // glassy: the sun comes through it
  gl_FragColor = vec4(c, 1.);
}`;
async function buildShoal(S) {
  const { path, M, R, scene, U, ctx } = S;
  const n = Math.round(1400 * S.detail * clamp(S.density, 0.8, 1.15)), geo0 = belemniteGeometry();
  const fish = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { fish[i * 4] = R() * 6.2832; fish[i * 4 + 1] = Math.sqrt(R()); fish[i * 4 + 2] = R.gauss() * 0.45; fish[i * 4 + 3] = R(); if (i % 800 === 799) await ctx.yield(); }
  // TWO bodies of one shoal (second polish), so that every third of the flight has it in the picture: together they
  // are the cloud we go through before the log, the ring under the deep bell and the ribbon that swims along under
  // the rose corridor; then one part (A) goes on east to lie under the giant on the north leg, and the other (B),
  // while it is beneath us and out of sight, re-forms as the ring round the foot of the portal.
  const nB = Math.round(n * 0.4), nA = n - nB, ss = smoothstep;
  const mkBody = (from, count, name) => {
    const g = new THREE.InstancedBufferGeometry(); g.index = geo0.index;
    for (const k of ['position', 'normal', 'color']) g.setAttribute(k, geo0.getAttribute(k));
    g.setAttribute('aFish', new THREE.InstancedBufferAttribute(fish.slice(from * 4, (from + count) * 4), 4)); g.instanceCount = count;
    const SU = { ...U, uShoalC: { value: V3(0, 0, 0) }, uShoalAx: { value: V3(12, 3.2, 6) }, uShoalYaw: { value: 0 }, uShoalK: { value: 1 }, uShoalRing: { value: 0 }, uBodyCol: { value: col('#D98A7A') } };
    const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SHOAL_VERT, fragmentShader: SHOAL_FRAG, side: THREE.DoubleSide }));
    mesh.frustumCulled = false; mesh.name = name; scene.add(mesh);
    return SU;
  };
  const SA = mkBody(0, nA, 'belemnites'), SB = mkBody(nA, nB, 'belemnites-b');
  // first station: an underline low beneath the first view of the bell, rising to meet us so that we go through it
  // before the log
  const f = newFrame(); S.frameAt(27 / path.length, f);
  const c0 = f.p.clone().addScaledVector(f.r, 1.5), c0y = c0.y, yaw0 = Math.atan2(-f.t.z, f.t.x) + 0.5, ax0 = V3(12, 3.0, 5.5);
  const cA = V3(10.5, -19.8, -27), axA = V3(13, 2.2, 8);            // (fifth polish) nearer: it fills the lower half as we leave the helix          // second: a ring under the deep bell we leave the helix through
  S.frameAt(M.east0, f);                                       // third: ahead of us and below, down the rose corridor
  const cR = f.p.clone().addScaledVector(f.t, 17).addScaledVector(f.r, 2.5).add(V3(0, -4.6, 0)), axR = V3(11, 2.3, 6.5);
  S.frameAt(lerp(M.east0, M.east1, 0.7), f);                   // fourth (A): under the giant, right of our line on the north leg
  const cE = f.p.clone().addScaledVector(f.t, 15).addScaledVector(f.r, 1.5).add(V3(0, -7.4, 0)), axE = V3(10.5, 2.4, 7.5);
  const seatP = S.A.portalSeat.position, cC = V3(seatP.x + 2.0, seatP.y - 3.6, seatP.z), axC = V3(10.5, 1.6, 10.5);
  const cF = V3(1.5, -19.6, -7), axF = V3(9.5, 1.3, 8.5);       // B, while we are in the helix: a ribbon winding round the lowest crowns of the bell, pink against the blue deep
  const c1 = V3(0, 0, 0), ax1 = V3(0, 0, 0);
  S.shoal = { c0, c1 };
  S.updaters.push((dt, time, camera, u) => {
    const second = u > M.log1;                                      // it re-forms elsewhere while we are among the stems
    const rise = ss(0.025, M.log0 * 0.62, u);                       // low and flat at first sight, then up round us
    c0.y = c0y - 3.4 - 5.1 * (1 - rise); ax0.y = lerp(1.5, 2.2, rise);   // it stays a layer under us: we skim its upper fringe
    const kIn = Math.max(0.001, second ? ss(M.log1, M.helix0 + 0.03, u) : 1 - ss(M.log0 + 0.01, M.log1 - 0.01, u));
    const along = ss(M.out, M.east0 - 0.012, u);
    c1.copy(cA).lerp(cR, along); ax1.copy(axA).lerp(axR, along);
    for (const SU of [SA, SB]) {
      SU.uShoalC.value.copy(second ? c1 : c0); SU.uShoalAx.value.copy(second ? ax1 : ax0);
      SU.uShoalYaw.value = second ? 0 : yaw0; SU.uShoalRing.value = second ? 1 : 0; SU.uShoalK.value = kIn * (second ? 1.22 : 1);
    }
    if (second) {
      const east = ss(lerp(M.east0, M.east1, 0.3), lerp(M.east0, M.east1, 0.72), u);
      SA.uShoalC.value.lerp(cE, east); SA.uShoalAx.value.lerp(axE, east);
      const sink = ss(M.helix1 + 0.03, M.east0, u);                   // behind us as we leave: it settles round the foot of the portal
      SB.uShoalC.value.copy(cF).lerp(cC, sink); SB.uShoalAx.value.copy(axF).lerp(axC, sink);
    }
  });
}

// ---------------------------------------------------------------------------------------------------------
// Harpoceras: a flat coiled disc 0.3 m across with a sharp keel and sickle-curved ribs, carried upright with the
// opening low; eight short arms and a dark eye below. It jets BACKWARDS, shell-first, arms trailing, bobbing with
// each jet. Local: the disc lies in XY (Y up), +X is where the arms point; it travels toward -X.
// aUv = (angle along the spiral, across the whorl -1..1 with the keel at 0, part: 0 shell, 1 soft body, 2 eye).
// ---------------------------------------------------------------------------------------------------------
function ammoniteGeometry() {
  const P = [], Q = [], idx = [], NSEG = 15, turns = 2.3, b = Math.log(2.25) / 6.2832, R1 = 0.105, thE = -Math.PI / 2;
  const v = (x, y, z, th, across, part) => { P.push(x, y, z); Q.push(th, across, part); return P.length / 3 - 1; };
  let prev = null, last = null;
  for (let i = 0; i <= NSEG; i++) {
    const th = thE - turns * 6.2832 * (1 - i / NSEG), r = R1 * Math.exp(b * (th - thE)), h = 0.46 * r, w = 0.2 * r;
    const cx = Math.cos(th), sy = Math.sin(th), g = th - thE;
    const row = [v(cx * (r - 0.75 * h), sy * (r - 0.75 * h), -w * 0.8, g, -1, 0), v(cx * (r + 0.5 * h), sy * (r + 0.5 * h), -w, g, -0.5, 0), v(cx * (r + h), sy * (r + h), 0, g, 0, 0),
      v(cx * (r + 0.5 * h), sy * (r + 0.5 * h), w, g, 0.5, 0), v(cx * (r - 0.75 * h), sy * (r - 0.75 * h), w * 0.8, g, 1, 0)];
    if (prev) for (let j = 0; j < 4; j++) idx.push(prev[j], row[j], row[j + 1], prev[j], row[j + 1], prev[j + 1]);
    prev = row; last = { r, h, w };
  }
  // the animal in the opening: a short hood, eight arms as a tuft, the eye
  const ax = 0, ay = -last.r, tip = (dx, dy, dz, part) => v(ax + dx, ay + dy, dz, 0, 0, part);
  const m = tip(0.012, -0.01, 0, 1);
  for (let j = 0; j < 4; j++) idx.push(prev[j], m, prev[j + 1]);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * 6.2832, c = Math.cos(a), s = Math.sin(a);
    const p0 = tip(0.004, c * 0.022 - 0.004, s * 0.016, 1), p1 = tip(0.004, c * 0.022 + 0.008 - 0.004, s * 0.016 + 0.006, 1), p2 = tip(0.075 + 0.02 * c, c * 0.034 - 0.016, s * 0.026, 1);
    idx.push(p0, p1, p2);
  }
  for (const sz of [-1, 1]) { const e0 = tip(-0.006, -0.012, sz * last.w * 0.86, 2), e1 = tip(0.018, -0.012, sz * last.w * 0.8, 2), e2 = tip(0.006, 0.012, sz * last.w * 0.9, 2), e3 = tip(0.006, -0.03, sz * last.w * 0.7, 2); idx.push(e0, e1, e2, e0, e3, e1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(Q, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const AMMO_VERT = /* glsl */`
uniform float uTime;
attribute vec3 aUv; attribute vec4 aHome, aHead;                    // home xyz + size; yaw, seed, track length, speed
varying vec3 vP, vN, vUv; varying float vSeed;
void main(){
  float ph = fract(uTime*aHead.w/max(aHead.z, .5) + aHead.y);        // along its track, shell-first
  float jet = fract(uTime*1.05 + aHead.y*7.), surge = exp(-jet*3.5); // one jet a second
  float grow = smoothstep(0., .08, ph)*(1. - smoothstep(.92, 1., ph));
  vec3 F = vec3(cos(aHead.x), 0., sin(aHead.x)), Sd = vec3(-F.z, 0., F.x);
  float rock = .13*sin(jet*6.2832) + .06*sin(uTime*.7 + aHead.y*20.);
  vec3 lp = position; float cr = cos(rock), sr = sin(rock);
  lp.xy = vec2(lp.x*cr - lp.y*sr, lp.x*sr + lp.y*cr);
  if (aUv.z > .5 && aUv.z < 1.5) lp.y += .012*sin(uTime*5. + position.x*60. + aHead.y*9.)*smoothstep(.0, .08, position.x);
  vec3 c = aHome.xyz - F*((ph - .5)*aHead.z + .05*surge) + vec3(0., .05*surge - .02, 0.);
  vec3 p = c + (F*lp.x + vec3(0., 1., 0.)*lp.y + Sd*lp.z)*aHome.w*grow;
  vec3 n = normal; n.xy = vec2(n.x*cr - n.y*sr, n.x*sr + n.y*cr);
  vP = p; vN = F*n.x + vec3(0., 1., 0.)*n.y + Sd*n.z; vUv = aUv; vSeed = aHead.y;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`;
const AMMO_FRAG = /* glsl */`
${ANIMAL_GLSL}
uniform vec3 uShellA, uShellB;
varying vec3 vP, vN, vUv; varying float vSeed;
void main(){
  vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  float dist = distance(vP, uCamL), av = abs(vUv.y), near = 1. - smoothstep(5., 14., dist);
  float rib = sin(vUv.x*7.5 - 5.5*av*(1.3 - av) + 2.*av*av);          // sickle ribs: forward on the flank, swept back at the keel
  float band = smoothstep(.55, .9, sin(vUv.x*4.2 + vSeed*6. + 1.6*av))*.7;   // narrow rust-rose growth bands across the whorl: a striped shell, never one red patch
  vec3 alb = mix(uShellA, uShellB, clamp(band, 0., 1.)*.85)*(1. + .2*rib*mix(.35, 1., near));
  alb *= .78 + .22*smoothstep(.0, .12, av);                           // the keel reads as a darker line
  alb *= 1. - .5*smoothstep(.72, 1., av);                             // the seam where each whorl laps the one inside it: the coil reads as a spiral
  float soft = step(.5, vUv.z);
  alb = mix(alb, vec3(.66, .5, .38), soft);
  alb = mix(alb, vec3(.01, .012, .014), step(1.5, vUv.z));
  N = N + rib*near*.18*vec3(0., 1., 0.)*(1. - soft); N /= max(length(N), 1e-4);
  gl_FragColor = vec4(litAnimal(alb, N, vP, .7 - .4*soft, .25), 1.);
}`;
async function buildAmmonites(S) {
  const { path, M, R, scene, U, ctx } = S;
  const nBig = Math.round(150 * S.detail * clamp(S.density, 0.8, 1.2)), mixed = R.chance(0.5), nSmall = mixed ? Math.round(100 * S.detail) : 0, n = nBig + nSmall;
  const geo0 = ammoniteGeometry(), geo = new THREE.InstancedBufferGeometry(); geo.index = geo0.index;
  for (const k of ['position', 'normal', 'aUv']) geo.setAttribute(k, geo0.getAttribute(k));
  const home = new Float32Array(n * 4), headA = new Float32Array(n * 4), f = newFrame(), p = V3(0, 0, 0);
  const spans = [[M.log0 + 0.01, M.helix1 + 0.03, 0.42], [M.turn, M.east1 + 0.04, 0.2], [M.under - 0.07, 0.992, 0.1]];   // beside the path among the stems, and across the ring
  // ---- THE SHELLS KEEP OFF THE LENS. Each shell jets to and fro on a level track through its home, and live kept only
  // the HOME off the route, so tracks crossed our line and shells came through the lens. The measure, for every shell
  // alike: its whole track, with its bob and its half size, against the WHOLE route's line, in three dimensions to the
  // skin; it is geometry against the line, so every clock is covered. Two constants: FAULT, the line of the fault, and
  // the world's own figure (BESIDE or CURTAIN), the clear water a moved shell gets. Only the home of a shell under FAULT
  // moves; heading, speed, phase, track length and size are never touched, and nothing is drawn from any stream. The
  // rules, in order:
  // (1) A shell whose skin clears FAULT is not touched, also where it stands nearer to the route than its figure.
  // (2) A shell under FAULT is tried three ways from live's home, each by its shortfall to the figure against the whole
  //     line, three passes at most: UP and DOWN (the home's height only) and SIDEWAYS (level and straight away from the
  //     route: across its line at its nearest point, to the side the home is on). A trial succeeds if the shell then
  //     clears its figure against the whole line, its home stays at or under TOP, and its whole track with the bob keeps
  //     the shell's half size clear of the meadow's log as drawn at its furthest reach (THE WOOD, below).
  // (3) Where the fault lies against the stretch before and across the ring (the point of the route's line nearest the
  //     track lies at or after that stretch's first route metre, wherever the shell was laid; the stretch runs to the
  //     route's last point), height goes first: of up and down the smaller move that succeeds, sideways only if neither
  //     does; so shells still drift across the opening over and under our line.
  // (4) Elsewhere the least move: of the trials that succeed, the one with the smallest move in metres; a tie goes to
  //     height (between up and down: to down).
  // (5) A shell no trial clears takes, of live's home and the three ends (never an end over TOP or in the wood), the
  //     place with the most clear air to the skin; if that place is still under FAULT, the best end is tried once more
  //     in the other kind of move (up and down after sideways, sideways after height) and that end is taken if it has
  //     more clear air. So no shell ends with less than live gave it, and no end is taken in the wood.
  const FAULT = 0.6;                                               // the line of the fault (metres, to the skin): a shell is moved only if its skin comes nearer to the route's line than this, where the lens can be inside the skin or the near plane cut it (the near plane stands 0.3 m off and its corners 0.47 m; the rest is room for the count's grain), because a body that comes near the lens and touches nothing is no fault
  const BESIDE = 1.75, CURTAIN = 2.2;                              // the world's two figures (metres), each written once: the clear water a moved shell gets; live's push and shift below test with the same names
  // the track as AMMO_VERT draws it, bounded over every clock: the centre lies on home + F*s + up*b, s from -(length/2 +
  // 0.05) (phase 1 and a full surge) to +length/2, b from -0.02 to +0.03 (the bob). TOP is live's own clamp of the home
  // (the line 'if (p.y > -1.2)' below). HAIR: the home is stored as a 32 bit float (steps of 4 micrometres at 50 m), so
  // a move ends a tenth of a millimetre past the figure and the stored home still measures the whole figure.
  const SURGE = 0.05, BOB_LO = -0.02, BOB_HI = 0.03, TOP = -1.2, HAIR = 1e-4;
  let skin = 0;                                                    // half size as a factor of the shell's size: the furthest a vertex is drawn from the centre (the rock only turns it, grow is at most 1, the arms ripple by up to 0.012)
  { const P = geo0.getAttribute('position'), Q = geo0.getAttribute('aUv');
    for (let k = 0; k < P.count; k++) skin = Math.max(skin, Math.hypot(P.getX(k), P.getY(k), P.getZ(k)) + (Q.getZ(k) > 0.5 && Q.getZ(k) < 1.5 ? 0.012 * smoothstep(0, 0.08, P.getX(k)) : 0)); }
  // the route's line: a point every 5 cm from its first metre to its last
  const STEP = 0.05, WIDE = 4, nL = Math.ceil(path.length / STEP), line = new Float64Array((nL + 1) * 3), lq = V3(0, 0, 0), E = { x: 0, z: 0 };
  for (let k = 0; k <= nL; k++) { path.posAtDist(Math.min(k * STEP, path.length), lq); line[k * 3] = lq.x; line[k * 3 + 1] = lq.y; line[k * 3 + 2] = lq.z; if (k % 500 === 499) await ctx.yield(); }
  // squared distance from point k of the line to the whole track (centre range) of a shell whose home is (x, y, z)
  const far2 = (k, x, y, z, fx, fz, s0, s1) => {
    const rx = line[k * 3] - x, ry = line[k * 3 + 1] - y, rz = line[k * 3 + 2] - z, qs = rx * fx + rz * fz, qa = rz * fx - rx * fz;
    const gs = qs < s0 ? qs - s0 : qs > s1 ? qs - s1 : 0, gb = ry < BOB_LO ? ry - BOB_LO : ry > BOB_HI ? ry - BOB_HI : 0;   // along the track past its ends, in height past its bob, qa across
    return gs * gs + gb * gb + qa * qa;
  };
  // the line's nearest point to that track if it is nearer than need, else -1; too[] takes every point that is nearer
  // (the stretch of route the shell is too near to). Every fourth point first: a point within 10 cm of route of one that
  // stands need + 10 cm off or more cannot be nearer than need, so the answer is that of all the points
  const too = new Int32Array(2 * nL + 8); let nToo = 0;
  const nearest = (x, y, z, fx, fz, s0, s1, need) => {
    const wide = (need + STEP * WIDE / 2) * (need + STEP * WIDE / 2), n2 = need * need; let best = n2, bk = -1; nToo = 0;
    for (let c = 0; c <= nL; c = c < nL ? Math.min(c + WIDE, nL) : nL + 1) {
      if (far2(c, x, y, z, fx, fz, s0, s1) >= wide) continue;
      for (let k = Math.max(c - WIDE / 2, 0); k <= Math.min(c + WIDE / 2, nL); k++) { const d = far2(k, x, y, z, fx, fz, s0, s1); if (d < n2) too[nToo++] = k; if (d < best) { best = d; bk = k; } }
    }
    return bk;
  };
  // the shortfall along a direction: the least move of the home along (ex, ey, ez) that puts every point of too[] need
  // away from the track (the homes too near one point are a convex set that holds the home, so the way out along a line
  // is one crossing, found by halving)
  const shortfall = (x, y, z, ex, ey, ez, fx, fz, s0, s1, need) => {
    let lo = 0, hi = s1 - s0 + 2 * need + 1;
    for (let j = 0; j < 32; j++) {
      const m = (lo + hi) / 2; let near = false;
      for (let q = 0; q < nToo && !near; q++) near = far2(too[q], x + ex * m, y + ey * m, z + ez * m, fx, fz, s0, s1) < need * need;
      if (near) lo = m; else hi = m;
    }
    return hi;
  };
  // level and straight away from the route at point k: across its line there, to the side (x, z) is on (on the line: to its right)
  const away = (k, x, z) => {
    const a = Math.max(k - 1, 0) * 3, b = Math.min(k + 1, nL) * 3, nx = -(line[b + 2] - line[a + 2]), nz = line[b] - line[a], l = Math.hypot(nx, nz) || 1;
    const sgn = (x - line[k * 3]) * nx + (z - line[k * 3 + 2]) * nz < 0 ? -1 : 1;
    E.x = sgn * nx / l; E.z = sgn * nz / l;
  };
  // THE WOOD: the meadow's log, by its own built vertices, called from the hero as built (the mesh 'log') and carried
  // into the track's frame by the hero's own placing. Drawn, a vertex leaves its built place by the roll about the log's
  // own x axis (at most ROLL radians: ROLL times its distance from that axis) and by the heave (at most HEAVE, up or
  // down); and a point of the drawn skin lies no further from the nearest vertex of its own triangle than that triangle's
  // cover (its circumradius if no angle is obtuse, else half its longest side). So a track that keeps half size + reach
  // from every built vertex, reach = HEAVE + ROLL * (its distance from the axis) + (the largest cover of its triangles),
  // keeps the half size from every point of the log's skin as drawn, at every clock. wood[]: x, y, z, reach a vertex.
  const ROLL = 0.105, HEAVE = 0.17;                                // the log's roll and heave where the parts file sets them, rounded up: ROLL_AMP (6 degrees, 0.10472 rad; LOG_VERT turns y and z by it) and uHeave in the hero's update (0.13 + 0.04 m)
  const logM = S.hero.object.getObjectByName('log'), lp = logM.geometry.getAttribute('position'), li = logM.geometry.index, wood = new Float64Array(lp.count * 4), wm = new THREE.Matrix4(), tm = new THREE.Matrix4();
  for (let o = logM; o; o = o.parent) wm.premultiply(tm.compose(o.position, o.quaternion, o.scale));   // where the hero stands the log in the world (the shader rolls and heaves it in its own frame first)
  const edge = (a, b) => Math.hypot(lp.getX(a) - lp.getX(b), lp.getY(a) - lp.getY(b), lp.getZ(a) - lp.getZ(b));
  for (let t = 0; t < li.count; t += 3) {                          // each triangle's cover, to its three vertices
    const a = li.getX(t), b = li.getX(t + 1), c = li.getX(t + 2), ab = edge(a, b), bc = edge(b, c), ca = edge(c, a), e = Math.max(ab, bc, ca), s = (ab + bc + ca) / 2, area = Math.sqrt(Math.max(s * (s - ab) * (s - bc) * (s - ca), 0));
    const cover = 2 * e * e < ab * ab + bc * bc + ca * ca && area > 0 ? ab * bc * ca / (4 * area) : e / 2;
    for (const q of [a, b, c]) if (cover > wood[q * 4 + 3]) wood[q * 4 + 3] = cover;
  }
  let woodLow = Infinity;                                          // the lowest any vertex's reach goes: a track wholly under it is clear of the wood
  for (let q = 0; q < lp.count; q++) {
    lq.set(lp.getX(q), lp.getY(q), lp.getZ(q)); wood[q * 4 + 3] += HEAVE + ROLL * Math.hypot(lq.y, lq.z); lq.applyMatrix4(wm);
    wood[q * 4] = lq.x; wood[q * 4 + 1] = lq.y; wood[q * 4 + 2] = lq.z; woodLow = Math.min(woodLow, lq.y - wood[q * 4 + 3]);
  }
  // does the track at (x, y, z), with its bob and its skin, come into the wood as drawn at its furthest reach
  const inWood = (x, y, z, fx, fz, s0, s1, half) => {
    if (y + BOB_HI + half <= woodLow) return false;
    for (let q = 0; q < wood.length; q += 4) {
      const rx = wood[q] - x, ry = wood[q + 1] - y, rz = wood[q + 2] - z, qs = rx * fx + rz * fz, qa = rz * fx - rx * fz, m = half + wood[q + 3];
      const gs = qs < s0 ? qs - s0 : qs > s1 ? qs - s1 : 0, gb = ry < BOB_LO ? ry - BOB_LO : ry > BOB_HI ? ry - BOB_HI : 0;
      if (gs * gs + gb * gb + qa * qa < m * m) return true;
    }
    return false;
  };
  const keepOff = (h, yaw, len, size, figure) => {                 // measured on the numbers the attributes will hold (32 bit floats)
    const fx = Math.cos(Math.fround(yaw)), fz = Math.sin(Math.fround(yaw)), s1 = Math.fround(len) / 2, s0 = -s1 - SURGE, half = skin * Math.fround(size), need = figure + half;
    const x0 = Math.fround(h.x), y0 = Math.fround(h.y), z0 = Math.fround(h.z);
    if (nearest(x0, y0, z0, fx, fz, s0, s1, FAULT + half) < 0) return;   // (1) the skin clears FAULT: untouched
    const k0 = nearest(x0, y0, z0, fx, fz, s0, s1, need), air0 = far2(k0, x0, y0, z0, fx, fz, s0, s1);   // under FAULT: k0 is the point of the route's line nearest the track, air0 live's clear air (squared, to the centre's range; the half size is the same at every place)
    // (2) a trial from (x, y, z), v = 1 up, -1 down, 0 sideways: three passes at most, each by the shortfall to the figure
    // against the points nearer than it. ok: the end clears its figure against the whole line with the home at or under
    // TOP and out of the wood; air: the end's clear air (the figure's own where it clears; -1 over TOP or in the wood,
    // which is no place); move: metres from live's home
    const trial = (x, y, z, v) => {
      let k = nearest(x, y, z, fx, fz, s0, s1, need);
      for (let pass = 0; pass < 3 && k >= 0; pass++) {
        if (v) y = Math.fround(y + v * shortfall(x, y, z, 0, v, 0, fx, fz, s0, s1, need + HAIR));
        else { away(k, x, z); const t = shortfall(x, y, z, E.x, 0, E.z, fx, fz, s0, s1, need + HAIR); x = Math.fround(x + E.x * t); z = Math.fround(z + E.z * t); }
        k = nearest(x, y, z, fx, fz, s0, s1, need);
      }
      const place = y <= TOP && !inWood(x, y, z, fx, fz, s0, s1, half);
      return { x, y, z, v, ok: k < 0 && place, air: !place ? -1 : k < 0 ? need * need : far2(k, x, y, z, fx, fz, s0, s1), move: Math.hypot(x - x0, y - y0, z - z0) };
    };
    const U = trial(x0, y0, z0, 1), D = trial(x0, y0, z0, -1), S = trial(x0, y0, z0, 0), H = U.ok && (!D.ok || U.move < D.move) ? U : D;   // H: of up and down the smaller move that succeeds
    const ring = k0 * STEP >= spans[2][0] * path.length;           // the fault lies against the stretch before and across the ring, by place: from the stretch's first metre (the world's spans[2]) to the route's last point, where the line ends
    let b = H.ok && (ring || !S.ok || H.move <= S.move) ? H : S;   // (3) there: height first; (4) elsewhere: the least move, a tie to height
    if (!b.ok) {                                                   // (5) no trial clears: the place with the most clear air, live's home unless an end has more
      let e = S; if (U.air > e.air) e = U; if (D.air > e.air) e = D;
      b = e.air > air0 ? e : { x: x0, y: y0, z: z0, air: air0 };
      if (b.air < (FAULT + half) * (FAULT + half)) for (const t of e.v ? [trial(e.x, e.y, e.z, 0)] : [trial(e.x, e.y, e.z, -1), trial(e.x, e.y, e.z, 1)]) if (t.air > b.air || (t.ok && b.ok && t.move < b.move)) b = t;   // still under FAULT: once more from the best end, in the other kind of move
    }
    h.x = b.x; h.y = b.y; h.z = b.z;
  };
  for (let i = 0; i < n; i++) {
    const small = i >= nBig, r0 = R(), a = R() * 6.2832, off = R.range(1.75, 5.5), uu = R(), lift = R.gauss(), sd = R(), sp = R.range(0.12, 0.24), tl = R.range(4, 7), sz = R.range(0.85, 1.25);
    let yaw;
    const sp0 = r0 < spans[0][2] ? spans[0] : r0 < spans[0][2] + spans[1][2] ? spans[1] : r0 < spans[0][2] + spans[1][2] + spans[2][2] ? spans[2] : null;
    if (sp0) {
      S.frameAt(lerp(sp0[0], sp0[1], uu), f);
      p.copy(f.p).addScaledVector(f.r, Math.cos(a) * off).addScaledVector(f.n, Math.sin(a) * off * 0.8);
      yaw = Math.atan2(f.t.z, f.t.x) + (sd > 0.5 ? Math.PI : 0);
      let tries = 0; while (path.distanceTo(p.x, p.y, p.z) < BESIDE && tries++ < 6) p.addScaledVector(f.r, Math.cos(a) >= 0 ? 0.6 : -0.6);
    } else {                                                       // the rest hang in the curtain itself
      const y = -2 - uu * 16.5; p.set(R.range(-9.5, 9.5), y, y * Math.tan(0.349) + lift * 1.6); yaw = (sd > 0.5 ? 0 : Math.PI) + lift * 0.3;
      if (path.distanceTo(p.x, p.y, p.z) < CURTAIN) p.z += 4.5;
    }
    if (p.y > -1.2) p.y = -1.2;
    keepOff(p, yaw, tl * (small ? 0.5 : 1), small ? sz * 0.22 : sz, sp0 ? BESIDE : CURTAIN); if (i % 20 === 19) await ctx.yield();
    home.set([p.x, p.y, p.z, small ? sz * 0.22 : sz], i * 4); headA.set([yaw, sd, tl * (small ? 0.5 : 1), sp], i * 4);
    if (i % 100 === 99) await ctx.yield();
  }
  geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4)); geo.setAttribute('aHead', new THREE.InstancedBufferAttribute(headA, 4)); geo.instanceCount = n;
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...U, uShellA: { value: col('#DDC79A').multiplyScalar(0.9) }, uShellB: { value: col('#B5443F') } }, vertexShader: AMMO_VERT, fragmentShader: AMMO_FRAG, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.name = 'ammonites'; scene.add(mesh);
}

// ---------------------------------------------------------------------------------------------------------
// Dapedium: a fish shaped like a dinner plate on edge, 0.4 m, tiny mouth, small fan tail, armoured in diamond
// scales in neat rows, sculling with low back and belly fins. Sixty of them mill under the log and part for us.
// Local: +Z forward, +Y up. aUv = (z, y, part: 0 body, 1 fins and tail).
// ---------------------------------------------------------------------------------------------------------
function dapediumGeometry() {
  const P = [], Q = [], idx = [], L = 0.4;
  const v = (x, y, z, part) => { P.push(x, y, z); Q.push(z, y, part); return P.length / 3 - 1; };
  const rows = [[0.05, 0.04, -0.036, 0.016], [0.13, 0.098, -0.088, 0.034], [0.22, 0.142, -0.135, 0.047], [0.34, 0.172, -0.172, 0.056], [0.5, 0.185, -0.195, 0.058], [0.64, 0.165, -0.175, 0.05], [0.76, 0.115, -0.12, 0.036], [0.85, 0.052, -0.054, 0.018], [0.91, 0.028, -0.028, 0.009]];
  const NS = 10;
  const zOf = (s) => L * (0.5 - s), rings = [];
  for (const [s, top, bot, w] of rows) {
    const yc = (top + bot) / 2, hd = (top - bot) / 2, row = [];
    for (let j = 0; j < NS; j++) { const a = (j / NS) * 6.2832, cs = Math.cos(a), sn = Math.sin(a); row.push(v(w * Math.sign(sn) * Math.pow(Math.abs(sn), 0.8), yc + hd * cs, zOf(s), 0)); }
    rings.push(row);
  }
  const nose = v(0, 0.0, zOf(0), 0);
  for (let j = 0; j < NS; j++) idx.push(nose, rings[0][(j + 1) % NS], rings[0][j]);
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < NS; j++) { const j1 = (j + 1) % NS; idx.push(rings[i][j], rings[i][j1], rings[i + 1][j1], rings[i][j], rings[i + 1][j1], rings[i + 1][j]); }
  // small fan tail
  const t0 = v(0, 0.026, zOf(0.9), 1), t1 = v(0, -0.026, zOf(0.9), 1), t2 = v(0, 0.105, zOf(1.045), 1), t3 = v(0, 0, zOf(1.0), 1), t4 = v(0, -0.105, zOf(1.045), 1);
  idx.push(t0, t2, t3, t0, t3, t1, t1, t3, t4);
  // low back fin and belly fin along the rear half
  for (const sg of [1, -1]) {
    let pa = null, pb = null;
    for (let i = 0; i <= 6; i++) {
      const s = lerp(0.42, 0.87, i / 6), edge = sg * (lerp(0.186, 0.045, Math.pow(Math.max(s - 0.46, 0) / 0.41, 1.6)) + (s < 0.5 ? 0.002 : 0)) - (sg < 0 ? 0.006 : 0);
      const a = v(0, edge * 0.94, zOf(s), 1), b = v(0, edge + sg * (0.062 * Math.sin(Math.PI * Math.min(i / 6 + 0.12, 1)) + 0.012), zOf(s + 0.045), 1);
      if (pa !== null) idx.push(pa, a, b, pa, b, pb);
      pa = a; pb = b;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(Q, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const DISC_VERT = /* glsl */`
uniform float uTime; uniform vec3 uCamL;
attribute vec3 aUv; attribute vec4 aHome, aLoop;                    // home xyz + size; loop radius, angular speed, seed, tilt
varying vec3 vP, vN, vUv, vTd, vYd; varying float vSeed;
void main(){
  // They hold station under the drifting wood, all heading into the flow (+z, each a little off it), so from our
  // line along the log every one is seen BROADSIDE, upright: a plate on edge, never a card tilted at the lens.
  float yaw = .45 + (aLoop.w - .5)*.8 + .22*sin(uTime*.31 + aLoop.z*21.) + step(.86, fract(aLoop.z*7.7))*3.1416;
  vec3 T = vec3(sin(yaw), 0., cos(yaw));
  vec3 c = aHome.xyz + T*(.35*aLoop.x*sin(uTime*abs(aLoop.y)*1.3 + aLoop.z*30.)) + vec3(0., .07*sin(uTime*.9 + aLoop.z*17.), 0.);
  vec3 d = c - uCamL; float l = max(length(d), 1e-3);               // they part at two and a half metres
  c += d/l*2.7*(1. - smoothstep(.4, 5.2, l));
  float keepK = smoothstep(1.7, 2.5, distance(c, uCamL));           // and nothing is ever a blur against the lens
  vec3 X = vec3(T.z, 0., -T.x), Y = vec3(0., 1., 0.);
  vec3 lp = position;
  float wag = sin(uTime*5. + aLoop.z*40. + position.z*9.);
  lp.x += .012*wag*smoothstep(.05, -.2, position.z) + aUv.z*.01*sin(uTime*9. + position.z*45. + aLoop.z*17.);   // tail scull, fin ripple
  vec3 p = c + (X*lp.x*1.3 + Y*lp.y + T*lp.z)*aHome.w*keepK;                  // (sixth polish) 0.15 m through: deep and flat-sided, rounded at back and belly; 0.24 m read as a balloon from below
  vP = p; vN = X*normal.x*.77 + Y*normal.y + T*normal.z; vUv = aUv; vSeed = aLoop.z; vTd = T; vYd = Y;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`;
const DISC_FRAG = /* glsl */`
${ANIMAL_GLSL}
uniform vec3 uPewter;
varying vec3 vP, vN, vUv, vTd, vYd; varying float vSeed;
void main(){
  vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  float dist = distance(vP, uCamL), near = 1. - smoothstep(6., 16., dist), fin = step(.5, vUv.z);
  // the plate is a LENS, not a card: its normal leans outward toward the rim, so light and shade run across it
  vec2 dq = vec2((vUv.x + .012)/.215, vUv.y/.2); float rad = min(length(dq), 1.2);
  vec3 Nb = N + (vTd*dq.x + vYd*dq.y)*.35*smoothstep(.15, 1., rad)*(1. - fin); N = Nb/max(length(Nb), 1e-4);
  float hgt = clamp(vUv.y/.19, -1., 1.);
  vec2 q = vec2(vUv.x*40. + vUv.y*27., vUv.x*40. - vUv.y*27.);        // rhombic armour scales in oblique rows
  vec2 f = abs(fract(q) - .5);
  float seam = smoothstep(.3, .5, max(f.x, f.y)), cell = fract(sin(dot(floor(q), vec2(12.9, 78.2)))*4375.5);
  float head = smoothstep(.085, .11, vUv.x);                          // the head is smooth bone, darker, with a gill-cover edge
  vec3 back = uPewter*vec3(.11, .17, .17), flank = uPewter*vec3(.7, .6, .36), belly = vec3(.5, .45, .29);   // olive-black back, bronze-pewter flank, a buff belly: a mid-toned fish, never a pale card
  vec3 alb = mix(flank, back, smoothstep(.2, .85, hgt)); alb = mix(alb, belly, smoothstep(-.3, -.9, hgt)*.85);
  float near2 = 1. - smoothstep(9., 24., dist);
  float near3 = 1. - smoothstep(2., 5.5, dist);
  alb *= (1. - .3*seam*near3*(1. - head))*(1. + .22*(cell - .5)*near2);   // scale seams only where a scale is several pixels: further off a smooth armoured flank, never stripes   // the armour of rhombic scales reads as far as the fish does
  alb = mix(alb, alb*vec3(.6, .64, .62), head*.8);
  float gill = abs(length(vec2(vUv.x - .15, vUv.y - .015)) - .085);
  alb *= 1. - .55*(1. - smoothstep(.003, .011, gill))*step(vUv.x, .1)*step(abs(vUv.y - .01), .13);
  alb *= 1. - .18*smoothstep(.86, 1.02, rad);                           // the rim falls into shade
  vec2 e = vec2(vUv.x - .132, vUv.y - .03);                           // a big eye in a ring of pale gold
  alb = mix(alb, vec3(.86, .7, .34), smoothstep(.032, .026, length(e)));
  alb = mix(alb, vec3(.008), smoothstep(.019, .015, length(e)));
  alb += vec3(.5)*smoothstep(.007, .003, length(e - vec2(.006, .007)));
  float sheen = .5 + .5*sin(uTime*.55 + vUv.x*7. + vSeed*30.);         // a slow sheen runs down the flank
  float gloss = (.2 + .7*sheen*(1. - seam))*(1. - fin);
  vec3 finC = vec3(.33, .27, .13)*(.9 + .1*sin(vUv.x*210. + vUv.y*60.))*(.7 + .6*smoothstep(.17, .25, abs(vUv.y)));   // rayed amber fins, the light through them
  alb = mix(alb*(.8 + .35*sheen), finC, fin);
  alb *= mix(.34, 1., smoothstep(-.75, .35, N.y));                     // seen from below, a fish is in its own shade: a dark shape against the bright ceiling
  gl_FragColor = vec4(litAnimal(alb, N, vP, gloss, .1 + .7*fin), 1.);
}`;
function buildDiscFish(S) {
  const { R, scene, U } = S, n = 60;
  const geo0 = dapediumGeometry(), geo = new THREE.InstancedBufferGeometry(); geo.index = geo0.index;
  for (const k of ['position', 'normal', 'aUv']) geo.setAttribute(k, geo0.getAttribute(k));
  const home = new Float32Array(n * 4), loop = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const far = R.chance(0.3);
    home.set([R.range(-9.5, 10.5), R.range(-3.3, -1.0) - (far ? 1.5 : 0), far ? R.range(3, 7) : R.range(0.9, 4.2), R.range(0.8, 1.2)], i * 4);
    loop.set([R.range(0.5, 1.5), (R.chance(0.5) ? 1 : -1) * R.range(0.22, 0.45), R(), R()], i * 4);
  }
  geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4)); geo.setAttribute('aLoop', new THREE.InstancedBufferAttribute(loop, 4)); geo.instanceCount = n;
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...U, uPewter: { value: col('#9FB3A6') } }, vertexShader: DISC_VERT, fragmentShader: DISC_FRAG, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.name = 'dapedium'; scene.add(mesh);
}

// ---------------------------------------------------------------------------------------------------------
// Small things: marine snow sinking everywhere (and streaming past us), sepia ink puffs the belemnites leave
// where our tunnel opened (keyed to u), silver bubbles from a breath and from the rare plunge. All points;
// sizes come from uPx (set each frame from the drawing-buffer height by the hero).
// aS = (kind: 0 snow, 1 ink, 2 bubble; seed; seed; key: ink = the u at which it is squirted, bubble = emitter 0/1)
// ---------------------------------------------------------------------------------------------------------
const SPECK_VERT = /* glsl */`
uniform float uTime, uPx, uU, uInkSpan; uniform vec3 uCamL, uBurst0, uBurst1, uBurstDir; uniform vec2 uBurstAge;
attribute vec4 aS;
varying float vKind, vA, vSeed;
void main(){
  vec3 p = position; float size = .005, a = 1., minPx = 1.6, maxPx = 9.;
  if (aS.x < .5) {                                                   // snow: a 36 m box that follows us, sinking 0.05 m/s
    p.y -= uTime*.05; p.x += .15*sin(uTime*.3 + aS.y*40.); p.z += .15*cos(uTime*.23 + aS.z*40.);
    p = mod(p*.6667 - uCamL + 12., 24.) - 12.; float l = length(p);
    a = (1. - smoothstep(8., 12., l))*smoothstep(.3, .9, l)*(.5 + .5*aS.y);
    p += uCamL; size = .003 + .005*aS.z; minPx = 1.8;
  } else if (aS.x < 1.5) {                                           // ink: squirted as we arrive, hangs, dissolves
    float age = (uU - aS.w)/max(uInkSpan, 1e-4);
    a = smoothstep(0., .08, age)*(1. - smoothstep(.25, 1., age))*.3*step(1e-5, uU);
    size = .05 + .45*smoothstep(0., 1., age); p.y += .1*age; minPx = 0.; maxPx = 60.;
  } else {                                                           // bubbles: rise wobbling to the ceiling
    float em = step(.5, aS.w), age = mix(uBurstAge.x, uBurstAge.y, em) - aS.y*mix(.7, .35, em);
    vec3 o = mix(uBurst0, uBurst1 - uBurstDir*aS.z*1.7, em);
    float rise = age*(.5 + .9*aS.z*aS.y + .3*em);
    p = o + p*(.4 + .5*clamp(age, 0., 2.)) + vec3(.06*sin(age*7. + aS.y*30.), rise, .06*cos(age*6. + aS.z*30.));
    a = step(0., age)*(1. - smoothstep(-.25, -.05, p.y))*(1. - smoothstep(2.5, 4., age));
    size = .012 + .03*aS.y*aS.z + .02*em*aS.z; maxPx = 22.;
  }
  vec4 mv = viewMatrix*vec4(p, 1.);
  float px = size/max(-mv.z*uPx, 1e-5);
  vA = a*clamp(px/minPx, .45, 1.); vKind = aS.x; vSeed = aS.y;
  gl_PointSize = clamp(px, max(minPx, 1.), maxPx);
  gl_Position = projectionMatrix*mv;
  if (a < .003) gl_Position = vec4(2., 2., 2., 1.);
}`;
const SPECK_FRAG = /* glsl */`
uniform vec3 uSnowCol, uInkCol, uBubCol;
varying float vKind, vA, vSeed;
void main(){
  vec2 q = gl_PointCoord*2. - 1.; float r = length(q), soft = 1. - smoothstep(.5, 1., r);
  vec3 c = uSnowCol; float a = vA*soft;
  if (vKind > 1.5) { float ring = smoothstep(.45, .8, r)*(1. - smoothstep(.85, 1., r)); float hl = 1. - smoothstep(0., .3, length(q - vec2(-.35, -.35)));
    c = uBubCol*(.6 + .9*hl); a = vA*clamp(ring*.85 + hl + .12*soft, 0., 1.); }
  else if (vKind > .5) { c = uInkCol; a = vA*(1. - smoothstep(.15, 1., r))*(.7 + .3*sin(q.x*5. + vSeed*20.)*sin(q.y*6. + vSeed*9.)); }
  gl_FragColor = vec4(c, a);
}`;
function buildSpecks(S) {
  const { R, scene, U, path, M, hero } = S;
  const nSnow = Math.round(2500 * S.detail), nInk = Math.round(120 * S.detail), nBub = 60, nPl = 170, n = nSnow + nInk + nBub + nPl;
  const P = new Float32Array(n * 3), A = new Float32Array(n * 4), f = newFrame();
  let k = 0;
  for (let i = 0; i < nSnow; i++, k++) { P.set([R.range(-18, 18), R.range(-18, 18), R.range(-18, 18)], k * 3); A.set([0, R(), R(), 0], k * 4); }
  const uI0 = 20 / path.length, uI1 = 47 / path.length;                // the stretch where we go through the shoal
  for (let i = 0; i < nInk; i++, k++) {
    const uu = lerp(uI0, uI1, R()), a = R() * 6.2832, off = R.range(1.5, 3.3);
    S.frameAt(uu + 9 / path.length, f);
    P.set([f.p.x + f.r.x * Math.cos(a) * off, f.p.y + Math.sin(a) * off * 0.8, f.p.z + f.r.z * Math.cos(a) * off], k * 3); A.set([1, R(), R(), uu], k * 4);
  }
  for (let i = 0; i < nBub + nPl; i++, k++) { const g = () => R.gauss() * 0.13; P.set([g(), g() * 0.6, g()], k * 3); A.set([2, R(), R(), i < nBub ? 0 : 1], k * 4); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('aS', new THREE.BufferAttribute(A, 4));
  const SU = { uTime: U.uTime, uPx: U.uPx, uCamL: U.uCamL, uU: { value: 0 }, uInkSpan: { value: 34 / path.length }, uBurst0: { value: V3(0, 50, 0) }, uBurst1: { value: V3(0, 50, 0) }, uBurstDir: { value: V3(0, -1, 0) },
    uBurstAge: { value: new THREE.Vector2(-9, -9) }, uSnowCol: { value: col('#E9F6E4').multiplyScalar(0.95) }, uInkCol: { value: col('#2A1A10') }, uBubCol: { value: col('#F4FBF4').multiplyScalar(1.15) } };
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SPECK_VERT, fragmentShader: SPECK_FRAG, transparent: true, depthWrite: false }));
  pts.frustumCulled = false; pts.renderOrder = 9; pts.name = 'specks'; scene.add(pts);
  S.specks = SU;
  S.updaters.push((dt, time, camera, u) => {
    SU.uU.value = u;
    const age = S.breathAge ?? 99;
    if (age < 5 && S.pod) { if (age < 0.12) SU.uBurst0.value.copy(S.pod.positions[S.breathMate || 1]).y = -0.45; SU.uBurstAge.value.x = age; } else SU.uBurstAge.value.x = -9;
  });
}

// ---------------------------------------------------------------------------------------------------------
// The rare event: a small furry long-tailed pterosaur (Dorygnathus-like, 1 m span, toothed beak, stiff tail with
// a vane) stabs through the ceiling ahead of us in a plume of silver bubbles, misses, and is gone upward.
// Local: +Z beak, +Y back, wings along X. aUv = (part: 0 fur, 1 membrane, 2 beak and teeth, 3 eye; wing 0..1; 0).
// ---------------------------------------------------------------------------------------------------------
function pterosaurGeometry() {
  const P = [], Q = [], idx = [];
  const v = (x, y, z, part, wing = 0) => { P.push(x, y, z); Q.push(part, wing, 0); return P.length / 3 - 1; };
  const tube = (pts, radii, sides, part, wing = 0) => {
    let prev = null;
    pts.forEach((p, i) => {
      const q0 = pts[Math.max(i - 1, 0)], q1 = pts[Math.min(i + 1, pts.length - 1)], t = V3(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      const a = V3(0, 1, 0); if (Math.abs(t.y) > 0.9) a.set(1, 0, 0); a.addScaledVector(t, -a.dot(t)).normalize(); const b = V3(0, 0, 0).crossVectors(t, a), row = [];
      for (let j = 0; j < sides; j++) { const an = (j / sides) * 6.2832, c = Math.cos(an) * radii[i], s = Math.sin(an) * radii[i]; row.push(v(p[0] + a.x * c + b.x * s, p[1] + a.y * c + b.y * s, p[2] + a.z * c + b.z * s, part, wing)); }
      if (prev) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; idx.push(prev[j], prev[j1], row[j1], prev[j], row[j1], row[j]); }
      prev = row;
    });
  };
  tube([[0, 0, -0.09], [0, 0.002, -0.05], [0, 0.006, 0.0], [0, 0.01, 0.05], [0, 0.014, 0.085]], [0.008, 0.026, 0.035, 0.03, 0.016], 7, 0);      // furry torso
  tube([[0, 0.014, 0.08], [0, 0.03, 0.115], [0, 0.04, 0.15]], [0.015, 0.013, 0.017], 6, 0);                                         // neck
  tube([[0, 0.04, 0.14], [0, 0.042, 0.175], [0, 0.036, 0.215]], [0.012, 0.021, 0.014], 6, 0);                                       // skull
  tube([[0, 0.036, 0.21], [0, 0.03, 0.26], [0, 0.026, 0.305]], [0.013, 0.008, 0.002], 5, 2);                                        // long beak
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const z = 0.225 + i * 0.013; idx.push(v(sx * 0.006, 0.026, z, 2), v(sx * 0.007, 0.026, z + 0.008, 2), v(sx * 0.012, 0.012, z + 0.012, 2)); }   // forward-raked teeth
  for (const sx of [-1, 1]) idx.push(v(sx * 0.0205, 0.05, 0.168, 3), v(sx * 0.0205, 0.05, 0.186, 3), v(sx * 0.0205, 0.036, 0.177, 3));
  tube([[0, 0, -0.085], [0, 0.004, -0.25], [0, 0.006, -0.42]], [0.007, 0.004, 0.003], 4, 0);                                         // long stiff tail
  idx.push(v(0, 0.006, -0.39, 1), v(0, 0.045, -0.44, 1), v(0, 0.006, -0.49, 1), v(0, 0.006, -0.39, 1), v(0, 0.006, -0.49, 1), v(0, -0.03, -0.44, 1));   // its vane
  for (const sx of [-1, 1]) {
    tube([[sx * 0.018, -0.012, -0.06], [sx * 0.04, -0.03, -0.12], [sx * 0.045, -0.02, -0.2]], [0.008, 0.005, 0.003], 4, 0);          // hind leg trailing
    const Sh = [sx * 0.03, 0.012, 0.055], El = [sx * 0.12, 0.016, 0.02], Wr = [sx * 0.21, 0.014, 0.075], Tp = [sx * 0.5, 0.004, -0.07], An = [sx * 0.045, -0.018, -0.2];
    tube([Sh, El, Wr], [0.009, 0.007, 0.005], 4, 0, 0.2); tube([Wr, [sx * 0.36, 0.01, 0.02], Tp], [0.005, 0.004, 0.002], 4, 0, 0.8);
    const w = (p, t) => v(p[0], p[1] - 0.004, p[2], 1, t), s = w(Sh, 0.05), e = w(El, 0.25), wr = w(Wr, 0.45), mid = w([sx * 0.36, 0.01, 0.02], 0.75), tp = w(Tp, 1), an = w(An, 0.05), tr = w([sx * 0.25, 0.0, -0.12], 0.6);
    idx.push(s, e, an, e, tr, an, e, wr, tr, wr, mid, tr, mid, tp, tr);
    for (const f of [[sx * 0.007, 0.046, 0.0], [sx * 0.01, 0.048, 0.05]]) idx.push(v(0, 0.03, f[2] - 0.03, 0), v(f[0], f[1], f[2], 0), v(0, 0.03, f[2] + 0.02, 0));   // ragged fur along the back
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(Q, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const PTERO_VERT = /* glsl */`
uniform float uFold, uFlap;
attribute vec3 aUv;
varying vec3 vP, vN, vL, vUv;
void main(){
  vec3 p = position; float w = aUv.y, ax = abs(p.x);
  if (w > 0.) { p.z -= (1. - uFold)*ax*1.05*w; p.x *= mix(.42, 1., mix(1., uFold, w)); p.y += ax*sin(uFlap)*.75*uFold*w; }
  vec4 wp = modelMatrix*vec4(p, 1.);
  vP = wp.xyz; vN = mat3(modelMatrix)*normal; vL = position; vUv = aUv;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const PTERO_FRAG = /* glsl */`
${ANIMAL_GLSL}
varying vec3 vP, vN, vL, vUv;
void main(){
  vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  float fur = sin(vL.z*190. + 4.*sin(vL.x*130.))*sin(vL.x*170. + vL.y*150.);
  vec3 alb = mix(vec3(.40, .26, .15), vec3(.13, .08, .05), smoothstep(-.01, .03, vL.y))*(1. + .3*fur);   // dark back, tawny below
  alb = mix(alb, vec3(.62, .50, .36), smoothstep(.08, .13, vL.z)*smoothstep(.03, .0, vL.y));              // pale throat
  float part = vUv.x, back = 0.;
  if (part > .5 && part < 1.5) { alb = vec3(.42, .25, .17)*(1. + .25*sin(vL.x*60. + vL.z*45.)); back = .8; }   // membrane: the light comes through
  if (part > 1.5) alb = mix(vec3(.75, .6, .3), vec3(.08, .06, .05), smoothstep(.26, .3, vL.z));
  if (part > 2.5) alb = vec3(.01);
  gl_FragColor = vec4(litAnimal(alb, N, vP, .25, back), 1.);
}`;
function buildPterosaur(S) {
  const { path, M, scene, U } = S, ss = smoothstep;
  const PU = { ...U, uFold: { value: 0 }, uFlap: { value: 0 } };
  const mesh = new THREE.Mesh(pterosaurGeometry(), new THREE.ShaderMaterial({ uniforms: PU, vertexShader: PTERO_VERT, fragmentShader: PTERO_FRAG, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.name = 'pterosaur'; mesh.matrixAutoUpdate = false; scene.add(mesh);
  const u0 = lerp(M.log0, M.log1, 0.1), u1 = u0 + 7.5 / path.length, f = newFrame();
  S.frameAt(u0 + 7.6 / path.length, f);                             // close: it is a metre across and must fill a fifth of the frame
  const q0 = V3(f.p.x - 0.6, 0.3, f.p.z + 1.5), D = V3(0.4, -0.88, 0.12).normalize();   // where it breaks the ceiling, and its line
  const pos = V3(0, 0, 0), fw = V3(0, 0, 1), rt = V3(1, 0, 0), upv = V3(0, 1, 0), tmp = V3(0, 0, 0), scl = V3(1, 1, 1);
  let tHit = -99, lastU = 0;
  const seen = f.t.clone().add(V3(0, 0.3, 0)).normalize();
  S.rareU = [u0, u1];
  S.updaters.push((dt, time, camera, u) => {
    const e = clamp((u - u0) / (u1 - u0), 0, 1), on = u > u0 && u < u1;
    const depth = 2.7 * ss(0, 0.3, e) * (1 - ss(0.6, 0.97, e)) - 1.2 * ss(0.85, 1, e);       // down fast, a beat, then up and out
    const turn = ss(0.5, 0.72, e);                                   // beak down on the stab, up on the way out
    pos.copy(q0).addScaledVector(D, depth); pos.x += 0.5 * turn; pos.z += 0.3 * turn;
    fw.copy(D).multiplyScalar(1 - 2 * turn).add(tmp.set(0.5, 0, 0.3).multiplyScalar(Math.sin(turn * Math.PI))).normalize();
    rt.crossVectors(seen, fw).normalize(); upv.crossVectors(fw, rt);      // wings spread ACROSS our line of sight, never edge-on
    scl.setScalar(on ? 1.75 : 0.001); if (!on) pos.set(q0.x, 40, q0.z);
    mesh.matrix.makeBasis(rt, upv, fw).scale(scl).setPosition(pos); mesh.matrixWorldNeedsUpdate = true;
    PU.uFold.value = 0.12 + ss(0.52, 0.72, e) * 0.75; PU.uFlap.value = time * 16;
    if (u >= u0 && lastU < u0) tHit = time; if (u < u0) tHit = -99; lastU = u;
    const age = tHit > -90 ? time - tHit : 99, sp = S.specks, d = S.ceilU.uDimple.value;
    if (age < 5) { sp.uBurst1.value.copy(q0).addScaledVector(D, 0.3); sp.uBurstDir.value.copy(D).negate(); sp.uBurstAge.value.y = age + 0.25; d.set(q0.x, q0.z, age, 1.6); }
    else sp.uBurstAge.value.y = -9;
  });
}

