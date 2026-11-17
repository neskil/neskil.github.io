// THE LED MATTER of the mountain: four sets named by place (the sea, the canyon, the crater, the summit).
// One motif in four materials: matter lifted from one side of the flown line, curved across it and set down on
// the other, repeated in a row along the line, each member a step further on than the one before. No person, no made
// thing, no mark: only water, ice, raw slabs, fire, vapour and petals, moving on the world's clock.
//
// buildHero(ctx, opts) -> { object, sets: { sea, canyon, crater, summit }, update(dt, time, camera), radius, height,
//   center, triangles, calls, info }.  opts as the design file's "interface" (line, floorAt, seaY, lakeY, pillars,
//   time, sunDir, sunColor, shadeColor, skyGlow, sunBand, fog, detail). With no opts.line the part lays a compact
//   straight demo line on flat ground (the four sets in a row along +x, each over about 120 m).
// Everything is created in buildHero; update() only sets uniforms. Bodies: the slabs, the plates, the ice of the
// arches. Media: water, spray, drops, fire, sparks, vapour, petals, dust.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';

const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const NOISE = fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FBM;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Shared GLSL: the light by place (direct sun only above the band), the dawn glow from the east, exp2 fog.
const LIGHT_PARS = /* glsl */`
uniform float uTime; uniform vec3 uSunDir, uSunCol, uShade, uSkyTop, uGlow, uGlowDir, uFogC; uniform vec2 uBand; uniform float uFogD;
float sunAt(float y){ return smoothstep(uBand.x, uBand.y, y); }
vec3 skyLight(vec3 n){
  float up = clamp(n.y*.5+.5, 0., 1.);
  float east = clamp(dot(n, uGlowDir)*.5+.5, 0., 1.);
  return uShade*.9 + uSkyTop*up + uGlow*(.2+.7*east*east);
}
vec3 fogged(vec3 c, float d){ float f = 1.-exp(-uFogD*uFogD*d*d); return mix(c, uFogC, clamp(f, 0., 1.)); }
// the world's own rule for the dawn's rose and first gold: below the sun's band they fall wherever the land leaves
// the way to the east open (the canyon's gaps, the dawn side of the shore); tSunTop is the world's shade map
uniform sampler2D tSunTop; uniform vec4 uSunBox; uniform vec3 uRSun, uRGlow;
vec3 dawnRose(vec3 P, vec3 N){
  float top = texture2D(tSunTop, (P.xz - uSunBox.xy)*uSunBox.zw).b;
  float open = smoothstep(-1.5, 3., P.y - top)*(1. - smoothstep(uBand.x, uBand.y, P.y));
  return mix(uRGlow*1.3, uRSun*.5, smoothstep(45., 105., P.y))*open*clamp(dot(N, uSunDir)*.75 + .25, 0., 1.);
}
`;

// The world's rule for rock (sun by place, sky and shade, the dawn glow, the lake's fire), for the part's own rock.
const ROCK_LIGHT = /* glsl */`
uniform vec3 uRSky, uRShade, uRFire; uniform vec4 uRLake;
vec3 rockLight(vec3 P, vec3 N, float ao, float sunK){
  vec3 amb = mix(uRShade, uRSky, N.y*.5+.5);
  float gl = max(dot(N, uGlowDir), 0.);
  vec3 glow = uRGlow*(.16+.84*gl*gl);
  vec2 dl = P.xz - uRLake.xy; float rl = length(dl), kk = min(1., uRLake.z*.75/max(rl, 1e-3));
  vec3 Lv = vec3(uRLake.x + dl.x*kk, uRLake.w, uRLake.y + dl.y*kk) - P; float ll = length(Lv);
  float fire = max(dot(N, Lv/max(ll, 1e-3)), 0.)/(1.+ll*ll/1800.)*(1.-smoothstep(165., 215., rl));
  return uRSun*sunK*max(dot(N, uSunDir), 0.) + (amb+glow)*ao + uRFire*fire;
}
`;

// The places along the line, as the design file gives them (metres from the entry), and the compact demo's.
const PLACES = {
  real: {
    sea: [62, 104, 146, 188, 232], spouts: [48, 92, 138, 182, 226],
    gates: [290, 332, 374, 416, 458, 500, 542, 584], ripple: [262, 630],
    fire: [690, 725, 760, 795, 830], whirls: [700, 762, 824], vents: [712, 776, 842],
    rings: [985, 1165], arcs: [965, 1015, 1070, 1125, 1180, 1230],
    cleft: [860, 945], stream: [950, 1312],
  },
  demo: {
    sea: [14, 37, 60, 83, 106], spouts: [8, 30, 54, 78, 100],
    gates: [135, 150, 165, 180, 195, 210, 225, 240], ripple: [128, 247],
    fire: [272, 296, 320, 344, 368], whirls: [280, 320, 360], vents: [290, 330, 366],
    rings: [400, 472], arcs: [393, 409, 427, 445, 463, 481],
    cleft: [382, 392], stream: [392, 512],
  },
};

// The world's data for the sets: the line with its triads, the heights, the light, the shared uniforms.
function makeEnv(ctx, opts) {
  const demo = typeof opts.line !== 'function';
  const demoY = (s) => lerp(lerp(lerp(9, 6, sstep(118, 132, s)), 14, sstep(248, 264, s)), 18, sstep(378, 394, s));
  const line = demo
    ? (s) => ({ p: new THREE.Vector3(s - 260, demoY(s), 0), t: new THREE.Vector3(1, 0, 0) })
    : opts.line;
  // triad at s: p on the line, t its tangent, fwd the level heading, right the level right-hand side, n square to t and right
  const triad = (s) => {
    const { p, t } = line(s);
    const fwd = new THREE.Vector3(t.x, 0, t.z);
    if (fwd.lengthSq() < 1e-8) fwd.set(1, 0, 0);
    fwd.normalize();
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const n = new THREE.Vector3().crossVectors(right, t).normalize();
    return { p: p.clone(), t: t.clone().normalize(), fwd, right, n };
  };
  const col = (c, d) => new THREE.Color(c !== undefined && c !== null ? c : d);
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(0.8627, 0.0872, 0.4981)).normalize();
  const glowDir = new THREE.Vector3(Math.sin(105 * Math.PI / 180), 0.07, -Math.cos(105 * Math.PI / 180)).normalize();
  const band = opts.sunBand || { y0: 60, y1: 150 };
  const fog = opts.fog || null;
  const U = {
    uTime: opts.time && typeof opts.time === 'object' ? opts.time : { value: 0 },
    uSunDir: { value: sunDir }, uSunCol: { value: col(opts.sunColor, '#ffcf9a') },
    uShade: { value: col(opts.shadeColor, '#3a3f7a') }, uSkyTop: { value: col(opts.skyTop, '#3f62b0') },
    uGlow: { value: col(opts.skyGlow, '#ff9f78') }, uGlowDir: { value: glowDir },
    uBand: { value: new THREE.Vector2(band.y0, band.y1) },
    uFogC: { value: col(fog && fog.color, '#5a6ea6') }, uFogD: { value: fog ? fog.density : 0 },
  };
  // the land's own light numbers: the part's rock is lit by the same rule as the world's rock (the world may hand
  // its shared uniform objects as opts.light; else these are the numbers the world was built to at the first flight)
  const LW = opts.light || {};
  U.uRSun = LW.uSunCol || { value: col(opts.sunColor, '#ffcf9a').multiplyScalar(2.4) };
  U.uRSky = LW.uSkyCol || { value: new THREE.Color(0.196, 0.294, 0.665) };
  U.uRShade = LW.uShadeCol || { value: new THREE.Color(0.108, 0.117, 0.27) };
  U.uRGlow = LW.uGlowCol || { value: new THREE.Color(0.7, 0.392, 0.28) };
  U.uRFire = LW.uFireCol || { value: new THREE.Color(2.4, 0.79, 0.144) };
  U.uRLake = LW.uLake || { value: new THREE.Vector4(0, 0, 95, demo ? -1e4 : (opts.lakeY ?? 110)) };
  // the world's shade map (the height above which the way to the sun is open); a blank one where none is given
  const hfl = THREE.DataUtils.toHalfFloat, top = !demo && opts.sunTop && opts.sunTop.texture ? opts.sunTop : null;
  const blankTop = new THREE.DataTexture(new Uint16Array([hfl(0), hfl(0), hfl(-60000), hfl(1)]), 1, 1, THREE.RGBAFormat, THREE.HalfFloatType);
  blankTop.needsUpdate = true;
  U.tSunTop = { value: top ? top.texture : blankTop };
  U.uSunBox = { value: top && top.box ? top.box : new THREE.Vector4(0, 0, 1, 1) };
  // in the demo all four sets stand on one flat ground: the summit's things get the full sun, the others the dawn
  const UHigh = demo ? { ...U, uBand: { value: new THREE.Vector2(-1000, -999) } } : U;
  const ground = typeof opts.groundAt === 'function' ? opts.groundAt : (typeof opts.floorAt === 'function' ? opts.floorAt : null);
  return {
    demo, line, triad, U, UHigh, fog, places: demo ? PLACES.demo : PLACES.real,
    seaY: demo ? 0 : (opts.seaY ?? 0), lakeY: demo ? 0 : (opts.lakeY ?? 110),
    lake: demo ? null : (opts.lake || { x: 0, z: 0, r: 95 }),
    groundAt: (x, z, fallback) => { if (demo || !ground) return fallback; const y = ground(x, z); return Number.isFinite(y) ? y : fallback; },
    pillars: Array.isArray(opts.pillars) ? opts.pillars : null,
    ledges: !demo && Array.isArray(opts.ledges) ? opts.ledges : null,
    sunTop: demo ? null : (opts.sunTop || null),
    detail: clamp(opts.detail ?? (ctx.quality && ctx.quality.detail) ?? 1, 0.4, 1),
    density: clamp(opts.density ?? (ctx.vary && ctx.vary.density) ?? 1, 0.7, 1.3),
    rng: (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)),
  };
}

// A geometry gatherer: plain arrays, one draw call per gatherer.
function gather(names) {
  const g = { n: 0, index: [], a: {} };
  for (const k of Object.keys(names)) g.a[k] = { size: names[k], data: [] };
  return g;
}
function finish(g) {
  const geo = new THREE.BufferGeometry();
  for (const k of Object.keys(g.a)) geo.setAttribute(k, new THREE.Float32BufferAttribute(g.a[k].data, g.a[k].size));
  geo.setIndex(g.n > 65535 ? new THREE.Uint32BufferAttribute(g.index, 1) : new THREE.Uint16BufferAttribute(g.index, 1));
  geo.computeBoundingSphere();
  return geo;
}

// SMALL MEDIA (mist, spray, drops, spatter, sparks, dust, steam, flame dabs): quads that turn to the eye about
// their own places, each on its own loop of the world's clock. One draw call per list.
// item: { p, v, life, phase, s0, s1, kind, grav, seed, alpha, col, gate }
//   kind 0 soft puff lit by place, 1 water drop (a streak along its fall), 2 fire dab (cools with age), 3 spark,
//   4 dust, 5 dark smoke, 6 puff wound round a rising column, 7 flame wound round a rising column, 8 petal
//   gate [u, base, amp, phase]: shown only while an arch's ice front (base + amp sin) is at u; amp 0 = always;
//   amp -1 = [from, to, -1, phase]: shown only between two moments of a canyon gate's cycle
// AN ARC'S GUSTS (the summit): 1 inside a gust, 0 in the thin stretches between; they travel along the arc on the
// clock. A: the middles of gusts one to four at the clock's start (metres along the arc), B: their half lengths,
// C: (the fifth's middle, its half length, the speed in metres a second, the arc's length).
const GUSTS = /* glsl */`
  uniform vec4 uGustA[6], uGustB[6], uGustC[6];
  float gustAt(int i, float x, float t){
    vec4 A = uGustA[i], B = uGustB[i], C = uGustC[i];
    float len = max(C.w, 1.), sh = C.z*t, g = 0.;
    for (int j = 0; j < 5; j++) {
      float c = j < 4 ? A[j] : C.x, hl = j < 4 ? B[j] : C.y;
      float d = abs(mod(x - c - sh + .5*len, len) - .5*len);
      g = max(g, step(.5, hl)*(1. - smoothstep(.45*hl, max(hl, .5), d)));
    }
    return g;
  }`;

