// Hero set piece of "upward-falls": the water going the wrong way. The waterfalls come down a granite wall as braids
// of white strands on dark wet rock, from lip to foot, and end in mist. A gale takes each in turn: the lip and the upper
// part keep pouring, the strands below bow sideways downwind, fray and lift into a plume of spray that climbs the wet
// chute, clears the rim and streams off down the wind above the wall as a long banner, gold-white where the low sun
// finds it and blue-grey in the rock's shade; then the water comes back down the rock.
//
// THE CLIMBING WATER is one body with one root, from the failing strands to the banner's end. Every fall has a line
// of its own on the wet rock beside its column, downwind of it, from a little under the kink to the rim, and ONE WAY
// off the rim: straight on up, then over and away down the wind, rising (45 to 75 m for a shore or bench fall, twice
// that for the long fall). By that line and that way go: a PLUME of veils of spray (the mist's banner puffs: each
// drawn out three to five times its breadth along the flow, streaked along it, dense at its core and feathered at
// its edge; two in five sheathe the chute, three in five are the banner and are torn as they go); inside it a ROPE of
// many thin filaments that twist round the line, cross and part, each its own length, each coming apart into beads;
// and DROPS in thousands, round beads with a short streak, that leave the banner and fall out of it in arcs. All of
// it shows only as the gale law says the fall is failing there, and its grain runs up it at half the front's speed.
// WHERE THIS FILE READS THE EYE (its place only, never where it looks): every ribbon (strand, filament), every veil
// and every drop is turned about its own run to face the eye's place; a ribbon is kept at least a pixel and a half
// (a drop a pixel and a third) wide at its distance, a filament and a drop fainter by as much (and a filament thins
// to a thread between its knots only where it has more than that least breadth); a puff steps toward the
// eye by a third of its size; the filaments, the drops and the mist are shaded by the direction from the water to the
// eye (the round of a filament, the light through spray against the sun, the bow), the same law at every place.
// BY PLACE, AT THE BUILD (not by the eye): a filament or a drop whose whole way would come within 25 m of the flown
// line is not made, as the puffs' older guard has it for the mist.
//
// ONE GALE LAW drives all of it, in the world's own time: a train of gust fronts runs up the bay, one every `period`
// seconds, `wave` metres apart. tau(place) = seconds since the last front crossed that place. Everything (each fall's
// state, its mist, the dark sheet the lake draws) is a pure function of tau, so any moment can be posed and the world
// is already alive when it is only seen through a portal.
//
// SPACE: the world's own (the object is not moved): +X is out over the lake, -Z is up the bay (the way the gale runs),
// y = 0 is the lake.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, uniforms, gale, facts, update(dt, time), dispose() }
// (opts are listed above the function, with ropeRng and a fall's seep; detail scales the drops as well as the puffs; facts.mistClear is the least clear air any mist keeps from the flown line,
// facts.ropeClear the least any rope ribbon or drop keeps, its width and whip counted; ropes, drops: how many were made)
import * as THREE from 'three';

const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ---------- shared GLSL: noise from one tileable texture (its mip chain smooths it to the pixel's footprint) ----------
export const GLSL_NOISE = /* glsl */`
uniform sampler2D tNoise;
float nR(vec2 p){ return texture2D(tNoise, p).r; }
float nG(vec2 p){ return texture2D(tNoise, p).g; }
float nB(vec2 p){ return texture2D(tNoise, p).b; }
float nA(vec2 p){ return texture2D(tNoise, p).a; }
`;

// ---------- shared GLSL: the gale law ----------
// uGale: x = the world's clock as a share of the period (0..1), y = the period (s), z = 1 / the distance between
// fronts (1/m), w = how far the front leans (metres along the bay per metre out from the wall)
export const GLSL_GALE = /* glsl */`
uniform vec4 uGale;
float galeRun(vec2 xz){ return -xz.y + uGale.w * xz.x; }                               // metres along the gale's run
float galeTau(vec2 xz){ return fract(uGale.x - galeRun(xz) * uGale.z) * uGale.y; }     // seconds since the front crossed
float galeTauRun(float run){ return fract(uGale.x - run * uGale.z) * uGale.y; }
// the gust itself: slams in behind the front, blows for three quarters of the period, dies away; then a lull of some
// four seconds before the next front
float galeGust(float tau){ return smoothstep(0., .35, tau) * (1. - smoothstep(uGale.y * .68, uGale.y * .82, tau)); }
// how far a fall has failed: the gust has it within two seconds of the front, holds it six tenths of the period, lets it
// go over the next three seconds: it is down again and pouring through the lull, until the next front takes it
float galeFail(float tau){ return smoothstep(.2, 1.9, tau) * (1. - smoothstep(uGale.y * .6, uGale.y * .6 + 2.8, tau)); }
`;

// ---------- shared GLSL: sun, sky fill, the lake's bounce, and the shadows of the scud racing over everything ----------
export const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce; uniform float uTime; uniform vec4 uScud;   // uScud: wind x, wind z (m/s), amount, 1 / size
float scudShade(vec3 wp){
  vec2 p = (wp.xz + uSunDir.xz * ((700. - wp.y) / max(uSunDir.y, .12)) - uScud.xy * uTime) * uScud.w;
  float n = nR(p) * .62 + nG(p * 2.7 + .31) * .38;
  return 1. - uScud.z * smoothstep(.5, .64, n);
}
`;

// the same law for the processor
export function makeGale(o = {}) {
  const g = { period: o.period ?? 19.5, wave: o.wave ?? 1250, skew: o.skew ?? 0.45, phase: 0,
    uniform: { value: new THREE.Vector4(0, o.period ?? 19.5, 1 / (o.wave ?? 1250), o.skew ?? 0.45) },
    // (`start`: the second of the world's clock at which a front leaves the place where run = 0)
    start: o.start ?? 0,
    set(time) { const f = (time - g.start) / g.period; g.phase = f - Math.floor(f); g.uniform.value.x = g.phase; },
    run: (x, z) => -z + g.skew * x,
    tauRun: (run) => { const f = g.phase - run / g.wave; return (f - Math.floor(f)) * g.period; },
    tau: (x, z) => g.tauRun(-z + g.skew * x),
    gust: (tau) => sstep(0, 0.35, tau) * (1 - sstep(g.period * 0.68, g.period * 0.82, tau)),
    fail: (tau) => sstep(0.2, 1.9, tau) * (1 - sstep(g.period * 0.6, g.period * 0.6 + 2.8, tau)),
  };
  return g;
}

// ---------- one tileable noise texture: R, G two soft fractal fields, B a ridged one (cracks, crests), A fine grain ----------
export async function makeNoiseTexture(rng, yieldFn, anisotropy = 4) {
  const S = 256, lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const LR = [lat(8), lat(16), lat(32), lat(64)], LG = [lat(8), lat(16), lat(32), lat(64)], LB = [lat(8), lat(16), lat(32)], LA = [lat(32), lat(64), lat(128)];
  const samp = (a, n, x, y) => { const fx = x * n, fy = y * n, ix = Math.floor(fx), iy = Math.floor(fy); let u = fx - ix, v = fy - iy; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    const i0 = ix % n, i1 = (ix + 1) % n, j0 = iy % n, j1 = (iy + 1) % n; return mix(mix(a[j0 * n + i0], a[j0 * n + i1], u), mix(a[j1 * n + i0], a[j1 * n + i1], u), v); };
  const data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, k = (y * S + x) * 4;
      const r = samp(LR[0], 8, u, v) * 0.5 + samp(LR[1], 16, u, v) * 0.27 + samp(LR[2], 32, u, v) * 0.15 + samp(LR[3], 64, u, v) * 0.08;
      const g = samp(LG[0], 8, u, v) * 0.5 + samp(LG[1], 16, u, v) * 0.27 + samp(LG[2], 32, u, v) * 0.15 + samp(LG[3], 64, u, v) * 0.08;
      const b0 = 1 - Math.abs(2 * samp(LB[0], 8, u, v) - 1), b1 = 1 - Math.abs(2 * samp(LB[1], 16, u, v) - 1), b2 = 1 - Math.abs(2 * samp(LB[2], 32, u, v) - 1);
      const a = samp(LA[0], 32, u, v) * 0.5 + samp(LA[1], 64, u, v) * 0.3 + samp(LA[2], 128, u, v) * 0.2;
      data[k] = 255 * sat((r - 0.5) * 1.5 + 0.5); data[k + 1] = 255 * sat((g - 0.5) * 1.5 + 0.5); data[k + 2] = 255 * sat(b0 * b0 * 0.55 + b1 * b1 * 0.3 + b2 * b2 * 0.15); data[k + 3] = 255 * sat((a - 0.5) * 1.4 + 0.5);
    }
    if ((y & 3) === 3 && yieldFn) await yieldFn();
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = anisotropy; t.needsUpdate = true;
  return t;
}

// ---------- the falling water: strands of ribbon laid down the rock, their width turned to the eye's place ----------
// position: a place on the rock under the strand; aTan: the way the strand runs there; aS: side of the ribbon (-1, +1),
// t (0 at the lip, 1 at the foot, by height), seed, how far the water breaks there (0 on a riser, 1 on a ledge);
// aF: the gale's run at the fall, the fall's height, the share of it that always pours, the ribbon's half-width;
// aW: downwind along the rock face (x, z), how far the blown water bows that way (m), 1 for one of the broad thin
// sheets that lie behind the strands.
// Rows under the kink are in the wind's hand: they bow sideways downwind, spread to a veil and fray to nothing (the mist
// takes over from them). As the gust lets go the kink sinks back to the foot: the water comes down the rock again.
function strandMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec3 aTan; attribute vec4 aS, aF, aW; attribute float aL;
      uniform float uPx, uTime;
      ${GLSL_GALE}
      varying vec2 vUv; varying vec4 vI; varying vec3 vW; varying float vH, vK, vL;
      #include <fog_pars_vertex>
      void main(){
        float t = aS.y, sr = aS.z, H = aF.y;
        float fail = galeFail(galeTauRun(aF.x)), tk = mix(1.08, aF.z, fail);
        float below = max(t - tk - .03 * sr, 0.), w = smoothstep(0., .14, below);
        vec3 pos = position;
        pos.xz += aW.xy * aW.z * (below * 1.8 + below * below * 6.) * (.7 + .6 * sr);
        pos.y += H * below * .8 * w;
        vec3 along = normalize(aTan + vec3(aW.x, .0, aW.y) * 1.2 * w);
        // the ribbon: broader where the water breaks on a ledge and where the wind spreads it, never thinner than a pixel
        // and a half; its width lies across its own run and is turned to the eye's place
        vec3 toEye = cameraPosition - pos; float dist = length(toEye);
        float hw = max(aF.w * (1. + 1.1 * aS.w + 6. * w) * mix(1. - .3 * t, 1. + .6 * t, aW.w), dist * uPx * .75);
        vec3 ax = normalize(cross(along, toEye) + vec3(1e-5, 0., 0.));
        pos += ax * hw * aS.x;
        vUv = vec2(aS.x, t); vW = pos; vH = H; vK = aW.w; vL = aL;
        vI = vec4(w, below, sr, aS.w);
        vec4 mvPosition = viewMatrix * vec4(pos, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec4 vI; varying vec3 vW; varying float vH, vK, vL;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main(){
        float across = vUv.x, t = vUv.y, w = vI.x, below = vI.y, sr = vI.z, br = vI.w;
        // the water's own grain runs down the strand, faster the further it has fallen; in the wind it slows and stops
        float ph = sqrt(max(t + .02, 0.) * vH) * .2 - uTime * sqrt(max(vH, 0.)) * .045 * (1. - w);
        float n = nA(vec2(sr * 7.3 + across * .07, ph)), nb = nR(vec2(sr * 3.1 + across * .15, ph * .37 + .3));
        float edge = 1. - smoothstep(mix(.62, 0., w), 1., abs(across));          // (in the wind it has no edge: a veil)
        // streaks with rock showing between them on a riser, a whole white sheet where it breaks on a ledge
        float body = mix(.62 + .38 * smoothstep(.3, .62, n), 1., br);
        // (a sheet: broad soft streaks, thinner than a strand)
        body = mix(body, (.34 + .66 * smoothstep(.3, .7, nA(vec2(sr * 5.1 + across * .8, ph * .7)))) * mix(.62, .9, br), vK);
        // torn where the wind has had it longest, gone a little way under the kink
        float fray = 1. - smoothstep(.0, .075, below + (nb - .5) * .05 * w);
        body = mix(body, .5 + .5 * nb, w);
        float a = edge * body * fray * (1. - .72 * w);
        // (white water in the sun is warm and bright; in the rock's shade it has only the sky's blue)
        vec3 lit = uSunCol * (.08 + .92 * vL * scudShade(vW)) + uSkyCol * 1.15 + vec3(.03, .04, .055);
        vec3 col = mix(vec3(.8, .89, .93), vec3(1.03), max(n, br)) * lit;
        // the lip: glassy, the lake's colour seen through it, with bright threads
        float glass = 1. - smoothstep(3. / vH, 10. / vH, t);
        col = mix(col, (vec3(.3, .58, .58) + vec3(.6) * smoothstep(.55, .75, n)) * lit, glass * .7);
        a = mix(a, edge * .93, glass);
        #ifdef USE_FOG
          col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
        gl_FragColor = vec4(col * a, a);
      }` });
}

