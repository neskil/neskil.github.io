// MOON IN EVERY PADDY: hero set piece: "the amphitheatre of moons, and the breeze that breaks it".
//
// WHAT IT IS
//   A horseshoe bowl of flooded rice terraces (about 800 m across, 250 m deep, open toward +Z), every
//   paddy holding its own complete, view-facing cream moon drawn inside the water shader (so it is clipped
//   by the paddy outline), a bench 85 m below the ridge with one round pond-paddy 60 m across, and on the
//   pond's downhill lip a 14 m stone moon gate whose mirror image hangs under it in the water. A breeze
//   front crosses the bowl from the ridge (-Z) to the mouth (+Z) at 25 m/s; where it passes each moon is
//   cut into 5-7 cream bars that slide against each other and settle back over 3 s. Also included: the
//   ridge crest with a fringe of stacked-triangle cedars, the outer hill skirt, falls down the fall line
//   (scrolling cream stripes), two flat scalloped mist sheets on the valley floor.
//
// FRAME (local space, metres)
//   Origin = plan centre of the bowl at valley-floor level. +Y up. The ridge is at -Z (y = 250), the fall
//   line runs along +Z, the bowl opens toward +Z. The camera travels in +Z (downhill) and the printed moon
//   hangs over +Z, so "moon-facing" = +Z-facing.  radius ~ 400 (rim; the outer skirt runs on to ~750), height ~ 285
//   (cedar tips): these true sizes are returned as hero.extent { radius, skirtRadius, height }.
//   NOTE: it is a place, not an object, and from outside or below the terraces show only wall faces. So the
//   contract fields radius (70), height (120) and center (0, 200, 40) are VIEWER FRAMING values that make the
//   _part viewer orbit inside the bowl, above the terraces. Use hero.extent for the real bounding size.
//
// OPTS
//   palette    7 hex strings [ink, deep teal, teal, sage, mist, cream, amber] (brief palette by default)
//   levels     number of terrace levels (default 38-46 from the seed)
//   cedars     rim cedar count (default 520; 0 = none, the world plants its own)
//   mist       false to leave out the two valley mist sheets
//   moonGain   HDR gain of the paddy moons (default 1.7; the big pond moon uses 0.8x of it)
//   minMoonPx  smallest moon radius as a fraction of screen height (default 0.0035) so far moons stay dots
//   keepOut    (x, z, radius, metresBehindTheCrestEdge) => true to leave a rim cedar out (the world clears its ridge path with it)
//   uniforms.uIdle (0..1: catspaws, drifting patches of moons that shiver before the breeze; 1 by default), uLanK (0..1 strength of the lantern pool),
//   uniforms.uOv (the distances between which a moon starts to spill over its own dyke and wall as a whole disc; 90, 170 by default),
//   uniforms.uCres (0 full moon .. ~0.5 crescent in every paddy), uRain (0..1 rain rings + flickering moons), uFrost (0..1 dyke strips toward cream),
//   uRice (rgb, dot size) are set by the world for its variations; anchors.contour / radiusAt / levels too.
//
// ANCHORS (all local space)
//   portalSeat   { position, facing, radius }: centre of the ring's 14.4 m opening; facing = (0,0,-1),
//                the side the camera arrives from. The ring's outer rim touches the pond waterline.
//   flyThrough   ordered Vector3 list: ridge brink -> down the fall line 5-6 m above each terrace ->
//                level on the bench at 1.6 m -> over the pond rising to the ring centre -> 40 m beyond.
//                >= 6 m clear of everything in this module except the bench ground it skims by design.
//   viewpoints   { reveal, overPond, across }: good camera positions (the brink, pond approach, side wall).
//   ridgeEntry   start of the ridge path on the crest (the crest strip is 16 m wide, flat, y = 250).
//   pondCenter, pondRadius, benchY, waterY (pond surface), gateBase
//   farmhouseSeat, camphorSeat, wheelSeat: free flat spots on the bench either side of the stream.
//   streamLine   Vector3 list down the fall line (top of each fall), for fireflies / bamboo.
//   moonDir      unit vector toward the printed sky moon (30 degrees up over +Z, so it clears the ring top on approach).
//   paddies      [{ x, y, z, r, len, wid, level }]: every flooded paddy (centre on the water, moon radius),
//                for standing egrets, frogs and the procession.
//   heightAt(x, z)  terrace surface height at a local point (water level of that band).
//
// HOOKS
//   setProgress(p)   p 0..1 moves the breeze front from behind the ridge to past the mouth (use the world's
//                    u, remapped). Until it is first called the breeze loops by itself every ~45 s.
//   setBreezeFront(z) the same, as a local z in metres (the front is the line z = const, moving +Z).
//                    A moon at z breaks when the front passes it; the gate mirror breaks at portalSeat.z - 30.
//   plop(x, z, time)  frog ripple at a local point: four rings and that paddy's moon chopped (8 slots).
//   setLantern(worldPos, radius)  the hard-edged tone-lift pool with rib shadows: a disc of that plan radius, 3.5 m above and below worldPos (radius 0 = off).
//   uniforms         shared uniform objects (uTime, uFront, uLantern, uMoonCol, uPortalCol ...).
//
// STYLE (woodblock): no lights are used. Every surface is a ShaderMaterial writing flat linear tones of the
//   palette: water = deep teal stepping one tone toward the uphill bank; dyke top = one pale 0.8 m strip
//   (mist colour) with an ink keyline where it meets the water; wall faces = ink / deep teal in two flat
//   steps (moon-facing walls one step lighter) with a few flat grass ticks; beyond 300 m everything steps
//   toward palette[2]. Gate tones are baked per face on the CPU from the face normal (pale on +Z, sage on
//   the camera side, ink chamfers acting as the keyline). Scene fog is honoured (three fog chunks).
//
// COST: 90-100k triangles (per seed), 8 draw calls (terraces, pond well, gate mirror, pond water, gate+cedars,
//   falls, 2 mist sheets), no lights, no textures, ~200-250 ms build.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#061417', '#0F2B30', '#1F4A4C', '#5E857A', '#A9C2B4', '#F5EBC8', '#F2A03D'];
const RIDGE_Y = 250, BENCH_Y = 165, PHI = 2.3, WT = 0.8, BATTER = 0.45, POND_R = 30, RING_RI = 7.2, RING_RO = 8.25;