async function makePuffs(E, U, list, order) {
  // typed arrays filled in place; the page is handed back every two thousand items (no draw is taken in here)
  const n = list.length, V = n * 4;
  const aP = new Float32Array(V * 3), aC = new Float32Array(V * 2), aV = new Float32Array(V * 3), aL = new Float32Array(V * 4);
  const aK = new Float32Array(V * 4), aT = new Float32Array(V * 3), aG = new Float32Array(V * 4);
  const index = V > 65535 ? new Uint32Array(n * 6) : new Uint16Array(n * 6);
  const CX = [-1, 1, 1, -1], CY = [-1, -1, 1, 1], G0 = [0, 0, 0, 0], W1 = [1, 1, 1];
  for (let i = 0; i < n; i++) {
    const it = list[i], gt = it.gate || G0, c = it.col || W1, q = it.p, v = it.v, grav = it.grav || 0, alpha = it.alpha ?? 1;
    for (let k = 0; k < 4; k++) {
      const j = i * 4 + k, j2 = j * 2, j3 = j * 3, j4 = j * 4;
      aP[j3] = q[0]; aP[j3 + 1] = q[1]; aP[j3 + 2] = q[2];
      aC[j2] = CX[k]; aC[j2 + 1] = CY[k];
      aV[j3] = v[0]; aV[j3 + 1] = v[1]; aV[j3 + 2] = v[2];
      aL[j4] = it.life; aL[j4 + 1] = it.phase; aL[j4 + 2] = it.s0; aL[j4 + 3] = it.s1;
      aK[j4] = it.kind; aK[j4 + 1] = grav; aK[j4 + 2] = it.seed; aK[j4 + 3] = alpha;
      aT[j3] = c[0]; aT[j3 + 1] = c[1]; aT[j3 + 2] = c[2];
      aG[j4] = gt[0]; aG[j4 + 1] = gt[1]; aG[j4 + 2] = gt[2]; aG[j4 + 3] = gt[3];
    }
    const b = i * 4, o = i * 6;
    index[o] = b; index[o + 1] = b + 1; index[o + 2] = b + 2; index[o + 3] = b; index[o + 4] = b + 2; index[o + 5] = b + 3;
    if ((i & 2047) === 2047) await E.yield();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aP, 3));
  geo.setAttribute('aCorner', new THREE.BufferAttribute(aC, 2));
  geo.setAttribute('aVel', new THREE.BufferAttribute(aV, 3));
  geo.setAttribute('aLife', new THREE.BufferAttribute(aL, 4));
  geo.setAttribute('aLook', new THREE.BufferAttribute(aK, 4));
  geo.setAttribute('aTintC', new THREE.BufferAttribute(aT, 3));
  geo.setAttribute('aGate', new THREE.BufferAttribute(aG, 4));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  await E.yield();
  geo.boundingSphere.radius += 70;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: GUSTS + /* glsl */`
      uniform float uTime;
      attribute vec2 aCorner; attribute vec3 aVel, aTintC; attribute vec4 aLife, aLook, aGate;
      varying vec2 vC; varying vec3 vTint, vW; varying vec4 vLook; varying float vAge, vFade;
      void main(){
        float age = fract(uTime/max(aLife.x, .01) + aLife.y), tt = age*aLife.x, kind = aLook.x;
        vec3 c = position + aVel*tt + vec3(0., -.5*aLook.y*tt*tt, 0.);
        float wound = step(5.5, kind)*step(kind, 7.5), petal = step(7.5, kind);
        float wa = aLook.z*6.2832 + tt*1.1 + uTime*.35;
        c.xz += wound*vec2(cos(wa), sin(wa))*(.7 + 2.6*age*age + 1.3*sin(tt*.7 + aLook.z*40.))*mix(.45, 1., step(6.5, kind));
        float size = mix(aLife.z, aLife.w, age);
        vec4 mv = viewMatrix*modelMatrix*vec4(c, 1.);
        vec2 off = aCorner*size;
        float streak = step(.5, kind)*step(kind, 1.5) + step(2.5, kind)*step(kind, 3.5);
        vec3 vel = (viewMatrix*vec4(aVel + vec3(0., -aLook.y*tt, 0.), 0.)).xyz;
        float sp = length(vel.xy);
        vec2 d = vel.xy/max(sp, 1e-3);
        vec2 so = d*aCorner.y*size*(1. + min(sp*.16, 5.)) + vec2(-d.y, d.x)*aCorner.x*size;
        off = mix(off, so, streak*step(1e-3, sp));
        // a petal turns and flips as it flies
        float spin = aLook.z*40. + uTime*(1.2 + aLook.z*2.);
        vec2 pc = aCorner*vec2(1., .62);
        pc = vec2(pc.x*cos(spin) - pc.y*sin(spin), pc.x*sin(spin) + pc.y*cos(spin));
        pc.x *= .3 + .7*abs(sin(uTime*(1.7 + aLook.z*3.) + aLook.z*90.));
        off = mix(off, pc*size, petal);
        mv.y += petal*sin(tt*1.3 + aLook.z*50.)*.45;
        mv.xy += off;
        gl_Position = projectionMatrix*mv;
        float front = aGate.y + aGate.z*sin(uTime*.349 + aGate.w);
        float gate = mix(1., 1.-smoothstep(.02, .06, abs(aGate.x - front)), step(1e-4, aGate.z));
        // a negative amp marks a canyon gate's clock: shown only between two moments (x to y) of that gate's cycle
        float gtau = mod(uTime + aGate.w, ${GATE.cycle.toFixed(1)});
        gate = mix(gate, smoothstep(aGate.x - .5, aGate.x + .5, gtau)*(1.-smoothstep(aGate.y - .3, aGate.y + 1.2, gtau)), step(aGate.z, -1e-4));
        // media thin only close to the lens, by the TRUE distance from it (2.5 m down to 0.6 m); what must not come
        // near the lens is kept off the line by place
        // a petal of an arc (its gate carries its place along the arc in metres and the arc's number) shows while a gust
        // of that arc passes the place it flies at
        float ofArc = petal*step(.5, aGate.y);
        float gst = gustAt(int(clamp(aGate.y, 1., 6.) - .5), aGate.x + length(aVel)*(tt - .5*aLife.x), uTime);
        vFade = gate*mix(1., gst, ofArc)*smoothstep(.6, 2.5, length(mv.xyz))*aLook.w;
        vC = aCorner; vTint = aTintC; vLook = aLook; vAge = age; vW = (modelMatrix*vec4(c, 1.)).xyz;
      }`,
    fragmentShader: NOISE + LIGHT_PARS + /* glsl */`
      varying vec2 vC; varying vec3 vTint, vW; varying vec4 vLook; varying float vAge, vFade;
      void main(){
        float kind = vLook.x, r = length(vC), age = clamp(vAge, 0., 1.);
        float soft = step(kind, .5) + step(3.5, kind)*step(kind, 6.5);
        float fire = step(1.5, kind)*step(kind, 3.5) + step(6.5, kind)*step(kind, 7.5), petal = step(7.5, kind);
        float dusty = step(3.5, kind)*step(kind, 4.5);
        float nz = fbm(vC*1.7 + vLook.z*37. + vec2(0., age*1.3));
        float aSoft = smoothstep(1., .2, r + (nz-.5)*mix(.9, .3, dusty))*smoothstep(1., .72, r)*smoothstep(0., .1, age)*(1.-smoothstep(.55, 1., age));
        float aHard = smoothstep(1., .55, r)*smoothstep(0., .04, age)*(1.-smoothstep(.9, 1., age));
        float aFire = smoothstep(1., .1, r + (nz-.5)*.8)*smoothstep(0., .06, age)*(1.-smoothstep(.7, 1., age));
        float a = mix(aHard, aSoft, soft);
        a = mix(a, aFire, step(1.5, kind)*step(kind, 2.5) + step(6.5, kind)*step(kind, 7.5));
        a = mix(a, smoothstep(1., .78, r)*smoothstep(0., .12, age)*(1.-smoothstep(.86, 1., age)), petal);
        // a petal finer than a pixel gives its cover, as a mip does (by the quad's own footprint)
        a *= mix(1., 1. - smoothstep(1.2, 4., max(fwidth(vC.x), fwidth(vC.y))), petal);
        float sun = sunAt(vW.y);
        vec3 lit = mix(vec3(.7, .8, 1.), vec3(1.1, .98, .84), sun) + uGlow*.12;
        // spray and dust take the dawn's rose and gold where they pass through a band of it
        lit += dawnRose(vW, uSunDir)*mix(.2, .3, dusty);
        lit = mix(lit, min(lit, vec3(.95)), dusty);
        vec3 col = vTint*lit*mix(.8 + .35*nz, .78 + .3*fract(vLook.z*17.), petal);
        // fire cools as it ages: pale yellow, orange, deep red; it goes out while it glows
        float heat = clamp(1.25 - age*1.25 - r*.35 + (nz-.5)*.4, 0., 1.);
        vec3 fc = mix(vec3(.5, .03, .006), vec3(.9, .06, .01), smoothstep(.05, .35, heat));
        fc = mix(fc, vec3(1., .254, .023), smoothstep(.3, .65, heat));
        fc = mix(fc, vec3(1., .6, .2), smoothstep(.8, 1., heat));
        fc *= .6 + .85*heat;
        col = mix(col, fc*vTint, fire);
        a *= vFade*mix(1., smoothstep(.1, .42, heat), fire);
        col = fogged(col, distance(vW, cameraPosition)*mix(1., .5, fire));
        float keep = mix(1., .25 + .75*(1.-heat), fire);
        gl_FragColor = vec4(col*a, a*keep);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = order || 6;
  return { mesh, triangles: list.length * 2 };
}

// THE ONE MECHANISM: a broad band swept along a curve. point(u) gives a fresh Vector3, across(u) a unit Vector3
// (the band's width direction), half(u) the half width in metres, cup(u) how far the edges droop to the inside.
// Fills position, normal, uv (u along 0..1, v across -1..1), aMet (metres along, metres across) and what extra adds.
function sweepBand(g, o) {
  const nu = o.nu, nv = o.nv, base = g.n;
  const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3();
  let arc = 0, prev = null;
  for (let i = 0; i <= nu; i++) {
    const u = i / nu, C = o.point(u), A = o.across(u), h = o.half(u);
    if (prev) arc += C.distanceTo(prev);
    prev = C;
    T.subVectors(o.point(Math.min(1, u + 0.002)), o.point(Math.max(0, u - 0.002))).normalize();
    N.crossVectors(T, A).normalize();
    if (o.out && N.dot(o.out(u)) < 0) N.negate();
    const cup = o.cup ? o.cup(u) : 0;
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      P.copy(C).addScaledVector(A, h * v).addScaledVector(N, -cup * h * v * v);
      g.a.position.data.push(P.x, P.y, P.z);
      g.a.normal.data.push(N.x, N.y, N.z);
      g.a.uv.data.push(u, v);
      g.a.aMet.data.push(arc, h * v);
      if (o.extra) o.extra(g, u, v, P);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = base + i * (nv + 1) + j, b = a + nv + 1;
    g.index.push(a, b, a + 1, a + 1, b, b + 1);
  }
  g.n += (nu + 1) * (nv + 1);
  return arc;
}

// An arch over the line at s: rises at lateral +side*dA, comes down at -side*dB, apex height H above y0.
// Returns point(u), across(u) (the level heading leaned by tilt toward the arch's outside) and out(u).
function archOver(F, side, dA, dB, y0, H, tilt) {
  const point = (u) => {
    const lat = lerp(side * dA, -side * dB, u), y = y0 + H * 4 * u * (1 - u);
    return new THREE.Vector3(F.p.x + F.right.x * lat, y, F.p.z + F.right.z * lat);
  };
  const out = (u) => {
    const tx = -side * (dA + dB), ty = H * 4 * (1 - 2 * u), l = Math.hypot(tx, ty) || 1;
    const nl = side * ty / l, ny = -side * tx / l;
    return new THREE.Vector3(F.right.x * nl, ny, F.right.z * nl);
  };
  const across = (u) => {
    const k = typeof tilt === 'function' ? tilt(u) : tilt, o = out(u);
    return new THREE.Vector3(F.fwd.x * Math.cos(k) + o.x * Math.sin(k), o.y * Math.sin(k), F.fwd.z * Math.cos(k) + o.z * Math.sin(k)).normalize();
  };
  return { point, across, out };
}

// THE SEA: five arches of sea water over the line, each more frozen than the one before.
async function buildSea(E, group) {
  const rng = E.rng('led-sea');
  const g = gather({ position: 3, normal: 3, uv: 2, aMet: 2, aArch: 4 });
  // the ice front of each arch as a share of its length from the rising foot (water before it, ice after it)
  const fronts = [[1.3, 0], [0.84, 0.09], [0.5, 0.1], [0.15, 0.085], [-0.3, 0]];
  const arches = [];
  for (let i = 0; i < E.places.sea.length; i++) {
    const F = E.triad(E.places.sea[i]);
    const side = rng.sign(), dA = rng.range(30, 36), dB = rng.range(30, 36);
    // the curtain leans about 50 degrees out of the level: 5 to 7 m along the way at its crown, 9 to 14 m at its feet,
    // and as broad again seen from along the line (its near edge is the low one: at least 9 m above the lens)
    const apex = Math.max(E.seaY + rng.range(26, 29), F.p.y + 17.2) + (i === 4 ? 1 : 0);
    const y0 = E.seaY - 1.5, H = apex - y0;
    const hf = rng.range(6.6, 8), hc = rng.range(3.9, 4.6), seed = rng(), ph = rng() * TAU;
    const tilt = (u) => 0.88 - 0.14 * Math.pow(Math.abs(2 * u - 1), 2);
    const A = archOver(F, side, dA, dB, y0, H, tilt);
    const fr = fronts[Math.min(i, fronts.length - 1)];
    // the curtain's breadth swells and narrows along its length: nothing of it is even
    const w1 = rng.range(7, 11), w2 = rng.range(17, 26), wp = rng() * TAU;
    const half = (u) => lerp(hc, hf, Math.pow(Math.abs(2 * u - 1), 1.6)) * (1 + 0.2 * Math.sin(u * w1 + wp) + 0.11 * Math.sin(u * w2 + wp * 2));
    const nu = Math.round(96 * (0.6 + 0.4 * E.detail));
    sweepBand(g, {
      nu, nv: 12, point: A.point, across: A.across, out: A.out, half, cup: () => 0.16,
      extra: (gg) => gg.a.aArch.data.push(seed, fr[0], fr[1], ph),
    });
    await E.yield();
    // what hangs from the curtain's low edge, square to the line: a ragged veil of falling water under the running
    // part, a fringe of icicles under the ice (icicles at most 3 m, so the ice keeps 9 m over the lens)
    const low = (u) => { const c = A.point(u), ac = A.across(u), h = half(u) * 0.9; return c.addScaledVector(ac, -h); };
    const hang = (u) => Math.max(0.05, Math.min(2.5, (low(u).y - E.seaY) * 0.45));
    // the hung set is deeper down the flanks (torn fingers of up to 9 m there); over the line it is as the count reads it
    const deep = (u) => { const t = clamp((Math.abs(2 * u - 1) - 0.15) / 0.25, 0, 1); return hang(u) * (1 + 0.8 * t * t * (3 - 2 * t)); };
    sweepBand(g, {
      nu, nv: 4, point: (u) => { const c = low(u); c.y -= deep(u); return c; }, across: () => new THREE.Vector3(0, -1, 0), half: deep,
      extra: (gg) => gg.a.aArch.data.push(seed + 2, fr[0], fr[1], ph),
    });
    await E.yield();
    // CLEAR AIR BY GEOMETRY for the ice (the curtain's low edge and its icicles' tips against the line near the arch)
    let iceClear = 1e9, iceOver = 1e9;
    for (let d = -16; d <= 16; d += 1) {
      const e = E.line(E.places.sea[i] + d).p;
      for (let k = 2; k <= 38; k++) {
        const u = k / 40, c = low(u), tip = Math.min(3, hang(u) * 1.2);
        iceClear = Math.min(iceClear, Math.hypot(c.x - e.x, c.y - tip - e.y, c.z - e.z));
        if (d === 0 && Math.hypot(c.x - e.x, c.z - e.z) < 6) iceOver = Math.min(iceOver, c.y - tip - e.y);
      }
    }
    arches.push({ F, side, dA, dB, y0, H, seed, A, fr, ph, half, iceClear, iceOver });
    await E.yield();
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...E.U }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      uniform float uTime; attribute vec2 aMet; attribute vec4 aArch;
      varying vec2 vUv, vMet; varying vec4 vArch; varying vec3 vN, vW; varying float vFront;
      void main(){
        vUv = uv; vMet = aMet; vArch = aArch;
        vFront = aArch.y + aArch.z*sin(uTime*.349 + aArch.w);
        float wet = 1.-smoothstep(vFront-.03, vFront+.03, uv.x);
        vec3 p = position + normal*((sin(aMet.x*.33 - uTime*2.1 + aArch.x*40.)*.55 + sin(aMet.x*.9 - uTime*4. + aMet.y*.7)*.22)*wet);
        // spray ice is lumpy: the frozen part swells and pits where it stands (nothing of it moves)
        float sd0 = fract(aArch.x);
        p += normal*((sin(aMet.x*.83 + sd0*40.)*sin(aMet.y*1.17 + sd0*17.)*.75 + sin(aMet.x*2.1 + aMet.y*1.7 + sd0*9.)*.35)*(1.-wet)*step(aArch.x, 1.5));
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
        gl_Position = projectionMatrix*viewMatrix*w;
        #ifdef FIRM
        // the firm pass draws the band's dense body only: what hangs under it stays out
        if (aArch.x > 1.5) gl_Position = vec4(2., 2., 2., 1.);
        #endif
      }`,
    fragmentShader: NOISE + LIGHT_PARS + /* glsl */`
      varying vec2 vUv, vMet; varying vec4 vArch; varying vec3 vN, vW; varying float vFront;
      void main(){
        float u = clamp(vUv.x, 0., 1.), v = clamp(vUv.y, -1., 1.), e = 1.-abs(v);
        float ice = smoothstep(vFront-.012, vFront+.012, u);
        float hung = step(1.5, vArch.x), sd = fract(vArch.x);
        if (hung > .5) {
          // the veil under the running water: streaks that fall and break into drops; under the ice: icicles
          float vv = v*.5+.5;
          float kd = 1. + .8*smoothstep(.15, .4, abs(2.*u - 1.));
          // DISTINCT ICICLES under the ice: separate tapering spikes with gaps between, crisp by their own footprint;
          // under the running water the same law draws separate falling strands, not a smear
          float cell = vMet.x*2.1 + sd*13., fr = fract(cell), hh = hash11(floor(cell) + sd*7.);
          float len = (.3 + .7*hh*hh)*.6*step(.3, hh);
          float wd = clamp(1.-abs(2.*fr-1.)*1.25, 0., 1.);
          float dI = len*pow(wd, 1.3)/kd - vv;
          float ai2 = clamp(dI/max(fwidth(dI), 1e-4) + .5, 0., 1.);
          float lenW = (.2 + .8*hh*hh)*.62*(.7 + .3*sin(uTime*(1.1 + hh*2.3) + hh*40.))*step(.38, hh);
          float dW = lenW*pow(wd, 1.1) - vv;
          float aS = clamp(dW/max(fwidth(dW), 1e-4) + .5, 0., 1.);
          // THE TORN CURTAIN under the running water, at every clock: fingers and tatters of unequal length (2 to 9 m)
          // that fall with the water and break into holes and drops; white where thick, glassy blue-green where thin
          float fl = .22 + .78*smoothstep(.25, .75, fbm(vec2(vMet.x*.19 + sd*61., uTime*.09)));
          float rag = fbm(vec2(vMet.x*1.1 + sd*17., vv*2.4 - uTime*1.5));
          float tat = fl - vv + (rag - .5)*.55;
          float holes = fbm(vec2(vMet.x*.5 + sd*90., vv*1.5 - uTime*1.25));
          float veil = smoothstep(0., .22, tat)*smoothstep(.28, .52, holes + (1. - vv)*.38);
          float aV = max(veil, aS*.85);
          vec3 cV = mix(vec3(.38, .64, .66), vec3(.84, .91, .97), smoothstep(.25, .8, veil + .3*wd*aS));
          vec3 c2 = mix(cV, mix(vec3(.42, .6, .82), vec3(.8, .9, .97), wd), ice);
          float a2 = mix(aV, ai2, ice);
          c2 = fogged(min(c2 + c2*dawnRose(vW, uSunDir)*.25 + uGlow*.04, vec3(.9, .94, .97)), distance(vW, cameraPosition));
          gl_FragColor = vec4(c2*a2, a2);
          return;
        }
        vec2 q = vec2(vMet.x*.16 - uTime*1.7, vMet.y*.85) + sd*31.;
        float n1 = fbm(q), n2 = fbm(q*vec2(2.3, 2.7) + 5.);
        // torn along both edges into fingers that run with the water, more and more toward the falling foot
        float tear = mix(.5, .92, u);
        float fing = fbm(vec2(vMet.x*.09 - uTime*.95, vMet.y*1.5) + vArch.x*77.);
        float hole = fbm(vec2(vMet.x*.055 - uTime*.5, vMet.y*.22) + sd*19.);
        // A BROAD RAGGED SHEET: whole down to its low edge, where the torn curtain hangs; its upper edge torn into lumps
        // and tongues of spray thrown 0.5 to 2.5 m up at uneven places (sized in metres on the sheet), never a clean curve
        float hM = abs(vMet.y)/max(abs(v), .08);
        float tg = fbm(vec2(vMet.x*.42 - uTime*1.1, uTime*.21) + sd*41.), tg2 = fbm(vec2(vMet.x*1.6 - uTime*2.4, 7.) + sd*13.);
        float cutT = min(2.7 - 2.3*smoothstep(.3, .72, tg) + (tg2 - .5)*1.1, .7*hM)/max(hM, .5);
        float top = mix(1., (1. - v) - cutT - tear*.15*fing, smoothstep(.02, .1, v));
        float bot = (1. + v) - .04 + (n2 - .5)*.1;
        float bodyv = min(top, bot + .25)*1.25 + (n1-.5)*.4*tear + (n2-.5)*.2 - smoothstep(.52, .78, hole)*(.2 + .8*u);
        float aw = smoothstep(0., .16, bodyv);
        // the ice: lumpy and whole, its low edge a fringe of icicles
        float ni = fbm(vec2(vMet.x*.45, vMet.y*.7) + vArch.x*17.);
        float ai = smoothstep(0., .06, e*1.7 + (ni-.5)*1.1 - .12);
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float up = clamp(n.y*.5+.5, 0., 1.), east = clamp(dot(n, uGlowDir), 0., 1.);
        // RUNNING WATER IS WHITE AND RAGGED: torn curtains of foam with gaps between, never a smooth coloured band
        float streak = fbm(vec2(vMet.x*.5 - uTime*5.2, vMet.y*2.4) + vArch.x*5.);
        float edge = 1.-smoothstep(0., .42, bodyv);
        float foam = smoothstep(.42, .74, streak*.55 + n2*.3 + edge*.62 + u*.1);
        vec3 cw = mix(vec3(.66, .75, .86), vec3(.93, .97, 1.), clamp(.2 + .45*up + .45*foam, 0., 1.));
        float thin = smoothstep(.3, .58, streak*.5 + n2*.36 + n1*.26 + edge*.3);
        cw = mix(vec3(.38, .64, .66), cw, clamp(thin*smoothstep(.02, .4, bodyv) + foam*.3, 0., 1.));
        float lump = fbm(vec2(vMet.x*1.3, vMet.y*1.6) + vArch.x*3.);
        float lump2 = fbm(vec2(vMet.x*.42, vMet.y*.5) + sd*11.);
        vec3 ci = mix(vec3(.4, .58, .8), vec3(.79, .905, 1.), clamp(up*1.05 - .1 + (lump-.5)*.8 + (lump2-.5)*1.1, 0., 1.));
        ci *= .82 + .3*lump2;
        vec3 alb = mix(cw, ci, ice);
        // WHITE WATER AND ICE KEEP THEIR FORM: lit they stay under full white, pale blue in the creases and underneath
        float sunI = sunAt(vW.y)*clamp(dot(n, uSunDir), 0., 1.);
        vec3 col = alb*(.66 + .22*up + .3*sunI) + alb*dawnRose(vW, n)*.4 + uGlow*east*east*.1;
        col = min(col, vec3(.9, .94, .97));
        float a = mix(aw*thin, ai, ice);
        col = fogged(col, distance(vW, cameraPosition));
        #ifdef FIRM
        // the firm pass: where the body is dense it is opaque and writes depth, so no second outline shows through it
        gl_FragColor = vec4(col, 1.);
        if (a < .6) discard;
        #else
        gl_FragColor = vec4(col*a, a);
        #endif
      }`,
  });
  const mesh = new THREE.Mesh(finish(g), mat);
  mesh.renderOrder = 2;
  group.add(mesh);
  // the firm pass of the same bands: opaque where the body is dense, writing depth (set a hair behind the soft pass)
  const firm = new THREE.Mesh(mesh.geometry, new THREE.ShaderMaterial({
    uniforms: mat.uniforms, defines: { FIRM: 1 }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    vertexShader: mat.vertexShader, fragmentShader: mat.fragmentShader,
  }));
  group.add(firm);
  await E.yield();
  // spray, drops and mist: the boil at each wet foot, drops off the low edge of the running water, spray where
  // the water breaks against the ice front
  const list = [], prng = E.rng('led-sea-spray'), dens = 0.5 + 0.5 * E.detail, G = 9.8;
  const white = [0.95, 0.98, 1], foam = [0.74, 0.8, 0.87];
  // (boils small and dim, drops kept to the two flanks under each arch: the air through the opening stays clear)
  const boil = (f, n) => {
    for (let k = 0; k < Math.round(12 * n * dens); k++) list.push({ p: [f.x + prng.range(-3.5, 3.5), E.seaY + 0.4, f.z + prng.range(-3.5, 3.5)], v: [prng.range(-0.5, 0.5), prng.range(0.8, 1.8), prng.range(-0.5, 0.5)], life: prng.range(3, 5), phase: prng(), s0: 1.3, s1: prng.range(3, 4.6), kind: 0, seed: prng(), alpha: 0.34, col: foam });
    for (let k = 0; k < Math.round(14 * n * dens); k++) {
      const vy = prng.range(5, 9);
      list.push({ p: [f.x + prng.range(-4, 4), E.seaY, f.z + prng.range(-5, 5)], v: [prng.range(-2.2, 2.2), vy, prng.range(-2.2, 2.2)], life: 2 * vy / G, phase: prng(), s0: prng.range(0.15, 0.25), s1: 0.18, kind: 1, grav: G, seed: prng(), alpha: 0.5, col: foam });
    }
  };
  for (const a of arches) {
    const wet = a.fr[0] - a.fr[1];
    if (wet > 0.04) boil(a.A.point(0.02), 1);
    if (a.fr[0] > 1) boil(a.A.point(0.98), 1.3);
    const nDrops = Math.round(34 * dens * clamp(wet, 0, 1));
    for (let k = 0; k < nDrops; k++) {
      const u0 = prng.range(0.05, Math.max(0.06, Math.min(0.3, wet - 0.02))), u = a.fr[0] > 1 && (k & 1) ? 1 - u0 : u0;
      const c = a.A.point(u), ac = a.A.across(u), h = a.half(u) * prng.range(0.7, 1.02);
      const py = c.y - ac.y * h, fall = Math.max(1, py - E.seaY);
      const T = a.A.point(Math.min(1, u + 0.01)).sub(c).normalize(), vy = T.y * 3;
      list.push({ p: [c.x - ac.x * h, py, c.z - ac.z * h], v: [T.x * 3 + prng.range(-0.6, 0.6), vy, T.z * 3 + prng.range(-0.6, 0.6)], life: (vy + Math.sqrt(vy * vy + 2 * G * fall)) / G, phase: prng(), s0: prng.range(0.14, 0.24), s1: 0.18, kind: 1, grav: G, seed: prng(), alpha: 0.5, col: foam });
    }
    if (a.fr[1] > 0) for (let k = 0; k < Math.round(46 * dens); k++) {
      const u = clamp(a.fr[0] + a.fr[1] * prng.range(-1, 1), 0.02, 0.98), c = a.A.point(u), o = a.A.out(u);
      list.push({ p: [c.x + prng.range(-3, 3), c.y + prng.range(-1.5, 1.5), c.z + prng.range(-3, 3)], v: [o.x * 3 + prng.range(-2, 2), o.y * 3 + prng.range(0, 3), o.z * 3 + prng.range(-2, 2)], life: prng.range(1.2, 2.2), phase: prng(), s0: 1.3, s1: prng.range(2.8, 4.6), kind: 0, seed: prng(), alpha: 0.5, col: foam, gate: [u, a.fr[0], a.fr[1], a.ph] });
    }
  }
  await E.yield();
  // FOAM on the water round every foot: ragged patches of unequal lumps that well up and drift outward, each patch
  // on its own clock; never a ring of equal dabs. Own stream; the six patches of every foot are dealt first.
  const wr = E.rng('led-sea-foam'), nr = Math.round(108 * dens), feet = [];
  for (const a of arches) for (const u of [0.015, 0.985]) {
    const f = a.A.point(u), patches = [];
    for (let k = 0; k < 6; k++) patches.push({ an: wr() * TAU, r: wr.range(2.5, 7), ph: wr(), spread: wr.range(0.8, 2) });
    feet.push({ f, patches });
  }
  for (const ft of feet) for (let k = 0; k < nr; k++) {
    const pa = ft.patches[k % 6], an = pa.an + wr.range(-1, 1) * pa.spread / pa.r, r = pa.r + wr.range(-1, 1) * pa.spread, cx = Math.cos(an), cz = Math.sin(an), sp = wr.range(0.4, 1.2);
    list.push({ p: [ft.f.x + cx * r, E.seaY + 0.2, ft.f.z + cz * r], v: [cx * sp, 0, cz * sp], life: wr.range(3, 5), phase: pa.ph + wr.range(-0.08, 0.08), s0: wr.range(0.25, 0.7), s1: wr.range(0.7, 2.6), kind: 0, seed: wr(), alpha: wr.range(0.22, 0.46), col: foam });
  }
  await E.yield();
  const puffs = await makePuffs(E, E.U, list, 6);
  group.add(puffs.mesh);
  E.note.sea = arches.map((a, i) => ({ s: E.places.sea[i], iceClear: +a.iceClear.toFixed(2), lowestOverLens: +a.iceOver.toFixed(2), side: a.side }));
  return { triangles: (g.index.length / 3) * 2 + puffs.triangles, calls: 3 };
}
// THE CANYON'S CLOCK: every gate closes (4.5 s), stands (11 s), opens (4.5 s) and rests (1 s): 21 s. CLOSED is the
// ruling state. The phase steps by 21/8 s from gate to gate up the canyon, so at every moment four or five gates
// stand closed and three or four are moving, and the wave of closing travels up the canyon at 16 m/s.
const GATE = { cycle: 21, close: 4.5, stand: 11, open: 4.5, step: 21 / 8, spacing: 42 };