// ---------- mist and spray: soft puffs, each a small square turned to the eye's place, riding a track of its own ----------
// iP0..iP3: the track (a curve pulled by four places); iL: the sun's share at those four places (baked: a puff in the
// rock's shade is blue-grey, one the sun finds is gold-white);
// iM: the gale's run at the fall (at its own place for kind 4), where in its round the puff is at time 0, its size (m),
// rounds a second; iN: seed, strength, how much it swells, kind:
// 0: the banner: spray torn off a failing fall's lower strands; it climbs the wet chute, clears the rim and streams off
//    down the wind above the wall, thinning to nothing. A puff is there only if its fall was failing when it left the
//    water and is failing still, so the banner hangs from its fall and goes when the water comes back down;
// 1: the mist standing at a fall's foot while the water reaches it; 2: a burst where water that always pours breaks
//    on a ledge; 3: the smoke where a failing fall's strands come apart, so that no strand is seen to end;
// 4: spray smoke on the lake, low and wide: it rises where the gust front is passing and lies down behind it.
function mistMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec3 iP0, iP1, iP2, iP3; attribute vec4 iM, iN, iL;
      uniform float uTime; uniform vec3 uSunDir;
      ${GLSL_GALE}
      varying vec2 vUv, vE; varying vec3 vW; varying vec4 vS; varying float vSun;
      #include <fog_pars_vertex>
      void main(){
        float age = fract(iM.y + uTime * iM.w), lap = 1. / iM.w, tau = galeTauRun(iM.x), k = 1. - age, kind = iN.w;
        vec4 bz = vec4(k * k * k, 3. * k * k * age, 3. * k * age * age, age * age * age);
        vec3 c = iP0 * bz.x + iP1 * bz.y + iP2 * bz.z + iP3 * bz.w;
        float size = iM.z * (.55 + iN.z * age), fail = galeFail(tau), str;
        // (a veil on the chute goes with the failing water and is gone at the rim; a veil of the banner (kind 0.3) leaves
        // the rim a second and a half after its fall failed, the time the water takes up the chute, and thins all its way)
        if (kind < .2) str = galeFail(tau - age * lap) * fail * smoothstep(.03, .18, age) * (1. - smoothstep(.7, 1., age));
        else if (kind < .5) str = galeFail(tau - age * lap - 1.5) * fail * smoothstep(0., .1, age) * (1. - smoothstep(.4, 1., age));
        // (no water reaches the foot of a blown fall: its foot's cloud goes while it is held)
        else if (kind < 3.5) str = (kind < 1.5 ? 1. - fail : (kind < 2.5 ? 1. : fail)) * smoothstep(0., .15, age) * (1. - smoothstep(.5, 1., age));
        else str = smoothstep(0., .4, tau) * (1. - smoothstep(1.2, 4.2, tau)) * smoothstep(0., .2, age) * (1. - smoothstep(.45, 1., age));
        vec3 toEye = cameraPosition - c; float dist = length(toEye); toEye /= max(dist, 1e-3);
        c += toEye * min(size * .3, dist * .3) * step(kind, 3.5);                  // it stands clear of the rock it climbs
        vec3 rt = normalize(cross(vec3(0., 1., 0.), toEye) + vec3(1e-5, 0., 0.)), up = cross(toEye, rt);
        // a puff of a fall's mist is a wisp drawn out along its own way (the track's run there, seen square to the eye);
        // smoke on the lake lies flat
        vec3 tg = (iP1 - iP0) * k * k + 2. * (iP2 - iP1) * k * age + (iP3 - iP2) * age * age;
        vec3 sx = normalize(cross(tg, toEye) + vec3(1e-5, 0., 0.)), sy = cross(toEye, sx);
        // (a veil of the banner is nearly five times as long as it is broad, drawn out along the flow)
        // (on the chute; off the rim a veil is broader, three times as long as broad)
        vec3 pos = kind < .5 ? c + (sx * position.x * mix(.5, .66, step(.2, kind)) + sy * position.y * mix(2.4, 2., step(.2, kind))) * size : (kind < 3.5 ? c + (sx * position.x + sy * position.y * 1.7) * size : c + (rt * position.x + up * position.y * .17) * size);
        vE = vec2(sx.y, dot(sx, uSunDir));                                           // which of its long edges is the upper one, which looks to the sun
        float a3 = age * 3.; vSun = a3 < 1. ? mix(iL.x, iL.y, a3) : (a3 < 2. ? mix(iL.y, iL.z, a3 - 1.) : mix(iL.z, iL.w, a3 - 2.));
        vUv = position.xy; vW = pos; vS = vec4(iN.x, str * iN.y, age, iN.w);
        vec4 mvPosition = viewMatrix * vec4(pos, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv, vE; varying vec3 vW; varying vec4 vS; varying float vSun;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main(){
        float r2 = dot(vUv, vUv), seed = vS.x;
        // a puff is thin: thickest at its middle, gone well inside its own square; a plume is many of them, one over
        // another, so that it is thinner at its edges than at its heart and what stands behind shows through
        float g = exp(-r2 * 3.) * (1. - smoothstep(.55, 1., r2));
        // billows drifting up through the puff eat it from its edge inward
        float n = nR(vUv * .23 + seed * vec2(3.1, 7.7) - vec2(0., uTime * .05)) * .6 + nG(vUv * .55 + seed * 5.3 - vec2(uTime * .02, uTime * .11)) * .4;
        // (the banner's spray is a veil drawn out along its own way: dense at its core, feathering to nothing at its edge,
        // streaked along the flow, the streaks running on down the wind; the rock or the sky is seen between them)
        float veil = 1. - step(.5, vS.w), x2 = vUv.x * vUv.x, y2 = vUv.y * vUv.y;
        g = mix(g, exp(-(x2 * 2.6 + y2 * 1.7)) * (1. - smoothstep(.5, 1., max(x2, y2))), veil);
        float sv = nA(vec2(vUv.x * .21 + seed * 3.1, vUv.y * .05 - uTime * .2 + seed * 7.7)) * .55 + nR(vec2(vUv.x * .37 + seed * 5.3, vUv.y * .085 - uTime * .31)) * .45;
        n = mix(n, sv, veil);
        // (a banner's veil is torn as it goes: whole near the rim, streaks and rags toward its end)
        float torn = veil * step(.2, vS.w) * vS.z * vS.z * .2;
        float a = g * smoothstep(mix(.3, .33, veil) + torn, mix(.78, .7, veil) + torn, n + g * mix(.36, .32, veil)) * vS.y * mix(1.25, 1.2, veil);
        vec3 V = normalize(cameraPosition - vW);
        // thin water in the air: in the rock's shade it has the sky's blue-grey; where the sun finds it it is gold-white,
        // and brightest when the sun stands behind it
        float fwd = pow(max(dot(-V, uSunDir), 0.), 5.), lit = vSun * mix(1., scudShade(vW), .7);
        // (a veil has a body: its edge toward the sun is lit, its heart and its under side keep the sky's blue-grey, and
        // the densest streaks in it are the brightest)
        float body = (1. + .4 * clamp(vUv.x * vE.y * 1.6, -1., 1.)) * (1. - .55 * smoothstep(.15, .55, g * n)) * (1. - .35 * clamp(-vUv.x * vE.x * 1.6, 0., 1.)) + .5 * smoothstep(.56, .8, sv);
        vec3 col = uSkyCol * 1.3 + vec3(.04, .05, .07) + uSunCol * (.6 + .16 * n + 1.1 * fwd) * (.05 + .95 * lit) * mix(1., body, veil);
        // a bow where it stands at the bow's angle from the point opposite the sun
        float bw = dot(V, uSunDir), bow = smoothstep(.722, .74, bw) * (1. - smoothstep(.766, .784, bw)) * lit;
        col += vec3(1. - smoothstep(.738, .758, bw), 1. - smoothstep(0., .015, abs(bw - .752)), smoothstep(.746, .766, bw)) * bow * .9 * uSunCol;
        #ifdef USE_FOG
          col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
        gl_FragColor = vec4(col * a, a);
      }` });
}

// ---------- the climbing water: the rope a blown fall sends back up its chute, and the banner it throws off the rim ----------
// A rope is many thin ribbons (filaments) twisted round one line, inside the mist's plume of veils. The line is laid on
// the rock from a little under the kink (yBot) up the wet chute beside the falling column, a little downwind of it and leaning further
// downwind as it climbs, then leaves the rim and bends away down the wind. It is seen only above the kink of the
// falling column (the same kink, by the same law, as the strands'), and its lowest rows are drawn in to the column's own
// places, so that the column is seen to bend and climb: one thing from the lip, down, round and up to the banner.
// position: a place of the ribbon's middle; aTan: the way it runs there; aN: level across it (on the rock: along the wall);
// aS: side (-1, +1), the fall's size (its banner whips so many times as far as a bench fall's), seed, nought (unread); aF: the gale's run at the fall, metres along the rope from its
// lowest row, the ribbon's half-width (m), the share of the fall that always pours; aW: from the place to the column's own place
// at that height (x, y, z), the sun's share; aG: the row's share of the fall's height (0 at the lip, 1 at the foot; less
// than 0 off the rim), metres beyond the rim, how far along the banner (0 on the rock .. 1 at its end), the fade over the rope's
// lowest three rows (0 at the lowest .. 1 from the fourth up).
// The water's grain (streaks along the flow, knots) runs UP the rope at half the gust front's own speed; the banner
// whips in waves that run out along it at the same speed, harder while the gust blows; a row beyond the rim is there
// only if the fall was failing when its water left the rim and is failing still.
function ropeMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec3 aTan, aN; attribute vec4 aS, aF, aW, aG;
      uniform float uPx, uTime;
      ${GLSL_GALE}
      varying vec2 vUv, vL; varying vec4 vI; varying vec3 vW, vAx;
      #include <fog_pars_vertex>
      void main(){
        float sr = aS.z, e = aG.z, m = aF.y;
        float tau = galeTauRun(aF.x), fail = galeFail(tau), tk = mix(1.08, aF.w, fail), above = tk - aG.x;
        float speed = .5 / (uGale.z * uGale.y);
        float str = galeFail(tau - aG.y * .5 / speed) * fail * smoothstep(0., .035, above) * aG.w;     // (off the rim the spray goes at the front's own speed)
        vec3 pos = position + aW.xyz * (1. - smoothstep(0., .13, above));          // the rope leaves the column at its kink
        // it writhes on the rock and whips off the rim: waves that run up it with the water
        float ph = (m - uTime * speed) * .05 + sr * 6.283, wob = (.3 + 5.5 * e) * aS.y * (.55 + .45 * galeGust(tau));
        pos += aN * sin(ph + 1.5 * sin(ph * .37)) * wob * mix(.25, 1., smoothstep(0., .12, e)) + cross(aTan, aN) * cos(ph * 1.31 + 1.7) * wob * .6 * smoothstep(0., .12, e);
        vec3 toEye = cameraPosition - pos; float dist = length(toEye);
        // (knots of water travel up it: it swells and thins as they pass; never thinner than a pixel and a half)
        float hw = max(aF.z * (1. + .35 * sin((m - uTime * speed) * .16 + sr * 40.)), dist * uPx * .75) * step(.004, str);
        vec3 ax = normalize(cross(aTan, toEye) + vec3(1e-5, 0., 0.));
        pos += ax * hw * aS.x;
        str *= clamp(aF.z / max(hw, 1e-4) * 1.4 + .3, 0., 1.);                       // (where the pixel's breadth has widened it, it is fainter)
        // (vL.y: 1 where the ribbon has its own breadth, 0 where it is as narrow as it may be drawn)
        vUv = vec2(aS.x, m); vW = pos; vAx = ax; vL = vec2(aW.w, clamp(aF.z / max(hw, 1e-4) * 2. - .7, 0., 1.)); vI = vec4(str, e, sr, speed);
        vec4 mvPosition = viewMatrix * vec4(pos, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv, vL; varying vec4 vI; varying vec3 vW, vAx;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main(){
        float a = vUv.x, str = vI.x, e = clamp(vI.y, 0., 1.), sr = vI.z, core = 0., fl = vUv.y - uTime * vI.w;
        // (its edge wanders as the water runs: no straight side)
        a += (nR(vec2(sr * 5.3, fl * .013)) - .5) * mix(.3, .5, core) * (1. - a * a);
        // (and no even breadth: a knot of water fills its ribbon, the stretch between two knots is a thread less than half as
        // broad, and knots and threads run up it with the water)
        a /= mix(1., mix(.42, 1., smoothstep(.3, .62, nR(vec2(sr * 3.1, fl * .0041)) * .65 + nA(vec2(sr * 6.7, fl * .011)) * .35)), vL.y);
        float cyl = sqrt(max(1. - a * a, 0.));
        // streaks along the flow, and knots: both run up the rope
        float st = nA(vec2(a * mix(.016, .034, core) + sr * 7.3, fl * .0026)), st2 = nA(vec2(a * mix(.011, .021, core) + sr * 3.7, fl * .0063 + .4));
        float knot = nR(vec2(sr * 3.1 + a * .012, fl * .0041));
        float dens = (st * .6 + st2 * .4) * .75 + knot * .5, rag = nA(vec2(a * .045 + sr * 1.7, fl * .0085 + .7));
        // whole near the rock, its sides ragged with tufts of spray; torn to strands as it goes, the strands to beads
        float tear = smoothstep(0., 1., e), th = mix(.16, .46, tear);
        float body = smoothstep(th, th + .26, dens * (.5 + .5 * cyl) + (rag - .5) * .4 * (1. - cyl));   // (soft: spray, not cord)
        // (a filament is no even cord: thick knots of water and thin stretches between them, travelling; toward its end
        // it comes apart into a chain of beads, each its own length, and the last of them fly on alone)
        float bead = smoothstep(.42, .6, nA(vec2(sr * 9.1, fl * .0075)) * .7 + nR(vec2(sr * 4.3, fl * .0031)) * .3);
        body *= mix(.3, 1., smoothstep(.3, .52, knot)) * mix(1., bead, smoothstep(.12, .6, e));
        float al = body * str * .97 * (1. - smoothstep(.8, 1., e)) * (1. - smoothstep(.8, 1., abs(a))) * mix(mix(.6, 1., cyl), cyl * cyl, vL.y);   // (its edge feathers where it has breadth to)
        // a body of white water: its side toward the sun is lit, its heart and its under side keep the sky's blue-grey;
        // against the sun its thin edge is bright and its heart dark
        vec3 V = normalize(cameraPosition - vW), N = normalize(vAx * a * .95 + V * max(cyl, .15));
        float lit = vL.x * scudShade(vW), sunny = clamp(dot(N, uSunDir) * .5 + .5, 0., 1.), fwd = pow(max(dot(-V, uSunDir), 0.), 4.), thick = cyl * dens;
        float heart = 1. - mix(.15, .45, core) * smoothstep(.2, .6, thick), crest = smoothstep(.36, .66, st * .6 + st2 * .4);
        vec3 col = (uSkyCol * 1.15 + vec3(.03, .04, .055)) * (.8 + .2 * N.y)
                 + uSunCol * lit * ((.72 + .42 * sunny) * heart * (.62 + .45 * crest) + fwd * (1. - thick) * .8 + crest * crest * crest * sunny * .3);   // (brighter than the veils it runs in)
        float bw = dot(V, uSunDir), bow = smoothstep(.722, .74, bw) * (1. - smoothstep(.766, .784, bw)) * lit * e;
        col += vec3(1. - smoothstep(.738, .758, bw), 1. - smoothstep(0., .015, abs(bw - .752)), smoothstep(.746, .766, bw)) * bow * .7 * uSunCol;
        #ifdef USE_FOG
          col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
        gl_FragColor = vec4(col * al, al);
      }` });
}