// growable typed vertex store
function makeStore(stride, cap) {
  let a = new Float32Array(cap * stride), n = 0;
  return {
    push(...v) { if ((n + 1) * stride > a.length) { const b = new Float32Array(a.length * 2); b.set(a); a = b; } a.set(v, n * stride); return n++; },
    get count() { return n; }, get array() { return a.subarray(0, n * stride); },
  };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('moon-paddy') : ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cInk, cDeep, cTeal, cSage, cMist, cCream, cAmber] = pal;
  const group = new THREE.Group(); group.name = 'moon-in-every-paddy-hero';

  // ---------------- bowl profile ----------------
  const K = opts.levels ?? rng.int(38, 46);
  const nLow = Math.round(K * (BENCH_Y / RIDGE_Y)), nHigh = K - nLow;
  const ys = [0];
  const fill = (n, y0, y1) => { const w = []; let s = 0; for (let i = 0; i < n; i++) { w.push(rng.range(0.7, 1.4)); s += w[i]; } let y = y0; for (let i = 0; i < n; i++) { y += (y1 - y0) * w[i] / s; ys.push(i === n - 1 ? y1 : y); } };
  fill(nLow, 0, BENCH_Y); fill(nHigh, BENCH_Y, RIDGE_Y);
  const kb = nLow;                                   // bench level index
  const R0 = 400, pw = rng.range(0.76, 0.9), benchB = rng.range(74, 88), benchW = rng.range(0.3, 0.37);
  const o1 = rng.range(0, 50), o2 = rng.range(0, 50), lobe = rng.range(0.04, 0.08);
  const rc = (phi, k) => {
    const y = ys[k], t = y / RIDGE_Y;
    const Rp = R0 * (1 + lobe * noise.n2(phi * 0.9 + o1, 3.1) + 0.05 * Math.sin(phi) * Math.sin(phi));
    const g = Math.exp(-(phi / benchW) * (phi / benchW));
    return Rp * (0.15 + 0.85 * Math.pow(t, pw)) + 5.5 * t * noise.n2(phi * 2.6 + o2, y * 0.021) + benchB * g * (k > kb ? 0.55 : -0.45);
  };
  const rOuter = (phi, k) => (k < K ? rc(phi, k + 1) - BATTER * (ys[k + 1] - ys[k]) : rc(phi, K) + 16);
  // the two arms fall away toward the mouth like spurs: higher levels end earlier
  const peN = rng.range(0, 9), peA = rng.range(0.7, 0.9);
  const phiEnd = (k) => PHI - peA * Math.pow(ys[k] / RIDGE_Y, 1.6) + 0.035 * Math.sin(k * 1.7 + peN);
  const kTop = (phi) => { const a = Math.abs(phi); for (let k = K; k > 0; k--) if (phiEnd(k) >= a) return k; return 0; };
  const skirtTop = (phi) => { const kt = kTop(phi); return { kt, r: kt === K ? rc(phi, K) + 16 : rOuter(phi, kt), y: ys[kt] + 0.42 }; };
  const P = (phi, r, y, out = new THREE.Vector3()) => out.set(r * Math.sin(phi), y, -r * Math.cos(phi));

  const lipR = rc(0, kb);
  const pondC = new THREE.Vector3(0, BENCH_Y + 0.12, -(lipR + WT + POND_R + 0.3));
  const gateZ = pondC.z + POND_R + 0.5;               // gate centre plane, on the lip dyke
  const waterY = pondC.y;

  // ---------------- terraces: one merged mesh ----------------
  // per vertex: position | aC (paddy centre xyz, moon radius) | aD (kind, rnd, s along, d across) | aE (len, width)
  // kind: 0 water, 1 dyke top, 2 wall face, 3 bench/crest ground, 4 outer skirt
  const vs = makeStore(13, 140000); const idx = [];
  const paddies = [];
  const SEG = 3.3;
  const tmp = new THREE.Vector3();
  for (let k = 0; k <= K; k++) {
    const y = ys[k], dyk = k > 0 ? y - ys[k - 1] : 6, crest = k === K;
    const pe = phiEnd(k); let phi = -pe, nP = 0;
    while (phi < pe - 1e-4) {
      if ((++nP & 3) === 0) await ctx.yield();
      const rm = rc(phi, k);
      const Lp = crest ? 70 : rng.range(20, 52) * (0.75 + 0.5 * y / RIDGE_Y);
      let dphi = Lp / rm; if (pe - (phi + dphi) < 0.45 * dphi) dphi = pe - phi;
      const phiM = phi + dphi * 0.5, rI = rc(phiM, k), rO = rOuter(phiM, k), W = Math.max(0.5, rO - rI - WT);
      const ground = crest || W > 17;
      const L = dphi * (rI + rO) * 0.5, rnd = rng();
      P(phiM, rI + WT + W * 0.5, y, tmp);
      const cx = tmp.x, cy = y, cz = tmp.z;
      const mr = ground ? 0 : clamp(0.36 * Math.min(W, L * 0.6), 0.75, 3.2);
      if (!ground) paddies.push({ x: cx, y: cy, z: cz, r: mr, len: L, wid: W, level: k });
      const n = Math.max(2, Math.ceil(L / (crest ? 9 : ground ? 6 : SEG)));
      let prev = -1;
      for (let j = 0; j <= n; j++) {
        const ph = phi + dphi * j / n, s = L * j / n, sn = Math.sin(ph), cs = -Math.cos(ph);
        const ri = rc(ph, k), ro = Math.max(ri + WT + 0.4, rOuter(ph, k)), kw = ground ? 3 : 0;
        const v = (r, yy, kind, d) => vs.push(r * sn, yy, r * cs, cx, cy, cz, mr, kind, rnd, s, d, L, W);
        const first = v(ro, y, kw, ro - ri);
        v(ri + WT, y, kw, WT);
        v(ri + WT, y + 0.06, 1, WT); v(ri, y + 0.42, 1, 0);
        v(ri, y + 0.42, 2, 0); v(ri - BATTER * dyk, y - dyk - 0.15, 2, dyk);
        if (prev >= 0) for (let q = 0; q < 6; q += 2) idx.push(prev + q, first + q, prev + q + 1, first + q, first + q + 1, prev + q + 1);
        prev = first;
      }
      phi += dphi;
    }
    // end caps at the mouth
    for (const e of [-pe, pe]) {
      const sn = Math.sin(e), cs = -Math.cos(e), ri = rc(e, k), ro = rOuter(e, k) + 7;
      const v = (r, yy, d) => vs.push(r * sn, yy, r * cs, 0, 0, 0, 0, 2, 0.5, 0, d, 1, 1);
      const a = v(ri, y + 0.42, 0), b = v(ro + 0.5, y + 0.42, 0), c = v(ro + 0.5, -6, y), d = v(ri - BATTER * dyk, -6, y);
      idx.push(a, b, c, a, c, d);
    }
    await ctx.yield();
  }
  // outer skirt behind the crest + valley floor fan
  {
    const NS = 220; let prev = -1;
    for (let j = 0; j <= NS; j++) {
      if ((j & 31) === 31) await ctx.yield();
      const ph = -PHI + 2 * PHI * j / NS, sn = Math.sin(ph), cs = -Math.cos(ph), st = skirtTop(ph), r = st.r, y0 = st.y;
      const v = (rr, yy, kind) => vs.push(rr * sn, yy, rr * cs, 0, 0, 0, 0, kind, 0.5, 0, y0 - yy, 1, 1);
      const a = v(r, y0, 4); v(r + 25 + 0.2 * y0 + 12 * noise.n2(ph * 2, 9), y0 * 0.86, 4); v(r + 50 + 0.7 * y0, y0 * 0.44, 4); v(r + 60 + 1.3 * y0, -6, 4);
      const f0 = v(rc(ph, 0) + 2, -5.5, 3); vs.push(0, -5.5, 0, 0, 0, 0, 0, 3, 0.5, 0, 0, 1, 1);
      if (prev >= 0) { for (let q = 0; q < 3; q++) idx.push(prev + q, a + q, prev + q + 1, a + q, a + q + 1, prev + q + 1); idx.push(prev + 4, f0, prev + 5); }
      prev = a;
    }
  }
  await ctx.yield();

  // ---------------- shared uniforms + GLSL ----------------
  const moonGain = opts.moonGain ?? 1.7;
  const U = {
    uTime: { value: 0 }, uFront: { value: -1e4 }, uLantern: { value: new THREE.Vector4(0, 0, 0, 0) },
    uRip: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -100, 0)) },
    uRipC: { value: Array.from({ length: 8 }, () => new THREE.Vector2(1e5, 1e5)) },          // centre of the paddy each plop landed in
    uSkyMoon: { value: new THREE.Vector4(0, Math.sin(30 * Math.PI / 180), Math.cos(30 * Math.PI / 180), Math.sin(2.6 * Math.PI / 180)) },   // printed moon: direction, sin(radius)
    uMinPx: { value: opts.minMoonPx ?? 0.0035 }, uFar: { value: 1 }, uIdle: { value: 1 }, uLanK: { value: 1 }, uOv: { value: new THREE.Vector2(90, 170) },
    uMoonCol: { value: cCream.clone().multiplyScalar(moonGain) },
    uCres: { value: 0 }, uRain: { value: 0 }, uFrost: { value: 0 }, uRice: { value: new THREE.Vector4(cInk.r, cInk.g, cInk.b, 1) },
    uPortalCol: { value: cCream.clone().multiplyScalar(1.5) },
    uPond: { value: new THREE.Vector4(pondC.x, pondC.z, POND_R + 0.4, pondC.y) },
    cInk: { value: cInk }, cDeep: { value: cDeep }, cTeal: { value: cTeal }, cSage: { value: cSage },
    cMist: { value: cMist }, cCream: { value: cCream }, cAmber: { value: cAmber },
  };
  const mkU = (extra = {}) => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra });
  const COMMON = /* glsl */`
    uniform float uTime, uFront, uMinPx, uFar, uCres, uRain, uFrost, uIdle, uLanK; uniform vec4 uLantern, uPond, uRice, uSkyMoon; uniform vec4 uRip[8]; uniform vec2 uRipC[8], uOv;
    uniform vec3 cInk, cDeep, cTeal, cSage, cMist, cCream, cAmber, uMoonCol, uPortalCol;
    float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float breezeAmp(float z){ float tau = (uFront - z) / 25.; return smoothstep(0., .3, tau) * (1. - smoothstep(1., 3.2, tau)); }
    // catspaws: slow patches of light air drifting across the bowl before the breeze. c = a paddy's centre, so each moon moves as a unit
    float idleAmp(vec2 c){
      float a = sin(c.x * .021 + uTime * .31) * sin(c.y * .017 - uTime * .23 + c.x * .004);
      float b = sin(c.x * .0083 - uTime * .17 + 2.) * sin(c.y * .0127 + uTime * .13 + 4.);
      return uIdle * .22 * smoothstep(.53, .83, .5 + .5 * max(a, .8 * b));
    }
  `;
  const COMMON_F = COMMON + /* glsl */`
    // q: unit-disc coords; returns moon coverage, broken into sliding bars when amp > 0
    float moonBars(vec2 q, float amp, float rnd, float aa){
      float nb = 5. + floor(rnd * 2.99), by = (q.y * .5 + .5) * nb, band = floor(by);
      float off = amp * 1.15 * sin(band * 2.4 + uTime * 6. + rnd * 40.);
      float gap = step(fract(by), .2 * min(amp * 3., 1.));
      float m = 1. - smoothstep(1. - aa, 1. + aa, length(vec2(q.x - off, q.y)));
      m *= mix(1., smoothstep(1. - aa, 1. + aa, length(vec2(q.x - off - uCres, q.y - .3 * uCres))), step(.001, uCres));
      return m * (1. - gap) * step(abs(q.y), 1.);
    }
    vec3 finish(vec3 col, vec3 wp, float glow){
      float dist = distance(wp, cameraPosition);
      col = mix(col, mix(col, cTeal, .45), smoothstep(300., 440., dist) * uFar * (1. - glow));
      // the lantern's pool: a hard-edged one-step tone lift that keeps the hue, cut by eight swinging rib shadows
      vec3 dl = wp - uLantern.xyz;
      if (uLantern.w > 0. && dot(dl.xz, dl.xz) < uLantern.w * uLantern.w && abs(dl.y) < 3.5) {
        float rib = step(.82, fract(atan(dl.x, abs(dl.z) < 1e-4 ? 1e-4 : dl.z) * 1.2732 + .3 * sin(uTime * .9)));
        col = mix(col, col * 1.5 + cAmber * (.012 + .2 * dot(col, vec3(.333))), (1. - rib) * (1. - glow) * uLanK);
      }
      // static paper fibre: short horizontal strands hashed on the pixel, no time term
      vec2 pq = floor(gl_FragCoord.xy * vec2(.34, 1.));
      return col * (.962 + .07 * fract(sin(dot(pq, vec2(12.9898, 78.233))) * 43758.5453));
    }
  `;

  // ---------------- terrace mesh + material ----------------
  const terrGeo = new THREE.BufferGeometry();
  {
    const ib = new THREE.InterleavedBuffer(vs.array.slice(), 13);
    terrGeo.setAttribute('position', new THREE.InterleavedBufferAttribute(ib, 3, 0));
    terrGeo.setAttribute('aC', new THREE.InterleavedBufferAttribute(ib, 4, 3));
    terrGeo.setAttribute('aD', new THREE.InterleavedBufferAttribute(ib, 4, 7));
    terrGeo.setAttribute('aE', new THREE.InterleavedBufferAttribute(ib, 2, 11));
    terrGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
    terrGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 120, 0), 900);
  }
  await ctx.yield();
  const terrMat = new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, side: THREE.DoubleSide,
    vertexShader: COMMON + /* glsl */`
      attribute vec4 aC, aD; attribute vec2 aE;
      varying vec4 vClip, vMoon, vD, vP; varying vec3 vW; varying vec2 vL, vX, vPc;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vL = position.xz; vD = aD;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; vClip = gl_Position;
        vec4 wc = modelMatrix * vec4(aC.xyz, 1.); vec4 cc = projectionMatrix * viewMatrix * wc;
        float sinE = abs(normalize(cameraPosition - wc.xyz).y);
        float low = step(aC.y, uPond.w - 1.);                    // the terraces below the bench carry the last image: larger, brighter moons
        float R = max(aC.w * (1. + .4 * low), uMinPx * (1. + .45 * low) * cc.w / projectionMatrix[1][1]) * (1. + .03 * sin(uTime * .8 + aD.y * 6.2832));   // each moon breathes a little
        // far paddies (print licence): the disc keeps its size and may spill over its own dyke and wall, so the far walls read as moons
        float ov = smoothstep(uOv.x, uOv.y, distance(cameraPosition, wc.xyz));
        R = min(min(R, (.5 + .16 * low) * aE.y * max(sinE, mix(.5, 1., ov))), .24 * cc.w / projectionMatrix[1][1]);
        vX = vec2(1. + .3 * low, ov); vPc = aC.xz;
        vMoon = (aC.w > 0. && cc.w > .5) ? vec4(cc.xy / cc.w, R * projectionMatrix[0][0] / cc.w, R * projectionMatrix[1][1] / cc.w) : vec4(0.);
        float amp = max(breezeAmp(aC.z), idleAmp(aC.xz));
        for (int i = 0; i < 8; i++) { float age = uTime - uRip[i].z; amp = max(amp, step(distance(aC.xz, uRipC[i]), .5) * smoothstep(0., .3, age) * (1. - smoothstep(1.5, 4., age))); }
        amp = max(amp, uRain * smoothstep(.3, .6, sin(uTime * 1.7 + aD.y * 60.)));
        vP = vec4(aE, amp, -aC.z / max(length(aC.xz), 1.) + (aD.y - .5) * .3);
        #include <fog_vertex>
      }`,
    fragmentShader: COMMON_F + /* glsl */`
      varying vec4 vClip, vMoon, vD, vP; varying vec3 vW; varying vec2 vL, vX, vPc;
      #include <fog_pars_fragment>
      void main(){
        float fwR = length(fwidth(vW.xz)) * 1.1, camD = distance(vW, cameraPosition);
        float kind = vD.x, rnd = vD.y, s = vD.z, d = vD.w, L = vP.x, W = vP.y, amp = vP.z;
        vec3 col; float glow = 0.;
        if (kind < .5) {                                   // water
          col = mix(cDeep, cTeal, step(.6, (d - ${WT.toFixed(2)}) / W) * .5);
          vec2 g = vec2(s, d) * 2.2; float fw = fwidth(g.x) + fwidth(g.y);
          float dots = (1. - smoothstep(.13, .2 + fw, length(fract(g) - .5) / uRice.w)) * (1. - smoothstep(.45, 1.1, fw)) * mix(.22, 1., smoothstep(11., 26., camD));   // near the lens the blades carry the rice, not polka dots
          float lq = 9., m = 0.;
          if (vMoon.z > 0.) {
            vec2 q = (vClip.xy / vClip.w - vMoon.xy) / vMoon.zw; lq = length(q);
            m = moonBars(q, amp, rnd, fwidth(lq) * .75);
            float halo = step(1.2, lq) * step(lq, 1.42) * (1. - smoothstep(0., .12, amp));
            col = mix(col, mix(cTeal, cSage, .35), halo);
          }
          col = mix(col, uRice.rgb, dots * .85 * step(2., lq));
          if (uRain > 0.) {                                  // rain: every paddy ringed
            vec2 rg = vec2(s, d) / 2.3; float rfw = fwidth(rg.x) + fwidth(rg.y);
            float rage = fract(uTime * .55 + hash21(floor(rg) + rnd * 17.));
            col = mix(col, mix(cTeal, cSage, .55), uRain * step(abs(length(fract(rg) - .5) - rage * .42), .05) * (1. - rage) * (1. - smoothstep(.15, .5, rfw)) * step(1.5, lq));
          }
          for (int i = 0; i < 8; i++) {                      // frog rings
            float age = uTime - uRip[i].z, rp = (age * 2.6 - distance(vW.xz, uRip[i].xy)) * 1.1;      // four thin concentric rings, radial only
            float ring = step(0., rp) * step(rp, 4.) * step(abs(fract(rp) - .5), max(.045, fwR)) * step(age, 4.) * step(0., age) * (1. - smoothstep(.45, 1.2, fwR));
            ring *= (1. - floor(clamp(rp, 0., 3.)) * .2) * step(distance(vPc, uRipC[i]), .5);          // fine rings, fainter outward, never across a dyke
            col = mix(col, mix(cSage, cMist, .5), ring * .7 * (1. - smoothstep(2.5, 4., age)));
          }
          float e = min(s, L - s);
          if (d < ${(WT + 0.13).toFixed(2)} || d > W + ${(WT - 0.22).toFixed(2)} || (e > .45 && e < .6)) { col = cInk; m = 0.; }
          if (e < .45) { col = mix(cSage, cMist, .55); m = 0.; }
          col = mix(col, uMoonCol * vX.x, m); glow = m;
        } else if (kind < 1.5) {                           // pale dyke top: the moonlit edge
          vec3 pale = mix(mix(cSage, cMist, .6 + .3 * step(.5, rnd)), cCream, uFrost) * (1. - .27 * smoothstep(110., 190., camD)) * (.7 + .3 * smoothstep(9., 15., camD));   // frost; far strips a step darker so moons out-read lines
          col = d < .3 ? pale : mix(cDeep, cTeal, .6);
          float ir = hash21(vec2(floor(s * 2.5), floor(rnd * 91.)));
          col = mix(col, d < .3 ? mix(cTeal, cSage, .6) : mix(cTeal, cSage, .5), step(.8, ir) * step(abs(fract(s * 2.5) - .5), .2));
          float fd = fwidth(d);                              // ink keyline on both edges of the pale strip, near only
          col = mix(col, cInk, max(step(d, max(.1, fd)), step(abs(d - .3), max(.05, .6 * fd))) * (1. - smoothstep(70., 150., camD)));
        } else if (kind < 2.5) {                           // wall face
          float lit = step(.2, vP.w), near = 1. - smoothstep(50., 150., distance(vW, cameraPosition));
          col = mix(cInk, cDeep, min(1., .45 + .5 * lit + .4 * (1. - smoothstep(22., 40., camD))));       // near the lens the walls lift one step, so they read as planes, not holes
          col = mix(col, mix(cDeep, cTeal, .25 + .35 * lit), step(d, 1.0));
          float hb = hash21(vec2(floor(s * 3.2), floor(rnd * 53.)));
          col = mix(col, mix(cDeep, cTeal, .25 + .35 * lit), step(.72, hb) * step(d, 1. + 1.5 * fract(hb * 7.3)) * near);
          col = mix(col, cInk, step(.9, hash21(floor(vec2(s * .35 + rnd * 77., d * .5)))) * near * .8);
          col = mix(col, cInk, step(d, .12));
        } else if (kind < 3.5) {                           // bench + crest ground
          vec2 pl = vL - uPond.xy;
          if (length(pl) < uPond.z || (abs(pl.x) < 11.3 && pl.y > 0. && pl.y < uPond.z + .7)) discard;
          col = mix(cDeep, cTeal, .4);
          float tuft = step(.9, hash21(floor(vL * 1.6))) * (1. - smoothstep(60., 160., distance(vW, cameraPosition)));
          col = mix(col, mix(cDeep, cTeal, .75), tuft);
          col = mix(col, mix(cDeep, cTeal, .2), step(.5, fract(d * .045 + .1 * sin(s * .08))));
        } else {                                           // outer hill skirt: two flat scalloped bands
          float h = d + 9. * abs(sin(vW.x * .045 + vW.z * .03));
          col = mix(mix(cInk, cDeep, .55), cInk, step(42., h));
          col = mix(col, cInk * .7, step(140., h));
        }
        if (kind > .5 && kind < 2.5 && vMoon.z > 0. && vX.y > 0.) {     // a far moon spilling over its own dyke and wall
          vec2 q = (vClip.xy / vClip.w - vMoon.xy) / vMoon.zw;
          float m = moonBars(q, amp, rnd, fwidth(length(q)) * .75) * vX.y;
          col = mix(col, uMoonCol * vX.x, m); glow = m;
        }
        gl_FragColor = vec4(finish(col, vW, glow), 1.);
        #include <fog_fragment>
      }`,
  });
  const terraces = new THREE.Mesh(terrGeo, terrMat); terraces.name = 'terraces'; group.add(terraces);

  // ---------------- flat-tone material for baked vertex-colour props (gate, cedars, well) ----------------
  const flatMat = (side = THREE.FrontSide) => new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, side, vertexColors: true,
    vertexShader: COMMON + /* glsl */`
      attribute float aSway; varying vec3 vCol, vW;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; vCol = color;
        float g = breezeAmp(p.z);
        p.x += aSway * (.5 * sin(uTime * .9 + p.x * .05 + p.z * .08) + .25 * sin(uTime * 2.3 + p.z * .3));
        p.z += aSway * 2.2 * g;
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: COMMON_F + /* glsl */`
      varying vec3 vCol, vW;
      #include <fog_pars_fragment>
      void main(){ gl_FragColor = vec4(finish(vCol, vW, 0.), 1.); 
        #include <fog_fragment>
      }`,
  });
  // triangle soup with flat per-face colour
  const soup = () => {
    const p = [], c = [], sw = [];
    const tri = (a, b, d, col, s0 = 0, s1 = s0, s2 = s0) => { p.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z); for (let i = 0; i < 3; i++) c.push(col.r, col.g, col.b); sw.push(s0, s1, s2); };
    const quad = (a, b, d, e, col) => { tri(a, b, d, col); tri(a, d, e, col); };
    const build = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(sw, 1)); return g; };
    return { tri, quad, build, get tris() { return p.length / 9; } };
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mix = (a, b, t) => a.clone().lerp(b, t);

  // ---------------- round pond: well (backdrop), mirror of the gate, water ----------------
  const pondOutline = (r) => {            // circle with a flat notch under the gate; local to pond centre, a = 0 at +z
    const pts = [], an = Math.asin(11 / r), N = 72;
    for (let i = 0; i <= N; i++) { const a = an + (Math.PI * 2 - 2 * an) * i / N; pts.push([r * Math.sin(a), r * Math.cos(a)]); }
    pts.push([-11, POND_R + 1.05], [11, POND_R + 1.05]);
    return pts;
  };
  const WELL_D = RING_RO * 2 + 6;
  {
    const s = soup(), o = pondOutline(POND_R + 0.6), cW = mix(cDeep, cTeal, 0.45), cF = cW;      // one tone, so the pond shader can match the water seen over it
    for (let i = 0; i < o.length; i++) {
      const a = o[i], b = o[(i + 1) % o.length];
      const A = V(pondC.x + a[0], waterY, pondC.z + a[1]), B = V(pondC.x + b[0], waterY, pondC.z + b[1]);
      const A2 = A.clone().setY(waterY - WELL_D), B2 = B.clone().setY(waterY - WELL_D);
      s.quad(A, B, B2, A2, cW); s.tri(A2, B2, V(pondC.x, waterY - WELL_D, pondC.z), cF);
    }
    const well = new THREE.Mesh(s.build(), flatMat(THREE.DoubleSide)); well.name = 'pond-well'; group.add(well);
  }
  const mirrorMat = new THREE.ShaderMaterial({
    uniforms: mkU({ uG: { value: new THREE.Vector4(0, waterY, gateZ, 0) } }), fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vL, vW;
      #include <fog_pars_vertex>
      void main(){ vL = position; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: COMMON_F + /* glsl */`
      uniform vec4 uG; varying vec3 vL, vW;
      #include <fog_pars_fragment>
      void main(){
        float h = uG.y - vL.y, amp = breezeAmp(uG.z - 6.);          // h: height of the mirrored point above water
        float by = h / 1.35, band = floor(by);
        float x = vL.x - amp * 2.4 * sin(band * 2.4 + uTime * 6.);
        if (step(fract(by), .2 * min(amp * 3., 1.)) > .5) discard;
        vec2 rp = vec2(x, h - ${RING_RO.toFixed(2)}); float rr = length(rp), glow = 0.; vec3 col;
        if (rr < ${RING_RI.toFixed(2)}) { col = uPortalCol; glow = 1.; }
        else if (rr < ${RING_RO.toFixed(2)}) {
          float ang = atan(rp.x, rp.y) * ${(26 / (Math.PI * 2)).toFixed(4)};
          col = mix(cSage, cMist, .55 + .25 * step(.5, hash21(vec2(floor(ang), 3.)))) * 1.5;
          if (abs(fract(ang) - .5) > .46 || rr < ${(RING_RI + 0.12).toFixed(2)} || rr > ${(RING_RO - 0.12).toFixed(2)}) col = cInk;
        }
        else if ((h < .5 && abs(x) < 6.4) || (h < 1. && abs(x) > 5.2 && abs(x) < 9.3) || (h < 2.5 && abs(x) > 6.7 && abs(x) < 9.) || (h < 4.25 && abs(x) > 7.95 && abs(x) < 8.75) || (h > 4.2 && h < 5.3 && abs(abs(x) - 8.35) < (5.3 - h) * .48)) col = mix(cSage, cMist, .4) * 1.4;
        else discard;
        gl_FragColor = vec4(finish(col, vW, glow), 1.);
        #include <fog_fragment>
      }`,
  });
  {
    const w = RING_RO + 4.5, g = new THREE.BufferGeometry();
    const y0 = waterY - 0.02, y1 = waterY - RING_RO * 2 - 1, z = gateZ - 0.42;
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w, y0, z, w, y0, z, w, y1, z, -w, y1, z], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(g, mirrorMat); m.name = 'gate-mirror'; m.renderOrder = 1; group.add(m);
  }
  const pondMat = new THREE.ShaderMaterial({
    uniforms: mkU({ uAlpha: { value: 0.5 } }), fog: true, transparent: true, depthWrite: false,
    vertexShader: COMMON + /* glsl */`
      varying vec4 vClip, vMoon; varying vec3 vW; varying vec2 vL; varying float vAmp;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vL = position.xz - uPond.xy;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; vClip = gl_Position;
        vec4 wc = modelMatrix * vec4(uPond.x, uPond.w, uPond.y - 13., 1.); vec4 cc = projectionMatrix * viewMatrix * wc;
        float sinE = abs(normalize(cameraPosition - wc.xyz).y);
        float R = min(min(max(8.5, uMinPx * cc.w / projectionMatrix[1][1]), 24. * max(sinE, .12)), .25 * max(cc.w, .01) / projectionMatrix[1][1]);      // never more than a third of the picture's height: the great moon is seen whole
        vMoon = cc.w > .5 ? vec4(cc.xy / cc.w, R * projectionMatrix[0][0] / cc.w, R * projectionMatrix[1][1] / cc.w) : vec4(0.);
        vAmp = max(breezeAmp(uPond.y - 18.), uRain * smoothstep(.3, .6, sin(uTime * 1.7 + 2.)));          // (no catspaws here: the great moon stays whole until the breeze itself)
        for (int i = 0; i < 8; i++) { float age = uTime - uRip[i].z; vAmp = max(vAmp, step(distance(wc.xz, uRip[i].xy), 30.) * smoothstep(0., .3, age) * (1. - smoothstep(1.5, 4., age))); }
        #include <fog_vertex>
      }`,
    fragmentShader: COMMON_F + /* glsl */`
      uniform float uAlpha; varying vec4 vClip, vMoon; varying vec3 vW; varying vec2 vL; varying float vAmp;
      #include <fog_pars_fragment>
      void main(){
        float r = length(vL), fwR = length(fwidth(vW.xz)) * 1.1;
        // bokashi in three flat steps: the open water lifts toward the far bank, where it mirrors the pale foot of the sky
        vec3 vv = normalize(vW - cameraPosition); float gz = -vv.y + .018 * sin(vL.x * .21 + uTime * .25) + .012 * sin(vL.x * .57 - uTime * .4);
        // the window the gate's mirror image is seen through: the sight line carried on under the water to the mirror's plane, tested against its outline
        float mAmp = breezeAmp(uPond.y + uPond.z - 5.9), tz = (uPond.y + uPond.z - .32 - vW.z) / max(vv.z, 1e-3);
        vec2 mh = vec2(vW.x + vv.x * tz, -vv.y * tz);
        float mr = length(vec2(mh.x, mh.y - ${RING_RO.toFixed(2)})), mp = step(mh.y, 5.4);
        float win = step(0., tz) * max(step(mr, ${(RING_RO + 0.3).toFixed(2)} + 2.5 * mAmp), step(abs(mh.x), 9.5 + 2.5 * mAmp) * mp);
        float win0 = step(0., tz) * max(step(mr, ${(RING_RO + 0.3).toFixed(2)}), step(abs(mh.x), 9.5) * mp);          // the unbroken outline: rice dots keep out of this only
        float s1 = step(gz, .42), s2 = step(gz, .24);
        vec3 col = mix(cDeep, cTeal, .2 + .45 * s1); col = mix(col, mix(cTeal, cSage, .24), s2);
        float aOut = max(uAlpha, .82 * s1 + .1 * s2), a = mix(aOut, uAlpha, win), m = 0., lq = 9.; vec2 qm = vec2(9.);
        vec3 cWell = mix(cDeep, cTeal, .45); col = mix(col, cWell + (aOut / uAlpha) * (col - cWell), win);      // inside the window the thinner water is tinted so it lands on the same tone as the water around it
        // sliding dashes, the print-maker's sign for moving water: sparse when calm, crowding and paling when the breeze crosses
        {
          vec2 dg = vec2(vL.x / 3.4, vL.y / 1.2); float row = floor(dg.y);
          dg.x += .37 * row + (.22 + .6 * vAmp) * sin(row * 2.4 + uTime * 1.1) + .35 * vAmp * sin(row * 1.3 + uTime * 5.);
          float dh = hash21(vec2(floor(dg.x), row) + 7.);
          float dash = step(1. - (.1 + .34 * vAmp), dh) * step(abs(fract(dg.x) - .5), .15 + .22 * fract(dh * 7.)) * step(abs(fract(dg.y) - .5), .15) * (1. - smoothstep(.3, .8, fwidth(dg.y))) * (1. - .75 * win0);
          col = mix(col, mix(mix(cTeal, cSage, .5), cMist, .75 * vAmp), dash); a = max(a, dash * .9);
        }
        if (vMoon.z > 0.) {
          vec2 q = (vClip.xy / vClip.w - vMoon.xy) / vMoon.zw; lq = length(q); qm = q;
          m = moonBars(q, vAmp, .93, fwidth(lq) * .75);
          float halo = step(1.14, lq) * step(lq, 1.3) * (1. - smoothstep(0., .12, vAmp));
          col = mix(col, mix(cTeal, cSage, .35), halo); a = max(a, halo * .85);
        }
        vec2 g = vec2(r, atan(vL.x, vL.y) * floor(r * 2.) / 2.) * 2.; float fw = fwidth(g.x) + fwidth(vL.x) * 2.;
        float dots = (1. - smoothstep(.13, .2 + fw, length(fract(g) - .5))) * (1. - smoothstep(.45, 1.1, fw)) * step(1.45, lq) * (1. - win0);
        col = mix(col, uRice.rgb, dots * .85); a = max(a, dots);
        if (uRain > 0.) {
          vec2 rg = vL / 2.3; float rfw = fwidth(rg.x) + fwidth(rg.y);
          float rage = fract(uTime * .55 + hash21(floor(rg)));
          float rr = uRain * step(abs(length(fract(rg) - .5) - rage * .42), .05) * (1. - rage) * (1. - smoothstep(.15, .5, rfw)) * step(1.45, lq);
          col = mix(col, mix(cTeal, cSage, .55), rr); a = max(a, rr);
        }
        for (int i = 0; i < 8; i++) {
          float age = uTime - uRip[i].z, rp = (age * 2.6 - distance(vW.xz, uRip[i].xy)) * 1.1;
          float ring = step(0., rp) * step(rp, 4.) * step(abs(fract(rp) - .5), max(.045, fwR)) * step(age, 4.) * step(0., age) * (1. - smoothstep(.45, 1.2, fwR)) * (1. - smoothstep(2.5, 4., age));
          ring *= (1. - floor(clamp(rp, 0., 3.)) * .2) * .7;
          col = mix(col, mix(cSage, cMist, .5), ring); a = max(a, ring);
        }
        // the printed sky moon mirrored in the pond once we are out over it: a disc cut into bars, and a path of sliding bars either side of it
        {
          vec3 rf = vec3(vv.x, -vv.y, vv.z), mrt = normalize(cross(uSkyMoon.xyz, vec3(0., 1., 0.))), mup = cross(mrt, uSkyMoon.xyz);
          vec2 mq = vec2(dot(rf, mrt), dot(rf, mup)) / (uSkyMoon.w * 1.3);
          float ay = abs(mq.y), aa2 = fwidth(mq.x) * .9, cm = 0.;
          float calm = .1 + .9 * min(vAmp * 3., 1.);
          if (ay < 1.) {
            float by = (mq.y * .5 + .5) * 6., bd = floor(by);
            float off = (.1 + .5 * vAmp) * sin(bd * 2.4 + uTime * 1.7) + .3 * vAmp * sin(bd * 1.9 + uTime * 6.);
            float hw = sqrt(max(1. - mq.y * mq.y, 0.));
            cm = (1. - smoothstep(hw - aa2, hw + aa2, abs(mq.x - off))) * (1. - step(fract(by), .22 * calm));
          } else {
            float tl = (ay - 1.) / (mq.y > 0. ? 5. : 2.6), by = ay * 2.1, bd = floor(by) + step(0., mq.y) * 9.;
            float off = (.3 + .45 * vAmp) * sin(bd * 2.4 + uTime * 1.7) + .3 * vAmp * sin(bd * 1.9 + uTime * 6.);
            float hw = .86 * pow(max(1. - tl, 0.), .7) * (.55 + .45 * hash21(vec2(bd, 3.)));
            cm = (1. - smoothstep(hw - aa2, hw + aa2, abs(mq.x - off))) * step(.45, fract(by)) * step(tl, 1.) * .8;
          }
          cm *= step(0., dot(rf, uSkyMoon.xyz)) * smoothstep(-31., -19., cameraPosition.z - uPond.y) * (1. - smoothstep(.5, 1.5, aa2));
          m = max(m, cm);
        }
        // the great moon is printed, not blank: its seas in one flat step, a shade under the cream
        float seas = max(max(step(length(qm - vec2(-.34, .30)), .30), step(length(qm - vec2(.12, .46)), .21)), max(step(length(qm - vec2(.30, -.02)), .27), max(step(length(qm - vec2(-.12, -.38)), .19), step(length(qm - vec2(.47, -.45)), .11)))) * step(lq, .94);
        col = mix(col, uMoonCol * .52 * (1. - .34 * seas), m); a = max(a, m);
        gl_FragColor = vec4(finish(col, vW, m), a);
        #include <fog_fragment>
      }`,
  });
  {
    const o = pondOutline(POND_R + 0.2), pos = [pondC.x, waterY, pondC.z], ix = [];
    for (const q of o) pos.push(pondC.x + q[0], waterY, pondC.z + q[1]);
    for (let i = 0; i < o.length; i++) ix.push(0, 1 + i, 1 + (i + 1) % o.length);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(ix);
    const m = new THREE.Mesh(g, pondMat); m.name = 'round-paddy'; m.renderOrder = 2; group.add(m);
  }
  await ctx.yield();

  // ---------------- the moon gate (baked flat tones), sill, plinths, pond rim ----------------
  const G = V(0, waterY + RING_RO, gateZ);
  const props = soup();
  {
    const NB = 26, dth = Math.PI * 2 / NB, c = 0.14;
    const faceCol = (e, th, v) => {
      const up = Math.cos(th);
      if (e === 0) return mix(cSage, cMist, 0.38 + 0.3 * v);                 // camera side, in shade
      if (e === 1 || e === 7) return cInk.clone();                            // shade-side chamfers = keyline
      if (e === 2) return up > 0.15 ? mix(cSage, cMist, 0.8) : mix(cTeal, cSage, 0.4);
      if (e === 3 || e === 5) return mix(cMist, cCream, 0.35).multiplyScalar(0.92);  // moonlit edge
      if (e === 4) return mix(cMist, cCream, 0.12 * v).multiplyScalar(0.9);    // moon-facing face
      return up > 0 ? mix(cTeal, cSage, 0.25) : mix(cDeep, cTeal, 0.6);      // intrados
    };
    for (let i = 0; i < NB; i++) {
      const v = rng(), ro = RING_RO + (rng.chance(0.3) ? rng.range(0.05, 0.16) : 0), ri = RING_RI - (rng.chance(0.2) ? 0.06 : 0), hz = 0.5 + rng.range(0, 0.07);
      const prof = [[ri + c, -hz], [ro - c, -hz], [ro, -hz + c], [ro, hz - c], [ro - c, hz], [ri + c, hz], [ri, hz - c], [ri, -hz + c]];
      const gap = 0.0045, t0 = i * dth + gap, t1 = (i + 1) * dth - gap, SUB = 3;
      const pt = (th, q) => V(G.x + q[0] * Math.sin(th), G.y + q[0] * Math.cos(th), G.z + q[1]);
      for (let sgi = 0; sgi < SUB; sgi++) {
        const a = lerp(t0, t1, sgi / SUB), b = lerp(t0, t1, (sgi + 1) / SUB);
        for (let e = 0; e < 8; e++) { const p0 = prof[e], p1 = prof[(e + 1) % 8]; props.quad(pt(a, p0), pt(a, p1), pt(b, p1), pt(b, p0), faceCol(e, (a + b) / 2, v)); }
      }
      for (const th of [t0, t1]) for (let e = 1; e < 7; e++) props.tri(pt(th, prof[0]), pt(th, prof[e]), pt(th, prof[e + 1]), cInk);
    }
    // bevelled block helper: tones from face direction
    const block = (x0, x1, y0, y1, z0, z1, b = 0.12, v = 0.5) => {
      const cz0 = mix(cSage, cMist, 0.3 + 0.3 * v), cz1 = mix(cMist, cCream, 0.1).multiplyScalar(0.9), cx = mix(cTeal, cSage, 0.7), ct = mix(cSage, cMist, 0.85);
      const yt = y1 - b;
      props.quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, yt, z0), V(x0, yt, z0), cz0);
      props.quad(V(x1, y0, z1), V(x0, y0, z1), V(x0, yt, z1), V(x1, yt, z1), cz1);
      props.quad(V(x0, y0, z1), V(x0, y0, z0), V(x0, yt, z0), V(x0, yt, z1), cx);
      props.quad(V(x1, y0, z0), V(x1, y0, z1), V(x1, yt, z1), V(x1, yt, z0), cx);
      props.quad(V(x0, yt, z0), V(x1, yt, z0), V(x1 - b, y1, z0 + b), V(x0 + b, y1, z0 + b), cInk);
      props.quad(V(x1, yt, z1), V(x0, yt, z1), V(x0 + b, y1, z1 - b), V(x1 - b, y1, z1 - b), mix(cMist, cCream, 0.35).multiplyScalar(0.92));
      props.quad(V(x0, yt, z1), V(x0, yt, z0), V(x0 + b, y1, z0 + b), V(x0 + b, y1, z1 - b), ct);
      props.quad(V(x1, yt, z0), V(x1, yt, z1), V(x1 - b, y1, z1 - b), V(x1 - b, y1, z0 + b), ct);
      props.quad(V(x0 + b, y1, z0 + b), V(x1 - b, y1, z0 + b), V(x1 - b, y1, z1 - b), V(x0 + b, y1, z1 - b), ct);
    };
    block(-6.4, 6.4, waterY - 0.04, waterY + 0.5, gateZ - 0.95, gateZ + 1.15, 0.14, 0.4);          // sill (runs down the lip wall)
    for (const sx of [-1, 1]) {                                                                 // stepped plinths cradling the ring
      const xa = sx * 5.2, xb = sx * 9.3, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
      block(x0, x1, waterY - 0.04, waterY + 1.0, gateZ - 0.8, gateZ + 1.0, 0.14, rng());
      const m0 = sx > 0 ? x0 + 1.5 : x0 + 0.3, m1 = sx > 0 ? x1 - 0.3 : x1 - 1.5;
      block(m0, m1, waterY + 1.0, waterY + 2.5, gateZ - 0.68, gateZ + 0.82, 0.13, rng());
      const n0 = sx > 0 ? m0 + 1.25 : m0 + 0.25, n1 = sx > 0 ? m1 - 0.25 : m1 - 1.25;
      block(n0, n1, waterY + 2.5, waterY + 3.9, gateZ - 0.5, gateZ + 0.6, 0.1, rng());
      block(n0 - 0.28, n1 + 0.28, waterY + 3.9, waterY + 4.25, gateZ - 0.82, gateZ + 0.92, 0.12, rng());   // cap slab
      const cxm = (n0 + n1) / 2, ap = V(cxm, waterY + 5.3, gateZ + 0.05), yq = waterY + 4.25, q0 = V(n0 - 0.1, yq, gateZ - 0.62), q1 = V(n1 + 0.1, yq, gateZ - 0.62), q2 = V(n1 + 0.1, yq, gateZ + 0.72), q3 = V(n0 - 0.1, yq, gateZ + 0.72);
      props.tri(q0, q1, ap, mix(cSage, cMist, 0.45)); props.tri(q1, q2, ap, mix(cTeal, cSage, 0.7)); props.tri(q2, q3, ap, mix(cMist, cCream, 0.2).multiplyScalar(0.9)); props.tri(q3, q0, ap, mix(cTeal, cSage, 0.7));
    }
    // pond rim: ink inner lip, pale top, dark outer slope (skips the gate notch)
    const NR = 96, an = Math.asin(11.2 / POND_R);
    const rp = (a, r, y) => V(pondC.x + r * Math.sin(a), y, pondC.z + r * Math.cos(a));
    for (let i = 0; i < NR; i++) {
      const a = an + (Math.PI * 2 - 2 * an) * i / NR, b = an + (Math.PI * 2 - 2 * an) * (i + 1) / NR;
      props.quad(rp(a, POND_R - 0.1, waterY - 0.06), rp(b, POND_R - 0.1, waterY - 0.06), rp(b, POND_R + 0.25, waterY + 0.3), rp(a, POND_R + 0.25, waterY + 0.3), cInk);
      props.quad(rp(a, POND_R + 0.25, waterY + 0.3), rp(b, POND_R + 0.25, waterY + 0.3), rp(b, POND_R + 0.95, waterY + 0.3), rp(a, POND_R + 0.95, waterY + 0.3), mix(cSage, cMist, i % 5 === 0 ? 0.6 : 0.85));
      props.quad(rp(a, POND_R + 0.95, waterY + 0.3), rp(b, POND_R + 0.95, waterY + 0.3), rp(b, POND_R + 1.5, waterY - 0.2), rp(a, POND_R + 1.5, waterY - 0.2), mix(cInk, cDeep, 0.6));
    }
  }
  // ---------------- rim cedars: stacked dark triangles, swaying, bowing to the breeze ----------------
  {
    const nC = opts.cedars ?? 520;
    await ctx.yield();
    for (let i = 0; i < nC; i++) {
      if ((i & 127) === 127) await ctx.yield();
      const ph = rng.range(-PHI + 0.03, PHI - 0.03); if (Math.abs(ph) < 0.03) continue;
      const st = skirtTop(ph), onCrest = st.kt === K;
      const back = !onCrest || rng.chance(0.45), dr = back ? rng.range(onCrest ? 18 : 3, onCrest ? 80 : 45) : rng.range(3, 15);
      const r = (onCrest ? rc(ph, K) : st.r) + dr, y0 = !back ? RIDGE_Y + 0.3 : st.y - (onCrest ? dr - 16 : dr) * 0.45 - 1.5;
      const h = rng.range(20, 35), R = h * rng.range(0.17, 0.23), b = P(ph, r, y0), rot = rng.range(0, 6.28), lean = rng.range(-0.6, 0.6);
      if (opts.keepOut && opts.keepOut(b.x, b.z, R, onCrest ? dr : 999)) continue;
      const tw = 0.6; props.quad(V(b.x - tw, b.y, b.z), V(b.x + tw, b.y, b.z), V(b.x + tw * 0.5, b.y + h * 0.3, b.z), V(b.x - tw * 0.5, b.y + h * 0.3, b.z), cInk);
      for (let t = 0; t < 3; t++) {
        const yb = b.y + h * (0.16 + 0.25 * t), yt = t === 2 ? b.y + h : yb + h * 0.44, rr = R * (1 - 0.26 * t);
        const s0 = Math.pow((yb - b.y) / h, 2), s1 = Math.pow((yt - b.y) / h, 2), tip = V(b.x + lean * (yt - b.y) / h, yt, b.z);
        for (let q = 0; q < 5; q++) {
          const a0 = rot + q * 1.2566, a1 = a0 + 1.2566, am = a0 + 0.6283;
          const col = Math.cos(am) > 0.25 ? mix(cInk, cDeep, 0.85) : Math.sin(am) > 0.3 ? mix(cInk, cDeep, 0.3) : cInk.clone().multiplyScalar(0.8);
          props.tri(V(b.x + Math.sin(a0) * rr, yb, b.z + Math.cos(a0) * rr), V(b.x + Math.sin(a1) * rr, yb, b.z + Math.cos(a1) * rr), tip, col, s0, s0, s1);
        }
      }
    }
  }
  await ctx.yield();
  const propMesh = new THREE.Mesh(props.build(), flatMat(THREE.DoubleSide)); propMesh.name = 'gate-and-cedars';
  propMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 150, 0), 900); group.add(propMesh);
  await ctx.yield();

  // ---------------- falls down the fall line: scrolling cream stripes ----------------
  const streamLine = [];
  {
    const pos = [], uv = [], ix = []; let ph = 0.05;
    for (let k = K; k >= 1; k--) {
      ph = (k === kb || k === kb + 1) ? 0 : clamp(ph + rng.range(-0.012, 0.012), -0.08, 0.08);
      const dy = ys[k] - ys[k - 1], rI = rc(ph, k) - 0.3, w = (k === kb ? 3.2 : rng.range(1.3, 2.6)) * 0.5;
      const tx = Math.cos(ph), tz = Math.sin(ph), a = P(ph, rI, ys[k] + 0.5), b = P(ph, rI - BATTER * dy - 0.25, ys[k - 1] + 0.05), n = pos.length / 3, sd = rng.range(0, 10);
      streamLine.push(a.clone());
      pos.push(a.x - tx * w, a.y, a.z - tz * w, a.x + tx * w, a.y, a.z + tz * w, b.x + tx * w * 1.25, b.y, b.z + tz * w * 1.25, b.x - tx * w * 1.25, b.y, b.z - tz * w * 1.25);
      uv.push(0, sd, 1, sd, 1, sd + dy, 0, sd + dy); ix.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix);
    const falls = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: mkU(), fog: true, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: COMMON_F + /* glsl */`varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_fragment>
        void main(){
          float lane = floor(vUv.x * 5.), fx = fract(vUv.x * 5.);
          float run = step(fract(vUv.y * .32 - uTime * (.55 + .12 * lane) + lane * .37), .62);
          float on = step(abs(fx - .5), .3) * run;
          vec3 col = mix(mix(cDeep, cTeal, .7), cCream * 1.25, on);
          gl_FragColor = vec4(finish(col, vW, on), 1.);
          #include <fog_fragment>
        }`,
    })); falls.name = 'falls'; group.add(falls);
  }
  // ---------------- valley mist: two flat scalloped sheets ----------------
  if (opts.mist !== false) {
    const mk = (y, rho, tone, seed) => {
      const g = new THREE.PlaneGeometry(1700, 1900, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, y, 520);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: mkU({ uRho: { value: rho }, uTone: { value: tone }, uSeed: { value: seed } }), fog: true, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`varying vec3 vW; varying vec2 vL;
          #include <fog_pars_vertex>
          void main(){ vL = position.xz; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: COMMON_F + /* glsl */`uniform float uRho, uTone, uSeed; varying vec3 vW; varying vec2 vL;
          #include <fog_pars_fragment>
          void main(){
            float wide = uRho * (1. + max(vL.y, 0.) * .0022);
            float d = vL.y > 0. ? abs(vL.x) : length(vL);
            float along = vL.y > 0. ? vL.y : atan(vL.x, vL.y) * uRho;
            float sc = 16. * abs(sin(along * .034 + uSeed + uTime * .03)) + 7. * abs(sin(along * .09 + uSeed * 2.));
            if (d + sc > wide || vL.y + 26. * abs(sin(vL.x * .03 + uSeed)) > 430.) discard;
            // bokashi: inside the hard scalloped edge the tone is wiped up softly toward the middle of the band
            float core = 1. - smoothstep(wide - 70., wide - 8., d + sc * 1.6);
            vec3 col = mix(mix(cSage, cMist, uTone) * .4, cMist * .56, core);
            gl_FragColor = vec4(finish(col, vW, 0.), .42 + .3 * core);
            #include <fog_fragment>
          }`,
      })); m.renderOrder = 3; m.name = 'valley-mist'; group.add(m);
    };
    mk(12, 150, 0.55, rng.range(0, 6)); mk(22, 92, 0.8, rng.range(0, 6));
  }

  // ---------------- anchors ----------------
  const rimR = rc(0, K);
  const fly = [V(0, RIDGE_Y + 2, -(rimR + 15)), V(0, RIDGE_Y + 2.2, -(rimR + 1))];
  for (let k = K - 1; k > kb; k -= 3) fly.push(V(lerp(0, 5, (K - k) / (K - kb)), ys[k] + 5.5, -(rc(0, k) + 3)));
  fly.push(V(5, BENCH_Y + 2.2, pondC.z - POND_R - 26), V(2, waterY + 1.8, pondC.z - POND_R - 2), V(0, waterY + 3.4, pondC.z),
    V(0, waterY + 6.6, pondC.z + 17), G.clone(), V(0, G.y, gateZ + 40));
  const heightAt = (x, z) => {
    const r = Math.hypot(x, z), ph = clamp(Math.atan2(x, -z), -PHI, PHI), st = skirtTop(ph);
    if (r > st.r) return Math.max(-6, st.y - (r - st.r) * 0.45);
    for (let k = st.kt; k >= 0; k--) if (r >= rc(ph, k)) return ys[k];
    return -5.5;
  };
  const moonDir = V(0, Math.sin(30 * Math.PI / 180), Math.cos(30 * Math.PI / 180));
  const anchors = {
    portalSeat: { position: G.clone(), facing: V(0, 0, -1), normal: V(0, 0, -1), radius: RING_RI },
    flyThrough: fly,
    viewpoints: { reveal: V(0, RIDGE_Y + 2.2, -(rimR + 1)), overPond: V(0, waterY + 3.4, pondC.z), across: V(rimR * 0.55, BENCH_Y + 40, -rimR * 0.2) },
    ridgeEntry: V(0, RIDGE_Y + 0.42, -(rimR + 15)),
    pondCenter: pondC.clone(), pondRadius: POND_R, benchY: BENCH_Y, waterY, gateBase: V(0, waterY, gateZ),
    farmhouseSeat: V(46, BENCH_Y, pondC.z - 22), camphorSeat: V(58, BENCH_Y, pondC.z - 2), wheelSeat: V(-9, BENCH_Y, pondC.z - POND_R - 16),
    streamLine, moonDir, paddies, heightAt, levels: ys, topLevel: K, benchLevel: kb,
    // dyke-top point of level k at plan angle phi (0 = fall line, + toward +X), pushed dr metres uphill
    contour: (phi, k, dr = 0, out = new THREE.Vector3()) => P(phi, rc(phi, k) + dr, ys[k] + 0.42, out),
    radiusAt: (phi, k) => rc(phi, k), outerAt: (phi, k) => rOuter(phi, k), phiEnd,
    breeze: { speed: 25, zStart: -(R0 + 60), zEnd: R0 + 140 },
  };

  // ---------------- behaviour ----------------
  let driven = false, ripI = 0; const wv = new THREE.Vector3();
  const hero = {
    object: group, radius: 70, height: 120, center: V(0, 200, 40), extent: { radius: 400, skirtRadius: 760, height: 285 }, anchors, uniforms: U, ground: true, groundY: -6,
    setProgress(p) { driven = true; U.uFront.value = lerp(anchors.breeze.zStart, anchors.breeze.zEnd, clamp(p, 0, 1)); },
    setBreezeFront(z) { driven = true; U.uFront.value = z; },
    plop(x, z, time = U.uTime.value) {
      const hy = heightAt(x, z); let best = null, bd = 1e9;
      for (const q of paddies) { if (Math.abs(q.y - hy) > 0.01) continue; const d = (q.x - x) * (q.x - x) + (q.z - z) * (q.z - z); if (d < bd) { bd = d; best = q; } }
      if (best) U.uRipC.value[ripI].set(best.x, best.z); else U.uRipC.value[ripI].set(1e5, 1e5);
      wv.set(x, 0, z); group.localToWorld(wv); U.uRip.value[ripI].set(wv.x, wv.z, time, 0); ripI = (ripI + 1) % 8;
    },
    setLantern(worldPos, radius = 12) { U.uLantern.value.set(worldPos.x, worldPos.y, worldPos.z, radius); },
    update(dt, time) {
      U.uTime.value = time;
      if (!driven) U.uFront.value = anchors.breeze.zStart + ((time * 25) % (anchors.breeze.zEnd - anchors.breeze.zStart + 150));
    },
    dispose() {},
  };
  return hero;
}