// One raw slab: ONE GREAT THICK PLATE of the canyon's own strata, levered from the floor. In its own plane: l along its
// length from the hinge, w along the hinge, h the height above the face that looks at the line. Broad at its foot,
// narrowing to about half at its head; thick at its foot, about half as thick at its head; its two long edges run
// together and each is broken by two to four bites or shoulders of 0.5 to 3 m, unequal; its head is a blunt broken end, square
// to nothing. ONE solid piece: round its edge the beds show as small ledges (each bed set in by up to 0.4 m), and its
// two broad faces are bedding planes, smoothly uneven by up to 0.18 m (dents INTO the rock only: the face toward the line never
// passes the plane the clear air is counted on). The vertex shader turns it about its hinge.
function pushSlab(g, o) {
  const rng = o.rng, L = o.L, hw = o.W / 2, root = o.root, K = 4, M = 8;
  // THE DEAL: every number is drawn for every slab
  const taper = [rng.range(0.42, 0.58), rng.range(0.42, 0.58)], headFrom = [rng.range(0.06, 0.34), rng.range(0.06, 0.34)], tip = [rng.range(0.06, 0.15), rng.range(0.06, 0.15)];
  const nf = [rng.int(2, 4), rng.int(2, 4)];
  // bites and shoulders of UNEQUAL size and spacing: a great one and a small one by turns (which comes first is dealt),
  // the gaps between them dealt unequal, each broken in and out at an angle of its own
  const feats = [0, 1].map(() => {
    const first = rng() < 0.5, gaps = [0, 1, 2, 3, 4].map(() => rng.range(0.3, 1.7));
    return [0, 1, 2, 3].map((k) => {
      const great = (k % 2 === 0) === first, u = rng(), v = rng();
      return { gap: gaps[k], end: gaps[k + 1], deep: great ? 1.7 + 1.3 * u : 0.5 + 0.8 * u, len: great ? 4 + 6 * v : 1.2 + 2.3 * v, rise: rng.range(0.3, 3.2), fall: rng.range(0.4, 5) };
    });
  });
  const inset = [0, 1, 2, 3].map(() => rng.range(0, 0.4)), cuts = [0, 0.25 + rng.range(-0.07, 0.07), 0.5 + rng.range(-0.07, 0.07), 0.75 + rng.range(-0.07, 0.07), 1], thin = rng.range(0.45, 0.55);
  // half the breadth on side i at l: the taper, less the deepest bite or shoulder there, drawn in to the head's end
  const half = (i, l) => {
    const base = hw * (1 - taper[i] * clamp(l / L, 0, 1));
    let off = 0, acc = 0, tot = feats[i][nf[i] - 1].end;
    for (let k = 0; k < nf[i]; k++) tot += feats[i][k].gap;
    for (let k = 0; k < nf[i]; k++) {
      const F = feats[i][k];
      acc += F.gap;
      const p = L * (0.05 + 0.8 * acc / tot), d = Math.min(F.deep, 0.35 * hw * (1 - taper[i] * p / L));
      const hold = p + Math.max(F.rise, F.len), end = hold + F.fall;
      const v = l < p ? 0 : l < p + F.rise ? d * (l - p) / F.rise : l < hold ? d : l < end ? d * (end - l) / F.fall : 0;
      if (v > off) off = v;
    }
    // between them the edge runs nearly straight but uneven (inward only, by up to 0.4 m)
    off += 0.9 * dent(i, l, i ? hw : -hw);
    const lh = L * (1 - headFrom[i]);
    let w = base - off;
    if (l > lh) w = lerp(w, tip[i] * o.W, (l - lh) / (L - lh));
    return Math.max(w, 0.3);
  };
  const tAt = (l) => o.tFoot * (1 - (1 - thin) * clamp(l / L, 0, 1));
  // the two faces' unevenness: a smooth field on a lattice of 5 m, 0 to 0.45 m deep, one for either face
  const nx = Math.ceil((L + root) / 5) + 2, ny = Math.ceil(o.W / 5) + 2;
  const tabs = [0, 1].map(() => { const t = []; for (let k = 0; k < nx * ny; k++) t.push(rng()); return t; });
  const dent = (t, l, w) => {
    const x = (l + root) / 5, y = (w + hw) / 5, ix = Math.min(nx - 2, Math.max(0, Math.floor(x))), iy = Math.min(ny - 2, Math.max(0, Math.floor(y)));
    const ux = sstep(0, 1, x - ix), uy = sstep(0, 1, y - iy), Q = tabs[t];
    return 0.45 * lerp(lerp(Q[iy * nx + ix], Q[iy * nx + ix + 1], ux), lerp(Q[(iy + 1) * nx + ix], Q[(iy + 1) * nx + ix + 1], ux), uy);
  };
  // THE FACES' BROKEN-OFF BEDS: two to four lines a face where a bed has broken away, so that the face shows two or
  // three beds in their own tones. The lines run across the face oblique, not parallel, and broken (each jogs by dealt
  // amounts at unequal runs). They change the tone only: a broad face has no step and no hard facet
  const ns = [rng.int(2, 4), rng.int(2, 4)];
  const steps = [0, 1].map(() => [0, 1, 2, 3].map(() => ({ at: rng(), slope: rng.range(-0.7, 0.7), toHead: rng() < 0.7, jog: [0, 1, 2, 3, 4, 5, 6, 7].map(() => rng.range(-1.7, 1.7)) })));
  const N = Math.max(14, Math.round((L + root) / 0.9)), ls = [], hl = [[], []], sp = (L + root) / N;
  for (let i = 0; i <= N; i++) { const l = -root + (L + root) * i / N; ls.push(l); hl[0].push(half(0, l)); hl[1].push(half(1, l)); }
  // (a line's runs between its jogs are unequal: each run is as broad as its own jog is great, 1.2 to 3.8 m)
  for (const f of steps) for (const S of f) { let a = 0; S.edge = S.jog.map((j) => (a += 1.2 + 2.6 * Math.abs(j) / 1.7)); }
  const cellOf = (S, w) => { let k = 0; while (k < 7 && S.edge[k] < w + hw) k++; return k; };
  // how many beds down the face stands at (l, w) of face t. The lines are put in order at every w and kept 2.2 m apart:
  // they never cross and never pinch, so every bed's tone is a band from one long edge to the other, never a closed patch
  const peel = (t, l, w) => {
    const b = [];
    for (let k = 0; k < ns[t]; k++) { const S = steps[t][k]; b.push(L * (0.1 + 0.8 * (k + S.at) / ns[t]) + S.slope * w + S.jog[cellOf(S, w)]); }
    b.sort((x, y) => x - y);
    let beds = 0;
    for (let k = 0; k < b.length; k++) {
      if (k) b[k] = Math.max(b[k], b[k - 1] + 2.2);
      beds += clamp((steps[t][k].toHead ? l - b[k] : b[k] - l) / sp + 0.5, 0, 1);
    }
    return beds;
  };
  // a point of bed k's outline: station i along, j across
  const pt = (k, i, j) => { const q = inset[k] * (0.25 + 0.75 * dent(k & 1, ls[i], k * 5 - hw) / 0.45), a = -Math.max(hl[0][i] - q, 0.25), b = Math.max(hl[1][i] - q, 0.25); return [i === N ? L - q : ls[i], lerp(a, b, j / M)]; };
  const vert = (l, w, h, nl, nw, nh, db = 0) => {
    const ca = Math.cos(o.pose), sa = Math.sin(o.pose);
    const x = l * ca - h * sa, y = l * sa + h * ca;
    g.a.position.data.push(o.hinge.x + o.inw.x * x + o.upn.x * y + o.tan.x * w, o.hinge.y + o.inw.y * x + o.upn.y * y + o.tan.y * w, o.hinge.z + o.inw.z * x + o.upn.z * y + o.tan.z * w);
    g.a.normal.data.push(nl, nw, nh);
    g.a.aLoc.data.push(l, w, h);
    g.a.aHinge.data.push(o.hinge.x, o.hinge.y, o.hinge.z);
    g.a.aInw.data.push(o.inw.x, o.inw.y, o.inw.z);
    g.a.aTan.data.push(o.tan.x, o.tan.y, o.tan.z);
    g.a.aUpn.data.push(o.upn.x, o.upn.y, o.upn.z);
    g.a.aTurn.data.push(o.aC, o.aO, o.phase, o.kind);
    g.a.aTint.data.push(o.seed, o.bed + db);
    return g.n++;
  };
  // THE TWO BROAD FACES: the one toward the line on the first bed's outline, the back on the fourth's
  const faces = [];
  for (const top of [0, 1]) {
    const k = top ? K - 1 : 0, first = g.n, H = [], sg = top ? 1 : -1;
    for (let i = 0; i <= N; i++) { H.push([]); for (let j = 0; j <= M; j++) { const p = pt(k, i, j); const t = tAt(p[0]), took = 0.4 * dent(top, p[0], p[1]); H[i].push([p[0], p[1], top ? t - took : took, peel(top, p[0], p[1])]); } }
    for (let i = 0; i <= N; i++) for (let j = 0; j <= M; j++) {
      const a = H[Math.max(0, i - 1)][j], b = H[Math.min(N, i + 1)][j], c = H[i][Math.max(0, j - 1)], d = H[i][Math.min(M, j + 1)], p = H[i][j];
      // (smooth normals, shared over the whole face: its unevenness is 5 m broad and at most 0.18 m deep)
      const dl = (b[2] - a[2]) / Math.max(b[0] - a[0], 1e-3), dw = (d[2] - c[2]) / Math.max(d[1] - c[1], 1e-3), n = Math.hypot(dl, dw, 1);
      vert(p[0], p[1], p[2], -sg * dl / n, -sg * dw / n, sg / n, p[3] / 23);
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = first + i * (M + 1) + j, c = a + M + 1; g.index.push(a, c, a + 1, a + 1, c, c + 1); }
    faces.push(H);
  }
  // THE EDGE, all round: each bed's broken edge, and the small ledge between it and the bed above
  const loop = [];
  for (let i = 0; i <= N; i++) loop.push([i, 0]);
  for (let j = 1; j <= M; j++) loop.push([N, j]);
  for (let i = N - 1; i >= 0; i--) loop.push([i, M]);
  for (let j = M - 1; j >= 1; j--) loop.push([0, j]);
  const P = loop.length;
  const strip = (A, B) => { for (let m = 0; m < P; m++) { const m1 = (m + 1) % P; g.index.push(A[m], A[m1], B[m1], A[m], B[m1], B[m]); } };
  for (let k = 0; k < K; k++) {
    const Q = loop.map(([i, j]) => pt(k, i, j)), lo = [], hi = [];
    for (let m = 0; m < P; m++) {
      const [i, j] = loop[m], a = Q[(m + P - 1) % P], b = Q[(m + 1) % P], q = Q[m], t = tAt(q[0]);
      let nl = b[1] - a[1], nw = -(b[0] - a[0]);
      const len = Math.hypot(nl, nw) || 1;
      nl /= len; nw /= len;
      lo.push(vert(q[0], q[1], k === 0 ? faces[0][i][j][2] : t * cuts[k], nl, nw, 0));
      hi.push(vert(q[0], q[1], k === K - 1 ? faces[1][i][j][2] : t * cuts[k + 1], nl, nw, 0));
    }
    strip(lo, hi);
    if (k < K - 1) {
      const up = inset[k + 1] >= inset[k] ? 1 : -1, A = [], B = [];
      for (let m = 0; m < P; m++) {
        const [i, j] = loop[m], q = Q[m], r = pt(k + 1, i, j);
        A.push(vert(q[0], q[1], tAt(q[0]) * cuts[k + 1], 0, 0, up * 0.4));
        B.push(vert(r[0], r[1], tAt(r[0]) * cuts[k + 1], 0, 0, up * 0.4));
      }
      strip(A, B);
    }
  }
  return { wide: o.W / L, head: o.tFoot * thin };
}