// ---------- the drops the banner breaks into: each a short bright dash that flies on down the wind and falls out in an arc ----------
// One small quad each, drawn out along its own way and turned to the eye's place (never thinner than a pixel and a
// third, and fainter by as much). iP: where it leaves the banner; iV: its speed there (m/s); iD: the gale's run at the
// fall, where in its round it is at time 0, the seconds of one flight, seed; iE: metres along the banner from the rim
// at which it leaves, its size (m), the sun's share, how fast it falls (m/s2). It is there only if its fall was failing
// when its water left the rim and is failing still.
function dropMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec3 iP, iV; attribute vec4 iD, iE;
      uniform float uPx, uTime;
      ${GLSL_GALE}
      varying vec2 vUv; varying vec3 vW; varying vec3 vS;
      #include <fog_pars_vertex>
      void main(){
        float age = fract(iD.y + uTime / iD.z), t = age * iD.z, tau = galeTauRun(iD.x), speed = .5 / (uGale.z * uGale.y);
        float str = galeFail(tau - iE.x * .5 / speed - t) * galeFail(tau) * smoothstep(0., .1, age) * (1. - smoothstep(.65, 1., age));
        vec3 c = iP + iV * t - vec3(0., .5 * iE.w, 0.) * t * t, vel = iV - vec3(0., iE.w, 0.) * t;
        vec3 toEye = cameraPosition - c; float dist = length(toEye), sp = max(length(vel), 1e-3);
        vec3 along = vel / sp, ax = normalize(cross(along, toEye) + vec3(1e-5, 0., 0.));
        float wd = max(iE.y, dist * uPx * .65) * step(.004, str), len = wd * 2.6;
        vec3 pos = c + along * position.y * len + ax * position.x * wd;
        vUv = position.xy; vW = pos; vS = vec3(str * min(1., iE.y / max(wd, 1e-4) + .35), iE.z, iD.w);
        vec4 mvPosition = viewMatrix * vec4(pos, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW; varying vec3 vS;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main(){
        // a round soft bead at its head, a short thin streak behind it along its flight
        float yy = (vUv.y - .55) * 2.6, bead = 1. - smoothstep(.2, 1., vUv.x * vUv.x + yy * yy);
        float tail = (1. - smoothstep(.12, .7, abs(vUv.x))) * smoothstep(-1., .3, vUv.y) * (1. - step(.55, vUv.y)) * .45;
        float a = max(bead, tail) * vS.x;
        vec3 V = normalize(cameraPosition - vW);
        float lit = vS.y * scudShade(vW), fwd = pow(max(dot(-V, uSunDir), 0.), 4.);
        vec3 col = uSkyCol * 1.25 + vec3(.04, .05, .07) + uSunCol * lit * (.8 + 1.2 * fwd);
        #ifdef USE_FOG
          col = mix(col, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
        gl_FragColor = vec4(col * a, a);
      }` });
}

// ---------- the build ----------
// opts: falls [{ x, z (the lip), top, foot (heights), width, long, out: [x, z] (toward the lake), tan: [x, z] (along the wall),
// px, pz (where it meets its pool), face(lat, y, o) (the place on the rock face `lat` metres along the wall from the fall's
// line at height y), seep (a thread of a fall: fewer and smaller strands, puffs, filaments and drops) }], gale, light
// (the world's shared uniforms: tNoise, uGale, uTime, uSunDir, uSunCol, uSkyCol, uBounce,
// uScud), fog (a maker of fog uniforms), wind [x, z] (unit), clearOf(x, y, z) (metres to the flown line), sunAt(x, y, z)
// (the sun's share at a place in the air, 0 in the rock's shade .. 1), smoke [[x, z, size]] (places on the open lake
// where spray smoke rises as the gust front passes), fov (the world's own field of view, degrees), detail (the share of
// the mist's puffs and of the drops to make, 0..1; the draws are all taken on every level), rng (the falling water's
// stream), ropeRng (the blown water's own stream, for the ways off the rim, the filaments and the drops: the world must
// hand it), yield
export async function buildHero(ctx, opts = {}) {
  const group = new THREE.Group();
  const gale = opts.gale || makeGale({});
  const falls = opts.falls || [], wind = opts.wind || [0.62, -0.785], LUn = opts.light || {}, rng = opts.rng || ctx.rng.fork('hero');
  const fogU = opts.fog || (() => THREE.UniformsUtils.clone(THREE.UniformsLib.fog)), clearOf = opts.clearOf || (() => 1e9), sunAt = opts.sunAt || (() => 1);
  const shared = { tNoise: LUn.tNoise, uGale: gale.uniform, uTime: LUn.uTime, uSunDir: LUn.uSunDir, uSunCol: LUn.uSunCol, uSkyCol: LUn.uSkyCol, uBounce: LUn.uBounce, uScud: LUn.uScud };
  const uPx = { value: 0.0016 }, facts = { mistClear: Infinity, puffs: 0, strandClear: Infinity, ropeClear: Infinity, ropes: 0, drops: 0 };
  // the share of a fall's height that always pours: under it the gust has the water (the column's kink stands there while it blows)
  const keepOf = (f) => f.long ? 0.7 : f.seep ? 0.5 : 0.6;
  const ledges = [];                                                 // where the long fall breaks on a ledge: a burst of spray stands there

  // --- the falls (a seep fall is a few thin threads): one mesh of strands laid on the rock ---
  { const P = [], T = [], S = [], Fa = [], W = [], Lt = [], I = [], o = {}, pts = []; let sunRow = 1;
    for (const f of falls) {
      const H = f.top - f.foot, NS = f.long ? 15 : f.seep ? 3 : 5, NR = f.long ? 84 : 40, run = gale.run(f.x, f.z), keep = keepOf(f), fanK = f.long ? 0.42 : f.seep ? 0.2 : 0.45;
      const sgn = wind[0] * f.tan[0] + wind[1] * f.tan[1] >= 0 ? 1 : -1, bow = (f.long ? 0.05 : 0.075) * H;
      // (behind the strands lie a few broad thin sheets: the body of the fall, through which the rock shows)
      const NSH = f.long ? 4 : f.seep ? 1 : 2;
      for (let s = 0; s < NS + NSH; s++) {
        const sheet = s >= NS ? 1 : 0, share = sheet ? (s - NS + 0.5) / NSH : (s + 0.5) / NS, halfW = sheet ? (f.width / NSH) * 0.6 : (f.width / NS) * rng.range(0.4, 0.82);
        const lat0 = (share * 2 - 1 + rng.range(-0.1, 0.1)) * f.width * 0.5, sr = rng(), wob = rng.range(0.6, 1.5), ph = rng() * 6.283, wob2 = rng.range(1.7, 2.7), ph2 = rng() * 6.283, base = P.length / 3;
        // the strand's places down the rock, by height: the fall is a braid; its strands spread as they come down and
        // wander across one another, parting and meeting, with the wet rock showing between them
        pts.length = 0;
        for (let j = 0; j <= NR; j++) { const t = j / NR, lat = lat0 * (1 + fanK * t) + (Math.sin(t * 7 * wob + ph) * 0.11 + Math.sin(t * 7 * wob2 + ph2) * 0.06) * sstep(0, 0.12, t) * (1 + t) * f.width * (sheet ? 0.4 : 1);
          f.face(lat, f.top - H * t, o); pts.push(o.x, o.y, o.z); facts.strandClear = Math.min(facts.strandClear, clearOf(o.x, o.y, o.z)); }
        for (let j = 0; j <= NR; j++) { const a = Math.max(0, j - 1) * 3, b = Math.min(NR, j + 1) * 3;
          let tx = pts[b] - pts[a], ty = pts[b + 1] - pts[a + 1], tz = pts[b + 2] - pts[a + 2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          const br = sat(1.25 - 1.6 * Math.abs(ty)) * sstep(0, 0.04, j / NR) ;                    // level ground under it: the water breaks
          if (f.long && !sheet && br > 0.6 && (j & 1) === 0 && s % 3 === 1 && j < NR - 4) ledges.push([pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2], j / NR < keep ? 2 : 1]);
          // (the sun's share where the water runs, a pace clear of the rock; every other row is asked, the rows between share it)
          if ((j & 1) === 0 || j === NR) sunRow = sunAt(pts[j * 3] + f.out[0] * 1.5, pts[j * 3 + 1] + 0.5, pts[j * 3 + 2] + f.out[1] * 1.5);
          for (let e = -1; e <= 1; e += 2) { P.push(pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2]); T.push(tx, ty, tz); S.push(e, j / NR, sr, br); Lt.push(sunRow);
            Fa.push(run, H, keep, halfW); W.push(f.tan[0] * sgn, f.tan[1] * sgn, bow, sheet); } }
        for (let j = 0; j < NR; j++) { const a = base + j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        if (opts.yield && (s % 3) === 2) await opts.yield();
      }
      if (opts.yield) await opts.yield();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(T, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 4));
    g.setAttribute('aF', new THREE.Float32BufferAttribute(Fa, 4)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4)); g.setAttribute('aL', new THREE.Float32BufferAttribute(Lt, 1)); g.setIndex(I);
    const m = new THREE.Mesh(g, strandMaterial({ ...fogU(), ...shared, uPx })); m.frustumCulled = false; m.renderOrder = 4; group.add(m); }
  if (opts.yield) await opts.yield();

  // --- every fall's rope line on its rock and its ONE WAY off the rim, laid first: the veils of the mist, the rope's
  // filaments and the drops all go by them, so that the blown water is one thing with one root. Their draws come from a
  // stream of their own (opts.ropeRng), so that no strand or puff of the falling water moves. THE WORLD MUST HAND
  // ropeRng: the fall-back below forks the water's stream, and a fork takes one draw of its parent, which would move
  // every puff's draw ---
  const rr = opts.ropeRng || rng.fork('rope'), perp = [-wind[1], wind[0]], frames = new Map();
  { const o = {}, c = {};
    for (const f of falls) {
      const H = f.top - f.foot, keep = keepOf(f), run = gale.run(f.x, f.z), sgn = wind[0] * f.tan[0] + wind[1] * f.tan[1] >= 0 ? 1 : -1, fanK = f.long ? 0.42 : f.seep ? 0.2 : 0.45;
      const big = f.long ? 1.8 : f.seep ? 0.5 : 1, NSr = f.long ? 18 : f.seep ? 4 : 10, nRock = f.long ? 44 : f.seep ? 16 : 20, nBan = f.long ? 30 : f.seep ? 12 : 18, NRr = nRock + nBan;
      // the rope's own line: beside the column at the kink (D0 metres downwind of the fall's line), leaning to latTop at the rim
      // (it climbs clear of the column, on the wet rock beside it: D0 is the column's downwind edge at the kink and a little more)
      const yk = f.top - H * keep, D0 = f.width * 0.5 * (1 + fanK * keep) + (f.long ? 3 : f.seep ? 0.75 : 3), latTop = D0 + (f.seep ? 2.5 : Math.min(26, Math.max(8, 0.09 * H))), yTop = f.top - 0.3;
      const girth = (y) => (1.5 + 2.6 * sat((y - yk) / (f.top - yk))) * big, yBot = Math.max(f.foot + 1, f.top - H * (keep + 0.12)), rowY = (j) => yBot + (yTop - yBot) * (j / nRock);   // (the rope is laid from a little under the kink's highest place: lower down no gust ever shows it for long)
      // how far downwind of the fall's line the chute's own rock runs at each row's height, before the alcove's side
      // stands 4 m out of it (asked of the rock every 2 m along the wall, then every half metre over the last two): the
      // rope keeps to the chute
      const room = [], stands = (lat, y) => { f.face(sgn * lat, y, o); return (o.x - c.x) * f.out[0] + (o.z - c.z) * f.out[1] > 4; };
      for (let j = 0; j <= nRock; j++) { const y = rowY(j); f.face(0, y, c); let lat = 2;
        for (; lat <= 60; lat += 2) if (stands(lat, y)) break;
        let fine = lat - 2; if (lat <= 60) for (let l = lat - 1.5; l < lat; l += 0.5) { if (stands(l, y)) break; fine = l; }
        room.push(fine); if (opts.yield && (j & 7) === 7) await opts.yield(); }
      // (this pass runs in place, from the lowest row up: each row ends with the least of every row below it and the one
      // above it, so that one narrow place low on the chute holds the rope in all the way up)
      for (let j = 0; j <= nRock; j++) room[j] = Math.min(room[Math.max(0, j - 1)], room[j], room[Math.min(nRock, j + 1)]);
      const axis = (y) => { const jf = sat((y - yBot) / (yTop - yBot)) * nRock, j0 = Math.min(nRock - 1, Math.floor(jf)), rm = mix(room[j0], room[j0 + 1], jf - j0);
        return sgn * Math.max(Math.min(D0 + (latTop - D0) * Math.pow(sat((y - yk) / (f.top - yk)), 1.15), rm - girth(y)), f.width * 0.25); };
      // the way off the rim: straight on up for `up` metres, then over and away down the wind for `reach`, rising still:
      // a shore or bench fall's banner goes some 45 to 75 m (it is seen for 30 to 60 of them), the long fall's twice as far
      const way = { up: rr.range(14, 24) * (f.long ? 2.2 : f.seep ? 0.6 : 1), reach: rr.range(46, 70) * (f.long ? 2 : f.seep ? 0.5 : 1), rise: rr.range(0.4, 0.7) + (f.long ? 0.1 : 0), side: rr.range(-6, 6) * big, rim: [0, 0, 0] };
      f.face(axis(yTop), yTop, o); way.rim[0] = o.x + f.out[0]; way.rim[1] = yTop; way.rim[2] = o.z + f.out[1];
      frames.set(f, { H, keep, run, sgn, fanK, big, NSr, nRock, nBan, NRr, yk, yTop, yBot, girth, rowY, axis, way });
      if (opts.yield) await opts.yield(); }
    // (four draws of this stream are passed over here, between the ways off the rim and the filaments; the deal of
    // every filament and drop stands on them)
    for (let i = 0; i < 4; i++) rr(); }

  // --- the mist: one instanced mesh of puffs, many and small and thin. Every puff takes its draws; one whose whole
  // track would not keep 25 m of clear air from the flown line is not made, and what stands within 110 m of the line is
  // thinned by that distance to a veil: by its place against the ROUTE, never by where the eye is. On a low graphics
  // level a share of the puffs is left out (opts.detail), the draws all taken as ever ---
  const detail = opts.detail ?? 1; let mistMesh = null;
  { const P0 = [], P1 = [], P2 = [], P3 = [], M = [], N = [], Ls = [], a = {}, b = {}, c = {};
    // (tone: the share of the sun a veil keeps by its place in its plume: the sunward and upper side of a plume is lit,
    // its heart and under side keep more of the sky's blue-grey)
    const sd = LUn.uSunDir ? LUn.uSunDir.value : { x: 0, z: 0 }, sunSide = sd.x * perp[0] + sd.z * perp[1] >= 0 ? 1 : -1;
    const add = (p0, p1, p2, p3, run, ph, size, rate, seed, str, swell, kind, sun = -1, tone = 1) => { let near = Infinity;
      if (seed >= detail) return;
      for (let i = 0; i <= 4; i++) { const t = i / 4, k = 1 - t, w0 = k * k * k, w1 = 3 * k * k * t, w2 = 3 * k * t * t, w3 = t * t * t;
        near = Math.min(near, clearOf(p0[0] * w0 + p1[0] * w1 + p2[0] * w2 + p3[0] * w3, p0[1] * w0 + p1[1] * w1 + p2[1] * w2 + p3[1] * w3, p0[2] * w0 + p1[2] * w1 + p2[2] * w2 + p3[2] * w3) - size * (0.55 + swell * t) * (kind === 4 ? 0.22 : kind < 0.5 ? 2.7 : 2)); }   // (a wisp reaches 1.7 sizes along its way, a veil 2.4, and steps 0.3 toward the eye; lake smoke lies low: only its thickness counts)
      if (near <= 25) return;
      facts.mistClear = Math.min(facts.mistClear, near); facts.puffs++;
      P0.push(p0[0], p0[1], p0[2]); P1.push(p1[0], p1[1], p1[2]); P2.push(p2[0], p2[1], p2[2]); P3.push(p3[0], p3[1], p3[2]); M.push(run, ph, size, rate); N.push(seed, str * (0.3 + 0.7 * sstep(25, 110, near)), swell, kind);
      // the sun's share at the start of the track, a third and two thirds of the way along it, and at its end
      for (let i = 0; i < 4; i++) { if (sun >= 0) { Ls.push(sun); continue; } const t = i / 3, k = 1 - t, w0 = k * k * k, w1 = 3 * k * k * t, w2 = 3 * k * t * t, w3 = t * t * t;
        Ls.push(tone * sunAt(p0[0] * w0 + p1[0] * w1 + p2[0] * w2 + p3[0] * w3, p0[1] * w0 + p1[1] * w1 + p2[1] * w2 + p3[1] * w3 + 2, p0[2] * w0 + p1[2] * w1 + p2[2] * w2 + p3[2] * w3)); } };
    for (const f of falls) {
      // (a seep fall is a thread: a third of the puffs, each smaller)
      const H = f.top - f.foot, run = gale.run(f.x, f.z), keep = keepOf(f), big = f.long ? 1.5 : f.seep ? 0.6 : 1, sgn = wind[0] * f.tan[0] + wind[1] * f.tan[1] >= 0 ? 1 : -1, few = f.seep ? 0.3 : 1, small = f.seep ? 0.6 : 1;
      // the banner: veils of spray torn off the failing strands, up the wet chute round the rope, clear of the rim, and
      // away along the fall's own way down the wind, rising as it goes: the sheath the rope's filaments run inside
      const F = frames.get(f), WY = F.way, wb = [WY.rim[0] + f.out[0] * 3, WY.rim[1] + WY.up, WY.rim[2] + f.out[1] * 3];
      const we = [WY.rim[0] + wind[0] * WY.reach + perp[0] * WY.side, WY.rim[1] + WY.up * 0.9 + WY.rise * WY.reach, WY.rim[2] + wind[1] * WY.reach + perp[1] * WY.side];
      for (let i = 0, n = f.long ? 230 : Math.round(116 * few); i < n; i++) {
        const t0 = mix(keep + 0.04, 1, Math.pow(rng(), 0.8)), lat0 = rng.range(-0.5, 0.5) * f.width * (1 + 0.45 * t0), drift = sgn * rng.range(4, 16) * big, size = rng.range(4.6, 7.8) * (f.long ? 1.8 : small);
        const rate = 1 / rng.range(4.5, 6), ph = rng(), seed = rng(), reach = f.long ? rng.range(70, 150) : rng.range(170, 260) * small, rise = f.long ? rng.range(30, 90) : rng.range(80, 160) * small, swell = rng.range(2.0, 3.1), side = rng.range(-18, 18);
        if (f.long) rng.range(0.1, 0.32);                                              // (one draw more for the long fall's puff; nothing reads it)
        // (a veil leaves the failing strands where it always did; from there it goes by the rope's own line up the chute
        // and by the fall's own way off the rim. How far along that way it ends (half of it to a quarter beyond it), where
        // across the plume it rides and how high, are read off the draws it always took.)
        const jit = side / 18, u1 = f.long ? (reach - 70) / 80 : (reach / small - 170) / 90, u2 = f.long ? (rise - 30) / 60 : (rise / small - 80) / 80, qE = f.long ? mix(0.7, 1.45, u1) : mix(0.5, 1.25, u1), kE = 1 - qE;   // (the long fall's go further: the largest thing in its sky)
        const y0 = f.top - H * t0, yb = Math.max(y0, F.yBot), spread = jit * (3 + 14 * qE) * F.big, lift = (u2 - 0.5) * 24 * qE * F.big, off = jit * 1.3;
        const tone = 0.55 + 0.45 * sat(0.5 + 0.35 * jit * sunSide + 0.6 * (u2 - 0.5));
        if (i % 5 < 2) {
          // two in five sheathe the rope on the rock: from the failing strands, by the rope's line, up to the rim
          const y1 = mix(yb, F.yTop, 0.4), y2 = mix(yb, F.yTop, 0.75);
          f.face(lat0, y0, a); f.face(F.axis(y1) + off * F.girth(y1), y1, b); f.face(F.axis(y2) + off * F.girth(y2), y2, c); const p2 = [c.x + f.out[0] * 2, c.y, c.z + f.out[1] * 2];
          f.face(F.axis(F.yTop) + off * F.girth(F.yTop), F.yTop, c);
          add([a.x, a.y, a.z], [b.x + f.out[0] * 2, b.y, b.z + f.out[1] * 2], p2, [c.x + f.out[0] * 3, c.y + 5 * F.big, c.z + f.out[1] * 3], run, ph, size * 0.6, rate * 1.3, seed, f.long ? 0.5 : 0.52, swell * 0.4, 0, -1, tone);
        } else {
          // three in five are the banner: from just under the rim, by the fall's own way, up and over and down the wind
          const ys = F.yTop - (2 + 10 * u2) * F.big, s3 = 2 / 3;
          f.face(F.axis(ys) + off * F.girth(ys), ys, a); const q0 = [a.x + f.out[0] * 2, a.y, a.z + f.out[1] * 2];
          const q1 = [mix(q0[0], wb[0], qE), mix(q0[1], wb[1] + (u2 - 0.5) * 8 * F.big, qE), mix(q0[2], wb[2], qE)];
          const q2 = [kE * kE * q0[0] + 2 * qE * kE * wb[0] + qE * qE * we[0] + perp[0] * spread, kE * kE * q0[1] + 2 * qE * kE * wb[1] + qE * qE * we[1] + lift, kE * kE * q0[2] + 2 * qE * kE * wb[2] + qE * qE * we[2] + perp[1] * spread];
          add(q0, [q0[0] + (q1[0] - q0[0]) * s3, q0[1] + (q1[1] - q0[1]) * s3, q0[2] + (q1[2] - q0[2]) * s3], [q2[0] + (q1[0] - q2[0]) * s3, q2[1] + (q1[1] - q2[1]) * s3, q2[2] + (q1[2] - q2[2]) * s3], q2,
            run, ph, size * (f.long ? 1.2 : 0.9), rate * (f.long ? 1.25 : 1.5), seed, f.long ? 0.6 : 0.58, swell * (f.long ? 0.9 : 0.8), 0.3, -1, tone);
        }
        if (opts.yield && (i & 31) === 31) await opts.yield();
      }
      if (opts.yield) await opts.yield();
      // where the strands come apart: a bank of mist across the fall, leaning downwind and climbing a little
      for (let i = 0, n = f.long ? 84 : Math.round(22 * few); i < n; i++) {
        const t0 = keep + rng.range(-0.02, 0.2), lat0 = rng.range(-0.6, 0.6) * f.width * (1 + 0.5 * t0), drift = sgn * rng.range(10, 30) * big, size = rng.range(4.6, 8) * (f.long ? 1.7 : small);
        const rate = 1 / rng.range(3, 5), ph = rng(), seed = rng(), rise = rng.range(0.03, 0.09) * H, swell = rng.range(1.0, 1.7);
        f.face(lat0, f.top - H * t0, a); f.face(lat0 + drift * 0.5, f.top - H * t0 + rise * 0.5, b); f.face(lat0 + drift, f.top - H * t0 + rise, c);
        add([a.x, a.y, a.z], [(a.x * 2 + b.x) / 3, (a.y * 2 + b.y) / 3, (a.z * 2 + b.z) / 3], [b.x, b.y, b.z], [c.x, c.y, c.z], run, ph, size * 0.6, rate, seed, f.long ? 0.34 : 0.3, swell * 0.6, 3);   // (a low bank: the plume is the veils')
      }
      if (opts.yield) await opts.yield();
      // standing at the foot: a cloud of mist that billows up and leans down the wall with the wind
      for (let i = 0, n = f.long ? 120 : Math.round(30 * few); i < n; i++) {
        const lat = rng.range(-0.6, 0.6) * f.width * (f.long ? 1.5 : 1.2), outK = rng.range(1, 7) * big, size = rng.range(4.6, 8.4) * (f.long ? 1.8 : small), rate = 1 / rng.range(3.5, 6), ph = rng(), seed = rng();
        const up = rng.range(14, 30) * (f.long ? 2.2 : 1), dw = rng.range(8, 22) * big, swell = rng.range(1.0, 1.8);
        const x0 = f.px + f.tan[0] * lat + f.out[0] * outK, z0 = f.pz + f.tan[1] * lat + f.out[1] * outK, y0 = f.foot + 1.5, dx = f.tan[0] * sgn * 0.85 + f.out[0] * 0.3, dz = f.tan[1] * sgn * 0.85 + f.out[1] * 0.3;
        add([x0, y0, z0], [x0 + dx * dw * 0.2, y0 + up * 0.45, z0 + dz * dw * 0.2], [x0 + dx * dw * 0.55, y0 + up * 0.8, z0 + dz * dw * 0.55], [x0 + dx * dw, y0 + up, z0 + dz * dw], run, ph, size, rate, seed, f.long ? 0.38 : 0.3, swell, 1);
      }
    }
    // the bursts where the long fall breaks on its ledges
    { const f = falls.find((v) => v.long), run = f ? gale.run(f.x, f.z) : 0;
      for (let i = 0; f && i < Math.min(40, ledges.length); i++) { const p = ledges[Math.floor((i * ledges.length) / Math.min(40, ledges.length))], size = rng.range(4, 7.5), rate = 1 / rng.range(2.2, 3.6), ph = rng(), seed = rng();
        const x0 = p[0] + f.out[0] * 1.5, z0 = p[2] + f.out[1] * 1.5;
        add([x0, p[1], z0], [x0 + f.out[0] * 2, p[1] + 3, z0 + f.out[1] * 2], [x0 + f.out[0] * 3, p[1] + 6, z0 + f.out[1] * 3], [x0 + f.out[0] * 4, p[1] + 9, z0 + f.out[1] * 4], run, ph, size, rate, seed, 0.3, 1.3, p[3]); } }
    if (opts.yield) await opts.yield();
    // spray smoke on the open lake: each puff lies low over its own place of the water and drifts a little way down the
    // wind; it is there only while the gust front is passing that place
    for (const [x, z, size] of opts.smoke || []) { const reach = rng.range(22, 46), up = rng.range(1.5, 5), rate = 1 / rng.range(2.4, 3.6), ph = rng(), seed = rng(), y = size * 0.13;
      add([x, y, z], [x + wind[0] * reach * 0.33, y + up * 0.4, z + wind[1] * reach * 0.33], [x + wind[0] * reach * 0.66, y + up * 0.8, z + wind[1] * reach * 0.66], [x + wind[0] * reach, y + up, z + wind[1] * reach],
        gale.run(x, z), ph, size, rate, seed, 0.24, 0.9, 4, 1); }
    const g = new THREE.PlaneGeometry(2, 2), n = M.length / 4, ia =(arr, k) => new THREE.InstancedBufferAttribute(new Float32Array(arr), k);
    g.setAttribute('iP0', ia(P0, 3)); g.setAttribute('iP1', ia(P1, 3)); g.setAttribute('iP2', ia(P2, 3)); g.setAttribute('iP3', ia(P3, 3)); g.setAttribute('iM', ia(M, 4)); g.setAttribute('iN', ia(N, 4)); g.setAttribute('iL', ia(Ls, 4));
    if (n) { mistMesh = new THREE.InstancedMesh(g, mistMaterial({ ...fogU(), ...shared }), n); mistMesh.frustumCulled = false; mistMesh.renderOrder = 5; group.add(mistMesh); } }
  if (opts.yield) await opts.yield();
  // --- the climbing water: a rope up every fall's chute and a banner off its rim, and the drops the banner breaks into.
  // They go by the line and the way laid for each fall above, on the same stream of draws. A filament or a drop whose
  // whole way would not keep 25 m of clear air from the flown line is not made ---
  let dropMesh = null;
  { const P = [], T = [], Nn = [], S = [], Fa = [], W = [], G = [], I = [], o = {}, c = {}, row = [], suns = [];
    const dP = [], dV = [], dD = [], dE = [], front = gale.wave / gale.period;
    const bez = (p0, p1, p2, q, out) => { const k = 1 - q; for (let i = 0; i < 3; i++) out[i] = k * k * p0[i] + 2 * q * k * p1[i] + q * q * p2[i]; return out; };
    for (const f of falls) {
      const { H, keep, run, sgn, fanK, big, NSr, nRock, nBan, NRr, yk, yTop, girth, rowY, axis, way } = frames.get(f);
      // one filament's or drop's own way off the rim: the fall's way, strayed from by a share v (the drops stray widest)
      const away = (p0, far, v) => { const hUp = way.up * (1 + v * rr.range(-0.5, 0.5)), reach = way.reach * far * (1 + v * rr.range(-0.5, 0.4)), rise = way.rise * (1 + v * rr.range(-0.6, 0.6)) * reach, side = way.side + v * rr.range(-12, 12) * big;
        return [[p0[0] + f.out[0] * 3, p0[1] + hUp, p0[2] + f.out[1] * 3], [p0[0] + wind[0] * reach + perp[0] * side, p0[1] + hUp * 0.9 + rise, p0[2] + wind[1] * reach + perp[1] * side], hUp + reach]; };
      // the filaments: many and thin, each twisting round the rope's line on a radius and at a pace of its own, so that
      // they cross and part; each goes its own length of the way off the rim (a third of it to all of it) and no further
      // (no bend of a filament is shorter than six of its own rows on the rock, so that it runs in curves, not in corners)
      const dyr = Math.abs(rowY(nRock) - rowY(0)) / nRock, k2 = Math.min(0.47 / big, 6.2832 / (8 * dyr)), k3 = Math.min(0.83 / big, 6.2832 / (6 * dyr));
      for (let s = 0; s < NSr; s++) {
        if (opts.yield && (s & 1) === 1) await opts.yield();                    // (every pass reaches it, made or not)
        const core = 0, ph = (s / NSr) * 6.283 + rr.range(-0.5, 0.5), lam = Math.max(rr.range(26, 50) * big, 9 * dyr), ph2 = rr() * 6.283, ph3 = rr() * 6.283, rs = rr.range(0.25, 1.5), wide = rr.range(0.7, 1.4), share = (s + 0.5) / NSr, len = rr.range(0.35, 1);
        row.length = 0; let m = 0, near = Infinity, sun = 1, p1 = null, p2 = null, mRim = 0; const p0 = [0, 0, 0], q = [0, 0, 0];
        for (let j = 0; j <= NRr; j++) { let x, y, z, e = 0, hw, dx = 0, dz = 0, tRow;
          if (j <= nRock) { y = rowY(j); tRow = (f.top - y) / H; const up = sat((y - yk) / (f.top - yk)), tw = (6.2832 * (y - f.foot)) / lam + ph;
            f.face(axis(y) + girth(y) * (rs * Math.sin(tw) + 0.3 * Math.sin((y - f.foot) * k2 + ph2) + 0.17 * Math.sin((y - f.foot) * k3 + ph3)), y, o); const lift = 0.4 + 0.3 * girth(y) * (0.5 + 0.5 * Math.cos(tw));
            x = o.x + f.out[0] * lift; z = o.z + f.out[1] * lift; hw = (0.2 + 0.3 * up) * big * wide;
            f.face((share - 0.5) * f.width * 0.85 * (1 + fanK * tRow), y, c); dx = c.x - o.x; dz = c.z - o.z;
            if (j === nRock) { p0[0] = x; p0[1] = y; p0[2] = z; const w = away(p0, 1, 0.5); p1 = w[0]; p2 = w[1]; } }
          else { e = (j - nRock) / nBan; bez(p0, p1, p2, e * len, q); x = q[0]; y = q[1]; z = q[2]; hw = (0.5 - 0.3 * e) * big * wide; }
          if (j > 0) { const k = (j - 1) * 9; m += Math.hypot(x - row[k], y - row[k + 1], z - row[k + 2]); } if (j === nRock) mRim = m;
          tRow = j <= nRock ? tRow : -(m - mRim) / H;
          if ((j & 1) === 0 || j === NRr) sun = sunAt(x + f.out[0] * 1.5, y + 0.5, z + f.out[1] * 1.5);
          near = Math.min(near, clearOf(x, y, z) - hw - (0.3 + 5.5 * e) * 1.2 * big);
          row.push(x, y, z, m, hw, tRow, e, dx, dz); suns[j] = sun; }
        if (near <= 25) continue;
        facts.ropeClear = Math.min(facts.ropeClear, near); facts.ropes++;
        const base = P.length / 3;
        for (let j = 0; j <= NRr; j++) { const k = j * 9, ka = Math.max(0, j - 1) * 9, kb = Math.min(NRr, j + 1) * 9;
          let tx = row[kb] - row[ka], ty = row[kb + 1] - row[ka + 1], tz = row[kb + 2] - row[ka + 2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          const onRock = j <= nRock, nx = onRock ? f.tan[0] * sgn : perp[0], nz = onRock ? f.tan[1] * sgn : perp[1];
          for (let sd = -1; sd <= 1; sd += 2) { P.push(row[k], row[k + 1], row[k + 2]); T.push(tx, ty, tz); Nn.push(nx, 0, nz); S.push(sd, big, rs + ph, core);
            Fa.push(run, row[k + 3], row[k + 4], keep); W.push(row[k + 7], 0, row[k + 8], suns[j]); G.push(row[k + 5], Math.max(0, row[k + 3] - mRim), row[k + 6], sat(j / 3)); } }
        for (let j = 0; j < NRr; j++) { const a = base + j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      // the drops: each leaves a way off the rim somewhere along it, at the water's speed there, and falls out
      // (in thousands: some 380 to a bench fall, 2,200 to the long fall; thickest near the rim. Every drop of the full
      // count takes its draws whatever the graphics level; on a lower level only its share of them is made, as the
      // puffs' law has it, so that the deal of every later fall is the same on every level)
      for (let i = 0, n = f.long ? 2200 : f.seep ? 90 : 380; i < n; i++) { const y = yTop, p0 = [0, 0, 0], q = [0, 0, 0], q2 = [0, 0, 0];
        if (opts.yield && (i & 31) === 31) await opts.yield();                  // (every pass reaches it, made or not)
        f.face(axis(y) + girth(y) * rr.range(-1, 1), y, o); p0[0] = o.x + f.out[0]; p0[1] = y; p0[2] = o.z + f.out[1];
        const w = away(p0, 1, 1), q0 = 0.04 + 0.96 * Math.pow(rr(), 1.5), sp = rr.range(0.4, 0.8) * 0.5 * front * (f.seep ? 0.55 : 1), life = rr.range(1.3, 2.4) * (f.seep ? 0.7 : 1), g = rr.range(5, 9), size = rr.range(0.22, 0.5) * (f.long ? 1.4 : f.seep ? 0.7 : 1), php = rr(), seed = rr(), vu = rr.range(-2, 6) * (f.seep ? 0.5 : 1), vs = rr.range(-5, 5) * (f.seep ? 0.5 : 1);
        if (seed >= detail) continue;
        bez(p0, w[0], w[1], q0, q); bez(p0, w[0], w[1], Math.min(1, q0 + 0.02), q2); let tx = q2[0] - q[0], ty = q2[1] - q[1], tz = q2[2] - q[2]; const tl = Math.hypot(tx, ty, tz) || 1;
        // (it leaves along the banner's run there and the gale has it at once: more than half its speed is down the wind)
        const vx = (tx / tl) * sp * 0.7 + wind[0] * sp * 0.55 + perp[0] * vs, vy = (ty / tl) * sp * 0.7 + vu, vz = (tz / tl) * sp * 0.7 + wind[1] * sp * 0.55 + perp[1] * vs; let near = Infinity;
        for (let k = 0; k <= 4; k++) { const t = (life * k) / 4; near = Math.min(near, clearOf(q[0] + vx * t, q[1] + vy * t - 0.5 * g * t * t, q[2] + vz * t) - 1); }
        if (near <= 25) continue; facts.ropeClear = Math.min(facts.ropeClear, near); facts.drops++;
        dP.push(q[0], q[1], q[2]); dV.push(vx, vy, vz); dD.push(run, php, life, seed); dE.push(q0 * w[2], size, sunAt(q[0], q[1], q[2]), g); }
      if (opts.yield) await opts.yield();
    }
    const g = new THREE.BufferGeometry(), fa = (arr, k) => new THREE.Float32BufferAttribute(arr, k);
    g.setAttribute('position', fa(P, 3)); g.setAttribute('aTan', fa(T, 3)); g.setAttribute('aN', fa(Nn, 3)); g.setAttribute('aS', fa(S, 4));
    g.setAttribute('aF', fa(Fa, 4)); g.setAttribute('aW', fa(W, 4)); g.setAttribute('aG', fa(G, 4)); g.setIndex(I);
    const m = new THREE.Mesh(g, ropeMaterial({ ...fogU(), ...shared, uPx })); m.frustumCulled = false; m.renderOrder = 6; group.add(m);
    const dg = new THREE.BufferGeometry(), nd = dD.length / 4, ia = (arr, k) => new THREE.InstancedBufferAttribute(new Float32Array(arr), k);
    // (one triangle a drop: its bead and streak are drawn in the corner square of it)
    dg.setAttribute('position', fa([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); dg.setAttribute('iP', ia(dP, 3)); dg.setAttribute('iV', ia(dV, 3)); dg.setAttribute('iD', ia(dD, 4)); dg.setAttribute('iE', ia(dE, 4));
    if (nd) { dropMesh = new THREE.InstancedMesh(dg, dropMaterial({ ...fogU(), ...shared, uPx }), nd); dropMesh.frustumCulled = false; dropMesh.renderOrder = 7; group.add(dropMesh); }
  }
  if (opts.yield) await opts.yield();
  // how much of the world one pixel covers a metre away, from the world's own field of view (opts.fov, degrees) and the
  // height of the drawing buffer: the strands are never drawn thinner than that
  const buf = new THREE.Vector2(), tanHalf = Math.tan(((opts.fov ?? 60) * Math.PI) / 360);
  return {
    object: group, radius: 1400, height: 700, center: new THREE.Vector3(300, 250, -700), anchors: {}, uniforms: shared, gale, facts,
    update(dt, time) {
      gale.set(time);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(buf); uPx.value = (2 * tanHalf) / Math.max(1, buf.y); }
    },
    // (the mist's instanced mesh is this part's to release)
    dispose() { if (mistMesh) mistMesh.dispose(); if (dropMesh) dropMesh.dispose(); }, ground: false, groundY: 0,
  };
}