// RUBBLE heaped along a slab's foot: broken blocks of the same beds, lying still on the ground at the hinge
function pushRubble(g, o) {
  const F = [[0, 2, 6, 4], [1, 5, 7, 3], [0, 4, 5, 1], [2, 3, 7, 6], [0, 1, 3, 2], [4, 6, 7, 5]];
  for (const c of o.chunks) {
    const c1 = Math.cos(c.rot[0]), s1 = Math.sin(c.rot[0]), c2 = Math.cos(c.rot[1]), s2 = Math.sin(c.rot[1]), c3 = Math.cos(c.rot[2]), s3 = Math.sin(c.rot[2]), C = [];
    for (let k = 0; k < 8; k++) {
      const x = (k & 1 ? 1 : -1) * c.sx * (1 + c.jit[k * 3]), w = (k & 2 ? 1 : -1) * c.sw * (1 + c.jit[k * 3 + 1]), y = (k & 4 ? 1 : -1) * c.sy * (1 + c.jit[k * 3 + 2]);
      // tilted at all angles: three turns, one about each axis
      const X = x * c1 - w * s1, W = x * s1 + w * c1, X2 = X * c2 - y * s2, Y2 = X * s2 + y * c2, W3 = W * c3 - Y2 * s3, Y3 = W * s3 + Y2 * c3;
      C.push([c.x + X2, c.w + W3, c.y + Y3]);
    }
    for (const f of F) {
      const a = C[f[0]], b = C[f[1]], d = C[f[3]], e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const len = Math.hypot(n[0], n[1], n[2]) || 1, mid = [(a[0] + C[f[2]][0]) / 2 - c.x, (a[1] + C[f[2]][1]) / 2 - c.w, (a[2] + C[f[2]][2]) / 2 - c.y];
      const sg = n[0] * mid[0] + n[1] * mid[1] + n[2] * mid[2] < 0 ? -1 : 1;
      n = [sg * n[0] / len, sg * n[1] / len, sg * n[2] / len];
      const first = g.n;
      for (const k of f) {
        const p = C[k];
        g.a.position.data.push(o.hinge.x + o.inw.x * p[0] + o.upn.x * p[2] + o.tan.x * p[1], o.hinge.y + o.inw.y * p[0] + o.upn.y * p[2] + o.tan.y * p[1], o.hinge.z + o.inw.z * p[0] + o.upn.z * p[2] + o.tan.z * p[1]);
        g.a.normal.data.push(n[0], n[1], n[2]);
        g.a.aLoc.data.push(p[0], p[1], p[2]);
        g.a.aHinge.data.push(o.hinge.x, o.hinge.y, o.hinge.z);
        g.a.aInw.data.push(o.inw.x, o.inw.y, o.inw.z);
        g.a.aTan.data.push(o.tan.x, o.tan.y, o.tan.z);
        g.a.aUpn.data.push(o.upn.x, o.upn.y, o.upn.z);
        g.a.aTurn.data.push(0, 0, o.phase, 2);
        g.a.aTint.data.push(o.seed, o.bed + c.tint);
        g.n++;
      }
      g.index.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  }
}

// a number in [a, b] at least gap from the neighbour before it, by ONE draw u: the two stretches the neighbour
// leaves free, laid end to end
const apart = (u, a, b, prev, gap) => {
  if (prev === null) return a + u * (b - a);
  const lo = Math.max(0, prev - gap - a), hi = Math.max(0, b - prev - gap), x = u * (lo + hi);
  return x < lo ? a + x : prev + gap + (x - lo);
};

// The gates' plan, drawn from the canyon's own fork: also what the world needs to cut the hollows.
// ONE SLAB A GATE, and the plan deals nothing else: its hinge side, its length, its closed lean, its breadth, its
// thickness at the foot, how far it lies back when open, the skew of its joint.
function planGates(E) {
  const rng = E.rng('led-canyon-plan'), gates = [], start = rng() * GATE.cycle;
  let L0 = null, a0 = null;
  for (let k = 0; k < E.places.gates.length; k++) {
    // every slab is hinged on the west side: the face it turns to the line then takes the east's glow
    const s = E.places.gates[k], side = -1;
    // the length is dealt between 16 and 30 m and the closed lean between 33 and 50 degrees, each at least 3 m and
    // 4 degrees from the neighbour before it
    const L = apart(rng(), 16, 30, L0, 3), lean = apart(rng(), 33, 50, a0, 4);
    L0 = L; a0 = lean;
    gates.push({
      s, k, side, L, lean: lean * Math.PI / 180,
      // the hinge lies 19.4 to 20.4 m from the line at every gate: one rule for all eight
      d: rng.range(19.4, 20.4),
      // BROAD: at its foot 0.55 to 0.8 of its length across; THICK: at its foot 0.16 to 0.22 of its length, 4 m at
      // the least and 6.5 m at the most
      W: L * rng.range(0.55, 0.8),
      tFoot: clamp(L * rng.range(0.16, 0.22), 4, 6.5), back: rng.range(38, 50) * Math.PI / 180,
      // the joint the slab hinges on runs well askew of the line (36 to 44 degrees), turned so that the slab's
      // underside faces down the canyon
      yaw: -side * rng.range(0.63, 0.77),
      phase: start - k * GATE.step,
    });
  }
  return gates;
}

// For the world, before the land is meshed: one hollow per gate, THE SLAB'S OWN BED: from its hinge toward the line
// over the slab's own length and breadth, askew as its joint, as deep as the slab is thick at its foot (4 m at most).
// d is signed, right of the line positive.
export function gateHollows(ctx) {
  const E = { places: PLACES.real, rng: (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)) };
  return planGates(E).map((q) => ({
    s: q.s, d0: q.side < 0 ? -q.d + 0.6 : q.d - q.L, d1: q.side < 0 ? -q.d + q.L : q.d - 0.6,
    halfS: q.W / 2 + 0.3, depth: Math.min(4, q.tFoot), yaw: q.yaw,
  }));
}

// The clear air the slabs keep from the line BY GEOMETRY at their nearest (closed): the crew's law is 2.6 m.
// (The design file's 9 m cannot be kept together with a slab that leans over the way at under 40 degrees from a
// hinge 16 to 17 m out and 6 m under the line: at 37 degrees its lower face passes about 4.4 m from the line.)
const CLEAR_GATE = 3.6;

async function buildCanyon(E, group) {
  const plan = planGates(E);
  const g = gather({ position: 3, normal: 3, aLoc: 3, aHinge: 3, aInw: 3, aTan: 3, aUpn: 3, aTurn: 4, aTint: 2 });
  const gates = [];
  // how far back a slab may lie before its back meets the land (the walls are the world's)
  const layBack = async (hinge, inw, upn, L, thick, want, ax, W) => {
    let ok = 1.2, any = false, turns = 0;
    for (let a = 1.2; a <= Math.PI / 2 + want + 1e-6; a += 0.05) {
      let free = true;
      const ca = Math.cos(a), sa = Math.sin(a);
      // the slab's back, across its whole width (the joint runs askew of the walls)
      for (let l = 6; l <= L && free; l += 4) for (const k of [-0.46, 0, 0.46]) {
        const x = l * ca - thick * sa, y = l * sa + thick * ca, w = W * k;
        const px = hinge.x + inw.x * x + upn.x * y + ax.x * w, py = hinge.y + inw.y * x + upn.y * y + ax.y * w, pz = hinge.z + inw.z * x + upn.z * y + ax.z * w;
        if (E.groundAt(px, pz, -1e9) > py - 0.4) { free = false; break; }
      }
      if ((++turns % 3) === 0) await E.yield();
      if (!free) { if (any) break; continue; }
      ok = a; any = true;
    }
    return ok;
  };
  for (const q of plan) {
    const F = E.triad(q.s), floor0 = F.p.y - 6;
    // the gate's own triad: ax along the joint the slab hinges on (askew of the line), cr across it
    const ax = F.t.clone().multiplyScalar(Math.cos(q.yaw)).addScaledVector(F.right, Math.sin(q.yaw)).normalize();
    const cr = F.right.clone().multiplyScalar(Math.cos(q.yaw)).addScaledVector(F.t, -Math.sin(q.yaw)).normalize();
    const hingeAt = (lat) => {
      const x = F.p.x + cr.x * lat, z = F.p.z + cr.z * lat;
      return new THREE.Vector3(x, E.groundAt(x, z, floor0) - 0.3, z);
    };
    const hL = hingeAt(q.side * q.d), inwL = cr.clone().multiplyScalar(-q.side);
    const yL = hL.clone().sub(F.p).dot(F.n), dL = Math.abs(hL.clone().sub(F.p).dot(cr)), L = q.L;
    // CLEAR AIR BY GEOMETRY: the nearest approach of a slab's line-ward face, at lean a, to the line near the gate
    const eyes = [];
    for (let d = -26; d <= 26; d += 0.75) eyes.push(E.line(q.s + d).p);
    const nearest = (hinge, inw, len, W, a, ev = eyes) => {
      let best = 1e9;
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let l = 0; l <= len; l += 1.5) for (let k = -6; k <= 6; k++) {
        // the envelope every slab's outline lies inside: half the breadth at the hinge, narrowing to the head by the
        // least dealt taper (0.42 of it)
        const w = (k / 6) * W * 0.5 * (1 - 0.42 * clamp(l / len, 0, 1));
        const px = hinge.x + (inw.x * ca + F.n.x * sa) * l + ax.x * w, py = hinge.y + (inw.y * ca + F.n.y * sa) * l + ax.y * w, pz = hinge.z + (inw.z * ca + F.n.z * sa) * l + ax.z * w;
        for (const e of ev) { const d = Math.hypot(px - e.x, py - e.y, pz - e.z); if (d < best) best = d; }
      }
      return best;
    };
    // closed, the slab stands at its dealt lean, raised only as far as keeps CLEAR_GATE of air from the line
    let th = Math.max(q.lean, Math.asin(Math.min(1, CLEAR_GATE / Math.hypot(dL, yL))) + Math.atan2(-yL, dL));
    for (let i = 0; i < 60; i++) {
      if (nearest(hL, inwL, L, q.W, th) >= CLEAR_GATE) break;
      th += 0.012;
      if (i & 1) await E.yield();
    }
    await E.yield();
    const openL = await layBack(hL, inwL, F.n, L, q.tFoot, q.back, ax, q.W);
    // the open pose is counted as well, on a longer piece of the line (a slab laid far back reaches farther)
    const far = [];
    for (let d = -72; d <= 72; d += 1.5) far.push(E.line(Math.max(0, q.s + d)).p);
    const clearOpenLong = nearest(hL, inwL, L, q.W, openL, far);
    await E.yield();
    // each slab deals its form from a stream of its own; its foot is bedded 3 m under the hinge
    const fr = E.rng('led-canyon-slab' + q.k), seed = fr(), bed = fr();
    const form = pushSlab(g, { tan: ax, upn: F.n, root: 3, kind: 0, phase: q.phase, pose: Math.PI / 2, rng: fr, hinge: hL, inw: inwL, L, W: q.W, tFoot: q.tFoot, aC: th, aO: openL, seed, bed });
    await E.yield();
    // RUBBLE at the foot, each gate's from a stream of its own
    const rb = E.rng('led-canyon-rubble' + q.k), chunks = [];
    // (a tumbled heap in the hollow before the hinge, spilling round the foot's two ends: unequal broken pieces 0.3 to
    // 2 m across, most of them small, tilted at all angles, half buried, densest at the hinge; every piece lies under
    // the plane of the leaning face (0.55 m of height a metre out, less its own reach), so none stands out of the slab)
    for (let c = 0, n = Math.round(q.W * 2.2); c < n; c++) {
      const u = rb(), size = 0.15 + 0.85 * u * u * u, x = 0.35 + 5.2 * Math.pow(rb(), 1.7), w = rb.range(-1, 1) * (q.W * 0.5 + 1.2);
      const sx = size * rb.range(0.7, 1.3), sw = size * rb.range(0.6, 1.2), sy = size * rb.range(0.35, 0.8), rot = [rb() * TAU, rb() * TAU, rb() * TAU], lift = rb.range(-0.5, 0.5), tint = rb(), jit = [];
      for (let k = 0; k < 24; k++) jit.push(rb.range(-0.45, 0.45));
      const gx = hL.x + inwL.x * x + ax.x * w, gz = hL.z + inwL.z * x + ax.z * w, gy = E.groundAt(gx, gz, hL.y);
      const reach = Math.hypot(sx, sw, sy) * 1.45, y0 = (gy - hL.y - inwL.y * x - ax.y * w) / Math.max(F.n.y, 0.5);
      chunks.push({ x, w, y: Math.min(y0 + lift * size, 0.55 * x - reach), sx, sw, sy, rot, jit, tint });
    }
    pushRubble(g, { tan: ax, upn: F.n, hinge: hL, inw: inwL, phase: q.phase, seed, bed, chunks });
    gates.push({ s: q.s, th, L, openL, dL, yL, yaw: q.yaw, P: F.p.clone(), ax, cr, up: F.n.clone(), hL, inwL, wL: q.W, phase: q.phase, clearLong: nearest(hL, inwL, L, q.W, th), clearOpenLong, tL: q.tFoot, dealt: q.lean, ...form });
  }
  await E.yield();
  const geo = finish(g);
  geo.boundingSphere.radius += 40;
  await E.yield();
  const hf = THREE.DataUtils.toHalfFloat;
  const blank = new THREE.DataTexture(new Uint16Array([hf(0), hf(0), hf(-60000), hf(1)]), 1, 1, THREE.RGBAFormat, THREE.HalfFloatType);
  blank.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...E.U, tSunTop: { value: E.sunTop ? E.sunTop.texture : blank }, uSunBox: { value: E.sunTop ? E.sunTop.box : new THREE.Vector4(0, 0, 1, 1) } },
    vertexShader: /* glsl */`
      uniform float uTime;
      attribute vec3 aLoc, aHinge, aInw, aTan, aUpn; attribute vec4 aTurn; attribute vec2 aTint;
      varying vec3 vLoc, vN, vW; varying vec2 vTint; varying float vKind, vFace, vSide;
      float gateShut(float tau){ return smoothstep(0., ${GATE.close.toFixed(2)}, tau)*(1.-smoothstep(${(GATE.close + GATE.stand).toFixed(2)}, ${(GATE.close + GATE.stand + GATE.open).toFixed(2)}, tau)); }
      float plateUp(float tau){ return smoothstep(0., 2.6, tau)*(1.-smoothstep(3.4, 8., tau)); }
      void main(){
        float tau = mod(uTime + aTurn.z, ${GATE.cycle.toFixed(1)});
        float c = aTurn.w > .5 ? plateUp(tau) : gateShut(tau);
        float ang = mix(aTurn.y, aTurn.x, c), ca = cos(ang), sa = sin(ang);
        vec3 p = aHinge + aInw*(aLoc.x*ca - aLoc.z*sa) + aUpn*(aLoc.x*sa + aLoc.z*ca) + aTan*aLoc.y;
        vec3 n = aInw*(normal.x*ca - normal.z*sa) + aUpn*(normal.x*sa + normal.z*ca) + aTan*normal.y;
        vLoc = aLoc; vTint = aTint; vKind = aTurn.w; vFace = abs(normal.z); vSide = normal.z;
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*n);
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: fx.GLSL_NOISE + LIGHT_PARS + ROCK_LIGHT + /* glsl */`
      varying vec3 vLoc, vN, vW; varying vec2 vTint; varying float vKind, vFace, vSide;
      void main(){
        vec3 n = normalize(vN);
        // the canyon's own beds: on a slab's edges the strata show one over another with dark seams; a broad face
        // shows the two or three beds that have broken off it, each in its own tone (no net of joints is drawn on it)
        float nA = vnoise(vec3(vLoc.xy*.55, vLoc.z*.9 + vTint.x*31.)), nB = vnoise(vec3(vLoc.xy*.13, vTint.x*17.)), nC = vnoise(vLoc*2.3);
        float rub = step(1.5, vKind), face = max(smoothstep(.5, .9, vFace), rub);
        // on the edges the beds lie one over another in fine level stripes; a broad face shows the beds that have broken
        // off it, each in its own tone (the face toward the line starts from one bed, the back from another)
        float bc = mix((vLoc.z + .12*nB)/.45, vSide > 0. ? 7.5 : .5, face) + floor(vTint.y*23.);
        float bi = floor(bc), bf = bc - bi, hsh = hash11(bi*7.13 + 3.), hs2 = hash11(floor(bc/5.)*3.7 + 1.);
        hsh = mix(hsh, .05 + .95*hsh, face);
        vec3 bed = mix(vec3(.479, .138, .045), vec3(.658, .323, .102), smoothstep(.25, .45, hsh));
        bed = mix(bed, vec3(.807, .624, .352), smoothstep(.62, .8, hsh));
        bed = mix(bed, bed*vec3(.8, .62, .6), hs2*.5*(1.-.4*face));
        // no pale line along a slab's edge: there the beds lean two thirds of the way toward the broad face's own bed and stand darker
        float hF = .05 + .95*hash11(floor(vTint.y*23.)*7.13 + 3.);
        vec3 bedF = mix(mix(vec3(.479, .138, .045), vec3(.658, .323, .102), smoothstep(.25, .45, hF)), vec3(.807, .624, .352), smoothstep(.62, .8, hF));
        bed = mix(bed, bedF*.76, .66*(1. - face));
        float seam = mix(smoothstep(0., .1, bf)*(1.-smoothstep(.9, 1., bf)), .3 + .7*smoothstep(0., .07, bf)*(1.-smoothstep(.93, 1., bf)), face);
        // a broad face's tone: soft stains that run down the face (long streaks along its length, stronger and damp
        // toward the foot). Nothing on a broad face can close into a ring: no pit, no crack, no round patch
        float damp = 1. - smoothstep(-1., 9., vLoc.x);
        if (rub > .5) {
          float nM = vnoise(vec3(vLoc.xy*.31, vTint.x*41.)), nM2 = vnoise(vec3(vLoc.xy*.21 + 9., vTint.x*13.));
          bed = mix(bed, bed*vec3(.7, .6, .6), smoothstep(.42, .66, nM2));
          bed *= (.55+.45*seam)*(.8+.4*nA)*(.86+.28*nC)*(.66+.6*nB)*(.66+.62*nM)*(1. - .42*damp);
        } else {
          float sA = vnoise(vec3(vLoc.x*.05, vLoc.y*.34 + (vSide > 0. ? 3. : 0.), vTint.x*41.)), sB = vnoise(vec3(vLoc.x*.08 + 9., vLoc.y*.95, vTint.x*13.));
          float stain = smoothstep(.36, .7, sA*.62 + sB*.38);
          bed = mix(bed, bed*vec3(.62, .55, .57), face*stain*(.7 + .3*damp));
          bed *= (.55+.45*seam)*mix(.8+.4*nA, .9+.2*nA, face)*(.86+.28*nC)*mix(1., (.66+.6*nB)*(1. - .42*damp), face);
        }
        bed = mix(bed, bed*vec3(.86, .9, 1.), face*damp*.6);
        // CLOSE RANGE: thin sharp strata lines and pits, crisp. Each fades by its own footprint on the
        // screen, as a mip does: it is gone where one pixel covers a good part of the pattern's own step
        float fpx = fwidth(vLoc.x) + fwidth(vLoc.y) + fwidth(vLoc.z);
        float sc2 = vLoc.z*3.3 + vTint.x*5.;
        float sh2 = hash11(floor(sc2)*1.7 + 2.);
        float thin = (1. - smoothstep(.06, .06 + 1.5*fwidth(sc2), abs(fract(sc2) - .5)))*step(.3, sh2)*(.45 + .55*sh2)*(1. - smoothstep(.2, .55, fwidth(sc2)))*(1. - face);
        // (pits on the edges only: a broad face and the rubble carry no pit, no crack and no closed mark of any kind)
        float pn = vnoise(vec3(vLoc.xy*4.2, vLoc.z*4.2 + vTint.x*9.)), pw = fwidth(pn) + 1e-4;
        float pit = smoothstep(.73 - pw, .73 + pw, pn)*(1. - smoothstep(.15, .45, fpx*4.2))*(1. - face);
        bed *= 1. - clamp(.42*thin + .34*pit, 0., .75);
        float top = texture2D(tSunTop, (vW.xz - uSunBox.xy)*uSunBox.zw).b;
        float sunK = sunAt(vW.y)*smoothstep(-1.5, 3., vW.y - top);
        float ao = mix(.78, 1., face)*(.75+.25*seam);
        vec3 col = bed*(rockLight(vW, n, ao, sunK) + dawnRose(vW, n)) + uRSky*(.045+.04*n.y)*ao;
        col = fogged(col, distance(vW, cameraPosition));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  // DUST: low soft puffs in the rock's own tan, rolling along the floor behind a slab's foot while it swings
  const drng = E.rng('led-canyon-dust'), dust = [], dcol = [0.58, 0.39, 0.29];
  const nd = Math.max(6, Math.round(18 * E.detail));
  for (const G of gates) {
    for (const [H, inw, W] of [[G.hL, G.inwL, G.wL]]) for (const win of [[0.3, GATE.close - 0.2], [GATE.close + GATE.stand + 0.1, GATE.close + GATE.stand + GATE.open - 0.2]]) {
      for (let k = 0; k < nd; k++) {
        const a = drng.range(-0.5, 0.5) * W, b = drng.range(-2.6, -0.6), out = drng.range(0.3, 1.5), sl = drng.range(-0.5, 0.5);
        dust.push({
          p: [H.x + G.ax.x * a + inw.x * b, H.y + 1, H.z + G.ax.z * a + inw.z * b],
          v: [-inw.x * out + G.ax.x * sl, drng.range(0.1, 0.45), -inw.z * out + G.ax.z * sl], life: drng.range(3, 5), phase: drng(),
          s0: drng.range(0.8, 1.2), s1: drng.range(2, 3.2), kind: 4, seed: drng(), alpha: 0.2, col: dcol, gate: [win[0], win[1], -1, G.phase],
        });
      }
    }
  }
  await E.yield();
  const dustPuffs = await makePuffs(E, E.U, dust, 5);
  group.add(dustPuffs.mesh);
  E.gates = gates;
  E.note.canyon = gates.map((q) => ({ s: q.s, clearLong: +q.clearLong.toFixed(2), clearOpenLong: +q.clearOpenLong.toFixed(2), thickLong: +q.tL.toFixed(2), long: +q.L.toFixed(1), leanLong: +(q.th * 180 / Math.PI).toFixed(1), openLong: +(q.openL * 180 / Math.PI).toFixed(1), yaw: +(q.yaw * 180 / Math.PI).toFixed(1), raised: +((q.th - q.dealt) * 180 / Math.PI).toFixed(1), wide: +q.wide.toFixed(3), head: +q.head.toFixed(2) }));
  return { triangles: g.index.length / 3 + dustPuffs.triangles, calls: 2 };
}
// THE CRATER: five arches of fire over the line, each a broad torn band raised out of a lava fountain.
async function buildCrater(E, group) {
  const rng = E.rng('led-crater');
  const g = gather({ position: 3, normal: 3, uv: 2, aMet: 2, aArch: 4 });
  // a foot stands on the lake: where the wanted distance would leave the lake's disc it is drawn in
  const footLat = (F, sign, want) => {
    let d = want;
    if (E.lake) {
      for (; d > 20; d -= 1) {
        const x = F.p.x + F.right.x * sign * d - E.lake.x, z = F.p.z + F.right.z * sign * d - E.lake.z;
        if (Math.hypot(x, z) < E.lake.r - 8) break;
      }
    }
    return d;
  };
  const arches = [];
  for (let i = 0; i < E.places.fire.length; i++) {
    const F = E.triad(E.places.fire[i]);
    const side = rng.sign(), wantA = rng.range(38, 44), wantB = rng.range(38, 44);
    const dA = footLat(F, side, wantA), dB = footLat(F, -side, wantB);
    const apex = Math.max(E.lakeY + rng.range(31, 38), F.p.y + 17.5), y0 = E.lakeY - 0.5, H = apex - y0;
    // the band leans about 50 degrees out of the level, its low edge toward the coming eye: 5 to 6 m along the
    // way, and as broad again seen from along the line; its far, upper edge is the torn one
    const hw = rng.range(3.4, 4), seed = rng(), ph = rng.range(0, TAU);
    const A = archOver(F, side, dA, dB, y0, H, (u) => 0.9 - 0.15 * Math.pow(Math.abs(2 * u - 1), 2));
    const half = (u) => hw * (0.9 + 0.45 * Math.pow(Math.abs(2 * u - 1), 2.2));
    const nu = Math.round(88 * (0.6 + 0.4 * E.detail));
    sweepBand(g, {
      nu, nv: 10, point: A.point, across: A.across, out: A.out, half, cup: () => 0.12,
      extra: (gg) => gg.a.aArch.data.push(seed, ph, hw, i),
    });
    // the crest of tongues that tear off the band's far, upper edge: it stands square to the line
    const crest = rng.range(3.2, 4.4);
    sweepBand(g, {
      nu, nv: 5, point: (u) => { const c = A.point(u), ac = A.across(u); c.addScaledVector(ac, half(u) * 0.55); c.y += crest; return c; },
      across: () => new THREE.Vector3(0, 1, 0), half: () => crest,
      extra: (gg) => gg.a.aArch.data.push(seed + 2, ph, hw, i),
    });
    arches.push({ F, side, dA, dB, y0, H, seed, ph, hw, A, half });
    await E.yield();
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...E.U }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      uniform float uTime; attribute vec2 aMet; attribute vec4 aArch;
      varying vec2 vUv, vMet; varying vec4 vArch; varying vec3 vW;
      void main(){
        vUv = uv; vMet = aMet; vArch = aArch;
        vec3 p = position + normal*(sin(aMet.x*.4 - uTime*3.1 + aArch.x*50.)*.5 + sin(aMet.x*.17 + uTime*1.3 + aArch.x*20.)*.6);
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: NOISE + LIGHT_PARS + /* glsl */`
      varying vec2 vUv, vMet; varying vec4 vArch; varying vec3 vW;
      void main(){
        float u = clamp(vUv.x, 0., 1.), v = clamp(vUv.y, -1., 1.), e = 1.-abs(v);
        float hung = step(1.5, vArch.x), sd = fract(vArch.x);
        if (hung > .5) {
          // the crest: tongues that rise, tear and go out in dark smoke
          float cv = v*.5+.5;
          float f1 = fbm(vec2(vMet.x*.3 - uTime*.8 + sd*40., cv*1.5 - uTime*1.5));
          float f2 = fbm(vec2(vMet.x*1. - uTime*1.6 + sd*70., cv*3. - uTime*3.));
          float sw = .8 + .2*sin(uTime*.4586 + vArch.y);
          float tongue = (f1*.8 + f2*.42)*sw - cv*(.78 + .5*f1) + .1;
          float tw = clamp(fwidth(tongue)*1.5, .004, .11);
          float ca = max(smoothstep(.1 - tw, .1 + tw, tongue), smoothstep(0., .1, tongue)*.25)*smoothstep(0., .025, u)*smoothstep(0., .04, 1.-u)*smoothstep(0., .14, cv)*(1.-smoothstep(.9, 1., cv));
          float ch = clamp(tongue*1.7 + (1.-cv)*.2, 0., 1.)*.8;
          vec3 cc = mix(vec3(.195, .007, .002), vec3(1., .068, .01), smoothstep(.08, .34, ch));
          cc = mix(cc, vec3(1., .254, .023), smoothstep(.34, .72, ch));
          cc *= .7 + .7*ch;
          float sm = (1.-smoothstep(.05, .22, ch))*ca;
          cc = mix(cc, vec3(.035, .022, .028), sm*.85);
          cc = fogged(cc, distance(vW, cameraPosition)*.5);
          gl_FragColor = vec4(cc*ca, ca*mix(.9, .65, sm));
          return;
        }
        // fire runs along the band from the fountain to the far foot; tongues tear off its far, upper edge
        float flow = vMet.x*.2 - uTime*2.5, vv = v*.5+.5;
        float t1 = fbm(vec2(flow*1.2, vMet.y*.3 - uTime*1.1) + vArch.x*31.);
        float t2 = fbm(vec2(flow*3. + 7., vMet.y*.75 - uTime*2.1) + vArch.x*53.);
        float t3 = fbm(vec2(flow*.5, vMet.y*.2 - uTime*.5) + vArch.x*7.);
        // each band swells and thins on a slow clock of its own and never goes out
        float swell = .8 + .2*sin(uTime*.4586 + vArch.y);
        float ends = smoothstep(0., .025, u)*smoothstep(0., .04, 1.-u);
        float reach = (.6 + .5*t1)*swell;
        float env = smoothstep(0., 1., vv/(.06 + .34*t2*t1))*(1.-smoothstep(reach*.55, min(reach + .12, .97), vv));
        // CRISP WHERE A PIXEL IS SMALL: the body's edge is as sharp as its own footprint allows; outside it a narrow soft glow
        float ex = env*(1. + (t2-.5)*.6), ew = clamp(fwidth(ex)*1.5, .004, .1);
        float a = max(smoothstep(.16 - ew, .16 + ew, ex), smoothstep(.03, .16, ex)*.28)*ends;
        // a pale thread at the core, an orange body, deep red frayed edges, dark smoke at the fringe
        float cd = (vv - .27)/.19, core = exp(-cd*cd);
        float heat = clamp((.3 + .7*core + (t2-.5)*.55 + (t3-.5)*.3)*env, 0., 1.);
        vec3 col = mix(vec3(.195, .007, .002), vec3(1., .068, .01), smoothstep(.1, .34, heat));
        col = mix(col, vec3(1., .254, .023), smoothstep(.34, .7, heat));
        float hw = clamp(fwidth(heat)*1.5, .004, .07);
        col = mix(col, vec3(1., .72, .3), smoothstep(.9 - hw, .9 + hw, heat));
        col *= .7 + .75*heat;
        float smoke = (1.-smoothstep(.06, .24, heat))*a;
        col = mix(col, vec3(.035, .022, .028), smoke*.85);
        col = fogged(col, distance(vW, cameraPosition)*.5);
        float keep = mix(.95, .7, smoke);
        gl_FragColor = vec4(col*a, a*keep);
      }`,
  });
  const mesh = new THREE.Mesh(finish(g), mat);
  mesh.renderOrder = 3;
  group.add(mesh);
  E.fireArches = arches;
  await E.yield();
  // the lava fountain under each rising foot, the splash of spatter at the far foot, sparks off the band, embers
  // over the whole lake, far vents
  const list = [], prng = E.rng('led-crater-spatter'), dens = 0.5 + 0.5 * E.detail, G = 9.8, hot = [1, 1, 1];
  // every place is dealt first, from a stream of its own, before any loop whose count hangs on the detail
  const vr = E.rng('led-crater-vents'), ventLat = E.places.vents.map(() => (E.demo ? 50 : vr.range(34, 60)));
  // the line over the lake, for keeping what rises or falls off it by place
  const over = [];
  for (let sv = E.places.fire[0] - 60; sv <= E.places.fire[4] + 60; sv += 3) over.push(E.line(sv).p);
  const byLine = (x, z, m) => { for (const q of over) if (Math.hypot(x - q.x, z - q.z) < m) return true; return false; };
  const spatter = (f, n, v0, v1, spread, size) => {
    for (let k = 0; k < Math.round(n * dens); k++) {
      const vy = prng.range(v0, v1);
      list.push({ p: [f.x + prng.range(-2, 2), E.lakeY + 0.3, f.z + prng.range(-2, 2)], v: [prng.range(-spread, spread), vy, prng.range(-spread, spread)], life: 2 * vy / G, phase: prng(), s0: size * prng.range(0.8, 1.3), s1: size * 0.45, kind: 2, grav: G, seed: prng(), alpha: 1, col: hot });
    }
  };
  for (const a of arches) {
    spatter(a.A.point(0.01), 70, 12.5, 17.7, 3.2, 1.9);
    spatter(a.A.point(0.99), 34, 5, 9.5, 4.5, 1.3);
    for (let k = 0; k < Math.round(44 * dens); k++) {
      const u0 = prng.range(0.04, 0.3), u = (k & 1) ? 1 - u0 : u0, c = a.A.point(u), fall = Math.max(2, c.y - E.lakeY), heavy = Math.abs(2 * u - 1) > 0.7;
      list.push({ p: [c.x + prng.range(-2, 2), c.y - 1, c.z + prng.range(-3, 3)], v: [prng.range(-1, 1), prng.range(-1, 1), prng.range(-1, 1)], life: Math.sqrt(2 * fall / (heavy ? G : 4)), phase: prng(), s0: heavy ? 0.9 : 0.3, s1: heavy ? 0.5 : 0.18, kind: heavy ? 2 : 3, grav: heavy ? G : 4, seed: prng(), alpha: 1, col: hot });
    }
  }
  // embers rise everywhere over the lake
  const lakeC = E.lake ? [E.lake.x, E.lake.z, E.lake.r - 6] : null, mid = E.triad((E.places.fire[0] + E.places.fire[4]) / 2);
  const er = E.rng('led-crater-embers');
  for (let k = 0; k < Math.round(520 * dens * E.density); k++) {
    const r = Math.sqrt(er()) * (lakeC ? lakeC[2] : 75), an = er() * TAU;
    const x = (lakeC ? lakeC[0] : mid.p.x) + Math.cos(an) * r, z = (lakeC ? lakeC[1] : mid.p.z) + Math.sin(an) * r, vy = er.range(2.5, 6);
    const em = { p: [x, E.lakeY + 0.5, z], v: [er.range(-0.8, 0.8), vy, er.range(-0.8, 0.8)], life: er.range(6, 11), phase: er(), s0: er.range(0.24, 0.42), s1: 0.14, kind: 3, grav: -0.2, seed: er(), alpha: 1, col: hot };
    if (!byLine(x, z, 15)) list.push(em);
  }
  // FARTHER OFF: low spattering vents
  const inLake = (F, lat) => {
    let d = lat;
    if (E.lake) for (; Math.abs(d) > 30; d -= Math.sign(d) * 2) {
      if (Math.hypot(F.p.x + F.right.x * d - E.lake.x, F.p.z + F.right.z * d - E.lake.z) < E.lake.r - 12) break;
    }
    return new THREE.Vector3(F.p.x + F.right.x * d, E.lakeY, F.p.z + F.right.z * d);
  };
  for (let i = 0; i < E.places.vents.length; i++) spatter(inLake(E.triad(E.places.vents[i]), ventLat[i]), 30, 4, 8.5, 3.5, 1.2);
  await E.yield();
  const puffs = await makePuffs(E, E.U, list, 7);
  group.add(puffs.mesh);
  return { triangles: g.index.length / 3 + puffs.triangles, calls: 2 };
}
// A ring of cloud: centre c, unit axes e1 and e2 of its plane, major radius R. Its girth is uneven round it (o.girth:
// thickest low on its lee side), its surface billowed by its own closed lattice (o.billow), its hole ragged: the billows
// reach into the hole by what room the body leaves there, and nothing of it stands nearer its own axis than o.clear.
function pushVapourRing(g, o) {
  const nu = o.nu, nv = o.nv, base = g.n, rng = o.rng, bil = o.billow, gi = o.girth, tf = o.tufts;
  const k1 = rng.int(3, 5), k2 = rng.int(6, 9), p1 = rng() * TAU, p2 = rng() * TAU, seed = rng();
  const axis = new THREE.Vector3().crossVectors(o.e1, o.e2).normalize();
  // billows: smooth noise on the ring's own closed lattice, in metres
  const bw = (a, b) => {
    const x = (a / TAU) * bil.na, y = (b / TAU) * bil.nb, x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const at = (i, j) => bil.lat[(((i % bil.na) + bil.na) % bil.na) * bil.nb + (((j % bil.nb) + bil.nb) % bil.nb)];
    return (lerp(lerp(at(x0, y0), at(x0 + 1, y0), sx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), sx), sy) - 0.5) * bil.deep;
  };
  // tufts: lesser lumps about 1.2 m across and up to 0.45 m high on a closed lattice of their own: the outline is
  // ragged by short tufts and lumps only (nothing trails or curls away from the body)
  const tw = (a, b) => {
    const x = (a / TAU) * tf.na, y = (b / TAU) * tf.nb, x0 = Math.floor(x), y0 = Math.floor(y);
    const ux = x - x0, uy = y - y0, sx = ux * ux * (3 - 2 * ux), sy = uy * uy * (3 - 2 * uy);
    const at = (i, j) => tf.lat[(((i % tf.na) + tf.na) % tf.na) * tf.nb + (((j % tf.nb) + tf.nb) % tf.nb)];
    return (lerp(lerp(at(x0, y0), at(x0 + 1, y0), sx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), sx), sy) - 0.5) * tf.deep;
  };
  // half the body's thickness round the ring: 2 to 3.75 m, one broad swell low on the lee side and two lesser waves
  const half = (a) => clamp(lerp(gi.thin, gi.thick, Math.pow(0.5 + 0.5 * Math.cos(a - gi.at), gi.pow)) * (1 + 0.13 * Math.sin(a * 2 + gi.p2) + 0.09 * Math.sin(a * 3 + gi.p3)), 2, 3.75);
  const ring = (a) => o.R + 0.15 * Math.sin(a * 2 + p2) + 0.1 * Math.sin(a * 5 + p1);
  // the surface's distance from the body's centre line; toward the hole the billows take the room the body leaves
  const surf = (a, b) => {
    const cb = Math.cos(b), rr = half(a), v = bw(a, b) / bil.deep + 0.5, inw = Math.max(0, -cb), w = inw * inw;
    let rb = rr * (1 + 0.016 * Math.sin(b * 2 + a * k2 + p1) + 0.01 * Math.sin(b * 3 - a * k1 * 2 + p2)) + (v - 0.5) * bil.deep * (1 - w) + w * Math.max(0, o.R - rr - o.clear) * v + tw(a, b);
    if (cb < 0 && ring(a) + cb * rb < o.clear) rb = (ring(a) - o.clear) / -cb;
    return rb;
  };
  for (let i = 0; i <= nu; i++) {
    const a = (i / nu) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    const rad = new THREE.Vector3(o.e1.x * ca + o.e2.x * sa, o.e1.y * ca + o.e2.y * sa, o.e1.z * ca + o.e2.z * sa);
    const rr = half(a), RR = ring(a);
    for (let j = 0; j <= nv; j++) {
      const b = (j / nv) * TAU, cb = Math.cos(b), sb = Math.sin(b);
      const nx = rad.x * cb + axis.x * sb, ny = rad.y * cb + axis.y * sb, nz = rad.z * cb + axis.z * sb;
      const rb = surf(a, b);
      g.a.position.data.push(o.c.x + rad.x * RR + nx * rb, o.c.y + rad.y * RR + ny * rb, o.c.z + rad.z * RR + nz * rb);
      // the normal leans with the surface's slope along both circles
      const da = (surf(a + 0.01, b) - surf(a - 0.01, b)) / (0.02 * (RR + rr * cb)), db = (surf(a, b + 0.03) - surf(a, b - 0.03)) / (0.06 * rr);
      const tax = -o.e1.x * sa + o.e2.x * ca, tay = -o.e1.y * sa + o.e2.y * ca, taz = -o.e1.z * sa + o.e2.z * ca;
      const tbx = -rad.x * sb + axis.x * cb, tby = -rad.y * sb + axis.y * cb, tbz = -rad.z * sb + axis.z * cb;
      let mx = nx - (da * tax + db * tbx), my = ny - (da * tay + db * tby), mz = nz - (da * taz + db * tbz);
      const ml = Math.hypot(mx, my, mz) || 1; mx /= ml; my /= ml; mz /= ml;
      g.a.normal.data.push(mx, my, mz);
      // the billow's height (0 in a crease, 1 on a crown) rides in uv.x
      g.a.uv.data.push(bw(a, b) / bil.deep + 0.5, j / nv);
      g.a.aRing.data.push(seed, o.R * a, rr, o.roll);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = base + i * (nv + 1) + j, b = a + nv + 1;
    g.index.push(a, b, a + 1, a + 1, b, b + 1);
  }
  g.n += (nu + 1) * (nv + 1);
}

// THE SUMMIT: two rings of rolling cloud threaded on the line where it turns, each uneven in girth (4 to 7.5 m
// through), billowed and tufted at build, its hole ragged, lumps on lumps travelling round its tube; six arcs of blossom across the line. The way out stands alone.
async function buildSummit(E, group) {
  const rng = E.rng('led-summit'), br = E.rng('led-summit-billows'), gs = E.rng('led-summit-girth'), ts = E.rng('led-summit-tufts');
  let triangles = 0, calls = 0;
  // the rings
  const gc = gather({ position: 3, normal: 3, uv: 2, aRing: 4 });
  for (let i = 0; i < E.places.rings.length; i++) {
    const F = E.triad(E.places.rings[i]);
    const nu = Math.round(128 * (0.6 + 0.4 * E.detail));
    // the ring rolls: its billows travel round the tube at a dealt 0.7 to 1.3 m a second; then its tufts' lattice of
    // 68 by 14 (about 1.2 m a lump), both from a stream of their own
    const roll = ts.range(0.7, 1.3), tl = [];
    for (let k = 0; k < 68 * 14; k++) tl.push(ts());
    const tufts = { lat: tl, na: 68, nb: 14, deep: 0.45 };
    // billows: the ring's own closed lattice of 27 by 8 lumps (2 to 4 m across), 1.1 to 1.7 m deep, from a stream of its own
    const lat = [], deep = br.range(1.1, 1.7);
    for (let k = 0; k < 27 * 8; k++) { const hi = br() < 0.5, t = br() * 0.25; lat.push(hi ? 1 - t : t); }
    const billow = { lat, na: 27, nb: 8, deep };
    // girth: half the body's thickness runs from 2 to 2.4 m at its thinnest to 3.3 to 3.75 m at its thickest, which lies
    // low on the ring to one side (the lee side, dealt); no two rings alike; from a stream of its own
    const girth = { thin: gs.range(2, 2.4), thick: gs.range(3.3, 3.75), at: -Math.PI / 2 + gs.sign() * gs.range(0.35, 0.8), pow: gs.range(0.8, 1.6), p2: gs() * TAU, p3: gs() * TAU };
    pushVapourRing(gc, { c: F.p, e1: F.right, e2: F.n, R: 13, clear: 8.6, nu, nv: 28, rng, billow, girth, tufts, roll });
    await E.yield();
  }
  // THE 6 M LAW, BY PLACE: the least distance of any ring's body from the line is noted
  let ringNear2 = 1e18;
  {
    const pts = [];
    for (let s = E.places.cleft[0] - 40; s <= E.places.stream[1]; s += 2) pts.push(E.line(s).p);
    // the rings' firm bodies against the line as well (the 6 m law): the least distance is noted
    const C = gc.a.position.data, ncx = C.length / 3;
    for (let i = 0; i < ncx; i++) {
      const x = C[i * 3], y = C[i * 3 + 1], z = C[i * 3 + 2];
      let d2 = 1e18;
      for (const q of pts) { const dx = x - q.x, dy = y - q.y, dz = z - q.z, dd = dx * dx + dy * dy + dz * dz; if (dd < d2) d2 = dd; }
      if (d2 < ringNear2) ringNear2 = d2;
      if ((i & 255) === 255) await E.yield();
    }
  }
  const ringShader = {
    vertexShader: /* glsl */`
      uniform float uTime; attribute vec4 aRing;
      varying vec3 vN, vW; varying vec2 vUv; varying vec4 vRing;
      void main(){
        vUv = uv; vRing = aRing;
        vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: NOISE + LIGHT_PARS + /* glsl */`
      varying vec3 vN, vW; varying vec2 vUv; varying vec4 vRing;
      // one lump: round on its crown, sharp in its crease
      float lump(vec3 p){ return 1. - abs(2.*vnoise(p) - 1.); }
      void main(){
        vec3 n = normalize(vN);
        // ROLLING CLOUD, FORM AT EVERY SCALE: lumps on lumps (about 3 m, 1.2 m and 0.5 m across) read at the point of
        // the body's own round, which turns about the tube on the ring's clock from the ring's dealt start (it rolls).
        // Each scale gives its mean where a lump is finer than its own footprint on the screen (fine detail only).
        float a = vRing.y/13., rr = max(vRing.z, 1.);
        // (one turning speed for the whole ring, the dealt speed at a tube of 3 m: the lumps are never wound up)
        float b = vUv.y*6.2832 - (uTime*vRing.w + vRing.x*40.)/3.;
        vec3 q = vec3(cos(a)*(13. + rr*cos(b)), sin(a)*(13. + rr*cos(b)), rr*sin(b)) + vRing.x*57.;
        float fw = length(fwidth(q));
        float w1 = 1. - smoothstep(.25, .7, fw/3.), w2 = 1. - smoothstep(.25, .7, fw/1.2), w3 = 1. - smoothstep(.25, .7, fw/.5);
        float h1 = lump(q/3.), h2 = lump(q/1.2 + 7.), h3 = lump(q/.5 + 19.);
        float H = .55*(h1 - .5)*w1 + .3*(h2 - .5)*w2 + .12*(h3 - .5)*w3;
        // the surface's normal leans with the lumps' own slope (the height's gradient along the surface, in metres)
        vec3 dpx = dFdx(vW), dpy = dFdy(vW), r1 = cross(dpy, n), r2 = cross(n, dpx);
        float det = dot(dpx, r1);
        vec3 nb = normalize(abs(det)*n - sign(det)*(dFdx(H)*r1 + dFdy(H)*r2));
        // LIGHT: the sun's direction and the surface's own normal, nothing of the eye. Each lump is warm white on its
        // sun side and blue-violet in its creases, deeper in the deep hollows; the lit side passes into the shaded one
        // over a good part of a lump's round; no rim is drawn; the brightest tone stays under white
        float sk = sunAt(vW.y), ds = dot(nb, uSunDir);
        float crease = smoothstep(.12, .62, vUv.x);
        float hollow = clamp(.5 + H/.6, 0., 1.)*mix(.55, 1., crease);
        float term = smoothstep(-.3, .5, ds + (h1 - .5)*.2);
        // the deep hollows of the lit side go toward the shade's blue-violet (no side of a ring stands as one tone)
        term *= mix(.7, 1., smoothstep(.15, .6, hollow));
        vec3 shade = mix(vec3(.17, .18, .4), vec3(.4, .43, .68), clamp(hollow*(.35 + .65*(nb.y*.5 + .5)), 0., 1.)) + uGlow*.05;
        vec3 lit = vec3(.76, .705, .63)*mix(.62, 1., hollow)*(.78 + .22*smoothstep(0., .9, ds));
        // the fine lumps light and shade the lit side where a pixel is finer than they are (their mean is kept)
        lit *= mix(1., .74 + .5*smoothstep(.25, .75, h2*.6 + h3*.4), w3);
        vec3 col = mix(shade, lit, term*sk);
        col = fogged(col, distance(vW, cameraPosition));
        gl_FragColor = vec4(min(col, vec3(.82)), 1.);
      }`,
  };
  // the rings are firm bodies of cloud: opaque everywhere, drawn with the solid things
  const coreMat = new THREE.ShaderMaterial({ uniforms: { ...E.UHigh }, ...ringShader });
  const core = new THREE.Mesh(finish(gc), coreMat);
  group.add(core);
  triangles += gc.index.length / 3; calls += 1;
  await E.yield();
  // the arcs of blossom: a foot on a pillar to either side where the world gives pillars
  const ga = gather({ position: 3, normal: 3, uv: 2, aMet: 2, aArch: 4 }), arcList = [];
  let onTrees = 0;
  const ar = E.rng('led-summit-arcs');
  const gustA = Array.from({ length: 6 }, () => new THREE.Vector4()), gustB = Array.from({ length: 6 }, () => new THREE.Vector4()), gustC = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 1));
  const gustU = { uGustA: { value: gustA }, uGustB: { value: gustB }, uGustC: { value: gustC } }, gustNote = [];
  const footOn = (F, sign) => {
    // the foot's three dealt numbers are drawn whichever footing is found
    const jy = ar.range(-6, 9), jl = ar.range(36, 50), jd = ar.range(6, 12);
    // first choice: the crown of one of the world's blossom trees on a pillar's ledge, near the line's own height
    let tree = null;
    if (E.ledges) for (const L of E.ledges) {
      if (!L || !Number.isFinite(L.x + L.y + L.z)) continue;
      const dx = L.x - F.p.x, dz = L.z - F.p.z, lat = dx * F.right.x + dz * F.right.z, along = dx * F.fwd.x + dz * F.fwd.z;
      if (lat * sign < 16 || L.y < F.p.y - 18 || L.y > F.p.y + 12) continue;
      const score = Math.hypot(lat, along * 1.6) + Math.abs(L.y - F.p.y) * 0.8;
      if (!tree || score < tree.score) tree = { L, score };
    }
    if (tree && tree.score < 150) { onTrees++; return new THREE.Vector3(tree.L.x, tree.L.y, tree.L.z); }
    let best = null;
    if (E.pillars) for (const P of E.pillars) {
      const dx = P.x - F.p.x, dz = P.z - F.p.z, lat = dx * F.right.x + dz * F.right.z, along = dx * F.fwd.x + dz * F.fwd.z;
      if (lat * sign < 16) continue;
      const score = Math.hypot(lat, along * 1.6);
      if (!best || score < best.score) best = { P, score };
    }
    if (best && best.score < 170) {
      const P = best.P, dx = F.p.x - P.x, dz = F.p.z - P.z, d = Math.hypot(dx, dz) || 1, r = (P.radius || 8) * 0.8;
      const lo = (P.foot ?? F.p.y - 30) + 10, hi = (P.top ?? F.p.y + 40) - 10;
      return new THREE.Vector3(P.x + dx / d * r, clamp(F.p.y + jy, lo, Math.max(lo, hi)), P.z + dz / d * r);
    }
    const lat = sign * jl;
    return new THREE.Vector3(F.p.x + F.right.x * lat, F.p.y - jd, F.p.z + F.right.z * lat);
  };
  for (let i = 0; i < E.places.arcs.length; i++) {
    const F = E.triad(E.places.arcs[i]);
    const side = ar.sign(), A = footOn(F, side), B = footOn(F, -side), seed = ar(), ph = ar() * TAU;
    const top = F.p.clone().addScaledVector(UP, ar.range(13.5, 17)).addScaledVector(F.fwd, ar.range(-3, 3));
    const C = top.clone().multiplyScalar(2).addScaledVector(A, -0.5).addScaledVector(B, -0.5);
    const point = (u) => new THREE.Vector3().addScaledVector(A, (1 - u) * (1 - u)).addScaledVector(C, 2 * u * (1 - u)).addScaledVector(B, u * u);
    const len = A.distanceTo(top) + top.distanceTo(B);
    // the arc's own length along its curve, and the place (metres along) of a point of it
    const lens = [0];
    for (let k = 1; k <= 64; k++) lens.push(lens[k - 1] + point(k / 64).distanceTo(point((k - 1) / 64)));
    const run = lens[64], sAt = (u) => { const f = clamp(u, 0, 1) * 64, k = Math.min(63, Math.floor(f)); return lerp(lens[k], lens[k + 1], f - k); };
    // GUSTS, NOT A RIBBON: three to five gusts (fewer on a short arc: a gust and the thin stretch after it take 23 m
    // at the least), each 15 to 30 m long, with thin stretches of 4 m and more between them, travelling along the
    // arc at a dealt 5.5 to 8 m a second from dealt starts. Every number is drawn for every arc.
    const want = ar.int(3, 5), gl = [0, 1, 2, 3, 4].map(() => ar.range(15, 30)), gw = [0, 1, 2, 3, 4].map(() => ar.range(0.5, 1.5)), g0 = ar(), gv = ar.range(5.5, 8);
    const ng = Math.max(1, Math.min(want, Math.floor(run / 23)));
    let sum = 0, ws = 0;
    for (let k = 0; k < ng; k++) { sum += gl[k]; ws += gw[k]; }
    const fit = Math.min(1, (run - 19 * ng) / Math.max(sum - 15 * ng, 1e-6));
    const gLen = gl.map((x) => 15 + (x - 15) * Math.max(0, fit));
    let used = 0;
    for (let k = 0; k < ng; k++) used += gLen[k];
    const free = Math.max(0, run - used - 4 * ng), cen = [0, 0, 0, 0, 0], hl = [0, 0, 0, 0, 0];
    let at = g0 * run;
    for (let k = 0; k < ng; k++) { hl[k] = gLen[k] / 2; at += hl[k]; cen[k] = at; at += hl[k] + 4 + free * gw[k] / ws; }
    if (i < 6) { gustA[i].set(cen[0], cen[1], cen[2], cen[3]); gustB[i].set(hl[0], hl[1], hl[2], hl[3]); gustC[i].set(cen[4], hl[4], gv, run); }
    gustNote.push({ gusts: ng, run: +run.toFixed(1), inGusts: +(used / run).toFixed(2) });
    for (const turn of [0, 1]) {
      const across = (u) => {
        const T = point(Math.min(1, u + 0.002)).sub(point(Math.max(0, u - 0.002))).normalize();
        const lev = new THREE.Vector3().crossVectors(T, UP).normalize();
        return turn ? new THREE.Vector3().crossVectors(lev, T).normalize() : lev;
      };
      // the band's sheet is 22 m broad; the blossom on it is 10 to 18 m broad (the shader's rule, in the arc's metres)
      sweepBand(ga, {
        nu: Math.round(clamp(len / 2.2, 40, 90)), nv: 4, point, across, half: () => 11,
        extra: (gg) => gg.a.aArch.data.push(seed + turn * 0.37, ph, len, i),
      });
    }
    arcList.push({ point, len, sAt, ph, i });
    await E.yield();
  }
  if (E.note) E.note.summit = { ringNearest: +Math.sqrt(ringNear2).toFixed(2), arcFeetOnTrees: onTrees, arcFeet: E.places.arcs.length * 2, gusts: gustNote };
  await E.yield();
  const arcMat = new THREE.ShaderMaterial({
    uniforms: { ...E.UHigh, ...gustU }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      uniform float uTime; attribute vec2 aMet; attribute vec4 aArch;
      varying vec2 vUv, vMet; varying vec4 vArch; varying vec3 vW;
      void main(){
        vUv = uv; vMet = aMet; vArch = aArch;
        vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: NOISE + LIGHT_PARS + GUSTS + /* glsl */`
      varying vec2 vUv, vMet; varying vec4 vArch; varying vec3 vW;
      void main(){
        float u = clamp(vUv.x, 0., 1.);
        // GUSTS, NOT A RIBBON: the blossom's density at this place: the arc's travelling gusts along it, and across it
        // a breadth of 10 to 18 m that changes along the arc, its edges ragged and soft; all in the arc's own metres
        int ia = int(vArch.w + .5);
        float xs = vMet.x - uGustC[ia].z*uTime;
        float br = mix(5., 9., smoothstep(.25, .75, fbm(vec2(xs*.05, vArch.x*13.))));
        float rag = fbm(vec2(xs*.22, vMet.y*.22) + vArch.x*31.);
        float dens = gustAt(ia, vMet.x, uTime)*(1. - smoothstep(.25, 1., abs(vMet.y)/br + (rag - .5)*.5));
        // petals: small bright cells running along the band, about one cell in eight at the densest (the flying
        // petals, which have depth, carry the blossom; the sheet is its mist)
        vec2 q = vec2(vMet.x - uTime*7., vMet.y)*2.6 + vArch.x*57.;
        vec2 id = floor(q), f = fract(q) - .5;
        float h = hash12(id), on = step(1. - .12*dens, h);
        float ang = h*31. + uTime*(1.5 + h*2.);
        vec2 r = vec2(f.x*cos(ang) - f.y*sin(ang), (f.x*sin(ang) + f.y*cos(ang))*(1.6 + sin(ang*1.7)));
        float petal = on*smoothstep(.34, .2, length(r));
        // finer than a pixel the petals give their mean, as a mip does (by the pattern's own footprint)
        float fine = 1. - smoothstep(.35, 1.1, max(fwidth(q.x), fwidth(q.y)));
        petal = mix(.12*dens*.16, petal, fine);
        float mott = fbm(vec2(vMet.x*.3 - uTime*1.4, vMet.y*.9) + vArch.x*9.);
        // THE BODY'S TRUE COVER, the same at every distance: the petals' own mean (0.12 of the cells, each 0.16
        // covered: 0.018 at the densest) and a mist of 0.014 to 0.044: about 0.06 at the most, nothing between gusts
        float haze = dens*(.014 + .03*mott);
        float ends = smoothstep(0., .04, u)*smoothstep(0., .04, 1.-u);
        float a = clamp(petal*.95 + haze, 0., 1.)*ends;
        float sun = sunAt(vW.y);
        vec3 pink = mix(vec3(1., .33, .5), vec3(1., .58, .72), fract(h*7.3));
        vec3 pc = mix(pink, vec3(1.), step(.72, fract(h*3.1))*.3);
        pc = mix(vec3(1., .5, .64), pc, fine);
        vec3 body = mix(vec3(1., .42, .58), vec3(1., .8, .86), mott);
        pc = mix(body, pc, clamp(petal/max(petal + haze, 1e-3), 0., 1.));
        vec3 col = pc*(mix(vec3(.42, .4, .62), vec3(1.05, .95, .86), sun))*.86;
        col = fogged(col, distance(vW, cameraPosition));
        gl_FragColor = vec4(col*a, a);
      }`,
  });
  const arcs = new THREE.Mesh(finish(ga), arcMat);
  arcs.renderOrder = 5;
  group.add(arcs);
  triangles += ga.index.length / 3; calls += 1;
  await E.yield();
  // THE PETALS: thousands of small flakes, pink to white, dense at each arc's core and loose at its edges, fanned
  // out where the arc leaves one pillar's trees and where it comes down on another's
  const list = [], prng = E.rng('led-summit-steam'), dens = 0.5 + 0.5 * E.detail, pr = E.rng('led-summit-petals');
  // A DRIFT HAS DEPTH: each arc's blossom is as deep as a dealt 0.5 to 0.8 of its breadth (own stream)
  const dr = E.rng('led-summit-drift');
  for (const arc of arcList) arc.deep = dr.range(0.5, 0.8);
  const petalCol = () => { const k = pr(); return pr() < 0.08 ? [1, 0.9, 0.92] : [0.96, lerp(0.323, 0.578, k), lerp(0.479, 0.716, k)]; };
  const flake = (c, T, off, speed, life, size, gate) => {
    list.push({ p: [c.x + off.x - T.x * speed * life * 0.5, c.y + off.y - T.y * speed * life * 0.5, c.z + off.z - T.z * speed * life * 0.5], v: [T.x * speed, T.y * speed, T.z * speed], life, phase: pr(), s0: size, s1: size, kind: 8, seed: pr(), alpha: 1, col: petalCol(), gate });
  };
  const ball = (rad) => { const a = pr() * TAU, b = Math.acos(pr.range(-1, 1)), r = rad * Math.abs(pr.gauss()) * 0.62; return new THREE.Vector3(Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r, Math.sin(b) * Math.sin(a) * r); };
  for (const arc of arcList) {
    const n = Math.round(1400 * dens * E.density);
    for (let k = 0; k < n; k++) {
      const u = pr(), c = arc.point(u), T = arc.point(Math.min(1, u + 0.004)).sub(arc.point(Math.max(0, u - 0.004))).normalize();
      // spread over the blossom's breadth, 4 to 6.5 m to either side, changing along the arc from the arc's dealt phase
      const place = arc.sAt(u), rad = lerp(4, 6.5, 0.5 + 0.5 * Math.sin(place * 0.11 + arc.ph));
      // a loose drift: densest in its middle, thinning smoothly to stragglers in all three directions (two throws
      // added, so that no tight core forms), flatter than it is broad
      const off = ball(rad * 0.75).add(ball(rad * 0.75));
      off.y *= arc.deep;
      flake(c, T, off, pr.range(6.5, 10), pr.range(1.6, 2.8), pr.range(0.26, 0.46), [place, arc.i + 1, 0, 0]);
    }
    await E.yield();
  }
  // a thinner stream that runs with us through the rings, and the first petals up both walls of the cleft
  for (let k = 0; k < Math.round(1300 * dens * E.density); k++) {
    const F = E.triad(pr.range(E.places.stream[0], E.places.stream[1])), a = pr() * TAU, r = pr.range(6.5, 11);
    flake(F.p.addScaledVector(F.right, Math.cos(a) * r).addScaledVector(F.n, Math.sin(a) * r), F.t, ball(0.6), pr.range(8, 12), pr.range(2.4, 3.8), pr.range(0.15, 0.26));
  }
  for (let k = 0; k < Math.round(520 * dens * E.density); k++) {
    const F = E.triad(pr.range(E.places.cleft[0], E.places.cleft[1] + 10)), side = pr.sign();
    flake(F.p.addScaledVector(F.right, side * pr.range(8.5, 12)).addScaledVector(F.n, pr.range(-4, 4)), F.t, ball(0.8), pr.range(6, 9), pr.range(2, 3.4), pr.range(0.2, 0.34));
  }
  await E.yield();
  // IN THE CLEFT: steam from the warm vents rises in soft columns to either side of the way. Toward the cleft's mouth
  // the columns stand farther apart and are smaller, tighter and fainter (by their place along the cleft, over its
  // final 45 to 15 m), so that the mouth, the trees and the walls are seen between them
  const sp = E.rng('led-summit-steam-places'), columns = [], mouth = E.places.cleft[1];
  for (let s = E.places.cleft[0] + 4; s < mouth; s += (E.demo ? 5 : 9) * (s > mouth - 32 ? 1.8 : 1)) for (const side of [-1, 1]) columns.push({ s: s + sp.range(-3, 3), lat: side * sp.range(10.5, 13) });
  for (const c of columns) {
    const F = E.triad(c.s), x = F.p.x + F.right.x * c.lat, z = F.p.z + F.right.z * c.lat;
    const y = E.groundAt(x, z, F.p.y - 8), full = 26, n = Math.round(full * dens);
    const m = sstep(mouth - 45, mouth - 15, c.s), size = lerp(0.85, 0.55, m), spread = lerp(1.6, 1, m);
    for (let k = 0; k < full; k++) {
      const life = prng.range(5, 7.5);
      const puff = { p: [x + prng.range(-1, 1) * spread, y + 0.3, z + prng.range(-1, 1) * spread], v: [prng.range(-0.3, 0.3), prng.range(2, 3.2), prng.range(-0.3, 0.3)], life, phase: (k + prng()) / n, s0: 1.6 * size, s1: prng.range(3.6, 5.6) * size, kind: 0, seed: prng(), alpha: lerp(0.11, 0.075, m), col: [1, 0.97, 0.94] };
      if (k < n) list.push(puff);
    }
  }
  if (list.length) {
    await E.yield();
    const puffs = await makePuffs(E, { ...E.UHigh, ...gustU }, list, 6);
    group.add(puffs.mesh);
    triangles += puffs.triangles; calls += 1;
  }
  return { triangles, calls };
}

export async function buildHero(ctx, opts = {}) {
  const object = new THREE.Group();
  const sets = { sea: new THREE.Group(), canyon: new THREE.Group(), crater: new THREE.Group(), summit: new THREE.Group() };
  for (const k of Object.keys(sets)) { sets[k].name = 'led-' + k; object.add(sets[k]); }
  const info = { triangles: {}, calls: {}, errors: [] };
  object.userData.ledNotes = info;
  let E = null, triangles = 0, calls = 0;
  try { E = makeEnv(ctx, opts); } catch (e) { info.errors.push('env: ' + (e && e.message)); }
  const builders = { sea: buildSea, canyon: buildCanyon, crater: buildCrater, summit: buildSummit };
  const hooks = [];
  if (E) {
    E.ctx = ctx;
    E.note = info;
    E.yield = async () => { if (ctx && typeof ctx.yield === 'function') await ctx.yield(); };
    await E.yield();
    for (const k of Object.keys(builders)) {
      try {
        const r = await builders[k](E, sets[k]);
        info.triangles[k] = r.triangles; info.calls[k] = r.calls; triangles += r.triangles; calls += r.calls;
        if (r.update) hooks.push(r.update);
      } catch (e) {
        // a set that fails stays an empty group: the world goes on
        info.errors.push(k + ': ' + (e && e.message));
        while (sets[k].children.length) sets[k].remove(sets[k].children[0]);
      }
      await E.yield();
    }
  }
  if (info.errors.length && typeof console !== 'undefined') console.error('[led matter] ' + info.errors.join(' | '));
  const demo = !E || E.demo;
  return {
    object, sets, info, triangles, calls,
    radius: demo ? 150 : 900, height: demo ? 60 : 300, center: demo ? new THREE.Vector3(0, 14, 0) : new THREE.Vector3(0, 100, 200),
    ground: true, groundY: 0,
    update(dt, time, camera) {
      if (!E) return;
      if (!(opts.time && typeof opts.time === 'object')) E.U.uTime.value = time;
      if (E.fog) { E.U.uFogD.value = E.fog.density; if (E.fog.color && E.fog.color.isColor) E.U.uFogC.value.copy(E.fog.color); }
      for (const h of hooks) h(dt, time, camera);
    },
    dispose() {},
  };
}
